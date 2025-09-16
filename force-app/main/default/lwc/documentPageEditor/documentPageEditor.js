import { LightningElement, wire, track, api } from "lwc";
import pdfjsLib from "@salesforce/resourceUrl/pdfJS";
import pdfWorker from "@salesforce/resourceUrl/pdfWorker";
import { loadScript } from "lightning/platformResourceLoader";
import { getRecord } from "lightning/uiRecordApi";
import USER_ID from "@salesforce/user/Id";
import FULL_NAME_FIELD from "@salesforce/schema/User.Full_Name__c";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getTemplates from "@salesforce/apex/tSignDocsController.getTemplates";
import createTemplate from "@salesforce/apex/tSignDocsController.createTemplate";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import PARTICIPANT_TEMPLATE_OBJECT from "@salesforce/schema/Participant_Template__c";
import DOCUMENT_TYPE_FIELD from "@salesforce/schema/Participant_Template__c.Document_Type__c";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import updateTemplate from "@salesforce/apex/tSignDocsController.updateTemplate";
import deleteTemplate from "@salesforce/apex/tSignDocsController.deleteTemplate";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";

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
  renderedCallback() {
    if (!window.pdfjsLib) {
      console.log("📦 Loading PDF.js libraries...");
      Promise.all([loadScript(this, pdfjsLib), loadScript(this, pdfWorker)])
        .then(() => {
          console.log("✅ PDF.js and worker loaded");
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
        })
        .catch((err) => {
          console.error("❌ Failed to load PDF libraries:", err);
        });
    }
  }

  async handleFileUploadOrg(event) {
    console.log("📥 handleFileUpload() triggered");
    const uploadedFiles = event.target.files;
    if (!uploadedFiles.length) return;
    this.isFileUploaded = true;

    const allTasks = [];

    for (let file of uploadedFiles) {
      const extension = file.name.split(".").pop().toLowerCase();
      const currentBatch = this.batchCounter++;
      console.log(`📁 File selected: ${file.name} (Batch ${currentBatch})`);

      if (extension === "pdf") {
        // Wrap processPdf in a Promise for uniformity
        allTasks.push(this.processPdf(file, currentBatch));
      } else if (extension === "docx") {
        allTasks.push(this.convertWordToPdf(file, file.name, currentBatch));
      } else {
        console.warn("❗ Unsupported file type:", extension);
      }
    }

    try {
      await Promise.all(allTasks);
      console.log("✅ All files (PDFs & DOCXs) fully processed.");
    } catch (error) {
      console.error("❌ One or more files failed:", error);
    }
  }

  async processPdf(fileOrUrl, batchIndex) {
    console.log("📄 processPdf() called");
    this.isLoading = true;
    try {
      let loadingTask;

      // Detect if input is a string (URL) or File object
      if (typeof fileOrUrl === "string") {
        console.log(`🌐 Loading PDF from remote URL: ${fileOrUrl}`);
        loadingTask = window.pdfjsLib.getDocument(fileOrUrl);
      } else {
        console.log(`📂 Loading PDF from local file: ${fileOrUrl.name}`);
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(fileOrUrl);
        });

        const binaryData = this.base64ToUint8Array(base64.split(",")[1]);
        loadingTask = window.pdfjsLib.getDocument({ data: binaryData });
      }

      this.pdfDoc = await loadingTask.promise;
      const totalPages = this.pdfDoc.numPages;

      console.log(
        `📄 PDF loaded with ${totalPages} pages (Batch ${batchIndex})`
      );

      const imagePromises = [];
      for (let i = 1; i <= totalPages; i++) {
        imagePromises.push(this.renderPageAsImage(i, batchIndex, i));
      }

      const newPages = await Promise.all(imagePromises);
      this.pageImages = [...this.pageImages, ...newPages];

      console.log(
        `🖼️ Rendered ${newPages.length} pages from Batch ${batchIndex}`
      );
    } catch (err) {
      console.error("❌ PDF Load Error:", err);
    } finally {
      this.isLoading = false;
    }
  }

  base64ToUint8Array(base64) {
    const raw = atob(base64);
    const uint8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      uint8Array[i] = raw.charCodeAt(i);
    }
    return uint8Array;
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

  async convertWordToPdf(file, fileName, batchIndex) {
    console.log("📥 [DOCX] Starting Word to PDF conversion:", fileName);

    return new Promise((resolve, reject) => {
      this.isLoading = true;

      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64WordFile = reader.result.split(",")[1];

          if (!base64WordFile) {
            console.error("❌ Base64 extraction failed for:", fileName);
            this.isLoading = false;
            return reject("Base64 extraction failed");
          }

          console.log(`📤 Sending to conversion API: ${fileName}`);
          const response = await fetch(
            "https://tesseractapps.com/word-to-pdf",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recordId: this.orgid || "NA",
                base64WordFile,
                fileName
              })
            }
          );

          const data = await response.json();
          console.log("📡 API response:", data);

          if (!data || !data.pdfUrl) {
            console.error("❌ No valid pdfUrl returned from API", data);
            this.isLoading = false;
            return reject("Invalid conversion API response");
          }

          const pdfUrl = data.pdfUrl;
          console.log(`✅ Received PDF URL: ${pdfUrl}`);

          // 🔍 Check if the PDF URL is reachable
          try {
            const testRes = await fetch(pdfUrl, { method: "HEAD" });
            if (!testRes.ok) {
              console.error(
                "❌ PDF URL not reachable (HEAD check):",
                testRes.status
              );
              this.isLoading = false;
              return reject(`PDF not accessible: ${testRes.status}`);
            }
          } catch (fetchErr) {
            console.error("❌ PDF URL fetch test failed:", fetchErr);
            this.isLoading = false;
            return reject("PDF fetch failed");
          }

          // ✅ Call processPdf
          console.log("📄 Calling processPdf() with remote PDF...");
          try {
            await this.processPdf(pdfUrl, batchIndex);
            console.log("✅ processPdf() completed successfully.");
          } catch (processErr) {
            console.error("❌ processPdf() threw an error:", processErr);
            return reject("PDF rendering failed");
          }

          resolve(); // done!
        } catch (outerErr) {
          console.error(
            "❌ Exception during Word-to-PDF conversion:",
            outerErr
          );
          reject(outerErr);
        } finally {
          this.isLoading = false;
        }
      };

      reader.onerror = (e) => {
        console.error("❌ FileReader failed:", e);
        this.isLoading = false;
        reject("FileReader failed");
      };

      try {
        reader.readAsDataURL(file);
        console.log("📚 FileReader started reading file...");
      } catch (e) {
        console.error("❌ FileReader crashed:", e);
        this.isLoading = false;
        reject("FileReader exception");
      }
    });
  }

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

  handleGenerateNewPdf() {
    if (!this.pageImages.length) {
      console.warn("⚠️ No pages to export");
      return;
    }

    this.isLoading = true;
    console.log("🛠️ Generating new PDF from", this.pageImages.length, "pages");

    Promise.all([
      loadScript(this, "/resource/jspdf"),
      loadScript(this, "/resource/html2canvas")
    ])
      .then(() => {
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

        const pdfBlob = doc.output("blob");

        if (pdfBlob.size > 10 * 1024 * 1024) {
          console.warn("❌ PDF exceeds 10MB, aborting save.");
          this.showToast(
            "Error",
            "Generated PDF exceeds 10MB limit. Please remove pages or compress input.",
            "error"
          );
          this.isLoading = false;
          return;
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

        // ✅ Convert to base64
        doc.output("datauristring", { filename: fileName });
        const base64String = btoa(doc.output()); // or use from blob if needed

        // Store for later upload
        this.base64FileData = base64String;
        this.fileName = fileName;

        // ✅ Show modal to collect name/type before upload
        this.templateName = "";
        this.templateDocumentType = "Created Template";
        this.isPdfMetaModalOpen = true;

        this.isLoading = false;

        console.log(
          `✅ PDF prepared as '${fileName}', waiting for user input to upload`
        );
      })
      .catch((err) => {
        console.error("❌ PDF Generation Error:", err);
        this.isLoading = false;
      });
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
  openZoom(event) {
    const id = event.currentTarget.dataset.id;
    const index = this.pageImages.findIndex((p) => p.id == id);

    console.log(`🔍 Zoom requested for page ID: ${id}`);

    if (index !== -1) {
      this.zoomedPage = this.pageImages[index];
      this.isZoomOpen = true;
      console.log(
        `✅ Zoom modal opened for page ${this.zoomedPage.pageNumber} (${this.zoomedPage.zoomoutClass})`
      );
    } else {
      console.warn(`⚠️ Page with ID ${id} not found for zoom.`);
    }
  }

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
  openAddTemplateModal() {
    console.log("📨 opening template...");
    this.isTemplateAddModalOpen = true;
  }
  openTemplateModal() {
    this.isTemplateModalOpen = true;
    this.loadTemplates();
  }
  createTemplate() {
    this.isCreateOptionsModalOpen = true;
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
          return updateTemplate({
            templateId: newTemplateId,
            name: this.templateName,
            type: this.templateDocumentType,
            awsUrl: this.convertedPdfUrl // ✅ Ensure APEX supports this param
          });
        } else if (hasPdfFile) {
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
        } else {
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

  handleEditTemplate(event) {
    const templateId = event.currentTarget.dataset.id;
    const template = this.templateList.find((t) => t.id === templateId);

    if (template) {
      this.editingTemplateId = template.id;
      this.templateName = template.name;
      this.templateDocumentType = template.documentType;
      this.isTemplateAddModalOpen = true;
      this.isEditingTemplate = true;
    }
  }
  handleDeleteTemplate(event) {
    const templateId = event.currentTarget.dataset.id;

    deleteTemplate({ templateId })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Deleted",
            message: "Template deleted successfully.",
            variant: "success"
          })
        );
        refreshApex(this.wiredTemplatesResult); // Refresh the table
      })
      .catch((error) => {
        console.error("❌ Delete error:", error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: "Failed to delete template.",
            variant: "error"
          })
        );
      });
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

  handleViewTemplate(event) {
    const templateId = event.currentTarget.dataset.id;
    const selectedTemplate = this.templateList.find((t) => t.id === templateId);

    if (selectedTemplate && selectedTemplate.AWS_Document__c) {
      this.popSelectedTemplateName = selectedTemplate.name;
      this.popSelectedDocumentType = selectedTemplate.documentType;
      this.isPopPdfPreviewOpen = true;

      // Convert PDF to images
      this.popRenderPdfAsImages(selectedTemplate.AWS_Document__c);
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "No PDF document available for this template.",
          variant: "error"
        })
      );
    }
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

  // handleViewTemplate(event) {
  //   const templateId = event.currentTarget.dataset.id;
  //   const selectedTemplate = this.templateList.find((t) => t.id === templateId);

  //   if (selectedTemplate && selectedTemplate.AWS_Document__c) {
  //     this.selectedTemplateName = selectedTemplate.name;
  //     this.selectedDocumentType = selectedTemplate.documentType;
  //     this.pdfViewerUrl1 = selectedTemplate.AWS_Document__c;
  //     this.isPdfViewerVisible1 = true;
  //   } else {
  //     this.dispatchEvent(
  //       new ShowToastEvent({
  //         title: "Error",
  //         message: "No PDF document available for this template.",
  //         variant: "error"
  //       })
  //     );
  //   }
  // }
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

  @wire(getTemplates, { orgId: "$orgid" })
  wiredTemplates(result) {
    console.log("📡 @wire(getTemplates) called");
    this.wiredTemplatesResult = result;

    const { data, error } = result;

    if (data) {
      console.log("✅ Templates fetched successfully:", data);

      this.templateList = data.map((t) => ({
        id: t.Id,
        name: t.Document_Name__c,
        documentType: t.Document_Type__c,
        AWS_Document__c: t.AWS_Document__c
      }));

      // Filter and split
      this.templateListFiltered = this.templateList.filter(
        (t) => t.documentType !== "Created Template"
      );
      this.createdTemplateList = this.templateList.filter(
        (t) => t.documentType === "Created Template"
      );

      // Init pagination
      this.templatePageNumber = 1;
      this.createdTemplatePageNumber = 1;

      this.templateListTotalRecords = this.templateListFiltered.length;
      this.createdTemplateTotalRecords = this.createdTemplateList.length;

      this.templateTotalPages = Math.ceil(
        this.templateListTotalRecords / this.templatePageSize
      );
      this.createdTemplateTotalPages = Math.ceil(
        this.createdTemplateTotalRecords / this.createdTemplatePageSize
      );

      this.updateTemplatePagination();
      this.updateCreatedTemplatePagination();
    } else if (error) {
      console.error("❌ Error fetching templates via wire:", error);
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
  updateCreatedTemplatePagination() {
    const search = this.searchCreatedKeyword.toLowerCase();

    const filtered = this.createdTemplateList.filter((tpl) =>
      tpl.name?.toLowerCase().includes(search)
    );

    this.createdTemplateTotalRecords = filtered.length;
    this.createdTemplateTotalPages = Math.ceil(
      this.createdTemplateTotalRecords / this.createdTemplatePageSize
    );

    const start =
      (this.createdTemplatePageNumber - 1) * this.createdTemplatePageSize;
    const end = start + this.createdTemplatePageSize;
    this.createdTemplateListPaginated = filtered.slice(start, end);

    this.disableCreatedTemplateFirst = this.createdTemplatePageNumber === 1;
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

  handleTemplates(event) {
    this.templatesFlag = true;
    this.createtemplatesFlag = false;
  }
  handleCreatedTemplates(event) {
    this.createtemplatesFlag = true;
    this.templatesFlag = false;
  }

  @track isPdfMetaModalOpen = false;
  @track templateName = "";
  @track base64FileData;
  @track fileName;

  closePdfMetaModal() {
    this.isPdfMetaModalOpen = false;
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
        orgId: this.orgid
      });

      // 2. Upload the PDF to AWS with reference to that record
      await uploadFile({
        base64: JSON.stringify(this.base64FileData),
        filename: this.fileName,
        recordId: newTemplateId,
        obj: "ParticipantTemplate"
      });

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
}