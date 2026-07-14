import { LightningElement, track, api } from 'lwc';
import getAllParticipants from '@salesforce/apex/SupportParticipantController.getAllParticipants';
import getParticipantsPaged from '@salesforce/apex/SupportParticipantController.getParticipantsPagedforNotes';
import saveTimeEntry from '@salesforce/apex/SupportParticipantController.saveTimeEntry';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchSupportItemsForNotes from '@salesforce/apex/SupportParticipantController.fetchSupportItemsForNotes';
import getServiceTypesByParticipant from '@salesforce/apex/SupportParticipantController.getServiceTypesByParticipant';
import updateCaseNoteActivity from '@salesforce/apex/SupportParticipantController.updateCaseNoteActivity';

export default class SupportCoordinatorNotes extends LightningElement {
    @api goalId;
    @track launchedFromDashboard = false;
    @track searchParticipant = '';
    @api
    openAddCaseNoteModal() {
        console.log('==============================');
        console.log('📥 openAddCaseNoteModal() called');

        console.log('participantId received:', this.participantId);
        console.log(
            'launchedFromDashboard BEFORE:',
            this.launchedFromDashboard
        );
        console.log(
            'showAddCaseNoteModal BEFORE:',
            this.showAddCaseNoteModal
        );
        console.log(
            'showParticipantScreen BEFORE:',
            this.showParticipantScreen
        );

        this.launchedFromDashboard = true;

        this.resetForm();
        this.resetFunding();

        this.serviceTypeOptions = [];
        this.serviceItemOptions = [];

        this.showCaseNotesDetails = false;
        this.caseNotesFlag = false;
        this.showAddCaseNoteModal = true;
        //this.resetFormActivity();

        if (this.participantId) {
            console.log('Auto selecting participant after 2 seconds:', this.participantId);

            this.form = {
                ...this.form,
                participant: this.participantId
            };

            setTimeout(() => {
                console.log('⏳ Triggering fake participant change event');

                this.handleChange({
                    target: {
                        name: 'participant',
                        value: this.participantId
                    }
                });
            }, 2000);
        }

        console.log(
            'launchedFromDashboard AFTER:',
            this.launchedFromDashboard
        );
        console.log(
            'showAddCaseNoteModal AFTER:',
            this.showAddCaseNoteModal
        );
        console.log(
            'showParticipantScreen AFTER:',
            this.showParticipantScreen
        );

        console.log('✅ Notes modal opened from dashboard');
        console.log('==============================');
    }
    @track supportItemOptions = [];
    @track casenotesflagforCase = true;
    @api participantId;
    @track @track showAddCaseNoteModal = false;
    @track form = {
        date: this.getTodayDate(),
        noteType: '',
        contactMethod: '',
        durationHours: '',
        durationMinutes: '',
        duration: '',
        chargeLevel: '',
        status: '',
        activity1: '',
        activity2: '',
        participant: '',
        supportCatalogueId: '',
        serviceType: '',
        serviceItem: '',
        isBillable: true
    };

    @track modalFunding = {
        totalBudget: 0,
        currentSpending: 0,
        thisEntry: 0,
        newTotal: 0,
        remaining: 0,
        percentUsed: 0
    };

    @track serviceTypeOptions = [];
    @track serviceItemOptions = [];
    @track selectedServiceAmount = 0;
    @track entryCost = 0;
    @track participantOptions = [];
    @track chargeLevelValue = '';
    @track participantName = '';
    @track selectedChargeRate;
    @track selectedChargeLevel;
    @track isNonBillable = false;
    @track selectedType = 'all';
    @track participants = [];
    @track allParticipants = [];
    @track participantsfilter = [];
    @track pageNumber = 1;
    @track pageSize = 10;
    @track totalPages = 0;
    @track totalRecords = 0;
    pageSizeOptions = [10, 20, 50];
    @track noRecordsFlag = false;
    @track searchParticipant = '';
    @track caseNotesFlag = true;
    @track showCaseNotesDetails = false;
    @track selectedParticipantNotes = [];
    @track selectedParticipantName = '';
    @track isEditingQty = false;
    @track editableRate = 0;
    @track openActivityDetails=false;
    isViewMode = false;
    isEditMode = false;
    selectedNoteId;
    @track modalTitle;
    @track showMuteIcon = false;

    @track funding = {
        totalBudget: 0,
        currentSpending: 0,
        thisEntry: 0,
        newTotal: 0,
        remaining: 0,
        percentUsed: 0
    };
    get isParticipantLocked() {
        return !!this.goalId; // locked only when opened from Goals
    }
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    get showParticipantScreen() {
        return !this.launchedFromDashboard;
    }

    get noteTypeOptions() {
        return [
            { label: 'Support Coordination', value: 'Support Coordination' },
            { label: 'Plan Review', value: 'Plan Review' },
            { label: 'Goal Setting', value: 'Goal Setting' },
            { label: 'Incident Report', value: 'Incident Report' },
            { label: 'Progress Update', value: 'Progress Update' },
            { label: 'Provider Contact', value: 'Provider Contact' }
        ];
    }

    get contactMethodOptions() {
        return [
            { label: 'Face to Face', value: 'Face to Face' },
            { label: 'Phone Call', value: 'Phone Call' },
            { label: 'Video Call', value: 'Video Call' },
            { label: 'Email', value: 'Email' }
        ];
    }

    get chargeLevelOptions() {
        return [
            {
                label: 'SC Level 1 ($114.45/hr)',
                value: '114.45',
                value1: '$114.45 / Hour',
                value2: 'SC Level 1'
            },
            {
                label: 'SC Level 2 ($160.50/hr)',
                value: '160.50',
                value1: '$160.50 / Hour',
                value2: 'SC Level 2'
            },
            {
                label: 'SC Level 3 ($199.99/hr)',
                value: '199.99',
                value1: '$199.99 / Hour',
                value2: 'SC Level 3'
            }
        ];
    }

