import { LightningElement, track,api,wire } from 'lwc';  
import UpdateFileSize from '@salesforce/apex/RepositoryAttachmentController.UpdateFileSize';   
import fetchRepositoryData from '@salesforce/apex/RepositoryAttachmentController.fetchRepositoryData';
import deleteRepository from '@salesforce/apex/RepositoryAttachmentController.deleteRepository';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';  
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserEmail from '@salesforce/schema/User.Email';
//import getUsersByRoles from '@salesforce/apex/RepositorySecurityHandler.getUsersByRoles';
//import insertRepositorySecurity from '@salesforce/apex/RepositorySecurityHandler.insertRepositorySecurity';
import insertSecurityRecord from '@salesforce/apex/RepositorySecurityHandler.insertSecurityRecord';
import getUserRole from '@salesforce/apex/RepositorySecurityHandler.getUserRole';  
import getUsersWithViewPermission from '@salesforce/apex/RepositorySecurityHandler.getUsersWithViewPermission';  
import getConsentReport from '@salesforce/apex/RepositorySecurityHandler.getConsentReport';
import markConsentAsViewed from '@salesforce/apex/RepositorySecurityHandler.markConsentAsViewed';
import acceptConsent from '@salesforce/apex/RepositorySecurityHandler.acceptConsent';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import insertSecurityPrivilege from '@salesforce/apex/RepositorySecurityHandler.insertSecurityPrivilege'; 
import getUserNotifications from '@salesforce/apex/MyNotificationController.getUserNotifications';
import getRepoData from '@salesforce/apex/RepositoryAttachmentController.getRepoData';
import Repositoryattachments from '@salesforce/apex/RepositoryAttachmentController.attachFiles';
import { deleteRecord } from 'lightning/uiRecordApi';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getRepositoryHistoryLog from '@salesforce/apex/RepositoryAttachmentController.getRepositoryHistoryLog';
import getRepoTypes from '@salesforce/apex/RepositoryAttachmentController.getRepoTypes';
import saveNewRepoType from '@salesforce/apex/RepositoryAttachmentController.saveNewRepoType';
import deleteRepoType from '@salesforce/apex/RepositoryAttachmentController.deleteRepoType';
import renameRepoType from '@salesforce/apex/RepositoryAttachmentController.renameRepoType';

const MAX_FILE_SIZE = 100000000; //10mb  
const MIN_FILE_SIZE = 1000; //10mb  
const actions = [   
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }
 ];
 const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Type', fieldName: 'Document_Type__c' },
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

const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};


export default class Repository extends NavigationMixin(LightningElement) {

    // JS Properties 
    @track pageSizeOptions = [50, 10, 25, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track DeleteFlag = false;
    @track noRecordsFlag=false;
    @track successmessage;
    @track OrgFlag=true;
    @track staffFlag=false;
    @track ParticipantFlag=false;
    @track pageSizeOptions1 = [5, 10, 25,50, 75, 100]; //Page size options
    @track records1 = []; //All records available in the data table
    @track columns1 = []; //columns information available in the data table
    @track totalRecords1 = 0; //Total no.of records
    @track pageSize1; //No.of records to be displayed per page
    @track totalPages1; //Total no.of pages
    @track pageNumber1 = 1; //Page number    
    @track recordsToDisplay1 = []; 
    @track showFormHistoryModal = false;
    @track groupedFormHistory = [];
    @track hasFormHistory = false;
    @track activeHistoryRepoId;

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }

