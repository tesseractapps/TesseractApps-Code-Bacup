import { LightningElement, track, api } from 'lwc';
    import saveParticipant from '@salesforce/apex/SupportParticipantController.saveParticipants';
    import getParticipantsPaged from '@salesforce/apex/SupportParticipantController.getParticipantsPaged';
    import getParticipantDetails from '@salesforce/apex/SupportParticipantController.getParticipantDetails';
    import updateParticipantPin from '@salesforce/apex/SupportParticipantController.updateParticipantPin';
    import { ShowToastEvent } from 'lightning/platformShowToastEvent';
    import fetchParticipantNDISCatalogue from '@salesforce/apex/SupportParticipantController.fetchParticipantNDISCatalogue';
    import fetchSupportCoordinatorCatalogue from '@salesforce/apex/SupportParticipantController.fetchSupportCoordinatorCatalogue';
    import fetchParticipantCatalogues from '@salesforce/apex/SupportParticipantController.fetchParticipantCatalogues';
    import fetchParticipantSupportCoordinatorCatalogues from '@salesforce/apex/SupportParticipantController.fetchParticipantSupportCoordinatorCatalogues';
    import saveParticipantCatalogues from '@salesforce/apex/SupportParticipantController.saveParticipantCatalogues';
    import fetchParticipantServiceGroups from '@salesforce/apex/SupportParticipantController.fetchParticipantServiceGroups';
    import fetchServiceTypes from '@salesforce/apex/SupportParticipantController.fetchServiceTypes';
    import fetchCoordinatorServiceTypes from '@salesforce/apex/SupportParticipantController.fetchCoordinatorServiceTypes';
    import getProviders from '@salesforce/apex/Support_ProviderController.getProviders';
    import fetchServiceTypesByParticipant from '@salesforce/apex/SupportParticipantController.fetchServiceTypesByParticipant';
    import fetchSupportItemsForEntry from '@salesforce/apex/SupportParticipantController.fetchSupportItemsForEntry';
    import fetchParticipantsForEntry from '@salesforce/apex/SupportParticipantController.fetchParticipantsForEntry';
    import saveSupportEntry from '@salesforce/apex/SupportParticipantController.saveSupportEntry';
    import getSupportEntriesPaged from '@salesforce/apex/SupportParticipantController.getSupportEntriesPaged';
    import createUpdatepdateParticipantContacts from "@salesforce/apex/SupportParticipantController.createUpdatepdateParticipantContacts";
    import deleteContactAttachment from '@salesforce/apex/SupportParticipantController.deleteContactAttachment';
    import getContactAttachmentCounts from '@salesforce/apex/SupportParticipantController.getContactAttachmentCounts';
    import getContactAttachments from '@salesforce/apex/SupportParticipantController.getContactAttachments';

    export default class SupportCoordinatorParticipantManagement extends LightningElement {
    @track isOpenedFromDashboard = false;
    
    @api
    openFromDashboard() {
        console.log('==============================');
        console.log('📥 openFromDashboard() called');
    
        this.isOpenedFromDashboard = true;
    
        this.SuccessMessage = 'Participant created successfully!';
        this.createorEditParticipant = 'Create Participant';
        this.subParticipantheader =
            'Enter Participant details and plan information';
    
        this.participantflag = false;
        this.createParticipantshowModal = true;
        this.showAddSupportCategoryModal = false;
        this.showAddSupportCoordinatorCategoryModal = false;
        this.createCurrentStep = 'createstep1';
    
        this.contactList = [
            {
                id: 1,
                firstName: '',
                lastName: '',
                contactNumber: '',
                email: '',
                contactType: '',
                notify: false,
                firstNamePlaceholder: 'Enter Name',
                lastNamePlaceholder: 'Enter Name',
                phonePlaceholder: 'Enter Number',
                emailPlaceholder: 'Enter Email',
                showAdd: true,
                addButtonClass: 'add-visible'
            }
        ];
    
        this.resetParticipantFields();
    
        console.log('✅ Participant popup opened from dashboard');
        console.log('==============================');
    }
    @track createParticipantshowModal = false;
    @track isLoading = true;
    @track participants = [];
    @track allParticipants = [];
    @track currentPage = 1;
    @track pageSize = 10;
    @track totalPages = 0;
    @track totalRecords = 0;
    @track participantflag = true;
    @track notesflag = false;
    @track participantIdforchild;
    @track budgetForecastflag = false;
    @track showSupportCategoriesPage = false;
    @track showAddSupportCategoryModal = false;

    @track selectedServiceType;
    @track selectedServiceTypes=[];
    @track providerSpendingFlag = false;
    @track selectedState;
    @track ndisCatalogue = [];
    @track selectedCatalogueMap = {}; // key = catalogueId
    @track selectedCoordinatorCatalogueMap = {};
    @track catPageSize = 5;
    @track catCurrentPage = 1;
    @track catTotalPages = 0;
    @track budgetAllocation;
    @track currentAmountSpent;
    @track serviceGroups = [];
    isEditMode = false;
    @track providerOptions = [];
    @track expandedServiceType = null;
    //manual entry 
    @track supportEntries = [];
    @track entryPageSize = 10;
    @track entryCurrentPage = 1;
    @track entryTotalPages = 0;
    @track entryTotalRecords = 0;
    @track entryLoading = false;
    @track showEntryModal = false;
    @track editingEntryId = null;
    @track entryForm = {
        participantId: null,
        serviceType: null,
        supportItemName: null,
        providerId: null,
        serviceDate: null,
        hours: null,
        rate: null,
        totalAmount: null,
        claimStatus: null,
        dataSource: null,
        notes: null
    };
    @track participantOptions = [];
    @track serviceTypeOptionsForEntry = [];
    @track supportItemOptions = [];
    @track providerOptionsForEntry = [];

    selectedType = 'all';
    searchParticipant = '';
    @track createCurrentStep = 'createstep1';
    @track firstName;
    @track lastName;
    @track dob;
    @track phone;
    @track email;
    @track ndisNumber;
    @track selectedClassification;
    @track selectedTypeOfIndustry ='NDIS';
    @track aboutParticipant;
    @track errorMessage;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track planStart;
    @track planEnd;
    @track planBudget;
    @track budgetSpent;
    @track supportCategory;
    @track riskLevel;
    //@track emergencyContact;
    @track providerBudget;
    @track pendingServiceGroups = [];
    @track searchSupportItem;
    filteredCatalogue = [];
    @track participantDetails = {};

    isCoordinatorEditMode = false;
    @track showAddSupportCoordinatorCategoryModal = false;
    // @track selectedCoordinatorServiceType = 'Support Coordination';
    @track selectedCoordinatorServiceType;
    @track selectedCoordinatorState;
    @track coordinatorCatalogue = [];
    @track coordinatorPendingServiceGroups = [];
    @track displayedCoordinatorServiceGroups = [];
    @track coordinatorCurrentAmountSpent;
    @track budgetCoordinatorAllocation;
    @track searchCoordinatorSupportItem;
    @track filteredCoordinatorCatalogue = [];
    @track coordinatorCatPageSize = 5;
    @track coordinatorCatCurrentPage = 1;
    @track coordinatorCatTotalPages = 1;
    @track expandedCoordinatorServiceType = null;
     @track showBudgetModal = false;
    @track selectedBudgetParticipantId;
      @track SuccessMessage;
   

    @track typeOfIndustry=[
        { label: 'NDIS', value: 'NDIS' },
        { label: 'Non-NDIS', value: 'Non-NDIS' }
      //{ label: 'Aged Care', value: 'Aged Care' }
      ];
   /*  pageSizeOptions = [
        { label: '10', value: 10 },
        { label: '20', value: 20 },
        { label: '50', value: 50 }
    ]; */
     @track pageSizeOptions = [ 10, 20, 50 ];
    @track supportCategoryOptions = [
        { label: 'Core Supports', value: 'Core Supports' },
        { label: 'Capacity Building', value: 'Capacity Building' },
        { label: 'Capital Supports', value: 'Capital Supports' },
    ];
    @track riskLevelOptions = [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' }
    ];
    @track showDetailsPage = false;
    @track selectedParticipant = null;
    @track isPinned = false;
    pinUpdateTimers = {};
    @track createorEditParticipant = 'Create Participant';
    @track subParticipantheader = 'Enter Participant details and plan information';
    @track editingParticipantId = null;
    @track status = 'Active';
    @track statusOptions = [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
    ];
    AVATAR_COLORS = [
        '#0C78BA',
        '#1E7F43',
        '#5B2C6F',
        '#2C2C2C',
        '#7D3C98'
    ];

    @track serviceTypeOptions = [];
    @track coordinatorServiceTypeOptions = [];
    get stateOptions() {
        return [
            { label: "ACT", value: "ACT" },
            { label: "NSW", value: "NSW" },
            { label: "VIC", value: "VIC" },
            { label: "QLD", value: "QLD" },
            { label: "SA", value: "SA" },
            { label: "TAS", value: "TAS" },
            { label: "WA", value: "WA" },
            { label: "NT", value: "NT" }
        ];
    }
    claimStatusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Generated', value: 'Generated' },

    ];

    dataSourceOptions = [
        { label: 'Manual', value: 'Manual' },
        { label: 'System', value: 'System' }
    ];
    catPageSizeOptions = [ 10, 20, 50 ];
    @track classificationOption = [
        { label: 'Physical Disability', value: 'Physical Disability' },
        { label: 'Wheelchair User', value: 'Wheelchair User' },
        { label: 'Intellectual Disability', value: 'Intellectual Disability' },
        { label: 'Down Syndrome', value: 'Down Syndrome' },
        { label: 'Autism Spectrum Disorder (ASD)', value: 'Autism Spectrum Disorder (ASD)' },
        { label: 'Cerebral Palsy', value: 'Cerebral Palsy' },
        { label: 'Psychosocial Disability', value: 'Psychosocial Disability' },
        { label: 'Schizophrenia', value: 'Schizophrenia' },
        { label: 'Bipolar Disorder', value: 'Bipolar Disorder' },
        { label: 'Depression / Anxiety', value: 'Depression / Anxiety' },
        { label: 'Neurological Condition', value: 'Neurological Condition' },
        { label: 'Epilepsy', value: 'Epilepsy' },
        { label: 'Multiple Sclerosis', value: 'Multiple Sclerosis' },
        // { label: 'Parkinson’s Disease', value: 'Parkinson’s Disease' },
        { label: "Parkinson's Disease", value: "Parkinson's Disease" },
        { label: 'Acquired Brain Injury (ABI)', value: 'Acquired Brain Injury (ABI)' },
        { label: 'Stroke-related Disability', value: 'Stroke-related Disability' },
        { label: 'Spinal Cord Injury', value: 'Spinal Cord Injury' },
        { label: 'Sensory Impairment', value: 'Sensory Impairment' },
        { label: 'Vision Impairment (Blind / Low Vision)', value: 'Vision Impairment (Blind / Low Vision)' },
        { label: 'Hearing Impairment (Deaf / Hard of Hearing)', value: 'Hearing Impairment (Deaf / Hard of Hearing)' },
        { label: 'Developmental Delay', value: 'Developmental Delay' },
        { label: 'Global Developmental Delay', value: 'Global Developmental Delay' },
        { label: 'Genetic Disorders', value: 'Genetic Disorders' },
        { label: 'Rare Disorders', value: 'Rare Disorders' },
        { label: 'Chronic Illness', value: 'Chronic Illness' },
        { label: 'Dementia', value: 'Dementia' },
        { label: 'Behavioral Support Needs', value: 'Behavioral Support Needs' },
        { label: 'High Support Needs', value: 'High Support Needs' },
        { label: 'Mobility Impairment', value: 'Mobility Impairment' },
        { label: 'Speech / Communication Impairment', value: 'Speech / Communication Impairment' },
        { label: 'Learning Disability', value: 'Learning Disability' },
        { label: 'Other', value: 'Other' }
    ];
    @track contactList = [
        {
            id: 1,
            firstName: '',
            lastName: '',
            contactNumber: '',
            email: '',
            contactType: '', // NEW FIELD
            notify:false,
            firstNamePlaceholder: 'Enter Name',
            lastNamePlaceholder: 'Enter Name',
            phonePlaceholder: 'Enter Number',
            emailPlaceholder: 'Enter Email',
            showAdd: true,
            addButtonClass: 'add-visible'
        }
    ];
  
    @track showContactTypeModal = false;
    @track newContactTypeName = '';
    @track customContactTypes = [];
    @track stagedDeleteTypes = [];          // ✅ ARRAY (not Set)
    @track activeContactRowIndex;
    @track previousContactType;  
    
  
    @track currentContactId;
    @track showContactAttachmentModal = false;
    @track uploadedFiles = [];
    @track totalfiles = [];
    @track isFileExpand = false;
    @track allowMultiple = true;
    @track documentedit = false;
    @track isFileAttached = false;
    @track recordIdForFileUpload = '';
    @track fileName = '';
    @track contactAttachments = [];
    @track showAttachmentListModal = false;
    @track selectedContactForFiles;
    @track selectedContactId;
    @track isModalOpen = false;
    @track currentUrl;
    @track isViewDoc = false;

  @track contactTypeOptions = [
      { label: 'Primary', value: 'Primary' },
      { label: 'Secondary', value: 'Secondary' },
      { label: 'Guardian', value: 'Guardian' },
      { label: 'Emergency', value: 'Emergency' },
      { label: 'Nominee', value: 'Nominee' },
      { label: 'Informal Supports', value: 'Informal Supports' },
      { label: 'NDIA Planner', value: 'NDIA Planner' },
      { label: 'Local Area Coordinator', value: 'Local Area Coordinator' },
      { label: 'Support Coordinator', value: 'Support Coordinator' },
      { label: 'Specialist Support Coordinator', value: 'Specialist Support Coordinator' },
      { label: 'NDIS Provider', value: 'NDIS Provider' },
      { label: 'Support Worker', value: 'Support Worker' },
      { label: 'Key Worker', value: 'Key Worker' },
      { label: 'Allied Health Professionals', value: 'Allied Health Professionals' },
      { label: 'Psychologist', value: 'Psychologist' },
      { label: 'Occupational Therapist', value: 'Occupational Therapist' },
      { label: 'Speech Therapist', value: 'Speech Therapist' },
      { label: 'Physiotherapist', value: 'Physiotherapist' },
      { label: 'Behaviour Support Practitioner', value: 'Behaviour Support Practitioner' },
      { label: 'Mental Health Clinicians', value: 'Mental Health Clinicians' },
      { label: 'GP / Medical Specialists', value: 'GP / Medical Specialists' },
      { label: 'SIL Provider', value: 'SIL Provider' },
      { label: 'SDA Provider', value: 'SDA Provider' },
      { label: 'ILO Provider', value: 'ILO Provider' },
      { label: 'Tenancy / Housing Provider', value: 'Tenancy / Housing Provider' },
      { label: 'Advocates', value: 'Advocates' },
      { label: 'Plan Manager', value: 'Plan Manager' },
      { label: 'NDIA', value: 'NDIA' },
      { label: 'Self-Managed Participant', value: 'Self-Managed Participant' },
      { label: 'Corrective Services / Justice System', value: 'Corrective Services / Justice System' },
      { label: 'Child Protection', value: 'Child Protection' },
      { label: 'Housing NSW', value: 'Housing NSW' },
      { label: 'Hospitals & Emergency Services', value: 'Hospitals & Emergency Services' },
      { label: 'Add New', value: 'Add New Contact Type' }
  ];

    get isCatFirstPage() {
        return this.catCurrentPage === 1;
    }

    get isCatLastPage() {
        return this.catCurrentPage === this.catTotalPages;
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
    get step1Class() {
         return this.createCurrentStep === 'createstep1' ? '' : 'slds-hide';
    }
    get step2Class() { 
        return this.createCurrentStep === 'createstep2' ? '' : 'slds-hide'; 
    }
    get step3Class() { 
        return this.createCurrentStep === 'createstep3' ? '' : 'slds-hide'; 
    }
    get step4Class() { 
        return this.createCurrentStep === 'createstep4' ? '' : 'slds-hide'; 
    }
    get totalSteps() {
         return 4; 
    }

    connectedCallback() {
        this.loadParticipants();
        this.loadServiceTypes();
        this.loadCoordinatorServiceTypes();
        //this.loadProviders();

    }
    
    get currentStepNumber() { 
        return Number(this.createCurrentStep.replace('createstep', '')); 
    }
    get showPrevious()  { 
        return this.currentStepNumber > 1; 
    }
    get showNext() { 
        return this.currentStepNumber < this.totalSteps; 
    }
    get showSave()      { 
        return this.currentStepNumber === this.totalSteps; 
    }
    get totalCatalogueRecords() {
        return this.searchSupportItem
            ? this.filteredCatalogue.length
            : this.ndisCatalogue.length;
    }
    get showSkip() { 
        return (!this.showAddSupportCategoryModal && this.createCurrentStep === 'createstep3') || (!this.showAddSupportCoordinatorCategoryModal && this.createCurrentStep === 'createstep2') ; 
    }   
    handleCreatePrevious() {
        if (this.currentStepNumber > 1) {
            this.createCurrentStep = 'createstep' + (this.currentStepNumber - 1);
        }
    }

    handleCreateNext() {

        const errors =
            this.validateStepFields(
                this.createCurrentStep
            );

        console.log(
            'Validation Errors:',
            JSON.stringify(errors)
        );

        if (errors.length > 0) {

            // const isContactsStepWithPrimary = isContactsStep && this.contactList.some(c => c.contactType === 'Primary');
            // if (!isContactsStep || isContactsStepWithPrimary) {
            //     return;
            // }

            return;
        }

        if (
            this.currentStepNumber <
            this.totalSteps
        ) {

            this.createCurrentStep =
                `createstep${this.currentStepNumber + 1}`;
        }
    }

    hashString(str) {
        let hash = 0;
        if (!str) return hash;

        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    async loadParticipants() {
        console.log('📥 loadParticipants START');
        console.log('➡️ Page Size:', this.pageSize, '➡️ Page Number:', this.currentPage);

        this.isLoading = true;

        try {
            const res = await getParticipantsPaged({
                pageSize: this.pageSize,
                pageNumber: this.currentPage,
                searchName: this.searchParticipant || '',
                participantType: this.selectedType || 'all'
            });

            console.log(
                '✅ Apex response received:',
                JSON.stringify(res, null, 2)
            );

            if (res.status !== 'SUCCESS') {
                console.warn('⚠️ Response status not SUCCESS:', res.status);
                return;
            }

            this.totalRecords = res.totalCount;
            this.totalPages = res.totalPages;

            console.log('📊 Total Records:', this.totalRecords);
            console.log('📄 Total Pages:', this.totalPages);

            // this.participants = res.records.map((p, index) => {
            this.allParticipants = res.records.map((p, index) => {
                console.log(`🔹 Processing participant [${index + 1}]`, {
                    Id: p.Id,
                    Name: p.Name
                });

                // 🔹 Risk class
                const riskBase =
                p.Risk_Level__c === "High" ? "riskHigh" :
                p.Risk_Level__c === "Medium" ? "riskMedium" :
                p.Risk_Level__c === "Low" ? "riskLow" : "";

                // 🔹 Budget %
                const budgetUsedPercent = this.getBudgetPercent(
                    p.Total_Plan_Budget__c,
                    p.Budget_Spent_to_Date__c
                );

                const remainingBudget =
                    (p.Total_Plan_Budget__c || 0) -
                    (p.Budget_Spent_to_Date__c || 0);

                console.log('💰 Budget Info', {
                    total: p.Total_Plan_Budget__c,
                    spent: p.Budget_Spent_to_Date__c,
                    remaining: remainingBudget,
                    percent: budgetUsedPercent
                });

                // ⭐ Avatar color (stable)
                const colorIndex =
                    Math.abs(this.hashString(p.Name)) % this.AVATAR_COLORS.length;

                const avatarColor = this.AVATAR_COLORS[colorIndex];
                const displayName =
                        p.First_Name__c || p.Last_Name__c
                            ? `${p.First_Name__c || ''} ${p.Last_Name__c || ''}`.trim()
                            : p.Name;

                  const   formattedTotalBudget=
                    `$${Number(
                        p.Total_Plan_Budget__c || 0
                    ).toLocaleString(
                        'en-AU',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}`;

                const formattedRemainingBudget=
                    `$${Number(
                        remainingBudget || 0
                    ).toLocaleString(
                        'en-AU',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}`;

                return {
                    id: p.Id,
                    //name: p.Name,
                   // name: `${p.First_Name__c || ''} ${p.Last_Name__c || ''}`.trim(),
                    name: displayName,
                    email: p.Email__c,
                    phone: p.Phone__c,
                    emergencyContact: p.Emergency_Contact__c,
                    ndisNumber: p.NDIS_Number__c,
                    //dob: p.Date_of_Birth__c,
                    dob: p.Date_of_Birth__c
                        ? new Date(p.Date_of_Birth__c).toLocaleDateString('en-GB')
                        : '',

                    

                    planStartDate: p.Plan_Start_Date__c,
                    planEndDate: p.Plan_End_Date__c,
                    //planPeriod: `${p.Plan_Start_Date__c} - ${p.Plan_End_Date__c}`,
                    planPeriod:
                        p.Plan_Start_Date__c && p.Plan_End_Date__c
                            ? `${new Date(p.Plan_Start_Date__c).toLocaleDateString('en-GB')} - ${new Date(p.Plan_End_Date__c).toLocaleDateString('en-GB')}`
                            : '',

                    risk: p.Risk_Level__c,
                    supportCategory: p.Support_Category__c,
                    // totalBudget: p.Total_Plan_Budget__c,
                    // remainingBudget,
                    totalBudget: p.Total_Plan_Budget__c
                        ? `$${Number(p.Total_Plan_Budget__c).toFixed(2)}`
                        : '$0.00',

                    remainingBudget: `$${Number(remainingBudget || 0).toFixed(2)}`,
                    formattedTotalBudget:formattedTotalBudget,
                    formattedRemainingBudget:formattedRemainingBudget,
                    budgetUsedPercent,
                    budgetStyle: `width:${budgetUsedPercent}%`,

                    initials: this.getInitials(displayName),

                    // ⭐ Avatar properties
                    avatarColor,
                    avatarStyle: `background-color:${avatarColor};`,

                    isPinned: p.Is_Pinned__c === true,
                    pinIconName: p.Is_Pinned__c ? 'keep' : 'keep_off',

                    riskClassFull: `${riskBase} slds-text-heading_small slds-truncate`,
                   // abn:p.abn,
                    status:p.Status__c,
                    risklevel:p.Risk_Level__c,
                    industryType:p.Type_of_Industry__c,
                    classification:p.Classification__c,
                };
            });
            this.participants = [...this.allParticipants];
            console.log('✅ Participants mapped successfully');
            console.table(
                this.participants.map(p => ({
                    Name: p.name,
                    Risk: p.risk,
                    BudgetUsed: p.budgetUsedPercent + '%',
                    Pinned: p.isPinned
                }))
            );

        } catch (error) {
            console.error('❌ Error loading participants', error);
        } finally {
            this.isLoading = false;
            console.log('📤 loadParticipants END');
        }
    }

    getInitials(name) {
        if (!name) return 'NA';

        const parts = name.trim().split(' ');

        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }

        return (
            parts[0].charAt(0).toUpperCase() +
            parts[1].charAt(0).toUpperCase()
        );
    }

    getBudgetPercent(totalBudget, budgetSpent) {
        if (!totalBudget || !budgetSpent) return 0;

        const total = Number(totalBudget);
        const spent = Number(budgetSpent);

        if (total <= 0) return 0;

        const percent = (spent / total) * 100;

        // Clamp between 0 and 100
        return Math.min(100, Math.max(0, Math.round(percent)));
    }

    handleAddNewParticipant() {
        this.SuccessMessage='Participant created successfully!';
        console.log('Add New Participant button clicked');
        this.createorEditParticipant = 'Create Participant';
        this.subParticipantheader = 'Enter Participant details and plan information';
        // Example: open modal
        this.createParticipantshowModal = true;
        this.showAddSupportCategoryModal= false;
         this.createCurrentStep = 'createstep1';
        this.contactList = [
            {
                id: 1,
                firstName: '',
                lastName: '',
                contactNumber: '',
                email: '',
                contactType: '', // NEW FIELD,
                notify:false,
                firstNamePlaceholder: 'Enter Name',
                lastNamePlaceholder: 'Enter Name',
                phonePlaceholder: 'Enter Number',
                emailPlaceholder: 'Enter Email',
                showAdd: true,
                addButtonClass: 'add-visible'
            }
        ];
        this.resetParticipantFields();

        
    }

    // createParticipantcloseModal() {
    //     console.log('==============================');
    //     console.log('❌ createParticipantcloseModal called');

    //     console.log('participantflag BEFORE:', this.participantflag);
    //     console.log(
    //         'createParticipantshowModal BEFORE:',
    //         this.createParticipantshowModal
    //     );

    //     this.createParticipantshowModal = false;
    //     this.participantflag = true;

    //     this.resetParticipantFields();

    //     console.log('participantflag AFTER:', this.participantflag);
    //     console.log(
    //         'createParticipantshowModal AFTER:',
    //         this.createParticipantshowModal
    //     );

    //     console.log('Dispatching close event to dashboard');

    //     this.dispatchEvent(
    //         new CustomEvent('close')
    //     );

    //     console.log('==============================');
    // }
   createParticipantcloseModal() {
        console.log('==============================');
        console.log('❌ createParticipantcloseModal called');

        this.createParticipantshowModal = false;

        if (this.isOpenedFromDashboard) {
            // opened from dashboard
            this.dispatchEvent(new CustomEvent('close'));
            this.isOpenedFromDashboard = false;
        } else {
            // opened inside participant management
            this.participantflag = true;
        }

        this.resetParticipantFields();

        console.log('participantflag:', this.participantflag);
        console.log('==============================');
    }
    // async createParticipantsaveParticipant() {
    //     console.log('Save Participant clicked');

    //  //   let missingFields = [];

    //     // PERSONAL INFO
    //     // if (!this.fullName) missingFields.push('Full Name');
    //     // if (!this.ndisNumber) missingFields.push('NDIS Number');
    //     // if (!this.dob) missingFields.push('Date of Birth');
    //     // if (!this.phone) missingFields.push('Phone Number');
    //     // if (!this.email) missingFields.push('Email Address');

    //     // // ADDRESS
    //     // if (!this.street) missingFields.push('Street');
    //     // if (!this.city) missingFields.push('Suburb');
    //     // if (!this.province) missingFields.push('State');
    //     // if (!this.postalcode) missingFields.push('Post Code');
    //     // if (!this.country) missingFields.push('Country');

    //     // // PLAN INFO
    //     // if (!this.planStart) missingFields.push('Plan Start Date');
    //     // if (!this.planEnd) missingFields.push('Plan End Date');
    //     // if (!this.planBudget) missingFields.push('Total Plan Budget');
    //     // if (!this.budgetSpent) missingFields.push('Budget Spent to Date');
    //     // if (!this.supportCategory) missingFields.push('Support Category');
    //     // if (!this.riskLevel) missingFields.push('Risk Level');
    //     // if (!this.emergencyContact) missingFields.push('Emergency Contact');

    //     // // ❌ Missing Fields
    //     // if (missingFields.length > 0) {
    //     //     this.dispatchEvent(
    //     //         new ShowToastEvent({
    //     //             title: 'Required Fields Missing',
    //     //             message: `Please fill: ${missingFields.join(', ')}`,
    //     //             variant: 'error',
    //     //             mode: 'dismissable'
    //     //         })
    //     //     );
    //     //     return;
    //     // }

    //     console.log('✅ All fields valid, proceeding to Apex…');

    //     // Prepare single participant payload
    //     const participantPayload = {
    //         id: this.editingParticipantId || null,
    //         //fullName: this.fullName,
    //         firstName:this.firstName,
    //         lastName:this.lastName,
    //         ndisNumber: this.ndisNumber,
    //         dob: this.dob,
    //         phone: this.phone,
    //         email: this.email,
    //         selectedClassification:this.selectedClassification,
    //         selectedTypeOfIndustry:this.selectedTypeOfIndustry,
    //         aboutParticipant:this.aboutParticipant,
    //         street: this.street,
    //         city: this.city,
    //         province: this.province,
    //         postalcode: this.postalcode,
    //         country: this.country,
    //         planStart: this.planStart,
    //         planEnd: this.planEnd,
    //         planBudget: this.planBudget,
    //         budgetSpent: this.budgetSpent,
    //         providerBudget:this.providerBudget,
    //         //supportCategory: this.supportCategory,
    //         supportCoordinationBudget:this.supportCoordinationBudget,
    //         riskLevel: this.riskLevel,
    //         //emergencyContact: this.emergencyContact,
    //         selectedServiceTypes:
    //             this.selectedServiceTypes || [],
    //         serviceGroups:
    //             this.pendingServiceGroups || [],  
    //         contactList:
    //             this.contactList || [],  
    //         status: this.status,

    //     };

    //     try {
    //         // 🔵 CALL BULK APEX (must send list)
    //         const newIds = await saveParticipant({
    //             participantsData: [participantPayload]
    //         });

    //         console.log('✔ Participant created with Ids:', newIds);

    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Success',
    //                 message: 'Participant created successfully!',
    //                 variant: 'success'
    //             })
    //         );
    //         this.loadParticipants();
    //         this.createParticipantshowModal = false;
    //         this.resetParticipantFields();

    //     } catch (error) {
    //         console.error('❌ Apex error:', error);

    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error Creating Participant',
    //                 message: error?.body?.message || 'Unknown error occurred',
    //                 variant: 'error'
    //             })
    //         );
    //     }
    // }

    async createParticipantsaveParticipant() {
        console.log('Save Participant clicked');

        const participantPayload = {
            id: this.editingParticipantId || null,

            firstName: this.firstName || '',
            lastName: this.lastName || '',
            ndisNumber: this.ndisNumber || '',
            dob: this.dob || null,
            phone: this.phone || '',
            email: this.email || '',

            selectedClassification: this.selectedClassification || '',
          //  selectedServiceTypes:this.selectedServiceTypes || '',
            selectedTypeOfIndustry: this.selectedTypeOfIndustry || '',
            aboutParticipant: this.aboutParticipant || '',

            street: this.street || '',
            city: this.city || '',
            province: this.province || '',
            postalcode: this.postalcode || '',
            country: this.country || '',

            planStart: this.planStart || null,
            planEnd: this.planEnd || null,
            planBudget:this.planBudget !== ''
                        ? Number(this.planBudget || 0)
                        : 0,
            //this.planBudget || 0,
            budgetSpent:this.budgetSpent !== ''       //this.budgetSpent || 0,
                        ? Number(this.budgetSpent || 0)
                        : 0,
            providerBudget: this.providerBudget !== ''      
                            ? Number(this.providerBudget || 0)
                            : 0,                      // this.providerBudget || 0,
            supportCoordinationBudget:  this.supportCoordinationBudget !== ''      
                            ? Number(this.supportCoordinationBudget || 0)
                            : 0,         //this.supportCoordinationBudget || 0,
           
            riskLevel: this.riskLevel || '',
            selectedServiceTypes: this.selectedServiceTypes || [],
            status: this.status || '',

            serviceGroups: (this.pendingServiceGroups || []).map(group => ({
                id: group?.id || null,
                serviceType: group?.serviceType || '',
                state: group?.state || '',
                budgetAllocation:  group?.budgetAllocation !== ''
                                     ? Number(group?.budgetAllocation || 0 )
                                    : 0,             //group?.budgetAllocation || 0,
               // amountSpent: group?.amountSpent || 0,
                budgetSpentToDate:  group?.budgetSpentToDate !== ''
                                    ? Number( group?.budgetSpentToDate || 0)
                                    : 0,             //group?.budgetSpentToDate || 0,
                supportItems: (group?.supportItems || []).map(item => {
                     console.log(
                        'Saving item:',
                        item?.supportItemName,
                        '| catalogueId:',
                        item?.catalogueId,
                        '| selected:',
                        item?.selected,
                        '| provider:',
                        item?.providerIds
                    );
                    return {
                        id: item?.id || null,
                        catalogueId: item?.catalogueId || '',
                        supportItemName: item?.supportItemName || '',
                        supportItemNumber: item?.supportItemNumber || '',
                        // providerId: item?.providerId || '',
                        // providerName: item?.providerName || '',
                        providerIds: item?.providerIds || [],
                        providerNames: item?.providerNames || [],
                        //state: item?.state || '',
                        preferredStaff:item?.preferredStaff || '',
                        amount:item?.amount !== ''
                                ? Number(item?.amount || 0)
                                : 0,        // item?.amount || 0,
                        //isActive: item?.selected || false
                        isActive: item?.selected === true
                    };
                    
                    
                })

            })),

             coordinatorServiceGroups: (this.coordinatorPendingServiceGroups || []).map(group => ({
                id: group?.id || null,
                serviceType: group?.serviceType || '',
                state: group?.state || '',
            //     budgetAllocation: group?.budgetAllocation || 0,
            //    // amountSpent: group?.amountSpent || 0,
            //     budgetSpentToDate: group?.budgetSpentToDate || 0,
                budgetAllocation:  group?.budgetAllocation !== ''
                                     ? Number(group?.budgetAllocation || 0 )
                                    : 0,             //group?.budgetAllocation || 0,
               // amountSpent: group?.amountSpent || 0,
                budgetSpentToDate:  group?.budgetSpentToDate !== ''
                                    ? Number( group?.budgetSpentToDate || 0)
                                    : 0,             //group?.budgetSpentToDate || 0,

                supportItems: (group?.supportItems || []).map(item => {
                     console.log(
                        'Saving item:',
                        item?.supportItemName,
                        '| catalogueId:',
                        item?.catalogueId,
                        '| selected:',
                       // item?.selected,
                        //'| provider:',
                       // item?.providerId
                    );
                    return {
                         id: item?.id || null,
                        catalogueId: item?.catalogueId || '',
                        supportItemName: item?.supportItemName || '',
                        supportItemNumber: item?.supportItemNumber || '',
                       // providerId: item?.providerId || '',
                       // providerName: item?.providerName || '',
                        state: item?.state || '',
                        //amount: item?.amount || 0,
                         amount:item?.amount !== ''
                                ? Number(item?.amount || 0)
                                : 0,        // item?.amount || 0,
                        //isActive: item?.selected || false
                        isActive: item?.selected === true
                    };
                    
                    
                })

            })),

            contactList: (this.contactList || []).map(contact => ({
                contactType: contact?.contactType || '',
                firstName: contact?.firstName || '',
                lastName: contact?.lastName || '',
                contactNumber: contact?.contactNumber || '',
                email: contact?.email || '',
                notify: contact?.notify || false,

                attachments: (contact?.attachments || []).map(file => ({
                    fileName: file?.fileName || '',
                    base64Data: file?.base64Data || ''
                }))
            }))
        };

        console.log('participantPayload => ', JSON.stringify(participantPayload));
       

        try {
            this.isLoading = true;

            const participantId = await saveParticipant({
                participantJson: JSON.stringify(participantPayload)
            });

            console.log('Participant Saved => ', participantId);

            const safeContactPayload = Array.isArray(this.contactList) &&
                this.contactList.length > 0
                ? JSON.stringify(this.contactList)
                : null;

            console.log( 'safeContactPayload =>', safeContactPayload);

            if(safeContactPayload){

                try {

                    await createUpdatepdateParticipantContacts({clientId: participantId,contactData: safeContactPayload});
                    console.log( '✅ Contacts updated successfully');

                } catch(contactError){

                    console.error('❌ Contact update error:', JSON.stringify(contactError) );
                }

            } else {

                console.warn( '⚠️ No contact records to update.');
            }

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                   // message: this.SuccessMessage,
                   message: 'Participant details saved successfully',
                    variant: 'success'
                })
            );

            this.createParticipantshowModal = false;
            this.resetParticipantFields();

            await this.loadParticipants();

        }catch(error) {

        console.error('SAVE ERROR => ', JSON.stringify(error));

        let errorMessage = 'Failed to save participant';

        // ✅ DUPLICATE EMAIL ERROR
        if (
            error?.body?.message &&
            error.body.message.includes('duplicate value')
        ) {

            errorMessage =
                'Participant email already exists. Please use another email.';
        }
        // ✅ CUSTOM APEX ERROR
        else if (error?.body?.message) {

            errorMessage = error.body.message;
        }

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: errorMessage,
                variant: 'error'
            })
        );
    } finally {
            this.isLoading = false;
        }
    }

    resetParticipantFields() {
        this.editingParticipantId = null;
        //this.fullName = null;
        this.firstName = null;
        this.lastName = null;
        this.ndisNumber = null;
        this.dob = null;
        this.phone = null;
        this.email = null;
        this.address = null;
        this.budgetSpent = 0;
        this.status = 'Active';
        this.selectedClassification=null;
        this.selectedTypeOfIndustry ='NDIS';
        this.aboutParticipant= null;
        this.planStart = null;
        this.planEnd = null;
        this.planBudget = 0;
        this.supportCategory = null;
        this.riskLevel = null;
        this.providerBudget = 0;
        this.supportCoordinationBudget = 0;
        //this.emergencyContact = null;



        // Address fields (for lightning-input-address)
        this.street = null;
        this.city = null;
        this.province = null;
        this.postalcode = null;
        this.country = null;
        this.contactList = [
        {
            id: Date.now(),
            firstName: '',
            lastName: '',
            contactNumber: '',
            email: '',
            contactType: '', // NEW FIELD
            notify:false,
            firstNamePlaceholder: 'Enter Name',
            lastNamePlaceholder: 'Enter Name',
            phonePlaceholder: 'Enter Number',
            emailPlaceholder: 'Enter Email',
            showAdd: true,
            addButtonClass: 'add-visible'
        }
        ];
        this.selectedServiceTypes = [];
        this.pendingServiceGroups = [];
        this.serviceGroups = [];
        this.displayedCoordinatorServiceGroups = [];
        this.coordinatorPendingServiceGroups = [];
        this.showAddSupportCategoryModal= false;
        this.showAddSupportCoordinatorCategoryModal=false;
        this.resetCoordinatorServiceModal();
        this.resetAddServiceModal();

    }

    // handleparticipantCreateChange(event) {

    //     const field = event.target.name;

    //     let value = event.target.value;

    //     console.log('Field:', field);
    //     console.log('Value:', value);


    //     if (field === 'phone') {

    //         value = value.replace(/\D/g, '');

    //         if (value.length > 10) {

    //             //value = value.slice(0, 10);

    //             event.target.value = value;

    //             event.target.setCustomValidity(
    //                 'Phone Number cannot exceed 10 digits'
    //             );

    //         } else if (value && value.length !== 10) {

    //             event.target.setCustomValidity(
    //                 'Phone Number must be exactly 10 digits'
    //             );

    //         } else {

    //             event.target.setCustomValidity('');
    //         }

    //         event.target.reportValidity();

    //         this.phone = value;

    //         return;
    //     }

    //     if (field === 'ndisNumber') {

    //         value = value.replace(/\D/g, '');

    //         if (value.length > 9) {

    //             value = value.slice(0, 9);

    //             event.target.value = value;

    //             event.target.setCustomValidity(
    //                 'NDIS Number cannot exceed 9 digits'
    //             );

    //         } else if (value && value.length !== 9) {

    //             event.target.setCustomValidity(
    //                 'NDIS Number must be exactly 9 digits'
    //             );

    //         } else {

    //             event.target.setCustomValidity('');
    //         }

    //         event.target.reportValidity();

    //         this.ndisNumber = value;

    //         return;
    //     }

    //     if (field === 'aboutParticipant') {

    //         if (value.length > 25000) {

    //             value = value.substring(0, 25000);

    //             event.target.value = value;

    //             event.target.setCustomValidity(
    //                 'About Participant cannot exceed 25000 characters'
    //             );

    //         } else {

    //             event.target.setCustomValidity('');
    //         }

    //         event.target.reportValidity();

    //         this.aboutParticipant = value;

    //         return;
    //     }

    //     this[field] = value;
    // }
        handleparticipantCreateChange(event) {

        const field = event.target.name;
        let value = event.target.value;

        console.log('Field:', field);
        console.log('Value:', value);

        switch(field){

            // PHONE
            case 'phone':

                value = value.replace(/\D/g,'');
                if(value.length > 10){
                   // value = value.slice(0,10);
                    event.target.value = value;
                    event.target.setCustomValidity(  'Phone Number cannot exceed 10 digits' );
                } else if(value && value.length !== 10){
                    event.target.setCustomValidity('Phone Number must be exactly 10 digits');

                } else {
                    event.target.setCustomValidity('');
                }
                event.target.reportValidity();
                this.phone = value;

                break;

            // NDIS NUMBER
            case 'ndisNumber':

                value = value.replace(/\D/g,'');
                if(value.length > 9){
                    //value = value.slice(0,9);
                    event.target.value = value;
                    event.target.setCustomValidity( 'NDIS Number cannot exceed 9 digits');

                } else if(value && value.length !== 9){
                    event.target.setCustomValidity(  'NDIS Number must be exactly 9 digits');
                } else {
                    event.target.setCustomValidity('');
                }
                event.target.reportValidity();
                this.ndisNumber = value;
                break;

            // EMAIL
            case 'email':

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if(value && !emailRegex.test(value)){
                    event.target.setCustomValidity('Please enter valid email');
                } else {
                    event.target.setCustomValidity('');
                }
                event.target.reportValidity();
                this.email = value;

                break;

            // ABOUT PARTICIPANT
            case 'aboutParticipant':

                if(value.length > 25000){
                    value = value.substring(0,25000);
                    event.target.value = value;
                    event.target.setCustomValidity( 'About Participant cannot exceed 25000 characters' );
                } else {
                    event.target.setCustomValidity('');
                }

                event.target.reportValidity();
                this.aboutParticipant = value;
                break;

            // NUMBER FIELDS
          
            case 'budgetAllocation':
            case 'budgetCoordinatorAllocation':
            case 'planBudget':
            case 'budgetSpent':
            case 'providerBudget':
            case 'supportCoordinationBudget':
            case 'currentAmountSpent':
            case 'coordinatorCurrentAmountSpent':
                value = value ? Number(value) : 0;
                // const totalPlanBudget = Number(this.planBudget || 0);
                // const providerBudget = field === 'providerBudget'
                //                             ? value
                //                             : Number(this.providerBudget || 0);

                // const supportCoordinationBudget = field === 'supportCoordinationBudget'
                //                                         ? value
                //                                         : Number(this.supportCoordinationBudget || 0);
                this[field] = value;

    // ✅ Remaining Budget
    const totalPlanBudget =
        Number(this.planBudget || 0);

    const budgetSpent =
        Number(this.budgetSpent || 0);

    const remainingBudget =
        totalPlanBudget - budgetSpent;

    // ✅ Latest provider/sc values
    const providerBudget =
        Number(this.providerBudget || 0);

    const supportCoordinationBudget =
        Number(this.supportCoordinationBudget || 0);

                if(value < 0){
                    event.target.setCustomValidity( 'Value cannot be negative');

                }  else if( field === 'budgetSpent' && this.planBudget &&  value > Number(this.planBudget)){
                    event.target.setCustomValidity( 'Budget Spent to Date cannot exceed Total Plan Budget' );

                }  else if((field === 'providerBudget' || field === 'supportCoordinationBudget'  ||field === 'budgetSpent' ||  field === 'planBudget') 
                && (  providerBudget +  supportCoordinationBudget ) > remainingBudget){

                    event.target.setCustomValidity(' Provider Budget + Support Coordination Budget cannot exceed Remaining Budget' );
                }  else if(field === 'currentAmountSpent' && this.budgetAllocation &&  value > Number(this.budgetAllocation)){

                    event.target.setCustomValidity( 'Budget Spent to Date cannot exceed Budget Allocation' );
                }  else if(field === 'coordinatorCurrentAmountSpent' && this.budgetCoordinatorAllocation &&  value > Number(this.budgetCoordinatorAllocation)){

                    event.target.setCustomValidity( 'Budget Spent to Date cannot exceed Budget Allocation' );
                }
                else {
                    event.target.setCustomValidity('');
                }
                event.target.reportValidity();
                this[field] = value ? Number(value) : null;
                break;

            // DATE FIELDS
            case 'dob':
            case 'planStart':
            case 'planEnd':
                const today =new Date().toISOString().split('T')[0];


                if( field === 'dob' && value && value > today ){
                    event.target.setCustomValidity( 'Date of Birth cannot be a future date' );

                } else if( field === 'planEnd' && value && this.planStart && value < this.planStart){
                    event.target.setCustomValidity('Plan End Date cannot be before Plan Start Date');

                } else if( field === 'planStart' && value && this.planEnd && value > this.planEnd ){
                    event.target.setCustomValidity( 'Plan Start Date cannot be after Plan End Date' );

                }else {
                    event.target.setCustomValidity('');
                }
                event.target.reportValidity();
                this[field] = value || null;
                break;

            // PICKLISTS
            case 'riskLevel':
            case 'status':
            case 'selectedClassification':
            case 'selectedTypeOfIndustry':

                this[field] = value || '';

                break;

            // TEXT FIELDS
            case 'firstName':
            case 'lastName':
            case 'street':
            case 'city':
            case 'province':
            case 'postalcode':
            case 'country':

                this[field] = value ? value.trim() : '';

                break;

            default:

                this[field] = value;
        }
    }
     addressInputChange(event) {
        const address = event.detail;

        this.street = address.street;
        this.city = address.city;
        this.province = address.province;
        this.postalcode = address.postalCode;
        this.country = address.country;

        console.log('📍 Address Updated:', JSON.stringify(address));
         event.target.setCustomValidityForField('', 'street');
        event.target.setCustomValidityForField('', 'city');
        event.target.setCustomValidityForField('', 'province');
        event.target.setCustomValidityForField('', 'postalCode');
        event.target.setCustomValidityForField('', 'country');

        event.target.reportValidity();
    }

    get initials() {
    if (!this.participant?.name) return "";
    return this.participant.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
    }

    get hasImage() {
    return !!this.participant?.imageUrl;
    }

    get riskClass() {
    switch (this.participant.risk) {
    case "High": return "slds-text-color_error";
    case "Medium": return "slds-text-color_warning";
    case "Low": return "slds-text-color_success";
    }
    return "";
    }

    handleImageError() {
        this.participant = { ...this.participant, imageUrl: null };
    }

    // handleViewDetails(event) {
    //     console.log('👁️ View Details clicked');

    //     // 🔹 Read dataset id
    //     const id = event.currentTarget.dataset.id;
    //     console.log('🆔 Participant Id from button:', id);

    //     // 🔹 Current participants snapshot
    //     console.log('📋 Participants list size:', this.participants?.length);

    //     // 🔹 Find participant
    //     const record = this.participants.find(p => p.id === id);

    //     if (!record) {
    //         console.error('❌ Participant not found for Id:', id);
    //         console.table(this.participants);
    //         return;
    //     }

    //     console.error('✅ Participant found:', JSON.stringify(record, null, 2));

    //     // 🔹 Set state
    //     this.selectedParticipant = record;
    //     this.showDetailsPage = true;
    //     //this.createParticipantshowModal = true;
    //     this.showSupportCategoriesPage = false;
    //     this.participantflag = true;
    //     console.log('📌 Selected Participant set:', this.selectedParticipant.name);
    //     console.error('✅ Participant found:', JSON.stringify(this.selectedParticipant, null, 2));
    //     console.log('📄 showDetailsPage:', this.showDetailsPage);
    // }
   handleViewDetails(event) {
    console.log('👁️ View Details clicked');

    const id = event.currentTarget.dataset.id;

    console.log('🆔 Participant Id:', id);

    const record = this.participants.find(
        p => p.id === id
    );

    if (!record) {
        console.error('❌ Participant not found');
        console.table(this.participants);
        return;
    }

    console.log(
        '✅ Participant found:',
        JSON.stringify(record, null, 2)
    );

    // 🔥 ONLY SET selectedParticipant
    this.selectedParticipant = {

        ...record,

        // normalize values used in getter
        name:record.name,
           // `${record.firstName || ''} ${record.lastName || ''}`,

        mobile:
            record.phone || '',

        ndis:
            record.ndisNumber || '',

        totalBudget:
            record.planBudget || 0,

        remainingBudget:
            (Number(record.planBudget) || 0) -
            (Number(record.budgetSpent) || 0),

        budgetUsedPercent:
            record.planBudget
                ? Math.round(
                    (Number(record.budgetSpent || 0) /
                    Number(record.planBudget || 1)) * 100
                )
                : 0,

        planPeriod:record.planPeriod,
            //`${record.planStart || ''} - ${record.planEnd || ''}`,
        //abn:p.abn || '',
        status:record.status || '',
        risklevel:record.risklevel || '',
        industryType:record.industryType || '',
        classification:record.classification || '',
    };

    this.showDetailsPage = true;
    this.showSupportCategoriesPage = false;
    this.participantflag = true;

    console.log(
        '📌 selectedParticipant =>',
        JSON.stringify(this.selectedParticipant, null, 2)
    );

    console.log(
        '📄 showDetailsPage:',
        this.showDetailsPage
    );
}


    handleBack() {
    this.showDetailsPage = false;
    this.selectedParticipant = null;
    }

    get details() {
        const p = this.selectedParticipant || {};

        return {
            id: p.id,
            //name: p.name,
            name:p.name,
            //`${p.firstName || ''} ${p.lastName || ''}`,
                // p.firstName || p.lastName
                //     ? `${p.firstName || ''} ${p.lastName || ''}`.trim()
                //     : p.name || '',
            mobile: p.phone,
            emergency: p.emergencyContact,
            email: p.email,
            address: p.street
                // ? `${p.street}, ${p.city} ${p.state}, ${p.country}.`
                // : "123 Spring board street, Melbourne VIC 3000, Earth.",
                 ? `${p.street}, ${p.city || ''}, ${p.province || ''}, ${p.country || ''}`
                : '',
            ndis: p.ndisNumber,
           // abn:p.abn,
            status:p.status,
            risklevel:p.risklevel,
            industryType:p.industryType,
            classification:p.classification,
            // budgetUsed: p.budgetUsedPercent,
            //totalBudget: p.totalBudget,
            // remainingBudget: p.remainingBudget,
            // planPeriod: p.planPeriod,
            totalBudget:p.planBudget || 0,

            remainingBudget:
                (Number(p.planBudget) || 0) -
                (Number(p.budgetSpent) || 0),
            planPeriod:  `${p.planStart || ''} - ${p.planEnd || ''}`,

            // Goals & Progress (static fallback)
            goalSocial: 75,
            goalIndependent: 40,
            goalPhysical: 90,
            goalLeg: 100
        };
    }

    get detailInitials() {
        const name = this.details?.name || "";
        const parts = name.trim().split(" ");

        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }

        return (
            parts[0].charAt(0).toUpperCase() +
            parts[1].charAt(0).toUpperCase()
        );
    }

    get pinIconName() {
    return this.isPinned ? "keep" : "keep_off"; 
    }

    handleTogglePin(event) {
    const id = event.currentTarget.dataset.id;

    let updatedPinnedState;

    // 🔹 Update UI immediately
    this.participants = this.participants.map(p => {
    if (p.id === id) {
    updatedPinnedState = !p.isPinned;
    return {
    ...p,
    isPinned: updatedPinnedState,
    pinIconName: updatedPinnedState ? 'keep' : 'keep_off'
    };
    }
    return p;
    });

    this.allParticipants = this.allParticipants.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    isPinned: updatedPinnedState,
                    pinIconName: updatedPinnedState
                        ? 'keep'
                        : 'keep_off'
                };
            }
            return p;
        });
    // 🔹 Clear existing timer if user clicks again within 3 sec
    if (this.pinUpdateTimers[id]) {
    clearTimeout(this.pinUpdateTimers[id]);
    }

    // 🔹 Call Apex after 3 seconds
    this.pinUpdateTimers[id] = setTimeout(() => {
    this.updatePinInBackend(id, updatedPinnedState);
    }, 3000);
    }

    updatePinInBackend(participantId, isPinned) {
    updateParticipantPin({
    participantId: participantId,
    isPinned: isPinned
    })
    .then(() => {
    console.log('✅ Pin state updated in backend');
    //  this.loadParticipants();
    })
    .catch(error => {
    console.error('❌ Error updating pin state', error);
    });
    }

    // handleEditPlan(event) {
    //     this.createorEditParticipant = 'Update Participant';
    //     this.subParticipantheader = 'Update Participant details and plan information';
    //     const id = event.currentTarget.dataset.id;

    //     const participant = this.participants.find(p => p.id === id);

    //     if (!participant) {
    //     console.error('❌ Participant not found for Edit Plan');
    //     return;
    //     }

    //     // 🔹 Open modal
    //     this.createParticipantshowModal = true;

    //     // 🔹 Populate PERSONAL INFO
    //     this.firstName = participant.firstName || '';
    //     this.lastName = participant.lastName || '';
    //     this.fullName = participant.name || '';
    //     // this.ndisNumber = participant.ndisNumber;
    //      this.dob = participant.dob;
    //     // this.phone = participant.phone;
    //     // this.email = participant.email;
    //     // this.emergencyContact = participant.emergencyContact;
    //     this.ndisNumber = participant.ndisNumber || '';
    //     //this.dob = participant.rawDob || '';
    //     this.phone = participant.phone || '';
    //     this.email = participant.email || '';
    //     this.selectedClassification = participant.classification || '';
    //     this.selectedTypeOfIndustry = participant.typeOfIndustry || '';
    //     this.aboutParticipant = participant.aboutParticipant || '';

    //     this.street = participant.street || '';
    //     this.city = participant.city || '';
    //     this.province = participant.state || '';
    //     this.postalcode = participant.postalCode || '';
    //     this.country = participant.country || '';

    //     // PLAN INFO

    //     this.planStart = participant.planStartDate || '';
    //     this.planEnd = participant.planEndDate || '';
    //     this.planBudget = participant.rawPlanBudget || 0;
    //     this.budgetSpent = participant.rawBudgetSpent || 0;
    //     this.providerBudget = participant.providerBudget || 0;
    //     this.supportCoordinationBudget = participant.supportCoordinationBudget || 0;
    //     this.supportCategory = participant.supportCategory || '';
    //     this.riskLevel = participant.risk || '';
    //     this.status = participant.status || '';
    //     this.selectedServiceTypes = participant.selectedServiceTypes || [];
    //     // 🔹 Track editing record (VERY IMPORTANT for save)
    //     this.editingParticipantId = participant.id;

    //     // SERVICE GROUPS

    //     this.pendingServiceGroups = (participant.serviceGroups || []).map(group => ({

    //         id: group.Id,
    //         tempKey: group.Id,
    //         serviceType: group.Service_Type__c || '',
    //         serviceTypeName: group.Name || '',
    //         state: group.State__c || '',
    //         budgetAllocation: group.BudgetAllocation__c || 0,
    //         amountSpent: group.AmountSpent__c || 0,
    //         budgetSpentToDate: group.Budget_Spent_to_Date__c || 0,
    //         isExpanded: false,
    //         chevronIcon: 'utility:chevronright',

    //         supportItems: (group.Support_Catalogues__r || []).map(item => ({

    //             id: item.Id,
    //             catalogueId: item.Id,
    //             supportItemName: item.Support_Item_Name__c || '',
    //             supportItemNumber: item.Support_Item_Number__c || '',
    //             providerId: item.SupportCatlogue_To_SupportProvider__c || '',
    //             providerName: item.SupportCatlogue_To_SupportProvider__r?.Name || '',
    //             state: item.State__c || '',
    //             amount: item.Amount__c || 0,
    //             selected: item.IsActive__c === true
    //         }))
    //     }));

    //     // CONTACTS

    //     this.contactList = (participant.Support_Client_Contacts__r || []).map(contact => ({

    //         id: contact.Id,
    //         contactType: contact.Contact_Type__c || '',
    //         firstName: contact.First_Name__c || '',
    //         lastName: contact.Last_Name__c || '',
    //         contactNumber: contact.Contact_Number__c || '',
    //         email: contact.Email__c || '',
    //         notify: contact.Notify__c || false,

    //         uploadedFiles: (contact.Support_Client_Contact_Attachments__r || []).map(file => ({

    //             attachmentId: file.Id,
    //             originalName: file.File_Name__c || '',
    //             url: file.Amazon_File_URL__c || '',
    //             key: file.Key__c || '',
    //             size: file.Size__c || ''
    //         }))
    //     }));

    //     console.log(
    //         '✅ pendingServiceGroups =>',
    //         JSON.stringify(this.pendingServiceGroups)
    //     );

    //     console.log(
    //         '✅ contactList =>',
    //         JSON.stringify(this.contactList)
    //     );

    //     console.log('✏️ Edit Plan opened for:', participant);
    // }

    async handleEditPlan(event){ 

        this.SuccessMessage='Participant updated successfully!';
        this.createorEditParticipant = 'Update Participant';
        this.subParticipantheader = 'Update Participant details and plan information';

        const participantId = event.currentTarget.dataset.id;

        console.log('Edit Participant Id =>', participantId);

        try {

            this.isLoading = true;
            const participantDetails = await getParticipantDetails({ participantId: participantId  });

            console.log(  'participantDetails =>',JSON.stringify(participantDetails));

            if(!participantDetails){
                console.error( '❌ Participant Details Not Found');
                return;
            }

            this.participantDetails = participantDetails;
            this.createParticipantshowModal = true;
            this.createCurrentStep = 'createstep1';
            if(this.showDetailsPage){
                this.showDetailsPage =false;
            }

            this.editingParticipantId = participantDetails.Id;

            // PERSONAL INFO

            this.firstName = participantDetails.First_Name__c || '';
            this.lastName = participantDetails.Last_Name__c || '';
            this.fullName = participantDetails.Name || '';
            this.ndisNumber = participantDetails.NDIS_Number__c || '';
            this.dob = participantDetails.Date_of_Birth__c || '';
            this.phone = participantDetails.Phone__c || '';
            this.email = participantDetails.Email__c || '';
            this.selectedClassification = participantDetails.Classification__c || '';
            this.selectedTypeOfIndustry = participantDetails.Type_of_Industry__c || '';
            this.aboutParticipant = participantDetails.About_Participant__c || '';

            // ADDRESS

            this.street = participantDetails.Address__Street__s || '';
            this.city = participantDetails.Address__City__s || '';
            this.province = participantDetails.Address__StateCode__s || '';
            this.postalcode = participantDetails.Address__PostalCode__s || '';
            this.country = participantDetails.Address__CountryCode__s || '';

            // PLAN INFO

            this.planStart = participantDetails.Plan_Start_Date__c || '';
            this.planEnd = participantDetails.Plan_End_Date__c || '';
            this.planBudget = participantDetails.Total_Plan_Budget__c || 0;
            this.budgetSpent = participantDetails.Budget_Spent_to_Date__c || 0;
            this.providerBudget = participantDetails.Provider_Budget__c || 0;
            this.supportCoordinationBudget = participantDetails.Support_Coordinator_Budget__c || 0;
            this.supportCategory = participantDetails.Support_Category__c || '';
            this.riskLevel = participantDetails.Risk_Level__c || '';
            this.status = participantDetails.Status__c || '';

            this.selectedServiceTypes =
                participantDetails.Selected_Service_Types__c
                    ? participantDetails.Selected_Service_Types__c.split(';')
                    : [];

            // SERVICE GROUPS

            this.pendingServiceGroups =
                (participantDetails.Support_CatalogueGroups__r || []).map(group => ({

                    id: group.Id,
                    tempKey: group.Id,
                // serviceType: group.Service_Type__c || '',
                    serviceType: group.Name || '',
                    serviceTypeName: group.Name || '',
                    state: group.State__c || '',
                    budgetAllocation: group.BudgetAllocation__c || 0,
                    amountSpent: group.AmountSpent__c || 0,
                    budgetSpentToDate: group.Budget_Spent_to_Date__c || 0,
                    isExpanded: false,
                    chevronIcon: 'utility:chevronright',

                    supportItems:
                        (group.Support_Catalogues__r || []).map(item => ({

                            id: item.Id,
                            //catalogueId: item.Id,
                            catalogueId:item.SupportCatalogue_To_NDISSupportCatalogue__c || null,
                            supportItemName: item.Support_Item_Name__c || '',
                            supportItemNumber: item.Support_Item_Number__c || '',
                            // providerId: item.SupportCatlogue_To_SupportProvider__c || '',
                            // providerName: item.SupportCatlogue_To_SupportProvider__r?.Name || '',
                            providerIds: ( item.Support_Child_Provider__r || []).map(
                                    p => p.Support_Provider__c
                                ),
                            providerNames: (item.Support_Child_Provider__r || [] ).map(
                                    p => p.Support_Provider__r?.Name
                                ),
                            //state: item?.state || '',
                            preferredStaff:item.Preffered_Staff__c || '',
                           // isEditingPreferredStaff: !item.Preffered_Staff__c,
                            amount: item.Amount__c || 0,
                            selected: item.IsActive__c === true
                        }))
                }));

                this.coordinatorPendingServiceGroups = (participantDetails.Support_CoordinatorCatalogueGroup__r || []).map(group => ({

                    id: group.Id,
                    tempKey: group.Id,
                // serviceType: group.Service_Type__c || '',
                    serviceType: group.Name || '',
                    serviceTypeName: group.Name || '',
                    state: group.State__c || '',
                    budgetAllocation: group.BudgetAllocation__c || 0,
                    amountSpent: group.AmountSpent__c || 0,
                    budgetSpentToDate: group.Budget_Spent_to_Date__c || 0,
                    isExpanded: false,
                    chevronIcon: 'utility:chevronright',

                    supportItems:
                        (group.Support_CoordinatorCatalogue__r || []).map(item => ({

                            id: item.Id,
                            //catalogueId: item.Id,
                            catalogueId:item.Support_Coordinator_Catalogue__c || null,
                            supportItemName: item.Support_Item_Name__c || '',
                            supportItemNumber: item.Support_Item_Number__c || '',
                            // providerId: item.SupportCatlogue_To_SupportProvider__c || '',
                            // providerName: item.SupportCatlogue_To_SupportProvider__r?.Name || '',
                            // providerIds: ( item.Support_Child_Provider__r || []).map(
                            //         p => p.Support_Provider__c
                            //     ),
                            // providerNames: (item.Support_Child_Provider__r || [] ).map(
                            //         p => p.Support_Provider__r?.Name
                            //     ),
                            //state: item?.state || '',
                            amount: item.Amount__c || 0,
                            selected: item.IsActive__c === true
                        }))
                }));

                this.loadContactAttachmentCounts();

            console.log("contact attachment counts", this.loadContactAttachmentCounts());


            // CONTACTS
            if (participantDetails.Support_Client_Contacts__r && participantDetails.Support_Client_Contacts__r.length > 0){
                this.contactList =
                (participantDetails.Support_Client_Contacts__r || []).map(contact => ({

                    id: contact.Id,
                    contactType: contact.Contact_Type__c || '',
                    firstName: contact.First_Name__c || '',
                    lastName: contact.Last_Name__c || '',
                    contactNumber: contact.Contact_Number__c || '',
                    email: contact.Email__c || '',
                    notify: contact.Notify__c || false,

                    uploadedFiles:
                        (contact.Support_Client_Contact_Attachment__r || []).map(file => ({

                            attachmentId: file.Id,
                            originalName: file.File_Name__c || '',
                            url: file.Amazon_file_URL__c || '',
                            key: file.Key__c || '',
                            size: file.Size__c || ''
                        }))
                }));
            } else {
                this.contactList = [
                    {
                        id: 1,
                        firstName: '',
                        lastName: '',
                        contactNumber: '',
                        email: '',
                        contactType: '', // NEW FIELD,
                        notify:false,
                        firstNamePlaceholder: 'Enter Name',
                        lastNamePlaceholder: 'Enter Name',
                        phonePlaceholder: 'Enter Number',
                        emailPlaceholder: 'Enter Email',
                        showAdd: true,
                        addButtonClass: 'add-visible'
                    }
                ];
            }
               

            console.log( 'pendingServiceGroups =>',JSON.stringify(this.pendingServiceGroups) );
            console.log( 'coordinatorPendingServiceGroups =>',JSON.stringify(this.coordinatorPendingServiceGroups) );
            console.log( 'contactList =>',JSON.stringify(this.contactList));
            this.displayedCoordinatorServiceGroups = [...(this.coordinatorPendingServiceGroups || [])];

            console.log(
                '✅ Edit Plan Loaded Successfully'
            );

        } catch(error){

            console.error(
                '❌ Edit Plan Error =>',
                JSON.stringify(error)
            );

        } finally {

            this.isLoading = false;
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

    handlePageSizeChange(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.currentPage = 1;
    this.loadParticipants();
    }
    get isServiceTypeDisabled() {
    return this.isEditMode;
    }
    get isFirstPage() {
    return this.currentPage === 1;
    }

    get isLastPage() {
    return this.currentPage === this.totalPages;
    }

    get hasParticipants() {
    return Array.isArray(this.participants) && this.participants.length > 0;
    }

    handleAddNotes(event) {
        console.log('==============================');
        console.log('🚀 Dashboard Add Notes Clicked');

        const participantId = event.currentTarget.dataset.id;

        console.log('Selected Participant Id:', participantId);
        console.log('notesflag BEFORE:', this.notesflag);
        console.log(
            'participantIdforchild BEFORE:',
            this.participantIdforchild
        );

        this.participantIdforchild = participantId;
        this.notesflag = true;

        console.log('notesflag AFTER:', this.notesflag);
        console.log(
            'participantIdforchild AFTER:',
            this.participantIdforchild
        );

        console.log('Waiting for notes child render...');

        setTimeout(() => {
            console.log('⏳ setTimeout triggered');

            const notesCmp = this.template.querySelector(
                'c-support-coordinator-notes'
            );

            console.log('Notes component found:', notesCmp);

            if (notesCmp) {
                console.log('✅ Calling openAddCaseNoteModal()');
                notesCmp.openAddCaseNoteModal();
            } else {
                console.error('❌ Notes component NOT found');
            }

            console.log('==============================');
        }, 100);
    }

    handleCloseNotes() {
        console.log('==============================');
        console.log('❌ Notes close event received');

        console.log('notesflag BEFORE:', this.notesflag);
        console.log(
            'participantIdforchild BEFORE:',
            this.participantIdforchild
        );

        this.notesflag = false;
        this.participantIdforchild = null;

        console.log('notesflag AFTER:', this.notesflag);
        console.log(
            'participantIdforchild AFTER:',
            this.participantIdforchild
        );

        console.log('==============================');
    }

    handleNotesCancel() {
    console.log('⬅ Cancel event received in parent');

    // Examples:
    this.participantflag = true;
    this.notesflag = false;
    this.participantIdforchild = null;
    }

    handleBudgetForecastClick() {
        console.log('📊 Budget Forecast button clicked');
        this.participantflag = false;
        this.budgetForecastflag = true;
    }


    handleBudgetForecastCancel(){
        this.participantflag = true;
        this.budgetForecastflag = false;
        this.participantIdforchild = null;
    }
    // Open Support Categories & Services page
    async handleOpenSupportCategories() {
        //this.serviceGroups = [];
        this.expandedServiceType = null; 
        this.isLoading = true;  
        await this.loadServiceGroups(); 
        this.showSupportCategoriesPage = true;
        this.showDetailsPage = false;
        this.participantflag = false;

    }

    handleProviderChange(event) {
        this.selectedProvider = event.detail.value;
    }
    async loadProviders() {
        console.log('loadProviders called ');
        try {
            const data = await getProviders({ selectedServiceType: this.selectedServiceType});

            this.providerOptions = data.map(p => ({
                label: p.name,
                value: p.id
            }));
            console.log('✅ Providers loaded:', this.providerOptions.length);
            console.log('✅ Provider values:', this.providerOptions.map(p => p.value));

        } catch (error) {
            this.showToast(
                'Error',
                error.body?.message || 'Failed to load providers',
                'error'
            );
        }
    }

    async loadServiceGroups() {
        if (!this.selectedParticipant?.id) return;

        this.isLoading = true;

        try {
            const data = await fetchParticipantServiceGroups({
                supportClientId: this.selectedParticipant.id
            });

            this.serviceGroups = data.map(group => {

                const percent = group.budgetAllocation > 0
                    ? Math.round((group.amountSpent / group.budgetAllocation) * 100)
                    : 0;
                const totalSpentAcrossItems = group.supportItems
                    ? group.supportItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                    : 0;
                const expanded = this.expandedServiceType === group.serviceType;

                return {
                    ...group,
                    totalSpentAcrossItems,
                    isExpanded: expanded,
                    chevronIcon: expanded
                    ? 'utility:chevrondown'
                    : 'utility:chevronright',  // ✅ initialize here
                    statusPercent: percent,
                    statusStyle: `width:${percent}%`
                };
            });

        } catch (error) {
            this.showToast(
                'Error',
                error.body?.message || 'Failed to load services',
                'error'
            );
        } finally {
            this.isLoading = false;
        }
    }

    handleOpenAddCategoryModal() {
        this.resetAddServiceModal();
        this.isEditMode = false; 
        this.showAddSupportCategoryModal = true;
    }

    // handleCloseAddCategoryModal() {
    // this.showAddSupportCategoryModal = false;
    // this.resetAddServiceModal();
    // }

    handleBackFromSupportCategories() {
    this.showSupportCategoriesPage = false;
    this.participantflag = true;
    this.showDetailsPage = true;
    }

    handleProviderSpendingClick() {
    this.participantflag = false;
    this.providerSpendingFlag = true;
    // 🔥 Load entries when page opens
    this.loadSupportEntries();
    }
    handleProviderSpendingBack() {
    this.providerSpendingFlag = false;
    this.participantflag = true;
    }
    // handleToggleExpand(event) {
    //     const serviceType = event.currentTarget.dataset.type;

    //     this.expandedServiceType =
    //     this.expandedServiceType === serviceType ? null : serviceType;

    //     this.serviceGroups = this.serviceGroups.map(g => {

    //         const expanded = g.serviceType === this.expandedServiceType;

    //         return {
    //             ...g,
    //             isExpanded: expanded,
    //             chevronIcon: expanded
    //             ? 'utility:chevrondown'
    //             : 'utility:chevronright'
    //         };
    //     });
    // }
    // handleToggleExpand(event) {

    //     const serviceType = event.currentTarget.dataset.type;

    //     console.log('Toggle serviceType:', serviceType);

    //     this.expandedServiceType =
    //         this.expandedServiceType === serviceType
    //             ? null
    //             : serviceType;

    //     // Update DB groups
    //     this.serviceGroups = (this.serviceGroups || []).map(g => {

    //         const expanded =
    //             g.serviceType === this.expandedServiceType;

    //         return {
    //             ...g,
    //             isExpanded: expanded,
    //             chevronIcon: expanded
    //                 ? 'utility:chevrondown'
    //                 : 'utility:chevronright'
    //         };
    //     });

    //     // Update Local groups
    //     this.pendingServiceGroups =
    //         (this.pendingServiceGroups || []).map(g => {

    //             const expanded =
    //                 g.serviceType === this.expandedServiceType;

    //             return {
    //                 ...g,
    //                 isExpanded: expanded,
    //                 chevronIcon: expanded
    //                     ? 'utility:chevrondown'
    //                     : 'utility:chevronright'
    //             };
    //         });

    //     console.log(
    //         'Expanded Service Type:',
    //         this.expandedServiceType
    //     );
    // }
    handleToggleExpand(event) {

        const tempKey =
            event.currentTarget.dataset.key;

        console.log(
            'Toggle tempKey =>',
            tempKey
        );

        this.expandedServiceKey =
            this.expandedServiceKey === tempKey
                ? null
                : tempKey;

        console.log(
            'Expanded Service Key =>',
            this.expandedServiceKey
        );

        // DATABASE GROUPS
        this.serviceGroups =
            (this.serviceGroups || []).map(group => {

                const expanded =
                    group.tempKey ===
                    this.expandedServiceKey;

                console.log(
                    'DB GROUP =>',
                    group.tempKey,
                    '| expanded =>',
                    expanded
                );

                return {
                    ...group,
                    isExpanded: expanded,
                    chevronIcon:
                        expanded
                            ? 'utility:chevrondown'
                            : 'utility:chevronright'
                };
            });

        // LOCAL GROUPS
        this.pendingServiceGroups =
            (this.pendingServiceGroups || []).map(group => {

                const expanded =
                    group.tempKey ===
                    this.expandedServiceKey;

                console.log(
                    'LOCAL GROUP =>',
                    group.tempKey,
                    '| expanded =>',
                    expanded
                );

                return {
                    ...group,
                    isExpanded: expanded,
                    chevronIcon:
                        expanded
                            ? 'utility:chevrondown'
                            : 'utility:chevronright'
                };
            });

        // REFRESH DISPLAY
        // this.displayedServiceGroups = [
        //     ...(this.serviceGroups || []),
        //     ...(this.pendingServiceGroups || [])
        // ];
        console.log(  'Updated pendingServiceGroups in handleToggleExpand  =>', JSON.stringify(this.pendingServiceGroups) );
        console.log(  'Updated serviceGroups in handleToggleExpand  =>', JSON.stringify(this.serviceGroups) );
        console.log(  'Updated displayedServiceGroups in handleToggleExpand  =>', JSON.stringify(this.displayedServiceGroups) );
    }

    // handleRowProviderChange(event) {
    //     const id = event.target.dataset.id;
    //     const value = event.detail.value;
    //     console.log('value in handleRowProviderChange ',value);
    //     this.ndisCatalogue = this.ndisCatalogue.map(r =>
    //         r.id === id ? { ...r, providerId: value } : r
    //     );
    // }
    handleRowProviderChange(event) {
        //console.log('Raw event.detail:',JSON.stringify(event.detail));
        const id = event.currentTarget.dataset.id;
       // const value = event.detail.value || [];
       console.log(
        'dataset id:',
        id
    );
    console.log('Raw event.detail:',JSON.stringify(event.detail));
       const value =
    Array.isArray(event.detail.value)

        ? event.detail.value

        : (event.detail.value || '')
            .split(',')
            .filter(v => v);

        console.log(
            'Raw value:',
            JSON.stringify(value)
        );

        console.log(
            'Is Array:',
            Array.isArray(value)
        );

        // selected option object
        const selectedProvider = this.providerOptions.find(
            p => p.value === value
        );

        this.ndisCatalogue = this.ndisCatalogue.map(r =>

            r.id === id

                ? {
                    ...r,
                    //providerId: value,
                    //providerName: selectedProvider?.label || ''
                    providerIds: value,
                    providerNames:this.providerOptions
                            .filter(p => value.includes(p.value) )
                            .map(p => p.label)
                }

                : r
        );

        console.log(
            'Updated ndisCatalogue => ',
            JSON.stringify(this.ndisCatalogue)
        );
    }

    // handleServiceTypeChange(event) {
    //     this.selectedServiceType = event.detail.value;
        
    //     this.tryLoadNDISCatalogue();
    // }
    // handleServiceTypeChange(event) {

    //     const field = event.target.name;

    //     console.log('field:', field);
    //     console.log(
    //         'value:',
    //         JSON.stringify(event.detail.value)
    //     );

    //     if (field === 'multiServiceType') {

    //         this.selectedServiceTypes =
    //             event.detail.value;

    //         console.log(
    //             'selectedServiceTypes:',
    //             JSON.stringify(this.selectedServiceTypes)
    //         );

    //         // clear single select if removed
    //         // if (
    //         //     this.selectedServiceType &&
    //         //     !this.selectedServiceTypes.includes(
    //         //         this.selectedServiceType
    //         //     )
    //         // ) {
    //         //     this.selectedServiceType = null;
    //         // }

    //         return;
    //     }


    //     if (field === 'singleServiceType') {

    //         this.selectedServiceType =
    //             event.detail.value;

    //         console.log(
    //             'selectedServiceType:',
    //             this.selectedServiceType
    //         );

    //         this.tryLoadNDISCatalogue();
    //     }
    // }

    handleServiceTypeChange(event) {

    //      if (!Array.isArray(event.detail.value)) {
    //     console.log('Ignored search event:', event.detail);
    //     return;
    // }

        const field = event.target.name;
        const value = event.detail.value;

        console.log('field:', field);
        console.log('value:', JSON.stringify(value));

        switch(field){

            // MULTI SERVICE TYPE
            case 'multiServiceType':

               this.selectedServiceTypes = value || [];
               // this.selectedServiceTypes = [...value];
                console.log( 'selectedServiceTypes:',JSON.stringify(this.selectedServiceTypes) );
                break;

            // PROVIDER SERVICE TYPE
            case 'singleServiceType':
                const alreadyExists = this.pendingServiceGroups.some( group =>
                        group.serviceType === value
                );

                if(alreadyExists && !this.isEditMode){
                    this.selectedServiceType = '';
                    this.selectedState = '';
                    this.showToast(
                        'Error',
                        'This Service Type already exists.',
                        'error'
                    );

                    return;
                }
                this.selectedState = '';
                this.selectedCatalogueMap = {};
                this.ndisCatalogue = [];
                this.catCurrentPage = 1;
                this.selectedServiceType = value || '';
                console.log(  'selectedServiceType:',  this.selectedServiceType );
                this.tryLoadNDISCatalogue();
                this.loadProviders();
                break;

            // COORDINATOR SERVICE TYPE
            case 'coordinatorServiceType':
                const alreadyExists1 = this.coordinatorPendingServiceGroups.some( group =>
                        group.serviceType === value
                );

                if(alreadyExists1 && !this.isCoordinatorEditMode){
                    this.selectedCoordinatorServiceType = '';
                    this.selectedCoordinatorState = '';
                    this.showToast(
                        'Error',
                        'This Service Type already exists.',
                        'error'
                    );

                    return;
                }
                this.selectedCoordinatorState = '';
                this.selectedCoordinatorCatalogueMap = {};
                this.coordinatorCatalogue = [];
                this.coordinatorCatCurrentPage = 1;
                this.selectedCoordinatorServiceType =  value || '';
                console.log(  'selectedCoordinatorServiceType:',  this.selectedCoordinatorServiceType );
                this.tryLoadSupportCoordinatorCatalogue();
                break;

            default:
                console.warn( 'Unhandled Service Type field:', field );
        }
    }
    get selectedServiceTypeOptions() {

        return this.serviceTypeOptions.filter(
            option =>
                this.selectedServiceTypes.includes(
                    option.value
                )
        );
    }
   
    handleStateChange(event) {
        const newState = event.detail.value;

        // If state changed → reset selection
        if (this.selectedState && this.selectedState !== newState) {
            this.selectedCatalogueMap = {};
            this.ndisCatalogue = [];
            this.catCurrentPage = 1;
        }

        this.selectedState = newState;

        this.tryLoadNDISCatalogue();
        if(this.selectedServiceType){
            this.loadProviders();
        }
    
    }

    async handleEditService(event) {
        console.log('handleEditService');
       // const serviceType = event.currentTarget.dataset.type;
      //  const group = this.displayedServiceGroups.find(
       //     g => g.serviceType === serviceType
       // );
        this.showAddSupportCategoryModal = true;
         const tempKey = event.currentTarget.dataset.key;

        console.log('👉 Clicked tempKey:', tempKey);

        const group =
            this.displayedServiceGroups.find(
                g => g.tempKey === tempKey
            );
       // console.log('👉 Clicked serviceType:', serviceType);
        console.log('👉 Full group object:', JSON.stringify(group));
        console.log('👉 group.providerId:', group?.providerId);
        console.log('👉 Current providerOptions:', JSON.stringify(this.providerOptions))

        if (!group) return;

        this.isEditMode = true;
        this.editingGroupTempKey = group.tempKey;
        this.editingGroupId = group.id || null; 
        if (!this.providerOptions || this.providerOptions.length === 0) {
            await this.loadProviders();
        }
        // Set values
        this.selectedServiceType = group.serviceType;
        console.log(' this.selectedServiceType : ',this.selectedServiceType);
        console.log(' selectedServiceTypeOptions : ', JSON.stringify(this.selectedServiceTypeOptions))
        this.selectedState = group.state;          // 🔥 IMPORTANT
        this.budgetAllocation = group.budgetAllocation;
        this.currentAmountSpent = group.amountSpent;
        console.log('👉 Available options:', this.providerOptions.map(p => p.value));
        console.log('👉 Match found:', this.providerOptions.some(p => p.value === this.selectedProvider));
        // Open modal
       

        // Load catalogue after setting both service type and state
         await this.tryLoadNDISCatalogue();
        this.ndisCatalogue = this.ndisCatalogue.map(row => {

            const existingItem =
                group.supportItems?.find(
                     si => 
                    // si.catalogueId === row.id
                      si.supportItemNumber === row.number
                );

            if (existingItem) {

                return {

                    ...row,
                     //id: existingItem.id,
                    //id: existingItem.catalogueId,
                    supportCatalogueRecordId: existingItem.id,
                    selected: existingItem.selected,
                    isEditingAmount: false,
                    disableProvider: !existingItem.selected,
                    amount: existingItem.amount,
                    //providerId:existingItem.providerId,
                   // providerName: existingItem.providerName
                    providerIds: existingItem.providerIds || [],
                    providerNames: existingItem.providerNames || [],
                    //state: item?.state || '',
                    preferredStaff:existingItem.preferredStaff || '',
                   // isEditingPreferredStaff: !existingItem.preferredStaff,
                };
            }

            //return row;
             return {

                ...row,
                selected: false,
                disableProvider: true,
                isEditingAmount: false,
                preferredStaff: '',
               // isEditingPreferredStaff: true
            };
        });

        console.log(
            'Preselected ndisCatalogue => ',
            JSON.stringify(this.ndisCatalogue)
        );
    }

    handleDeleteService(event) {
        const serviceType = event.currentTarget.dataset.type;
        // Optional: call Apex to deactivate
        console.log('Delete service:', serviceType);
    }
    async tryLoadNDISCatalogue() {
        if (!this.selectedServiceType || !this.selectedState) {
            this.ndisCatalogue = [];
            return;
        }
        this.isLoading = true;
        try {
            const records = await fetchParticipantNDISCatalogue({
                serviceType: this.selectedServiceType,
                serviceDate: new Date().toISOString().split('T')[0]
            });

            // Map rows with state-based amount
            this.ndisCatalogue = records.map(r => ({
                id: r.Id,
                name: r.Support_Item_Name__c,
                number: r.Support_Item_Number__c,
                amount: r[`${this.selectedState}__c`] || 0,
                selected: false,
                //providerId: null,
                providerIds: [],
                providerNames: [],
                disableProvider: true
            }));

            // Load existing records (edit support)
            await this.loadExistingParticipantCatalogues();
            this.computeCataloguePagination();
        } catch (e) {
            this.showToast('Error', e.body?.message || 'Failed to load catalogue', 'error');
        } finally {
            this.isLoading = false;
        }
    }
    // async tryLoadNDISCatalogue() {

    //     const isCoordinatorStep = this.createCurrentStep === 'createstep2';

    //     const serviceType =isCoordinatorStep
    //         ? this.selectedCoordinatorServiceType
    //         : this.selectedServiceType;

    //     const state = isCoordinatorStep
    //         ? this.selectedCoordinatorState
    //         : this.selectedState;

    //     if (!serviceType || !state) {
    //         this.ndisCatalogue = [];
    //         return;
    //     }

    //     this.isLoading = true;

    //     try {
    //         const records =
    //             await fetchParticipantNDISCatalogue({

    //                 serviceType: serviceType,

    //                 serviceDate:
    //                     new Date()
    //                         .toISOString()
    //                         .split('T')[0]
    //             });

    //         //this.ndisCatalogue =
    //         const mappedCatalogue =
    //             records.map(r => ({

    //                 id: r.Id,
    //                 name: r.Support_Item_Name__c,
    //                 number:r.Support_Item_Number__c,
    //                 amount: r[ `${state}__c`] || 0,
    //                 selected: false,
    //                 isEditingAmount: false,
    //                 providerId: null,
    //                 disableProvider: true
    //             }));

    //         //this.computeCataloguePagination();
    //         if (isCoordinatorStep) {
    //             this.coordinatorCatalogue = mappedCatalogue;
    //             this.computeCoordinatorCataloguePagination();
    //         } else {
    //             this.ndisCatalogue =mappedCatalogue;
    //             await this.loadExistingParticipantCatalogues();
    //             this.computeCataloguePagination();
    //         }

    //     } catch (e) {

    //         this.showToast(
    //             'Error',
    //             e.body?.message ||
    //             'Failed to load catalogue',
    //             'error'
    //         );

    //     } finally {
    //         this.isLoading = false;
    //     }
    // }
    async loadServiceTypes() {
        try {
            const types = await fetchServiceTypes();

                this.serviceTypeOptions = types.map(type => ({
                label: type,
                value: type
            }));
            console.log(' this.serviceTypeOptions  in loadServiceTypes : ', JSON.stringify( this.serviceTypeOptions));


        } catch (error) {
            this.showToast(
                'Error',
                error.body?.message || 'Failed to load service types',
                'error'
            );
        }
    }
    async loadExistingParticipantCatalogues() {
        if (!this.isEditMode) return;
        if (!this.selectedParticipant?.id || !this.selectedServiceType) return;

        const existing = await fetchParticipantCatalogues({
            supportClientId: this.selectedParticipant.id,
            serviceType: this.selectedServiceType,
            state: this.selectedState,

        });
        this.selectedCatalogueMap = {};

        existing.forEach(rec => {
            if (rec.IsActive__c) {
                const key =
                rec.SupportCatalogue_To_NDISSupportCatalogue__c +
                '-' +
                rec.State__c ;
               // '-' +
               // rec.SupportCatlogue_To_SupportProvider__c;


                this.selectedCatalogueMap[key] = {

                    ...rec,
                    providerIds:(rec.Support_Child_Providers__r || []).map(
                            p => p.Support_Provider__c
                        ),
                    providerNames:(rec.Support_Child_Providers__r || []).map(
                            p => p.Support_Provider__r?.Name
                        )
                };
            }
        });

        this.ndisCatalogue = this.ndisCatalogue.map(row => {

        const match = Object.values(this.selectedCatalogueMap).find(rec =>
            rec.SupportCatalogue_To_NDISSupportCatalogue__c === row.id &&
            rec.State__c === this.selectedState
        );

        if (match) {
            return {
                ...row,
                selected: true,
                //providerId: match.SupportCatlogue_To_SupportProvider__c,
                providerIds: match.providerIds || [],
                providerNames:match.providerNames || [],
                disableProvider: false
            };
        }

        return row;
        });
    }

    handleCatalogueSelect(event) {
        const id = event.target.dataset.id;
        const checked = event.target.checked;

        this.ndisCatalogue = this.ndisCatalogue.map(r =>
            r.id === id
            ? {
                ...r,
                selected: checked,
                disableProvider: !checked   // 🔥 CONTROL FROM JS
            }
            : r
        );
       console.log('Updated ndisCatalogue', JSON.stringify(this.ndisCatalogue));
        // this.pendingServiceGroups = this.pendingServiceGroups.map(group => ({
        //     ...group,
        //     supportItems: group.supportItems.map(item =>
        //         item.catalogueId === id
        //             ? {
        //                 ...item,
        //                 selected: checked
        //             }
        //             : item
        //     )
        // }));

        // console.log('Updated pendingServiceGroups', JSON.stringify(this.pendingServiceGroups));

        console.log('this.providerOptions : ',JSON.stringify(this.providerOptions));
        if (!this.providerOptions || this.providerOptions.length === 0) {
            this.loadProviders();
        }
    }

    handleAmountChange(event) {
        const id = event.target.dataset.id;
        const value = parseFloat(event.target.value) || 0;

        this.ndisCatalogue = this.ndisCatalogue.map(r =>
            r.id === id ? { ...r, amount: value } : r
        );
    }
    @track editingGroupTempKey;
    async handleAddService() {
        console.log(' handleAddService CALLED ');
        console.log('ndisCatalogue:', JSON.stringify(this.ndisCatalogue));
        const selectedItems = this.ndisCatalogue
            .filter(r => r.selected || r.supportCatalogueRecordId)
            .map(r => ({
                 //id: r.id || null,
                 id: r.supportCatalogueRecordId || null,
                 groupId: this.editingGroupId || null,
                 catalogueId: r.id || null,
                budgetAllocation: this.budgetAllocation,
                //state: this.selectedState,
                preferredStaff: r.preferredStaff || '',
                amountSpent: this.currentAmountSpent,
                amount: r.amount || 0,
                //providerId: r.providerId,
                providerIds: r.providerIds || [],
                providerNames: r.providerNames || [],
                //selected: r.selected
                 selected: r.selected === true
        }));
        console.log('selectedItems:', JSON.stringify(selectedItems));
        console.log('selectedParticipant:', JSON.stringify(this.selectedParticipant));
        console.log('selectedServiceType:', this.selectedServiceType);
        console.log('selectedState:', this.selectedState);
        console.log('budgetAllocation:', this.budgetAllocation);
        console.log('currentAmountSpent:', this.currentAmountSpent);
        console.log('isEditMode:', this.isEditMode);
        //const invalidRow = selectedItems.find(r => !r.providerId);
        const invalidRow =selectedItems.find( r =>
                !r.providerIds ||
                r.providerIds.length === 0
        );


        if (invalidRow) {
            console.error('Provider missing for row:', JSON.stringify(invalidRow));
            this.showToast(
                'Error',
                'Please select provider for selected support items',
                'error'
            );
            return;
        }
        if (!this.selectedServiceType) {
            console.error('Validation failed: selectedServiceType missing');
            this.showToast('Error', 'Please select Service Type', 'error');
            return;
        }

        // Validate State
        if (!this.selectedState) {
            console.error('Validation failed: selectedState missing');
            this.showToast('Error', 'Please select State', 'error');
            return;
        }
        if (this.budgetAllocation != null && this.currentAmountSpent != null && Number(this.currentAmountSpent) > Number(this.budgetAllocation) ) {
             console.error('Validation failed: spent > allocation');
            this.showToast(
                'Error',
                 'Budget Spent to Date cannot be greater than budget allocation.',
                'error'
            );
            return;
        }
        if (selectedItems.length === 0) {
            console.error('Validation failed: no support items selected');
            this.showToast('Error', 'Please select at least one Support Item', 'error');
            return;
        }
        const alreadyExists = this.pendingServiceGroups.some(
            group => group.serviceType === this.selectedServiceType  &&
                group.tempKey !== this.editingGroupTempKey
        );

        //if(alreadyExists && !this.isEditMode){
        if(alreadyExists){

            this.showToast(
                'Error',
                'This Service Type already exists.',
                'error'
            );

            return;
        }
        const existingTotal = this.pendingServiceGroups
            .reduce(
                (sum, group) =>
                    sum + Number(group.budgetAllocation || 0),
                0
            );

        const currentAllocation = Number(this.budgetAllocation || 0);

        //  subtract old value during edit
        const editAllocation = this.isEditMode
                ? Number(this.pendingServiceGroups.find( g =>
                            g.tempKey ===
                        this.editingGroupTempKey
                )?.budgetAllocation || 0
                )
                : 0;
        const finalTotal = (existingTotal - editAllocation) + currentAllocation;

        if( finalTotal > Number(this.providerBudget || 0) ){
            this.showToast(
                'Error',
                'Total Budget Allocation cannot exceed Provider Budget.',
                'error'
            );
            return;
        }

       // this.isLoading = true;

        // try {
        //     console.log('Calling saveParticipantCatalogues...');
        //     //  const result =await saveParticipantCatalogues({
        //     //     supportClientId: this.selectedParticipant.id,
        //     //     selectedItems,
        //     //     isEditMode: this.isEditMode
        //     // });
        //     // console.log('saveParticipantCatalogues SUCCESS:', result);
        //     // this.showToast('Success', 'Support services saved successfully', 'success');

        //     // 🔥 IMPORTANT: Refresh table
        //     await this.loadServiceGroups();
        //      console.log('Closing modal...');

        //     // Close modal
        //     this.handleCloseAddCategoryModal();
        //     console.log('Resetting fields...');

        //     // Reset fields
        //     this.budgetAllocation = null;
        //     this.currentAmountSpent = null;
        //     console.log(' handleAddService END ');

        // } catch (e) {
        //      console.error('Full Error:', JSON.stringify(e));
        //     console.error('Error body:', JSON.stringify(e.body));
        //     console.error('Error message:', e?.body?.message);
        //     console.error('Stack:', e?.stack);
        //     this.showToast(
        //         'Error',
        //         e.body?.message || 'Failed to save services',
        //         'error'
        //     );

        // } finally {
        //      console.log('Loading false');

        //     this.isLoading = false;
        // }
        console.log('  this.selectedServiceType in addservice   :  ',this.selectedServiceType);
        const localGroup = {

            localOnly: true,

            //tempKey: `local-${Date.now()}`,
            id:this.isEditMode
                ? this.editingGroupId || null
                : null,

            tempKey:this.isEditMode
                ? this.editingGroupTempKey
                : `local-${Date.now()}`,

            serviceType: this.selectedServiceType,

            state: this.selectedState,

            budgetAllocation:
                Number(this.budgetAllocation) || 0,

            amountSpent:
                Number(this.currentAmountSpent) || 0,

            availableFunds:
                (Number(this.budgetAllocation) || 0) -
                (Number(this.currentAmountSpent) || 0),

            budgetSpentToDate:
                Number(this.currentAmountSpent) || 0,

            isExpanded: false,

            chevronIcon: 'utility:chevronright',

            supportItems: selectedItems.map(item => {

            const catalogue = this.ndisCatalogue.find(
                r => r.id === item.catalogueId
            );
            console.log(
                'FOUND CATALOGUE => ',
                JSON.stringify(catalogue)
            );

                return {
                     id: item.id || null,
                    recordId:  item.id  || `item-${Date.now()}-${Math.random()}`,
                    catalogueId: item.catalogueId,
                    supportItemName:catalogue?.name || '',
                    supportItemNumber:catalogue?.number || '',
                    // providerId: item.providerId,
                    // providerName:catalogue?.providerName || '',
                    providerIds:item.providerIds || [],
                    providerNames:item.providerNames || [],
                    //state: item.state,
                    preferredStaff:item.preferredStaff || '',
                    //isEditingPreferredStaff: !item.preferredStaff,
                    amount: Number(item.amount) || 0,
                    selected: item.selected

                };
            })
        };

        console.log(
            'localGroup:',
            JSON.stringify(localGroup)
        );

        // ================= STORE LOCALLY =================

        if (!this.pendingServiceGroups) {
            this.pendingServiceGroups = [];
        }

        // this.pendingServiceGroups = [
        //     ...this.pendingServiceGroups,
        //     localGroup
        // ];
        if(this.isEditMode){

            this.pendingServiceGroups =
                this.pendingServiceGroups.map(
                    group =>

                        group.tempKey ===
                        this.editingGroupTempKey

                            ? localGroup

                            : group
                );

        }else{

            this.pendingServiceGroups = [

                ...this.pendingServiceGroups,

                localGroup
            ];
        }

        console.log(
            'pendingServiceGroups:',
            JSON.stringify(this.pendingServiceGroups)
        );

        // ================= CLOSE MODAL =================

        this.handleCloseAddCategoryModal();

        // ================= RESET FIELDS =================

        this.budgetAllocation = null;
        this.currentAmountSpent = null;
        this.selectedServiceType = null;
        this.selectedState = null;
        this.editingGroupTempKey = null;
        this.editingGroupId = null;
        this.isEditMode = false;

        // uncheck catalogue rows
        this.ndisCatalogue = this.ndisCatalogue.map(r => ({
            ...r,
            selected: false,
            amount: null,
            providerIds: [],
            providerNames: [],
            disableProvider: true
        }));
        // ================= SUCCESS =================
        this.showToast(
            'Success',
            'Service added locally successfully',
            'success'
        );

        console.log(
            '================ handleAddService END ================'
        );
    }
    
    computeCataloguePagination() {
        this.catTotalPages =
        Math.ceil(this.ndisCatalogue.length / this.catPageSize) || 1;
    }

    // get pagedCatalogue() {
    //     const start = (this.catCurrentPage - 1) * this.catPageSize;
    //     return this.ndisCatalogue.slice(start, start + this.catPageSize);
    // }
    get pagedCatalogue() {
        const data = this.searchSupportItem
            ? this.filteredCatalogue
            : this.ndisCatalogue;

        const start = (this.catCurrentPage - 1) * this.catPageSize;

        return data.slice(start, start + this.catPageSize);
    }
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
    handleNextCatPage() {
        if (this.catCurrentPage < this.catTotalPages) {
            this.catCurrentPage++;
        }
    }

    handlePrevCatPage() {
        if (this.catCurrentPage > 1) {
            this.catCurrentPage--;
        }
    }
    // handleBudgetAllocationChange(event) {
    //     this.budgetAllocation = event.target.value;
    // }

    // handleAmountSpentChange(event) {
    //     this.currentAmountSpent = event.target.value;
    // }
    handleCatPageSizeChange(event) {
        this.catPageSize = parseInt(event.target.value, 10);
        this.catCurrentPage = 1;
        this.computeCataloguePagination();
    }

    handleFirstCatPage() {
        this.catCurrentPage = 1;
    }

    handleLastCatPage() {
        this.catCurrentPage = this.catTotalPages;
    }
    resetAddServiceModal() {
        this.selectedServiceType = null;
        this.selectedState = null;
        this.budgetAllocation = 0;
        this.currentAmountSpent = 0;
        this.selectedProvider = null;
        this.ndisCatalogue = [];
        this.selectedCatalogueMap = {};
        this.catCurrentPage = 1;
    }
    //manual entry modal handlers start here
    async handleCreateEntity() {
        this.editingEntryId = null;
        this.resetEntryForm();
        // 🔥 LOAD PARTICIPANTS HERE
        await this.loadParticipantsForEntry();
        console.log('Participant Options After Load:', this.participantOptions);
        this.showEntryModal = true;
    }
    async loadParticipantsForEntry() {
        try {
            const data = await fetchParticipantsForEntry();
            console.log('RAW Apex Data:', data);
            this.participantOptions = data.map(p => ({
                label: p.Name,
                value: p.Id
            }));
            console.log('Mapped Participant Options:', this.participantOptions);
        } catch (error) {
            console.error('Error loading participants:', error);
        }
    }

    get entryModalTitle() {
        return this.editingEntryId
            ? 'Edit Support Entry'
            : 'Create Support Entry';
    }

    handleCloseEntryModal() {
        this.showEntryModal = false;
        this.resetEntryForm();
    }

    resetEntryForm() {
        this.entryForm = {
            participantId: null,
            serviceType: null,
            supportItemName: null,
            providerId: null,
            serviceDate: null,
            hours: null,
            rate: null,
            totalAmount: null,
            claimStatus: 'Pending',
            dataSource: null,
            notes: null
        };
    }
    async handleEntryChange(event) {

        const field = event.target.dataset.field;
        const value = event.detail.value;

        // Always update form first
        this.entryForm = {
            ...this.entryForm,
            [field]: value
        };

        /* ======================================================
        1️⃣ PARTICIPANT SELECTED
        ====================================================== */
        if (field === 'participantId') {

            // Reset all dependent fields
            this.entryForm = {
                ...this.entryForm,
                serviceType: null,
                providerId: null,
                supportItemName: null,
                rate: null,
                totalAmount: null
            };

            this.serviceTypeOptionsForEntry = [];
            this.providerOptionsForEntry = [];
            this.supportItemOptions = [];
            this.supportItemRaw = [];

            const types = await fetchServiceTypesByParticipant({
                participantId: value
            });

            this.serviceTypeOptionsForEntry =
            types.map(t => ({ label: t, value: t }));
        }

        /* ======================================================
        2️⃣ SERVICE TYPE SELECTED
        ====================================================== */
        if (field === 'serviceType') {

            // Reset lower fields
            this.entryForm = {
                ...this.entryForm,
                providerId: null,
                supportItemName: null,
                rate: null,
                totalAmount: null
            };

            this.providerOptionsForEntry = [];
            this.supportItemOptions = [];

            const items = await fetchSupportItemsForEntry({
                participantId: this.entryForm.participantId,
                serviceType: value
            });

            this.supportItemRaw = items;

            // 🔹 Extract UNIQUE Providers
            const providerMap = new Map();

            items.forEach(i => {
                providerMap.set(
                    i.SupportCatlogue_To_SupportProvider__c,
                    i.SupportCatlogue_To_SupportProvider__r?.Name
                );
            });

            this.providerOptionsForEntry =
            Array.from(providerMap.entries()).map(([id, name]) => ({
                label: name,
                value: id
            }));
        }

        /* ======================================================
        3️⃣ PROVIDER SELECTED
        ====================================================== */
        if (field === 'providerId') {

            // Reset support item + rate
            this.entryForm = {
                ...this.entryForm,
                supportItemName: null,
                rate: null,
                totalAmount: null
            };

            // Filter support items for selected provider
            const filteredItems = this.supportItemRaw.filter(
                i => i.SupportCatlogue_To_SupportProvider__c === value
            );

            this.supportItemOptions = filteredItems.map(i => ({
                label: i.SupportCatalogue_To_NDISSupportCatalogue__r
                ?.Support_Item_Name__c,
                value: i.Id
            }));
        }

        /* ======================================================
        4️⃣ SUPPORT ITEM SELECTED
        ====================================================== */
    /*  if (field === 'supportItemName') {

        const selected = this.supportItemRaw.find(
        i => i.Id === value
        );

        if (selected) {

        const rate = selected.Amount__c || 0;
        const hours = this.entryForm.hours || 0;

        this.entryForm = {
        ...this.entryForm,
        supportItemName:
        selected.SupportCatalogue_To_NDISSupportCatalogue__r
        ?.Support_Item_Name__c,   // 🔥 SAVE NAME NOT ID
        rate: rate,
        totalAmount: rate * hours
        };

        // store id separately if needed
        this.selectedCatalogueId = selected.Id;
        }
        } */
    /*    if (field === 'supportItemName') {

        const selected = this.supportItemRaw.find(
            i => i.Id === value
        );

        if (selected) {

            const rate = selected.Amount__c || 0;
            const hours = this.entryForm.hours || 0;

            this.entryForm = {
                ...this.entryForm,
                supportItemName: value,   // ✅ STORE ID
                rate: rate,
                totalAmount: rate * hours
            };

            this.selectedSupportItemLabel =
                selected.SupportCatalogue_To_NDISSupportCatalogue__r
                    ?.Support_Item_Name__c;   // 🔥 STORE NAME SEPARATELY
        }
    } */
        if (field === 'supportItemName') {

            const selected = this.supportItemRaw.find(
                i => i.Id === value
            );
            if (selected) {
                const rate = selected.Amount__c || 0;
                const hours = this.entryForm.hours || 0;
                this.entryForm = {
                    ...this.entryForm,
                    supportItemName: value,   // store ID
                    rate: rate,
                    totalAmount: rate * hours
                };
                // 🔥 STORE BOTH
                this.selectedSupportItemLabel =
                    selected.SupportCatalogue_To_NDISSupportCatalogue__r
                        ?.Support_Item_Name__c;
                this.selectedSupportItemNumber =
                    selected.SupportCatalogue_To_NDISSupportCatalogue__r
                        ?.Support_Item_Number__c;
                console.log('✅ Selected Item Name:', this.selectedSupportItemLabel);
                console.log('✅ Selected Item Number:', this.selectedSupportItemNumber);
            }
        }
    }

    handleHoursChange(event) {
        const hours = parseFloat(event.detail.value) || 0;
        const rate = parseFloat(this.entryForm.rate) || 0;

        this.entryForm = {
            ...this.entryForm,
            hours: hours,
            totalAmount: hours * rate
        };
    }
    async loadSupportEntries() {
        this.entryLoading = true;
        try {
            const res = await getSupportEntriesPaged({
                pageSize: this.entryPageSize,
                pageNumber: this.entryCurrentPage
            });

            if (res.status === 'SUCCESS') {
                this.supportEntries = res.records;
                this.entryTotalPages = res.totalPages;
                this.entryTotalRecords = res.totalCount;
            }

        } catch (error) {
            this.showToast(
                'Error',
                error.body?.message || 'Failed to load entries',
                'error'
            );
        } finally {
            this.entryLoading = false;
        }
    }
    async handleSaveEntry() {
    console.log('🔍 Service Type being saved:', this.entryForm.serviceType);
    console.log('🔍 Full Entry Form:', JSON.stringify(this.entryForm));
    // 🔎 Validation
    const requiredFields = [
    'participantId',
    'serviceType',
    'providerId',
    'supportItemName',

    'serviceDate',
    'hours'
    ];

    const missing = requiredFields.filter(
    field => !this.entryForm[field]
    );

    if (missing.length > 0) {
    this.showToast(
    'Error',
    'Please fill all required fields.',
    'error'
    );
    return;
    }

    try {

    await saveSupportEntry({

    recordId: this.editingEntryId,
    participantId: this.entryForm.participantId,
    providerId: this.entryForm.providerId,
    serviceType: this.entryForm.serviceType,
   // supportItemName: this.entryForm.supportItemName,
   supportItemName: this.selectedSupportItemLabel,
   supportItemNumber: this.selectedSupportItemNumber,
    serviceDate: this.entryForm.serviceDate,
    hours: parseFloat(this.entryForm.hours),
    rate: parseFloat(this.entryForm.rate || 0),
    claimStatus: this.entryForm.claimStatus,
    dataSource: this.entryForm.dataSource,
    notes: this.entryForm.notes
    });

    this.showToast(
    'Success',
    'Support Entry saved successfully',
    'success'
    );

    // 🔄 Close modal
    this.showEntryModal = false;
    this.resetEntryForm();

    // 🔥 Refresh table
    await this.loadSupportEntries();

    }catch (error) {

    console.error('FULL SAVE ERROR:', JSON.stringify(error));

    this.showToast(
    'Error',
    error?.body?.message 
    || error?.message 
    || 'Failed to save entry',
    'error'
    );
    }
    }
    async handleEditEntry(event) {
    const recordId = event.currentTarget.dataset.id;
    const record = this.supportEntries.find(
    e => e.recordId === recordId
    );

    if (!record) return;

    // 🔥 Set edit mode
    this.editingEntryId = recordId;

    // Load participants before opening
    await this.loadParticipantsForEntry();

    // Set form values
    this.entryForm = {
    participantId: record.participantId,
    serviceType: record.serviceType,
    providerId: record.providerId,
    supportItemName: null, // will reload properly
    serviceDate: record.serviceDate,
    hours: record.hours,
    rate: record.rate,
    totalAmount: record.totalAmount,
    claimStatus: record.claimStatus,
    dataSource: record.dataSource,
    notes: record.notes
    };

    // 🔥 Now load dependent dropdowns in correct order

    // 1️⃣ Load service types
    const types = await fetchServiceTypesByParticipant({
    participantId: record.participantId
    });

    this.serviceTypeOptionsForEntry =
    types.map(t => ({ label: t, value: t }));

    // 2️⃣ Load support catalogue
    const items = await fetchSupportItemsForEntry({
    participantId: record.participantId,
    serviceType: record.serviceType
    });

    this.supportItemRaw = items;

    // 3️⃣ Load providers
    const providerMap = new Map();
    items.forEach(i => {
    providerMap.set(
    i.SupportCatlogue_To_SupportProvider__c,
    i.SupportCatlogue_To_SupportProvider__r?.Name
    );
    });

    this.providerOptionsForEntry =
    Array.from(providerMap.entries()).map(([id, name]) => ({
    label: name,
    value: id
    }));

    // 4️⃣ Filter support items for selected provider
    const filteredItems = items.filter(
    i => i.SupportCatlogue_To_SupportProvider__c === record.providerId
    );

    this.supportItemOptions = filteredItems.map(i => ({
    label: i.SupportCatalogue_To_NDISSupportCatalogue__r
    ?.Support_Item_Name__c,
    value: i.Id
    }));

    // 5️⃣ Set support item
    const matchedItem = filteredItems.find(
    i => i.SupportCatalogue_To_NDISSupportCatalogue__r
    ?.Support_Item_Name__c === record.supportItemName
    );

    if (matchedItem) {
    this.entryForm.supportItemName = matchedItem.Id;
    }

    // 🔥 Open modal
    this.showEntryModal = true;
    }
    //manual entry modal handlers end here

        // handleClick(event) {
        //     this.selectedType = event.target.dataset.type;

        //     if ( this.selectedType === 'pinned') {
        //         this.participants = this.allParticipants.filter(
        //             participant => participant.isPinned
        //         );
        //     } else {
        //         this.participants = [...this.allParticipants];
        //     }
        // }
    // handleClick(event) {

    //     // this.loadParticipants();

    //     this.selectedType = event.target.dataset.type;

    //     let filteredParticipants = [...this.allParticipants];

    //     // 🔹 Pinned filter
    //     if (this.selectedType === 'pinned') {

    //         filteredParticipants = filteredParticipants.filter(
    //             participant => participant.isPinned
    //         );
    //     }

    //     // 🔹 Search filter
    //     if (this.searchParticipant) {

    //         filteredParticipants = filteredParticipants.filter(participant => {

    //             return (
    //                 (participant.name &&
    //                     participant.name.toLowerCase().includes(this.searchParticipant)) ||

    //                 (participant.email &&
    //                     participant.email.toLowerCase().includes(this.searchParticipant)) ||

    //                 (participant.phone &&
    //                     participant.phone.toLowerCase().includes(this.searchParticipant))
    //             );
    //         });
    //     }

    //     this.participants = filteredParticipants;

    //     this.noRecordsFlag = this.participants.length === 0;
    // }

    // handleSearchParticipant(event) {

    //     this.searchParticipant = event.target.value.toLowerCase();

    //     let filteredParticipants = [...this.allParticipants];

    //     // 🔹 Pinned filter
    //     if (this.selectedType === 'pinned') {
    //         filteredParticipants = filteredParticipants.filter(
    //             participant => participant.isPinned
    //         );
    //     }

    //     // 🔹 Search filter
    //     if (this.searchParticipant) {

    //         filteredParticipants = filteredParticipants.filter(participant => {

    //             return (
    //                 (participant.name &&
    //                     participant.name.toLowerCase().includes(this.searchParticipant)) 

    //                 // (participant.email &&
    //                 //     participant.email.toLowerCase().includes(this.searchParticipant)) ||

    //                 // (participant.phone &&
    //                 //     participant.phone.toLowerCase().includes(this.searchParticipant)) ||

    //                 // (participant.risk &&
    //                 //     participant.risk.toLowerCase().includes(this.searchParticipant)) ||

    //                 // (participant.supportCategory &&
    //                 //     participant.supportCategory.toLowerCase().includes(this.searchParticipant)) ||

    //                 // (participant.ndisNumber &&
    //                 //     participant.ndisNumber.toLowerCase().includes(this.searchParticipant))
    //             );
    //         });
    //     }

    //     this.participants = filteredParticipants;

    //     this.noRecordsFlag = this.participants.length === 0;
    // }
    handleClick(event) {

        this.selectedType =
            event.target.dataset.type;

        this.pageNumber = 1;
        this.currentPage = 1;


        this.loadParticipants();
    }
    handleSearchParticipant(event) {

        this.searchParticipant =
            event.target.value.toLowerCase();

        this.pageNumber = 1;
        this.currentPage = 1;

        this.loadParticipants();
    }
      handleCreateStepClick(event) {
        const targetStep = event.target.value;
        const target = Number(targetStep.replace('createstep', ''));
        const current = this.currentStepNumber;
        if (target > this.totalSteps) return;
        if (target > current) {
            const missing = this.validateStepFields(this.createCurrentStep) || []; // ← add || []
            if (missing.length > 0) {
                //this._triggerStepValidation(this.createCurrentStep);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'Please fill required fields: ' + missing.join(', '),
                    variant: 'error'
                }));
                return;
            }
        }
        this.createCurrentStep = targetStep;
    }
    get displayedServiceGroups() {

        const dbGroups = this.serviceGroups || [];
        const localGroups = this.pendingServiceGroups || [];

        return [...dbGroups, ...localGroups];
    }
