import { LightningElement,track,api,wire } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';
const fields = [UsrRoleName,UserOrgName];
import { CurrentPageReference } from "lightning/navigation";

export default class TesseractInvoice extends LightningElement {
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

   
   
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserOrgName]}) 
    currentUserInfo({error, data}) {
        console.log('userid',Id);
        console.log('data',JSON.stringify(data));
        console.log('error',JSON.stringify(error));        

        if (data) {
         //   this.currentUserRole =data.fields.UserRole.value.fields.Name.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            //alert("Org UserRole: " + this.currentUserRole);
            this.isOrgName = data.fields.Organization_Name__c.value;
            //alert("Org isOrgName: " + this.isOrgName); 

            //24 Care Australia Admin
            if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
                if (this.isOrgName == 'Pinnacle IT Services Pty LTD')
                { 
                    this.isExec=true;
                }
                if (this.isOrgName == '24 Care') //24 Care
                {                    
                 this.isExec=true;
                }
                if (this.isOrgName == 'Ace Info Systems Pty LTD')
                {
                    this.isExec=false;
                }
                if (this.isOrgName == 'SSquare Recruitment and Consulting')
                {
                    this.isExec=false;
                }
                if (this.isOrgName == 'Age Grace Innovation PVT LTD')
                {
                    this.isExec=true;
                }      
                //this.isOtherAccount=true;
            } 
        }
     else if (error) {
        this.error = error ;
    }
    } 

    @wire(CurrentPageReference)
    currentPageRef

    @api
    get propertyValue() {
        if(this.currentPageRef.state.c__propertyValue){
            return  this.currentPageRef.state.c__propertyValue
        }else{
            return 'Organisation';
        }
        
    }
    @api orgID;
    get orgID() {
        return this.currentPageRef.state.c__orgID;
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
        if(buttonName=='Facility'){
            this.isFacilityButton=true;
            this.isClientButton=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.isOrgButton=false;
        }
        else if(buttonName=='Organisation'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.isOrgButton=true;
        }
        else if(buttonName=='Clients'){
            this.isFacilityButton=false;
            this.isClientButton=true;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.isOrgButton=false;
        }
        else if(buttonName=='Staff'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=true;
            this.isManageSubscriptionButton=false;
            this.isOrgButton=false;
        }      
       
    }
    handleSearchValue(event){
        this.searchValue=event.detail;
        this.isFacilityButton=false;
        this.isClientButton=false;
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
        return this.isClientButton ? 'AdminClass2' : 'AdminClass1'; // you can use your custom class here.
  
    }
    get staffClass(){
        return this.isStaffButton ? 'AdminClass2' : 'AdminClass1'; // you can use your custom class here.
  
    }
    get accountClass(){
        return this.isManageSubscriptionButton ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    
}