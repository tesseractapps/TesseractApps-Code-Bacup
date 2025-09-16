import { LightningElement, wire,track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import userId from '@salesforce/user/Id';
import My_Resource from "@salesforce/resourceUrl/myResource";
import getCaseCounts from '@salesforce/apex/IncidentRegisterController.getCaseCounts';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';
    

export default class IncidentRegisterchart extends NavigationMixin(LightningElement) {

    Issue = My_Resource + '/myResource/images/IncidentRegister.png';

    @track currentId = userId;
    openCaseCount = 0;
    inProgressCaseCount = 0;
    resolvedCaseCount = 0;
    @wire(MessageContext)
    messageContext;
    @wire(getCaseCounts, { userId: '$currentId' }) 
    // Send userId as a parameter
    wiredCaseCounts({ error, data }) {
        if (data) {
            this.openCaseCount = data.openCases;
            this.inProgressCaseCount = data.inProgressCases;
            this.resolvedCaseCount = data.resolvedCases;
        } else if (error) {
            console.error('Error fetching case counts:', error);
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


    handleOpenCasesClick() {
        this.navigateToCaseList('Open');
    }

    handleInProgressCasesClick() {
        this.navigateToCaseList('In-Progress');
    }

    handleResolvedCasesClick() {
        this.navigateToCaseList('Resolved');
    }
    handleRedirectClick(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name || 'Incident Register';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }
}