import { LightningElement, track, api, wire } from "lwc";
import pdfjsLib from "@salesforce/resourceUrl/pdfJS";
import pdfWorker from "@salesforce/resourceUrl/pdfWorker";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import saveTemplateData from "@salesforce/apex/myTemplates.saveTemplateData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import updateRecordWithAWSUrl from "@salesforce/apex/TemplateController.updateRecordWithAWSUrl";
import mammothJs from "@salesforce/resourceUrl/mammothJs";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import html2canvasLib from "@salesforce/resourceUrl/html2canvas";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import fetchTemplateData from '@salesforce/apex/myTemplates.fetchTemplateData';
import TeSignLogo from '@salesforce/resourceUrl/Te_sign';

import getRecipientDemographicDetails from '@salesforce/apex/myTemplates.getRecipientDemographicDetails';
import storePdfRecord from '@salesforce/apex/myTemplates.storePdfRecord';
import saveCustomFieldConfig from '@salesforce/apex/myTemplates.saveCustomFieldConfig';
import removeCustomFieldConfig from '@salesforce/apex/myTemplates.removeCustomFieldConfig';
import getCustomFieldConfig from '@salesforce/apex/myTemplates.getCustomFieldConfig';
import adobeFonts from '@salesforce/resourceUrl/AdobeFonts';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

const PLACEHOLDER_W_DEFAULT = 240;
const PLACEHOLDER_H_DEFAULT = 44;
const AUTO_SHIFT_STEP = 8;
const MAX_SHIFT_STEPS = 200;
const GUTTER_X = 4;
const GUTTER_Y = 4;

const AWS_BASE = 'https://tesseractapps.com';
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};


export default class TesseractappstemplatesLwc extends LightningElement {

     @track selectedFilesToUpload = [];
     @track fileName = '';
     @track fileType = '';
     @track fileSize = 0;
     @track fileuploaded = false;
     @track isFileExpand = false;
     @track isFileExpand1 = false;
     @track showSpinner = false;
     @track uploadedFiles = [];
     @api currentPage = 1; // Current page for pagination
     @api totalPages = 0; // Total number of pages in the PDF
     @api orgid;
     @track placeholders = [];
     @track imageSrc = "";
     @track imageSrcs = [];
     @track isLoading = false;
     @track draggedType = null;
     @track currentDraggedPlaceholder = null;
     @track newPlaceholder = null;
     @track isFileUploaded=false;
     isPlaceholderDragging = false;
     dragStartX = 0;
     dragStartY = 0;
     logo = TeSignLogo;

     @track pdfUrl;
    @track placeholderJson;
    @track templateRecordId = null;
    @track templateStatus = 'Draft';
    @track isSidebarOpen = false;

      isLibraryLoaded = false;
    @track currentPreviewPage = 1;
    @track totalPreviewPages = 0;
    @track isFirstPreviewPage = true;
    @track isLastPreviewPage = true;
    @track currentPreviewImageSrc = '';
    @api confirmationPopupPages = [];
    @track isSignatureModalVisible = false;
    @track isDrawingModalVisible = false;
    @track isPreviewModalVisible = false;
    @track showSuccessScreen = false;
    @track isAlreadySubmitted = false;
    @track isLinkExpired = false;
    @track showFailureScreen = false;
    @track isattachError = false;
    @track showSpinner = false;
    @track isDrawing = false;
    @track canvasContext;
    placeholderId;
    @track isSignatureModalVisible = false;
    @track isNameSignatureModalVisible = false;
    @track styledPreviews = [];
    @track selectedStyle = null;
    @track enteredName = '';
    @track canvas;
    @track context;
    @track viewport;
      placeholdersByPage = {};
 @track isLoadingpop = false;
 @track documentName = '';


    _pagePt = null;
    _pageDimensionsCache = new Map();
    _savingInProgress = false;
    _activeFlow = null;
    _wordConversionHandled = false;
    _wordUploadCompleteHandler = null;
     file; //holding file instance
    myFile;
    fileReaderObj;
    base64FileData;
    pdfDoc = null; // PDF document reference
    pdfLoaded = false;
    

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    get containerStyle() {
        if (this._pagePt && this._pagePt.w > 0 && this._pagePt.h > 0) {
            const height = Math.round(1024 * (this._pagePt.h / this._pagePt.w));
            return `width: 1024px; height: ${height}px; min-height: ${height}px;`;
        }
        return 'width: 1024px; height: 1448px; min-height: 1448px;';
    }

      get showTextStylePanel() {
    // Only show for non-signature placeholders
    return this.newPlaceholder && !this.newPlaceholder.isSignature;
  }

    // Filter placeholders by page
    get placeholdersForCurrentPage() {
        return this.placeholders.filter(
            p => p.page === this.currentPage
        );
    }
    @api selectedTemplate;

@track isViewMode = false;

    _resizing = false;
    _resizeStartWidth = 0;
    _resizeStartX = 0;
    _currentResizingPlaceholder = null;
    _boundResizeMove;
    _boundResizeEnd;

@track senddocumenteditor = false;

connectedCallback() {
    console.log('orgid---->', this.orgid);
    this.loadPdfLibraries();
    this.sessionGuid = this.generateGUID();

    this.isFileUploaded = false;
    this.templateRecordId = null;
    this.isViewMode = false;
    this.sendDocumentForm = {};

    orgDetails()
        .then((response) => {
            this.usertype = response.Type_of_User__c;
            console.log('User Type:', this.usertype);
        })
        .catch((error) => {
            console.error('Error fetching org details', error);
        });

    if (!this.selectedTemplate) {
        return;
    }

    try {
        const data = JSON.parse(this.selectedTemplate);
        console.log('selectedTemplate payload:', data);

        this.senddocumenteditor = data.senddocumenteditor === true;
        this.sendDocumentForm = data.sendDocumentForm
            ? { ...data.sendDocumentForm }
            : {};

        console.log('[AUTO-FILL] child sendDocumentForm:', JSON.stringify(this.sendDocumentForm));

        if (this.senddocumenteditor) {
            this.templateRecordId = data.templateId || null;
            this.isViewMode = false;
            this.fetchRecordData();
            return;
        }

        if (data.isReadOnly) {
            this.pdfUrl = data.url || null;
            this.placeholderJson = data.placeholders || null;
            this.templateRecordId = data.templateId || null;
            this.initializeViewMode();
            return;
        }

        if (data.templateId) {
            this.pdfUrl = data.url || null;
            this.placeholderJson = data.placeholders || null;
            this.templateRecordId = data.templateId || null;
            this.templateName = data.name || '';
            this.description = data.description || '';
            this.templateType = data.type || '';
            this.templateStatus = data.status || 'Draft';
            this.initializeEditMode();
            return;
        }

    } catch (e) {
        console.error('Invalid selectedTemplate JSON', e);
        this.isFileUploaded = false;
        this.templateRecordId = null;
        this.isViewMode = false;
        this.sendDocumentForm = {};
    }

}

async fetchRecordData() {
    if (!this.templateRecordId) {
        this.showToast('Error', 'Template record Id is missing.', 'error');
        return;
    }

    this.isLoading = true;

    try {
        const data = await fetchTemplateData({ templateId: this.templateRecordId });

        if (!data) {
            this.showToast('Error', 'Template record not found.', 'error');
            return;
        }

        console.log('Template record fetched:', JSON.stringify(data));

        this.templateRecordId = data.Id;
        this.pdfUrl = data.Amazon_Url__c || null;
        this.placeholderJson = data.Placeholder_JSON__c || null;
        this.templateName = data.Template_Name__c || data.File_Name__c || '';
        this.description = data.Description__c || '';
        this.templateType = data.Template_Type__c || '';
        this.templateStatus = data.Status__c || 'Draft';
        this.fileName = data.File_Name__c || '';
        this.url = data.Amazon_Url__c || null;
        this.key = data.Key__c || null;
        this.isViewMode = false;
        this.isFileUploaded = true;
        this.originalPdfReference = data.Amazon_Url__c;

        try {
            this.placeholders = this.placeholderJson
                ? JSON.parse(this.placeholderJson).map(p => this.normalizePlaceholderForStyles(p))
                : [];
            console.log('Parsed placeholders:', this.placeholders);
        } catch (e) {
            console.error('Invalid placeholder JSON', e);
            this.placeholders = [];
            this.showToast('Error', 'Failed to parse placeholder JSON.', 'error');
            return;
        }
        

        if (this.pdfUrl) {
            await this.loadPdf(this.pdfUrl);
             await this.tryAutofillAfterLoad();
        } else {
            this.showToast('Error', 'Template PDF URL is missing.', 'error');
        }
    } catch (error) {
        console.error('Error fetching template record:', error);
        this.showToast(
            'Error',
            error?.body?.message || error?.message || 'Failed to fetch template record.',
            'error'
        );
    } finally {
        this.isLoading = false;
    }
}

initializeViewMode() {
    try {
        this.placeholders = this.placeholderJson
            ? JSON.parse(this.placeholderJson).map(p => this.normalizePlaceholderForStyles(p))
            : [];

        console.log('View Mode placeholders:', this.placeholders);

        this.isViewMode     = true;
        this.isFileUploaded = true;
        this.loadPdf(this.pdfUrl);

    } catch (e) {
        console.error('Invalid placeholder JSON', e);
        this.placeholders   = [];
        this.isFileUploaded = false;
    }
}

// async initializeEditMode() {
//     try { // Load actual dropped placeholders only
//         this.placeholders = this.placeholderJson
//             ? JSON.parse(this.placeholderJson).map(p => this.normalizePlaceholderForStyles(p))
//             : [];
//         console.log('📌 Loaded template placeholders:', JSON.parse(JSON.stringify(this.placeholders)));
//         // Load available custom field definitions (sidebar only)
//         try {
//             const customConfig = await getCustomFieldConfig({orgId: this.orgid});
//             console.log('📌 Raw custom field config:', customConfig);
//             if (customConfig) {
//                 this.customFields = JSON.parse(customConfig).map(field => ({
//                     id: Date.now() + Math.random(),
//                     label: field.label,
//                     type: `Custom_${
//                         field.type
//                     }_${
//                         field.label.replace(/\s+/g, '_')
//                     }`
//                 }));
//             } else {
//                 this.customFields = [];
//             }
//             console.log('📌 Sidebar custom fields:', JSON.parse(JSON.stringify(this.customFields)));
//         } catch (error) {
//             console.error('❌ Failed loading custom field config:', error);
//             this.customFields = [];
//         }
//         // DO NOT append customFields into placeholders
//         console.log('✅ Final placeholders (render only):', JSON.parse(JSON.stringify(this.placeholders)));
//         this.isViewMode = false;
//         this.url = this.pdfUrl;
//         this.fileName = this.pdfUrl
//             ? this
//                 .pdfUrl
//                 .split('/')
//                 .pop()
//                 .split('?')[0]
//             : '';
//         this.isFileUploaded = true;
//         console.log('📄 Loading PDF:', this.url);
//         await this.loadPdf(this.pdfUrl);
//         console.log('Edit Mode — templateRecordId:', this.templateRecordId);
//         console.log('Edit Mode — templateName:', this.templateName);
//         console.log('Edit Mode — description:', this.description);
//         console.log('Edit Mode — templateType:', this.templateType);
//         console.log('✅ initializeEditMode completed');
//     } catch (e) {
//         console.error('❌ Invalid placeholder JSON in edit mode', e);
//         this.placeholders = [];
//         this.customFields = [];
//         this.isFileUploaded = false;
//     }
// }

async initializeEditMode() {
    try {
        this.placeholders = this.placeholderJson
            ? JSON.parse(this.placeholderJson).map(p => this.normalizePlaceholderForStyles(p))
            : [];
        console.log('📌 Loaded placeholders:', JSON.parse(JSON.stringify(this.placeholders)));
        this.isViewMode = false;
        this.url = this.pdfUrl;
        this.fileName = this.pdfUrl ? this.pdfUrl.split('/').pop().split('?')[0] : '';
        this.isFileUploaded = true;
        console.log('📄 Loading PDF:', this.url);
        await this.loadPdf(this.pdfUrl);
        console.log('Edit Mode loaded');
    }
    catch(e) {
        console.error('❌ initializeEditMode failed', e);
        this.placeholders = [];
        this.customFields = [];
        this.isFileUploaded = false;
    }
}


async loadCustomFields() {
    try {
        console.group('📌 [loadCustomFields]');
        const customConfig = await getCustomFieldConfig({orgId: this.orgid});
        console.log('Raw config:', customConfig);
        if (customConfig) {
            this.customFields = JSON.parse(customConfig).map(field => ({
                id: Date.now() + Math.random(),
                label: field.label,
                type: `Custom_${
                    field.type
                }_${
                    field.label.replace(/\s+/g, '_')
                }`
            }));
        } else {
            this.customFields = [];
        }
        console.log('Loaded custom fields:', JSON.parse(JSON.stringify(this.customFields)));
        console.groupEnd();
    } catch (error) {
        console.error('❌ loadCustomFields failed:', error);
        this.customFields = [];
        console.groupEnd();
    }
}


async loadPdfLibraries() {
    try {
        await Promise.all([
            loadScript(this, pdfjsLib),
            loadScript(this, pdfWorker),
            loadScript(this, mammothJs),
            loadScript(this, jsPDF),
            loadScript(this, html2canvasLib),
            loadStyle(this, adobeFonts).catch(error => console.error('Failed to load fonts:', error))
        ]);
        window
            .pdfjsLib
            .GlobalWorkerOptions
            .workerSrc = pdfWorker;
        if (!mammothJs) {
            throw new Error('Mammoth.js is not available.');
        }
        console.log('Mammoth.js loaded successfully.');
        console.log('Mammoth.js:', mammothJs);
        console.log('jsPDF, html2canvas and fonts loaded successfully.');
    } catch (error) {
        throw new Error('Error while loading libraries: ' + error.message);
    }
}


    async  onFileUpload(event) {
    /*  this.isattachError = false;

    this.tsignReurl = "";
    this.serviceId = "";
    this.quoteId = null;
    this.source = null;

    this.mode = "DEFAULT"; */

       /*  if (this.fileuploaded) {
            this.showToast("Error", "Only one file can be uploaded at a time.", "error");
            event.target.value = null;
            return;
        } */

        if (event.target.files.length > 0) {
        this.showSpinner = true;
        this.selectedFilesToUpload = event.target.files;
        this.file = this.selectedFilesToUpload[0];
        this.fileName = this.file.name.replace(/\s+/g, "");
        this.fileType = this.file.type;
        this.fileSize = this.file.size;

        let MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB for PDF
        let MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB for DOC/DOCX

        if (this.fileType === 'application/pdf') {
            if (this.fileSize > MAX_PDF_SIZE) {
                this.showToast("Error", "PDF file size must be 10MB or smaller.", "error");
                this.showSpinner = false;
                this.isLoading = false;
                event.target.value = null;
                return;
            }
        } else if (this.fileType === 'application/msword' || this.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            if (this.fileSize > MAX_DOC_SIZE) {
                this.showToast("Error", "Word document size must be 10MB or smaller.", "error");
                this.showSpinner = false;
                this.isLoading = false;
                event.target.value = null;
                return;
            }
        }


        // ✅ Check if the file is a PDF or Word document
        if (this.fileType === "application/pdf") {
            console.log("📌 Processing PDF file:", this.fileName);
        // this.processPdfFile(); // ✅ Process PDF
            this.handleFileUploadInputChange(event);
            this.fileuploaded=true;
        } else if (
            this.fileType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || this.fileType === "application/msword"
        ) {
            this.isLoading = true;
            this.fileuploaded=false;
            console.log("📌 Processing Word file:", this.fileName);
            this.isFileExpand1 = true;

            await Promise.resolve();
            this.convertWordToPdf(); // ✅ Convert Word to PDF
        // this.handleFileUploadInputChange(event);
        } else {
            this.showToast(
            "Error",
            "Only PDF and Word files are allowed.",
            "error"
            );
            this.showSpinner = false;
            this.isLoading = false;
            return;
        }
        }

        this.showSpinner = false;
        event.target.value = null;
        console.log("📌 File Uploaded:", this.fileName);
    }

    
      handleFileUploadInputChange(event) {
            console.log('handleFileUploadInputChange called ');
    
            const files = Array.from(event.target.files || []);
             if (!files.length) return;
    
            setTimeout(() => {
                this.isFileExpand = true;
    
                // Now child will definitely be rendered — wait for that
                setTimeout(() => {
                    const svc = this.template.querySelector('c-document-office-service');
                    if (!svc) {
                        console.warn('⚠️ No <c-document-office-service> component found.');
                        return;
                    }
    
                    svc.incomingFiles = files;
                    //event.target.value = '';
                }, 1000);
            }, 0); // delay can be adjusted if needed
    
        }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant 
        }); 
        this.dispatchEvent(event); 
    } 
 generateGUID() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async logAuditDataWithIP() {
    let ip = 'Unavailable';
    let location = 'Unavailable';

    // 🔹 Get IP
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        ip = data.ip;
    } catch (e) {
        console.warn('IP fetch failed', e);
    }

    // 🔹 Get Geolocation (wrapped in Promise for async/await consistency)
    if (navigator.geolocation) {
        try {
            location = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        });
                    },
                    (err) => {
                        console.warn('Geolocation denied or failed:', err.message);
                        resolve('Unavailable');
                    },
                    { timeout: 5000 }
                );
            });
        } catch (e) {
            location = 'Unavailable';
        }
    }

    return this.buildAuditPayload(ip, location);
}

buildAuditPayload(ip, location) {
    const nav = window.navigator;

    const auditData = {
        sessionGuid: this.sessionGuid, // ✅ NEW
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        location: location,
        userAgent: nav.userAgent,
        platform: nav.platform,
        language: nav.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: nav.cookieEnabled,
        onlineStatus: nav.onLine
    };

    console.log('🔍 TSign Audit Data:', JSON.stringify(auditData, null, 2));

    return JSON.stringify(auditData); // ✅ Ready for Apex
}
     
    handleAwsUploadComplete(evt) {
    try {
        // ✅ If Word→PDF flow is active, ignore AWS uploadcomplete to prevent double record creation
        if (this._activeFlow === "WORD_CONVERT") {
        console.warn("⛔ Ignoring AWS Upload Complete because WORD_CONVERT flow is active.");
        return;
        }

        // ✅ Mark this as the active flow (does not change existing behavior)
        this._activeFlow = "AWS_UPLOAD";

        console.group('[AWS Upload Complete]');
        console.log('Raw event detail:', evt?.detail);

        const { recordId, files = [] } = evt.detail || {};
        console.log('recordId:', recordId);
        console.log('files count:', files.length, 'files:', files);

        if (!files.length) {
        console.warn('No uploaded files in payload; aborting.');
        console.groupEnd();
        return;
        }

        this.uploadedFiles = files;
        this.isFileExpand = false;
        this.fileuploaded = false;

        const file = files[0];

        // ✅ Normalize URL
        let resolvedUrl = "";
        if (typeof file?.url === "string") {
        resolvedUrl = file.url;
        } else if (typeof file?.url?.pdfUrl === "string") {
        resolvedUrl = file.url.pdfUrl;
        } else if (typeof file?.pdfUrl === "string") {
        resolvedUrl = file.pdfUrl;
        }

        // ✅ Normalize key
        let resolvedKey =
        file?.key ||
        file?.url?.pdfKey ||
        file?.pdfKey ||
        null;

        this.fileName = file?.originalName || this.fileName;
        this.url = resolvedUrl;
        this.key = resolvedKey;

        console.log("✅ Resolved URL:", this.url);
        console.log("✅ Resolved KEY:", this.key);

        if (!this.url || typeof this.url !== "string") {
        this.showToast("Error", "Uploaded file URL is invalid.", "error");
        console.groupEnd();
        return;
        }

        

       /*  this.handleSaveAndUpload(); */
        this.isFileUploaded = true;
        this.loadPdf(this.url);
        this.isFileAttached = true;

        console.log(' Files in last  : ', files);
        console.log(' this.uploadedFiles  : ', JSON.stringify(this.uploadedFiles));
        console.groupEnd();
    } catch (e) {
        console.error('[AWS Upload Complete] handler error:', e);
    }
    }


    // async loadPdf(url) {
    // console.group("📄 [loadPdf]");
    // console.log("➡️ called with url:", url);

    // try {
    //     if (!url || typeof url !== "string") {
    //     console.error("❌ Invalid URL passed to loadPdf:", url);
    //     this.handleError("Failed to load PDF. Invalid URL.", new Error("Invalid URL"));
    //     console.groupEnd();
    //     return;
    //     }

    //     if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
    //     console.error("❌ pdfjsLib is not available on window:", window.pdfjsLib);
    //     this.handleError("Failed to load PDF. pdfjsLib missing.", new Error("pdfjsLib missing"));
    //     console.groupEnd();
    //     return;
    //     }

    //     this.showSpinner = true;
    //     this.isLoading = true;

    //     console.log("📌 Starting pdfjsLib.getDocument...");
    //     const loadingTask = window.pdfjsLib.getDocument(url);

    //     // Helpful hooks if pdf.js exposes these
    //     if (loadingTask?.onProgress) {
    //     loadingTask.onProgress = (p) => {
    //         console.log("⏳ PDF load progress:", p);
    //     };
    //     }

    //     this.pdfDoc = await loadingTask.promise;
    //     console.log("✅ PDF loaded. pdfDoc:", this.pdfDoc);

    //     this.totalPages = this.pdfDoc.numPages;
    //     this.currentPage = 1;

    //     console.log("📌 totalPages:", this.totalPages, "| currentPage:", this.currentPage);
    //     console.log("📌 Rendering first page as image...");
    //     await this.renderPageAsImage(this.currentPage);

    //     await this.loadCustomFields();

    //     console.log(
    //         '✅ Custom fields loaded'
    //     );

    //     console.log("✅ loadPdf completed. imageSrc length:", this.imageSrc ? this.imageSrc.length : 0);
    //     console.groupEnd();
    // } catch (error) {
    //     console.error("❌ loadPdf error:", error);
    //     this.handleError("Failed to load PDF.", error);
    //     console.groupEnd();
    // } finally {
    //     // ensure spinners stop even if render throws
    //     this.showSpinner = false;
    //     this.isLoading = false;
    // }
    // }

    // async renderPageAsImage(pageNumber) {
    // console.group(`🖼️ [renderPageAsImage] page=${pageNumber}`);
    // try {
    //     if (!this.pdfDoc) {
    //     console.error("❌ pdfDoc is null/undefined. loadPdf may have failed.");
    //     throw new Error("pdfDoc is not initialized");
    //     }

    //     console.log("📌 Getting page:", pageNumber);
    //     const page = await this.pdfDoc.getPage(pageNumber);
    //     console.log("✅ Got page object:", page);

    //     const vp1 = page.getViewport({ scale: 1 });
    //     this._pagePt = { w: vp1.width, h: vp1.height };
    //     console.log("📌 Page size (pt):", this._pagePt);

    //     const canvas = document.createElement("canvas");
    //     const context = canvas.getContext("2d");

    //     const viewport = page.getViewport({ scale: 3.0 });
    //     canvas.height = viewport.height;
    //     canvas.width = viewport.width;

    //     console.log("📌 Canvas size:", { w: canvas.width, h: canvas.height });
    //     console.log("📌 Rendering page to canvas...");
    //     const renderTask = page.render({ canvasContext: context, viewport });

    //     if (renderTask?.onContinue) {
    //     console.log("ℹ️ renderTask has onContinue");
    //     }

    //     await renderTask.promise;
    //     console.log("✅ Page rendered to canvas.");

    //     console.log("📌 Converting canvas to dataURL...");
    //     const dataUrl = canvas.toDataURL("image/png");
    //     console.log("✅ dataUrl generated. length:", dataUrl.length);

    //     console.log("📌 Preloading image to validate dataUrl...");
    //     await new Promise((resolve, reject) => {
    //     const img = new Image();
    //     img.onload = () => {
    //         console.log("✅ Image preload success. natural:", img.naturalWidth, img.naturalHeight);
    //         resolve();
    //     };
    //     img.onerror = (e) => {
    //         console.error("❌ Image preload failed:", e);
    //         reject(new Error("Image preload failed"));
    //     };
    //     img.src = dataUrl;
    //     });

    //     // Bind to template
    //     this.imageSrc = dataUrl;
    //     console.log("✅ imageSrc set. length:", this.imageSrc.length);
    //      this.isLoading = false;
    //     console.groupEnd();
    // } catch (error) {
    //     console.error(`❌ renderPageAsImage error (page ${pageNumber}):`, error);
    //     this.handleError(`Failed to render page ${pageNumber}.`, error);
    //     console.groupEnd();
    //     throw error; // propagate error
    // }
    // }

    


  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }
  get isPaginationVisible() {
    return this.totalPages > 1;
  }

  get isFirstPage() {
    return this.currentPage === 1;
  }

  get isLastPage() {
    return this.currentPage === this.totalPages;
  }

  showPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPageAsImage(this.currentPage);
    }
  }

  showNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPageAsImage(this.currentPage);
    }
  }

  handleError(message, error) {
    console.error(message, error);
    this.errorMessage = `${message} ${error ? ": " + error.message : ""}`;
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: this.errorMessage,
        variant: "error"
      })
    );
  }

  displayImage(imageDataUrl) {
    this.imageSrc = imageDataUrl; 
  }

  async convertWordToPdf() {
  try {
    // ✅ mark flow + reset one-time handler guard (prevents duplicate record creation)
    this._activeFlow = "WORD_CONVERT";
    this._wordConversionHandled = false;

    this.showSpinner = true;

    const files = [this.file];
    const svc = this.template.querySelector("c-convert-word-to-pdf-lwc");

    if (!svc) {
      this.showToast("Error", "Conversion service not found.", "error");
      this.showSpinner = false;
      await new Promise((r) => setTimeout(r, 300));
      return;
    }

    // ✅ Prevent multiple uploadcomplete handlers being attached across uploads
    if (this._wordUploadCompleteHandler) {
      svc.removeEventListener("uploadcomplete", this._wordUploadCompleteHandler);
    }

    this._wordUploadCompleteHandler = (e) => {
      // ✅ Ignore duplicate conversion events (some services/components can dispatch twice)
      if (this._wordConversionHandled) {
        console.warn("⛔ Duplicate Word→PDF uploadcomplete ignored.");
        return;
      }
      this._wordConversionHandled = true;

      console.log("✅ Word→PDF conversion complete:", e.detail);

      const convertedFile = e.detail?.files?.[0];

      // filename: keep your behavior (docx -> pdf)
      const pdfFilename =
        convertedFile?.originalName?.replace(/\.[^/.]+$/, ".pdf") || this.fileName;

      // ✅ url: always take pdfUrl (string)
      const pdfUrl =
        (typeof convertedFile?.pdfUrl === "string" && convertedFile.pdfUrl) ||
        (typeof convertedFile?.url?.pdfUrl === "string" && convertedFile.url.pdfUrl) ||
        "";

      // ✅ key: prefer pdfKey (because convertedFile.key is often null)
      const pdfKey =
        convertedFile?.pdfKey ||
        convertedFile?.url?.pdfKey ||
        convertedFile?.key ||
        null;

      this.url = pdfUrl;
      this.fileName = pdfFilename;
      this.key = pdfKey;

      if (this.url) {
        // this.handleSaveAndUpload();
       this.isFileUploaded = true;
       this.loadPdf(this.url);
      } else {
        this.showToast("Error", "Converted PDF URL not found.", "error");
        // allow retry if conversion returned no URL
        this._wordConversionHandled = false;
      }

      this.showSpinner = false;
    };

    // ✅ Re-attach handler safely (once per conversion)
    svc.addEventListener("uploadcomplete", this._wordUploadCompleteHandler);

    svc.incomingFiles = files;
    svc.modulePathFromParent = "ticket";
    svc.confirmUpload = true;
  } catch (err) {
    console.error("❌ convertWordToPdf failed:", err);
    this.showToast("Error", "Word to PDF conversion failed.", "error");
    this.showSpinner = false;

    // allow retry
    this._wordConversionHandled = false;
    this._activeFlow = null;
  }
}

