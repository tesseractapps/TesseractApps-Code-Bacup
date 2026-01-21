import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import orgDetailsCommunity from "@salesforce/apex/OrgDetails.orgDetailsCommunity";
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import saveMultipleShifts from '@salesforce/apex/ShiftTypeTimings.saveMultipleShifts';
import getShiftsByFacility from '@salesforce/apex/ShiftTypeTimings.getShiftsByFacility';

export default class RosterSettings extends LightningElement {
    @api typeofuser;
    @api isOrgAdmin = false;
    @api facilitylist;
    @api facilityoptions; 
    @track facilityValue = '';
    @track isEdit = false;
    @track isEditShow = true;
    @track isSaving = false;
    @track costPerKmElectric = 0.99;
    @track costPerKmFuel = 0.99;
    @track shifts = [];
    @track shiftsforDesign = [];
    @track templates = [];
    @track activeTab = 'participant';
    @track savebuttonDisable = false;

    

    shiftTypeOptions = [
        { label: 'General', value: 'General' },
        { label: 'Morning', value: 'Morning' },
        { label: 'Afternoon', value: 'Afternoon' },
        { label: 'Night', value: 'Night' },
        { label: 'Sleepover Shift', value: 'Sleepover Shift' },
    ];

    shiftTypeOptionsforCustom = [
        { label: 'Morning', value: 'Morning' },
        { label: 'Afternoon', value: 'Afternoon' },
        { label: 'Night', value: 'Night' },
        { label: 'Sleepover Shift', value: 'Sleepover Shift' },
    ];

    colorOptions = [
        { label: 'Light Red', value: '#FFADAD' },
        { label: 'Light Orange', value: '#FFD6A5' },
        { label: 'Light Yellow', value: '#FDFFB6' },
        { label: 'Light Green', value: '#CAFFBF' },
        { label: 'Light Blue', value: '#9BF6FF' },
        { label: 'Pale Blue', value: '#A0C4FF' },
        { label: 'Lavender', value: '#DDD8FF' },
        { label: 'Light Pink', value: '#FFC6FF' },
        { label: 'Light Beige', value: '#FDE8B3' },
        { label: 'Light Aqua', value: '#C6EAED' },
        { label: 'Soft Yellow', value: '#E4E87E' },
        { label: 'Magenta Pink', value: '#AE016A' },
        { label: 'Vibrant Blue', value: '#0C7CEC' },
        { label: 'Burnt Orange', value: '#D35701' },
        { label: 'Deep Navy', value: '#0E185F' },
        { label: 'Teal Green', value: '#0D815C' }
    ];

    get isParticipantView() {
        return this.activeTab === 'participant';
    }

    get isStaffView() {
        return this.activeTab === 'staff';
    }

    get participantTabClass() {
        return this.activeTab === 'participant' 
            ? 'tab-button active-tab' 
            : 'tab-button inactive-tab';
    }

    get staffTabClass() {
        return this.activeTab === 'staff' 
            ? 'tab-button active-tab' 
            : 'tab-button inactive-tab';
    }

    handleParticipantTab() {
        this.activeTab = 'participant';
    }

    handleStaffTab() {
        this.activeTab = 'staff';
    }

    connectedCallback() {
        console.log('CONNECTED CALLBACK');
        console.log('typeofuser ' + this.typeofuser);
        console.log('facility options ' + JSON.stringify(this.facilityoptions));
        
        this.isOrgAdmin = this.typeofuser === 'NDIS Org Admin';
        
        if (this.facilityoptions && this.facilityoptions.length > 0) {
            this.facilityValue = this.facilityoptions[0].value;
            console.log('this.facilityValue >>', this.facilityValue);
            if (this.facilityValue) {
                console.log('this.facilityValue >>', this.facilityValue);
                this.loadFacilityData();
            }
        }

        if (this.isOrgAdmin) {
            this.loadOrgData();
        }
        this.initializeTemplates();
    }

    loadOrgData() {
        orgDetailsCommunity()
            .then(result => {
                console.log('org data:', JSON.stringify(result));
                this.costPerKmElectric = result.Cost_per_Km_Electric__c || 0.99;
                this.costPerKmFuel = result.Cost_per_Km_Fuel__c || 0.99;
            }).catch(error => {
                this.handleError(error);
            });
    }

    loadFacilityData() {
        console.log("🚀 [loadFacilityData] START");
        console.log("📌 facilityValue:", this.facilityValue);

        if (!this.facilityValue) {
            console.warn("⚠️ No facilityValue provided, exiting loadFacilityData.");
            return;
        }

        Promise.all([
            getfacilityById({ facId: this.facilityValue }),
            getShiftsByFacility({ facilityId: this.facilityValue })
        ])
        .then(([facilityResult, shiftsResult]) => {
            console.log("✅ [loadFacilityData] Facility result:", JSON.stringify(facilityResult));
            console.log("✅ [loadFacilityData] Shifts result:", JSON.stringify(shiftsResult));

            // Update cost information
            this.costPerKmElectric = facilityResult.Cost_per_Km_Electric__c || 0,99;
            this.costPerKmFuel = facilityResult.Cost_per_Km_Fuel__c || 0.99;
            console.log(`💰 costPerKmElectric: ${this.costPerKmElectric}, costPerKmFuel: ${this.costPerKmFuel}`);

            if (shiftsResult && shiftsResult.length > 0) {
                // Separate by type
                const defaultAndOwnShifts = shiftsResult.filter(s => s.Type_of_Shift__c !== 'Custom');
                const customShifts = shiftsResult.filter(s => s.Type_of_Shift__c === 'Custom');

                // Process separately
                this.updateShiftsWithSalesforceData(defaultAndOwnShifts);
                if(customShifts && customShifts.length > 0){
                    this.updateCustomShiftsWithSalesforceData(customShifts);
                } else{
                    this.templates = this.getDefaultShiftsforCustom();
                }

            } else {
                console.warn("⚠️ No shifts returned from Salesforce.");
                this.shifts = this.getDefaultShifts();
                this.shiftsforDesign = this.getDefaultShiftsforOwn();
                this.templates = this.getDefaultShiftsforCustom();
                console.log("✅ Default Shifts Assigned:", JSON.parse(JSON.stringify(this.shifts)));
            }

            console.log("🏁 [loadFacilityData] END");
        })
        .catch(error => {
            console.error("❌ [loadFacilityData] Error:", error);
            this.handleError(error);
        });
    }


