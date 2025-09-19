import { api, LightningElement, track, wire } from 'lwc';
import USER_ID from '@salesforce/user/Id';
import holidayList from '@salesforce/apex/LeaveController.holidayListbyOrg';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails'; 
import saveStaffData from '@salesforce/apex/StaffAvailabilityController.saveStaffData';
import getStaffAvailability from '@salesforce/apex/StaffAvailabilityController.getStaffAvailability';
import getUserData from '@salesforce/apex/StaffAvailabilityController.getstaffId';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getServiceType from '@salesforce/apex/StaffAvailabilityController.getServiceType';
import preventStaffAvailabilityDuplicates from '@salesforce/apex/RosterAutoScheduleHandler.preventStaffAvailabilityDuplicates';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class StaffAvailabilityLwc extends LightningElement {
    @track todayDate
    @track endDate;
    @track currentDate = new Date();
    @track holidayList = [];
    @track state;
    @track services = [];
    @track StaffId = ''
    userId = USER_ID;
    @track selectedDate = '';
    @track monthOfDay;
    @track AddShiftEndTimeAMPM = 'Select Time';
    @track AddShiftStartTimeAMPM = 'Select Time';
    @track selectedServices = [];
    @track selectedavailability = [];
    @track isPopoverVisible = false;
    @track editButtonModule = false;
    @track isRecurring = false;
    @track isRecurmontlyFlag = false;
    @track recurEveryOptions;
    @track RecurValue;
    @track recurEveryValue;
    @track recurEndDate;
    @track shiftTypeOptions=[{label: 'General', value:'General'},{label:'Morning', value:'Morning'}, {label: 'Afternoon', value: 'Afternoon'},{label: 'Night', value: 'Night'},{label: 'Custom', value: 'Custom'},{label: 'Sleepover Shift', value: 'Sleepover Shift'}];
    @track recurOptions=[{label: 'Daily',value: 'Daily'  },{ label: 'Weekly',value: 'Weekly' },{ label: 'Monthly',value: 'Monthly' }];
    @track weekDays=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    @track stateOptions =  [{ label: 'ACT', value: 'ACT' },{ label: 'NSW', value: 'NSW' },{ label: 'NT', value: 'NT' },{ label: 'QLD', value: 'QLD' },{ label: 'SA', value: 'SA' }, { label: 'TAS', value: 'TAS' }, { label: 'VIC', value: 'VIC' }, { label: 'WA', value: 'WA' }];
    @track priorityOptions = [{ label: '1', value: '1' },{ label: '2', value: '2' },{ label: '3', value: '3' },{ label: '4', value: '4' },{ label: '5', value: '5' },{ label: '6', value: '6' }];
    @track sectionFlags = {
        staffDetails: true,
        staffDetails1: true,
    };

    @track sectionIcons = {
        staffDetails: '\u2B9F',
        staffDetails1: '\u2B9F', 
    };
    @track recurEndDate = '';
    @track selectedDays = [];
    @track monthLyOptions=[];
    @track availability = [];
    @track AddShiftRecurringCheckboxValue = false;
    @track savebutton = 'Create';
    @track AddShiftStartTime ;
    @track AddShiftEndTime;
    @track todayDateforheader;


    fetchUserData() {
        getUserData({ userId: this.userId })
            .then(result => {
                console.log('Fetched User Data:', result);
                this.StaffId = result.Id;
                console.log('this.StaffId==> ' + this.StaffId);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            });
    }    

    connectedCallback() {
        this.fetchHolidays();
        this.fetchAvailability();
        this.recurEveryOptions = this.generateOptions(30);
        this.monthLyOptions = this.generateOptions(31);
        this.generateTimeOptions();
        this.fetchUserData();
        getFacilityData().then(response => {
            this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }));
            this.organisationShiftTimes=response[0].Organisation__r;
            console.log('organisationShiftTimes' +JSON.stringify(this.organisationShiftTimes));
    
            if (!this.facilityValue) {
                this.facilityValue = []; // Ensure it's an array
            }
    
            if (this.facilityOptions.length > 0) {
                this.facilityValue.push(this.facilityOptions[0].value);
                this.SelectedComboBoxFacility = this.facilityOptions[0].value;
            }
        }).catch(err => {
            console.error(err);
        });

        organizationDetails().then(response => {
            let orgRoles= response.listofPriceBook.Roles__c;
            this.state =response.listofPriceBook.Address_Latest__StateCode__s;
            
             console.log('state:', response.listofPriceBook.Address_Latest__StateCode__s);
            //console.log('listofPriceBook:', response.listofPriceBook);
            this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
              return {
              value: rec,
              label: rec
              };
            });
        }) ;
    }
    

    daysOfWeek = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    get monthName() {
        return this.currentDate.toLocaleString('default', { month: 'long' });
    }

    get year() {
        return this.currentDate.getFullYear();
    }
     get monthAndYear() {
        return this.currentDate.toLocaleString('default', {
            month: 'long',
            year: 'numeric'
        });
    }
    
    generateOptions(max) {
        const options = [];
        for (let i = 1; i <= max; i++) { // Starting from 1 for more realistic options
          options.push({ label: `${i}`, value: `${i}` });
        }
        this.recurEveryOptions = options;
        console.log('this.recurEveryOptions >> '+JSON.stringify(this.recurEveryOptions));
        return options;
    }

    generateTimeOptions() {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                const minuteStr = minute.toString().padStart(2, '0');
                const label = `${hour12}:${minuteStr} ${ampm}`;
                options.push({ label, value: label });
            }
        }
        this.timeOptions = options;
    }

    
        get calendarDays() {
            const days = [];
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDayOfWeek = (firstDay.getDay() + 6) % 7;
            const totalDays = lastDay.getDate();
        
            // Map holidays
            const holidayMap = new Map();
            this.holidayList.forEach(holiday => {
                const date = holiday.Date__c;
                const name = holiday.Holiday_Name__c;
                if (!holidayMap.has(date)) {
                    holidayMap.set(date, []);
                }
                holidayMap.get(date).push(name);
            });
        
            // Map availability
            const availabilityMap = new Map();
            this.availability.forEach(slot => {
                const date = slot.Start_Date__c;
                if (!availabilityMap.has(date)) {
                    availabilityMap.set(date, []);
                }
                availabilityMap.get(date).push(slot);
            });
        
            // Empty leading cells
            for (let i = 0; i < startDayOfWeek; i++) {
                days.push({
                    key: `empty-${i}`,
                    date: '',
                    class: 'day-cell empty',
                    tooltip: ''
                });
            }
        
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
            // Populate days
            for (let i = 1; i <= totalDays; i++) {
                const fullDate = new Date(year, month, i);
                const dateStr = `${fullDate.getFullYear()}-${String(fullDate.getMonth() + 1).padStart(2, '0')}-${String(fullDate.getDate()).padStart(2, '0')}`;
        
                const isHoliday = holidayMap.has(dateStr);
                const isToday = dateStr === todayStr;
                const availabilitySlots = availabilityMap.get(dateStr) || [];
                const hasAvailability = availabilitySlots.length > 0;
        
                let cellClass = 'day-cell';
                if (hasAvailability) {
                    cellClass += ' has-service';
                } else {
                    cellClass += ' no-service';
                }
                if (isHoliday) cellClass += ' holiday';
                if (isToday) cellClass += ' today';
        
                const holidayTooltip = isHoliday ? `Holiday: ${holidayMap.get(dateStr).join(', ')}` : '';
                /* const availabilityTooltip = hasAvailability
                    ? availabilitySlots.map(a => {
                        const start = this.formatTime(a.Start_Time__c);
                        const end = this.formatTime(a.End_Time__c);
                        return `${a.Staff__r?.Name || 'Staff'} (${start} - ${end})`;
                      }).join('\n')
                    : ''; */

                    const displayLimit = 3;
                    const hasMore = availabilitySlots.length > displayLimit;
                    const rawSlots = hasMore ? availabilitySlots.slice(0, 2) : availabilitySlots.slice(0, displayLimit);
                    const visibleSlots = rawSlots.map(slot => ({
                        id: slot.Id,
                        startDate: slot.Start_Date__c,
                        isAssigned:slot.Assigned_Service_OR_Shift__c,
                        startTime: `${this.convertMillisTo12Hour(slot.Start_Time__c)}`,
                        endTime: `${this.convertMillisTo12Hour(slot.End_Time__c)}`,
                        shiftType: slot.Shift_Type__c,
                        timeRange: `${this.convertMillisTo12Hour(slot.Start_Time__c)} - ${this.convertMillisTo12Hour(slot.End_Time__c)}`
                    }));
                    const moreCount = hasMore ? availabilitySlots.length - 2 : 0;
        
                /* days.push({
                    key: `day-${i}`,
                    date: i,
                    dateStr,
                    class: cellClass,
                    tooltip: [holidayTooltip, availabilityTooltip].filter(Boolean).join('\n'),
                    availabilitySlots,
                    hasMore: availabilitySlots.length > 1,
                    moreCount: availabilitySlots.length - 1,
                    firstStaffName: availabilitySlots.length ? availabilitySlots[0].Shift_Type__c : '',
                    firstTime: availabilitySlots.length ? `${this.convertMillisTo12Hour(availabilitySlots[0].Start_Time__c)} - ${this.convertMillisTo12Hour(availabilitySlots[0].End_Time__c)}` : '',
                    holidayName: isHoliday ? holidayMap.get(dateStr).join(', ') : ''
                }); */
                days.push({
                    key: `day-${i}`,
                    date: i,
                    dateStr,
                    class: cellClass,
                    tooltip: [holidayTooltip].filter(Boolean).join('\n'),
                    visibleSlots,
                    hasMore,
                    moreCount,
                    noService: visibleSlots.length == 0,
                    holidayName: isHoliday ? holidayMap.get(dateStr).join(', ') : ''
                });
            }
        
            // Empty trailing cells
            const remainingInRow = 7 - (days.length % 7);
            if (remainingInRow < 7) {
                for (let i = 0; i < remainingInRow; i++) {
                    days.push({
                        key: `empty-end-${i}`,
                        date: '',
                        class: 'day-cell empty',
                        tooltip: ''
                    });
                }
            }
        
            return days;
        }

        
    prevMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        this.isPopoverVisible = false;
        this.fetchHolidays();
        this.fetchAvailability();
    }

    nextMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        this.isPopoverVisible = false;
        this.fetchHolidays();
        this.fetchAvailability();
    }

    navigateToToday() {
        this.currentDate = new Date();
        this.fetchHolidays();
        this.fetchAvailability();
    }

    fetchHolidays() {
        console.log('Holiday List');
        const formattedDate = this.currentDate.toISOString().split('T')[0];
        console.log('Holiday List >> ', formattedDate);
        console.log('State >>',this.state);
        if (formattedDate && this.state) {
            holidayList({ datePicker: formattedDate, state: this.state })
                .then(response => {
                    this.holidayList = response;
                    console.log('Holiday List>>', JSON.stringify(this.holidayList));
                })
                .catch(error => {
                    console.error('Error fetching holiday list:', error);
                });
        }
    }

