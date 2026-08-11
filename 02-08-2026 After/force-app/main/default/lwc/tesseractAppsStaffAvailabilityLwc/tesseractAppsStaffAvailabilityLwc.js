import { api, LightningElement, track, wire } from "lwc";
import USER_ID from "@salesforce/user/Id";
import holidayList from "@salesforce/apex/LeaveController.holidayListbyOrg";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import saveStaffData from "@salesforce/apex/StaffAvailabilityController.saveStaffData";
import getStaffAvailability from "@salesforce/apex/StaffAvailabilityController.getStaffAvailability";
import getUserData from "@salesforce/apex/StaffAvailabilityController.getstaffId";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getServiceType from "@salesforce/apex/StaffAvailabilityController.getServiceType";
import preventStaffAvailabilityDuplicates from "@salesforce/apex/RosterAutoScheduleHandler.preventStaffAvailabilityDuplicates";
import getfacilityById from "@salesforce/apex/FacilityController.getfacilityById";
import getcurrentUserType from "@salesforce/apex/UserAccessController.getstaffId2";
import processSingleShift from "@salesforce/apex/StaffAvailabilityController.processSingleShift";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { deleteRecord } from "lightning/uiRecordApi";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import getShiftsTypeByFacility from "@salesforce/apex/RosterInvoicesHandler.getShiftsTypeByFacility";
import getApprovedLeaves from "@salesforce/apex/LeaveController.getApprovedLeaves";
import validateStaffAvailabilityWithReasons from '@salesforce/apex/StaffAvailabilityValidation.validateStaffAvailabilityWithReasons';
import getNumberOfRecurrences from '@salesforce/apex/RosterCreationRecurringHnadler.getNumberOfRecurrences';



export default class tesseractAppsStaffAvailabilityLwc extends LightningElement {
  @track recordsPerPage = 10;
  @track isPageSizeManuallySet = false;
  @track pageSize = 10;
  @track pageSizeBulk = 10;
  @track isPageSizeBulkManuallySet = false;
  resizeObserver;

  @track todayDate;
  @track endDate;
  @track currentDate = new Date();
  @track holidayList = [];
  @track state;
  @track services = [];
  @track StaffId = "";
  userId = USER_ID;
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
  @track availableOptions=[{label: "Available",value: "Available"},
    {label: "Unavailable",value: "Unavailable"}
  ]
  @track sectionFlags = {
    staffDetails: true,
    staffDetails1: true
  };
  @track DeleteFlag;
  @track availabilityId;

  @track sectionIcons = {
    staffDetails: "\u2B9F",
    staffDetails1: "\u2B9F"
  };
  @track recurEndDate = "";
  @track selectedDays = [];
  @track monthLyOptions = [];
  @track availability = [];
  @track AddShiftRecurringCheckboxValue = false;
  @track savebutton = "Create";
  @track AddShiftStartTime;
  @track AddShiftEndTime;
  @track todayDateforheader;
  @track facilityId;
  @track successmessage;
  @track documentExpired = false;
  @track shiftTypeValue;
  @track shiftDuration = 0;
  @track shiftDurationMax = 0;
  @track startTimeSelectedMinute;
  @track startTimeSelectedHour;
  @track startTimeAMPM;
  @track endTimeAMPM;
  @track endTimeSelectedMinute;
  @track endTimeSelectedHour;
   @track staffDateConflicts = [];
  @track showErrorModal=false;
  @track confictData=[];
  @track recurrenceDates=[];
  @track availableValue='Available';

  async fetchUserData() {
    try {
      const result = await getUserData({ userId: this.userId });
      console.log("📌 Fetched User Data:", result);

      this.StaffId = result.Id;
      console.log("📌 this.StaffId:", this.StaffId);

      // Uncomment if needed
      // this.addingPreTax();
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
    }
  }

  connectedCallback() {
    this.initializeComponent();
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async initializeComponent() {
    try {
      // Fetch all required data sequentially
      await this.fetechstafffacility();
      console.log(" fetechstafffacility  Completed");
      await this.fetchHolidays();
      console.log(" fetchHolidays  Completed");

      this.recurEveryOptions = this.generateOptionsdaily(30);
      this.monthLyOptions = this.generateDateOptions(31);
      this.generateTimeOptions();
      await this.fetchUserData();
      await this.fetchApprovedLeaves();

      // Fetch facility data
      const facilityResponse = await getFacilityData();
      this.facilityOptions = facilityResponse.map((record) => ({
        value: record.Id,
        label: record.Name
      }));

      this.organisationShiftTimes = facilityResponse[0].Organisation__r;
      console.log(
        "organisationShiftTimes",
        JSON.stringify(this.organisationShiftTimes)
      );

      if (!this.facilityValue) {
        this.facilityValue = []; // Ensure it's an array
      }

      if (this.facilityOptions.length > 0) {
        this.facilityValue.push(this.facilityOptions[0].value);
        this.SelectedComboBoxFacility = this.facilityOptions[0].value;
      }

      // Fetch organization details
      const orgResponse = await organizationDetails();
      let orgRoles = orgResponse.listofPriceBook.Roles__c;
      this.state = orgResponse.listofPriceBook.Address_Latest__StateCode__s;

      console.log("state:", this.state);

      this.OrgNisationRoles = orgRoles
        .split(";")
        .sort()
        .map((rec) => ({ value: rec, label: rec }));
    } catch (error) {
      console.error("❌ Error in initializeComponent:", error);
    }
  }

  handleDelete(event) {
    this.availabilityId = event.currentTarget.dataset.id;
    this.DeleteFlag = true;
    console.log("recordId" + recordId);
  }

  async DocExpiryCheck(checkDateParam) {
    console.log("Parent record Id in addingPreTax: " + this.StaffId);

    const response = await fetchStaff({ recordId: this.StaffId }); // ⏳ wait for Apex
    console.log("staff list after save: " + JSON.stringify(response));
    console.log("response.length: " + Object.keys(response).length);

    let childRec = response.Child_Staffs__r || [];
    this.documentExpired = false; // reset flag
    let checkDate = checkDateParam ? new Date(checkDateParam) : new Date();

    for (let rec of childRec) {
      if (
        rec.Compliance__c === true &&
        new Date(rec.Expiry_Date__c) < checkDate
      ) {
        this.documentExpired = true;
        console.log("Expired doc", this.documentExpired);
        break;
      }
    }
  }

  async fetechstafffacility() {
    getcurrentUserType({ userId: USER_ID })
      .then((result) => {
        console.log("✅ Apex Result:", result);

        const staffRecord = result.staff;
        const typeofUser = result.typeOfUser;
        const userType = result.Usertype;

        // Assign Facility Id (with fallback to Facility__r.Id)
        if (staffRecord) {
          this.facilityId =
            staffRecord.Facility__c ||
            (staffRecord.Facility__r ? staffRecord.Facility__r.Id : null);

          if (this.facilityId) {
            console.log("📌 this.facilityId:", this.facilityId);
            this.processShifts(this.facilityId);
          } else {
            console.warn("⚠️ Facility Id not found for staff");
          }
        } else {
          console.warn("⚠️ Staff record is empty");
        }

        // Optional branching
        /*
            if (userType === 'NDIS Org Admin') {
                this.getOrganisationTimings();
            } else {
                this.getOrganisationTimingsRosterOrFacilityAdmin();
            }
            */
      })
      .catch((error) => {
        console.error("❌ Error getting staff and user type:", error);
      });
  }

  async processShifts(facilityId) {
    try {
      const data = await this.fetchShiftData(facilityId);
      console.log("📌 Fetched Shift TYPE Records:", JSON.stringify(data));

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

      console.log(
        "📌 shiftNameOptions:",
        JSON.stringify(this.shiftNameOptions)
      );
      await this.fetchAvailability();
    } catch (err) {
      console.error("❌ Error in processShifts:", JSON.stringify(err));
    }
  }

  async fetchShiftData(facilityId) {
    try {
      const result = await getShiftsTypeByFacility({ facilityId });
      return result;
    } catch (error) {
      console.error("❌ Error fetching shifts:", error);
      this.shiftNameOptions = [];
      throw error; // rethrow to let calling function handle it
    }
  }

  handleclose() {
    this.DeleteFlag = false;
    this.availabilityId = "";
  }

  async confirmDelete() {
    try {
      await deleteRecord(this.availabilityId);

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Availability shift deleted successfully.",
          variant: "success"
        })
      );

