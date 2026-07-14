import { LightningElement,track,api,wire} from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { NavigationMixin } from 'lightning/navigation';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import { CurrentPageReference } from "lightning/navigation";

export default class AttendenceLwc extends NavigationMixin(LightningElement) {
    employee = My_Resource + '/myResource/images/TimeSheets.png';
    roster = My_Resource + '/myResource/images/MyRoster.png';
    admin = My_Resource+'/myResource/images/RosterAdmin.png';
    submissionImage=My_Resource+'/myResource/images/Submissions.png';

    @track attendence=false;
    @track addshfit=false;
    @track shiftaccept=false;
    @track currentUserRole;
    @track currentAdminProfile;
    @track error;
    @track isExec=false;
    @track isManager=false;
    @track isStaff=false;
    @track submission=false;
    @track signButton=false;
    @track geolocation = false;

    @wire(getRecord, { recordId: Id, fields: [UsrRoleName ]}) 
    currentUserInfo({error, data}) {
        console.log('userid',Id);
        console.log('data',JSON.stringify(data));
        console.log('error',JSON.stringify(error));
        

        if (data) {
         //   this.currentUserRole =data.fields.UserRole.value.fields.Name.value;
         this.currentUserRole =data.fields.User_Role__c.value;
            if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' )
            {
                this.isExec=true;
                this.isManager=false;
                this.isStaff=false;
            }
            if(this.currentUserRole == 'Portal Account Partner Manager'){
                this.isExec=false;
                this.isManager=true;
                this.isStaff=false;
            }
            if(this.currentUserRole == 'Portal Account Partner User'){
                this.isExec=false;
                this.isManager=false;
                this.isStaff=true;                
            }

        this.currentAdminProfile = data.fields.Pro
            
           console.log('role>>', this.currentUserRole);
        } else if (error) {
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
            return 'addshift';
        }
        
    }
    connectedCallback() {   
        if(this.propertyValue=='Submissions'){
            this.navigateToSubmission();
        }else{
            if (this.isStaff==true)
                {
                    this.shiftaccept=true;
                }
                else
                {
                    this.addshfit=true;
                }
        }    
       
        console.log('Property Value:', this.propertyValue);
    }

    navigatetoAvailability(){
        this.addshfit=true;
        this.attendence=false;
        this.shiftaccept=false;
        this.submission=false;
        this.geolocation = false;
        console.log(this.addshfit);
    }
    navigateToAttendence(){
        this.attendence=true;
        this.addshfit=false;
        this.shiftaccept=false;
        this.submission=false;
        this.geolocation = false;
    }

    navigateToAccept(){
        this.attendence=false;
        this.addshfit=false;
        this.shiftaccept=true;
        this.submission=false;
        this.geolocation=false;
    }
    navigateToSubmission(){
        this.attendence=false;
        this.addshfit=false;
        this.shiftaccept=false;
        this.submission=true;
        this.signButton=true;
        this.geolocation=false;
    }
    navigateToGeolocation(){
        this.attendence=false;
        this.addshfit=false;
        this.shiftaccept=false;
        this.submission=false;
        this.geolocation=true;
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

    get selectedClass(){
        return this.addshfit ? ' slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get clientClass(){
        return this.attendence ? ' slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get shiftClass(){
        return this.shiftaccept ? ' slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get submissionClass(){
        return this.shiftaccept ? ' slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get geolocationClass(){
        return this.shiftaccept ? ' slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    
    //Maheswari
    get rosterClass(){
        return this.addshfit ? 'payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  
    }
    get myRosterClass(){
        return this.shiftaccept ? 'payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  
    }
    get managementClass(){       
        return  this.attendence ?  'payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  
    }
    get submissionClass(){
        return this.submission ? 'payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  
    }
    get geolocationClass(){
        return this.geolocation ? 'payrunClass2' : 'PayRunClass'; // you can use your custom class here.
  
    }
    
}