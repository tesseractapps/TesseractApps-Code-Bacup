import { LightningElement, track, wire, api } from 'lwc';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';



export default class MyProfileHomePageLwc extends LightningElement {
   
   
    @track rewardsFlag = false;
    @track trainingFlag = false;
    @track empManagementflag = false;
    @track addEmployee = false;
    @track viewEmployee = false;
    @track searchEmployee = false;
    @track recentEmpData;
    @track recordId;
    @track hrFlag = true;
    @track contracttype;
    @track profileflag=false;
    @track leaveFlag=false;
    @track orgid;
    @track error;
    @track StaffId;
    @track reportsFlag;
    @track orgname;
    @track currentUserEmail;
    @track superiors;

    connectedCallback(){
        this.disableRightClick();
        this.disableShortcuts(); 


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

    

    @wire (organizationDetails) orgDeatails({ error, data }) {
        if (data) {
         
          this.orgid=data.listofPriceBook.Id;
          this.orgname=data.listofPriceBook.Name;
          if(this.orgid){
            this.profileflag=true;

          }

          console.log('org Id==>'+this.orgid);
            this.error = undefined;
        } else if (error) {
            this.error = error;
        
        }
    
    }
    
    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
                this.superiors=true;
            
               
             }else{
                this.superiors=false;
             }
            console.log('current role ' +this.currentUserRole);
            console.log(' staffUser '+this.staffuser);
            console.log(' org admin  '+ this.orgadmin);
            console.log(' superiorflag  '+ this.superiors);
        } else if (error) {
            this.usererror = error ;
        }
    }
    @wire(getStaffByEmail, { email: '$currentUserEmail' })
    wiredClient(result) {
        this.wiredClientResult = result;
        console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
            console.log('parent Data: ', data); // Debugging line
            this.clientData = data;
            this.StaffId = this.clientData[0].Id;
            this.Annual=this.clientData[0].Annual_Leave__c;
            this.Sick=this.clientData[0].Sick_Leave__c;
            this.Parental=this.clientData[0].Parental_Leave__c;
            this.other=this.clientData[0].Bereavement_Leave__c;
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    }

   


    get selectedClassprofile(){
        return this.profileflag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassrewards(){
        return this.rewardsFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClasstraining(){
        return this.trainingFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassleave(){
        return this.leaveFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassreports(){
        return this.reportsFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    handleprofile(event) {
        this.profileflag=true;
        this.rewardsFlag = false;
        this.trainingFlag = false;
        this.leaveFlag=false;
        this.reportsFlag=false;
    }
    handleRewards(event) {
        this.profileflag=false;
        this.rewardsFlag = true;
        this.trainingFlag = false;
        this.leaveFlag=false;
        this.reportsFlag=false;
    }
    handleTraining(event){
        this.profileflag=false;
        this.rewardsFlag = false;
        this.trainingFlag = true;
        this.leaveFlag=false;
        this.reportsFlag=false;
    }
    handleLeave(event){
        this.profileflag=false;
        this.rewardsFlag = false;
        this.trainingFlag = false;
        this.leaveFlag=true;
        this.reportsFlag=false;

    }
    handleReports(event){
        this.profileflag=false;
        this.rewardsFlag = false;
        this.trainingFlag = false;
        this.leaveFlag=false;
        this.reportsFlag=true;

    }
    
}