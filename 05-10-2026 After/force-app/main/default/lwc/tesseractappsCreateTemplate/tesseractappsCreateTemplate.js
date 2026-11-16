import { LightningElement, track, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import QUILL from '@salesforce/resourceUrl/Quill';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import saveTemplateData from '@salesforce/apex/myTemplates.saveTemplateData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const PAGINATION_DEBUG = false;
const PAGE_HEIGHT = 1120;
const PAGE_GAP = 40;
const PAGE_MARGIN_TOP = 40;
const PAGE_MARGIN_BOTTOM = 40;
const DEFAULT_HEADER_HEIGHT = 110;
const DEFAULT_FOOTER_HEIGHT = 60;
const MAX_HEADER_HEIGHT = 400;
const MAX_FOOTER_HEIGHT = 300;
const MAX_LOGO_BYTES = 1024 * 1024;
const LOGO_HEIGHT_ALLOWANCE = 4;
const BAND_CONTENT_WIDTH = 650;
const DOC_CONTENT_WIDTH = 650;
const DOC_IMAGE_SAFETY_PX = 12;
const HF_FONT_SIZES = ['10px', '12px', false, '16px', '18px', '20px', '24px', '28px', '32px'];
const HF_DEFAULT_FONT_SIZE = '14px';
const DEMOGRAPHIC_FIELDS = [
    { type: 'FullName', label: 'Full Name' },
    { type: 'FirstName', label: 'First Name' },
    { type: 'LastName', label: 'Last Name' },
    { type: 'Email', label: 'Email' },
    { type: 'ContactNumber', label: 'Contact Number' },
    { type: 'Address', label: 'Address' },
    { type: 'Date', label: 'Date' },
    { type: 'Time', label: 'Time' },
    { type: 'DateOfSigning', label: 'Date of Signing' },
    { type: 'Initials', label: 'Initials' },
    { type: 'ABN', label: 'ABN' },
    { type: 'TFN', label: 'TFN' },
    { type: 'Signature', label: 'Signature' }
];
const DEMOGRAPHIC_FIELD_TYPES = DEMOGRAPHIC_FIELDS.map(field => field.type);
function createDefaultHeaderFooterConfig() {
    return {
        version: 1,
        enabled: false,
        mode: 'SAME_ALL',
        hasHeader: true,
        hasFooter: true,
        headerHeight: DEFAULT_HEADER_HEIGHT,
        footerHeight: DEFAULT_FOOTER_HEIGHT,
        common: { header: '', footer: '' },
        pages: []
    };
}
function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}
const HF_VERTICAL_VALUES = ['top', 'middle', 'bottom'];
const HF_HORIZONTAL_VALUES = ['left', 'center', 'right'];
const HF_POSITION_OPTIONS = [
    { id: 'top-left', label: 'Top Left', vertical: 'top', horizontal: 'left' },
    { id: 'top-center', label: 'Top Center', vertical: 'top', horizontal: 'center' },
    { id: 'top-right', label: 'Top Right', vertical: 'top', horizontal: 'right' },
    { id: 'middle-left', label: 'Middle Left', vertical: 'middle', horizontal: 'left' },
    { id: 'middle-center', label: 'Center', vertical: 'middle', horizontal: 'center' },
    { id: 'middle-right', label: 'Middle Right', vertical: 'middle', horizontal: 'right' },
    { id: 'bottom-left', label: 'Bottom Left', vertical: 'bottom', horizontal: 'left' },
    { id: 'bottom-center', label: 'Bottom Center', vertical: 'bottom', horizontal: 'center' },
    { id: 'bottom-right', label: 'Bottom Right', vertical: 'bottom', horizontal: 'right' }
];
const HF_BLOCK_INLINE_STYLE = {
    top: 'position:relative;margin-top:0;margin-bottom:0;',
    middle: 'position:relative;margin-top:auto;margin-bottom:auto;',
    bottom: 'position:relative;margin-top:auto;margin-bottom:0;'
};
const HF_POS_INLINE_STYLE = {
    left: 'position:absolute;left:0;top:50%;transform:translateY(-50%);text-align:left;max-width:100%;',
    center: 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;max-width:100%;',
    right: 'position:absolute;right:0;top:50%;transform:translateY(-50%);text-align:right;max-width:100%;'
};
const HF_POSITION_PROPERTIES = [
    'position', 'left', 'right', 'top', 'bottom',
    'transform', 'margin-top', 'margin-bottom', 'text-align', 'max-width'
];
const HF_BAND_ROOT_CLASS = 'hf-band-root';
const HF_BAND_ROOT_STYLE = 'display:flex;flex-direction:column;position:relative;height:100%;width:100%;box-sizing:border-box;';
const HF_BAND_BACKGROUND_ATTR = 'data-hf-background';
const HF_BAND_PADDING_X = 20;
const HF_BAND_PRINT_STYLE = '-webkit-print-color-adjust:exact;print-color-adjust:exact;';
const HF_DESIGN_PREVIEW_SCALE = 0.5;
const HF_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60">' +
    '<rect x="1" y="1" width="158" height="58" rx="6" fill="#eef2f7" stroke="#c7d2e0" stroke-width="2" stroke-dasharray="6 4"/>' +
    '<text x="80" y="37" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle">LOGO</text>' +
    '</svg>';
