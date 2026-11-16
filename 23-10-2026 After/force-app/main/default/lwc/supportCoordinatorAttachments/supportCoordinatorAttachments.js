import { LightningElement, track, wire, api } from 'lwc';
import UpdateFileSize from '@salesforce/apex/ClientAttachmentHandler.UpdateFileSize';   
import deleteRepository from '@salesforce/apex/ClientAttachmentHandler.deleteRepository';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';  
import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import getFolders from '@salesforce/apex/SupportCoordinatorAttachmentController.getFolders';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getAttachments from '@salesforce/apex/SupportCoordinatorAttachmentController.getAttachments';
import { publish, createMessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import checkAttachmentSignatureStatus  from '@salesforce/apex/AgreementsHandler.checkAttachmentSignatureStatus';
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
    { label: 'Date', fieldName: 'Expiry_Date__c' },
    {
        type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'right'
        }
    }
 ];

export default class SupportCoordinatorAttachments extends LightningElement {
    // JS Properties 
    @api supportClientId;
    @api
    loadTemporaryAttachments(attachments) {

        this.records = attachments.map((record, index) => {

            return {
                Id: 'TEMP_' + index,
                Name: record.attachmentName,
                type: record.attachmentType,
                comment: record.comments,
                UserName: '',
                Date: record.expiryDate,
                AmazonURL: record.amazonUrl,
                fileSize: record.fileSize,
                Key: record.fileKey,
                OtherComments: record.otherComments,
                FileName: record.fileName
            };
        });

        this.totalRecords = this.records.length;
        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;

        this.paginationHelper();
    }
    @api supportClientAttachments = [];
    @api recordId;
    @api node;
    @api level = 0;
    @api selectedId;
    context = createMessageContext();
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
    @track isShowSpinner = false;

    @track currentFolderShareId;
    @track folderAssignmentFlag = false;
    @track selectedFolderStaffIds = [];

    @track archiveModal = false;
    @track archivedRecords = [];

    @track attachmentName = '';
    @track selectedType = '';
    @track otherComments = '';
    @track expiryDate = null;
    @track comments = '';

    @track showOtherField = false;
    @track attachmentType;
    @track showMuteIcon = false;
    @track attachmentTypeOptions = [
        { label: 'Certificate', value: 'Certificate' },
        { label: 'Compliance', value: 'Compliance' },
        { label: 'Legal Documentation', value: 'Legal Documentation' },
        { label: 'Training', value: 'Training' },
        { label: 'Inventory', value: 'Inventory' },
        { label: 'Invoice', value: 'Invoice' },
        { label: 'Other', value: 'Other' },
        { label: 'Functional Capacity Assessment', value: 'Functional Capacity Assessment' },
        { label: 'AT Assessment', value: 'AT Assessment' },
        { label: 'Home and Living Assessment', value: 'Home and Living Assessment' },
        { label: 'Sensory Profile Assessment', value: 'Sensory Profile Assessment' },
        { label: 'SDAAssessment', value: 'SDAAssessment' },
        { label: 'Cognitive Assessment', value: 'Cognitive Assessment' },
        { label: 'Mental Health Assessment', value: 'Mental Health Assessment' },
        { label: 'WHODAS/Vineland - Behaviour Assessment', value: 'WHODAS/Vineland - Behaviour Assessment' },
        { label: 'Behaviour Logs', value: 'Behaviour Logs' },
        { label: 'Communication Assessment', value: 'Communication Assessment' },
        { label: 'Speech and Language Assessment', value: 'Speech and Language Assessment' },
        { label: 'SIL Roster of Care', value: 'SIL Roster of Care' },
        { label: 'Nutrition and Swallowing Assessment', value: 'Nutrition and Swallowing Assessment' },
        { label: 'Mobility Assessment', value: 'Mobility Assessment' },
        { label: 'Falls Risk Assessment', value: 'Falls Risk Assessment' },
        { label: 'Psychological Assessment', value: 'Psychological Assessment' },
        { label: 'Equipment/Mobility Aid Assessment', value: 'Equipment/Mobility Aid Assessment' },
        { label: 'Neuropsychological Assessment', value: 'Neuropsychological Assessment' },
        { label: 'Hospital Discharge Summary', value: 'Hospital Discharge Summary' },
        { label: 'Psychiatric Assessment Report', value: 'Psychiatric Assessment Report' },
        { label: 'OT Report', value: 'OT Report' },
        { label: 'Medical Report', value: 'Medical Report' },
        { label: 'Risk and Emergency Plan', value: 'Risk and Emergency Plan' },
        { label: 'Restrictive Practice', value: 'Restrictive Practice' },
        { label: 'Mealtime Management Plan', value: 'Mealtime Management Plan' },
        { label: 'Medication Report', value: 'Medication Report' },
        { label: 'Care Plan', value: 'Care Plan' },
        { label: 'Support Plan', value: 'Support Plan' },
        { label: 'Disaster Management Plan', value: 'Disaster Management Plan' },
        { label: 'Health Care Notes', value: 'Health Care Notes' },
        { label: 'Epilepsy Management Plan', value: 'Epilepsy Management Plan' },
        { label: 'Dietician Plan', value: 'Dietician Plan' },
        { label: 'Enteral Feeding Support Plan', value: 'Enteral Feeding Support Plan' },
        { label: 'Complex Bowel Care Plan', value: 'Complex Bowel Care Plan' }
    ];

