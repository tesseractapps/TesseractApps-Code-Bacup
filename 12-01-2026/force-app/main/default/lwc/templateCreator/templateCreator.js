import { LightningElement, track, api, wire } from "lwc";
import pdfjsLib from "@salesforce/resourceUrl/pdfJS";
import pdfWorker from "@salesforce/resourceUrl/pdfWorker";
import { loadScript } from "lightning/platformResourceLoader";
import createOfferTemplate from "@salesforce/apex/TemplateController.createOfferTemplate";
import uploadFileToAWS from "@salesforce/apex/TeSignAWSUploadController.uploadFile";
import getUploadedFileUrl from "@salesforce/apex/TemplateController.getUploadedFileUrl";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import savePlaceholders from "@salesforce/apex/TemplateController.savePlaceholders";
import getPlaceholders from "@salesforce/apex/TemplateController.getPlaceholders";
import sendRecordEmail from "@salesforce/apex/TemplateController.sendRecordEmail";
import saveEmailsToBackend from "@salesforce/apex/TemplateController.saveEmailsToBackend";
import updateCurrentRecipient from "@salesforce/apex/TemplateController.updateCurrentRecipient";
import startEmailSequence from "@salesforce/apex/TemplateController.startEmailSequence";
import advanceEmailSequence from "@salesforce/apex/TemplateController.advanceEmailSequence";
import updateRecordWithAWSUrl from "@salesforce/apex/TemplateController.updateRecordWithAWSUrl";
import TeSignLogo from "@salesforce/resourceUrl/Te_sign";
import mammothJs from "@salesforce/resourceUrl/mammothJs";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import html2canvasLib from "@salesforce/resourceUrl/html2canvas";
import getTSignURL from "@salesforce/apex/TemplateController.getTSignURL";
import { subscribe, createMessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import deleteOfferTemplate from "@salesforce/apex/TemplateController.deleteOfferTemplate";
import getTemplates from "@salesforce/apex/tSignDocsController.getTemplates";

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

export default class TemplateCreator extends LightningElement {
  @track fileName = "";
  @track url;
  @track selectedFile = null;
  @track isLoading = false;
  @track recordId = "";
  @track awsUrl = "";
  @track isFileAttached = false;
  @track selectedFilesToUpload = [];
  @track showSpinner = false;
  @track fileName;
  @track doc;
  @track fileSize;
  @track isattachError = false;
  @track recipientEmails = [
    {
      key: 0,
      label: "New Joinee Email (Required)",
      email: "",
      canRemove: false
    }
  ];
  @track currentRecipient = "";
  @track key;
  @track currentRecipientStatus = "";
  @track showRecipientModal = false;
  @track selectedRecipient = null;
  @track newPlaceholder = null;
  d;
  @track isLoadingCircle = false;
  @track showSuccessScreen = false;
  @track isConfirmationPopupVisible = false;
  @api orgid;
  context = createMessageContext(); // Create LMS context
  @track tsignreUrl = "";
  file; //holding file instance
  myFile;
  fileType; //holding file type
  fileReaderObj;
  base64FileData;
  pdfDoc = null; // PDF document reference
  pdfLoaded = false; // Prevents reloading PDFs
  @api imageSrc = ""; // Base64 image source
  @track imageSrcs = []; // Stores Base64 images for multi-page display
  @api currentPage = 1; // Current page for pagination
  @api totalPages = 0; // Total number of pages in the PDF
  @track placeholders = []; // List of placeholders
  @track draggedType = null; // Type of placeholder being dragged
  @track currentDraggedPlaceholder = null; // Placeholder currently being dragged
  @track isFileExpand = false;
  @track recipientEmails = [
    {
      key: 0,
      label: "New Joinee Email*",
      email: "",
      canRemove: false // New joinee email cannot be removed
    }
  ];
  @track key;
  nextRecipientKey = 1;
  logo = TeSignLogo;

  getPlaceholderStyle(placeholder) {
    // Ensure values are numbers and return valid CSS
    return `top: ${placeholder.y || 0}px; left: ${placeholder.x || 0}px; position: absolute;`;
  }

  get placeholdersForCurrentPage() {
    return this.placeholders.filter(
      (placeholder) => placeholder.page === this.currentPage
    );
  }

  getRowKey(index) {
    return `row-${index}`;
  }

  getRecipientLabel(index) {
    return `Recipient ${index + 1}`;
  }

  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }

  @api tsignReurl = "";
  @api serviceId = "";
  @api quoteId;
  @api source;

  get flowType() {
  return this.quoteId ? "Quote" : "Service";
}


  async connectedCallback() {
    console.log("TeSignLogo URL:", this.logo);
    console.log(
      "📌 AWS URL received in Tsign via Parent Component:",
      this.tsignReurl
    );
    console.log("📌 Received Org ID:", this.orgid);
    console.log("📌 Received Service Agreement ID:", this.serviceId);
    console.log("📌 Source received in Tsign via Parent Component:", this.source);
    console.log("📌 Quote ID received in Tsign via Parent Component:", this.quoteId);


    this.subscribeToMessageChannel();

    try {
      await this.loadPdfLibraries();
      console.log("✅ PDF.js and worker script loaded successfully");

      // ✅ Add a small delay to ensure libraries are fully loaded into window
      await this.sleep(300); // Wait for 300 milliseconds

      getTSignURL()
        .then((data) => {
          this.tsignUrl = data; // Store the URL from custom metadata
        })
        .catch((error) => {
          console.error("Error fetching TSign URL from metadata:", error);
        });

      if (this.tsignReurl) {
        console.log("📌 Detected AWS URL in Tsign:", this.tsignReurl);
        this.redirectservice(this.tsignReurl);
      }
    } catch (error) {
      console.error("Error loading PDF libraries:", error);
      this.handleError("Failed to load PDF libraries.", error);
    }
  }

  // 💤 Helper function to create a delay
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // redirectservice() {

  //     console.log('📌 Redirecting with TSign URL:', this.tsignReurl);

  //     if (this.tsignReurl) {

  //         // Extract filename from the URL

  //         const urlParts = this.tsignReurl.split('/');

  //         this.fileName = urlParts[urlParts.length - 1]; // Get last part of URL

  //         console.log('📌 Extracted Filename:', this.fileName);

  //         this.isFileUploaded = true; // Ensure the template section loads

  //         this.handleSaveAndUpload(); // Invoke file processing

  //     }

  // }

  redirectservice() {
    console.log("📌 Redirecting with TSign URL:", this.tsignReurl);

    if (this.tsignReurl) {
      const urlParts = this.tsignReurl.split("/");
      this.fileName = urlParts[urlParts.length - 1]; // Extract filename
      console.log("📌 Extracted Filename:", this.fileName);

      const fileExtension = this.fileName.split(".").pop().toLowerCase();

      if (fileExtension === "docx") {
        console.log("📌 Detected DOCX file. Converting to PDF...");
        this.fileType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        this.fetchDocxAndConvert(this.tsignReurl); // Fetch + Convert to PDF
      } else if (fileExtension === "pdf") {
        console.log("📌 Detected PDF file. Saving directly...");
        this.fileType = "application/pdf";
        this.awsUrl = this.tsignReurl;
        this.isFileUploaded = true;
        this.handleSaveAndUpload(); // ✅ Directly save
      } else {
        this.showToast("Error", "Unsupported file format received.", "error");
      }
    }
  }

  fetchDocxAndConvert(url) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        this.file = new File([blob], this.fileName, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
        this.convertWordToPdf(); // ✅ Send for conversion
      })
      .catch((error) => {
        console.error("❌ Failed to fetch DOCX file:", error);
        this.showToast(
          "Error",
          "Unable to fetch and convert Word file.",
          "error"
        );
      });
  }

  subscribeToMessageChannel() {
    console.log("✅ Subscribing to LMS in Tsign LWC...");

    subscribe(this.context, TSIGN_MESSAGE_CHANNEL, (message) => {
      if (message.tsignreUrl && message.recordId) {
        console.log("📌 AWS URL received in Tsign:", message.tsignreUrl);
        console.log(
          "📌 Service Agreement ID received in Tsign:",
          message.recordId
        );

        // ✅ Update values ONLY IF LMS sends data
        this.tsignReurl = message.tsignreUrl || this.tsignReurl;
        this.url=this.tsignReurl;
        this.serviceId = message.recordId || this.serviceId;

        console.log(
          "✅ Updated Service Agreement ID in Tsign:",
          this.serviceId
        );
      } else {
        console.warn("⚠️ Missing data in LMS message:", message);
      }
    });
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


  handleFileUploadSuccess() {
    this.isFileAttached = true;
    // other logic to handle successful file upload
  }

  handleFileNameChange(event) {
    this.fileName = event.target.value;
  }

    handlefilecancel(event){
    console.log('child called');
     console.log('Cancel event received:', event.detail.message);
    this.fileuploaded=false;
   }



  //ACCEPTS PDF AND WORD
  @track fileuploaded=false;
  @track isFileExpand1=false;
 async  onFileUpload(event) {
    this.isattachError = false;
    this.tsignReurl='';
    this.serviceId='';
    this.quoteId = null;
this.source = null;
    if (this.fileuploaded) {
        this.showToast("Error", "Only one file can be uploaded at a time.", "error");
        event.target.value = null;
        return;
    }

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

   @track uploadedFiles = [];
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

handleAwsUploadComplete(evt) {
  try {
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

    this.handleSaveAndUpload();
    this.isFileAttached = true;

    console.log(' Files in last  : ', files);
    console.log(' this.uploadedFiles  : ', JSON.stringify(this.uploadedFiles));
    console.groupEnd();
  } catch (e) {
    console.error('[AWS Upload Complete] handler error:', e);
  }
}

async convertWordToPdf() {
  try {
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
        this.handleSaveAndUpload();
        this.showToast("Success", "Document Uploaded Successfully!", "success");
      } else {
        this.showToast("Error", "Converted PDF URL not found.", "error");
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
  }
}

  handleSaveAndUploadForConvertedWord(pdfUrl, pdfFilename) {
    if (!pdfFilename || !pdfUrl) {
      this.showToast("Error", "PDF filename or URL is missing.", "error");
      console.error("❌ Missing Data:", {
        pdfFilename: pdfFilename,
        pdfUrl: pdfUrl
      });
      return;
    }

    this.isLoading = true;
    // const picklistValue = "Default"; // Differentiate Word-to-PDF conversions
    const picklistValue = this.tsignReurl ? "Service" : "Default";

    console.log(
      "📌 Creating Offer_Template__c with PDF Filename:",
      pdfFilename
    );

    // ✅ Create Offer_Template__c record with extracted PDF filename
    createOfferTemplate({
      fileName: pdfFilename, // Use extracted filename
      picklistValue: picklistValue,
      orgId: this.orgid,
      serviceId: "" // No service ID required for this case
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log("📌 Record created for converted Word file. ID:", recordId);

        // ✅ Update the record with the PDF URL (awsUrl)
        updateRecordWithAWSUrl({
          recordId: this.recordId,
          awsUrl: pdfUrl,
          serviceId: ""
        })
          .then(() => {
            console.log("✅ Record updated with converted PDF URL:", pdfUrl);
            this.isFileUploaded = true;
            this.retrieveFileUrl();
            this.isLoading = false;
          })
          .catch((error) => {
            console.error(
              "❌ Error updating record with converted PDF URL:",
              error
            );
            this.showToast(
              "Error",
              "Failed to update record with PDF URL.",
              "error"
            );
            this.isLoading = false;
          });
      })
      .catch((error) => {
        console.error("❌ Error creating Offer_Template__c record:", error);
        this.showToast("Error", "Failed to create record.", "error");
        this.isLoading = false;
      });
  }

handleSaveAndUpload() {
  if (!this.fileName) {
    this.showToast("Error", "Please provide a file name and select a file.", "error");
    return;
  }

  // ✅ Use URL from LMS OR manual upload
  const finalUrl = this.tsignReurl || this.url || "";

  this.isLoading = true;

  // ✅ Picklist: Quote/Service only when coming from LMS (source set)
  const picklistValue = finalUrl
    ? (this.source === "QUOTE" ? "Quote" : this.source === "SERVICE" ? "Service" : "Default")
    : "Default";

  console.log("Filename,picklistvalue,orgid,", { finalUrl, picklistValue, source: this.source });

  createOfferTemplate({
    fileName: this.fileName,
    picklistValue,
    orgId: this.orgid,
    serviceId: this.source === "SERVICE" ? (this.serviceId || "") : "",
    quoteId: this.source === "QUOTE" ? (this.quoteId || null) : null,
    url: finalUrl // ✅ always store the URL if we have it
  })
    .then((recordId) => {
      this.recordId = recordId;

      console.log(
        "📌 Record created with ID(handleSaveAndUpload):",
        recordId,
        " | Picklist Value:",
        picklistValue,
        " | Org ID:",
        this.orgid,
        " | Source:",
        this.source,
        " | Service ID:",
        this.serviceId,
        " | Quote ID:",
        this.quoteId,
        " | finalUrl:",
        finalUrl
      );

      // ✅ If we already have a URL (LMS or manual upload), update record + render PDF directly
      if (finalUrl) {
        console.log("📌 URL exists, updating record with AWS URL + IDs.");

        return updateRecordWithAWSUrl({
          recordId: this.recordId,
          awsUrl: finalUrl,
          serviceId: this.source === "SERVICE" ? (this.serviceId || "") : "",
          quoteId: this.source === "QUOTE" ? (this.quoteId || null) : null
        }).then(() => finalUrl);
      }

      // ✅ Only if URL truly doesn't exist, try to fetch it from Apex
      return this.retrieveFileUrl(); // (we will modify it to return the url)
    })
    .then((urlToRender) => {
      // urlToRender comes either from finalUrl or retrieveFileUrl()
      if (urlToRender) {
        this.awsUrl = urlToRender;
        return this.loadPdf(urlToRender);
      }
      return null;
    })
    .then(() => {
      this.isFileUploaded = true;
      this.showToast("Success", "Document Uploaded successfully.", "success");
    })
    .catch((error) => {
      console.error("❌ Error in handleSaveAndUpload:", error);
      this.showToast("Error", "Failed to upload/update record.", "error");
    })
    .finally(() => {
      this.isLoading = false;
      this.showSpinner = false;
    });
}


retrieveFileUrl() {
  this.showSpinner = true;
  this.isLoading = true;

  return getUploadedFileUrl({ recordId: this.recordId })
    .then((url) => {
      if (url) {
        console.log("File URL retrieved:", url);
        this.awsUrl = url;
        return url; // ✅ return url to caller
      }

      console.error("No URL found for the uploaded file.");
      this.showToast("Warning", "File uploaded but URL could not be retrieved.", "warning");
      return null;
    })
    .catch((error) => {
      console.error("Error retrieving file URL:", error);
      this.showToast("Error", "Error retrieving file URL.", "error");
      return null;
    })
    .finally(() => {
      this.showSpinner = false;
      this.isLoading = false;
    });
}

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }

  async loadPdf(url) {
    try {
      const loadingTask = window.pdfjsLib.getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      await this.renderPageAsImage(this.currentPage);
    } catch (error) {
      this.handleError("Failed to load PDF.", error);
    }
  }

  async renderPageAsImage(pageNumber) {
  try {
    const page = await this.pdfDoc.getPage(pageNumber);

    const vp1 = page.getViewport({ scale: 1 });
    this._pagePt = { w: vp1.width, h: vp1.height };

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const viewport = page.getViewport({ scale: 3.0 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render page to canvas
    await page.render({ canvasContext: context, viewport }).promise;

    // Convert to image data
    const dataUrl = canvas.toDataURL("image/png");

    // Optional: pre-load the image to be extra safe
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    // Now bind to template
    this.imageSrc = dataUrl;
  } catch (error) {
    this.handleError(`Failed to render page ${pageNumber}.`, error);
    throw error; // propagate error
  }
  // ❌ no isLoading here anymore
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

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }

 handleDragStart(event) {
  const id = event.target.dataset.id;

  // Validate all recipient emails before dragging
  if (!this.areRecipientEmailsValid()) {
    event.preventDefault(); // Prevent the drag action
    this.showToast(
      "Error",
      "Please enter a valid email for all recipients before dragging placeholders.",
      "error"
    );
    return;
  }

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


  areRecipientEmailsValid() {
  // No recipients → invalid
  if (!this.recipientEmails || this.recipientEmails.length === 0) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Every recipient must have a non-empty, valid email
  return this.recipientEmails.every((recipient) => {
    const email = (recipient.email || "").trim();
    return email && emailRegex.test(email);
  });
}


  allowDrop(event) {
    event.preventDefault();
  }


handleDrop(event) {
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

_getCanvasRect() {
  const img = this.template.querySelector('.image-container img');
  return img ? img.getBoundingClientRect() : null;
}

_getPlaceholderSizeByType(type) {
  // if you have different sizes per type, branch here.
  return { w: PLACEHOLDER_W_DEFAULT, h: PLACEHOLDER_H_DEFAULT };
}

_bboxOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(
    ax + aw <= bx ||
    bx + bw <= ax ||
    ay + ah <= by ||
    by + bh <= ay
  );
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

// Measure a rendered placeholder and cache size on it
_measureAndCache(ph) {
  if (!ph?.id) return;
  const el = this.template.querySelector(`[data-id="${ph.id}"]`);
  if (!el) return;
  const r = el.getBoundingClientRect();
  // cache raw visual size (no gutter here)
  ph.w = Math.round(r.width);
  ph.h = Math.round(r.height);
}


  handleInitialsSelection(event) {
    const id = parseInt(event.target.dataset.id, 10);
    const placeholder = this.placeholders.find((item) => item.id === id);
    if (placeholder) {
      placeholder.value = event.target.value;
      console.log(`Initials selected: ${placeholder.value}`);
    }
  }

confirmRecipientSelection() {
  if (!this.newPlaceholder || !this.selectedRecipient) {
    this.showToast("Error", "Please select a recipient.", "error");
    return;
  }

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


  cancelRecipientSelection() {
    this.newPlaceholder = null;
    this.selectedRecipient = null;
    this.showRecipientModal = false;
    this.editingPlaceholderId = null;
  }

  get recipientRadioOptions() {
    return this.recipientEmails.map((recipient) => ({
      label: recipient.email,
      value: recipient.email
    }));
  }

  getFormattedEmail(email) {
    return email ? email.split("@")[0] : "No Recipient";
  }

  get placeholdersForCurrentPage() {
    return this.placeholders
      .map((placeholder) => ({
        ...placeholder,
        formattedRecipient: this.getFormattedEmail(placeholder.recipient) // Ensure recipient is passed
      }))
      .filter((placeholder) => placeholder.page === this.currentPage); // Filter by current page
  }

  handleRecipientSelection(event) {
    this.selectedRecipient = event.detail.value; // Capture the selected recipient email
    console.log("Selected recipient:", this.selectedRecipient);
  }

  handleMouseDown(event) {
    // Enable dragging only when Shift key is held
    if (event.shiftKey) {
      const id = event.target.dataset.id;
      if (id) {
        this.currentDraggedPlaceholder = this.placeholders.find(
          (placeholder) => placeholder.id === parseInt(id, 10)
        );
      }
    }
  }

  handleMouseUp(event) {
    // Reset dragging state
    this.currentDraggedPlaceholder = null;
  }

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

  event.target.setPointerCapture?.(event.pointerId);
}


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



  deletePlaceholder(event) {
    const id = parseInt(event.target.dataset.id, 10);
    this.placeholders = this.placeholders.filter((item) => item.id !== id);
  }

  handlePlaceholderInputChange(event) {
    const id = parseInt(event.target.dataset.id, 10);
    const placeholder = this.placeholders.find((item) => item.id === id);
    if (placeholder) {
      placeholder.value = event.target.value;
    }
  }

  handleUploadSignature(event) {
    const id = parseInt(event.target.dataset.id, 10);
    const placeholder = this.placeholders.find((item) => item.id === id);
    if (placeholder) {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/png, image/jpeg";
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        placeholder.value = file.name;
        alert("Signature uploaded: " + file.name);
      });
      fileInput.click();
    }
  }

  renderPlaceholder(placeholder) {
    const container = document.createElement("div");
    container.classList.add("placeholder-container");
    container.style.position = "absolute";
    container.style.left = `${placeholder.x}px`;
    container.style.top = `${placeholder.y}px`;

    if (placeholder.type === "Name") {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Enter Name";
      container.appendChild(input);
    } else if (placeholder.type === "Signature") {
      const uploadButton = document.createElement("button");
      uploadButton.textContent = "Upload Signature";
      container.appendChild(uploadButton);
    }

    this.template.querySelector(".pdf-viewer-container").appendChild(container);
  }

  showConfirmationPopup() {
    // Check if at least one valid email is entered
    const hasEmail = this.recipientEmails.some(
      (recipient) => recipient.email && recipient.email.trim() !== ""
    );

    if (!hasEmail) {
      // If no email is entered, show a toast or an alert
      this.showToast(
        "Error",
        "Please add at least one recipient email before sending the document.",
        "error"
      );
      return;
    }

    // Proceed to show the confirmation popup
    this.isConfirmationPopupVisible = true;
  }

  // Close the confirmation popup
  closeConfirmationPopup() {
    this.isConfirmationPopupVisible = false;
  }

  // Handle the "Send" button in the confirmation popup
  handleSendConfirmation() {
    console.log("Document sent for signature.");

    // Proceed with sending the document
    this.handleSavePlaceholders();

    // Close the confirmation popup
    this.isConfirmationPopupVisible = false;
    this.isLoadingCircle = true;
  }

  handleSavePlaceholders() {
    const adjustedPlaceholders = this.placeholders.map((placeholder) => ({
      ...placeholder,
      x: placeholder.x + 130, // Subtract 50px
      y: placeholder.y + 180, // Subtract 50px
      style: `top: ${parseFloat(placeholder.style.split(";")[0].split(":")[1]) - 50}px;
                    left: ${parseFloat(placeholder.style.split(";")[1].split(":")[1]) - 50}px;
                    position: absolute;`
    }));
    const placeholderData = JSON.stringify(this.placeholders);
    const emails = this.recipientEmails
      .map((recipient) => recipient.email)
      .join("\n");

    savePlaceholders({
      recordId: this.recordId,
      placeholderJSON: placeholderData
    })
      .then(() => {
        // Once placeholders are saved, save emails
        saveEmailsToBackend({
          recordId: this.recordId,
          emails: emails,
          newJoineeEmail: this.recipientEmails[0].email
        })
          .then(() => {
            console.log("Placeholders and emails saved successfully!");
            setTimeout(() => {
              this.handleFinish();
            }, 1000);
          })

          .catch((error) => {
            console.error("Error saving emails:", error);
            this.showToast("Error", "Failed to save emails.", "error");
          });
      })
      .catch((error) => {
        console.error("Error saving placeholders:", error);
        this.showToast("Error", "Failed to save placeholders.", "error");
      });
  }



  retrievePlaceholders() {
    getPlaceholders({ recordId: this.recordId })
      .then((data) => {
        if (data) {
          this.placeholders = JSON.parse(data).map((placeholder) => {
            return {
              ...placeholder,
              style: `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;`
            };
          });
        }
      })
      .catch((error) => {
        console.error("Error retrieving placeholders:", error);
        this.showToast("Error", "Failed to retrieve placeholders.", "error");
      });
  }

  addRecipient() {
    console.log("Add Recipient button clicked.");
    this.recipientEmails = [
      ...this.recipientEmails,
      {
        key: this.nextRecipientKey,
        label: `Recipient ${this.recipientEmails.length + 1} Email`, // Dynamically set the label
        email: "",
        canRemove: true // Allow this recipient to be removed
      }
    ];
    this.nextRecipientKey += 1; // Increment the key for the next recipient
    console.log(
      "Updated recipientEmails:",
      JSON.stringify(this.recipientEmails)
    );
  }

  removeRecipient(event) {
    const index = parseInt(event.target.dataset.index, 10);
    console.log(`Remove Recipient button clicked for index: ${index}`);

    const removedRecipient = this.recipientEmails.find((r) => r.key === index);
    if (removedRecipient) {
      console.log("Removing recipient:", JSON.stringify(removedRecipient));
    } else {
      console.error("Recipient not found for removal.");
    }

    // Remove the recipient
    this.recipientEmails = this.recipientEmails.filter((r) => r.key !== index);

    // Reassign labels and keys to ensure consistent numbering
    this.recipientEmails = this.recipientEmails.map((recipient, i) => ({
      ...recipient,
      label: i === 0 ? "New Joinee Email*" : `Recipient ${i + 1} Email`, // Special label for the first recipient
      key: i, // Update the key to match the new sequence
      canRemove: i !== 0 // Only allow removal for recipients other than the first
    }));

    console.log(
      "Updated recipientEmails after removal:",
      JSON.stringify(this.recipientEmails)
    );
  }

  handleEmailChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const newEmail = event.target.value;
    console.log(
      `Email input changed for index: ${index}, new email: ${newEmail}`
    );
    const isDuplicate = this.recipientEmails.some(
      (recipient, i) => recipient.email === newEmail && i !== index
    );
    if (isDuplicate) {
      this.showToast("Error", "Duplicate email is not allowed.", "error");
      return;
    }
    let updated = false;
    this.recipientEmails = this.recipientEmails.map((recipient) => {
      if (recipient.key === index) {
        recipient.email = newEmail;
        updated = true;
      }
      return recipient;
    });

    if (updated) {
      console.log(
        "Updated recipientEmails:",
        JSON.stringify(this.recipientEmails)
      );
      // Set currentRecipient to the first email as default or upon specific conditions
      this.currentRecipient = this.recipientEmails[0].email;
      console.log("Current Email set to:", this.currentRecipient);
    }
  }

  handleFinish() {
    console.log("Record ID:", this.recordId);
    console.log("Current Email:", this.currentRecipient);

    if (this.recordId && this.currentRecipient) {
      startEmailSequence({ recordId: this.recordId })
        .then((result) => {
          console.log("Email Sequence Started:", result);
          this.updateCurrentRecipient(this.currentRecipient);
        })
        .catch((error) => {
          console.error(
            "Failed to initiate email sequence:",
            error.body?.message || error.message
          );
        });
    } else {
      console.error("Record ID and Current Email are required.");
    }
    this.isLoadingCircle = false;

    this.showSuccessScreen = true; // Show the success screen
  }

  handleCloseScreen() {
    this.showSuccessScreen = false;
    this.fileName = "";
    this.selectedFile = null;
    this.isFileAttached = false;
    this.isFileUploaded = false;
    this.awsUrl = ""; 
    this.base64FileData = ""; 
    this.pdfDoc = null;
    this.pdfLoaded = false; 
    this.placeholders = []; 
    this.imageSrcs = []; 
    this.imageSrc = ""; 
    this.selectedTemplateId='';
    this.selectedTemplateUrl='';
    this.recipientEmails = [
      {
        key: 0,
        label: "New Joinee Email*",
        email: "",
        canRemove: false
      }
    ]; // Reset recipients
    this.nextRecipientKey = 1; 
    this.showSpinner = false; 
    this.currentPage = 1;
    this.totalPages = 0; 

    // Log reset action for debugging
    console.log("Component has been reset to its initial state.");
  }

  handleReset() {
    if (this.recordId) {
      deleteOfferTemplate({ recordId: this.recordId })
        .then(() => {
          console.log("✅ Reset successfully.");
          this.resetComponentState();
        })
        .catch((error) => {
          console.error("❌ Failed to delete record:", error);
          this.showToast("Error", "Failed to delete record.", "error");
          this.resetComponentState(); // Even on error, reset the UI
        });
        if(this.key){
         this.deleteFile(this.key);
        }
        this.fileName = "";
        this.url = "";
        this.tsignReurl = "";
        this.key='';

        this.serviceId = null;
        this.quoteId = null;
        this.source = null;
    } else {
      this.resetComponentState();
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
  resetComponentState() {
    this.showSuccessScreen = false;
    this.fileName = "";
    this.selectedFile = null;
    this.isFileAttached = false;
    this.isFileUploaded = false;
    this.awsUrl = "";
    this.base64FileData = "";
    this.pdfDoc = null;
    this.pdfLoaded = false;
    this.placeholders = [];
    this.imageSrcs = [];
    this.imageSrc = "";
    this.recipientEmails = [
      {
        key: 0,
        label: "New Joinee Email*",
        email: "",
        canRemove: false
      }
    ];
    this.nextRecipientKey = 1;
    this.showSpinner = false;
    this.currentPage = 1;
    this.totalPages = 0;
    this.recordId = ""; 
    this.serviceId = null;
    this.quoteId = null;
    this.source = null;
    console.log("Component has been reset to its initial state.");
  }

  updateCurrentRecipient(currentEmail) {
    if (this.recordId && currentEmail) {
      updateCurrentRecipient({
        recordId: this.recordId,
        currentRecipientEmail: currentEmail
      })
        .then(() => {
          console.log("Current recipient updated successfully.");
        })
        .catch((error) => {
          console.error("Error updating current recipient:", error);
          this.showToast(
            "Error",
            `Failed to update current recipient: ${error.body?.message || error.message}`,
            "error"
          );
        });
    } else {
      this.showToast(
        "Error",
        "Record ID and Current Email are required for updating.",
        "error"
      );
    }
  }

  advanceSequence() {
    advanceEmailSequence({ recordId: this.recordId })
      .then(() => {
        this.showToast("Success", "Advanced to the next recipient.", "success");
        this.updateCurrentRecipient();
      })
      .catch((error) => {
        this.showToast(
          "Error",
          `Failed to advance email sequence: ${error.body.message}`,
          "error"
        );
      });
  }

  validateEmails() {
    if (
      this.recipientEmails.length === 0 ||
      this.recipientEmails.includes("")
    ) {
      this.showToast(
        "Error",
        "Please fill in all email fields before finishing.",
        "error"
      );
      return false;
    }
    return true;
  }

  showToast(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(evt);
  }

  updateCurrentRecipient(currentEmail, status) {
    updateCurrentRecipient({
      recordId: this.recordId,
      currentRecipientEmail: currentEmail,
      status: status
    })
      .then(() => {
        console.log("Current recipient updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating current recipient:", error);
        this.showToast(
          "Error",
          `Failed to update current recipient: ${error.body?.message || error.message}`,
          "error"
        );
      });
  }

  notifyFirstRecipient() {
    const firstRecipient = this.recipientEmails[0];
    const url = `${this.tsignUrl}/s/?recordId=${this.recordId}`;

    sendRecordEmail({
      recordId: this.recordId,
      email: firstRecipient.email,
      url
    })
      .then(() => {
        this.showToast(
          "Success",
          `Email sent successfully to ${firstRecipient.email}. Waiting for completion.`,
          "success"
        );
        // Mark the first recipient as processed
        this.updateCurrentRecipient(firstRecipient.email, "Pending");
      })
      .catch((error) => {
        console.error("Error sending email to the first recipient:", error);
        this.showToast(
          "Error",
          `Failed to send email: ${error.body?.message || error.message}`,
          "error"
        );
      });
  }

  updateCurrentRecipient(currentEmail) {
    updateCurrentRecipient({
      recordId: this.recordId,
      currentRecipientEmail: currentEmail
    })
      .then(() => {
        console.log("Current recipient updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating current recipient:", error);
        this.showToast(
          "Error",
          `Failed to update current recipient: ${error.body?.message || error.message}`,
          "error"
        );
      });
  }

  saveEmailsToBackend(emails) {
    return saveEmailsToBackend({ recordId: this.recordId, emails });
  }

  handleRecipientFinish() {
    const nextRecipientIndex =
      this.recipientEmails.findIndex(
        (email) => email === this.currentRecipient
      ) + 1;

    if (nextRecipientIndex < this.recipientEmails.length) {
      const nextRecipient = this.recipientEmails[nextRecipientIndex];
      const url = `${this.tsignUrl}/s/?recordId=${this.recordId}`;

      sendRecordEmail({
        recordId: this.recordId,
        email: nextRecipient.email,
        url
      })
        .then(() => {
          this.showToast(
            "Success",
            `Email sent to ${nextRecipient.email}!`,
            "success"
          );
          updateCurrentRecipient({
            recordId: this.recordId,
            currentRecipient: nextRecipient.email
          });
        })
        .catch((error) => {
          console.error("Error sending email:", error);
          this.showToast("Error", "Failed to send email.", "error");
        });
    } else {
      // If all recipients have completed, notify everyone
      notifyAllRecipients({ recordId: this.recordId });
    }
  }

  @track isTemplateUploadChoiceModal = false;
  @track showExistingTemplatesTable = false;
  @track filteredCreatedTemplates = [];
  @track selectedTemplateId = null;
  @track selectedTemplateUrl = null;

  closeTemplateUploadChoiceModal() {
    this.isTemplateUploadChoiceModal = false;
  }

  // Flag to avoid showing modal when triggered programmatically
  skipUploadOptionModal = false;

  handleUploadOption(event) {
    if (this.skipUploadOptionModal) {
      console.log("⚠️ Skipping modal (programmatic click)");
      this.skipUploadOptionModal = false; // reset for next time
      return;
    }

    event.preventDefault(); // ✅ Block native picker on first click
    this.isTemplateUploadChoiceModal = true;
  }

  triggerNativeFileUpload() {
    console.log("📂 Upload New selected");

    this.isTemplateUploadChoiceModal = false;
    this.skipUploadOptionModal = true;

    setTimeout(() => {
      const input = this.template.querySelector(".visually-hidden");
      if (input) {
        console.log("✅ File input found by class. Triggering click.");
        input.click();
      } else {
        console.warn("⚠️ File input still not found.");
      }
    }, 0);
  }

  handleUseExistingTemplate() {
    console.log("📥 User selected 'Use Existing Template' option");

    this.isTemplateUploadChoiceModal = false;
    this.showExistingTemplatesTable = true;

    getTemplates({ orgId: this.orgid })
      .then((result) => {
        console.log("✅ Templates fetched from Apex:", result);

        this.filteredCreatedTemplates = result.filter(
          (t) => t.Document_Type__c === "Created Template"
        );

        console.log(
          "✅ Filtered 'Created Template' entries:",
          this.filteredCreatedTemplates
        );

        this.cretTemplateTotalRecords = this.filteredCreatedTemplates.length;
        this.cretPageNumber = 1;
        this.cretTotalPages = Math.ceil(
          this.cretTemplateTotalRecords / this.cretPageSize
        );

        this.updateCretPaginatedList();

        if (this.filteredCreatedTemplates.length === 0) {
          console.warn("⚠️ No 'Created Template' entries found.");
        }
      })
      .catch((error) => {
        console.error("❌ Failed to fetch templates:", error);
        this.showToast("Error", "Could not fetch templates.", "error");
      });
  }

  get cretPaginatedListWithChecked() {
    return this.cretPaginatedList.map((template) => ({
      ...template,
      isChecked: template.Id === this.selectedTemplateId
    }));
  }

  handleTemplateRadioChange(event) {
    this.selectedTemplateId = event.currentTarget.dataset.id;
    this.selectedTemplateUrl = event.currentTarget.dataset.url;

    console.log(
      "🔘 Template selected:",
      this.selectedTemplateId,
      this.selectedTemplateUrl
    );
  }
  handleContinueWithSelectedTemplate() {
    if (!this.selectedTemplateId || !this.selectedTemplateUrl) {
      this.showToast(
        "Error",
        "Please select a template before continuing.",
        "error"
      );
      return;
    }

    console.log("✅ Proceeding with template ID:", this.selectedTemplateId);
    this.showExistingTemplatesTable = false;
    this.tsignReurl = this.selectedTemplateUrl;
    this.redirecttemplate(); // your existing method
  }

  redirecttemplate() {
    console.log("📌 Redirecting with TSign URL:", this.tsignReurl);

    if (this.tsignReurl) {
      const urlParts = this.tsignReurl.split("/");
      this.fileName = urlParts[urlParts.length - 1]; // Extract filename
      console.log("📌 Extracted Filename:", this.fileName);

      const fileExtension = this.fileName.split(".").pop().toLowerCase();

      if (fileExtension === "docx") {
        console.log("📌 Detected DOCX file. Converting to PDF...");
        this.fileType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        this.fetchDocxAndConvert(this.tsignReurl); // Fetch + Convert to PDF
      } else if (fileExtension === "pdf") {
        console.log("📌 Detected PDF file. Saving directly...");
        this.fileType = "application/pdf";
        this.awsUrl = this.tsignReurl;
        this.isFileUploaded = true;
        this.handleSaveAndUploadTemplate(); // ✅ Directly save
      } else {
        this.showToast("Error", "Unsupported file format received.", "error");
      }
    }
  }

  handleSaveAndUploadTemplate() {
    if (!this.fileName) {
      this.showToast(
        "Error",
        "Please provide a file name and select a file.",
        "error"
      );
      return;
    }

    this.isLoading = true;
    const picklistValue = this.tsignReurl
  ? (this.source === "QUOTE" ? "Quote" : "Service")
  : "Default";


    // ✅ Step 1: Create Offer_Template__c record with orgId and optional ServiceId
    createOfferTemplate({
        fileName: this.fileName,
        picklistValue: picklistValue,
        orgId: this.orgid,
        serviceId: this.source === "SERVICE" ? (this.serviceId || "") : "",
        quoteId: this.source === "QUOTE" ? (this.quoteId || null) : null,
        url: this.tsignReurl || ""   
      })

      .then((recordId) => {
        this.recordId = recordId;
        console.log(
          "📌 Record created with ID(handleSaveAndUploadTemplate):",
          recordId,
          " | Picklist Value:",
          picklistValue,
          " | Org ID:",
          this.orgid,
          " | Source:",
          this.source,
          " | Service ID:",
          this.serviceId,
          " | Quote ID:",
          this.quoteId
        );


        // ✅ Step 2: If AWS URL exists, update the record with the URL and Service ID
        if (this.tsignReurl) {
          console.log(
            "📌 AWS URL already exists, updating record with AWS URL & Service ID."
          );

          updateRecordWithAWSUrl({
              recordId: this.recordId,
              awsUrl: this.tsignReurl,
              serviceId: this.source === "SERVICE" ? (this.serviceId || "") : "",
              quoteId: this.source === "QUOTE" ? (this.quoteId || null) : null
            })

            .then(() => {
              console.log(
                "✅ Record updated with AWS URL & Service ID:",
                this.tsignReurl,
                this.serviceId
              );
              console.log(
                "✅ Record updated with AWS URL:(handleSaveAndUploadTemplate)",
                this.tsignReurl,
                " | Source:",
                this.source,
                " | Service ID:",
                this.serviceId,
                " | Quote ID:",
                this.quoteId
              );

              this.showToast(
                "Success",
                "Document Uploaded successfully.",
                "success"
              );
              this.retrieveFileUrl();
              this.isLoading = false;
            })
            .catch((error) => {
              console.error(
                "❌ Error updating record with AWS URL & Service ID:",
                error
              );
              this.showToast("Error", "Failed to update record.", "error");
              this.isLoading = false;
            });
        } else {
          // 🛑 If no AWS URL, proceed with standard upload to AWS
          console.log("📌 No AWS URL found, proceeding with file upload.");

          uploadFileToAWS({
            base64: JSON.stringify(this.base64FileData),
            filename: this.fileName,
            recordId: this.recordId,
            obj: "offerLetter"
          })
            .then(() => {
              console.log("✅ File uploaded successfully to AWS.");
              setTimeout(() => {
                this.retrieveFileUrl();
              }, 3500); // Delay of 3.5 seconds
            })
            .catch((error) => {
              console.error("❌ Error uploading file to AWS:", error);
              this.showToast("Error", "File upload failed.", "error");
              this.isLoading = false;
            });
        }
      })
      .catch((error) => {
        console.error("❌ Error creating Offer_Template__c record:", error);
        this.showToast("Error", "Failed to create record.", "error");
        this.isLoading = false;
      });
  }

  handleSelectExistingTemplate(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) {
      this.showToast("Error", "Template URL missing.", "error");
      return;
    }

    this.showExistingTemplatesTable = false;
    this.tsignReurl = url;
    this.redirectservice(); // Load the template as if user uploaded it
  }

  closeExistingTemplatesTable() {
    this.showExistingTemplatesTable = false;
    this.selectedTemplateId = null;
    this.selectedTemplateUrl = null;
  }

  @track cretPageNumber = 1;
  @track cretPageSize = 5;
  @track cretTotalPages = 0;
  @track cretTemplateTotalRecords = 0;
  @track cretDisableFirst = true;
  @track cretDisableLast = false;
  @track cretPaginatedList = [];
  updateCretPaginatedList() {
    const startIdx = (this.cretPageNumber - 1) * this.cretPageSize;
    const endIdx = startIdx + this.cretPageSize;
    this.cretPaginatedList = this.filteredCreatedTemplates.slice(
      startIdx,
      endIdx
    );

    this.cretDisableFirst = this.cretPageNumber === 1;
    this.cretDisableLast = this.cretPageNumber === this.cretTotalPages;
  }

  handleCretFirst() {
    this.cretPageNumber = 1;
    this.updateCretPaginatedList();
  }

  handleCretPrevious() {
    if (this.cretPageNumber > 1) {
      this.cretPageNumber -= 1;
      this.updateCretPaginatedList();
    }
  }

  handleCretNext() {
    if (this.cretPageNumber < this.cretTotalPages) {
      this.cretPageNumber += 1;
      this.updateCretPaginatedList();
    }
  }

  handleCretLast() {
    this.cretPageNumber = this.cretTotalPages;
    this.updateCretPaginatedList();
  }


editingPlaceholderId = null;
@track useCustomInlineStyle = false;

  @track styleOptions = {
  fontFamily: 'Roboto, Arial, sans-serif',
  fontSize: '14',    // store as string for combobox; parse when needed
  bold: false,
  italic: false,
  underline: false,
  color: '#000000'
};

get fontFamilyOptions() {
  // keep it small; you can expand later
  return [
    { label: 'Roboto', value: 'Roboto, Arial, sans-serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
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

// tiny live preview computed CSS string
get stylePreviewCss() {
  const f = this.styleOptions;
  const fw = f.bold ? '700' : '400';
  const fs = f.italic ? 'italic' : 'normal';
  const td = f.underline ? 'underline' : 'none';
  return `font-family:${f.fontFamily}; font-size:${f.fontSize}px; font-weight:${fw}; font-style:${fs}; text-decoration:${td}; color:${f.color}; border:1px dashed #ddd; padding:.5rem; display:inline-block;`;
}

handleStyleOptionChange = (evt) => {
  const { name, type, checked, value } = evt.target;
  this.styleOptions = {
    ...this.styleOptions,
    [name]: (type === 'checkbox') ? !!checked : value
  };
};
get boldToggleClass() {
  return 'style-toggle-pill' + (this.styleOptions.bold ? ' active' : '');
}

get italicToggleClass() {
  return 'style-toggle-pill' + (this.styleOptions.italic ? ' active' : '');
}

get underlineToggleClass() {
  return 'style-toggle-pill' + (this.styleOptions.underline ? ' active' : '');
}

handleStyleToggleClick(event) {
  const name = event.currentTarget.dataset.styleName;
  if (!name) return;

  this.styleOptions = {
    ...this.styleOptions,
    [name]: !this.styleOptions[name]
  };
}

handleRecipientBadgeClick(event) {
  const idStr = event.currentTarget.dataset.id;
  const id = Number(idStr);
  if (!idStr || Number.isNaN(id)) {
    console.warn('handleRecipientBadgeClick: no valid id on badge');
    return;
  }

  const placeholder = this.placeholders.find(p => Number(p.id) === id);
  if (!placeholder) {
    console.warn('handleRecipientBadgeClick: placeholder not found for id', id);
    return;
  }

  // mark we are editing this placeholder
  this.editingPlaceholderId = id;

  // This is what the modal will work against
  this.newPlaceholder = { ...placeholder };

  // Prefill recipient
  this.selectedRecipient = placeholder.recipient || '';
   this.useCustomInlineStyle = !!placeholder.customInlineStyle;

  // Prefill style from saved textStyle, with defaults
  const ts = placeholder.textStyle || {};
  this.styleOptions = {
    fontFamily: ts.fontFamily || 'Roboto, Arial, sans-serif',
    fontSize: ts.fontSize || '14',
    bold: !!ts.bold,
    italic: !!ts.italic,
    underline: !!ts.underline,
    color: ts.color || '#000000'
  };

  // Open the modal
  this.showRecipientModal = true;
}

get showTextStylePanel() {
  // Only show for non-signature placeholders
  return this.newPlaceholder && !this.newPlaceholder.isSignature;
}
get disableStyleControls() {
  return !this.useCustomInlineStyle;
}
handleCustomInlineStyleToggle(event) {
  this.useCustomInlineStyle = event.target.checked;
}
get stylePanelGridClass() {
  // base class + optional disabled class
  return this.useCustomInlineStyle
    ? 'style-panel-grid'
    : 'style-panel-grid style-disabled';
}

}