import { LightningElement, wire, track, api } from "lwc";
import pdfjsLib from "@salesforce/resourceUrl/pdfJS";
import pdfWorker from "@salesforce/resourceUrl/pdfWorker";
import pdfjsLibMin from '@salesforce/resourceUrl/PDFLib';
import { loadScript } from "lightning/platformResourceLoader";
import { getRecord } from "lightning/uiRecordApi";
import USER_ID from "@salesforce/user/Id";
import FULL_NAME_FIELD from "@salesforce/schema/User.Full_Name__c";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getSavedTemplates from "@salesforce/apex/myTemplates.getSavedTemplates";
import getAllTemplates from "@salesforce/apex/myTemplates.getAllTemplates";
import getArchivedTemplates from '@salesforce/apex/myTemplates.getArchivedTemplates';
import createTemplate from "@salesforce/apex/tSignDocsController.createTemplate";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import PARTICIPANT_TEMPLATE_OBJECT from "@salesforce/schema/Participant_Template__c";
import DOCUMENT_TYPE_FIELD from "@salesforce/schema/Participant_Template__c.Document_Type__c";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import updateTemplate from "@salesforce/apex/tSignDocsController.updateTemplate";
import deleteTemplate from "@salesforce/apex/myTemplates.deleteTemplate";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";
import awsupdateTemplate from '@salesforce/apex/tSignDocsController.awsupdateTemplate';
import { deleteRecord } from 'lightning/uiRecordApi';
import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';
import updateTemplateStatus from '@salesforce/apex/myTemplates.updateTemplateStatus';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getStaffByFacilities from '@salesforce/apex/myTemplates.getStaffByFacilities';
import getParticipantAndContactOptions from '@salesforce/apex/myTemplates.getParticipantAndContactOptions';
import getRecipientDetailsByEmail from '@salesforce/apex/myTemplates.getRecipientDetailsByEmail';
import sendTemplateEmail from '@salesforce/apex/myTemplates.sendTemplateEmail';
import getStaffOptions from '@salesforce/apex/StaffEmailNotificationController.getStaffOptions';
import saveTemplateShares from '@salesforce/apex/myTemplates.saveTemplateShares';
import getCurrentUserType from '@salesforce/apex/myTemplates.getCurrentUserType';
import fetchStaffByTemplate from '@salesforce/apex/StaffEmailNotificationController.fetchStaffByTemplate';

import { publish, MessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";


 const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};

// ===================== PDF Editor API (server-side processing) =====================
const PDFEDITOR_BASE = `${AWS_BASE}/pdfeditor`; // https://tesseractapps.com/pdfeditor
const PDFEDITOR_ENDPOINTS = {
  health: `${PDFEDITOR_BASE}/health`,
  merge: `${PDFEDITOR_BASE}/merge`,
  convert: `${PDFEDITOR_BASE}/convert`,
  extract: `${PDFEDITOR_BASE}/extract`,
  compress: `${PDFEDITOR_BASE}/compress`,
  watermark: `${PDFEDITOR_BASE}/watermark`,
  split: `${PDFEDITOR_BASE}/split`,
  rotate: `${PDFEDITOR_BASE}/rotate`,
  editText: `${PDFEDITOR_BASE}/edit-text`,
  pageNumbers: `${PDFEDITOR_BASE}/page-numbers`,
  info: `${PDFEDITOR_BASE}/info`
};

// Toggle for quick testing. In production, you should move these calls to Apex callouts for security/CORS.
const USE_PDFEDITOR_API = true;



export default class DocumentPageEditor extends LightningElement {
  @track pageImages = [];
  @track file;
  @track fileName;
  @track isLoading = false;
  @api orgid;
  pdfDoc;
  dragSourceIndex;
  @track isFileUploaded = false; // default
  @track isTemplateModalOpen = true;
  @track isTemplateCreate = false;
  @track fullName;
  @track templateList = [];

  @track templatePageNumber = 1;
  @track templatePageSize = 10;
  @track templateTotalPages = 0;
  @track templateListPaginated = [];
  @track templateListTotalRecords = 0;
  @track disableTemplateFirst = true;
  @track disableTemplateLast = false;

  @track createdTemplatePageNumber = 1;
  @track createdTemplatePageSize = 10;
  @track createdTemplateTotalPages = 0;
  @track createdTemplateListPaginated = [];
  @track createdTemplateTotalRecords = 0;
  @track disableCreatedTemplateFirst = true;
  @track disableCreatedTemplateLast = false;
  @track edittemplate=false;
@track selectedTemplateId;
@track selectedTemplate;
@track selectedDocxUrl;
  @track selectedUploadType; // 'pdf' or 'docx'
USER_ID$0
@track isWordEditorOpen = false;

@track showUpgradeModal = false;

closeUpgradeModal() {
    this.showUpgradeModal = false;
}

@track participantContactOptions = [];
@track selectedRecipientDetails = null;


//Sai Eswar
@track assignmentFlag = false;
@track selectedTemplateId;
@track selectedStaffIds = [];
@track filteredStaffOptions = [];
@track showPermissionIcon = false;
@track saveButtonDisable = true;

recipientOptionMap = {};

@wire(MessageContext)
messageContext;



  @wire(getRecord, {
    recordId: USER_ID,
    fields: [FULL_NAME_FIELD]
  })
  wiredUser({ error, data }) {
    if (data) {
      this.fullName = data.fields.Full_Name__c.value;
      console.log("👤 Full Name:", this.fullName);
    } else if (error) {
      console.error("❌ Failed to fetch Full_Name__c from User:", error);
    }
  }


  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }
 // fields somewhere on the class:
pdfJsReady = false;
pdfLibReady = false;
_libsLoading = null;

// renderedCallback replacement
renderedCallback() {
  // avoid reloading on every render
  if (this._libsLoading || (this.pdfJsReady && this.pdfLibReady)) return;

  console.log('📦 Loading PDF libraries…');

  // Build the jobs list so we don't re-load if already present on window
  const jobs = [];
  if (!window.pdfjsLib) {
    jobs.push(loadScript(this, pdfjsLib));          // your @salesforce/resourceUrl/pdfJS
  } else {
    this.pdfJsReady = true;
    console.log('🔁 pdf.js already present');
  }

  if (!window.PDFLib) {
    jobs.push(loadScript(this, pdfjsLibMin));       // your @salesforce/resourceUrl/PDFLib (pdf-lib.min.js)
  } else {
    this.pdfLibReady = true;
    console.log('🔁 pdf-lib already present');
  }

  // If nothing to load, just ensure worker is set and bail
  if (jobs.length === 0) {
    try {
      // set/refresh workerSrc every time just to be safe
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker; // your @salesforce/resourceUrl/pdfWorker
    } catch (e) {
      console.warn('⚠️ Could not set pdf.js worker', e);
    }
    return;
  }

  this._libsLoading = Promise.all(jobs)
    .then(() => {
      // Configure worker for pdf.js
      if (window?.pdfjsLib) {
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
          this.pdfJsReady = true;
          console.log('✅ pdf.js ready (worker set)');
        } catch (e) {
          this.pdfJsReady = false;
          console.error('❌ Failed to set pdf.js worker', e);
        }
      }

      // Verify pdf-lib
      if (window && window.PDFLib) {
        this.pdfLibReady = true;
        console.log('✅ pdf-lib ready');
      } else {
        throw new Error('pdf-lib failed to initialize (window.PDFLib missing)');
      }
    })
    .catch((err) => {
      this.pdfJsReady = false;
      this.pdfLibReady = false;
      console.error('❌ Failed to load PDF libraries:', err);
    })
    .finally(() => {
      this._libsLoading = null;
    });
}
boundHandleKeyShortcut;
boundHandleOutsideClick;

async connectedCallback() {
    console.log('Checking plan before opening Template module...');

    try {
        const isStart = await isStartPlan();

        if (isStart) {
            console.log('🚫 Start plan → block Template module');

            this.showUpgradeModal = true;
            this.isTemplateModalOpen = false;
            this.isTemplateCreate = false;
            return;
        }

    } catch (error) {
        console.error('Error checking plan:', error);
        return;
    }

    const activeTab = localStorage.getItem('activeHrTemplatesTab');

    this.templatesFlag = false;
    this.createtemplatesFlag = false;

    // Wait until permissions + orgid are loaded
    console.log('Loading user permissions...');
    await this.loadUserPermissions();

    console.log('Permissions loaded');
    console.log('orgid:', this.orgid);

    switch (activeTab) {

        case 'hrMyTemplates':
            console.log('Opening My Templates');

            this.templatesFlag = true;

            // Prevent early API call
            if (this.orgid) {
                await this.loadSavedTemplates();
            } else {
                console.warn('Skipping loadSavedTemplates → orgid missing');
            }

            break;

        case 'hrCreatedTemplates':
            console.log('Opening Created Templates');

            this.createtemplatesFlag = true;
            break;

        default:
            console.log('Opening Default Tab → My Templates');

            this.templatesFlag = true;

            if (this.orgid) {
                await this.loadSavedTemplates();
            } else {
                console.warn('Skipping loadSavedTemplates → orgid missing');
            }
    }

    // bind once
    this.boundHandleKeyShortcut =
        this.handleKeyShortcut.bind(this);

    this.boundHandleOutsideClick =
        this.handleOutsideClick.bind(this);

    window.addEventListener(
        'keydown',
        this.boundHandleKeyShortcut
    );

    document.addEventListener(
        'click',
        this.boundHandleOutsideClick
    );

    console.log('connectedCallback completed');
}

disconnectedCallback() {
    window.removeEventListener('keydown', this.boundHandleKeyShortcut);
    document.removeEventListener('click', this.boundHandleOutsideClick);
}

loadUserPermissions() {

    getCurrentUserType()
    .then(result => {

        if (
            result === 'NDIS Org Admin' ||
            result === 'Facility Admin'
        ) {
            this.showPermissionIcon = true;
        } else {
            this.showPermissionIcon = false;
        }

    })
    .catch(error => {
        console.error(error);
    });
}

  // =================================================================================
  // Upload / Load PDFs (client-side UI, server-side heavy lifting via PDFEditor API)
  // =================================================================================
  /**
   * Template-create upload handler (wired from documentPageEditor.html).
   * Supports multiple files: PDF + DOCX in any combination.
   * - DOCX => converted to PDF using /pdfeditor/convert
   * - Multiple PDFs => merged using /pdfeditor/merge
   * Then renders thumbnails using pdf.js like before.
   */
  async handleFileUploadOrg(event) {
    console.log("📥 handleFileUploadOrg() triggered");
    const inputEl = event?.target;
    const allFiles = Array.from(inputEl?.files || []);
    if (!allFiles.length) return;
    // Note: PDF renderer readiness is checked later only when PDFs are selected.
// Only PDF/DOCX for this flow (matches accept in HTML)
    const supportedExt = new Set(["pdf", "docx"]);
    const eligible = [];
    const ignored = [];
    for (const f of allFiles) {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      if (supportedExt.has(ext)) eligible.push(f);
      else ignored.push(f.name);
    }
    if (ignored.length) {
      this.showToast("Warning", `Ignored unsupported files: ${ignored.join(", ")}`, "warning");
    }
    if (!eligible.length) {
      inputEl.value = "";
      return;
    }


    // Restrict selection: allow multiple PDFs OR multiple DOCX, but do not allow mixed types.
    const typeSet = new Set(
      eligible.map((f) => (f.name.split(".").pop() || "").toLowerCase())
    );
    if (typeSet.size > 1) {
      this.showToast(
        "Error",
        "Please select either only PDF files or only DOCX files (no mixing).",
        "error"
      );
      this.isFileUploaded = false;
      inputEl.value = "";
      return;
    }
    const selectedType = [...typeSet][0];
    this.selectedUploadType = selectedType;

    // DOCX flow: handled by <c-word-editor-lwc>. No DOCX->PDF conversion in this component.
    if (selectedType === "docx") {
      this.isLoading = false;
      this.isFileUploaded = true;

      // For testing: open the first DOCX in the Word Editor.
      // IMPORTANT: if your Word Editor requires an S3/HTTP URL accessible by the server,
      // you should upload the DOCX first and then pass that URL instead of a blob: URL.
      const first = eligible[0];
      this.selectedDocxUrl = URL.createObjectURL(first);
      this.selectedAwsKey = null;
      this.isWordEditorOpen = true;

      if (eligible.length > 1) {
        this.showToast(
          "Info",
          "Multiple DOCX selected. Opening the first document in the Word Editor. (Extend to process the rest if needed.)",
          "info"
        );
      }

      inputEl.value = "";
      return;
    }

    // PDF flow: ensure pdf.js is ready before rendering thumbnails.
    if (!this.pdfJsReady || !window?.pdfjsLib) {
      this.showToast(
        "Error",
        "PDF renderer not ready yet. Please try again.",
        "error"
      );
      this.isFileUploaded = false;
      inputEl.value = "";
      return;
    }
    // Total size gate (kept as your existing 10MB combined rule for template create)
    const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
    const totalBytes = eligible.reduce((s, f) => s + (f.size || 0), 0);
    console.log(`🧮 Total selected size: ${this._formatBytes(totalBytes)} (limit 10MB)`);
    if (totalBytes > MAX_TOTAL_BYTES) {
      this.showToast(
        "Error",
        `Total size is ${this._formatBytes(totalBytes)}. Please keep combined files under 10 MB.`,
        "error"
      );
      this.isFileUploaded = false;
      inputEl.value = "";
      return;
    }

    this.isLoading = true;
    this.isFileUploaded = true;

    try {
      // 1) PDFs only (DOCX is handled by Word Editor - no conversion here)
      const pdfBlobs = [...eligible];

// 2) Merge if multiple PDFs
      let finalPdfBlob;
      if (pdfBlobs.length === 1) {
        finalPdfBlob = pdfBlobs[0] instanceof Blob ? pdfBlobs[0] : new Blob([await pdfBlobs[0].arrayBuffer()], { type: "application/pdf" });
      } else {
        if (!USE_PDFEDITOR_API) throw new Error("Merge is disabled in this build.");
        console.log(`🧩 Merging ${pdfBlobs.length} PDFs via API`);
        finalPdfBlob = await this._mergePdfsViaApi(pdfBlobs, "merged.pdf");
      }

      // 3) Render
      await this.processPdf(finalPdfBlob, this.batchCounter++);
      console.log("✅ Upload/convert/merge finished");
    } catch (e) {
      console.error("❌ handleFileUploadOrg failed", e);
      this.showToast("Error", e?.message || "Failed to process the uploaded files.", "error");
      this.isFileUploaded = false;
    } finally {
      this.isLoading = false;
      if (inputEl) inputEl.value = "";
    }
  }

  /**
   * Load and render a PDF into thumbnails. Accepts:
   * - Blob/File (preferred for API output)
   * - URL string (existing template load flow)
   */
  async processPdf(fileOrUrl, batchIndex = 0) {
    console.log("📄 processPdf() called", { batchIndex, type: typeof fileOrUrl });

    this.isLoading = true;
    try {
      let binaryData;

      if (typeof fileOrUrl === "string") {
        console.log(`🌐 Loading PDF from URL: ${fileOrUrl}`);
        const res = await fetch(fileOrUrl, { method: "GET" });
        if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
        const buf = await res.arrayBuffer();
        binaryData = new Uint8Array(buf);
      } else {
        console.log(`📂 Loading PDF from Blob/File`);
        const buf = await fileOrUrl.arrayBuffer();
        binaryData = new Uint8Array(buf);
      }

      this.pdfArrayBuffer = binaryData;
      const loadingTask = window.pdfjsLib.getDocument({ data: binaryData });
      this.pdfDoc = await loadingTask.promise;

      const totalPages = this.pdfDoc.numPages;
      console.log(`📄 PDF loaded with ${totalPages} pages (Batch ${batchIndex})`);

      const imagePromises = [];
      for (let i = 1; i <= totalPages; i++) {
        imagePromises.push(this.renderPageAsImage(i, batchIndex, i));
      }
      const newPages = await Promise.all(imagePromises);

      // Replace if first load; append if subsequent batches
      this.pageImages = [...this.pageImages, ...newPages];
      console.log(`🖼️ Rendered ${newPages.length} pages from Batch ${batchIndex}`);
    } catch (err) {
      console.error("❌ PDF Load Error:", err);
      this.showToast("Error", err?.message || "Failed to load PDF", "error");
    } finally {
      this.isLoading = false;
    }
  }




//   async handleFileUploadOrg(event) {
//   console.log("📥 handleFileUploadOrg() triggered");

//   const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10MB
//   const inputEl = event.target;
//   const allFiles = Array.from(inputEl.files || []);
//   if (!allFiles.length) return;

//   // Only PDF/DOCX are eligible
//   const supportedExt = new Set(["pdf", "docx"]);
//   const unsupported = [];
//   const eligibleFiles = [];

//   for (const f of allFiles) {
//     const ext = (f.name.split(".").pop() || "").toLowerCase();
//     if (supportedExt.has(ext)) eligibleFiles.push(f);
//     else unsupported.push({ name: f.name, ext });
//   }

//   if (unsupported.length) {
//     console.warn("❗ Unsupported files ignored:", unsupported.map(u => u.name).join(", "));
//     this.dispatchEvent(
//       new ShowToastEvent({
//         title: "Some files were ignored",
//         message: `Only PDF and DOCX are allowed. Ignored: ${unsupported.map(u => u.name).join(", ")}`,
//         variant: "warning"
//       })
//     );
//   }

//   if (!eligibleFiles.length) {
//     inputEl.value = ""; // allow reselection
//     return;
//   }

//   // Size gate
//   const totalBytes = eligibleFiles.reduce((sum, f) => sum + (f.size || 0), 0);
//   console.log(`🧮 Total selected size: ${this._formatBytes(totalBytes)} (limit 10MB)`);

//   if (totalBytes > MAX_TOTAL_BYTES) {
//     this.dispatchEvent(
//       new ShowToastEvent({
//         title: "File size limit exceeded",
//         message: `Total size is ${this._formatBytes(totalBytes)}. Please keep combined PDF/DOCX under 10 MB.`,
//         variant: "error"
//       })
//     );
//     this.isFileUploaded = false;
//     inputEl.value = ""; // reset for retry
//     return;
//   }

//   // Under limit → process
//   this.isFileUploaded = true;
//   const allTasks = [];

//   for (let file of eligibleFiles) {
//     const extension = (file.name.split(".").pop() || "").toLowerCase();
//     const currentBatch = this.batchCounter++;
//     console.log(`📁 File selected: ${file.name} (Batch ${currentBatch})`);

//     if (extension === "pdf") {
//       allTasks.push(this.processPdf(file, currentBatch));
//     } else if (extension === "docx") {
//       console.log('word file is')
//       allTasks.push(this.convertWordToPdf(file, file.name, currentBatch));
//     }
//   }

//   try {
//     await Promise.all(allTasks);
//     console.log("✅ All files fully processed.");
//   } catch (error) {
//     console.error("❌ One or more files failed:", error);
//   } finally {
//     inputEl.value = ""; // clear so same names can be chosen again
//   }
// }


// Helper: human-friendly bytes
_formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}




// async processPdf(fileOrUrl, batchIndex) {
//   console.log("📄 processPdf() called");
//   this.isLoading = true;
//   try {
//     let loadingTask;
//     let binaryData;

//     if (typeof fileOrUrl === "string") {
//       console.log(`🌐 Loading PDF from remote URL: ${fileOrUrl}`);

//       // Try to fetch bytes so downstream editing has a buffer.
//       try {
//         const res = await fetch(fileOrUrl, { method: 'GET' }); // CHANGED: ensure GET
//         if (res.ok) {
//           const buf = await res.arrayBuffer();
//           binaryData = new Uint8Array(buf);
//           loadingTask = window.pdfjsLib.getDocument({ data: binaryData }); // prefer bytes
//           console.log('🧩 Loaded PDF via bytes from URL');
//         } else {
//           console.warn('Fetch not OK, falling back to pdf.js URL loader:', res.status);
//           loadingTask = window.pdfjsLib.getDocument(fileOrUrl); // fallback
//         }
//       } catch (e) {
//         console.warn('fetch failed, will rely on pdf.js only', e);
//         loadingTask = window.pdfjsLib.getDocument(fileOrUrl); // fallback
//       }
//     } else {
//       console.log(`📂 Loading PDF from local file: ${fileOrUrl.name}`);
//       const reader = new FileReader();
//       const base64 = await new Promise((resolve) => {
//         reader.onloadend = () => resolve(reader.result);
//         reader.readAsDataURL(fileOrUrl);
//       });
//       binaryData = this.base64ToUint8Array(base64.split(",")[1]);
//       loadingTask = window.pdfjsLib.getDocument({ data: binaryData });
//     }

//     this.pdfDoc = await loadingTask.promise;

//     // ⭐ keep the bytes for pdf-lib editing
//     if (!binaryData && this.pdfDoc?.getData) {
//       try {
//         const raw = await this.pdfDoc.getData();
//         binaryData = new Uint8Array(raw);
//       } catch (e) {
//         console.warn('getData() not available or failed', e);
//       }
//     }
//     if (binaryData) {
//       this.pdfArrayBuffer = binaryData;
//       console.log('🧩 pdfArrayBuffer ready', this.pdfArrayBuffer.byteLength);
//     }

//     const totalPages = this.pdfDoc.numPages;
//     console.log(`📄 PDF loaded with ${totalPages} pages (Batch ${batchIndex})`);

//     const imagePromises = [];
//     for (let i = 1; i <= totalPages; i++) {
//       imagePromises.push(this.renderPageAsImage(i, batchIndex, i));
//     }
//     const newPages = await Promise.all(imagePromises);
//     this.pageImages = [...this.pageImages, ...newPages];

