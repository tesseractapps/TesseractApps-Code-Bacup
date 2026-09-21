import { LightningElement, api } from 'lwc';

export default class DashboardBuilderPropertyPanel extends LightningElement {
    @api widget;
    @api isOpen = false;

    get chartTypeOptions() {
        const type = this.widget?.type;
        if (type === 'fund') {
            return [
                { label: 'Donut', value: 'donut' },
                { label: 'Pie', value: 'pie' },
                { label: 'Line', value: 'line' }
            ];
        }
        if (['signin', 'staff-status', 'incident', 'leave', 'performance', 'rejectedShifts', 'participant', 'shift'].includes(type)) {
            return [
                { label: 'Column', value: 'column' },
                { label: 'Bar', value: 'bar' }
            ];
        }
        return [
            { label: 'Bar', value: 'bar' },
            { label: 'Column', value: 'column' },
            { label: 'Line', value: 'line' },
            { label: 'Area', value: 'area' },
            { label: 'Pie', value: 'pie' },
            { label: 'Donut', value: 'donut' },
            { label: 'Stacked Column', value: 'stacked-column' },
            { label: 'Stacked Bar', value: 'stacked-bar' },
            { label: 'Gauge', value: 'gauge' },
            { label: 'Progress Ring', value: 'progress-ring' },
            { label: 'Treemap', value: 'treemap' }
        ];
    }

    aggregationOptions = [
        { label: 'Count', value: 'COUNT' },
        { label: 'Sum', value: 'SUM' },
        { label: 'Average', value: 'AVG' },
        { label: 'Min', value: 'MIN' },
        { label: 'Max', value: 'MAX' }
    ];

    objectOptions = [
        { label: 'Roster Shift (ShiftwithStaff__c)', value: 'ShiftwithStaff__c' },
        { label: 'Staff Profile (Staff__c)', value: 'Staff__c' },
        { label: 'Client / Participant (Client__c)', value: 'Client__c' },
        { label: 'Incident Case (Case)', value: 'Case' },
        { label: 'Task (Task__c)', value: 'Task__c' }
    ];

    themeOptions = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Vibrant Glass', value: 'glass' }
    ];

    get panelClass() {
        return `property-panel ${this.isOpen ? 'open' : 'closed'}`;
    }

    get hasWidget() {
        return !!this.widget;
    }

    get properties() {
        return this.widget?.properties || {};
    }

    get isChart() {
        return this.widget?.type !== 'text';
    }

    handleFieldChange(event) {
        if (!this.widget) return;
        
        const field = event.target.dataset.field;
        const isTopLevel = event.target.dataset.topLevel === 'true';
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

        this.dispatchEvent(new CustomEvent('propertychange', {
            detail: {
                widgetId: this.widget.id,
                isTopLevel,
                field,
                value
            }
        }));
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}