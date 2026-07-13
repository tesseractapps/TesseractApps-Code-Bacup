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
import updateSelectedBreakCheckboxes from "@salesforce/apex/SignInController.updateSelectedBreakCheckboxes";
import insertTimeSheet from "@salesforce/apex/XeroIntegrationTimeSheet.insertTimeSheet";
import getMyobAuthLink from '@salesforce/apex/MyobIntegrationController.getMyobAuthLink';
import exchangeMyobCodeForToken from '@salesforce/apex/MyobIntegrationController.exchangeMyobCodeForToken';
import getMyobCompanyFiles  from '@salesforce/apex/MyobIntegrationController.getMyobCompanyFiles';
import getCompanyFileDetails  from '@salesforce/apex/MyobIntegrationController.getCompanyFileDetails';
import createMyobTimesheet from "@salesforce/apex/MyobIntegrationController.createMyobTimesheet";
import getShiftServiceAndSupportPlans from "@salesforce/apex/RosterTimeSheetController.getShiftServiceAndSupportPlans";
import getClientJournals from "@salesforce/apex/RosterTimeSheetController.getClientJournals";
import getDynamicFormsByIds from '@salesforce/apex/RosterTimeSheetController.getDynamicFormsByIds';
import getOrgLogo from "@salesforce/apex/IncidentRegisterControllerV2.getOrgLogo";

let jsPDF;


const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};


export default class tesseractAppsRosterTimeSheetLwc extends LightningElement {
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
 // @track isExtendedShift = false;
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
  @track isShowForms = false;
  @track isTemplateMode = false;
  @track showSpinner = false;
  @track currentViewFlag = "";
  @track isModalOpen = false;
  @track currentUrl;
  @track isShowActivity = false;
  @track journalList = [];
  @track isShowJournal = false;
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
  @track staffPreferredName;
  @track selectedStaffShiftsforPDF = [];
  @track showExportRange = false;
  @track isModalOpenfortimesheetExport = false;
  @track frequency;
  @track startDate;
  @track exportRange;
  @track exportFormat;
  @track endDateforDownload;
  jsPdfInitialized = false;
  @track selectAllChecked = false;
  @track isLocalStorageDate = false;
  @track isHourlyRateDisabled = true;
  @track Accountingtitle;
  @track AccountingServices;
  @track selectedView = 'All';
  @track nameFilter = '';

  @track endTimeSelectedHour1;
  @track endTimeSelectedMinute1;
  @track endTimeAMPM1;
  @track AddShiftEndTimeAMPM1;

  @track startTimeSelectedHour1;
  @track startTimeSelectedMinute1;
  @track startTimeAMPM1;
  @track AddShiftStartTimeAMPM1;

  @track isLoginTimeforEdit;
  @track isLogoutTimeforEdit;

  @track endTimeInMs;
  @track startTimeInMs;
  @track bufferTime;
  @track xeroFlag = false;
  @track disableTimeButton=false;
  @track  statusMap = {
      accepted:     { icon: "check_circle", css: "status-accepted" },
      inprogress:   { icon: "hourglass_top", css: "status-inprogress" },
      completed:    { icon: "task_alt", css: "status-completed" },
      cancelled:    { icon: "cancel", css: "status-cancelled" }
    };

  frequencyOptions = [
    { label: "Weekly", value: "Weekly" },
    { label: "Fortnightly", value: "Fortnightly" },
    { label: "Monthly", value: "Monthly" }
  ];

  formatOptions = [
    { label: "CSV", value: "CSV" },
    { label: "PDF", value: "PDF" }
  ];

  @track breakTimeRecords = [];
  activeSections = [
    "StaffDetails",
    "OriginalStaffDetails",
    "CompletedStaffDetails",
    "ExtendedShift",
    "SleepoverShift",
    "CompletedStaffDetails1",
    "BreakTimingsDetails",
    "brokenShiftDetails"
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
    CustomShift: true,
    BreakTimingsDetails: true,
    brokenShiftDetails:true
  };

  viewOptions = [
      {label: 'All', value: 'All'},
      { label: 'Auto Approved', value: 'autoApproved' },
      { label: 'Review Required', value: 'reviewRequired' }
  ];


  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }

  // @track sectionIcons = {
  //   staffDetails: "\u2B9F",
  //   OriginalStaffDetails: "\u2B9F",
  //   CompletedStaffDetails: "\u2B9F",
  //   CompletedStaffDetails1: "\u2B9F",
  //   ExtendedShift: "\u2B9F",
  //   SleepoverShift: "\u2B9F",
  //   longMorningShift: "\u2B9F",
  //   longAfternoonShift: "\u2B9F",
  //   longNightShift: "\u2B9F",
  //   LongSleepoVershift: "\u2B9F",
  //   CustomShift: "\u2B9F",
  //   BreakTimingsDetails: "\u2B9F"
  // };
@track sectionIcons = {
  StaffDetails: { ...ICON_DOWN },
  OriginalStaffDetails: { ...ICON_DOWN },
  CompletedStaffDetails: { ...ICON_DOWN },
  CompletedStaffDetails1: { ...ICON_DOWN },
  ExtendedShift: { ...ICON_DOWN },
  SleepoverShift: { ...ICON_DOWN },
  longMorningShift: { ...ICON_DOWN },
  longAfternoonShift: { ...ICON_DOWN },
  longNightShift: { ...ICON_DOWN },
  LongSleepoVershift: { ...ICON_DOWN },
  CustomShift: { ...ICON_DOWN },
  BreakTimingsDetails: { ...ICON_DOWN },
  brokenShiftDetails:{...ICON_DOWN}
};
@track isBrokenShift=false;


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
  @track orignalShiftTime;
  @track brokenExtendedWage;
  @track brokenExtendedRate;
  @track brokenExtendedDuration;
  @track staffEmployementType;
  @track shiftEndDate;
  @track brokenAllowance;
  @track schadsMinimumEngageApplied=false;
  @track showOverTimeRate;
  @track totalOverTimeWages=0; 


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
      this.loadShiftData();
    } else if (error) {
      this.error = error;
      console.error("Error loading shift data:", error);
    }
  }


