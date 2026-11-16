import { LightningElement, api, track, wire } from 'lwc';
import { DashboardDataProvider } from 'c/dashboardDataProvider';
import getParticipantOptions from '@salesforce/apex/PerformanceManagmentChartController.getParticipantOptions';
import getFundData from '@salesforce/apex/PerformanceManagmentChartController.getFundData';
import getShiftData from '@salesforce/apex/ShiftwithStaffController.getShiftData';
import taskDetails from '@salesforce/apex/TaskHandler.taskDetails';
import CURRENT_USER_ID from '@salesforce/user/Id';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

const DATE_FILTERED_WIDGETS = new Set([
    'signin',
    'incident',
    'fund',
    'payroll',
    'shift',
    'icttimesheet'
]);

export default class DashboardBuilderWidget extends LightningElement {
    @api type = '';
    @api widgetId = '';
    @api isEditMode = false;
    @api title = '';
    @api subtitle = '';
    @api chartType = 'column';
    @api properties = {};

    _facilityId;
    _isConnected = false;
    _loadSeq = 0;

    @api
    get facilityId() {
        return this._facilityId;
    }
    set facilityId(value) {
        if (value !== this._facilityId) {
            this._facilityId = value;
            if (!this._isConnected) {
                return; // Let connectedCallback perform the initial load once component is fully mounted
            }
            if (this.type === 'fund') {
                this.fetchParticipantOptions();
            } else if (this.type === 'shift') {
                this.fetchShiftData();
            } else if (this.type === 'task') {
                this.fetchTaskData();
            } else if (['hr', 'participantSchedule', 'staffDashboard'].includes(this.type)) {
                this.isLoading = false;
            } else {
                this.loadDataset(true);
            }
        }
    }

    @wire(MessageContext)
    messageContext;

    @track participantOptions = [];
    @track selectedValue = '';

    @api
    get selectedParticipantId() {
        return this.selectedValue;
    }

    @api
    get selectedParticipantUid() {
        const selectedOpt = this.participantOptions.find(opt => opt.value === this.selectedValue);
        return selectedOpt?.participantUid || '';
    }

    // Roster Manager Period select properties
    @track selectedTimePeriod = 'Weekly';
    currentStartDate;

    get timePeriodOptions() {
        return [
            { label: 'Weekly', value: 'Weekly', isSelected: this.selectedTimePeriod === 'Weekly' },
            { label: 'Fortnightly', value: 'Fortnightly', isSelected: this.selectedTimePeriod === 'Fortnightly' },
            { label: 'Monthly', value: 'Monthly', isSelected: this.selectedTimePeriod === 'Monthly' }
        ];
    }

    // Tasks properties
    @track taskDetailsValues = [];
    @track todayDate = new Date().toLocaleDateString('en-GB');

