import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllParticipants from '@salesforce/apex/SupportParticipantController.getAllParticipants';
import saveSupportNote from '@salesforce/apex/SupportParticipantController.saveSupportNote';
import getTasksByDateRange from '@salesforce/apex/SupportParticipantController.getTasksByDateRange';
import updateTaskDate from '@salesforce/apex/SupportParticipantController.updateTaskDate';
import getServiceTypesByParticipant from '@salesforce/apex/SupportParticipantController.getServiceTypesByParticipant';

export default class supportCoordinatorTask extends LightningElement {
    @api launchFromDashboard = false;
    @api openTaskFromDashboard() {
        console.log('==============================');
        console.log('📥 openTaskFromDashboard() called');
        console.log('taskflag BEFORE:', this.taskflag);
        console.log('showTaskPopup BEFORE:', this.showTaskPopup);

        this.taskflag = false;
        this.launchFromDashboard = true; 
        this.showTaskPopup = true;
        this.resetTaskForm();

        console.log('taskflag AFTER:', this.taskflag);
        console.log('showTaskPopup AFTER:', this.showTaskPopup);
        console.log('✅ Task popup opened from dashboard');
        console.log('==============================');
    }
    @track taskflag = true;
    @track month;
    @track year;
    @track monthName;
    @track calendarDays = [];
    @track showMoreModal = false;
    @track modalTasks = [];
    @track modalDate = '';
    @track selectedFrequency = 'Daily';
    @track selectedDate = this.getTodayAEST();
    weekStartDate = new Date();
    @track showTaskPopup = false;
    @track fundingInfo = {
        percentUsed: 0,
        totalBudget: 0,
        remainingBudget: 0,
        spentAmount: 0,
        progressStyle: 'width:0%'
    };
    @track participantOptions = [];
    @track isBillable = false;
    @track allTasks = [];
    @track showBillableHours = false;
    @track billableSummary = {
        total: 0,
        billable: 0,
        nonBillable: 0
    };
    @track billableByCategory = [];
    @track dailyBillable = [];
    @track isEditingQty = false;

    popupTaskTitle = '';
    popupTaskDescription = '';
    popupTaskDate = '';
    popupTaskTime = '';
    popupTaskDuration = 30;
    popupTaskStatus = 'Pending';
    popupTaskPriority = 'Normal';
    popupTaskOwner = '';
    draggedTaskId = null;

    statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
    ];

    priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];
/* 
    fundingOptions = [
        { label: 'Core Support', value: 'Core Support' },
        { label: 'Capacity Building', value: 'Capacity Building' },
        { label: 'Support Coordination', value: 'Support Coordination' },
        { label: 'Plan Management', value: 'Plan Management' },
        { label: 'Recovery Coaching', value: 'Recovery Coaching' }
    ]; */
