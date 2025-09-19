import { LightningElement,api, track,wire} from 'lwc';
import PendingReimbursements from '@salesforce/apex/SubmissionsController.PendingReimbursements';
import createReimbursement from '@salesforce/apex/SignInController.craeteReimbursement';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { loadScript } from "lightning/platformResourceLoader";
import momentJS from "@salesforce/resourceUrl/momentJS";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from 'lightning/navigation';
import PendingShifts from '@salesforce/apex/SignInController.PendingShifts';
import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import getAllReimbursements from '@salesforce/apex/SubmissionsController.getAllReimbursements';


export default class StaffSubmissionsLwc extends NavigationMixin(LightningElement) {
    employee = My_Resource + '/myResource/images/Submissions.png';
    @track signinList=[];
    @track rejectedlist=[];
    @track selectedShift; 
    @track reimbursementId; 
    @track meters;
    @track mileage;
    @track others;
    @track fileName;
    @track datePickerString=new Date().toLocaleDateString('en-GB');
    @track startDate;   
    @track signoutDisable=false;
    @track bDisable=true;	
    @track attachDisable=true;
    @track reiburseFileLength;
    @track wiredShfits;
    @track currentUserRole;
    /* @track activeSections = []; */
    @track error;
    @track isOrgAdminVisible=false;
    @track isUpdate=false;
    @track allReimburesments=[];
    @track isReimburesementsTable=false;
    @track Loadingdata='Data is loading. Please Wait'
    wiredReimbursementsResult
    @track ReimburesementRecordForm=false; 
    @track amount; 
    @track comments;
    @track isHome=true;
    dateShift = 1;
    @track isModalOpen=false;
    @track currentUrl;
    @track rejectedSubmission=false;
    @track visibleSubmissionSection=false;
    activeSections = ['Approvals', 'Submissions'];
    @track showSpinner=false;
    @track vehicleValue;
    @track columns = [
      { label: 'Shift Date', fieldName: 'ShiftDate__c',  initialWidth: 150,type:'date',
      typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"} },
        { label: 'Login Time', fieldName: 'Shift_login_time_Formula__c',  initialWidth: 150 }, 
        { label: 'Logout Time', fieldName: 'Shift_log_out_time_formula__c',  initialWidth: 150, },
        { label: 'Mileage/Others', fieldName: 'Mileage_Others__c',  initialWidth: 150},
        { label: 'Amount', fieldName: 'Amount__c',  initialWidth: 150 },
        { label: 'Comments', fieldName: 'Comments__c',  initialWidth: 150 },          
        { label: 'Approver Comments', fieldName: 'Approver_Comments__c',  initialWidth: 150 },
    ];

    @track SubmissionColums = [
      { label: 'Location', fieldName: 'Shift_Locations__c',  initialWidth: 150 }, 
      { label: 'Date', fieldName: 'Date__c',  initialWidth: 150 , type: 'date',
        typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"} },
      { label: 'Start Time', fieldName: 'Start_time_Formula__c',  initialWidth: 150 },
      { label: 'End Time', fieldName: 'End_time_formula__c',  initialWidth: 150},
      { label: 'Role', fieldName: 'Role_formula__c',  initialWidth: 150 },
      { label: 'Facility Name', fieldName: 'Facility_Names__c',  initialWidth: 150 },
    ];
    @track subMissionOptions=[
      { label: 'Rejected Submissions', value: 'RejectedSubmissions' },
      {label: 'Previous Submissions', value: 'Submissions' }];

    @track vehicleOptions = [
          { label: 'Fuel', value: 'Fuel' },
          { label: 'Electric', value: 'Electric' },
    ];

    @wire(getRecord, { recordId: Id, fields: [UsrRoleName]}) 
    currentUserInfo({error, data}) {
        if (data) {
            this.currentUserRole =data.fields.User_Role__c.value;

            if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
                  this.isOrgAdminVisible=true;
               /* this.activeSections = ['RejectedSubmissions'];  */
            } 
            if(this.currentUserRole == 'Portal Account Partner User'){
                  this.isOrgAdminVisible=false;
              //  this.activeSections = ['StaffTrainingStatus']; 

            }
        }
     else if (error) {
        this.error = error ;
    }
    } 

    @wire(getAllReimbursements, { startDate: '$datePickerString' })
    wiredReimbursements(result) {
        this.wiredReimbursementsResult = result;
        const { data, error } = result;
        if (data) {
            this.allReimburesments = data.map(rec => ({
                ...rec,
                shiftdate: rec.ShiftDate__c ? new Date(rec.ShiftDate__c).toLocaleDateString('en-GB') : ''
            }));
            if(this.allReimburesments.length>0){
              this.isReimburesementsTable=true;
            }else{
              this.isReimburesementsTable=false;
              this.Loadingdata='No Reimbursements Found'
            }
            console.log('All reimbursements:', JSON.stringify(this.allReimburesments));
        } else if (error) {
            console.error('Error in getting reimbursements:', error);
        }
    }

 
    connectedCallback() {
       // console.log('submission connected call back');
        Promise.all([
            loadScript(this, momentJS)
          ]).then(() => {  
            //this.datePickerString=new Date().toLocaleDateString('en-GB');
            this.setStartDate(new Date());
            //this.handleVisbility();
          });
       this.isHome=true;
       this.isModalOpen = false;
      
    } 
    getStaffShifts(datePickerString){      
      PendingReimbursements({startDate: this.datePickerString}).then(response => {
            this.rejectedlist = response.map(item => {
        return {
          ...item,
          ShiftDateFormatted: item.ShiftDate__c? new Date(item.ShiftDate__c).toLocaleDateString('en-GB'): ''
        };
      });
            console.log('response==>'+JSON.stringify(response));
          }).catch(err => {
           // console.log(err);
          });
    }
    setStartDate(_startDate) {
        if (_startDate instanceof Date && !isNaN(_startDate)) {      
          this.datePickerString = _startDate.toISOString();
          //console.log('in strdate',_startDate.toISOString());
          this.startDate = moment(_startDate)
            .day(1)
            .toDate();
          this.startDateUTC =
            moment(this.startDate)
              .utc()
              .valueOf() -
            moment(this.startDate).utcOffset() * 60 * 1000 +
            "";
         this.formattedStartDate = _startDate.toLocaleDateString('en-IN');
        // console.log('strt date',this.startDate);
         this.getStaffShifts(this.datePickerString); 
         PendingShifts({startDate:this.datePickerString}).then(response=>{
          this.signinList = response;
          this.signinList = response.map(signin => ({
            ...signin,
            formattedStartDate: signin.Date__c ? new Date(signin.Date__c).toLocaleDateString('en-GB') : '',
            
        }));
          console.log('Data: in change  ', JSON.stringify(response));
         }); 
        } else {
          this.dispatchEvent(
            new ShowToastEvent({
              message: "Invalid Date",
              variant: "error"
            })
          );
        }
    }
   
    @track sectionFlags = {
      Approvals: true,
      Submissions: false,
      
  };
  
  // Icons for the toggle buttons
  @track sectionIcons = {
    Approvals: '\u2B9F', 
    Submissions: '\u2B9C',
      
  };
  handleSectionToggle(event) {
      const sectionId = event.currentTarget.dataset.id;
      const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);
  
      if (!this.sectionFlags[sectionId]) {
          // First click: Set the section to true so it loads in the DOM
          this.sectionFlags[sectionId] = true;
      } else {
          // From second click onwards: Just toggle the hidden-section class
          sectionElement.classList.toggle('hidden-section');
      }
  
      // Toggle the icon dynamically
      this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
  }
    navigateToToday() {
        this.allDayList=[];
        this.setStartDate(new Date());    
      }
    