    /* updateShiftsWithSalesforceData(salesforceShifts) {
        console.log("🚀 [updateShiftsWithSalesforceData] START");
        console.log("📌 Incoming Salesforce Shifts:", JSON.parse(JSON.stringify(salesforceShifts)));

        // Initialize arrays for separation
        this.shifts = [];
        this.shiftsforDesign = [];

        if (!salesforceShifts || salesforceShifts.length === 0) {
            console.warn("⚠️ No Salesforce shifts found. Loading default shifts...");
            this.shifts = this.getDefaultShifts();
            this.shiftsforDesign = this.getDefaultShiftsforOwn();
            console.log("✅ Default Shifts Assigned:", JSON.parse(JSON.stringify(this.shifts)));
            return;
        }

        salesforceShifts.forEach((sfShift, index) => {
            console.log(`➡️ Processing Shift [${index + 1}/${salesforceShifts.length}]:`, JSON.parse(JSON.stringify(sfShift)));

            let localShift = {
                salesforceId: sfShift.Id,
                name: sfShift.Name || '',
                shiftType: sfShift.Shift_Type__c || '',
                color: sfShift.Colour__c || '#ccc',
                colorStyle: `background-color: ${sfShift.Colour__c || '#ccc'}; width: 25px; height: 25px; border: 1px solid #ccc;`
            };

            // Start Time
            const rawStart = sfShift.Start_Time__c || 0; // default to 0 if null/undefined
            console.log(`⏰ Raw Start Time: ${rawStart}`);
            localShift.startTime24 = rawStart;
            localShift.displayedStartTime = this.convertTo12HourFormat(rawStart);
            const startParts = this.splitTimeParts(localShift.displayedStartTime);
            localShift.startHour = startParts.hour;
            localShift.startMinute = startParts.minute;
            localShift.startAMPM = startParts.period;

            // End Time
            const rawEnd = sfShift.End_Time__c || 0;
            console.log(`⏰ Raw End Time: ${rawEnd}`);
            localShift.endTime24 = rawEnd;
            localShift.displayedEndTime = this.convertTo12HourFormat(rawEnd);
            const endParts = this.splitTimeParts(localShift.displayedEndTime);
            localShift.endHour = endParts.hour;
            localShift.endMinute = endParts.minute;
            localShift.endAMPM = endParts.period;

            // Push into respective array
            if (sfShift.Type_of_Shift__c === 'Default') {
                this.shifts.push(localShift);
            } else if (sfShift.Type_of_Shift__c === 'Own') {
                this.shiftsforDesign.push(localShift);
            }

            console.log("📦 Local Shift Created:", JSON.parse(JSON.stringify(localShift)));
        });
        if(!this.shifts || this.shifts.length === 0){
            this.shifts = this.getDefaultShifts();
        } else if(!this.shiftsforDesign || this.shiftsforDesign.length === 0 ){
            this.shiftsforDesign = this.getDefaultShiftsforOwn();
        }

        console.log("✅ Final Default Shifts:", JSON.parse(JSON.stringify(this.shifts)));
        console.log("✅ Final Own Shifts:", JSON.parse(JSON.stringify(this.shiftsforDesign)));
        console.log("🏁 [updateShiftsWithSalesforceData] END");
    } */

    updateShiftsWithSalesforceData(salesforceShifts) {
        console.log("🚀 [updateShiftsWithSalesforceData] START");
        console.log("📌 Incoming Salesforce Shifts:", JSON.parse(JSON.stringify(salesforceShifts)));

        // Initialize arrays for separation
        this.shifts = [];
        this.shiftsforDesign = [];

        if (!salesforceShifts || salesforceShifts.length === 0) {
            console.warn("⚠️ No Salesforce shifts found. Loading default shifts...");
            this.shifts = this.getDefaultShifts();
            this.shiftsforDesign = this.getDefaultShiftsforOwn();
            console.log("✅ Default Shifts Assigned:", JSON.parse(JSON.stringify(this.shifts)));
            return;
        }

        salesforceShifts.forEach((sfShift, index) => {
            console.log(`➡️ Processing Shift [${index + 1}/${salesforceShifts.length}]:`, JSON.parse(JSON.stringify(sfShift)));

            let localShift = {
                salesforceId: sfShift.Id || null,
                isSalesforceRecord: !!sfShift.Id, // ✅ true if salesforceId exists
                name: sfShift.Name || '',
                shiftType: sfShift.Shift_Type__c || '',
                color: sfShift.Colour__c || '#ccc',
                colorStyle: `background-color: ${sfShift.Colour__c || '#ccc'}; width: 25px; height: 25px; border: 1px solid #ccc;`
            };

            // Start Time
            const rawStart = sfShift.Start_Time__c || 0;
            localShift.startTime24 = rawStart;
            localShift.displayedStartTime = this.convertTo12HourFormat(rawStart);
            const startParts = this.splitTimeParts(localShift.displayedStartTime);
            localShift.startHour = startParts.hour;
            localShift.startMinute = startParts.minute;
            localShift.startAMPM = startParts.period;

            // End Time
            const rawEnd = sfShift.End_Time__c || 0;
            localShift.endTime24 = rawEnd;
            localShift.displayedEndTime = this.convertTo12HourFormat(rawEnd);
            const endParts = this.splitTimeParts(localShift.displayedEndTime);
            localShift.endHour = endParts.hour;
            localShift.endMinute = endParts.minute;
            localShift.endAMPM = endParts.period;

            // Push into respective array
            if (sfShift.Type_of_Shift__c === 'Default') {
                this.shifts.push(localShift);
            } else if (sfShift.Type_of_Shift__c === 'Own') {
                this.shiftsforDesign.push(localShift);
            }

            console.log("📦 Local Shift Created:", JSON.parse(JSON.stringify(localShift)));
        });

        // Fallback defaults if empty
        if (!this.shifts || this.shifts.length === 0) {
            this.shifts = this.getDefaultShifts();
        }
        if (!this.shiftsforDesign || this.shiftsforDesign.length === 0) {
            this.shiftsforDesign = this.getDefaultShiftsforOwn();
        }

        console.log("✅ Final Default Shifts:", JSON.parse(JSON.stringify(this.shifts)));
        console.log("✅ Final Own Shifts:", JSON.parse(JSON.stringify(this.shiftsforDesign)));
        console.log("🏁 [updateShiftsWithSalesforceData] END");
    }

    updateCustomShiftsWithSalesforceData(customShifts) {
        console.log("🚀 [updateCustomShiftsWithSalesforceData] START");

        this.templates = [];

        if (customShifts && customShifts.length > 0) {
            customShifts.forEach(sfShift => {
                const mappedShifts = (sfShift.Custom_Shift_Timings__r || []).map(t => {
                    const startDisplay = this.convertTo12HourFormat(t.Start_Time__c || 0);
                    const startParts = this.splitTimeParts(startDisplay);
                    const endDisplay = this.convertTo12HourFormat(t.End_Time__c || 0);
                    const endParts = this.splitTimeParts(endDisplay);

                    return {
                        id: t.Id,
                        salesforceId:t.Id,
                        isSalesforceRecord: t.Id,
                        name: t.Name || '',
                        type: t.Shift_Type__c || '',
                        startTime: t.Start_Time__c,
                        endTime: t.End_Time__c,
                        displayIndex: t.Index__c || 1,
                        startHour: startParts.hour,
                        startMinute: startParts.minute,
                        startAMPM: startParts.period,
                        startTime24: t.Start_Time__c,
                        displayedStartTime: startDisplay,
                        endHour: endParts.hour,
                        endMinute: endParts.minute,
                        endAMPM: endParts.period,
                        endTime24: t.End_Time__c,
                        displayedEndTime: endDisplay,
                        
                    };
                });

                this.templates.push({
                    id: sfShift.Id,
                    salesforceId: sfShift.Id,
                    isSalesforceRecord: !!sfShift.Id,
                    customShiftName: sfShift.Name || '',
                    shiftType: "Custom",
                    startTime24: sfShift.Start_Time__c || 0,
                    endTime24: sfShift.End_Time__c || 0,
                    shifts: mappedShifts,
                    Facility__c: this.facilityValue,
                    showAddButton: mappedShifts.length < 4,
                    color: sfShift.Colour__c || '#ccc',
                    colorStyle: `background-color: ${sfShift.Colour__c || '#ccc'}; width: 25px; height: 25px; border: 1px solid #ccc;`,
                    selectedColor: sfShift.Colour__c || '#ccc',
                });
            });
        } else {
            console.warn("⚠️ No Custom Shifts found from Salesforce.");
        }

        /* // Optionally append a new blank template for user creation
        const newCustomId = Date.now().toString();
        this.templates.push({
            id: newCustomId,
            customShiftName: "",
            shiftType: "Custom",
            shifts: [], // start empty so the UI's Add Shift button can populate
            Facility__c: this.facilityValue,
            showAddButton: true
        }); */

        console.log("📦 Updated templates array:", JSON.parse(JSON.stringify(this.templates)));
        console.log("🏁 [updateCustomShiftsWithSalesforceData] END");
    }

