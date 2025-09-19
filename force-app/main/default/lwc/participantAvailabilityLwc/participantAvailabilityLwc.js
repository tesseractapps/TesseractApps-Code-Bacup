import { api, LightningElement, track, wire } from 'lwc';
import holidayList from '@salesforce/apex/LeaveController.holidayListbyOrg';
import saveShiftData from '@salesforce/apex/StaffAvailabilityController.saveShiftData';
import getParticipantAvailability from '@salesforce/apex/StaffAvailabilityController.getParticipantAvailability';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getServiceType from '@salesforce/apex/StaffAvailabilityController.getServiceType';
import getServicesAndSupportPlansByDate from '@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlansByDate';
import getCatalogueData from '@salesforce/apex/StaffAvailabilityController.getCatalogueData';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getStaffOptions from '@salesforce/apex/StaffAvailabilityController.getStaffOptions';
import getFacilityAddress from '@salesforce/apex/ClientDataController.getParticipantdetails';
import getFundsData from  '@salesforce/apex/RosterCreation.getFundsData';
import USER_ID from '@salesforce/user/Id';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class ParticipantAvailabilityLwc extends LightningElement {
    @track userId = USER_ID;
    @track todayDate
    @track currentDate = new Date();
    @track holidayList = [];
    @track services = [];
    @api clientId;
    @api state;
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
    @track isLoading = false;
    @track shiftTypeOptions=[{label: 'General', value:'General'},{label:'Morning', value:'Morning'}, {label: 'Afternoon', value: 'Afternoon'},{label: 'Night', value: 'Night'},{label: 'Custom', value: 'Custom'},{label: 'Sleepover Shift', value: 'Sleepover Shift'}];
    @track recurOptions=[{label: 'Daily',value: 'Daily'  },{ label: 'Fortnightly',value: 'Fortnightly' },{ label: 'Weekly',value: 'Weekly' },{ label: 'Monthly',value: 'Monthly' }];
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
    @track IsLongShift = false;
    @track rateRows = [];
    catalogueDataResult;
    @track isCreateMode = true;
    @track isUpdateMode = false;
    @track LocationLatitude;
    @track LocationLongitude;
    @track serviceTypeOptions = [];
    @track endDate = null;
    @track serviceTypevalue;
    @track RegionStateValue;
    @track serviceEditGroupName = [];
    @track CatlogTabel = false;
    @track selectedcatlogId = null;
    @track selectedRole;
    @track roleValue;
    @track roletable;
    @track showRolesTable = false;
    @track roleOptions = [];
    @track roleValue;
    @track buttonTitle;
    @track startTimeSelectedMinute = '';
    @track startTimeSelectedHour = '';
    @track startTimeAMPM = '';
    @track endTimeAMPM = '';
    @track endTimeSelectedMinute = '';
    @track endTimeSelectedHour = '';
    @track facilityAddressCheckbox = false;
    @track participantAddressCheckBox = false;
    @track addNewAddressCheckBox = false;
    @track typeofAddress = '';
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalCode;
    @track disablePostInsertButtons = false;
    @track staffList = [];
    @track DeleteFlag = false;
    @track availabilityId;

    connectedCallback() {
        if(this.state != null){
            console.log('Holidays in Connected CallBack'+ this.state);
            this.fetchHolidays();
        }
        this.fetchServices();
        this.fetchAvailability();
        this.recurEveryOptions = this.generateOptions(30);
        this.monthLyOptions = this.generateOptions(31);
        this.generateTimeOptions();
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
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Ensure Monday is first
        const totalDays = lastDay.getDate();

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const today1 = new Date();
        today.setDate(today1.getDate() - 1);
        const todayStr1 = today1.toISOString().split('T')[0];
        console.log(todayStr1);


        // Normalize holiday dates
        const holidayMap = new Map();
        this.holidayList.forEach(holiday => {
            const date = holiday.Date__c?.split('T')[0];
            if (!holidayMap.has(date)) {
                holidayMap.set(date, []);
            }
            holidayMap.get(date).push(holiday.Holiday_Name__c);
        });

        // Normalize service dates
        const serviceMap = new Map();
        this.services.forEach(service => {
            const date = service.Date_of_Service__c?.split('T')[0];
            if (!serviceMap.has(date)) {
                serviceMap.set(date, []);
            }
            serviceMap.get(date).push({
                type: 'service',
                hyper: false,
                name: service.Resource_Name__c,
                time: `${this.formatTime1(service.start_datetime__c)} - ${this.formatTime1(service.end_datetime__c)}`
            });
        });

        // Normalize availability dates
        const availabilityMap = new Map();
        this.availability.forEach(slot => {
            const date = slot.Start_Date__c?.split('T')[0];
            if (!availabilityMap.has(date)) {
                availabilityMap.set(date, []);
            }
            availabilityMap.get(date).push({
                type: 'availability',
                id: slot.Id,
                hyper: true,
                name: slot.Shift_Type__c,
                time: `${this.formatTime(slot.Start_Time__c)} - ${this.formatTime(slot.End_Time__c)}`
            });
        });

        // 🛠 Debug logs to check which dates have data
        //console.log('✔️ Service dates:', [...serviceMap.keys()]);
        //console.log('✔️ Availability dates:', [...availabilityMap.keys()]);
        //console.log('✔️ Holiday dates:', [...holidayMap.keys()]);
        //console.log('🟦 Checking for 2025-05-31 availability:', availabilityMap.get('2025-05-31'));

        // Empty cells before the first of the month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({
                key: `empty-${i}`,
                date: '',
                class: 'day-cell empty',
                tooltip: ''
            });
        }

        // Actual calendar days
        for (let i = 1; i <= totalDays; i++) {
            const fullDate = new Date(year, month, i);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            const isHoliday = holidayMap.has(dateStr);
            const isToday = dateStr === todayStr1;
            const services = serviceMap.get(dateStr) || [];
            const availabilitySlots = availabilityMap.get(dateStr) || [];
            const allEntries = [...services, ...availabilitySlots];

            let cellClass = 'day-cell';
            if (allEntries.length > 0) {
                cellClass += ' has-service';
            } else {
                cellClass += ' no-service';
            }
            if (isHoliday) cellClass += ' holiday';
            if (isToday) cellClass += ' today';

            // 🧪 Debug each day render
           // console.log(`📅 Day ${i} (${dateStr}): ${allEntries.length} entries`);

            days.push({
                key: `day-${i}`,
                date: i,
                dateStr,
                class: cellClass,
                tooltip: isHoliday ? `Holiday: ${holidayMap.get(dateStr).join(', ')}` : '',
                holidayName: isHoliday ? holidayMap.get(dateStr).join(', ') : '',
                entries: allEntries.length > 2 ? allEntries.slice(0, 2) : allEntries,
                moreCount: allEntries.length > 2 ? allEntries.length - 2 : 0,
                hasMore: allEntries.length > 2,
                noService: allEntries.length === 0
            });
        }

        // Fill remaining empty cells in final row
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 0; i < remaining; i++) {
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
    
  handleDeleteFlag(event) {
    this.availabilityId = event.currentTarget.dataset.id;
    console.log('recordId'+this.availabilityId);
    this.DeleteFlag = true;

   
}
handleclose(){
    this.DeleteFlag = false;
    this.availabilityId = '';
}
confirmDelete(){

     deleteRecord(this.availabilityId)
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Record deleted successfully',
                    variant: 'success',
                })
            );
            this.isPopoverVisible = false;
           this.fetchHolidays();
           this.fetchServices();
           this.fetchAvailability();
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error deleting record',
                    message: error.body.message,
                    variant: 'error',
                })
            );
        });
        this.DeleteFlag = false;
}


    prevMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        this.isPopoverVisible = false;
        this.fetchHolidays();
        this.fetchServices();
        this.fetchAvailability();
    }

    nextMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        this.isPopoverVisible = false;
        this.fetchHolidays();
        this.fetchServices();
        this.fetchAvailability();
    }

    navigateToToday() {
        this.currentDate = new Date();
        this.fetchHolidays();
        this.fetchServices();
        this.fetchAvailability();
    }

    fetchHolidays() {
        const formattedDate = this.currentDate.toISOString().split('T')[0];
        console.log(formattedDate);
        console.log(this.state);
        if (formattedDate && this.state) {
            holidayList({ datePicker: formattedDate, state: this.state })
                .then(response => {
                    this.holidayList = response;
                    console.log(JSON.stringify(this.holidayList));
                })
                .catch(error => {
                    console.error('Error fetching holiday list:', error);
                });
        }
    }
   