handleSectionToggle(event) {
  const sectionId = event.currentTarget.dataset.id;
  const sectionElement = this.template.querySelector(
    `[data-section="${sectionId}"]`
  );

  if (!sectionElement) {
    return;
  }

  sectionElement.classList.toggle('hidden-section');

  this.sectionIcons[sectionId] =
    sectionElement.classList.contains('hidden-section')
      ? { ...ICON_LEFT }
      : { ...ICON_DOWN };
}



  connectedCallback() {
      const today = new Date();

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      this.businessId = urlParams.get('businessId');

      if (!this.businessId) {
          console.log('❌ businessId is NULL at initial load');
      } else {
          console.log('✅ businessId:', this.businessId);
      }

      console.log('🔹 businessId:', this.businessId);
      console.log('🔹 [Step 1.1] URL params parsed:', urlParams.toString());
      console.log('🔹 [Step 1.2] Code from URL:', code);
      console.log('🔹 [Step 1.3] window.location.origin:', window.location.origin);
      console.log('🔹 [Step 1.4] window.location.href:', window.location.href);

      // ---------------------------------------------------
      // ⭐ Run MYOB exchange when redirect code detected
      // ---------------------------------------------------
      if (code) {
          console.log('🔵 Running token exchange flow for MYOB...');
          this.exchangeCodeAndCloseTab(code);  // NO RETURN HERE
      }

      // ---------------------------------------------------
      // ⭐ Run normal UI initialization ALWAYS
      // ---------------------------------------------------
      this.datePickerString = today.toISOString().split("T")[0];

      this.initializeFacilityAndOrgDetails();

      this.participantPreferredName =
        localStorage.getItem("defaultParticipantPreferredName") || "Participant";

      this.facilityPreferredName =
        localStorage.getItem("defaultFacilityPreferredName") || "Facility";

      this.staffPreferredName =
        localStorage.getItem("defaultStaffPreferredName") || "Staff";

      this.navigateBackToPrevious();

      window.addEventListener('keydown', this.handleKeyShortcut.bind(this));

       if (this.orgid) {

        getOrgLogo({ orgId: this.orgid })
          .then((src) => {

            console.log("🏷️ Org Logo SRC:", src);

            if (!src) {
              console.warn("⚠️ Org logo not found");
              this.orgLogoUrl = "";
              return;
            }

            // decode html entities (&amp; etc)
            const txt = document.createElement("textarea");
            txt.innerHTML = src;
            const decodedSrc = txt.value;

            // convert relative → absolute
            this.orgLogoUrl = decodedSrc.startsWith("/")
              ? window.location.origin + decodedSrc
              : decodedSrc;

            console.log("✅ Final orgLogoUrl:", this.orgLogoUrl);

          })
          .catch((err) => {
            console.error("❌ Failed to load Org Logo:", err);
            this.orgLogoUrl = "";
          });

      } else {
        console.log('⏳ Waiting for org id before loading forms…');
      }
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
  }

  navigateBackToPrevious() {
    const savedView = localStorage.getItem("timesheetViewFlag");
    const savedStaffId = localStorage.getItem("timesheetStaffId");
    const savedStaffName = localStorage.getItem("timesheetStaffName");
    const isCheckedStored = localStorage.getItem("timesheetIsChecked");
    const savedWeekStart = localStorage.getItem("timesheetWeekStartDate");
    const savedWeekEnd = localStorage.getItem("timesheetWeekEndDate");
    const savedDatePicker = localStorage.getItem("timesheetDatePicker");
    // const savedTimesheetSelectedFacility = localStorage.getItem('timesheetSelectedFacility');
    // this.facSelectedValue = savedTimesheetSelectedFacility;
    if (savedDatePicker) {
      this.currentDate = new Date(savedDatePicker);
      this.datePickerString = savedDatePicker;
      console.log("📅 Restored saved datePickerString:", savedDatePicker);
    } else {
      const today = new Date();
      this.currentDate = today;
      this.datePickerString = today.toISOString().split("T")[0];
    }

    if (!savedView || !savedStaffId) {
      console.log("🔁 No previous view to restore");
      return;
    }
    this.StaffId = savedStaffId;
    this.StaffName1 = savedStaffName;
    console.log("savedWeekStart in navigateBackToPrevious : ", savedWeekStart);
    console.log("savedWeekEnd in navigateBackToPrevious : ", savedWeekEnd);
    if (savedWeekStart || savedWeekEnd) {
      this.weekStartDate = savedWeekStart;
      console.log(
        "this.weekStartDate in navigateBackToPrevious after savedWeekStart : ",
        this.weekStartDate
      );
      this.weekEndDate = savedWeekEnd;
      console.log(
        "this.weekEndDate in navigateBackToPrevious  after savedWeekEnd: ",
        this.weekEndDate
      );
      this.isLocalStorageDate = true;
      // this.datePickerString = savedWeekStart;
    } else {
      this.isLocalStorageDate = false;
      // const today = new Date();
      // this.datePickerString = today.toISOString().split("T")[0];

      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      const sunday = new Date(today);

      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      monday.setDate(today.getDate() + diffToMonday);
      sunday.setDate(monday.getDate() + 6);

      this.weekStartDate = monday.toISOString().split("T")[0];
      this.weekEndDate = sunday.toISOString().split("T")[0];
      this.datePickerString = this.weekStartDate;

      console.log("Week Start:", this.weekStartDate);
      console.log("Week End:", this.weekEndDate);

      this.initializeWeekDays();
    }

    console.log(
      `🔁 Restoring view IN connectedCallback : ${savedView}, Staff: ${savedStaffName} (${savedStaffId})`
    );
    switch (savedView) {
      case "mismatch":
        this.handleMismatchClick({
          currentTarget: {
            dataset: {
              staffId: savedStaffId,
              staffName: savedStaffName
            }
          }
        });
        break;

      case "check":
        this.handleCheckClick({
          currentTarget: {
            dataset: {
              staffId: savedStaffId,
              staffName: savedStaffName
            }
          }
        });
        break;

      case "checkbox":
        const isChecked = isCheckedStored === "true";
        this.isChecked = isChecked;

        this.handleCheckboxChange({
          target: {
            checked: isChecked
          }
        });
        break;

      default:
        console.warn("⚠️ Unknown savedViewFlag:", savedView);
    }
  }

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
      // const savedTimesheetSelectedFacility = localStorage.getItem('timesheetSelectedFacility');
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
        this.bufferTime = org.Auto_Approve_Buffer__c;
        if (org.Accounting_Services__c === 'Xero') {
            this.xeroFlag = true;
            this.AccountingServices = 'Xero';
            this.Accountingtitle = "Send to Xero";
        }
        if (org.Accounting_Services__c === 'MYOB') {
            this.xeroFlag = true;
            this.AccountingServices = 'MYOB';
            this.Accountingtitle = "Send to MYOB";
        }
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
        this.originalStaff = result;
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
    //localStorage.setItem('timesheetSelectedFacility',  this.facSelectedValue);
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
  @track localStartDate;
    initializeWeekDays() {
    //console.log('this.currentDate in  initializeWeekDays : ',this.currentDate)
    this.localStartDate = this.getStartOfWeek(this.currentDate);
    // const currentDate =  this.formatDate(this.currentDate);
    //  console.log('currentDate in  initializeWeekDays : ',currentDate)
    console.log(
      "this.isLocalStorageDate in  initializeWeekDays : ",
      this.isLocalStorageDate
    );
    console.log("this.currentDate in  initializeWeekDays : ", this.currentDate);
    console.log(
      "this.weekStartDate in  initializeWeekDays : ",
      this.weekStartDate
    );
    if (!this.isLocalStorageDate) {
      this.localStartDate = this.getStartOfWeek(this.currentDate); // First day of the week
      console.log(
        " this.localStartDate in  initializeWeekDays : ",
        this.localStartDate
      );
    } else {
      const parsedDate = new Date(this.weekStartDate); // ✅ Fix: convert string to Date
      this.localStartDate = this.getStartOfWeek(parsedDate);
      console.log(
        " this.localStartDate in  initializeWeekDays  in else : ",
        this.localStartDate
      );
      this.datePickerString = this.weekStartDate;
    }

    const endDate = new Date(this.localStartDate); // Last day = start + 6 days
    endDate.setDate(endDate.getDate() + 6);

    // Store formatted for display
    this.firstDateFormatted = this.formatDate1(this.localStartDate);
    this.lastDateFormatted = this.formatDate1(endDate);

    // Store formatted for input[type="date"]
    if (!this.isLocalStorageDate) {
      console.log("this.isLocalStorageDate ");
      this.weekStartDate = this.formatDateForInput(this.localStartDate);
      this.weekEndDate = this.formatDateForInput(endDate);
    }

    const todayStr = this.formatDate(new Date());
    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(this.localStartDate);
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
        this.map = L.map(mapContainer, {
        attributionControl: false 
      }).setView(
        [this.jsonData[0].coords.latitude, this.jsonData[0].coords.longitude],
        20
      );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: ""
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
    console.log("==================== generateMockData START ====================");
    console.log("Generating mock data...");

    this.staffMembers = [];
    const staffMap = new Map();
    console.log("Step 1: Raw generatedShiftMap data >>", JSON.stringify(this.generatedShiftMap, null, 2));

    // 1. Collect all shifts into staffMap
    console.log("Step 2: Collecting shifts into staffMap");
    if (this.generatedShiftMap) {
        console.log(`Processing ${Object.keys(this.generatedShiftMap).length} dates in generatedShiftMap`);
        
        Object.entries(this.generatedShiftMap).forEach(([date, shifts], dateIndex) => {
            console.log(`\n--- Processing date ${dateIndex + 1}: ${date} ---`);
            console.log(`Number of shifts on ${date}: ${shifts.length}`);
            
            shifts.forEach((shift, shiftIndex) => {
                console.log(`  Shift ${shiftIndex + 1}: ID=${shift.Id}, Staff=${shift.Staff__c}, Name=${shift.Staff__r?.Display_Nickname__c}`);
                
                const staffId = shift.Staff__c;
                const staffName = shift.Staff__r?.Display_Nickname__c || "Unknown";
                console.log(`    Staff ID: ${staffId}, Staff Name: ${staffName}`);

                if (!staffMap.has(staffId)) {
                    console.log(`    👉 Creating new staff entry in map for ${staffName}`);
                    staffMap.set(staffId, {
                        staffId,
                        staffName,
                        nameToDisplay: staffName,
                        allShifts: [],
                        shifts: [],
                        shiftRows: [],
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
                } else {
                    console.log(`    ✅ Staff ${staffName} already exists in map`);
                }

                const staffEntry = staffMap.get(staffId);
                staffEntry.allShifts.push(shift);
                console.log(`    ➕ Added shift ${shift.Id} to staff ${staffName}'s allShifts`);
            });
        });
    } else {
        console.log("⚠️ generatedShiftMap is null or undefined");
    }

    console.log(`\nStep 3: StaffMap created with ${staffMap.size} unique staff members`);
    staffMap.forEach((staff, staffId) => {
        console.log(`  Staff ${staff.staffName}: ${staff.allShifts.length} shifts`);
    });

    // 2. Ensure allStaff is defined
    console.log("\nStep 4: Checking allStaff array");
    if (!Array.isArray(this.allStaff)) {
        console.warn("⚠️ this.allStaff is undefined or not an array. Initializing as empty array.");
        this.allStaff = [];
    }
    console.log(`allStaff has ${this.allStaff.length} records`);

    // 3. Build final staffMembers list
    console.log("\nStep 5: Building final staffMembers list");
    console.log(`Processing ${this.allStaff.length} staff records from allStaff`);
    
    this.allStaff.forEach((staffRecord, staffIndex) => {
        console.log(`\n--- Processing staff ${staffIndex + 1}: ${staffRecord.Name || 'Unknown'} ---`);
        
        const staffId = staffRecord.Id || staffRecord.staffId;
        const staffName =
              staffRecord.Display_Nickname__c ||
              staffRecord.Name ||
              staffRecord.nameToDisplay ||
              staffRecord.staffName ||
              "Unknown";
        console.log(`Staff ID: ${staffId}, Staff Name: ${staffName}`);

        const baseStaff = staffMap.get(staffId) || {
            staffId,
            staffName,
            nameToDisplay: staffName,
            allShifts: []
        };

        let staff = {
            ...baseStaff,
            shifts: [],
            shiftRows: [],
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
        if (!staff) {
            console.log(`⚠️ Staff ${staffName} not found in staffMap, creating empty entry`);
            staff = {
                staffId,
                staffName,
                nameToDisplay: staffName,
                allShifts: [],
                shifts: [],
                shiftRows: [],
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
        } else {
            console.log(`✅ Found ${staff.allShifts.length} shifts for staff ${staffName} in staffMap`);
        }

        // Initialize shifts array
        console.log(`Step 5a: Initializing shifts array`);
        const filteredShifts = baseStaff.allShifts.filter(shift => {
        const duration = parseFloat(shift.Duration__c) || 0;
        const extended = parseFloat(shift.Extended_Duration__c) || 0;
        const actual = parseFloat(shift.Actual_Duration__c) || 0;
        const bufferMinutes = parseFloat(shift.Buffer_Time_Formula__c) || 0;
        const bufferHours = bufferMinutes / 60;

        const totalWorked = actual + extended;
        const isMismatch = Math.abs(totalWorked - duration) > bufferHours;

        const approvalStatus = shift.Approval_Status__c;

        // 🔹 VIEW FILTERING
        if (this.selectedView === 'All') {
            return true;
        }

        if (this.selectedView === 'autoApproved') {
            return approvalStatus === 'Approved';
        }

        if (this.selectedView === 'reviewRequired') {
            return approvalStatus !== 'Approved';
        }

        return true;
    });

        // 🔁 Decide which shifts to use for totals based on selected view
        const shiftsForTotals =
            this.selectedView === 'All'
                ? baseStaff.allShifts
                : filteredShifts;

        staff.shifts = [];
        let mismatchCount = 0;

        // 📌 Loop through each individual shift
        console.log(`Step 5b: Processing ${staff.allShifts.length} individual shifts`);
        filteredShifts.forEach((shift, shiftIndex) => {
            console.log(`\n  Shift ${shiftIndex + 1}: ${shift.Id} on ${shift.Date__c}`);
            
            const variance = shift.Variance_Wage__c || 0;
            const duration = parseFloat(shift.Duration__c) || 0;
            const extended = parseFloat(shift.Extended_Duration__c) || 0;
            const actual = parseFloat(shift.Actual_Duration__c) || 0;
            //const breakDuration = parseFloat(shift.Break__c) || 0;
            const breakDuration = (parseFloat(shift.Break__c) || 0) / 60;
            const bufferMinutes = parseFloat(shift.Buffer_Time_Formula__c) || 0;
            const bufferHours = bufferMinutes / 60;

            console.log(`  Duration values:`);
            console.log(`    Duration__c: ${duration}`);
            console.log(`    Extended_Duration__c: ${extended}`);
            console.log(`    Actual_Duration__c: ${actual}`);
            console.log(`    Break__c: ${breakDuration}`);
            console.log(`    Buffer_Time_Formula__c: ${bufferMinutes} minutes = ${bufferHours} hours`);

            // Mismatch calculation
            const totalWorked = actual + extended;
            //const allowedTime = duration + bufferHours;
            //const hasMismatch = Math.abs(totalWorked - duration) >= bufferHours;
            const hasMismatch = Math.abs(totalWorked - duration) > bufferHours;
            
            console.log(`  Mismatch calculation:`);
            //console.log(`    totalWorked = actual + breakDuration + extended = ${actual} + ${breakDuration} + ${extended} = ${totalWorked}`);
            //console.log(`    allowedTime = duration + bufferHours = ${duration} + ${bufferHours} = ${allowedTime}`);
            //console.log(`    Difference = |${totalWorked} - ${allowedTime}| = ${Math.abs(totalWorked - allowedTime)}`);
            console.log(`  hasMismatch:`, hasMismatch);
            console.log(`    Buffer threshold = ${bufferHours}`);
            //console.log(`    Has mismatch? ${Math.abs(totalWorked - allowedTime)} >= ${bufferHours} ? ${hasMismatch}`);

            if (hasMismatch) {
                mismatchCount++;
                console.log(`  ⚠️ This shift has a MISMATCH! Total mismatch count: ${mismatchCount}`);
            }

            // Collect client and service names
            console.log(`  Collecting client and service names...`);
            const clientNames = new Set();
            const serviceName = new Set();

            if (Array.isArray(shift.Services_and_Support_Plans__r)) {
                console.log(`    Found ${shift.Services_and_Support_Plans__r.length} services`);
                shift.Services_and_Support_Plans__r.forEach((service, serviceIndex) => {
                    const client = service.Client__r;
                    if (client) {
                        const fullName = `${client.First_Name__c || ""} ${client.Last_Name__c || ""}`.trim();
                        clientNames.add(fullName);
                        console.log(`    Service ${serviceIndex + 1}: Client = ${fullName}`);
                    }

                    const fundTracker = service.Funds_Tracker__r;
                    if (fundTracker?.Name) {
                        serviceName.add(fundTracker.Name);
                        console.log(`    Service ${serviceIndex + 1}: Fund Tracker = ${fundTracker.Name}`);
                    }
                });
            } else {
                console.log(`    No services found for this shift`);
            }

            // Calculate logged hours
            console.log(`  Calculating logged hours...`);
            const logIn = shift.Log_In_Date_Time__c;
            const logOut = shift.Log_Out_Date_Time__c;
            const totalLoggedHours = logIn && logOut ? this.calculateHoursDifference(logIn, logOut) : 0;
            console.log(`    Log In: ${logIn}, Log Out: ${logOut}`);
            console.log(`    Total logged hours: ${totalLoggedHours}`);
            console.log(`    Formatted logged hours: ${this.formatHoursToHrMin(totalLoggedHours)}`);

            // Create shift object
            const shiftObj = {
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
            };

            staff.shifts.push(shiftObj);
            console.log(`  ✅ Added shift to staff.shifts array`);
        });

        // ✅ Build day-wise shiftRows for UI
        console.log(`\nStep 5c: Building day-wise shiftRows for UI`);
        console.log(`Week days count: ${this.weekDays.length}`);
        
        staff.shiftRows = this.weekDays.map((day, dayIndex) => {
            const date = day.date;
            console.log(`  Day ${dayIndex + 1}: ${date}`);
            
            const shiftsForDay = filteredShifts.filter(
                (s) => s.Date__c === date
            );
            console.log(`    Found ${shiftsForDay.length} shifts for this date`);
            
            // Sum all durations for this staff on this date
            const dayTotal = shiftsForDay.reduce(
                (sum, s) => sum + (s.Duration__c || 0),
                0
            );
            console.log(`    Total hours for day: ${dayTotal.toFixed(1)}`);
            
            const hasShift = shiftsForDay.length > 0;
            console.log(`    Has shift? ${hasShift}`);
            
            return {
                key: `${staff.staffId}-${date}`,
                hasShift: hasShift,
                hours: dayTotal > 0 ? dayTotal.toFixed(1) : null,
                cellClass: shiftsForDay.length > 0 ? "slds-theme_info" : ""
            };
        });

        // Calculate staff statistics
        console.log(`\nStep 5d: Calculating staff statistics`);
        
        staff.hasShiftForAnyDay = staff.shifts.length > 0;
        console.log(`hasShiftForAnyDay: ${staff.hasShiftForAnyDay} (${staff.shifts.length} shifts)`);
        
        staff.totalDuration = shiftsForTotals.reduce(
            (sum, s) => sum + (s.Duration__c || 0),
            0
        );
        console.log(`totalDuration: ${staff.totalDuration}`);
        
        staff.totalMileage = shiftsForTotals.reduce(
            (sum, s) => sum + (s.Mileage__c || 0),
            0
        );
        console.log(`totalMileage: ${staff.totalMileage}`);
        
        staff.totalExpense = shiftsForTotals.reduce(
            (sum, s) => sum + (s.Expense__c || 0),
            0
        );
        console.log(`totalExpense: ${staff.totalExpense}`);
        
        staff.totalSleepoverHours = shiftsForTotals.reduce(
            (sum, s) => sum + (s.Sleepover_Shift_Hours__c || 0),
            0
        );
        console.log(`totalSleepoverHours: ${staff.totalSleepoverHours}`);
        
        staff.varianceCount = shiftsForTotals.reduce(
            (sum, s) => sum + (s.Variance_Wage__c || 0),
            0
        );
        console.log(`varianceCount: ${staff.varianceCount}`);
        
        staff.mismatchCount = mismatchCount;
        staff.hasMismatch = mismatchCount > 0;
        console.log(`mismatchCount: ${mismatchCount}, hasMismatch: ${staff.hasMismatch}`);
        
        staff.totalvariance = parseFloat(
            shiftsForTotals
                .reduce(
                    (sum, s) => sum + (parseFloat(s.Extended_Duration__c) || 0),
                    0
                )
                .toFixed(2)
        );
        console.log(`totalvariance: ${staff.totalvariance}`);

        // 🧾 Reimbursement Totals
        console.log(`\nStep 5e: Calculating reimbursement totals`);
        let totalMileageAmount = 0;
        let totalMileageOthers = 0;
        
        shiftsForTotals.forEach((s, shiftIndex) => {
            if (Array.isArray(s.Reimbursements__r)) {
                console.log(`  Shift ${shiftIndex + 1}: ${s.Reimbursements__r.length} reimbursements`);
                s.Reimbursements__r.forEach((reimbursement, reimIndex) => {
                    const mileageAmount = parseFloat(reimbursement.Mileage_Amount__c || 0);
                    const mileageOthers = parseFloat(reimbursement.Mileage_Others__c || 0);
                    
                    totalMileageAmount += mileageAmount;
                    totalMileageOthers += mileageOthers;
                    
                    console.log(`    Reimbursement ${reimIndex + 1}: Amount=${mileageAmount}, Others=${mileageOthers}`);
                });
            } else {
                console.log(`  Shift ${shiftIndex + 1}: No reimbursements`);
            }
        });
        
        staff.totalMileageAmount = parseFloat(totalMileageAmount.toFixed(2));
        staff.totalMileageOthers = parseFloat(totalMileageOthers.toFixed(2));
        console.log(`Final totals: Mileage Amount=${staff.totalMileageAmount}, Mileage Others=${staff.totalMileageOthers}`);

        // Add staff to final array
        this.staffMembers.push(staff);
        console.log(`✅ Added staff ${staffName} to staffMembers array`);
    });

    console.log("\nStep 6: Final summary");
    console.log(`Total staffMembers created: ${this.staffMembers.length}`);
    console.log("Final staffMembers data structure:", JSON.stringify(this.staffMembers, null, 2));
    
    // Log summary statistics
    const totalShifts = this.staffMembers.reduce((sum, staff) => sum + staff.allShifts.length, 0);
    const staffWithShifts = this.staffMembers.filter(staff => staff.allShifts.length > 0).length;
    const totalMismatches = this.staffMembers.reduce((sum, staff) => sum + staff.mismatchCount, 0);
    
    console.log("\n📊 SUMMARY STATISTICS:");
    console.log(`Total staff: ${this.staffMembers.length}`);
    console.log(`Staff with shifts: ${staffWithShifts}`);
    console.log(`Total shifts: ${totalShifts}`);
    console.log(`Total mismatches: ${totalMismatches}`);
    console.log(`Total duration: ${this.staffMembers.reduce((sum, staff) => sum + staff.totalDuration, 0)} hours`);
    
    console.log("\nStep 7: Calling loadShiftData");
    this.staffMembers = [...this.staffMembers];
    this.loadShiftData();
    
    console.log("==================== generateMockData END ====================");
  }


  handleViewChange(event) {
      this.selectedView = event.detail.value;
      this.generateMockData();
  }

  applyShiftFilter() {
      if (!Array.isArray(this.staffMembers)) {
          return;
      }

      this.staffMembers = this.staffMembers.map(staff => {
          const allShifts = staff.allDisplayShifts || [];

          let filteredShifts;
          switch (this.selectedView) {
              case 'autoApproved':
                  // ✅ Approved = NO mismatch
                  filteredShifts = allShifts.filter(s => !s.hasMismatch);
                  break;

              case 'reviewRequired':
                  // ⚠️ Review Required = mismatch
                  filteredShifts = allShifts.filter(s => s.hasMismatch);
                  break;

              default:
                  // 🔁 All
                  filteredShifts = [...allShifts];
          }

          // Rebuild day rows
          const shiftRows = this.weekDays.map(day => {
              const dayShifts = filteredShifts.filter(
                  s => s.date === day.date
              );

              const totalHours = dayShifts.reduce(
                  (sum, s) => sum + (parseFloat(s.hours) || 0),
                  0
              );

              return {
                  key: `${staff.staffId}-${day.date}`,
                  hasShift: dayShifts.length > 0,
                  hours: totalHours > 0 ? totalHours.toFixed(1) : null,
                  cellClass: dayShifts.length > 0 ? "slds-theme_info" : ""
              };
          });

          return {
              ...staff,
              shifts: filteredShifts,
              shiftRows,
              hasShiftForAnyDay: filteredShifts.length > 0
          };
      });
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
    localStorage.setItem("timesheetDatePicker", this.datePickerString);

    console.log("Start of Week:", this.weekStartDate);
    console.log("End of Week:", this.weekEndDate);

    // Refresh UI
    this.loadShiftData();
    this.initializeWeekDays();
  }

 /*  handlePrevWeek() {
    // ✅ Move back 7 days from selected date
    this.currentDate.setDate(this.currentDate.getDate() - 7);

    // ✅ Start = currentDate itself
    const startDate = new Date(this.currentDate);

    // ✅ End = +6 days
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    this.weekStartDate = this.formatDate(startDate);
    this.weekEndDate = this.formatDate(endDate);

    this.datePickerString = this.formatDateToString(this.currentDate);
    localStorage.setItem("timesheetDatePicker", this.datePickerString);

    console.log("Start of Week:", this.weekStartDate);
    console.log("End of Week:", this.weekEndDate);

    this.loadShiftData();
    this.initializeWeekDays();
} */

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
    localStorage.setItem("timesheetDatePicker", this.datePickerString);

    console.log("Start of Week:", this.weekStartDate);
    console.log("End of Week:", this.weekEndDate);

    this.loadShiftData();
    this.initializeWeekDays();
  }

 /*  handleNextWeek() {
    // ✅ Move forward 7 days
    this.currentDate.setDate(this.currentDate.getDate() + 7);

    const startDate = new Date(this.currentDate);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    this.weekStartDate = this.formatDate(startDate);
    this.weekEndDate = this.formatDate(endDate);

    this.datePickerString = this.formatDateToString(this.currentDate);
    localStorage.setItem("timesheetDatePicker", this.datePickerString);

    console.log("Start of Week:", this.weekStartDate);
    console.log("End of Week:", this.weekEndDate);

    this.loadShiftData();
    this.initializeWeekDays();
} */

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
    localStorage.setItem("timesheetDatePicker", this.datePickerString);

    console.log("Week Start Date:", this.weekStartDate);
    console.log("Week End Date:", this.weekEndDate);

    this.loadShiftData(); // Refresh shift data for selected week
    this.initializeWeekDays(); // Update weekday rendering in UI if needed
  }

 /*  navigateToDay(event) {
    const selectedDateString = event.target.value;
    const selectedDate = new Date(selectedDateString);

    // ✅ Start from selected date directly
    this.currentDate = new Date(selectedDate);
    this.startDate = new Date(selectedDate);

    // ✅ End date = +6 days
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.startDate.getDate() + 6);

    // Update UI values
    this.weekStartDate = this.formatDate(this.startDate);
    this.weekEndDate = this.formatDate(this.endDate);

    this.datePickerString = this.formatDateToString(this.startDate);
    localStorage.setItem("timesheetDatePicker", this.datePickerString);

    console.log("Week Start Date:", this.weekStartDate);
    console.log("Week End Date:", this.weekEndDate);

    // Refresh UI
    this.loadShiftData();
    this.initializeWeekDays();
} */

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

  /* get processedStaff() {
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
  } */

  get processedStaff() {
    console.log("🚀 Processing Staff Data...");
    return this.paginatedStaff.map((staff) => {
      console.log("👤 Staff Record:", JSON.stringify(staff, null, 2));

      const shiftRows = this.weekDays.map((day, index) => {
        console.log(`📅 Checking Day: ${day.date} (Index: ${index})`);

        // Get all shifts for this staff on that date
        const shiftsForDay = (staff.shifts || []).filter(
          (s) => s.date === day.date && s.isForDay
        );
        console.log(
          "🔍 Shifts For Day:",
          JSON.stringify(shiftsForDay, null, 2)
        );

        // Sum hours for all those shifts
        const totalHours = shiftsForDay.reduce(
          (sum, s) => sum + (parseFloat(s.hours) || 0),
          0
        );

        const row = {
          key: `${staff.id}-${day.date}`,
          hasShift: shiftsForDay.length > 0,
          hours: totalHours > 0 ? totalHours.toFixed(1) : "", // ✅ sum result
          cellClass: shiftsForDay?.cellClass || ""
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

   /*  const dayOfWeek = this.currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() + diffToMonday); */
    const startOfWeek = new Date(this.currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    this.weekStartDate = this.formatDate(startOfWeek);
    this.weekEndDate = this.formatDate(endOfWeek);

    this.currentDate = new Date(startOfWeek); // Move currentDate to Monday of this week
    this.datePickerString = this.formatDateToString(this.currentDate);
    localStorage.setItem("timesheetDatePicker", this.datePickerString);

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
    console.log("==================== handleCheckClick START ====================");
    console.log("Step 1: Check click handler triggered");
    console.log("Event details:", event);
    console.log("Event currentTarget:", event.currentTarget);
    
    // Prevent loop - check if we're already in a mismatch flow
    if (this.isProcessingMismatch) {
        console.log("⚠️ Already processing mismatch, preventing loop");
        console.log("==================== handleCheckClick SKIPPED ====================");
        return;
    }
    
    // Set current view flag
    console.log("Step 2: Setting current view flag to 'check'");
    this.currentViewFlag = "check";
    console.log("this.currentViewFlag set to:", this.currentViewFlag);

    // Extract staff ID from dataset
    console.log("Step 3: Extracting staff ID from dataset");
    const staffId = event.currentTarget.dataset.staffId;
    console.log("Extracted staffId from dataset:", staffId);

    // Check conditions for setting staff name
    console.log("Step 4: Checking conditions for setting staff name");
    console.log("this.editflag:", this.editflag);
    console.log("this.submissionFlag:", this.submissionFlag);
    console.log("this.refresh:", this.refresh);
    
    if (
      this.editflag === false &&
      this.submissionFlag === false &&
      this.refresh === false
    ) {
      console.log("Step 4a: Conditions met - setting staff name");
      const staffName = event.currentTarget.dataset.staffName;
      console.log("Extracted staffName from dataset:", staffName);
      this.StaffName1 = staffName;
      console.log("this.StaffName1 set to:", this.StaffName1);
      localStorage.setItem("timesheetStaffName", staffName);
      console.log("LocalStorage 'timesheetStaffName' set to:", staffName);
    } else {
      console.log("Step 4b: Conditions not met - skipping staff name setting");
    }

    // Set staff ID properties
    console.log("Step 5: Setting staff ID properties");
    console.log("staffId from event:", staffId);
    this.StaffId = staffId;
    console.log("this.StaffId set to:", this.StaffId);

    // Store data in localStorage
    console.log("Step 6: Storing data in localStorage");
    localStorage.setItem("timesheetViewFlag", "check");
    console.log("LocalStorage 'timesheetViewFlag' set to: check");
    
    localStorage.setItem("timesheetStaffId", staffId);
    console.log("LocalStorage 'timesheetStaffId' set to:", staffId);
    
    // Local storage for dates
    console.log("Step 7: Storing date information");
    console.log("this.weekStartDate:", this.weekStartDate);
    console.log("this.weekEndDate:", this.weekEndDate);
    
    localStorage.setItem("timesheetWeekStartDate", this.weekStartDate);
    localStorage.setItem("timesheetWeekEndDate", this.weekEndDate);
    console.log("Dates stored in localStorage");

    // Parse dates for API call
    console.log("Step 8: Parsing dates for API call");
    const start = new Date(this.weekStartDate);
    const end = new Date(this.weekEndDate);
    console.log("Parsed start date:", start);
    console.log("Parsed end date:", end);
    console.log("Fetching mismatched shifts from", start, "to", end);

    // Make API call to get mismatched shifts
    console.log("Step 9: Calling getMismatchedShifts API");
    getMismatchedShifts({ staffId: staffId, weekStart: start, weekEnd: end })
      .then((shifts) => {
        console.log("Step 10: API response received");
        console.log("Raw shifts data:", shifts);
        console.log("Number of shifts returned:", shifts?.length || 0);

        // Filter shifts based on duration criteria
        console.log("Step 11: Filtering shifts based on duration criteria");
        const filteredShifts = (shifts || [])
          .filter((shift, index) => {
            console.log(`\n--- Processing shift ${index + 1} for filtering ---`);
            console.log("Shift ID:", shift.Id);
            
            const actual = parseFloat(shift.Actual_Duration__c) || 0;
            const duration = parseFloat(shift.Duration__c) || 0;
            const extended = parseFloat(shift.Extended_Duration_in_Hours_and_Mins__c) || 0;
            
            console.log("Actual_Duration__c:", shift.Actual_Duration__c, "-> parsed:", actual);
            console.log("Duration__c:", shift.Duration__c, "-> parsed:", duration);
            console.log("Extended_Duration_in_Hours_and_Mins__c:", shift.Extended_Duration_in_Hours_and_Mins__c, "-> parsed:", extended);

            //const breakDuration = parseFloat(shift.Break__c) || 0;
            const breakDuration = (parseFloat(shift.Break__c) || 0) / 60;
            const bufferMinutes = parseFloat(shift.Buffer_Time_Formula__c) || 0;
            const bufferHours = bufferMinutes / 60;

            console.log("breakDuration", breakDuration);
            console.log("bufferMinutes", bufferMinutes);
            console.log("bufferHours", bufferHours);

            const totalWorked = actual + extended;
            const allowedTime = duration + bufferHours;

            console.log("totalWorked", totalWorked);
            console.log("allowedTime", allowedTime);
            console.log("Math.abs(totalWorked - allowedTime)", Math.abs(totalWorked - allowedTime));
            console.log("Math.abs(totalWorked - allowedTime) <= bufferHours", Math.abs(totalWorked - allowedTime) >= bufferHours);
            
            const isValid = Math.abs(totalWorked - duration) <= bufferHours;

            console.log("isValid", isValid);
            
            return isValid;
          })
          .map((shift, index) => {
            console.log(`\n--- Transforming shift ${index + 1} ---`);
            console.log("Shift ID:", shift.Id);
            console.log("Shift Type:", shift.Type_of_shift__c);
            console.log("Shift Date:", shift.Date__c);
            
            let totalMileageOthers = 0;
            let totalMileageAmount = 0;
            let totalBreakMinutes = 0;

            // Process reimbursements
            console.log("Step 11a: Processing reimbursements");
            if (shift.Reimbursements__r) {
              console.log(`Found ${shift.Reimbursements__r.length} reimbursement records`);
              shift.Reimbursements__r.forEach((reim, reimIndex) => {
                const mileageOthers = parseFloat(reim.Mileage_Others__c) || 0;
                const mileageAmount = parseFloat(reim.Mileage_Amount__c) || 0;
                
                totalMileageOthers += mileageOthers;
                totalMileageAmount += mileageAmount;
                
                console.log(`  Reimbursement ${reimIndex + 1}: Mileage Others = ${mileageOthers}, Amount = ${mileageAmount}`);
              });
            } else {
              console.log("No reimbursement records found");
            }

            // Process break timings
            console.log("Step 11b: Processing break timings");
            if (shift.Break_Timings__r && shift.Break_Timings__r.length > 0) {
              console.log(`Found ${shift.Break_Timings__r.length} break records`);
              
              shift.Break_Timings__r.forEach((breakRec, breakIndex) => {
                const breakTime = breakRec.Break_Time__c;
                console.log(`  Break ${breakIndex + 1} - Raw Break Time: "${breakTime}"`);
                
                if (breakTime && breakTime.includes(":")) {
                  const parts = breakTime.split(":");
                  const hours = parseInt(parts[0], 10);
                  const minutes = parseInt(parts[1], 10);
                  
                  console.log(`    Parsed: ${hours} hours, ${minutes} minutes`);
                  
                  if (!isNaN(hours) && !isNaN(minutes)) {
                    const breakMinutes = hours * 60 + minutes;
                    totalBreakMinutes += breakMinutes;
                    
                    console.log(`    ✅ Added ${breakMinutes} minutes to total`);
                  } else {
                    console.warn(`    ⚠️ Failed to parse hours/minutes`);
                  }
                } else {
                  console.warn(`    ⚠️ Invalid break time format`);
                }
              });
              
              console.log(`Total Break Minutes accumulated: ${totalBreakMinutes}`);
            } else {
              console.log("No break records found for this shift");
            }

            // Calculate break hours and effective duration
            console.log("Step 11c: Calculating durations");
            const totalBreakHours = (totalBreakMinutes / 60).toFixed(2);
            console.log(`Total Break Hours: ${totalBreakHours} (from ${totalBreakMinutes} minutes)`);
            
            const durationRaw = shift.Actual_Duration__c;
            const durationCalculated = isNaN(durationRaw) ? 0 : parseFloat(durationRaw);
            console.log(`Raw Actual Duration: ${durationRaw}`);
            console.log(`Parsed Actual Duration: ${durationCalculated}`);
            
            const effectiveDuration = Math.max(
              0,
              durationCalculated - parseFloat(totalBreakHours)
            ).toFixed(2);
            console.log(`Effective Duration (Actual - Breaks): ${effectiveDuration}`);
            
            // Check if shift is approved
            const isApproved = shift.Approval_Status__c === "Approved";
            console.log(`Approval Status: ${shift.Approval_Status__c}`);
            console.log(`Is Approved: ${isApproved}`);

            // Precompute icon fields
            console.log("Step 11d: Precomputing icon fields");
            const iconName = isApproved ? "thumb_up" : "check_circle";
            const iconClass = isApproved ? "approved-icon" : "approve-icon";
            const iconTitle = isApproved ? "Approved" : "Approve";
            const iconUpdateKey = `${shift.Id}-${isApproved ? "approved" : "pending"}-${Date.now()}`;
            const signatureIconClass = shift.Client_Signature__c
              ? "material-icons signature-icon-blue"
              : "material-icons signature-icon-red";
            const isClickable = !isApproved;
            const iconStyle = isClickable
              ? ""
              : "pointer-events: none; opacity: 0.5;";
            const signatureTitle = "Signature";
            const isSignatureClickable = !!shift.Client_Signature__c;
            
            console.log(`Icon Name: ${iconName}`);
            console.log(`Icon Class: ${iconClass}`);
            console.log(`Is Clickable: ${isClickable}`);

            // Status mapping
            console.log("Step 11e: Setting status mapping");
            let statusMap = {
              accepted:   { icon: "check_circle", css: "status-accepted" },
              inprogress: { icon: "hourglass_top", css: "status-inprogress" },
              completed:  { icon: "task_alt", css: "status-completed" },
              cancelled:  { icon: "cancel", css: "status-cancelled" }
            };

            let getStatusMeta = (rawStatus) => {
              const key = (rawStatus || "").toLowerCase().trim();
              return statusMap[key] || { icon: "help_outline", css: "status-unknown" };
            };

            let statusMeta = getStatusMeta(shift.Status__c);
            console.log(`Shift Status: ${shift.Status__c}`);
            console.log(`Status Icon: ${statusMeta.icon}`);
            console.log(`Status CSS Class: ${statusMeta.css}`);
            
            // Check for cancel icon
            let showCancelIcon =
              shift.Status__c &&
              shift.Status__c.toLowerCase().trim() === "cancelled" && 
              shift.Shift_Cancel_Notes__c != undefined &&  
              shift.Shift_Cancel_Notes__c != null &&  
              shift.Shift_Cancel_Notes__c != '';
              
            console.log(`Show Cancel Icon: ${showCancelIcon}`);
            console.log(`Cancel Notes: ${shift.Shift_Cancel_Notes__c}`);

            // Calculate extended duration
            const extendedDuration = (() => {
              const parsed = parseFloat(
                (shift.Extended_Duration_in_Hours_and_Mins__c || 0).toFixed(2)
              );
              return isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(2));
            })();
            console.log(`Extended Duration: ${extendedDuration}`);

            console.log("Step 11f: Creating transformed shift object");
            
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
              totalDuration:
                isNaN(parseFloat(effectiveDuration)) ||
                parseFloat(effectiveDuration) === 0
                  ? durationCalculated.toFixed(2)
                  : effectiveDuration,
              shiftDate: this.formatDateToDDMMYYYY(shift.Date__c),
              serviceTypeShort:
                shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c?.substring(
                  0,
                  30
                ) + "..." || "--",
              serviceType:
                shift.Services_and_Support_Plans__r?.[0]
                  ?.Service_Type_Name__c || "--",
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
              statusIcon: statusMeta.icon,
              statusIconClass: statusMeta.css,
              statusTitle: shift.Status__c == 'InProgress' ? 'In Progress' : shift.Status__c,
              uiStatus: shift.Status__c,
              showCancelIcon: showCancelIcon,
              iconName,
              iconClass,
              iconTitle,
              iconUpdateKey,
              signatureIconClass,
              signatureTitle,
              isSignatureClickable,
              iconStyle,
              isClickable,
              extendedDuration
            };
          });

        console.log("Step 12: Setting selected shifts data");
        console.log(`Number of filtered shifts: ${filteredShifts.length}`);
        
        this.selectedStaffShifts = filteredShifts;
        console.log("this.selectedStaffShifts set with", filteredShifts.length, "shifts");
        
        this.selectedShiftIds = filteredShifts.map((shift) => shift.Id);
        console.log("this.selectedShiftIds:", this.selectedShiftIds);

        // Calculate total shift duration
        console.log("Step 13: Calculating total shift duration");
        console.log("Filtered shifts for calculation:", JSON.stringify(filteredShifts, null, 2));
        
        this.totalShiftDuration = filteredShifts.reduce((sum, shift, index) => {
          const duration = parseFloat(shift.totalDuration);
          
          console.log(`\nShift ${index + 1} calculation:`);
          console.log(`  Shift ID: ${shift.Id}`);
          console.log(`  totalDuration value: ${shift.totalDuration}`);
          console.log(`  Parsed duration: ${duration}`);
          console.log(`  Previous sum: ${sum}`);
          console.log(`  New sum: ${sum + (duration || 0)}`);
          
          return sum + (duration || 0);
        }, 0);
        this.totalShiftDuration = parseFloat(this.totalShiftDuration.toFixed(2));
        
        console.log("✅ Total Shift Duration calculated:", this.totalShiftDuration);

        // Calculate total kilometers
        console.log("Step 14: Calculating total kilometers");
        this.totalKms = filteredShifts.reduce((sum, shift, index) => {
          const mileage = parseFloat(shift.mileageOthersTotal) || 0;
          console.log(`Shift ${index + 1}: mileageOthersTotal = ${shift.mileageOthersTotal}, parsed = ${mileage}`);
          return sum + mileage;
        }, 0);
        // Format to 2 decimal places
        this.totalKms = parseFloat(this.totalKms.toFixed(2));
        console.log("✅ Total KMs calculated:", this.totalKms);

        // Calculate total expenses
        console.log("Step 15: Calculating total expenses");
        this.totalexpenses = filteredShifts.reduce((sum, shift, index) => {
          const expense = parseFloat(shift.mileageAmountTotal) || 0;
          console.log(`Shift ${index + 1}: mileageAmountTotal = ${shift.mileageAmountTotal}, parsed = ${expense}`);
          return sum + expense;
        }, 0);
        this.totalexpenses = parseFloat(this.totalexpenses.toFixed(2));
        console.log("✅ Total Expenses calculated:", this.totalexpenses);

        // Calculate sleepover duration
        console.log("Step 16: Calculating sleepover duration");
        this.sleepoverDuration = filteredShifts.reduce((sum, shift, index) => {
          const sleepover = parseFloat(shift.Long_Sleepover_Duartion__c) || 0;
          console.log(`Shift ${index + 1}: Long_Sleepover_Duartion__c = ${shift.Long_Sleepover_Duartion__c}, parsed = ${sleepover}`);
          return sum + sleepover;
        }, 0);
        this.sleepoverDuration = parseFloat(this.sleepoverDuration.toFixed(2));
        console.log("✅ Sleepover Duration calculated:", this.sleepoverDuration);

        // Calculate total approved logged duration
        console.log("Step 17: Calculating total approved logged duration");
        this.totalApprovedLoggedDuration = filteredShifts.reduce((sum, shift, index) => {
          if (shift.Approval_Status__c === "Approved") {
            const approvedDuration = parseFloat(shift.totalDuration) || 0;
            console.log(`Shift ${index + 1}: Approved, duration = ${approvedDuration}`);
            return sum + approvedDuration;
          } else {
            console.log(`Shift ${index + 1}: Not approved, skipping`);
            return sum;
          }
        }, 0);
        this.totalApprovedLoggedDuration = parseFloat( this.totalApprovedLoggedDuration.toFixed(2));
        console.log("✅ Total Approved Logged Duration:", this.totalApprovedLoggedDuration);

        // Check for non-NDIS shifts
        console.log("Step 18: Checking for non-NDIS shifts");
        this.otherThanNdis = filteredShifts.some((shift, index) => {
          const isNdis = shift?.Staff__r?.Facility__r?.Type_of_Service__c !== "NDIS";
          console.log(`Shift ${index + 1}: Facility Type = ${shift?.Staff__r?.Facility__r?.Type_of_Service__c}, is non-NDIS: ${isNdis}`);
          return isNdis;
        });
        console.log("otherThanNdis result:", this.otherThanNdis);

        // Log summary
        console.log("\nStep 19: Summary of calculations:");
        console.log("Filtered shifts count:", filteredShifts.length);
        console.log("Total Shift Duration:", this.totalShiftDuration);
        console.log("Total KMs:", this.totalKms);
        console.log("Total Expenses:", this.totalexpenses);
        console.log("Sleepover Duration:", this.sleepoverDuration);
        console.log("Approved Duration:", this.totalApprovedLoggedDuration);
        console.log("Contains non-NDIS shifts:", this.otherThanNdis);

        // Check if no shifts found
        console.log("Step 20: Checking if any shifts were found");
        if (!filteredShifts || filteredShifts.length === 0) {
          console.log("⚠️ No matching shifts found, redirecting to handleMismatchClick");
          console.log("Current StaffId:", this.StaffId);
          
          // Set flag to prevent loop
          this.isProcessingMismatch = true;
          
          this.handleMismatchClick({
            currentTarget: { dataset: { staffId: this.StaffId } }
          });
          
          this.ismissmatchedshifts = true;
          console.log("this.ismissmatchedshifts set to:", true);
          
          // Reset flag after a delay to allow mismatch processing to complete
          setTimeout(() => {
            this.isProcessingMismatch = false;
            console.log("⚠️ Loop prevention flag reset");
          }, 1000);
          
          console.log("Returning early - no further processing");
          return;
        } else {
          console.log("✅ Shifts found, continuing with UI updates");
          // Reset flag if we have shifts
          this.isProcessingMismatch = false;
        }

        // Update UI flags
        console.log("Step 21: Updating UI flags");
        this.shiftInformation = true;
        this.timeSheet = false;
        this.submissionFlag = false;
        this.refresh = false;
        
        console.log("UI flags updated:");
        console.log("  this.shiftInformation:", this.shiftInformation);
        console.log("  this.timeSheet:", this.timeSheet);
        console.log("  this.submissionFlag:", this.submissionFlag);
        console.log("  this.refresh:", this.refresh);

        console.log("==================== handleCheckClick END ====================");
      })
      .catch((error) => {
        console.error("❌ Step 22: Error in getMismatchedShifts API call:", error);
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        // Reset flag on error
        this.isProcessingMismatch = false;
        console.log("==================== handleCheckClick ERROR END ====================");
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
      localStorage.setItem("timesheetStaffName", staffName);
    }

    console.log("Selected Staff ID:", staffId);
    console.log("Selected Staff Name:", this.StaffName1);

    localStorage.setItem("timesheetViewFlag", "mismatch");
    localStorage.setItem("timesheetStaffId", staffId);
    //localStorage.setItem('timesheetStaffName', staffName);
    //localStorage.setItem('timesheetStaffName', this.StaffName1 || '');
    console.log(
      "this.weekStartDate in handleMismatchClick : ",
      this.weekStartDate
    );
    console.log("this.weekEndDate in handleMismatchClick : ", this.weekEndDate);
    localStorage.setItem("timesheetWeekStartDate", this.weekStartDate);
    localStorage.setItem("timesheetWeekEndDate", this.weekEndDate);
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
            // const isMismatch = duration !== actual + extended;
            // Buffer is in MINUTES → convert to HOURS
            //const breakDuration = parseFloat(shift.Break__c) || 0;
            const breakDuration = (parseFloat(shift.Break__c) || 0) / 60;
            const bufferMinutes = parseFloat(shift.Buffer_Time_Formula__c) || 0;
            const bufferHours = bufferMinutes / 60;

            // const expected = duration + extended;
            // const isMismatch = Math.abs(actual - expected) > bufferHours;
            const totalWorked = actual + extended;
            //const isMismatch = Math.abs(totalWorked - duration) >= bufferHours;
            const isMismatch = Math.abs(totalWorked - duration) > bufferHours;

            console.log(
                `Shift ID: ${shift.Id}
                | Actual: ${actual}
                | Duration: ${duration}
                | extended: ${extended}
                | BreakDuration: ${breakDuration}
                | totalWorked: ${totalWorked}
                | Buffer(min): ${bufferMinutes}
                | Mismatch: ${isMismatch}
                | `
            );
                    return isMismatch;
                  })
          .map((shift) => {
            let totalMileageOthers = 0;
            let totalMileageAmount = 0;
            let totalBreakMinutes = 0;

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
            if (shift.Break_Timings__r && shift.Break_Timings__r.length > 0) {
              console.log(
                `🔎 Found ${shift.Break_Timings__r.length} break records for shift: ${shift.Id}`
              );
              shift.Break_Timings__r.forEach((breakRec, index) => {
                const breakTime = breakRec.Break_Time__c;
                console.log(
                  `⏱ Break #${index + 1} - Raw Break Time: ${breakTime}`
                );

                if (breakTime && breakTime.includes(":")) {
                  const parts = breakTime.split(":");
                  const hours = parseInt(parts[0], 10);
                  const minutes = parseInt(parts[1], 10);

                  if (!isNaN(hours) && !isNaN(minutes)) {
                    const breakMinutes = hours * 60 + minutes;
                    totalBreakMinutes += breakMinutes;

                    console.log(
                      `✅ Parsed Break #${index + 1}: ${hours} hours, ${minutes} minutes (${breakMinutes} mins)`
                    );
                    console.log(
                      `➕ Running Total Break Minutes in handleMismatchClick : ${totalBreakMinutes}`
                    );
                  } else {
                    console.warn(
                      `⚠️ Failed to parse hours/minutes for Break #${index + 1}:`,
                      breakTime
                    );
                  }
                } else {
                  console.warn(
                    `⚠️ Invalid break time format for Break #${index + 1}:`,
                    breakTime
                  );
                }
              });
            } else {
              console.log(`ℹ️ No break records for shift: ${shift.Id}`);
            }

            const totalBreakHours = (totalBreakMinutes / 60).toFixed(2);
            console.log(
              `⏳ Total Break Minutes: ${totalBreakMinutes}, Converted to Hours: ${totalBreakHours}`
            );
            //const durationRaw = this.getDurationInHours(signInTime, signOutTime, breakfield);
            const durationRaw = shift.Actual_Duration__c;
            const durationCalculated = isNaN(durationRaw) ? 0 : durationRaw;
            const effectiveDuration = Math.max(
              0,
              durationCalculated - parseFloat(totalBreakHours)
            ).toFixed(2);
            console.log(
              `🧮 Effective Duration (after break deduction): ${effectiveDuration}`
            );

            const isApproved = shift.Approval_Status__c === "Approved";
            const iconName = isApproved ? "thumb_up" : "check_circle";
            const iconClass = isApproved ? "approved-icon" : "approve-icon";
            const iconTitle = isApproved ? "Approved" : "Approve";
            const iconUpdateKey = `${shift.Id}-${isApproved ? "approved" : "pending"}-${Date.now()}`;
            const isClickable = !isApproved; // 👈 add this line
            const iconStyle = isClickable
              ? ""
              : "pointer-events: none; opacity: 0.5;";
            const signatureIconClass = shift.Client_Signature__c
              ? "material-icons overview-icon signature-icon-blue"
              : "material-icons overview-icon signature-icon-red";
            const signatureTitle = shift.Client_Signature__c
              ? "Signature"
              : "Signature";
            const isSignatureClickable = !!shift.Client_Signature__c;
           let statusMap = {
            accepted:   { icon: "check_circle", css: "status-accepted" },
            inprogress: { icon: "hourglass_top", css: "status-inprogress" },
            completed:  { icon: "task_alt", css: "status-completed" },
            cancelled:  { icon: "cancel", css: "status-cancelled" }
          };

          // define first
          let getStatusMeta = (rawStatus) => {
            const key = (rawStatus || "").toLowerCase().trim();
            return statusMap[key] || { icon: "help_outline", css: "status-unknown" };
          };

          // THEN call it
          let statusMeta = getStatusMeta(shift.Status__c);

          console.log("getStatusMeta => ", statusMeta);
          let showCancelIcon =
          shift.Status__c &&
          shift.Status__c.toLowerCase().trim() === "cancelled" && shift.Shift_Cancel_Notes__c !=undefined  &&  shift.Shift_Cancel_Notes__c !=null &&  shift.Shift_Cancel_Notes__c !='';

            return {
              ...shift,
              isApprovedTemplateVisible: isApproved,
              iconName,
              iconClass,
              iconTitle,
              iconStyle,
              iconUpdateKey, // 👈 Add this key for reactivity
              isClickable,
              signatureIconClass,
              signatureTitle,
              isSignatureClickable,
              statusIcon: statusMeta.icon,
              statusIconClass: statusMeta.css,
              statusTitle: shift.Status__c =='InProgress'?'In Progress':shift.Status__c    ,
              uiStatus: shift.Status__c,
              showCancelIcon:showCancelIcon,
              shiftType:
                (shift.Type_of_shift__c || "").trim().toLowerCase() ===
                "sleepover shift"
                  ? "Sleepover"
                  : shift.Type_of_shift__c || "--",
              formattedStart: shift.Start_time_Formula__c || "--",
              formattedLogin: shift.Login_Time_Formula__c || "--",
              formattedEnd: shift.End_time_formula__c || "--",
              formattedLogout: shift.Logout_Time_Formula__c || "--",
              // totalDuration: effectiveDuration,
              totalDuration:
                isNaN(parseFloat(effectiveDuration)) ||
                parseFloat(effectiveDuration) === 0
                  ? durationCalculated.toFixed(2)
                  : effectiveDuration,
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
          (sum, shift) => sum + (parseFloat(shift.totalDuration) || 0),
          0
        );
        this.totalShiftDuration = parseFloat(this.totalShiftDuration.toFixed(2));
        this.totalKms = mismatchedShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageOthersTotal) || 0),
          0
        );
        // Format to 2 decimal places
        this.totalKms = parseFloat(this.totalKms.toFixed(2));
        this.totalexpenses = mismatchedShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageAmountTotal) || 0),
          0
        );
        this.totalexpenses = parseFloat(this.totalexpenses.toFixed(2));
        this.sleepoverDuration = mismatchedShifts.reduce(
          (sum, shift) =>
            sum + (parseFloat(shift.Long_Sleepover_Duartion__c) || 0),
          0
        );
        // Ensure 2 decimal places
        this.sleepoverDuration = parseFloat(this.sleepoverDuration.toFixed(2));
        this.totalApprovedLoggedDuration = mismatchedShifts.reduce(
          (sum, shift) => {
            return shift.Approval_Status__c === "Approved"
              ? sum + (parseFloat(shift.totalDuration) || 0)
              : sum;
          },
          0
        );
        this.totalApprovedLoggedDuration = parseFloat( this.totalApprovedLoggedDuration.toFixed(2) );

        this.otherThanNdis = mismatchedShifts.some(
          (shift) => shift?.Staff__r?.Facility__r?.Type_of_Service__c !== "NDIS"
        );

        console.log("Mismatched Shifts Processed:", mismatchedShifts.length);
        console.log("Total Shift Duration:", this.totalShiftDuration);
        console.log("Total KMs:", this.totalKms);
        console.log("Total Expenses:", this.totalexpenses);
        console.log("Total Sleepover Duration:", this.sleepoverDuration);
        console.log(
          "Approved Duration IN handleMismatchClick:",
          this.totalApprovedLoggedDuration
        );
        console.log("Non NDIS:", this.otherThanNdis);

        // ✅ If no mismatched shifts → jump to handleCheckClick and stop
        if (!mismatchedShifts || mismatchedShifts.length === 0) {
          console.warn("⚠️ No mismatched shifts found, redirecting to handleCheckClick");
          this.handleCheckClick({
            currentTarget: { dataset: { staffId: this.StaffId } }
          });
          this.ismissmatchedshifts = false;
          return; // ⛔ stop here — nothing else below will run
        }

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
    console.log(
      "this.weekStartDate in handleCheckboxChange : ",
      this.weekStartDate
    );
    console.log(
      "this.weekEndDate in handleCheckboxChange : ",
      this.weekEndDate
    );
    localStorage.setItem("timesheetWeekStartDate", this.weekStartDate);
    localStorage.setItem("timesheetWeekEndDate", this.weekEndDate);
    const start = new Date(this.weekStartDate);
    const end = new Date(this.weekEndDate);

    console.log("Current StaffId:", staffId);
    console.log("Week Start Date:", start);
    console.log("Week End Date:", end);

    localStorage.setItem("timesheetViewFlag", "checkbox");
    localStorage.setItem("timesheetStaffId", this.StaffId);
    //localStorage.setItem('staffName', this.StaffName1);
    localStorage.setItem(
      "timesheetIsChecked",
      this.isChecked ? "true" : "false"
    );

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
             // const isMismatch = duration !== actual + extended;
              //const breakDuration = parseFloat(shift.Break__c) || 0;
              const breakDuration = (parseFloat(shift.Break__c) || 0) / 60;
              const bufferMinutes = parseFloat(shift.Buffer_Time_Formula__c) || 0;
              const bufferHours = bufferMinutes / 60;

              // const expected = duration + extended;
              // const isMismatch = Math.abs(actual - expected) > bufferHours;
              const totalWorked = actual + extended;
              const allowedTime = duration + bufferHours;
              //const isMismatch = Math.abs(totalWorked - duration) >= bufferHours;
              const isMismatch = Math.abs(totalWorked - duration) > bufferHours;

              console.log(
                `Shift ID: ${shift.Id}
                | Actual: ${actual}
                | Buffer(min): ${bufferMinutes}
                | Mismatch: ${isMismatch}
                | TotalWorked: ${totalWorked}
                | AllowedTime: ${allowedTime}
                | Mismatch: ${isMismatch}`
              );
              return isMismatch;
            }
          })
          .map((shift) => {
            let totalMileageOthers = 0;
            let totalMileageAmount = 0;
            let totalBreakMinutes = 0;

            if (shift.Reimbursements__r) {
              shift.Reimbursements__r.forEach((reim) => {
                totalMileageOthers += parseFloat(reim.Mileage_Others__c) || 0;
                totalMileageAmount += parseFloat(reim.Mileage_Amount__c) || 0;
              });
            }

            if (shift.Break_Timings__r && shift.Break_Timings__r.length > 0) {
              console.log(
                `🔎 Found ${shift.Break_Timings__r.length} break records for shift: ${shift.Id}`
              );
              shift.Break_Timings__r.forEach((breakRec, index) => {
                const breakTime = breakRec.Break_Time__c;
                console.log(
                  `⏱ Break #${index + 1} - Raw Break Time: ${breakTime}`
                );

                if (breakTime && breakTime.includes(":")) {
                  const parts = breakTime.split(":");
                  const hours = parseInt(parts[0], 10);
                  const minutes = parseInt(parts[1], 10);

                  if (!isNaN(hours) && !isNaN(minutes)) {
                    const breakMinutes = hours * 60 + minutes;
                    totalBreakMinutes += breakMinutes;

                    console.log(
                      `✅ Parsed Break #${index + 1}: ${hours} hours, ${minutes} minutes (${breakMinutes} mins)`
                    );
                    console.log(
                      `➕ Running Total Break Minutes in handleCheckboxChange: ${totalBreakMinutes}`
                    );
                  } else {
                    console.warn(
                      `⚠️ Failed to parse hours/minutes for Break #${index + 1}:`,
                      breakTime
                    );
                  }
                } else {
                  console.warn(
                    `⚠️ Invalid break time format for Break #${index + 1}:`,
                    breakTime
                  );
                }
              });
            } else {
              console.log(`ℹ️ No break records for shift: ${shift.Id}`);
            }

            const totalBreakHours = (totalBreakMinutes / 60).toFixed(2);
            console.log(
              `⏳ Total Break Minutes: ${totalBreakMinutes}, Converted to Hours: ${totalBreakHours}`
            );
            const breakfield = shift.Break__c;
            const signInTime = this.getFormattedTime(shift.Log_In_Date_Time__c);
            const signOutTime = this.getFormattedTime(
              shift.Log_Out_Date_Time__c
            );
            const durationRaw = shift.Actual_Duration__c;
            const durationCalculated = isNaN(durationRaw) ? 0 : durationRaw;
            const effectiveDuration = Math.max(
              0,
              durationCalculated - parseFloat(totalBreakHours)
            ).toFixed(2);
            console.log(
              `🧮 Effective Duration (after break deduction): ${effectiveDuration}`
            );
            console.log(
              '🧮 isApproved:', shift.Approval_Status__c
            );
            const isApproved = shift.Approval_Status__c === "Approved";

            if (isApproved) {
              approvedDuration += durationCalculated;
            }
            console.log(
              '🧮 isApproved:', isApproved
            );

            const iconName = isApproved ? "thumb_up" : "check_circle";
            console.log(
              '🧮 isApproved:', iconName
            );
            const iconClass = isApproved ? "approved-icon" : "approve-icon";
            console.log(
              '🧮 isApproved:', iconClass
            );
            const iconTitle = isApproved ? "Approved" : "Approve";
            console.log(
              '🧮 isApproved:', iconTitle
            );
            const iconUpdateKey = `${shift.Id}-${
              isApproved ? "approved" : "pending"
            }-${Date.now()}`;
            const isClickable = !isApproved;
            const iconStyle = isClickable
              ? ""
              : "pointer-events: none; opacity: 0.5;";
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
             let statusMap = {
            accepted:   { icon: "check_circle", css: "status-accepted" },
            inprogress: { icon: "hourglass_top", css: "status-inprogress" },
            completed:  { icon: "task_alt", css: "status-completed" },
            cancelled:  { icon: "cancel", css: "status-cancelled" }
          };

          // define first
          let getStatusMeta = (rawStatus) => {
            const key = (rawStatus || "").toLowerCase().trim();
            return statusMap[key] || { icon: "help_outline", css: "status-unknown" };
          };

          // THEN call it
          let statusMeta = getStatusMeta(shift.Status__c);

          console.log("getStatusMeta => ", statusMeta);
          let showCancelIcon =
          shift.Status__c &&
          shift.Status__c.toLowerCase().trim() === "cancelled" && shift.Shift_Cancel_Notes__c !=undefined  &&  shift.Shift_Cancel_Notes__c !=null &&  shift.Shift_Cancel_Notes__c !='';

            return {
              ...shift,
              isApprovedTemplateVisible: isApproved,
              iconName,
              iconClass,
              iconStyle,
              iconTitle,
              iconUpdateKey,
              isClickable,
              signatureIconClass,
              signatureTitle,
              isSignatureClickable,
              statusIcon: statusMeta.icon,
              statusIconClass: statusMeta.css,
              statusTitle: shift.Status__c =='InProgress'?'In Progress':shift.Status__c    ,
              uiStatus: shift.Status__c,
              showCancelIcon:showCancelIcon,
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
              //totalDuration: effectiveDuration,
              totalDuration:
                isNaN(parseFloat(effectiveDuration)) ||
                parseFloat(effectiveDuration) === 0
                  ? durationCalculated.toFixed(2)
                  : effectiveDuration,
              serviceTypeShort:
                shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c?.substring(
                  0,
                  15
                ) + "..." || "--",
              serviceType:
                shift.Services_and_Support_Plans__r?.[0]
                  ?.Service_Type_Name__c || "--",
              facilityName: shift.Facility__c || "--",
              clientSignature: shift.Client_Signature__c,
              clientName: shift.Services_and_Support_Plans__r?.[0]?.Client__r
                ? `${shift.Services_and_Support_Plans__r[0].Client__r.First_Name__c || ""} ${
                    shift.Services_and_Support_Plans__r[0].Client__r
                      .Last_Name__c || ""
                  }`.trim()
                : "--",
              servicesAndPlans:
                shift.Services_and_Support_Plans__r?.map((plan) => ({
                  id: plan.Id,
                  name: plan.Name,
                  clientName:
                    `${plan.Client__r?.First_Name__c || ""} ${
                      plan.Client__r?.Last_Name__c || ""
                    }`.trim() || "-"
                })) || [],
              clientNames: (shift.Services_and_Support_Plans__r || []).map(
                (s) => {
                  const client = s.Client__r;
                  return client
                    ? `${client.First_Name__c} ${client.Last_Name__c}`
                    : "N/A";
                }
              ),
              mileageOthersTotal: totalMileageOthers.toFixed(2),
              mileageAmountTotal: totalMileageAmount.toFixed(2),
              extendedDuration: (() => {
                const val = parseFloat(shift.Extended_Duration__c).toFixed(2);
                return isNaN(val) || val < 0 ? 0 : val;
              })()
            };
          });

        console.log("filteredShifts >>", JSON.stringify(filteredShifts));

        this.selectedStaffShifts = filteredShifts;
        this.selectedShiftIds = filteredShifts.map((shift) => shift.Id);
        this.totalShiftDuration = filteredShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.totalDuration) || 0),
          0
        );
        this.totalShiftDuration = parseFloat(this.totalShiftDuration.toFixed(2));
        this.totalKms = filteredShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageOthersTotal) || 0),
          0
        );
        this.totalKms = parseFloat(this.totalKms.toFixed(2));
        this.totalexpenses = filteredShifts.reduce(
          (sum, shift) => sum + (parseFloat(shift.mileageAmountTotal) || 0),
          0
        );
        this.totalexpenses = parseFloat(this.totalexpenses.toFixed(2));
        this.sleepoverDuration = filteredShifts.reduce(
          (sum, shift) =>
            sum + (parseFloat(shift.Long_Sleepover_Duartion__c) || 0),
          0
        );
        // Format to 2 decimals
        this.sleepoverDuration = parseFloat(this.sleepoverDuration.toFixed(2));
        this.totalApprovedLoggedDuration = approvedDuration;
        this.totalApprovedLoggedDuration = parseFloat( this.totalApprovedLoggedDuration.toFixed(2) );

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
    localStorage.removeItem("timesheetViewFlag");
    localStorage.removeItem("timesheetStaffId");
    localStorage.removeItem("timesheetStaffName");
    localStorage.removeItem("timesheetIsChecked");

    // this.isLocalStorageDate = false;
    // console.log('this.isLocalStorageDate in back  ',this.isLocalStorageDate);
    // if(!this.isLocalStorageDate){
    //     console.log('this.isLocalStorageDate in back  ');
    //     const today = new Date();
    //     this.datePickerString = today.toISOString().split("T")[0];
    //     console.log('this.datePickerString in back  ',this.datePickerString);
    // }
    console.log("this.weekStartDate in handleBackClick : ", this.weekStartDate);

    console.log("this.weekEndDate in handleBackClick: ", this.weekEndDate);

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
    // localStorage.removeItem('timesheetWeekStartDate');
    // localStorage.removeItem('timesheetWeekEndDate');
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

  parseMsToTimeParts(ms) {
    if (ms === null || ms === undefined) {
      return {
        display: "",
        hour: null,
        minute: "",
        ampm: ""
      };
    }

    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const displayHour = hours % 12 || 12;
    const ampm = hours < 12 ? "AM" : "PM";

    return {
      display: `${displayHour}:${String(minutes).padStart(2, "0")} ${ampm}`,
      hour: displayHour,
      minute: String(minutes).padStart(2, "0"), // 👈 ensures "00"
      ampm: ampm
    };
  }

  convertTimePartsToMs(hour, minute, ampm) {
    console.log("🕰 convertTimePartsToMs triggered");
    console.log(
      `📥 Input values → hour: ${hour}, minute: ${minute}, ampm: ${ampm}`
    );

    if (hour == null || minute == null || !ampm) {
      console.warn("⚠️ Invalid input: returning null");
      return null;
    }

    // Convert to 24-hour format
    let hours24 = hour % 12; // 12 AM → 0, 12 PM → 12
    console.log(`🔄 Hour converted to 24-hour base → ${hours24}`);

    if (ampm === "PM") {
      hours24 += 12;
      console.log(`🔄 PM adjustment applied → hours24: ${hours24}`);
    }

    // Convert to milliseconds
    const ms = hours24 * 60 * 60 * 1000 + minute * 60 * 1000;
    console.log(`⏱ Converted to milliseconds → ${ms}`);

    return ms;
  }

  /* handleStartTimeChange(event) {
    console.log("🕒 handleStartTimeChange triggered");
    console.log("📥 Raw event.detail:", JSON.stringify(event.detail, null, 2));

    const display = event.detail.displaytime; // e.g., "9:45 AM"
    const twentyFourHourFormat = event.detail.twentyFourHourFormat; // e.g., "09:45:00Z"

    // Parse the 24-hour format directly to milliseconds
    const timeParts = twentyFourHourFormat.split(":"); // ["09", "45", "00Z"]
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = parseInt(timeParts[2], 10); // usually 0

    const ms = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;

    // Save UI-friendly values
    this.startTimeSelectedHour1 = hours % 12 === 0 ? 12 : hours % 12; // for AM/PM display
    this.startTimeSelectedMinute1 = minutes;
    this.startTimeAMPM1 = hours < 12 ? "AM" : "PM";
    this.AddShiftStartTimeAMPM1 = display;

    // Save milliseconds from 24-hour format
    this.startTimeInMs = twentyFourHourFormat;

    console.log("✅ Start Time Updated →", {
      display: this.AddShiftStartTimeAMPM1,
      hour: this.startTimeSelectedHour1,
      minute: this.startTimeSelectedMinute1,
      ampm: this.startTimeAMPM1,
      ms: this.startTimeInMs
    });
  } */

  handleStartTimeChange(event) {
      console.log("🕒 handleStartTimeChange triggered");
      console.log("📥 Raw event.detail:", JSON.stringify(event.detail, null, 2));

      // 🔹 Case 1: Cancel/Clear → reset everything
      if (!event.detail || event.detail.displaytime === null) {
          this.startTimeSelectedHour1 = null;
          this.startTimeSelectedMinute1 = null;
          this.startTimeAMPM1 = null;
          this.AddShiftStartTimeAMPM1 = null;
          this.startTimeInMs = null;

          console.warn("⛔ Start Time cleared → all values reset to null");
          return;
      }

      // 🔹 Case 2: Valid selection
      const display = event.detail.displaytime; // e.g., "9:45 AM"
      const twentyFourHourFormat = event.detail.twentyFourHourFormat; // e.g., "09:45:00Z"

      // Parse the 24-hour format directly to milliseconds
      const timeParts = twentyFourHourFormat.split(":"); // ["09", "45", "00Z"]
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = parseInt(timeParts[2], 10); // usually 0

      const ms = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;

      // Save UI-friendly values
      this.startTimeSelectedHour1 = hours % 12 === 0 ? 12 : hours % 12;
      this.startTimeSelectedMinute1 = minutes;
      this.startTimeAMPM1 = hours < 12 ? "AM" : "PM";
      this.AddShiftStartTimeAMPM1 = display;

      // Save milliseconds (or the raw 24h format if you prefer)
      this.startTimeInMs = twentyFourHourFormat;

      console.log("✅ Start Time Updated →", {
          display: this.AddShiftStartTimeAMPM1,
          hour: this.startTimeSelectedHour1,
          minute: this.startTimeSelectedMinute1,
          ampm: this.startTimeAMPM1,
          ms: this.startTimeInMs
      });
      
  }


  handleEndTimeChange(event) {
      console.log("🕒 handleEndTimeChange triggered");
      console.log("📥 Raw event.detail:", JSON.stringify(event.detail, null, 2));

      // 🔹 Case 1: Cancel/Clear → reset everything
      if (!event.detail || event.detail.displaytime === null) {
          this.endTimeSelectedHour1 = null;
          this.endTimeSelectedMinute1 = null;
          this.endTimeAMPM1 = null;
          this.AddShiftEndTimeAMPM1 = null;
          this.endTimeInMs = null;

          console.warn("⛔ End Time cleared → all values reset to null");
          return;
      }

      // 🔹 Case 2: Valid selection
      const display = event.detail.displaytime; // e.g., "5:00 PM"
      const twentyFourHourFormat = event.detail.twentyFourHourFormat; // e.g., "17:00:00Z"

      // Parse 24-hour format directly to milliseconds
      const timeParts = twentyFourHourFormat.split(":"); // ["17", "00", "00Z"]
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = parseInt(timeParts[2], 10); // usually 0

      const ms = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;

      // Save UI-friendly values
      this.endTimeSelectedHour1 = hours % 12 === 0 ? 12 : hours % 12;
      this.endTimeSelectedMinute1 = minutes;
      this.endTimeAMPM1 = hours < 12 ? "AM" : "PM";
      this.AddShiftEndTimeAMPM1 = display;

      // Save milliseconds (or raw 24h format if you prefer consistency)
      this.endTimeInMs = twentyFourHourFormat;
      //this.handleLogOutChnage();

      console.log("✅ End Time Updated →", {
          display: this.AddShiftEndTimeAMPM1,
          hour: this.endTimeSelectedHour1,
          minute: this.endTimeSelectedMinute1,
          ampm: this.endTimeAMPM1,
          ms: this.endTimeInMs
      });

      const mockEvent = {
        target: {
            value: twentyFourHourFormat.replace("Z", ""), // e.g., "17:00:00"
            fieldName: 'End_Time__c',                     // fake field name
            reportValidity: () => true                    // assume valid
        }
    };
    this.handleLogOutChnage(mockEvent);
   
  }


  handleEditClick(event) {
    this.showSpinner = true;
    const shiftId = event.currentTarget.dataset.id;
    console.log("Edit clicked for Shift ID:", shiftId);
    this.shiftID = shiftId;
    this.shiftInformation = false;
    this.editflag = true;
    this.fieldErrorMap = {};
    this.staffEmployementType='';
    this.shiftEndDate='';
    this.schadsMinimumEngageApplied=false;
    this.showOverTimeRate=false;

    console.log("handleeditClose in TimeSheet");

    getAddShiftDataById({ shiftId: this.shiftID })
      .then((result) => {
        const data = result.shiftwithstaffdata;

        this.isLongMorningShift = data.Is_long_Morning__c;
        this.isLongAfternoonShift = data.Is_Long_Afternoon__c;
        this.isLongNightShift = data.Is_Long_Night_Shift__c;
        this.isLongSleepoverShift = data.Is_Long_SleepOver__c;
        this.isBrokenShift =data.Broken_Shift__c;
         this.shiftEndDate=data.Shift_End_Date__c;
       const parsedTimes = this.parseOriginalShiftTimes(data.Add_Shift__r.Shift_Start_End_Time__c);
       this.orignalShiftTime = parsedTimes.start; 
        console.log("orignalShiftTime >>>", this.orignalShiftTime);
        this.brokenExtendedWage=parseFloat(data.Broken_Extended_Wage__c || 0).toFixed(2);
        this.brokenExtendedRate=parseFloat(data.Broken_Extended_Rate__c || 0).toFixed(2);
        this.brokenExtendedDuration=parseFloat(data.Broken_Extended_Duration__c || 0).toFixed(2);
         this.brokenAllowance=parseFloat(data.Broken_Shift_Allowance__c || 0).toFixed(2);
      //  console.log("data.Log_Out_Date_Time__c >>>", data.Log_Out_Date_Time__c);
         console.log('status  ' +data.Status__c);
          this.disableTimeButton=false;
         this.disableTimeButton=data.Status__c=='Cancelled';
        const loginParts = this.parseMsToTimeParts(data.Log_In_Date_Time__c);
        const logoutParts = this.parseMsToTimeParts(data.Log_Out_Date_Time__c);

        this.AddShiftStartTimeAMPM1 = loginParts.display;
        this.startTimeSelectedHour1 = loginParts.hour;
        this.startTimeSelectedMinute1 = loginParts.minute;
        this.startTimeAMPM1 = loginParts.ampm;

        this.AddShiftEndTimeAMPM1 = logoutParts.display;
        this.endTimeSelectedHour1 = logoutParts.hour;
        this.endTimeSelectedMinute1 = logoutParts.minute;
        this.endTimeAMPM1 = logoutParts.ampm;
        console.log('this.isBrokenShift  =>'+this.isBrokenShift);
        console.log('data.Staff__c  =>'+data.Staff__c);
        console.log('data.Role__c  =>'+data.Role__c);
       
        this.schadsMinimumEngageApplied =data.SCHADS_Minimum_Hours__c >0;
        this.showOverTimeRate=data.Over_Time_Tier_One_Wage__c >0;
        console.log('schadsMinimumEngageApplied  =>'+this.schadsMinimumEngageApplied);

        console.log(
          "⏰ Login:",
          this.AddShiftStartTimeAMPM1,
          this.startTimeSelectedHour1,
          this.startTimeSelectedMinute1,
          this.startTimeAMPM1
        );
        console.log(
          "⏰ Logout:",
          this.AddShiftEndTimeAMPM1,
          this.endTimeSelectedHour1,
          this.endTimeSelectedMinute1,
          this.endTimeAMPM1
        );

        this.totalReiAmount = 0.0;
        this.grandTotal = 0.0;
        console.log('data.Over_Time_Tier_One_Wage__c '+data.Over_Time_Tier_One_Wage__c);
        console.log('data.Over_Time_Tier_Two_Wage__c '+data.Over_Time_Tier_Two_Wage__c);

        const shiftWage = parseFloat(data.Shift_Wage__c || 0);
        const tier1 = parseFloat(data.Over_Time_Tier_One_Wage__c || 0);
        const tier2 = parseFloat(data.Over_Time_Tier_Two_Wage__c || 0);

        this.totalShiftWages = (shiftWage + tier1 + tier2).toFixed(2);

        this.grandTotal = this.totalShiftWages;

        this.addShiftId = data.Add_Shift__c;
        this.extendedHoursandmins = data.Extended_Duration_in_Hours_and_Mins__c;
        this.enddate = data.End_Date__c;
          console.log('data.End_time_formula__c ==>'+data.End_time_formula__c);
     
          let etimeParts = [];

          if (data.End_time_formula__c) {

              // ✅ child value exists — no split required
              this.shiftEndtime = data.End_time_formula__c;

          } else {

              // ✅ fallback to parent field and split
              etimeParts =
                  data.Add_Shift__r?.Shift_Start_End_Time__c?.split("-") || [];

              this.shiftEndtime = etimeParts[1]?.trim() || "";
          }

         console.log('shiftEndtime ==> ', this.shiftEndtime);
      //  console.log('etimeParts ==>'+etimeParts);
    
        this.shiftType = data.Add_Shift__r.Shift_Type__c;
        this.isCustomShifts = this.shiftType === "Custom";
        if (this.shiftType === "Sleepover Shift") {
          this.isHourlyRateDisabled = false;
        } else {
          this.isHourlyRateDisabled = true;
        }
        this.staffid = data.Staff__c;
        this.currentShiftrates = data.Staff_Final_Hourly_Rate__c;
        console.log(' this.DURATION', data.Extended_Duration__c);
        this.isExtendedShift = parseFloat(data.Extended_Duration__c || 0) > 0;
        console.log(' this.isExtendedShift', this.isExtendedShift);
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
          this.rateRows = this.rateRows.map(r => ({
          ...r,
          rateLabel: r.rowShiftType === "Sleepover Shift"
              ? "Allowance"
              : "Hourly Rate"
          }));
        //     this.IsLongShift = this.rateRows.length >= 1;

        this.rateRows.sort((a, b) => a.index - b.index);

        console.log(
          "🕵️ breakTimingList BEFORE check:",
          result?.breakTimingList
        );
        if (result.breakTimingList) {
          console.log(
            "✅ Received breakTimingList from Apex:",
            result.breakTimingList
          );

          const parsedBreaks = JSON.parse(result.breakTimingList);
          console.log("✅ Parsed Breaks:", parsedBreaks);

          if (Array.isArray(parsedBreaks)) {
            this.breakTimeRecords = parsedBreaks.map((record, index) => {
              const selected = record.isBreakIncluded__c === true;

              return {
                ...record,
                Break_Start_Time__c: record.Break_Start_Time__c || "",
                Break_End_Time__c: record.Break_End_Time__c || "",
                selected
              };
            });
          } else {
            console.warn("⚠️ Parsed breaks is empty array.");
            this.breakTimeRecords = [];
          }
        } else {
          console.warn("⚠️ No breakTimingList found in result.");
          this.breakTimeRecords = [];
        }

     /*    console.log(
          "this.rateRows:  in   final edit ",
          JSON.stringify(this.rateRows)
        ); */

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
         const brokenExtend = parseFloat(this.brokenExtendedWage) || 0;
         const brokenAllowance = parseFloat(this.brokenAllowance) || 0;

        this.grandTotal = shiftWages + reimb;
        if (this.isExtendedShift) {
          this.grandTotal += extended;
        }
        if (this.isSleepOver) {
          this.grandTotal += sleepover;
        }
        if(this.isBrokenShift){
           this.grandTotal += brokenExtend;
           this.grandTotal += brokenAllowance;
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
  parseOriginalShiftTimes(rangeStr) {
    console.log('rangeStr ==>'+rangeStr);

    if (!rangeStr || !rangeStr.includes("-")) {
        return { start: null, end: null };
    }

    const parts = rangeStr.split("-");

    const startTime = parts[0].trim(); // "9:00 AM"
    const endTime   = parts[1].trim(); // "10:00 PM"

    console.log("Parsed Original Start:", startTime);
    console.log("Parsed Original End:", endTime);

    return {
        start: startTime,
        end: endTime
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
    /* console.log(
      "this.rateRows:  in   during onchange  edit ",
      JSON.stringify(this.rateRows)
    ); */
  }

  async handlesubmit(event) {
    console.log("this.submissionFlag >>", this.submissionFlag);
    console.log('this.confirmationData ==> '+JSON.stringify(this.confirmationData));
    const { totalShiftIdlist, totalHours,status } = this.confirmationData;
    console.log("totalHours in handlesubmit >>", totalHours);

   /*  if (totalHours == 0 && status !='Cancelled') {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "Total hours cannot be zero. Please approve a shift with valid duration",
          variant: "error"
        })
      );
      return;
    } */

    this.isLoading = true; // ✅ Show spinner before async call
    console.log(
      "➡️ Shift ID List in handlesubmit :",
      JSON.stringify(Array.from(totalShiftIdlist))
    );
    try {
      //   console.log("➡️ Shift ID List:", JSON.stringify(Array.from(totalShiftIdlist)));

      //   const breakHours = await getTotalBreakHours({
      //     shiftIDlist: Array.from(totalShiftIdlist)
      //   });
      //   console.log("Total break hours returned from Apex:", breakHours);

      //   // 🔁 2. Subtract break hours from totalHours
      //   const effectiveHours = parseFloat(totalHours) - parseFloat(breakHours);
      //   console.log("Effective hours (after break deduction):", effectiveHours);
      //   //this.confirmationData.totalHours = effectiveHours;
      //  this.confirmationData = {
      //     ...this.confirmationData,
      //     totalHours: parseFloat(effectiveHours)
      //   };

      //   // ✅ Log the updated value
      //   console.log("✅ Total hours returned after break (updated):", this.confirmationData.totalHours);

      const response = await updateAllocations({
        shiftIDlist: Array.from(totalShiftIdlist)
      });
      console.log(
        "📥 Response from updateAllocations Apex call:",
        JSON.stringify(response)
      );
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
      this.isLoading = false; // ✅ Hide spinner only after completion
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
    console.log(' shift status==> '+event.currentTarget.dataset.status);
    let status=event.currentTarget.dataset.status;
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
      this.confirmationData = { totalShiftIdlist, totalHours,status };
    }
  }

  handleUpdate(event) {
    this.showSpinner = true;
    event.preventDefault(); // stop the form from submitting
    const fields = event.detail.fields;
    // console.log('in this.isExtendedShift'+this.isExtendedShift)
    this.extendedDuartion = parseFloat(this.extendedDuartion);
    console.log(' this.extendedDuartion ', this.extendedDuartion );
    this.varianceRate = parseFloat(this.varianceRate);
    fields.Variance_Rate__c = this.varianceRate;
    fields.Extended_Duration__c = this.extendedDuartion;
    fields.Extended_Duration_in_Hours_and_Mins__c = this.extendedHoursandmins;
    fields.Log_In_Date_Time__c = this.startTimeInMs;
    fields.Log_Out_Date_Time__c = this.endTimeInMs;

    fields.Broken_Extended_Duration__c = this.brokenExtendedDuration;
    fields.Broken_Extended_Rate__c = this.brokenExtendedRate;
    fields.Broken_Extended_Wage__c = this.brokenExtendedWage;

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
    this.recalculateBrokenExcessHours(event.target.value);
  }

  recalculateBrokenExcessHours(logoutTime24) {

    // Only run for broken shifts
    if (!this.isBrokenShift) return;
    console.log('original shift ==>'+this.orignalShiftTime);

    // Convert original shift start to 24h
    let shiftStart24 = this.convertTo24HourFormat(
        this.orignalShiftTime.toLowerCase()
    );

    let startDT = new Date(`${this.enddate}T${shiftStart24.replace("Z","")}`);
    let endDT   = new Date(`${this.enddate}T${logoutTime24.replace("Z","")}`);

    // Handle overnight scenario
    if (endDT <= startDT) {
        endDT.setDate(endDT.getDate() + 1);
    }

    let spanHours =
        (endDT.getTime() - startDT.getTime()) / (1000 * 60 * 60);

    let excess = spanHours > 12 ? (spanHours - 12) : 0;

    console.log("🔄 Broken Shift Span:", spanHours, " Excess:", excess);
    this.brokenExtendedDuration=excess.toFixed(2);
    this.brokenExtendedRate= excess <=0 ? 0 : this.currentShiftrates *2;
    this.brokenExtendedWage= (this.brokenExtendedRate * excess).toFixed(2); 
    this.calculateExtendedWage();
/* 
    // 🔥 Update tracked UI values (bind to fields)
    this.brokenExtendedDuration = excess.toFixed(2);
    this.brokenExtendedRate =
        excess > 0 ? (this.hourlyRate * 2) : 0;
    this.brokenExtendedWage =
        (this.brokenExtendedRate * excess).toFixed(2); */
}


  /* async handleeditAllocation(event) {
    console.log("handleeditAllocation is called ");
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
    console.log("this.currentViewFlag:", this.currentViewFlag);

    await this.delay(5000);
    
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

    const breakRecordsToUpdate = this.breakTimeRecords.map((rec) => ({
      Id: rec.Id,
      isBreakIncluded__c: rec.selected // true or false from UI
    }));

    updateSelectedBreakCheckboxes({
      parentShiftId: this.shiftID,
      breakRecords: breakRecordsToUpdate
    })
      .then(() => {
        console.log("✅ Break records updated based on selected state.");
      })
      .catch((error) => {
        console.error("❌ Error updating break records:", error);
      });
    console.log("allocationId in onsuccess  ", allocationId);
    editAllocation({ allocationId: allocationId })
      .then((result) => {
        console.log("Apex call successful:", result);
        // Optionally show a success toast
        this.editflag = false;
        this.showSpinner = false;
        // this.startTimeSelectedHour1 = " ";
        // this.startTimeSelectedMinute1 = " ";
        // this.AddShiftStartTimeAMPM1 = " ";
        // this.startTimeAMPM1 = " ";
        // this.endTimeSelectedHour1 = " ";
        // this.endTimeSelectedMinute1 = " ";
        // this.endTimeAMPM1 = " ";
        // this.AddShiftEndTimeAMPM1 = " ";
      })
      .catch((error) => {
        console.error("Apex call failed:", error);
        // Optionally show an error toast
      });
  } */

  async handleeditAllocation(event) {
    console.log("handleeditAllocation is called ");

    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Shift edited successfully.",
      variant: "success"
    });
    this.dispatchEvent(toastEvent);

    this.shiftInformation = true;

    const allocationId = event.detail.id;

    console.log("Before delay");
    await this.delay(5000);
    console.log("After delay");

    await this.runPostDelayLogic(allocationId);
  }

  async runPostDelayLogic(allocationId) {
    console.log("Running after delay...");

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

    const breakRecordsToUpdate = this.breakTimeRecords.map((rec) => ({
      Id: rec.Id,
      isBreakIncluded__c: rec.selected
    }));

    try {
      await updateSelectedBreakCheckboxes({
        parentShiftId: this.shiftID,
        breakRecords: breakRecordsToUpdate
      });

      console.log("✅ Break records updated");
    } catch (error) {
      console.error("❌ Error updating break records:", error);
    }

    try {
      const result = await editAllocation({ allocationId });
      console.log("Apex call successful:", result);

      this.editflag = false;
      this.showSpinner = false;

    } catch (error) {
      console.error("Apex call failed:", error);
    }
  }

  delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleShiftError(event) {
    // Log the full error for debugging
    console.error(
      "⚠️ Shift Edit Error:",
      JSON.stringify(event.detail, null, 2)
    );

    // Show a user-friendly error message (optional)
    const toastEvent = new ShowToastEvent({
      title: "Error",
      message:
        event.detail.message || "An error occurred while saving the shift.",
      variant: "error"
    });
    this.dispatchEvent(toastEvent);
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
        parseFloat(this.sleepOverWage) + parseFloat(this.brokenExtendedWage) +parseFloat(this.brokenAllowance) ;
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
        parseFloat(this.extendedWage) + parseFloat(this.brokenExtendedWage);

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
  @track showCancelNotes=false;
  @track shiftCancelnotes='';
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
  handleShiftCancelClick(event){
     const notes = event.currentTarget.dataset.shiftcancelnotes;
     console.log(' cancel notes=>'+notes);
     this.showCancelNotes=true;
     this.shiftCancelnotes =event.currentTarget.dataset.shiftcancelnotes;

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
    this.isShowJournal = false;
     this.showCancelNotes=false;
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
        parseFloat(this.sleepOverWage)+ parseFloat(this.brokenExtendedWage);
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

  handleAddToXero(event) {
        const staffId = event.currentTarget.dataset.id;
        console.log('🟦 Add to Xero clicked for Staff ID:', staffId);

        // Example inputs (replace these with dynamic values from your component)
        const numberOfUnits = [8, 8, 8, 8, 8, 0, 0]; // hours for the week
        const startDateStr = this.weekStartDate;
        const endDateStr = this.weekEndDate;

        console.log("this.weekStartDate",this.weekStartDate);
        console.log("this.weekEndDate", this.weekEndDate);


        if (this.AccountingServices === 'Xero') {
            insertTimeSheet({
                staffId: staffId,
                startDateStr: startDateStr,
                endDateStr: endDateStr
            })
            .then((result) => {
                console.log('✅ Xero Timesheet successfully sent:', result);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Timesheet sent to Xero successfully!',
                        variant: 'success'
                    })
                );
            })
            .catch((error) => {
                console.error('💥 Error sending timesheet:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body ? error.body.message : error.message,
                        variant: 'error'
                    })
                );
            })
            .finally(() => {
                this.isLoading = false;
            });
        }

        if (this.AccountingServices === 'MYOB') {
            const savedToken = sessionStorage.getItem('myobAccessToken');
            const refreshToken = sessionStorage.getItem('myobRefreshToken');
            const savedCompanyFileUri = sessionStorage.getItem('companyFileUri');

            console.log("📦 Retrieved Token:", savedToken);
            console.log("📦 Retrieved Company File URI:", savedCompanyFileUri);

            // ---------------------------------------------------------------
            // ⭐ 1) CHECK IF TOKEN OR COMPANY FILE URI IS MISSING
            // ---------------------------------------------------------------
            if (!savedToken || !savedCompanyFileUri || savedToken === 'undefined' || savedCompanyFileUri === 'undefined') {
                console.log("🔵 Missing MYOB token or companyFileUri — calling loadAuthLink()");
                
                this.loadAuthLink();  // ⬅️ redirect user to authenticate MYOB again
                return; // ⛔ stop here — do NOT call createMyobTimesheet
            }

            // ---------------------------------------------------------------
            // ⭐ 2) BOTH VALUES EXIST → CALL createMyobTimesheet
            // ---------------------------------------------------------------
            console.log("🟢 Token & CompanyFileUri found — calling createMyobTimesheet()");
            this.isLoading = true;
            console.log("📤 Sending Timesheet...");
            console.log("Staff ID:", staffId);
            console.log("Start:", startDateStr);
            console.log("End:", endDateStr);
            console.log("Saved Access Token:", savedToken);
            console.log("Saved Refresh Token:", refreshToken);
            console.log("Company File URI:", savedCompanyFileUri);

            createMyobTimesheet({
                staffId: staffId,
                startDateStr: startDateStr,
                endDateStr: endDateStr,
                accessToken: savedToken,
                refreshToken: refreshToken,
                companyFileUri: savedCompanyFileUri
            })
            .then((result) => {

                console.log("🟩 RAW APEX RESULT (Already JSON Object):", result);

                // ⚡ Do NOT JSON.parse(result) — Apex returns an object, not a string
                const newAccessToken  = result.accessToken;
                const newRefreshToken = result.refreshToken;
                const tsResponse      = result.timesheetResponse;

                console.log("🔐 New Access Token:", newAccessToken);
                console.log("🔁 New Refresh Token:", newRefreshToken);
                console.log("📄 Timesheet Response from Apex:", tsResponse);

                // Save tokens back to storage
                if (newAccessToken) {
                    sessionStorage.setItem("myobAccessToken", newAccessToken);
                }
                if (newRefreshToken) {
                    sessionStorage.setItem("myobRefreshToken", newRefreshToken);
                }

                console.log("💾 Tokens saved back to sessionStorage.");

                // Success Toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Success",
                        message: "Timesheet sent to MYOB successfully!",
                        variant: "success"
                    })
                );
            })
            .catch((error) => {

                console.error("💥 Error sending timesheet:", error);

                let message = "Unknown error";

                if (error?.body?.message) {
                    message = error.body.message;
                } else if (error?.message) {
                    message = error.message;
                }

                // Error Toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Error",
                        message: message,
                        variant: "error"
                    })
                );
            })
            .finally(() => {
                this.isLoading = false;
            });

        }

  }

    async loadAuthLink() {
          console.log('🌀 [Step 4] Fetching MYOB authorization link from Apex...');
  
          try {
              this.loading = true;
              this.currentUrl = window.location.href;
              console.log('currentUrl >>>>', this.currentUrl);
              const result = await getMyobAuthLink({ redirectUrl: this.currentUrl });
              console.log('✅ [Step 4.1] Apex returned MYOB auth link:', result);
  
              if (result) {
                  console.log('🟩 [Step 4.2] Opening MYOB auth page in new tab...');
                  // 🔹 Opens MYOB in NEW TAB (not popup)
                  const newTab = window.location.href = result;
                  if (newTab) {
                      console.log('✅ [Step 4.3] New tab opened successfully:', newTab.location);
                  } else {
                      console.warn('⚠️ [Step 4.3] Popup blocker may have prevented new tab.');
                  }
              } else {
                  console.error('❌ [Step 4.4] No auth link returned from Apex.');
              }
          } catch (error) {
              console.error('❌ [Step 4.5] Error while fetching MYOB auth link:', error);
          } finally {
              this.loading = false;
              console.log('✅ [Step 4.6] loadAuthLink() completed.');
          }
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
              let totalBreakMinutes = 0;

              if (shift.Reimbursements__r) {
                shift.Reimbursements__r.forEach((reim) => {
                  totalMileageOthers += parseFloat(reim.Mileage_Others__c) || 0;
                  totalMileageAmount += parseFloat(reim.Mileage_Amount__c) || 0;
                });
              }

              console.log(
                `   ➡️ Mileage Totals for Shift [${shift.Id}] → Others: ${totalMileageOthers}, Amount: ${totalMileageAmount}`
              );

              if (shift.Break_Timings__r && shift.Break_Timings__r.length > 0) {
                console.log(
                  `🔎 Found ${shift.Break_Timings__r.length} break records for shift: ${shift.Id}`
                );
                shift.Break_Timings__r.forEach((breakRec, index) => {
                  const breakTime = breakRec.Break_Time__c;
                  console.log(
                    `⏱ Break #${index + 1} - Raw Break Time: ${breakTime}`
                  );

                  if (breakTime && breakTime.includes(":")) {
                    const parts = breakTime.split(":");
                    const hours = parseInt(parts[0], 10);
                    const minutes = parseInt(parts[1], 10);

                    if (!isNaN(hours) && !isNaN(minutes)) {
                      const breakMinutes = hours * 60 + minutes;
                      totalBreakMinutes += breakMinutes;

                      console.log(
                        `✅ Parsed Break #${index + 1}: ${hours} hours, ${minutes} minutes (${breakMinutes} mins)`
                      );
                      console.log(
                        `➕ Running Total Break Minutes in handleExport: ${totalBreakMinutes}`
                      );
                    } else {
                      console.warn(
                        `⚠️ Failed to parse hours/minutes for Break #${index + 1}:`,
                        breakTime
                      );
                    }
                  } else {
                    console.warn(
                      `⚠️ Invalid break time format for Break #${index + 1}:`,
                      breakTime
                    );
                  }
                });
              } else {
                console.log(`ℹ️ No break records for shift: ${shift.Id}`);
              }

              const totalBreakHours = (totalBreakMinutes / 60).toFixed(2);
              console.log(
                `⏳ Total Break Minutes: ${totalBreakMinutes}, Converted to Hours: ${totalBreakHours}`
              );
              const durationRaw = shift.Actual_Duration__c;
              const durationCalculated = isNaN(durationRaw) ? 0 : durationRaw;
              const effectiveDuration = Math.max(
                0,
                durationCalculated - parseFloat(totalBreakHours)
              ).toFixed(2);
              console.log(
                `🧮 Effective Duration (after break deduction): ${effectiveDuration}`
              );

              const typeofAddress = shift.Type_of_Address__c;

              const fullAddress = [
                    shift.Shift_Address__Street__s,
                    shift.Shift_Address__City__s,
                    shift.Shift_Address__StateCode__s,
                    shift.Shift_Address__PostalCode__s,
                    shift.Shift_Address__CountryCode__s
                  ]
                    .filter(Boolean)   // removes null / undefined
                    .join(", ");

              // Calculate extended duration
              const extendedDuration = (() => {
                const value =
                  shift.Extended_Duration_in_Hours_and_Mins__c ??
                  shift.Extended_Duration__c ??
                  0;

                // If numeric
                if (typeof value === "number") {
                  return parseFloat(value.toFixed(2));
                }

                // If hh:mm string
                if (typeof value === "string" && value.includes(":")) {
                  const [h, m] = value.split(":").map(Number);
                  if (!isNaN(h) && !isNaN(m)) {
                    return parseFloat((h + m / 60).toFixed(2));
                  }
                }

                return 0;
              })();
              console.log(`Extended Duration: ${extendedDuration}`);
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
                // totalDuration: isNaN(shift.Actual_Duration__c)
                //   ? 0
                //   : shift.Actual_Duration__c,
                totalDuration:
                  isNaN(parseFloat(effectiveDuration)) ||
                  parseFloat(effectiveDuration) === 0
                    ? durationCalculated.toFixed(2)
                    : effectiveDuration,

                shiftDate: this.formatDateToDDMMYYYY(shift.Date__c),
                serviceTypeShort:
                  shift.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c?.substring(
                    0,
                    30
                  ) + "..." || "--",
                serviceType:
                  shift.Services_and_Support_Plans__r?.[0]
                    ?.Service_Type_Name__c || "--",
                facilityName: shift.Facility__c || "--",
                clientSignature: shift.Client_Signature__c,
                clientName: shift.Services_and_Support_Plans__r?.[0]?.Client__r
                  ? `${shift.Services_and_Support_Plans__r[0].Client__r.First_Name__c || ""} ${shift.Services_and_Support_Plans__r[0].Client__r.Last_Name__c || ""}`.trim()
                  : "--",
                mileageOthersTotal: totalMileageOthers.toFixed(2),
                mileageAmountTotal: totalMileageAmount.toFixed(2),
                fullAddress: fullAddress,
                typeofAddress: typeofAddress,
                extendedDuration: extendedDuration
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
            this.totalShiftDuration = parseFloat(this.totalShiftDuration.toFixed(2));
            this.totalKms = processedShifts.reduce(
              (sum, shift) => sum + (parseFloat(shift.mileageOthersTotal) || 0),
              0
            );
            this.totalKms = parseFloat(this.totalKms.toFixed(2));
            this.totalexpenses = processedShifts.reduce(
              (sum, shift) => sum + (parseFloat(shift.mileageAmountTotal) || 0),
              0
            );
            this.totalexpenses = parseFloat(this.totalexpenses.toFixed(2));
            this.sleepoverDuration = processedShifts.reduce(
              (sum, shift) =>
                sum + (parseFloat(shift.Long_Sleepover_Duartion__c) || 0),
              0
            );
            this.sleepoverDuration = parseFloat(this.sleepoverDuration.toFixed(2));
            this.totalApprovedLoggedDuration = processedShifts.reduce(
              (sum, shift) => {
                return shift.Approval_Status__c === "Approved"
                  ? sum + (parseFloat(shift.duration) || 0)
                  : sum;
              },
              0
            );
            this.totalApprovedLoggedDuration = parseFloat( this.totalApprovedLoggedDuration.toFixed(2) );

            // 👇 NEW: check if any processed shift is NOT NDIS
            this.otherThanNdis = processedShifts.some(
              (shift) =>
                shift?.Staff__r?.Facility__r?.Type_of_Service__c !== "NDIS"
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

  @track exportTotalShifts = 0;
  @track exportTotalDuration = 0;
  @track exportTotalExpenses = 0;

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
        shift.totalDuration,
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
      let finalY = (doc.lastAutoTable?.finalY || 35) + 10;
      const pageHeight = doc.internal.pageSize.height;

      if (pageHeight - finalY < 40) {
        doc.addPage();
        finalY = 20;
      }

      this.exportTotalShifts = this.selectedStaffShiftsforPDF.length;
      this.exportTotalDuration = this.selectedStaffShiftsforPDF.reduce(
        (sum, shift) => sum + parseFloat(shift.totalDuration ),
        0
      );
      this.exportTotalExpenses = this.selectedStaffShiftsforPDF.reduce(
        (sum, shift) => sum + parseFloat(shift.mileageAmountTotal || 0),
        0
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("Summary:", 10, finalY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Shifts: ${this.exportTotalShifts}`, 10, finalY + 8);
      doc.text(
        `Total Duration: ${this.exportTotalDuration.toFixed(2)} hours`,
        10,
        finalY + 16
      );
      doc.text(`Total Expenses: $${this.exportTotalExpenses.toFixed(2)}`, 10, finalY + 24);

      const fileName = `${this.StaffName1.replace(/\s+/g, "_")}_Shifts.pdf`;
      doc.save(fileName);
      console.log("✅ PDF saved:", fileName);
      this.isModalOpenfortimesheetExport = false;
      this.frequency = "";
      this.startDate = "";
      this.exportRange = "";
      this.exportFormat = "";
      this.exportTotalShifts = 0;
      this.exportTotalDuration = 0;
      this.exportTotalExpenses = 0;
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      this.showToast("Error", "Failed to generate PDF.", "error");
    }
  }

  formatDateForCSV(dateInput) {
    if (!dateInput) return "";

    const parts = dateInput.split("/");

    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];

      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return dateInput;
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
        "Login",
        "Logout",
        "Break(min)",
        "Duration (hr)",
        "Mileage (km)",
        "Expense",
        "Variance (hr)",
        "Signature",
        "Type Of Address",
        "Address"
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
            // shift.shiftDate,
            "=\"" + this.formatDateForCSV(shift.shiftDate) + "\"",
            shift.shiftType,
            this.otherThanNdis ? shift.clientName : shift.serviceType,
            shift.facilityName,
            shift.formattedStart,
            shift.formattedEnd,
            shift.Login_Time_Formula__c,
            shift.Logout_Time_Formula__c,
            shift.Break__c,
            shift.totalDuration,
            shift.mileageOthersTotal,
            `$${parseFloat(shift.mileageAmountTotal || 0).toFixed(2)}`,
            shift.extendedDuration,
            shift.clientSignature ? "Signed" : "Not Signed",
            shift.typeofAddress,
            shift.fullAddress
          ];
        }
      );
      console.log("📊 Data Rows prepared:", dataRows);

      // Build CSV content
      let csvContent = [headers, ...dataRows]
        .map(row => row.map(cell => this.quoteCSV(cell)).join(","))
        .join("\n");
      console.log("📄 CSV content before summary:\n", csvContent);

      // Add Summary Section
      this.exportTotalShifts = (this.selectedStaffShiftsforPDF || []).length;
      this.exportTotalDuration = (this.selectedStaffShiftsforPDF || []).reduce(
        (sum, shift) => sum + parseFloat(shift.totalDuration  || 0),
        0
      );
      this.exportTotalExpenses = (this.selectedStaffShiftsforPDF || []).reduce(
        (sum, shift) => sum + parseFloat(shift.mileageAmountTotal || 0),
        0
      );

      csvContent += `\n\nSummary\n`;
      csvContent += `Total Shifts,${this.exportTotalShifts}\n`;
      csvContent += `Total Duration (hrs),${this.exportTotalDuration.toFixed(2)}\n`;
      csvContent += `Total Expenses,$${this.exportTotalExpenses.toFixed(2)}\n`;

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

      // Reset values
      this.frequency = "";
      this.startDate = "";
      this.exportRange = "";
      this.exportFormat = "";
      this.exportTotalShifts = 0;
      this.exportTotalDuration = 0;
      this.exportTotalExpenses = 0;
      console.log("🔄 Export state reset");
    } catch (error) {
      console.error("❌ Error generating CSV:", error);
      this.showToast("Error", "Failed to generate CSV.", "error");
    }
  }

  quoteCSV(value) {
    if (value === null || value === undefined) return '""';

    const str = String(value).replace(/"/g, '""'); // Escape inner quotes
    return `"${str}"`; // Wrap with double quotes
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
    console.log("🔄 [createMockShifts] START");

    this.memberSummaries = [];
    const summaryMap = new Map();
    console.log("📥 dailyShiftMap >>", JSON.stringify(this.dailyShiftMap));

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
              shiftRows: [],
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
              totalvariance: 0
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
      const staffId = staffRecord.Id || staffRecord.staffId;
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
          shiftRows: [],
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
          totalvariance: 0
        };
      }

      staffSummary.shifts = [];
      let mismatchCounter = 0;

      // 🔎 Process each shift
      staffSummary.allShifts.forEach((shift) => {
        const planned = shift.Duration__c || 0;
        const actual = shift.Actual_Duration__c || 0;
        const extended = shift.Extended_Duration_in_Hours_and_Mins__c || 0;
        const variance = shift.Variance_Wage__c || 0;

        const isMismatch = actual !== planned + extended;
        if (isMismatch) mismatchCounter++;

        const clientNames = new Set();
        const serviceNames = new Set();

        if (Array.isArray(shift.Services_and_Support_Plans__r)) {
          shift.Services_and_Support_Plans__r.forEach((service) => {
            const client = service.Client__r;
            if (client) {
              const fullName =
                `${client.First_Name__c || ""} ${client.Last_Name__c || ""}`.trim();
              clientNames.add(fullName);
            }

            const tracker = service.Funds_Tracker__r;
            if (tracker?.Name) serviceNames.add(tracker.Name);
          });
        }

        const logIn = shift.Log_In_Date_Time__c;
        const logOut = shift.Log_Out_Date_Time__c;
        const totalLoggedHours =
          logIn && logOut ? this.calculateHoursDifference(logIn, logOut) : 0;

        staffSummary.shifts.push({
          id: `${staffId}-${shift.Id}`,
          date: shift.Date__c,
          isForDay: true,
          startTime: shift.Start_time_Formula__c,
          endTime: shift.End_time_formula__c,
          shiftDuration: actual,
          actualDuration: planned,
          hours: planned,
          logInTimeFormatted: this.formatTime(logIn),
          logOutTimeFormatted: this.formatTime(logOut),
          totalLoggedHours,
          formattedLoggedHours: this.formatHoursToHrMin(totalLoggedHours),
          clientNames: Array.from(clientNames),
          serviceNames: Array.from(serviceNames)
        });
      });

      // ✅ Build day-wise shiftRows for UI
      staffSummary.shiftRows = this.weekDays.map((day) => {
        const date = day.date;
        const shiftsForDay = staffSummary.allShifts.filter(
          (s) => s.Date__c === date
        );
        const dayTotal = shiftsForDay.reduce(
          (sum, s) => sum + (s.Duration__c || 0),
          0
        );

        return {
          key: `${staffSummary.staffId}-${date}`,
          hasShift: shiftsForDay.length > 0,
          hours: dayTotal > 0 ? dayTotal.toFixed(1) : null,
          cellClass: shiftsForDay.length > 0 ? "slds-theme_info" : ""
        };
      });

      staffSummary.hasShiftForAnyDay = staffSummary.shifts.length > 0;
      staffSummary.totalDuration = staffSummary.allShifts.reduce(
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
      staffSummary.totalSleepoverHours = staffSummary.allShifts.reduce(
        (sum, s) => sum + (s.Sleepover_Shift_Hours__c || 0),
        0
      );
      staffSummary.varianceCount = staffSummary.allShifts.reduce(
        (sum, s) => sum + (s.Variance_Wage__c || 0),
        0
      );
      staffSummary.mismatchCount = mismatchCounter;
      staffSummary.hasMismatch = mismatchCounter > 0;
      staffSummary.totalvariance = parseFloat(
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
            staffSummary.totalMileageAmount += parseFloat(
              r.Mileage_Amount__c || 0
            );
            staffSummary.totalMileageOthers += parseFloat(
              r.Mileage_Others__c || 0
            );
          });
        }
      });

      staffSummary.totalMileageAmount = parseFloat(
        (staffSummary.totalMileageAmount || 0).toFixed(2)
      );
      staffSummary.totalMileageOthers = parseFloat(
        (staffSummary.totalMileageOthers || 0).toFixed(2)
      );

      this.memberSummaries.push(staffSummary);
    });

    console.log(
      "✅ Final memberSummaries:",
      JSON.stringify(this.memberSummaries, null, 2)
    );

    // Export logic
    if (this.exportFormat === "PDF") {
      this.handleDownloadPDFFortimesheet();
    } else if (this.exportFormat === "CSV") {
      this.handleDownloadClickfortimesheet();
    }

    console.log("🏁 [createMockShifts] END");
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

  /* get processedSummaries() {
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
  } */

  get processedSummaries() {
    console.log("🚀 Processing Staff Data...");
    return this.paginatedSummaries.map((staff) => {
      console.log("👤 Staff Record:", JSON.stringify(staff, null, 2));

      const shiftRows = this.weekDays.map((day, index) => {
        console.log(`📅 Checking Day: ${day.date} (Index: ${index})`);

        // Get all shifts for this staff on that date
        const shiftsForDay = (staff.shifts || []).filter(
          (s) => s.date === day.date && s.isForDay
        );
        console.log(
          "🔍 Shifts For Day:",
          JSON.stringify(shiftsForDay, null, 2)
        );

        // Sum hours for all shifts
        const totalHours = shiftsForDay.reduce(
          (sum, s) => sum + (parseFloat(s.hours) || 0),
          0
        );

        const row = {
          key: `${staff.id}-${day.date}`,
          hasShift: shiftsForDay.length > 0,
          hours: totalHours > 0 ? totalHours.toFixed(1) : "",
          cellClass: shiftsForDay.length > 0 ? "slds-theme_info" : ""
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

  /* handleDownloadClickfortimesheet() {
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
          totalHours += Number(shift.totalHours) || 0;
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
  } */

  handleDownloadClickfortimesheet() {
    console.log("📥 handleDownloadClickfortimesheet triggered");

    // 👉 Helper to format date as dd/mm/yyyy
    function formatDate(date) {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      // return `${day}/${month}/${year}`;
      const formatted = `${year}-${month}-${day}`; // ✅ ISO format

      console.log("✅ Converted to yyyy-mm-dd:", formatted);

      return formatted;
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
      // header.push(formatDate(current)); 
      header.push(`="${formatDate(current)}"`);
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

      // Loop from startDate → endDate and sum shifts per date
      let current = new Date(this.ExportStartDate);
      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0]; // YYYY-MM-DD

        // Get all shifts for this date
        const shiftsForDay = staff.shifts.filter(
          (s) => s.date === dateStr && s.isForDay
        );

        if (shiftsForDay.length > 0) {
          // Sum metrics for this date
          const dayHours = shiftsForDay.reduce(
            (sum, s) => sum + (parseFloat(s.hours) || 0),
            0
          );
          const dayMileage = shiftsForDay.reduce(
            (sum, s) => sum + (parseFloat(s.mileage) || 0),
            0
          );
          const dayExpense = shiftsForDay.reduce(
            (sum, s) => sum + (parseFloat(s.expense) || 0),
            0
          );
          const daySleepover = shiftsForDay.reduce(
            (sum, s) => sum + (parseFloat(s.sleepoverHours) || 0),
            0
          );
          const dayVariance = shiftsForDay.reduce(
            (sum, s) => sum + (parseFloat(s.variance) || 0),
            0
          );

          // Push summed hours for this date
          row.push(dayHours.toFixed(2));

          // Add to totals
          totalHours += dayHours;
          totalMileage += dayMileage;
          totalExpense += dayExpense;
          totalSleepover += daySleepover;
          totalVariance += dayVariance;

          console.log(
            `   📅 ${dateStr} → Hours: ${dayHours}, Mileage: ${dayMileage}, Expense: ${dayExpense}, Sleepover: ${daySleepover}, Variance: ${dayVariance}`
          );
        } else {
          row.push("-");
          console.log(`   📅 ${dateStr} → No shift found`);
        }

        current.setDate(current.getDate() + 1);
      }

      // Add totals to the row
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

          // Get all shifts for the day
          const shiftsForDay = staff.shifts.filter(
            (s) => s.date === dateStr && s.isForDay
          );

          if (shiftsForDay.length > 0) {
            const dayHours = shiftsForDay.reduce(
              (sum, s) => sum + (parseFloat(s.hours) || 0),
              0
            );
            const dayMileage = shiftsForDay.reduce(
              (sum, s) => sum + (parseFloat(s.mileage) || 0),
              0
            );
            const dayExpense = shiftsForDay.reduce(
              (sum, s) => sum + (parseFloat(s.expense) || 0),
              0
            );
            const daySleepover = shiftsForDay.reduce(
              (sum, s) => sum + (parseFloat(s.sleepoverHours) || 0),
              0
            );
            const dayVariance = shiftsForDay.reduce(
              (sum, s) => sum + (parseFloat(s.variance) || 0),
              0
            );

            row.push(dayHours.toFixed(2));

            totalHours += dayHours;
            totalMileage += dayMileage;
            totalExpense += dayExpense;
            totalSleepover += daySleepover;
            totalVariance += dayVariance;
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

  handleBreakCheckboxChange(event) {
    const recId = event.target.dataset.id;
    const isChecked = event.target.checked;
    console.log("selected break id : ", recId, " isChecked : ", isChecked);

    this.breakTimeRecords = this.breakTimeRecords.map((record) => {
      if (record.Id === recId) {
        return { ...record, selected: isChecked };
      }
      return record;
    });

    this.selectAllChecked = this.breakTimeRecords.every(
      (record) => record.selected
    );
  }

  handleSelectAll(event) {
    const isChecked = event.target.checked;

    // Update the selection status directly in each record
    this.breakTimeRecords = this.breakTimeRecords.map((record) => ({
      ...record,
      selected: isChecked
    }));

    this.selectAllChecked = isChecked;
  }

  handleKeyShortcut(event) {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
        event.preventDefault();
        this.handleBackClick();
        }
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyO') {
        event.preventDefault();
        this.handleBulkApproveClick();
        }
  }

  async exchangeCodeAndCloseTab(code) {
      try {
          this.loading = true;
          console.log('✅ Access code:', code);

          // Load any saved tokens
          const savedAccess  = sessionStorage.getItem("myobAccessToken");
          const savedRefresh = sessionStorage.getItem("myobRefreshToken");
          const savedUri     = sessionStorage.getItem("companyFileUri");
          const savedGuid    = sessionStorage.getItem("myobcompanyFileGuid");

          console.log('savedAccess >>>>>>', savedAccess);
          console.log('savedRefresh >>>>>>', savedRefresh);
          console.log('companyFileUri >>>>>>', savedUri);
          console.log('companyFileGuid >>>>>>', savedGuid);

          this.token          = savedAccess;
          this.refreshToken   = savedRefresh;
          this.companyFileUri = savedUri;
          this.companyFileGuid = savedGuid;

          // STEP 1: No saved tokens → Exchange code
          if (!savedAccess || !savedRefresh || savedAccess === "undefined" || savedRefresh === "undefined") {
              console.log("🔵 No saved tokens — calling Apex token exchange");

              // Generate redirect URL
              const baseUrl = window.location.origin + '/s/';
              const tokenResponse = await exchangeMyobCodeForToken({
                  code: code,
                  redirectUrl: baseUrl
              });

              const tokenData = JSON.parse(tokenResponse);

              this.token = tokenData.access_token;
              this.refreshToken = tokenData.refresh_token;

              console.log('🔐 Access Token:', this.token);
              console.log('🔐 Refresh Token:', this.refreshToken);

              // STEP 2: Get refreshed tokens + company file details
              const companyFilesJson = await getMyobCompanyFiles({
                  accessToken: this.token,
                  refreshToken: this.refreshToken,
                  businessId: this.businessId
              });

              const resp = JSON.parse(companyFilesJson);

              // Update refreshed tokens
              this.token = resp.access_token;
              this.refreshToken = resp.refresh_token;

              console.log('🆕 NEW Access Token:', this.token);
              console.log('🆕 NEW Refresh Token:', this.refreshToken);

              const companyFiles = resp.companyFiles;

              // Validate company file structure
              if (!companyFiles || !companyFiles.CompanyFile) {
                  console.error('❌ No CompanyFile returned from MYOB');
                  return;
              }

              // Correct extraction based on MYOB response
              this.companyFileGuid = companyFiles.CompanyFile.Id;
              this.companyFileUri  = companyFiles.CompanyFile.Uri;

              console.log('🏢 Company File GUID:', this.companyFileGuid);
              console.log('🔗 Company File URI:', this.companyFileUri);

              // Save tokens + company file details
              sessionStorage.setItem('myobAccessToken', this.token);
              sessionStorage.setItem('myobRefreshToken', this.refreshToken);
              sessionStorage.setItem('companyFileUri', this.companyFileUri);
              sessionStorage.setItem('myobcompanyFileGuid', this.companyFileGuid);

          } else {
              console.log("🟢 Saved tokens found — skipping code exchange");
          }

          console.log('Final Access Token:', this.token);
          console.log('Final Refresh Token:', this.refreshToken);
          console.log('Final Company File GUID:', this.companyFileGuid);
          console.log('Final Company File URI:', this.companyFileUri);

          // STEP 3: Fetch Company File Details (needs GUID)
          const companyDetails = await getCompanyFileDetails({
              accessToken: this.token,
              companyFileGuid: this.companyFileGuid
          });

          console.log('🏢 Company File Details:', companyDetails);

      } catch (error) {
          console.error('❌ Error during MYOB integration flow:', error);
      } finally {
          this.loading = false;
      }
  }


  @track servicePlansData;
  @track error;
  @track selectedShiftId;

  
handleFormsClick(event) {
    const shiftId = event.currentTarget.dataset.id;
    this.selectedShiftId = shiftId;

    if (!shiftId) {
        console.error('Shift Id is missing');
        return;
    }

    this.isLoading = true;

    getShiftServiceAndSupportPlans({ shiftIds: [shiftId] })
        .then(result => {
            console.log('Full Result:', JSON.stringify(result, null, 2));

            const plans = result[0]?.serviceAndSupportPlans || [];
            const formIds = plans.map(p => p.dynamicFormId);

            if (formIds.length > 0) {
                // ✅ fetch + open modal happens inside this
                return this.fetchFormsDetails(formIds);
            } else {
                // ❌ DON'T open modal
                this.servicePlansData = [];
                this.isShowForms = false;

                // ✅ optional: show message
                this.showToast('Info', 'No completed forms available.', 'info');
            }
        })
        .catch(error => {
            console.error('Error fetching Service & Support Plans:', error);
            this.error = error;
        })
        .finally(() => {
            this.isLoading = false;
        });
}

  handleCloseForms(){
    this.isShowForms=false;
  }

fetchFormsDetails(formIds) {
    return getDynamicFormsByIds({ formIds })
        .then(data => {
            console.log('Forms Data:', data);

            // ✅ PASS RAW DATA DIRECTLY (NO JSON PARSING)
           this.servicePlansData = data.map(item => ({
                Id: item.Id,

                // ✅ map to what HTML expects
                participantName: item.Participant_Name__c,
                formName: item.Name__c, // this is your form name
                createdDate: item.CreatedDate,

                formattedCreatedDate: this.formatDateDDMMYYYY(item.CreatedDate),
                Name__c: item.Name,
                Participant_Name__c: item.Participant_Name__c,
                Form_Type__c: item.Form_Type__c,
                Response_JSON__c: item.Response_JSON__c,
                FormattedDate: item.CreatedDate
            }));

            // 🔥 IMPORTANT: this is what handleView expects
            this.formResponses = this.servicePlansData;

            this.isShowForms = true;
        })
        .catch(error => {
            console.error(error);
            this.error = error;
        })
        .finally(() => {
            this.isLoading = false;
        });
}
formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day   = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year  = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

@track viewTableData = [];

@track isViewMode = false;

async handleView(event) {
  console.log("📍 handleView triggered (FormsAccess)");

  // -------------------------
  // RESET VIEW STATE (MATCH STAFF)
  // -------------------------
  this.viewTableData = [];
  this.tableRows = [];
  this.stepPagedRows = [];
  this.stepCurrentPageIndex = 0;

  this.selectedFormTitle = "";
  this.selectedFormType = "";
  this.selectedParticipantName = "";
  this.selectedSubmissionDate = "";

  this.isViewMode = true;
  this.isViewModeON = true;
  this.isFormSelected = true;

  // -------------------------
  // GET RESPONSE
  // -------------------------
  this.selectedResponseId = event.currentTarget.dataset.id;

  const response = (this.formResponses || []).find(
    (resp) => resp.Id === this.selectedResponseId
  );

  if (!response) {
    console.warn("⚠️ No response found:", this.selectedResponseId);
    return;
  }

  try {
    const raw = response.Response_JSON__c;

    let formJson;

    if (raw) {
      const parsed = JSON.parse(raw);

      // 🌐 AWS backed
      if (parsed?.url && parsed?.key) {
        console.log("🌐 Loading response JSON from AWS:", parsed.url);

        const resp = await fetch(parsed.url);
        if (!resp.ok) {
          throw new Error("Failed to fetch AWS response JSON");
        }

        formJson = await resp.json();
      } else {
        // inline JSON
        formJson = parsed;
      }
    }

    console.log("📄 Resolved Response JSON:", formJson);

    // -------------------------
    // CORE PIPELINE (SAME AS STAFF)
    // -------------------------
    this.prepareViewTable(formJson);

    // -------------------------
    // HEADER VALUES
    // -------------------------
    this.selectedFormTitle = response.formName || "Untitled Form";

    this.selectedFormType =
      response.Form_Type__c || "Unknown";

    this.selectedParticipantName =
      response.Participant_Name__c || "";

    this.selectedSubmissionDate =
      response.FormattedDate || "";

      this.selectedDisplayName = response.displayName || "";

  } catch (e) {
    console.error("❌ Failed opening form:", e);
    this.showToast("Error", "Unable to open form.", "error");
  }
}

  closeView() {
    this.isViewMode = false;
    this.isFormSelected = false;
  }
prepareViewTable(formJson) {

    console.log("📋 prepareViewTable() called");

    let tableData = [];
    let currentPage = 1;

    formJson.forEach((row, rowIndex) => {

      // Detect page break
      const isPageBreak = row.cells.some(
        (cell) =>
          cell.field?.dataType === "Blank" &&
          cell.field?.label?.toLowerCase().trim() === "page break"
      );

      // If page break → increase page count but do NOT render row
      if (isPageBreak) {
        currentPage++;
        return;
      }

      const processedRow = {
        id: row.id,
        belongsToPage: currentPage,
        isVisible: false,
        cells: []
      };

      row.cells.forEach((cell, colIndex) => {

        // Preserve empty cells to maintain grid alignment
        if (!cell?.field) {

          processedRow.cells.push({
            id: cell.id || `empty-${rowIndex}-${colIndex}`,
            isEmpty: true,
            colspan: cell.colspan || 1,
            rowspan: cell.rowspan || 1,
            gridStyle: `grid-column: span ${cell.colspan || 1}; grid-row: span ${cell.rowspan || 1};`
          });

          return;
        }

        // =========================
        // SECTION HEADER
        // =========================
        if (this.viewIsHeaderCell(cell)) {

          const title = this.viewNormalizeHeaderTitle(cell);

          if (title) {

            processedRow.cells.push({
              id: cell.id,
              isSectionHeader: true,
              title,
              headerStyle: cell.headerStyle || cell.field?.inlineStyle || "",
              colspan: cell.colspan || 12,
              rowspan: cell.rowspan || 1
            });

          }

          return;
        }

        // Skip invalid labels
        if (!(cell.field.label || "").trim()) return;

        const dataType = cell.field.dataType;

        // =========================
        // 🔥 VALUE NORMALIZATION (RICH TEXT DISPLAY FIX)
        // =========================
        let normalizedValue = cell.field.value;

        // ✅ FIX: Rich Text Display uses richTextContent
        if (
          cell.field?.isRichTextDisplay === true &&
          cell.field?.richTextContent
        ) {
          normalizedValue = cell.field.richTextContent;
        }

        const isUploadFile =
          dataType === "upload file" || cell.field?.isUpload === true;

        const isRichText =
          dataType === "Rich Text" ||
          cell.field?.isRichTextDisplay === true ||
          cell.field?.selectedTextFieldOption === "richText";

        const isRadioButton = dataType === "Radio Button";

        const isCheckbox = dataType === "Checkbox Field";

        const isSignature =
          dataType === "Signature" ||
          cell.field?.isSignature === true;

        const isTableBlock =
          dataType === "Table Block" ||
          cell.field?.isTableBlock === true;

        const toArrayFn =
          typeof toArray === "function"
            ? toArray
            : this.viewToArray.bind(this);

        const isImageUrlFn =
          typeof isImageUrl === "function"
            ? isImageUrl
            : this.viewIsImageUrl.bind(this);

        const urlsArr = toArrayFn(cell.field.value);
        const downloadArr = toArrayFn(cell.field.downloadLink);

        const files = urlsArr.map((url, i) => {

          const downloadUrl = downloadArr[i] || url;

          return {
            key: `${cell.id}-${i}`,
            url,
            downloadUrl,
            isImage: isImageUrlFn(url)
          };

        });

        const previewUrl = files[0]?.url || null;
        const downloadUrl = files[0]?.downloadUrl || previewUrl;
        const isImage = files[0]?.isImage || false;

        // =========================
        // TABLE BLOCK SUPPORT
        // =========================
    if (isTableBlock) {

    console.log("🧱 [TABLE BLOCK] Processing table block:", cell);

    const tableConfig = cell.field?.tableConfig || {};

    // 🔥 CRITICAL FIX: use innerCells (SOURCE OF TRUTH)
    const matrix = tableConfig.innerCells || [];

    const headers = tableConfig.columns || [];
    const rowNames = tableConfig.rowNames || [];

    const hasRowLabel =
      headers.length > 0 && headers[0]?.isRowLabel === true;

    const tableClass = hasRowLabel
      ? "view-table-block has-row-label"
      : "view-table-block";

    const rows = matrix.map((rowObj, rIndex) => {

      const rowCells = rowObj?.cells || [];

      console.log(`➡️ [ROW ${rIndex}] innerCells:`, JSON.stringify(rowCells));

      return {

        key: `row-${rIndex}`,

        rowLabel: rowNames[rIndex]?.value || "",

        cells: headers.map((col, cIndex) => {

          console.log(`   🔹 [CELL ${rIndex}-${cIndex}] column config:`, col);

          // =========================
          // 🟢 ROW LABEL
          // =========================
          if (col.isRowLabel) {
            return {
              key: `${rIndex}-label`,
              isRowLabel: true,
              isRegularField: true,
              cellClass: "row-label",
              value: rowNames[rIndex]?.value || ""
            };
          }

  // =========================
  // 🔥 COLUMN-BASED LOOKUP (FIX)
  // =========================
  let actualColIndex = col.key;

  if (hasRowLabel) {
    actualColIndex = col.key - 1;
  }

  if (col.isRowLabel) {
    actualColIndex = null;
  }

  const rawCell =
    actualColIndex !== null
      ? rowCells.find(c => c.col === actualColIndex)
      : null;

  console.log("   🟡 matched rawCell:", JSON.stringify(rawCell));

  const field = rawCell?.field || {};

  // 🔥 VALUE NORMALIZATION (CRITICAL FIX)
  let rawValue = field.value;

  // =========================
  // 📅 DATE FORMAT FIX
  // =========================
  if (
    field.dataType === "Date Field" &&
    rawValue
  ) {
    try {
      const d = new Date(rawValue);

      if (!isNaN(d)) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        rawValue = `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.warn("⚠️ Date parse failed:", rawValue);
    }
  }

  // ✅ HANDLE RICH TEXT DISPLAY MODE
  if (
    field.isRichTextDisplay === true &&
    field.richTextContent
  ) {
    rawValue = field.richTextContent;
  }

  // =========================
  // 🟣 HEADER DETECTION
  // =========================
  const isHeader =
    field.isHeader === true ||
    field.dataType === "Header" ||
    field.dataType === "header" ||
    field.type === "header";

  if (isHeader) {

    console.log("   ✅ HEADER DETECTED:", field);

    return {
      key: `${rIndex}-${cIndex}`,
      isSectionHeader: true,
      title: field.text || field.label || "",
      headerStyle: field.inlineStyle || "",
      isRowLabel: false
    };
  }

  // =========================
  // 🧠 TYPE DETECTION
  // =========================
  const isCheckbox = field.isCheckbox === true;

  const isUploadFile = field.isUpload === true;

  const isRichText =
    field.isRichTextInput === true ||
    field.selectedTextFieldOption === "richText" ||
    field.isRichTextDisplay === true; // 🔥 FIX

  const isSignature = field.isSignature === true;

  const isRadioButton = field.isRadio === true;

  console.log("   🧠 TYPE FLAGS:", {
    isCheckbox,
    isUploadFile,
    isRichText,
    isSignature,
    isRadioButton
  });

  // =========================
  // 📁 FILE HANDLING
  // =========================
  const fileUrls =
    field.urls ||
    field.downloadLink ||
    (Array.isArray(rawValue) ? rawValue : []);

  const files = (Array.isArray(fileUrls) ? fileUrls : []).map((url, i) => ({
    key: `${rIndex}-${cIndex}-${i}`,
    url,
    downloadUrl: url,
    isImage: true
  }));

  // =========================
  // 🔴 VALUE DISPLAY (FIXED)
  // =========================
  let displayValue = rawValue ?? "";

  // 🔥 PREDEFINED DROPDOWN FIX
  if (
    field.isDropdown === true &&
    field.selectedDropdownOption === "predefinedList"
  ) {
    displayValue =
      field.displayValue ||
      rawValue ||
      "";
  }

  // 🔴 RADIO DISPLAY
  if (isRadioButton && typeof rawValue === "object") {
    displayValue = rawValue.subValue
      ? `${rawValue.selectedOption} - ${rawValue.subValue}`
      : rawValue.selectedOption;
  }

  // =========================
  // 🟣 RICH TEXT
  // =========================
  const richTextHtml = isRichText
    ? `<div class="ql-editor">${rawValue || ""}</div>`
    : null;

  return {
    key: `${rIndex}-${cIndex}`,

    cellClass: "",

    isRowLabel: false,

    value: displayValue,

    isCheckbox,
    checkboxIcon: isCheckbox
      ? rawValue
        ? "✔" 
        : "✖"
      : null,

    isUploadFile,
    files,

    isRichText,
    richTextHtml,

    isSignature,
    isRadioButton,

    isRegularField:
      !isCheckbox &&
      !isUploadFile &&
      !isRichText &&
      !isSignature &&
      !isRadioButton
  };

        })

      };

    });

    console.log("✅ [TABLE BLOCK] Final rows:", JSON.stringify(rows, null, 2));

    processedRow.cells.push({

      id: cell.id,
      label: cell.field.label,

      isTableBlock: true,
      headers,
      rows,

      hasRowLabel,
      tableClass,

      colspan: cell.colspan || 12,
      rowspan: cell.rowspan || 1,

      gridStyle: `grid-column: span ${cell.colspan || 12}; grid-row: span ${cell.rowspan || 1};`

    });

    return;
  }

        // =========================
        // NORMAL FIELD
        // =========================

        processedRow.cells.push({

          id: cell.id,

          label: cell.field.label,

        value: isRichText
          ? normalizedValue
          : isSignature
          ? normalizedValue
          : this.getFormattedValue({
              ...cell,
              field: { ...cell.field, value: normalizedValue }
            }),

        richTextHtml: isRichText
          ? `<div class="ql-editor">${normalizedValue || ""}</div>`
          : null,

          colspan: cell.colspan || 1,
          rowspan: cell.rowspan || 1,

          gridStyle: `grid-column: span ${cell.colspan || 1}; grid-row: span ${cell.rowspan || 1};`,

          isCheckbox:
            cell.isCheckboxField ||
            cell.field?.dataType === "Checkbox Field",

          isUploadFile,
          files,

          isSignature,

          uploadUrl: previewUrl,
          isImageFile: isImage,

          downloadUrl,
          finalDownloadUrl: downloadUrl || previewUrl,

          isRichText,
          isRadioButton,

          isRegularField:
            !isUploadFile &&
            !isCheckbox &&
            !isRichText &&
            !isRadioButton &&
            !isSignature
        });

      });

      if (processedRow.cells.length > 0) {
        tableData.push(processedRow);
      }

    });

    // Set pagination info
    this.totalViewPages = currentPage;
    this.currentViewPage = 1;

    // Set visible rows for first page
    tableData.forEach(row => {
      row.isVisible = row.belongsToPage === this.currentViewPage;
    });

    console.log("✅ Final viewTableData:", JSON.stringify(tableData, null, 2));

    this.viewTableData = [...tableData];

    setTimeout(() => {
      this.renderRichText();
    }, 0);
}