    navigateToPrevious() {   
        this.allDayList=[];
        let _startDate = new Date(this.datePickerString);  
        _startDate.setDate(_startDate.getDate() - this.dateShift);
        this.setStartDate(_startDate);
        this.fileName = '';
        this.selectedFilesToUpload = '';
        this.others = '';
        this.amount = '';
        this.comments = '';
        this.vehicleValue = '';
        this.attachDisable=true;		
    }
    
      navigateToNext() { 
        this.allDayList=[];
        let _startDate = new Date(this.datePickerString);
       // let _startDate = new Date(this.startDate);
       // console.log('nextdate',_startDate.getDate());
        _startDate.setDate(_startDate.getDate() + this.dateShift);
        this.setStartDate(_startDate);
        this.fileName = '';
        this.selectedFilesToUpload = '';
        this.others = '';
        this.amount = '';
        this.comments = '';
        this.vehicleValue = '';
        this.attachDisable=true;    
      }
    
      navigateToDay(event) {
       // console.log('nav');
        this.allDayList=[];
        this.setStartDate(new Date(event.target.value )); 
        this.fileName = '';
        this.selectedFilesToUpload = '';
        this.others = '';
        this.amount = '';
        this.comments = '';
        this.vehicleValue = '';
        this.attachDisable=true;   
      }