    @track uploadedFileUrl;
    @track uploadedFileKey;
    @track uploadedFileName;
    @track uploadedFileSize;
    @track tempAttachments = [];
    @track deletedAttachmentIds = [];
    @track editedAttachments = [];

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
        console.log('supportClientId', this.supportClientId);
        // 🔥 SHOW SPINNER WHEN TAB LOADS
        this.isShowSpinner = true;
        console.log('spinner', this.isShowSpinner);

        this.fetchReplist()
            .finally(() => {
                this.isShowSpinner = false;
            });

        this.loadFolders();

        this.storedFacilityId = localStorage.getItem("defaultFacilityId");

        console.log('📌 FacilityId from localStorage:', this.storedFacilityId);
    }
    //manendra added for Tsign button click event
    /* handleTsign(event) {

    const attachmentId = event.currentTarget.dataset.id;
    const attachmentUrl = event.currentTarget.dataset.url;

    console.log("📌 Attachment Id:", attachmentId);
    console.log("📌 Attachment URL:", attachmentUrl);

    const message = {
        source: "ATTACHMENT",
        tsignreUrl: attachmentUrl,
        attachmentId: attachmentId
    };

    publish(this.context, TSIGN_MESSAGE_CHANNEL, message);

    this.dispatchEvent(
        new CustomEvent("redirecttsign")
    );
    } */
   handleTsign(event) {

    const attachmentId = event.currentTarget.dataset.id;
    const attachmentUrl = event.currentTarget.dataset.url;
    const signatureUrl = event.currentTarget.dataset.signatureUrl;

    if (signatureUrl) {
        window.open(signatureUrl, '_blank');
        return;
    }

    const message = {
        source: 'ATTACHMENT',
        tsignreUrl: attachmentUrl,
        attachmentId: attachmentId
    };

    publish(this.context, TSIGN_MESSAGE_CHANNEL, message);

    this.dispatchEvent(
        new CustomEvent('redirecttsign')
    );
}

