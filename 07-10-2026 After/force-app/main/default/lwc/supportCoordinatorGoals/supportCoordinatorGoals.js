import { LightningElement,track,api } from 'lwc';
import getActiveParticipants from '@salesforce/apex/SupportParticipantController.getAllParticipants'; 
import getActiveProviders from '@salesforce/apex/Support_GoalsController.getActiveProviders'; 
import saveGoalWithSubGoals from '@salesforce/apex/Support_GoalsController.saveGoalWithSubGoals';
import getParticipantGoalsPaged from '@salesforce/apex/Support_GoalsController.getParticipantGoalsPaged';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getGoalReviews from '@salesforce/apex/Support_GoalsController.getGoalReviews';
import saveGoalReview from '@salesforce/apex/Support_GoalsController.saveGoalReview';
import getGlobalDashboardMetrics from '@salesforce/apex/Support_GoalsController.getGlobalDashboardMetrics';
import getNotesByGoal from '@salesforce/apex/Support_GoalsController.getNotesByGoal';
import updateSubGoalStatus from '@salesforce/apex/Support_GoalsController.updateSubGoalStatus';

export default class SupportCoordinatorGoals extends LightningElement {
    @api launchedFromDashboard = false;
    @track showNotesModal = false;
    @track activeSpeechField = null;
    @api preselectedParticipantId;
    @api preselectedParticipantName;
    @track goalNotes = [];
    @track participants = [];
    @track showGoalModal = false;
    @track providersDisplayText = 'Select Providers';
    @track isProvidersOpen = false;
    @track isEditMode = false;
    @track editingGoalId = null;
    @track totalActiveGoals = 0;
    @track totalInProgressGoals = 0;
    @track goalOptions = [];
    @track selectedGoalId;
    @track selectedSubGoals = [];
    @track showGoalDetails = false;
    @track selectedParticipantName;
    @track totalBudgetSpent = 0;
    @track budgetSpentPercent = 0;    
    showGoalModal = false;
    participantOptions = [];
    selectedParticipantId;
    subGoals = [];
    providerOptions = [];
    @track currentPage = 1;
    @track pageSize = 10;
    @track totalPages = 0;
    @track totalRecords = 0;
    //review goal code
    @track showReviewModal = false;
    @track isEditReviewMode = false;
    @track editingReviewId = null;
    @track reviewForm = {
        Progress_Summary__c: '',
        Evidence_Of_Progress__c: '',
        Barriers_Identified__c: '',
        Enablers__c: '',
        Next_Steps__c: '',
        Review_Date__c: null,
        Update_Progress__c: '',
        BudgetSpent__c: null
    };
    @track goalReviews = [];
    @track goalNotes = [];

    @track totalProgress = 0;
    @track remainingProgress = 100;
    @track isGoalCompleted = false;

    @track totalBudgetSpent = 0;
    @track budgetSpentPercent = 0;

    @track totalActiveGoals  = 0;
    @track totalInProgressGoals  = 0;
    @track totalCompletedGoals  = 0;
    @track avgProgressGlobal  = 0;
    @track showMuteIcon = false;

    @track selectedGoal = {
        Specific__c: '',
        Measurable__c: '',
        Achievable__c: '',
        Relevant__c: '',
        Budget__c: 0,
        Relevent_Providers__c: '',
        Status__c: ''
    };
//end
    AVATAR_COLORS = [
    '#0C78BA',
    '#1E7F43',
    '#5B2C6F',
    '#2C2C2C',
    '#7D3C98'
    ];
    // pageSizeOptions = [
    // { label: '10', value: 10 },
    // { label: '20', value: 20 },
    // { label: '50', value: 50 }
    // ];

    pageSizeOptions = [10, 25, 50];

    subGoalStatusOptions = [
    { label: 'Not Started', value: 'Not Started' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' }
    ];

    statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Inactive', value: 'Inactive' },
     { label: 'Completed', value: 'Completed' }
];
    priorityOptions = [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' }
    ];
    goalCategoryOptions = [
        { label: 'Communication & Social Independent Living', value: 'Communication & Social Independent Living' },
        { label: 'Employment & Education', value: 'Employment & Education' },
        { label: 'Health & Wellbeing', value: 'Health & Wellbeing' },
        { label: 'Community Participation', value: 'Community Participation' },
        { label: 'Relationships', value: 'Relationships' }
    ];
    reviewFrequencyOptions = [
        { label: 'Monthly', value: 'Monthly' },
        { label: '3 Months', value: '3 Months' },
        { label: '6 Months', value: '6 Months' },
        { label: 'Annually', value: 'Annually' }
    ];
    ndisCategoryOptions = [
        { label: 'Core - Daily Living', value: 'Core - Daily Living', checked: false },
        { label: 'Core - Consumables', value: 'Core - Consumables', checked: false },
        { label: 'Core - Transport', value: 'Core - Transport', checked: false },
        { label: 'Core - Community Participation', value: 'Core - Community Participation', checked: false },
        { label: 'Capacity Building - Support Coordination', value: 'Capacity Building - Support Coordination', checked: false },
        { label: 'Capacity Building - Social Skills', value: 'Capacity Building - Social Skills', checked: false },
        { label: 'Capacity Building - Employment', value: 'Capacity Building - Employment', checked: false },
        { label: 'Capacity Building - Life Skills', value: 'Capacity Building - Life Skills', checked: false }
    ];

   connectedCallback() {
        this.loadDashboardMetrics();
        this.loadParticipants();
        this.loadActiveParticipantsForDropdown();
        this.loadActiveProviders();
    }

    async loadDashboardMetrics() {
        console.log('=== loadDashboardMetrics START ===');

        try {
            const res = await getGlobalDashboardMetrics();

            console.log('Dashboard Metrics Response:', JSON.stringify(res));

            this.totalActiveGoals = res.activeGoals || 0;
            this.totalInProgressGoals = res.inProgressGoals || 0;
            this.totalCompletedGoals = res.completedGoals || 0;
            this.avgProgressGlobal = res.avgProgress || 0;

            console.log('totalActiveGoals:', this.totalActiveGoals);
            console.log('totalInProgressGoals:', this.totalInProgressGoals);
            console.log('totalCompletedGoals:', this.totalCompletedGoals);
            console.log('avgProgressGlobal:', this.avgProgressGlobal);

        } catch (error) {
            console.error('Dashboard metrics error:', error);
        }
    }

