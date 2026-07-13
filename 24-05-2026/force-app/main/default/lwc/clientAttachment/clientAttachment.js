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
import fetchStaffOptions from '@salesforce/apex/StaffController.fetchStaffDocuments';
import getFolders from '@salesforce/apex/ClientAttachmentHandler.getFolders';
import createFolder from '@salesforce/apex/ClientAttachmentHandler.createFolder';
import updateFolderName from '@salesforce/apex/ClientAttachmentHandler.updateFolderName';
import loadContacts from '@salesforce/apex/ClientAttachmentHandler.loadContacts';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getContactAttachments from '@salesforce/apex/ClientAttachmentHandler.getContactAttachments';
import getAllContactAttachments from '@salesforce/apex/ClientAttachmentHandler.getAllContactAttachments';
import saveFolderShares from '@salesforce/apex/ClientAttachmentHandler.saveFolderShares';
import fetchFolderSharedStaff from '@salesforce/apex/ClientAttachmentHandler.fetchFolderSharedStaff';
import archiveAttachment from '@salesforce/apex/ClientAttachmentHandler.archiveAttachment';
import restoreAttachment from '@salesforce/apex/ClientAttachmentHandler.restoreAttachment';
import getArchivedAttachments from '@salesforce/apex/ClientAttachmentHandler.getArchivedAttachments';

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
    @api recordId;
    @api node;
    @api level = 0;
    @api selectedId;

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

    //sai eswar
    @track currentFolderId = null;
    @track folderTree = [];
    @track folders = [];
    @track currentFolderName = 'All Documents';
    @track isCreateFolderModalOpen = false;
    @track folderName = '';

    @track folderOptions = [];
    @track isOpen = true;
    @track selectedParentFolderId = 'ALL';
    @track contacts = [];
    @track isShowSpinner = false;

    @track currentFolderShareId;
    @track folderAssignmentFlag = false;
    @track selectedFolderStaffIds = [];

    @track archiveModal = false;
    @track archivedRecords = [];

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    
    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }  
   
    connectedCallback() {    

        // 🔥 SHOW SPINNER WHEN TAB LOADS
        this.isShowSpinner = true;

        this.fetchReplist()
            .finally(() => {
                this.isShowSpinner = false;
            });

        this.loadContacts()
            .then(() => this.loadFolders());

        this.storedFacilityId = localStorage.getItem("defaultFacilityId");

        console.log('📌 FacilityId from localStorage:', this.storedFacilityId);

        this.loadStaffOptions();
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

        return getCurrentLoggedUserInfo()
            .then(user => {

                console.log('🔵 User Info:', JSON.stringify(user));

                this.currentUserType = user.User_Type__c;

                return Promise.all([

                    fetchAttachmentsForStaff({ 
                        clientId: this.clientId,
                        folderId: this.currentFolderId
                    }),

                    fetchClientAttachmentsSecure({ 
                        clientId: this.clientId,
                        folderId: this.currentFolderId
                    })
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

                const map = new Map();
                combined.forEach(rec => map.set(rec.Id, rec));

                const finalList = Array.from(map.values());

                console.log('🟢 FINAL LIST:', JSON.stringify(finalList));

                this.records = [];
                this.totalRecords = 0;

                setTimeout(() => {

                    this.records = finalList.map(record => {

                        console.log('DEBUG Size from DB:', record.Size__c);

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

                    this.pageSize = this.pageSizeOptions[0];
                    this.pageNumber = 1;

                    console.log('🟢 RECORDS SET:', JSON.stringify(this.records));

                    this.paginationHelper();

                }, 0);
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
        fields.Attachment_Folder__c = this.currentFolderId;
        fields.Participant__c = this.clientId;

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

    console.log('===== loadStaffByDoc START =====');
    console.log('Document Id => ', docId);

    fetchStaffByDoc({ docId: docId })

        .then(result => {

            console.log('===== fetchStaffByDoc RESULT =====');

            console.log(
                'Raw Result => ',
                JSON.stringify(result)
            );

            console.log(
                'Total Records => ',
                result ? result.length : 0
            );

            (result || []).forEach((staff, index) => {

                console.log(`----- Staff Record ${index + 1} -----`);

                console.log(
                    'Full Staff Record => ',
                    JSON.stringify(staff)
                );

                console.log(
                    'Share Record Id => ',
                    staff.Id
                );

                console.log(
                    'Staff__c => ',
                    staff.Staff__c
                );

                console.log(
                    'Display_Nickname__c => ',
                    staff.Display_Nickname__c
                );

                console.log(
                    'Is_Active__c => ',
                    staff.Is_Active__c
                );
            });

            // ✅ Extract selected ids
            const selectedIds =
                (result || []).map(
                    staff => staff.Staff__c
                );

            console.log(
                '===== SELECTED IDS ====='
            );

            console.log(
                'selectedIds => ',
                JSON.stringify(selectedIds)
            );

            // ✅ Set RIGHT side values
            this.selectedStaffIds = [...selectedIds];

            console.log(
                '===== FINAL UI STATE ====='
            );

            console.log(
                'selectedStaffIds => ',
                JSON.stringify(this.selectedStaffIds)
            );
        })

        .catch(error => {

            console.error(
                '===== loadStaffByDoc ERROR ====='
            );

            console.error(
                'Error => ',
                JSON.stringify(error)
            );

            console.error(
                'Raw Error => ',
                error
            );
        });
}

loadStaffOptions() {
    console.log('===== loadStaffOptions START =====');
    console.log('storedFacilityId => ', this.storedFacilityId);

    fetchStaffOptions()
        .then(result => {

            console.log('===== fetchStaffOptions RESULT =====');
            console.log('Total Staff Returned => ', result?.length);
            console.log('Full Result => ', JSON.stringify(result));

            result.forEach((staff, index) => {
                console.log(`--- Staff ${index + 1} ---`);
                console.log('Id => ', staff.Id);
                console.log('Name => ', staff.Name);
                console.log('NameToDisplay__c => ', staff.NameToDisplay__c);
                console.log('Facility__c => ', staff.Facility__c);
                console.log(
                    'Facility Match => ',
                    staff.Facility__c === this.storedFacilityId
                );
            });

            /*
            
            const filteredData = result.filter(staff => {
                const isMatch = staff.Facility__c === this.storedFacilityId;

                console.log(
                    `Filtering Staff ${staff.Id} | Facility => ${staff.Facility__c} | Stored => ${this.storedFacilityId} | Match => ${isMatch}`
                );

                return isMatch;
            });

            */

            const filteredData = result.filter(staff => {

    // Child facilities from inner query
    const childFacilities =
        staff.Staff_Facilities__r || [];

    // Match stored facility with child records
    const isMatch = childFacilities.some(
        facility =>
            facility.Facility__c ===
            this.storedFacilityId
    );

    console.log('================================');

    console.log(
        'Staff Id => ',
        staff.Id
    );

    console.log(
        'Stored Facility => ',
        this.storedFacilityId
    );

    console.log(
        'Child Facilities => ',
        JSON.stringify(childFacilities)
    );

    console.log(
        'Match => ',
        isMatch
    );

    return isMatch;
});
            

            console.log('===== FILTERED STAFF =====');
            console.log('Filtered Count => ', filteredData.length);
            console.log('Filtered Data => ', JSON.stringify(filteredData));

            this.filteredStaffOptions = filteredData.map(staff => ({
                label: staff.NameToDisplay__c || staff.Name,
                value: staff.Id
            }));

            console.log('===== FINAL OPTIONS =====');
            console.log(
                'filteredStaffOptions => ',
                JSON.stringify(this.filteredStaffOptions)
            );

        })
        .catch(error => {
            console.error('===== loadStaffOptions ERROR =====');
            console.error('Error => ', JSON.stringify(error));
            console.error('Raw Error => ', error);
        });
}

    handleStaffChange(event) {
        this.selectedStaffIds = event.detail.value;

        console.log('🟡 Selected Staff:', JSON.stringify(this.selectedStaffIds));
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

// loadFolders() {
//     return getFolders({ clientId: this.clientId })  
//         .then(result => {

//             this.folders = [...result];

//             const tree = this.buildFolderTree(result);

//             // 🔥 CONTACTS NODE
//             const contactsNode = {
//                 Id: 'CONTACTS_NODE',
//                 Name: 'Contacts',
//                 children: this.contacts,
//                 isSystemNode: true
//             };

//             const finalTree = [...tree, contactsNode];

//             this.folderTree = JSON.parse(JSON.stringify(finalTree));

//             // 🔥 FIX: BUILD DROPDOWN OPTIONS
//             this.folderOptions = [
//                 { label: 'All Documents', value: 'ALL' },
//                 ...this.flattenTreeForDropdown(tree)
//             ];

//         })
//         .catch(error => {
//             console.error('Folder load error:', error);
//         });
// }

loadFolders() {

    return getFolders({ clientId: this.clientId })  
        .then(result => {

            this.folders = [...result];

            const tree = this.buildFolderTree(result);

            // Default folders
            let finalTree = [...tree];

            // ✅ Show Contacts ONLY for non-staff users
            if (this.isStaff) {

                const contactsNode = {
                    Id: 'CONTACTS_NODE',
                    Name: 'Contacts',
                    children: this.contacts,
                    isSystemNode: true
                };

                finalTree.push(contactsNode);
            }

            this.folderTree =
                JSON.parse(JSON.stringify(finalTree));

            // Dropdown options
            this.folderOptions = [
                { label: 'All Documents', value: 'ALL' },
                ...this.flattenTreeForDropdown(tree)
            ];

        })
        .catch(error => {

            console.error(
                'Folder load error:',
                error
            );
        });
}

buildFolderTree(data) {

    const map = {};
    const roots = [];

    data.forEach(f => {
        map[f.Id] = { ...f, children: [] };
    });

    data.forEach(f => {
        if (f.Parent_Folder__c && map[f.Parent_Folder__c]) {
            map[f.Parent_Folder__c].children.push(map[f.Id]);
        } else {
            roots.push(map[f.Id]);
        }
    });

    return roots;
}

handleFolderClick(event) {
    const id = event.currentTarget.dataset.id;

    this.currentFolderId = (id === 'ALL') ? null : id;

    // 🔥 Folder Name
    this.currentFolderName =
        id === 'ALL'
            ? 'All Documents'
            : this.folders.find(f => f.Id === id)?.Name || 'All Documents';

    // 🔥 update class for all folders
    this.folderTree = this.folderTree.map(f => ({
        ...f,
        cssClass:
            f.Id === id
                ? 'folder-item selected-folder'
                : 'folder-item'
    }));

    this.fetchReplist();
}

openCreateFolderModal() {
    this.folderName = '';
    this.isCreateFolderModalOpen = true;
}

closeFolderModal() {
    this.isCreateFolderModalOpen = false;
}

handleFolderNameChange(event) {
    this.folderName = event.target.value;
}

createFolder() {

    if (!this.folderName) {
        this.showToast('Folder name is required');
        return;
    }

    const parentId =
        this.selectedParentFolderId === 'ALL'
            ? null
            : this.selectedParentFolderId;

    createFolder({
        name: this.folderName,
        parentId: parentId,
        clientId: this.clientId
    })
    .then((newFolderId) => {

        this.isCreateFolderModalOpen = false;

        // 🔥 reload folders
        return this.loadFolders()
            .then(() => newFolderId);

    })
    .then((newFolderId) => {

        // 🔥 SELECT newly created folder
        this.currentFolderId = newFolderId;

        // 🔥 refresh attachments if needed
        this.fetchReplist();

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Folder created successfully',
                variant: 'success'
            })
        );
    })
    .catch(error => {

        console.error(
            'Create folder error:',
            JSON.stringify(error)
        );

        let message =
            error?.body?.message ||
            error?.message ||
            'Failed to create folder';

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    });
}

enableRename(event) {
    const id = event.currentTarget.dataset.id;

    this.folderTree = this.updateTree(this.folderTree, id, (n) => ({
        isEditing: true,
        tempName: n.Name,
        error: null
    }));
}

handleRenameChange(event) {
    const id = event.target.dataset.id;
    const value = event.target.value;

    this.folderTree = this.updateTree(this.folderTree, id, () => ({
        tempName: value,
        error: value ? null : 'Folder name is required'
    }));
}

handleRenameSave(event) {
    const id = event.currentTarget.dataset.id;
    this.saveRename(id);
}

handleRenameCancel(event) {
    const id = event.currentTarget.dataset.id;
    this.cancelRename(id);
}

saveRename(id) {

    const folder = this.findFolderById(this.folderTree, id);

    if (!folder.tempName) {
        this.folderTree = this.updateTree(this.folderTree, id, () => ({
            error: 'Folder name is required'
        }));
        return;
    }

    updateFolderName({
        folderId: id,
        newName: folder.tempName
    })
    .then(() => {

        this.loadFolders(); // refresh

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Folder renamed',
                variant: 'success'
            })
        );

    })
    .catch(() => {
        this.showToast('Rename failed');
    });
}

updateTree(nodes, id, updater) {
    return nodes.map(n => {
        if (n.Id === id) {
            return { ...n, ...updater(n) };
        }
        if (n.children) {
            return { ...n, children: this.updateTree(n.children, id, updater) };
        }
        return n;
    });
}

flattenTree(nodes, level = 0, result = []) {
    nodes.forEach(n => {

        result.push({
            ...n,
            level: level,
            lineStyle: `margin-left:${level * 15}px`,
            cssClass: 'folder-item'
        });

        if (n.children && n.children.length > 0) {
            this.flattenTree(n.children, level + 1, result);
        }
    });

    return result;
}

cancelRename(id) {
    this.folderTree = this.updateTree(this.folderTree, id, (n) => ({
        isEditing: false,
        tempName: n.Name,
        error: null
    }));
}

findFolderById(nodes, id) {
    for (let n of nodes) {
        if (n.Id === id) return n;
        if (n.children) {
            const found = this.findFolderById(n.children, id);
            if (found) return found;
        }
    }
    return null;
}

get hasChildren() {
    return this.node.children && this.node.children.length > 0;
}

get nextLevel() {
    return this.level + 1;
}

get indentStyle() {
    return `padding-left:${this.level * 12}px`;
}

get computedClass() {
    return 'folder-item' + (this.node.Id === this.selectedId ? ' active' : '');
}

toggle() {
    this.isOpen = !this.isOpen;
}

handleClick(event) {
    event.stopPropagation();

    this.dispatchEvent(new CustomEvent('folderselect', {
        detail: { id: this.node.Id },
        bubbles: true,
        composed: true
    }));
}

handleChildSelect(event) {
    this.dispatchEvent(new CustomEvent('folderselect', {
        detail: event.detail,
        bubbles: true,
        composed: true
    }));
}

/*
handleFolderSelect(event) {
    const id = event.detail.id;

    this.currentFolderId = id;

    // this.currentFolderName =
    //     this.folders.find(f => f.Id === id)?.Name || 'All Documents';

    this.fetchReplist();
}
    */

handleFolderSelect(event) {

    // 🔥 START SPINNER
    this.isShowSpinner = true;
    const id = event.detail.id;
    this.currentFolderId = id;

    console.log("current folder", this.currentFolderId);

    // 🔥 Selected Folder Name
    if (id === 'CONTACTS_NODE') {

        this.currentFolderName = 'Contacts';

    } else if (this.isContactNode(id)) {

        const contact = this.contacts.find(c => c.Id === id);

        this.currentFolderName =
            contact?.Name || 'Contact Files';

    } else {

        this.currentFolderName =
            this.folders.find(f => f.Id === id)?.Name
            || 'All Documents';
    }

    // 🔥 CONTACT ROOT CLICK
    if (id === 'CONTACTS_NODE') {

        this.loadAllContactFiles()
            .finally(() => {
                this.isShowSpinner = false;
            });

        return;
    }

    // 🔥 CONTACT CHILD CLICK
    if (this.isContactNode(id)) {

        this.loadContactFiles(id);
        // 🔥 STOP SPINNER AFTER CONTACT FILES LOAD
        setTimeout(() => {
            this.isShowSpinner = false;
        }, 1000);
        return;
    }

    // 🔥 NORMAL FOLDER
    this.fetchReplist()
        .finally(() => {
            this.isShowSpinner = false;
        });
}

isContactNode(id) {
    return this.contacts.some(c => c.Id === id);
}

handleParentFolderChange(event) {
    this.selectedParentFolderId = event.detail.value;
}

openCreateFolderModal() {
    this.folderName = '';
    this.selectedParentFolderId = this.currentFolderId || 'ALL'; // 🔥 important
    this.isCreateFolderModalOpen = true;
}

flattenTreeForDropdown(nodes, level = 0, result = []) {
    nodes.forEach(n => {

        result.push({
            label: `${'—'.repeat(level)} ${n.Name}`,
            value: n.Id
        });

        if (n.children) {
            this.flattenTreeForDropdown(n.children, level + 1, result);
        }
    });

    return result;
}

markActiveFolder(nodes, selectedId) {
    return nodes.map(n => ({
        ...n,
        cssClass: 'folder-item' + (n.Id === selectedId ? ' active' : ''),
        children: n.children
            ? this.markActiveFolder(n.children, selectedId)
            : []
    }));
}

get allFolderClass() {
    return this.currentFolderId === null
        ? 'folder-item selected-folder'
        : 'folder-item';
}

loadContacts() {
    return loadContacts({ clientId: this.clientId })
        .then(result => {

            this.contacts = result.map(c => ({
                Id: c.Id,
                Name: `${c.First_Name__c || ''} ${c.Last_Name__c || ''}`.trim(),
                children: [],
                isContact: true
            }));

        })
        .catch(error => {
            console.error('Contact load error:', error);
        });
}

loadContactFiles(contactId) {

    return getContactAttachments({
        contactId: contactId
    })
    .then(result => {

        console.log(
            '✅ Contact Attachments:',
            JSON.stringify(result)
        );

        this.records = (result || []).map(file => {

            return {
                Id: file.Id,

                Name:
                    file.File_Name__c || file.Name,

                AmazonURL:
                    file.Amazon_file_URL__c,

                Key:
                    file.Key__c,

                fileSize:
                    this.formatFileSize(file.Size__c),

                UserName:
                    file.CreatedBy?.Name,

                Date:
                    file.Date_Format__c
            };
        });

        this.totalRecords = this.records.length;

        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;

        this.paginationHelper();
    })
    .catch(error => {

        console.error(
            '❌ Error loading contact files:',
            JSON.stringify(error)
        );
    });
}

loadAllContactFiles() {

    return getAllContactAttachments({
        clientId: this.clientId
    })
    .then(result => {

        console.log(
            '📂 All Contact Attachments:',
            JSON.stringify(result)
        );

        this.records = (result || []).map(file => {

            const firstName =
                file.Participant_Contact__r?.First_Name__c || '';

            const lastName =
                file.Participant_Contact__r?.Last_Name__c || '';

            return {

                Id: file.Id,

                Name:
                    file.File_Name__c || file.Name,

                AmazonURL:
                    file.Amazon_file_URL__c,

                Key:
                    file.Key__c,

                fileSize:
                    this.formatFileSize(file.Size__c),

                UserName:
                    file.CreatedBy?.Name,

                Date:
                    file.Date_Format__c,

                ContactName:
                    `${firstName} ${lastName}`.trim()
            };
        });

        this.totalRecords = this.records.length;

        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;

        this.paginationHelper();
    })
    .catch(error => {

        console.error(
            '❌ Error loading all contact files:',
            JSON.stringify(error)
        );
    });
}

handleFolderPermissions(event) {

    this.currentFolderShareId =
        event.detail.id;

    console.log(
        '📁 Folder Permission Open:',
        this.currentFolderShareId
    );

    fetchFolderSharedStaff({

        folderId:
            this.currentFolderShareId

    })

    .then(result => {

        console.log(
            '👥 Existing Folder Shares:',
            JSON.stringify(result)
        );

        this.selectedFolderStaffIds =
            result.map(
                item => item.Staff__c
            );

        console.log(
            '✅ Selected Folder Staff:',
            JSON.stringify(
                this.selectedFolderStaffIds
            )
        );

        this.folderAssignmentFlag = true;
    })

    .catch(error => {

        console.error(
            '❌ Folder Share Fetch Error:',
            JSON.stringify(error)
        );

        this.folderAssignmentFlag = true;
    });
}

handleFolderStaffChange(event) {

    this.selectedFolderStaffIds =
        event.detail.value;

    console.log(
        '👥 Selected Folder Staff:',
        JSON.stringify(this.selectedFolderStaffIds)
    );
}

closeFolderShare() {

    this.folderAssignmentFlag = false;

    this.currentFolderShareId = null;

    this.selectedFolderStaffIds = [];
}

saveFolderSharing() {

    if (
        !this.selectedFolderStaffIds ||
        this.selectedFolderStaffIds.length === 0
    ) {

        this.dispatchEvent(

            new ShowToastEvent({

                title: 'Error',

                message:
                    'Please select at least one staff',

                variant: 'error'
            })
        );

        return;
    }

    console.log(
        '📁 Folder Share Id:',
        this.currentFolderShareId
    );

    console.log(
        '👥 Staff:',
        JSON.stringify(this.selectedFolderStaffIds)
    );

    saveFolderShares({

        folderId:
            this.currentFolderShareId,

        staffIds:
            this.selectedFolderStaffIds

    })

    .then(() => {

        this.dispatchEvent(

            new ShowToastEvent({

                title: 'Success',

                message:
                    'Folder shared successfully',

                variant: 'success'
            })
        );

        this.closeFolderShare();

        this.fetchReplist();

        this.loadFolders();
    })

    .catch(error => {

        console.error(
            '❌ Folder Share Error:',
            JSON.stringify(error)
        );

        this.dispatchEvent(

            new ShowToastEvent({

                title: 'Error',

                message:
                    'Folder share failed',

                variant: 'error'
            })
        );
    });
}

get folderSaveButtonDisable() {

    return !this.selectedFolderStaffIds ||
           this.selectedFolderStaffIds.length === 0;
}

handleArchive(event) {

    const attachmentId =
        event.currentTarget.dataset.id;

    archiveAttachment({
        attachmentId: attachmentId
    })

    .then(() => {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'File archived successfully',
                variant: 'success'
            })
        );

        this.fetchReplist();
    })

    .catch(error => {

        console.error(error);

        this.showToast('Archive failed');
    });
}