/*     fetchAttachmentSignatureStatus() {

    if (!this.records || this.records.length === 0) {
        return;
    }

    let promises = this.records
        .filter(record => !String(record.Id).startsWith('TEMP_'))
        .map(record => {

            return checkAttachmentSignatureStatus({
                recordId: record.Id
            })
            .then(status => {

                record.signatureStatus =
                    status.isSigned ? 'Signed⤋' : 'T Sign';

                record.signatureUrl =
                    status.signatureUrl;

                record.buttonVariant =
                    status.isSigned ? 'success' : 'brand';

            })
            .catch(error => {

                console.error(
                    'Signature status error',
                    error
                );

                record.signatureStatus = 'T Sign';
                record.buttonVariant = 'brand';
            });
        });

    Promise.all(promises)
        .then(() => {

            this.records = [...this.records];

            console.log(
                'Attachment signature status loaded'
            );
        });
} */
 fetchAttachmentSignatureStatus() {

    if (!this.records || this.records.length === 0) {
        return;
    }

    const TSIGN_EXTENSIONS = ['.pdf', '.doc', '.docx'];

    let promises = this.records
        .filter(record => !String(record.Id).startsWith('TEMP_'))
        .map(record => {

            // check file extension
            const fileName = (record.FileName || '').toLowerCase();
            const isTsignable = TSIGN_EXTENSIONS.some(ext => fileName.endsWith(ext));

            if (!isTsignable) {
                record.showTsign = false;
                return Promise.resolve();
            }

            return checkAttachmentSignatureStatus({
                recordId: record.Id
            })
            /* .then(status => {
                record.showTsign = true;
                record.signatureStatus = status.isSigned ? 'Signed⤋' : 'T Sign';
                record.signatureUrl = status.signatureUrl;
                record.buttonVariant = status.isSigned ? 'success' : 'brand';
            }) */
           .then(status => {

    record.showTsign = true;
    record.isSigned = status.isSigned;

    console.log(
        'ATTACHMENT SIGN STATUS =>',
        record.Name,
        record.isSigned
    );

    record.signatureStatus =
        status.isSigned ? 'Signed⤋' : 'T Sign';

    record.signatureUrl =
        status.signatureUrl;

    record.buttonVariant =
        status.isSigned ? 'success' : 'brand';
})
            .catch(error => {
                console.error('Signature status error', error);
                record.showTsign = true;
                record.isSigned = false;
                record.signatureStatus = 'T Sign';
                record.buttonVariant = 'brand';
            });
        });

    Promise.all(promises)
        .then(() => {
            this.records = [...this.records];
        });
}
    //manendra  end 
    changeExpense(event){    
        this.selectedType = event.detail.value;

        if (event.detail.value == 'Other') {
            this.textboxFlag = true;
        } else{
            this.textboxFlag = false;
        } 
    }

    fetchReplist() {

        console.log('================ FETCH START =================');

        console.log(
            'CURRENT TEMP ATTACHMENTS =>',
            JSON.stringify(this.tempAttachments)
        );

        this.isShowSpinner = true;

        console.log('Support Client Id =>', this.supportClientId);
        console.log('Folder Id =>', this.currentFolderId);

        // ====================================
        // TEMP FOLDER
        // ====================================

        if (
            this.currentFolderId &&
            this.currentFolderId.startsWith('TEMP_FOLDER_')
        ) {

            console.log(
                'TEMP FOLDER SELECTED =>',
                this.currentFolderId
            );

            this.records =
                (this.tempAttachments || [])
                .filter(
                    att =>
                        att.folderId ===
                        this.currentFolderId
                )
                .map(att => {

                    return {
                        Id: 'TEMP_' + Date.now(),

                        Name: att.attachmentName,
                        type: att.attachmentType,
                        comment: att.comments,
                        UserName: '',
                        Date: this.formatDateForDisplay(att.expiryDate),
                        AmazonURL: att.amazonUrl,
                        fileSize: att.fileSize,
                        Key: att.fileKey,
                        OtherComments: att.otherComments,
                        FileName: att.fileName
                       // isTempAttachment: true // manendra added to identify temp attachments in temp folders
                    };
                });

            console.log('FINAL RECORDS =>',JSON.stringify(this.records));

            this.totalRecords = this.records.length;

            this.pageSize = this.pageSizeOptions[0];
            this.pageNumber = 1;

            this.paginationHelper();

            this.isShowSpinner = false;

            return Promise.resolve();
        }

        // ====================================
        // SALESFORCE FOLDER
        // ====================================

        const folderId =
            this.currentFolderId === 'ALL'
                ? null
                : this.currentFolderId;

        return getAttachments({
            supportClientId: this.supportClientId,
            folderId: folderId
        })
        .then(result => {

            console.log(
                'Attachments =>',
                JSON.stringify(result)
            );

        const sfRecords = result.map(record => {

            return {
                Id: record.Id,
                Name: record.Name,
                type: record.Type__c,
                comment: record.Comments__c,
                UserName: record.User__r
                    ? record.User__r.Name
                    : '',
                // Display date
                Date: this.formatDateForDisplay(
                    record.Expiry_Date__c
                ),

                // Raw ISO date for editing
                expiryDate: record.Expiry_Date__c,
                AmazonURL: record.Amazon_file_URL__c,
                fileSize: record.Size__c,
                Key: record.Key__c,
                OtherComments: record.Other_Comments__c,
                FileName: record.File_Name__c
               // isTempAttachment: false // Manendra added to identify Salesforce attachments
            };
        });
        

        const tempRecords =
            (this.tempAttachments || [])
            .filter(att => {

                if(folderId === null){
                    return !att.folderId;
                }

                return att.folderId === folderId;
            })
            .map(att => {

                return {
                    Id: att.tempId,
                    Name: att.attachmentName,
                    type: att.attachmentType,
                    comment: att.comments,
                    UserName: '',
                    Date: this.formatDateForDisplay(
                        att.expiryDate
                    ),

                    expiryDate: att.expiryDate,
                    AmazonURL: att.amazonUrl,
                    fileSize: att.fileSize,
                    Key: att.fileKey,
                    OtherComments: att.otherComments,
                    FileName: att.fileName 
                   // isTempAttachment: true // manendra added to identify temp attachments  
                };
            });

        this.records = [
            ...sfRecords,
            ...tempRecords
        ];
    console.log(
    'RECORDS BEFORE SIGNATURE STATUS =>',
    JSON.stringify(this.records)
        );
        console.log(
            'RECORDS WITH TEMP FLAG =>',
            JSON.stringify(
                this.records.map(r => ({
                    Id: r.Id,
                    Name: r.Name,
                    isTempAttachment: r.isTempAttachment
                }))
            )
        );
        console.log(
            'FILE NAME DEBUG =>',
            this.records.map(r => ({
                Name: r.Name,
                FileName: r.FileName,
                type: r.type
            }))
        );
this.fetchAttachmentSignatureStatus(); // manendra added for Tsign  
            this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0];
            this.pageNumber = 1;

            this.paginationHelper();
        })
        .catch(error => {

            console.error(
                'ERROR LOADING ATTACHMENTS =>',
                JSON.stringify(error)
            );

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message:
                        error?.body?.message ||
                        'Failed to load attachments',
                    variant: 'error'
                })
            );
        })
        .finally(() => {

            this.isShowSpinner = false;
        });
    }

    @track isOrgName;
    @track currentUserRole;
    @track isStaff=false;

    RefreshAttachmentsData(event)
    {
        this.fetchReplist();        
    }

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
                supportClientId: this.recordId,
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
        this.isSignedAttachment = false; // manendra added for Tsign
        this.resetForm();     
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
        const attachmentId = event.currentTarget.dataset.id;

        console.log('EDIT CLICKED =>',attachmentId);

        const row =
            this.records.find(
                x => x.Id === attachmentId
            );

        if(!row){
            return;
        }
    this.isSignedAttachment = row.isSigned || false; // manendra added for Tsign

    console.log(
        'EDIT ATTACHMENT SIGNED =>',
        this.isSignedAttachment
    );
        console.log('date', this.expiryDate);
        this.editingAttachmentId = attachmentId;
        this.attachmentName = row.Name;
        this.selectedType = row.type;
        this.comments = row.comment;
        this.expiryDate = row.expiryDate;
        console.log('EDIT DATE =>',this.expiryDate);
        this.uploadedFileUrl = row.AmazonURL;
        this.uploadedFileKey = row.Key;
        this.uploadedFileName = row.FileName;
        this.uploadedFileSize = row.fileSize;

        this.isOpenModal = true;
        this.showMuteIcon = false;

        console.log('row.date',row.expiryDate);
    }

    @track deleteFlag =false;

    handleDelete(event) {

        const attachmentId = event.currentTarget.dataset.id;
        console.log('DELETE CLICKED =>',attachmentId);

        // ===================================
        // TEMP ATTACHMENT
        // ===================================

        if (
            attachmentId &&
            attachmentId.startsWith('TEMP_')
        ) {

            this.records =
                this.records.filter(
                    row => row.Id !== attachmentId
                );

            this.tempAttachments =
                this.tempAttachments.filter(
                    att =>
                        att.tempId !== attachmentId
                );

            this.dispatchEvent(
                new CustomEvent(
                    'tempattachmentdelete',
                    {
                        detail: attachmentId,
                        bubbles: true,
                        composed: true
                    }
                )
            );

            console.log(
                'TEMP ATTACHMENTS AFTER =>',
                JSON.stringify(this.tempAttachments)
            );

            this.totalRecords =
                this.records.length;

            this.paginationHelper();

            return;
        }

        // ===================================
        // SALESFORCE ATTACHMENT
        // ===================================

        console.log(
            'MARKING FOR DELETE =>',
            attachmentId
        );

        this.deletedAttachmentIds = [
            ...(this.deletedAttachmentIds || []),
            attachmentId
        ];

        this.dispatchEvent(
            new CustomEvent(
                'attachmentdelete',
                {
                    detail: this.deletedAttachmentIds,
                    bubbles: true,
                    composed: true
                }
            )
        );

        console.log(
            'Deleted Ids =>',
            JSON.stringify(this.deletedAttachmentIds)
        );

        this.records =
            this.records.filter(
                row => row.Id !== attachmentId
            );

        this.totalRecords =
            this.records.length;

        this.paginationHelper();

        console.log(
            'Deleted Ids =>',
            JSON.stringify(
                this.deletedAttachmentIds
            )
        );

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Attachment marked for deletion. Click Save to permanently delete it.',
                variant: 'success'
            })
        );
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
        this.supportClientId = row.Id;
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
        console.log('DATASET =>',JSON.stringify(event.currentTarget.dataset));

        const url = event.currentTarget.dataset.url;
        console.log('URL =>',url);
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

    get saveButtonDisable() {
        return !this.selectedStaffIds || this.selectedStaffIds.length === 0;
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    }

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

    if (!files.length) {
        return;
    }

    const file = files[0];

    this.uploadedFile = file;

    this.uploadedFileUrl = file.url;
    this.uploadedFileKey = file.key;
    this.uploadedFileName = file.originalName;
    this.uploadedFileSize = file.size;

    this.fileName = file.originalName;
    this.isFileAttached = true;

    console.log('URL', this.uploadedFileUrl);
    console.log('KEY', this.uploadedFileKey);
    console.log('NAME', this.uploadedFileName);
    console.log('SIZE', this.uploadedFileSize);
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

    this.attachmentName = '';
    this.selectedType = '';
    this.otherComments = '';
    this.expiryDate = null;
    this.comments = '';
    this.resetForm();

}