//    validateStepFields(stepName) {
//         const missing = [];
//         // const stepEl = this.template.querySelector(`[data-step="${stepName}"]`);

//         // ─── STEP 1 ───────────────────────────────────────────────────────────
    
//                 // Address
//                 const addressFieldC = stepEl?.querySelector('lightning-input-address');
//                 const streetC   = addressFieldC ? addressFieldC.street?.trim()    : this.street1?.trim();
//                 const cityC     = addressFieldC ? addressFieldC.city?.trim()       : this.city?.trim();
//                 const provinceC = addressFieldC ? addressFieldC.province?.trim()   : this.province?.trim();
//                 const postalC   = addressFieldC ? addressFieldC.postalCode?.trim() : this.postalcode?.trim();
//                 const countryC  = addressFieldC ? addressFieldC.country?.trim()    : this.country?.trim();
//                 if (!streetC || !cityC || !provinceC || !postalC || !countryC) {
//                     missing.push('Address');
//                 }

//         return missing;
//     }
    validateStepFields(stepName) {

        const missing = [];

        const stepEl =
            this.template.querySelector(
                `[data-step="${stepName}"]`
            );

        if (stepName === 'createstep1') {
            const allInputs = [

                ...stepEl.querySelectorAll(
                    'lightning-input'
                ),

                ...stepEl.querySelectorAll(
                    'lightning-combobox'
                ),

                ...stepEl.querySelectorAll(
                    'lightning-textarea'
                )
            ];

            allInputs.forEach(field => {

                field.reportValidity();

                if (!field.checkValidity()) {

                    missing.push(
                        field.label ||
                        field.name ||
                        'Field'
                    );
                }
            });

            const phoneField =
                stepEl?.querySelector(
                    '[name="phone"]'
                );

            const phoneValue =
                phoneField?.value?.trim() || '';

            if (
                phoneValue &&
                !/^\d{10}$/.test(phoneValue)
            ) {

                phoneField.setCustomValidity(
                    'Phone Number must be exactly 10 digits'
                );

                phoneField.reportValidity();

                missing.push('Phone Number');

            } else {

                phoneField?.setCustomValidity('');

                phoneField?.reportValidity();
            }

            const ndisField =
                stepEl?.querySelector(
                    '[name="ndisNumber"]'
                );

            const ndisValue =
                ndisField?.value?.trim() || '';

            if (
                ndisValue &&
                !/^\d{9}$/.test(ndisValue)
            ) {

                ndisField.setCustomValidity(
                    'NDIS Number must be exactly 9 digits'
                );

                ndisField.reportValidity();

                missing.push('NDIS Number');

            } else {

                ndisField?.setCustomValidity('');

                ndisField?.reportValidity();
            }

            const aboutField =
                stepEl?.querySelector(
                    '[name="aboutParticipant"]'
                );

            const aboutValue =
                aboutField?.value || '';

            if (aboutValue.length > 25000) {

                aboutField.setCustomValidity(
                    'About Participant cannot exceed 25000 characters'
                );

                aboutField.reportValidity();

                missing.push('About Participant');

            } else {

                aboutField?.setCustomValidity('');

                aboutField?.reportValidity();
            }

            const addressFieldC =
                stepEl?.querySelector(
                    'lightning-input-address'
                );

            const streetC =
                addressFieldC
                    ? addressFieldC.street?.trim()
                    : this.street1?.trim();

            const cityC =
                addressFieldC
                    ? addressFieldC.city?.trim()
                    : this.city?.trim();

            const provinceC =
                addressFieldC
                    ? addressFieldC.province?.trim()
                    : this.province?.trim();

            const postalC =
                addressFieldC
                    ? addressFieldC.postalCode?.trim()
                    : this.postalcode?.trim();

            const countryC =
                addressFieldC
                    ? addressFieldC.country?.trim()
                    : this.country?.trim();

            // STREET
            if (!streetC) {

                addressFieldC?.setCustomValidityForField(
                    'Complete this field.',
                    'street'
                );

                missing.push('Street');

            } else {

                addressFieldC?.setCustomValidityForField(
                    '',
                    'street'
                );
            }

            // SUBURB
            if (!cityC) {

                addressFieldC?.setCustomValidityForField(
                    'Complete this field.',
                    'city'
                );

                missing.push('Suburb');

            } else {

                addressFieldC?.setCustomValidityForField(
                    '',
                    'city'
                );
            }

            // STATE
            if (!provinceC) {

                addressFieldC?.setCustomValidityForField(
                    'Complete this field.',
                    'province'
                );

                missing.push('State');

            } else {

                addressFieldC?.setCustomValidityForField(
                    '',
                    'province'
                );
            }

            // POST CODE
            if (!postalC) {

                addressFieldC?.setCustomValidityForField(
                    'Complete this field.',
                    'postalCode'
                );

                missing.push('Post Code');

            } else {

                addressFieldC?.setCustomValidityForField(
                    '',
                    'postalCode'
                );
            }

            // COUNTRY
            if (!countryC) {

                addressFieldC?.setCustomValidityForField(
                    'Complete this field.',
                    'country'
                );

                missing.push('Country');

            } else {

                addressFieldC?.setCustomValidityForField(
                    '',
                    'country'
                );
            }

            addressFieldC?.reportValidity();
        }

        return [...new Set(missing)];
    }
    addContactRow() {
        this.contactList = [
            ...this.contactList,
            {
                id: Date.now(),
                firstName: '',
                lastName: '',
                contactNumber: '',
                email: '',
                contactType: '',
                notify:false,
                firstNamePlaceholder: 'Enter Name',
                lastNamePlaceholder: 'Enter Name',
                phonePlaceholder: 'Enter Number',
                emailPlaceholder: 'Enter Email',
                showAdd: true,
                addButtonClass: 'add-visible'
            }
        ];
        this.updateAddButtonVisibility();
    }
    updateAddButtonVisibility() {
            const lastIndex = this.contactList.length - 1;

            this.contactList = this.contactList.map((row, index) => {
                const isLast = index === lastIndex;

                return {
                    ...row,
                    showAdd: isLast,
                    addButtonClass: isLast ? 'add-visible' : 'add-hidden'
                };
            });
    }
    removeContactRow(event) {
        // if (this.nonndisFlag === false && this.contactList.length === 1) {
        if (this.contactList.length === 1) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'At least one row is required.',
                    variant: 'error'
                })
            );
            return;
        }
        const index = event.target.dataset.index;
        this.contactList.splice(index, 1);
        this.contactList = [...this.contactList];
        this.updateAddButtonVisibility();
        console.log( "this.contactList in delete row : " + JSON.stringify(this.contactList));
        
    }

    handleContactsChange(event) {
        const index = event.target.dataset.index;
        const field = event.target.name;
        // let value = event.target.value;
        let value;
        if (event.target.type === "checkbox") {
            value = event.target.checked;
        } else {
            value = event.target.value;
        }
        
        if (field === 'contactType' && value === 'Add New Contact Type') {

            this.activeContactRowIndex = index;
            this.previousContactType = this.contactList[index].contactType;

        // this.contactList[index].contactType = this.previousContactType || '';
            this.contactList[index].contactType = '';

            this.contactList = [...this.contactList]; // force UI sync
            console.log( "this.contactList in handleContactsChange : " + JSON.stringify(this.contactList));

            this.showContactTypeModal = true;
            return;
        }
        this.contactList[index][field] = value;
        if (field === 'notify' && value === true && !this.contactList[index].email) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Email Required',
                    message: `Email is required when Notify is selected ( Contact Row ${index + 1}).`,
                    variant: 'error'
                })
            );

            // ⛔ Revert checkbox to false
        // this.contactList[index].notify = false;
        }

        const isMandatory =
            this.contactList[index].contactType === 'Primary';

            this.contactList[index].firstNamePlaceholder =
                isMandatory  ? '* Enter Name' : 'Enter Name';

            this.contactList[index].lastNamePlaceholder =
                isMandatory  ? '* Enter Name' : 'Enter Name';

            this.contactList[index].phonePlaceholder =
                isMandatory  ? '* Enter Number' : 'Enter Number';

            this.contactList[index].emailPlaceholder =
                isMandatory  ? '* Enter Email' : 'Enter Email';
        this.contactList = [...this.contactList];
        console.log( "this.contactList : " + JSON.stringify(this.contactList));
    }
    
    handleNewContactTypeInput(event) {
        this.newContactTypeName = event.target.value;
    }
    saveContactType() {
        const newValue = this.newContactTypeName?.trim();
        console.log('newValue : ',newValue);
        if (!newValue) {
            console.error('Contact Type Name is required.');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Contact Type Name is required',
                    variant: 'error',
                })
            );
            return;
        }

        /* ===============================
        COMMIT DELETES (SAFE ORDER)
        =============================== */
        if (this.stagedDeleteTypes.length > 0) {
            console.log('this.stagedDeleteTypes.length ', this.stagedDeleteTypes.length);

            // 1️⃣ Clear from rows
            this.contactList = this.contactList.map(row => {
                if (this.stagedDeleteTypes.includes(row.contactType)) {
                    return { ...row, contactType: '' };
                }
                return row;
            });

            // 2️⃣ Remove from custom types
            this.customContactTypes =
                this.customContactTypes.filter(
                    t => !this.stagedDeleteTypes.includes(t.value)
                );

            // 3️⃣ Remove from dropdown
            this.contactTypeOptions =
                this.contactTypeOptions.filter(
                    o => !this.stagedDeleteTypes.includes(o.value)
                );
            //  this.contactList[this.activeContactRowIndex].contactType = '';
            //this.contactList = [...this.contactList];
            
        }
        /* ===============================
        ADD NEW CONTACT TYPE
        =============================== */
        if (newValue) {
            if (!this.contactTypeOptions.some(o => o.value === newValue)) {
                const newOption = { label: newValue, value: newValue };

                this.customContactTypes = [...this.customContactTypes, newOption];

                this.contactTypeOptions = [
                    ...this.contactTypeOptions.filter(o => o.value !== 'Add New Contact Type'),
                    newOption,
                    { label: 'Add New', value: 'Add New Contact Type' }
                ];
            }

            // ✅ select new value
            this.contactList[this.activeContactRowIndex].contactType = newValue;
            this.contactList = [...this.contactList];
        }


        this.resetContactTypeModal();
        //this.showContactTypeModal = false;
        //this.newContactTypeName = '';
        console.log('this.contactList in save : ',JSON.stringify(this.contactList));
    }
    
    deleteCustomContactType(event) {
        const value = event.currentTarget.dataset.value;

        this.customContactTypes =
            this.customContactTypes.filter(t => t.value !== value);

        this.contactTypeOptions =
            this.contactTypeOptions.filter(o => o.value !== value);
    }
    
    closeContactTypeModal() {
        const index = this.activeContactRowIndex;

        if (index === null || index === undefined) {
            this.resetContactTypeModal();
            return;
        }

        // Remove the problematic row
        this.contactList.splice(index, 1);

        // Insert a brand-new row at the same position
        this.contactList.splice(index, 0, this.createEmptyContactRow());

        // Commit reactivity
        this.contactList = [...this.contactList];

        // Fix Add button visibility
        this.updateAddButtonVisibility();

        // Reset modal state
        this.resetContactTypeModal();
    }
    createEmptyContactRow() {
        return {
            id: Date.now(),
            firstName: '',
            lastName: '',
            contactNumber: '',
            email: '',
            contactType: '',
            notify: false,
            firstNamePlaceholder: 'Enter Name',
            lastNamePlaceholder: 'Enter Name',
            phonePlaceholder: 'Enter Number',
            emailPlaceholder: 'Enter Email',
            showAdd: false,
            addButtonClass: 'add-hidden'
        };
    }
    
    isContactTypeUsed(value) {
        return this.contactList.some(row => row.contactType === value);
    }
    
    stageDeleteContactType(event) {
        console.log('--- stageDeleteContactType  ---');
        console.log( "this.contactList in stageDeleteContactType : " + JSON.stringify(this.contactList));
        const value = event.currentTarget.dataset.value;
        console.log('Clicked value:', value);
        if (!value) {
            console.warn('No value found in dataset');
            return;
        }


        // ❌ do NOT stage delete if used
        if (this.isContactTypeUsed(value)) {
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Cannot Delete',
                    message: `"${value}" is currently used in contact rows.`,
                    variant: 'warning'
                })
            );
            return;
        }
        console.log('Contact type is NOT used, proceeding to delete');

        if (!this.stagedDeleteTypes.includes(value)) {
            this.stagedDeleteTypes = [...this.stagedDeleteTypes, value];
            console.log('Updated stagedDeleteTypes:', this.stagedDeleteTypes);
        }
        console.log('before  stagedDeleteTypes:', this.stagedDeleteTypes);
        console.log('Before removal contactTypeOptions:', this.contactTypeOptions);
        console.log( "this.contactList before : " + JSON.stringify(this.contactList));

        this.customContactTypes = this.customContactTypes.filter(
            t => t.value !== value
        );

        console.log('After removal customContactTypes:', this.customContactTypes);

        this.contactTypeOptions = this.contactTypeOptions.filter(
            item => item.value !== value
        );

        console.log('After removal contactTypeOptions:', this.contactTypeOptions);
        console.log( "this.contactList after : " + JSON.stringify(this.contactList));

    }

    resetContactTypeModal() {
        this.showContactTypeModal = false;
        this.newContactTypeName = '';
        // this.activeContactRowIndex = undefined;
        // this.previousContactType = undefined;
        this.activeContactRowIndex = null;
        this.previousContactType = null;
        
        this.stagedDeleteTypes = [];
        console.log('this.contactList in reset 11: ',JSON.stringify(this.contactList));
        this.contactList = [...this.contactList];
        console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
    }
    handleSearchSupportItem(event) {
        this.searchSupportItem = event.target.value.toLowerCase();

        if (this.searchSupportItem) {
            this.filteredCatalogue = this.ndisCatalogue.filter(item =>
                item.name &&
                item.name.toLowerCase().includes(this.searchSupportItem)
            );
        } else {
            this.filteredCatalogue = [];
        }

        this.catCurrentPage = 1;
        this.noRecordsFlag = this.pagedCatalogue.length === 0;
    }
    handleAttachmentClick(event) {
    
        console.log('🔥 handleAttachmentClick fired');
    
        const index = event.currentTarget.dataset.index;
    
        console.log('📌 Clicked Index:', index);
    
        console.log(
            '📂 contactList:',
            JSON.stringify(this.contactList)
        );
    
        const selectedContact = this.contactList[index];
    
        console.log(
            '👤 selectedContact:',
            JSON.stringify(selectedContact)
        );
    
        if (!selectedContact) {
    
            console.error('❌ Contact not found');
    
            return;
        }
    
        // IMPORTANT
        this.currentContactId =
            selectedContact.id || selectedContact.Id;
    
        console.log(
            '✅ currentContactId:',
            this.currentContactId
        );
    
        this.showContactAttachmentModal = true;
    
        this.uploadedFiles = [];
        this.totalfiles = [];
        this.isFileExpand = false;
        this.fileName = '';
    }
    
    handleSaveContactAttachment() {
    
        console.log('🔥 Save Attachment Clicked');
    
        console.log('👤 currentContactId:', this.currentContactId);
    
        console.log(
            '📂 uploadedFiles:',
            JSON.stringify(this.uploadedFiles)
        );
    
        // =====================================================
        // VALIDATION
        // =====================================================
    
        if (!this.currentContactId) {
    
            console.error('❌ No contact selected');
    
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error",
                    message: "No contact selected",
                    variant: "error"
                })
            );
    
            return;
        }
    
        if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
    
            console.error('❌ No uploaded files found');
    
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error",
                    message: "Please upload at least one file",
                    variant: "error"
                })
            );
    
            return;
        }
    
        // =====================================================
        // FIND CONTACT
        // =====================================================
    
        const contactIndex = this.contactList.findIndex(
            row =>
                row.id === this.currentContactId ||
                row.Id === this.currentContactId
        );
    
        console.log('📌 contactIndex:', contactIndex);
    
        if (contactIndex === -1) {
    
            console.error('❌ Contact row not found');
    
            return;
        }
    
        // =====================================================
        // INIT uploadedFiles
        // =====================================================
    
        if (!this.contactList[contactIndex].uploadedFiles) {
    
            this.contactList[contactIndex].uploadedFiles = [];
        }
    
        // =====================================================
        // NORMALIZE NEW FILES
        // =====================================================
    
        const newFiles = this.uploadedFiles.map(file => {
    
            return {
    
                // existing attachments later will have value
                attachmentId: null,
    
                originalName:
                    file.originalName ||
                    file.name ||
                    file.fileName,
    
                url:
                    file.url,
    
                key:
                    file.key,
    
                size:
                    file.size
            };
        });
    
        console.log(
            '🟢 normalized newFiles:',
            JSON.stringify(newFiles)
        );
    
        // =====================================================
        // MERGE FILES
        // =====================================================
    
        this.contactList[contactIndex].uploadedFiles = [
    
            ...this.contactList[contactIndex].uploadedFiles,
    
            ...newFiles
        ];
    
        // =====================================================
        // UPDATE ATTACHMENT COUNT
        // =====================================================
    
        this.contactList[contactIndex].attachmentCount =
            this.contactList[contactIndex].uploadedFiles.length;
    
        console.log(
            '📎 attachmentCount:',
            this.contactList[contactIndex].attachmentCount
        );
    
            // =====================================================
            // FORCE REACTIVITY
            // =====================================================
    
            this.contactList = [...this.contactList];
    
            console.log(
                '✅ Updated contact row:',
                JSON.stringify(this.contactList[contactIndex])
            );
    
            this.showContactAttachmentModal = false;
    
    }
    
    handleCloseContactAttachmentModal() {
        this.showContactAttachmentModal = false;
    
        this.uploadedFiles = [];
        this.totalfiles = [];
        this.isFileExpand = false;
        this.fileName = '';
    }
    
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }
    
    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
    
        let files = Array.from(event.dataTransfer.files || []);
    
        if (!this._validateFiles(files)) return;
    
        this.totalfiles.push(...files);
    
        this.processFiles(files);
    }
    
    handleFileUploadInputChange(event) {
    
        console.log('🔥 handleFileUploadInputChange triggered');
    
        let files = Array.from(event.target.files || []);
    
        console.log('📂 Selected Files:', files);
    
        console.log('📂 File Count:', files.length);
    
        if (!this._validateFiles(files)) {
    
            console.log('❌ File validation failed');
    
            event.target.value = '';
    
            return;
        }
    
        console.log('✅ File validation passed');
    
        this.totalfiles.push(...files);
    
        console.log('📦 totalfiles:', this.totalfiles);
    
        this.processFiles(files);
    
        event.target.value = '';
    }
    
    _validateFiles(files) {
    
        const longName = files.find(f => f.name.length > 180);
    
        if (longName) {
    
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error",
                    message: `Filename too long: "${longName.name}"`,
                    variant: "error"
                })
            );
            return false;
        }
    
        const MAX = 50 * 1024 * 1024;
    
        const existing = this.totalfiles.reduce(
            (s, f) => s + f.size,
            0
        );
    
        const incoming = files.reduce(
            (s, f) => s + f.size,
            0
        );
    
        if (existing + incoming > MAX) {
    
            this.showToast(
                'Error',
                'Total file size cannot exceed 50 MB.',
                'error'
            );
    
            return false;
        }
    
        return true;
    }
    
    processFiles(files) {
    
        console.log('🚀 processFiles called');
    
        console.log('📂 Incoming Files:', files);
    
        if (!files || !files.length) {
    
            console.log('❌ No files found');
    
            return;
        }
    
        this.isFileExpand = true;
    
        console.log('✅ isFileExpand set to TRUE');
    
        requestAnimationFrame(() => {
    
            console.log('🎯 First RAF triggered');
    
            requestAnimationFrame(() => {
    
                console.log('🎯 Second RAF triggered');
    
                const svc = this.template.querySelector(
                    'c-document-office-service'
                );
    
                console.log('🧩 Upload Component:', svc);
    
                if (!svc) {
    
                    console.warn(
                        '❌ c-document-office-service NOT FOUND'
                    );
    
                    return;
                }
    
                console.log('✅ Upload component found');
    
                svc.incomingFiles = files;
    
                console.log(
                    '📤 Files passed to child component:',
                    files
                );
    
            });
    
        });
    }
    
    triggerAttachInput() {
    
        console.log('🔥 triggerAttachInput called');
    
        const input = this.template.querySelector(
            '.contact-upload-input'
        );
    
        console.log('📂 File Input Element:', input);
    
        if (!input) {
    
            console.error('❌ File input NOT FOUND');
    
            return;
        }
    
        console.log('✅ File input found');
    
        input.value = '';
    
        console.log('🟢 Opening file picker');
    
        input.click();
    
        console.log('📤 input.click() executed');
    }
    
    handleAwsUploadComplete(evt) {
    
        console.log('🔥 handleAwsUploadComplete fired');
    
        console.log('📦 Event Detail:', JSON.stringify(evt.detail));
    
        try {
    
            const { files = [] } = evt.detail || {};
    
            console.log('📂 Uploaded AWS Files:', files);
    
            if (!files.length) {
    
                console.warn('❌ No uploaded files returned');
    
                return;
            }
    
            this.uploadedFiles = files;
    
            console.log(
                '✅ uploadedFiles updated:',
                JSON.stringify(this.uploadedFiles)
            );
    
            this.fileName =
                files.map(f => f?.originalName)
                     .filter(Boolean)
                     .join(', ');
    
            this.isFileAttached = true;
    
            console.log('✅ File upload success');
    
        } catch (e) {
    
            console.error(
                '❌ handleAwsUploadComplete ERROR:',
                e
            );
        }
    }
    
    handleFileDeleted(event) {
    
        const { fileId, files } = event.detail;
    
        this.uploadedFiles =
            this.uploadedFiles.filter(
                f => f.fileId !== fileId
            );
    
        this.totalfiles = [];
    
        if (!files || files.length === 0) {
    
            this.isFileExpand = false;
    
            this.fileName = '';
        }
    }
    
    handlefilecancel() {
        this.totalfiles = [];
    }
    
    handleDeleteAttachment(event) {
    
        const attachmentId =
            event.currentTarget.dataset.id;
    
        console.log(
            'Deleting Attachment:',
            attachmentId
        );
    
        this.showSpinner = true;
    
        deleteContactAttachment({
            attachmentId: attachmentId
        })
        .then(() => {
    
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Success",
                    message: "Attachment deleted successfully",
                    variant: "success"
                })
            );
    
            // Refresh file list
            this.loadContactAttachments();
    
            this.loadContactAttachmentCounts();

        })
        .catch(error => {
    
            console.error(error);
    
            this.showToast(
                'Error',
                error?.body?.message || 'Delete failed',
                'error'
            );
        })
        .finally(() => {
            this.showSpinner = false;
        });
    }
    
    closeAttachmentListModal() {
    
        this.showAttachmentListModal = false;
        this.contactAttachments = [];
        this.selectedContactForFiles = null;
        this.ParticpantRecordForm = true;
    }
    
    loadContactAttachmentCounts() {
    
        const contactIds = this.contactList
            .filter(con => con.id)
            .map(con => con.id);
        console.log(
            '📦 contactIds in attachment count:',
            JSON.stringify(contactIds)
        );
        if (!contactIds.length) {
            return;
        }
        
        getContactAttachmentCounts({
            contactIds: contactIds
        })
        .then(result => {
            
        console.log(
            '📦 Raw Result in attachment count:',
            JSON.stringify(result)
        );
            this.contactList = this.contactList.map(con => {
    
                const count = result[con.id] || 0;
    
                return {
                    ...con,
                    attachmentCount: count,
                    isPlural: count > 0,
                    attachmentLabel:
                        count === 1
                            ? '1 File'
                            : `${count} Files`
                };
            });
    
            console.log(
                'Attachment Counts:',
                JSON.stringify(this.contactList)
            );
        })
        .catch(error => {
            console.error(
                'Error loading attachment counts',
                error
            );
        });
    }
    
    handleOpenAttachmentList(event) {
    
        const index = event.currentTarget.dataset.index;
        const contact = this.contactList[index];
        if (!contact || !contact.id) {
            return;
        }
        this.selectedContactId = contact.id;
        // OPEN MODAL
        this.showAttachmentListModal = true;
        // LOAD FILES
        this.loadContactAttachments();
    }
    
    loadContactAttachments() {
    
        getContactAttachments({
            contactId: this.selectedContactId
        })
        .then(result => {
            console.log('result in load attachments  ', JSON.stringify(result));
    
            // ============================================
            // MODAL ATTACHMENT LIST
            // ============================================
    
            this.contactAttachments = result.map(file => {
    
                return {
                    ...file,
                    viewUrl: file.Amazon_file_URL__c
                };
            });
    
            // ============================================
            // 🔥 IMPORTANT FIX
            // SYNC uploadedFiles FOR CONTACT
            // ============================================
    
            const contactIndex = this.contactList.findIndex(
                row =>
                    row.id === this.selectedContactId ||
                    row.Id === this.selectedContactId
            );
    
            if (contactIndex !== -1) {
    
                this.contactList[contactIndex].uploadedFiles =
                    result.map(file => {
    
                        return {
    
                            // 🔥 CRITICAL
                            attachmentId: file.Id,
    
                            originalName:
                                file.File_Name__c || file.Name,
    
                            url:
                                file.Amazon_file_URL__c,
    
                            key:
                                file.Key__c,
    
                            size:
                                file.Size__c
                        };
                    });
    
                // 🔥 FORCE REACTIVITY
                this.contactList = [...this.contactList];
            }
    
            console.log(
                '✅ Attachments synced:',
                JSON.stringify(this.contactList[contactIndex])
            );
        })
        .catch(error => {
    
            console.error(
                'Error loading attachments',
                error
            );
        });
    }
    
    handlereturn() {
    
        this.isViewDoc = false;
    
        // ONLY OPEN FILES MODAL
        this.showAttachmentListModal = true;
    
        this.participantModule = true;
    
        // KEEP EDIT SCREEN CLOSED
        this.ParticpantRecordForm = false;
    }
    
    @track currentUrl = '';
    
    getFileType(url) {
    
        if (!url) {
            return '';
        }
    
        return url
            .split('.')
            .pop()
            .split('?')[0]
            .toLowerCase();
    }
    
    handleViewAttachment(event) {
    
        event.preventDefault();
    
        const url = event.currentTarget.dataset.url;
    
        this.currentUrl = url;
    
        console.log('Viewing URL:', this.currentUrl);
    
        // CLOSE ATTACHMENT MODAL
        this.showAttachmentListModal = false;
    
        // CLOSE PARTICIPANT EDIT SCREEN
        this.ParticpantRecordForm = false;
    
        // OPEN VIEW
        this.isViewDoc = true;
    
        this.showAttachmentListModal = false;
    
        this.participantModule = false;
    
    
        const fileType = this.getFileType(this.currentUrl);
    
        console.log('File Type:', fileType);
    
        // 🔥 SUPPORTED PREVIEW TYPES
        if (
            fileType !== 'png' &&
            fileType !== 'pdf' &&
            fileType !== 'jpeg' &&
            fileType !== 'jpg' &&
            fileType !== 'csv' &&
            fileType !== 'svg'
        ) {
    
            console.log(
                'Unsupported preview type'
            );
    
            // 🔥 FALLBACK
            setTimeout(() => {
    
                this.handlereturn();
    
            }, 1700);
    
            return;
        }
    }

    handleSkip() {
        //this.createCurrentStep = 'createstep3';
         if (this.createCurrentStep === 'createstep2') {

            this.createCurrentStep ='createstep3';

            return;
        }

        if ( this.createCurrentStep === 'createstep3' ) {

            this.createCurrentStep ='createstep4';

            return;
        }
    }
   
    handleAddCoordinatorCategoryModal() {
        //  if(this.displayedCoordinatorServiceGroups.length===1){
        //     this.dispatchEvent(
        //         new ShowToastEvent({
        //             title:'Error',
        //             message:'Support Coordination service has already been added.',
        //             variant: 'error'
        //         })
        //     );
        //     return;
        // }
        this.resetCoordinatorServiceModal();
        this.isCoordinatorEditMode = false; 
        this.showAddSupportCoordinatorCategoryModal = true;
        //this.selectedCoordinatorServiceType = 'Support Coordination';
        //this.tryLoadNDISCatalogue();
        this.tryLoadSupportCoordinatorCatalogue();
        
       
    }

    async handleEditCoordinatorService(event) {
        console.log('handleEditCoordinatorService');
        const serviceType = event.currentTarget.dataset.type;
        const group = this.displayedCoordinatorServiceGroups.find(
            g => g.serviceType === serviceType
        );
        console.log('👉 Clicked serviceType:', serviceType);
        console.log('👉 Full group object:', JSON.stringify(group));
        console.log('👉 group.providerId:', group?.providerId);
       // console.log('👉 Current providerOptions:', JSON.stringify(this.providerOptions))
        if (!group) return;
        this.isCoordinatorEditMode = true; 
        this.editingCoordinatorGroupTempKey = group.tempKey;
        this.editingCoordinatorGroupId = group.id || null;

        // if (!this.providerOptions || this.providerOptions.length === 0) {
        //     await this.loadProviders();
        // }
        // Set values
        this.selectedCoordinatorServiceType = group.serviceType;
        this.selectedCoordinatorState = group.state;          // 🔥 IMPORTANT
        this.budgetCoordinatorAllocation = group.budgetAllocation;
        this.coordinatorCurrentAmountSpent = group.amountSpent;
        //console.log('👉 Available options:', this.providerOptions.map(p => p.value));
        //console.log('👉 Match found:', this.providerOptions.some(p => p.value === this.selectedProvider));
        // Open modal
        this.showAddSupportCoordinatorCategoryModal = true;

        // Load catalogue after setting both service type and state
        //await this.tryLoadNDISCatalogue();
        await this.tryLoadSupportCoordinatorCatalogue();
        this.coordinatorCatalogue = this.coordinatorCatalogue.map(row => {

            // const existingItem =
            //     group.supportItems?.find(
            //         si => si.catalogueId === row.id
            //     );
             const existingItem =
                group.supportItems?.find(
                     si => 
                    // si.catalogueId === row.id
                      si.supportItemNumber === row.number
                );


            if (existingItem) {
                return {
                    ...row,
                    //selected: true,
                    supportCoordinatorCatalogueRecordId:existingItem.id || null,
                    selected: existingItem.selected,
                    isEditingAmount: false,
                    amount: existingItem.amount,
                    //disableProvider: false,
                    //providerId: existingItem.providerId,
                   // providerName:existingItem.providerName
                };
            }
            //return row;
             return {

                ...row,

                selected: false,

                //disableProvider: true,

                isEditingAmount: false
            };
        });
        console.log( 'Preselected coordinatorCatalogue => ',JSON.stringify(this.coordinatorCatalogue) );
    }

    handleSearchCoordinatorSupportItem(event) {
        this.searchCoordinatorSupportItem = event.target.value.toLowerCase();

        if (this.searchCoordinatorSupportItem) {
            this.filteredCoordinatorCatalogue = this.coordinatorCatalogue.filter(item =>
                item.name &&
                item.name.toLowerCase().includes(this.searchCoordinatorSupportItem)
            );
        } else {
            this.filteredCoordinatorCatalogue = [];
        }

        this.coordinatorCatCurrentPage = 1;
       // this.noRecordsFlag = this.pagedCoordinatorCatalogue.length === 0;
    }
    enableAmountEdit(event) {

        const recordId = event.currentTarget.dataset.id;

        const oldAmount =event.currentTarget.dataset.amount;

        this.oldCoordinatorAmountValue = oldAmount;

        this.coordinatorCatalogue = this.coordinatorCatalogue.map(row => {
            return row.id === recordId
                ? { ...row, isEditingAmount: true}
                : { ...row, isEditingAmount: false };
        });
    }
    @track oldCoordinatorAmountValue;
    @track oldServiceRowAmountValue;
    
    handleRowAmountChange(event) {
        const recordId = event.target.dataset.id;
        let newValue = parseFloat(event.target.value);

        //if (isNaN(newValue) || newValue < 0) {
        if ( newValue < 0) {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid Value',
                    message: 'Amount must be a positive number.',
                    variant: 'error'
                })
            );

            this.coordinatorCatalogue =
                this.coordinatorCatalogue.map(row =>
                    row.id === recordId
                        ? {
                            ...row,
                            isEditingAmount: false,
                            amount: parseFloat(this.oldCoordinatorAmountValue).toFixed(2)
                        }
                        : row
                );

            return;
        }

        newValue = parseFloat(newValue).toFixed(2);

        this.coordinatorCatalogue =
            this.coordinatorCatalogue.map(row =>
                row.id === recordId
                    ? {
                        ...row,
                        amount: newValue
                    }
                    : row
            );
    }

    handleAmountKeyDown(event) {

        if (event.key === 'Enter') {

            const recordId =
                event.target.dataset.id;

            this.saveCoordinatorAmount({
                currentTarget: {
                    dataset: {
                        id: recordId
                    }
                }
            });
        }
    }

    saveCoordinatorAmount(event) {

        const localId =
            event.currentTarget.dataset.id;

        this.coordinatorCatalogue =
            this.coordinatorCatalogue.map(row =>

                row.id === localId

                    ? {
                        ...row,
                        amount: parseFloat(
                            row.amount || 0
                        ).toFixed(2),
                        isEditingAmount: false
                    }

                    : row
            );
    }
    enableServiceRowAmountEdit(event) {

        const recordId =
            event.currentTarget.dataset.id;

        const oldAmount =
            event.currentTarget.dataset.amount;

        this.oldServiceRowAmountValue =
            oldAmount;

        this.ndisCatalogue =
            this.ndisCatalogue.map(row =>

                row.id === recordId

                    ? {
                        ...row,
                        isEditingAmount: true
                    }

                    : {
                        ...row,
                        isEditingAmount: false
                    }
            );
    }