    async loadParticipants() {
        try {
            const res = await getParticipantGoalsPaged({
                pageSize: this.pageSize,
                pageNumber: this.currentPage
            });

            console.log('Participants Response:', JSON.stringify(res));

            if (res.status !== 'SUCCESS') {
                console.error('Participant load failed:', res);
                return;
            }

            this.totalRecords = res.totalCount;
            this.totalPages = res.totalPages;

            this.totalActiveGoals = 0;
            this.totalInProgressGoals = 0;

            this.participants = res.records.map(p => {
                // Build display name
                const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
                const displayName = fullName || p.participantName;

                const activeGoals = (p.goals || []).filter(g => {
                    const status = g.fullGoal?.Status__c;

                    if (status === 'Active') {
                        this.totalActiveGoals++;
                        return true;
                    }

                    if (status === 'In Progress') {
                        this.totalInProgressGoals++;
                        return true;
                    }

                    if (status === 'Completed') {
                        return true;
                    }

                    return false;
                });

                const colorIndex =
                    Math.abs(this.hashString(displayName)) %
                    this.AVATAR_COLORS.length;

                const avatarColor = this.AVATAR_COLORS[colorIndex];
                const recentGoal = [...activeGoals].sort((a, b) =>
                    new Date(b.fullGoal.CreatedDate) - new Date(a.fullGoal.CreatedDate)
                )[0];

                return {
                    id: p.participantId,
                    name: displayName,
                    hasImage: false,
                    imageUrl: null,
                    initials: this.getInitials(displayName),
                    avatarStyle: `background-color:${avatarColor};`,
                    goalCount: activeGoals.length,
                    avgGoals: p.avgGoalProgress || 0,
                    recentGoalName: recentGoal?.fullGoal?.Name || '',

                    goalCreatedDate: recentGoal?.fullGoal?.CreatedDate
                        ? new Date(recentGoal.fullGoal.CreatedDate).toLocaleDateString('en-GB')
                        : '',

                    goalTargetDate: recentGoal?.fullGoal?.Target_Date__c
                        ? new Date(recentGoal.fullGoal.Target_Date__c).toLocaleDateString('en-GB')
                        : '',

                    activeGoals: activeGoals.map(g => ({
                        id: g.fullGoal.Id,
                        title: g.fullGoal.Name,

                        createdDate: g.fullGoal.CreatedDate
                            ? new Date(g.fullGoal.CreatedDate).toLocaleDateString('en-GB')
                            : '',

                        targetDate: g.fullGoal.Target_Date__c
                            ? new Date(g.fullGoal.Target_Date__c).toLocaleDateString('en-GB')
                            : '',

                        progress: g.totalProgress || 0,
                        progressStyle: `width:${g.totalProgress || 0}%`,
                        fullGoal: g.fullGoal,
                        subGoals: g.subGoals
                    })),
                    previewGoals: (() => {
                        const list = activeGoals.slice(0, 3);
                        const w = list.length === 1 ? '100%' : list.length === 2 ? '50%' : '33.33%';
                        return list.map(g => ({
                            id: g.fullGoal.Id,
                            title: g.fullGoal.Name,
                            progress: g.totalProgress || 0,
                            progressStyle: `width:${g.totalProgress || 0}%`,
                            widthStyle: `width:${w}`
                        }));
                    })()
                    
                };
            });

            console.log('Mapped Participants:', JSON.stringify(this.participants));

        } catch (e) {
            console.error('Error loading paged participants', e);
        }
    }

    async loadActiveParticipantsForDropdown() {
        try {
            const data = await getActiveParticipants();

            this.participantOptions = data.map(p => {
                const fullName = `${p.First_Name__c || ''} ${p.Last_Name__c || ''}`.trim();

                return {
                    label: fullName || p.Name,
                    value: p.Id
                };
            });

            console.log('Participant Options:', JSON.stringify(this.participantOptions));
        } catch (error) {
            console.error('Error loading active participants', error);
        }
    }

    async loadActiveProviders() {
       try {
        const result = await getActiveProviders();
        this.providerOptions = result.map((p, i) => ({
            id: p.Id,                 // IMPORTANT: use real Id
            label: p.Name,
            checked: false,
            badgeClass: 'status-badge1 status-badge-inactive1',
            statusText: 'Inactive'
        }));
    } catch (e) {
        console.error('Error loading providers', e);
    }
    }
    //save method
    async saveGoal() {
          if ( this.goal.Status__c === 'Completed' && this.totalProgress < 100 ) {
            this.showToast(
                'Invalid Status',
                'You cannot mark this goal as Completed until review progress reaches 100%.',
                'error'
            );
            return;
        }
        if (!this.validateLink()) {
            return;
        }
    try {
        const subGoalsPayload = this.subGoals
            .filter(sg => sg.title || sg.description)
            .map(sg => ({
                Title__c: sg.title,
                Description__c: sg.description
            }));
        const payload = {
            goal: this.goal,
            subGoals: subGoalsPayload
        };
        const goalId = await saveGoalWithSubGoals({
            payloadJson: JSON.stringify(payload)
        });
        this.showToast('Success', 'Goal saved successfully', 'success');
        const isEditFromDetails =
        this.isEditMode && this.showGoalDetails;
        const editedGoalId = this.editingGoalId;
        const participantId = this.selectedParticipantId;
        this.closeGoalModal();
        setTimeout(async () => {
            await this.loadParticipants();
            if (isEditFromDetails && editedGoalId && participantId) {
                const participant = this.participants.find(
                    p => p.id === participantId
                );
                if (!participant) return;
                this.goalOptions = participant.activeGoals.map(g => ({
                    label: g.title,
                    value: g.id
                }));
                const updatedGoal = participant.activeGoals.find(
                    g => g.id === editedGoalId
                );
                if (updatedGoal) {
                    this.selectedGoalId = editedGoalId;
                    this.selectedGoal = this.normalizeGoal(updatedGoal);
                    this.selectedSubGoals = this.selectedGoal.subGoals;
                }
            }
        }, 300);
    } catch (error) {
        console.error('Error saving goal:', error);
        this.showToast(
            'Error',
            error?.body?.message || 'Error saving goal',
            'error'
        );
    }
}

