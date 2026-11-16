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
//import fetchStaffOptions from '@salesforce/apex/StaffController.fetchStaffDocuments';
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

import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import ATTACHMENT_OBJECT  from '@salesforce/schema/Attachment__c';
import TYPE_FIELD from '@salesforce/schema/Attachment__c.Type__c';
import getPublicAttachments from '@salesforce/apex/ClientAttachmentHandler.getPublicAttachments';
import getClientShareStaffUsers from '@salesforce/apex/StaffController.getClientShareStaffUsers';

const ROLE_ORDER = [
    'Roster Manager',
    'HR Admin',
    'Payroll Admin',
    'NDIS Staff',
    'Roster Coordinator'
];

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

export default class ClientAttachment extends LightningElement {
    // JS Properties 
    @api clientId;
    @api recordId;
    @api node;
    @api level = 0;
    @api selectedId;
    @api 
    get subroute() {
        return this._subroute;
    }
    set subroute(val) {
        this._subroute = val;
        this.processSubroute(val);
    }
    _pendingSubroute;    

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

    @track archiveSearchKey = '';
    @track allArchivedRecords = [];

    @track archiveModal = false;
    @track archivedRecords = [];
    @track searchKey = '';// manendra added for global search
    allRecords = [];// manendra added for global search
    @track typeOptions = [];// manendra added for global search
    @track selectedType = '';// manendra added for global search
    @track isShiftReportsContext = false;

    // STAFF SHARE TABLE STATE
@track allStaffList = [];
@track roleOptions = [];
@track selectedRoles = [];
@track staffSearchKey = '';

@track staffPageNumber = 1;
@track staffPageSize = 10;
    
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    //manendra added for table sortin
        @track tableSortState = {
        attachments: {
            field: '',
            direction: 'asc',
            icons: {
                Name: '',
                type: '',
                fileSize: '',
                comment: '',
                UserName: '',
                lastModifiedUser: '',
                lastModifiedDate: '',
                Date: ''
            }
        },
        archived: {
            field: '',
            direction: 'asc',
            icons: {
                Name: '',
                Type: '',
                ArchivedDate: '',
                ExpiryDate: '',
                ParentFolder: '',
                FolderPath: ''
            }
        }
    };
    
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
            .finally(() => { this.isShowSpinner = false; });

        this.loadContacts()
            .then(() => this.loadFolders());

        this.storedFacilityId = localStorage.getItem("defaultFacilityId");

        console.log('📌 FacilityId from localStorage:', this.storedFacilityId);

        // this.loadStaffOptions();
        this.loadPublicFiles();
    }

    changeExpense(event){        
        if (event.detail.value == 'Other') {
            this.textboxFlag = true;
        } else{
            this.textboxFlag = false;
        } 
    }
    //manendra added for global search
    handleSearch(event) {

        this.searchKey = event.target.value;

        const searchValue =
            (this.searchKey || '').toLowerCase().trim();

        if (!searchValue) {

            this.records = [...this.allRecords];

        } else {

            this.records = this.allRecords.filter(record => {

        const name = (record.Name || '').toLowerCase();
        const type = (record.type || '').toLowerCase();
        const uploadedBy = (record.UserName || '').toLowerCase();
        const lastModifiedBy = (record.lastModifiedUser || '').toLowerCase();

        return (
            name.includes(searchValue) ||
            type.includes(searchValue) ||
            uploadedBy.includes(searchValue) ||
            lastModifiedBy.includes(searchValue)
        );
    });
        }

        this.totalRecords = this.records.length;
        this.pageNumber = 1;

        this.paginationHelper();
    }
     //manendra added for global search end
    // fetchReplist() {

    //     console.log('================ FETCH START =================');

    //     return getCurrentLoggedUserInfo()
    //         .then(user => {

    //             console.log('🔵 User Info:', JSON.stringify(user));

    //             this.currentUserType = user.User_Type__c;

    //             return Promise.all([

    //                 fetchAttachmentsForStaff({ 
    //                     clientId: this.clientId,
    //                     folderId: this.currentFolderId
    //                 }),

    //                 fetchClientAttachmentsSecure({ 
    //                     clientId: this.clientId,
    //                     folderId: this.currentFolderId
    //                 })
    //             ]);
    //         })

    //         .then(([ownDocs, sharedDocs]) => {

    //             console.log('🟢 OWN DOCS:', JSON.stringify(ownDocs));
    //             console.log('🟣 SHARED DOCS:', JSON.stringify(sharedDocs));

    //             const combined = [
    //                 ...(ownDocs || []),
    //                 ...(sharedDocs || [])
    //             ];

    //             console.log('🟡 COMBINED BEFORE DEDUPE:', JSON.stringify(combined));

    //             const map = new Map();
    //             combined.forEach(rec => map.set(rec.Id, rec));

    //             let finalList = Array.from(map.values());

    //             if (!this.currentFolderId) {

    //                 finalList = finalList.filter(record =>
    //                     !record.Participant_Contact__c &&
    //                     record.Is_Public__c !== true
    //                 );
    //             }

    //             console.log('🟢 FINAL LIST:', JSON.stringify(finalList));

    //             this.records = [];
    //             this.totalRecords = 0;

    //             setTimeout(() => {

    //                 this.allRecords = finalList.map(record => {                                                                

    //                     console.log('DEBUG Size from DB:', record.Size__c);

    //                     return {
    //                         Id: record.Id,
    //                         AttachmentUID: record.Attachment_UID__c,
    //                         ParticipantDocUID: record.Participant_Doc_UID__c,                            
    //                         Name: record.Name,
    //                         type: record.Type__c,
    //                         comment: record.Comments__c,
    //                         UserName: record.USer_Name__c,
    //                         lastModifiedUser: record.LastModifiedBy?.Name,
    //                         lastModifiedDate: record.LastModifiedDate
    //                             ? new Intl.DateTimeFormat('en-GB').format(new Date(record.LastModifiedDate))
    //                             : '',
    //                         Date: record.Date_Format__c,
    //                         AmazonURL: record.Amazon_file_URL__c,
    //                         fileSize: this.formatFileSize(record.Size__c),
    //                         Key: record.Key__c,
    //                         Participant_Contact__c: record.Participant_Contact__c,
    //                         Is_Public__c: record.Is_Public__c,
    //                         showPermissionIcon: this.shouldShowPermissionIcon(record)
    //                     };
    //                 });
    //                 this.records = [...this.allRecords]; //manendra added for global search
    //                 this.totalRecords = this.records.length;

    //                 this.pageSize = this.pageSizeOptions[0];
    //                 this.pageNumber = 1;

    //                 console.log('🟢 RECORDS SET:', JSON.stringify(this.records));

    //                 this.paginationHelper();
    //                 if (this._pendingSubroute) {
    //                     this.processSubroute(this._pendingSubroute);
    //                     this._pendingSubroute = null;
    //                 }
                    

    //             }, 0);
    //         })

    //         .catch(error => {
    //             console.error('❌ ERROR:', error);
    //         });
    // }

