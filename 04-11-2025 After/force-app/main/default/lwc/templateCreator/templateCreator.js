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

const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
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
  @track selectedFilesToUpload = []; //store selected files
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
  async connectedCallback() {
    console.log("TeSignLogo URL:", this.logo);
    console.log(
      "📌 AWS URL received in Tsign via Parent Component:",
      this.tsignReurl
    );
    console.log("📌 Received Org ID:", this.orgid);
    console.log("📌 Received Service Agreement ID:", this.serviceId);

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

  // renderedCallback() {
  //   if (this.awsUrl && !this.pdfLoaded) {
  //     this.loadPdf(this.awsUrl);
  //     this.pdfLoaded = true;
  //   }
  // }

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

  //ONLY PDF FILES

  // onFileUpload(event) {
  //     this.isattachError = false;
  //     const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  //     if (event.target.files.length > 0) {
  //         this.showSpinner = true;
  //         this.selectedFilesToUpload = event.target.files;
  //         this.file = this.selectedFilesToUpload[0];
  //         this.fileName = this.file.name.replace(/\s+/g, ""); // Remove spaces
  //         this.fileType = this.file.type;
  //         this.fileSize = this.file.size;

  //         // Allow only PDF files
  //         if (this.fileType !== 'application/pdf') {
  //             this.showToast('Error', 'Only PDF files are allowed.', 'error');
  //             this.showSpinner = false;
  //             this.isLoading = false;
  //             return;
  //         }

  //         // Check file size constraint (Max: 5MB)
  //         if (this.fileSize > MAX_FILE_SIZE) {
  //             this.showToast('Error', 'File size must be 5MB or smaller.', 'error');
  //             this.showSpinner = false;
  //             this.isLoading = false;
  //             return;
  //         }

  //         // Process the PDF file
  //         this.processPdfFile();
  //     }

  //     this.showSpinner = false;
  //     console.log('fileName>>', JSON.stringify(this.base64FileData));
  // }

  //ACCEPTS PDF AND WORD
  @track fileuploaded=false;
  @track isFileExpand1=false;
 async  onFileUpload(event) {
    this.isattachError = false;
    if (this.fileuploaded) {
        this.showToast("Error", "Only one file can be uploaded at a time.", "error");
        event.target.value = null;
        return;
    }

    if (event.target.files.length > 0) {
      this.showSpinner = true;
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.file.name.replace(/\s+/g, ""); // Remove spaces
      this.fileType = this.file.type;
      this.fileSize = this.file.size;

     let MAX_PDF_SIZE = 10 * 1024 * 1024; // 5MB for PDF
     let MAX_DOC_SIZE = 5 * 1024 * 1024; // 3MB for DOC/DOCX
     
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
      // ✅ Validate file size (less than 5MB)
    /*   if (this.fileSize > MAX_FILE_SIZE) {
        this.showToast("Error", "File size must be 3MB or smaller.", "error");
        this.showSpinner = false;
        this.isLoading = false;
        return;
      } */

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
        // this.isFileExpand = true;
        // if (!files.length) {
        //     this.isFileExpand = false; // Optional, if you want to collapse the panel
        //     return;
        // } else {
        //     this.isFileExpand = true;
        // }
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

            //const { recordId, files = [], ctx } = evt.detail || {};
            const { recordId, files = [] } = evt.detail || {};
            console.log('recordId:', recordId);
            console.log('files count:', files.length, 'files:', files);
            //console.log('ctx (cellId):', ctx);

            if (!files.length) {
                console.warn('No uploaded files in payload; aborting.');
                console.groupEnd();
                return;
            }

            // Build arrays from the full payload
            const urls       = files.map(f => f?.url).filter(Boolean);
            const names      = files.map(f => f?.originalName).filter(Boolean);
            const types      = files.map(f => f?.type).filter(Boolean);
            const s3Keys     = files.map(f => f?.key).filter(Boolean);
            const modulePath = files[0]?.modulePath ?? undefined;
            const sizes      = files.map(f => f?.size).filter(Boolean);
            const totalBytes  = files.map(f => f?.totalBytes).filter(Boolean);

            console.log('All URLs:', urls);
            console.log('All names:', names);
            console.log('All types:', types);
            console.log('All s3 keys:', s3Keys);
            console.log('All sizes:', sizes);

            // If your field.value must be a string, use:
            // const valueForField = urls.join(',');
            const valueForField = urls; // ✅ save all URLs as an array

            const metaPayload = {
                modulePath,
                recordId,
                uploadedAt: new Date().toISOString(),
                uploadedFiles: files,     // ✅ include ALL returned file objects
                rawEventDetail: evt.detail
            };

            //const cellId = ctx;

            // Update tableRows
            // this.tableRows = this.tableRows.map((row) => ({
            // ...row,
            // cells: row.cells.map((cell) => {
            //     if (cell.id === cellId) {
            //     const updatedCell = {
            //         ...cell,
            //         field: {
            //         ...cell.field,
            //         value: valueForField,                // ✅ all file URLs
            //         downloadLink: urls,                  // keep as array too
            //         fileName: names.join(', '),          // display-friendly
            //         contentType: files.length === 1 ? (types[0] || null) : 'multiple',
            //         s3Key: s3Keys,                       // array of keys
            //         urls,                                // alias for clarity
            //         meta: metaPayload                    // ✅ full payload in meta
            //         }
            //     };
            //     console.log('Updated cell in tableRows:', { cellId, updatedField: updatedCell.field });
            //     return updatedCell;
            //     }
            //     return cell;
            // })
            // }));

            // // Update stepPagedRows
            // this.stepPagedRows = this.stepPagedRows.map((page) =>
            // page.map((row) => ({
            //     ...row,
            //     cells: row.cells.map((cell) => {
            //     if (cell.id === cellId) {
            //         const updatedCell = {
            //         ...cell,
            //         field: {
            //             ...cell.field,
            //             value: valueForField,
            //             downloadLink: urls,
            //             fileName: names.join(', '),
            //             contentType: files.length === 1 ? (types[0] || null) : 'multiple',
            //             s3Key: s3Keys,
            //             urls,
            //             meta: metaPayload
            //         }
            //         };
            //         console.log('Updated cell in stepPagedRows:', { cellId, updatedField: updatedCell.field });
            //         return updatedCell;
            //     }
            //     return cell;
            //     })
            // }))
            // );

            // Clear the input so the same file can be selected again
           this.uploadedFiles = files;
           this.isFileExpand=false;
           this.fileuploaded=false;
           this.fileName=this.uploadedFiles[0].originalName;
           this.url=this.uploadedFiles[0].url;
           this.key=this.uploadedFiles[0].key;
           this.handleSaveAndUpload();
            /* this.fileName = names.join(', ');
            this.downloadLinks = urls; */
            //this.fileSizeFromChild = sizes;           // this.showSpinner = false;
           /*  this.fileSizeInBytes = totalBytes; */
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            //console.log(' this.downloadLinks : ',  JSON.stringify(this.downloadLinks));
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }

  processPdfFile() {
    this.fileReaderObj = new FileReader();

    this.fileReaderObj.onloadend = () => {
      let fileContents = this.fileReaderObj.result;
      fileContents = fileContents.substr(fileContents.indexOf(",") + 1);

      let sliceSize = 1024;
      let byteCharacters = atob(fileContents);
      let bytesLength = byteCharacters.length;
      let slicesCount = Math.ceil(bytesLength / sliceSize);
      let byteArrays = new Array(slicesCount);
      for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        let begin = sliceIndex * sliceSize;
        let end = Math.min(begin + sliceSize, bytesLength);
        let bytes = new Array(end - begin);
        for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
      }

      this.myFile = new File(byteArrays, this.fileName, {
        type: this.fileType
      });

      let reader = new FileReader();
      reader.onloadend = () => {
        let base64data = reader.result;
        this.base64FileData = base64data.substr(base64data.indexOf(",") + 1);
        this.handleSaveAndUpload();
      };
      reader.readAsDataURL(this.myFile);
    };

    this.fileReaderObj.readAsDataURL(this.file);
  }

 /*   async convertWordToPdf() {
    this.isLoading = true;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64WordFile = reader.result.split(",")[1]; // Extract base64 data

        if (!base64WordFile) {
          console.error("Error: Base64 conversion failed");
          this.showToast(
            "Error",
            "Failed to convert Word document to Base64.",
            "error"
          );
          return;
        }

        console.log("📌 Sending Base64 Word file to API");
        this.showSpinner = true;

        // API Call Directly from JS
        fetch("https://tesseractapps.com/word-to-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            recordId: this.orgid, // Use Org ID as record identifier
            base64WordFile: base64WordFile,
            fileName: this.fileName
          })
        })
          .then((response) => response.json())
          .then((data) => {
            if (data && data.pdfUrl) {
              console.log("📌 Received PDF URL:", data.pdfUrl);

              // Extract the PDF filename from the URL
              const pdfFilename = data.pdfUrl.split("/").pop(); // Get the last part of the URL

              console.log("📌 Extracted PDF Filename:", pdfFilename);

              // Call function to create Offer_Template__c record with PDF URL & filename
              this.handleSaveAndUploadForConvertedWord(
                data.pdfUrl,
                pdfFilename
              );
            } else {
              console.error("❌ API Response Error:", data);
              this.showToast(
                "Error",
                "Failed to get PDF URL from conversion API.",
                "error"
              );
            }
          })
          .catch((error) => {
            console.error("❌ Error converting Word to PDF:", error);
            this.showToast("Error", "Word-to-PDF conversion failed.", "error");
          })
          .finally(() => {
            this.showSpinner = false;
          });
      };

      reader.readAsDataURL(this.file);
    } catch (error) {
      console.error("Unexpected error in convertWordToPdf:", error);
      this.showToast(
        "Error",
        "An unexpected error occurred while processing the Word document.",
        "error"
      );
    }
  }  */


    async convertWordToPdf() {
  try {
    this.showSpinner = true;
    const files = [this.file];
    const svc = this.template.querySelector('c-convert-word-to-pdf-lwc');
    if (!svc) {
      this.showToast("Error", "Conversion service not found.", "error");
      this.showSpinner = false;
       await new Promise((r) => setTimeout(r, 300));
      return;
    }

    svc.incomingFiles = files;
    svc.modulePathFromParent = "ticket"; // or 'staff', etc.
    svc.confirmUpload = true;

    svc.addEventListener('uploadcomplete', (e) => {
      console.log("✅ Word→PDF conversion complete:", e.detail);
      const convertedFile = e.detail?.files?.[0];
       const pdfFilename = convertedFile?.originalName?.replace(/\.[^/.]+$/, ".pdf");
      /* const pdfUrl = convertedFile?.url?.pdfUrl;
      if (pdfUrl && typeof pdfUrl !== 'string') {
        pdfUrl = String(pdfUrl);
      } */
     this.url=convertedFile?.url?.pdfUrl;
     this.fileName=pdfFilename;
     this.key=convertedFile?.key;

     
      if (this.url) {
       // this.handleSaveAndUploadForConvertedWord(pdfUrl, pdfFilename);
       this.handleSaveAndUpload();
        this.showToast("Success", "Word converted to PDF successfully!", "success");
      }
      this.showSpinner = false;
    });
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
      this.showToast(
        "Error",
        "Please provide a file name and select a file.",
        "error"
      );
      return;
    }
    console.log('Filename,picklistvalue,orgid,')

    this.isLoading = true;
    const picklistValue = this.tsignReurl ? "Service" : "Default";

    // ✅ Step 1: Create Offer_Template__c record with orgId and optional ServiceId
    createOfferTemplate({
      fileName: this.fileName,
      picklistValue: picklistValue,
      orgId: this.orgid,
      serviceId: this.tsignReurl ? this.serviceId || "" : "", // ✅ Store ServiceId only if TsignReurl exists
      url: this.url
    })
      .then((recordId) => {
        this.recordId = recordId;
         if (!this.tsignReurl)
         {
           this.retrieveFileUrl();
         }
       
        console.log(
          "📌 Record created with ID:",
          recordId,
          " | Picklist Value:",
          picklistValue,
          " | Org ID:",
          this.orgid,
          " | Service ID:",
          this.serviceId
        );

        // ✅ Step 2: If AWS URL exists, update the record with the URL and Service ID
        if (this.tsignReurl) {
          console.log(
            "📌 AWS URL already exists, updating record with AWS URL & Service ID."
          );

          updateRecordWithAWSUrl({
            recordId: this.recordId,
            awsUrl: this.tsignReurl,
            serviceId: this.serviceId || "" // ✅ Update ServiceId only if available
          })
            .then(() => {
              console.log(
                "✅ Record updated with AWS URL & Service ID:",
                this.tsignReurl,
                this.serviceId
              );
              this.showToast(
                "Success",
                "Document linked successfully.",
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
        } /* else {
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
        } */else {
          // If no AWS URL, just finish
          console.log("📌 No AWS URL provided, skipping AWS upload.");
          this.isLoading = false;
          this.isFileUploaded=true;
          this.retrieveFileUrl();
        }
      })
      .catch((error) => {
        console.error("❌ Error creating Offer_Template__c record:", error);
       // this.showToast("Error", "Failed to create record.", "error");
        this.isLoading = false;
      });
  }

  

  retrieveFileUrl() {
    getUploadedFileUrl({ recordId: this.recordId })
      .then((url) => {
        if (url) {
          this.awsUrl = url;
          console.log('url',url);
          console.log("File URL retrieved:", url);
          this.showToast("Success", "File uploaded successfully.", "success");
          this.loadPdf(url); // Load the PDF from AWS and render it
        } else {
          console.error("No URL found for the uploaded file.");
          this.showToast(
            "Warning",
            "File uploaded but URL could not be retrieved.",
            "warning"
          );
        }
        this.showSpinner = false;
        this.isLoading = false;
        this.isFileUploaded = true;
      })
      .catch((error) => {
        console.error("Error retrieving file URL:", error);
        this.showToast("Error", "Error retrieving file URL.", "error");
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
      this.renderPageAsImage(this.currentPage); // Render the first page
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

      await page.render({ canvasContext: context, viewport }).promise;
      this.imageSrc = canvas.toDataURL("image/png"); // Convert canvas to image
    } catch (error) {
      this.handleError(`Failed to render page ${pageNumber}.`, error);
    }
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
    this.imageSrc = imageDataUrl; // Store the image URL in a tracked property for rendering
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

    // Check if at least one email is entered
    const hasEmail = this.recipientEmails.some(
      (recipient) => recipient.email && recipient.email.trim() !== ""
    );

    // If no email is entered, prevent dragging and alert the user
    if (!hasEmail) {
      event.preventDefault(); // Prevent the drag action
      this.showToast(
        "Error",
        "Please enter at least one recipient email before dragging placeholders.",
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

  allowDrop(event) {
    event.preventDefault();
  }

  //bEFORE WORD EMBED FIX

  // handleDrop(event) {
  //   event.preventDefault();

  //   // Fetch the container dimensions
  //   const container = this.template.querySelector(".image-container img");
  //   if (!container) {
  //     console.error("Image container not found.");
  //     return;
  //   }
  //   const rect = container.getBoundingClientRect();

  //   // Get the drag data
  //   const dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
  //   const { type, offsetX, offsetY } = dragData;

  //   // Calculate the drop position relative to the container
  //   const mouseX = event.clientX - rect.left;
  //   const mouseY = event.clientY - rect.top;

  //   // Adjust for the offset within the dragged element
  //   const adjustedX = mouseX - offsetX;
  //   const adjustedY = mouseY - offsetY;

  //   console.log(
  //     `Image Container Dimensions: Width=${rect.width}, Height=${rect.height}`
  //   );
  //   console.log(`Adjusted Coordinates: X=${adjustedX}px, Y=${adjustedY}px`);

  //   // Create the new placeholder
  //   if (type) {
  //     const newPlaceholder = {
  //       id: Date.now(),
  //       type: type,
  //       x: adjustedX, // Direct X coordinate relative to the image
  //       y: adjustedY, // Direct Y coordinate relative to the image
  //       value: "",
  //       page: this.currentPage,
  //       style: `top: ${adjustedY}px; left: ${adjustedX}px; position: absolute;`,
  //       isName: type === "Name",
  //       isLastName: type === "LastName",
  //       isEmail: type === "Email",
  //       isContactNumber: type === "ContactNumber",
  //       isAddress: type === "Address",
  //       isDate: type === "Date",
  //       isDateOfSigning: type === "DateOfSigning",
  //       isInitials: type === "Initials",
  //       isABN: type === "ABN",
  //       isFullName: type === "FullName",
  //       isSignature: type === "Signature",
  //       recipient: ""
  //     };

  //     console.log("New Placeholder:", newPlaceholder);
  //     this.newPlaceholder = newPlaceholder;

  //     // Trigger modal for recipient selection or further customization
  //     this.showRecipientModal = true;
  //   }
  // }


//AFTER WORD FIX BEFORE OVERFLOW

//   handleDrop(event) {
//   event.preventDefault();

//   // Fetch the container dimensions (the rendered PDF page image)
//   const imgEl = this.template.querySelector(".image-container img");
//   if (!imgEl) {
//     console.error("Image container not found.");
//     return;
//   }
//   const rect = imgEl.getBoundingClientRect();

//   // Drag data
//   const dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
//   const { type, offsetX, offsetY } = dragData;

//   // Mouse position relative to the image
//   const mouseX = event.clientX - rect.left;
//   const mouseY = event.clientY - rect.top;

//   // Adjust for the offset within the dragged element
//   const adjustedX = mouseX - offsetX;
//   const adjustedY = mouseY - offsetY;

//   console.log(
//     `Image Container Dimensions: Width=${rect.width}, Height=${rect.height}`
//   );
//   console.log(`Adjusted Coordinates: X=${adjustedX}px, Y=${adjustedY}px`);

//   // --- NEW: compute PDF page-point coordinates (doesn't change existing behavior) ---
//   // Prefer a real PDF point size if your component set it when rendering via pdf.js:
//   // e.g., this._pagePt = { w: page.getViewport({scale:1}).width, h: ... }
//   const pagePt = this._pagePt && this._pagePt.w && this._pagePt.h
//     ? this._pagePt
//     : { w: 1024, h: 1448 }; // safe fallback; keeps legacy behavior

//   // Convert current pixel (relative-to-image) coords to PDF points
//   const xPt = (adjustedX / rect.width)  * pagePt.w;
//   const yPt = (adjustedY / rect.height) * pagePt.h;

//   // If you know your input's CSS size, you can also persist wPt/hPt for perfect scaling downstream.
//   // Leaving them null preserves current UI layout and avoids side effects.
//   const wPt = null;
//   const hPt = null;
//   // -------------------------------------------------------------------------------

//   // Create the new placeholder (unchanged fields preserved)
//   if (type) {
//     const newPlaceholder = {
//       id: Date.now(),
//       type: type,
//       // existing pixels (current functionality depends on these)
//       x: adjustedX,
//       y: adjustedY,
//       // NEW: PDF-space coordinates for precise cross-render placement
//       xPt,
//       yPt,
//       wPt,
//       hPt,
//       page: this.currentPage,
//       style: `top: ${adjustedY}px; left: ${adjustedX}px; position: absolute;`,
//       value: "",
//       isName: type === "Name",
//       isLastName: type === "LastName",
//       isEmail: type === "Email",
//       isContactNumber: type === "ContactNumber",
//       isAddress: type === "Address",
//       isDate: type === "Date",
//       isDateOfSigning: type === "DateOfSigning",
//       isInitials: type === "Initials",
//       isABN: type === "ABN",
//       isFullName: type === "FullName",
//       isSignature: type === "Signature",
//       recipient: ""
//     };

//     console.log("New Placeholder:", newPlaceholder);
//     this.newPlaceholder = newPlaceholder;

//     // Trigger modal for recipient selection or further customization (unchanged)
//     this.showRecipientModal = true;
//   }
// }

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
      recipient: ""
    };

    // ⬇️ your current behavior (unchanged)
    this.newPlaceholder = newPlaceholder;
    this._commitPlaceholderPosition(newPlaceholder);
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



// tune these if you have different field sizes per type


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
    if (this.selectedRecipient && this.newPlaceholder) {
      // Assign the selected recipient to the new placeholder
      this.newPlaceholder.recipient = this.selectedRecipient;

      // Add the placeholder to the placeholders array
      this.placeholders = [...this.placeholders, this.newPlaceholder];

      // Reset temporary state
      this.newPlaceholder = null;
      this.selectedRecipient = null;
      this.showRecipientModal = false;

      // Log success for debugging
      console.log("Recipient confirmed:", this.placeholders);
    } else {
      // Show error if no recipient is selected
      this.showToast("Error", "Please select a recipient.", "error");
    }
  }

  cancelRecipientSelection() {
    this.newPlaceholder = null;
    this.selectedRecipient = null;
    this.showRecipientModal = false;
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
    this.isFileUploaded = false; // Reset uploaded file state
    this.awsUrl = ""; // Clear uploaded document URL
    this.base64FileData = ""; // Clear base64 data
    this.pdfDoc = null; // Clear the PDF document reference
    this.pdfLoaded = false; // Reset PDF loaded state
    this.placeholders = []; // Clear placeholders
    this.imageSrcs = []; // Reset multi-page images
    this.imageSrc = ""; // Reset single page image
    this.recipientEmails = [
      {
        key: 0,
        label: "New Joinee Email*",
        email: "",
        canRemove: false
      }
    ]; // Reset recipients
    this.nextRecipientKey = 1; // Reset recipient key counter
    this.showSpinner = false; // Reset spinner
    this.currentPage = 1; // Reset to the first page
    this.totalPages = 0; // Reset total pages

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
    this.recordId = ""; // Clear the record ID
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
    const picklistValue = "Default";

    // ✅ Step 1: Create Offer_Template__c record with orgId and optional ServiceId
    createOfferTemplate({
      fileName: this.fileName,
      picklistValue: picklistValue,
      orgId: this.orgid,
      serviceId: this.tsignReurl ? this.serviceId || "" : "" // ✅ Store ServiceId only if TsignReurl exists
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log(
          "📌 Record created with ID:",
          recordId,
          " | Picklist Value:",
          picklistValue,
          " | Org ID:",
          this.orgid,
          " | Service ID:",
          this.serviceId
        );

        // ✅ Step 2: If AWS URL exists, update the record with the URL and Service ID
        if (this.tsignReurl) {
          console.log(
            "📌 AWS URL already exists, updating record with AWS URL & Service ID."
          );

          updateRecordWithAWSUrl({
            recordId: this.recordId,
            awsUrl: this.tsignReurl,
            serviceId: this.serviceId || "" // ✅ Update ServiceId only if available
          })
            .then(() => {
              console.log(
                "✅ Record updated with AWS URL & Service ID:",
                this.tsignReurl,
                this.serviceId
              );
              this.showToast(
                "Success",
                "Document linked successfully.",
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
}