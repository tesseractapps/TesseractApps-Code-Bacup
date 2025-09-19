import { LightningElement, api, track } from 'lwc';

export default class DynamicWidget extends LightningElement {
    @api type;
    @api widgetId;
    @track isLoading = true;
    @track hasError = false;
    @track errorMessage = '';

    // Widget type mappings
    widgetTypeMap = {
        'shift': 'Staff Status Chart',
        'signin': 'Sign In Status Chart',
        // 'invoice': 'Invoice Status Chart',
        'task': 'Task Management',
        'leave': 'Leave Management Chart',
        'participant': 'Participant Management',
        'incident': 'Incident Register Chart',
        'performance': 'Performance Management Chart',
        'hr': 'Human Resources Dashboard',
        'fund': 'Participants Fund Chart',
        'staff-status': 'Staff Status Chart (Alt)',
        'payroll': 'Payroll Management',
        'icttimesheet':'ICT Timesheet'

    };

    connectedCallback() {
        console.log('DynamicWidget connected, type:', this.type, 'widgetId:', this.widgetId);
        console.log('DynamicWidget type:', this.type);

        this.initializeWidget();
    }

    renderedCallback() {
        if (!this.isLoading && !this.hasError) {
            this.ensureChartVisibility();
        }
    }

    async initializeWidget() {
        try {
            this.isLoading = true;
            this.hasError = false;
            
            if (!this.type) {
                throw new Error('Widget type is required');
            }
            
            await new Promise(resolve => setTimeout(resolve, 150));
            await this.loadWidgetData();
            
        } catch (error) {
            console.error('Error initializing widget:', error);
            this.hasError = true;
            this.errorMessage = error.message || 'Failed to initialize widget';
        } finally {
            this.isLoading = false;
        }
    }

    async loadWidgetData() {
        switch (this.type) {
            case 'shift':
            case 'signin':
            case 'invoice':
            case 'leave':
            case 'incident':
            case 'performance':
            case 'fund':
            case 'staff-status':
                this.ensureChartContainer();
                break;
            case 'task':
            case 'participant':
            case 'hr':
                this.ensureManagementContainer();
                break;
            case 'payroll':
            case 'icttimesheet':
            default:
                console.warn('Unknown widget type:', this.type);
        }
    }

    ensureChartContainer() {
        setTimeout(() => {
            const chartContainer = this.template.querySelector('.chart-container');
            if (chartContainer) {
                chartContainer.style.width = '100%';
                chartContainer.style.height = '100%';
                chartContainer.style.display = 'flex';
                chartContainer.style.flexDirection = 'column';
                chartContainer.style.position = 'relative';
                chartContainer.style.overflow = 'hidden';
            }
            
            this.forceChartVisibility();
        }, 100);
    }

    ensureManagementContainer() {
        setTimeout(() => {
            const containers = this.template.querySelectorAll('.management-container, .task-container, .dashboard-container');
            containers.forEach(container => {
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.overflow = 'auto';
                container.style.position = 'relative';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
            });
        }, 100);
    }

    forceChartVisibility() {
        const chartComponents = this.template.querySelectorAll('[class*="chart-component"], c-shiftwith-staff-status-bar-chart, c-sign-in-status-chart, c-invoice-status-bar-chart, c-tesseract-apps-leave-management-chart, c-incident-registerchart, c-performance-management-chart, c-participants-funds-chart-lwc, c-staff-status-chart, c-payroll-chart, c-ict-tmesheet-chart-lwc');
        
        chartComponents.forEach(component => {
            if (component) {
                component.style.display = 'block';
                component.style.width = '100%';
                component.style.height = '100%';
                component.style.visibility = 'visible';
                component.style.opacity = '1';
                component.style.position = 'relative';
                
                if (typeof component.refreshChart === 'function') {
                    setTimeout(() => component.refreshChart(), 200);
                }
            }
        });
    }

    ensureChartVisibility() {
        setTimeout(() => {
            this.forceChartVisibility();
            
            this.dispatchEvent(new CustomEvent('widgetready', {
                detail: { 
                    type: this.type, 
                    widgetId: this.widgetId,
                    timestamp: Date.now() 
                },
                bubbles: true
            }));
        }, 300);
    }