renderRichText() {

    console.log("🟢 renderRichText() called");

    if (!this.viewTableData) {
        console.warn("⚠️ viewTableData is empty or undefined");
        return;
    }

    const renderCell = (cell) => {

        if (!cell) return;

        // =========================
        // 🟣 RICH TEXT (MAIN + TABLE)
        // =========================
        if (cell.isRichText && cell.value) {

            const selector = `[data-id="${cell.id || cell.key}"]`;
            console.log("🔍 Looking for container:", selector);

            const container = this.template.querySelector(selector);

            if (!container) {
                console.warn("⚠️ Container NOT found for:", cell.id || cell.key);
                return;
            }

            if (container.dataset.rendered) {
                return;
            }

            container.innerHTML =
                `<div class="ql-editor">${cell.value}</div>`;

            container.dataset.rendered = "true";

            console.log("✅ Rich text rendered:", cell.id || cell.key);
        }

        // =========================
        // 🧱 TABLE BLOCK (RECURSION)
        // =========================
        if (cell.isTableBlock && cell.rows) {

            cell.rows.forEach((r, rIndex) => {

                r.cells.forEach((c, cIndex) => {

                    console.log(`🔁 Table cell [${rIndex}][${cIndex}]`, c);

                    renderCell(c); // 🔥 recursion

                });

            });

        }
    };

    // =========================
    // 🔁 MAIN LOOP
    // =========================
    this.viewTableData.forEach((row, rowIndex) => {

        if (!row.cells) return;

        row.cells.forEach((cell, cellIndex) => {

            console.log(`➡️ Processing row ${rowIndex}, cell ${cellIndex}`);

            renderCell(cell);

        });

    });

    console.log("🏁 renderRichText() completed");

}
  
