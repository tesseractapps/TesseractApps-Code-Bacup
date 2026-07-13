import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import momentJS from '@salesforce/resourceUrl/momentJS';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserEmail from '@salesforce/schema/User.Email';
import getcurrentStaff from '@salesforce/apex/AddShiftController.getcurrentStaff';
import roleBasedShift from '@salesforce/apex/AddShiftController.roleBasedShift';
import handleAllocation from '@salesforce/apex/AddShiftController.handleAllocation';
import Rejectedshifts from '@salesforce/apex/AddShiftController.Rejectedshifts';
import getHours from '@salesforce/apex/AddShiftController.getSetHours';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getAddShiftData from '@salesforce/apex/RosterInvoicesHandler.getAddShiftData';
import getOverlappingShiftsData from '@salesforce/apex/StaffController.getOverlappingShiftsData';
import getShiftTypeCssMap from '@salesforce/apex/StaffController.getShiftTypeCssMap';
import holidayList from '@salesforce/apex/LeaveController.holidayListbyOrg';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import { refreshApex } from '@salesforce/apex';

export default class TesseractAppsMyRosterLwc extends LightningElement {
    // Tracked Properties
    @track state;
    @track myroster = true;
    @track availableShifts = false;
    @track activeTab = 'myRoster';
    @track weekDays = [];
    @track totalHours = 0;
    @track setHours = 0;
    @track showSpinner = false;
    @track datePickerString;
    @track formattedCurrentDate;
    @track isNextDisabled = false;
    @track holidayList = [];
    @track facilityPreferredName;
    @track participantPreferredName;
    @track documentExpired = false;

    
    // Modal Properties
    @track RejectedFlag = false;
    @track CommentsFlag = false;
    @track RejectId;
    @track comments = '';
    
    // Internal Properties
    startDate;
    endDate;
    staffEmail;
    staffId;
    todayDate;
    sixWeeksLater;
    allocatedShifts = [];
    @track shiftTypeColors = {}; // Store the color map from Apex
    @track legendItems = []; // Dynamic legend items

    // Wire Shift Colors from Apex
    @wire(getShiftTypeCssMap)
    wiredShiftColors({ error, data }) {

        // 🔹 START LOG (JSON)
        console.log('wiredShiftColors_START 1 >>>>>', JSON.stringify(data));
        if (data) {
            // 🔹 Initialize maps
            this.shiftTypeColors = {};
            this.shiftTypeNames = {};
            this.shiftTypeFacilities = {};
            this.shiftTypeFacilityNames = {};
            this.shiftTypesByFacility = {};

            data.forEach(item => {
                this.shiftTypeColors[item.Id] = item.Colour__c;
                this.shiftTypeNames[item.Id] = item.Name;
                this.shiftTypeFacilities[item.Id] = item.Facility__c;
                this.shiftTypeFacilityNames[item.Id] =
                    item.Facility__r ? item.Facility__r.Name : null;

                if (!this.shiftTypesByFacility[item.Facility__c]) {
                    this.shiftTypesByFacility[item.Facility__c] = [];
                }
                this.shiftTypesByFacility[item.Facility__c].push(item);
            });

            // Apply CSS & refresh UI
            this.applyShiftColorsToDOM();
            this.generateLegendItems();

            if (this.weekDays.length > 0) {
                this.refreshShiftColors();
            }

            // 🔹 END LOG (SUCCESS - JSON)
            console.log('wiredShiftColors_END 1',JSON.stringify(data));
        } else if (error) {
            this.setDefaultShiftColors();
        }
    }

    // Wire User Email
    @wire(getRecord, { recordId: Id, fields: [UserEmail] })
    currentUserInfo({ error, data }) {
        if (data) {
            this.staffEmail = data.fields.Email.value;
        } else if (error) {
            console.error('Error fetching user info:', error);
        }
    }

    // Wire Staff Information
    @wire(getStaffByEmail, { email: '$staffEmail' })
    wiredStaff({ data, error }) {
        if (data && data.length > 0) {
            this.staffId = data[0].Id;
        } else if (error) {
            console.error('Error fetching staff:', error);
        }
    }

