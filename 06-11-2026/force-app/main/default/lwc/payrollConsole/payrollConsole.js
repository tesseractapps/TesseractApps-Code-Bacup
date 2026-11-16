import { LightningElement,track,wire,api } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import UserType from '@salesforce/schema/User.User_Type__c'; 
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import orgName from '@salesforce/schema/User.Organisation__c';
import updateUserOrg from '@salesforce/apex/OrgDetails.updateUserOrganisation';
import ORG_NAME_FIELD from '@salesforce/schema/User.Organization_Name__c'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUserOrg from '@salesforce/apex/OrgDetails.getUserOrg';
import { CurrentPageReference } from "lightning/navigation";

export default class PayrollConsole extends LightningElement {
  //Images to display side panel
  employee = My_Resource + '/myResource/images/expenses.svg';
  recruitment = My_Resource + '/myResource/images/Payroll_1.png';
  rewards = My_Resource + '/myResource/images/invoice.svg';
  training = My_Resource + '/myResource/images/reports.svg';
  paysetting = My_Resource + '/myResource/images/PayrollSettings.svg';

  // flag track fields
  @track expanseFlag=false; 
  @track payrun=false;
  @track ispayrollSettings=false;
  @track invoiceFlag=false;
  @track isReportsTab=false;
  @track device;

  @track organisationlabel;
  @track organisationOptions=[];
  @track orgName;

  get isDesktop() {
    //alert(FORM_FACTOR);
    this.device= FORM_FACTOR;
    return FORM_FACTOR === 'Large';
  }

  get isMobile() {
      //alert(FORM_FACTOR);
      return FORM_FACTOR === 'Small';
  }

  connectedCallback(){
    this.payrun=true;
    this.fetchUserDefaultOrg();
    console.log('Property Value:', this.propertyValue);
      if(this.propertyValue=='reporting'){
      this.handleReports();
    }  
  }

  @track error;
  @track currentUserRole;
  @track userTypeValue;
  @track orgNames;
  @track orgOptions=[];
  @track Accountantlogin = false;
  @track selectedOrg = '';
  @track orgOptions = [];
  @track organisationlabel = '';
  @track userId; 
  @track showSpinner=false;
  userId = USER_ID;

  @wire(CurrentPageReference)
    currentPageRef

  @api
    get propertyValue() {
        if(this.currentPageRef.state.c__propertyValue){
            return  this.currentPageRef.state.c__propertyValue
        }else{
            return 'staff';
        }
        
    }

