import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAuthToken from '@salesforce/apex/TessaAiController.getAuthToken';
import USER_ID from '@salesforce/user/Id';
import TESSA_LOGO from '@salesforce/resourceUrl/TessaLogo';
import TYPEAHEAD_INDEX from '@salesforce/resourceUrl/tessaTypeahead';

const STORAGE_KEY_TOKEN    = 'tessa_ai_token';
const STORAGE_KEY_ASK_SEEN = 'tessa_ai_ask_seen';

const STORAGE_KEY_HISTORY  = 'tessa_ai_history';
const STORAGE_KEY_SETTINGS = 'tessa_ai_settings';
const MAX_HISTORY_MESSAGES = 100;
const MAX_TABLE_ROWS       = 2000;   // table scrolls; no client-side truncation

const SYNONYMS = {
    staff:       ['employee','employees','worker','workers','team','caregiver',
                  'carer','carers','personnel','staffing'],
    participant: ['client','clients','resident','residents','consumer',
                  'consumers','customer','member','members'],
    facility:    ['site','sites','office','offices','location','locations',
                  'branch','branches','centre','center'],
    funds:       ['funding','money','budget','budgets','payment','payments',
                  'balance','finance','financial','allocation'],
    shift:       ['roster','rosters','rostered','schedule','scheduled','duty','duties'],
    leave:       ['holiday','holidays','absence','absent','vacation','sick'],
    invoice:     ['invoices','bill','bills','billing','receivable','receivables',
                  'outstanding','unpaid','overdue'],
    cancelled:   ['cancel','cancellation','cancellations'],
};
const SYNONYM_TERM = {};
for (const c of Object.keys(SYNONYMS)) {
    SYNONYM_TERM[c] = c;
    for (const w of SYNONYMS[c]) SYNONYM_TERM[w] = c;
}

export default class TessaAiChat extends LightningElement {
    @track messages       = [];
    @track currentMessage = '';
    @track isListening      = false;
    @track suggestions      = [];
    @track showSuggestions  = false;
    _suggestIndex      = [];
    _recognition       = null;
    _finalTranscript   = '';
    settingsVoiceAutoSend = true;
    _activeSuggestion  = -1;
    _abortController   = null;
    _requestSeq        = 0;
    _thinkTimers       = [];
    @track thinkingLabel = 'Thinking';
    @track streamingMessageId = null;
    @track isThinking     = false;
    @track isLoading      = true;
    @track connected      = false;
    @track showBatchTools = false;
    @track showSettings   = false;
    @track uploadProgress = '';
    @track batchType      = 'participant';
    @track suggestedPrompts = [];
        @track showQuestions      = false;
    @track questionCategories = [];
    @track questionFilter     = '';
    @track expandedCategoryId = null;
    @track _faqStatsVersion   = 0;
    _catShown  = {};
    _faqUsage  = {};
    _faqRecent = [];
    @track askPulse           = true;

    @track currentInput = null;
    @track selectFilter = '';      // search text for a large single-select
    selectPicked = null;
    @track dynamicInputValue = '';
    @track multiSelected     = [];
    @track multiFilter       = '';
    @track addressStreet = '';
    @track addressCity = '';
    @track addressProvince = '';
    @track addressPostalCode = '';
    @track addressCountry = 'AU';

    settingsSaveHistory    = true;
    settingsStreamReply    = true;   // word-by-word reveal of new answers
    settingsShowSuggestions = true;
    logoUrl = TESSA_LOGO;

    // Base URL for the Tessa backend. Set per environment in App Builder.
    // PROD: https://tesseractapps.com/tessa-ai-prod
    // UAT : https://tesseractapps.com/tessa-ai
    @api apiBaseUrl = 'https://tesseractapps.com/tessa-ai-prod';

    authToken = null;
    userInfo  = null;
    messageIdCounter = 0;
    @track activeAiSession = false;

    connectedCallback() {
        this.loadSettings();
        this.loadSuggestedPrompts();
        // loadTypeaheadIndex() moved below: the FAQ endpoint needs the
        // auth token, which initAuth() has not set yet.
        this.initAuth();
    }

    disconnectedCallback() {
        // Don't leave the microphone open, or timers running, on teardown.
        this.stopVoiceInput();
        this.stopThinking();
    }

    // ── Voice input (Web Speech API) ───────────────────────────────
    get micButtonClass() {
        return this.isListening
            ? 'action-circle-btn mic-listening'
            : 'action-circle-btn';
    }

    get micTitle() {
        if (!this.speechSupported) return 'Voice input not supported in this browser';
        return this.isListening ? 'Stop listening' : 'Voice input';
    }

    get speechSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    toggleVoiceInput() {
        if (!this.speechSupported) {
            this.addMessage(
                'Voice input needs Chrome, Edge or Safari over HTTPS. ' +
                'You can still type your question.', 'bot', null);
            return;
        }
        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        try {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            const rec = new SR();
            rec.lang = 'en-AU';
            rec.continuous = false;
            rec.interimResults = true;
            rec.maxAlternatives = 1;

            this._finalTranscript = '';

            rec.onstart = () => { this.isListening = true; };

            rec.onresult = (event) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const chunk = event.results[i][0].transcript;
                    if (event.results[i].isFinal) this._finalTranscript += chunk;
                    else interim += chunk;
                }
                // Live feedback in the composer as the user speaks.
                const text = (this._finalTranscript + interim).trim();
                this.currentMessage = text;
                const ta = this.template.querySelector('.chat-input');
                if (ta) ta.value = text;
                this.updateSuggestions(text);
            };

            rec.onerror = (event) => {
                this.isListening = false;
                const err = event && event.error;
                if (err === 'not-allowed' || err === 'service-not-allowed') {
                    this.addMessage(
                        'Microphone access was blocked. Allow it in your browser’s ' +
                        'site settings, then tap the mic again.', 'bot', null);
                } else if (err === 'no-speech') {
                    this.addMessage('I didn’t catch anything — tap the mic and try again.',
                                    'bot', null);
                }
            };

            rec.onend = () => {
                this.isListening = false;
                this._recognition = null;
                const finalText = (this._finalTranscript || '').trim();
                // Auto-send when we captured something and voice auto-send is on.
                if (finalText && this.settingsVoiceAutoSend !== false) {
                    this.currentMessage = finalText;
                    this.hideSuggestions();
                    this.handleSend();
                } else if (finalText) {
                    const ta = this.template.querySelector('.chat-input');
                    if (ta) ta.focus();
                }
            };