fetchAvailability() {
    const formattedDate = this.currentDate.toISOString().split('T')[0];

    getStaffAvailability({  datePicker: formattedDate })
        .then(response => {
            // Convert Start_Time__c and End_Time__c from ms to 12-hour format
            this.availability = response.map(item => {
                return {
                    ...item,
                    startTimeFormatted: this.convertMillisTo12Hour(item.Start_Time__c),
                    endTimeFormatted: this.convertMillisTo12Hour(item.End_Time__c)
                };
            });

            console.log('participant availability', JSON.stringify(this.availability));
        })
        .catch(error => {
            console.error('Error fetching services:', error);
        });
}


convertMillisTo12Hour(millis) {
    if (!millis) return '';

    const date = new Date(millis);
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
}

handleServiceClick(event) {
    console.log('handleServiceClick');
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    let tooltipWidth = 150; // Approximate width of tooltip
    let offsetX = 10; // Small gap from cursor
    let leftPosition = mouseX - tooltipWidth - offsetX;
    if (leftPosition < 0) {
      leftPosition = 10; // Keep a minimum margin from the left edge
    }

        
    this.fetchAvailability();
    this.popupStyle = `top: ${mouseY - 117}px; left: ${leftPosition-240}px;`;
    console.log('style'+this.popupStyle);
    const date = event.currentTarget.dataset.date;
    console.log(date);
    
     const availabilityMap = new Map();
    this.availability.forEach(available => {
        const dateKey = available.Start_Date__c;
        if (!availabilityMap.has(dateKey)) {
            availabilityMap.set(dateKey, []);
        }
        availabilityMap.get(dateKey).push(available);
    });

    const availableForDate = availabilityMap.get(date) || [];

    // Format start and end datetime to 12-hour format
    this.selectedavailability = availableForDate.map(available => {
        return {
            ...available,
            formattedStart: this.formatTime(available.Start_Time__c),
            formattedEnd: this.formatTime(available.End_Time__c)
        };
    }); 
    console.log('AVAILABILITY'+JSON.stringify(this.selectedavailability));
    const dateObj = new Date(date);
    this.selectedDate = dateObj.toLocaleDateString('en-GB');
    this.isPopoverVisible = true;
}