//     enableServiceRowAmountEdit(event) {

//     const recordId =
//         event.currentTarget.dataset.id;

//     const oldAmount =
//         event.currentTarget.dataset.amount;

//     console.log(
//         '=== enableServiceRowAmountEdit START ==='
//     );

//     console.log(
//         'Clicked Record Id =>',
//         recordId
//     );

//     console.log(
//         'Old Amount =>',
//         oldAmount
//     );

//     this.oldServiceRowAmountValue =
//         oldAmount;

//     console.log(
//         'Before Update =>',
//         JSON.stringify(this.ndisCatalogue)
//     );

//     this.ndisCatalogue =
//         this.ndisCatalogue.map(row => {

//             const updatedRow =
//                 row.id === recordId

//                     ? {
//                         ...row,
//                         isEditingAmount: true
//                     }

//                     : {
//                         ...row,
//                         isEditingAmount: false
//                     };

//             console.log(
//                 'Updated Row =>',
//                 JSON.stringify(updatedRow)
//             );

//             return updatedRow;
//         });

//     console.log(
//         'After Update =>',
//         JSON.stringify(this.ndisCatalogue)
//     );

//     console.log(
//         '=== enableServiceRowAmountEdit END ==='
//     );
// }
    handleServiceRowAmountChange(event) {

        const recordId =
            event.target.dataset.id;

        let newValue =
            parseFloat(event.target.value);

        if (newValue < 0) {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid Value',
                    message: 'Amount must be a positive number.',
                    variant: 'error'
                })
            );

            this.ndisCatalogue =
                this.ndisCatalogue.map(row =>

                    row.id === recordId

                        ? {
                            ...row,
                            isEditingAmount: false,
                            amount: parseFloat(
                                this.oldServiceRowAmountValue
                            ).toFixed(2)
                        }

                        : row
                );

            return;
        }

        newValue =
            parseFloat(newValue).toFixed(2);

        this.ndisCatalogue =
            this.ndisCatalogue.map(row =>

                row.id === recordId

                    ? {
                        ...row,
                        amount: newValue
                    }

                    : row
            );
    }
    handleServiceRowAmountKeyDown(event) {

        if (event.key === 'Enter') {

            this.saveServiceRowAmount({
                currentTarget: {
                    dataset: {
                        id: event.target.dataset.id
                    }
                }
            });
        }
    }
    saveServiceRowAmount(event) {

        const localId =
            event.currentTarget.dataset.id;

        this.ndisCatalogue =
            this.ndisCatalogue.map(row =>

                row.id === localId

                    ? {
                        ...row,
                        amount: parseFloat(
                            row.amount || 0
                        ).toFixed(2),
                        isEditingAmount: false
                    }

                    : row
            );
    }

 
    // get coordinatorServiceTypeOptions() {

    //     return (this.serviceTypeOptions || []).filter(

    //         option =>

    //             option.value ===
    //             'Support Coordination'
    //     );
    // }

    get isCoordinatorServiceTypeDisabled() {

        return true;
    }

    
  computeCoordinatorCataloguePagination() {

    const data =
        this.searchCoordinatorSupportItem
            ? this.filteredCoordinatorCatalogue
            : this.coordinatorCatalogue;

    this.coordinatorCatTotalPages =
        Math.max(
            1,
            Math.ceil(
                (data || []).length /
                this.coordinatorCatPageSize
            )
        );

    if (
        this.coordinatorCatCurrentPage >
        this.coordinatorCatTotalPages
    ) {

        this.coordinatorCatCurrentPage =
            this.coordinatorCatTotalPages;
    }
}

    handleCoordinatorNextCatPage() {

        if (
            this.coordinatorCatCurrentPage <
            this.coordinatorCatTotalPages
        ) {

            this.coordinatorCatCurrentPage++;
        }
    }

    handleCoordinatorPrevCatPage() {

        if (this.coordinatorCatCurrentPage > 1) {

            this.coordinatorCatCurrentPage--;
        }
    }

    handleCoordinatorFirstCatPage() {

        this.coordinatorCatCurrentPage = 1;
    }

    handleCoordinatorLastCatPage() {

        this.coordinatorCatCurrentPage =
            this.coordinatorCatTotalPages;
    }

    handleCoordinatorCatPageSizeChange(event) {

        this.coordinatorCatPageSize =
            parseInt(event.target.value, 10);
             console.log('Page Size:', this.coordinatorCatPageSize);

        this.coordinatorCatCurrentPage = 1;

        this.computeCoordinatorCataloguePagination();
    }

    get totalCoordinatorCatalogueRecords() {

        return this.searchCoordinatorSupportItem
            ? this.filteredCoordinatorCatalogue.length
            : this.coordinatorCatalogue.length;
    }

    get isCoordinatorCatFirstPage() {

        return this.coordinatorCatCurrentPage === 1;
    }

    get isCoordinatorCatLastPage() {

        return this.coordinatorCatCurrentPage ===
            this.coordinatorCatTotalPages;
    }

    get pagedCoordinatorCatalogue() {

        const data =
            this.searchCoordinatorSupportItem
                ? this.filteredCoordinatorCatalogue
                : this.coordinatorCatalogue;

        const start =
            (this.coordinatorCatCurrentPage - 1) *
            this.coordinatorCatPageSize;

        return data.slice(
            start,
            start + this.coordinatorCatPageSize
        );
    }

   
    handleCloseAddCategoryModal() {

        if (this.createCurrentStep === 'createstep2') {
            this.showAddSupportCoordinatorCategoryModal = false;
            this.resetCoordinatorServiceModal();
            return;
        } else if (this.createCurrentStep === 'createstep3') {
            this.showAddSupportCategoryModal = false;
            this.resetAddServiceModal();
        }
    }