fetchServices() {
    const formattedDate = this.currentDate.toISOString().split('T')[0];
    getServicesAndSupportPlansByDate({ clientId: this.clientId, datePicker: formattedDate })
        .then(response => {
            this.services = response;
            console.log('services',JSON.stringify(this.services));
        })
        .catch(error => {
            console.error('Error fetching services:', error);
        });
}

fetchAvailability() {
    const formattedDate = this.currentDate.toISOString().split('T')[0];
    getParticipantAvailability({ clientId: this.clientId, datePicker: formattedDate })
        .then(response => {
            this.availability = response;
            console.log('participant availability' +JSON.stringify(this.availability));
        })
        .catch(error => {
            console.error('Error fetching services:', error);
        });
}

handleServiceClick(event) {
 let mouseX = event.clientX;
    let mouseY = event.clientY;
    let tooltipWidth = 150; // Approximate width of tooltip
    let offsetX = 10; // Small gap from cursor
    let leftPosition = mouseX - tooltipWidth - offsetX;
    if (leftPosition < 0) {
      leftPosition = 10; // Keep a minimum margin from the left edge
  }

        
      
    this.popupStyle = `top: ${mouseY - 117}px; left: ${leftPosition-240}px;`;
    console.log('style'+this.popupStyle);
    const date = event.currentTarget.dataset.date;
    console.log(date);
    const serviceMap = new Map();

    this.services.forEach(service => {
        const dateKey = service.Date_of_Service__c;
        if (!serviceMap.has(dateKey)) {
            serviceMap.set(dateKey, []);
        }
        serviceMap.get(dateKey).push(service);
    });
    

    const servicesForDate = serviceMap.get(date) || [];

    // Format start and end datetime to 12-hour format
    this.selectedServices = servicesForDate.map(service => {
        return {
            ...service,
            formattedStart: this.formatTime1(service.start_datetime__c),
            formattedEnd: this.formatTime1(service.end_datetime__c)
        };
    });
console.log('SERVICES'+JSON.stringify(this.selectedServices));
console.log('AVAILABILITY'+JSON.stringify(this.availability));
    
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

formatTime1(dateTimeStr) {
    //console.log('dateTimeStr >> ' + dateTimeStr);

    const dateObj = new Date(dateTimeStr);
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12 || 12; // Converts 0 to 12

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    //console.log('Time >> '+ hh + ''+ mm + ''+period);
    return `${hh}:${mm} ${period}`;
}


formatTime(dateTimeStr) {
    //console.log('dateTimeStr >> ' + dateTimeStr);

    const totalSeconds = Math.floor(dateTimeStr / 1000);
    const hours24 = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    // Convert to 12-hour format
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    const hh = hours12.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');

    return `${hh}:${mm} ${period}`;
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


async  getserviceTypes() {
    getServiceType({ clientId: this.clientId })
        .then(result => {
            this.serviceTypeOptions = result;
            console.log('Data received:', result);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

handleAddDescription(event) {
    this.isPopoverVisible = false;
    const selectedDate = event.currentTarget.dataset.date;
    console.log('Selected Date:', selectedDate);
    console.log('clientId '+ this.clientId);
    this.todayDate = selectedDate;
    if (this.clientId) {
        this.getserviceTypes();
    }
    this.loadOrganizationDetails();
    this.editButtonModule = true;
    this.buttonTitle = 'Create Shift';
    this.isCreateMode = true;
    this.isUpdateMode = false;

}

handleClose(event){
    this.editButtonModule = false;
    this.resetFields();
}

handleShiftTypechange(event){
    this.shiftTypeValue = event.detail.value;
    console.log('Selected Shift Type:', this.shiftTypeValue);
    this.getOrganisationTimings();
}


getAdjustedDate(startDateStr) {
    console.log('this.today >> ' + this.todayDate);
    console.log('this.shiftTypeValue >> ' + this.shiftTypeValue);
    console.log('this.AddShiftStartTimeAMPM >>', this.AddShiftStartTimeAMPM);
    console.log('this.AddShiftEndTimeAMPM >> ', this.AddShiftEndTimeAMPM);
    console.log('Input Date String:', startDateStr);

    const shiftType = this.shiftTypeValue;
    const startAMPM = this.AddShiftStartTimeAMPM?.trim().split(' ')[1]?.toUpperCase();
    const endAMPM = this.AddShiftEndTimeAMPM?.trim().split(' ')[1]?.toUpperCase();
    
    const dateWithTime = `${startDateStr}T06:00:00`;
    const date = new Date(dateWithTime);
    console.log('Parsed Date Object:', date);

    if (['Night', 'Custom', 'Sleepover Shift'].includes(shiftType)) {
        if (endAMPM === 'AM') {
            if ((startAMPM === 'AM' && endAMPM === 'AM') || (startAMPM === 'PM' && endAMPM === 'AM')) {
                date.setDate(date.getDate() + 1);
                console.log('Shift ends in AM and does not follow AM-PM pair — adding +1 day');
            } else {
                console.log('Shift starts in AM and ends in PM — no date adjustment');
            }
        } else {
            console.log('End time is PM — no date adjustment');
        }
    } else {
        console.log('Shift type is not Custom/Night/Sleep over — no date adjustment');
    }

    const result = date.toISOString().split('T')[0];
    this.endDate = result;
    console.log('Final Adjusted Date:', result);
    console.log('Final Adjusted Date:', this.endDate);
    return result;
}
    
getOrganisationTimings(){
    this.cutsomShiftTemplate=false;
    this.IsLongShift=false;
    switch (this.shiftTypeValue) {
      case 'Morning':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Morning_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Morning_Shift_End_Time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=true;
          console.log('this.AddShiftStartTimeAMPM==>'+this.AddShiftStartTimeAMPM);
          console.log('this.AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
          this.endDate = this.todayDate;
          const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetails.minute;
          this.endTimeSelectedHour  = endtimeDetails.hour;
          this.endTimeAMPM = endtimeDetails.ampm;

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetails = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetails.minute;
          this.startTimeSelectedHour  = starttimeDetails.hour;
          this.startTimeAMPM = starttimeDetails.ampm;
          break;
  
      case 'Afternoon':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=true;
          //this.checkFatigue();
          this.endDate = this.todayDate;
          const endtimeDetailsAfternoon = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsAfternoon.minute;
          this.endTimeSelectedHour  = endtimeDetailsAfternoon.hour;
          this.endTimeAMPM = endtimeDetailsAfternoon.ampm;

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsAfternoon = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsAfternoon.minute;
          this.startTimeSelectedHour  = starttimeDetailsAfternoon.hour;
          this.startTimeAMPM = starttimeDetailsAfternoon.ampm;
          break;
  
      case 'Night':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Night_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Night_Shift_End_Time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=true;
          this.endDate = this.getAdjustedDate(this.todayDate);
          console.log('this.endDate >>',this.endDate);
          const endtimeDetailsNight = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsNight.minute;
          this.endTimeSelectedHour  = endtimeDetailsNight.hour;
          this.endTimeAMPM = endtimeDetailsNight.ampm;

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsNight = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsNight.minute;
          this.startTimeSelectedHour  = starttimeDetailsNight.hour;
          this.startTimeAMPM = starttimeDetailsNight.ampm;
          break;
  
      case 'General':
          this.AddShiftStartTimeAMPM = this.organisationShiftTimes.General_Shift_Start_Time__c.toUpperCase();
          this.AddShiftEndTimeAMPM = this.organisationShiftTimes.General_Shift_End_time__c.toUpperCase();
          this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_Start_Time__c.toLowerCase());
          this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_End_time__c.toLowerCase());
          this.disableTimeButton=true;
          //this.checkFatigue();
          this.endDate = this.todayDate;
          const endtimeDetailsGeneral = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsGeneral.minute;
          this.endTimeSelectedHour  = endtimeDetailsGeneral.hour;
          this.endTimeAMPM = endtimeDetailsGeneral.ampm;

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsGeneral= this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsGeneral.minute;
          this.startTimeSelectedHour  = starttimeDetailsGeneral.hour;
          this.startTimeAMPM = starttimeDetailsGeneral.ampm;
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
          //this.endDate = this.todayDate;
          this.endDate = this.getAdjustedDate(this.todayDate);
          this.addRateRow();
          const endtimeDetailsCustom = this.splitTimeParts(this.AddShiftEndTimeAMPM);
          this.endTimeSelectedMinute = endtimeDetailsCustom.minute;
          this.endTimeSelectedHour  = endtimeDetailsCustom.hour;
          this.endTimeAMPM = endtimeDetailsCustom.ampm;

          console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
          const starttimeDetailsCustom = this.splitTimeParts(this.AddShiftStartTimeAMPM);
          this.startTimeSelectedMinute = starttimeDetailsCustom.minute;
          this.startTimeSelectedHour  = starttimeDetailsCustom.hour;
          this.startTimeAMPM = starttimeDetailsCustom.ampm;
          break;
      case 'Sleepover Shift':
        this.AddShiftStartTimeAMPM = this.organisationShiftTimes.Sleepover_Start__c.toUpperCase();
        this.AddShiftEndTimeAMPM = this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Start__c.toLowerCase());
        this.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toLowerCase());
        this.disableTimeButton=false;
        //this.checkFatigue();
        this.endDate = this.getAdjustedDate(this.todayDate);
        console.log('this.endDate >>',this.endDate);
        console.log('this.AddShiftEndTimeAMPM >>'+this.AddShiftEndTimeAMPM);
        const endtimeDetailsSleepover = this.splitTimeParts(this.AddShiftEndTimeAMPM);
        this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
        this.endTimeSelectedHour  = endtimeDetailsSleepover.hour;
        this.endTimeAMPM = endtimeDetailsSleepover.ampm;

        console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
        const starttimeDetailssleepover = this.splitTimeParts(this.AddShiftStartTimeAMPM);
        this.startTimeSelectedMinute = starttimeDetailssleepover.minute;
        this.startTimeSelectedHour  = starttimeDetailssleepover.hour;
        this.startTimeAMPM = starttimeDetailssleepover.ampm;
        break;
  
      default:
          console.warn(`Unknown shift type: ${this.addShiftData.AddShiftType}`);
          this.disableTimeButton=false;
          break;
          
  }
  

  // Calculate the shift duration after assigning values
  this.addShiftData.AddShiftDuration = this.getDuration(this.addShiftData.AddShiftStartDate, this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime, this.addShiftData.AddShiftEndTimeAMPM, this.addShiftData.AddShiftType).duration;
  this.addShiftData.AddShiftBreak= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).breakTime;
  this.timings();
  if (this.addShiftData.AddShiftStartTimeAMPM) {
    let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(' ');  // Split into "2:00" and "AM"
    let [startHour, startMinute] = time.split(':');  // Split "2:00" into hour and minute
    this.startTimeSelectedHour = startHour;
    this.startTimeSelectedMinute = startMinute;
    this.startTimeAMPM = period =="AM" ?true:false; // Store "AM" or "PM"
}

if (this.addShiftData.AddShiftEndTimeAMPM) {
    let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(' ');  // Split into "2:00" and "AM"
    let [endHour, endMinute] = time.split(':');  // Split "2:00" into hour and minute
    this.endTimeSelectedHour = endHour;
    this.endTimeSelectedMinute = endMinute;
    this.endTimeAMPM = period =="AM" ?true:false; // Store "AM" or "PM"
}
  console.log('addShiftData', JSON.stringify(this.addShiftData));
  this.getOverLappingdata(); 
}

timings(){
    
}


addRateRow() {
    if (this.rateRows.length < 4) {
        const newRow = {
            id: Date.now(), // or generate unique id however you like
            startTime: '',
            endTime: '',
            hourlyRate: ''
        };
        this.rateRows = [...this.rateRows, newRow];
    }
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
    console.log('event.target.value >>',event.target.value);
    this.startTime = event.target.value;
    console.log('Start Time:', this.startTime);
    const childData = event.detail;
    console.log('childData Start Time', JSON.stringify(childData));
    this.AddShiftStartTimeAMPM = childData.displaytime;

    this.AddShiftStartTime = this.convertTo24HourFormat(childData.displaytime.toLowerCase());
   

    console.log('this.AddShiftStartTimeAMPM >>'+this.AddShiftStartTimeAMPM);
    const starttimeDetailssleepover = this.splitTimeParts(this.AddShiftStartTimeAMPM);
    this.startTimeSelectedMinute = starttimeDetailssleepover.minute;
    this.startTimeSelectedHour  = starttimeDetailssleepover.hour;
    this.startTimeAMPM = starttimeDetailssleepover.ampm;
  
    console.log('AddShiftStartTimeAMPM==>'+this.AddShiftStartTimeAMPM);
 //  
  
    this.endDate = this.getAdjustedDate(this.todayDate);
    console.log('EndDate >> '+this.endDate);
}

handleEndTimeChange(event) {
    const childData = event.detail;
    //this.endTime = childData;
    console.log('childData End Time', JSON.stringify(childData));
    this.AddShiftEndTimeAMPM = childData.displaytime;
    console.log('AddShiftEndTimeAMPM==>'+this.AddShiftEndTimeAMPM);
    if(this.shiftTypeValue == 'Sleepover Shift' || this.shiftTypeValue == 'Night'){
        let adjustedDate = this.getShiftAdjustedDate(this.todayDate, this.AddShiftEndTimeAMPM);
        this.endDate = adjustedDate;
        console.log('endDate==>'+this.endDate);
    }
   
    this.AddShiftEndTime = this.convertTo24HourFormat(childData.displaytime.toLowerCase());
    const endtimeDetailsSleepover = this.splitTimeParts(this.AddShiftEndTimeAMPM);
    this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
    this.endTimeSelectedHour  = endtimeDetailsSleepover.hour;
    this.endTimeAMPM = endtimeDetailsSleepover.ampm;
 
   this.endDate = this.getAdjustedDate(this.todayDate);
   console.log('EndDate >> '+this.endDate);
}

getShiftAdjustedDate(baseDateStr, AddShiftEndTimeAMPM) {
    console.log('Base Date (baseDateStr):', baseDateStr);
    console.log('Shift End Time (AddShiftEndTimeAMPM):', AddShiftEndTimeAMPM);

    // Check if time is in AM
    const isAM = AddShiftEndTimeAMPM.toUpperCase().includes('AM');

    // Split the base date into year, month, and day
    const dateParts = baseDateStr.split('-'); 
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Months are zero-based in JS
    const day = parseInt(dateParts[2]);

    // Create a new date object (local time in Australia/Sydney)
    let date = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone confusion

    // Convert to AEST (Australia/Sydney)
    let options = {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    let formatter = new Intl.DateTimeFormat('en-AU', options);
    let formattedDate = formatter.format(date);

    console.log('Formatted Date in AEST:', formattedDate);

    if (isAM) {
        console.log('Shift ends in AM → Use next day');
        date.setDate(date.getDate() + 1); // Move to next day if AM
    } else {
        console.log('Shift ends in PM → Use current day');
    }

    // Return in YYYY-MM-DD format
    const resultDate = date.toISOString().split('T')[0];
    console.log('Adjusted Date Returned:', resultDate);

    return resultDate;
}

handleReccuringChange(event){
    console.log('Reccuring Change: ', event.target.checked);
    this.AddShiftRecurringCheckboxValue = event.target.checked;
    this.isRecurring = this.AddShiftRecurringCheckboxValue;
    console.log('isRecurring:', this.isRecurring);
    console.log('roleValue :', this.roleValue);
}

handleRecurChange(event) {
    this.selectedDays = [];
    this.recurEndDate = '';
    this.recurEveryValue = '';
    const selectedValue = event.detail.value;
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
    else if (selectedValue == 'Fortnightly'){
        console.log('Recurring Option Selected:', selectedValue);
        this.recurEveryOptions = this.generateOptions(15);
        this.RecurValue = selectedValue;
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = false;
    }
    this.reccuring = selectedValue;
    console.log('Recurring Option Selected:', this.reccuring);
    console.log('roleValue :', this.roleValue);
}

handleRecurEveryChange(event) {
    const selectedValue = event.detail.value;
    console.log('Recur Every Option Selected:', selectedValue);
    this.recurEveryValue = selectedValue;
    console.log('roleValue :', this.roleValue);
}

handleMonthlyOptionChange(event){
    this.monthOfDay = event.target.value;
    console.log('Monthly Option Selected:', this.monthOfDay);
    console.log('roleValue :', this.roleValue);
}

handleRecurEndDateChange(event) {
    this.isSaveDisabled = false;
    this.recurEndDate = event.detail.value;
    console.log('Recurrence End Date selected:', this.recurEndDate);
    console.log('roleValue :', this.roleValue);

    if (this.recurEndDate <= this.todayDate) {
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
    console.log('roleValue :', this.roleValue);
}


refreshCatalogueData() {
    getCatalogueData({ serviceType: this.serviceTypevalue, clientId: this.clientId })
    .then(result => {
            console.log('Full Result:', result);
            console.log('Catalogue Data:', result.catalogueData);
            console.log('States Combined:', result.statesCombined);
            const rawStateCode = result.statesCombined;
            const cleanedStateCode = rawStateCode.replace('__c', ''); // removes the "__c"

            console.log('Cleaned State Code:', cleanedStateCode);
        
            this.RegionStateValue = cleanedStateCode;
            this.serviceEditGroupName = [];
            // Check type before using map
            if (Array.isArray(result.catalogueData)) {
                this.serviceEditGroupName = result.catalogueData.map(item => {
                    return {
                        ...item,
                        amount: item[rawStateCode] || 0,
                        isSelected: false
                    };
                });
                this.CatlogTabel = true;
                console.log('✅ Mapped serviceEditGroupName:', JSON.stringify(this.serviceEditGroupName));
                console.log('roleValue :', this.roleValue);
            } else {
                console.error('❌ catalogueData is not an array:', result.catalogueData);
            }
    })    
        .catch(error => {
            console.error('Error:', error);
    });
}


handleserviceTypchange(event){
    this.serviceEditGroupName = [];
    this.CatlogTabel = false;
    this.serviceTypevalue = event.target.value;
    console.log('serviceTypevalue '+this.serviceTypevalue);
    this.refreshCatalogueData();
}


HandleRegionStateChange(event) {
    this.RegionStateValue = event.target.value;
    console.log('RegionStateValue:', this.RegionStateValue);
    //this.refreshCatalogueData();
}



async loadOrganizationDetails() {
    organizationDetails().then(response => {
        let orgRoles = response.listofPriceBook.Roles__c;
        this.state = response.listofPriceBook.Address_Latest__StateCode__s;

        this.roleOptions = orgRoles
            .split(';')
            .sort()
            .map(rec => ({
                value: rec,
                label: rec
            }));
    }).catch(error => {
        console.error('Error loading organization details:', error);
    });
}

@track ndisAmount
HandleEditNdisCheckBox(event) {
    console.log('Radio button clicked');  // Check if this logs
    const selectedId = event.target.dataset.id;  // Get the id of the clicked radio button
    const amount = event.target.dataset.amount;
    this.selectedcatlogId = selectedId;
    this.ndisAmount = amount;
    console.log('Selected ID:', selectedId);
    console.log('NDIS Amount:', this.ndisAmount);
}

     

 fetchStaffOptions(role, participantId) {
        console.log('🔄 Fetching staff options for role:', role, 'and participant ID:', participantId);   
    }


handleRoleChange(event) {
    // Step 1: Get selected role from the event
    this.selectedRole = event.detail.value;
    console.log('Selected Role:', this.selectedRole);

    // Step 2: Show the table
    this.rolestable = true;
    console.log('Table visible:', this.rolestable);
    this.roleValue = this.selectedRole;

    console.log('Initialized roleRows:', this.roleRows);

    // Step 4: Call Apex to get staff options
    console.log('Calling Apex with Role:', this.selectedRole, 'Participant ID:', this.clientId);

   // this.fetchStaffOptions(this.selectedRole, this.clientId);
      getStaffOptions({ role: this.selectedRole, participantId: this.clientId })
                                    .then(result => {
                                        console.log('✅ Apex returned staff options:', result);

                                        this.staffList = result.map(item => ({
                                            ...item,
                                            Staff__c:item.Id,
                                            Id:null,
                                            Role: this.roleValue, // Overwrite Role field
                                            SCR: item.SCR ? parseFloat(item.SCR).toFixed(2) : '0.00'
                                        }));

                                        this.showRolesTable = true;
                                        console.log('Table visible:', this.staffList);
                                         console.log('✅ Sorted Staff List by Priority:', JSON.stringify(this.staffList));
                                    })
                                    .catch(error => {
                                        console.error('❌ Error fetching staff options:', error);
                                        this.showRolesTable = false;
                                    });
    console.log('Role options:', this.roleOptions);
}

handleStaffChange(event) {
    const index = event.target.dataset.index;
    const selectedStaffId = event.detail.value;
    console.log('Staff updated for row:', selectedStaffId);
    console.log('Row index:', index);

    const updatedRows = [...this.roleRows];
    if (updatedRows[index]) {
        updatedRows[index] = {
            ...updatedRows[index],
            selectedStaff: selectedStaffId
        };
        this.roleRows = updatedRows;
        console.log('Updated roleRows:', JSON.stringify(this.roleRows));
    }
    
}

handlePriorityChange(event) {
    const index = event.target.dataset.index;
    const selectedPriority = event.detail.value;
    console.log('Priority updated for row:', selectedPriority);
    console.log('Row index:', index);

    const updatedRows = [...this.roleRows];
    if (updatedRows[index]) {
        updatedRows[index] = {
            ...updatedRows[index],
            priority: selectedPriority
        };
        this.roleRows = updatedRows;
        console.log('Updated roleRows:', JSON.stringify(this.roleRows));
    }
}


handleDelete(event) {
    const index = event.target.dataset.index;
    this.roleRows.splice(index, 1);
    this.updateLastFlag();
}

handleAddRow() {
    this.roleRows.push({
        id: Date.now() + Math.random(), // Unique ID
        selectedStaff: '',
        priority: '',
        isLast: true
    });
    this.updateLastFlag();
}

updateLastFlag() {
    this.roleRows.forEach((row, index) => {
        row.isLast = index === this.roleRows.length - 1;
    });
    this.roleRows = [...this.roleRows]; // Refresh reactivity
}

get addressComponentStyle() {
  return this.addNewAddressCheckBox ? '' : 'display: none;';
}

getDuration(startTime, endTime) {
    const parseTime = timeStr => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        return { hours, minutes };
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);

    const startDate = new Date();
    startDate.setHours(start.hours, start.minutes, 0);

    const endDate = new Date();
    endDate.setHours(end.hours, end.minutes, 0);

    let diffMs = endDate - startDate;
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours: diffHrs, minutes: diffMins };
}


@track fundsAvailableAmount;
@track fundsName;
handlesavebutton(event) {
    console.log('Save button clicked');

    // 💡 First: Perform all required field validations
    if (!this.shiftTypeValue || !this.AddShiftStartTimeAMPM || !this.AddShiftEndTimeAMPM) {
        this.showToast('Error', 'All fields must be filled. Please provide a valid Shift Type, Start Time, and End Time.', 'error');
        return;
    }

    if (!this.serviceTypevalue || this.serviceTypevalue === '--None--' || !this.RegionStateValue || this.RegionStateValue === '--None--') {
        this.showToast('Error', 'Please provide a valid Service Type', 'error');
        return;
    }

    if (!this.roleValue || this.roleValue === '--None--') {
        this.showToast('Error', 'Please provide Role', 'error');
        return;
    }

    if (!this.street || !this.city || !this.country || !this.province || !this.postalCode) {
        this.showToast('Error', 'Please provide Address', 'error');
        return;
    }

    if (!this.selectedcatlogId || this.selectedcatlogId === '--None--') {
        this.showToast('Validation Error', 'Please select a Support Item Name.', 'error');
        return;
    }

    if (this.AddShiftRecurringCheckboxValue) {
        if (!this.recurEveryValue || !this.recurEndDate) {
            this.showToast('Validation Error', 'Please provide the "Recur Every" and "End Date" when Recurring is checked.', 'error');
            return;
        }

        if (this.isRecurWeekFlag && !this.selectedDays.length) {
            this.showToast('Validation Error', 'Please select at least one day for weekly recurrence.', 'error');
            return;
        }

        if (this.isRecurmontlyFlag && !this.monthOfDay) {
            this.showToast('Validation Error', 'Please select a day for monthly recurrence.', 'error');
            return;
        }
    }

    // 🕒 Duration + amount calculation
    const duration = this.getDuration(this.AddShiftStartTimeAMPM, this.AddShiftEndTimeAMPM);
    const totalHours = duration.hours + duration.minutes / 60;
    const totalAmount = totalHours * this.ndisAmount;

    console.log(`⏱️ Duration: ${duration.hours}h ${duration.minutes}m`);
    console.log(`🧮 Total Amount: ${totalAmount}`);

    // 🔁 Call Apex to get available fund info
    const selectedIdList = [this.serviceTypevalue];

    getFundsData({ fundsId: selectedIdList })
        .then(result => {
            console.log('result >>', result);
            const fundMap = new Map();
            result.forEach(fund => {
                fundMap.set(fund.Id, {
                    available: fund.Available_Funds__c || 0,
                    name: fund.Name || 'Unknown Service'
                });
            });

            const fund = fundMap.get(this.serviceTypevalue);

            if (!fund) {
                this.showToast('Error', 'Fund data not found.', 'error');
                return;
            }

            this.fundsAvailableAmount = fund.available;
            this.fundsName = fund.name;

            if (totalAmount > fund.available) {
                this.showToast('Error', `Service "${this.fundsName}" exceeds available funds. Used: $${totalAmount.toFixed(2)}, Available: $${fund.available.toFixed(2)}`, 'error');
                return;
            }

            // ✅ Funds valid — proceed to save
            const payload = {
                availabilityId: this.availabilityId,
                clientId: this.clientId,
                todayDate: this.todayDate,
                shiftType: this.shiftTypeValue,
                startTime: this.AddShiftStartTimeAMPM,
                endTime: this.AddShiftEndTimeAMPM,
                recurringChecked: this.AddShiftRecurringCheckboxValue,
                recurringType: this.reccuring,
                recurEvery: this.recurEveryValue,
                recurEndDate: this.recurEndDate,
                selectedDays: this.selectedDays,
                monthOfDay: this.monthOfDay,
                serviceTypeId: this.serviceTypevalue,
                regionState: this.RegionStateValue,
                catalogId: this.selectedcatlogId,
                roleId: this.roleValue,
                roleRows: this.roleRows,
                endDateShift: this.endDate,
                staffList: this.staffList,
                street: this.street,
                country: this.country,
                city: this.city,
                province: this.province,
                postalCode: this.postalCode,
                LocationLatitude: this.LocationLatitude,
                LocationLongitude: this.LocationLongitude,
                AdddressType: this.typeofAddress
            };

            console.log('📤 Sending data to Apex:', JSON.stringify(payload));

            saveShiftData({ shiftData: payload })
                .then(() => {
                    this.showToast('Success', 'Shift data saved successfully', 'success');
                    this.resetFields();
                    this.fetchAvailability();
                    this.fetchHolidays();
                    this.fetchServices();
                    this.editButtonModule = false;
                })
                .catch(error => {
                    console.error('❌ Error saving shift data:', error);
                    this.showToast('Error', 'Failed to save shift data', 'error');
                });

        })
        .catch(error => {
            console.error('❌ [Apex Error] Failed to fetch fund data:', error);
            this.showToast('Error', 'Failed to fetch fund data.', 'error');
        });
}



resetFields() {
    this.availabilityId = null;
    this.todayDate = null;
    this.shiftTypeValue = null;
    this.AddShiftStartTimeAMPM = null;
    this.AddShiftEndTimeAMPM = null;
    this.AddShiftRecurringCheckboxValue = false;
    this.reccuring = null;
    this.recurEveryValu = null;
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
    this.isRecurmontlyFlag = false;
    this.isRecurWeekFlag = false;
    this.RecurValue = null;
    this.recurEveryValue = null;
    this.recurEndDate = null;
    this.roleValue = null;
    this.serviceEditGroupName = [];
    this.serviceEditGroupName = [];
    this.CatlogTabel = false;
    this.facilityAddressCheckbox =false;
    this.participantAddressCheckBox = false;
    this.addNewAddressCheckBox = false;
    this.street = '';
    this.city = '';
    this.country = '';
    this.province = '';
    this.postalCode = '';
    this.showRolesTable = false;
    this.staffList = [];
    this.AdddressType = '';

    // Optional: If you want to clear any UI elements, you can also reset their values.
    console.log('Fields have been reset.');
}

    
    async handleEdit(event) {
                console.log('🟡 Entered handleEdit');
                
                this.isCreateMode = false;
                this.isUpdateMode = true;
                this.buttonTitle = 'Update Shift';
                
                const recordId = event.currentTarget.dataset.id;
                this.availabilityId = recordId;

                console.log('🆔 Availability ID:', this.availabilityId);
                console.log('🧾 Full Availability List:', JSON.stringify(this.availability));

                const availabilityMap = new Map();
                this.availability.forEach(available => {
                    const dateKey = available.Id;
                    if (!availabilityMap.has(dateKey)) {
                        availabilityMap.set(dateKey, []);
                    }
                    availabilityMap.get(dateKey).push(available);
                });

                const availableForDate = availabilityMap.get(recordId) || [];
                console.log('📅 Matched Availabilities for ID:', recordId, JSON.stringify(availableForDate));

                this.selectedavailability = availableForDate.map(available => {
                    return {
                        ...available,
                        formattedStart: this.formatTime(available.Start_Time__c),
                        formattedEnd: this.formatTime(available.End_Time__c)
                    };
                });
                console.log('⏰ Formatted Availabilities:', JSON.stringify(this.selectedavailability));

                if (this.selectedavailability.length === 0) {
                    console.warn('⚠️ No availability found for selected record.');
                    return;
                }

                const firstAvailability = this.selectedavailability[0];

                console.log('📌 Using First Availability Record:', JSON.stringify(firstAvailability));

                this.todayDate = firstAvailability.Start_Date__c;
                this.shiftTypeValue = firstAvailability.Shift_Type__c;
                this.AddShiftStartTimeAMPM = firstAvailability.formattedStart;
                const starttimeDetails = this.splitTimeParts(this.AddShiftStartTimeAMPM);
                this.startTimeSelectedMinute = starttimeDetails.minute;
                this.startTimeSelectedHour = starttimeDetails.hour;
                this.startTimeAMPM = starttimeDetails.ampm;

                this.AddShiftEndTimeAMPM = firstAvailability.formattedEnd;
                const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
                this.endTimeSelectedMinute = endtimeDetails.minute;
                this.endTimeSelectedHour = endtimeDetails.hour;
                this.endTimeAMPM = endtimeDetails.ampm;

                this.serviceTypevalue = firstAvailability.Funds_Tracker__c;
                this.RegionStateValue = firstAvailability.State__c;
                this.roleValue = firstAvailability.Role__c;
                this.street = firstAvailability.Address__Street__s;
                this.city = firstAvailability.Address__City__s;
                this.country = 'Australia';
                this.province = firstAvailability.Address__StateCode__s;
                this.postalCode = firstAvailability.Address__PostalCode__s;
                this.typeofAddress = firstAvailability.Address_Type__c;

                console.log('📍 Address Info — Street:', this.street, '| City:', this.city, '| Province:', this.province, '| Type:', this.typeofAddress);

                this.facilityAddressCheckbox = this.typeofAddress === 'Facility';
                this.participantAddressCheckBox = this.typeofAddress === 'Participant';
                this.addNewAddressCheckBox = this.typeofAddress === 'Add New';

                if (this.clientId) {
                    console.log('🔄 Loading Service Types & Organization Details...');
                    try {
                        await this.getserviceTypes();
                        console.log('✅ getserviceTypes completed');

                        await this.loadOrganizationDetails();
                        console.log('✅ loadOrganizationDetails completed');
                    } catch (error) {
                        console.error('❌ Error loading Service Types or Org Details:', error);
                    }
                }

                if (this.serviceTypevalue != null) {
                    console.log('📦 NDIS Catalogue Setup Start');
                    this.CatlogTabel = true;
                    this.refreshCatalogueData();
                    this.selectedcatlogId = firstAvailability.NDIS_Support_Catalogue__c;

                    console.log('📦 Selected Catalogue ID:', this.selectedcatlogId);

                    setTimeout(() => {
                        console.log('⏳ Applying selection to serviceEditGroupName...');
                        if (Array.isArray(this.serviceEditGroupName)) {
                            this.serviceEditGroupName = this.serviceEditGroupName.map(row => ({
                                ...row,
                                isSelected: row.Id === this.selectedcatlogId
                            }));
                            console.log('✅ Applied selection to Catalogue Table');
                        } else {
                            console.warn('⚠️ serviceEditGroupName is not an array or not loaded yet');
                        }
                    }, 4000);
                }

                if (this.roleValue != null) {
                  
                        console.log('🔍 Fetching staff options for role:', this.roleValue, 'and client ID:', this.clientId);
                         getStaffOptions({ role: this.roleValue, participantId: this.clientId })
                                    .then(result => {
                                        console.log('✅ Apex returned staff options:', result);

                                        this.staffList = result.map(item => ({
                                            ...item,
                                            Role: this.roleValue, // Overwrite Role field
                                            SCR: item.SCR ? parseFloat(item.SCR).toFixed(2) : '0.00'
                                        }));

                                        this.showRolesTable = true;
                                        console.log('Table visible:', this.staffList);

                                         const priorityStaffs = firstAvailability.Priority_Staffs__r || [];
                                
                                console.log(`🧑‍🤝‍🧑 Found ${JSON.stringify(priorityStaffs)} priority staff records`);

                                    this.staffList = priorityStaffs
                                        .map((staff, index) => ({
                                            ...staff,
                                            id: staff.Id,
                                            selectedStaff: staff.Staff__c,
                                             SCR: staff.Staff__r.SCR__c ? parseFloat( staff.Staff__r.SCR__c).toFixed(2) : '0.00', 
                                            priority: parseInt(staff.Priority__c, 10),
                                            Name: staff.Staff__r.Name +' '+ staff.Staff__r.Last_Name__c,
                                            LastName: staff.Staff__r.Last_Name__c,
                                            ClassicLevel: staff.Staff__r.Class_and_Paypont__c
                                        }))
                                        .sort((a, b) => a.priority - b.priority);

                                console.log('✅ Sorted Staff List by Priority:', JSON.stringify(this.staffList));
                                    })
                                    .catch(error => {
                                        console.error('❌ Error fetching staff options:', error);
                                        this.showRolesTable = false;
                                    });
                //  this.fetchStaffOptions(this.roleValue, this.clientId);
                        console.log('✅ Staff options fetched successfully');
                   

                   
                }

                this.editButtonModule = true;
                this.isPopoverVisible = false;
            console.log('✅ handleEdit completed'+this.isUpdateMode);
                console.log('✅ handleEdit completed');
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

    // Called when any checkbox changes
    AdreesCheckboxChange(event) {
        const name = event.target.name;

        // Reset all checkboxes
        this.facilityAddressCheckbox = false;
        this.participantAddressCheckBox = false;
        this.addNewAddressCheckBox = false;
        // Enable only the one that was clicked
        if (name === 'facilityAddressCheckbox') {
            this.facilityAddressCheckbox = true;
            this.typeofAddress = 'Facility';
            this.getFacilityAddress(); 
        } else if (name === 'participantAddressCheckBox') {
            this.participantAddressCheckBox = true;
            this.typeofAddress = 'Participant';
            this.getparticipantAddress();
        } else if (name === 'addNewAddressCheckBox') {
            this.addNewAddressCheckBox = true;
            this.typeofAddress = 'Add New';
            this.street = '';
            this.city = '';
            this.country = '';
            this.province = '';
            this.postalCode = '';
        }
    }

    get addressComponentStyle() {
        return this.addNewAddressCheckBox ? '' : 'display: none;';
    }

    fetchGeocode() {
        console.log('this.street >>', this.street);
        console.log('this.city >>', this.city);
        console.log('this.postalCode >>' , this.postalCode);
        const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
        const apiKey = GOOGLE_API_KEY;

        console.log('Fetching geocode for:', fullAddress);

        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                console.log('Geocode API response:', data);

                if (data.status === 'OK' && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    this.LocationLatitude = location.lat;
                    this.LocationLongitude = location.lng;

                    console.log('Parsed coordinates:', location.lat, location.lng);
                } else {
                    console.warn('No geocode results found or status not OK');
                }
            })
            .catch(error => {
                console.error('Error calling Geocode API:', error);
                // Optional: handle error or fallback logic here
            });
    }


    getFacilityAddress() {
            getFacilityAddress({ clientId: this.clientId })
                .then((result) => {
                    console.log('facility address', JSON.stringify(result));

                    const facility = result;
                    if (facility && facility.Facility__r) {
                        const facilityDetails = facility.Facility__r;
                        console.log('facilityDetails >>', JSON.stringify(facilityDetails));

                        this.street = facilityDetails.Address__Street__s;
                        this.city = facilityDetails.Address__City__s;
                        this.country = facilityDetails.Address__CountryCode__s === "AU" ? "Australia" : facilityDetails.Address__CountryCode__s;
                        this.province = facilityDetails.Address__StateCode__s;
                        this.postalCode = facilityDetails.Address__PostalCode__s;
                        this.fetchGeocode();
                        console.log('facility address', this.street, this.city, this.country, this.province, this.postalCode);
                    } else {
                        console.warn('Facility__r is missing in the result');
                    }
                })
                .catch((error) => {
                    console.error('Error fetching facility address:', error);
                });
    }

    getparticipantAddress() {
        getFacilityAddress({ clientId: this.clientId })
            .then((result) => {
                console.log('facility address', JSON.stringify(result));

                const facility = result;
                if (facility) {
                    const facilityDetails = facility.Facility__r;
                    console.log('facilityDetails >>', JSON.stringify(facility));

                    this.street = facility.Address__Street__s;
                    this.city = facility.Address__City__s;
                    this.country = facility.Address__CountryCode__s === "AU" ? "Australia" : facility.Address__CountryCode__s;
                    this.province = facility.Address__StateCode__s;
                    this.postalCode = facility.Address__PostalCode__s;
                    this.fetchGeocode();
                    console.log('facility address', this.street, this.city, this.country, this.province, this.postalCode);
                } else {
                    console.warn('Facility__r is missing in the result');
                }
            })
            .catch((error) => {
                console.error('Error fetching facility address:', error);
            });
    }

    
    handleAddressChange(event) {
        const address = event.detail;
        this.street = address.street;
        this.city = address.city;
        this.country = address.country;
        this.province = address.province;
        this.postalCode = address.postalCode;

        console.log('📬 Updated Address:', address);
        this.fetchGeocode();
    }

    draggedItem = null;
    draggedOverItem = null;

    handleDragStart(event) {
        const index = event.currentTarget.dataset.index;
        console.log('index >>', index);
        this.draggedItem = index;
        this.staffList[index].dragClass = 'slds-theme_shade slds-opacity_50';
        this.staffList = [...this.staffList];
    }

    handleDragOver(event) {
        event.preventDefault();
        const index = event.currentTarget.dataset.index;
        this.draggedOverItem = index;
          console.log('index >>', index);
        // Reset all drag classes
        this.staffList.forEach(staff => staff.dragClass = '');
        
        // Add drag indicator class
        if (this.draggedItem !== index) {
            this.staffList[index].dragClass = 'slds-theme_info slds-border_top';
        }
        
        this.staffList = [...this.staffList];
    }

    handleDrop(event) {
        event.preventDefault();
        const draggedIndex = parseInt(this.draggedItem);
        const droppedIndex = parseInt(this.draggedOverItem);

        if (draggedIndex !== droppedIndex) {
            const newStaffList = [...this.staffList];
            const draggedItem = newStaffList[draggedIndex];
            
            // Remove dragged item
            newStaffList.splice(draggedIndex, 1);
            
            // Insert at new position
            newStaffList.splice(droppedIndex, 0, draggedItem);
            
            // Reset drag classes
            newStaffList.forEach(staff => staff.dragClass = '');
            
            this.staffList = newStaffList;

            console.log('this.staffList >>'+JSON.stringify(this.staffList));
        }
    }

    handleDragEnd() {
        // Reset all drag classes
        this.staffList.forEach(staff => staff.dragClass = '');
        this.staffList = [...this.staffList];
        
        this.draggedItem = null;
        this.draggedOverItem = null;
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