closePopover() {
    this.isPopoverVisible = false;
} 
formatTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const paddedMinutes = minutes.toString().padStart(2, '0');

    return `${hours}:${paddedMinutes} ${ampm}`;
}

handleSectionToggle(event) {
    const sectionId = event.currentTarget.dataset.id;
    const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);

    if (!this.sectionFlags[sectionId]) {
        // First click: Set the section to true so it loads in the DOM
        this.sectionFlags[sectionId] = true;
    } else {
        // From second click onwards: Just toggle the hidden-section class
        sectionElement.classList.toggle('hidden-section');
    }

    // Toggle the icon dynamically
    this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
}

@track serviceTypeOptions = [];
getserviceTypes() {
    getServiceType({ clientId: this.clientId })
        .then(result => {
            this.serviceTypeOptions = result;
            console.log('Data received:', result);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

@track headingLabel;
handleAddDescription(event) {
    this.startTimeSelectedMinute = '00';
    this.startTimeSelectedHour = '12';
    this.startTimeAMPM = 'AM';
    this.endTimeAMPM = 'PM';
    this.endTimeSelectedMinute = '00';
    this.endTimeSelectedHour = '12';
    this.headingLabel = 'Create Availability'
    this.savebutton = 'Create';
    const selectedDate = event.currentTarget.dataset.date;
    console.log('Selected Date (Raw):', selectedDate);
    console.log('StaffId:', this.StaffId);

    // Format the selected date into dd/mm/yyyy
    const parts = selectedDate.split('-');
    let formattedDate = '';
    let formattedDateforheader = '';
    if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        formattedDateforheader = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
        console.error('Invalid date format received:', selectedDate);
    }

    console.log('Formatted Selected Date:', formattedDate);
    console.log('Formatted Selected Date:', formattedDateforheader);

    this.isPopoverVisible = false;
    this.todayDate = formattedDate;
    this.todayDateforheader = formattedDateforheader;
    // this.loadOrganizationDetails();
    this.editButtonModule = true;
}

handleClose(event){
    this.editButtonModule = false;
    this.startTimeSelectedMinute = '00';
    this.startTimeSelectedHour = '12';
    this.startTimeAMPM = 'AM';
    this.endTimeAMPM = 'PM';
    this.endTimeSelectedMinute = '00';
    this.endTimeSelectedHour = '12';
    this.resetFields();
}

handleShiftTypechange(event){
    this.shiftTypeValue = event.detail.value;
    console.log('Selected Shift Type:', this.shiftTypeValue);
    this.getOrganisationTimings();
}

getOrganisationTimings(){
    this.cutsomShiftTemplate=false;
    this.IsLongShift=false;
    console.log(' start date '+ this.todayDate);
    switch (this.shiftTypeValue) {
      case 'Morning':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Morning_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Morning_Shift_End_Time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=true;

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetails = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetails.minute;
          this.startTimeSelectedHour  = starttimeDetails.hour;
          this.startTimeAMPM = starttimeDetails.period;

          console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
          const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetails.minute;
          this.endTimeSelectedHour  = endtimeDetails.hour;
          this.endTimeAMPM = endtimeDetails.period;
          break;
  
      case 'Afternoon':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=true;
          //this.checkFatigue();

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsAfternoon = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsAfternoon.minute;
          this.startTimeSelectedHour  = starttimeDetailsAfternoon.hour;
          this.startTimeAMPM = starttimeDetailsAfternoon.period;

          console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
          const endtimeDetailsAfternoon = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsAfternoon.minute;
          this.endTimeSelectedHour  = endtimeDetailsAfternoon.hour;
          this.endTimeAMPM = endtimeDetailsAfternoon.period;
          break;
  
      case 'Night':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Night_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Night_Shift_End_Time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=true;
          //this.checkFatigue();

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsNight = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsNight.minute;
          this.startTimeSelectedHour  = starttimeDetailsNight.hour;
          this.startTimeAMPM = starttimeDetailsNight.period;

          console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
          const endtimeDetailsNight = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsNight.minute;
          this.endTimeSelectedHour  = endtimeDetailsNight.hour;
          this.endTimeAMPM = endtimeDetailsNight.period;
          break;
  
      case 'General':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.General_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.General_Shift_End_time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_End_time__c.toLowerCase());
          this.disableTimeButton=true;
          //this.checkFatigue();

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsGeneral = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsGeneral.minute;
          this.startTimeSelectedHour  = starttimeDetailsGeneral.hour;
          this.startTimeAMPM = starttimeDetailsGeneral.period;

          console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
          const endtimeDetailsGeneral = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsGeneral.minute;
          this.endTimeSelectedHour  = endtimeDetailsGeneral.hour;
          this.endTimeAMPM = endtimeDetailsGeneral.period;
              console.log(' starttimeDetailsGeneral==>'+JSON.stringify(starttimeDetailsGeneral));
              console.log(' endtimeDetailsGeneral==>'+ JSON.stringify(endtimeDetailsGeneral));
          break;
  
      case 'Custom':
        this.IsLongShift=true;
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Custom_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Custom_Shift_End_Time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=false;
          this.cutsomShiftTemplate=true;
          //this.checkFatigue();

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsCustom = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsCustom.minute;
          this.startTimeSelectedHour  = starttimeDetailsCustom.hour;
          this.startTimeAMPM = starttimeDetailsCustom.period;

          console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
          const endtimeDetailsCustom = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsCustom.minute;
          this.endTimeSelectedHour  = endtimeDetailsCustom.hour;
          this.endTimeAMPM = endtimeDetailsCustom.period;
          break;
      case 'Sleepover':
        this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Sleepover_Start__c.toUpperCase();
        this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Start__c.toLowerCase());
        this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toLowerCase());
        this.disableTimeButton=false;
        //this.checkFatigue();

        console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsSleepover = this.splitTimeParts(this.AddShiftStartTimeAMPM);
        
          this.startTimeSelectedMinute = starttimeDetailsSleepover.minute;
          this.startTimeSelectedHour  = starttimeDetailsSleepover.hour;
          this.startTimeAMPM = starttimeDetailsSleepover.period;

          console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
          const endtimeDetailsSleepover = this.splitTimeParts(this.AddShiftEndTimeAMPM);
         
          this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
          this.endTimeSelectedHour  = endtimeDetailsSleepover.hour;
          this.endTimeAMPM = endtimeDetailsSleepover.period;
        break;
  
      default:

          this.disableTimeButton=false;
       break;
          
  }
    
 this.updateShiftDates();
}