    currentStage = 'BASICS';
    goal = {
        Status__c: 'Active',
        SupportClient_To_Goals__c: '',
        Name: '',
        Priority__c: '',
        Goal_Category__c: '',
        Review_Frequency__c: '',
        Specific__c: '',
        Measurable__c: '',
        Achievable__c: '',
        Relevant__c: '',
        Time_Bound__c: '',
        Target_Date__c: null,
        Timeline_Description__c: '',
        NDIS_Support_Categories__c: '',
        Relevent_Providers__c: '',
        Budget__c: null
    };
    /* get participantInitial() {
        if (!this.selectedParticipantName) {
            return '';
        }
        return this.selectedParticipantName.charAt(0).toUpperCase();
    } */
    get isBasicsStage() {
        return this.currentStage === 'BASICS';
    }
    get isSmartStage() {
    return this.currentStage === 'SMART';
    }
    get isActionsStage() {
    return this.currentStage === 'ACTIONS';
    }
    get isLinkStage() {
    return this.currentStage === 'LINK';
    }
    get isLastStage() {
    return this.currentStage === 'ACTIONS';
   }
    get todayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
    }
    // get basicsClass() {
    // return this.currentStage === 'BASICS'
    //     ? 'slds-path__item slds-is-current slds-is-active'
    //     : 'slds-path__item slds-is-complete';
    // }
    get modalTitle() {
    // EDIT MODE
    if (this.isEditMode) {
        return `Edit Goal – ${this.selectedParticipantName}`;
    }
    // ADD MODE (participant selected)
    if (this.goal.SupportClient_To_Goals__c && this.selectedParticipantName) {
        return `Set New Goal – ${this.selectedParticipantName}`;
    }
    // ADD MODE (default)
    return 'Set New Goal';
    }
    hashString(str) {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
    getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (
        parts[0].charAt(0).toUpperCase() +
        parts[parts.length - 1].charAt(0).toUpperCase()
    );
    }
    get saveButtonLabel() {
    return this.isEditMode ? 'Update' : 'Save';
}
    get stepLabel() {
        return `Step ${this.currentStep} of 3`;
    }
    get currentStep() {
        switch (this.currentStage) {
            case 'BASICS':
                return 1;
            case 'SMART':
                return 2;
            case 'ACTIONS':
                return 3;
            case 'LINK':
                return 4;
            default:
                return 1;
        }
    }
    // get smartClass() {
    //     if (this.currentStage === 'SMART') {
    //         return 'slds-path__item slds-is-current slds-is-active';
    //     }
    //     if (this.currentStage === 'BASICS') {
    //         return 'slds-path__item slds-is-incomplete';
    //     }
    //     return 'slds-path__item slds-is-complete';
    // }

    // get actionsClass() {
    //     if (this.currentStage === 'ACTIONS') {
    //         return 'slds-path__item slds-is-current slds-is-active';
    //     }
    //     if (this.currentStage === 'LINK') {
    //         return 'slds-path__item slds-is-complete';
    //     }
    //     return 'slds-path__item slds-is-incomplete';
    // }

    // get linkClass() {
    //     return this.currentStage === 'LINK'
    //         ? 'slds-path__item slds-is-current slds-is-active'
    //         : 'slds-path__item slds-is-incomplete';
    // }
    get isParticipantPreselected() {
    return !!this.preselectedParticipantId;
    }
    get isFirstPage() {
    return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }
    get totalProgressStyle() {
        return `width:${this.totalProgress}%`;
    }

    get budgetProgressStyle() {
        return `width:${this.budgetSpentPercent}%`;
    }

    get reviewModalTitle() {
        return this.isEditReviewMode
            ? 'Edit Goal Review'
            : 'Review Goal';
    }

    get reviewSaveLabel() {
        return this.isEditReviewMode
            ? 'Update Review'
            : 'Save Review';
    }
    

    closeReviewModal() {
        this.showReviewModal = false;
        this.progressChanged = false;
    }

     formatReviewDate(dateValue) {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
  @api openAddGoalModal() {
    this.showGoalModal = true;
     this.showMuteIcon = false;
    this.currentStage = 'BASICS';
    // Reset selected participant name
    this.selectedParticipantName = '';
    // Reset goal object
    this.goal = {
        Status__c: 'Active',
        SupportClient_To_Goals__c: null,
        Name: '',
        Priority__c: '',
        Goal_Category__c: '',
        Review_Frequency__c: '',
        Specific__c: '',
        Measurable__c: '',
        Achievable__c: '',
        Relevant__c: '',
        Target_Date__c: null,
        Timeline_Description__c: '',
        NDIS_Support_Categories__c: '',
        Relevant_Providers__c: '',
        Budget__c: null
    };
    // 👉 Context: Add Goal from Participant Card
    if (this.preselectedParticipantId && this.preselectedParticipantName) {
        this.goal.SupportClient_To_Goals__c = this.preselectedParticipantId;
        this.selectedParticipantName = this.preselectedParticipantName;
    }
   }
   closeGoalModal() {
    console.log('🔴 Closing modal');
    // 1️⃣ Close modal
    this.showGoalModal = false;
    // 2️⃣ Reset wizard state
    this.currentStage = 'BASICS';
    this.subGoals = [];
    this.isProvidersOpen = false;
    this.providersDisplayText = 'Select Providers';
    this.activeSpeechField = null;
    // ✅ IMPORTANT FIX
    if (!this.isEditMode) {
        this.preselectedParticipantId = null;
        this.preselectedParticipantName = null;
        this.selectedParticipantName = '';
     } 
    // Reset edit flags AFTER condition
    this.isEditMode = false;
    this.editingGoalId = null;
    this.resetGoalFields();
    // 3️⃣ Reset goal
    this.goal = {
        Status__c: 'Active',
        SupportClient_To_Goals__c: null,
        Name: '',
        Priority__c: '',
        Goal_Category__c: '',
        Review_Frequency__c: '',
        Specific__c: '',
        Measurable__c: '',
        Achievable__c: '',
        Relevant__c: '',
        Target_Date__c: null,
        Timeline_Description__c: '',
        NDIS_Support_Categories__c: '',
        Relevent_Providers__c: '',
        Budget__c: null
    };
    this.ndisCategoryOptions = this.ndisCategoryOptions.map(c => ({
    ...c,
    checked: false
    }));
    // 🔄 Reset providers selection
    this.providerOptions = this.providerOptions.map(p => ({
        ...p,
        checked: false,
        statusText: 'Inactive',
        badgeClass: 'status-badge1 status-badge-inactive1'
    }));
    this.providersDisplayText = 'Select Providers';
    this.dispatchEvent(
    new CustomEvent('close', {
        bubbles: true,
        composed: true
    })
);
   }

    handleAddSubGoal() {
    this.subGoals = [
        ...this.subGoals,
        {
            id: Date.now(), // temporary unique key
            title: '',
            description: '',
            showMuteIcon: false
        }
    ];
    }
    handleAddGoalForParticipant(event) {
    const participantId = event.currentTarget.dataset.id;
    const participantName = event.currentTarget.dataset.name;
    // ✅ Set context BEFORE opening modal
    this.preselectedParticipantId = participantId;
    this.preselectedParticipantName = participantName;
    // Open modal
    this.openAddGoalModal();
    }
    handleBudgetChange(event) {
    let value = event.target.value;
    value = value ? value.replace(/[^0-9]/g, '') : '';
    this.goal.Budget__c = value ? Number(value) : null;
}
    handleGoalChange(event) {
        const field = event.target.dataset.field;
        const value = event.detail.value;
        this.goal = {
            ...this.goal,
            [field]: value
        };
        // 👇 ONLY for Participant dropdown
        if (field === 'SupportClient_To_Goals__c') {
            const selected = this.participantOptions.find(
                opt => opt.value === value
            );
            this.selectedParticipantName = selected ? selected.label : '';
        }
    }
    handleNext() {
        if (this.currentStage === 'BASICS') {
             if (!this.validateBasics()) {
                return;
            } 
            this.currentStage = 'SMART';
            return;
        }
        if (this.currentStage === 'SMART') {
            if (!this.validateSmart()) {
                return;
            }
            this.currentStage = 'ACTIONS';
             this.showMuteIcon = false;
            return;
        }
    if (this.currentStage === 'ACTIONS') {
            // 🚫 NO BLOCKING VALIDATION FOR NOW
            this.currentStage = 'LINK';
            return;
        }

        if (this.currentStage === 'LINK') {
            if (!this.validateLink()) return;
            this.saveGoal();
        }
    }
    handleBack() {
        if (this.currentStage === 'SMART') {
            this.currentStage = 'BASICS';
            return;
        }
        if (this.currentStage === 'ACTIONS') {
            this.currentStage = 'SMART';
            return;
        }
        if (this.currentStage === 'LINK') {
            this.currentStage = 'ACTIONS';
        }
    }
    handleSubGoalChange(event) {
        const index = event.target.dataset.index;
        const field = event.target.dataset.field;
        const value = event.detail.value;

        this.subGoals = this.subGoals.map((sg, i) =>
            i == index ? { ...sg, [field]: value } : sg
        );
    }
    handleDeleteSubGoal(event) {
    const index = event.target.dataset.index;
    this.subGoals = this.subGoals.filter((_, i) => i != index);
   }
    handleNdisCategoryChange(event) {
        const value = event.target.dataset.value;
        const checked = event.target.checked;
        this.ndisCategoryOptions = this.ndisCategoryOptions.map(c =>
            c.value === value ? { ...c, checked } : c
        );
        const selected = this.ndisCategoryOptions
            .filter(c => c.checked)
            .map(c => c.value);
        this.goal.NDIS_Support_Categories__c = selected.join(';');
    }


   toggleProvidersDropdown(event) {
    event.stopPropagation();
    this.isProvidersOpen = !this.isProvidersOpen;
}

    handleToggleProvider(event) {
        const id = event.target.dataset.id;
        const isActive = event.target.checked;
        this.providerOptions = this.providerOptions.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    checked: isActive,
                    statusText: isActive ? 'Active' : 'Inactive',
                    badgeClass: isActive
                        ? 'status-badge1 status-badge-active1'
                        : 'status-badge1 status-badge-inactive1'
                };
            }
            return p;
        });

        const selected = this.providerOptions.filter(p => p.checked);

        this.providersDisplayText = selected.length
            ? selected.map(p => p.label).join(', ')
            : 'Select Providers';

        // ✅ IMPORTANT: save provider NAMES, not IDs
        this.goal.Relevent_Providers__c = selected.map(p => p.label).join(';');
    }

    get providersSelectedClass() {
        return this.providerOptions.some(p => p.checked)
            ? 'selected-text'
            : 'placeholder-text';
    }

    get providersChevronIcon() {
        return this.isProvidersOpen
            ? 'utility:chevrondown'
            : 'utility:chevronright';
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

    async handleViewDetails(event) {
        const participantId = event.currentTarget.dataset.id;
        const participantName = event.currentTarget.dataset.name;

        this.selectedParticipantId = participantId;
        this.selectedParticipantName = participantName;

        const participant = this.participants.find(
            p => p.id === participantId
        );

        if (!participant) {
            this.showToast(
                'Error',
                'Participant not found.',
                'error'
            );
            return;
        }

        if (!participant.activeGoals || !participant.activeGoals.length) {
            this.showToast(
                'No Goals Found',
                `No active or in-progress goals for ${participantName}.`,
                'warning'
            );
            return;
        }

        this.goalOptions = participant.activeGoals.map(g => ({
            label: g.title,
            value: g.id
        }));

        const firstGoal = participant.activeGoals[0];

        this.selectedGoalId = firstGoal.id;
        this.selectedGoal = this.normalizeGoal(firstGoal);
        this.selectedSubGoals = this.selectedGoal.subGoals;

        this.showGoalDetails = true;

        await this.loadGoalReviews();
        await this.loadGoalNotes();
    }

    async handleGoalSelection(event) {
        const goalId = event.detail.value;
        this.selectedGoalId = goalId;

        for (const participant of this.participants) {
            const found = participant.activeGoals?.find(
                g => g.id === goalId
            );

            if (found) {
                this.selectedGoal = this.normalizeGoal(found);
                this.selectedSubGoals = this.selectedGoal.subGoals;
                break;
            }
        }

        await this.loadGoalReviews();
        await this.loadGoalNotes();
    }

normalizeGoal(goalWrapper) {
    const goal = goalWrapper.fullGoal || {};

    return {
        /* BASICS */
        Priority__c: goal.Priority__c ?? '',
        Status__c: goal.Status__c ?? '',
        Goal_Category__c: goal.Goal_Category__c ?? '',
        Review_Frequency__c: goal.Review_Frequency__c ?? '',

        /* SMART */
        Specific__c: goal.Specific__c ?? '',
        Measurable__c: goal.Measurable__c ?? '',
        Achievable__c: goal.Achievable__c ?? '',
        Relevant__c: goal.Relevant__c ?? '',
        Target_Date__c: goal.Target_Date__c ?? null,
        Timeline_Description__c:
            goal.Timeline_Description__c ?? '',

        /* LINK */
        NDIS_Support_Categories__c:
            goal.NDIS_Support_Categories__c ?? '',

        Relevent_Providers__c:
            goal.Relevent_Providers__c ?? '',

        Budget__c: goal.Budget__c ?? 0,

        /* SUB GOALS */
        subGoals: (goalWrapper.subGoals || []).map(sg => ({
            id: sg.Id,
            title: sg.Title__c,
            description: sg.Description__c,
            status: sg.Status__c || 'Not Started',
            showMuteIcon: false
        }))
    };
}

handleBackToParticipants() {
    this.showGoalDetails = false;
    this.selectedGoalId = null;
    this.selectedSubGoals = [];
    this.goalReviews = [];
    this.goalNotes = [];
    this.totalProgress = 0;
    this.totalBudgetSpent = 0;
    this.budgetSpentPercent = 0;
}

    handleEditGoal() {
        if (!this.selectedGoalId) {
            return;
        }
        this.isEditMode = true;
        this.editingGoalId = this.selectedGoalId;
        // Open modal
        this.showGoalModal = true;
        this.showMuteIcon = false;
        this.currentStage = 'BASICS';
        // Lock participant (important)
        this.preselectedParticipantId = this.selectedParticipantId;
        
        this.preselectedParticipantName = this.selectedParticipantName;
        this.goal = {
                    Id: this.selectedGoalId,
                    SupportClient_To_Goals__c: this.preselectedParticipantId,
                    Name: this.goalOptions.find(g => g.value === this.selectedGoalId)?.label,
                    Status__c:  this.selectedGoal.Status__c,
                    // ✅ BASICS
                    Priority__c: this.selectedGoal.Priority__c,
                    Goal_Category__c: this.selectedGoal.Goal_Category__c,
                    Review_Frequency__c: this.selectedGoal.Review_Frequency__c,
                    // SMART
                    Specific__c: this.selectedGoal.Specific__c,
                    Measurable__c: this.selectedGoal.Measurable__c,
                    Achievable__c: this.selectedGoal.Achievable__c,
                    Relevant__c: this.selectedGoal.Relevant__c,
                    // LINK
                    Relevent_Providers__c: this.selectedGoal.Relevent_Providers__c,
                    Budget__c: this.selectedGoal.Budget__c,
                    // SMART DATE
                    Target_Date__c: this.selectedGoal.Target_Date__c,
                    Timeline_Description__c: this.selectedGoal.Timeline_Description__c
                };
        const selectedCategories =
            (this.selectedGoal.NDIS_Support_Categories__c || '').split(';');

        this.ndisCategoryOptions = this.ndisCategoryOptions.map(c => ({
            ...c,
            checked: selectedCategories.includes(c.value)
        }));
         this.goal.NDIS_Support_Categories__c = selectedCategories.join(';');
        const selectedProviders =
            (this.selectedGoal.Relevent_Providers__c || '').split(';');

        this.providerOptions = this.providerOptions.map(p => ({
            ...p,
            checked: selectedProviders.includes(p.label),
            statusText: selectedProviders.includes(p.label) ? 'Active' : 'Inactive',
            badgeClass: selectedProviders.includes(p.label)
                ? 'status-badge1 status-badge-active1'
                : 'status-badge1 status-badge-inactive1'
        }));

        this.providersDisplayText = selectedProviders.length
            ? selectedProviders.join(', ')
            : 'Select Providers';
            // Prepopulate sub-goals
            this.subGoals = this.selectedSubGoals.map(sg => ({
                id: sg.id,
                title: sg.title,
                description: sg.description,
                showMuteIcon: false
            }));
    }
    validateBasics() {
    const missingFields = [];
    // Participant (only if not preselected)
    if (!this.preselectedParticipantId && !this.goal.SupportClient_To_Goals__c) {
        missingFields.push('Participant');
    }
    if (!this.goal.Name) {
        missingFields.push('Goal Title');
    }
    if (!this.goal.Status__c) {
        missingFields.push('Status');
    }
    if (!this.goal.Priority__c) {
        missingFields.push('Priority');
    }
    if (!this.goal.Goal_Category__c) {
        missingFields.push('Goal Category');
    }
    if (!this.goal.Review_Frequency__c) {
        missingFields.push('Review Frequency');
    }
    if (missingFields.length) {
        this.showToast(
            'Missing Information',
            `Please complete: ${missingFields.join(', ')}`,
            'error'
        );
        return false;
    }
    return true;
}
    // validateSmart() {
    //     const missingFields = [];
    //     if (!this.goal.Specific__c) {
    //         missingFields.push('Specific');
    //     }
    //     if (!this.goal.Measurable__c) {
    //         missingFields.push('Measurable');
    //     }
    //     if (!this.goal.Achievable__c) {
    //         missingFields.push('Achievable');
    //     }
    //     if (!this.goal.Relevant__c) {
    //         missingFields.push('Relevant');
    //     }
    //     if (!this.goal.Target_Date__c) {
    //         missingFields.push('Target Date');
    //     }
    //     if (!this.goal.Timeline_Description__c) {
    //         missingFields.push('Timeline Description');
    //     }
    //     if (missingFields.length) {
    //         this.showToast(
    //             'Missing Information',
    //             `Please complete: ${missingFields.join(', ')}`,
    //             'error'
    //         );
    //         return false;
    //     }
    //     const selectedDate = new Date(this.goal.Target_Date__c);
    //     const today = new Date();
    //     today.setHours(0, 0, 0, 0);
    //     if (selectedDate < today) {
    //         this.showToast(
    //             'Invalid Date',
    //             'Target Date cannot be in the past.',
    //             'error'
    //         );
    //         return false;
    //     }

    //     return true;
    // }
    validateSmart() {
        let isValid = true;

        const textareas = this.template.querySelectorAll('lightning-textarea');

        textareas.forEach(field => {
            const fieldName = field.dataset.field;

            if (
                fieldName === 'Specific__c' ||
                fieldName === 'Measurable__c' ||
                fieldName === 'Achievable__c' ||
                fieldName === 'Relevant__c'
            ) {
                if (!field.value || !field.value.trim()) {
                    field.setCustomValidity('Complete this field.');
                    isValid = false;
                } else {
                    field.setCustomValidity('');
                }

                field.reportValidity();
            }
        });

        // Validate required lightning-inputs
        const inputsValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, input) => {
                input.reportValidity();
                return validSoFar && input.checkValidity();
            }, true);
        // if (!isValid || !inputsValid) {
        //     return false;
        // }

        // if (!isValid || !inputsValid) {
        //     this.showToast(
        //         'Missing Information',
        //         'Please complete all required fields.',
        //         'error'
        //     );
        //     return false;
        // }

        // Date validation
        // const selectedDate = new Date(this.goal.Target_Date__c);
        // const today = new Date();
        // today.setHours(0, 0, 0, 0);

        // if (selectedDate < today) {
        //     const targetDateField = this.template.querySelector(
        //         '[data-field="Target_Date__c"]'
        //     );

        //     targetDateField.setCustomValidity(
        //         'Target Date cannot be in the past.'
        //     );
        //     targetDateField.reportValidity();

        //     this.showToast(
        //         'Invalid Date',
        //         'Target Date cannot be in the past.',
        //         'error'
        //     );

        //     return false;
        // }

        // return true;
         const missingFields = [];
        if (!this.goal.Specific__c) {
            missingFields.push('Specific');
        }
        if (!this.goal.Measurable__c) {
            missingFields.push('Measurable');
        }
        if (!this.goal.Achievable__c) {
            missingFields.push('Achievable');
        }
        if (!this.goal.Relevant__c) {
            missingFields.push('Relevant');
        }
        if (!this.goal.Target_Date__c) {
            missingFields.push('Target Date');
        }
        if (!this.goal.Timeline_Description__c) {
            missingFields.push('Timeline Description');
        }
        if (missingFields.length) {
            this.showToast(
                'Missing Information',
                `Please complete: ${missingFields.join(', ')}`,
                'error'
            );
            return false;
        }
        const selectedDate = new Date(this.goal.Target_Date__c);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            this.showToast(
                'Invalid Date',
                'Target Date cannot be in the past.',
                'error'
            );
            return false;
        }

        return true;
    }
