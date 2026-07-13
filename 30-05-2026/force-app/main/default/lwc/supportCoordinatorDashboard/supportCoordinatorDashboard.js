import { LightningElement, track } from 'lwc';
import saveParticipant from '@salesforce/apex/SupportParticipantController.saveParticipants';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllParticipants from '@salesforce/apex/SupportParticipantController.getAllParticipants';
import getProviders from '@salesforce/apex/Support_ProviderController.getProviders';
import getTasksByDateRange from '@salesforce/apex/SupportParticipantController.getTasksByDateRange';
import getDashboardMetrics from '@salesforce/apex/Support_ProviderController.getDashboardMetrics';
export default class DashboardUi extends LightningElement {
    
    // Calendar State
    
    @track selectedProviderId = null;
    @track showProviderModal = false;
    currDate = new Date(); 
    @track calendarDays = [];
    @track currentMonthYear = '';
    @track createParticipantshowModal = false;
    @track fullName = null;
    @track ndisNumber = null;
    @track dob = null;
    @track phone = null;
    @track email = null;
    @track street = null;
    @track city = null;
    @track province = null;
    @track postalcode = null;
    @track country = null; 
    @track planStart = null;
    @track planEnd = null;
    @track planBudget = null;
    @track supportCategory = null;
    @track riskLevel = null;
    @track emergencyContact = null; 
    @track dashboardflag = false;
    @track showTaskModal = false;
    @track participantflag = true;
    @track createParticipantshowModal = false;
    @track createParticipantDetailsModal = false;
    //calender 
    @track selectedDate = null;
    @track upcomingEvents = [];
    @track allDayEvents = [];
    //end
    @track showCaseNoteModal = false;
    @track showGoalsModal = false;
    @track supportCategoryOptions = [
        { label: 'Core Supports', value: 'Core' },
        { label: 'Capacity Building', value: 'Capacity' },
        { label: 'Capital Supports', value: 'Capital' },
    ];
    @track riskLevelOptions = [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' }
    ];
    @track selectedTab = 'all';
    @track participants = [];
    @track searchKey = '';
    @track pagedParticipants = [];

    @track participantPageSize = 10;
    @track participantPageNumber = 1;
    @track participantTotalPages = 0;
    @track participantTotalRecords = 0;

    @track participantDisableFirst = true;
    @track participantDisableLast = true;

    participantPageSizeOptions = [10, 20, 50];

    // 1. Metrics (Exact Color Matching)
    metrics = [
        { 
            id: 1, label: 'Active Participants', value: '42 / 80', sub: '20%', 
            bgClass: 'metric-card bg-blue', textClass: 'text-blue', iconClass: 'icon-box icon-blue ', 
            badgeClass: 'badge-blue', iconName: 'groups' 
        },
        { 
            id: 2, label: 'Active Goals', value: '22', sub: '20%', 
            bgClass: 'metric-card bg-green', textClass: 'text-green', iconClass: 'icon-box icon-green', 
            badgeClass: 'badge-green', iconName: 'track_changes' 
        },
        { 
            id: 3, label: 'Pending Tasks', value: '06', sub: '', 
            bgClass: 'metric-card bg-orange', textClass: 'text-orange', iconClass: 'icon-box icon-orange', 
            badgeClass: '', iconName: 'assignment' 
        },
        { 
            id: 4, label: 'Billable Hours', value: '40%', sub: '', 
            bgClass: 'metric-card bg-purple', textClass: 'text-purple', iconClass: 'icon-box icon-purple', 
            badgeClass: '', iconName: 'account_balance_wallet' 
        }
    ];

    // 2. Providers
    @track providers = [];

    // 3. Participants
   @track  participants = [ ];