updateShiftDates() {
    console.log('this.todayDate==>', this.todayDate); 
    console.log(' this.startTimeAMPM==>'+this.startTimeAMPM); 
    console.log('this.AddShiftEndTimeAMPM==>'+ this.endTimeAMPM); 
    console.log('this.shiftTypeValue==>'+ this.shiftTypeValue);
    // Convert DD/MM/YYYY to YYYY-MM-DD format
    const dateParts = this.todayDate.split('/');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // YYYY-MM-DD

    let startDate = new Date(formattedDate);
    let endDate = new Date(formattedDate);

  

    if (this.shiftTypeValue === 'Night' || this.shiftTypeValue === 'Sleepover') {
        if (this.endTimeAMPM=== 'AM' && this.startTimeAMPM === 'PM') {
            //endDate.setDate(endDate.getDate() + 1);) {
            endDate.setDate(endDate.getDate() + 1);
             console.log('Formatted Start Date:', startDate);
           console.log('Formatted End Date:', endDate);
        }
       
        if (this.startTimeAMPM === 'AM' &&  this.startTimeAMPM === 'AM' ) {
            startDate.setDate(startDate.getDate() + 1);
            endDate.setDate(endDate.getDate() + 1);
        }
    } else if (this.shiftTypeValue === 'Custom') {
        if (this.startTimeAMPM === 'AM' && this.endTimeAMPM === 'AM') {
            endDate.setDate(endDate.getDate() + 1);
        } else if (this.endTimeAMPM === 'PM') {
            //startDate.setDate(startDate.getDate() + 1);
            endDate.setDate(endDate.getDate() + 1);
        }
    }

    const formatDate = (date) => {
        let day = date.getDate().toString().padStart(2, '0');
        let month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
        let year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

  
    this.todayDate=formatDate(startDate);
    console.log('Updated Start Date:',  this.todayDate);
    this.endDate= formatDate(endDate);
    console.log('Updated End Date:',this.endDate);
    console.log('Updated Start time:',this.AddShiftStartTime);
    console.log('Updated End time:',this.AddShiftEndTime);
    console.log('StaffId:',this.StaffId);

      preventStaffAvailabilityDuplicates({startDate : this.todayDate,endDate:this.endDate,startTime:this.AddShiftStartTime,
        endTime:this.AddShiftEndTime,staffId:this.StaffId,AvailId:this.AvaliableId}).then(result=>{
          console.log('result:',result);
          this.isSaveDisabled=result;
          if(this.isSaveDisabled){
            this.dispatchEvent(
            new ShowToastEvent({
                title: 'Overlap Detected',
                message: 'You already have an existing availability or shift during the selected time.',
                variant: 'error'
            })
            );
          }
       
      })
}

convertTo24HourFormat(timeStr) {
    const timeParts = timeStr.split(" ");
    let hours = parseInt(timeParts[0].split(":")[0]);
    const minutes = timeParts[0].split(":")[1];
    const period = timeParts[1].toLowerCase();
  
    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0;
    }
  
    const formattedHours = hours < 10 ? `0${hours}` : hours.toString();
    console.log("Start Time (24-hour):", `${formattedHours}:${minutes}:00Z`); // Output: 09:30:00Z
    return `${formattedHours}:${minutes}:00Z`;
}

