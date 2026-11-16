import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getSignatures      from '@salesforce/apex/TsignStampController.getSignatures';
import saveSignature      from '@salesforce/apex/TsignStampController.saveSignature';
import deleteSignature    from '@salesforce/apex/TsignStampController.deleteSignature';
import setDefaultSignature from '@salesforce/apex/TsignStampController.setDefaultSignature';
import getOrg from '@salesforce/apex/TsignUserManagementController.getOrg';

const AWS_DELETE_URL = 'https://tesseractapps.com/delete-file';

/**
 * Replace behaviour (DocuSign style):
 *   false → one signature PER METHOD (one Type, one Draw, one Upload).
 *           Saving a new one of same method replaces the old one.
 *   true  → ONE signature TOTAL. Any new save replaces whatever exists.
 */
const ONE_SIGNATURE_ONLY = false;

const backend = {
    async load() {
        const rows = await getSignatures();
        return (rows || []).map(r => ({
            id:          r.Id,
            fullName:    r.Name,
            initials:    r.Initials__c || '',
            method:      r.Method__c || 'Type',
            styleId:     r.Style_Id__c || null,
            dataUrl:     r.AWS_URL__c,
            awsKey:      r.AWS_Key__c,
            signatureJson: r.Signature_JSON__c, // <-- NEW: Store the JSON
            isDefault:   !!r.Is_Default__c,
            createdDate: new Date(r.CreatedDate).toLocaleDateString()
        }));
    },
    async save(sig) {
        const rec = await saveSignature({
            recordId:  null,
            fullName:  sig.fullName,
            initials:  sig.initials,
            method:    sig.method,
            styleId:   sig.styleId,
            imageUrl:  sig.dataUrl,
            imageKey:  sig.awsKey,
           signatureJson: sig.signatureJson, // <-- NEW
            isDefault: sig.isDefault === true
        });
        return { ...sig, id: rec.Id };
    },
    async update(sig) {
        const rec = await saveSignature({
            recordId:  sig.id,
            fullName:  sig.fullName,
            initials:  sig.initials,
            method:    sig.method,
            styleId:   sig.styleId,
            imageUrl:  sig.dataUrl,
            imageKey:  sig.awsKey,
            signatureJson: sig.signatureJson, // <-- NEW
            isDefault: sig.isDefault === true
        });
        return { ...sig, id: rec.Id };
    },
    async remove(id) {
        await deleteSignature({ recordId: id });
        return id;
    },
    async setDefault(id) {
        await setDefaultSignature({ recordId: id });
        return id;
    }
};

const FONT_STYLES = [
    'adage-script-jf', 'adobe-handwriting-ernie', 'adobe-handwriting-frank', 'adobe-handwriting-tiffany',
    'adore-you', 'adore-you-slanted', 'adorn-bouquet', 'adorn-coronet', 'adorn-garland', 'adorn-pomander',
    'adventures-unlimited', 'alana-smooth', 'altesse-std-24pt', 'altesse-std-64pt', 'antiquarian-scribe',
    'avalon', 'farnham-text', 'filmotype-jade', 'filmotype-kitten', 'handsome-pro', 'handsome-pro-classic',
    'handsome-pro-nib', 'handsome-pro-rough', 'limon-bold-marker', 'limon-bold-marker-outline',
    'limon-regular', 'limon-regular-marker', 'limon-regular-marker-outline', 'limon-script',
    'limon-script-regular-outline', 'lindsey-signature', 'logic-monoscript', 'logic-monospace', 'mina',
    'p22-allyson-pro', 'p22-cezanne-pro', 'p22-typewriter', 'parfumerie-script', 'professor', 'recherche',
    'rizado-script', 'salamat', 'sanvito-pro', 'sanvito-pro-caption', 'sanvito-pro-display',
    'sanvito-pro-subhead', 'shabby-chic', 'timberline', 'voluta-script-pro', 'youngblood'
];