            this._recognition = rec;
            rec.start();
        } catch (e) {
            this.isListening = false;
            this.addMessage('Could not start voice input: ' + e.message, 'bot', null);
        }
    }

    stopVoiceInput() {
        try {
            if (this._recognition) this._recognition.stop();
        } catch (e) {
            /* ignore */
        }
        this.isListening = false;
    }

    // ── Typeahead (question suggestions while typing) ──────────────
    async loadTypeaheadIndex() {
        // The FAQ catalogue is the ONLY source of suggestions. The previous
        // separate typeahead index contained questions that were not approved
        // FAQ entries, which is why unrelated suggestions appeared.
        try {
            const res = await this.apiCall('/chat/ai/questions', 'GET');
            const cats = (res && res.categories) || [];
            const out = [];
            for (const c of cats) {
                for (const q of (c.questions || [])) {
                    if (q && q.question) out.push({ q: q.question, cat: c.category || '' });
                }
            }
            this._suggestIndex = out;
        } catch (e) {
            // Leave suggestions off rather than guessing, but say so - a silent
            // empty index looked exactly like "suggestions are broken".
            // eslint-disable-next-line no-console
            console.warn('Tessa: suggestion index unavailable', e && e.message);
            this._suggestIndex = [];
        }
    }

    updateSuggestions(raw) {
        const q = (raw || '').trim().toLowerCase();
        if (q.length < 2 || !this._suggestIndex.length) {
            this.hideSuggestions();
            return;
        }
        const scored = [];
        for (const e of this._suggestIndex) {
            const sc = this.scoreSuggestion(e.q, q);
            if (sc > 0) scored.push({ e, score: sc });
        }
        // A create/update action is rarely what a bare noun means: typing
        // "participant" wants the list, not "Create a participant".
        const wantsAction = /\b(create|add|new|update|edit|delete|remove)\b/.test(q);
        for (const s of scored) {
            if (!wantsAction && /^(create|add|update|edit|delete|remove)\b/i.test(s.e.q)) {
                s.score -= 60;
            }
        }
        scored.sort((a, b) => b.score - a.score || a.e.q.length - b.e.q.length);
        this._activeSuggestion = -1;
        this.suggestions = scored.filter(s => s.score > 0).slice(0, 6).map((s, i) => ({
            id: 'sg_' + i, q: s.e.q, cssClass: 'suggest-item'
        }));
        this.showSuggestions = this.suggestions.length > 0;
    }

    // Ranking per spec: exact > keyword > semantic > partial.
    scoreSuggestion(question, typed) {
        const ql = (question || '').toLowerCase();
        if (!ql || !typed) return 0;
        if (ql === typed) return 1000;
        let score = 0;
        if (ql.startsWith(typed)) score += 200;
        if (ql.includes(typed))   score += 120;
        const words = ql.match(/[a-z]+/g) || [];
        const qTerms = this.expandTerms(words, ql);
        for (const tok of typed.split(/\s+/).filter(Boolean)) {
            const atStart = words.some(w => w.startsWith(tok));
            if (atStart) {
                score += 40;
                if (words.includes(tok)) score += 25;
            } else if (ql.includes(tok)) {
                score += 5;                       // mid-word only: weak
            } else {
                const c = SYNONYM_TERM[tok] || tok;
                const st = this.stemWord(tok);
                if (qTerms.has(c)) score += 30;   // semantic
                else if (st.length >= 3 && words.some(w => w.startsWith(st))) score += 15;
                else return 0;                    // nothing matched: drop it
            }
        }
        return score;
    }

    stemWord(w) {
        return (w || '').replace(/(ies|es|s)$/, '').replace(/y$/, '');
    }

    expandTerms(words, text) {
        const stems = words.map(w => this.stemWord(w));
        const out = new Set();
        for (const canon of Object.keys(SYNONYMS)) {
            if (stems.includes(this.stemWord(canon))) { out.add(canon); continue; }
            for (const w of SYNONYMS[canon]) {
                if (stems.includes(this.stemWord(w)) || text.includes(w)) {
                    out.add(canon); break;
                }
            }
        }
        return out;
    }

    selectSuggestion(event) {
        // onmousedown fires before blur — preventDefault keeps focus and stops
        // the blur handler from hiding the list before the click registers.
        if (event && event.preventDefault) event.preventDefault();
        const q = event.currentTarget.dataset.q;
        this.hideSuggestions();
        this.currentMessage = q;
        this.handleSend();
    }

    moveSuggestion(delta) {
        if (!this.showSuggestions) return;
        const n = this.suggestions.length;
        this._activeSuggestion = (this._activeSuggestion + delta + n) % n;
        this.suggestions = this.suggestions.map((s, i) => ({
            ...s, cssClass: i === this._activeSuggestion ? 'suggest-item active' : 'suggest-item'
        }));
    }

    hideSuggestions() {
        this.showSuggestions = false;
        this.suggestions = [];
        this._activeSuggestion = -1;
    }

    handleInputBlur() {
        // Delay so a mousedown/click on a suggestion is processed first.
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.setTimeout(() => this.hideSuggestions(), 150);
    }



    // ── Auth ──────────────────────────────────────
 async initAuth() {
    console.log('========== Tessa AI Authentication Started ==========');

    try {
        // Try cached token first
        const cached = sessionStorage.getItem(STORAGE_KEY_TOKEN);

        if (cached) {
            try {
                const parsed = JSON.parse(cached);

                if (parsed.expires > Date.now()) {
                    console.log('Using cached authentication token.');

                    this.authToken = parsed.token;
                    this.loadTypeaheadIndex();   // after auth
                    this.userInfo  = parsed.user;
                    this.connected = true;
                                        this.loadQuestionCatalog();

                    this.isLoading = false;

                    this.logUserContext('CACHED');
                    this.loadHistory();
                    this.showWelcome();
                    return;
                } else {
                    console.warn('Cached token has expired. Fetching fresh token...');
                    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
                }
            } catch (e) {
                console.error('Failed to parse cached token:', e);
                sessionStorage.removeItem(STORAGE_KEY_TOKEN);
            }
        }

        console.log('Requesting fresh authentication token from Apex...');

        // Fetch fresh token from Apex
        const result = await getAuthToken();
        const data   = JSON.parse(result);

        console.log('Parsed Response:', data);

        if (data.error) {
            console.error('Authentication Error:', data.error);
            throw new Error(data.error);
        }

        this.authToken = data.token;
        this.loadTypeaheadIndex();   // after auth
        this.userInfo  = data.user;
        this.connected = true;
                this.loadQuestionCatalog();

        this.isLoading = false;

        try {
    this.logUserContext('FRESH');
} catch (err) {
    console.error('logUserContext failed:', err);
}

        // Cache token (23 hours)
        const expiresIn = 23 * 60 * 60 * 1000;
        sessionStorage.setItem(
            STORAGE_KEY_TOKEN,
            JSON.stringify({
                token:   this.authToken,
                user:    this.userInfo,
                expires: Date.now() + expiresIn
            })
        );

        this.loadHistory();
        this.showWelcome();

        console.log('========== Tessa AI Authentication Completed ==========');

    } catch (e) {
    console.error('========== Tessa AI Authentication Failed ==========');
    console.error('Raw Error:', e);
    console.error('Type:', typeof e);
    console.error('Message:', e?.message);
    console.error('Stack:', e?.stack);

    this.isLoading = false;

    this.showToast(
        'Connection Error',
        e?.message || JSON.stringify(e) || 'Could not connect to Tessa AI',
        'error'
    );
}
}

    showWelcome() {
        if (this.messages.length > 0) return;

        const u    = this.userInfo || {};
        const org  = u.organisation || {};
        const facs = u.facilities || [];

        const fullName = u.full_name || u.username || 'there';
        const orgName  = org.name || u.org_name || 'your organisation';

        // Build access-aware info
        let accessInfo = '';
        if (u.access_level === 1) {
            accessInfo = 'You have full access to all data in ' + orgName + '.';
        } else if (u.access_level === 2 && facs.length > 0) {
            const facNames = facs.map(f => f.name).join(', ');
            accessInfo = 'You have access to data in: ' + facNames + '.';
        } else if (u.access_level === 3) {
            accessInfo = 'You can view your own records and data.';
        }

        this.addMessage(
            'Hi ' + fullName + '! I\'m Tessa, your AI assistant.\n\n' +
            accessInfo + '\n\n' +
            'Try asking me to:\n' +
            '• Create a participant, staff, or facility\n' +
            '• Search for records\n' +
            '• Bulk upload via CSV',
            'bot',
            null
        );
    }

    logUserContext(source) {
        const u = this.userInfo || {};
        const org = u.organisation || {};
        const facs = u.facilities || [];

        console.log('[Tessa] Auth (' + source + ')');
        console.log('[Tessa] User: ' + (u.full_name || '') + ' (' + (u.email || '') + ')');
        console.log('[Tessa] Role: ' + (u.user_type || '') + ' | Type: ' + (u.type_of_user || ''));
        console.log('[Tessa] Access: Level ' + (u.access_level || '') + ' - ' + (u.access_label || ''));
        console.log('[Tessa] Environment: ' + (u.environment || ''));
        console.log('[Tessa] Organisation: ' + (org.name || u.org_name || '') + ' (ID: ' + (org.id || '') + ', ID15: ' + (org.id_15 || '') + ')');
        console.log('[Tessa] Staff ID: ' + (u.staff_id || 'N/A'));
        console.log('[Tessa] Profile Picture: ' + (u.user_picture ? 'Yes' : 'No'));

        if (facs.length > 0) {
            console.log('[Tessa] Facilities (' + facs.length + '):');
            facs.forEach(function(f, i) {
                console.log('[Tessa]   ' + (i + 1) + '. ' + f.name + ' (ID: ' + f.id + ', ID15: ' + f.id_15 + ')');
            });
        } else {
            console.log('[Tessa] Facilities: None (org-wide or self-only access)');
        }
    }


    get showWelcomeScreen() {
        return !this.messages.some(msg => msg.isUser);
    }

    get welcomeGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning,';
        if (hour < 17) return 'Good Afternoon,';
        return 'Good Evening,';
    }

    get userDisplayName() {
        return this.userInfo?.full_name || this.userInfo?.username || 'Stella Smith';
    }

    get chatMainClass() {
        return this.showWelcomeScreen ? 'chat-main-layout welcome-mode' : 'chat-main-layout';
    }

    get isInputText() {
        return this.currentInput?.type === 'text';
    }
    get isInputEmail() {
        return this.currentInput?.type === 'email';
    }
    get isInputNumber() {
        return this.currentInput?.type === 'number';
    }
    get isInputDate() {
        return this.currentInput?.type === 'date';
    }
    get isInputTime() {
        return this.currentInput?.type === 'time';
    }
    get isInputDateTime() {
        return this.currentInput?.type === 'datetime';
    }
    get isInputTextarea() {
        return this.currentInput?.type === 'textarea';
    }
    get isInputSelect() {
        return this.currentInput?.type === 'select';
    }
    get isInputMultiselect() {
        return this.currentInput?.type === 'multiselect';
    }
    // Spec: search appears only when there are MORE THAN 15 options.
    get multiSearchable() {
        return ((this.currentInput && this.currentInput.options) || []).length > 15;
    }
    get multiselectOptions() {
        const f = (this.multiFilter || '').toLowerCase().trim();
        const opts = (this.currentInput && this.currentInput.options) || [];
        return opts
            .filter(o => !f || (o.label || '').toLowerCase().includes(f))
            .map(o => ({
                value: o.value,
                label: o.label,
                checked: this.multiSelected.includes(o.value),
                cls: this.multiSelected.includes(o.value) ? 'multi-opt is-picked' : 'multi-opt'
            }));
    }
    get multiCountLabel() {
        const n = this.multiSelected.length;
        if (!n) return 'None selected';
        return n === 1 ? '1 selected' : n + ' selected';
    }
    get multiDoneDisabled() {
        return this.multiSelected.length === 0;
    }
    // Spec: a dropdown with MORE THAN 15 options gets a search box. At or below
    // 15 the existing plain <select> is used unchanged.
    get selectSearchable() {
        return this.isInputSelect &&
               ((this.currentInput && this.currentInput.options) || []).length > 15;
    }
    get selectPlain() {
        return this.isInputSelect && !this.selectSearchable;
    }
    get selectFilteredOptions() {
        const f = (this.selectFilter || '').toLowerCase().trim();
        const opts = (this.currentInput && this.currentInput.options) || [];
        // contains-match anywhere in the label, case-insensitive
        return opts
            .filter(o => !f || (o.label || '').toLowerCase().includes(f))
            .map(o => ({
                value: o.value,
                label: o.label,
                cls: o.value === this.selectPicked ? 'sel-opt is-picked' : 'sel-opt'
            }));
    }
    get selectSearchPlaceholder() {
        const n = ((this.currentInput && this.currentInput.options) || []).length;
        const what = (this.currentInput && this.currentInput.label) || 'options';
        return 'Search ' + n + ' ' + what.toLowerCase().replace(/\?$/, '') + '...';
    }
    get selectNoMatches() {
        return this.selectSearchable && this.selectFilteredOptions.length === 0;
    }
    handleSelectFilter(event) {
        this.selectFilter = event.target.value || '';
    }
    handleSelectPick(event) {
        const v = event.currentTarget.dataset.value;
        const opts = (this.currentInput && this.currentInput.options) || [];
        const label = (opts.find(o => o.value === v) || {}).label || v;
        this.selectPicked = v;
        this.selectFilter = '';
        // Same submit path the plain <select> uses - selection behaviour and
        // validation are unchanged, only the picker UI differs.
        this.submitDynamicValue(v, label);
    }
    get isInputMultiselect() {
        return this.currentInput?.type === 'multiselect';
    }
    // Spec: search appears only when there are MORE THAN 15 options.
    get multiSearchable() {
        return ((this.currentInput && this.currentInput.options) || []).length > 15;
    }
    get multiselectOptions() {
        const f = (this.multiFilter || '').toLowerCase().trim();
        const opts = (this.currentInput && this.currentInput.options) || [];
        return opts
            .filter(o => !f || (o.label || '').toLowerCase().includes(f))
            .map(o => ({
                value: o.value,
                label: o.label,
                checked: this.multiSelected.includes(o.value),
                cls: this.multiSelected.includes(o.value) ? 'multi-opt is-picked' : 'multi-opt'
            }));
    }
    get multiCountLabel() {
        const n = this.multiSelected.length;
        if (!n) return 'None selected';
        return n === 1 ? '1 selected' : n + ' selected';
    }
    get multiDoneDisabled() {
        return this.multiSelected.length === 0;
    }
    get isInputBoolean() {
        return this.currentInput?.type === 'boolean';
    }
    get isInputFile() {
        return this.currentInput?.type === 'file';
    }
    get isInputAddress() {
        return this.currentInput?.type === 'address';
    }

    // ── Suggested prompts ─────────────────────────
    loadSuggestedPrompts() {
        this.suggestedPrompts = [
            { id: 'p1', label: 'Create participant',  text: 'Create a participant named ',    icon: 'utility:add', isAdd: true },
            { id: 'p2', label: 'Add staff',           text: 'Add staff ',                     icon: 'utility:user', isUser: true },
            { id: 'p3', label: 'Create facility',     text: 'Create a facility named ',       icon: 'utility:location', isLocation: true },
            { id: 'p4', label: 'List participants',   text: 'List all participants',          icon: 'utility:list', isList: true },
            { id: 'p5', label: 'My shifts this month',text: 'How many shifts I have this month?', icon: 'utility:date_input', isDate: true },
            { id: 'p6', label: 'Bulk upload',         text: '',                               icon: 'utility:upload', isUpload: true }
        ];
    }

    get showSuggestedPrompts() {
        return this.settingsShowSuggestions && this.messages.length <= 1 && !this.showBatchTools;
    }

    handleSuggestedPrompt(event) {
        const promptText = event.currentTarget.dataset.prompt;
        if (!promptText) {
            // Bulk upload chip
            this.toggleBatchTools();
            return;
        }
        this.currentMessage = promptText;
        this.template.querySelector('.chat-input').value = promptText;
        this.template.querySelector('.chat-input').focus();
    }

        // ── Ask a Question panel ──────────────────────
    async loadQuestionCatalog() {
        this.loadFaqStats();
        try {
            const data = await this.apiCall('/chat/ai/questions', 'GET', null);
            const cats = (data && data.categories) || [];
            this.questionCategories = cats.map((c, ci) => ({
                id: 'c' + ci,
                category: c.category,
                questions: (c.questions || []).map((q, qi) => ({
                    id: 'c' + ci + 'q' + qi,
                    question: q.question,
                    label: q.prefill ? q.question.trim() + '\u2026' : q.question,
                    prefillStr: String(!!q.prefill)
                }))
            })).filter(c => c.questions.length > 0);
        } catch (e) {
            console.warn('Question catalog unavailable:', e);
            this.questionCategories = [];
        }
        // the badge keeps pulsing - it is how people find the FAQ list
    }

    get showAskButton() {
        return this.questionCategories.length > 0;
    }

    get askBtnClass() {
        return 'header-btn ask-btn ask-pulse';
    }

    // ══════════════════════════════════════════════════════════════
    //  FAQ knowledge hub
    //  Accordion categories, search with highlighting, personalised
    //  sections, per-category paging and role-aware visibility.
    //  All of it is derived in getters so the template stays declarative.
    // ══════════════════════════════════════════════════════════════

    /** Icon per category. Matching is by keyword so new categories added
     *  in question_catalog.py pick up a sensible icon with no code change. */
    iconFor(name) {
        const n = (name || '').toLowerCase();
        const P = {
            staff:    'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
            person:   'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
            facility: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
            calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-1.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
            doc:      'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
            org:      'M12 7V3H2v18h20V7H12zM10 19H4v-2h6v2zm0-4H4v-2h6v2zm0-4H4V9h6v2zm0-4H4V5h6v2zm10 12h-8V9h8v10z',
            report:   'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
            settings: 'M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z',
            help:     'M11 18h2v-2h-2v2zm1-16A10 10 0 002 12a10 10 0 1010-10zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a4 4 0 00-4 4h2a2 2 0 114 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 00-4-4z'
        };
        if (n.indexOf('staff') !== -1 || n.indexOf('person') !== -1) return P.staff;
        if (n.indexOf('participant') !== -1 || n.indexOf('client') !== -1) return P.person;
        if (n.indexOf('facilit') !== -1) return P.facility;
        if (n.indexOf('roster') !== -1 || n.indexOf('shift') !== -1 ||
            n.indexOf('leave') !== -1 || n.indexOf('availab') !== -1) return P.calendar;
        if (n.indexOf('document') !== -1) return P.doc;
        if (n.indexOf('organisation') !== -1 || n.indexOf('organization') !== -1) return P.org;
        if (n.indexOf('report') !== -1 || n.indexOf('billing') !== -1) return P.report;
        if (n.indexOf('setting') !== -1 || n.indexOf('admin') !== -1 ||
            n.indexOf('access') !== -1) return P.settings;
        return P.help;
    }

    /** Role-based visibility.
     *  access_level: 1 = full org access, 2 = facility scoped, 3 = own records.
     *  This hides categories that would only frustrate a user who cannot act
     *  on them. It is presentation only — the backend already enforces real
     *  access control on every query. */
    categoryVisible(name) {
        const lvl = (this.userInfo && this.userInfo.access_level) || 1;
        if (lvl === 1) return true;                       // admins see everything
        const n = (name || '').toLowerCase();
        const adminOnly = (n.indexOf('admin') === 0 || n.indexOf('admin -') !== -1 ||
                           n.indexOf('organisation setting') !== -1 ||
                           n.indexOf('billing') !== -1 ||
                           n.indexOf('my access') !== -1);
        if (adminOnly) return false;
        if (lvl === 3) {
            // own-records users: keep personal + general help only
            return (n.indexOf('my ') === 0 || n.indexOf('how ') === 0 ||
                    n.indexOf('guide') !== -1 || n.indexOf('find a person') !== -1);
        }
        return true;
    }

    // ── usage / recency tracking (drives Popular, Recent, Recommended) ──
    faqStoreKey(kind) { return 'tessa_faq_' + kind + '_' + USER_ID; }

    loadFaqStats() {
        try {
            this._faqUsage = JSON.parse(localStorage.getItem(this.faqStoreKey('usage')) || '{}');
        } catch (e) { this._faqUsage = {}; }
        try {
            this._faqRecent = JSON.parse(localStorage.getItem(this.faqStoreKey('recent')) || '[]');
        } catch (e) { this._faqRecent = []; }
    }

    recordFaqUse(question) {
        if (!question) return;
        this._faqUsage = this._faqUsage || {};
        this._faqUsage[question] = (this._faqUsage[question] || 0) + 1;
        this._faqRecent = [question].concat(
            (this._faqRecent || []).filter(q => q !== question)).slice(0, 10);
        try {
            localStorage.setItem(this.faqStoreKey('usage'), JSON.stringify(this._faqUsage));
            localStorage.setItem(this.faqStoreKey('recent'), JSON.stringify(this._faqRecent));
        } catch (e) { /* storage full or blocked — feature degrades quietly */ }
        this._faqStatsVersion = (this._faqStatsVersion || 0) + 1;
    }

    /** Every question, flattened, with its category and icon attached. */
    get allFaqQuestions() {
        const out = [];
        for (const c of (this.questionCategories || [])) {
            if (!this.categoryVisible(c.category)) continue;
            for (const q of c.questions) {
                out.push({ ...q, category: c.category });
            }
        }
        return out;
    }

    /** Split a question around the search term so matches can be highlighted. */
    highlightParts(text, term, keyPrefix) {
        const parts = [];
        if (!term) {
            parts.push({ key: keyPrefix + '_0', text: text, hl: false });
            return parts;
        }
        const lower = text.toLowerCase();
        let i = 0, n = 0, idx;
        while ((idx = lower.indexOf(term, i)) !== -1) {
            if (idx > i) parts.push({ key: keyPrefix + '_' + (n++), text: text.slice(i, idx), hl: false });
            parts.push({ key: keyPrefix + '_' + (n++), text: text.slice(idx, idx + term.length), hl: true });
            i = idx + term.length;
        }
        if (i < text.length) parts.push({ key: keyPrefix + '_' + (n++), text: text.slice(i), hl: false });
        return parts;
    }

    decorate(q, term) {
        return {
            ...q,
            icon: this.iconFor(q.category),
            parts: this.highlightParts(q.question, term, q.id)
        };
    }

    // ── search mode ────────────────────────────────────────────────
    get faqSearching() {
        return (this.questionFilter || '').trim().length > 0;
    }

    /** True if `word` appears at the start of a word in `text`.
     *  Substring matching is wrong here: searching "how do i" would otherwise
     *  match "participants" on the letter i. */
    wordHit(text, word) {
        let from = 0;
        for (;;) {
            const idx = text.indexOf(word, from);
            if (idx === -1) return false;
            const prev = idx === 0 ? ' ' : text.charAt(idx - 1);
            if (!/[a-z0-9]/.test(prev)) return true;   // at a word boundary
            from = idx + 1;
        }
    }

    get faqSearchResults() {
        const term = (this.questionFilter || '').toLowerCase().trim();
        if (!term) return [];
        const words = term.split(/\s+/).filter(Boolean);
        const scored = [];
        for (const q of this.allFaqQuestions) {
            const ql = q.question.toLowerCase();
            const cl = (q.category || '').toLowerCase();
            if (!words.every(w => this.wordHit(ql, w) || this.wordHit(cl, w))) continue;
            let score = 0;
            if (ql.indexOf(term) === 0) score += 100;
            if (ql.indexOf(term) !== -1) score += 40;
            for (const w of words) {
                if (this.wordHit(ql, w)) score += 6;
                else score += 2;
            }
            score += Math.min((this._faqUsage || {})[q.question] || 0, 5) * 8;
            scored.push({ q, score });
        }
        scored.sort((a, b) => b.score - a.score || a.q.question.length - b.q.question.length);
        return scored.slice(0, 40).map(s => this.decorate(s.q, term));
    }

    get faqSearchCount() { return this.faqSearchResults.length; }
    get faqNoResults() { return this.faqSearching && this.faqSearchResults.length === 0; }

    // ── personalised sections (hidden while searching) ─────────────
    get faqRecommended() {
        if (this.faqSearching) return [];
        const usage = this._faqUsage || {};
        // Words the user has actually been talking about in this conversation.
        const recentText = (this.messages || []).slice(-6)
            .filter(m => m.isUser).map(m => (m.text || '')).join(' ').toLowerCase();
        const ctxWords = recentText.split(/[^a-z0-9]+/).filter(w => w.length > 3);

        const scored = [];
        for (const q of this.allFaqQuestions) {
            const ql = q.question.toLowerCase();
            let score = 0;
            // signal 1: things this user asks often
            score += Math.min(usage[q.question] || 0, 6) * 5;
            // signal 2: overlap with what they're discussing right now
            for (const w of ctxWords) if (ql.indexOf(w) !== -1) score += 4;
            if (score > 0) scored.push({ q, score });
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 4).map(s => this.decorate(s.q, ''));
    }

    get faqRecent() {
        if (this.faqSearching) return [];
        const all = this.allFaqQuestions;
        const out = [];
        for (const text of (this._faqRecent || [])) {
            const hit = all.find(q => q.question === text);
            if (hit) out.push(this.decorate(hit, ''));
            if (out.length >= 5) break;
        }
        return out;
    }

    get faqPopular() {
        if (this.faqSearching) return [];
        // Curated defaults until this user has their own history, then their
        // own most-used questions take over.
        const usage = this._faqUsage || {};
        const used = Object.keys(usage);
        const all = this.allFaqQuestions;
        if (used.length >= 3) {
            const ranked = all.filter(q => usage[q.question])
                .sort((a, b) => usage[b.question] - usage[a.question])
                .slice(0, 5);
            if (ranked.length) return ranked.map(q => this.decorate(q, ''));
        }
        const seeds = ["Show today's roster", 'Show all staff', 'Show organisation details',
                       'How many participants do we have?', 'Show my roster'];
        const out = [];
        for (const s of seeds) {
            const hit = all.find(q => q.question.toLowerCase() === s.toLowerCase());
            if (hit) out.push(this.decorate(hit, ''));
        }
        if (out.length) return out;
        return all.slice(0, 5).map(q => this.decorate(q, ''));
    }

    get hasRecommended() { return this.faqRecommended.length > 0; }
    get hasRecent()      { return this.faqRecent.length > 0; }
    get hasPopular()     { return this.faqPopular.length > 0; }
    get showFaqSections() {
        return !this.faqSearching &&
               (this.hasRecommended || this.hasRecent || this.hasPopular);
    }

    // ── accordion categories ───────────────────────────────────────
    get faqCategories() {
        if (this.faqSearching) return [];
        const pageSize = 8;
        return (this.questionCategories || [])
            .filter(c => this.categoryVisible(c.category))
            .map((c) => {
                const expanded = this.expandedCategoryId === c.id;
                const shown = (this._catShown || {})[c.id] || pageSize;
                const visible = expanded ? c.questions.slice(0, shown) : [];
                const more = Math.max(0, c.questions.length - visible.length);
                return {
                    id: c.id,
                    category: c.category,
                    icon: this.iconFor(c.category),
                    count: c.questions.length,
                    expanded: expanded,
                    headerClass: expanded ? 'faq-cat-head expanded' : 'faq-cat-head',
                    questions: visible.map(q => this.decorate({ ...q, category: c.category }, '')),
                    hasMore: expanded && more > 0,
                    moreLabel: 'View ' + Math.min(more, pageSize) + ' more'
                };
            })
            .filter(c => c.count > 0);
    }

    get hasFaqCategories() { return this.faqCategories.length > 0; }

    toggleFaqCategory(event) {
        const id = event.currentTarget.dataset.cat;
        // One open at a time keeps the panel short and scannable.
        this.expandedCategoryId = (this.expandedCategoryId === id) ? null : id;
    }

    showMoreInCategory(event) {
        const id = event.currentTarget.dataset.cat;
        const cur = (this._catShown || {})[id] || 8;
        this._catShown = { ...(this._catShown || {}), [id]: cur + 8 };
    }

    clearFaqSearch() {
        this.questionFilter = '';
    }

    get filteredQuestionCategories() {
        // kept for backwards compatibility with any other reference
        return this.faqCategories;
    }

    get hasFilteredQuestionsLegacy() {
        return this.filteredQuestionCategories.length > 0;
    }

    toggleQuestions() {
        this.showQuestions = !this.showQuestions;
        if (this.showQuestions) {
            this.questionFilter = '';
        }
    }

    closeQuestions() {
        this.showQuestions = false;
    }

    handleQuestionFilter(event) {
        this.questionFilter = event.target.value || '';
    }

    handleQuestionClick(event) {
        const q = event.currentTarget.dataset.question;
        const isPrefill = event.currentTarget.dataset.prefill === 'true';
        if (!q) return;
        this.recordFaqUse(q);
        this.showQuestions = false;

        if (this.currentInput) {
            this.showToast('Finish the current step',
                           'Complete or cancel the question above first.', 'info');
            return;
        }
        if (isPrefill) {
            this.currentMessage = q;
            const el = this.template.querySelector('.chat-input');
            if (el) { el.value = q; el.focus(); }
            return;
        }
        this.currentMessage = q;
        this.handleSend();
    }



    // ── Settings ──────────────────────────────────
    loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (saved) {
                const s = JSON.parse(saved);
                this.settingsSaveHistory     = s.saveHistory ?? true;
                this.settingsShowSuggestions = s.showSuggestions ?? true;
            }
        } catch(e) { /* ignore */ }
    }

    saveSettings() {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
            saveHistory:     this.settingsSaveHistory,
            showSuggestions: this.settingsShowSuggestions
        }));
    }

    toggleSettings() {
        this.showSettings = !this.showSettings;
    }

    handleToggleHistory(event) {
        this.settingsSaveHistory = event.target.checked;
        this.saveSettings();
    }

    handleToggleSuggestions(event) {
        this.settingsShowSuggestions = event.target.checked;
        this.saveSettings();
    }

    // ── History persistence ───────────────────────
    loadHistory() {
        if (!this.settingsSaveHistory) return;
        try {
            const key = STORAGE_KEY_HISTORY + '_' + USER_ID;
            const saved = localStorage.getItem(key);
            if (saved) {
                const history = JSON.parse(saved);
                // Backfill hasText for messages saved before rich-text support
                this.messages = history.slice(-MAX_HISTORY_MESSAGES).map(m => ({
                    ...m,
                    hasText: this.textAddsValue(m.text, m.table),
                    typing:  false   // restored history renders instantly
                }));
                this.messageIdCounter = this.messages.length;
            }
        } catch(e) { /* ignore */ }
    }

    saveHistorySoon() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveHistory(), 250);
    }

    saveHistory() {
        if (!this.settingsSaveHistory) return;
        try {
            const key = STORAGE_KEY_HISTORY + '_' + USER_ID;
            const toSave = this.messages.slice(-MAX_HISTORY_MESSAGES);
            localStorage.setItem(key, JSON.stringify(toSave));
        } catch(e) { /* storage full - ignore */ }
    }

    handleClearHistory() {
        this.messages = [];
        const key = STORAGE_KEY_HISTORY + '_' + USER_ID;
        localStorage.removeItem(key);
        this.showToast('History Cleared', 'Chat history removed', 'success');
        this.showSettings = false;
        this.showWelcome();
    }

    handleNewChat() {
        this.messages = [];
        this.activeAiSession = false;
        this.currentInput = null;
        this.dynamicInputValue = '';
        this.showWelcome();
    }

    // ── Chat ──────────────────────────────────────
    /** Show Stop instead of Send while a request is in flight or typing. */
    get showStopButton() {
        return this.isThinking || this.streamingMessageId !== null;
    }

    get sendDisabled() {
        if (this.isThinking || !this.connected) return true;
        if (this.currentInput) {
            if (this.currentInput.required && (this.dynamicInputValue === null || this.dynamicInputValue === undefined || this.dynamicInputValue.toString().trim() === '')) {
                return true;
            }
            return false;
        }
        return !this.currentMessage.trim();
    }

    handleInputChange(event) {
        this.currentMessage = event.target.value;
        this.updateSuggestions(event.target.value);
        // Auto-resize
        const ta = event.target;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }

    handleKeyDown(event) {
        // Suggestion navigation takes priority when the dropdown is open.
        if (this.showSuggestions) {
            if (event.key === 'ArrowDown') { event.preventDefault(); this.moveSuggestion(1); return; }
            if (event.key === 'ArrowUp')   { event.preventDefault(); this.moveSuggestion(-1); return; }
            if (event.key === 'Escape')    { this.hideSuggestions(); return; }
            if (event.key === 'Enter' && !event.shiftKey && this._activeSuggestion >= 0) {
                event.preventDefault();
                const chosen = this.suggestions[this._activeSuggestion];
                if (chosen) {
                    this.hideSuggestions();
                    this.currentMessage = chosen.q;
                    this.handleSend();
                    return;
                }
            }
        }
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!this.sendDisabled) {
                this.hideSuggestions();
                this.handleSend();
            }
        }
    }

    /**
     * Progressive status while waiting.
     *
     * A static "Thinking" for 30 seconds reads as a hang. Most answers here
     * return in well under a second, so the later stages only ever appear on
     * the genuinely slow paths — which is exactly when the user needs to know
     * something is still happening.
     */
    startThinking() {
        this.stopThinking();
        this.thinkingLabel = 'Thinking';
        const stages = [
            [3000,  'Looking that up'],
            [8000,  'Searching your records'],
            [16000, 'Still working on it'],
            [28000, 'Almost there']
        ];
        for (const [delay, text] of stages) {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this._thinkTimers.push(window.setTimeout(() => {
                if (this.isThinking) this.thinkingLabel = text;
            }, delay));
        }
    }

    stopThinking() {
        for (const t of this._thinkTimers) {
            window.clearTimeout(t);
        }
        this._thinkTimers = [];
        this.thinkingLabel = 'Thinking';
    }

    async handleSend() {
        this.hideSuggestions();
        // If a previous answer is still revealing, show it in full at once so
        // two messages never animate together.
        this.finishTyping();
        this.streamingMessageId = null;
        let text;
        if (this.currentInput) {
            text = this.dynamicInputValue;
        } else {
            text = this.currentMessage.trim();
        }
        if (text === null || text === undefined || text.toString().trim() === '') return;
        text = text.toString().trim();

        this.addMessage(text, 'user', null);
        this.currentMessage = '';
        this.dynamicInputValue = '';

        const input = this.template.querySelector('.chat-input');
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }

        this.isThinking = true;
        this.startThinking();
        this.scrollToBottom();

        // Each send gets its own AbortController + sequence number. The
        // sequence guard means a response from a cancelled request can never
        // be appended to the chat, even if it was already in flight.
        const seq = ++this._requestSeq;
        const controller = new AbortController();
        this._abortController = controller;
        const signal = controller.signal;
        const isStale = () => seq !== this._requestSeq;

        try {
            const aiKeywords = /^(create|add|new|register|onboard|log|make|hire|book|schedule|batch|update|change|modify|edit|deactivate|remove|delete|disable|show me|show all|list|find|search|get all)\s/i;
            const isCrudIntent = aiKeywords.test(text);

            let response;

            // If we have an active input OR we are in an AI session OR this is a new CRUD intent, use /chat/ai
            if (this.currentInput || this.activeAiSession || isCrudIntent) {
                response = await this.apiCall('/chat/ai', 'POST', { message: text }, signal);

                // Track session state
                if (response && response.state) {
                    if (response.state === 'collecting' ||
                        response.state === 'awaiting_confirmation' ||
                        response.state === 'awaiting_batch_confirmation' ||
                        response.state === 'selecting_target' ||
                        response.state === 'awaiting_update_confirmation' ||
                        response.state === 'awaiting_deactivate_confirmation' ||
                        response.state === 'error') {
                        this.activeAiSession = true;
                    } else if (response.state === 'completed' ||
                               response.state === 'cancelled' ||
                               response.state === 'no_module') {
                        this.activeAiSession = false;
                    }
                }

                // If no_module, fall through to normal chat
                if (response && response.state === 'no_module') {
                    this.activeAiSession = false;
                    response = await this.ragCall(text, signal);
                }
            } else {
                // Normal chat
                response = await this.ragCall(text, signal);
            }

            // Cancelled while in flight -> drop the response entirely.
            if (isStale()) return;

            this.isThinking = false;
        this.stopThinking();
            this.stopThinking();

            // A streamed answer has already been rendered progressively into
            // its own message — don't add it a second time.
            if (!(response && response.__streamed)) {
                const answerText = response.answer_html || response.answer || response.message || 'No response';
                this.addMessage(answerText, 'bot', response.table, true);
            }

            if (response.sf_id) {
                this.showToast('Created', 'Record created: ' + response.sf_id, 'success');
            }

            // Centralized dynamic input state update
            if (response && response.input) {
                this.currentInput = response.input;
                this.selectFilter = '';
                this.selectPicked = null;
                this.dynamicInputValue = response.input.defaultValue || '';
            } else {
                this.currentInput = null;
                this.dynamicInputValue = '';
            }

        } catch(e) {
            // A cancelled request is not an error — stay silent and leave the
            // session state alone so the user can simply carry on.
            if (e && (e.name === 'AbortError' || isStale())) return;
            this.isThinking = false;
        this.stopThinking();
            this.stopThinking();
            this.activeAiSession = false;
            this.currentInput = null;
            this.dynamicInputValue = '';
            this.addMessage('Sorry, I hit an error: ' + e.message, 'bot', null);
        } finally {
            if (this._abortController === controller) this._abortController = null;
        }
    }

    // ── Stop generating ───────────────────────────
    /**
     * Cancels the in-flight AI request (and any typing animation).
     *
     * Bumping _requestSeq is what makes this safe: even if the response has
     * already left the server, the stale check in handleSend drops it, so a
     * cancelled answer can never appear in the chat afterwards.
     */
    handleStopGenerating() {
        this._requestSeq++;                 // invalidate the in-flight request
        try {
            if (this._abortController) this._abortController.abort();
        } catch (e) { /* ignore */ }
        this._abortController = null;

        // Stop a response that is mid-typing and reveal it in full.
        this.finishTyping();

        this.isThinking = false;
        this.stopThinking();
        this.streamingMessageId = null;

        // Return focus so the user can immediately ask something else.
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.setTimeout(() => {
            const ta = this.template.querySelector('.chat-input');
            if (ta) ta.focus();
        }, 0);
    }

    finishTyping() {
        const active = this.template.querySelectorAll('c-tessa-rich-text');
        active.forEach((el) => {
            if (el && typeof el.completeTyping === 'function') el.completeTyping();
        });
    }


    // ── Message rendering ─────────────────────────
    /**
     * True when the message text is worth showing above a table.
     * The backend sets `answer` to the table's title for table responses, so
     * rendering both duplicates the line. Compare on stripped, normalised
     * text so it works whether the text arrives as plain or as HTML.
     */
    textAddsValue(text, table) {
        const raw = (text === null || text === undefined) ? '' : String(text);
        if (!raw.trim()) return false;
        if (!table || !table.title) return true;

        const norm = (s) => String(s || '')
            .replace(/<[^>]*>/g, ' ')      // strip tags
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&#\d+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        const t = norm(raw);
        const title = norm(table.title);
        if (!t) return false;
        // Identical, or the text is just the title (possibly with trailing punctuation).
        return !(t === title || t.replace(/[.:]$/, '') === title.replace(/[.:]$/, ''));
    }

    addMessage(text, sender, table, stream) {
        this.messageIdCounter++;
        const id = 'msg_' + this.messageIdCounter;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Split text into lines for rendering
        const lines = (text || '').split('\n').map((line, idx) => ({
            key: id + '_line_' + idx,
            text: line
        }));

        let processedTable = null;
        if (table && table.rows) {
            processedTable = this.processTable(table, id);
        }

        this.messages = [...this.messages, {
            id:        id,
            text:      text,
            textLines: lines,
            // Suppress the text when it is just the table's own title —
            // otherwise the same line renders twice (once as the message
            // body, once in the table header).
            hasText:   this.textAddsValue(text, processedTable),
            isUser:    sender === 'user',
            cssClass:  sender === 'user' ? 'msg msg-user' : 'msg msg-bot',
            time:      time,
            table:     processedTable,
            // Only freshly-arrived bot answers animate. Restored history and
            // user messages render instantly.
            typing:    stream === true && sender !== 'user' && this.settingsStreamReply !== false
        }];

        if (stream === true && sender !== 'user') this.streamingMessageId = id;

        this.saveHistory();
        this.scrollToBottom();
        return id;
    }

    /** Replace a message's text in place (used while a stream is arriving). */
    updateMessage(id, text, table) {
        this.messages = this.messages.map((m) => {
            if (m.id !== id) return m;
            const lines = (text || '').split('\n').map((line, idx) => ({
                key: id + '_line_' + idx,
                text: line
            }));
            return {
                ...m,
                text: text,
                textLines: lines,
                hasText: this.textAddsValue(text, table || m.table),
                typing: false          // a stream reveals itself; no animation
            };
        });
            this.saveHistorySoon();
    }

    handleTypingDone() {
        this.streamingMessageId = null;
        this.scrollToBottom();
    }

    /** Keep the newest text in view while it is being revealed. */
    handleTypingTick() {
        this.scrollToBottom();
    }

    processTable(table, msgId) {
        const cols = table.columns || [];
        const rows = (table.rows || []).slice(0, MAX_TABLE_ROWS);

        const displayRows = rows.map((row, rowIdx) => ({
            rowKey: msgId + '_row_' + rowIdx,
            cells:  cols.map((col, colIdx) => {
                const val = row[col.key];
                const isBadge = col.type === 'badge';
                let badgeClass = '';
                if (isBadge) {
                    const status = (val || '').toString().toLowerCase().replace(/\s+/g, '-');
                    badgeClass = 'badge-status badge-' + status;
                }
                return {
                    key:        msgId + '_r' + rowIdx + '_c' + colIdx,
                    value:      val == null ? '' : String(val),
                    isBadge:    isBadge,
                    badgeClass: badgeClass
                };
            })
        }));

        return {
            title:       table.title || '',
            total:       table.total || rows.length,
            columns:     cols,
            displayRows: displayRows
        };
    }

    // ── Dynamic Input Handlers (Composer-Based) ────────────

    // Computed: show cancel button (during dynamic input, except boolean)
    get showCancelButton() {
        return this.currentInput && this.currentInput.type !== 'boolean';
    }

    // Computed: show send arrow for text-like dynamic inputs
    get showDynamicSend() {
        if (!this.currentInput) return false;
        return ['text', 'email', 'number', 'textarea'].includes(this.currentInput.type);
    }

    handleAddressChange(event) {
        this.addressStreet = event.detail.street || '';
        this.addressCity = event.detail.city || '';
        this.addressProvince = event.detail.province || '';
        this.addressPostalCode = event.detail.postalCode || '';
        this.addressCountry = event.detail.country || 'AU';
    }

    handleAddressSubmit() {
        if (!this.addressStreet || !this.addressCity || !this.addressProvince || !this.addressPostalCode) {
            this.showToast('Missing Fields', 'Please fill Street, City, State and Postcode', 'warning');
            return;
        }
        const addressJson = JSON.stringify({
            street: this.addressStreet,
            city: this.addressCity,
            province: this.addressProvince,
            postalCode: this.addressPostalCode,
            country: this.addressCountry
        });

        // Build readable display text
        const displayText = this.addressStreet + ', ' + this.addressCity + ' ' + this.addressProvince + ' ' + this.addressPostalCode;

        // Reset
        this.addressStreet = '';
        this.addressCity = '';
        this.addressProvince = '';
        this.addressPostalCode = '';

        // Send JSON to backend but show readable text to user
        this.submitAddressValue(addressJson, displayText);
    }

    handleDynamicInputEvent(event) {
        this.dynamicInputValue = event.target.value || '';
    }

    handleDynamicKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleDynamicSubmit();
        }
    }

    handleDynamicSubmit() {
        const val = (this.dynamicInputValue || '').toString().trim();
        if (!val) return;
        this.submitDynamicValue(val);
    }

    handleDynamicAutoSubmit(event) {
        const val = event.target.value || '';
        if (val) {
            this.submitDynamicValue(val);
        }
    }

    handleBooleanClick(event) {
        const val = event.currentTarget.dataset.value;
        this.submitDynamicValue(val);
    }

    handleFileInput(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            this.submitDynamicValue('[File: ' + files[0].name + ']');
        }
    }

    handleCancelWorkflow() {
        // Send cancel to backend and reset
        this.currentInput = null;
        this.dynamicInputValue = '';
        this.activeAiSession = false;
        this.addressStreet = '';
        this.addressCity = '';
        this.addressProvince = '';
        this.addressPostalCode = '';
        this.addMessage('cancel', 'user', null);
        this.isThinking = true;
        this.scrollToBottom();

        this.apiCall('/chat/ai', 'POST', { message: 'cancel' })
            .then(response => {
                this.isThinking = false;
        this.stopThinking();
            this.stopThinking();
                this.addMessage(response.answer || 'Cancelled.', 'bot', null);
            })
            .catch(() => {
                this.isThinking = false;
        this.stopThinking();
            this.stopThinking();
                this.addMessage('Cancelled.', 'bot', null);
            });
    }

    async submitAddressValue(jsonValue, displayText) {
        // Show readable address as user message
        this.addMessage(displayText, 'user', null);
        this.currentInput = null;
        this.dynamicInputValue = '';
        this.isThinking = true;
        this.scrollToBottom();

        try {
            const response = await this.apiCall('/chat/ai', 'POST', { message: jsonValue });
            this.isThinking = false;
        this.stopThinking();
            this.stopThinking();

            if (response && response.state) {
                const activeStates = ['collecting', 'awaiting_confirmation', 'awaiting_batch_confirmation',
                    'selecting_target', 'awaiting_update_confirmation',
                    'awaiting_deactivate_confirmation', 'error'];
                const doneStates = ['completed', 'cancelled', 'no_module'];
                if (activeStates.includes(response.state)) {
                    this.activeAiSession = true;
                } else if (doneStates.includes(response.state)) {
                    this.activeAiSession = false;
                }
            }

            const answerText = response.answer_html || response.answer || response.message || 'No response';
            this.addMessage(answerText, 'bot', response.table);

            if (response && response.input) {
                this.currentInput = response.input;
                this.selectFilter = '';
                this.selectPicked = null;
                this.dynamicInputValue = response.input.defaultValue || response.input.default || '';
            } else {
                this.currentInput = null;
                this.dynamicInputValue = '';
            }

            if (response.sf_id) {
                this.showToast('Created', 'Record created: ' + response.sf_id, 'success');
            }
        } catch(e) {
            this.isThinking = false;
        this.stopThinking();
            this.stopThinking();
            this.currentInput = null;
            this.activeAiSession = false;
            this.addMessage('Error: ' + e.message, 'bot', null);
        }
    }

    handleMultiToggle(event) {
        const v = event.currentTarget.dataset.value;
        if (!v) return;
        this.multiSelected = this.multiSelected.includes(v)
            ? this.multiSelected.filter(x => x !== v)
            : [...this.multiSelected, v];
    }

    handleMultiFilter(event) {
        this.multiFilter = event.target.value || '';
    }

    handleMultiClear() {
        this.multiSelected = [];
        this.multiFilter = '';
    }

    handleMultiDone() {
        if (!this.multiSelected.length) return;
        const opts = (this.currentInput && this.currentInput.options) || [];
        const labels = this.multiSelected
            .map(v => (opts.find(o => o.value === v) || {}).label || v);
        const payload = this.multiSelected.join(',');
        this.multiSelected = [];
        this.multiFilter = '';
        this.submitDynamicValue(payload, labels.join(', '));
    }

    async submitDynamicValue(value, displayOverride) {
        // Build display value (show label for select/boolean, not raw value)
        let displayValue = displayOverride || value;
        if (!displayOverride && this.currentInput && this.currentInput.type === 'select' && this.currentInput.options) {
            const opt = this.currentInput.options.find(o => o.value === value);
            if (opt) displayValue = opt.label;
        }
        if (this.currentInput && this.currentInput.type === 'boolean') {
            const opt = this.currentInput.options.find(o => o.value === value);
            if (opt) displayValue = opt.label;
        }

        // Show user message
        this.addMessage(displayValue, 'user', null);
        this.currentInput = null;
        this.dynamicInputValue = '';
        this.isThinking = true;
        this.scrollToBottom();

        try {
            const response = await this.apiCall('/chat/ai', 'POST', { message: value });
            this.isThinking = false;
        this.stopThinking();
            this.stopThinking();

            // Track session state
            if (response && response.state) {
                const activeStates = ['collecting', 'awaiting_confirmation', 'awaiting_batch_confirmation',
                    'selecting_target', 'awaiting_update_confirmation',
                    'awaiting_deactivate_confirmation', 'error'];
                const doneStates = ['completed', 'cancelled', 'no_module'];

                if (activeStates.includes(response.state)) {
                    this.activeAiSession = true;
                } else if (doneStates.includes(response.state)) {
                    this.activeAiSession = false;
                }
            }

            const answerText = response.answer_html || response.answer || response.message || 'No response';
            this.addMessage(answerText, 'bot', response.table);

            // Set next dynamic input if backend provides one
            if (response && response.input) {
                this.currentInput = response.input;
                this.selectFilter = '';
                this.selectPicked = null;
                this.dynamicInputValue = response.input.defaultValue || response.input.default || '';
            } else {
                this.currentInput = null;
                this.dynamicInputValue = '';
            }

            if (response.sf_id) {
                this.showToast('Created', 'Record created: ' + response.sf_id, 'success');
            }
        } catch(e) {
            this.isThinking = false;
        this.stopThinking();
            this.stopThinking();
            this.currentInput = null;
            this.activeAiSession = false;
            this.addMessage('Error: ' + e.message, 'bot', null);
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const c = this.template.querySelector('.chat-messages');
            if (c) c.scrollTop = c.scrollHeight;
        }, 50);
    }

    // ── Batch upload ──────────────────────────────
    toggleBatchTools() {
        this.showBatchTools = !this.showBatchTools;
    }

    handleBatchTypeChange(event) {
        this.batchType = event.target.value;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // File classification (v13):
        //   spreadsheet (.csv/.xls/.xlsx)  -> bulk import      -> /chat/ai/batch-upload
        //   document (.pdf/.doc/.docx/img) -> extract & route  -> /chat/ai/extract-document
        // A document is extracted server-side, then Tessa asks what to create
        // (Participant or Contact) and confirms any low-confidence fields. Those
        // prompts come back as ordinary server-driven inputs (select / boolean),
        // so no extra UI is needed here.
        const fname = file.name.toLowerCase();
        const isSpreadsheet = /\.(csv|xls|xlsx)$/.test(fname);
        const isDocument = /\.(pdf|doc|docx|jpg|jpeg|png|heic|tiff)$/.test(fname);

        if (!isSpreadsheet && !isDocument) {
            this.addMessage(
                '❌ Unsupported file type. Upload a PDF, Word document (.doc/.docx), '
                + 'image (jpg, png, heic, tiff), or a CSV/Excel file for bulk import.',
                'bot', null);
            event.target.value = '';
            return;
        }

        const endpoint = isSpreadsheet ? '/chat/ai/batch-upload' : '/chat/ai/extract-document';

        this.uploadProgress = (isDocument ? 'Reading ' : 'Uploading ') + file.name + '...';
        this.addMessage(
            '📎 ' + file.name + (isSpreadsheet ? ' (' + this.batchType + ')' : ''),
            'user', null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (isSpreadsheet) formData.append('module_type', this.batchType);

            const response = await fetch(this.getApiUrl(endpoint), {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this.authToken },
                body: formData
            });

            const data = await response.json();
            this.uploadProgress = '';

            if (data.error) {
                this.addMessage('❌ ' + data.error, 'bot', null);
                event.target.value = '';
                return;
            }

            this.addMessage(data.answer_html || data.answer, 'bot', null);

            if (isDocument) {
                // The document was extracted and prefilled a create session. Hand
                // control to the normal collecting flow. The first input is usually
                // the "Participant or Contact?" choice, a low-confidence confirmation,
                // or "which facility?" — each rendered by the existing dynamic-input
                // engine (select / boolean / lookup / text).
                this.activeAiSession = true;
                this.showBatchTools = false;
                if (data.input) {
                    this.currentInput = data.input;
                    this.dynamicInputValue = '';
                }
            } else {
                this.showToast('Ready', 'Type "yes" to create ' + data.valid_count + ' records', 'info');
            }
        } catch(e) {
            this.uploadProgress = '';
            this.addMessage('❌ Upload failed: ' + e.message, 'bot', null);
        }

        event.target.value = '';
    }

    async handleDownloadTemplate() {
        try {
            const response = await fetch(this.getApiUrl('/chat/ai/template?type=' + this.batchType), {
                headers: { 'Authorization': 'Bearer ' + this.authToken }
            });
            const text = await response.text();
            const blob = new Blob([text], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.batchType + '_template.csv';
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Downloaded', 'Template saved', 'success');
        } catch(e) {
            this.showToast('Error', e.message, 'error');
        }
    }

    // ── API helpers ───────────────────────────────
    getApiUrl(path) {
        // Trailing slash tolerated: strip it so we don't get a double //
        const base = (this.apiBaseUrl || 'https://tesseractapps.com/tessa-ai-prod').replace(/\/+$/, '');
        return base + path;
    }

    /**
     * /chat/rag with streaming support.
     *
     * We ask for a stream, but the backend only streams the one slow path
     * (the documentation summary). Everything else — verbatim how-tos, roster
     * tables, org details — still comes back as ordinary JSON. So the reply is
     * content-negotiated: we look at Content-Type and handle whichever arrives.
     * That means the client never has to guess in advance which path a
     * question will take.
     */
    async ragCall(text, signal) {
        const res = await fetch(this.getApiUrl('/chat/rag'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.authToken,
                'Accept': 'text/event-stream, application/json'
            },
            body: JSON.stringify({
                question: text,
                workerId: this.userInfo?.username || 'user',
                mode: 'auto',
                stream: true
            }),
            signal: signal
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error('API error ' + res.status + ': ' + errText);
        }

        const ctype = res.headers.get('Content-Type') || '';
        if (ctype.indexOf('text/event-stream') === -1) {
            return await res.json();          // normal path, unchanged
        }
        if (!res.body || !res.body.getReader) {
            // Very old browser without streaming reads — fall back to the
            // complete body and show it in one go.
            const raw = await res.text();
            return this.parseSseBody(raw);
        }
        return await this.consumeSse(res, signal);
    }

    /** Read an SSE body progressively, updating the chat as tokens arrive. */
    async consumeSse(res, signal) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        // The message is NOT created yet. Creating it here would render an
        // empty bubble for however long the first token takes to arrive —
        // the blank white bubble users see between "Thinking" and the text.
        // The thinking indicator stays up until there is something to show.
        let msgId = null;

        let buffer = '';
        let shown = '';
        let pending = '';
        let final = null;
        let lastFlush = 0;

        const flush = (force) => {
            // Batch updates: a token-per-render would be hundreds of
            // re-renders for one answer. The FIRST flush is never throttled,
            // so the bubble appears already containing text.
            if (!pending) return;
            if (msgId !== null && !force && Date.now() - lastFlush < 60) return;
            shown += pending;
            pending = '';
            lastFlush = Date.now();

            if (msgId === null) {
                // First content: swap the indicator for a bubble that is
                // already populated.
                this.isThinking = false;
                this.stopThinking();
                msgId = this.addMessage(shown, 'bot', null, false);
                this.streamingMessageId = msgId;
            } else {
                this.updateMessage(msgId, shown, null);
            }
            this.scrollToBottom();
        };

        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                let idx;
                while ((idx = buffer.indexOf('\n\n')) !== -1) {
                    const frame = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);
                    const parsed = this.parseSseFrame(frame);
                    if (!parsed) continue;
                    if (parsed.event === 'token' && parsed.data && parsed.data.t) {
                        pending += parsed.data.t;
                        flush(false);
                    } else if (parsed.event === 'done') {
                    // Authoritative text is now in place - persist it
                    // synchronously; the debounced save can lose the
                    // final frame if the component is torn down.
                    try { this.saveHistory(); } catch (e) {}
                        final = parsed.data;
                    }
                }
            }
        } catch (e) {
            // Cancelled mid-stream: keep whatever was already shown.
            flush(true);
            if (e && e.name === 'AbortError') {
                this.streamingMessageId = null;
                throw e;
            }
        }

        flush(true);

        // The `done` event is authoritative: scrubbed, degeneracy-checked and
        // converted to HTML on the server. Swap it in for the raw tokens.
        if (final) {
            const finalText = final.answer_html || final.answer || shown;
            if (msgId === null) {
                // No tokens arrived (a short answer sent as `done` only) —
                // create the bubble now, already populated.
                this.isThinking = false;
                this.stopThinking();
                msgId = this.addMessage(finalText, 'bot', null, false);
            } else {
                this.updateMessage(msgId, finalText, null);
            }
        }
        this.isThinking = false;
        this.stopThinking();
        this.streamingMessageId = null;
        this.scrollToBottom();
        return { __streamed: true, ...(final || {}) };
    }

    parseSseFrame(frame) {
        let event = 'message';
        let data = null;
        const lines = frame.split('\n');
        for (const line of lines) {
            if (line.indexOf('event:') === 0) {
                event = line.slice(6).trim();
            } else if (line.indexOf('data:') === 0) {
                try {
                    data = JSON.parse(line.slice(5).trim());
                } catch (e) {
                    data = null;
                }
            }
        }
        return data === null && event === 'message' ? null : { event, data };
    }

    /** Non-progressive fallback: parse a whole SSE body at once. */
    parseSseBody(raw) {
        const frames = (raw || '').split('\n\n');
        let out = {};
        let text = '';
        for (const f of frames) {
            const p = this.parseSseFrame(f);
            if (!p) continue;
            if (p.event === 'token' && p.data && p.data.t) text += p.data.t;
            if (p.event === 'done') out = p.data || {};
        }
        if (!out.answer && text) out.answer = text;
        return out;
    }

    async apiCall(path, method, body, signal) {        const response = await fetch(this.getApiUrl(path), {
            method: method,
            headers: {
                'Content-Type':  'application/json',
                'Authorization': 'Bearer ' + this.authToken
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: signal
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error('API error ' + response.status + ': ' + errText);
        }

        return await response.json();
    }

    // ── Toast ─────────────────────────────────────
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title:   title,
            message: message,
            variant: variant || 'info',
            mode:    'dismissable'
        }));
    }


    handleClose() {
    console.log('=== TessaAI Child ===');
    console.log('Close button clicked');
    console.log('Dispatching close event...');

    this.dispatchEvent(
        new CustomEvent('close', {
            bubbles: true,
            composed: true
        })
    );

    console.log('Close event dispatched');
}

