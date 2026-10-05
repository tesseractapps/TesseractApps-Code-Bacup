import { LightningElement, api, track, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

export default class DashboardBuilderGrid extends LightningElement {
    @api widgets = [];
    @api isEditMode = false;
    @api facilityId;
    @api dateRange = 'THIS_YEAR';

    @wire(MessageContext)
    messageContext;

    @track colWidth = 100;
    @track rowHeight = 100;
    gap = 16;

    // Active drag-and-drop state
    @track draggingWidgetId = null;
    @track dragLeft = 0;
    @track dragTop = 0;
    @track placeholderX = 0;
    @track placeholderY = 0;
    @track placeholderW = 2;
    @track placeholderH = 2;
    @track showPlaceholder = false;

    // In-place chart type changer popover
    @track activeSettingsWidgetId = null;

    // Internal trackers
    startPointerX = 0;
    startPointerY = 0;
    startLeftPx = 0;
    startTopPx = 0;
    containerRect;
    resizeObserver;
    measured = false;

    // Resizing tracker state
    resizingWidgetId = null;
    resizeMode = '';
    startW = 0;
    startH = 0;
    startWidthPx = 0;
    startHeightPx = 0;

    get gridStyle() {
        // Automatically compute vertical size based on highest widget
        let maxRow = 4;
        this.widgets.forEach(w => {
            const bottomRow = w.y + w.h;
            if (bottomRow > maxRow) maxRow = bottomRow;
        });
        if (this.showPlaceholder) {
            const bottomPlaceholder = this.placeholderY + this.placeholderH;
            if (bottomPlaceholder > maxRow) maxRow = bottomPlaceholder;
        }
        const totalHeight = maxRow * (this.rowHeight + this.gap) + 100;
        return `position: relative; width: 100%; min-height: ${totalHeight}px; --col-width: ${this.colWidth}px; --row-height: ${this.rowHeight}px; --gap: ${this.gap}px;`;
    }

    get placeholderStyle() {
        const left = (this.colWidth + this.gap) * this.placeholderX;
        const top = (this.rowHeight + this.gap) * this.placeholderY;
        const width = (this.colWidth + this.gap) * this.placeholderW - this.gap;
        const height = (this.rowHeight + this.gap) * this.placeholderH - this.gap;
        return `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; display: ${this.showPlaceholder ? 'block' : 'none'};`;
    }

    get styledWidgets() {
        return this.widgets.map(w => {
            const isDragging = this.draggingWidgetId === w.id;
            const width = (this.colWidth + this.gap) * w.w - this.gap;
            const height = (this.rowHeight + this.gap) * w.h - this.gap;

            let leftPx = (this.colWidth + this.gap) * w.x;
            let topPx = (this.rowHeight + this.gap) * w.y;

            let extraStyle = '';
            if (isDragging) {
                leftPx = this.dragLeft;
                topPx = this.dragTop;
                extraStyle = 'transition: none; z-index: 1000; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.15); opacity: 0.85; pointer-events: none;';
            } else if (this.activeSettingsWidgetId === w.id) {
                extraStyle = 'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 999;';
            } else {
                extraStyle = 'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);';
            }

            let title = w.title;
            if (w.type === 'task') {
                const todayStr = new Date().toLocaleDateString('en-GB');
                title = `Tasks: ${todayStr}`;
            }
            const isCustomComponent = ['task', 'hr', 'participantSchedule', 'staffDashboard'].includes(w.type);
            const isClickable = !this.isEditMode && w.type !== 'task';
            const titleClass = `widget-title-text ${isClickable ? "clickable-title" : ""}`;
            const headerClass = `widget-header ${this.isEditMode ? "drag-handle" : ""}`;
            const bodyClass = `widget-body-area ${['task', 'participantSchedule', 'staffDashboard'].includes(w.type) ? 'no-padding' : ''}`;

            const hasChartSettings = !isCustomComponent;
            const isSettingsOpen = this.activeSettingsWidgetId === w.id;
            const currentChartType = w.chartType || 'bar';
            
            let chartTypeOptions = [];
            if (hasChartSettings) {
                chartTypeOptions = [
                    { label: 'Column', value: 'column' },
                    { label: 'Bar', value: 'bar' },
                    { label: 'Donut', value: 'donut' },
                    { label: 'Pie', value: 'pie' },
                    { label: 'Area', value: 'area' }
                ];
            }

            const availableChartTypes = chartTypeOptions.map(opt => ({
                ...opt,
                isSelected: opt.value === currentChartType,
                itemClass: `popover-option-btn ${opt.value === currentChartType ? 'selected' : ''}`
            }));

            return {
                ...w,
                title,
                titleClass,
                headerClass,
                bodyClass,
                hasChartSettings,
                isSettingsOpen,
                availableChartTypes,
                style: `position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${width}px; height: ${height}px; ${extraStyle}`,
                isDragging
            };
        });
    }

    connectedCallback() {
        this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
        window.addEventListener('click', this.boundHandleOutsideClick);
    }

    renderedCallback() {
        if (!this.measured) {
            this.calculateColWidth();
            this.setupResizeObserver();
            this.measured = true;
        }
    }

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        window.removeEventListener('click', this.boundHandleOutsideClick);
    }

    handleOutsideClick() {
        if (this.activeSettingsWidgetId) {
            this.activeSettingsWidgetId = null;
        }
    }

    handleSettingsWrapperClick(event) {
        event.stopPropagation();
    }

    setupResizeObserver() {
        const container = this.template.querySelector('.grid-container');
        if (container && window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.calculateColWidth();
            });
            this.resizeObserver.observe(container);
        }
    }

    calculateColWidth() {
        const container = this.template.querySelector('.grid-container');
        if (container) {
            const width = container.getBoundingClientRect().width;
            // width = 12 * colWidth + 11 * gap
            const availableForCols = width - (11 * this.gap);
            this.colWidth = Math.max(40, availableForCols / 12);
            // Default row height matches column width for square layout aspect
            this.rowHeight = this.colWidth;
        }
    }

    // Drag-and-drop Handlers
    handleDragStart(event) {
        if (!this.isEditMode) return;
        
        // Only drag from widget header (or drag-handle)
        const header = event.target.closest('.widget-header');
        if (!header) return;

        // // Ignore if clicking on buttons/inputs in header
        // if (event.target.closest('button') || event.target.closest('lightning-icon') || event.target.closest('select') || event.target.closest('input')) {
        //     return;
        // }

        // Ignore if clicking on buttons/inputs in header or dropdown menus
        if (event.target.closest('button') || event.target.closest('lightning-icon') || event.target.closest('select') || event.target.closest('input') || event.target.closest('.signin-dropdown-container') || event.target.closest('.participant-dropdown-container') || event.target.closest('.shift-dropdown-container') || event.target.closest('.custom-date-popover')) {
            return;
        }        

        const card = event.currentTarget;
        const widgetId = card.dataset.id;
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        this.draggingWidgetId = widgetId;
        this.startPointerX = event.clientX;
        this.startPointerY = event.clientY;

        const container = this.template.querySelector('.grid-container');
        this.containerRect = container.getBoundingClientRect();

        this.startLeftPx = (this.colWidth + this.gap) * widget.x;
        this.startTopPx = (this.rowHeight + this.gap) * widget.y;

        this.dragLeft = this.startLeftPx;
        this.dragTop = this.startTopPx;

        this.placeholderX = widget.x;
        this.placeholderY = widget.y;
        this.placeholderW = widget.w;
        this.placeholderH = widget.h;
        this.showPlaceholder = true;

        card.setPointerCapture(event.pointerId);
    }

    handleDragMove(event) {
        if (!this.draggingWidgetId) return;

        const deltaX = event.clientX - this.startPointerX;
        const deltaY = event.clientY - this.startPointerY;

        this.dragLeft = this.startLeftPx + deltaX;
        this.dragTop = this.startTopPx + deltaY;

        // Calculate candidate grid position
        let targetCol = Math.max(0, Math.min(12 - this.placeholderW, Math.round(this.dragLeft / (this.colWidth + this.gap))));
        
        // Auto-align to standard column boundaries (0, 4, 8) to prevent awkward empty slices
        if (this.placeholderW === 4) {
            targetCol = Math.round(targetCol / 4) * 4;
        } else if (this.placeholderW === 8) {
            targetCol = Math.round(targetCol / 4) * 4;
            if (targetCol > 4) targetCol = 4;
        } else if (this.placeholderW === 6) {
            targetCol = Math.round(targetCol / 6) * 6;
        } else if (this.placeholderW >= 12) {
            targetCol = 0;
        }
        targetCol = Math.max(0, Math.min(12 - this.placeholderW, targetCol));

        const targetRow = Math.max(0, Math.round(this.dragTop / (this.rowHeight + this.gap)));

        if (targetCol !== this.placeholderX || targetRow !== this.placeholderY) {
            this.placeholderX = targetCol;
            this.placeholderY = targetRow;
        }
    }

    handleDragEnd(event) {
        if (!this.draggingWidgetId) return;

        const widgetId = this.draggingWidgetId;
        const finalX = this.placeholderX;
        const finalY = this.placeholderY;

        this.draggingWidgetId = null;
        this.showPlaceholder = false;

        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (e) {
            // Ignore if pointer capture already lost
        }

        // Notify parent of layout shift
        this.dispatchEvent(new CustomEvent('layoutchange', {
            detail: {
                widgetId,
                x: finalX,
                y: finalY,
                w: this.placeholderW,
                h: this.placeholderH
            }
        }));
    }

    // Resizing Handlers
    handleResizeStart(event) {
        event.stopPropagation();
        event.preventDefault();

        const handle = event.currentTarget;
        this.resizingWidgetId = handle.dataset.widgetId;
        this.resizeMode = handle.dataset.mode; // 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'corner'

        const widget = this.widgets.find(w => w.id === this.resizingWidgetId);
        if (!widget) return;

        this.startPointerX = event.clientX;
        this.startPointerY = event.clientY;
        this.startX = widget.x;
        this.startY = widget.y;
        this.startW = widget.w;
        this.startH = widget.h;

        this.placeholderX = widget.x;
        this.placeholderY = widget.y;
        this.placeholderW = widget.w;
        this.placeholderH = widget.h;
        this.showPlaceholder = true;

        handle.setPointerCapture(event.pointerId);
    }

    handleResizeMove(event) {
        if (!this.resizingWidgetId) return;

        const deltaX = event.clientX - this.startPointerX;
        const deltaY = event.clientY - this.startPointerY;

        const mode = this.resizeMode;

        // Horizontal: Left edge / corners
        if (mode === 'left' || mode === 'top-left' || mode === 'bottom-left') {
            const addedCols = Math.round(deltaX / (this.colWidth + this.gap));
            const newX = Math.max(0, Math.min(this.startX + this.startW - 1, this.startX + addedCols));
            const newW = this.startW - (newX - this.startX);
            this.placeholderX = newX;
            this.placeholderW = newW;
        } else if (mode === 'right' || mode === 'top-right' || mode === 'corner') {
            const addedCols = Math.round(deltaX / (this.colWidth + this.gap));
            const newW = Math.max(1, Math.min(12 - this.startX, this.startW + addedCols));
            this.placeholderW = newW;
        }

        // Vertical: Top edge / corners
        if (mode === 'top' || mode === 'top-left' || mode === 'top-right') {
            const addedRows = Math.round(deltaY / (this.rowHeight + this.gap));
            const newY = Math.max(0, Math.min(this.startY + this.startH - 1, this.startY + addedRows));
            const newH = this.startH - (newY - this.startY);
            this.placeholderY = newY;
            this.placeholderH = newH;
        } else if (mode === 'bottom' || mode === 'bottom-left' || mode === 'corner') {
            const addedRows = Math.round(deltaY / (this.rowHeight + this.gap));
            const newH = Math.max(1, this.startH + addedRows);
            this.placeholderH = newH;
        }
    }

    handleResizeEnd(event) {
        if (!this.resizingWidgetId) return;

        const widgetId = this.resizingWidgetId;
        const finalX = this.placeholderX;
        const finalY = this.placeholderY;
        const finalW = this.placeholderW;
        const finalH = this.placeholderH;

        this.resizingWidgetId = null;
        this.resizeMode = '';
        this.showPlaceholder = false;

        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (e) {}

        this.dispatchEvent(new CustomEvent('layoutchange', {
            detail: {
                widgetId,
                x: finalX,
                y: finalY,
                w: finalW,
                h: finalH
            }
        }));
    }

    // Builder Quick Actions
    handleDeleteWidget(event) {
        event.stopPropagation();
        const widgetId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('deletewidget', {
            detail: { widgetId }
        }));
    }

    // Widget settings click selector
    handleTitleClick(event) {
        if (this.isEditMode) return;
        event.stopPropagation();
        const widgetType = event.currentTarget.dataset.type;
        const widgetId = event.currentTarget.dataset.id;
        console.log('Title clicked in grid for widget type:', widgetType, 'widgetId:', widgetId);

        // Ignore click on Tasks widget
        if (widgetType === 'task') {
            return;
        }

        if (widgetType === 'fund') {
            const widgetEl = this.template.querySelector(`c-dashboard-builder-widget[widget-id="${widgetId}"]`) ||
                             this.template.querySelector(`c-dashboard-builder-widget[data-id="${widgetId}"]`);
            let recordId = widgetEl ? widgetEl.selectedParticipantId : null;
            let participantUid = widgetEl ? widgetEl.selectedParticipantUid : null;
            if (!participantUid) {
                participantUid = localStorage.getItem('defaultFundsTrackerParticipantUid');
            }
            if (!recordId) {
                recordId = localStorage.getItem('defaultFundsTrackerParticipantId');
            }

            console.log('[Funds Tracker Click] Navigating with recordId:', recordId, 'participantUid:', participantUid);

            if (recordId) {
                localStorage.setItem('activeClientTab', 'fundtranfer');
                localStorage.setItem('selectedParticipantId', recordId);
            }

            const targetUid = participantUid || recordId;
            const url = targetUid ? `/s/#/participants/${targetUid}/funds-tracker` : `/s/#/participants`;
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        if (widgetType === 'participant') {
            const url = '/s/#/participants';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        const urlMap = {
            'staff-status': '/s/#/admin/staff',
            'leave': '/s/#/human-resources/leave-management',
            'hr': '/s/#/human-resources',
            'incident': '/s/#/incident-register',
            'performance': '/s/#/human-resources/performance-management',
            'shift': '/s/#/roster-manager',
            'signin': '/s/#/signin',
            'rejectedShifts': '/s/#/roster-manager/rejected-shifts/calendar',
            'payroll': '/s/#/payroll',
            'invoice': '/s/#/payroll/invoices',
            'icttimesheet': '/s/#/ict-timesheets'
        };

        if (urlMap[widgetType]) {
            console.log('Navigating to:', urlMap[widgetType]);
            window.location.href = urlMap[widgetType];
            return;
        }

        const routeMap = {
            'staff-status': 'Staff',
            'leave': 'Leave Management',
            'incident': 'Incident Register',
            'hr': 'Human Resources',
            'shift': 'Roster Manager',
            'signin': 'Sign in',
            'performance': 'Performance Management',
            'invoice': 'Invoices',
            'payroll': 'Payroll',
            'icttimesheet': 'ICT Timesheet',
            'rejectedShifts': 'Rejected Shifts'
        };

        const target = routeMap[widgetType] || widgetType;
        if (this.messageContext) {
            publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, { target });
            console.log('Published => ', target);
        }
    }

    handleWidgetSettingsClick(event) {
        event.stopPropagation();
        const widgetId = event.currentTarget.dataset.id;
        this.activeSettingsWidgetId = this.activeSettingsWidgetId === widgetId ? null : widgetId;
    }

    handleChartTypeSelect(event) {
        event.stopPropagation();
        const widgetId = event.currentTarget.dataset.id;
        const chartType = event.currentTarget.dataset.chartType;
        this.activeSettingsWidgetId = null;
        this.dispatchEvent(new CustomEvent('widgetpropertychange', {
            detail: {
                widgetId,
                field: 'chartType',
                value: chartType
            }
        }));
    }

    @api
    refreshAllWidgets(facilityId) {
        this.template.querySelectorAll('.widget-item').forEach(w => {
            if (typeof w.refresh === 'function') {
                w.refresh(facilityId);
            }
        });
    }
        //manendra added for BankTask - refresh only the task widget after an approval
    @api
    refreshTasks() {
        this.template.querySelectorAll('.widget-item').forEach(w => {
            if (typeof w.refreshTasks === 'function') {
                w.refreshTasks();
            }
        });
    }
}