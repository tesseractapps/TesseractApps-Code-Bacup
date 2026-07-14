import { LightningElement, track, api, wire } from "lwc";
import pdfjsLib from "@salesforce/resourceUrl/pdfJS";
import pdfWorker from "@salesforce/resourceUrl/pdfWorker";
import { loadScript } from "lightning/platformResourceLoader";
import saveTemplateData from "@salesforce/apex/TemplateController.saveTemplateData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import updateRecordWithAWSUrl from "@salesforce/apex/TemplateController.updateRecordWithAWSUrl";
import mammothJs from "@salesforce/resourceUrl/mammothJs";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import html2canvasLib from "@salesforce/resourceUrl/html2canvas";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";


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

     @api pdfUrl;
     @api placeholderJson;

    _pagePt = null;
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

    get isViewMode() {
    return this.pdfUrl && this.placeholderJson;
}

     connectedCallback(){
      console.log('orgid---->', this.orgid);
        this.loadPdfLibraries();

     if (this.isViewMode) {
        this.initializeViewMode();
        this.isFileUploaded = true;
    } else {
        // 🔥 CREATE MODE
        this.isFileUploaded = false;
    }
     }

     initializeViewMode() {
    try {
        this.placeholders = this.placeholderJson
            ? JSON.parse(this.placeholderJson)
            : [];

        console.log('View Mode placeholders:', this.placeholders);

        this.isFileUploaded = true; // 🔥 IMPORTANT → show PDF UI

        this.loadPdf(this.pdfUrl);

    } catch (e) {
        console.error('Invalid placeholder JSON', e);
        this.placeholders = [];
    }
}

     async loadPdfLibraries() {
    try {
      await loadScript(this, pdfjsLib);
      await loadScript(this, pdfWorker);

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

      // Load Mammoth.js dynamically
      if (!mammothJs) {
        throw new Error("Mammoth.js is not available.");
      }
      await loadScript(this, mammothJs);
      console.log("Mammoth.js loaded successfully.");
      console.log("Mammoth.js:", mammothJs);
      await loadScript(this, jsPDF);
      await loadScript(this, html2canvasLib);
      console.log("jsPDF and html2canvas libraries loaded successfully.");
    } catch (error) {
      throw new Error("Error while loading libraries: " + error.message);
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

/*     handleSaveAndUpload() {
      // ✅ Prevent duplicate record creation if multiple handlers call save
      if (this._savingInProgress) {
        console.warn("⛔ Save already in progress, skipping handleSaveAndUpload.");
        return;
      }
      this._savingInProgress = true;
    
      console.log("🟦 START handleSaveAndUpload");
    
      if (!this.fileName) {
        console.warn("🟨 handleSaveAndUpload: Missing fileName");
        this.showToast("Error", "Please provide a file name and select a file.", "error");
    
        // ✅ release lock for retry
        this._savingInProgress = false;
        return;
      }
    
      const finalUrl = this.url || this.tsignReurl || "";
      this.isLoading = true;
    
      console.log("🟦 handleSaveAndUpload inputs:", {
        fileName: this.fileName,
        tsignReurl: this.tsignReurl,
        url: this.url,
        finalUrl,
        source: this.source,
        serviceId: this.serviceId,
        quoteId: this.quoteId,
        formId: this.formId
      });
    
      const picklistValue = this.getPicklistValue();
    
      const resolvedServiceId = this.source === "SERVICE" ? (this.serviceId || "") : "";
      const resolvedQuoteId = this.source === "QUOTE" ? (this.quoteId || null) : null;
      const resolvedFormId = this.source === "FORM" ? (this.formId || "") : "";
    
      console.log("🟦 handleSaveAndUpload resolved values:", {
        picklistValue,
        resolvedServiceId,
        resolvedQuoteId
      });
    
      createOfferTemplate({
        fileName: this.fileName,
        picklistValue,
        orgId: this.orgid,
        serviceId: resolvedServiceId,
        quoteId: resolvedQuoteId,
        url: finalUrl,
        formId: resolvedFormId
      })
        .then((recordId) => {
          this.recordId = recordId;
          console.log("🟩 handleSaveAndUpload record created:", recordId);
    
          if (finalUrl) {
            console.log("🟦 handleSaveAndUpload updating AWS URL:", finalUrl);
    
            return updateRecordWithAWSUrl({
              recordId: this.recordId,
              awsUrl: finalUrl,
              serviceId: resolvedServiceId,
              quoteId: resolvedQuoteId,
              formId: resolvedFormId
            }).then(() => {
              console.log("🟩 handleSaveAndUpload AWS URL updated");
              return finalUrl;
            });
          }
    
          console.log("🟦 handleSaveAndUpload no URL, calling retrieveFileUrl()");
          return this.retrieveFileUrl();
        })
        .then((urlToRender) => {
          console.log("🟦 handleSaveAndUpload urlToRender:", urlToRender);
    
          if (urlToRender) {
            this.awsUrl = urlToRender;
            return this.loadPdf(urlToRender);
          }
          return null;
        })
        .then(() => {
          console.log("🟩 handleSaveAndUpload completed successfully");
          this.isFileUploaded = true;
            this.isTemplateUploadChoiceModal = false;
      this.isFileExpand = false;
      this.isFileExpand1 = false;
      console.log("🟦 isFileUploaded:", this.isFileUploaded);
          this.showToast("Success", "Document Uploaded successfully.", "success");
        })
        .catch((error) => {
          console.error("❌ handleSaveAndUpload error:", error);
          this.showToast("Error", "Failed to upload/update record.", "error");
        })
        .finally(() => {
          console.log("🟦 isFileUploaded:", this.isFileUploaded);
          console.log("🟦 END handleSaveAndUpload");
          this.isLoading = false;
          this.showSpinner = false;
    
          // ✅ release lock + clear flow marker after save completes
          this._savingInProgress = false;
          if (this._activeFlow === "AWS_UPLOAD") {
            this._activeFlow = null;
          }
        });
    } */

    async loadPdf(url) {
    console.group("📄 [loadPdf]");
    console.log("➡️ called with url:", url);

    try {
        if (!url || typeof url !== "string") {
        console.error("❌ Invalid URL passed to loadPdf:", url);
        this.handleError("Failed to load PDF. Invalid URL.", new Error("Invalid URL"));
        console.groupEnd();
        return;
        }

        if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
        console.error("❌ pdfjsLib is not available on window:", window.pdfjsLib);
        this.handleError("Failed to load PDF. pdfjsLib missing.", new Error("pdfjsLib missing"));
        console.groupEnd();
        return;
        }

        this.showSpinner = true;
        this.isLoading = true;

        console.log("📌 Starting pdfjsLib.getDocument...");
        const loadingTask = window.pdfjsLib.getDocument(url);

        // Helpful hooks if pdf.js exposes these
        if (loadingTask?.onProgress) {
        loadingTask.onProgress = (p) => {
            console.log("⏳ PDF load progress:", p);
        };
        }

        this.pdfDoc = await loadingTask.promise;
        console.log("✅ PDF loaded. pdfDoc:", this.pdfDoc);

        this.totalPages = this.pdfDoc.numPages;
        this.currentPage = 1;

        console.log("📌 totalPages:", this.totalPages, "| currentPage:", this.currentPage);
        console.log("📌 Rendering first page as image...");
        await this.renderPageAsImage(this.currentPage);

        console.log("✅ loadPdf completed. imageSrc length:", this.imageSrc ? this.imageSrc.length : 0);
        console.groupEnd();
    } catch (error) {
        console.error("❌ loadPdf error:", error);
        this.handleError("Failed to load PDF.", error);
        console.groupEnd();
    } finally {
        // ensure spinners stop even if render throws
        this.showSpinner = false;
        this.isLoading = false;
    }
    }

    async renderPageAsImage(pageNumber) {
    console.group(`🖼️ [renderPageAsImage] page=${pageNumber}`);
    try {
        if (!this.pdfDoc) {
        console.error("❌ pdfDoc is null/undefined. loadPdf may have failed.");
        throw new Error("pdfDoc is not initialized");
        }

        console.log("📌 Getting page:", pageNumber);
        const page = await this.pdfDoc.getPage(pageNumber);
        console.log("✅ Got page object:", page);

        const vp1 = page.getViewport({ scale: 1 });
        this._pagePt = { w: vp1.width, h: vp1.height };
        console.log("📌 Page size (pt):", this._pagePt);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        const viewport = page.getViewport({ scale: 3.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        console.log("📌 Canvas size:", { w: canvas.width, h: canvas.height });
        console.log("📌 Rendering page to canvas...");
        const renderTask = page.render({ canvasContext: context, viewport });

        if (renderTask?.onContinue) {
        console.log("ℹ️ renderTask has onContinue");
        }

        await renderTask.promise;
        console.log("✅ Page rendered to canvas.");

        console.log("📌 Converting canvas to dataURL...");
        const dataUrl = canvas.toDataURL("image/png");
        console.log("✅ dataUrl generated. length:", dataUrl.length);

        console.log("📌 Preloading image to validate dataUrl...");
        await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log("✅ Image preload success. natural:", img.naturalWidth, img.naturalHeight);
            resolve();
        };
        img.onerror = (e) => {
            console.error("❌ Image preload failed:", e);
            reject(new Error("Image preload failed"));
        };
        img.src = dataUrl;
        });

        // Bind to template
        this.imageSrc = dataUrl;
        console.log("✅ imageSrc set. length:", this.imageSrc.length);
         this.isLoading = false;
        console.groupEnd();
    } catch (error) {
        console.error(`❌ renderPageAsImage error (page ${pageNumber}):`, error);
        this.handleError(`Failed to render page ${pageNumber}.`, error);
        console.groupEnd();
        throw error; // propagate error
    }
    }

    


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
    const newPlaceholder = {
      id: Date.now(),
      type,
      x, y,
      xPt, yPt,
      wPt: null, hPt: null,
      page: this.currentPage,
      style: `top:${y}px; left:${x}px; position:absolute;`,
      value: "",
      isName: type === "Name",
      isLastName: type === "LastName",
      isEmail: type === "Email",
      isContactNumber: type === "ContactNumber",
      isAddress: type === "Address",
      isDate: type === "Date",
      isDateOfSigning: type === "DateOfSigning",
      isInitials: type === "Initials",
      isABN: type === "ABN",
      isFullName: type === "FullName",
      isSignature: type === "Signature",
      recipient: "",
      customInlineStyle: false
    };

    // ⬇️ your current behavior (unchanged)
    this.newPlaceholder = newPlaceholder;
    this._commitPlaceholderPosition(newPlaceholder);

    this.styleOptions = {
  fontFamily: 'Roboto, Arial, sans-serif',
  fontSize: '14',
  bold: false,
  italic: false,
  underline: false,
  color: '#000000'
};
this.useCustomInlineStyle = false;
    this.showRecipientModal = true;

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
            newPlaceholder.style = `top:${pos.y}px; left:${pos.x}px; position:absolute;`;

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
  const id = event.currentTarget?.dataset?.id || event.target?.dataset?.id;
  if (!id) return;

  const ph = this.placeholders.find(p => p.id === parseInt(id, 10));
  if (!ph) return;

  this._dragging = true;
  this._dragButton = event.button ?? 0;
  this.currentDraggedPlaceholder = ph;

  const el = this.template.querySelector(`[data-id="${id}"]`);
  const box = el ? el.getBoundingClientRect() : null;
  this._dragW = box ? box.width : PLACEHOLDER_W_DEFAULT;
  this._dragH = box ? box.height : PLACEHOLDER_H_DEFAULT;

  // NEW: cache real size on the model so others “see” the true box
  ph.w = Math.round(this._dragW);
  ph.h = Math.round(this._dragH);

  window.addEventListener("mousemove", this.handleRearrangeMove, { passive: true });
  window.addEventListener("mouseup", this.handleRearrangeEnd);
  window.addEventListener("pointerup", this.handleRearrangeEnd);
  window.addEventListener("mouseleave", this.handleRearrangeEnd);
  window.addEventListener("blur", this.handleRearrangeEnd);

 /*  event.target.setPointerCapture?.(event.pointerId); */ 
}