     get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }

    get typeOptions() {
    const base = [{ label: 'All Types', value: 'All' }];
    const dynamicTypes = [...new Set(this.records.map(r => r.Document_Type__c))].map(t => ({
        label: t,
        value: t
    }));
    return [...base, ...dynamicTypes];
}


    @api recordId;   
    @track isOpenModal=false; 
    @track isattachError=false;
    @track data;
    @track columns = columns; 
    @track isEdit=false;
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; //used for when to show spinner
    //@track fileName;
    @track doc;
    @track fileSize;
    @track UpdateDetails = false;
    @track tempConList = [];
    @track timeoutId;
    @track isHome=true;
    file; //holding file instance
    myFile;    
    fileType;//holding file type
    fileReaderObj;
    base64FileData;
    @track orgId;
    @track orgname; 
    @track editFlag=false;;
    @track deleteFlag=false;
    @track viewFlag=false; 
    wiredSecurityResult;
    wiredUserResult;
    @track finalSecurityResult=[];
    @track currentUserRole;
    @track currentUser;
    @track currentUserId;
    @track uploadedByUser;
    @track error;
    @track isExec=false; 
    @track saveDisabled = true;
    @track showLoadingSpinner=false;
    @track error;
    @track textboxFlag = false;
    @track previousSelectedUserIds = [];
    @track initialCheckedUserIds = [];
    wiredUsersViewResult;
    @track userListTable= false;
    @track isViewEnable = false;
    @track notifications = [];
    @track error;
    @track isLoading = false;
    @track filterednotification = [];
    @track showNotifications =false;
    @track uploadedFiles = [];
    fileName = '';
    @track downloadLinks = [];
    @track isFileExpand = false;
    @track fileSizeFromChild = [];
    @track fileSizeInBytes = [];
    @track isDisabled=false;
    @track allowMultiple;
    @track currentUserEmail;
    @track searchKey = '';
    @track filteredRecords = [];
    @track selectedType = 'All';
    @track Ndisflag;
    @track options = [];
    @track selectedValue = '';
    @track isOpen = false;
    @track newOptionText = '';

    defaultTypes = [
        'Certificate',
        'Compliance',
        'Legal Documentation',
        'Training',
        'Inventory',
        'Invoice'
    ];
    isRenameModalOpen = false;
    renameOldType = null;
    renameValue = '';
    renameError = '';
    isDeleteModalOpen = false;
    folderToDelete = null;

    currentUserId = Id;

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    _modulePathFromParent = 'ticket';  // default
    changeExpense(event){        
        if (event.detail.value == 'Other') {
            this.textboxFlag = true;
        } else{
            this.textboxFlag = false;
        } 
    }

    disableRightClick() {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }

    disableShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Prevent F12 (Inspect), Ctrl+Shift+I (Inspect), Ctrl+Shift+C (Element picker), and Ctrl+Shift+J (Console)
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.shiftKey && e.key === 'K')
            ) {
                e.preventDefault();
            }
        });
    }
      
    

    @wire(getRecord, { recordId: Id, fields: [UserNameFld, UsrRoleName,UserEmail] })
    userDetails(result) {
        this.wiredUserResult = result;

        const { data, error } = result;
        if (data) {
            console.log('USER DATA',JSON.stringify(data));
            this.currentUserRole = data.fields.User_Role__c.value;
            this.currentUser = data.fields.Name.value;
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserId = data.id;
            console.log('currentUser  :  ' + this.currentUser);
            console.log('currentUserId  :  ' + this.currentUserId);
             console.log('currentUserEmail  :  ' + this.currentUserEmail);

            if (
                this.currentUserRole === 'Portal Account Partner Executive' ||
                this.currentUserRole === 'CEO' || this.currentUserRole === 'Admin' // ||
               // this.currentUserRole === 'Portal Account Partner Manager'
            ) {
                this.isExec = true;
            } else if (this.currentUserRole === 'Portal Account Partner User' || this.currentUserRole === 'Portal Account Partner Manager') {
                this.isExec = false;
            }
        } else if (error) {
            this.usererror = error;
        }
    }
  @track clientData;
  @track FacilityId;
  @track storedFacilityId;
     @wire(getStaffByEmail, { email: '$currentUserEmail' })
    wiredClient(result) {
        this.wiredClientResult = result;
        console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
           // console.log('Data: ', data); // Debugging line
            this.clientData = data;
             this.FacilityId = this.clientData[0].Facility__c;
            console.log('FacilityId: ',this.FacilityId ); 
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    }


    connectedCallback() { 
        console.log('Current User Id:', this.currentUserId);
        refreshApex(this.wiredUserResult);
        this.uploadedByUser = this.currentUserId;
        console.log('uploadedByUser  :  '+this.uploadedByUser);
       // this.disableRightClick();
        this.disableShortcuts(); 
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        document.addEventListener('click', this.handleOutsideClick);

        organizationDetails().then(response => {
            console.log('calling response raja', JSON.stringify(response));
            if(response.listofPriceBook.Type_of_User__c==='NDIS User'){
                this.Ndisflag=true;
            }
            else{
                this.Ndisflag=false;
            }
             this.orgId = response.listofPriceBook.Id;
             this.orgname = response.listofPriceBook.Name;            
            console.log('orgId>>>>', this.orgId);
            console.log('org name>>>>', this.orgname);
           // this.fetchReplist();           
            this.filterUsers();
            if (this.orgId) {
                console.log('orgId>>>>', this.orgId);
                  this.storedFacilityId = localStorage.getItem('defaultFacilityId');
                  console.log('this.storedFacilityId',this.storedFacilityId);
                this.fetchInitialRepositoryData();
                this.loadRepositoryTypes();
            }
             document.addEventListener('click', this.handleDocumentClick);
        });
            
            window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
       
    } 

    disconnectedCallback() {
        document.removeEventListener('click', this.handleDocumentClick);
        window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
    }
    
    fetchInitialRepositoryData() {
        this.showLoadingSpinner = true;        
        console.log('Org Id : '+this.orgId);
        fetchRepositoryData({ organisationId: this.orgId})  // facilityId: this.storedFacilityId
            .then((data) => {
                console.log('Imperative Data:', JSON.stringify(data));
                if (data) {
                    this.prepareData();
                   

                    this.tempConList = data.map((record) => {
                        
                        let totalChildSizeBytes = 0;
                        if (record?.Repository_Attachments__r?.length) {
                            totalChildSizeBytes = record.Repository_Attachments__r.reduce((sum, child) => {
                                let sizeStr = child?.Size__c ? child.Size__c.toUpperCase().trim() : "0";
                                let value = parseFloat(sizeStr.replace(/[^0-9.]/g, "")) || 0;

                                if (sizeStr.includes("KB")) {
                                    return sum + (value * 1024);
                                } else if (sizeStr.includes("MB")) {
                                    return sum + (value * 1024 * 1024);
                                } else if (sizeStr.includes("GB")) {
                                    return sum + (value * 1024 * 1024 * 1024);
                                } else {
                                    return sum + value;
                                }
                            }, 0);
                        }

                        // 🔹 convert back to human readable
                        let totalChildSizeFormatted = '';
                        if (totalChildSizeBytes >= 1024 * 1024 * 1024) {
                            totalChildSizeFormatted = (totalChildSizeBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
                        } else if (totalChildSizeBytes >= 1024 * 1024) {
                            totalChildSizeFormatted = (totalChildSizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
                        } else if (totalChildSizeBytes >= 1024) {
                            totalChildSizeFormatted = (totalChildSizeBytes / 1024).toFixed(2) + ' KB';
                        } else {
                            totalChildSizeFormatted = totalChildSizeBytes + ' B';
                        }
                        return {
                            Id: record?.Id || '',
                            Name: record?.Name || '',
                            /* Document_Type__c: record?.Document_Type__c || '', */
                            Document_Type__c: (record?.Document_Type__c || '').toLowerCase() === 'other'? (record?.Comments__c || 'Others'): record?.Document_Type__c,
                            document:record?.Document_Type__c || '',
                            Size__c: record?.Size__c || '0',
                            Comments__c: record?.Comments__c || '',
                            User_Name__c: record?.User_Name__c || '',
                            Amazon_file_URL__c: record?.Amazon_file_URL__c || '',
                            Date_Format__c: record?.Date_Format__c || '',
                            isView: record?.HasReadAccess || false,
                            isEdit: record?.HasEditAccess || false,
                            isDelete: record?.HasDeleteAccess || false,
                            totalChildSize: totalChildSizeFormatted,
                            Repository_Attachments__r: record?.Repository_Attachments__r || [],
                            iconName: 'keyboard_arrow_right'  
                        };
                    });
                    
                    this.records = this.tempConList;
                    //this.buildDocTypeView(this.records);
                    console.log('🟣 Repository Records Loaded:', this.records.length);
                    console.log('🟣 Sample Record Types:',
                        this.records.map(r => r.Document_Type__c)
                    );

                    this.loadRepositoryTypes()
                        .then(() => {

                            console.log('🟣 Options Before Building Folder:', this.options);

                            this.buildDocTypeView(this.records);
                        });
                    
                    /* this.totalRecords = this.tempConList.length;
                    this.pageSize = this.pageSizeOptions[0];
                    console.log('this.pageSizeOptions[0]',this.pageSizeOptions[2]);
                    this.pageNumber = 1;
                    this.paginationHelper(); */
                }
                this.showLoadingSpinner = false;
            })
            .catch((error) => {
                console.error('Imperative Error:', JSON.stringify(error));
                this.records = undefined;
                this.error = error;
                this.showLoadingSpinner = false;
            });
    }

    prepareData() {
        if (this.data) {
            this.data = this.data.map(repo => {
                return {
                    ...repo,
                    showChildren: false,                // collapsed by default
                    iconName: repo.iconName || 'keyboard_arrow_right',    // default icon
                    Repository_Attachments__r: repo.Repository_Attachments__r || [] // ensure children
                };
            });
        }
    }

    toggleChildren(event) {
        const repoId = event.currentTarget.dataset.id;
        this.data = this.data.map(repo => {
            if (repo.Id === repoId) {
                repo.showChildren = !repo.showChildren;
                repo.iconName = repo.showChildren ? 'keyboard_arrow_down' : 'keyboard_arrow_right';
            }
            return repo;
        });
    }
     @track repoDocTypeList = [];
    @track isDocTypeView = true;
     toggleSection(event) {
        const key = event.currentTarget.dataset.id;
        this.data = this.data.map(group => ({
            ...group,
            expand: group.key === key ? !group.expand : group.expand
        }));
    }

/*
    buildDocTypeView(records) {
        const map = {};

        records.forEach(repo => {
            const type = repo.Document_Type__c || 'Others';

            if (!map[type]) {
                map[type] = {
                    key: type,
                    documentTypeName: type,
                    docCount: 0,
                    attachmentCount: 0,   // ✅ ADD THIS
                    expand: false,
                    repositories: [],
                    showDelete: false 
                };
            }

            map[type].repositories.push(repo);
            map[type].docCount++;

            // ✅ COUNT ATTACHMENTS SAFELY
            map[type].attachmentCount +=
                repo.Repository_Attachments__r
                    ? repo.Repository_Attachments__r.length
                    : 0;
        });

        this.repoDocTypeList = Object.values(map);
        this.originalRepoDocTypeList=this.repoDocTypeList;
        this.repoDocTypeList.forEach(group => {
            const isDefault = this.defaultTypes.includes(group.key);
            group.isDefault = isDefault;
            group.showDelete = !isDefault && group.attachmentCount === 0;
            group.showEdit = !isDefault;
        });
        console.log('this.repoDocTypeList',JSON.stringify(this.repoDocTypeList));

        this.totalRecords = this.repoDocTypeList.length;
        this.pageSize = this.pageSizeOptions[0];
        console.log('this.pageSizeOptions[0]',this.pageSizeOptions[2]);
        this.pageNumber = 1;
        this.paginationHelper();
        
    }
*/

    buildDocTypeView(records) {

        console.log('🟡 buildDocTypeView() START');

        const map = {};
        const allowedTypes = new Set(this.options);

        console.log('🟡 Allowed Types:', [...allowedTypes]);

        records.forEach(repo => {

            const rawType = repo.Document_Type__c || 'Others';

            console.log('🟡 Checking Repo Type:', rawType);

            if (!allowedTypes.has(rawType)) {
                console.log('⛔ Skipping Type (Not in Master List):', rawType);
                return;
            }

            if (!map[rawType]) {
                console.log('🟢 Creating Folder:', rawType);

                map[rawType] = {
                    key: rawType,
                    documentTypeName: rawType,
                    docCount: 0,
                    attachmentCount: 0,
                    expand: false,
                    repositories: []
                };
            }

            map[rawType].repositories.push(repo);
            map[rawType].docCount++;

            map[rawType].attachmentCount +=
                repo.Repository_Attachments__r
                    ? repo.Repository_Attachments__r.length
                    : 0;
        });

        this.repoDocTypeList = Object.values(map);

        console.log('🟢 Final Folder List:',
            this.repoDocTypeList.map(g => ({
                name: g.key,
                docCount: g.docCount,
                attachmentCount: g.attachmentCount
            }))
        );

        this.repoDocTypeList.forEach(group => {
            const isDefault = this.defaultTypes.includes(group.key);
            group.isDefault = isDefault;

            group.showDelete = !isDefault && group.attachmentCount === 0;
            group.showEdit = !isDefault;
        });

        this.originalRepoDocTypeList = JSON.parse(
            JSON.stringify(this.repoDocTypeList)
        );

        this.totalRecords = this.repoDocTypeList.length;
        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;

        this.paginationHelper();

        console.log('🟡 buildDocTypeView() END');
    }

     fetchReplist() {
        this.showLoadingSpinner = true;
        this.fetchInitialRepositoryData(); 
       // refreshApex(this.wiredData);
        console.log('Refresh triggered');
        setTimeout(() => {
            this.showLoadingSpinner = false;
        }, 2000);
    } 


    // Refresh Button click handler
    fetchNotifications() {
        this.isLoading = true;
        console.log('Fetching Notifications...');

        getUserNotifications()
            .then(result => {
                console.log('Notifications fetched successfully:', result);
                
                // Map notifications to the format needed by your dropdown
                this.filterednotification = result.map((notif, index) => ({
                    value: notif.Id,
                    label: notif.Subject__c,
                    description: notif.Description__c,
                    createdDate: new Date(notif.CreatedDate).toLocaleString(), // Optional formatting
                    index: index
                }));

                this.showNotifications = true;
                console.log(' filtering notification:',JSON.stringify(this.filterednotification));
                console.log(' notifications:',JSON.stringify(this.showNotifications));
            })
            .catch(error => {
                console.error('Error fetching notifications:', error);
                this.error = 'Error loading notifications';
                this.filterednotification = [];
                this.showNotifications = false;
            })
    }
   
    handleAttachment(){
        this.isOpenModal=true;
        this.isEdit=false;
        this.UpdateDetails = false;
        this.fileName = '';
        this.recordId='';
        this.isHome=true;
        this.successmessage='Attachment created successfully.';
        this.allowMultiple=true;
        this.isDisabled=false;
        this.attachmentid='';
        this.documentedit=false;
        this.totalfiles=[];
        this.selectedValue = '';
        this.newOptionText = '';
        this.isOpen = false;
        
    }


    handleSubmit(event){
        event.preventDefault();
        console.log('this.uploadedFiles.length is '+this.uploadedFiles.length);
        if(this.uploadedFiles.length > 0 && this.attachmentid ){
             this.deleteFile(this.key);
            console.log('Deleted file :');
        }
        if(this.documentedit == false){
            if (!this.uploadedFiles || this.uploadedFiles.length === 0 ) {
            
            this.showToast('Error', 'Please upload at least one file before saving. ', 'error');
            return; // ❌ Prevent the form from submitting
            }
        }
        
        let fields = event.detail.fields;
        fields.Organization__c = this.orgId;
        fields.Facility__c = this.FacilityId;
        fields.Document_Type__c = this.selectedValue;
        console.log('facility',this.FacilityId);

        console.log('fields.Size__c = ', fields.Size__c);
        console.log('isEdit in  submit : '+this.isEdit);
        
        if (!this.selectedValue || this.selectedValue.trim() === '') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    variant: 'error',
                    message: 'Please select Type',
                }),
            );
            return;
        }

        if(!(this.isFileAttached) && !(this.isEdit)){
            this.dispatchEvent(  
                new ShowToastEvent({  
                title: 'Error',  
                variant: 'error',  
                message: 'Please upload attachment!!',  
                }),  
            );
            return;
        }else{
            console.log('Proceeding with submission. Fields:', JSON.stringify(fields));
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        }
      
        this.isOpenModal=false;
        this.isEdit=false;
        this.isModalOpen=false;
        this.isHome=true;
       
    }   

    handleSuccess(event){
        //alert('handleSuccess >>>> '+ this.isEdit);
        this.recordId=event.detail.id;
        console.log(this.isEdit);
        console.log('UpdateDetails : '+this.UpdateDetails);
        this.showSpinner = true;

        const repositoryId = event.detail.id;
        console.log('Repository Created with ID: ', repositoryId);

        Repositoryattachments({
            RepositoryId: repositoryId,
            Awsjson: JSON.stringify(this.uploadedFiles),
            attachmentId: this.attachmentid
        }).then(()=>{
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'files attached successfully',
                variant: 'success'
            }));
        })

      

            this.showSpinner = true;
            //Uploading files to AWS S3 bucket
            
            console.log('Record Id>> ',this.recordId);
              
        setTimeout(() => {
            this.fetchInitialRepositoryData(); 
        }, 1500);          
        this.isOpenModal=false;
        this.isEdit=false;        
        this.showSpinner = false; 
        this.isModalOpen=false;
        this.isHome=true;
        this.uploadedFiles=[];
        this.totalfiles=[];
        this.documentedit=false;
        if (this.showFormHistoryModal && this.activeHistoryRepoId === repositoryId) {
            this.loadRepositoryHistory();
        }
       // this.fetchReplist();     
        //this.timeoutId = setTimeout(()=>, 2000);
    }
     showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
    @track isAWSView=false;

    handleDownload(event)
    {
        //alert("AWS View Click");
        this.isAWSView=true;
    }

    hideModalBox(){
        this.isOpenModal=false; 
        this.isEdit=false;  
        this.isHome=true; 
        this.isOpenPermission=false; 
        this.isViewEnable = false;
        this.saveDisabled = true; 
        this.isViewFlag = false;    
        this.totalfiles=[];
        this.documentedit=false;
        this.selectedValue = '';
    }

    @track key;

    handleEdit(event){
        this.isDisabled=false;
        const rowId = event.currentTarget.dataset.id;
        this.key = event.currentTarget.dataset.key;
        this.attachmentid=event.currentTarget.dataset.child;
        console.log('Edit clicked for row with Id:', rowId);
        this.allowMultiple=false;
         this.documentedit=true;
        this.totalfiles=[];

       // this.isOpenModal=false; 
        this.isOpenModal=true;
        this.isEdit=true;  
        this.isFileExpand=true;
        this.successmessage='Attachment updated successfully.';
        // this.isHome=false;
        this.isFileAttached=false;
        this.recordId = event.currentTarget.dataset.id;
       // this.fileName = '';
        console.log('recordid in handleEdit ', this.recordId);  
       /*  const parentRecord = this.data.find(rec => rec.Id === this.recordId);
        if (parentRecord.Repository_Attachments__r && parentRecord.Repository_Attachments__r.length > 0) {
            const childRecord = parentRecord.Repository_Attachments__r.find(c => c.Id === this.attachmentid);
            if (childRecord) {
                this.fileName = childRecord.File_Name__c;
            } else {
                console.warn('Child record not found in parent');
                this.fileName = '';
            }
        }  */
        const parentRecord = this.records.find(
            rec => rec.Id === this.recordId
        );

        if (parentRecord) {
            console.log('Parent Record Found:', parentRecord);

            this.selectedValue = parentRecord.Document_Type__c || '';

            console.log('Preselected Type:', this.selectedValue);
        } else {
            console.warn('Parent record not found');
            this.selectedValue = '';
        }
    }
    
    handleDeleteflag(event){
        this.DeleteFlag = true;
        this.recordId = event.currentTarget.dataset.id;
        console.log('recordId'+this.recordId);
    }

    handleDelete(){
        /* const rowId = event.target.dataset.id; */
        console.log('HI');
        
        
        console.log('Delete', this.recordId);        
        this.delRep(this.recordId); 
        this.DeleteFlag = false;       
    }
    handleclose(){
        this.DeleteFlag = false;
        }

    handleRowActions(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        this.recordId = row.Id;
        switch (actionName) {        
            case 'edit':          
                this.isEdit=true;
                break;
            case 'delete':
                const rowId = event.target.dataset.id;
                const rowName = row.Name; // Capture the Name property for the toast message
                console.log('Rep Id delete:', rowId);
                this.delRep(rowId, rowName);
                break;
        }
    }

    delRep(currentRow) {
        deleteRepository({ repData: currentRow }).then(result => {
            window.console.log('result^^' + result);
            this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!!',
                message: 'Attachment deleted successfully.',
                variant: 'success'
            }));
            this.fetchReplist();
        }).catch(error => {
            window.console.log('Error ====> ' + JSON.stringify(error));
            this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!',
                message: JSON.stringify(error),
                variant: 'error'
            }));
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

    //pagination for sharing permission table


     handleRecordsPerPage1(event) {        
        this.pageSize1 = event.target.value;        
        this.paginationHelper1();
        this.headerCheckboxKey++;
    }

    previousPage1() {
        this.pageNumber1 = this.pageNumber1 - 1;
        this.paginationHelper1();
        this.headerCheckboxKey++;
    }

    nextPage1() {
        this.pageNumber1 = this.pageNumber1 + 1;
        this.paginationHelper1();
        this.headerCheckboxKey++;
    }

    firstPage1() {
        this.pageNumber1 = 1;
        this.paginationHelper1();
        this.headerCheckboxKey++;
    }

    lastPage1() {
        this.pageNumber1 = this.totalPages1;
        this.paginationHelper1();
        this.headerCheckboxKey++;
    }

   

    paginationHelper() {
        const sourceList = this.repoDocTypeList || [];

        this.data = [];

        if (sourceList.length > 0) {
            this.noRecordsFlag = false;
        } else {
            this.noRecordsFlag = true;
        }

        this.totalRecords = sourceList.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) break;

            let record = { ...sourceList[i] };
            record.Size__c = this.formatFileSize(record.Size__c);

            this.data.push(record);
        }

        console.log('this.data:', JSON.stringify(this.data));
        
    }

    @track noRecordsFlag1;
    @track finalUsers=[];
    @track allUsers = [];        // master copy
    @track finalUsers = [];      // paginated
    searchKey2 = '';
    headerCheckboxKey = 0;

    get isAllViewSelected() {
    return this.finalUsers.length > 0 &&
           this.finalUsers.every(u => u.hasViewPermission);
    }
  /*   get isAllConsentSelected() {
    return (
        this.finalUsers.length > 0 &&
        this.finalUsers.every(
            u => u.consentRequired
        )
    );
} */

    get isAllConsentSelected() {
        const enabledUsers = this.finalUsers.filter(u => !u.disableConsent);

        return (
            enabledUsers.length > 0 &&
            enabledUsers.every(u => u.consentRequired === true)
        );
    }

    handleSearch2(event) {
        this.searchKey2 = event.target.value.toLowerCase();

        if (!this.searchKey2) {
            this.filteredUsers = [...this.allUsers];
        } else {
            this.filteredUsers = this.allUsers.filter(user =>
                (user.FirstName + ' ' + user.LastName).toLowerCase().includes(this.searchKey2) ||
                (user.Email || '').toLowerCase().includes(this.searchKey2) ||
                (user.User_Type__c || '').toLowerCase().includes(this.searchKey2)
            );
        }

        this.pageNumber1 = 1;
        this.paginationHelper1();
    }

    paginationHelper1() {
        const sourceList = this.filteredUsers || [];

        this.finalUsers = [];

        // Handle no-records state
        if (sourceList.length > 0) {
            this.noRecordsFlag1 = false;
        } else {
            this.noRecordsFlag1 = true;
            this.pageNumber1 = 1;
            return;
        }

        this.totalRecords1 = sourceList.length;
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);

        // Page boundary checks
        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }

        // Build page data
        for (
            let i = (this.pageNumber1 - 1) * this.pageSize1;
            i < this.pageNumber1 * this.pageSize1;
            i++
        ) {
            if (i === this.totalRecords1) {
                break;
            }

            // Preserve checkbox states (important)
            this.finalUsers.push({ ...sourceList[i] });
        }

        console.log('this.finalUsers:', JSON.stringify(this.finalUsers));
    }

    formatFileSize(bytes) {
        const decimal = 2;
        return (bytes / (1024 * 1024)).toFixed(decimal) + ' MB';
    }

    
    @track isModalOpen = false;
    @track currentUrl;
    @track consentRequired = false;

    handleView(event) {
        //this.fetchReplist(); 
        const rowId = event.currentTarget.dataset.id;
        this.attachmentid=event.currentTarget.dataset.child;
        console.log('Rep Id:', rowId);
         console.log(' this.attachmentid:',  this.attachmentid);
        this.selectedRowId = rowId;
        console.log('View clicked for row with Id:', rowId);
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        console.log('file url BEFORE  '+ url); 
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
        this.isOpenModal=false;
        this.Consentflag=false;
      if(!this.isExec){
        markConsentAsViewed({
        repositoryId: this.selectedRowId,   // repository id
        attachmentId: this.attachmentid          // attachment id
            })
            .then(result => {
                console.log('Consent accepted successfully');
                 this.consentRequired = result;
                 console.log('consent required',this.consentRequired);
            })
            .catch(error => {
                console.error('Error accepting consent', error);
            });
      }
         
        
        const fileType = this.getFileType(this.currentUrl);
       
    }

    handleCardClick(event) {
        const name = event.currentTarget.dataset.name;

        this.OrgFlag = name === 'org';
        this.staffFlag = name === 'staff';
        this.ParticipantFlag = name === 'participant';
  }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome=true;
    }
    closeRepository(){
        this.isModalOpen = false;
        this.isHome=true;
        this.isOpenModal=false;
        this.isEdit=false;
        this.currentUrl = null;
    }

    getFileType(url) {
        console.log('file url getFileType '+ url);
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        console.log('file name getFileType '+ fileName);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }  
    
    @track isOpenPermission=false;
    @api userType; 
    @track selectedRoles = [];
    @track users = [];
    @track filteredUsers = [];
    @track selectedUserIds = [];
    permissions = { view: false, edit: false, delete: false };
    // searchKey = '';
    @track userTypeOption = [];
    
    ndisRoles = [
        { label: 'NDIS Org Admin', value: 'NDIS Org Admin' },
        { label: 'Facility Admin', value: 'Facility Admin' },
        { label: 'Roster Manager', value: 'Roster Manager' },
        { label: 'HR Admin', value: 'HR Admin' },
        { label: 'Payroll Admin', value: 'Payroll Admin' },
        { label: 'NDIS Staff', value: 'NDIS Staff' }
    ];

    ictRoles = [
        { label: 'ICT Admin', value: 'ICT Admin' },
        { label: 'ICT Staff', value: 'ICT Staff' }
    ];

    @wire(getUserRole)
    wiredUserRole({ error, data }) {
        if (data) {
            if (data === 'NDIS') {
                this.userTypeOption = this.ndisRoles;
            } else if (data === 'ICT') {
                this.userTypeOption = this.ictRoles;
            } else {
                this.userTypeOption = [];
            }
        } else if (error) {
            console.error('Error fetching user role', error);
        }
    }
   
    handlePermission(event){
        const rowId = event.currentTarget.dataset.id;
         this.attachmentid=event.currentTarget.dataset.child;
        console.log('Rep Id:', rowId);
         console.log(' this.attachmentid:',  this.attachmentid);
        this.selectedRowId = rowId;
        this.userListTable=false;
        this.isOpenPermission = true;
        this.isModalOpen = false;
       // this.isHome=false;
        this.isOpenModal=false;
        this.currentUrl = null;
        this.selectedRoles = '';
        this.filteredUsers = '';
       // this.loadUsersByRoles();
    }

    handleConsent(event){
        const rowId = event.currentTarget.dataset.id;
         this.attachmentid=event.currentTarget.dataset.child;
        console.log('Rep Id:', rowId);
         console.log(' this.attachmentid:',  this.attachmentid);
        this.selectedRowId = rowId;
        this.Consentflag=true;
        this.isOpenPermission = false;
        this.isHome=false;
        this.isModalOpen = false;
       // this.isHome=false;
        this.isOpenModal=false;
        this.loadConsent();
       
    }

    handleRoleSelection(event) {
        this.selectedRoles = event.detail.value;
        console.log('selected roles :'+this.selectedRoles);
          console.log('Rep Id:', this.selectedRowId);
        //this.loadUsersByRoles();
        this.userListTable=true;
        refreshApex( this.wiredUsersViewResult ); 
    }
    
    filterUsers() {
        this.filteredUsers = this.users.filter(user => {
            return user.Name.toLowerCase().includes(this.searchKey.toLowerCase());
        });
    }

    handleUserSelection(event) {
        const userId = event.target.dataset.id;
        const isChecked = event.target.checked;
       // this.isViewEnable = true;
       if(this.isViewFlag){
         this.saveDisabled = false;
       } else {
         this.saveDisabled = true;
       }
       
        // Log filteredUsers before any changes
        console.log('Before user selection - filteredUsers:', JSON.stringify(this.filteredUsers));
    
        // Log selectedUserIds before any changes
        console.log('Before update selectedUserIds:', JSON.stringify(this.selectedUserIds));
    
        // Find the user by ID and update their hasViewPermission
        const user = this.filteredUsers.find(user => user.Id === userId);
        if (user) {
            user.hasViewPermission = isChecked; // Update the permission
        }
    
        // If the user is being deselected, update the previous selection list
        if (!isChecked) {
            // If the user was previously selected, remove it from the selected list
            this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
            // this.isViewEnable = false;
        } else {
             //this.isViewEnable = true;
            // If the user is being selected, add it to the selected list
            if (!this.selectedUserIds.includes(userId)) {
                this.selectedUserIds.push(userId);
            }
        }
         this.isViewEnable = this.filteredUsers.some(user => user.hasViewPermission);
        console.log('isViewEnable in handleUserSelection:', this.isViewEnable);
        // Log selectedUserIds after the change
        console.log('After update selectedUserIds:', JSON.stringify(this.selectedUserIds));
    
        // Log filteredUsers after updating permission
        console.log('After user selection - filteredUsers:', JSON.stringify(this.filteredUsers));
    
        // Store the current selected IDs for comparison next time
        this.previousSelectedUserIds = [...this.selectedUserIds];
    
        // Now check the state of the submit button
        this.checkSubmitButtonState();
    }
    
    @wire(getUsersWithViewPermission, { repositoryId: '$selectedRowId', roles: '$selectedRoles' })
    wiredUsers(result) {
        console.log('wiredUsers is triggered' +JSON.stringify(result));
     
        // If no repositoryId or roles are set, reset filteredUsers and don't process further
        if (!this.selectedRowId || this.selectedRoles.length === 0) {
            this.filteredUsers = []; // Empty result if no repositoryId or roles
            console.log('Filtered Users in wire if:', JSON.stringify(this.filteredUsers));
            //console.log('result in wire if :', JSON.stringify(result));
            this.wiredUsersViewResult = result; // Assign the result as-is even if no valid data
            return; // Prevent further processing
        }

        //console.log('result in wire with View Permission:', JSON.stringify(result));
        this.wiredUsersViewResult = result; // Assign the result to this.wiredUsersViewResult
        const { data, error } = result;
        if (data) {
            // Process the result when data is available
            this.allUsers = data.map(item => ({
                ...item.user,
                hasViewPermission: item.hasViewPermission || false, // Set view permission flag
                consentRequired: item.consentRequired || false,
                 disableConsent: !item.hasViewPermission  
            }));

            this.filteredUsers = [...this.allUsers];
            this.pageNumber1 = 1; 
            this.pageSize1 = this.pageSizeOptions1[0];
            this.paginationHelper1();

            //console.log('Filtered Users with View Permission:', JSON.stringify(this.filteredUsers));
        } else if (error) {
            // Handle errors if any
            console.error('Error fetching users with permissions:', error);
            this.filteredUsers = []; // Reset filteredUsers on error
        }
    }
    
 
   handleUserPermissionChange(event) {
    const userId = event.target.dataset.id;
    const type = event.target.dataset.type;
    const checked = event.target.checked;

    this.filteredUsers = this.filteredUsers.map(user => {
        if (user.Id === userId) {
            if (type === 'view') {
                return {
                    ...user,
                    hasViewPermission: checked,
                    consentRequired: checked ? user.consentRequired : false,
                    disableConsent: !checked,
                    changed: true
                };
            }
            if (type === 'consent') {
                return {
                    ...user,
                    consentRequired: checked,
                    changed: true
                };
            }
        }
        return user;
    });
    console.log('Updated filteredUsers:', JSON.stringify(this.filteredUsers));
   this.paginationHelper1();
    this.checkSubmitButtonState();
}

