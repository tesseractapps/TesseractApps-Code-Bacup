import { LightningElement, track, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import QUILL from '@salesforce/resourceUrl/Quill';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import saveTemplateData from '@salesforce/apex/myTemplates.saveTemplateData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Set to true to re-enable the verbose per-element pagination diagnostics.
const PAGINATION_DEBUG = false;

export default class TesseractappsCreateTemplate extends LightningElement {
    savedPlaceholders = [];
    @api orgid;
    isEditMode = false;
    isDraftTemplate = false;
    @track quillLoaded = false;
    @track quillInstances = {};
    @track templateName = '';
    @track description = '';
    @track templateType = '';
    @track category = '';
    @track isSidebarCollapsed = false;
    @track customFields = [];
    @track pages = [];
    @track showCustomFieldModal = false;
    @track customFieldLabel = '';
    @track customFieldType = 'Text';
    @track saveCustomFieldConfig = false;
    @track isSidebarCollapsed = false;
    @track showConfirmationModal = false;
    @track pendingAction = null;
    @track confirmationTitle = '';
    @track confirmationMessage = '';
    @track confirmButtonLabel = '';
    @track showSettingsModal = false;
    @track tempPlaceholder = {};
    @track isNewPlaceholder = false;
    @track showPreviewModal = false;
    previewContentHtml = '';
    _templateData;

    // Blocking overlay for the two unavoidable network waits: loading the
    // document from AWS on open, and the AWS upload + Apex save on commit.
    @track isLoading = false;
    @track loadingMessage = 'Setting Up Things, Please Wait...';

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    @api
    get templateData() {
        return this._templateData;
    }
    set templateData(value) {
        this._templateData = value;
        console.log('[CREATE_TEMPLATE] templateData changed:', value?.templateId || 'NEW');
        if (value?.templateId) this.handleTemplateDataChange();
    }
    get typeOptions() {
        return [
            { label: 'Staff', value: 'Staff' },
            { label: 'Participant', value: 'Participant' },
            { label: 'Organisation', value: 'Organisation' }
        ];

    }

    handleTemplateFieldChange(event) {
        const field = event.target.dataset.field;
        const value =
            event.detail?.value ??
            event.target.value;
        console.log('Field Changed:', field);
        console.log('Value:', value);
        this[field] = value;
    }

    toggleSidebarTemplate() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    get templateDetailsPanelClass() {
        return this.isSidebarCollapsed
            ? 'template-details-panel collapsed'
            : 'template-details-panel';
    }

    get templateLayoutClass() {
        return this.isSidebarCollapsed
            ? 'template-layout sidebar-collapsed'
            : 'template-layout';
    }

    @track richTextContent = '';
    handleRichTextChange(event) {
        this.richTextContent = event.target.value;
        console.log(
            'Descriptive Text:',
            this.richTextContent
        );
    }

    @track sectionDemographicOpen = true;
    @track sectionCustomOpen = false;
    get chevronIconDemographic() {
        return this.sectionDemographicOpen
            ? 'expand_less'
            : 'expand_more';
    }
    get chevronIconCustom() {
        return this.sectionCustomOpen
            ? 'expand_less'
            : 'expand_more';
    }


    renderedCallback() {
        // this.syncPreviewContent();
        if (this.quillLoaded) return;
        this.quillLoaded = true;
        this.initializeEditor();
    }
    /* 
        openPreview() {
            const quill = this.quillInstances?.richTextEditor;
            if (!quill) {
                console.warn('[CREATE_TEMPLATE] Preview requested before editor was ready');
                return;
            }
            // Snapshot the live editor DOM as-is: it already has the correct
            // per-page marginTop spacing applied by repaginate(), so the
            // preview shows the exact same page layout without recomputing it.
            this.previewContentHtml = quill.root.innerHTML;
            this.showPreviewModal = true;
        } */
    openPreview() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('[CREATE_TEMPLATE] Preview requested before editor was ready');
            return;
        }

        console.log('[CREATE_TEMPLATE] Opening document preview');

        this.previewContentHtml = quill.root.innerHTML;
        this.showPreviewModal = true;

        requestAnimationFrame(() => {
            this.renderPreviewPages();
        });
    }

    renderPreviewPages() {
        const previewContainer = this.template.querySelector('.preview-pages');
        const quill = this.quillInstances?.richTextEditor;
        if (!previewContainer || !quill) return;

        const children = Array.from(quill.root.children);
        const PAGE_HEIGHT = 1120;
        const MARGIN_TOP = 40;
        const MARGIN_BOTTOM = 40;
        const PAGE_LIMIT = PAGE_HEIGHT - MARGIN_BOTTOM;

        previewContainer.innerHTML = '';

        let page = this.createPreviewPage();
        let contentY = MARGIN_TOP;

        children.forEach(child => {
            const isManualPageBreak = child.classList.contains('quill-page-break') || child.getAttribute('data-type') === 'PageBreak';

            if (isManualPageBreak) {
                if (page.querySelector('.preview-content').children.length) {
                    previewContainer.appendChild(page);
                }
                page = this.createPreviewPage();
                contentY = MARGIN_TOP;
                return;
            }

            const height = child.offsetHeight;
            const clone = child.cloneNode(true);

            // Remove editor-only pagination styles.
            clone.style.marginTop = '';
            clone.style.minHeight = '';

            if (contentY + height > PAGE_LIMIT && contentY > MARGIN_TOP) {
                previewContainer.appendChild(page);
                page = this.createPreviewPage();
                contentY = MARGIN_TOP;
            }

            page.querySelector('.preview-content').appendChild(clone);
            contentY += height;
        });

        if (page.querySelector('.preview-content').children.length) {
            previewContainer.appendChild(page);
        }

        console.log('[CREATE_TEMPLATE] Preview pages rendered:', previewContainer.children.length);
    }


    createPreviewPage() {
        const page = document.createElement('div');
        page.className = 'preview-page';

        const content = document.createElement('div');
        content.className = 'preview-content';

        page.appendChild(content);
        return page;
    }

    closePreview() {
        console.log('[CREATE_TEMPLATE] Closing document preview');
        this.showPreviewModal = false;
        this.previewContentHtml = '';
    }

    /*     closePreview() {
            this.showPreviewModal = false;
        } */
    /* 
        syncPreviewContent() {
            if (!this.showPreviewModal) return;
            const previewEl = this.template.querySelector('.preview-content');
            if (previewEl) {
                previewEl.innerHTML = this.previewContentHtml || '';
            }
        } */

    async initializeEditor() {
        this.loadingMessage = 'Loading Template, Please Wait...';
        this.isLoading = true;
        try {
            // Start both network waits together: the AWS content fetch does not
            // depend on Quill being present (setRichTextContentInQuill no-ops
            // until the instance exists), so serialising them just added the
            // library download time on top of the content download time.
            const contentReady = this.loadExistingTemplateData();
            const libraryReady = Promise.all([
                loadScript(this, QUILL + '/quill.min.js'),
                loadStyle(this, QUILL + '/quill.snow.css')
            ]);
            await Promise.all([contentReady, libraryReady]);
            console.log('[CREATE_TEMPLATE] Quill loaded successfully');
            this.registerQuillEmbed();
            this.initializeQuill();
            const quill = this.quillInstances?.richTextEditor;
            if (quill && this.richTextContent) {
                console.log('[CREATE_TEMPLATE] Loading AWS HTML into Quill:', this.richTextContent.length);
                quill.root.innerHTML = this.richTextContent;
                quill.update();
                console.log('[CREATE_TEMPLATE] AWS HTML successfully loaded into Quill');
            } else {
                console.log('[CREATE_TEMPLATE] No rich-text content available to load');
            }
            this.repaginate();
            // First open only: this repaginate measures block heights before the
            // fonts and images quill.snow.css / the document reference have
            // finished loading, so offsetHeight comes back with fallback metrics
            // and content lands past the page-break line. On a later open those
            // assets are cached and the same measurement is already correct -
            // which is why cancelling and re-opening "fixes" it. Measure again
            // once the assets are genuinely ready.
            this.repaginateWhenAssetsReady();
        } catch (error) {
            this.quillLoaded = false;
            console.error('[CREATE_TEMPLATE] Error initializing editor:', error);
        } finally {
            this.isLoading = false;
        }
    }
    registerQuillEmbed() {
        if (!window.Quill) {
            console.error('window.Quill is not defined');
            return;
        }

        try {
            // Check if already registered to avoid duplicates
            if (window.Quill.import('blots/embed') && window.Quill.import('formats/placeholder-field')) {
                return;
            }
        } catch (e) { }

        try {
            const Embed = window.Quill.import('blots/embed');
            const BlockEmbed = window.Quill.import('blots/block/embed');
            class PlaceholderFieldBlot extends Embed {
                static create(value) {
                    const node = super.create();
                    const id = value.id || ('ph-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
                    node.setAttribute('data-id', id);
                    node.setAttribute('data-type', value.type || '');
                    node.setAttribute('data-label', value.label || '');
                    node.setAttribute('data-demographic-field', value.isDemographicField ? 'true' : 'false');
                    node.setAttribute('data-demographic-source', value.demographicSourceField || value.type || '');
                    node.setAttribute('data-demographic-value-mode', value.demographicValueMode || 'AUTO');
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

                    // Set base styles
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
            // =========================================================
            // PAGE BREAK QUILL BLOT
            // =========================================================
            const PageBreakBlot = class extends BlockEmbed {

                static create() {
                    const node = super.create();
                    node.setAttribute('data-type', 'PageBreak');
                    node.setAttribute('data-page-break', 'true');
                    node.classList.add('quill-page-break');
                    node.innerText = '<---------------- PAGE BREAK ---------------->';
                    node.contentEditable = 'false';
                    // Center the Page Break marker
                    node.style.display = 'flex';
                    node.style.width = '100%';
                    node.style.boxSizing = 'border-box';
                    node.style.justifyContent = 'center';
                    node.style.alignItems = 'center';
                    node.style.textAlign = 'center';
                    node.style.height = '40px';
                    node.style.margin = '20px 0';
                    node.style.borderTop = '2px dashed #999';
                    node.style.borderBottom = '2px dashed #999';
                    node.style.color = '#666';
                    node.style.fontSize = '12px';
                    node.style.fontWeight = '600';
                    node.style.userSelect = 'none';
                    node.style.cursor = 'default';
                    return node;
                }
                static value() {
                    return {
                        type: 'PageBreak'
                    };
                }
            };
            PageBreakBlot.blotName = 'page-break';
            PageBreakBlot.tagName = 'div';
            PageBreakBlot.className = 'quill-page-break';

            window.Quill.register(PageBreakBlot);
            console.log('✅ Registered Custom Quill Blot');
        } catch (err) {
            console.error('Error registering Quill Custom Blot:', err);
        }
    }

    injectEditorStyles() {
        if (this.template.querySelector('style.quill-custom-styles')) {
            return;
        }
        const style = document.createElement('style');
        style.classList.add('quill-custom-styles');
        style.textContent = `
            /* Custom Scrollbar Styles */
            .custom-scroll::-webkit-scrollbar {
                width: 6px !important;
                height: 6px !important;
            }
            .custom-scroll::-webkit-scrollbar-track {
                background: #f1f5f9 !important;
                border-radius: 10px !important;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 10px !important;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
            }

            .quill-page-break {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: auto !important;
                height: 40px !important;
                margin-left: -75px !important;
                margin-right: -75px !important;
                padding: 0 !important;
                background: transparent !important;
                border-top: 1px dashed #cbd5e1 !important;
                border-bottom: 1px dashed #cbd5e1 !important;
                color: #94a3b8 !important;
                font-size: 11px !important;
                font-weight: 500 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.1em !important;
                box-sizing: border-box !important;
                user-select: none !important;
                cursor: default !important;
            }

            .rich-text-editor.ql-container {
                display: flex !important;
                flex-direction: column !important;
                flex: 1 1 auto !important;
                min-height: 0 !important;
                min-width: 0 !important;
                font-size: 14px !important;
                border: none !important;
                background: transparent !important;
                overflow: visible !important;
            }

            .rich-text-editor .ql-editor {
                flex: 1 1 auto !important;
                min-height: 0 !important;
                min-width: 0 !important;
                overflow: visible !important;
                background: transparent !important;
                padding: 40px 75px !important; /* Document Margins: Reduced Top/Bottom Margin */
            }

            .rich-text-editor-wrapper > .ql-toolbar {
                position: sticky !important;
                top: 0 !important;
                margin: 0 0 20px 0 !important;
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
                flex: 0 0 auto !important;
            }

            .quill-placeholder-embed {
                display: inline-block !important;
                padding: 2px 6px !important;
                margin: 0 2px !important;
                border-radius: 4px !important;
                background-color: #e0f2fe !important;
                border: 1px solid #bae6fd !important;
                color: #0369a1 !important;
                font-weight: bold !important;
                cursor: pointer !important;
                user-select: none !important;
                transition: all 0.2s ease !important;
            }

            .quill-placeholder-embed:hover {
                background-color: #bae6fd !important;
                border-color: #7dd3fc !important;
                color: #025a87 !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            }
        `;
        this.template.appendChild(style);
    }

    initializeQuill() {
        this.injectEditorStyles();
        const editor = this.template.querySelector('[data-id="richTextEditor"]');
        if (!editor) {
            console.warn('⚠️ Rich Text editor element not found');
            return;
        }
        // Prevent creating Quill twice
        if (this.quillInstances.richTextEditor) {
            return;
        }
        // const toolbarOptions = [
        //     [{ font: [] }],
        //     [{ size: ['small', false, 'large', 'huge'] }],
        //     ['bold', 'italic', 'underline', 'strike'],
        //     [{ color: [] }, { background: [] }],
        //     [{ script: 'sub' }, { script: 'super' }],
        //     [{ header: 1 }, { header: 2 }],
        //     ['blockquote', 'code-block'],
        //     [{ list: 'ordered' }, { list: 'bullet' }],
        //     [{ indent: '-1' }, { indent: '+1' }],
        //     [{ direction: 'rtl' }],
        //     [{ align: [] }],
        //     ['link', 'image'],
        //     ['clean']
        // ];
        // const quill = new window.Quill(editor, {
        //     theme: 'snow',
        //     modules: {
        //         toolbar: toolbarOptions
        //     }
        // });
        // this.quillInstances.richTextEditor = quill;
        // Use Quill's built-in size whitelist, exactly as tesserappsDocumentEditor
        // does. A custom px whitelist ('10px'..'24px') has no matching labels in
        // quill.snow.css, so every size-picker row fell back to "Normal"; the
        // built-in values are labelled Small / Normal / Large / Huge.
        const toolbarOptions = [
            [{ font: [] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ header: 1 }, { header: 2 }],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ align: [] }],
            ['link', 'image'],
            ['clean']
        ];

        const quill = new window.Quill(editor, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        image: () => this.handleToolbarImage()
                    }
                }
            }
        });

        this.quillInstances.richTextEditor = quill;
        let savedSelection = null;

        quill.on('selection-change', (range, oldRange, source) => {
            if (range) {
                savedSelection = range;
                // Keep the last caret position reachable from class methods
                // (handleDrop / image handler) - dragging a placeholder from the
                // side panel or opening the file dialog blurs the editor, so
                // quill.getSelection() is null by the time those run.
                this._lastKnownRange = range;
            }
        });

        const toolbar = quill.getModule('toolbar');
        if (toolbar?.container) {
            toolbar.container.addEventListener('mousedown', () => {
                const selection = quill.getSelection();
                if (selection) {
                    savedSelection = selection;
                    console.log('[CREATE_TEMPLATE] Toolbar selection saved:', selection);
                }
            }, true);

            toolbar.container.addEventListener('click', () => {
                if (savedSelection) {
                    requestAnimationFrame(() => {
                        quill.setSelection(savedSelection.index, savedSelection.length, 'silent');
                        console.log('[CREATE_TEMPLATE] Toolbar selection restored:', savedSelection);
                    });
                }
            }, true);
        }//end
        // Load existing content if available
        if (this.richTextContent) {
            quill.root.innerHTML = this.richTextContent;
        }
        this.repaginate();
        // Listen for changes
        quill.on('text-change', () => {
            this.richTextContent = quill.root.innerHTML;
            this.repaginate();
            console.log('📝 Descriptive Text updated');
        });
        // Add drag & drop listeners directly to Quill editor root
        quill.root.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy';
            }
        });
        quill.root.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDrop(e);
        });
        // Listen for clicks inside editor to edit existing placeholders
        quill.root.addEventListener('click', (e) => {
            const embedEl = e.target.closest('.quill-placeholder-embed');
            if (embedEl) {
                e.preventDefault();
                e.stopPropagation();

                const id = embedEl.getAttribute('data-id');
                const type = embedEl.getAttribute('data-type');
                const label = embedEl.getAttribute('data-label');
                const isDemographicField = embedEl.getAttribute('data-demographic-field') === 'true';
                // Page Break does not have settings
                if (type === 'PageBreak') {
                    return;
                }
                const demographicSourceField = embedEl.getAttribute('data-demographic-source') || type;
                const demographicValueMode = embedEl.getAttribute('data-demographic-value-mode') || 'AUTO';
                const recipient = embedEl.getAttribute('data-recipient') || '';
                const customInlineStyle = embedEl.getAttribute('data-custom-style') === 'true';

                const textStyle = {
                    fontFamily: embedEl.getAttribute('data-font-family') || 'Arial, Helvetica, sans-serif',
                    fontSize: embedEl.getAttribute('data-font-size') || '14',
                    bold: embedEl.getAttribute('data-bold') === 'true',
                    italic: embedEl.getAttribute('data-italic') === 'true',
                    underline: embedEl.getAttribute('data-underline') === 'true',
                    color: embedEl.getAttribute('data-color') || '#000000'
                };

                this.tempPlaceholder = {
                    id,
                    type,
                    label,
                    isDemographicField,
                    demographicSourceField,
                    demographicValueMode,
                    recipient,
                    customInlineStyle,
                    textStyle
                };

                this.isNewPlaceholder = false;
                this.showSettingsModal = true;
            }
        });

        console.log('✅ Rich Text Quill initialized with drag & drop support');
        this.loadSavedTemplate();
    }

    /**
     * Custom toolbar "image" handler. The built-in handler loses the caret while
     * the OS file dialog is open, so the picked image (and any newline the user
     * typed) landed in the wrong order. This captures the caret up front, then
     * always drops the image onto its own fresh line below the preceding text.
     */
    handleToolbarImage() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) return;

        const range = quill.getSelection(true)
            || this._lastKnownRange
            || { index: Math.max(0, quill.getLength() - 1), length: 0 };
        const caretIndex = range.index;

        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;

                let insertAt = caretIndex;
                const prevChar = insertAt > 0 ? quill.getText(insertAt - 1, 1) : '\n';
                if (prevChar !== '\n') {
                    quill.insertText(insertAt, '\n', 'user');
                    insertAt += 1;
                }

                quill.insertEmbed(insertAt, 'image', dataUrl, 'user');
                quill.insertText(insertAt + 1, '\n', 'user');
                quill.setSelection(insertAt + 2, 0, 'silent');

                this.richTextContent = quill.root.innerHTML;
                this.repaginate();
            };
            reader.readAsDataURL(file);
        };

        input.click();
    }

    /**
     * Re-runs pagination once the assets that affect block height have settled.
     * Waits on document.fonts.ready (resolves immediately when the fonts are
     * already cached) and on any images still decoding, then measures on the
     * next frame so the browser has laid the document out first.
     */
    repaginateWhenAssetsReady() {
        const remeasure = () => requestAnimationFrame(() => this.repaginate());

        const waits = [];

        if (document.fonts?.ready) {
            waits.push(document.fonts.ready);
        }

        const quill = this.quillInstances?.richTextEditor;
        const images = quill ? Array.from(quill.root.querySelectorAll('img')) : [];
        images.forEach(img => {
            if (img.complete) return;
            waits.push(new Promise(resolve => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            }));
        });

        if (!waits.length) {
            remeasure();
            return;
        }

        Promise.all(waits)
            .then(remeasure)
            .catch(() => remeasure());
    }

    setRichTextContentInQuill() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill || !this.richTextContent) {
            console.log('[CREATE_TEMPLATE] Quill or rich-text content not ready');
            return;
        }
        console.log('[CREATE_TEMPLATE] Loading AWS HTML into existing Quill:', this.richTextContent.length);
        quill.root.innerHTML = this.richTextContent;
        quill.update();
        this.repaginate();

        console.log('[CREATE_TEMPLATE] AWS HTML successfully loaded into Quill');
    }

    handleDragStart(event) {
        const target = event.currentTarget || event.target;
        const type = target.dataset.type || '';
        const label = target.dataset.label || target.innerText?.trim() || type;
        const token = type ? `{{${type}}}` : `{{${label.replace(/\s+/g, '')}}}`;

        const dragData = {
            type: type,
            label: label,
            token: token
        };

        if (event.dataTransfer) {
            event.dataTransfer.setData('text/plain', token);
            event.dataTransfer.setData('application/json', JSON.stringify(dragData));
            event.dataTransfer.effectAllowed = 'copy';
        }

        target.classList.add('is-dragging');
    }

    handleDragEnd(event) {
        const target = event.currentTarget || event.target;
        if (target && target.classList) {
            target.classList.remove('is-dragging');
        }
    }

    allowDrop(event) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        let type = '';
        let label = '';

        const jsonStr = event.dataTransfer?.getData('application/json');
        if (jsonStr) {
            try {
                const data = JSON.parse(jsonStr);
                type = data.type;
                label = data.label || type;
            } catch (e) {
                // fallback
            }
        }

        if (!type) {
            const rawToken = event.dataTransfer?.getData('text/plain') || '';
            type = rawToken.replace(/[{}]/g, '').trim();
            label = type;
        }

        if (!type) {
            return;
        }

        const quill = this.quillInstances?.richTextEditor;
        if (!quill) return;

        // Always insert at the editor's text cursor, not the mouse release
        // point. Dragging from the side panel blurs the editor, so
        // quill.getSelection() is usually null here - fall back to the last
        // caret position captured by the selection-change handler.
        let insertIndex = null;
        const liveSelection = quill.getSelection();
        if (liveSelection) {
            insertIndex = liveSelection.index;
        } else if (this._lastKnownRange) {
            insertIndex = this._lastKnownRange.index;
        }

        if (insertIndex == null) {
            const len = quill.getLength();
            insertIndex = len > 0 ? len - 1 : 0;
        }

        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > quill.getLength()) insertIndex = quill.getLength();

        this.insertTokenIntoEditor(type, label, insertIndex);
    }

    handleFieldClick(event) {
        if (event.target.closest('.remove-custom-button')) {
            return;
        }
        const target = event.currentTarget;
        const type = target.dataset.type || '';
        const label = target.dataset.label || target.innerText?.trim() || type;
        this.insertTokenIntoEditor(type, label);
    }
    loadSavedTemplate() {
        if (!this.templateData?.Placeholder_JSON__c) {
            console.log('ℹ️ No saved template data to load');
            return;
        }
        try {
            const savedData = JSON.parse(
                this.templateData.Placeholder_JSON__c
            );
            console.log('📥 Saved template JSON:', savedData);
            if (!savedData?.html) {
                console.warn('⚠️ Saved template does not contain HTML');
                return;
            }
            const quill = this.quillInstances?.richTextEditor;
            if (!quill) {
                console.warn('⚠️ Quill instance not available');
                return;
            }
            quill.root.innerHTML = savedData.html;
            // Keep the component's internal content in sync
            this.richTextContent = savedData.html;
            console.log('✅ Saved Quill document loaded successfully');
        } catch (error) {
            console.error(
                '❌ Error loading saved template:',
                error
            );
        }
    }
    insertTokenIntoEditor(type, label, insertIndex) {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('⚠️ Quill editor not ready');
            return;
        }
        const id = 'ph-' + Date.now();
        // PAGE BREAK
        if (type === 'PageBreak') {
            if (insertIndex == null) {
                const selection = quill.getSelection();
                insertIndex = selection
                    ? selection.index
                    : Math.max(0, quill.getLength() - 1);
            }
            insertIndex = Math.max(
                0,
                Math.min(insertIndex, quill.getLength())
            );
            // Insert the dedicated Page Break blot
            quill.insertEmbed(
                insertIndex,
                'page-break',
                {},
                'user'
            );
            // Give the user a place to continue typing
            quill.insertText(
                insertIndex + 1,
                '\n',
                'user'
            );
            quill.setSelection(
                insertIndex + 2,
                0
            );
            this.richTextContent = quill.root.innerHTML;
            // Page Break has no settings
            this.tempPlaceholder = {};
            this.isNewPlaceholder = false;
            this.showSettingsModal = false;
            console.log('📄 Page Break inserted at:', insertIndex);
            return;
        }
        const isDemographicField = [
            "FullName",
            "FirstName",
            "LastName",
            "Email",
            "ContactNumber",
            "Address",
            "Date",
            "Time",
            "DateOfSigning",
            "Initials",
            "ABN",
            "TFN",
            "Signature"
        ].includes(type);

        if (insertIndex == null) {
            const selection = quill.getSelection();

            insertIndex = selection
                ? selection.index
                : (quill.getLength() > 0
                    ? quill.getLength() - 1
                    : 0);
        }

        insertIndex = Math.max(
            0,
            Math.min(insertIndex, quill.getLength())
        );
        let inheritedFormat = {};
        try {
            inheritedFormat = quill.getFormat(insertIndex, 0) || {};

            if (
                insertIndex > 0 &&
                Object.keys(inheritedFormat).length === 0
            ) {
                inheritedFormat =
                    quill.getFormat(insertIndex - 1, 1) || {};
            }
        } catch (error) {
            console.warn(
                'Could not determine Quill formatting:',
                error
            );
        }
        let fontFamily =
            inheritedFormat.font ||
            'Arial, Helvetica, sans-serif';
        let fontSize = inheritedFormat.size;
        if (fontSize === 'small') {
            fontSize = '12';
        } else if (fontSize === 'large') {
            fontSize = '18';
        } else if (fontSize === 'huge') {
            fontSize = '32';
        } else if (!fontSize || fontSize === false) {
            fontSize = '14';
        } else {
            fontSize = String(fontSize).replace('px', '');
        }
        const bold =
            inheritedFormat.bold === true;
        const italic =
            inheritedFormat.italic === true;
        const underline =
            inheritedFormat.underline === true;
        const color =
            inheritedFormat.color ||
            '#000000';

        const inheritedTextStyle = {
            fontFamily,
            fontSize,
            bold,
            italic,
            underline,
            color
        };
        const newPlaceholder = {
            id,
            type,
            label,
            isDemographicField,
            demographicSourceField: type,
            demographicValueMode:
                isDemographicField
                    ? 'AUTO'
                    : 'HR_MANUAL',

            recipient: '',

            customInlineStyle: true,

            textStyle: inheritedTextStyle
        };
        console.log(
            '🎨 Placeholder inherited format:',
            inheritedTextStyle
        );
        console.log(
            '📌 Placeholder:',
            newPlaceholder
        );

        quill.insertEmbed(
            insertIndex,
            'placeholder-field',
            newPlaceholder,
            'user'
        );

        quill.insertText(
            insertIndex + 1,
            ' ',
            'user'
        );
        quill.setSelection(
            insertIndex + 2,
            0
        );
        this.richTextContent =
            quill.root.innerHTML;
        this.tempPlaceholder = {
            ...newPlaceholder
        };

        this.isNewPlaceholder = true;
        this.showSettingsModal = true;
    }
    // =========================================================
    // FIELD SETTINGS MODAL / POPUP CONTROLLERS
    // =========================================================

    get showTextStylePanel() {
        return !!this.tempPlaceholder && Object.keys(this.tempPlaceholder).length > 0;
    }

    get showValueSourcePanel() {
        if (!this.tempPlaceholder?.isDemographicField) {
            return false;
        }

        const FORCED_MANUAL_TYPES = new Set([
            "Date",
            "DateOfSigning",
            "Initials",
            "Signature",
            "Time"
        ]);

        return !FORCED_MANUAL_TYPES.has(this.tempPlaceholder?.type);
    }

    get fontFamilyOptions() {
        return [
            { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
            { label: 'Roboto', value: 'Roboto, Arial, sans-serif' },
            { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
            { label: 'Calibri', value: 'Calibri, Arial, sans-serif' },
            { label: 'Courier New', value: '"Courier New", Courier, monospace' }
        ];
    }

    get fontSizeOptions() {
        return [
            { label: '10', value: '10' },
            { label: '12', value: '12' },
            { label: '14', value: '14' },
            { label: '16', value: '16' },
            { label: '18', value: '18' },
            { label: '20', value: '20' },
            { label: '24', value: '24' }
        ];
    }

    get demographicValueModeOptions() {
        return [
            { label: 'Auto-fill', value: 'AUTO' },
            { label: 'Fill Manually', value: 'HR_MANUAL' }
        ];
    }

    get recipientOptions() {
        return [
            { label: 'Staff', value: 'Staff' },
            { label: 'Participant', value: 'Participant' },
            { label: 'Organisation', value: 'Organisation' }
        ];
    }

    get stylePanelGridClass() {
        return this.tempPlaceholder?.customInlineStyle
            ? 'style-panel-grid'
            : 'style-panel-grid style-disabled';
    }

    get boldToggleClass() {
        return this.tempPlaceholder?.textStyle?.bold ? 'style-toggle-pill active' : 'style-toggle-pill';
    }

    get italicToggleClass() {
        return this.tempPlaceholder?.textStyle?.italic ? 'style-toggle-pill active' : 'style-toggle-pill';
    }

    get underlineToggleClass() {
        return this.tempPlaceholder?.textStyle?.underline ? 'style-toggle-pill active' : 'style-toggle-pill';
    }

    get stylePreviewCss() {
        const ph = this.tempPlaceholder;
        if (!ph) return '';

        const s = ph.textStyle || {};
        const enabled = !!ph.customInlineStyle;

        if (!enabled) {
            return `
                font-family: Arial, Helvetica, sans-serif;
                font-size: 20px;
                font-weight: 400;
                font-style: normal;
                text-decoration: none;
                color: #181818;
                padding: 0;
                background: #ffffff;
                border: 1px solid #d8dde6;
                border-radius: 6px;
                display: block;
                text-align: left;
            `;
        }

        return `
            font-family: ${s.fontFamily || 'Arial, Helvetica, sans-serif'};
            font-size: ${s.fontSize || '20'}px;
            font-weight: ${s.bold ? '700' : '400'};
            font-style: ${s.italic ? 'italic' : 'normal'};
            text-decoration: ${s.underline ? 'underline' : 'none'};
            color: ${s.color || '#000000'};
            padding: 6px;
            background: #ffffff;
            border: 1px dashed #d1d5db;
            border-radius: 6px;
            display: block;
            text-align: left;
        `;
    }

    handleCustomInlineStyleToggle(event) {
        if (this.tempPlaceholder) {
            this.tempPlaceholder = {
                ...this.tempPlaceholder,
                customInlineStyle: event.target.checked
            };
        }
    }

    handleStyleOptionChange(event) {
        const { name, value } = event.target;
        if (this.tempPlaceholder && this.tempPlaceholder.textStyle) {
            this.tempPlaceholder = {
                ...this.tempPlaceholder,
                textStyle: {
                    ...this.tempPlaceholder.textStyle,
                    [name]: value
                }
            };
        }
    }

    handleStyleToggleClick(event) {
        const styleName = event.currentTarget.dataset.styleName;
        if (this.tempPlaceholder && this.tempPlaceholder.textStyle) {
            this.tempPlaceholder = {
                ...this.tempPlaceholder,
                textStyle: {
                    ...this.tempPlaceholder.textStyle,
                    [styleName]: !this.tempPlaceholder.textStyle[styleName]
                }
            };
        }
    }

    handleConfigFieldChange(event) {
        const name = event.target.name;
        const value = event.detail?.value ?? event.target.value;
        if (this.tempPlaceholder) {
            this.tempPlaceholder = {
                ...this.tempPlaceholder,
                [name]: value
            };
        }
    }

    cancelSettingsModal() {
        this.showSettingsModal = false;

        // If it was a new drop and user cancelled, remove it from the editor
        if (this.isNewPlaceholder && this.tempPlaceholder?.id) {
            const quill = this.quillInstances?.richTextEditor;
            if (quill) {
                const editor = this.template.querySelector('[data-id="richTextEditor"]');
                if (editor) {
                    const embedNode = editor.querySelector(`span[data-id="${this.tempPlaceholder.id}"]`);
                    if (embedNode) {
                        embedNode.remove();
                        this.richTextContent = quill.root.innerHTML;
                    }
                }
            }
        }

        this.tempPlaceholder = {};
    }

    saveSettingsModal() {
        this.showSettingsModal = false;
        this.updateQuillEmbed(this.tempPlaceholder);
        this.tempPlaceholder = {};
    }

    updateQuillEmbed(placeholder) {
        const editor = this.template.querySelector('[data-id="richTextEditor"]');
        if (!editor) return;
        const embedNode = editor.querySelector(`span[data-id="${placeholder.id}"]`);
        if (!embedNode) return;

        // Update attributes on DOM node to preserve metadata configuration
        embedNode.setAttribute('data-label', placeholder.label || '');
        embedNode.setAttribute('data-demographic-source', placeholder.demographicSourceField || '');
        embedNode.setAttribute('data-demographic-value-mode', placeholder.demographicValueMode || 'AUTO');
        embedNode.setAttribute('data-recipient', placeholder.recipient || '');
        embedNode.setAttribute('data-custom-style', placeholder.customInlineStyle ? 'true' : 'false');

        const ts = placeholder.textStyle || {};
        embedNode.setAttribute('data-font-family', ts.fontFamily || 'Arial, Helvetica, sans-serif');
        embedNode.setAttribute('data-font-size', ts.fontSize || '14');
        embedNode.setAttribute('data-bold', ts.bold ? 'true' : 'false');
        embedNode.setAttribute('data-italic', ts.italic ? 'true' : 'false');
        embedNode.setAttribute('data-underline', ts.underline ? 'true' : 'false');
        embedNode.setAttribute('data-color', ts.color || '#000000');

        embedNode.innerText = `[ ${placeholder.label} ]`;

        if (placeholder.customInlineStyle) {
            embedNode.style.fontFamily = ts.fontFamily || 'Arial, Helvetica, sans-serif';
            embedNode.style.fontSize = (ts.fontSize || '14') + 'px';
            embedNode.style.fontWeight = ts.bold ? '700' : '400';
            embedNode.style.fontStyle = ts.italic ? 'italic' : 'normal';
            embedNode.style.textDecoration = ts.underline ? 'underline' : 'none';
            embedNode.style.color = ts.color || '#000000';
            embedNode.style.background = 'transparent';
            embedNode.style.border = 'none';
            embedNode.style.padding = '0';
            embedNode.style.margin = '0';
        } else {
            embedNode.style.fontFamily = '';
            embedNode.style.fontSize = '';
            embedNode.style.fontWeight = 'bold';
            embedNode.style.fontStyle = '';
            embedNode.style.textDecoration = '';
            embedNode.style.color = '#0369a1';
            embedNode.style.display = 'inline-block';
            embedNode.style.padding = '2px 6px';
            embedNode.style.margin = '0 2px';
            embedNode.style.borderRadius = '4px';
            embedNode.style.background = '#e0f2fe';
            embedNode.style.border = '1px solid #bae6fd';
        }

        const quill = this.quillInstances?.richTextEditor;
        if (quill) {
            this.richTextContent = quill.root.innerHTML;
        }
    }

    toggleSection(event) {
        const key =
            event.currentTarget.dataset.section;
        if (key === 'demographic') {
            this.sectionDemographicOpen =
                !this.sectionDemographicOpen;
        }
        if (key === 'custom') {
            this.sectionCustomOpen =
                !this.sectionCustomOpen;
        }
    }
    get noCustomFields() {
        return this.customFields.length === 0;
    }

    get customFieldTypeOptions() {
        return [
            {
                label: 'Text',
                value: 'Text'
            },
            {
                label: 'Number',
                value: 'Number'
            },
            {
                label: 'Date',
                value: 'Date'
            },
            {
                label: 'Time',
                value: 'Time'
            },
            {
                label: 'Email',
                value: 'Email'
            },
            {
                label: 'Address',
                value: 'Address'
            },
            {
                label: 'Long Text',
                value: 'LongText'
            },
            {
                label: 'Signature',
                value: 'Signature'
            }
        ];

    }

    openCustomFieldModal() {
        this.customFieldLabel = '';
        this.customFieldType = 'Text';
        this.showCustomFieldModal = true;
    }

    closeCustomFieldModal() {
        this.showCustomFieldModal = false;
    }

    handleCustomFieldLabelChange(event) {
        this.customFieldLabel =
            event.target.value;
    }

    handleCustomFieldTypeChange(event) {
        this.customFieldType =
            event.detail.value;
    }

    handleSaveConfigChange(event) {
        this.saveCustomFieldConfig =
            event.target.checked;
    }

    async confirmAddCustomField() {
        const label =
            this.customFieldLabel?.trim();
        if (!label) {
            console.warn(
                'Please enter a field label.'
            );
            return;
        }

        const newField = {
            id: Date.now(),
            label: label,
            type: `Custom_${this.customFieldType}_${label.replace(/\s+/g, '_')}`
        };

        this.customFields = [
            ...this.customFields,
            newField
        ];
        console.log(
            'Custom field created:',
            JSON.stringify(newField)
        );

        this.showCustomFieldModal = false;
        this.customFieldLabel = '';
        this.customFieldType = 'Text';
        this.saveCustomFieldConfig = false;
    }

    removeCustomField(event) {
        const id =
            Number(
                event.currentTarget.dataset.id
            );
        const removedField =
            this.customFields.find(
                f => f.id === id
            );
        this.customFields =
            this.customFields.filter(
                f => f.id !== id
            );
        console.log(
            'Removed custom field:',
            JSON.stringify(removedField)
        );

    }
/*     saveDraft() {
        this.openConfirmation('draft');
    }

    publishTemplate() {
        this.openConfirmation('publish');
    }

    openConfirmation(action) { */
    saveDraft(event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.openConfirmation('draft');
    }

    publishTemplate(event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.openConfirmation('publish');
    }

//     openConfirmation(action) {
//         this.pendingAction = action;
//         const templateName = this.templateName?.trim();
//         const templateText = templateName
//             ? ` template '${templateName}'`
//             : ' this template';
// /*         switch (action) {
//             case 'draft':
//                 this.confirmationTitle = 'Save as Draft';
//                 this.confirmationMessage = `Would you like to save${templateText} as draft?`;
//                 this.confirmButtonLabel = 'Save as Draft';
//                 break;
//             case 'publish':
//                 this.confirmationTitle = 'Publish Template';
//                 this.confirmationMessage = `Would you like to publish${templateText}?`;
//                 this.confirmButtonLabel = 'Publish';
//                 break;
//         } */
//        switch (action) {
//     case 'publish':
//         console.log('🟢 Calling saveTemplateWithStatus(Publish)');
//         this.saveTemplateWithStatus(
//             'Publish',
//             this.templateData?.templateId || null
//         );
//         break;

//     case 'draft':
//         console.log('🟢 Calling saveTemplateWithStatus(Draft)');
//         this.saveTemplateWithStatus(
//             'Draft',
//             this.templateData?.templateId || null
//         );
//         break;
// }
//         this.showConfirmationModal = true;
//     }

    // handleConfirmAction() {
    //     console.log('🔵 handleConfirmAction FIRED');
    //     console.log('🔵 pendingAction:', this.pendingAction);

    //     // A save is already in flight - a second confirm would fire another AWS
    //     // upload and another Apex insert, creating a duplicate template.
    //     if (this.isLoading) {
    //         console.warn('[CREATE_TEMPLATE] Save already in progress; ignoring repeat confirm');
    //         return;
    //     }

    //     this.showConfirmationModal = false;

    //     switch (this.pendingAction) {

    //         case 'draft':
    //             console.log('🟢 Calling saveTemplateWithStatus(Draft)');
    //             this.saveTemplateWithStatus('Draft');
    //             break;

    //         case 'publish':
    //             console.log('🟢 Calling saveTemplateWithStatus(Publish)');
    //             this.saveTemplateWithStatus('Publish');
    //             break;

    //         default:
    //             console.warn(
    //                 '⚠️ Unknown pendingAction:',
    //                 this.pendingAction
    //             );
    //     }

    //     this.pendingAction = null;
    // }
    openConfirmation(action) {
    this.pendingAction = action;

    const templateName = this.templateName?.trim();
    const templateText = templateName
        ? ` template '${templateName}'`
        : ' this template';

    switch (action) {
        case 'draft':
            this.confirmationTitle = 'Save as Draft';
            this.confirmationMessage = `Would you like to save${templateText} as draft?`;
            this.confirmButtonLabel = 'Save as Draft';
            break;

        case 'publish':
            this.confirmationTitle = 'Publish Template';
            this.confirmationMessage = `Would you like to publish${templateText}?`;
            this.confirmButtonLabel = 'Publish';
            break;
    }

    this.showConfirmationModal = true;
}
handleConfirmAction() {
    console.log('🔵 handleConfirmAction FIRED');
    console.log('🔵 pendingAction:', this.pendingAction);

    // A save is already in flight - a second confirm would fire another AWS
    // upload and another Apex insert, creating a duplicate template.
    if (this.isLoading) {
        console.warn('[CREATE_TEMPLATE] Save already in progress; ignoring repeat confirm');
        return;
    }

    this.showConfirmationModal = false;

    switch (this.pendingAction) {

        case 'draft':
            console.log('🟢 Calling saveTemplateWithStatus(Draft)');
            this.saveTemplateWithStatus(
                'Draft',
                this.templateData?.templateId || null
            );
            break;

        case 'publish':
            console.log('🟢 Calling saveTemplateWithStatus(Publish)');
            this.saveTemplateWithStatus(
                'Publish',
                this.templateData?.templateId || null
            );
            break;

        default:
            console.warn(
                '⚠️ Unknown pendingAction:',
                this.pendingAction
            );
    }

    this.pendingAction = null;
}
    buildRichTextJson() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            throw new Error('Rich text editor is not initialized');
        }
        const htmlContent = quill.root.innerHTML || '';
        const cleanedHtml = this.cleanHtmlForSave(htmlContent);
        return {
            version: 1,
            html: cleanedHtml
        };
    }

    buildPlaceholderJson() {
        const editor = this.template.querySelector('[data-id="richTextEditor"]');
        if (!editor) { console.error('[CREATE_TEMPLATE] Rich text editor not found'); throw new Error('Rich text editor is not available'); }
        const placeholderNodes = [...editor.querySelectorAll('.quill-placeholder-embed')];
        const placeholders = placeholderNodes.map(node => ({
            id: node.getAttribute('data-id'),
            type: node.getAttribute('data-type'),
            label: node.getAttribute('data-label'),
            isDemographicField: node.getAttribute('data-demographic-field') === 'true',
            demographicSourceField: node.getAttribute('data-demographic-source') || '',
            demographicValueMode: node.getAttribute('data-demographic-value-mode') || 'AUTO',
            recipient: node.getAttribute('data-recipient') || '',
            customInlineStyle: node.getAttribute('data-custom-style') === 'true',
            textStyle: {
                fontFamily: node.getAttribute('data-font-family') || 'Arial, Helvetica, sans-serif',
                fontSize: node.getAttribute('data-font-size') || '14',
                bold: node.getAttribute('data-bold') === 'true',
                italic: node.getAttribute('data-italic') === 'true',
                underline: node.getAttribute('data-underline') === 'true',
                color: node.getAttribute('data-color') || '#000000'
            }
        }));
        const placeholderJson = { placeholders, customFields: this.customFields || [] };
        console.log('[CREATE_TEMPLATE] Placeholder JSON prepared:', placeholderJson);
        return placeholderJson;
    }

    async uploadRichTextToAws() {
        const awsUploader = this.refs.awsUploader;
        if (!awsUploader) { console.error('[CREATE_TEMPLATE] AWS uploader not found'); throw new Error('AWS uploader is not available'); }
        const richTextJson = this.buildRichTextJson();
        const fileName = `${this.templateName?.trim() || 'template'}_content.json`;
        console.log('[CREATE_TEMPLATE] Uploading rich-text JSON to AWS:', fileName);
        try {
            const result = await awsUploader.uploadPayload(richTextJson, fileName, 'application/json');
            if (!result?.success) { throw new Error('AWS upload failed'); }
            const response = typeof result.responseText === 'string' ? JSON.parse(result.responseText) : result.responseText;
            const file = response?.files?.[0];
            const fileUrl = response?.fileUrls?.[0] || '';
            const key = file?.key || '';
            if (!fileUrl || !key) { console.error('[CREATE_TEMPLATE] AWS response missing URL or key:', response); throw new Error('AWS upload response did not contain URL and key'); }
            console.log('[CREATE_TEMPLATE] AWS URL:', fileUrl);
            console.log('[CREATE_TEMPLATE] AWS Key:', key);
            return { fileUrl, key, fileName };
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Rich-text AWS upload failed:', error);
            throw error;
        }
    }

    async testAwsUpload() {
        try { const result = await this.uploadRichTextToAws(); console.log('[CREATE_TEMPLATE] TEST AWS RESULT:', result); } catch (error) { console.error('[CREATE_TEMPLATE] TEST AWS ERROR:', error); }
    }

    async saveTemplateWithStatus(status, templateId = null) {
        if (!this.templateName?.trim()) {
            console.warn('[CREATE_TEMPLATE] Template Name is required');
            this.showToast('Error', 'Template Name is required', 'error');
            return;
        }

        if (!this.templateType) {
            console.warn('[CREATE_TEMPLATE] Template Type is required');
            this.showToast('Error', 'Template Type is required', 'error');
            return;
        }
        const richTextJson = this.buildRichTextJson();
        this.richTextContent = richTextJson.html;
        console.log('[CREATE_TEMPLATE] Rich-text JSON prepared:', richTextJson);
        console.log('[CREATE_TEMPLATE] Save mode:', templateId ? 'UPDATE' : 'CREATE');
        console.log('[CREATE_TEMPLATE] Template ID:', templateId);
        // Blocks the UI for the AWS upload + Apex save round trips. Set after
        // the validation returns and after buildRichTextJson (which throws on
        // its own) so neither path can leave the overlay stuck on screen.
        this.loadingMessage = 'Saving Template, Please Wait...';
        this.isLoading = true;
        try {
            const awsResult = await this.uploadRichTextToAws();
            console.log('[CREATE_TEMPLATE] AWS upload result:', awsResult);
            const placeholderJSON = JSON.stringify(this.buildPlaceholderJson());
            console.log('[CREATE_TEMPLATE] Final Placeholder JSON:', placeholderJSON);
            const result = await saveTemplateData({ templateId, fileName: awsResult.fileName, fileUrl: awsResult.fileUrl, placeholderJSON, orgId: this.orgid, key: awsResult.key, templateName: this.templateName.trim(), description: this.description || '', type: this.templateType, status });
            // SUCCESS TOAST
            const templateName = this.templateName.trim();

            if (templateId) {
                this.showToast(
                    'Success',
                    `Template '${templateName}' has been updated successfully.`,
                    'success'
                );
            } else if (status === 'Draft') {
                this.showToast(
                    'Success',
                    `Template '${templateName}' has been saved as draft successfully.`,
                    'success'
                );
            } else if (status === 'Publish') {
                this.showToast(
                    'Success',
                    `Template '${templateName}' has been published successfully.`,
                    'success'
                );
            }

            this.dispatchEvent(
                new CustomEvent('save', {
                    detail: {
                        recordId: result,
                        status
                    }
                })
            );
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Error saving template:', error);
            this.showToast('Error', 'Failed to save template', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleCancelConfirmation() {
        this.showConfirmationModal = false;
        this.pendingAction = null;
    }

    handleBack() {
        console.log('Back clicked in Create Template');
        this.dispatchEvent(
            new CustomEvent('back')
        );
    }

    handleCancel() {
        this.dispatchEvent(
            new CustomEvent('back')
        );

    }

    async loadExistingTemplateData() {
        console.log('[CREATE_TEMPLATE] CHILD EDIT templateData:', JSON.stringify(this.templateData));
        if (!this.templateData) { console.log('[CREATE_TEMPLATE] Create From Scratch mode'); return; }
        this.isEditMode = !!this.templateData?.templateId;
        this.isDraftTemplate = this.templateData?.status === 'Draft';
        console.log('[CREATE_TEMPLATE] Edit Mode:', this.isEditMode);
        console.log('[CREATE_TEMPLATE] Draft Template:', this.isDraftTemplate);
        const placeholderJSON = this.templateData.Placeholder_JSON__c || this.templateData.placeholders;
        console.log('[CREATE_TEMPLATE] Placeholder JSON:', placeholderJSON);
        try {
            const parsed = typeof placeholderJSON === 'string' ? JSON.parse(placeholderJSON) : placeholderJSON;
            this.templateName = this.templateData.Template_Name__c || this.templateData.name || '';
            this.description = this.templateData.Description__c || this.templateData.description || '';
            this.templateType = this.templateData.Template_Type__c || this.templateData.type || '';
            this.customFields = Array.isArray(parsed?.customFields) ? parsed.customFields : [];
            this.savedPlaceholders = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.placeholders) ? parsed.placeholders : []);
            console.log('[CREATE_TEMPLATE] Saved placeholders:', this.savedPlaceholders);
            console.log('[CREATE_TEMPLATE] AWS document URL:', this.templateData.Amazon_Url__c || this.templateData.url);
            await this.loadRichTextFromAws();
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Error parsing Placeholder JSON:', error);
        }
    }

    async loadRichTextFromAws() {
        const awsUrl = this.templateData?.Amazon_Url__c || this.templateData?.url;
        if (!awsUrl) { console.warn('[CREATE_TEMPLATE] No AWS URL found for edit'); return; }
        console.log('[CREATE_TEMPLATE] Loading rich-text JSON from AWS:', awsUrl);
        try {
            const response = await fetch(awsUrl);
            if (!response.ok) { throw new Error(`AWS JSON request failed: ${response.status}`); }
            const data = await response.json();
            if (!data?.html) { throw new Error('AWS JSON does not contain html'); }
            this.richTextContent = data.html;
            console.log('[CREATE_TEMPLATE] Rich-text HTML loaded from AWS:', this.richTextContent.length);
            this.setRichTextContentInQuill();
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Failed to load rich-text JSON from AWS:', error);
            this.showToast('Error', 'Failed to load template content from AWS', 'error');
        }
    }

    async handleTemplateDataChange() {
        if (!this.quillInstances?.richTextEditor) {
            console.log('[CREATE_TEMPLATE] Quill not ready; template will load during initialization');
            return;
        }
        console.log('[CREATE_TEMPLATE] Reloading editor for template:', this._templateData?.templateId);
        this.richTextContent = '';
        this.savedPlaceholders = [];
        this.customFields = [];
        this.templateName = '';
        this.description = '';
        this.templateType = '';
        this.tempPlaceholder = {};
        this.showSettingsModal = false;
        this.quillInstances.richTextEditor.setText('');
        await this.loadExistingTemplateData();
        this.setRichTextContentInQuill();
        this.repaginate();
    }
    async updateTemplate() {
        if (this.isLoading) {
            console.warn('[CREATE_TEMPLATE] Save already in progress; ignoring repeat update');
            return;
        }
        console.log('[CREATE_TEMPLATE] UPDATE START');
        console.log('[CREATE_TEMPLATE] Template ID:', this.templateData?.templateId);
        console.log('[CREATE_TEMPLATE] Template Status:', this.templateData?.status);
        if (!this.templateData?.templateId) {
            console.error('[CREATE_TEMPLATE] UPDATE ABORTED: No existing Template ID');
            return;
        }
        await this.saveTemplateWithStatus(this.templateData.status || 'Publish', this.templateData.templateId);
    }

    // repaginate() {
    //     const quill = this.quillInstances?.richTextEditor;
    //     if (!quill) return;

    //     const children = Array.from(quill.root.children);
    //     if (children.length === 0) {
    //         this.pages = [{ id: 'page-0', style: 'margin-bottom: 40px;' }];
    //         return;
    //     }

    //     // If the editor has children but they aren't laid out in the DOM yet,
    //     // retry repagination after a short delay.
    //     if (children.length > 0 && children[0].offsetHeight === 0) {
    //         setTimeout(() => {
    //             this.repaginate();
    //         }, 50);
    //         return;
    //     }

    //     // Constants for A4 dimensions (at 96 DPI)
    //     const PAGE_HEIGHT = 1120; // 1120px is close to 297mm
    //     const PAGE_GAP = 40;      // 40px page gap
    //     const MARGIN_TOP = 40;    // top padding margin
    //     const MARGIN_BOTTOM = 40; // bottom padding margin
    //     const PAGE_LIMIT = PAGE_HEIGHT - MARGIN_BOTTOM;

    //     let currentPage = 1;
    //     let currentLocalY = MARGIN_TOP;

    //     // 1. Reset all previously applied inline margins and min-heights
    //     children.forEach((child) => {
    //         child.style.marginTop = '';
    //         child.style.minHeight = '';
    //     });

    //     // 2. Compute dynamic layout heights and apply page break margins
    //     children.forEach((child) => {
    //         const height = child.offsetHeight;
    //         const isManualPageBreak = child.classList.contains('quill-page-break') || child.getAttribute('data-type') === 'PageBreak';

    //         if (isManualPageBreak) {
    //             // Force push to the next page
    //             const marginTop = (PAGE_HEIGHT - currentLocalY) + PAGE_GAP + MARGIN_TOP;
    //             child.style.marginTop = `${marginTop}px`;
    //             currentPage++;
    //             currentLocalY = MARGIN_TOP + height;
    //             return;
    //         }

    //         if (currentLocalY + height > PAGE_LIMIT && currentLocalY > MARGIN_TOP) {
    //             // Push this element to the next page
    //             const marginTop = (PAGE_HEIGHT - currentLocalY) + PAGE_GAP + MARGIN_TOP;
    //             child.style.marginTop = `${marginTop}px`;
    //             currentPage++;
    //             currentLocalY = MARGIN_TOP + height;
    //         } else {
    //             currentLocalY += height;
    //         }
    //     });

    //     // 3. Align background shadow count
    //     const pagesArray = [];
    //     for (let i = 0; i < currentPage; i++) {
    //         pagesArray.push({
    //             id: `page-${i}`,
    //             style: `margin-bottom: ${PAGE_GAP}px;`
    //         });
    //     }
    //     this.pages = pagesArray;

    //     // 4. Update the editor's min-height to match the page grid exactly
    //     const totalHeight = currentPage * PAGE_HEIGHT + (currentPage - 1) * PAGE_GAP;
    //     quill.root.style.minHeight = `${totalHeight}px`;

    //     // 5. Update the page shadows container's top position based on the sticky toolbar's dynamic height
    //     setTimeout(() => {
    //         try {
    //             const toolbar = this.template.querySelector('.ql-toolbar');
    //             const shadowContainer = this.template.querySelector('.page-shadows-container');
    //             if (toolbar && shadowContainer) {
    //                 const toolbarHeight = toolbar.offsetHeight;
    //                 shadowContainer.style.top = `${toolbarHeight + 20}px`; // 0px margin-top + 20px margin-bottom
    //             }
    //         } catch (e) {
    //             console.warn('[CREATE_TEMPLATE] Error setting page shadow container top:', e);
    //         }
    //     }, 0);
    // }
    getPageContentHeight() {
        return 1120 - 40 - 40;
    }

    findSplitIndexForOverflow(quill, node, maxHeight) {
        const blot = window.Quill.find(node);
        if (!blot) return null;

        const startIndex = quill.getIndex(blot);
        const range = document.createRange();
        range.selectNodeContents(node);

        const rects = Array.from(range.getClientRects());
        if (rects.length < 2) return null;

        const nodeTop = node.getBoundingClientRect().top;
        const targetRect = rects.find(rect => rect.top - nodeTop > maxHeight);

        if (!targetRect) return null;

        const caret = document.caretRangeFromPoint
            ? document.caretRangeFromPoint(targetRect.left + 1, targetRect.top + 1)
            : null;

        if (!caret) return null;

        const preRange = document.createRange();
        preRange.selectNodeContents(node);
        preRange.setEnd(caret.startContainer, caret.startOffset);

        const localOffset = preRange.toString().length;

        if (localOffset <= 0) return null;

        return startIndex + localOffset;
    }

    splitOversizedBlocks(quill) {
        const maxHeight = this.getPageContentHeight();
        let guard = 0;

        while (guard++ < 200) {
            const children = Array.from(quill.root.children);
            let splitDone = false;

            for (const child of children) {
                const isManualPageBreak =
                    child.classList.contains('quill-page-break') ||
                    child.getAttribute('data-type') === 'PageBreak';

                if (isManualPageBreak || child.offsetHeight <= maxHeight) continue;

                const splitIndex = this.findSplitIndexForOverflow(quill, child, maxHeight);

                if (splitIndex == null) {
                    console.warn('[PAGINATION] Unable to split oversized block:', child);
                    continue;
                }

                console.log('[PAGINATION] Splitting oversized block:', {
                    height: child.offsetHeight,
                    maxHeight,
                    splitIndex
                });

                quill.insertText(splitIndex, '\n', window.Quill.sources.SILENT);
                splitDone = true;
                break;
            }

            if (!splitDone) break;
        }
    }

    repaginate() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('[PAGINATION] ❌ Quill not available');
            return;
        }
        this.splitOversizedBlocks(quill);
        const children = Array.from(quill.root.children);

        // Per-child diagnostics force a synchronous layout (getBoundingClientRect
        // + getComputedStyle) and a serialised console write for every element,
        // on every repaginate - including every keystroke. Off by default; flip
        // PAGINATION_DEBUG to true when the pagination maths needs inspecting.
        if (PAGINATION_DEBUG) {
            console.log('========== [PAGINATION DEBUG START] ==========');
            console.log('[PAGINATION] Total root children:', children.length);
            console.log('[PAGINATION] Root scrollHeight:', quill.root.scrollHeight);
            console.log('[PAGINATION] Root clientHeight:', quill.root.clientHeight);
        }

        const PAGE_HEIGHT = 1120;
        const PAGE_GAP = 40;
        const MARGIN_TOP = 40;
        const MARGIN_BOTTOM = 40;
        const PAGE_LIMIT = PAGE_HEIGHT - MARGIN_BOTTOM;

        if (PAGINATION_DEBUG) {
            console.log('[PAGINATION] PAGE_HEIGHT:', PAGE_HEIGHT);
            console.log('[PAGINATION] PAGE_LIMIT:', PAGE_LIMIT);
            console.log('[PAGINATION] MARGIN_TOP:', MARGIN_TOP);
            console.log('[PAGINATION] MARGIN_BOTTOM:', MARGIN_BOTTOM);

            children.forEach((child, index) => {
                const rect = child.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(child);
                const text = child.innerText || '';

                console.log(`[PAGINATION] CHILD ${index + 1}`, {
                    tag: child.tagName,
                    className: child.className,
                    textLength: text.length,
                    textPreview: text.substring(0, 100),
                    offsetHeight: child.offsetHeight,
                    scrollHeight: child.scrollHeight,
                    clientHeight: child.clientHeight,
                    top: rect.top,
                    bottom: rect.bottom,
                    height: rect.height,
                    marginTop: computedStyle.marginTop,
                    marginBottom: computedStyle.marginBottom,
                    childCount: child.children.length
                });
            });

            console.log('========== [PAGINATION DEBUG END] ==========');
        }

        // TEMPORARILY keep existing pagination behavior
        if (children.length === 0) {
            this.pages = [{ id: 'page-0', style: 'margin-bottom: 40px;' }];
            return;
        }

        if (children.length > 0 && children[0].offsetHeight === 0) {
            console.log('[PAGINATION] DOM not laid out yet. Retrying...');
            setTimeout(() => this.repaginate(), 50);
            return;
        }

        let currentPage = 1;
        let currentLocalY = MARGIN_TOP;

        children.forEach(child => {
            child.style.marginTop = '';
            child.style.minHeight = '';
        });

        children.forEach((child, index) => {
            const height = child.offsetHeight;
            const isManualPageBreak = child.classList.contains('quill-page-break') || child.getAttribute('data-type') === 'PageBreak';

            console.log(`[PAGINATION] PROCESS CHILD ${index + 1}:`, {
                height,
                currentPage,
                currentLocalY,
                pageLimit: PAGE_LIMIT,
                willOverflow: currentLocalY + height > PAGE_LIMIT,
                isManualPageBreak
            });

            if (isManualPageBreak) {
                const marginTop = (PAGE_HEIGHT - currentLocalY) + PAGE_GAP + MARGIN_TOP;

                console.log(`[PAGINATION] MANUAL PAGE BREAK → Page ${currentPage} → Page ${currentPage + 1}`, {
                    marginTop
                });

                child.style.marginTop = `${marginTop}px`;
                currentPage++;
                currentLocalY = MARGIN_TOP + height;
                return;
            }

            if (currentLocalY + height > PAGE_LIMIT && currentLocalY > MARGIN_TOP) {
                const marginTop = (PAGE_HEIGHT - currentLocalY) + PAGE_GAP + MARGIN_TOP;

                console.log(`[PAGINATION] OVERFLOW → Moving CHILD ${index + 1} to Page ${currentPage + 1}`, {
                    currentPage,
                    currentLocalY,
                    height,
                    pageLimit: PAGE_LIMIT,
                    marginTop
                });

                child.style.marginTop = `${marginTop}px`;
                currentPage++;
                currentLocalY = MARGIN_TOP + height;
            } else {
                currentLocalY += height;

                console.log(`[PAGINATION] FITS → Child ${index + 1} remains on Page ${currentPage}`, {
                    currentLocalY
                });
            }
        });

        const pagesArray = [];

        for (let i = 0; i < currentPage; i++) {
            pagesArray.push({
                id: `page-${i}`,
                style: `margin-bottom: ${PAGE_GAP}px;`
            });
        }

        this.pages = pagesArray;

        const totalHeight = currentPage * PAGE_HEIGHT + (currentPage - 1) * PAGE_GAP;
        quill.root.style.minHeight = `${totalHeight}px`;

        console.log('[PAGINATION] FINAL PAGE COUNT:', currentPage);
        console.log('[PAGINATION] FINAL ROOT MIN HEIGHT:', totalHeight);
        console.log('========== [PAGINATION COMPLETE] ==========');
    }


    cleanHtmlForSave(html) {
        if (!html) return '';
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const body = doc.body;

            // Iterate over all children and strip our dynamic inline styles
            Array.from(body.children).forEach((child) => {
                if (child.style.marginTop) {
                    child.style.marginTop = '';
                }
                if (child.style.minHeight) {
                    child.style.minHeight = '';
                }
                if (child.getAttribute('style') === '') {
                    child.removeAttribute('style');
                }
            });

            return body.innerHTML;
        } catch (e) {
            console.error('[CREATE_TEMPLATE] Error cleaning HTML for save:', e);
            return html;
        }
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
}