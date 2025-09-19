import { LightningElement, track, wire } from 'lwc';
import CURRENT_USER_ID from '@salesforce/user/Id';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId1';
export default class TesseractAppsDashboardHomePageLwc extends LightningElement {

    userId = CURRENT_USER_ID;

    @track isTemplateVisible = false;
    @track isNdisOrgVisible = false;
    @track isNdisStaff = false;
    @track isNdisPayrollAdmin = false;
    @track isNdisHrAdmin = false;
    @track isIctAdmin = false;
    @track isIctStaff = false;
    @track IsNdisParticipant = false;
    @track Ispayroll = false;

    staffName;
    userType;

    handleTaskEdit(event) {
    
        this.dispatchEvent(new CustomEvent('taskedit', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }

    handlechildevent(event) {
        console.log('Event from child: ' + JSON.stringify(event.detail));
        console.log('Event from grandchild:', event.detail.message);

    // Bubble to Parent
    const bubbleEvent = new CustomEvent('childevent', {
        detail: event.detail,
        bubbles: true,
        composed: true
    });
    this.dispatchEvent(bubbleEvent);
    
    }

    @wire(getstaffId, { userId: '$userId' })
wiredUserAccessDetails({ error, data }) {
    console.log('Wire method executed'); // Ensure the wire is called

    if (data) {
        console.log('Staff Data:', JSON.stringify(data)); // Log full response
        this.staffName = data.Name;  
        this.userType = data.User_Type__c;

        if (
            this.userType == 'NDIS Org Admin' || this.userType == 'Roster Manager'
        ){
            this.isNdisOrgVisible = true;
        }

        if (
            this.userType == 'NDIS Staff'
        ){
            this.isNdisStaff = true;
        }

        if (
            this.userType == 'Payroll Admin'
        ){
            this.isNdisPayrollAdmin = true;
        }

        if (
            this.userType == 'HR Admin'
        ){
            this.isNdisHrAdmin = true;
        }

        if (
            this.userType == 'ICT Admin'
        ){
            this.isIctAdmin = true;
        }

        if (
            this.userType == 'ICT Staff'
        ){
            this.isIctStaff = true;
        }

        if (
            this.userType == 'NDIS Participants'
        ){
            this.IsNdisParticipant = true;
        }

        if (
            this.userType == 'Payroll Accountant for Multiple' || this.userType == 'Accountant for Organisation'
        ){
            this.Ispayroll = true;
        }
    }
}
}