handleStartTimeChange(event) {
    this.startTime = event.target.value;
    console.log('Start Time:', this.startTime);
    const childData = event.detail;
    console.log('childData Start Time', JSON.stringify(childData));
    this.AddShiftStartTimeAMPM = childData.displaytime;
    console.log('AddShiftStartTimeAMPM==>'+this.AddShiftStartTimeAMPM);

     this.AddShiftStartTime = this.convertTo24HourFormat(this.AddShiftStartTimeAMPM.toLowerCase());
    const starttimeDetailsSleepover = this.splitTimeParts(this.AddShiftStartTimeAMPM);

    this.startTimeSelectedMinute = starttimeDetailsSleepover.minute;
    this.startTimeSelectedHour  = starttimeDetailsSleepover.hour;
    this.startTimeAMPM = starttimeDetailsSleepover.period;

    
    this.updateShiftDates();
}

handleEndTimeChange(event) {
    const childData = event.detail;
    //this.endTime = childData;
    console.log('childData End Time', JSON.stringify(childData));
    this.AddShiftEndTimeAMPM = childData.displaytime;
    console.log('AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
    this.AddShiftEndTime = this.convertTo24HourFormat(this.AddShiftEndTimeAMPM.toLowerCase());
    console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
    const endtimeDetailsSleepover = this.splitTimeParts(this.AddShiftEndTimeAMPM);
        
    this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
    this.endTimeSelectedHour  = endtimeDetailsSleepover.hour;
    this.endTimeAMPM = endtimeDetailsSleepover.period;
    this.updateShiftDates();
}

@track isRecurring = false;
handleReccuringChange(event){
    console.log('Reccuring Change: ', event.target.checked);
    this.AddShiftRecurringCheckboxValue = event.target.checked;
    this.isRecurring = this.AddShiftRecurringCheckboxValue;
}

@track typeOfRecur;
handleRecurChange(event) {
    this.selectedDays = [];
    this.recurEndDate = '';
    this.recurEveryValue = '';
    const selectedValue = event.detail.value;
    this.typeOfRecur = selectedValue;
    console.log('Recurring Option Selected:', selectedValue);
    if(selectedValue == 'Weekly'){
        console.log('Recurring Option Selected:', selectedValue);
        this.recurEveryOptions = this.generateOptions(6);
        this.isRecurWeekFlag = true;
        this.isRecurmontlyFlag = false;
    } else if (selectedValue == 'Monthly'){
        console.log('Recurring Option Selected:', selectedValue);
        this.recurEveryOptions = this.generateOptions(3);
        this.RecurValue = selectedValue;
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = true;
    } else if (selectedValue == 'Daily'){
        console.log('Recurring Option Selected:', selectedValue);
        this.recurEveryOptions = this.generateOptions(30);
        this.RecurValue = selectedValue;
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = false;
    }
    this.reccuring = selectedValue;
    console.log('Recurring Option Selected:', this.reccuring);
}

handleRecurEveryChange(event) {
    const selectedValue = event.detail.value;
    console.log('Recur Every Option Selected:', selectedValue);
    this.recurEveryValue = selectedValue;
}

handleMonthlyOptionChange(event){
    this.monthOfDay = event.target.value;
    console.log('Monthly Option Selected:', this.monthOfDay);
}

@track isSaveDisabled = false;
handleRecurEndDateChange(event) {
    this.recurEndDate = event.detail.value;
    console.log('Recurrence End Date selected:', this.recurEndDate);
    console.log('this.todayDate >>'+this.todayDate);
    let parts = this.todayDate.split('/');
    let formattedTodayDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    console.log('Formatted Date:', formattedTodayDate); // "2025-05-01"

    const recurDate = new Date(this.recurEndDate);
    const today = new Date(formattedTodayDate);
    console.log('recurDate >>'+recurDate+' today >>'+today);
    

    // Normalize both dates to remove time differences
    recurDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    console.log('recurDate >>'+recurDate+' today >>'+today);

    if (recurDate <= today) {
        this.recurEndDate = null; // Clear the invalid selection
        this.showToast('Validation Error', 'Recurrence End Date must be before Available Date.', 'error');
        this.isSaveDisabled = true;
        // Optionally trigger UI error here
    }
    else {
        this.isSaveDisabled = false; // Enable save button
    }
}

handleCheckboxChange(event) {
    const day = event.target.name;
    const isChecked = event.target.checked;

    console.log('Checkbox changed:', day, isChecked);

    if (isChecked) {
        if (!this.selectedDays.includes(day)) {
            this.selectedDays = [...this.selectedDays, day];
        }
    } else {
        this.selectedDays = this.selectedDays.filter(item => item !== day);
    }

    console.log('Updated selectedDays:', JSON.stringify(this.selectedDays));
}

@track AvaliableId;
handlesavebutton(event) {
    if (!this.shiftTypeValue || !this.AddShiftStartTimeAMPM || !this.AddShiftEndTimeAMPM) {
        this.showToast('Error', 'All fields must be filled. Please provide a valid Shift Type, Start Time, and End Time.', 'error');
        return;
    }

    if (this.AddShiftRecurringCheckboxValue) {
        if (!this.recurEveryValue || !this.recurEndDate) {
            this.showToast('Validation Error', 'Please provide the "Recur Every" and "End Date" when Recurring is checked.', 'error');
            return;
        }

        // Optionally, ensure weekly or monthly options are selected (you can add more fields here based on your needs)
        if (this.isRecurWeekFlag && !this.selectedDays.length) {
            this.showToast('Validation Error', 'Please select at least one day for weekly recurrence.', 'error');
            return;
        }

        if (this.isRecurmontlyFlag && !this.monthOfDay) {
            this.showToast('Validation Error', 'Please select a day for monthly recurrence.', 'error');
            return;
        }
    }
    console.log('Save button clicked');
    //const selectedDate = new Date(this.selectedDateValue); // replace with your actual date value
    //const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD


    console.log('this.shiftTypeValue:', this.shiftTypeValue);
    console.log('Recurring:', this.AddShiftRecurringCheckboxValue);
    console.log('Updated selectedDays:', JSON.stringify(this.selectedDays));
    console.log('Start Time:', this.AddShiftStartTimeAMPM);
    console.log('End Time:', this.AddShiftEndTimeAMPM);
    console.log('this.StaffId:', this.StaffId);
    console.log('this.recurEndDate:', this.recurEndDate);
    console.log('this.recurEveryValue:', this.recurEveryValue);
    console.log('this.todayDate:', this.todayDate);

    saveStaffData({
        avaliableId: this.AvaliableId,
        shiftDateStr: this.todayDate,
        shiftType: this.shiftTypeValue,
        isRecurring: this.AddShiftRecurringCheckboxValue,
        weeklyDays: this.selectedDays,
        startTime: this.AddShiftStartTimeAMPM,
        endTime: this.AddShiftEndTimeAMPM,
        staffId: this.StaffId,
        endDate: this.recurEndDate,
        typeOfRecur: this.typeOfRecur,
        monthlyDay:this.monthOfDay,
        recurEvery: parseInt(this.recurEveryValue),
        shfitEndDate:this.endDate
    })
    .then(() => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Availability saved successfully!',
                variant: 'success'
            })
        );
        this.fetchHolidays();
        this.fetchAvailability();
        this.editButtonModule = false;
        this.resetFields();
    })
    .catch(error => {
        console.error('Error saving shift:', error);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Failed to save availability',
                variant: 'error'
            })
        );
    });
}   
    