validateLink() {
    const missingFields = [];
    // NDIS Support Categories
    /* if (!this.goal.NDIS_Support_Categories__c) {
        missingFields.push('NDIS Support Categories');
    } */
    // Relevant Providers
    /* const hasProviderSelected = this.providerOptions.some(
        p => p.checked
    );
    if (!hasProviderSelected) {
        missingFields.push('Relevant Providers');
    } */
    // Budget
    /* if (!this.goal.Budget__c || this.goal.Budget__c <= 0) {
        missingFields.push('Budget');
    } */
    if (missingFields.length) {
        this.showToast(
            'Missing Information',
            `Please complete: ${missingFields.join(', ')}`,
            'error'
        );
        return false;
    }
    return true;
}
handleFirstPage() {
    if (this.currentPage !== 1) {
        this.currentPage = 1;
        this.loadParticipants();
    }
}
handleLastPage() {
    if (this.currentPage !== this.totalPages) {
        this.currentPage = this.totalPages;
        this.loadParticipants();
    }
}
handleNextPage() {
    if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadParticipants();
    }
}

handlePreviousPage() {
    if (this.currentPage > 1) {
        this.currentPage--;
        this.loadParticipants();
    }
}

// handlePageSizeChange(event) {
//     this.pageSize = parseInt(event.detail.value, 10);
//     this.currentPage = 1;
//     this.loadParticipants();
// }