goToNextViewPage() {

  if (this.currentViewPage >= this.totalViewPages) return;

  this.currentViewPage++;
  this.updateVisibleRows();

}


goToPreviousViewPage() {

  if (this.currentViewPage <= 1) return;

  this.currentViewPage--;
  this.updateVisibleRows();

}

updateVisibleRows() {

  console.log("🔄 updateVisibleRows triggered for page:", this.currentViewPage);

  // 🔁 Update visibility
  this.viewTableData = this.viewTableData.map(row => {

    const isVisible = row.belongsToPage === this.currentViewPage;

    return {
      ...row,
      isVisible
    };

  });

  console.log("✅ Visible rows updated");

  // =========================
  // 🔥 CRITICAL: Re-render rich text AFTER DOM update
  // =========================
  requestAnimationFrame(() => {

    console.log("🎯 Running renderRichText after DOM update");

    this.renderRichText();

  });

}
  
  viewAsText(html) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || "").trim();
  }

  // Detect a header cell across your schema variants
  viewIsHeaderCell(cell) {
    const t = (cell?.field?.dataType || "").toLowerCase().trim();
    const opt = (cell?.field?.selectedTextFieldOption || "")
      .toLowerCase()
      .trim();
    return (
      t === "header" ||
      t === "heading" ||
      t === "section header" ||
      (t === "text field" &&
        ["header", "heading", "title", "h1", "h2", "h3"].includes(opt)) ||
      cell?.isHeader === true ||
      cell?.field?.isHeader === true
    );
  }

  // Prefer headerText → field.text → label → value
  viewNormalizeHeaderTitle(cell) {
    const candidates = [
      cell?.headerText, // ← present in your JSON
      cell?.field?.text, // ← present in your JSON ("YOU")
      cell?.field?.label,
      cell?.field?.value
    ];
    for (const c of candidates) {
      const t = this.viewAsText(c);
      if (t) return t;
    }
    return "";
  }

  // Fallbacks if originals aren't present
  viewToArray(v) {
    if (Array.isArray(v)) return v;
    if (v === null || v === undefined) return [];
    return String(v)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  viewIsImageUrl(u) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(u || "");
  }

  getFormattedValue(cell) {
    const dataType = cell.field?.dataType;


    if (cell.isCheckboxField || cell.field?.dataType === "Checkbox Field") {
      return cell.field.value === true || cell.field.value === "true"
        ? "✔"   // checked
        : "✖";  // unchecked
    }

    // ✅ Multi-select dropdown
    if (cell.isDropdownField && cell.isMultiSelect) {
      if (Array.isArray(cell.selectedValues)) {
        return cell.selectedValues.join(", ");
      } else if (typeof cell.selectedValues === "string") {
        return cell.selectedValues;
      } else {
        return "—";
      }
    }

    // ✅ Single-select dropdown
        if (
      (cell.isDropdownField || dataType === "Dropdown Field") &&
      !cell.isMultiSelect
    ) {

      const field = cell.field || {};

      const matchedOption =
        (field.options || []).find(
          opt => opt.value === field.value
        );

      return (
        field.displayValue ||     // 🔥 THIS WILL NOW WORK
        matchedOption?.label ||
        field.value ||
        "—"
      );
    }



    // ✅ Upload File
    if (dataType === "Upload File") {
      return cell.field.value || "No File";
    }

    // ✅ Date Field
    if (dataType === "Date Field") {
      return this.formatDateDD(cell.field.value);
    }

    // ✅ Rich Text
    if (
      dataType === "Text Field" &&
      cell.field?.selectedTextFieldOption === "richText"
    ) {
      return cell.field.value || "<span>No Rich Text</span>";
    }

    // ✅ Radio Button
    if (cell.isRadioButton || dataType === "Radio Button") {

    const fieldValue = cell.field?.value;

    // 🔥 NEW STRUCTURE SUPPORT (MAIN FIX)
    if (fieldValue && typeof fieldValue === "object") {

      const selectedOption = fieldValue.selectedOption || "";
      const subLabel = fieldValue.subLabel || "";

      return subLabel
        ? `${selectedOption} - ${subLabel}`   // ✅ LABEL used
        : selectedOption || "—";
    }

    // 🔁 FALLBACK (OLD DATA SUPPORT)
    const selectedOption =
      cell.selectedRadioOption || fieldValue || "";

    const subValue = cell.subInputValue || "";

    if (!subValue && Array.isArray(cell.radioOptionsProcessed)) {
      const matched = cell.radioOptionsProcessed.find(
        (opt) => opt.isSelected
      );

      if (matched?.processedSubOptions?.length > 0) {
        const selectedSub = matched.processedSubOptions.find(
          (sub) => sub.isSelected
        );

        if (selectedSub) {
          return `${selectedOption} - ${selectedSub.label}`;
        }
      }
    }

    return subValue
      ? `${selectedOption} - ${subValue}`
      : selectedOption || "—";
  }

    // ✅ Fallback
    return cell.field.value != null ? String(cell.field.value) : "—";
  }

