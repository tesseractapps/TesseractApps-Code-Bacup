import { LightningElement,track,api,wire } from 'lwc';
import My_Resource from '@salesforce/resourceUrl/myResource';
import FORM_FACTOR from '@salesforce/client/formFactor';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';
import TesseractCRM from '@salesforce/schema/User.Tesseract_CRM__c';
const fields = [UsrRoleName,UserOrgName];

export default class TesseractConsole extends LightningElement {
    @api searchValue;
    @api selectedName;
    @track facility;

    @track isFacilityButton=false;
    @track isClientButton=false;
    @track isStaffButton=false;
    @track isManageSubscriptionButton=false;
    @track currentUserRole; 
    @track isOrgName;
    @track isExec =false;
    @track isOrgButton=true;
    @track isMaintenance = false;
     @track istesseractSupport=false;
    @track istesseractSales=false;
    @track isInvoiceBilling=false;
    @track maintenance = false;
    @track isFinance=false; 

    facility = My_Resource+'/myResource/images/facility.svg';
    client = My_Resource+'/myResource/images/Participants.svg';
    employee = My_Resource+'/myResource/images/employee.svg';
    repository = My_Resource+'/myResource/images/repository.svg';
   // @track footerFlag=false;
   
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserOrgName,TesseractCRM]}) 
    currentUserInfo({error, data}) {
        console.log('userid',Id);
        console.log('data',JSON.stringify(data));
        console.log('error',JSON.stringify(error)); 

        if (data) {
            this.currentUserRole = data.fields.User_Role__c.value;
            this.isOrgName = data.fields.Organization_Name__c.value;
            
            let tesseractCRM = data.fields.Tesseract_CRM__c.value.split(';');
            console.log('type of user:', tesseractCRM);
        
            // Initialize all flags to false
            this.istesseractSupport = false;
            this.istesseractSales = false;
            this.maintenance = false;
            this.isInvoiceBilling = false;
            this.isFinance = false;
            this.isOrgButton = true;
        
            // Loop through the array and set flags based on conditions
            tesseractCRM.forEach(role => {
                if (role.includes('TCRM Support Staff')) {
                    this.istesseractSupport = true;
                    this.isOrgButton = true;
                }
                if (role.includes('TCRM Sales Admin')) {
                    if(this.istesseractSupport == true){
                        this.isOrgButton = false;
                        //this.istesseractSupport = true;
                        this.istesseractSales = true;
                        this.isFacilityButton = false;     
                    } else {
                        this.isOrgButton = false;
                        this.istesseractSales = true;
                        this.isFacilityButton = true; 
                    }
                }
                if (role.includes('TCRM Sales Staff')) {
                    this.isOrgButton = false;
                    this.maintenance = true;
                   // this.isMaintenance = true;
                }
                if (role.includes('TCRM Invoices and Billing Staff')) {
                    if(this.istesseractSales == true){
                        this.isOrgButton = false;
                        this.isInvoiceBilling = true;
                        this.isStaffButton = false;
                    } else {
                        this.isOrgButton = false;
                        this.isInvoiceBilling = true;
                        this.isStaffButton = true;
                    }
                    
                }
                if (role.includes('TCRM Finance')) {
                    this.isFinance = true;
                    this.isManageSubscriptionButton = false;
                }
            });
        
        } else if (error) {
            this.error = error;
        }
            
    } 
 
    connectedCallback() {
        console.log('Property Value:', this.propertyValue);
        this.searchValue=this.orgID // Logs the property value
        this.navigateToTabs(this.propertyValue);
    }
 
    navigateToFacilityPage(event){
        var buttonName = event.target.dataset.name;
        this.navigateToTabs(buttonName);
    }


    navigateToTabs(tabName){
        //var buttonName = event.target.dataset.name;
        var buttonName=tabName;
        console.log('btton name ',buttonName); 
        //alert(buttonName);
        if(buttonName=='Sales'){
            this.isFacilityButton=true;
            this.isMaintenance=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            //this.footerFlag=true;
            this.isOrgButton=false;
        }
        else if(buttonName=='TesseractSupport'){
            this.isFacilityButton=false;
            this.isMaintenance=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.isOrgButton=true;
           // this.footerFlag=true;
        }
        else if(buttonName=='Maintenance'){
            this.isFacilityButton=false;
            this.isMaintenance=true;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
           // this.footerFlag=true;
            this.isOrgButton=false;
        }
        else if(buttonName=='InvoicesandBilling'){
            this.isFacilityButton=false;
            this.isMaintenance=false;
            this.isStaffButton=true;
            this.isManageSubscriptionButton=false;
           // this.footerFlag=true; 
            this.isOrgButton=false;
        }
        else if(buttonName=='Finance'){
            this.isFacilityButton=false;
            this.isMaintenance=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=true; 
            //this.footerFlag=false;
            this.isOrgButton=false;
        }
       
    }
    handleSearchValue(event){
        this.searchValue=event.detail;
        this.isFacilityButton=false;
        this.isMaintenance=false;
        this.isStaffButton=false;
        this.isManageSubscriptionButton=false; 
        
    }

    get selectedClass(){
        return this.isFacilityButton ? 'AdminClass2' : ' AdminClass1'; // you can use your custom class here.  
    }
    
    get orgClass(){
        return this.isOrgButton ? 'AdminClass2' : ' AdminClass1'; // you can use your custom class here.  
    }

    get clientClass(){
        return this.isMaintenance ? 'AdminClass2' : 'AdminClass1'; // you can use your custom class here.  
    }
    get staffClass(){
        return this.isStaffButton ? 'AdminClass2' : 'AdminClass1'; // you can use your custom class here.  
    }
    get accountClass(){
        return this.isManageSubscriptionButton ? 'AdminClass2' : 'AdminClass1';
        //'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.  
    }
    
}