triggerFileInput() {
    const input = this.template.querySelector('input[type="file"]');
    if (input) {
        input.value = '';
        input.click();
    }
}

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

loadFolders() {

    console.log('=== loadFolders START ===');
    console.log('Client Id:', this.supportClientId);
    console.log('isStaff:', this.isStaff);

    return getFolders({ supportClientId: this.supportClientId })  
        .then(result => {

            this.folders = [...result];

            const tree = this.buildFolderTree(result);

            // Default folders
            let finalTree = [...tree];

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

        this.showToast('Folder Name is required');
        return;
    }

    const tempFolder = {

        Id: 'TEMP_FOLDER_' + Date.now(),
        Name: this.folderName,
        folderName: this.folderName,
        Parent_Folder__c:
            this.selectedParentFolderId === 'ALL'
                ? null
                : this.selectedParentFolderId,
        isTemporary: true,
        children: []
    };

    console.log(
        'TEMP FOLDER =>',
        JSON.stringify(tempFolder)
    );

    // Add immediately to UI
    this.folders = [
        ...this.folders,
        tempFolder
    ];

    const tree = this.buildFolderTree(this.folders);

    this.folderTree = JSON.parse(JSON.stringify(tree));

    // Send to parent for final save
    this.dispatchEvent(
        new CustomEvent(
            'foldersave',
            {
                detail: tempFolder,
                bubbles: true,
                composed: true
            }
        )
    );

    this.currentFolderId = tempFolder.Id;
    this.currentFolderName = tempFolder.Name;
    console.log('SWITCHING TO NEW FOLDER =>',this.currentFolderId);

    this.fetchReplist();
    this.isCreateFolderModalOpen = false;

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success',
            message: 'Folder added',
            variant: 'success'
        })
    );
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

