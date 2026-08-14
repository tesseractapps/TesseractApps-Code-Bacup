import { LightningElement,track,api,wire } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';
import typeofUser from '@salesforce/schema/User.Type_of_User__c';
const fields = [UsrRoleName,UserOrgName];
import { CurrentPageReference } from "lightning/navigation";

export default class AdministrationLWCCommunity extends LightningElement {
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
    @track parentpagename='administration';
    @track isFormsButton=false;

    facility = My_Resource+'/myResource/images/facility.svg';
    client = My_Resource+'/myResource/images/Participants.svg';
    employee = My_Resource+'/myResource/images/employee.svg';
    repository = My_Resource+'/myResource/images/repository.svg';
    form = My_Resource+'/myResource/images/CustomisableFormsIcon.png';
    @track footerFlag=false;
   
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserOrgName,typeofUser]}) 
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
            let typeOfrole=data.fields.Type_of_User__c.value;
            console.log('user type '+typeOfrole);
                if(typeOfrole=='NDIS'){
                    this.isExec=true;
                }else{
                    this.isExec=false; 
                }


            //24 Care Australia Admin
           /*  if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
                if (this.isOrgName == 'Pinnacle IT Services Pty LTD')
                { 
                    this.isExec=true;
                }
                if (this.isOrgName == '24 Care Australia Pty Ltd') //24 Care
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
                if (this.isOrgName == 'Motherly Care Pty Ltd')
                {
                    this.isExec=true;
                }   
                if (this.isOrgName == 'FRAMILY VENTURES PTY LTD')
                {
                    this.isExec=true;
                }      
               
            }  */
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

   /*  set propertyValue(val) {
        this._navigateToTabs(val);
    } */
     connectedCallback() {
        console.log('Property Value:', this.propertyValue);
        this.searchValue=this.orgID // Logs the property value
        this.navigateToTabs(this.propertyValue);
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
            this.footerFlag=true;
            this.isOrgButton=false;
            this.isFormsButton=false;
        }
        else if(buttonName=='Organisation'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.isOrgButton=true;
            this.footerFlag=true;
            this.isFormsButton=false;
        }
        else if(buttonName=='Clients'){
            this.isFacilityButton=false;
            this.isClientButton=true;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false;
            this.footerFlag=true;
            this.isOrgButton=false;
            this.isFormsButton=false;
        }
        else if(buttonName=='Staff'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=true;
            this.isManageSubscriptionButton=false;
            this.footerFlag=true; 
            this.isOrgButton=false;
            this.isFormsButton=false;
        }
        else if(buttonName=='Accounts'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=true; 
            this.footerFlag=false;
            this.isOrgButton=false;
            this.isFormsButton=false;
        }
        else if(buttonName=='Form'){
            this.isFacilityButton=false;
            this.isClientButton=false;
            this.isStaffButton=false;
            this.isManageSubscriptionButton=false; 
            this.footerFlag=false;
            this.isOrgButton=false;
            this.isFormsButton=true;
        }
       
    }
    handleSearchValue(event){
        this.searchValue=event.detail;
        this.isFacilityButton=false;
        this.isClientButton=false;
        this.isStaffButton=false;
        this.isManageSubscriptionButton=false; 
        this.parentpagename='administration';
        
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
    get formClass(){
        return this.isFormsButton ? 'AdminClass2' : 'AdminClass1'; // you can use your custom class here.
  
    }
    
}