handlePageSizeChange(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.currentPage = 1;
    this.loadParticipants();
}


//review goal code
handleReviewGoal() {
    if (this.isGoalCompleted) {
        this.showToast(
            'Goal Completed',
            'This goal has already reached 100% progress.',
            'info'
        );
        return;
    }

    this.isEditReviewMode = false;
    this.editingReviewId = null;

    this.reviewForm = {
        Progress_Summary__c: '',
        Evidence_Of_Progress__c: '',
        Barriers_Identified__c: '',
        Enablers__c: '',
        Next_Steps__c: '',
        Review_Date__c: null,
        Update_Progress__c: '',
        BudgetSpent__c: null
    };

    this.showReviewModal = true;
}
@track originalReviewProgress;
handleEditReview(event) {
    const reviewId = event.currentTarget.dataset.id;

    const review = this.goalReviews.find(
        r => r.Id === reviewId
    );

    if (!review) {
        return;
    }

    this.isEditReviewMode = true;
    this.editingReviewId = reviewId;
    this.originalReviewProgress =
        Number(review.Update_Progress__c || 0);
    this.reviewForm = {
        ...review
    };

    this.showReviewModal = true;
}
@track progressChanged=false;
handleReviewChange(event) {
    const field = event.target.dataset.field;
    const value = event.detail.value;

    this.reviewForm = {
        ...this.reviewForm,
        [field]: value
    };
    if (field === 'Update_Progress__c') {
        this.progressChanged = true;
    }
    // if (field === 'Update_Progress__c') {
    //     const totalAfterUpdate =
    //         Number(this.totalProgress || 0) +
    //         Number(value || 0);

    //    // if (totalAfterUpdate >= 100) {
    //         // this.reviewForm = {
    //         //     ...this.reviewForm,
    //         //     Review_Date__c: null
    //         // };
            
    //     //}
    // }
}
// get isReviewDateRequired() {
//     const existingProgress = Number(this.totalProgress || 0);
//     const newProgress = Number(this.reviewForm.Update_Progress__c || 0);