    // Lifecycle Methods
    connectedCallback() {
       /*  this.initializeComponent();

        orgDetails().then(response => {
            console.log('response==>' + JSON.stringify(response));
            this.Orgid = response.Id;
            this.orgfullname = response.Name;
            this.orgname = response.Name ? response.Name.split(' ').slice(0, 2).join(' ') : '';
            this.usertype = response.Type_of_User__c;
            this.state = response.Address_Latest__StateCode__s;
            this.Orgabn = response.ABN__c;

            if (this.usertype === 'NDIS User') {
                if (this.currentUserRole == 'Portal Account Partner User') {
                    this.blNDISUser = true;
                }
                this.NdisFlag = true;
            }

            if (this.currentUserType == 'NDIS Participants') {
                this.ChatModule = false;
            }

            if (this.currentUserType == 'Accountant for Organisation') {
                this.NdisFlag = false;
            }

            // ✅ Ensure current week and holidays are set
            this.setCurrentWeek();
        }); */
        this.loadComponent();
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "";

        const activeTab = localStorage.getItem('myRosterTab');
        this.myroster = false;
        this.availableShifts = false;
        switch (activeTab) {
            case 'myRoster':
                this.myroster = true;
                this.activeTab = 'myRoster';
                break;
            case 'availableShifts':
                this.availableShifts = true;
                this.activeTab = 'availableShifts';
                break;
            
            default:
                this.myroster = true;
                this.activeTab = 'myRoster'; 
                
        }

    }
    async loadComponent() {
    try {
        await this.initializeComponent();

        const response = await orgDetails();
        console.log('response==>' + JSON.stringify(response));
        this.Orgid = response.Id;
        this.orgfullname = response.Name;
        this.orgname = response.Name ? response.Name.split(' ').slice(0, 2).join(' ') : '';
        //this.facilityPrefreedName = response.Facility_Preferred_Name_Formula__c;
        //this.participantPrefreedName = response.Participant_Preferred_Name_Formula__c;
        this.usertype = response.Type_of_User__c;
        this.state = response.Address_Latest__StateCode__s;
        this.Orgabn = response.ABN__c;

        if (this.usertype === 'NDIS User') {
            if (this.currentUserRole === 'Portal Account Partner User') {
                this.blNDISUser = true;
            }
            this.NdisFlag = true;
        }

        if (this.currentUserType === 'NDIS Participants') {
            this.ChatModule = false;
        }

        if (this.currentUserType === 'Accountant for Organisation') {
            this.NdisFlag = false;
        }

        // ✅ Now that everything is ready, set current week and load data
        this.setCurrentWeek();

    } catch (error) {
        console.error('Error loading component:', error);
    }
}


    // Fetch holidays for the current week
    async fetchHolidays() {
        if (!this.startDate || !this.state) {
            console.log('Missing startDate or state for holiday fetch');
            return;
        }

        const formattedDate = this.formatDate(this.startDate);

        try {
            console.log('Fetching holidays for date:', formattedDate, 'state:', this.state);
            const response = await holidayList({
                datePicker: formattedDate,
                state: this.state
            });

            this.holidayList = response || [];
            console.log('Fetched Holidays:', JSON.stringify(this.holidayList));

            // ✅ Only update holidays (do not re-generate weekDays here)
            this.updateWeekDaysWithHolidays();

        } catch (error) {
            console.error('Error fetching holiday list:', error);
            this.holidayList = [];
        }
    }


    // Update weekDays array with holiday information and background colors
    updateWeekDaysWithHolidays() {
        if (!this.holidayList || !this.weekDays) return;

        this.weekDays = this.weekDays.map(weekDay => {
            const holiday = this.holidayList.find(h => h.Date__c === weekDay.dateString);

            const isHoliday = !!holiday;
            const holidayName = isHoliday ? holiday.Holiday_Name__c : '';

            return {
                ...weekDay,
                isHoliday,
                holidayName,
                cssClass: `day-cell ${weekDay.isToday ? 'today' : ''} ${isHoliday ? 'holiday' : ''}`,
                bgColorClass: weekDay.isToday ? 'today' : (isHoliday ? 'holiday' : 'normal')
            };
        });
    }

    // Helper function to convert hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Helper function to create light background color
    getLightBackgroundColor(hexColor) {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) return 'rgba(1, 118, 211, 0.1)'; // Default light blue
        
