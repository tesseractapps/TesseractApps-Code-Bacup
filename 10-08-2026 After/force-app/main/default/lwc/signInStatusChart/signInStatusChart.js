/* import { LightningElement, wire, track, api } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import userId from '@salesforce/user/Id';
import getSignInCounts from '@salesforce/apex/SignInStatusController.getSignInCounts';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

export default class SignInStatusChart extends LightningElement {
    SingIn = My_Resource + '/myResource/images/Signin_Payroll.png';

    completedCount = 0;
    inProgressCount = 0;
    acceptedCount = 0;
    @track Id = userId;

    @api facilityId;

    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method SignInStatusChart>>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;
        console.log('facilityId in Refresh Method SignInStatusChart >>', this.facilityId);
    }

    @wire(MessageContext)
    messageContext;

    @wire(getSignInCounts, { userId: '$Id', facilityId: '$facilityId' })
    wiredSignInCounts({ error, data }) {
        if (data) {
            console.log('SignInStatusChart data====>' + JSON.stringify(data));
            this.completedCount = data.completedCount || 0;
            this.inProgressCount = data.inprogressCount || 0;
            this.acceptedCount = data.acceptedCount || 0;
        } else if (error) {
            console.error('Error fetching sign-in counts:', error);
        }
    }


    grandchildevent(event){
        event.preventDefault();
        const message = event.currentTarget.dataset.name;
        console.log(message);

        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: message },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    }

    handleRedirectClick(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name || 'Sign In';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }
} */

import { LightningElement, api, wire, track } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import userId from '@salesforce/user/Id';
import getSignInCounts from '@salesforce/apex/SignInStatusController.getSignInCounts';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

export default class SignInStatusChart extends LightningElement {
    SingIn = My_Resource + '/myResource/images/Signin_Payroll.png';

    completedCount = 0;
    inProgressCount = 0;
    acceptedCount = 0;

    @api facilityId;

    @wire(MessageContext)
    messageContext;

    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method SignInStatusChart>>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;

        this.fetchSignInCounts(); // always call server imperatively
    }

    @api refresh() {
        // Generic refresh method to call Apex
        this.fetchSignInCounts();
    }

    @track Id = userId;
    // @track messageContext;

    connectedCallback() {
        this.fetchSignInCounts(); // fetch data when component loads
    }

    async fetchSignInCounts() {
        try {
            const data = await getSignInCounts({ userId: this.Id, facilityId: this.facilityId });
            console.log('SignInStatusChart Data:', JSON.stringify(data));
            
            this.completedCount = data.completedCount || 0;
            this.inProgressCount = data.inprogressCount || 0;
            this.acceptedCount = data.acceptedCount || 0;
        } catch (error) {
            console.error('Error fetching sign-in counts:', error);
        }
    }

    grandchildevent(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name;

        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: message },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    }

    handleRedirectClick(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name || 'Sign In';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }

    handleStatusClick(event) {
        const status = event.currentTarget.dataset.status;
        const label = event.currentTarget.dataset.label;

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: 'StaffStatusDetail',
            data: {
                statusKey: status,      // 'Completed' | 'InProgress' | 'Accepted'
                statusLabel: label,
                facilityId: this.facilityId
            }
        });
    }
}