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
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import insertSecurityPrivilege from '@salesforce/apex/RepositorySecurityHandler.insertSecurityPrivilege'; 
import getUserNotifications from '@salesforce/apex/MyNotificationController.getUserNotifications';
import getRepoData from '@salesforce/apex/RepositoryAttachmentController.getRepoData';
import Repositoryattachments from '@salesforce/apex/RepositoryAttachmentController.attachFiles';
import { deleteRecord } from 'lightning/uiRecordApi';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';

const MAX_FILE_SIZE = 100000000; //10mb  
const MIN_FILE_SIZE = 1000; //10mb  
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

const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};


export default class Repository extends NavigationMixin(LightningElement) {

    // JS Properties 
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
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

    
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
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
      
    /* @wire(getRecord, { recordId: Id, fields: [UserNameFld,UsrRoleName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUserRole =data.fields.User_Role__c.value;
            this.currentUser = data.fields.Name.value;
            this.currentUserId = data.id;
            console.log('currentUser  :  '+this.currentUser);
            console.log('currentUserId  :  '+this.currentUserId);
            if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Portal Account Partner Manager');{
                this.isExec=true;                
            }           
            if(this.currentUserRole == 'Portal Account Partner User'){
                this.isExec=false;
            } 
        } else if (error) {
            this.usererror = error ;
        }
    }  */

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

