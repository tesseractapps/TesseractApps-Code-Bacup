import { LightningElement, track, wire, api } from 'lwc';
import UpdateFileSize from '@salesforce/apex/ClientAttachmentHandler.UpdateFileSize';   
import fetchRepositoryData from '@salesforce/apex/ClientAttachmentHandler.fetchRepositoryData';
import deleteRepository from '@salesforce/apex/ClientAttachmentHandler.deleteRepository';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';  
import { RefreshEvent } from 'lightning/refresh';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import LightningConfirm from 'lightning/confirm';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import attachmentType from '@salesforce/schema/Attachment__c.Type__c';
//import getPrivilegeData from "@salesforce/apex/SecurityPrivilege.getPrivilegeData";
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import fetchStaffByDoc from '@salesforce/apex/ClientAttachmentHandler.fetchStaffByDoc';
import saveParticipantDocShares from '@salesforce/apex/ClientAttachmentHandler.saveParticipantDocShares';
import fetchAttachmentsForStaff from '@salesforce/apex/ClientAttachmentHandler.fetchAttachmentsForStaff';
import fetchClientAttachmentsSecure from '@salesforce/apex/ClientAttachmentHandler.fetchClientAttachmentsSecure';

const actions = [   
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }
 ];
 const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Type', fieldName: 'Type__c' },
    { label: 'Size', fieldName: 'Size__c' },
    { label: 'Comments', fieldName: 'Comments__c' },
    { label: 'User', fieldName: 'USer_Name__c' },
    { label: 'Date', fieldName: 'Date__c' },
    {
        type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'right'
        }
    }
 ];

export default class ClientAttachment extends LightningElement {
    // JS Properties 
    @api clientId;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track recordId;
    @track isOpenModal=false; 
    @track isattachError=false;
    @track data;
    @track columns = columns;
    @track isEdit=false;
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; //used for when to show spinner
    @track fileName;
    @track doc;
    @track fileSize;
    @track UpdateDetails = false;
    @track tempConList = [];
    @track timeoutId;
    @track noRecordsFlag=false;
    @track successmessage;
    file; //holding file instance
    myFile;    
    fileType;//holding file type
    fileReaderObj;
    base64FileData;
    @track editFlag=false;;
    @track deleteFlag=false;
    @track viewFlag=false;  
    wiredSecurityResult;
    @track finalSecurityResult=[];
    @track textboxFlag = false;
    @track currentUserId = Id;
    @track isHome = true;
    @track fieldErrorMap = {};

    @track assignmentFlag = false;
    @track currentDocumentId;
    @track filteredStaffOptions = [];
    @track selectedStaffIds = [];
    @track staffOptions = [];
    @track showPermissionIcon = false;
    