    get allParticipantClass() {
        return this.selectedType === 'all'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    get pinnedParticipantClass() {
        return this.selectedType === 'pinned'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    get isFirstPage() {
        return this.pageNumber === 1;
    }

    get isLastPage() {
        return this.pageNumber === this.totalPages;
    }

    get bDisableFirst() {
        return this.pageNumber <= 1;
    }

    get bDisableLast() {
        return this.pageNumber >= this.totalPages;
    }

    firstPage() {
        if (this.pageNumber !== 1) {
            this.pageNumber = 1;
            this.loadParticipantsfortabel();
        }
    }

    handlePrevious() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.loadParticipantsfortabel();
        }
    }

    lastPage() {
        if (this.pageNumber !== this.totalPages) {
            this.pageNumber = this.totalPages;
            this.loadParticipantsfortabel();
        }
    }

    handleNext() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.loadParticipantsfortabel();
        }
    }

    async handleClick(event) {
        this.selectedType = event.currentTarget.dataset.type;

        // reset to first page when tab changes
        this.pageNumber = 1;

        await this.loadParticipantsfortabel();
    }
handleDurationKeydown(event) {
    const currentValue = event.target.value || '';

    // Allow edit/navigation keys
    if (
        event.key === 'Backspace' ||
        event.key === 'Delete' ||
        event.key === 'Tab' ||
        event.key.startsWith('Arrow')
    ) {
        return;
    }

    // Block typing more than 2 digits
    if (currentValue.length >= 2) {
        event.preventDefault();
    }
}
    connectedCallback() {
        console.log('==============================');
        console.log('🔄 Notes connectedCallback START');

        console.log('participantId in connectedCallback:', this.participantId);

        this.loadParticipants();
        this.loadParticipantsfortabel();

        console.log('🔄 Notes connectedCallback END');
        console.log('==============================');
    }
    get formattedFunding() {

        const formatCurrency = (value) => {

            return Number(value || 0).toLocaleString(
                'en-AU',
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
        };

        return {

            totalBudget:
                formatCurrency(this.funding.totalBudget),

            currentSpending:
                formatCurrency(this.funding.currentSpending),

            thisEntry:
                formatCurrency(this.funding.thisEntry),

            remaining:
                formatCurrency(this.funding.remaining)
        };
    }
    async loadParticipantsfortabel() {
        console.log('=== loadParticipantsfortabel START ===');
        this.isLoading = true;

        try {
            const result = await getParticipantsPaged({
                pageSize: this.pageSize,
                pageNumber: this.pageNumber,
                participantType: this.selectedType,
                searchKey: this.searchParticipant

            });

            console.log('Raw Apex Result:', JSON.stringify(result));

            if (result.status === 'SUCCESS') {
                this.participants = (result.records || []).map(item => {
                    const participantName =
                        item.First_Name__c || item.Last_Name__c
                            ? `${item.First_Name__c || ''} ${item.Last_Name__c || ''}`.trim()
                            : item.Name || '';
                    const formatCurrency = (value) => {

                        return Number(value || 0).toLocaleString(
                            'en-AU',
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        );
                    };

                    return {
                        id: item.Id,
                        name: participantName,
                        email: item.Email__c || '',
                        phone: item.Phone__c || '',
                        ndis: item.NDIS_Number__c || '',
                        status: item.Status__c || 'Inactive',
                        isPinned: item.Is_Pinned__c || false,

                        // Budget
                        totalplanBudget:
                            Number(item.Total_Plan_Budget__c) || 0,

                        spendbudget:
                            Number(item.Budget_Spent_to_Date__c) || 0,
                         formattedTotalPlanBudget: formatCurrency(item.Total_Plan_Budget__c),

                        formattedSpendBudget: formatCurrency(item.Budget_Spent_to_Date__c),


                        // Case Notes
                        caseNoteCount: item.caseNoteCount || 0,
                        caseNotes: item.caseNotes || [],

                        // Support Catalogue Groups
                        supportCatalogueGroups:
                            item.supportCatalogueGroups || [],

                        // UI
                        initials: this.getInitials(participantName),

                        statusClass:
                            item.Status__c === 'Active'
                                ? 'status-pill status-active'
                                : 'status-pill status-inactive'
                    };
                });

                console.log(
                    'Mapped Participants:',
                    JSON.stringify(this.participants)
                );

                this.totalPages = result.totalPages || 0;
                this.totalRecords = result.totalCount || 0;
                this.pageNumber = result.pageNumber || 1;
                this.pageSize = result.pageSize || 10;
                this.noRecordsFlag = this.participants.length === 0;

            } else {
                console.error('Apex returned error:', result.message);
            }

        } catch (error) {
            console.error('loadParticipantsfortabel ERROR:', error);
            console.error(
                'Message:',
                error?.body?.message || error?.message
            );
        } finally {
            this.isLoading = false;
            console.log('=== loadParticipantsfortabel END ===');
        }
    }
    
    async loadParticipants() {
        try {
            console.log('🔄 loadParticipants() START');

            const data = await getAllParticipants();

            console.log('📦 Raw Participants:', JSON.stringify(data, null, 2));

            this.allParticipants = data;

            this.participantOptions = data.map((p, index) => {
                const participantName =
                    p.First_Name__c || p.Last_Name__c
                        ? `${p.First_Name__c || ''} ${p.Last_Name__c || ''}`.trim()
                        : p.Name || '';

                console.log(`Participant Option ${index + 1}:`, {
                    id: p.Id,
                    firstName: p.First_Name__c,
                    lastName: p.Last_Name__c,
                    originalName: p.Name,
                    finalLabel: participantName
                });

                return {
                    label: participantName,
                    value: p.Id
                };
            });
            console.log( '🧾 participantOptions length:',this.participantOptions.length);
            console.log(
                '🧾 participantOptions:',
                JSON.stringify(this.participantOptions, null, 2)
            );
            

            // APPLY participant if already selected
            if (this.participantId) {
                this.applySelectedParticipant(this.participantId);
            }

            console.log('🔄 loadParticipants() END');

        } catch (error) {
            console.error('❌ loadParticipants ERROR');
            console.error('Error:', error);
            console.error('Error message:', error?.body?.message || error?.message);
        }
    }

    getInitials(name) {
        if (!name) return '';

        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    applySelectedParticipant(participantId) {
        console.log('🎯 Applying participant:', participantId);

        if (!participantId || !this.allParticipants?.length) {
            console.warn('⚠️ Cannot apply participant yet');
            return;
        }

        this.form = {
            ...this.form,
            participant: participantId
        };

        const selectedParticipant = this.allParticipants.find(
            p => p.Id === participantId
        );

        if (!selectedParticipant) {
            console.warn('⚠️ Participant NOT FOUND for Id:', participantId);
            return;
        }

        console.log(
            '✅ Selected Participant Record:',
            JSON.stringify(selectedParticipant, null, 2)
        );

        // ✅ Participant name
        this.participantName = selectedParticipant.Name;

        // ✅ Funding
        this.funding = {
            ...this.funding,
            totalBudget: selectedParticipant.Total_Plan_Budget__c || 0,
            currentSpending: selectedParticipant.Budget_Spent_to_Date__c || 0
        };
    }

    updateCaseNoteBudgetAndCost() {

        const hours =
            parseInt(this.form.durationHours, 10) || 0;

        const minutes =
            parseInt(this.form.durationMinutes, 10) || 0;

        const totalHours =
            hours + (minutes / 60);

        const rate =
            Number(this.selectedServiceAmount) || 0;

        const cost =
            totalHours * rate;

        this.entryCost = cost.toFixed(2);

        this.modalFunding.thisEntry =
            this.form.isBillable
                ? Number(this.entryCost)
                : 0;

        this.modalFunding.newTotal =
            Number(this.modalFunding.currentSpending || 0) +
            Number(this.modalFunding.thisEntry || 0);

        this.modalFunding.remaining =
            Number(this.modalFunding.totalBudget || 0) -
            Number(this.modalFunding.newTotal || 0);

        this.modalFunding.percentUsed =
            Number(this.modalFunding.totalBudget || 0) > 0
                ? Number(
                    (
                        (this.modalFunding.newTotal /
                            this.modalFunding.totalBudget) * 100
                    ).toFixed(2)
                )
                : 0;

        this.modalFunding = {
            ...this.modalFunding
        };

        console.log(
            'Modal Funding Updated:',
            JSON.stringify(this.modalFunding)
        );
    }

    async handleChange(event) {
        console.log('================ handleChange START ================');

        const field = event.target.name;
        const value = event.target.value;

        console.log('Field:', field);
        console.log('Value:', value);

        // update form first
        this.form = {
            ...this.form,
            [field]: value
        };

        /* ==========================================
        DURATION CHANGE
        ========================================== */
        if (field === 'duration') {
            this.updateCaseNoteBudgetAndCost();
        }

        /* ==========================================
        CHARGE LEVEL CHANGE
        ========================================== */
        if (field === 'chargeLevel') {
            const selectedOption = this.chargeLevelOptions.find(
                opt => opt.value === value
            );

            if (selectedOption) {
                this.selectedChargeRate = selectedOption.value1;
                this.selectedChargeLevel = selectedOption.value2;
            } else {
                this.selectedChargeRate = '';
                this.selectedChargeLevel = '';
            }

            this.calculateCost();
        }

        /* ==========================================
        PARTICIPANT CHANGE
        ========================================== */
        if (field === 'participant') {
            console.log('Participant changed:', value);

            this.serviceTypeOptions = [];
            this.serviceItemOptions = [];

            this.form = {
                ...this.form,
                participant: value,
                serviceType: '',
                serviceItem: ''
            };

            if (!value) {
                return;
            }

            try {
                const groups = await getServiceTypesByParticipant({
                    participantId: value
                });

                console.log('Apex Response Received');
                console.log('Groups Count:', groups ? groups.length : 0);
                console.log('Groups:', JSON.stringify(groups));
                console.log('========================================');
                this.selectedParticipantGroups = groups || [];

                this.serviceTypeOptions = (groups || []).map(group => ({
                    label: group.Name,
                    value: group.Id
                }));

                console.log(
                    'Service Types:',
                    JSON.stringify(this.serviceTypeOptions)
                );
            } catch (error) {
                console.error(
                    'Failed to load service types:',
                    error
                );

                this.serviceTypeOptions = [];

                this.showToast(
                    'Error',
                    'Failed to load service types',
                    'error'
                );
            }
        }

        /* ==========================================
        SERVICE TYPE CHANGE
        ========================================== */
        if (field === 'serviceType') {

            console.log('========================================');
            console.log('Service Type changed:', value);

            // Reset service items
            this.serviceItemOptions = [];

            this.form = {
                ...this.form,
                serviceType: value,
                serviceItem: ''
            };

            const selectedGroup =
                (this.selectedParticipantGroups || []).find(
                    group => group.Id === value
                );

            console.log(
                'Selected Group:',
                JSON.stringify(selectedGroup)
            );

            if (selectedGroup) {

                console.log(
                    'Catalogue Count:',
                    selectedGroup.Support_Catalogues__r
                        ? selectedGroup.Support_Catalogues__r.length
                        : 0
                );

                console.log(
                    'Catalogues:',
                    JSON.stringify(selectedGroup.Support_Catalogues__r)
                );

                this.serviceItemOptions =
                    (selectedGroup.Support_Catalogues__r || []).map(item => ({
                        label:
                            item.Support_Item_Name__c +
                            ' ($' +
                            item.Amount__c +
                            ')',
                        value: item.Id
                    }));

                /* ==========================================
                CASE NOTE BUDGET UPDATE
                ========================================== */

                this.modalFunding = {
                    totalBudget:
                        Number(selectedGroup.TotalBudget) || 0,

                    currentSpending:
                        Number(selectedGroup.TotalSpent) || 0,

                    thisEntry: 0,

                    newTotal:
                        Number(selectedGroup.TotalSpent) || 0,

                    remaining:
                        (Number(selectedGroup.TotalBudget) || 0) -
                        (Number(selectedGroup.TotalSpent) || 0),

                    percentUsed:
                        (Number(selectedGroup.TotalBudget) || 0) > 0
                            ? (
                                (Number(selectedGroup.TotalSpent) || 0) /
                                Number(selectedGroup.TotalBudget)
                            ) * 100
                            : 0
                };

                console.log(
                    'Modal Funding:',
                    JSON.stringify(this.modalFunding)
                );

                console.log(
                    'Updated caseNoteBudget:',
                    JSON.stringify(this.caseNoteBudget)
                );
            }
            else {

                this.caseNoteBudget = {
                    totalBudget: 0,
                    currentSpending: 0,
                    thisEntry: 0,
                    newTotal: 0,
                    remaining: 0,
                    percentUsed: 0
                };
            }

            console.log(
                'Service Items:',
                JSON.stringify(this.serviceItemOptions)
            );

            console.log(
                'Updated Form:',
                JSON.stringify(this.form)
            );

            console.log(
                'Updated Budget:',
                JSON.stringify(this.caseNoteBudget)
            );

            console.log('========================================');
        }

        /* ==========================================
        SERVICE ITEM CHANGE
        ========================================== */
        /* if (field === 'serviceItem') {
            console.log('Service Item selected:', value);

            const selectedParticipant = this.participants.find(
                p => p.id === this.form.participant
            );

            if (!selectedParticipant) {
                return;
            }

            const selectedGroup =
                (selectedParticipant.supportCatalogueGroups || []).find(
                    group => group.Id === this.form.serviceType
                );

            if (!selectedGroup) {
                return;
            }

            const selectedItem =
                (selectedGroup.Support_CoordinatorCatalogue__r || []).find(
                    item => item.Id === value
                );

            if (!selectedItem) {
                this.selectedServiceAmount = 0;
                return;
            }

            const amount = Number(selectedItem.Amount__c) || 0;

            this.selectedServiceAmount = amount;
            this.editableRate = amount;
            this.isEditingQty = false;

            this.selectedChargeRate =
                `$${this.selectedServiceAmount.toFixed(2)} / Hour`;

            this.selectedChargeLevel =
                selectedItem.Support_Item_Name__c;

            this.form = {
                ...this.form,
                serviceItem: value
            };

            this.calculateCost();
        } */
        if (field === 'serviceItem') {
            const selectedGroup = (this.selectedParticipantGroups || []).find(
                group => group.Id === this.form.serviceType
            );

            if (!selectedGroup) {
                this.selectedServiceAmount = 0;
                return;
            }

            const selectedItem = (selectedGroup.Support_Catalogues__r || []).find(
                item => item.Id === value
            );

            if (!selectedItem) {
                this.selectedServiceAmount = 0;
                return;
            }

            const amount = Number(selectedItem.Amount__c) || 0;

            this.selectedServiceAmount = amount;
            this.editableRate = amount;
            this.isEditingQty = false;
            this.selectedChargeRate = `$${amount.toFixed(2)} / Hour`;
            this.selectedChargeLevel = selectedItem.Support_Item_Name__c;

            this.form = { ...this.form, serviceItem: value };

            console.log(
                'Before Calculation',
                JSON.stringify(this.modalFunding)
            );

            this.updateCaseNoteBudgetAndCost();

            console.log(
                'After Calculation',
                JSON.stringify(this.modalFunding)
            );
        }

        console.log('Updated Form:', JSON.stringify(this.form));
        console.log('================ handleChange END ==================');
    }

    handleDurationChange(event) {

        const field = event.target.name;
        let value = parseInt(event.target.value, 10) || 0;

        /* Hours: 0 - 24 */
        if (field === 'durationHours') {

            if (value < 0) {
                value = 0;
            }

            if (value > 24) {

                value = 24;

                this.showToast(
                    'Validation',
                    'Duration Hours cannot exceed 24.',
                    'warning'
                );
            }
        }

        /* Minutes: 0 - 59 */
        if (field === 'durationMinutes') {

            if (value < 0) {
                value = 0;
            }

            if (value > 59) {

                value = 59;

                this.showToast(
                    'Validation',
                    'Duration Minutes cannot exceed 59.',
                    'warning'
                );
            }
        }

        const updatedForm = {
            ...this.form,
            [field]: value
        };

        let hours =
            parseInt(updatedForm.durationHours, 10) || 0;

        let minutes =
            parseInt(updatedForm.durationMinutes, 10) || 0;

        /* Special Rule:
        If Hours = 24 then Minutes must be 0
        */
        if (hours === 24 && minutes > 0) {

            minutes = 0;

            updatedForm.durationMinutes = 0;

            this.showToast(
                'Validation',
                'When Duration Hours is 24, Minutes must be 0.',
                'warning'
            );
        }

        updatedForm.duration = `${hours}h ${minutes}m`;

        this.form = updatedForm;

        const totalHours =
            hours + (minutes / 60);

        const serviceAmount =
            Number(this.selectedServiceAmount) || 0;

        const rawCost =
            totalHours * serviceAmount;

        this.entryCost =
            rawCost.toFixed(2);

        this.updateCaseNoteBudgetAndCost();
    }

    async loadSupportItems(participantId) {
        try {
            const data = await fetchSupportItemsForNotes({
                participantId: participantId
            });

            this.supportItemOptions = data.map(item => ({
                label:
                    item.Support_Coordinator_NDIS_Catalogue__r
                        ?.Support_Item_Name__c +
                    ' (' +
                    item.Support_Coordinator_NDIS_Catalogue__r
                        ?.Support_Item_Number__c +
                    ')',
                value: item.Id
            }));

        } catch (error) {
            console.error('Error loading support items:', error);
        }
    }

    handleTextChange(event) {
        console.log('================ handleTextChange START ================');

        const field = event.target.name;
        const value = event.target.value;

        console.log('📝 Textarea Change Fired');
        console.log('🔹 Field Name:', field);
        console.log('🔹 New Value:', value);
        console.log('🔹 Value Type:', typeof value);

        console.log('📦 Form BEFORE update:', JSON.stringify(this.form));

        this.form[field] = value;

        console.log('📦 Form AFTER update:', JSON.stringify(this.form));
        console.log('================ handleTextChange END ==================');
    }

    handleToggle(event) {
        const isBillable = event.target.checked;

        this.form = {
            ...this.form,
            isBillable
        };

        this.isNonBillable = !isBillable;

        if (!isBillable) {
            // Clear form values
            this.form = {
                ...this.form,
                serviceType: '',
                serviceItem: ''
            };

            // Clear dropdowns
            this.serviceItemOptions = [];

            // Clear rate values
            this.editableRate = 0;
            this.selectedServiceAmount = 0;

            // Clear display labels
            this.selectedChargeLevel = '';
            this.selectedChargeRate = '';

            // Reset edit mode
            this.isEditingQty = false;

            // Reset cost
            this.entryCost = 0;
            this.funding.thisEntry = 0;

        } else {
            this.updateCaseNoteBudgetAndCost();
        }

        this.updateFunding();
    }

    calculateCost() {
        console.log('================ calculateCost START ================');

        const hours = parseInt(this.form.durationHours, 10) || 0;
        const minutes = parseInt(this.form.durationMinutes, 10) || 0;

        console.log('Duration Hours:', this.form.durationHours);
        console.log('Duration Minutes:', this.form.durationMinutes);
        console.log('Parsed Hours:', hours);
        console.log('Parsed Minutes:', minutes);

        const totalHours = hours + (minutes / 60);

        console.log('Total Hours:', totalHours);

        const serviceAmount = Number(this.selectedServiceAmount) || 0;

        console.log('Selected Service Amount:', this.selectedServiceAmount);
        console.log('Parsed Service Amount:', serviceAmount);

        const rawCost = totalHours * serviceAmount;

        console.log('Raw Cost Calculation:', `${totalHours} × ${serviceAmount}`);
        console.log('Raw Cost:', rawCost);

        this.entryCost = rawCost.toFixed(2);

        console.log('Entry Cost:', this.entryCost);

        this.funding.thisEntry = this.form.isBillable
            ? Number(this.entryCost)
            : 0;

        console.log('Is Billable:', this.form.isBillable);
        console.log('Funding This Entry:', this.funding.thisEntry);

        this.updateFunding();

        console.log('Funding Object:', JSON.stringify(this.funding));
        console.log('================ calculateCost END ==================');
    }

    updateFunding() {
        const f = this.funding;

        const currentSpending = Number(f.currentSpending) || 0;
        const totalBudget = Number(f.totalBudget) || 0;

        // Only include thisEntry when billable
        const thisEntry = this.form.isBillable
            ? Number(f.thisEntry) || 0
            : 0;

        f.newTotal = Number(
            (currentSpending + thisEntry).toFixed(2)
        );

        f.remaining = Number(
            (totalBudget - f.newTotal).toFixed(2)
        );

        if (totalBudget > 0) {
            f.percentUsed = Number(
                ((f.newTotal / totalBudget) * 100).toFixed(2)
            );
        } else {
            f.percentUsed = 0;
        }
    }

    get progressStyle() {
        const percent = Number(this.funding?.percentUsed) || 0;

        // 🔒 Clamp between 0 and 100
        const safePercent = Math.min(Math.max(percent, 0), 100);

        console.log(
            `📊 Progress bar percentUsed=${percent}, appliedWidth=${safePercent}%`
        );

        return `width: ${safePercent}%;`;
    }

    get tags() {
        return ['Tag 1', 'Tag 2', 'Tag 3', 'Follow Up', 'Admin', 'Support'];
    }

    handleCancel() {
        console.log('❌ Cancel clicked in child');

        this.resetForm();
        this.resetFunding();
        this.resetFormActivity();

        // ✅ Always notify parent
        this.dispatchEvent(
            new CustomEvent('cancel', {
                bubbles: false,
                composed: false,
                detail: {
                    source: this.participantId ? 'participant' : 'dashboard'
                }
            })
        );
    }


    get entryCostClass() {
        return this.form.isBillable
            ? 'entry-cost-box'
            : 'entry-cost-box disabled';
    }

    get formattedSelectedServiceAmount() {
        return Number(this.selectedServiceAmount || 0).toFixed(2);
    }

    async handleSave() {

        console.log('💾 Save button clicked');

        /* ==========================================
        SILENT VALIDATION (TOAST ONLY)
        ========================================== */
        const allInputs = [
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-combobox'),
            ...this.template.querySelectorAll('lightning-textarea')
        ];

        let missingFields = [];

        allInputs.forEach(input => {
            if (!input.disabled && !input.checkValidity()) {
                missingFields.push(input.label);
            }
        });

        if (missingFields.length > 0) {

            this.showToast(
                'Required Fields Missing',
                `Please fill: ${missingFields.join(', ')}`,
                'error'
            );

            return;
        }

        /* ==========================================
        FUND VALIDATION
        ========================================== */
        if (this.form.isBillable) {

            const totalBudget =
                Number(this.modalFunding.totalBudget) || 0;

            const currentSpending =
                Number(this.modalFunding.currentSpending) || 0;

            const availableFunds =
                totalBudget - currentSpending;

            const entryCost =
                Number(this.entryCost) || 0;

            console.log('💰 Total Budget:', totalBudget);
            console.log('💸 Current Spending:', currentSpending);
            console.log('💵 Available Funds:', availableFunds);
            console.log('🧾 Entry Cost:', entryCost);

            if (entryCost > availableFunds) {

                this.showToast(
                    'Insufficient Funds',
                    `Available funds are $${availableFunds.toFixed(2)}, but this entry requires $${entryCost.toFixed(2)}.`,
                    'error'
                );

                return;
            }
        }

        try {

            /* ==========================================
            PREPARE PAYLOAD
            ========================================== */
            const payloadForm = {
                ...this.form,
                goalId: this.goalId || null,
                editableRate: this.selectedServiceAmount || 0
            };

            console.log(
                '📦 Form Payload:',
                JSON.stringify(payloadForm, null, 2)
            );

            console.log(
                '💰 Funding Payload:',
                JSON.stringify(this.modalFunding, null, 2)
            );

            console.log(
                'Duration being sent:',
                this.form.duration
            );

            console.log(
                'Hours being sent:',
                this.form.durationHours
            );

            console.log(
                'Minutes being sent:',
                this.form.durationMinutes
            );

            console.log(
                'Billable:',
                this.form.isBillable
            );

            /* ==========================================
            SAVE
            ========================================== */
            await saveTimeEntry({
                formJson: JSON.stringify(payloadForm),
                fundingJson: JSON.stringify(this.modalFunding)
            });

            console.log('✅ Save successful');

            this.showToast(
                'Success',
                'Case Notes saved successfully',
                'success'
            );

            this.closeAddCaseNoteModal();

            await this.loadParticipantsfortabel();

            this.dispatchEvent(
                new CustomEvent('success', {
                    bubbles: false,
                    composed: false
                })
            );

            this.handleCancel();

        } catch (error) {

            console.error('❌ Save Error:', error);

            this.showToast(
                'Error',
                error?.body?.message || 'Failed to save time entry',
                'error'
            );
        }
    }

    /* handleSearchParticipant(event) {
        console.log('allParticipants', JSON.stringify(this.allParticipants[0]));
        this.searchParticipant = event.target.value.toLowerCase();

        let filtered = [...this.allParticipants];

        if (this.selectedType === 'pinned') {
            filtered = filtered.filter(item => item.isPinned);
        }

        if (this.searchParticipant) {
            filtered = filtered.filter(item =>
                (item.name && item.name.toLowerCase().includes(this.searchParticipant)) ||
                (item.email && item.email.toLowerCase().includes(this.searchParticipant)) ||
                (item.phone && item.phone.toLowerCase().includes(this.searchParticipant))
            );
        }

        this.participants = filtered;
        this.noRecordsFlag = filtered.length === 0;
    } */
handleSearchParticipant(event) {
    this.searchParticipant = (event.target.value || '').toLowerCase();

    let filtered = [...this.allParticipants];

    if (this.selectedType === 'pinned') {
        filtered = filtered.filter(item => item.Is_Pinned__c);
    }

    if (this.searchParticipant) {
        filtered = filtered.filter(item => {
            const name =
                `${item.First_Name__c || ''} ${item.Last_Name__c || ''}`.toLowerCase();

            const email =
                (item.Email__c || '').toLowerCase();

            return (
                name.includes(this.searchParticipant) ||
                email.includes(this.searchParticipant)
            );
        });
    }

    // map back to table structure
    this.participants = filtered.map(item => ({
        id: item.Id,
        name: `${item.First_Name__c || ''} ${item.Last_Name__c || ''}`.trim(),
        email: item.Email__c || '',
        phone: item.Phone__c || '',
        initials: this.getInitials(
            `${item.First_Name__c || ''} ${item.Last_Name__c || ''}`
        )
    }));

    this.noRecordsFlag = this.participants.length === 0;
}
    resetForm() {

        this.form = {
            date: this.getTodayDate(),
            noteType: '',
            contactMethod: '',
            durationHours: '',
            durationMinutes: '',
            duration: '',
            chargeLevel: '',
            status: '',
            activity1: '',
            activity2: '',
            participant: '',
            supportCatalogueId: '',
            serviceType: '',
            serviceItem: '',
            isBillable: true
        };

        // Cost
        this.entryCost = 0;

        // Rate
        this.selectedServiceAmount = 0;
        this.editableRate = 0;

        // Labels
        this.selectedChargeLevel = '';
        this.selectedChargeRate = '';

        // UI State
        this.participantName = '';
        this.isNonBillable = false;
        this.isEditingQty = false;

        // Dropdowns
        this.serviceTypeOptions = [];
        this.serviceItemOptions = [];

        // Service Groups
        this.selectedParticipantGroups = [];

    }

    resetFunding() {
        this.funding = {
            totalBudget: 0,
            currentSpending: 0,
            thisEntry: 0,
            newTotal: 0,
            remaining: 0,
            percentUsed: 0
        };

        this.modalFunding = {
            totalBudget: 0,
            currentSpending: 0,
            thisEntry: 0,
            newTotal: 0,
            remaining: 0,
            percentUsed: 0
        };
    }

    handleRowClick(event) {
        const participantId = event.currentTarget.dataset.id;

        const selectedParticipant = this.participants.find(
            participant => participant.id === participantId
        );

        if (!selectedParticipant) {
            return;
        }

        this.participantId = participantId;

        // optional: update form participant
        this.form = {
            ...this.form,
            participant: participantId
        };

        this.funding = {
            ...this.funding,
            totalBudget: Number(selectedParticipant.totalplanBudget) || 0,
            currentSpending: Number(selectedParticipant.spendbudget) || 0
        };

        this.updateFunding();
    }

    handleCaseNotesDetails(event) {
        console.log('================ handleCaseNotesDetails START ================');

        event.stopPropagation();
        console.log('🛑 Event propagation stopped');

        const participantId = event.currentTarget.dataset.id;
        console.log('📌 Clicked Participant Id:', participantId);
        this.selectedParticipantId =participantId;

        console.log(
            '📋 All Participants:',
            JSON.stringify(this.participants)
        );

        const selectedParticipant = this.participants.find(
            p => p.id === participantId
        );

        console.log(
            '👤 Selected Participant:',
            JSON.stringify(selectedParticipant)
        );

        if (!selectedParticipant) {
            console.warn('⚠️ No participant found for this Id');
            return;
        }

        this.selectedParticipantName = selectedParticipant.name;

        console.log(
            '📝 Selected Participant Name:',
            this.selectedParticipantName
        );

        console.log(
            '📦 Raw Case Notes:',
            JSON.stringify(selectedParticipant.caseNotes)
        );

        this.selectedParticipantNotes =
            (selectedParticipant.caseNotes || []).map((note, index) => {
                console.log(`🔹 Processing Note ${index + 1}:`, JSON.stringify(note));

                const mappedNote = {
                    id: note.Id,
                    date: note.Entry_Date__c
                        ? new Date(note.Entry_Date__c).toLocaleDateString('en-GB')
                        : '',
                    // note.Entry_Date__c || '',
                    noteType: note.Notes_Type__c || '',
                    contactMethod: note.Contact_Method__c || '',
                    isBillable: note.Billable__c || false,
                    duration: note.Duration_Hours__c || '',
                    rate: note.Charge_Level__c || 0,
                    totalCost: note.Total_Cost__c || 0,
                    serviceType: note.Support_CoordinatorCatalogueGroup__r?.Name || '',
                    serviceItem:
                        note.Support_CoordinatorCatalogue__r?.Support_Item_Name__c || '',
                    activity: note.Activity_Details__c || ''
                };

                console.log(
                    `✅ Mapped Note ${index + 1}:`,
                    JSON.stringify(mappedNote)
                );

                return mappedNote;
            });

        console.log(
            '📊 Final Selected Notes:',
            JSON.stringify(this.selectedParticipantNotes)
        );

        this.caseNotesFlag = false;
        this.showCaseNotesDetails = true;

        console.log('🚩 caseNotesFlag:', this.caseNotesFlag);
        console.log('🚩 showCaseNotesDetails:', this.showCaseNotesDetails);

        console.log('================ handleCaseNotesDetails END ==================');
    }

    /* handleAddCaseNote(event) {
        event.stopPropagation();

        const participantId = event.currentTarget.dataset.id;

        // top Add Case Note button
        if (!participantId) {
            this.resetForm();
            this.resetFunding();
            this.serviceTypeOptions = [];
            this.serviceItemOptions = [];
            this.showAddCaseNoteModal = true;
            return;
        }

        const selectedParticipant = this.participants.find(
            participant => participant.id === participantId
        );

        if (!selectedParticipant) {
            return;
        }

        if (selectedParticipant.status !== 'Active') {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'This participant is inactive. Cannot add case note.',
                    variant: 'error'
                })
            );

            return;
        }
        // participant dropdown select
        this.form = {
            ...this.form,
            participant: participantId,
            serviceType: '',
            serviceItem: ''
        };

        this.participantName = selectedParticipant.name;

        // budget
        this.funding = {
            ...this.funding,
            totalBudget: Number(selectedParticipant.totalplanBudget) || 0,
            currentSpending: Number(selectedParticipant.spendbudget) || 0
        };

        this.updateFunding();

        // Service Type Options from supportCatalogueGroups.Name
        this.serviceTypeOptions =
            selectedParticipant.supportCatalogueGroups.map(group => ({
                label: group.Name,
                value: group.Id
            }));

        // clear service items initially
        this.serviceItemOptions = [];

        this.selectedParticipantId = participantId;
        this.showAddCaseNoteModal = true;
    } */

    async handleAddCaseNote(event) {

        event.stopPropagation();

        const participantId =
            event.currentTarget.dataset.id;

        console.log('==============================');
        console.log('handleAddCaseNote START');
        console.log('Participant Id:', participantId);
        this.resetForm();
        this.resetFunding();
        this.resetFormActivity();

        /* ==========================================
        TOP "Create Note" BUTTON
        ========================================== */
        if (!participantId) {

            console.log('Opening empty Create Note modal');

            // this.resetForm();
            // this.resetFunding();
            // this.resetFormActivity();

            this.selectedParticipantGroups = [];
            this.serviceTypeOptions = [];
            this.serviceItemOptions = [];

            this.showAddCaseNoteModal = true;

            return;
        }

        /* ==========================================
        FIND PARTICIPANT
        ========================================== */
        const selectedParticipant =
            this.participants.find(
                participant => participant.id === participantId
            );

        console.log(
            'Selected Participant:',
            JSON.stringify(selectedParticipant, null, 2)
        );

        if (!selectedParticipant) {
            console.warn('Participant not found');
            return;
        }

        /* ==========================================
        ACTIVE CHECK
        ========================================== */
        if (selectedParticipant.status !== 'Active') {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message:
                        'This participant is inactive. Cannot add case note.',
                    variant: 'error'
                })
            );

            return;
        }

        /* ==========================================
        SET PARTICIPANT
        ========================================== */
        this.form = {
            ...this.form,
            participant: participantId,
            serviceType: '',
            serviceItem: ''
        };

        this.participantName =
            selectedParticipant.name;

        /* ==========================================
        LOAD SERVICE TYPES FROM APEX
        ========================================== */
        try {

            console.log(
                'Loading Service Types for:',
                participantId
            );

            const groups =
                await getServiceTypesByParticipant({
                    participantId: participantId
                });

            console.log(
                'Groups Loaded:',
                JSON.stringify(groups, null, 2)
            );

            this.selectedParticipantGroups =
                groups || [];

            this.serviceTypeOptions =
                (groups || []).map(group => ({
                    label: group.Name,
                    value: group.Id
                }));

            this.serviceItemOptions = [];

            console.log(
                'Service Type Options:',
                JSON.stringify(
                    this.serviceTypeOptions,
                    null,
                    2
                )
            );

        } catch (error) {

            console.error(
                'Failed to load Service Types',
                error
            );

            this.selectedParticipantGroups = [];
            this.serviceTypeOptions = [];
            this.serviceItemOptions = [];

            this.showToast(
                'Error',
                'Failed to load service types',
                'error'
            );

            return;
        }

        /* ==========================================
        RESET MODAL BUDGET
        ========================================== */
        this.modalFunding = {
            totalBudget: 0,
            currentSpending: 0,
            thisEntry: 0,
            newTotal: 0,
            remaining: 0,
            percentUsed: 0
        };

        /* ==========================================
        PARTICIPANT BUDGET (OPTIONAL)
        ========================================== */
        this.funding = {
            ...this.funding,
            totalBudget:
                Number(
                    selectedParticipant.totalplanBudget
                ) || 0,

            currentSpending:
                Number(
                    selectedParticipant.spendbudget
                ) || 0
        };

        this.updateFunding();

        this.selectedParticipantId =
            participantId;

        this.showAddCaseNoteModal = true;
        //this.resetForm();
        //this.resetFormActivity();

        console.log(
            'Modal Opened Successfully'
        );

        console.log(
            'selectedParticipantGroups:',
            JSON.stringify(
                this.selectedParticipantGroups,
                null,
                2
            )
        );

        console.log('handleAddCaseNote END');
        console.log('==============================');
    }

    closeAddCaseNoteModal() {
        console.log('==============================');
        console.log('❌ closeAddCaseNoteModal called');

        console.log(
            'showAddCaseNoteModal BEFORE:',
            this.showAddCaseNoteModal
        );
        console.log(
            'launchedFromDashboard BEFORE:',
            this.launchedFromDashboard
        );

        this.showAddCaseNoteModal = false;
        this.caseNotesFlag = true;
        this.showCaseNotesDetails = false;
        this.launchedFromDashboard = false;

        this.resetForm();
        this.resetFunding();
        this.resetFormActivity();

        this.dispatchEvent(
            new CustomEvent('cancel')
        );

        console.log(
            'showAddCaseNoteModal AFTER:',
            this.showAddCaseNoteModal
        );
        console.log(
            'launchedFromDashboard AFTER:',
            this.launchedFromDashboard
        );

        console.log('==============================');
    }

    handleBackToParticipants() {
        this.showCaseNotesDetails = false;
        this.caseNotesFlag = true;
        this.selectedParticipantNotes = [];
        this.selectedParticipantName = '';
    }

    enableQtyEdit() {
        this.isEditingQty = true;
    }

    handleRateChange(event) {
        this.editableRate = Number(event.target.value) || 0;
        console.log(' this.editableRate ',  this.editableRate);
    }

    saveRate() {
        this.selectedServiceAmount = Number(this.editableRate) || 0;

        this.selectedChargeRate =
            `$${this.selectedServiceAmount.toFixed(2)} / Hour`;

        this.isEditingQty = false;

        this.updateCaseNoteBudgetAndCost();
    }

    get formattedEditableRate() {
        return Number(this.editableRate || 0).toFixed(2);
    }

    handlePageSizeChange(event) {
        console.log('Page size changed:', event.target.value);

        this.pageSize = Number(event.target.value);

        // Reset to first page
        this.pageNumber = 1;

        // Reload data
        this.loadParticipantsfortabel();
    }

    get formattedModalFunding() {
        const formatCurrency = (value) => {
            return Number(value || 0).toLocaleString(
                'en-AU',
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
        };

        return {
            totalBudget: formatCurrency(this.modalFunding.totalBudget),
            currentSpending: formatCurrency(this.modalFunding.currentSpending),
            thisEntry: formatCurrency(this.modalFunding.thisEntry),
            remaining: formatCurrency(this.modalFunding.remaining)
        };
    }

    get modalProgressStyle() {
        const percent = Number(this.modalFunding?.percentUsed) || 0;
        const safePercent = Math.min(Math.max(percent, 0), 100);

        return `width: ${safePercent}%;`;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
    get modalTitle() {
        if (this.isViewMode) {
            return 'View Activity Details';
        }

        if (this.isEditMode) {
            return 'Edit Activity Details';
        }

        return 'Activity Details';
    }
    get activityPlaceholder() {
        if (this.isViewMode) {
            return '';
        }

        if (this.isEditMode) {
            return 'Enter activity details here or start speaking...';
        }

        return 'Enter activity details...';
    }
    openDetails(event) {
        const noteId = event.target.dataset.id;
        const activity= event.target.dataset.activity;
         this.selectedNoteId = noteId;
        this.isViewMode = true;
        this.isEditMode = false;

        this.form = {
            ...this.form,
            activity1: activity
        };
        this.openActivityDetails=true;
       
    }
    
    openEditModal(event) {
        console.log('=== openEditModal START ===');
       

        const noteId = event.target.dataset.id;
        console.log('noteId  from event:', noteId);
        const activity= event.target.dataset.activity;
        console.log('activity  from event:', activity);
        this.selectedNoteId = noteId;
        this.isViewMode = false;
        this.isEditMode = true;

        this.form = {
            ...this.form,
            activity1: activity
        };
      
       this.openActivityDetails=true;
    }
    handleActivityBack() {
        this.openActivityDetails = false;
        //this.selectedParticipant = null;
    }
    async handleUpdateActivity() {
        const activityDetails = this.form.activity1?.trim();

        if (!activityDetails) {
            // this.showToast(
            //     'Error',
            //     'Please fill Activity Details.',
            //     'error'
            // );
            return;
        }
        this.isLoading = true;
        try {
            await updateCaseNoteActivity({
                noteId: this.selectedNoteId,
                activityDetails: this.form.activity1 ||''
            });

            this.showToast(
                'Success',
                'Activity details updated successfully',
                'success'
            );

           
            await this.loadParticipantsfortabel();
            console.log(
                'Participants after refresh',
                JSON.stringify(this.participants)
            );
            console.log(
                'selectedParticipantId',
                this.selectedParticipantId
            );
             const selectedParticipant = this.participants.find(
                p => p.id === this.selectedParticipantId
            );
            console.log(
                'Case Notes after refresh',
                JSON.stringify(selectedParticipant?.caseNotes)
            );

            if (selectedParticipant) {
                this.selectedParticipantNotes =
                    (selectedParticipant.caseNotes || []).map(note => ({
                        id: note.Id,
                        date: note.Entry_Date__c
                            ? new Date(note.Entry_Date__c).toLocaleDateString('en-GB')
                            : '',
                        noteType: note.Notes_Type__c || '',
                        contactMethod: note.Contact_Method__c || '',
                        isBillable: note.Billable__c || false,
                        duration: note.Duration_Hours__c || '',
                        rate: note.Charge_Level__c || 0,
                        totalCost: note.Total_Cost__c || 0,
                        serviceType:
                            note.Support_CoordinatorCatalogueGroup__r?.Name || '',
                        serviceItem:
                            note.Support_CoordinatorCatalogue__r?.Support_Item_Name__c || '',
                        activity: note.Activity_Details__c || ''
                    }));
            }

             this.openActivityDetails = false;
        } catch (error) {
            this.showToast(
                'Error',
                error.body?.message || 'Update failed',
                'error'
            );
         } finally {
            this.isLoading = false;
        }
    }
     handleFocus() {
        this.showMuteIcon = true;

        const speechComp =
            this.template.querySelector('c-speech-to-text');

        if (speechComp) {
            speechComp.stopListening();
        }
    }


    handleTranscript(event) {
       this.form.activity1 =
            (this.form.activity1 || '') +
            event.detail.text;
    }

    handleClear() {
       this.form.activity1 = '';
    }

    resetFormActivity() {
        this.form.activity1 = '';
        this.showMuteIcon = false;
    }

    handleBlur() {
        setTimeout(() => {
            this.showMuteIcon = false;
        }, 300);
    }    


}