const GOOGLE_FONT_MAPPING = {
    'adage-script-jf': "'Dancing Script', cursive",
    'adobe-handwriting-ernie': "'Caveat', cursive",
    'adobe-handwriting-frank': "'Patrick Hand', cursive",
    'adobe-handwriting-tiffany': "'Indie Flower', cursive",
    'adore-you': "'Sacramento', cursive",
    'adore-you-slanted': "'Sacramento', cursive",
    'adorn-bouquet': "'Pinyon Script', cursive",
    'adorn-coronet': "'Pinyon Script', cursive",
    'adorn-garland': "'Pinyon Script', cursive",
    'adorn-pomander': "'Pinyon Script', cursive",
    'adventures-unlimited': "'Kalam', cursive",
    'alana-smooth': "'Marck Script', cursive",
    'altesse-std-24pt': "'Great Vibes', cursive",
    'altesse-std-64pt': "'Great Vibes', cursive",
    'antiquarian-scribe': "'MedievalSharp', cursive",
    'avalon': "'Alex Brush', cursive",
    'farnham-text': "'Tangerine', cursive",
    'filmotype-jade': "'Cookie', cursive",
    'filmotype-kitten': "'Satisfy', cursive",
    'handsome-pro': "'Yellowtail', cursive",
    'handsome-pro-classic': "'Yellowtail', cursive",
    'handsome-pro-nib': "'Yellowtail', cursive",
    'handsome-pro-rough': "'Yellowtail', cursive",
    'limon-bold-marker': "'Permanent Marker', cursive",
    'limon-bold-marker-outline': "'Permanent Marker', cursive",
    'limon-regular': "'Permanent Marker', cursive",
    'limon-regular-marker': "'Permanent Marker', cursive",
    'limon-regular-marker-outline': "'Permanent Marker', cursive",
    'limon-script': "'Parisienne', cursive",
    'limon-script-regular-outline': "'Parisienne', cursive",
    'lindsey-signature': "'Mrs Saint Delafield', cursive",
    'logic-monoscript': "'Courier Prime', monospace",
    'logic-monospace': "'Courier Prime', monospace",
    'mina': "'Allura', cursive",
    'p22-allyson-pro': "'Poiret One', cursive",
    'p22-cezanne-pro': "'Lobster', cursive",
    'p22-typewriter': "'Special Elite', cursive",
    'parfumerie-script': "'Leckerli One', cursive",
    'professor': "'Cutive', serif",
    'recherche': "'Mr De Haviland', cursive",
    'rizado-script': "'Clicker Script', cursive",
    'salamat': "'Ruthie', cursive",
    'sanvito-pro': "'Italianno', cursive",
    'sanvito-pro-caption': "'Italianno', cursive",
    'sanvito-pro-display': "'Italianno', cursive",
    'sanvito-pro-subhead': "'Italianno', cursive",
    'shabby-chic': "'Niconne', cursive",
    'timberline': "'Rye', serif",
    'voluta-script-pro': "'Herr Von Muellerhoff', cursive",
    'youngblood': "'Fugaz One', cursive"
};

export default class SignatureTab extends LightningElement {
    @track signatures = [];
    @track showForm = false;
    @track activeTab = 'Choose';

    // ─── Form State ───
    @track fullName = '';
    @track initials = '';
    @track editingId = null;
    @track selectedStyleId = 'style-0';
    @track capturedDataUrl = null;
    @track capturedMethod = 'Type';
    @track uploadedImageUrl = null;

    // ─── AWS Upload State ───
    @track isFileExpand = false;
    @track isLogoLoading = false;
    uploadRecordId = null;
    uploadedFile = null;
    _uploadResolve = null;

    // ─── In-modal replace confirm (LightningConfirm renders UNDER native <dialog>) ───
    @track showReplaceConfirm = false;
    @track replaceTitle = '';
    @track replaceMessage = '';
    _confirmResolve = null;

    // ─── Replace-in-place state ───
    _replaceTargetId   = null;
    _replaceTargetKey  = null;
    _replaceWasDefault = false;

    // Old S3 locator for update
    oldSigUrl = '';
    oldSigKey = '';

    canvasReady = false;
    drawing = false;
    hasInk = false;
    @track currentUserOrgId = ''; // Ensure this is populated in connectedCallback
    @track tempNewJson = null;

    async connectedCallback() {
        this.loadFonts();
        try {
            this.isLogoLoading = true;
            const rows = await backend.load();
            this.signatures = rows;
             this.loadOrgId();
            console.log('[SIG-INIT] loaded signatures:', JSON.parse(JSON.stringify(rows)));
        } catch (e) {
            console.error('[SIG-INIT] load failed', e);
            this.toast('Error', e.body ? e.body.message : 'Could not load signatures.', 'error');
        } finally {
            this.isLogoLoading = false;
        }
    }