handleSelectAllView(event) {
    const checked = event.target.checked;

    // Get IDs of users on current page
    const pageUserIds = new Set(this.finalUsers.map(u => u.Id));

    this.filteredUsers = this.filteredUsers.map(user => {
        if (pageUserIds.has(user.Id)) {
            return {
                ...user,
                hasViewPermission: checked,
                consentRequired: checked ? user.consentRequired : false,
                disableConsent: !checked,
                changed: true
            };
        }
        return user;
    });

    this.paginationHelper1();
    this.checkSubmitButtonState();
}

handleSelectAllConsent(event) {
    const checked = event.target.checked;

    const pageUserIds = new Set(this.finalUsers.map(u => u.Id));

    this.filteredUsers = this.filteredUsers.map(user => {
        if (pageUserIds.has(user.Id) && user.hasViewPermission) {
            return {
                ...user,
                consentRequired: checked,
                changed: true
            };
        }
        return user;
    });

    this.paginationHelper1();
    this.checkSubmitButtonState();
}


    checkSubmitButtonState() {
        const isAnyUserSelected = this.filteredUsers.some(user => user.changed);
        this.saveDisabled = !(isAnyUserSelected);
    }

    @track isViewFlag = false;
    @track participanteditflag = false;
 

        handleSubmitPermissions() {

    const userPermissions = this.filteredUsers
        .filter(user => user.changed)
        .map(user => ({
            userId: user.Id,
            hasViewPermission: user.hasViewPermission || false,
            consentRequired: user.consentRequired || false
        }));
        console.log('User Permissions:', JSON.stringify(userPermissions));

    insertSecurityRecord({
        repositoryId: this.selectedRowId,
        userPermissions: JSON.stringify(userPermissions),   // ✅ FIX
        attachmentId: this.attachmentid
    })
    .then(() => {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Permissions updated successfully.',
            variant: 'success'
        }));

        this.isOpenPermission = false;
        this.isHome = true;
        this.fetchInitialRepositoryData();
        refreshApex(this.wiredUsersViewResult);
    })
    .catch(error => {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: 'An error occurred while updating permissions',
            variant: 'error'
        }));
        console.error(error);
    });
}

    
    handleBack(){
        this.isOpenPermission = false;
        this.isModalOpen = false;
       // refreshApex(this.wiredData);
        this.isHome=true;
        this.isOpenModal=false;
        this.currentUrl = '';
        this.isViewEnable = false; 
        this.saveDisabled = true;
        this.isViewFlag = false;
    }

    handleDocumentClick = (event) => {
        const dropdown = this.template.querySelector('.table-options');

        if (dropdown && !dropdown.contains(event.target)) {
            this.showNotifications = false;
        }
    };
    stopPropagation(event) {
        event.stopPropagation();
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
            this.fileName = names.join(', ');
            this.downloadLinks = urls;
            //this.fileSizeFromChild = sizes;           // this.showSpinner = false;
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            console.log(' this.downloadLinks : ',  JSON.stringify(this.downloadLinks));
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }

     ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

    isAllowedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
    }
    @track documentedit=false;
    @track totalfiles=[];
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }
    
    handleDrop(event) {
     event.preventDefault();
     event.stopPropagation();
    let files = Array.from(event.dataTransfer.files || []);
   

      const longNameFile = files.find(f => f.name.length > 180);
    if (longNameFile) {
        this.showToast(
            'Error',
            `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
            'error'
        );
        event.target.value = '';
        return;
    }
    
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    const existingSize = this.totalfiles.reduce((sum, file) => sum + file.size, 0);
    const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
    if (existingSize + newFilesSize > MAX_TOTAL_SIZE) {
        this.showToast(
            'Error',
            'Total file size cannot exceed 50MB.',
            'error'
        );
        event.target.value = '';
        return;
    }
    if (this.documentedit) {
        // 🚫 Allow only one file in edit mode
        if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            return;
        }

        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }

        files = [files[0]]; // take only the first file
    }

    // Push to tracking array
    this.totalfiles.push(...files);

    // Process files as usual
    this.processFiles(files);
    }
   
    handleFileUploadInputChange(event) {
        console.log('handleFileUploadInputChange called ');
       
        let files = Array.from(event.target.files || []);
        
       // const invalidFile = files.find(f => !this.isAllowedFile(f));
       /* if (invalidFile) {
            this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
            event.target.value = ''; // reset
            return;
        } */
        const longNameFile = files.find(f => f.name.length > 180);
        if (longNameFile) {
            this.showToast(
                'Error',
                `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
                'error'
            );
            event.target.value = '';
            return;
        }

    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    const existingSize = this.totalfiles.reduce((sum, file) => sum + file.size, 0);
    const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
    if (existingSize + newFilesSize > MAX_TOTAL_SIZE) {
        this.showToast(
            'Error',
            'Total file size cannot exceed 50MB.',
            'error'
        );
        event.target.value = '';
        return;
    }

       if (this.documentedit) {
        // Allow only one file in edit mode
         if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            event.target.value = ''; // reset input
            return;
        }
        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }
        // Take only the first file
        files = [files[0]];
    }
     this.totalfiles.push(...files);

    this.processFiles(files);

    // Reset file input so same file can be re-uploaded if needed
    event.target.value = '';
        
    }

      processFiles(files) {
    if (!files || !files.length) return;

    setTimeout(() => {
        this.isFileExpand = true;

        setTimeout(() => {
            const svc = this.template.querySelector('c-document-office-service');
            if (!svc) {
                console.warn('⚠️ No <c-document-office-service> component found.');
                return;
            }

            svc.incomingFiles = files;
        }, 1000);
    }, 0);
  }


    triggerFileInput() {
        
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
    handleFileDeleted(event) {
        console.group('handleFileDeleted called ');
        const { key, fileId ,files} = event.detail;
        console.log('File deleted in child. Key:', key, 'FileId:', fileId, 'files:',JSON.stringify(files) );

        // Example: remove it from parent's tracking
        this.uploadedFiles = this.uploadedFiles.filter(f => f.fileId !== fileId);
        console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles));
        this.totalfiles=[];
        // if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        //    this.isFileExpand = false;
        // }
        this.totalfiles=[];
        if (!files || files.length === 0) {
           this.isFileExpand = false;
           this.fileName = '';
        }
    }
    handleError(event) {
        console.error('Error in record form submission:', JSON.stringify(event.detail, null, 2));
        //this.showToast('Error', event.detail.message || 'Unknown error', 'error');
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

            // Optionally, dispatch an event if some other part of the app needs to know
          /*   this.dispatchEvent(new CustomEvent('filedeleted', {
                detail: { key },
                bubbles: true,
                composed: true
            }));

 */

           

            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
           
            
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    handleCancel(event){
       
        this.uploadedFiles = [];
        this.totalfiles=[];
    }

    handleDeleteClick() {
        const key = this.key;
        console.log('Delete button clicked. Key:', key);
        this.deleteFile(key);
    }

    handlefilecancel(event){
    console.log('child called');
     console.log('Cancel event received:', event.detail.message);
    this.totalfiles=[];
}
    handleDeleteattachment(event){
        this.attachmentid=event.currentTarget.dataset.id;
         let key = event.currentTarget.dataset.key;
          deleteRecord(this.attachmentid)
            .then(() => {
                // Show success toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Attachment deleted successfully',
                        variant: 'success'
                    })
                );

                // Optionally clear the childId
                this.attachmentid = '';
                 this.deleteFile(key);
                 this.fetchInitialRepositoryData(); 
            })
       
    }

    handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            event.preventDefault();
            this.handleAttachment();
            }
    }