        // Create a very light version (10% opacity)
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
    }

    // Generate legend items dynamically based on shift colors
    generateLegendItems() {
        this.legendItems = [];
        
        // Define proper labels for shift types
        const shiftLabels = {
            'general': 'General Shift',
            'morning': 'Morning Shift',
            'afternoon': 'Afternoon Shift',
            'night': 'Night Shift',
            'custom': 'Custom Shift',
            'sleepover shift': 'Sleepover Shift'
        };

        console.log('this.legendItems    >>>>>>', this.legendItems);
        Object.entries(this.shiftTypeColors).forEach(([shiftType, color]) => {
            this.legendItems.push({
                key: shiftType,
                label: shiftLabels[shiftType] || this.capitalizeWords(shiftType),
                style: `background-color: ${color}; width: 16px; height: 16px; border-radius: 3px; display: inline-block;`
            });
        });
    }

    // Capitalize words helper function
    capitalizeWords(str) {
        return str.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    // Apply shift colors as CSS custom properties to the DOM
    applyShiftColorsToDOM() {
        if (Object.keys(this.shiftTypeColors).length === 0) return;
        
        // Create or update style element
        let styleElement = document.getElementById('shift-colors-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'shift-colors-style';
            document.head.appendChild(styleElement);
        }
        
        // Generate CSS custom properties
        let cssText = ':root {';
        Object.entries(this.shiftTypeColors).forEach(([shiftType, color]) => {
            const cssVarName = `--shift-${shiftType.replace(/\s+/g, '-').toLowerCase()}`;
            const lightBgVarName = `--shift-${shiftType.replace(/\s+/g, '-').toLowerCase()}-light`;
            cssText += `${cssVarName}: ${color};`;
            cssText += `${lightBgVarName}: ${this.getLightBackgroundColor(color)};`;
        });
        cssText += '}';
        
        // Add shift-specific classes with side strip and light background
        cssText += `
            .shift-card { 
                padding: 12px; 
                border-radius: 8px; 
                margin: 6px 0; 
                font-weight: 500;
                border-left: 4px solid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                transition: all 0.2s ease;
                position: relative;
            }
            .shift-card:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.12);
                transform: translateY(-1px);
            }
            .legend-item {
                display: flex;
                align-items: center;
                margin-right: 1rem;
                margin-bottom: 0.5rem;
            }
            .legend-color {
                margin-right: 0.5rem;
            }
        `;
        
        // Add classes for each shift type with side strip and light background
        Object.entries(this.shiftTypeColors).forEach(([shiftType, color]) => {
            const className = shiftType.replace(/\s+/g, '-').toLowerCase();
            const lightBgColor = this.getLightBackgroundColor(color);
            cssText += `
                .shift-${className} { 
                    background-color: ${lightBgColor} !important; 
                    border-left-color: ${color} !important;
                }
            `;
        });
        
        styleElement.textContent = cssText;
        
        console.log('Applied CSS for shift colors with side strips:', cssText);
    }

    // Set default colors if API fails
    setDefaultShiftColors() {
        this.shiftTypeColors = {
            'general': '#0176d3',
            'morning': '#2e844a',
            'afternoon': '#fe9339',
            'night': '#5c6b73',
            'custom': '#9050e9',
            'sleepover shift': '#0d9488'
        };
        this.applyShiftColorsToDOM();
        this.generateLegendItems();
    }

    // Refresh colors for existing shifts
    refreshShiftColors() {
        this.weekDays.forEach(day => {
            // Update current shifts
            day.shifts.forEach(shift => {
                shift.cssClass = this.getShiftCssClass(shift.typeofshift);
                shift.shiftColor = this.getShiftColor(shift.shiftTypeId);
                shift.shiftStyle = this.getShiftStyle(shift.shiftTypeId);
            });

            // Update available shifts
            day.availableShifts.forEach(shift => {
                shift.cssClass = this.getShiftCssClass(shift.shiftType);
                shift.shiftColor = this.getShiftColor(shift.shiftTypeId);
                shift.shiftStyle = this.getShiftStyle(shift.shiftTypeId);
            });
        });
    }

    // Get shift style with side strip and light background
    /* getShiftStyle(shiftType) {
        if (!shiftType || Object.keys(this.shiftTypeColors).length === 0) {
            return 'background-color: rgba(1, 118, 211, 0.1); border-left-color: #0176d3; color: #0176d3;';
        }
        
        const cleanType = shiftType.trim().toLowerCase();
        const color = this.shiftTypeColors[cleanType] || this.shiftTypeColors['general'] || '#0176d3';
        const lightBgColor = this.getLightBackgroundColor(color);
        
        return `background-color: ${lightBgColor}; border-left-color: ${color}; color: ${color};`;
    } */


    getShiftColor(shiftId) {
        if (!shiftId || Object.keys(this.shiftTypeColors).length === 0) {
            return '#0176d3'; // default blue
        }

        const color = this.shiftTypeColors[shiftId] || this.shiftTypeColors['default'] || '#0176d3';
        console.log(`Getting color for shift id "${shiftId}": ${color}`);
        return color;
    }

    getShiftStyle(shiftId) {
        if (!shiftId || Object.keys(this.shiftTypeColors).length === 0) {
            return 'background-color: rgba(1, 118, 211, 0.1); border-left-color: #0176d3; color: #0176d3;';
        }

        const color = this.getShiftColor(shiftId);
        const lightBgColor = this.getLightBackgroundColor(color);

        return `background-color: ${lightBgColor}; border-left-color: ${color}; color: ${color};`;
    }


    async initializeComponent() {
        try {
            // Load moment.js
            await loadScript(this, momentJS);
            
            // Initialize dates
            this.todayDate = new Date();
            this.sixWeeksLater = new Date(this.todayDate);
            this.sixWeeksLater.setDate(this.sixWeeksLater.getDate() + 42);
            
            // Set initial date to current week
            this.setCurrentWeek();
            
            // Get set hours
            const hours = await getHours();
            console.log('hours >>', hours);
            this.setHours = hours || 40;
            
        } catch (error) {
            console.error('Error initializing component:', error);
        }
    }

    // Date Management
   setCurrentWeek() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

        this.startDate = startOfWeek;
        this.endDate = new Date(startOfWeek);
        this.endDate.setDate(startOfWeek.getDate() + 6);

        this.datePickerString = today.toISOString().split('T')[0];
        this.formattedCurrentDate = this.formatDisplayDate(today);

        // ✅ Step 1: Generate days first
        this.generateWeekDays();

        // ✅ Step 2: Then fetch holidays and apply to weekDays
        this.fetchHolidays();

        // ✅ Step 3: Load shift data
        this.loadShiftData();
    }


    generateWeekDays() {
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const todayAEST = new Date().toLocaleDateString('en-AU', {
            timeZone: 'Australia/Sydney',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        for (let i = 0; i < 7; i++) {
            const day = new Date(this.startDate);
            day.setDate(this.startDate.getDate() + i);

            const dayAEST = day.toLocaleDateString('en-AU', {
                timeZone: 'Australia/Sydney',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            const isToday = dayAEST === todayAEST;

            const aestIsoDate = new Date(
                day.toLocaleString('en-US', { timeZone: 'Australia/Sydney' })
            ).toISOString().split('T')[0];

            const aestDateFormatted = day.toLocaleDateString('en-AU', {
                timeZone: 'Australia/Sydney',
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const aestTime = day.toLocaleTimeString('en-AU', {
                timeZone: 'Australia/Sydney',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            days.push({
                key: day.toDateString(),
                name: dayNames[day.getDay()],
                date: this.formatShortDate(day),
                dateString: this.formatDate(day), // This should be in YYYY-MM-DD format
                aestDate: aestDateFormatted,
                aestTime: aestTime,
                shifts: [],
                availableShifts: [],
                isToday,
                isHoliday: false,
                holidayName: '',
                cssClass: `day-cell ${isToday ? 'today' : ''}`,
                columnClass: `day-column ${isToday ? 'today-column' : ''}`,
                bgColorClass: isToday ? 'today' : 'normal'
            });
        }

        this.weekDays = days;
        console.log('this.weekDays >>', JSON.stringify(this.weekDays));
    }


    // Data Loading
    async loadShiftData() {
        if (!this.staffId) return;
        
        try {
            this.showSpinner = true;
            
            // Load current staff shifts
            await this.loadCurrentStaffShifts();
            
            // Load available shifts
            await this.loadAvailableShifts();
            
        } catch (error) {
            console.error('Error loading shift data:', error);
            this.showToast('Error', 'Failed to load shift data', 'error');
        } finally {
            this.showSpinner = false;
        }
    }

    async loadCurrentStaffShifts() {
        try {
            console.log('🔄 Calling getcurrentStaff Apex with range:', 
                this.formatDate(this.startDate), 'to', this.formatDate(this.endDate));

            const response = await getcurrentStaff({
                startDate: this.formatDate(this.startDate),
                endDate: this.formatDate(this.endDate)
            });

            console.log('✅ Current staff shifts response >>', JSON.stringify(response));

            let totalHours = 0;
            this.allocatedShifts = [];

            // Reset shifts for all days
            this.weekDays.forEach(day => {
                console.log(`🗑️ Resetting shifts for ${day.dateString} (${day.name})`);
                day.shifts = [];
            });

            response.forEach((shift, index) => {
                console.log(`\n➡️ Processing Shift [${index}] Id=${shift.Id}, Status=${shift.Status__c}`);

                const shiftDate = shift.Date__c;
                console.log('📅 Shift Date:', shiftDate);

                const dayIndex = this.weekDays.findIndex(day => day.dateString === shiftDate);
                console.log('🔍 Matched Day Index:', dayIndex);

                if (dayIndex !== -1 && shiftDate < this.formatDate(this.sixWeeksLater)) {
                    let participantName = '--';
                    if (shift.Services_and_Support_Plans__r?.length > 0) {
                        participantName = shift.Services_and_Support_Plans__r[0].Client__r?.Name__c || '';
                    }
                    console.log('👤 Participant Name:', participantName);

                    // Resolve Shift Type
                    const shiftTypeId = shift.Shift_Name__c;
                    const shiftTypeName = shiftTypeId ? this.shiftTypeNames[shiftTypeId] : 'Unknown';
                    const enableShiftReject=shift.Add_Shift__r?.Facility__r?.Enable_Shift_Rejection__c;
                    console.log('enableShiftReject 111 : ',enableShiftReject);

                    console.log('🎨 ShiftTypeId:', shiftTypeId, 'ShiftTypeName:', shiftTypeName);

                    const shiftData = {
                        Id: shift.Id,
                        status: shift.Status__c === 'InProgress' ? 'In Progress' : shift.Status__c,
                        typeofshift: shiftTypeName,
                        shiftTypeId: shiftTypeId,
                        // time: shift.Add_Shift__r?.Shift_Start_End_Time__c,
                        time: shift.Start_time_Formula__c +'-'+shift.End_time_formula__c,
                        facility: shift.Add_Shift__r?.Facility__r?.Name || '--',
                        enableShiftReject:enableShiftReject || false,
                        role: shift.Add_Shift__r?.Role__c,
                        participant: participantName,
                        shiftdate: shiftDate,
                        cssClass: this.getShiftCssClass(shiftTypeName),
                        shiftColor: this.getShiftColor(shiftTypeId),
                        shiftStyle: this.getShiftStyle(shiftTypeId)
                    };

                    console.log('📦 Final ShiftData Object:', JSON.stringify(shiftData));

                    this.weekDays[dayIndex].shifts.push(shiftData);
                    console.log(`📌 Added shift to day ${this.weekDays[dayIndex].name} (${shiftDate})`);

                    this.allocatedShifts.push(shift.Shift_Type__c);
                    console.log('📝 AllocatedShifts updated:', JSON.stringify(this.allocatedShifts));

                    totalHours += shift.Duration__c || 0;
                    console.log('⏱️ Duration added:', shift.Duration__c, 'TotalHours so far:', totalHours);

                } else {
                    console.warn('⚠️ Shift ignored - no matching day or outside 6 weeks:', shiftDate);
                }
            });

            this.totalHours = totalHours;
            console.log('✅ Final Total Hours:', this.totalHours);

        } catch (error) {
            console.error('❌ Error loading current staff shifts:', error);
        }
    }


    async loadAvailableShifts() {
        try {
            const response = await roleBasedShift({
                startDate: this.formatDate(this.startDate),
                endDate: this.formatDate(this.endDate)
            });

            // Reset available shifts for all days
            this.weekDays.forEach(day => {
                day.availableShifts = [];
            });

            console.log('Available shifts response >>', JSON.stringify(response));
            response.forEach(shift => {
                const shiftDate = shift.Start_Date__c;
                const dayIndex = this.weekDays.findIndex(day => day.dateString === shiftDate);

                if (
                    dayIndex !== -1 &&
                    shift.Un_Allocated__c > 0 &&
                    !this.allocatedShifts.includes(shift.Name) &&
                    shiftDate < this.formatDate(this.sixWeeksLater)
                ) {
                    // ✅ Use Shift_Name__c directly (Id)
                    const shiftTypeId = shift.Shift_Name__c || null;
                    const shiftTypeName = shiftTypeId ? this.shiftTypeNames[shiftTypeId] : 'Unknown';

                    const shiftData = {
                        Id: shift.Id,
                        Name: shift.Name,
                        role: shift.Role__c,
                        StartEndTime: shift.Shift_Start_End_Time__c,
                        Location: shift.Location__Street__s,
                        duration: shift.Duration__c,
                        isEOI: shift.Is_EOI__c,
                        ischecked: false,
                        isinterest: false,
                        Facility: shift.Facility_Name__c || '--',

                        // ✅ store both Id and Name
                        shiftTypeId: shiftTypeId,
                        shiftType: shiftTypeName,

                        cssClass: this.getShiftCssClass(shiftTypeName),
                        shiftColor: this.getShiftColor(shiftTypeId),
                        shiftStyle: this.getShiftStyle(shiftTypeId),

                        shiftDate: shiftDate
                    };

                    this.weekDays[dayIndex].availableShifts.push(shiftData);
                }
            });

        } catch (error) {
            console.error('Error loading available shifts:', error);
        }
    }


    // Get the actual color value for a shift type
    /* getShiftColor(shiftType) {
        if (!shiftType || Object.keys(this.shiftTypeColors).length === 0) {
            return '#0176d3'; // Default blue color
        }
        
        const cleanType = shiftType.trim().toLowerCase();
        const color = this.shiftTypeColors[cleanType] || this.shiftTypeColors['general'] || '#0176d3';
        
        console.log(`Getting color for shift type "${shiftType}" (cleaned: "${cleanType}"): ${color}`);
        return color;
    } */

    // Get CSS class for shift styling
    getShiftCssClass(shiftType) {
        if (!shiftType) {
            return 'shift-card';
        }
        
        const cleanType = shiftType.trim().toLowerCase().replace(/\s+/g, '-');
        return `shift-card shift-${cleanType}`;
    }

    // Event Handlers
    handleMyRosterView() {
        this.navigateToToday();
        this.activeTab = 'myRoster';
        this.myroster = true;
        this.availableShifts = false;
        localStorage.setItem('myRosterTab', 'myRoster');
    }

    handleAvailableShiftsView() {
        this.activeTab = 'availableShifts';
        this.myroster = false;
        this.availableShifts = true;
        localStorage.setItem('myRosterTab', 'availableShifts');
    }

    navigateToToday() {
        this.setCurrentWeek();
        this.isNextDisabled = false;
    }

    navigateToPrevious() {
        this.startDate.setDate(this.startDate.getDate() - 7);
        this.endDate.setDate(this.endDate.getDate() - 7);
        this.fetchHolidays(); // Fetch holidays for new week
        this.updateDateDisplay();
        this.generateWeekDays();
        this.loadShiftData(); 
    }

    navigateToNext() {
        this.startDate.setDate(this.startDate.getDate() + 7);
        this.endDate.setDate(this.endDate.getDate() + 7);
        this.fetchHolidays(); // Fetch holidays for new week
        this.updateDateDisplay();
        this.generateWeekDays();
        this.loadShiftData();  
    }

      navigateToDay(event) {
        const selectedDate = new Date(event.target.value);
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
        
        this.startDate = startOfWeek;
        this.endDate = new Date(startOfWeek);
        this.endDate.setDate(startOfWeek.getDate() + 6);
        this.fetchHolidays(); // Fetch holidays for new week
        this.updateDateDisplay();
        this.generateWeekDays();
        this.loadShiftData();
    }

    updateDateDisplay() {
        this.datePickerString = this.startDate.toISOString().split('T')[0];
        this.formattedCurrentDate = this.formatDisplayDate(this.startDate);
    }

    // Shift Actions
   handleConfirm(event) {
    console.log('🚀 handleConfirm triggered with event:', event);

    // Extract dataset values
    this.RejectId = event.currentTarget.dataset.id;
    console.log('📌 RejectId:', this.RejectId);

    const shiftDateStr = event.currentTarget.dataset.shiftdate;
    console.log('📌 shiftDateStr:', shiftDateStr);

    const status = event.currentTarget.dataset.status;
    console.log('📌 status:', status);

    const timeRange = event.currentTarget.dataset.time || event.currentTarget.dataset.timerange || '';
    console.log('📌 timeRange (raw):', timeRange);

    console.log('🟢 Dataset Values:', {
        id: this.RejectId,
        shiftDateStr,
        status,
        timeRange
    });

    // ✅ Extract start time from timeRange
    let shiftStartTime = '00:00';
    if (timeRange.includes('-')) {
        shiftStartTime = timeRange.split('-')[0].trim();
        console.log('⏰ Extracted start time from range (first part):', shiftStartTime);
    } else if (timeRange.trim() !== '') {
        shiftStartTime = timeRange.trim();
        console.log('⏰ Extracted start time (single value):', shiftStartTime);
    } else {
        console.log('⚠️ No valid time range found; defaulting to 00:00');
    }

    // ✅ Helper function to convert 12-hour format to 24-hour
    function convertTo24Hour(timeStr) {
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return timeStr;
        let [_, hours, minutes, modifier] = match;
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // 🧩 Convert to 24-hour format before combining
    const shiftStartTime24 = convertTo24Hour(shiftStartTime);
    console.log('⏰ Converted 24-hour time:', shiftStartTime24);

    // ✅ Combine date + time in ISO format
    const combinedDateTime = `${shiftDateStr}T${shiftStartTime24}:00`;
    console.log('🧩 Combined DateTime String:', combinedDateTime);

    let shiftDate = new Date(combinedDateTime);
    console.log('⏰ Parsed Shift Date (Local):', shiftDate.toString());

    const now = new Date();
    console.log('⏰ Current Time (Local):', now.toString());

    // ✅ Log overnight shift detection (no date adjustment)
    if (timeRange.includes('-')) {
        const [start, end] = timeRange.split('-').map(t => t.trim());
        console.log('🕑 Start:', start, ' End:', end);
        const start24 = convertTo24Hour(start);
        const end24 = convertTo24Hour(end);
        console.log('🕑 Converted -> Start24:', start24, ' End24:', end24);

        if (end24 < start24) {
            console.log('🌙 Overnight shift detected (ends next day).');
        } else {
            console.log('☀️ Normal shift (same day).');
        }
    }

    // Normalize both dates for past-date check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('📅 Today (start of day):', today);

    const shiftDay = new Date(shiftDate);
    shiftDay.setHours(0, 0, 0, 0);
    console.log('📅 Shift Day (start of day):', shiftDay);

    // Step 1️⃣ - Past date check
    console.log('🧮 Checking if shift day is before today...');
    if (shiftDay < today) {
        console.log('❌ Past date rejection blocked.');
        this.showToast('Error', 'Shifts scheduled for past dates cannot be rejected.', 'error');
        return;
    } else {
        console.log('✅ Shift date is not in the past.');
    }

    // Step 2️⃣ - Shift already started
    console.log('🧮 Checking if shift already started...');
    if (shiftDate <= now) {
        console.log('❌ Shift already started or ended.');
        this.showToast('Error', 'You cannot reject a shift that has already started or ended.', 'error');
        return;
    } else {
        console.log('✅ Shift not started yet.');
    }

    // Step 3️⃣ - Invalid status
    console.log('🧮 Checking shift status...');
    if (status !== 'Accepted') {
        console.log('❌ Invalid status for rejection. Current Status:', status);
        this.showToast('Error', 'You can only reject a shift with Accepted status.', 'error');
        return;
    } else {
        console.log('✅ Valid status (Accepted).');
    }

    // Step 4️⃣ - Accurate 24-hour restriction
    console.log('🧮 Calculating hours difference...');
    const shiftTimeUTC = shiftDate.getTime() - shiftDate.getTimezoneOffset() * 60000;
    const nowUTC = now.getTime() - now.getTimezoneOffset() * 60000;
    const hoursDifference = (shiftTimeUTC - nowUTC) / (1000 * 60 * 60);
    console.log(`🧮 Hours Difference (UTC adjusted): ${hoursDifference.toFixed(2)} hours`);

    if (hoursDifference < 24 && hoursDifference >= 0) {
        console.log('❌ Rejection blocked - shift starts within the next 24 hours.');
        this.showToast('Error', 'Shifts starting within the next 24 hours cannot be rejected.', 'error');
        return;
    } else {
        console.log('✅ Shift is more than 24 hours away.');
    }

    // Step 5️⃣ - Passed all validations
    console.log('✅ All validations passed - opening rejection modal.');
    this.RejectedFlag = true;
    console.log('🎯 RejectedFlag set to:', this.RejectedFlag);
}



    handleRejectedClose() {
        this.RejectedFlag = false;
        this.CommentsFlag = false;
        this.RejectId = '';
        this.comments = '';
    }

    handleComments() {
        this.CommentsFlag = true;
        this.RejectedFlag = false;
    }

    handleCommentsChange(event) {
        this.comments = event.target.value;
    }

    async handleRejected() {
        try {
            await Rejectedshifts({
                shiftStaffId: this.RejectId,
                comments: this.comments
            });
            
            this.showToast('Success', 'Shift rejected successfully', 'success');
            this.handleRejectedClose();
            this.loadShiftData();
            
        } catch (error) {
            console.error('Error rejecting shift:', error);
            this.showToast('Error', 'Failed to reject shift', 'error');
        }
    }

    async onChangehandleallocation(event){   

    //const selectedId = event.currentTarget.dataset.id;
    this.duration = event.currentTarget.dataset.dur;  
    const Shiftdate = event.currentTarget.dataset.shiftdate;
    console.log('shiftdate '+event.currentTarget.dataset.shiftdate);
     console.log('duration '+this.duration);
    console.log('set hours '+ this.setHours);
    console.log('total hours and duration '+(Number(this.totalHours) + Number(this.duration)));
    this.shiftId=event.currentTarget.dataset.id;
    event.currentTarget.dataset.chk=true; 
        
     await this.DocExpiryCheck(this.staffId, Shiftdate);
    if (this.documentExpired) {
         const toggle = this.template.querySelector(`lightning-input[data-id="${this.shiftId}"]`);
        if (toggle) {
            toggle.checked = false;  // flips the UI state immediately
        }
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "You cannot be allocated due to document expiry or a pending/rejected status.",
          variant: "error"
        })
      );
      return;
    }
        
        this.showSpinner=true;
       
       // console.log(ind);
        if((Number(this.totalHours) + Number(this.duration)) <= this.setHours ){
          //this.shiftId=event.currentTarget.dataset.id;
          getAddShiftData({AddShift : this.shiftId}).then(res=>{
            console.log('res ' +JSON.stringify(res));
            console.log( 'Start_Time_Text__c ' + res[0].Start_Time_Text__c);
            console.log( 'End_Time_Text__c ' + res[0].End_Time_Text__c);
        console.log( 'End_Time_Text__c ' + res[0].Start_Date__c);
          console.log( 'staffId ' + this.staffId);
          console.log('')
    
            getOverlappingShiftsData({strtTimeText:res[0].Start_Time_Text__c,endTimeText:res[0].End_Time_Text__c,StaffID:this.staffId,startdate:res[0].Start_Date__c,shiftType:res[0].Shift_Type__c,ShiftwithStaffId:null}).then(result=>{
              console.log('over lapping data ==> '+result);
               this.showSpinner=false;
                    const element = this.template.querySelector('[data-id='+this.shiftId+']'); 
                if (result === 'UNAVAILABLE_CONFLICT') {
                    this.showToast(
                        'Shift Rejected',
                        'Staff is unavailable during the selected time.',
                        'error'
                    );
                    element.checked = false;
                }
                    else if (result === 'SHIFT_CONFLICT') {
                        this.showToast(
                            'Shift Rejected',
                            'Staff already has a shift during this time.',
                            'error'
                        );
                        element.checked = false;
             }
            /*  if(result==true){
              //  this.confirMationMessage('Error','The selected staff already has a shift within the start and end times.','Error');
                const element = this.template.querySelector('[data-id='+this.shiftId+']'); 
                element.checked=false;  
              //event.currentTarget.dataset.chk=false;
              this.showSpinner=false;
          
              this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Shift Rejected',
                    message: 'Unable to assign shift - staff is already allocated during this period.',
                    variant: 'Error'
                })
              );
                
              } */ 
             else{
                console.log('this.shiftId >> ', this.shiftId);
                  this.showSpinner=false;
           handleAllocation({ shiftId:this.shiftId,EOI:false }).then(response=> { 
                console.log('this.shiftId >> ', this.shiftId);
                this.dispatchEvent(   
                  new ShowToastEvent({
                      title: 'Shift Allocated',
                      message: 'Shift allocation completed successfully.',
                      variant: 'success'
                  })
                );
                console.log('this.shiftId >> ', this.shiftId);  
                this.loadAvailableShifts();   
              
              }).catch(error=>{
                
              })
              
              } 
            })
          })
        }
        else{
          //alert('else');
          const element = this.template.querySelector('[data-id='+this.shiftId+']'); 
          element.checked=false;    
         // event.currentTarget.dataset.chk=false;
          this.dispatchEvent(
            new ShowToastEvent({
                title: 'Shift Rejected',
                message: 'You cannot accept this shift as it will exceed your set hours per week. Please contact Roster admin',
                variant: 'error'
            })    
          );      
          this.showSpinner=false;       
         
       //  
       refreshApex(this.daysList);
        }
        refreshApex(this.daysList);
      }

    async onChangehandleinterest(event) {
        const shiftId = event.currentTarget.dataset.id;
        const Shiftdate = event.currentTarget.dataset.shiftdate;

        await this.DocExpiryCheck(this.staffId, Shiftdate);
    if (this.documentExpired) {
         const toggle = this.template.querySelector(`lightning-input[data-id="${shiftId}"]`);
         if (toggle) {
            toggle.checked = false;  // flips the UI state immediately
        }
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "You cannot be allocated due to document expiry or a pending/rejected status.",
          variant: "error"
        })
      );
      return;
    }

        try {
            await handleAllocation({ shiftId: shiftId, EOI: true });
            this.showToast('Success', 'You have expressed interest in this shift', 'success');
            this.loadShiftData();

        } catch (error) {
            console.error('Error expressing interest:', error);
            event.currentTarget.checked = false;
            this.showToast('Error', 'Failed to express interest', 'error');
        }
    }

    // Utility Methods
    formatDate(date) {
        const pad = (num) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    formatShortDate(date) {
        return date.getDate().toString();
    }

    formatDisplayDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }

     async DocExpiryCheck(staffId, checkDateParam) {
    console.log("Parent record Id in addingPreTax: " + staffId);

    const response = await fetchStaff({ recordId: staffId }); // ⏳ wait for Apex
    console.log("staff list after save: " + JSON.stringify(response));
    console.log("response.length: " + Object.keys(response).length);

    let childRec = response.Child_Staffs__r || [];
    this.documentExpired = false; // reset flag
    let checkDate = checkDateParam ? new Date(checkDateParam) : new Date();

    for (let rec of childRec) {
        const isExpired =
            rec.Compliance__c === true &&
            new Date(rec.Expiry_Date__c) < checkDate;

        const isRejected = rec.Status__c === "Rejected";
        const isPending = rec.Status__c === "Pending";

        if (isExpired || isRejected || isPending) {
            this.documentExpired = true;
            break;
        }
    }
  }

    // Getters
    get myRosterTabClass() {
        return this.activeTab === 'myRoster' ? 'active' : '';
    }

    get availableShiftsTabClass() {
        return this.activeTab === 'availableShifts' ? 'active' : '';
    }

    handleRefreshWholePage(){
         this.loadShiftData();
    }
}