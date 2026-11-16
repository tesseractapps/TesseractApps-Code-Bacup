import { LightningElement,track,api } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class AdministrationLWC extends LightningElement {
    @api searchValue;
    @api selectedName;
    @track facility;

    @track isFacilityButton=true;
    @track isClientButton=false;
    @track isStaffButton=false;
    @track isManageSubscriptionButton=false;
    facility = My_Resource+'/myResource/images/facility.svg';
    client = My_Resource+'/myResource/images/Participants.svg';
    employee = My_Resource+'/myResource/images/employee.svg';
    repository = My_Resource+'/myResource/images/repository.svg';
    @track footerFlag=false;
   
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }
    navigateToFacilityPage(event){
        var buttonName = event.target.dataset.name;
        //alert(buttonName);
        if(buttonName=='Facility'){
            this.isFacilityButton=true;
            this.isClientButton=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.footerFlag=true;
        }
        else if(buttonName=='Clients'){
            this.isFacilityButton=false;
            this.isClientButton=true;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.footerFlag=true;
        }
        else if(buttonName=='Staff'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=true;
            this.isManageSubscriptionButton=false;
            this.footerFlag=true; 
        }
        else if(buttonName=='Accounts'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=true; 
            this.footerFlag=false;
        }
       
    }
    handleSearchValue(event){
        this.searchValue=event.detail;
        this.isFacilityButton=true;
        this.isClientButton=false;
        this.isStaffButton=false;
        this.isManageSubscriptionButton=false; 
        
    }

    get selectedClass(){
        return this.isFacilityButton ? ' slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }

    get clientClass(){
        return this.isClientButton ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get staffClass(){
        return this.isStaffButton ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get accountClass(){
        return this.isManageSubscriptionButton ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    
}