fetchReplist() {

    console.log('====================================================');
    console.log('🔥🔥🔥 FETCH REPLIST START 🔥🔥🔥');
    console.log('====================================================');

    console.log('📌 Initial currentFolderId:', this.currentFolderId);
    console.log('📌 Initial currentFolderName:', this.currentFolderName);
    console.log('📌 Initial clientId:', this.clientId);
    console.log('📌 Initial isStaff:', this.isStaff);
    console.log('📌 Initial userType:', this.userType);
    console.log('📌 Initial currentUserType:', this.currentUserType);

    return getCurrentLoggedUserInfo()
        .then(user => {

            console.log('====================================================');
            console.log('👤 CURRENT USER INFO');
            console.log('====================================================');

            console.log('🔵 User Info:', JSON.stringify(user));

            console.log('🔵 User Type:', user?.User_Type__c);

            this.currentUserType = user.User_Type__c;

            console.log(
                '🔵 currentUserType AFTER assignment:',
                this.currentUserType
            );

            console.log('====================================================');
            console.log('🚀 CALLING BOTH APEX METHODS');
            console.log('====================================================');

            console.log(
                '📌 fetchAttachmentsForStaff PARAMS:',
                JSON.stringify({
                    clientId: this.clientId,
                    folderId: this.currentFolderId
                })
            );

            console.log(
                '📌 fetchClientAttachmentsSecure PARAMS:',
                JSON.stringify({
                    clientId: this.clientId,
                    folderId: this.currentFolderId
                })
            );

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

            console.log('====================================================');
            console.log('🔥🔥🔥 APEX RESPONSES RECEIVED 🔥🔥🔥');
            console.log('====================================================');

            // ============================================
            // OWN DOCS
            // ============================================

            console.log(
                '🟢 OWN DOCS COUNT:',
                ownDocs?.length
            );

            console.log(
                '🟢 OWN DOCS RAW:',
                JSON.stringify(ownDocs)
            );

            (ownDocs || []).forEach((record, index) => {

                console.log(
                    `🟢 OWN DOC #${index}`,
                    {
                        Id: record?.Id,
                        Name: record?.Name,

                        Is_Public__c: record?.Is_Public__c,
                        Is_Public_Type: typeof record?.Is_Public__c,

                        Participant_Contact__c:
                            record?.Participant_Contact__c,

                        Participant_Contact_Type:
                            typeof record?.Participant_Contact__c,

                        Attachment_Folder__c:
                            record?.Attachment_Folder__c,

                        Attachment_Folder_Type:
                            typeof record?.Attachment_Folder__c
                    }
                );

            });

            // ============================================
            // SHARED DOCS
            // ============================================

            console.log(
                '🟣 SHARED DOCS COUNT:',
                sharedDocs?.length
            );

            console.log(
                '🟣 SHARED DOCS RAW:',
                JSON.stringify(sharedDocs)
            );

            (sharedDocs || []).forEach((record, index) => {

                console.log(
                    `🟣 SHARED DOC #${index}`,
                    {
                        Id: record?.Id,
                        Name: record?.Name,

                        Is_Public__c: record?.Is_Public__c,
                        Is_Public_Type: typeof record?.Is_Public__c,

                        Participant_Contact__c:
                            record?.Participant_Contact__c,

                        Participant_Contact_Type:
                            typeof record?.Participant_Contact__c,

                        Attachment_Folder__c:
                            record?.Attachment_Folder__c,

                        Attachment_Folder_Type:
                            typeof record?.Attachment_Folder__c
                    }
                );

            });

            // ============================================
            // COMBINE
            // ============================================

            const combined = [
                ...(ownDocs || []),
                ...(sharedDocs || [])
            ];

            console.log('====================================================');
            console.log('🟡 COMBINED DATA');
            console.log('====================================================');

            console.log(
                '🟡 COMBINED COUNT:',
                combined.length
            );

            console.log(
                '🟡 COMBINED BEFORE DEDUPE:',
                JSON.stringify(combined)
            );

            combined.forEach((record, index) => {

                console.log(
                    `🟡 COMBINED #${index}`,
                    {
                        Id: record?.Id,
                        Name: record?.Name,
                        Is_Public__c: record?.Is_Public__c,
                        Participant_Contact__c:
                            record?.Participant_Contact__c,
                        Attachment_Folder__c:
                            record?.Attachment_Folder__c
                    }
                );

            });

            // ============================================
            // DEDUPE
            // ============================================

            const map = new Map();

            combined.forEach(rec => {

                const existing = map.get(rec.Id);

                if (!existing) {

                    map.set(rec.Id, rec);

                } else {

                    // Merge both records.
                    // Prefer values that are actually populated.

                    map.set(rec.Id, {
                        ...existing,
                        ...rec,

                        Is_Public__c:
                            rec.Is_Public__c !== undefined
                                ? rec.Is_Public__c
                                : existing.Is_Public__c,

                        Participant_Contact__c:
                            rec.Participant_Contact__c !== undefined
                                ? rec.Participant_Contact__c
                                : existing.Participant_Contact__c
                    });
                }
            });

            let finalList = Array.from(map.values());

            console.log('====================================================');
            console.log('🟢 AFTER DEDUPE');
            console.log('====================================================');

            console.log(
                '🟢 FINAL LIST COUNT:',
                finalList.length
            );

            finalList.forEach((record, index) => {

                console.log(
                    `🟢 FINAL LIST #${index}`,
                    {
                        Id: record?.Id,
                        Name: record?.Name,
                        Is_Public__c: record?.Is_Public__c,
                        Participant_Contact__c:
                            record?.Participant_Contact__c,
                        Attachment_Folder__c:
                            record?.Attachment_Folder__c
                    }
                );

            });

            // ============================================
            // ALL DOCUMENTS FILTER
            // ============================================

            console.log('====================================================');
            console.log('📁 ALL DOCUMENTS CHECK');
            console.log('====================================================');

            console.log(
                'currentFolderId:',
                this.currentFolderId
            );

            console.log(
                'currentFolderName:',
                this.currentFolderName
            );

            console.log('====================================================');
            console.log('🔥 FINAL LIST AFTER ALL DOCUMENT FILTER');
            console.log('====================================================');

            console.log(
                'Final List Count:',
                finalList.length
            );

            finalList.forEach((record, index) => {

                console.log(
                    `FINAL FILTERED #${index}`,
                    {
                        Id: record?.Id,
                        Name: record?.Name,
                        Is_Public__c: record?.Is_Public__c,
                        Participant_Contact__c:
                            record?.Participant_Contact__c,
                        Attachment_Folder__c:
                            record?.Attachment_Folder__c
                    }
                );

            });

            // ============================================
            // RESET
            // ============================================

            this.records = [];
            this.totalRecords = 0;

            setTimeout(() => {

                console.log('====================================================');
                console.log('⏱️ SETTIMEOUT / MAPPING START');
                console.log('====================================================');

                console.log(
                    'Mapping Final List Count:',
                    finalList.length
                );

                this.allRecords = finalList.map(record => {

                    console.log('----------------------------------------------------');
                    console.log('🔵 MAPPING RECORD');
                    console.log('----------------------------------------------------');

                    console.log(
                        'Record Id:',
                        record?.Id
                    );

                    console.log(
                        'Record Name:',
                        record?.Name
                    );

                    console.log(
                        'Record Is_Public__c:',
                        record?.Is_Public__c
                    );

                    console.log(
                        'Record Is_Public__c TYPE:',
                        typeof record?.Is_Public__c
                    );

                    console.log(
                        'Record Participant_Contact__c:',
                        record?.Participant_Contact__c
                    );

                    console.log(
                        'Record Attachment_Folder__c:',
                        record?.Attachment_Folder__c
                    );

                    const permissionResult =
                        this.shouldShowPermissionIcon(record);

                    console.log(
                        '🔐 PERMISSION RESULT:',
                        permissionResult
                    );

                    const mappedRecord = {

                        Id: record.Id,

                        AttachmentUID:
                            record.Attachment_UID__c,

                        ParticipantDocUID:
                            record.Participant_Doc_UID__c,

                        Name:
                            record.Name,

                        type:
                            record.Type__c,

                        comment:
                            record.Comments__c,

                        UserName:
                            record.USer_Name__c,

                        lastModifiedUser: [record.LastModifiedBy?.FirstName, record.LastModifiedBy?.LastName]
                            .filter(Boolean).join(' '),

                        lastModifiedDate:
                            record.LastModifiedDate
                                ? new Intl.DateTimeFormat(
                                    'en-GB'
                                  ).format(
                                    new Date(
                                        record.LastModifiedDate
                                    )
                                  )
                                : '',

                        Date:
                            record.Date_Format__c,

                        AmazonURL:
                            record.Amazon_file_URL__c,

                        fileSize:
                            this.formatFileSize(
                                record.Size__c
                            ),

                        Key:
                            record.Key__c,

                        Participant_Contact__c:
                            record.Participant_Contact__c,

                        Is_Public__c:
                            record.Is_Public__c,

                        showPermissionIcon:
                            permissionResult,

                        // Contact attachment in All Documents
                        isContactAttachment:
                            !!record.Participant_Contact__c,

                        // Public attachment
                        isPublicAttachment:
                            record.Is_Public__c === true,

                        // Only View is allowed for Contact attachments
                        showViewOnly:
                            !!record.Participant_Contact__c
                    };

                    console.log(
                        '🟣 MAPPED RECORD:',
                        JSON.stringify(mappedRecord)
                    );

                    return mappedRecord;
                });

                console.log('====================================================');
                console.log('🟢 ALL RECORDS AFTER MAPPING');
                console.log('====================================================');

                console.log(
                    'ALL RECORDS:',
                    JSON.stringify(this.allRecords)
                );

                this.records = [
                    ...this.allRecords
                ];

                this.totalRecords =
                    this.records.length;

                console.log(
                    '🟢 RECORDS COUNT:',
                    this.records.length
                );

                this.pageSize =
                    this.pageSizeOptions[0];

                this.pageNumber = 1;

                console.log(
                    '📄 Pagination:',
                    {
                        pageSize: this.pageSize,
                        pageNumber: this.pageNumber,
                        totalRecords: this.totalRecords
                    }
                );

                this.paginationHelper();

                console.log(
                    '🟢 FINAL PAGINATED RECORDS:',
                    JSON.stringify(this.records)
                );

                if (this._pendingSubroute) {

                    console.log(
                        '🔀 Processing pending subroute:',
                        this._pendingSubroute
                    );

                    this.processSubroute(
                        this._pendingSubroute
                    );

                    this._pendingSubroute = null;
                }

                console.log('====================================================');
                console.log('🔥🔥🔥 FETCH REPLIST COMPLETE 🔥🔥🔥');
                console.log('====================================================');

            }, 0);
        })

        .catch(error => {

            console.error('====================================================');
            console.error('❌❌❌ FETCH REPLIST ERROR ❌❌❌');
            console.error('====================================================');

            console.error(
                'Error:',
                error
            );

            console.error(
                'Error JSON:',
                JSON.stringify(error)
            );

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
// manendra added for global search
    @wire(getObjectInfo, {
    objectApiName: ATTACHMENT_OBJECT}) objectInfo;
     @wire(getPicklistValues, {
    recordTypeId: '$objectInfo.data.defaultRecordTypeId',
    fieldApiName: TYPE_FIELD
    })
    wiredTypeValues({ data, error }) {

        if (data) {

            this.typeOptions = data.values.map(item => ({
                label: item.label,
                value: item.value
            }));

            console.log(
                'Type Picklist Values => ',
                JSON.stringify(this.typeOptions)
            );
        }

        if (error) {
            console.error(
                'Type Picklist Error => ',
                JSON.stringify(error)
            );
        }
    }

    handleTypeChange(event) {
    this.selectedType = event.detail.value;
    this.textboxFlag = this.selectedType === 'Other';

    console.log( 'Selected Type => ', this.selectedType );
 }
    // manendra added for global search end

    RefreshAttachmentsData(event){
        // this.fetchReplist();     
        this.refreshCurrentView();   
    }

    handleAttachment(){
        this.fieldErrorMap ={};
        this.successmessage='Attachment created successfully.';
        this.isOpenModal=true;
        this.isEdit=false;
        this.UpdateDetails = false;
        this.fileName='';
        this._syncRoute();
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
    if (!this.selectedType) {
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Error',
            message: 'Type is required',
            variant: 'error'
        })
    );
    return;
}

    const fields = event.detail.fields;
    fields.Type__c = this.selectedType;
    // ✅ If new file uploaded → prepare fields
    if (this.uploadedFile) {
        fields.Amazon_file_URL__c = this.uploadedFile.url;
        fields.Size__c = String(this.uploadedFile.size) || 0;
        fields.Key__c = this.uploadedFile.key;
    }

        fields.Added_By__c = this.clientId;
        fields.Attachment_Folder__c = this.currentFolderId;
        fields.Participant__c = this.clientId;
        // ✅ PUBLIC_NODE is virtual, not a real Attachment_Folder__c record
        if (this.currentFolderId === 'PUBLIC_NODE') {
            fields.Attachment_Folder__c = null;
            fields.Is_Public__c = true;
        } else {
            fields.Attachment_Folder__c = this.currentFolderId;
        }

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
            this.refreshCurrentView(); // ✅ runs AFTER size is written to DB
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating file size',
                    message: error.message,
                    variant: 'error',
                })
            );
            this.refreshCurrentView(); // ✅ still refresh even if size update fails
        });

    } else {
        // Edit flow or no file uploaded — safe to refresh immediately
        this.refreshCurrentView();
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
        this.selectedType = '';
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
        this.selectedType = event.currentTarget.dataset.type;
        console.log('checktype',this.selectedType);
    }
    @track deleteFlag =false;

    handleDelete(event){
        this.recordId = event.currentTarget.dataset.id;
        this.deleteFlag= true;
        this._syncRoute();
        
    }

    // handledeletefile(){
    //     this.delRep(this.recordId);  
    //     this.fetchReplist(); 
    //     this.deleteFlag= false;
    //     this._syncRoute();
            
    // }

    handledeletefile(){
        this.isShowSpinner = true;
        this.delRep(this.recordId)
            .then(() => this.refreshCurrentView())
            .finally(() => {
                this.isShowSpinner = false;
            });
        this.deleteFlag = false;
        this._syncRoute();
    }

    handleclose(){
        this.deleteFlag= false;
        this._syncRoute();
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
        return deleteRepository({ repData: currentRow }).then(result => {
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
            throw error;            
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
    //manendra added for table sorting                         
    let displayRecords = [...this.records];
    const state = this.tableSortState.attachments;
    if (state.field) {
        displayRecords = this.sortData(
            displayRecords,
            state.field,
            state.direction
        );
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
            //this.data.push(this.records[i]);
            this.data.push(displayRecords[i]);// manendra added for table sorting
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
        this.selectedId = event.currentTarget.dataset.id;
        this.isModalOpen = true;
        this.isHome = false;
        this.archiveModal = false;
        this._syncRoute();
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
        this.selectedId = null;
        this.isHome = true;
        this._syncRoute();
    }
    
    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    // handleShare(event){
    //     this.currentDocumentId = event.currentTarget.dataset.id;
    //     this.currentStaffId = event.currentTarget.dataset.staffid;
    //     this.loadStaffByDoc(this.currentDocumentId);
    //     console.log('StaffId: '+this.currentStaffId);
    //      console.log('currentDocumentId: '+this.currentDocumentId);
    //     this.assignmentFlag = true;
    //     this._syncRoute();
    // }

    // loadStaffByDoc(docId) {

    //     console.log('===== loadStaffByDoc START =====');
    //     console.log('Document Id => ', docId);

    //     fetchStaffByDoc({ docId: docId })

    //         .then(result => {

    //             console.log('===== fetchStaffByDoc RESULT =====');

    //             console.log(
    //                 'Raw Result => ',
    //                 JSON.stringify(result)
    //             );

    //             console.log(
    //                 'Total Records => ',
    //                 result ? result.length : 0
    //             );

    //             (result || []).forEach((staff, index) => {

    //                 console.log(`----- Staff Record ${index + 1} -----`);

    //                 console.log(
    //                     'Full Staff Record => ',
    //                     JSON.stringify(staff)
    //                 );

    //                 console.log(
    //                     'Share Record Id => ',
    //                     staff.Id
    //                 );

    //                 console.log(
    //                     'Staff__c => ',
    //                     staff.Staff__c
    //                 );

    //                 console.log(
    //                     'Display_Nickname__c => ',
    //                     staff.Display_Nickname__c
    //                 );

    //                 console.log(
    //                     'Is_Active__c => ',
    //                     staff.Is_Active__c
    //                 );
    //             });

    //             const selectedIds =
    //                 (result || []).map(
    //                     staff => staff.Staff__c
    //                 );

    //             console.log(
    //                 '===== SELECTED IDS ====='
    //             );

    //             console.log(
    //                 'selectedIds => ',
    //                 JSON.stringify(selectedIds)
    //             );

    //             this.selectedStaffIds = [...selectedIds];

    //             console.log(
    //                 '===== FINAL UI STATE ====='
    //             );

    //             console.log(
    //                 'selectedStaffIds => ',
    //                 JSON.stringify(this.selectedStaffIds)
    //             );
    //         })

    //         .catch(error => {

    //             console.error(
    //                 '===== loadStaffByDoc ERROR ====='
    //             );

    //             console.error(
    //                 'Error => ',
    //                 JSON.stringify(error)
    //             );

    //             console.error(
    //                 'Raw Error => ',
    //                 error
    //             );
    //         });
    // }

    // loadStaffOptions() {
    //     console.log('===== loadStaffOptions START =====');
    //     console.log('storedFacilityId => ', this.storedFacilityId);

    //     fetchStaffOptions()
    //         .then(result => {

    //             console.log('===== fetchStaffOptions RESULT =====');
    //             console.log('Total Staff Returned => ', result?.length);
    //             console.log('Full Result => ', JSON.stringify(result));

    //             result.forEach((staff, index) => {
    //                 console.log(`--- Staff ${index + 1} ---`);
    //                 console.log('Id => ', staff.Id);
    //                 console.log('Name => ', staff.Name);
    //                 console.log('NameToDisplay__c => ', staff.NameToDisplay__c);
    //                 console.log('Facility__c => ', staff.Facility__c);
    //                 console.log(
    //                     'Facility Match => ',
    //                     staff.Facility__c === this.storedFacilityId
    //                 );
    //             });

    //             const filteredData = result.filter(staff => {

    //             const childFacilities =
    //                 staff.Staff_Facilities__r || [];

    //             const isMatch = childFacilities.some(
    //                 facility =>
    //                     facility.Facility__c ===
    //                     this.storedFacilityId
    //             );

    //     return isMatch;
    // });
                

    //             console.log('===== FILTERED STAFF =====');
    //             console.log('Filtered Count => ', filteredData.length);
    //             console.log('Filtered Data => ', JSON.stringify(filteredData));

    //             this.filteredStaffOptions = filteredData.map(staff => ({
    //                 label: staff.NameToDisplay__c || staff.Name,
    //                 value: staff.Id
    //             }));

    //             console.log('===== FINAL OPTIONS =====');
    //             console.log(
    //                 'filteredStaffOptions => ',
    //                 JSON.stringify(this.filteredStaffOptions)
    //             );

    //         })
    //         .catch(error => {
    //             console.error('===== loadStaffOptions ERROR =====');
    //             console.error('Error => ', JSON.stringify(error));
    //             console.error('Raw Error => ', error);
    //         });
    // }

    handleduallist(event) {
        this.selectedStaffIds = event.detail.value;
    }

    // handleassignmentinsert() {

    //     // 1️⃣ Validation
    //     // if (!this.selectedStaffIds || this.selectedStaffIds.length === 0) {
    //     //     this.dispatchEvent(
    //     //         new ShowToastEvent({
    //     //             title: 'Error',
    //     //             message: 'Please select at least one staff',
    //     //             variant: 'error'
    //     //         })
    //     //     );
    //     //     return;
    //     // }

    //     // console.log('DocId:', this.currentDocumentId);
    //     // console.log('Selected Staff:', JSON.stringify(this.selectedStaffIds));

    //     // 2️⃣ Call Apex
    //     saveParticipantDocShares({
    //         docId: this.currentDocumentId,
    //         staffIds: this.selectedStaffIds
    //     })
    //     .then(() => {

    //         // 3️⃣ Success Toast
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Success',
    //                 message: 'Access granted successfully',
    //                 variant: 'success'
    //             })
    //         );

    //         // 4️⃣ Reset + Close Modal
    //         this.assignmentFlag = false;
    //         this.selectedStaffIds = [];
    //         this.currentDocumentId = null;
    //         this._syncRoute();

    //         // 5️⃣ Refresh list
    //         this.fetchReplist();
    //     })
    //     .catch(error => {
    //         console.error('Error saving share:', error);

    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Failed to grant access',
    //                 variant: 'error'
    //             })
    //         );
    //     });
    // }

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
    this.selectedType = '';
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

    console.log('=== loadFolders START ===');
    console.log('Client Id:', this.clientId);
    console.log('isStaff:', this.isStaff);

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

            // ✅ PUBLIC folder — sits below Contacts, visible to EVERY role
            const publicNode = {
                Id: 'PUBLIC_NODE',
                Name: 'Public',
                children: [],
                isSystemNode: true,
                isPublicNode: true
            };

            finalTree.push(publicNode);

            // ✅ NEW — SHIFT REPORTS folder, Org Admin only (system node, no menu actions)
            if (this.isOrgAdminUser) {

                const shiftReportsNode = {
                    Id: 'SHIFT_REPORTS_NODE',
                    Name: 'Shift Reports',
                    children: [],
                    isSystemNode: true,
                    isShiftReportsNode: true
                };

                finalTree.push(shiftReportsNode);
            }

            this.folderTree = JSON.parse(JSON.stringify(finalTree));

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
    this.isShiftReportsContext = false;

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
   this.searchKey = ''; 
    // 🔥 START SPINNER
    this.isShowSpinner = true;
    this.isShiftReportsContext = false;
    const id = event.detail.id;
    this.currentFolderId = id;

    console.log("current folder", this.currentFolderId);

    // 🔥 Selected Folder Name
    if (id === 'CONTACTS_NODE') {

        this.currentFolderName = 'Contacts';

    } else if (id === 'PUBLIC_NODE') {

    this.currentFolderName = 'Public';

    } else if (id === 'SHIFT_REPORTS_NODE') {

        this.currentFolderName = 'Shift Reports';
        
    } 
    else if (this.isContactNode(id)) {

        const contact = this.contacts.find(c => c.Id === id);

        this.currentFolderName = contact?.Name || 'Contact Files';

    } else {

        this.currentFolderName =
            this.folders.find(f => f.Id === id)?.Name
            || 'All Documents';
    }

    // 🔥 PUBLIC ROOT CLICK
    if (id === 'PUBLIC_NODE') {

        this.loadPublicFiles()
            .finally(() => {
                this.isShowSpinner = false;
            });

        return;
    }

    // 🔥 CONTACT ROOT CLICK
    if (id === 'CONTACTS_NODE') {

        this.loadAllContactFiles()
            .finally(() => {
                this.isShowSpinner = false;
            });

        return;
    }

    if (id === 'SHIFT_REPORTS_NODE') {
        this.isShiftReportsContext = true;
        this.isShowSpinner = false;
        return; // table for this view is rendered by the child component itself
    }
    this.isShiftReportsContext = false;

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
                Name: file.Name || file.File_Name__c,
                AmazonURL: file.Amazon_file_URL__c,
                Key: file.Key__c,
                fileSize: this.formatFileSize(file.Size__c),
                UserName: [file.CreatedBy?.FirstName, file.CreatedBy?.LastName]
                    .filter(Boolean).join(' '),
                Date: file.Date_Format__c,
                type: file.Type__c,
                comment:  file.Comments__c,
               lastModifiedUser: [file.LastModifiedBy?.FirstName, file.LastModifiedBy?.LastName]
                    .filter(Boolean).join(' '),
                lastModifiedDate: file.LastModifiedDate
                    ? new Intl.DateTimeFormat('en-GB').format(new Date(file.LastModifiedDate))
                    : '',
                isContactAttachment: true,
                showViewOnly: true,
                showPermissionIcon: false
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
                Name: file.Name || file.File_Name__c,
                AmazonURL: file.Amazon_file_URL__c,
                Key: file.Key__c,
                fileSize: this.formatFileSize(file.Size__c),
                UserName: [file.CreatedBy?.FirstName, file.CreatedBy?.LastName]
                    .filter(Boolean).join(' '),
                Date: file.Date_Format__c,
                ContactName: `${firstName} ${lastName}`.trim(),
                comments:  file.Comments__c,
                type: file.Type__c,
                lastModifiedUser: [file.LastModifiedBy?.FirstName, file.LastModifiedBy?.LastName]
                    .filter(Boolean).join(' '),
                lastModifiedDate: file.LastModifiedDate
                    ? new Intl.DateTimeFormat('en-GB').format(new Date(file.LastModifiedDate))
                    : '',
                isContactAttachment: true,
                showViewOnly: true,
                showPermissionIcon: false
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

// handleArchive(event) {

//     const attachmentId = event.currentTarget.dataset.id;

//     archiveAttachment({
//         attachmentId: attachmentId
//     })

//     .then(() => {

//         this.dispatchEvent(
//             new ShowToastEvent({
//                 title: 'Success',
//                 message: 'File archived successfully',
//                 variant: 'success'
//             })
//         );

//         this.fetchReplist();
//         this.loadPublicFiles();
//     })

//     .catch(error => {

//         console.error(error);

//         this.showToast('Archive failed');
//     });
// }

handleArchive(event) {

    const attachmentId =
        event.currentTarget.dataset.id;

    console.log('📦 Archive Attachment:', attachmentId);
    console.log('📁 Current Folder:', this.currentFolderId);

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

        // PUBLIC folder
        if (this.currentFolderId === 'PUBLIC_NODE') {

            console.log(
                '🌐 Public folder detected - refreshing Public files'
            );

            return this.loadPublicFiles();
        }

        // ALL DOCUMENTS / NORMAL FOLDER
        console.log(
            '📂 Normal folder - refreshing repository'
        );

        return this.fetchReplist();
    })
    .catch(error => {

        console.error(
            '❌ Archive failed:',
            JSON.stringify(error)
        );

        this.showToast('Archive failed');
    });
}

openArchiveModal() {

    this.loadArchivedFiles();
    
    this.archiveModal = true;
    this._syncRoute();
}

// loadArchivedFiles() {

//     console.log('=================================================');
//     console.log('📦 LOAD ARCHIVED FILES - START');
//     console.log('=================================================');

//     console.log('🔵 Client ID:', this.clientId);
//     console.log('🔵 Current Folder ID:', this.currentFolderId);
//     console.log('🔵 Current Folder Name:', this.currentFolderName);
//     console.log('🔵 Is Public Context:', this.isPublicContext);
//     console.log('🔵 Archive Modal:', this.archiveModal);

//     console.log('-------------------------------------------------');
//     console.log('📤 CALLING getArchivedAttachments');
//     console.log('-------------------------------------------------');

//     const requestParams = {
//         clientId: this.clientId,
//         folderId: this.currentFolderId
//     };

//     console.log(
//         '📤 Apex Parameters:',
//         JSON.stringify(requestParams)
//     );

//     getArchivedAttachments(requestParams)

//     .then(result => {

//         console.log('=================================================');
//         console.log('✅ getArchivedAttachments SUCCESS');
//         console.log('=================================================');

//         console.log(
//             '🟢 Raw Apex Result:',
//             JSON.stringify(result)
//         );

//         console.log(
//             '🟢 Result Type:',
//             typeof result
//         );

//         console.log(
//             '🟢 Result Is Array:',
//             Array.isArray(result)
//         );

//         console.log(
//             '🟢 Total Archived Records Returned:',
//             result ? result.length : 0
//         );

//         if (!result || result.length === 0) {

//             console.warn('⚠️ NO ARCHIVED RECORDS RETURNED FROM APEX');

//             console.log(
//                 '⚠️ Parameters used:',
//                 JSON.stringify(requestParams)
//             );

//             console.log(
//                 '⚠️ Current Folder:',
//                 this.currentFolderId
//             );

//             console.log('=================================================');
//             console.log('📦 LOAD ARCHIVED FILES - END / NO DATA');
//             console.log('=================================================');

//             this.allArchivedRecords = [];
//             this.archivedRecords = [];

//             return;
//         }

//         console.log('-------------------------------------------------');
//         console.log('📋 RAW ARCHIVED RECORD DETAILS');
//         console.log('-------------------------------------------------');

//         result.forEach((rec, index) => {

//             console.log(`========== ARCHIVED RECORD ${index + 1} ==========`);

//             console.log('Record ID:', rec.Id);
//             console.log('Name:', rec.Name);
//             console.log('Type:', rec.Type);

//             console.log(
//                 'Archived Date:',
//                 rec.ArchivedDate
//             );

//             console.log(
//                 'Archived By:',
//                 rec.ArchivedBy
//             );

//             console.log(
//                 'Amazon URL:',
//                 rec.AmazonURL
//             );

//             console.log(
//                 'Key__c:',
//                 rec.Key__c
//             );

//             console.log(
//                 'Parent Folder:',
//                 rec.ParentFolder
//             );

//             console.log(
//                 'Folder Path:',
//                 rec.FolderPath
//             );

//             console.log(
//                 'Expiry_Date__c:',
//                 rec.Expiry_Date__c
//             );

//             console.log(
//                 'ExpiryDate:',
//                 rec.ExpiryDate
//             );

//             console.log(
//                 'IsExpired:',
//                 rec.IsExpired
//             );

//             console.log(
//                 'Complete Record:',
//                 JSON.stringify(rec)
//             );
//         });

//         console.log('-------------------------------------------------');
//         console.log('📅 EXPIRY DATE PROCESSING');
//         console.log('-------------------------------------------------');

//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         console.log(
//             '📅 Today:',
//             today.toISOString()
//         );

//         const records = result.map((rec, index) => {

//             console.log(
//                 `🔄 Mapping Record ${index + 1}:`,
//                 rec.Id
//             );

//             console.log(
//                 '   rec.Expiry_Date__c =>',
//                 rec.Expiry_Date__c
//             );

//             console.log(
//                 '   rec.ExpiryDate =>',
//                 rec.ExpiryDate
//             );

//             const expiryDate = rec.Expiry_Date__c
//                 ? new Date(rec.Expiry_Date__c)
//                 : null;

//             console.log(
//                 '   Parsed expiryDate =>',
//                 expiryDate
//                     ? expiryDate.toISOString()
//                     : null
//             );

//             if (expiryDate) {
//                 expiryDate.setHours(0, 0, 0, 0);

//                 console.log(
//                     '   Normalized expiryDate =>',
//                     expiryDate.toISOString()
//                 );
//             }

//             const mappedRecord = {

//                 Id: rec.Id,

//                 Name: rec.Name,

//                 Type: rec.Type,

//                 ArchivedDate: rec.ArchivedDate,

//                 ArchivedBy: rec.ArchivedBy,

//                 AmazonURL: rec.AmazonURL,

//                 Key: rec.Key__c,

//                 ParentFolder:
//                     rec.ParentFolder || 'All Documents',

//                 FolderPath: rec.FolderPath,

//                 ExpiryDate: rec.ExpiryDate
//                     ? new Intl.DateTimeFormat('en-GB')
//                         .format(new Date(rec.ExpiryDate))
//                     : '',

//                 isExpired: rec.IsExpired
//             };

//             console.log(
//                 '   ✅ MAPPED RECORD:',
//                 JSON.stringify(mappedRecord)
//             );

//             return mappedRecord;
//         });

//         console.log('=================================================');
//         console.log('✅ MAPPING COMPLETE');
//         console.log('=================================================');

//         console.log(
//             '📊 Mapped Records Count:',
//             records.length
//         );

//         console.log(
//             '✅ Mapped Records JSON:',
//             JSON.stringify(records)
//         );

//         console.log('-------------------------------------------------');
//         console.log('📦 SETTING COMPONENT STATE');
//         console.log('-------------------------------------------------');

//         this.allArchivedRecords = records;

//         console.log(
//             'this.allArchivedRecords:',
//             JSON.stringify(this.allArchivedRecords)
//         );

//         this.archivedRecords = records;

//         console.log(
//             'this.archivedRecords:',
//             JSON.stringify(this.archivedRecords)
//         );

//         console.log(
//             '📊 Final Archived Records Count:',
//             this.archivedRecords.length
//         );

//         console.log(
//             '📊 Final All Archived Records Count:',
//             this.allArchivedRecords.length
//         );

//         console.log('=================================================');
//         console.log('📦 LOAD ARCHIVED FILES - COMPLETE');
//         console.log('=================================================');
//     })

//     .catch(error => {

//         console.error('=================================================');
//         console.error('❌ getArchivedAttachments ERROR');
//         console.error('=================================================');

//         console.error(
//             '❌ Error Object:',
//             error
//         );

//         console.error(
//             '❌ Error JSON:',
//             JSON.stringify(error)
//         );

//         console.error(
//             '❌ Error Body:',
//             JSON.stringify(error?.body)
//         );

//         console.error(
//             '❌ Error Message:',
//             error?.body?.message ||
//             error?.message ||
//             'Unknown error'
//         );

//         console.error(
//             '❌ Request Parameters:',
//             JSON.stringify(requestParams)
//         );

//         console.error(
//             '❌ Current Folder ID:',
//             this.currentFolderId
//         );

//         console.error(
//             '❌ Current Folder Name:',
//             this.currentFolderName
//         );

//         console.error('=================================================');
//         console.error('📦 LOAD ARCHIVED FILES - FAILED');
//         console.error('=================================================');
//     });
// }

loadArchivedFiles() {

    const isPublicView = this.currentFolderId === 'PUBLIC_NODE';
    const folderId = isPublicView ? null : this.currentFolderId;

    console.log('📦 Loading Archived Files');
    console.log('Client ID:', this.clientId);
    console.log('Current Folder ID:', this.currentFolderId);
    console.log('Apex Folder ID:', folderId);

    getArchivedAttachments({
        clientId: this.clientId,
        folderId: folderId,
        isPublic: isPublicView
    })
    .then(result => {

        console.log(
            '✅ Archived Attachments from Apex:',
            JSON.stringify(result)
        );

        const records = (result || []).map(rec => {

            return {
                Id: rec.Id,
                Name: rec.Name,
                Type: rec.Type,
                ArchivedDate: rec.ArchivedDate,
                ArchivedBy: rec.ArchivedBy,
                AmazonURL: rec.AmazonURL,
                Key: rec.Key__c,
                ParentFolder: rec.ParentFolder || 'All Documents',
                FolderPath: rec.FolderPath,

                ExpiryDate: rec.ExpiryDate
                    ? new Intl.DateTimeFormat('en-GB')
                        .format(new Date(rec.ExpiryDate))
                    : '',

                isExpired: rec.IsExpired
            };
        });

        console.log(
            '✅ Mapped Records JSON:',
            JSON.stringify(records)
        );

        this.allArchivedRecords = records;
        this.archivedRecords = records;

        console.log(
            '📊 Archived Records Count:',
            this.archivedRecords.length
        );
    })
    .catch(error => {

        console.error(
            '❌ getArchivedAttachments ERROR:',
            JSON.stringify(error)
        );
    });
}

handleRestore(event) {

    const attachmentId = event.currentTarget.dataset.id;

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
        this.refreshCurrentView();
    })

    .catch(error => {

        console.error(error);

        this.showToast('Restore failed');
    });
}