//     console.log(`🖼️ Rendered ${newPages.length} pages from Batch ${batchIndex}`);
//   } catch (err) {
//     console.error("❌ PDF Load Error:", err);
//     this.showToast('Error', err?.message || 'Failed to load PDF', 'error');
//   } finally {
//     this.isLoading = false;
//   }
// }



  base64ToUint8Array(base64) {
    const raw = atob(base64);
    const uint8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      uint8Array[i] = raw.charCodeAt(i);
    }
    return uint8Array;
  }


  // --------------------- PDF Editor API helpers ---------------------
  async _blobToBase64(blob) {
    const buf = await blob.arrayBuffer();
    return this._arrayBufferToBase64(buf);
  }

  _arrayBufferToBase64(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async _fileToBase64(file) {
    const buf = await file.arrayBuffer();
    return this._arrayBufferToBase64(buf);
  }

  async _callPdfEditor(url, payload, { expect = 'blob' } = {}) {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // For file-returning endpoints, the API returns a FileResponse (application/pdf)
    if (!resp.ok) {
      const text = await resp.text();
      let msg = text;
      try {
        const json = JSON.parse(text);
        msg = json?.detail || json?.error || text;
      } catch (_) {
        // ignore
      }
      throw new Error(`PDFEditor API error (${resp.status}): ${msg}`);
    }

    if (expect === 'json') return resp.json();
    if (expect === 'text') return resp.text();
    return resp.blob();
  }

  // Convert any supported file (PDF/DOCX/IMG/etc.) to PDF using the API.
  async _convertToPdfViaApi(file, outputName) {
    const file_data = await this._fileToBase64(file);
    const payload = {
      file_data,
      filename: file.name,
      output_name: outputName || (file.name.replace(/\.[^.]+$/, '') + '.pdf')
    };
    return this._callPdfEditor(PDFEDITOR_ENDPOINTS.convert, payload, { expect: 'blob' });
  }

  // Merge multiple PDFs (File/Blob) using the API.
  async _mergePdfsViaApi(pdfFilesOrBlobs, outputName = 'merged.pdf') {
    const filesBase64 = [];
    for (const f of pdfFilesOrBlobs) {
      const blob = f instanceof Blob ? f : new Blob([await f.arrayBuffer()], { type: 'application/pdf' });
      filesBase64.push(await this._blobToBase64(blob));
    }
    const payload = { files: filesBase64, output_name: outputName };
    return this._callPdfEditor(PDFEDITOR_ENDPOINTS.merge, payload, { expect: 'blob' });
  }

  async _compressPdfViaApi(pdfBlobOrBytes, filename = 'document.pdf', quality = 'medium') {
    let file_data;
    if (pdfBlobOrBytes instanceof Blob) file_data = await this._blobToBase64(pdfBlobOrBytes);
    else file_data = this._arrayBufferToBase64(pdfBlobOrBytes);

    const payload = { file_data, filename, quality, output_name: 'compressed.pdf' };
    return this._callPdfEditor(PDFEDITOR_ENDPOINTS.compress, payload, { expect: 'blob' });
  }

  async _editTextViaApi(pdfBytes, filename, findText, replaceText) {
    const payload = {
      file_data: this._arrayBufferToBase64(pdfBytes),
      filename: filename || 'document.pdf',
      find_text: findText,
      replace_text: replaceText,
      output_name: 'edited.pdf'
    };
    return this._callPdfEditor(PDFEDITOR_ENDPOINTS.editText, payload, { expect: 'blob' });
  }

  async renderPageAsImage(globalPageNumber, batchIndex, localPageNumber) {
    console.log(
      `🖼️ Rendering page ${localPageNumber} (Batch ${batchIndex})...`
    );
    const page = await this.pdfDoc.getPage(globalPageNumber);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    console.log(`✅ Page ${localPageNumber} rendered`);

    const colorClasses = [
      "batch-color-1",
      "batch-color-2",
      "batch-color-3",
      "batch-color-4"
    ];
    const batchClass = colorClasses[batchIndex % colorClasses.length];

    return {
      id: Date.now() + globalPageNumber + batchIndex,
      dataUrl: canvas.toDataURL("image/png"),
      pageNumber: `Page ${localPageNumber}`,
      cardClass: `page-card ${batchClass}`,
      zoomoutClass: `page-card1 ${batchClass}` // ✅ Pre-compute the full class string
    };
  }


  _activeOverlays = [];

async renderSpecificPages(pages = [this.currentEditPage], scale = 1.25) {
  if (!this.pdfArrayBuffer || !this.pdfJsReady) return;

  this.previewPageCount = pages.length;
  this.previewScale = scale;

  const host = this.template.querySelector('[data-ref="viewer"]');
  if (!host) return;
   this._cleanupSnipOverlays();
  host.innerHTML = '';

  const doc = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise;
  for (const p of pages) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale });

    // wrapper
    const wrap = document.createElement('div');
    wrap.className = 'pdf-page';
    wrap.dataset.page = String(p);
    wrap.style.position = 'relative';
    wrap.style.width = `${viewport.width}px`;
    wrap.style.height = `${viewport.height}px`;

    // Hi-DPI canvas
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(viewport.width * dpr);
    canvas.height = Math.ceil(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    wrap.appendChild(canvas);
    host.appendChild(wrap);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // selectable text layer
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.style.position = 'absolute';
    textLayer.style.inset = '0';
    textLayer.style.userSelect = 'text';
    textLayer.style.pointerEvents = 'auto';
    wrap.appendChild(textLayer);

    const textContent = await page.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });
    this._paintTextLayer(textLayer, textContent, viewport);

    // pick up mouse selection into the "Find" input
    textLayer.addEventListener('mouseup', this._handleSelectionMouseUp);
  }
}
// async convertWordToPdf(file, fileName, batchIndex) {
//   console.log("📥 [DOCX] Starting Word to PDF conversion:", fileName);

//   return new Promise((resolve, reject) => {
//     this.isLoading = true;

//     const reader = new FileReader();

//     reader.onloadend = async () => {
//       try {
//         const base64WordFile = reader.result.split(",")[1];

//         if (!base64WordFile) {
//           console.error("❌ Base64 extraction failed for:", fileName);
//           this.isLoading = false;
//           return reject("Base64 extraction failed");
//         }

//         console.log(`📤 Sending to conversion API: ${fileName}`);
//         const response = await fetch(
//           "https://tesseractapps.com/word-to-pdf",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               recordId: this.orgid || "NA",
//               base64WordFile,
//               fileName
//             })
//           }
//         );

//         const data = await response.json();
//         console.log("📡 API response:", data);

//         if (!data || !data.pdfUrl) {
//           console.error("❌ No valid pdfUrl returned from API", data);
//           this.isLoading = false;
//           return reject("Invalid conversion API response");
//         }

//         const pdfUrl = data.pdfUrl;
//         console.log(`✅ Received PDF URL: ${pdfUrl}`);

//         // 🔄 CHANGED: fetch the URL with GET (HEAD is often blocked by CORS/CDN),
//         // wrap as a File so downstream always receives a File/Blob.
//         let fetchedFile;
//         try {
//           const res = await fetch(pdfUrl, { method: "GET" }); // CHANGED
//           if (!res.ok) {
//             console.error("❌ PDF URL not reachable:", res.status);
//             this.isLoading = false;
//             return reject(`PDF not accessible: ${res.status}`);
//           }
//           const blob = await res.blob();
//           fetchedFile = new File([blob], (fileName || "converted") + ".pdf", {
//             type: "application/pdf"
//           });
//           console.log("📦 Wrapped remote PDF as File:", fetchedFile.name);
//         } catch (fetchErr) {
//           console.error("❌ PDF URL fetch failed:", fetchErr);
//           this.isLoading = false;
//           return reject("PDF fetch failed");
//         }

//         // ✅ CHANGED: always pass a File
//         console.log("📄 Calling processPdf() with File from remote PDF...");
//         try {
//           await this.processPdf(fetchedFile, batchIndex);
//           console.log("✅ processPdf() completed successfully.");
//         } catch (processErr) {
//           console.error("❌ processPdf() threw an error:", processErr);
//           return reject("PDF rendering failed");
//         }

//         resolve(); // done!
//       } catch (outerErr) {
//         console.error("❌ Exception during Word-to-PDF conversion:", outerErr);
//         reject(outerErr);
//       } finally {
//         this.isLoading = false;
//       }
//     };

//     reader.onerror = (e) => {
//       console.error("❌ FileReader failed:", e);
//       this.isLoading = false;
//       reject("FileReader failed");
//     };

//     try {
//       reader.readAsDataURL(file);
//       console.log("📚 FileReader started reading file...");
//     } catch (e) {
//       console.error("❌ FileReader crashed:", e);
//       this.isLoading = false;
//       reject("FileReader exception");
//     }
//   });
// }


  handleDragStart(event) {
    const id = event.currentTarget.dataset.id;
    event.dataTransfer.setData("text/plain", id);
    console.log(`🔀 Drag started for page ID ${id}`);
  }

  handleDrop(event) {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain");
    const targetId = event.currentTarget.dataset.id;

    const sourceIndex = this.pageImages.findIndex((p) => p.id == sourceId);
    const targetIndex = this.pageImages.findIndex((p) => p.id == targetId);

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex)
      return;

    const reordered = [...this.pageImages];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    this.pageImages = reordered;

    console.log(
      `📦 Moved page ID ${sourceId} to position of page ID ${targetId}`
    );
  }

  allowDrop(event) {
    event.preventDefault();
  }
  handleDragEnter(event) {
    event.currentTarget.classList.add("drag-over");
  }
  handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
  }

  deletePage(event) {
    const id = event.currentTarget.dataset.id; // ✅ not event.target
    const index = this.pageImages.findIndex((p) => p.id == id);

    console.log(`🗑️ Delete requested for page ID: ${id}`);

    if (index !== -1) {
      console.log(`✅ Page found at index ${index}, deleting...`);
      this.pageImages.splice(index, 1);
      this.pageImages = [...this.pageImages];
      console.log(
        `📦 Updated pageImages:`,
        this.pageImages.map((p) => p.pageNumber)
      );
    } else {
      console.warn(`⚠️ Page with ID ${id} not found in current pageImages.`);
    }
  }

  // handleGenerateNewPdf() {
  //   if (!this.pageImages.length) {
  //     console.warn("⚠️ No pages to export");
  //     return;
  //   }
  //   this.isLoading = true;

  //   console.log("🛠️ Generating new PDF from", this.pageImages.length, "pages");

  //   Promise.all([
  //     loadScript(this, "/resource/jspdf"),
  //     loadScript(this, "/resource/html2canvas")
  //   ])
  //     .then(() => {
  //       const doc = new window.jspdf.jsPDF({
  //         orientation: "portrait",
  //         unit: "mm",
  //         format: "a4",
  //         compress: true
  //       });

  //       this.pageImages.forEach((img, index) => {
  //         if (index > 0) doc.addPage();
  //         doc.addImage(img.dataUrl, "PNG", 10, 10, 190, 260, "", "FAST");
  //       });

  //       const pdfBlob = doc.output("blob");

  //       if (pdfBlob.size > 10 * 1024 * 1024) {
  //         console.warn("❌ PDF exceeds 10MB, aborting save.");
  //         this.showToast(
  //           "Error",
  //           "Generated PDF exceeds 10MB limit. Please remove pages or compress input.",
  //           "error"
  //         );
  //         return;
  //       }

  //       const today = new Date();
  //       const dd = String(today.getDate()).padStart(2, "0");
  //       const mm = String(today.getMonth() + 1).padStart(2, "0");
  //       const yyyy = today.getFullYear();
  //       const hh = String(today.getHours()).padStart(2, "0");
  //       const min = String(today.getMinutes()).padStart(2, "0");
  //       const formattedDateTime = `${dd}${mm}${yyyy}_${hh}${min}`;
  //       const sanitizedName = this.fullName.replace(/[^a-zA-Z0-9]/g, "");
  //       const fileName = `${sanitizedName}_Template_${formattedDateTime}.pdf`;

  //       doc.save(fileName);
  //       console.log(`✅ PDF saved as '${fileName}'`);
  //       this.isLoading = false;
  //     })
  //     .catch((err) => {
  //       console.error("❌ PDF Generation Error:", err);
  //       this.isLoading = false;
  //     });
  // }

  async handleGenerateNewPdf() {
  if (!this.pageImages.length) {
    console.warn("⚠️ No pages to export");
    return;
  }

  if (this.pageImages.length > 25) {
    this.showToast(
      "Warning",
      "PDF generation is limited to 25 pages. Please reduce the number of pages.",
      "warning"
    );
    console.warn(`⚠️ Page limit exceeded: ${this.pageImages.length} pages (max 25).`);
    return;
  }

  this.isLoading = true;
  console.log("🛠️ Generating new PDF from", this.pageImages.length, "pages");

  try {
    // Load libraries
    await Promise.all([
      loadScript(this, "/resource/jspdf"),
      loadScript(this, "/resource/html2canvas")
    ]);

    const doc = new window.jspdf.jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    this.pageImages.forEach((img, index) => {
      if (index > 0) doc.addPage();
      doc.addImage(img.dataUrl, "PNG", 10, 10, 190, 260, "", "FAST");
    });

    let pdfBlob = doc.output("blob");
    const sizeMB = pdfBlob.size / (1024 * 1024);
    console.log(`📄 Initial PDF size: ${sizeMB.toFixed(2)} MB`);

    // ✅ Compress if more than 10 MB
    if (sizeMB > 10) {
      console.warn("⚠️ PDF exceeds 10MB — compressing...");
      pdfBlob = USE_PDFEDITOR_API
        ? await this._compressPdfViaApi(pdfBlob, 'generated.pdf', 'medium')
        : await this.compressPdf(this.pageImages, sizeMB);
      const newSizeMB = pdfBlob.size / (1024 * 1024);
      console.log(`✅ Compressed PDF size: ${newSizeMB.toFixed(2)} MB`);
    }

    // ✅ Create filename
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const hh = String(today.getHours()).padStart(2, "0");
    const min = String(today.getMinutes()).padStart(2, "0");
    const formattedDateTime = `${dd}${mm}${yyyy}_${hh}${min}`;
    const sanitizedName =
      this.fullName?.replace(/[^a-zA-Z0-9]/g, "") || "Generated";
    const fileName = `${sanitizedName}_Template_${formattedDateTime}.pdf`;

    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
    await this.processGeneratedFile(pdfFile);

    console.log(`✅ PDF prepared as '${fileName}', ready for upload`);

  } catch (err) {
    console.error("❌ PDF Generation Error:", err);
  } finally {
    //this.isLoading = false;
  }
}


  async compressPdf(pageImages, currentSizeMB) {
  let quality = 0.9; // start near-lossless
  let step = 0.1;
  let pdfBlob;

  while (currentSizeMB > 10 && quality > 0.4) {
    const doc = new window.jspdf.jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    for (let i = 0; i < pageImages.length; i++) {
      const compressedImg = await this.convertToJpeg(pageImages[i].dataUrl, quality);
      if (i > 0) doc.addPage();
      doc.addImage(compressedImg, "JPEG", 10, 10, 190, 260, "", "FAST");
    }

    pdfBlob = doc.output("blob");
    currentSizeMB = pdfBlob.size / (1024 * 1024);
    console.log(`🔄 Retried at quality ${quality.toFixed(2)} → ${currentSizeMB.toFixed(2)} MB`);
    quality -= step;
  }

  return pdfBlob;
}

//
// 🧩 Optimize PNG (lossless resizing for smaller footprint)
//
optimizePng(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const MAX_WIDTH = 1654; // ~A4 width at 150 dpi
      const scale = Math.min(MAX_WIDTH / img.width, 1);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png")); // Lossless PNG
    };
  });
}

//
// 🧩 Convert to JPEG (visually lossless at ≥0.8)
//
convertToJpeg(dataUrl, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
  });
}

  /*  processGeneratedFile(pdfFile) {
    console.log("📤 Sending generated PDF to upload flow...");

    setTimeout(() => {
      this.isFileExpand = true;
      this.isFileExpand1 = false;

      setTimeout(() => {
        const svc = this.template.querySelector('c-document-office-service');
        if (!svc) {
          console.warn("⚠️ No <c-document-office-service> component found.");
          return;
        }

        // 🟩 **Pass the generated PDF file to child**
        svc.incomingFiles = [pdfFile];
        console.log("✅ PDF sent to document-office-service");
      }, 1000);
    }, 0);
  } */

     async processGeneratedFile(pdfFile) {
  try {
    this.showSpinner = true;
      this.isFileExpand = true;
      this.isFileExpand1= false;
    const files = [pdfFile];
    await new Promise((resolve) => setTimeout(resolve, 400));
    const svc = this.template.querySelector('c-document-office-service');
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
      console.log("✅ Word→PDF conversion complete:", JSON.stringify(e.detail));
      this.uploadedFiles=e.detail?.files?.[0];
      const convertedFile = e.detail?.files?.[0];
      this.fileName = convertedFile?.originalName;
      this.url=convertedFile?.url;
     this.key=convertedFile?.key; 
      console.log('uploaded files',JSON.stringify( this.uploadedFiles));

      if (this.url) { 
        this.templateName = "";
        this.templateDocumentType = "Created Template";
        this.isPdfMetaModalOpen = true;

        this.isLoading = false;
       // this.showToast("Success", "Word converted to PDF successfully!", "success");
       } 
      this.showSpinner = false;
    });
  } catch (err) {
    console.error("❌ convertWordToPdf failed:", err);
    this.showToast("Error", "Word to PDF conversion failed.", "error");
    this.showSpinner = false;

  }

}

  @track isZoomOpen = false;
  @track zoomedPage = null;

  @track zoomLevel = 1; // default zoom level (1x)
  @track isDraggingZoom = false;
  @track dragStartZoom = { x: 0, y: 0 };
  @track imgOffsetZoom = { x: 0, y: 0 };
  get showZoomOut() {
    return this.zoomLevel > 1;
  }

  get zoomStyle() {
    return `
    transform: scale(${this.zoomLevel}) translate(${this.imgOffsetZoom.x}px, ${this.imgOffsetZoom.y}px);
    cursor: ${this.zoomLevel > 1 ? "grab" : "default"};
    transition: transform 0.2s ease-in-out;
    transform-origin: center;
  `;
  }

  // 🔍 Zoom In
  zoomIn() {
    if (this.zoomLevel < 3) {
      this.zoomLevel = parseFloat((this.zoomLevel + 0.1).toFixed(1));
    }
  }

  // ➖ Zoom Out
  zoomOut() {
    if (this.zoomLevel > 1) {
      this.zoomLevel = parseFloat((this.zoomLevel - 0.1).toFixed(1));
      // Reset position if back to 1x
      if (this.zoomLevel === 1) {
        this.imgOffsetZoom = { x: 0, y: 0 };
      }
    }
  }

  // 🖱️ Start Drag
  startDragZoom(event) {
    if (this.zoomLevel <= 1) return;
    this.isDraggingZoom = true;
    this.dragStartZoom = { x: event.clientX, y: event.clientY };
  }

  // 🖱️ Move Image
  handleDragZoom(event) {
    if (!this.isDraggingZoom || this.zoomLevel <= 1) return;

    const dx = event.clientX - this.dragStartZoom.x;
    const dy = event.clientY - this.dragStartZoom.y;

    this.imgOffsetZoom = {
      x: this.imgOffsetZoom.x + dx,
      y: this.imgOffsetZoom.y + dy
    };

    this.dragStartZoom = { x: event.clientX, y: event.clientY };
  }

  // 🖱️ Stop Drag
  stopDragZoom() {
    this.isDraggingZoom = false;
  }

  // Swallow clicks/drags from action buttons so they don't bubble to the card
stopEvent = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

// If anything inside .card-actions is clicked, swallow the whole thing
stopCardActionClick = (e) => {
  e.stopPropagation();
};

 openZoom = (event) => {
  event.preventDefault();
  event.stopPropagation();

  const id = event.currentTarget.dataset.id;
  const index = (this.pageImages || []).findIndex(p => String(p.id) === String(id));

  console.log(`🔍 Zoom requested for page ID: ${id}`);
  if (index !== -1) {
    this.zoomedPage = this.pageImages[index];
    this.isZoomOpen = true;
    console.log(`✅ Zoom modal opened for page ${this.zoomedPage.pageNumber} (${this.zoomedPage.zoomoutClass})`);
  } else {
    console.warn(`⚠️ Page with ID ${id} not found for zoom.`);
  }
};

  goToPreviousPage() {
    const currentIndex = this.pageImages.findIndex(
      (p) => p.id === this.zoomedPage.id
    );
    if (currentIndex > 0) {
      this.zoomedPage = this.pageImages[currentIndex - 1];
      this.resetZoomPosition(); // 🔁 Reset zoom and drag
    }
  }

  goToNextPage() {
    const currentIndex = this.pageImages.findIndex(
      (p) => p.id === this.zoomedPage.id
    );
    if (currentIndex < this.pageImages.length - 1) {
      this.zoomedPage = this.pageImages[currentIndex + 1];
      this.resetZoomPosition(); // 🔁 Reset zoom and drag
    }
  }

  get zoomModalClass() {
    return this.zoomedPage
      ? `zoom-modal ${this.zoomedPage.zoomoutClass}`
      : "zoom-modal";
  }

  resetZoomPosition() {
    this.zoomLevel = 1;
    this.imgOffsetZoom = { x: 0, y: 0 };
  }

  closeZoom() {
    this.isZoomOpen = false;
    this.zoomedPage = null;
    this.resetZoomPosition();
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  handleReset() {
    this.pageImages = [];
    this.isZoomOpen = false;
    this.zoomImageUrl = "";
    this.isFileUploaded = false;

    // ✅ Clear zoom-related and upload-related state
    this.zoomedPage = null;
    this.zoomLevel = 1;
    this.imgOffsetZoom = { x: 0, y: 0 };
    this.dragStartZoom = { x: 0, y: 0 };
    this.base64FileData = null;
    this.fileName = "";
    this.templateName = "";
    this.templateDocumentType = "";
    this.uploadedFiles = [];
  }

  batchCounter = 0; // unique index per uploaded file
  colorClasses = [
    "batch-color-1",
    "batch-color-2",
    "batch-color-3",
    "batch-color-4"
  ]; // expand as needed
  @track isTemplateAddModalOpen = false;
  @track documentTypeOptions = [];
  @track isFileExpand = false;
  openAddTemplateModal() {
    console.log("📨 opening template...");
    this.isTemplateAddModalOpen = true;
    this.edittemplate = false;
  }
  openTemplateModal() {
    this.isTemplateModalOpen = true;
    this.loadTemplates();
  }
  createTemplate() {
    this.isCreateOptionsModalOpen = true;
    this.isTemplateModalOpen=false;
  }

  cancelcreateTemplate() {
    this.isTemplateModalOpen = true;
    this.isTemplateCreate = false;
  }
  closeAddTemplateModal() {
    this.isTemplateAddModalOpen = false;
    this.templateName = "";
    this.templateDocumentType = "";
    this.templateFile = null;
    this.isEditingTemplate = false;
    this.editingTemplateId = null;
    this.convertedPdfUrl = null;
    // Clear file upload state
    this.base64FileData = null;
    this.fileName = "";
    this.fileType = "";
    this.fileSize = null;
    this.selectedFilesToUpload = null;
    this.myFile = null;
    this.fileReaderObj = null;
    this.isFileAttached = false;
    this.isattachError = false;
    this.uploadedFiles = [];
    this.showSpinner = false;
    this.fileuploaded=false;

    // Optional: reset file input element if needed
    const fileInput = this.template.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = null;
    }
  }

  handleTemplateNameChange(event) {
    this.templateName = event.target.value;
  }

  handleDocumentTypeChange(event) {
    this.templateDocumentType = event.target.value;
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    this.templateFile = file;
    console.log("📄 Selected file:", file.name);
  }
  @track convertedPdfUrl = null;

  submitTemplate() {
    console.log("📨 Submitting template...");

      console.log('convertedPdfUrl:', this.convertedPdfUrl);
  console.log('uploadedFiles:', this.uploadedFiles);
  console.log('uploadedFiles length:', this.uploadedFiles?.length);
  console.log('base64FileData:', this.base64FileData);

    const hasPdfFile = this.base64FileData && this.uploadedFiles?.length > 0;
    const hasConvertedUrl =
      this.convertedPdfUrl && this.uploadedFiles?.length > 0;

    if (!hasPdfFile && !hasConvertedUrl) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Missing File",
          message: "Please upload a file before submitting the template.",
          variant: "error"
        })
      );
      return;
    }

    if (!this.templateName || !this.templateDocumentType) {
      console.warn(
        "⚠️ Missing required fields: Template Name or Document Type"
      );
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Both Template Name and Document Type are required.",
          variant: "error"
        })
      );
      return;
    }

    const isEdit = this.isEditingTemplate;
    const templateId = this.editingTemplateId;

    console.log(
      `🛠️ Operation: ${isEdit ? "Edit existing template" : "Create new template"}`
    );
    console.log("📝 Template Name:", this.templateName);
    console.log("📄 Document Type:", this.templateDocumentType);

    const operation = isEdit
      ? updateTemplate({
          templateId,
          name: this.templateName,
          type: this.templateDocumentType
        })
      : createTemplate({
          name: this.templateName,
          type: this.templateDocumentType,
          orgId: this.orgid
        });

    let newTemplateId;

    operation
      .then((result) => {
        newTemplateId = isEdit ? templateId : result;

        console.log(
          `✅ Template ${isEdit ? "updated" : "created"} successfully. ID:`,
          newTemplateId
        );

        if (hasConvertedUrl) {
          // 🟦 Save AWS PDF URL from Word conversion directly
          console.log(
            "🌐 Updating template with AWS PDF URL:",
            this.convertedPdfUrl
          );
          if (this.edittemplate) {
         this.deleteFile(this.key);
        }
          return updateTemplate({
            templateId: newTemplateId,
            name: this.templateName,
            type: this.templateDocumentType,
            awsUrl: this.convertedPdfUrl, // ✅ Ensure APEX supports this param
            Awsjson:  JSON.stringify(this.uploadedFiles) 
          });
        } /* else if (hasPdfFile) {
          // 🟨 Upload PDF file as base64
          console.log("📎 Preparing to upload file:", this.fileName);
          return uploadFile({
            base64: JSON.stringify(this.base64FileData),
            filename: this.fileName,
            recordId: newTemplateId,
            obj: "ParticipantTemplate"
          })
            .then(() => {
              console.log(
                "✅ File uploaded successfully for template:",
                newTemplateId
              );
            })
            .catch((error) => {
              console.error("❌ File upload failed:", error);
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "File Upload Failed",
                  message: "The template was saved, but file upload failed.",
                  variant: "warning"
                })
              );
              return Promise.reject(error);
            });
        } */ else {
          console.log("ℹ️ No file to upload or AWS URL to save.");
          return Promise.resolve();
        }
      })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: isEdit ? "Updated" : "Success",
            message: isEdit
              ? "Template updated successfully!"
              : "Template created successfully!",
            variant: "success"
          })
        );
        console.log(
          "🎉 Template process complete. Closing modal and refreshing list."
        );
        this.closeAddTemplateModal();
        return refreshApex(this.wiredTemplatesResult);
      })
      .then(() => {
        console.log("🔄 Template list refreshed.");
      })
      .catch((error) => {
        console.error("❌ Error during template submission flow:", error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: error?.body?.message || "Failed to submit template.",
            variant: "error"
          })
        );
      });
  }


 
