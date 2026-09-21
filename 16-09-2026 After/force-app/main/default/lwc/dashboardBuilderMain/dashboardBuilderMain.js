import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CURRENT_USER_ID from '@salesforce/user/Id';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import orgDetails from '@salesforce/apex/OrgDetails.orgDetails';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';

import getLayout from '@salesforce/apex/DashboardLayoutController.getLayout';
import saveLayout from '@salesforce/apex/DashboardLayoutController.saveLayout';

import { DashboardState } from './dashboardBuilderState';
import { DashboardDataProvider } from 'c/dashboardDataProvider';

export default class DashboardBuilderMain extends LightningElement {
    @api userId = CURRENT_USER_ID;
    
    _facilityId;

    @api
    get facilityId() {
        return this._facilityId;
    }
    set facilityId(value) {
        if (value && value !== this._facilityId) {
            this._facilityId = value;
            this.facilityValue = value;
            if (this.state) {
                this.refreshAllWidgets();
            }
        }
    }
    
    @track isEditMode = false;
    @track isLoading = false;
    @track hasLoadedInitialLayout = false;
    @track widgets = [];
    @track facilityValue;
    @track facilityLabel;
    @track facilityOptions = [];
    @track finalListFacilities = [];
    @track isFacilityOpen = false;
    @track availableWidgetTypes = [];
    @track selectedWidgetType = '';
    @track showAddWidgetModal = false;
    @track isPropertyPanelOpen = false;
    @track showResetModal = false;
    @track toolsFabOpen = false;
    @track currentUserRole;
    @track typeofuser;

    // State & Data Provider singletons
    state;
    dataProvider;
    staffId;
    userType;
    orgId;
    orgFullName;
    
    // Tracks Undo / Redo visual state
    @track hasUndo = false;
    @track hasRedo = false;

    // Access role map for widget libraries
    widgetAccessByRole = {
        'NDIS Org Admin':  ['shift','signin','task','leave','participant','incident','performance','hr','fund','staff-status','rejectedShifts'],
        'Facility Admin':  ['shift','signin','task','leave','participant','incident','performance','hr','fund','staff-status'],
        'Roster Manager':  ['shift','signin','task','leave','participant','incident','performance','hr','fund'],
        'NDIS Staff':      ['signin','task','leave','staffDashboard','participantSchedule','incident','performance'],
        'Payroll Admin':   ['payroll'],
        'HR Admin':        ['leave','incident','hr','performance'],
        'ICT Admin':       ['staff-status','task','hr','leave','icttimesheet'],
        'ICT Staff':       ['leave','icttimesheet'],
        'NDIS Participants': ['participantSchedule'],
        'Payroll Accountant for Multiple': ['invoice'],
        'Accountant for Organisation':     ['invoice']
    };

    allWidgetTypes = {
        fund: 'Funds Tracker',
        hr: 'Human Resources',
        incident: 'Incident Register',
        invoice: 'Invoice',
        leave: 'Leave Management',
        participant: 'Participant Details',
        performance: 'Performance Management',
        shift: 'Roster Manager',
        signin: 'Sign in',
        'staff-status': 'Staff Details',
        task: 'Tasks',
        payroll: 'Payroll',
        icttimesheet: 'ICT Timesheet',
        staffDashboard: 'My Details',
        participantSchedule: 'Participant Schedule',
        rejectedShifts: 'Rejected Shifts'
    };

    get showToolsFab() {
        return (
            (this.typeofuser === 'NDIS' || this.userType === 'NDIS Org Admin' || this.userType === 'NDIS') &&
            (
                !this.currentUserRole ||
                this.currentUserRole === 'Portal Account Partner Executive' ||
                this.currentUserRole === 'CEO' ||
                this.currentUserRole === 'Admin'
            )
        );
    }

    get toolsFabMainClass() {
        return `tools-fab-main ${this.toolsFabOpen ? 'is-open' : ''}`;
    }

    get toolsFabTitle() {
        return this.toolsFabOpen ? 'Close Tools' : 'Tools';
    }

    get toolsFabActionsStyle() {
        return this.toolsFabOpen
            ? 'opacity:1; pointer-events:auto; transform: translateX(0) scale(1); transition: all 180ms ease;'
            : 'opacity:0; pointer-events:none; transform: translateX(20px) scale(0.8); transition: all 180ms ease;';
    }

    get isAddDisabled() {
        return !this.selectedWidgetType;
    }

    get undoClass() {
        return `fab-sub ${this.hasUndo ? '' : 'disabled'}`;
    }