closeArchiveModal() {
    this.archiveModal = false;
    this._syncRoute();
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
    // NOTE: Public folder is intentionally NOT part of isContactsContext,
    // so Add Attachment stays enabled there automatically.
}

get isPublicContext() {
    return this.currentFolderId === 'PUBLIC_NODE';
}

// passkey/permissions icon not needed in Public folder
get showPublicPermissionIcon() {

    // User does not have permission
    if (!this.showPermissionIcon) {
        return false;
    }

    // Hide passkey in Public folder
    if (this.isPublicContext) {
        return false;
    }

    return true;
}

// Edit hidden only for Portal Account Partner User, only in Public folder
get hideEditForExecutiveInPublic() {
    return this.isPublicContext &&
        this.currentUserRole === 'Portal Account Partner User';
}

handleArchiveSearch(event) {
    this.archiveSearchKey = event.target.value;
    console.log('🔍 Search Input:', this.archiveSearchKey);
    const searchTerm = this.archiveSearchKey
        ? this.archiveSearchKey.toLowerCase().trim()
        : '';

    if (!searchTerm) {
        this.archivedRecords = [...this.allArchivedRecords];
        return;
    }
    this.archivedRecords = this.allArchivedRecords.filter(file => {
        const fileName = file.Name ? file.Name.toLowerCase() : '';
        const fileType = file.Type ? file.Type.toLowerCase() : '';
        const archivedBy = file.ArchivedBy ? file.ArchivedBy.toLowerCase() : '';
        const parentFolder = file.ParentFolder ? file.ParentFolder.toLowerCase() : '';

        const isMatch =
            fileName.includes(searchTerm) ||
            fileType.includes(searchTerm) ||
            archivedBy.includes(searchTerm) ||
            parentFolder.includes(searchTerm);

        return isMatch;
    });
}