    @api
    refreshChart() {
        console.log('Refreshing chart for widget type:', this.type);
        
        try {
            this.forceChartVisibility();
            
            const chartComponents = this.template.querySelectorAll('.chart-component');
            chartComponents.forEach(component => {
                if (component && typeof component.refreshChart === 'function') {
                    component.refreshChart();
                }
            });

            this.dispatchEvent(new CustomEvent('widgetrefresh', {
                detail: { 
                    type: this.type, 
                    widgetId: this.widgetId,
                    timestamp: Date.now() 
                },
                bubbles: true
            }));
        } catch (error) {
            console.error('Error refreshing widget:', error);
        }
    }

    // Computed properties for widget type checking
    get isShiftWidget() {
        return this.type === 'shift';
    }

    get isSignInWidget() {
        return this.type === 'signin';
    }

    get isInvoiceWidget() {
        return this.type === 'invoice';
    }

    get isTaskWidget() {
        return this.type === 'task';
    }

    get isLeaveWidget() {
        return this.type === 'leave';
    }

    get isParticipantWidget() {
        return this.type === 'participant';
    }

    get isIncidentWidget() {
        return this.type === 'incident';
    }

    get isPerformanceWidget() {
        return this.type === 'performance';
    }

    get isHRWidget() {
        return this.type === 'hr';
    }

    get isFundWidget() {
        return this.type === 'fund';
    }

    get isStaffStatusWidget() {
        return this.type === 'staff-status';
    }
    get isPayrollWidget(){
        return this.type === 'payroll';
    }
    get isIctTimesheetWidget(){
        return this.type === 'icttimesheet';
    }

    get isLeaveWidget() {
        return this.type === 'leave';
    }

    get isStaffDashboardWidget() {
        return this.type === 'staffDashboard';
    }

    get isParticipantScheduleWidget() {
        return this.type === 'participantSchedule';
    }


    get isDefaultWidget() {
    const knownTypes = [
        'shift', 'signin', 'invoice', 'task', 'leave', 
        'participant', 'incident', 'performance', 'hr', 
        'fund', 'staff-status', 'payroll', 'icttimesheet',
        'staffDashboard', 'participantSchedule'
    ];
        return !this.isLoading && !this.hasError && !knownTypes.includes(this.type);
    }


    get widgetTitle() {
        return this.widgetTypeMap[this.type] || this.type?.charAt(0).toUpperCase() + this.type?.slice(1) || 'Unknown Widget';
    }

    // Event handlers
    handleGrandChildEvent(event) {
        const grandChildEvent = new CustomEvent('grandchildevent', {
            detail: {
                ...event.detail,
                widgetType: this.type,
                widgetId: this.widgetId,
                timestamp: Date.now()
            },
            bubbles: true
        });
        this.dispatchEvent(grandChildEvent);
    }

    handleTaskEdit(event) {
        const taskEditEvent = new CustomEvent('taskedit', {
            detail: {
                ...event.detail,
                widgetType: this.type,
                widgetId: this.widgetId,
                timestamp: Date.now()
            },
            bubbles: true
        });
        this.dispatchEvent(taskEditEvent);
    }

    handleConfigureWidget() {
        const configEvent = new CustomEvent('widgetconfig', {
            detail: {
                type: this.type,
                widgetId: this.widgetId,
                action: 'configure',
                timestamp: Date.now()
            },
            bubbles: true
        });
        this.dispatchEvent(configEvent);
    }

    handleRetry() {
        this.initializeWidget();
    }

    // Utility methods
    getWidgetHeight() {
        const container = this.template.querySelector('.dynamic-widget-container');
        return container ? container.offsetHeight : 0;
    }

    getWidgetWidth() {
        const container = this.template.querySelector('.dynamic-widget-container');
        return container ? container.offsetWidth : 0;
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.refreshChart();
        }, 300);
    }

    disconnectedCallback() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
    }
}