handleDeleteTemplate(event) {
    const documentId = event
        .currentTarget
        .dataset
        .id;
    const key = event
        .currentTarget
        .dataset
        .key;
    const documentName = event
        .currentTarget
        .dataset
        .name;
    this.openConfirmation('deleteDocument', documentId, documentName, key);
}


  
  // handleDeleteTemplate2(event) {
  //   const templateId = event.currentTarget.dataset.id;
  //   const key = event.currentTarget.dataset.key;
  //   console.log('key',key);
    
  //   deleteRecord(templateId)
  //     .then(() => {
  //       this.dispatchEvent(
  //         new ShowToastEvent({
  //           title: "Deleted",
  //           message: "Template deleted successfully.",
  //           variant: "success"
  //         })
  //       );
  //       this.deleteFile(key);
  //       refreshApex(this.wiredTemplatesResult1); // Refresh the table
  //     })
  //     .catch((error) => {
  //       console.error("❌ Delete error:", error);
  //       this.dispatchEvent(
  //         new ShowToastEvent({
  //           title: "Error",
  //           message: "Failed to delete template.",
  //           variant: "error"
  //         })
  //       );
  //     });
  // }

  handleDeleteTemplate2(event) {

    this.openConfirmation(

        'delete',

        event.currentTarget.dataset.id,

        event.currentTarget.dataset.name,

        event.currentTarget.dataset.key

    );
}

   triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  } 

  onFileUpload(event) {
    this.isattachError = false;
    this.isFileAttached = true;

    if (event.target.files.length > 0) {
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.file.name.split(" ").join("");
      const extension = this.fileName.split(".").pop().toLowerCase();

      if (extension === "pdf") {
        // Normal base64 process
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          this.base64FileData = base64data.substr(base64data.indexOf(",") + 1);
          this.uploadedFiles = [{ name: this.fileName }];
        };
        reader.readAsDataURL(this.file);
      } else if (extension === "doc" || extension === "docx") {
        // Convert via API
        this.convertWordToPdfupload(this.file, this.fileName)
          .then((awsUrl) => {
            this.convertedPdfUrl = awsUrl; // Save AWS URL for record update
            this.uploadedFiles = [{ name: this.fileName }];
          })
          .catch((error) => {
            console.error("❌ Word-to-PDF conversion failed:", error);
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Conversion Error",
                message: "Failed to convert Word document. Try again.",
                variant: "error"
              })
            );
          });
      } else {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Unsupported File",
            message: "Only PDF and Word documents are allowed.",
            variant: "error"
          })
        );
      }
    }
  }
  async convertWordToPdfupload(file, fileName) {
    console.log("📥 Starting Word to PDF conversion...");
    console.log("📄 File name:", fileName);

    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64WordFile = reader.result.split(",")[1];

          if (!base64WordFile) {
            console.error("❌ Failed to extract base64 content.");
            return reject("Base64 extraction failed");
          }

          console.log("🔗 Sending conversion request to API...");
          const requestPayload = {
            recordId: this.orgid || "NA",
            base64WordFile,
            fileName
          };
          console.log(
            "📤 Payload:",
            JSON.stringify(requestPayload).substring(0, 1000)
          ); // Truncated

          const response = await fetch(
            "https://tesseractapps.com/word-to-pdf",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestPayload)
            }
          );

          const data = await response.json();
          console.log("📥 API Response:", data);

          if (data && data.pdfUrl) {
            console.log("✅ Conversion successful. PDF URL:", data.pdfUrl);
            resolve(data.pdfUrl);
          } else {
            console.error("❌ Invalid response from conversion API:", data);
            reject("Invalid conversion response");
          }
        } catch (err) {
          console.error("❌ Error during Word-to-PDF conversion:", err);
          reject(err);
        }
      };

      reader.onerror = (e) => {
        console.error("❌ FileReader failed to load file:", e);
        reject("FileReader failed");
      };

      try {
        reader.readAsDataURL(file);
        console.log("📚 FileReader started reading file...");
      } catch (e) {
        console.error("❌ FileReader crashed:", e);
        reject("FileReader exception");
      }
    });
  }

  @track uploadedFiles = [];
  @track showSpinner = false;

  @track popPreviewPages = [];
  @track isPopPdfPreviewOpen = false;
  @track popSelectedTemplateName = "";
  @track popSelectedDocumentType = "";

  @track selectedUrl;
  @track selectedPlaceholders;
@track selectedTemplateName = '';

@track isModalOpen = false;
@track selectedTemplate = null;

// handleViewTemplate1(event) {
//     try {
//         const payload = JSON.parse(event
//             .currentTarget
//             .dataset
//             .template);
//         console.log('Template payload:', payload);
//         this.selectedTemplate = payload;
//         // NEW
//         this.selectedTemplateName = payload.name || 'Template Preview';
//         // PDF URL
//         this.currentUrl = payload.url;
//         console.log('PDF URL:', this.currentUrl);
//         this.createtemplatesFlag = false;
//         this.isModalOpen = true;
//     } catch (error) {
//         console.error('Error opening template', error);
//     }
// }

handleViewTemplate1(event) {
    try {
        const source = event
            .currentTarget
            .dataset
            .source;
        const payload = JSON.parse(event
            .currentTarget
            .dataset
            .template);
        console.log('Template payload:', payload);
        // Close archive popup only
        if (source === 'archive') {
            this.showArchiveTemplatesModal = false;
        }
        this.selectedTemplate = payload;
        this.selectedTemplateName = payload.name || payload.Template_Name__c || 'Template Preview';
        this.currentUrl = payload.url || payload.Amazon_Url__c;
        console.log('PDF URL:', this.currentUrl);
        this.createtemplatesFlag = false;
        this.isModalOpen = true;
    } catch (error) {
        console.error('Error opening template', error);
    }
}



closePdfPreview() {
    this.isModalOpen = false;
    this.currentUrl = '';
    this.selectedTemplate = null;
    this.selectedTemplateName = '';
    this.handleCreatedTemplates();
    console.log('PDF preview closed');
}


handleEditTemplate(event) {

    this.selectedTemplate         = event.currentTarget.dataset.template;
    this.isCreateOptionsModalOpen = true;
    this.isTemplateCreate         = true;
    this.isTemplateModalOpen      = false;
}

handleViewTemplateFromChild() {
    this.createtemplatesFlag      = true;
    this.templatesFlag            = false;
    this.isTemplateModalOpen      = true;
    this.isCreateOptionsModalOpen = false;
    this.selectedTemplate         = null;
    refreshApex(this.wiredTemplatesResult1);
    console.log('child fired');
}

  @track isLoading1 = false;
  async popRenderPdfAsImages(pdfUrl) {
    this.popPreviewPages = [];
    this.isLoading1 = true;

    try {
      const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const pageImages = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL();

        pageImages.push({
          pageNumber: i,
          dataUrl: dataUrl,
          altText: `Page ${i}`
        });
      }

      this.popPreviewPages = pageImages;
      console.log(`📄 Rendered ${pageImages.length} pages`);
    } catch (err) {
      console.error("❌ PDF render failed:", err);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Failed to render PDF.",
          variant: "error"
        })
      );
    } finally {
      this.isLoading1 = false;
    }
  }

  closePopPdfViewer() {
    this.isPopPdfPreviewOpen = false;
    this.popPreviewPages = [];
  }



  handleViewTemplate(event) {
  const templateId = event.currentTarget.dataset.id;
  const selectedTemplate = this.templateList.find((t) => t.id === templateId);

  if (!selectedTemplate || !selectedTemplate.AWS_Document__c) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: "No document available for this template.",
        variant: "error"
      })
    );
    return;
  }

  const url = selectedTemplate.AWS_Document__c;
  const lowerUrl = (url || "").toLowerCase();

if (lowerUrl.endsWith(".docx")) {
  this.selectedTemplate = selectedTemplate;
  this.selectedDocxUrl = url;

  // ✅ USE KEY FROM Aws_Json__c
  this.editingTemplateId = selectedTemplate.id;
  this.selectedAwsKey = selectedTemplate.awsKey || null;

  console.log(
    '🟡 Opening Word Editor',
    'templateId=', selectedTemplate.id,
    'awsKey=', this.selectedAwsKey
  );

  this.isPopPdfPreviewOpen = false;
  this.isTemplateModalOpen = false;
  this.isTemplateCreate = false;

  this.isWordEditorOpen = true;
  return;
}


  // ✅ PDF → unchanged
  if (lowerUrl.endsWith(".pdf")) {
    this.popSelectedTemplateName = selectedTemplate.name;
    this.popSelectedDocumentType = selectedTemplate.documentType;
    this.isPopPdfPreviewOpen = true;
    this.popRenderPdfAsImages(url);
    return;
  }

  // ❌ Unsupported
  this.dispatchEvent(
    new ShowToastEvent({
      title: "Unsupported File",
      message: "Only PDF and DOCX templates are supported.",
      variant: "warning"
    })
  );
}

  @track isPdfViewerVisible1 = false;

  closePdfViewer1() {
    this.isPdfViewerVisible1 = false;
    this.pdfViewerUrl1 = "";
  }

  refreshTemplates() {
    console.log("🔄 Refreshing templates...");
    if (this.wiredTemplatesResult) {
      this.showSpinner = true;
      refreshApex(this.wiredTemplatesResult)
        .then(() => {
          console.log("✅ Templates refreshed successfully");
        })
        .catch((error) => {
          console.error("❌ Error refreshing templates:", error);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error",
              message: "Failed to refresh template list.",
              variant: "error"
            })
          );
        })
        .finally(() => {
          this.showSpinner = false;
        });
    } else {
      console.warn("⚠️ No wired result to refresh.");
    }
  }

  wiredTemplatesResult; // track the wire result
  wiredTemplatesResult1;


async loadSavedTemplates() {
    console.log('📡 getSavedTemplates() called');
    try {
        const data = await getSavedTemplates({orgId: this.orgid});
        console.log('Participant Templates:', JSON.stringify(data));
        this.templateList = data.map((t) => {
           // Format CreatedDate → dd/mm/yyyy hh:mm AM/PM
            const formattedDate =
                t.CreatedDate
                    ? new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }).format(new Date(t.CreatedDate))
                    : '';

            return {
                id: t.Id,
                name: t.File_Name__c || '',
                templateName: t.Template_Name__c || '',
                recipientName: t.RecipientName || '',
                clientEmail: t.ClientEmail || '',
                createdByName: t.CreatedBy || '',
                createdByInitials: t.CreatedBy
                    ? t
                        .CreatedBy
                        .split(' ')
                        .filter(Boolean)
                        .map(x => x[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : '',
                createdDate: formattedDate,
                status: t.Status__c || '',
                AWS_Document__c: t.AWS_Document__c || '',
                organizationId: t.Organization__c || '',
                templateId: t.Template__c || '',
                hideActions: t.Status__c === 'Pending' || t.Status__c === 'Completed',
                completedIcons: t.Status__c === 'Completed',
                additionalRecipients: t.AdditionalRecipients || '',
                awsKey: t.AWS_Document__c ?. split('/').pop()
            };
        });
        console.log('Mapped Template List:', JSON.stringify(this.templateList));
        this.templateListFiltered = [...this.templateList];
        this.templatePageNumber = 1;
        this.templateListTotalRecords = this.templateListFiltered.length;
        this.templateTotalPages = Math.ceil(this.templateListTotalRecords / this.templatePageSize);
        this.updateTemplatePagination();
    } catch (error) {
        console.error('❌ Error fetching Participant Templates:', JSON.stringify(error));
        this.templateList = [];
        this.templateListFiltered = [];
        this.templateListTotalRecords = 0;
        this.templateTotalPages = 0;
    }
}



@wire(getAllTemplates, {orgId: '$orgid'})
wiredTemplates(result) {
    console.log('📡 Wire called');
    this.wiredTemplatesResult1 = result;
    const {data, error} = result;
    if (data) {
        this.createdTemplateList = data.map(template => {
            const status = (template.Status__c || '').toLowerCase();
            // Created By
            const createdByName = template.CreatedBy ?. Full_Name__c || '';
            const createdByInitials = createdByName
                ? createdByName
                    .split(' ')
                    .filter(Boolean)
                    .map(word => word[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : '';

            const createdDate = template.CreatedDate
                ? new Intl.DateTimeFormat('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).format(new Date(template.CreatedDate))
                : '';

            return {
                ...template,
                // NEW
                createdByName,
                createdByInitials,
                createdDate,
                viewPayload: JSON.stringify(
                    {templateId: template.Id, url: template.Amazon_Url__c, placeholders: template.Placeholder_JSON__c, isReadOnly: true, name: template.Template_Name__c}
                ),
                editPayload: JSON.stringify(
                    {
                        templateId: template.Id,
                        url: template.Amazon_Url__c,
                        placeholders: template.Placeholder_JSON__c,
                        name: template.Template_Name__c,
                        description: template.Description__c,
                        type: template.Template_Type__c,
                        status: template.Status__c,
                        isReadOnly: false
                    }
                ),
                showArchive: status === 'draft' || status === 'publish',
                showSendDocument: status === 'publish',
                showUnarchive: status === 'archive',
                hasMenu: status === 'draft' || status === 'publish' || status === 'archive',
                isMenuOpen: false
            };
        });
        console.log('createdTemplateList', JSON.stringify(this.createdTemplateList));
        this.createdTemplatePageNumber = 1;
        this.createdTemplateTotalRecords = this.createdTemplateList.length;
        this.createdTemplateTotalPages = Math.ceil(this.createdTemplateTotalRecords / this.createdTemplatePageSize);
        this.updateCreatedTemplatePagination();
    } else if (error) {
        console.error('❌ Error loading templates:', error);
        this.createdTemplateList = [];
        this.createdTemplatePageNumber = 1;
        this.createdTemplateTotalRecords = 0;
        this.createdTemplateTotalPages = 0;
    }
}


  updateTemplatePagination() {
    const search = this.searchKeyword.toLowerCase();

    const filtered = this.templateListFiltered.filter((tpl) => {
      return (
        tpl.name?.toLowerCase().includes(search) ||
        tpl.documentType?.toLowerCase().includes(search)
      );
    });

    this.templateListTotalRecords = filtered.length;
    this.templateTotalPages = Math.ceil(
      this.templateListTotalRecords / this.templatePageSize
    );

    const start = (this.templatePageNumber - 1) * this.templatePageSize;
    const end = start + this.templatePageSize;
    this.templateListPaginated = filtered.slice(start, end);

    this.disableTemplateFirst = this.templatePageNumber === 1;
    this.disableTemplateLast =
      this.templatePageNumber === this.templateTotalPages;
  }



  handleTemplateFirst() {
    this.templatePageNumber = 1;
    this.updateTemplatePagination();
  }

  handleTemplatePrevious() {
    if (this.templatePageNumber > 1) {
      this.templatePageNumber--;
      this.updateTemplatePagination();
    }
  }

  handleTemplateNext() {
    if (this.templatePageNumber < this.templateTotalPages) {
      this.templatePageNumber++;
      this.updateTemplatePagination();
    }
  }

  handleTemplateLast() {
    this.templatePageNumber = this.templateTotalPages;
    this.updateTemplatePagination();
  }
// updateCreatedTemplatePagination() {
//     const search = (this.searchCreatedKeyword || '').toLowerCase().trim();
//     const filtered = this.createdTemplateList.filter((tpl) => {
//         return(tpl.Template_Name__c ?. toLowerCase().includes(search) || tpl.Template_Type__c ?. toLowerCase().includes(search) || tpl.createdByName ?. toLowerCase().includes(search) || tpl.Status__c ?. toLowerCase().includes(search));
//     });
//     this.createdTemplateTotalRecords = filtered.length;
//     this.createdTemplateTotalPages = Math.max(1, Math.ceil(this.createdTemplateTotalRecords / this.createdTemplatePageSize));
//     if (this.createdTemplatePageNumber > this.createdTemplateTotalPages) {
//         this.createdTemplatePageNumber = this.createdTemplateTotalPages;
//     }
//     if (this.createdTemplatePageNumber < 1) {
//         this.createdTemplatePageNumber = 1;
//     }
//     const start = (this.createdTemplatePageNumber - 1) * this.createdTemplatePageSize;
//     const end = start + this.createdTemplatePageSize;
//     this.createdTemplateListPaginated = filtered.slice(start, end).map(tpl => ({
//         ...tpl,
//         isMenuOpen: this.openMenuRowId === tpl.Id
//     }));
//     this.disableCreatedTemplateFirst = this.createdTemplatePageNumber === 1;
//     this.disableCreatedTemplateLast = this.createdTemplatePageNumber === this.createdTemplateTotalPages;
// }

updateCreatedTemplatePagination() {
    const search = (this.searchCreatedKeyword || '').toLowerCase().trim();

    const filtered = this.createdTemplateList.filter((tpl) => {

        const matchesSearch =
            !search ||
            tpl.Template_Name__c?.toLowerCase().includes(search) ||
            tpl.Template_Type__c?.toLowerCase().includes(search) ||
            tpl.createdByName?.toLowerCase().includes(search) ||
            tpl.Status__c?.toLowerCase().includes(search);

        const matchesType =
            !this.selectedType ||
            (tpl.Template_Type__c || '').toLowerCase() ===
                this.selectedType.toLowerCase();

        const matchesStatus =
            !this.selectedStatus ||
            (tpl.Status__c || '').toLowerCase() ===
                this.selectedStatus.toLowerCase();

        return matchesSearch && matchesType && matchesStatus;
    });

    this.createdTemplateTotalRecords = filtered.length;

    this.createdTemplateTotalPages = Math.max(
        1,
        Math.ceil(this.createdTemplateTotalRecords / this.createdTemplatePageSize)
    );

    if (this.createdTemplatePageNumber > this.createdTemplateTotalPages) {
        this.createdTemplatePageNumber = this.createdTemplateTotalPages;
    }

    if (this.createdTemplatePageNumber < 1) {
        this.createdTemplatePageNumber = 1;
    }

    const start = (this.createdTemplatePageNumber - 1) * this.createdTemplatePageSize;
    const end = start + this.createdTemplatePageSize;

    this.createdTemplateListPaginated = filtered.slice(start, end).map(tpl => ({
        ...tpl,
        isMenuOpen: this.openMenuRowId === tpl.Id
    }));

    this.disableCreatedTemplateFirst =
        this.createdTemplatePageNumber === 1;

    this.disableCreatedTemplateLast =
        this.createdTemplatePageNumber === this.createdTemplateTotalPages;
}


  handleCreatedTemplateFirst() {
    this.createdTemplatePageNumber = 1;
    this.updateCreatedTemplatePagination();
  }

  handleCreatedTemplatePrevious() {
    if (this.createdTemplatePageNumber > 1) {
      this.createdTemplatePageNumber--;
      this.updateCreatedTemplatePagination();
    }
  }

  handleCreatedTemplateNext() {
    if (this.createdTemplatePageNumber < this.createdTemplateTotalPages) {
      this.createdTemplatePageNumber++;
      this.updateCreatedTemplatePagination();
    }
  }

  handleCreatedTemplateLast() {
    this.createdTemplatePageNumber = this.createdTemplateTotalPages;
    this.updateCreatedTemplatePagination();
  }

  @wire(getObjectInfo, { objectApiName: PARTICIPANT_TEMPLATE_OBJECT })
  objectInfo;

  // Get picklist values based on recordTypeId
  @wire(getPicklistValues, {
    recordTypeId: "$objectInfo.data.defaultRecordTypeId",
    fieldApiName: DOCUMENT_TYPE_FIELD
  })
  picklistValues({ data, error }) {
    if (data) {
      this.documentTypeOptions = data.values
        .filter((val) => val.value !== "Created Template") // ❌ Exclude this value
        .map((val) => ({
          label: val.label,
          value: val.value
        }));
    } else if (error) {
      console.error("❌ Error loading picklist values:", error);
    }
  }

  @track isCreateOptionsModalOpen = false;
  @track isTemplatePickerOpen = false;
  @track selectedTemplateUrls = [];

  handleStartFromScratch() {
    this.isCreateOptionsModalOpen = false;
    this.isTemplateCreate = true;
    this.isTemplateModalOpen = false;
  }

  openTemplatePicker() {
    this.isCreateOptionsModalOpen = false;
    this.isTemplatePickerOpen = true;
    this.selectedTemplateUrls = [];
  }

  closeTemplatePicker() {
    this.isTemplatePickerOpen = false;
  }

  closeCreateOptionsModal() {
    this.isCreateOptionsModalOpen = false;
  }

  handleTemplateCheckboxChange(event) {
    const url = event.target.dataset.url;
    if (event.target.checked) {
      this.selectedTemplateUrls = [...this.selectedTemplateUrls, url];
    } else {
      this.selectedTemplateUrls = this.selectedTemplateUrls.filter(
        (u) => u !== url
      );
    }
  }

  async handleLoadSelectedTemplates() {
    if (!this.selectedTemplateUrls.length) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "No Templates Selected",
          message: "Please select at least one template to load.",
          variant: "error"
        })
      );
      return;
    }

    this.isTemplatePickerOpen = false;
    this.isTemplateCreate = true;
    this.isTemplateModalOpen = false;
    this.isFileUploaded = true;

    // Process each selected template as a URL
    for (let i = 0; i < this.selectedTemplateUrls.length; i++) {
      await this.processPdf(this.selectedTemplateUrls[i], this.batchCounter++);
    }
  }
handleTemplateSelect(event) {
  const selectedId = event.target.value;
  const isChecked = event.target.checked;

  // If unchecked, clear selection
  if (!isChecked) {
    this.selectedTemplateId = null;
    return;
  }

  // Enforce single selection (radio-button behavior)
  this.selectedTemplateId = selectedId;

  // Uncheck other checkboxes
  const checkboxes = this.template.querySelectorAll(
    'lightning-input[type="checkbox"]'
  );
  checkboxes.forEach(cb => {
    if (cb.value !== selectedId) {
      cb.checked = false;
    }
  });

  console.log('✅ Selected template ID:', this.selectedTemplateId);
}