handleDownload(event) {
    event.preventDefault();

    const fileUrl = event.currentTarget.dataset.url;

    console.log('⬇️ Download URL:', fileUrl);

    fetch(fileUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {

            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;

            // Extract filename from URL
            const fileName = fileUrl
                .split('/')
                .pop()
                .split('?')[0];

            link.download = fileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);

            console.log('✅ Download started:', fileName);
        })
        .catch(error => {
            console.error('❌ Download failed:', error);
        });
}
    _syncRoute(replace = false) {
        let subView = '';
        if (this.isOpenModal) {
            subView = 'add-attachment';
        } else if (this.archiveModal) {
            subView = 'archive';
        } else if (this.isModalOpen && this.selectedId) {
            const record = this.allRecords.find(r => r.Id === this.selectedId);
            const uid = record?.AttachmentUID || record?.ParticipantDocUID || this.selectedId;
            subView = `${uid}/view`;
        } else if (this.assignmentFlag && this.currentDocumentId) {
            const record = this.allRecords.find(r => r.Id === this.currentDocumentId);
            const uid = record?.AttachmentUID || record?.ParticipantDocUID || this.currentDocumentId;
            subView = `${uid}/share`;
        } else if (this.deleteFlag && this.recordId) {
            const record = this.allRecords.find(r => r.Id === this.recordId);
            const uid = record?.AttachmentUID || record?.ParticipantDocUID || this.recordId;
            subView = `${uid}/delete`;
        }
        
        console.log('[Routing] clientAttachment dispatching subrouteupdate:', subView);
        this.dispatchEvent(new CustomEvent('subrouteupdate', {
            detail: {
                subView,
                replace
            },
            bubbles: true,
            composed: true
        }));
    }

    processSubroute(subroute) {
        if (!subroute) {
            this.isOpenModal = false;
            this.archiveModal = false;
            this.isModalOpen = false;
            this.deleteFlag = false;
            this.assignmentFlag = false;
            return;
        }

        if (subroute === 'add-attachment') {
            this.isOpenModal = true;
            this.archiveModal = false;
            this.isModalOpen = false;
            this.deleteFlag = false;
            this.assignmentFlag = false;
        } else if (subroute === 'archive') {
            this.archiveModal = true;
            this.isOpenModal = false;
            this.isModalOpen = false;
            this.deleteFlag = false;
            this.assignmentFlag = false;
        } else {
            const parts = subroute.split('/');
            const uid = parts[0];
            const action = parts[1];
            if (uid.startsWith('att-') || uid.startsWith('partdoc-') || uid.startsWith('doc-') || /^[a-z0-9]{15}$|^[a-z0-9]{18}$/i.test(uid)) {
                // If records are loaded, process immediately:
                if (this.allRecords && this.allRecords.length > 0) {
                    const record = this.allRecords.find(r => r.AttachmentUID === uid || r.ParticipantDocUID === uid || r.Id === uid);
                    if (record) {
                        this.selectedId = record.Id;
                        this.recordId = record.Id;
                        this.currentDocumentId = record.Id;
                        this.currentUrl = record.AmazonURL;
                        this.fileName = record.Name;
                        
                        if (action === 'view') {
                            this.isModalOpen = true;
                            this.isOpenModal = false;
                            this.archiveModal = false;
                            this.deleteFlag = false;
                            this.assignmentFlag = false;
                        } else if (action === 'share') {
                            this.assignmentFlag = true;
                            this.isOpenModal = false;
                            this.archiveModal = false;
                            this.isModalOpen = false;
                            this.deleteFlag = false;
                            // this.loadStaffByDoc(record.Id);
                            this.resetShareState();
                            this.loadShareData(record.Id);
                        } else if (action === 'delete') {
                            this.deleteFlag = true;
                            this.isOpenModal = false;
                            this.archiveModal = false;
                            this.isModalOpen = false;
                            this.assignmentFlag = false;
                        } else if (action === 'download') {
                            this.handleDownloadAction(record);
                        }
                    }
                } else {
                    this._pendingSubroute = subroute;
                }
            }
        }
    }

    handleDownloadAction(record) {
        console.log('⬇️ Downloading attachment via deep link:', record.Name);
        const link = document.createElement('a');
        link.href = record.AmazonURL;
        link.download = record.Name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.dispatchEvent(new CustomEvent('subrouteupdate', {
            detail: {
                subView: '',
                replace: true
            },
            bubbles: true,
            composed: true
        }));
    }
    // manendra added for sorting the data in table
    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        const table = event.currentTarget.dataset.table;

        if (!field || !table) {
            return;
        }

        const state = this.tableSortState[table];

        if (state.field === field) {
            state.direction = state.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.field = field;
            state.direction = 'asc';
        }

        Object.keys(state.icons).forEach(key => {
            state.icons[key] = '';
        });

        state.icons[field] =
            state.direction === 'asc'
                ? 'arrow_upward'
                : 'arrow_downward';

        this.tableSortState = {
            ...this.tableSortState
        };

        switch (table) {
            case 'attachments':
                this.pageNumber = 1;
                this.paginationHelper();
                break;

            case 'archived':
                this.archivedRecords = this.sortData(
                    [...this.archivedRecords],
                    state.field,
                    state.direction
                );
                break;
        }
    }
    sortData(data, sortField, sortDirection) {

        if (!sortField) {
            return [...data];
        }

        const direction = sortDirection === 'asc' ? 1 : -1;

        return [...data].sort((a, b) => {

            const valueA = a[sortField];
            const valueB = b[sortField];

            const emptyA =
                valueA === null ||
                valueA === undefined ||
                valueA === '' ||
                valueA === 'N/A';

            const emptyB =
                valueB === null ||
                valueB === undefined ||
                valueB === '' ||
                valueB === 'N/A';

            if (emptyA && emptyB) return 0;
            if (emptyA) return 1;
            if (emptyB) return -1;

            return (
                String(valueA).localeCompare(
                    String(valueB),
                    undefined,
                    {
                        numeric: true,
                        sensitivity: 'base'
                    }
                ) * direction
            );
        });
    }

    loadPublicFiles() {

        return getPublicAttachments({
            clientId: this.clientId
        })
        .then(result => {

            console.log(
                '🌐 Public Attachments:',
                JSON.stringify(result)
            );

            this.records = (result || []).map(file => {

                return {
                    Id: file.Id,
                    Name: file.Name || file.File_Name__c,
                    AmazonURL: file.Amazon_file_URL__c,
                    Key: file.Key__c,
                    fileSize: this.formatFileSize(file.Size__c),
                    UserName: [file.CreatedBy?.FirstName, file.CreatedBy?.LastName]
                        .filter(Boolean).join(' '),
                    Date: file.Date_Format__c,
                    type: file.Type__c,
                    comment: file.Comments__c,
                    lastModifiedUser: [file.LastModifiedBy?.FirstName, file.LastModifiedBy?.LastName]
                        .filter(Boolean).join(' '),
                    lastModifiedDate: file.LastModifiedDate
                        ? new Intl.DateTimeFormat('en-GB').format(new Date(file.LastModifiedDate))
                        : ''
                };
            });

            this.totalRecords = this.records.length;

            this.pageSize = this.pageSizeOptions[0];
            this.pageNumber = 1;

            this.paginationHelper();
        })
        .catch(error => {

            console.error(
                '❌ Error loading public files:',
                JSON.stringify(error)
            );
        });
    }

    // NEW helper — pick correct data source based on current view
    refreshCurrentView() {
        if (this.currentFolderId === 'PUBLIC_NODE') {
            return this.loadPublicFiles();
        }
        if (this.currentFolderId === 'CONTACTS_NODE') {
            return this.loadAllContactFiles();
        }
        if (this.isContactNode(this.currentFolderId)) {
            return this.loadContactFiles(this.currentFolderId);
        }
        return this.fetchReplist();
    }
        
