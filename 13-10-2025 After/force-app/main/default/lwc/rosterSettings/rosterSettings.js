import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import orgDetailsCommunity from "@salesforce/apex/OrgDetails.orgDetailsCommunity";
import getfacilityById from "@salesforce/apex/FacilityController.getfacilityById";
import saveMultipleShifts from "@salesforce/apex/ShiftTypeTimings.saveMultipleShifts";
import getShiftsByFacility from "@salesforce/apex/ShiftTypeTimings.getShiftsByFacility";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";

export default class RosterSettings extends LightningElement {
  @api typeofuser;
  @api isOrgAdmin = false;
  @api facilitylist;
  @api facilityoptions;
  @track facilityValue = "";
  @track isEdit = false;
  @track isEditShow = true;
  @track isSaving = false;
  @track costPerKmElectric = 0.99;
  @track costPerKmFuel = 0.99;
  @track shifts = [];
  @track shiftsforDesign = [];
  @track templates = [];
  @track activeTab = "participant";
  @track savebuttonDisable = false;
  @track userType;
  @track maxDurationDisable = true;
  @track maxDurationDefault = 0;
  @track maxDurationown = 0;
  @track maxDurationcustom = 0;

  shiftTypeOptions = [
    { label: "General", value: "General" },
    { label: "Morning", value: "Morning" },
    { label: "Afternoon", value: "Afternoon" },
    { label: "Night", value: "Night" },
    { label: "Sleepover Shift", value: "Sleepover Shift" }
  ];

  shiftTypeOptionsforCustom = [
    { label: "Morning", value: "Morning" },
    { label: "Afternoon", value: "Afternoon" },
    { label: "Night", value: "Night" },
    { label: "Sleepover Shift", value: "Sleepover Shift" }
  ];

  colorOptions = [
    { label: "Light Red", value: "#FFADAD" },
    { label: "Light Orange", value: "#FFD6A5" },
    { label: "Light Yellow", value: "#FDFFB6" },
    { label: "Light Green", value: "#CAFFBF" },
    { label: "Light Blue", value: "#9BF6FF" },
    { label: "Pale Blue", value: "#A0C4FF" },
    { label: "Lavender", value: "#DDD8FF" },
    { label: "Light Pink", value: "#FFC6FF" },
    { label: "Light Beige", value: "#FDE8B3" },
    { label: "Light Aqua", value: "#C6EAED" },
    { label: "Soft Yellow", value: "#E4E87E" },
    { label: "Magenta Pink", value: "#AE016A" },
    { label: "Vibrant Blue", value: "#0C7CEC" },
    { label: "Burnt Orange", value: "#D35701" },
    { label: "Deep Navy", value: "#0E185F" },
    { label: "Teal Green", value: "#0D815C" }
  ];

  get isParticipantView() {
    return this.activeTab === "participant";
  }

  get isStaffView() {
    return this.activeTab === "staff";
  }

  get participantTabClass() {
    return this.activeTab === "participant"
      ? "tab-button active-tab"
      : "tab-button inactive-tab";
  }

  get staffTabClass() {
    return this.activeTab === "staff"
      ? "tab-button active-tab"
      : "tab-button inactive-tab";
  }

  fetchUserInfo() {
    getCurrentLoggedUserInfo()
      .then((result) => {
        this.userInfo = result;
        console.log("✅ Logged-in User Info:", result);
        this.userType = result.User_Type__c;
        console.log("✅ User Type:", this.userType);
        if (
          this.userType == "NDIS Org Admin" ||
          this.userType == "Facility Admin"
        ) {
          this.maxDurationDisable = false;
        }
      })
      .catch((error) => {
        this.error = error;
        console.error("❌ Error fetching user info:", error);
      });
  }

  handleParticipantTab() {
    this.activeTab = "participant";
  }

  handleStaffTab() {
    this.activeTab = "staff";
  }

