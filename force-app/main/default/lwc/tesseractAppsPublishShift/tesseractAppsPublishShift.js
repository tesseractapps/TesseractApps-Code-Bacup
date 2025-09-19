import { LightningElement,track,api} from 'lwc';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getFacilityAddress from '@salesforce/apex/AddShiftController.getFacilityAddress';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import rosterPublish from '@salesforce/apex/RostersPublishAndAssignHandler.rosterPublish';
import getStaffHourlyRates from '@salesforce/apex/RostersPublishAndAssignHandler.getStaffHourlyRates';
import getShiftList from '@salesforce/apex/AddShiftController.getShiftList';
import allocateMultipleStaff from '@salesforce/apex/AddShiftController.allocateMultipleStaff';
//import sendPushNotification from '@salesforce/apex/mobilePushNotificationController.sendPushNotification';
import generateAndSendNotification from '@salesforce/apex/MobileAppNotificationsV2.generateAndSendNotification';
import sendShiftEmails from '@salesforce/apex/StaffEmailNotificationController.sendShiftEmails';

export default class TesseractAppsPublishShift extends LightningElement {
  @api roleandadate={};
  @api tablelagfromparent=false;
  @api startdate;
  @api enddate;
    @track addShiftData={
                   AddShiftStartDate:null,
                   AddShiftStaffValue:null,
                   AddShiftFacilityValue:null,
                   AddShiftRole:null,
                   AddShiftType:null,
                   AddShiftBreak:null,
                   AddShiftDuration:0,
                   AddShiftStartTime:null,
                   AddShiftStartTimeAMPM:null,
                   AddShiftEndTime:null,
                   AddShiftEndTimeAMPM:null,
                   AddShiftnotification:false,
                   AddShiftStaffHourlyRate:0,
                   AddShiftQuantity:0,
                   AddShiftNotes:null,
                   AddShiftEOI:false  ,
                   AddShiftId:null  , 
                   AddShiftHoliday:false,
                   AddShiftEnterOtherLocation:false,
                   AddShiftParticipantAddressCheckbox:false
        
            }
    @track address = {
                street:null,
                citySuburb:null,
                country:null,
                provinceState:null,
                postalcode:null
            };
    @track isAddShiftList=true;
    @track AddShiftTable=[];
    @track OrgNisationRoles=[];
    @track facilityOptions = [];
    @track facilityValue=[];
    @track chosenRole=[];
    @track orgId;
    @track shiftTypeOptions=[{label: 'General', value:'General'},{label:'Morning', value:'Morning'},{label: 'Afternoon', value: 'Afternoon'},{label: 'Night', value: 'Night'},{label: 'Custom', value: 'Custom'}];
     @track facilityAddressCheckbox=false;
    @track addNewAddressCheckBox=false;
    @track isDisableSaveButton=false;
    @track finalAddShiftData={
      shiftaddress:null,
      shiftDetails:null,
   }
   @track staffHorlyRateList = [];
   @track isAllocateTable=false;
   @track isHomeFlag=false;
   @track isUnallocateTable=false;
   @track unAllocatedTableList=[];
   @track finalAllocationList=[];
   @track unallocatedCount=0;
   @track isDisableAllocated=false;
   @track selectedShiftId;
   @track selectedShiftDate;
   @track allocateLabel='Create';
   @track isHoliday=false;
   @track isShowSpinner=false;
   @track isEoICheckBoxVisible=true;
   @track organisationShiftTimes;
   @track startTimeSelectedHour=12;
   @track startTimeSelectedminute='00';
   @track endtimeSelectedHour=12;
   @track endtimeSelectedminute='00'; 
   @track startTimeAMPM =false
   @track endTimeAMPM=false;
   @track savButtonDisable=false;
   @track isEditShitScreen=false;
   @track AddShiftOriginalQuantity=0;
   @track disableTimeButton =false;
   @track isNotificationVisible=true;
  isListening = false; 
  showMuteIcon = false; 
  showClearIcon = false; 
  recognition; 
  @track disableRole=false;
  @track headingLabel='Add Shift(s)';
  @track isVisibleSaveButton=true;
  @track fatigueManagementFlag=false;
  @track fatigueConfirmationMessge;
  @track setHoursIndicatorflag=false;
  @track setHoursIndiactorConfirmation;
  @api facilityarray=[];
  @track navigateTo;