//     return (existingProgress + newProgress) < 100;
// }
get isReviewDateRequired() {

    // When edit modal first opens
    if (this.isEditReviewMode && !this.progressChanged) {
         if (!this.reviewForm.Review_Date__c) {
            return false;
        }
        return true;
    }

    const enteredProgress =
        Number(this.reviewForm.Update_Progress__c || 0);

    let effectiveTotal;

    if (this.isEditReviewMode) {
        effectiveTotal =
            Number(this.totalProgress || 0)
            - Number(this.originalReviewProgress || 0)
            + enteredProgress;
    } else {
        effectiveTotal =
            Number(this.totalProgress || 0)
            + enteredProgress;
    }

    return effectiveTotal < 100;
}

async saveReviewGoal() {
    const missingFields = [];

    if (!this.reviewForm.Progress_Summary__c) {
        missingFields.push('Progress Summary');
    }

    // if (!this.reviewForm.Review_Date__c) {
    //     missingFields.push('Review Date');
    // }

    if (!this.reviewForm.Update_Progress__c) {
        missingFields.push('Update Progress %');
    }
    let totalAfterUpdate;

    if (this.isEditReviewMode) {
        totalAfterUpdate =
            Number(this.totalProgress || 0)
            - Number(this.originalReviewProgress || 0)
            + Number(this.reviewForm.Update_Progress__c || 0);
    } else {
        totalAfterUpdate =
            Number(this.totalProgress || 0)
            + Number(this.reviewForm.Update_Progress__c || 0);
    }

    if ( totalAfterUpdate < 100 && !this.reviewForm.Review_Date__c ) {
        missingFields.push('Review Date');
    }

    if (missingFields.length) {
        this.showToast(
            'Missing Information',
            `Please complete: ${missingFields.join(', ')}`,
            'error'
        );
        return;
    }

    /* const allocatedBudget = Number(
        this.selectedGoal.Budget__c || 0
    );

    const newBudgetSpent = Number(
        this.reviewForm.BudgetSpent__c || 0
    ); */

    /* if (newBudgetSpent > 0 && allocatedBudget > 0) {
        let effectiveBudgetSpent = this.totalBudgetSpent;

        if (this.isEditReviewMode) {
            const oldReview = this.goalReviews.find(
                r => r.Id === this.editingReviewId
            );

            if (oldReview?.BudgetSpent__c) {
                effectiveBudgetSpent -= Number(
                    oldReview.BudgetSpent__c
                );
            }
        }

        if (
            effectiveBudgetSpent + newBudgetSpent >
            allocatedBudget
        ) {
            this.showToast(
                'Invalid Budget',
                `Budget exceeds allocated amount of $${allocatedBudget}.`,
                'error'
            );
            return;
        }
    } */

    const payload = {
        ...this.reviewForm,
        Id: this.editingReviewId,
        Support_Goals_To_GoalReview__c: this.selectedGoalId
    };

    try {
        const result = await saveGoalReview({
            reviewRec: payload
        });

        this.goalReviews = result.reviews || [];
        this.totalProgress = result.totalProgress || 0;
        this.remainingProgress = result.remainingProgress || 0;
        this.isGoalCompleted = result.isCompleted === true;

        if (this.isGoalCompleted) {
            this.selectedGoal = {
                ...this.selectedGoal,
                Status__c: 'Completed'
            };
        } else {
            this.selectedGoal = {
                ...this.selectedGoal,
                Status__c: 'In Progress'
            };
        }

        this.showReviewModal = false;
         this.progressChanged = false;
        await this.loadGoalReviews();
        await this.loadDashboardMetrics();

        this.showToast(
            'Success',
            this.isEditReviewMode
                ? 'Review updated successfully.'
                : 'Review added successfully.',
            'success'
        );

    } catch (error) {
        console.error(error);

        this.showToast(
            'Error',
            error?.body?.message || 'Error saving review.',
            'error'
        );
    }
}

