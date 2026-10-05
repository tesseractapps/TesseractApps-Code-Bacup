import { LightningElement, track, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getAwards from '@salesforce/apex/AwardController.getAwards';


export default class StaffAwardsLwc extends LightningElement {
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track StaffId;
    @track Awards;
    @track clientData;
    @track currentUrl;
    @track isModalOpen=false;
    @track homeflag=true;
    recordId;
    wiredAwardsForStaff;
    wiredClient;


    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            console.log('current role ' +this.currentUserRole);
            console.log(' staffUser '+this.currentUserEmail);
        } else if (error) {
            this.usererror = error ;
        }
    }
    @wire(getStaffByEmail, { email: '$currentUserEmail' })
    wiredClient(result) {
        this.wiredClientResult = result;
        //console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
           // console.log('Data: ', data); // Debugging line
            this.clientData = data;
            this.StaffId = this.clientData[0].Id;
            console.log('staffid: ',this.StaffId ); 
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    }
    @wire(getAwards, { recordId: '$StaffId' })
    wiredAwardsForStaff(result) {
        this.wiredAwardResult = result;
       // console.log('staff: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
            console.log('staff data: ', data); // Debugging line
            this.Awards = data.map(Award => {
                return {
                    ...Award,
                   Todate: Award.Date__c ? new Date(Award.Date__c).toLocaleDateString('en-GB') : '',
                    fullName: `${Award.Staff__r?.Display_Nickname__c ?? 'N/A'}`
                };
            });
            console.log('staff data......>: '+JSON.stringify(this.Awards));                     
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    } 

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.staffuser=false;
        this.homeflag=false;
    }
    closepdf(event){
        this.isModalOpen = false;
        this.homeflag=true;
    }
    
}