import { LightningElement, track, wire, api } from "lwc";
import UpdateFileSize from "@salesforce/apex/AgreementsHandler.UpdateFileSize";
import fetchRepositoryData from "@salesforce/apex/AgreementsHandler.fetchRepositoryData";
import deleteRepository from "@salesforce/apex/AgreementsHandler.deleteRepository";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import { RefreshEvent } from "lightning/refresh";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";
import checkSignatureStatus from "@salesforce/apex/AgreementsHandler.checkSignatureStatus";
import { publish, createMessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import getTemplates from "@salesforce/apex/tSignDocsController.getTemplatesCT";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
const MAX_FILE_SIZE = 100000000; //10mb
const MIN_FILE_SIZE = 1000; //10mb
const actions = [
  { label: "Edit", name: "edit" },
  { label: "Delete", name: "delete" }
];
const columns = [
  { label: "Name", fieldName: "Name" },
  { label: "Size", fieldName: "Size__c" },
  { label: "Comments", fieldName: "Comments__c" },
  { label: "User", fieldName: "User_Name__c" },
  {
    type: "action",
    typeAttributes: {
      rowActions: actions,
      menuAlignment: "right"
    }
  }
];

const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};

export default class ClientAttachment extends LightningElement {
  @api clientId;
  @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
  @track records = []; //All records available in the data table
  @track columns = []; //columns information available in the data table
  @track totalRecords = 0; //Total no.of records
  @track pageSize; //No.of records to be displayed per page
  @track totalPages; //Total no.of pages
  @track pageNumber = 1; //Page number
  @track recordsToDisplay = []; //Records to be displayed on the page
  context = createMessageContext();
  get bDisableFirst() {
    return this.pageNumber == 1;
  }
  get bDisableLast() {
    return this.pageNumber == this.totalPages;
  }
  @track recordId;
  @track noRecordsFlag = false;
  @track isOpenModal = false;
  @track isattachError = false;
  @track data;
  @track columns = columns;
  @track isEdit = false;
  @track isFileAttached = false;
  selectedFilesToUpload = []; //store selected files
  @track showSpinner = false; //used for when to show spinner
  @track fileName;
  @track doc;
  @track fileSize;
  @track UpdateDetails = false;
  @track tempConList = [];
  file; //holding file instance
  myFile;
  fileType; //holding file type
  fileReaderObj;
  base64FileData;
  @track imagelistFlag = true;
  @track templateList = [];
  @track fieldErrorMap = {};
  @track successmessage;
  @track orgid;

  fetchOrgId() {
    console.log("📡 Fetching organization details...");
    organizationDetails()
      .then((response) => {
        this.orgid = response?.listofPriceBook?.Id;
        console.log("✅ Org ID fetched:", this.orgid);
      })
      .catch((error) => {
        console.error("❌ Failed to fetch org ID:", error);
      });
  }

  @wire(getTemplates, { orgId: "$orgid" })
  wiredTemplates(result) {
    console.log("📡 @wire(getTemplates) called with orgId:", this.orgid);
    console.log("📡 Wire result object:", JSON.parse(JSON.stringify(result)));

    this.wiredTemplatesResult = result;
    const { data, error } = result;

    if (data) {
      console.log(
        `✅ Templates fetched successfully (${data.length} records):`,
        data
      );

      this.templateList = data.map((t) => ({
        id: t.Id,
        name: t.Document_Name__c,
        documentType: t.Document_Type__c,
        url: t.AWS_Document__c
      }));

      console.log(
        "📋 templateList after mapping:",
        JSON.parse(JSON.stringify(this.templateList))
      );
    } else if (error) {
      console.error(
        "❌ Error fetching templates via wire:",
        JSON.parse(JSON.stringify(error))
      );
    }
  }

  connectedCallback() {
    //alert ('Connect Callback Function : ' + this.clientId);
    this.fetchOrgId();
    this.fetchReplist();
  }

  handleErrorCss(event) {
    console.log("CHECKING");
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log("isValid", isValid);

    this.fieldErrorMap[field] = !isValid;
  }