formatDate(dateValue) {
    if (!dateValue) {
        return '';
    }

    return new Date(dateValue).toLocaleDateString(
        'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    );
}

async loadGoalReviews() {
    if (!this.selectedGoalId) {
        return;
    }

    try {
        const result = await getGoalReviews({
            goalId: this.selectedGoalId
        });

        this.goalReviews = (result.reviews || []).map(review => ({
            ...review,
            formattedReviewDate: this.formatDate(
                review.CreatedDate
            )
        }));

        this.totalProgress = result.totalProgress || 0;
        this.remainingProgress = result.remainingProgress || 0;
        this.isGoalCompleted = result.isCompleted === true;

        this.totalBudgetSpent = result.totalBudgetSpent || 0;
        this.budgetSpentPercent = Math.round(
            result.budgetSpentPercent || 0
        );

        if (this.isGoalCompleted) {
            this.selectedGoal = {
                ...this.selectedGoal,
                Status__c: 'Completed'
            };
        }
        this.loadParticipants();

    } catch (error) {
        console.error('Error loading goal reviews', error);

        this.showToast(
            'Error',
            'Unable to load goal reviews.',
            'error'
        );
    }
}

async loadGoalNotes() {
    if (!this.selectedGoalId) {
        this.goalNotes = [];
        return;
    }

    try {
        const notes = await getNotesByGoal({
            goalId: this.selectedGoalId
        });

        const mappedNotes = (notes || []).map(note => ({
            ...note,
            formattedDate: this.formatDate(
                note.Entry_Date__c
            ),
            billableLabel: note.Billable__c
                ? 'Billable'
                : 'Non-Billable',
            badgeClass: note.Billable__c
                ? 'slds-badge slds-theme_success'
                : 'slds-badge slds-theme_inverse'
        }));

        this.goalNotes = [...mappedNotes];

    } catch (error) {
        console.error('Error loading goal notes', error);

        this.goalNotes = [];

        this.showToast(
            'Error',
            'Unable to load goal notes.',
            'error'
        );
    }
}

handleAddNote() {
    if (!this.selectedGoalId) {
        this.showToast(
            'Select a Goal',
            'Please select a goal first.',
            'error'
        );
        return;
    }

    this.dispatchEvent(
        new CustomEvent('addnote', {
            detail: {
                goalId: this.selectedGoalId,
                participantId: this.selectedParticipantId
            }
        })
    );
}

    handleCloseNotes() {
        this.showNotesModal = false;
    }

    async handleNoteSaved() {
        this.showNotesModal = false;
        this.goalNotes = [];

        await this.loadGoalNotes();
    }

    async handleSubGoalStatusChange(event) {
        const subGoalId = event.target.dataset.id;
        const newStatus = event.detail.value;

        try {
            await updateSubGoalStatus({
                subGoalId,
                status: newStatus
            });

            this.selectedSubGoals = this.selectedSubGoals.map(sg =>
                sg.id === subGoalId
                    ? {
                        ...sg,
                        status: newStatus
                    }
                    : sg
            );

            this.showToast(
                'Updated',
                'Sub-goal status updated successfully.',
                'success'
            );

            await this.loadGoalReviews();
        } catch (error) {
            console.error(error);

            this.showToast(
                'Error',
                error?.body?.message || 'Failed to update sub-goal.',
                'error'
            );
        }
    }

    // ============================================================
    //  ADD THESE GETTERS into SupportCoordinatorGoals class
    //  They power the new template bindings in goalDetails_template.html
    // ============================================================

    /** Remaining budget amount */
    get remainingBudget() {
        const total  = Number(this.selectedGoal?.Budget__c   || 0);
        const spent  = Number(this.totalBudgetSpent           || 0);
        return (total - spent).toFixed(2);
    }

    /** Big % colour class on budget card */
    get budgetPctClass() {
        const pct = Number(this.budgetSpentPercent || 0);
        if (pct >= 90) return 'gd-budget-pct gd-budget-pct--danger';
        if (pct >= 70) return 'gd-budget-pct gd-budget-pct--warning';
        return 'gd-budget-pct gd-budget-pct--ok';
    }

    /** Status pill class */
    get goalStatusClass() {
        const s = this.selectedGoal?.Status__c || '';
        if (s === 'Completed')  return 'gd-pill gd-pill--green';
        if (s === 'In Progress') return 'gd-pill gd-pill--blue';
        if (s === 'Active')      return 'gd-pill gd-pill--teal';
        return 'gd-pill gd-pill--gray';
    }

    /** Priority pill class */
    get goalPriorityClass() {
        const p = this.selectedGoal?.Priority__c || '';
        if (p === 'High')   return 'gd-pill gd-pill--red';
        if (p === 'Medium') return 'gd-pill gd-pill--amber';
        return 'gd-pill gd-pill--gray';
    }

    /** Budget notice card CSS class */
    get budgetNoticeClass() {
        const pct = Number(this.budgetSpentPercent || 0);
        if (pct >= 90) return 'gd-notice gd-notice--danger  slds-m-top_small';
        if (pct >= 70) return 'gd-notice gd-notice--warning slds-m-top_small';
        return 'gd-notice gd-notice--neutral slds-m-top_small';
    }

    get budgetNoticeIcon() {
        const pct = Number(this.budgetSpentPercent || 0);
        return pct >= 70 ? 'utility:warning' : 'utility:info';
    }

    get budgetNoticeTitle() {
        const pct = Number(this.budgetSpentPercent || 0);
        if (pct >= 90) return 'Critical — budget exhausted';
        if (pct >= 70) return 'Warning — budget running low';
        return 'Budget status';
    }

    get budgetNoticeMsg() {
        if (!this.selectedGoalId) return 'Select a goal to see funding info.';
        const pct = Number(this.budgetSpentPercent || 0);
        if (pct >= 90) return 'Remaining budget is critically low. Approve carefully.';
        if (pct >= 70) return 'Monitor participant spending closely.';
        return 'Budget is within acceptable range.';
    }

    /** First letter of participant name for avatar */
    get participantInitial() {
        if (!this.selectedParticipantName) return '';
        return this.selectedParticipantName.charAt(0).toUpperCase();
    }

    get goalsContainerClass() {
        const count = this.p?.previewGoals?.length || 1;
        return `goal-progress-container goals-count-${count}`;
    }  

    get formattedTargetDate() {
        if (!this.selectedGoal?.Target_Date__c) {
            return '';
        }

        const [year, month, day] = this.selectedGoal.Target_Date__c.split('-');
        return `${day}/${month}/${year}`;
    }

    handlePathClick(event) {
        // const targetStage = event.currentTarget.dataset.stage;
        const targetStage = event.target.value || event.currentTarget?.dataset?.stage;

        // BASICS always allowed
        if (targetStage === 'BASICS') {
            this.currentStage = 'BASICS';
            return;
        }

        // Going to SMART
        if (targetStage === 'SMART') {
            if (!this.validateBasics()) {
                return;
            }
            this.currentStage = 'SMART';
            return;
        }

        // Going to ACTIONS
        if (targetStage === 'ACTIONS') {
            if (!this.validateBasics()) {
                return;
            }

            if (!this.validateSmart()) {
                return;
            }

            this.currentStage = 'ACTIONS';
        }
    }
    validateSmartGoal() {
        let isValid = true;

        this.template.querySelectorAll('lightning-textarea').forEach(field => {
            if (!field.value || !field.value.trim()) {
                field.setCustomValidity('Complete this field.');
                isValid = false;
            } else {
                field.setCustomValidity('');
            }
            field.reportValidity();
        });

        return isValid;
    }
    get showSpecificMuteIcon() {
        return this.activeSpeechField === 'Specific__c';
    }

    get showMeasurableMuteIcon() {
        return this.activeSpeechField === 'Measurable__c';
    }

    get showAchievableMuteIcon() {
        return this.activeSpeechField === 'Achievable__c';
    }

    get showRelevantMuteIcon() {
        return this.activeSpeechField === 'Relevant__c';
    }

    handleFocus(event) {
        const field = event.currentTarget.dataset.field;
        const index = event.currentTarget.dataset.index;
        console.log('handleFocus field:', field, 'index:', index);

        const speechComps = this.template.querySelectorAll('c-speech-to-text');
        speechComps.forEach(comp => {
            if (comp.stopListening) {
                comp.stopListening();
            }
        });

        if (index !== undefined) {
            const numIndex = parseInt(index, 10);
            this.activeSpeechField = `subgoal-${numIndex}`;
            this.subGoals = this.subGoals.map((sg, i) => ({
                ...sg,
                showMuteIcon: i === numIndex
            }));
        } else {
            this.activeSpeechField = field;
            this.subGoals = this.subGoals.map(sg => ({
                ...sg,
                showMuteIcon: false
            }));
        }
    }

    handleBlur(event) {
        const field = event.currentTarget.dataset.field;
        const index = event.currentTarget.dataset.index;
        let fieldKey = index !== undefined ? `subgoal-${index}` : field;
        console.log('handleBlur fieldKey:', fieldKey);

        setTimeout(() => {
            if (this.activeSpeechField === fieldKey) {
                this.activeSpeechField = null;
                this.subGoals = this.subGoals.map(sg => ({
                    ...sg,
                    showMuteIcon: false
                }));
            }
        }, 300);
    }

    handleTranscript(event) {
        const type = event.currentTarget.dataset.type;
        const field = event.currentTarget.dataset.field;
        const text = event.detail.text;

        if (type === 'goal') {
            this.goal = {
                ...this.goal,
                [field]: (this.goal[field] || '') + text
            };
        } else if (type === 'subgoal') {
            const index = parseInt(event.currentTarget.dataset.index, 10);

            this.subGoals[index] = {
                ...this.subGoals[index],
                [field]: (this.subGoals[index][field] || '') + text
            };

            this.subGoals = [...this.subGoals];
        }
    }

    handleClear(event) {
        const type = event.currentTarget.dataset.type;
        const field = event.currentTarget.dataset.field;

        if (type === 'goal') {
            this.goal = {
                ...this.goal,
                [field]: ''
            };
        } else if (type === 'subgoal') {
            const index = parseInt(event.currentTarget.dataset.index, 10);

            this.subGoals[index] = {
                ...this.subGoals[index],
                [field]: ''
            };

            this.subGoals = [...this.subGoals];
        }
    }
    resetGoalFields() {
        this.goal = {
            ...this.goal,
            Specific__c: '',
            Measurable__c: '',
            Achievable__c: '',
            Relevant__c: ''
        };

        this.showMuteIcon = false;
        this.activeSpeechField = null;
    }

}