resetFields() {
    this.todayDate = null;
    this.shiftTypeValue = null;
    this.AddShiftStartTimeAMPM = null;
    this.AddShiftEndTimeAMPM = null;
    this.AddShiftRecurringCheckboxValue = false;
    this.reccuring = false;
    this.recurEveryValu = null;
    this.RecurValue = null;
    this.recurEndDate = null;
    this.selectedDays = [];
    this.monthOfDay = null;
    this.serviceTypevalue = null;
    this.RegionStateValue = null;
    this.selectedcatlogId = null;
    this.selectedRole = null;
    this.roleRows = [];
    this.CatlogTabel = false;
    this.rolestable = false;
    this.isRecurring = false;
    this.recurEveryValue = null;
    this.typeOfRecur = null;
    this.AvaliableId = null;

    // Optional: If you want to clear any UI elements, you can also reset their values.
    console.log('Fields have been reset.');
}


@track startTimeSelectedMinute = '00';
@track startTimeSelectedHour = '12';
@track startTimeAMPM = 'AM';
@track endTimeAMPM = 'PM';
@track endTimeSelectedMinute = '00';
@track endTimeSelectedHour = '12';
handleEditClick(event) {
    this.headingLabel = 'Edit Availability'
    this.savebutton = 'Update';
    // Prevent default link behavior
    event.preventDefault();

    const availabilityId = event.currentTarget.dataset.id;
    const startTime = event.currentTarget.dataset.starttime;
    const endTime = event.currentTarget.dataset.endtime;
    const startDate = event.currentTarget.dataset.startdate;
    const shifttype = event.currentTarget.dataset.shifttype;
    this.AvaliableId = availabilityId;
    console.log('Selected Availability ID:', availabilityId);
    console.log('this.AvaliableId >> '+this.AvaliableId);
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);
    console.log('Start Date:', startDate);
    console.log('Shift Type:', shifttype);

    this.AddShiftStartTimeAMPM = startTime;
    const starttimeDetails = this.splitTimeParts(this.AddShiftStartTimeAMPM);
    this.startTimeSelectedMinute = starttimeDetails.minute;
    this.startTimeSelectedHour  = starttimeDetails.hour;
    this.startTimeAMPM = starttimeDetails.period;

    
    this.AddShiftEndTimeAMPM = endTime;
    const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
    this.endTimeSelectedMinute = endtimeDetails.minute;
    this.endTimeSelectedHour  = endtimeDetails.hour;
    this.endTimeAMPM = endtimeDetails.period;
    
    this.shiftTypeValue = shifttype;
      this.AddShiftStartTime = this.convertTo24HourFormat(this.AddShiftStartTimeAMPM.toLowerCase());
        this.AddShiftEndTime = this.convertTo24HourFormat(this.AddShiftEndTimeAMPM.toLowerCase());
    
    // Format the selected date into dd/mm/yyyy
    const parts = startDate.split('-');
    let formattedDate = '';
    if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
        console.error('Invalid date format received:', selectedDate);
    }

    console.log('Formatted Selected Date:', formattedDate);

    this.todayDate = formattedDate;

    this.isPopoverVisible = false;
    this.isSaveDisabled=false;
    this.editButtonModule = true;
}

splitTimeParts(timeString) {
    if (!timeString) {
        console.error('Time string is empty or undefined.');
        return { hour: null, minute: null, period: null };
    }

    const [timePart, period] = timeString.trim().split(' '); // "6:00", "AM"
    const [hour, minute] = timePart.split(':');              // "6", "00"

    return {
        hour: hour,
        minute: minute,
        period: period
    };
}




showToast(title, message, variant) {
    const event = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant,  // 'error', 'success', 'info', or 'warning'
    });
    this.dispatchEvent(event);
}

}