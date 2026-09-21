import { LightningElement } from 'lwc';
export default class SupportCoordinationBudgetForecast extends LightningElement {
    summaryCards = [
        {
            label: 'Critical Risk',
            value: 0,
            valueClass: 'summary-value red',
            cardClass: 'summary-card red'
        },
        {
            label: 'High Risk',
            value: 0,
            valueClass: 'summary-value orange',
            cardClass: 'summary-card orange'
        },
        {
            label: 'Under-spending',
            value: 3,
            valueClass: 'summary-value blue',
            cardClass: 'summary-card blue'
        },
        {
            label: 'On Track',
            value: 3,
            valueClass: 'summary-value green',
            cardClass: 'summary-card green'
        }
    ];

    participants = [
        {
            id: 1,
            name: 'Sarah Mitchell',
            planDate: 'Plan: 01/03/2024 - 28/02/2025',
            planProgress: 184,
            budgetUsed: 65,
            monthlyBurn: 1539,
            risk: 'LOW',
            riskClass: 'risk low',
            planStyle: 'width:100%',
            budgetStyle: 'width:65%'
        },
        {
            id: 2,
            name: 'James Rodriguez',
            planDate: 'Plan: 15/07/2024 - 14/07/2025',
            planProgress: 146,
            budgetUsed: 82,
            monthlyBurn: 2013,
            risk: 'LOW',
            riskClass: 'risk low',
            planStyle: 'width:100%',
            budgetStyle: 'width:82%'
        },
        {
            id: 3,
            name: 'Emily Chen',
            planDate: 'Plan: 01/01/2024 - 31/12/2024',
            planProgress: 200,
            budgetUsed: 45,
            monthlyBurn: 973,
            risk: 'LOW',
            riskClass: 'risk low',
            planStyle: 'width:100%',
            budgetStyle: 'width:45%'
        }
    ];

    handleBack() {
        console.log('⬅ Back clicked – dispatching cancel event');

        // 🔥 Dispatch event to parent
        this.dispatchEvent(
            new CustomEvent('cancel', {
                bubbles: true,
                composed: true
            })
        );
    }

}