handleSearch(event) {
    this.searchKey = event.target.value.toLowerCase().trim();
    this.applyFilters();
}

handleTypeFilter(event) {
    this.selectedType = event.detail.value;
    this.applyFilters();
}
/* applyFilters() {
    const text = this.searchKey;
    const type = this.selectedType;

    this.filteredRecords = this.records.filter(rec => {
        const matchesText =
            rec.Name.toLowerCase().includes(text) ||
            rec.User_Name__c.toLowerCase().includes(text);
            // rec.Document_Type__c.toLowerCase().includes(text);

        const matchesType =
            type === 'All' ? true : rec.Document_Type__c === type;

        return matchesText && matchesType;
    });

    this.totalRecords = this.filteredRecords.length;
    this.pageNumber = 1;
    this.paginationHelper();
} */

    @track originalRepoDocTypeList=[];
   applyFilters() {
    const text = this.searchKey || '';
    const selectedType = this.selectedType || 'All';

    // 🔁 RESET when no filters
    if (!text && selectedType === 'All') {
        this.repoDocTypeList = JSON.parse(
            JSON.stringify(this.originalRepoDocTypeList)
        );
        this.pageNumber = 1;
        this.paginationHelper();
        return;
    }

    const filteredDocTypes = this.originalRepoDocTypeList
        .filter(group => {
            // 🗂️ TYPE FILTER (document type level)
            return selectedType === 'All' || group.key === selectedType;
        })
        .map(group => {
            // 🔍 SEARCH inside repositories
            const filteredRepos = group.repositories.filter(repo => {
                const name = (repo.Name || '').toLowerCase();
                const user = (repo.User_Name__c || '').toLowerCase();

                const attachmentMatch = (repo.Repository_Attachments__r || [])
                    .some(att =>
                        (att.File_Name__c || '').toLowerCase().includes(text)
                    );

                return (
                    !text ||
                    name.includes(text) ||
                    user.includes(text) ||
                    attachmentMatch
                );
            });

            // ❌ remove empty groups
            if (filteredRepos.length === 0) return null;

            // ✅ rebuild group
            return {
                ...group,
                repositories: filteredRepos,
                attachmentCount: filteredRepos.length,
                attachmentCount: filteredRepos.reduce(
                    (sum, r) => sum + (r.Repository_Attachments__r?.length || 0),
                    0
                ),
                expand: true // auto-expand results
            };
        })
        .filter(Boolean);

    // 🔥 update grouped list
    this.repoDocTypeList = filteredDocTypes;

    // 🔁 reset pagination
    this.pageNumber = 1;

    // 📄 paginate document types
    this.paginationHelper();

    console.log(
        '[FILTER RESULT]',
        JSON.stringify(this.repoDocTypeList)
    );
}