    // Default shifts generator
    getDefaultShifts() {
        const to24HourTime = (hour, minute, ampm) => {
            let h = parseInt(hour, 10);
            let m = parseInt(minute, 10);

            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;

            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;
        };

        return [
            {
                salesforceId: null,
                name: 'General',
                shiftType: 'General',
                startHour: '9',
                startMinute: '00',
                startAMPM: 'AM',
                displayedStartTime: '09:00 AM',
                startTime24: to24HourTime('9', '00', 'AM'),
                endHour: '5',
                endMinute: '00',
                endAMPM: 'PM',
                displayedEndTime: '05:00 PM',
                endTime24: to24HourTime('5', '00', 'PM'),
                color: '#AE016A',
                colorStyle: 'background-color: #AE016A; width: 25px; height: 25px; border: 1px solid #ccc;'
            },
            {
                salesforceId: null,
                name: 'Morning',
                shiftType: 'Morning',
                startHour: '6',
                startMinute: '00',
                startAMPM: 'AM',
                displayedStartTime: '06:00 AM',
                startTime24: to24HourTime('6', '00', 'AM'),
                endHour: '2',
                endMinute: '00',
                endAMPM: 'PM',
                displayedEndTime: '02:00 PM',
                endTime24: to24HourTime('2', '00', 'PM'),
                color: '#0C7CEC',
                colorStyle: 'background-color: #0C7CEC; width: 25px; height: 25px; border: 1px solid #ccc;'
            },
            {
                salesforceId: null,
                name: 'Afternoon',
                shiftType: 'Afternoon',
                startHour: '2',
                startMinute: '00',
                startAMPM: 'PM',
                displayedStartTime: '02:00 PM',
                startTime24: to24HourTime('2', '00', 'PM'),
                endHour: '10',
                endMinute: '00',
                endAMPM: 'PM',
                displayedEndTime: '10:00 PM',
                endTime24: to24HourTime('10', '00', 'PM'),
                color: '#D35701',
                colorStyle: 'background-color: #D35701; width: 25px; height: 25px; border: 1px solid #ccc;'
            },
            {
                salesforceId: null,
                name: 'Night',
                shiftType: 'Night',
                startHour: '10',
                startMinute: '00',
                startAMPM: 'PM',
                displayedStartTime: '10:00 PM',
                startTime24: to24HourTime('10', '00', 'PM'),
                endHour: '6',
                endMinute: '00',
                endAMPM: 'AM',
                displayedEndTime: '06:00 AM',
                endTime24: to24HourTime('6', '00', 'AM'),
                color: '#0E185F',
                colorStyle: 'background-color: #0E185F; width: 25px; height: 25px; border: 1px solid #ccc;'
            },
            {
                salesforceId: null,
                name: 'Sleepover Shift',
                shiftType: 'Sleepover Shift',
                startHour: '10',
                startMinute: '00',
                startAMPM: 'PM',
                displayedStartTime: '10:00 AM', // check if this should be PM
                startTime24: to24HourTime('10', '00', 'PM'),
                endHour: '8',
                endMinute: '00',
                endAMPM: 'AM',
                displayedEndTime: '08:00 AM',
                endTime24: to24HourTime('8', '00', 'AM'),
                color: '#0D815C',
                colorStyle: 'background-color: #0D815C; width: 25px; height: 25px; border: 1px solid #ccc;'
            }
        ];
    }

    getDefaultShiftsforOwn(){
        const to24HourTime = (hour, minute, ampm) => {
            let h = parseInt(hour, 10);
            let m = parseInt(minute, 10);

            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;

            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;
        };

        return [
            { 
                id: Date.now(),
                salesforceId: null,
                name: '',
                shiftType: '',
                startHour: '12',
                startMinute: '00',
                startAMPM: 'AM',
                displayedStartTime: 'Select Time',
                startTime24: to24HourTime('12', '00', 'AM'),
                endHour: '12',
                endMinute: '00',
                endAMPM: 'AM',
                displayedEndTime: 'Select Time',
                endTime24: to24HourTime('12', '00', 'AM'),
                color: '',
                colorStyle: 'background-color: #ccc; width: 25px; height: 25px; border: 1px solid #ccc;'
            }
        ];
    }

    getDefaultShiftsforCustom() {
        const newId = Date.now().toString(); // Generate unique template ID

        // Return an array with a single default template
        return [
            {
                id: newId,
                customShiftName: '',
                customShiftindex: 1,
                shifts: this.generateDefaultShifts(newId),
                Facility__c: this.facilityValue,
                selectedColor: null,
                colorStyle: 'background-color: #eee; width: 25px; height: 25px; border: 1px solid #ccc;',
                showAddButton: false, // Since always exactly 4 shifts
                showMessage: false,
                message: '',
                messageClass: '',
                messageIcon: ''
            }
        ];
    }

    // Helper to generate 4 empty shifts for a new template
    generateDefaultShifts(templateId) {
        let shifts = [];
        for (let i = 1; i <= 4; i++) {
            shifts.push({
                id: `${templateId}-${i}`,
                name: '',
                type: '',
                startTime: '',
                endTime: '',
                displayIndex: i
            });
        }
        return shifts;
    }

    handleFacilityChnage(event) {
        console.log('facility change ' + event.target.value);
        this.facilityValue = event.target.value;
        if (this.facilityValue) {
            this.loadFacilityData();
        }
    }

    handleStartTimeChange(event) {
        const localId = event.target.dataset.id; // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const displayTime = event.detail.displaytime;
        const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
        const timeDetails = this.splitTimeParts(displayTime);

        let shift;
        if (salesforceId) {
            shift = this.shifts.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shifts.find(s => s.id === localId);
        }

        if (shift) {
            shift.startHour = timeDetails.hour;
            shift.startMinute = timeDetails.minute;
            shift.startAMPM = timeDetails.period;
            shift.startTime24 = converted24;
            shift.displayedStartTime = displayTime;
            this.clearShiftMessage(shift);
        }
    }

    handleEndTimeChange(event) {
        const localId = event.target.dataset.id; // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const displayTime = event.detail.displaytime;
        const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
        const timeDetails = this.splitTimeParts(displayTime);

        let shift;
        if (salesforceId) {
            shift = this.shifts.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shifts.find(s => s.id === localId);
        }

        if (shift) {
            shift.endHour = timeDetails.hour;
            shift.endMinute = timeDetails.minute;
            shift.endAMPM = timeDetails.period;
            shift.endTime24 = converted24;
            shift.displayedEndTime = displayTime;
            this.clearShiftMessage(shift);
        }
    }

    handleColorChange(event) {
        const localId = event.target.dataset.id; // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const newColor = event.target.value;

        let shift;
        if (salesforceId) {
            shift = this.shifts.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shifts.find(s => s.id === localId);
        }

        if (shift) {
            shift.color = newColor;
            shift.colorStyle = `background-color: ${newColor}; width: 25px; height: 25px; border: 1px solid #fffff;`;
            this.clearShiftMessage(shift);
        }
    }