 /*  @track EOIvalue; */

   
    HandleBack() { 
        console.log('navigateTo '+ this.navigateTo);
        if(this.navigateTo=='AllocationShifts'){
            this.isHomeFlag = false;
            this.isUnallocateTable = true;
            this.isAllocateTable = false;
            this.navigateTo='home';
        }else if(this.navigateTo=='home'){
            this.dispatchEvent(new CustomEvent("publishbackbutton"));
          
        }
      
        
    }
      connectedCallback() {
        
           console.log('facility val from parent :', JSON.stringify(this.facilityarray));
              console.log('is holiday :', this.roleandadate.isHoliday);
              this.addShiftData.AddShiftHoliday= this.roleandadate.isHoliday =="true"?true:false;
                
              let startDate =this.roleandadate.rosterPublishDate.split("-");
              this.addShiftData.AddShiftStartDate=startDate[2]+"-"+startDate[1]+"-"+startDate[0];
              this.addShiftData.AddShiftRole=this.roleandadate.rosterPublishRole;
              this.addShiftData.AddShiftnotification=true;
              console.log('start date '+this.startdate);
              console.log('end date '+this.enddate);
                        if (this.tablelagfromparent == true) {
             //   console.log('Received data in start date:', this.addShiftData.AddShiftStartDate); 
             //   console.log('Received data in role:', this.addShiftData.AddShiftRole);
            
                getShiftList({
                    role: this.addShiftData.AddShiftRole,
                    startDate: startDate[0] + "/" + startDate[1] + "/" + startDate[2]
                })
                .then(response => {
                    console.log('shiftlist:', JSON.stringify(response));
                     let filteredShifts = response.filter(rec => this.facilityarray.includes(rec.Facility__c));

                    this.unAllocatedTableList = filteredShifts.map((rec, index) => {
                        const rawDate = rec.Start_Date__c;
                        const formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric'
                        });
                        let EOIvalue = rec.Is_EOI__c ? 'True' : 'False';
                        let duration =parseFloat(rec.Duration__c).toFixed(2)
                        return {
                            ...rec,
                            serialNumber: index + 1,
                            date: formattedDate,
                            EOIvalue: EOIvalue,
                            duration:duration
                        };
                    });

                })
                .catch(err => {
                    console.error('Error fetching shift list:', err);
                });
            
                this.isHomeFlag = false;
                this.isUnallocateTable = true;
              