     async loadOrgId() {
        try {
            const orgList = await getOrg();
            if (orgList && orgList.length > 0) {
                this.currentUserOrgId = orgList[0].Id;
                console.log('org Id'+this.orgId);
            }
        } catch (error) {
            console.error('Error loading org:', error);
        }
}


    renderedCallback() {
        if (!this.showForm || this.canvasReady) return;
        if (this.isDrawTab) {
            this.setupDrawCanvas();
            this.canvasReady = true;
        }
    }

    // ─── Getters ───
    get hasSignatures()   { return this.signatures.length > 0; }
    get showListSection() { return this.hasSignatures && !this.showForm; }
    get showEmptyState()  { return !this.hasSignatures && !this.showForm; }
    get isChooseTab()     { return this.activeTab === 'Choose'; }
    get isDrawTab()       { return this.activeTab === 'Draw'; }
    get isUploadTab()     { return this.activeTab === 'Upload'; }
    get isDrawnSelected() { return this.selectedStyleId === 'drawn'; }

    // Hide (not remove) form while confirm shows → inputs + canvas state kept
    get modalContentClass() {
        return this.showReplaceConfirm ? 'sig-modal-content sig-hidden' : 'sig-modal-content';
    }

    get isEditMode() { return this.editingId !== null; }
    get modalTitle() { return this.isEditMode ? 'Edit Your Signature' : 'Create Your Signature'; }

    // Single source of truth for method, derived from current selection
    get currentMethod() {
        if (this.selectedStyleId === 'drawn')    return 'Draw';
        if (this.selectedStyleId === 'uploaded') return 'Upload';
        return 'Type';
    }

    get isSaveDisabled() {
        if (this.isLogoLoading) return true;
        if (!this.fullName.trim() || !this.initials.trim()) return true;

        // ── Explicit tab-based guard (belt + suspenders) ──
        if (this.isDrawTab) {
            return !this.capturedDataUrl;      // must have drawn something
        }
        if (this.isUploadTab) {
            return !this.uploadedImageUrl;     // must have uploaded something
        }

        // Choose tab — style radio is always selected by default
        return !this.selectedStyleId || !this.selectedStyleId.startsWith('style-');
    }

    get signatureCountLabel() {
        const n = this.signatures.length;
        if (n === 0) return 'No saved signatures';
        if (n === 1) return '1 saved signature';
        return `${n} saved signatures`;
    }

    get chooseTabClass() { return this.activeTab === 'Choose' ? 'sig-ds-tab active' : 'sig-ds-tab'; }
    get drawTabClass()   { return this.activeTab === 'Draw'   ? 'sig-ds-tab active' : 'sig-ds-tab'; }
    get uploadTabClass() { return this.activeTab === 'Upload' ? 'sig-ds-tab active' : 'sig-ds-tab'; }

    get availableStyles() {
        return FONT_STYLES.map((fontClass, index) => {
            const id = `style-${index}`;
            const isSelected = this.selectedStyleId === id;

            const displayName = this.fullName.trim() || 'Your Name';
            const displayInitials = this.initials.trim() || 'IN';
            const fontFamily = GOOGLE_FONT_MAPPING[fontClass] || `'${fontClass}', cursive`;

            const combinedDisplay = `${displayName} . ${displayInitials}`;

            return {
                id,
                isSelected,
                displayCombined: combinedDisplay,
                cardClass: isSelected ? 'sig-style-card selected' : 'sig-style-card',
                sigStyleInline: `font-family: ${fontFamily}; font-size: 32px; color: #111; line-height: 1.2; padding-bottom: 4px;`,
                sigImageClass: 'sig-preview-text'
            };
        });
    }

    get drawnCardClass() { return this.selectedStyleId === 'drawn' ? 'sig-style-card selected' : 'sig-style-card'; }

    // ─── Modal Actions ───
    handleModalToggle(event) {
        this.showForm = event.target.open;
        // dialog closed (Esc etc.) while confirm pending → resolve false so handleSave never hangs
        if (!event.target.open) this._closeConfirm(false);
    }

    /**
     * Opens the <dialog> and forces it into the browser top layer.
     * The close + reopen on a microtask ensures it wins over any
     * Salesforce wrapper (community popup / console tab / overlay)
     * that may share the top layer.
     */
    _openModal() {
        const dlg = this.refs.sigModal;
        if (!dlg) return;
        try { dlg.close(); } catch (e) { /* not open — fine */ }
        Promise.resolve().then(() => {
            try { dlg.showModal(); } catch (e) { console.warn('[SIG-MODAL] showModal failed', e); }
        });
    }