    handleShiftTypeChange(event) {
        const localId = event.target.dataset.id; // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const value = event.target.value;

        let shift;
        if (salesforceId) {
            shift = this.shifts.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shifts.find(s => s.id === localId);
        }

        if (shift) {
            shift.shiftType = value;
            this.clearShiftMessage(shift);
        }
    }

    handleNameChangeforDesign(event) {
        const localId = event.target.dataset.id; // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const value = event.target.value;

        let shift;
        if (salesforceId) {
            shift = this.shiftsforDesign.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shiftsforDesign.find(s => String(s.id) === String(localId));
        }

        if (shift) {
            shift.name = value;
            this.clearShiftMessage(shift);
        }
    }

    handleColorChangeDesign(event) {
        console.log('🎨 Color change triggered');
        const id = event.target.dataset.id;
        console.log('🆔 Shift ID from dataset:', id);
        console.log('🎯 New Color Value from picker:', event.target.value);

        const index = this.shifts.findIndex(s => s.id === id);
        console.log('🔍 Found Shift Index:', index);

        if (index !== -1) {
            console.log('✅ Shift Found:', JSON.parse(JSON.stringify(this.shifts[index])));

            const updatedShift = { 
                ...this.shifts[index],
                color: event.target.value,
                colorStyle: `background-color: ${event.target.value}; width: 25px; height: 25px; border: 1px solid #ffffff;`
            };
            console.log('🆕 Updated Shift Object:', JSON.parse(JSON.stringify(updatedShift)));

            this.shifts = [
                ...this.shifts.slice(0, index),
                updatedShift,
                ...this.shifts.slice(index + 1)
            ];
            console.log('📦 Updated Shifts Array:', JSON.parse(JSON.stringify(this.shifts)));

            this.clearShiftMessage(updatedShift);
            console.log('🧹 clearShiftMessage called for shift ID:', updatedShift.id);
        } else {
            console.warn('⚠️ No shift found with ID:', id);
        }
    }

    handleAddShift() {

        const to24HourTime = (hour, minute, ampm) => {
            let h = parseInt(hour, 10);
            let m = parseInt(minute, 10);

            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;

            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;
        };

        const newShift = {
            id: Date.now(),
            salesforceId: null,
            name: '',
            shiftType: '',
            startHour: '12',
            startMinute: '00',
            startAMPM: 'AM',
            displayedStartTime: 'Select Time',
            startTime24: to24HourTime('12', '00', 'AM'),
            endHour: '12',
            endMinute: '00',
            endAMPM: 'AM',
            displayedEndTime: 'Select Time',
            endTime24: to24HourTime('12', '00', 'AM'),
            color: '',
            colorStyle: 'background-color: #ccc; width: 25px; height: 25px; border: 1px solid #ccc;'
        };
        this.shiftsforDesign = [...this.shiftsforDesign, newShift];
    }


    handleNameChange(event) {
        const localId = String(event.target.dataset.id); // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const value = event.target.value;

        let shift;
        if (salesforceId) {
            shift = this.shifts.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shifts.find(s => s.id === localId);
        }

        if (shift) {
            shift.name = value;
            this.updateShiftField(shift.id || shift.salesforceId, 'name', value);
        }
    }


    handleTypeChange(event) {
        const shiftId = event.target.dataset.id;
        const salesforceId = event.target.dataset.salesforceid;
        const newValue = event.target.value;

        console.log(`📝 Type changed for shiftId: ${shiftId}, salesforceId: ${salesforceId} => ${newValue}`);

        this.shiftsforDesign = this.shiftsforDesign.map(shift => {
            const matchById = shift.id && shiftId ? String(shift.id) === String(shiftId) : false;
            const matchBySFId = shift.salesforceId && salesforceId ? String(shift.salesforceId) === String(salesforceId) : false;

            if (matchById || matchBySFId) {
                return { 
                    ...shift, 
                    shiftType: newValue 
                };
            }
            return shift;
        });

        console.log("🎯 Final shiftsforDesign after type change:", JSON.parse(JSON.stringify(this.shiftsforDesign)));
    }

    handleStartTimeChangeforDesign(event) {
        const localId = event.target.dataset.id; // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const displayTime = event.detail.displaytime; // ✅ Correct property name
        const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());

        let shift;
        if (salesforceId) {
            shift = this.shiftsforDesign.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shiftsforDesign.find(s => String(s.id) === String(localId));
        }