handleFolderSelect(event) {

    console.log(
        'CURRENT TEMP ATTACHMENTS =>',
        JSON.stringify(this.tempAttachments)
    );

    // 🔥 START SPINNER
    this.isShowSpinner = true;

    const id = event.detail.id;
    this.currentFolderId = id;
    console.log("current folder", this.currentFolderId);
    // 🔥 Selected Folder Name
    this.currentFolderName = this.folders.find(f => f.Id === id)?.Name || 'All Documents';

    // 🔥 NORMAL FOLDER
    this.fetchReplist()
        .finally(() => {
            this.isShowSpinner = false;
        });
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

handleAttachmentName(event) {
    this.attachmentName = event.target.value;
}

handleComments(event) {
    this.comments = event.target.value;
}

handleExpiryDate(event) {
    this.expiryDate = event.target.value;
}

handleSave() {


    // =====================================
    // VALIDATIONS
    // =====================================

    if (!this.attachmentName?.trim()) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Attachment Name is required',
                variant: 'error'
            })
        );

        return;
    }

    if (!this.selectedType) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Attachment Type is required',
                variant: 'error'
            })
        );

        return;
    }

    if (!this.uploadedFileUrl) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Please attach a file',
                variant: 'error'
            })
        );

        return;
    }

    console.log(
        '================ CHILD HANDLE SAVE START ================'
    );

    const tempId = 'TEMP_' + Date.now();

    const attachmentObj = {

        tempId: tempId,
        attachmentName: this.attachmentName,
        attachmentType: this.selectedType,
        otherComments: this.otherComments,
        expiryDate: this.expiryDate,
        userId: this.selectedUserId,
        comments: this.comments,

        amazonUrl: this.uploadedFileUrl,
        fileKey: this.uploadedFileKey,
        fileName: this.uploadedFileName,
        fileSize: this.uploadedFileSize,

        folderId: this.currentFolderId
    };

    console.log(
        'Attachment Object =>',
        JSON.stringify(attachmentObj)
    );

    this.tempAttachments = [
        ...this.tempAttachments,
        attachmentObj
    ];

    console.log(
        'TEMP ATTACHMENTS =>',
        JSON.stringify(this.tempAttachments)
    );

    const newRow = {

        Id: 'TEMP_' + Date.now(),
        Name: attachmentObj.attachmentName,
        type: attachmentObj.attachmentType,
        comment: attachmentObj.comments,
        UserName: '',
        Date: this.formatDateForDisplay(
            attachmentObj.expiryDate
        ),

        expiryDate: attachmentObj.expiryDate,
        AmazonURL: attachmentObj.amazonUrl,
        fileSize: attachmentObj.fileSize,
        Key: attachmentObj.fileKey,
        OtherComments: attachmentObj.otherComments,
        FileName: attachmentObj.fileName,
// manendra added for Tsign
        signatureStatus: 'T Sign',
        buttonVariant: 'brand',
        signatureUrl: null,
       
        isTempAttachment: true
    };

    if (
        this.currentFolderId &&
        this.currentFolderId.startsWith('TEMP_FOLDER_')
    ) {

        this.refreshFolderAttachments();

    } else {

        this.records = [
            ...this.records,
            newRow
        ];

        this.totalRecords = this.records.length;

        this.pageNumber = 1;
        this.pageSize = this.pageSizeOptions[0];

        this.paginationHelper();
    }

    console.log(
        'Dispatching attachmentsave event =>',
        JSON.stringify(attachmentObj)
    );

    this.dispatchEvent(
        new CustomEvent('attachmentsave', {
            detail: attachmentObj,
            bubbles: true,
            composed: true
        })
    );

    console.log(
        'attachmentsave event dispatched successfully'
    );

    this.hideModalBox();

    console.log(
        'Modal closed'
    );

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success',
            message: 'Attachment added',
            variant: 'success'
        })
    );

    console.log(
        '================ CHILD HANDLE SAVE END ================'
    );
}