    get redoClass() {
        return `fab-sub ${this.hasRedo ? '' : 'disabled'}`;
    }

    get fabIcon() {
        return this.isEditMode ? 'utility:close' : 'utility:edit';
    }

    get fabTitle() {
        return this.isEditMode ? 'Cancel Edit' : 'Edit Dashboard';
    }

    get fabMainClass() {
        return this.isEditMode ? 'fab-main fab-cancel' : 'fab-main';
    }

    get fabActionsStyle() {
        return this.isEditMode
            ? 'opacity: 1; transform: translateY(0); pointer-events: auto;'
            : 'opacity: 0; transform: translateY(30px); pointer-events: none;';
    }

    get fabContainerStyle() {
        return this.showToolsFab
            ? 'bottom: 115px;'
            : 'bottom: 65px;';
    }

    get undoDisabled() {
        return !this.hasUndo;
    }

    get redoDisabled() {
        return !this.hasRedo;
    }

    get hasWidgets() {
        return this.widgets && this.widgets.length > 0;
    }

    get showEmptyState() {
        return this.hasLoadedInitialLayout && (!this.widgets || this.widgets.length === 0);
    }

    async connectedCallback() {
        this.dataProvider = new DashboardDataProvider();
        this.state = new DashboardState([], this.isEditMode);
        
        try {
            const cachedJson = localStorage.getItem('cachedDashboardLayout');
            if (cachedJson) {
                const cachedWidgets = JSON.parse(cachedJson);
                if (Array.isArray(cachedWidgets) && cachedWidgets.length > 0) {
                    this.state.setWidgets(cachedWidgets);
                    this.widgets = this.state.getWidgets;
                }
            }
        } catch (e) {}

        await this.initUserAndFacilities();
        await this.loadDashboardLayout();
    }

    async initUserAndFacilities() {
        try {
            this.isLoading = true;
            const userData = await getCurrentLoggedUserInfo();
            this.userType = userData?.User_Type__c || 'Default';
            this.currentUserRole = userData?.User_Role__c;
            this.typeofuser = userData?.Type_of_User__c;
            
            const staffInfo = await getstaffId({ userId: this.userId });
            this.staffId = staffInfo?.Id;

            const facilityData = await getFacilityData();
            this.facilityOptions = facilityData.map(r => ({ label: r.Name, value: r.Id }));

            if (['NDIS Org Admin', 'ICT Admin'].includes(this.userType)) {
                this.finalListFacilities = this.facilityOptions;
            } else if (['Facility Admin', 'HR Admin', 'Roster Manager'].includes(this.userType)) {
                const cf = await getFacilityCurrentUser();
                this.finalListFacilities = cf.map(r => ({ label: r.Facility__r.Name, value: r.Facility__r.Id }));
            } else if (['NDIS Staff', 'ICT Staff'].includes(this.userType)) {
                const r = await getstaffId({ userId: this.userId });
                if (r?.Facility__c) {
                    this.facilityValue = r.Facility__c;
                    this.facilityLabel = r.Facility__r.Name;
                    this.finalListFacilities = [{ label: this.facilityLabel, value: this.facilityValue }];
                }
            }

            if (this.finalListFacilities.length > 0) {
                if (!this.facilityValue) {
                    this.facilityValue = this.finalListFacilities[0].value;
                    this.facilityLabel = this.finalListFacilities[0].label;
                } else {
                    const matched = this.finalListFacilities.find(f => f.value === this.facilityValue);
                    if (matched) {
                        this.facilityLabel = matched.label;
                    }
                }
            }

            // Fetch Organization details
            const org = await orgDetails();
            this.orgId = org?.Id;
            this.orgFullName = org?.Name;

            this.loadAvailableWidgetTypes();
        } catch (error) {
            console.error('Error initializing user and facilities:', error);
            this.showToast('Error', 'Unable to initialize user permissions.', 'error');
        }
    }