    openForm() {
        this.resetForm();
        this.editingId = null;
        this._openModal();
    }

    handleEdit(event) {
        const id = event.currentTarget.dataset.id;
        const sigToEdit = this.signatures.find(s => s.id === id);
        if (!sigToEdit) return;

        this.resetForm();
        this.editingId = sigToEdit.id;
        this.fullName   = sigToEdit.fullName;
        this.initials   = sigToEdit.initials || '';
        this.oldSigUrl  = sigToEdit.dataUrl || '';
        this.oldSigKey  = sigToEdit.awsKey || '';
        this.tempNewJson = sigToEdit.signatureJson || null;

        if (sigToEdit.method === 'Type') {
            this.activeTab = 'Choose';
            this.capturedMethod = 'Type';
            this.selectedStyleId = (sigToEdit.styleId && FONT_STYLES.includes(sigToEdit.styleId))
                ? `style-${FONT_STYLES.indexOf(sigToEdit.styleId)}`
                : 'style-0';
        } else if (sigToEdit.method === 'Draw') {
            this.activeTab = 'Draw';
            this.capturedMethod = 'Draw';
            this.selectedStyleId = 'drawn';
            this.capturedDataUrl = sigToEdit.dataUrl;
        } else if (sigToEdit.method === 'Upload') {
            this.activeTab = 'Upload';
            this.capturedMethod = 'Upload';
            this.selectedStyleId = 'uploaded';
            this.uploadedImageUrl = sigToEdit.dataUrl;
        }

        this._openModal();
    }

    handleCancel() {
        if (this.isLogoLoading) return;
        const dlg = this.refs.sigModal;
        if (dlg) dlg.close();
        this.isFileExpand = false;
        this.uploadedFile = null;
        this.uploadRecordId = null;
        this._uploadResolve = null;
        this._replaceTargetId   = null;
        this._replaceTargetKey  = null;
        this._replaceWasDefault = false;
    }

    resetForm() {
        this.fullName = '';
        this.initials = '';
        this.editingId = null;
        this.selectedStyleId = 'style-0';
        this.capturedDataUrl = null;
        this.capturedMethod = 'Type';
        this.uploadedImageUrl = null;
        this.activeTab = 'Choose';
        this.canvasReady = false;
        this.hasInk = false;
        this.oldSigUrl = '';
        this.oldSigKey = '';
        this.uploadedFile = null;
        this.uploadRecordId = null;
        this.isFileExpand = false;
        this.isLogoLoading = false;
        this._replaceTargetId   = null;
        this._replaceTargetKey  = null;
        this._replaceWasDefault = false;
    }

    handleTabClick(event) {
        const tab = event.target.dataset.tab;
        if (tab === 'Choose' && this.isChooseTabDisabled) {
            this.toast(
                'Typed signature exists',
                'You already have a typed signature. Edit it, or use Draw / Upload.',
                'warning'
            );
            return;
        }
        this.activeTab = tab;
        this.canvasReady = false;

        // ── Sync the "selection" to the tab so isSaveDisabled and handleSave
        //    use the correct branch even before the user has drawn/uploaded anything.
        if (tab === 'Draw') {
            this.selectedStyleId = 'drawn';
            this.capturedMethod  = 'Draw';
        } else if (tab === 'Upload') {
            this.selectedStyleId = 'uploaded';
            this.capturedMethod  = 'Upload';
        } else {
            // Choose — fall back to whatever style was previously selected
            if (!this.selectedStyleId.startsWith('style-')) {
                this.selectedStyleId = 'style-0';
                this.capturedMethod  = 'Type';
            }
        }
    }

    handleNameChange(event)     { this.fullName = event.target.value; }
    handleInitialsChange(event) { this.initials = event.target.value; }

    handleStyleSelect(event) {
        this.selectedStyleId = event.target.value;
        this.capturedMethod = this.currentMethod;
    }