  connectedCallback() {
    console.log("CONNECTED CALLBACK");
    console.log("typeofuser " + this.typeofuser);
    console.log("facility options " + JSON.stringify(this.facilityoptions));
    this.fetchUserInfo();

    this.isOrgAdmin = this.typeofuser === "NDIS Org Admin";

    if (this.facilityoptions && this.facilityoptions.length > 0) {
      this.facilityValue = this.facilityoptions[0].value;
      console.log("this.facilityValue >>", this.facilityValue);
      if (this.facilityValue) {
        console.log("this.facilityValue >>", this.facilityValue);
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
      .then((result) => {
        console.log("org data:", JSON.stringify(result));
        this.costPerKmElectric = result.Cost_per_Km_Electric__c || 0.99;
        this.costPerKmFuel = result.Cost_per_Km_Fuel__c || 0.99;
      })
      .catch((error) => {
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
        console.log(
          "✅ [loadFacilityData] Facility result:",
          JSON.stringify(facilityResult)
        );
        console.log(
          "✅ [loadFacilityData] Shifts result:",
          JSON.stringify(shiftsResult)
        );

        // Update cost information
        ((this.costPerKmElectric = facilityResult.Cost_per_Km_Electric__c || 0),
          99);
        this.costPerKmFuel = facilityResult.Cost_per_Km_Fuel__c || 0.99;
        console.log(
          `💰 costPerKmElectric: ${this.costPerKmElectric}, costPerKmFuel: ${this.costPerKmFuel}`
        );

        if (shiftsResult && shiftsResult.length > 0) {
          // Separate by type
          const defaultAndOwnShifts = shiftsResult.filter(
            (s) => s.Type_of_Shift__c !== "Custom"
          );
          const customShifts = shiftsResult.filter(
            (s) => s.Type_of_Shift__c === "Custom"
          );

          // Process separately
          this.updateShiftsWithSalesforceData(defaultAndOwnShifts);
          if (customShifts && customShifts.length > 0) {
            this.updateCustomShiftsWithSalesforceData(customShifts);
          } else {
            this.templates = this.getDefaultShiftsforCustom();
          }
        } else {
          console.warn("⚠️ No shifts returned from Salesforce.");
          this.shifts = this.getDefaultShifts();
          this.shiftsforDesign = this.getDefaultShiftsforOwn();
          this.templates = this.getDefaultShiftsforCustom();
          console.log(
            "✅ Default Shifts Assigned:",
            JSON.parse(JSON.stringify(this.shifts))
          );
        }

        console.log("🏁 [loadFacilityData] END");
      })
      .catch((error) => {
        console.error("❌ [loadFacilityData] Error:", error);
        this.handleError(error);
      });
  }

  updateShiftsWithSalesforceData(salesforceShifts) {
    console.log("🚀 [updateShiftsWithSalesforceData] START");
    console.log(
      "📌 Incoming Salesforce Shifts:",
      JSON.parse(JSON.stringify(salesforceShifts))
    );

    // Initialize arrays for separation
    this.shifts = [];
    this.shiftsforDesign = [];

    if (!salesforceShifts || salesforceShifts.length === 0) {
      console.warn("⚠️ No Salesforce shifts found. Loading default shifts...");
      this.shifts = this.getDefaultShifts();
      this.shiftsforDesign = this.getDefaultShiftsforOwn();
      console.log(
        "✅ Default Shifts Assigned:",
        JSON.parse(JSON.stringify(this.shifts))
      );
      return;
    }

    salesforceShifts.forEach((sfShift, index) => {
      console.log(
        `➡️ Processing Shift [${index + 1}/${salesforceShifts.length}]:`,
        JSON.parse(JSON.stringify(sfShift))
      );

      let localShift = {
        salesforceId: sfShift.Id || null,
        isSalesforceRecord: !!sfShift.Id, // ✅ true if salesforceId exists
        name: sfShift.Name || "",
        shiftType: sfShift.Shift_Type__c || "",
        color: sfShift.Colour__c || "#ccc",
        colorStyle: `background-color: ${sfShift.Colour__c || "#ccc"}; width: 25px; height: 25px; border: 1px solid #ccc;`,
        duration: sfShift.Duration__c,
        durationActual: sfShift.Actual_Duration__c,
        computedId: sfShift.Id || `temp-${index}`
      };

      // Start Time
      const rawStart = sfShift.Start_Time__c || 0;
      localShift.startTime24 = this.formatTimeToUTC(rawStart);
      localShift.displayedStartTime = this.convertTo12HourFormat(rawStart);
      const startParts = this.splitTimeParts(localShift.displayedStartTime);
      localShift.startHour = startParts.hour;
      localShift.startMinute = startParts.minute;
      localShift.startAMPM = startParts.period;

      // End Time
      const rawEnd = sfShift.End_Time__c || 0;
      localShift.endTime24 = this.formatTimeToUTC(rawEnd);
      localShift.displayedEndTime = this.convertTo12HourFormat(rawEnd);
      const endParts = this.splitTimeParts(localShift.displayedEndTime);
      localShift.endHour = endParts.hour;
      localShift.endMinute = endParts.minute;
      localShift.endAMPM = endParts.period;

      // Push into respective array
      if (sfShift.Type_of_Shift__c === "Default") {
        this.shifts.push(localShift);
      } else if (sfShift.Type_of_Shift__c === "Own") {
        this.shiftsforDesign.push(localShift);
      }

      console.log(
        "📦 Local Shift Created:",
        JSON.parse(JSON.stringify(localShift))
      );
    });

    // Fallback defaults if empty
    if (!this.shifts || this.shifts.length === 0) {
      this.shifts = this.getDefaultShifts();
    }
    if (!this.shiftsforDesign || this.shiftsforDesign.length === 0) {
      this.shiftsforDesign = this.getDefaultShiftsforOwn();
    }

    console.log(
      "✅ Final Default Shifts:",
      JSON.parse(JSON.stringify(this.shifts))
    );
    console.log(
      "✅ Final Own Shifts:",
      JSON.parse(JSON.stringify(this.shiftsforDesign))
    );
    console.log("🏁 [updateShiftsWithSalesforceData] END");
  }

  formatTimeToUTC(milliseconds) {
    // Convert milliseconds to hours and minutes
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    // Pad with leading zeros
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");

    // Return in required format
    return `${hh}:${mm}:00.000Z`;
  }

  updateCustomShiftsWithSalesforceData(customShifts) {
    console.log("🚀 [updateCustomShiftsWithSalesforceData] START");
    console.log(
      "📥 Incoming customShifts:",
      JSON.parse(JSON.stringify(customShifts))
    );

    this.templates = [];

    if (customShifts && customShifts.length > 0) {
      customShifts.forEach((sfShift, index) => {
        console.log(`\n🔹 Processing Salesforce Shift #${index + 1}:`, sfShift);

        const mappedShifts = (sfShift.Custom_Shift_Timings__r || []).map(
          (t, tIndex) => {
            const startDisplay = this.convertTo12HourFormat(
              t.Start_Time__c || 0
            );
            const startParts = this.splitTimeParts(startDisplay);
            const endDisplay = this.convertTo12HourFormat(t.End_Time__c || 0);
            const endParts = this.splitTimeParts(endDisplay);

            const mappedShift = {
              id: t.Id,
              salesforceId: t.Id,
              isSalesforceRecord: t.Id,
              name: t.Name || "",
              type: t.Shift_Type__c || "",
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
              duration: t.Duration__c,
              durationActual: t.Actual_Duration__c
            };

            console.log(
              `   📝 Mapped child shift #${tIndex + 1}:`,
              mappedShift
            );
            return mappedShift;
          }
        );

        const templateObj = {
          id: sfShift.Id,
          salesforceId: sfShift.Id,
          isSalesforceRecord: !!sfShift.Id,
          customShiftName: sfShift.Name || "",
          shiftType: "Custom",
          startTime24: sfShift.Start_Time__c || 0,
          endTime24: sfShift.End_Time__c || 0,
          shifts: mappedShifts,
          Facility__c: this.facilityValue,
          showAddButton: mappedShifts.length < 4,
          color: sfShift.Colour__c || "#ccc",
          colorStyle: `background-color: ${sfShift.Colour__c || "#ccc"}; width: 25px; height: 25px; border: 1px solid #ccc;`,
          selectedColor: sfShift.Colour__c || "#ccc",
          duration: sfShift.Duration__c
        };

        console.log("   ✅ Mapped template object:", templateObj);

        this.templates.push(templateObj);
      });
    } else {
      console.warn("⚠️ No Custom Shifts found from Salesforce.");
    }

    console.log(
      "\n📦 Final Updated templates array:",
      JSON.parse(JSON.stringify(this.templates))
    );
    console.log("🏁 [updateCustomShiftsWithSalesforceData] END");
  }

  // Default shifts generator
  getDefaultShifts() {
    function generateShiftId() {
        return 'shift-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    }
    const to24HourTime = (hour, minute, ampm) => {
      let h = parseInt(hour, 10);
      let m = parseInt(minute, 10);

      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`;
    };

    return [
      {
        salesforceId: null,
        name: "General",
        computedId : generateShiftId(),
        shiftType: "General",
        startHour: "9",
        startMinute: "00",
        startAMPM: "AM",
        displayedStartTime: "09:00 AM",
        startTime24: to24HourTime("9", "00", "AM"),
        endHour: "5",
        endMinute: "00",
        endAMPM: "PM",
        duration: '0.00',
        displayedEndTime: "05:00 PM",
        endTime24: to24HourTime("5", "00", "PM"),
        color: "#AE016A",
        durationActual: 8,
        colorStyle:
          "background-color: #AE016A; width: 25px; height: 25px; border: 1px solid #ccc;"
      },
      {
        salesforceId: null,
        computedId : generateShiftId(),
        name: "Morning",
        shiftType: "Morning",
        startHour: "6",
        startMinute: "00",
        startAMPM: "AM",
        displayedStartTime: "06:00 AM",
        startTime24: to24HourTime("6", "00", "AM"),
        endHour: "2",
        endMinute: "00",
        endAMPM: "PM",
        displayedEndTime: "02:00 PM",
        duration: '0.00',
        endTime24: to24HourTime("2", "00", "PM"),
        color: "#0C7CEC",
        durationActual: 8,
        colorStyle:
          "background-color: #0C7CEC; width: 25px; height: 25px; border: 1px solid #ccc;"
      },
      {
        salesforceId: null,
        computedId : generateShiftId(),
        name: "Afternoon",
        shiftType: "Afternoon",
        startHour: "2",
        startMinute: "00",
        startAMPM: "PM",
        displayedStartTime: "02:00 PM",
        startTime24: to24HourTime("2", "00", "PM"),
        endHour: "10",
        endMinute: "00",
        endAMPM: "PM",
        displayedEndTime: "10:00 PM",
        endTime24: to24HourTime("10", "00", "PM"),
        duration: '0.00',
        color: "#D35701",
        durationActual: 8,
        colorStyle:
          "background-color: #D35701; width: 25px; height: 25px; border: 1px solid #ccc;"
      },
      {
        salesforceId: null,
        computedId : generateShiftId(),
        name: "Night",
        shiftType: "Night",
        startHour: "10",
        startMinute: "00",
        startAMPM: "PM",
        displayedStartTime: "10:00 PM",
        startTime24: to24HourTime("10", "00", "PM"),
        endHour: "6",
        endMinute: "00",
        endAMPM: "AM",
        displayedEndTime: "06:00 AM",
        endTime24: to24HourTime("6", "00", "AM"),
        duration: '0.00',
        color: "#0E185F",
        durationActual: 8,
        colorStyle:
          "background-color: #0E185F; width: 25px; height: 25px; border: 1px solid #ccc;"
      },
      {
        salesforceId: null,
        computedId : generateShiftId(),
        name: "Sleepover Shift",
        shiftType: "Sleepover Shift",
        startHour: "10",
        startMinute: "00",
        startAMPM: "PM",
        displayedStartTime: "10:00 AM", // check if this should be PM
        startTime24: to24HourTime("10", "00", "PM"),
        endHour: "8",
        endMinute: "00",
        endAMPM: "AM",
        displayedEndTime: "08:00 AM",
        endTime24: to24HourTime("8", "00", "AM"),
        duration: '0.00',
        color: "#0D815C",
        durationActual: 8,
        colorStyle:
          "background-color: #0D815C; width: 25px; height: 25px; border: 1px solid #ccc;"
      }
    ];
  }

  getDefaultShiftsforOwn() {
    const to24HourTime = (hour, minute, ampm) => {
      let h = parseInt(hour, 10);
      let m = parseInt(minute, 10);

      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`;
    };

    return [
      {
        id: Date.now(),
        salesforceId: null,
        name: "",
        shiftType: "",
        startHour: "12",
        startMinute: "00",
        startAMPM: "AM",
        displayedStartTime: "Select Time",
        startTime24: to24HourTime("12", "00", "AM"),
        duration: '0.00',
        endHour: "12",
        endMinute: "00",
        endAMPM: "AM",
        displayedEndTime: "Select Time",
        endTime24: to24HourTime("12", "00", "AM"),
        color: "#AE016A",
        colorStyle:
          "background-color: #AE016A; width: 25px; height: 25px; border: 1px solid #AE016A;"
      }
    ];
  }

  getDefaultShiftsforCustom() {
    const newId = Date.now().toString(); // Generate unique template ID

    // Return an array with a single default template
    return [
      {
        id: newId,
        customShiftName: "",
        customShiftindex: 1,
        shifts: this.generateDefaultShifts(newId),
        Facility__c: this.facilityValue,
        selectedColor: "#AE016A",
        colorStyle:
          "background-color: #AE016A; width: 25px; height: 25px; border: 1px solid #AE016A;",
        showAddButton: false, // Since always exactly 4 shifts
        showMessage: false,
        message: "",
        messageClass: "",
        messageIcon: ""
      }
    ];
  }

  // Helper to generate 4 empty shifts for a new template
  generateDefaultShifts(templateId) {
    let shifts = [];
    for (let i = 1; i <= 4; i++) {
      shifts.push({
        id: `${templateId}-${i}`,
        name: "",
        type: "",
        startTime: "",
        endTime: "",
        displayIndex: i,
        duration: '0.00',
      });
    }
    return shifts;
  }

  handleFacilityChnage(event) {
    console.log("facility change " + event.target.value);
    this.facilityValue = event.target.value;
    if (this.facilityValue) {
      this.loadFacilityData();
    }
  }

  calculateDuration(shift) {
    if (!shift.startTime24 || !shift.endTime24) {
      console.warn("⏱ Duration not calculated: Missing start or end time", {
        startTime24: shift.startTime24,
        endTime24: shift.endTime24
      });
      return null;
    }

    console.log("---- CALCULATE DURATION ----");
    console.log(
      "Start Time (raw):",
      shift.startTime24,
      "Type:",
      typeof shift.startTime24
    );
    console.log(
      "End Time (raw):",
      shift.endTime24,
      "Type:",
      typeof shift.endTime24
    );

    let start, end;

    // Handle if it's already a number (ms since midnight)
    if (typeof shift.startTime24 === "number") {
      start = new Date(1970, 0, 1);
      start.setMilliseconds(shift.startTime24);
    } else {
      start = new Date(`1970-01-01T${shift.startTime24.replace("Z", "")}Z`);
    }

    if (typeof shift.endTime24 === "number") {
      end = new Date(1970, 0, 1);
      end.setMilliseconds(shift.endTime24);
    } else {
      end = new Date(`1970-01-01T${shift.endTime24.replace("Z", "")}Z`);
    }

    console.log("Start Date object:", start);
    console.log("End Date object:", end);

    let diffMs = end - start;
    console.log("Raw Difference (ms):", diffMs);

    // Handle overnight shifts
    if (diffMs < 0) {
      console.log("🌙 Overnight shift detected. Adjusting end time +24h.");
      diffMs += 24 * 60 * 60 * 1000;
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    console.log("Total Minutes:", diffMinutes);
    console.log("Hours:", hours);
    console.log("Minutes:", minutes);

    const durationStr = `${hours}h ${minutes}m`;
    const durationDecimal = +(hours + minutes / 60).toFixed(2); // e.g. 8.50
    const durationMinutes = diffMinutes; // e.g. 510

    console.log("Calculated Duration (String):", durationStr);
    console.log("Calculated Duration (Decimal Hours):", durationDecimal);
    console.log("Calculated Duration (Minutes):", durationMinutes);
    console.log("-----------------------------");

    // ✅ Return both so you can use what you need
    return {
      display: durationStr,
      decimalHours: durationDecimal,
      totalMinutes: durationMinutes
    };
  }

handleStartTimeChange(event) {
    this.savebuttonDisable = false;
    const localId = event.target.dataset.id;
    const salesforceId = event.target.dataset.salesforceid;
    const displayTime = event.detail.displaytime;

    const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
    const timeDetails = this.splitTimeParts(displayTime);

    let shift = salesforceId
      ? this.shifts.find((s) => s.salesforceId === salesforceId)
      : this.shifts.find((s) => s.id === localId);

    if (shift) {
      // 🛠 Update start time fields
      shift.startHour = timeDetails.hour;
      shift.startMinute = timeDetails.minute;
      shift.startAMPM = timeDetails.period;
      shift.startTime24 = converted24;
      shift.displayedStartTime = displayTime;

      this.clearShiftMessage(shift);

      // ⏱ Calculate duration
      const durationObj = this.calculateDuration(shift);
      shift.durationActual = durationObj ? durationObj.decimalHours : null;

      console.log("Updated Duration (Decimal Hours):", shift.duration);

      const actual = Number(shift.durationActual || 0);
      const entered = Number(shift.duration || 0);

      console.log('entered >>>>', entered);
      console.log('actual >>>>', actual);

      // 🚨 Validate duration mismatch (ignore 0)
      if (entered > 0 && actual > 0 && entered < actual) {
        console.warn("⚠️ Duration mismatch detected!");

        this.showToast(
          'Duration Mismatch',
          `Expected duration: ${shift.duration} hrs, but calculated: ${shift.durationActual.toFixed(2)} hrs.`,
          'error'
        );
        this.savebuttonDisable = true;
      }
    }
}

handleEndTimeChange(event) {
  console.log("🕒 handleEndTimeChange triggered");
  this.savebuttonDisable = false;
  const localId = event.target.dataset.id;
  const salesforceId = event.target.dataset.salesforceid;
  const displayTime = event.detail.displaytime;

  console.log("➡️ localId:", localId);
  console.log("➡️ salesforceId:", salesforceId);
  console.log("➡️ displayTime (user input):", displayTime);

  // ⏱ Convert to 24-hour format and extract time parts
  const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
  const timeDetails = this.splitTimeParts(displayTime);

  console.log("🕓 Converted to 24-hour format:", converted24);
  console.log("🧩 Time details:", timeDetails);

  // 🎯 Find target shift
  const shift = salesforceId
    ? this.shifts.find((s) => s.salesforceId === salesforceId)
    : this.shifts.find((s) => s.id === localId);

  if (!shift) {
    console.log("🚫 No matching shift found for:", { localId, salesforceId });
    return;
  }

  console.log("🎯 Found target shift before update:", JSON.parse(JSON.stringify(shift)));

  // 🛠 Update shift fields
  shift.endHour = timeDetails.hour;
  shift.endMinute = timeDetails.minute;
  shift.endAMPM = timeDetails.period;
  shift.endTime24 = converted24;
  shift.displayedEndTime = displayTime;

  this.clearShiftMessage(shift);

  // ⏱ Calculate duration
  const durationObj = this.calculateDuration(shift);
  shift.durationActual = durationObj ? durationObj.decimalHours : null;

  console.log("🧮 Calculated Duration (Decimal Hours):", shift.durationActual);
  console.log("📏 Expected Duration:", shift.duration);

  const actual = Number(shift.durationActual || 0);
  const entered = Number(shift.duration || 0);

  console.log('entered >>>>', entered);
  console.log('actual >>>>', actual);

  // 🚨 Validate duration mismatch (ignore 0)
  if (entered > 0 && actual > 0 && entered < actual) {
      console.warn("⚠️ Duration mismatch detected!");

      this.showToast(
        'Duration Mismatch',
        `Expected duration: ${shift.duration} hrs, but calculated: ${shift.durationActual.toFixed(2)} hrs.`,
        'error'
      );

      this.savebuttonDisable = true;
  }

  // ✅ Log final shift record
  console.log("✅ Updated shift record:", JSON.parse(JSON.stringify(shift)));
  console.log("📦 All shifts after update:", JSON.parse(JSON.stringify(this.shifts)));
}

handleTempMaxDurationChange(event) {
  console.log("🟡 handleTempMaxDurationChange triggered");
  this.savebuttonDisable = false;
  const shiftId = event.target.dataset.id;
  const salesforceId = event.target.dataset.salesforceid;
  let rawValue = event.target.value;

  console.log("➡️ shiftId:", shiftId);
  console.log("➡️ salesforceId:", salesforceId);
  console.log("➡️ rawValue (before formatting):", rawValue);

  // ✏️ Restrict to 2 decimal points
  if (rawValue && rawValue.includes(".")) {
    const parts = rawValue.split(".");
    if (parts[1].length > 2) {
      rawValue = parts[0] + "." + parts[1].substring(0, 2);
      event.target.value = rawValue;
      console.log("🔧 Trimmed to 2 decimals:", rawValue);
    }
  }

  // Convert rawValue to a number safely
  const numericValue = Number(rawValue);
  if (isNaN(numericValue)) {
    console.warn("⚠️ Input is not a number, skipping update.");
    return;
  }

  // 🧾 Log before update
  console.log("📋 Existing shifts before update:", JSON.parse(JSON.stringify(this.shifts)));

  // 🔄 Update shift
  this.shifts = this.shifts.map((shift, index) => {
    const isTarget = shift.computedId === shiftId || shift.salesforceId === salesforceId;
    console.log(`🔍 Checking shift [${index}] → ${shift.name}, isTarget: ${isTarget}`);

    if (isTarget) {
      console.log(`🎯 Match found at index [${index}]`, {
        name: shift.name,
        oldValue: shift.maxDuration,
        newValue: numericValue,
      });

      // Update maxDuration and duration as numbers
      const updatedShift = {
        ...shift,
        maxDuration: numericValue,
        duration: numericValue,
      };

      // 🚨 Validate mismatch (ignore 0)
      const durationActualNum = Number(updatedShift.durationActual || 0);
      console.log(`🔎 Comparing entered (${numericValue}) vs actual (${durationActualNum})`);

      const actual = Number(updatedShift.durationActual || 0);
      const entered = Number(updatedShift.duration || 0);

      console.log('entered >>>>', entered);
      console.log('actual >>>>', actual);

      // 🚨 Validate duration mismatch (ignore 0)
      if (entered > 0 && actual > 0 && entered < actual) {
          console.warn("⚠️ Duration mismatch detected!");

          Promise.resolve().then(() => {
            this.showToast(
              'Duration Mismatch',
              `Expected max duration: ${numericValue} hrs, but actual: ${durationActualNum.toFixed(2)} hrs.`,
              'error'
            );
            this.savebuttonDisable = true;
          });
        } else {
          console.log("✅ Duration matches or is 0, no error triggered.");
        }

      console.log("   ✅ Updated shift object:", JSON.parse(JSON.stringify(updatedShift)));
      return updatedShift;
    }

    return shift;
  });

  // ✅ Log after update
  console.log("📦 Updated shifts array:", JSON.parse(JSON.stringify(this.shifts)));
}

handleMaxDurationValidation(event) {
  console.log("🔹 handleMaxDurationValidation triggered");

  const shiftId = event.target.dataset.id;
  const salesforceId = event.target.dataset.salesforceid;
  let rawValue = event.target.value;

  console.log("➡️ shiftId:", shiftId);
  console.log("➡️ salesforceId:", salesforceId);
  console.log("➡️ Raw input value:", rawValue);

  const targetShift = this.shifts.find(
    (s) => s.computedId === shiftId || s.salesforceId === salesforceId
  );
  console.log("🎯 Found targetShift:", JSON.stringify(targetShift));

  if (!targetShift) {
    console.log("🚫 No matching shift found, exiting function.");
    return;
  }

  // Allow blank (do nothing)
  if (rawValue === "") {
    console.log("⚪ Empty value entered, skipping validation.");
    return;
  }

  // Restrict to 2 decimal places
  if (rawValue.includes(".")) {
    const parts = rawValue.split(".");
    console.log("🧮 Decimal split:", parts);
    if (parts[1].length > 2) {
      rawValue = parts[0] + "." + parts[1].substring(0, 2);
      event.target.value = rawValue;
      console.log("✂️ Trimmed to 2 decimals:", rawValue);
    }
  }

  const newDuration = parseFloat(rawValue);
  console.log("🆕 Parsed newDuration:", newDuration);

  if (isNaN(newDuration)) {
    console.log("🚫 Invalid number input. Exiting.");
    return;
  }

  // ✅ Always use durationActual for validation
  const actualDuration = parseFloat(targetShift.durationActual) || 0;
  console.log("🕒 actualDuration (from durationActual):", actualDuration);

  // ✅ If value is 0 → save and show 0 without error
  if (newDuration === 0) {
    console.log("✅ newDuration is 0, setting both maxDuration and duration to 0.00");

    this.shifts = this.shifts.map((shift) => {
      if (shift.computedId === shiftId || shift.salesforceId === salesforceId) {
        console.log("🔁 Updating shift maxDuration & duration to 0.00 for:", shift.name);
        return {
          ...shift,
          maxDuration: "0.00",
          duration: "0.00"
        };
      }
      return shift;
    });

    event.target.value = "0.00";
    console.log("📦 Updated shifts after 0 set:", JSON.stringify(this.shifts));
    return;
  }


  // 🚨 Validation: cannot exceed actualDuration
  if (newDuration > actualDuration) {
    console.log("🚨 Invalid! newDuration > actualDuration");
    console.log(`❌ ${newDuration} > ${actualDuration}`);

    this.showToast(
      "Invalid Input",
      `Max Duration (${newDuration} hrs) cannot be greater than actual shift duration (${actualDuration} hrs).`,
      "error"
    );

    const restoreValue = actualDuration.toFixed(2);
    console.log("↩️ Restoring input to:", restoreValue);
    event.target.value = restoreValue;

    this.shifts = this.shifts.map((shift) => {
      if (shift.computedId === shiftId || shift.salesforceId === salesforceId) {
        console.log("🔁 Restoring shift maxDuration to actual duration:", restoreValue);
        return { ...shift, maxDuration: restoreValue };
      }
      return shift;
    });
    console.log("📦 Updated shifts after restore:", JSON.stringify(this.shifts));
    return;
  }

  if (newDuration < actualDuration) {
    console.log("🚨 Invalid! newDuration < actualDuration");
    console.log(`❌ ${newDuration} < ${actualDuration}`);

    this.showToast(
      "Invalid Input",
      `Max Duration (${newDuration} hrs) cannot be less than actual shift duration (${actualDuration} hrs).`,
      "error"
    );

    const restoreValue = actualDuration.toFixed(2);
    console.log("↩️ Restoring input to:", restoreValue);
    event.target.value = restoreValue;

    this.shifts = this.shifts.map((shift) => {
      if (shift.computedId === shiftId || shift.salesforceId === salesforceId) {
        console.log("🔁 Restoring shift maxDuration to actual duration:", restoreValue);
        return { ...shift, maxDuration: restoreValue };
      }
      return shift;
    });
    console.log("📦 Updated shifts after restore:", JSON.stringify(this.shifts));
    return;
  }

  // ✅ Valid value → update
  const formattedValue = newDuration.toFixed(2);
  console.log("✅ Valid duration. Formatted value:", formattedValue);

  this.shifts = this.shifts.map((shift) => {
    if (shift.computedId === shiftId || shift.salesforceId === salesforceId) {
      console.log("🔁 Updating valid maxDuration for shift:", shift.name);
      return { ...shift, maxDuration: formattedValue };
    }
    return shift;
  });

  event.target.value = formattedValue;
  console.log("📦 Final updated shifts:", JSON.stringify(this.shifts));
  console.log("✅ handleMaxDurationValidation completed successfully");
}

handleMaxDurationInputForDesign(event) {
  console.log("🎯 handleMaxDurationInputForDesign triggered");
  this.savebuttonDisable = false;

  const shiftId = event.target.dataset.id;
  const salesforceId = event.target.dataset.salesforceid;
  let rawValue = event.target.value;

  console.log("🆔 Shift identifiers:", { shiftId, salesforceId });
  console.log("✏️ Raw value before formatting:", rawValue);

  // 🔹 Step 1: Restrict to 2 decimal places while typing
  if (rawValue.includes(".")) {
    const parts = rawValue.split(".");
    if (parts[1].length > 2) {
      console.log(`⚙️ Truncating extra decimals: ${parts[1]} → ${parts[1].substring(0, 2)}`);
      rawValue = parts[0] + "." + parts[1].substring(0, 2);
      event.target.value = rawValue;
      console.log("🔧 Updated input after truncation:", rawValue);
    }
  }

  // 🔹 Step 2: Convert to number safely
  const numericValue = Number(rawValue);
  if (rawValue !== "" && isNaN(numericValue)) {
    console.warn("⚠️ Input is not a number, skipping update.");
    return;
  }

  // 🔹 Step 3: Handle blank input (clearing field)
  if (rawValue === "") {
    console.log("🕳️ Blank value detected — clearing duration for target shift.");
    this.shiftsforDesign = this.shiftsforDesign.map((shift, index) => {
      const isTarget = salesforceId
        ? shift.salesforceId === salesforceId
        : String(shift.id) === String(shiftId);

      if (isTarget) {
        console.log(`🧹 Clearing duration for shift at index [${index}]:`, shift.salesforceId || shift.id);
        return { ...shift, duration: "", maxDuration: "" };
      }
      return shift;
    });
    console.log("✅ Updated shifts list after clearing blank value:", JSON.stringify(this.shiftsforDesign, null, 2));
    return;
  }

  // 🔹 Step 4: Update duration/maxDuration and check mismatch
  this.shiftsforDesign = this.shiftsforDesign.map((shift, index) => {
    const isTarget = salesforceId
      ? shift.salesforceId === salesforceId
      : String(shift.id) === String(shiftId);

    console.log(
      `🔍 Checking shift [${index}] → ${shift.name || "(no name)"} | ID: ${shift.id} | SalesforceID: ${shift.salesforceId} | isTarget: ${isTarget}`
    );

    if (isTarget) {
      console.log("🎯 Match found! Updating duration and maxDuration:", numericValue);
      const updatedShift = { ...shift, duration: numericValue, maxDuration: numericValue };

      // ⏱ Duration validation
      const actualDurationNum = Number(updatedShift.durationActual || 0);
      const enteredDuration = Number(updatedShift.duration || 0);

      console.log(`⏱ Checking duration: entered=${enteredDuration}, actual=${actualDurationNum}`);

      if (actualDurationNum !== 0 && actualDurationNum > enteredDuration) {
        console.warn("⚠️ Duration mismatch detected!");
        this.savebuttonDisable = true;

        Promise.resolve().then(() => {
          this.showToast(
            "Duration Mismatch",
            `Actual duration (${actualDurationNum.toFixed(2)} hrs) cannot be greater than shift duration (${enteredDuration.toFixed(2)} hrs).`,
            "error"
          );
        });
      } else {
        console.log("✅ Duration is valid — no mismatch error triggered.");
      }

      console.log("✅ Updated shift object:", JSON.stringify(updatedShift));
      return updatedShift;
    }

    return shift;
  });

  console.log("📋 Final shiftsforDesign after update:", JSON.stringify(this.shiftsforDesign, null, 2));
}



handleMaxDurationBlurForDesign(event) {
  console.log("🔹 handleMaxDurationBlurForDesign triggered");

  const shiftId = event.target.dataset.id;
  const salesforceId = event.target.dataset.salesforceid;
  let rawValue = event.target.value;

  console.log("➡️ shiftId:", shiftId);
  console.log("➡️ salesforceId:", salesforceId);
  console.log("➡️ Raw input value:", rawValue);

  const targetShift = this.shiftsforDesign.find(
    (s) => s.id === shiftId || s.salesforceId === salesforceId
  );

  if (!targetShift) {
    console.log("🚫 No matching shift found, exiting.");
    return;
  }

  // ⚪ Allow blank (skip validation)
  if (rawValue === "") return;

  // 🧮 Limit to 2 decimals
  if (rawValue.includes(".")) {
    const [intPart, decPart] = rawValue.split(".");
    if (decPart.length > 2) {
      rawValue = `${intPart}.${decPart.substring(0, 2)}`;
      event.target.value = rawValue;
    }
  }

  const newDuration = parseFloat(rawValue);
  if (isNaN(newDuration)) return;

  const actualDuration = parseFloat(targetShift.durationActual) || 0;
  const minDuration = parseFloat(targetShift.minDuration) || 0;

  console.log("🕒 actualDuration:", actualDuration);
  console.log("📏 minDuration:", minDuration);

  const restoreValue = parseFloat(targetShift.duration).toFixed(2);

  // ✅ 0 hrs allowed
  if (newDuration === 0) {
    this.updateShiftDuration(shiftId, salesforceId, "0.00");
    event.target.value = "0.00";
    return;
  }

  // 🚨 Validation 1: less than actual
  if (newDuration < actualDuration) {
    this.showToast(
      "Invalid Input",
      `Duration (${newDuration} hrs) cannot be less than actual shift duration (${actualDuration} hrs).`,
      "error"
    );
    this.updateShiftDuration(shiftId, salesforceId, restoreValue);
    event.target.value = restoreValue;
    return;
  }

  // 🚨 Validation 2: greater than actual
  if (newDuration > actualDuration) {
    this.showToast(
      "Invalid Input",
      `Duration (${newDuration} hrs) cannot exceed actual shift duration (${actualDuration} hrs).`,
      "error"
    );
    this.updateShiftDuration(shiftId, salesforceId, restoreValue);
    event.target.value = restoreValue;
    return;
  }

  // 🚨 Validation 3: less than minimum
  if (newDuration < minDuration) {
    this.showToast(
      "Invalid Input",
      `Duration cannot be less than ${minDuration} hrs.`,
      "error"
    );
    this.updateShiftDuration(shiftId, salesforceId, restoreValue);
    event.target.value = restoreValue;
    return;
  }

  // 🚨 Validation 4: > 24 hrs
  if (newDuration > 24) {
    this.showToast("Invalid Input", "Duration cannot exceed 24 hours.", "error");
    this.updateShiftDuration(shiftId, salesforceId, restoreValue);
    event.target.value = restoreValue;
    return;
  }

  // ✅ Valid value
  const formattedValue = newDuration.toFixed(2);
  this.updateShiftDuration(shiftId, salesforceId, formattedValue);
  event.target.value = formattedValue;
  console.log("✅ Duration updated successfully:", formattedValue);
}

updateShiftDuration(shiftId, salesforceId, newValue) {
  console.log("🔹 updateShiftDuration called");
  console.log("➡️ shiftId:", shiftId);
  console.log("➡️ salesforceId:", salesforceId);
  console.log("➡️ newValue:", newValue);

  this.shiftsforDesign = this.shiftsforDesign.map((shift, index) => {
    console.log(`🔍 Checking shift [${index}] →`, shift.name || shift.salesforceId);

    // ✅ Use computedId as fallback (unique key)
    const sameRecord =
      (shift.id && shift.id === shiftId) ||
      (shift.salesforceId &&
        salesforceId &&
        shift.salesforceId === salesforceId &&
        shift.id === shiftId) || // both match
      (shift.computedId === salesforceId); // fallback match if needed

    console.log(`   ➕ sameRecord = ${sameRecord}`);

    if (sameRecord) {
      console.log(`   🎯 Match found! Updating duration from '${shift.duration}' to '${newValue}'`);
      return { ...shift, duration: newValue };
    } else {
      console.log("   ⚪ No match — keeping shift unchanged.");
      return shift;
    }
  });

  console.log("📦 Updated shiftsforDesign:", JSON.stringify(this.shiftsforDesign));

  const selector = `[data-salesforceid="${salesforceId}"]`;
  const inputEl = this.template.querySelector(selector);
  if (inputEl) {
    console.log("✅ Found input element — updating value to:", newValue);
    inputEl.value = newValue;
  } else {
    console.log("🚫 No input element found for:", salesforceId);
  }

  console.log("✅ updateShiftDuration completed successfully");
}


/* handleMaxDurationInputForCustom(event) {
  this.savebuttonDisable = false;
  console.log("🎯 handleMaxDurationInputForCustom triggered");

  const templateId = event.target.dataset.templateId;
  const shiftId = event.target.dataset.shiftId;
  const field = event.target.dataset.field;
  let rawValue = event.target.value;

  console.log("🧩 Template ID:", templateId);
  console.log("🧩 Shift ID:", shiftId);
  console.log("🧩 Field:", field);
  console.log("✏️ Raw value before formatting:", rawValue);

  // 🔹 Step 1: Restrict to 2 decimal places
  if (rawValue.includes(".")) {
    const parts = rawValue.split(".");
    if (parts[1].length > 2) {
      console.log(`⚙️ Truncating decimals: ${parts[1]} → ${parts[1].substring(0, 2)}`);
      rawValue = `${parts[0]}.${parts[1].substring(0, 2)}`;
      event.target.value = rawValue;
      console.log("🔧 Updated input after truncation:", rawValue);
    }
  }

  // 🔹 Step 2: Validate number input
  const numericValue = Number(rawValue);
  if (rawValue !== "" && isNaN(numericValue)) {
    console.warn("⚠️ Input is not a valid number. Skipping update.");
    return;
  }

  // 🔹 Step 3: Handle blank input (clearing field)
  if (rawValue === "") {
    console.log("🕳️ Blank value detected — clearing field for target shift.");
    this.templates = this.templates.map((template) => {
      if (String(template.id) === String(templateId)) {
        const updatedShifts = template.shifts.map((shift) => {
          if (String(shift.id) === String(shiftId)) {
            console.log(`🧹 Clearing "${field}" for shift ID: ${shiftId}`);
            return { ...shift, [field]: "", maxDuration: "" };
          }
          return shift;
        });
        return { ...template, shifts: updatedShifts };
      }
      return template;
    });

    console.log("✅ Updated templates after clearing blank value:", JSON.stringify(this.templates, null, 2));
    return;
  }

  // 🔹 Step 4: Update value + validate durations
  console.log("✍️ Updating field live with numeric value...");

  this.templates = this.templates.map((template) => {
    if (String(template.id) === String(templateId)) {
      const updatedShifts = template.shifts.map((shift) => {
        if (String(shift.id) === String(shiftId)) {
          console.log(`🎯 Match found! Updating "${field}" to: ${numericValue}`);

          const updatedShift = {
            ...shift,
            [field]: numericValue,
            maxDuration: numericValue
          };

          // ⏱ Duration validation
          const actual = Number(updatedShift.actualDuration || 0);
          const entered = Number(updatedShift.duration || 0);

          console.log(`⏱ Checking duration: entered=${entered}, actual=${actual}`);

          // 🧩 New logic
          if (actual > 0 && actual > entered) {
            console.error(`⛔ Actual Duration (${actual}) > Duration (${entered})`);
            this.savebuttonDisable = true;

            Promise.resolve().then(() => {
              this.showToast(
                "Duration Error",
                `Actual Duration (${actual.toFixed(2)} hrs) cannot be greater than Shift Duration (${entered.toFixed(2)} hrs).`,
                "error"
              );
            });
          } else {
            console.log("✅ Duration is valid — no mismatch error triggered.");
          }

          console.log("✅ Updated Shift Object:", JSON.stringify(updatedShift, null, 2));
          return updatedShift;
        }
        return shift;
      });

      return { ...template, shifts: updatedShifts };
    }
    return template;
  });

  console.log("📋 Final Updated Templates:", JSON.stringify(this.templates, null, 2));
} */

handleMaxDurationInputForCustom(event) {
  this.savebuttonDisable = false;
  console.log("🎯 handleMaxDurationInputForCustom triggered");

  const templateId = event.target.dataset.templateId;
  const shiftId = event.target.dataset.shiftId;
  const field = event.target.dataset.field;
  let rawValue = event.target.value;

  console.log("🧩 Template ID:", templateId);
  console.log("🧩 Shift ID:", shiftId);
  console.log("🧩 Field:", field);
  console.log("✏️ Raw value before formatting:", rawValue);

  const numericValue = Number(rawValue);
  console.log("🔢 Parsed numeric value:", numericValue);

  if (rawValue === "" || isNaN(numericValue)) {
    console.log("🕳️ Blank or invalid value detected — clearing field");

    this.templates = this.templates.map((template) => {
      if (String(template.id) === String(templateId)) {
        console.log(`🔹 Matching template found: ${templateId}`);
        const updatedShifts = template.shifts.map((shift) => {
          if (String(shift.id) === String(shiftId)) {
            console.log(`🧹 Clearing shift ID: ${shiftId}`);
            return { ...shift, [field]: "", maxDuration: "" };
          }
          return shift;
        });
        return { ...template, shifts: updatedShifts };
      }
      return template;
    });

    console.log("✅ Templates after clearing field:", JSON.stringify(this.templates, null, 2));
    return;
  }

  console.log("✍️ Updating shift with numeric value...");

  this.templates = this.templates.map((template) => {
    if (String(template.id) === String(templateId)) {
      console.log(`🔹 Found template to update: ${templateId}`);
      const updatedShifts = template.shifts.map((shift) => {
        if (String(shift.id) === String(shiftId)) {
          console.log(`🎯 Found shift to update: ${shiftId}`);
          console.log("🕰️ Original durationActual:", shift.durationActual);
          console.log("⏱️ Entered duration:", numericValue);

          const actual = Number(shift.durationActual || 0);
          const entered = numericValue;

          if (actual > 0 && actual > entered) {
            console.warn(`⚠️ Actual Duration (${actual}) > Shift Duration (${entered})`);
            this.savebuttonDisable = true;

            Promise.resolve().then(() => {
              this.showToast(
                "Duration Error",
                `Actual Duration (${actual.toFixed(2)} hrs) cannot be greater than Shift Duration (${entered.toFixed(2)} hrs).`,
                "error"
              );
            });
          } else {
            console.log("✅ Duration is valid or actualDuration is 0 — no error triggered");
          }

          const updatedShift = {
            ...shift,
            [field]: numericValue,
            maxDuration: numericValue
          };
          console.log("✅ Updated shift object:", JSON.stringify(updatedShift, null, 2));
          return updatedShift;
        }
        return shift;
      });
      return { ...template, shifts: updatedShifts };
    }
    return template;
  });

  console.log("📋 Final templates after update:", JSON.stringify(this.templates, null, 2));
  console.log("💾 Save button disabled state:", this.savebuttonDisable);
}



  handleColorChange(event) {
    const localId = event.target.dataset.id; // For create
    const salesforceId = event.target.dataset.salesforceid; // For update
    const newColor = event.target.value;

    let shift;
    if (salesforceId) {
      shift = this.shifts.find((s) => s.salesforceId === salesforceId);
    } else if (localId) {
      shift = this.shifts.find((s) => s.id === localId);
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
      shift = this.shifts.find((s) => s.salesforceId === salesforceId);
    } else if (localId) {
      shift = this.shifts.find((s) => s.id === localId);
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
      shift = this.shiftsforDesign.find((s) => s.salesforceId === salesforceId);
    } else if (localId) {
      shift = this.shiftsforDesign.find(
        (s) => String(s.id) === String(localId)
      );
    }

    if (shift) {
      shift.name = value;
      this.clearShiftMessage(shift);
    }
  }

  handleColorChangeDesign(event) {
    console.log("🎨 Color change triggered");
    const id = event.target.dataset.id;
    console.log("🆔 Shift ID from dataset:", id);
    console.log("🎯 New Color Value from picker:", event.target.value);

    const index = this.shifts.findIndex((s) => s.id === id);
    console.log("🔍 Found Shift Index:", index);

    if (index !== -1) {
      console.log(
        "✅ Shift Found:",
        JSON.parse(JSON.stringify(this.shifts[index]))
      );

      const updatedShift = {
        ...this.shifts[index],
        color: event.target.value,
        colorStyle: `background-color: ${event.target.value}; width: 25px; height: 25px; border: 1px solid #ffffff;`
      };
      console.log(
        "🆕 Updated Shift Object:",
        JSON.parse(JSON.stringify(updatedShift))
      );

      this.shifts = [
        ...this.shifts.slice(0, index),
        updatedShift,
        ...this.shifts.slice(index + 1)
      ];
      console.log(
        "📦 Updated Shifts Array:",
        JSON.parse(JSON.stringify(this.shifts))
      );

      this.clearShiftMessage(updatedShift);
      console.log("🧹 clearShiftMessage called for shift ID:", updatedShift.id);
    } else {
      console.warn("⚠️ No shift found with ID:", id);
    }
  }

  handleAddShift() {
    const to24HourTime = (hour, minute, ampm) => {
      let h = parseInt(hour, 10);
      let m = parseInt(minute, 10);

      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`;
    };

    const newShift = {
      id: Date.now(),
      salesforceId: null,
      name: "",
      shiftType: "",
      startHour: "12",
      startMinute: "00",
      startAMPM: "AM",
      displayedStartTime: "Select Time",
      startTime24: to24HourTime("12", "00", "AM"),
      endHour: "12",
      endMinute: "00",
      endAMPM: "AM",
      displayedEndTime: "Select Time",
      endTime24: to24HourTime("12", "00", "AM"),
      color: "",
      colorStyle:
        "background-color: #ccc; width: 25px; height: 25px; border: 1px solid #ccc;"
    };
    this.shiftsforDesign = [...this.shiftsforDesign, newShift];
  }

  handleNameChange(event) {
    const localId = String(event.target.dataset.id); // For create
    const salesforceId = event.target.dataset.salesforceid; // For update
    const value = event.target.value;

    let shift;
    if (salesforceId) {
      shift = this.shifts.find((s) => s.salesforceId === salesforceId);
    } else if (localId) {
      shift = this.shifts.find((s) => s.id === localId);
    }

    if (shift) {
      shift.name = value;
      this.updateShiftField(shift.id || shift.salesforceId, "name", value);
    }
  }

  handleTypeChange(event) {
    const shiftId = event.target.dataset.id;
    const salesforceId = event.target.dataset.salesforceid;
    const newValue = event.target.value;

    console.log(
      `📝 Type changed for shiftId: ${shiftId}, salesforceId: ${salesforceId} => ${newValue}`
    );

    this.shiftsforDesign = this.shiftsforDesign.map((shift) => {
      const matchById =
        shift.id && shiftId ? String(shift.id) === String(shiftId) : false;
      const matchBySFId =
        shift.salesforceId && salesforceId
          ? String(shift.salesforceId) === String(salesforceId)
          : false;

      if (matchById || matchBySFId) {
        return {
          ...shift,
          shiftType: newValue
        };
      }
      return shift;
    });

    console.log(
      "🎯 Final shiftsforDesign after type change:",
      JSON.parse(JSON.stringify(this.shiftsforDesign))
    );
  }

handleStartTimeChangeforDesign(event) {
  console.log("🎯 handleStartTimeChangeforDesign triggered");
  console.log("Event details:", JSON.stringify(event.detail));
  console.log("Dataset info:", {
    localId: event.target.dataset.id,
    salesforceId: event.target.dataset.salesforceid
  });

  const localId = event.target.dataset.id;
  const salesforceId = event.target.dataset.salesforceid;
  const displayTime = event.detail.displaytime;
  console.log("⏰ Display Time received:", displayTime);
  this.savebuttonDisable = false;

  const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
  console.log("🔄 Converted to 24-hour format:", converted24);

  let shift;
  if (salesforceId) {
    shift = this.shiftsforDesign.find((s) => s.salesforceId === salesforceId);
    console.log("📌 Found shift using salesforceId:", shift);
  } else if (localId) {
    shift = this.shiftsforDesign.find((s) => String(s.id) === String(localId));
    console.log("📌 Found shift using localId:", shift);
  } else {
    console.warn("⚠️ No valid ID found in dataset. Shift not identified.");
  }

  if (shift) {
    const timeDetails = this.splitTimeParts(displayTime);
    console.log("🕒 Split Time Parts:", timeDetails);

    shift.startHour = timeDetails.hour;
    shift.startMinute = timeDetails.minute;
    shift.startAMPM = timeDetails.period;
    shift.startTime24 = converted24;
    shift.displayedStartTime = displayTime;

    console.log("✅ Updated shift object with new start time:", JSON.stringify(shift));

    this.clearShiftMessage(shift);
    console.log("🧹 Cleared shift messages for:", shift.salesforceId || shift.id);

    // ⏱ Calculate duration
    const durationObj = this.calculateDuration(shift);
    console.log("⏱ Duration object returned:", durationObj);

    shift.durationActual = durationObj ? durationObj.decimalHours : null;
    console.log("📊 Final Updated Duration (Decimal Hours):", shift.durationActual);

    // ⚡ Duration mismatch validation + toast
    const expectedDuration = parseFloat(shift.duration || 0);
    const actualDuration = parseFloat(shift.durationActual || 0);

    if (expectedDuration === 0) {
      // No validation needed if duration is zero
      this.clearShiftMessage(shift);
      console.log("✅ No error shown — duration is 0");
    } else if (Math.abs(expectedDuration - actualDuration) > 0.01) {
      // Mismatch detected
      shift.showMessage = true;
      shift.message = `Duration mismatch! Expected ${expectedDuration.toFixed(2)} hr(s), but got ${actualDuration.toFixed(2)} hr(s).`;
      shift.messageClass = "slds-text-color_error";
      shift.messageIcon = "utility:error";

      console.warn("❌ Duration mismatch error:", shift.message);
      // 🔔 Show toast message
      this.showToast(
        "Duration Mismatch",
        `Expected ${expectedDuration.toFixed(2)} hr(s), but got ${actualDuration.toFixed(2)} hr(s).`,
        "error"
      );
      this.savebuttonDisable = true;
    } else {
      // Durations match
      this.clearShiftMessage(shift);
      console.log("✅ Duration matches expected value");
    }

    // 🔹 Final debug log
    console.log("🔹 Final shift object after all updates:", JSON.stringify(shift, null, 2));
  } else {
    console.warn("⚠️ No shift found to update.");
  }
}


  handleEndTimeChangeforDesign(event) {
    console.log("🎯 handleEndTimeChangeforDesign triggered");
    console.log("Event details:", JSON.stringify(event.detail));
    console.log("Dataset info:", {
      localId: event.target.dataset.id,
      salesforceId: event.target.dataset.salesforceid
    });

    const localId = event.target.dataset.id; // For create
    const salesforceId = event.target.dataset.salesforceid; // For update
    const displayTime = event.detail.displaytime; // ✅ correct property name
    console.log("⏰ Display Time received:", displayTime);

    const converted24 = this.convertTo24HourFormat(displayTime.toLowerCase());
    console.log("🔄 Converted to 24-hour format:", converted24);

    let shift;
    if (salesforceId) {
      shift = this.shiftsforDesign.find((s) => s.salesforceId === salesforceId);
      console.log("📌 Found shift using salesforceId:", shift);
    } else if (localId) {
      shift = this.shiftsforDesign.find(
        (s) => String(s.id) === String(localId)
      );
      console.log("📌 Found shift using localId:", shift);
    } else {
      console.warn("⚠️ No valid ID found in dataset. Shift not identified.");
    }

    if (shift) {
      const timeDetails = this.splitTimeParts(displayTime);
      console.log("🕒 Split Time Parts:", timeDetails);

      shift.endHour = timeDetails.hour;
      shift.endMinute = timeDetails.minute;
      shift.endAMPM = timeDetails.period;
      shift.endTime24 = converted24;
      shift.displayedEndTime = displayTime;

      console.log(
        "✅ Updated shift object with new end time:",
        JSON.stringify(shift)
      );

      this.clearShiftMessage(shift);
      console.log(
        "🧹 Cleared shift messages for:",
        shift.salesforceId || shift.id
      );

      const durationObj = this.calculateDuration(shift);
      console.log("⏱ Duration object returned:", durationObj);

      shift.durationActual = durationObj ? durationObj.decimalHours : null;
      console.log("📊 Final Updated Duration (Decimal Hours):", shift.duration);
    } else {
      console.warn("⚠️ No shift found to update.");
    }
  }

  convert12HourTimeToUTCString(time12h) {
    const parts = this.splitTimeParts(time12h); // { hour, minute, period }
    let hour24 = parseInt(parts.hour, 10);

    if (parts.period === "PM" && hour24 !== 12) hour24 += 12;
    if (parts.period === "AM" && hour24 === 12) hour24 = 0;

    // Ensure 2-digit formatting
    const hourStr = hour24.toString().padStart(2, "0");
    const minuteStr = parts.minute.padStart(2, "0");

    return `${hourStr}:${minuteStr}:00.000Z`;
  }

  handleColorChange1(event) {
    const shiftId = event.target.dataset.id;
    const salesforceId = event.target.dataset.salesforceid;
    const newColor = event.detail.value;

    console.log("🎨 [handleColorChange1] START");
    console.log("📌 Shift ID from event:", shiftId);
    console.log("📌 Salesforce ID from event:", salesforceId);
    console.log("📌 New color from combobox:", newColor);

    this.shiftsforDesign = this.shiftsforDesign.map((shift) => {
      // Determine the correct key to match
      const matchById =
        shift.id && shiftId ? String(shift.id) === String(shiftId) : false;
      const matchBySFId =
        shift.salesforceId && salesforceId
          ? String(shift.salesforceId) === String(salesforceId)
          : false;

      if (matchById || matchBySFId) {
        const updatedShift = {
          ...shift,
          color: newColor,
          colorStyle: `background-color: ${newColor}; width: 25px; height: 25px; border: 1px solid #ccc;`
        };
        console.log(
          "✅ Updated shift:",
          JSON.parse(JSON.stringify(updatedShift))
        );
        return updatedShift;
      }

      return shift;
    });

    console.log(
      "🎯 Final shiftsforDesign after color change:",
      JSON.parse(JSON.stringify(this.shiftsforDesign))
    );
    console.log("🏁 [handleColorChange1] END");
  }

  updateShiftField(id, field, value) {
    this.shiftsforDesign = this.shiftsforDesign.map((shift) => {
      if (String(shift.id) === id) {
        return { ...shift, [field]: value };
      }
      return shift;
    });
    x;
  }

  handleSaveAllShifts() {
    console.log("🚀 Starting handleSaveAllShifts");
    console.log("📌 Current shifts:", JSON.parse(JSON.stringify(this.shifts)));
    console.log(
      "📌 Current shifts for own Shifts:",
      JSON.parse(JSON.stringify(this.shiftsforDesign))
    );
    console.log(
      "📌 Current Custom Shifts:",
      JSON.parse(JSON.stringify(this.templates))
    );

    // ✅ Remove completely empty Own Shifts
    this.shiftsforDesign = this.shiftsforDesign.filter((shift) => {
      const isNameEmpty = !shift.name || shift.name.trim() === "";
      const isTypeEmpty = !shift.shiftType || shift.shiftType.trim() === "";
      const isColorEmpty = !shift.color || shift.color.trim() === "";

      // keep the shift if NOT (all three are empty)
      return !(isNameEmpty && isTypeEmpty && isColorEmpty);
    });

    console.log(
      "📌 Cleaned shiftsforDesign:",
      JSON.parse(JSON.stringify(this.shiftsforDesign))
    );

    console.log("this.isStaffView >>", this.isStaffView);
    if (this.isStaffView == false) {
      // ✅ Validation for all three lists
      const invalidShifts = this.shifts.filter((s) => !this.validateShift(s));
      const invalidShiftsOwn = this.shiftsforDesign.filter(
        (s) => !this.validateShift(s)
      );

      if (invalidShifts.length > 0 || invalidShiftsOwn.length > 0) {
        console.warn("❌ Validation failed for some shifts.");
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Validation Error",
            message: "Please fill in all required fields for all shifts.",
            variant: "error"
          })
        );
        return;
      }
    }

    this.isSaving = true;
    console.log("🔄 isSaving set to true");

    // ✅ Clear previous messages for all shifts
    [...this.shifts, ...this.shiftsforDesign, ...this.templates].forEach(
      (shift) => this.clearShiftMessage(shift)
    );

    // ✅ Prepare all three lists
    const shiftsToSave = this.shifts.map((s) => this.prepareShiftForSave(s));
    const shiftsToSaveOwn = this.shiftsforDesign.map((s) =>
      this.prepareShiftForSave(s)
    );

    console.log(
      "📤 Sending Default shifts to Apex:",
      JSON.parse(JSON.stringify(shiftsToSave))
    );
    console.log(
      "📤 Sending Own shifts to Apex:",
      JSON.parse(JSON.stringify(shiftsToSaveOwn))
    );
    console.log(
      "📤 Sending Custom shifts to Apex (raw):",
      JSON.stringify(this.templates)
    );

    // ✅ Filter out empty custom templates AND empty child shifts
    const cleanedTemplates = this.templates
      // keep templates that have at least one non-empty shift
      .filter((template) =>
        template.shifts.some(
          (shift) =>
            (shift.startTime && shift.startTime !== "") ||
            (shift.endTime && shift.endTime !== "") ||
            (shift.type && shift.type.trim() !== "") ||
            (shift.name && shift.name.trim() !== "")
        )
      )
      // clean child shifts
      .map((template) => {
        const cleanedShifts = template.shifts.filter(
          (shift) =>
            (shift.startTime && shift.startTime !== "") ||
            (shift.endTime && shift.endTime !== "") ||
            (shift.type && shift.type.trim() !== "") ||
            (shift.name && shift.name.trim() !== "")
        );

        // Debug: show removed child shifts
        const removed = template.shifts.filter(
          (s) =>
            !(
              (s.startTime && s.startTime !== "") ||
              (s.endTime && s.endTime !== "") ||
              (s.type && s.type.trim() !== "")
            )
        );
        if (removed.length > 0) {
          console.log(
            `🗑️ Removed empty child shifts from template ${template.id || template.salesforceId}:`,
            removed
          );
        }

        return {
          ...template,
          shifts: cleanedShifts
        };
      });

    console.log(
      "📤 Cleaned Custom shifts to Apex:",
      JSON.stringify(cleanedTemplates)
    );

    saveMultipleShifts({
      shiftsData: shiftsToSave,
      shiftsDataforown: shiftsToSaveOwn,
      shiftsDataforcustom: cleanedTemplates,
      costPerKmElectric: this.costPerKmElectric,
      costPerKmFuel: this.costPerKmFuel,
      facilityId: this.facilityValue
    })
      .then((results) => {
        console.log(
          "✅ Apex saveMultipleShifts result:",
          JSON.parse(JSON.stringify(results))
        );

        const totalDefault = this.shifts.length;
        const totalOwn = this.shiftsforDesign.length;

        results.forEach((result, index) => {
          if (result && result.Id) {
            if (index < totalDefault) {
              // Default shift
              this.shifts[index].salesforceId = result.Id;
              this.showShiftMessage(
                this.shifts[index],
                "Saved successfully!",
                "success"
              );
              console.log(
                "📤 Saved Default shifts:",
                JSON.stringify(this.shifts)
              );
            } else if (index < totalDefault + totalOwn) {
              // Own shift
              const ownIndex = index - totalDefault;
              this.shiftsforDesign[ownIndex].salesforceId = result.Id;
              this.showShiftMessage(
                this.shiftsforDesign[ownIndex],
                "Saved successfully!",
                "success"
              );
              console.log(
                "📤 Saved Own shifts:",
                JSON.stringify(this.shiftsforDesign)
              );
            } else {
              // Custom shift
              const customIndex = index - totalDefault - totalOwn;
              this.templates[customIndex].salesforceId = result.Id;
              this.showShiftMessage(
                this.templates[customIndex],
                "Saved successfully!",
                "success"
              );
              console.log(
                "📤 Saved Custom shifts:",
                JSON.stringify(this.templates)
              );
            }
          }
        });

        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "All shifts saved successfully!",
            variant: "success"
          })
        );
        this.dispatchEvent(new CustomEvent("rostersettingsbackbutton"));
      })
      .catch((error) => {
        console.error("🔥 Error saving multiple shifts:", error);
        [...this.shifts, ...this.shiftsforDesign, ...this.templates].forEach(
          (shift) => {
            this.showShiftMessage(
              shift,
              "Error saving shift. Please try again.",
              "error"
            );
          }
        );
        this.handleError(error);
      })
      .finally(() => {
        this.isSaving = false;
        console.log("🏁 Save process completed. isSaving set to false.");
      });
  }

  prepareShiftForSave(shift) {
    console.log('   shift.duration (input value):', shift.duration);

    // Handle 0 correctly
    let durationValue = null; // default to null
    if (shift.duration !== null && shift.duration !== undefined && shift.duration !== "") {
        durationValue = Number(shift.duration); // converts "0" or "2.5" to Number
    }

    console.log('   Duration to send to Apex:', durationValue);

    return {
      Id: shift.salesforceId,
      Name: shift.name,
      Shift_Type__c: shift.shiftType,
      Start_Time__c: shift.startTime24,
      End_Time__c: shift.endTime24,
      Color__c: shift.color,
      Facility__c: this.facilityValue,
      Duration: durationValue,
      DurationActual: shift.durationActual
    };
  }

  validateShift(shift) {
    const startTimeMs = this.getMsFromParts(
      shift.startHour,
      shift.startMinute,
      shift.startAMPM
    );
    console.log("startTimeMs >>", startTimeMs);
    const endTimeMs = this.getMsFromParts(
      shift.endHour,
      shift.endMinute,
      shift.endAMPM
    );
    console.log("endTimeMs >>", endTimeMs);

    return (
      shift.name &&
      shift.shiftType &&
      startTimeMs >= 0 &&
      endTimeMs >= 0 &&
      shift.color &&
      this.facilityValue
    );
  }

  getMsFromParts(hour, minute, ampm) {
    if (hour == null || minute == null) return null;
    let h = parseInt(hour, 10);
    const m = parseInt(minute, 10) || 0;

    // Convert 12-hour clock to 24-hour
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    return (h * 60 + m) * 60 * 1000;
  }

  showShiftMessage(shift, message, type) {
    shift.showMessage = true;
    shift.message = message;
    shift.messageClass = `slds-m-top_small slds-text-body_small ${type === "success" ? "slds-text-color_success" : "slds-text-color_error"}`;
    shift.messageIcon =
      type === "success" ? "utility:success" : "utility:error";

    // Auto-hide message after 3 seconds
    setTimeout(() => {
      this.clearShiftMessage(shift);
    }, 3000);
  }

  clearShiftMessage(shift) {
    shift.showMessage = false;
    shift.message = "";
    shift.messageClass = "";
    shift.messageIcon = "";
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
    if (timeVal === null || timeVal === undefined) return "Select Time";

    let timeStr = "";

    // If it's a number (milliseconds since midnight from Salesforce)
    if (typeof timeVal === "number") {
      const totalSeconds = timeVal / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const period = hours >= 12 ? "PM" : "AM";

      return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
    }

    // If it's a string (existing logic)
    timeStr = timeVal;
    if (timeStr.includes("T")) {
      timeStr = timeStr.split("T")[1];
    }
    if (timeStr.includes(".")) {
      timeStr = timeStr.split(".")[0];
    }
    if (timeStr.endsWith("Z")) {
      timeStr = timeStr.slice(0, -1);
    }

    const [hours, minutes] = timeStr.split(":");
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? "PM" : "AM";

    return `${hour12}:${minutes} ${period}`;
  }

  splitTimeParts(timeString) {
    if (!timeString) {
      return { hour: null, minute: null, period: null };
    }
    const [timePart, period] = timeString.trim().split(" ");
    const [hour, minute] = timePart.split(":");
    return { hour, minute, period };
  }

  handleError(error) {
    console.error("Error:", error);
    let message = "An unexpected error occurred.";

    if (error && error.body) {
      if (error.body.message) {
        message = error.body.message;
      } else if (error.body.pageErrors && error.body.pageErrors.length > 0) {
        message = error.body.pageErrors[0].message;
      }
    }

    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: message,
        variant: "error"
      })
    );
  }

  handleDeleteShift(event) {
    const shiftId = event.target.dataset.id;
    const salesforceId = event.target.dataset.salesforceid;

    console.log(
      "🗑️ Deleting shift with ID:",
      shiftId,
      "or Salesforce ID:",
      salesforceId
    );
    console.log(
      "Before delete:",
      JSON.parse(JSON.stringify(this.shiftsforDesign))
    );

    this.shiftsforDesign = this.shiftsforDesign.filter((shift) => {
      const matchById =
        shift.id && shiftId ? String(shift.id) === String(shiftId) : false;
      const matchBySFId =
        shift.salesforceId && salesforceId
          ? String(shift.salesforceId) === String(salesforceId)
          : false;

      return !(matchById || matchBySFId); // Keep everything that doesn’t match
    });

    console.log(
      "After delete:",
      JSON.parse(JSON.stringify(this.shiftsforDesign))
    );
  }

  HandleBack() {
    console.log("HANDLE BACK");
    this.dispatchEvent(new CustomEvent("rostersettingsbackbutton"));
  }

  initializeTemplates() {
    this.templates = [
      {
        id: "1",
        customShiftName: "",
        customShiftindex: this.templates.length + 1,
        shifts: this.createInitialShifts("1"),
        showAddButton: false,
        Facility__c: this.facilityValue
      }
    ];
  }

  createInitialShifts(templateId) {
    return [
      {
        id: `${templateId}-1`,
        name: "",
        type: "",
        startTime: "",
        endTime: "",
        displayIndex: 1
      },
      {
        id: `${templateId}-2`,
        name: "",
        type: "",
        startTime: "",
        endTime: "",
        displayIndex: 2
      },
      {
        id: `${templateId}-3`,
        name: "",
        type: "",
        startTime: "",
        endTime: "",
        displayIndex: 3
      },
      {
        id: `${templateId}-4`,
        name: "",
        type: "",
        startTime: "",
        endTime: "",
        displayIndex: 4
      }
    ];
  }

  handleTemplateNameChange(event) {
    const templateId = event.target.dataset.templateId;
    const value = event.target.value;

    this.templates = this.templates.map((template) =>
      template.id === templateId
        ? { ...template, customShiftName: value }
        : template
    );
  }

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

    this.templates = this.templates.map((template) => {
      if (template.id === templateId) {
        console.log("✅ Updating template:", template.id);

        return {
          ...template,
          shifts: template.shifts.map((shift) => {
            if (String(shift.id) === shiftId) {
              // compare as strings
              console.log(
                "🔄 Updating shift:",
                shift.id,
                "Field:",
                field,
                "→",
                value
              );
              return { ...shift, [field]: value };
            }
            return shift;
          })
        };
      }
      return template;
    });

    console.log(
      "📌 Updated templates:",
      JSON.stringify(this.templates, null, 2)
    );
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
    const ms = hour * 60 * 60 * 1000 + minute * 60 * 1000;
    return ms;
  }

  // 🔹 Toast helper for showing errors
  showErrorMessage(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Validation Error",
        message: message,
        variant: "error"
      })
    );
  }

  handleCostperKmfuelChange(event) {
    this.costPerKmFuel = event.target.value;
    console.log("⛽ Cost per Km (Fuel) changed to:", this.costPerKmFuel);
  }

  handleCostperKmElectricChange(event) {
    this.costPerKmElectric = event.target.value;
    console.log(
      "⛽ Cost per Km (Electric) changed to:",
      this.costPerKmElectric
    );
  }

  convertTo24HourFormatforcustom(timeStr) {
    if (!timeStr) return null;

    const parts = timeStr.trim().split(/\s+/); // split by spaces safely
    const [hourPart, minutePart = "00"] = parts[0].split(":"); // default minutes to 00
    let hours = parseInt(hourPart, 10);
    const minutes = minutePart.padStart(2, "0");
    const period = parts[1]?.toLowerCase();

    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0;
    }

    const formattedHours = hours.toString().padStart(2, "0");
    return `${formattedHours}:${minutes}:00.000Z`;
  }

  convertMsTo24HourFormat(ms) {
    if (ms == null) return null;

    // Create a Date object starting at UTC midnight
    const date = new Date(0); // Epoch
    date.setUTCMilliseconds(ms);

    // Format as HH:mm:ss.SSSZ
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");

    return `${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  }

handleStartTimeChangeforCustom(event) {
  this.savebuttonDisable = false;
  console.log("🎯 handleStartTimeChangeforCustom triggered");

  const templateId = event.target.dataset.templateId;
  const shiftId = event.target.dataset.shiftId;
  const displayTime = event.detail.displaytime;

  console.log("🧩 Template ID:", templateId);
  console.log("🧩 Shift ID:", shiftId);
  console.log("🕑 Displayed Start Time:", displayTime);

  const convertedMs = this.convertToMilliseconds(displayTime);
  const converted24 = this.convertTo24HourFormatforcustom(displayTime.toLowerCase());
  const timeDetails = this.splitTimeParts(displayTime);

  const normalizeToMs = (value) => {
    if (!value) return null;
    if (typeof value === "number") return value;
    if (!isNaN(value)) return Number(value);
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.getTime();
  };

  this.templates = this.templates.map((template) => {
    if (String(template.id) === String(templateId)) {
      const updatedShifts = template.shifts.map((shift) => {
        if (String(shift.id) === String(shiftId)) {
          const updatedShift = {
            ...shift,
            startHour: timeDetails.hour,
            startMinute: timeDetails.minute,
            startAMPM: timeDetails.period,
            startTime: convertedMs,
            startTime24: converted24,
            displayedStartTime: displayTime,
            endTime24: this.convertMsTo24HourFormat(shift.endTime)
          };

          // Calculate duration
          const durationObj = this.calculateDuration(updatedShift);
          if (durationObj) {
            updatedShift.durationActual = durationObj.decimalHours;
            console.log("⏱ Updated Duration Object:", JSON.stringify(durationObj));
          }

          const actual = Number(updatedShift.durationActual || 0);
          const entered = Number(updatedShift.duration || 0);

          // ✅ Duration validation (skip if duration = 0)
          const duration = parseFloat(updatedShift.duration || 0);
          const durationActual = parseFloat(updatedShift.durationActual || 0);

          if (entered > 0 && actual > 0 && entered < actual) {
            console.error(`⛔ Duration Mismatch: Entered (${duration}) ≠ Actual (${durationActual})`);
            this.savebuttonDisable = true;
            Promise.resolve().then(() => {
              this.showToast(
                "Duration Mismatch",
                `Shift duration (${duration}) does not match actual time (${durationActual}).`,
                "error"
              );
            });
            this.savebuttonDisable = true;
          }

          console.log("✅ Final Updated Shift:", JSON.stringify(updatedShift, null, 2));
          return updatedShift;
        }
        return shift;
      });

      // 🔍 Sequential validation: previous shift endTime must match next shift startTime
      for (let i = 0; i < updatedShifts.length - 1; i++) {
        const currentShift = updatedShifts[i];
        const nextShift = updatedShifts[i + 1];

        const currentEndMs = normalizeToMs(currentShift.endTime);
        const nextStartMs = normalizeToMs(nextShift.startTime);

        // Only check if both times exist
        if (currentEndMs !== null && nextStartMs !== null && currentEndMs !== nextStartMs) {
          console.error(
            `⛔ Sequential Time Mismatch: Row ${i + 1} End (${currentShift.displayedEndTime}) ≠ Row ${i + 2} Start (${nextShift.displayedStartTime})`
          );
          this.savebuttonDisable = true;
          Promise.resolve().then(() => {
            this.showToast(
              "Shift Mismatch",
              `Row ${i + 1} End Time (${currentShift.displayedEndTime}) doesn't match Row ${i + 2} Start Time (${nextShift.displayedStartTime}).`,
              "error"
            );
          });
          break;
        }
      }

      return { ...template, shifts: updatedShifts };
    }
    return template;
  });

  console.log("📋 Final Updated Templates:", JSON.stringify(this.templates, null, 2));
}