shouldShowPermissionIcon(record) {

    // User does not have permission functionality
    if (!this.showPermissionIcon) {
        return false;
    }

    // Public folder itself
    if (this.currentFolderId === 'PUBLIC_NODE') {
        return false;
    }

    // Contacts folder itself
    if (this.isContactsContext) {
        return false;
    }

    // Public attachment appearing inside All Documents
    if (record.Is_Public__c === true) {
        return false;
    }

    // Contact attachment appearing inside All Documents
    if (record.Participant_Contact__c) {
        return false;
    }

    // Normal attachment
    return true;
}

get isOrgAdminUser() {
    return [
        'CEO',
        'NDIS Org Admin'
    ].includes(this.currentUserType);
}

@track highlightedAvailableRoles = [];
@track highlightedSelectedRoles = [];
initialSharedIds = [];

get availableRoleOptions() {
    return this.roleOptions
        .filter(r => !this.selectedRoles.includes(r.value))
        .map(r => ({
            ...r,
            cssClass: this.highlightedAvailableRoles.includes(r.value)
                ? 'role-item selected' : 'role-item'
        }));
}
 
get selectedRoleOptions() {
    return this.roleOptions
        .filter(r => this.selectedRoles.includes(r.value))
        .map(r => ({
            ...r,
            cssClass: this.highlightedSelectedRoles.includes(r.value)
                ? 'role-item selected' : 'role-item'
        }));
}
 
