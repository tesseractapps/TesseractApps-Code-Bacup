import { LightningElement, track, wire } from "lwc";
import getFacilityData from "@salesforce/apex/StaffController.fetchFacilitiess";
import StaffsRolesWiseList from "@salesforce/apex/RosterTimeSheetController.StaffsRolesWiseList";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import holidayList from "@salesforce/apex/RosterTimeSheetController.holidayListbyOrg";
import getStaffShiftData from "@salesforce/apex/RosterTimeSheetController.getStaffShiftData";
import fetchStaffShiftData from "@salesforce/apex/RosterTimeSheetController.getStaffShiftData";
import updateAllocations from "@salesforce/apex/RosterTimeSheetController.updateAllocations";
import getShiftReimbursements from "@salesforce/apex/SubmissionsController.getShiftReimbursements";
import getAddShiftDataById from "@salesforce/apex/AddShiftController.getAddShiftDataById";
import getStaffById from "@salesforce/apex/StaffController.getStaffById";
import getCheckListByShiftId from "@salesforce/apex/RosterTimeSheetController.getCheckListByShiftId";
import getActivityLog from "@salesforce/apex/SignInCheckListAndNotesHandler.getActivityLog";
import editAllocation from "@salesforce/apex/RosterTimeSheetController.editAllocation";
import { getRecord } from "lightning/uiRecordApi";
import Id from "@salesforce/user/Id";
import UserTypeName from "@salesforce/schema/User.User_Type__c";
import getMismatchedShifts from "@salesforce/apex/RosterTimeSheetController.getMismatchedShifts";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getJSONdata from "@salesforce/apex/GeoTaggingfromAWS.getS3JsonData";
import { loadScript } from "lightning/platformResourceLoader";
import jsPDFLib from "@salesforce/resourceUrl/jspdf";
import autoTableLib from "@salesforce/resourceUrl/autotable";
import autoTable from "@salesforce/resourceUrl/autotable";
let jsPDF;

export default class Timesheet extends LightningElement {
  @track weekDays = [];
  @track staffMembers = [];
  @track currentDate = new Date();
  @track facilityOptions = [];
  @track orgId;
  @track facilityIdList = [];
  @track selectedRoles = [];
  @track nameFilter = "";
  @track staffList = [];
  @track facSelectedValue;
  @track holidayList;
  @track datePickerString;
  @track currentPage = 1;
  @track pageSize = 10;
  @track pageSizeOptions = [10, 25, 50, 75, 100];
  @track state;
  @track weekStartDate;
  @track weekEndDate;
  @track trackedStaffIds = [];
  @track totalPages;
  @track staffShiftData = [];
  @track isLoading = false;
  @track error;
  @track allStaff = [];
  @track timeSheet = true;
  @track shiftInformation = false;
  @track submissionFlag = false;
  @track confirmationData = {};
  @track editflag = false;
  @track isCustomShifts = false;
  @track isLongMorningShift = false;
  @track isLongAfternoonShift = false;
  @track isLongNightShift = false;
  @track isLongSleepoverShift = false;
  @track isExtendedShift = false;
  @track isSleepOver = false;
  @track isReimburesementsTable = false;
  @track shiftEndtime = "";
  @track dayWiseReimburesements = [];
  @track enddate = "";
  @track totalShiftWages;
  @track shiftID;
  @track addShiftId;
  @track extendedHoursandmins;
  @track shiftType;
  @track staffid;
  @track currentShiftrates = false;
  @track SleepOverNightHourlyRates;
  @track varianceRate;
  @track extendedWage;
  @track sleepOverWage;
  @track extendedDuartion;
  @track sleepovernightshiftduartion;
  @track extendedWage;
  @track sleepOverWage;
  @track sleepovernightshiftduartion;
  @track extendedDuartion;
  @track ShiftRatelabel = "Hourly Rate";
  @track isChecked = false;
  @track ismissmatchedshifts = false;
  @track StaffId;
  @track totalShiftDuration = 0;
  @track totalApprovedLoggedDuration = 0;
  @track totalKms = 0;
  @track totalexpenses = 0;
  @track sleepoverDuration = 0;
  @track BulkApproveFlag = false;
  @track userType = false;
  @track isShowChecklsit = false;
  @track isTemplateMode = false;
  @track showSpinner = false;
  @track currentViewFlag = "";
  @track isModalOpen = false;
  @track currentUrl;
  @track isShowActivity = false;
  @track activitydata = [];
  @track shiftID;
  @track staffDetails = [];
  @track totalShiftWages = 0;
  @track extendedWage = 0;
  @track sleepOverWage = 0;
  @track totalReiAmount = 0;
  @track grandTotal = 0;
  @track isExtendedShift = false;
  @track isSleepOver = false;
  @track StaffName1;
  wiredShiftDataResult;
  wiredShiftResult;
  @track selectedShiftIds;
  @track ShowGeoLocation = false;
  @track showLocation = false;
  @track hideLocation = false;
  @track isShowMap = false;
  leafletInitialized = false;
  polyline;
  @track jsonData;
  @track rateRows = [];
  @track fieldErrorMap = {};
  @track otherThanNdis = false;
  @track facSelectedLabel;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track selectedStaffShiftsforPDF = [];
  @track showExportRange = false;
  @track isModalOpenfortimesheetExport = false;
  @track frequency;
  @track startDate;
  @track exportRange;
  @track exportFormat;
  @track endDateforDownload;
  jsPdfInitialized = false;

  frequencyOptions = [
    { label: "Weekly", value: "Weekly" },
    { label: "Fortnightly", value: "Fortnightly" },
    { label: "Monthly", value: "Monthly" }
  ];

  formatOptions = [
    { label: "CSV", value: "CSV" },
    { label: "PDF", value: "PDF" }
  ];