handleLoadSelectedTemplatesTemp() {
  // 1️⃣ Validate selection
  if (!this.selectedTemplateId) {
    this.showToast(
      'No Template Selected',
      'Please select one Word template to load.',
      'warning'
    );
    return;
  }

  // 2️⃣ Find template record
  const template = this.templateList.find(
    t => t.id === this.selectedTemplateId
  );

  if (!template) {
    this.showToast('Error', 'Selected template not found.', 'error');
    return;
  }

  // 3️⃣ Validate DOCX URL (FIXED)
  if (!template.AWS_Document__c) {
    this.showToast(
      'Invalid Template',
      'This template does not have a Word document.',
      'error'
    );
    return;
  }

  // 4️⃣ Store selection
  this.selectedTemplate = template;
  this.selectedDocxUrl = template.AWS_Document__c;

  // 5️⃣ Close modal, open Word editor
  this.isTemplateModalOpen = false;
  this.isWordEditorOpen = true;
  this.isTemplatePickerOpen = false;

  console.log('📄 Loading Word template:', this.selectedDocxUrl);
}



  @track templatesFlag = true;
  @track createtemplatesFlag = false;

  get templatesClass() {
    return this.templatesFlag || this.orgeditflag ? "menu-item1" : "menu-item";
  }
  get createtemplatesClass() {
    return this.createtemplatesFlag || this.orgeditflag
      ? "menu-item1"
      : "menu-item";
  }

async handleTemplates() { // Clear modal
    this.isModalOpen = false;
    this.currentUrl = '';
    this.selectedTemplateName = '';
    this.templatesFlag = true;
    this.createtemplatesFlag = false;
    // clear cache
    this.templateList = [];

    this.templateListPaginated = [];
    await this.loadSavedTemplates();
    localStorage.setItem('activeHrTemplatesTab', 'hrMyTemplates');
}
handleCreatedTemplates(event) { // Clear modal
    this.isModalOpen = false;
    this.currentUrl = '';
    this.selectedTemplateName = '';
    this.createtemplatesFlag = true;
    this.templatesFlag = false;

    localStorage.setItem('activeHrTemplatesTab', 'hrCreatedTemplates');
}


  @track isPdfMetaModalOpen = false;
  @track templateName = "";
  @track base64FileData;
  @track fileName;

  closePdfMetaModal() {
    this.isPdfMetaModalOpen = false;
    this.fileName = '';
    this.url='';
    this.deleteFile(this.key);
    this.key=''; 
  }

  async saveGeneratedPdf() {
    // Use fallback if templateDocumentType is missing
    const selectedType =
      this.templateDocumentType?.trim() || "Created Template";

    if (!this.templateName?.trim()) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Missing Info",
          message: "Please enter the Template Name.",
          variant: "warning"
        })
      );
      return;
    }

    this.isPdfMetaModalOpen = false;
    this.isLoading = true;

    try {
      // 1. Create new ParticipantTemplate record via Apex
      const newTemplateId = await createTemplate({
        name: this.templateName.trim(),
        type: selectedType,
        orgId: this.orgid,
        url: this.url,
        awsjson: JSON.stringify(this.uploadedFiles) 
      });

      // 2. Upload the PDF to AWS with reference to that record
    /*   await uploadFile({
        base64: JSON.stringify(this.base64FileData),
        filename: this.fileName,
        recordId: newTemplateId,
        obj: "ParticipantTemplate"
      });
 */
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Template created successfully.",
          variant: "success"
        })
      );

      // 🧼 Cleanup state
      this.pageImages = [];
      this.isFileUploaded = false;
      this.zoomedPage = null;
      this.isZoomOpen = false;
      this.base64FileData = null;
      this.fileName = "";

      // 🧼 Reset modal-related state
      this.templateName = "";
      this.templateDocumentType = "";
      this.isTemplateCreate = false;
      this.isTemplateModalOpen = true;

      // 🔁 Refresh template list if applicable
      this.refreshTemplates?.();
    } catch (err) {
      console.error("Upload Failed:", err);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Upload Failed",
          message: err.body?.message || err.message,
          variant: "error"
        })
      );
    } finally {
      this.isLoading = false;
    }
  }

  async addTextToImage(pageImage, textToAdd) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = pageImage.dataUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Add text overlay
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(textToAdd, 50, 50); // Adjust position and styling as needed

        const newDataUrl = canvas.toDataURL("image/png");

        resolve({
          ...pageImage,
          dataUrl: newDataUrl
        });
      };
    });
  }
  @track overlayText = "";

  handleOverlayTextChange(event) {
    this.overlayText = event.target.value;
  }

  async applyTextToZoomedPage() {
    if (!this.zoomedPage || !this.overlayText) return;

    const editedPage = await this.addTextToImage(
      this.zoomedPage,
      this.overlayText
    );

    const index = this.pageImages.findIndex((p) => p.id === this.zoomedPage.id);
    if (index !== -1) {
      this.pageImages[index] = editedPage;
      this.pageImages = [...this.pageImages]; // trigger re-render
      this.zoomedPage = editedPage;
      this.overlayText = ""; // Reset input
    }
  }

  @track selectedType = '';
@track selectedStatus = '';

  @track searchKeyword = "";
  @track searchCreatedKeyword = "";
  handleSearchChange(event) {
    this.searchKeyword = event.target.value;
    this.templatePageNumber = 1;
    this.updateTemplatePagination();
  }

  handleCreatedSearchChange(event) {
    this.searchCreatedKeyword = event.target.value;
    this.createdTemplatePageNumber = 1;
    this.updateCreatedTemplatePagination();
  }

get statusOptions() {
    return [
        { label: 'All', value: '' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Publish', value: 'Publish' }
    ];
}

get typeOptions() {
    return [
        { label: 'All', value: '' },
        { label: 'Staff', value: 'Staff' },
        { label: 'Participant', value: 'Participant' },
        { label: 'Organisation', value: 'Organisation' }
    ];
}

handleTypeChange(event) {
    this.selectedType = event.detail.value;
    this.createdTemplatePageNumber = 1;
    this.updateCreatedTemplatePagination();
}

handleStatusChange(event) {
    this.selectedStatus = event.detail.value;
    this.createdTemplatePageNumber = 1;
    this.updateCreatedTemplatePagination();
}


onFindChange = (e) => { this.findText = e.target.value; };
onReplaceChange = (e) => { this.replaceText = e.target.value; };



async renderPdfPreview(maxPages = 1, scale = 1.25, targetPages /* optional: [1,3,...] */) {
  // accept either a live pdfDoc or raw bytes
  if (!this.pdfJsReady || (!this.pdfDoc && !this.pdfArrayBuffer)) {
    console.warn('[renderPdfPreview] Not ready', {
      pdfJsReady: this.pdfJsReady, hasDoc: !!this.pdfDoc, hasBytes: !!this.pdfArrayBuffer
    });
    return;
  }
// Cache the viewport so we can convert CSS -> PDF later
this._pageViewports ||= new Map();
this._pageViewports.set(pageNum, viewport);

  // remember settings
  this.previewPageCount = maxPages;
  this.previewScale = scale;

  const host = this.template.querySelector('[data-ref="viewer"]');
  if (!host) {
    console.warn('[renderPdfPreview] viewer host not found');
    return;
  }

  // clean previous overlays & content
  this._cleanupSnipOverlays?.();
  host.innerHTML = '';

  // prefer existing doc; fallback to bytes
  const doc = this.pdfDoc
    || await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise;

  const isSnip = !!this.snipMode;

  // Decide which pages to render
  const total = doc.numPages;
  const pageCount = Math.min(maxPages, total);
  let pagesToRender;
  if (Array.isArray(targetPages) && targetPages.length) {
    // sanitize page numbers
    pagesToRender = targetPages
      .map(n => Math.max(1, Math.min(total, parseInt(n, 10) || 1)));
  } else {
    pagesToRender = Array.from({ length: pageCount }, (_, k) => k + 1);
  }

  // ⭐ cache viewports for CSS→PDF coordinate conversion
  this._pageViewports = this._pageViewports || new Map();

  console.log('[renderPdfPreview] start', {
    totalPages: total, rendering: pagesToRender, scale, isSnip
  });

  for (const pageNum of pagesToRender) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // remember viewport for this page
    this._pageViewports.set(pageNum, viewport);

    // wrapper
    const wrap = document.createElement('div');
    wrap.className = 'pdf-page';
    wrap.dataset.page = String(pageNum);
    wrap.style.position = 'relative';
    wrap.style.width = `${viewport.width}px`;
    wrap.style.height = `${viewport.height}px`;

    // canvas (z-index 0)
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.ceil(viewport.width * dpr);
    canvas.height = Math.ceil(viewport.height * dpr);
    canvas.style.width  = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top  = '0';
    canvas.style.zIndex = '0';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    wrap.appendChild(canvas);
    host.appendChild(wrap);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // text layer (z-index 1)
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.style.position = 'absolute';
    textLayer.style.inset = '0';
    textLayer.style.zIndex = '1';
    wrap.appendChild(textLayer);

    const textContent = await page.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });
    this._paintTextLayer(textLayer, textContent, viewport);

    // 🔀 Interaction mode
    if (isSnip) {
      // snip mode: overlay captures the pointer, canvas/textLayer are passive
      canvas.style.pointerEvents = 'none';
      textLayer.style.userSelect = 'none';
      textLayer.style.pointerEvents = 'none';

      // index tokens from DOM spans for snip OCR-less extraction
      this._indexPageTokens(pageNum, wrap, textLayer);

      // attach overlay (ensure it’s visually on top)
      const ov = this._attachSnipOverlay(wrap, pageNum);
      if (ov) {
        ov.style.position = 'absolute';
        ov.style.left = '0';
        ov.style.top  = '0';
        ov.style.right = '0';
        ov.style.bottom = '0';
        ov.style.zIndex = '99999';         // higher than textLayer
        ov.style.pointerEvents = 'auto';
        ov.style.cursor = 'crosshair';
        // Optional: faint tint so users see the layer (remove if not desired)
        ov.style.background = 'rgba(0,0,0,0.01)';
      }
    } else {
      // normal mode: allow native text selection
      canvas.style.pointerEvents = 'auto';
      textLayer.style.userSelect = 'text';
      textLayer.style.pointerEvents = 'auto';
      textLayer.addEventListener('mouseup', this._handleSelectionMouseUp);
    }
  }

  console.log('[renderPdfPreview] done');
}