        organizationDetails().then(response => {
            // console.log('calling response raja', JSON.stringify(response));
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
            }
             document.addEventListener('click', this.handleDocumentClick);
        });
       
    } 

    disconnectedCallback() {
    document.removeEventListener('click', this.handleDocumentClick);
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
                            Type__c: record?.Type__c || '',
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
                    this.totalRecords = this.tempConList.length;
                    this.pageSize = this.pageSizeOptions[0];
                    this.pageNumber = 1;
                    this.paginationHelper();
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
    /* wiredData; 
    @wire(fetchRepositoryData, { organisationId: '$orgId' })
    wiredRepositoryData(result) {
        this.showLoadingSpinner = true;
        this.wiredData = result;
        const { data, error } = result;
        if (data) {
            console.log('Wire Data:', JSON.stringify(data));
            this.tempConList = data.map((record) => {
                return {
                    Id: record?.Id || '',
                    Name: record?.Name || '',
                    Type__c: record?.Type__c || '',
                    Size__c: record?.Size__c || '0',
                    Comments__c: record?.Comments__c || '',
                    User_Name__c: record?.User_Name__c || '',
                    Amazon_file_URL__c: record?.Amazon_file_URL__c || '',
                    Date_Format__c: record?.Date_Format__c || '',
                    isView: record?.HasReadAccess || false,
                    isEdit: record?.HasEditAccess || false,
                    isDelete: record?.HasDeleteAccess || false,
                };
            });
            this.records = this.tempConList;
            this.totalRecords = this.tempConList.length;
            this.pageSize = this.pageSizeOptions[0];
            this.pageNumber = 1;
            this.paginationHelper();
            setTimeout(() => {
                this.showLoadingSpinner = false;
            }, 1000);
        } else if (error) {
            console.error('Wire Error:', JSON.stringify(error));
            this.records = undefined;
            this.error = error;
            setTimeout(() => {
                this.showLoadingSpinner = false;
            }, 1000);
        }
    } */
    // fetchReplist(){
    //     refreshApex(this.wiredData);
    //     refreshApex(this.data); 
    // }
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
    // triggerFileInput() {
    //     console.log('File input triggered : ');
    //     this.template.querySelector('input[type="file"]').click();
    // }
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

    }

    // onFileUpload(event) {
    //     this.isattachError=false;
    //     this.isFileAttached=true;
    //     //this.recordId=event.detail.id;
    //    // console.log('in files upload',event.target.files.length);
    //         if (event.target.files.length > 0) {
    //         this.showSpinner = true;
    //         this.selectedFilesToUpload = event.target.files;      
    //         this.file = this.selectedFilesToUpload[0];
    //         this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
    //         this.fileType = this.selectedFilesToUpload[0].type;
    //         this.fileSize = this.selectedFilesToUpload[0].size;     
            
    //         if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
    //             this.isattachError=true;
    //         }
    //         //create an intance of File
    //         this.fileReaderObj = new FileReader();

    //         //this callback function in for fileReaderObj.readAsDataURL
    //         this.fileReaderObj.onloadend = (() => {        
    //             //get the uploaded file in base64 format
    //             let fileContents = this.fileReaderObj.result;
    //             fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
    //             //read the file chunkwise
    //             let sliceSize = 1024;           
    //             let byteCharacters = atob(fileContents);
    //             let bytesLength = byteCharacters.length;
    //             let slicesCount = Math.ceil(bytesLength / sliceSize);                
    //             let byteArrays = new Array(slicesCount);
    //             for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    //                 let begin = sliceIndex * sliceSize;
    //                 let end = Math.min(begin + sliceSize, bytesLength);                    
    //                 let bytes = new Array(end - begin);
    //                 for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
    //                     bytes[i] = byteCharacters[offset].charCodeAt(0);         
    //                 }
    //                 byteArrays[sliceIndex] = new Uint8Array(bytes);
    //             }
                
    //             //from arraybuffer create a File instance
    //             this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
    //             //callback for final base64 String format
    //             let reader = new FileReader();
    //             reader.onloadend = (() => {
    //                 let base64data = reader.result;
    //                 this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
    //             });
    //             reader.readAsDataURL(this.myFile);                                 
    //         });
    //         this.fileReaderObj.readAsDataURL(this.file);
    //     }
    //     this.showSpinner = false;
    //         // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
            
    //     console.log('filename>> ',this.fileName);
    // }  

    handleSubmit(event){
        event.preventDefault();
        if(this.uploadedFiles && this.attachmentid){
             this.deleteFile(this.key);
         
        }
        if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
            
            this.showToast('Error', 'Please upload at least one file before saving. ', 'error');
            return; // ❌ Prevent the form from submitting
        }
        let fields = event.detail.fields;
        fields.Organization__c = this.orgId;
        fields.Facility__c = this.FacilityId;
        console.log('facility',this.FacilityId);
      /*   fields.UploadFile_Result__c = JSON.stringify(this.uploadedFiles);
        fields.Amazon_file_URL__c = this.downloadLinks[0];
        console.log('this.fileSizeInBytes in submit : ', JSON.stringify(this.fileSizeInBytes));
        fields.Size__c = this.fileSizeInBytes && this.fileSizeInBytes.length > 0
            ? String(this.fileSizeInBytes[0])
            : ''; */

        console.log('fields.Size__c = ', fields.Size__c);
        console.log('isEdit in  submit : '+this.isEdit);
        // if (this.isEdit == true){
        //     this.UpdateDetails = true;            
        // }
        // else{
        //     this.UpdateDetails = false;            
        // }

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
      //  refreshApex(this.wiredData);
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

        // Call Apex to create Security_Privilege__c
      /*   insertSecurityPrivilege({
            repositoryId: repositoryId,
            userId: this.currentUserId
        })
        .then(() => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: this.successmessage,
                variant: 'success'
            }));
        })
        .catch(error => {
            console.error('Error creating security privilege:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Security Privilege creation failed',
                variant: 'error'
            }));
        }); */
        //if(this.UpdateDetails == false){
            //To update the filesize
            // UpdateFileSize({recordId:this.recordId, filesize:this.fileSize})
            // .then(fileresult =>{
            //     console.log('Updated file size = ' +fileresult);  
            //     this.fetchReplist();                  
            // })
            // .catch(error => {
            //     window.console.log(error);
            //         this.dispatchEvent(
            //             new ShowToastEvent({
            //                 title: 'Error in uploading File',
            //                 message: error.message,
            //                 variant: 'error',
            //             }),
            //         );
            // })

            this.showSpinner = true;
            //Uploading files to AWS S3 bucket
            
            console.log('Record Id>> ',this.recordId);
            // uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId: this.recordId,obj:'rep'})
            // .then(result => {
            //    // console.log('Upload result = ' +result);
            //     this.fileName = this.fileName + ' - Uploaded Successfully';
            //     //call to show uploaded files        
            //     this.dispatchEvent(
            //         new ShowToastEvent({
            //             title: 'Success!!',
            //             message: this.file.name + ' - uploaded successfully.',
            //             variant: 'success',
            //         }),
            //     );
            //     setTimeout(() => {
            //         this.fetchReplist(); 
            //     }, 1500);
                   
            // })
            // .catch(error => {
            //     // Error to show during upload
            //     window.console.log(error);
            //     this.dispatchEvent(
            //         new ShowToastEvent({
            //             title: 'Error in AWS uploading File',
            //             message: error.message,
            //             variant: 'error',
            //         }),
            //     );
            //     this.showSpinner = false;
            // });            
        //}   
        setTimeout(() => {
            this.fetchReplist(); 
        }, 1500);          
        this.isOpenModal=false;
        this.isEdit=false;        
        this.showSpinner = false; 
        this.isModalOpen=false;
        this.isHome=true;
         this.uploadedFiles=[];
        this.totalfiles=[];
        this.documentedit=false;
  
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
        const parentRecord = this.data.find(rec => rec.Id === this.recordId);
        if (parentRecord.Repository_Attachments__r && parentRecord.Repository_Attachments__r.length > 0) {
            const childRecord = parentRecord.Repository_Attachments__r.find(c => c.Id === this.attachmentid);
            if (childRecord) {
                this.fileName = childRecord.File_Name__c;
            } else {
                console.warn('Child record not found in parent');
                this.fileName = '';
            }
        } 
       /*  getRepoData({ recordId: this.recordId })
        .then(record => {
            console.log('Fetched attachment:', record);
            const uploadedFileResult = record.UploadFile_Result__c;
            console.log('Uploaded file result:', JSON.stringify(uploadedFileResult));
            try {
                // Parse the JSON string
                const parsed = JSON.parse(uploadedFileResult);

                // Check if it's an array and extract original names
                if (Array.isArray(parsed)) {
                    const originalNames = parsed.map(file => file.originalName);
                    console.log('Original file names:', originalNames);
                    this.fileName = originalNames[0];
                    console.log(' file name:', this.fileName);
                } else {
                    console.warn('Parsed data is not an array');
                }
            } catch (e) {
                console.error('Failed to parse UploadFile_Result__c:', e);
            }
            
        })
        .catch(error => {
            console.error('Error fetching attachment:', error);
        });   */    
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

    // JS function to handel pagination logic 
    paginationHelper() {
        this.data = [];
        if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
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
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            let record = { ...this.records[i] }; // shallow copy
            record.Size__c = this.formatFileSize(record.Size__c); // convert to MB
            this.data.push(record);
        }
 
        console.log('this.data:', JSON.stringify(this.data)); 
      //  refreshApex(this.wiredData);
       // refreshApex(this.data);  
        //console.log('Wire Data:', JSON.stringify(this.data)); 
    }

    // formatFileSize(bytes) {
    //     var marker = 1024; // Change to 1000 if required
    //     var decimal = 2; // Change as required
    //     var kiloBytes = marker; // One Kilobyte is 1024 bytes
    //     var megaBytes = marker * marker; // One MB is 1024 KB
    //     var gigaBytes = marker * marker * marker; // One GB is 1024 MB
        
    //     if(bytes < gigaBytes) return(bytes / megaBytes).toFixed(decimal) + " MB";
    // }

    formatFileSize(bytes) {
    const decimal = 2;
    return (bytes / (1024 * 1024)).toFixed(decimal) + ' MB';
}

    
    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        //this.fetchReplist(); 
        const rowId = event.currentTarget.dataset.id;
        console.log('View clicked for row with Id:', rowId);
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        console.log('file url BEFORE  '+ url); 
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
        this.isOpenModal=false;
        
        const fileType = this.getFileType(this.currentUrl);
       
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
    searchKey = '';
    @track userTypeOption = [];
    

   /*  userTypeOption = [
        { label: 'NDIS Org Admin', value: 'NDIS Org Admin' },
        { label: 'Outlet Admin', value: 'Outlet Admin' },
        { label: 'Roster Manager', value: 'Roster Manager' },
        { label: 'HR Admin', value: 'HR Admin' },
        { label: 'Payroll Admin', value: 'Payroll Admin' },
        { label: 'ICT Staff', value: 'ICT Staff' },
        { label: 'NDIS Staff', value: 'NDIS Staff' },
        { label: 'ICT Admin', value: 'ICT Admin' }       
    ]; */

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

    handleRoleSelection(event) {
        this.selectedRoles = event.detail.value;
        console.log('selected roles :'+this.selectedRoles);
          console.log('Rep Id:', this.selectedRowId);
        //this.loadUsersByRoles();
        this.userListTable=true;
        refreshApex( this.wiredUsersViewResult ); 
    }

    // async loadUsersByRoles() {
    //     try {
    //         const users = await getUsersByRoles({ roles: this.selectedRoles });
    //         this.users = users;
    //         console.log('Get Users List : '+JSON.stringify(this.users));
    //         this.filterUsers();
    //     } catch (error) {
    //         console.error('Error fetching users:', error);
    //     }
    // }
   
    
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
    
    

    // async loadUsersByRoles() {
    //     console.log('loadUsersByRoles is calling');
    //     try {
    //         // Step 1: Fetch users based on selected roles and check view permissions
    //         const result = await getUsersWithViewPermission({
    //             repositoryId: this.selectedRowId, 
    //             roles: this.selectedRoles // Pass selected roles to filter users
    //         });
    
    //         console.log('Apex method returned users:', result); // Log the result from Apex.
    
    //         // Step 2: Process users to add view permission flag (checkbox checked or unchecked)
    //         if (result && result.length > 0) {
    //             this.filteredUsers = result.map(item => {
    //                 return {
    //                     ...item.user,
    //                     hasViewPermission: item.hasViewPermission || false // If the user has view permission, set the flag to true
    //                 };
    //             });
    
    //             console.log('Filtered Users with View Permission:', JSON.stringify(this.filteredUsers)); // Log the updated list of users with the permission flag
    //         } else {
    //             this.filteredUsers = []; // If no users, reset the filteredUsers array
    //             console.log('No users found with view permission.');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching users with permissions:', error); // Log errors
    //     }
    // }
    
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
            this.filteredUsers = data.map(item => ({
                ...item.user,
                hasViewPermission: item.hasViewPermission || false // Set view permission flag
            }));

            //console.log('Filtered Users with View Permission:', JSON.stringify(this.filteredUsers));
        } else if (error) {
            // Handle errors if any
            console.error('Error fetching users with permissions:', error);
            this.filteredUsers = []; // Reset filteredUsers on error
        }
    }
    
    handlePermissionChange(event) {
        console.log('Name:', event.target.name);
        const isChecked = event.target.checked;
        if (event.target.name === 'view') {
            this.isViewFlag = isChecked;  // Set the view permission flag
            console.log('View flag:', this.isViewFlag);
        }
        this.checkSubmitButtonState();  // Update button state after permission change
    }

    checkSubmitButtonState() {
        const isAnyUserSelected = this.filteredUsers.some(user => user.hasViewPermission);
        this.saveDisabled = !(this.isViewFlag && isAnyUserSelected);
    }

    @track isViewFlag = false;
    @track participanteditflag = false;
    handleSubmitPermissions(event){
        console.log('Selected repo Id:', this.selectedRowId);
        console.log('Selected User Ids :'+this.selectedUserIds);
        console.log('View :'+this.isViewFlag);
      
        insertSecurityRecord({ repositoryId: this.selectedRowId,selectedUsers: this.selectedUserIds, isView: this.isViewFlag,attachmentId:this.attachmentid }).then(() => {
            this.participanteditflag=false;  
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: ' User selected successfully.',
                    variant: 'success'
                })
            );  
            this.isOpenPermission = false; 
            this.isHome = true; 
            this.fetchInitialRepositoryData(); 
            //refreshApex(this.wiredData);                         
        })
        .catch(error => {
        // Handle error
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'An error occurred while updating permissions',
                variant: 'error'
            }));
            console.error('Error inserting record:', error);
        }); 
        this.isOpenPermission = false; 
        this.isHome = true; 
        this.isViewEnable = false;  
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
     const invalidFile = files.find(f => !this.isAllowedFile(f));
    if (invalidFile) {
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
        event.target.value = ''; // reset
        return;
    }

      const longNameFile = files.find(f => f.name.length > 50);
    if (longNameFile) {
        this.showToast(
            'Error',
            `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
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
        
        const invalidFile = files.find(f => !this.isAllowedFile(f));
        if (invalidFile) {
            this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
            event.target.value = ''; // reset
            return;
        }
        const longNameFile = files.find(f => f.name.length > 50);
        if (longNameFile) {
            this.showToast(
                'Error',
                `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
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
                        message: 'Child record deleted successfully',
                        variant: 'success'
                    })
                );

                // Optionally clear the childId
                this.attachmentid = '';
                 this.deleteFile(key);
                 this.fetchInitialRepositoryData(); 
            })
       
    }
  

}