handleCoordinatorStateChange(event) {

    const newState = event.detail.value;
      console.log('🟩 New State:',newState);
      console.log('🟦 Previous State:',this.selectedCoordinatorState);
      console.log(  '🟨 selectedCoordinatorServiceType:',this.selectedCoordinatorServiceType );

    if ( this.selectedCoordinatorState && this.selectedCoordinatorState !== newState  ) {
        this.coordinatorCatalogue = [];
        this.selectedCoordinatorCatalogueMap = {};
        this.coordinatorCatCurrentPage = 1;
    }
    this.selectedCoordinatorState = newState;
    console.log('🟦 new State in state change :',this.selectedCoordinatorState);
   // this.tryLoadCoordinatorNDISCatalogue();
   this.tryLoadSupportCoordinatorCatalogue();
 
}
// async tryLoadCoordinatorNDISCatalogue() {

//     if (
//         !this.selectedCoordinatorServiceType ||
//         !this.selectedCoordinatorState
//     ) {

//         this.coordinatorCatalogue = [];

//         return;
//     }

//     this.isLoading = true;

//     try {

//         const records =
//             await fetchParticipantNDISCatalogue({

//                 serviceType:
//                     this.selectedCoordinatorServiceType,

//                 serviceDate:
//                     new Date()
//                         .toISOString()
//                         .split('T')[0]
//             });

