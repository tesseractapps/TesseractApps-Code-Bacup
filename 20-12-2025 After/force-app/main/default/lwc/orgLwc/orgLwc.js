import { LightningElement,track,wire,api} from 'lwc';
import NAME_FIELD from '@salesforce/schema/Organisation__c.Name';
import ABN_FIELD from '@salesforce/schema/Organisation__c.ABN__c';
import ACN_FIELD from '@salesforce/schema/Organisation__c.ACN__c';
import NDIS_FIELD from '@salesforce/schema/Organisation__c.NDIS_Provider__c';
import CONTACT_FIELD from '@salesforce/schema/Organisation__c.Contact_No__c';
import EMAIL_FIELD from '@salesforce/schema/Organisation__c.Email__c';
import Add_FIELD from '@salesforce/schema/Organisation__c.Address__c';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import { NavigationMixin } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';
import Objects_Type from "@salesforce/apex/OrgDetails.orgName";
import Id from '@salesforce/user/Id';
import ProfileName from '@salesforce/schema/User.Profile.Name';
import { getRecord } from 'lightning/uiRecordApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
export default class OrgLwc extends NavigationMixin (LightningElement) {
    admin = My_Resource+'/myResource/images/admin.svg';
    @track Picklist_Value;
    @track objectApiName='Organisation__c';
    fields = [NAME_FIELD, ABN_FIELD, ACN_FIELD,NDIS_FIELD,CONTACT_FIELD,EMAIL_FIELD,Add_FIELD];
    @track l_All_Types;
    @track TypeOptions;
    @track orgRecord;
    userId = Id;
    userProfileName;
    @track editFlag=false;
    @wire(getRecord, { recordId: Id, fields: [ProfileName] })
    userDetails({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            if (data.fields.Profile.value != null) {
                this.userProfileName = data.fields.Profile.value.fields.Name.value;
            }

        }   
    }
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }
 
    @wire(Objects_Type, {})
    WiredObjects_Type({ error, data }) {
 
        if (data) {
            try {
                this.l_All_Types = data; 
                let options = [];
                 
                for (var key in data) {
                    // Here key will have index of list of records starting from 0,1,2,....
                    options.push({ label: data[key].Name, value: data[key].Id  });
 
                    // Here Name and Id are fields from sObject list.
                }
                this.TypeOptions = options;
                 
            } catch (error) {
                console.error('check error here', error);
            }
        } else if (error) {
            console.error('check error here', error);
        }
 
    }
    connectedCallback(){
        orgDetails().then(response=>{
            this.orgRecord=response;
            console.log('recordsnew>>>>>',JSON.stringify(response));
            this.Picklist_Value = response.Id; 
            console.log('Profilename>>>>>', this.userProfileName);
        //create event
        if(this.userProfileName=='System Administrator' || this.userProfileName=='ClientProfile' || this.userProfileName=='Channel Account User1'){
            this.editFlag=true;
        }
        const searchEvent = new CustomEvent("getsearchvalue",{
            detail : this.Picklist_Value
        });

        //Dispatches the event
        this.dispatchEvent(searchEvent);
        // Do Something.
        });
    }
 
    handleTypeChange(event){
        this.Picklist_Value = event.target.value; 
        
        //create event
        const searchEvent = new CustomEvent("getsearchvalue",{
            detail : this.Picklist_Value
        });

        //Dispatches the event
        this.dispatchEvent(searchEvent);
        // Do Something.
    }

    handleSubmit(event){
        //you can change values from here
        //const fields = event.detail.fields;
        //fields.Name = 'My Custom  Name'; // modify a field
        console.log('Account detail : ',event.detail.fields);
        console.log('Account name : ',event.detail.fields.Name);
    }

    handleEditOrg(){
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
                    attributes: {
                        recordId: this.Picklist_Value,
                        objectApiName: 'Organisation__c',
                        actionName: 'edit'
                    },
        });
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