resolveDropdownLabel(value, options = [], isMulti = false) {
  if (!value) return "—";

  // Multi-select
  if (isMulti) {
    const values = String(value)
      .split(",")
      .map(v => v.trim());

    return values
      .map(v => options.find(o => o.value === v)?.label || v)
      .join(", ");
  }

  // Single select
  return options.find(o => o.value === value)?.label || value;
}


formatDateDD(value) {
    if (!value) return "—";

    // 🔥 VERY IMPORTANT for YYYY-MM-DD values
    const d = new Date(value + "T00:00:00");

    if (isNaN(d)) return value;

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}


async printViewPageWise() {

  console.log("🖨️ Page-wise print started");

  const container = this.template.querySelector(".view-popup-content");

  if (!container) {
    console.error("❌ view-popup-content not found");
    return;
  }

  const originalPage = this.currentViewPage;

  // ✅ Show all rows
  this.viewTableData = this.viewTableData.map(row => ({
    ...row,
    isVisible: !row.isPageBreak
  }));

  await new Promise(resolve => requestAnimationFrame(resolve));

  const html = this.buildPageWiseCloneHtml(container);

  // ✅ Restore state
  this.currentViewPage = originalPage;
  this.updateVisibleRows();

  const cssUrl = `${window.location.origin}/resource/Quill/quill.snow.css`;

  console.log("🔗 Quill CSS URL:", cssUrl);

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    console.error("❌ Failed to open print window");
    return;
  }

  // ✅ Write HTML
  printWindow.document.write(`
    <html>
      <head>
        <title>${this.selectedFormTitle}</title>

        <link id="quillCss" href="${cssUrl}" rel="stylesheet">

        <style>
          ${this.getFullCssForPrint()}
        </style>
      </head>

      <body>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {

  console.log("📄 Print window loaded");

  setTimeout(() => {

    printWindow.document.body.style.visibility = "visible";

    console.log("🖨️ Triggering print");

    printWindow.focus();
    printWindow.print();

  }, 300); // shorter delay

};

// 🔥 CLOSE AFTER PRINT (CANCEL OR SUCCESS)
printWindow.onafterprint = () => {
  printWindow.close();
};
}



buildPageWiseCloneHtml(originalContainer) {

  console.log("🧾 Starting buildPageWiseCloneHtml");

  const pages = {};

  (this.viewTableData || []).forEach(row => {
    if (!row.isVisible || row.isPageBreak) return;

    const page = Number(row.belongsToPage || 1);

    if (!pages[page]) {
      pages[page] = [];
    }

    pages[page].push(row.id);
  });

  console.log("📄 Pages grouped:", pages);

  let finalHtml = "";

  // 🔥 Header map
  const headerMap = new Map();

  (this.tableRows || []).forEach(row => {
    (row.cells || []).forEach(cell => {
      if (cell.field?.isHeader) {
        headerMap.set((cell.field.text || "").trim(), cell.field);
      }
    });
  });

  console.log("🏷 HeaderMap:", headerMap);

  // 🔥 Build rowId → builderRow map
const builderRowMap = new Map();

(this.tableRows || []).forEach(row => {
  builderRowMap.set(row.id, row);
});

console.log("🗂 builderRowMap:", builderRowMap);

  Object.keys(pages).forEach((pageNumber, index) => {

    const viewPage = Number(pageNumber);
    console.log(`\n📌 Processing Page: ${viewPage}`);

    const pageClone = originalContainer.cloneNode(true);

    const popupHeader = pageClone.querySelector(".view-popup-header");
    if (popupHeader) popupHeader.remove();

    const actions = pageClone.querySelector(".view-popup-actions");
    if (actions) actions.remove();

    const scrollContainer = pageClone.querySelector(".view-popup-table-container");
    if (scrollContainer) {
      scrollContainer.style.maxHeight = "none";
      scrollContainer.style.overflow = "visible";
      scrollContainer.style.height = "auto";
    }

    const allRows = pageClone.querySelectorAll(".form-row");

    console.log("🔢 Total rows in clone:", allRows.length);

    let structuredRows = [];

    allRows.forEach((rowEl, rowIndex) => {

      const rowId = rowEl.getAttribute("data-row-id");

      if (!pages[viewPage].includes(rowId)) {
        console.log("❌ Removing row (not in page):", rowId);
        rowEl.remove();
        return;
      }

      console.log("✅ Keeping row:", rowId);

      let cells = rowEl.querySelectorAll(".table-cell");

      if (!cells || cells.length === 0) {
        console.log("⚠️ No .table-cell found, using children");
        cells = rowEl.children;
      }

      let rowData = [];

Array.from(cells).forEach((cell, colIndex) => {

  const cellText = (cell.innerText || "").trim();

  let content = cell.innerHTML || "&nbsp;";

  const builderRow = builderRowMap.get(rowId);
  const builderCell = builderRow?.cells?.[colIndex];
  const field = builderCell?.field;

  const isTableBlock = field?.isTableBlock;

  // =========================
  // 🔥 RICH TEXT (FIXED)
  // =========================
 if (field?.dataType === "Rich Text") {

  console.log("🟢 [RICH TEXT DETECTED]");
  console.log("➡️ RowId:", rowId);
  console.log("➡️ ColIndex:", colIndex);
  console.log("➡️ Field Object:", JSON.parse(JSON.stringify(field)));

  // 🔍 DATA SOURCES
  const richFromField = field.richTextContent;
  const fallbackValue = field.value;
  const domContent = cell.innerHTML;

  console.log("📊 RichText Sources:");
  console.log("   field.richTextContent:", richFromField);
  console.log("   field.value:", fallbackValue);
  console.log("   DOM innerHTML:", domContent);

  let finalRichText = richFromField || fallbackValue || "";

  if (!finalRichText) {
    console.warn("⚠️ EMPTY RICH TEXT DETECTED → Using fallback");
  }

  // 🔍 LENGTH CHECK
  console.log("📏 RichText Length:", finalRichText.length);

  // 🔍 PREVIEW
  console.log("🧾 RichText Preview:", finalRichText.substring(0, 200));

  // 🔥 FINAL HTML (CORRECT STRUCTURE)
content = `
  <div class="field-label">
    ${field.label || ''}
  </div>

  <div class="field-value">
    <div class="ql-container ql-snow">
      <div class="ql-editor">
        ${finalRichText}
      </div>
    </div>
  </div>
`;
}

  // =========================
  // 🔥 HEADER
  // =========================
  else if (headerMap.has(cellText)) {

    const headerField = headerMap.get(cellText);

    content = `
      <div style="
        ${headerField.inlineStyle || ""}
        width:100%;
        display:block;
      ">
        ${headerField.text}
      </div>
    `;
  }

  rowData.push({
    colspan: cell.getAttribute("colspan") || 1,
    rowspan: cell.getAttribute("rowspan") || 1,
    content,
    isTableBlock 
  });
});

      if (rowData.length > 0) {

  const isTableRow = rowData.some(cell => cell.isTableBlock);

  structuredRows.push({
    cells: rowData,
    isTableRow
  });
}

      rowEl.remove();
    });

    console.log("📊 StructuredRows count:", structuredRows.length);

    // ============================================
// BUILD GRID (REPLACED TABLE WITH FLEX)
// ============================================

let tableHtml = "";

if (structuredRows.length > 0) {

  tableHtml += `<div class="print-grid">`;

  structuredRows.forEach((rowObj, rIndex) => {

  console.log("🧱 Building row:", rIndex);

  // 🔥 TABLE BLOCK ROW
  if (rowObj.isTableRow) {

    console.log("📊 Rendering TABLE BLOCK row");

    // 🔥 WRAP TABLE TO PREVENT PAGE BREAK SPLIT
tableHtml += `<div class="table-block-wrapper">`;

tableHtml += `<table class="print-table-block">`;

rowObj.cells.forEach(cell => {
  tableHtml += `
    <tr>
      <td colspan="${cell.colspan}" rowspan="${cell.rowspan}">
        ${cell.content}
      </td>
    </tr>
  `;
});

tableHtml += `</table>`;
tableHtml += `</div>`;
  }

  // 🔥 NORMAL ROW (FLEX)
  else {

    tableHtml += `<div class="print-row">`;

    rowObj.cells.forEach(cell => {
      tableHtml += `
        <div class="print-cell"
             style="flex:${cell.colspan};">
          ${cell.content}
        </div>
      `;
    });

    tableHtml += `</div>`;
  }

});

  tableHtml += `</div>`;

} else {
  console.warn("⚠️ No structured rows → fallback");
  tableHtml = `<div style="padding:10px;">No data available</div>`;
}

    const gridContainer = pageClone.querySelector(".view-grid-container");

    if (gridContainer) {
      console.log("📥 Injecting table HTML into gridContainer");
      gridContainer.innerHTML = tableHtml;
    } else {
      console.error("❌ gridContainer not found");
    }

    let headerHtml = "";

    if (index === 0) {
      console.log("🏷 Adding print header");

      headerHtml = `
        <div class="print-header">
          ${this.orgLogoUrl ? `<img src="${this.orgLogoUrl}" class="print-logo"/>` : ""}

          <div class="print-header-text">
            <div class="print-title">${this.selectedFormTitle || ""}</div>
            <div class="print-meta">
              ${this.staffNameToDisplay || ""} | ${this.selectedSubmissionDate || ""}
            </div>
          </div>
        </div>
      `;
    }

    finalHtml += `
      <div class="view-page">
        ${headerHtml}
        ${pageClone.outerHTML}
      </div>
    `;
  });

  console.log("✅ Final HTML generated");

  return finalHtml;
}


getFullCssForPrint() {

  return `

    * {
      box-sizing: border-box;
    }

    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      page-break-inside: avoid;
    }