  activeSections = [
    "StaffDetails",
    "OriginalStaffDetails",
    "CompletedStaffDetails",
    "ExtendedShift",
    "SleepoverShift",
    "CompletedStaffDetails1"
  ];
  @track sectionFlags = {
    staffDetails: true,
    OriginalStaffDetails: true,
    CompletedStaffDetails: true,
    CompletedStaffDetails1: true,
    ExtendedShift: true,
    SleepoverShift: true,
    longMorningShift: true,
    longAfternoonShift: true,
    longNightShift: true,
    LongSleepoVershift: true,
    CustomShift: true
  };

  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }

  @track sectionIcons = {
    staffDetails: "\u2B9F",
    OriginalStaffDetails: "\u2B9F",
    CompletedStaffDetails: "\u2B9F",
    CompletedStaffDetails1: "\u2B9F",
    ExtendedShift: "\u2B9F",
    SleepoverShift: "\u2B9F",
    longMorningShift: "\u2B9F",
    longAfternoonShift: "\u2B9F",
    longNightShift: "\u2B9F",
    LongSleepoVershift: "\u2B9F",
    CustomShift: "\u2B9F"
  };
  @track apiFieldMap = {
    morningShift: {
      isActive: "Is_long_Morning__c",
      start: "Long_Morning_Start_Time__c",
      end: "Long_Morning_End_Time__c",
      rate: "Long_Morning_Hourly_Rate__c",
      duration: "Long_Morning_Shift_Duartion__c"
    },
    afternoonShift: {
      isActive: "Is_Long_Afternoon__c",
      start: "Long_Afternoon_Start_Time__c",
      end: "Long_Afternoon_End_Time__c",
      rate: "Long_Afternoon_Hourly_Rate__c",
      duration: "Long_Afternoon_Shift_Duartion__c"
    },
    nightShift: {
      isActive: "Is_Long_Night_Shift__c",
      start: "Long_Night_Start_Time__c",
      end: "Long_Night_End_Time__c",
      rate: "Long_Night_Hourly_Rate__c",
      duration: "Long_Night_Shift_Duartion__c"
    },
    sleepOverShift: {
      isActive: "Is_Long_SleepOver__c",
      start: "Long_Sleepover_Start_Time__c",
      end: "Long_Sleepover_End_Time__c",
      rate: "Long_Sleepover_Allowance__c",
      duration: "Long_Sleepover_Duartion__c"
    },
    morningShiftTwo: {
      isActive: "Is_long_Morning_Shift_two__c",
      start: "Long_Morning_Start_Time_Two__c",
      end: "Long_Morning_End_Time_Two__c",
      rate: "Long_Morning_Rate_Two__c",
      duration: "Long_Morning_Duartion_Two__c"
    },
    afternoonshiftTwo: {
      isActive: "Is_Long_afternoon_shift_two__c",
      start: "Long_Afternoon_Start_Time_two__c",
      end: "Long_afternoon_End_Time_Two__c",
      rate: "Long_Afternoon_Rate_Two__c",
      duration: "Long_Afternoon_Duration_Two__c"
    }
  };

  @wire(getRecord, { recordId: Id, fields: [UserTypeName] })
  userDetails({ error, data }) {
    if (data) {
      console.log("data in Timesheet", data);
      const currentUserType = data.fields.User_Type__c.value;
      this.userType = false;
      if (currentUserType == "NDIS Staff") {
        this.userType = true;
        this.isTemplateMode = false;
      }
    } else if (error) {
      this.usererror = error;
    }
  }

  @wire(getStaffShiftData, {
    staffIds: "$trackedStaffIds",
    weekStartDate: "$weekStartDate",
    weekEndDate: "$weekEndDate"
  })
  wiredShiftData(result) {
    this.wiredShiftDataResult = result;

    const { data, error } = result;
    this.isLoading = false;

    if (data) {
      this.error = null;
      this.staffShiftData = data;

      console.log("Shift Data from Apex:", JSON.stringify(data));
      if (data.length > 0 && data[0].shifts.length > 0) {
        console.log("First Shift Date:", data[0].shifts[0].Date__c);
      }

      this.generatedShiftMap = {};

      data.forEach((staffData) => {
        staffData.shifts.forEach((shift) => {
          const date = shift.Date__c;
          if (!this.generatedShiftMap[date]) {
            this.generatedShiftMap[date] = [];
          }
          this.generatedShiftMap[date].push({
            ...shift,
            cellClass: this.getCellClass(shift.hasVariance, shift.approved)
          });
        });
      });

      console.log("this.generatedShiftMap >>", this.generatedShiftMap);
      this.generateMockData();
    } else if (error) {
      this.error = error;
      console.error("Error loading shift data:", error);
    }
  }

  connectedCallback() {
    const today = new Date();
    this.datePickerString = today.toISOString().split("T")[0];

    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const sunday = new Date(today);

    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    monday.setDate(today.getDate() + diffToMonday);
    sunday.setDate(monday.getDate() + 6);

    this.weekStartDate = monday.toISOString().split("T")[0];
    this.weekEndDate = sunday.toISOString().split("T")[0];

    console.log("Week Start:", this.weekStartDate);
    console.log("Week End:", this.weekEndDate);

    //this.initializeWeekDays();
    this.initializeFacilityAndOrgDetails();
    this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "";
  }

  /* renderedCallback() {
        if (this.jsPdfInitialized) {
            return;
        }
        this.jsPdfInitialized = true;

        Promise.all([
            loadScript(this, jsPDFLib + '/jspdf.umd.min.js'),
            loadScript(this, autoTable + '/jspdf.plugin.autotable.min.js')
        ])
        .then(() => {
            console.log('✅ Both jsPDF and autoTable loaded');

            // ⚡ Expose jsPDF constructor
            window.jsPDF = window.jspdf.jsPDF;

            // ⚡ Attach autoTable plugin
            if (window.jspdf && window.jspdf.autoTable) {
                window.jsPDF.API.autoTable = window.jspdf.autoTable;
                console.log('🔌 autoTable attached to jsPDF');
            } else {
                console.error('⚠️ autoTable not found on window.jspdf');
            }
        })
        .catch(error => {
            console.error('❌ Failed loading PDF libraries', error);
        });
    } */

  renderedCallback() {
    Promise.all([loadScript(this, jsPDFLib), loadScript(this, autoTable)])
      .then(() => {
        this.jsPDFInitialized = true;
        console.log("✅ jsPDF and autoTable loaded successfully");
      })
      .catch((error) => {
        console.error("❌ Error loading jsPDF or autoTable:", error);
      });
  }

  initializeFacilityAndOrgDetails() {
    getCurrentLoggedUserInfo().then((userData) => {
      const storedFacilityId = localStorage.getItem("defaultFacilityId");
      const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");
      console.log("storedFacilityId local storage: " + storedFacilityId);
      console.log("storedFacilityLabel local storage: " + storedFacilityLabel);
      console.log("user data => " + JSON.stringify(userData));

      let userType = userData.User_Type__c;

      if (userType === "NDIS Org Admin") {
        getFacilityData()
          .then((response) => {
            this.facilityOptions = response.map((record) => ({
              value: record.Id,
              label: record.Name
            }));

            if (this.facilityOptions.length > 0) {
              this.facilityVal = storedFacilityId;
              this.facSelectedValue = this.facilityVal;

              // ✅ Get the label from facilityOptions
              const selectedFacility = this.facilityOptions.find(
                (opt) => opt.value === this.facSelectedValue
              );
              this.facSelectedLabel = selectedFacility
                ? selectedFacility.label
                : "";
              console.log("Selected Facility Label: " + this.facSelectedLabel);

              // Optional: Save label to localStorage
              localStorage.setItem(
                "defaultFacilityLabel",
                this.facSelectedLabel
              );

              this.facilityIdList = [this.facSelectedValue];
              this.fetchOrganizationDetails();
            }
          })
          .catch((error) => {
            console.error("Error fetching facilities: ", error);
          });
      } else if (
        userType === "Facility Admin" ||
        userType === "Roster Manager"
      ) {
        getFacilityCurrentUser().then((result) => {
          this.facilityOptions = result.map((record) => ({
            label: record.Facility__r.Name,
            value: record.Facility__r.Id
          }));

          if (this.facilityOptions.length > 0) {
            this.facilityVal = storedFacilityId;
            this.facSelectedValue = this.facilityVal;

            // ✅ Get the label from facilityOptions
            const selectedFacility = this.facilityOptions.find(
              (opt) => opt.value === this.facSelectedValue
            );
            this.facSelectedLabel = selectedFacility
              ? selectedFacility.label
              : "";
            console.log("Selected Facility Label: " + this.facSelectedLabel);

            // Optional: Save label to localStorage
            localStorage.setItem("defaultFacilityLabel", this.facSelectedLabel);

            this.facilityIdList = [this.facSelectedValue];
            this.fetchOrganizationDetails();
          }
        });
      } else if (userType === "NDIS Staff") {
        getFacilityData()
          .then((response) => {
            this.facilityOptions = response.map((record) => ({
              value: record.Id,
              label: record.Name
            }));

            if (this.facilityOptions.length > 0) {
              this.facilityVal = storedFacilityId;
              this.facSelectedValue = this.facilityVal;

              // ✅ Get the label from facilityOptions
              const selectedFacility = this.facilityOptions.find(
                (opt) => opt.value === this.facSelectedValue
              );
              this.facSelectedLabel = selectedFacility
                ? selectedFacility.label
                : "";
              console.log("Selected Facility Label: " + this.facSelectedLabel);

              // Optional: Save label to localStorage
              localStorage.setItem(
                "defaultFacilityLabel",
                this.facSelectedLabel
              );

              this.facilityIdList = [this.facSelectedValue];
              this.fetchOrganizationDetails();
            }
          })
          .catch((error) => {
            console.error("Error fetching facilities: ", error);
          });
      }
    });
  }

  fetchOrganizationDetails() {
    organizationDetails()
      .then((response) => {
        const org = response.listofPriceBook;
        this.otherThanNdis = response.listofPriceBook.Other_than_NDIS_User__c;
        this.invoiceData = org;
        this.orgId = org.Id;
        this.orgname = org.Name;
        this.abn = org.ABN__c;
        this.rcti = org.RCTI__c;
        this.address = org.Address_Latest__Street__s;
        this.statePostal = `${org.Address_Latest__City__s}, ${org.Address_Latest__StateCode__s}, ${org.Address_Latest__PostalCode__s}`;
        this.contactNo = org.Contact_No__c;
        this.bank = org.Bank__c;
        this.accountNo = org.Account_Number__c;
        this.accountName = org.Account_Name__c;
        this.bsb = org.BSB__c;
        this.desc = org.Description__c;
        this.orgLogo = response.bolbdata;
        this.state = org.Address_Latest__StateCode__s;
        //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;
        this.pageSize = 10;
        this.fetchHolidayList(this.state);
        return this.fetchStaffList(
          this.orgId,
          this.facilityIdList,
          this.selectedRoles,
          this.nameFilter
        );
      })
      .then(() => {
        this.trackedStaffIds = this.staffMembers
          .slice(0, this.pageSize)
          .map((staff) => staff.Id);

        console.log("Tracked Staff Ids:", this.trackedStaffIds);
      })
      .catch((error) => {
        console.error("Error fetching organization details: ", error);
      });
  }

  handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log("isValid", isValid);

    this.fieldErrorMap[field] = !isValid;
  }

  getFieldClass(fieldName) {
    return this.fieldErrorMap[fieldName]
      ? "floating-label2"
      : "floating-label-signin";
  }
  get LogInDateTimeClass() {
    return this.getFieldClass("Log_In_Date_Time__c");
  }
  get LogOutDateTimeClass() {
    return this.getFieldClass("Log_Out_Date_Time__c");
  }

  fetchStaffList(orgId, facIdList, roles, nameFilter) {
    return StaffsRolesWiseList({
      orgId: orgId,
      facIdlist: facIdList,
      roles: roles,
      name: nameFilter
    })
      .then((result) => {
        this.staffMembers = result;
        this.memberSummaries = result;
        this.allStaff = result;
        this.staffDirectory = result;
        this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);
        console.log("Fetched staff list: ", JSON.stringify(this.staffMembers));
      })
      .catch((error) => {
        console.error("Error fetching staff list: ", error);
      });
  }

  handleChange(event) {
    this.facilityVal = event.detail.value;
    this.facSelectedValue = event.detail.value;
    this.pageSize = 10;
    this.facilityIdList = [this.facSelectedValue];

    const selectedOption = this.facilityOptions.find(
      (option) => option.value === this.facSelectedValue
    );

    if (selectedOption) {
      this.facSelectedLabel = selectedOption.label;
      console.log("Selected Facility Label:", this.facSelectedLabel);
    } else {
      this.facSelectedLabel = null;
    }

    this.fetchStaffList(
      this.orgId,
      this.facilityIdList,
      this.selectedRoles,
      this.nameFilter
    ).then(() => {
      this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);
      this.currentPage = 1;

      const newIds = this.staffMembers
        .slice(0, this.pageSize)
        .map((staff) => staff.Id);

      this.trackedStaffIds = [...newIds]; // ✅ force reactivity

      console.log("Tracked Staff Ids:", this.trackedStaffIds);
      refreshApex(this.wiredShiftDataResult);
      // ⚠️ no need to call loadShiftData here — wire will trigger automatically
    });
  }

  loadShiftData() {
    console.log("this.trackedStaffIds >>", this.trackedStaffIds);
    console.log("this.weekStartDate >>", this.weekStartDate);
    console.log("this.weekEndDate >>", this.weekEndDate);

    if (
      !this.trackedStaffIds.length ||
      !this.weekStartDate ||
      !this.weekEndDate
    ) {
      console.warn(
        "Missing required data: staffIds, weekStartDate, or weekEndDate"
      );
      return;
    }

    this.isLoading = true;

    if (this.wiredShiftDataResult) {
      refreshApex(this.wiredShiftDataResult).finally(() => {
        this.isLoading = false;
      });
    } else {
      this.isLoading = false;
    }
  }

  fetchHolidayList(state) {
    console.log("state >>", state);
    holidayList({ state: state })
      .then((response) => {
        this.holidayList = response;
        console.log("Holiday list:", JSON.stringify(this.holidayList));
        this.initializeWeekDays();
      })
      .catch((error) => {
        console.error("Error fetching holiday list:", error);
      });
  }

  /* initializeWeekDays() {
        const startDate = this.getStartOfWeek(this.currentDate);
        const todayStr = this.formatDate(new Date());
        this.weekDays = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(day.getDate() + i);
            const formattedDate = this.formatDate(day);
            console.log('formattedDate >>', formattedDate);
            const isToday = formattedDate === todayStr;
            const holidayObj = this.holidayList?.find(
                holiday => this.formatDate(new Date(holiday.Date__c)) === formattedDate
            );

            let style = 'width: 7%; height: 100%;';
            let tooltip = '';

            if (isToday) {
                style += 'background-color: #c2e1fa; font-weight: bold; border-radius: 4px; width: 7%;';
            } else if (holidayObj) {
                style += 'background-color: pink; border-radius: 4px; width: 7%;';
                tooltip = holidayObj.Holiday_Name__c || '';
            }

            this.weekDays.push({
                date: formattedDate,
                dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
                formatted: day.toLocaleDateString('en-US', { day: 'numeric' }),
                style: style,
                tooltip: tooltip
            });
        }

        console.log('this.weekDays >>', this.weekDays);
    }*/

  @track firstDateOfWeek;
  @track lastDateOfWeek;

  formatDate1(date) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }); // e.g., "03 Jul 2025"
  }

  formatDateForInput(date) {
    return date.toISOString().split("T")[0];
  }

  initializeWeekDays() {
    const startDate = this.getStartOfWeek(this.currentDate); // First day of the week
    const endDate = new Date(startDate); // Last day = start + 6 days
    endDate.setDate(endDate.getDate() + 6);

    // Store formatted for display
    this.firstDateFormatted = this.formatDate1(startDate);
    this.lastDateFormatted = this.formatDate1(endDate);

    // Store formatted for input[type="date"]
    this.weekStartDate = this.formatDateForInput(startDate);
    this.weekEndDate = this.formatDateForInput(endDate);

    const todayStr = this.formatDate(new Date());
    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const formattedDate = this.formatDate(day);
      console.log("formattedDate >>", formattedDate);

      const isToday = formattedDate === todayStr;
      const holidayObj = this.holidayList?.find(
        (holiday) =>
          this.formatDate(new Date(holiday.Date__c)) === formattedDate
      );

      let style = "width: 7%; height: 100%;";
      let tooltip = "";

      if (isToday) {
        style +=
          "background-color: #c2e1fa; font-weight: bold; border-radius: 4px; width: 7%;";
      } else if (holidayObj) {
        style += "background-color: pink; border-radius: 4px; width: 7%;";
        tooltip = holidayObj.Holiday_Name__c || "";
      }

      this.weekDays.push({
        date: formattedDate,
        dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
        formatted: day.toLocaleDateString("en-US", { day: "numeric" }),
        style: style,
        tooltip: tooltip
      });
    }

    console.log("this.firstDateOfWeek >>", this.firstDateOfWeek);
    console.log("this.lastDateOfWeek >>", this.lastDateOfWeek);
    console.log("this.weekDays >>", this.weekDays);
  }

  handleGetlocation() {
    this.hideLocation = true;
    this.showLocation = false;
    getJSONdata({
      shiftid: this.shiftID,
      shiftstatus: this.Status,
      sdate: this.Sdate
    })
      .then((result) => {
        this.jsonData = JSON.parse(result);
        //console.log("JSON Data : " + JSON.stringify(this.jsonData));
        this.isShowMap = true;
        this.setLatitudeLongitudeData();
      })
      .catch((error) => {
        this.isShowMap = false;
        console.error("Error loading JSON:", error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: "Geolocation information is not available.",
            variant: "Error"
          })
        );
      });
  }

  setLatitudeLongitudeData() {
    // Ensure the DOM is rendered before accessing it
    setTimeout(() => {
      const mapContainer = this.template.querySelector(".map-container");
      // Check if the mapContainer exists
      if (!mapContainer) {
        console.error("Map container not found");
        return; // Exit the function if the container is not found
      }
      if (this.map) {
        this.map.off(); // removes all listeners
        this.map.remove(); // completely destroys the map
        this.map = null;
      }
      // Initialize the Leaflet map if not already done
      if (!this.map) {
        this.map = L.map(mapContainer).setView(
          [this.jsonData[0].coords.latitude, this.jsonData[0].coords.longitude],
          20
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(this.map);
      }
      // Add markers to the map
      this.jsonData.forEach((item) => {
        const lat = item.coords.latitude;
        const lng = item.coords.longitude;
        L.marker([lat, lng])
          .addTo(this.map)
          .bindPopup(`Location: ${lat}, ${lng}`);
      });
      // Draw the polyline between coordinates
      const polylineCoordinates = this.jsonData.map((item) => [
        item.coords.latitude,
        item.coords.longitude
      ]);

      // Check if a polyline already exists, and remove it
      if (this.polyline) {
        this.map.removeLayer(this.polyline);
      }

      this.polyline = L.polyline(polylineCoordinates, {
        color: "blue",
        weight: 4,
        opacity: 0.6
      }).addTo(this.map);
    }, 1000); // Use setTimeout to ensure the DOM is rendered
  }

  hideHandleLocation() {
    this.hideLocation = false;
    this.isShowMap = false;
    this.mapMarkers = [];
    this.showLocation = true;
  }

  getStartOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  formatTime(milliseconds) {
    if (typeof milliseconds !== "number") return "";
    const date = new Date(milliseconds);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hr = hours % 12 || 12;
    const min = minutes.toString().padStart(2, "0");
    return `${hr}:${min} ${ampm}`;
  }

  generateMockData() {
    console.log("Generating mock data...");

    this.staffMembers = [];
    const staffMap = new Map();
    console.log("generateMockData >>", JSON.stringify(this.generatedShiftMap));

    // 1. Collect all shifts into staffMap
    if (this.generatedShiftMap) {
      Object.entries(this.generatedShiftMap).forEach(([date, shifts]) => {
        shifts.forEach((shift) => {
          const staffId = shift.Staff__c;
          const staffName = shift.Staff__r?.Display_Nickname__c || "Unknown";

          if (!staffMap.has(staffId)) {
            staffMap.set(staffId, {
              staffId,
              staffName,
              nameToDisplay: staffName,
              allShifts: [],
              shifts: [],
              totalDuration: 0,
              totalMileage: 0,
              totalExpense: 0,
              totalSleepoverHours: 0,
              varianceCount: 0,
              mismatchCount: 0,
              hasVariances: false,
              hasMismatch: false,
              hasShiftForAnyDay: false,
              totalMileageAmount: 0,
              totalMileageOthers: 0
            });
          }

          staffMap.get(staffId).allShifts.push(shift);
        });
      });
    }

    // 2. Ensure allStaff is defined
    if (!Array.isArray(this.allStaff)) {
      console.warn(
        "this.allStaff is undefined or not an array. Initializing as empty array."
      );
      this.allStaff = [];
    }

    // 3. Build final staffMembers list
    this.allStaff.forEach((staffRecord) => {
      const staffId = staffRecord.Id;
      const staffName =
        staffRecord.Display_Nickname__c || staffRecord.Name || "Unknown";

      let staff = staffMap.get(staffId);
      if (!staff) {
        staff = {
          staffId,
          staffName,
          nameToDisplay: staffName,
          allShifts: [],
          shifts: [],
          totalDuration: 0,
          totalMileage: 0,
          totalExpense: 0,
          totalSleepoverHours: 0,
          varianceCount: 0,
          mismatchCount: 0,
          hasVariances: false,
          hasMismatch: false,
          hasShiftForAnyDay: false,
          totalMileageAmount: 0,
          totalMileageOthers: 0
        };
      }

      staff.shifts = [];
      let mismatchCount = 0;

      // 📌 Loop through each individual shift (NOT grouped by day)
      staff.allShifts.forEach((shift) => {
        const variance = shift.Variance_Wage__c || 0;
        const duration = shift.Duration__c || 0;
        const actual = shift.Actual_Duration__c || 0;
        const extended = shift.Extended_Duration__c || 0;
        const hasMismatch = actual !== duration + extended;
        if (hasMismatch) mismatchCount++;

        const clientNames = new Set();
        const serviceName = new Set();

        if (Array.isArray(shift.Services_and_Support_Plans__r)) {
          shift.Services_and_Support_Plans__r.forEach((service) => {
            const client = service.Client__r;
            if (client) {
              const fullName =
                `${client.First_Name__c || ""} ${client.Last_Name__c || ""}`.trim();
              clientNames.add(fullName);
            }

            const fundTracker = service.Funds_Tracker__r;
            if (fundTracker?.Name) {
              serviceName.add(fundTracker.Name);
            }
          });
        }

        const logIn = shift.Log_In_Date_Time__c;
        const logOut = shift.Log_Out_Date_Time__c;
        const totalLoggedHours =
          logIn && logOut ? this.calculateHoursDifference(logIn, logOut) : 0;

        staff.shifts.push({
          id: `${staffId}-${shift.Id}`,
          date: shift.Date__c,
          isForDay: true,
          startTime: shift.Start_time_Formula__c,
          endTime: shift.End_time_formula__c,
          shiftDuration: actual,
          actualDuration: duration,
          hours: duration,
          logInTimeFormatted: this.formatTime(logIn),
          logOutTimeFormatted: this.formatTime(logOut),
          totalLoggedHours,
          formattedLoggedHours: this.formatHoursToHrMin(totalLoggedHours),
          clientNames: Array.from(clientNames),
          serviceNames: Array.from(serviceName)
        });
      });

      staff.hasShiftForAnyDay = staff.shifts.length > 0;
      staff.totalDuration = staff.allShifts.reduce(
        (sum, s) => sum + (s.Duration__c || 0),
        0
      );
      staff.totalMileage = staff.allShifts.reduce(
        (sum, s) => sum + (s.Mileage__c || 0),
        0
      );
      staff.totalExpense = staff.allShifts.reduce(
        (sum, s) => sum + (s.Expense__c || 0),
        0
      );
      staff.totalSleepoverHours = staff.allShifts.reduce(
        (sum, s) => sum + (s.Sleepover_Shift_Hours__c || 0),
        0
      );
      staff.varianceCount = staff.allShifts.reduce(
        (sum, s) => sum + (s.Variance_Wage__c || 0),
        0
      );
      staff.mismatchCount = mismatchCount;
      staff.hasMismatch = mismatchCount > 0;
      staff.totalvariance = parseFloat(
        staff.allShifts
          .reduce(
            (sum, s) => sum + (parseFloat(s.Extended_Duration__c) || 0),
            0
          )
          .toFixed(2)
      );

      // 🧾 Reimbursement Totals
      staff.allShifts.forEach((s) => {
        if (Array.isArray(s.Reimbursements__r)) {
          s.Reimbursements__r.forEach((reimbursement) => {
            // Ensure all values are treated as numbers
            const mileageAmount = parseFloat(
              reimbursement.Mileage_Amount__c || 0
            );
            const mileageOthers = parseFloat(
              reimbursement.Mileage_Others__c || 0
            );

            staff.totalMileageAmount =
              parseFloat(staff.totalMileageAmount || 0) + mileageAmount;
            staff.totalMileageOthers =
              parseFloat(staff.totalMileageOthers || 0) + mileageOthers;
          });
        }
      });

      // ✅ Safely round to 2 decimals
      staff.totalMileageAmount = parseFloat(
        (staff.totalMileageAmount || 0).toFixed(2)
      );
      staff.totalMileageOthers = parseFloat(
        (staff.totalMileageOthers || 0).toFixed(2)
      );

      this.staffMembers.push(staff);
    });

    console.log(
      "Final staffMembers data:",
      JSON.stringify(this.staffMembers, null, 2)
    );
  }

  formatHoursToHrMin = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours} Hr: ${minutes} Mins`;
  };

  calculateHoursDifference(start, end) {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime;
    return diffMs > 0 ? (diffMs / (1000 * 60 * 60)).toFixed(2) : 0;
  }

  formatTime(dateTimeStr) {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  getCellClass(hasVariance, approved) {
    return `slds-p-around_xx-small slds-m-bottom_xx-small
            ${hasVariance ? "slds-theme_warning" : "slds-theme_info"} 
            ${!approved ? "slds-theme_alert-texture" : ""}`;
  }

  get weekRange() {
    if (this.weekDays.length === 0) return "";
    return `${this.weekDays[0].formatted} - ${this.weekDays[6].formatted}`;
  }

  get currentMonthYear() {
    return this.currentDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
  }

  formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  handlePrevWeek() {
    // Move currentDate back 7 days
    this.currentDate.setDate(this.currentDate.getDate() - 7);

    // Find the start of the week (Monday)
    const dayOfWeek = this.currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Update week range
    this.weekStartDate = this.formatDate(startOfWeek);
    this.weekEndDate = this.formatDate(endOfWeek);

    // Update currentDate and datePickerString to reflect the same day-of-week in the new week
    this.currentDate = new Date(this.currentDate); // keep it at the same weekday
    this.datePickerString = this.formatDateToString(this.currentDate); // fix this line ✅

    console.log("Start of Week:", this.weekStartDate);
    console.log("End of Week:", this.weekEndDate);

    // Refresh UI
    this.loadShiftData();
    this.initializeWeekDays();
  }

  handleNextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);

    const dayOfWeek = this.currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    this.weekStartDate = this.formatDate(startOfWeek);
    this.weekEndDate = this.formatDate(endOfWeek);

    this.currentDate = new Date(startOfWeek);
    this.datePickerString = this.formatDateToString(this.currentDate);

    console.log("Start of Week:", this.weekStartDate);
    console.log("End of Week:", this.weekEndDate);

    this.loadShiftData();
    this.initializeWeekDays();
  }

  navigateToDay(event) {
    const selectedDateString = event.target.value; // e.g., "2025-05-23"
    const selectedDate = new Date(selectedDateString); // Convert to Date object

    this.currentDate = new Date(selectedDate); // Update currentDate to selected

    const dayOfWeek = this.currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    this.weekStartDate = this.formatDate(startOfWeek); // Ensure this uses the same format as your UI expects
    this.weekEndDate = this.formatDate(endOfWeek);

    this.currentDate = new Date(startOfWeek); // Align currentDate to Monday of selected week
    this.datePickerString = this.formatDateToString(this.currentDate);

    console.log("Week Start Date:", this.weekStartDate);
    console.log("Week End Date:", this.weekEndDate);

    this.loadShiftData(); // Refresh shift data for selected week
    this.initializeWeekDays(); // Update weekday rendering in UI if needed
  }

  handleRefresh() {
    this.showSpinner = true;
    this.fetchStaffList(
      this.orgId,
      this.facilityIdList,
      this.selectedRoles,
      this.nameFilter
    )
      .then(() => {
        this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);

        this.trackedStaffIds = this.staffMembers
          .slice(
            (this.currentPage - 1) * this.pageSize,
            this.currentPage * this.pageSize
          )
          .map((staff) => staff.Id);

        console.log("Tracked Staff Ids:", this.trackedStaffIds);
        this.loadShiftData();
      })
      .catch((error) => {
        onsole.error("Error fetching staff list:", error);
      })
      .finally(() => {
        this.showSpinner = false; // Hide spinner
      });
  }

  handlePrint() {
    window.print();
  }

  get totalPages() {
    return Math.ceil(this.staffMembers.length / this.pageSize);
  }

  get isFirstPage() {
    return this.currentPage === 1;
  }

  get isLastPage() {
    return this.currentPage === this.totalPages;
  }

  get paginatedStaff() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.staffMembers.slice(start, end);
  }

  get processedStaff() {
    console.log("🚀 Processing Staff Data...");
    return this.paginatedStaff.map((staff) => {
      console.log("👤 Staff Record:", JSON.stringify(staff, null, 2));

      const shiftRows = this.weekDays.map((day, index) => {
        console.log(`📅 Checking Day: ${day.date} (Index: ${index})`);

        const shift = (staff.shifts || []).find(
          (s) => s.date === day.date && s.isForDay
        );
        console.log("🔍 Matching Shift:", JSON.stringify(shift, null, 2));

        const row = {
          key: `${staff.id}-${day.date}`,
          hasShift: !!shift,
          hours: shift?.hours || "",
          cellClass: shift?.cellClass || ""
        };
        console.log("➡️ Shift Row Built:", JSON.stringify(row, null, 2));
        return row;
      });

      const processedStaff = {
        ...staff,
        shiftRows
      };
      console.log(
        "✅ Processed Staff:",
        JSON.stringify(processedStaff, null, 2)
      );
      return processedStaff;
    });
  }

  handleNext() {
    if (!this.isLastPage) {
      this.currentPage += 1;
      this.fetchStaffList(
        this.orgId,
        this.facilityIdList,
        this.selectedRoles,
        this.nameFilter
      )
        .then(() => {
          this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);

          this.trackedStaffIds = this.staffMembers
            .slice(
              (this.currentPage - 1) * this.pageSize,
              this.currentPage * this.pageSize
            )
            .map((staff) => staff.Id);

          console.log("Tracked Staff Ids:", this.trackedStaffIds);
          this.loadShiftData();
        })
        .catch((error) => {
          console.error("Error fetching staff list:", error);
        });
    }
  }

  handlePrev() {
    if (!this.isFirstPage) {
      this.currentPage -= 1;
      this.fetchStaffList(
        this.orgId,
        this.facilityIdList,
        this.selectedRoles,
        this.nameFilter
      )
        .then(() => {
          this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);

          this.trackedStaffIds = this.staffMembers
            .slice(
              (this.currentPage - 1) * this.pageSize,
              this.currentPage * this.pageSize
            )
            .map((staff) => staff.Id);

          console.log("Tracked Staff Ids:", this.trackedStaffIds);
          this.loadShiftData();
        })
        .catch((error) => {
          console.error("Error fetching staff list:", error);
        });
    }
  }

  firstPage() {
    this.fetchStaffList(
      this.orgId,
      this.facilityIdList,
      this.selectedRoles,
      this.nameFilter
    )
      .then(() => {
        this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);

        this.currentPage = 1;

        this.trackedStaffIds = this.staffMembers
          .slice(
            (this.currentPage - 1) * this.pageSize,
            this.currentPage * this.pageSize
          )
          .map((staff) => staff.Id);

        console.log("Navigated to First Page:", this.currentPage);
        console.log("Tracked Staff Ids:", this.trackedStaffIds);
        this.loadShiftData();
      })
      .catch((error) => {
        console.error("Error fetching staff list:", error);
      });
  }

  lastPage() {
    this.fetchStaffList(
      this.orgId,
      this.facilityIdList,
      this.selectedRoles,
      this.nameFilter
    )
      .then(() => {
        this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);

        this.currentPage = this.totalPages;

        this.trackedStaffIds = this.staffMembers
          .slice(
            (this.currentPage - 1) * this.pageSize,
            this.currentPage * this.pageSize
          )
          .map((staff) => staff.Id);

        console.log("Navigated to Last Page:", this.currentPage);
        console.log("Tracked Staff Ids:", this.trackedStaffIds);

        this.loadShiftData();
      })
      .catch((error) => {
        console.error("Error fetching staff list:", error);
      });
  }

  handleRecordsPerPage(event) {
    this.pageSize = parseInt(event.target.value, 10);
    console.log("Current page size is:", this.pageSize);

    this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);
    this.currentPage = 1;

    this.trackedStaffIds = this.staffMembers
      .slice(0, this.pageSize)
      .map((staff) => staff.Id);

    console.log("Tracked Staff Ids:", this.trackedStaffIds);
    this.fetchStaffList(
      this.orgId,
      this.facilityIdList,
      this.selectedRoles,
      this.nameFilter
    )
      .then(() => {
        this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);

        this.currentPage = this.totalPages;

        this.trackedStaffIds = this.staffMembers
          .slice(
            (this.currentPage - 1) * this.pageSize,
            this.currentPage * this.pageSize
          )
          .map((staff) => staff.Id);

        console.log("Navigated to Last Page:", this.currentPage);
        console.log("Tracked Staff Ids:", this.trackedStaffIds);

        this.loadShiftData();
      })
      .catch((error) => {
        console.error("Error fetching staff list:", error);
      });

    this.paginateStaff();
  }

  navigateToToday() {
    const today = new Date(); // Always reset to actual current date
    this.currentDate = new Date(today); // Store it as currentDate

    const dayOfWeek = this.currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    this.weekStartDate = this.formatDate(startOfWeek);
    this.weekEndDate = this.formatDate(endOfWeek);

    this.currentDate = new Date(startOfWeek); // Move currentDate to Monday of this week
    this.datePickerString = this.formatDateToString(this.currentDate);

    console.log("Start of Week:", this.weekStartDate);
    console.log("End of Week:", this.weekEndDate);

    this.loadShiftData();
    this.initializeWeekDays();
  }

  getFormattedTime(ms) {
    const validMs = ms != null ? ms : 0; // Handles null, undefined, or 0
    const date = new Date(validMs);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  getDurationInHours(startTimeStr, endTimeStr, breakInMinutes = 0) {
    console.log("startTimeStr >>", startTimeStr);
    console.log("endTimeStr >>", endTimeStr); // Fix here (was logging start twice)

    const parseTime = (timeStr, label) => {
      console.log(`${label} raw input:`, timeStr);

      if (!timeStr || typeof timeStr !== "string") {
        console.warn(`${label} is invalid or not a string.`);
        return null;
      }

      timeStr = timeStr.trim().toUpperCase();
      console.log(`${label} trimmed and uppercased:`, timeStr);

      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
      if (!match) {
        console.error(`Invalid time format for ${label}:`, timeStr);
        return null;
      }

      let [_, hourStr, minuteStr, modifier] = match;
      let hours = parseInt(hourStr, 10);
      let minutes = parseInt(minuteStr, 10);

      console.log(
        `${label} parsed => hours: ${hours}, minutes: ${minutes}, modifier: ${modifier}`
      );

      if (modifier === "PM" && hours !== 12) {
        hours += 12;
      } else if (modifier === "AM" && hours === 12) {
        hours = 0;
      }

      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      console.log(`${label} Date object:`, date);

      return date;
    };

    const start = parseTime(startTimeStr, "Start Time");
    const end = parseTime(endTimeStr, "End Time");

    if (!start || !end) {
      console.error("One or both parsed times are invalid. Returning 0.");
      return 0;
    }

    let durationMs = end - start;
    console.log("Initial duration (ms):", durationMs);

    // Handle overnight shift
    if (durationMs < 0) {
      console.log("Overnight shift detected. Adding 24 hours.");
      durationMs += 24 * 60 * 60 * 1000;
    }

    // Handle full 24-hour shift
    if (
      durationMs === 0 &&
      startTimeStr.trim().toUpperCase() === "12:00 AM" &&
      endTimeStr.trim().toUpperCase() === "12:00 AM"
    ) {
      console.log("Full 24-hour shift detected.");
      return 24.0;
    }

    // Convert milliseconds to hours
    let hours = durationMs / (1000 * 60 * 60);

    // Subtract break time (minutes → hours)
    const breakInHours = (parseFloat(breakInMinutes) || 0) / 60;
    console.log(
      `Subtracting break of ${breakInMinutes} mins (${breakInHours.toFixed(2)} hrs)`
    );

    hours -= breakInHours;

    // Prevent negative values
    hours = Math.max(0, hours);

    console.log("Final duration in hours:", hours.toFixed(2));

    return parseFloat(hours.toFixed(2));
  }

  formatDateToDDMMYYYY(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  handleCheckClick(event) {
    console.log("Check click handler triggered");
    this.currentViewFlag = "check";

    const staffId = event.currentTarget.dataset.staffId;

    if (
      this.editflag === false &&
      this.submissionFlag === false &&
      this.refresh === false
    ) {
      const staffName = event.currentTarget.dataset.staffName;
      this.StaffName1 = staffName;
    }

    console.log("staffId >>", staffId);
    this.StaffId = staffId;
    console.log("this.StaffId  >>", this.StaffId);

    const start = new Date(this.weekStartDate);
    const end = new Date(this.weekEndDate);
    console.log("Fetching matched shifts from", start, "to", end);
    getMismatchedShifts({ staffId: staffId, weekStart: start, weekEnd: end })
    .then((shifts) => {
      const filteredShifts = (shifts || [])
        .filter((shift) => {
          const actual = parseFloat(shift.Actual_Duration__c) || 0;
          const duration = parseFloat(shift.Duration__c) || 0;
          const extended = parseFloat(shift.Extended_Duration__c) || 0;
          return duration === actual + extended;
        })
        .map((shift) => {
          let totalMileageOthers = 0;
          let totalMileageAmount = 0;

          if (shift.Reimbursements__r) {
            shift.Reimbursements__r.forEach((reim) => {
              totalMileageOthers += parseFloat(reim.Mileage_Others__c) || 0;
              totalMileageAmount += parseFloat(reim.Mileage_Amount__c) || 0;
            });
          }

          const durationRaw = shift.Actual_Duration__c;
          const durationCalculated = isNaN(durationRaw) ? 0 : durationRaw;
          const isApproved = shift.Approval_Status__c === "Approved";

          // 👇 Precompute icon fields
          const iconName = isApproved ? "thumb_up" : "check_circle";
          const iconClass = isApproved ? "approved-icon" : "approve-icon";
          const iconTitle = isApproved ? "Approved" : "Approve";
          const iconUpdateKey = `${shift.Id}-${isApproved ? "approved" : "pending"}-${Date.now()}`;
          const signatureIconClass = shift.Client_Signature__c
            ? "material-icons signature-icon-blue"
            : "material-icons signature-icon-red";
          const isClickable = !isApproved;
          const iconStyle = isClickable ? "" : "pointer-events: none; opacity: 0.5;";
          const signatureTitle = "Signature";
          const isSignatureClickable = !!shift.Client_Signature__c;

          return {
            ...shift,
            formattedStart: shift.Start_time_Formula__c,
            formattedEnd: shift.End_time_formula__c,
            shiftType:
              shift.Type_of_shift__c === "Sleepover Shift"
                ? "Sleepover"
                : shift.Type_of_shift__c,
            formattedLogin: shift.Login_Time_Formula__c,
            formattedLogout: shift.Logout_Time_Formula__c,
            duration: durationCalculated,
            shiftDate: this.formatDateToDDMMYYYY(shift.Date__c),
            serviceTypeShort:
              shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c?.substring(0, 30) + "..." || "--",
            serviceType:
              shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c || "--",
            facilityName: shift.Facility__c || "--",
            clientSignature: shift.Client_Signature__c,
            clientName: shift.Services_and_Support_Plans__r?.[0]?.Client__r
              ? `${shift.Services_and_Support_Plans__r[0].Client__r.First_Name__c || ""} ${shift.Services_and_Support_Plans__r[0].Client__r.Last_Name__c || ""}`.trim()
              : "--",
            servicesAndPlans:
              shift.Services_and_Support_Plans__r?.map((plan) => ({
                id: plan.Id,
                name: plan.Name,
                clientName:
                  `${plan.Client__r?.First_Name__c || ""} ${plan.Client__r?.Last_Name__c || ""}`.trim() ||
                  "-"
              })) || [],
            mileageOthersTotal: totalMileageOthers.toFixed(2),
            mileageAmountTotal: totalMileageAmount.toFixed(2),
            isApprovedTemplateVisible: isApproved,
            iconName,
            iconClass,
            iconTitle,
            iconUpdateKey,
            signatureIconClass,
            signatureTitle,
            isSignatureClickable,
            iconStyle,
            isClickable,
            extendedDuration: (() => {
              const parsed = parseFloat((shift.Extended_Duration__c || 0).toFixed(2));
              return isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(2));
            })()
          };
        });

      this.selectedStaffShifts = filteredShifts;
      this.selectedShiftIds = filteredShifts.map((shift) => shift.Id);

      this.totalShiftDuration = filteredShifts.reduce(
        (sum, shift) => sum + (parseFloat(shift.duration) || 0),
        0
      );
      this.totalKms = filteredShifts.reduce(
        (sum, shift) => sum + (parseFloat(shift.mileageOthersTotal) || 0),
        0
      );
      this.totalexpenses = filteredShifts.reduce(
        (sum, shift) => sum + (parseFloat(shift.mileageAmountTotal) || 0),
        0
      );
      this.sleepoverDuration = filteredShifts.reduce(
        (sum, shift) => sum + (parseFloat(shift.Long_Sleepover_Duartion__c) || 0),
        0
      );
      this.totalApprovedLoggedDuration = filteredShifts.reduce(
        (sum, shift) =>
          shift.Approval_Status__c === "Approved"
            ? sum + (parseFloat(shift.duration) || 0)
            : sum,
        0
      );

      // 👇 Add your check here
      this.otherThanNdis = filteredShifts.some(
        (shift) => shift?.Staff__r?.Facility__r?.Type_of_Service__c !== "NDIS"
      );

      console.log("Filtered shifts count:", filteredShifts.length);
      console.log("otherThanNdis:", this.otherThanNdis);

      this.shiftInformation = true;
      this.timeSheet = false;
      this.submissionFlag = false;
      this.refresh = false;
    })
    .catch((error) => {
      console.error("Error fetching mismatched shifts:", error);
    });
  }

  handleMismatchClick(event) {
    console.log("Mismatch click handler triggered");

    this.currentViewFlag = "mismatch";
    this.ismissmatchedshifts = true;

    const staffId = event.currentTarget.dataset.staffId;
    this.StaffId = staffId;

    console.log("editflag >>", this.editflag);
    console.log("submissionFlag >>", this.submissionFlag);
    if (
      this.editflag === false &&
      this.submissionFlag === false &&
      this.refresh === false
    ) {
      const staffName = event.currentTarget.dataset.staffName;
      this.StaffName1 = staffName;
    }

    console.log("Selected Staff ID:", staffId);
    console.log("Selected Staff Name:", this.StaffName1);

    const start = new Date(this.weekStartDate);
    const end = new Date(this.weekEndDate);
    console.log("Fetching mismatched shifts from", start, "to", end);

    getMismatchedShifts({ staffId: staffId, weekStart: start, weekEnd: end })
      .then((shifts) => {
        console.log("Raw shifts retrieved:", shifts);

        const mismatchedShifts = (shifts || [])
          .filter((shift) => {
            const actual = parseFloat(shift.Actual_Duration__c) || 0;
            const duration = parseFloat(shift.Duration__c) || 0;
            const extended = parseFloat(shift.Extended_Duration__c) || 0;
            const isMismatch = duration !== actual + extended;
            console.log(
              `Shift ID: ${shift.Id} | Duration: ${duration}, Actual + Extended: ${actual + extended} | Mismatch: ${isMismatch}`
            );
            return isMismatch;
          })
          .map((shift) => {
            let totalMileageOthers = 0;
            let totalMileageAmount = 0;

            if (shift.Reimbursements__r) {
              shift.Reimbursements__r.forEach((reim) => {
                totalMileageOthers += parseFloat(reim.Mileage_Others__c) || 0;
                totalMileageAmount += parseFloat(reim.Mileage_Amount__c) || 0;
              });
            }

            const breakfield = shift.Break__c;
            const signInTime = this.getFormattedTime(shift.Log_In_Date_Time__c);
            const signOutTime = this.getFormattedTime(
              shift.Log_Out_Date_Time__c
            );
            //const durationRaw = this.getDurationInHours(signInTime, signOutTime, breakfield);
            const durationRaw = shift.Actual_Duration__c;
            const durationCalculated = isNaN(durationRaw) ? 0 : durationRaw;

            const isApproved = shift.Approval_Status__c === "Approved";
            const iconName = isApproved ? "thumb_up" : "check_circle";
            const iconClass = isApproved ? "approved-icon" : "approve-icon";
            const iconTitle = isApproved ? "Approved" : "Approve";
            const iconUpdateKey = `${shift.Id}-${isApproved ? "approved" : "pending"}-${Date.now()}`;
            const isClickable = !isApproved; // 👈 add this line
            const signatureIconClass = shift.Client_Signature__c
              ? "material-icons overview-icon signature-icon-blue"
              : "material-icons overview-icon signature-icon-red";
            const signatureTitle = shift.Client_Signature__c
              ? "Signature"
              : "Signature";
            const isSignatureClickable = !!shift.Client_Signature__c;

            return {
              ...shift,
              isApprovedTemplateVisible: isApproved,
              iconName,
              iconClass,
              iconTitle,
              iconUpdateKey, // 👈 Add this key for reactivity
              isClickable,
              signatureIconClass,
              signatureTitle,
              isSignatureClickable,
              shiftType:
                (shift.Type_of_shift__c || "").trim().toLowerCase() ===
                "sleepover shift"
                  ? "Sleepover"
                  : shift.Type_of_shift__c || "--",
              formattedStart: shift.Start_time_Formula__c || "--",
              formattedLogin: shift.Login_Time_Formula__c || "--",
              formattedEnd: shift.End_time_formula__c || "--",
              formattedLogout: shift.Logout_Time_Formula__c || "--",
              duration: durationCalculated,
              shiftDate: this.formatDateToDDMMYYYY(shift.Date__c),
              serviceTypeShort:
                shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c?.substring(
                  0,
                  15
                ) + "..." || "--",
              serviceType:
                shift.Services_and_Support_Plans__r?.[0]
                  ?.Service_Type_Name__c || "--",
              clientSignature: shift.Client_Signature__c,
              facilityName: shift.Facility__c || "--",
              clientName: shift.Services_and_Support_Plans__r?.[0]?.Client__r
                ? `${shift.Services_and_Support_Plans__r[0].Client__r.First_Name__c || ""} ${shift.Services_and_Support_Plans__r[0].Client__r.Last_Name__c || ""}`.trim()
                : "--",
              servicesAndPlans:
                shift.Services_and_Support_Plans__r?.map((plan) => ({
                  id: plan.Id,
                  name: plan.Name,
                  clientName:
                    `${plan.Client__r?.First_Name__c || ""} ${plan.Client__r?.Last_Name__c || ""}`.trim() ||
                    "-"
                })) || [],
              clientNames: (shift.Services_and_Support_Plans__r || []).map(
                (s) => {
                  const client = s.Client__r;
                  const fullName =
                    `${client?.First_Name__c || ""} ${client?.Last_Name__c || ""}`.trim();
                  return fullName || "-";
                }
              ),
              mileageOthersTotal: totalMileageOthers.toFixed(2),
              mileageAmountTotal: totalMileageAmount.toFixed(2),
              extendedDuration: (() => {
                const value = parseFloat(shift.Extended_Duration__c).toFixed(2);
                const safe = isNaN(value) ? 0 : Math.max(0, value);
                return parseFloat(safe.toFixed(2));
              })()
            };
          });

        console.log("mismatchedShifts >>", JSON.stringify(mismatchedShifts));

        this.selectedStaffShifts = mismatchedShifts;
        this.selectedShiftIds = mismatchedShifts.map((shift) => shift.Id);
        this.totalShiftDuration = mismatchedShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.duration) || 0),
          0
        );
        this.totalKms = mismatchedShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageOthersTotal) || 0),
          0
        );
        this.totalexpenses = mismatchedShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageAmountTotal) || 0),
          0
        );
        this.sleepoverDuration = mismatchedShifts.reduce(
          (sum, shift) =>
            sum + (parseFloat(shift.Long_Sleepover_Duartion__c) || 0),
          0
        );
        this.totalApprovedLoggedDuration = mismatchedShifts.reduce(
          (sum, shift) => {
            return shift.Approval_Status__c === "Approved"
              ? sum + (parseFloat(shift.duration) || 0)
              : sum;
          },
          0
        );

        this.otherThanNdis = mismatchedShifts.some(
          (shift) => shift?.Staff__r?.Facility__r?.Type_of_Service__c !== "NDIS"
        );

        console.log("Mismatched Shifts Processed:", mismatchedShifts.length);
        console.log("Total Shift Duration:", this.totalShiftDuration);
        console.log("Total KMs:", this.totalKms);
        console.log("Total Expenses:", this.totalexpenses);
        console.log("Total Sleepover Duration:", this.sleepoverDuration);
        console.log("Non NDIS:", this.otherThanNdis);

        this.shiftInformation = true;
        this.timeSheet = false;
        this.submissionFlag = false;
        this.refresh = false;
      })
      .catch((error) => {
        console.error("Error fetching mismatched shifts:", error);
      });
  }

  handleCheckboxChange(event) {
    console.log("Checkbox change handler triggered");
    this.currentViewFlag = "checkbox";

    this.isChecked = event.target.checked;
    console.log("Checkbox checked state:", this.isChecked);

    const staffId = this.StaffId;
    const start = new Date(this.weekStartDate);
    const end = new Date(this.weekEndDate);

    console.log("Current StaffId:", staffId);
    console.log("Week Start Date:", start);
    console.log("Week End Date:", end);

    getMismatchedShifts({ staffId: staffId, weekStart: start, weekEnd: end })
      .then((shifts) => {
        console.log("Shifts retrieved:", shifts);

        let approvedDuration = 0;

        const filteredShifts = (shifts || [])
          .filter((shift) => {
            if (this.isChecked) {
              console.log(
                `Including shift ${shift.Id} because checkbox is checked (show all)`
              );
              return true;
            } else {
              const actual = parseFloat(shift.Actual_Duration__c) || 0;
              const duration = parseFloat(shift.Duration__c) || 0;
              const extended = parseFloat(shift.Extended_Duration__c) || 0;
              const isMismatch = duration !== actual + extended;
              console.log(
                `Shift ${shift.Id} | Duration: ${duration}, Actual + Extended: ${actual + extended}, Mismatch: ${isMismatch}`
              );
              return isMismatch;
            }
          })
          .map((shift) => {
            let totalMileageOthers = 0;
            let totalMileageAmount = 0;

            if (shift.Reimbursements__r) {
              shift.Reimbursements__r.forEach((reim) => {
                totalMileageOthers += parseFloat(reim.Mileage_Others__c) || 0;
                totalMileageAmount += parseFloat(reim.Mileage_Amount__c) || 0;
              });
            }

            const breakfield = shift.Break__c;
            const signInTime = this.getFormattedTime(shift.Log_In_Date_Time__c);
            const signOutTime = this.getFormattedTime(shift.Log_Out_Date_Time__c);
            const durationRaw = shift.Actual_Duration__c;
            const durationCalculated = isNaN(durationRaw) ? 0 : durationRaw;

            const isApproved = shift.Approval_Status__c === "Approved";
            if (isApproved) {
              approvedDuration += durationCalculated;
            }

            const iconName = isApproved ? "thumb_up" : "check_circle";
            const iconClass = isApproved ? "approved-icon" : "approve-icon";
            const iconTitle = isApproved ? "Approved" : "Approve";
            const iconUpdateKey = `${shift.Id}-${
              isApproved ? "approved" : "pending"
            }-${Date.now()}`;
            const isClickable = !isApproved;
            const signatureIconClass = shift.Client_Signature__c
              ? "material-icons overview-icon signature-icon-blue"
              : "material-icons overview-icon signature-icon-red";
            const signatureTitle = shift.Client_Signature__c
              ? "Signature"
              : "Signature";
            const isSignatureClickable = !!shift.Client_Signature__c;

            console.log(
              `Shift ${shift.Id} | Calculated Duration: ${durationCalculated} | Mileage Others: ${totalMileageOthers}, Mileage Amount: ${totalMileageAmount}`
            );

            return {
              ...shift,
              isApprovedTemplateVisible: isApproved,
              iconName,
              iconClass,
              iconTitle,
              iconUpdateKey,
              isClickable,
              signatureIconClass,
              signatureTitle,
              isSignatureClickable,
              formattedStart: shift.Start_time_Formula__c || "--",
              formattedLogin: shift.Login_Time_Formula__c || "--",
              formattedEnd: shift.End_time_formula__c || "--",
              formattedLogout: shift.Logout_Time_Formula__c || "--",
              shiftType:
                (shift.Type_of_shift__c || "").trim().toLowerCase() ===
                "sleepover shift"
                  ? "Sleepover"
                  : shift.Type_of_shift__c || "--",
              shiftDate: this.formatDateToDDMMYYYY(shift.Date__c),
              duration: durationCalculated,
              serviceTypeShort:
                shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c?.substring(
                  0,
                  15
                ) + "..." || "--",
              serviceType:
                shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c ||
                "--",
              facilityName: shift.Facility__c || "--",
              clientSignature: shift.Client_Signature__c,
              clientName: shift.Services_and_Support_Plans__r?.[0]?.Client__r
                ? `${shift.Services_and_Support_Plans__r[0].Client__r.First_Name__c || ""} ${
                    shift.Services_and_Support_Plans__r[0].Client__r.Last_Name__c ||
                    ""
                  }`.trim()
                : "--",
              servicesAndPlans:
                shift.Services_and_Support_Plans__r?.map((plan) => ({
                  id: plan.Id,
                  name: plan.Name,
                  clientName:
                    `${plan.Client__r?.First_Name__c || ""} ${
                      plan.Client__r?.Last_Name__c || ""
                    }`.trim() || "-",
                })) || [],
              clientNames: (shift.Services_and_Support_Plans__r || []).map((s) => {
                const client = s.Client__r;
                return client
                  ? `${client.First_Name__c} ${client.Last_Name__c}`
                  : "N/A";
              }),
              mileageOthersTotal: totalMileageOthers.toFixed(2),
              mileageAmountTotal: totalMileageAmount.toFixed(2),
              extendedDuration: (() => {
                const val = parseFloat(shift.Extended_Duration__c).toFixed(2);
                return isNaN(val) || val < 0 ? 0 : val;
              })(),
            };
          });

        console.log("filteredShifts >>", JSON.stringify(filteredShifts));

        this.selectedStaffShifts = filteredShifts;
        this.selectedShiftIds = filteredShifts.map((shift) => shift.Id);
        this.totalShiftDuration = filteredShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.duration) || 0),
          0
        );
        this.totalKms = filteredShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageOthersTotal) || 0),
          0
        );
        this.totalexpenses = filteredShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageAmountTotal) || 0),
          0
        );
        this.sleepoverDuration = filteredShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.Long_Sleepover_Duartion__c) || 0),
          0
        );
        this.totalApprovedLoggedDuration = approvedDuration;

        // 👇 Add otherThanNdis flag here
        this.otherThanNdis = filteredShifts.some(
          (shift) => shift?.Staff__r?.Facility__r?.Type_of_Service__c !== "NDIS"
        );

        console.log("Total Shift Duration:", this.totalShiftDuration);
        console.log("Total KMs:", this.totalKms);
        console.log("Total Expenses:", this.totalexpenses);
        console.log("Total Sleepover Duration:", this.sleepoverDuration);
        console.log("Approved Duration:", this.totalApprovedLoggedDuration);
        console.log("otherThanNdis:", this.otherThanNdis);

        this.shiftInformation = true;
        this.timeSheet = false;
        this.submissionFlag = false;
        this.refresh = false;
      })
      .catch((error) => {
        console.error("Error fetching shifts in checkbox handler:", error);
      });
  }

  loadShiftData1() {
    console.log("this.trackedStaffIds >>", this.trackedStaffIds);
    console.log("this.weekStartDate >>", this.weekStartDate);
    console.log("this.weekEndDate >>", this.weekEndDate);
    if (
      !this.trackedStaffIds.length ||
      !this.weekStartDate ||
      !this.weekEndDate
    ) {
      console.warn(
        "Missing required data: staffIds, weekStartDate, or weekEndDate"
      );
      return;
    }

    this.isLoading = true;
    this.error = null;

    getStaffShiftData({
      staffIds: this.trackedStaffIds,
      weekStartDate: this.weekStartDate,
      weekEndDate: this.weekEndDate
    })
      .then((result) => {
        this.staffShiftData = result;
        console.log("Shift Data from Apex:", JSON.stringify(result));

        // Safe check for one sample shift date
        if (result.length > 0 && result[0].shifts.length > 0) {
          console.log("First Shift Date:", result[0].shifts[0].Date__c);
        }

        this.generatedShiftMap = {};

        result.forEach((staffData) => {
          staffData.shifts.forEach((shift) => {
            const date = shift.Date__c;
            if (!this.generatedShiftMap[date]) {
              this.generatedShiftMap[date] = [];
            }
            this.generatedShiftMap[date].push({
              ...shift,
              cellClass: this.getCellClass(shift.hasVariance, shift.approved)
            });
          });
        });
        console.log("this.generatedShiftMap >>", this.generatedShiftMap);
        this.generateMockData();
        this.shiftInformation = false;
        this.timeSheet = true;
        this.ismissmatchedshifts = false;
        this.isChecked = false;
      })
      .catch((error) => {
        this.error = error;
        console.error("Error loading shift data:", error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  handleBackClick(event) {
    // this.initializeFacilityAndOrgDetails();
    this.loadShiftData1();
    /* this.shiftInformation = false;
        this.timeSheet = true;
        this.ismissmatchedshifts = false;
        this.isChecked = false; */
    this.fetchStaffList(
      this.orgId,
      this.facilityIdList,
      this.selectedRoles,
      this.nameFilter
    )
      .then(() => {
        this.totalPages = Math.ceil(this.staffMembers.length / this.pageSize);

        this.trackedStaffIds = this.staffMembers
          .slice(
            (this.currentPage - 1) * this.pageSize,
            this.currentPage * this.pageSize
          )
          .map((staff) => staff.Id);

        console.log("Tracked Staff Ids:", this.trackedStaffIds);
        this.loadShiftData();
      })
      .catch((error) => {
        onsole.error("Error fetching staff list:", error);
      })
      .finally(() => {
        this.showSpinner = false; // Hide spinner
      });
  }

  handleApproveClick(event) {
    const shiftId = event.currentTarget.dataset.id;
    console.log("Edit clicked for Shift ID:", shiftId);
    console.log("loggedhours >>", event.currentTarget.dataset.loggedhours);
    let totalHours = event.currentTarget.dataset.loggedhours;
    console.log("loggedhours >>", totalHours);
    let totalShiftIdlist = new Set();
    const allocarray = event.currentTarget.dataset.id.split(",");
    for (var s = 0; s < allocarray.length; s++) {
      totalShiftIdlist.add(allocarray[s]);
    }
    console.log("shift id list  " + Array.from(totalShiftIdlist));

    if (totalHours == "0 Hr:0 Mins") {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Submission Rejected",
          message: "Please provide total hours",
          variant: "Error"
        })
      );
    } else {
      this.submissionFlag = true;
      this.confirmationData = { totalShiftIdlist, totalHours };
    }
  }

  handleEditClick(event) {
    this.showSpinner = true;
    const shiftId = event.currentTarget.dataset.id;
    console.log("Edit clicked for Shift ID:", shiftId);
    this.shiftID = shiftId;
    this.shiftInformation = false;
    this.editflag = true;
    this.fieldErrorMap = {};

    console.log("handleeditClose in TimeSheet");

    getAddShiftDataById({ shiftId: this.shiftID })
      .then((result) => {
        const data = result.shiftwithstaffdata;

        this.isLongMorningShift = data.Is_long_Morning__c;
        this.isLongAfternoonShift = data.Is_Long_Afternoon__c;
        this.isLongNightShift = data.Is_Long_Night_Shift__c;
        this.isLongSleepoverShift = data.Is_Long_SleepOver__c;

        this.totalReiAmount = 0.0;
        this.grandTotal = 0.0;
        this.totalShiftWages = parseFloat(data.Shift_Wage__c || 0).toFixed(2);
        this.grandTotal = this.totalShiftWages;

        this.addShiftId = data.Add_Shift__c;
        this.extendedHoursandmins = data.Extended_Duration_in_Hours_and_Mins__c;
        this.enddate = data.End_Date__c;

        let etimeParts =
          data.Add_Shift__r.Shift_Start_End_Time__c?.split("-") || [];
        this.shiftEndtime = etimeParts[1] || "";
        this.shiftType = data.Add_Shift__r.Shift_Type__c;
        this.isCustomShifts = this.shiftType === "Custom";

        this.staffid = data.Staff__c;
        this.currentShiftrates = data.Staff_Final_Hourly_Rate__c;

        this.isExtendedShift = parseFloat(data.Extended_Duration__c || 0) > 0;
        this.isSleepOver =
          parseFloat(data.Sleepover_Night_Shift_hours__c || 0) > 0;

        this.SleepOverNightHourlyRates =
          data.Sleepover_Night_Shift_Hourly_Rate__c;
        this.varianceRate = data.Variance_Rate__c;

        this.extendedWage = parseFloat(data.Variance_Wage__c || 0);
        this.sleepOverWage = parseFloat(data.Sleepover_Variance_Wages__c || 0);
        this.sleepovernightshiftduartion = parseFloat(
          data.Sleepover_Night_Shift_hours__c || 0
        );
        this.extendedDuartion = parseFloat(data.Extended_Duration__c || 0);

        this.ShiftRatelabel =
          this.shiftType === "Sleepover Shift" ? "Allowance" : "Hourly Rate";

        const rows = [];
        const shift = result.shiftwithstaffdata;
        console.log("shift in edit " + JSON.stringify(shift));
        const buildRow = (
          label,
          startMs,
          endMs,
          rate,
          duration,
          index,
          sourceLabel
        ) => {
          /*   console.log('📦 buildRow called with:', { label, startMs, endMs,rate,duration,index}); */

          const startTime24 = this.formatMillisecondsToTime(startMs);
          const endTime24 = this.formatMillisecondsToTime(endMs);

          //console.log(`🕒 Converted times: startTime24 = ${startTime24}, endTime24 = ${endTime24}`);

          const startAmPm = this.convertToAmPmObject(startTime24);
          const endAmPm = this.convertToAmPmObject(endTime24);

          // console.log('🌓 AM/PM objects:', { startAmPm, endAmPm});

          const row = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            startTime: startTime24 ? `${startTime24}:00Z` : "00:00:00Z",
            endTime: endTime24 ? `${endTime24}:00Z` : "00:00:00Z",
            startAmPm: startAmPm.displayTime,
            endAmPm: endAmPm.displayTime,
            hourlyRate: rate?.toString() || "",
            rowShiftType: label,
            duration: duration || 0,
            index: index,
            sourceLabel: sourceLabel,
            // Extra variables for start time
            startTimeselectedHour: startAmPm.selectedHour,
            startTimeselectedMinute: startAmPm.selectedMinute,
            startTimeselectedAmPm:
              startAmPm.selectedAmPm.toUpperCase() === "AM",
            startTimdisplayTime: startAmPm.displayTime,

            endTimeselectedHour: endAmPm.selectedHour,
            endTimeselectedMinute: endAmPm.selectedMinute,
            endTimeselectedAmPm: endAmPm.selectedAmPm.toUpperCase() === "AM",
            endTimeDdisplayTime: endAmPm.displayTime
          };

          console.log("✅ Final row object built:", JSON.stringify(row));
          return row;
        };

        const tryBuildRow = (
          label,
          isActive,
          startTime,
          endTime,
          rate,
          duration,
          index,
          sourceLabel
        ) => {
          if (isActive) {
            rows.push(
              buildRow(
                label,
                startTime,
                endTime,
                rate,
                duration,
                index,
                sourceLabel
              )
            );
          }
        };

        tryBuildRow(
          "Morning",
          shift.Is_long_Morning__c,
          shift.Long_Morning_Start_Time__c,
          shift.Long_Morning_End_Time__c,
          shift.Long_Morning_Hourly_Rate__c,
          shift.Long_Morning_Shift_Duartion__c,
          shift.Long_Morning_Index__c,
          "morningShift"
        );
        tryBuildRow(
          "Afternoon",
          shift.Is_Long_Afternoon__c,
          shift.Long_Afternoon_Start_Time__c,
          shift.Long_Afternoon_End_Time__c,
          shift.Long_Afternoon_Hourly_Rate__c,
          shift.Long_Afternoon_Shift_Duartion__c,
          shift.Long_Afternoon_Index__c,
          "afternoonShift"
        );
        tryBuildRow(
          "Night",
          shift.Is_Long_Night_Shift__c,
          shift.Long_Night_Start_Time__c,
          shift.Long_Night_End_Time__c,
          shift.Long_Night_Hourly_Rate__c,
          shift.Long_Night_Shift_Duartion__c,
          shift.Long_Night_Index__c,
          "nightShift"
        );
        tryBuildRow(
          "Sleepover Shift",
          shift.Is_Long_SleepOver__c,
          shift.Long_Sleepover_Start_Time__c,
          shift.Long_Sleepover_End_Time__c,
          shift.Long_Sleepover_Allowance__c,
          shift.Long_Sleepover_Duartion__c,
          shift.Long_Sleepover_index__c,
          "sleepOverShift"
        );
        tryBuildRow(
          "Morning",
          shift.Is_long_Morning_Shift_two__c,
          shift.Long_Morning_Start_Time_Two__c,
          shift.Long_Morning_End_Time_Two__c,
          shift.Long_Morning_Rate_Two__c,
          shift.Long_Morning_Duartion_Two__c,
          shift.Long_Morning_Index_Two__c,
          "morningShiftTwo"
        );
        tryBuildRow(
          "Afternoon",
          shift.Is_Long_afternoon_shift_two__c,
          shift.Long_Afternoon_Start_Time_two__c,
          shift.Long_afternoon_End_Time_Two__c,
          shift.Long_Afternoon_Rate_Two__c,
          shift.Long_Afternoon_Duration_Two__c,
          shift.Long_Afternoon_Index_Two__c,
          "afternoonshiftTwo"
        );
        console.log("rows :  1112 ", JSON.stringify(rows));
        this.rateRows = rows;
        //     this.IsLongShift = this.rateRows.length >= 1;

        this.rateRows.sort((a, b) => a.index - b.index);

        console.log(
          "this.rateRows:  in   final edit ",
          JSON.stringify(this.rateRows)
        );

        // Now fetch approved reimbursements only
        return getShiftReimbursements({ shiftId: this.shiftID });
      })
      .then((response) => {
        console.log("getShiftReimbursements >> ", response);

        this.totalReiAmount = 0;
        this.dayWiseReimburesements = [];

        response.forEach((rec) => {
          if (rec.Approval_Status__c === "Approved") {
            const amount = parseFloat(rec.Total_Amount__c || 0);
            this.totalReiAmount += amount;

            this.dayWiseReimburesements.push({
              ...rec,
              shiftdate: rec.ShiftDate__c
                ? new Date(rec.ShiftDate__c).toLocaleDateString("en-GB")
                : ""
            });
          }
        });

        this.totalReiAmount = this.totalReiAmount.toFixed(2);

        const shiftWages = parseFloat(this.totalShiftWages) || 0;
        const extended = parseFloat(this.extendedWage) || 0;
        const sleepover = parseFloat(this.sleepOverWage) || 0;
        const reimb = parseFloat(this.totalReiAmount) || 0;

        this.grandTotal = shiftWages + reimb;
        if (this.isExtendedShift) {
          this.grandTotal += extended;
        }
        if (this.isSleepOver) {
          this.grandTotal += sleepover;
        }

        this.grandTotal = this.grandTotal.toFixed(2);
        this.isReimburesementsTable = this.dayWiseReimburesements.length > 0;
      })
      .catch((error) => {
        console.error("Error fetching shift or reimbursements:", error);
      })
      .finally(() => {
        this.showSpinner = false;
      });
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
  handleRateRowInputChange(event) {
    const index = event.target.dataset.index;
    const field = event.target.dataset.field;
    const value = event.detail?.value || event.target.value;

    // Defensive check
    if (!this.rateRows || !this.rateRows[index]) return;

    // Update the field in that row
    this.rateRows[index][field] = value;

    // Optional: Recalculate duration if start/end time was changed
    if (field === "startTime" || field === "endTime") {
      const row = this.rateRows[index];

      if (row.startTime && row.endTime) {
        // Convert to Date objects for calculation
        const today = new Date().toISOString().split("T")[0]; // get YYYY-MM-DD

        let start = new Date(`${today}T${row.startTime}`);
        let end = new Date(`${today}T${row.endTime}`);

        // Handle cross-midnight
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }

        const diffMs = end - start;
        const durationInHours = diffMs / (1000 * 60 * 60);

        row.duration = parseFloat(durationInHours.toFixed(2));
      }
    }

    // Trigger reactivity
    this.rateRows = [...this.rateRows];
    console.log(
      "this.rateRows:  in   during onchange  edit ",
      JSON.stringify(this.rateRows)
    );
  }

  async handlesubmit(event) {
    console.log("this.submissionFlag >>", this.submissionFlag);
    const { totalShiftIdlist, totalHours } = this.confirmationData;
    console.log("totalHours >>", totalHours);

    if (totalHours == 0) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "Total hours cannot be zero. Please approve a shift with valid duration",
          variant: "error"
        })
      );
      return;
    }

    this.showSpinner = true; // ✅ Show spinner before async call

    try {
      const response = await updateAllocations({
        shiftIDlist: Array.from(totalShiftIdlist)
      });

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Timesheet approved successfully.",
          variant: "success"
        })
      );

      this.selectedStaffShifts = [];
      this.updateShiftIcons(Array.from(totalShiftIdlist));

      if (this.currentViewFlag === "check") {
        this.handleCheckClick({
          currentTarget: { dataset: { staffId: this.StaffId } }
        });
      } else if (this.currentViewFlag === "mismatch") {
        this.handleMismatchClick({
          currentTarget: { dataset: { staffId: this.StaffId } }
        });
      } else if (this.currentViewFlag === "checkbox") {
        this.handleCheckboxChange({ target: { checked: this.isChecked } });
      }
    } catch (error) {
      console.log("error => " + JSON.stringify(error));
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: error.body.message.split(",")[1].split(":")[0],
          variant: "error"
        })
      );
    } finally {
      this.showSpinner = false; // ✅ Hide spinner only after completion
    }
  }

  // 👇 New method to update shift icons after approval
  updateShiftIcons(approvedShiftIds) {
    this.selectedStaffShifts = this.selectedStaffShifts.map((shift) => {
      if (approvedShiftIds.includes(shift.Id)) {
        return {
          ...shift,
          iconName: "thumb_up",
          iconClass: "approved-icon",
          iconTitle: "Approved",
          isApprovedTemplateVisible: true,
          iconUpdateKey: `${shift.Id}-approved-${Date.now()}` // 👈 Force re-render
        };
      }
      return shift;
    });
  }

  handlesubmissionclose(event) {
    this.submissionFlag = false;
    this.BulkApproveFlag = false;
  }

  handleSubmission(event) {
    let totalHours = event.currentTarget.dataset.duration;
    console.log("totalHours >>", totalHours);
    let totalShiftIdlist = new Set();
    const allocarray = event.currentTarget.dataset.id.split(",");
    for (var s = 0; s < allocarray.length; s++) {
      totalShiftIdlist.add(allocarray[s]);
    }
    console.log("shift id list  " + Array.from(totalShiftIdlist));

    if (totalHours == "0 Hr: 0 Mins") {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Submission Rejected",
          message: "Please provide total hours",
          variant: "Error"
        })
      );
    } else {
      this.submissionFlag = true;
      this.confirmationData = { totalShiftIdlist, totalHours };
    }
  }

  handleUpdate(event) {
    this.showSpinner = true;
    event.preventDefault(); // stop the form from submitting
    const fields = event.detail.fields;
    // console.log('in this.isExtendedShift'+this.isExtendedShift)
    this.extendedDuartion = parseFloat(this.extendedDuartion);
    this.varianceRate = parseFloat(this.varianceRate);
    fields.Variance_Rate__c = this.varianceRate;
    fields.Extended_Duration__c = this.extendedDuartion;
    fields.Extended_Duration_in_Hours_and_Mins__c = this.extendedHoursandmins;
    for (const row of this.rateRows) {
      const mapping = this.apiFieldMap[row.sourceLabel];

      console.log("🔍 Processing row:", row);
      console.log("📌 sourceLabel:", row.sourceLabel);
      console.log("🔑 Field mapping:", mapping);

      if (mapping) {
        console.log(`✅ Setting fields for: ${row.sourceLabel}`);

        fields[mapping.isActive] = true;
        console.log(`➡️ ${mapping.isActive} = true`);

        fields[mapping.start] = row.startTime;
        console.log(`➡️ ${mapping.start} = ${row.startTime}`);

        fields[mapping.end] = row.endTime;
        console.log(`➡️ ${mapping.end} = ${row.endTime}`);

        fields[mapping.rate] = parseFloat(row.hourlyRate || 0);
        console.log(`➡️ ${mapping.rate} = ${fields[mapping.rate]}`);

        fields[mapping.duration] = parseFloat(row.duration || 0);
        console.log(`➡️ ${mapping.duration} = ${fields[mapping.duration]}`);
      } else {
        console.warn(`⚠️ No mapping found for sourceLabel: ${row.sourceLabel}`);
      }
    }

    console.log("in update" + JSON.stringify(fields));
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }

  handleLogOutChnage(event) {
    console.log("End time:", event.target.value);
    console.log("Shift end time:", this.shiftEndtime.toLowerCase());
    console.log("End date:", this.enddate);
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log("isValid", isValid);
    this.fieldErrorMap[field] = !isValid;
    // Convert shift end time to 24-hour format
    let shiftEndTime24 = this.convertTo24HourFormat(
      this.shiftEndtime.toLowerCase()
    );
    //  console.log('Converted Shift End Time (24-hour):', shiftEndTime24);

    // Combine end date with shift end time
    let shiftEndDateTime = new Date(
      `${this.enddate}T${shiftEndTime24.replace("Z", "")}`
    );

    // Combine end date with event target value (end time)
    let eventEndTime = new Date(`${this.enddate}T${event.target.value}`);

    // Calculate duration in milliseconds
    let durationMs = eventEndTime - shiftEndDateTime;
    console.log("eventEndTime: $" + eventEndTime);
    console.log("shiftEndDateTime: $" + shiftEndDateTime);

    // Convert milliseconds to total hours (including fractions)
    let durationHours = durationMs / (1000 * 60 * 60);

    console.log(`Total Duration: ${durationHours.toFixed(2)} hours`);
    this.isExtendedShift = parseFloat(durationHours) > 0 ? true : false;
    this.extendedDuartion = parseFloat(durationHours).toFixed(2);

    let totalMinutes = Math.round(durationHours * 60);
    let hh = Math.floor(totalMinutes / 60);
    let mm = totalMinutes % 60;

    // Store formatted duration
    this.extendedHoursandmins = `${hh}:${mm.toString().padStart(2, "0")}`;
    console.log(`Extended Duration (HH:mm): ${this.extendedHoursandmins}`);
  }

  handleeditAllocation(event) {
    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Shift edited successfully.",
      variant: "success"
    });
    this.dispatchEvent(toastEvent);
    this.shiftInformation = true;
    console.log("Record updated successfully:", event.detail.id);
    const allocationId = event.detail.id;
    console.log("Record updated successfully:", allocationId);

    if (this.currentViewFlag === "check") {
      this.handleCheckClick({
        currentTarget: { dataset: { staffId: this.StaffId } }
      });
    } else if (this.currentViewFlag === "mismatch") {
      this.handleMismatchClick({
        currentTarget: { dataset: { staffId: this.StaffId } }
      });
    } else if (this.currentViewFlag === "checkbox") {
      this.handleCheckboxChange({ target: { checked: this.isChecked } });
    }

    editAllocation({ allocationId: allocationId })
      .then((result) => {
        console.log("Apex call successful:", result);
        // Optionally show a success toast
        this.editflag = false;
        this.showSpinner = false;
      })
      .catch((error) => {
        console.error("Apex call failed:", error);
        // Optionally show an error toast
      });
  }

  handleeditClose() {
    this.editflag = false;
    this.shiftInformation = true;
    this.isExtendedShift = false;
    this.isSleepOver = false;
  }

  convertTo24HourFormat(timeStr) {
    timeStr = timeStr.trim();
    console.log("timeStr" + timeStr);
    console.log("type of " + typeof timeStr);
    // Convert 12-hour format to 24-hour format
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
    console.log(
      "Converted Time (24-hour):",
      `${formattedHours}:${minutes}:00Z`
    );
    return `${formattedHours}:${minutes}:00Z`;
  }

  handleOnchangeExtendedRates(event) {
    this.varianceRate = event.target.value;
    if (
      this.varianceRate == undefined ||
      this.varianceRate == null ||
      this.varianceRate == ""
    ) {
      this.varianceRate = 0;
    }
    this.calculateExtendedWage();
  }

  calculateExtendedWage() {
    this.grandTotal = 0.0;
    this.totalReiAmount = 0;
    getShiftReimbursements({ shiftId: this.shiftID }).then((response) => {
      response.forEach((rec) => {
        console.log("rec.Approval_Status__c" + rec.Approval_Status__c);
        if (rec.Approval_Status__c === "Approved") {
          const amount = rec.Total_Amount__c || 0; // Fallback to 0 if Amount__c is null/undefined
          this.totalReiAmount += amount;
        }
      });
      this.totalReiAmount = this.totalReiAmount.toFixed(2);
      console.log("this.totalReiAmount" + this.totalReiAmount);
      this.grandTotal = (
        parseFloat(this.totalShiftWages) + parseFloat(this.totalReiAmount)
      ).toFixed(2);
      console.log("this.grandTotal" + this.grandTotal);
      this.extendedWage =
        parseFloat(this.varianceRate) * parseFloat(this.extendedDuartion);
      console.log("this.extendedWage" + this.extendedWage);
      this.grandTotal =
        parseFloat(this.grandTotal) +
        parseFloat(this.varianceRate) * parseFloat(this.extendedDuartion) +
        parseFloat(this.sleepOverWage);
      console.log("this.grandTotal" + this.grandTotal);
      this.extendedWage = this.extendedWage.toFixed(2);
      console.log("this.extendedWage" + this.extendedWage);
      this.grandTotal = this.grandTotal.toFixed(2);
      console.log("this.grandTotal" + this.grandTotal);
    });
  }

  handleSleepOverTypeOfPay(event) {
    let selectedValue = event.target.value;
    let hourlyRate = 0;
    this.SleepOverNightHourlyRates = 0;
    console.log("Selected Value:", selectedValue);

    getStaffById({ recordId: this.staffid })
      .then((result) => {
        console.log("Staff Data:", JSON.stringify(result));

        // Store staff data
        let staffData = result[0]; // Assuming only one record is returned

        // Determine Next Shift Type using switch
        switch (selectedValue) {
          case "Night Shift Rates":
            hourlyRate = staffData.Night_shift_Hourly_Rate__c;
            break;
          case "Add New Rates":
            hourlyRate = 0;
            break;
          case "None":
            hourlyRate = 0;
            break;

          default:
            console.log("hourly rate " + hourlyRate);
        }

        console.log("Calculated Hourly Rate:", hourlyRate);
        this.SleepOverNightHourlyRates = hourlyRate;
        this.calcuatesleepovernightwage();
        // If needed, store the next shift type and hourly rate for use elsewhere in the component
      })
      .catch((error) => {
        console.error("Error fetching staff data:", error);
      });
  }

  calcuatesleepovernightwage() {
    this.grandTotal = 0.0;
    this.totalReiAmount = 0;
    getShiftReimbursements({ shiftId: this.shiftID }).then((response) => {
      response.forEach((rec) => {
        if (rec.Approval_Status__c === "Approved") {
          const amount = rec.Total_Amount__c || 0; // Fallback to 0 if Amount__c is null/undefined
          this.totalReiAmount += amount;
        }
      });
      this.totalReiAmount = this.totalReiAmount.toFixed(2);

      this.grandTotal = (
        parseFloat(this.totalShiftWages) + parseFloat(this.totalReiAmount)
      ).toFixed(2);

      this.sleepOverWage =
        parseFloat(this.SleepOverNightHourlyRates) *
        parseFloat(this.sleepovernightshiftduartion);
      this.grandTotal =
        parseFloat(this.grandTotal) +
        parseFloat(this.SleepOverNightHourlyRates) *
          parseFloat(this.sleepovernightshiftduartion) +
        parseFloat(this.extendedWage);

      this.sleepOverWage = this.sleepOverWage.toFixed(2);
      this.grandTotal = this.grandTotal.toFixed(2);
    });
  }

  handleChecklistClick(event) {
    const shiftId = event.currentTarget.dataset.id;
    console.log("Checklist clicked for shift ID:", shiftId);
    getCheckListByShiftId({ addShiftId: shiftId })
      .then((result) => {
        console.log("Apex response:", result);
        if (result.success) {
          console.log("Apex response if:", result.success);
          this.checklistItems = result.checklist;
          this.resultMessage = result.message;
          this.isShowChecklsit = true;
        } else {
          console.log("Apex response if else:", result.success);
          this.resultMessage = result.message;
          this.checklistItems = [];
          this.isShowChecklsit = false;
        }
      })
      .catch((error) => {
        console.error("Error calling Apex:", error);
        this.resultMessage =
          "Something went wrong while fetching the checklist.";
        this.checklistItems = [];
        this.isShowChecklist = false;
      });
    //this.isShowChecklsit = false;
  }

  handleActivityClick(event) {
    const shiftId = event.currentTarget.dataset.id;
    console.log("Activity clicked for shift ID:", shiftId);

    this.shiftID = shiftId;
    this.isShowActivity = true;

    // Imperative call to Apex
    getActivityLog({ shiftWithStaffID: shiftId })
      .then((result) => {
        this.activitydata = result.records;
        console.log("Activity list data:", JSON.stringify(this.activitydata));
        this.error = undefined;
      })
      .catch((error) => {
        console.error("Error fetching activity log:", error);
        this.error = error;
        this.activitydata = [];
      });
  }

  @track Sdate;
  @track Status;
  @track Sign;
  @track ShowSignature;
  handlegeolocationClick(event) {
    const shiftId = event.currentTarget.dataset.id;
    this.Sdate = event.currentTarget.dataset.date;
    this.Status = event.currentTarget.dataset.status;
    console.log(
      "Activity clicked for shift ID:",
      shiftId + "" + this.Sdate + "" + this.Status
    );
    this.shiftID = shiftId;
    this.ShowGeoLocation = true;
    this.showLocation = true;
    this.hideLocation = false;
    this.isShowMap = false;
  }
  handleSignature(event) {
    const shiftId = event.currentTarget.dataset.id;
    this.Sign = event.currentTarget.dataset.signature;
    this.shiftID = shiftId;
    this.ShowSignature = true;

    console.log(
      "Activity clicked for shift ID:",
      shiftId + "" + this.Sdate + "" + this.Sign
    );
  }

  handleeditCloseCheckList(event) {
    this.isShowChecklsit = false;
    this.isShowActivity = false;
    this.ShowGeoLocation = false;
    this.ShowSignature = false;
  }

  handleBulkApproveClick(event) {
    console.log("this.generatedShiftMap >>", this.generatedShiftMap);

    let validShifts = [];

    // Iterate through each staff's shifts in the generatedShiftMap
    for (const staffId in this.generatedShiftMap) {
      const shifts = this.generatedShiftMap[staffId];

      if (Array.isArray(shifts)) {
        const filtered = shifts.filter(
          (shift) =>
            shift.Login_Time_Formula__c != null &&
            shift.Logout_Time_Formula__c != null &&
            shift.Approval_Status__c !== "Approved"
        );

        validShifts = validShifts.concat(filtered);
      }
    }

    // Extract only the shift IDs into a list
    this.shiftIdList = validShifts.map((shift) => shift.Id);

    // Store the filtered shifts in a tracked property
    this.filteredShifts = validShifts;
    this.validShiftslength = validShifts.length;

    // Log the results
    console.log("Valid Shifts for Bulk Approval:", validShifts);
    console.log("Total Valid Shift Count:", validShifts.length);
    if (validShifts.length == 0) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Approval for 0 shifts",
          message:
            "Please complete at least one shift before approving the timesheet.",
          variant: "Info"
        })
      );
    } else this.BulkApproveFlag = true;
  }

  handleBulksubmit(event) {
    console.log("shiftIdList >>", this.shiftIdList);
    updateAllocations({ shiftIDlist: this.shiftIdList })
      .then((response) => {
        const toastEvent = new ShowToastEvent({
          title: "Success",
          message: "Timesheets approved successfully.",
          variant: "success"
        });
        this.dispatchEvent(toastEvent);
        this.loadShiftData();
        this.BulkApproveFlag = false;
      })
      .catch((error) => {
        console.log("error => " + JSON.stringify(error));
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: error.body.message.split(",")[1].split(":")[0],
            variant: "error"
          })
        );
      });
  }

  handleExtendedTypeOfPay(event) {
    let selectedValue = event.target.value;
    let nextShiftType;
    let hourlyRate = 0;
    this.varianceRate = 0;

    console.log("Selected Value:", selectedValue);

    getStaffById({ recordId: this.staffid })
      .then((result) => {
        console.log("Staff Data:", JSON.stringify(result));

        // Store staff data
        let staffData = result[0]; // Assuming only one record is returned

        // Determine Next Shift Type using switch
        switch (selectedValue) {
          case "Next Shift Pay Rates":
            switch (this.shiftType) {
              case "Morning":
              case "Custom":
              case "General":
                nextShiftType = "Afternoon";
                break;
              case "Afternoon":
                nextShiftType = "Night";
                break;
              case "Night":
              case "Sleepover Shift":
                nextShiftType = "General"; // Or assign "Custom" based on logic
                break;
              default:
                nextShiftType = "None";
            }
            break;
          case "Current Shift Pay Rates":
            nextShiftType = "Current Shift Pay Rates";
            break;
          case "Over Time Pay Rates":
            nextShiftType = "Over Time Pay Rates";
            break;
          case "Add New Pay Rates":
            nextShiftType = "Add New Pay Rates";
            break;
          default:
            nextShiftType = "None";
        }

        console.log("Calculated Shift Type:", nextShiftType);

        // Determine Hourly Rate based on Next Shift Type using switch
        switch (nextShiftType) {
          case "Morning":
          case "General":
          case "Custom":
            hourlyRate = staffData.Working_Hours_Rate__c;
            break;
          case "Afternoon":
            hourlyRate = staffData.Afternoon_shift_Hourly_Rate__c;
            break;
          case "Night":
          case "Sleepover Shift":
            hourlyRate = staffData.Night_shift_Hourly_Rate__c; // Assuming sleepover shift uses night rate
            break;
          case "Over Time Pay Rates":
            hourlyRate = this.currentShiftrates * 2;
            break;
          case "Current Shift Pay Rates":
            hourlyRate = this.currentShiftrates;
            break;
          case "Add New Pay Rates":
          case "None":
            hourlyRate = 0;
            break;
        }

        console.log("Calculated Hourly Rate:", hourlyRate);
        this.varianceRate = hourlyRate;
        //   console.log('type of extend' +typeof(this.extendedWage));
        //   console.log('type of sleepover '+typeof(this.sleepOverWage));

        this.calculateExtendedWage();

        // If needed, store the next shift type and hourly rate for use elsewhere in the component
      })
      .catch((error) => {
        console.error("Error fetching staff data:", error);
      });
  }

  calculateExtendedWage() {
    this.grandTotal = 0.0;
    this.totalReiAmount = 0;
    getShiftReimbursements({ shiftId: this.shiftID }).then((response) => {
      response.forEach((rec) => {
        if (rec.Approval_Status__c === "Approved") {
          const amount = rec.Total_Amount__c || 0; // Fallback to 0 if Amount__c is null/undefined
          this.totalReiAmount += amount;
        }
      });
      this.totalReiAmount = this.totalReiAmount.toFixed(2);
      this.grandTotal = (
        parseFloat(this.totalShiftWages) + parseFloat(this.totalReiAmount)
      ).toFixed(2);
      this.extendedWage =
        parseFloat(this.varianceRate) * parseFloat(this.extendedDuartion);
      this.grandTotal =
        parseFloat(this.grandTotal) +
        parseFloat(this.varianceRate) * parseFloat(this.extendedDuartion) +
        parseFloat(this.sleepOverWage);
      this.extendedWage = this.extendedWage.toFixed(2);
      this.grandTotal = this.grandTotal.toFixed(2);
    });
  }

  @track refresh = false;
  handleRefresh1(event) {
    this.showSpinner = true;
    this.refresh = true;
    if (this.currentViewFlag === "check") {
      this.handleCheckClick({
        currentTarget: { dataset: { staffId: this.StaffId } }
      });
    } else if (this.currentViewFlag === "mismatch") {
      this.handleMismatchClick({
        currentTarget: { dataset: { staffId: this.StaffId } }
      });
    } else if (this.currentViewFlag === "checkbox") {
      this.handleCheckboxChange({ target: { checked: this.isChecked } });
    }

    this.showSpinner = false;
  }

  handleView(event) {
    event.preventDefault();

    const url = event.currentTarget.dataset.url;
    console.log("url >>", url);

    this.currentUrl = url;
    this.isModalOpen = true;
    this.editflag = false;

    const fileType = this.getFileType(this.currentUrl);
    console.log("file type: " + fileType);

    if (
      fileType !== "png" &&
      fileType !== "pdf" &&
      fileType !== "jpeg" &&
      fileType !== "jpg" &&
      fileType !== "csv" &&
      fileType !== "svg"
    ) {
      setTimeout(() => {
        this.closeModal();
      }, 1700);
    }
  }

  getFileType(url) {
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  }

  closeModal() {
    this.isModalOpen = false;
    this.editflag = true;
  }

  get computedSignatureClass() {
    return `material-icons overview-icon ${this.shift?.Client_Signature__c ? "signature-icon-blue" : "signature-icon-red"}`;
  }

  // Utility method to show toast messages
  showToast(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(evt);
  }

  // Method to calculate totals (can be used in template)
  get totalShifts() {
    return this.selectedStaffShifts.length;
  }

  get totalDuration() {
    return this.selectedStaffShifts
      .reduce((sum, shift) => {
        return sum + parseFloat(shift.duration);
      }, 0)
      .toFixed(2);
  }

  get totalExpenses() {
    return this.selectedStaffShifts
      .reduce((sum, shift) => {
        return sum + parseFloat(shift.mileageAmountTotal || 0);
      }, 0)
      .toFixed(2);
  }

  handleDownloadClick() {
    this.frequency = "";
    this.ExportStartDate = "";
    this.exportRange = "";
    this.exportFormat = "";
    this.ExportEndDate = "";
    this.showExportRange = false;
    this.isModalOpenfortimesheetExport = true;
  }

  handleCloseModal() {
    this.isModalOpenfortimesheetExport = false;
  }

  handleFrequencyChange(event) {
    this.frequency = event.detail.value;
    this.updateDateRange(this.frequency, this.startDate);
  }

  handleStartDateChange(event) {
    this.startDate = event.target.value;
    this.updateDateRange(this.frequency, this.startDate);
  }

  handleFormatChange(event) {
    this.exportFormat = event.detail.value;
  }

  handleExport() {
    if (!this.frequency) {
      this.showToast("Error", "Frequency is required.", "error");
      return;
    }
    if (!this.ExportStartDate) {
      this.showToast("Error", "Start Date is required.", "error");
      return;
    }
    if (!this.exportFormat) {
      this.showToast("Error", "Export As is required.", "error");
      return;
    }
    console.log("this.staffId >>", this.StaffId);
    console.log("🚀 handleExport() called");
    console.log(
      "this.isModalOpenfortimesheetExport >>",
      this.isModalOpenfortimesheetExport
    );
    console.log("this.frequency >>", this.frequency);
    console.log("this.startDate >>", this.startDate);

    const endDate = this.formatToISO(this.endDateforDownload);
    console.log("this.endDate (formatted) >>", endDate);
    console.log("this.exportFormat >>", this.exportFormat);
    console.log("this.shiftInformation >>", this.shiftInformation);
    console.log("this.timeSheet >>", this.timeSheet);
    if (this.shiftInformation == true) {
      if (
        this.frequency === "Fortnightly" ||
        this.frequency === "Monthly" ||
        this.frequency === "Weekly"
      ) {
        console.log(
          `🗓 Frequency: ${this.frequency} → Fetching mismatched shifts`
        );
        console.log("this.staffId >>", this.StaffId);
        console.log("this.startDate >>", this.ExportStartDate);
        console.log("endDate >>", this.ExportEndDate);
        console.log("this.endDateforDownload >>", this.endDateforDownload);

        getMismatchedShifts({
          staffId: this.StaffId,
          weekStart: this.ExportStartDate,
          weekEnd: this.ExportEndDate
        })
          .then((shifts) => {
            console.log(
              "✅ Raw shifts returned from Apex >>",
              JSON.parse(JSON.stringify(shifts))
            );

            const processedShifts = (shifts || []).map((shift) => {
              console.log(`⚙️ Processing shift [${shift.Id}]`);

              let totalMileageOthers = 0;
              let totalMileageAmount = 0;

              if (shift.Reimbursements__r) {
                shift.Reimbursements__r.forEach((reim) => {
                  totalMileageOthers += parseFloat(reim.Mileage_Others__c) || 0;
                  totalMileageAmount += parseFloat(reim.Mileage_Amount__c) || 0;
                });
              }

              console.log(
                `   ➡️ Mileage Totals for Shift [${shift.Id}] → Others: ${totalMileageOthers}, Amount: ${totalMileageAmount}`
              );

              return {
                ...shift,
                formattedStart: shift.Start_time_Formula__c,
                formattedEnd: shift.End_time_formula__c,
                shiftType:
                  shift.Type_of_shift__c === "Sleepover Shift"
                    ? "Sleepover"
                    : shift.Type_of_shift__c,
                formattedLogin: shift.Login_Time_Formula__c,
                formattedLogout: shift.Logout_Time_Formula__c,
                duration: isNaN(shift.Actual_Duration__c)
                  ? 0
                  : shift.Actual_Duration__c,
                shiftDate: this.formatDateToDDMMYYYY(shift.Date__c),
                serviceTypeShort:
                  shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c?.substring(
                    0,
                    30
                  ) + "..." || "--",
                serviceType:
                  shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c || "--",
                facilityName: shift.Facility__c || "--",
                clientSignature: shift.Client_Signature__c,
                clientName: shift.Services_and_Support_Plans__r?.[0]?.Client__r
                  ? `${shift.Services_and_Support_Plans__r[0].Client__r.First_Name__c || ""} ${shift.Services_and_Support_Plans__r[0].Client__r.Last_Name__c || ""}`.trim()
                  : "--",
                mileageOthersTotal: totalMileageOthers.toFixed(2),
                mileageAmountTotal: totalMileageAmount.toFixed(2)
              };
            });

            console.log(
              `✅ Processed shifts count: ${processedShifts.length}`,
              JSON.parse(JSON.stringify(processedShifts))
            );

            // Assign values back
            this.selectedStaffShiftsforPDF = processedShifts;
            this.selectedShiftIds = processedShifts.map((shift) => shift.Id);

            this.totalShiftDuration = processedShifts.reduce(
              (sum, shift) => sum + (parseFloat(shift.duration) || 0),
              0
            );
            this.totalKms = processedShifts.reduce(
              (sum, shift) => sum + (parseFloat(shift.mileageOthersTotal) || 0),
              0
            );
            this.totalexpenses = processedShifts.reduce(
              (sum, shift) => sum + (parseFloat(shift.mileageAmountTotal) || 0),
              0
            );
            this.sleepoverDuration = processedShifts.reduce(
              (sum, shift) =>
                sum + (parseFloat(shift.Long_Sleepover_Duartion__c) || 0),
              0
            );
            this.totalApprovedLoggedDuration = processedShifts.reduce(
              (sum, shift) => {
                return shift.Approval_Status__c === "Approved"
                  ? sum + (parseFloat(shift.duration) || 0)
                  : sum;
              },
              0
            );

            // 👇 NEW: check if any processed shift is NOT NDIS
            this.otherThanNdis = processedShifts.some(
              (shift) => shift?.Staff__r?.Facility__r?.Type_of_Service__c !== "NDIS"
            );

            console.log("📊 Totals Calculated:", {
              totalShiftDuration: this.totalShiftDuration,
              totalKms: this.totalKms,
              totalexpenses: this.totalexpenses,
              sleepoverDuration: this.sleepoverDuration,
              totalApprovedLoggedDuration: this.totalApprovedLoggedDuration,
              otherThanNdis: this.otherThanNdis
            });

            console.log(`✅ Processed shifts count: ${processedShifts.length}`);
            if (this.exportFormat === "PDF") {
              this.handleDownloadPDF();
            } else if (this.exportFormat === "CSV") {
              this.handleDownloadCSV();
            }
          })
          .catch((error) => {
            console.error("❌ Error fetching shifts:", error);
          });
      }
    } else if (this.timeSheet == true) {
      this.loadShiftInformation();
    }
  }

  /* updateDateRange(freq, start) {
        const startDateObj = new Date(start);
        let endDate = new Date(startDateObj);

        switch (freq) {
            case 'Weekly':
                endDate.setDate(startDateObj.getDate() + 6);
                break;
            case 'Fortnightly':
                endDate.setDate(startDateObj.getDate() + 13);
                break;
            case 'Monthly':
                // Option A: rolling month (Aug 18 → Sep 17)
                endDate.setMonth(startDateObj.getMonth() + 1);
                endDate.setDate(endDate.getDate() - 1);

                // Option B: calendar month (Aug 18 → Aug 31)
                // endDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 1, 0);
                break;
            default:
                endDate.setDate(startDateObj.getDate() + 13);
        }

        const formatDate = (date) => 
            date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        this.exportRange = `${formatDate(startDateObj)} — ${formatDate(endDate)}`;
        this.endDateforDownload = formatDate(endDate);
        console.log('this.endDateforDownload >>', this.endDateforDownload);
        this.ExportEndDate = this.formatDateForSalesforce(endDate);
        this.ExportStartDate = this.formatDateForSalesforce(startDateObj);
        console.log('this.ExportEndDate >>', this.ExportEndDate);
        if(this.frequency != null && this.ExportStartDate != null && this.ExportEndDate != null) {
            this.showExportRange = true;
        }       
    } */

  updateDateRange(freq, start) {
    // If any required input is missing, exit early
    if (!freq || !start) {
      console.warn("Required inputs missing: frequency or start date.");
      this.showExportRange = false;
      return;
    }

    const startDateObj = new Date(start);
    let endDate = new Date(startDateObj);

    switch (freq) {
      case "Weekly":
        endDate.setDate(startDateObj.getDate() + 6);
        break;
      case "Fortnightly":
        endDate.setDate(startDateObj.getDate() + 13);
        break;
      case "Monthly":
        // End date should stay within the same month
        const lastDayOfMonth = new Date(
          startDateObj.getFullYear(),
          startDateObj.getMonth() + 1,
          0
        );
        endDate = lastDayOfMonth;
        break;
      default:
        endDate.setDate(startDateObj.getDate() + 13);
    }

    const formatDate = (date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

    // Only assign values if all 3 variables are available
    if (freq && startDateObj && endDate) {
      this.showExportRange = true;
      this.exportRange = `${formatDate(startDateObj)} — ${formatDate(endDate)}`;
      this.endDateforDownload = formatDate(endDate);
      console.log("this.endDateforDownload >>", this.endDateforDownload);
      this.ExportEndDate = this.formatDateForSalesforce(endDate);
      this.ExportStartDate = this.formatDateForSalesforce(startDateObj);
      console.log("this.ExportEndDate >>", this.ExportEndDate);
    } else {
      this.showExportRange = false;
    }
  }

  formatDateForSalesforce(dateInput) {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  handleDownloadPDF() {
    try {
      const jsPDF = window.jspdf?.jsPDF;
      if (!jsPDF || typeof jsPDF.API.autoTable !== "function") {
        console.error("❌ PDF libraries not loaded or autoTable not attached");
        this.showToast("Error", "PDF libraries are not ready.", "error");
        return;
      }

      const doc = new jsPDF();
      console.log("📄 PDF document initialized");

      // Title
      const titleText = `${this.StaffName1} - Shift Summary`;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(titleText, 10, 20);
      console.log("🖊️ Title added:", titleText);

      const serviceOrParticipantLabel = this.otherThanNdis
        ? "Participant"
        : "Service";

      const headers = [
        "Date",
        "Shift",
        serviceOrParticipantLabel,
        this.facilityPreferredName,
        "Start Time",
        "End Time",
        "Break(min)",
        "Duration (hr)",
        "Mileage (km)",
        "Expense",
        "Variance (hr)",
        "Signature"
      ];

      const data = this.selectedStaffShiftsforPDF.map((shift) => [
        shift.shiftDate,
        shift.shiftType,
        this.otherThanNdis ? shift.clientName : shift.serviceType,
        shift.facilityName,
        shift.formattedStart,
        shift.formattedEnd,
        shift.Break__c,
        shift.duration,
        shift.mileageOthersTotal,
        `$${parseFloat(shift.mileageAmountTotal || 0).toFixed(2)}`,
        shift.extendedDuration,
        shift.clientSignature ? "Signed" : "Not Signed"
      ]);

      // Draw the table
      doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        margin: { left: 10, right: 10 },
        styles: {
          fontSize: 7,
          cellPadding: { top: 4, bottom: 4, left: 1.5, right: 1.5 },
          halign: "center",
          valign: "middle"
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 15 },
          2: { cellWidth: 23 },
          3: { cellWidth: 23 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 10 },
          7: { cellWidth: 14 },
          8: { cellWidth: 14 },
          9: { cellWidth: 17 },
          10: { cellWidth: 14 },
          11: { cellWidth: 22 }
        },
        tableWidth: "auto",
        didParseCell: function (data) {
          if (data.section === "body" && data.column.index === 11) {
            const cellValue = data.cell.raw;
            if (cellValue === "Signed") {
              data.cell.styles.textColor = [0, 102, 204]; // Blue
              data.cell.styles.fontStyle = "bold";
            } else if (cellValue === "Not Signed") {
              data.cell.styles.textColor = [204, 0, 0]; // Red
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        didDrawPage: function (data) {
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height
            ? pageSize.height
            : pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            pageSize.width - 30,
            pageHeight - 10
          );
        }
      });

      // Summary Section
      let finalY = doc.autoTable.previous.finalY + 10;
      const pageHeight = doc.internal.pageSize.height;

      if (pageHeight - finalY < 40) {
        doc.addPage();
        finalY = 20;
      }

      const totalShifts = this.selectedStaffShifts.length;
      const totalDuration = this.selectedStaffShifts.reduce(
        (sum, shift) => sum + parseFloat(shift.duration),
        0
      );
      const totalExpenses = this.selectedStaffShifts.reduce(
        (sum, shift) => sum + parseFloat(shift.mileageAmountTotal || 0),
        0
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("Summary:", 10, finalY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Shifts: ${totalShifts}`, 10, finalY + 8);
      doc.text(
        `Total Duration: ${totalDuration.toFixed(2)} hours`,
        10,
        finalY + 16
      );
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 10, finalY + 24);

      const fileName = `${this.StaffName1.replace(/\s+/g, "_")}_Shifts.pdf`;
      doc.save(fileName);
      console.log("✅ PDF saved:", fileName);
      this.isModalOpenfortimesheetExport = false;
      this.showToast("Success", "PDF generated successfully!", "success");
      this.frequency = "";
      this.startDate = "";
      this.exportRange = "";
      this.exportFormat = "";
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      this.showToast("Error", "Failed to generate PDF.", "error");
    }
  }

  handleDownloadCSV() {
    try {
      console.log("📊 handleDownloadCSV triggered...");
      console.log(
        "📅 Export Start:",
        this.ExportStartDate,
        "| Export End:",
        this.ExportEndDate
      );

      // Header Row
      const serviceOrParticipantLabel = this.otherThanNdis
        ? "Participant"
        : "Service";
      const headers = [
        "Date",
        "Shift",
        serviceOrParticipantLabel,
        "Facility",
        "Start Time",
        "End Time",
        "Break(min)",
        "Duration (hr)",
        "Mileage (km)",
        "Expense",
        "Variance (hr)",
        "Signature"
      ];
      console.log("📝 Headers:", headers);
      console.log(
        "📝 this.selectedStaffShiftsforPDF:",
        JSON.stringify(this.selectedStaffShiftsforPDF)
      );

      // Data Rows
      const dataRows = (this.selectedStaffShiftsforPDF || []).map(
        (shift, index) => {
          console.log(`   ➡️ Processing shift #${index + 1}:`, shift);

          return [
            shift.shiftDate,
            shift.shiftType,
            this.otherThanNdis ? shift.clientName : shift.serviceType,
            shift.facilityName,
            shift.formattedStart,
            shift.formattedEnd,
            shift.Break__c,
            shift.duration,
            shift.mileageOthersTotal,
            `$${parseFloat(shift.mileageAmountTotal || 0).toFixed(2)}`,
            shift.extendedDuration,
            shift.clientSignature ? "Signed" : "Not Signed"
          ];
        }
      );
      console.log("📊 Data Rows prepared:", dataRows);

      // Build CSV content
      let csvContent = [headers, ...dataRows]
        .map((row) => row.join(","))
        .join("\n");
      console.log("📄 CSV content before summary:\n", csvContent);

      // Add Summary Section
      const totalShifts = (this.selectedStaffShifts || []).length;
      const totalDuration = (this.selectedStaffShifts || []).reduce(
        (sum, shift) => sum + parseFloat(shift.duration || 0),
        0
      );
      const totalExpenses = (this.selectedStaffShifts || []).reduce(
        (sum, shift) => sum + parseFloat(shift.mileageAmountTotal || 0),
        0
      );

      console.log("📌 Summary Calculations →", {
        totalShifts,
        totalDuration: totalDuration.toFixed(2),
        totalExpenses: `$${totalExpenses.toFixed(2)}`
      });

      csvContent += `\n\nSummary\n`;
      csvContent += `Total Shifts,${totalShifts}\n`;
      csvContent += `Total Duration (hrs),${totalDuration.toFixed(2)}\n`;
      csvContent += `Total Expenses,$${totalExpenses.toFixed(2)}\n`;

      console.log("📄 Final CSV content:\n", csvContent);

      // Create and Download CSV
      const BOM = "\uFEFF"; // Ensure Excel opens UTF-8 correctly
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);

      const fileName = `${this.StaffName1.replace(/\s+/g, "_")}_Shifts.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("✅ CSV saved successfully →", fileName);
      this.isModalOpenfortimesheetExport = false;
      this.showToast("Success", "CSV generated successfully!", "success");

      // Reset values
      this.frequency = "";
      this.startDate = "";
      this.exportRange = "";
      this.exportFormat = "";
      console.log("🔄 Export state reset");
    } catch (error) {
      console.error("❌ Error generating CSV:", error);
      this.showToast("Error", "Failed to generate CSV.", "error");
    }
  }

  get modalClass() {
    return this.isModalOpenfortimesheetExport
      ? "slds-modal slds-fade-in-open"
      : "slds-modal";
  }

  get backdropClass() {
    return this.isModalOpenfortimesheetExport
      ? "slds-backdrop slds-backdrop_open"
      : "slds-backdrop";
  }

  formatToISO(date) {
    if (!(date instanceof Date)) {
      date = new Date(date); // convert string to Date if needed
    }
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  @track isBusy = false;
  @track shiftRecords = [];
  @track shiftError;
  @track dailyShiftMap = {};
  @track ExportEndDate;
  @track ExportStartDate;
  wiredResultCache;
  startDate;
  endDate;
  selectedStaffIds = [];

  loadShiftInformation() {
    this.isBusy = true;

    console.log("this.trackedStaffIds >>", this.trackedStaffIds);
    console.log("this.startDate >>", this.ExportStartDate);
    console.log("this.endDate >>", this.ExportEndDate);

    fetchStaffShiftData({
      staffIds: this.trackedStaffIds,
      weekStartDate: this.ExportStartDate,
      weekEndDate: this.ExportEndDate
    })
      .then((result) => {
        this.shiftError = null;
        this.shiftRecords = result;
        console.log("📌 Shift Info from Apex:", JSON.stringify(result));

        if (result.length > 0 && result[0].shifts.length > 0) {
          console.log("👉 First Shift Date:", result[0].shifts[0].Date__c);
        }

        this.dailyShiftMap = {};

        result.forEach((person) => {
          person.shifts.forEach((s) => {
            const shiftDate = s.Date__c;
            if (!this.dailyShiftMap[shiftDate]) {
              this.dailyShiftMap[shiftDate] = [];
            }
            this.dailyShiftMap[shiftDate].push({
              ...s,
              cellCss: this.computeCellCss(s.hasVariance, s.approved)
            });
          });
        });

        console.log("📌 dailyShiftMap =>", this.dailyShiftMap);
        this.createMockShifts();
      })
      .catch((err) => {
        this.shiftError = err;
        console.error("⚠️ Error fetching shift info:", err);
      })
      .finally(() => {
        this.isBusy = false;
      });
  }

  computeCellCss(hasVariance, isApproved) {
    return hasVariance
      ? "variance-cell"
      : isApproved
        ? "approved-cell"
        : "default-cell";
  }

  createMockShifts() {
    console.log("🔄 Creating mock shift summaries...");

    this.memberSummaries = [];
    const summaryMap = new Map();
    console.log("createMockShifts >>", JSON.stringify(this.dailyShiftMap));

    // 1️⃣ Collect all shifts into summaryMap
    if (this.dailyShiftMap) {
      Object.entries(this.dailyShiftMap).forEach(([date, shifts]) => {
        shifts.forEach((shift) => {
          const staffId = shift.Staff__c;
          const staffName = shift.Staff__r?.Display_Nickname__c || "Unknown";

          if (!summaryMap.has(staffId)) {
            summaryMap.set(staffId, {
              staffId,
              staffName,
              nameToDisplay: staffName,
              allShifts: [],
              shifts: [],
              totalDuration: 0,
              totalMileage: 0,
              totalExpense: 0,
              totalSleepoverHours: 0,
              varianceCount: 0,
              mismatchCount: 0,
              hasVariances: false,
              hasMismatch: false,
              hasShiftForAnyDay: false,
              totalMileageAmount: 0,
              totalMileageOthers: 0,
              mileageAmountSum: 0,
              mileageOthersSum: 0
            });
          }
          summaryMap.get(staffId).allShifts.push(shift);
        });
      });
    }

    // 2️⃣ Ensure staffDirectory is available
    if (!Array.isArray(this.staffDirectory)) {
      console.warn("⚠️ staffDirectory is missing, initializing as empty.");
      this.staffDirectory = [];
    }

    // 3️⃣ Build final memberSummaries
    this.staffDirectory.forEach((staffRecord) => {
      const staffId = staffRecord.Id;
      const staffName =
        staffRecord.Display_Nickname__c || staffRecord.Name || "Unknown";

      let staffSummary = summaryMap.get(staffId);
      if (!staffSummary) {
        staffSummary = {
          staffId,
          staffName,
          nameToDisplay: staffName,
          allShifts: [],
          shifts: [],
          totalDuration: 0,
          totalMileage: 0,
          totalExpense: 0,
          totalSleepoverHours: 0,
          varianceCount: 0,
          mismatchCount: 0,
          hasVariances: false,
          hasMismatch: false,
          hasShiftForAnyDay: false,
          totalMileageAmount: 0,
          totalMileageOthers: 0,
          mileageAmountSum: 0,
          mileageOthersSum: 0
        };
      }

      staffSummary.shifts = [];
      let mismatchCounter = 0;

      // 🔎 Process each shift
      staffSummary.allShifts.forEach((shift) => {
        const variance = shift.Variance_Wage__c || 0;
        const planned = shift.Duration__c || 0;
        const actual = shift.Actual_Duration__c || 0;
        const extended = shift.Extended_Duration__c || 0;
        const isMismatch = actual !== planned + extended;
        if (isMismatch) mismatchCounter++;

        const clientNames = new Set();
        const serviceName = new Set();

        if (Array.isArray(shift.Services_and_Support_Plans__r)) {
          shift.Services_and_Support_Plans__r.forEach((service) => {
            const client = service.Client__r;
            if (client) {
              const fullName =
                `${client.First_Name__c || ""} ${client.Last_Name__c || ""}`.trim();
              clientNames.add(fullName);
            }

            const tracker = service.Funds_Tracker__r;
            if (tracker?.Name) {
              serviceName.add(tracker.Name);
            }
          });
        }

        const logIn = shift.Log_In_Date_Time__c;
        const logOut = shift.Log_Out_Date_Time__c;
        const totalLoggedHours =
          logIn && logOut ? this.calculateHoursDifference(logIn, logOut) : 0;

        const duration = actual || planned + extended;

        staffSummary.shifts.push({
          id: `${staffId}-${shift.Id}`,
          date: shift.Date__c,
          isForDay: true,
          startTime: shift.Start_time_Formula__c,
          endTime: shift.End_time_formula__c,
          shiftDuration: actual,
          actualDuration: duration,
          hours: duration,
          logInTimeFormatted: this.formatTime(logIn),
          logOutTimeFormatted: this.formatTime(logOut),
          totalLoggedHours,
          formattedLoggedHours: this.formatHoursToHrMin(totalLoggedHours),
          clientNames: Array.from(clientNames),
          serviceNames: Array.from(serviceName)
        });
      });

      staffSummary.workedAnyDay = staffSummary.shifts.length > 0;

      // 🧮 Totals using allShifts
      staffSummary.totalHours = staffSummary.allShifts.reduce(
        (sum, s) => sum + (s.Duration__c || 0),
        0
      );
      staffSummary.totalMileage = staffSummary.allShifts.reduce(
        (sum, s) => sum + (s.Mileage__c || 0),
        0
      );
      staffSummary.totalExpense = staffSummary.allShifts.reduce(
        (sum, s) => sum + (s.Expense__c || 0),
        0
      );
      staffSummary.sleepoverTotal = staffSummary.allShifts.reduce(
        (sum, s) => sum + (s.Sleepover_Shift_Hours__c || 0),
        0
      );
      staffSummary.varianceTotal = staffSummary.allShifts.reduce(
        (sum, s) => sum + (s.Variance_Wage__c || 0),
        0
      );
      staffSummary.mismatchTotal = mismatchCounter;
      staffSummary.hasMismatch = mismatchCounter > 0;
      staffSummary.extendedTotal = parseFloat(
        staffSummary.allShifts
          .reduce(
            (sum, s) => sum + (parseFloat(s.Extended_Duration__c) || 0),
            0
          )
          .toFixed(2)
      );

      // 🧾 Reimbursements
      staffSummary.allShifts.forEach((s) => {
        if (Array.isArray(s.Reimbursements__r)) {
          s.Reimbursements__r.forEach((r) => {
            staffSummary.mileageAmountSum += parseFloat(
              r.Mileage_Amount__c || 0
            );
            staffSummary.mileageOthersSum += parseFloat(
              r.Mileage_Others__c || 0
            );
          });
        }
      });

      staffSummary.mileageAmountSum = parseFloat(
        (staffSummary.mileageAmountSum || 0).toFixed(2)
      );
      staffSummary.mileageOthersSum = parseFloat(
        (staffSummary.mileageOthersSum || 0).toFixed(2)
      );

      this.memberSummaries.push(staffSummary);
    });

    console.log(
      "✅ Final memberSummaries:",
      JSON.stringify(this.memberSummaries, null, 2)
    );

    if (this.exportFormat === "PDF") {
      this.handleDownloadPDFFortimesheet();
    } else if (this.exportFormat === "CSV") {
      this.handleDownloadClickfortimesheet();
    }
  }

  get paginatedSummaries() {
    const summaries = this.memberSummaries || [];
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const paginated = summaries.slice(start, end);

    console.log("📌 memberSummaries:", JSON.parse(JSON.stringify(summaries)));
    console.log(
      "➡️ currentPage:",
      this.currentPage,
      "pageSize:",
      this.pageSize
    );
    console.log("➡️ start:", start, "end:", end);
    console.log(
      "📄 paginatedSummaries:",
      JSON.parse(JSON.stringify(paginated))
    );

    return paginated;
  }

  get processedSummaries() {
    console.log("🚀 Processing Staff Data...");
    return this.paginatedSummaries.map((staff) => {
      console.log("👤 Staff Record:", JSON.stringify(staff, null, 2));

      const shiftRows = this.weekDays.map((day, index) => {
        console.log(`📅 Checking Day: ${day.date} (Index: ${index})`);

        const shift = (staff.shifts || []).find(
          (s) => s.date === day.date && s.isForDay
        );
        console.log("🔍 Matching Shift:", JSON.stringify(shift, null, 2));

        const row = {
          key: `${staff.id}-${day.date}`,
          hasShift: !!shift,
          hours: shift?.hours || "",
          cellClass: shift?.cellClass || ""
        };
        console.log("➡️ Shift Row Built:", JSON.stringify(row, null, 2));
        return row;
      });

      const processedStaff = {
        ...staff,
        shiftRows
      };
      console.log(
        "✅ Processed Staff:",
        JSON.stringify(processedStaff, null, 2)
      );
      return processedStaff;
    });
  }

  handleDownloadClickfortimesheet() {
    console.log("📥 handleDownloadClickfortimesheet triggered");

    // 👉 Helper to format date as dd/mm/yyyy
    function formatDate(date) {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // 👉 Generate header with dates between ExportStartDate and ExportEndDate
    const header = ["Staff"];
    let current = new Date(this.ExportStartDate);
    const end = new Date(this.ExportEndDate);

    console.log(
      "📅 Export Start:",
      this.ExportStartDate,
      "| Export End:",
      this.ExportEndDate
    );

    while (current <= end) {
      header.push(formatDate(current)); // ✅ dd/mm/yyyy
      console.log("   ➕ Added header column for date:", formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    // Add totals
    header.push(
      "Total (hr)",
      "Mileage (km)",
      "Expense",
      "Sleepover (hr)",
      "Variance (hr)"
    );
    console.log("📑 Final header:", header);

    const totalCols = header.length;

    // 👉 Facility label row (centered)
    const centerIndex = Math.floor(totalCols / 2);
    const mergedRow = [];
    for (let i = 0; i < totalCols; i++) {
      if (i === centerIndex) {
        mergedRow.push(`"Facility: ${this.facSelectedLabel || "N/A"}"`);
      } else {
        mergedRow.push("");
      }
    }
    console.log("🏥 Facility row:", mergedRow);

    // Combine heading + header
    let csvContent = mergedRow.join(",") + "\n" + header.join(",") + "\n";

    // 👉 Build each staff row
    console.log("👥 Processing staff summaries:", this.processedSummaries);
    this.processedSummaries.forEach((staff) => {
      console.log(`\n👤 Building row for staff: ${staff.nameToDisplay}`);
      const row = [];
      row.push(`"${staff.nameToDisplay}"`);

      let totalHours = 0;
      let totalMileage = 0;
      let totalExpense = 0;
      let totalSleepover = 0;
      let totalVariance = 0;

      // Loop from startDate → endDate and align shifts under correct date
      let current = new Date(this.ExportStartDate);
      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0]; // shift data in YYYY-MM-DD
        const shift = staff.shifts.find((s) => s.date === dateStr);

        if (shift) {
          console.log(
            `   📅 ${dateStr} → Hours: ${shift.hours}, Mileage: ${shift.mileage}, Expense: ${shift.expense}, Sleepover: ${shift.sleepoverHours}, Variance: ${shift.variance}`
          );
          row.push(shift.hours);
          totalHours += Number(shift.hours) || 0;
          totalMileage += Number(shift.mileage) || 0;
          totalExpense += Number(shift.expense) || 0;
          totalSleepover += Number(shift.sleepoverHours) || 0;
          totalVariance += Number(shift.variance) || 0;
        } else {
          console.log(`   📅 ${dateStr} → No shift found`);
          row.push("-");
        }

        current.setDate(current.getDate() + 1);
      }

      // Add recalculated totals
      row.push(
        totalHours.toFixed(2),
        totalMileage.toFixed(2),
        `"${totalExpense ? `$${totalExpense.toFixed(2)}` : "$0.00"}"`,
        totalSleepover.toFixed(2),
        totalVariance.toFixed(2)
      );

      console.log(
        "   📊 Totals → Hours:",
        totalHours,
        "Mileage:",
        totalMileage,
        "Expense:",
        totalExpense,
        "Sleepover:",
        totalSleepover,
        "Variance:",
        totalVariance
      );
      console.log("   ✅ Final staff row:", row);

      csvContent += row.join(",") + "\n";
    });

    // 👉 Download CSV
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "TimesheetData.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log("💾 CSV Download started → TimesheetData.csv");
    this.isModalOpenfortimesheetExport = false;
  }

  handleDownloadPDFFortimesheet() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.warn("⚠️ jsPDF is not loaded yet!");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    const formatDate = (date) => {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear())}`;
    };

    // Build full list of dates
    const allDates = [];
    let current = new Date(this.ExportStartDate);
    const end = new Date(this.ExportEndDate);
    while (current <= end) {
      allDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Chunk dates into groups of 7
    const chunkSize = 7;
    const dateChunks = [];
    for (let i = 0; i < allDates.length; i += chunkSize) {
      dateChunks.push(allDates.slice(i, i + chunkSize));
    }

    // Loop through each chunk and create a table
    dateChunks.forEach((chunk, chunkIndex) => {
      if (chunkIndex > 0) doc.addPage();

      doc.text(
        `${this.facilityPreferredName || "N/A"}: ${this.facSelectedLabel || "N/A"}`,
        148,
        15,
        { align: "center" }
      );

      const header = [
        "Staff",
        ...chunk.map((d) => formatDate(d)),
        "Total (hr)",
        "Mileage (km)",
        "Expense",
        "Sleepover (hr)",
        "Variance (hr)"
      ];

      const body = this.processedSummaries.map((staff) => {
        const row = [staff.nameToDisplay];
        let totalHours = 0,
          totalMileage = 0,
          totalExpense = 0,
          totalSleepover = 0,
          totalVariance = 0;

        chunk.forEach((date) => {
          const dateStr = date.toISOString().split("T")[0];
          const shift = staff.shifts.find((s) => s.date === dateStr);
          if (shift) {
            row.push(shift.hours);
            totalHours += Number(shift.hours) || 0;
            totalMileage += Number(shift.mileage) || 0;
            totalExpense += Number(shift.expense) || 0;
            totalSleepover += Number(shift.sleepoverHours) || 0;
            totalVariance += Number(shift.variance) || 0;
          } else {
            row.push("-");
          }
        });

        row.push(
          totalHours.toFixed(2),
          totalMileage.toFixed(2),
          totalExpense ? `$${totalExpense.toFixed(2)}` : "$0.00",
          totalSleepover.toFixed(2),
          totalVariance.toFixed(2)
        );

        return row;
      });

      const colWidths = [30];
      const dynamicWidth =
        (doc.internal.pageSize.getWidth() - 40) / (header.length - 1);
      for (let i = 0; i < header.length - 1; i++) colWidths.push(dynamicWidth);

      doc.autoTable({
        head: [header],
        body: body,
        startY: 25,
        margin: 5,
        theme: "grid",
        styles: {
          fontSize: 7,
          halign: "center",
          valign: "middle",
          minCellHeight: 15
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 8,
          halign: "center"
        },
        columnStyles: colWidths.reduce((acc, width, index) => {
          acc[index] = { cellWidth: width, minCellWidth: width };
          return acc;
        }, {})
      });
    });

    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getFullYear()).slice(-2)}`;
    doc.save(`Timesheet_${formattedDate}.pdf`);
    this.isModalOpenfortimesheetExport = false;
  }
}