get disableMoveRight() { return this.highlightedAvailableRoles.length === 0; }
get disableMoveLeft()  { return this.highlightedSelectedRoles.length === 0; }
get hasSelectedRoles() { return this.selectedRoles.length > 0; }
 
get filteredStaffFull() {
    const key = (this.staffSearchKey || '').toLowerCase().trim();
    return this.allStaffList
        .filter(s => this.selectedRoles.includes(s.role))
        .filter(s =>
            !key ||
            (s.name  || '').toLowerCase().includes(key) ||
            (s.role  || '').toLowerCase().includes(key) ||
            (s.email || '').toLowerCase().includes(key)
        );
}
 
get staffTotalRecords() { return this.filteredStaffFull.length; }
 
get staffTotalPages() {
    return Math.max(1, Math.ceil(this.staffTotalRecords / this.staffPageSize));
}
 
get staffCurrentPage() {
    return Math.min(this.staffPageNumber, this.staffTotalPages);
}
 
get filteredStaffUsers() {                       // current page rows
    const start = (this.staffCurrentPage - 1) * this.staffPageSize;
    return this.filteredStaffFull
        .slice(start, start + this.staffPageSize)
        .map(s => ({ ...s, isSelected: this.selectedStaffIds.includes(s.Id) }));
}
 
