import { LightningElement, track } from 'lwc';
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

    connectedCallback() {
        this.fetchUserAccessDetails();
    }

    fetchUserAccessDetails() {
        getstaffId({ userId: this.userId })
            .then(data => {
                console.log('Staff Data for Dashboard:', JSON.stringify(data));

                this.staffName = data.Name;
                this.userType = data.User_Type__c;

                switch (this.userType) {
                    case 'NDIS Org Admin':
                    case 'Roster Manager':
                        this.isNdisOrgVisible = true;
                        break;
                    case 'NDIS Staff':
                        this.isNdisStaff = true;
                        break;
                    case 'Payroll Admin':
                        this.isNdisPayrollAdmin = true;
                        break;
                    case 'HR Admin':
                        this.isNdisHrAdmin = true;
                        break;
                    case 'ICT Admin':
                        this.isIctAdmin = true;
                        break;
                    case 'ICT Staff':
                        this.isIctStaff = true;
                        break;
                    case 'NDIS Participants':
                        this.IsNdisParticipant = true;
                        break;
                    case 'Payroll Accountant for Multiple':
                    case 'Accountant for Organisation':
                        this.Ispayroll = true;
                        break;
                    default:
                        console.log('Unknown user type:', this.userType);
                }
            })
            .catch(error => {
                console.error('Error fetching staff data:', error);
            });
    }

    handleTaskEdit(event) {
        console.log('Task edit triggered');
        this.dispatchEvent(new CustomEvent('taskedit', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }

    handlechildevent(event) {
        console.log('Event from child:', JSON.stringify(event.detail));
        console.log('Event from grandchild:', event.detail.message);

        const bubbleEvent = new CustomEvent('childevent', {
            detail: event.detail,
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(bubbleEvent);
    }
}