import { LightningElement, api } from 'lwc';

/**
 * tessaRichText  (v27)
 * --------------------
 * Renders server-produced HTML (`answer_html`) as real rich text, with an
 * optional word-by-word reveal ("typing effect").
 *
 * NO EXTERNAL LIBRARIES. Markdown->HTML and sanitising both happen on the
 * server in response_html.py. Loading marked/DOMPurify in the browser was
 * redundant and fragile (Lightning Web Security blocks UMD bundles), and when
 * that load failed the component fell back to plain text — which is why raw
 * tags were once visible in the chat.
 *
 * HOW THE TYPING EFFECT WORKS
 * You cannot reveal HTML character-by-character — you would render broken
 * markup like "<stro". Instead the full HTML is painted immediately (so the
 * structure, lists and tables are always valid), then every text node is
 * blanked and refilled word by word. It reads exactly like ChatGPT while the
 * DOM is never in an invalid state.
 *
 * The reveal is DURATION-SCALED, not fixed-per-word: a short answer and a long
 * one both finish in roughly the same time, so a 300-word guide never takes
 * 30 seconds to appear.
 */

const ALLOWED_TAGS = new Set([
    'P', 'BR', 'HR', 'SPAN', 'DIV',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'INS', 'MARK', 'SUB', 'SUP', 'SMALL',
    'BLOCKQUOTE', 'PRE', 'CODE',
    'UL', 'OL', 'LI',
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION',
    'A'
]);

const ALLOWED_ATTRS = {
    A: ['href', 'title'],
    TD: ['colspan', 'rowspan'],
    TH: ['colspan', 'rowspan'],
    OL: ['start']
};

// Presentational CSS only — this is what keeps coloured / highlighted text.
const ALLOWED_STYLE = ['color', 'background-color', 'text-align', 'font-weight', 'text-decoration'];

const HTMLISH = /<(?:p|div|h[1-6]|ul|ol|li|table|tr|td|th|strong|b|em|i|br|hr|a|code|pre|blockquote|span|mark)\b/i;
const BAD_URL = /^\s*(?:javascript|data|vbscript):/i;

// Reveal tuning.
const TICK_MS        = 28;    // frame interval
const TARGET_MS      = 1600;  // roughly how long a full reveal should take
const MIN_WORDS_TICK = 1;

export default class TessaRichText extends LightningElement {
    _content  = '';
    _typing   = false;
    _timer    = null;
    _queue    = [];      // [{ node, full, words, shown }]
    _typedFor = null;    // content already animated (prevents replays)

    @api
    get content() {
        return this._content;
    }
    set content(value) {
        this._content = value === null || value === undefined ? '' : String(value);
        this.paint();
    }

    @api
    get typing() {
        return this._typing;
    }
    set typing(value) {
        this._typing = value === true;
    }

    /** Public: finish instantly (used by the chat's Stop button). */
    @api
    completeTyping() {
        this.stopTimer();
        for (const item of this._queue) {
            item.node.nodeValue = item.full;
        }
        this._queue = [];
        this.notifyDone();
    }

    renderedCallback() {
        this.paint();
    }

    disconnectedCallback() {
        this.stopTimer();
        const host = this.template.querySelector('.rich-content');
        if (host) host.innerHTML = '';
    }

    // ── rendering ──────────────────────────────────────────────
    paint() {
        const host = this.template.querySelector('.rich-content');
        if (!host) return;

        const raw = this._content;

        // Already painted this exact content — don't repaint or replay.
        if (host.dataset.painted === raw) return;
        host.dataset.painted = raw;

        this.stopTimer();
        this._queue = [];

        if (!raw) {
            host.textContent = '';
            return;
        }

        // Plain text (no markup): keep it escaped, but honour line breaks.
        if (!HTMLISH.test(raw)) {
            host.textContent = '';
            const lines = raw.split('\n');
            lines.forEach((line, i) => {
                host.appendChild(document.createTextNode(line));
                if (i < lines.length - 1) host.appendChild(document.createElement('br'));
            });
        } else {
            try {
                host.innerHTML = this.clean(raw);
            } catch (e) {
                host.textContent = raw;   // never lose the message
            }
        }

        // Animate only for a fresh answer, and only once per content.
        if (this._typing && this._typedFor !== raw) {
            this._typedFor = raw;
            this.startTyping(host);
        }
    }