  getFieldClass(fieldName) {
    return this.fieldErrorMap[fieldName] ? "floating-label1" : "floating-label";
  }
  get nameClass() {
    return this.getFieldClass("Name");
  }
  get userClass() {
    return this.getFieldClass("User__c");
  }

  fetchReplist() {
    if (this.isFetching) {
      console.warn("⚠️ Fetch already in progress, skipping duplicate call.");
      return;
    }
    this.isFetching = true; // Prevents multiple simultaneous fetches

    this.records = [];
    this.tempConList = new Set(); // Use Set to prevent duplicates

    fetchRepositoryData({ clientId: this.clientId })
      .then((result) => {
        if (result) {
          result.forEach((record) => {
            let tempConRec = {
              Id: record.Id, // Ensure unique identification
              Name: record.Name,
              comment: record.Comments__c,
              UserName: record.User_Name__c,
              Date: record.Date_Format__c,
              AmazonURL: record.Amazon_Url__c,
              key: record.key__c,
              fileSize: this.formatFileSize((record.Size__c))
            };

            this.tempConList.add(JSON.stringify(tempConRec)); // Convert object to string to avoid duplicate entries
          });

          this.records = Array.from(this.tempConList).map(JSON.parse); // Convert back to objects
          this.totalRecords = this.records.length; // Update total record count
          this.pageSize = this.pageSizeOptions[0]; // Set page size
          this.pageNumber = 1;

          this.paginationHelper(); // Call pagination logic
          this.fetchSignatureStatus();
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching repository data:", error);
        this.records = undefined;
      })
      .finally(() => {
        this.isFetching = false; // Reset flag after request completes
      });
  }

  RefreshAttachmentsData(event) {
    this.fetchReplist();
  }

  handleAgreement() {
    this.successmessage = "Service Aggrement created successfully.";
    this.isOpenModal = true;
    this.fieldErrorMap = {};
    this.isEdit = false;
    this.UpdateDetails = false;
    this.fileName = "";
    this.showUploadOptions = false;
    this.showUploadOptions1 = true;
    this.showFileUpload = false;
    this.isTemplatePickerOpen = false;
    this.useExistingTemplate = false;
    this.selectedTemplateUrl = "";
  }

  @track isSubmitDisabled = false;
  //DISABLE THIS AFTER IMPLEMENTING WORD IN TSIGN
  // onFileUpload(event) {
  //     this.isattachError = false;
  //     this.isFileAttached = true;
  //     this.isEdit = false;
  //     this.isSubmitDisabled = false;

  //     const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  //     if (event.target.files.length > 0) {
  //         console.log("File selected:", event.target.files[0]);

  //         this.showSpinner = true;
  //         this.selectedFilesToUpload = event.target.files;
  //         this.file = this.selectedFilesToUpload[0];
  //         this.fileName = this.file.name.replace(/\s+/g, ""); // Remove spaces
  //         this.fileType = this.file.type;
  //         this.fileSize = this.file.size;

  //         console.log(`File Details - Name: ${this.fileName}, Type: ${this.fileType}, Size: ${this.fileSize} bytes`);

  //         // Allow only PDF files
  //         if (this.fileType !== 'application/pdf' || !this.fileName.toLowerCase().endsWith('.pdf')) {
  //             console.error("File upload error: Only PDF files are allowed.");
  //             this.showToast('Error', 'Only PDF files are allowed.', 'error');
  //             this.showSpinner = false;
  //             this.isLoading = false;
  //             this.isSubmitDisabled = true;
  //             return;
  //         }

  //         // Validate file size (Max: 5MB)
  //         if (this.fileSize > MAX_FILE_SIZE) {
  //             console.error("File upload error: File size exceeds 5MB.");
  //             this.showToast('Error', 'File size must be 5MB or smaller.', 'error');
  //             this.showSpinner = false;
  //             this.isLoading = false;
  //             this.isSubmitDisabled = true;
  //             return;
  //         }
  //         this.isSubmitDisabled = false;
  //         console.log("File passed validation checks. Processing...");

  //         // Create an instance of FileReader
  //         this.fileReaderObj = new FileReader();

  //         // Callback function for fileReaderObj.readAsDataURL
  //         this.fileReaderObj.onloadend = (() => {
  //             let fileContents = this.fileReaderObj.result;
  //             fileContents = fileContents.substr(fileContents.indexOf(',') + 1);

  //             console.log("File successfully read as base64.");

  //             // Read the file chunkwise
  //             let sliceSize = 1024;
  //             let byteCharacters = atob(fileContents);
  //             let bytesLength = byteCharacters.length;
  //             let slicesCount = Math.ceil(bytesLength / sliceSize);
  //             let byteArrays = new Array(slicesCount);

  //             for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
  //                 let begin = sliceIndex * sliceSize;
  //                 let end = Math.min(begin + sliceSize, bytesLength);
  //                 let bytes = new Array(end - begin);

  //                 for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
  //                     bytes[i] = byteCharacters[offset].charCodeAt(0);
  //                 }
  //                 byteArrays[sliceIndex] = new Uint8Array(bytes);
  //             }

  //             console.log("File chunks successfully created.");

  //             // From arraybuffer, create a File instance
  //             this.myFile = new File(byteArrays, this.fileName, { type: this.fileType });

  //             console.log("File recreated from chunks:", this.myFile);

  //             // Callback for final base64 String format
  //             let reader = new FileReader();
  //             reader.onloadend = (() => {
  //                 let base64data = reader.result;
  //                 this.base64FileData = base64data.substr(base64data.indexOf(',') + 1);
  //                 console.log("Final base64 file data generated.");
  //             });

  //             reader.readAsDataURL(this.myFile);
  //         });

  //         this.fileReaderObj.readAsDataURL(this.file);
  //     }

  //     this.showSpinner = false;
  //     console.log("File upload process completed.");
  // }

  //ENABLE THIS AFTER IMPLEMENTING WORD IN TSIGN
  onFileUpload(event) {
    this.isattachError = false;
    this.isFileAttached = true;
    this.isEdit = false;
    //this.clientId=event.detail.id;
    // console.log('in files upload',event.target.files.length);
    if (event.target.files.length > 0) {
      this.showSpinner = true;
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
      this.fileType = this.selectedFilesToUpload[0].type;
      this.fileSize = this.selectedFilesToUpload[0].size;

      if (
        this.file.size > this.MAX_FILE_SIZE ||
        this.file.size < this.MIN_FILE_SIZE
      ) {
        this.isattachError = true;
      }
      //create an intance of File
      this.fileReaderObj = new FileReader();

      //this callback function in for fileReaderObj.readAsDataURL
      this.fileReaderObj.onloadend = () => {
        //get the uploaded file in base64 format
        let fileContents = this.fileReaderObj.result;
        fileContents = fileContents.substr(fileContents.indexOf(",") + 1);

        //read the file chunkwise
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
        //from arraybuffer create a File instance
        this.myFile = new File(byteArrays, this.fileName, {
          type: this.fileType
        });

        //callback for final base64 String format
        let reader = new FileReader();
        reader.onloadend = () => {
          let base64data = reader.result;
          this.base64FileData = base64data.substr(base64data.indexOf(",") + 1);
        };
        reader.readAsDataURL(this.myFile);
      };
      this.fileReaderObj.readAsDataURL(this.file);
    }
    this.showSpinner = false;
    //console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
  }
  get hasRecords() {
    return Array.isArray(this.data) && this.data.length > 0;
  }

  handleSubmit(event) {
    event.preventDefault(); // Always prevent default form submission

    const fields = event.detail.fields; // Must be declared early
    fields.Participant__c = this.clientId;

    // Track edit mode
    this.UpdateDetails = this.isEdit === true;

    // ✅ Case 1: Use Existing Template
    if (this.useExistingTemplate && this.selectedTemplateUrl) {
      fields.Amazon_Url__c = this.selectedTemplateUrl;
      fields.Size__c = this.selectedTemplateSize.toString();

      this.template.querySelector("lightning-record-edit-form").submit(fields);
      return;
    }

    // ✅ Case 2: No file and not editing — error
    if (!this.isFileAttached && !this.isEdit) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          variant: "error",
          message: "Attachment is mandatory"
        })
      );
      return;
    }

      fields.Amazon_Url__c = this.url;
      fields.Size__c = this.fileSize;
      fields.Aws_Json__c=JSON.stringify(this.uploadedFiles);
      fields.key__c=this.key;

    // ✅ Case 3: Upload new file or edit
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }

  //   handleSuccess(event) {
  //     // console.log(this.isEdit);
  //     //  console.log('base64>> ',this.base64FileData);
  //     this.recordId = event.detail.id;
  //     this.dispatchEvent(
  //       new ShowToastEvent({
  //         title: "Success!!",
  //         message: "Details Saved Successfully!!!",
  //         variant: "success"
  //       })
  //     );
  //     //alert('handleSuccess  ' + this.recordId);
  //     if (this.UpdateDetails == false) {
  //       //To update the filesize
  //       UpdateFileSize({ clientId: this.recordId, filesize: this.fileSize })
  //         .then((fileresult) => {
  //           // console.log('Updated file size = ' +fileresult);
  //         })
  //         .catch((error) => {
  //           window.console.log(error);
  //           this.dispatchEvent(
  //             new ShowToastEvent({
  //               title: "Error in uploading File",
  //               message: error.message,
  //               variant: "error"
  //             })
  //           );
  //         });
  //       //  console.log('in is edit false');
  //       this.showSpinner = true;
  //       //Uploading files to AWS S3 bucket
  //       uploadFile({
  //         base64: JSON.stringify(this.base64FileData),
  //         filename: this.fileName,
  //         recordId: this.recordId,
  //         obj: "agree"
  //       })
  //         .then((result) => {
  //           // console.log('Upload result = ' +result);
  //           this.fileName = this.fileName + " - Uploaded Successfully";
  //           //const myTimeout = setTimeout( this.createInvoices(), 10000);
  //           this.showSpinner = false;
  //           // Showing Success message after uploading
  //           this.dispatchEvent(
  //             new ShowToastEvent({
  //               title: "Success!!",
  //               message: this.file.name + " - Uploaded Successfully!!!",
  //               variant: "success"
  //             })
  //           );
  //         })
  //         .catch((error) => {
  //           // Error to show during upload
  //           //  window.console.log(error);
  //           this.dispatchEvent(
  //             new ShowToastEvent({
  //               title: "Error in uploading File",
  //               message: error.message,
  //               variant: "error"
  //             })
  //           );
  //           this.showSpinner = false;
  //         });
  //     }
  //     this.isOpenModal = false;
  //     this.isEdit = false;
  //     this.showSpinner = false;
  //     this.fetchReplist();
  //   }

  handleSuccess(event) {
    this.recordId = event.detail.id;

    this.dispatchEvent(
      new ShowToastEvent({
        title: "Success",
        message: this.successmessage,
        variant: "success"
      })
    );

    // ✅ Skip file upload if using an existing template
    if (this.UpdateDetails === false) {
      if (this.useExistingTemplate && this.selectedTemplateUrl) {
        // Just close the modal and refresh the list
        this.isOpenModal = false;
        this.isEdit = false;
        this.showSpinner = false;
        this.fetchReplist();
        return;
      }

      // ✅ Continue with file upload if file exists
      if (this.file && this.file.name) {
        // Update file size first
       /*  UpdateFileSize({ clientId: this.recordId, filesize: this.fileSize })
          .then(() => {
            this.showSpinner = true;

            // Upload file to AWS
            uploadFile({
              base64: JSON.stringify(this.base64FileData),
              filename: this.fileName,
              recordId: this.recordId,
              obj: "agree"
            })
              .then(() => {
                this.fileName = this.fileName + " - Uploaded Successfully.";
                this.showSpinner = false;

                this.dispatchEvent(
                  new ShowToastEvent({
                    title: "Success!!",
                    message: this.file.name + " Uploaded Successfully",
                    variant: "success"
                  })
                );

                this.fetchReplist();
              })
              .catch((error) => {
                this.showSpinner = false;
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: "Error in uploading File",
                    message: error.message,
                    variant: "error"
                  })
                );
              });
          })
          .catch((error) => {
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Error updating file size",
                message: error.message,
                variant: "error"
              })
            );
          }); */
          this.fetchReplist();
      }
    }

    // ✅ Cleanup modal regardless of path
    this.isOpenModal = false;
    this.isEdit = false;
    this.showSpinner = false;
  }

  /*  handleError(event) {
    alert(JSON.stringify(event.detail));
    this.showToast(event.detail.detail);
  } */
  handleError(event) {
    event.preventDefault(); // Prevent default UI (red errors under fields)
    this.removeRadius = true;
    this.fieldErrorMap = {};
    let message = "An unknown error occurred.";
    const detail = event.detail;
    const errorMessages = [];

    // 1. Record-level errors (e.g. from Apex)
    const recordErrors = detail?.output?.errors;
    if (recordErrors && recordErrors.length > 0) {
      recordErrors.forEach((err) => {
        if (err.message) {
          errorMessages.push(err.message);
        }
      });
    }

    // 2. Field-level errors (e.g. validation errors on fields)
    const fieldErrors = detail?.output?.fieldErrors;
    if (fieldErrors) {
      Object.keys(fieldErrors).forEach((fieldName) => {
        fieldErrors[fieldName].forEach((error) => {
          errorMessages.push(`${fieldName}: ${error.message}`);
        });
        this.fieldErrorMap[fieldName] = true;
      });
    }

    // 3. Top-level message fallback
    if (errorMessages.length === 0 && detail?.message) {
      errorMessages.push(detail.message);
    }

    // Final combined message
    message = errorMessages.join("\n");

    // 4. Show all errors as a toast
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Save Failed",
        message: message,
        variant: "error"
      })
    );
  }
  showToast(msg) {
    const event = new ShowToastEvent({
      title: "Error",
      message: msg,
      variant: "Error",
      mode: "dismissable"
    });
    this.dispatchEvent(event);
  }

  hideModalBox() {
    this.isOpenModal = false;
    this.isEdit = false;
    this.isFileAttached = false;
  }

  hanldeEdit(event) {
    this.isEdit = true;
    this.successmessage = "Service Aggrement updated successfully.";
    this.isFileAttached = false;
    this.recordId = event.currentTarget.dataset.id;
    
    //  console.log('Edit', this.recordId);
  }

  handleDelete(event) {
    this.recordId = event.currentTarget.dataset.id;
     const key = event.currentTarget.dataset.key;
    // console.log('Delete', this.recordId);
    this.delRep(this.recordId);
    this.deleteFile(key);
  }

  handleRowActions(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    this.recordId = row.Id;
    switch (actionName) {
      case "edit":
        this.isEdit = true;
        break;
      case "delete":
        this.delRep(row);
        break;
    }
  }

  delRep(currentRow) {
    deleteRepository({ repData: currentRow })
      .then((result) => {
        // window.console.log('result^^' + result);
        this.showLoadingSpinner = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success!!",
            message:  "service agreement deleted successfully.",
            variant: "success"
          })
        );
        this.fetchReplist();
      })
      .catch((error) => {
        // window.console.log('Error ====> ' + error);
        this.showLoadingSpinner = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error!!",
            message: JSON.stringify(error),
            variant: "error"
          })
        );
        this.fetchReplist();
      });
  }

  //Pagination code start
  handleRecordsPerPage(event) {
    this.pageSize = event.target.value;
    this.paginationHelper();
  }

  previousPage() {
    this.pageNumber = this.pageNumber - 1;
    this.paginationHelper();
  }

  nextPage() {
    this.pageNumber = this.pageNumber + 1;
    this.paginationHelper();
  }

  firstPage() {
    this.pageNumber = 1;
    this.paginationHelper();
  }

  lastPage() {
    this.pageNumber = this.totalPages;
    this.paginationHelper();
  }

  // JS function to handel pagination logic
  paginationHelper() {
    this.data = [];
    if (this.totalRecords > 0) {
      this.noRecordsFlag = false;
    } else {
      this.noRecordsFlag = true;
    }
    // calculate total pages
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    // set page number
    if (this.pageNumber <= 1) {
      this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
      this.pageNumber = this.totalPages;
    }
    // set records to display on current page
    for (
      let i = (this.pageNumber - 1) * this.pageSize;
      i < this.pageNumber * this.pageSize;
      i++
    ) {
      if (i === this.totalRecords) {
        break;
      }
      this.data.push(this.records[i]);
    }
    refreshApex(this.data);
    if (this.data.length > 0) {
      this.imagelistFlag = true;
    } else {
      this.imagelistFlag = false;
    }
  }

  formatFileSize(bytes) {
    //if (bytes < 1024) return bytes + " bytes";
    //else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
    //else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
     if (typeof bytes === "string" && (bytes.endsWith(" MB") || bytes.endsWith(" KB"))) {
        return bytes;
    }
    var marker = 1024; // Change to 1000 if required
    var decimal = 2; // Change as required
    var kiloBytes = marker; // One Kilobyte is 1024 bytes
    var megaBytes = marker * marker; // One MB is 1024 KB
    var gigaBytes = marker * marker * marker; // One GB is 1024 MB

    if (bytes < gigaBytes) return (bytes / megaBytes).toFixed(decimal) + " MB";
  }

  @track isModalOpen = false;
  @track currentUrl;

  handleView(event) {
    event.preventDefault();
    const url = event.currentTarget.dataset.url;
    this.currentUrl = url;
    const fileType = this.getFileType(this.currentUrl);

    // console.log('file type: ' + fileType);
    this.isModalOpen = true;
    // Check if the file type is not PNG or PDF
    if (
      fileType !== "png" &&
      fileType !== "pdf" &&
      fileType !== "jpeg" &&
      fileType !== "csv" &&
      fileType !== "svg"
    ) {
      setTimeout(() => {
        this.closeModal();
      }, 1700);
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentUrl = null;
  }

  getFileType(url) {
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  }
  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }

  fetchSignatureStatus() {
    console.log("🔄 Fetching signature status for attachments...");

    if (!this.data || this.data.length === 0) {
      console.warn("⚠️ No records found in service agreement table.");
      return;
    }

    let promises = this.data.map((attachment) => {
      console.log(
        `📄 Checking signature status for Record ID: ${attachment.Id}`
      );

      return checkSignatureStatus({ recordId: attachment.Id })
        .then((status) => {
          console.log(
            `✅ Signature status fetched for Record ID: ${attachment.Id}`,
            status
          );

          attachment.signatureStatus = status.isSigned ? "Signed⤋" : "T sign";
          attachment.signatureUrl = status.signatureUrl;
          attachment.buttonVariant = status.isSigned ? "success" : "brand";
          attachment.showPreview = !status.isSigned;

          console.log(`🔹 Updated Attachment:`, attachment);
        })
        .catch((error) => {
          console.error(
            `❌ Error fetching signature status for Record ID: ${attachment.Id}`,
            error
          );

          attachment.signatureStatus = "Tsign"; // Default to Tsign on error
          attachment.buttonVariant = "brand";
          attachment.showPreview = true;
        });
    });

    Promise.all(promises).then(() => {
      console.log("🔄 All signature statuses updated. Refreshing UI...");
      this.data = [...this.data]; // Trigger UI update
    });
  }

  handleTsign(event) {
    const tsignDocumentUrl = event.currentTarget.dataset.url;
    const recordId = event.currentTarget.dataset.id;
    const signatureUrl = event.currentTarget.dataset.signatureUrl;

    console.log("📌 AWS URL sent to Tsign:", tsignDocumentUrl);
    console.log("📌 Record ID sent to Tsign:", recordId);

    if (signatureUrl) {
      window.open(signatureUrl, "_blank");
    } else {
      const message = { tsignreUrl: tsignDocumentUrl, recordId: recordId };
      publish(this.context, TSIGN_MESSAGE_CHANNEL, message);
      this.dispatchEvent(new CustomEvent("redirecttsign"));
    }
  }

  handleUseTemplate(event) {
    const selectedTemplateUrl = event.currentTarget.dataset.url;
    console.log("📌 TEMPLATE URL", selectedTemplateUrl);
    const message = {
      tsignreUrl: selectedTemplateUrl,
      recordId: "template"
    };

    publish(this.context, TSIGN_MESSAGE_CHANNEL, message);
  }

  @track isTemplateModalOpen = false;
  openTemplateModal() {
    this.isTemplateModalOpen = true;
  }
  closeTemplateModal() {
    this.isTemplateModalOpen = false;
  }

  @track showUploadOptions = false;
  @track showFileUpload = false;
  @track isTemplatePickerOpen = false;
  @track useExistingTemplate = false;
  @track selectedTemplateUrl = "";
  selectedTemplateName = "";

  handleNewTemplateClick(event) {
    event.preventDefault();
    this.showUploadOptions = true;
    this.showUploadOptions1 = false;
    this.showFileUpload = false;
    this.isTemplatePickerOpen = false;
    this.useExistingTemplate = false;
              const inputEl = this.template.querySelector('input[type="file"]');
          if (inputEl) {
              inputEl.value = '';
              inputEl.click();
              console.log('triggerFileInput called111 ');
          } else {
              console.warn("⚠️ File input not found.");
          }
    // setTimeout(() => {
    //   this.triggerFileInput1();
    // }, 0);
  }
  handleUseExistingClick(event) {
    event.preventDefault();
    this.showUploadOptions = false;
    this.showUploadOptions1 = true;
    this.showFileUpload = false;
    this.isTemplatePickerOpen = true;
    this.useExistingTemplate = true;
  }
  handleSelectTemplate(event) {
    const selectedId = event.target.dataset.id;
    const selectedUrl = event.target.dataset.url;

    const selectedTemplate = this.templateList.find((t) => t.id === selectedId);

    if (selectedTemplate) {
      this.selectedTemplateUrl = selectedUrl;
      this.selectedTemplateName = selectedTemplate.name; // 🆕 display name
      this.useExistingTemplate = true;
      this.isTemplatePickerOpen = false; // 🆕 close template picker
      this.showUploadOptions = false;

      // Try fetching size from URL
      fetch(selectedUrl, { method: "HEAD" })
        .then((response) => {
          const size = response.headers.get("Content-Length");
          if (size) {
            this.selectedTemplateSize = parseInt(size);
            console.log("Selected template size:", this.selectedTemplateSize);
          }
        })
        .catch((error) => {
          console.error("Error fetching file size:", error);
          this.selectedTemplateSize = null;
        });
    }
  }

  showUploadChoiceOptions(event) {
    event.preventDefault(); // Prevent any unintended default actions
    this.showUploadOptions = true;
    this.showUploadOptions1 = false;
    this.showFileUpload = false;
    this.isTemplatePickerOpen = false;
    this.useExistingTemplate = false;
  }


   @track fileuploaded=false;
   @track isFileExpand1=false;
   @track isFileExpand=false;
   @track uploadedFiles=[];
   @track url;
   @track key;
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
              this.showUploadOptions = false;
              this.fileuploaded=true;
        } else if (
          this.fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || this.fileType === "application/msword"
        ) {
           this.isLoading = true;
          this.fileuploaded=false;
          console.log("📌 Processing Word file:", this.fileName);
          this.showUploadOptions = false;
          this.isFileExpand1 = true;
          
          await Promise.resolve();
          this.convertWordToPdf(event); // ✅ Convert Word to PDF
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
  
      convertWordToPdf(event){
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
             this.url=this.uploadedFiles[0].url;
             this.fileSize=this.uploadedFiles[0].size;
             this.key=this.uploadedFiles[0].key;
            
             
              console.log('  this.fileSize  : ',   this.fileSize);
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

            const originalName = this.uploadedFiles[0].originalName;
            const baseName = originalName.replace(/\.[^/.]+$/, ""); // removes existing extension
            this.fileName = `${baseName}.pdf`;

             this.url=this.uploadedFiles[0].url.pdfUrl;
             this.fileSize=this.uploadedFiles[0].size;
             this.key=this.uploadedFiles[0].key;
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
      this.showUploadOptions = true;

    }
  











}