handleEndTimeChangeforCustom(event) {
  this.savebuttonDisable = false;
  console.log("🎯 handleEndTimeChangeforCustom triggered");

  const templateId = event.target.dataset.templateId;
  const shiftId = event.target.dataset.shiftId;
  const displayTime = event.detail.displaytime;

  console.log("🧩 Template ID:", templateId);
  console.log("🧩 Shift ID:", shiftId);
  console.log("🕑 Displayed End Time:", displayTime);

  const convertedMs = this.convertToMilliseconds(displayTime);
  const converted24 = this.convertTo24HourFormatforcustom(displayTime.toLowerCase());
  const timeDetails = this.splitTimeParts(displayTime);

  const normalizeToMs = (value) => {
    if (!value) return null;
    if (typeof value === "number") return value;
    if (!isNaN(value)) return Number(value);
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.getTime();
  };

  this.templates = this.templates.map((template) => {
    if (String(template.id) === String(templateId)) {
      const updatedShifts = template.shifts.map((shift) => {
        if (String(shift.id) === String(shiftId)) {
          const updatedShift = {
            ...shift,
            endHour: timeDetails.hour,
            endMinute: timeDetails.minute,
            endAMPM: timeDetails.period,
            endTime: convertedMs,
            endTime24: converted24,
            displayedEndTime: displayTime,
            startTime24: this.convertMsTo24HourFormat(shift.startTime)
          };

          // ⏱ Calculate duration
          const durationObj = this.calculateDuration(updatedShift);
          if (durationObj) {
            updatedShift.durationActual = durationObj.decimalHours;
            console.log("⏱ Updated Duration Object:", JSON.stringify(durationObj));
          }

          // 🧮 Duration validation
          const entered = parseFloat(updatedShift.duration || 0);
          const actual = parseFloat(updatedShift.durationActual || 0);

          if (entered > 0 && actual > 0 && entered < actual) {
            console.error(`⛔ Duration Mismatch: Entered (${entered}) ≠ Actual (${actual})`);
            this.savebuttonDisable = true;
            Promise.resolve().then(() => {
              this.showToast(
                "Duration Mismatch",
                `Shift duration (${entered}) does not match actual time (${actual}).`,
                "error"
              );
            });
          }

          console.log("✅ Final Updated Shift:", JSON.stringify(updatedShift, null, 2));
          return updatedShift;
        }
        return shift;
      });

      // 🔍 Sequential validation: previous shift’s end vs next shift’s start
      for (let i = 0; i < updatedShifts.length - 1; i++) {
        const currentShift = updatedShifts[i];
        const nextShift = updatedShifts[i + 1];

        const currentEndMs = normalizeToMs(currentShift.endTime);
        const nextStartMs = normalizeToMs(nextShift.startTime);

        if (currentEndMs !== null && nextStartMs !== null && currentEndMs !== nextStartMs) {
          console.error(
            `⛔ Sequential Time Mismatch: Row ${i + 1} End (${currentShift.displayedEndTime}) ≠ Row ${i + 2} Start (${nextShift.displayedStartTime})`
          );
          this.savebuttonDisable = true;
          Promise.resolve().then(() => {
            this.showToast(
              "Shift Mismatch",
              `Row ${i + 1} End Time (${currentShift.displayedEndTime}) doesn't match Row ${i + 2} Start Time (${nextShift.displayedStartTime}).`,
              "error"
            );
          });
          break;
        }
      }

      return { ...template, shifts: updatedShifts };
    }
    return template;
  });

  console.log("📋 Final Updated Templates:", JSON.stringify(this.templates, null, 2));
}



  handleDeleteShiftforCustom(event) {
    const templateId = event.currentTarget.dataset.templateId;
    const shiftId = event.currentTarget.dataset.shiftId; // string from dataset

    console.log(
      "🗑️ Attempting to delete shift:",
      shiftId,
      "from template:",
      templateId
    );

    this.templates = this.templates.map((template) => {
      if (template.id === templateId) {
        console.log(
          "📌 Current shifts before deletion:",
          JSON.parse(JSON.stringify(template.shifts))
        );

        // Ensure both ids are strings for comparison
        let updatedShifts = template.shifts.filter(
          (shift) => String(shift.id) !== String(shiftId)
        );
        console.log(
          "📝 Shifts after deletion filter:",
          JSON.parse(JSON.stringify(updatedShifts))
        );

        // Reindex displayIndex
        updatedShifts = updatedShifts.map((shift, index) => ({
          ...shift,
          displayIndex: index + 1
        }));
        console.log(
          "🔢 Shifts after reindexing displayIndex:",
          JSON.parse(JSON.stringify(updatedShifts))
        );
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

          const currentEnd = normalizeToMs(
            currentShift.endTime24 || currentShift.end_time
          );
          const nextStart = normalizeToMs(
            nextShift.startTime24 || nextShift.start_time
          );

          console.log(
            `⏱️ Validating: Shift ${i + 1} End (${currentEnd}) vs Shift ${i + 2} Start (${nextStart})`
          );

          if (
            currentEnd !== null &&
            nextStart !== null &&
            currentEnd !== nextStart
          ) {
            hasMismatch = true;

            console.error(
              `⛔ Mismatch found: Shift ${i + 1} End (${currentShift.displayedEndTime}) ≠ Shift ${i + 2} Start (${nextShift.displayedStartTime})`
            );

            this.dispatchEvent(
              new ShowToastEvent({
                title: "Shift Mismatch After Deletion",
                message: `After deletion, Shift ${i + 1} End Time (${currentShift.displayedEndTime}) doesn't match Shift ${i + 2} Start Time (${nextShift.displayedStartTime}).`,
                variant: "error",
                mode: "dismissible"
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

    console.log(
      "🏁 Templates after deletion:",
      JSON.parse(JSON.stringify(this.templates))
    );
  }

  handleAddShiftforCustom(event) {
    const templateId = event.currentTarget.dataset.templateId; // ✅ use currentTarget
    console.log("➕ Adding new shift for templateId:", templateId);

    this.templates = this.templates.map((template) => {
      if (template.id === templateId && template.shifts.length < 4) {
        console.log(
          `📌 Current shifts for template [${templateId}]:`,
          JSON.parse(JSON.stringify(template.shifts))
        );

        const newShiftIndex = template.shifts.length + 1;
        const newShift = {
          id: Date.now(),
          name: "",
          type: "",
          startTime: "",
          endTime: "",
          displayIndex: newShiftIndex,
          selectedColor: "#AE016A",
        };
        console.log("🆕 New shift being added:", newShift);

        const updatedShifts = [...template.shifts, newShift];
        console.log(
          "✅ Updated shifts array:",
          JSON.parse(JSON.stringify(updatedShifts))
        );

        return {
          ...template,
          shifts: updatedShifts,
          showAddButton: updatedShifts.length < 4
        };
      }
      return template;
    });

    console.log(
      "🏁 Templates after adding shift:",
      JSON.parse(JSON.stringify(this.templates))
    );
  }

  handleAddTemplate() {
      const newTemplateId = Date.now().toString();
      const newTemplate = {
          id: newTemplateId,
          customShiftName: "",
          customShiftindex: this.templates.length + 1,
          shifts: this.createInitialShifts(newTemplateId),
          Facility__c: this.facilityValue,
          showAddButton: false,
          selectedColor: "#AE016A",
          colorStyle: `background-color: #AE016A; width: 25px; height: 25px; border: 1px solid #ccc;`
      };

      console.log("🎨 [handleAddTemplate] New template created:", newTemplate);

      this.templates = [...this.templates, newTemplate];
      console.log("📦 Updated templates:", JSON.stringify(this.templates));
  }


  handleColorChangeforCustom(event) {
    const templateId = event.target.dataset.templateId;
    const newColor = event.detail.value;

    this.templates = this.templates.map((template) => {
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

  showToast(title, message, variant) {
      this.dispatchEvent(
          new ShowToastEvent({
              title: title,
              message: message,
              variant: variant
          })
      );
  }
}