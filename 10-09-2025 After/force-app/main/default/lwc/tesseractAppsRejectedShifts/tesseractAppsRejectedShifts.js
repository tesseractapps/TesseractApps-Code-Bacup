import { LightningElement, wire, track, api } from "lwc";
import getRejectedShifts from "@salesforce/apex/AddShiftController.getRejectedShifts";
import RejectedshiftAllocation from "@salesforce/apex/AddShiftController.RejectedshiftAllocation";
import holidayList from "@salesforce/apex/LeaveController.holidayListbyOrg";
import getStaffHourlyRates from "@salesforce/apex/RostersPublishAndAssignHandler.getStaffHourlyRates";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import assignAutoShifts from "@salesforce/apex/RosterRejectedShiftsAutoScheduleHandler.assignAutoShifts";
import { refreshApex } from "@salesforce/apex";
import publishShifts from "@salesforce/apex/RosterAutoScheduleHandler.publishShifts";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

export default class TesseractAppsRejectedShifts extends LightningElement {
  @api orgid;
  headers = [];
  currentStartDate = new Date();
  @api state;
  @track holidayList = [];
  @track rejectedShifts = [];
  @track staffHorlyRateList = [];
  @track isAllocateTable = false;
  @track shiftId;
  @track selectedStaffId;
  @track shiftRows = [];
  @track rows = [
    {
      id: "1",
      label: "Classification",
      isIcon: true,
      direction: "arrowup",
      iconName: "utility:arrowup",
      directionLabel: "Low to High"
    },
    {
      id: "2",
      label: "Risk Index",
      isIcon: true,
      direction: "arrowup",
      iconName: "utility:arrowup",
      directionLabel: "Low to High"
    },
    { id: "3", label: "Employment Type", isRadio: true, value: "Permanent" },
    { id: "4", label: "Preferred Staff", isCheckbox: true, value: false },
    { id: "5", label: "Fatigue Management", isCheckbox: true, value: false },
    { id: "6", label: "Geo Location", isSlider: true, value: 50 }
  ];
  @track currentUserEmail;
  @track usererror;
  @track documentExpired = false;

  @track autoschdulePopup = false;
  @track publishTempalte = false;
  @track startDate;
  @track endDate;
  wiredRejectedShiftsResult;
  @track selectedDateValue;
  @track isHome = false;
  @track isRejectedShiftReports = false;
  @track facilityArray = [];
  @track facilityPreferredName;
  @track participantPreferredName;
  connectedCallback() {
    this.initializeHeaders();
    //this.fetchOrgDetails();
    //this.loadShifts();
    this.fetchHolidays();
    const today = new Date();
    this.selectedDateValue = today.toISOString().split("T")[0]; // format: YYYY-MM-DD
    this.isHome = true;
    this.facilityArray = [];
    this.participantPreferredName = this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "";
    setTimeout(() => {
      this.navigateToToday();
    }, 1000);

    /*    getCurrentLoggedUserInfo().then((userInfo) => { 
                                    console.log('userInfo' +userInfo.User_Type__c);
                                    if(userInfo.User_Type__c =='Facility Admin' || userInfo.User_Type__c =='HR Admin' || userInfo.User_Type__c =='Roster Manager'){ 
                                        const storedFacilityId = localStorage.getItem('defaultFacilityId');
                                        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
                                        this.facilityArray.push(storedFacilityId);
                                  }else{
                                    getFacilityData().then(response => {
                                            response.forEach(rec=>{
                                                this.facilityArray.push(rec.Id);
                                            });
                                                 console.log('facilityArray '+JSON.stringify(facilityArray))
                                            }).catch(err => {
                                            console.error(err);
                                    });
                                  }
                }) */
  }

  fetchOrgDetails() {
    orgDetails()
      .then((response) => {
        console.log("Response for Org Details =>", response);
        this.Orgid = response.Id;
        this.orgfullname = response.Name;
        //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
      })
      .catch((error) => {
        console.error("Error fetching org details:", error);
        this.error = error;
      });
  }