const HF_LOGO_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(HF_LOGO_SVG)}`;
let hfPlaceholderSequence = 0;
function hfLogo(width = 120) {
    const height = Math.max(1, Math.round(width * 0.375));
    return `<img src="${HF_LOGO_DATA_URI}" width="${width}" height="${height}">`;
}
function hfSpan(text, fontSize, color, bold) {
    const inner = bold ? `<strong>${text}</strong>` : text;
    return `<span style="font-size:${fontSize};color:${color};">${inner}</span>`;
}
function hfPlaceholder(type, label, fontSize = '12', color = '#6b7280') {
    const id = `ph-${Date.now()}-${++hfPlaceholderSequence}`;
    const isDemographic = DEMOGRAPHIC_FIELD_TYPES.includes(type);
    return `<span class="quill-placeholder-embed" data-id="${id}" data-type="${type}" data-label="${label}"` +
        ` data-demographic-field="${isDemographic ? 'true' : 'false'}" data-demographic-source="${type}"` +
        ` data-demographic-value-mode="${isDemographic ? 'AUTO' : 'HR_MANUAL'}" data-recipient=""` +
        ` data-custom-style="true" data-font-family="Arial, Helvetica, sans-serif" data-font-size="${fontSize}"` +
        ` data-bold="false" data-italic="false" data-underline="false" data-color="${color}" contenteditable="false"` +
        ` style="display:inline-block;font-family:Arial, Helvetica, sans-serif;font-size:${fontSize}px;font-weight:400;` +
        `font-style:normal;text-decoration:none;color:${color};background:transparent;border:none;padding:0;margin:0;">` +
        `[ ${label} ]</span>`;
}
function hfBadge(text, fontSize, color, background) {
    return `<span style="font-size:${fontSize};color:${color};background-color:${background};">` +
        `<strong>&nbsp;&nbsp;${text}&nbsp;&nbsp;</strong></span>`;
}
function hfPageOf(fontSize, color, tokenColor) {
    const tokenSize = String(parseInt(fontSize, 10));
    return `${hfSpan('Page&nbsp;', fontSize, color)}${hfPlaceholder('PageNumber', 'Page Number', tokenSize, tokenColor)}` +
        `${hfSpan('&nbsp;of&nbsp;', fontSize, color)}${hfPlaceholder('TotalPages', 'Total Pages', tokenSize, tokenColor)}`;
}
const HEADER_BAND_TEMPLATES = [
    {
        id: 'logo-name',
        label: 'Company Logo + Name',
        build: () =>
            `<p class="ql-hfblock-middle">${hfLogo(120)}` +
            `<span class="ql-hfpos-center">${hfSpan('Company Name', '20px', '#1f2937', true)}</span></p>`
    },
    {
        id: 'logo-left-description',
        label: 'Logo Left + Description',
        build: () =>
            `<p class="ql-hfblock-middle">${hfLogo(120)}` +
            `<span class="ql-hfpos-right">${hfSpan('Your trusted partner in quality care', '12px', '#6b7280')}</span></p>`
    },
    {
        id: 'centered-logo-info',
        label: 'Centered Logo + Company Information',
        build: () =>
            `<p class="ql-hfblock-top ql-align-center">${hfLogo(104)}</p>` +
            `<p class="ql-hfblock-bottom ql-align-center">` +
            `${hfSpan('123 Example Street, Sydney NSW 2000&nbsp; |&nbsp; 1300 000 000&nbsp; |&nbsp; hello@company.com', '12px', '#6b7280')}</p>`
    },
    {
        id: 'logo-name-description',
        label: 'Logo + Company Name + Description',
        build: () =>
            `<p class="ql-hfblock-top">${hfLogo(112)}` +
            `<span class="ql-hfpos-center">${hfSpan('Company Name', '18px', '#1f2937', true)}</span></p>` +
            `<p class="ql-hfblock-bottom ql-align-center">${hfSpan('Short company description or tagline', '12px', '#6b7280')}</p>`
    },
    {
        id: 'left-center-right',
        label: 'Left / Center / Right Header',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Company Name', '12px', '#6b7280')}` +
            `<span class="ql-hfpos-center">${hfSpan('Document Title', '16px', '#1f2937', true)}</span>` +
            `<span class="ql-hfpos-right">${hfPlaceholder('Date', 'Date')}</span></p>`
    },
    {
        id: 'navy-logo-title',
        label: 'Navy - Logo + Company Name',
        background: '#0f2a4a',
        build: () =>
            `<p class="ql-hfblock-middle">${hfLogo(120)}` +
            `<span class="ql-hfpos-right">${hfSpan('Company Name', '24px', '#ffffff', true)}</span></p>`
    },
    {
        id: 'royal-title-subtitle',
        label: 'Royal Blue - Title + Subtitle',
        background: '#1e40af',
        build: () =>
            `<p class="ql-hfblock-middle ql-align-center">${hfSpan('COMPANY NAME', '24px', '#ffffff', true)}</p>` +
            `<p class="ql-hfblock-middle ql-align-center">${hfSpan('Department or tagline goes here', '12px', '#bfdbfe')}</p>`
    },
    {
        id: 'teal-name-date',
        label: 'Teal - Heading, Subheading + Date',
        background: '#0f766e',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Company Name', '20px', '#ffffff', true)}` +
            `<span class="ql-hfpos-right">${hfSpan('Date:&nbsp;', '12px', '#ccfbf1')}${hfPlaceholder('Date', 'Date', '12', '#ffffff')}</span></p>` +
            `<p class="ql-hfblock-middle">${hfSpan('Your trusted partner in quality care', '12px', '#99f6e4')}</p>`
    },
    {
        id: 'charcoal-three-part',
        label: 'Charcoal - Logo / Name / Contact',
        background: '#1f2937',
        build: () =>
            `<p class="ql-hfblock-middle">${hfLogo(104)}` +
            `<span class="ql-hfpos-center">${hfSpan('Company Name', '18px', '#ffffff', true)}</span>` +
            `<span class="ql-hfpos-right">${hfSpan('1300 000 000', '12px', '#d1d5db')}</span></p>`
    },
    {
        id: 'slate-badge',
        label: 'Light Slate - Name + Document Badge',
        background: '#f1f5f9',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Company Name', '18px', '#0f172a', true)}` +
            `<span class="ql-hfpos-right">${hfBadge('DOCUMENT TITLE', '12px', '#ffffff', '#2563eb')}</span></p>` +
            `<p class="ql-hfblock-middle">${hfSpan('Short company description or tagline', '12px', '#475569')}</p>`
    },
    {
        id: 'maroon-centered-logo',
        label: 'Maroon - Centered Logo + Name',
        background: '#7f1d1d',
        build: () =>
            `<p class="ql-hfblock-middle ql-align-center">${hfLogo(96)}</p>` +
            `<p class="ql-hfblock-middle ql-align-center">${hfSpan('Company Name', '16px', '#ffffff', true)}</p>`
    },
    {
        id: 'forest-name-logo-right',
        label: 'Forest Green - Name + Logo Right',
        background: '#14532d',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Company Name', '20px', '#ffffff', true)}` +
            `<span class="ql-hfpos-right">${hfLogo(96)}</span></p>` +
            `<p class="ql-hfblock-middle">${hfSpan('<em>Caring for our community</em>', '12px', '#bbf7d0')}</p>`
    },
    {
        id: 'amber-banner',
        label: 'Amber - Bold Centered Title',
        background: '#f59e0b',
        build: () =>
            `<p class="ql-hfblock-middle ql-align-center">${hfSpan('COMPANY NAME', '28px', '#1f2937', true)}</p>`
    },
    {
        id: 'indigo-logo-contact',
        label: 'Indigo - Logo + Name + Contact',
        background: '#312e81',
        build: () =>
            `<p class="ql-hfblock-middle">${hfLogo(96)}` +
            `<span class="ql-hfpos-right">${hfSpan('Company Name', '18px', '#ffffff', true)}</span></p>` +
            `<p class="ql-hfblock-middle ql-align-right">` +
            `${hfSpan('1300 000 000&nbsp; |&nbsp; hello@company.com', '10px', '#c7d2fe')}</p>`
    }
];
const FOOTER_BAND_TEMPLATES = [
    {
        id: 'contact-information',
        label: 'Contact Information Footer',
        build: () =>
            `<p class="ql-hfblock-middle ql-align-center">` +
            `${hfSpan('Phone: 1300 000 000&nbsp; |&nbsp; Email: hello@company.com&nbsp; |&nbsp; Web: www.company.com', '12px', '#6b7280')}</p>`
    },
    {
        id: 'company-information',
        label: 'Company Information Footer',
        build: () =>
            `<p class="ql-hfblock-top ql-align-center">${hfSpan('Company Name Pty Ltd', '12px', '#374151', true)}</p>` +
            `<p class="ql-hfblock-bottom ql-align-center">` +
            `${hfSpan('ABN 00 000 000 000&nbsp; |&nbsp; This document is confidential.', '10px', '#9ca3af')}</p>`
    },
    {
        id: 'left-center-right',
        label: 'Left / Center / Right Footer',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Company Name', '10px', '#6b7280')}` +
            `<span class="ql-hfpos-center">${hfSpan('Confidential', '10px', '#6b7280')}</span>` +
            `<span class="ql-hfpos-right">${hfSpan('Page&nbsp;', '10px', '#6b7280')}` +
            `${hfPlaceholder('PageNumber', 'Page Number', '10')}${hfSpan('&nbsp;of&nbsp;', '10px', '#6b7280')}` +
            `${hfPlaceholder('TotalPages', 'Total Pages', '10')}</span></p>`
    },
    {
        id: 'address-phone-email',
        label: 'Address + Phone + Email Footer',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('123 Example Street, Sydney NSW 2000', '10px', '#6b7280')}` +
            `<span class="ql-hfpos-center">${hfSpan('1300 000 000', '10px', '#6b7280')}</span>` +
            `<span class="ql-hfpos-right">${hfSpan('hello@company.com', '10px', '#6b7280')}</span></p>`
    },
    {
        id: 'page-information',
        label: 'Page Information Footer',
        build: () =>
            `<p class="ql-hfblock-bottom ql-align-center">${hfSpan('Page&nbsp;', '10px', '#6b7280')}` +
            `${hfPlaceholder('PageNumber', 'Page Number', '10')}${hfSpan('&nbsp;of&nbsp;', '10px', '#6b7280')}` +
            `${hfPlaceholder('TotalPages', 'Total Pages', '10')}</p>`
    },
    {
        id: 'navy-name-page',
        label: 'Navy - Company + Page Number',
        background: '#0f2a4a',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Company Name', '12px', '#ffffff', true)}` +
            `<span class="ql-hfpos-right">${hfPageOf('10px', '#cbd5e1', '#ffffff')}</span></p>`
    },
    {
        id: 'royal-contact',
        label: 'Royal Blue - Contact Strip',
        background: '#1e40af',
        build: () =>
            `<p class="ql-hfblock-middle ql-align-center">` +
            `${hfSpan('Phone: 1300 000 000&nbsp; |&nbsp; Email: hello@company.com&nbsp; |&nbsp; Web: www.company.com', '12px', '#ffffff')}</p>`
    },
    {
        id: 'charcoal-three-part',
        label: 'Charcoal - Left / Center / Right',
        background: '#1f2937',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('&copy; Company Name', '10px', '#d1d5db')}` +
            `<span class="ql-hfpos-center">${hfSpan('CONFIDENTIAL', '10px', '#ffffff', true)}</span>` +
            `<span class="ql-hfpos-right">${hfPageOf('10px', '#d1d5db', '#ffffff')}</span></p>`
    },
    {
        id: 'teal-two-line',
        label: 'Teal - Company Details (Two Lines)',
        background: '#0f766e',
        build: () =>
            `<p class="ql-hfblock-middle ql-align-center">${hfSpan('Company Name Pty Ltd', '12px', '#ffffff', true)}</p>` +
            `<p class="ql-hfblock-middle ql-align-center">` +
            `${hfSpan('ABN 00 000 000 000&nbsp; |&nbsp; www.company.com', '10px', '#ccfbf1')}</p>`
    },
    {
        id: 'slate-logo-page',
        label: 'Light Slate - Logo + Website + Page',
        background: '#f1f5f9',
        build: () =>
            `<p class="ql-hfblock-middle">${hfLogo(72)}` +
            `<span class="ql-hfpos-center">${hfSpan('www.company.com', '10px', '#475569')}</span>` +
            `<span class="ql-hfpos-right">${hfPageOf('10px', '#475569', '#0f172a')}</span></p>`
    },
    {
        id: 'maroon-confidential',
        label: 'Maroon - Confidentiality Notice',
        background: '#7f1d1d',
        build: () =>
            `<p class="ql-hfblock-middle ql-align-center">${hfSpan('CONFIDENTIAL', '12px', '#ffffff', true)}` +
            `${hfSpan('&nbsp; -&nbsp; This document is intended only for the named recipient.', '10px', '#fecaca')}</p>`
    },
    {
        id: 'forest-address-contact',
        label: 'Forest Green - Address + Contact',
        background: '#14532d',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('123 Example Street, Sydney NSW 2000', '10px', '#dcfce7')}` +
            `<span class="ql-hfpos-right">${hfSpan('1300 000 000&nbsp; |&nbsp; hello@company.com', '10px', '#dcfce7')}</span></p>`
    },
    {
        id: 'amber-name-page',
        label: 'Amber - Company + Page Number',
        background: '#f59e0b',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Company Name', '12px', '#1f2937', true)}` +
            `<span class="ql-hfpos-right">${hfPageOf('10px', '#1f2937', '#1f2937')}</span></p>`
    },
    {
        id: 'indigo-date-page',
        label: 'Indigo - Issue Date + Page Number',
        background: '#312e81',
        build: () =>
            `<p class="ql-hfblock-middle">${hfSpan('Issued:&nbsp;', '10px', '#c7d2fe')}` +
            `${hfPlaceholder('Date', 'Date', '10', '#ffffff')}` +
            `<span class="ql-hfpos-right">${hfPageOf('10px', '#c7d2fe', '#ffffff')}</span></p>`
    }
];
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
    @track showTableModal = false;
    @track tableRows = 3;
    @track tableColumns = 3;
    @track showTableRowPlus = false;
    @track tableRowPlusStyle = '';
    tableRowTarget = null;
    @track showTableColumnPlus = false;
    @track tableColumnPlusStyle = '';
    tableColumnTarget = null;
    @track isLoading = false;
    @track showTableColumnSelector = false;
    @track tableColumnSelectorStyle = '';
    tableSelectedColumn = null;
    tableColumnSelectorTarget = null;
    @track loadingMessage = 'Setting Up Things, Please Wait...';
    selectedTableColumnIndex = null;
    selectedTableElement = null;
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    @track headerFooterConfig = createDefaultHeaderFooterConfig();
    @track showHeaderFooterModal = false;
    @track headerFooterEditorRegion = 'header';
    @track headerFooterEditorTitle = '';
    @track selectedHeaderFooterPage = '0';
    @track showHfLogoControls = false;
    @track showHfLogoTip = false;
    @track hfLogoWidth = 160;
    @track hfPlaceholderType = '';
    @track hfContentOverflow = false;
    @track showHfDesignGallery = false;
    @track hfBandBackground = '';
    _hfDesignPreviewsPending = false;
    _pendingBandTemplate = null;
    _hfSavedRange = null;
    headerFooterEditorPageIndex = null;
    _hfRevision = 0;
    _chromeSignature = '';
    _chromeListenerBound = false;
    _pendingHfEditorInit = false;
    _hfInitialHtml = '';
    _hfSelectedImage = null;
    _lastPageCount = 0;
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
        if (!this.quillLoaded) {
            this.quillLoaded = true;
            this.initializeEditor();
            return;
        }
        this.initHeaderFooterEditorIfNeeded();
        this.renderHfDesignPreviewsIfNeeded();
    }
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
        const geometry = this.getPageGeometry();
        const { CONTENT_TOP, PAGE_LIMIT } = geometry;
        previewContainer.innerHTML = '';
        let page = this.createPreviewPage();
        let contentY = CONTENT_TOP;
        children.forEach(child => {
            const isManualPageBreak = child.classList.contains('quill-page-break') || child.getAttribute('data-type') === 'PageBreak';
            if (isManualPageBreak) {
                if (page.querySelector('.preview-content').children.length) {
                    previewContainer.appendChild(page);
                }
                page = this.createPreviewPage();
                contentY = CONTENT_TOP;
                return;
            }
            if (child.tagName === 'TABLE') {
                const result = this.appendPreviewTable(child, page, contentY, {
                    previewContainer,
                    PAGE_LIMIT,
                    CONTENT_TOP
                });
                page = result.page;
                contentY = result.contentY;
                return;
            }
            const height = child.offsetHeight;
            const clone = child.cloneNode(true);
            clone.style.marginTop = '';
            clone.style.minHeight = '';
            if (contentY + height > PAGE_LIMIT && contentY > CONTENT_TOP) {
                previewContainer.appendChild(page);
                page = this.createPreviewPage();
                contentY = CONTENT_TOP;
            }
            page.querySelector('.preview-content').appendChild(clone);
            contentY += height;
        });
        if (page.querySelector('.preview-content').children.length) {
            previewContainer.appendChild(page);
        }
        this.decoratePreviewPagesWithChrome(previewContainer, geometry);
        console.log('[CREATE_TEMPLATE] Preview pages rendered:', previewContainer.children.length);
    }
    decoratePreviewPagesWithChrome(previewContainer, geometry) {
        if (!this.headerFooterEnabled) return;
        const pages = Array.from(previewContainer.children);
        const total = pages.length;
        pages.forEach((pageEl, index) => {
            if (geometry.headerHeight > 0) {
                pageEl.appendChild(this.buildChromeRegion('header', index, total, geometry, true));
            }
            if (geometry.footerHeight > 0) {
                pageEl.appendChild(this.buildChromeRegion('footer', index, total, geometry, true));
            }
        });
        console.log('[HEADER_FOOTER] Preview chrome applied to', total, 'page(s)');
    }
    createPreviewTableChunk(table) {
        const chunk = table.cloneNode(false);
        chunk.style.marginTop = '';
        chunk.style.minHeight = '';
        chunk.style.marginBottom = '';
        chunk.appendChild(document.createElement('tbody'));
        return chunk;
    }
    clonePreviewRow(row) {
        const clone = row.cloneNode(true);
        clone.style.transform = '';
        clone.classList.remove('table-page-start');
        if (!clone.getAttribute('style')) {
            clone.removeAttribute('style');
        }
        return clone;
    }
    appendPreviewTable(table, startPage, startContentY, context) {
        const { previewContainer, PAGE_LIMIT, CONTENT_TOP } = context;
        const rows = Array.from(table.querySelectorAll('tr'));
        if (!rows.length) {
            startPage.querySelector('.preview-content').appendChild(this.createPreviewTableChunk(table));
            return { page: startPage, contentY: startContentY + table.offsetHeight };
        }
        const heights = rows.map(row => row.getBoundingClientRect().height);
        let page = startPage;
        let contentY = startContentY;
        let chunk = this.createPreviewTableChunk(table);
        let chunkRows = 0;
        const flushChunk = () => {
            if (chunkRows) {
                page.querySelector('.preview-content').appendChild(chunk);
            }
            chunk = this.createPreviewTableChunk(table);
            chunkRows = 0;
        };
        rows.forEach((row, index) => {
            const height = heights[index];
            if (contentY + height > PAGE_LIMIT && contentY > CONTENT_TOP) {
                flushChunk();
                previewContainer.appendChild(page);
                page = this.createPreviewPage();
                contentY = CONTENT_TOP;
            }
            chunk.querySelector('tbody').appendChild(this.clonePreviewRow(row));
            chunkRows++;
            contentY += height;
        });
        flushChunk();
        return { page, contentY };
    }
    createPreviewPage() {
        const page = document.createElement('div');
        page.className = 'preview-page';
        page.style.position = 'relative';
        const content = document.createElement('div');
        content.className = 'preview-content ql-editor';
        const geometry = this.getPageGeometry();
        content.style.paddingTop = `${geometry.CONTENT_TOP}px`;
        content.style.paddingBottom = `${geometry.MARGIN_BOTTOM + geometry.footerHeight}px`;
        page.appendChild(content);
        return page;
    }
    closePreview() {
        console.log('[CREATE_TEMPLATE] Closing document preview');
        this.showPreviewModal = false;
        this.previewContentHtml = '';
    }
    async initializeEditor() {
        this.loadingMessage = 'Loading Template, Please Wait...';
        this.isLoading = true;
        try {
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
        this.registerHeaderFooterSizeFormat();
        this.registerHeaderFooterPositionFormats();
        try {
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
            const PageBreakBlot = class extends BlockEmbed {
                static create() {
                    const node = super.create();
                    node.setAttribute('data-type', 'PageBreak');
                    node.setAttribute('data-page-break', 'true');
                    node.classList.add('quill-page-break');
                    node.innerText = '<---------------- PAGE BREAK ---------------->';
                    node.contentEditable = 'false';
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
    registerHeaderFooterSizeFormat() {
        if (!window.Quill) return;
        if (window.Quill.imports?.['formats/hfsize']) return;
        try {
            const Parchment = window.Quill.import('parchment');
            const StyleAttributor = Parchment.StyleAttributor || Parchment.Attributor?.Style;
            if (!StyleAttributor) {
                console.warn('[HEADER_FOOTER] Parchment style attributor unavailable; font size dropdown disabled');
                return;
            }
            const HeaderFooterSize = new StyleAttributor('hfsize', 'font-size', {
                scope: Parchment.Scope.INLINE,
                whitelist: HF_FONT_SIZES.filter(Boolean)
            });
            window.Quill.register(HeaderFooterSize, true);
            console.log('[HEADER_FOOTER] Registered hfsize font-size format');
        } catch (error) {
            console.error('[HEADER_FOOTER] Failed to register hfsize format:', error);
        }
    }
    registerHeaderFooterPositionFormats() {
        if (!window.Quill) return;
        try {
            const Parchment = window.Quill.import('parchment');
            const ClassAttributor = Parchment.ClassAttributor || Parchment.Attributor?.Class;
            if (!ClassAttributor) {
                console.warn('[HEADER_FOOTER] Parchment class attributor unavailable; positioning disabled');
                return;
            }
            if (!window.Quill.imports?.['formats/hfblock']) {
                const HeaderFooterBlockPosition = new ClassAttributor('hfblock', 'ql-hfblock', {
                    scope: Parchment.Scope.BLOCK,
                    whitelist: HF_VERTICAL_VALUES
                });
                window.Quill.register(HeaderFooterBlockPosition, true);
            }
            if (!window.Quill.imports?.['formats/hfpos']) {
                const HeaderFooterInlinePosition = new ClassAttributor('hfpos', 'ql-hfpos', {
                    scope: Parchment.Scope.INLINE,
                    whitelist: HF_HORIZONTAL_VALUES
                });
                window.Quill.register(HeaderFooterInlinePosition, true);
            }
            console.log('[HEADER_FOOTER] Registered hfblock / hfpos positioning formats');
        } catch (error) {
            console.error('[HEADER_FOOTER] Failed to register positioning formats:', error);
        }
    }
    injectEditorStyles() {
        if (this.template.querySelector('style.quill-custom-styles')) {
            return;
        }
        const style = document.createElement('style');
        style.classList.add('quill-custom-styles');
        style.textContent = `
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
                padding: 40px 75px !important;
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
            .table-column-selected {
                background-color: #eaf4ff !important;
                box-shadow: inset 0 0 0 2px #0176d3 !important;
            }
            .rich-text-editor .ql-editor table {
                border-collapse: separate !important;
                border-spacing: 0 !important;
            }
            .rich-text-editor .ql-editor td {
                border: 1px solid #000 !important;
                border-left-width: 0 !important;
                border-top-width: 0 !important;
            }
            .rich-text-editor .ql-editor tr:first-child td {
                border-top-width: 1px !important;
            }
            .rich-text-editor .ql-editor td:first-child {
                border-left-width: 1px !important;
            }
            .rich-text-editor .ql-editor tr.table-page-start td {
                border-top-width: 1px !important;
            }
            .preview-content table {
                border-collapse: collapse !important;
                table-layout: fixed !important;
                width: 100% !important;
            }
            .preview-content td {
                border: 1px solid #000 !important;
                padding: 2px 5px !important;
            }
            .rich-text-editor.ql-container > .ql-editor {
                padding-top: var(--doc-content-top, 40px) !important;
                padding-bottom: var(--doc-content-bottom, 40px) !important;
            }
            .doc-page-chrome {
                position: relative;
                width: 800px;
                box-sizing: border-box;
            }
            .doc-hf-region {
                position: absolute;
                left: 75px;
                right: 75px;
                overflow: hidden;
                box-sizing: border-box;
                pointer-events: auto;
                cursor: pointer;
                border: 1px dashed transparent;
                border-radius: 3px;
                transition: border-color 0.15s ease, background-color 0.15s ease;
            }
            .doc-hf-region:hover {
                border-color: #9ec5e8;
                background-color: rgba(12, 120, 186, 0.04);
            }
            .preview-page .doc-hf-region {
                pointer-events: none;
                cursor: default;
                border-color: transparent !important;
                background-color: transparent !important;
            }
            .doc-hf-content.ql-editor {
                height: 100% !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: transparent !important;
                font-size: 14px !important;
                color: #181818 !important;
            }
            .doc-hf-content img {
                max-width: 100% !important;
                max-height: var(--hf-band-height, 100px) !important;
                vertical-align: top !important;
            }
            .doc-hf-content .quill-placeholder-embed {
                cursor: inherit !important;
            }
            .doc-hf-empty {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #9aa5b1 !important;
                font-size: 12px !important;
                font-style: italic !important;
            }
            .hf-quill-editor.ql-container {
                border: 1px solid #d5dde8 !important;
                border-top: none !important;
                border-radius: 0 0 4px 4px !important;
                background: #ffffff !important;
                font-size: 14px !important;
                width: var(--hf-editor-width, 650px) !important;
                max-width: 100% !important;
                box-shadow: 0 10px 24px -12px rgba(15, 23, 42, 0.35) !important;
            }
            .hf-quill-editor .ql-editor {
                width: 100% !important;
                height: var(--hf-editor-height, 100px) !important;
                min-height: var(--hf-editor-height, 100px) !important;
                max-height: var(--hf-editor-height, 100px) !important;
                padding: 0 var(--hf-editor-pad-x, 0px) !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                font-size: 14px !important;
                background: var(--hf-editor-bg, #ffffff) !important;
            }
            .hf-quill-editor .ql-editor img {
                max-width: 100% !important;
                max-height: var(--hf-editor-height, 100px) !important;
                vertical-align: top !important;
                cursor: pointer !important;
            }
            .hf-editor-shell .ql-toolbar {
                border: 1px solid #d5dde8 !important;
                border-radius: 8px 8px 0 0 !important;
                background: #ffffff !important;
                padding: 6px 8px !important;
                width: var(--hf-editor-width, 650px) !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            .hf-editor-shell .ql-toolbar .ql-formats {
                margin-right: 10px !important;
                padding-right: 10px !important;
                border-right: 1px solid #eef2f6 !important;
            }
            .hf-editor-shell .ql-toolbar .ql-formats:last-child {
                border-right: none !important;
                margin-right: 0 !important;
                padding-right: 0 !important;
            }
            .hf-editor-shell .ql-toolbar button {
                border-radius: 4px !important;
            }
            .hf-editor-shell .ql-toolbar button:hover,
            .hf-editor-shell .ql-toolbar .ql-picker-label:hover {
                background: #eef6fc !important;
            }
            .hf-panel .slds-dropdown {
                left: 0 !important;
                right: auto !important;
                transform: none !important;
                width: 100% !important;
                min-width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            .hf-panel .slds-dropdown__list {
                max-height: 210px !important;
                overflow-y: auto !important;
            }
            .hf-panel .slds-listbox__option {
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
            }
            .hf-editor-shell .ql-picker.ql-hfsize {
                width: 76px !important;
            }
            .hf-editor-shell .ql-picker.ql-hfsize .ql-picker-label::before,
            .hf-editor-shell .ql-picker.ql-hfsize .ql-picker-item::before {
                content: '14px';
            }
            .hf-editor-shell .ql-picker.ql-hfsize .ql-picker-label[data-value]::before,
            .hf-editor-shell .ql-picker.ql-hfsize .ql-picker-item[data-value]::before {
                content: attr(data-value);
            }
            .hf-band-root {
                display: flex !important;
                flex-direction: column !important;
                position: relative !important;
                height: 100% !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .hf-quill-editor .ql-editor {
                display: flex !important;
                flex-direction: column !important;
                position: relative !important;
            }
            .hf-band-root > *,
            .hf-quill-editor .ql-editor > * {
                flex: 0 0 auto !important;
            }
            .ql-hfblock-top,
            .ql-hfblock-middle,
            .ql-hfblock-bottom {
                position: relative !important;
                min-height: 1.42em !important;
            }
            .ql-hfblock-top {
                margin-top: 0 !important;
                margin-bottom: 0 !important;
            }
            .ql-hfblock-middle {
                margin-top: auto !important;
                margin-bottom: auto !important;
            }
            .ql-hfblock-bottom {
                margin-top: auto !important;
                margin-bottom: 0 !important;
            }
            .ql-hfpos-left,
            .ql-hfpos-center,
            .ql-hfpos-right {
                position: absolute !important;
                top: 50% !important;
                display: inline-block !important;
                max-width: 100% !important;
            }
            .ql-hfpos-left {
                left: 0 !important;
                transform: translateY(-50%) !important;
                text-align: left !important;
            }
            .ql-hfpos-center {
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                text-align: center !important;
            }
            .ql-hfpos-right {
                right: 0 !important;
                transform: translateY(-50%) !important;
                text-align: right !important;
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
        if (this.quillInstances.richTextEditor) {
            return;
        }
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
            ['link', 'image', 'table'],
            ['clean']
        ];
        const quill = new window.Quill(editor, {
            theme: 'snow',
            modules: {
                table: true,
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        image: () => this.handleToolbarImage(),
                        table: () => this.openTableModal()
                    }
                }
            }
        });
        this.quillInstances.richTextEditor = quill;
        editor.addEventListener('keydown', (e) => this.handleTableKeyDown(e), true);
        let savedSelection = null;
        quill.on('selection-change', (range, oldRange, source) => {
            if (range) {
                savedSelection = range;
                this._lastKnownRange = range;
            }
        });
        const toolbar = quill.getModule('toolbar');
        if (toolbar?.container) {
            this.applyToolbarTooltips(toolbar.container);
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
        }
        if (this.richTextContent) {
            quill.root.innerHTML = this.richTextContent;
        }
        this.repaginate();
        quill.on('text-change', () => {
            this.richTextContent = quill.root.innerHTML;
            this.repaginate();
            console.log('📝 Descriptive Text updated');
        });
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
        quill.root.addEventListener('click', (e) => {
            const embedEl = e.target.closest('.quill-placeholder-embed');
            if (embedEl) {
                e.preventDefault();
                e.stopPropagation();
                const id = embedEl.getAttribute('data-id');
                const type = embedEl.getAttribute('data-type');
                const label = embedEl.getAttribute('data-label');
                const isDemographicField = embedEl.getAttribute('data-demographic-field') === 'true';
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
                this.constrainInsertedEditorImage(quill, insertAt);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
    constrainInsertedEditorImage(quill, insertAt) {
        requestAnimationFrame(() => {
            const [leaf] = quill.getLeaf(insertAt + 1);
            const node = leaf?.domNode;
            if (!node || node.tagName !== 'IMG') return;
            const apply = () => {
                if (!this.constrainEditorImage(node)) return;
                this.richTextContent = quill.root.innerHTML;
                this.repaginate();
            };
            if (node.complete && node.naturalWidth) {
                apply();
            } else {
                node.addEventListener('load', apply, { once: true });
            }
        });
    }
    constrainEditorImage(img) {
        if (!img) return false;
        const naturalWidth = img.naturalWidth || Number(img.getAttribute('width')) || 0;
        const naturalHeight = img.naturalHeight || Number(img.getAttribute('height')) || 0;
        if (!naturalWidth || !naturalHeight) return false;
        const overhead = this.getImageBlockOverhead(img);
        const maxHeight = Math.max(1, this.getPageContentHeight() - overhead - DOC_IMAGE_SAFETY_PX);
        const scale = Math.min(1, DOC_CONTENT_WIDTH / naturalWidth, maxHeight / naturalHeight);
        const width = Math.max(1, Math.floor(naturalWidth * scale));
        const height = Math.max(1, Math.round(naturalHeight * scale));
        if (Number(img.getAttribute('width')) === width && Number(img.getAttribute('height')) === height) {
            return false;
        }
        img.setAttribute('width', String(width));
        img.setAttribute('height', String(height));
        console.log('[CREATE_TEMPLATE] Image constrained to the page content area', {
            naturalWidth,
            naturalHeight,
            appliedWidth: width,
            appliedHeight: height,
            maxWidth: DOC_CONTENT_WIDTH,
            maxHeight,
            lineBoxOverhead: overhead
        });
        return true;
    }
    getImageBlockOverhead(img) {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) return 0;
        let block = img;
        while (block.parentElement && block.parentElement !== quill.root) {
            block = block.parentElement;
        }
        if (block === img) return 0;
        const imageHeight = Math.round(img.getBoundingClientRect().height);
        if (!imageHeight) return 0;
        return Math.max(0, Math.round(block.getBoundingClientRect().height) - imageHeight);
    }
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
            quill.insertEmbed(
                insertIndex,
                'page-break',
                {},
                'user'
            );
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
            this.tempPlaceholder = {};
            this.isNewPlaceholder = false;
            this.showSettingsModal = false;
            console.log('📄 Page Break inserted at:', insertIndex);
            return;
        }
        const isDemographicField = DEMOGRAPHIC_FIELD_TYPES.includes(type);
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
            case 'applyHeaderTemplate':
                this.confirmationTitle = 'Replace Header';
                this.confirmationMessage = 'Selecting a new template will replace the current Header content. Continue?';
                this.confirmButtonLabel = 'Replace Header';
                break;
            case 'applyFooterTemplate':
                this.confirmationTitle = 'Replace Footer';
                this.confirmationMessage = 'Selecting a new template will replace the current Footer content. Continue?';
                this.confirmButtonLabel = 'Replace Footer';
                break;
        }
        this.showConfirmationModal = true;
    }
    handleConfirmAction() {
        console.log('🔵 handleConfirmAction FIRED');
        console.log('🔵 pendingAction:', this.pendingAction);
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
            case 'applyHeaderTemplate':
            case 'applyFooterTemplate':
                this.applyPendingBandTemplate();
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
            version: 2,
            html: cleanedHtml,
            headerFooter: this.buildHeaderFooterJson()
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
        this.loadingMessage = 'Saving Template, Please Wait...';
        this.isLoading = true;
        try {
            const awsResult = await this.uploadRichTextToAws();
            console.log('[CREATE_TEMPLATE] AWS upload result:', awsResult);
            const placeholderJSON = JSON.stringify(this.buildPlaceholderJson());
            console.log('[CREATE_TEMPLATE] Final Placeholder JSON:', placeholderJSON);
            const result = await saveTemplateData({ templateId, fileName: awsResult.fileName, fileUrl: awsResult.fileUrl, placeholderJSON, orgId: this.orgid, key: awsResult.key, templateName: this.templateName.trim(), description: this.description || '', type: this.templateType, status });
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
        this._pendingBandTemplate = null;
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
            this.applyHeaderFooterConfig(data.headerFooter);
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
        this.applyHeaderFooterConfig(null);
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
    getPageGeometry() {
        const headerHeight = this.effectiveHeaderHeight;
        const footerHeight = this.effectiveFooterHeight;
        return {
            PAGE_HEIGHT,
            PAGE_GAP,
            MARGIN_TOP: PAGE_MARGIN_TOP,
            MARGIN_BOTTOM: PAGE_MARGIN_BOTTOM,
            headerHeight,
            footerHeight,
            CONTENT_TOP: PAGE_MARGIN_TOP + headerHeight,
            PAGE_LIMIT: PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - footerHeight
        };
    }
    getPageContentHeight() {
        const { CONTENT_TOP, PAGE_LIMIT } = this.getPageGeometry();
        return PAGE_LIMIT - CONTENT_TOP;
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
    getTableRowsThatFit(table, availableHeight) {
        const rows = Array.from(table.querySelectorAll('tr'));
        const fittingRows = [];
        let usedHeight = 0;
        for (const row of rows) {
            const rowHeight = row.getBoundingClientRect().height;
            if (usedHeight + rowHeight > availableHeight) {
                break;
            }
            fittingRows.push(row);
            usedHeight += rowHeight;
        }
        return { fittingRows, remainingRows: rows.slice(fittingRows.length), usedHeight };
    }
    resetTableRowSplits(table) {
        if (table.style.marginBottom) {
            table.style.marginBottom = '';
        }
        table.querySelectorAll('tr').forEach(row => {
            if (row.style.transform) {
                row.style.transform = '';
            }
            if (row.classList.contains('table-page-start')) {
                row.classList.remove('table-page-start');
            }
        });
    }
    getRowTranslateY(row) {
        const match = /translateY\((-?[\d.]+)px\)/.exec(row?.style?.transform || '');
        return match ? parseFloat(match[1]) : 0;
    }
    paginateTableRows(table, startLocalY, geometry) {
        const { PAGE_HEIGHT, PAGE_GAP, CONTENT_TOP, PAGE_LIMIT } = geometry;
        const rows = Array.from(table.querySelectorAll('tr'));
        if (!rows.length) {
            const height = table.offsetHeight;
            if (startLocalY + height > PAGE_LIMIT && startLocalY > CONTENT_TOP) {
                table.style.marginTop = `${(PAGE_HEIGHT - startLocalY) + PAGE_GAP + CONTENT_TOP}px`;
                return { localY: CONTENT_TOP + height, pagesAdded: 1 };
            }
            return { localY: startLocalY + height, pagesAdded: 0 };
        }
        const heights = rows.map(row => row.getBoundingClientRect().height);
        let localY = startLocalY;
        let pagesAdded = 0;
        if (localY + heights[0] > PAGE_LIMIT && localY > CONTENT_TOP) {
            table.style.marginTop = `${(PAGE_HEIGHT - localY) + PAGE_GAP + CONTENT_TOP}px`;
            pagesAdded++;
            localY = CONTENT_TOP;
        }
        let offset = 0;
        rows.forEach((row, index) => {
            const height = heights[index];
            let startsPage = false;
            if (index > 0 && localY + height > PAGE_LIMIT && localY > CONTENT_TOP) {
                offset += (PAGE_HEIGHT - localY) + PAGE_GAP + CONTENT_TOP;
                pagesAdded++;
                localY = CONTENT_TOP;
                startsPage = true;
                console.log(`[PAGINATION] TABLE ROW ${index + 1} → page ${pagesAdded + 1} of this table`, {
                    rowHeight: height,
                    offset
                });
            }
            const transform = offset > 0 ? `translateY(${offset}px)` : '';
            if (row.style.transform !== transform) {
                row.style.transform = transform;
            }
            if (row.classList.contains('table-page-start') !== startsPage) {
                row.classList.toggle('table-page-start', startsPage);
            }
            localY += height;
        });
        if (offset > 0) {
            table.style.marginBottom = `${offset}px`;
        }
        return { localY, pagesAdded };
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
                const isTable = child.tagName === 'TABLE';
                if (isManualPageBreak || isTable || child.offsetHeight <= maxHeight) continue;
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
    /**
     * Quill 2 draws a list's number / bullet from `li > .ql-ui::before`. That
     * marker is a SIBLING of the line's text, not an ancestor of it, so the
     * <strong> / <em> / <u> / <span style="color"> a toolbar format wraps the
     * text in never reaches it - a fully bold list line renders a
     * regular-weight "1." next to bold text.
     *
     * The marker does inherit from the <li>, so the line's formatting is
     * mirrored onto the <li> itself. Quill's getFormat() reports a format only
     * when it is uniform across the whole range (mixed values come back as an
     * array, never as `true`), so bolding a single word inside a list item
     * correctly leaves the marker alone - the same rule Word and Google Docs
     * apply to list markers.
     *
     * Called from repaginate() because every path that changes the document -
     * typing, toolbar clicks, keyboard shortcuts and each of the innerHTML
     * loads - already funnels through it, and because Quill rebuilds a list
     * blot's DOM node on structural edits, which drops styles written outside
     * Parchment. Re-applying here repairs that.
     */
    syncListMarkerFormats(quill) {
        if (!window.Quill) return;
        quill.root.querySelectorAll('li').forEach(item => {
            const blot = window.Quill.find(item);
            if (!blot) return;
            // length() counts the line's own newline; the text precedes it.
            const textLength = Math.max(0, blot.length() - 1);
            const format = textLength
                ? quill.getFormat(quill.getIndex(blot), textLength)
                : {};
            const decorations = [];
            if (format.underline === true) decorations.push('underline');
            if (format.strike === true) decorations.push('line-through');
            this.setListMarkerStyle(item, 'fontWeight', format.bold === true ? '700' : '');
            this.setListMarkerStyle(item, 'fontStyle', format.italic === true ? 'italic' : '');
            this.setListMarkerStyle(item, 'textDecoration', decorations.join(' '));
            this.setListMarkerStyle(item, 'color', typeof format.color === 'string' ? format.color : '');
        });
    }

    /**
     * Writing an unchanged value still counts as a DOM mutation, which Quill's
     * MutationObserver picks up and reconciles on its next update - so only
     * touch the node when the value actually differs.
     */
    setListMarkerStyle(item, property, value) {
        if (item.style[property] === value) return;
        item.style[property] = value;
    }
    repaginate() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('[PAGINATION] ❌ Quill not available');
            return;
        }
        this.syncListMarkerFormats(quill);
        const geometry = this.getPageGeometry();
        const { MARGIN_TOP, MARGIN_BOTTOM, CONTENT_TOP, PAGE_LIMIT } = geometry;
        quill.root.style.setProperty('--doc-content-top', `${CONTENT_TOP}px`);
        quill.root.style.setProperty('--doc-content-bottom', `${MARGIN_BOTTOM + geometry.footerHeight}px`);
        this.splitOversizedBlocks(quill);
        const children = Array.from(quill.root.children);
        if (PAGINATION_DEBUG) {
            console.log('========== [PAGINATION DEBUG START] ==========');
            console.log('[PAGINATION] Total root children:', children.length);
            console.log('[PAGINATION] Root scrollHeight:', quill.root.scrollHeight);
            console.log('[PAGINATION] Root clientHeight:', quill.root.clientHeight);
        }
        if (PAGINATION_DEBUG) {
            console.log('[PAGINATION] PAGE_HEIGHT:', PAGE_HEIGHT);
            console.log('[PAGINATION] PAGE_LIMIT:', PAGE_LIMIT);
            console.log('[PAGINATION] MARGIN_TOP:', MARGIN_TOP);
            console.log('[PAGINATION] MARGIN_BOTTOM:', MARGIN_BOTTOM);
            console.log('[PAGINATION] CONTENT_TOP (margin + header band):', CONTENT_TOP);
            console.log('[PAGINATION] HEADER HEIGHT:', geometry.headerHeight);
            console.log('[PAGINATION] FOOTER HEIGHT:', geometry.footerHeight);
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
        if (children.length === 0) {
            this.pages = [{ id: 'page-0', style: 'margin-bottom: 40px;' }];
            this.syncHeaderFooterPages(1);
            this.renderPageChrome();
            return;
        }
        if (children.length > 0 && children[0].offsetHeight === 0) {
            console.log('[PAGINATION] DOM not laid out yet. Retrying...');
            setTimeout(() => this.repaginate(), 50);
            return;
        }
        let currentPage = 1;
        let currentLocalY = CONTENT_TOP;
        children.forEach(child => {
            child.style.marginTop = '';
            child.style.minHeight = '';
            if (child.tagName === 'TABLE') {
                this.resetTableRowSplits(child);
            }
        });
        children.forEach((child, index) => {
            const height = child.offsetHeight;
            const isManualPageBreak = child.classList.contains('quill-page-break') || child.getAttribute('data-type') === 'PageBreak';
            if (child.tagName === 'TABLE' && !isManualPageBreak) {
                const result = this.paginateTableRows(child, currentLocalY, geometry);
                currentPage += result.pagesAdded;
                currentLocalY = result.localY;
                return;
            }
            console.log(`[PAGINATION] PROCESS CHILD ${index + 1}:`, {
                height,
                currentPage,
                currentLocalY,
                pageLimit: PAGE_LIMIT,
                willOverflow: currentLocalY + height > PAGE_LIMIT,
                isManualPageBreak
            });
            if (isManualPageBreak) {
                const marginTop = (PAGE_HEIGHT - currentLocalY) + PAGE_GAP + CONTENT_TOP;
                console.log(`[PAGINATION] MANUAL PAGE BREAK → Page ${currentPage} → Page ${currentPage + 1}`, {
                    marginTop
                });
                child.style.marginTop = `${marginTop}px`;
                currentPage++;
                currentLocalY = CONTENT_TOP + height;
                return;
            }
            if (currentLocalY + height > PAGE_LIMIT && currentLocalY > CONTENT_TOP) {
                const marginTop = (PAGE_HEIGHT - currentLocalY) + PAGE_GAP + CONTENT_TOP;
                console.log(`[PAGINATION] OVERFLOW → Moving CHILD ${index + 1} to Page ${currentPage + 1}`, {
                    currentPage,
                    currentLocalY,
                    height,
                    pageLimit: PAGE_LIMIT,
                    marginTop
                });
                child.style.marginTop = `${marginTop}px`;
                currentPage++;
                currentLocalY = CONTENT_TOP + height;
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
        this.syncHeaderFooterPages(currentPage);
        this.renderPageChrome();
        console.log('[PAGINATION] FINAL PAGE COUNT:', currentPage);
        console.log('[PAGINATION] FINAL ROOT MIN HEIGHT:', totalHeight);
        console.log('========== [PAGINATION COMPLETE] ==========');
    }
    get headerFooterEnabled() {
        return !!this.headerFooterConfig?.enabled;
    }
    get isPerPageMode() {
        return this.headerFooterConfig?.mode === 'PER_PAGE';
    }
    get effectiveHeaderHeight() {
        const config = this.headerFooterConfig;
        if (!config?.enabled || !config?.hasHeader) return 0;
        return clampNumber(config.headerHeight, 0, MAX_HEADER_HEIGHT, DEFAULT_HEADER_HEIGHT);
    }
    get effectiveFooterHeight() {
        const config = this.headerFooterConfig;
        if (!config?.enabled || !config?.hasFooter) return 0;
        return clampNumber(config.footerHeight, 0, MAX_FOOTER_HEIGHT, DEFAULT_FOOTER_HEIGHT);
    }
    get headerFooterModeOptions() {
        return [
            { label: 'All Pages', value: 'SAME_ALL' },
            { label: 'Per Page', value: 'PER_PAGE' }
        ];
    }
    get headerFooterPageOptions() {
        const count = Math.max(1, this.pages?.length || 1);
        return Array.from({ length: count }, (unused, index) => ({
            label: `Page ${index + 1}`,
            value: String(index)
        }));
    }
    get headerFooterPlaceholderOptions() {
        const customOptions = (this.customFields || []).map(field => ({
            label: field.label,
            value: field.type
        }));
        return [
            { label: 'Page Number', value: 'PageNumber' },
            { label: 'Total Pages', value: 'TotalPages' },
            ...DEMOGRAPHIC_FIELDS.map(field => ({ label: field.label, value: field.type })),
            ...customOptions
        ];
    }
    get headerButtonLabel() {
        return this.getRegionHtml('header', this.currentHeaderFooterPageIndex) ? 'Edit Header' : 'Add Header';
    }
    get footerButtonLabel() {
        return this.getRegionHtml('footer', this.currentHeaderFooterPageIndex) ? 'Edit Footer' : 'Add Footer';
    }
    get currentHeaderFooterPageIndex() {
        if (!this.isPerPageMode) return null;
        return clampNumber(this.selectedHeaderFooterPage, 0, Math.max(0, (this.pages?.length || 1) - 1), 0);
    }
    get headerFooterSummary() {
        if (!this.headerFooterEnabled) return 'Header and footer are turned off for this template.';
        return this.isPerPageMode
            ? 'Every page keeps its own header and footer. Click a page\'s header or footer area to edit it.'
            : 'One header and one footer are repeated on every page.';
    }
    syncHeaderFooterPages(pageCount) {
        const config = this.headerFooterConfig;
        if (!config) return;
        const pages = Array.isArray(config.pages) ? [...config.pages] : [];
        const before = pages.length;
        while (pages.length < pageCount) {
            pages.push({ header: '', footer: '' });
        }
        if (pages.length !== before) {
            config.pages = pages;
            console.log('[PAGE_STATE] Page entries grown', { from: before, to: pages.length });
        } else if (before > pageCount && this._lastPageCount !== pageCount) {
            console.log('[PAGE_STATE] Document shrank; retaining header/footer for removed pages', {
                pageCount,
                retainedEntries: before
            });
        }
        this._lastPageCount = pageCount;
    }
    getRegionHtml(region, pageIndex) {
        const config = this.headerFooterConfig;
        if (!config) return '';
        if (!this.isPerPageMode || pageIndex == null) {
            return config.common?.[region] || '';
        }
        return config.pages?.[pageIndex]?.[region] || '';
    }
    setRegionHtml(region, pageIndex, html) {
        const config = this.headerFooterConfig;
        if (!config) return;
        if (!this.isPerPageMode || pageIndex == null) {
            config.common = { ...config.common, [region]: html };
            return;
        }
        const pages = Array.isArray(config.pages) ? [...config.pages] : [];
        while (pages.length <= pageIndex) {
            pages.push({ header: '', footer: '' });
        }
        pages[pageIndex] = { ...pages[pageIndex], [region]: html };
        config.pages = pages;
    }
    isHtmlEmpty(html) {
        if (!html) return true;
        const probe = document.createElement('div');
        probe.innerHTML = html;
        if (probe.querySelector('img, .quill-placeholder-embed')) return false;
        const text = (probe.textContent || '').replace(/[ ​﻿]/g, '').trim();
        return !text;
    }
    renderPageChrome() {
        const layer = this.template.querySelector('.page-chrome-layer');
        if (!layer) return;
        const geometry = this.getPageGeometry();
        const pageCount = this.pages?.length || 0;
        const signature = [
            pageCount,
            this._hfRevision,
            geometry.headerHeight,
            geometry.footerHeight,
            this.headerFooterConfig?.mode,
            this.headerFooterEnabled
        ].join('|');
        if (signature === this._chromeSignature) return;
        this._chromeSignature = signature;
        console.log('[HEADER_FOOTER] Rendering page chrome', {
            pages: pageCount,
            mode: this.headerFooterConfig?.mode,
            enabled: this.headerFooterEnabled,
            headerHeight: geometry.headerHeight,
            footerHeight: geometry.footerHeight
        });
        layer.innerHTML = '';
        if (!this.headerFooterEnabled || (!geometry.headerHeight && !geometry.footerHeight)) {
            return;
        }
        for (let index = 0; index < pageCount; index++) {
            const pageEl = document.createElement('div');
            pageEl.className = 'doc-page-chrome';
            pageEl.style.height = `${geometry.PAGE_HEIGHT}px`;
            pageEl.style.marginBottom = `${geometry.PAGE_GAP}px`;
            if (geometry.headerHeight > 0) {
                pageEl.appendChild(this.buildChromeRegion('header', index, pageCount, geometry));
            }
            if (geometry.footerHeight > 0) {
                pageEl.appendChild(this.buildChromeRegion('footer', index, pageCount, geometry));
            }
            layer.appendChild(pageEl);
        }
        this.bindChromeClickHandler(layer);
    }
    buildChromeRegion(region, pageIndex, pageCount, geometry, readOnly = false) {
        const isHeader = region === 'header';
        const height = isHeader ? geometry.headerHeight : geometry.footerHeight;
        const regionEl = document.createElement('div');
        regionEl.className = `doc-hf-region doc-hf-${region}`;
        regionEl.dataset.region = region;
        regionEl.dataset.pageIndex = String(pageIndex);
        regionEl.style.top = isHeader
            ? `${geometry.MARGIN_TOP}px`
            : `${geometry.PAGE_HEIGHT - geometry.MARGIN_BOTTOM - geometry.footerHeight}px`;
        regionEl.style.height = `${height}px`;
        regionEl.style.setProperty('--hf-band-height', `${height}px`);
        const content = document.createElement('div');
        content.className = 'doc-hf-content ql-editor';
        const html = this.getRegionHtml(region, pageIndex);
        if (this.isHtmlEmpty(html)) {
            if (!readOnly) {
                content.classList.add('doc-hf-empty');
                const scope = this.isPerPageMode ? ` for page ${pageIndex + 1}` : '';
                content.textContent = `+ Add ${region}${scope}`;
            }
        } else {
            content.innerHTML = html;
            this.applyPageTokens(content, pageIndex, pageCount);
        }
        regionEl.appendChild(content);
        return regionEl;
    }
    applyPageTokens(root, pageIndex, pageCount) {
        root.querySelectorAll('[data-type="PageNumber"]').forEach(node => {
            node.textContent = String(pageIndex + 1);
        });
        root.querySelectorAll('[data-type="TotalPages"]').forEach(node => {
            node.textContent = String(pageCount);
        });
    }
    bindChromeClickHandler(layer) {
        if (this._chromeListenerBound) return;
        this._chromeListenerBound = true;
        layer.addEventListener('click', (event) => {
            const regionEl = event.target.closest('.doc-hf-region');
            if (!regionEl) return;
            event.preventDefault();
            event.stopPropagation();
            this.openHeaderFooterEditor(regionEl.dataset.region, Number(regionEl.dataset.pageIndex));
        });
    }
    handleHeaderFooterEnabledChange(event) {
        this.headerFooterConfig.enabled = event.target.checked;
        this._hfRevision++;
        console.log('[HEADER_FOOTER] Enabled:', this.headerFooterConfig.enabled);
        this.repaginate();
    }
    handleHeaderFooterModeChange(event) {
        const mode = event.detail?.value === 'PER_PAGE' ? 'PER_PAGE' : 'SAME_ALL';
        this.headerFooterConfig.mode = mode;
        this._hfRevision++;
        console.log('[HEADER_FOOTER] Mode changed to:', mode);
        this.repaginate();
    }
    handleHasHeaderChange(event) {
        this.headerFooterConfig.hasHeader = event.target.checked;
        this._hfRevision++;
        console.log('[HEADER_FOOTER] Header shown:', this.headerFooterConfig.hasHeader);
        this.repaginate();
    }
    handleHasFooterChange(event) {
        this.headerFooterConfig.hasFooter = event.target.checked;
        this._hfRevision++;
        console.log('[HEADER_FOOTER] Footer shown:', this.headerFooterConfig.hasFooter);
        this.repaginate();
    }
    handleHeaderHeightChange(event) {
        const height = clampNumber(event.target.value, 0, MAX_HEADER_HEIGHT, DEFAULT_HEADER_HEIGHT);
        const previous = this.headerFooterConfig.headerHeight;
        this.headerFooterConfig.headerHeight = height;
        if (height < previous) {
            this.reconstrainStoredLogos('header', height);
        }
        this._hfRevision++;
        console.log('[HEADER_FOOTER] Header height changed', { from: previous, to: height });
        this.applyHeaderFooterEditorHeight();
        this.updateHeaderFooterOverflowState();
        this.repaginate();
    }
    handleFooterHeightChange(event) {
        const height = clampNumber(event.target.value, 0, MAX_FOOTER_HEIGHT, DEFAULT_FOOTER_HEIGHT);
        const previous = this.headerFooterConfig.footerHeight;
        this.headerFooterConfig.footerHeight = height;
        if (height < previous) {
            this.reconstrainStoredLogos('footer', height);
        }
        this._hfRevision++;
        console.log('[HEADER_FOOTER] Footer height changed', { from: previous, to: height });
        this.applyHeaderFooterEditorHeight();
        this.updateHeaderFooterOverflowState();
        this.repaginate();
    }
    get headerFooterEditorHeight() {
        return this.headerFooterEditorRegion === 'footer'
            ? clampNumber(this.headerFooterConfig?.footerHeight, 0, MAX_FOOTER_HEIGHT, DEFAULT_FOOTER_HEIGHT)
            : clampNumber(this.headerFooterConfig?.headerHeight, 0, MAX_HEADER_HEIGHT, DEFAULT_HEADER_HEIGHT);
    }
    get hfLogoMaxWidth() {
        const img = this._hfSelectedImage;
        const maxHeight = Math.max(1, this.headerFooterEditorHeight - LOGO_HEIGHT_ALLOWANCE);
        if (!img) return BAND_CONTENT_WIDTH;
        const width = Number(img.getAttribute('width'));
        const height = Number(img.getAttribute('height'));
        const ratio = width && height ? height / width : 1;
        return Math.max(1, Math.min(BAND_CONTENT_WIDTH, Math.floor(maxHeight / ratio)));
    }
    get headerFooterOverflowClass() {
        return this.hfContentOverflow
            ? 'hf-overflow-warning'
            : 'hf-overflow-warning hf-hidden';
    }
    get headerFooterOverflowMessage() {
        return `This content is taller than the configured ${this.headerFooterEditorRegion} height of ${this.headerFooterEditorHeight}px and will be cut off. Increase the height or shorten the content.`;
    }
    applyHeaderFooterEditorHeight() {
        const shell = this.template.querySelector('.hf-editor-shell');
        if (!shell) return;
        const height = this.headerFooterEditorHeight;
        shell.style.setProperty('--hf-editor-height', `${height}px`);
        shell.style.setProperty('--hf-editor-width', `${BAND_CONTENT_WIDTH}px`);
        const quill = this.quillInstances?.headerFooterEditor;
        if (quill) {
            quill.root.querySelectorAll('img').forEach(img => {
                this.constrainLogoElement(img, Number(img.getAttribute('width')) || 160);
            });
            if (this._hfSelectedImage) {
                this.hfLogoWidth = Number(this._hfSelectedImage.getAttribute('width')) || this.hfLogoWidth;
            }
        }
    }
    handleHeaderFooterPageChange(event) {
        this.selectedHeaderFooterPage = event.detail.value;
        console.log('[HEADER_FOOTER] Sidebar target page:', this.selectedHeaderFooterPage);
    }
    getBandDesignCatalogue(region) {
        return region === 'footer' ? FOOTER_BAND_TEMPLATES : HEADER_BAND_TEMPLATES;
    }
    get hfDesignButtonLabel() {
        return this.headerFooterEditorRegion === 'footer' ? 'Footer Designs' : 'Header Designs';
    }
    get hfDesignGalleryTitle() {
        return this.headerFooterEditorRegion === 'footer' ? 'Choose a footer design' : 'Choose a header design';
    }
    get hfEditorIcon() {
        return this.headerFooterEditorRegion === 'footer' ? 'vertical_align_bottom' : 'vertical_align_top';
    }
    get hfDesignToggleIcon() {
        return this.showHfDesignGallery ? 'expand_less' : 'expand_more';
    }
    get hfDesignGalleryExpanded() {
        return this.showHfDesignGallery ? 'true' : 'false';
    }
    get hfDesignCountLabel() {
        return `${this.getBandDesignCatalogue(this.headerFooterEditorRegion).length} designs`;
    }
    get hfDesignOptions() {
        const previewHeight = Math.max(1, Math.round(this.headerFooterEditorHeight * HF_DESIGN_PREVIEW_SCALE));
        const previewStyle = `height:${previewHeight}px;`;
        return this.getBandDesignCatalogue(this.headerFooterEditorRegion).map(design => ({
            id: design.id,
            label: design.label,
            previewStyle
        }));
    }
    toggleHfDesignGallery() {
        this.showHfDesignGallery = !this.showHfDesignGallery;
        this._hfDesignPreviewsPending = this.showHfDesignGallery;
    }
    renderHfDesignPreviewsIfNeeded() {
        if (!this._hfDesignPreviewsPending) return;
        const hosts = this.template.querySelectorAll('.hf-design-preview');
        if (!hosts.length) return;
        this._hfDesignPreviewsPending = false;
        const catalogue = this.getBandDesignCatalogue(this.headerFooterEditorRegion);
        const height = this.headerFooterEditorHeight;
        hosts.forEach(host => {
            const design = catalogue.find(entry => entry.id === host.dataset.id);
            if (!design) return;
            const band = document.createElement('div');
            band.style.width = `${BAND_CONTENT_WIDTH}px`;
            band.style.height = `${height}px`;
            band.style.position = 'relative';
            band.style.overflow = 'hidden';
            band.style.background = '#ffffff';
            band.style.transform = `scale(${HF_DESIGN_PREVIEW_SCALE})`;
            band.style.transformOrigin = '0 0';
            band.style.setProperty('--hf-band-height', `${height}px`);
            const content = document.createElement('div');
            content.className = 'doc-hf-content ql-editor';
            content.innerHTML = this.prepareBandHtmlForStorage(design.build(), height, design.background);
            band.appendChild(content);
            host.innerHTML = '';
            host.appendChild(band);
        });
        console.log('[HEADER_FOOTER] Design previews rendered:', hosts.length);
    }
    handleHfDesignSelect(event) {
        this.requestBandTemplate(this.headerFooterEditorRegion, event.currentTarget.dataset.id);
    }
    requestBandTemplate(region, templateId) {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill || !templateId) return;
        this._pendingBandTemplate = { region, templateId };
        if (this.isHtmlEmpty(quill.root.innerHTML)) {
            this.applyPendingBandTemplate();
            return;
        }
        this.openConfirmation(region === 'header' ? 'applyHeaderTemplate' : 'applyFooterTemplate');
    }
    applyPendingBandTemplate() {
        const pending = this._pendingBandTemplate;
        this._pendingBandTemplate = null;
        if (!pending) return;
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill || pending.region !== this.headerFooterEditorRegion) return;
        const { region, templateId } = pending;
        const design = this.getBandDesignCatalogue(region).find(entry => entry.id === templateId);
        if (!design) {
            console.warn('[HEADER_FOOTER] Unknown design requested:', templateId);
            return;
        }
        this.hfBandBackground = this.normaliseBandBackground(design.background);
        this.applyHeaderFooterEditorBackground();
        const designHtml = design.build();
        quill.root.innerHTML = designHtml;
        quill.update();
        this.applyHeaderFooterEditorHeight();
        this._hfSavedRange = null;
        this._hfSelectedImage = null;
        this.showHfLogoControls = false;
        this.showHfLogoTip = designHtml.includes(HF_LOGO_DATA_URI);
        this.showHfDesignGallery = false;
        this.updateHeaderFooterOverflowState();
        console.log('[HEADER_FOOTER] Design loaded into editor', {
            region,
            design: design.label,
            pageIndex: this.headerFooterEditorPageIndex,
            background: this.hfBandBackground || 'none'
        });
    }
    normaliseBandBackground(value) {
        const colour = String(value || '').trim().toLowerCase();
        if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(colour)) return '';
        return colour === '#ffffff' || colour === '#fff' ? '' : colour;
    }
    get hfBandBackgroundValue() {
        return this.hfBandBackground || '#ffffff';
    }
    applyHeaderFooterEditorBackground() {
        const shell = this.template.querySelector('.hf-editor-shell');
        if (!shell) return;
        const background = this.hfBandBackground;
        shell.style.setProperty('--hf-editor-bg', background || '#ffffff');
        shell.style.setProperty('--hf-editor-pad-x', background ? `${HF_BAND_PADDING_X}px` : '0px');
        this.updateHeaderFooterOverflowState();
    }
    handleHfBandBackgroundChange(event) {
        this.hfBandBackground = this.normaliseBandBackground(event.target.value);
        this.applyHeaderFooterEditorBackground();
        console.log('[HEADER_FOOTER] Band background:', this.hfBandBackground || 'none');
    }
    handleClearHfBandBackground() {
        this.hfBandBackground = '';
        this.applyHeaderFooterEditorBackground();
        console.log('[HEADER_FOOTER] Band background removed');
    }
    readBandBackground(html) {
        if (!html || html.indexOf(HF_BAND_BACKGROUND_ATTR) === -1) return '';
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const root = doc.body.querySelector(`.${HF_BAND_ROOT_CLASS}`);
            return this.normaliseBandBackground(root?.getAttribute(HF_BAND_BACKGROUND_ATTR));
        } catch (error) {
            console.error('[HEADER_FOOTER] Failed to read band background:', error);
            return '';
        }
    }
    handleEditHeaderClick() {
        this.openHeaderFooterEditor('header', this.currentHeaderFooterPageIndex);
    }
    handleEditFooterClick() {
        this.openHeaderFooterEditor('footer', this.currentHeaderFooterPageIndex);
    }
    openHeaderFooterEditor(region, pageIndex) {
        if (!window.Quill) {
            console.warn('[HEADER_FOOTER] Editor requested before Quill was ready');
            return;
        }
        const perPage = this.isPerPageMode;
        const index = perPage
            ? clampNumber(pageIndex, 0, Math.max(0, (this.pages?.length || 1) - 1), 0)
            : null;
        this.headerFooterEditorRegion = region === 'footer' ? 'footer' : 'header';
        this.headerFooterEditorPageIndex = index;
        this.headerFooterEditorTitle = `${this.headerFooterEditorRegion === 'header' ? 'Header' : 'Footer'} — ${perPage ? `Page ${index + 1}` : 'All Pages'}`;
        const storedHtml = this.getRegionHtml(this.headerFooterEditorRegion, index);
        this.hfBandBackground = this.readBandBackground(storedHtml);
        this._hfInitialHtml = this.prepareBandHtmlForEditor(storedHtml);
        this.showHfDesignGallery = false;
        this._hfDesignPreviewsPending = false;
        this._hfSavedRange = null;
        this._hfSelectedImage = null;
        this.showHfLogoControls = false;
        this.showHfLogoTip = false;
        this.hfPlaceholderType = '';
        this.hfContentOverflow = false;
        this._pendingHfEditorInit = true;
        this.showHeaderFooterModal = true;
        if (perPage) {
            this.selectedHeaderFooterPage = String(index);
        }
        console.log('[HEADER_FOOTER] Editor opened', {
            region: this.headerFooterEditorRegion,
            pageIndex: index,
            mode: this.headerFooterConfig?.mode
        });
    }
    initHeaderFooterEditorIfNeeded() {
        if (!this._pendingHfEditorInit) return;
        const host = this.template.querySelector('[data-id="headerFooterEditor"]');
        if (!host || !window.Quill) return;
        this._pendingHfEditorInit = false;
        const logPrefix = this.headerFooterEditorRegion === 'header' ? '[QUILL_HEADER]' : '[QUILL_FOOTER]';
        this.applyHeaderFooterEditorHeight();
        this.applyHeaderFooterEditorBackground();
        const quill = new window.Quill(host, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [
                        [{ font: [] }, { hfsize: HF_FONT_SIZES }],
                        ['bold', 'italic', 'underline'],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        ['image'],
                        ['clean']
                    ],
                    handlers: {
                        image: () => this.handleHeaderFooterImage(),
                        align: (value) => this.handleHeaderFooterAlign(value)
                    }
                }
            }
        });
        this.quillInstances.headerFooterEditor = quill;
        this.attachToolbarSelectionGuard(quill, logPrefix);
        this.applyToolbarTooltips(quill.getModule('toolbar')?.container);
        quill.on('selection-change', (range) => {
            if (range) this._hfSavedRange = range;
        });
        if (this._hfInitialHtml) {
            quill.root.innerHTML = this._hfInitialHtml;
            quill.update();
        }
        quill.root.addEventListener('click', (event) => {
            if (event.target.tagName === 'IMG') {
                this.selectHeaderFooterImage(event.target);
                if (this.isHfLogoPlaceholder(event.target)) {
                    this.replaceHeaderFooterImage(event.target);
                }
            } else if (this.showHfLogoControls) {
                this.showHfLogoControls = false;
                this._hfSelectedImage = null;
            }
        });
        quill.on('text-change', () => this.updateHeaderFooterOverflowState());
        this.updateHeaderFooterOverflowState();
        requestAnimationFrame(() => {
            if (this.quillInstances?.headerFooterEditor === quill) {
                quill.focus();
            }
        });
        console.log(`${logPrefix} Editor initialised`, {
            region: this.headerFooterEditorRegion,
            pageIndex: this.headerFooterEditorPageIndex,
            heightPx: this.headerFooterEditorHeight,
            defaultFontSize: HF_DEFAULT_FONT_SIZE
        });
    }
    applyToolbarTooltips(container) {
        if (!container) return;
        const labels = {
            '.ql-font': 'Font',
            '.ql-size': 'Font size',
            '.ql-hfsize': 'Font size',
            '.ql-header[value="1"]': 'Heading 1',
            '.ql-header[value="2"]': 'Heading 2',
            '.ql-bold': 'Bold',
            '.ql-italic': 'Italic',
            '.ql-underline': 'Underline',
            '.ql-strike': 'Strikethrough',
            '.ql-color': 'Text color',
            '.ql-background': 'Background color',
            '.ql-script[value="sub"]': 'Subscript',
            '.ql-script[value="super"]': 'Superscript',
            '.ql-blockquote': 'Quote',
            '.ql-code-block': 'Code block',
            '.ql-list[value="ordered"]': 'Numbered list',
            '.ql-list[value="bullet"]': 'Bulleted list',
            '.ql-indent[value="-1"]': 'Decrease indent',
            '.ql-indent[value="+1"]': 'Increase indent',
            '.ql-direction[value="rtl"]': 'Text direction',
            '.ql-align': 'Alignment',
            '.ql-link': 'Insert link',
            '.ql-image': 'Insert image',
            '.ql-table': 'Insert table',
            '.ql-clean': 'Clear formatting'
        };
        Object.keys(labels).forEach(selector => {
            container.querySelectorAll(selector).forEach(node => {
                const target = node.classList.contains('ql-picker')
                    ? node.querySelector('.ql-picker-label') || node
                    : node;
                target.setAttribute('title', labels[selector]);
            });
        });
    }
    attachToolbarSelectionGuard(quill, logPrefix) {
        const toolbar = quill.getModule('toolbar');
        if (!toolbar?.container) {
            console.warn(`${logPrefix} Toolbar module unavailable; selection guard not attached`);
            return;
        }
        let savedSelection = null;
        quill.on('selection-change', (range) => {
            if (range) savedSelection = range;
        });
        toolbar.container.addEventListener('mousedown', () => {
            const live = quill.getSelection();
            if (live) savedSelection = live;
        }, true);
        toolbar.container.addEventListener('click', () => {
            if (!savedSelection) return;
            quill.setSelection(savedSelection.index, savedSelection.length, 'silent');
            requestAnimationFrame(() => {
                if (this.quillInstances?.headerFooterEditor !== quill) return;
                quill.setSelection(savedSelection.index, savedSelection.length, 'silent');
            });
        }, true);
        console.log(`${logPrefix} Toolbar selection guard attached`);
    }
    get headerFooterPositionOptions() {
        return HF_POSITION_OPTIONS;
    }
    isPartialLineSelection(quill, range) {
        if (!range || range.length <= 0) return false;
        const [line, offset] = quill.getLine(range.index);
        if (!line) return false;
        const lineStart = range.index - offset;
        const contentLength = Math.max(0, line.length() - 1);
        if (range.index + range.length > lineStart + contentLength) return false;
        return range.length < contentLength;
    }
    getLineBoundsInRange(quill, range) {
        const lines = quill.getLines(range.index, Math.max(range.length, 1)) || [];
        return lines.map(line => ({
            start: quill.getIndex(line),
            contentLength: Math.max(0, line.length() - 1)
        }));
    }
    clearSegmentPositions(quill, range) {
        this.getLineBoundsInRange(quill, range).forEach(({ start, contentLength }) => {
            if (!contentLength) return;
            quill.formatText(start, contentLength, 'hfpos', false, 'user');
        });
    }
    applySegmentPosition(quill, range, horizontal) {
        const [line, offset] = quill.getLine(range.index);
        if (!line) return;
        const formats = quill.getFormat(range.index, range.length) || {};
        const vertical = HF_VERTICAL_VALUES.includes(formats.hfblock) ? formats.hfblock : 'top';
        quill.formatLine(range.index - offset, 1, 'hfblock', vertical, 'user');
        quill.formatText(range.index, range.length, 'hfpos', horizontal, 'user');
        quill.setSelection(range.index, range.length, 'silent');
        console.log('[HEADER_FOOTER] Selected content pinned', { vertical, horizontal, length: range.length });
    }
    handleHeaderFooterAlign(value) {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill) return;
        const range = quill.getSelection() || this._hfSavedRange;
        if (!range) {
            console.warn('[HEADER_FOOTER] Align requested without a selection');
            return;
        }
        if (this.isPartialLineSelection(quill, range)) {
            const horizontal = value === 'center' || value === 'right' ? value : 'left';
            this.applySegmentPosition(quill, range, horizontal);
            this.updateHeaderFooterOverflowState();
            return;
        }
        this.clearSegmentPositions(quill, range);
        quill.formatLine(range.index, Math.max(range.length, 1), 'align', value || false, 'user');
        this.updateHeaderFooterOverflowState();
    }
    handleHfPositionMouseDown(event) {
        event.preventDefault();
    }
    handleHeaderFooterPositionClick(event) {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill) return;
        const vertical = event.currentTarget.dataset.vertical;
        const horizontal = event.currentTarget.dataset.horizontal;
        if (!HF_VERTICAL_VALUES.includes(vertical) || !HF_HORIZONTAL_VALUES.includes(horizontal)) return;
        const range = quill.getSelection()
            || this._hfSavedRange
            || { index: Math.max(0, quill.getLength() - 1), length: 0 };
        const bounds = this.getLineBoundsInRange(quill, range);
        bounds.forEach(({ start }) => {
            quill.formatLine(start, 1, 'hfblock', vertical, 'user');
        });
        if (this.isPartialLineSelection(quill, range)) {
            quill.formatText(range.index, range.length, 'hfpos', horizontal, 'user');
        } else {
            this.clearSegmentPositions(quill, range);
            bounds.forEach(({ start }) => {
                quill.formatLine(start, 1, 'align', horizontal === 'left' ? false : horizontal, 'user');
            });
        }
        quill.setSelection(range.index, range.length, 'silent');
        this.updateHeaderFooterOverflowState();
        console.log('[HEADER_FOOTER] Position applied', { vertical, horizontal, lines: bounds.length });
    }
    getPositioningDeclarations(node) {
        if (!node.classList || !node.classList.length) return '';
        const parts = [];
        HF_VERTICAL_VALUES.forEach(value => {
            if (node.classList.contains(`ql-hfblock-${value}`)) parts.push(HF_BLOCK_INLINE_STYLE[value]);
        });
        HF_HORIZONTAL_VALUES.forEach(value => {
            if (node.classList.contains(`ql-hfpos-${value}`)) parts.push(HF_POS_INLINE_STYLE[value]);
        });
        ['center', 'right', 'justify'].forEach(value => {
            if (node.classList.contains(`ql-align-${value}`)) parts.push(`text-align:${value};`);
        });
        return parts.join('');
    }
    mergeInlineStyle(existing, declarations) {
        const split = (text) => (text || '')
            .split(';')
            .map(part => part.trim())
            .filter(Boolean);
        const kept = split(existing).filter(part => {
            const property = part.split(':')[0].trim().toLowerCase();
            return !HF_POSITION_PROPERTIES.includes(property);
        });
        const all = [...kept, ...split(declarations)];
        return all.length ? `${all.join(';')};` : '';
    }
    bandHtmlHasPositioning(html) {
        return !!html && (
            html.indexOf('ql-hfblock-') !== -1 ||
            html.indexOf('ql-hfpos-') !== -1 ||
            html.indexOf('ql-align-') !== -1
        );
    }
    inlineBandPositioningStyles(html) {
        if (!this.bandHtmlHasPositioning(html)) return html;
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            doc.body.querySelectorAll('[class]').forEach(node => {
                const declarations = this.getPositioningDeclarations(node);
                if (!declarations) return;
                const style = this.mergeInlineStyle(node.getAttribute('style'), declarations);
                node.setAttribute('style', style);
            });
            return doc.body.innerHTML;
        } catch (error) {
            console.error('[HEADER_FOOTER] Failed to inline positioning styles:', error);
            return html;
        }
    }
    stripBandPositioningStyles(html) {
        if (!this.bandHtmlHasPositioning(html) || html.indexOf('style=') === -1) return html;
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            doc.body.querySelectorAll('[class][style]').forEach(node => {
                if (!this.getPositioningDeclarations(node)) return;
                const style = this.mergeInlineStyle(node.getAttribute('style'), '');
                if (style) {
                    node.setAttribute('style', style);
                } else {
                    node.removeAttribute('style');
                }
            });
            return doc.body.innerHTML;
        } catch (error) {
            console.error('[HEADER_FOOTER] Failed to strip positioning styles:', error);
            return html;
        }
    }
    wrapBandRoot(html, background = '') {
        const colour = this.normaliseBandBackground(background);
        if (!html || (!colour && html.indexOf('ql-hfblock-') === -1)) return html;
        if (html.indexOf(HF_BAND_ROOT_CLASS) !== -1) return html;
        const colourAttr = colour ? ` ${HF_BAND_BACKGROUND_ATTR}="${colour}"` : '';
        const colourStyle = colour
            ? `background-color:${colour};padding:0 ${HF_BAND_PADDING_X}px;${HF_BAND_PRINT_STYLE}`
            : '';
        return `<div class="${HF_BAND_ROOT_CLASS}"${colourAttr} style="${HF_BAND_ROOT_STYLE}${colourStyle}">${html}</div>`;
    }
    unwrapBandRoot(html) {
        if (!html || html.indexOf(HF_BAND_ROOT_CLASS) === -1) return html;
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const root = doc.body.querySelector(`.${HF_BAND_ROOT_CLASS}`);
            return root ? root.innerHTML : html;
        } catch (error) {
            console.error('[HEADER_FOOTER] Failed to unwrap band root:', error);
            return html;
        }
    }
    prepareBandHtmlForEditor(html) {
        if (!html) return '';
        return this.stripBandPositioningStyles(this.unwrapBandRoot(html));
    }
    prepareBandHtmlForStorage(html, bandHeight, background = '') {
        if (!html) return '';
        return this.wrapBandRoot(
            this.inlineBandPositioningStyles(
                this.constrainLogosInHtml(html, bandHeight)
            ),
            background
        );
    }
    updateHeaderFooterOverflowState() {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill) return;
        const overflowing = quill.root.scrollHeight > quill.root.clientHeight + 1;
        if (overflowing !== this.hfContentOverflow) {
            this.hfContentOverflow = overflowing;
            console.log('[HEADER_FOOTER] Content overflow:', overflowing);
        }
    }
    closeHeaderFooterEditor() {
        this.showHeaderFooterModal = false;
        this._pendingHfEditorInit = false;
        this._hfInitialHtml = '';
        this._hfSavedRange = null;
        this._hfSelectedImage = null;
        this.showHfLogoControls = false;
        this.showHfLogoTip = false;
        this.showHfDesignGallery = false;
        this._hfDesignPreviewsPending = false;
        this._pendingBandTemplate = null;
        this.hfBandBackground = '';
        this.quillInstances.headerFooterEditor = null;
        console.log('[HEADER_FOOTER] Editor closed');
    }
    saveHeaderFooterEditor() {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill) {
            this.closeHeaderFooterEditor();
            return;
        }
        const rawHtml = quill.root.innerHTML || '';
        const html = this.isHtmlEmpty(rawHtml)
            ? ''
            : this.prepareBandHtmlForStorage(rawHtml, this.headerFooterEditorHeight, this.hfBandBackground);
        const region = this.headerFooterEditorRegion;
        const index = this.headerFooterEditorPageIndex;
        const config = this.headerFooterConfig;
        this.setRegionHtml(region, index, html);
        this._hfRevision++;
        console.log('[HEADER_FOOTER] Content saved', {
            region,
            pageIndex: index,
            mode: config.mode,
            length: html.length
        });
        this.closeHeaderFooterEditor();
        this.repaginate();
    }
    clearHeaderFooterEditor() {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill) return;
        quill.setText('');
        this._hfSelectedImage = null;
        this.showHfLogoControls = false;
        this.showHfLogoTip = false;
        this.hfBandBackground = '';
        this.applyHeaderFooterEditorBackground();
        console.log('[HEADER_FOOTER] Editor content cleared');
    }
    handleHeaderFooterImage() {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill) return;
        const range = quill.getSelection(true) || { index: Math.max(0, quill.getLength() - 1), length: 0 };
        const insertAt = range.index;
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file) return;
            if (file.size > MAX_LOGO_BYTES) {
                console.warn('[HEADER_FOOTER] Logo rejected, too large:', file.size);
                this.showToast('Error', 'Please choose a logo smaller than 1 MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                quill.insertEmbed(insertAt, 'image', reader.result, 'user');
                quill.setSelection(insertAt + 1, 0, 'silent');
                requestAnimationFrame(() => {
                    const [leaf] = quill.getLeaf(insertAt + 1);
                    const node = leaf?.domNode;
                    if (node && node.tagName === 'IMG') {
                        const apply = () => {
                            const ratio = node.naturalWidth
                                ? node.naturalHeight / node.naturalWidth
                                : 1;
                            this.constrainLogoElement(node, this.hfLogoWidth || 160, ratio);
                            this.selectHeaderFooterImage(node);
                            this.updateHeaderFooterOverflowState();
                        };
                        if (node.complete && node.naturalWidth) {
                            apply();
                        } else {
                            node.addEventListener('load', apply, { once: true });
                        }
                    }
                    console.log('[HEADER_FOOTER] Logo inserted');
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
    constrainLogoElement(img, requestedWidth, ratioOverride) {
        const maxHeight = Math.max(1, this.headerFooterEditorHeight - LOGO_HEIGHT_ALLOWANCE);
        let ratio = ratioOverride;
        if (!ratio) {
            const currentWidth = Number(img.getAttribute('width'));
            const currentHeight = Number(img.getAttribute('height'));
            ratio = currentWidth && currentHeight
                ? currentHeight / currentWidth
                : (img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1);
        }
        const widthThatFitsHeight = ratio > 0 ? Math.floor(maxHeight / ratio) : BAND_CONTENT_WIDTH;
        const width = Math.max(
            1,
            Math.min(Number(requestedWidth) || 160, widthThatFitsHeight, BAND_CONTENT_WIDTH)
        );
        const height = Math.max(1, Math.round(width * ratio));
        img.setAttribute('width', String(width));
        img.setAttribute('height', String(height));
        console.log('[HEADER_FOOTER] Logo constrained', {
            requestedWidth,
            appliedWidth: width,
            appliedHeight: height,
            maxLogoHeight: maxHeight
        });
        return width;
    }
    constrainLogosInHtml(html, bandHeight) {
        if (!html || html.indexOf('<img') === -1) return html;
        const maxHeight = Math.max(1, bandHeight - LOGO_HEIGHT_ALLOWANCE);
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            let changed = false;
            doc.body.querySelectorAll('img').forEach(img => {
                const width = Number(img.getAttribute('width'));
                const height = Number(img.getAttribute('height'));
                if (!width || !height) return;
                const ratio = height / width;
                const maxWidth = ratio > 0 ? Math.floor(maxHeight / ratio) : BAND_CONTENT_WIDTH;
                if (width <= maxWidth) return;
                const newWidth = Math.max(1, Math.min(maxWidth, BAND_CONTENT_WIDTH));
                img.setAttribute('width', String(newWidth));
                img.setAttribute('height', String(Math.max(1, Math.round(newWidth * ratio))));
                changed = true;
            });
            if (!changed) return html;
            console.log('[HEADER_FOOTER] Logos re-constrained for band height', maxHeight);
            return doc.body.innerHTML;
        } catch (error) {
            console.error('[HEADER_FOOTER] Failed to constrain logos:', error);
            return html;
        }
    }
    reconstrainStoredLogos(region, maxHeight) {
        const config = this.headerFooterConfig;
        if (!config) return;
        config.common = {
            ...config.common,
            [region]: this.constrainLogosInHtml(config.common?.[region] || '', maxHeight)
        };
        if (Array.isArray(config.pages) && config.pages.length) {
            config.pages = config.pages.map(page => ({
                ...page,
                [region]: this.constrainLogosInHtml(page?.[region] || '', maxHeight)
            }));
        }
    }
    selectHeaderFooterImage(img) {
        this._hfSelectedImage = img;
        this.hfLogoWidth = Number(img.getAttribute('width')) || img.clientWidth || 160;
        this.showHfLogoControls = true;
        console.log('[HEADER_FOOTER] Logo selected, width:', this.hfLogoWidth);
    }
    handleHfLogoWidthChange(event) {
        const requested = clampNumber(event.target.value, 20, BAND_CONTENT_WIDTH, 160);
        if (!this._hfSelectedImage) {
            this.hfLogoWidth = requested;
            return;
        }
        const applied = this.constrainLogoElement(this._hfSelectedImage, requested);
        this.hfLogoWidth = applied;
        if (applied !== requested) {
            event.target.value = applied;
        }
        this.updateHeaderFooterOverflowState();
    }
    handleRemoveHfLogo() {
        const quill = this.quillInstances?.headerFooterEditor;
        const img = this._hfSelectedImage;
        if (!quill || !img) return;
        const blot = window.Quill?.find(img);
        if (blot) {
            blot.remove();
        } else {
            img.remove();
        }
        quill.update();
        this._hfSelectedImage = null;
        this.showHfLogoControls = false;
        console.log('[HEADER_FOOTER] Logo removed');
    }
    isHfLogoPlaceholder(img) {
        return !!img && img.getAttribute('src') === HF_LOGO_DATA_URI;
    }
    handleReplaceHfLogo() {
        this.replaceHeaderFooterImage(this._hfSelectedImage);
    }
    replaceHeaderFooterImage(img) {
        const quill = this.quillInstances?.headerFooterEditor;
        if (!quill || !img) return;
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file) return;
            if (file.size > MAX_LOGO_BYTES) {
                console.warn('[HEADER_FOOTER] Logo rejected, too large:', file.size);
                this.showToast('Error', 'Please choose a logo smaller than 1 MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (this.quillInstances?.headerFooterEditor !== quill || !quill.root.contains(img)) return;
                const width = Number(img.getAttribute('width')) || this.hfLogoWidth || 160;
                img.addEventListener('load', () => {
                    const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
                    this.constrainLogoElement(img, width, ratio);
                    quill.update();
                    this.selectHeaderFooterImage(img);
                    this.updateHeaderFooterOverflowState();
                }, { once: true });
                img.setAttribute('src', reader.result);
                console.log('[HEADER_FOOTER] Logo replaced');
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
    handleHfPlaceholderTypeChange(event) {
        this.hfPlaceholderType = event.detail.value;
    }
    insertHeaderFooterPlaceholder() {
        const quill = this.quillInstances?.headerFooterEditor;
        const type = this.hfPlaceholderType;
        if (!quill || !type) return;
        const option = this.headerFooterPlaceholderOptions.find(item => item.value === type);
        const range = quill.getSelection(true) || { index: Math.max(0, quill.getLength() - 1), length: 0 };
        quill.insertEmbed(
            range.index,
            'placeholder-field',
            this.buildHeaderFooterPlaceholder(type, option?.label || type),
            'user'
        );
        quill.setSelection(range.index + 1, 0, 'silent');
        console.log('[HEADER_FOOTER] Placeholder inserted:', type);
    }
    buildHeaderFooterPlaceholder(type, label) {
        const isDemographicField = DEMOGRAPHIC_FIELD_TYPES.includes(type);
        return {
            id: 'ph-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type,
            label,
            isDemographicField,
            demographicSourceField: type,
            demographicValueMode: isDemographicField ? 'AUTO' : 'HR_MANUAL',
            recipient: '',
            customInlineStyle: true,
            textStyle: {
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '14',
                bold: false,
                italic: false,
                underline: false,
                color: '#000000'
            }
        };
    }
    buildHeaderFooterJson() {
        const config = this.headerFooterConfig || createDefaultHeaderFooterConfig();
        const pages = (config.pages || []).map(page => ({
            header: page?.header || '',
            footer: page?.footer || ''
        }));
        while (pages.length && !pages[pages.length - 1].header && !pages[pages.length - 1].footer) {
            pages.pop();
        }
        const json = {
            version: 1,
            enabled: !!config.enabled,
            mode: config.mode === 'PER_PAGE' ? 'PER_PAGE' : 'SAME_ALL',
            hasHeader: !!config.hasHeader,
            hasFooter: !!config.hasFooter,
            headerHeight: clampNumber(config.headerHeight, 0, MAX_HEADER_HEIGHT, DEFAULT_HEADER_HEIGHT),
            footerHeight: clampNumber(config.footerHeight, 0, MAX_FOOTER_HEIGHT, DEFAULT_FOOTER_HEIGHT),
            common: {
                header: config.common?.header || '',
                footer: config.common?.footer || ''
            },
            pages
        };
        console.log('[TEMPLATE_SAVE] Header/footer prepared', {
            enabled: json.enabled,
            mode: json.mode,
            perPageEntries: json.pages.length
        });
        return json;
    }
    applyHeaderFooterConfig(raw) {
        const config = createDefaultHeaderFooterConfig();
        if (raw && typeof raw === 'object') {
            config.enabled = !!raw.enabled;
            config.mode = raw.mode === 'PER_PAGE' ? 'PER_PAGE' : 'SAME_ALL';
            config.hasHeader = raw.hasHeader !== false;
            config.hasFooter = raw.hasFooter !== false;
            config.headerHeight = clampNumber(raw.headerHeight, 0, MAX_HEADER_HEIGHT, DEFAULT_HEADER_HEIGHT);
            config.footerHeight = clampNumber(raw.footerHeight, 0, MAX_FOOTER_HEIGHT, DEFAULT_FOOTER_HEIGHT);
            config.common = {
                header: raw.common?.header || '',
                footer: raw.common?.footer || ''
            };
            config.pages = Array.isArray(raw.pages)
                ? raw.pages.map(page => ({ header: page?.header || '', footer: page?.footer || '' }))
                : [];
            console.log('[HEADER_FOOTER] Config restored', {
                enabled: config.enabled,
                mode: config.mode,
                perPageEntries: config.pages.length
            });
        } else {
            console.log('[HEADER_FOOTER] Template has no header/footer data - loading as disabled (legacy template)');
        }
        this.headerFooterConfig = config;
        this.selectedHeaderFooterPage = '0';
        this._pendingBandTemplate = null;
        this._hfRevision++;
        this._chromeSignature = '';
    }
    cleanHtmlForSave(html) {
        if (!html) return '';
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const body = doc.body;
            body.querySelectorAll('.table-column-selected').forEach((cell) => {
                cell.classList.remove('table-column-selected');
                if (!cell.getAttribute('class')) {
                    cell.removeAttribute('class');
                }
            });
            body.querySelectorAll('tr[style]').forEach((row) => {
                row.style.transform = '';
                if (!row.getAttribute('style')) {
                    row.removeAttribute('style');
                }
            });
            body.querySelectorAll('tr.table-page-start').forEach((row) => {
                row.classList.remove('table-page-start');
                if (!row.getAttribute('class')) {
                    row.removeAttribute('class');
                }
            });
            Array.from(body.children).forEach((child) => {
                if (child.style.marginTop) {
                    child.style.marginTop = '';
                }
                if (child.style.minHeight) {
                    child.style.minHeight = '';
                }
                if (child.style.marginBottom) {
                    child.style.marginBottom = '';
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
    openTableModal() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('[CREATE_TEMPLATE] Cannot open table modal - Quill not ready');
            return;
        }
        const selection = quill.getSelection() || this._lastKnownRange;
        this._tableSelection = selection ? {
            index: selection.index,
            length: selection.length
        } : null;
        this.tableRows = 3;
        this.tableColumns = 3;
        this.tableHeaderRow = true;
        this.showTableModal = true;
        console.log('[CREATE_TEMPLATE] Table modal opened:', {
            rows: this.tableRows, columns: this.tableColumns, selection: this._tableSelection
        });
    }
    handleTableRowsChange(event) {
        const value = parseInt(event.target.value, 10);
        this.tableRows = Number.isFinite(value) ? Math.max(1, Math.min(20, value)) : 1;
    }
    handleTableColumnsChange(event) {
        const value = parseInt(event.target.value, 10);
        this.tableColumns = Number.isFinite(value) ? Math.max(1, Math.min(20, value)) : 1;
    }
    closeTableModal() {
        this.showTableModal = false;
    }
    confirmTableInsert() {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('[CREATE_TEMPLATE] Cannot insert table - Quill not ready');
            return;
        }
        const tableModule = quill.getModule('table');
        if (!tableModule || typeof tableModule.insertTable !== 'function') {
            console.error('[CREATE_TEMPLATE] Quill table module is not available');
            this.showToast('Error', 'Table functionality is not available in the editor.', 'error');
            return;
        }
        const range = this._tableSelection || quill.getSelection() || this._lastKnownRange;
        if (range) {
            quill.setSelection(range.index, range.length, 'silent');
        }
        console.log('[CREATE_TEMPLATE] Inserting table:', { rows: this.tableRows, columns: this.tableColumns, selection: range });
        tableModule.insertTable(this.tableRows, this.tableColumns);
        this.showTableModal = false;
        requestAnimationFrame(() => {
            this.repaginate();
            console.log('[CREATE_TEMPLATE] Table inserted successfully');
        });
    }
    handleEditorTableClick(event) {
        this.clearTableColumnSelection();
        const cell = event.target.closest('td, th');
        if (!cell) {
            this.showTableActions = false;
            return;
        }
        const rect = cell.closest('table')?.getBoundingClientRect();
        if (!rect) return;
        this.showTableActions = true;
        const wrapper = this.template.querySelector('.rich-text-editor-wrapper');
        if (!wrapper) return;
        const wrapperRect = wrapper.getBoundingClientRect();
        let top = rect.top - wrapperRect.top - 42;
        let left = rect.left - wrapperRect.left;
        if (top < 5) {
            top = rect.bottom - wrapperRect.top + 8;
        }
        this.tableActionsStyle = `top:${top}px;left:${Math.max(5, left)}px;`;
    }
    handleTableMouseMove(event) {
        const cell = event.target.closest('td, th');
        if (!cell) {
            if (this.showTableColumnSelector) {
                return;
            }
            this.showTableRowPlus = false;
            this.showTableColumnPlus = false;
            this.showTableColumnSelector = false;
            return;
        }
        const row = cell.closest('tr');
        const table = cell.closest('table');
        if (!row || !table) {
            this.showTableRowPlus = false;
            this.showTableColumnPlus = false;
            this.showTableColumnSelector = false;
            return;
        }
        const wrapper = this.template.querySelector('.rich-text-editor-wrapper');
        if (!wrapper) return;
        const wrapperRect = wrapper.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();
        const distanceFromRowBottom = Math.abs(event.clientY - rowRect.bottom);
        if (distanceFromRowBottom <= 8) {
            this.showTableRowPlus = true;
            this.showTableColumnPlus = false;
            this.showTableColumnSelector = false;
            this.tableRowTarget = row;
            this.tableRowPlusStyle = `top:${rowRect.bottom - wrapperRect.top - 10}px;left:${tableRect.left - wrapperRect.left - 18}px;`;
            return;
        }
        const distanceFromColumnRight = Math.abs(event.clientX - cellRect.right);
        if (distanceFromColumnRight <= 8) {
            this.showTableRowPlus = false;
            this.showTableColumnPlus = true;
            this.showTableColumnSelector = false;
            this.tableColumnTarget = cell;
            const columnPlusOffset = this.getRowTranslateY(row);
            this.tableColumnPlusStyle = `top:${tableRect.top - wrapperRect.top - 18 + columnPlusOffset}px;left:${cellRect.right - wrapperRect.left - 10}px;`;
            return;
        }
        const distanceFromTableTop = Math.abs(event.clientY - tableRect.top);
        if (distanceFromTableTop <= 15) {
            this.showTableRowPlus = false;
            this.showTableColumnPlus = false;
            this.showTableColumnSelector = true;
            this.tableSelectedColumn = cell.cellIndex;
            this.tableColumnSelectorTarget = cell;
            this.tableColumnSelectorStyle = `top:${tableRect.top - wrapperRect.top - 22}px;left:${cellRect.left - wrapperRect.left + (cellRect.width / 2) - 10}px;`;
            return;
        }
        this.showTableRowPlus = false;
        this.showTableColumnPlus = false;
        this.showTableColumnSelector = false;
    }
    handleAddTableRow(event) {
        event.preventDefault();
        event.stopPropagation();
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('[CREATE_TEMPLATE] Quill not ready');
            return;
        }
        const row = this.tableRowTarget;
        if (!row) {
            console.warn('[CREATE_TEMPLATE] No row target found');
            return;
        }
        const table = row.closest('table');
        if (!table) {
            console.warn('[CREATE_TEMPLATE] No table found for row');
            return;
        }
        const cell = row.querySelector('td, th');
        if (!cell) {
            console.warn('[CREATE_TEMPLATE] No cell found in row');
            return;
        }
        const cellBlot = window.Quill?.find(cell);
        if (!cellBlot) {
            console.warn('[CREATE_TEMPLATE] Could not resolve row cell');
            return;
        }
        try {
            quill.setSelection(quill.getIndex(cellBlot), 0, 'silent');
            const tableModule = quill.getModule('table');
            if (!tableModule || typeof tableModule.insertRowBelow !== 'function') {
                console.error('[CREATE_TEMPLATE] Table row insertion is not supported');
                return;
            }
            tableModule.insertRowBelow();
            console.log('[CREATE_TEMPLATE] Row added successfully');
            this.showTableRowPlus = false;
            this.tableRowTarget = null;
            requestAnimationFrame(() => {
                this.repaginate();
            });
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Failed to add row:', error);
        }
    }
    handleAddTableColumn(event) {
        event.preventDefault();
        event.stopPropagation();
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) {
            console.warn('[CREATE_TEMPLATE] Quill not ready');
            return;
        }
        const tableModule = quill.getModule('table');
        if (!tableModule) {
            console.error('[CREATE_TEMPLATE] Table module not available');
            return;
        }
        try {
            tableModule.insertColumnRight();
            console.log('[CREATE_TEMPLATE] Column added successfully');
            this.showTableColumnPlus = false;
            requestAnimationFrame(() => {
                this.repaginate();
            });
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Failed to add column:', error);
        }
    }
    handleTableKeyDown(event) {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill) return;
        if (this.selectedTableElement && this.selectedTableColumnIndex !== null) {
            if (event.key !== 'Backspace' && event.key !== 'Delete') {
                this.clearTableColumnSelection();
            } else {
                event.preventDefault();
                event.stopPropagation();
                const table = this.selectedTableElement;
                const columnIndex = this.selectedTableColumnIndex;
                const rows = table.querySelectorAll('tr');
                if (!rows.length) {
                    this.clearTableColumnSelection();
                    return;
                }
                const tableModule = quill.getModule('table');
                if (!tableModule || typeof tableModule.deleteColumn !== 'function') {
                    console.error('[CREATE_TEMPLATE] Table column deletion is not supported');
                    return;
                }
                try {
                    if (!this.focusTableColumn(table, columnIndex)) {
                        console.warn('[CREATE_TEMPLATE] Could not resolve the selected column');
                        return;
                    }
                    tableModule.deleteColumn();
                    this.clearTableColumnSelection();
                    this.richTextContent = quill.root.innerHTML;
                    console.log('[CREATE_TEMPLATE] Column deleted successfully');
                    requestAnimationFrame(() => {
                        this.repaginate();
                    });
                } catch (error) {
                    console.error('[CREATE_TEMPLATE] Failed to delete column:', error);
                }
                return;
            }
        }
        const selection = quill.getSelection();
        if (!selection) return;
        const [line] = quill.getLine(selection.index);
        if (!line || !line.domNode) return;
        const cell = line.domNode.closest('td, th');
        if (!cell) return;
        const row = cell.closest('tr');
        const table = cell.closest('table');
        if (!row || !table) return;
        if (event.key === 'Tab' && !event.shiftKey) {
            const cells = Array.from(row.children);
            const rows = Array.from(table.querySelectorAll('tr'));
            if (cells[cells.length - 1] !== cell || rows[rows.length - 1] !== row) return;
            event.preventDefault();
            event.stopPropagation();
            this.appendTableRowFromTab(table, row);
            return;
        }
        if (selection.length > 0) return;
        if (event.key !== 'Backspace' && event.key !== 'Delete') return;
        const rowText = (row.textContent || '').replace(/\uFEFF/g, '').trim();
        if (rowText) return;
        event.preventDefault();
        event.stopPropagation();
        const rows = table.querySelectorAll('tr');
        if (rows.length <= 1) {
            const tableModule = quill.getModule('table');
            if (!tableModule || typeof tableModule.deleteTable !== 'function') {
                console.error('[CREATE_TEMPLATE] Table deletion is not supported');
                return;
            }
            try {
                tableModule.deleteTable();
                this.showTableColumnSelector = false;
                this.tableColumnSelectorTarget = null;
                this.tableColumnSelectorStyle = '';
                console.log('[CREATE_TEMPLATE] Last row deleted - table removed');
                requestAnimationFrame(() => {
                    this.repaginate();
                });
            } catch (error) {
                console.error('[CREATE_TEMPLATE] Failed to delete table:', error);
            }
            return;
        }
        const tableModule = quill.getModule('table');
        if (!tableModule || typeof tableModule.deleteRow !== 'function') {
            console.error('[CREATE_TEMPLATE] Table row deletion is not supported');
            return;
        }
        try {
            tableModule.deleteRow();
            this.showTableColumnSelector = false;
            this.tableColumnSelectorTarget = null;
            this.tableColumnSelectorStyle = '';
            console.log('[CREATE_TEMPLATE] Row deleted successfully');
            requestAnimationFrame(() => {
                this.repaginate();
            });
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Failed to delete row:', error);
        }
    }
    appendTableRowFromTab(table, row) {
        const quill = this.quillInstances?.richTextEditor;
        const tableModule = quill?.getModule('table');
        if (!tableModule || typeof tableModule.insertRowBelow !== 'function') {
            console.error('[CREATE_TEMPLATE] Table row insertion is not supported');
            return;
        }
        try {
            tableModule.insertRowBelow();
            const rows = Array.from(table.querySelectorAll('tr'));
            const newRow = rows[rows.length - 1];
            if (newRow && newRow !== row) {
                this.focusTableCell(newRow.children[0]);
            }
            console.log('[CREATE_TEMPLATE] Tab added a new row');
            requestAnimationFrame(() => {
                this.repaginate();
            });
        } catch (error) {
            console.error('[CREATE_TEMPLATE] Failed to add row with Tab:', error);
        }
    }
    focusTableCell(cell) {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill || !window.Quill || !cell) return false;
        const cellBlot = window.Quill.find(cell);
        if (!cellBlot) return false;
        quill.setSelection(quill.getIndex(cellBlot), 0, 'silent');
        return true;
    }
    handleSelectTableColumn(event) {
        event.preventDefault();
        event.stopPropagation();
        const cell = this.tableColumnSelectorTarget;
        if (!cell) {
            console.log('[CREATE_TEMPLATE] No column target found');
            return;
        }
        const table = cell.closest('table');
        if (!table) {
            console.log('[CREATE_TEMPLATE] No table found');
            return;
        }
        const columnIndex = cell.cellIndex;
        table.querySelectorAll('td, th').forEach(tableCell => {
            tableCell.classList.remove('table-column-selected');
        });
        table.querySelectorAll('tr').forEach(row => {
            const cells = row.children;
            if (cells[columnIndex]) {
                cells[columnIndex].classList.add('table-column-selected');
            }
        });
        this.selectedTableColumnIndex = columnIndex;
        this.selectedTableElement = table;
        this.showTableColumnSelector = false;
        this.focusTableColumn(table, columnIndex);
        console.log('[CREATE_TEMPLATE] Column selected:', columnIndex);
    }
    focusTableColumn(table, columnIndex) {
        const quill = this.quillInstances?.richTextEditor;
        if (!quill || !window.Quill || !table) return false;
        const rows = table.querySelectorAll('tr');
        const cellNode = rows[0]?.children[columnIndex];
        if (!cellNode) return false;
        const cellBlot = window.Quill.find(cellNode);
        if (!cellBlot) return false;
        quill.setSelection(quill.getIndex(cellBlot), 0, 'silent');
        return true;
    }
    clearTableColumnSelection() {
        if (this.selectedTableElement) {
            this.selectedTableElement
                .querySelectorAll('.table-column-selected')
                .forEach(cell => cell.classList.remove('table-column-selected'));
        }
        this.selectedTableColumnIndex = null;
        this.selectedTableElement = null;
        this.tableColumnSelectorTarget = null;
    }
}