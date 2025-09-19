import { LightningElement, wire,track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import userId from '@salesforce/user/Id';
import My_Resource from "@salesforce/resourceUrl/myResource";
import getCaseCounts from '@salesforce/apex/IncidentRegisterController.getCaseCounts';

export default class IncidentRegisterchart extends NavigationMixin(LightningElement) {

    Issue = My_Resource + '/myResource/images/IncidentRegister.png';

    @track currentId = userId;
    openCaseCount = 0;
    inProgressCaseCount = 0;
    resolvedCaseCount = 0;

    @wire(getCaseCounts, { userId: '$currentId' }) // Send userId as a parameter
    wiredCaseCounts({ error, data }) {
        if (data) {
            this.openCaseCount = data.openCases;
            this.inProgressCaseCount = data.inProgressCases;
            this.resolvedCaseCount = data.resolvedCases;
        } else if (error) {
            console.error('Error fetching case counts:', error);
        }
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
}