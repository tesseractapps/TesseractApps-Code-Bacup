import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getModules from '@salesforce/apex/HRTraining.getModules';
import getAssignments from '@salesforce/apex/HRTraining.getAssignments';
import getStaffAssignments from '@salesforce/apex/HRTraining.getStaffAssignments';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaffs';
import insertAssignRecords from '@salesforce/apex/HRTraining.insertAssignRecords';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UserFirstName from '@salesforce/schema/User.FirstName';
import UserLastName from '@salesforce/schema/User.LastName';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import userOrgName from '@salesforce/schema/User.Organization_Name__c';
import { deleteRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import LightningConfirm from 'lightning/confirm';
import { NavigationMixin } from 'lightning/navigation';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import redirectToWyzedSSO from '@salesforce/apex/WyzedIntegrationHandler.redirectToWyzedSSO';



const fields = [UsrRoleName,userOrgName];
export default class HrTraining extends NavigationMixin(LightningElement) {
    
    @api hrFlag;
    @track moduleName;
    @track startDate;
    @track endDate;
    @track description;
    @track imageURL;
    @track facEditFlag=false;
    @track assignmentFlag=false;
    @track recordId;
    @api selectedName;
    @track firstname='';
    @track lastname ='';
    @track Staffoptions=[{}];
    @track staffIdList=[];
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole
    @track usererror;
    @track userOrgName;
    @track saveButtonDisable=false;
    @track updateButtonDisable=false;
    @track Training;
    @track savelabel;
    @track assignid;
    @track staffEditFlag=false;
    @track error;
    @track isStaffVisible=false;
    @track selectedFilesToUpload;
    @track fileName = '';
   // @track UploadFile = 'Upload CSV File';
    @track showLoadingSpinner = false;
    @track filesUploaded = [];
    @track fileContents;
    @track fileReader;
    @track content;
    MAX_FILE_SIZE = 1500000;
    @track fileType;
    @track fileSize;
    @track showSpinner;
    @track fileReaderObj;
    @track myFile;
    @track dateErrorMessage;
    @track isHome=true;
    @track individualstaffassigments=[];
    @track modules=[];
    @track staffassigments=[];
    @track moduleid;
    @track statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
      ];
      @track statusValue = 'In Progress';    
    /* @track activeSections = []; */
    @track individualstaffflag=false;
    @track totalstaffflag=false;
    activeSections = ['CreateTraining', 'StaffTrainingStatus'];
    @track TodayDate=null;
    @track AdminUserEmail;
    @track AdminUserFirstName;
    @track AdminUserlastName;

    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,userOrgName,UserEmail,UserFirstName,UserLastName]}) 
    currentUserInfo({error, data}) {
        if (data) {
          //  console.log('WIRE DATA '+JSON.stringify(data));
            this.currentUserRole =data.fields.User_Role__c.value;
            console.log(' hr  falgs '+ this.hrFlag);
           this.AdminUserEmail=data.fields.Email.value;
            this.AdminUserFirstName=data.fields.FirstName.value;
            this.AdminUserlastName=data.fields.LastName.value;
          //  console.log('user email '+userEmail);
         //   console.log('user email '+userFirstName);
        //    console.log('user email '+userLastName);
           
        if(this.hrFlag){
            if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
               this.isStaffVisible=true;
               /* this.activeSections = ['CreateTraining']; */ 
               this.individualstaffflag=false;
               this.totalstaffflag=true;
               console.log(' admin  falgs '+ this.currentUserRole);
               console.log(' admin  falgs '+ this.isStaffVisible);
               console.log(' visible   falgs '+ this.individualstaffflag);
               console.log(' staff  falgs '+ this.totalstaffflag);
            } 
        }else{
                this.isStaffVisible=false;
                /* this.activeSections = ['StaffTrainingStatus']; */ 
                this.individualstaffflag=true;
                this.totalstaffflag=false;
               

            }
           
        }
       
     else if (error) {
        this.error = error ;
    }
    
    } 


    connectedCallback() {
        this.loadModules();
        this.loadAssignment();
        this.loadStaffAssignment();
    }

            loadAssignment() {
                getAssignments({ CurrentOrgId: this.selectedName })
                    .then(result => {
                        this.staffassigments = result.map(assign => ({
                            ...assign,
                            modulename: this.capitalizeFirstLetter(assign.Module_Name__r?.Name ?? ''),
                            fullName: `${assign.Staff__r?.Name ?? 'N/A'} ${assign.Staff__r?.Last_Name__c ?? ''}`,
                            description: this.capitalizeFirstLetter(assign.Module_Name__r?.description__c ?? ''),
                            Dueby: assign.Due_Date__c ? new Date(assign.Due_Date__c).toLocaleDateString('en-GB') : '',
                            completeddate:assign.Completed_Date__c ? new Date(assign.Completed_Date__c).toLocaleDateString('en-GB') : '',
                            uiStatus: assign.Status__c=="Inprogress" ?"In Progress":assign.Status__c
                            
                        }));
                       // console.log('Assign records', JSON.stringify(this.staffassigments));
                    })
                    .catch(error => {
                        console.error('Error fetching modules:', error);
                    });
            }

            loadStaffAssignment() {
                getStaffAssignments({ CurrentOrgId: this.selectedName })
                    .then(result => {
                        this.individualstaffassigments = result.map(assign => ({
                            ...assign,
                            modulename: this.capitalizeFirstLetter(assign.Module_Name__r?.Name ?? ''),
                            fullName: `${assign.Staff__r?.Name ?? 'N/A'} ${assign.Staff__r?.Last_Name__c ?? ''}`,
                            description: this.capitalizeFirstLetter(assign.Module_Name__r?.description__c ?? ''),
                            Dueby: assign.Due_Date__c ? new Date(assign.Due_Date__c).toLocaleDateString('en-GB') : '',
                            completeddate:assign.Completed_Date__c ? new Date(assign.Completed_Date__c).toLocaleDateString('en-GB') : '',
                            uiStatus: assign.Status__c=="Inprogress" ?"In Progress":assign.Status__c
                        }));
                        console.log('Assign records', JSON.stringify(this.staffassigments));
                        console.log('individual records', JSON.stringify(this.individualstaffassigments));
                    })
                    .catch(error => {
                        console.error('Error fetching modules:', error);
                    });
            }

            
    loadModules() {
        getModules({ CurrentOrgId: this.selectedName })
            .then(result => {
                this.modules = result.map(module => ({
                    ...module,
                    module_name: this.capitalizeFirstLetter(module.Name ?? ''),
                    description: this.capitalizeFirstLetter(module.description__c ?? ''),
                    startFormatted: module.start_date__c ? new Date(module.start_date__c).toLocaleDateString('en-GB') : '',
                    endFormatted: module.end_date__c ? new Date(module.end_date__c).toLocaleDateString('en-GB') : ''
                }));
            })
            .catch(error => {
                console.error('Error fetching modules:', error);
            });
    }
    

    
    @wire(fetchStaff, { recordId: '$selectedName', firstname: '$firstname', lastname: '$lastname' }) recordsToDisplay(result) {
        if (result.data) {
            this.Staffoptions = result.data.map(record => ({ value: record.Id, label: record.Name+' '+record.Last_Name__c }));
        }
    }
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
  
    handleStartDateChange(event) {
        this.startDate = event.detail.value;
        console.log('end date' +this.startDate);
        this.validateDates();
    }

    handleEndDateChange(event) {
        this.endDate = event.detail.value;
        console.log('end date' +this.endDate);
        this.validateDates();
    }

    validateDates() {
    
        if (this.startDate && this.endDate) {
            if (new Date(this.endDate) < new Date(this.startDate)) { 
                 this.dateErrorMessage = 'You cannot set an end date that precedes the start date.';
                 this.saveButtonDisable=true;
            } else {
                this.dateErrorMessage = '';
                this.saveButtonDisable=false;
            }
        }
    }

    @track sectionFlags = {
        StaffTrainingStatus: true,
        CreateTraining: true,
        
    };

    @track sectionIcons = {
        StaffTrainingStatus: '\u2B9F', 
        CreateTraining: '\u2B9F', 
    };
    
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id;

        this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
    }

    handleSuccess(event){
        
        
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Details Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
       // console.log('base64>> ',this.base64FileData);       
        this.showSpinner = true;
        //Uploading files to AWS S3 bucket
        if(this.fileName.length > 0){
            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:event.detail.id,obj:'hrtraining'})
            .then(result => {
               // console.log('Upload result = ' +result);
                this.fileName = this.fileName + ' - Uploaded Successfully';            
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.file.name + ' - Uploaded Successfully!!!',
                        variant: 'success',
                    }),
                );
            }).catch(error => {
               // window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error in uploading File',
                        message: error.message,
                        variant: 'error',
                    }),
                );
                this.showSpinner = false;
            });
        }        
        this.facEditFlag=false;         
        this.showSpinner = false;
      
        if(event.detail.id){
            setTimeout(() => {
                this.loadModules(); 
            }, 1000);
        }
       
        
    }
    handleSubmit(event){
       // console.log('in submit');
        event.preventDefault();// stop the form from submitting
          const fields = event.detail.fields;
          // alert(JSON.stringify(fields));
            fields.Organization__c=this.selectedName;
          this.template.querySelector('lightning-record-edit-form[data-recid="Training"]').submit(fields);
      }
    handleassignment(event){
        this.assignmentFlag=true;
        this.moduleName=event.currentTarget.dataset.module;
        this.moduleid=event.currentTarget.dataset.moduleid;
       // console.log('module name'+JSON.stringify(this.moduleName));
       // console.log('module id'+JSON.stringify(this.moduleid));
    }
    handleCreateNewtraining(event){
        this.facEditFlag=true;
        this.savelabel='Save';
        this.Training='Create New Training Module';
        this.recordId='';
        this.fileName='';
        this.dateErrorMessage='';
        this.saveButtonDisable=false;
    }
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }
    handleeditClose(event){
        this.facEditFlag=false;
        this.assignmentFlag=false;
        this.staffEditFlag=false;
        this.statusValue='Pending';
        this.TodayDate=null;
    
    }

    handleModuleNameChange(event) {
        this.moduleName = event.target.value;
    }
    /* handleStartDateChange(event) {
        this.startDate = event.target.value;
    }

    handleEndDateChange(event) {
        this.endDate = event.target.value;
    } */

    handleDescriptionChange(event) {
        this.description = event.target.value;
    }
    handleImageChange(event) {
        // Handle file upload and store the image URL
        // For simplicity, let's assume imageURL is set to some value here
        this.imageURL =event.target.value;
    }

    handleassignmentinsert() {
       // console.log('organisation name insert :'+this.userOrgName);
    
        insertAssignRecords({ moduleID: this.moduleid,selectedStaff: this.staffIdList,OrganizationName: this.userOrgName     
        })
        .then(() => {
            this.assignmentFlag=false;
        
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records inserted successfully',
                    variant: 'success'
                })
            );
            setTimeout(() => {
                this.loadAssignment();
            }, 1000);
            
        })
        .catch(error => {
            // Handle error
            console.error('Error inserting record:', error);
        });
            
    }
    handleduallist(event){
        this.staffIdList=event.target.value;
       // console.log('staffids:'+(this.staffIdList));
        

    }
    closeviewfile(event){
        this.currentUrl='';
        this.isModalOpen=false;
        this.isHome=true;

    }
    handleModuleUpdate(event){
        this.facEditFlag=true;
        this.moduleid=event.currentTarget.dataset.moduleid;
        this.recordId=this.moduleid;
        this.savelabel='Update';
        this.Training='Update Training Module';
        this.fileName='';
        this.dateErrorMessage='';
        this.saveButtonDisable=false;
       // console.log('module name'+JSON.stringify(this.moduleName));
       // console.log('module id'+JSON.stringify(this.moduleid));
    }
     handleDelete(event){
          
            this.moduleid=event.currentTarget.dataset.moduleid;
            this.recordId=this.moduleid;
           // console.log('record id'+this.recordId);
            deleteRecord(this.recordId).then(() => {
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: 'Success',
                    message: 'Module has been deleted',
                    variant: 'success'
                  })
                );
                setTimeout(() => {
                    this.loadModules(); 
                }, 1000);
                setTimeout(() => {
                    this.loadAssignment();
                }, 1000);
            }
            
        )      
       
    }
    handleStaffassignment(event){
        this.staffEditFlag=true;
        this.assignid=event.currentTarget.dataset.assignid;
        const assignment = this.individualstaffassigments.find(item => item.Id === this.assignid);
        if(assignment.Status__c=='Inprogress'){
            this.TodayDate=assignment.Date_Completed__c;
            this.statusValue ='In Progress';
        }
        else{
            this.statusValue =assignment.Status__c;
        }

        console.log('status value'+this.statusValue);
        this.recordId=this.assignid;
        this.TodayDate=null;
        this.savelabel='Update';
        this.Training='Update Staff  Status'
    
       // console.log('module id'+JSON.stringify(this.moduleid));

    }
    handleStatusChange(event){
        console.log('event '+event.target.value);
        this.statusValue = event.target.value;
        console.log('status value'+this.statusValue);
        if(this.statusValue=='Completed'){
            this.TodayDate = new Date();
            console.log('Raw TodayDate: ' + this.TodayDate);
    
            // Format the date as yyyy-mm-dd
            const year = this.TodayDate.getFullYear();
            const month = String(this.TodayDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so we add 1
            const day = String(this.TodayDate.getDate()).padStart(2, '0'); // Add leading zero if necessary
    
            const formattedDate = `${year}-${month}-${day}`;
            console.log('Formatted TodayDate: ' + formattedDate);
            this.TodayDate=formattedDate;
        }

    }
    handleAssignmentsSubmit(event){
           
        event.preventDefault();// stop the form from submitting
        const fields = event.detail.fields;
        if(this.statusValue=='In Progress' ){
            fields.Status__c ='Inprogress';
            
        }else{
            fields.Status__c =this.statusValue;
        }
          
        console.log('status value'+this.statusValue);
        if(event.detail.fields.Status__c=='Completed'){
            fields.Completed_Date__c=this.TodayDate;    
        }
        console.log('in submit');
        console.log('fields'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recid="Assignment"]').submit(fields);

    }
    handlestaffSuccess(event){
        this.staffassigments=[]
        this.staffEditFlag=false;
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Status Updated Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
        this.TodayDate=null;
        if(event.detail.id){
        setTimeout(() => {
            this.loadStaffAssignment();
        }, 1000);
        }
        
    }
    onFileUpload(event) {        
        //this.isEdit=false;        
       // console.log('in files upload',event.target.files.length);
        if (event.target.files.length > 0) {
            this.showSpinner = true;
            this.selectedFilesToUpload = event.target.files;      
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;     
            
            if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
                this.isattachError=true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {        
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
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
                    for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);         
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
                
                //from arraybuffer create a File instance
                this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        this.showSpinner = false;
       // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
       // console.log('FileName>>>>'+this.fileName);
    }
    reload(event){
        this.modules=[];
        this.loadModules();

    }

    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileName(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }

    navigateToWyzed(event){
        console.log('staff id '+event.currentTarget.dataset.id);
        console.log('staff first name  '+event.currentTarget.dataset.firstname);
        console.log('staff last name'+event.currentTarget.dataset.lastname);
        console.log('staff email '+event.currentTarget.dataset.email);

        if (!event.currentTarget.dataset.id || !event.currentTarget.dataset.firstname || !event.currentTarget.dataset.lastname || !event.currentTarget.dataset.email) {
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide first name ,last name and email ID',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }

        redirectToWyzedSSO({ uid: event.currentTarget.dataset.id, firstname: event.currentTarget.dataset.firstname, surname: event.currentTarget.dataset.lastname, email: event.currentTarget.dataset.email,isAdmin:false })
        .then((redirectUrl) => {
            console.log('redirect url '+redirectUrl);
            // Redirect the user to the URL returned from the Apex method
          //  window.location.href = redirectUrl;
                this[NavigationMixin.GenerateUrl]({
                    type: 'standard__webPage',
                    attributes: {
                        url: redirectUrl
                    }
                }).then(generatedUrl => {
                    window.open(generatedUrl, '_blank');
                });
          

        })
        .catch((error) => {
            console.error('Error occurred during redirect: ', error);
            // Handle any errors
        });
   
    }
    navigateToWyzedAdmin(){
        console.log('AdminUserEmail '+ this.AdminUserEmail);
         console.log('AdminUserFirstName '+this.AdminUserFirstName);
          console.log('AdminUserlastName '+ this.AdminUserlastName);
          console.log('user id '+Id);
          
         redirectToWyzedSSO({ uid: Id, firstname: this.AdminUserFirstName, surname:this.AdminUserlastName, email: this.AdminUserEmail,isAdmin:true })
        .then((redirectUrl) => {
            console.log('redirect url '+redirectUrl);
            // Redirect the user to the URL returned from the Apex method
          //  window.location.href = redirectUrl;
                this[NavigationMixin.GenerateUrl]({
                    type: 'standard__webPage',
                    attributes: {
                        url: redirectUrl
                    }
                }).then(generatedUrl => {
                    window.open(generatedUrl, '_blank');
                });
          

        })
        .catch((error) => {
            console.error('Error occurred during redirect: ', error);
            // Handle any errors
        }); 
    }
}