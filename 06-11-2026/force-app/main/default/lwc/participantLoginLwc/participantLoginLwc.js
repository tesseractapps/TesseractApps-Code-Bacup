import { LightningElement,api,track, wire } from 'lwc';
import Id from '@salesforce/user/Id';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import userOrgName from '@salesforce/schema/User.Organization_Name__c';
import getClientById from '@salesforce/apex/ClientDataController.getClientByEmail';

export default class ParticipantLoginLwc extends LightningElement {
    @track clientId;
    @track clientData=[];
    @track clientEmail;
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole
    @track userOrgName
    wiredClientResult

    @wire(getClientById, { email:'$currentUserEmail' })
    wiredClient(result) {
      this.wiredClientResult = result;
        const { data, error } = result;
        if (data) {
            this.clientData = data;
            this.clientId = this.clientData[0].Id;
            console.log('Client Id >>' + this.clientId);
            console.log('Client data:', JSON.stringify(this.clientData));
          //  this.template.querySelector('c-details-lwc').recordId = this.clientId;
        } else if (error) {
            this.handleError(error);
        }
    }

    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName,userOrgName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            this.userOrgName=data.fields.Organization_Name__c.value;
            setTimeout(() => {
                refreshApex(this.wiredClientResult);                
            }, 4000);             
            console.log('Email==>'+this.currentUserEmail);
            console.log('current logged in user==>'+this.currentUser) ; 
            console.log('current logged in user orgname==>'+this.userOrgName) ; 
        } else if (error) {
            this.usererror = error ;
        }
    }
}