        if (shift) {
            const timeDetails = this.splitTimeParts(displayTime);

            shift.startHour = timeDetails.hour;
            shift.startMinute = timeDetails.minute;
            shift.startAMPM = timeDetails.period;
            shift.startTime24 = converted24;
            shift.displayedStartTime = displayTime;

            this.clearShiftMessage(shift);
        }
    }


    handleEndTimeChangeforDesign(event) {
        const localId = event.target.dataset.id; // For create
        const salesforceId = event.target.dataset.salesforceid; // For update
        const displayTime = event.detail.displaytime; // ✅ correct property name
        const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
        let shift;
        if (salesforceId) {
            shift = this.shiftsforDesign.find(s => s.salesforceId === salesforceId);
        } else if (localId) {
            shift = this.shiftsforDesign.find(s => String(s.id) === String(localId));
        }

        if (shift) {
            const timeDetails = this.splitTimeParts(displayTime);

            shift.endHour = timeDetails.hour;
            shift.endMinute = timeDetails.minute;
            shift.endAMPM = timeDetails.period;
            shift.endTime24 = converted24;
            shift.displayedEndTime = displayTime;

            this.clearShiftMessage(shift);
        }
    }


    convert12HourTimeToUTCString(time12h) {
        const parts = this.splitTimeParts(time12h); // { hour, minute, period }
        let hour24 = parseInt(parts.hour, 10);

        if (parts.period === 'PM' && hour24 !== 12) hour24 += 12;
        if (parts.period === 'AM' && hour24 === 12) hour24 = 0;

        // Ensure 2-digit formatting
        const hourStr = hour24.toString().padStart(2, '0');
        const minuteStr = parts.minute.padStart(2, '0');

        return `${hourStr}:${minuteStr}:00.000Z`;
    }



    /* handleColorChange1(event) {
        const shiftId = event.target.name;
        const newColor = event.detail.value;

        console.log("🎨 [handleColorChange1] START");
        console.log("📌 Shift ID from event:", shiftId);
        console.log("📌 New color from combobox:", newColor);

        this.shiftsforDesign = this.shiftsforDesign.map(shift => {
            console.log("🔍 Checking shift:", JSON.parse(JSON.stringify(shift)));
            console.log("shift.id:", shift.id, "| shift.salesforceId:", shift.salesforceId);
            console.log("📌 Shift ID from event:", shiftId);

            if (String(shift.id) === String(shiftId) || String(shift.salesforceId) === String(shiftId)) {
                console.log("🎯 Match found! Updating color...");
                const updatedShift = {
                    ...shift,
                    color: newColor,
                    colorStyle: `background-color: ${newColor}; width: 25px; height: 25px; border: 1px solid #ccc;`
                };
                console.log("✅ Updated shift:", JSON.parse(JSON.stringify(updatedShift)));
                return updatedShift;
            }

            return shift;
        });

        console.log("🎯 Final shiftsforDesign after color change:", JSON.parse(JSON.stringify(this.shiftsforDesign)));
        console.log("🏁 [handleColorChange1] END");
    } */
    handleColorChange1(event) {
        const shiftId = event.target.dataset.id;
        const salesforceId = event.target.dataset.salesforceid;
        const newColor = event.detail.value;

        console.log("🎨 [handleColorChange1] START");
        console.log("📌 Shift ID from event:", shiftId);
        console.log("📌 Salesforce ID from event:", salesforceId);
        console.log("📌 New color from combobox:", newColor);

        this.shiftsforDesign = this.shiftsforDesign.map(shift => {
            // Determine the correct key to match
            const matchById = shift.id && shiftId ? String(shift.id) === String(shiftId) : false;
            const matchBySFId = shift.salesforceId && salesforceId ? String(shift.salesforceId) === String(salesforceId) : false;

            if (matchById || matchBySFId) {
                const updatedShift = {
                    ...shift,
                    color: newColor,
                    colorStyle: `background-color: ${newColor}; width: 25px; height: 25px; border: 1px solid #ccc;`
                };
                console.log("✅ Updated shift:", JSON.parse(JSON.stringify(updatedShift)));
                return updatedShift;
            }

            return shift;
        });

        console.log("🎯 Final shiftsforDesign after color change:", JSON.parse(JSON.stringify(this.shiftsforDesign)));
        console.log("🏁 [handleColorChange1] END");
    }


    updateShiftField(id, field, value) {
        this.shiftsforDesign = this.shiftsforDesign.map(shift => {
            if (String(shift.id) === id) {
                return { ...shift, [field]: value };
            }
            return shift;
        });x

        
    }

    handleSaveAllShifts() {
        console.log('🚀 Starting handleSaveAllShifts');
        console.log('📌 Current shifts:', JSON.parse(JSON.stringify(this.shifts)));
        console.log('📌 Current shifts for own Shifts:', JSON.parse(JSON.stringify(this.shiftsforDesign)));
        console.log('📌 Current Custom Shifts:', JSON.parse(JSON.stringify(this.templates)));

        // ✅ Remove completely empty Own Shifts
        this.shiftsforDesign = this.shiftsforDesign.filter(shift => {
            const isNameEmpty = !shift.name || shift.name.trim() === "";
            const isTypeEmpty = !shift.shiftType || shift.shiftType.trim() === "";
            const isColorEmpty = !shift.color || shift.color.trim() === "";

            // keep the shift if NOT (all three are empty)
            return !(isNameEmpty && isTypeEmpty && isColorEmpty);
        });

        console.log("📌 Cleaned shiftsforDesign:", JSON.parse(JSON.stringify(this.shiftsforDesign)));

        console.log('this.isStaffView >>', this.isStaffView);
        if(this.isStaffView == false){
            // ✅ Validation for all three lists
            const invalidShifts = this.shifts.filter(s => !this.validateShift(s));
            const invalidShiftsOwn = this.shiftsforDesign.filter(s => !this.validateShift(s));

            if (invalidShifts.length > 0 || invalidShiftsOwn.length > 0) {
                console.warn('❌ Validation failed for some shifts.');
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Validation Error',
                        message: 'Please fill in all required fields for all shifts.',
                        variant: 'error'
                    })
                );
                return;
            }
        }

        this.isSaving = true;
        console.log('🔄 isSaving set to true');

        // ✅ Clear previous messages for all shifts
        [...this.shifts, ...this.shiftsforDesign, ...this.templates].forEach(shift => this.clearShiftMessage(shift));

        // ✅ Prepare all three lists
        const shiftsToSave = this.shifts.map(s => this.prepareShiftForSave(s));
        const shiftsToSaveOwn = this.shiftsforDesign.map(s => this.prepareShiftForSave(s));

        console.log('📤 Sending Default shifts to Apex:', JSON.parse(JSON.stringify(shiftsToSave)));
        console.log('📤 Sending Own shifts to Apex:', JSON.parse(JSON.stringify(shiftsToSaveOwn)));
        console.log('📤 Sending Custom shifts to Apex (raw):', JSON.stringify(this.templates));

        // ✅ Filter out empty custom templates AND empty child shifts
        const cleanedTemplates = this.templates
            // keep templates that have at least one non-empty shift
            .filter(template => template.shifts.some(shift =>
                (shift.startTime && shift.startTime !== "") ||
                (shift.endTime && shift.endTime !== "") ||
                (shift.type && shift.type.trim() !== "") ||
                (shift.name && shift.name.trim() !== "")
            ))
            // clean child shifts
            .map(template => {
                const cleanedShifts = template.shifts.filter(shift =>
                    (shift.startTime && shift.startTime !== "") ||
                    (shift.endTime && shift.endTime !== "") ||
                    (shift.type && shift.type.trim() !== "") ||
                    (shift.name && shift.name.trim() !== "")
                );

                // Debug: show removed child shifts
                const removed = template.shifts.filter(s =>
                    !((s.startTime && s.startTime !== "") ||
                    (s.endTime && s.endTime !== "") ||
                    (s.type && s.type.trim() !== ""))
                );
                if (removed.length > 0) {
                    console.log(`🗑️ Removed empty child shifts from template ${template.id || template.salesforceId}:`, removed);
                }

                return {
                    ...template,
                    shifts: cleanedShifts
                };
            });

        console.log('📤 Cleaned Custom shifts to Apex:', JSON.stringify(cleanedTemplates));

        saveMultipleShifts({
            shiftsData: shiftsToSave,
            shiftsDataforown: shiftsToSaveOwn,
            shiftsDataforcustom: cleanedTemplates,
            costPerKmElectric: this.costPerKmElectric,
            costPerKmFuel: this.costPerKmFuel,
            facilityId: this.facilityValue
        })
        .then(results => {
            console.log('✅ Apex saveMultipleShifts result:', JSON.parse(JSON.stringify(results)));

            const totalDefault = this.shifts.length;
            const totalOwn = this.shiftsforDesign.length;

            results.forEach((result, index) => {
                if (result && result.Id) {
                    if (index < totalDefault) {
                        // Default shift
                        this.shifts[index].salesforceId = result.Id;
                        this.showShiftMessage(this.shifts[index], 'Saved successfully!', 'success');
                        console.log('📤 Saved Default shifts:', JSON.stringify(this.shifts));
                    } else if (index < totalDefault + totalOwn) {
                        // Own shift
                        const ownIndex = index - totalDefault;
                        this.shiftsforDesign[ownIndex].salesforceId = result.Id;
                        this.showShiftMessage(this.shiftsforDesign[ownIndex], 'Saved successfully!', 'success');
                        console.log('📤 Saved Own shifts:', JSON.stringify(this.shiftsforDesign));
                    } else {
                        // Custom shift
                        const customIndex = index - totalDefault - totalOwn;
                        this.templates[customIndex].salesforceId = result.Id;
                        this.showShiftMessage(this.templates[customIndex], 'Saved successfully!', 'success');
                        console.log('📤 Saved Custom shifts:', JSON.stringify(this.templates));
                    }
                }
            });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'All shifts saved successfully!',
                    variant: 'success'
                })
            );
            this.dispatchEvent(new CustomEvent("rostersettingsbackbutton"));
        })
        .catch(error => {
            console.error('🔥 Error saving multiple shifts:', error);
            [...this.shifts, ...this.shiftsforDesign, ...this.templates].forEach(shift => {
                this.showShiftMessage(shift, 'Error saving shift. Please try again.', 'error');
            });
            this.handleError(error);
        })
        .finally(() => {
            this.isSaving = false;
            console.log('🏁 Save process completed. isSaving set to false.');
        });
    }

    prepareShiftForSave(shift) {
        return {
            Id: shift.salesforceId,
            Name: shift.name,
            Shift_Type__c: shift.shiftType,
            Start_Time__c: shift.startTime24,
            End_Time__c: shift.endTime24,
            Color__c: shift.color,
            Facility__c: this.facilityValue
        };
    }

    validateShift(shift) {
        const startTimeMs = this.getMsFromParts(shift.startHour, shift.startMinute, shift.startAMPM);
        console.log('startTimeMs >>', startTimeMs);
        const endTimeMs   = this.getMsFromParts(shift.endHour, shift.endMinute, shift.endAMPM);
        console.log('endTimeMs >>', endTimeMs);

        return shift.name &&
            shift.shiftType &&
            startTimeMs >= 0 &&
            endTimeMs >= 0 &&
            shift.color &&
            this.facilityValue;
    }

    getMsFromParts(hour, minute, ampm) {
        if (hour == null || minute == null) return null;
        let h = parseInt(hour, 10);
        const m = parseInt(minute, 10) || 0;

        // Convert 12-hour clock to 24-hour
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        return (h * 60 + m) * 60 * 1000;
    }

    showShiftMessage(shift, message, type) {
        shift.showMessage = true;
        shift.message = message;
        shift.messageClass = `slds-m-top_small slds-text-body_small ${type === 'success' ? 'slds-text-color_success' : 'slds-text-color_error'}`;
        shift.messageIcon = type === 'success' ? 'utility:success' : 'utility:error';
        
        // Auto-hide message after 3 seconds
        setTimeout(() => {
            this.clearShiftMessage(shift);
        }, 3000);
    }

    clearShiftMessage(shift) {
        shift.showMessage = false;
        shift.message = '';
        shift.messageClass = '';
        shift.messageIcon = '';
    }

    convertTo24HourFormat(timeStr) {
        if (!timeStr) return null;
        const timeParts = timeStr.trim().split(" ");
        let hours = parseInt(timeParts[0].split(":")[0], 10);
        const minutes = timeParts[0].split(":")[1];
        const period = timeParts[1].toLowerCase();

        if (period === "pm" && hours !== 12) {
            hours += 12;
        } else if (period === "am" && hours === 12) {
            hours = 0;
        }
        const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
        return `${formattedHours}:${minutes}:00.000Z`;
    }

    convertTo12HourFormat(timeVal) {
        if (timeVal === null || timeVal === undefined) return 'Select Time';

        let timeStr = '';

        // If it's a number (milliseconds since midnight from Salesforce)
        if (typeof timeVal === 'number') {
            const totalSeconds = timeVal / 1000;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            const period = hours >= 12 ? 'PM' : 'AM';

            return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
        }

        // If it's a string (existing logic)
        timeStr = timeVal;
        if (timeStr.includes('T')) {
            timeStr = timeStr.split('T')[1];
        }
        if (timeStr.includes('.')) {
            timeStr = timeStr.split('.')[0];
        }
        if (timeStr.endsWith('Z')) {
            timeStr = timeStr.slice(0, -1);
        }

        const [hours, minutes] = timeStr.split(':');
        const hour24 = parseInt(hours, 10);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const period = hour24 >= 12 ? 'PM' : 'AM';

        return `${hour12}:${minutes} ${period}`;
    }


    splitTimeParts(timeString) {
        if (!timeString) {
            return { hour: null, minute: null, period: null };
        }
        const [timePart, period] = timeString.trim().split(' ');
        const [hour, minute] = timePart.split(':');
        return { hour, minute, period };
    }

    handleError(error) {
        console.error('Error:', error);
        let message = 'An unexpected error occurred.';
        
        if (error && error.body) {
            if (error.body.message) {
                message = error.body.message;
            } else if (error.body.pageErrors && error.body.pageErrors.length > 0) {
                message = error.body.pageErrors[0].message;
            }
        }
        
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    }

    handleDeleteShift(event) {
        const shiftId = event.target.dataset.id;
        const salesforceId = event.target.dataset.salesforceid;

        console.log('🗑️ Deleting shift with ID:', shiftId, 'or Salesforce ID:', salesforceId);
        console.log('Before delete:', JSON.parse(JSON.stringify(this.shiftsforDesign)));

        this.shiftsforDesign = this.shiftsforDesign.filter(shift => {
            const matchById = shift.id && shiftId ? String(shift.id) === String(shiftId) : false;
            const matchBySFId = shift.salesforceId && salesforceId ? String(shift.salesforceId) === String(salesforceId) : false;

            return !(matchById || matchBySFId); // Keep everything that doesn’t match
        });

        console.log('After delete:', JSON.parse(JSON.stringify(this.shiftsforDesign)));
    }

    HandleBack() {
        console.log('HANDLE BACK');
        this.dispatchEvent(new CustomEvent("rostersettingsbackbutton"));
    }


    initializeTemplates() {
        this.templates = [
            {
                id: '1',
                customShiftName: '',
                customShiftindex: this.templates.length + 1,
                shifts: this.createInitialShifts('1'),
                showAddButton: false,
                Facility__c: this.facilityValue,
            }
        ];
    }

    createInitialShifts(templateId) {
        return [
            { id: `${templateId}-1`, name: '', type: '', startTime: '', endTime: '', displayIndex: 1 },
            { id: `${templateId}-2`, name: '', type: '', startTime: '', endTime: '', displayIndex: 2 },
            { id: `${templateId}-3`, name: '', type: '', startTime: '', endTime: '', displayIndex: 3 },
            { id: `${templateId}-4`, name: '', type: '', startTime: '', endTime: '', displayIndex: 4 }
        ];
    }

    handleTemplateNameChange(event) {
        const templateId = event.target.dataset.templateId;
        const value = event.target.value;
        
        this.templates = this.templates.map(template => 
            template.id === templateId 
                ? { ...template, customShiftName: value }
                : template
        );
    }

    /* handleShiftFieldChange(event) {
        const templateId = event.target.dataset.templateId;
        const shiftId = event.target.dataset.shiftId;
        const field = event.target.dataset.field;
        const value = event.target.value;

        console.log("🟢 handleShiftFieldChange triggered");
        console.log("👉 templateId:", templateId);
        console.log("👉 shiftId:", shiftId);
        console.log("👉 field:", field);
        console.log("👉 new value:", value);

        this.templates = this.templates.map(template => {
            if (template.id === templateId) {
                console.log("✅ Updating template:", template.id);

                return {
                    ...template,
                    shifts: template.shifts.map(shift => {
                        if (shift.id === shiftId) {
                            console.log("🔄 Updating shift:", shift.id, "Field:", field, "→", value);
                            return { ...shift, [field]: value };
                        }
                        return shift;
                    })
                };
            }
            return template;
        });

        console.log("📌 Updated templates:", JSON.stringify(this.templates, null, 2));
    } */

    handleShiftFieldChange(event) {
        const templateId = event.target.dataset.templateId;
        const shiftId = String(event.target.dataset.shiftId); // force string
        const field = event.target.dataset.field;
        const value = event.target.value;

        console.log("🟢 handleShiftFieldChange triggered");
        console.log("👉 templateId:", templateId);
        console.log("👉 shiftId (string):", shiftId);
        console.log("👉 field:", field);
        console.log("👉 new value:", value);

        this.templates = this.templates.map(template => {
            if (template.id === templateId) {
                console.log("✅ Updating template:", template.id);

                return {
                    ...template,
                    shifts: template.shifts.map(shift => {
                        if (String(shift.id) === shiftId) { // compare as strings
                            console.log("🔄 Updating shift:", shift.id, "Field:", field, "→", value);
                            return { ...shift, [field]: value };
                        }
                        return shift;
                    })
                };
            }
            return template;
        });

        console.log("📌 Updated templates:", JSON.stringify(this.templates, null, 2));
    }

    convertToMilliseconds(timeStr) {
        if (!timeStr) return null;

        // Example: "5:00 AM" or "08:30 pm"
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) {
            console.error("⚠️ Invalid time string:", timeStr);
            return null;
        }

        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const period = match[3].toUpperCase();

        if (period === "PM" && hour !== 12) {
            hour += 12; // e.g. 5 PM → 17
        }
        if (period === "AM" && hour === 12) {
            hour = 0; // 12 AM → 0
        }

        // ✅ convert to milliseconds since midnight
        const ms = (hour * 60 * 60 * 1000) + (minute * 60 * 1000);
        return ms;
    }

    handleStartTimeChangeforCustom(event) {
        this.savebuttonDisable = false;
        console.log("🕒 Start Time Change Triggered");

        const templateId = event.target.dataset.templateId;
        console.log("📌 Template ID:", templateId);
        const shiftId = event.target.dataset.shiftId;
        console.log("📌 Shift ID:", shiftId);
        const displayTime = event.detail.displaytime;
        console.log("🕑 Displayed Time:", displayTime);

        const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase()); 
        console.log("➡️ Converted 24Hr (string):", converted24);

        const timeDetails = this.splitTimeParts(displayTime);
        console.log("⏱️ Split Time Parts:", JSON.stringify(timeDetails));

        // ✅ Convert to ms for validation
        const convertedMs = this.convertToMilliseconds(displayTime);
        console.log("🕒 Converted to ms:", convertedMs);

        // ✅ Helper → normalize any value to ms
        const normalizeToMs = (value) => {
            if (!value) return null;
            if (typeof value === "number") return value;
            if (!isNaN(value)) return Number(value);
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date.getTime();
        };

        // ✅ Update the templates array
        this.templates = this.templates.map(template => {
            if (String(template.id) === String(templateId)) {
                console.log("🔧 Updating template:", templateId);

                const updatedShifts = template.shifts.map(shift => {
                    console.log("   👉 Checking shift:", shift.id);

                    if (String(shift.id) === String(shiftId)) {
                        console.log("   ✨ Updating shift:", shiftId);
                        console.log("   📍 Old Shift Data:", JSON.parse(JSON.stringify(shift)));

                        const updatedShift = {
                            ...shift,
                            startHour: timeDetails.hour,
                            startMinute: timeDetails.minute,
                            startAMPM: timeDetails.period,
                            startTime: convertedMs,   // stored as ms
                            startTime24: convertedMs, // stored as ms
                            displayedStartTime: displayTime
                        };

                        console.log("   ✅ New Shift Data:", JSON.parse(JSON.stringify(updatedShift)));
                        return updatedShift;
                    } else {
                        console.log("   ⏭️ Skipping shift:", shift.id);
                    }

                    return shift;
                });

                console.log("🔄 Updated Shifts for Template:", JSON.parse(JSON.stringify(updatedShifts)));

                // ✅ Check that last row EndTime = current row StartTime
                let hasMismatch = false;
                for (let i = 0; i < updatedShifts.length - 1; i++) {
                    const currentShift = updatedShifts[i];
                    const nextShift = updatedShifts[i + 1];

                    const currentEnd = normalizeToMs(currentShift.endTime24 || currentShift.end_time);
                    const nextStart  = normalizeToMs(nextShift.startTime24 || nextShift.start_time);

                    console.log(`Row ${i + 1} End: ${currentEnd} | Row ${i + 2} Start: ${nextStart}`);

                    if (currentEnd && nextStart && currentEnd !== nextStart) {
                        hasMismatch = true;
                        console.error(`⛔ Mismatch found: Row ${i + 1} End (${currentShift.displayedEndTime}) ≠ Row ${i + 2} Start (${nextShift.displayedStartTime})`);

                        // 🚨 Show Toast for mismatch
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Shift Mismatch",
                                message: `Row ${i + 1} End Time (${currentShift.displayedEndTime}) doesn't match Row ${i + 2} Start Time (${nextShift.displayedStartTime}).`,
                                variant: "error",
                                mode: "sticky"
                            })
                        );

                        this.savebuttonDisable = true;
                        break;
                    }
                }
                return { ...template, shifts: updatedShifts };
            } else {
                console.log("⏭️ Skipping template:", template.id);
            }
            return template;
        });

        console.log("✅ Updated Templates:", JSON.parse(JSON.stringify(this.templates)));
    }

    // 🔹 Toast helper for showing errors
    showErrorMessage(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Validation Error',
                message: message,
                variant: 'error'
            })
        );
    }


    handleCostperKmfuelChange(event) {
        this.costPerKmFuel = event.target.value;
        console.log('⛽ Cost per Km (Fuel) changed to:', this.costPerKmFuel);
    }

    handleCostperKmElectricChange(event) {
        this.costPerKmElectric = event.target.value;
        console.log('⛽ Cost per Km (Electric) changed to:', this.costPerKmElectric);
    }

    handleEndTimeChangeforCustom(event) {
        this.savebuttonDisable = false;
        console.log("🔹 handleEndTimeChangeforCustom triggered");
        console.log("📌 Raw event:", event);

        const templateId = event.target.dataset.templateId;
        const shiftId = event.target.dataset.shiftId;
        const displayTime = event.detail.displaytime;

        console.log(`🆔 Template ID: ${templateId}`);
        console.log(`🆔 Shift ID: ${shiftId}`);
        console.log(`⏰ Display Time received: ${displayTime}`);

        // Convert to 24-hour formatted string (for logs/UI)
        const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
        console.log(`⏳ Converted to 24-hour format: ${converted24}`);

        // Split into hour/minute/period
        const timeDetails = this.splitTimeParts(displayTime);
        console.log("🕒 Split Time Parts:", timeDetails);

        // ✅ Convert to milliseconds
        const convertedMs = this.convertToMilliseconds(displayTime);
        console.log("🕒 Converted EndTime to ms:", convertedMs);

        // ✅ Update the templates array
        this.templates = this.templates.map(template => {
            console.log(`📂 Checking template ID: ${template.id}`);

            if (String(template.id) === String(templateId)) {
                console.log(`✅ Matched template ID: ${template.id}`);

                const updatedShifts = template.shifts.map(shift => {
                    console.log(`   ➡ Checking shift ID: ${shift.id}`);

                    if (String(shift.id) === String(shiftId)) {
                        console.log(`   ✅ Matched shift ID: ${shift.id}, updating shift`);
                        return {
                            ...shift,
                            endHour: timeDetails.hour,
                            endMinute: timeDetails.minute,
                            endAMPM: timeDetails.period,
                            endTime: convertedMs,        // ✅ stored as ms
                            endTime24: convertedMs,      // ✅ stored as ms
                            displayedEndTime: displayTime
                        };
                    } else {
                        console.log(`   ⏭️ Skipping shift: ${shift.id}`);
                    }
                    return shift;
                });

                // 🔎 Validate sequence: EndTime[i] vs StartTime[i+1]
                for (let i = 0; i < updatedShifts.length - 1; i++) {
                    const currentShift = updatedShifts[i];
                    const nextShift = updatedShifts[i + 1];

                    // Skip validation if next shift startTime is empty (null, undefined, or "")
                    if (!nextShift.startTime) {
                        console.log(`⏭️ Next shift at row ${i + 2} is empty, skipping mismatch check`);
                        continue; // or use break if you want to stop all further checks
                    }

                    console.log(
                        `Row ${i + 1} End: ${currentShift.endTime} | Row ${i + 2} Start: ${nextShift.startTime}`
                    );

                    if (
                        currentShift.endTime !== null &&
                        currentShift.endTime !== nextShift.startTime
                    ) {
                        console.warn(
                            `⛔ Mismatch found: Row ${i + 1} End (${currentShift.endTime}) ≠ Row ${i + 2} Start (${nextShift.startTime})`
                        );
                        this.savebuttonDisable = true;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Shift Mismatch",
                                message: `Row ${i + 1} End Time (${currentShift.displayedEndTime}) doesn't match Row ${i + 2} Start Time (${nextShift.displayedStartTime}).`,
                                variant: "error",
                                mode: "sticky"
                            })
                        );
                    }
                }
                return { ...template, shifts: updatedShifts };
            } else {
                console.log(`❌ Template ID ${template.id} does not match`);
            }

            return template;
        });

        console.log("📦 Updated templates array:", JSON.stringify(this.templates, null, 2));
    }

    // handleDeleteShiftforCustom(event) {
    //     const templateId = event.currentTarget.dataset.templateId;
    //     const shiftId = event.currentTarget.dataset.shiftId; // string from dataset

    //     console.log("🗑️ Attempting to delete shift:", shiftId, "from template:", templateId);

    //     this.templates = this.templates.map(template => {
    //         if (template.id === templateId) {
    //             console.log("📌 Current shifts before deletion:", JSON.parse(JSON.stringify(template.shifts)));

    //             // Ensure both ids are strings for comparison
    //             let updatedShifts = template.shifts.filter(shift => String(shift.id) !== String(shiftId));
    //             console.log("📝 Shifts after deletion filter:", JSON.parse(JSON.stringify(updatedShifts)));

    //             // Reindex displayIndex
    //             updatedShifts = updatedShifts.map((shift, index) => ({
    //                 ...shift,
    //                 displayIndex: index + 1
    //             }));
    //             console.log("🔢 Shifts after reindexing displayIndex:", JSON.parse(JSON.stringify(updatedShifts)));

    //             return {
    //                 ...template,
    //                 shifts: updatedShifts,
    //                 showAddButton: updatedShifts.length < 4
    //             };
    //         }
    //         return template;
    //     });

    //     console.log("🏁 Templates after deletion:", JSON.parse(JSON.stringify(this.templates)));
    // }
     handleDeleteShiftforCustom(event) {
        const templateId = event.currentTarget.dataset.templateId;
        const shiftId = event.currentTarget.dataset.shiftId; // string from dataset

        console.log("🗑️ Attempting to delete shift:", shiftId, "from template:", templateId);

        this.templates = this.templates.map(template => {
            if (template.id === templateId) {
                console.log("📌 Current shifts before deletion:", JSON.parse(JSON.stringify(template.shifts)));

                // Ensure both ids are strings for comparison
                let updatedShifts = template.shifts.filter(shift => String(shift.id) !== String(shiftId));
                console.log("📝 Shifts after deletion filter:", JSON.parse(JSON.stringify(updatedShifts)));

                // Reindex displayIndex
                updatedShifts = updatedShifts.map((shift, index) => ({
                    ...shift,
                    displayIndex: index + 1
                }));
                console.log("🔢 Shifts after reindexing displayIndex:", JSON.parse(JSON.stringify(updatedShifts)));
                const normalizeToMs = (value) => {
                    if (!value) return null;
                    if (typeof value === "number") return value;
                    if (!isNaN(value)) return Number(value);
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? null : date.getTime();
                };

                // 🔍 Shift time mismatch check after deletion
                let hasMismatch = false;

                for (let i = 0; i < updatedShifts.length - 1; i++) {
                    const currentShift = updatedShifts[i];
                    const nextShift = updatedShifts[i + 1];

                    const currentEnd = normalizeToMs(currentShift.endTime24 || currentShift.end_time);
                    const nextStart = normalizeToMs(nextShift.startTime24 || nextShift.start_time);

                    console.log(`⏱️ Validating: Shift ${i + 1} End (${currentEnd}) vs Shift ${i + 2} Start (${nextStart})`);

                    if (currentEnd !== null && nextStart !== null && currentEnd !== nextStart) {
                        hasMismatch = true;

                        console.error(`⛔ Mismatch found: Shift ${i + 1} End (${currentShift.displayedEndTime}) ≠ Shift ${i + 2} Start (${nextShift.displayedStartTime})`);

                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Shift Mismatch After Deletion",
                                message: `After deletion, Shift ${i + 1} End Time (${currentShift.displayedEndTime}) doesn't match Shift ${i + 2} Start Time (${nextShift.displayedStartTime}).`,
                                variant: "error",
                                mode: "sticky"
                            })
                        );

                        this.savebuttonDisable = true;
                        break;
                    }
                }

                if (!hasMismatch) {
                    this.savebuttonDisable = false;
                }

                return {
                    ...template,
                    shifts: updatedShifts,
                    showAddButton: updatedShifts.length < 4
                };
            }
            return template;
        });

        console.log("🏁 Templates after deletion:", JSON.parse(JSON.stringify(this.templates)));
    }

    handleAddShiftforCustom(event) {
        const templateId = event.currentTarget.dataset.templateId; // ✅ use currentTarget
        console.log("➕ Adding new shift for templateId:", templateId);

        this.templates = this.templates.map(template => {
            if (template.id === templateId && template.shifts.length < 4) {
                console.log(`📌 Current shifts for template [${templateId}]:`, JSON.parse(JSON.stringify(template.shifts)));

                const newShiftIndex = template.shifts.length + 1;
                const newShift = {
                    id: Date.now(),
                    name: '',
                    type: '',
                    startTime: '',
                    endTime: '',
                    displayIndex: newShiftIndex
                };
                console.log("🆕 New shift being added:", newShift);

                const updatedShifts = [...template.shifts, newShift];
                console.log("✅ Updated shifts array:", JSON.parse(JSON.stringify(updatedShifts)));

                return {
                    ...template,
                    shifts: updatedShifts,
                    showAddButton: updatedShifts.length < 4
                };
            }
            return template;
        });

        console.log("🏁 Templates after adding shift:", JSON.parse(JSON.stringify(this.templates)));
    }


    handleAddTemplate() {
        const newTemplateId = Date.now().toString();
        const newTemplate = {
            id: newTemplateId,
            customShiftName: '',
            customShiftindex: this.templates.length + 1,
            shifts: this.createInitialShifts(newTemplateId),
            Facility__c: this.facilityValue,
            showAddButton: false
        };
        
        this.templates = [...this.templates, newTemplate];
    }

    handleColorChangeforCustom(event) {
        const templateId = event.target.dataset.templateId;
        const newColor = event.detail.value;

        this.templates = this.templates.map(template => {
            if (template.id === templateId) {
                return {
                    ...template,
                    selectedColor: newColor,
                    colorStyle: `background-color: ${newColor}; width: 25px; height: 25px; border: 1px solid #ccc;`
                };
            }
            return template;
        });
    }
}