//         this.coordinatorCatalogue =
//             records.map(r => ({

//                 id: r.Id,
//                 name:
//                     r.Support_Item_Name__c,
//                 number:
//                     r.Support_Item_Number__c,
//                 amount:
//                     r[
//                         `${this.selectedCoordinatorState}__c`
//                     ] || 0,
//                 selected: false,
//                 isEditingAmount: false
//             }));

//         this.computeCoordinatorCataloguePagination();

//     } catch (e) {

//         this.showToast(
//             'Error',
//             e.body?.message ||
//             'Failed to load coordinator catalogue',
//             'error'
//         );

//     } finally {

//         this.isLoading = false;
//     }
// }
    handleCoordinatorCatalogueSelect(event) {
        const id = event.target.dataset.id;
        const checked = event.target.checked;
        this.coordinatorCatalogue = this.coordinatorCatalogue.map(r =>
                r.id === id
                    ? {
                        ...r,
                        selected: checked,
                        isEditingAmount: false
                    }
                    : r
            );
    }
    handleAddCoordinatorService() {
        if (!this.selectedCoordinatorServiceType) {
                console.error('Validation failed: selectedCoordinatorServiceType missing');
                this.showToast('Error', 'Please select Service Type', 'error');
                return;
            }

            //  Validate State
            if (!this.selectedCoordinatorState) {
                console.error('Validation failed: selectedCoordinatorState missing');
                this.showToast('Error', 'Please select State', 'error');
                return;
            }
            if (this.budgetCoordinatorAllocation != null && this.coordinatorCurrentAmountSpent != null && Number(this.coordinatorCurrentAmountSpent) > Number(this.budgetCoordinatorAllocation) ) {
                console.error('Validation failed: spent > allocation');
                this.showToast(
                    'Error',
                    'Budget Spent to Date cannot be greater than budget allocation.',
                    'error'
                );
                return;
            }

        const selectedItems =
            this.coordinatorCatalogue
                .filter(r => r.selected || r.supportCoordinatorCatalogueRecordId)
                .map(r => ({
                    id:r.supportCoordinatorCatalogueRecordId || null,
                    groupId: this.editingCoordinatorGroupId || null,
                    catalogueId: r.id,
                    state: this.selectedCoordinatorState,
                    amount: r.amount || 0,
                    budgetAllocation: this.budgetAllocation,
                    //state: this.selectedState,
                    amountSpent: this.currentAmountSpent,
                    selected:  r.selected === true
                }));

        if (selectedItems.length === 0) {
            this.showToast(
                'Error',
                'Please select at least one Support Item',
                'error'
            );
            return;
        }
        const alreadyExists = this.coordinatorPendingServiceGroups.some(
            group => group.serviceType === this.selectedCoordinatorServiceType &&
                     group.tempKey !== this.editingCoordinatorGroupTempKey
        );

        if(alreadyExists && !this.isCoordinatorEditMode){

            this.showToast(
                'Error',
                'This Service Type already exists.',
                'error'
            );

            return;
        }
        const existingTotal = this.coordinatorPendingServiceGroups
            .reduce(
                (sum, group) =>
                    sum + Number(group.budgetAllocation || 0),
                0
            );

        const currentAllocation = Number(this.budgetCoordinatorAllocation || 0);

        //  subtract old value during edit
        const editAllocation = this.isCoordinatorEditMode
                ? Number(this.coordinatorPendingServiceGroups.find( g =>
                            g.serviceType === this.selectedCoordinatorServiceType
                    )?.budgetAllocation || 0
                )
                : 0;
        const finalTotal = (existingTotal - editAllocation) + currentAllocation;

        if( finalTotal > Number(this.supportCoordinationBudget || 0) ){
            this.showToast(
                'Error',
                'Total Budget Allocation cannot exceed Support Coordination Budget.',
                'error'
            );
            return;
        }
    // if (selectedItems.length === 1) {
        // if(this.displayedCoordinatorServiceGroups.length===1 && !this.isCoordinatorEditMode){
        //     this.showToast(
        //         'Error',
        //         'Support Coordination service has already been added.',
        //         'error'
        //     );

        //     return;
        // }

        const localGroup = {

            localOnly: true,
            //tempKey: `coordinator-${Date.now()}`,
            id: this.isCoordinatorEditMode
                ? this.editingCoordinatorGroupId || null
                : null,
            tempKey: this.isCoordinatorEditMode
                ? this.editingCoordinatorGroupTempKey
                : `coordinator-${Date.now()}`,
            serviceType: this.selectedCoordinatorServiceType,
            state: this.selectedCoordinatorState,
            budgetAllocation: Number(this.budgetCoordinatorAllocation) || 0,
            amountSpent: Number(this.coordinatorCurrentAmountSpent) || 0,
            budgetSpentToDate:Number(this.coordinatorCurrentAmountSpent) || 0,
            isExpanded: false,
            chevronIcon:'utility:chevronright',
            supportItems:selectedItems.map(item => {

                    const catalogue =
                        this.coordinatorCatalogue.find(
                            r => r.id === item.catalogueId
                        );

                    return {
                        id: item.id || null,

                        recordId: item.id || `coord-${Date.now()}-${Math.random()}`,
                        catalogueId: item.catalogueId,
                        supportItemName:catalogue?.name || '',
                        supportItemNumber:catalogue?.number || '',
                        state:item.state,
                        amount: Number(item.amount) || 0,
                        selected: item.selected
                    };
                })
        };
        if (this.isCoordinatorEditMode) {

            this.coordinatorPendingServiceGroups =
                this.coordinatorPendingServiceGroups.map(group =>

                   group.tempKey ===
                        this.editingCoordinatorGroupTempKey

                        ? {
                            ...group,
                            state: this.selectedCoordinatorState,
                            budgetAllocation: Number(this.budgetCoordinatorAllocation) || 0,
                            amountSpent: Number(this.coordinatorCurrentAmountSpent) || 0,
                            budgetSpentToDate: Number(this.coordinatorCurrentAmountSpent) || 0,
                            supportItems: localGroup.supportItems
                        }
                        : group
                );

        } else {

            // NORMAL ADD
            this.coordinatorPendingServiceGroups = [
                ...this.coordinatorPendingServiceGroups,
                localGroup
            ];
        }

        this.displayedCoordinatorServiceGroups =
            [...this.coordinatorPendingServiceGroups];

        this.showAddSupportCoordinatorCategoryModal = false;
        this.resetCoordinatorServiceModal();
        this.isCoordinatorEditMode = false;
        this.showToast(
            'Success',
            'Coordinator service added successfully',
            'success'
        );
    }
    resetCoordinatorServiceModal() {
        this.selectedCoordinatorServiceType =  null;
        this.selectedCoordinatorState = null;
        this.budgetCoordinatorAllocation = 0;
        this.coordinatorCurrentAmountSpent = 0;
        this.coordinatorCatalogue = [];
        this.selectedCoordinatorCatalogueMap = {};
        this.coordinatorCatCurrentPage = 1;
    }
    
    handleToggleCoordinatorExpand(event) {

        const serviceType =event.currentTarget.dataset.type;
        this.expandedCoordinatorServiceType =
            this.expandedCoordinatorServiceType ===
            serviceType
                ? null
                : serviceType;

        this.coordinatorPendingServiceGroups =
            this.coordinatorPendingServiceGroups.map(g => {
                const expanded =
                    g.serviceType ===
                    this.expandedCoordinatorServiceType;
                return {
                    ...g,
                    isExpanded: expanded,
                    chevronIcon: expanded
                                ? 'utility:chevrondown'
                                : 'utility:chevronright'
                };
            });

        this.displayedCoordinatorServiceGroups =
            [...this.coordinatorPendingServiceGroups];
    }
    // computeCoordinatorCataloguePagination() {

    //     this.coordinatorCatTotalPages =
    //         Math.ceil(
    //             this.coordinatorCatalogue.length /
    //             this.coordinatorCatPageSize
    //         ) || 1;
    // }

    // handleCoordinatorNextCatPage() {

    //     if (
    //         this.coordinatorCatCurrentPage <
    //         this.coordinatorCatTotalPages
    //     ) {

    //         this.coordinatorCatCurrentPage++;
    //     }
    // }

    // handleCoordinatorPrevCatPage() {

    //     if (this.coordinatorCatCurrentPage > 1) {

    //         this.coordinatorCatCurrentPage--;
    //     }
    // }

    // handleCoordinatorFirstCatPage() {

    //     this.coordinatorCatCurrentPage = 1;
    // }

    // handleCoordinatorLastCatPage() {

    //     this.coordinatorCatCurrentPage =
    //         this.coordinatorCatTotalPages;
    // }

    // get pagedCoordinatorCatalogue() {

    //     const start =
    //         (this.coordinatorCatCurrentPage - 1) *
    //         this.coordinatorCatPageSize;

    //     const end =
    //         start + this.coordinatorCatPageSize;

    //     return (this.coordinatorCatalogue || []).slice(start, end);
    // }

    // get totalCoordinatorCatalogueRecords() {

    //     return (this.coordinatorCatalogue || []).length;
    // }

    // get isCoordinatorCatFirstPage() {

    //     return this.coordinatorCatCurrentPage <= 1;
    // }

    // get isCoordinatorCatLastPage() {

    //     return this.coordinatorCatCurrentPage >=
    //         this.coordinatorCatTotalPages;
    // }
    

    // handleCoordinatorCatPageSizeChange(event) {

    //     this.coordinatorCatPageSize =
    //         parseInt(event.detail.value, 10);

    //     this.coordinatorCatCurrentPage = 1;

    //     this.computeCoordinatorCataloguePagination();
    // }

    async tryLoadSupportCoordinatorCatalogue() {
        console.log('tryLoadSupportCoordinatorCatalogue called ');
         console.log( ' selectedCoordinatorServiceType:',this.selectedCoordinatorServiceType
    );

    console.log(
        '🟩 selectedCoordinatorState:',
        this.selectedCoordinatorState
    );

        if (!this.selectedCoordinatorServiceType || !this.selectedCoordinatorState) {
            this.coordinatorCatalogue = [];
            return;
        }
        this.isLoading = true;
        try {
             console.log(' Calling Apex...');
            const records = await fetchSupportCoordinatorCatalogue({
            serviceType: this.selectedCoordinatorServiceType,
            serviceDate: new Date().toISOString().split('T')[0]
        });
        
        console.log(
            '📦 Record count:',
            records?.length
        );
          console.log(
            '✅ Apex records:',
            JSON.stringify(records)
        );


        // Map rows with state-based amount
        this.coordinatorCatalogue = records.map(r => ({
            id: r.Id,
            name: r.Support_Item_Name__c,
            number: r.Support_Item_Number__c,
            amount: r[`${this.selectedCoordinatorState}__c`] || 0,
            selected: false,
            isEditingAmount: false
            //providerId: null,
            //disableProvider: true   
        }));
         console.log(
            '🧾 coordinatorCatalogue:',
            JSON.stringify(
                this.coordinatorCatalogue
            )
        );
        this.coordinatorCatCurrentPage = 1;
        this.computeCoordinatorCataloguePagination();
        // Load existing records (edit support)
        await this.loadExistingSupportCoordinatorCatalogues();
            //this.computeCataloguePagination();
        } catch (e) {
            this.showToast('Error', e.body?.message || 'Failed to load catalogue', 'error');
        } finally {
            this.isLoading = false;
        }
    }
    async loadExistingSupportCoordinatorCatalogues() {
        if (!this.isEditMode) return;
        if (!this.selectedParticipant?.id || !this.selectedCoordinatorServiceType) return;

        const existing = await fetchParticipantSupportCoordinatorCatalogues({
            supportClientId: this.selectedParticipant.id,
            serviceType: this.selectedCoordinatorServiceType,
            state: this.selectedCoordinatorState,

        });
        this.selectedCoordinatorCatalogueMap = {};

        existing.forEach(rec => {
            if (rec.IsActive__c) {
                const key =
                rec.Support_Coordinator_Catalogue__c +
                '-' +
                rec.State__c ;
               // +
                //'-' +
               // rec.SupportCatlogue_To_SupportProvider__c;

                this.selectedCoordinatorCatalogueMap[key] = rec;
            }
        });

        this.coordinatorCatalogue = this.coordinatorCatalogue.map(row => {

        const match = Object.values(this.selectedCoordinatorCatalogueMap).find(rec =>
            rec.Support_Coordinator_Catalogue__c === row.id &&
            rec.State__c === this.selectedCoordinatorState
        );

        if (match) {
            return {
                ...row,
                selected: true,
               // providerId: match.SupportCatlogue_To_SupportProvider__c,
               // disableProvider: false
            };
        }

        return row;
        });
    }
     async loadCoordinatorServiceTypes() {
        try {
            const types = await fetchCoordinatorServiceTypes();

                this.coordinatorServiceTypeOptions = types.map(type => ({
                label: type,
                value: type
            }));
            console.log(' this.coordinatorServiceTypeOptions  in loadCoordinatorServiceTypes : ', JSON.stringify( this.coordinatorServiceTypeOptions));


        } catch (error) {
            this.showToast(
                'Error',
                error.body?.message || 'Failed to load service types',
                'error'
            );
        }
    }
        handleBudgetClick(event) {
        const participantId = event.currentTarget.dataset.id;
        console.log('Budget clicked for:', participantId);
        this.selectedBudgetParticipantId = participantId;
        this.showBudgetModal = true;
        this.participantflag = false;
    }
 
    handleBudgetClose() {
        this.showBudgetModal = false;
        this.selectedBudgetParticipantId = null;
        this.participantflag = true;
    }
    get isStatusActive() {
        return this.status === 'Active';
    }

    handleStatusToggle(event) {
        const isChecked = event.target.checked;

        this.status = isChecked ? 'Active' : 'Inactive';

        console.log('Status:', this.status);
    }
    handlePreferredStaffChange(event) {

        const id = event.currentTarget.dataset.id;
        const value = event.target.value;
         console.log('id:', id);
          console.log('value:', value);

        this.ndisCatalogue = this.ndisCatalogue.map(r =>

            r.id === id

                ? {
                    ...r,
                    preferredStaff: value
                }

                : r
        );
         console.log('Updated ndisCatalogue IN handlePreferredStaffChange => ',  JSON.stringify(this.ndisCatalogue) );
    }

    // savePreferredStaff(event) {

    //     const id = event.currentTarget.dataset.id;

    //     this.ndisCatalogue = this.ndisCatalogue.map(r =>

    //         r.id === id

    //             ? {
    //                 ...r,
    //                 isEditingPreferredStaff: false
    //             }

    //             : r
    //     );
    // }

    // enablePreferredStaffEdit(event) {

    //     const id = event.currentTarget.dataset.id;

    //     this.ndisCatalogue = this.ndisCatalogue.map(r =>

    //         r.id === id

    //             ? {
    //                 ...r,
    //                 isEditingPreferredStaff: true
    //             }

    //             : r
    //     );
    // }
 
   
 


}