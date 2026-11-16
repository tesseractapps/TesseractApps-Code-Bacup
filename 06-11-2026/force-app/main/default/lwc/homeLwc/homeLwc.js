import { LightningElement,track,wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import Id from '@salesforce/user/Id';
import ProfileName from '@salesforce/schema/User.Profile.Name';
import { getRecord } from 'lightning/uiRecordApi';

export default class HomeLwc extends NavigationMixin(LightningElement) {
  @track editFlag=true;
  userId = Id;
  userProfileName;
 
    get isDesktop() {       
        return FORM_FACTOR === 'Large';
    }
    
    get isMobile() {       
        return FORM_FACTOR === 'Small';
    }
   
    @wire(getRecord, { recordId: Id, fields: [ProfileName] })
    userDetails({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            if (data.fields.Profile.value != null) {
                this.userProfileName = data.fields.Profile.value.fields.Name.value;
            }
            if( this.userProfileName=='Channel Account User' || this.userProfileName=='Channel Account User1'){
              this.editFlag=false;
            }

        }   
    }
   
    navigatetoHome() {
        this[NavigationMixin.Navigate]({
          type: 'standard__navItemPage',
          attributes: {
            //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
            apiName: 'Home'
          },
        });
    }   
    

}