    // ─── Draw canvas ───
    setupDrawCanvas() {
        const canvas = this.template.querySelector('.draw-canvas');
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = canvas.offsetWidth * dpr;
        canvas.height = 180 * dpr;
        this.drawCanvas = canvas;
        this.drawCtx = canvas.getContext('2d');
        this.drawCtx.scale(dpr, dpr);
        this.drawCtx.lineWidth = 2.5;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.strokeStyle = '#111';

        this._start = this.startDraw.bind(this);
        this._move  = this.moveDraw.bind(this);
        this._end   = this.endDraw.bind(this);
        canvas.addEventListener('mousedown',  this._start);
        canvas.addEventListener('mousemove',  this._move);
        canvas.addEventListener('mouseup',    this._end);
        canvas.addEventListener('mouseleave', this._end);
        canvas.addEventListener('touchstart', this._start, { passive: false });
        canvas.addEventListener('touchmove',  this._move,  { passive: false });
        canvas.addEventListener('touchend',   this._end);
    }

    getDrawPos(e) {
        const rect = this.drawCanvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return {
            x: ((src.clientX - rect.left) / rect.width) * this.drawCanvas.offsetWidth,
            y: ((src.clientY - rect.top)  / rect.height) * 180
        };
    }

    startDraw(e) {
        e.preventDefault();
        this.drawing = true;
        const p = this.getDrawPos(e);
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(p.x, p.y);
    }

    moveDraw(e) {
        if (!this.drawing) return;
        e.preventDefault();
        const p = this.getDrawPos(e);
        this.drawCtx.lineTo(p.x, p.y);
        this.drawCtx.stroke();
        this.hasInk = true;
        this.capturedDataUrl = this.drawCanvas.toDataURL('image/png');
        if (this.selectedStyleId !== 'drawn') {
            this.selectedStyleId = 'drawn';
            this.capturedMethod = 'Draw';
        }
    }

    endDraw() { this.drawing = false; }

    handleClearDraw() {
        if (!this.drawCanvas) return;
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.hasInk = false;
        this.capturedDataUrl = null;
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return this.toast('Invalid file', 'Please select an image.', 'error');
        const reader = new FileReader();
        reader.onload = () => {
            this.uploadedImageUrl = reader.result;
            this.selectedStyleId = 'uploaded';
            this.capturedMethod = 'Upload';
        };
        reader.readAsDataURL(file);
    }

    // ─── In-modal confirm for replace (stays inside dialog top layer) ───
    confirmReplace(existing) {
        const kind = { Type: 'choose', Draw: 'drawn', Upload: 'uploaded' }[existing.method] || '';
        const what = ONE_SIGNATURE_ONLY ? 'a signature' : `a ${kind} signature`;
        this.replaceTitle = ONE_SIGNATURE_ONLY ? 'Replace signature?' : `Replace ${kind} signature?`;
        this.replaceMessage =
            `You already have ${what} ("${existing.fullName}"). ` +
            `Do you want to replace it with this new one? ` +
            `The existing signature will be deleted.`;
        this.showReplaceConfirm = true;
        return new Promise((resolve) => { this._confirmResolve = resolve; });
    }

    handleReplaceYes() { this._closeConfirm(true); }
    handleReplaceNo()  { this._closeConfirm(false); }

    _closeConfirm(result) {
        this.showReplaceConfirm = false;
        const r = this._confirmResolve;
        this._confirmResolve = null;
        if (r) r(result);
    }

    // Find existing sig that new save should replace
    findReplaceTarget() {
        const method = this.currentMethod;
        return this.signatures.find(s =>
            (ONE_SIGNATURE_ONLY || s.method === method) &&
            (!this.isEditMode || s.id !== this.editingId)
        );
    }

