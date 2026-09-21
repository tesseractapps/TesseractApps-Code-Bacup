import { LightningElement, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import QUILL from '@salesforce/resourceUrl/Quill';
import getRecipientDemographicDetails from '@salesforce/apex/myTemplates.getRecipientDemographicDetails';
import jsPDF from '@salesforce/resourceUrl/jspdf';
import html2canvas from '@salesforce/resourceUrl/html2canvas';
import storePdfRecord from '@salesforce/apex/myTemplates.storePdfRecord';
import adobeFonts from '@salesforce/resourceUrl/AdobeFonts';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import QuillPdfRenderEndpoint from '@salesforce/label/c.QuillPdfRenderEndpoint';
import EnvironmentLabel from '@salesforce/label/c.Environment_Label';
const FORCED_MANUAL_TYPES = new Set([
    'date',
    'dateofsigning',
    'initials',
    'signature',
    'time'
]);

/** Exactly the option list used by the Templates Initials dropdown. */
const INITIALS_OPTIONS = [
    { value: '', label: 'Select Initials' },
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Dr', label: 'Dr' }
];

/** Font list used by the Templates "Enter Name for Signature" previews. */
const SIGNATURE_FONT_STYLES = [
    'adage-script-jf', 'adobe-handwriting-ernie', 'adobe-handwriting-frank',
    'adobe-handwriting-tiffany', 'adore-you', 'adore-you-slanted',
    'adorn-bouquet', 'adorn-coronet', 'adorn-garland', 'adorn-pomander',
    'adventures-unlimited', 'alana-smooth', 'altesse-std-24pt',
    'altesse-std-64pt', 'antiquarian-scribe', 'avalon', 'farnham-text',
    'filmotype-jade', 'filmotype-kitten', 'handsome-pro',
    'handsome-pro-classic', 'handsome-pro-nib', 'handsome-pro-rough',
    'limon-bold-marker', 'limon-regular', 'limon-script', 'lindsey-signature',
    'logic-monoscript', 'mina', 'p22-allyson-pro', 'p22-cezanne-pro',
    'p22-typewriter', 'parfumerie-script', 'professor', 'recherche',
    'rizado-script', 'salamat', 'sanvito-pro', 'sanvito-pro-display',
    'shabby-chic', 'timberline', 'voluta-script-pro', 'youngblood'
];

/**
 * On-screen the signature composite is capped at 200px wide
 * (applySignatureToPlaceholder). A Quill Delta image insert has no intrinsic
 * size, so without this the PDF service draws the composite at its full
 * ~580px canvas resolution - the "signature is huge in the PDF" bug. Sent as
 * a Delta image attribute so the high-res image is scaled down into a 200px
 * box rather than downsampled, keeping quality while matching the editor.
 */
const SIGNATURE_PDF_WIDTH_PX = 200;

export default class TesserappsDocumentEditor extends LightningElement {
    @api orgid;
    @api templateData;
    @api sendDocumentForm;
    quillLoaded = false;
    quill = null;
    jsPDFLoaded = false;
    richTextContent = '';
    documentName = '';
    showSuccessModal = false;
    participantTemplateResult = null;
    pages = [];
    isLoading1 = false;
    // Same loading logo assets the documentPageEditor spinner uses.
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    // ─── Signature workflow state (ported from TesseractappstemplatesLwc) ───
    showSignatureModal = false;
    showDrawingModal = false;
    showNameSignatureModal = false;
    styledPreviews = [];
    enteredName = '';
    selectedStyle = null;
    isDrawing = false;
    canvasContext = null;
    activeSignaturePlaceholderId = null;
    sessionGuid = '';
    lastQuillContents = null;
    deletedSignatureForUndo = null;
    quillPdfRenderEndpoint = QuillPdfRenderEndpoint;
    environmentLabel = EnvironmentLabel;
    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    /** Lets documentPageEditor's onback handler return the user to the parent templates table. */
    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    renderedCallback() {
        if (this.quillLoaded) {
            return;
        }
        this.quillLoaded = true;
        this.initializeEditor();
    }

    async initializeEditor() {
        // Covers the library loads, the AWS document fetch and the demographic
        // lookup - until these finish the editor renders empty, which reads as
        // broken rather than loading.
        this.isLoading1 = true;
        try {
            this.sessionGuid = this.generateGUID();

            await Promise.all([
                loadScript(this, QUILL + '/quill.min.js'),
                loadStyle(this, QUILL + '/quill.snow.css'),
                loadScript(this, jsPDF),
                loadScript(this, html2canvas),
                // Signature name fonts - same resource TesseractappstemplatesLwc uses.
                loadStyle(this, adobeFonts).catch(error =>
                    console.warn('[DOCUMENT_EDITOR] AdobeFonts failed to load:', error)
                )
            ]);
            console.log(
                'Document Editor - Quill, html2canvas and jsPDF loaded successfully'
            );
            console.log(
                'jsPDF available:',
                !!window.jspdf
            );
            console.log(
                'html2canvas available:',
                typeof window.html2canvas
            );
            console.log(
                'jsPDF html plugin:',
                typeof window.jspdf?.jsPDF?.prototype?.html
            );
            // Register custom blots before Quill initialization
            this.registerQuillEmbed();
            // Parse Placeholder_JSON__c and load HTML from AWS
            await this.loadTemplateData();
            // Now richTextContent is ready
            this.initializeQuill();

            // Finally populate AUTO demographic values
            await this.loadRecipientDemographics();
        } catch (error) {
            this.quillLoaded = false;
            console.error(
                'Document Editor - Error initializing:',
                error
            );
        } finally {
            this.isLoading1 = false;
        }
    }

    async loadTemplateData() {
        console.log('[DOCUMENT_EDITOR] Loading template data:', this.templateData);
        if (!this.templateData) { console.warn('[DOCUMENT_EDITOR] No templateData received'); return; }
        const placeholderJSON = this.templateData.Placeholder_JSON__c;
        if (!placeholderJSON) { console.warn('[DOCUMENT_EDITOR] Placeholder_JSON__c is empty'); return; }
        try {
            const parsed = typeof placeholderJSON === 'string' ? JSON.parse(placeholderJSON) : placeholderJSON;
            const placeholders = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.placeholders) ? parsed.placeholders : []);
            this.placeholderData = placeholders;
            console.log('[DOCUMENT_EDITOR] Parsed placeholders:', placeholders);
            console.log('[DOCUMENT_EDITOR] Placeholder count:', placeholders.length);
            await this.loadRichTextFromAws();
        } catch (error) {
            console.error('[DOCUMENT_EDITOR] Failed to parse Placeholder_JSON__c:', error);
        }
    }

    async loadRichTextFromAws() {
        const awsUrl = this.templateData?.Amazon_Url__c;
        if (!awsUrl) { console.warn('[DOCUMENT_EDITOR] No Amazon_Url__c found'); return; }
        console.log('[DOCUMENT_EDITOR] Loading rich-text JSON from AWS:', awsUrl);
        try {
            const response = await fetch(awsUrl);
            if (!response.ok) { throw new Error(`AWS JSON request failed: ${response.status}`); }
            const data = await response.json();
            if (!data?.html) { throw new Error('AWS JSON does not contain html'); }
            this.richTextContent = data.html;
            console.log('[DOCUMENT_EDITOR] Rich-text HTML loaded from AWS:', this.richTextContent.length);
        } catch (error) {
            console.error('[DOCUMENT_EDITOR] Failed to load rich-text JSON from AWS:', error);
        }
    }

    registerQuillEmbed() {
        if (!window.Quill) {
            console.error('❌ Document Editor - window.Quill is not defined');
            return;
        }

        try {
            const Embed = window.Quill.import('blots/embed');

            class PlaceholderFieldBlot extends Embed {
                static create(value) {
                    const node = super.create();

                    const id = value.id || ('ph-' + Date.now() + '-' + Math.floor(Math.random() * 1000));

                    node.setAttribute('data-id', id);
                    node.setAttribute('data-type', value.type || '');
                    node.setAttribute('data-label', value.label || '');
                    node.setAttribute('data-demographic-field', value.isDemographicField ? 'true' : 'false');
                    node.setAttribute('data-demographic-source', value.demographicSourceField || value.type || '');
                    // Do NOT default to 'AUTO'. The template builder stores
                    // 'HR_MANUAL' for custom fields; defaulting to AUTO here
                    // would silently turn custom fields into demographic
                    // auto-fill fields during Quill re-normalisation.
                    node.setAttribute('data-demographic-value-mode', value.demographicValueMode || '');
                    node.setAttribute('data-recipient', value.recipient || '');
                    node.setAttribute('data-custom-style', value.customInlineStyle ? 'true' : 'false');

                    const ts = value.textStyle || {};

                    node.setAttribute('data-font-family', ts.fontFamily || 'Arial, Helvetica, sans-serif');
                    node.setAttribute('data-font-size', ts.fontSize || '14');
                    node.setAttribute('data-bold', ts.bold ? 'true' : 'false');
                    node.setAttribute('data-italic', ts.italic ? 'true' : 'false');
                    node.setAttribute('data-underline', ts.underline ? 'true' : 'false');
                    node.setAttribute('data-color', ts.color || '#000000');

                    node.innerText = `[ ${value.label || value.type} ]`;
                    node.contentEditable = 'false';
                    node.classList.add('quill-placeholder-embed');

                    node.style.display = 'inline-block';
                    node.style.padding = '2px 6px';
                    node.style.margin = '0 2px';
                    node.style.borderRadius = '4px';
                    node.style.background = '#e0f2fe';
                    node.style.border = '1px solid #bae6fd';
                    node.style.color = '#0369a1';
                    node.style.fontWeight = 'bold';
                    node.style.cursor = 'pointer';

                    if (value.customInlineStyle === true || value.customInlineStyle === 'true') {
                        node.style.fontFamily = ts.fontFamily || 'Arial, Helvetica, sans-serif';
                        node.style.fontSize = (ts.fontSize || '14') + 'px';
                        node.style.fontWeight = ts.bold ? '700' : '400';
                        node.style.fontStyle = ts.italic ? 'italic' : 'normal';
                        node.style.textDecoration = ts.underline ? 'underline' : 'none';
                        node.style.color = ts.color || '#000000';
                        node.style.background = 'transparent';
                        node.style.border = 'none';
                        node.style.padding = '0';
                        node.style.margin = '0';
                    }

                    return node;
                }

                static value(node) {
                    return {
                        id: node.getAttribute('data-id'),
                        type: node.getAttribute('data-type'),
                        label: node.getAttribute('data-label'),
                        isDemographicField: node.getAttribute('data-demographic-field') === 'true',
                        demographicSourceField: node.getAttribute('data-demographic-source'),
                        demographicValueMode: node.getAttribute('data-demographic-value-mode'),
                        recipient: node.getAttribute('data-recipient'),
                        customInlineStyle: node.getAttribute('data-custom-style') === 'true',
                        textStyle: {
                            fontFamily: node.getAttribute('data-font-family'),
                            fontSize: node.getAttribute('data-font-size'),
                            bold: node.getAttribute('data-bold') === 'true',
                            italic: node.getAttribute('data-italic') === 'true',
                            underline: node.getAttribute('data-underline') === 'true',
                            color: node.getAttribute('data-color')
                        }
                    };
                }
            }

            PlaceholderFieldBlot.blotName = 'placeholder-field';
            PlaceholderFieldBlot.tagName = 'span';
            PlaceholderFieldBlot.className = 'quill-placeholder-embed';

            window.Quill.register(PlaceholderFieldBlot);

            console.log('✅ Document Editor - Placeholder Quill Blot registered');
        } catch (error) {
            console.error('❌ Document Editor - Error registering custom Quill blot:', error);
        }
    }

    initializeQuill() {
        const editorElement = this.template.querySelector('[data-id="documentEditor"]');

        if (!editorElement) {
            console.error('❌ Document Editor - Quill container not found');
            this.quillLoaded = false;
            return;
        }

        try {
            this.quill = new window.Quill(editorElement, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ font: [] }],
                        [{ size: ['small', false, 'large', 'huge'] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ script: 'sub' }, { script: 'super' }],
                        [{ header: 1 }, { header: 2 }],
                        ['blockquote', 'code-block'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }, { direction: 'rtl' }],
                        [{ align: [] }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
            // Toolbar selection preservation - identical to the Create Template
            // component. Clicking a toolbar button blurs .ql-editor, and inside
            // the LWC shadow DOM Quill can no longer resolve the native
            // selection, so getSelection() returns null and the format is
            // applied to nothing. Re-capture the range on mousedown (before the
            // blur) and restore it on click so the format handler sees it.
            let savedSelection = null;

            this.quill.on('selection-change', (range) => {
                if (range) {
                    savedSelection = range;
                }
            });

            const toolbarModule = this.quill.getModule('toolbar');
            if (toolbarModule?.container) {
                toolbarModule.container.addEventListener('mousedown', () => {
                    const selection = this.quill.getSelection();
                    if (selection) {
                        savedSelection = selection;
                        console.log('[DOCUMENT_EDITOR] Toolbar selection saved:', selection);
                    }
                }, true);

                toolbarModule.container.addEventListener('click', (event) => {
                    if (savedSelection) {
                        // Which button was pressed - read before Quill's own
                        // handler runs, so only that one format is synced.
                        const formatName = this.resolveToolbarFormatName(event);

                        requestAnimationFrame(() => {
                            this.quill.setSelection(savedSelection.index, savedSelection.length, 'silent');
                            console.log('[DOCUMENT_EDITOR] Toolbar selection restored:', savedSelection);

                            // Quill wraps the placeholder embed in <strong>/<em>,
                            // but the placeholder's own inline style overrides it
                            // and form controls never inherit at all - so write the
                            // format straight onto the placeholder.
                            this.applyToolbarFormatToPlaceholders(savedSelection, formatName);
                        });
                    }
                }, true);
            }

            // ADD THIS HERE
            document.addEventListener('selectionchange', () => {
                const selection = window.getSelection();

                console.log('[NATIVE SELECTION]', {
                    text: selection?.toString(),
                    anchorNode: selection?.anchorNode?.nodeName,
                    anchorOffset: selection?.anchorOffset,
                    focusNode: selection?.focusNode?.nodeName,
                    focusOffset: selection?.focusOffset
                });
            });

            this.quill.on('selection-change', (range, oldRange, source) => {
                console.log('[DEBUG] selection-change:', {
                    index: range?.index,
                    length: range?.length,
                    oldIndex: oldRange?.index,
                    oldLength: oldRange?.length,
                    source,
                    activeElement: document.activeElement?.className,
                    nativeSelection: (() => {
                        const selection = window.getSelection();
                        return {
                            text: selection?.toString(),
                            anchorNode: selection?.anchorNode?.nodeName,
                            anchorOffset: selection?.anchorOffset,
                            focusNode: selection?.focusNode?.nodeName,
                            focusOffset: selection?.focusOffset
                        };
                    })()
                });
            });
            this.injectEditorStyles();
            // Load saved template HTML
            if (this.richTextContent) {
                const cleanTemplate = document.createElement('div');
                cleanTemplate.innerHTML = this.richTextContent;
                cleanTemplate.querySelectorAll('.ql-selected').forEach(node => node.classList.remove('ql-selected'));
                this.quill.root.innerHTML = cleanTemplate.innerHTML;
                this.quill.update();

                console.log('[DOCUMENT_EDITOR] Saved template HTML loaded:', this.richTextContent.length);
                console.log('[DOCUMENT_EDITOR] Cleared stale Quill selection state');
                this.lastQuillContents = this.quill.getContents();// today
                console.log('[DOCUMENT_EDITOR] Initial Quill contents saved:', this.lastQuillContents);// today
            }

            this.repaginate();

            setTimeout(() => {
                const root = this.quill?.root;
                const editor = this.template.querySelector('[data-id="documentEditor"]');
                const container = editor?.querySelector('.ql-container');
                const toolbar = this.template.querySelector('.ql-toolbar');
                const shadow = this.template.querySelector('.page-shadows-container');

                console.log('========== [DOCUMENT_EDITOR] PAGE DEBUG ==========');
                console.log('ROOT:', root);
                console.log('ROOT HTML:', root?.innerHTML);
                console.log('ROOT RECT:', root?.getBoundingClientRect());

                console.log('ROOT COMPUTED:', root ? {
                    padding: getComputedStyle(root).padding,
                    paddingTop: getComputedStyle(root).paddingTop,
                    paddingBottom: getComputedStyle(root).paddingBottom,
                    height: getComputedStyle(root).height,
                    minHeight: getComputedStyle(root).minHeight,
                    width: getComputedStyle(root).width,
                    overflow: getComputedStyle(root).overflow
                } : null);

                console.log('CONTAINER RECT:', container?.getBoundingClientRect());
                console.log('TOOLBAR RECT:', toolbar?.getBoundingClientRect());
                console.log('SHADOW RECT:', shadow?.getBoundingClientRect());
                console.log('PAGES:', this.pages);
                console.log('ROOT SCROLL HEIGHT:', root?.scrollHeight);
                console.log('ROOT CLIENT HEIGHT:', root?.clientHeight);

                Array.from(root?.children || []).forEach((child, index) => {
                    const rect = child.getBoundingClientRect();

                    console.log(`[DOCUMENT_EDITOR] BLOCK ${index}:`, {
                        tag: child.tagName,
                        className: child.className,
                        text: child.innerText?.substring(0, 80),
                        top: rect.top,
                        bottom: rect.bottom,
                        height: rect.height,
                        marginTop: getComputedStyle(child).marginTop,
                        marginBottom: getComputedStyle(child).marginBottom
                    });
                });

                console.log('===================================================');
            }, 100);

            this.quill.on('text-change', () => {
                this.richTextContent = this.quill.root.innerHTML;
                this.repaginate();
                console.log('[DOCUMENT_EDITOR] Content changed → pagination updated');
            });

            console.log('✅ Document Editor - Quill initialized');
            console.log('📄 Document Editor - Saved content rendered');

        } catch (error) {
            console.error('❌ Document Editor - Quill initialization failed:', error);
            this.quillLoaded = false;
        }
    }
    injectEditorStyles() {
        if (this.template.querySelector('style.quill-custom-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.classList.add('quill-custom-styles');

        style.textContent = `
        .ql-container.ql-snow {
            border: none !important;
        }
        /* Quill adds the ql-container class to the SAME element as
           .rich-text-editor, not to a descendant of it. The space in
           ".rich-text-editor .ql-container" made this rule match nothing -
           compound selector (no space) is what actually targets it. */
        .rich-text-editor.ql-container {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
            min-width: 0 !important;
            font-size: 14px !important;
            border: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            overflow: visible !important;
        }

        .rich-text-editor .ql-editor {
            flex: 1 1 auto !important;
            min-height: 1120px !important;
            min-width: 0 !important;
            width: 800px !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            background: transparent !important;
            padding: 40px 75px !important;
            font-size: 14px !important;
        }

        .rich-text-editor .ql-editor p,
        .rich-text-editor .ql-editor div,
        .rich-text-editor .ql-editor span {
            font-size: 14px;
        }

        /* Quill inserts the toolbar as a sibling BEFORE the editor
           container - a direct child of .rich-text-editor-wrapper, not a
           descendant of .rich-text-editor. This selector never matched, so
           none of these !important rules (including the ones disabling
           sticky) ever applied; the toolbar rendered as Quill's plain
           default bar with no separation from the page below. Selector and
           sticky/full-width/border-bottom treatment ported from
           tesseractappsCreateTemplate, which targets the toolbar correctly. */
        .rich-text-editor-wrapper > .ql-toolbar {
            position: sticky !important;
            top: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            z-index: 10 !important;
            background: #ffffff !important;
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: 1px solid #d8dde6 !important;
            border-radius: 0 !important;
            padding-left: max(8px, calc((100% - 800px) / 2)) !important;
            padding-right: max(8px, calc((100% - 800px) / 2)) !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
            margin: 0 0 20px 0 !important;
            flex: 0 0 auto !important;
        }
    `;

        this.template.appendChild(style);

        console.log('[DOCUMENT_EDITOR] Quill custom styles injected');
    }

    classifyPlaceholder(node) {
        const type = node.getAttribute('data-type') || '';
        const storedMode = node.getAttribute('data-demographic-value-mode') || '';
        const isDemographicAttr = node.getAttribute('data-demographic-field') === 'true';

        const isCustom = /^Custom_/i.test(type);

        // Custom_<Kind>_<Label_With_Underscores>
        let baseType;
        let label;
        if (isCustom) {
            const parts = type.split('_');
            baseType = (parts[1] || 'Text').toLowerCase();
            label = node.getAttribute('data-label') || parts.slice(2).join(' ') || 'Custom Field';
        } else {
            baseType = type.toLowerCase();
            label = node.getAttribute('data-label') || type;
        }

        // A custom field is never a demographic auto-fill field.
        const isDemographic = !isCustom && isDemographicAttr;

        const mode =
            isDemographic &&
                !FORCED_MANUAL_TYPES.has(baseType) &&
                storedMode === 'AUTO'
                ? 'AUTO'
                : 'MANUAL';

        return {
            id: node.getAttribute('data-id') || '',
            type,
            baseType,
            label,
            isCustom,
            isDemographic,
            isSignature: baseType === 'signature',
            sourceField: node.getAttribute('data-demographic-source') || type,
            mode
        };
    }

    /** Read the textStyle the template author chose for this placeholder. */
    getPlaceholderTextStyle(node) {
        return {
            fontFamily: node.getAttribute('data-font-family') || 'Arial, Helvetica, sans-serif',
            fontSize: node.getAttribute('data-font-size') || '14',
            bold: node.getAttribute('data-bold') === 'true',
            italic: node.getAttribute('data-italic') === 'true',
            underline: node.getAttribute('data-underline') === 'true',
            color: node.getAttribute('data-color') || '#000000'
        };
    }

    /**
     * Apply the placeholder's authored formatting to an element so a resolved
     * value renders with the template font rather than a browser default.
     */
    applyTextStyle(element, textStyle) {
        element.style.fontFamily = textStyle.fontFamily;
        element.style.fontSize = `${textStyle.fontSize}px`;
        element.style.fontWeight = textStyle.bold ? '700' : '400';
        element.style.fontStyle = textStyle.italic ? 'italic' : 'normal';
        element.style.textDecoration = textStyle.underline ? 'underline' : 'none';
        element.style.color = textStyle.color;
    }

    // =====================================================================
    // TOOLBAR FORMATTING FOR PLACEHOLDERS
    // =====================================================================

    /**
     * Name of the Quill format the clicked toolbar control represents, e.g.
     * a <button class="ql-bold"> gives 'bold' and a colour swatch inside
     * <span class="ql-color ql-picker"> gives 'color'. Null for anything that
     * is not a format toggle (link, image, clean, ...).
     */
    resolveToolbarFormatName(event) {
        const pickerItem = event.target.closest('.ql-picker-item, .ql-picker-label');
        const source = pickerItem
            ? pickerItem.closest('.ql-picker')
            : event.target.closest('button');

        if (!source) {
            return null;
        }

        const match = Array.from(source.classList)
            .map(className => /^ql-([a-z-]+)$/.exec(className))
            .find(result => result && result[1] !== 'picker');

        return match ? match[1] : null;
    }

    /**
     * Push the format the user just applied onto every placeholder inside the
     * selection. Quill's own wrapper cannot style these: the placeholder node
     * carries explicit inline font styles (create / applyTextStyle) that beat
     * any inherited <strong>/<em>, and the manual controls are <input>,
     * <select> and <textarea> elements, which never inherit ancestor fonts.
     */
    applyToolbarFormatToPlaceholders(range, formatName) {
        if (!this.quill || !range || !range.length || !formatName) {
            return;
        }

        const editor = this.template.querySelector('[data-id="documentEditor"]');
        if (!editor || !window.Quill) {
            return;
        }

        const format = this.quill.getFormat(range.index, range.length) || {};
        const value = format[formatName];
        const rangeEnd = range.index + range.length;
        let updated = 0;

        editor.querySelectorAll('.quill-placeholder-embed').forEach(node => {
            const blot = window.Quill.find(node);
            if (!blot) {
                return;
            }

            const index = this.quill.getIndex(blot);
            if (index < range.index || index >= rangeEnd) {
                return;
            }

            if (this.setPlaceholderFormat(node, formatName, value)) {
                updated++;
            }
        });

        if (updated) {
            this.richTextContent = this.quill.root.innerHTML;
            console.log('[DOCUMENT_EDITOR] Toolbar format applied to placeholders:', {
                format: formatName,
                value,
                count: updated
            });
        }
    }

    /**
     * Write one format onto a placeholder: the chip/value wrapper itself, its
     * resolved value span and its live manual control. Returns true when the
     * format was one this component styles.
     */
    setPlaceholderFormat(node, formatName, value) {
        const targets = [node];
        node
            .querySelectorAll('[data-placeholder-control="true"], .resolved-placeholder-value')
            .forEach(element => targets.push(element));

        switch (formatName) {
            case 'bold':
                node.setAttribute('data-bold', value ? 'true' : 'false');
                targets.forEach(element => { element.style.fontWeight = value ? '700' : '400'; });
                return true;

            case 'italic':
                node.setAttribute('data-italic', value ? 'true' : 'false');
                targets.forEach(element => { element.style.fontStyle = value ? 'italic' : 'normal'; });
                return true;

            case 'underline':
                node.setAttribute('data-underline', value ? 'true' : 'false');
                this.applyPlaceholderTextDecoration(node, targets);
                return true;

            case 'strike':
                node.setAttribute('data-strike', value ? 'true' : 'false');
                this.applyPlaceholderTextDecoration(node, targets);
                return true;

            case 'color':
                node.setAttribute('data-color', value || '#000000');
                targets.forEach(element => { element.style.color = value || '#000000'; });
                return true;

            case 'background':
                targets.forEach(element => { element.style.background = value || 'transparent'; });
                return true;

            // font, size, align, list, header ... keep the placeholder's
            // authored typography rather than guessing a CSS equivalent.
            default:
                return false;
        }
    }

    /** underline and strike share text-decoration, so recompute both together. */
    applyPlaceholderTextDecoration(node, targets) {
        const decorations = [];
        if (node.getAttribute('data-underline') === 'true') { decorations.push('underline'); }
        if (node.getAttribute('data-strike') === 'true') { decorations.push('line-through'); }

        const decoration = decorations.length ? decorations.join(' ') : 'none';
        targets.forEach(element => { element.style.textDecoration = decoration; });
    }

    /** Strip the blue "chip" styling once a placeholder carries real content. */
    neutralisePlaceholderChrome(node) {
        node.style.background = 'transparent';
        node.style.border = 'none';
        node.style.padding = '0';
        node.style.margin = '0 2px';
        node.style.fontWeight = '400';
    }

    // =====================================================================
    // AUTO DEMOGRAPHIC VALUES
    // =====================================================================

    applyAutoValues(fieldValues) {
        const editor = this.template.querySelector('[data-id="documentEditor"]');
        if (!editor) {
            console.error('❌ Document Editor - Editor DOM not found');
            return;
        }

        const values = fieldValues || {};
        const placeholders = editor.querySelectorAll('.quill-placeholder-embed');
        console.log('🔎 Placeholders found:', placeholders.length);

        placeholders.forEach((node) => {
            const info = this.classifyPlaceholder(node);

            if (info.mode !== 'AUTO') {
                return;
            }

            const autoValue = values[info.sourceField];
            console.log('🔍 AUTO placeholder:', {
                id: info.id,
                type: info.type,
                sourceField: info.sourceField,
                autoValue
            });

            if (autoValue === undefined || autoValue === null || autoValue === '') {
                // Templates behaviour: an AUTO field with no value on the record
                // falls back to the manual control for that type (e.g. ABN, TFN,
                // which the demographic Apex never returns).
                console.log('✏️ No record value - manual entry required:', info.label);
                this.createManualPlaceholderControl(node);
                return;
            }
            console.log('[DOCUMENT_EDITOR] BEFORE RESOLVE:', {
                id: node.getAttribute('data-id'),
                className: node.className,
                background: node.style.background,
                border: node.style.border,
                qlSelected: node.classList.contains('ql-selected'),
                html: node.outerHTML.substring(0, 500)
            });
            this.renderResolvedValue(node, String(autoValue));
            console.log('✅ AUTO value applied:', { id: info.id, value: autoValue });
            console.log('[DOCUMENT_EDITOR] AFTER RESOLVE:', {
                id: node.getAttribute('data-id'),
                className: node.className,
                background: node.style.background,
                border: node.style.border,
                qlSelected: node.classList.contains('ql-selected'),
                html: node.outerHTML.substring(0, 500)
            });
        });

        if (this.quill) {
            this.richTextContent = this.quill.root.innerHTML;
            this.repaginate();
        }
        console.log('✅ AUTO demographic values processed');
    }

    /*    renderResolvedValue(node, value) {
           const textStyle = this.getPlaceholderTextStyle(node);
           node.innerHTML = '';
           this.neutralisePlaceholderChrome(node);
           this.applyTextStyle(node, textStyle);
           node.setAttribute('data-resolved-value', value ?? '');
           node.classList.add('quill-placeholder-resolved');
           node.classList.remove('quill-placeholder-manual');
           const valueSpan = document.createElement('span');
           valueSpan.className = 'resolved-placeholder-value';
           valueSpan.textContent = value ?? '';
           node.appendChild(valueSpan);
           console.log('[DOCUMENT_EDITOR] Resolved placeholder rendered:', {
               id: node.getAttribute('data-id'),
               label: node.getAttribute('data-label'),
               value
           });
       } */
    renderResolvedValue(node, value) {
        if (!node || !this.quill) {
            console.error('[DOCUMENT_EDITOR] Cannot resolve AUTO value: node or Quill not available');
            return;
        }

        const resolvedValue = String(value ?? '');
        const textStyle = this.getPlaceholderTextStyle(node);

        try {
            const blot = window.Quill.find(node);

            if (!blot) {
                console.error(
                    '[DOCUMENT_EDITOR] Could not find Quill blot for AUTO placeholder:',
                    node
                );
                return;
            }

            const index = this.quill.getIndex(blot);

            console.log('[DOCUMENT_EDITOR] Resolving AUTO placeholder:', {
                id: node.getAttribute('data-id'),
                label: node.getAttribute('data-label'),
                value: resolvedValue,
                index
            });

            // Remove the atomic placeholder embed.
            this.quill.deleteText(index, 1, 'api');

            // Insert the AUTO value as normal editable Quill text.
            if (resolvedValue) {
                const formats = {};

                if (textStyle.fontFamily) {
                    formats.font = textStyle.fontFamily;
                }

                if (textStyle.fontSize) {
                    formats.size = `${textStyle.fontSize}px`;
                }

                if (textStyle.bold) {
                    formats.bold = true;
                }

                if (textStyle.italic) {
                    formats.italic = true;
                }

                if (textStyle.underline) {
                    formats.underline = true;
                }

                if (textStyle.color) {
                    formats.color = textStyle.color;
                }

                this.quill.insertText(
                    index,
                    resolvedValue,
                    formats,
                    'api'
                );
            }

            console.log('[DOCUMENT_EDITOR] AUTO value converted to editable text:', {
                id: node.getAttribute('data-id'),
                value: resolvedValue
            });

        } catch (error) {
            console.error(
                '[DOCUMENT_EDITOR] Error resolving AUTO placeholder:',
                error
            );
        }
    }
    // MANUAL PLACEHOLDER CONTROLS
    createManualPlaceholderControl(node) {
        if (!node || node.querySelector('[data-placeholder-control="true"]')) { return; }
        const info = this.classifyPlaceholder(node);
        const textStyle = this.getPlaceholderTextStyle(node);
        console.log('[DOCUMENT_EDITOR] Creating manual control:', info);
        node.innerHTML = '';
        this.neutralisePlaceholderChrome(node);
        node.style.color = '#181818';
        node.contentEditable = 'false';
        if (info.isSignature) {
            this.createSignatureControl(node, info);
            node.classList.add('quill-placeholder-manual');
            return;
        }
        const control = this.buildInputForType(info, textStyle);
        if (!control) { return; }
        control.setAttribute('data-placeholder-control', 'true');
        control.setAttribute('data-placeholder-id', info.id);
        control.setAttribute('data-placeholder-type', info.type);
        control.setAttribute('data-placeholder-base-type', info.baseType);
        control.setAttribute('data-placeholder-label', info.label);
        control.setAttribute('contenteditable', 'true');
        control.setAttribute('spellcheck', 'false');
        this.styleManualControl(control, info, textStyle);
        this.attachManualControlListeners(control, node, info);
        node.appendChild(control);
        node.classList.add('quill-placeholder-manual');
        console.log('[DOCUMENT_EDITOR] Manual control created:', { id: info.id, baseType: info.baseType, tag: control.tagName, inputType: control.type || null });
    }
    /**
     * One control per type, matching the control Templates renders for the
     * same type in its fill view (tesseractappstemplatesLwc.html).
     */
    buildInputForType(info, textStyle) {
        const { baseType, label } = info;
        let control;

        switch (baseType) {
            case 'date':
            case 'dateofsigning':
                control = document.createElement('input');
                control.type = 'date';
                break;

            case 'time':
                control = document.createElement('input');
                control.type = 'time';
                break;

            case 'email':
                control = document.createElement('input');
                control.type = 'email';
                control.placeholder = `Enter ${label}`;
                break;

            case 'number':
                control = document.createElement('input');
                control.type = 'number';
                control.placeholder = `Enter ${label}`;
                break;

            case 'address':
            case 'longtext':
                control = document.createElement('textarea');
                control.placeholder = `Enter ${label}`;
                control.rows = 2;
                break;

            // Templates uses a <select>, never a free-text input, for Initials.
            case 'initials': {
                control = document.createElement('select');
                INITIALS_OPTIONS.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option.value;
                    optionEl.textContent = option.label;
                    control.appendChild(optionEl);
                });
                break;
            }

            case 'abn':
                control = document.createElement('input');
                control.type = 'text';
                control.placeholder = 'Enter ABN';
                control.maxLength = 11;
                control.setAttribute('inputmode', 'numeric');
                break;

            case 'tfn':
                control = document.createElement('input');
                control.type = 'text';
                control.placeholder = 'Enter TFN';
                control.maxLength = 9;
                control.setAttribute('inputmode', 'numeric');
                break;

            case 'contactnumber':
                control = document.createElement('input');
                control.type = 'tel';
                control.placeholder = `Enter ${label}`;
                control.setAttribute('inputmode', 'numeric');
                break;

            default:
                control = document.createElement('input');
                control.type = 'text';
                control.placeholder = `Enter ${label}`;
                break;
        }

        // The typed value must already look like the finished document.
        this.applyTextStyle(control, textStyle);
        return control;
    }

    styleManualControl(control, info, textStyle) {
        const isMultiline = info.baseType === 'address' || info.baseType === 'longtext';

        control.style.boxSizing = 'border-box';
        control.style.minWidth = isMultiline ? '220px' : '160px';
        control.style.maxWidth = isMultiline ? '320px' : '260px';
        control.style.minHeight = isMultiline ? '52px' : '28px';
        control.style.padding = '3px 8px';
        control.style.margin = '0 2px';
        control.style.border = '1px solid #0176d3';
        control.style.borderRadius = '4px';
        control.style.background = '#ffffff';
        control.style.outline = 'none';
        control.style.verticalAlign = 'middle';
        control.style.resize = isMultiline ? 'vertical' : 'none';

        // applyTextStyle already set family/size/weight/style/colour; keep them.
        if (!textStyle.fontSize) {
            control.style.fontSize = '14px';
        }
    }

    /*       attachManualControlListeners(control, node, info) {
            const digitsOnly = info.baseType === 'abn' || info.baseType === 'tfn' || info.baseType === 'contactnumber';
            const maxDigits = info.baseType === 'abn' ? 11 : info.baseType === 'tfn' ? 9 : null;
    
            const handleValue = (event) => {
                let value = event.target.value ?? '';
                if (digitsOnly) {
                    value = value.replace(/\D/g, '');
                    if (maxDigits) {
                        value = value.slice(0, maxDigits);
                    }
                    event.target.value = value;
                }
                this.updateManualPlaceholderValue(node, value);
            };
    
            control.addEventListener('input', handleValue);
            control.addEventListener('change', handleValue);
     
            const claimPointer = (event) => {
                event.stopPropagation();
            };
    
            control.addEventListener('pointerdown', claimPointer);
            control.addEventListener('mousedown', claimPointer);
            control.addEventListener('touchstart', claimPointer, { passive: true });
            control.addEventListener('click', claimPointer);
            control.addEventListener('focus', () => {
                // Drop any Quill selection so typing goes to the control.
                try {
                    this.quill?.blur();
                } catch (error) {
                    console.warn('[DOCUMENT_EDITOR] Could not blur Quill:', error);
                }
            });
            // Keystrokes belong to the control, not to Quill's keyboard module.
            control.addEventListener('keydown', event => event.stopPropagation());
        }  */

    attachManualControlListeners(control, node, info) {
        const digitsOnly = info.baseType === 'abn' || info.baseType === 'tfn' || info.baseType === 'contactnumber';
        const maxDigits = info.baseType === 'abn' ? 11 : info.baseType === 'tfn' ? 9 : null;
        const handleValue = event => {
            let value = event.target.value ?? '';
            if (digitsOnly) {
                value = value.replace(/\D/g, '');
                if (maxDigits) { value = value.slice(0, maxDigits); }
                event.target.value = value;
            }
            console.log('[DOCUMENT_EDITOR] Manual input:', { id: node.getAttribute('data-id'), type: info.baseType, value });
        };
        control.addEventListener('input', handleValue);
        control.addEventListener('change', handleValue);
        const stopQuillInteraction = event => { event.stopPropagation(); };
        control.addEventListener('pointerdown', stopQuillInteraction, true);
        control.addEventListener('mousedown', stopQuillInteraction, true);
        control.addEventListener('touchstart', stopQuillInteraction, true);
        control.addEventListener('click', stopQuillInteraction, true);
        control.addEventListener('keydown', event => { event.stopPropagation(); }, true);
    }

    updateManualPlaceholderValue(node, value) {
        const normalizedValue = value ?? '';
        node.setAttribute('data-manual-value', normalizedValue);
        node.setAttribute('data-resolved-value', normalizedValue);

        console.log('[DOCUMENT_EDITOR] Placeholder value updated:', {
            id: node.getAttribute('data-id'),
            type: node.getAttribute('data-type'),
            value: normalizedValue
        });

        if (this.quill) {
            this.richTextContent = this.quill.root.innerHTML;
        }
    }
    //end

    generateGUID() {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /** The click target Templates shows before a signature exists. */
    createSignatureControl(node, info) {
        const trigger = document.createElement('span');

        trigger.setAttribute('data-placeholder-control', 'true');
        trigger.setAttribute('data-placeholder-id', info.id);
        trigger.setAttribute('data-placeholder-type', info.type);
        trigger.setAttribute('data-placeholder-base-type', 'signature');
        trigger.setAttribute('data-placeholder-label', info.label);
        trigger.setAttribute('data-signature-trigger', 'true');
        trigger.textContent = 'Upload Signature';
        trigger.style.display = 'inline-block';
        trigger.style.padding = '4px 10px';
        trigger.style.margin = '0 2px';
        trigger.style.border = '1px dashed #0176d3';
        trigger.style.borderRadius = '4px';
        trigger.style.background = '#f3f9ff';
        trigger.style.color = '#0176d3';
        trigger.style.fontSize = '13px';
        trigger.style.fontWeight = '500';
        trigger.style.cursor = 'pointer';
        trigger.style.userSelect = 'none';
        trigger.style.verticalAlign = 'middle';

        const open = (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.activeSignaturePlaceholderId = info.id;
            this.showSignatureModal = true;
        };

        trigger.addEventListener('mousedown', event => event.stopPropagation());
        trigger.addEventListener('pointerdown', event => event.stopPropagation());
        trigger.addEventListener('click', open);

        node.appendChild(trigger);
        return trigger;
    }

    getActiveSignatureNode() {
        const editor = this.template.querySelector('[data-id="documentEditor"]');
        if (!editor || !this.activeSignaturePlaceholderId) {
            return null;
        }
        return editor.querySelector(
            `.quill-placeholder-embed[data-id="${this.activeSignaturePlaceholderId}"]`
        );
    }

    /** Put the finished signature image into its own placeholder. */
    applySignatureToPlaceholder(dataUrl) {
        const node = this.getActiveSignatureNode();
        if (!node) {
            console.warn('[DOCUMENT_EDITOR] Signature placeholder not found:', this.activeSignaturePlaceholderId);
            return;
        }

        node.innerHTML = '';
        this.neutralisePlaceholderChrome(node);

        const image = document.createElement('img');
        image.src = dataUrl;
        image.alt = 'Signature';
        image.setAttribute('data-placeholder-signature', 'true');
        image.setAttribute('data-placeholder-id', node.getAttribute('data-id') || '');
        image.style.maxWidth = '200px';
        image.style.maxHeight = '90px';
        image.style.objectFit = 'contain';
        image.style.verticalAlign = 'middle';

        node.appendChild(image);
        node.setAttribute('data-resolved-value', 'signature');
        node.setAttribute('data-signature-src', dataUrl);
        node.classList.add('quill-placeholder-resolved');

        if (this.quill) {
            this.richTextContent = this.quill.root.innerHTML;
        }
        this.repaginate();

        console.log('[DOCUMENT_EDITOR] Signature applied to placeholder:', node.getAttribute('data-id'));
    }

    closeSignatureModal() {
        this.showSignatureModal = false;
    }

    // ── Option 1: Upload ───────────────────────────────────────────────────
    handleUploadOption() {
        this.showSignatureModal = false;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png, image/jpeg';

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (!file) {
                this.showToast('Error', 'No file selected.', 'error');
                return;
            }
            this.processSignatureFile(file);
        });

        fileInput.click();
    }

    processSignatureFile(file) {
        // Same validation rules as TesseractappstemplatesLwc.onImageUpload.
        const validImageTypes = ['image/png', 'image/jpeg'];
        if (!validImageTypes.includes(file.type)) {
            this.showToast('Error', 'Invalid file type. Please upload a PNG or JPEG image.', 'error');
            return;
        }

        const MAX_FILE_SIZE = 1048576;
        const MIN_FILE_SIZE = 10240;
        if (file.size > MAX_FILE_SIZE || file.size < MIN_FILE_SIZE) {
            this.showToast('Error', 'File size must be between 10KB and 1MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const result = reader.result;
                if (!result || typeof result !== 'string') {
                    this.showToast('Error', 'Unable to read the selected file.', 'error');
                    return;
                }

                const finalImage = await this.generateSignedImage(result, this.sessionGuid);
                this.applySignatureToPlaceholder(finalImage);
            } catch (error) {
                console.error('[DOCUMENT_EDITOR] Signature upload failed:', error);
                this.showToast('Error', 'Failed to process the signature image.', 'error');
            }
        };
        reader.readAsDataURL(file);
    }

    // ── Option 2: Draw ─────────────────────────────────────────────────────
    handleDrawOption() {
        this.showSignatureModal = false;
        this.showDrawingModal = true;

        // Double RAF so the canvas has a real layout box before sizing it.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const canvas = this.template.querySelector('.signature-canvas');
                if (canvas) {
                    this.initSignatureCanvasDPR(canvas);
                }
            });
        });
    }

    closeDrawingModal() {
        this.showDrawingModal = false;
        this.isDrawing = false;
    }

    initSignatureCanvasDPR(canvas) {
        if (!canvas) { return; }

        let rect = canvas.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) {
            canvas.style.width = '400px';
            canvas.style.height = '200px';
            rect = canvas.getBoundingClientRect();
        }

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';

        this.canvasContext = ctx;
    }

    getCanvasPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    startDrawing(event) {
        const canvas = this.template.querySelector('.signature-canvas');
        if (!canvas) { return; }
        if (!this.canvasContext) { this.initSignatureCanvasDPR(canvas); }

        const { x, y } = this.getCanvasPoint(event, canvas);
        this.isDrawing = true;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(x, y);
        if (event.cancelable) { event.preventDefault(); }
    }

    draw(event) {
        if (!this.isDrawing || !this.canvasContext) { return; }
        const canvas = this.template.querySelector('.signature-canvas');
        if (!canvas) { return; }

        const { x, y } = this.getCanvasPoint(event, canvas);
        this.canvasContext.lineTo(x, y);
        this.canvasContext.stroke();
        if (event.cancelable) { event.preventDefault(); }
    }

    stopDrawing() {
        if (!this.isDrawing) { return; }
        this.isDrawing = false;
        if (this.canvasContext) { this.canvasContext.closePath(); }
    }

    clearCanvas() {
        const canvas = this.template.querySelector('.signature-canvas');
        if (!canvas) { return; }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.initSignatureCanvasDPR(canvas);
    }

    isCanvasBlank(canvas) {
        try {
            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;
            if (!width || !height) { return true; }
            const data = ctx.getImageData(0, 0, width, height).data;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] !== 0) { return false; }
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async saveDrawnSignature() {
        const canvas = this.template.querySelector('.signature-canvas');
        if (!canvas) { return; }

        if (this.isCanvasBlank(canvas)) {
            this.showToast('Error', 'Please draw your signature before saving.', 'error');
            return;
        }

        const originalDataUrl = canvas.toDataURL('image/png');
        this.showDrawingModal = false;

        try {
            const finalImage = await this.generateSignedImage(originalDataUrl, this.sessionGuid);
            this.applySignatureToPlaceholder(finalImage);
        } catch (error) {
            console.error('[DOCUMENT_EDITOR] Drawn signature failed:', error);
            this.showToast('Error', 'Failed to save the drawn signature.', 'error');
        }
    }

    // ── Option 3: Enter Name ───────────────────────────────────────────────
    openNameSignatureModal() {
        this.showSignatureModal = false;
        this.showNameSignatureModal = true;
    }

    closeNameSignatureModal() {
        this.showNameSignatureModal = false;
        this.enteredName = '';
        this.styledPreviews = [];
        this.selectedStyle = null;
    }

    handleNameInput(event) {
        this.enteredName = event.target.value;
        this.generateFontStyles();
    }

    generateFontStyles() {
        if (!this.enteredName) {
            this.styledPreviews = [];
            return;
        }

        this.styledPreviews = SIGNATURE_FONT_STYLES.map((font, index) => ({
            id: index,
            fontFamily: font,
            name: this.enteredName
        }));

        this.renderFontPreviews();
    }

    renderFontPreviews() {
        setTimeout(() => {
            this.styledPreviews.forEach((style) => {
                const canvas = this.template.querySelector(`canvas[data-id="${style.id}"]`);
                if (!canvas) { return; }

                const context = canvas.getContext('2d');
                const fontSize = 50;
                context.font = `${fontSize}px '${style.fontFamily}', sans-serif`;

                const textWidth = context.measureText(style.name).width;
                const requiredWidth = textWidth + 40;
                if (requiredWidth > canvas.width) {
                    canvas.width = requiredWidth;
                }

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.font = `${fontSize}px '${style.fontFamily}', sans-serif`;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillStyle = '#000';
                context.fillText(style.name, canvas.width / 2, canvas.height / 2);
            });
        }, 0);
    }

    async handleStyleSelection(event) {
        const styleId = Number(event.currentTarget.dataset.id);
        this.selectedStyle = this.styledPreviews.find(s => s.id === styleId);

        this.template.querySelectorAll('.signature-font-style').forEach(el =>
            el.classList.remove('selected')
        );
        event.currentTarget.classList.add('selected');

        if (!this.selectedStyle || !this.enteredName) {
            return;
        }

        try {
            const rawSignature = await this.renderSignatureToDataURL({
                text: this.enteredName,
                fontFamily: this.selectedStyle.fontFamily || 'serif',
                boxWidthPx: 200,
                boxHeightPx: 80,
                padding: 8
            });

            const finalImage = await this.generateSignedImage(rawSignature, this.sessionGuid);
            this.applySignatureToPlaceholder(finalImage);
            this.closeNameSignatureModal();
        } catch (error) {
            console.error('[DOCUMENT_EDITOR] Name signature failed:', error);
            this.showToast('Error', 'Failed to create the signature.', 'error');
        }
    }

    /** Draw the typed name as large as it fits in the box. */
    async renderSignatureToDataURL({ text, fontFamily, boxWidthPx, boxHeightPx, padding = 8, fontWeight = 400 }) {
        const dpr = window.devicePixelRatio || 1;
        const scale = 4;
        const w = Math.max(1, Math.floor(boxWidthPx * dpr * scale));
        const h = Math.max(1, Math.floor(boxHeightPx * dpr * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        const guess = Math.floor(h * 0.7);
        try {
            await document.fonts.load(`${fontWeight} ${guess}px ${fontFamily}`);
        } catch (error) {
            console.warn('[DOCUMENT_EDITOR] Signature font not preloaded:', fontFamily);
        }

        const targetW = w - padding * 2 * dpr * scale;
        const targetH = h - padding * 2 * dpr * scale;

        let lo = 6 * dpr * scale;
        let hi = guess;
        let best = Math.min(guess, targetH);

        const fits = (size) => {
            ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
            return ctx.measureText(text).width <= targetW && size * 1.1 <= targetH;
        };

        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (fits(mid)) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
        }

        ctx.clearRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.font = `${fontWeight} ${best}px ${fontFamily}`;
        ctx.fillText(text, w / 2, h / 2);

        return canvas.toDataURL('image/png');
    }

    /** TSigned composite - byte-for-byte the Templates layout. */
    generateSignedImage(signatureDataUrl, guid) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const img = new Image();
            img.onerror = () => reject(new Error('Signature image could not be loaded'));

            img.onload = () => {
                const scaleFactor = 2;
                const maxWidth = 200;
                const scale = Math.min(maxWidth / img.width, 1);

                const imgWidth = img.width * scale;
                const imgHeight = img.height * scale;

                const paddingX = 26;
                const paddingY = 18;
                const gapLabelToImg = 10;
                const gapImgToGuid = 10;
                const labelFontSize = 22;
                const guidFontSize = 20;

                const totalWidth = imgWidth + paddingX * 2 + 40;
                const totalHeight =
                    paddingY + labelFontSize + gapLabelToImg + imgHeight +
                    gapImgToGuid + guidFontSize + paddingY;

                canvas.width = totalWidth * scaleFactor;
                canvas.height = totalHeight * scaleFactor;
                ctx.scale(scaleFactor, scaleFactor);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, totalWidth, totalHeight);

                const x = 22;
                const top = paddingY;
                const bottom = totalHeight - paddingY;
                const r = 14;

                ctx.strokeStyle = '#2a6edb';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(x + r, top);
                ctx.arcTo(x, top, x, top + r, r);
                ctx.lineTo(x, bottom - r);
                ctx.arcTo(x, bottom, x + r, bottom, r);
                ctx.stroke();

                const contentX = x + r + 10;

                ctx.fillStyle = '#222';
                ctx.font = `600 ${labelFontSize}px Arial`;
                ctx.fillText('TSigned by:', contentX, top + 1);

                const imgY = top + labelFontSize + gapLabelToImg;
                ctx.drawImage(img, contentX, imgY, imgWidth, imgHeight);

                const shortGuid = String(guid || '').substring(0, 18) + '...';
                ctx.fillStyle = '#666';
                ctx.font = `${guidFontSize}px monospace`;
                ctx.fillText(shortGuid, contentX, bottom - 2);

                resolve(canvas.toDataURL('image/png'));
            };

            img.src = signatureDataUrl;
        });
    }

    async loadRecipientDemographics() {
        console.group(
            '📥 Document Editor - Load Recipient Demographics'
        );
        try {
            const recipientType = this.sendDocumentForm?.recipientType;

            const contactId = this.sendDocumentForm?.contactId;
            console.log(
                '👤 Recipient Type:',
                recipientType
            );
            console.log(
                '🆔 Contact Id:',
                contactId
            );

            if (
                !recipientType ||
                !contactId ||
                (
                    recipientType !== 'Staff' &&
                    recipientType !== 'Participant'
                )
            ) {
                console.log(
                    'ℹ️ No Staff/Participant demographic lookup required.'
                );

                this.applyAutoValues({});
                this.initializeManualPlaceholders();

                return;
            }
            const result =
                await getRecipientDemographicDetails({
                    sendDocumentFormJson:
                        JSON.stringify(
                            this.sendDocumentForm
                        )
                });
            console.log(
                '✅ Demographic Apex Result:',
                JSON.stringify(result)
            );
            const fieldValues =
                result?.fieldValues || {};
            console.log(
                '📋 Recipient Field Values:',
                JSON.stringify(fieldValues)
            );
            this.applyAutoValues(fieldValues);
            this.initializeManualPlaceholders();//today added
        } catch (error) {
            console.error(
                '❌ Document Editor - Demographic lookup failed:',
                error
            );
        } finally {
            console.groupEnd();
        }
    }

    initializeManualPlaceholders() {
        const editor = this.template.querySelector('[data-id="documentEditor"]');
        if (!editor) {
            console.warn('[DOCUMENT_EDITOR] Cannot initialize manual placeholders - editor not found');
            return;
        }

        const placeholders = editor.querySelectorAll('.quill-placeholder-embed');
        console.log('[DOCUMENT_EDITOR] Initializing manual placeholders:', placeholders.length);

        placeholders.forEach(node => {
            // Already resolved by AUTO fill - leave it as document text.
            if (node.classList.contains('quill-placeholder-resolved')) {
                return;
            }

            const info = this.classifyPlaceholder(node);
            if (info.mode === 'MANUAL') {
                this.createManualPlaceholderControl(node);
            }
        });

        this.repaginate();
        console.log('[DOCUMENT_EDITOR] Manual placeholders initialized');
    }
    //end
    repaginate() {
        const quill = this.quill;
        if (!quill) {
            console.warn('[DOCUMENT_EDITOR] Repaginate skipped: Quill not ready');
            return;
        }

        const children = Array.from(quill.root.children);

        if (!children.length) {
            this.pages = [{ id: 'page-0', style: 'margin-bottom: 40px;' }];
            quill.root.style.minHeight = '1120px';
            return;
        }

        if (children.some(child => child.offsetHeight === 0)) {
            setTimeout(() => this.repaginate(), 50);
            return;
        }

        const PAGE_HEIGHT = 1120;
        const PAGE_GAP = 40;
        const MARGIN_TOP = 40;
        const MARGIN_BOTTOM = 40;
        const PAGE_LIMIT = PAGE_HEIGHT - MARGIN_BOTTOM;

        let currentPage = 1;
        let currentLocalY = MARGIN_TOP;

        children.forEach(child => {
            child.style.marginTop = '';
            child.style.minHeight = '';
        });

        children.forEach(child => {
            const height = child.offsetHeight;

            if (currentLocalY + height > PAGE_LIMIT && currentLocalY > MARGIN_TOP) {
                const marginTop = (PAGE_HEIGHT - currentLocalY) + PAGE_GAP + MARGIN_TOP;
                child.style.marginTop = `${marginTop}px`;
                currentPage++;
                currentLocalY = MARGIN_TOP + height;
            } else {
                currentLocalY += height;
            }
        });

        this.pages = Array.from({ length: currentPage }, (_, index) => ({
            id: `page-${index}`,
            style: `margin-bottom: ${PAGE_GAP}px;`
        }));

        const totalHeight = currentPage * PAGE_HEIGHT + (currentPage - 1) * PAGE_GAP;
        quill.root.style.minHeight = `${totalHeight}px`;

        setTimeout(() => {
            try {
                const editor = this.template.querySelector('[data-id="documentEditor"]');
                const shadowContainer = this.template.querySelector('.page-shadows-container');
                if (editor && shadowContainer) {
                    shadowContainer.style.top = `${editor.offsetTop}px`;
                    console.log('[DOCUMENT_EDITOR] Page shadows aligned:', editor.offsetTop);
                }
            } catch (error) {
                console.warn('[DOCUMENT_EDITOR] Failed to position page shadows:', error);
            }
        }, 0);

        console.log('[DOCUMENT_EDITOR] Repagination complete:', {
            pageCount: currentPage,
            totalHeight,
            usableHeight: PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM
        });
    }

    /**
     * Same "please fill in these fields" gate tesseractappstemplatesLwc runs
     * (validatePlaceholders/proceedWithPreview) before it will generate a
     * document. Adapted to this component's data model: instead of that
     * component's canvas placeholder array, an unresolved value here is a
     * live <input>/<select>/<textarea> (or a signature's "Upload Signature"
     * trigger) sitting inside a '.quill-placeholder-embed' node, so the
     * check reads those controls straight out of the Quill DOM.
     */
    validatePlaceholders() {
        const editor = this.template.querySelector('[data-id="documentEditor"]');
        if (!editor) {
            return true;
        }

        const missingFields = [];
        editor.querySelectorAll('[data-placeholder-control="true"]').forEach(control => {
            const isSignature = control.getAttribute('data-signature-trigger') === 'true';
            if (isSignature) {
                missingFields.push('Signature');
                return;
            }
            const value = (control.value ?? '').trim();
            if (!value) {
                missingFields.push(control.getAttribute('data-placeholder-label') || 'Field');
            }
        });

        if (missingFields.length > 0) {
            const uniqueMissing = [...new Set(missingFields)];
            const fieldList = uniqueMissing.join(', ');
            const message = `The following required field${uniqueMissing.length > 1 ? 's are' : ' is'
                } incomplete: ${fieldList}. Please ensure all required information is provided before proceeding.`;
            console.error('[DOCUMENT_EDITOR] VALIDATION FAILED:', uniqueMissing);
            this.showToast('Incomplete Information', message, 'error');
            return false;
        }

        return true;
    }
    buildPdfDelta() {
        if (!this.quill) {
            throw new Error('Quill editor is not available');
        }

        const delta = this.quill.getContents();
        const pdfDelta = JSON.parse(JSON.stringify(delta));

        const editor = this.template.querySelector('[data-id="documentEditor"]');

        if (!editor) {
            return pdfDelta;
        }

        const replacements = new Map();

        editor.querySelectorAll('.quill-placeholder-embed').forEach(node => {
            const blot = window.Quill.find(node);

            if (!blot) {
                return;
            }

            const index = this.quill.getIndex(blot);
            const signatureSrc = node.getAttribute('data-signature-src');

            if (signatureSrc) {
                // The on-screen signature <img> is capped by BOTH maxWidth:200px
                // and maxHeight:90px (applySignatureToPlaceholder). The composite
                // is wider than it is tall, so the 90px height cap binds first and
                // the image actually renders ~130px wide - not 200px. Sending the
                // constant 200 made the PDF signature ~50% bigger than the editor.
                // Use the element's real rendered width so the PDF matches.
                const signatureImg = node.querySelector('img[data-placeholder-signature="true"]');
                const renderedWidth = signatureImg
                    ? Math.round(signatureImg.getBoundingClientRect().width)
                    : 0;

                replacements.set(index, {
                    insert: { image: signatureSrc },
                    attributes: { width: String(renderedWidth || SIGNATURE_PDF_WIDTH_PX) }
                });
                return;
            }

            const control = node.querySelector('[data-placeholder-control="true"]');
            const rect = control.getBoundingClientRect();
const editorRect = this.quill.root.getBoundingClientRect();

console.log(
    `[PDF LAYOUT CHECK] ${control.getAttribute('data-placeholder-base-type')}`,
    {
        id: control.getAttribute('data-placeholder-id'),
        value: control.value,
        left: Math.round(rect.left - editorRect.left),
        top: Math.round(rect.top - editorRect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right - editorRect.left),
        bottom: Math.round(rect.bottom - editorRect.top)
    }
);

            if (control && 'value' in control) {
                const baseType = control.getAttribute('data-placeholder-base-type') || '';
                // Newlines are collapsed so a multi-line textarea value cannot
                // split the surrounding block in the rendered Delta.
                const displayValue = this.formatValueForPdf(control.value ?? '', baseType)
                    .replace(/\r?\n/g, ' ');

                replacements.set(index, {
                    // A zero-length insert is illegal in a Delta; a single space
                    // keeps the op valid if a field somehow slipped through empty.
                    insert: displayValue || ' ',
                    attributes: this.deltaFormatsFromNode(node)
                });
            }
        });

        if (replacements.size) {
            let position = 0;

            // One pass over the ops - the offset is advanced by each op's
            // ORIGINAL length (read before any rewrite) so multiple
            // placeholders stay in sync.
            pdfDelta.ops.forEach(op => {
                const length = typeof op.insert === 'string' ? op.insert.length : 1;
                const replacement = replacements.get(position);

                if (replacement) {
                    op.insert = replacement.insert;

                    if (replacement.attributes && Object.keys(replacement.attributes).length) {
                        op.attributes = { ...(op.attributes || {}), ...replacement.attributes };
                    }
                }

                position += length;
            });
        }

        console.log('[DOCUMENT_EDITOR] PDF Delta prepared:', pdfDelta);

        return pdfDelta;
    }

    /**
     * Quill text-run formats for a placeholder's authored typography, in the
     * exact shape renderResolvedValue() builds for AUTO values so a manual
     * value prints identically to an auto-filled one.
     */
    deltaFormatsFromNode(node) {
        const textStyle = this.getPlaceholderTextStyle(node);
        const formats = {};

        if (textStyle.fontFamily) {
            formats.font = textStyle.fontFamily;
        }

        if (textStyle.fontSize) {
            formats.size = `${textStyle.fontSize}px`;
        }

        if (textStyle.bold) {
            formats.bold = true;
        }

        if (textStyle.italic) {
            formats.italic = true;
        }

        if (textStyle.underline) {
            formats.underline = true;
        }

        if (textStyle.color) {
            formats.color = textStyle.color;
        }

        return formats;
    }
    async handleSavePdf() {
        console.log('[DOCUMENT_EDITOR] PDF generation started');
        const generationStart = performance.now();

        if (!this.documentName?.trim()) {
            this.showToast('Error', 'Please enter the document name', 'error');
            return;
        }

        if (!this.validatePlaceholders()) {
            return;
        }

        this.isLoading1 = true;
        await new Promise(resolve => requestAnimationFrame(() => resolve()));

         try {
            const delta = this.buildPdfDelta();

console.log('========== [DOCUMENT_EDITOR] PDF DELTA START ==========');
console.log('[DOCUMENT_EDITOR] Full PDF Delta:', JSON.stringify(delta, null, 2));
console.log('[DOCUMENT_EDITOR] PDF Delta ops:', delta?.ops?.length);
console.log('========== [DOCUMENT_EDITOR] PDF DELTA END ==========');
            if (!delta?.ops?.length) {
                throw new Error('Quill document content is empty');
            }

            const templateName =
                this.templateData?.Template_Name__c ||
                this.templateData?.Template_Name ||
                'document';

            const fileName = `${templateName}_${Date.now()}.pdf`;

            console.log('[DOCUMENT_EDITOR] Sending Quill Delta to PDF API:', {
                ops: delta.ops.length,
                fileName
            });

            const response = await fetch(
                this.quillPdfRenderEndpoint,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        delta: delta,
                        env: this.environmentLabel,
                        folder: 'generated/pdf',
                        baseName: fileName.replace(/\.pdf$/i, ''),
                        title: this.documentName.trim(),
                        pageFormat: 'A4',
                        expiresIn: 3600
                    })
                }
            );  
 

            console.log('[DOCUMENT_EDITOR] PDF API HTTP status:', response.status);

            const result = await response.json();

            console.log('[DOCUMENT_EDITOR] PDF API response:', result);

            if (!response.ok || !result?.success || !result?.pdf?.url) {
                throw new Error(
                    result?.message || 'PDF API failed to generate the document'
                );
            }

            const awsResult = {
                fileUrl: result.pdf.publicUrl,
                key: result.pdf.key || '',
                response: result
            };

            console.log('[DOCUMENT_EDITOR] PDF generated successfully:', {
                fileUrl: awsResult.fileUrl,
                key: awsResult.key,
                sizeBytes: result.pdf.sizeBytes,
                expiresIn: result.pdf.expiresIn
            });

            console.log(
                '[DOCUMENT_EDITOR] PDF API generation time:',
                `${Math.round(performance.now() - generationStart)}ms`
            );

            this.participantTemplateResult = await this.createParticipantTemplate(
                awsResult,
                this.documentName.trim()
            );

            console.log(
                '[DOCUMENT_EDITOR] Participant Template result:',
                this.participantTemplateResult
            );

            this.showSuccessModal = true;

            console.log(
                '[DOCUMENT_EDITOR] COMPLETE SAVE FLOW TIME:',
                `${Math.round(performance.now() - generationStart)}ms`
            );

        } catch (error) {
            console.error('[DOCUMENT_EDITOR] PDF generation failed:', error);

            document
                .querySelectorAll('[data-pdf-temp-editor="true"]')
                .forEach(node => node.remove());

            this.showToast(
                'Error',
                error?.message || 'Failed to generate PDF',
                'error'
            );
        } finally {
            this.isLoading1 = false;
        }
    }
    // =====================================================================
    // PDF VALUE RESOLUTION
    // =====================================================================

    /**
     * Replace every manual control in the PDF clone with the value the user
     * actually entered, styled with the placeholder's own font.
     *
     * An <input>/<textarea>/<select> keeps its current value in a DOM
     * *property*, not in the HTML attribute, so cloneNode(true) copies an
     * empty control. Values are therefore read from the live editor and
     * written into the clone as text nodes. The live editor is never touched.
     */
    resolvePdfControls(liveEditor, cloneRoot) {
        const controls = cloneRoot.querySelectorAll('[data-placeholder-control="true"]');
        console.log('[DOCUMENT_EDITOR] Resolving PDF controls:', controls.length);

        controls.forEach(clonedControl => {
            const placeholderId = clonedControl.getAttribute('data-placeholder-id');
            const baseType = clonedControl.getAttribute('data-placeholder-base-type') || '';

            const liveControl = placeholderId
                ? liveEditor.querySelector(
                    `[data-placeholder-control="true"][data-placeholder-id="${placeholderId}"]`
                )
                : null;

            const rawValue = liveControl && 'value' in liveControl
                ? (liveControl.value ?? '')
                : '';

            const displayValue = this.formatValueForPdf(rawValue, baseType);

            const span = document.createElement('span');
            span.textContent = displayValue;
            span.style.fontFamily = clonedControl.style.fontFamily;
            span.style.fontSize = clonedControl.style.fontSize;
            span.style.fontWeight = clonedControl.style.fontWeight;
            span.style.fontStyle = clonedControl.style.fontStyle;
            span.style.textDecoration = clonedControl.style.textDecoration;
            span.style.color = clonedControl.style.color;
            span.style.background = 'transparent';
            span.style.border = 'none';
            span.style.padding = '0';
            span.style.margin = '0';
            span.style.verticalAlign = 'baseline';

            if (baseType === 'address' || baseType === 'longtext') {
                span.style.whiteSpace = 'pre-wrap';
                span.style.display = 'inline-block';
                span.style.maxWidth = '100%';
            }

            clonedControl.replaceWith(span);
        });

        // Unresolved placeholder chips would print as "[ Field ]". Strip the
        // chip chrome so anything left over prints as plain document text.
        cloneRoot.querySelectorAll('.quill-placeholder-embed').forEach(node => {
            node.style.background = 'transparent';
            node.style.border = 'none';
            node.style.padding = '0';
        });
    }

    /** Templates renders dates as DD-MM-YYYY (getFormattedDisplayValue). */
    formatValueForPdf(value, baseType) {
        const text = value ?? '';
        if (!text) { return ''; }

        if (baseType === 'date' || baseType === 'dateofsigning') {
            if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
                return text;
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                const [year, month, day] = text.split('-');
                return `${day}-${month}-${year}`;
            }
        }

        return text;
    }

    // =====================================================================
    // PDF PAGINATION
    // =====================================================================

    /**
     * Collect every line-bottom in the document in a SINGLE layout pass.
     *
     * The previous implementation called findSafePdfBreak once per PDF page,
     * and each call walked every p/h1/h2/h3/li in the whole document building
     * a Range and calling getClientRects(). That is O(pages x elements) forced
     * layouts and was the dominant cost of PDF generation on long documents.
     * The candidate list is identical - it is just computed once.
     */
    collectPdfBreakCandidates(tempEditor) {
        const elements = Array.from(tempEditor.querySelectorAll('p, h1, h2, h3, li'));
        const editorTop = tempEditor.getBoundingClientRect().top;
        const candidates = [];

        elements.forEach(element => {
            const range = document.createRange();
            range.selectNodeContents(element);

            const rects = range.getClientRects();
            for (let i = 0; i < rects.length; i++) {
                candidates.push(rects[i].bottom - editorTop);
            }
        });

        candidates.sort((a, b) => a - b);
        console.log('[DOCUMENT_EDITOR] PDF break candidates:', candidates.length);
        return candidates;
    }

    /**
     * Largest candidate break inside (searchStart, targetY], or targetY when
     * there is none. Same result as the old findSafePdfBreak, but a binary
     * search over the precomputed list instead of a fresh layout pass.
     */
    findSafePdfBreak(candidates, sourceY, targetY) {
        const searchStart = Math.max(sourceY + 20, targetY - 150);

        let lo = 0;
        let hi = candidates.length - 1;
        let bestY = null;

        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (candidates[mid] <= targetY) {
                if (candidates[mid] >= searchStart) {
                    bestY = candidates[mid];
                }
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        return bestY || targetY;
    }

    async uploadPdfToAws(pdfBlob) {
        console.log('[DOCUMENT_EDITOR] Starting PDF AWS upload');
        const awsUploader = this.template.querySelector('c-aws-batch-lwc');
        if (!awsUploader) { throw new Error('AWS uploader is not available'); }
        if (!pdfBlob) { throw new Error('PDF Blob is empty'); }
        const templateName = this.templateData?.Template_Name__c || this.templateData?.Template_Name || 'document';
        const fileName = `${templateName}_${Date.now()}.pdf`;
        console.log('[DOCUMENT_EDITOR] PDF file name:', fileName);
        console.log('[DOCUMENT_EDITOR] PDF size:', pdfBlob.size);
        const result = await awsUploader.uploadPayload(pdfBlob, fileName, 'application/pdf');
        console.log('[DOCUMENT_EDITOR] AWS upload result:', result);
        if (!result?.success) { throw new Error('PDF AWS upload failed'); }
        const response = typeof result.responseText === 'string' ? JSON.parse(result.responseText) : result.responseText;
        console.log('[DOCUMENT_EDITOR] AWS response:', response);
        const file = response?.files?.[0];
        const fileUrl = response?.fileUrls?.[0] || file?.url || '';
        const key = file?.key || '';
        console.log('[DOCUMENT_EDITOR] Uploaded PDF URL:', fileUrl);
        console.log('[DOCUMENT_EDITOR] Uploaded PDF Key:', key);
        return { fileUrl, key, response };
    }

    async createParticipantTemplate(awsResult, fileName) {
        console.log('[DOCUMENT_EDITOR] Creating Participant_Template__c');
        const templateId = this.templateData?.Id || this.templateData?.templateId;
        if (!templateId) { throw new Error('Source Template Id is missing'); }
        const recipientJson = JSON.stringify(this.sendDocumentForm || {});
        const fingerprint = `${templateId}_${this.sendDocumentForm?.contactId || ''}`;
        console.log('[DOCUMENT_EDITOR] Parent Template Id:', templateId);
        console.log('[DOCUMENT_EDITOR] AWS PDF URL:', awsResult.fileUrl);
        console.log('[DOCUMENT_EDITOR] Recipient JSON:', recipientJson);
        const result = await storePdfRecord({ pdfUrl: awsResult.fileUrl, parentRecordId: templateId, orgId: this.orgid, documentName: fileName, recipientJson: recipientJson, fingerprint: fingerprint });
        console.log('[DOCUMENT_EDITOR] Participant_Template__c created:', result);
        return result;
    }

    handleDocumentNameChange(event) {
        this.documentName = event.target.value;
        console.log(
            '[DOCUMENT_EDITOR] Document Name:',
            this.documentName
        );
    }
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    handleGoToDocuments() {
        console.log('[DOCUMENT_EDITOR] Go to Documents clicked');

        this.showSuccessModal = false;

        this.dispatchEvent(
            new CustomEvent('documentsuccess', {
                detail: {
                    recordId: this.participantTemplateResult?.recordId,
                    pdfUrl: this.participantTemplateResult?.pdfUrl
                }
            })
        );
    }

    handleContinueToTSign() {
        console.log('[DOCUMENT_EDITOR] Continue to TSign clicked');

        this.showSuccessModal = false;

        this.dispatchEvent(
            new CustomEvent('continuetotsign', {
                detail: {
                    recordId: this.participantTemplateResult?.recordId,
                    pdfUrl: this.participantTemplateResult?.pdfUrl,
                    contactId: this.sendDocumentForm?.contactId || ''
                }
            })
        );
    }
}