    // 4. Events
    events = [
        { id: 1, title: 'Presentation of the new PPT', time: 'Today | 5:00 PM', dur: '1h', borderClass: 'border-blue' },
        { id: 2, title: 'Anna\'s Birthday Meet', time: 'Today | 6:00 PM', dur: '30m', borderClass: 'border-blue' },
        { id: 3, title: 'New Client Meeting', time: 'Tomorrow | 2:00 PM', dur: '10m', borderClass: 'border-green' }
    ];

    // 5. Alerts
    alerts = [
        { id: 1, msg: 'Updated the status on File', sub: '', style: 'alert-box alert-yellow', icon: 'utility:arrowup' },
        { id: 2, msg: 'High Budget Utilization', sub: 'James Rodriguez - 82% budget used', style: 'alert-box alert-red', icon: 'utility:warning' },
        { id: 3, msg: 'Updated the status on File', sub: '', style: 'alert-box alert-green', icon: 'utility:arrowdown' }
    ];

    connectedCallback() {
        // ✅ 1. Set selectedDate FIRST
        const today = new Date();
        this.selectedDate =`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        this.renderCalendar();
        this.loadPinnedParticipants();
        this.loadDashboardProviders();
        this.loadUpcomingEvents();
        this.loadDashboardMetrics();
    }

    prevMonth() {
        this.currDate.setMonth(this.currDate.getMonth() - 1);
        this.currDate = new Date(this.currDate);
        this.renderCalendar();
    }

    nextMonth() {
        this.currDate.setMonth(this.currDate.getMonth() + 1);
        this.currDate = new Date(this.currDate);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currDate.getFullYear();
        const month = this.currDate.getMonth();

        this.currentMonthYear = this.currDate.toLocaleString('default', {
            month: 'long',
            year: 'numeric'
        });

        const firstDayIdx = new Date(year, month, 1).getDay();
        const paddingDays = firstDayIdx === 0 ? 6 : firstDayIdx - 1;
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

        let daysArr = [];

        // 🔹 Padding days (NO date, NO click)
        for (let i = 0; i < paddingDays; i++) {
            daysArr.push({
                id: `pad-${i}`,
                val: '',
                date: null,
                class: 'cal-day empty'
            });
        }

        // 🔹 Actual month days
        for (let day = 1; day <= lastDateOfMonth; day++) {
            const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            let className = 'cal-day';

            if (fullDate === this.selectedDate) {
                className += ' cal-active';
            }

            daysArr.push({
                id: `day-${day}`,
                val: day,
                date: fullDate,
                class: className
            });
        }

        this.calendarDays = daysArr;
    }
    
    async handleDateSelect(event) {
        const selectedDate = event.currentTarget.dataset.date;
        if (!selectedDate) return;

        this.selectedDate = selectedDate;

        // 🔵 Highlight selected date
        this.calendarDays = this.calendarDays.map(d => {
            if (!d.date) return d;
            return {
                ...d,
                class: d.date === selectedDate ? 'cal-day cal-active' : 'cal-day'
            };
        });

        await this.loadUpcomingEvents();
    }

    async loadUpcomingEvents() {
        console.log('=== loadUpcomingEvents START ===');
        console.log('Selected Date:', this.selectedDate);

        try {
            console.log('Calling getTasksByDateRange Apex...');

            const result = await getTasksByDateRange({
                startDate: this.selectedDate,
                endDate: this.selectedDate
            });

            console.log('Raw Apex Result:', JSON.stringify(result, null, 2));
            console.log('Total Tasks Returned:', result ? result.length : 0);

            // Sort by start time
            const sorted = [...result].sort((a, b) => {
                console.log('Sorting Compare:', {
                    taskA: a.Name,
                    startA: a.Start_Time__c,
                    taskB: b.Name,
                    startB: b.Start_Time__c
                });

                if (!a.Start_Time__c || !b.Start_Time__c) {
                    console.log('Missing Start Time, skipping sort comparison');
                    return 0;
                }

                return a.Start_Time__c - b.Start_Time__c;
            });

            console.log('Sorted Tasks:', JSON.stringify(sorted, null, 2));

            // Map data for dashboard
            this.allDayEvents = sorted.map(t => {
                console.log('------------------------------');
                console.log('Processing Task:', t.Id);

                const participantName = t.SupportClient_To_Notes__r
                    ? `${t.SupportClient_To_Notes__r.First_Name__c || ''} ${t.SupportClient_To_Notes__r.Last_Name__c || ''}`.trim()
                    : '';

                console.log('Participant Name:', participantName);

                const mappedEvent = {
                    id: t.Id,
                    title: t.Notes_Type__c || 'No Title',
                    participantName: participantName,
                    time: this.formatTime(t.Start_Time__c),
                    duration: t.Duration_Hours__c || 0
                };

                console.log(
                    'Mapped Event:',
                    JSON.stringify(mappedEvent, null, 2)
                );

                return mappedEvent;
            });

            console.log(
                'All Day Events:',
                JSON.stringify(this.allDayEvents, null, 2)
            );

            // Assign to UI
            this.upcomingEvents = this.allDayEvents;

            console.log(
                'Upcoming Events Assigned:',
                JSON.stringify(this.upcomingEvents, null, 2)
            );

            console.log('Total Upcoming Events:', this.upcomingEvents.length);
            console.log('=== loadUpcomingEvents SUCCESS ===');

        } catch (error) {
            console.error('=== loadUpcomingEvents ERROR ===');
            console.error('Error loading upcoming events:', error);
            console.error('Error Message:', error?.message);
            console.error('Error Body:', error?.body);
            console.error('Stack Trace:', error?.stack);

            this.upcomingEvents = [];
            this.allDayEvents = [];
            this.showViewAll = false;

            console.log('Fallback values assigned after error');
        }
    }

    formatTime(timeValue) {
        if (!timeValue) return '';

        const totalMinutes = Math.floor(timeValue / (1000 * 60));
        let hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const meridian = hours >= 12 ? 'PM' : 'AM';
        if (hours === 0) hours = 12;
        else if (hours > 12) hours -= 12;

        return `${hours}:${String(minutes).padStart(2, '0')} ${meridian}`;
    }
    
    handleAddParticipant() {
        console.log('==============================');
        console.log('🚀 Dashboard Add Participant Clicked');
        console.log(
            'createParticipantshowModal BEFORE:',
            this.createParticipantshowModal
        );

        this.createParticipantshowModal = true;

        console.log(
            'createParticipantshowModal AFTER:',
            this.createParticipantshowModal
        );
        console.log('Waiting for participant child render...');

        setTimeout(() => {
            console.log('⏳ setTimeout triggered');

            const participantCmp = this.template.querySelector(
                'c-support-coordinator-participant-management'
            );

            console.log('Participant component found:', participantCmp);

            if (participantCmp) {
                console.log('✅ Calling openFromDashboard()');
                participantCmp.openFromDashboard();
            } else {
                console.error('❌ Participant component NOT found');
            }

            console.log('==============================');
        }, 100);
    }

    handleCloseParticipant() {
        console.log('==============================');
        console.log('❌ Participant close event received');

        console.log(
            'createParticipantshowModal BEFORE:',
            this.createParticipantshowModal
        );

        this.createParticipantshowModal = false;

        console.log(
            'createParticipantshowModal AFTER:',
            this.createParticipantshowModal
        );

        console.log('==============================');
    }

    createParticipantcloseModal() {
        this.createParticipantshowModal = false;
        this.resetParticipantFields();
    }

    async createParticipantsaveParticipant() {
        console.log('Save Participant clicked');

        let missingFields = [];

        // PERSONAL INFO
        if (!this.fullName) missingFields.push('Full Name');
        if (!this.ndisNumber) missingFields.push('NDIS Number');
        if (!this.dob) missingFields.push('Date of Birth');
        if (!this.phone) missingFields.push('Phone Number');
        if (!this.email) missingFields.push('Email Address');

        // ADDRESS
        if (!this.street) missingFields.push('Street');
        if (!this.city) missingFields.push('Suburb');
        if (!this.province) missingFields.push('State');
        if (!this.postalcode) missingFields.push('Post Code');
        if (!this.country) missingFields.push('Country');

        // PLAN INFO
        if (!this.planStart) missingFields.push('Plan Start Date');
        if (!this.planEnd) missingFields.push('Plan End Date');
        if (!this.planBudget) missingFields.push('Total Plan Budget');
        if (!this.supportCategory) missingFields.push('Support Category');
        if (!this.riskLevel) missingFields.push('Risk Level');
        if (!this.emergencyContact) missingFields.push('Emergency Contact');

        // ❌ Missing Fields
        if (missingFields.length > 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Required Fields Missing',
                    message: `Please fill: ${missingFields.join(', ')}`,
                    variant: 'error',
                    mode: 'dismissable'
                })
            );
            return;
        }

        console.log('✅ All fields valid, proceeding to Apex…');

        // Prepare single participant payload
        const participantPayload = {
            fullName: this.fullName,
            ndisNumber: this.ndisNumber,
            dob: this.dob,
            phone: this.phone,
            email: this.email,
            street: this.street,
            city: this.city,
            province: this.province,
            postalcode: this.postalcode,
            country: this.country,
            planStart: this.planStart,
            planEnd: this.planEnd,
            planBudget: this.planBudget,
            supportCategory: this.supportCategory,
            riskLevel: this.riskLevel,
            emergencyContact: this.emergencyContact
        };

        try {
            // 🔵 CALL BULK APEX (must send list)
            const newIds = await saveParticipant({
                participantsData: [participantPayload]
            });

            console.log('✔ Participant created with Ids:', newIds);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Participant created successfully!',
                    variant: 'success'
                })
            );

            this.createParticipantshowModal = false;
            this.resetParticipantFields();

        } catch (error) {
            console.error('❌ Apex error:', error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Creating Participant',
                    message: error?.body?.message || 'Unknown error occurred',
                    variant: 'error',
                    mode: 'sticky'
                })
            );
        }
    }

    resetParticipantFields() {
        this.fullName = null;
        this.ndisNumber = null;
        this.dob = null;
        this.phone = null;
        this.email = null;
        this.address = null;

        this.planStart = null;
        this.planEnd = null;
        this.planBudget = null;
        this.supportCategory = null;
        this.riskLevel = null;
        this.emergencyContact = null;

        // Address fields (for lightning-input-address)
        this.street = null;
        this.city = null;
        this.province = null;
        this.postalcode = null;
        this.country = null;
    }

    handleparticipantCreateChange(event) {
        const field = event.target.name;
        this[field] = event.target.value;
    }

    addressInputChange(event) {
        const address = event.detail;

        this.street = address.street;
        this.city = address.city;
        this.province = address.province;
        this.postalcode = address.postalCode;
        this.country = address.country;

        console.log('📍 Address Updated:', JSON.stringify(address));
    }

    handleEditProvider(event) {
        const providerId = event.target.dataset.id;
        console.log(' Edit clicked for provider:', providerId);
        this.showProviderModal = true;
        setTimeout(() => {
            const providerCmp = this.template.querySelector(
                'c-support-coordinator-providers'
            );
            console.log(' Provider component found?', providerCmp);
            if (providerCmp) {
                console.log(' Calling openEdit()');
                providerCmp.openEdit(providerId);
            } else {
                console.log(' Provider component NOT READY');
            }
        }, 0);
    }

    handleViewProvider(event) {
        const providerId = event.target.dataset.id;

        this.selectedProviderId = providerId;
        this.dashboardflag = true;
        this.showProviderModal = true;
    }

    renderedCallback() {
        // Wait for elements to render
        if (this.rendered) return;
        this.rendered = true;
        
        // Find all lightning-input labels and style them
        const inputs = this.template.querySelectorAll('lightning-input');
        inputs.forEach(input => {
            // This approach uses mutation observer to catch when shadow DOM renders
            const observer = new MutationObserver(() => {
                const label = input.shadowRoot?.querySelector('.slds-form-element__label');
                if (label) {
                    label.style.color = '#000000';
                    observer.disconnect();
                }
            });
            
            // Start observing
            if (input.shadowRoot) {
                observer.observe(input.shadowRoot, { childList: true, subtree: true });
            }
        });
        
    }

    handleAddProvider() {
        console.log('==============================');
        console.log('🚀 Dashboard Add Provider Clicked');
        console.log('showProviderModal BEFORE:', this.showProviderModal);

        this.showProviderModal = true;

        console.log('showProviderModal AFTER:', this.showProviderModal);
        console.log('Waiting for provider child render...');

        setTimeout(() => {
            console.log('⏳ setTimeout triggered');

            const providerCmp = this.template.querySelector(
                'c-support-coordinator-providers'
            );

            console.log('Provider component found:', providerCmp);

            if (providerCmp) {
                console.log('✅ Calling openFromDashboard()');
                providerCmp.openFromDashboard();
            } else {
                console.error('❌ Provider component NOT found');
            }

            console.log('==============================');
        }, 100);
    }

    handleCloseProvider() {
        this.showProviderModal = false;
        this.selectedProviderId = null;
         this.dashboardflag = false;
         this.loadDashboardProviders(); // Refresh providers list when modal closes
    }

    getInitials(name) {
        if (!name) return '';

        return name
            .split(' ')
            .filter(word => word)
            .map(word => word.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    formatAmount(value) {
        return Number(value || 0).toLocaleString('en-AU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB');
    }

    getRiskClass(risk) {
        if (!risk) return 'text-weak';
        const value = risk.trim().toLowerCase();
        if (value === 'high') return 'text-red';
        if (value === 'medium') return 'text-orange';
        if (value === 'low') return 'text-green';
        return 'text-weak';
    }

    getAvatarClass(name) {
        const colors = ['avatar-circle'];
        return colors[name.length % colors.length];
    }

    async loadPinnedParticipants() {
        try {
            const data = await getAllParticipants();
            console.log('Raw participant data:', JSON.stringify(data));

            this.participants = data.map(p => {
                console.log(
                    'Budget raw value:',
                    p.Budget_Spent_to_Date__c
                );

                let actualPercent = Number(p.Budget_Spent_to_Date__c) || 0;

                if (actualPercent > 1000) {
                    actualPercent = actualPercent / 100;
                }

                const spentPercent = Math.min(actualPercent, 100);

                const participantName =
                    (p.First_Name__c || p.Last_Name__c)
                        ? `${p.First_Name__c || ''} ${p.Last_Name__c || ''}`.trim()
                        : p.Name;

                return {
                    id: p.Id,
                    name: participantName,
                    initials: this.getInitials(participantName),
                    avatarColor: this.getAvatarClass(participantName),

                    date:
                        this.formatDate(p.Plan_Start_Date__c) +
                        ' - ' +
                        this.formatDate(p.Plan_End_Date__c),

                    budget: `$${this.formatAmount(p.Total_Plan_Budget__c) || 0}`,

                    risk: p.Risk_Level__c,
                    riskClass: this.getRiskClass(p.Risk_Level__c),
                    ndisNumber: p.NDIS_Number__c,

                    percent: Math.min(Math.round(actualPercent), 100),

                    styleWidth: `width:${spentPercent}%`,

                    barClass:
                        actualPercent >= 90
                            ? 'bar-red'
                            : 'bar-green',

                    isPinned: p.Is_Pinned__c
                };
            });

            this.participantPageNumber = 1;
            this.setupParticipantPagination();

        } catch (error) {
            console.error('Error loading participants', error);

            this.participants = [];
            this.pagedParticipants = [];
            this.participantTotalRecords = 0;
            this.participantTotalPages = 0;

            this.setupParticipantPagination();
        }
    }

    loadDashboardProviders() {
        getProviders()
            .then(data => {
                this.providers = data
                    .filter(p => p.status === 'Active') // ONLY ACTIVE
                    .map(p => {
                        const team = (p.participantAvatars || []).map((a, i) => {
                            return {
                                id: i,
                                text: a,
                                class: 'avatar-circle bg-indigo'
                            };
                        });

                        if (p.participantExtra > 0) {
                            team.push({
                                id: 'extra',
                                text: `+${p.participantExtra}`,
                                class: 'avatar-circle bg-grey'
                            });
                        }
                        return {
                                id: p.id,
                                name: p.name,
                                serviceType: p.serviceType,
                                status: p.status,
                                phone: p.phone,
                                capacity: p.capacity,
                                badgeTheme: 'badge-active'
                            };
                        /* return {
                            id: p.id,
                            name: p.name,
                            serviceType: p.serviceType,
                            status: p.status,
                            badgeTheme: 'badge-active',
                            count:
                                (p.participantAvatars?.length || 0) +
                                (p.participantExtra || 0),
                            team: team
                        }; */
                    });
            })
            .catch(err => {
                console.error('Error loading dashboard providers', err);
            });
    }

    handleCreateCaseNote() {
        console.log('Create New Case Note clicked');

        this.showCaseNoteModal = true;

        requestAnimationFrame(() => {
            const notesCmp = this.template.querySelector(
                'c-support-coordinator-notes'
            );

            if (notesCmp) {
                notesCmp.openAddCaseNoteModal();
            }
        });
    }

    handleCloseCaseNote() {
        this.showCaseNoteModal = false;
    }

    handleSetNewGoal() {
        this.showGoalsModal = true;

        // Wait for component to render, then open Add New Goal modal
        requestAnimationFrame(() => {
            const goalsCmp = this.template.querySelector(
                'c-support-coordinator-goals'
            );
            if (goalsCmp) {
                goalsCmp.openAddGoalModal();
            }
        });
    }

    handleCloseGoals() {
        this.showGoalsModal = false;
    }

    async loadDashboardMetrics() {
        try {
            const data = await getDashboardMetrics();
            if (!data) return;

            let updated = JSON.parse(JSON.stringify(this.metrics));

            /* 1️⃣ Active / Total Participants */
            // updated[0].value =
            //     `${data.activeParticipants || 0} / ${data.totalParticipants || 0}`;

            updated[0].value = data.activeParticipants || 0;

            /* 2️⃣ Active Goals Count */
            updated[1].value = data.activeGoals || 0;

            /* 3️⃣ High Priority Tasks Count */
            updated[2].value = data.highPriorityTasks || 0;

            /* 4️⃣ Budget Utilization % */
            const percent = data.budgetUtilizationPercent

            updated[3].value = percent;

            this.metrics = updated;

        } catch (error) {
            console.error('Dashboard metric load error', error);
        }
    }

    get filteredParticipants() {
        let data = [...this.participants];

        // pinned filter
        if (this.selectedTab === 'pinned') {
            data = data.filter(p => p.isPinned);
        }

        // search filter
        if (this.searchKey) {
            const key = this.searchKey.toLowerCase();

            data = data.filter(part =>
                (part.name &&
                    part.name.toLowerCase().includes(key)) ||

                (part.date &&
                    part.date.toLowerCase().includes(key)) ||

                (part.budget &&
                    String(part.budget)
                        .toLowerCase()
                        .includes(key)) ||

                (part.risk &&
                    String(part.risk)
                        .toLowerCase()
                        .includes(key))
            );
        }

        return data;
    }

    get allTabClass() {
        return this.selectedTab === 'all'
            ? 'tab-button active-tab'
            : 'tab-button';
    }

    get pinnedTabClass() {
        return this.selectedTab === 'pinned'
            ? 'tab-button active-tab'
            : 'tab-button';
    }

    showAllParticipants() {
        this.selectedTab = 'all';

        this.participantPageNumber = 1;

        this.setupParticipantPagination();
    }

    showPinnedParticipants() {
        this.selectedTab = 'pinned';

        this.participantPageNumber = 1;

        this.setupParticipantPagination();
    }

    handleParticipantSearch(event) {
        this.searchKey = event.target.value;

        this.participantPageNumber = 1;

        this.setupParticipantPagination();
    }

    handleAddTask() {
        console.log('==============================');
        console.log('🚀 Dashboard Add Task Clicked');
        console.log('showTaskModal BEFORE:', this.showTaskModal);

        this.showTaskModal = true;

        console.log('showTaskModal AFTER:', this.showTaskModal);
        console.log('Waiting for child component render...');

        setTimeout(() => {
            console.log('⏳ setTimeout triggered');

            const childCmp =
                this.template.querySelector('c-support-coordinator-task');

            console.log('Child component found:', childCmp);

            if (childCmp) {
                console.log('✅ Calling openTaskFromDashboard()');
                childCmp.openTaskFromDashboard();
            } else {
                console.error('❌ Child component NOT found');
            }

            console.log('==============================');
        }, 100);
    }

    handleTaskSaved() {
        console.log('==============================');
        console.log('✅ Task saved event received from child');

        this.showTaskModal = false;

        console.log('showTaskModal AFTER:', this.showTaskModal);
        console.log('==============================');
    }


    handleTaskModalClose() {
        console.log('==============================');
        console.log('❌ Task modal close event received');
        console.log('showTaskModal BEFORE:', this.showTaskModal);

        this.showTaskModal = false;

        console.log('showTaskModal AFTER:', this.showTaskModal);
        console.log('==============================');
    }

    handleCloseTaskModal() {
        this.showTaskModal = false;
    }

    setupParticipantPagination() {
        const filteredData = this.filteredParticipants;

        const start =
            (this.participantPageNumber - 1) *
            this.participantPageSize;

        const end = start + this.participantPageSize;

        this.pagedParticipants =
            filteredData.slice(start, end);

        this.participantTotalRecords =
            filteredData.length;

        this.participantTotalPages =
            Math.ceil(
                filteredData.length /
                this.participantPageSize
            ) || 1;

        this.participantDisableFirst =
            this.participantPageNumber <= 1;

        this.participantDisableLast =
            this.participantPageNumber >=
            this.participantTotalPages;
    }

   handleParticipantRecordsPerPageChange(event) {
        this.participantPageSize =
            parseInt(event.target.value, 10);

        this.participantPageNumber = 1;

        this.setupParticipantPagination();
    }

    handleParticipantFirstPage() {
        this.participantPageNumber = 1;

        this.setupParticipantPagination();
    }

    handleParticipantPreviousPage() {
        if (this.participantPageNumber > 1) {
            this.participantPageNumber--;

            this.setupParticipantPagination();
        }
    }

    handleParticipantNextPage() {
        if (
            this.participantPageNumber <
            this.participantTotalPages
        ) {
            this.participantPageNumber++;

            this.setupParticipantPagination();
        }
    }

    handleParticipantLastPage() {
        this.participantPageNumber =
            this.participantTotalPages;

        this.setupParticipantPagination();
    }

    handleParticipantClick(event) {
        event.preventDefault();

        const participantId = event.currentTarget.dataset.id;

        this.createParticipantDetailsModal = true;

        setTimeout(() => {
            const childCmp = this.refs.participantManagement;

            if (childCmp) {
                childCmp.openParticipantDetailsFromDashboard(participantId);
            }
        }, 0);
    }

}