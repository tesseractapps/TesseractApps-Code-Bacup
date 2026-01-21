import { LightningElement, track,wire } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { NavigationMixin } from 'lightning/navigation'; 
import searchIssues from '@salesforce/apex/issueRegisterSearch.searchIssues';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getIssues from '@salesforce/apex/issueRegisterSearch.getIssues';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import tesseractCRM from '@salesforce/schema/User.Tesseract_CRM__c';

import FOOTER_MESSAGE_CHANNEL from '@salesforce/messageChannel/FooterMessageChannel__c';
import { createMessageContext, releaseMessageContext, publish } from 'lightning/messageService';

export default class FooterLwc extends NavigationMixin(LightningElement) { 
    @track isOpenModal = false;  
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }
    @track contactUsFlag = false;
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track usererror;
    @track isCrm=false;
    @track subUserType;

    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName,UserType,tesseractCRM]}) 
     userDetails({error, data}) {
         if (data) {
             this.currentUser = data.fields.Name.value; 
             this.currentUserEmail=data.fields.Email.value;
             this.currentUserRole =data.fields.User_Role__c.value;
             this.subUserType =data.fields.Tesseract_CRM__c.value;

             let tesseractCRM = data.fields.Tesseract_CRM__c.value.split(';');
            console.log('type of user:', tesseractCRM);
             // console.log('role==>'+this.currentUserRole);
             // console.log('current logged in user==>'+this.currentUser) ; 
             // console.log('current logged in email==>'+ this.currentUserEmail) ;
             console.log('current logged user type in footer==>'+ this.subUserType);
             if(tesseractCRM.includes('TCRM Support Staff')|| tesseractCRM.includes('TCRM Sales Admin')|| tesseractCRM.includes('TCRM Sales Staff')|| tesseractCRM.includes('TCRM Invoices and Billing Staff')|| tesseractCRM.includes('TCRM Finance')){
               
                this.isCrm=true;
            }
         } else if (error) {
             this.usererror = error ;
         }
     }
  

    // navigateToContactUsPage(event){
    //     event.preventDefault();
    //      this[NavigationMixin.Navigate]({
    //         type: 'comm__namedPage',
    //         attributes: {
    //             //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
    //             pageName: 'contactus'
    //         },
    //     }); 
        
    // } 

    
    disconnectedCallback() {
        releaseMessageContext(this.context);
    }

    // navigateToContactUsPage(event) {
    //     event.preventDefault();
    
    //     // Show a toast instead of navigating
    //     this.dispatchEvent(
    //         new ShowToastEvent({
    //             title: 'Coming Soon!',
    //             message: 'The Contact Us page is currently under development.',
    //             variant: 'info',
    //             mode: 'dismissable'
    //         })
    //     );
    // }
    

    navigateToTesseractCRM(event){
        event.preventDefault();
         this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'tesseractcrm'
            },
        }); 
        
    } 

    context = createMessageContext();

    navigateToContactUsPage(event) {
        event.preventDefault();

        publish(this.context, FOOTER_MESSAGE_CHANNEL, {
            action: 'openContactPanel'
        });
    }


    navigateToReleasePage() {
    console.log('📤 Publishing message: openReleaseNotes');
    publish(this.context, FOOTER_MESSAGE_CHANNEL, {
        action: 'openReleaseNotes'
    });
}


    // navigateToReleasePage(event){
    //     this.isOpenModal = true;
    // }

    hideModalBox(){
        this.isOpenModal=false;
        this.privacyOpen = false;
        this.termsFlag = false;
    }
 
    @track privacyOpen= false;
    @track termsFlag = false;
    // navigateToParivacyPage(){
    //     this.privacyOpen =true;
    // }

       navigateToParivacyPage() {
    console.log('📤 Publishing message: openPrivacy');
    publish(this.context, FOOTER_MESSAGE_CHANNEL, {
        action: 'openPrivacy'
    });
}
    // navigateToTeamsPage(){
    //     this.termsFlag= true;
    // }

         navigateToTeamsPage() {
    console.log('📤 Publishing message: openTerms');
    publish(this.context, FOOTER_MESSAGE_CHANNEL, {
        action: 'openTerms'
    });
}
}