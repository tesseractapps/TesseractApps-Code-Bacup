import {  LightningElement, wire, track } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';
export default class HumanResourcesMenuDashboard extends LightningElement {
@wire(MessageContext)
    messageContext;
    HR = My_Resource+'/myResource/images/HR.svg';
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
        const message = event.currentTarget.dataset.name || 'Human Resources';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }

}