    // ─── Save: confirm replace → build dataUrl → upload to AWS → persist → delete old ───
    async handleSave() {
        if (this.isLogoLoading) return;

        if (this.isDrawTab && !this.capturedDataUrl) {
            this.toast('Signature required', 'Please draw your signature before saving.', 'error');
            return;
        }
        // ── Guard: block save if user is on Upload tab with no file ──
        if (this.isUploadTab && !this.uploadedImageUrl) {
            this.toast('Signature required', 'Please upload an image of your signature before saving.', 'error');
            return;
        }

        console.group('[SIG-SAVE] start');
        console.log('isEditMode:', this.isEditMode,
                    '| editingId:', this.editingId,
                    '| selectedStyleId:', this.selectedStyleId,
                    '| method:', this.currentMethod,
                    '| oldSigKey:', this.oldSigKey);

        // ─── Replace guard (any method) ───
        const existingSame = this.findReplaceTarget();
        if (existingSame) {
            const replace = await this.confirmReplace(existingSame);
            if (!replace) {
                console.log('[SIG-SAVE] user cancelled replace');
                console.groupEnd();
                return;
            }
            this._replaceTargetId   = existingSame.id;
            this._replaceTargetKey  = existingSame.awsKey;
            this._replaceWasDefault = existingSame.isDefault;
            console.log('[SIG-SAVE] will replace sig:', this._replaceTargetId);
        }

        try {
            // Phase 1 — build the data URL
            let finalDataUrl = this.capturedDataUrl;

            if (this.selectedStyleId.startsWith('style-')) {
                finalDataUrl = this.generateStyleImage();
            } else if (this.selectedStyleId === 'uploaded') {
                finalDataUrl = this.uploadedImageUrl;
            }

            if (!finalDataUrl) {
                this.toast('Error', 'Please generate a signature first.', 'error');
                return;
            }

            console.log('[SIG-SAVE] finalDataUrl length:', finalDataUrl.length,
                        '| mime:', (/^data:(.*?);/.exec(finalDataUrl) || [])[1]);

            const file = await this.dataUrlToFile(finalDataUrl, this.buildFileName());
            console.log('[SIG-SAVE] file:', { name: file.name, type: file.type, size: file.size });

            // Phase 2 — upload to AWS
            this.isLogoLoading = true;
            this.uploadedFile = null;
            this.uploadRecordId = this.uploadRecordId || this.makeRecordId();
            this.isFileExpand = true;

          //  await this.waitForChildAndUpload(file);
              await this.uploadToChildComponent(file);
            if (!this.uploadedFile || !this.uploadedFile.url) {
                throw new Error('Upload did not complete.');
            }
            console.log('[SIG-SAVE] upload returned:', JSON.parse(JSON.stringify(this.uploadedFile)));

            // Phase 3 — build the record
            let savedStyleId = null;
            if (this.selectedStyleId.startsWith('style-')) {
                savedStyleId = FONT_STYLES[parseInt(this.selectedStyleId.replace('style-', ''), 10)];
            }

            const existing = this.isEditMode
                ? this.signatures.find(s => s.id === this.editingId)
                : null;

            const sig = {
                id: this.isEditMode ? this.editingId : this.generateId(),
                fullName: this.fullName.trim(),
                initials: this.initials.trim(),
                method: this.currentMethod,
                styleId: savedStyleId,
                dataUrl: this.uploadedFile.url,
                awsKey: this.uploadedFile.key,
                signatureJson: this.tempNewJson, // <-- Pass the JSON string
                // inherit default flag from replaced sig
                isDefault: existing
                    ? (existing.isDefault || this._replaceWasDefault)
                    : (this.signatures.length === 0 || this._replaceWasDefault),
                createdDate: existing ? existing.createdDate : new Date().toLocaleDateString()
            };
            console.log('[SIG-SAVE] record to persist:', JSON.parse(JSON.stringify(sig)));

            // Phase 4 — persist
            if (this.isEditMode) {
                this.signatures = this.signatures.map(s => s.id === sig.id ? sig : s);
                const saved = await backend.update(sig);
                console.log('[SIG-SAVE] backend.update returned:', JSON.parse(JSON.stringify(saved)));
            } else {
                this.signatures = [sig, ...this.signatures];
                const saved = await backend.save(sig);
                console.log('[SIG-SAVE] backend.save returned:', JSON.parse(JSON.stringify(saved)));
                // swap local uuid for real Salesforce Id
                this.signatures = this.signatures.map(s =>
                    s.id === sig.id ? { ...s, id: saved.id } : s
                );
                sig.id = saved.id;
            }

            // Phase 5 — delete old S3 object (edit mode, image changed)
            if (this.isEditMode && this.oldSigKey && this.oldSigKey !== sig.awsKey) {
                console.log('[SIG-SAVE] deleting old S3 key:', this.oldSigKey);
                await this.deleteOldFileFromAWS(this.oldSigKey);
            } else {
                console.log('[SIG-SAVE] skipped old-key delete');
            }

            // Phase 5b — replace flow: delete replaced record + its S3 file
            if (this._replaceTargetId && this._replaceTargetId !== sig.id) {
                try {
                    await backend.remove(this._replaceTargetId);
                    this.signatures = this.signatures.filter(s => s.id !== this._replaceTargetId);

                    if (this._replaceTargetKey && this._replaceTargetKey !== sig.awsKey) {
                        await this.deleteOldFileFromAWS(this._replaceTargetKey);
                    }
                    console.log('[SIG-SAVE] replaced old sig:', this._replaceTargetId);
                } catch (e) {
                    console.warn('[SIG-SAVE] replace cleanup failed', e);
                }
            }

            this.toast('Success', this.isEditMode ? 'Signature updated.' : 'Signature saved.', 'success');
            const dlg = this.refs.sigModal;
            if (dlg) dlg.close();

        } catch (e) {
            console.error('[SIG-SAVE] FAILED', e);
            this.toast('Error', this.readApexError(e), 'error');
        } finally {
            this.isLogoLoading = false;
            this.isFileExpand = false;
            this._replaceTargetId   = null;
            this._replaceTargetKey  = null;
            this._replaceWasDefault = false;
            console.groupEnd();
        }
    }