@page {
  size: A4;
  margin: 10mm 10mm 18mm 10mm;

  @bottom-left {
    content: "${this.orgName || ''}";
       font-size: 13px;     
    font-weight: 600;     
    color: #003466; 

    background: linear-gradient(to top, #003466 1px, transparent 1px);
    background-repeat: no-repeat;
    background-size: 100% 1px;
    background-position: top;
    padding-top: 4px;
  }

  @bottom-right {
    content: "Page " counter(page);
       font-size: 13px;     
    font-weight: 600;     
    color: #003466; 

    background: linear-gradient(to top, #003466 1px, transparent 1px);
    background-repeat: no-repeat;
    background-size: 100% 1px;
    background-position: top;
    padding-top: 4px;
  }
}

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* HEADER */

    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #003466;
      padding-bottom: 6px;
    }

   /* .print-logo {
      max-height: 40px;
      width: auto;
      max-width: 120px;
    }
      */

    .print-logo {
      height: auto;
      width: auto;

      max-height: 70px; 
      max-width: 30%;    

      object-fit: contain;
    }

    .print-header-text {
      text-align: right;
    }

    .print-title {
      font-size: 18px;
      font-weight: bold;
      color: #003466;
    }

    .print-meta {
      font-size: 12px;
      color: #555;
    }

    /* PAGE */

    .view-page {
      width: 100%;
      margin-bottom: 20px;
      page-break-after: auto;
    }

    /* FOOTER (OPTIONAL VISUAL ONLY) */

    .print-footer {
      margin-top: 10px;
      border-top: 2px solid #003466;
      padding-top: 4px;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
    }



    /* GRID */

    .form-row {
      display: block !important;
  width: 100% !important;
      margin-bottom: 8px;
      page-break-inside: auto;
    }

    .form-field-card,
    .field-value {
      page-break-inside: avoid;
      width: 100%;
    }

    /* CONTAINER */

    .view-popup-content {
      width: 100% !important;
      max-width: none !important;
      margin: 0;
      padding: 0;
      box-shadow: none !important;
    }

    .view-popup-table-container {
      max-height: none !important;
      overflow: visible !important;
      height: auto !important;
    }

    /* FIELD */

    .field-label {
  text-transform: uppercase !important;
  font-size: 12px;
  color: #6b778c;
  margin-bottom: 4px;
  font-weight: 600;
  page-break-after: avoid !important;
  break-after: avoid !important;
}



.field-value {
  background: #dfe6f1 !important;
  padding: 12px !important;
  border-radius: 6px !important;
  font-size: 13px;

  /* 🔥 KEY FIX */
  width: auto !important;
  display: block;
}

/* ============================================
   🔥 FLEX LAYOUT FIX (DO NOT REMOVE EXISTING CSS)
============================================ */

.print-grid {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
}

.print-row {
  display: flex !important;
  width: 100% !important;
  gap: 16px;
  margin-bottom: 16px;
}

.print-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
   page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* ============================================
   🔥 REMOVE ALL BORDERS (GLOBAL OVERRIDE)
============================================ */

.print-grid,
.print-row,
.print-cell {
  border: none !important;
}

.print-grid * {
  border: none !important;
}

.table-block-wrapper {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* 🔥 FIX TABLE BLOCK RENDERING */

.print-table-block {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

.print-table-block td {
  border: 1px solid #003466;
  padding: 6px;
  vertical-align: top;
}

.print-table-block th {
  border: 1px solid #003466;
  background: #003466;
  color: white;
}

.print-cell:has(.print-table-block) {
  page-break-inside: avoid !important;
}

/* ============================================
   🔥 PREVENT COLUMN SHRINK
============================================ */

.print-cell {
  min-width: 0 !important;
}

/* ============================================
   🔥 FIX IMAGE + QR ALIGNMENT
============================================ */

.print-cell img {
  max-width: 100% !important;
  height: auto !important;
}

/* ============================================
   🔥 RICH TEXT WIDTH FIX
============================================ */

.ql-container,
.ql-editor {
  width: 100% !important;
}

/* ✅ ONLY TABLE BLOCKS → WITH BORDERS */
table:not(.print-grid) {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #003466;
}

table:not(.print-grid) th {
  background: #003466 !important;
  color: white !important;
  padding: 6px;
  font-size: 12px;
  border: 1px solid #003466;
}

/* ❌ remove border from main grid only */
.print-grid td {
  border: none !important;
}

/* ✅ APPLY BORDER TO NESTED TABLES */
.print-grid table td,
.print-grid table th {
  border: 1px solid #003466 !important;
}

.print-grid table {
  border: 1px solid #003466 !important;
  border-collapse: collapse;
}


tr {
  page-break-inside: auto !important;
}

td {
  page-break-inside: auto !important;
}


    /* RICH TEXT */

    .ql-editor {
      padding: 0 !important;
      font-size: 13px;
      word-break: break-word;
      page-break-inside: auto !important;
  break-inside: auto !important;
      width: 100%;
    }

    .ql-editor p,
.ql-editor li {
  page-break-inside: avoid;
  break-inside: avoid;
}

  `;
}


handleDownloadCsv() {
    try {

      if (!this.viewTableData || !this.viewTableData.length) {
        this.showToast("Warning", "No data available for CSV.", "warning");
        return;
      }

      let csvRows = [];

      csvRows.push(`Field Label,Value`);

      // =============================
      // 🔥 GROUP BY PAGE
      // =============================
      const pages = {};

      this.viewTableData.forEach(row => {

        if (row.isPageBreak) return;

        const page = row.belongsToPage || 1;

        if (!pages[page]) {
          pages[page] = [];
        }

        pages[page].push(row);
      });

      // =============================
      // 🔥 LOOP EACH PAGE
      // =============================
      Object.keys(pages).forEach((pageNumber, index) => {

        // 🔥 PAGE SEPARATOR
        csvRows.push(``);
        csvRows.push(`------ Page ${pageNumber} ------`);

        pages[pageNumber].forEach(row => {

          (row.cells || []).forEach(cell => {

            if (!cell || cell.isEmpty) return;
            if (cell.isSectionHeader) return;
            if (!cell.label || !cell.label.trim()) return;

            let value = "";

            // =============================
            // CHECKBOX
            // =============================
            if (cell.isCheckbox) {

    if (cell.value === "✔" || cell.value === true || cell.value === "true") {
      value = "Yes";
    } else {
      value = "No";
    }
  }

  

            // =============================
            // SIGNATURE
            // =============================
            else if (cell.isSignature) {
              value = cell.value ? "Signature Provided" : "No Signature";
            }

            else if (cell?.field?.dataType === "Date Field") {

    if (cell.value) {
      value = cell.value; // already formatted
    } else if (cell?.field?.value) {
      value = this.formatDateDD(cell.field.value);
    } else {
      value = "";
    }
  }

            // =============================
            // RICH TEXT
            // =============================
            else if (cell.isRichText) {
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = cell.value || "";
              value = tempDiv.textContent || "";
            }

            // =============================
            // RADIO
            // =============================
            else if (cell.isRadioButton) {
              value = cell.value || "";
            }

            // =============================
            // TABLE BLOCK
            // =============================
            else if (cell.isTableBlock) {
              value = this.convertTableBlockToCsv(cell);
            }

  else if (
    cell.isUploadFile ||
    cell?.field?.isUpload === true ||
    (Array.isArray(cell.value) && cell.value.length > 0)
  ) {

    const hasFile =
      (Array.isArray(cell.files) && cell.files.length > 0) ||
      (Array.isArray(cell.value) && cell.value.length > 0) ||
      cell?.field?.meta?.uploadedFiles?.length > 0;

    value = hasFile
      ? "Attachment available in PDF"
      : "No Attachment";
  }

            // =============================
            // DEFAULT
            // =============================
            else {
              value = cell.value || "";
            }

            const safeLabel = String(cell.label).replace(/"/g, '""');
            const safeValue = String(value).replace(/"/g, '""');

            csvRows.push(`"${safeLabel}","${safeValue}"`);

          });

        });

      });

      const csvContent = csvRows.join("\n");

      const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.selectedFormTitle || "Form"}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("❌ CSV download failed:", error);
      this.showToast("Error", "Failed to generate CSV.", "error");
    }
}


convertTableBlockToCsv(cell) {

    try {

      if (!cell.rows || !cell.headers) return "";

      let lines = [];

      // Header row
      const headers = cell.headers.map(h => h.header || "");
      lines.push(headers.join(" | "));

      // Data rows
      cell.rows.forEach(row => {

        const rowValues = row.cells.map(c => {

          if (c.isCheckbox) {
            return c.value ? "Yes" : "No";
          }

          if (c.isUploadFile) {

    const hasFile =
      (Array.isArray(c.files) && c.files.length > 0);

    return hasFile
      ? "Attachment available in PDF"
      : "No Attachment";
  }

          if (c.isSignature) {
            return c.value ? "Signed" : "Not Signed";
          }

          if (c.isRichText) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = c.value || "";
            return tempDiv.textContent || "";
          }

          return c.value || "";

        });

        lines.push(rowValues.join(" | "));

      });

      return lines.join(" || "); // multi-line in single cell

    } catch (e) {
      console.error("❌ Table block CSV conversion failed", e);
      return "";
    }
  }





  handleJournalClick(event) {
      const shiftId = event.currentTarget.dataset.id;

      this.isShowJournal = true;
      this.fetchJournals(shiftId);
  }

  fetchJournals(shiftId) {
      getClientJournals({ shiftId })
        .then(result => {
            if (result.success) {
                this.journalList = result.journals;
            } else {
                this.journalList = [];
            }
        })
        .catch(error => {
            console.error(error);
            this.journalList = [];
        });
  }

  handleCloseJournal() {
      this.isShowJournal = false;
  }

  handleSearch(event) {
      this.nameFilter = event.target.value.toLowerCase();

      let baseData;

      if (!this.nameFilter) {
          baseData = [...this.originalStaff];
      } else {
          baseData = this.originalStaff.filter(staff => {
              let name = (
                  staff.Display_Nickname__c ||
                  staff.Name ||
                  ''
              ).toLowerCase();

              return name.includes(this.nameFilter);
          });
      }

      // ✅ 1. Update filtered data
      this.allStaff = baseData;

      // ✅ 2. RESET PAGINATION
      this.currentPage = 1;

      this.totalPages = Math.ceil(
          this.allStaff.length / this.pageSize
      );

      console.log('📄 totalPages:', this.totalPages);

      // ✅ 3. UPDATE TRACKED IDS (for shift fetch)
      this.trackedStaffIds = this.allStaff
          .slice(0, this.pageSize)
          .map(staff => staff.Id || staff.staffId);

      console.log('🎯 trackedStaffIds:', this.trackedStaffIds);

      // ✅ 4. REFRESH SHIFT DATA
      this.loadShiftData();

      // ✅ 5. REBUILD UI
      this.generateMockData();
  }

}