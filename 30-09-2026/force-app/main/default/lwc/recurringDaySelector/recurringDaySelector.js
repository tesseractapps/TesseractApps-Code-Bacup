import { LightningElement, track, api } from 'lwc';

export default class RecurringDaySelector extends LightningElement {
    @track currentMonth = new Date().getMonth();
    @track currentYear = new Date().getFullYear();
    @track selectedDates = new Set();
    @track selectedWeekDays = new Set();
    @track applyOption = '';
    @track endDate = '';
    @track recurringStartDate = '';
    @track recurringEndDate = '';
    @track recurringDates = new Set();
    _initialDates = [];

    @api
    set initialSelectedDates(value) {

        if (value && value.length) {

            console.log('Child received recurring dates => ', JSON.stringify(value));

            this._initialDates = value;

            // ⭐ mark as recurring
            this.recurringDates = new Set(value);
           console.log('typeofaction:', this.typeofaction);
           console.log('slectedchecklistdates:', JSON.stringify(this.slectedchecklistdates));

            // ⭐ auto select in calendar
        //    this.selectedDates = new Set();
            const first = new Date(value[0]);
            this.currentMonth = first.getMonth();
            this.currentYear  = first.getFullYear();

            // ⭐ update recurring period display
            this.setRecurringRangeFromDates(value);
            this.populateRecurringMonthsFromParent(value);
             this.initChecklistSelection();

        }
    }

    @api
    set slectedchecklistdates(value){
        this._slectedchecklistdates = value;

        console.log('Checklist dates arrived =>', JSON.stringify(value));

        this.initChecklistSelection();
    }

        get slectedchecklistdates(){
            return this._slectedchecklistdates;
        }

        @api
set typeofaction(value){
    this._typeofaction = value;

    console.log('typeofaction arrived =>', value);

    this.initChecklistSelection();
}

get typeofaction(){
    return this._typeofaction;
}



    initChecklistSelection(){

    console.log('initChecklistSelection running...');
    console.log('typeofaction:', this.typeofaction);

    // -------------------------------
    // DELETE MODE
    // -------------------------------
    if(this.typeofaction === 'delete'){
        console.log('Delete mode → clearing selections');
        this.selectedDates = new Set();   // ⭐ nothing selected
        return;
    }

    // -------------------------------
    // CHECKLIST MODE
    // -------------------------------
    if(this.typeofaction === 'checklist'){

        if(this.slectedchecklistdates && this.slectedchecklistdates.length){

            console.log(
                'Checklist mode → applying checklist dates',
                JSON.stringify(this.slectedchecklistdates)
            );

            this.selectedDates = new Set(this.slectedchecklistdates);
        }

        // ⭐ IMPORTANT:
        // if checklist dates not exist → DO NOTHING
        // recurringDates alone will show
    }
}



    get isDeleteAction() {
        return this.typeofaction === 'delete';
    }

    get headerText() {

        console.log('typeofaction:', this.typeofaction);
        console.log('isDeleteAction:', this.isDeleteAction);

        const text = this.isDeleteAction
            ? 'Delete Recurring Shifts'
            : 'A new checklist added where this to be applied';

        console.log('headerText returned:', text);

        return text;
    }


    
    get summaryLine() {
        if (this.isDeleteAction) {
            return `You are deleting ${this.totalShifts} shifts across ${this.totalDates} dates. Only shifts with a status of Draft or Accepted will be deleted. All other shifts will be skipped.`;
        }
        return `A new checklist will be applied to ${this.totalShifts} shifts across ${this.totalDates} dates`;
    }

    get dateRangeLabel() {
        return this.isDeleteAction ? 'Date Range: ' : 'Applies to: ';
    }

    get initialSelectedDates() {
        return this._initialDates;
    }