    @track uploadedFile = null;
    @track isFileExpand = false;//manendra
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }  
   
    connectedCallback() {       
        this.fetchReplist();
    }

    changeExpense(event){        
        if (event.detail.value == 'Other') {
            this.textboxFlag = true;
        } else{
            this.textboxFlag = false;
        } 
    }
    fetchReplist() {

        console.log('================ FETCH START =================');

        getCurrentLoggedUserInfo()
            .then(user => {

                console.log('🔵 User Info:', JSON.stringify(user));

                this.currentUserType = user.User_Type__c;

                return Promise.all([
                    fetchAttachmentsForStaff({ clientId: this.clientId }),
                    fetchClientAttachmentsSecure({ clientId: this.clientId })
                ]);
            })

            .then(([ownDocs, sharedDocs]) => {

                console.log('🟢 OWN DOCS:', JSON.stringify(ownDocs));
                console.log('🟣 SHARED DOCS:', JSON.stringify(sharedDocs));

                const combined = [
                    ...(ownDocs || []),
                    ...(sharedDocs || [])
                ];

                console.log('🟡 COMBINED BEFORE DEDUPE:', JSON.stringify(combined));

                // 🔥 remove duplicates
                const map = new Map();
                combined.forEach(rec => map.set(rec.Id, rec));

                const finalList = Array.from(map.values());

                console.log('🟢 FINAL LIST:', JSON.stringify(finalList));

                // 🔥 CRITICAL FIX → force reactivity
                this.records = [];
                this.totalRecords = 0;

                // 🔥 force UI refresh cycle
                setTimeout(() => {

                  this.records = finalList.map(record => {

    console.log('DEBUG Size from DB:', record.Size__c); // ✅ add here

    return {
        Id: record.Id,
        Name: record.Name,
        type: record.Type__c,
        comment: record.Comments__c,
        UserName: record.USer_Name__c,
        Date: record.Date_Format__c,
        AmazonURL: record.Amazon_file_URL__c,
       fileSize: this.formatFileSize(record.Size__c),
        Key: record.Key__c
    };
});

                    this.totalRecords = this.records.length;

                    // 🔥 ensure pagination variables reset
                    this.pageSize = this.pageSizeOptions[0];
                    this.pageNumber = 1;

                    console.log('🟢 RECORDS SET:', JSON.stringify(this.records));

                    this.paginationHelper();

                }, 0); // microtask delay forces re-render
            })

            .catch(error => {
                console.error('❌ ERROR:', error);
            });
    }

    @track isOrgName;
    @track currentUserRole;
    @track isStaff=false;
   // @track attachType;
    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserType]}) 
    currentUserInfo({error, data}) { 
        if (data) {
            this.currentUserRole =data.fields.User_Role__c.value;
            this.userType = data.fields.User_Type__c.value;
            this.userType = data.fields.User_Type__c.value;
            //this.attachmentType = data.fields.Type__c.value;
            
            console.log('current logged in user==>'+this.currentUserRole);

            // ✅ CONDITION
            if (
                this.userType === 'NDIS Participants' ||
                this.userType === 'NDIS Staff'
            ) {
                this.showPermissionIcon = false;
            } else {
                this.showPermissionIcon = true;
            }
            if(this.currentUserRole =='Portal Account Partner Executive' || this.currentUserRole =='CEO' || this.currentUserRole =='Admin' ||this.currentUserRole =='Portal Account Partner Manager'){
                this.isStaff = true;
            } else if(this.currentUserRole =='Portal Account Partner User'){
                this.isStaff = false;
            } 
        } else if (error) {
            this.usererror = error ;
        }
    }
     

    RefreshAttachmentsData(event)
    {
        this.fetchReplist();        
    }

    handleAttachment(){
        this.fieldErrorMap ={};
        this.successmessage='Attachment created successfully.';
        this.isOpenModal=true;
        this.isEdit=false;
        this.UpdateDetails = false;
        this.fileName='';
    }

    async handleSubmit(event){
    event.preventDefault();
    if (this.isEdit == true){
        this.UpdateDetails = true;            
    } else {
        this.UpdateDetails = false;                  
    }
    // ✅ validation (unchanged)
    if(!(this.isFileAttached) && !(this.isEdit)){     
        this.dispatchEvent(  
            new ShowToastEvent({
                title: 'Error',
                variant: 'error',  
                message: 'Upload file is mandatory',  
            }),  
        );
        return;
    }

    const fields = event.detail.fields;

    // ✅ If new file uploaded → prepare fields
    if (this.uploadedFile) {
        fields.Amazon_file_URL__c = this.uploadedFile.url;
       fields.Size__c = String(this.uploadedFile.size) || 0;
        fields.Key__c = this.uploadedFile.key;
    }

    fields.Added_By__c = this.clientId;

    // ✅ DELETE ONLY HERE (SAFE POSITION)
    if (this.isEdit && this.uploadedFile && this.oldFileKey) {
        await this.deleteOldFileFromAWS(this.oldFileKey);
    }

    this.template.querySelector('lightning-record-edit-form').submit(fields);

    console.log('Attachment data : '+JSON.stringify(fields));

    this.isOpenModal = false;      
    this.isEdit = false;
}  