// ------------------------------
// DRAG START
// ------------------------------


handleDragStart(event) {
  if (this.isViewMode) return;
  const id = event.target.dataset.id;

  // Validate all recipient emails before dragging
  /* if (!this.areRecipientEmailsValid()) {
    event.preventDefault(); // Prevent the drag action
    this.showToast(
      "Error",
      "Please enter a valid email for all recipients before dragging placeholders.",
      "error"
    );
    return;
  } */

  // If Shift key is pressed and the placeholder already exists, enable rearranging
  if (event.shiftKey && id) {
    this.currentDraggedPlaceholder = this.placeholders.find(
      (placeholder) => placeholder.id === parseInt(id, 10)
    );
  } else {
    // Otherwise, it's a new placeholder creation
    this.draggedType = event.target.dataset.type;
    const rect = event.target.getBoundingClientRect();
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: this.draggedType,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      })
    );
    this.currentDraggedPlaceholder = null;
  }
}


// ------------------------------
// ALLOW DROP
// ------------------------------
allowDrop(event) {
    event.preventDefault();
}


// ------------------------------
// HANDLE DROP ON PDF
// ------------------------------
handleDrop(event) {
   if (this.isViewMode) return;
  event.preventDefault();

  const imgEl = this.template.querySelector(".image-container img");
  if (!imgEl) { console.error("Image container not found."); return; }

  const rect = imgEl.getBoundingClientRect();

  // drag data
  const dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
  const { type, offsetX, offsetY } = dragData;

  // mouse → image space
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // raw position (top-left of placeholder)
  let x = mouseX - offsetX;
  let y = mouseY - offsetY;

  // actual placeholder size (initial guess)
  const { w, h } = this._getPlaceholderSizeByType(type);

  // clamp to page
  ({ x, y } = this._clampToRect(x, y, rect.width, rect.height, w, h));

  // auto-avoid overlaps on the same page (with initial guess)
  const free = this._findFreeSpot(x, y, w, h, rect.width, rect.height, this.currentPage, /*excludeId*/ null);
  x = free.x; y = free.y;

  // compute PDF point coords (keeps your existing behavior)
  const pagePt = (this._pagePt && this._pagePt.w && this._pagePt.h) ? this._pagePt : { w: 1024, h: 1448 };
  const xPt = (x / rect.width)  * pagePt.w;
  const yPt = (y / rect.height) * pagePt.h;

  if (type) {
    const isDemographicField =
      type === "Name" ||
      type === "FirstName" ||
      type === "LastName" ||
      type === "FullName" ||
      type === "Email" ||
      type === "ContactNumber" ||
      type === "Address" ||
      type === "Date" ||
      type === "DateOfSigning" ||
      type === "Time" ||
      type === "Initials" ||
      type === "ABN" ||
      type === "TFN" ||
      type === "Signature";

    // Fields that never use AUTO mode — always manual entry
    const FORCED_MANUAL_TYPES = new Set(["Date", "DateOfSigning", "Initials", "Signature", "Time"]);

    const newPlaceholder = {
        id: Date.now(),
        type,
        x, y,
        xPt, yPt,
        wPt: (w / rect.width) * pagePt.w,
        hPt: (h / rect.height) * pagePt.h,
        page: this.currentPage,
        style: (type === "Signature" || type?.startsWith("Custom_Signature_"))
            ? `top:${y}px; left:${x}px; position:absolute;`
            : `top:${y}px; left:${x}px; position:absolute; width:${w}px; height:${h}px;`,
        value: "",

        // ─── CATEGORY FLAGS ───
        isDemographicField,
        isQuoteField:
            type === "QuoteNumber" ||
            type === "TotalAmount" ||
            type === "StartDate" ||
            type === "EndDate" ||
            type === "SerialNumber" ||
            type === "ServiceName" ||
            type === "ServiceNumber" ||
            type === "Quantity" ||
            type === "UnitPrice" ||
            type === "Amount",
        isCustomField: type?.startsWith("Custom_"),

        // ─── DEMOGRAPHIC PLACEHOLDERS ───
        isName:          type === "Name",
        isFirstName:     type === "FirstName",
        isLastName:      type === "LastName",
        isFullName:      type === "FullName",
        isEmail:         type === "Email",
        isContactNumber: type === "ContactNumber",
        isAddress:       type === "Address",
        isDate:          type === "Date",
        isDateOfSigning: type === "DateOfSigning",
        isTime:          type === "Time",
        isInitials:      type === "Initials",
        isABN:           type === "ABN",
        isTFN:           type === "TFN",
        isSignature:     type === "Signature",

        // ─── DEMOGRAPHIC VALUE SOURCE ───
        // Date, DateOfSigning, Initials, Signature → always HRMANUAL (no record auto-fill)
        // All other demographic fields → AUTO by default
        demographicValueMode: isDemographicField
            ? (FORCED_MANUAL_TYPES.has(type) ? "HRMANUAL" : "AUTO")
            : null,
        demographicSourceField: isDemographicField ? type : null,

        // ─── QUOTE HEADER ───
        isSerialNumber:  type === "SerialNumber",
        isQuoteNumber:   type === "QuoteNumber",
        isTotalAmount:   type === "TotalAmount",
        isStartDate:     type === "StartDate",
        isEndDate:       type === "EndDate",

        // ─── LINE ITEM ───
        isServiceName:   type === "ServiceName",
        isServiceNumber: type === "ServiceNumber",
        isQuantity:      type === "Quantity",
        isUnitPrice:     type === "UnitPrice",
        isAmount:        type === "Amount",

        // ─── CUSTOM FIELD HELPERS ───
        isCustomSignature: type?.startsWith("Custom_Signature_"),
        isCustomDate:      type?.startsWith("Custom_Date_"),
        isCustomTime:      type?.startsWith("Custom_Time_"),
        isCustomAddress:   type?.startsWith("Custom_Address_"),
        isCustomLongText:  type?.startsWith("Custom_LongText_"),
        customLabel:       type?.startsWith("Custom_")
            ? (type.split("_").slice(2).join(" ") || "Custom Field")
            : "",

        // ─── STYLE / RECIPIENT META ───
        recipient: "",
        customInlineStyle: false,
        textStyle: null,

        // ─── RUNTIME SIZE CACHE ───
        w,
        h
    };

    // ⬇️ your current behavior (unchanged)
// commit immediately — no modal on drop
this.newPlaceholder = newPlaceholder;
this._commitPlaceholderPosition(newPlaceholder);

this.styleOptions = {
    fontFamily: 'Calibri, Arial, sans-serif',
    fontSize: '20',
    bold: false,
    italic: false,
    underline: false,
    color: '#000000'
};
this.useCustomInlineStyle = false;

// ✅ Bypass modal — directly add to placeholders array
this.placeholders = [...this.placeholders, this.normalizePlaceholderForStyles(newPlaceholder)];
this.newPlaceholder = null;
// showRecipientModal stays false — user can open via edit icon

    // ⬇️ NEW: after it renders, measure actual size and reflow once if needed
    requestAnimationFrame(() => {
      // measure the rendered element and cache real size
      const el = this.template.querySelector(`[data-id="${newPlaceholder.id}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        newPlaceholder.w = Math.round(r.width);
        newPlaceholder.h = Math.round(r.height);

        // run findFreeSpot again using measured size
        const rect2 = this._getCanvasRect ? this._getCanvasRect() : rect;
        if (rect2) {
          const w2 = newPlaceholder.w, h2 = newPlaceholder.h;
          const pos = this._findFreeSpot(
            newPlaceholder.x, newPlaceholder.y,
            w2, h2,
            rect2.width, rect2.height,
            newPlaceholder.page,
            newPlaceholder.id
          );

          if (pos.x !== newPlaceholder.x || pos.y !== newPlaceholder.y) {
            newPlaceholder.x = pos.x;
            newPlaceholder.y = pos.y;
            newPlaceholder.style = this._buildCreatorStyle(newPlaceholder, pos.x, pos.y);

            // keep page-point coords in sync
            if (this._pagePt) {
              newPlaceholder.xPt = (pos.x / rect2.width)  * this._pagePt.w;
              newPlaceholder.yPt = (pos.y / rect2.height) * this._pagePt.h;
            }
            this._commitPlaceholderPosition(newPlaceholder);
          }
        }
      }
    });
  }
}

handleRecipientBadgeClick(event) {

   if (this.suppressNextClick) {
        this.suppressNextClick = false;
        this.isPlaceholderDragging = false;
        return;
    }

  if (this.isPlaceholderDragging) {
    this.isPlaceholderDragging = false;
    return;
  }

  const idStr = event.currentTarget.dataset.id || event.target.dataset.id;
  const id = Number(idStr);
  if (!idStr || Number.isNaN(id)) {
    return;
  }

  const ph = this.placeholders.find(p => Number(p.id) === id);
  if (!ph) {
    return;
  }

  this.editingPlaceholderId = id;
  this.newPlaceholder = { ...ph };
  this.selectedRecipient = ph.recipient || '';
  this.useCustomInlineStyle = !!ph.customInlineStyle;

  const ts = ph.textStyle || {};
  this.styleOptions = {
    fontFamily: ts.fontFamily || 'Calibri, Arial, sans-serif',
    fontSize: ts.fontSize || '20',
    bold: !!ts.bold,
    italic: !!ts.italic,
    underline: !!ts.underline,
    color: ts.color || '#000000'
  };

  this.showRecipientModal = true;
}

handleEditStyleClick(event) {
    const id = Number(event.currentTarget.dataset.id);
    const ph = this.placeholders.find(p => Number(p.id) === id);
    if (!ph) return;

    // load existing style into panel if it has one, else defaults
    this.styleOptions = ph.textStyle
        ? { ...ph.textStyle }
        : {
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '20',
            bold: false,
            italic: false,
            underline: false,
            color: '#000000'
          };

    this.useCustomInlineStyle = ph.customInlineStyle || false;
    this.newPlaceholder     = { ...ph };
    this.editingPlaceholderId = id;
    this.showRecipientModal = true;
}

get demographicValueModeOptions() {
    return [
        { label: 'Auto-fill', value: 'AUTO' },
        { label: 'Fill Manually', value: 'HR_MANUAL' }
    ];
}

get showValueSourcePanel() {
    console.log('=== showValueSourcePanel ===');
    console.log('newPlaceholder → ', JSON.stringify(this.newPlaceholder));
    console.log('isDemographicField → ', this.newPlaceholder?.isDemographicField);
    console.log('placeholder type → ', this.newPlaceholder?.type);
    console.log('templateType → ', this.templateType);
    console.log('selectedType → ', this.selectedType);

    if (!this.newPlaceholder?.isDemographicField) {
        console.log('Returning FALSE → not demographic');
        return false;
    }

    const FORCED_MANUAL_TYPES = new Set([
        "Date",
        "DateOfSigning",
        "Initials",
        "Signature",
        "Time"
    ]);

    const hidePanel =
        FORCED_MANUAL_TYPES.has(this.newPlaceholder?.type) ||
        this.templateType === 'Organisation'; // ← adjust variable

    console.log('hidePanel → ', hidePanel);

    return !hidePanel;
}
handleDemographicValueModeChange(event) {
    const value = event.detail.value;

    if (this.newPlaceholder) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            demographicValueMode: value
        };
    }
}
// ------------------------------
// PLACEHOLDERS FOR CURRENT PAGE
// ------------------------------
get placeholdersForCurrentPage() {
    return this.placeholders.filter(
        p => p.page === this.currentPage
    );
}


// ------------------------------
// DELETE PLACEHOLDER
// ------------------------------
deletePlaceholder(event) {

    const id = Number(event.target.dataset.id);

    this.placeholders =
        this.placeholders.filter(p => p.id !== id);
}

// -----------------------------
// START DRAGGING EXISTING
// -----------------------------
handleRearrangeStart(event) {
  event.preventDefault();
  event.stopPropagation();
  const id = event.currentTarget?.dataset?.id || event.target?.dataset?.id;
  if (!id) return;

  const ph = this.placeholders.find(p => p.id === parseInt(id, 10));
  if (!ph) return;

  this.isPlaceholderDragging = false;
  this.dragStartX = event.clientX;
  this.dragStartY = event.clientY;

  this._dragging = true;
  this._dragButton = event.button ?? 0;
  this.currentDraggedPlaceholder = ph;

  const el = this.template.querySelector(`.placeholder-container[data-id="${id}"]`);
  if (el) {
    el.classList.add('placeholder-dragging');
  }
  const box = el ? el.getBoundingClientRect() : null;
  this._dragW = box ? box.width : PLACEHOLDER_W_DEFAULT;
  this._dragH = box ? box.height : PLACEHOLDER_H_DEFAULT;

  ph.w = Math.round(this._dragW);
  ph.h = Math.round(this._dragH);

  window.addEventListener("mousemove", this.handleRearrangeMove);
  window.addEventListener("mouseup", this.handleRearrangeEnd);
  window.addEventListener("pointerup", this.handleRearrangeEnd);
  window.addEventListener("mouseleave", this.handleRearrangeEnd);
  window.addEventListener("blur", this.handleRearrangeEnd);
}

suppressNextClick = false;

handleRearrangeMove = (event) => {
  if (!this._dragging || event.buttons === 0) {
    this.handleRearrangeEnd();
    return;
  }

  const dragDistance = Math.sqrt(
    Math.pow(event.clientX - this.dragStartX, 2) +
    Math.pow(event.clientY - this.dragStartY, 2)
  );

  if (dragDistance > 5) {
      this.isPlaceholderDragging = true;
      this.suppressNextClick = true;
  }

  const ph = this.currentDraggedPlaceholder;
  if (!ph) return;

  const rect = this._getCanvasRect();
  if (!rect) return;

  let x = event.clientX - rect.left - (this._dragW / 2);
  let y = event.clientY - rect.top  - (this._dragH / 2);

  const mySize = this._getSize(ph);
  ({ x, y } = this._clampToRect(x, y, rect.width, rect.height, mySize.w, mySize.h));

  const free = this._findFreeSpot(x, y, mySize.w, mySize.h, rect.width, rect.height, ph.page, ph.id);
  x = free.x;
  y = free.y;

  ph.x = x;
  ph.y = y;
  ph.style = this._buildCreatorStyle(ph, x, y);

  this.placeholders = [...this.placeholders];
};

handleRearrangeEnd = () => {
  if (!this._dragging) return;

  const ph = this.currentDraggedPlaceholder;
  if (ph) {
    const container = this.template.querySelector(`.placeholder-container[data-id="${ph.id}"]`);
    if (container) {
      container.classList.remove('placeholder-dragging');
    }

    if (this._pagePt) {
      const rect = this._getCanvasRect();
      if (rect) {
        ph.xPt = (ph.x / rect.width)  * this._pagePt.w;
        ph.yPt = (ph.y / rect.height) * this._pagePt.h;
      }
    }
    ph.style = this._buildCreatorStyle(ph, ph.x, ph.y);
    this._commitPlaceholderPosition(ph);
  }

  if (this.isPlaceholderDragging) {
    this.suppressNextClick = true;
}

  this._dragging = false;
  this._dragButton = undefined;
  this.currentDraggedPlaceholder = null;
  this._dragW = undefined;
  this._dragH = undefined;

  window.removeEventListener("mousemove", this.handleRearrangeMove);
  window.removeEventListener("mouseup", this.handleRearrangeEnd);
  window.removeEventListener("pointerup", this.handleRearrangeEnd);
  window.removeEventListener("mouseleave", this.handleRearrangeEnd);
  window.removeEventListener("blur", this.handleRearrangeEnd);
};

// -----------------------------
// HELPERS
// -----------------------------
getCanvasRect() {

    const img = this.template.querySelector(".pdf-image");

    return img ? img.getBoundingClientRect() : null;
}

_getCanvasRect() {
  const img = this.template.querySelector('.image-container img');
  return img ? img.getBoundingClientRect() : null;
}


getPlaceholderSize() {

    return {
        w: PLACEHOLDER_W_DEFAULT,
        h: PLACEHOLDER_H_DEFAULT
    };
}


clampToRect(x, y, rectW, rectH, w, h) {

    return {
        x: Math.max(0, Math.min(x, rectW - w)),
        y: Math.max(0, Math.min(y, rectH - h))
    };
}


bboxOverlap(ax, ay, aw, ah, bx, by, bw, bh) {

    return !(
        ax + aw <= bx ||
        bx + bw <= ax ||
        ay + ah <= by ||
        by + bh <= ay
    );
}


findFreeSpot(x, y, w, h, rectW, rectH, page, excludeId) {

    let ix = x;
    let iy = y;

    const others = this.placeholders.filter(
        p => p.page === page && p.id !== excludeId
    );

    const tryPos = (tx, ty) =>
        !others.some(p =>
            this.bboxOverlap(
                tx,
                ty,
                w,
                h,
                p.x,
                p.y,
                PLACEHOLDER_W_DEFAULT,
                PLACEHOLDER_H_DEFAULT
            )
        );

    if (tryPos(ix, iy)) return { x: ix, y: iy };

    while (true) {

        ix += 20;

        if (ix + w > rectW) {
            ix = 0;
            iy += 20;
        }

        if (tryPos(ix, iy)) {
            return { x: ix, y: iy };
        }
    }
}


_getPlaceholderSizeByType(type) {
    switch (type) {

        // ─── SIGNATURE (largest — needs writing space) ───
        case "Signature":
            return { w: 280, h: 90 };

        // ─── MULTI-LINE FIELDS ───
        case "Address":
            return { w: 260, h: 70 };

        // ─── FULL NAME (slightly wider than single fields) ───
        case "FullName":
            return { w: 205, h: 37 };

        // ─── STANDARD DEMOGRAPHIC FIELDS ───
        case "Name":
        case "FirstName":
        case "LastName":
            return { w: 205, h: 37 };

        case "Email":
            return { w: 205, h: 37 };

        case "ContactNumber":
            return { w: 205, h: 37 };

        case "ABN":
        case "TFN":
            return { w: 205, h: 37 };

        case "Initials":
            return { w: 120, h: 44 };

        case "Date":
        case "Time":
            return { w: 205, h: 37 };

        case "DateOfSigning":
            return { w: 205, h: 37 };

        // ─── QUOTE INFO FIELDS ───
        case "QuoteNumber":
            return { w: 200, h: 44 };

        case "TotalAmount":
            return { w: 200, h: 44 };

        case "StartDate":
        case "EndDate":
            return { w: 180, h: 44 };
        
        case 'SerialNumber':
            return { w: 160, h: 44 };

        // ─── SERVICE FIELDS ───
        case "ServiceName":
            return { w: 240, h: 44 };

        case "ServiceNumber":
            return { w: 200, h: 44 };

        // ─── PRICING FIELDS ───
        case "Quantity":
            return { w: 140, h: 44 };

        case "UnitPrice":
            return { w: 160, h: 44 };

        case "Amount":
            return { w: 180, h: 44 };

        // ─── CUSTOM FIELDS (dynamic — use label-based sizing) ───
        default:
            if (type?.startsWith('Custom_Signature_')) return { w: 280, h: 90 };
            if (type?.startsWith('Custom_Date_')) return { w: 180, h: 44 };
            if (type?.startsWith('Custom_Time_')) return { w: 180, h: 44 };
            if (type?.startsWith('Custom_Address_')) return { w: 260, h: 70 };
            if (type?.startsWith('Custom_LongText_')) return { w: 300, h: 90 };
            return { w: 240, h: 44 };
    }
}

_clampToRect(x, y, rectW, rectH, w, h) {
  return {
    x: Math.max(0, Math.min(x, rectW - w)),
    y: Math.max(0, Math.min(y, rectH - h)),
  };
}

_findFreeSpot(x, y, w, h, rectW, rectH, page, excludeId) {
  let ix = x;
  let iy = y;
  let steps = 0;

  const others = (this.placeholders || []).filter(
    p => p.page === page && p.id !== excludeId
  );

  const tryPos = (tx, ty) => {
    let collisionFound = false;
    others.forEach(p => {
      const sz = this._getSize(p);
      const overlaps = this._bboxOverlap(tx, ty, w, h, p.x, p.y, sz.w, sz.h);
      if (overlaps) {
        collisionFound = true;
      }
    });
    return !collisionFound;
  };

  const clamped = this._clampToRect(ix, iy, rectW, rectH, w, h);
  ix = clamped.x;
  iy = clamped.y;

  if (tryPos(ix, iy)) {
    return { x: ix, y: iy };
  }

  const stepX = 1;
  const stepY = 1;

  while (steps++ < 2000) {
    ix += stepX;
    if (ix + w > rectW) {
      ix = 0;
      iy += stepY;
    }
    if (iy + h > rectH) {
      ix = 0;
      iy = 0;
    }
    if (tryPos(ix, iy)) {
      return { x: ix, y: iy };
    }
  }

  return clamped;
}

_buildCreatorStyle(ph, x, y) {
  const isSig = ph.isSignature || ph.isCustomSignature || ph.type === 'Signature' || ph.placeholderType === 'Signature';
  if (ph.hasImage) {
    return isSig
      ? `position:absolute; top:${y}px; left:${x}px;`
      : `position:absolute; top:${y}px; left:${x}px; width:${ph.w}px;`;
  } else {
    return isSig
      ? `position:absolute; top:${y}px; left:${x}px; border:2px dashed #0070d2; background-color:#f4f6f9;`
      : `position:absolute; top:${y}px; left:${x}px; border:2px dashed #0070d2; background-color:#f4f6f9; width:${ph.w}px;`;
  }
}

_commitPlaceholderPosition(updated) {
  const normalized = this.normalizePlaceholderForStyles(updated);

  // 1) update flat list (source of truth)
  this.placeholders = (this.placeholders || []).map(p =>
    p.id === normalized.id ? { ...p, ...normalized } : p
  );

  // 2) update paged map (if you render from it anywhere)
  if (this.placeholdersByPage && normalized.page != null) {
    const list = (this.placeholdersByPage[normalized.page] || []).map(p =>
      p.id === normalized.id ? { ...p, ...normalized } : p
    );
    this.placeholdersByPage = {
      ...this.placeholdersByPage,
      [normalized.page]: list
    };
  }

  // 3) optional flag you can check before saving
  this._placeholdersDirty = true;
}

@track showRecipientModal = false;
@track selectedRecipient = null;
@track newPlaceholder = null;
@track useCustomInlineStyle = false;

editingPlaceholderId = null;


/* -----------------------------
STYLE OPTIONS
----------------------------- */

@track styleOptions = {

fontFamily: 'Calibri, Arial, sans-serif',
fontSize: '20',
bold: false,
italic: false,
underline: false,
color: '#000000'

};


/* -----------------------------
RECIPIENT EMAILS
----------------------------- */

@track recipientEmails = [

{ key:0 , email:'user1@test.com' },
{ key:1 , email:'user2@test.com' }

];


/* -----------------------------
RECIPIENT OPTIONS
----------------------------- */

get recipientRadioOptions(){

return this.recipientEmails.map(recipient => ({
label:recipient.email,
value:recipient.email
}));

}


/* -----------------------------
RECIPIENT SELECTION
----------------------------- */

handleRecipientSelection(event){

this.selectedRecipient = event.detail.value;

}


/* -----------------------------
OPEN MODAL
----------------------------- */

openRecipientModal(){

this.showRecipientModal = true;

}


/* -----------------------------
CANCEL
----------------------------- */

cancelRecipientSelection(){

this.showRecipientModal = false;
this.selectedRecipient = null;
this.newPlaceholder = null;

}


/* -----------------------------
CONFIRM
----------------------------- */

confirmRecipientSelection() {
 /*  if (!this.newPlaceholder || !this.selectedRecipient) {
    this.showToast("Error", "Please select a recipient.", "error");
    return;
  } */

  let updated = {
    ...this.newPlaceholder,
    recipient: this.selectedRecipient
  };

  // apply or remove textStyle based on toggle
  if (this.useCustomInlineStyle) {
    updated = {
      ...updated,
      customInlineStyle: true,
      textStyle: { ...this.styleOptions }
    };
  } else {
    updated = {
      ...updated,
      customInlineStyle: false
    };
    // make sure no stale style is persisted
    delete updated.textStyle;
  }

  // Normalize styles (compute inputStyle, font weights, sizes, border color, etc.)
  updated = this.normalizePlaceholderForStyles(updated);

  // upsert into placeholders (edit vs new)
  const idx = this.placeholders.findIndex(
    (p) => Number(p.id) === Number(updated.id)
  );

  if (idx >= 0) {
    // 🔁 EDIT EXISTING PLACEHOLDER
    const copy = [...this.placeholders];
    copy[idx] = updated;
    this.placeholders = copy;
  } else {
    // ➕ NEW PLACEHOLDER (from drag & drop)
    this.placeholders = [...this.placeholders, updated];
  }

  // Reset modal state
  this.newPlaceholder = null;
  this.selectedRecipient = null;
  this.editingPlaceholderId = null;
  this.showRecipientModal = false;
  this.useCustomInlineStyle = false; // reset toggle for next time

  console.log("Recipient + style saved:", updated, "all:", this.placeholders);
}


/* -----------------------------
SHOW STYLE PANEL
----------------------------- */

get showTextStylePanel(){

return this.newPlaceholder !== null;

}


/* -----------------------------
TOGGLE CUSTOM STYLE
----------------------------- */

handleCustomInlineStyleToggle(event){

this.useCustomInlineStyle = event.target.checked;

}


/* -----------------------------
STYLE CHANGE
----------------------------- */

handleStyleOptionChange(event){

const {name,value}=event.target;

this.styleOptions = {

...this.styleOptions,
[name]:value

};

}


/* -----------------------------
STYLE TOGGLE
----------------------------- */

handleStyleToggleClick(event){

const styleName = event.currentTarget.dataset.styleName;

this.styleOptions = {

...this.styleOptions,
[styleName]:!this.styleOptions[styleName]

};

}


/* -----------------------------
STYLE PREVIEW
----------------------------- */

get stylePreviewCss(){

const s=this.styleOptions;

return `
font-family:${s.fontFamily};
font-size:${s.fontSize}px;
font-weight:${s.bold?'700':'400'};
font-style:${s.italic?'italic':'normal'};
text-decoration:${s.underline?'underline':'none'};
color:${s.color};
padding:6px;
border:1px dashed #ccc;
`;

}


/* -----------------------------
FONT OPTIONS
----------------------------- */

get fontFamilyOptions(){

return [

{label:'Arial',value:'Arial, Helvetica, sans-serif'},
{label:'Roboto',value:'Roboto, Arial, sans-serif'},
{label:'Times New Roman',value:'"Times New Roman", Times, serif'},
{label:'Calibri',value:'Calibri, Arial, sans-serif'},
{label:'Courier New',value:'"Courier New", Courier, monospace'}

];

}


/* -----------------------------
FONT SIZE OPTIONS
----------------------------- */

get fontSizeOptions(){

return [

{label:'10',value:'10'},
{label:'12',value:'12'},
{label:'14',value:'14'},
{label:'16',value:'16'},
{label:'18',value:'18'},
{label:'20',value:'20'},
{label:'24',value:'24'}

];

}


/* -----------------------------
BUTTON STYLE CLASSES
----------------------------- */

get boldToggleClass(){

return this.styleOptions.bold ? 'active' : '';

}

get italicToggleClass(){

return this.styleOptions.italic ? 'active' : '';

}

get underlineToggleClass(){

return this.styleOptions.underline ? 'active' : '';

}


/* -----------------------------
STYLE PANEL GRID
----------------------------- */

get stylePanelGridClass(){

return this.useCustomInlineStyle
? 'style-panel-grid'
: 'style-panel-grid style-disabled';

}

_getSize(phOrType) {
  if (phOrType && typeof phOrType === "object") {
    const measuredWidth = phOrType.w;
    const measuredHeight = phOrType.h;
    const finalWidth = (measuredWidth ?? PLACEHOLDER_W_DEFAULT) + GUTTER_X;
    const finalHeight = (measuredHeight ?? PLACEHOLDER_H_DEFAULT) + GUTTER_Y;
    return {
      w: finalWidth,
      h: finalHeight
    };
  }
  return {
    w: PLACEHOLDER_W_DEFAULT + GUTTER_X,
    h: PLACEHOLDER_H_DEFAULT + GUTTER_Y
  };
}

_bboxOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(
    ax + aw <= bx ||
    bx + bw <= ax ||
    ay + ah <= by ||
    by + bh <= ay
  );
}

_measureAndCache(ph) {
  if (!ph?.id) {
    return;
  }
  const el = this.template.querySelector(
    `.measurable-placeholder[data-id="${ph.id}"]`
  );
  if (!el) {
    return;
  }
  const rect = el.getBoundingClientRect();
  ph.w = Math.round(rect.width);
  ph.h = Math.round(rect.height);
}




// saveTemplate() {
//     if (!this.fileName || !this.url) {
//         this.showToast("Error", "File information missing", "error");
//         return;
//     }

//     const placeholderJSON = JSON.stringify(this.placeholders);

//     console.log("Saving Template Data");
//     console.log("fileName:",     this.fileName);
//     console.log("url:",          this.url);
//     console.log("placeholders:", placeholderJSON);
//     console.log("this.orgId:",   this.orgid);
//     console.log("this.key:",     this.key);

//     saveTemplateData({
//         templateId:      this.templateRecordId,
//         fileName:        this.fileName,
//         fileUrl:         this.url,              // ✅ was this.fileUrl (undefined)
//         placeholderJSON: placeholderJSON,        // ✅ was this.placeholderData (undefined)
//         orgId:           this.orgid,
//         key:             this.key,
//         templateName:    this.templateName,
//         description:     this.description,
//         type:            this.templateType,
//         status:          status    
//     })
//     .then(result => {
//         console.log("Template saved with Id:", result);
//         this.showToast("Success", "Template saved successfully", "success");
//         this.isFileUploaded = false;
//         this.notifyParent();
//     })
//     .catch(error => {
//         console.error("Error saving template", error);
//         this.showToast("Error", "Failed to save template", "error");
//     });
// }


templateRecordId = null; // set this when opening an existing template for edit

get isEditMode() {
    return !!this.templateRecordId;
}

get isDraftTemplate() {
    return (this.templateStatus || '').toLowerCase() === 'draft';
}

get isPublishedTemplate() {
    return (this.templateStatus || '').toLowerCase() === 'publish';
}

get primaryButtonLabel() {
    if (this.isEditMode && this.isPublishedTemplate) {
        return 'Update';
    }
    if (this.isEditMode && this.isDraftTemplate) {
        return 'Publish';
    }
    return 'Publish';
}

get secondaryButtonLabel() {

    // Edit + Draft → Update
    if (
        this.isEditMode &&
        this.isDraftTemplate
    ) {
        return 'Update';
    }

    // Anything except Publish → Save as Draft
    if (
        !this.isPublishedTemplate
    ) {
        return 'Save as Draft';
    }

    return '';
}

get showSecondaryUpdateButton() {
    return this.isEditMode && this.isDraftTemplate;
}

// saveDraft() {
//     this.saveTemplateWithStatus('Draft');
// }

// publishTemplate() {
//     this.saveTemplateWithStatus('Publish');
// }

// archiveTemplate() {
//     this.saveTemplateWithStatus('Archive');
// }

saveDraft() {
    this.openConfirmation('draft');
}

publishTemplate() {
    if (
        this.isEditMode &&
        (this.templateStatus || '').toLowerCase() === 'publish'
    ) {
        this.openConfirmation('update');
    } else {
        this.openConfirmation('publish');
    }
}

archiveTemplate() {
    this.openConfirmation('archive');
}

saveTemplateWithStatus(status) {
    if (!this.fileName || !this.url) {
        this.showToast("Error", "File information missing", "error");
        return;
    }

    if (!this.templateName || !this.templateName.trim()) {
        this.showToast("Error", "Template Name is required", "error");
        return;
    }

    if (!this.templateType) {
        this.showToast("Error", "Template Type is required", "error");
        return;
    }

    const placeholderJSON = JSON.stringify(this.placeholders);
    const normalizedCurrentStatus = (this.templateStatus || '').toLowerCase();
    const normalizedTargetStatus = (status || '').toLowerCase();

    let templateIdToSend = this.templateRecordId;

    // Edit Draft -> Publish => create new Published record
    if (
        this.isEditMode &&
        normalizedCurrentStatus === 'draft' &&
        normalizedTargetStatus === 'publish'
    ) {
        templateIdToSend = null;
    }

    // Edit Draft -> Draft => update existing draft
    // Edit Publish -> Publish => update existing published
    // Create new => templateRecordId already null

    saveTemplateData({
        templateId: templateIdToSend,
        fileName: this.fileName,
        fileUrl: this.url,
        placeholderJSON: placeholderJSON,
        orgId: this.orgid,
        key: this.key,
        templateName: this.templateName.trim(),
        description: this.description,
        type: this.templateType,
        status: status
    })
        .then(result => {
            this.templateRecordId = result;
            this.templateStatus = status;

           const templateName = this.templateName?.trim();

            let message = templateName
                ? `Template '${templateName}' has been saved successfully.`
                : "Template has been saved successfully.";

            if (
                normalizedCurrentStatus === 'draft' &&
                normalizedTargetStatus === 'publish' &&
                this.isEditMode
            ) {
                message = templateName
                    ? `Template '${templateName}' has been published successfully.`
                    : "Template has been published successfully.";

            } else if (normalizedTargetStatus === 'draft') {

                message = templateName
                    ? `Template '${templateName}' has been saved as draft successfully.`
                    : "Template has been saved as draft successfully.";

            } else if (normalizedTargetStatus === 'publish') {

                message = templateName
                    ? `Template '${templateName}' has been published successfully.`
                    : "Template has been published successfully.";

            } else if (normalizedTargetStatus === 'archive') {

                message = templateName
                    ? `Template '${templateName}' has been archived successfully.`
                    : "Template has been archived successfully.";
            }

            this.showToast("Success", message, "success");
            this.isFileUploaded = false;
            this.notifyParent();
        })
        .catch(error => {
            console.error("Error saving template", error);
            this.showToast("Error", "Failed to save template", "error");
        });
}

get showSaveDraftButton() {
    return (this.templateStatus || '').toLowerCase() !== 'publish';
}

showConfirmationModal = false;

confirmationTitle = '';

confirmationMessage = '';

confirmButtonLabel = '';

pendingAction = null;

openConfirmation(action) {

    this.pendingAction = action;

    const templateName = this.templateName?.trim();

    const templateText =
        templateName
            ? ` template '${templateName}'`
            : ' this template';

    switch (action) {

        case 'update':

            this.confirmationTitle =
                'Save Template';

            this.confirmationMessage =
                `Would you like to Update the changes made to${templateText}?`;

            this.confirmButtonLabel =
                'Update';

            break;

        case 'draft':

            this.confirmationTitle =
                'Save as Draft';

            this.confirmationMessage =
                `Would you like to save${templateText} as draft?`;

            this.confirmButtonLabel =
                'Save as Draft';

            break;

        case 'publish':

            this.confirmationTitle =
                'Publish Template';

            this.confirmationMessage =
                `Would you like to publish${templateText}?`;

            this.confirmButtonLabel =
                'Publish';

            break;


    }

    this.showConfirmationModal = true;
}

get templateName() {
    return this.templateName?.trim();
}

handleConfirmAction() {

    this.showConfirmationModal = false;

    switch (this.pendingAction) {

        case 'update':
            this.saveTemplateWithStatus('Publish');
            break;

        case 'draft':
            this.saveTemplateWithStatus('Draft');
            break;

        case 'publish':
            this.saveTemplateWithStatus('Publish');
            break;

        case 'archive':
            this.saveTemplateWithStatus('Archive');
            break;

        case 'unarchive':
            this.saveTemplateWithStatus('Unarchive');
            break;
    }

    this.pendingAction = null;
}

handleCancelAction() {

    this.showConfirmationModal = false;

    this.pendingAction = null;
}

handleReset() {
   this.notifyParent();
   this.isFileUploaded = false;
   if (this.key) {
      this.deleteFile(this.key);
    }
   
   
}

async tryAutofillAfterLoad() {
    console.log('[AUTO-FILL] tryAutofillAfterLoad', {
        hasPdf: !!this.pdfUrl,
        hasImageSrc: !!this.imageSrc,
        recipientType: this.sendDocumentForm?.recipientType,
        contactId: this.sendDocumentForm?.contactId
    });

    if (
        this.imageSrc &&
        this.sendDocumentForm?.recipientType &&
        this.sendDocumentForm?.contactId &&
        (this.sendDocumentForm.recipientType === 'Staff' ||
         this.sendDocumentForm.recipientType === 'Participant')
    ) {
        await this.autofillRecipientDemographics();
    } else {
        console.warn('[AUTO-FILL] not ready yet');
    }
}

async autofillRecipientDemographics() {
    console.group('[AUTO-FILL] autofillRecipientDemographics');

    try {
        const recipientType = this.sendDocumentForm?.recipientType;
        const contactId = this.sendDocumentForm?.contactId;

        console.log('[AUTO-FILL] sendDocumentForm:', JSON.stringify(this.sendDocumentForm));
        console.log('[AUTO-FILL] recipientType:', recipientType);
        console.log('[AUTO-FILL] contactId:', contactId);

        if (
            !recipientType ||
            !contactId ||
            (recipientType !== 'Staff' && recipientType !== 'Participant')
        ) {
            console.warn('[AUTO-FILL] skipped due to guard condition', {
                recipientType,
                contactId
            });
            return;
        }

        const result = await getRecipientDemographicDetails({
            sendDocumentFormJson: JSON.stringify(this.sendDocumentForm)
        });

        console.log('[AUTO-FILL] Apex result:', JSON.stringify(result));
        this.recipientDemographicData = result;

        const fieldValues = result?.fieldValues || {};
        console.log('[AUTO-FILL] fieldValues:', JSON.stringify(fieldValues));

        (this.placeholders || []).forEach(ph => {
            if (ph.demographicValueMode !== 'AUTO') {
                return;
            }

            const sourceFieldName = ph.demographicSourceField;
            const autoValue = fieldValues[sourceFieldName];

            if (autoValue === undefined || autoValue === null || autoValue === '') {
                console.log('[AUTO-FILL] no auto value for placeholder', {
                    id: ph.id,
                    type: ph.type,
                    sourceFieldName
                });
                return;
            }

            const srcField = this.getSrcFieldForPlaceholder(ph);
            const successMessage = this.getSuccessMessageForPlaceholder(ph);

            if (!srcField) {
                console.warn('[AUTO-FILL] no srcField mapping for placeholder', {
                    id: ph.id,
                    type: ph.type
                });
                return;
            }

            console.log('[AUTO-FILL] applying auto value', {
                id: ph.id,
                type: ph.type,
                sourceFieldName,
                autoValue,
                srcField
            });

            this.applyPlaceholderValue(
                ph.id,
                autoValue,
                srcField,
                successMessage,
                0
            );
        });

    } catch (error) {
        console.error('[AUTO-FILL] Error fetching demographic details:', error);
    } finally {
        console.groupEnd();
    }
}

async deleteFile(key) {
        if (!key) {
            console.error('[DELETE] key is required');
            return;
        }

        try {
            const resp = await fetch(ENDPOINTS.delete, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });

            const text = await resp.text();
            let json;
            try { json = JSON.parse(text); } catch { json = null; }

            if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

            console.log('[DELETE] success', json);




           // this.isDisabled=false;
            this.key='';
           // this.isEdit=false;


        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    notifyParent() {
      this.pdfUrl='';
      this.placeholderJson='';
    const event = new CustomEvent('viewtemplate');
    this.dispatchEvent(event);
    console.log('Parent notified');
}



@track isSidebarCollapsed = false;
@track templateName = '';
@track description = '';
@track templateType = '';
@track category = '';

get typeOptions() {
    const options = [
        { label: 'Staff', value: 'Staff' },
        { label: 'Participant', value: 'Participant' },
        { label: 'Organisation', value: 'Organisation' }
    ];

    // Remove Participant option for ICT User
    if (this.usertype === 'ICT User') {
        return options.filter(option => option.value !== 'Participant');
    }

    return options;
}



toggleSidebarTemplate() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
}

handleTemplateFieldChange(event) {
    const field = event.target.dataset.field;
    const value = event.detail?.value ?? event.target.value;

    console.log('Field Changed:', field);
    console.log('Value:', value);

    this[field] = value;

    // Template Type selected
    if (
        field === 'templateType' &&
        value === 'Organisation'
    ) {
        console.log('Organisation selected → forcing manual');

        this.newPlaceholder = {
            ...this.newPlaceholder,
            valueSource: 'manual'
        };
    }

    console.log('newPlaceholder after update:',
        JSON.stringify(this.newPlaceholder));
}
get sidebarTemplateClass() {
    return this.isSidebarCollapsed
        ? 'template-sidebar collapsed'
        : 'template-sidebar expanded';
}

get isParticipantType() {
    return(this.templateType === 'Participant');
}



// ─── SECTION TOGGLES ───────────────────────────────────────────
@track sectionDemographicOpen = true;
@track sectionCustomOpen      = false;
@track sectionQuoteOpen       = false;

get chevronIconDemographic() {
    return this.sectionDemographicOpen ? 'expand_less' : 'expand_more';
}
get chevronIconCustom() {
    return this.sectionCustomOpen ? 'expand_less' : 'expand_more';
}
get chevronIconQuote() {
    return this.sectionQuoteOpen ? 'expand_less' : 'expand_more';
}

toggleSection(event) {
    const key = event.currentTarget.dataset.section;
    if (key === 'demographic') this.sectionDemographicOpen = !this.sectionDemographicOpen;
    if (key === 'custom')      this.sectionCustomOpen      = !this.sectionCustomOpen;
    if (key === 'quote')       this.sectionQuoteOpen       = !this.sectionQuoteOpen;
}

// ─── CUSTOM FIELDS ─────────────────────────────────────────────
@track customFields         = [];
@track showCustomFieldModal = false;
@track customFieldLabel     = '';
@track customFieldType      = 'Text';
@track saveCustomFieldConfig = false;

get noCustomFields() {
    return this.customFields.length === 0;
}

get customFieldLabelPreview() {
    return this.customFieldLabel?.trim() || 'Field Label';
}

get isCustomPreviewText() {
    return ['Text', 'Number', 'Email'].includes(this.customFieldType);
}

get isCustomPreviewDate() {
    return this.customFieldType === 'Date';
}

get isCustomPreviewTime() {
    return this.customFieldType === 'Time';
}

get isCustomPreviewAddress() {
    return this.customFieldType === 'Address';
}

get isCustomPreviewLongText() {
    return this.customFieldType === 'LongText';
}

get isCustomPreviewSignature() {
    return this.customFieldType === 'Signature';
}

get customFieldTypeOptions() {
    return [
        { label: 'Text',       value: 'Text' },
        { label: 'Number',     value: 'Number' },
        { label: 'Date',       value: 'Date' },
        { label: 'Time',       value: 'Time' },
        { label: 'Email',      value: 'Email' },
        { label: 'Address',    value: 'Address' },
        { label: 'Long Text',  value: 'LongText' },
        { label: 'Signature',  value: 'Signature' }
    ];
}

openCustomFieldModal() {
    this.customFieldLabel = '';
    this.customFieldType  = 'Text';
    this.showCustomFieldModal = true;
}

closeCustomFieldModal() {
    this.showCustomFieldModal = false;
}

handleCustomFieldLabelChange(event) {
    this.customFieldLabel = event.target.value;
}

handleCustomFieldTypeChange(event) {
    this.customFieldType = event.detail.value;
}

// confirmAddCustomField() {
//     const label = this.customFieldLabel?.trim();
//     if (!label) {
//         this.showToast('Error', 'Please enter a field label.', 'error');
//         return;
//     }
//     const newField = {
//         id:    Date.now(),
//         label: label,
//         type:  `Custom_${this.customFieldType}_${label.replace(/\s+/g, '_')}`
//     };
//     this.customFields = [...this.customFields, newField];
//     this.showCustomFieldModal = false;
// }

async confirmAddCustomField() {
    const label = this.customFieldLabel ?. trim();
    if (! label) {
        this.showToast('Error', 'Please enter a field label.', 'error');
        return;
    }
    const newField = {
        id: Date.now(),
        label: label,
        type: `Custom_${
            this.customFieldType
        }_${
            label.replace(/\s+/g, '_')
        }`
    };
    this.customFields = [
        ...this.customFields,
        newField
    ];
    console.log('📌 Custom field created:', JSON.stringify(newField));
    if (this.saveCustomFieldConfig) {
        try {
            const config = {
                label: label,
                type: this.customFieldType
            };
            console.log('📌 Saving custom field config:', JSON.stringify(config));
            await saveCustomFieldConfig({orgId: this.orgid, fieldConfig: JSON.stringify(config)});
            console.log('✅ Custom field config saved');
        } catch (error) {
            console.error('❌ Failed to save custom field config:', error);
            this.showToast('Warning', 'Field added but failed to save for future use.', 'warning');
        }
    }
    this.showCustomFieldModal = false;
    this.customFieldLabel = '';
    this.customFieldType = '';
    this.saveCustomFieldConfig = false;
}


// removeCustomField(event) {
//     const id = Number(event.currentTarget.dataset.id);
//     this.customFields = this.customFields.filter(f => f.id !== id);
// }

async removeCustomField(event) {
    const id = Number(event
        .currentTarget
        .dataset
        .id);
    const removedField = this.customFields.find(f => f.id === id);
    this.customFields = this.customFields.filter(f => f.id !== id);
    console.log('🗑️ Removed custom field:', JSON.stringify(removedField));
    if (removedField) {
        try {
            await removeCustomFieldConfig({
                orgId: this.orgid,
                label: removedField.label,
                type: removedField.type ?. replace(/^Custom_[^_]+_/, '')
            });
            console.log('✅ Config removed from Organisation');
        } catch (error) {
            console.error('❌ Failed removing config:', error);
        }
    }
}

handleSaveConfigChange(event) {

    this.saveCustomFieldConfig =
        event.target.checked;

    console.log(
        '📌 Save custom field config:',
        this.saveCustomFieldConfig
    );
}



DEBUG = true;
_log(...args) { if (this.DEBUG) console.log('[LWC-PDF]', ...args); }
_warn(...args) { if (this.DEBUG) console.warn('[LWC-PDF]', ...args); }
_time(label) { if (this.DEBUG) console.time(label); }
_timeEnd(label) { if (this.DEBUG) console.timeEnd(label); }



async loadPdf(pdfUrl) {
    console.group('loadPdf');
    console.log('Initializing PDF.js...');
    console.log('Raw pdfUrl:', pdfUrl);

    try {
        if (!pdfUrl || typeof pdfUrl !== 'string') {
            console.error('Invalid pdfUrl passed to loadPdf:', pdfUrl);
            this.showToast('Error', 'Invalid PDF URL.', 'error');
            console.groupEnd();
            return;
        }

        if (!window.pdfjsLib) {
            console.error('window.pdfjsLib is not available');
            this.showToast('Error', 'PDF library is not loaded.', 'error');
            console.groupEnd();
            return;
        }

        if (!window.pdfjsLib.getDocument) {
            console.error('window.pdfjsLib.getDocument is not available');
            this.showToast('Error', 'PDF loader is not available.', 'error');
            console.groupEnd();
            return;
        }

        console.log('pdfjsLib available:', !!window.pdfjsLib);
        console.log(
            'Current workerSrc:',
            window.pdfjsLib?.GlobalWorkerOptions?.workerSrc
        );

        if (!window.pdfjsLib?.GlobalWorkerOptions?.workerSrc) {
            console.warn('workerSrc is missing before getDocument call');
        }

        this.isLoading = true;
        this.showSpinner = true;

        const url = encodeURI(pdfUrl);
        console.log('Encoded PDF URL:', url);

        const loadingTask = window.pdfjsLib.getDocument({
            url,
            disableStream: false,
            disableAutoFetch: false
        });

        console.log('loadingTask created:', loadingTask);

        loadingTask.onProgress = ({ loaded, total }) => {
            if (total) {
                this.loadingPct = Math.round((loaded / total) * 100);
                console.log(
                    'PDF loading progress:',
                    this.loadingPct + '%',
                    'loaded:',
                    loaded,
                    'total:',
                    total
                );
            } else {
                console.log('PDF loading progress: loaded bytes =', loaded);
            }
        };

        console.log('Waiting for loadingTask.promise...');
        const pdf = await loadingTask.promise;

        console.log('PDF successfully loaded:', pdf);

        this.pdfDoc = pdf;
        this.totalPages = pdf.numPages;
        this.currentPage = 1;

        console.log('Total pages in PDF:', this.totalPages);
        console.log('Current page set to:', this.currentPage);

        if (typeof this.generateThumbnailsAsync === 'function') {
            console.log('Calling generateThumbnailsAsync...');
            await this.generateThumbnailsAsync();
            console.log('generateThumbnailsAsync completed');
        } else {
            console.warn('generateThumbnailsAsync is not defined');
        }

        console.log('Calling renderPageAsImage for page:', this.currentPage);
        await this.renderPageAsImage(this.currentPage);
        console.log(
            'renderPageAsImage completed. imageSrc available?',
            !!this.imageSrc,
            'imageSrc length:',
            this.imageSrc ? this.imageSrc.length : 0
        );

        await this.loadCustomFields();
    } catch (error) {
        console.error('Error loading PDF:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);

        if (error?.name) {
            console.error('Error name:', error.name);
        }

        this.showToast(
            'Error',
            error?.message || 'Failed to load PDF.',
            'error'
        );
    } finally {
        this.isLoading = false;
        this.showSpinner = false;
        console.log('loadPdf finished. isLoading:', this.isLoading, 'showSpinner:', this.showSpinner);
        console.groupEnd();
    }
}

async renderPageAsImage(pageNumber) {
  const t0 = performance.now();
  this._log('renderPageAsImage:start', { pageNumber });

  try {
    this._time('getPage');
    const page = await this.pdfDoc.getPage(pageNumber);
    this._timeEnd('getPage');

    const vp1 = page.getViewport({ scale: 1 });
    this._pagePt = { w: vp1.width, h: vp1.height };
    if (!this._pageDimensionsCache) {
      this._pageDimensionsCache = new Map();
    }
    this._pageDimensionsCache.set(pageNumber, this._pagePt);
    this._log('pagePt (PDF points)', this._pagePt);

    const containerEl = this.template.querySelector('.pdf-viewer-container-input');
    const targetCssW = containerEl ? Math.max(1, containerEl.clientWidth) : 1024;
    const scale = targetCssW / vp1.width;

    const viewport = page.getViewport({ scale });

    // Cap DPR
    const deviceDpr = window.devicePixelRatio || 1;
    const dpr = Math.min(deviceDpr, 1.25);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    canvas.width  = Math.floor(viewport.width  * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width  = `${Math.round(viewport.width)}px`;
    canvas.style.height = `${Math.round(viewport.height)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this._log('preview sizing', {
      containerCssW: targetCssW,
      scale,
      viewportCss: { w: viewport.width, h: viewport.height },
      dpr: { capped: dpr, device: deviceDpr },
      canvasPx: { w: canvas.width, h: canvas.height },
      megapixels: ((canvas.width * canvas.height) / 1e6).toFixed(2),
    });

    this._time('pdfjs:render');
    await page.render({ canvasContext: ctx, viewport }).promise;
    this._timeEnd('pdfjs:render');

    this._previewCss = { w: viewport.width, h: viewport.height };
    this._previewPx  = { w: canvas.width,  h: canvas.height  };

    // async encode (JPEG)
    this._time('encode:toBlob+FileReader');
    const dataUrl = await new Promise(resolve => {
      canvas.toBlob(blob => {
        if (!blob) {
          this._warn('toBlob produced null blob; falling back to PNG dataURL');
          // fallback (sync; heavy) only if needed
          const du = canvas.toDataURL('image/png');
          resolve(du);
          return;
        }
        this._log('jpeg blob size (bytes)', blob.size);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.92);
    });
    this._timeEnd('encode:toBlob+FileReader');

    this.imageSrc = dataUrl;

    // Yield to next frame before styles to avoid blocking
    requestAnimationFrame(() => {
      this._time('_updateAllPlaceholderStyles');
      this._updateAllPlaceholderStyles();
      this._timeEnd('_updateAllPlaceholderStyles');

      const t1 = performance.now();
      this._log('renderPageAsImage:end', {
        pageNumber,
        totalMs: Math.round(t1 - t0),
      });
    });
  } catch (error) {
    console.error(`Error rendering page ${pageNumber}:`, error);
    this.showToast('Error', `Failed to render page ${pageNumber}.`, 'error');
  }
}

    getFormattedDisplayValue(value, isDateType) {
      if (!value) return '';
      if (isDateType) {
        const ddMmYyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
        if (ddMmYyyyRegex.test(value)) {
          return value;
        }
        const isProbablyDate = /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value);
        if (isProbablyDate && !isNaN(Date.parse(value))) {
          const d = new Date(value);
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const y = d.getFullYear();
          return `${day}-${m}-${y}`;
        }
      }
      return value;
    }

    getPlaceholderMaxChars(placeholder) {
      let w = placeholder.w;
      if (w == null && placeholder.wPt != null && this._pagePt) {
        w = (placeholder.wPt / this._pagePt.w) * 1024;
      }
      if (w == null) {
        w = 150;
      }
      const usableWidth = Math.max(10, w - 20);
      let fontSize = 18;
      if (placeholder.textStyle && placeholder.textStyle.fontSize) {
        fontSize = parseInt(placeholder.textStyle.fontSize, 10) || 18;
      }
      const avgCharWidth = fontSize * 0.42;
      return Math.max(1, Math.floor(usableWidth / avgCharWidth));
    }

    normalizePlaceholderForStyles(raw) {
  const placeholder = { ...raw };
  placeholder.maxChars = this.getPlaceholderMaxChars(placeholder);

  const isSig = placeholder.isSignature || placeholder.isCustomSignature || placeholder.type === 'Signature' || placeholder.placeholderType === 'Signature';
  placeholder.containerClass = isSig 
    ? 'placeholder-container signature-container-block' 
    : 'placeholder-container';
  placeholder.containerClassMeasurable = isSig
    ? 'placeholder-container measurable-placeholder signature-container-block'
    : 'placeholder-container measurable-placeholder';

  // Existing container style (keep your dashed border for non-image)
  placeholder.style = this._buildCreatorStyle(placeholder, placeholder.x, placeholder.y);

  // Default text style (matches what you used in templateCreator)
  const defaultTextStyle = {
    fontFamily: 'Calibri, Arial, sans-serif',
    fontSize: '18',      // px as string
    bold: false,
    italic: false,
    underline: false,
    color: '#000000'
  };

  const ts = { ...defaultTextStyle, ...(placeholder.textStyle || {}) };

  placeholder.textStyle = ts;

  const fontWeight = placeholder.customInlineStyle ? (ts.bold ? '700' : '400') : '500';
  const fontStyle  = ts.italic ? 'italic' : 'normal';
  const textDecor  = ts.underline ? 'underline' : 'none';
  const color      = ts.color || '#000000';

  // This string will be bound directly to <input style={placeholder.inputStyle}>
  placeholder.inputStyle =
    `font-family:${ts.fontFamily};` +
    `font-size:${ts.fontSize}px;` +
    `font-weight:${fontWeight};` +
    `font-style:${fontStyle};` +
    `text-decoration:${textDecor};` +
    `text-align:${ts.align || 'left'};` +
    `color:${color};`;

  const isAddress = !placeholder.isSignature && !!placeholder.isAddress;
  let justify = 'flex-start';
  if (ts.align === 'center') {
    justify = 'center';
  } else if (ts.align === 'right') {
    justify = 'flex-end';
  }

  placeholder.textStyleCss =
    placeholder.inputStyle +
    `width:100%;` +
    `height:100%;` +
    `box-sizing:border-box;` +
    `white-space:${isAddress ? 'pre-wrap' : 'nowrap'};` +
    `word-break:${isAddress ? 'break-word' : 'normal'};` +
    `overflow:hidden;` +
    `display:flex;` +
    `align-items:center;` +
    `justify-content:${justify};`;

  const isDateType = placeholder.isDate || placeholder.isDateOfSigning;
  placeholder.displayValue = this.getFormattedDisplayValue(placeholder.value, isDateType);

  // (Optional) for canvas convenience
  placeholder.fontFamily = ts.fontFamily;
  placeholder.fontColor  = color;
  placeholder.fontWeight = fontWeight;
  placeholder.fontStyle  = fontStyle;
  placeholder.underline  = !!ts.underline;

  return placeholder;
}

_normalizePlaceholderPts(ph) {
  // Only normalize if we have page points and placeholder has xPt/yPt
  if (!ph || this._pagePt == null || ph.xPt == null || ph.yPt == null) return ph;

  const pageW = this._pagePt.w, pageH = this._pagePt.h;

  let xPt = ph.xPt;
  let yPt = ph.yPt;
  let wPt = ph.wPt;
  let hPt = ph.hPt;

  // Heuristic: values larger than the page are very likely stored in 1024×1448 "pseudo points"
  const FALLBACK_W = 1024;
  const FALLBACK_H = 1448;

  const looksOutOfBounds =
    ph.xPt > pageW * 1.001 || ph.yPt > pageH * 1.001 || ph.xPt < 0 || ph.yPt < 0;

  if (looksOutOfBounds) {
    const rx = pageW / FALLBACK_W;
    const ry = pageH / FALLBACK_H;
    xPt = ph.xPt * rx;
    yPt = ph.yPt * ry;
    wPt = ph.wPt != null ? ph.wPt * rx : wPt;
    hPt = ph.hPt != null ? ph.hPt * ry : hPt;
  }

  // Self-healing for standard demographic text fields
  const isStandardText =
    ph.isName || ph.isFirstName || ph.isLastName || ph.isFullName ||
    ph.isEmail || ph.isContactNumber || ph.isABN || ph.isTFN ||
    ph.isDate || ph.isDateOfSigning || ph.isTime;

  if (isStandardText) {
    const wVal = ph.w;
    if (
      wVal === 177 || wVal === 200 || wVal === 260 || wVal === 180 ||
      wPt == null || hPt == null
    ) {
      ph.w = 205;
      ph.h = 37;
      wPt = (205 / 1024) * pageW;
      hPt = (37 / 1448) * pageH;
    }
  }

  return {
    ...ph,
    xPt,
    yPt,
    wPt,
    hPt
  };
}

_updateAllPlaceholderStyles() {
  const img = this.template.querySelector('.image-container-input img');
  if (!img || !this._pagePt) {
    this._log('_updateAllPlaceholderStyles:skip', { hasImg: !!img, hasPagePt: !!this._pagePt });
    return;
  }

  const rect = img.getBoundingClientRect();
  const cur = this.currentPage;

  const t0 = performance.now();
  let recomputed = 0;

  // Normalize flat list
  const next = this.placeholders.map(ph => {
    let normalized = this._normalizePlaceholderPts(ph);
    if (normalized && !normalized.isSignature && !normalized.isCustomSignature) {
      normalized.maxChars = this.getPlaceholderMaxChars(normalized);
    }
    if (normalized.page === cur) {
      recomputed++;
      const style = this.getPlaceholderStyle(normalized, rect);
      console.log('[DEBUG_PLACEHOLDER_STYLE] id:', normalized.id, {
        wPt: normalized.wPt,
        hPt: normalized.hPt,
        xPt: normalized.xPt,
        yPt: normalized.yPt,
        w: normalized.w,
        h: normalized.h,
        scaleX: rect.width / (this.getPageDimensions(normalized.page)?.w || 1024),
        scaleY: rect.height / (this.getPageDimensions(normalized.page)?.h || 1448),
        style: style
      });
      return { ...normalized, style };
    }
    return normalized;
  });
  this.placeholders = next;

  // Normalize paged map
  const list = (this.placeholdersByPage?.[cur] ?? []).map(ph => {
    let normalized = this._normalizePlaceholderPts(ph);
    if (normalized && !normalized.isSignature && !normalized.isCustomSignature) {
      normalized.maxChars = this.getPlaceholderMaxChars(normalized);
    }
    return { ...normalized, style: this.getPlaceholderStyle(normalized, rect) };
  });
  this.placeholdersByPage = { ...this.placeholdersByPage, [cur]: list };

  const t1 = performance.now();
  this._log('_updateAllPlaceholderStyles:end', {
    cur,
    recomputed,
    ms: Math.round(t1 - t0)
  });
}


    handlePlaceholderInputChange(event) {
        const placeholderId = event.target.dataset.id;
        const placeholder = this.placeholders.find(
            (item) => item.id === parseInt(placeholderId, 10)
        );
        if (placeholder) {
            placeholder.value = event.target.value; // Update the value in the placeholder
            console.log(`Updated placeholder ${placeholderId}: ${placeholder.value}`);
        }
    }

    // handleSave() {
    //     const nameInput = this.template.querySelector('.placeholder-input');
    //     const nameValue = nameInput ? nameInput.value : '';
    
    //     if (!nameValue) {
    //         this.showToast('Error', 'Name input is empty.', 'error');
    //         return;
    //     }
    
    //     const recordId = this.selectedRecordId || this.recordId; // Fallback to recordId if selectedRecordId is not set
    
    //     if (!recordId) {
    //         console.error('No record selected. Cannot save name.');
    //         this.showToast('Error', 'No record selected. Please select a record first.', 'error');
    //         return;
    //     }
    
    //     console.log(`Saving name "${nameValue}" to pdfID__c for recordId: ${recordId}`);
    
    //     updateNameInPdfId({ name: nameValue, recordId })
    //         .then(() => {
    //             console.log('Name saved successfully in pdfID__c.');
    //             this.showToast('Success', 'Name saved successfully!', 'success');
    //         })
    //         .catch((error) => {
    //             console.error('Error saving name in pdfID__c:', error);
    //             this.showToast('Error', `Failed to save name: ${error.body.message || error.message}`, 'error');
    //         });
    // }

  handleResizeStart(event) {
    event.preventDefault();
    event.stopPropagation();

    const id = event.target.dataset.id;
    if (!id) {
        return;
    }

    const ph = this.placeholders.find(
        (p) => p.id === parseInt(id, 10)
    );

    if (!ph || ph.isSignature || ph.isCustomSignature) {
        return;
    }

    this._resizing = true;
    this._currentResizingPlaceholder = ph;
    this._resizeStartX = event.clientX;

    const el = this.template.querySelector(
        `.placeholder-container[data-id="${id}"]`
    );
    this._resizeStartWidth = el
        ? el.getBoundingClientRect().width
        : (ph.w || 150);

    this._boundResizeMove = this.handleResizeMove.bind(this);
    this._boundResizeEnd = this.handleResizeEnd.bind(this);

    window.addEventListener("mousemove", this._boundResizeMove);
    window.addEventListener("mouseup", this._boundResizeEnd);
  }

  handleResizeMove(event) {
    if (!this._resizing || !this._currentResizingPlaceholder) {
        return;
    }
     this.suppressNextClick = true;

    const ph = this._currentResizingPlaceholder;
    const deltaX = event.clientX - this._resizeStartX;
    const imgEl = this.template.querySelector('.image-container img');
    if (!imgEl) {
        return;
    }
    const rect = imgEl.getBoundingClientRect();

    let newWidth = this._resizeStartWidth + deltaX;
    const maxWidth = rect.width - ph.x;
    newWidth = Math.max(100, Math.min(newWidth, maxWidth));

    ph.w = Math.round(newWidth);

    ph.style = this._buildCreatorStyle(ph, ph.x, ph.y);

    this.placeholders = [...this.placeholders];
  }

  handleResizeEnd(event) {
    if (!this._resizing) {
        return;
    }
    this.suppressNextClick = true;

    const ph = this._currentResizingPlaceholder;
    if (ph) {
      const imgEl = this.template.querySelector('.image-container img');
      const rect = imgEl ? imgEl.getBoundingClientRect() : null;
      if (rect && this._pagePt) {
        ph.wPt = (ph.w / rect.width) * this._pagePt.w;
        ph.hPt = (ph.h / rect.height) * this._pagePt.h;
      }

      ph.style = this._buildCreatorStyle(ph, ph.x, ph.y);

      this._commitPlaceholderPosition(ph);
    }

    this._resizing = false;
    this._currentResizingPlaceholder = null;

    window.removeEventListener("mousemove", this._boundResizeMove);
    window.removeEventListener("mouseup", this._boundResizeEnd);
  }

checkTextFitsPlaceholder(placeholder, text) {
  if (!placeholder) return { fits: true, textWidth: 0, availableWidth: 0 };

  const container = this.template.querySelector(`[data-id="${placeholder.id}"]`);
  const placeholderWidth = container ? container.getBoundingClientRect().width : (placeholder.w || 150);

  // Reserve 28px (8px left padding + 20px right padding for edit icon)
  const availablePlaceholderWidth = Math.max(0, placeholderWidth - 28);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  const defaultTextStyle = {
    fontFamily: 'Calibri, Arial, sans-serif',
    fontSize: '20',
    bold: false,
    italic: false,
    underline: false,
    color: '#000000'
  };
  const ts = { ...defaultTextStyle, ...(placeholder.textStyle || {}) };
  const fontStyle = ts.italic ? 'italic' : 'normal';
  const fontWeight = placeholder.fontWeight || (ts.bold ? '700' : '500');
  const fontSize = `${ts.fontSize}px`;
  const fontFamily = ts.fontFamily;

  context.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  const textWidth = context.measureText(text).width;

  return {
    fits: textWidth <= availablePlaceholderWidth,
    textWidth,
    availableWidth: availablePlaceholderWidth
  };
}

    getPlaceholderStyle(placeholder, rectOpt) {
  const imgRect = rectOpt || this.template.querySelector('.image-container-input img')?.getBoundingClientRect();
  const pagePt = this.getPageDimensions(placeholder.page);
  if (!imgRect || !pagePt) {
    return 'position:absolute; top:0; left:0;'; // safe fallback
  }

  // Scale from page points → current CSS pixels
  const scaleX = imgRect.width  / pagePt.w;
  const scaleY = imgRect.height / pagePt.h;

  // Positions: if you already store x/y in page points, use them; else derive once
  // (Fallback for your old 1024×1448 coords)
  const xPt = (placeholder.xPt != null)
    ? placeholder.xPt
    : (placeholder.x != null ? (placeholder.x / 1024) * pagePt.w : 0);
  const yPt = (placeholder.yPt != null)
    ? placeholder.yPt
    : (placeholder.y != null ? (placeholder.y / 1448) * pagePt.h : 0);

  const leftCss = Math.round(xPt * scaleX);
  const topCss  = Math.round(yPt * scaleY);

  const isSignature = placeholder.isSignature || placeholder.isCustomSignature || placeholder.type === 'Signature' || placeholder.placeholderType === 'Signature';
  const hasRenderedImage = !!(placeholder.hasImage || placeholder.canvasData || placeholder.base64Data);
  const wCss = (!isSignature && hasRenderedImage && placeholder.wPt != null) ? Math.round(placeholder.wPt * scaleX)
             : (!isSignature && hasRenderedImage && placeholder.cssW != null) ? Math.round(placeholder.cssW) : undefined;
  const hCss = (!isSignature && hasRenderedImage && placeholder.hPt != null) ? Math.round(placeholder.hPt * scaleY)
             : (!isSignature && hasRenderedImage && placeholder.cssH != null) ? Math.round(placeholder.cssH) : undefined;

  let style = `position:absolute; left:${leftCss}px; top:${topCss}px;`;


  // if (wCss != null) style += ` width:${wCss}px;`;
  // if (hCss != null) style += ` height:${hCss}px;`;

  if (wCss != null) {
    style += ` width:${wCss}px;`;
}

const isMultiline =
    placeholder.isAddress ||
    placeholder.isCustomAddress ||
    placeholder.isTextArea ||
    placeholder.isCustomTextArea;

if (isMultiline) {

    const text = placeholder.value || '';

    const lineHeight = 24;   // adjust to your font
    const charsPerLine = Math.max(1, Math.floor((wCss || 180) / 10));
    const lines = Math.max(
        1,
        text.split('\n').reduce((sum, line) =>
            sum + Math.ceil(line.length / charsPerLine), 0)
    );

    const autoHeight = Math.max(hCss || 37, lines * lineHeight + 12);

    style += `height:${autoHeight}px;`;

} else if (hCss != null) {

    style += `height:${hCss}px;`;

}



  return style;
}



    // Debounce timeout
debounceTimer = null;

debounceTimers = {}; // already present

getSrcFieldForPlaceholder(placeholder) {
    if (!placeholder) return '';

    if (placeholder.isName) return 'NameSrc';
    if (placeholder.isFirstName) return 'FNimageSrc';
    if (placeholder.isLastName) return 'LNimageSrc';
    if (placeholder.isInitials) return 'INimageSrc';
    if (placeholder.isFullName) return 'FullNameSrc';
    if (placeholder.isEmail) return 'EmailSrc';
    if (placeholder.isContactNumber) return 'PhoneSrc';
    if (placeholder.isAddress) return 'AddressSrc';
    if (placeholder.isDate) return 'DateSrc';
    if (placeholder.isDateOfSigning) return 'DateOfSigningSrc';
    if (placeholder.isTime) return 'TimeSrc';
    if (placeholder.isABN) return 'AbnSrc';
    if (placeholder.isTFN) return 'TfnSrc';

    if (placeholder.isQuoteNumber) return 'QuoteNumberSrc';
    if (placeholder.isTotalAmount) return 'TotalAmountSrc';
    if (placeholder.isStartDate) return 'StartDateSrc';
    if (placeholder.isEndDate) return 'EndDateSrc';
    if (placeholder.isSerialNumber) return 'SerialNumberSrc';
    if (placeholder.isServiceName) return 'ServiceNameSrc';
    if (placeholder.isServiceNumber) return 'ServiceNumberSrc';
    if (placeholder.isQuantity) return 'QuantitySrc';
    if (placeholder.isUnitPrice) return 'UnitPriceSrc';
    if (placeholder.isAmount) return 'AmountSrc';

    if (placeholder.isCustomField) return 'CustomFieldSrc';
    if (placeholder.isSignature || placeholder.isCustomSignature) return 'imageSrc';

    return '';
}

getSuccessMessageForPlaceholder(placeholder) {
    if (!placeholder) return 'Field updated successfully!';

    if (placeholder.isName) return 'Name updated successfully!';
    if (placeholder.isFirstName) return 'First Name updated successfully!';
    if (placeholder.isLastName) return 'Last Name updated successfully!';
    if (placeholder.isInitials) return 'Initials updated successfully!';
    if (placeholder.isFullName) return 'Full Name updated successfully!';
    if (placeholder.isEmail) return 'Email updated successfully!';
    if (placeholder.isContactNumber) return 'Contact Number updated successfully!';
    if (placeholder.isAddress) return 'Address updated successfully!';
    if (placeholder.isDate) return 'Date updated successfully!';
    if (placeholder.isDateOfSigning) return 'Date of Signing updated successfully!';
    if (placeholder.isTime) return 'Time updated successfully!';
    if (placeholder.isABN) return 'ABN updated successfully!';
    if (placeholder.isTFN) return 'TFN updated successfully!';

    if (placeholder.isQuoteNumber) return 'Quote Number updated successfully!';
    if (placeholder.isTotalAmount) return 'Total Amount updated successfully!';
    if (placeholder.isStartDate) return 'Start Date updated successfully!';
    if (placeholder.isEndDate) return 'End Date updated successfully!';
    if (placeholder.isSerialNumber) return 'Serial Number updated successfully!';
    if (placeholder.isServiceName) return 'Service Name updated successfully!';
    if (placeholder.isServiceNumber) return 'Service Number updated successfully!';
    if (placeholder.isQuantity) return 'Quantity updated successfully!';
    if (placeholder.isUnitPrice) return 'Unit Price updated successfully!';
    if (placeholder.isAmount) return 'Amount updated successfully!';

    if (placeholder.isCustomField) {
        return `${placeholder.customLabel || 'Custom field'} updated successfully!`;
    }

    return 'Field updated successfully!';
}

applyPlaceholderValue(placeholderId, newValue, srcField, successMessage, debounceMs = 0) {
    const key = String(placeholderId);
    const normalizedValue = newValue ?? '';

    const ph = this.placeholders?.find(p => String(p.id) === key);
    if (!ph) {
        console.warn(`[AUTO-FILL] Placeholder with ID ${key} not found.`);
        return;
    }

    ph.value = normalizedValue;

    this.placeholders = this.placeholders.map(p =>
        String(p.id) === key ? { ...p, value: normalizedValue } : p
    );

    const pageNumber = ph.page || this.currentPage || 1;
    const currentPageArr = this.placeholdersByPage[pageNumber];
    if (currentPageArr) {
        this.placeholdersByPage = {
            ...this.placeholdersByPage,
            [pageNumber]: currentPageArr.map(p =>
                String(p.id) === key ? { ...p, value: normalizedValue } : p
            )
        };
    }

    this.markPageDirty(pageNumber);
    console.log('[AUTO-FILL] value applied -> marked dirty page', pageNumber, 'phId', key, 'value', normalizedValue);

    if (!this.debounceTimers) {
        this.debounceTimers = {};
    }
    clearTimeout(this.debounceTimers[key]);

    this.debounceTimers[key] = setTimeout(async () => {
        try {
            const placeholder = this.placeholders.find(item => String(item.id) === key);
            if (!placeholder) {
                console.warn(`[AUTO-FILL] Placeholder with ID ${key} not found at render time.`);
                return;
            }

            await this.updatePlaceholderWithCanvas(
                placeholder,
                srcField,
                successMessage
            );

            const finalPageNumber = placeholder.page || this.currentPage || 1;
            this.markPageDirty(finalPageNumber);

            console.log(
                '[AUTO-FILL] post-update -> marked dirty page',
                finalPageNumber,
                'phId',
                placeholder.id
            );
        } catch (e) {
            console.error('[AUTO-FILL] canvas update failed for placeholder', key, e);
        } finally {
            delete this.debounceTimers[key];
        }
    }, debounceMs);
}


handleFNameInputChange(event) { // First Name
    this.handleInputChange(event, 'FNimageSrc', 'First Name updated successfully!');
}

handleLNameInputChange(event) { // Last Name
    this.handleInputChange(event, 'LNimageSrc', 'Last Name updated successfully!');
}
handleInitialsInputChange(event) {
    const placeholderId = event.target.dataset.id; // Get the ID of the placeholder
    const newValue = event.target.value; // Get the selected value from the dropdown

    // Find the placeholder by ID
    const placeholder = this.placeholders.find(
        (item) => item.id === parseInt(placeholderId, 10)
    );

    if (!placeholder) {
        this.showToast('Error', 'Placeholder not found.', 'error');
        return;
    }

    // Update the placeholder value with the selected dropdown value
    placeholder.value = newValue;

    // Dynamically determine the appropriate source field for the canvas
    let srcField = '';
    if (placeholder.isName) srcField = 'FNimageSrc';
    else if (placeholder.isLastName) srcField = 'LNimageSrc';
    else if (placeholder.isInitials) srcField = 'INimageSrc';

    if (!srcField) {
        this.showToast('Error', 'Unsupported placeholder type for editing.', 'error');
        return;
    }

    // Programmatically simulate opening the modal and saving the value
    this.currentPlaceholderId = placeholder.id;
    this.currentSrcField = srcField;
    this.editableText = newValue;

    // Directly trigger save logic without showing the modal
    this.saveEditedText();
}


handleFullNameInputChange(event) { // Full Name
    this.handleInputChange(event, 'FullNameSrc', 'Full Name updated successfully!');
}

handleEmailInputChange(event) { // Email
    this.handleInputChange(event, 'EmailSrc', 'Email updated successfully!');
}

handlePhoneInputChange(event) { // Contact Number
    event.target.value = event.target.value.replace(/\D/g, '');
    this.handleInputChange(event, 'PhoneSrc', 'Contact Number updated successfully!');
}

handleAddressInputChange(event) { // Address
    this.handleInputChange(event, 'AddressSrc', 'Address updated successfully!');
}

handleDateInputChange(event) { // Date
    this.handleInputChange(event, 'DateSrc', 'Date updated successfully!');
}

handleDateOfSigningInputChange(event) { // Date of Signing
    this.handleInputChange(event, 'DateOfSigningSrc', 'Date of Signing updated successfully!');
}
handleAbnInputChange(event) {
  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 11);

  this.handleInputChange(event, 'AbnSrc', 'ABN updated successfully!');
}
handleTimeInputChange(event) {
    this.handleInputChange(event, 'TimeSrc', 'Time updated successfully!');
}

handleTfnInputChange(event) {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 9);
    this.handleInputChange(event, 'TfnSrc', 'TFN updated successfully!');
}

handleQuoteNumberInputChange(event) {
    this.handleInputChange(event, 'QuoteNumberSrc', 'Quote Number updated successfully!');
}
handleTotalAmountInputChange(event) {
    this.handleInputChange(event, 'TotalAmountSrc', 'Total Amount updated successfully!');
}
handleStartDateInputChange(event) {
    this.handleInputChange(event, 'StartDateSrc', 'Start Date updated successfully!');
}
handleEndDateInputChange(event) {
    this.handleInputChange(event, 'EndDateSrc', 'End Date updated successfully!');
}
handleSerialNumberInputChange(event) {
    event.target.value = event.target.value.replace(/\D/g, '');
    this.handleInputChange(event, 'SerialNumberSrc', 'Serial Number updated successfully!');
}
handleServiceNameInputChange(event) {
    this.handleInputChange(event, 'ServiceNameSrc', 'Service Name updated successfully!');
}
handleServiceNumberInputChange(event) {
    this.handleInputChange(event, 'ServiceNumberSrc', 'Service Number updated successfully!');
}
handleQuantityInputChange(event) {
    event.target.value = event.target.value.replace(/\D/g, '');
    this.handleInputChange(event, 'QuantitySrc', 'Quantity updated successfully!');
}
handleUnitPriceInputChange(event) {
    this.handleInputChange(event, 'UnitPriceSrc', 'Unit Price updated successfully!');
}
handleAmountInputChange(event) {
    this.handleInputChange(event, 'AmountSrc', 'Amount updated successfully!');
}

handleCustomFieldInputChange(event) {
    this.handleInputChange(
        event,
        'CustomFieldSrc',
        'Custom field updated successfully!'
    );
}


handleInputChange(event, srcField, successMessage) {
  const placeholderId = event.target.dataset.id;
  const key = String(placeholderId);
  let newValue = event.target.value ?? '';

  // 🔹 1) Find placeholder and UPDATE VALUE IMMEDIATELY
  const ph = this.placeholders?.find(p => String(p.id) === key);
  if (ph) {
    const skipWidthValidation =
    ph.isAddress ||
    ph.isCustomAddress ||
    ph.isTextArea ||
    ph.isCustomTextArea;

if (!ph.isSignature && !ph.isCustomSignature && !skipWidthValidation) {

      const check = this.checkTextFitsPlaceholder(ph, newValue);
      if (!check.fits) {
        const oldCheck = this.checkTextFitsPlaceholder(ph, ph.value ?? '');
        const oldOverflows = !oldCheck.fits;
        const shouldBlock = !oldOverflows || (newValue.length > (ph.value ?? '').length) || (check.textWidth > oldCheck.textWidth);
        if (shouldBlock) {
          newValue = ph.value ?? '';
          event.target.value = newValue;
          this.showToast('Warning', 'Maximum text width reached for this field.', 'warning');
        }
      }
    } else {
      this.adjustInputWidth(event.target);
    }

    ph.value = newValue;

    if (
        ph.isAddress ||
        ph.isCustomAddress ||
        ph.isTextArea ||
        ph.isCustomTextArea
    ) {
        this.adjustPlaceholderHeight(ph.id);
    }

    // keep arrays in sync so rerenders use the new value
    this.placeholders = this.placeholders.map(p =>
      p.id === ph.id ? { ...p, value: newValue } : p
    );

    const pageNumber = ph.page || this.currentPage || 1;
    const currentPageArr = this.placeholdersByPage[pageNumber];
    if (currentPageArr) {
      this.placeholdersByPage = {
        ...this.placeholdersByPage,
        [pageNumber]: currentPageArr.map(p =>
          p.id === ph.id ? { ...p, value: newValue } : p
        )
      };
    }

    this.markPageDirty(pageNumber);
    console.log('[DIFF] input change -> marked dirty page', pageNumber, 'phId', key);
  }

  // 🔹 2) Debounce ONLY the heavy canvas generation for this placeholder
  if (!this.debounceTimers) {
    this.debounceTimers = {};
  }
  clearTimeout(this.debounceTimers[key]);

  this.debounceTimers[key] = setTimeout(async () => {
    try {
      const placeholder = this.placeholders.find(
        item => item.id === parseInt(key, 10)
      );
      if (!placeholder) {
        console.warn(`Placeholder with ID ${key} not found.`);
        return;
      }

      // use the value already stored on the placeholder
      const finalValue = placeholder.value ?? '';
      if (finalValue === '' && finalValue !== newValue) {
        console.log('Skipping canvas update; empty value.');
      }

      await this.updatePlaceholderWithCanvas(
        placeholder,
        srcField,
        successMessage
      );

      const pageNumber = placeholder.page || this.currentPage || 1;
      this.markPageDirty(pageNumber);
      console.log(
        '[DIFF] post-update -> marked dirty page',
        pageNumber,
        'phId',
        placeholder.id
      );
    } finally {
      delete this.debounceTimers[key];
    }
  }, 2000);
}

allowOnlyNumbers(event) {
    const key = event.key;
    if (!/^\d$/.test(key)) {
        event.preventDefault();
    }
}

adjustPlaceholderHeight(placeholderId) {
    requestAnimationFrame(() => {
        const container = this.template.querySelector(
            `[data-id="${placeholderId}"]`
        );

        if (!container) return;

        // Reset first so height can shrink as well
        container.style.height = 'auto';

        // Add a little padding
        container.style.height = `${container.scrollHeight + 8}px`;
    });
}


adjustInputWidth(inputElement) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set the font to match the input element's style
    const computedStyle = window.getComputedStyle(inputElement);
    context.font = computedStyle.font;

    // Measure the width of the input's value
    const textWidth = context.measureText(inputElement.value).width;

    // Add some padding to the calculated width
    const padding = parseInt(computedStyle.paddingLeft, 10) + parseInt(computedStyle.paddingRight, 10);
    const border = parseInt(computedStyle.borderLeftWidth, 10) + parseInt(computedStyle.borderRightWidth, 10);
    const newWidth = textWidth + padding + border;

    // Apply the new width to the input field
    inputElement.style.width = `${newWidth}px`;
}
@track debugFontLogs= true;

async updatePlaceholderWithCanvas(placeholder, srcField, successMessage) {
  // DEBUG toggle (non-invasive)
  const DEBUG_FONT = (this && typeof this.debugFontLogs !== 'undefined') ? !!this.debugFontLogs : true;

  if (!placeholder) {
    this.showToast('Error', 'No placeholder found to update.', 'error');
    return;
  }

  const el =
    this.template.querySelector(`[data-placeholder-id="${placeholder.id}"]`) ||
    this.template.querySelector(`[data-id="${placeholder.id}"]`);

  let desiredFontPx = placeholder.fontSize || 15;
  if (DEBUG_FONT) {
    console.log('[FONT] seed desiredFontPx:', desiredFontPx, 'placeholder.id:', placeholder && placeholder.id);
  }

  // --- helper: find stable wrapper for measurement ---
  const resolveMeasureEl = (el, id) => {
    return (
      this.template.querySelector(`[data-ph-box="${id}"]`) || // optional explicit wrapper
      el?.closest('.placeholder-box') ||                      // your dashed box container
      el                                                     // fallback (input) if nothing else
    );
  };

  let natW = 0;
  let natH = 0;

  try {
    if (this.pdfDoc && this.currentPage && el && this.imageSrc) {
      const page = await this.pdfDoc.getPage(this.currentPage);
      const vp1 = page.getViewport({ scale: 1 });
      this._pagePt = { w: vp1.width, h: vp1.height };
      if (DEBUG_FONT) {
        console.log('[FONT] viewport (pt):', { w: vp1.width, h: vp1.height }, 'currentPage:', this.currentPage);
      }

      const imgEl = this.template.querySelector('.image-container-input img');
      if (imgEl) {
        const baseImg = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = this.imageSrc;
        });
        natW = baseImg.naturalWidth || baseImg.width;
        natH = baseImg.naturalHeight || baseImg.height;

        // 🕐 wait for layout to settle before measuring
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const measureEl = resolveMeasureEl(el, placeholder.id);
        const imgRect = imgEl.getBoundingClientRect();

        const isSig = placeholder.isSignature || placeholder.isCustomSignature || placeholder.type === 'Signature' || placeholder.placeholderType === 'Signature';
        // ✅ If we already have page-points, force the wrapper to the steady-state CSS size
        if (
          !isSig &&
          Number.isFinite(placeholder.wPt) &&
          Number.isFinite(placeholder.hPt) &&
          this._pagePt &&
          this._pagePt.w > 0 &&
          this._pagePt.h > 0
        ) {
          const cssW = Math.round(placeholder.wPt * (imgRect.width  / this._pagePt.w));
          const cssH = Math.round(placeholder.hPt * (imgRect.height / this._pagePt.h));
          measureEl.style.width  = `${cssW}px`;
          measureEl.style.height = `${cssH}px`;
          if (DEBUG_FONT) console.log('[FONT] forced measureEl to steady-state css box:', { cssW, cssH });
        }

        const rect = measureEl.getBoundingClientRect();

        const pxPerPtX = natW / vp1.width;
        const pxPerPtY = natH / vp1.height;

        const cxCss = rect.x + rect.width / 2;
        const cyCss = rect.y + rect.height / 2;

        const xPtProbe = (cxCss - imgRect.x) / pxPerPtX;
        const yPtProbe = vp1.height - ((cyCss - imgRect.y) / pxPerPtY);

        if (DEBUG_FONT) {
          console.log('[FONT] base image nat(px):', { natW, natH });
          console.log('[FONT] measureEl rect:', rect);
          console.log('[FONT] probe point in PDF (pt):', { xPtProbe, yPtProbe });
        }

        const tc = await page.getTextContent();
        let best = null,
            bestDist = Infinity;
        for (const it of tc.items) {
          const [, , , , e, f] = it.transform;
          const dx = e - xPtProbe, dy = f - yPtProbe;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) { best = it; bestDist = dist; }
        }

        if (DEBUG_FONT) {
          console.log('[FONT] nearest text item:', best ? { transform: best.transform, bestDist } : 'none');
        }
        if (best) {
          // 🔎 exact text + font logs (non-invasive)
          if (DEBUG_FONT) {
            try {
              const exact = (best.str ?? '').replace(/\s+/g, ' ');
              console.log('[FONT] nearest text .str :', JSON.stringify(exact));
              if (best.fontName) console.log('[FONT] nearest fontName  :', best.fontName);
            } catch (e) {
              console.warn('[FONT] nearest text logging failed:', e);
            }
          }

          const [a, b, c, d] = best.transform;
          const fontPt = (Math.hypot(a, b) + Math.hypot(c, d)) / 2;
          placeholder.fontPt ??= fontPt; // ✅ persist once for stability across renders
          const pxPerPt = (natH / vp1.height);
          const derivedPx = Math.max(1, Math.round(fontPt * pxPerPt));
          if (DEBUG_FONT) {
            console.log('[FONT] font from transform -> fontPt:', fontPt, 'pxPerPt:', pxPerPt, 'derivedPx:', derivedPx);
          }
          // 🔁 this is our fallback size when there is NO custom style
          desiredFontPx = derivedPx;
        } else if (DEBUG_FONT) {
          console.log('[FONT] no nearby text; keep seed desiredFontPx:', desiredFontPx);
        }
      }
    }
  } catch (err) {
    if (DEBUG_FONT) console.warn('[FONT] probe error; keeping seed desiredFontPx:', desiredFontPx, err);
  }

  // ---------- B) Save geometry in PAGE POINTS ----------
  let xPt, yPt, wPt, hPt;
  if (el && this._pagePt) {
    const imgEl = this.template.querySelector('.image-container-input img');
    if (imgEl) {
      const wPtNum = placeholder.wPt != null ? Number(placeholder.wPt) : NaN;
      const hPtNum = placeholder.hPt != null ? Number(placeholder.hPt) : NaN;
      const xPtNum = placeholder.xPt != null ? Number(placeholder.xPt) : NaN;
      const yPtNum = placeholder.yPt != null ? Number(placeholder.yPt) : NaN;

      const alreadyHasPts =
        Number.isFinite(wPtNum) && wPtNum > 0 &&
        Number.isFinite(hPtNum) && hPtNum > 0 &&
        Number.isFinite(xPtNum) && xPtNum >= 0 &&
        Number.isFinite(yPtNum) && yPtNum >= 0;

      if (!alreadyHasPts) {
        const imgRect = imgEl.getBoundingClientRect();
        const measureEl = resolveMeasureEl(el, placeholder.id);
        const cssRect = measureEl.getBoundingClientRect();

        const scaleX = this._pagePt.w / imgRect.width;
        const scaleY = this._pagePt.h / imgRect.height;

        wPt = cssRect.width * scaleX;
        hPt = cssRect.height * scaleY;
        xPt = (cssRect.left - imgRect.left) * scaleX;
        yPt = (cssRect.top  - imgRect.top)  * scaleY;

        if (DEBUG_FONT) {
          console.log('[FONT] geometry page-pts pre-signature:', { xPt, yPt, wPt, hPt, scaleX, scaleY });
        }

        // save page-points
        placeholder.wPt = wPt;
        placeholder.hPt = hPt;
        placeholder.xPt = xPt;
        placeholder.yPt = yPt;
        // NEW: also remember CSS size for stable preview
        placeholder.cssW = cssRect.width;
        placeholder.cssH = cssRect.height;

        const _pageNumB = Number(placeholder.page) || this.currentPage || 1;
        this.markPageDirty(_pageNumB);
        if (DEBUG_FONT) {
          console.log('[FONT] geometry (first-save):', { xPt, yPt, wPt, hPt });
          console.log('[FONT] marked page dirty (geometry save):', _pageNumB, 'phId:', placeholder.id);
        }
      } else if (DEBUG_FONT) {
        console.log('[FONT] geometry: using stored page-pts', { xPt: placeholder.xPt, yPt: placeholder.yPt, wPt: placeholder.wPt, hPt: placeholder.hPt });
      }
    }
  }

  // ---------- C) Build overlay ----------
  let base64Data;

  // 🔹 SIGNATURE PATH: reuse existing image, no font recompute
  if (placeholder.isSignature || placeholder.isCustomSignature) {
    // Prefer explicit signatureDataUrl, then imageSrc, then overlaySrc, then current imageSrc
    base64Data =
      (typeof placeholder.signatureDataUrl === 'string' && placeholder.signatureDataUrl) ||
      placeholder.imageSrc ||
      placeholder.overlaySrc ||
      null;

    if (!base64Data && el && this.imageSrc) {
      base64Data = this.imageSrc;
    }

    if (DEBUG_FONT) {
      console.log('[FONT] signature path: using existing image, no text canvas. hasData:', !!base64Data);
    }

    // (optional) capture native size for aspect-ratio corrections
    if (base64Data) {
      try {
        const dim = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () =>
            resolve({
              w: img.naturalWidth || img.width,
              h: img.naturalHeight || img.height
            });
          img.onerror = reject;
          img.src = base64Data;
        });
        placeholder.sigW = dim.w;
        placeholder.sigH = dim.h;
        if (DEBUG_FONT) {
          console.log('[FONT] signature native size captured:', {
            sigW: dim.w,
            sigH: dim.h
          });
        }
      } catch (err) {
        if (DEBUG_FONT)
          console.warn('[FONT] signature dimension capture failed:', err);
      }
    }
  } else if (this.pdfDoc) {
    // 🔹 TEXT / NON-SIGNATURE PATH
    const pageNum = Number(placeholder.page) || this.currentPage || 1;
    const page = await this.pdfDoc.getPage(pageNum);
    const vp1 = page.getViewport({ scale: 1 });
    const pagePt = { w: vp1.width, h: vp1.height };

    const containerEl = this.template.querySelector('.pdf-viewer-container-input');
    const targetCssW = containerEl ? Math.max(1, containerEl.clientWidth) : 1024;
    const deviceDpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const dpr = Math.min(deviceDpr, 1.25);

    // pixels-per-point in the NATURAL (source) image space
    const pxPerPt_nat = (targetCssW * dpr) / pagePt.w;
    const ratioCssToNat = dpr;

    let destW, destH;
    const imgEl = this.template.querySelector('.image-container-input img');

    if (
      Number.isFinite(placeholder.wPt) && Number.isFinite(placeholder.hPt) &&
      placeholder.wPt > 0 && placeholder.hPt > 0
    ) {
      // ✅ steady-state: page-pts × (nat px per pt)
      destW = Math.max(1, Math.round(placeholder.wPt * pxPerPt_nat));
      destH = Math.max(1, Math.round(placeholder.hPt * pxPerPt_nat));
    } else if (el && imgEl) {
      const imgRect = imgEl.getBoundingClientRect();
      const measureEl = resolveMeasureEl(el, placeholder.id);
      const cssRect = measureEl.getBoundingClientRect();
      const ratio = (targetCssW * dpr) / imgRect.width; // CSS→natural
      destW = Math.max(1, Math.round(cssRect.width  * ratio));
      destH = Math.max(1, Math.round(cssRect.height * ratio));
    } else {
      // Fallback defaults in points:
      const fallbackWPt = Math.max(1, Number.isFinite(placeholder.wPt) ? Number(placeholder.wPt) : 120);
      const fallbackHPt = Math.max(1, Number.isFinite(placeholder.hPt) ? Number(placeholder.hPt) : 30);
      destW = Math.max(1, Math.round(fallbackWPt * pxPerPt_nat));
      destH = Math.max(1, Math.round(fallbackHPt * pxPerPt_nat));
    }

    // ✅ Font px: either from custom style OR fallback from nearest text
    const hasStyle = !!placeholder.textStyle;
    const isAddressField = !!(placeholder.isAddress || placeholder.isCustomAddress);
    let destFontPx;

    if (isAddressField) {
      const ts = placeholder.textStyle;
      const styleFontCss = ts ? (Number(ts.fontSize) || desiredFontPx || 20) : 20;
      destFontPx = Math.max(1, Math.round(styleFontCss * ratioCssToNat));
    } else if (placeholder.customInlineStyle && hasStyle && placeholder.textStyle) {
      // Use author-side fontSize, scaled from CSS px to natural px
      const ts = placeholder.textStyle;
      const styleFontCss = Number(ts.fontSize) || desiredFontPx || 15;
      destFontPx = Math.max(1, Math.round(styleFontCss * ratioCssToNat));
      if (DEBUG_FONT) {
        console.log('[FONT] using style font size from textStyle:', {
          fontSizeCss: styleFontCss,
          ratioCssToNat,
          destFontPx
        });
      }
    } else {
      // Default/un-customized text field: size font dynamically to fill 65% of the box height
      destFontPx = Math.max(12, Math.round(destH * 0.65));
      if (DEBUG_FONT) {
        console.log('[FONT] auto scaling unstyled font to fill box height:', {
          destH,
          destFontPx
        });
      }
    }

    destFontPx = Math.max(1, Math.round(destFontPx));

    placeholder._pixelW = destW;
    placeholder._pixelH = destH;

    if (DEBUG_FONT) {
      console.log('[FONT] canvas target (nat px):', { destW, destH, destFontPx });
    }

    // ---- build style-aware options for canvas ----
    const ts = placeholder.textStyle || null;

    const canvasOptions = {
      targetWidth: destW,
      targetHeight: destH,
      fontFamily: 'Calibri, Arial, sans-serif',          // fallback
      fontPx: destFontPx,
      paddingX: 0,
      align: (ts && ts.align) ? ts.align : 'left',
      vAlign: 'middle',
      pixelSpace: false,
      isAddressField: !!(placeholder.isAddress || placeholder.isCustomAddress),
      placeholderId: placeholder.id,
      placeholderType: placeholder.type || 'Text',
      pageNumber: pageNum,
      orientation: pagePt.w > pagePt.h ? 'Landscape' : 'Portrait'
    };

    if (ts) {
      canvasOptions.fontFamily = ts.fontFamily || 'Calibri, Arial, sans-serif';
      // color + style options ONLY when author provided them
      canvasOptions.color      = ts.color || '#000000';
      canvasOptions.fontWeight = placeholder.fontWeight || (ts.bold ? '700' : '400');
      canvasOptions.fontStyle  = ts.italic ? 'italic' : 'normal';
      canvasOptions.underline  = !!ts.underline;
    }
    // when !ts → Calibri, Arial, sans-serif, black, normal text; nearest-text size used above

    base64Data = this.createCanvasImage(placeholder.value || '', canvasOptions);
  } else {
    if (DEBUG_FONT) {
      console.log('[FONT] using legacy numeric path with desiredFontPx:', desiredFontPx);
    }
    // legacy: plain Calibri, fallback size
    base64Data = this.createCanvasImage(placeholder.value || 'Name', desiredFontPx, 'Calibri, Arial, sans-serif');
  }

  // ---------- D) Update state ----------
  placeholder.hasImage = true;
  placeholder[srcField] = base64Data;
  placeholder.overlaySrc = base64Data;
  placeholder = this.normalizePlaceholderForStyles(placeholder);

  if ((placeholder.isSignature || placeholder.isCustomSignature) && srcField === 'SignatureSrc') {
    placeholder.imageSrc = base64Data;
  }

  // Log overlay and image natural dimensions
  const debugImg = new Image();
  debugImg.onload = () => {
    const isLandscape = this._pagePt && this._pagePt.w > this._pagePt.h;
    const orientation = isLandscape ? 'Landscape' : 'Portrait';
    console.log('[TRACE_PIPELINE] updatePlaceholderWithCanvas:', {
      placeholderId: placeholder.id,
      placeholderType: placeholder.type || (placeholder.isSignature ? 'Signature' : 'Text'),
      pageNumber: placeholder.page || this.currentPage,
      orientation: orientation,
      overlayWidth: debugImg.width,
      overlayHeight: debugImg.height,
      naturalWidth: natW,
      naturalHeight: natH,
      destW: placeholder._pixelW,
      destH: placeholder._pixelH,
      pagePtWidth: this._pagePt?.w,
      pagePtHeight: this._pagePt?.h
    });
  };
  debugImg.src = base64Data;

  this.placeholders = this.placeholders.map(p => (String(p.id) === String(placeholder.id) ? { ...placeholder } : p));
  const current = this.placeholdersByPage[this.currentPage] || [];
  const idNum = Number(placeholder.id);
  const idx = current.findIndex(i => Number(i.id) === idNum);
  const updatedPage = idx > -1 ? [...current.slice(0, idx), { ...placeholder }, ...current.slice(idx + 1)] : [...current, { ...placeholder }];
  this.placeholdersByPage = { ...this.placeholdersByPage, [this.currentPage]: updatedPage };

  const pageNumber = Number(placeholder.page) || this.currentPage || 1;
  this.markPageDirty(pageNumber);
  if (DEBUG_FONT) {
    console.log('[FONT] marked page dirty (post-update):', pageNumber, 'phId:', placeholder.id);
  }

  // NEW: immediately recompute placeholder styles so size is correct
  try {
    const img = this.template.querySelector('.image-container-input img');
    if (img && this._pagePt) {
      this._updateAllPlaceholderStyles();
    }
  } catch (e) {
    console.warn('Failed to refresh placeholder styles after canvas update', e);
  }

  if (placeholder.isSignature || placeholder.isCustomSignature) {
    this.showToast('Success', successMessage, 'success');
  }
}



createCanvasImage(text, fontSizeOrOptions = 15, fontFamilyMaybe = 'Calibri, Arial, sans-serif') {
  // DEBUG toggle (non-invasive)
  const DEBUG_FONT = (this && typeof this.debugFontLogs !== 'undefined') ? !!this.debugFontLogs : true;

  // --- date normalization (unchanged) ---
  const ddMmYyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (ddMmYyyyRegex.test(text)) {
    const [day, month, year] = String(text).split('-');
    text = `${day}-${month}-${year}`;
  } else {
    const isProbablyDate = /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{2}\/\d{2}\/\d{4}$/.test(text);
    if (isProbablyDate && !isNaN(Date.parse(text))) {
      const d = new Date(text);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const y = d.getFullYear();
      text = `${day}-${m}-${y}`;
    }
  }

  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  let lines = String(text ?? '').split('\n');
  const EXPORT_SCALE = 4;
  // ---- Back-compat (old signature) ----
  if (typeof fontSizeOrOptions === 'number') {
    const fontSize = fontSizeOrOptions || 15;
    const fontFamily = fontFamilyMaybe || 'Calibri, Arial, sans-serif';

    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:num] startSize:', fontSize, 'fontFamily:', fontFamily, 'lines:', lines.length);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.font = `${fontSize}px ${fontFamily}`;
    const widths = lines.map(l => ctx.measureText(l).width);
    const textWidth = Math.max(...widths, fontSize * 4);

    // Use real ascent/descents for single-line height
    const m0 = ctx.measureText(lines[0] || '');
    const asc = m0.actualBoundingBoxAscent ?? fontSize * 0.8;
    const desc = m0.actualBoundingBoxDescent ?? fontSize * 0.2;
    const textHeight = (asc + desc) * Math.max(1, lines.length) + (fontSize * 0.1) * (lines.length - 1);

    canvas.width  = Math.ceil(textWidth * dpr);
    canvas.height = Math.ceil(textHeight * dpr);
    canvas.style.width  = `${Math.ceil(textWidth)}px`;
    canvas.style.height = `${Math.ceil(textHeight)}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontSize}px ${fontFamily}`;

    // vertically center using ascent/descents
    const lineGap = fontSize * 0.1;
    let y = (canvas.height / dpr - (asc + desc) * lines.length - lineGap * (lines.length - 1)) / 2 + asc;

    for (const line of lines) {
      ctx.fillText(line, 0, y);
      y += (asc + desc) + lineGap;
    }

    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:num] final canvas (css) w×h:', canvas.style.width, canvas.style.height, 'dpr:', dpr);
    }
    return canvas.toDataURL('image/png', 1.0);
  }

  // ---- Options path ----
  const {
    targetWidth, targetHeight,
    fontFamily = 'Calibri, Arial, sans-serif',
    fontPx,
    paddingX = 0, paddingY = 0,
    align = 'left',
    vAlign = 'middle',      // new: 'top' | 'middle' | 'bottom' | 'baseline'
    pixelSpace = false,
    // NEW style options (optional)
    color = '#000000',
    fontWeight = '400',
    fontStyle = 'normal',
    underline = false,
    isAddressField = false,
    placeholderId = 'N/A',
    placeholderType = 'N/A',
    pageNumber = 'N/A',
    orientation = 'N/A'
  } = fontSizeOrOptions || {};

  if (!targetWidth || !targetHeight) {
    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:opt] missing targetW/H; fallback numeric with fontPx:', fontPx);
    }
    return this.createCanvasImage(text, fontPx || 15, fontFamily);
  }

  const wCss = Math.max(1, Math.round(targetWidth));
  let hCss = Math.max(1, Math.round(targetHeight));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const availW = Math.max(0, wCss - 2 * paddingX);
  let availH = Math.max(0, hCss - 2 * paddingY);

  // choose size and shrink to fit (width/height)
  let size = fontPx || Math.floor(availH * 0.8);

  const wrapText = (txt, context, maxW) => {
    const paragraphs = String(txt ?? '').split('\n');
    const wrapped = [];
    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = context.measureText(testLine).width;
        if (testWidth > maxW && currentLine) {
          wrapped.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        wrapped.push(currentLine);
      }
    }
    return wrapped;
  };

  if (isAddressField) {
    const cssWeight = fontWeight || '400';
    const cssStyle  = fontStyle || 'normal';
    const fontStylePrefix = (cssStyle === 'italic') ? 'italic ' : '';
    ctx.font = `${fontStylePrefix}${cssWeight} ${size}px ${fontFamily}`;
    lines = wrapText(text, ctx, availW);

    const metricsPerLine = lines.map(l => ctx.measureText(l));
    const asc = Math.max(...metricsPerLine.map(m => m.actualBoundingBoxAscent ?? size * 0.8));
    const desc = Math.max(...metricsPerLine.map(m => m.actualBoundingBoxDescent ?? size * 0.2));
    const lineGap = Math.round(size * 0.1);
    const lineBox = asc + desc;
    const totalTextH = lineBox * lines.length + lineGap * (lines.length - 1);

    hCss = Math.max(hCss, Math.round(totalTextH + 2 * paddingY));
    availH = Math.max(0, hCss - 2 * paddingY);
  }

  if (pixelSpace) {
    canvas.width  = wCss;
    canvas.height = hCss;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    canvas.width  = Math.ceil(wCss * dpr * EXPORT_SCALE);
    canvas.height = Math.ceil(hCss * dpr * EXPORT_SCALE);
    ctx.setTransform(
      dpr * EXPORT_SCALE,
      0,
      0,
      dpr * EXPORT_SCALE,
      0,
      0
    );
  }
  canvas.style.width  = `${wCss}px`;
  canvas.style.height = `${hCss}px`;

  const shrinkOnly = !!fontPx;

  console.log('[EMBED_LOG] createCanvasImage start:', {
    text,
    targetWidth,
    targetHeight,
    fontPx,
    wCss,
    hCss,
    availW,
    availH,
    size,
    dpr,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height
  });

  const measureWidth = (s) => {
    // note: here we don't yet apply italic/weight; we only care about width scale
    ctx.font = `${s}px ${fontFamily}`;
    return Math.max(...lines.map(l => ctx.measureText(l).width));
  };

  // shrink only if height exceeds availH (do not shrink for width to prevent text scaling down)
  let w = measureWidth(size);
  if (DEBUG_FONT) {
    console.log('[FONT][createCanvasImage:opt] startSize:', size, 'shrinkOnly:', shrinkOnly, 'availW×H:', availW, availH, 'measuredW:', w);
  }
  let shrinkIters = 0;
  while (size > availH && size > 5) {
    size = Math.floor(size * 0.95);
    shrinkIters++;
  }
  if (DEBUG_FONT) {
    console.log('[FONT][createCanvasImage:opt] height shrink iterations:', shrinkIters, 'size after shrink:', size);
  }
  if (!shrinkOnly) {
    let grew = 0;
    while (size + 1 <= availH && measureWidth(size + 1) <= availW) { size += 1; grew++; }
    if (DEBUG_FONT) console.log('[FONT][createCanvasImage:opt] gentle grow by:', grew, 'final size:', size);
  }

  // apply color + font style/weight here
  ctx.fillStyle = color;
  ctx.textAlign = (align === 'left') ? 'left' : (align === 'right') ? 'right' : 'center';
  ctx.textBaseline = 'alphabetic';

  const cssWeight = fontWeight || '400';
  const cssStyle  = fontStyle || 'normal';
  // CSS font shorthand: "italic 700 16px Calibri"
  const fontStylePrefix = (cssStyle === 'italic') ? 'italic ' : '';
  ctx.font = `${fontStylePrefix}${cssWeight} ${size}px ${fontFamily}`;

  // Use actual ascent/descents for vertical placement
  const metricsPerLine = lines.map(l => ctx.measureText(l));
  const asc = Math.max(...metricsPerLine.map(m => m.actualBoundingBoxAscent ?? size * 0.8));
  const desc = Math.max(...metricsPerLine.map(m => m.actualBoundingBoxDescent ?? size * 0.2));
  const lineGap = Math.round(size * 0.1);  // small extra leading
  const lineBox = asc + desc;
  const totalTextH = lineBox * lines.length + lineGap * (lines.length - 1);

  // compute starting y (alphabetic baseline)
  let yStart;
  switch (vAlign) {
    case 'top':
      yStart = paddingY + asc;
      break;
    case 'bottom':
      yStart = paddingY + availH - totalTextH + asc;
      break;
    case 'baseline':
      yStart = paddingY + availH; // draw baseline at bottom edge
      break;
    case 'middle':
    default:
      yStart = paddingY + (availH - totalTextH) / 2 + asc;
      break;
  }

  const x =
    (align === 'left')  ? paddingX :
    (align === 'right') ? (wCss - paddingX) :
                          (wCss / 2);

  let y = yStart;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = metricsPerLine[i] || ctx.measureText(line);
    const textWidth = Math.min(availW, m.width || availW);

    // draw text
    ctx.fillText(line, x, y);

    // optional underline (only if requested)
    if (underline && textWidth > 0) {
      let ux1, ux2;
      if (align === 'left') {
        ux1 = x;
        ux2 = x + textWidth;
      } else if (align === 'right') {
        ux1 = x - textWidth;
        ux2 = x;
      } else {
        ux1 = x - textWidth / 2;
        ux2 = x + textWidth / 2;
      }

      const descent = m.actualBoundingBoxDescent ?? size * 0.1;
      const underlineY = y + descent * 0.6;

      ctx.beginPath();
      ctx.moveTo(ux1, underlineY);
      ctx.lineTo(ux2, underlineY);
      ctx.lineWidth = Math.max(1, size * 0.08);
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    y += lineBox + lineGap;
  }

  if (DEBUG_FONT) {
    console.log('[FONT][createCanvasImage:opt] finalFontPx:', size, 'lines:', lines.length);
    console.log('[FONT][createCanvasImage:opt] final canvas (css) w×h:', wCss, hCss, 'pixelSpace:', pixelSpace, 'dpr:', dpr);
  }

  console.log('[TRACE_PIPELINE] createCanvasImage:', {
    placeholderId,
    placeholderType,
    pageNumber,
    orientation,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    cssWidth: wCss,
    cssHeight: hCss,
    devicePixelRatio: dpr,
    fontSize: size,
    wrappedTextSize: lines.length
  });

  return canvas.toDataURL('image/png', 1.0);
}



@track isEditModalVisible = false;
@track editableText = '';
@track currentPlaceholderId = null;
@track currentSrcField = '';
@track currentEditingLabel = '';
@track currentEditingType = 'text';



handleEditPlaceholder(event) {
    const placeholderId = event.target.dataset.id;
    const placeholder = this.placeholders.find(
        item => item.id === parseInt(placeholderId, 10)
    );

    if (!placeholder) {
        this.showToast('Error', 'Placeholder not found for editing.', 'error');
        return;
    }

    const srcField = this.getSrcFieldForPlaceholder(placeholder);
    const label = this.getPlaceholderLabel(placeholder);

    if (!srcField && !placeholder.isSignature && !placeholder.isCustomSignature) {
        this.showToast('Error', 'Unsupported placeholder type for editing.', 'error');
        return;
    }

    this.currentPlaceholderId = placeholder.id;
    this.currentSrcField = srcField;
    this.currentEditingLabel = label;
    this.currentEditingType = this.getInputType(placeholder);
    this.editableText = placeholder.value || '';
    this.isEditModalVisible = !placeholder.isSignature && !placeholder.isCustomSignature;
}

getInputType(ph) {
    if (ph.isContactNumber || ph.isABN || ph.isTFN || ph.isQuantity || ph.isSerialNumber) {
        return 'tel';
    }
    if (ph.isInitials) return 'dropdown';
    if (ph.isEmail) return 'email';
    if (ph.isDate || ph.isDateOfSigning || ph.isStartDate || ph.isEndDate || ph.isCustomDate) {
        return 'date';
    }
    if (ph.isTime || ph.isCustomTime) {
        return 'time';
    }
    if (ph.isAddress || ph.isCustomAddress || ph.isCustomLongText) {
        return 'textarea';
    }
    return 'text';
}
get isEditTextInput() {
      return this.currentEditingType !== 'textarea' && this.currentEditingType !== 'dropdown';
}

get isEditTextArea() {
    return this.currentEditingType === 'textarea';
}
get isEditDropdown() {
    return this.currentEditingType === 'dropdown';
}


preventNonNumericInput(event) {
    if (this.currentEditingType === 'tel' && !/^\d$/.test(event.key)) {
        event.preventDefault();
    }
}



handleModalInputChange(event) {
    let inputValue = event.target.value;

    // If editing a contact number, strip non-digits
    if (this.currentEditingType === 'tel') {
        inputValue = inputValue.replace(/\D/g, ''); // Remove non-numeric characters
    }

    const placeholder = this.placeholders.find(
        (item) => item.id === this.currentPlaceholderId
    );

    const skipWidthValidation =
          placeholder?.isAddress ||
          placeholder?.isCustomAddress ||
          placeholder?.isTextArea ||
          placeholder?.isCustomTextArea;

      if (
          placeholder &&
          !placeholder.isSignature &&
          !placeholder.isCustomSignature &&
          !skipWidthValidation
      ) {
      const check = this.checkTextFitsPlaceholder(placeholder, inputValue);
      if (!check.fits) {
        const oldCheck = this.checkTextFitsPlaceholder(placeholder, this.editableText ?? '');
        const oldOverflows = !oldCheck.fits;
        
        const shouldBlock = !oldOverflows || (inputValue.length > (this.editableText ?? '').length) || (check.textWidth > oldCheck.textWidth);
        if (shouldBlock) {
          inputValue = this.editableText ?? '';
          event.target.value = inputValue;
          this.showToast('Warning', 'Maximum text width reached for this field.', 'warning');
        }
      }
    }

    this.editableText = inputValue;
}


saveEditedText() {
    const placeholder = this.placeholders.find(
        (item) => item.id === this.currentPlaceholderId
    );

    if (!placeholder) {
        this.showToast('Error', 'Placeholder not found.', 'error');
        return;
    }

    const trimmedValue = this.editableText?.trim();

    if (!trimmedValue) {
        this.showToast('Validation Error', `Please enter a value for ${this.currentEditingLabel}.`, 'warning');
        return;
    }

    // Update the placeholder value
    placeholder.value = trimmedValue;

    // For multiline placeholders, grow the height
    const isMultiline =
        placeholder.isAddress ||
        placeholder.isCustomAddress ||
        placeholder.isTextArea ||
        placeholder.isCustomTextArea;

    if (isMultiline) {
        requestAnimationFrame(() => {
            const container = this.template.querySelector(
                `[data-id="${placeholder.id}"]`
            );

            if (container) {
                container.style.height = 'auto';
                container.style.height = `${container.scrollHeight + 8}px`;

                // Keep placeholder model in sync
                placeholder.h = container.offsetHeight;
            }
        });
    }

    // Update the canvas dynamically with the correct image source
    this.updatePlaceholderWithCanvas(
        placeholder,
        this.currentSrcField,
        `${this.currentEditingLabel} updated successfully!`
    );

    // Close the modal
    this.isEditModalVisible = false;
}



closeEditModal() {
    this.isEditModalVisible = false; // Hide the modal
    this.editableText = ''; // Clear the editable text
    this.currentPlaceholderId = null; // Reset the current placeholder ID
    this.currentSrcField = ''; // Reset the current image source field
}

async automatePreviewProcess() {
    try {
        if (this.temporaryImageCache) {
            this.temporaryImageCache.clear();
        }
        if (this._previewCanvasByPage) {
            this._previewCanvasByPage.clear();
        }

        // Find unique pages with placeholders
        const pagesWithPlaceholders = [...new Set(this.placeholders.map((p) => p.page))];
        console.log('Pages with placeholders:', pagesWithPlaceholders);

        for (const pageNumber of pagesWithPlaceholders) {
            console.log(`Navigating to page ${pageNumber}...`);
            
            // Navigate to the page
            this.currentPage = pageNumber;

            // Ensure the page image is updated
            await this.renderPageAsImage(this.currentPage);

            // Wait for navigation to complete
            await new Promise((resolve) => setTimeout(resolve, 50)); // Add a small delay for rendering

            // Trigger preview for the current page
            console.log(`Triggering preview for page ${this.currentPage}...`);
            await this.handlePreview();

            console.log(`Preview triggered for page ${pageNumber}`);
        }

        // Once all pages are processed, show the confirmation popup
        console.log('All previews completed. Preparing confirmation popup...');
        
        await this.handleConfirm();
    } catch (error) {
        console.error('Error during automated preview process:', error);
        this.showToast('Error', 'Failed to automate preview process.', 'error');
    } finally {
        this.isLoadingpop = false;
    }
}

temporaryImageCache = new Map(); // Temporary cache for preview images
isPreviewVisible = false;
isConfirmationPopupVisible = false;
confirmationPopupPages = []; // Array to store all pages for the confirmation popup


    async handleConfirm() {
        // if (this.temporaryImageCache.size === 0) {
        //     this.showToast('Error', 'No images available for confirmation.', 'error');
        //     return;
        // }

        if (this.temporaryImageCache.size === 0) {
            console.warn('No placeholders found, rendering pages from PDF directly.');
        }


        // Prepare data for displaying in the confirmation popup
        const allPages = [];
        for (let pageNumber = 1; pageNumber <= this.pdfDoc.numPages; pageNumber++) {
            if (this.temporaryImageCache.has(pageNumber)) {
                allPages.push({
                    id: pageNumber,
                    src: this.temporaryImageCache.get(pageNumber),
                    alt: `Page ${pageNumber}`
                });
            } else {
                // Render static pages for those without cached images
                const page = await this.pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;

                const staticImage = canvas.toDataURL('image/png');
                allPages.push({
                    id: pageNumber,
                    src: staticImage,
                    alt: `Page ${pageNumber}`
                });
            }
        }

        // Open the custom popup with all images
        
        this.isConfirmationPopupVisible = true;
        this.confirmationPopupPages = allPages;
    }

    closePreview() {
        this.isPreviewVisible = false;
    }

    closeConfirmationPopup() {
        this.isConfirmationPopupVisible = false;
    }


    
async handlePreview() {
    if (!this.placeholders || this.placeholders.length === 0) {
        this.showToast('Error', 'No placeholders available for preview.', 'error');
        return;
    }

    try {
        this.isPreviewMode = true; // Enable preview mode

        for (const placeholder of this.placeholders) {
            const placeholderElement = this.template.querySelector(
                `[data-id="${placeholder.id}"]`
            );

            if (placeholderElement) {
                const boundingRect = placeholderElement.getBoundingClientRect(); // Get position and size

                const srcField = this.getSrcFieldForPlaceholder(placeholder);
                const imagesToProcess = [];
                if (srcField && placeholder[srcField]) {
                    imagesToProcess.push({ type: srcField, src: placeholder[srcField] });
                } else if (placeholder.imageSrc) {
                    imagesToProcess.push({ type: 'imageSrc', src: placeholder.imageSrc });
                } else if (placeholder.overlaySrc) {
                    imagesToProcess.push({ type: 'overlaySrc', src: placeholder.overlaySrc });
                }

                for (const image of imagesToProcess) {
                    if (image.src) {
                        const base64Data = image.src.split(',')[1];
                        const imageBlob = this.base64ToBlob(base64Data, 'image/png');

                        // 🔹 pass placeholder into embedImageWithAdjustedHeight
                        await this.embedImageWithAdjustedHeight(
                            imageBlob,
                            boundingRect,
                            placeholder.page,
                            placeholder
                        );

                        console.log(
                            `Embedded ${image.type} at page: ${placeholder.page}, ` +
                            `X: ${boundingRect.x}, Y: ${boundingRect.y}`
                        );
                    }
                }

                this.temporaryImageCache.set(placeholder.page, this.imageSrc);
            }
        }

        console.log('Preview images cached successfully.');
    } catch (error) {
        console.error('Error generating preview:', error);
        this.showToast('Error', 'Failed to generate preview.', 'error');
    }
}


   
    handlePreviewClick() {
        this.isPreviewModalVisible = true;
    }

    // Handle "Proceed" button in the modal
    proceedWithPreview() {

        if (!this.validatePlaceholders()) {
        this.isPreviewModalVisible = false;
        return;
    }
        this.isLoadingpop = true;
        this.isPreviewModalVisible = false; // Close the modal
        this.automatePreviewProcess(); // Execute the preview logic
    }

    // Handle "Cancel" button in the modal
    cancelPreview() {
        this.isPreviewModalVisible = false; // Close the modal
    }
    
// validatePlaceholders() {
//     let missingFields = [];

//     // Check text-based placeholders that don’t have images (exclude signatures)
//     const requiredPlaceholders = this.placeholders.filter(
//         ph => !ph.hasImage && !ph.isSignature
//     );

//     for (let ph of requiredPlaceholders) {
//         const value = ph.value ? ph.value.trim() : '';
//         if (!value) {
//             missingFields.push(this.getPlaceholderLabel(ph));
//         }
//     }

//     // Check signature placeholders
//     const signaturePlaceholders = this.placeholders.filter(ph => ph.isSignature);
//     for (let sig of signaturePlaceholders) {
//         if (!sig.hasImage) {
//             missingFields.push('Signature');
//         }
//     }

//     if (missingFields.length > 0) {
//         const uniqueMissing = [...new Set(missingFields)];
//         const fieldList = uniqueMissing.join(', ');
//         const message = `The following required field${uniqueMissing.length > 1 ? 's are' : ' is'} incomplete: ${fieldList}. Please ensure all required information is provided before proceeding.`;
//         this.showToast('Incomplete Information', message, 'error');
//         return false;
//     }

//     return true;
// }

validatePlaceholders() {
    console.group('=== VALIDATE PLACEHOLDERS START ===');
    console.log('Template Id:', this.templateRecordId);
    console.log('placeholderJson:', this.placeholderJson);
    console.log('Total placeholders:', this.placeholders ?. length);
    console.log('Raw placeholders:', JSON.parse(JSON.stringify(this.placeholders)));
    let missingFields = [];
    // Text placeholders
    const requiredPlaceholders = this.placeholders.filter(ph => !ph.hasImage && !ph.isSignature);
    console.log('Required placeholders:', JSON.parse(JSON.stringify(requiredPlaceholders)));
    for (let ph of requiredPlaceholders) {
        const value = ph.value
            ? ph.value.trim()
            : '';
        console.log('[TEXT]', {
            id: ph.id,
            name: ph.name,
            label: this.getPlaceholderLabel(ph),
            value: ph.value,
            trimmed: value,
            hasImage: ph.hasImage,
            isSignature: ph.isSignature
        });
        if (! value) {
            console.warn('MISSING TEXT FIELD:', this.getPlaceholderLabel(ph));
            missingFields.push(this.getPlaceholderLabel(ph));
        }
    }
    // Signature placeholders
    const signaturePlaceholders = this.placeholders.filter(ph => ph.isSignature);
    console.log('Signature placeholders:', JSON.parse(JSON.stringify(signaturePlaceholders)));
    for (let sig of signaturePlaceholders) {
        console.log('[SIGNATURE]', {
            id: sig.id,
            label: this.getPlaceholderLabel(sig),
            hasImage: sig.hasImage,
            value: sig.value
        });
        if (! sig.hasImage) {
            console.warn('MISSING SIGNATURE');
            missingFields.push('Signature');
        }
    }
    console.log('Missing fields:', missingFields);
    if (missingFields.length > 0) {
        const uniqueMissing = [...new Set(missingFields)];
        console.error('VALIDATION FAILED:', uniqueMissing);
        const fieldList = uniqueMissing.join(', ');
        const message = `The following required field${
            uniqueMissing.length > 1
                ? 's are'
                : ' is'
            } incomplete: ${fieldList}. Please ensure all required information is provided before proceeding.`;
        console.groupEnd();
        this.showToast('Incomplete Information', message, 'error');
        return false;
    }
    console.log('VALIDATION PASSED');
    console.groupEnd();
    return true;
}



getPlaceholderLabel(ph) {
    if (ph.isName) return 'Name';
    if (ph.isFirstName) return 'First Name';
    if (ph.isLastName) return 'Last Name';
    if (ph.isInitials) return 'Initials';
    if (ph.isFullName) return 'Full Name';
    if (ph.isEmail) return 'Email';
    if (ph.isContactNumber) return 'Contact Number';
    if (ph.isAddress) return 'Address';
    if (ph.isDate) return 'Date';
    if (ph.isDateOfSigning) return 'Date of Signing';
    if (ph.isTime) return 'Time';
    if (ph.isABN) return 'ABN';
    if (ph.isTFN) return 'TFN';

    if (ph.isQuoteNumber) return 'Quote Number';
    if (ph.isTotalAmount) return 'Total Amount';
    if (ph.isStartDate) return 'Start Date';
    if (ph.isEndDate) return 'End Date';
    if (ph.isSerialNumber) return 'Serial Number';
    if (ph.isServiceName) return 'Service Name';
    if (ph.isServiceNumber) return 'Service Number';
    if (ph.isQuantity) return 'Quantity';
    if (ph.isUnitPrice) return 'Unit Price';
    if (ph.isAmount) return 'Amount';

    if (ph.isCustomField) return ph.customLabel || 'Custom Field';
    if (ph.isSignature || ph.isCustomSignature) return 'Signature';

    return 'Field';
}

getPageDimensions(pageNumber) {
    if (this._pageDimensionsCache && this._pageDimensionsCache.has(pageNumber)) {
        return this._pageDimensionsCache.get(pageNumber);
    }
    return this._pagePt || { w: 1024, h: 1448 };
}

async embedImageWithAdjustedHeight(imageBlob, boundingRect, pageNumber, placeholder) {
  try {
    const imgEl = this.template.querySelector('.image-container-input img');

    // helper to choose smoothing
    const setSmoothing = (ctx, overlay, w, h) => {
      if (overlay.width === w && overlay.height === h) {
        ctx.imageSmoothingEnabled = false;
      } else {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    };

    // Prefer page-point placement if caller provided it:
    let pagePt = this.getPageDimensions(pageNumber);
    const ph = (placeholder && !placeholder.isSignature && !placeholder.isCustomSignature) ? placeholder : null;
    const hasPt = !!(ph && pagePt && ph.xPt != null && ph.yPt != null);
    const isSignature = false;

    // 🔹 Per-page canvas cache
    if (!this._previewCanvasByPage) {
      this._previewCanvasByPage = new Map();
    }

    let entry = this._previewCanvasByPage.get(pageNumber);
    let canvas;
    let ctx;
    let baseW;
    let baseH;

    if (entry) {
      ({ canvas, ctx, baseW, baseH } = entry);
    } else {
      if (imgEl && this.imageSrc) {
        // Stay in the preview's intrinsic pixel space
        const baseImage = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = this.imageSrc;
        });

        baseW = baseImage.naturalWidth || baseImage.width;
        baseH = baseImage.naturalHeight || baseImage.height;

        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = baseW;
        canvas.height = baseH;

        ctx.drawImage(baseImage, 0, 0, baseW, baseH);

        entry = { canvas, ctx, baseW, baseH, fromImgSrc: true };
        this._previewCanvasByPage.set(pageNumber, entry);
      } else {
        // Fallback: render the page to the container width and do the same mapping
        const page = await this.pdfDoc.getPage(pageNumber);
        const container = this.template.querySelector('.image-container-input');
        const vp1 = page.getViewport({ scale: 1 });
        const localPagePt = { w: vp1.width, h: vp1.height };
        if (!this._pageDimensionsCache) {
          this._pageDimensionsCache = new Map();
        }
        this._pageDimensionsCache.set(pageNumber, localPagePt);
        pagePt = localPagePt;

        const targetCssW = container ? container.clientWidth : vp1.width;
        const viewport = page.getViewport({ scale: targetCssW / vp1.width });

        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        baseW = canvas.width;
        baseH = canvas.height;

        entry = { canvas, ctx, baseW, baseH, fromImgSrc: false };
        this._previewCanvasByPage.set(pageNumber, entry);
      }
    }

    const fromImgSrc = entry.fromImgSrc;
    const container = this.template.querySelector('.image-container-input');
    const imgRect = imgEl ? imgEl.getBoundingClientRect() : null;
    const cssRect = container
      ? container.getBoundingClientRect()
      : imgRect || { x: 0, y: 0, width: baseW, height: baseH };

    // Create overlay bitmap once
    const overlay = await createImageBitmap(imageBlob);

    let destX;
    let destY;
    let destW;
    let destH;

    if (isSignature) {
      const SIG_CSS_W = 150;
      const SIG_CSS_H = 75;
      const FALLBACK_W = 1024;

      // Fetch dynamic page points for the specific target page
      const page = await this.pdfDoc.getPage(pageNumber);
      const vp1 = page.getViewport({ scale: 1 });
      const pagePt = { w: vp1.width, h: vp1.height };

      const wPt = pagePt.w * (SIG_CSS_W / FALLBACK_W);
      const hPt = wPt * (SIG_CSS_H / SIG_CSS_W);

      // Map placeholder center in CSS → base canvas pixels
      const refRect = fromImgSrc && imgRect ? imgRect : cssRect;
      const ratio   = baseW / refRect.width;

      const cxCss = boundingRect.x + boundingRect.width / 2;
      const cyCss = boundingRect.y + boundingRect.height / 2;

      const cxPx = (cxCss - refRect.x) * ratio;
      const cyPx = (cyCss - refRect.y) * ratio;

      const targetBoxW = Math.max(1, Math.round((wPt / pagePt.w) * baseW));
      const targetBoxH = Math.max(1, Math.round((hPt / pagePt.h) * baseH));

      // Keep aspect ratio inside the forced signature box
      const fit = this._fitRect(
        targetBoxW,
        targetBoxH,
        placeholder.sigW || overlay.width,
        placeholder.sigH || overlay.height
      );

      destW = fit.w;
      destH = fit.h;
      destX = Math.round(cxPx - targetBoxW / 2 + fit.x);
      destY = Math.round(cyPx - targetBoxH / 2 + fit.y);
    } else if (hasPt && pagePt) {
      // Page-point based placement (existing logic)
      destX = Math.round((ph.xPt / pagePt.w) * baseW);
      destY = Math.round((ph.yPt / pagePt.h) * baseH);

      if (ph.wPt != null && ph.hPt != null) {
        destW = Math.max(1, Math.round((ph.wPt / pagePt.w) * baseW));
        destH = Math.max(1, Math.round((ph.hPt / pagePt.h) * baseH));
      } else {
        const refRect = fromImgSrc && imgRect ? imgRect : cssRect;
        const ratio   = baseW / refRect.width;
        destW = Math.round(boundingRect.width * ratio);
        destH = Math.round(boundingRect.height * ratio);
      }
    } else {
      // ORIGINAL CSS → pixel mapping (existing logic)
      if (fromImgSrc && imgRect) {
        const ratio = baseW / imgRect.width;
        destX = Math.round((boundingRect.x - imgRect.x) * ratio);
        destY = Math.round((boundingRect.y - imgRect.y) * ratio);
        destW = Math.round(boundingRect.width * ratio);
        destH = Math.round(boundingRect.height * ratio);
      } else {
        const ratio = baseW / cssRect.width;
        destX = Math.round((boundingRect.x - cssRect.x) * ratio);
        destY = Math.round((boundingRect.y - cssRect.y) * ratio);
        destW = Math.round(boundingRect.width * ratio);
        destH = Math.round(boundingRect.height * ratio);
      }
    }

    const isAddressField = ph && (ph.isAddress || ph.isCustomAddress);
    if (isAddressField) {
      destH = Math.round(destW * (overlay.height / overlay.width));
    }

    const isSignatureField = placeholder && (placeholder.isSignature || placeholder.isCustomSignature);
    if (isSignatureField) {
      const fit = this._fitRect(destW, destH, overlay.width, overlay.height);
      destX = destX + fit.x;
      destY = destY + fit.y;
      destW = fit.w;
      destH = fit.h;
    }

    // Clamp to canvas bounds
    destW = Math.max(1, Math.min(destW, baseW));
    destH = Math.max(1, Math.min(destH, baseH));
    destX = Math.max(0, Math.min(destX, baseW - destW));
    destY = Math.max(0, Math.min(destY, baseH - destH));

    setSmoothing(ctx, overlay, destW, destH);
    ctx.drawImage(overlay, destX, destY, destW, destH);

    console.log('[TRACE_PIPELINE] embedImageWithAdjustedHeight:', {
      placeholderId: placeholder?.id,
      placeholderType: placeholder?.type || (placeholder?.isSignature || placeholder?.isCustomSignature ? 'Signature' : 'Text'),
      pageNumber: pageNumber || placeholder?.page,
      orientation: pagePt ? (pagePt.w > pagePt.h ? 'Landscape' : 'Portrait') : 'Unknown',
      destX,
      destY,
      destW,
      destH,
      canvasWidth: baseW,
      canvasHeight: baseH,
      overlayWidth: overlay.width,
      overlayHeight: overlay.height
    });

    // keep existing behaviour
    this.imageSrc = canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error embedding image into PDF:', error);
    this.showToast('Error', 'Failed to embed image into preview.', 'error');
  }
}






    
    
    

    
    
    
    // Helper function to convert Base64 to Blob
    base64ToBlob(base64, contentType) {
        const byteCharacters = atob(base64);
        const byteNumbers = Array.from(byteCharacters).map((char) => char.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    }
    
    handleInitialsSelection(event) {
        const id = parseInt(event.target.dataset.id, 10);
        const placeholder = this.placeholders.find((item) => item.id === id);
        if (placeholder) {
            placeholder.value = event.target.value;
            console.log(`Initials selected: ${placeholder.value}`);
        }
    }
    
    // Close the preview modal
    closePreview() {
        this.isPreviewMode = false; // Disable preview mode
        this.isPreviewVisible = false; // Close the preview modal
        console.log('Preview modal closed.');
    }
    



    openPreview(imageSrc, recordId) {
        this.isPreviewVisible = true;
        this.imageSrc = imageSrc;
        this.recordId = recordId;
    }
    @track isSpinning = '';
    @track pdfUrl = '';

    handleDocumentNameChange(event) {

    this.documentName =
        event.target.value;

    console.log(
        'Document Name:',
        this.documentName
    );
}

async handleGeneratePDF() {
  
  try {

     // ===== Document Name Validation =====
        if (!this.documentName || !this.documentName.trim()) {

            this.showToast(
                'Error',
                'Please enter document name before saving.',
                'error'
            );

            return;
        }
    // --- UI: match previous behavior ---
    this.showFailureScreen = false;   // hide failure
    this.showSuccessScreen = true;    // show success container
    this.isSpinning = true;           // show spinner

    this.isLoading = true;
    const recordId = this.templateRecordId;
    

    // 1) gather diffs
    const { images, pageNumbers } = await this._collectChangedPagesBase64();
    console.log('[GEN] diffs ->', { count: images.length, pageNumbers });

    // 🔹 REVIEW-ONLY PATH: no changed pages
    if (!images.length) {
      console.log('[GEN] no changed pages; treating as review-only submit');

      if (!recordId) {
        this._toast('Missing recordId', 'error');
        this.isSpinning = false;
        this.showFailureScreen = true;
        this.showSuccessScreen = false;
        return;
      }

      // Use the currently displayed PDF (or fall back to original reference)
      const finalUrl = this.pdfUrl || this.originalPdfReference;

      if (!finalUrl) {
        console.warn('[GEN] no diffs but no PDF URL available to finalize');
        this._toast('No changes, but PDF URL is missing – cannot finalize.', 'error');
        this.isSpinning = false;
        this.showFailureScreen = true;
        this.showSuccessScreen = false;
        return;
      }

      // Persist latest PDF (even if unchanged) + deactivate link
      try {
        await this.storePdfInSalesforce(finalUrl, recordId);
      } catch (err) {
        console.warn('[GEN] storePdfInSalesforce warning (no-diff path)', err);
        // storePdfInSalesforce already handles its own toast; keep success UI
      }

      // Consider review-only as a successful submission
      this._toast('Reviewed and submitted successfully.', 'success');

      if (this.changedPages && typeof this.changedPages.clear === 'function') {
        this.changedPages.clear();
      }

      // --- UI: success finished ---
      this.isSpinning = false;
      this.showSuccessScreen = true;
      this.showFailureScreen = false;
      return; // important: skip external diff APIs
    }

    // 🔹 NORMAL DIFF-BASED PATH (existing behavior)
    if (!recordId) {
      this._toast('Missing recordId', 'error');
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }
    if (!this.originalPdfReference) {
      this._toast('Missing original PDF reference', 'error');
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }

    // 2) upload changed pages
    const uploadBody = {
      recordId: recordId,
      images,                      // base64 array
      changedPages: pageNumbers,   // 1-based
      originalPdfReference: this.originalPdfReference
    };
    console.log('[GEN] POST /upload-changed-pages', uploadBody);

    const uploadResp = await fetch('https://tesseractapps.com/upload-changed-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadBody)
    });

    const uploadText = await uploadResp.text();
    let uploadJson;
    try { uploadJson = JSON.parse(uploadText); } catch (_) { uploadJson = null; }

    if (!uploadResp.ok) {
      console.error('[GEN] upload failed', uploadResp.status, uploadText);
      const errMsg = uploadJson?.error || uploadText || `HTTP ${uploadResp.status}`;
      throw new Error(`Upload failed: ${errMsg}`);
    }

    console.log('[GEN] upload ok', uploadJson || uploadText);
    // this._toast(`Uploaded ${uploadJson?.totalChangedPages ?? images.length} changed page(s).`, 'success');

    // 3) finalize (merge)
    console.log('[GEN] POST /generate-pdf-from-changes', { recordId: recordId });
    const genResp = await fetch('https://tesseractapps.com/generate-pdf-from-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: recordId})
    });

    const genText = await genResp.text();
    let genJson;
    try { genJson = JSON.parse(genText); } catch (_) { genJson = null; }

    if (!genResp.ok) {
      console.error('[GEN] finalize failed', genResp.status, genText);
      const errMsg = genJson?.error || genText || `HTTP ${genResp.status}`;
      throw new Error(`Generate failed: ${errMsg}`);
    }

    console.log('[GEN] finalize ok', genJson || genText);
    const finalUrl = genJson?.pdfUrl;
    const wasDiff = !!genJson?.isDiffBased;

    if (!finalUrl) {
      console.warn('[GEN] finalize returned no pdfUrl', genJson || genText);
      this._toast('PDF updated, but no URL returned from server.', 'warning');

      // UI -> failure state because we have nothing to show/download
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }

    console.log('[GEN] final PDF URL:', finalUrl, 'diffBased:', wasDiff);

    // Refresh in-viewer
    this.pdfUrl = finalUrl;
    // this.loadPdf(finalUrl);

    // --- persist + deactivate, like previous flow ---
    try {
      await this.storePdfInSalesforce(finalUrl,recordId);
    } catch (err) {
      // storePdfInSalesforce already toasts; don't flip success screen
      console.warn('[GEN] storePdfInSalesforce warning', err);
    }


    // Clear diffs after success
    if (this.changedPages && typeof this.changedPages.clear === 'function') {
      this.changedPages.clear();
    }

    // --- UI: success finished ---
    this.isSpinning = false;          // stop spinner
    this.showSuccessScreen = true;    // keep success screen (shows check + download)
    this.showFailureScreen = false;


  } catch (e) {
    console.error('[GEN] error', e);
    this._toast(e?.message || 'PDF generation failed', 'error');

    // --- UI: failure finished ---
    this.isSpinning = false;
    this.showSuccessScreen = false;
    this.showFailureScreen = true;

  } finally {
    this.isLoading = false;
  }
}

async storePdfInSalesforce(
    pdfUrl,
    parentRecordId
) {

    if (
        !pdfUrl ||
        !parentRecordId
    ) {

        console.warn(
            '⚠️ Missing parameters, skipping record storage.'
        );

        return;
    }

    try {

        console.log(
            '📌 Storing generated PDF record in Salesforce...'
        );

        console.log(
            '📌 PDF URL:',
            pdfUrl
        );

        console.log(
            '📌 Parent Record Id:',
            parentRecordId
        );

        console.log(
            '📌 Organization Id:',
            this.orgid
        );

        const recipientJson = JSON.stringify({

            FullName:
                this.recipientDemographicData?.fieldValues?.FullName || '',

            Email:
                this.recipientDemographicData?.fieldValues?.Email || '',

            recordId:
                this.recipientDemographicData?.recordId || '',

            recordTypeName:
                this.recipientDemographicData?.recordTypeName || ''

        });

        const fingerprint = await this.logAuditDataWithIP();

        const response =
            await storePdfRecord({

                pdfUrl: pdfUrl,

                parentRecordId:
                    parentRecordId,

                orgId:
                    this.orgid,

                documentName:
                    this.documentName,
                recipientJson:
                    recipientJson, fingerprint: fingerprint
            });

        console.log(
            '✅ Child record created successfully.'
        );

        console.log(
            '📌 Apex response:',
            response
        );

        this.pdfUrl =
            response?.pdfUrl;

        this.recordId =
            response?.recordId;

        this.clientEmail =
            this.recipientDemographicData
                ?.fieldValues
                ?.Email || '';

        console.log(
            '📌 Stored pdfUrl:',
            this.pdfUrl
        );

        console.log(
            '📌 Stored Participant Template Id:',
            this.recordId
        );

        console.log(
            '📧 Stored clientEmail:',
            this.clientEmail
        );

        this.showToast(
              'Success',
              this.documentName
                  ? `Document '${this.documentName}' has been created successfully.`
                  : 'Document has been created successfully.',
              'success'
          );

        // preserve existing UI
        this.isSpinning = false;

        this.showSuccessScreen = true;

        this.showFailureScreen = false;

    } catch (error) {

        console.error(
            '❌ Error inserting record:',
            error
        );

        console.error(
            '❌ Error details:',
            JSON.stringify(error)
        );

        this.showToast(
            'Error',
            'Failed to store in Salesforce.',
            'error'
        );

        this.isSpinning = false;

        this.showSuccessScreen = false;

        this.showFailureScreen = true;
    }
}
    
    
// NEW state to track diff pages
changedPages = new Map(); // pageNumber -> { dirty: true, base64?: string }
originalPdfReference;     // e.g., ContentVersion key or S3 key/URL you already have
recordId;                 // ensure you set this once you decode your URL payload

// Call this anywhere a user changes something on page N
markPageDirty(pageNumber) {
  const existing = this.changedPages.get(pageNumber) || {};
  this.changedPages.set(pageNumber, { ...existing, dirty: true });
}

async _renderPageToBase64(pageNumber) {
  const pdf = this.pdfDoc || this.pdf || this.pdfDocument;
  if (!pdf) throw new Error('PDF not loaded');

  const page = await pdf.getPage(pageNumber);
  const baseScale = (this._computeScaleForContainer?.(pageNumber)) || 2.0;
  const deviceDpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  const dpr = Math.min(deviceDpr, 1.25);
  const viewport = page.getViewport({ scale: baseScale });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  const cssW = Math.floor(viewport.width);
  const cssH = Math.floor(viewport.height);

  canvas.width  = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));

  await page.render({
    canvasContext: ctx,
    transform: [dpr, 0, 0, dpr, 0, 0],
    viewport
  }).promise;

  const pagePlaceholders = (this.placeholders || [])
    .filter(p => Number(p.page) === Number(pageNumber));

  const vp1 = page.getViewport({ scale: 1 });
  const pagePtW = vp1.width;
  const pagePtH = vp1.height;

  // constants that reflect your preview container
  const FALLBACK_W = 1024;   // .image-container-input width
  const FALLBACK_H = 1448;   // .image-container-input height

  // target "visual" signature size in preview
  const SIG_CSS_W = 150;
  const SIG_CSS_H = 75;

  for (const p of pagePlaceholders) {
    const dataUrl = this._getPlaceholderDataUrl
      ? (p.overlaySrc || this._getPlaceholderDataUrl(p))
      : (p.overlaySrc || p.signatureDataUrl || p.SignatureSrc || p.signatureSrc ||
         p.imageSrc || p.FullNameSrc || p.AbnSrc || null);
    if (!dataUrl || !/^data:image\/(png|jpeg);base64,/.test(dataUrl)) continue;

    const xPt = Number.isFinite(p.xPt) ? Number(p.xPt) : 0;
    const yPt = Number.isFinite(p.yPt) ? Number(p.yPt) : 0;

    let wPt, hPt;

    if (p.isSignature || p.isCustomSignature) {
      wPt = pagePtW * (SIG_CSS_W / FALLBACK_W);
      const isLandscape = pagePtW > pagePtH;
      if (isLandscape) {
        // Landscape: scale uniformly to maintain 2:1 visual signature box aspect ratio
        hPt = wPt * (SIG_CSS_H / SIG_CSS_W);
      } else {
        // Portrait: original height scaling (scaled by pagePtH) to match visual layout exactly
        hPt = pagePtH * (SIG_CSS_H / FALLBACK_H);
      }
    } else {
      // original behaviour for non-signature placeholders
      wPt = Math.max(1, Number.isFinite(p.wPt) ? Number(p.wPt) : 120);
      hPt = Math.max(1, Number.isFinite(p.hPt) ? Number(p.hPt) : 30);
    }

    const boxX = Math.round(xPt * (canvas.width  / pagePtW));
    const boxY = Math.round(yPt * (canvas.height / pagePtH));
    const boxW = Math.max(1, Math.round(wPt * (canvas.width  / pagePtW)));
    const boxH = Math.max(1, Math.round(hPt * (canvas.height / pagePtH)));

    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {

        const isAddressField = p.isAddress || p.isCustomAddress;
        let fitW = boxW;
        let fitH = boxH;
        if (p.isSignature || p.isCustomSignature) {
          // keep aspect ratio *inside* our forced box
          const fit = this._fitRect(
            boxW,
            boxH,
            p.sigW || img.width,
            p.sigH || img.height
          );
          const drawX = boxX + Math.round((boxW - fit.w) / 2);
          const drawY = boxY + Math.round((boxH - fit.h) / 2);
          fitW = fit.w;
          fitH = fit.h;
          ctx.drawImage(img, drawX, drawY, fit.w, fit.h);
        } else if (isAddressField) {
          // For address fields, calculate height dynamically to keep aspect ratio of wrapped text image
          fitH = Math.max(1, Math.round(boxW * (img.height / img.width)));
          ctx.drawImage(img, boxX, boxY, boxW, fitH);
        } else {
          // non-signature placeholders: full box
          ctx.drawImage(img, boxX, boxY, boxW, boxH);
        }

        console.log('[TRACE_PIPELINE] _renderPageToBase64:', {
          placeholderId: p.id,
          placeholderType: p.type || (p.isSignature || p.isCustomSignature ? 'Signature' : 'Text'),
          pageNumber: pageNumber,
          orientation: vp1.width > vp1.height ? 'Landscape' : 'Portrait',
          pageViewportWidth: vp1.width,
          pageViewportHeight: vp1.height,
          boxX,
          boxY,
          boxW,
          boxH,
          fitW,
          fitH,
          drawImageDestRect: { x: boxX, y: boxY, w: fitW, h: fitH }
        });

        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  return canvas.toDataURL('image/jpeg', 1.0);
}





_getPlaceholderDataUrl(p) {
  const preferred = [
    'overlaySrc',          // ✅ canonical
    'signatureDataUrl',    // ✅ drawn signature
    'SignatureSrc', 'signatureSrc',
    'imageSrc', 'FullNameSrc', 'AbnSrc', 'InitialsSrc', 'DateSrc', 'NameSrc', 'canvasSrc'
  ];
  for (const k of preferred) {
    const v = p?.[k];
    if (typeof v === 'string' && /^data:image\/(png|jpeg);base64,/.test(v)) return v;
  }
  for (const [k, v] of Object.entries(p || {})) {
    if (typeof v === 'string' && /^data:image\/(png|jpeg);base64,/.test(v)) return v;
  }
  return null;
}



async _collectChangedPagesBase64() {
  const entries = Array.from(this.changedPages.entries());
  console.log('[DIFF] entries:', entries);

  const dirty = entries.filter(([, v]) => v?.dirty);
  console.log('[DIFF] dirty pages:', dirty.map(([p]) => p));

  if (!dirty.length) return { images: [], pageNumbers: [] };

  const images = [];
  const pageNumbers = [];

  for (const [pageNumber, meta] of dirty) {
    const base64 = await this._renderPageToBase64(pageNumber);
    images.push(base64);
    pageNumbers.push(pageNumber);
    // keep meta/base64 if you want to cache
    this.changedPages.set(pageNumber, { ...meta, base64, dirty: false });
    console.log('[DIFF] composed page', pageNumber, 'len', base64?.length);
  }
  return { images, pageNumbers };
}

    handleUploadSignature(event) {
  this.placeholderId = event.currentTarget.dataset.id;
  this.isSignatureModalVisible = true;
}

    // Close the upload or draw options modal
    closeSignatureModal() {
        this.isSignatureModalVisible = false;
    }

    // Handle "Upload Signature" option
    handleUploadOption() {
        this.isSignatureModalVisible = false; // Close modal
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png, image/jpeg';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                this.showToast('Error', 'No file selected.', 'error');
                return;
            }

            // Trigger existing image upload process
            this.onImageUpload({ target: { files: [file], dataset: { id: this.placeholderId } } });
        });

        fileInput.click();
    }

    
// Helper: fit image inside box (contain), keeping aspect ratio
_fitRect(targetW, targetH, imgW, imgH) {
  if (!imgW || !imgH || !targetW || !targetH) return { x: 0, y: 0, w: targetW, h: targetH };
  const rImg = imgW / imgH;
  const rBox = targetW / targetH;
  let w, h;
  if (rImg > rBox) {
    w = targetW;
    h = Math.round(w / rImg);
  } else {
    h = targetH;
    w = Math.round(h * rImg);
  }
  return { x: Math.round((targetW - w) / 2), y: Math.round((targetH - h) / 2), w, h };
}


    // Pretty/safe dataURL logger
_logDataUrl(label, dataUrl, max = 160) {
  try {
    if (typeof dataUrl !== 'string') {
      console.log(label, '(not a string)', dataUrl);
      return;
    }
    const m = /^data:(?<mime>[^;]+);base64,(?<b64>.*)$/.exec(dataUrl) || {};
    const mime = m.groups?.mime || 'unknown';
    const b64  = m.groups?.b64 || '';
    const head = b64.slice(0, max);
    const tail = b64.slice(-Math.min(32, b64.length));
    console.log(`${label} -> mime=${mime} len=${b64.length} head="${head}" ... tail="${tail}"`);
  } catch (e) {
    console.log(`${label} -> <log failed>`, e);
  }
}

// Quick pixel check to detect a blank (fully transparent) canvas
_isCanvasBlank(canvas) {
  try {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    if (!width || !height) return true;
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < data.length; i += 4) { // alpha channel only
      if (data[i] !== 0) return false;
    }
    return true;
  } catch (e) {
    console.warn('[SIG] blank-check failed', e);
    return false; // don’t block on errors
  }
}


_initSignatureCanvasDPR(canvas) {
  if (!canvas) { console.warn('[SIG] no canvas in init'); return; }

  // ensure non-zero CSS size
  let rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    canvas.style.width  = '600px';
    canvas.style.height = '180px';
    rect = canvas.getBoundingClientRect();
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = '#000';

  this.canvasContext = ctx;
  console.log('[SIG] init', {
    cssW: rect.width, cssH: rect.height, dpr,
    bufW: canvas.width, bufH: canvas.height
  });
}


// 2) Pointer → canvas coords in CSS px
_getCanvasPoint(evt, canvas) {
  const r = canvas.getBoundingClientRect();
  return { x: evt.clientX - r.left, y: evt.clientY - r.top };
}

// 3) Open modal → wait for layout → init DPR
handleDrawOption() {
  this.isSignatureModalVisible = false;
  this.isDrawingModalVisible = true;

  // double RAF = after layout/paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const canvas = this.template.querySelector('.signature-canvas');
      if (canvas) this._initSignatureCanvasDPR(canvas);
    });
  });
}

closeDrawingModal() {
  this.isDrawingModalVisible = false;
  this.isDrawing = false;
}

startDrawing(evt) {
  const canvas = this.template.querySelector('.signature-canvas');
  if (!canvas) { console.warn('[SIG] start: no canvas'); return; }
  if (!this.canvasContext) this._initSignatureCanvasDPR(canvas);
  const { x, y } = this._getCanvasPoint(evt, canvas);
  this.isDrawing = true;
  this.canvasContext.beginPath();
  this.canvasContext.moveTo(x, y);
  console.log('[SIG] start', { x, y });
  if (evt.cancelable) evt.preventDefault();
}

draw(evt) {
  if (!this.isDrawing || !this.canvasContext) return;
  const canvas = this.template.querySelector('.signature-canvas');
  const { x, y } = this._getCanvasPoint(evt, canvas);
  this.canvasContext.lineTo(x, y);
  this.canvasContext.stroke();
  if (!this._strokeCount) this._strokeCount = 0;
  this._strokeCount++;
  if ((this._strokeCount % 20) === 0) {
    console.log('[SIG] draw', { x, y, strokes: this._strokeCount });
  }
  if (evt.cancelable) evt.preventDefault();
}

stopDrawing(evt) {
  if (!this.isDrawing) return;
  this.isDrawing = false;
  if (this.canvasContext) this.canvasContext.closePath();
  console.log('[SIG] stop');
}


clearCanvas() {
  const canvas = this.template.querySelector('.signature-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // clear physical buffer
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // re-init DPR & pen
  this._initSignatureCanvasDPR(canvas);
}


async saveDrawnSignature() {
  const canvas = this.template.querySelector('.signature-canvas');
  if (!canvas) { console.warn('[SIG] save: no canvas'); return; }

  console.log('[SIG] save rect', canvas.getBoundingClientRect(), 'buffer', { w: canvas.width, h: canvas.height });
  if (this._isCanvasBlank?.(canvas)) console.warn('[SIG] save: canvas appears blank');

  const originalDataUrl = canvas.toDataURL('image/png');
  const base64  = originalDataUrl.split(',')[1];
  this._logDataUrl?.('[SIG] dataUrl (to be saved)', originalDataUrl);

  this.isDrawingModalVisible = false;

  const phId = parseInt(this.placeholderId, 10);
  const placeholder = this.placeholders.find(p => p.id === phId);
  if (!placeholder) { console.warn('[SIG] save: placeholder not found', phId); return; }

  // 🔥 NEW: Generate composite image (TSigned + GUID)
  const finalImage = await this.generateSignedImage(
    originalDataUrl,
    this.sessionGuid
  );

  const isCustomSig = placeholder.isCustomSignature;

  // --- canonical + legacy fields ---
  placeholder.isSignature       = !isCustomSig;
  placeholder.signatureDataUrl  = finalImage;   // ✅ now composite image
  placeholder.SignatureSrc      = finalImage;
  placeholder.imageSrc          = finalImage;
  placeholder.hasImage          = true;

  // reactive updates
  this.placeholders = this.placeholders.map(p =>
    p.id === phId ? {
      ...p,
      isSignature: !isCustomSig,
      hasImage: true,
      signatureDataUrl: finalImage,
      SignatureSrc: finalImage,
      imageSrc: finalImage
    } : p
  );

  const pageArr = this.placeholdersByPage[this.currentPage] || [];
  const idx = pageArr.findIndex(p => p.id === phId);

  const updated = (idx > -1)
    ? [
        ...pageArr.slice(0, idx),
        {
          ...pageArr[idx],
          isSignature: !isCustomSig,
          hasImage: true,
          signatureDataUrl: finalImage,
          SignatureSrc: finalImage,
          imageSrc: finalImage
        },
        ...pageArr.slice(idx + 1)
      ]
    : [...pageArr, { ...placeholder }];

  this.placeholdersByPage = { ...this.placeholdersByPage, [this.currentPage]: updated };

  // ✅ Keep your existing pipeline intact
  this.updatePlaceholderWithCanvas(placeholder, 'SignatureSrc', 'Signature updated!');

  // ✅ Save ORIGINAL base64 (important for storage consistency)
  this.saveImageBase64(base64);
}

onImageUpload(event) {
  this.isattachError = false;

  const input = event.target;
  const files = input?.files;

  if (!files || files.length === 0) {
    this.showToast("Error", "No file selected.", "error");
    this.showSpinner = false;
    return;
  }

  this.showSpinner = true;

  const file = files[0];
  const fileType = file.type;
  const fileSize = file.size;

  const placeholderIdRaw = input.dataset.id;
  const placeholderId = parseInt(placeholderIdRaw, 10);

  if (!Number.isFinite(placeholderId)) {
    this.showToast("Error", "Invalid placeholder id.", "error");
    this.showSpinner = false;
    return;
  }

  const existingPlaceholder = (this.placeholders || []).find((item) => item.id === placeholderId);
  if (!existingPlaceholder) {
    this.showToast("Error", "Placeholder not found.", "error");
    this.showSpinner = false;
    return;
  }

  const validImageTypes = ["image/png", "image/jpeg"];
  if (!validImageTypes.includes(fileType)) {
    this.isattachError = true;
    this.showToast("Error", "Invalid file type. Please upload a PNG or JPEG image.", "error");
    this.showSpinner = false;
    return;
  }

  const MAX_FILE_SIZE = 1048576;
  const MIN_FILE_SIZE = 10240;
  if (fileSize > MAX_FILE_SIZE || fileSize < MIN_FILE_SIZE) {
    this.isattachError = true;
    this.showToast("Error", "File size must be between 10KB and 1MB.", "error");
    this.showSpinner = false;
    return;
  }

  const reader = new FileReader();

  reader.onloadend = async () => {
    try {
      const result = reader.result;
      if (!result || typeof result !== "string") {
        this.isattachError = true;
        this.showToast("Error", "Unable to read the selected file.", "error");
        this.showSpinner = false;
        return;
      }

      const parts = result.split(",");
      const base64Data = parts?.[1];

      if (!base64Data) {
        this.isattachError = true;
        this.showToast("Error", "Invalid file data.", "error");
        this.showSpinner = false;
        return;
      }

      const originalImage = `data:${fileType};base64,${base64Data}`;

      // 🔥 NEW: Generate composite image (TSigned + GUID)
      const finalImage = await this.generateSignedImage(
        originalImage,
        this.sessionGuid
      );

      const page = this.currentPage;

      const isCustomSig = existingPlaceholder.isCustomSignature;

      const updatedFields = {
        hasImage: true,
        imageSrc: finalImage, // ✅ replaced with composite image

        isSignature: !isCustomSig,
        signatureDataUrl: finalImage,
        SignatureSrc: finalImage,

        isPlaceholder: false
      };

      // ✅ 1) Update main placeholders
      this.placeholders = (this.placeholders || []).map((p) =>
        p.id === placeholderId ? { ...p, ...updatedFields } : p
      );

      // ✅ 2) Update page placeholders
      const pageArr =
        this.placeholdersByPage && this.placeholdersByPage[page]
          ? this.placeholdersByPage[page]
          : null;

      if (pageArr) {
        const updatedPageArr = pageArr.map((p) =>
          p.id === placeholderId ? { ...p, ...updatedFields } : p
        );

        this.placeholdersByPage = {
          ...this.placeholdersByPage,
          [page]: updatedPageArr
        };
      }

      // ✅ 3) Trigger PDF embedding pipeline
      const placeholderAfter =
        (this.placeholdersByPage?.[page] || []).find((p) => p.id === placeholderId) ||
        (this.placeholders || []).find((p) => p.id === placeholderId);

      if (placeholderAfter && typeof this.updatePlaceholderWithCanvas === "function") {
        this.updatePlaceholderWithCanvas(
          placeholderAfter,
          "SignatureSrc",
          "Signature updated!"
        );
      } else if (!placeholderAfter) {
        console.warn("⚠️ Updated placeholder not found after upload;");
      }

      // ✅ Keep your existing save behavior (raw base64)
      this.saveImageBase64(base64Data);

    } catch (e) {
      console.error("❌ onImageUpload failed:", e);
      this.isattachError = true;
  
    } finally {
      this.showSpinner = false;

      try {
        if (input && "value" in input) input.value = null;
      } catch (_) {}
    }
  };

  reader.onerror = () => {
    this.isattachError = true;
    this.showToast("Error", "Failed to read the selected file.", "error");
    this.showSpinner = false;

    try {
      if (input && "value" in input) input.value = null;
    } catch (_) {}
  };

  reader.readAsDataURL(file);
}

generateSignedImage(signatureDataUrl, guid) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.src = signatureDataUrl;

        img.onload = () => {

            const scaleFactor = 2;

            const maxWidth = 200;
            const scale = Math.min(maxWidth / img.width, 1);

            const imgWidth = img.width * scale;
            const imgHeight = img.height * scale;

            // 🔥 Layout tuning
            const paddingX = 26;
            const paddingY = 18;
            const gapLabelToImg = 10;
            const gapImgToGuid = 10;

            // 🔥 Typography (DocuSign-like)
            // const labelFontSize = 18;
            // const guidFontSize = 15;

            const labelFontSize = 22;
            const guidFontSize = 20;

            const totalWidth = imgWidth + paddingX * 2 + 40;
            const totalHeight =
                paddingY +
                labelFontSize +
                gapLabelToImg +
                imgHeight +
                gapImgToGuid +
                guidFontSize +
                paddingY;

            canvas.width = totalWidth * scaleFactor;
            canvas.height = totalHeight * scaleFactor;
            ctx.scale(scaleFactor, scaleFactor);

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, totalWidth, totalHeight);

            // 🔥 PERFECT DOCUSIGN CURVE (using arcTo)
            const x = 22;
            const top = paddingY;
            const bottom = totalHeight - paddingY;
            const r = 14; // radius controls curve smoothness

            ctx.strokeStyle = '#2a6edb';
            ctx.lineWidth = 2.5;

            ctx.beginPath();

            // Start top-right of curve
            ctx.moveTo(x + r, top);

            // Top rounded corner
            ctx.arcTo(x, top, x, top + r, r);

            // Vertical line
            ctx.lineTo(x, bottom - r);

            // Bottom rounded corner
            ctx.arcTo(x, bottom, x + r, bottom, r);

            ctx.stroke();

            // 🔥 Content start (aligned visually with curve opening)
            const contentX = x + r + 10;

            // 🔥 LABEL (clean, not too bold)
            ctx.fillStyle = '#222';
            ctx.font = `600 ${labelFontSize}px Arial`;
            ctx.fillText('TSigned by:', contentX, top + 1);

            // Signature
            const imgY = top + labelFontSize + gapLabelToImg;

            ctx.drawImage(
                img,
                contentX,
                imgY,
                imgWidth,
                imgHeight
            );

            // 🔥 GUID (subtle, not heavy)
            const shortGuid = guid.substring(0, 18) + '...';

            ctx.fillStyle = '#666';
            ctx.font = `${guidFontSize}px monospace`;

            const guidY = bottom - 2;

            ctx.fillText(
                shortGuid,
                contentX,
                guidY
            );

            resolve(canvas.toDataURL('image/png'));
        };
    });
}

    // Save Base64 data to Salesforce
    saveImageBase64(base64Data) {
        saveImageToSalesforce({ recordId: this.recordId, base64Content: base64Data })
            .then(() => {
                // this.showToast('Success', 'Signature saved successfully.', 'success');
            })
            .catch((error) => {
                console.error('Error saving signature:', error);
                // this.showToast('Error', 'Failed to save signature.', 'error');
            })
            .finally(() => {
                this.showSpinner = false;
            });
    }

    // Show toast notifications
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant,
            })
        );
    }

    retrieveFileName() {
            // Call Apex to retrieve the file name from File_Name__c
            return new Promise((resolve, reject) => {
                getFileNameFromRecord({ recordId: this.recordId })
                    .then((fileName) => {
                        console.log('Retrieved file name:', fileName);
                        resolve(fileName);
                    })
                    .catch((error) => {
                        console.error('Error fetching file name:', error);
                        reject(error);
                    });
            });
        }
        
        uploadFileToSalesforce(fileBlob, fileName) {
            uploadFileToSalesforce({
                fileBlob,
                fileName,
                recordId: this.recordId
            })
                .then(() => {
                    console.log('Preview image uploaded successfully to Salesforce Files.');
                    this.showToast('Success', 'Preview image uploaded successfully.', 'success');
                })
                .catch((error) => {
                    console.error('Error uploading preview image:', error);
                    this.showToast('Error', 'Image upload failed.', 'error');
                });
        }
        
        
        
    
        showToast(title, message, variant) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title,
                    message,
                    variant,
                })
            );
        }
    
        
    
        /**
         * Opens the signature modal.
         */
        openSignatureModal() {
            this.isSignatureModalVisible = true;
        }
    
        /**
         * Closes the signature modal.
         */
        closeSignatureModal() {
            this.isSignatureModalVisible = false;
        }
    
        /**
         * Opens the name signature modal.
         */
        openNameSignatureModal() {
            console.log('Enter Name for Signature clicked'); // Debug
            this.isNameSignatureModalVisible = true;
            console.log('isNameSignatureModalVisible:', this.isNameSignatureModalVisible); // Debug
        }
        
        
    
        /**
         * Closes the name signature modal.
         */
        closeNameSignatureModal() {
            this.isNameSignatureModalVisible = false;
            this.enteredName = '';
            this.styledPreviews = [];
        }
    
        /**
         * Handles input change for the name field.
         * @param {Event} event - Input event.
         */
        handleNameInput(event) {
            this.enteredName = event.target.value;
    
            // Regenerate font previews whenever the name changes
            this.generateFontStyles();
        }
    
        /**
         * Generates font previews based on the entered name.
         */
        generateFontStyles() {
            if (!this.enteredName) {
                this.styledPreviews = [];
                return;
            }
    
            // Add more stylish and calligraphy fonts
            const fontStyles = [
                'adage-script-jf',
                'adobe-handwriting-ernie',
                'adobe-handwriting-frank',
                'adobe-handwriting-tiffany',
                'adore-you',
                'adore-you-slanted',
                'adorn-bouquet',
                'adorn-coronet',
                'adorn-garland',
                'adorn-pomander',
                'adventures-unlimited',
                'alana-smooth',
                'altesse-std-24pt',
                'altesse-std-64pt',
                'antiquarian-scribe',
                'avalon',
                'farnham-text',
                'filmotype-jade',
                'filmotype-kitten',
                'handsome-pro',
                'handsome-pro-classic',
                'handsome-pro-nib',
                'handsome-pro-rough',
                'limon-bold-marker',
                'limon-bold-marker-outline',
                'limon-regular',
                'limon-regular-marker',
                'limon-regular-marker-outline',
                'limon-script',
                'limon-script-regular-outline',
                'lindsey-signature',
                'logic-monoscript',
                'logic-monospace',
                'mina',
                'p22-allyson-pro',
                'p22-cezanne-pro',
                'p22-typewriter',
                'parfumerie-script',
                'professor',
                'recherche',
                'rizado-script',
                'salamat',
                'sanvito-pro',
                'sanvito-pro-caption',
                'sanvito-pro-display',
                'sanvito-pro-subhead',
                'shabby-chic',
                'timberline',
                'voluta-script-pro',
                'youngblood',         
            ];
    
            this.styledPreviews = fontStyles.map((font, index) => ({
                id: index,
                fontFamily: font,
                name: this.enteredName,
            }));
    
            // Render fonts on canvases after DOM updates
            this.renderFontPreviews();
        }
    

    renderFontPreviews() {
        setTimeout(() => {
            this.styledPreviews.forEach((style) => {
                const canvas = this.template.querySelector(`canvas[data-id="${style.id}"]`);
                if (canvas) {
                    const context = canvas.getContext('2d');
                    
                    // Set an initial font
                    let fontSize = 50;
                    context.font = `${fontSize}px '${style.fontFamily}', sans-serif`;
    
                    // Measure text width
                    const textWidth = context.measureText(style.name).width;
                    const padding = 40; // Some padding around text
    
                    // Dynamically resize canvas width if needed
                    const requiredWidth = textWidth + padding;
                    if (requiredWidth > canvas.width) {
                        canvas.width = requiredWidth;
                    }
    
                    // Clear and redraw
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.font = `${fontSize}px '${style.fontFamily}', sans-serif`;
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillStyle = '#000';
    
                    // Draw the text centered
                    context.fillText(style.name, canvas.width / 2, canvas.height / 2);
                }
            });
        }, 0);
    }
    
    
    

    /**
     * Handles style selection when a user clicks on a font preview.
     * @param {Event} event - Click event.
     */
handleStyleSelection(event) {
  const styleId = Number(event.currentTarget.dataset.id);
  this.selectedStyle = this.styledPreviews.find(s => s.id === styleId);

  // UI highlight
  this.template.querySelectorAll('.signature-font-style').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  // Render the selected font into the currently selected placeholder
  this.updatePlaceholderWithFontStyle(); // no change to call site
}

async updatePlaceholderWithFontStyle() {
  if (!this.selectedStyle || !this.placeholderId) {
    this.showToast('Error', 'Please select a style and ensure a placeholder is selected.', 'error');
    return;
  }

  const placeholder = this.placeholders.find(
    (item) => item.id === Number(this.placeholderId)
  );
  if (!placeholder) {
    this.showToast('Error', 'No placeholder found for this operation.', 'error');
    return;
  }

  // --- get placeholder size ---
  const { widthPx, heightPx } = this.getPlaceholderPixelSize(placeholder);

  const fontFamily = this.selectedStyle.fontFamily || 'serif';

  // 🔥 STEP 1: Generate plain text signature (existing logic)
  const rawSignature = await this.renderSignatureToDataURL({
    text: this.enteredName || '',
    fontFamily,
    boxWidthPx: widthPx,
    boxHeightPx: heightPx,
    padding: 8
  });

  // 🔥 STEP 2: Wrap into DocuSign-style image (NEW)
  const finalImage = await this.generateSignedImage(
    rawSignature,
    this.sessionGuid
  );

  const isCustomSig = placeholder.isCustomSignature;

  // --- update placeholder ---
  Object.assign(placeholder, {
    hasImage: true,
    imageSrc: finalImage,
    isSignature: !isCustomSig,
    signatureDataUrl: finalImage,
    SignatureSrc: finalImage
  });

  // --- sync cache ---
  const pageArr = this.placeholdersByPage[this.currentPage] || [];
  const cached = pageArr.find(p => p.id === Number(this.placeholderId));

  if (cached) Object.assign(cached, {
    hasImage: true,
    imageSrc: finalImage,
    isSignature: !isCustomSig,
    signatureDataUrl: finalImage,
    SignatureSrc: finalImage
  });

  // --- reactivity ---
  this.placeholders = [...this.placeholders];

  if (this.placeholdersByPage[this.currentPage]) {
    this.placeholdersByPage[this.currentPage] = [
      ...this.placeholdersByPage[this.currentPage]
    ];
  }

  // --- mark dirty for PDF embedding ---
  this.updatePlaceholderWithCanvas(
    placeholder,
    'SignatureSrc',
    'Signature updated!'
  );

  this.markPageDirty(Number(placeholder.page) || this.currentPage || 1);

  this.showToast('Success', 'Font style added!', 'success');
  this.closeNameSignatureModal();
  this.closeSignatureModal();
}

/** Measure the actual on-screen box (CSS px). */
getPlaceholderPixelSize(placeholder) {
  // If you already store width/height in px on the placeholder, use those.
  if (placeholder.widthPx && placeholder.heightPx) {
    return { widthPx: placeholder.widthPx, heightPx: placeholder.heightPx };
  }
  // Otherwise, query the element that renders this placeholder.
  // Adjust the selector to match your markup (e.g., data attributes you use).
  const el = this.template.querySelector(`[data-placeholder-id="${placeholder.id}"]`);
  if (el) {
    const rect = el.getBoundingClientRect();
    return { widthPx: Math.max(1, Math.floor(rect.width)), heightPx: Math.max(1, Math.floor(rect.height)) };
  }
  // Fallback to a sane default to avoid crashes
  return { widthPx: 150, heightPx: 75 };
}

/** Render the typed signature so it fits inside the given box. */
async renderSignatureToDataURL({ text, fontFamily, boxWidthPx, boxHeightPx, padding = 8, fontWeight = 400 }) {
  const dpr = window.devicePixelRatio || 1;
  const scale = 4; // High resolution scale factor
  const w = Math.max(1, Math.floor(boxWidthPx * dpr * scale));
  const h = Math.max(1, Math.floor(boxHeightPx * dpr * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Ensure font is loaded before measuring (important for web fonts)
  const guess = Math.floor(h * 0.7);
  try { await document.fonts.load(`${fontWeight} ${guess}px ${fontFamily}`); } catch (e) {}

  const targetW = w - padding * 2 * dpr * scale;
  const targetH = h - padding * 2 * dpr * scale;

  // Binary search for largest font that fits width & height
  let lo = 6 * dpr * scale, hi = guess, best = Math.min(guess, targetH);
  const fits = (sz) => {
    ctx.font = `${fontWeight} ${sz}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = sz * 1.1; // approx ascent+descent
    return textW <= targetW && textH <= targetH;
  };
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fits(mid)) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
  }

  // Draw centered, crisp (no background)
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.font = `${fontWeight} ${best}px ${fontFamily}`;
  ctx.fillText(text, w / 2, h / 2);

  return c.toDataURL('image/png');
}



// Utility: toast
_toast(message, variant='success') {
  this.dispatchEvent(
    new ShowToastEvent({ title: 'PDF', message, variant })
  );
}


sidebarAnimTimer;

toggleSidebar() {
    const opening = !this.isSidebarOpen;

    clearTimeout(this.sidebarAnimTimer);

    if (opening) {
        this.isSidebarOpen = true;
        this.sidebarAnimTimer = setTimeout(() => {
            this.displayHamburgerIcon = 'close';
        }, 220);
    } else {
        this.displayHamburgerIcon = 'menu';
        this.sidebarAnimTimer = setTimeout(() => {
            this.isSidebarOpen = false;
        }, 300);
    }
}




async generateThumbnailsAsync() {
    if (!this.pdfDoc) return;

    this.thumbnails = [];

    for (let i = 1; i <= this.pdfDoc.numPages; i++) {

        const page = await this.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // ✅ Improve clarity (retina support)
        const dpr = window.devicePixelRatio || 1;

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;

        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const isActive = i === this.currentPage;

        this.thumbnails = [
            ...this.thumbnails,
            {
                page: i,
                src: canvas.toDataURL('image/jpeg', 0.7),
                isActive,
                className: isActive
                    ? 'thumbnail-item active'
                    : 'thumbnail-item'
            }
        ];

        // ✅ Yield control every few pages
        if (i % 3 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
}  

get hamburgerIcon() {
    return this.isSidebarOpen ? 'close' : 'menu';
}

@track displayHamburgerIcon = 'menu';

get sidebarClass() {
    return this.isSidebarOpen
        ? 'sidebar-overlay custom-scroll open'
        : 'sidebar-overlay custom-scroll';
}

get hamburgerClass() {
    return this.isSidebarOpen
        ? 'hamburger-container open'
        : 'hamburger-container';
}

get hamburgerStyle() {
    return this.isSidebarOpen
        ? 'left: 260px;'  // align with sidebar edge
        : 'left: 0px;';
}

handleThumbnailClick(event) {
    const page = Number(event.currentTarget.dataset.page);

    if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
    }

    this._log('nav:thumbnail', { from: this.currentPage, to: page });

    this.currentPage = page;
    this.renderPageAsImage(page);

    // ✅ ONLY THIS
    this.syncThumbnailUI();
}

updateActiveThumbnail() {
    this.thumbnails = this.thumbnails.map(t => {
        if (t.page === this.currentPage && !t.isActive) {
            return { ...t, isActive: true, className: 'thumbnail-item active' };
        }
        if (t.isActive && t.page !== this.currentPage) {
            return { ...t, isActive: false, className: 'thumbnail-item' };
        }
        return t;
    });
}

syncThumbnailUI() {
    // 1. Update state
    this.updateActiveThumbnail();

    // 2. Wait for DOM to update before scrolling
    if (this.isSidebarOpen) {
        setTimeout(() => {
    this.scrollToActiveThumbnail();
}, 0);
    }
}

scrollToActiveThumbnail() {
    const active = this.template.querySelector('.thumbnail-item.active');
    const container = this.template.querySelector('.thumbnail-sidebar');

    if (!active || !container) return;

    const rect = active.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    const isVisible =
        rect.bottom > parentRect.top &&
        rect.top < parentRect.bottom;

    if (!isVisible) {
        active.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

handleDone() {

    this.showSuccessScreen = false;

    this.dispatchEvent(
        new CustomEvent(
            'documentsuccess',
            {
                detail: {
                    isCreateOptionsModalOpen: false,
                    createtemplatesFlag: true
                },
                bubbles: true,
                composed: true
            }
        )
    );

    console.log(
        '✅ Done clicked → closing popup'
    );
}

handleContinueToTsign() {

    console.log(
        '🚀 Continue to TSign clicked'
    );

    console.log(
        '📌 pdfUrl:',
        this.pdfUrl
    );

    console.log(
        '📌 recordId:',
        this.recordId
    );

    console.log(
        '📧 clientEmail:',
        this.clientEmail
    );

     this.showToast(
        'Success',
        this.documentName
            ? `Document '${this.documentName}' has been sent successfully.`
            : 'Document has been sent successfully.',
        'success'
    );

    this.dispatchEvent(

        new CustomEvent(

            'continuetotsign',

            {

                detail: {

                    pdfUrl:
                        this.pdfUrl,

                    recordId:
                        this.recordId,

                    clientEmail:
                        this.clientEmail
                },

                bubbles: true,

                composed: true
            }
        )
    );

    console.log(
        '📨 Event dispatched'
    );
}

handleBack() {
    this.dispatchEvent(new CustomEvent('back'));
}


}