_paintTextLayer(container, textContent, viewport) {
  const transform = window.pdfjsLib.Util.transform; // eslint-disable-line no-undef

  for (const item of textContent.items) {
    const m = transform(viewport.transform, item.transform); // [a,b,c,d,e,f]
    const [a, b, c, d, e, f] = m;

    const span = document.createElement('span');
    span.textContent = item.str;

    span.style.position = 'absolute';
    span.style.transformOrigin = '0 0';
    span.style.transform = `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
    span.style.whiteSpace = 'pre';
    span.style.lineHeight = '1';
    span.style.fontSize = '1px';

    // ⭐ make 100% sure it’s not visible
    span.style.color = 'transparent';
    span.style.webkitTextFillColor = 'transparent';
    span.style.textShadow = 'none';
    span.style.opacity = '1'; // keep 1 so selection highlight shows up

    span.style.userSelect = 'text';

    container.appendChild(span);
  }
}

_getVisiblePageNumber() {
  const host = this.template.querySelector('[data-ref="viewer"]');
  if (!host) return 1;
  const hostRect = host.getBoundingClientRect();
  const pages = Array.from(host.querySelectorAll('.pdf-page'));

  let bestPage = 1, bestArea = -1;
  for (const el of pages) {
    const r = el.getBoundingClientRect();
    const xOverlap = Math.max(0, Math.min(hostRect.right, r.right) - Math.max(hostRect.left, r.left));
    const yOverlap = Math.max(0, Math.min(hostRect.bottom, r.bottom) - Math.max(hostRect.top, r.top));
    const area = xOverlap * yOverlap;
    if (area > bestArea) {
      bestArea = area;
      bestPage = parseInt(el.dataset.page, 10) || 1;
    }
  }
  return bestPage; // 1-based
}


// Fill the Find input with the current selection (trimmed)
_handleSelectionMouseUp = () => {
  const sel = window.getSelection();
  if (!sel) return;
  const s = (sel.toString() || '').replace(/\s+/g, ' ').trim();
  if (!s) return;

  // update reactive state
  this.findText = s;

  // imperatively sync the base component for immediate visual update
  const findInput = this.template.querySelector('[data-ref="find-input"]');
  if (findInput) {
    findInput.value = s;                       // <- ensures the UI shows it right away
    // (optional) if you want your onchange handler to run too:
    // findInput.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: s } }));
  }

  try { sel.removeAllRanges(); } catch (e) { /* no-op */ }
};



rerenderPreview = async () => {
  const pageNum = this.currentEditPage || this._getVisiblePageNumber();
  const scale   = this.previewScale || 1.25;

  console.log('[rerenderPreview] start', { pageNum, scale, snipMode: !!this.snipMode });

  if (!this.pdfJsReady || (!this.pdfDoc && !this.pdfArrayBuffer)) {
    console.warn('[rerenderPreview] Not ready', {
      pdfJsReady: this.pdfJsReady,
      hasDoc: !!this.pdfDoc,
      hasBytes: !!this.pdfArrayBuffer
    });
    this.dispatchEvent(new ShowToastEvent({
      title: 'Warning',
      message: 'PDF is not ready yet.',
      variant: 'warning'
    }));
    return;
  }

  try {
    // If you have a helper to ensure pdfDoc matches the latest bytes, use it.
    if (typeof this._reloadPdfDocFromBytes === 'function') {
      await this._reloadPdfDocFromBytes();
    }

    await this.renderPdfPreview(1, scale, [pageNum]);

    // Refresh the thumbnail in the left grid WITHOUT adding a new card.
    if (typeof this._refreshGridThumbnail === 'function') {
      await this._refreshGridThumbnail(pageNum);
    } else {
      // Fallback: regenerate a bitmap for this page and swap it in pageImages immutably.
      try {
        const updated = await this.renderPageAsImage(pageNum, /*batchIndex*/ 0, pageNum);
        if (updated && updated.dataUrl) {
          // Prefer your index helper if available
          const idx = (typeof this._getGridIndexByPageNumber === 'function')
            ? this._getGridIndexByPageNumber(pageNum)
            : (this.pageImages || []).findIndex(p => parseInt(p.pageNumber, 10) === pageNum);

          if (idx >= 0) {
            const copy = [...this.pageImages];
            const old  = copy[idx];
            copy[idx]  = { ...old, pageNumber: pageNum, dataUrl: updated.dataUrl };
            this.pageImages = copy;
            console.log('[rerenderPreview] thumbnail replaced', { idx, id: old.id, pageNum });
          } else {
            console.warn('[rerenderPreview] no existing thumbnail to replace', { pageNum });
          }
        } else {
          console.warn('[rerenderPreview] renderPageAsImage returned no dataUrl', { pageNum });
        }
      } catch (thumbErr) {
        console.error('[rerenderPreview] thumbnail refresh failed', thumbErr);
      }
    }

    // (Optional) Keep scroll anchored to this page in the modal viewer.
    const host   = this.template.querySelector('[data-ref="viewer"]');
    const target = host?.querySelector(`.pdf-page[data-page="${pageNum}"]`);
    if (target && host) {
      host.scrollTop = target.offsetTop;
      console.log('[rerenderPreview] scrolled to', { pageNum, top: target.offsetTop });
    }

    this.dispatchEvent(new ShowToastEvent({
      title: 'Re-rendered',
      message: `Page ${pageNum} refreshed.`,
      variant: 'success'
    }));
    console.log('[rerenderPreview] done');
  } catch (e) {
    console.error('[rerenderPreview] failed', e);
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error',
      message: e?.message || 'Failed to re-render.',
      variant: 'error'
    }));
  }
};


async applyFindReplace(pdfBytes, needle, replacement, pages /* = undefined */) {
  console.log('[applyFindReplace] helper presence', {
  buildPlainStringWithIndex: typeof this.buildPlainStringWithIndex,
  findAllIndices: typeof this.findAllIndices,
  bboxForRange: typeof this.bboxForRange,
  wrapText: typeof this.wrapText,
  _suffixedName: typeof this._suffixedName,
  _offerDownload: typeof this._offerDownload
});

  console.log('[applyFindReplace] start', {
    hasPdfBytes: !!pdfBytes,
    bytesLen: (pdfBytes && (pdfBytes.byteLength || pdfBytes.length)) || 0,
    needle,
    replacement,
    pages: Array.isArray(pages) ? pages : 'ALL'
  });

  if (!this.pdfJsReady || !this.pdfLibReady) {
    console.error('[applyFindReplace] Libraries not ready', {
      pdfJsReady: this.pdfJsReady,
      pdfLibReady: this.pdfLibReady
    });
    throw new Error('Libraries not ready');
  }
  if (!pdfBytes) {
    console.warn('[applyFindReplace] No input bytes; returning original');
    return pdfBytes;
  }

  const t0 = (performance && performance.now) ? performance.now() : Date.now();

  // eslint-disable-next-line no-undef
  const pdf = await window.pdfjsLib.getDocument({ data: pdfBytes }).promise;
  console.log('[applyFindReplace] PDF loaded', { numPages: pdf.numPages });

  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  const outDoc = await PDFDocument.load(pdfBytes);
  const helv = await outDoc.embedFont(StandardFonts.Helvetica);

  const WHITE = rgb(1,1,1);
  const TEXT_SIZE = 10;
  const PADDING_Y = 1;

  let anyMatch = false;
  let pagesTouched = 0;
  let boxesTotal = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    if (Array.isArray(pages) && !pages.includes(p)) {
      console.log('[applyFindReplace] skip page', p);
      continue;
    }

    console.log('[applyFindReplace] page start', p);
    try {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const pageHeight = viewport.height;
      console.log('[applyFindReplace] viewport', { width: viewport.width, height: viewport.height });

      const content = await page.getTextContent({ normalizeWhitespace: true });
      console.log('[applyFindReplace] text items', { page: p, items: content.items.length });

      const tokens = content.items.map(it => {
        const x = it.transform[4];
        const y = it.transform[5];
        const width  = it.width ?? (it.transform[0] || 0);
        const height = (it.height ?? Math.abs(it.transform[3] || 0)) || TEXT_SIZE * 1.2;
        const fontSize = Math.max(8, Math.min(32, Math.abs(it.transform[0] || TEXT_SIZE)));
        return { text: it.str, x, y, width, height, fontSize };
      });

      const { plain, indexMap } = this.buildPlainStringWithIndex(tokens);
      console.log('[applyFindReplace] plain length', { page: p, len: plain.length, tokens: tokens.length });

      // normalized matching so UI selection matches stream
      const normNeedle = (needle || '').replace(/\s+/g, ' ').trim();
      if (!normNeedle) {
        console.warn('[applyFindReplace] empty normalized needle; aborting find on this page', { page: p });
        continue;
      }
      let normPlain = '';
      const normMap = [];
      let i = 0;
      while (i < plain.length) {
        const ch = plain[i];
        if (/\s/.test(ch)) {
          while (i < plain.length && /\s/.test(plain[i])) i++;
          normPlain += ' ';
          normMap.push(i - 1);
        } else {
          normPlain += ch;
          normMap.push(i++);
        }
      }
      console.log('[applyFindReplace] normalized strings', {
        page: p,
        normNeedle,
        normPlainLen: normPlain.length
      });

      const normMatches = this.findAllIndices(normPlain, normNeedle);
      console.log('[applyFindReplace] match count', { page: p, count: normMatches.length });

      if (!normMatches.length) {
        console.log('[applyFindReplace] no matches; continue', { page: p });
        continue;
      }

      anyMatch = true;
      pagesTouched++;

      const matches = normMatches.map(({ start, end }) => ({
        start: normMap[start],
        end:   normMap[end - 1] + 1
      }));

      const boxes = matches
        .map(({ start, end }) => this.bboxForRange(start, end, tokens, indexMap, pageHeight))
        .filter(Boolean);

      boxesTotal += boxes.length;
      console.log('[applyFindReplace] boxes to draw', { page: p, boxes: boxes.length });

      const outPage = outDoc.getPage(p - 1);
      boxes.forEach((b, idx) => {
        console.log('[applyFindReplace] draw box', { page: p, idx: idx + 1, box: b });
        outPage.drawRectangle({ x: b.x, y: b.y, width: b.w, height: b.h, color: WHITE });

        const lines = this.wrapText(replacement, helv, TEXT_SIZE, b.w);
        console.log('[applyFindReplace] wrapped lines', { page: p, idx: idx + 1, lines });

        let lineY = b.y + b.h - (TEXT_SIZE + PADDING_Y);
        for (const line of lines) {
          outPage.drawText(line, { x: b.x, y: lineY, font: helv, size: TEXT_SIZE });
          lineY -= (TEXT_SIZE * 1.25);
          if (lineY < b.y) {
            console.log('[applyFindReplace] stop drawing lines (overflow)', { page: p, idx: idx + 1 });
            break;
          }
        }
      });
      console.log('[applyFindReplace] page done', { page: p });

    } catch (err) {
      console.error('[applyFindReplace] error on page', p, err);
    }
  }

  if (!anyMatch) {
    console.warn('[applyFindReplace] no matches on selected pages');
    this.showToast('Warning', 'No matching text found on the selected page(s).', 'warning');
  } else {
    console.log('[applyFindReplace] summary', { pagesTouched, boxesTotal });
  }

  const outBytes = await outDoc.save();
  const t1 = (performance && performance.now) ? performance.now() : Date.now();
  console.log('[applyFindReplace] save complete', {
    outBytes: (outBytes && (outBytes.byteLength || outBytes.length)) || 0,
    elapsedMs: Math.round(t1 - t0)
  });

  this._offerDownload(outBytes, this._suffixedName(this.pdfFileName, '-edited'));
  return outBytes;
}

async _reloadPdfDocFromBytes() {
  try { this.pdfDoc?.destroy?.(); } catch (e) { /* no-op */ }
  this.pdfDoc = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise;
  console.log('[pdf] reloaded doc from bytes', { numPages: this.pdfDoc.numPages });
}


// Assumes: import { ShowToastEvent } from 'lightning/platformShowToastEvent';

regeneratePage = async () => {
  console.log('[regeneratePage] start', {
    hasPdf: !!this.pdfArrayBuffer,
    findText: this.findText,
    replaceText: this.replaceText
  });

  if (!this.pdfArrayBuffer) {
    console.warn('[regeneratePage] No PDF loaded');
    this.dispatchEvent(new ShowToastEvent({
      title: 'Warning',
      message: 'Please upload a PDF first.',
      variant: 'warning'
    }));
    return;
  }

  const find = (this.findText || '').trim();
  if (!find) {
    console.warn('[regeneratePage] Empty "Find" value');
    this.dispatchEvent(new ShowToastEvent({
      title: 'Warning',
      message: 'Select or type text in the "Find" field.',
      variant: 'warning'
    }));
    return;
  }

  const pageNum = this._getVisiblePageNumber();
  console.log('[regeneratePage] Visible page detected:', pageNum);

  try {
    console.log('[regeneratePage] Applying replacement', {
      pageNum,
      find,
      replace: (this.replaceText ?? '').toString()
    });

    
    let replaced;
    if (USE_PDFEDITOR_API) {
      console.log('[regeneratePage] Using server-side edit-text API');
      const editedBlob = await this._editTextViaApi(
        this.pdfArrayBuffer,
        this.fileName || 'document.pdf',
        find,
        (this.replaceText ?? '').toString()
      );
      const editedBuf = new Uint8Array(await editedBlob.arrayBuffer());
      replaced = editedBuf;
    } else {
      replaced = await this.applyFindReplace(
        this.pdfArrayBuffer,
        find,
        (this.replaceText ?? '').toString(),
        [pageNum] // limit to current page in client-side mode
      );
    }

    console.log('[regeneratePage] applyFindReplace done', {
      newByteLength: (replaced && (replaced.byteLength || replaced.length)) || 0
    });

    // Swap bytes
    this.pdfArrayBuffer = replaced;

    // ⭐ Reload pdf.js document from the NEW bytes so preview uses edited content
    await this._reloadPdfDocFromBytes();

    // Re-render preview (clean old overlays first to avoid duplicate handlers)
    this._cleanupSnipOverlays?.();
    console.log('[regeneratePage] Re-rendering preview', {
      pageCount: this.previewPageCount || 1,
      scale: this.previewScale || 1.25,
      snipMode: !!this.snipMode
    });

    if (typeof this.renderSpecificPages === 'function') {
      await this.renderSpecificPages([pageNum], this.previewScale || 1.25);
    } else {
      await this.renderPdfPreview(this.previewPageCount || 1, this.previewScale || 1.25);
    }

    // Scroll back to the same page (if applicable)
    const host = this.template.querySelector('[data-ref="viewer"]');
    const target = host?.querySelector(`.pdf-page[data-page="${pageNum}"]`);
    if (target && host) {
      host.scrollTop = target.offsetTop;
      console.log('[regeneratePage] Scrolled to page', pageNum, 'offsetTop:', target.offsetTop);
    } else {
      console.log('[regeneratePage] Could not find page for scroll', { hostFound: !!host, pageNum });
    }

    // Update the thumbnail for this page if your listview uses it
    if (typeof this.refreshPageImage === 'function') {
      await this.refreshPageImage(pageNum);
    }
    await this._resetEditUiAfterSuccess();

    this.dispatchEvent(new ShowToastEvent({
      title: 'Page updated',
      message: `Page ${pageNum} regenerated with your replacement.`,
      variant: 'success'
    }));
    console.log('[regeneratePage] Success');
  } catch (e) {
    console.error('[regeneratePage] Regenerate failed', e);
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error',
      message: e?.message || 'Regenerate failed.',
      variant: 'error'
    }));
  }
};

_resetEditUiAfterSuccess = async () => {
  console.log('[resetEditUiAfterSuccess] begin', { snipMode: this.snipMode });

  // 1) Turn OFF snip mode (reuses your existing handler, triggers re-render)
  if (this.snipMode && typeof this.onSnipToggleChange === 'function') {
    try {
      await this.onSnipToggleChange({ target: { checked: false } });
      console.log('[resetEditUiAfterSuccess] snipMode turned OFF');
    } catch (e) {
      console.warn('[resetEditUiAfterSuccess] toggle off failed (continuing)', e);
    }
  }

  // 2) Clear Find/Replace state
  this.findText = '';
  this.replaceText = '';
  this._lastSnipRect = null;

  // 3) Clear the UI inputs (if present)
  const findInput = this.template.querySelector('[data-ref="find-input"]');
  if (findInput) {
    try { findInput.value = ''; } catch (_) {}
  } else {
    console.warn('[resetEditUiAfterSuccess] find input not found');
  }

  const replaceInput = this.template.querySelector('[data-ref="replace-input"]');
  if (replaceInput) {
    try { replaceInput.value = ''; } catch (_) {}
  } else {
    console.warn('[resetEditUiAfterSuccess] replace input not found (add data-ref="replace-input")');
  }

  console.log('[resetEditUiAfterSuccess] done');
};


// ===== helpers required by applyFindReplace() =====

// Build a continuous string and a char-index map into tokens
buildPlainStringWithIndex = (tokens) => {
  let plain = '';
  const indexMap = [];
  tokens.forEach((t, ti) => {
    const s = t.text || '';
    for (let ci = 0; ci < s.length; ci++) {
      plain += s[ci];
      indexMap.push({ ti, ci });
    }
    // add a soft space between tokens so cross-token search still works
    plain += ' ';
    indexMap.push({ ti, ci: (s.length) });
  });
  return { plain, indexMap };
};

// Find all non-overlapping indices of needle in haystack
findAllIndices = (haystack, needle) => {
  const out = [];
  if (!needle) return out;
  let i = 0;
  while (i < haystack.length) {
    const k = haystack.indexOf(needle, i);
    if (k === -1) break;
    out.push({ start: k, end: k + needle.length }); // [start,end)
    i = k + needle.length;
  }
  return out;
};

// Compute a bounding box for a char range across tokens
bboxForRange = (start, end, tokens, indexMap, /* pageHeight */) => {
  const touched = new Map(); // ti -> {minCi, maxCi}
  for (let i = start; i < end && i < indexMap.length; i++) {
    const { ti, ci } = indexMap[i];
    if (!touched.has(ti)) touched.set(ti, { minCi: ci, maxCi: ci });
    else {
      const r = touched.get(ti);
      r.minCi = Math.min(r.minCi, ci);
      r.maxCi = Math.max(r.maxCi, ci);
    }
  }
  if (!touched.size) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  touched.forEach((range, ti) => {
    const t = tokens[ti];
    if (!t) return;
    const total = Math.max(1, t.text?.length || 1);
    const proportion = Math.min(1, (range.maxCi + 1) / total);
    const subWidth = Math.max(1, t.width * proportion);
    const x1 = t.x;
    const x2 = t.x + subWidth;
    const baseline = t.y;
    const ascent = t.height;              // approx line height from PDF.js
    const yBottom = baseline - (ascent * 0.2);
    const yTop    = baseline + (ascent * 0.8);

    minX = Math.min(minX, x1);
    maxX = Math.max(maxX, x2);
    minY = Math.min(minY, yBottom);
    maxY = Math.max(maxY, yTop);
  });

  const x = minX;
  const w = Math.max(2, maxX - minX);
  const h = Math.max(6, maxY - minY);
  const y = minY;

  return { x: Math.max(0, x), y: Math.max(0, y), w, h };
};

// Basic word-wrap for drawing replacement text within a max width
wrapText = (text, font, size, maxWidth) => {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  const width = (s) => font.widthOfTextAtSize(s, size);

  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (width(test) <= maxWidth) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      if (width(w) <= maxWidth) {
        cur = w;
      } else {
        // hard-break long word
        let chunk = '';
        for (const ch of w) {
          if (width(chunk + ch) > maxWidth) {
            if (chunk) lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        cur = chunk;
      }
    }
  }
  if (cur) lines.push(cur);
  return lines;
};

// Filename helper used after save()
_suffixedName = (name, suffix) => {
  if (!name) return 'edited.pdf';
  const dot = name.lastIndexOf('.');
  if (dot < 0) return name + suffix + '.pdf';
  return name.slice(0, dot) + suffix + name.slice(dot);
};

// Download helper
_offerDownload = (uint8, name) => {
  const a = this.template.querySelector('a[data-ref="download"]');
  if (!a) return;
  const blob = new Blob([uint8], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name || 'edited.pdf';
  // a.click(); // optional: auto-download
  setTimeout(() => URL.revokeObjectURL(url), 15000);
};

// Replace the thumbnail for an existing page IN-PLACE (never push).
async refreshPageImage(pageNum) {
  try {
    // Make sure pdfDoc matches latest bytes
    if (!this.pdfDoc && this.pdfArrayBuffer) {
      // eslint-disable-next-line no-undef
      this.pdfDoc = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise;
    }

    // Find existing card by pageNumber first
    let idx = Array.isArray(this.pageImages)
      ? this.pageImages.findIndex(p => Number(p.pageNumber) === Number(pageNum))
      : -1;

    // Fallback: if you maintain a mapping, use it
    if (idx < 0 && this.pageNumberToCardId instanceof Map) {
      const cardId = this.pageNumberToCardId.get(Number(pageNum));
      if (cardId != null) {
        idx = this.pageImages.findIndex(p => String(p.id) === String(cardId));
      }
    }

    if (idx < 0) {
      // No existing card to replace. DO NOT append (prevents duplicates).
      console.warn('[refreshPageImage] no existing card to replace; skip push to avoid duplicate', { pageNum });
      return;
    }

    // Render a fresh image for this page
    const updated = await this.renderPageAsImage(pageNum, /*batchIndex*/ 0, pageNum);

    // Replace in-place, preserving id/cardClass/etc.
    const copy = [...this.pageImages];
    const old = copy[idx];
    copy[idx] = {
      ...old,
      pageNumber: pageNum,
      dataUrl: updated?.dataUrl || old.dataUrl
    };
    this.pageImages = copy;

    console.log('[refreshPageImage] replaced card', { idx, id: old.id, pageNum });
  } catch (e) {
    console.error('[refreshPageImage] failed', e);
  }
}


findText = '';
replaceText = '';


// handlePageClick = async (evt) => {
//   console.group('[handlePageClick]');
//   try {
//     // In case child buttons didn't stop propagation
//     if (evt?.defaultPrevented) {
//       console.log('[handlePageClick] defaultPrevented=true; ignoring');
//       return;
//     }

//     const cardId = evt?.currentTarget?.dataset?.id;
//     console.log('[handlePageClick] click', { cardId, hasEvt: !!evt });

//     if (!cardId) {
//       console.warn('[handlePageClick] Missing data-id on clicked card');
//       this.dispatchEvent(new ShowToastEvent({
//         title: 'Error', message: 'Missing page card id.', variant: 'error'
//       }));
//       return;
//     }

//     // ⭐ remember the card that opened the editor
//     this.currentCardId = String(cardId);

//     // Resolve 1-based page number (map → list → fallback 1)
//     let pageNum;
//     if (this.pageIdToNumber instanceof Map && this.pageIdToNumber.has(cardId)) {
//       pageNum = this.pageIdToNumber.get(cardId);
//       console.log('[handlePageClick] resolved via map', { pageNum });
//     } else {
//       const hit = (this.pageImages || []).find(p => String(p.id) === String(cardId));
//       pageNum = hit?.pageNumber;
//       console.log('[handlePageClick] resolved via pageImages', { hit, pageNum });
//     }
//     pageNum = parseInt(pageNum, 10) || 1;
//     console.log('[handlePageClick] final pageNum', pageNum);

//     // readiness check
//     const ready = this.pdfJsReady && (this.pdfDoc || this.pdfArrayBuffer);
//     console.log('[handlePageClick] readiness', {
//       pdfJsReady: this.pdfJsReady,
//       hasPdfDoc: !!this.pdfDoc,
//       hasBytes: !!this.pdfArrayBuffer,
//       pdfLibReady: this.pdfLibReady
//     });
//     if (!ready) {
//       console.warn('[handlePageClick] PDF not ready for preview');
//       this.dispatchEvent(new ShowToastEvent({
//         title: 'Warning', message: 'PDF is not ready yet. Please upload or wait a moment.', variant: 'warning'
//       }));
//       return;
//     }

//     // Open modal and render this page
//     console.log('[handlePageClick] opening modal for page', pageNum);
//     await this.openEditorModal(pageNum);
//     this.currentEditPage = pageNum;

//     // Keep maps synced now that we know id<->page
//     this._syncPageMaps(this.currentCardId, pageNum);

//     console.log('[handlePageClick] modal opened & page rendered');

//     // Optional auto-replace if user had already typed “Find”
//     const find = (this.findText || '').trim();
//     console.log('[handlePageClick] auto-replace check', { find });
//     if (!find) {
//       console.log('[handlePageClick] no find text; skipping auto-replace');
//       return;
//     }
//     if (!this.pdfLibReady) {
//       console.warn('[handlePageClick] pdf-lib not ready; skipping auto-replace');
//       this.dispatchEvent(new ShowToastEvent({
//         title: 'Warning', message: 'Editing library not ready yet. Try again in a moment.', variant: 'warning'
//       }));
//       return;
//     }

//     const replacement = (this.replaceText ?? '').toString();
//     console.log('[handlePageClick] applyFindReplace start', { pageNum, find, replacement });

//     const replaced = await this.applyFindReplace(
//       this.pdfArrayBuffer,
//       find,
//       replacement,
//       [pageNum] // only this page
//     );

//     console.log('[handlePageClick] applyFindReplace done', {
//       gotBytes: !!replaced,
//       newLen: replaced ? (replaced.byteLength || replaced.length || 0) : 0
//     });

//     if (replaced) {
//       this.pdfArrayBuffer = replaced;

//       const scale = this.previewScale || 1.25;
//       console.log('[handlePageClick] re-rendering modal preview', { pageNum, scale });
//       if (typeof this.renderSpecificPages === 'function') {
//         await this.renderSpecificPages([pageNum], scale);
//       } else {
//         await this.renderPdfPreview(1, scale, [pageNum]);
//       }

//       if (typeof this.refreshPageImage === 'function') {
//         console.log('[handlePageClick] refreshing thumbnail for page', pageNum);
//         await this.refreshPageImage(pageNum);
//         this._rebuildPageMaps?.();
//       }

//       this.dispatchEvent(new ShowToastEvent({
//         title: 'Success', message: `Applied replacement on page ${pageNum}.`, variant: 'success'
//       }));
//       console.log('[handlePageClick] success toast sent');
//     } else {
//       console.warn('[handlePageClick] No replaced bytes returned; nothing updated');
//     }
//   } catch (e) {
//     console.error('[handlePageClick] failed', e);
//     this.dispatchEvent(new ShowToastEvent({
//       title: 'Error', message: e?.message || 'Failed to open editor for this page.', variant: 'error'
//     }));
//   } finally {
//     console.groupEnd?.();
//   }
// };

handlePageClick = async (evt) => {
  console.group('[handlePageClick]');
  try {
    // If a child action already handled the click
    if (evt?.defaultPrevented) {
      console.log('[handlePageClick] defaultPrevented=true; ignoring');
      return;
    }

    const el     = evt?.currentTarget;
    const cardId = el?.dataset?.id;
    // MAY be "2" or "Page 2" — we'll coerce to a number
    const dsRaw  = el?.dataset?.pageNumber;

    console.log('[handlePageClick] click', { cardId, hasEvt: !!evt, dsRaw });

    if (!cardId) {
      console.warn('[handlePageClick] Missing data-id on clicked card');
      this.dispatchEvent(new ShowToastEvent({
        title: 'Error', message: 'Missing page card id.', variant: 'error'
      }));
      return;
    }

    // Remember which card opened the editor
    this.currentCardId = String(cardId);

    // ---------- Resolve 1-based page number ----------
    let pageNum = this._coercePageNumber(dsRaw);               // 1) dataset page number

    if (!Number.isFinite(pageNum) && this.pageIdToNumber instanceof Map) {
      const mapped = this.pageIdToNumber.get(String(cardId));  // 2) explicit map
      pageNum = this._coercePageNumber(mapped);
      console.log('[handlePageClick] fallback via map', { mapped, pageNum });
    }

    if (!Number.isFinite(pageNum)) {                           // 3) pageImages search
      const list = this.pageImages || [];
      const hitIndex = list.findIndex(p => String(p.id) === String(cardId));
      if (hitIndex >= 0) {
        const hit = list[hitIndex];
        const raw = hit?.pageNumber ?? hit?.page ?? hit?.pageNo ?? hit?.index ?? (hitIndex + 1);
        pageNum = this._coercePageNumber(raw);
        console.log('[handlePageClick] fallback via pageImages', { raw, pageNum, hitIndex });
      }
    }

    // Final guard + clamp to document range (if known)
    if (!Number.isFinite(pageNum) || pageNum <= 0) pageNum = 1;
    if (this.pdfDoc?.numPages) {
      pageNum = Math.min(Math.max(pageNum, 1), this.pdfDoc.numPages);
    }
    console.log('[handlePageClick] final pageNum', pageNum);

    // ---------- Readiness ----------
    const ready = this.pdfJsReady && (this.pdfDoc || this.pdfArrayBuffer);
    console.log('[handlePageClick] readiness', {
      pdfJsReady: this.pdfJsReady,
      hasPdfDoc: !!this.pdfDoc,
      hasBytes: !!this.pdfArrayBuffer,
      pdfLibReady: this.pdfLibReady
    });
    if (!ready) {
      console.warn('[handlePageClick] PDF not ready for preview');
      this.dispatchEvent(new ShowToastEvent({
        title: 'Warning', message: 'PDF is not ready yet. Please upload or wait a moment.', variant: 'warning'
      }));
      return;
    }

    // ---------- Open modal + render that page ----------
    console.log('[handlePageClick] opening modal for page', pageNum);
    await this.openEditorModal(pageNum);
    this.currentEditPage = pageNum;

    // Keep maps synced
    this._syncPageMaps(this.currentCardId, pageNum);

    console.log('[handlePageClick] modal opened & page rendered');

    // ---------- Optional auto-replace ----------
    const find = (this.findText || '').trim();
    console.log('[handlePageClick] auto-replace check', { find });
    if (!find) {
      console.log('[handlePageClick] no find text; skipping auto-replace');
      return;
    }
    if (!this.pdfLibReady) {
      console.warn('[handlePageClick] pdf-lib not ready; skipping auto-replace');
      this.dispatchEvent(new ShowToastEvent({
        title: 'Warning', message: 'Editing library not ready yet. Try again in a moment.', variant: 'warning'
      }));
      return;
    }

    const replacement = (this.replaceText ?? '').toString();
    console.log('[handlePageClick] applyFindReplace start', { pageNum, find, replacement });

    const replaced = await this.applyFindReplace(
      this.pdfArrayBuffer,
      find,
      replacement,
      [pageNum] // only this page
    );

    console.log('[handlePageClick] applyFindReplace done', {
      gotBytes: !!replaced,
      newLen: replaced ? (replaced.byteLength || replaced.length || 0) : 0
    });

    if (replaced) {
      this.pdfArrayBuffer = replaced;

      const scale = this.previewScale || 1.25;
      console.log('[handlePageClick] re-rendering modal preview', { pageNum, scale });
      if (typeof this.renderSpecificPages === 'function') {
        await this.renderSpecificPages([pageNum], scale);
      } else {
        await this.renderPdfPreview(1, scale, [pageNum]); // render only that page
      }

      if (typeof this.refreshPageImage === 'function') {
        console.log('[handlePageClick] refreshing thumbnail for page', pageNum);
        await this.refreshPageImage(pageNum);
        this._rebuildPageMaps?.(); // optional: keep id<->page maps fresh
      }

      this.dispatchEvent(new ShowToastEvent({
        title: 'Success', message: `Applied replacement on page ${pageNum}.`, variant: 'success'
      }));
      console.log('[handlePageClick] success toast sent');
    } else {
      console.warn('[handlePageClick] No replaced bytes returned; nothing updated');
    }
  } catch (e) {
    console.error('[handlePageClick] failed', e);
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error', message: e?.message || 'Failed to open editor for this page.', variant: 'error'
    }));
  } finally {
    console.groupEnd?.();
  }
};



showEditorModal = false;
currentEditPage = 1;

// keep a ref so we can remove it
_selectionChangeHandler;

openEditorModal = async (pageNum) => {
  this.currentEditPage = parseInt(pageNum, 10) || 1;
  this.showEditorModal = true;

  // wait for modal DOM to paint, then render exactly this page
  requestAnimationFrame(async () => {
    try {
      const scale = this.previewScale || 1.25;

      if (typeof this.renderSpecificPages === 'function') {
        await this.renderSpecificPages([this.currentEditPage], scale);
      } else {
        // ⬅️ pass targetPages so it doesn’t default to page 1
        await this.renderPdfPreview(1, scale, [this.currentEditPage]);
      }
    } catch (e) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: e?.message || 'Failed to render page in modal.',
          variant: 'error'
        })
      );
    }
  });

  // global selection fallback (unchanged)
  this._selectionChangeHandler = () => {
    const s = (window.getSelection()?.toString() || '').replace(/\s+/g, ' ').trim();
    if (!s) return;
    this.findText = s;
    const findInput = this.template.querySelector('[data-ref="find-input"]');
    if (findInput) findInput.value = s;
  };
  document.addEventListener('selectionchange', this._selectionChangeHandler);
};

_resetEditorFields = () => {
  // clear tracked values
  this.findText = '';
  this.replaceText = '';
  this._lastSnipRect = null;

  // current editor context
  this.currentEditPage = null;
  this.currentCardId = null;

  // turn off snip mode
  this.snipMode = false;

  // clear visible inputs (if present)
  const findInput = this.template.querySelector('[data-ref="find-input"]');
  if (findInput) findInput.value = '';

  const replaceInput = this.template.querySelector('[data-ref="replace-input"]');
  if (replaceInput) replaceInput.value = '';

  // clear any text selection
  try { window.getSelection()?.removeAllRanges(); } catch (e) {}

  // clear per-page token cache
  if (this._pageTokenIndex?.clear) this._pageTokenIndex.clear();
};


closeEditorModal = () => {
  this.showEditorModal = false;

  // remove snip overlays & pointers
  this._cleanupSnipOverlays?.();

  // drop the rendered page(s) inside the modal
  const host = this.template.querySelector('[data-ref="viewer"]');
  if (host) host.innerHTML = '';

  // remove global selection listener
  if (this._selectionChangeHandler) {
    document.removeEventListener('selectionchange', this._selectionChangeHandler);
    this._selectionChangeHandler = null;
  }

  // 🔄 finally, clear all editor values/selection/toggles
  this._resetEditorFields();
};


// stop click bubbling inside modal container (so backdrop click closes, content click doesn't)
stopModalClick = (evt) => { evt.stopPropagation?.(); };
// Page → token index cache (per editor render)
_pageTokenIndex = new Map();  // pageNum -> [{ text, x, y, w, h }]

// Build tokens from the actual DOM spans, so geometry is exact
_indexPageTokens(pageNum, wrapEl, textLayerEl) {
  if (!wrapEl || !textLayerEl) return;
  const wrapRect = wrapEl.getBoundingClientRect();
  const spans = Array.from(textLayerEl.querySelectorAll('span'));
  const tokens = spans.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent || '',
      x: r.left - wrapRect.left,
      y: r.top - wrapRect.top,
      w: r.width,
      h: r.height
    };
  }).filter(t => t.text && t.w > 0 && t.h > 0);

  this._pageTokenIndex.set(pageNum, tokens);
  console.log('[snip] _indexPageTokens', { pageNum, spans: spans.length, tokens: tokens.length });
}


// Returns union text of tokens intersecting a rect {x,y,w,h} in page CSS pixels
_textFromRect(pageNum, rect) {
  const tokens = this._pageTokenIndex.get(pageNum) || [];
  const ix = [];
  const rx1 = rect.x, ry1 = rect.y, rx2 = rect.x + rect.w, ry2 = rect.y + rect.h;

  for (const t of tokens) {
    const tx1 = t.x, ty1 = t.y, tx2 = t.x + t.w, ty2 = t.y + t.h;
    const xOverlap = Math.max(0, Math.min(rx2, tx2) - Math.max(rx1, tx1));
    const yOverlap = Math.max(0, Math.min(ry2, ty2) - Math.max(ry1, ty1));
    if (xOverlap > 0 && yOverlap > 0) ix.push(t);
  }

  if (!ix.length) return '';

  // Sort visual reading order: top→bottom (tolerance), then left→right
  const Y_TOL = 4; // px tolerance for grouping rows
  ix.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const rows = [];
  for (const t of ix) {
    let row = rows.find(r => Math.abs(r.y - t.y) <= Y_TOL);
    if (!row) { row = { y: t.y, items: [] }; rows.push(row); }
    row.items.push(t);
  }
  const lines = rows
    .sort((a, b) => a.y - b.y)
    .map(r => r.items.sort((a, b) => a.x - b.x).map(t => t.text).join(' '));

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

// Attach a snipping overlay to a page wrapper; when user drags, capture a rect
// Keep the most recent snip rect (CSS pixels in the page wrapper coordinate space)
_lastSnipRect = null;
_attachSnipOverlay(wrapEl, pageNum) {
  console.groupCollapsed('[snip] attach overlay', { pageNum });
  try {
    if (!wrapEl) {
      console.warn('[snip] no wrapEl; abort');
      return null;
    }

    const overlay = document.createElement('div');
    overlay.className = 'selection-layer';
    // Inline hardening so it always sits above canvas/text layer
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '999';
    overlay.style.pointerEvents = 'auto';
    overlay.style.cursor = 'crosshair';
    overlay.style.touchAction = 'none';
    overlay.tabIndex = 0; // ESC to cancel
    wrapEl.appendChild(overlay);

    let startX = 0, startY = 0, marquee = null, dragging = false;

    const clamp   = (v, min, max) => Math.max(min, Math.min(max, v));
    const localXY = (evt) => {
      const r = overlay.getBoundingClientRect();
      const x = (evt.clientX ?? 0) - r.left;
      const y = (evt.clientY ?? 0) - r.top;
      return { x, y, w: r.width, h: r.height };
    };

    const begin = (evt) => {
      // only primary button / contact
      if (evt.button !== undefined && evt.button !== 0) return;
      evt.preventDefault();
      dragging = true;

      const { x, y } = localXY(evt);
      startX = clamp(x, 0, overlay.clientWidth);
      startY = clamp(y, 0, overlay.clientHeight);

      marquee = document.createElement('div');
      marquee.className = 'marquee';
      marquee.style.position = 'absolute';
      marquee.style.left = `${startX}px`;
      marquee.style.top  = `${startY}px`;
      marquee.style.width  = '0px';
      marquee.style.height = '0px';
      marquee.style.border = '2px dashed #2563eb';
      marquee.style.background = 'rgba(37,99,235,0.08)';
      marquee.style.boxShadow = 'inset 0 0 0 1px rgba(37,99,235,0.15)';
      overlay.appendChild(marquee);

      try { overlay.setPointerCapture?.(evt.pointerId); } catch (_) {}
      console.log('[snip] begin', { startX, startY });
    };

    const move = (evt) => {
      if (!dragging || !marquee) return;
      evt.preventDefault();

      const { x, y, w: maxW, h: maxH } = localXY(evt);
      const curX = clamp(x, 0, maxW);
      const curY = clamp(y, 0, maxH);

      const left = Math.min(startX, curX);
      const top  = Math.min(startY, curY);
      const w    = Math.abs(curX - startX);
      const h    = Math.abs(curY - startY);

      marquee.style.left   = `${left}px`;
      marquee.style.top    = `${top}px`;
      marquee.style.width  = `${w}px`;
      marquee.style.height = `${h}px`;
    };

    const finish = async () => {
      if (!dragging) return;
      dragging = false;

      let rect = null;
      if (marquee) {
        const x = parseFloat(marquee.style.left)  || 0;
        const y = parseFloat(marquee.style.top)   || 0;
        const w = parseFloat(marquee.style.width) || 0;
        const h = parseFloat(marquee.style.height)|| 0;
        marquee.remove();
        marquee = null;
        if (w > 4 && h > 4) rect = { x, y, w, h };
      }

      try { overlay.releasePointerCapture?.(); } catch (_) {}

      if (!rect) {
        console.log('[snip] tiny/empty rect ignored');
        return;
      }

      // Remember the last selection in CSS pixels for this page
      this._lastSnipRect = { page: pageNum, ...rect };

      // Try extracting text from the area
      const grabbed = this._textFromRect(pageNum, rect);
      console.log('[snip] finish', { rect, grabbedLen: grabbed?.length || 0 });

      if (grabbed) {
        this.findText = grabbed;
        const input = this.template.querySelector('[data-ref="find-input"]');
        if (input) input.value = grabbed;
        this.dispatchEvent(new ShowToastEvent({
          title: 'Captured',
          message: 'Text copied from selected area.',
          variant: 'success'
        }));
        return;
      }

      // === No text detected -> custom insert dialog (preferred) ===
      if (typeof this._openInsertDialog === 'function') {
        // store selection so the dialog confirm can use it
        this._pendingInsert = { page: pageNum, rectCss: rect };
        this._openInsertDialog();   // your modal will call _confirmInsertDialog later
        return;
      }

      // === Fallback (only if you haven't wired a dialog): prompt + inline insert ===
      const typed = window.prompt(
        'No text detected.\nType the text you want to insert into this area:'
      );
      if (!typed || !typed.trim()) {
        this.dispatchEvent(new ShowToastEvent({
          title: 'Info',
          message: 'No text entered.',
          variant: 'info'
        }));
        return;
      }

      // We need the cached viewport to convert CSS -> PDF coords
      const vp = this._pageViewports?.get(pageNum);
      if (!vp) {
        this.dispatchEvent(new ShowToastEvent({
          title: 'Error',
          message: 'Could not convert selection to PDF coordinates.',
          variant: 'error'
        }));
        return;
      }

      const [x1, y1] = vp.convertToPdfPoint(rect.x,           rect.y);
      const [x2, y2] = vp.convertToPdfPoint(rect.x + rect.w,  rect.y + rect.h);
      const pdfRect  = {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        w: Math.abs(x2 - x1),
        h: Math.abs(y2 - y1)
      };

      // Estimate style from region (if helper exists) otherwise fallback
      let style;
      if (typeof this._inferStyleFromRegion === 'function') {
        style = this._inferStyleFromRegion(pageNum, rect);
      } else {
        const scale = this.previewScale || 1.25;
        const est   = Math.max(8, Math.min(48, Math.round(rect.h * 0.35 / Math.max(0.5, scale))));
        style = { family: 'Helvetica', bold: false, size: est, lineHeight: Math.round(est * 1.25) };
      }

      try {
        if (typeof this._insertTextAtRect === 'function') {
          await this._insertTextAtRect(pageNum, pdfRect, typed.trim(), style);
        } else {
          // Inline fallback insertion using pdf-lib
          const { PDFDocument, StandardFonts } = window.PDFLib;
          const outDoc = await PDFDocument.load(this.pdfArrayBuffer);

          const fam = (style.family || 'Helvetica').toLowerCase();
          const fontName =
            fam.includes('times')   ? (style.bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman) :
            fam.includes('courier') || fam.includes('mono')
                                    ? (style.bold ? StandardFonts.CourierBold   : StandardFonts.Courier) :
                                      (style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);

          const font = await outDoc.embedFont(fontName);
          const page = outDoc.getPage(pageNum - 1);

          const size = style.size || 11;
          const lh   = style.lineHeight || Math.round(size * 1.25);
          const lines = this.wrapText(typed.trim(), font, size, pdfRect.w);

          let y = pdfRect.y + pdfRect.h - size;
          for (const ln of lines) {
            page.drawText(ln, { x: pdfRect.x, y, font, size });
            y -= lh;
            if (y < pdfRect.y) break;
          }

          this.pdfArrayBuffer = await outDoc.save();
        }

        // Reload pdf.js doc & re-render this page only
        if (typeof this._reloadPdfDocFromBytes === 'function') {
          await this._reloadPdfDocFromBytes();
        } else {
          this.pdfDoc = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise; // eslint-disable-line no-undef
        }
        await this.renderPdfPreview(1, this.previewScale || 1.25, [pageNum]);

        // Refresh left-grid thumbnail (no duplicate cards)
        if (typeof this._refreshGridThumbnail === 'function') {
          await this._refreshGridThumbnail(pageNum);
        } else if (typeof this.refreshPageImage === 'function') {
          await this.refreshPageImage(pageNum);
        }

        this.dispatchEvent(new ShowToastEvent({
          title: 'Inserted',
          message: `Added text on page ${pageNum}.`,
          variant: 'success'
        }));
      } catch (err) {
        console.error('[insert] failed', err);
        this.dispatchEvent(new ShowToastEvent({
          title: 'Error',
          message: err?.message || 'Failed to insert text.',
          variant: 'error'
        }));
      }
    };

    const cancel = () => {
      if (!dragging) return;
      dragging = false;
      marquee?.remove();
      marquee = null;
      console.log('[snip] cancelled');
    };

    const onKey = (e) => { if (e.key === 'Escape') cancel(); };

    // Pointer events (mouse/pen/touch)
    overlay.addEventListener('pointerdown', begin);
    overlay.addEventListener('pointermove', move);
    overlay.addEventListener('pointerup', finish);
    overlay.addEventListener('pointercancel', cancel);
    overlay.addEventListener('pointerleave', finish);
    overlay.addEventListener('keydown', onKey);

    // Cleanup hook
    overlay._cleanup = () => {
      overlay.removeEventListener('pointerdown', begin);
      overlay.removeEventListener('pointermove', move);
      overlay.removeEventListener('pointerup', finish);
      overlay.removeEventListener('pointercancel', cancel);
      overlay.removeEventListener('pointerleave', finish);
      overlay.removeEventListener('keydown', onKey);
      overlay.remove();
      console.log('[snip] overlay cleaned', { pageNum });
    };

    // Track for batch cleanup on re-render/close
    (this._activeOverlays ||= []).push(overlay);

    const r = overlay.getBoundingClientRect?.();
    console.log('[snip] overlay attached', r ? { w: r.width, h: r.height } : {});
    console.groupEnd?.();
    return overlay;
  } catch (err) {
    console.error('[snip] attach error', err);
    console.groupEnd?.();
    return null;
  }
}



// ==================================
// 3) onSnipToggleChange (updated)
// ==================================
snipMode = false;      // OFF by default
_lastSnipRect = null;  // optional: last selection rectangle

// ✅ Leave this exactly as-is (your current logic)
// onSnipToggleChange = async (e) => { ... }  // unchanged

// New: handler for the custom button — flips state and reuses your existing logic.
snipButtonClick = (evt) => {
  evt?.stopPropagation?.();        // avoid bubbling to page card container
  const next = !this.snipMode;     // toggle
  this.onSnipToggleChange({ target: { checked: next } });  // reuse your handler
};

// Optional getters for nicer UI text/icon styling
get viewToggleTitle() {
  return this.snipMode ? 'Snip Select: ON' : 'Snip Select: OFF';
}
get viewToggleIcon() {
  // Use any Material icon you prefer; these two give a clear ON/OFF cue
  return this.snipMode ? 'select_all' : 'text_select_start';
}
get viewToggleButtonClass() {
  return `view-toggle-button${this.snipMode ? ' active' : ''}`;
}


// onSnipToggleChange = async (e) => {
//   this.snipMode = !!e.target.checked;
//   console.log('[snip] toggle', { snipMode: this.snipMode });

//   // remove any existing overlays
//   this._cleanupSnipOverlays?.();

//   // re-render current page so the mode switch applies immediately
//   try {
//     if (this.showEditorModal && (this.pdfDoc || this.pdfArrayBuffer)) {
//       await this.renderSpecificPages?.([this.currentEditPage], this.previewScale || 1.25)
//         ?? this.renderPdfPreview(1, this.previewScale || 1.25);
//     }
//   } catch (err) {
//     console.error('[snip] toggle re-render failed', err);
//   }

//   this.dispatchEvent(new ShowToastEvent({
//     title: this.snipMode ? 'Snip Select enabled' : 'Snip Select disabled',
//     message: this.snipMode
//       ? 'Drag a box over the page to capture text into the Find field.'
//       : 'Text selection restored. Drag to highlight text normally.',
//     variant: 'info'
//   }));
// };

// Ensure a text layer exists for this page and (re)index tokens.
// Call this any time you render (or re-render) a page that will be snipped.
_ensureIndexForPage = async (pageNum) => {
  try {
    const host = this.template.querySelector('[data-ref="viewer"]');
    const wrap = host?.querySelector(`.pdf-page[data-page="${pageNum}"]`);
    if (!wrap) {
      console.warn('[snip] _ensureIndexForPage: wrap not found', { pageNum });
      return false;
    }

    // Find or create a text layer for this page
    let textLayer = wrap.querySelector('.textLayer');
    if (!textLayer) {
      textLayer = document.createElement('div');
      textLayer.className = 'textLayer';
      textLayer.style.position = 'absolute';
      textLayer.style.inset = '0';
      textLayer.style.zIndex = '1';
      wrap.appendChild(textLayer);

      // Build spans using pdf.js (needed if the render path didn't create them)
      const doc = this.pdfDoc
        || await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise; // eslint-disable-line no-undef
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.previewScale || 1.25 });
      const textContent = await page.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false
      });
      this._paintTextLayer(textLayer, textContent, viewport);
    }

    // (Re)index tokens from the current DOM
    this._indexPageTokens(pageNum, wrap, textLayer);

    // Debug visibility
    const tokenCount = (this._pageTokenIndex?.get(pageNum) || []).length;
    console.log('[snip] _ensureIndexForPage: tokens indexed', { pageNum, tokenCount });

    return tokenCount > 0;
  } catch (err) {
    console.error('[snip] _ensureIndexForPage error', err);
    return false;
  }
};


// 🔧 helpers to sync the interaction mode when using renderSpecificPages()

_ensureSnipOverlayFor(pageNum) {
  const host = this.template.querySelector('[data-ref="viewer"]');
  const wrap = host?.querySelector(`.pdf-page[data-page="${pageNum}"]`);
  if (!wrap) return false;

  const canvas    = wrap.querySelector('canvas');
  const textLayer = wrap.querySelector('.textLayer');

  // Make underlying layers passive for snip mode
  if (canvas) {
    canvas.style.pointerEvents = 'none';
  }
  if (textLayer) {
    textLayer.style.userSelect = 'none';
    textLayer.style.pointerEvents = 'none';
  }

  // ✅ make sure tokens exist
  // (await is OK even inside a non-async; if you prefer, make this function async)
  // but to keep your signature the same, we can just schedule:
  // NOTE: If you want to avoid mixing async, you can ensure index in the caller instead.
  // For clarity here, we'll be synchronous and rely on callers to await _ensureIndexForPage.
  // (See onSnipToggleChange below.)
  
  let overlay = wrap.querySelector('.selection-layer');
  if (!overlay) {
    overlay = this._attachSnipOverlay(wrap, pageNum);
  }
  if (overlay) {
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top  = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '99999';
    overlay.style.pointerEvents = 'auto';
    overlay.style.cursor = 'crosshair';
  }
  return !!overlay;
}


_restoreTextSelectionFor(pageNum) {
  const host = this.template.querySelector('[data-ref="viewer"]');
  const wrap = host?.querySelector(`.pdf-page[data-page="${pageNum}"]`);
  if (!wrap) return false;

  const canvas    = wrap.querySelector('canvas');
  const textLayer = wrap.querySelector('.textLayer');

  // remove overlay if present
  const overlay = wrap.querySelector('.selection-layer');
  if (overlay && overlay._cleanup) overlay._cleanup();
  else if (overlay) overlay.remove();

  // restore underlying layers
  if (canvas) {
    canvas.style.pointerEvents = 'auto';
  }
  if (textLayer) {
    textLayer.style.userSelect = 'text';
    textLayer.style.pointerEvents = 'auto';
  }
  return true;
};


onSnipToggleChange = async (e) => {
  this.snipMode = !!e.target.checked;
  console.log('[snip] toggle', { snipMode: this.snipMode });

  this._cleanupSnipOverlays?.();

  try {
    if (this.showEditorModal && (this.pdfDoc || this.pdfArrayBuffer)) {
      const page  = this.currentEditPage || this._getVisiblePageNumber() || 1;
      const scale = this.previewScale || 1.25;

      if (typeof this.renderSpecificPages === 'function') {
        await this.renderSpecificPages([page], scale);
        // ✅ guarantee tokens exist for snip selection
        await this._ensureIndexForPage(page);
        if (this.snipMode) {
          this._ensureSnipOverlayFor(page);
        } else {
          this._restoreTextSelectionFor?.(page);
        }
      } else {
        await this.renderPdfPreview(1, scale, [page]); // this path already indexes
      }

      // keep scroll anchored
      const host   = this.template.querySelector('[data-ref="viewer"]');
      const target = host?.querySelector(`.pdf-page[data-page="${page}"]`);
      if (target && host) host.scrollTop = target.offsetTop;
    }
  } catch (err) {
    console.error('[snip] toggle re-render failed', err);
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error',
      message: err?.message || 'Failed to re-render after toggle.',
      variant: 'error'
    }));
  }

  this.dispatchEvent(new ShowToastEvent({
    title: this.snipMode ? 'Snip Select enabled' : 'Snip Select disabled',
    message: this.snipMode
      ? 'Drag a box over the page to capture text into the Find field.'
      : 'Text selection restored. Drag to highlight text normally.',
    variant: 'info'
  }));
};




// ==================================
// helper used by the methods above
// ==================================
_cleanupSnipOverlays() {
  if (!this._activeOverlays || !this._activeOverlays.length) return;
  try {
    this._activeOverlays.forEach((o) => o?._cleanup?.());
  } finally {
    this._activeOverlays = [];
  }
}




// Coerce page numbers safely: accept number or string containing digits.
// Clamp to >= 1 and return NaN if not usable.
_coercePageNumber(val) {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? Math.max(1, Math.trunc(val)) : NaN;
  }
  if (typeof val === 'string') {
    const m = val.match(/\d+/);
    if (!m) return NaN;
    const n = parseInt(m[0], 10);
    return Number.isFinite(n) ? Math.max(1, n) : NaN;
  }
  return NaN;
};

_getGridIndexById(cardId) {
  if (!Array.isArray(this.pageImages)) return -1;
  return this.pageImages.findIndex(p => String(p.id) === String(cardId));
};

_getGridIndexByPageNumber(pageNum) {
  if (!Array.isArray(this.pageImages)) return -1;

  const want = this._coercePageNumber(pageNum);
  if (!Number.isFinite(want)) return -1;

  // 1) direct pageNumber match (works even if pageNumber is a string)
  let idx = this.pageImages.findIndex(
    p => this._coercePageNumber(p?.pageNumber) === want
  );

  // 2) fallback via map -> id -> index
  if (idx < 0 && this.pageNumberToCardId instanceof Map) {
    const cardId = this.pageNumberToCardId.get(want);
    if (cardId != null) {
      idx = this._getGridIndexById(cardId);
      // If not found, the map is stale — clean it up.
      if (idx < 0) this.pageNumberToCardId.delete(want);
    }
  }
  return idx;
};

// Keep maps fresh when you confirm an id<->page mapping.
_syncPageMaps(cardId, pageNum) {
  const n = this._coercePageNumber(pageNum);
  if (!cardId || !Number.isFinite(n)) return;

  this.pageIdToNumber     ||= new Map(); // id (string) -> page (number)
  this.pageNumberToCardId ||= new Map(); // page (number) -> id (string)

  this.pageIdToNumber.set(String(cardId), n);
  this.pageNumberToCardId.set(n, String(cardId));
};
_rebuildPageMaps = () => {
  this.pageIdToNumber = new Map();
  this.pageNumberToIndex = new Map();
  (this.pageImages || []).forEach((p, idx) => {
    if (p?.id != null && p?.pageNumber != null) {
      this.pageIdToNumber.set(String(p.id), Number(p.pageNumber));
      this.pageNumberToIndex.set(Number(p.pageNumber), idx);
    }
  });
  console.log('[maps] rebuilt', {
    byId: this.pageIdToNumber.size,
    byNum: this.pageNumberToIndex.size
  });
};

confirmEditorUpdate = async () => {
  const pageNum = this.currentEditPage || this._getVisiblePageNumber();
  const cardIdHint = this.currentCardId; // ⭐ from handlePageClick
  console.group('[confirmEditorUpdate]');
  console.log('[confirmEditorUpdate] start', { pageNum, cardIdHint });

  try {
    const ready = this.pdfJsReady && (this.pdfDoc || this.pdfArrayBuffer);
    if (!ready) {
      console.warn('[confirmEditorUpdate] PDF not ready');
      this.dispatchEvent(new ShowToastEvent({
        title: 'Warning', message: 'PDF is not ready yet.', variant: 'warning'
      }));
      return;
    }

    // Make sure pdfDoc mirrors latest bytes (after edits)
    if (!this.pdfDoc && this.pdfArrayBuffer) {
      // eslint-disable-next-line no-undef
      this.pdfDoc = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise;
      console.log('[confirmEditorUpdate] pdfDoc refreshed from bytes');
    }

    // Render a fresh image for this page (do NOT create a new card id)
    const updated = await this.renderPageAsImage(pageNum, /*batchIndex*/ 0, pageNum);
    if (!updated?.dataUrl) {
      console.warn('[confirmEditorUpdate] renderPageAsImage returned no dataUrl');
      this.dispatchEvent(new ShowToastEvent({
        title: 'Error', message: 'Could not regenerate the page thumbnail.', variant: 'error'
      }));
      return;
    }

    // Find existing card to REPLACE (prefer id, then page number)
    let idx = -1;
    if (cardIdHint != null) {
      idx = this._getGridIndexById(cardIdHint);
      console.log('[confirmEditorUpdate] index by id', { idx, cardIdHint });
    }
    if (idx < 0) {
      idx = this._getGridIndexByPageNumber(pageNum);
      console.log('[confirmEditorUpdate] index by pageNumber', { idx, pageNum });
    }

    if (idx < 0) {
      // Don’t append to avoid duplicates; log for debug
      console.warn('[confirmEditorUpdate] Could not find the original card to replace (thumbnail list unchanged).', {
        haveImages: Array.isArray(this.pageImages) ? this.pageImages.length : 0,
        ids: (this.pageImages || []).map(p => p.id),
        pageNumbers: (this.pageImages || []).map(p => p.pageNumber)
      });
      this.dispatchEvent(new ShowToastEvent({
        title: 'Info',
        message: 'Could not find the original card to replace (thumbnail list unchanged).',
        variant: 'info'
      }));
      return;
    }

    // Replace in-place; preserve id/classes/etc.
    const copy = [...this.pageImages];
    const old = copy[idx];
    copy[idx] = { ...old, pageNumber: pageNum, dataUrl: updated.dataUrl };
    this.pageImages = copy;

    // Keep quick-lookup maps fresh
    this._syncPageMaps(old.id, pageNum);

    console.log('[confirmEditorUpdate] replaced card', { idx, oldId: old.id, pageNum });

    // Close modal
    this.closeEditorModal();

    this.dispatchEvent(new ShowToastEvent({
      title: 'Updated', message: `Page ${pageNum} replaced in the list.`, variant: 'success'
    }));
  } catch (e) {
    console.error('[confirmEditorUpdate] failed', e);
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error', message: e?.message || 'Could not update the page thumbnail.', variant: 'error'
    }));
  } finally {
    console.groupEnd?.();
  }
};


_cssRectToPdf = async (pageNum, rectCss) => {
  if (!rectCss || !Number.isFinite(rectCss.x) || !Number.isFinite(rectCss.y) ||
      !Number.isFinite(rectCss.w) || !Number.isFinite(rectCss.h) ||
      rectCss.w <= 0 || rectCss.h <= 0) {
    throw new Error('Empty or invalid selection rectangle.');
  }

  // Ensure we can read page dimensions in PDF points
  const doc = this.pdfDoc
    || await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise; // eslint-disable-line no-undef
  const page = await doc.getPage(Number(pageNum) || 1);
  const vp1  = page.getViewport({ scale: 1 }); // PDF points (1 = native)

  // Scale you used to render the modal preview
  const s = this.previewScale || 1.25;

  // CSS → PDF points, and flip Y to bottom-left origin
  const x = rectCss.x / s;
  const y = vp1.height - (rectCss.y + rectCss.h) / s;
  const w = rectCss.w / s;
  const h = rectCss.h / s;

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
    throw new Error('Could not convert selection to PDF coordinates.');
  }

  return { x, y, w, h, pageHeight: vp1.height };
};

// Try to infer a reasonable font + size based on nearby text on this page.
_guessFontForArea = async (pageNum, rectCss) => {
  const FALLBACK = { std: 'Helvetica', bold: false, size: 11 }; // sensible default

  try {
    const scale = this.previewScale || 1.25;

    // Use existing doc when available; else load from bytes
    const doc = this.pdfDoc
      || await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise; // eslint-disable-line no-undef
    const page = await doc.getPage(Number(pageNum) || 1);

    // getViewport is only used to keep coordinate expectations consistent
    const vp = page.getViewport({ scale });
    void vp; // not strictly needed further, but harmless/documentary

    const content = await page.getTextContent({ normalizeWhitespace: true });

    // Guard rectCss
    if (!rectCss || !Number.isFinite(rectCss.x) || !Number.isFinite(rectCss.y) ||
        !Number.isFinite(rectCss.w) || !Number.isFinite(rectCss.h)) {
      console.warn('[font guess] invalid rectCss, using fallback', rectCss);
      return FALLBACK;
    }

    // Collect text items that overlap the CSS rectangle
    const hits = [];
    for (const it of content.items) {
      const t = Array.isArray(it.transform) ? it.transform : [1, 0, 0, 1, 0, 0];

      // Baseline position in CSS pixels
      const xCss = (Number(t[4]) || 0) * scale;
      const yCssBaseline = (Number(t[5]) || 0) * scale;

      // Height approximation (PDF.js: transform[3] ~ vertical scale; positive/negative varies)
      let hBase = Math.abs(Number(t[3]) || 0);
      if (!Number.isFinite(hBase) || hBase <= 0) hBase = 10;
      const hCss = hBase * scale;

      // Width: prefer it.width when present; fall back to |a| (t[0]) heuristic
      let wBase = (it.width != null) ? Number(it.width) : Math.abs(Number(t[0]) || 0);
      if (!Number.isFinite(wBase) || wBase <= 0) wBase = 10;
      const wCss = wBase * scale;

      // Convert baseline to a rough top/bottom band (aligns with how you bbox elsewhere)
      const yCssTop    = yCssBaseline + hCss * 0.8;
      const yCssBottom = yCssBaseline - hCss * 0.2;

      // Overlap test (CSS space)
      const rx1 = rectCss.x, ry1 = rectCss.y, rx2 = rectCss.x + rectCss.w, ry2 = rectCss.y + rectCss.h;
      const tx1 = xCss,      ty1 = yCssBottom,   tx2 = xCss + wCss,          ty2 = yCssTop;

      const ix = Math.max(0, Math.min(rx2, tx2) - Math.max(rx1, tx1));
      const iy = Math.max(0, Math.min(ry2, ty2) - Math.max(ry1, ty1));
      if (ix > 0 && iy > 0) {
        // Font size heuristic from horizontal scale (t[0]); clamp to a sane range
        let sizeGuess = Math.abs(Number(t[0]) || 11);
        if (!Number.isFinite(sizeGuess)) sizeGuess = 11;
        sizeGuess = Math.max(6, Math.min(48, sizeGuess));

        hits.push({
          fontName: it.fontName,
          sizePdf:  sizeGuess
        });
      }
    }

    if (!hits.length) {
      console.log('[font guess] no overlapping text; using fallback');
      return FALLBACK;
    }

    // Pick the most frequent fontName among hits
    const byFont = new Map();
    for (const h of hits) {
      const key = h.fontName || 'Unknown';
      byFont.set(key, (byFont.get(key) || 0) + 1);
    }
    const bestFontName = Array.from(byFont.entries()).sort((a, b) => b[1] - a[1])[0][0];

    // Median size is usually a good match visually
    const sizes = hits.map(h => h.sizePdf).sort((a, b) => a - b);
    const median = sizes[Math.floor(sizes.length / 2)] || FALLBACK.size;

    // Map the PDF font name to a StandardFonts family + bold flag
    const name = String(bestFontName || '').toLowerCase();
    let std = 'Helvetica';
    if (name.indexOf('times') >= 0) std = 'TimesRoman';
    if (name.indexOf('courier') >= 0 || name.indexOf('mono') >= 0) std = 'Courier';

    const bold = /\b(bold|black|heavy|demi)\b/.test(name);

    const result = { std, bold, size: median };
    console.log('[font guess] result', { bestFontName, ...result });
    return result;
  } catch (e) {
    console.warn('[font guess] failed, using fallback', e);
    return FALLBACK;
  }
};


insertTextAtSelection = async () => {
  const rect = this._lastSnipRect;          // set by your snip overlay finish()
  const pageNum = rect?.page || this.currentEditPage || 1;
  const text = (this.replaceText || '').toString();

  if (!rect || !Number.isFinite(rect.x) || !text.trim()) {
    this.dispatchEvent(new ShowToastEvent({
      title: 'Info',
      message: 'Select an area and enter text to insert.',
      variant: 'info'
    }));
    return;
  }

  try {
    // Convert CSS rect → PDF points
    const rPdf = await this._cssRectToPdf(pageNum, rect);

    // Load/edit with pdf-lib
    const { PDFDocument, StandardFonts } = window.PDFLib;
    const outDoc = await PDFDocument.load(this.pdfArrayBuffer);

    // Guess nearby font (family, bold, size)
    const guess = await this._guessFontForArea(pageNum, rect);
    const family = guess.std; // 'Helvetica' | 'TimesRoman' | 'Courier'
    const bold   = !!guess.bold;
    const size   = Number(guess.size) || 11;

    // Choose the standard font to embed
    let stdName = family;
    if (bold) {
      // Map to bold variants where available
      if (family === 'Helvetica')   stdName = 'HelveticaBold';
      if (family === 'TimesRoman')  stdName = 'TimesBold';
      if (family === 'Courier')     stdName = 'CourierBold';
    }
    const font = await outDoc.embedFont(StandardFonts[stdName]);

    // Draw text lines inside the box (top-down)
    const page = outDoc.getPage(pageNum - 1);

    // Optional: clear the region (white background) — comment out if not desired
    // const { rgb } = window.PDFLib;
    // page.drawRectangle({ x: rPdf.x, y: rPdf.y, width: rPdf.w, height: rPdf.h, color: rgb(1,1,1) });

    const lines = this.wrapText(text, font, size, rPdf.w);
    let lineY = rPdf.y + rPdf.h - (size + 1);            // start near top with a little padding
    const lineStep = size * 1.25;

    for (const line of lines) {
      page.drawText(line, { x: rPdf.x, y: lineY, font, size });
      lineY -= lineStep;
      if (lineY < rPdf.y) break;                         // stop if we run out of height
    }

    const bytes = await outDoc.save();

    // Swap bytes, ensure pdf.js doc is fresh, re-render current page in modal
    this.pdfArrayBuffer = bytes;
    await this._reloadPdfDocFromBytes?.();

    const scale = this.previewScale || 1.25;
    await this.renderPdfPreview(1, scale, [pageNum]);

    // Update the left-grid thumbnail (no duplicate)
    if (typeof this._refreshGridThumbnail === 'function') {
      await this._refreshGridThumbnail(pageNum);
    } else if (typeof this.refreshPageImage === 'function') {
      await this.refreshPageImage(pageNum);
    }

    this.dispatchEvent(new ShowToastEvent({
      title: 'Inserted',
      message: `Text inserted on page ${pageNum}.`,
      variant: 'success'
    }));
  } catch (err) {
    console.error('[insertTextAtSelection] failed', err);
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error',
      message: err?.message || 'Failed to insert text.',
      variant: 'error'
    }));
  }
};


// Heuristic: estimate a font size from nearby tokens (falls back to rect height)
_inferStyleFromRegion(pageNum, cssRect) {
  const scale = this.previewScale || 1.25;
  const tokens = this._pageTokenIndex?.get(pageNum) || [];
  const rx2 = cssRect.x + cssRect.w, ry2 = cssRect.y + cssRect.h;
  const inside = tokens.filter(t => {
    const tx2 = t.x + t.w, ty2 = t.y + t.h;
    const xOverlap = Math.max(0, Math.min(rx2, tx2) - Math.max(cssRect.x, t.x));
    const yOverlap = Math.max(0, Math.min(ry2, ty2) - Math.max(cssRect.y, t.y));
    return xOverlap > 0 && yOverlap > 0;
  });

  // median token height (CSS px) → ~ PDF font size
  const hs = inside.map(t => t.h).sort((a,b)=>a-b);
  const med = hs.length ? (hs[Math.floor(hs.length/2)]) : cssRect.h * 0.35; // fallback
  const fontSize = Math.max(8, Math.min(48, Math.round(med / Math.max(0.5, scale))));

  return {
    family: 'Helvetica',   // default; see note below to change
    bold: false,
    size: fontSize,
    lineHeight: Math.round(fontSize * 1.25)
  };
}
async _insertTextAtRect(pageNum, pdfRect, text, style) {
  const { PDFDocument, StandardFonts } = window.PDFLib;

  // Load current bytes into pdf-lib
  const outDoc = await PDFDocument.load(this.pdfArrayBuffer);

  // Pick a font based on style.family / bold
  const fam = (style.family || 'Helvetica').toLowerCase();
  let fontName = StandardFonts.Helvetica;
  if (fam.includes('times'))  fontName = style.bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
  else if (fam.includes('courier') || fam.includes('mono')) fontName = style.bold ? StandardFonts.CourierBold : StandardFonts.Courier;
  else fontName = style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;

  const font = await outDoc.embedFont(fontName);
  const page = outDoc.getPage(pageNum - 1);

  // Word-wrap to the rect width using your existing helper
  const lines = this.wrapText(text, font, style.size, pdfRect.w);

  // Draw from the top of the rect downward
  let y = pdfRect.y + pdfRect.h - style.size;
  for (const ln of lines) {
    page.drawText(ln, { x: pdfRect.x, y, font, size: style.size });
    y -= style.lineHeight;
    if (y < pdfRect.y) break; // stop if we run out of vertical space
  }

  const outBytes = await outDoc.save();
  this.pdfArrayBuffer = outBytes;

  // Make sure pdf.js doc mirrors latest bytes, then re-render this page only
  if (typeof this._reloadPdfDocFromBytes === 'function') {
    await this._reloadPdfDocFromBytes();
  } else {
    this.pdfDoc = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise; // eslint-disable-line no-undef
  }

  await this.renderPdfPreview(1, this.previewScale || 1.25, [pageNum]);

  // Update the left-grid thumbnail without adding a new card
  if (typeof this._refreshGridThumbnail === 'function') {
    await this._refreshGridThumbnail(pageNum);
  } else if (typeof this.refreshPageImage === 'function') {
    await this.refreshPageImage(pageNum);
  }

  this.dispatchEvent(new ShowToastEvent({
    title: 'Inserted',
    message: `Added text on page ${pageNum}.`,
    variant: 'success'
  }));
}
// dialog state
showInsertDialog = false;
insertText = '';

// open the custom dialog
_openInsertDialog = () => {
  this.insertText = '';
  this.showInsertDialog = true;
  // focus textarea on next paint (if present)
  requestAnimationFrame(() => {
    const ta = this.template.querySelector('[data-ref="insert-ta"]');
    ta && ta.focus();
  });
};

// textarea change
handleInsertTextChange = (event) => {
  this.insertText = (event.detail && event.detail.value != null)
    ? event.detail.value
    : (event.target && event.target.value) || '';
};

// cancel dialog
_cancelInsertDialog = () => {
  this.showInsertDialog = false;
  this.insertText = '';
};

// confirm insert
_confirmInsertDialog = async () => {
  const taEl = this.template.querySelector('[data-ref="insert-ta"]');
  const raw  = taEl && typeof taEl.value === 'string' ? taEl.value : this.insertText;
  const text = (raw || '').trim();

  if (!text) {
    this.dispatchEvent(new ShowToastEvent({
      title: 'Info',
      message: 'Type some text to insert.',
      variant: 'info'
    }));
    requestAnimationFrame(() => taEl && taEl.focus());
    return;
  }

  const sel = this._lastSnipRect; // { page, x,y,w,h } in CSS
  const vp  = this._pageViewports && this._pageViewports.get(sel?.page);
  if (!sel || !vp) {
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error',
      message: 'Could not convert selection to PDF coordinates.',
      variant: 'error'
    }));
    return;
  }

  // CSS -> PDF rect
  const [x1, y1] = vp.convertToPdfPoint(sel.x,           sel.y);
  const [x2, y2] = vp.convertToPdfPoint(sel.x + sel.w,   sel.y + sel.h);
  const pdfRect  = { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };

  // style (use your region inference if present)
  const style = (typeof this._inferStyleFromRegion === 'function')
    ? this._inferStyleFromRegion(sel.page, { x: sel.x, y: sel.y, w: sel.w, h: sel.h })
    : { family: 'Helvetica', bold: false, size: Math.max(8, Math.round(sel.h * 0.35 / Math.max(0.5, (this.previewScale || 1.25)))), lineHeight: null };

  try {
    if (typeof this._insertTextAtRect === 'function') {
      await this._insertTextAtRect(sel.page, pdfRect, text, style);
    } else {
      // inline fallback
      const { PDFDocument, StandardFonts } = window.PDFLib;
      const outDoc = await PDFDocument.load(this.pdfArrayBuffer);

      const fam = (style.family || 'Helvetica').toLowerCase();
      const fontName =
        fam.includes('times')   ? (style.bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman) :
        fam.includes('courier') ? (style.bold ? StandardFonts.CourierBold   : StandardFonts.Courier) :
                                  (style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);

      const font = await outDoc.embedFont(fontName);
      const page = outDoc.getPage(sel.page - 1);

      const size = style.size || 11;
      const lh   = style.lineHeight || Math.round(size * 1.25);
      const lines = this.wrapText(text, font, size, pdfRect.w);

      let y = pdfRect.y + pdfRect.h - size;
      for (const ln of lines) {
        page.drawText(ln, { x: pdfRect.x, y, font, size });
        y -= lh;
        if (y < pdfRect.y) break;
      }

      this.pdfArrayBuffer = await outDoc.save();
    }

    // refresh preview + thumbnail
    if (typeof this._reloadPdfDocFromBytes === 'function') {
      await this._reloadPdfDocFromBytes();
    } else {
      this.pdfDoc = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise; // eslint-disable-line no-undef
    }
    await this.renderPdfPreview(1, this.previewScale || 1.25, [sel.page]);

    if (typeof this._refreshGridThumbnail === 'function') {
      await this._refreshGridThumbnail(sel.page);
    } else if (typeof this.refreshPageImage === 'function') {
      await this.refreshPageImage(sel.page);
    }

    // close + clear
    this.showInsertDialog = false;
    this.insertText = '';
    if (taEl) taEl.value = '';

    this.dispatchEvent(new ShowToastEvent({
      title: 'Inserted',
      message: `Added text on page ${sel.page}.`,
      variant: 'success'
    }));
  } catch (err) {
    console.error('[insert] failed', err);
    this.dispatchEvent(new ShowToastEvent({
      title: 'Error',
      message: err?.message || 'Failed to insert text.',
      variant: 'error'
    }));
  }
};



  @track fileuploaded=false;
  @track isFileExpand1=false;
   triggerFileInput1() {
        
        console.log('triggerFileInput called ');
        const inputEl = this.template.querySelector('input[type="file"]');
        if (inputEl) {
            inputEl.value = '';
            inputEl.click();
            console.log('triggerFileInput called111 ');
        } else {
            console.warn("⚠️ File input not found.");
        }
    }
 async  onFileUpload1(event) {
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
     let MAX_DOC_SIZE = 10 * 1024 * 1024; // 3MB for DOC/DOCX
     
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
              this.showToast("Error", "Word document size must be 5MB or smaller.", "error");
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
        this.convertWordToPdf1(event); // ✅ Convert Word to PDF
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

   showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }


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
             this.isFileExpand1= false;

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

    convertWordToPdf1(event){
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
            this.isFileExpand = false;
             this.isFileExpand1= true;
           

            // Now child will definitely be rendered — wait for that
            setTimeout(() => {
                const svc = this.template.querySelector('c-convert-word-to-pdf-lwc');
                if (!svc) {
                    console.warn('⚠️ No <c-convert-word-to-pdf-lwc> component found.');
                    return;
                }

                svc.incomingFiles = files;
                //event.target.value = '';
            }, 1000);
        }, 0); //
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

         
            // Clear the input so the same file can be selected again
           this.uploadedFiles = files;
           this.isFileExpand=true;
           this.fileuploaded=false;
           this.fileName=this.uploadedFiles[0].originalName;
           this.convertedPdfUrl=this.uploadedFiles[0].url;
           this.key=this.uploadedFiles[0].key;
          
           
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            //console.log(' this.downloadLinks : ',  JSON.stringify(this.downloadLinks));
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }

        
handleAwsUploadComplete1(evt) {
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

         
            // Clear the input so the same file can be selected again
           this.uploadedFiles = files;
           this.isFileExpand=true;
           this.fileuploaded=false;
          // this.fileName=this.uploadedFiles[0].originalName;
           this.convertedPdfUrl=this.uploadedFiles[0].url.pdfUrl;
          // this.key=this.uploadedFiles[0].key;
           console.log(' this.convertedPdfUrl  : ',  this.convertedPdfUrl);
           
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles WORD  : ',  JSON.stringify(this.uploadedFiles));
            //console.log(' this.downloadLinks : ',  JSON.stringify(this.downloadLinks));
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
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

          

           

            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
           
            
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    handleFileDeleted(event) {
        console.group('handleFileDeleted called ');
        const { key, fileId ,files} = event.detail;
        console.log('File deleted in child. Key:', key, 'FileId:', fileId, 'files:',JSON.stringify(files) );

        // Example: remove it from parent's tracking
        this.uploadedFiles = [];
        console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles));
        this.totalfiles=[];
        this.key='';
        this.fileuploaded=false;
        this.totalfiles=[];
        if (!files || files.length === 0) {
           this.isFileExpand = false;
           this.fileName = '';
        }
    }

     handlefilecancel(event){
    console.log('child called');
     console.log('Cancel event received:', event.detail.message);
    this.uploadedFiles = [];
    this.fileuploaded=false;
  }


  handleKeyShortcut(event) {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyM') {
        event.preventDefault();
        this.openAddTemplateModal();
        }
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
        event.preventDefault();
        this.createTemplate();
        }
}

handleOutsideClick(event) {

    console.log('Outside click');
}
  

 handleUploadDragOver(event) {
    event.preventDefault();
}

handleUploadDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    // reuse your existing logic
    this.onFileUpload1({ target: { files } });
}



handleSelectTemplate(event) {
  const templateId = event.detail.templateId;
  const template = this.templateList.find(t => t.id === templateId);

  this.selectedTemplate = template;
  this.selectedDocxUrl = template.awsDocxUrl; // 🔑
  this.isTemplateModalOpen = false;
  this.isWordEditorOpen = true;
}

base64ToBlob(base64, contentType) {
  if (!base64) {
    throw new Error('Empty base64');
  }

  // Strip data URI if present
  const commaIndex = base64.indexOf(',');
  if (commaIndex !== -1) {
    base64 = base64.substring(commaIndex + 1);
  }

  // Normalize
  base64 = base64.replace(/[\r\n\s]+/g, '');

  // Decode
  const byteCharacters = atob(base64);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([byteNumbers], {
    type: contentType || 'application/octet-stream'
  });
}


async handleWordUploaded(event) {
  const { s3Url, filename, key, mode } = event.detail;

  try {
    const awsjson = JSON.stringify({
      key: key || null,
      url: s3Url,
      fileName: filename
    });

    // ✅ UPDATE path
    if (mode === 'update' && this.editingTemplateId) {
      await awsupdateTemplate({
        templateId: this.editingTemplateId,
        url: s3Url,
        awsjson: awsjson
      });

      this.showToast('Success', 'Template updated successfully', 'success');
    }
    // ✅ CREATE path
    else {
      await createTemplate({
        name: filename,
        type: 'Created Template',
        orgId: this.orgid,
        url: s3Url,
        awsjson: awsjson
      });

      this.showToast('Success', 'Template created successfully', 'success');
    }

    await this.refreshTemplates();
  } catch (err) {
    console.error(err);
    this.showToast('Error', err?.body?.message || 'Failed to save template record', 'error');
  }
}

closeWordEditor() {
  this.isWordEditorOpen = false;
  this.selectedDocxUrl = null;
  this.selectedTemplate = null; // optional
}






handleArchiveTemplate(event) {

    this.openConfirmation(

        'archive',

        event.currentTarget.dataset.id,

        event.currentTarget.dataset.name

    );
}


// handleArchiveTemplate(event) {
//     const templateId = event.currentTarget.dataset.id;
//     console.log('Archive clicked for:', templateId);



//     if (!templateId) {
//         this.showToast('Error', 'Template Id is missing', 'error');
//         return;
//     }

//     updateTemplateStatus({
//         templateId,
//         actionType: 'ARCHIVE'
//     })
//         .then(() => {
//             console.log('Template archived:', templateId);
//             this.showToast('Success', 'Template archived successfully', 'success');
//              return refreshApex(this.wiredTemplatesResult1);
//         })
//         .catch(error => {
//             console.error('Error archiving template:', error);
//             this.showToast('Error', error?.body?.message || 'Failed to archive template', 'error');
//         });
// }

async handleUnarchiveTemplate(event) {
    const templateId = event
        .currentTarget
        .dataset
        .id;
    console.log('Unarchive clicked for:', templateId);
    if (! templateId) {
        this.showToast('Error', 'Template Id is missing', 'error');
        return;
    }
    try {
        await updateTemplateStatus({templateId, actionType: 'UNARCHIVE'});
        console.log('Template unarchived:', templateId);
        this.showToast('Success', 'Template moved to Draft successfully', 'success');
        // Refresh main template table
        await refreshApex(this.wiredTemplatesResult1);
        // Reset pagination
        this.createdTemplatePageNumber = 1;
        this.createdTemplateTotalRecords = this.createdTemplateList.length;
        this.createdTemplateTotalPages = Math.ceil(this.createdTemplateTotalRecords / this.createdTemplatePageSize);
        this.updateCreatedTemplatePagination();
        // Refresh archived table
        await this.loadArchivedTemplates();
        // Reset archived pagination
        this.archivedTemplatePageNumber = 1;
        this.archivedTemplateTotalRecords = this.archivedTemplateListFiltered.length;
        this.archivedTemplateTotalPages = Math.ceil(this.archivedTemplateTotalRecords / this.archivedTemplatePageSize);
        this.updateArchivedPagination();
        // Optional:
        // close popup when no archived records remain
        if (this.archivedTemplateTotalRecords === 0) {
            this.showArchiveTemplatesModal = false;
        }
    } catch (error) {
        console.error('Error unarchiving template:', error);
        this.showToast('Error', error ?. body ?. message || 'Failed to unarchive template', 'error');
    }
}





@track showSendDocumentModal = false;
@track sendDocumentForm = {
    templateId: '',
    templateName: '',
    facilityId: '',
    recipientType: '',
    contactId: ''
};
@track showFacilityField = false;
@track showContactField = false;



async handleSendDocument(event) {

    const templateId = event.currentTarget.dataset.id;

    const templateRecord =
        this.createdTemplateList.find(t => t.Id === templateId);


    if (!templateRecord) {
        this.showToast(
            'Error',
            'Template record not found',
            'error'
        );
        return;
    }

    // Auto select from Template_Type__c
    const templateType =
        templateRecord.Template_Type__c || '';

    this.sendDocumentForm = {
        templateId: templateRecord.Id,
        templateName:
            templateRecord.Template_Name__c ||
            templateRecord.File_Name__c ||
            '',
        facilityId: '',
        recipientType: templateType,
        contactId: ''
    };

    // Reset dependent state
    this.selectedSendDocumentFacilities = [];
    this.staffOptions = [];
    this.participantContactOptions = [];

    // IMPORTANT → set UI visibility
    this.updateRecipientVisibility(templateType);

    // Load facilities once
    await this.loadFacilityOptions();

    switch (templateType) {

        case 'Participant':
            await this.loadParticipantAndContactOptions();
            break;

        case 'Staff':

            if (this.selectedSendDocumentFacilities?.length > 0) {
                await this.loadStaffOptions();
            }

            break;

        case 'Organisation':

            // Nothing to load
            break;

        default:

            this.sendDocumentForm = {
                ...this.sendDocumentForm,
                recipientType: ''
            };

            this.updateRecipientVisibility('');
    }

    this.showSendDocumentModal = true;

    console.log('Template Type:', templateType);

    console.log(
        'Facility Visible:',
        this.showFacilityField
    );

    console.log(
        'Contact Visible:',
        this.showContactField
    );
}

closeSendDocumentModal() {
    this.showSendDocumentModal = false;
}

handleSendDocumentFieldChange(event) {

    const field =
        event.target?.dataset?.field ||
        event.currentTarget?.dataset?.field;

    const value =
        event.detail?.value ??
        event.target?.value ??
        '';

    // Update generic field
    this.sendDocumentForm = {
        ...this.sendDocumentForm,
        [field]: value
    };

    if (field === 'recipientType') {

        // Reset common fields
        this.sendDocumentForm = {
            ...this.sendDocumentForm,
            recipientType: value,
            facilityId: '',
            contactId: ''
        };

        this.selectedSendDocumentFacilities = [];

        // Update UI visibility
        this.updateRecipientVisibility(value);

        switch (value) {

            case 'Participant':

                this.staffOptions = [];

                this.sendDocumentForm = {
                    ...this.sendDocumentForm,
                    facilityId: '',
                    contactId: ''
                };

                this.loadParticipantAndContactOptions();
                break;

            case 'Staff':

                this.participantContactOptions = [];

                this.sendDocumentForm = {
                    ...this.sendDocumentForm,
                    contactId: ''
                };

                if (this.selectedSendDocumentFacilities?.length > 0) {
                    this.loadStaffOptions();
                } else {
                    this.staffOptions = [];
                }

                break;

            case 'Organisation':

                // Hide both dropdowns
                this.staffOptions = [];
                this.participantContactOptions = [];

                this.sendDocumentForm = {
                    ...this.sendDocumentForm,
                    facilityId: '',
                    contactId: ''
                };

                break;

            default:

                this.staffOptions = [];
                this.participantContactOptions = [];

                this.sendDocumentForm = {
                    ...this.sendDocumentForm,
                    facilityId: '',
                    contactId: ''
                };
        }
    }

    console.log('field:', field);
    console.log('value:', value);
    console.log(
        'sendDocumentForm:',
        JSON.stringify(this.sendDocumentForm)
    );

    console.log(
        'showFacilityField:',
        this.showFacilityField
    );

    console.log(
        'showContactField:',
        this.showContactField
    );
}

updateRecipientVisibility(recipientType) {

    // Default
    this.showFacilityField = false;
    this.showContactField = false;

    switch (recipientType) {

        case 'Staff':
            this.showFacilityField = true;
            this.showContactField = true;
            break;

        case 'Participant':
            this.showFacilityField = false; // no facility
            this.showContactField = true;
            break;

        case 'Organisation':
            this.showFacilityField = false;
            this.showContactField = false;
            break;

        default:
            this.showFacilityField = false;
            this.showContactField = false;
    }

    console.log(
        'UI Visibility → Facility:',
        this.showFacilityField,
        'Contact:',
        this.showContactField
    );
}

// handleContinueToPreview() {
//     const recordId = this.sendDocumentForm?.templateId;

//     if (!recordId) {
//         this.showToast('Error', 'Record Id is missing.', 'error');
//         return;
//     }

//     console.log('sendDocumentForm:', JSON.stringify(this.sendDocumentForm));

//     this.selectedTemplate = JSON.stringify({
//         templateId: recordId,
//         senddocumenteditor: true,
//         sendDocumentForm: { ...this.sendDocumentForm }
//     });

//     this.showSendDocumentModal = false;
//     this.isTemplateModalOpen = false;
//     this.isCreateOptionsModalOpen = true;
// }

handleContinueToPreview() {
    const recordId = this.sendDocumentForm ?. templateId;
    if (! recordId) {
        this.showToast('Error', 'Record Id is missing.', 'error');
        return;
    }
    const recipientType = this.sendDocumentForm ?. recipientType;
    const contactId = this.sendDocumentForm ?. contactId;
    // VALIDATION
    if ((recipientType === 'Staff' || recipientType === 'Participant') && ! contactId) {
        this.showToast('Validation Error', 'Please select a contact.', 'error');
        return;
    }
    console.log('sendDocumentForm:', JSON.stringify(this.sendDocumentForm));
    this.selectedTemplate = JSON.stringify({
        templateId: recordId,
        senddocumenteditor: true,
        sendDocumentForm: {
            ...this.sendDocumentForm
        }
    });
    this.showSendDocumentModal = false;
    this.isTemplateModalOpen = false;
    this.isCreateOptionsModalOpen = true;
}



get recipientTypeOptions() {
    return [
        { label: 'Staff', value: 'Staff' },
        { label: 'Participant', value: 'Participant' },
        { label: 'Organisation', value: 'Organisation' }
    ];
}


@track facilityOptions = [];
@track finalListFacilities = [];
@track selectedSendDocumentFacilities = [];

@track staffOptions = [];
@track participantContactOptions = [];

loadFacilityOptions() {
    getFacilityData()
        .then(response => {
            console.log('Facility data fetched successfully:', JSON.stringify(response));

            this.facilityOptions = response.map(record => ({
                label: record.Name,
                value: record.Id,
                preferredName: record.Facility_Preferred_Name_Formula__c
            }));

            this.finalListFacilities = this.facilityOptions;
            console.log('finalListFacilities:', JSON.stringify(this.finalListFacilities));
        })
        .catch(error => {
            console.error('Error loading facilities:', error);
            this.facilityOptions = [];
            this.finalListFacilities = [];
        });
}

handleSendDocumentFacilityChange(event) {
    const selectedValues = event.detail?.value || event.detail || [];
    console.log('Selected facilities:', JSON.stringify(selectedValues));

    this.selectedSendDocumentFacilities = Array.isArray(selectedValues)
        ? selectedValues
        : [selectedValues];

    this.sendDocumentForm = {
        ...this.sendDocumentForm,
        facilityId: this.selectedSendDocumentFacilities.length
            ? this.selectedSendDocumentFacilities[0]
            : '',
        contactId: ''
    };

    console.log('Updated sendDocumentForm after facility change:', JSON.stringify(this.sendDocumentForm));

    if (this.sendDocumentForm.recipientType === 'Staff') {
        if (this.selectedSendDocumentFacilities.length > 0) {
            this.loadStaffOptions();
        } else {
            this.staffOptions = [];
        }
    }
}

loadStaffOptions() {
    if (!this.selectedSendDocumentFacilities ?. length) {
        this.staffOptions = [];
        return;
    }
    getStaffByFacilities({facIdlist: this.selectedSendDocumentFacilities}).then(result => {
        console.log('Staff fetched successfully', JSON.stringify(result));
        // force new reference
        this.staffOptions = [...result.map(staff => ({label: staff.NameToDisplay__c, value: staff.Id}))];
        console.log('Updated staffOptions', JSON.stringify(this.staffOptions));
    }).catch(error => {
        console.error(error);
        this.staffOptions = [];
    });
}


handleContactChange(event) {
    const value = event.detail?.value ?? event.detail ?? '';
    console.log('Selected contact:', value);

    this.sendDocumentForm = {
        ...this.sendDocumentForm,
        contactId: value
    };

    console.log('Updated sendDocumentForm after contact change:', JSON.stringify(this.sendDocumentForm));
}

get contactOptions() {
    let options = [];
    if (this.sendDocumentForm.recipientType === 'Staff') {
        options = this.staffOptions || [];
    } else if (this.sendDocumentForm.recipientType === 'Participant') {
        options = this.participantContactOptions || [];
    }
    console.log('contactOptions getter:', JSON.stringify(options));
    // force rerender for custom combobox
    return [... options];
}


loadParticipantAndContactOptions() {
    getParticipantAndContactOptions({
        orgId: this.orgid
    })
        .then(result => {
            console.log('Participant + Contact options fetched:', JSON.stringify(result));

            this.participantContactOptions = (result || []).map(item => ({
                label: item.label,
                value: item.value
            }));

            this.recipientOptionMap = {};
            (result || []).forEach(item => {
                this.recipientOptionMap[item.value] = item;
            });
        })
        .catch(error => {
            console.error('Error loading participant/contact options:', error);
            this.participantContactOptions = [];
            this.recipientOptionMap = {};
        });
}

fetchSelectedRecipientDetails() {
    const selectedId = this.sendDocumentForm.contactId;

    if (!selectedId || !this.recipientOptionMap[selectedId]) {
        this.selectedRecipientDetails = null;
        return;
    }

    const selectedEmail = this.recipientOptionMap[selectedId].email;

    if (!selectedEmail) {
        this.selectedRecipientDetails = null;
        console.warn('No email found for selected recipient');
        return;
    }

    getRecipientDetailsByEmail({
        email: selectedEmail,
        orgId: this.orgid
    })
        .then(result => {
            console.log('Recipient details fetched:', JSON.stringify(result));
            this.selectedRecipientDetails = result;
        })
        .catch(error => {
            console.error('Error fetching recipient details by email:', error);
            this.selectedRecipientDetails = null;
        });
}


handleSendToTsign(event) {

    const payload = {
        tsignreUrl: event.currentTarget.dataset.url,
        source: "HR",
        recordId: event.currentTarget.dataset.id,
        hrId: event.currentTarget.dataset.id,
        clientEmail: event.currentTarget.dataset.email
    };

    publish(
        this.messageContext,
        TSIGN_MESSAGE_CHANNEL,
        payload
    );

    console.log(
        "📨 Published HR payload:",
        payload
    );
}

handleDocumentSuccess() {

    console.log(
        '✅ Closing popup → Open My Templates'
    );

    this.isCreateOptionsModalOpen = false;
    this.isTemplateModalOpen = true;
     this.handleTemplates();
}

handleContinueToTsign(event) {

    console.log('🚀 Parent Continue to TSign clicked');
    console.log('📌 Received event:',JSON.stringify(event.detail));
    console.log('📌 pdfUrl:',event.detail.pdfUrl);
    console.log('📌 recordId:',event.detail.recordId);
    console.log('📧 clientEmail:',event.detail.clientEmail);

    const eventObj = {
        currentTarget: {
            dataset: {
                url: event.detail.pdfUrl,
                id: event.detail.recordId,
                email: event.detail.clientEmail
            }
        }
    };

    console.log('📨 Triggering handleSendToTsign with:',JSON.stringify(eventObj));
    this.handleSendToTsign(eventObj);
}

handleShare(event) {

    event.stopPropagation();

    this.selectedTemplateId = event.currentTarget.dataset.id;

    console.log('Template Id from UI:', this.selectedTemplateId);

    this.assignmentFlag = true;

    this.fetchStaffByTemplate(this.selectedTemplateId);
}

// fetchStaffUsers() {
//     getStaffOptions({templateId: this.selectedTemplateId})
//     .then(result => {this.filteredStaffOptions = result;})
//     .catch(error => {console.error(error);});
// }

fetchStaffByTemplate(templateId) {

    fetchStaffByTemplate({
        templateId: templateId
    })
    .then(result => {

        console.log(
            'Already Shared Staff:',
            JSON.stringify(result)
        );

        const selectedIds =
            result.map(rec => rec.Staff__c);

        this.selectedStaffIds = selectedIds;

        console.log(
            'Selected Staff:',
            JSON.stringify(this.selectedStaffIds)
        );

        // Load all staff options
        return getStaffOptions({
            templateId: templateId
        });

    })
    .then(result => {

        this.filteredStaffOptions = result;

        console.log(
            'Staff Options:',
            JSON.stringify(this.filteredStaffOptions)
        );

    })
    .catch(error => {

        console.error(error);

    });

}

handleStaffChange(event) {
    this.selectedStaffIds = event.detail.value;
}

handleassignmentinsert() {

    console.log('========== Save Template Shares ==========');
    console.log('Template Id:', this.selectedTemplateId);
    console.log('Selected Staff Ids:', this.selectedStaffIds);
    console.log('Selected Staff Ids (JSON):', JSON.stringify(this.selectedStaffIds));

    saveTemplateShares({
        templateId: this.selectedTemplateId,
        staffIds: this.selectedStaffIds
    })
    .then(() => {

        console.log('Template shares saved successfully.');

        console.log('Closing Grant Access popup...');

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Template shared successfully.',
                variant: 'success'
            })
        );
        this.assignmentFlag = false;

        console.log('assignmentFlag:', this.assignmentFlag);

    })
    .catch(error => {

        console.error('Error saving template shares:', error);

        if (error.body) {
            console.error('Error Body:', JSON.stringify(error.body));
        }

    });
}

handleShareClose() {

    console.log('========== Closing Grant Access Popup ==========');

    console.log('Selected Staff before clearing:',
        JSON.stringify(this.selectedStaffIds));

    this.assignmentFlag = false;
    this.selectedStaffIds = [];

    console.log('assignmentFlag:', this.assignmentFlag);
    console.log('Selected Staff after clearing:',
        JSON.stringify(this.selectedStaffIds));

}

@track showEmailModal = false;

@track toEmails = '';

@track ccEmails = '';

selectedEmailTemplateId = null;

@track selectedEmailDocumentUrl = '';


openEmailModal(event) {

    console.log(
        '📩 Email icon clicked'
    );

    console.log(
        'Dataset →',
        JSON.stringify(
            event.currentTarget.dataset
        )
    );

    this.selectedEmailTemplateId =
        event.currentTarget.dataset.id;

    this.selectedTemplateName =
        event.currentTarget.dataset.name;

    const email =
        event.currentTarget.dataset.email;

      this.selectedEmailDocumentUrl =
        event.currentTarget.dataset.url;

    console.log(
        'Template Id →',
        this.selectedEmailTemplateId
    );

    console.log(
        'Selected Template →',
        this.selectedTemplateName
    );

    console.log(
        'Recipient Email →',
        email
    );

    console.log(
        'AWS URL →',
        this.selectedEmailDocumentUrl
    );

    this.toEmails =
        email || '';

    this.ccEmails = '';

    this.showEmailModal = true;

    console.log(
        'Modal Opened →',
        this.showEmailModal
    );

    console.log(
        'TO Emails →',
        this.toEmails
    );
}

closeEmailModal() {

    this.showEmailModal = false;

    this.toEmails = '';

    this.ccEmails = '';

    this.selectedEmailTemplateId = null;
}

handleToEmailChange(event) {

    this.toEmails =
        event.target.value;
}

handleCcEmailChange(event) {

    this.ccEmails =
        event.target.value;
}

async handleSendEmail() {
    try {
        const toList = this
            .toEmails
            .split(',')
            .map(e => e.trim())
            .filter(Boolean);
        const ccList = this
            .ccEmails
            .split(',')
            .map(e => e.trim())
            .filter(Boolean);
        if (! toList.length) {
            this.showToast('Error', 'Please enter at least one recipient email', 'error');
            return;
        }
        console.log('📩 Sending Email');
        console.log('Template Id →', this.selectedEmailTemplateId);
        console.log('Template →', this.selectedTemplateName);
        console.log('TO →', JSON.stringify(toList));
        console.log('CC →', JSON.stringify(ccList));
        console.log('Document URL →', this.selectedEmailDocumentUrl);
        console.log('Org Id →', this.orgid);
        this.isLoading = true;
        const response = await sendTemplateEmail({
            toEmails: toList,
            ccEmails: ccList,
            templateName: this.selectedTemplateName,
            documentUrl: this.selectedEmailDocumentUrl,
            recipientName: toList[0] ?. split('@')[0] ?. replace(/\./g, ' '),
            orgId: this.orgid
        });
        console.log('✅ Email Response:', response);
        this.showToast('Success', 'Email sent successfully', 'success');
        this.closeEmailModal();
    } catch (error) {
        console.error('❌ Email Error:', JSON.stringify(error));
        this.showToast('Error', error ?. body ?. message || 'Unable to send email', 'error');
    } finally {
        this.isLoading = false;
    }
}

showConfirmationModal = false;
confirmationTitle = '';
confirmationMessage = '';
confirmButtonLabel = '';
pendingAction = null;
selectedTemplateId = null;
selectedTemplateKey = null;
selectedTemplateName = '';
openConfirmation(action, templateId, templateName = '', key = '') {
    this.pendingAction = action;
    this.selectedTemplateId = templateId;
    this.selectedTemplateKey = key;
    this.selectedTemplateName = templateName;
    const templateText = templateName
        ? ` '${templateName}'`
        : '';
    switch (action) {
        case 'archive':
            this.confirmationTitle = 'Archive Template';
            this.confirmationMessage = `Are you sure you want to archive template${templateText}?`;
            this.confirmButtonLabel = 'Archive';
            break;
        case 'delete':
            this.confirmationTitle = 'Delete Template';
            this.confirmationMessage = `Are you sure you want to delete template${templateText}?`;
            this.confirmButtonLabel = 'Delete';
            break;
        case 'deleteDocument':
            this.confirmationTitle = 'Delete Document';
            this.confirmationMessage = `Are you sure you want to delete document${templateText}?`;
            this.confirmButtonLabel = 'Delete';
            break;
    }
    this.showConfirmationModal = true;
}
handleConfirmAction() {
    this.showConfirmationModal = false;
    if (this.pendingAction === 'archive') {
        this.executeArchive();
    } else if (this.pendingAction === 'delete') {
        this.executeDelete();
    } else if (this.pendingAction === 'deleteDocument') {
        this.executeDeleteDocument();
    }
    this.pendingAction = null;
}

handleCancelAction() {
    this.showConfirmationModal = false;
    this.pendingAction = null;
}

executeArchive() {
    updateTemplateStatus({templateId: this.selectedTemplateId, actionType: 'ARCHIVE'}).then(() => {
        const name = this.selectedTemplateName;
        this.showToast(
            'Success',
            name
                ? `Template '${name}' has been archived successfully.`
                : 'Template has been archived successfully.',
            'success'
        );
        return refreshApex(this.wiredTemplatesResult1);
    }).catch(error => {
        this.showToast('Error', error ?. body ?. message || 'Failed to archive template', 'error');
    });
}
executeDelete() {
    deleteRecord(this.selectedTemplateId).then(() => {
        const name = this.selectedTemplateName;
        this.showToast(
            'Success',
            name
                ? `Template '${name}' has been deleted successfully.`
                : 'Template has been deleted successfully.',
            'success'
        );
        this.deleteFile(this.selectedTemplateKey);
        refreshApex(this.wiredTemplatesResult1);
    }).catch(() => {
        this.showToast('Error', 'Failed to delete template.', 'error');
    });
}
executeDeleteDocument() {
    deleteTemplate({templateId: this.selectedTemplateId}).then(() => {
        this.showToast(
            'Success',
            this.selectedTemplateName
                ? `Document '${
                    this.selectedTemplateName
                }' has been deleted successfully.`
                : 'Document has been deleted successfully.',
            'success'
        );
        this.deleteFile(this.selectedTemplateKey);
        return this.loadSavedTemplates();
    }).catch(error => {
        console.error('❌ Delete error:', error);
        this.showToast('Error', 'Failed to delete document.', 'error');
    });
}
showArchiveTemplatesModal = false;
archivedTemplateList = [];
archivedTemplateListFiltered = [];
archivedTemplateListPaginated = [];
archivedTemplatePageNumber = 1;
archivedTemplatePageSize = 5;
archivedTemplateTotalPages = 0;
archivedTemplateTotalRecords = 0;
async openArchivedTemplates() {
    this.showArchiveTemplatesModal = false;
    await this.loadArchivedTemplates();
    if (this.archivedTemplateTotalRecords > 0) {
        this.showArchiveTemplatesModal = true;
    } else {
        this.dispatchEvent(new ShowToastEvent({title: 'No Records', message: 'No archived templates found.', variant: 'warning'}));
        console.log('No archived templates → toast shown');
    }
}