    handleSelected( event ) {
      const Id = event.currentTarget.dataset.id;
      const shiftwithstaff = event.currentTarget.dataset.shiftstaff;
      const status = event.currentTarget.dataset.status;
      console.log('handleselect'+Id+shiftwithstaff+status);
               
              this.reimbursementId=Id;
              this.selectedShift=shiftwithstaff;	
              this.isUpdate=true;	 
              //console.log('shift login time==>'+selectedRow.Shift_Login_time_formula__c);
              //console.log('Approval status==>'+selectedRow.Approval_Status__c);
              if(status =='Rejected'){
                this.attachDisable=false;
              }else{
                this.attachDisable=true;
              }
                  
              
    }
    HandleSignInrowSelection(event){
      const Id = event.currentTarget.dataset.id;
      const logout = event.currentTarget.dataset.logout;
      console.log('shifts slected ' +logout);
                 
        this.reimbursementId='';
        this.selectedShift=Id;	
        this.isUpdate=false;	 	 
         if(logout != null && logout !=undefined  && logout !=''){
          this.attachDisable=false;
        }else{
          this.attachDisable=true;
          this.dispatchEvent(
            new ShowToastEvent({
              title: 'Error',
              message: 'Please provide logout Time',
              variant: 'Error'
            })
          );
        } 
            
      
    }
    onFileUpload(event) {
        this.isattachError=false;
       // console.log('in files upload',event.target.files.length);
        this.reiburseFileLength=event.target.files.length;
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
       // console.log('file prepared');
      }  
      handleChange(event){
     
        if(event.target.name=="Amount"){
          this.amount=event.target.value;
        }
        if(event.target.name=="others"){
          this.others=event.target.value;
        }
        if(event.target.name=="comment"){
          this.comments=event.target.value;
        }
        if(event.target.name=="vehicle"){
          this.vehicleValue=event.target.value;
        }
      }