/*   
 handleSuccess(event){

    this.recordId = event.detail.id;

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success!!',
            message: this.successmessage,
            variant: 'success',
        }),
    ); 

    // ✅ Only update size (no upload here anymore)
    if(this.UpdateDetails == false && this.uploadedFile){

        UpdateFileSize({
            clientId : this.recordId,
            filesize : this.uploadedFile.size
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating file size',
                    message: error.message,
                    variant: 'error',
                }),
            );
        });
    }

    this.isOpenModal = false;
    this.isEdit = false;        
    this.showSpinner = false;  

    this.fetchReplist();
} */
handleSuccess(event) {
    this.recordId = event.detail.id;

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success!!',
            message: this.successmessage,
            variant: 'success',
        })
    );

    this.isOpenModal = false;
    this.isEdit = false;
    this.showSpinner = false;

    // NEW: only fetch AFTER UpdateFileSize completes (for create flow)
    if (this.UpdateDetails === false && this.uploadedFile) {
        UpdateFileSize({
            clientId: this.recordId,
            filesize: this.uploadedFile.size
        })
        .then(() => {
            this.fetchReplist(); // ✅ runs AFTER size is written to DB
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating file size',
                    message: error.message,
                    variant: 'error',
                })
            );
            this.fetchReplist(); // ✅ still refresh even if size update fails
        });

    } else {
        // Edit flow or no file uploaded — safe to refresh immediately
        this.fetchReplist();
    }
}

     handleError(event) {
    event.preventDefault(); // Prevent default UI (red errors under fields)
    this.removeRadius = true;
    this.fieldErrorMap = {};
    let message = 'An unknown error occurred.';
    const detail = event.detail;
    const errorMessages = [];
    
    // 1. Record-level errors (e.g. from Apex)
    const recordErrors = detail?.output?.errors;
    if (recordErrors && recordErrors.length > 0) {
        recordErrors.forEach(err => {
            if (err.message) {
                errorMessages.push(err.message);
            }
        });
    }

    // 2. Field-level errors (e.g. validation errors on fields)
    const fieldErrors = detail?.output?.fieldErrors;
    if (fieldErrors) {
        Object.keys(fieldErrors).forEach(fieldName => {
            fieldErrors[fieldName].forEach(error => {
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
    message = errorMessages.join('\n');
       
     
    // 4. Show all errors as a toast
     this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
           
        })
    ); 
}


    showToast(msg){
        const event = new ShowToastEvent({
            title: 'Error',
            message: msg,
            variant: 'Error',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    hideModalBox(){
        this.isOpenModal=false; 
        this.isEdit=false;  
        this.isFileAttached=false; 
        this.uploadedFile = null;
this.isFileExpand = false;     
    }

    handleEdit(event)    {        
        this.isEdit=true;
        this.successmessage='Attachment updated successfully.';
        this.isFileAttached=false;
        this.recordId = event.currentTarget.dataset.id;
       this.oldFileKey = event.currentTarget.dataset.key;
        this.uploadedFile = null;
        this.fileName = '';
        this.isFileExpand = false;   
         this.isattachError = false;  
    }
    @track deleteFlag =false;
     handleDelete(event){
        this.recordId = event.currentTarget.dataset.id;
        this.deleteFlag= true;

    }
    handledeletefile(){
        this.delRep(this.recordId);  
            this.fetchReplist(); 
            this.deleteFlag= false;
    }
    handleclose(){
        this.deleteFlag= false;
    }

    handleRowActions(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        this.clientId = row.Id;
        switch (actionName) {        
            case 'edit':          
                this.isEdit=true;
                break;
            case 'delete':
                this.delRep(row);
                break;
        }
    }    

    delRep(currentRow) {
        deleteRepository({ repData: currentRow }).then(result => {
           // window.console.log('result^^' + result);
            this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!!',
                message: 'Attachment deleted successfully!!.',
                variant: 'success'
            }));            
        }).catch(error => {
           // window.console.log('Error ====> ' + error);
            this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!',
                message: JSON.stringify(error),
                variant: 'error'
            }));            
        });    
    }

    handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
   }

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label';
    }
    get userClass() {
        return this.getFieldClass('User__c');
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
        if(this.totalRecords>0) {
                                 this.noRecordsFlag=false;
                             }else{
                                 this.noRecordsFlag=true;
                             } 
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.data.push(this.records[i]);
        } 
        refreshApex(this.data);
    }

    formatFileSize(bytes) {
    if (!bytes) return '0 MB';

    // Already a formatted string (legacy records like "9.65 KB" or "8.66 MB")
    if (typeof bytes === 'string' && isNaN(bytes)) {
        return bytes;
    }

    // Raw bytes (new records)
    bytes = Number(bytes);
    if (isNaN(bytes) || bytes === 0) return '0 MB';

    var marker = 1024;
    var decimal = 2;
    var megaBytes = marker * marker;
    return (bytes / megaBytes).toFixed(decimal) + ' MB';
}

    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        console.log('url '+this.currentUrl);

        this.isModalOpen = true;
        this.isHome = false;
        const fileType = this.getFileType(this.currentUrl);
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg' && fileType !== 'jpg' && fileType !== 'gif' && fileType !== 'bmp' && fileType !== 'tiff') {
            setTimeout(() => {
                this.closeModal();
            }, 1700);
            
        }  
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome = true;
    }
    
    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    handleShare(event){
        this.currentDocumentId = event.currentTarget.dataset.id;
        this.currentStaffId = event.currentTarget.dataset.staffid;
        this.loadStaffByDoc(this.currentDocumentId);
        console.log('StaffId: '+this.currentStaffId);
         console.log('currentDocumentId: '+this.currentDocumentId);
        this.assignmentFlag = true;
    }

    loadStaffByDoc(docId) {
        fetchStaffByDoc({ docId: docId })
            .then(result => {
                console.log('Staff from facility:', JSON.stringify(result));

                // Convert to dual listbox format
                this.filteredStaffOptions = (result || []).map(staff => ({
                    label: staff.Display_Nickname__c,
                    value: staff.Id
                }));

                console.log('Options:', JSON.stringify(this.filteredStaffOptions));
            })
            .catch(error => {
                console.error('Error fetching staff:', error);
            });
    }

    handleShareClose() {
        this.assignmentFlag = false;
        this.currentDocumentId = '';
    }

    handleduallist(event) {
        this.selectedStaffIds = event.detail.value;
    }

    handleassignmentinsert() {

        // 1️⃣ Validation
        if (!this.selectedStaffIds || this.selectedStaffIds.length === 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select at least one staff',
                    variant: 'error'
                })
            );
            return;
        }

        console.log('DocId:', this.currentDocumentId);
        console.log('Selected Staff:', JSON.stringify(this.selectedStaffIds));

        // 2️⃣ Call Apex
        saveParticipantDocShares({
            docId: this.currentDocumentId,
            staffIds: this.selectedStaffIds
        })
        .then(() => {

            // 3️⃣ Success Toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Access granted successfully',
                    variant: 'success'
                })
            );

            // 4️⃣ Reset + Close Modal
            this.assignmentFlag = false;
            this.selectedStaffIds = [];
            this.currentDocumentId = null;

            // 5️⃣ Refresh list
            this.fetchReplist();
        })
        .catch(error => {
            console.error('Error saving share:', error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to grant access',
                    variant: 'error'
                })
            );
        });
    }

    get saveButtonDisable() {
        return !this.selectedStaffIds || this.selectedStaffIds.length === 0;
    }

    handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
}

/* handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files || []);

    if (!files.length) return;

    const file = files[0];

    // ✅ single file check
    if (files.length > 1) {
        this.showToast('Only one file allowed');
        return;
    }

    // ✅ 50MB validation
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) {
        this.showToast('File size cannot exceed 50 MB');
        return;
    }

    // trigger child
    this.isFileExpand = true;

    setTimeout(() => {
        const svc = this.template.querySelector('c-document-office-service');
        if (svc) {
            svc.incomingFiles = [file];
        }
    }, 500);
} */

handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files || []);
    if (!files.length) return;

    const file = files[0];

    if (files.length > 1) {
        this.showToast('Only one file allowed');
        return;
    }

    // ✅ FIX Issue 2 — inline error immediately on drop
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) {
        this.isattachError = true;
        this.showToast('File size cannot exceed 50 MB');
        return;
    }

    // ✅ clear error if valid
    this.isattachError = false;

    // ✅ FIX Issue 1 — reset child if already has a file, then pass new one
    if (this.isFileExpand) {
        this.isFileExpand = false;
        this.uploadedFile = null;
        this.isFileAttached = false;

        setTimeout(() => {
            this.isFileExpand = true;
            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (svc) svc.incomingFiles = [file];
            }, 500);
        }, 100);
        return;
    }

    this.isFileExpand = true;
    setTimeout(() => {
        const svc = this.template.querySelector('c-document-office-service');
        if (svc) svc.incomingFiles = [file];
    }, 500);
}

    handleAwsUploadComplete(event) {
    const files = event.detail.files || [];

    if (!files.length) return;

    // ✅ enforce single file
    this.uploadedFile = files[0];
    this.fileName = this.uploadedFile.originalName;
    this.isFileAttached = true;
}
handleFileDeleted() {
    this.uploadedFile = null;
    this.fileName = '';
    this.isFileAttached = false;
    this.isFileExpand = false;
}
handleAttachment(){
    this.fieldErrorMap ={};
    this.successmessage='Attachment created successfully.';
    this.isOpenModal=true;
    this.isEdit=false;
    this.UpdateDetails = false;
    this.isattachError = false;

    // ✅ ADD THESE
    this.fileName = '';
    this.uploadedFile = null;
    this.isFileAttached = false;
    this.isFileExpand = false;
}
triggerFileInput() {
    const input = this.template.querySelector('input[type="file"]');
    if (input) {
        input.value = '';
        input.click();
    }
}
/* handleFileSelect(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const file = files[0];

    // single file check
    if (files.length > 1) {
        this.showToast('Only one file allowed');
        return;
    }

    // 50MB validation
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) {
        this.showToast('File size cannot exceed 50 MB');
        return;
    }

    this.isFileExpand = true;

    setTimeout(() => {
        const svc = this.template.querySelector('c-document-office-service');
        if (svc) {
            svc.incomingFiles = [file];
        }
    }, 500);
} */
handleFileSelect(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const file = files[0];

    if (files.length > 1) {
        this.showToast('Only one file allowed');
        return;
    }

    // ✅ FIX Issue 2 — set isattachError immediately, user sees it inline before Save
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) {
        this.isattachError = true;
        this.showToast('File size cannot exceed 50 MB');
        return;
    }

    // ✅ clear error if valid file selected
    this.isattachError = false;

    // ✅ FIX Issue 1 — if child already exists, destroy it first before passing new file
    if (this.isFileExpand) {
        this.isFileExpand = false;
        this.uploadedFile = null;
        this.isFileAttached = false;

        // wait for child to unmount, then remount with new file
        setTimeout(() => {
            this.isFileExpand = true;
            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (svc) svc.incomingFiles = [file];
            }, 500);
        }, 100);
        return;
    }

    this.isFileExpand = true;
    setTimeout(() => {
        const svc = this.template.querySelector('c-document-office-service');
        if (svc) svc.incomingFiles = [file];
    }, 500);
}
    async deleteOldFileFromAWS(key) {
    if (!key) return;

    try {
        const response = await fetch('https://tesseractapps.com/delete-file', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key })
        });

        const result = await response.json();
        console.log('Old file deleted:', result);

    } catch (error) {
        console.error('AWS delete error:', error);
    }
}
}