applySearchToPagination() {
    this.paginationHelper();
}

exportCSV() {
    // 1️⃣ Choose correct source (filtered or full)
    const source =
        (this.filteredRecords.length > 0)
            ? this.filteredRecords
            : this.records;

    if (!source || source.length === 0) {
        this.showToast('Error', 'No data available to export.', 'error');
        return;
    }

    // 2️⃣ CSV Header
    let csv = 'Name,Type,Comments,Uploaded By,Date,File Name,Size\n';

    // 3️⃣ Parent rows + child rows
    source.forEach(parent => {
        // Parent Row
        csv += `"${parent.Name || ''}","${parent.Document_Type__c || ''}","${parent.Comments__c || ''}","${parent.User_Name__c || ''}","${parent.Date_Format__c || ''}",,"${parent.totalChildSize || ''}"\n`;

        // Child Rows (attachments)
        if (parent.Repository_Attachments__r && parent.Repository_Attachments__r.length) {
            parent.Repository_Attachments__r.forEach(att => {
                csv += `,,,,,"${att.File_Name__c || ''}","${att.Size__c || ''}"\n`;
            });
        }
    });

    // 4️⃣ Create CSV File + Trigger Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Document_Export.csv';
    link.click();
}

@track Consentflag=false;
@track ConsentList = [];