    generateStyleImage() {
        const index = parseInt(this.selectedStyleId.replace('style-', ''), 10);
        const fontClass = FONT_STYLES[index];
        const fontFamily = GOOGLE_FONT_MAPPING[fontClass] || `'${fontClass}', cursive`;

        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 250;
        const ctx = canvas.getContext('2d');

        // 1. White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Ink color and text alignment
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'middle';

        // 3. Set the font size
        ctx.font = `64px ${fontFamily}`;

        // 4. Combine Name and Initials into one line separated by a dot
        const nameText = this.fullName.trim();
        const initialsText = this.initials && this.initials.trim() ? this.initials.trim() : '';

        const combinedText = initialsText ? `${nameText} . ${initialsText}` : nameText;

        // 5. Draw the combined text on the canvas
        ctx.fillText(combinedText, 20, 125);

        // 6. This DataURL is what gets converted to a File and sent to AWS
        return canvas.toDataURL('image/png');
    }

    // ─── dataURL → File ───
    dataUrlToFile(dataUrl, fileName) {
        return new Promise((resolve) => {
            const [meta, b64] = dataUrl.split(',');
            const mimeMatch = /:(.*?);/.exec(meta);
            const mime = mimeMatch ? mimeMatch[1] : 'image/png';
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            resolve(new File([bytes], fileName, { type: mime }));
        });
    }

    buildFileName() {
        const safe = (this.fullName || 'signature')
            .trim().replace(/\s+/g, '_').replace(/[^\w.-]/g, '_');
        return `${safe}_${Date.now()}.png`;
    }

    // ─── Upload to AWS via c-document-office-service ───
  /*   waitForChildAndUpload(file) {
        return new Promise((resolve) => {
            let settled = false;
            const done = () => {
                if (settled) return;
                settled = true;
                this._uploadResolve = null;
                resolve();
            };
            this._uploadResolve = done;

            setTimeout(() => {
                if (!settled) {
                    console.error('[SIG-UPLOAD] timeout — upload did not complete in 60s');
                    done();
                }
            }, 60000);

            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (!svc) {
                    console.error('[SIG-UPLOAD] child component not found in DOM');
                    done();
                    return;
                }
                svc.incomingFiles = [file];
                svc.confirmUpload = true;
            }, 300);
        });
    }

    handleAwsUploadComplete(event) {
        const files = (event.detail && event.detail.files) || [];
        this.uploadedFile = files[0] || null;
        console.log('[SIG-AWS] uploadcomplete →', JSON.parse(JSON.stringify(this.uploadedFile || {})));
        this.isLogoLoading = false;
        if (this._uploadResolve) { this._uploadResolve(); this._uploadResolve = null; }
    } */

    // Replace waitForChildAndUpload with this:
    async uploadToChildComponent(file) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const svc = this.template.querySelector('c-t-signaws-batch-lwc');
            if (!svc) {
                console.error('[SIG-UPLOAD] Child component not found');
                return reject(new Error('Upload component not found'));
            }

            this._uploadResolve = resolve;
            this._uploadReject = reject;

            // 1. Define the upload action
            const doUpload = async () => {
                try {
                    // Remove listener so it doesn't fire multiple times
                    svc.removeEventListener('configload', doUpload);
                    
                    await svc.uploadPayload(file, file.name, 'image/png');
                } catch (e) {
                    console.error('[SIG-UPLOAD] uploadPayload threw error', e);
                    if (this._uploadReject) this._uploadReject(e);
                }
            };