  @wire(getRecord, {
    recordId: USER_ID,
    fields: [UsrRoleName,UserType,orgName,ORG_NAME_FIELD]
    }) wireuser({
        error,
        data
    }) {
    if (error) {
        this.error = error;
    } else if (data) {
        this.currentUserRole =data.fields.User_Role__c.value;
        this.userTypeValue=data.fields.User_Type__c.value;
        this.orgNames = data.fields.Organisation__c.value;        
        console.log('Org Name>>'+this.orgNames);
        if (this.orgNames) {
          this.orgOptions = this.orgNames.split(';').map((org, index) => {
              return { label: org, value: org }; // Label is the org name, value is the index
          });          
        }
         if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' );{            
            this.Accountantlogin=false;
            console.log('current userrole >> '+this.currentUserRole);
        }
        if(this.currentUserRole == 'Portal Account Partner Manager'){
            this.Accountantlogin=false;
            console.log('current userrole >> '+this.currentUserRole);
        }
        if(this.currentUserRole == 'Portal Account Partner User'){          
        } 
        if(this.userTypeValue == 'Payroll Accountant for Multiple'){
            this.Accountantlogin=true;
            console.log('current userTypeValue >> '+this.userTypeValue);
        } 
                 
    }
  }

  reloadPage() {
    // Redirect to the current page, effectively reloading it
    window.location.href = window.location.href;
  }

  // Fetch user's default organization
  fetchUserDefaultOrg() {
    getUserOrg({ userId: this.userId }).then(result => {
        this.selectedOrg = result; // Set the default organization
        console.log('Default Organization: ' + this.selectedOrg);
        this.organisationlabel = this.orgOptions.find(rec => rec.value == this.selectedOrg).label;
    })
    .catch(error => {
        console.error('Error fetching default organization:', error);
    });
  }

  handleOrgsChange(event) {
    this.selectedOrg = event.detail.value; // Capture the selected organization
    console.log('Selected Organization: ' + this.selectedOrg);

    this.organisationlabel = this.orgOptions.find(rec => rec.value == this.selectedOrg).label;
    console.log('Organisation label----->' + this.organisationlabel);

    this.updateOrgInBackend();
  }
 
  updateOrgInBackend() {    
    try {
     // this.showSpinner = true; 
      this.payrun=false;
        updateUserOrg({ userId: this.userId, orgName: this.selectedOrg }).then(() => {
         
            console.log('Organization updated successfully!');
            // Show success toast message
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Organization updated successfully!',
                variant: 'success'
            }));
            this.reloadPage();
           // this.showSpinner = false;
            // Dispatch custom event with updated organization data
            const orgUpdatedEvent = new CustomEvent('orgupdate', {
              detail: {
                  orgName: this.selectedOrg,
                  orgLabel: this.organisationlabel
                }
            });
            this.dispatchEvent(orgUpdatedEvent);
            this.payrun=true;
            this.expanseFlag = false;
            this.ispayrollSettings = false;
            this.invoiceFlag = false;
            this.isReportsTab = false;
            this.isReportsTab=false;
            this.ispayrollSettings=false;;
            this.expanseFlag=false;
            this.invoiceFlag=false;

        }).catch(error => {
            throw error; // Pass the error to the catch block
        });
    } catch (error) {
      this.showSpinner = false; 
      console.error('Error during organization update:', error); 
      // Show error toast message
      this.dispatchEvent(new ShowToastEvent({
          title: 'Error',
          message: 'Error updating organization: ' + (error.body ? error.body.message : 'Unknown error'),
          variant: 'error'
      }));
    }
  }

  handleExpenses(){
    this.isReportsTab=false;
    this.expanseFlag=true;
    this.payrun=false;
    this.ispayrollSettings=false;
    this.invoiceFlag=false;
    if(this.device=='Large'){
      this.template.querySelector('c-payroll-expenses').reload();
    } 
  }

  handlePayRun(){
    this.isReportsTab=false;
    this.payrun=true;
    this.expanseFlag=false;
    this.ispayrollSettings=false;
    this.invoiceFlag=false;
    if(this.device=='Large'){
      this.template.querySelector('c-pay-run').reload(); 
    }
  }

  handlePayrollSettings(){
    this.isReportsTab=false;
    this.ispayrollSettings=true;
    this.payrun=false;
    this.expanseFlag=false;
    this.invoiceFlag=false;
    if(this.device=='Large'){
      this.template.querySelector('c-payrun-setting').reload(); 
    }
  }
  handleInvoice(){
    this.isReportsTab=false;
    this.invoiceFlag=true;
    this.ispayrollSettings=false;
    this.payrun=false;
    this.expanseFlag=false;
    if(this.device=='Large'){
      this.template.querySelector('c-payroll-invoice ').reload();
    } 
  }

  handleReports(){
    this.isReportsTab=true;
    this.invoiceFlag=false;;
    this.ispayrollSettings=false;
    this.payrun=false;
    this.expanseFlag=false;
  }

  //Maheswari
  get PayRunClass(){
    return this.payrun ? 'payrunClass2' : ' PayRunClass';  // you can use your custom class here.
  }
  get expenseClass(){
      return this.expanseFlag ? ' payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  }
  get invoiceClass(){       
      return  this.invoiceFlag ?  'payrunClass2' : 'PayRunClass';  // you can use your custom class here.
  }
  get reportingClass(){
      return this.isReportsTab ? 'payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  }
  get payrunsettingClass(){
    return this.ispayrollSettings ? 'payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  }
  
  handleOragnisationChange(event){       
    this.organisationlabel =  this.organisationOptions.find(rec=>rec.value==event.detail.value).label;
    console.log('Organisation label----->'+this.organisationlabel);
    this.orgName = event.detail.value;
    console.log('Org Names '+this.orgName);
  }

}