// -----------------------------
// MOVE PLACEHOLDER
// -----------------------------
handleRearrangeMove = (event) => {
  // If no button is down anymore, stop dragging immediately
  if (!this._dragging || event.buttons === 0) {
    this.handleRearrangeEnd();
    return;
  }

  const ph = this.currentDraggedPlaceholder;
  if (!ph) return;

  const rect = this._getCanvasRect();
  if (!rect) return;

    // desired position (center under cursor)
  let x = event.clientX - rect.left - (this._dragW / 2);
  let y = event.clientY - rect.top  - (this._dragH / 2);

  // NEW: use the placeholder’s *visual* size (w/h + gutter) for math
  const mySize = this._getSize(this.currentDraggedPlaceholder);

  // clamp to page bounds using true size
  ({ x, y } = this._clampToRect(x, y, rect.width, rect.height, mySize.w, mySize.h));

  // avoid overlaps (exclude this moving id)
  const free = this._findFreeSpot(x, y, mySize.w, mySize.h, rect.width, rect.height, ph.page, ph.id);
  x = free.x; y = free.y;


  // apply
  ph.x = x;
  ph.y = y;
  ph.style = `top:${y}px; left:${x}px; position:absolute;`;
};

// -----------------------------
// END DRAG
// -----------------------------
handleRearrangeEnd = () => {
  if (!this._dragging) return;

  const ph = this.currentDraggedPlaceholder;
  if (ph) {
    // compute PDF points for the final position
    if (this._pagePt) {
      const rect = this._getCanvasRect();
      if (rect) {
        ph.xPt = (ph.x / rect.width)  * this._pagePt.w;
        ph.yPt = (ph.y / rect.height) * this._pagePt.h;
      }
    }
    // make sure style matches final x/y
    ph.style = `top:${ph.y}px; left:${ph.x}px; position:absolute;`;

    // *** COMMIT the final data back into the canonical arrays ***
    this._commitPlaceholderPosition(ph);
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

    // You can customize size per placeholder type
    switch(type){

        case "Signature":
            return { w: 260, h: 80 };

        case "Address":
            return { w: 260, h: 70 };

        case "FullName":
        case "Name":
        case "LastName":
        case "Email":
        case "ContactNumber":
        case "ABN":
        case "Initials":
        case "Date":
        case "DateOfSigning":
            return { w: 240, h: 44 };

        default:
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
  let ix = x, iy = y;
  let steps = 0;

  // use each other's measured sizes
  const others = (this.placeholders || []).filter(p => p.page === page && p.id !== excludeId);

  const tryPos = (tx, ty) => !others.some(p => {
    const sz = this._getSize(p);            // p.w/p.h if measured, else default+gutter
    return this._bboxOverlap(tx, ty, w, h, p.x, p.y, sz.w, sz.h);
  });

  // initial clamp (using our own size)
  const clamped = this._clampToRect(ix, iy, rectW, rectH, w, h);
  ix = clamped.x; iy = clamped.y;
  if (tryPos(ix, iy)) return { x: ix, y: iy };

  // scan to the right with row wrap; use our own width/gutter step
  const stepX = Math.max(6, Math.floor(w / 3));
  const stepY = Math.max(8, Math.floor(h / 3));

  while (steps++ < 2000) { // bigger budget for dense layouts
    ix += stepX;
    if (ix + w > rectW) {
      ix = 0;
      iy += stepY;
    }
    if (iy + h > rectH) {
      // restart from top-left with slightly larger stride to escape dense zones
      ix = 0; iy = 0;
    }
    if (tryPos(ix, iy)) {
      return { x: ix, y: iy };
    }
  }

  // give up: return the clamped original
  return clamped;
}

_commitPlaceholderPosition(updated) {
  // 1) update flat list (source of truth)
  this.placeholders = (this.placeholders || []).map(p =>
    p.id === updated.id ? { ...p, ...updated } : p
  );

  // 2) update paged map (if you render from it anywhere)
  if (this.placeholdersByPage && updated.page != null) {
    const list = (this.placeholdersByPage[updated.page] || []).map(p =>
      p.id === updated.id ? { ...p, ...updated } : p
    );
    this.placeholdersByPage = {
      ...this.placeholdersByPage,
      [updated.page]: list
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

fontFamily: 'Roboto, Arial, sans-serif',
fontSize: '14',
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

  // base object with recipient
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

{label:'Roboto',value:'Roboto, Arial, sans-serif'},
{label:'Arial',value:'Arial, Helvetica, sans-serif'},
{label:'Times New Roman',value:'"Times New Roman", Times, serif'},
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
  // phOrType could be a placeholder or a string type
  if (phOrType && typeof phOrType === 'object') {
    return {
      w: (phOrType.w ?? PLACEHOLDER_W_DEFAULT) + GUTTER_X,
      h: (phOrType.h ?? PLACEHOLDER_H_DEFAULT) + GUTTER_Y,
    };
  }
  // fallback by type, if you later vary sizes by type
  return { w: PLACEHOLDER_W_DEFAULT + GUTTER_X, h: PLACEHOLDER_H_DEFAULT + GUTTER_Y };
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
  if (!ph?.id) return;
  const el = this.template.querySelector(`[data-id="${ph.id}"]`);
  if (!el) return;
  const r = el.getBoundingClientRect();
  // cache raw visual size (no gutter here)
  ph.w = Math.round(r.width);
  ph.h = Math.round(r.height);
}


saveTemplate() {

    if(!this.fileName || !this.url){
        this.showToast("Error","File information missing","error");
        return;
    }

    const placeholderJSON = JSON.stringify(this.placeholders);
    console.log("Saving Template Data");
    console.log("fileName:", this.fileName);
    console.log("url:", this.url);
    console.log("placeholders:", placeholderJSON);
     console.log("this.orgId:", this.orgId);
      console.log("this.key:", this.key);

    saveTemplateData({
        fileName : this.fileName,
        fileUrl : this.url,
        placeholderJSON : placeholderJSON,
        OrgId: this.orgid,
        key:this.key,
    })
    .then(result => {

        console.log("Template saved with Id:", result);

        this.showToast(
            "Success",
            "Template saved successfully",
            "success"
        );
        this.isFileUploaded = false;
        this.notifyParent();

    })
    .catch(error => {

        console.error("Error saving template", error);

        this.showToast(
            "Error",
            "Failed to save template",
            "error"
        );

    });

}


handleReset() {
   this.notifyParent();
   this.isFileUploaded = false;
   if (this.key) {
      this.deleteFile(this.key);
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

}