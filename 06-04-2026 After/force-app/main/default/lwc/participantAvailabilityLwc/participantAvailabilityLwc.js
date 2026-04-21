import { api, LightningElement, track, wire } from "lwc";
import holidayList from "@salesforce/apex/LeaveController.holidayListbyOrg";
import saveShiftData from "@salesforce/apex/StaffAvailabilityController.saveShiftData";
import getParticipantAvailability from "@salesforce/apex/StaffAvailabilityController.getParticipantAvailability";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getServiceType from "@salesforce/apex/StaffAvailabilityController.getServiceType";
import getServicesAndSupportPlansByDate from "@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlansByDate";
//import getCatalogueData from "@salesforce/apex/StaffAvailabilityController.getCatalogueData";
import getCatalogueData from "@salesforce/apex/CatalogueDataHandler.getCatalogueData";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getStaffOptions from "@salesforce/apex/StaffAvailabilityController.getStaffOptions";
import getFacilityAddress from "@salesforce/apex/ClientDataController.getParticipantdetails";
import getFundsData from "@salesforce/apex/RosterCreation.getFundsData";
import USER_ID from "@salesforce/user/Id";
import GOOGLE_API_KEY from "@salesforce/label/c.Google_Geocode_API_Key";
import getcurrentUserType from "@salesforce/apex/UserAccessController.getstaffId2";
import getfacilityById from "@salesforce/apex/FacilityController.getfacilityById";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { deleteRecord } from "lightning/uiRecordApi";
import getNumberOfRecurrences from "@salesforce/apex/RosterCreationRecurringHnadler.getNumberOfRecurrences";
import getShiftsTypeByFacility from "@salesforce/apex/RosterInvoicesHandler.getShiftsTypeByFacility";
import getClientById from "@salesforce/apex/ClientDataController.getClientById";
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
export default class ParticipantAvailabilityLwc extends LightningElement {
  @track userId = USER_ID;
  @track todayDate;
  @track currentDate = new Date();
  @track holidayList = [];
  @track services = [];
  @api clientId;
  @api state;
  @track selectedDate = "";
  @track monthOfDay;
  @track AddShiftEndTimeAMPM;
  @track AddShiftStartTimeAMPM;
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
  @api individualflag;
  @api companyflag;
  @api ndiscreateflag;
  @track shiftTypeOptions = [
    { label: "General", value: "General" },
    { label: "Morning", value: "Morning" },
    { label: "Afternoon", value: "Afternoon" },
    { label: "Night", value: "Night" },
    { label: "Custom", value: "Custom" },
    { label: "Sleepover Shift", value: "Sleepover Shift" }
  ];
  @track recurOptions = [
    { label: "Daily", value: "Daily" },
    { label: "Fortnightly", value: "Fortnightly" },
    { label: "Weekly", value: "Weekly" },
    { label: "Monthly", value: "Monthly" }
  ];
  @track weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];
  @track stateOptions = [
    { label: "ACT", value: "ACT" },
    { label: "NSW", value: "NSW" },
    { label: "NT", value: "NT" },
    { label: "QLD", value: "QLD" },
    { label: "SA", value: "SA" },
    { label: "TAS", value: "TAS" },
    { label: "VIC", value: "VIC" },
    { label: "WA", value: "WA" }
  ];
  @track priorityOptions = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" }
  ];
  @track sectionFlags = {
    staffDetails: true,
    staffDetails1: true
  };

  @track sectionIcons = {
    staffDetails: "\u2B9F",
    staffDetails1: "\u2B9F"
  };
  @track recurEndDate = "";
  @track selectedDays = [];
  @track monthLyOptions = [];
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
  @track startTimeSelectedMinute;
  @track startTimeSelectedHour;
  @track startTimeAMPM;
  @track endTimeAMPM;
  @track endTimeSelectedMinute;
  @track endTimeSelectedHour;
  @track facilityAddressCheckbox = false;
  @track participantAddressCheckBox = false;
  @track addNewAddressCheckBox = false;
  @track typeofAddress = "";
  @track street;
  @track city;
  @track country;
  @track province;
  @track postalCode;
  @track disablePostInsertButtons = false;
  @track staffList = [];
  @track DeleteFlag = false;
  @track availabilityId;
  @track facilityId;
  @track fieldErrorMap = {};
  @track recurrenceDates = [];
  @track totalRecurrences = 0;
  @track successmessage;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  @track shiftTypeValue;
  @track shiftNameValue;
  @track clientFacilityId;
  @track maxDuration = 0;
  @track quantity='';
  @ track participantflag =true;//manendra
 // _companyflag = false; // private variable for getter/setter
 @track participantFaciltiyOptions =[];

  @wire(getClientById, { recordId: "$clientId" })
  wiredClient({ error, data }) {
    console.log("▶ Wired method called");
    console.log("RecordId passed:", this.recordId);

    if (data) {
      console.log("✅ Data received from Apex:", JSON.stringify(data));
      this.client = data[0]; // since your method returns a list, pick the first record
      console.log("👉 Extracted client:", JSON.stringify(this.client));
      const participantFacilities =this.client.Participant_Facilities__r || [];

        console.log('Participant Facilities ==> ',JSON.stringify(participantFacilities));

      // Build options for UI (combobox / radio / etc.)
      this.participantFaciltiyOptions = participantFacilities.map(pf => ({
          label: pf.Facility__r?.Name,
          value: pf.Facility__c
      }));

      // Optionally set default facility
      if (this.participantFaciltiyOptions.length > 0) {
          this.clientFacilityId = this.participantFaciltiyOptions[0].value;
      }
     // this.clientFacilityId = this.client.Facility__c;
      console.log("🏢 Facility Id stored:", this.clientFacilityId);
      /* this.fetchShiftData(); */
      this.processShifts();
      this.error = undefined;
    } else if (error) {
      console.error("❌ Error received from Apex:", error);
      this.error = error;
      this.client = undefined;
    }
  }

  async connectedCallback() {
    try {
      const userData = await getCurrentLoggedUserInfo();
      console.log("user data ==>", JSON.stringify(userData));
      
          const userType = userData.User_Type__c;
          console.log('userType check',userType);
          if(userType == 'NDIS Participants'){
          this.participantflag = false;
        }//manendra
      // Fetch holidays if state exists
      if (this.state != null) {
        console.log("📌 Holidays in Connected Callback:", this.state);
        this.fetchHolidays();
      }
      this.participantPreferredName =
        localStorage.getItem("defaultParticipantPreferredName") ||
        "Participant";
      this.facilityPreferredName =
        localStorage.getItem("defaultFacilityPreferredName") || "Facility";
      this.staffPreferredName =
        localStorage.getItem("defaultStaffPreferredName") || "Staff";
      // Fetch other data
      this.fetchServices();
      // this.fetchAvailability();
      this.recurEveryOptions = this.generateOptionsdaily(30);
      this.monthLyOptions = this.generateDateOptions(31);
      this.generateTimeOptions();

      // console.log("📌 Fetching Facility Data...");
      const response = await getFacilityData();

      // Map facility options for combo box
      this.facilityOptions = response.map((record) => ({
        value: record.Id,
        label: record.Name,
        service: record.Type_of_Service__c
      }));
      console.log(
        "✅ Facility Data fetched:",
        JSON.stringify(this.facilityOptions)
      );

      // Save organisation shift times
      this.organisationShiftTimes = response[0].Organisation__r;
      /*   console.log(
        "🏢 Organisation Shift Times:",
        JSON.stringify(this.organisationShiftTimes)
      ); */

      // Select default facility
      if (this.facilityOptions.length > 0) {
        this.facilityValue = this.facilityOptions[0].value; // single Id
        this.SelectedComboBoxFacility = this.facilityOptions[0].value;
        console.log(
          "📌 Default Facility Selected:",
          this.SelectedComboBoxFacility
        );

        // Fetch shift data for the selected facility
        console.log(
          "📌 Fetching Shift Data for facilityId:",
          this.facilityValue
        );
        /* const shifts = await this.fetchShiftData(); */
        // console.log("✅ Shift Data fetched:", JSON.stringify(shifts));
        /* this.processShifts(this.facilityValue); */
      }
    } catch (err) {
      console.error("❌ Error in connectedCallback:", err);
    }
  }

  async fetchShiftData() {
    console.log(
      "📌 fetchShiftData called with facilityId:",
      this.clientFacilityId
    );
    try {
      // ✅ Pass parameter correctly
      const data = await getShiftsTypeByFacility({
        facilityId: this.clientFacilityId
      });

      console.log("📌 Shifts fetched successfully:", JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("❌ Error fetching shifts:", error);
      this.shiftNameOptions = [];
      throw error; // rethrow so caller can handle
    }
  }

  async processShifts() {
    try {
      const data = await this.fetchShiftData();
      //console.log("📌 Fetched Shift TYPE Records:", JSON.stringify(data));
     this.shiftNameOptions = [];
      this.shiftNameOptions = data.map((option) => ({
        ...option,
        label: option.Name,
        value: option.Id
      }));

      // 🔑 Build colour map (shiftName -> colour)
      this.shiftColourMap = new Map();
      this.shiftNameOptions.forEach((shift) => {
        if (shift.Colour__c) {
          this.shiftColourMap.set(shift.Id, shift.Colour__c);
        }
      });

      /*  console.log(
        "📌 shiftNameOptions:",
        JSON.stringify(this.shiftNameOptions)
      ); */
      // console.log("📌 shiftColourMap:", this.shiftColourMap);
      this.fetchAvailability();
    } catch (err) {
      console.error("❌ Error in processShifts:", JSON.stringify(err));
    }
  }

  async handleShiftNamechange(event) {
    this.shiftNameValue = event.detail.value; // selected Id
    //    console.log("📌 Selected Shift Name Id:", this.shiftNameValue);

    const selectedOption = this.shiftNameOptions.find(
      (option) => option.value === this.shiftNameValue
    );

    if (selectedOption) {
      console.log("📌 Selected Option:", JSON.stringify(selectedOption));

      // Store Shift_Type__c into shiftTypeValue
      this.shiftTypeValue = selectedOption.Shift_Type__c;
      console.log("📌 Selected Shift Type:", this.shiftTypeValue);

      this.maxDuration = selectedOption.Duration__c;
      console.log("📌 Selected Shift Duration:", this.maxDuration);

      // ✅ Filter by selected shift Id
      let shifNames = this.shiftNameOptions.filter(
        (rec) => rec.value === this.shiftNameValue
      );
      await this.getserviceTypes();
      // Call with the correct shift
      this.getShiftTimingsByFacility(shifNames);
    }
  }

  getShiftTimingsByFacility(shifNames) {
    try {
      console.log(
        "📌 Shift timings IN FACILITY timings:",
        JSON.stringify(shifNames)
      );

      if (!shifNames || shifNames.length === 0) {
        console.warn("⚠️ No shift names provided");
        return;
      }

      const shift = shifNames[0];

      // Convert milliseconds to HH:mm
      const startTime24 = this.formatMillisecondsToTime(shift.Start_Time__c);
      const endTime24 = this.formatMillisecondsToTime(shift.End_Time__c);
      console.log("➡️ Raw Start Time (24hr):", startTime24);
      console.log("➡️ Raw End Time (24hr):", endTime24);

      // Convert to AM/PM object
      const startAmPm = this.convertToAmPmObject(startTime24);
      const endAmPm = this.convertToAmPmObject(endTime24);
      console.log("🕑 Start Time AM/PM Object:", JSON.stringify(startAmPm));
      console.log("🕑 End Time AM/PM Object:", JSON.stringify(endAmPm));

      // Set ISO and AM/PM display values
      this.AddShiftStartTime = startTime24 ? `${startTime24}:00Z` : "00:00:00Z";
      this.AddShiftEndTime = endTime24 ? `${endTime24}:00Z` : "00:00:00Z";
      this.AddShiftStartTimeAMPM = startAmPm.displayTime;
      this.AddShiftEndTimeAMPM = endAmPm.displayTime;

      console.log("✅ Final Start Time (ISO):", this.AddShiftStartTime);
      console.log("✅ Final End Time (ISO):", this.AddShiftEndTime);
      console.log("✅ Display Start Time (AM/PM):", this.AddShiftStartTimeAMPM);
      console.log("✅ Display End Time (AM/PM):", this.AddShiftEndTimeAMPM);

      // Display formatting method
      this.dispalyAmPMFormat();
    } catch (error) {
      console.error("❌ Error in getShiftTimingsByFacility:", error);
    }
  }

  dispalyAmPMFormat() {
    console.log("⚡ Inside dispalyAmPMFormat()");

    if (this.AddShiftStartTimeAMPM) {
      let [time, period] = this.AddShiftStartTimeAMPM.split(" ");
      let [startHour, startMinute] = time.split(":");
      this.startTimeSelectedHour = startHour;
      this.startTimeSelectedMinute = startMinute;
      this.startTimeAMPM = period == "AM" ? "AM" : "PM";

      console.log(
        "🟢 Start Time Parsed → Hour:",
        startHour,
        "Minute:",
        startMinute,
        "Period:",
        period
      );
    }

    if (this.AddShiftEndTimeAMPM) {
      let [time, period] = this.AddShiftEndTimeAMPM.split(" ");
      let [endHour, endMinute] = time.split(":");
      this.endTimeSelectedHour = endHour;
      this.endTimeSelectedMinute = endMinute;
      this.endTimeAMPM = period == "AM" ? "AM" : "PM";

      console.log(
        "🔴 End Time Parsed → Hour:",
        endHour,
        "Minute:",
        endMinute,
        "Period:",
        period
      );
    }
  }

  convertToAmPmObject(time24) {
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    if (hour === 0) hour = 12;
    else if (hour > 12) hour = hour - 12;

    return {
      selectedHour: hour.toString().padStart(2, "0"),
      selectedMinute: minute.toString().padStart(2, "0"),
      selectedAmPm: ampm,
      displayTime: `${hour.toString().padStart(2, "0")}:${minuteStr} ${ampm}`
    };
  }

  formatMillisecondsToTime(ms) {
    console.log(`formatMillisecondsToTime called with ms: ${ms}`);

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");

    const formattedTime = `${hh}:${mm}`;

    console.log(`Formatted Time in function: ${formattedTime}`);

    return formattedTime;
  }

  /*  handleErrorCss(event) {
    const field = event.target.name;
    const isValid = event.target.checkValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
} */

  getFieldClass(fieldName) {
    return this.fieldErrorMap[fieldName] ? "floating-label1" : "floating-label";
  }
  get RerecurEndDateClass() {
    return this.getFieldClass("recurEndDate");
  }

  daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  get monthName() {
    return this.currentDate.toLocaleString("default", { month: "long" });
  }

  get year() {
    return this.currentDate.getFullYear();
  }
  get monthAndYear() {
    return this.currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });
  }

  generateOptions(max) {
    const options = [];
    for (let i = 1; i <= max; i++) {
      // Starting from 1 for more realistic options
      options.push({ label: `${i}`, value: `${i}` });
    }
    this.recurEveryOptions = options;
    console.log(
      "this.recurEveryOptions >> " + JSON.stringify(this.recurEveryOptions)
    );
    return options;
  }

  generateOptionsdaily(max) {
    const options = [];

    for (let i = 1; i <= max; i++) {
      let label = '';

      switch (i) {
        case 1:
          label = 'Everyday';
          break;
        case 2:
          label = 'Alternate Days';
          break;
        default:
          label = `Every ${i}th Day`;
          break;
      }

      // handle 3rd, 4th, 5th with correct suffix
      if (i > 2) {
        const j = i % 10,
          k = i % 100;
        if (j === 1 && k !== 11) label = `Every ${i}st Day`;
        else if (j === 2 && k !== 12) label = `Every ${i}nd Day`;
        else if (j === 3 && k !== 13) label = `Every ${i}rd Day`;
        else label = `Every ${i}th Day`;
      }

      options.push({ label, value: `${i}` });
    }

    this.recurEveryOptions = options;
    console.log("this.recurEveryOptions >> " + JSON.stringify(this.recurEveryOptions));
    return options;
  }

  generateWeeklyOptions(max) {
    const options = [];

    for (let i = 1; i <= max; i++) {
      let label = '';

      switch (i) {
        case 1:
          label = 'Every Week';
          break;
        default:
          // Add correct ordinal suffix for week numbers
          const j = i % 10,
            k = i % 100;
          if (j === 1 && k !== 11) label = `Every ${i}st Week`;
          else if (j === 2 && k !== 12) label = `Every ${i}nd Week`;
          else if (j === 3 && k !== 13) label = `Every ${i}rd Week`;
          else label = `Every ${i}th Week`;
          break;
      }

      options.push({ label, value: `${i}` });
    }

    this.recurWeeklyOptions = options;
    console.log(
      "this.recurWeeklyOptions >> " + JSON.stringify(this.recurWeeklyOptions)
    );
    return options;
  }

  generateFortnightlyOptions(max) {
    const options = [];

    for (let i = 1; i <= max; i++) {
      let label = '';

      switch (i) {
        case 1:
          label = 'Every Fortnight';
          break;
        default:
          // Correct suffix logic
          const j = i % 10,
            k = i % 100;
          if (j === 1 && k !== 11) label = `Every ${i}st Fortnight`;
          else if (j === 2 && k !== 12) label = `Every ${i}nd Fortnight`;
          else if (j === 3 && k !== 13) label = `Every ${i}rd Fortnight`;
          else label = `Every ${i}th Fortnight`;
          break;
      }

      options.push({ label, value: `${i}` });
    }

    this.recurFortnightlyOptions = options;
    console.log(
      'this.recurFortnightlyOptions >> ' + JSON.stringify(this.recurFortnightlyOptions)
    );
    return options;
  }

  generateMonthlyOptions(max) {
    const options = [];

    for (let i = 1; i <= max; i++) {
      let label = '';

      switch (i) {
        case 1:
          label = 'Every Month';
          break;
        default:
          // Correct suffix logic
          const j = i % 10,
            k = i % 100;
          if (j === 1 && k !== 11) label = `Every ${i}st Month`;
          else if (j === 2 && k !== 12) label = `Every ${i}nd Month`;
          else if (j === 3 && k !== 13) label = `Every ${i}rd Month`;
          else label = `Every ${i}th Month`;
          break;
      }

      options.push({ label, value: `${i}` });
    }

    this.recurMonthlyOptions = options;
    console.log(
      'this.recurMonthlyOptions >> ' + JSON.stringify(this.recurMonthlyOptions)
    );
    return options;
  }

  generateDateOptions(max) {
    const options = [];

    for (let i = 1; i <= max; i++) {
      let label = '';

      // Determine correct suffix (st, nd, rd, th)
      const j = i % 10,
        k = i % 100;
      if (j === 1 && k !== 11) label = `${i}st of the Month`;
      else if (j === 2 && k !== 12) label = `${i}nd of the Month`;
      else if (j === 3 && k !== 13) label = `${i}rd of the Month`;
      else label = `${i}th of the Month`;

      options.push({ label, value: `${i}` });
    }

    this.recurDateOptions = options;
    console.log(
      "this.recurDateOptions >> " + JSON.stringify(this.recurDateOptions)
    );
    return options;
  }

  generateTimeOptions() {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        const minuteStr = minute.toString().padStart(2, "0");
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

    /* const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; */

    const today = new Date();
    const todayStr1 = today.toLocaleDateString("en-CA");
    console.log("✅ Today:", todayStr1);

    /* const today1 = new Date();
    today.setDate(today1.getDate() - 1);
    const todayStr1 = today.toLocaleDateString("en-CA"); //today1.toISOString().split("T")[0];
    console.log("📅 Current Month:", month + 1, "Year:", year);
    console.log("✅ Today:", todayStr1); */

    // Normalize holiday dates
    const holidayMap = new Map();
    this.holidayList.forEach((holiday) => {
      const date = holiday.Date__c?.split("T")[0];
      console.log("🎉 Holiday record:", holiday.Holiday_Name__c, "Date:", date);
      if (!holidayMap.has(date)) {
        holidayMap.set(date, []);
      }
      holidayMap.get(date).push(holiday.Holiday_Name__c);
    });
    console.log("✔️ Final Holiday Map:", [...holidayMap.entries()]);

    // Normalize service dates
    const serviceMap = new Map();
    // console.log("this.services >>>", this.services);
    this.services.forEach((service) => {
      //  console.log("this.services >>>", service);
      const date = service.Date_of_Service__c?.split("T")[0];
      /*  console.log(
        "🛠 Service record:",
        service.Resource_Name__c,
        "Date:",
        date,
        "Start:",
        service.start_datetime__c,
        "End:",
        service.end_datetime__c
      ); */
      const shiftname = service.ShiftwithStaff__r.Add_Shift__r.Shift_Name__c;
      const shiftColor =
        this.shiftColourMap &&
        this.shiftColourMap.size > 0 &&
        this.shiftColourMap.has(shiftname)
          ? this.shiftColourMap.get(shiftname)
          : "#0099de";
      const colourWithAlpha = shiftColor + "2e";
      console.log("shiftcolor", shiftColor);
      if (!serviceMap.has(date)) {
        serviceMap.set(date, []);
      }
      serviceMap.get(date).push({
        type: "service",
        hyper: false,
        name: service.Resource_Name__c,
        time: `${this.formatTime1(service.start_datetime__c)} - ${this.formatTime1(service.end_datetime__c)}`,
        style: `background-color: ${colourWithAlpha}; color: ${shiftColor}; border-left: 4px solid ${shiftColor}; border-radius: 6px; width: 100%; text-align: left; padding-left: 2px; margin-top: 5px;`
      });
    });
    console.log("✔️ Final Service Map:", [...serviceMap.entries()]);

    // Normalize availability dates
    const availabilityMap = new Map();
    this.availability.forEach((slot) => {
      const date = slot.Start_Date__c?.split("T")[0];
      const shiftname = slot.Shift_Name__c;
      console.log(
        "📌 Availability record:",
        slot.Shift_Type__c,
        "Date:",
        date,
        "Start:",
        slot.Start_Time__c,
        "End:",
        slot.End_Time__c
      );
      //const shiftColor = this.shiftColourMap.get(shiftname) || "#0099de";
      console.log(
        "ShiftcolorMap >>>",
        this.shiftColourMap.has(slot.Shift_Name__c)
      );
      const shiftColor =
        this.shiftColourMap &&
        this.shiftColourMap.size > 0 &&
        this.shiftColourMap.has(slot.Shift_Name__c)
          ? this.shiftColourMap.get(slot.Shift_Name__c)
          : "#0099de";
      const colourWithAlpha = shiftColor + "2e";
      console.log("shiftcolor", shiftColor);

      if (!availabilityMap.has(date)) {
        availabilityMap.set(date, []);
      }
      availabilityMap.get(date).push({
        type: "availability",
        id: slot.Id,
        hyper: true,
        name: slot.Shift_Type__c,
        time: `${this.formatTime(slot.Start_Time__c)} - ${this.formatTime(slot.End_Time__c)}`,
        shiftColor,
        style: `background-color: ${colourWithAlpha}; color: ${shiftColor}; border-left: 4px solid ${shiftColor}; border-radius: 6px; width: 100%; text-align: left; padding-left: 2px; margin-top: 5px;`
      });
    });
    console.log("✔️ Final Availability Map:", [...availabilityMap.entries()]);

    // Empty cells before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      console.log(`⬜ Empty slot before day 1: index=${i}`);
      days.push({
        key: `empty-${i}`,
        date: "",
        class: "day-cell empty",
        tooltip: ""
      });
    }

    // Actual calendar days
    for (let i = 1; i <= totalDays; i++) {
      const fullDate = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

      const isHoliday = holidayMap.has(dateStr);
      const isToday = dateStr === todayStr1;
      const services = serviceMap.get(dateStr) || [];
      const availabilitySlots = availabilityMap.get(dateStr) || [];
      const allEntries = [...services, ...availabilitySlots];

      let cellClass = "day-cell";
      if (isHoliday) {
        cellClass += " holiday"; // ✅ Highest priority
      } else if (isToday) {
        cellClass += " today"; // ✅ Next priority
      } else {
        if (allEntries.length > 0) {
          cellClass += " has-service";
        } else {
          cellClass += " no-service";
        }
      }
      /* 
      console.log(
        `📆 Day: ${i} | Date: ${dateStr} | Holiday: ${isHoliday} | Today: ${isToday} | Services: ${services.length} | Availability: ${availabilitySlots.length} | Entries: ${allEntries.length} | Class: ${cellClass}`
      );
 */
      days.push({
        key: `day-${i}`,
        date: i,
        dateStr,
        class: cellClass,
        tooltip: isHoliday
          ? `Holiday: ${holidayMap.get(dateStr).join(", ")}`
          : "",
        holidayName: isHoliday ? holidayMap.get(dateStr).join(", ") : "",
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
        console.log(`⬜ Empty slot after month end: index=${i}`);
        days.push({
          key: `empty-end-${i}`,
          date: "",
          class: "day-cell empty",
          tooltip: ""
        });
      }
    }

    console.log("📊 Final Days Array:", days);
    return days;
  }

  handleDeleteFlag(event) {
    this.availabilityId = event.currentTarget.dataset.id;
    console.log("recordId" + this.availabilityId);
    this.DeleteFlag = true;
  }
  handledeleteclose() {
    this.DeleteFlag = false;
    this.availabilityId = "";
  }
  confirmDelete() {
    deleteRecord(this.availabilityId)
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Shift deleted successfully.",
            variant: "success"
          })
        );
        this.isPopoverVisible = false;
        this.fetchHolidays();
        this.fetchServices();
        this.fetchAvailability();
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error deleting record",
            message: error.body.message,
            variant: "error"
          })
        );
      });
    this.DeleteFlag = false;
  }

  prevMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.isPopoverVisible = false;
    this.fetchHolidays();
    this.fetchServices();
    this.fetchAvailability();
  }

  nextMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
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
    const formattedDate = this.currentDate.toISOString().split("T")[0];
    console.log(formattedDate);
    console.log(this.state);
    if (formattedDate && this.state) {
      holidayList({ datePicker: formattedDate, state: this.state })
        .then((response) => {
          this.holidayList = response;
          console.log(JSON.stringify(this.holidayList));
        })
        .catch((error) => {
          console.error("Error fetching holiday list:", error);
        });
    }
  }

  fetchServices() {
    const formattedDate = this.currentDate.toISOString().split("T")[0];
    getServicesAndSupportPlansByDate({
      clientId: this.clientId,
      datePicker: formattedDate
    })
      .then((response) => {
        this.services = response;
        //console.log("services", JSON.stringify(this.services));
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
      });
  }

  fetchAvailability() {
    const formattedDate = this.currentDate.toISOString().split("T")[0];
    getParticipantAvailability({
      clientId: this.clientId,
      datePicker: formattedDate
    })
      .then((response) => {
        this.availability = response;
        console.log(
          "participant availability" + JSON.stringify(this.availability)
        );
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
      });
  }

  // handleServiceClick(event) {
  //  let mouseX = event.clientX;
  //     let mouseY = event.clientY;
  //     let tooltipWidth = 150; // Approximate width of tooltip
  //     let offsetX = 10; // Small gap from cursor
  //     let leftPosition = mouseX - tooltipWidth - offsetX;
  //     if (leftPosition < 0) {
  //       leftPosition = 10; // Keep a minimum margin from the left edge
  //   }

  //     this.popupStyle = `top: ${mouseY - 117}px; left: ${leftPosition-240}px;`;
  //     console.log('style'+this.popupStyle);
  //     const date = event.currentTarget.dataset.date;
  //     console.log(date);
  //     const serviceMap = new Map();

  //     this.services.forEach(service => {
  //         const dateKey = service.Date_of_Service__c;
  //         if (!serviceMap.has(dateKey)) {
  //             serviceMap.set(dateKey, []);
  //         }
  //         serviceMap.get(dateKey).push(service);
  //     });

  //     const servicesForDate = serviceMap.get(date) || [];

  //     // Format start and end datetime to 12-hour format
  //     this.selectedServices = servicesForDate.map(service => {
  //         return {
  //             ...service,
  //             formattedStart: this.formatTime1(service.start_datetime__c),
  //             formattedEnd: this.formatTime1(service.end_datetime__c)
  //         };
  //     });
  // console.log('SERVICES'+JSON.stringify(this.selectedServices));
  // console.log('AVAILABILITY'+JSON.stringify(this.availability));

  //      const availabilityMap = new Map();
  //     this.availability.forEach(available => {
  //         const dateKey = available.Start_Date__c;
  //         if (!availabilityMap.has(dateKey)) {
  //             availabilityMap.set(dateKey, []);
  //         }
  //         availabilityMap.get(dateKey).push(available);
  //     });

  //     const availableForDate = availabilityMap.get(date) || [];

  //     // Format start and end datetime to 12-hour format
  //     this.selectedavailability = availableForDate.map(available => {
  //         return {
  //             ...available,
  //             formattedStart: this.formatTime(available.Start_Time__c),
  //             formattedEnd: this.formatTime(available.End_Time__c)
  //         };
  //     });
  //     console.log('AVAILABILITY'+JSON.stringify(this.selectedavailability));
  //     const dateObj = new Date(date);
  //     this.selectedDate = dateObj.toLocaleDateString('en-GB');
  //     this.isPopoverVisible = true;
  // }

  handleServiceClick(event) {
    try {
      console.log("Clicked Service 'more'");

      // Find the nearest clickable element (in case inner <i> was clicked)
      const clickedElement = event.target.closest("a[data-date]");
      if (!clickedElement) {
        console.warn("Clicked element does not have data-date attribute.");
        return;
      }

      // Get bounding rectangle of the clicked link
      const rect = clickedElement.getBoundingClientRect();
      const tdTop = rect.top + window.scrollY;
      const tdLeft = rect.left + window.scrollX;
      const tdHeight = rect.height;
      const tdWidth = rect.width;

      // Modal height in viewport units
      const modalHeightVh = 0.26 * window.innerHeight;
      const spacing = 8;
      const viewportHeight = window.innerHeight;

      // Calculate available space above and below
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Vertical placement logic
      let topPosition;
      if (spaceBelow >= modalHeightVh + spacing) {
        topPosition = tdTop + tdHeight + spacing; // show below
      } else if (spaceAbove >= modalHeightVh + spacing) {
        topPosition = tdTop - modalHeightVh - spacing; // show above
      } else {
        topPosition = tdTop + tdHeight + spacing; // fallback
      }

      // Set popup style
      this.popupStyle = `position: fixed;
                           top: ${topPosition}px;
                           left: ${tdLeft}px;
                           width: ${tdWidth}px;
                           height: 30vh;
                           z-index: 1000;`;

      console.log("Popup style:", this.popupStyle);

      console.log("style" + this.popupStyle);
      const date = event.currentTarget.dataset.date;
      console.log(date);
      const serviceMap = new Map();

      this.services.forEach((service) => {
        const dateKey = service.Date_of_Service__c;
        if (!serviceMap.has(dateKey)) {
          serviceMap.set(dateKey, []);
        }
        serviceMap.get(dateKey).push(service);
      });

      const servicesForDate = serviceMap.get(date) || [];

      // Format start and end datetime to 12-hour format
      this.selectedServices = servicesForDate.map((service) => {
        return {
          ...service,
          formattedStart: this.formatTime1(service.start_datetime__c),
          formattedEnd: this.formatTime1(service.end_datetime__c)
        };
      });
      console.log("SERVICES" + JSON.stringify(this.selectedServices));
      console.log("AVAILABILITY" + JSON.stringify(this.availability));

      const availabilityMap = new Map();
      this.availability.forEach((available) => {
        const dateKey = available.Start_Date__c;
        if (!availabilityMap.has(dateKey)) {
          availabilityMap.set(dateKey, []);
        }
        availabilityMap.get(dateKey).push(available);
      });

      const availableForDate = availabilityMap.get(date) || [];

      // Format start and end datetime to 12-hour format
      this.selectedavailability = availableForDate.map((available) => {
        return {
          ...available,
          formattedStart: this.formatTime(available.Start_Time__c),
          formattedEnd: this.formatTime(available.End_Time__c)
        };
      });
      console.log("AVAILABILITY" + JSON.stringify(this.selectedavailability));
      const dateObj = new Date(date);
      this.selectedDate = dateObj.toLocaleDateString("en-GB");
      this.isPopoverVisible = true;
    } catch (error) {
      console.error("❌ Error in handleServiceClick:", error);
    }
  }

  closePopover() {
    this.isPopoverVisible = false;
  }

  formatTime1(dateTimeStr) {
    //console.log('dateTimeStr >> ' + dateTimeStr);

    const dateObj = new Date(dateTimeStr);
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12 || 12; // Converts 0 to 12

    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");
    //console.log('Time >> '+ hh + ''+ mm + ''+period);
    return `${hh}:${mm} ${period}`;
  }

  formatTime(dateTimeStr) {
    //console.log('dateTimeStr >> ' + dateTimeStr);

    const totalSeconds = Math.floor(dateTimeStr / 1000);
    const hours24 = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    // Convert to 12-hour format
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    const hh = hours12.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");

    return `${hh}:${mm} ${period}`;
  }

  handleSectionToggle(event) {
    const sectionId = event.currentTarget.dataset.id;
    const sectionElement = this.template.querySelector(
      `[data-section="${sectionId}"]`
    );

    if (!this.sectionFlags[sectionId]) {
      // First click: Set the section to true so it loads in the DOM
      this.sectionFlags[sectionId] = true;
    } else {
      // From second click onwards: Just toggle the hidden-section class
      sectionElement.classList.toggle("hidden-section");
    }

    // Toggle the icon dynamically
    this.sectionIcons[sectionId] = sectionElement.classList.contains(
      "hidden-section"
    )
      ? "\u2B9C"
      : "\u2B9F";
  }

  async getserviceTypes() {
    console.log("shiftNameValue ==>:", this.shiftNameValue);
    this.serviceTypeOptions = [];
    this.serviceEditGroupName = [];
    getServiceType({ clientId: this.clientId })
      .then((result) => {
        this.serviceTypeOptions = result;
        console.log("Data received:", result);
        console.log("participant facility ==> " + this.clientFacilityId);
        const participantFacility = this.facilityOptions.find(
          (f) => f.value === this.clientFacilityId
        );
        let isNdisService = participantFacility?.service === "NDIS";
        /* if ((isNdisService == false && this.serviceTypeOptions[0].label.includes ("Other"))  || (isNdisService == true &&   this.serviceTypeOptions[0].label.includes("Miscellaneous") )) {

               this.serviceTypevalue =  this.serviceTypeOptions.length==1 ? this.serviceTypeOptions[0].value :'';
                this.refreshCatalogueData();
         } */
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }
//vamshi added line 1127
  handleAddDescription(event) {
    console.log('....',this.individualflag);
    this.quantity='';
    
    if (this.individualflag) {
           // this.showErrorToast('Action not allowed for individual records.');
           this.dispatchEvent(
        new ShowToastEvent({
          title: "No Access.",
          message:
            "For Participant Type: Individual",
          variant: "info", // 👈 No 'mode' means default: dismissible
          
        })
      );
      
            return;

        }
 
    this.fieldErrorMap = {};
    this.successmessage = "Shift created successfully.";
    this.isPopoverVisible = false;
    const selectedDate = event.currentTarget.dataset.date;
    console.log("Selected Date:", selectedDate);
    console.log("clientId " + this.clientId);
    this.todayDate = selectedDate;
    if (this.clientId) {
      this.getserviceTypes();
    }
    this.loadOrganizationDetails();
    this.editButtonModule = true;
    this.buttonTitle = "Create Shift";
    this.isCreateMode = true;
    this.isUpdateMode = false;
  }
//vamshi 1160- to 1164
   handleQuantityChange(event) { 
    this.quantity = event.target.value;
     console.log('Quantity updated: avg', this.quantity);
     }
    

  handleClose() {
    this.editButtonModule = false;
    this.DeleteFlag = false;
    this.availabilityId = "";
    this.resetFields();
    this.cleardata();
  }

  handleShiftTypechange(event) {
    this.shiftTypeValue = event.detail.value;
    console.log("Selected Shift Type:", this.shiftTypeValue);
    console.log("Selected Shift Type:", this.shiftTypeValue);

    // Call Apex method
    getcurrentUserType({ userId: USER_ID })
      .then((result) => {
        console.log("✅ Apex Result:", result);
        console.log("Staff:", result.staff);
        console.log("Type of User:", result.typeOfUser);
        console.log("User Type:", result.Usertype);

        // You can access result.staff and result.typeOfUser here
        const staffRecord = result.staff;
        const typeofUser = result.typeOfUser;
        const userType = result.Usertype;
          
        if (userType == "NDIS Org Admin") {
          // Optional: Call another method
          this.getOrganisationTimings();
        } else {
          getFacilityAddress({ clientId: this.clientId })
            .then((result) => {
              console.log("facility address", JSON.stringify(result));

              const facility = result;
              if (facility) {
                const facilityDetails = facility.Facility__r;
                console.log("facilityDetails >>", JSON.stringify(facility));
                this.facilityId = facility.Facility__r.Id;
                console.log("this.facilityId >>", this.facilityId);
                this.getOrganisationTimingsRosterOrFacilityAdmin();
              } else {
                console.warn("Facility__r is missing in the result");
              }
            })
            .catch((error) => {
              console.error("Error fetching facility address:", error);
            });
        }
      })
      .catch((error) => {
        console.error("❌ Error getting staff and user type:", error);
      });
  }

  getAdjustedDate(startDateStr) {
    console.log("this.today >> " + this.todayDate);
    console.log("this.shiftTypeValue >> " + this.shiftTypeValue);
    console.log("this.AddShiftStartTimeAMPM >>", this.AddShiftStartTimeAMPM);
    console.log("this.AddShiftEndTimeAMPM >> ", this.AddShiftEndTimeAMPM);
    console.log("Input Date String:", startDateStr);

    const shiftType = this.shiftTypeValue;
    const startAMPM = this.AddShiftStartTimeAMPM?.trim()
      .split(" ")[1]
      ?.toUpperCase();
    const endAMPM = this.AddShiftEndTimeAMPM?.trim()
      .split(" ")[1]
      ?.toUpperCase();

    const dateWithTime = `${startDateStr}T06:00:00`;
    const date = new Date(dateWithTime);
    console.log("Parsed Date Object:", date);

    if (["Night", "Custom", "Sleepover Shift"].includes(shiftType)) {
      if (endAMPM === "AM") {
        if (
          (startAMPM === "AM" && endAMPM === "AM") ||
          (startAMPM === "PM" && endAMPM === "AM")
        ) {
          date.setDate(date.getDate() + 1);
          console.log(
            "Shift ends in AM and does not follow AM-PM pair — adding +1 day"
          );
        } else {
          console.log("Shift starts in AM and ends in PM — no date adjustment");
        }
      } else {
        console.log("End time is PM — no date adjustment");
      }
    } else {
      console.log(
        "Shift type is not Custom/Night/Sleep over — no date adjustment"
      );
    }

    const result = date.toISOString().split("T")[0];
    this.endDate = result;
    console.log("Final Adjusted Date:", result);
    console.log("Final Adjusted Date:", this.endDate);
    return result;
  }

  getOrganisationTimings() {
    this.cutsomShiftTemplate = false;
    this.IsLongShift = false;
    switch (this.shiftTypeValue) {
      case "Morning":
        this.AddShiftStartTimeAMPM =
          this.organisationShiftTimes.Morning_Shift_Start_Time__c.toUpperCase();
        this.AddShiftEndTimeAMPM =
          this.organisationShiftTimes.Morning_Shift_End_Time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Morning_Shift_Start_Time__c.toLowerCase()
        );
        this.AddShiftEndTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Morning_Shift_End_Time__c.toLowerCase()
        );
        this.disableTimeButton = true;
        console.log(
          "this.AddShiftStartTimeAMPM==>" + this.AddShiftStartTimeAMPM
        );
        console.log("this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM);
        this.endDate = this.todayDate;
        const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
        this.endTimeSelectedMinute = endtimeDetails.minute;
        this.endTimeSelectedHour = endtimeDetails.hour;
        this.endTimeAMPM = endtimeDetails.ampm;

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetails = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetails.minute;
        this.startTimeSelectedHour = starttimeDetails.hour;
        this.startTimeAMPM = starttimeDetails.ampm;
        break;

      case "Afternoon":
        this.AddShiftStartTimeAMPM =
          this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toUpperCase();
        this.AddShiftEndTimeAMPM =
          this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toLowerCase()
        );
        this.AddShiftEndTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toLowerCase()
        );
        this.disableTimeButton = true;
        //this.checkFatigue();
        this.endDate = this.todayDate;
        const endtimeDetailsAfternoon = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsAfternoon.minute;
        this.endTimeSelectedHour = endtimeDetailsAfternoon.hour;
        this.endTimeAMPM = endtimeDetailsAfternoon.ampm;

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsAfternoon = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailsAfternoon.minute;
        this.startTimeSelectedHour = starttimeDetailsAfternoon.hour;
        this.startTimeAMPM = starttimeDetailsAfternoon.ampm;
        break;

      case "Night":
        this.AddShiftStartTimeAMPM =
          this.organisationShiftTimes.Night_Shift_Start_Time__c.toUpperCase();
        this.AddShiftEndTimeAMPM =
          this.organisationShiftTimes.Night_Shift_End_Time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Night_Shift_Start_Time__c.toLowerCase()
        );
        this.AddShiftEndTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Night_Shift_End_Time__c.toLowerCase()
        );
        this.disableTimeButton = true;
        this.endDate = this.getAdjustedDate(this.todayDate);
        console.log("this.endDate >>", this.endDate);
        const endtimeDetailsNight = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsNight.minute;
        this.endTimeSelectedHour = endtimeDetailsNight.hour;
        this.endTimeAMPM = endtimeDetailsNight.ampm;

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsNight = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailsNight.minute;
        this.startTimeSelectedHour = starttimeDetailsNight.hour;
        this.startTimeAMPM = starttimeDetailsNight.ampm;
        break;

      case "General":
        this.AddShiftStartTimeAMPM =
          this.organisationShiftTimes.General_Shift_Start_Time__c.toUpperCase();
        this.AddShiftEndTimeAMPM =
          this.organisationShiftTimes.General_Shift_End_time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.General_Shift_Start_Time__c.toLowerCase()
        );
        this.AddShiftEndTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.General_Shift_End_time__c.toLowerCase()
        );
        this.disableTimeButton = true;
        //this.checkFatigue();
        this.endDate = this.todayDate;
        const endtimeDetailsGeneral = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsGeneral.minute;
        this.endTimeSelectedHour = endtimeDetailsGeneral.hour;
        this.endTimeAMPM = endtimeDetailsGeneral.ampm;

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsGeneral = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailsGeneral.minute;
        this.startTimeSelectedHour = starttimeDetailsGeneral.hour;
        this.startTimeAMPM = starttimeDetailsGeneral.ampm;
        break;

      case "Custom":
        this.IsLongShift = true;
        this.AddShiftStartTimeAMPM =
          this.organisationShiftTimes.Custom_Shift_Start_Time__c.toUpperCase();
        this.AddShiftEndTimeAMPM =
          this.organisationShiftTimes.Custom_Shift_End_Time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Custom_Shift_Start_Time__c.toLowerCase()
        );
        this.AddShiftEndTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Custom_Shift_End_Time__c.toLowerCase()
        );
        this.disableTimeButton = false;
        this.cutsomShiftTemplate = true;
        //this.checkFatigue();
        //this.endDate = this.todayDate;
        this.endDate = this.getAdjustedDate(this.todayDate);
        this.addRateRow();
        const endtimeDetailsCustom = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsCustom.minute;
        this.endTimeSelectedHour = endtimeDetailsCustom.hour;
        this.endTimeAMPM = endtimeDetailsCustom.ampm;

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsCustom = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailsCustom.minute;
        this.startTimeSelectedHour = starttimeDetailsCustom.hour;
        this.startTimeAMPM = starttimeDetailsCustom.ampm;
        break;
      case "Sleepover Shift":
        this.AddShiftStartTimeAMPM =
          this.organisationShiftTimes.Sleepover_Start__c.toUpperCase();
        this.AddShiftEndTimeAMPM =
          this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toUpperCase();
        this.AddShiftStartTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Sleepover_Start__c.toLowerCase()
        );
        this.AddShiftEndTime = this.convertTo24HourFormat(
          this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toLowerCase()
        );
        this.disableTimeButton = false;
        //this.checkFatigue();
        this.endDate = this.getAdjustedDate(this.todayDate);
        console.log("this.endDate >>", this.endDate);
        console.log("this.AddShiftEndTimeAMPM >>" + this.AddShiftEndTimeAMPM);
        const endtimeDetailsSleepover = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
        this.endTimeSelectedHour = endtimeDetailsSleepover.hour;
        this.endTimeAMPM = endtimeDetailsSleepover.ampm;

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailssleepover = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailssleepover.minute;
        this.startTimeSelectedHour = starttimeDetailssleepover.hour;
        this.startTimeAMPM = starttimeDetailssleepover.ampm;
        break;

      default:
        console.warn(`Unknown shift type: ${this.addShiftData.AddShiftType}`);
        this.disableTimeButton = false;
        break;
    }

    // Calculate the shift duration after assigning values
    this.addShiftData.AddShiftDuration = this.getDuration(
      this.addShiftData.AddShiftStartDate,
      this.addShiftData.AddShiftStartTime,
      this.addShiftData.AddShiftEndTime,
      this.addShiftData.AddShiftEndTimeAMPM,
      this.addShiftData.AddShiftType
    ).duration;
    this.addShiftData.AddShiftBreak = this.getDuration(
      this.addShiftData.AddShiftStartDate,
      this.addShiftData.AddShiftStartTime,
      this.addShiftData.AddShiftEndTime,
      this.addShiftData.AddShiftEndTimeAMPM,
      this.addShiftData.AddShiftType
    ).breakTime;
    this.timings();
    if (this.addShiftData.AddShiftStartTimeAMPM) {
      let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(" "); // Split into "2:00" and "AM"
      let [startHour, startMinute] = time.split(":"); // Split "2:00" into hour and minute
      this.startTimeSelectedHour = startHour;
      this.startTimeSelectedMinute = startMinute;
      this.startTimeAMPM = period == "AM" ? true : false; // Store "AM" or "PM"
    }

    if (this.addShiftData.AddShiftEndTimeAMPM) {
      let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(" "); // Split into "2:00" and "AM"
      let [endHour, endMinute] = time.split(":"); // Split "2:00" into hour and minute
      this.endTimeSelectedHour = endHour;
      this.endTimeSelectedMinute = endMinute;
      this.endTimeAMPM = period == "AM" ? true : false; // Store "AM" or "PM"
    }
    console.log("addShiftData", JSON.stringify(this.addShiftData));
    this.getOverLappingdata();
  }

  getOrganisationTimingsRosterOrFacilityAdmin() {
    getfacilityById({ facId: this.facilityId })
      .then((facilityresult) => {
        switch (this.shiftTypeValue) {
          case "Morning":
            if (
              !this.validateShiftFields(
                facilityresult.Morning_Shift_Start_Time__c,
                facilityresult.Morning_Shift_End_Time__c
              )
            )
              return;
            this.AddShiftStartTimeAMPM =
              facilityresult.Morning_Shift_Start_Time__c?.toUpperCase();
            this.AddShiftEndTimeAMPM =
              facilityresult.Morning_Shift_End_Time__c?.toUpperCase();
            this.AddShiftStartTime = this.convertTo24HourFormat(
              facilityresult.Morning_Shift_Start_Time__c?.toLowerCase()
            );
            this.AddShiftEndTime = this.convertTo24HourFormat(
              facilityresult.Morning_Shift_End_Time__c?.toLowerCase()
            );
            this.disableTimeButton = true;

            console.log(
              "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
            );
            const starttimeDetails = this.splitTimeParts(
              this.AddShiftStartTimeAMPM
            );
            this.startTimeSelectedMinute = starttimeDetails.minute;
            this.startTimeSelectedHour = starttimeDetails.hour;
            this.startTimeAMPM = starttimeDetails.period;

            console.log(
              "this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM
            );
            const endtimeDetails = this.splitTimeParts(
              this.AddShiftEndTimeAMPM
            );
            this.endTimeSelectedMinute = endtimeDetails.minute;
            this.endTimeSelectedHour = endtimeDetails.hour;
            this.endTimeAMPM = endtimeDetails.period;
            break;

          case "Afternoon":
            if (
              !this.validateShiftFields(
                facilityresult.Afternoon_Shift_Start_Time__c,
                facilityresult.Afternoon_Shift_End_Time__c
              )
            )
              return;
            this.AddShiftStartTimeAMPM =
              facilityresult.Afternoon_Shift_Start_Time__c?.toUpperCase();
            this.AddShiftEndTimeAMPM =
              facilityresult.Afternoon_Shift_End_Time__c?.toUpperCase();
            this.AddShiftStartTime = this.convertTo24HourFormat(
              facilityresult.Afternoon_Shift_Start_Time__c?.toLowerCase()
            );
            this.AddShiftEndTime = this.convertTo24HourFormat(
              facilityresult.Afternoon_Shift_End_Time__c?.toLowerCase()
            );
            this.disableTimeButton = true;
            //this.checkFatigue();

            console.log(
              "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
            );
            const starttimeDetailsAfternoon = this.splitTimeParts(
              this.AddShiftStartTimeAMPM
            );
            this.startTimeSelectedMinute = starttimeDetailsAfternoon.minute;
            this.startTimeSelectedHour = starttimeDetailsAfternoon.hour;
            this.startTimeAMPM = starttimeDetailsAfternoon.period;

            console.log(
              "this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM
            );
            const endtimeDetailsAfternoon = this.splitTimeParts(
              this.AddShiftEndTimeAMPM
            );
            this.endTimeSelectedMinute = endtimeDetailsAfternoon.minute;
            this.endTimeSelectedHour = endtimeDetailsAfternoon.hour;
            this.endTimeAMPM = endtimeDetailsAfternoon.period;
            break;

          case "Night":
            if (
              !this.validateShiftFields(
                facilityresult.Night_Shift_Start_Time__c,
                facilityresult.Night_Shift_End_Time__c
              )
            )
              return;
            this.AddShiftStartTimeAMPM =
              facilityresult.Night_Shift_Start_Time__c?.toUpperCase();
            this.AddShiftEndTimeAMPM =
              facilityresult.Night_Shift_End_Time__c?.toUpperCase();
            this.AddShiftStartTime = this.convertTo24HourFormat(
              facilityresult.Night_Shift_Start_Time__c?.toLowerCase()
            );
            this.AddShiftEndTime = this.convertTo24HourFormat(
              facilityresult.Night_Shift_End_Time__c?.toLowerCase()
            );
            this.disableTimeButton = true;
            //this.checkFatigue();

            console.log(
              "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
            );
            const starttimeDetailsNight = this.splitTimeParts(
              this.AddShiftStartTimeAMPM
            );
            this.startTimeSelectedMinute = starttimeDetailsNight.minute;
            this.startTimeSelectedHour = starttimeDetailsNight.hour;
            this.startTimeAMPM = starttimeDetailsNight.period;

            console.log(
              "this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM
            );
            const endtimeDetailsNight = this.splitTimeParts(
              this.AddShiftEndTimeAMPM
            );
            this.endTimeSelectedMinute = endtimeDetailsNight.minute;
            this.endTimeSelectedHour = endtimeDetailsNight.hour;
            this.endTimeAMPM = endtimeDetailsNight.period;
            break;

          case "General":
            if (
              !this.validateShiftFields(
                facilityresult.General_Shift_Start_Time__c,
                facilityresult.General_Shift_End_Time__c
              )
            )
              return;
            this.AddShiftStartTimeAMPM =
              facilityresult.General_Shift_Start_Time__c?.toUpperCase();
            this.AddShiftEndTimeAMPM =
              facilityresult.General_Shift_End_Time__c?.toUpperCase();
            this.AddShiftStartTime = this.convertTo24HourFormat(
              facilityresult.General_Shift_Start_Time__c?.toLowerCase()
            );
            this.AddShiftEndTime = this.convertTo24HourFormat(
              facilityresult.General_Shift_End_Time__c?.toLowerCase()
            );
            this.disableTimeButton = true;
            //this.checkFatigue();

            console.log(
              "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
            );
            const starttimeDetailsGeneral = this.splitTimeParts(
              this.AddShiftStartTimeAMPM
            );
            this.startTimeSelectedMinute = starttimeDetailsGeneral.minute;
            this.startTimeSelectedHour = starttimeDetailsGeneral.hour;
            this.startTimeAMPM = starttimeDetailsGeneral.period;

            console.log(
              "this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM
            );
            const endtimeDetailsGeneral = this.splitTimeParts(
              this.AddShiftEndTimeAMPM
            );
            this.endTimeSelectedMinute = endtimeDetailsGeneral.minute;
            this.endTimeSelectedHour = endtimeDetailsGeneral.hour;
            this.endTimeAMPM = endtimeDetailsGeneral.period;
            console.log(
              " starttimeDetailsGeneral==>" +
                JSON.stringify(starttimeDetailsGeneral)
            );
            console.log(
              " endtimeDetailsGeneral==>" +
                JSON.stringify(endtimeDetailsGeneral)
            );
            break;

          case "Custom":
            if (
              !this.validateShiftFields(
                facilityresult.Custom_Shift_Start_Time__c,
                facilityresult.Custom_Shift_End_Time__c
              )
            )
              return;
            this.IsLongShift = true;
            this.AddShiftStartTimeAMPM =
              facilityresult.Custom_Shift_Start_Time__c?.toUpperCase();
            this.AddShiftEndTimeAMPM =
              facilityresult.Custom_Shift_End_Time__c?.toUpperCase();
            this.AddShiftStartTime = this.convertTo24HourFormat(
              facilityresult.Custom_Shift_Start_Time__c?.toLowerCase()
            );
            this.AddShiftEndTime = this.convertTo24HourFormat(
              facilityresult.Custom_Shift_End_Time__c?.toLowerCase()
            );
            this.disableTimeButton = false;
            this.cutsomShiftTemplate = true;
            //this.checkFatigue();

            console.log(
              "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
            );
            const starttimeDetailsCustom = this.splitTimeParts(
              this.AddShiftStartTimeAMPM
            );
            this.startTimeSelectedMinute = starttimeDetailsCustom.minute;
            this.startTimeSelectedHour = starttimeDetailsCustom.hour;
            this.startTimeAMPM = starttimeDetailsCustom.period;

            console.log(
              "this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM
            );
            const endtimeDetailsCustom = this.splitTimeParts(
              this.AddShiftEndTimeAMPM
            );
            this.endTimeSelectedMinute = endtimeDetailsCustom.minute;
            this.endTimeSelectedHour = endtimeDetailsCustom.hour;
            this.endTimeAMPM = endtimeDetailsCustom.period;
            break;
          case "Sleepover Shift":
            if (
              !this.validateShiftFields(
                facilityresult.Sleepover_Shift_Strat_Time__c,
                facilityresult.Sleepover_Shift_End_Time__c
              )
            )
              return;
            this.AddShiftStartTimeAMPM =
              facilityresult.Sleepover_Shift_Strat_Time__c?.toUpperCase();
            this.AddShiftEndTimeAMPM =
              facilityresult.Sleepover_Shift_End_Time__c?.toUpperCase();
            this.AddShiftStartTime = this.convertTo24HourFormat(
              facilityresult.Sleepover_Shift_Strat_Time__c?.toLowerCase()
            );
            this.AddShiftEndTime = this.convertTo24HourFormat(
              facilityresult.Sleepover_Shift_End_Time__c?.toLowerCase()
            );
            this.disableTimeButton = false;
            //this.checkFatigue();

            console.log(
              "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
            );
            const starttimeDetailsSleepover = this.splitTimeParts(
              this.AddShiftStartTimeAMPM
            );

            this.startTimeSelectedMinute = starttimeDetailsSleepover.minute;
            this.startTimeSelectedHour = starttimeDetailsSleepover.hour;
            this.startTimeAMPM = starttimeDetailsSleepover.period;

            console.log(
              "this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM
            );
            const endtimeDetailsSleepover = this.splitTimeParts(
              this.AddShiftEndTimeAMPM
            );

            this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
            this.endTimeSelectedHour = endtimeDetailsSleepover.hour;
            this.endTimeAMPM = endtimeDetailsSleepover.period;
            break;

          default:
            this.disableTimeButton = false;
            break;
        }
      })
      .catch((error) => {
        this.error = error;
        console.error("Error fetching facility:", error);
      });
  }

  validateShiftFields(start, end) {
    if (!start || !end) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Missing Shift Timing",
          message:
            "Please select the ABN from Facility Details and set the Roster timings in the Facility Settings.",
          variant: "info", // 👈 No 'mode' means default: dismissible
          mode: "sticky"
        })
      );
      return false;
    }
    return true;
  }

  timings() {}

  addRateRow() {
    if (this.rateRows.length < 4) {
      const newRow = {
        id: Date.now(), // or generate unique id however you like
        startTime: "",
        endTime: "",
        hourlyRate: ""
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
    console.log("🔄 [handleStartTimeChange] START");
    console.log("📥 Raw event.target.value >>", event.target?.value);

    const childData = event.detail;
    console.log(
      "📦 childData (from child):",
      JSON.stringify(childData, null, 2)
    );

    this.startTime = event.target?.value;
    this.AddShiftStartTimeAMPM = childData.displaytime;

    console.log(
      "🕒 AddShiftStartTimeAMPM (AM/PM):",
      this.AddShiftStartTimeAMPM
    );

    // Convert to 24hr
    this.AddShiftStartTime = this.convertTo24HourFormat(
      childData.displaytime.toLowerCase()
    );
    console.log("⏰ AddShiftStartTime (24hr):", this.AddShiftStartTime);

    // Split into parts
    const starttimeDetailssleepover = this.splitTimeParts(
      this.AddShiftStartTimeAMPM
    );
    this.startTimeSelectedMinute = starttimeDetailssleepover.minute;
    this.startTimeSelectedHour = starttimeDetailssleepover.hour;
    this.startTimeAMPM = starttimeDetailssleepover.ampm;

    console.log("🔎 Parsed Start Time Details:", {
      hour: this.startTimeSelectedHour,
      minute: this.startTimeSelectedMinute,
      ampm: this.startTimeAMPM
    });

    // Calculate shift duration
    this.shiftDuration = this.calculateDuration(
      this.AddShiftStartTime,
      this.AddShiftEndTime
    );
    console.log("📊 Updated Shift Duration (hrs):", this.shiftDuration);
    console.log("📊 Updated Shift Max Duration (hrs):", this.maxDuration);
     console.log("📊 Updated Shift Max Duration (hrs):", this.shiftTypeValue);
    // 🔐 Disable save if duration exceeds limit
    if (this.shiftDuration > this.maxDuration && this.maxDuration !=0 && this.shiftTypeValue !='Sleepover Shift') {
      console.warn(
        `⚠️ Shift duration (${this.shiftDuration} hrs) exceeds maxDuration (${this.maxDuration} hrs)`
      );

      this.showToast(
        "Validation Error",
        `Shift duration cannot exceed ${this.maxDuration} hours. Selected duration: ${this.shiftDuration} hrs`,
        "error"
      );

      this.isSaveDisabled = true; // ⛔ Disable Save button
      return; // 🚫 Stop further execution
    } else {
      this.isSaveDisabled = false; // ✅ Enable Save button
    }

    // Continue only if duration is valid
    this.endDate = this.getAdjustedDate(this.todayDate);
    console.log("📅 Updated EndDate (after Start Time change):", this.endDate);

    console.log("✅ [handleStartTimeChange] END");
  }

  handleEndTimeChange(event) {
    console.log("🔄 [handleEndTimeChange] START");

    const childData = event.detail;
    console.log(
      "📦 childData (from child):",
      JSON.stringify(childData, null, 2)
    );

    this.AddShiftEndTimeAMPM = childData.displaytime;
    console.log("🕒 AddShiftEndTimeAMPM (AM/PM):", this.AddShiftEndTimeAMPM);

    // Special handling for Night/Sleepover
    if (
      this.shiftTypeValue === "Sleepover Shift" ||
      this.shiftTypeValue === "Night"
    ) {
      let adjustedDate = this.getShiftAdjustedDate(
        this.todayDate,
        this.AddShiftEndTimeAMPM
      );
      this.endDate = adjustedDate;
      console.log("🌙 Adjusted EndDate (Night/Sleepover):", this.endDate);
    }

    // Convert to 24hr
    this.AddShiftEndTime = this.convertTo24HourFormat(
      childData.displaytime.toLowerCase()
    );
    console.log("⏰ AddShiftEndTime (24hr):", this.AddShiftEndTime);

    // Split into parts
    const endtimeDetailsSleepover = this.splitTimeParts(
      this.AddShiftEndTimeAMPM
    );
    this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
    this.endTimeSelectedHour = endtimeDetailsSleepover.hour;
    this.endTimeAMPM = endtimeDetailsSleepover.ampm;

    console.log("🔎 Parsed End Time Details:", {
      hour: this.endTimeSelectedHour,
      minute: this.endTimeSelectedMinute,
      ampm: this.endTimeAMPM
    });
      console.log("📊 Updated Shift Duration (hrs):", this.AddShiftStartTime);
      console.log("📊 Updated Shift Max Duration (hrs):", this.AddShiftEndTime);
    // ✅ Calculate duration and validate
    this.shiftDuration = this.calculateDuration(
      this.AddShiftStartTime,
      this.AddShiftEndTime
    );
    console.log("📊 Updated Shift Duration (hrs):", this.shiftDuration);
    console.log("📊 Updated Shift Max Duration (hrs):", this.maxDuration);
   console.log("📊 Updated Shift Max Duration (hrs):", this.shiftTypeValue);
    if (this.shiftDuration > this.maxDuration && this.maxDuration !=0 && this.shiftTypeValue !='Sleepover Shift') {
      console.warn(
        `⚠️ Shift duration (${this.shiftDuration} hrs) exceeds maxDuration (${this.maxDuration} hrs)`
      );

      this.showToast(
        "Validation Error",
        `Shift duration cannot exceed ${this.maxDuration} hours. Selected duration: ${this.shiftDuration} hrs`,
        "error"
      );

      this.isSaveDisabled = true; // ⛔ Disable Save button
      return; // 🚫 Stop further processing
    } else {
      this.isSaveDisabled = false; // ✅ Enable Save button
    }

    // Set adjusted end date for normal shifts
    this.endDate = this.getAdjustedDate(this.todayDate);
    console.log("📅 Updated EndDate (after End Time change):", this.endDate);

    console.log("✅ [handleEndTimeChange] END");
  }

  calculateDuration(startTimeStr, endTimeStr) {
    try {
      console.log("⏱ [calculateDuration] START");
      console.log("   - startTimeStr:", startTimeStr);
      console.log("   - endTimeStr:", endTimeStr);

      if (!startTimeStr || !endTimeStr) {
        console.warn("⚠️ Missing start or end time");
        return null;
      }

      // Convert "HH:mm:00Z" into minutes
      const parseToMinutes = (timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
      };

      const startMinutes = parseToMinutes(startTimeStr);
      const endMinutes = parseToMinutes(endTimeStr);

      console.log("   - startMinutes:", startMinutes);
      console.log("   - endMinutes:", endMinutes);

      // Handle overnight shifts (end < start)
      let durationMinutes =
        endMinutes >= startMinutes
          ? endMinutes - startMinutes
          : 24 * 60 - startMinutes + endMinutes;

      const durationHours = durationMinutes / 60;

      console.log("✅ Duration Calculated:", durationHours, "hours");
      return durationHours;
    } catch (error) {
      console.error("❌ [calculateDuration] Error:", error);
      return null;
    }
  }

  getShiftAdjustedDate(baseDateStr, AddShiftEndTimeAMPM) {
    console.log("Base Date (baseDateStr):", baseDateStr);
    console.log("Shift End Time (AddShiftEndTimeAMPM):", AddShiftEndTimeAMPM);

    // Check if time is in AM
    const isAM = AddShiftEndTimeAMPM.toUpperCase().includes("AM");

    // Split the base date into year, month, and day
    const dateParts = baseDateStr.split("-");
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Months are zero-based in JS
    const day = parseInt(dateParts[2]);

    // Create a new date object (local time in Australia/Sydney)
    let date = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone confusion

    // Convert to AEST (Australia/Sydney)
    let options = {
      timeZone: "Australia/Sydney",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    };

    let formatter = new Intl.DateTimeFormat("en-AU", options);
    let formattedDate = formatter.format(date);

    console.log("Formatted Date in AEST:", formattedDate);

    if (isAM) {
      console.log("Shift ends in AM → Use next day");
      date.setDate(date.getDate() + 1); // Move to next day if AM
    } else {
      console.log("Shift ends in PM → Use current day");
    }

    // Return in YYYY-MM-DD format
    const resultDate = date.toISOString().split("T")[0];
    console.log("Adjusted Date Returned:", resultDate);

    return resultDate;
  }

  handleReccuringChange(event) {
    console.log("Reccuring Change: ", event.target.checked);
    this.AddShiftRecurringCheckboxValue = event.target.checked;
    this.isRecurring = this.AddShiftRecurringCheckboxValue;
    console.log("isRecurring:", this.isRecurring);
    console.log("roleValue :", this.roleValue);
  }

  handleRecurChange(event) {
    this.selectedDays = [];
    this.recurEndDate = "";
    this.recurEveryValue = "";
    const selectedValue = event.detail.value;
    console.log("Recurring Option Selected:", selectedValue);
    if (selectedValue == "Weekly") {
      console.log("Recurring Option Selected:", selectedValue);
      this.recurEveryOptions = this.generateWeeklyOptions(6);
      this.isRecurWeekFlag = true;
      this.isRecurmontlyFlag = false;
    } else if (selectedValue == "Monthly") {
      console.log("Recurring Option Selected:", selectedValue);
      this.recurEveryOptions = this.generateMonthlyOptions(3);
      this.RecurValue = selectedValue;
      this.isRecurWeekFlag = false;
      this.isRecurmontlyFlag = true;
    } else if (selectedValue == "Daily") {
      console.log("Recurring Option Selected:", selectedValue);
      this.recurEveryOptions = this.generateOptionsdaily(15);
      this.RecurValue = selectedValue;
      this.isRecurWeekFlag = false;
      this.isRecurmontlyFlag = false;
    } else if (selectedValue == "Fortnightly") {
      console.log("Recurring Option Selected:", selectedValue);
      this.recurEveryOptions = this.generateFortnightlyOptions(15);
      this.RecurValue = selectedValue;
      this.isRecurWeekFlag = false;
      this.isRecurmontlyFlag = false;
    }
    this.reccuring = selectedValue;
    console.log("Recurring Option Selected:", this.reccuring);
    console.log("roleValue :", this.roleValue);
  }

  handleRecurEveryChange(event) {
    const selectedValue = event.detail.value;
    console.log("Recur Every Option Selected:", selectedValue);
    this.recurEveryValue = selectedValue;
    console.log("roleValue :", this.roleValue);
  }

  handleMonthlyOptionChange(event) {
    this.monthOfDay = event.target.value;
    console.log("Monthly Option Selected:", this.monthOfDay);
    console.log("roleValue :", this.roleValue);
  }

  handleRecurEndDateChange(event) {
    const field = event.target.name;
    const isValid = event.target.checkValidity();
    console.log("isValid", isValid);
    this.isSaveDisabled = false;

    this.fieldErrorMap[field] = !isValid;
    this.isSaveDisabled = false;
    this.recurEndDate = event.detail.value;
    console.log("Recurrence End Date selected:", this.recurEndDate);
    console.log("roleValue :", this.roleValue);

    if (this.recurEndDate <= this.todayDate) {
      this.recurEndDate = null;
      this.showToast(
        "Validation Error",
        "Recurrence End Date must be before Available Date.",
        "error"
      );
      this.isSaveDisabled = true;
      return;
    }

    getNumberOfRecurrences({
      typeOfRecur: this.RecurValue, // or this.template.querySelector(...) if it's bound to input
      recurEvery: this.recurEveryValue,
      endDate: this.recurEndDate,
      shiftDate: this.todayDate,
      weeklyDays: this.selectedDays, // this should be an array of strings
      monthlyDay: this.monthOfDay
    })
      .then((result) => {
        console.log("Recurrence Result:", result);
        this.numberOfOccurrences = result.NumberOfOccurrences;
        console.log("this.numberOfOccurrences >>", this.numberOfOccurrences);
      })
      .catch((error) => {
        console.error("Error fetching recurrence data:", error);
        this.showToast("Error", "Failed to fetch recurrence data", "error");
      });
  }

  handleCheckboxChange(event) {
    const day = event.target.name;
    const isChecked = event.target.checked;

    console.log("Checkbox changed:", day, isChecked);

    if (isChecked) {
      if (!this.selectedDays.includes(day)) {
        this.selectedDays = [...this.selectedDays, day];
      }
    } else {
      this.selectedDays = this.selectedDays.filter((item) => item !== day);
    }

    console.log("Updated selectedDays:", JSON.stringify(this.selectedDays));
    console.log("roleValue :", this.roleValue);
  }

  refreshCatalogueData() {
    getCatalogueData({
      serviceType: this.serviceTypevalue,
      clientId: this.clientId
    })
      .then((result) => {
        console.log(
          "facility options => " + JSON.stringify(this.facilityOptions)
        );
        console.log("participant facility ==> " + this.clientFacilityId);
        const participantFacility = this.facilityOptions.find(
          (f) => f.value === this.clientFacilityId
        );
        let isNdisService = participantFacility?.service === "NDIS";

        console.log("Full Result:", result);
        console.log("Catalogue Data:", result.catalogueData);
        console.log("States Combined:", result.statesCombined);
        const rawStateCode = result.statesCombined;
        const cleanedStateCode = rawStateCode.replace("__c", ""); // removes the "__c"

        console.log("Cleaned State Code:", cleanedStateCode);

        this.RegionStateValue = cleanedStateCode;
        this.serviceEditGroupName = [];
        // Check type before using map
        if (Array.isArray(result.catalogueData)) {
          /*  this.serviceEditGroupName = result.catalogueData.map((item) => {
            return {
              ...item,
              amount: isNdisService == false || (isNdisService == true &&   result.catalogueData[0].Name.includes("Miscellaneous"))? result.amount || 0: item[rawStateCode] || 0,
               Support_Item_Name__c: (isNdisService == false || (isNdisService == true &&   result.catalogueData[0].Name.includes("Miscellaneous") ))? result.editedCatalogName ?  result.editedCatalogName:result.catalogueData[0].Support_Item_Name__c : result.catalogueData[0].Support_Item_Name__c ,
              isSelected:(isNdisService == false || (isNdisService == true &&   result.catalogueData[0].Name.includes("Miscellaneous") ))? true:false
            };
          }); */

          this.serviceEditGroupName = result.catalogueData.map((rec) => {
            let amountVal, nameVal;

            if (
              isNdisService == false ||
              (isNdisService == true &&
                result.catalogueData[0].Name.includes("Miscellaneous"))
            ) {
              // ✅ Pull from junction maps using the record Id
              amountVal = result.clientJunctionMapAmount[rec.Id] || 0;
              nameVal =
                result.clientJunctionMapName[rec.Id] ||
                rec.Support_Item_Name__c;
            } else {
              // ✅ Normal case → use state field from catalogue record
              amountVal = rec[rawStateCode] || 0;
              nameVal = rec.Support_Item_Name__c;
            }

            return {
              ...rec,
              amount: amountVal,
              Support_Item_Name__c: nameVal
            };
          });

          this.CatlogTabel = true;
          // this.ndisAmount = (isNdisService == false || (isNdisService == true &&   result.catalogueData[0].Name.includes("Miscellaneous") ))?String(this.serviceEditGroupName[0].amount) :'0';
          console.log(
            "✅ Mapped serviceEditGroupName:",
            JSON.stringify(this.serviceEditGroupName)
          );
          console.log("roleValue :", this.roleValue);
        } else {
          console.error(
            "❌ catalogueData is not an array:",
            result.catalogueData
          );
        }

        if (this.isUpdateMode == true) {
          setTimeout(() => {
            console.log("⏳ Applying selection to serviceEditGroupName...");
            if (Array.isArray(this.serviceEditGroupName)) {
              this.serviceEditGroupName = this.serviceEditGroupName.map(
                (row) => ({
                  ...row,
                  isSelected: row.Id === this.selectedcatlogId
                })
              );
              console.log("✅ Applied selection to Catalogue Table");
            } else {
              console.warn(
                "⚠️ serviceEditGroupName is not an array or not loaded yet"
              );
            }
          }, 4000);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  handleserviceTypchange(event) {
    this.serviceEditGroupName = [];
    this.CatlogTabel = false;
    this.serviceTypevalue = event.target.value;
    console.log("serviceTypevalue " + this.serviceTypevalue);
    this.refreshCatalogueData();
  }

  HandleRegionStateChange(event) {
    this.RegionStateValue = event.target.value;
    console.log("RegionStateValue:", this.RegionStateValue);
    //this.refreshCatalogueData();
  }

  /* async loadOrganizationDetails() {
    organizationDetails()
      .then((response) => {
        let orgRoles = response.listofPriceBook.Roles__c;
        this.state = response.listofPriceBook.Address_Latest__StateCode__s;
        //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;

        this.roleOptions = orgRoles
          .split(";")
          .sort()
          .map((rec) => ({
            value: rec,
            label: rec
          }));
          console.log("🎯 Final roleOptions:", JSON.stringify(this.roleOptions, null, 2));
      })
      .catch((error) => {
        console.error("Error loading organization details:", error);
      });
  }
 */
  async loadOrganizationDetails() {
    console.log("🚀 [loadFacilityRoles] START");

    console.log('this.clientFacilityId >>>>', this.clientFacilityId);
      this.roleOptions=[];
     if (!this.clientFacilityId) {
        console.warn(" No facilityId found — aborting role load");
        return;
    } 
      let listOfFacilityId=[];
      listOfFacilityId.push(this.clientFacilityId);
    try {
        const result = await getRoleOptionsByFacility({ facilityIdList:listOfFacilityId });
        console.log("Facility Roles received:", result);

        // Map result (List<String>) to Lightning combobox-friendly format
        this.roleOptions = result
            .sort()
            .map(role => ({
                label: role.Role_Name__c,
                value: role.Role_Name__c
            }));

        console.log("Final roleOptions:", JSON.stringify(this.roleOptions));

    } catch (error) {
        console.error("Error fetching facility roles:", error);
    }
}
  @track ndisAmount;
  HandleEditNdisCheckBox(event) {
    console.log("Radio button clicked"); // Check if this logs
    const selectedId = event.target.dataset.id; // Get the id of the clicked radio button
    const amount = event.target.dataset.amount;
    this.selectedcatlogId = selectedId;
    this.ndisAmount = amount;
    console.log("Selected ID:", selectedId);
    console.log("NDIS Amount:", this.ndisAmount);
  }

  fetchStaffOptions(role, participantId) {
    console.log(
      "🔄 Fetching staff options for role:",
      role,
      "and participant ID:",
      participantId
    );
  }

  handleRoleChange(event) {
    // Step 1: Get selected role from the event
    this.selectedRole = event.detail.value;
    console.log("Selected Role:", this.selectedRole);

    // Step 2: Show the table
    this.rolestable = true;
    console.log("Table visible:", this.rolestable);
    this.roleValue = this.selectedRole;

    console.log("Initialized roleRows:", this.roleRows);

    // Step 4: Call Apex to get staff options
    console.log(
      "Calling Apex with Role:",
      this.selectedRole,
      "Participant ID:",
      this.clientId
    );

    // this.fetchStaffOptions(this.selectedRole, this.clientId);
    getStaffOptions({ role: this.selectedRole, participantId: this.clientId })
    .then((result) => {
      console.log("✅ Apex returned staff options:", result);

      const formattedStaffList = result.map((item) => {
        const level = item.ClassicLevel
          ? item.ClassicLevel.replace(/Level\s*/i, "").trim()
          : "";

        let payPoint = "";
        if (item.ClassicLevelPoints) {
          payPoint = item.ClassicLevelPoints
            .replace(/^\d+\./, "")
            .replace(/Pay Point\s*/i, "")
            .trim();
        }

        const classicLevelPoints =
          level && payPoint ? `${level}.${payPoint}` : "0";

        // 🧩 Compute badge class safely
        let genderClass = "slds-badge slds-theme_neutral";
        if (item.Gender === "Male") {
          genderClass = "maleColor";
        } else if (item.Gender === "Female") {
          genderClass = "femaleColor";
        }

        const nationalityClass = "slds-badge slds-theme_success";

        let fullLanguages = item.Languages || "";
        let shortLanguages = fullLanguages;
        if (fullLanguages.length > 5) {
          shortLanguages = fullLanguages.substring(0, 5) + "...";
        }
        const languagesClass = "slds-badge slds-theme_inverse";

        return {
          ...item,
          Staff__c: item.Id,
          Id: null,
          Role: this.roleValue,
          SCR: item.SCR ? parseFloat(item.SCR).toFixed(2) : "0.00",
          ClassicLevelPoints: classicLevelPoints,
          ClassicLevel: classicLevelPoints,
          Gender: item.Gender,
          Nationality: item.Nationality,
          LanguagesShort: shortLanguages,
          LanguagesFull: fullLanguages,
          genderClass,
          nationalityClass,
          languagesClass
        };
      });

      this.staffList = formattedStaffList;
      this.showRolesTable = true;

      console.log(
        "🧾 Formatted Staff List:",
        JSON.stringify(this.staffList, null, 2)
      );
    })
    .catch((error) => {
      console.error("❌ Error fetching staff options:", error);
      this.showRolesTable = false;
    });

  }

  handleStaffChange(event) {
    const index = event.target.dataset.index;
    const selectedStaffId = event.detail.value;
    console.log("Staff updated for row:", selectedStaffId);
    console.log("Row index:", index);

    const updatedRows = [...this.roleRows];
    if (updatedRows[index]) {
      updatedRows[index] = {
        ...updatedRows[index],
        selectedStaff: selectedStaffId
      };
      this.roleRows = updatedRows;
      console.log("Updated roleRows:", JSON.stringify(this.roleRows));
    }
  }

  handlePriorityChange(event) {
    const index = event.target.dataset.index;
    const selectedPriority = event.detail.value;
    console.log("Priority updated for row:", selectedPriority);
    console.log("Row index:", index);

    const updatedRows = [...this.roleRows];
    if (updatedRows[index]) {
      updatedRows[index] = {
        ...updatedRows[index],
        priority: selectedPriority
      };
      this.roleRows = updatedRows;
      console.log("Updated roleRows:", JSON.stringify(this.roleRows));
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
      selectedStaff: "",
      priority: "",
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
    return this.addNewAddressCheckBox ? "" : "display: none;";
  }

  getDuration(startTime, endTime) {
    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

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
    console.log("Save button clicked");

    // 💡 First: Perform all required field validations
    if (
      !this.shiftTypeValue ||
      !this.AddShiftStartTimeAMPM ||
      !this.AddShiftEndTimeAMPM
    ) {
      this.showToast(
        "Error",
        "All fields must be filled. Please provide a valid Shift Type, Start Time, and End Time.",
        "error"
      );
      return;
    }

    if (
      !this.serviceTypevalue ||
      this.serviceTypevalue === "--None--" ||
      !this.RegionStateValue ||
      this.RegionStateValue === "--None--"
    ) {
      this.showToast("Error", "Please provide a valid Service Type", "error");
      return;
    }

    if (!this.roleValue || this.roleValue === "--None--") {
      this.showToast("Error", "Please provide Role", "error");
      return;
    }

    if (
      !this.street ||
      !this.city ||
      !this.country ||
      !this.province ||
      !this.postalCode
    ) {
      this.showToast("Error", "Please provide Address", "error");
      return;
    }

    if (!this.selectedcatlogId || this.selectedcatlogId === "--None--") {
      this.showToast(
        "Validation Error",
        "Please select a Support Item Name.",
        "error"
      );
      return;
    }

    if (this.AddShiftRecurringCheckboxValue) {
      if (!this.recurEveryValue || !this.recurEndDate) {
        this.showToast(
          "Validation Error",
          'Please provide the "Recur Every" and "End Date" when Recurring is checked.',
          "error"
        );
        return;
      }

      if (this.isRecurWeekFlag && !this.selectedDays.length) {
        this.showToast(
          "Validation Error",
          "Please select at least one day for weekly recurrence.",
          "error"
        );
        return;
      }

      if (this.isRecurmontlyFlag && !this.monthOfDay) {
        this.showToast(
          "Validation Error",
          "Please select a day for monthly recurrence.",
          "error"
        );
        return;
      }
    }

    // 🕒 Duration + amount calculation
    const duration = this.getDuration(
      this.AddShiftStartTimeAMPM,
      this.AddShiftEndTimeAMPM
    );
    const totalHours = duration.hours + duration.minutes / 60;
    const totalAmount = totalHours * this.ndisAmount;

    console.log(`⏱️ Duration: ${duration.hours}h ${duration.minutes}m`);
    console.log(`🧮 Total Amount: ${totalAmount}`);

    // 🔁 Call Apex to get available fund info
    const selectedIdList = [this.serviceTypevalue];

    getFundsData({ fundsId: selectedIdList })
      .then((result) => {
        console.log("📦 Raw fund result from Apex >>", JSON.stringify(result));

        // Step 1: Map fund ID to available + name
        const fundMap = new Map();
        result.forEach((fund) => {
          console.log(
            `🔄 Mapping fund: ID=${fund.Id}, Available=${fund.Available_Funds__c}, Name=${fund.Name}`
          );
          fundMap.set(fund.Id, {
            available: fund.Available_Funds__c || 0,
            name: fund.Name || "Unknown Service"
          });
        });

        // Step 2: Retrieve selected fund info
        const fund = fundMap.get(this.serviceTypevalue);
        console.log("🔍 Selected Fund ID:", this.serviceTypevalue);
        console.log("🗺️ Retrieved Fund:", fund);

        if (!fund) {
          console.error(
            "❌ Fund not found in result for serviceTypevalue:",
            this.serviceTypevalue
          );
          this.showToast("Error", "Fund data not found.", "error");
          return;
        }

        this.fundsAvailableAmount = fund.available;
        this.fundsName = fund.name;
        console.log(
          `💰 Fund Check: Name="${this.fundsName}", Available=${fund.available}, Used (Single)=${totalAmount}`
        );

        // Step 3: Validate Single Shift Amount
        if (
          !this.AddShiftRecurringCheckboxValue &&
          totalAmount > fund.available
        ) {
          console.error(
            `❌ Fund exceeded for single use. Used=${totalAmount.toFixed(2)}, Available=${fund.available.toFixed(2)}`
          );
          this.showToast(
            "Error",
            `Service "${this.fundsName}" exceeds available funds. Used: $${totalAmount.toFixed(2)}, Available: $${fund.available.toFixed(2)}`,
            "error"
          );
          return;
        }

        // Step 4: Validate Recurring Amount
        const totalAmountinReccuring = totalAmount * this.numberOfOccurrences;
        console.log(
          `🔁 Recurring Enabled: ${this.AddShiftRecurringCheckboxValue}, Occurrences: ${this.numberOfOccurrences}`
        );
        console.log(
          `🧮 Recurring Total Amount: ${totalAmount} x ${this.numberOfOccurrences} = ${totalAmountinReccuring}`
        );

        if (
          this.AddShiftRecurringCheckboxValue &&
          totalAmountinReccuring > fund.available
        ) {
          console.error(
            `❌ Recurring total exceeded. Total=${totalAmountinReccuring.toFixed(2)}, Available=${fund.available.toFixed(2)}`
          );
          this.showToast(
            "Error",
            `Recurring service "${this.fundsName}" exceeds available funds. Total recurring amount: $${totalAmountinReccuring.toFixed(2)}, Available: $${fund.available.toFixed(2)}`,
            "error"
          );
          return;
        }
// if(!this.quantity){

//   this.quantity = this.quantity || 1;
//   console.log("quantity....",this.quantity);

// }
//  console.log("quantity....",this.quantity);       
        // Step 5: Prepare and send payload
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
          AdddressType: this.typeofAddress,
          shiftName: this.shiftNameValue,
          editedUnitPrice: this.ndisAmount,
          quantity: this.quantity,
          facility:this.clientFacilityId
          
        };

        console.log(
          "📤 Sending payload to Apex → saveShiftData: ...",
          JSON.stringify(payload)
        );

        // Step 6: Final call to save shift
        saveShiftData({ shiftData: payload })
          .then(() => {
            console.log("✅ Shift data saved successfully.");
            this.showToast("Success", this.successmessage, "success");
            this.resetFields();
            this.fetchAvailability();
            this.fetchHolidays();
            this.fetchServices();
            this.editButtonModule = false;
            this.cleardata();
          })
          .catch((error) => {
            console.error("❌ Error saving shift data to Apex:", error);
            this.showToast("Error", "Failed to save shift data", "error");
          });
      })
      .catch((error) => {
        console.error("❌ [Apex Error] Failed to fetch fund data:", error);
        this.showToast("Error", "Failed to fetch fund data.", "error");
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
    this.facilityAddressCheckbox = false;
    this.participantAddressCheckBox = false;
    this.addNewAddressCheckBox = false;
    this.street = "";
    this.city = "";
    this.country = "";
    this.province = "";
    this.postalCode = "";
    this.showRolesTable = false;
    this.staffList = [];
    this.AdddressType = "";
    this.shiftNameValue = "";
    this.isSaveDisabled = false;

    // Optional: If you want to clear any UI elements, you can also reset their values.
    console.log("Fields have been reset.");
  }

  async handleEdit(event) {
//vamshi added 2810-2811 lines
    this.quantity='';
    console.log('quantity...', this.quantity);

    console.log("🟡 [handleEdit] Entered function");

    this.successmessage = "Shift updated successfully.";
    console.log("✅ successmessage:", this.successmessage);

    this.isCreateMode = false;
    console.log("✅ isCreateMode:", this.isCreateMode);

    this.isUpdateMode = true;
    console.log("✅ isUpdateMode:", this.isUpdateMode);

    this.buttonTitle = "Update Shift";
    console.log("✅ buttonTitle:", this.buttonTitle);

    const recordId = event.currentTarget.dataset.id;
    console.log("📥 event.currentTarget.dataset.id:", recordId);

    this.availabilityId = recordId;
    console.log("✅ availabilityId:", this.availabilityId);

    console.log("🧾 availability list:", JSON.stringify(this.availability));

    // Build availability map
    const availabilityMap = new Map();
    console.log("🛠 Created empty availabilityMap");

    this.availability.forEach((available) => {
      console.log(
        "🔄 Processing availability record:",
        JSON.stringify(available)
      );
      const dateKey = available.Id;
      console.log("🆔 dateKey:", dateKey);

      if (!availabilityMap.has(dateKey)) {
        availabilityMap.set(dateKey, []);
        console.log("➕ Added new key to map:", dateKey);
      }
      availabilityMap.get(dateKey).push(available);
      console.log("📌 Appended availability under key:", dateKey);
    });

    console.log("📑 availabilityMap keys:", Array.from(availabilityMap.keys()));

    const availableForDate = availabilityMap.get(recordId) || [];
    console.log(
      "📅 availableForDate for recordId",
      recordId,
      ":",
      JSON.stringify(availableForDate)
    );

    this.selectedavailability = availableForDate.map((available) => {
      console.log("🖼 Mapping availability record:", JSON.stringify(available));
      const formattedStart = this.formatTime(available.Start_Time__c);
      console.log("⏰ formattedStart:", formattedStart);

      const formattedEnd = this.formatTime(available.End_Time__c);
      console.log("⏰ formattedEnd:", formattedEnd);

      return {
        ...available,
        formattedStart,
        formattedEnd
      };
    });
    console.log(
      "✅ selectedavailability:",
      JSON.stringify(this.selectedavailability)
    );

    if (this.selectedavailability.length === 0) {
      console.warn("⚠️ No availability found for selected recordId:", recordId);
      return;
    }

    const firstAvailability = this.selectedavailability[0];
    console.log("📌 firstAvailability:", JSON.stringify(firstAvailability));

    this.todayDate = firstAvailability.Start_Date__c;
    console.log("✅ todayDate:", this.todayDate);

    this.shiftTypeValue = firstAvailability.Shift_Type__c;
    console.log("✅ shiftTypeValue:", this.shiftTypeValue);
//vamshi added lines 2894-2895
    this.quantity= firstAvailability.Quantity__c;
    console.log("Quantity value..", this.quantity);
    this.clientFacilityId= firstAvailability.Facility__c ?firstAvailability.Facility__c : this.participantFaciltiyOptions[0].value;

    this.shiftNameValue = firstAvailability.Shift_Name__c;
    console.log("✅ shiftNameValue:", this.shiftNameValue);


    this.AddShiftStartTimeAMPM = firstAvailability.formattedStart;
    console.log("✅ AddShiftStartTimeAMPM:", this.AddShiftStartTimeAMPM);
     this.AddShiftStartTime = this.convertTo24HourFormat(
      this.AddShiftStartTimeAMPM.toLowerCase()
    );
    console.log("🕒 this.AddShiftStartTime:", this.AddShiftStartTime);
    

    const starttimeDetails = this.splitTimeParts(this.AddShiftStartTimeAMPM);
    console.log("🕒 starttimeDetails:", starttimeDetails);

    this.startTimeSelectedMinute = starttimeDetails.minute;
    console.log("✅ startTimeSelectedMinute:", this.startTimeSelectedMinute);

    this.startTimeSelectedHour = starttimeDetails.hour;
    console.log("✅ startTimeSelectedHour:", this.startTimeSelectedHour);

    this.startTimeAMPM = starttimeDetails.period;
    console.log("✅ startTimeAMPM:", this.startTimeAMPM);

    this.AddShiftEndTimeAMPM = firstAvailability.formattedEnd;
    console.log("✅ AddShiftEndTimeAMPM:", this.AddShiftEndTimeAMPM);
    this.AddShiftEndTime=this.convertTo24HourFormat(
       this.AddShiftEndTimeAMPM.toLowerCase()
    );
     console.log("🕒 this.AddShiftEndTime:", this.AddShiftEndTime);

    const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
    console.log("🕒 endtimeDetails:", endtimeDetails);

    this.endTimeSelectedMinute = endtimeDetails.minute;
    console.log("✅ endTimeSelectedMinute:", this.endTimeSelectedMinute);

    this.endTimeSelectedHour = endtimeDetails.hour;
    console.log("✅ endTimeSelectedHour:", this.endTimeSelectedHour);

    this.endTimeAMPM = endtimeDetails.period;
    console.log("✅ endTimeAMPM:", this.endTimeAMPM);

    this.serviceTypevalue = firstAvailability.Funds_Tracker__c;
    console.log("✅ serviceTypevalue:", this.serviceTypevalue);

    this.RegionStateValue = firstAvailability.State__c;
    console.log("✅ RegionStateValue:", this.RegionStateValue);

    this.roleValue = firstAvailability.Role__c;
    console.log("✅ roleValue:", this.roleValue);

    this.street = firstAvailability.Address__Street__s;
    console.log("✅ street:", this.street);

    this.city = firstAvailability.Address__City__s;
    console.log("✅ city:", this.city);

    this.country = "Australia";
    console.log("✅ country:", this.country);

    this.province = firstAvailability.Address__StateCode__s;
    console.log("✅ province:", this.province);

    this.postalCode = firstAvailability.Address__PostalCode__s;
    console.log("✅ postalCode:", this.postalCode);

    this.typeofAddress = firstAvailability.Address_Type__c;
    console.log("✅ typeofAddress:", this.typeofAddress);

    this.facilityAddressCheckbox = this.typeofAddress === "Facility";
    console.log("🏠 facilityAddressCheckbox:", this.facilityAddressCheckbox);

    this.participantAddressCheckBox = this.typeofAddress === "Participant";
    console.log(
      "🏠 participantAddressCheckBox:",
      this.participantAddressCheckBox
    );

    this.addNewAddressCheckBox = this.typeofAddress === "Add New";
    console.log("🏠 addNewAddressCheckBox:", this.addNewAddressCheckBox);
    this.processShifts();

    if (this.clientId) {
      console.log("🔄 clientId found:", this.clientId);
      try {
        await this.getserviceTypes();
        console.log("✅ getserviceTypes completed");

        await this.loadOrganizationDetails();
        console.log("✅ loadOrganizationDetails completed");
      } catch (error) {
        console.error("❌ Error loading Service Types or Org Details:", error);
      }
    }

    if (this.serviceTypevalue != null) {
      console.log("📦 NDIS Catalogue Setup Start");
      this.CatlogTabel = true;
      console.log("✅ CatlogTabel:", this.CatlogTabel);

      this.refreshCatalogueData();
      console.log("🔄 refreshCatalogueData called");

      this.selectedcatlogId = firstAvailability.NDIS_Support_Catalogue__c;
      console.log("✅ selectedcatlogId:", this.selectedcatlogId);
    }

    if (this.roleValue != null) {
      console.log(
        "🔍 Fetching staff options for Role:",
        this.roleValue,
        "ClientId:",
        this.clientId
      );

      getStaffOptions({ role: this.roleValue, participantId: this.clientId })
      .then((result) => {
        console.log("✅ Apex returned staff options:", result);

        // 🔹 Step 1: Prepare staff map from Apex for quick lookup
        const staffMap = new Map(
          result.map((item) => {
            // 🗣️ Handle Languages
            const fullLanguages = item.Languages || "";
            const shortLanguages =
              fullLanguages.length > 15
                ? fullLanguages.substring(0, 15) + "..."
                : fullLanguages;

            // 🚻 Handle Gender (Full + Short)
            const fullGender = item.Gender || "";
            const shortGender =
              fullGender.length > 10
                ? fullGender.substring(0, 10) + "..."
                : fullGender;

            // 🎨 Badge classes
            let genderClass = "slds-badge slds-theme_neutral";
            if (fullGender === "Male") {
              genderClass = "maleColor";
            } else if (fullGender === "Female") {
              genderClass = "femaleColor";
            }

            const nationalityClass = "slds-badge slds-theme_success";

            return [
              item.Id,
              {
                ...item,
                Role: this.roleValue,
                SCR: item.SCR ? parseFloat(item.SCR).toFixed(2) : "0.00",
                Gender: fullGender,
                GenderFull: fullGender,
                GenderShort: shortGender,
                genderClass,
                Nationality: item.Nationality || "",
                nationalityClass,
                Languages: fullLanguages,
                LanguagesFull: fullLanguages,
                LanguagesShort: shortLanguages,
                ClassicLevelPoints: item.ClassicLevelPoints || "0",
              },
            ];
          })
        );

        // 🔹 Step 2: Initialize staffList from Apex
        this.staffList = Array.from(staffMap.values());
        console.log("👥 staffList after mapping:", JSON.stringify(this.staffList));

        this.showRolesTable = true;
        console.log("✅ showRolesTable:", this.showRolesTable);

        // 🔹 Step 3: Merge with Priority Staffs (if available)
        const priorityStaffs = firstAvailability?.Priority_Staffs__r || [];
        console.log("🧑‍🤝‍🧑 priorityStaffs:", JSON.stringify(priorityStaffs));

        if (priorityStaffs.length > 0) {
          this.staffList = priorityStaffs
            .map((staff) => {
              const base = staffMap.get(staff.Staff__c) || {};

              // 🗣️ Merge Languages
              const fullLanguages =
                staff.Staff__r?.Languages__c || base.Languages || "";
              const shortLanguages =
                fullLanguages.length > 15
                  ? fullLanguages.substring(0, 15) + "..."
                  : fullLanguages;

              // 🚻 Merge Gender (Full + Short)
              const fullGender =
                staff.Staff__r?.Gender__c || base.Gender || "";
              const shortGender =
                fullGender.length > 10
                  ? fullGender.substring(0, 10) + "..."
                  : fullGender;

              // 🎨 Compute gender class again
              let genderClass = "slds-badge slds-theme_neutral";
              if (fullGender === "Male") {
                genderClass = "maleColor";
              } else if (fullGender === "Female") {
                genderClass = "femaleColor";
              }

              const nationalityClass = "slds-badge slds-theme_success";

              return {
                ...staff,
                id: staff.Id,
                selectedStaff: staff.Staff__c,
                SCR: staff.Staff__r.SCR__c
                  ? parseFloat(staff.Staff__r.SCR__c).toFixed(2)
                  : base.SCR || "0.00",
                priority: parseInt(staff.Priority__c, 10),
                Name:
                  (staff.Staff__r.Name || "") +
                  " " +
                  (staff.Staff__r.Last_Name__c || ""),
                LastName: staff.Staff__r.Last_Name__c || "",
                ClassicLevel:
                  staff.Staff__r.Class_and_Paypont__c ||
                  base.ClassicLevelPoints ||
                  "0",

                // ✅ Merge fields
                Gender: fullGender,
                GenderFull: fullGender,
                GenderShort: shortGender,
                genderClass,
                Nationality:
                  staff.Staff__r.Nationality__c || base.Nationality || "",
                nationalityClass,
                Languages: fullLanguages,
                LanguagesFull: fullLanguages,
                LanguagesShort: shortLanguages,
                Role: base.Role || this.roleValue,
              };
            })
            .sort((a, b) => a.priority - b.priority);

          console.log(
            "✅ staffList after priority merge & sort:",
            JSON.stringify(this.staffList)
          );
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching staff options:", error);
        this.showRolesTable = false;
        console.log("❌ showRolesTable:", this.showRolesTable);
      });

    }

    this.editButtonModule = true;
    console.log("✅ editButtonModule:", this.editButtonModule);

    this.isPopoverVisible = false;
    console.log("✅ isPopoverVisible:", this.isPopoverVisible);

    console.log(
      "🏁 [handleEdit] Completed successfully with isUpdateMode:",
      this.isUpdateMode
    );
  }

  splitTimeParts(timeString) {
    if (!timeString) {
      console.error("Time string is empty or undefined.");
      return { hour: null, minute: null, period: null };
    }

    const [timePart, period] = timeString.trim().split(" "); // "6:00", "AM"
    const [hour, minute] = timePart.split(":"); // "6", "00"

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
    if (name === "facilityAddressCheckbox") {
      this.facilityAddressCheckbox = true;
      this.typeofAddress = "Facility";
      this.getFacilityAddress();
    } else if (name === "participantAddressCheckBox") {
      this.participantAddressCheckBox = true;
      this.typeofAddress = "Participant";
      this.getparticipantAddress();
    } else if (name === "addNewAddressCheckBox") {
      this.addNewAddressCheckBox = true;
      this.typeofAddress = "Add New";
      this.street = "";
      this.city = "";
      this.country = "";
      this.province = "";
      this.postalCode = "";
    }
  }

  get addressComponentStyle() {
    return this.addNewAddressCheckBox ? "" : "display: none;";
  }

  fetchGeocode() {
    console.log("this.street >>", this.street);
    console.log("this.city >>", this.city);
    console.log("this.postalCode >>", this.postalCode);
    const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
    const apiKey = GOOGLE_API_KEY;

    console.log("Fetching geocode for:", fullAddress);

    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        console.log("Geocode API response:", data);

        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          this.LocationLatitude = location.lat;
          this.LocationLongitude = location.lng;

          console.log("Parsed coordinates:", location.lat, location.lng);
        } else {
          console.warn("No geocode results found or status not OK");
        }
      })
      .catch((error) => {
        console.error("Error calling Geocode API:", error);
        // Optional: handle error or fallback logic here
      });
  }

  getFacilityAddress() {
    getFacilityAddress({ clientId: this.clientId })
      .then((result) => {
        console.log("facility address", JSON.stringify(result));

        const facility = result;
        if (facility && facility.Facility__r) {
          const facilityDetails = facility.Facility__r;
          console.log("facilityDetails >>", JSON.stringify(facilityDetails));

          this.street = facilityDetails.Address__Street__s;
          this.city = facilityDetails.Address__City__s;
          this.country =
            facilityDetails.Address__CountryCode__s === "AU"
              ? "Australia"
              : facilityDetails.Address__CountryCode__s;
          this.province = facilityDetails.Address__StateCode__s;
          this.postalCode = facilityDetails.Address__PostalCode__s;
          this.fetchGeocode();
          console.log(
            "facility address",
            this.street,
            this.city,
            this.country,
            this.province,
            this.postalCode
          );
        } else {
          console.warn("Facility__r is missing in the result");
        }
      })
      .catch((error) => {
        console.error("Error fetching facility address:", error);
      });
  }

  getparticipantAddress() {
    getFacilityAddress({ clientId: this.clientId })
      .then((result) => {
        console.log("facility address", JSON.stringify(result));

        const facility = result;
        if (facility) {
          const facilityDetails = facility.Facility__r;
          console.log("facilityDetails >>", JSON.stringify(facility));
          this.facilityId = facility.Facility__r;
          this.street = facility.Address__Street__s;
          this.city = facility.Address__City__s;
          this.country =
            facility.Address__CountryCode__s === "AU"
              ? "Australia"
              : facility.Address__CountryCode__s;
          this.province = facility.Address__StateCode__s;
          this.postalCode = facility.Address__PostalCode__s;
          this.fetchGeocode();
          console.log(
            "facility address",
            this.street,
            this.city,
            this.country,
            this.province,
            this.postalCode
          );
        } else {
          console.warn("Facility__r is missing in the result");
        }
      })
      .catch((error) => {
        console.error("Error fetching facility address:", error);
      });
  }

  handleAddressChange(event) {
    const address = event.detail;
    this.street = address.street;
    this.city = address.city;
    this.country = address.country;
    this.province = address.province;
    this.postalCode = address.postalCode;

    console.log("📬 Updated Address:", address);
    this.fetchGeocode();
  }

  draggedItem = null;
  draggedOverItem = null;

  handleDragStart(event) {
    const index = event.currentTarget.dataset.index;
    console.log("index >>", index);
    this.draggedItem = index;
    this.staffList[index].dragClass = "slds-theme_shade slds-opacity_50";
    this.staffList = [...this.staffList];
  }

  handleDragOver(event) {
    event.preventDefault();
    const index = event.currentTarget.dataset.index;
    this.draggedOverItem = index;
    console.log("index >>", index);
    // Reset all drag classes
    this.staffList.forEach((staff) => (staff.dragClass = ""));

    // Add drag indicator class
    if (this.draggedItem !== index) {
      this.staffList[index].dragClass = "slds-theme_info slds-border_top";
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
      newStaffList.forEach((staff) => (staff.dragClass = ""));

      this.staffList = newStaffList;

      console.log("this.staffList >>" + JSON.stringify(this.staffList));
    }
  }

  handleDragEnd() {
    // Reset all drag classes
    this.staffList.forEach((staff) => (staff.dragClass = ""));
    this.staffList = [...this.staffList];

    this.draggedItem = null;
    this.draggedOverItem = null;
  }

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant // 'error', 'success', 'info', or 'warning'
    });
    this.dispatchEvent(event);
  }
  cleardata() {
    this.AddShiftStartTimeAMPM = null;
    this.AddShiftEndTimeAMPM = null;
    this.startTimeSelectedHour = null;
    this.startTimeSelectedMinute = null;
    this.startTimeAMPM = null;
    this.endTimeSelectedHour = null;
    this.endTimeSelectedMinute = null;
    this.endTimeAMPM = null;
  }


  getGenderBadgeClass(gender) {
    if (gender === 'Male') {
      return 'slds-badge slds-theme_info';
    } else if (gender === 'Female') {
      return 'slds-badge slds-theme_warning';
    } else {
      return 'slds-badge slds-theme_neutral';
    }
  }
 handleFaciltiyChange(event) {

  console.log('--- Resetting Time-Related Fields (START) ---');

// BEFORE reset
console.log('Before Reset:', {
    AddShiftStartTimeAMPM: this.AddShiftStartTimeAMPM,
    AddShiftEndTimeAMPM: this.AddShiftEndTimeAMPM,
    startTimeSelectedHour: this.startTimeSelectedHour,
    startTimeSelectedMinute: this.startTimeSelectedMinute,
    startTimeAMPM: this.startTimeAMPM,
    endTimeSelectedHour: this.endTimeSelectedHour,
    endTimeSelectedMinute: this.endTimeSelectedMinute,
    endTimeAMPM: this.endTimeAMPM
});

    // RESET values
  this.AddShiftStartTimeAMPM = null;
  this.AddShiftEndTimeAMPM = null;
  this.startTimeSelectedHour = null;
  this.startTimeSelectedMinute = null;
  this.startTimeAMPM = null;
  this.endTimeSelectedHour = null;
  this.endTimeSelectedMinute = null;
  this.endTimeAMPM = null;

    this.serviceTypevalue ;
    this.RegionStateValue ;
    this.selectedcatlogId ;
    this.selectedRole ;
    this.roleRows = [];

    this.showRolesTable = false;
    this.staffList = [];
    this.shiftNameValue = "";
    this.isSaveDisabled = false;

  this.clientFacilityId = event.detail.value;

  console.log('clientFacilityId',this.clientFacilityId);

  console.log('After Reset:', {
    AddShiftStartTimeAMPM: this.AddShiftStartTimeAMPM,
    AddShiftEndTimeAMPM: this.AddShiftEndTimeAMPM,
    startTimeSelectedHour: this.startTimeSelectedHour,
    startTimeSelectedMinute: this.startTimeSelectedMinute,
    startTimeAMPM: this.startTimeAMPM,
    endTimeSelectedHour: this.endTimeSelectedHour,
    endTimeSelectedMinute: this.endTimeSelectedMinute,
    endTimeAMPM: this.endTimeAMPM
});

console.log('--- Resetting Time-Related Fields (END) ---');
   this.processShifts();
  this.loadOrganizationDetails(); 
  if(this.facilityAddressCheckbox == true){
    this.typeofAddress = "Facility";
    this.getFacilityAddress();
  } 
      
    }
}