    // ── typing effect ──────────────────────────────────────────
    startTyping(host) {
        // Collect every text node, remember its text, then blank it.
        const queue = [];
        let totalWords = 0;
        try {
            const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null, false);
            let n = walker.nextNode();
            while (n) {
                const full = n.nodeValue || '';
                if (full.trim()) {
                    // Split keeping trailing whitespace so spacing is exact.
                    const words = full.match(/\S+\s*/g) || [full];
                    queue.push({ node: n, full: full, words: words, shown: 0 });
                    totalWords += words.length;
                }
                n = walker.nextNode();
            }
        } catch (e) {
            return;   // TreeWalker unavailable — content is already fully visible
        }

        if (!queue.length) {
            this.notifyDone();
            return;
        }

        for (const item of queue) item.node.nodeValue = '';
        this._queue = queue;

        // Scale so short and long answers take about the same wall time.
        const ticks = Math.max(1, Math.round(TARGET_MS / TICK_MS));
        const perTick = Math.max(MIN_WORDS_TICK, Math.ceil(totalWords / ticks));

        let qi = 0;
        let sinceScroll = 0;

        const step = () => {
            let budget = perTick;
            while (budget > 0 && qi < this._queue.length) {
                const item = this._queue[qi];
                if (item.shown >= item.words.length) {
                    item.node.nodeValue = item.full;   // exact original text
                    qi++;
                    continue;
                }
                const take = Math.min(budget, item.words.length - item.shown);
                item.shown += take;
                budget -= take;
                item.node.nodeValue = item.words.slice(0, item.shown).join('');
            }
            return qi >= this._queue.length;
        };

        // Reveal the first batch SYNCHRONOUSLY. Without this the bubble paints
        // blank and stays blank until the first timer tick — the empty white
        // bubble that appears between "Thinking" and the text.
        if (step()) {
            this.completeTyping();
            return;
        }

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._timer = setInterval(() => {
            const done = step();

            sinceScroll++;
            if (sinceScroll >= 6) {
                sinceScroll = 0;
                this.dispatchEvent(new CustomEvent('typingtick', { bubbles: true, composed: true }));
            }

            if (done) {
                this.completeTyping();
            }
        }, TICK_MS);
    }

    stopTimer() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    notifyDone() {
        this.dispatchEvent(new CustomEvent('typingdone', { bubbles: true, composed: true }));
    }

    // ── sanitising (defence in depth) ──────────────────────────
    /**
     * Parse with DOMParser (inert — does not execute scripts or load
     * resources), strip anything not on the allow-list, return safe HTML.
     */
    clean(dirty) {
        const doc = new DOMParser().parseFromString(
            '<body><div id="tr-root">' + dirty + '</div></body>', 'text/html');
        const root = doc.getElementById('tr-root');
        if (!root) return '';
        this.walk(root);
        return root.innerHTML;
    }

    walk(node) {
        const children = Array.prototype.slice.call(node.childNodes);
        for (const child of children) {
            if (child.nodeType === 3) continue;          // text — safe
            if (child.nodeType !== 1) {                  // comments etc.
                node.removeChild(child);
                continue;
            }
            const tag = child.tagName.toUpperCase();

            if (!ALLOWED_TAGS.has(tag)) {
                // Unwrap: keep the text, drop the tag.
                while (child.firstChild) node.insertBefore(child.firstChild, child);
                node.removeChild(child);
                continue;
            }

            const allowed = ALLOWED_ATTRS[tag] || [];
            const attrs = Array.prototype.slice.call(child.attributes);
            for (const attr of attrs) {
                const name = attr.name.toLowerCase();

                if (name === 'style') {
                    const kept = [];
                    String(attr.value || '').split(';').forEach((decl) => {
                        const idx = decl.indexOf(':');
                        if (idx === -1) return;
                        const prop = decl.slice(0, idx).trim().toLowerCase();
                        const val = decl.slice(idx + 1).trim();
                        if (ALLOWED_STYLE.indexOf(prop) !== -1 &&
                            !/url\s*\(|expression\s*\(|javascript:/i.test(val)) {
                            kept.push(prop + ': ' + val);
                        }
                    });
                    if (kept.length) child.setAttribute('style', kept.join('; '));
                    else child.removeAttribute('style');
                    continue;
                }

                if (allowed.indexOf(name) === -1) {      // drops on* handlers too
                    child.removeAttribute(attr.name);
                    continue;
                }
                if (name === 'href' && BAD_URL.test(attr.value)) {
                    child.removeAttribute(attr.name);
                }
            }

            if (tag === 'A') {
                child.setAttribute('target', '_blank');
                child.setAttribute('rel', 'noopener noreferrer nofollow');
            }

            this.walk(child);
        }
    }
}