    loadAvailableWidgetTypes() {
        let allowed = this.widgetAccessByRole[this.userType] || [];
        const existing = new Set(this.widgets.map(w => w.type));

        this.availableWidgetTypes = allowed
            .filter(t => !existing.has(t) && this.allWidgetTypes[t])
            .map(k => ({ label: this.allWidgetTypes[k], value: k }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    parseStyleString(str) {
        const o = {};
        if (!str) return o;
        str.split(";").forEach(chunk => {
            const idx = chunk.indexOf(":");
            if (idx < 0) return;
            const k = chunk.substring(0, idx).trim();
            const v = chunk.substring(idx + 1).trim();
            if (k && v) o[k] = v;
        });
        return o;
    }

    convertV1StyleToGrid(styleStr) {
        const style = this.parseStyleString(styleStr);
        const left = parseFloat(style.left) || 0;
        const top = parseFloat(style.top) || 0;
        const width = parseFloat(style.width) || 400;
        const height = parseFloat(style.height) || 300;

        const referenceWidth = 1200;
        const gap = 16;
        const colWidth = (referenceWidth - (11 * gap)) / 12; // ~85.33
        const rowHeight = colWidth;

        let x = Math.max(0, Math.min(11, Math.round(left / (colWidth + gap))));
        let y = Math.max(0, Math.round(top / (rowHeight + gap)));
        let w = Math.max(1, Math.min(12, Math.round((width + gap) / (colWidth + gap))));
        let h = Math.max(1, Math.round((height + gap) / (rowHeight + gap)));

        if (x + w > 12) {
            w = 12 - x;
        }

        return { x, y, w, h };
    }

    async loadDashboardLayout() {
        try {
            this.isLoading = true;
            const layoutJson = await getLayout({ staffId: this.staffId });
            
            let loadedWidgets = [];
            if (layoutJson && layoutJson.trim() !== '' && layoutJson !== '[]') {
                const layoutObj = JSON.parse(layoutJson);
                // Polymorphic loader: check if layout format is V2 layout JSON or V1 list array
                if (layoutObj.widgets && Array.isArray(layoutObj.widgets)) {
                    loadedWidgets = layoutObj.widgets;
                } else if (Array.isArray(layoutObj)) {
                    // Convert legacy pixel-based V1 widgets to V2 grid slots
                    loadedWidgets = layoutObj.map((w, idx) => {
                        const gridCoords = (w.x !== undefined && w.y !== undefined) 
                            ? { x: w.x, y: w.y, w: w.w || 4, h: w.h || 3 } 
                            : this.convertV1StyleToGrid(w.style);
                        return {
                            id: w.id || `${w.type}-${idx}`,
                            type: w.type,
                            title: w.title || this.allWidgetTypes[w.type] || 'Widget',
                            subtitle: w.subtitle || '',
                            x: gridCoords.x,
                            y: gridCoords.y,
                            w: gridCoords.w,
                            h: gridCoords.h,
                            chartType: w.chartType,
                            properties: w.properties || {
                                object: this.state.getDefaultObject(w.type),
                                theme: 'light',
                                aggregation: 'COUNT',
                                field: 'Id'
                            }
                        };
                    });
                }

                // Normalize chart types for loaded widgets
                const chartOnlyTypes = new Set(['shift', 'leave', 'performance', 'rejectedShifts', 'participant', 'signin', 'staff-status', 'incident', 'fund']);
                loadedWidgets = loadedWidgets.map(w => {
                    let chartType = w.chartType;
                    if (!chartType || (chartType === 'kpi' && chartOnlyTypes.has(w.type))) {
                        chartType = this.state.getDefaultChartType(w.type);
                    }
                    return {
                        ...w,
                        chartType
                    };
                });
            }
            
            this.state.setWidgets(loadedWidgets);
            this.widgets = this.state.getWidgets;
            this.hasLoadedInitialLayout = true;
            if (loadedWidgets.length > 0) {
                localStorage.setItem('cachedDashboardLayout', JSON.stringify(loadedWidgets));
            }
            this.loadAvailableWidgetTypes();
        } catch (error) {
            console.error('Error loading dashboard layout:', error);
            this.showToast('Error', 'Failed to retrieve layout from Salesforce.', 'error');
        } finally {
            this.hasLoadedInitialLayout = true;
            this.isLoading = false;
        }
    }

    toggleToolsFab() {
        this.toolsFabOpen = !this.toolsFabOpen;
    }

    handleNdisQuoteTool() {
        this.dispatchEvent(
            new CustomEvent('openmodule', {
                detail: {
                    field: 'ndisquotetool',
                    content: 'ndisquotetool'
                },
                bubbles: true,
                composed: true
            })
        );
        window.location.hash = '#/ndisquotetool';
        this.toolsFabOpen = false;
    }

    handleReset() {
        this.showResetModal = true;
    }

    cancelReset() {
        this.showResetModal = false;
    }

    async confirmReset() {
        try {
            this.isLoading = true;
            this.showResetModal = false;
            this.widgets = [];
            this.hasLoadedInitialLayout = true;
            localStorage.removeItem('cachedDashboardLayout');
            if (this.state) {
                this.state.reset([]);
            }
            this.updateUndoRedoStates();
            await saveLayout({ staffId: this.staffId, layoutJson: JSON.stringify([]) });
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Dashboard reset successfully. All widgets removed.',
                    variant: 'success'
                })
            );
            this.isEditMode = false;
            this.loadAvailableWidgetTypes();
        } catch (error) {
            console.error('Error resetting dashboard layout:', error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to reset dashboard layout',
                    variant: 'error'
                })
            );
        } finally {
            this.isLoading = false;
        }
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        this.state.isEditMode = this.isEditMode;
        if (this.isEditMode) {
            this.state.pushState(); // Save restore point
        } else {
            // Restore from last save
            this.loadDashboardLayout();
            this.showToast('Info', 'Changes discarded.', 'info');
        }
        this.updateUndoRedoStates();
    }

    async handleSave() {
        try {
            this.isLoading = true;

            const referenceWidth = 1200;
            const gap = 16;
            const colWidth = (referenceWidth - (11 * gap)) / 12;
            const rowHeight = colWidth;

            // Convert grid coords back to pixel style coords for V1 compliance
            const savedWidgets = this.widgets.map(w => {
                const left = Math.round((colWidth + gap) * w.x);
                const top = Math.round((rowHeight + gap) * w.y);
                const width = Math.round((colWidth + gap) * w.w - gap);
                const height = Math.round((rowHeight + gap) * w.h - gap);
                const style = `position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;

                return {
                    id: w.id,
                    type: w.type,
                    title: w.title,
                    subtitle: w.subtitle || '',
                    style: style,
                    x: w.x,
                    y: w.y,
                    w: w.w,
                    h: w.h,
                    visible: true,
                    zIndex: 1,
                    chartType: w.chartType,
                    properties: w.properties
                };
            });

            await saveLayout({ staffId: this.staffId, layoutJson: JSON.stringify(savedWidgets) });
            localStorage.setItem('cachedDashboardLayout', JSON.stringify(this.widgets));
            this.isEditMode = false;
            this.state.isEditMode = false;
            this.showToast('Success', 'Dashboard builder layout saved.', 'success');
        } catch (error) {
            console.error('Error saving layout:', error);
            this.showToast('Error', 'Unable to save dashboard layout: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleCancel() {
        if (this.isEditMode) {
            this.toggleEditMode();
        }
    }

    handleUndo() {
        const undoneWidgets = this.state.undo();
        if (undoneWidgets) {
            this.widgets = undoneWidgets;
            this.updateUndoRedoStates();
            this.showToast('Info', 'Undo performed.', 'info');
        }
    }

    handleRedo() {
        const redoneWidgets = this.state.redo();
        if (redoneWidgets) {
            this.widgets = redoneWidgets;
            this.updateUndoRedoStates();
            this.showToast('Info', 'Redo performed.', 'info');
        }
    }

    updateUndoRedoStates() {
        this.hasUndo = this.state.undoStack.length > 0;
        this.hasRedo = this.state.redoStack.length > 0;
    }

    // Facility Filter Logic
    handleFacilityToggle() {
        this.isFacilityOpen = !this.isFacilityOpen;
    }

    handleFacilitySelect(event) {
        this.facilityValue = event.currentTarget.dataset.value;
        this.facilityLabel = event.currentTarget.dataset.label;
        this.isFacilityOpen = false;
        this.showToast('Info', `Switched to Facility: ${this.facilityLabel}`, 'info');
        
        // Propagate refresh events to all child widgets
        this.refreshAllWidgets();
    }

    refreshAllWidgets() {
        const grid = this.template.querySelector('c-dashboard-builder-grid');
        if (grid && typeof grid.refreshAllWidgets === 'function') {
            grid.refreshAllWidgets(this.facilityValue);
        }
    }

    // Add Widget Actions
    openAddWidget() {
        this.loadAvailableWidgetTypes();
        if (this.availableWidgetTypes.length === 0) {
            this.showToast('Info', 'All accessible widget types are already added.', 'info');
            return;
        }
        this.showAddWidgetModal = true;
    }

    closeAddWidget() {
        this.showAddWidgetModal = false;
        this.selectedWidgetType = '';
    }

    handleWidgetTypeChange(event) {
        this.selectedWidgetType = event.detail.value;
    }

    handleAddWidget() {
        if (!this.selectedWidgetType) return;
        const label = this.allWidgetTypes[this.selectedWidgetType];
        this.state.addWidget(this.selectedWidgetType, label);
        this.widgets = this.state.getWidgets;
        this.closeAddWidget();
        this.updateUndoRedoStates();
        this.showToast('Success', `Widget '${label}' added.`, 'success');
    }

    handleDeleteWidget(event) {
        const id = event.target.dataset.id || event.currentTarget.dataset.id;
        if (id) {
            this.state.deleteWidget(id);
            this.widgets = this.state.getWidgets;
            this.updateUndoRedoStates();
            this.showToast('Success', 'Widget removed from layout.', 'success');
        }
    }

    handleDuplicateWidget(event) {
        const id = event.target.dataset.id || event.currentTarget.dataset.id;
        if (id) {
            this.state.duplicateWidget(id);
            this.widgets = this.state.getWidgets;
            this.updateUndoRedoStates();
            this.showToast('Success', 'Widget duplicated successfully.', 'success');
        }
    }

    handleLayoutChange(event) {
        const { widgetId, x, y, w, h } = event.detail;
        const success = this.state.updateWidgetLayout(widgetId, x, y, w, h);
        if (success) {
            this.widgets = this.state.getWidgets;
            this.updateUndoRedoStates();
        }
    }

    handleDeleteWidgetEvent(event) {
        const { widgetId } = event.detail;
        this.state.deleteWidget(widgetId);
        this.widgets = this.state.getWidgets;
        this.updateUndoRedoStates();
        this.showToast('Success', 'Widget removed from layout.', 'success');
    }

    handleDuplicateWidgetEvent(event) {
        const { widgetId } = event.detail;
        const clone = this.state.duplicateWidget(widgetId);
        if (clone) {
            this.widgets = this.state.getWidgets;
            this.updateUndoRedoStates();
            this.showToast('Success', `Duplicated as: ${clone.title}`, 'success');
        }
    }

    get activeWidget() {
        if (this.state && this.state.activeWidgetId) {
            return this.widgets.find(w => w.id === this.state.activeWidgetId);
        }
        return null;
    }

    get dateRange() {
        return this.state?.globalFilters.dateRange || 'THIS_YEAR';
    }

    get region() {
        return this.state?.globalFilters.region || 'All';
    }

    get businessUnit() {
        return this.state?.globalFilters.businessUnit || 'All';
    }

    handleWidgetSelect(event) {
        const { widgetId } = event.detail;
        this.state.selectWidget(widgetId);
        this.isPropertyPanelOpen = true;
    }

    closePropertyPanel() {
        this.isPropertyPanelOpen = false;
        if (this.state) {
            this.state.activeWidgetId = null;
        }
    }

    handleWidgetPropertyChange(event) {
        const { widgetId, isTopLevel, field, value } = event.detail;
        if (isTopLevel) {
            this.state.updateWidgetProperties(widgetId, { [field]: value });
        } else {
            const w = this.widgets.find(x => x.id === widgetId);
            const props = w?.properties || {};
            this.state.updateWidgetProperties(widgetId, { ...props, [field]: value });
        }
        this.widgets = this.state.getWidgets;
        this.updateUndoRedoStates();
    }

    handleWidgetPropertyChangeEvent(event) {
        const { widgetId, field, value } = event.detail;
        this.handleWidgetPropertyChange({ detail: { widgetId, isTopLevel: true, field, value } });
    }

    handleGlobalFilterChange(event) {
        const { field, value } = event.detail;
        this.state.setGlobalFilter(field, value);
        
        if (this.dataProvider) {
            this.dataProvider.clearCache();
        }
        this.refreshAllWidgets();
        
        this.widgets = this.state.getWidgets;
        this.showToast('Info', 'Filters applied. Refreshing datasets...', 'info');
    }

    handleAddWidgetEvent(event) {
        const { type } = event.detail;
        const label = this.allWidgetTypes[type];
        // this.state.addWidget(type, label);
        this.state.addWidget(type, label, null, null, this.userType);
        this.widgets = this.state.getWidgets;
        this.closeAddWidget();
        this.updateUndoRedoStates();
        this.showToast('Success', `Widget '${label}' added.`, 'success');
    }

    handleWidgetsAddedEvent(event) {
        const { types } = event.detail;
        if (types && types.length > 0) {
            // this.state.addMultipleWidgets(types, this.allWidgetTypes);
            this.state.addMultipleWidgets(types, this.allWidgetTypes, this.userType);
            this.widgets = this.state.getWidgets;
            this.closeAddWidget();
            this.updateUndoRedoStates();
            this.showToast('Success', `${types.length} widgets added to layout successfully.`, 'success');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}