import { LightningElement, api, track } from 'lwc';

export default class DashboardBuilderLibrary extends LightningElement {
    _availableWidgetTypes = [];
    _isOpen = false;

    @api
    get isOpen() {
        return this._isOpen;
    }
    set isOpen(val) {
        this._isOpen = val;
        if (val && this._availableWidgetTypes.length > 0) {
            this.selectedWidgetTypes = this._availableWidgetTypes.map(w => w.value);
        }
    }

    @api
    get availableWidgetTypes() {
        return this._availableWidgetTypes;
    }
    set availableWidgetTypes(val) {
        this._availableWidgetTypes = val || [];
        if (this._isOpen && this._availableWidgetTypes.length > 0) {
            this.selectedWidgetTypes = this._availableWidgetTypes.map(w => w.value);
        }
    }

    @track searchQuery = '';
    @track selectedCategory = 'all';
    @track selectedWidgetTypes = [];

    categories = [
        { label: 'All widgets', value: 'all' },
        { label: 'KPI Cards', value: 'kpi' },
        { label: 'Data Charts', value: 'chart' },
        { label: 'Details & Lists', value: 'list' }
    ];

    get modalClass() {
        return `slds-modal slds-fade-in-open custom-library-modal`;
    }

    get categoriesWithActive() {
        return this.categories.map(cat => ({
            ...cat,
            pillClass: `category-pill-btn ${this.selectedCategory === cat.value ? 'active' : ''}`
        }));
    }

    get filteredWidgetTypes() {
        let list = this.availableWidgetTypes.map(w => {
            const category = this.getWidgetCategory(w.value);
            const isSelected = this.selectedWidgetTypes.includes(w.value);
            return {
                ...w,
                category: category,
                icon: this.getWidgetIcon(w.value),
                description: this.getWidgetDescription(w.value),
                categoryLabel: category.toUpperCase(),
                isSelected: isSelected,
                cardClass: `library-card ${isSelected ? 'selected' : ''}`,
                checkboxClass: `custom-check-box ${isSelected ? 'checked' : ''}`
            };
        });

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            list = list.filter(w => w.label.toLowerCase().includes(query) || w.description.toLowerCase().includes(query));
        }

        return list;
    }

    get isAllSelected() {
        return this.availableWidgetTypes.length > 0 && 
               this.availableWidgetTypes.every(w => this.selectedWidgetTypes.includes(w.value));
    }

    get selectAllButtonLabel() {
        return this.isAllSelected ? 'Unselect All' : 'Select All';
    }

    handleToggleSelectAll() {
        if (this.isAllSelected) {
            this.selectedWidgetTypes = [];
        } else {
            this.selectedWidgetTypes = this.availableWidgetTypes.map(w => w.value);
        }
    }

    get hasWidgets() {
        return this.filteredWidgetTypes.length > 0;
    }

    get hasSelected() {
        return this.selectedWidgetTypes.length > 0;
    }

    get selectedCount() {
        return this.selectedWidgetTypes.length;
    }

    // Dynamic category mappings
    getWidgetCategory(type) {
        if (['signin', 'task', 'staffDashboard'].includes(type)) return 'kpi';
        if (['shift', 'leave', 'incident', 'performance', 'fund', 'payroll', 'icttimesheet', 'rejectedShifts'].includes(type)) return 'chart';
        return 'list';
    }

    // Dynamic icon mappings
    getWidgetIcon(type) {
        if (['signin', 'staffDashboard'].includes(type)) return 'utility:identity';
        if (type === 'task') return 'utility:task';
        if (['shift', 'leave'].includes(type)) return 'utility:event';
        if (type === 'incident') return 'utility:warning';
        if (type === 'performance') return 'utility:metrics';
        if (type === 'fund') return 'utility:moneybag';
        if (type === 'payroll') return 'utility:currency';
        if (type === 'icttimesheet') return 'utility:clock';
        return 'utility:table';
    }

    // Dynamic description mappings
    getWidgetDescription(type) {
        if (type === 'signin') return 'Displays active sign-ins, accepted schedules, and completions in real-time.';
        if (type === 'staff-status') return 'Aggregates active staff counts, leave details, and visa docs expiry trackers.';
        if (type === 'participant') return 'Shows participants enrollment numbers, profiles activity, and facility assignments.';
        if (type === 'incident') return 'Provides critical breakdowns of open, in-progress, and resolved cases.';
        if (type === 'leave') return 'Visualizes pending and approved employee leave allocations.';
        if (type === 'performance') return 'Charts employee reviews, ratings, and scorecard performance levels.';
        if (type === 'fund') return 'Tracks NDIS participant funding usage, budget caps, and balances.';
        if (type === 'shift') return 'Visualizes staff shifts, roster hours, and coverage checks.';
        if (type === 'payroll') return 'Charts payroll expense totals, payslips, and hours logged.';
        if (type === 'icttimesheet') return 'Shows ICT support time logging charts.';
        if (type === 'task') return 'Tracks personal task checklists, statuses, and due dates.';
        return 'Displays customized tabular rows and key analytical fields.';
    }

    handleSearchChange(event) {
        this.searchQuery = event.target.value;
    }

    handleCategorySelect(event) {
        this.selectedCategory = event.currentTarget.dataset.cat;
    }

    handleToggleSelectWidget(event) {
        const type = event.currentTarget.dataset.type;
        if (this.selectedWidgetTypes.includes(type)) {
            this.selectedWidgetTypes = this.selectedWidgetTypes.filter(t => t !== type);
        } else {
            this.selectedWidgetTypes = [...this.selectedWidgetTypes, type];
        }
    }

    handleAddSelected() {
        this.dispatchEvent(new CustomEvent('addselected', {
            detail: { types: this.selectedWidgetTypes }
        }));
        this.selectedWidgetTypes = [];
    }

    handleClose() {
        this.selectedWidgetTypes = [];
        this.dispatchEvent(new CustomEvent('close'));
    }
}