get userAvatar() {
    return this.userInfo?.user_picture;
}

get hasUserAvatar() {
    return !!this.userInfo?.user_picture;
}

testAdminMenuClick() {

    console.clear();

    console.group('%c🧪 Tessa AI - Shadow DOM Automation Test',
        'color:#4CAF50;font-size:14px;font-weight:bold;');

    try {

        /**
         * Recursive Shadow DOM Search
         */
        const deepQuerySelector = (selector, root = document) => {

            const found = root.querySelector(selector);

            if (found) {
                return found;
            }

            const elements = root.querySelectorAll('*');

            for (const el of elements) {

                if (el.shadowRoot) {

                    const inside = deepQuerySelector(selector, el.shadowRoot);

                    if (inside) {
                        return inside;
                    }

                }

            }

            return null;

        };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 Step 1 : Searching Admin Menu');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const selector = 'a[data-content="Admin"]';

        console.log('Selector :', selector);

        const adminMenu = deepQuerySelector(selector);

        if (!adminMenu) {

            console.error('❌ Admin menu NOT FOUND');

            console.groupEnd();
            return;

        }

        console.log('✅ Admin Menu Found');

        console.log(adminMenu);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Step 2 : Element Information');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        console.table({
            Tag: adminMenu.tagName,
            Title: adminMenu.title,
            Text: adminMenu.innerText.trim(),
            Class: adminMenu.className,
            Href: adminMenu.getAttribute('href'),
            Dataset: JSON.stringify(adminMenu.dataset)
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📍 Step 3 : Scroll Into View');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        adminMenu.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        console.log('✅ Element Scrolled');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🖱️ Step 4 : Dispatch Mouse Events');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(eventName => {

            adminMenu.dispatchEvent(

                new MouseEvent(eventName, {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    view: window
                })

            );

            console.log(`✅ ${eventName} dispatched`);

        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 DOM Automation Completed');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    }
    catch (error) {

        console.error('❌ DOM Automation Failed');

        console.error(error);

    }

    console.groupEnd();

}

}