handleAttachmentTypeChange(event) {

    this.attachmentType = event.detail.value;
    this.showOtherField = this.attachmentType === 'Other';

    console.log(
        'Selected Type =>',
        this.attachmentType
    );

    console.log(
        'showOtherField =>',
        this.showOtherField
    );
}

refreshFolderAttachments() {

    console.log(
        'TEMP ATTACHMENTS BEFORE REFRESH =>',
        JSON.stringify(this.tempAttachments)
    );

    console.log(
        'CURRENT FOLDER =>',
        this.currentFolderId
    );

    const folderId =
        this.currentFolderId || null;

    this.records =
        this.tempAttachments
            .filter(
                x =>
                    (x.folderId || null) ===
                    folderId
            )
            .map(att => ({
                Id: att.tempId,
                Name: att.attachmentName,
                type: att.attachmentType,
                comment: att.comments,
                UserName: '',
                Date: this.formatDateForDisplay(
                    att.expiryDate
                ),

                expiryDate: att.expiryDate,
                AmazonURL: att.amazonUrl,
                fileSize: att.fileSize,
                Key: att.fileKey,
                OtherComments: att.otherComments,
                FileName: att.fileName
            }));

    console.log(
        'RECORDS AFTER REFRESH =>',
        JSON.stringify(this.records)
    );

    this.totalRecords =
        this.records.length;

    this.paginationHelper();
}