    weekDays = [
        { label: 'Sunday', value: 0, class: 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small' },
        { label: 'Monday', value: 1, class: 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small' },
        { label: 'Tuesday', value: 2, class: 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small' },
        { label: 'Wednesday', value: 3, class: 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small' },
        { label: 'Thursday', value: 4, class: 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small' },
        { label: 'Friday', value: 5, class: 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small' },
        { label: 'Saturday', value: 6, class: 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small' }
    ];
    connectedCallback() {

        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        this.endDate = this.formatDate(oneYearFromNow);
    }


    populateRecurringDates(startDate, endDate) {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            this.recurringDates.add(this.formatDate(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    populateRecurringMonthsFromParent(dateArray){

        const monthNames = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];

        const months = new Set();

        const sorted = [...dateArray].sort();

        const startDate = new Date(sorted[0]);
        const endDate   = new Date(sorted[sorted.length - 1]);

        let cursor = new Date(startDate);

        while(cursor <= endDate){
            months.add(monthNames[cursor.getMonth()]);
            cursor.setMonth(cursor.getMonth()+1);
        }

        this.recurringMonths = [...months];

        // ⭐ also store raw range for navigation control
        this._rangeStart = startDate;
        this._rangeEnd   = endDate;
    }


    get currentMonthYear() {
        const date = new Date(this.currentYear, this.currentMonth, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    get calendarDays() {

    console.log('================ CALENDAR BUILD START ================');
    console.log('currentMonth =>', this.currentMonth);
    console.log('currentYear  =>', this.currentYear);
   // console.log('recurringDates(Set) =>', Array.from(this.recurringDates));
  //  console.log('selectedDates(Set)  =>', Array.from(this.selectedDates));

    const days = [];

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const prevLastDay = new Date(this.currentYear, this.currentMonth, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

   // console.log('firstDayOfWeek =>', firstDayOfWeek);
   // console.log('lastDate =>', lastDate);

    // ---------------- PREVIOUS MONTH DAYS ----------------
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {

        const day = prevLastDate - i;

        days.push({
            key: `prev-${day}`,
            day: day,
            class: 'slds-col slds-size_1-of-7 slds-text-align_center slds-text-color_weak',
            date: null
        });
    }

    // ---------------- CURRENT MONTH DAYS ----------------
    for (let day = 1; day <= lastDate; day++) {

        const date = new Date(this.currentYear, this.currentMonth, day);
        const dateStr = this.formatDate(date);

        const isSelected = this.selectedDates.has(dateStr);
        const isRecurring = this.recurringDates.has(dateStr);

        // ⭐ PER DAY DEBUG
      //  console.log('----------------------------------------');
      //  console.log('Calendar Cell Date =>', dateStr);
      //  console.log('isRecurring =>', isRecurring);
       // console.log('isSelected  =>', isSelected);

        let dayClass = 'slds-col slds-size_1-of-7 slds-text-align_center slds-p-around_small slds-box_xx-small';

        // ❌ Non-recurring dates (disabled)
        if(!isRecurring){
            dayClass += ' calendar-disabled';
        }

        if(isRecurring && !isSelected){
            dayClass += ' calendar-recurring';
        }

        if(isSelected){
            dayClass += ' calendar-selected';
        }


    //    console.log('finalClass =>', dayClass);

        days.push({
            key: `current-${day}`,
            day: day,
            class: dayClass,
            date: dateStr
        });
    }

    // ---------------- NEXT MONTH DAYS ----------------
    const remainingDays = 42 - days.length;

    console.log('remainingDays =>', remainingDays);

        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                key: `next-${day}`,
                day: day,
                class: 'slds-col slds-size_1-of-7 slds-text-align_center slds-text-color_weak',
                date: null
            });
        }

        console.log('================ CALENDAR BUILD END ==================');

       // console.log('tOTAL DAYS ==>'+JSON.stringify(days));

        return days;
}



    get isTillDate() {
        return this.applyOption === 'tillDate';
    }

    get showRecurringInfo() {
        return this.applyOption === 'recurringPeriod' && this.selectedDates.size > 0;
    }

    get appliedMonthsCount() {
        const uniqueMonths = new Set();
        this.selectedDates.forEach(dateStr => {
            const date = new Date(dateStr);
            uniqueMonths.add(date.getMonth());
        });
        return uniqueMonths.size;
    }

    get isDeleteDisabled() {
        return this.selectedDates.size === 0 || (this.applyOption === 'tillDate' && !this.endDate);
    }

    get totalDates() {
        return this.selectedDates.size;
    }

    get totalShifts() {
        return this.selectedDates.size;
    }

    get dateRange() {
        if (this.selectedDates.size === 0) return 'No dates selected';

        const dates = Array.from(this.selectedDates).sort();
        const firstDate = new Date(dates[0]);
        const lastDate = new Date(dates[dates.length - 1]);

        return `${this.formatDisplayDate(firstDate)} - ${this.formatDisplayDate(lastDate)}`;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDisplayDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    handleDateClick(event) {
        const dateStr = event.currentTarget.dataset.date;
        if (!dateStr) return;

        if (this.selectedDates.has(dateStr)) {
            this.selectedDates.delete(dateStr);
        } else {
            this.selectedDates.add(dateStr);
        }

        this.selectedDates = new Set(this.selectedDates);
        this.dispatchSelectionChange(); 
    }

    handleDayToggle(event) {
        const dayValue = parseInt(event.currentTarget.dataset.day, 10);

        if (this.selectedWeekDays.has(dayValue)) {
            this.selectedWeekDays.delete(dayValue);
            this.unselectAllDatesForDay(dayValue);
        } else {
            this.selectedWeekDays.add(dayValue);
            this.selectAllDatesForDay(dayValue);
        }

        this.selectedWeekDays = new Set(this.selectedWeekDays);
        this.updateWeekDayButtons();
         this.dispatchSelectionChange();   
    }

        selectAllDatesForDay(dayValue) {

        this.recurringDates.forEach(dateStr => {

            const date = new Date(dateStr);

            if(date.getDay() === dayValue){
                this.selectedDates.add(dateStr);
            }
        });

        this.selectedDates = new Set(this.selectedDates);
    }


    unselectAllDatesForDay(dayValue) {

    this.recurringDates.forEach(dateStr => {

        const date = new Date(dateStr);

        if(date.getDay() === dayValue){
            this.selectedDates.delete(dateStr);
        }
    });

    this.selectedDates = new Set(this.selectedDates);
  }


    updateWeekDayButtons() {
    this.weekDays = this.weekDays.map(day => ({
        ...day,
        class: this.selectedWeekDays.has(day.value)
            ? 'weekday-chip active slds-m-right_x-small slds-m-bottom_x-small'
            : 'weekday-chip slds-m-right_x-small slds-m-bottom_x-small'
      }));
   }


    handleSelectAll() {

    this.selectedDates = new Set(this.recurringDates);
    this.dispatchSelectionChange();

  }


    handleDeselectAll() {
        this.selectedDates.clear();
        this.selectedWeekDays.clear();
        this.selectedDates = new Set();
        this.selectedWeekDays = new Set();
        this.updateWeekDayButtons();
        this.dispatchSelectionChange();
    }

    handlePreviousMonth(){

        const prevMonthDate = new Date(this.currentYear, this.currentMonth - 1, 1);

        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
    }


        handleNextMonth(){
        const nextMonthDate = new Date(this.currentYear, this.currentMonth + 1, 1);

            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
        }



    handleEndDateChange(event) {
        this.endDate = event.target.value;
    }

    

 

    setRecurringRangeFromDates(dateArray){

        if(!dateArray.length) return;

        const sorted = [...dateArray].sort();

        const first = new Date(sorted[0]);
        const last = new Date(sorted[sorted.length - 1]);

        this.recurringStartDate = this.formatDisplayDate(first);
        this.recurringEndDate = this.formatDisplayDate(last);

        // build months badges
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        const months = new Set();

        let current = new Date(first);

        while(current <= last){
            months.add(monthNames[current.getMonth()]);
            current.setMonth(current.getMonth()+1);
        }

    }

    get isCurrentMonth() {
        return this.applyOption === 'currentMonth';
    }

    get isRecurringPeriod() {
        return this.applyOption === 'recurringPeriod';
    }
    
        dispatchSelectionChange() {

            this.dispatchEvent(
                new CustomEvent('selectedchange', {
                    detail: {
                        selectedDates: Array.from(this.selectedDates),
                        selectedWeekDays: Array.from(this.selectedWeekDays),
                        applyOption: this.applyOption
                    }
                })
            );
        }


}