get allVisibleStaffSelected() {                  // header checkbox = current page only
    const rows = this.filteredStaffUsers;
    return rows.length > 0 && rows.every(s => s.isSelected);
}
 
get bDisableStaffFirst() { return this.staffCurrentPage === 1; }
get bDisableStaffLast()  { return this.staffCurrentPage === this.staffTotalPages; }
 
get staffPageSizeOptions() {
    return [10, 25, 50, 75, 100].map(n => ({
        label: String(n),
        value: String(n),
        selected: n === this.staffPageSize
    }));
}
 
get saveButtonDisable() {                        // disabled until selection changed
    const a = new Set(this.initialSharedIds);
    const b = new Set(this.selectedStaffIds);
    return a.size === b.size && [...a].every(id => b.has(id));
}
 
// ---------------------------------------------------------------------
// 5) ADD / REPLACE methods
// ---------------------------------------------------------------------
handleShare(event) {
    this.currentDocumentId = event.currentTarget.dataset.id;
    this.resetShareState();
    this.loadShareData(this.currentDocumentId);
    this.assignmentFlag = true;
    this._syncRoute();
}
 
resetShareState() {
    this.allStaffList = [];
    this.roleOptions = [];
    this.selectedRoles = [];
    this.highlightedAvailableRoles = [];
    this.highlightedSelectedRoles = [];
    this.selectedStaffIds = [];
    this.initialSharedIds = [];
    this.staffSearchKey = '';
    this.staffPageNumber = 1;
}
 