loadConsent() {
        getConsentReport({
            repositoryId: this.selectedRowId,
            attachmentId: this.attachmentid
        })
        .then(result => {
            console.log('Consent:', JSON.stringify(result));
            this.ConsentList = result;   // ✅ bind to table
        })
        .catch(error => {
            console.error('Error:', error);
            this.privilegeList = [];
        });
    }

    handleConsentChange(event) {
    const isChecked = event.target.checked;

    if (!isChecked) {
        return; // ❌ do nothing if unchecked
    }

    acceptConsent({
        repositoryId: this.selectedRowId,
        attachmentId: this.attachmentid
    })
    .then(() => {
        //this.isConsentAccepted = true; // lock checkbox
        console.log('Consent accepted');
    })
    .catch(error => {
        console.error('Error accepting consent', error);
    });
}

    handleShowRepositoryHistory(event) {
        console.log('handleShowRepositoryHistory → START');

        this.showLoadingSpinner = true;

        this.activeHistoryRepoId = event.currentTarget.dataset.id;
        console.log('Active Repository Id:', this.activeHistoryRepoId);

        getRepositoryHistoryLog({ repositoryId: this.activeHistoryRepoId })
            .then(raw => {
                console.log('Raw response from Apex:', raw);

                const history = JSON.parse(raw || '[]');
                console.log('Parsed history array:', history);
                console.log('History count:', history.length);

                this.groupedFormHistory = this.groupHistoryByDate(history);
                console.log('Grouped form history:', this.groupedFormHistory);

                this.hasFormHistory = this.groupedFormHistory.length > 0;
                console.log('Has form history:', this.hasFormHistory);

                this.showFormHistoryModal = true;
                console.log('History modal opened');

            })
            .catch(error => {
                console.error('Error in getRepositoryHistoryLog:', error);

                if (error && error.body) {
                    console.error('Apex error body:', error.body);
                }

                this.groupedFormHistory = [];
                this.hasFormHistory = false;
                this.showFormHistoryModal = true;

                console.log('History modal opened with empty data due to error');
            })
            .finally(() => {
                this.showLoadingSpinner = false;
                console.log('handleShowRepositoryHistory → END');
            });
    }

    loadRepositoryHistory() {
        if (!this.activeHistoryRepoId) return;

        getRepositoryHistoryLog({ repositoryId: this.activeHistoryRepoId })
            .then(raw => {
                const history = JSON.parse(raw || '[]');
                this.groupedFormHistory = this.groupHistoryByDate(history);
                this.hasFormHistory = this.groupedFormHistory.length > 0;
            })
            .catch(() => {
                this.groupedFormHistory = [];
                this.hasFormHistory = false;
            });
    }

    groupHistoryByDate(history) {
        if (!Array.isArray(history)) {
            return [];
        }

        const map = {};
        history.forEach(item => {
            if (!item || !item.activityDate) {
                return;
            }

            const dateObj = new Date(item.activityDate);

            // Date: FEB 12 2025
            const date = dateObj
                .toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })
                .toUpperCase();

            // Time: 11:52 AM (12-hour format)
            const time = dateObj.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            if (!map[date]) {
                map[date] = [];
            }

            map[date].push({
                ...item,
                time,
                initials: this.getInitials(item.user)
            });
        });

        return Object.keys(map).map(date => ({
            date,
            entries: map[date]
        }));
    }

    closeFormHistory() {
        this.showFormHistoryModal = false;
        this.groupedFormHistory = [];
        this.hasFormHistory = false;
        this.showLoadingSpinner = false;
    }

    getInitials(name) {
        if (!name) return '';
        const parts = name.split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }

    get dropdownOptions() {
        return this.options.map(opt => ({
            label: opt,
            value: opt
        }));
    }

    get isAddDisabled() {
        return !this.newOptionText || !this.newOptionText.trim();
    }

    handleInputChange(event) {
        this.newOptionText = event.target.value;
    }

    handleTypeChange(event) {
        this.selectedValue = event.detail.value;
    }

    loadRepositoryTypes() {

        return getRepoTypes({ organisationId: this.orgId })
            .then(result => {

                let orgTypes = [];

                if (result && Array.isArray(result)) {
                    orgTypes = result;
                }

                this.options = [...new Set([...this.defaultTypes, ...orgTypes])];

                console.log('🟢 Updated Dropdown Options:', this.options);
            });
    }

    handleAddOption() {

        const value = (this.newOptionText || '').trim();
        if (!value) return;

        if (value.length > 50) {
            this.showToast('Error', 'Maximum 50 characters allowed.', 'error');
            return;
        }

        const exists = this.options.some(
            opt => opt.toLowerCase() === value.toLowerCase()
        );

        if (exists) {
            this.showToast('Error', 'Folder name already exists.', 'error');
            return;
        }

        saveNewRepoType({
            organisationId: this.orgId,
            newType: value
        })
        .then(() => {

            // 🔥 CRITICAL PART
            return this.loadRepositoryTypes();

        })
        .then(() => {

            // rebuild folder structure
            this.buildDocTypeView(this.records);

            this.selectedValue = value;
            this.newOptionText = '';

            this.showToast('Success', 'Folder added successfully.', 'success');
        })
        .catch(error => {
            console.error('Error saving type', error);
            this.showToast('Error', 'Failed to add folder.', 'error');
        });
    }

    handleDeleteFolder(event) {
        event.stopPropagation();

        const typeToDelete = event.currentTarget.dataset.type;
        if (!typeToDelete) return;

        this.folderToDelete = typeToDelete;
        this.isDeleteModalOpen = true;
    }

    deleteFolderFromOrganisation(type) {

        console.log('🔴 Deleting Folder:', type);

        deleteRepoType({
            organisationId: this.orgId,
            typeToDelete: type
        })
        .then(() => {

            console.log('🔴 Deleted from Org master list');

            this.repoDocTypeList =
                this.repoDocTypeList.filter(g => g.key !== type);

            this.originalRepoDocTypeList =
                this.originalRepoDocTypeList.filter(g => g.key !== type);

            this.options = this.options.filter(opt => opt !== type);

            console.log('🔴 Updated Dropdown Options:', this.options);

            if (this.selectedValue === type) {
                this.selectedValue = '';
            }

            this.paginationHelper();
        })
        .catch(error => {
            console.error('❌ Delete Error:', error);
        });
    }

    get displayText() {
        return this.selectedValue || 'Select an Option';
    }

    handleSelectOption(event) {
        this.selectedValue = event.currentTarget.dataset.value;
        this.isOpen = false;
    }

    toggleDropdown(event) {
        event.stopPropagation();
        console.log('Toggle Clicked');
        this.isOpen = !this.isOpen;
    }

    handleEditFolder(event) {
        event.stopPropagation();

        const oldType = event.currentTarget.dataset.type;
        if (!oldType) return;

        this.renameOldType = oldType;
        this.renameValue = oldType;
        this.renameError = '';
        this.isRenameModalOpen = true;
    }

    handleRenameInputChange(event) {
        this.renameValue = event.target.value;
        this.renameError = '';
    }

    closeRenameModal() {
        this.isRenameModalOpen = false;
        this.renameOldType = null;
        this.renameValue = '';
        this.renameError = '';
    }

    handleRenameSave() {

        const newName = (this.renameValue || '').trim();
        const oldType = this.renameOldType;

        // ❌ Empty
        if (!newName) {
            this.renameError = 'Folder name cannot be empty.';
            return;
        }

        // ❌ Max length
        if (newName.length > 50) {
            this.renameError = 'Maximum 50 characters allowed.';
            return;
        }

        // ❌ Duplicate check (case insensitive)
        const exists = this.options.some(
            opt => opt.toLowerCase() === newName.toLowerCase()
        );

        if (exists && newName !== oldType) {
            this.renameError = 'Folder name already exists.';
            return;
        }

        // ✅ Call existing rename logic
        this.renameFolder(oldType, newName);

        this.closeRenameModal();
    }

    renameFolder(oldType, newType) {

        renameRepoType({
            organisationId: this.orgId,
            oldType: oldType,
            newType: newType
        })
        .then(() => {

            // Update locally
            this.repoDocTypeList =
                this.repoDocTypeList.map(g =>
                    g.key === oldType
                        ? { ...g, key: newType, documentTypeName: newType, isEditing: false, editValue: null }
                        : g
                );

            this.originalRepoDocTypeList =
                this.originalRepoDocTypeList.map(g =>
                    g.key === oldType
                        ? { ...g, key: newType, documentTypeName: newType }
                        : g
                );

            // 2️⃣ 🔥 Update dropdown options
            this.options = this.options.map(opt =>
                opt === oldType ? newType : opt
            );

            // 3️⃣ If currently selected, update selection
            if (this.selectedValue === oldType) {
                this.selectedValue = newType;
            }

            this.paginationHelper();

            // ✅ SUCCESS TOAST
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Folder renamed successfully.',
                    variant: 'success'
                })
            );

        })
        .catch(error => {
            console.error('Error renaming folder', error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to rename folder.',
                    variant: 'error'
                })
            );
        });
    }

    closeDeleteModal() {
        this.isDeleteModalOpen = false;
        this.folderToDelete = null;
    }

    confirmDeleteFolder() {

        const type = this.folderToDelete;
        if (!type) return;

        console.log('🔴 Confirmed Delete:', type);

        deleteRepoType({
            organisationId: this.orgId,
            typeToDelete: type
        })
        .then(() => {

            this.repoDocTypeList =
                this.repoDocTypeList.filter(g => g.key !== type);

            this.originalRepoDocTypeList =
                this.originalRepoDocTypeList.filter(g => g.key !== type);

            this.options = this.options.filter(opt => opt !== type);

            if (this.selectedValue === type) {
                this.selectedValue = '';
            }

            this.paginationHelper();

            this.showToast('Success', 'Folder deleted successfully.', 'success');

            this.closeDeleteModal();
        })
        .catch(error => {
            console.error('❌ Delete Error:', error);

            this.showToast('Error', 'Failed to delete folder.', 'error');

            this.closeDeleteModal();
        });
    }

    handleOutsideClick(event) {

        if (!this.isOpen) return;

        const path = event.composedPath();

        const dropdown = this.template.querySelector('.dropdown-container');

        if (!dropdown) return;

        if (!path.includes(dropdown)) {
            console.log('Outside click detected → closing dropdown');
            this.isOpen = false;
        }
    }

}