handleUpdateAttachment() {

    console.log('handledEditClicked');
    const attachmentId =
        this.editingAttachmentId;

    // TEMP ATTACHMENT
    if(
        attachmentId &&
        attachmentId.startsWith('TEMP_')
    ){

        this.tempAttachments =
            this.tempAttachments.map(
                att => {

                    if(
                        att.tempId ===
                        attachmentId
                    ){

                        return {

                            ...att,

                            attachmentName: this.attachmentName,
                            attachmentType: this.selectedType,
                            comments: this.comments,
                            expiryDate: this.expiryDate,
                            amazonUrl: this.uploadedFileUrl,
                            fileKey: this.uploadedFileKey,
                            fileName: this.uploadedFileName,
                            fileSize: this.uploadedFileSize
                        };
                    }

                    return att;
                }
            );

        this.refreshFolderAttachments();
        this.hideModalBox();

        return;
    }

    // SALESFORCE ATTACHMENT

    const editedAttachment = {

        Id: attachmentId,
        attachmentName: this.attachmentName,
        attachmentType: this.selectedType,
        comments: this.comments,
        expiryDate: this.expiryDate,

        amazonUrl: this.uploadedFileUrl,
        fileKey: this.uploadedFileKey,
        fileName: this.uploadedFileName,
        fileSize: this.uploadedFileSize
    };

    console.log('EDITED ATTACHMENT =>',JSON.stringify(editedAttachment));

    // ===================================
    // UPDATE TABLE IMMEDIATELY
    // ===================================


    console.log(
        'NEW FILE URL =>',
        this.uploadedFileUrl
    );

    console.log(
        'NEW FILE NAME =>',
        this.uploadedFileName
    );

    console.log(
        'NEW FILE KEY =>',
        this.uploadedFileKey
    );

    this.records =
        this.records.map(row => {

            if (
                row.Id === attachmentId
            ) {

                return {

                    ...row,
                    Name: this.attachmentName,
                    type: this.selectedType,
                    comment: this.comments,
                    Date: this.formatDateForDisplay(
                        this.expiryDate
                    ),
                    expiryDate: this.expiryDate,
                    AmazonURL: this.uploadedFileUrl,
                    Key: this.uploadedFileKey,
                    FileName: this.uploadedFileName,
                    fileSize: this.uploadedFileSize
                };
            }

            return row;
        });

    this.records = [
        ...this.records
    ];

    this.totalRecords =
        this.records.length;

    this.paginationHelper();

    console.log(
        'RECORDS AFTER EDIT =>',
        JSON.stringify(this.records)
    );

    // ===================================
    // MAINTAIN SINGLE EDIT RECORD
    // ===================================

    const existingIndex =
        (this.editedAttachments || [])
            .findIndex(
                x =>
                    x.Id ===
                    attachmentId
            );

    if (existingIndex >= 0) {

        this.editedAttachments[
            existingIndex
        ] = editedAttachment;

        this.editedAttachments = [
            ...this.editedAttachments
        ];

    } else {

        this.editedAttachments = [

            ...(this.editedAttachments || []),

            editedAttachment
        ];
    }

    console.log(
        'EDITED ATTACHMENTS =>',
        JSON.stringify(
            this.editedAttachments
        )
    );

    // ===================================
    // SEND TO PARENT
    // ===================================

    this.dispatchEvent(
        new CustomEvent(
            'attachmentedit',
            {
                detail:
                    this.editedAttachments,
                bubbles: true,
                composed: true
            }
        )
    );

    this.hideModalBox();

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success',
            message: 'Attachment updated successfully.',
            variant: 'success'
        })
    );
}

formatDateForDisplay(dateString) {

    if (!dateString) {
        return '';
    }

    const date = new Date(dateString);

    return `${date.getDate()}/${
        date.getMonth() + 1
    }/${date.getFullYear()}`;
}

    handleFocus() {
        this.showMuteIcon = true;

        const speechComp =
            this.template.querySelector('c-speech-to-text');

        if (speechComp) {
            speechComp.stopListening();
        }
    }


    handleTranscript(event) {
       this.comments =
            (this.comments || '') +
            event.detail.text;
    }

    handleClear() {
       this.comments = '';
    }

    resetForm() {
        this.comments = '';
        this.showMuteIcon = false;
    }

    handleBlur() {
        setTimeout(() => {
            this.showMuteIcon = false;
        }, 300);
    }
}