                this.headingLabel='Shift Allocation';
                this.isVisibleSaveButton=false;
            } else {
                this.isHomeFlag = true;
                this.isAllocateTable = false;
            }
              
                getFacilityData().then(response => {
                      this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }));
                      
                        this.finalSelectedFacilities = this.facilityOptions.filter(rec =>
                        this.facilityarray.includes(rec.value)
                        );
                    //  console.log('number of facilities  ==>'+JSON.stringify(this.facilityOptions));
                    console.log('number of facilities  ==>'+this.facilityOptions.length);
                      this.organisationShiftTimes=response[0].Organisation__r;
                      this.facilityValue.push(this.facilityOptions[0].value) ;
                      this.facilityAddressCheckbox=true;
                      this.addShiftData.AddShiftFacilityValue=this.facilityOptions[0].value;
                    
                      if(this.facilityAddressCheckbox==true){
                        this.getFacilityAddress();
                      }
                
                  }).catch(err => {
                   // console.log(err);
                  });
        
                    organizationDetails().then(response => {
                        this.orgId = response.listofPriceBook.Id;
                    
                        let orgRoles= response.listofPriceBook.Roles__c;
                        //console.log('listofPriceBook:', response.listofPriceBook);
                        this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
                        return {
                            value: rec,
                            label: rec
                        };
                        });
                }); 
                 this.navigateTo='home';
            }
    handleAddShiftTimeData (event){
        const childData = event.detail;
        this.addShiftData[event.currentTarget.dataset.timetype]=childData.twentyFourHourFormat;
        this.addShiftData[event.currentTarget.dataset.ampm]=childData.displaytime;
        this.addShiftData.AddShiftDuration= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).duration;
        this.addShiftData.AddShiftBreak= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).breakTime;
        console.log("Updated addShiftData:", JSON.stringify(this.addShiftData));
          /* if (this.addShiftData.AddShiftStartTimeAMPM) {
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
        } */
        
      } 
      addressInputChange(event){
        this.address.street=event.detail.street;
            this.address.citySuburb=event.detail.city;
            this.address.postalcode=event.detail.postalCode;
            this.address.provinceState=event.detail.province;
            this.address.country=event.detail.country;
           
      } 
    
      /* getDuration(startDateString, startTimeString, endTimeString, endTimeAMPM, shiftType) {
        console.log('--- getDuration called ---');
        console.log('startDateString:', startDateString);
        console.log('startTimeString:', startTimeString);
        console.log('endTimeString:', endTimeString);
        console.log('endTimeAMPM:', endTimeAMPM);
        console.log('shiftType:', shiftType);

        // Validate input parameters
        if (!startDateString || !startTimeString || !endTimeString || !endTimeAMPM || !shiftType) {
            console.warn('Missing required parameters');
            return {
                duration: 0,
                breakTime: 0
            };
        }

        const dateParts = startDateString.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Months are zero-indexed
        const day = parseInt(dateParts[2], 10);
        console.log('Parsed date:', { year, month, day });

        const startParts = startTimeString.split(":");
        const startDate = new Date(year, month, day, parseInt(startParts[0], 10), parseInt(startParts[1], 10));
        console.log('Start Date:', startDate);

        const endParts = endTimeString.split(":");
        let endDate = new Date(year, month, day, parseInt(endParts[0], 10), parseInt(endParts[1], 10));
        console.log('Initial End Date:', endDate);

        const endTimeSplit = endTimeAMPM.split(' ');
        if (endTimeSplit[1] === 'AM' && shiftType === 'Night') {
            endDate.setDate(endDate.getDate() + 1); // Adjust for overnight shifts
            console.log('Adjusted End Date for night shift:', endDate);
        }

        const durationInMilliseconds = endDate - startDate;
        const durationInMinutes = durationInMilliseconds / (1000 * 60);
        console.log('Duration in minutes:', durationInMinutes);

        let hours = (durationInMinutes / 60).toFixed(1); // Calculate hours
        let breakTime = 0;
        console.log('Calculated raw hours:', hours);

        if (hours >= 5) {
            breakTime = 30; // Apply 30-minute break
            const breaksInHours = (breakTime / 60).toFixed(1);
            hours -= breaksInHours;
            console.log('Break time applied:', breakTime, 'Adjusted hours:', hours);
        }

        const result = {
            duration: parseFloat(hours), // Ensure the duration is a number
            breakTime: breakTime
        };
        console.log('Final result:', result);
        return result;
    } */
      
    /* getDuration(startDateString, startTimeString, endTimeString, endTimeAMPM, shiftType) {
        console.log('--- getDuration called ---');
        console.log('Input Params:', {
            startDateString,
            startTimeString,
            endTimeString,
            endTimeAMPM,
            shiftType
        });

        // Validate input parameters
        if (!startDateString || !startTimeString || !endTimeString || !endTimeAMPM || !shiftType) {
            console.warn('Missing one or more required parameters.');
            return {
                duration: 0,
                breakTime: 0
            };
        }

        // Parse date
        const dateParts = startDateString.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Months are zero-indexed
        const day = parseInt(dateParts[2], 10);
        console.log('Parsed date:', { year, month, day });

        // Parse start time
        const startParts = startTimeString.split(":");
        const startDate = new Date(year, month, day, parseInt(startParts[0], 10), parseInt(startParts[1], 10));
        console.log('Start Date:', startDate.toString());

        // Parse end time
        const endParts = endTimeString.split(":");
        let endDate = new Date(year, month, day, parseInt(endParts[0], 10), parseInt(endParts[1], 10));
        console.log('Initial End Date:', endDate.toString());

        // Adjust for overnight shifts
        const endTimeSplit = endTimeAMPM.split(' ');
        if (endTimeSplit[1] === 'AM' &&
            (shiftType === 'Night' || shiftType === 'Sleepover Shift' || shiftType === 'Custom')) {
            endDate.setDate(endDate.getDate() + 1);
            console.log('End Date adjusted for overnight shift:', endDate.toString());
        }

        // Calculate duration
        let durationInMilliseconds = endDate - startDate;
        let durationInMinutes = durationInMilliseconds / (1000 * 60);

        // Limit duration to 24 hours
        if (durationInMinutes > 1440) {
            console.log('durationInMinutes >>',durationInMinutes);
            console.warn('Duration exceeds 24 hours. Resetting endDate to same day as startDate.');
            //endDate = new Date(startDate.getTime()); // Reset end date to same as start
            console.log('endDate >>',startDate);
            console.log('startDate >>',startDate);
            durationInMilliseconds = endDate - startDate;
            console.log('durationInMilliseconds >>',durationInMilliseconds);
            durationInMinutes = durationInMilliseconds / (1000 * 60);
            console.log('durationInMinutes >>',durationInMinutes);
        }

        console.log('Duration in minutes:', durationInMinutes);

        let hours = (durationInMinutes / 60).toFixed(1);
        console.log('Calculated raw hours:', hours);

        let breakTime = 0;

        if (hours >= 5) {
            breakTime = 30;
            const breaksInHours = (breakTime / 60).toFixed(1);
            hours -= breaksInHours;
            console.log(`Break time of 30 mins applied. Adjusted hours: ${hours}`);
        } else {
            console.log('No break time applied (less than 5 hours).');
        }

        // Set formatted end date to the component state
        const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        console.log('Formatted End Date:', formattedEndDate);
        this.addShiftData.AddShiftEndDate = formattedEndDate;

        const result = {
            duration: parseFloat(hours),
            breakTime: breakTime
        };

        console.log('Final Duration Result:', result);
        return result;
    } */

    getDuration(startDateString, startTimeString, endTimeString, endTimeAMPM, shiftType) {
        console.log('--- getDuration called ---');
        console.log('Input Params:', {
            startDateString,
            startTimeString,
            endTimeString,
            endTimeAMPM,
            shiftType
        });

        // Validate input parameters
        if (!startDateString || !startTimeString || !endTimeString || !endTimeAMPM || !shiftType) {
            console.warn('Missing one or more required parameters.');
            return {
                duration: 0,
                breakTime: 0
            };
        }

        // Parse date
        const dateParts = startDateString.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Months are zero-indexed
        const day = parseInt(dateParts[2], 10);
        console.log('Parsed date:', { year, month, day });

        // Parse start time
        const startParts = startTimeString.split(":");
        const startDate = new Date(year, month, day, parseInt(startParts[0], 10), parseInt(startParts[1], 10));
        console.log('Start Date:', startDate.toString());

        // Parse end time
        const endParts = endTimeString.split(":");
        let endDate = new Date(year, month, day, parseInt(endParts[0], 10), parseInt(endParts[1], 10));
        console.log('Initial End Date:', endDate.toString());

        // Adjust for overnight shifts only if end time is before start time
        if (shiftType === 'Night' || shiftType === 'Custom' || shiftType === 'Sleepover Shift') {
            if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
                console.log(`${shiftType} shift adjusted: endDate moved to next day to correct negative duration.`);
            } else {
                console.log(`${shiftType} shift: no date adjustment needed.`);
            }
        }

        // Calculate duration
        let durationInMilliseconds = endDate - startDate;
        let durationInMinutes = durationInMilliseconds / (1000 * 60);

        // Limit duration to 24 hours
        if (durationInMinutes > 1440) {
            console.warn('Duration exceeds 24 hours. Capping to 24 hours.');
            durationInMinutes = 1440;
        }

        console.log('Duration in minutes:', durationInMinutes);

        let hours = (durationInMinutes / 60).toFixed(1);
        console.log('Calculated raw hours:', hours);

        let breakTime = 0;

        if (hours >= 5) {
            breakTime = 30;
            const breaksInHours = (breakTime / 60).toFixed(1);
            hours -= breaksInHours;
            console.log(`Break time of 30 mins applied. Adjusted hours: ${hours}`);
        } else {
            console.log('No break time applied (less than 5 hours).');
        }

        // Set formatted end date to the component state
        const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        console.log('Formatted End Date:', formattedEndDate);
        this.addShiftData.AddShiftEndDate = formattedEndDate;

        const result = {
            duration: parseFloat(hours),
            breakTime: breakTime
        };

        console.log('Final Duration Result:', result);
        return result;
    }


    handleAddShiftChange(event) {
        const { name, type, value, checked } = event.target;

        if (type === 'checkbox') {
            this.addShiftData[name] = checked;
        } else {
            this.addShiftData[name] = value;
        }

        if(name =='AddShiftType' &&  this.addShiftData.AddShiftType){
            this.getOrganisationTimings();
        }
        if(name =='AddShiftFacilityValue' && this.facilityAddressCheckbox==true){
            this.getFacilityAddress();
        }
        if(name =='AddShiftNotes'){
            this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
        }

        console.log("Updated addShiftData:", JSON.stringify(this.addShiftData));
    }
    getOrganisationTimings(){

      switch (this.addShiftData.AddShiftType) {
        case 'Morning':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Morning_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Morning_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_End_Time__c.toLowerCase());
           // this.disableTimeButton=true;
            break;
    
        case 'Afternoon':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toLowerCase());
         //   this.disableTimeButton=true;
            break;
    
        case 'Night':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Night_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Night_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_End_Time__c.toLowerCase());
          //  this.disableTimeButton=true;
            break;
    
        case 'General':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.General_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.General_Shift_End_time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_End_time__c.toLowerCase());
          //  this.disableTimeButton=true;
            break;
    
        case 'Custom':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Custom_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Custom_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_End_Time__c.toLowerCase());
         //   this.disableTimeButton=false;
            break;
    
        default:
            console.warn(`Unknown shift type: ${this.addShiftData.AddShiftType}`);
           // this.disableTimeButton=false;
            break;
    }
    
  
    // Calculate the shift duration after assigning values
    this.addShiftData.AddShiftDuration = this.getDuration(this.addShiftData.AddShiftStartDate, this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime, this.addShiftData.AddShiftEndTimeAMPM, this.addShiftData.AddShiftType).duration;
    this.addShiftData.AddShiftBreak= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).breakTime;
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
   }
    
    validateInputs() {
      let isValid = true; // Track overall form validity
  
      // Define fields to validate
      let fields = [
          { name: "AddShiftQuantity", selector: ".AddShiftQuantity", errorMessage: "Quantity must be greater than 0." },
          { name: "AddShiftFacilityValue", selector: ".AddShiftFacilityValue", errorMessage: "Facility is required." },
          { name: "AddShiftRole", selector: ".AddShiftRole", errorMessage: "Role is required." },
          { name: "AddShiftType", selector: ".AddShiftType", errorMessage: "Shift Type is required." },
          { name: "AddShiftDuration" , selector: ".AddShiftDuration", errorMessage: "Start Time should be greater than End Time." },

      ];
  
      console.log("Starting Validation...");
  
      fields.forEach(field => {
          let inputElement = this.template.querySelector(field.selector);
  
          if (inputElement) {
              let value = inputElement.value;
              let isFieldValid = true;
  
              // Use switch-case for validation logic
              switch (field.name) {
                  case "AddShiftQuantity":
                      if (isNaN(Number(value)) || Number(value) <= 0) {
                          isFieldValid = false;
                      }
                      break;
                  case "AddShiftFacilityValue":
                  case "AddShiftType":
                  case "AddShiftRole":
                      if (!value) {
                          isFieldValid = false;
                      }
                      break;
              }
  
              // Apply validation message
              if (!isFieldValid) {
                  inputElement.setCustomValidity(field.errorMessage);
                  isValid = false;
              } else {
                  inputElement.setCustomValidity("");
              }
  
              inputElement.reportValidity();
              console.log(`${field.name} Validation Completed.`);
          }
      });
  
      console.log("Overall Validation Status:", isValid);
      return isValid;
  }
  

  validateAddress() {
    let addressCmp = this.template.querySelector('.addressClass');

    if (addressCmp) {
        console.log("Validating Address Fields...");

        let isValid = true;

        // Retrieve address values
        let fields = {
            street: addressCmp.street,
            city: addressCmp.city,
            province: addressCmp.province,
            postalCode: addressCmp.postalCode,
            country: addressCmp.country
        };

     //   console.log("Address Data:", fields);

        // Custom error messages mapping
        const errorMessages = {
            city: "Suburb cannot be empty.",
            province: "Province cannot be empty.",
            postalCode: "Postal Code cannot be empty."
        };

        // Loop through fields and validate using switch
        for (let field in fields) {
            let value = fields[field];

            switch (field) {
                case "street":
                case "country":
                    if (!value || value.trim() === '') {
                        console.log(`${field} is empty.`);
                        addressCmp.setCustomValidityForField(
                            `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty.`,
                            field
                        );
                        isValid = false;
                    } else {
                        addressCmp.setCustomValidityForField("", field);
                    }
                    break;

                case "city":
                case "province":
                case "postalCode":
                    if (!value || value.trim() === '') {
                        console.log(`${field} is empty.`);
                        addressCmp.setCustomValidityForField(errorMessages[field], field);
                        isValid = false;
                    } else {
                        addressCmp.setCustomValidityForField("", field);
                    }
                    break;

                default:
                    console.log(`No validation rule for field: ${field}`);
            }
        }

        // Show error messages if invalid
        addressCmp.reportValidity();

        console.log("Address Validation Completed. isValid:", isValid);
        return isValid;
    } else {
        console.error("Error: lightning-input-address component not found.");
        return false;
    }
}

  
    
    
    EmptyAddressFields(){
        this.address.street='';
            this.address.citySuburb='';
            this.address.postalcode='';
            this.address.provinceState='';
            this.address.country='';
      }

      get addressComponentStyle() {
  return this.addNewAddressCheckBox ? '' : 'display: none;';
}
      AdreesCheckboxChange(event){
        console.log('event name '+event.target.name)
          this.facilityAddressCheckbox = false;
  this.participantAddressCheckBox = false;
  this.addNewAddressCheckBox = false;
        if(event.target.name=='facilityAddressCheckbox' && event.target.checked==true){
          if(!this.addShiftData.AddShiftFacilityValue){
            this.confirMationMessage('Error','Please Select facility','Error');
            this.isDisableSaveButton=true;
            this.facilityAddressCheckbox=false;
           
          }
          this.getFacilityAddress();
          this.addNewAddressCheckBox=false;
          this.facilityAddressCheckbox=event.target.checked;
        }else if(event.target.name=='addNewAddressCheckBox' && event.target.checked==true){
            console.log('else')
            this.addNewAddressCheckBox=event.target.checked;
            this.facilityAddressCheckbox=false;
          this.EmptyAddressFields();
          
        }else if(event.target.name=='facilityAddressCheckbox' && event.target.checked==false){
            this.facilityAddressCheckbox=event.target.checked;
            this.EmptyAddressFields();
        }
          this.addShiftData.AddShiftEnterOtherLocation=this.addNewAddressCheckBox 
      }
      getFacilityAddress(){
        getFacilityAddress({ facilityId:this.addShiftData.AddShiftFacilityValue})
        .then((result) => {
         // console.log('facility address'+JSON.stringify(result));
          if (result && result.length > 0) {
            const facility = result[0];
            this.address.street = facility.Address__Street__s;
            this.address.citySuburb  = facility.Address__City__s;
            if (facility.Address__CountryCode__s  == "AU"){
              this.address.country  = "Australia";
            }
            this.address.provinceState  = facility.Address__StateCode__s;
            this.address.postalcode  = facility.Address__PostalCode__s;
  
          }
        })
        .catch((error) => {
        });
    }
      confirMationMessage(title,message,variant){
        this.dispatchEvent(
          new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
          })
        );
      }
      handleAddShiftSave(){
        this.finalAddShiftData.shiftaddress=this.address;
        this.finalAddShiftData.shiftDetails=this.addShiftData;
        this.selectedShiftId='';
        this.selectedShiftDate='';
        this.isShowSpinner=true;
          this.navigateTo='home'; 
       // console.log('validate input '+this.validateInputs());
       // console.log('validate '+this.validateAddress());
        console.log('finalAddShiftData '+JSON.stringify(this.finalAddShiftData));
        if(this.isEditShitScreen==true &&  this.addShiftData.AddShiftQuantity < this.AddShiftOriginalQuantity ){
          this.confirMationMessage('Error','The quantity should not be empty or less than the original quantity.','Error');
          this.isShowSpinner=false;
        }else if(this.validateInputs() && this.validateAddress() && this.addShiftData.AddShiftDuration >0){
                let facVal=[];
            facVal.push(this.addShiftData.AddShiftFacilityValue)

      
          rosterPublish({addshiftData:JSON.stringify(this.finalAddShiftData),startdate:this.startdate,enddate:this.enddate,facilityVal:facVal})
          .then((result) => {
          console.log('result email'+JSON.stringify(result));
         // const Id = JSON.parse(result.shiftId);
          //console.log(' add shift id'+Id);
          if(result.isSuccess){
             this.selectedShiftId=result.shiftid;
              console.log(`Shift Id: ${this.selectedShiftId}`)
                if(this.addShiftData.AddShiftEOI==false){
                  this.isAllocateTable=true;
                  this.isHomeFlag=true;
                  this.isUnallocateTable=false;
                  this.savButtonDisable=true;
                  this.staffHorlyRateList  = JSON.parse(result.staffHourlyRates);
                 console.log('Parsed Staff Hourly Rates:', JSON.stringify(this.staffHorlyRateList));
                      if(this.staffHorlyRateList.length>0){
                       
                        this.selectedShiftDate=this.staffHorlyRateList[0].shiftDate;
                        this.unallocatedCount=this.staffHorlyRateList[0].quantity;
                       
                        console.log(`Shift start date: ${this.selectedShiftDate}`)
                    
                      }
                  
              }else{
                this.isAllocateTable=false;
                this.isHomeFlag=true;
                this.isUnallocateTable=false;
                this.HandleBack();
              }
              console.log('Result: '+JSON.stringify(result));

              if(this.isEditShitScreen==false){
                this.confirMationMessage('Success','Your shift has been successfully created. Please proceed with adding staff to this shift.','Success');
              }else{
                 this.confirMationMessage('Success','Your shift has been successfully updated. Please proceed with adding staff to this shift.','Success');
              }
            
              if(this.addShiftData.AddShiftnotification ==true &&this.isEditShitScreen==false){
                console.log('send push notification')
                 /*  sendPushNotification({role:this.addShiftData.AddShiftRole,strdate:this.addShiftData.AddShiftStartDate}).then(response=>{
              }); */
              generateAndSendNotification({role:this.addShiftData.AddShiftRole,strdate:this.addShiftData.AddShiftStartDate,staffId:''}).then(response=>{
            });
            console.log('send email parameters'+this.selectedShiftId+''+this.addShiftData.AddShiftRole+''+this.addShiftData.AddShiftFacilityValue);
            sendShiftEmails({shiftId:this.selectedShiftId,roleId:this.addShiftData.AddShiftRole,facilityId:this.addShiftData.AddShiftFacilityValue,staffId:'',isrecur:false,Sdate:'',Edate:'',typeOfRecur:this.RecurValue,
          recurEvery:this.recurEveryValue}).then(response=>{
            });
            }
              this.isShowSpinner=false;
             // this.isEditShitScreen=false;
             // this.disableTimeButton=false;
          }else{
              this.confirMationMessage('Error',result.message,'Error');
              this.isShowSpinner=false;
          }
          }).catch((error) => {
            console.log('error >>'+error);
          });
      }else{
          this.isShowSpinner=false;
          if(this.addShiftData.AddShiftDuration <=0){
          this.confirMationMessage('Error','Start Time should be greater than End Time.','Error');
        }
      }
        
      }
      handleAllocateToggle(event) {
        const staffId = event.currentTarget.dataset.id;
        this.staffHorlyRateList = this.staffHorlyRateList.map(staff =>
            staff.Id === staffId ? { ...staff, isAllocate: event.target.checked } : staff
        );
        const allocatedStaff = this.staffHorlyRateList.filter(staff => staff.isAllocate);
        this.finalAllocationList=allocatedStaff;
        console.log('Updated Staff Hourly Rates (Checked Only):', JSON.stringify(this.finalAllocationList));
     
        if(allocatedStaff.length>this.unallocatedCount){
          this.confirMationMessage('Error','You have exceeded the number of shifts to allocate','Error');
          this.isDisableAllocated=true;
        }else{
          this.isDisableAllocated=false;
        }
       

        
    }
    handleUnAllocated(event) {
      this.isHomeFlag = false;
      this.isUnallocateTable = false;
      this.isAllocateTable = true;
      this.navigateTo='AllocationShifts';
      let shiftId = event.currentTarget.dataset.shiftid;
      this.unallocatedCount=event.currentTarget.dataset.quantity;
      this.selectedShiftId=shiftId;
      console.log(`Shift Id: ${this.selectedShiftId}`)
      this.selectedShiftDate=event.currentTarget.dataset.startdate;
      this.headingLabel='Shift Allocation';
      console.log('Eoi value==>'+event.currentTarget.dataset.eoivalue);
      this.isVisibleSaveButton=false;
      let facVal=[]
        console.log(' in if ');
         facVal.push(event.currentTarget.dataset.fac);
       console.log('number of facilities  ==>'+JSON.stringify(facVal));

    
      let filteredShiftList = this.unAllocatedTableList.filter(staff => staff.Id === shiftId);
      console.log('shift list'+JSON.stringify(filteredShiftList));
      getStaffHourlyRates({ addShiftList: JSON.stringify(filteredShiftList),startdate:this.startdate,enddate:this.enddate,facilityVal:facVal })
          .then((result) => {
            this.staffHorlyRateList  = JSON.parse(result);
           console.log('Staff hourly rate '+JSON.stringify(this.staffHorlyRateList));
          })
          .catch((error) => {
              console.error('Error fetching staff hourly rates:', error);
          });
  }
  HandleAllocate(event) {
   // console.log('Updated Staff Hourly Rates (Checked Only):', JSON.stringify(this.finalAllocationList));
    // this.headingLabel='Allocate Staff';
    // Creating the allocation JSON using map function
    const exceededStaff = this.finalAllocationList.filter(staff => staff.exceedsLimit==true);
    const setHoursExceeded=this.finalAllocationList.filter(staff => staff.setHoursIndicator==true);
    const exceededNames = exceededStaff.map(staff => staff.fullName);
    const setHoursStaffNames = setHoursExceeded.map(staff => staff.fullName);
    if(setHoursStaffNames.length>0){
            this.setHoursIndicatorflag=true;
            this.isAllocateTable=false;
            this.setHoursIndiactorConfirmation=` ${setHoursStaffNames.join(', ')}`;
    }else{
    // Check if any staff exceed the limit
      if (exceededNames.length > 0) {
            this.fatigueManagementFlag=true;
            this.isAllocateTable=false;
            this.fatigueConfirmationMessge= ` ${exceededNames.join(', ')}`;
        }else{
            this.fatigueManagementFlag=false
            this.fatigueConfirmationMessge;
        //  this.isAllocateTable=true;
            this.handleFinalAllocate();
        } 
    }

   
   
   
  }
  HandleNavigateToFatigue(){
    this.setHoursIndicatorflag=false;
    console.log('finalAllocationList', JSON.stringify(this.finalAllocationList));
    const exceededStaff = this.finalAllocationList.filter(staff => staff.exceedsLimit==true);
    const exceededNames = exceededStaff.map(staff => staff.fullName);
    console.log('exceededStaff', JSON.stringify(exceededStaff));
 
    if (exceededNames.length > 0) {
        this.fatigueManagementFlag=true;
        this.isAllocateTable=false;
        this.fatigueConfirmationMessge= ` ${exceededNames.join(', ')}`;
    }else{
        this.fatigueManagementFlag=false
        this.fatigueConfirmationMessge;
    //  this.isAllocateTable=true;
        this.handleFinalAllocate();
    } 

  }
 handleDeselectStaff(){
    this.fatigueManagementFlag=false;
    this.setHoursIndicatorflag=false;
    this.isAllocateTable=true;
    } 
 handleFinalAllocate(){
     console.log('in final allocate ')
 let allocateStaffJSON = this.finalAllocationList.map(rec => {
        return {
            Id: rec.Id,  
            finalOverallRate: rec.Hourlyrate || 0, 
            attendance:true, 
            isRecurring: false, 
            recurringTill: null,  
            shiftWithStaffs: rec.shiftwithstaff  
        };
    });
   
    console.log('Final Allocated Staff JSON:', JSON.stringify(allocateStaffJSON));
    this.isShowSpinner=false;
    console.log(`shiftDate: ${this.selectedShiftDate}`)
    allocateMultipleStaff({ shiftId: this.selectedShiftId, staffJson: JSON.stringify(allocateStaffJSON),shiftDate:this.selectedShiftDate,shiftwithstaff:[] })
    .then(result => {
      console.log('Result: '+JSON.stringify(result));
      this.confirMationMessage('Success','Shifts are allocated successfully','Success');
      this.fatigueManagementFlag=false;
      this.HandleBack();

    }).catch(err => {
        console.error('Error fetching shift list:', err);
        this.isShowSpinner=false;
        this.fatigueManagementFlag=false;
        this.confirMationMessage('Error','Error Occured while allocating staff','Error');

       }); 
  }
    handleUnAllocatedEdit(event){
      this.isHomeFlag = true;
      this.isUnallocateTable = false;
      this.isAllocateTable = false;
      this.allocateLabel='Update';
      this.savButtonDisable=false;
      this.isEditShitScreen=true;
      this.isNotificationVisible=false;
      this.disableRole=true;
      this.headingLabel='Edit Shift(s)';
      this.disableTimeButton=true;
      this.isVisibleSaveButton=true;
      this.navigateTo='AllocationShifts';
       this.finalSelectedFacilities = this.finalSelectedFacilities;
      const shiftData = this.unAllocatedTableList.find(shift => shift.Id === event.currentTarget.dataset.shiftid);
      console.log('Shift row:', JSON.stringify(shiftData));

      if (shiftData) {
        
          this.addShiftData={
              AddShiftId:shiftData.Id,
              AddShiftStartDate:shiftData.Start_Date__c,
              AddShiftStaffValue:null,
              AddShiftFacilityValue:shiftData.Facility__c,
              AddShiftRole:shiftData.Role__c,
              AddShiftType:shiftData.Shift_Type__c,
              AddShiftBreak:shiftData.Break__c,
              AddShiftDuration:shiftData.Duration__c,
              AddShiftStartTime:this.convertTo24HourFormat(shiftData.Start_Time_Text__c.toLowerCase()),
              AddShiftStartTimeAMPM:shiftData.Start_Time_Text__c.toUpperCase(),
              AddShiftEndTime:this.convertTo24HourFormat(shiftData.End_Time_Text__c),
              AddShiftEndTimeAMPM:shiftData.End_Time_Text__c.toUpperCase(),
              AddShiftnotification:shiftData.Send_Notification__c,
              AddShiftStaffHourlyRate:null,
              AddShiftQuantity:shiftData.Quantity__c,
              AddShiftNotes:shiftData.Shift_Notes__c ?shiftData.Shift_Notes__c:'',
              AddShiftEOI:shiftData.Is_EOI__c  ,
              AddShiftHoliday:shiftData.Is_EOI__c,
              AddShiftEnterOtherLocation:shiftData.Get_Facility__c,
              AddShiftParticipantAddressCheckbox:shiftData.Participant_Address_checkbox__c
                 
          }
          this.isEoICheckBoxVisible=false;
          console.log('eoi check box '+this.isEoICheckBoxVisible);
          this.addNewAddressCheckBox=shiftData.Get_Facility__c;
          this.facilityAddressCheckbox=shiftData.Get_Facility__c ? false:true;
          this.address.street=shiftData.Location__Street__s;
          this.address.citySuburb=shiftData.Location__City__s;
          this.address.postalcode=shiftData.Location__PostalCode__s;
          this.address.provinceState=shiftData.Location__StateCode__s;
          this.address.country=shiftData.Location__CountryCode__s;
          this.AddShiftOriginalQuantity=shiftData.Quantity__c;

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

          console.log('Shift row:', JSON.stringify(this.addShiftData));
      } else {
          console.error('Shift not found for ID:', shiftId);
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
    get iconName() {
      if (this.isListening) {
           return 'utility:unmuted';
      } else {
           return 'utility:muted';
      }
   }
       
    // Alternative text for accessibility
   get altText() {
       if (this.isListening) {
            return 'Unmute';
       } else {
           return 'Mute';
       }
   }
   // Toggle between mute/unmute
   toggleListening() {
       try {
           this.isListening = !this.isListening;
           if (this.isListening) {
               this.startListening();
           } else {
               this.stopListening();
           }
       } catch (error) {
           console.error('Error in toggleListening:', error.message);
       }
   }
   // Show icons when text area gains focus
   handleFocus() {
       console.log('handleFocus executing >>');
       try {
           this.showMuteIcon = true;
           this.isListening = false; // Ensure the state is not in listening mode
           if (this.recognition) {
              this.recognition.stop(); // Stop any ongoing recognition process
              this.recognition = null; // Clear recognition instance
           }
       } catch (error) {
           console.error('Error in handleFocus:', error.message);
       }
   }
   // Start speech recognition
   startListening() {
       try {
           console.log('Listening started...');
           if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
               const SpeechRecognition =
                   window.SpeechRecognition || window.webkitSpeechRecognition;
               const recognition = new SpeechRecognition();
               recognition.lang = 'en-US';
               recognition.continuous = true;
               recognition.interimResults = false;

               recognition.onresult = (event) => {
                   this.addShiftData.AddShiftNotes += Array.from(event.results)
                       .map((result) => result[0].transcript)
                       .join('');
                   this.showClearIcon = true; // Show clear icon after transcription
               };

               recognition.onerror = (event) => {
                   console.error('Error during speech recognition:', event.error);
               };

               recognition.onend = () => {
                   console.log('Recognition ended');
                   this.isListening = false;
               };

               recognition.start();
               this.recognition = recognition;
           } else {
               console.error('SpeechRecognition API not supported by this browser.');
               alert('SpeechRecognition API is not supported in this browser.');
           }
       } catch (error) {
           console.error('Error in startListening:', error.message);
       }
   }

   // Stop speech recognition
   stopListening() {
       try {
           console.log('Listening stopped...');
           if (this.recognition) {
               this.recognition.stop();
               this.recognition = null;
           }
       } catch (error) {
           console.error('Error in stopListening:', error.message);
       }
   }

   // Clear text and hide clear icon
   clearText() {
       try {
        this.addShiftData.AddShiftNotes = '';
           this.showClearIcon = false;
           if (this.isListening) {
               //this.startListening();
               this.stopListening();
               this.addShiftData.AddShiftNotes = '';
              } 
       } catch (error) {
           console.error('Error in clearText:', error.message);
       }
       
   }    
     
}