  initializeHeaders() {
    const dayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

    const baseDate = new Date(this.currentStartDate);
    const dayOfWeek = baseDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

    // Adjust to get Monday as the start of the week
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // if Sunday (0), go back 6 days

    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + offset);
    this.startDate = weekStart.toISOString().split("T")[0];
    this.headers = [];

    for (let i = 0; i < 7; i++) {
      const current = new Date(weekStart);
      current.setDate(weekStart.getDate() + i);

      const dd = String(current.getDate()).padStart(2, "0");
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const yyyy = current.getFullYear();
      const formattedDate = `${dd}`;
      const isoDate = current.toISOString().split("T")[0];

      this.headers.push({
        dayName: dayFormatter.format(current),
        date: formattedDate,
        key: isoDate,
        shifts: [],
        hasShifts: false
      });
      if (i === 6) {
        this.endDate = isoDate;
      }
    }
    refreshApex(this.wiredRejectedShiftsResult);
    //  console.log('headers:',  JSON.stringify(this.headers));
  }

  handlePreviousWeek() {
    this.currentStartDate = new Date(
      this.currentStartDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    this.selectedDateValue = this.currentStartDate.toISOString().split("T")[0];
    this.initializeHeaders();
    this.fetchHolidays();
  }

  handleNextWeek() {
    this.currentStartDate = new Date(
      this.currentStartDate.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    this.selectedDateValue = this.currentStartDate.toISOString().split("T")[0];
    this.initializeHeaders();
    this.fetchHolidays();
  }

  navigateToToday() {
    this.currentStartDate = new Date();
    this.selectedDateValue = this.currentStartDate.toISOString().split("T")[0];
    this.initializeHeaders();
    this.fetchHolidays();
  }
  handleDateChange(event) {
    this.selectedDateValue = event.target.value; // update tracked value
    if (this.selectedDateValue) {
      this.currentStartDate = new Date(this.selectedDateValue);
      this.initializeHeaders();
      this.fetchHolidays();
    }
  }
  get wiredDateParams() {
    return {
      datePicker: this.currentStartDate.toISOString().split("T")[0],
      orgId: this.orgid
    };
  }

  @wire(getRejectedShifts, {
    datePicker: "$wiredDateParams.datePicker",
    orgId: "$wiredDateParams.orgId"
  })
  wiredRejectedShifts(result) {
    this.wiredRejectedShiftsResult = result; // for refreshApex
    console.log("result " + JSON.stringify(result));
    if (result.data) {
      const storedFacilityId = localStorage.getItem("defaultFacilityId");
      const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");

      console.log("storedFacilityId >>", storedFacilityId);
      console.log("storedFacilityLabel >>", storedFacilityLabel);
      let fanalData = result.data;
      let facilityIds = [];
      facilityIds.push(storedFacilityId);
      const filteredData = fanalData.filter((rec) =>
        facilityIds.includes(rec.Add_Shift__r?.Facility__c)
      );
      this.rejectedShifts = filteredData;
      this.mapShiftsToHeaders();
    } else if (result.error) {
      console.error("Error in wiredRejectedShifts:", result.error);
    }
  }

  mapShiftsToHeaders() {
    this.headers.forEach((header) => {
      header.shifts = [];
      header.hasShifts = false;
    });

    this.rejectedShifts.forEach((shift) => {
      const startDateStr = shift.Add_Shift__r?.Start_Date__c;
      const header = this.headers.find((h) => h.key === startDateStr);
      if (header) {
        header.shifts.push({
          id: shift.Id,
          staffName: shift.Staff__r?.Name || "Unknown",
          staffName1: shift.Staff__r?.Display_Nickname__c || "Unknown",
          time: shift.Add_Shift__r?.Shift_Start_End_Time__c || "",
          role: shift.Add_Shift__r?.Role__c || "",
          location: shift.Add_Shift__r?.Location__Street__s || "",
          direction: shift.Add_Shift__r?.Direction__r?.Name || "",
          staffId: shift.Staff__c,
          picture: shift.Staff__r?.picture__c || "",
          shiftColor: shift.Shiftcolor__c || "",
          isAssigned: shift.Rejected_Assigned__c || false
        });
        header.hasShifts = true;
      }
    });

    this.headers = [...this.headers]; // trigger reactivity
    this.computeShiftRows();
  }

  computeShiftRows() {
    const maxRows = Math.max(...this.headers.map((h) => h.shifts.length));
    const rows = [];

    for (let i = 0; i < maxRows; i++) {
      const row = this.headers.map((header, colIndex) => {
        const shift = header.shifts[i] || null;
        return {
          shift,
          key: `cell-${i}-${colIndex}`
        };
      });
      rows.push({
        key: `row-${i}`,
        cells: row
      });
    }

    this.shiftRows = rows; // This is now a tracked variable you use in template
    console.log("shiftRows:", JSON.stringify(this.shiftRows));
  }

  fetchHolidays() {
    const todayDate = new Date().toISOString().split("T")[0];
    const formattedDate = this.currentStartDate.toISOString().split("T")[0];

    if (formattedDate && this.state) {
      console.log("state------>" + this.state);
      holidayList({ datePicker: formattedDate, state: this.state })
        .then((response) => {
          this.holidayList = response;
          console.log("Fetched Holidays:", JSON.stringify(this.holidayList));

          this.headers.forEach((header) => {
            const headerDate = header.key; // ISO date (YYYY-MM-DD)
            const holiday = this.holidayList.find(
              (h) => h.Date__c === headerDate
            );

            const isHoliday = !!holiday;
            const isToday = headerDate === todayDate;

            if (isHoliday && isToday) {
              header.holidayName = holiday.Holiday_Name__c;
              header.isHoliday = true;
              header.bgColor = "bgColor3"; // Today + Holiday
            } else if (isHoliday) {
              header.holidayName = holiday.Holiday_Name__c;
              header.isHoliday = true;
              header.bgColor = "bgColor1"; // Just Holiday
            } else if (isToday) {
              header.holidayName = "";
              header.isHoliday = false;
              header.bgColor = "bgColor3"; // Just Today
            } else {
              header.holidayName = "";
              header.isHoliday = false;
              header.bgColor = "bgColor2"; // Normal
            }
          });

          this.headers = [...this.headers]; // Trigger UI update
        })
        .catch((error) => {
          console.error("Error fetching holiday list:", error);
        });
    }
  }

  AllocateShift(event) {
    this.shiftId = event.target.dataset.id;
    let staffId = event.target.dataset.staff;
    console.log("staff id " + staffId);
    const selectedRecord = this.rejectedShifts.find(
      (item) => item.Id === this.shiftId
    );
    console.log("selectedRecord:", JSON.stringify(selectedRecord));
    const startdate = selectedRecord.Date__c;
    console.log("startdate:", startdate);

    const enddate = selectedRecord.End_Date__c;
    console.log("enddate:", enddate);
    const addshift = [selectedRecord.Add_Shift__r];
    console.log("addshift:", JSON.stringify(addshift));
    this.facilityArray.push(addshift[0].Facility__c);

    getStaffHourlyRates({
      addShiftList: addshift,
      startdate: startdate,
      enddate: enddate,
      facilityVal: this.facilityArray
    })
      .then((result) => {
        const parsedResult = JSON.parse(result);
        console.log("Staff Hourly Rates (full):", JSON.stringify(parsedResult));

        // Filter out the record with the given staffId
        this.staffHorlyRateList = parsedResult
          .filter((item) => item.Id !== staffId)
          .map((item, index) => ({
            ...item,
            serialNumber: index + 1
          }));

        console.log(
          "Filtered Hourly Rates:",
          JSON.stringify(this.staffHorlyRateList)
        );
        // Do something with the result
      })
      .catch((error) => {
        console.error("Error retrieving staff hourly rates:", error);
      });
    this.isAllocateTable = true;
  }

  async handleAllocateToggle(event) {
    const selectedId = event.target.dataset.id;
    const checked = event.target.checked;
    this.staffHorlyRateList = this.staffHorlyRateList.map((staff) =>
      staff.Id === selectedId
        ? { ...staff, isAllocate: event.target.checked }
        : staff
    );
    await this.DocExpiryCheck(selectedId);
    if (this.documentExpired) {
      this.staffHorlyRateList = this.staffHorlyRateList.map((staff) =>
        staff.Id === selectedId ? { ...staff, isAllocate: false } : staff
      );

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "One or more documents have expired. Please update them before proceeding.",
          variant: "error"
        })
      );

      return;
    }

    if (checked) {
      // User is trying to select a toggle
      if (this.selectedStaffId && this.selectedStaffId !== selectedId) {
        // Already selected someone else — not allowed
        event.target.checked = false; // Revert the toggle
        this.staffHorlyRateList = this.staffHorlyRateList.map((staff) =>
          staff.Id === selectedId ? { ...staff, isAllocate: false } : staff
        );

        this.confirMationMessage(
          "Error",
          "Only one staff can be allocated at a time.",
          "error"
        );
        return;
      }

      // Set selected ID
      this.selectedStaffId = selectedId;
      console.log("selectedStaffId" + this.selectedStaffId);
    } else {
      // Toggle was unchecked — remove selected ID
      this.selectedStaffId = null;
    }
  }

  async DocExpiryCheck(staffId) {
    console.log("Parent record Id in addingPreTax: " + staffId);

    const response = await fetchStaff({ recordId: staffId }); // ⏳ wait for Apex
    console.log("staff list after save: " + JSON.stringify(response));
    console.log("response.length: " + Object.keys(response).length);

    let childRec = response.Child_Staffs__r || [];
    this.documentExpired = false; // reset flag
    const today = new Date();

    for (let rec of childRec) {
      if (rec.Compliance__c === true && new Date(rec.Expiry_Date__c) < today) {
        this.documentExpired = true;
        console.log("Expired doc", this.documentExpired);
        break;
      }
    }
  }

  confirMationMessage(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }

  handleAllocate() {
    if (!this.selectedStaffId) {
      this.confirMationMessage(
        "Error",
        "Please select a staff to allocate.",
        "error"
      );
      return;
    }

    RejectedshiftAllocation({
      shiftId: this.shiftId, // Make sure this.shiftId is set
      StaffId: this.selectedStaffId
    })
      .then(() => {
        this.confirMationMessage(
          "Success",
          "Shift allocated successfully.",
          "success"
        );
        this.isAllocateTable = false;
        this.shiftId = "";
        this.selectedStaffId = "";
        this.initializeHeaders();
        // this.loadShifts();
        refreshApex(this.wiredRejectedShiftsResult);
        this.fetchHolidays();
      })
      .catch((error) => {
        console.error("Error allocating shift:", error);
        this.showErrorToast("Failed to allocate shift.");
        this.confirMationMessage("Error", error, "error");
      });
  }
  handleBack() {
    this.isAllocateTable = false;
    this.shiftId = "";
    this.selectedStaffId = "";
  }
  handleautoSchedule() {
    this.autoschdulePopup = true;
  }
  handleDragOver(event) {
    event.preventDefault();
  }
  handleCloseautoSchedule() {
    this.autoschdulePopup = false;
  }
  handleDrop(event) {
    const droppedIndex = +event.currentTarget.dataset.index;
    const rows = [...this.rows];

    const [movedItem] = rows.splice(this.draggedIndex, 1);
    rows.splice(droppedIndex, 0, movedItem);
    this.rows = rows;
    console.log("  auto schedule row in drop " + JSON.stringify(this.rows));
  }
  handleDragStart(event) {
    this.draggedIndex = +event.currentTarget.dataset.index;
  }

  handleDrop(event) {
    const droppedIndex = +event.currentTarget.dataset.index;
    const rows = [...this.rows];

    const [movedItem] = rows.splice(this.draggedIndex, 1);
    rows.splice(droppedIndex, 0, movedItem);
    this.rows = rows;
    console.log("  auto schedule row in drop " + JSON.stringify(this.rows));
  }
  stopDragPropagation(event) {
    event.stopPropagation();
  }

  toggleArrow(event) {
    const index = +event.currentTarget.dataset.index;
    const currentDirection = this.rows[index].direction;
    const newDirection =
      currentDirection === "arrowup" ? "arrowdown" : "arrowup";
    const updatedRows = [...this.rows];

    updatedRows[index].direction = newDirection;
    updatedRows[index].iconName = `utility:${newDirection}`;
    updatedRows[index].directionLabel =
      newDirection === "arrowup" ? "Low to High" : "High to Low";

    this.rows = updatedRows; // trigger reactivity
    console.log("  auto schedule row " + JSON.stringify(this.rows));
  }

  get rowIconName() {
    return (row) => {
      return row.direction === "up" ? "utility:arrowup" : "utility:arrowdown";
    };
  }

  handleInputChange(event) {
    const index = +event.target.dataset.index;
    let value;

    if (event.target.type === "checkbox") {
      value = event.target.checked;
    } else {
      value = event.target.value; // slider/radio both use value
    }

    this.rows[index].value = value;
    this.rows = [...this.rows]; // trigger reactivity

    console.log("Updated rows:", JSON.stringify(this.rows));
  }

  get previewRows() {
    return this.rows.map((row) => {
      let displayValue = "";

      if (row.isCheckbox) {
        displayValue = row.value ? "Checked" : "Unchecked";
      } else if (row.isRadio) {
        displayValue = row.value || "Not selected";
      } else if (row.isIcon) {
        displayValue = row.direction.toUpperCase();
      }

      return {
        id: row.id,
        label: row.label,
        displayValue: displayValue
      };
    });
  }

  get employmentTypeOptions() {
    return [
      { label: "Permanent", value: "Permanent" },
      { label: "Casual", value: "Casual" }
    ];
  }
  handleRun() {
    console.log("startDate: " + this.startDate);
    console.log("endDate: " + this.endDate);
    console.log("auto schedule row (before): " + JSON.stringify(this.rows));

    if (Array.isArray(this.rows)) {
      this.rows = this.rows.map((row, index) => {
        return {
          ...row,
          index: index + 1
        };
      });
    }
    assignAutoShifts({
      startDate: this.startDate,
      endDate: this.endDate,
      orgId: this.orgid,
      AutoScheduleParameters: JSON.stringify(this.rows)
    })
      .then((result) => {
        this.confirMationMessage(
          "Success",
          "Auto-scheduling completed successfully.",
          "Success"
        );
        this.autoschdulePopup = false;
        //  this.loadShifts();
        refreshApex(this.wiredRejectedShiftsResult);
      })
      .catch((error) => {
        console.log(error);
        this.confirMationMessage(
          "Error",
          "Error Occured While Assigning Shifts",
          "Error"
        );
        this.autoschdulePopup = false;
      });

    console.log("auto schedule row (after): " + JSON.stringify(this.rows));
  }

  handleFinalPublish() {
    publishShifts({ startDate: this.startDate, endDate: this.endDate })
      .then(() => {
        this.confirMationMessage(
          "Success",
          "Shifts Published Successfully",
          "Success"
        );
        refreshApex(this.wiredRejectedShiftsResult);
        this.publishTempalte = false;
      })
      .catch((error) => {
        console.error("Error updating shift:", error);
        this.confirMationMessage(
          "Error",
          "Error Occured While Publishing Shifts",
          "Error"
        );
        this.publishTempalte = false;
      });
  }
  handlePublishShifts() {
    this.publishTempalte = true;
  }
  HandleReports() {
    this.isHome = false;
    this.isRejectedShiftReports = true;
  }
  handleCloseChild() {
    this.isHome = true;
    this.isRejectedShiftReports = false;
  }
}