fundingOptions = [
    { label: 'SC Level 1 ($114.45/hr)', value: 'SC_LEVEL_1' },
    { label: 'SC Level 2 ($193.99/hr)', value: 'SC_LEVEL_2' },
    { label: 'SC Level 3 ($232.35/hr)', value: 'SC_LEVEL_3' }
];
chargeLevelRates = {
    SC_LEVEL_1: 114.45,
    SC_LEVEL_2: 193.99,
    SC_LEVEL_3: 232.35
};
    serviceCategoryOptions = [
        { label: 'Plan Review', value: 'Plan Review' },
        { label: 'Provider Coordination', value: 'Provider Coordination' },
        { label: 'Goal Setting', value: 'Goal Setting' },
        { label: 'Documentation', value: 'Documentation' },
        { label: 'Consultation', value: 'Consultation' }
    ];

    goalCategoryOptions = [
        { label: 'Communication', value: 'Communication' },
        { label: 'Social Skills', value: 'Social Skills' },
        { label: 'Independent Living', value: 'Independent Living' },
        { label: 'Employment', value: 'Employment' },
        { label: 'Health & Wellbeing', value: 'Health & Wellbeing' }
    ];
    

    frequencyOptions = [
        { label: 'Daily', value: 'Daily' },
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Monthly', value: 'Monthly' }
    ];

    formatDateYYYYMMDD(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    getTodayAEST() {
        const now = new Date();

        // AEST = UTC +10 (no DST handling for now)
        const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
        const aestTime = new Date(utcTime + (10 * 60 * 60000));

        return this.formatDateYYYYMMDD(aestTime);
    }

    getDailyRange() {
        return {
            start: this.selectedDate,
            end: this.selectedDate
        };
    }

    getWeeklyRange() {
        const d = new Date(this.selectedDate);
        const day = d.getDay() || 7; // Sunday = 7
        d.setDate(d.getDate() - day + 1); // Monday

        const start = new Date(d);
        const end = new Date(d);
        end.setDate(start.getDate() + 6);

        return {
            start: this.formatDateYYYYMMDD(start),
            end: this.formatDateYYYYMMDD(end)
        };
    }

    getMonthlyRange() {
        const start = new Date(this.year, this.month, 1);
        const end = new Date(this.year, this.month + 1, 0);

        return {
            start: this.formatDateYYYYMMDD(start),
            end: this.formatDateYYYYMMDD(end)
        };
    }

    get entryCost() {
        if (!this.isBillable) return this.formatAmount(0);

        const h = Number(this.taskForm?.duration || 0);
        const m = Number(this.taskForm?.durationMinutes || 0);
        const rate = Number(this.editableRate || 0);

        return this.formatAmount((h + m / 60) * rate);
    }

    get billableToggleLabel() {
        return this.isBillable ? 'Billable' : 'Non-billable';
    }
    
    get isNonBillable() {
        return !this.isBillable;
    }
    
    get isServiceItemDisabled() {
        return !this.isBillable || !this.taskForm?.ServiceType;
    }
    
    get billableFieldsClass() {
        return this.isBillable
            ? 'tm-billable-section'
            : 'tm-billable-section tm-billable-section--disabled';
    }
    
    get progressStyle() {
        const pct   = Math.min(100, Number(this.fundingInfo?.percentUsed || 0));
        const color = pct >= 90 ? '#c23934' : pct >= 70 ? '#BA7517' : '#3B6D11';
        return `width:${pct}%;background:${color};`;
    }
    
    get budgetPctClass() {
        const pct = Number(this.fundingInfo?.percentUsed || 0);
        if (pct >= 90) return 'tm-budget-pct tm-budget-pct--danger';
        if (pct >= 70) return 'tm-budget-pct tm-budget-pct--warning';
        return 'tm-budget-pct tm-budget-pct--ok';
    }
    
    get budgetStatusCardClass() {
        const pct = Number(this.fundingInfo?.percentUsed || 0);
        if (pct >= 90) return 'tm-status-card tm-status-card--danger  slds-m-top_small';
        if (pct >= 70) return 'tm-status-card tm-status-card--warning slds-m-top_small';
        return 'tm-status-card tm-status-card--neutral slds-m-top_small';
    }
    
    get budgetStatusIcon() {
        const pct = Number(this.fundingInfo?.percentUsed || 0);
        return pct >= 70 ? 'utility:warning' : 'utility:info';
    }
    
    get budgetStatusTitle() {
        const pct = Number(this.fundingInfo?.percentUsed || 0);
        if (pct >= 90) return 'Critical — Budget Exhausted';
        if (pct >= 70) return 'Warning — Budget Running Low';
        return 'Budget Status';
    }
    
    get budgetStatusMsg() {
        if (!this.taskForm?.participant) return 'Select a participant to see funding info.';
        const pct = Number(this.fundingInfo?.percentUsed || 0);
        if (pct >= 90) return 'Remaining budget is critically low. Approve carefully.';
        if (pct >= 70) return 'Monitor participant spending closely.';
        return 'Budget is within acceptable range.';
    }
    
    get selectedParticipantName() {
        if (!this.taskForm?.participant) return null;
        const opt = (this.participantOptions || []).find(o => o.value === this.taskForm.participant);
        return opt ? opt.label : null;
    }
    
    get participantInitials() {
        const name  = this.selectedParticipantName || '';
        const parts = name.trim().split(' ');
        return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    }

    get progressStyle() {
        const pct   = Math.min(100, Number(this.fundingInfo.percentUsed) || 0);
        const color = pct >= 90 ? '#c23934' : pct >= 70 ? '#BA7517' : '#3B6D11';
        return `width:${pct}%; background:${color};`;
    }

    get weekLabel() {
        const start = new Date(this.selectedDate);

        const day = start.getDay() || 7; // Sunday = 7
        start.setDate(start.getDate() - day + 1); // Move to Monday

        const end = new Date(start);
        end.setDate(start.getDate() + 6); // Monday to Sunday

        return `${start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })} – ${end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}`;
    }

    // DAILY
    get todayTasks() {
        const today = new Date().toISOString().split('T')[0];
        return this.getTasksForDate(today);
    }    

    get weeklyDays() {
        const COLORS = ['blue', 'teal', 'purple', 'amber', 'coral', 'pink'];
        const start = new Date(this.weekStartDate);
        start.setDate(start.getDate() - start.getDay() + 1); // Monday

        const todayStr = this.getTodayAEST();

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = this.formatDateYYYYMMDD(d);
            const displayDate = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
            const isToday = dateStr === todayStr;

            const tasks = this.getTasksForDate(dateStr).map((task, idx) => {
                const color = COLORS[idx % COLORS.length];
                let weekBadgeClass = 'weekly-task__badge weekly-task__badge--pending';
                if (task.status === 'Completed')   weekBadgeClass = 'weekly-task__badge weekly-task__badge--done';
                if (task.status === 'In Progress') weekBadgeClass = 'weekly-task__badge weekly-task__badge--progress';

                return {
                    ...task,
                    weekCardClass:   `weekly-task weekly-task--${color}`,
                    weekTimeClass:   `weekly-task__time weekly-task__time--${color}`,
                    weekTitleClass:  `weekly-task__title weekly-task__title--${color}`,
                    weekAvatarClass: `weekly-task__avatar weekly-task__avatar--${color}`,
                    weekBadgeClass
                };
            });

            return {
                date:        dateStr,
                displayDate: displayDate,
                label:       d.toLocaleDateString('en-US', { weekday: 'long' }),
                tasks,
                taskCount:   tasks.length,
                isEmpty:     tasks.length === 0,
                headerClass: isToday ? 'weekly-col__header weekly-col__header--today' : 'weekly-col__header'
            };
        });
    }

    get weeklyStats() {
        const allWeekTasks = this.weeklyDays.flatMap(d => d.tasks);
        return {
            total:    allWeekTasks.length,
            billable: allWeekTasks.filter(t => t.billable).length,
            hours:    allWeekTasks.reduce((s, t) => s + Number(t.duration || 0), 0).toFixed(1) + 'h',
            pending:  allWeekTasks.filter(t => t.status === 'Pending').length
        };
    }

    get durationDisplay() {
        const h = this.taskForm?.duration        || 0;
        const m = this.taskForm?.durationMinutes || 0;
        return `${h}h ${m}m`;
    }

    formatAmount(value) {
        return Number(value || 0).toLocaleString('en-AU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    handleDragStart(event) {
        this.draggedTaskId = event.currentTarget.dataset.taskid;
    }

    handleDragOver(event) {
        event.preventDefault(); // REQUIRED
    }

    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        const newDate = event.currentTarget.dataset.date;
        const taskId = this.draggedTaskId;
        if (!taskId || !newDate) return;

        // Optimistic UI update
        this.allTasks = this.allTasks.map(task =>
            task.id === taskId ? { ...task, date: newDate } : task
        );

        this.draggedTaskId = null;

        await updateTaskDate({ taskId, newDate });

        // 🔥 Reload using offset
        await this.loadTasks();
    }

    nextWeek() {
        const d = new Date(this.selectedDate);
        d.setDate(d.getDate() + 7);

        this.selectedDate = this.formatDateYYYYMMDD(d);
        this.weekStartDate = new Date(d);

        this.loadTasks();
    }

    prevWeek() {
        const d = new Date(this.selectedDate);
        d.setDate(d.getDate() - 7);

        this.selectedDate = this.formatDateYYYYMMDD(d);
        this.weekStartDate = new Date(d);

        this.loadTasks();
    }

    get selectedDayLabel() {
        const d = new Date(this.selectedDate);
        return d.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    doTasksOverlap(t1, t2) {
        const a = this.parseTime(t1.time);
        const b = this.parseTime(t2.time);

        const startA = a.hour * 60 + a.minute;
        const startB = b.hour * 60 + b.minute;

        // assume default duration = 30 minutes
        const endA = startA + 30;
        const endB = startB + 30;

        return startA < endB && startB < endA;
    }

    parseTime(timeStr) {
        if (!timeStr) return { hour: 0, minute: 0 };

        const [time, meridian] = timeStr.trim().split(' ');
        let [hour, minute] = time.split(':').map(n => parseInt(n, 10));

        if (meridian === 'PM' && hour !== 12) hour += 12;
        if (meridian === 'AM' && hour === 12) hour = 0;

        return { hour, minute };
    }

    get nowTop() {
        const now = new Date();
        return (now.getHours() * 60 + now.getMinutes()) + 'px';
    }

    get isDaily() {
        return this.selectedFrequency === 'Daily';
    }

    get isWeekly() {
        return this.selectedFrequency === 'Weekly';
    }

    get isMonthly() {
        return this.selectedFrequency === 'Monthly';
    }

    connectedCallback() {
        console.log('==============================');
        console.log('🔄 supportCoordinatorTask connectedCallback START');

        this.selectedDate = this.getTodayAEST();

        const d = new Date(this.selectedDate);
        this.month = d.getMonth();
        this.year = d.getFullYear();

        this.weekStartDate = new Date(this.selectedDate);

        console.log('Initial taskflag:', this.taskflag);
        console.log('Initial showTaskPopup:', this.showTaskPopup);

        this.loadParticipants();
        this.loadTasks();

        console.log('🔄 supportCoordinatorTask connectedCallback END');
        console.log('==============================');
    }

    /* async loadParticipants() {
        try {
            console.log('🔄 Fetching participants...');
            const data = await getAllParticipants();

            console.log('📌 Response from Apex:', JSON.stringify(data));

            this.participantOptions = data.map(part => ({
                label: part.Name,
                value: part.Id
            }));

            console.log('🟢 participantOptions Ready:', JSON.stringify(this.participantOptions));

        } catch (error) {
            console.error('❌ Error fetching participants:', error);
        }
    } */

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

            console.log(
                '🧾 participantOptions:',
                JSON.stringify(this.participantOptions, null, 2)
            );

            console.log('🔄 loadParticipants() END');

        } catch (error) {
            console.error('❌ loadParticipants ERROR');
            console.error('Error:', error);
            console.error('Error message:', error?.body?.message || error?.message);
        }
    }

    async loadTasks() {
        console.log('⏳ Loading support notes...');

        try {
            let range;

            if (this.isDaily) {
                range = this.getDailyRange();
            } else if (this.isWeekly) {
                range = this.getWeeklyRange();
            } else {
                range = this.getMonthlyRange();
            }

            console.log('📤 Date Range:', JSON.stringify(range));

            const result = await getTasksByDateRange({
                startDate: range.start,
                endDate: range.end
            });

            console.log('📥 Raw Tasks from Apex:', JSON.stringify(result));

            this.allTasks = result.map((task, index) => {
                const durationHours =
                    Number(task.Duration_Hours__c || 1);

                const startTime = task.Start_Time__c
                        ? this.formatStartTime(task.Start_Time__c)
                        : '';

                const firstName =
                    task.SupportClient_To_Notes__r?.First_Name__c || '';

                const lastName =
                    task.SupportClient_To_Notes__r?.Last_Name__c || '';

                const fullName =
                    `${firstName} ${lastName}`.trim() ||
                    task.SupportClient_To_Notes__r?.Name ||
                    '';

                const initials = (
                    (firstName.charAt(0) || '') +
                    (lastName.charAt(0) || '')
                ).toUpperCase();

                return {
                    id: task.Id,
                    title: task.Notes_Type__c || 'Support Note',
                    participant: fullName,
                    participantInitials: initials || '?',
                    date: task.Entry_Date__c,
                    time: startTime,
                    duration: durationHours,
                    description: task.Activity_Details__c || '',
                    billable: task.Billable__c === true,
                    rate: this.formatAmount(task.Charge_Level__c),
                    totalCost: this.formatAmount(task.Total_Cost__c),
                    serviceType: task.Service_Type__r?.Name || '',
                    serviceItem:
                        task.SupportNotes_To_SupportCatalogue__r
                            ?.Support_Item_Name__c || '',
                    createdFrom: task.Created_From__c || ''
                };
            });

            console.log(
                '✅ Normalized Tasks:',
                JSON.stringify(this.allTasks)
            );

            if (this.isMonthly) {
                this.renderCalendar();
            }

        } catch (error) {
            console.error('❌ Error loading tasks:', error);

            this.showToast(
                'Error',
                'Failed to load tasks',
                'error'
            );
        }
    }

    formatStartTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        const formattedHours = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';

        return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }

    generateStartTime(index) {
        const baseHour = 5 + (index * 2);

        let hour = baseHour;
        let meridian = 'AM';

        if (hour >= 12) {
            meridian = 'PM';
            if (hour > 12) {
                hour -= 12;
            }
        }

        return `${hour}:00 ${meridian}`;
    }

    formatTime(timeValue) {
        if (timeValue === null || timeValue === undefined) return '';

        const totalMinutes = Math.floor(timeValue / (1000 * 60));
        let hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const meridian = hours >= 12 ? 'PM' : 'AM';
        if (hours === 0) hours = 12;
        else if (hours > 12) hours -= 12;

        return `${hours}:${String(minutes).padStart(2, '0')} ${meridian}`;
    }

    /* renderCalendar() {
        const firstDay = new Date(this.year, this.month, 1);
        const lastDay = new Date(this.year, this.month + 1, 0);

        this.monthName = firstDay.toLocaleString('default', { month: 'long' });

        let daysArray = [];

        let startDay = firstDay.getDay();
        if (startDay === 0) startDay = 7;

        // Blank cells before month start
        for (let i = 1; i < startDay; i++) {
            daysArray.push({
                key: `blank-${i}`,
                cellClass: 'calendar-cell empty',
                day: '',
                tasks: []
            });
        }

        // Actual days
        for (let d = 1; d <= lastDay.getDate(); d++) {

            const dateString =
                `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            const tasks = this.getTasksForDate(dateString);

            daysArray.push({
                key: dateString,
                day: d,
                dateString,
                cellClass: "calendar-cell",

                // Show only ONE task
                tasksToShow: tasks.slice(0, 2),
                // More button logic
                hasMore: tasks.length > 2,
                extraCount: tasks.length - 2,

                // Full task list
                tasks
            });
        }

        this.calendarDays = daysArray;
    } */


    renderCalendar() {
        const firstDay = new Date(this.year, this.month, 1);
        const lastDay  = new Date(this.year, this.month + 1, 0);

        this.monthName = firstDay.toLocaleString('default', { month: 'long' });

        const COLORS   = ['blue', 'teal', 'purple', 'amber', 'coral', 'pink'];
        const todayStr = this.getTodayAEST();

        let daysArray = [];

        // ── blank cells before month start ──
        let startDay = firstDay.getDay();
        if (startDay === 0) startDay = 7; // Sunday → 7 (Mon-based grid)

        for (let i = 1; i < startDay; i++) {
            daysArray.push({
                key:          `blank-${i}`,
                cellClass:    'monthly-cell empty',
                dateNumClass: 'monthly-cell__datenum',
                day:          '',
                tasksToShow:  [],
                hasMore:      false,
                extraCount:   0,
                tasks:        []
            });
        }

        // ── actual days ──
        for (let d = 1; d <= lastDay.getDate(); d++) {

            const dateString = `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const tasks      = this.getTasksForDate(dateString);
            const isToday    = dateString === todayStr;

            // map first 2 tasks → colour classes
            const tasksToShow = tasks.slice(0, 2).map((t, idx) => {
                const color = COLORS[idx % COLORS.length];
                return {
                    ...t,
                    monthCardClass:   `monthly-task monthly-task--${color}`,
                    monthTitleClass:  `monthly-task__title monthly-task__title--${color}`,
                    monthTimeClass:   `monthly-task__time monthly-task__time--${color}`,
                    monthAvatarClass: `monthly-task__avatar monthly-task__avatar--${color}`
                };
            });

            daysArray.push({
                key:          dateString,
                day:          d,
                dateString,
                cellClass:    isToday ? 'monthly-cell monthly-cell--today' : 'monthly-cell',
                dateNumClass: isToday ? 'monthly-cell__datenum monthly-cell__datenum--today' : 'monthly-cell__datenum',
                tasksToShow,
                hasMore:      tasks.length > 2,
                extraCount:   tasks.length - 2,
                tasks
            });
        }

        this.calendarDays = daysArray;
    }

    
    // Mock sample tasks
    getTasksForDate(dateStr) {
        // Filter all tasks matching the date
        return this.allTasks.filter(task => task.date === dateStr);
    }

    // Navigation buttons
    nextMonth() {
        this.month++;
        if (this.month > 11) {
            this.month = 0;
            this.year++;
        }
        this.loadTasks();
    }

    prevMonth() {
        this.month--;
        if (this.month < 0) {
            this.month = 11;
            this.year--;
        }
        this.loadTasks();
    }

    handleDayClick(event) {
        const date = event.currentTarget.dataset.date;
        console.log('📅 Day clicked:', date);

        // Add your modal popup or task creation logic
    }

    handleTaskClick(event) {
        event.stopPropagation(); // Prevent day click firing
        const taskId = event.currentTarget.dataset.taskid;
        console.log('📝 Task clicked:', taskId);

        // Open Task Details or edit modal
    }

    handleBillableHours() {
        this.calculateBillableHours();
        this.showBillableHours = true;
    }

    closeBillableModal() {
        this.showBillableHours = false;
    }

    handleBillableFrequencyChange(event) {
        this.selectedFrequency = event.detail.value;

        // Reload tasks based on frequency
        this.loadTasks().then(() => {
            this.calculateBillableHours();
        });
    }

    calculateBillableHours() {
        console.log('📊 Calculating Billable Hours...');

        let totalBillable = 0;
        let totalNonBillable = 0;

        const categoryMap = {};
        const dailyMap = {};

        // ===============================
        // STEP 1: Aggregate data
        // ===============================
        this.allTasks.forEach(task => {
            const hours = Number(task.duration) || 0;
            const date = task.date;

            // Initialize daily bucket
            if (!dailyMap[date]) {
                dailyMap[date] = {
                    billable: 0,
                    nonBillable: 0
                };
            }

            if (task.billable === true) {
                totalBillable += hours;
                dailyMap[date].billable += hours;

                // Category aggregation
                const category = task.serviceCategory || 'Other';
                categoryMap[category] = (categoryMap[category] || 0) + hours;
            } else {
                totalNonBillable += hours;
                dailyMap[date].nonBillable += hours;
            }
        });

        // ===============================
        // STEP 2: Summary totals
        // ===============================
        this.billableSummary = {
            total: +(totalBillable + totalNonBillable).toFixed(2),
            billable: +totalBillable.toFixed(2),
            nonBillable: +totalNonBillable.toFixed(2)
        };

        // ===============================
        // STEP 3: Category breakdown
        // ===============================
        this.billableByCategory = Object.keys(categoryMap).map(cat => {
            const hours = categoryMap[cat];
            const percent = totalBillable
                ? ((hours / totalBillable) * 100).toFixed(1)
                : 0;

            return {
                name: cat,
                hours: +hours.toFixed(2),
                percent,
                style: `width:${percent}%`   // ✅ LWC-safe
            };
        });

        // ===============================
        // STEP 4: Daily breakdown
        // ===============================
        this.dailyBillable = Object.keys(dailyMap)
            .sort() // sort by date ASC
            .map(date => {
                const bill = dailyMap[date].billable;
                const nonBill = dailyMap[date].nonBillable;
                const total = bill + nonBill;

                return {
                    date,
                    billable: +bill.toFixed(2),
                    nonBillable: +nonBill.toFixed(2),
                    total: +total.toFixed(2),
                    efficiency: total ? Math.round((bill / total) * 100) : 0
                };
            });

        console.log('✅ Billable Summary:', JSON.stringify(this.billableSummary));
        console.log('📊 Category Breakdown:', JSON.stringify(this.billableByCategory));
        console.log('📅 Daily Breakdown:', JSON.stringify(this.dailyBillable));
    }

    handleAddTask() {
        this.resetTaskForm();          // clean slate
        this.showTaskPopup = true;
    }

    openMoreModal(event) {
        const date = event.currentTarget.dataset.date;
        this.modalDate = date;
        this.modalTasks = this.getTasksForDate(date);
        this.showMoreModal = true;
    }

    closeMoreModal() {
        this.showMoreModal = false;
    }

    handleFrequencyChange(event) {
        this.selectedFrequency = event.detail.value;

        const today = this.getTodayAEST();
        this.selectedDate = today;

        if (this.isWeekly) {
            const d = new Date(today);
            const day = d.getDay() || 7; // Sunday = 7
            d.setDate(d.getDate() - day + 1); // Move to Monday of current week
            this.weekStartDate = new Date(d);
        }

        if (this.isMonthly) {
            const d = new Date(today);
            this.month = d.getMonth();
            this.year = d.getFullYear();
        }

        this.loadTasks();
    }

    handleDateChange(event) {
        this.selectedDate = event.detail.value;
        this.weekStartDate = new Date(this.selectedDate);
        this.loadTasks();
    }

    taskForm = {
        title: '',
        participant: '',
        date: '',
        startTime: '',
        priority: '',

        duration: 1,
        durationMinutes: 0,

        description: '',
        billable: false,

        ServiceType: '',
        ServiceItem: '',

        chargeLevel: '',
        entryCost: 0,

        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: ''
    };

    async handleFieldChange(event) {
        const field = event.target.dataset.field || event.target.name;
        let value;

        if (event.target.type === 'toggle') {
            value = event.detail.checked;
        } else if (event.detail?.value !== undefined) {
            value = event.detail.value;
        } else {
            value = event.target.value;
        }

        // Duration minutes rollover
        if (field === 'durationMinutes') {
            let h = Number(this.taskForm.duration || 0);
            let m = Number(value || 0);

            if (m >= 60) {
                h += Math.floor(m / 60);
                m = m % 60;
            }

            this.taskForm = {
                ...this.taskForm,
                duration: h,
                durationMinutes: m
            };

            this._refreshBudget();
            return;
        }

        // Default update
        this.taskForm = {
            ...this.taskForm,
            [field]: value
        };

        // Duration hours changed
        if (field === 'duration') {
            this._refreshBudget();
        }

        // Billable toggle
        if (field === 'billable') {
            this.isBillable = Boolean(value);

            if (!this.isBillable) {
                this.taskForm = {
                    ...this.taskForm,
                    ServiceType: '',
                    ServiceItem: '',
                    chargeLevel: 0
                };

                this.editableRate = 0;
                this.isEditingQty = false;
            }

            this._refreshBudget();
        }

        // Participant changed
        if (field === 'participant') {
            this.serviceTypeOptions = [];
            this.serviceItemOptions = [];
            this.selectedParticipantGroups = [];
            this.editableRate = 0;
            this.isEditingQty = false;

            this.taskForm = {
                ...this.taskForm,
                participant: value,
                ServiceType: '',
                ServiceItem: '',
                chargeLevel: 0
            };

            if (value) {
                try {
                    const groups = await getServiceTypesByParticipant({
                        participantId: value
                    });

                    this.selectedParticipantGroups = groups || [];

                    this.serviceTypeOptions =
                        this.selectedParticipantGroups.map(group => ({
                            label: group.Name,
                            value: group.Id
                        }));

                } catch (error) {
                    this.showToast(
                        'Error',
                        'Failed to load service types',
                        'error'
                    );
                }

                this._refreshBudget();
            } else {
                this._resetBudget();
            }
        }

        // Service type changed
        if (field === 'ServiceType') {
            this.serviceItemOptions = [];
            this.editableRate = 0;
            this.isEditingQty = false;

            this.taskForm = {
                ...this.taskForm,
                ServiceType: value,
                ServiceItem: '',
                chargeLevel: 0
            };

            const selectedGroup =
                (this.selectedParticipantGroups || []).find(
                    group => group.Id === value
                );

            if (selectedGroup) {
                this.serviceItemOptions =
                    (selectedGroup.Support_Catalogues__r || []).map(item => ({
                        label: `${item.Support_Item_Name__c} ($${this.formatAmount(item.Amount__c)})`,
                        value: item.Id
                    }));
            }

            this._refreshBudget();
        }

        // Service item changed
        if (field === 'ServiceItem') {
            let selectedItem = null;

            (this.selectedParticipantGroups || []).forEach(group => {
                (group.Support_Catalogues__r || []).forEach(item => {
                    if (item.Id === value) {
                        selectedItem = item;
                    }
                });
            });

            if (selectedItem) {
                const rate = Number(selectedItem.Amount__c) || 0;

                this.editableRate = rate;
                this.isEditingQty = false;

                this.taskForm = {
                    ...this.taskForm,
                    ServiceItem: value,
                    chargeLevel: rate
                };

                this._refreshBudget();
            }
        }
    }

    enableQtyEdit() {
        this.isEditingQty = true;
    }

    handleRateChange(event) {
        this.editableRate = Number(event.target.value) || 0;
        console.log(' this.editableRate ', this.editableRate);

        this._refreshBudget();
    }

    saveRate() {
        this.taskForm = {
            ...this.taskForm,
            chargeLevel: this.editableRate
        };

        this.isEditingQty = false;
        this._refreshBudget();
    }

    resetTaskForm() {
        this.taskForm = {
            title: '', participant: '', date: '', startTime: '',
            priority: '', duration: 1, durationMinutes: 0,
            description: '', billable: false,
            ServiceType: '', ServiceItem: '', chargeLevel: 0, entryCost: 0
        };
        this.isBillable               = false;
        this.isEditingQty             = false;
        this.editableRate             = 0;
        this.serviceTypeOptions       = [];
        this.serviceItemOptions       = [];
        this.selectedParticipantGroups = [];
        this.editableRate= 0;
        this._resetBudget();

    }

    _resetBudget() {
        this.fundingInfo = {
            percentUsed: 0,
            totalBudget: this.formatAmount(0),
            currentSpending: this.formatAmount(0),
            remaining: this.formatAmount(0)
        };
    }

    _refreshBudget() {
        if (!this.taskForm.participant) {
            this._resetBudget();
            return;
        }

        const participant = (this.allParticipants || []).find(
            p => p.Id === this.taskForm.participant
        );

        if (!participant) {
            this._resetBudget();
            return;
        }

        const totalBudget =
            Number(participant.Support_Coordinator_Budget__c) || 0;

        const alreadySpent =
            Number(participant.Support_Coordinator_Spent_Budget__c) || 0;

        // Current task live values
        const durationHours =
            Number(this.taskForm.duration || 0);

        const durationMinutes =
            Number(this.taskForm.durationMinutes || 0);

        const rate =
            Number(this.editableRate || 0);

        let currentTaskCost = 0;

        if (this.isBillable) {
            currentTaskCost =
                (durationHours + durationMinutes / 60) * rate;
        }

        const updatedSpent = alreadySpent + currentTaskCost;
        const remainingBudget = totalBudget - updatedSpent;

        const percentUsed =
            totalBudget > 0
                ? Math.round((updatedSpent / totalBudget) * 100)
                : 0;

        this.fundingInfo = {
            percentUsed: percentUsed,
            totalBudget: this.formatAmount(totalBudget),
            currentSpending: this.formatAmount(updatedSpent),
            remaining: this.formatAmount(remainingBudget)
        };
    }

    closeTaskPopup() {
        console.log('==============================');
        console.log('❌ closeTaskPopup() called');
        console.log('taskflag BEFORE:', this.taskflag);
        console.log('showTaskPopup BEFORE:', this.showTaskPopup);

        this.showTaskPopup = false;
        this.taskflag = true;

        console.log('taskflag AFTER:', this.taskflag);
        console.log('showTaskPopup AFTER:', this.showTaskPopup);
        console.log('Dispatching close event to dashboard');
        //this.editableRate= 0;

        this.dispatchEvent(new CustomEvent('close'));

        console.log('==============================');
    }

    fieldLabelMap = {
        title: 'Task Title',
        participant: 'Participant',
        date: 'Due Date',
        startTime: 'Start Time',
        priority: 'Priority',
        duration: 'Estimated Duration (hours)',
        description: 'Task Description',

        street: 'Street',
        city: 'Suburb',
        province: 'State',
        postalCode: 'Post Code',
        country: 'Country',

        rate: 'Billing Rate (per hour)',
        fundingLevel: 'Funding Utilization Level',
        serviceCategory: 'Service Category',
        goalCategory: 'Goal Category'
    };

    async saveTask() {
        console.log('=== saveTask START ===');
        console.log('Task Form Initial State:', JSON.stringify(this.taskForm));
        console.log('isBillable:', this.isBillable);
        console.log('entryCost:', this.entryCost);
        console.log('allParticipants count:', this.allParticipants?.length || 0);

        // ── REQUIRED FIELD CHECK ──
        const required = [
            { key: 'title',       label: 'Task Title'   },
            { key: 'participant', label: 'Participant'  },
            { key: 'date',        label: 'Due Date'     },
            { key: 'startTime',   label: 'Start Time'   },
            { key: 'priority',    label: 'Priority'     },
            { key: 'description', label: 'Task Description'  },
            { key: 'duration', label: 'Duration (Hours)'}
        ];

        console.log('Base required fields:', required);

        if (this.isBillable) {
            console.log('Task is billable → Adding Service Type & Service Item validation');

            required.push(
                { key: 'ServiceType', label: 'Service Type' },
                { key: 'ServiceItem', label: 'Service Item' }
            );
        }

        console.log('Final required fields:', required);

        const missing = required.filter(f => {
            const v = this.taskForm[f.key];

            console.log(`Checking field: ${f.key}`, {
                label: f.label,
                value: v
            });

            return v === null || v === undefined || String(v).trim() === '';
        });

        console.log('Missing fields:', missing);

        if (missing.length) {
            const missingLabels = missing.map(f => f.label).join(', ');

            console.warn('Validation failed - Missing required fields:', missingLabels);

            this.showToast(
                'Missing Required Fields',
                `Please fill in: ${missingLabels}`,
                'error'
            );

            console.log('=== saveTask END (Required Validation Failed) ===');
            return;
        }

        // ── BUDGET CHECK ──
        if (this.isBillable && this.taskForm.participant) {
            console.log('Starting budget validation...');

            const p = (this.allParticipants || []).find(
                x => x.Id === this.taskForm.participant
            );

            console.log('Matched participant:', p);

            const total = Number(p?.Support_Coordinator_Budget__c) || 0;
            const spent = Number(p?.Support_Coordinator_Spent_Budget__c) || 0;
            const remain = total - spent;
            const durationHours = Number(this.taskForm.duration || 0);
            const durationMinutes = Number(this.taskForm.durationMinutes || 0);
            const rate = Number(this.editableRate || 0);

            const cost =
                this.isBillable
                    ? (durationHours + durationMinutes / 60) * rate
                    : 0;

            console.log('Budget Details:', {
                totalBudget: total,
                spentBudget: spent,
                remainingBudget: remain,
                entryCost: cost
            });

            if (cost > remain) {
                console.warn('Budget validation failed - Insufficient funds');

                this.showToast(
                    'Insufficient Funds',
                    `Budget remaining: $${remain.toFixed(2)} · Entry cost: $${cost.toFixed(2)}`,
                    'error'
                );

                console.log('=== saveTask END (Budget Validation Failed) ===');
                return;
            }

            console.log('Budget validation passed');
        } else {
            console.log('Budget validation skipped (not billable or no participant selected)');
        }

        // ── APEX SAVE ──
        try {
            console.log('=== SAVE SUPPORT NOTE START ===');

            /* const payload = {
                ...this.taskForm,
                billable: this.isBillable,
                entryCost: this.entryCost
            }; */

            const payload = {
                ...this.taskForm,
                billable: this.isBillable,
                entryCost: Number(
                    String(this.entryCost).replace(/,/g, '')
                )
            };

            console.log('Task Form:', JSON.stringify(this.taskForm));
            console.log('Payload being sent to Apex:', JSON.stringify(payload));

            console.log('Calling saveSupportNote Apex...');

            const noteId = await saveSupportNote({
                noteData: payload
            });

            console.log('Apex saveSupportNote response (noteId):', noteId);

            this.showToast(
                'Success',
                'Task created successfully',
                'success'
            );
            if (this.launchFromDashboard) {
                this.dispatchEvent(
                    new CustomEvent('savetask')
                );

                this.launchFromDashboard = false;
            } else {
                this.showTaskPopup = false;
                this.taskflag = true;
            }

            console.log('Success toast displayed');

            this.showTaskPopup = false;
            console.log('Popup closed:', this.showTaskPopup);

            this.resetTaskForm();
            console.log('Task form reset complete');
            console.log('Task Form after reset:', JSON.stringify(this.taskForm));

            console.log('Reloading tasks...');
            await this.loadTasks();

            console.log('Tasks reloaded successfully');

            console.log('=== SAVE SUPPORT NOTE END SUCCESS ===');

        } catch (error) {
            console.error('=== SAVE SUPPORT NOTE ERROR ===');
            console.error('Full Error Object:', error);
            console.error('Error Body:', error?.body);
            console.error('Error Message:', error?.body?.message);
            console.error('JavaScript Stack:', error?.stack);
            console.error('Serialized Error:', JSON.stringify(error));

            this.showToast(
                'Error',
                error?.body?.message || 'Failed to save support note',
                'error'
            );

            console.log('Error toast displayed');
            console.log('=== saveTask END WITH ERROR ===');
        }
    }

    addressInputChange(event) {
        const { street, city, province, postalCode, country } = event.detail;

        console.log('🏠 Address Changed:', event.detail);

        this.taskForm = {
            ...this.taskForm,
            street,
            city,
            province,
            postalCode,
            country
        };

        // Keep UI bindings in sync
        this.street = street;
        this.city = city;
        this.province = province;
        this.postalcode = postalCode;
        this.country = country;
    }


    // ============================================================
    //  DAILY VIEW — JS additions for calendarView.js
    //  Merge these getters / methods into your existing class.
    //  All existing @track / apex imports stay unchanged.
    // ============================================================

    // ── NAVIGATION ───────────────────────────────────────────────

    prevDay() {
        const d = new Date(this.selectedDate);
        d.setDate(d.getDate() - 1);
        this.selectedDate = this.formatDateYYYYMMDD(d);
        this.loadTasks();
    }

    nextDay() {
        const d = new Date(this.selectedDate);
        d.setDate(d.getDate() + 1);
        this.selectedDate = this.formatDateYYYYMMDD(d);
        this.loadTasks();
    }

    goToday() {
        this.selectedDate = this.getTodayAEST();
        this.loadTasks();
    }

    // ── TIME SLOTS (gutter labels) ────────────────────────────────

    get timeSlots() {
        const slots = [];
        for (let h = 0; h < 24; h++) {
            slots.push(`${String(h).padStart(2, '0')}:00`);
        }
        return slots;
    }

    // ── STAT STRIP ────────────────────────────────────────────────

    get dailyStats() {
        const tasks = this.getTasksForDate(this.selectedDate);
        const billable = tasks.filter(t => t.billable).length;
        const totalHrs = tasks.reduce((s, t) => s + Number(t.duration || 0), 0);

        // max concurrent — scan each task's window
        let maxConc = 0;
        tasks.forEach(t => {
            const s = this._toMinutes(t.time);
            const e = s + Number(t.duration || 1) * 60;
            const count = tasks.filter(o => {
                const os = this._toMinutes(o.time);
                const oe = os + Number(o.duration || 1) * 60;
                return os < e && oe > s;
            }).length;
            if (count > maxConc) maxConc = count;
        });

        return {
            total:         tasks.length,
            billable:      billable,
            hours:         totalHrs.toFixed(1) + 'h',
            maxConcurrent: maxConc
        };
    }

    // ── COLUMN-PACKING (overlap resolution) ──────────────────────
    //
    //  Assigns each task a _col index and _totalCols so that
    //  simultaneous tasks sit side-by-side instead of stacking.

    _resolveColumns(tasks) {
        // sort by start time
        const sorted = [...tasks].sort(
            (a, b) => this._toMinutes(a.time) - this._toMinutes(b.time)
        );

        const columns = []; // columns[i] = array of tasks in column i

        sorted.forEach(task => {
            task._startMin = this._toMinutes(task.time);
            task._endMin   = task._startMin + Math.round(Number(task.duration || 1) * 60);

            let placed = false;
            for (let ci = 0; ci < columns.length; ci++) {
                const lastInCol = columns[ci][columns[ci].length - 1];
                if (lastInCol._endMin <= task._startMin) {
                    columns[ci].push(task);
                    task._col = ci;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                task._col = columns.length;
                columns.push([task]);
            }
        });

        // how many columns span a task (fill empty neighbour columns)
        sorted.forEach(task => {
            let span = 1;
            for (let ci = task._col + 1; ci < columns.length; ci++) {
                const neighbourBlocks = columns[ci].some(
                    o => o._startMin < task._endMin && o._endMin > task._startMin
                );
                if (neighbourBlocks) break;
                span++;
            }
            task._totalCols = columns.length;
            task._span      = span;
        });

        return { tasks: sorted, numCols: columns.length };
    }

    // ── HELPER: "09:30 AM" or "09:00" → minutes since midnight ──

    _toMinutes(timeStr) {
        if (!timeStr) return 0;
        const trimmed = timeStr.trim();

        // Handle 12-hour format: "9:30 AM" / "09:30 PM"
        const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (ampm) {
            let h = parseInt(ampm[1], 10);
            const m = parseInt(ampm[2], 10);
            const mer = ampm[3].toUpperCase();
            if (mer === 'PM' && h !== 12) h += 12;
            if (mer === 'AM' && h === 12) h = 0;
            return h * 60 + m;
        }

        // Handle 24-hour format: "09:30"
        const hhmm = trimmed.match(/^(\d{1,2}):(\d{2})$/);
        if (hhmm) {
            return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
        }

        return 0;
    }

    // ── DAILY TASKS GETTER (drives the template) ─────────────────

    // ============================================================
    //  REPLACE your existing get dailyTasks() with this version
    //  Fixes:
    //    1. showBottom threshold lowered → badge+avatar always show
    //    2. No change to style string needed; CSS fix handles layout
    // ============================================================

    get dailyTasks() {
        const raw = this.getTasksForDate(this.selectedDate);
        if (!raw || raw.length === 0) return [];

        const { tasks, numCols } = this._resolveColumns(raw);
        const GAP = 3;

        const COLORS = ['blue', 'teal', 'purple', 'amber', 'coral', 'pink'];

        return tasks.map((task, idx) => {
            const colWidthPct = 100 / numCols;
            const leftPct     = task._col * colWidthPct;
            const widthPct    = colWidthPct * task._span;
            const topPx       = task._startMin;
            const heightPx    = Math.max(task._endMin - task._startMin, 36);

            const color = COLORS[idx % COLORS.length];

            const hh  = String(Math.floor(task._startMin / 60)).padStart(2, '0');
            const mm  = String(task._startMin % 60).padStart(2, '0');
            const dur = Number(task.duration || 1);
            const timeLabel = `${hh}:${mm} · ${dur}h`;

            // badge class
            let badgeClass = 'daily-evt__badge daily-evt__badge--pending';
            if (task.status === 'Completed')   badgeClass = 'daily-evt__badge daily-evt__badge--done';
            if (task.status === 'In Progress') badgeClass = 'daily-evt__badge daily-evt__badge--progress';

            return {
                ...task,
                timeLabel,
                color,

                // ── FIX 1: lower thresholds so content always shows ──
                showDesc:   heightPx > 62,   // show description only if card > 62px
                showBottom: heightPx > 32,   // ← was 44; a 1h card is 60px, safely shows

                cardClass:   `daily-evt daily-evt--${color}`,
                timeClass:   `daily-evt__time daily-evt__time--${color}`,
                titleClass:  `daily-evt__title daily-evt__title--${color}`,
                avatarClass: `daily-evt__avatar daily-evt__avatar--${color}`,
                badgeClass,

                // ── FIX 2: add a small right padding so content
                //    never touches the card edge ──────────────────
                style: [
                    `top:${topPx}px`,
                    `height:${heightPx}px`,
                    `left:calc(${leftPct}% + ${GAP}px)`,
                    `width:calc(${widthPct}% - ${GAP * 2}px)`,
                    `z-index:${task._col + 1}`
                ].join(';')
            };
        });
    }

    get monthlyStats() {
        const tasks = this.allTasks.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === this.year && d.getMonth() === this.month;
        });
        return {
            total:    tasks.length,
            billable: tasks.filter(t => t.billable).length,
            hours:    tasks.reduce((s, t) => s + Number(t.duration || 0), 0).toFixed(1)
        };
    }

    get formattedEditableRate() {
        return this.formatAmount(this.editableRate);
    }


    showToast(title, message, variant = 'error') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

}