    // Sign In date range properties
    @track selectedSignInDateRange = (() => {
        try {
            return localStorage.getItem('defaultSignInDateRange') || 'TODAY';
        } catch (e) {
            return 'TODAY';
        }
    })();
    @track showCustomDatePicker = false;
    @track customStartDate = (() => {
        try {
            const saved = localStorage.getItem('defaultSignInCustomStartDate');
            if (saved) return saved;
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}-01`;
        } catch (e) {
            return '';
        }
    })();
    @track customEndDate = (() => {
        try {
            const saved = localStorage.getItem('defaultSignInCustomEndDate');
            if (saved) return saved;
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
            return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        } catch (e) {
            return '';
        }
    })();

    signInDateOptionsList = [
        { label: 'Today', value: 'TODAY' },
        { label: 'Yesterday', value: 'YESTERDAY' },
        { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
        { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
        { label: 'This Month', value: 'THIS_MONTH' },
        { label: 'Last Month', value: 'LAST_MONTH' },
        { label: 'Last 3 Months', value: 'LAST_3_MONTHS' },
        { label: 'Last 6 Months', value: 'LAST_6_MONTHS' },
        { label: 'This Year', value: 'THIS_YEAR' },
        { label: 'Custom Range', value: 'CUSTOM' }
    ];

    get isFundWidget() {
        return this.type === 'fund';
    }

    get isShiftWidget() {
        return this.type === 'shift';
    }

    get isSigninWidget() {
        return this.type === 'signin';
    }

    get isTaskWidget() {
        return this.type === 'task';
    }

    get isHrWidget() {
        return this.type === 'hr';
    }

    get isParticipantScheduleWidget() {
        return this.type === 'participantSchedule';
    }

    get isIctTimesheetWidget() {
        return this.type === 'icttimesheet';
    }

    get isChartOrKpiVisible() {
        return !['task', 'hr', 'participantSchedule', 'staffDashboard', 'icttimesheet'].includes(this.type);
    }

    get participantDropdownClass() {
        return `participant-dropdown-container ${this.isEditMode ? 'edit-mode-offset' : ''}`;
    }

    get shiftDropdownClass() {
        return `shift-dropdown-container ${this.isEditMode ? 'edit-mode-offset' : ''}`;
    }

    get signinDropdownClass() {
        return `signin-dropdown-container ${this.isEditMode ? 'edit-mode-offset' : ''}`;
    }


    get signInDateOptions() {
        return this.signInDateOptionsList.map(opt => ({
            label: opt.label,
            value: opt.value,
            isSelected: opt.value === this.selectedSignInDateRange
        }));
    }

    get isStaffDashboardWidget() {
        const result = this.type === 'staffDashboard';

        console.log(
            '[STAFF DASHBOARD] isStaffDashboardWidget:',
            result,
            'type:',
            this.type,
            'facilityId:',
            this._facilityId
        );

        return result;
    }

    _dateRange = 'THIS_YEAR';

    @api
    get dateRange() {
        return this._dateRange;
    }
    set dateRange(value) {
        if (value !== this._dateRange) {
            this._dateRange = value;
            if (this._isConnected && this.type !== 'signin') {
                this.loadDataset(true);
            }
        }
    }

    @track dataset = null;
    @track isLoading = true;

    // Shared provider instance
    provider = new DashboardDataProvider();

    get isKpi() {
        return this.chartType === 'kpi';
    }

    get hasDataset() {
        return !!this.dataset;
    }

    get isClickableChart() {
        return ['staff-status', 'signin', 'leave'].includes(this.type);
    }

    get chartOptions() {
        return {
            showLegend: this.properties?.showLegend !== false,
            showTooltips: this.properties?.showTooltips !== false,
            isClickable: this.isClickableChart && !this.isEditMode
        };
    }

    // Dynamic formatting for KPI metric display
    get kpiValue() {
        if (!this.dataset) return '0';
        const rawVal = this.dataset.values?.[0] || this.dataset.metadata?.totalCount || 0;

        if (this.type === 'payroll' || this.type === 'fund' || this.type === 'invoice') {
            return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(rawVal);
        }
        return new Intl.NumberFormat('en-AU').format(rawVal);
    }

    get trendValue() {
        if (this.dataset?.metadata?.trend !== undefined) {
            return this.dataset.metadata.trend;
        }
        // Seeded mock trend value for rich UX previewing
        // let seed = 4.2;
        // if (this.type === 'signin') seed = 12.8;
        // if (this.type === 'staff-status') seed = 3.5;
        // if (this.type === 'incident') seed = -15.4;
        // return seed;
        return 0;
    }

    get trendPercentage() {
        const sign = this.trendValue >= 0 ? '+' : '';
        return `${sign}${this.trendValue}%`;
    }

    get isTrendUp() {
        return this.trendValue >= 0;
    }

    get trendClass() {
        const isUp = this.isTrendUp;
        // Incident spikes are bad; negative is good
        const isSpikeBad = ['incident', 'rejectedShifts'].includes(this.type);
        if (isUp) {
            return isSpikeBad ? 'trend-badge trend-bad' : 'trend-badge trend-good';
        }
        return isSpikeBad ? 'trend-badge trend-good' : 'trend-badge trend-bad';
    }

    get trendIcon() {
        return this.isTrendUp ? 'utility:arrowup' : 'utility:arrowdown';
    }

    get targetPercentage() {
        if (!this.dataset) return '0%';
        const target = this.properties?.target || this.dataset?.metadata?.target || 100;
        const current = this.dataset.values?.[0] || 0;
        const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
        return `${pct}% of target`;
    }

    // Custom SVG Sparkline coordinates generator
    get sparklinePath() {
        // Generate trend points
        const points = this.isTrendUp
            ? [10, 14, 11, 18, 15, 22, 28]
            : [28, 24, 26, 18, 20, 15, 10];

        const width = 120;
        const height = 30;
        const max = Math.max(...points);
        const min = Math.min(...points);
        const range = max - min || 1;

        const coords = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - 4 - ((p - min) / range) * (height - 8);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        return `M ${coords.join(' L ')}`;
    }

    get sparklineFillPath() {
        const linePath = this.sparklinePath;
        // Close the polygon shape at the bottom corners of the sparkline box
        return `${linePath} L 120,30 L 0,30 Z`;
    }

    // connectedCallback() {
    //     if (this.type === 'fund') {
    //         this.fetchParticipantOptions();
    //     } else if (this.type === 'shift') {
    //         const today = new Date();
    //         this.currentStartDate = this.getStartOfWeek(today);
    //         this.fetchShiftData();
    //     } else if (this.type === 'task') {
    //         this.fetchTaskData();
    //     } else if (['hr', 'participantSchedule', 'staffDashboard'].includes(this.type)) {
    //         this.isLoading = false;
    //     } else {
    //         this.loadDataset(false);
    //     }
    // }

    connectedCallback() {

        console.log(
            '========== DASHBOARD BUILDER WIDGET =========='
        );

        console.log(
            'Widget type:',
            this.type
        );

        console.log(
            'Widget ID:',
            this.widgetId
        );

        console.log(
            'Facility ID:',
            this._facilityId
        );

        console.log(
            'Is Staff Dashboard:',
            this.type === 'staffDashboard'
        );

        this._isConnected = true;

        if (this.type === 'signin') {
            const saved = localStorage.getItem('defaultSignInDateRange');
            if (saved) {
                this.selectedSignInDateRange = saved;
            } else if (this.properties?.dateRange) {
                this.selectedSignInDateRange = this.properties.dateRange;
            } else {
                this.selectedSignInDateRange = 'TODAY';
            }
            const savedCustomStart = localStorage.getItem('defaultSignInCustomStartDate');
            const savedCustomEnd = localStorage.getItem('defaultSignInCustomEndDate');
            if (savedCustomStart) this.customStartDate = savedCustomStart;
            if (savedCustomEnd) this.customEndDate = savedCustomEnd;
            if (!this.customStartDate || !this.customEndDate) {
                const monthRange = this.computeDateRange('THIS_MONTH');
                if (!this.customStartDate) this.customStartDate = monthRange.startDate;
                if (!this.customEndDate) this.customEndDate = monthRange.endDate;
            }
        }

        if (this.type === 'fund') {
            this.fetchParticipantOptions();
        } else if (this.type === 'shift') {
            const today = new Date();
            this.currentStartDate = this.getStartOfWeek(today);
            this.fetchShiftData();
        } else if (this.type === 'task') {
            this.fetchTaskData();
        } else if (
            ['hr', 'participantSchedule', 'staffDashboard']
                .includes(this.type)
        ) {
            console.log(
                '[STAFF DASHBOARD] Parent widget recognized staffDashboard'
            );

            this.isLoading = false;
        } else {
            this.loadDataset(true);
        }
    }

    disconnectedCallback() {
        this._isConnected = false;
    }

    renderedCallback() {
        if (this.type === 'signin') {
            const selectEl = this.template.querySelector('.signin-dropdown-container select');
            if (selectEl && this.selectedSignInDateRange && selectEl.value !== this.selectedSignInDateRange) {
                selectEl.value = this.selectedSignInDateRange;
            }
        }
    }

    @api
    refresh(facilityIdFromParent) {
        if (facilityIdFromParent !== undefined) {
            this._facilityId = facilityIdFromParent;
        }
        if (this.type === 'fund') {
            this.fetchParticipantOptions();
        } else if (this.type === 'shift') {
            this.fetchShiftData();
        } else if (this.type === 'task') {
            this.fetchTaskData();
        } else if (['hr', 'participantSchedule', 'staffDashboard'].includes(this.type)) {
            this.isLoading = false;
        } else {
            this.loadDataset(true);
        }
    }

    async fetchParticipantOptions() {
        try {
            this.isLoading = true;
            const data = await getParticipantOptions({ facilityId: this._facilityId });
            console.log('Builder Widget Participant options:', JSON.stringify(data));
            if (data && data.length > 0) {
                const savedId = localStorage.getItem('defaultFundsTrackerParticipantId');
                const savedExists = savedId && data.some(opt => opt.value === savedId);
                const currentExists = this.selectedValue && data.some(opt => opt.value === this.selectedValue);

                if (currentExists) {
                    // keep current
                } else if (savedExists) {
                    this.selectedValue = savedId;
                } else {
                    this.selectedValue = data[0].value;
                }
                localStorage.setItem('defaultFundsTrackerParticipantId', this.selectedValue);

                this.participantOptions = data.map(opt => ({
                    label: opt.label || "",
                    value: opt.value,
                    participantUid: opt.participantUid || opt.value,
                    isSelected: opt.value === this.selectedValue
                }));

                const activeOpt = this.participantOptions.find(opt => opt.value === this.selectedValue);
                if (activeOpt?.participantUid) {
                    localStorage.setItem('defaultFundsTrackerParticipantUid', activeOpt.participantUid);
                }

                await this.fetchFundTrackerData();
            } else {
                this.participantOptions = [];
                this.selectedValue = '';
                // Fallback to mock data if no participants in the facility
                this.dataset = {
                    labels: ['Approved Funds', 'Available Funds', 'Spent Funds'],
                    values: [150000, 50000, 100000],
                    series: [{
                        name: 'Fund Distribution',
                        data: [150000, 50000, 100000]
                    }],
                    metadata: { totalCount: 150000 }
                };
                this.isLoading = false;
            }
        } catch (error) {
            console.error('Error fetching builder participant options:', error);
            this.isLoading = false;
        }
    }

    async fetchFundTrackerData() {
        if (!this.selectedValue) return;
        try {
            this.isLoading = true;
            const data = await getFundData({ participantId: this.selectedValue });
            console.log('Builder Fund data result:', JSON.stringify(data));
            const fundRecord = Array.isArray(data) ? (data[0] || {}) : (data || {});

            const approved = Number(fundRecord.Total_Approved_Amounts__c) || 0;
            const spent = Number(fundRecord.Total_Spent_Funds__c) || 0;
            const available = Number(fundRecord.Total_Available_Funds__c) || 0;

            this.dataset = {
                labels: ['Approved Funds', 'Available Funds', 'Spent Funds'],
                values: [approved, available, spent],
                series: [{
                    name: 'Funds',
                    data: [approved, available, spent]
                }],
                metadata: { totalCount: approved }
            };
        } catch (error) {
            console.error('Error fetching builder fund data:', error);
            this.dataset = {
                labels: ['Approved Funds', 'Available Funds', 'Spent Funds'],
                values: [0, 0, 0],
                series: [{
                    name: 'Funds',
                    data: [0, 0, 0]
                }],
                metadata: { totalCount: 0 }
            };
        } finally {
            this.isLoading = false;
        }
    }

    handleParticipantChange(event) {
        this.selectedValue = event.target.value;
        localStorage.setItem('defaultFundsTrackerParticipantId', this.selectedValue);
        const activeOpt = this.participantOptions.find(opt => opt.value === this.selectedValue);
        if (activeOpt?.participantUid) {
            localStorage.setItem('defaultFundsTrackerParticipantUid', activeOpt.participantUid);
        }
        this.participantOptions = this.participantOptions.map(opt => ({
            ...opt,
            isSelected: opt.value === this.selectedValue
        }));
        this.fetchFundTrackerData();
    }

    // Roster Manager Date Helpers & Fetch
    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    getDaysForSelectedPeriod() {
        const days = [];
        const start = new Date(this.currentStartDate);
        switch (this.selectedTimePeriod) {
            case 'Weekly':
                for (let i = 0; i < 7; i++) {
                    const day = new Date(start);
                    day.setDate(start.getDate() + i);
                    days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                break;
            case 'Fortnightly':
                for (let i = 0; i < 14; i++) {
                    const day = new Date(start);
                    day.setDate(start.getDate() + i);
                    days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                break;
            case 'Monthly':
                const month = start.getMonth();
                const year = start.getFullYear();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let i = 0; i < daysInMonth; i++) {
                    const day = new Date(year, month, i + 1);
                    days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                break;
        }
        return days;
    }

    async fetchShiftData() {
        if (!this._facilityId) return;
        this.isLoading = true;
        const startDate = new Date(this.currentStartDate);
        const endDate = new Date(startDate);
        switch (this.selectedTimePeriod) {
            case 'Weekly':
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'Fortnightly':
                endDate.setDate(startDate.getDate() + 13);
                break;
            case 'Monthly':
                endDate.setMonth(startDate.getMonth() + 1);
                endDate.setDate(endDate.getDate() - 1);
                break;
        }
        try {
            const shiftData = await getShiftData({
                userId: CURRENT_USER_ID,
                facilityId: this._facilityId,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            });
            console.log('Builder Widget Shift Data fetched:', JSON.stringify(shiftData));

            const groupedData = {};
            const statusKeys = ['Accepted', 'Completed', 'InProgress', 'Unassigned'];
            const days = this.getDaysForSelectedPeriod();
            days.forEach(day => {
                groupedData[day] = { Accepted: 0, Completed: 0, InProgress: 0, Unassigned: 0 };
            });

            shiftData.forEach(record => {
                const day = new Date(record.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (groupedData[day]) {
                    groupedData[day][record.status] = record.recordCount;
                }
            });

            const labelMapping = {
                Accepted: 'Accepted',
                Completed: 'Completed',
                InProgress: 'In Progress',
                Unassigned: 'Unassigned'
            };

            const series = statusKeys.map(status => ({
                name: labelMapping[status] || status,
                data: days.map(day => groupedData[day][status] || 0)
            }));

            this.dataset = {
                labels: days,
                series: series,
                values: days.map(day => {
                    return statusKeys.reduce((acc, status) => acc + (groupedData[day][status] || 0), 0);
                }),
                metadata: {
                    totalCount: shiftData.reduce((acc, r) => acc + (r.recordCount || 0), 0)
                }
            };
        } catch (error) {
            console.error('Error fetching builder shift data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handlePreviousPeriod() {
        const newDate = new Date(this.currentStartDate);
        switch (this.selectedTimePeriod) {
            case 'Weekly':
                newDate.setDate(this.currentStartDate.getDate() - 7);
                break;
            case 'Fortnightly':
                newDate.setDate(this.currentStartDate.getDate() - 14);
                break;
            case 'Monthly':
                newDate.setMonth(this.currentStartDate.getMonth() - 1);
                break;
        }
        this.currentStartDate = newDate;
        this.fetchShiftData();
    }

    handleNextPeriod() {
        const newDate = new Date(this.currentStartDate);
        switch (this.selectedTimePeriod) {
            case 'Weekly':
                newDate.setDate(this.currentStartDate.getDate() + 7);
                break;
            case 'Fortnightly':
                newDate.setDate(this.currentStartDate.getDate() + 14);
                break;
            case 'Monthly':
                newDate.setMonth(this.currentStartDate.getMonth() + 1);
                break;
        }
        this.currentStartDate = newDate;
        this.fetchShiftData();
    }

    handleTimePeriodChange(event) {
        this.selectedTimePeriod = event.target.value;
        this.fetchShiftData();
    }

    // Sign In Date Range Dropdown Methods
    handleSignInDateRangeChange(event) {
        const value = event.target.value;
        if (value === 'CUSTOM') {
            this.selectedSignInDateRange = 'CUSTOM';
            localStorage.setItem('defaultSignInDateRange', 'CUSTOM');
            if (!this.customStartDate || !this.customEndDate) {
                const savedStart = localStorage.getItem('defaultSignInCustomStartDate');
                const savedEnd = localStorage.getItem('defaultSignInCustomEndDate');
                if (savedStart && savedEnd) {
                    this.customStartDate = savedStart;
                    this.customEndDate = savedEnd;
                } else {
                    const monthRange = this.computeDateRange('THIS_MONTH');
                    this.customStartDate = monthRange.startDate;
                    this.customEndDate = monthRange.endDate;
                    localStorage.setItem('defaultSignInCustomStartDate', this.customStartDate);
                    localStorage.setItem('defaultSignInCustomEndDate', this.customEndDate);
                }
            }
            this.showCustomDatePicker = true;
            this.loadDataset(true);
            return;
        }

        this.showCustomDatePicker = false;
        this.selectedSignInDateRange = value;
        localStorage.setItem('defaultSignInDateRange', value);
        this.loadDataset(true);
    }

    handleSignInDateRangeClick() {
        if (this.selectedSignInDateRange === 'CUSTOM' && !this.showCustomDatePicker) {
            this.showCustomDatePicker = true;
        }
    }

    handlePopoverClick(event) {
        if (event) {
            event.stopPropagation();
        }
    }

    handleCustomStartDateChange(event) {
        this.customStartDate = event.target?.value;
    }

    handleCustomEndDateChange(event) {
        this.customEndDate = event.target?.value;
    }

    handleApplyCustomDate(event) {
        if (event) event.stopPropagation();
        const fromInput = this.template.querySelector('.custom-date-from-input');
        const toInput = this.template.querySelector('.custom-date-to-input');
        if (fromInput && fromInput.value) {
            this.customStartDate = fromInput.value;
        }
        if (toInput && toInput.value) {
            this.customEndDate = toInput.value;
        }
        if (!this.customStartDate || !this.customEndDate) {
            return;
        }
        if (this.customStartDate > this.customEndDate) {
            const temp = this.customStartDate;
            this.customStartDate = this.customEndDate;
            this.customEndDate = temp;
        }
        this.selectedSignInDateRange = 'CUSTOM';
        localStorage.setItem('defaultSignInDateRange', 'CUSTOM');
        localStorage.setItem('defaultSignInCustomStartDate', this.customStartDate);
        localStorage.setItem('defaultSignInCustomEndDate', this.customEndDate);
        this.showCustomDatePicker = false;
        const selectEl = this.template.querySelector('.signin-dropdown-container select');
        if (selectEl) {
            selectEl.value = 'CUSTOM';
        }
        this.loadDataset(true);
    }

    handleCloseCustomDate(event) {
        if (event) event.stopPropagation();
        this.showCustomDatePicker = false;
        const selectEl = this.template.querySelector('.signin-dropdown-container select');
        if (selectEl && this.selectedSignInDateRange) {
            selectEl.value = this.selectedSignInDateRange;
        }
    }

    computeDateRange(rangeKey) {
        const today = new Date();
        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        let start = new Date(today);
        let end = new Date(today);

        switch (rangeKey) {
            case 'TODAY':
                break;
            case 'YESTERDAY':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'LAST_7_DAYS':
                start.setDate(today.getDate() - 6);
                break;
            case 'LAST_30_DAYS':
                start.setDate(today.getDate() - 29);
                break;
            case 'THIS_MONTH':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'LAST_MONTH':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'LAST_3_MONTHS':
                start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                break;
            case 'LAST_6_MONTHS':
                start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                break;
            case 'THIS_YEAR':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                break;
        }

        return {
            startDate: formatDate(start),
            endDate: formatDate(end)
        };
    }

    getInitials(name) {
        if (!name) return 'UN';
        const cleanName = name.replace(/[^a-zA-Z\s]/g, '').trim();
        const parts = cleanName.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'UN';
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }

    // Tasks Fetch & Actions
    // async fetchTaskData() {
    //     this.isLoading = true;
    //     try {
    //         const response = await taskDetails();
    //         console.log('Builder Widget Task Data:', JSON.stringify(response));
    //         this.taskDetailsValues = response.map(record => {
    //             const dueDate = record.ActivityDate ? new Date(record.ActivityDate).toLocaleDateString('en-GB') : '';
    //             const staffName = record.staffName || '';
    //             const initials = this.getInitials(staffName);

    //             let statusClass = 'slds-badge ';
    //             if (record.Status === 'New') {
    //                 statusClass += 'status-badge-new';
    //             } else if (record.Status === 'In Progress') {
    //                 statusClass += 'status-badge-inprogress';
    //             } else {
    //                 statusClass += 'status-badge-completed';
    //             }

    //             return {
    //                 ...record,
    //                 dueDate,
    //                 initials,
    //                 statusClass
    //             };
    //         });
    //     } catch (error) {
    //         console.error('Error fetching builder tasks:', error);
    //     } finally {
    //         this.isLoading = false;
    //     }
    // }

    async fetchTaskData() {

        this.isLoading = true;

        console.log(
            '========== TASK WIDGET FETCH START =========='
        );

        console.log(
            '[TASK] Widget type:',
            this.type
        );

        console.log(
            '[TASK] Widget ID:',
            this.widgetId
        );

        console.log(
            '[TASK] Facility ID:',
            this._facilityId
        );

        console.log(
            '[TASK] Calling Apex taskDetails()...'
        );

        try {

            const response = await taskDetails();

            console.log(
                '[TASK] Apex response:',
                response
            );

            console.log(
                '[TASK] Apex response JSON:',
                JSON.stringify(response)
            );

            console.log(
                '[TASK] Response is array:',
                Array.isArray(response)
            );

            console.log(
                '[TASK] Response count:',
                Array.isArray(response)
                    ? response.length
                    : 'NOT ARRAY'
            );

            if (!Array.isArray(response)) {

                console.error(
                    '[TASK] Apex did not return an array'
                );

                this.taskDetailsValues = [];
                return;
            }

            if (response.length === 0) {

                console.warn(
                    '[TASK] Apex returned ZERO TASKS'
                );

                this.taskDetailsValues = [];
                return;
            }

            this.taskDetailsValues = response.map((record, index) => {

                console.log(
                    `[TASK] Processing record ${index}:`,
                    JSON.stringify(record)
                );

                const dueDate = record.ActivityDate
                    ? new Date(record.ActivityDate)
                        .toLocaleDateString('en-GB')
                    : '';

                const staffName =
                    record.staffName || '';

                const initials =
                    this.getInitials(staffName);

                let statusClass = 'slds-badge ';

                if (record.Status === 'New') {
                    statusClass += 'status-badge-new';
                } else if (record.Status === 'In Progress') {
                    statusClass += 'status-badge-inprogress';
                } else {
                    statusClass += 'status-badge-completed';
                }

                //manendra added for BankTask - no action icon once the request is actioned
                const isCompletedBankTask =
                    record.Subject === 'Bank Details Request' &&
                    (record.Completed__c === true ||
                        record.Status === 'Completed');

                return {
                    ...record,
                    dueDate,
                    initials,
                    statusClass,
                    showEditIcon: !isCompletedBankTask
                };
            });

            console.log(
                '[TASK] Final taskDetailsValues:',
                JSON.stringify(this.taskDetailsValues)
            );

            console.log(
                '[TASK] Final task count:',
                this.taskDetailsValues.length
            );

        } catch (error) {

            console.error(
                '========== TASK APEX ERROR =========='
            );

            console.error(
                '[TASK] Full error:',
                error
            );

            console.error(
                '[TASK] Error body:',
                error?.body
            );

            console.error(
                '[TASK] Error message:',
                error?.body?.message || error?.message
            );

            console.error(
                '[TASK] Error stack:',
                error?.stack
            );

            this.taskDetailsValues = [];

        } finally {

            this.isLoading = false;

            console.log(
                '========== TASK WIDGET FETCH END =========='
            );
        }
    }

    //manendra added for BankTask - allow parent to re-pull tasks after an approval
    @api
    refreshTasks() {
        if (this.type === 'task') {
            this.fetchTaskData();
        }
    }

    // handleTaskEditClick(event) {
    //     const whatId = event.currentTarget.dataset.whatid;
    //     const taskType = event.currentTarget.dataset.type;
    //     console.log('Dispatching taskedit event from builder widget:', taskType, whatId);
    //     this.dispatchEvent(new CustomEvent('taskedit', {
    //         detail: { taskType, whatId },
    //         bubbles: true,
    //         composed: true
    //     }));
    // }
    handleTaskEditClick(event) {
        const whatId = event.currentTarget.dataset.whatid;
        const taskType = event.currentTarget.dataset.type;
        const taskId = event.currentTarget.dataset.id;// manendra added for bank task edit
        console.log('Task edit clicked:', taskType, whatId);

        // For shift modal tasks, dispatch event to parent to display dashboard modal
        if (taskType === 'Enable Sign in for Shift' || taskType === 'Enable Sign out for Shift') {
            this.dispatchEvent(new CustomEvent('taskedit', {
                detail: { taskType, whatId, taskId },//manendra added taskId for bank task edit
                bubbles: true,
                composed: true
            }));
            return;
        }

        // Use Hash URL navigation matching the rest of the application
        if (taskType === 'Approval Request') {
            const url = '/s/#/roster-manager/reimbursement/approvals';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        if (taskType === 'Leave Request' || taskType === 'Leave Management') {
            const url = whatId
                ? `/s/#/human-resources/leave-management/${whatId}`
                : '/s/#/human-resources/leave-management';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        if (taskType === 'Incident Register') {
            const url = whatId
                ? `/s/#/incident-register/${whatId}`
                : '/s/#/incident-register';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        if (taskType === 'Staff Document Expiry') {
            const url = whatId
                ? `/s/#/admin/staff/${whatId}`
                : '/s/#/admin/staff';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        if (taskType === 'Funds Tracker') {
            const url = whatId
                ? `/s/#/participants/${whatId}/funds-tracker`
                : '/s/#/participants';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        // Default fallback event
        this.dispatchEvent(new CustomEvent('taskedit', {
            detail: { taskType, whatId, taskId }, //manendra added taskId for bank task edit
            bubbles: true,
            composed: true
        }));
    }


    handleHrRedirect(event) {
        event.preventDefault();
        const moduleName = event.currentTarget.dataset.name;
        console.log('Builder Widget HR redirect clicked:', moduleName);

        if (moduleName === 'Awards' || moduleName === 'Award') {
            const url = '/s/#/human-resources/awards';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        if (moduleName === 'Trainings') {
            const url = '/s/#/human-resources/training';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: moduleName
        });
    }

    handleChartClick(event) {
        if (this.isEditMode) return;
        const { label, value, index } = event.detail;
        console.log('Builder Widget chart click:', this.type, label, value);

        if (!label) return;

        if (this.type === 'staff-status') {
            const statusKeyMap = {
                'Active': 'active',
                'On Leave': 'vacation',
                'Inactive': 'inactive',
                'Docs Expiry': 'visaExpiry'
            };
            publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
                target: 'StaffStatusDetail',
                data: {
                    statusLabel: label,
                    statusKey: statusKeyMap[label] || label.toLowerCase(),
                    facilityId: this._facilityId
                }
            });
        } else if (this.type === 'signin') {
            const signinKeyMap = {
                'Completed': 'Completed',
                'In Progress': 'InProgress',
                'Accepted': 'Accepted'
            };
            const appliedRange = this.selectedSignInDateRange || 'TODAY';
            let sDate = this.dataset?.metadata?.startDate;
            let eDate = this.dataset?.metadata?.endDate;
            if (!sDate || !eDate) {
                if (appliedRange === 'CUSTOM') {
                    sDate = this.customStartDate;
                    eDate = this.customEndDate;
                } else {
                    const computed = this.computeDateRange(appliedRange);
                    sDate = computed?.startDate;
                    eDate = computed?.endDate;
                }
            }
            publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
                target: 'StaffStatusDetail',
                data: {
                    statusLabel: label,
                    statusKey: signinKeyMap[label] || label,
                    facilityId: this._facilityId,
                    dateRange: appliedRange,
                    startDate: sDate,
                    endDate: eDate
                }
            });
        } else if (this.type === 'leave') {
            publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
                target: 'StaffStatusDetail',
                data: {
                    statusLabel: label,
                    statusKey: label,
                    facilityId: this._facilityId
                }
            });
        }
    }

    async loadDataset(forceRefresh = false) {
        const seq = ++this._loadSeq;
        try {
            this.isLoading = true;

            let appliedDateRange = null;
            if (this.type === 'signin') {
                const saved = localStorage.getItem('defaultSignInDateRange');
                if (saved) {
                    this.selectedSignInDateRange = saved;
                }
                appliedDateRange = this.selectedSignInDateRange || 'TODAY';
            } else if (DATE_FILTERED_WIDGETS.has(this.type)) {
                appliedDateRange = this._dateRange || this.properties?.dateRange || 'THIS_YEAR';
            }

            // Query filters mapping
            const filters = {
                dateRange: appliedDateRange,
                theme: this.properties?.theme
            };

            if (this.type === 'signin') {
                if (appliedDateRange === 'CUSTOM') {
                    if (!this.customStartDate || !this.customEndDate) {
                        const savedStart = localStorage.getItem('defaultSignInCustomStartDate');
                        const savedEnd = localStorage.getItem('defaultSignInCustomEndDate');
                        if (savedStart && savedEnd) {
                            this.customStartDate = savedStart;
                            this.customEndDate = savedEnd;
                        } else {
                            const monthRange = this.computeDateRange('THIS_MONTH');
                            this.customStartDate = monthRange.startDate;
                            this.customEndDate = monthRange.endDate;
                        }
                    }
                    filters.startDate = this.customStartDate;
                    filters.endDate = this.customEndDate;
                    filters.filterStartDate = this.customStartDate;
                    filters.filterEndDate = this.customEndDate;
                } else {
                    const computed = this.computeDateRange(appliedDateRange);
                    filters.startDate = computed.startDate;
                    filters.endDate = computed.endDate;
                    filters.filterStartDate = computed.startDate;
                    filters.filterEndDate = computed.endDate;
                }
            }

            const data = await this.provider.fetchDataset(this.type, this._facilityId, filters, forceRefresh);
            if (seq !== this._loadSeq) {
                // Stale response from an earlier request, discard
                return;
            }
            this.dataset = data;
        } catch (error) {
            if (seq === this._loadSeq) {
                console.error('Error loading dataset inside widget:', this.widgetId, error);
            }
        } finally {
            if (seq === this._loadSeq) {
                this.isLoading = false;
            }
        }
    }
}