      onSubmitForApproval(){
        if(this.others && this.comments && this.reiburseFileLength ){
          console.log('amount '+this.amount);
          console.log('others '+this.others);
          createReimbursement({signinId:this.selectedShift,Amount:parseFloat(this.amount),MileageAndOthers:this.others, typeofvehicle: this.vehicleValue, comments: this.comments,isupdate:this.isUpdate,reimbId:this.reimbursementId}).then(result => {
         // console.log('reimbursements id'+result);
          this.recordId=result;
         // console.log('rec id'+ this.recordId);
         // console.log('base64FileData'+JSON.stringify(this.base64FileData))
          this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Submitted for Approval',
                variant: 'success',
            }),
            );
          this.showSpinner = true;
          if(this.fileName.length > 0){
           // console.log('file length'+this.fileName.length);
           // console.log('reimburse recordId'+this.recordId);
            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:this.recordId,obj:'reimburse'}).then(result => {
               // console.log('Upload result = ' +result);
                this.fileName = this.fileName + ' - Uploaded Successfully';                
                //const myTimeout = setTimeout( this.createInvoices(), 10000);          
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.file.name + ' - Uploaded Successfully!!!',
                        variant: 'success',
                    }),
                );
                setTimeout(() => {
                  refreshApex(this.wiredReimbursementsResult);
                 this.showSpinner = false;
              }, 2000); 
              this.fileName = '';
              this.selectedFilesToUpload = '';
              this.others = '';
              this.amount = '';
              this.comments = '';
              this.vehicleValue = '';
              this.attachDisable=true;
              this.showSpinner = false;
              })
              .catch(error => {
                  // Error to show during upload
                 // window.console.log(error);
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: 'Error in uploading File',
                          message: error.message,
                          variant: 'error',
                      }),
                  );
                  this.showSpinner = false;
                  this.isUpdate=false;
                  this.fileName = '';
                  this.selectedFilesToUpload = '';
                  this.others = '';
                  this.amount = '';
                  this.comments = '';
                  this.vehicleValue = '';
                  this.attachDisable=true;
                  this.showSpinner = false;
              });
            }
          }).catch(error=>{
            this.error = error;
            this.fileName = '';
            this.selectedFilesToUpload = '';
            this.others = '';
            this.amount = '';
            this.comments = '';
            this.vehicleValue = '';
            this.attachDisable=true;
            this.showSpinner = false;
            //console.log('Error >>>'+JSON.stringify(this.error));
          });
         // this.setStartDate(new Date());
          this.attachDisable=true;
          this.isUpdate=false;
         } else{
            this.dispatchEvent(
              new ShowToastEvent({
                title: 'Error',
                message: 'Please provide Mileage, Comments , others and file ',
                variant: 'Error'
              })
            );
          }
          this.isHome=true;
          this.isModalOpen = false;
      }
      
      navigatetoHome() {
        this[NavigationMixin.Navigate]({
          type: 'comm__namedPage',
          attributes: {
            //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
            pageName: 'home'
          },
        });
      }

      handleApprovalStatus(event){
        const reimbursementstatus = event.currentTarget.dataset.modulestatus || 'Undefined';
        console.log('Reimbursement Status:', reimbursementstatus);
      }
      @track isButtonDisabled = true;
      handleApprove(event){
        this.ReimburesementRecordForm=true;
        this.reimbursementId=event.currentTarget.dataset.moduleid;
        const reimbursementstatus = event.currentTarget.dataset.modulestatus;
        console.log('this.reimbursementstatus==>'+reimbursementstatus);
        if(reimbursementstatus == 'Approved' || reimbursementstatus == 'Rejected'){
          console.log('this.reimbursementstatus==>'+reimbursementstatus);
            this.isButtonDisabled = true;
        } else {
          this.isButtonDisabled = false;
        }
      }

      handleClose(){;
        this.ReimburesementRecordForm=false;
      }
      handleSuccess(event){
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Details Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        refreshApex(this.wiredReimbursementsResult);
        this.ReimburesementRecordForm=false; 
      }

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
        this.isOpenModal=false;
        
        const fileType = this.getFileType(this.currentUrl);
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'jpg' && fileType !== 'csv' && fileType !== 'svg') {
            setTimeout(() => {
                this.closeModal();
                
            }, 1700);
            
        }  
    }
    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome=true;
    }
    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    } 
    handleSubmissions(event){
      this.visibleSubmissionSection=true;
      console.log('event value '+event.detail.value);
      if(event.detail.value=='RejectedSubmissions'){
          this.rejectedSubmission=true;
      }else{
        this.rejectedSubmission=false;
      }
      this.fileName = '';
      this.selectedFilesToUpload = '';
      this.others = '';
      this.amount = '';
      this.comments = '';
      this.vehicleValue = '';
      this.attachDisable=true;	
    } 
}