            // 2. If the child is already loaded (e.g. second upload), upload immediately
            if (svc.isConfigLoaded) {
                doUpload();
            } else {
                // 3. Otherwise, wait for the 'configload' event before uploading
                console.log('[SIG-UPLOAD] Waiting for child config to load...');
                svc.addEventListener('configload', doUpload, { once: true });
            }
            
        }, 300); 
    });
}

    // Replace handleAwsUploadComplete with this:
    handleAwsUploadComplete(event) {
        const files = (event.detail && event.detail.files) || [];
        this.uploadedFile = files[0] || null;
        
        // Store the JSON payload from the child component
        if (this.uploadedFile) {
            this.tempNewJson = JSON.stringify(event.detail);
        }
        
        console.log('[SIG-AWS] uploadcomplete →', JSON.parse(JSON.stringify(this.uploadedFile || {})));
        this.isLogoLoading = false;
        
        if (this._uploadResolve) { 
            this._uploadResolve(); 
            this._uploadResolve = null; 
        }
    }

    handleFileDeleted(event) {
        console.log('[SIG-AWS] filedeleted:', JSON.parse(JSON.stringify(event.detail || {})));
        this.isLogoLoading = false;
        this.isFileExpand = false;
        if (this._uploadResolve) { this._uploadResolve(); this._uploadResolve = null; }
    }

    makeRecordId() {
        const ts = Date.now().toString(36);
        const rnd = crypto.getRandomValues(new Uint8Array(6));
        const hex = Array.from(rnd).map(b => b.toString(16).padStart(2, '0')).join('');
        return `rec_${ts}_${hex}`;
    }

    async deleteOldFileFromAWS(key) {
        if (!key) return;
        try {
            const resp = await fetch(AWS_DELETE_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const text = await resp.text();
            console.log('[SIG-AWS-DELETE]', resp.status, text);
        } catch (e) {
            console.error('[SIG-AWS-DELETE] failed', e);
        }
    }

    // ─── List actions ───
    async handleDelete(event) {
        const id = event.currentTarget.dataset.id;
        const removed = this.signatures.find(s => s.id === id);

        try {
            await backend.remove(id);
            console.log('[SIG-LIST] backend.remove returned OK');
        } catch (e) {
            console.warn('[SIG-LIST] backend.remove error', e);
            this.toast('Error', this.readApexError(e), 'error');
            return;
        }

        let next = this.signatures.filter(s => s.id !== id);
        if (removed && removed.isDefault && next.length) {
            next = next.map((s, i) => ({ ...s, isDefault: i === 0 }));
        }
        this.signatures = next;

        if (removed && removed.awsKey) this.deleteOldFileFromAWS(removed.awsKey);

        this.toast('Deleted', 'Signature removed.', 'success');
    }

    async handleSetDefault(event) {
        const id = event.currentTarget.dataset.id;

        try {
            await backend.setDefault(id);
            console.log('[SIG-LIST] backend.setDefault returned OK');
        } catch (e) {
            console.warn('[SIG-LIST] backend.setDefault error', e);
            this.toast('Error', this.readApexError(e), 'error');
            return;
        }

        this.signatures = this.signatures.map(s => ({ ...s, isDefault: s.id === id }));
    }

    // ─── Utilities ───
    loadFonts() {
        if (document.getElementById('sig-fonts')) return;
        const link = document.createElement('link');
        link.id = 'sig-fonts';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Caveat&family=Clicker+Script&family=Cookie&family=Courier+Prime&family=Cutive&family=Dancing+Script&family=Fugaz+One&family=Great+Vibes&family=Herr+Von+Muellerhoff&family=Indie+Flower&family=Italianno&family=Kalam&family=Leckerli+One&family=Lobster&family=Marck+Script&family=MedievalSharp&family=Mr+De+Haviland&family=Mrs+Saint+Delafield&family=Niconne&family=Parisienne&family=Patrick+Hand&family=Permanent+Marker&family=Pinyon+Script&family=Poiret+One&family=Ruthie&family=Rye&family=Sacramento&family=Satisfy&family=Special+Elite&family=Tangerine&family=Yellowtail&display=swap';
        document.head.appendChild(link);
    }

    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'sig-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    }

    readApexError(e) {
        if (!e) return 'Unknown error';
        if (Array.isArray(e.body)) return e.body.map(x => x.message).join(', ');
        if (e.body && e.body.message) return e.body.message;
        if (e.message) return e.message;
        return 'Unknown error';
    }

    toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}