closeArchivedTemplates() {
    this.showArchiveTemplatesModal = false;
}
async loadArchivedTemplates() {
    console.log('📡 getArchivedTemplates() called');
    try {
        const data = await getArchivedTemplates({orgId: this.orgid});
        console.log('Archived Templates:', JSON.stringify(data));
        this.archivedTemplateList = data.map(t => {
            const formattedDate = t.CreatedDate
                ? new Intl.DateTimeFormat('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).format(new Date(t.CreatedDate))
                : '';
            return {
                Id: t.Id,
                Template_Name__c: t.Template_Name__c || '',
                Template_Type__c: t.Template_Type__c || '',
                Status__c: t.Status__c || '',
                createdByName: t.CreatedBy ?. Full_Name__c || '',
                createdByInitials: t.CreatedBy ?. Full_Name__c
                    ? t
                        .CreatedBy
                        .Full_Name__c
                        .split(' ')
                        .filter(Boolean)
                        .map(x => x[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : '',
                createdDate: formattedDate,
                viewPayload: JSON.stringify(t)
            };
        });
        this.archivedTemplateListFiltered = [...this.archivedTemplateList];
        this.archivedTemplatePageNumber = 1;
        this.archivedTemplateTotalRecords = this.archivedTemplateListFiltered.length;
        this.archivedTemplateTotalPages = Math.ceil(this.archivedTemplateTotalRecords / this.archivedTemplatePageSize);
        this.updateArchivedPagination();
    } catch (error) {
        console.error('❌ Error loading archived templates:', error);
        this.archivedTemplateList = [];
        this.archivedTemplateListFiltered = [];
        this.archivedTemplateTotalRecords = 0;
        this.archivedTemplateTotalPages = 0;
    }
}
updateArchivedPagination() {
    const start = (this.archivedTemplatePageNumber - 1) * this.archivedTemplatePageSize;
    const end = start + this.archivedTemplatePageSize;
    this.archivedTemplateListPaginated = this.archivedTemplateListFiltered.slice(start, end);
    this.disableArchivedFirst = this.archivedTemplatePageNumber === 1;
    this.disableArchivedLast = this.archivedTemplatePageNumber === this.archivedTemplateTotalPages;
}
handleArchivedNext() {
    if (this.archivedTemplatePageNumber<this.archivedTemplateTotalPages

    ) {

        this.archivedTemplatePageNumber++;

        this.updateArchivedPagination();
    }
}

handleArchivedPrevious() {

    if (

        this.archivedTemplatePageNumber> 1) {
        this.archivedTemplatePageNumber --;
        this.updateArchivedPagination();
    }
}


handleBackFromTemplateEditor() {
    this.isTemplateModalOpen = true;
    this.isCreateOptionsModalOpen = false; // optional: close create view too
}


get pageSizeOptions() {
    return [10, 25, 50];
}

handleTemplatePageSizeChange(event) {
    this.templatePageSize = parseInt(event.target.value, 10);
    this.templatePageNumber = 1; // reset to first page
    this.updateTemplatePagination();
}

handleCreatedTemplatePageSizeChange(event) {
    this.createdTemplatePageSize = parseInt(event.target.value, 10);
    this.createdTemplatePageNumber = 1; // reset to first page
    this.updateCreatedTemplatePagination();
}

get templatePageSizeOptions() {
    return [10, 25, 50].map(size => ({
        label: String(size),
        value: size,
        selected: size === this.templatePageSize
    }));
}

get createdTemplatePageSizeOptions() {
    return [10, 25, 50].map(size => ({
        label: String(size),
        value: size,
        selected: size === this.createdTemplatePageSize
    }));
}
}