openArchiveModal() {

    this.loadArchivedFiles();

    this.archiveModal = true;
}

loadArchivedFiles() {

    getArchivedAttachments({
        clientId: this.clientId,
        folderId: this.currentFolderId
    })

    .then(result => {

        this.archivedRecords = result.map(rec => {

            return {

                Id: rec.Id,
                Name: rec.Name,
                Type: rec.Type__c,
                ArchivedDate: rec.Date_Format__c,
                fileSize: this.formatFileSize(rec.Size__c)
            };
        });
    })

    .catch(error => {
        console.error(error);
    });
}

handleRestore(event) {

    const attachmentId =
        event.currentTarget.dataset.id;

    restoreAttachment({
        attachmentId: attachmentId
    })

    .then(() => {

        // ✅ CLEAR SHARED STAFF UI STATE
        this.selectedStaffIds = [];

        // ✅ RESET CURRENT DOC
        this.currentDocumentId = null;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'File restored successfully',
                variant: 'success'
            })
        );

        this.loadArchivedFiles();

        this.fetchReplist();
    })

    .catch(error => {

        console.error(error);

        this.showToast('Restore failed');
    });
}

closeArchiveModal() {
    this.archiveModal = false;
}

get isContactsContext() {

    // ROOT CONTACTS NODE
    if (this.currentFolderId === 'CONTACTS_NODE') {
        return true;
    }

    // CONTACT SUBFOLDER
    return this.contacts.some(
        c => c.Id === this.currentFolderId
    );
}

get disableContactUploads() {
    return this.isContactsContext;
}

}