      this.isPopoverVisible = false;

      // Refresh data sequentially
      await this.fetchHolidays();
      await this.fetchAvailability();
      await this.fetchApprovedLeaves();
    } catch (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error deleting record",
          message: error?.body?.message || "Unknown error",
          variant: "error"
        })
      );
    } finally {
      this.DeleteFlag = false;
    }
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
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    // Map holidays
    const holidayMap = new Map();
    this.holidayList.forEach((holiday) => {
      const date = holiday.Date__c;
      const name = holiday.Holiday_Name__c;
      if (!holidayMap.has(date)) {
        holidayMap.set(date, []);
      }
      holidayMap.get(date).push(name);
    });

    // Map leaves
    const leaveMap = new Map();
    console.log("Mapping leaveList...", JSON.stringify(this.leaveList));
    this.leaveList.forEach((leave) => {
      const from = new Date(leave.From__c);
      console.log("from in calenderdays : ", from);
      const to = new Date(leave.To__c);
      console.log("to in calenderdays : ", to);
      //console.log(`Leave in calenderdays  #${index + 1}: From ${from.toISOString()} To ${to.toISOString()}, Type: ${leave.Type_of_Leave__c}`);

      let current = new Date(from);
      console.log("current in calenderdays : ", current);
      while (current <= to) {
        console.log("current <= to in calenderdays : ");
        const dateStr = current.toISOString().split("T")[0];
        console.log("dateStr in calenderdays : ", dateStr);
        if (!leaveMap.has(dateStr)) {
          console.log("!leaveMap.has(dateStr) in calenderdays : ");
          leaveMap.set(dateStr, []);
        }
        leaveMap.get(dateStr).push(leave.Type_of_Leave__c);
        console.log(`  -> Mapped leave on ${dateStr}:`, leaveMap.get(dateStr));
        current.setDate(current.getDate() + 1);
      }
    });
    console.log(
      "Final leaveMap in calenderdays :",
      JSON.stringify([...leaveMap.entries()])
    );

    // Map availability (ensure date format is YYYY-MM-DD)
    const availabilityMap = new Map();
    this.availability.forEach((slot) => {
      const normalizedDate = new Date(slot.Start_Date__c)
        .toISOString()
        .split("T")[0];
      if (!availabilityMap.has(normalizedDate)) {
        availabilityMap.set(normalizedDate, []);
      }
      availabilityMap.get(normalizedDate).push(slot);
    });

    // Fill empty leading cells
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        key: `empty-${i}`,
        date: "",
        class: "day-cell empty",
        tooltip: ""
      });
    }

    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA");
    console.log("✅ Today:", todayStr);

    const today1 = new Date();
    today.setDate(today1.getDate() - 1);
    const todayStr1 = today1.toISOString().split("T")[0];

    // Populate actual days
    for (let i = 1; i <= totalDays; i++) {
      const fullDate = new Date(year, month, i);
      const nextDay = new Date(fullDate);
      nextDay.setDate(fullDate.getDate() + 1);
      const dateStr1 = nextDay.toISOString().split("T")[0];
      const dateStr = fullDate.toLocaleDateString("en-CA"); // YYYY-MM-DD

      const isHoliday = holidayMap.has(dateStr);
      const isToday = dateStr === todayStr;
      const isOnLeave = leaveMap.has(dateStr);
      const availabilitySlots = availabilityMap.get(dateStr) || [];
      const hasAvailability = availabilitySlots.length > 0;

      // if (isOnLeave) {
      //   console.log(`📅 ${dateStr} is a leave day →`, leaveMap.get(dateStr));
      // }
      let cellClass = "day-cell";
      if (isHoliday) {
        cellClass += " holiday"; // ✅ Highest priority
      } else if (isToday) {
        cellClass += " today"; // ✅ Next priority
      } else if (isOnLeave) {
        cellClass += " leave";
      } else {
        if (hasAvailability) {
          cellClass += " has-service";
        } else {
          cellClass += " no-service";
        }
      }

      // const holidayTooltip = isHoliday
      //   ? `Holiday: ${holidayMap.get(dateStr).join(", ")}`
      //   : "";
      // const leaveTooltip = isOnLeave
      //   ? `Leave: ${leaveMap.get(dateStr).join(", ")}`
      //   : "";

      //const tooltip = [holidayTooltip, leaveTooltip].filter(Boolean).join("\n");

      let tooltip = "";
      if (isHoliday) {
        tooltip = `Holiday: ${holidayMap.get(dateStr).join(", ")}`;
      } else if (isOnLeave) {
        tooltip = `Leave: ${leaveMap.get(dateStr).join(", ")}`;
      }

      // ✅ Optional: log tooltips for debug
      if (tooltip) {
        console.log(`🟡 Tooltip for ${dateStr}: ${tooltip}`);
      }

      const displayLimit = 2;
      const hasMore = availabilitySlots.length > displayLimit;

      const visibleSlots = availabilitySlots
        .slice(0, displayLimit)
        .map((slot) => {
          const colour =
            (this.shiftColourMap &&
              this.shiftColourMap.get(slot.Shift_Name__c)) ||
            "#0099de"; // fallback

          const colourWithAlpha = colour + "2e";

          return {
            id: slot.Id,
            startDate: slot.Start_Date__c,
            isAssigned: slot.Assigned_Service_OR_Shift__c,
            startTime: this.convertMillisTo12Hour(slot.Start_Time__c),
            endTime: this.convertMillisTo12Hour(slot.End_Time__c),
            shiftType: slot.Shift_Type__c,
            shiftName: slot.Shift_Name__c,
            availableClass:slot.Type__c,
            timeRange: `${this.convertMillisTo12Hour(
              slot.Start_Time__c
            )} - ${this.convertMillisTo12Hour(slot.End_Time__c)}`,
            colour,
            style: `background-color: ${colourWithAlpha}; color: ${colour}; border-left: 4px solid ${colour}; border-radius: 6px; width: 100%; text-align: left; padding-left: 2px; margin-top: 5px;`
          };
        });

      const moreCount = hasMore ? availabilitySlots.length - displayLimit : 0;

      days.push({
        key: `day-${i}`,
        date: i,
        dateStr,
        dateStr1,
        class: cellClass,
        // tooltip: [holidayTooltip].filter(Boolean).join("\n"),
        tooltip: tooltip,
        visibleSlots,
        hasMore,
        moreCount,
        noService: visibleSlots.length === 0,
        holidayName: isHoliday ? holidayMap.get(dateStr).join(", ") : "",
        leaveName: isOnLeave ? leaveMap.get(dateStr).join(", ") : "",
        isOnLeave
      });
    }

    // Fill trailing empty cells
    const remainingInRow = 7 - (days.length % 7);
    if (remainingInRow < 7) {
      for (let i = 0; i < remainingInRow; i++) {
        days.push({
          key: `empty-end-${i}`,
          date: "",
          class: "day-cell empty",
          tooltip: ""
        });
      }
    }

    // console.log("days in calenderdays  >>>", JSON.stringify(days));
    return days;
  }

  async prevMonth() {
    try {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() - 1,
        1
      );
      this.isPopoverVisible = false;

      await this.fetchHolidays();
      await this.fetchAvailability();
      await this.fetchApprovedLeaves();
    } catch (error) {
      console.error("❌ Error in prevMonth:", error);
    }
  }

  async nextMonth() {
    try {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        1
      );
      this.isPopoverVisible = false;

      await this.fetchHolidays();
      await this.fetchAvailability();
      await this.fetchApprovedLeaves();
    } catch (error) {
      console.error("❌ Error in nextMonth:", error);
    }
  }

  async navigateToToday() {
    try {
      this.currentDate = new Date();
      await this.fetchHolidays();
      await this.fetchAvailability();
      await this.fetchApprovedLeaves();
    } catch (error) {
      console.error("❌ Error in navigateToToday:", error);
    }
  }
  @track leaveList = [];
  async fetchHolidays() {
    try {
      console.log("Holiday List");
      const formattedDate = this.currentDate.toISOString().split("T")[0];
      console.log("Holiday List >>", formattedDate);
      console.log("State >>", this.state);

      if (formattedDate && this.state) {
        const response = await holidayList({
          datePicker: formattedDate,
          state: this.state
        });
        this.holidayList = response;
        console.log("Holiday List >>", JSON.stringify(this.holidayList));
      }
    } catch (error) {
      console.error("❌ Error fetching holiday list:", error);
    }
  }
  //@track StaffId;
  async fetchApprovedLeaves() {
    console.log("📌 [fetchApprovedLeaves] → Method start");
    console.log("this.StaffId in fetchApprovedLeaves  before :", this.StaffId);
    try {
      const formattedDate = this.currentDate.toISOString().split("T")[0];
      console.log(
        "📆 Formatted current date in fetchApprovedLeaves:",
        formattedDate
      );
      console.log("this.StaffId in fetchApprovedLeaves :", this.StaffId);
      if (!formattedDate) {
        console.warn("⚠️ Skipping fetch: formattedDate is empty");
        return;
      }

      if (!this.StaffId) {
        console.warn("⚠️ Skipping fetch: StaffId is missing");
        return;
      }

      if (formattedDate && this.StaffId) {
        console.log("🔄 Calling Apex → getApprovedLeaves with:", {
          datePicker: formattedDate,
          staffId: this.StaffId
        });
        const result = await getApprovedLeaves({
          datePicker: formattedDate,
          staffId: this.StaffId
        });

        this.leaveList = result || [];
        console.log("✅ Approved Leave List:", JSON.stringify(this.leaveList));
      }
    } catch (error) {
      console.error("❌ Error fetching approved leaves:", error);
    }
  }
 
  async fetchAvailability() {
    try {
      const formattedDate = this.currentDate.toISOString().split("T")[0];
      console.log("📅 Fetching availability for date:", formattedDate);

      const response = await getStaffAvailability({
        datePicker: formattedDate
      });
      console.log("📥 Raw response from server:", JSON.stringify(response));

      // Normalize Start_Date__c to YYYY-MM-DD and format times
      this.availability = response.map((item, index) => {
        console.log(`🔹 Processing item ${index}:`, item);

        let startDateNormalized = "";
        let startTimeFormatted = "";
        let endTimeFormatted = "";
        let shiftName = item.Shift_Name__c || null;

        try {
          startDateNormalized = new Date(item.Start_Date__c)
            .toISOString()
            .split("T")[0];
        } catch (e) {
          console.error(
            "❌ Error parsing Start_Date__c:",
            item.Start_Date__c,
            e
          );
        }

        try {
          startTimeFormatted = this.convertMillisTo12Hour(item.Start_Time__c);
        } catch (e) {
          console.error(
            "❌ Error converting Start_Time__c:",
            item.Start_Time__c,
            e
          );
        }

        try {
          endTimeFormatted = this.convertMillisTo12Hour(item.End_Time__c);
        } catch (e) {
          console.error(
            "❌ Error converting End_Time__c:",
            item.End_Time__c,
            e
          );
        }

        const normalizedItem = {
          ...item,
          Start_Date__c: startDateNormalized,
          startTimeFormatted,
          endTimeFormatted,
          Shift_Name__c: shiftName
         
        };

        console.log("✅ Normalized item with Shift_Name__c:", normalizedItem);
        return normalizedItem;
      });

      console.log(
        "📊 Final normalized availability array:",
        JSON.stringify(this.availability)
      );
    } catch (error) {
      console.error("❌ Error fetching services:", error);
    }
  }

  convertMillisTo12Hour(millis) {
    if (!millis) return "12:00 AM";

    const date = new Date(millis);
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }


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

      // Extract date for the clicked slot
      const date = clickedElement.dataset.date;
      console.log("Selected date:", date);

      // Map availability by date
      const availabilityMap = new Map();
      this.availability.forEach((available) => {
        const dateKey = available.Start_Date__c;
        if (!availabilityMap.has(dateKey)) {
          availabilityMap.set(dateKey, []);
        }
        availabilityMap.get(dateKey).push(available);
      });

      const availableForDate = availabilityMap.get(date) || [];

      // Format start and end times
      this.selectedavailability = availableForDate.map((available) => ({
        ...available,
        formattedStart: this.formatTime(available.Start_Time__c),
        formattedEnd: this.formatTime(available.End_Time__c)
      }));
      // Show popup
      this.isPopoverVisible = true;

      console.log("AVAILABILITY:", JSON.stringify(this.selectedavailability));

      const dateObj = new Date(date);
      this.selectedDate = dateObj.toLocaleDateString("en-GB");
    } catch (error) {
      console.error("❌ Error in handleServiceClick:", error);
    }
  }

  closePopover() {
    this.isPopoverVisible = false;
  }
  formatTime(dateTimeStr) {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const paddedMinutes = minutes.toString().padStart(2, "0");

    return `${hours}:${paddedMinutes} ${ampm}`;
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

  @track serviceTypeOptions = [];
  async getserviceTypes() {
    try {
      const result = await getServiceType({ clientId: this.clientId });
      this.serviceTypeOptions = result;
      console.log("Data received:", result);
    } catch (error) {
      console.error("❌ Error fetching service types:", error);
    }
  }

  @track headingLabel;


  async handleAddDescription(event) {
    this.startTimeSelectedMinute = null;
    this.startTimeSelectedHour = null;
    this.startTimeAMPM = null;
    this.endTimeAMPM = null;
    this.endTimeSelectedMinute = null;
    this.endTimeSelectedHour = null;
    this.headingLabel = "Create Availability";
    this.savebutton = "Create";
    this.successmessage = "Availability shift created successfully.";
    this.recurrenceDates=[];
     this.confictData=[];
     this.isSaveDisabled=false;

    // ⛳ Read safe local date from dataset
    const selectedDate = event.currentTarget.dataset.date; // e.g. "2025-05-31"
    console.log("Raw selectedDate:", selectedDate);

    // ✅ Safely parse parts
    const [year, month, day] = selectedDate.split("-").map(Number);

    // ✅ Manually format to dd/MM/yyyy
    const formattedDate = `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
    const formattedDateforheader = formattedDate;

    console.log("Formatted Selected Date:", formattedDate);

    this.isPopoverVisible = false;
    this.todayDate = formattedDate;
    this.todayDateforheader = formattedDateforheader;
    this.editButtonModule = true;
  }

  handleClose(event) {
    this.editButtonModule = false;
    this.startTimeSelectedMinute = null;
    this.startTimeSelectedHour = null;
    this.startTimeAMPM = null;
    this.endTimeAMPM = null;
    this.endTimeSelectedMinute = null;
    this.endTimeSelectedHour = null;
    this.resetFields();
  }

  async handleShiftTypeChange(event) {
    try {
      this.shiftTypeValue = event.detail.value;
      console.log("Selected Shift Type:", this.shiftTypeValue);

      // Await the staff/facility fetch to ensure data is ready
      await this.fetechstafffacility();
    } catch (error) {
      console.error("❌ Error in handleShiftTypeChange:", error);
    }
  }

  
  handleShiftNamechange(event) {
    console.log("🔄 [handleShiftNamechange] START - Event received:", event);
    this.shiftNameValue = event.detail.value; // selected Id
    console.log(
      "📌 [handleShiftNamechange] Selected Shift Name Id:",
      this.shiftNameValue
    );
    console.log(
      "📊 [handleShiftNamechange] Available shiftNameOptions:",
      JSON.stringify(this.shiftNameOptions)
    );

    const selectedOption = this.shiftNameOptions.find(
      (option) => option.value === this.shiftNameValue
    );

    console.log(
      "🔍 [handleShiftNamechange] Found selectedOption:",
      selectedOption
    );

    if (selectedOption) {
      console.log(
        "✅ [handleShiftNamechange] Selected Option Found:",
        JSON.stringify(selectedOption, null, 2)
      );

      // Store Shift_Type__c into shiftTypeValue
      this.shiftTypeValue = selectedOption.Shift_Type__c;
      console.log(
        "📝 [handleShiftNamechange] Shift Type Value set to:",
        this.shiftTypeValue
      );

      // ✅ Filter by selected shift Id
      let shifNames = this.shiftNameOptions.filter(
        (rec) => rec.value === this.shiftNameValue
      );

      console.log(
        "📋 [handleShiftNamechange] Filtered shiftNames:",
        JSON.stringify(shifNames, null, 2)
      );
      console.log(
        "🚀 [handleShiftNamechange] Calling getShiftTimingsByFacility..."
      );

      // Call with the correct shift
      this.getShiftTimingsByFacility(shifNames);
    } else {
      console.warn(
        "⚠️ [handleShiftNamechange] No selected option found for value:",
        this.shiftNameValue
      );
    }

    console.log("🔄 [handleShiftNamechange] END");
  }

  getShiftTimingsByFacility(shifNames) {
    console.log("🔄 [getShiftTimingsByFacility] START");
    try {
      console.log(
        "📥 [getShiftTimingsByFacility] Input shifNames:",
        JSON.stringify(shifNames, null, 2)
      );
      console.log(
        "📊 [getShiftTimingsByFacility] shifNames length:",
        shifNames ? shifNames.length : "null"
      );

      if (!shifNames || shifNames.length === 0) {
        console.warn("⚠️ [getShiftTimingsByFacility] No shift names provided");
        return;
      }

      const shift = shifNames[0];
      console.log(
        "🎯 [getShiftTimingsByFacility] Processing shift:",
        JSON.stringify(shift, null, 2)
      );

      // Convert milliseconds to HH:mm
      console.log(
        "⏰ [getShiftTimingsByFacility] Raw Start_Time__c (ms):",
        shift.Start_Time__c
      );
      console.log(
        "⏰ [getShiftTimingsByFacility] Raw End_Time__c (ms):",
        shift.End_Time__c
      );

      const startTime24 = this.formatMillisecondsToTime(shift.Start_Time__c);
      const endTime24 = this.formatMillisecondsToTime(shift.End_Time__c);

      console.log(
        "🕒 [getShiftTimingsByFacility] Formatted Start Time (24hr):",
        startTime24
      );
      console.log(
        "🕒 [getShiftTimingsByFacility] Formatted End Time (24hr):",
        endTime24
      );

      // Convert to AM/PM object
      console.log(
        "🔄 [getShiftTimingsByFacility] Converting to AM/PM format..."
      );
      const startAmPm = this.convertToAmPmObject(startTime24);
      const endAmPm = this.convertToAmPmObject(endTime24);

      console.log(
        "🌅 [getShiftTimingsByFacility] Start Time AM/PM Object:",
        JSON.stringify(startAmPm, null, 2)
      );
      console.log(
        "🌇 [getShiftTimingsByFacility] End Time AM/PM Object:",
        JSON.stringify(endAmPm, null, 2)
      );

      // Set ISO and AM/PM display values
      this.AddShiftStartTime = startTime24 ? `${startTime24}:00Z` : "00:00:00Z";
      this.AddShiftEndTime = endTime24 ? `${endTime24}:00Z` : "00:00:00Z";
      this.AddShiftStartTimeAMPM = startAmPm.displayTime;
      this.AddShiftEndTimeAMPM = endAmPm.displayTime;
      this.shiftDuration = shift.Duration__c;

      console.log("✅ [getShiftTimingsByFacility] Final Results:");
      console.log("   - AddShiftStartTime (ISO):", this.AddShiftStartTime);
      console.log("   - AddShiftEndTime (ISO):", this.AddShiftEndTime);
      console.log("   - AddShiftStartTimeAMPM:", this.AddShiftStartTimeAMPM);
      console.log("   - AddShiftEndTimeAMPM:", this.AddShiftEndTimeAMPM);
      console.log("   - Shift Duration:", this.shiftDuration);

      console.log(
        "🚀 [getShiftTimingsByFacility] Calling dispalyAmPMFormat..."
      );

      // Display formatting method
      this.dispalyAmPMFormat();

      console.log("✅ [getShiftTimingsByFacility] Completed successfully");
    } catch (error) {
      console.error("❌ [getShiftTimingsByFacility] Error:", error);
      console.error("❌ [getShiftTimingsByFacility] Error stack:", error.stack);
    }
    console.log("🔄 [getShiftTimingsByFacility] END");
  }

  dispalyAmPMFormat() {
    console.log("🔄 [dispalyAmPMFormat] START");
    console.log("📥 [dispalyAmPMFormat] Input values:");
    console.log("   - AddShiftStartTimeAMPM:", this.AddShiftStartTimeAMPM);
    console.log("   - AddShiftEndTimeAMPM:", this.AddShiftEndTimeAMPM);

    // Process Start Time
    if (this.AddShiftStartTimeAMPM) {
      console.log(
        "🔧 [dispalyAmPMFormat] Processing Start Time:",
        this.AddShiftStartTimeAMPM
      );

      let [time, period] = this.AddShiftStartTimeAMPM.split(" ");
      let [startHour, startMinute] = time.split(":");

      this.startTimeSelectedHour = startHour;
      this.startTimeSelectedMinute = startMinute;
      this.startTimeAMPM = period == "AM" ? "AM" : "PM";

      console.log("✅ [dispalyAmPMFormat] Start Time Parsed:");
      console.log("   - Raw String:", this.AddShiftStartTimeAMPM);
      console.log("   - Time Part:", time);
      console.log("   - Period Part:", period);
      console.log("   - Hour:", startHour);
      console.log("   - Minute:", startMinute);
      console.log("   - Is AM?:", this.startTimeAMPM);
      console.log("   - startTimeSelectedHour:", this.startTimeSelectedHour);
      console.log(
        "   - startTimeSelectedMinute:",
        this.startTimeSelectedMinute
      );
      console.log("   - startTimeAMPM:", this.startTimeAMPM);
    } else {
      console.warn(
        "⚠️ [dispalyAmPMFormat] AddShiftStartTimeAMPM is empty or undefined"
      );
    }

    // Process End Time
    if (this.AddShiftEndTimeAMPM) {
      console.log(
        "🔧 [dispalyAmPMFormat] Processing End Time:",
        this.AddShiftEndTimeAMPM
      );

      let [time, period] = this.AddShiftEndTimeAMPM.split(" ");
      let [endHour, endMinute] = time.split(":");

      this.endTimeSelectedHour = endHour;
      this.endTimeSelectedMinute = endMinute;
      this.endTimeAMPM = period == "AM" ? "AM" : "PM";

      console.log("✅ [dispalyAmPMFormat] End Time Parsed:");
      console.log("   - Raw String:", this.AddShiftEndTimeAMPM);
      console.log("   - Time Part:", time);
      console.log("   - Period Part:", period);
      console.log("   - Hour:", endHour);
      console.log("   - Minute:", endMinute);
      console.log("   - Is AM?:", this.endTimeAMPM);
      console.log("   - endTimeSelectedHour:", this.endTimeSelectedHour);
      console.log("   - endTimeSelectedMinute:", this.endTimeSelectedMinute);
      console.log("   - endTimeAMPM:", this.endTimeAMPM);
    } else {
      console.warn(
        "⚠️ [dispalyAmPMFormat] AddShiftEndTimeAMPM is empty or undefined"
      );
    }

    console.log("🚀 [dispalyAmPMFormat] Calling updateShiftDates...");
    this.updateShiftDates();

    console.log("🔄 [dispalyAmPMFormat] END");
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

  getOrganisationTimings() {
    this.cutsomShiftTemplate = false;
    this.IsLongShift = false;
    console.log(" start date " + this.todayDate);
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
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetails = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetails.minute;
        this.startTimeSelectedHour = starttimeDetails.hour;
        this.startTimeAMPM = starttimeDetails.period;

        console.log("this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM);
        const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
        this.endTimeSelectedMinute = endtimeDetails.minute;
        this.endTimeSelectedHour = endtimeDetails.hour;
        this.endTimeAMPM = endtimeDetails.period;
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

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsAfternoon = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailsAfternoon.minute;
        this.startTimeSelectedHour = starttimeDetailsAfternoon.hour;
        this.startTimeAMPM = starttimeDetailsAfternoon.period;

        console.log("this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM);
        const endtimeDetailsAfternoon = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsAfternoon.minute;
        this.endTimeSelectedHour = endtimeDetailsAfternoon.hour;
        this.endTimeAMPM = endtimeDetailsAfternoon.period;
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

        console.log("this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM);
        const endtimeDetailsNight = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsNight.minute;
        this.endTimeSelectedHour = endtimeDetailsNight.hour;
        this.endTimeAMPM = endtimeDetailsNight.period;
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

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsGeneral = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailsGeneral.minute;
        this.startTimeSelectedHour = starttimeDetailsGeneral.hour;
        this.startTimeAMPM = starttimeDetailsGeneral.period;

        console.log("this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM);
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
          " endtimeDetailsGeneral==>" + JSON.stringify(endtimeDetailsGeneral)
        );
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

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsCustom = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );
        this.startTimeSelectedMinute = starttimeDetailsCustom.minute;
        this.startTimeSelectedHour = starttimeDetailsCustom.hour;
        this.startTimeAMPM = starttimeDetailsCustom.period;

        console.log("this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM);
        const endtimeDetailsCustom = this.splitTimeParts(
          this.AddShiftEndTimeAMPM
        );
        this.endTimeSelectedMinute = endtimeDetailsCustom.minute;
        this.endTimeSelectedHour = endtimeDetailsCustom.hour;
        this.endTimeAMPM = endtimeDetailsCustom.period;
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

        console.log(
          "this.AddShiftStartTimeAMPM >>" + this.AddShiftStartTimeAMPM
        );
        const starttimeDetailsSleepover = this.splitTimeParts(
          this.AddShiftStartTimeAMPM
        );

        this.startTimeSelectedMinute = starttimeDetailsSleepover.minute;
        this.startTimeSelectedHour = starttimeDetailsSleepover.hour;
        this.startTimeAMPM = starttimeDetailsSleepover.period;

        console.log("this.AddShiftEndTimeAMPM==>" + this.AddShiftEndTimeAMPM);
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

    this.updateShiftDates();
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
        this.updateShiftDates();
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
  
    closeErrorModal() {
        // Close the modal
        this.showErrorModal = false;
        // Clear the errors
        this.staffDateConflicts = [];

    }

  updateShiftDates() {
    console.log("this.todayDate==>", this.todayDate);
    console.log(" this.startTimeAMPM==>" + this.startTimeAMPM);
    console.log("this.AddShiftEndTimeAMPM==>" + this.endTimeAMPM);
    console.log("this.shiftTypeValue==>" + this.shiftTypeValue);
    // Convert DD/MM/YYYY to YYYY-MM-DD format
    const dateParts = this.todayDate.split("/");
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // YYYY-MM-DD

    let startDate = new Date(formattedDate);
    let endDate = new Date(formattedDate);

    if (
      this.shiftTypeValue === "Night" ||
      this.shiftTypeValue === "Sleepover"
    ) {
      if (this.endTimeAMPM === "AM" && this.startTimeAMPM === "PM") {
        //endDate.setDate(endDate.getDate() + 1);) {
        endDate.setDate(endDate.getDate() + 1);
        console.log("Formatted Start Date:", startDate);
        console.log("Formatted End Date:", endDate);
      }

      if (this.startTimeAMPM === "AM" && this.startTimeAMPM === "AM") {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
      }
    } else if (this.shiftTypeValue === "Custom") {
      if (this.startTimeAMPM === "AM" && this.endTimeAMPM === "AM") {
        endDate.setDate(endDate.getDate() + 1);
      } else if (this.endTimeAMPM === "PM") {
        //startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
      }
    }

    const formatDate = (date) => {
      let day = date.getDate().toString().padStart(2, "0");
      let month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
      let year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    this.todayDate = formatDate(startDate);
    console.log("Updated Start Date:", this.todayDate);
    this.endDate = formatDate(endDate);
    console.log("Updated End Date:", this.endDate);
    console.log("Updated Start time:", this.AddShiftStartTime);
    console.log("Updated End time:", this.AddShiftEndTime);
    console.log("StaffId:", this.StaffId);

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
    this.isSaveDisabled = false;
    this.startTime = event.target.value;
    const childData = event.detail;
    this.AddShiftStartTimeAMPM = childData.displaytime;

    this.AddShiftStartTime = this.convertTo24HourFormat(
      this.AddShiftStartTimeAMPM.toLowerCase()
    );

    const starttimeDetailsSleepover = this.splitTimeParts(
      this.AddShiftStartTimeAMPM
    );
    this.startTimeSelectedMinute = starttimeDetailsSleepover.minute;
    this.startTimeSelectedHour = starttimeDetailsSleepover.hour;
    this.startTimeAMPM = starttimeDetailsSleepover.period;

    console.log("this.AddShiftEndTime==>", this.AddShiftEndTime);
    console.log("this.AddShiftStartTime==>", this.AddShiftStartTime);
   console.log("this.shiftTypeValue==>", this.shiftTypeValue);

    let hasError = false;

    if (this.AddShiftEndTime) {
      this.shiftDurationMax = this.calculateDuration(
        this.AddShiftStartTime,
        this.AddShiftEndTime
      );
     console.log("⏱ Duration (hours) in strat time :", this.shiftDuration);
    console.log("this.shiftDurationMax in strat time==>", this.shiftDurationMax);
      // 🔥 Compare and show toast
      if (this.shiftDuration < this.shiftDurationMax && this.shiftDuration !=0 && this.shiftTypeValue !='Sleepover Shift') {
        this.showToast(
          "Error",
          `Shift duration (${this.shiftDuration} hrs) is less than the expected duration (${this.shiftDurationMax} hrs).`,
          "error"
        );
        this.isSaveDisabled = true;
        hasError = true;
      }
    }

    // ✅ Only run updateShiftDates if no error
    if (!hasError) {
      this.updateShiftDates();
    }
  }

  handleEndTimeChange(event) {
    const childData = event.detail;
    this.AddShiftEndTimeAMPM = childData.displaytime;

    this.AddShiftEndTime = this.convertTo24HourFormat(
      this.AddShiftEndTimeAMPM.toLowerCase()
    );

    const endtimeDetailsSleepover = this.splitTimeParts(
      this.AddShiftEndTimeAMPM
    );
    this.endTimeSelectedMinute = endtimeDetailsSleepover.minute;
    this.endTimeSelectedHour = endtimeDetailsSleepover.hour;
    this.endTimeAMPM = endtimeDetailsSleepover.period;

    console.log("this.AddShiftEndTime==>", this.AddShiftEndTime);
    console.log("this.AddShiftStartTime==>", this.AddShiftStartTime);
  console.log("this.shiftTypeValue==>", this.shiftTypeValue);

    let hasError = false;

    if (this.AddShiftStartTime) {
      this.shiftDurationMax = this.calculateDuration(
        this.AddShiftStartTime,
        this.AddShiftEndTime
      );
    console.log("⏱ Duration (hours) in end time :", this.shiftDuration);
    console.log("this.shiftDurationMax in end time==>", this.shiftDurationMax);

      // Compare actual duration with max (if you need same validation rule)
      if (this.shiftDuration < this.shiftDurationMax  && this.shiftDuration !=0 && this.shiftTypeValue !='Sleepover Shift') {
        this.showToast(
          "Error",
          `Shift duration (${this.shiftDuration} hrs) is less than the expected duration (${this.shiftDurationMax} hrs).`,
          "error"
        );
        this.isSaveDisabled = true;
        hasError = true;
      }
    }

    // ✅ Only run updateShiftDates if no error
    if (!hasError) {
      this.updateShiftDates();
    }
  }

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) {
        console.warn("Missing start or end time for duration calc", {
            startTime,
            endTime
        });
        return null;
    }

    // Convert both to numbers (ms)
    const start = this.parseTimeToMs(startTime);
    const end = this.parseTimeToMs(endTime);

    console.log("Parsed time values:", {
        startTime,
        endTime,
        startMs: start,
        endMs: end
    });

    let durationMs = end - start;

    // Handle overnight
    if (durationMs < 0) {
        console.log(
            "Overnight detected. Adjusting duration by +24h",
            { originalDurationMs: durationMs }
        );
        durationMs += 24 * 60 * 60 * 1000;
    }

    const hours = durationMs / (1000 * 60 * 60);

    console.log("Final duration (hrs):", hours.toFixed(2));

    return Number(hours.toFixed(2));
}


  parseTimeToMs(time24) {
    if (!time24) return 0;

    // remove Z if exists
    let cleanTime = time24.replace("Z", "");

    // Expecting format "HH:mm:ss" or "HH:mm"
    const [h, m, s = "0"] = cleanTime.split(":");
    return (+h * 60 * 60 + +m * 60 + +s) * 1000;
  }

  @track isRecurring = false;
  handleReccuringChange(event) {
    console.log("Reccuring Change: ", event.target.checked);
    this.AddShiftRecurringCheckboxValue = event.target.checked;
    this.isRecurring = this.AddShiftRecurringCheckboxValue;
  }

  @track typeOfRecur;
  handleRecurChange(event) {
    this.selectedDays = [];
    this.recurEndDate = "";
    this.recurEveryValue = "";
    const selectedValue = event.detail.value;
    this.typeOfRecur = selectedValue;
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
  }

  handleRecurEveryChange(event) {
    const selectedValue = event.detail.value;
    console.log("Recur Every Option Selected:", selectedValue);
    this.recurEveryValue = selectedValue;
  }

  handleMonthlyOptionChange(event) {
    this.monthOfDay = event.target.value;
    console.log("Monthly Option Selected:", this.monthOfDay);
  }

  @track isSaveDisabled = false;
  async handleRecurEndDateChange(event) {
    this.recurEndDate = event.detail.value;
   /*  await this.DocExpiryCheck(this.recurEndDate);
    if (this.documentExpired) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "One or more documents have expired. Please update them before proceeding.",
          variant: "error"
        })
      );
      return;
    } */

    console.log("Recurrence End Date selected:", this.recurEndDate);
    console.log("this.todayDate >>" + this.todayDate);
    let parts = this.todayDate.split("/");
    let formattedTodayDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    console.log("Formatted Date:", formattedTodayDate); // "2025-05-01"

    const recurDate = new Date(this.recurEndDate);
    const today = new Date(formattedTodayDate);
    console.log("recurDate >>" + recurDate + " today >>" + today);

    // Normalize both dates to remove time differences
    recurDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    console.log("recurDate >>" + recurDate + " today >>" + today);

    if (recurDate <= today) {
      this.recurEndDate = null; // Clear the invalid selection
      this.showToast(
        "Validation Error",
        "Recurrence End Date must be before Available Date.",
        "error"
      );
      this.isSaveDisabled = true;
      // Optionally trigger UI error here
    } else {
      this.isSaveDisabled = false; // Enable save button
    }
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
  }

  @track AvaliableId;
   async handlesavebutton(event) {
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
      let staffIds=[];
      staffIds.push(this.StaffId);
   

    
      if(this.AddShiftRecurringCheckboxValue ){
            console.log("Save button clicked");
            console.log('🔍 Starting getNumberOfRecurrences call...');
            console.log('📅 Input parameters:');
            console.log('   - typeOfRecur:', this.typeOfRecur);
            console.log('   - recurEvery:', parseInt(this.recurEveryValue));
            console.log('   - endDate (original):', this.recurEndDate);
            console.log('   - endDate (converted):', this.recurEndDate.split('/').reverse().join('-'));
            console.log('   - shiftDateFormatted (original):', this.todayDate);
            console.log('   - shiftDateFormatted (converted):', this.todayDate.split('/').reverse().join('-'));
            console.log('   - weeklyDays:', this.selectedDays);
            console.log('   - monthlyDay:', this.monthOfDay);

            const recurrenceResult = await getNumberOfRecurrences({
                  typeOfRecur: this.typeOfRecur,
                  recurEvery: parseInt(this.recurEveryValue),
                  endDate: this.recurEndDate.split('/').reverse().join('-'),
                  shiftDate: this.todayDate.split('/').reverse().join('-'),
                  weeklyDays: this.selectedDays,
                  monthlyDay: this.monthOfDay
            });


      this.recurrenceDates =recurrenceResult.RecurrenceDates;
      console.log('✅ getRecurrenceDates result==> ' + JSON.stringify(recurrenceResult));
      }else{

      this.recurrenceDates= [this.todayDate.split('/').reverse().join('-')];
      }

     console.log('✅ getRecurrenceDates result==> ' + JSON.stringify(this.recurrenceDates));

    
  const result = await validateStaffAvailabilityWithReasons({
                staffIds: staffIds,
                inputDates: this.recurrenceDates,
                startTimeStr: this.AddShiftStartTimeAMPM,
                endTimeStr: this.AddShiftEndTimeAMPM,
                isAvailability: 'Yes',
                isEditMode: this.AvaliableId !=null &&  this.AvaliableId !=undefined && this.AvaliableId !=''  ,
                currentShiftId: null,
                currentAvailabilityId:this.AvaliableId
            });
      this.confictData=result;
            console.log('✅ validateStaffAvailabilityWithReasons ' + JSON.stringify(result));
            const isOverlapping=  this.handleNonRecurringValidation(result); 
                  console.log("this.shiftTypeValue:", this.shiftTypeValue);
                  console.log("Recurring:", this.AddShiftRecurringCheckboxValue);
                  console.log("Updated selectedDays:", JSON.stringify(this.selectedDays));
                  console.log("AddShiftStartTimeAMPM:", this.AddShiftStartTimeAMPM);
                  console.log("AddShiftEndTimeAMPM:", this.AddShiftEndTimeAMPM);
                  console.log("End Date:", this.endDate);

  }

  executeSaveStaffData() {
    console.log("this.shiftTypeValue:", this.shiftTypeValue);
    console.log("Recurring:", this.AddShiftRecurringCheckboxValue);
    console.log("Updated selectedDays:", JSON.stringify(this.selectedDays));
    console.log("AddShiftStartTimeAMPM:", this.AddShiftStartTimeAMPM);
    console.log("AddShiftEndTimeAMPM:", this.AddShiftEndTimeAMPM);
    console.log("End Date:", this.endDate);
     console.log('availableValue',this.availableValue);

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
                monthlyDay: this.monthOfDay,
                recurEvery: parseInt(this.recurEveryValue),
                shfitEndDate: this.endDate,
                shiftName: this.shiftNameValue,
                validationData: JSON.stringify(this.confictData),
                originalDates:this.recurrenceDates,
                availableValue:this.availableValue
              })
                .then(() => {
                  this.dispatchEvent(
                    new ShowToastEvent({
                      title: "Success",
                      message: this.successmessage,
                      variant: "success"
                    })
                  );
                  this.showErrorModal =false;
                  this.fetchHolidays();
                  this.fetchAvailability();
                  this.fetchApprovedLeaves();
                  this.editButtonModule = false;
                  this.resetFields();
                })
                .catch((error) => {
                   this.showErrorModal =false;
                  console.error("Error saving shift:", error);
                  this.dispatchEvent(
                    new ShowToastEvent({
                      title: "Error",
                      message: "Failed to save availability",
                      variant: "error"
                    })
                  );
                });
  } 

  hanleRecurShiftsCreation(){
    this.executeSaveStaffData();
  }
    handleNonRecurringValidation(validationResult) {
    this.staffDateConflicts = [];
    
    for (const [staffId, dateReasons] of Object.entries(validationResult)) {
        if (Object.keys(dateReasons).length > 0) {
    
            const conflictDates = [];
            for (const [dateString, reason] of Object.entries(dateReasons)) {
                conflictDates.push({
                    dateString: this.formatDateForApex(dateString), // Format for backend
                    displayDate: this.formatDisplayDate(dateString), // Format for UI
                    reason: reason
                });
            }
            
            this.staffDateConflicts.push({
                staffId: staffId,
                conflictDates: conflictDates
            });
        }
    }
    console.log('this.staffDateConflicts  result==> '+JSON.stringify(this.staffDateConflicts));
    if (this.staffDateConflicts.length > 0) {
        this.showErrorModal = true;
       
    }else{
       this.executeSaveStaffData();
    }
     // 
  
}
 formatDateForApex(dateString) {
      // Convert to YYYY-MM-DD format for backend
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      }

formatDisplayDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
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
    this.shiftNameValue = null;
    this.availableValue = 'Available';

    // Optional: If you want to clear any UI elements, you can also reset their values.
    console.log("Fields have been reset.");
  }

  handleEditClick(event) {
    this.headingLabel = "Edit Availability";
    this.successmessage = "Availability shift updated successfully.";
    this.savebutton = "Update";
    this.recurrenceDates=[];
    this.confictData=[];
    // Prevent default link behavior
    event.preventDefault();
    console.log("shiftname >>>" + event.currentTarget.dataset.shiftname);

    const availabilityId = event.currentTarget.dataset.id;
    const startTime = event.currentTarget.dataset.starttime;
    const endTime = event.currentTarget.dataset.endtime;
    const startDate = event.currentTarget.dataset.startdate;
    const shifttype = event.currentTarget.dataset.shifttype;
    const shiftName = event.currentTarget.dataset.shiftname;
    this.availableValue =event.currentTarget.dataset.available;

    this.AvaliableId = availabilityId;
    console.log("Selected Availability ID:", availabilityId);
    console.log("this.AvaliableId >> " + this.AvaliableId);
    console.log("Start Time:", startTime);
    console.log("End Time:", endTime);
    console.log("Start Date:", startDate);
    console.log("Shift Type:", shifttype);
    console.log("Shift Name:", shiftName);

    this.AddShiftStartTimeAMPM = startTime;
    const starttimeDetails = this.splitTimeParts(this.AddShiftStartTimeAMPM);
    this.startTimeSelectedMinute = starttimeDetails.minute;
    this.startTimeSelectedHour = starttimeDetails.hour;
    this.startTimeAMPM = starttimeDetails.period;

    this.AddShiftEndTimeAMPM = endTime;
    const endtimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM);
    this.endTimeSelectedMinute = endtimeDetails.minute;
    this.endTimeSelectedHour = endtimeDetails.hour;
    this.endTimeAMPM = endtimeDetails.period;

    this.shiftTypeValue = shifttype;
    this.AddShiftStartTime = this.convertTo24HourFormat(
      this.AddShiftStartTimeAMPM.toLowerCase()
    );
    this.AddShiftEndTime = this.convertTo24HourFormat(
      this.AddShiftEndTimeAMPM.toLowerCase()
    );

    // Format the selected date into dd/mm/yyyy
    const parts = startDate.split("-");
    let formattedDate = "";
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
      console.error("Invalid date format received:", selectedDate);
    }

    console.log("Formatted Selected Date:", formattedDate);

    this.todayDate = formattedDate;
    this.todayDateforheader = formattedDate;
    this.shiftNameValue = shiftName;

    this.isPopoverVisible = false;
    this.isSaveDisabled = false;
    this.editButtonModule = true;
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

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant // 'error', 'success', 'info', or 'warning'
    });
    this.dispatchEvent(event);
  }
  handleAvailableRadioChange(event){
    this.availableValue=event.target.value;
    console.log('availableValue',this.availableValue);
  }
handleTimePickerOpen(event) {
    const openedPicker = event.target;

    const allPickers =
        this.template.querySelectorAll('c-tesseract-apps-time-picker');

    allPickers.forEach(picker => {
        if (picker !== openedPicker) {
            picker.closeDropdown();
        }
    });
  }

  renderedCallback() {
    if (!this.resizeObserver) {
      const container = this.template.querySelector('.table-container');
      if (container) {
        this.resizeObserver = new ResizeObserver(() => {
          this.handleResize();
        });
        this.resizeObserver.observe(container);
      }
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  handleResize() {
    if (this.isPageSizeManuallySet) {
      return;
    }
    this.setPageSizeByZoomAndScreen();
  }

  handleRecordsPerPage(event) {
    const value = event.detail.value;
    if (value === 'Auto') {
      this.isPageSizeManuallySet = false;
      this.setPageSizeByZoomAndScreen();
    } else {
      this.isPageSizeManuallySet = true;
      this.recordsPerPage = parseInt(value, 10);
    }
  }

  setPageSizeByZoomAndScreen() {
    const container = this.template.querySelector('.table-container');
    if (!container) {
      return;
    }
    const containerHeight = container.getBoundingClientRect().height;
    const headerElement = this.template.querySelector('.calendar-header');
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 50;
    const rowHeight = 120; // estimate day-cell height
    const availableHeight = containerHeight - headerHeight - 100; // padding/margin buffer
    if (availableHeight > 0) {
      const calculatedRows = Math.floor(availableHeight / rowHeight) * 7;
      this.recordsPerPage = Math.max(calculatedRows, 10);
    }
  }

  get pageSizeOptions() {
    return [
      { label: 'Auto', value: 'Auto' },
      { label: '10', value: '10' },
      { label: '20', value: '20' },
      { label: '50', value: '50' }
    ];
  }
}