loadShareData(docId) {
    Promise.all([
        getClientShareStaffUsers({ facilityId: this.storedFacilityId }),
        fetchStaffByDoc({ docId })
    ])
    .then(([users, alreadyShared]) => {
 
        this.allStaffList = (users || [])
            .filter(u => u.staffId)
            .map(u => ({
                Id: u.staffId,
                userId: u.userId,
                name: u.userName,
                role: u.userType,
                email: u.email || ''
            }));
 
        // roles: fixed order, only those present
        const present = new Set(this.allStaffList.map(s => s.role).filter(Boolean));
        const roles = ROLE_ORDER.filter(r => present.has(r));
        present.forEach(r => { if (!ROLE_ORDER.includes(r)) roles.push(r); });
        this.roleOptions = roles.map(r => ({ label: r, value: r }));
 
        // preselect already-shared staff + move their roles to "Selected"
        this.selectedStaffIds = (alreadyShared || []).map(s => s.Staff__c);
        this.initialSharedIds = [...this.selectedStaffIds];
 
        this.selectedRoles = [...new Set(
            this.allStaffList
                .filter(s => this.selectedStaffIds.includes(s.Id))
                .map(s => s.role)
        )];
    })
    .catch(error => {
        console.error('Grant access load error', JSON.stringify(error));
        this.showShareError(error?.body?.message || 'Unable to load staff');
    });
}
 
// own helper: existing showToast(msg) takes 1 arg, do not reuse
showShareError(message) {
    this.dispatchEvent(new ShowToastEvent({
        title: 'Error',
        message,
        variant: 'error'
    }));
}
 
// ----- staff type transfer -----
handleRoleSelect(event) {
    const role = event.currentTarget.dataset.role;
    this.highlightedAvailableRoles = this.highlightedAvailableRoles.includes(role)
        ? this.highlightedAvailableRoles.filter(r => r !== role)
        : [...this.highlightedAvailableRoles, role];
}
 
handleSelectedRoleSelect(event) {
    const role = event.currentTarget.dataset.role;
    this.highlightedSelectedRoles = this.highlightedSelectedRoles.includes(role)
        ? this.highlightedSelectedRoles.filter(r => r !== role)
        : [...this.highlightedSelectedRoles, role];
}
 
moveRoleRight() {
    this.selectedRoles = [...this.selectedRoles, ...this.highlightedAvailableRoles];
    this.highlightedAvailableRoles = [];
    this.staffPageNumber = 1;
}
 
moveRoleLeft() {
    const removed = this.highlightedSelectedRoles;
    const removedIds = this.allStaffList
        .filter(s => removed.includes(s.role))
        .map(s => s.Id);
 
    this.selectedRoles = this.selectedRoles.filter(r => !removed.includes(r));
    this.selectedStaffIds = this.selectedStaffIds.filter(id => !removedIds.includes(id));
    this.highlightedSelectedRoles = [];
    this.staffPageNumber = 1;
}
 
// ----- search / checkbox / pagination -----
handleStaffSearch(event) {
    this.staffSearchKey = event.target.value;
    this.staffPageNumber = 1;
}
 
handleStaffCheckbox(event) {
    const id = event.target.dataset.id;
    this.selectedStaffIds = event.target.checked
        ? [...new Set([...this.selectedStaffIds, id])]
        : this.selectedStaffIds.filter(s => s !== id);
}
 
handleSelectAllStaff(event) {
    const pageIds = this.filteredStaffUsers.map(s => s.Id);
    this.selectedStaffIds = event.target.checked
        ? [...new Set([...this.selectedStaffIds, ...pageIds])]
        : this.selectedStaffIds.filter(id => !pageIds.includes(id));
}
 
handleStaffPageSize(event) {
    this.staffPageSize = parseInt(event.target.value, 10);
    this.staffPageNumber = 1;
}

staffFirstPage()    { this.staffPageNumber = 1; }
staffPreviousPage() { this.staffPageNumber = this.staffCurrentPage - 1; }
staffNextPage()     { this.staffPageNumber = this.staffCurrentPage + 1; }
staffLastPage()     { this.staffPageNumber = this.staffTotalPages; }
 
// ----- save / close -----
handleassignmentinsert() {
    saveParticipantDocShares({
        docId: this.currentDocumentId,
        staffIds: this.selectedStaffIds
    })
    .then(() => {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Access granted successfully',
            variant: 'success'
        }));
 
        this.assignmentFlag = false;
        this.resetShareState();
        this.currentDocumentId = null;
        this._syncRoute();
        this.fetchReplist();
    })
    .catch(error => {
        console.error('Error saving share:', error);
        this.showShareError(error?.body?.message || 'Failed to grant access');
    });
}
 
handleShareClose() {
    this.assignmentFlag = false;
    this.resetShareState();
    this.currentDocumentId = '';
    this._syncRoute();
}

}