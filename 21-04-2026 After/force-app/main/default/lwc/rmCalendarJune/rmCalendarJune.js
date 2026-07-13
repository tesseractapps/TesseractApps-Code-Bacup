import { LightningElement, track, wire, api } from "lwc";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getStaffData from "@salesforce/apex/AddShiftStaffView.getStaffData";
import getNumberOfRecurrences from "@salesforce/apex/RosterCreationRecurringHnadler.getNumberOfRecurrences";
import StaffsRolesWiseList from "@salesforce/apex/StaffController.StaffsRolesWiseList";
import createAddShift from "@salesforce/apex/RosterCreation.createAddShift";
import getAvailableStaff from "@salesforce/apex/AddShiftController.getAvailableStaff";
import fetchFacilitiess from "@salesforce/apex/ClientSearchController.fetchFacilitiess";
import getClientFunds from "@salesforce/apex/ServiceSupportPlanHandler.getClientFunds";
import getNDISServiceLineItem from "@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem";
import getFacilityAddress from "@salesforce/apex/AddShiftController.getFacilityAddress";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getClientById from "@salesforce/apex/ClientDataController.getClientById";
import getSeriveList from "@salesforce/apex/ServiceSupportPlanHandler.getServicesByShift";
import getAddShiftDataById from "@salesforce/apex/AddShiftController.getAddShiftDataById";
import { refreshApex } from "@salesforce/apex";
import { deleteRecord } from "lightning/uiRecordApi";
//import sendPushNotification from '@salesforce/apex/mobilePushNotificationController.sendPushNotification';
import generateAndSendNotification from "@salesforce/apex/MobileAppNotificationsV2.generateAndSendNotification";
import sendShiftEmails from "@salesforce/apex/StaffEmailNotificationController.sendShiftEmails";
import getJSONdata from "@salesforce/apex/GeoTaggingfromAWS.getS3JsonData";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import LEAFLET from "@salesforce/resourceUrl/leaflet";
import getMultipleShiftsdata from "@salesforce/apex/AddShiftController.getMultipleShiftsdata";
import getStaffByStatus from "@salesforce/apex/StaffController.getStaffByStatus";
import getFatigueData from "@salesforce/apex/RosterCreation.getFatigueData";
import getAllShiftWithSatff from "@salesforce/apex/ShiftwithStaffController.getAllShiftWithSatff";
import updateShiftDetails from "@salesforce/apex/ShiftwithStaffController.updateShiftDetails";
import deleteCheckList from "@salesforce/apex/ShiftwithStaffController.deleteCheckList";
import getOverlappingShiftsData from "@salesforce/apex/AddShiftParticipantView.getOverlappingShiftsData";
import HolidaysPopup from "@salesforce/apex/RosterCreationRecurringHnadler.HolidaysPopup";
//import getCatalogueData from "@salesforce/apex/StaffAvailabilityController.getCatalogueData";
import getCatalogueData from "@salesforce/apex/CatalogueDataHandler.getCatalogueData";
import deleterecurShifts from "@salesforce/apex/AddShiftStaffView.deleterecurShifts";
import GOOGLE_API_KEY from "@salesforce/label/c.Google_Geocode_API_Key";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getFundsData from "@salesforce/apex/RosterCreation.getFundsData";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getfacilityById from "@salesforce/apex/FacilityController.getfacilityById";
import validateSegments from "@salesforce/apex/CustomShiftsValidations.validateSegments";
import FOOTER_MESSAGE_CHANNEL from "@salesforce/messageChannel/FooterMessageChannel__c";
import { publish, MessageContext } from "lightning/messageService";
import assignShiftsInDrag from "@salesforce/apex/RostersPublishAndAssignHandler.AssignShiftsInDrag";
import getPublishData from "@salesforce/apex/RosterAutoScheduleHandler.getPublishData";
import processSingleShift from "@salesforce/apex/StaffAvailabilityController.processSingleShift";
import getShiftsTypeByFacility from "@salesforce/apex/RosterInvoicesHandler.getShiftsTypeByFacility";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import createShift from "@salesforce/apex/RosterCreationVersionTwo.createShift";
import validateAndEnrichShifts from "@salesforce/apex/SplitShiftValidations.validateAndEnrichShifts";
import sendSplitEmails from "@salesforce/apex/StaffEmailNotificationController.sendSplitEmails";

export default class TesseractAppsRosterCreation extends LightningElement {
  @api isstaffviewfromparent;
  @track currentStartDate;
  @track groupedShifts = [];
  @track isHome = true;
  @track currentEndDate;
  @track weekDaysWithDates = [];
  @track currentStartOfWeek; // Tracks the start of the current week
  @track monthName;
  @track OrgNisationRoles = [];
  @track facilityOptions = [];
  @track facilityValue = [];
  @track chosenRole = [];
  @track orgId;
  @track staffData = [];
  @track isModalOpen = false;
  @track modalStyle = "";
  @track isExpandedView = false;
  @track isCompactView = true;
  @track fieldErrorMap = {};
  @track documentExpired = false;

  @track RostersDataRoleWise = [
    {
      RoleName: "",
      isExpanded: false,
      weekQuantity: [],
      weekData: [],
      staffData: []
    }
  ];

  @track isPopoverVisible = false;
  @track isPopoverVisibleforShiftType = false;
  @track groupedShiftsWithSelection = false;
  @track rollName;
  @track viewName;

  @track SelctedComboBoxRole;
  @track SelectedComboBoxFacility;
  @track isTooltip = false;
  @track shiftTooltipInformation = {};
  @track selectedDate;
  @track selectedDate1 = false;
  get options() {
    return [
      { label: "Accepted", value: "Accepted" },
      { label: "In Progress", value: "InProgress" },
      { label: "Completed", value: "Completed" }
    ];
  }
  @track activeSections = [];
  @track isStaffView = true;
  @track isCalenderShiftView = false;
  @track address = {
    street: null,
    citySuburb: null,
    country: null,
    provinceState: null,
    postalcode: null,
    latitude: null,
    longitude: null
  };
  @track ChekListrows = []; // Array to store the dynamic rows
  comboboxOptions = [
    { label: "Give Meds", value: "Give Meds" },
    { label: "Check BP", value: "Check BP" },
    { label: "Sugar Level Test", value: "Sugar Level Test" }
  ];
  @track recurOptions = [
    { label: "Daily", value: "Daily" },
    { label: "Fortnightly", value: "Fortnightly" },
    { label: "Weekly", value: "Weekly" },
    { label: "Monthly", value: "Monthly" }
  ];
  @track SplitShiftRows = [];
  @track recurEveryOptions = [];
  @track RecurLabel = "Day";
  @track RecurValue;
  @track isRecurWeekFlag = false;
  @track isRecurmontlyFlag = false;
  @track recurEveryValue;
  @track recurEndDate;
  @track recurOccurencesValue = 0;
  @track addShiftData = {};
  @track partcipantServiceData = {
    staffHoulrlyrate: 0,
    splitShift: false,
    splitShiftStartTime: null,
    splitShiftEndTime: null,
    seviceParticipantId: null,
    serviceType: null,
    serviceState: null,
    serviceSupportPlanId: null,
    fundTrackerId: null,
    serviceTypeName: null
  };
  @track finalAddShiftData = {
    shiftaddress: null,
    shiftDetails: null
  };
  @track monthOfDay = 0;
  @track weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];
  @track selectedDays = [];
  @track monthLyOptions = [];
  @track staffOptions = [];
  @track shiftTypeOptions = [
    { label: "General", value: "General" },
    { label: "Morning", value: "Morning" },
    { label: "Afternoon", value: "Afternoon" },
    { label: "Night", value: "Night" },
    { label: "Custom", value: "Custom" },
    { label: "Sleepover Shift", value: "Sleepover Shift" }
  ];
  @track longShiftOptions = [
    { label: "Morning", value: "Morning" },
    { label: "Afternoon", value: "Afternoon" },
    { label: "Night", value: "Night" },
    { label: "Sleepover Shift", value: "Sleepover Shift" }
  ];
  @track StaffHourlyRates = {};
  @track staffBreaktimes = {};
  @track AddShiftDayName;
  @track AddShiftAdrress = {};
  @track AddShiftRecurringCheckboxValue = false;
  @track participantoptions = [];
  @track isSplitCheckbox = false;
  @track fundOption = [];
  @track SplitShiftRowId;
  @track TotalFunds;
  @track NdisServiceGroupName = false;
  @track servicePlan;
  @track stateValue = "";
  @track hourlrRateLabel = "Hourly Rate";
  @track hourlyrateDisable = true;
  get stateOptions() {
    return [
      { label: "ACT", value: "ACT__c" },
      { label: "NSW", value: "NSW__c" },
      { label: "NT", value: "NT__c" },
      { label: "QLD", value: "QLD__c" },
      { label: "SA", value: "SA__c" },
      { label: "TAS", value: "TAS__c" },
      { label: "VIC", value: "VIC__c" },
      { label: "WA", value: "WA__c" }
    ];
  }
  @track serviceGroupName = [];
  @track ServiceStaffValue;
  @track AddShiftServicesData = [];
  @track serviceParticipant;
  @track serviceTableAddButton = false;
  @track serviceStaffHourlyRate = 0;
  @track isDisableParticipantCheckBox = false;
  @track isDisableSaveButton = false;
  @track addNewAddressCheckBox = false;
  @track facilityAddressCheckbox = false;
  @track participantAddressCheckBox = false;
  @track checkListDescription = "";
  @track isPublishShift = false;
  @track rosterPublishDateAndRole = {};
  @track tableFlagFromParent = false;
  @track shiftStaffId = "";
  @track servicesList = []; // To hold the services data
  wiredServicesResult;
  @track isEditShiftScreenFlag = false;
  @track AddShiftIncludePartcipants = false;
  @track isIncludeParticipants = false;
  @track isServiceEdit = false;
  @track serviceEditID = false;
  @track tooltipStyle = "";
  @track isTooltip = false;
  @track tooltipStyle = ""; // Dynamically sets tooltip position
  @track shiftTooltipInformation = {};
  @track isShowSpinner = false;
  wiredStaffData;
  @track startDate;
  @track endDate;
  @track ServiceTypeIdInParticipant;
  @track isAnotherParticipantCreationInEdit = false;
  @track includeParticipantEvent = false;
  @track postInsertOperation = false;
  @track disablePostInsertButtons = false;
  @track isNewInsertOperation = false;
  @track disableServiceSection = false;
  @track createShiftlabel = "Create Shift";
  @track isDisbaleServiceButton = false;
  @track isDisbaleServiceButton1 = false;
  @track isCreateShiftButton = true;
  @track parentAddShiftId = "";
  @track isVisibleCreateServicesButton = true;
  @track isVisiblePlusIcon = true;
  @track isParticipanTViewEnable = false;
  @track shifts;
  @track isweeklyDataTooltip = false;
  @track isActionTooltip = false;

  @track serviceEditTotalFund = [];
  @track serviceEditFundOption = [];
  @track serviceEditGroupName = [];
  @track NdisServiceGroupNameinEdit = false;
  @track ServiceTypeEditvalue = false;
  @track ServiceStateEditValue = "";
  @track ServiceEditNdisValue;
  @track searchName = "";
  @track searchTimeout;
  @track organisationShiftTimes;
  @track startTimeSelectedHour = null;
  @track startTimeSelectedMinute = null;
  @track endtimeSelectedHour = null;
  @track endTimeSelectedMinute = null;
  @track startTimeAMPM = null;
  @track endTimeAMPM = null;
  @track SplitShiftVisible = true;
  @track disableTimeButton = false;
  isListening = false;
  showMuteIcon = false;
  showClearIcon = false;
  recognition;
  @track showLocation = false;
  @track jsonData;
  @track mapMarkers = [];
  @track selectedShiftStatus;
  @track isShowMap = false;
  @track hideLocation = false;
  @track isMapLoaded = false;
  @track map;
  @track jsonData;
  leafletInitialized = false;
  polyline;
  @track recurTemplate = false;
  @track sectionFlags = {};
  @track moreShiftlist = [];
  colors = ["#008000", "#FFD700", "#FF0000", "#0000FF"];
  // colors = ['#49CE2D', '#FF9D59', '#3BC8E8', '#FF66AB'];

  @track staffComboBoxRoles = [];
  wiredRolesStaffData;
  @track RolesStaffId;
  @track roleOptions = [];
  @track shiftList = [];
  @track shiftList1 = [];
  @track ServiceWarningMessage = false;
  @track participantServiceDeleteInfo = {};
  @track shiftDeleteCOnfirmationInfo = {};
  @track shiftDeleteConfirmation = false;
  @track headingLabel = "Create Shift";
  @track riskIndex;
  @track fatigueManagementFlag = false;
  @track weeklyDataforStaff = false;
  @track SelectedComments;
  @track shiftEnableGeolocation = false;
  @track shiftEnableSignin = false;
  @track shiftwithstaffId;
  @track staffIdforweekly;
  @track setHoursExceedsLimit = false;
  @track SrviceParticipantName;
  @track deletedChecklist = [];

  @track cutsomShiftTemplate = false;
  @track IsLongShift = false;
  @track LongShiftTimeSlots = {};
  @track childRosterInvoices = false;
  @track AllServicesByRoles = [];
  @track serviceInvoiceFlag = false;
  @track participantIdInEdit;
  @track recurredShiftsDelete = false;
  @track HolidaySaveButton = true;
  @track isAutoschedule;
  @track isOriginalStaffChanged = false;
  @track recurEndDateFormattedDate;
  @track finalSelectedFacilities = [];
  @track disableServiceStaff = false;
  @track isSingleClassForServiceCreation = true;
  @track underOverRoastingFlag = false;
  @track RecurringWithIncludeAndNewParticipants = false;
  @track otherThanNdis = false;
  @track AllStaffListBasedOnRoles = [];
  @track draggingStaffFullName;
  @track droppedStaffId;
  @track droppedStaffRate = 0;
  @track draggingStaffrefId;
  @track draggingStaffShiftId;
  @track finalDraggingRefId = "";
  @track draggingShiftDate;
  @track shiftReportsFlag = false;
  @track droppedShiftDate;
  @track draggingStaffRate = 0;
  @track draggingSameStaffFlag = false;
  @track draggingSleepoverFalg = false;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  @track facilityAddressDisable = false;
  @track newAddressDisable = false;
  @track disableNotification=false;
  @track enableTimeRounding=false;

  @track draggingStaffFatigueMessage = false;
  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  @track isShiftDragAndDrop = false;
  @track draggingShiftFatigueCheck = false;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }

  getFieldClass(fieldName) {
    return this.fieldErrorMap[fieldName]
      ? "floating-label1"
      : "floating-label-new";
  }
  get dateClass() {
    return this.getFieldClass("date");
  }

  @wire(MessageContext)
  messageContext;

  roleOptions = [
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "Staff", value: "staff" }
  ];
  @track rateRows = [];
  @track loggedInUserType;
  @track isOpen = false;
  @track rosterSettingsFalg = false;
  wiredFacilityResult; // <-- to store the response
  @track isParticipantServiceCreated = false;
  @track isRoleChangedDuringFilterChange;
  @track darggingShiftRecurtempalte = false;
  @track shiftPublishStatus = "";
  @track activeRowIndex = null;
  @track diableGroupShift = false;
  @track disableSplitShift = false;

  StatusOptionsforfilter = [
    { label: "Completed", value: "Completed" },
    { label: "In Progress", value: "InProgress" },
    { label: "Accepted", value: "Accepted" },
    { label: "Unassigned", value: "Unassigned" }
  ];
  @track RoleFilter = [];
  @track shiftNameOptions = [];

  get draggingRecurOption() {
    return [
      { label: "Only this shift", value: "Only this shift" },
      {
        label: "This and all future recurring shifts",
        value: "This and all future recurring shifts"
      }
    ];
  }
  @track draggingRecurShiftValue;
  //   @track AddShiftAndServices=[];
  staticChecklistItems = [
    { id: "1", label: "Daily Tablets Check" },
    { id: "2", label: "Vitamin Tablets Check" },
    { id: "3", label: "Pet walk" },
    { id: "4", label: "Check Blood Pressure every 3 Hours" },
    { id: "5", label: "Blood Test" },
    { id: "6", label: "Switch off all Lights before leaving" },
    { id: "7", label: "Morning Walk" },
    { id: "8", label: "Evening Walk" },
    { id: "9", label: "Morning News Reading" },
    { id: "10", label: "Physical Exercise" },
    { id: "11", label: "Pet Food Check" },
    { id: "12", label: "Physical Hand Rotation" }
  ];
  @track customShift = false;
  @track rowShiftTypeEnable = false;
  @track rowShiftTimingsEnable = false;

  @track AddShiftAndServices = [];
  @track groupShift = false;
  @track splitShift = false;
  @track showServiceItemModal = false;
  @track currentRowIndex = null;
  @track serviceItemSearch = "";
  @track disable;
  @track geolabel = "Shift Location";
  @track mapMarkersOnly;
  @track jsonData2;
  @track pendingSaveOperation = false;
  @track pendingAddRowOperation = false;
  @track pendingStaffId = null;
  @track bypassFatigueCheck = false;
  @track pendingStaffName = null;
  @track pendingRowIndex = 0;
  @track addshiftMaxDuration = 0;
  @track shiftTypeDurations = {};
  @track selectedStaffLabel = "";
  @track hourlyRateEditable=false;
  @track originalServiceAmounts = {};

  renderedCallback() {
    // Check if leaflet resources are already loaded
    if (this.leafletInitialized) {
      return;
    }

    // Load Leaflet.js and Leaflet.css files
    Promise.all([
      loadScript(this, LEAFLET + "/leaflet.js"),
      loadStyle(this, LEAFLET + "/leaflet.css")
    ])
      .then(() => {
        this.leafletInitialized = true;
      })
      .catch((error) => {
        console.error("Error loading Leaflet:", error);
      });

    const bubbleContainer = this.template.querySelector(
      ".facility-bubble-container"
    );
    if (bubbleContainer && !this._bubbleScrollBound) {
      bubbleContainer.addEventListener("wheel", this.handleHorizontalScroll, {
        passive: false
      });
      this._bubbleScrollBound = true;
    }

    const container = this.template.querySelector(
      '[data-id="roleTabsContainer"]'
    );
    if (!container) return;

    // Observe when tabs change (buttons added/removed)
    if (!this.mutationObserver) {
      this.mutationObserver = new MutationObserver(() => {
        this.updateArrowVisibility();
      });
      this.mutationObserver.observe(container, {
        childList: true,
        subtree: true
      });
    }

    // Observe when container resizes (window zoom, DPI, etc.)
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateArrowVisibility();
      });
      this.resizeObserver.observe(container);
    }

    // ✅ 4. Ensure visibility logic runs after full paint/layout
    requestAnimationFrame(() => {
      console.log("📢 Triggering updateArrowVisibility after layout");
      this.updateArrowVisibility();
    });
  }

  @wire(getSeriveList, { shiftStaffId: "$shiftStaffId" })
  wiredServices(response) {
    //console.log("Service initial response -->  " + JSON.stringify(response));
    this.servicesList = [];
    this.wiredServicesResult = response;
    // console.log("Service initial response  " + JSON.stringify(response)); // Track the result for refreshApex
    const { data, error } = response;
    if (data) {
      this.servicesList = data; // Assign data to servicesList
      console.log(
        "Service List IN WIRE METHOD  " + JSON.stringify(this.servicesList)
      );
    } else if (error) {
      console.error("Error fetching services:", error);
    }
  }
  @wire(getStaffData, {
    roles: "$chosenRole",
    startDate: "$startDate",
    endDate: "$endDate",
    facIdlist: "$facilityValue",
    orgID: "$orgId",
    weekDataJson: "$weekDaysWithDatesJSON",
    name: "$searchName",
    shiftTypeList: "$shiftTypefilterValue",
    statusList: "$statusfilterValue"
  })
  wiredStaffDataFunction(result) {
    this.wiredStaffData = result;

    if (result.data) {
      console.log("Staff Data in the Roster Manger >>>", result.data);
      this.childRosterInvoices = false;

      const initializedData = result.data.map((role) => ({
        ...role,
        staffData: role.staffData.map((staff) => ({
          ...staff,
          shiftsByDay: (staff.shiftsByDay || []).map((day) => {
            const newUIGroup = day.newUIGroupOfShifts || [];
            const isAddShiftVisible = newUIGroup.length < 4;

            return {
              ...day,
              isAddShiftVisible,
              shifts: (day.shifts || []).map((shift) => ({
                ...shift,
                calculatedStyle: shift.splitShiftColor || "",
                isHovered: false,
                hideIfNotHovered: false
              }))
            };
          })
        }))
      }));

      this.staffData = initializedData;

      console.log("✅ Staff data initialized:", JSON.stringify(this.staffData));

      if (this.staffData.length > 0) {
        if (
          !this.selectedRole ||
          !this.staffData.some((role) => role.roleName === this.selectedRole)
        ) {
          this.selectedRole = this.staffData[0].roleName;
        }
        this.updateRoleTabClasses();
      }
    } else if (result.error) {
      console.error("❌ Error fetching staff data:", result.error);
    }
  }

  @wire(getFacilityData)
  wiredFacilityData(result) {
    this.wiredFacilityResult = result; // Store the full wire result for refresh
    const { data, error } = result;
    if (data) {
      console.log("response", JSON.stringify(data));
      if (data.length > 0 && data[0].Organisation__r) {
        this.organisationShiftTimes = data[0].Organisation__r;
      }
    } else if (error) {
      console.error("Error fetching facility data", error);
    }
  }

  fetchStaffRoles() {
    return getStaffByStatus({ recordId: this.RolesStaffId })
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          let roleString = data[0].Role__c;
          if (roleString) {
            this.roleOptions = roleString.split(";").map((role) => ({
              label: role.trim(),
              value: role.trim()
            }));
          } else {
            this.roleOptions = [];
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching staff roles: ", error);
        this.roleOptions = [];
      });
  }

  handleMouseOver(event) {
    event.target.style.whiteSpace = "normal";
    event.target.style.overflow = "visible";
    event.target.style.textOverflow = "unset";
    event.target.style.maxWidth = "none";
    event.target.style.position = "static"; // allow it to reflow
  }

  handleMouseOut(event) {
    event.target.style.whiteSpace = "nowrap";
    event.target.style.overflow = "hidden";
    event.target.style.textOverflow = "ellipsis";
    event.target.style.maxWidth = "200px";
    event.target.style.position = "relative";
  }

  connectedCallback() {
    window.addEventListener("scroll", this.handleScrollOrClick);
    window.addEventListener("click", this.handleOutsideClick);
    window.addEventListener("keydown", this.handleKeyboardShortcut.bind(this));
    this.handleDocumentClickBound = this.handleDocumentClick.bind(this);
    document.addEventListener("click", this.handleDocumentClickBound);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
    this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName =
      localStorage.getItem("defaultStaffPreferredName") || "Staff";

    this._handleOutsideFacilityClick =
      this.handleOutsideFacilityClick.bind(this); // ✅ bind once
    window.addEventListener("click", this._handleOutsideFacilityClick);
    //this.initializeWeek(new Date());
    const storedDateStr = localStorage.getItem("rosterSelectedDate");
    const storedDate = storedDateStr ? new Date(storedDateStr) : new Date();

    // Check if valid, else fallback to current date
    if (!isNaN(storedDate)) {
      this.initializeWeek(storedDate);
    } else {
      this.initializeWeek(new Date());
    }

    getCurrentLoggedUserInfo().then((userData) => {
      const storedFacilityId = localStorage.getItem("defaultFacilityId");
      const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");
      console.log("storedFacilityId local storage " + storedFacilityId);
      console.log("storedFacilityLabel local storage " + storedFacilityLabel);
      console.log("user data ==>" + JSON.stringify(userData));
      let userType = userData.User_Type__c;
      this.loggedInUserType = userData.User_Type__c;
      if (userType == "NDIS Org Admin") {
        getFacilityData()
          .then((response) => {
            this.facilityOptions = response.map((record) => ({
              value: record.Id,
              label: record.Name,
              preferredName: record.Facility_Preferred_Name_Formula__c,
              participantPreferredName:
                record.Participant_Preferred_Name_Formla__c,
              staffPreferredName: record.Staff_Preferred_Name_Formula__c
            }));
            console.log(
              "organisationShiftTimes" +
                JSON.stringify(this.organisationShiftTimes)
            );
            this.organisationShiftTimes = response[0].Organisation__r;
            //  console.log('organisationShiftTimes' +JSON.stringify(this.organisationShiftTimes));

            if (!this.facilityValue) {
              this.facilityValue = []; // Ensure it's an array
            }

            if (this.facilityOptions.length > 0) {
              this.facilityValue.push(storedFacilityId);
              this.SelectedComboBoxFacility = storedFacilityId;
            }
            this.fetchInitialData();
          })
          .catch((err) => {
            console.error(err);
          });
      } else if (userType == "Facility Admin" || userType == "Roster Manager") {
        getFacilityCurrentUser().then((result) => {
          this.facilityOptions = result.map((record) => ({
            label: record.Facility__r.Name,
            value: record.Facility__r.Id,
            preferredName:
              record.Facility__r.Facility_Preferred_Name_Formula__c,
            participantPreferredName:
              record.Facility__r.Participant_Preferred_Name_Formla__c,
            staffPreferredName:
              record.Facility__r.Staff_Preferred_Name_Formla__c
          }));

          getFacilityData().then((response) => {
            this.organisationShiftTimes = response[0].Organisation__r;
          });
          if (this.facilityOptions.length > 0) {
            this.facilityValue.push(storedFacilityId);
            this.SelectedComboBoxFacility = storedFacilityId;
          }
          console.log(
            "facilityOptions ==> for facility admin" +
              JSON.stringify(this.facilityOptions)
          );
          this.fetchInitialData();
        });
      }
    });
  }
  fetchInitialData() {
    organizationDetails().then((response) => {
      this.orgId = response.listofPriceBook.Id;
      console.log(
        " type of org " + response.listofPriceBook.Other_than_NDIS_User__c
      );
      //  this.otherThanNdis = response.listofPriceBook.Other_than_NDIS_User__c;
      this.facilityPreferredName =
        response.listofPriceBook.Facility_Preferred_Name_Formula__c;
      this.participantPreferredName =
        response.listofPriceBook.Participant_Preferred_Name_Formula__c;
      let orgRoles = response.listofPriceBook.Roles__c;
      this.OrgNisationRoles = orgRoles
        .split(";")
        .sort()
        .map((rec, index) => {
          this.sectionFlags[rec] = index === 0;
          this.activeSections.push(rec);
          return { value: rec, label: rec };
        });
      // console.log('section falgs '+JSON.stringify(this.sectionFlags));
      this.RoleFilter = this.OrgNisationRoles;
      let AllFilter = { value: "All", label: "All" };
      this.RoleFilter = [AllFilter, ...this.RoleFilter];
      console.log("RoleFilter " + JSON.stringify(this.RoleFilter));
      if (!this.chosenRole) {
        this.chosenRole = [];
      }
      if (!this.SelctedComboBoxRole) {
        this.SelctedComboBoxRole = [];
      }

      if (localStorage.getItem("SelctedComboBoxRole")) {
        this.chosenRole.push(
          JSON.parse(localStorage.getItem("SelctedComboBoxRole"))
        );
        this.SelctedComboBoxRole = JSON.parse(
          localStorage.getItem("SelctedComboBoxRole")
        );
      } else if (this.OrgNisationRoles.length > 0) {
        this.SelctedComboBoxRole = this.OrgNisationRoles[0].value;
        this.chosenRole.push(this.OrgNisationRoles[0].value);
        this.selectedRole = this.OrgNisationRoles[0].value;
      }

      if (!this.facilityValue) {
        this.facilityValue = [];
      }
      if (!this.SelectedComboBoxFacility) {
        this.SelectedComboBoxFacility = [];
      }

      /*  if (localStorage.getItem('SelectedComboBoxFacility')) {
                this.facilityValue.push(JSON.parse(localStorage.getItem('SelectedComboBoxFacility')));
                this.SelectedComboBoxFacility = JSON.parse(localStorage.getItem('SelectedComboBoxFacility'));
            } else if (this.facilityOptions.length > 0) {
                this.SelectedComboBoxFacility=this.facilityOptions[0].value;
                this.facilityValue.push(this.facilityOptions[0].value);
            } */

      if (this.orgId != null && this.chosenRole.length > 0) {
        const storedRoles = localStorage.getItem("rosterRoles");
        if (storedRoles) {
          this.chosenRole = JSON.parse(storedRoles);
        }

        /*  const storedFacilities = localStorage.getItem('rosterFacilities');
                if (storedFacilities) {
                    this.facilityValue = JSON.parse(storedFacilities);
                } */

        console.log("Selected Roles:", JSON.stringify(this.chosenRole));
        console.log("Selected Facilities:", JSON.stringify(this.facilityValue));

        this.loadStaffData();
        console.log("isstaffview  in roster " + this.isstaffviewfromparent);
        if (this.isstaffviewfromparent == true) {
          this.viewName = "Staff View"; // This for the Toggle bar for view
        } else {
          this.isParticipanTViewEnable = true;
          this.viewName = "Participant View";
        }

        this.isAutoSchedule = true;
        //   this.facIdlist = [...this.facIdlist];
      }
      const savedView = localStorage.getItem("selectedRosterView");
      if (savedView === "staff") {
        console.log("✔ Calling handleStaffView() from fetchInitialData()");
        this.handleStaffView();
      } else {
        console.log(
          "✔ Calling handleParticipantView() from fetchInitialData()"
        );
        this.handleParticipantView(); // default
      }
    });

    this.recurEveryOptions = this.generateOptions(30);
    this.monthLyOptions = this.generateOptions(31);
    //this.fetchShifts();
    // console.log('Role options:', JSON.stringify(this.OrgNisationRoles));
    if (this.staffData.length > 0) {
      this.selectedRole = this.staffData[0].roleName;
      this.updateRoleTabClasses();
    }
  }

  disconnectedCallback() {
    // Remove event listeners when component is destroyed
    window.removeEventListener("keydown", this.handleKeyboardShortcut);
    window.removeEventListener("scroll", this.handleScrollOrClick);
    window.removeEventListener("click", this.handleOutsideClick);
    window.removeEventListener("click", this._handleOutsideFacilityClick);
    document.removeEventListener("click", this.handleClickOutside);
    document.removeEventListener("keydown", this.handleEscapeKey);
    if (this.handleDocumentClickBound) {
      document.removeEventListener("click", this.handleDocumentClickBound);
    }

    const bubbleContainer = this.template.querySelector(
      ".facility-bubble-container"
    );
    if (bubbleContainer) {
      bubbleContainer.removeEventListener("wheel", this.handleHorizontalScroll);
      this._bubbleScrollBound = false;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  staffSlistOnSelection() {
    return StaffsRolesWiseList({
      orgId: this.orgId,
      facIdlist: [this.addShiftData.AddShiftFacilityValue],
      roles: [this.addShiftData.AddShiftRole],
      name: ""
    }).then((response) => {
      this.staffOptions = response.map((rec) => {
        this.StaffHourlyRates[rec.Id] = { staffHoulryRate: rec };
        return {
          label: rec.Display_Nickname__c,
          value: rec.Id,
          staffPaidBreak: rec.Paid_Break__c
        };
      });
    });
  }

  get weekDaysWithDatesJSON() {
    return JSON.stringify(this.weekDaysWithDates);
  }
  get formattedDate() {
    if (this.currentStartOfWeek) {
      const year = this.currentStartOfWeek.getFullYear();
      const month = String(this.currentStartOfWeek.getMonth() + 1).padStart(
        2,
        "0"
      );
      const day = String(this.currentStartOfWeek.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  }

  initializeWeek(startDate) {
    this.currentStartOfWeek = this.getStartOfWeek(startDate);
    this.weekDaysWithDates = this.calculateWeekDaysWithDates(
      this.currentStartOfWeek
    );
    console.log("Days " + JSON.stringify(this.weekDaysWithDates));

    // this.monthName = this.returnMonthName(this.currentStartOfWeek);
  }

 /*  getStartOfWeek(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    return startOfWeek;
  } */

 getStartOfWeek(date) {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay(); // 0=Sun,1=Mon,...6=Sat
  // Calculate how many days to subtract to reach Monday
  const diff = (day === 0 ? -6 : 1 - day); // if Sunday → go back 6 days
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  return startOfWeek;
}

  calculateWeekDaysWithDates(startOfWeek) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekDaysWithDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);

      // Format date as DD-MM-YYYY
      const day = String(currentDate.getDate()).padStart(2, "0");
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const year = currentDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const uiFormattedDate = `${day}`;

      weekDaysWithDates.push({
        day: days[i],
        weekDays: formattedDate,
        UiFormattedDate: uiFormattedDate
      });
    }
    return weekDaysWithDates;
  }

  returnMonthName(startOfWeek) {
    const monthName = startOfWeek.toLocaleString("default", { month: "long" }); // Get the full month name
    return monthName;
  }

  loadPreviousWeek() {
    const previousWeekStart = new Date(this.currentStartOfWeek);
    previousWeekStart.setDate(this.currentStartOfWeek.getDate() - 7);
    this.initializeWeek(previousWeekStart);
    localStorage.setItem("rosterSelectedDate", previousWeekStart.toISOString());
    this.isShowSpinner = true;
    this.loadStaffData();

    this.isShowSpinner = false;
  }

  loadNextWeek() {
    const nextWeekStart = new Date(this.currentStartOfWeek);
    nextWeekStart.setDate(this.currentStartOfWeek.getDate() + 7);
    this.initializeWeek(nextWeekStart);
    localStorage.setItem("rosterSelectedDate", nextWeekStart.toISOString());
    this.isShowSpinner = true;
    this.loadStaffData();
    this.isShowSpinner = false;
  }

  handleDatePickerChange(event) {
    const field = event.target.name;
    const isValid = event.target.reportValidity();
    console.log("isValid", isValid);

    this.fieldErrorMap[field] = !isValid;
    const selectedDate = new Date(event.target.value); // Input date from date picker
    if (isNaN(selectedDate)) {
      this.initializeWeek(new Date()); // Load with today's date if invalid
    } else {
      this.initializeWeek(selectedDate);
      localStorage.setItem("rosterSelectedDate", selectedDate.toISOString());
    }
    this.isShowSpinner = true;
    this.loadStaffData();

    this.isShowSpinner = false;
  }
  // Event handler for combobox changes
  handleChange(event) {
    const selectedValue = event.target.value; // Current combobox value
    const name = event.target.name; // Name of the combobox

    // console.log('Combobox name:', name);
    // console.log('Selected value:', selectedValue);

    if (name == "FacilityComboBox") {
      // console.log('Updating facility selection');
      this.SelectedComboBoxFacility = selectedValue;
      this.facilityValue = [selectedValue]; // Update the selected facility (single-select example)
    } else if (name == "RoleComboBox") {
      //  console.log('Updating role selection');
      this.SelctedComboBoxRole = selectedValue;
      this.chosenRole = [selectedValue]; // Update the selected role (single-select example)
    }
    localStorage.setItem(
      "SelctedComboBoxRole",
      JSON.stringify(this.SelctedComboBoxRole)
    );
    /*   localStorage.setItem('SelectedComboBoxFacility', JSON.stringify(this.SelectedComboBoxFacility)); */

    this.loadStaffData();
  }

  // Method to load staff data from Apex
  loadStaffData() {
    // this.isShowSpinner=true;
    console.log("Week days start ", this.weekDaysWithDates[0].weekDays);
    console.log("Week days end", this.weekDaysWithDates[6].weekDays);
    let startparts = this.weekDaysWithDates[0].weekDays.split("-");

    this.startDate = startparts[2] + "-" + startparts[1] + "-" + startparts[0];
    
    let endparts = this.weekDaysWithDates[6].weekDays.split("-");
    this.endDate = endparts[2] + "-" + endparts[1] + "-" + endparts[0];
    console.log("Week days start ", this.startDate);
    console.log("Week days end", this.endDate);
    if (
      this.endDate != undefined &&
      this.endDate != null &&
      this.endDate != "" &&
      this.startDate != undefined &&
      this.startDate != null &&
      this.startDate != ""
    ) {
      this.refreshStaffData();
      this.handlePublishedStatus();
    }
  }
  handlePublishedStatus() {
    getPublishData({
      startDate: this.startDate,
      endDate: this.endDate,
      facList: this.facilityValue,
      orgId: this.orgId
    })
      .then((result) => {
        console.log(
          "✅ Retrieved published shift data:",
          JSON.stringify(result)
        );
        this.shiftPublishStatus = "";
        this.statusIcon = "";
        this.statusColor = "";

        if (!result || result.length === 0) {
          this.shiftPublishStatus = "";
        } else {
          const autoShifts = result.filter(
            (shift) => shift.Is_Auto_Schedule_Shift__c === true
          );

          if (
            autoShifts.some((shift) => shift.Is_Published_Shifts__c === false)
          ) {
            // Priority: if any auto-scheduled shift is unpublished → Unpublished
            this.shiftPublishStatus = "Unpublished";
            this.statusIcon = "light_off";
          } else if (
            autoShifts.length > 0 &&
            autoShifts.every((shift) => shift.Is_Published_Shifts__c === true)
          ) {
            // If all auto-scheduled shifts are published → Published
            this.shiftPublishStatus = "Published";
            this.statusIcon = "lightbulb";
          } else {
            // If there are no auto-scheduled shifts → empty
            this.shiftPublishStatus = "";
          }
        }

        console.log("🔁 Overall Status:", this.shiftPublishStatus);
      })
      .catch((error) => {
        console.error("❌ Error retrieving shifts:", error);
        this.shiftPublishStatus = "";
        this.statusIcon = "";
      });
  }

  get statusColorStyle() {
    if (this.shiftPublishStatus === "Published") {
      return "color: green;";
    } else if (this.shiftPublishStatus === "Unpublished") {
      return "color: gray;";
    }
    return "";
  }
  get statusIconClass() {
    if (this.shiftPublishStatus === "Published") {
      return "material-icons-lightbulb";
    } else if (this.shiftPublishStatus === "Unpublished") {
      return "material-icons-light_off";
    }
    return "material-icons status-icon";
  }

   @track staffIdonweeklycanlander;
   @track staffFullName;
   handleWeeklyCalander(event) {
     // Example: Fire a custom event or handle logic here
     console.log("Clicked: " + this.startDate + " " + this.endDate);
     this.staffIdonweeklycanlander = event.target.closest(".card").dataset.id;
     console.log("Clicked Role:" + event.currentTarget.dataset.staffroll);
     this.rollName = event.currentTarget.dataset.staffroll;
     const staffId = this.staffIdonweeklycanlander;
     console.log("Clicked Staff ID:", staffId);
     console.log("Clicked Staff ID:", staffId);
     const stafffirstname = event.currentTarget.dataset.stafffirstname;
     const stafflastname = event.currentTarget.dataset.stafflastname;
     console.log("Clicked Staff firstname:", stafffirstname);
     console.log("Clicked Staff lastname:", stafflastname);
     this.staffFullName = event.currentTarget.dataset.fullname;
     this.weeklyDataforStaff = true;
     this.refreshShifts(staffId);
   }

  scrollLeft() {
    let newStartDate = new Date(this.startDate);
    newStartDate.setDate(newStartDate.getDate() - 7); // Move back exactly 7 days

    let formattedStartDate = newStartDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

    // Calculate the end date by adding 6 more days (to get full week)
    let endDate = new Date(newStartDate);
    endDate.setDate(endDate.getDate() + 6);
    let formattedEndDate = endDate.toISOString().split("T")[0];

    const staffId = this.staffIdonweeklycanlander;
    this.startDate = formattedStartDate;
    this.endDate = formattedEndDate;
    this.initializeWeek(this.startDate);
    this.refreshShifts(staffId);
  }

  scrollRight() {
    let newStartDate = new Date(this.startDate);
    newStartDate.setDate(newStartDate.getDate() + 7); // Move forward 7 days

    let formattedStartDate = newStartDate.toISOString().split("T")[0];

    let endDate = new Date(newStartDate);
    endDate.setDate(endDate.getDate() + 6);
    let formattedEndDate = endDate.toISOString().split("T")[0];

    console.log(
      "➡️ Next Week: Start:",
      formattedStartDate,
      "| End:",
      formattedEndDate
    );

    const staffId = this.staffIdonweeklycanlander;
    this.startDate = formattedStartDate;
    this.endDate = formattedEndDate;
    //this.initializeWeek(this.startDate);
    this.refreshShifts(staffId);
  }

  refreshShifts(staffId) {
    console.log("Clicked: " + this.startDate + " " + this.endDate);
    getAllShiftWithSatff({
      staffId: staffId,
      StartDate: this.startDate,
      EndDate: this.endDate
    })
      .then((result) => {
        console.log("Shifts:", result);
        // Do something with the result, like updating a tracked property
        this.shifts = result;
        this.groupShiftsByDate();
      })
      .catch((error) => {
        console.error("Error fetching shifts:", error);
      });
  }

  groupShiftsByDate() {
    const grouped = {};

    this.shifts.forEach((shift) => {
      const rawDate = new Date(shift.Date__c);
      const formattedDate = `${String(rawDate.getDate()).padStart(2, "0")}/${String(rawDate.getMonth() + 1).padStart(2, "0")}/${rawDate.getFullYear()}`;

      if (!grouped[formattedDate]) {
        grouped[formattedDate] = {
          day: rawDate.toLocaleDateString("en-US", { weekday: "short" }),
          date: formattedDate,
          allShifts: []
        };
      }

      grouped[formattedDate].allShifts.push(shift);
    });

    this.groupedShifts = Object.values(grouped)
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/").map(Number);
        const [dayB, monthB, yearB] = b.date.split("/").map(Number);
        return (
          new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
        );
      })
      .map((group) => {
        const firstShift = group.allShifts[0];
        const remainingShifts = group.allShifts.slice(1);

        return {
          day: group.day,
          date: group.date,
          firstShift: {
            ...firstShift,
            isExpanded: false,
            toggleLabel: remainingShifts.length > 0 ? "More" : "",
            showMore: remainingShifts.length > 0,
            clientPicture:
              firstShift.Services_and_Support_Plans__r?.[0]?.Client__r
                ?.Picture__c,
            clientFirstName:
              firstShift.Services_and_Support_Plans__r?.[0]?.Client__r
                ?.First_Name__c || firstShift.Add_Shift__r?.Role__c,
            clientLastName:
              firstShift.Services_and_Support_Plans__r?.[0]?.Client__r
                ?.Last_Name__c || ""
          },
          remainingShifts: remainingShifts.map((shift) => ({
            ...shift,
            clientPicture:
              shift.Services_and_Support_Plans__r?.[0]?.Client__r?.Picture__c,
            clientFirstName:
              shift.Services_and_Support_Plans__r?.[0]?.Client__r
                ?.First_Name__c || shift.Add_Shift__r?.Role__c,
            clientLastName:
              shift.Services_and_Support_Plans__r?.[0]?.Client__r
                ?.Last_Name__c || ""
          }))
        };
      });
  }

  get groupedShiftsWithSelection() {
    return this.groupedShifts.map((group) => ({
      ...group,
      isSelected: group.date === this.selectedDate
    }));
  }

  handleMore(event) {
    event.preventDefault();
    const clickedDate = event.currentTarget.dataset.date;

    // Toggle the isExpanded for that date group
    this.groupedShifts = this.groupedShifts.map((group) => {
      if (group.date === clickedDate) {
        const updatedFirstShift = {
          ...group.firstShift,
          isExpanded: !group.firstShift.isExpanded,
          toggleLabel: group.firstShift.isExpanded ? "More" : "Less"
        };
        return {
          ...group,
          firstShift: updatedFirstShift
        };
      }
      return group;
    });
  }

   handleShiftClick(event) {
      event.preventDefault();
      this.shiftwithstaffId = event.target.dataset.id;
      this.staffIdforweekly = event.target.dataset.staff;
      this.shiftEnableGeolocation =
        event.target.dataset.staffgeolocation == "true" ? true : false;
      console.log("this.shiftwithstaffId:", this.shiftwithstaffId);
      console.log("this.staffIdforweekly:", this.staffIdforweekly);
      console.log("this.shiftEnableGeolocation:", this.shiftEnableGeolocation);
      this.isActionTooltip = true;
    }
    handleConfirmReset() {
      this.isActionTooltip = false;
  
      console.log("🟢 Sending Data:");
      console.log("shiftEnableGeolocation:", this.shiftEnableGeolocation);
      console.log("shiftEnableSignin:", this.shiftEnableSignin);
      console.log("shiftEnableSignout:", this.shiftEnableSignout);
      console.log("SelectedComments:", this.SelectedComments);
      console.log("staffIdforweekly:", this.staffIdforweekly);
      console.log("shiftwithstaffId:", this.shiftwithstaffId);
  
      // Call Apex method
      updateShiftDetails({
        enableGeolocation: this.shiftEnableGeolocation,
        enableSignin: this.shiftEnableSignin,
        enableSignout: this.shiftEnableSignout,
        selectedComments: this.SelectedComments,
        staffId: this.staffIdforweekly,
        shiftwithstaffId: this.shiftwithstaffId
      })
        .then(() => {
          this.confirMationMessage(
            "Success",
            "Shift details updated successfully.",
            "success"
          );
          console.log("✅ Shift updated successfully");
        })
        .catch((error) => {
          console.error("❌ Error updating shift:", JSON.stringify(error));
          this.confirMationMessage(
            "Error",
            "Error updating shift details",
            "error"
          );
        });
      this.shiftEnableGeolocation = false;
      this.shiftEnableSignin = false;
      this.SelectedComments = "";
      this.staffIdforweekly = "";
      this.shiftwithstaffId = "";
      this.shiftEnableSignout = false;
    }
    handleCloseActionTooltip(event) {
      this.isActionTooltip = false;
      this.shiftEnableGeolocation = false;
      this.shiftEnableSignin = false;
      this.SelectedComments = "";
      this.staffIdforweekly = "";
      this.shiftwithstaffId = "";
      this.shiftEnableSignout = false;
    }
    onchangeGeoLocation(event) {
      console.log("onchangeGeoLocation" + event.target.checked);
      this.shiftEnableGeolocation = event.target.checked;
      console.log("this.shiftEnableGeolocation" + this.shiftEnableGeolocation);
    }
    onchangeEnableSignin(event) {
      console.log("onchangeGeoLocation" + event.target.checked);
      this.shiftEnableSignin = event.target.checked;
      console.log("this.shiftEnableSignin" + this.shiftEnableSignin);
    }
    onchangeEnableSignout(event) {
      console.log("onchangeGeoLocation" + event.target.checked);
      this.shiftEnableSignout = event.target.checked;
      console.log("this.shiftEnableSignin" + this.shiftEnableSignin);
    }
    onchangeComments(event) {
      console.log("onchangeComments" + event.target.value);
      this.SelectedComments = event.target.value;
      console.log("this.SelectedComments" + this.SelectedComments);
    }
  
    closeTooltip1(event) {
      this.isweeklyDataTooltip = false;
      this.selectedDate1 = false;
    }
  
    handleClose(event) {
      this.isShowSpinner = true;
      // Get today's date
      let today = new Date();
  
      // Find the start of the current week (Monday)
      let currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - today.getDay() + 1); // Adjust to Monday
  
      let formattedStartDate = currentMonday.toISOString().split("T")[0];
  
      // Calculate the end of the current week (Sunday)
      let currentSunday = new Date(currentMonday);
      currentSunday.setDate(currentMonday.getDate() + 6);
      let formattedEndDate = currentSunday.toISOString().split("T")[0];
  
      console.log(
        "🔄 Reset to Current Week: Start:",
        formattedStartDate,
        "| End:",
        formattedEndDate
      );
  
      this.startDate = formattedStartDate;
      this.endDate = formattedEndDate;
      this.initializeWeek(this.startDate);
      this.weeklyDataforStaff = false;
      setTimeout(() => {
        this.isShowSpinner = false;
      }, 800);
    }
  

  refreshStaffData() {
    // this.facilityValue = [...this.facilityValue];
    //   this.staffData=[];
    // this.isShowSpinner = true;
    refreshApex(this.wiredStaffData);
  }
  togglePopover() {
    console.log("🔁 Toggling Popover. Current state:", this.isPopoverVisible);

    // Flip the visibility
    this.isPopoverVisible = !this.isPopoverVisible;

    // Delay outside click activation to avoid instant close on opening
    if (this.isPopoverVisible) {
      setTimeout(() => {
        console.log("✅ Outside click detection enabled");
        this.listenForOutsideClick = true;
      }, 0);
    } else {
      console.log("❌ Popover closed manually");
      this.listenForOutsideClick = false;
    }
  }

  closePopover() {
    this.isPopoverVisible = false;
    this.listenForOutsideClick = false;
  }


  togglePopoverforShiftType(event) {
    if (event) event.stopPropagation(); // prevents doc click handler firing on the same click

    // Just toggle — in both views
    this.isPopoverVisibleforShiftType = !this.isPopoverVisibleforShiftType;

    // Remove these two lines:
    // if (this.viewName === "Participant View") this.isPopoverVisibleforShiftType = true;
    // else if (this.viewName === "Staff View") this.isPopoverVisible = false;

    if (this.isPopoverVisibleforShiftType) {
      // Defer enabling outside-click listening so this same click doesn't close it
      setTimeout(() => {
        this.listenForOutsideClickShiftType = true;
      }, 0);
    } else {
      this.listenForOutsideClickShiftType = false;
    }
  }

  closePopoverforShiftType() {
    this.isPopoverVisibleforShiftType = false;
    this.listenForOutsideClickShiftType = false;
  }
  @track shiftTypefilterValue = [];
  @track statusfilterValue = [];
  handleCheckBoxChange(event) {
    const selectedValues = event.detail.value;
    console.log("Selected Roles:", JSON.stringify(selectedValues));

    if (event.target.name === "progress") {
      // Update chosen roles with selected values from the checkbox group
      this.chosenRole = [...selectedValues];

      if (!this.chosenRole.includes(this.selectedRole)) {
        this.selectedRole =
          this.chosenRole.length > 0 ? this.chosenRole[0] : "";
      }

      // Update tab classes (role-tab vs. role-tab active)
      this.updateRoleTabClasses();
    } else if (event.target.name === "Facility") {
      // Update selected facilities with selected values from the checkbox group
      this.facilityValue = [...selectedValues];
    } else if (event.target.name === "ShiftTypeforFilter") {
      this.shiftTypefilterValue = [...selectedValues];
      console.log("this.shiftTypefilterValue==>" + this.shiftTypefilterValue);
    } else if (event.target.name === "StatusforFilter") {
      this.statusfilterValue = [...selectedValues];
      console.log("this.statusfilterValue==>" + this.statusfilterValue);
    }
    this.SelctedComboBoxRole = "";
    this.SelectedComboBoxFacility = "";
    localStorage.setItem("rosterRoles", JSON.stringify(this.chosenRole));
    /*   localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue)); */
    console.log("Selected Roles:", JSON.stringify(this.chosenRole));
    console.log("Selected Facilities:", JSON.stringify(this.facilityValue));
    // this.loadStaffData();
  }
  stopPropagation(event) {
    event.stopPropagation();
  }

  showTooltip(event) {
    event.stopPropagation(); // Prevent immediate closing when clicking inside

    this.isTooltip = true;

    // Capture mouse click position
    let mouseX = event.clientX;
    let mouseY = event.clientY;

    // Adjust position to show tooltip to the left of the mouse click
    let tooltipWidth = 150; // Approximate width of tooltip
    let offsetX = 10; // Small gap from cursor
    let leftPosition = mouseX - tooltipWidth - offsetX;

    // Ensure the tooltip does not go off-screen on the left side
    if (leftPosition < 0) {
      leftPosition = 10; // Keep a minimum margin from the left edge
    }

    // Store shift details
    this.shiftTooltipInformation = {
      shiftTime: event.currentTarget.dataset.shifttime,
      shiftAddress: event.currentTarget.dataset.shiftstreet,
      shiftStatus: event.currentTarget.dataset.status,
      uiStatus: event.currentTarget.dataset.status,
      shiftId: event.currentTarget.dataset.id,
      participantimage: event.currentTarget.dataset.participantimage,
      participantname: event.currentTarget.dataset.participantname,
      roleName: event.currentTarget.dataset.role,
      isRoleName: event.currentTarget.dataset.participantname ? false : true,
      position: `top: ${mouseY + 10}px; left: ${leftPosition}px;`, // Offset by 10px for better visibility
      recurstatus: event.currentTarget.dataset.recurstatus,
      refid: event.currentTarget.dataset.refid,
      Shiftdate: event.currentTarget.dataset.weekdate
    };
    console.log(
      "Tooltip visible:",
      JSON.stringify(this.shiftTooltipInformation)
    );
  }

  closeTooltip() {
    this.isTooltip = false;
  }

  // Close tooltip when scrolling
  handleScrollOrClick = () => {
    this.closeTooltip();
  };

  @track listenForOutsideClick = false;

  handleOutsideClick = (event) => {
    // Check if click is inside any dropdown container using composedPath

    // Tooltip close
    const tooltip = this.template.querySelector(".tooltip");
    if (tooltip && !tooltip.contains(event.target)) {
      this.closeTooltip();
    }

    // Participant popover
    if (this.listenForOutsideClick) {
      const participantPopover = this.template.querySelector(
        '[data-id="participant-popover"]'
      );
      if (participantPopover && !participantPopover.contains(event.target)) {
        console.log("🟥 Outside click: closing participantPopover");
        this.isPopoverVisible = false;
        this.listenForOutsideClick = false;
      }

      const rolePopover = this.template.querySelector(
        '[data-id="participant-role-popover"]'
      );
      if (rolePopover && !rolePopover.contains(event.target)) {
        console.log("🟥 Outside click: closing participant-role-popover");
        this.isPopoverVisible = false;
        this.listenForOutsideClick = false;
      }
    }

    // ✅ Shift Type popover
    if (this.listenForOutsideClickShiftType) {
      const shiftTypePopover = this.template.querySelector(
        '[data-id="shift-type-popover"]'
      );
      if (shiftTypePopover && !shiftTypePopover.contains(event.target)) {
        console.log("⬅️ Outside click detected: closing Shift Type popover");
        this.isPopoverVisibleforShiftType = false;
        this.listenForOutsideClickShiftType = false;
      }

      const shiftTypePopoverParticipant = this.template.querySelector(
        '[data-id="shift-type-popover-participant"]'
      );
      if (
        shiftTypePopoverParticipant &&
        !shiftTypePopoverParticipant.contains(event.target)
      ) {
        console.log("⬅️ Outside click: closing Participant Shift Type sidebar");
        this.isPopoverVisibleforShiftType = false;
        this.listenForOutsideClickShiftType = false;
      }
    }
  };

  closeTooltip(event) {
    this.isTooltip = false;
  }
  emptyFields() {
    this.addShiftData = {
      AddShiftStartDate: null,
      AddShiftStaffValue: null,
      AddShiftFacilityValue: null,
      AddShiftRole: null,
      AddShiftType: null,
      AddShiftBreak: null,
      AddShiftDuration: 0,
      AddShiftStartTime: null,
      AddShiftStartTimeAMPM: null,
      AddShiftEndTime: null,
      AddShiftEndTimeAMPM: null,
      AddShiftnotification: false,
      AddShiftStaffHourlyRate: 0,
      AddShiftQuantity: 1,
      AddShiftNotes: null,
      AddShiftEOI: false,
      AddShiftId: null,
      AddShiftHoliday: false,
      AddShiftEnterOtherLocation: false,
      AddShiftParticipantAddressCheckbox: false,
      AddShiftEndDate: null,
      AddShiftTypeName: null,
      AddShiftStaffName: null,
      AddShiftFacilityName: null
    };
    this.AddShiftAdrress = {
      street: null,
      citySuburb: null,
      country: null,
      provinceState: null,
      postalcode: null
    };
    this.SplitShiftRows = [];
    this.ChekListrows = [];
    this.serviceParticipant = "";
    this.disablePostInsertButtons = false;
    this.LongShiftTimeSlots = {};
    this.EmptyAddressFields();
    this.rateRows = [];
    this.isSingleClassForServiceCreation = true;
    this.groupShift = false;
    this.splitShift = false;
    this.diableGroupShift = false;
    this.disableSplitShift = false;
    this.facilityAddressDisable = false;
    this.newAddressDisable = false;
    this.pendingSaveOperation = false;
    this.pendingAddRowOperation = false;
    this.pendingStaffName = null;
    this.pendingRowIndex = null;
    this.fatigueManagementFlag = false;
    this.addshiftMaxDuration = 0;
    this.shiftTypeDurations = {};
    this.rowShiftTimingsEnable=false;
    this.rowShiftTypeEnable=false;
    this.hourlyRateEditable=false;
    this.recurTemplate = false;
    this.disableNotification=false;
    this.enableTimeRounding=false;
  }
  async handleConfirmSetHours(event) {
    this.emptyFields();
    this.isHome = false;

    let holiday = event.currentTarget.dataset.isholiday;
    let shiftdate = event.currentTarget.dataset.weekdate;
    let role = event.currentTarget.dataset.role;
    let setHrsflag = event.currentTarget.dataset.staffsethrs;
    console.log("role " + role);
    console.log("restrictSetHours setHrsflag >> ", setHrsflag);
    this.addShiftData.AddShiftStaffValue = event.currentTarget.dataset.staffid;
    this.RolesStaffId = event.currentTarget.dataset.staffid;
    this.addShiftData.AddShiftRole = role;
    this.addShiftData.AddShiftStartDate = shiftdate;
    this.addShiftData.AddShiftFacilityValue =
      event.currentTarget.dataset.facilityval;
    this.addShiftData.AddShiftHoliday = holiday == "true" ? true : false;
    this.AddShiftDayName = event.currentTarget.dataset.weekname;
    this.IsLongShift = false;
    this.ServiceStaffValue = event.currentTarget.dataset.staffid;
    console.log("exceed hours " + event.currentTarget.dataset.exceedhours);
    console.log("sethours hours " + event.currentTarget.dataset.sethours);
    console.log("setHrs flag >> ", setHrsflag);
    const exceedHours = parseFloat(event.currentTarget.dataset.exceedhours);
    const setHours = parseFloat(event.currentTarget.dataset.sethours);
    /* await this.DocExpiryCheck(this.RolesStaffId);
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
    if (exceedHours > setHours) {
      if (setHrsflag == true) {
        console.log("setHrs flag if >> ", setHrsflag);
        // Show toast for setHrsflag = true
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: "Shift exceeds allowed set hours.",
            variant: "error"
          })
        );
        return; // 🚫 Stop further execution
      } else {
        console.log("setHrs flag else>> ", setHrsflag);
        // Just set flags for setHrsflag = false
        this.isCalenderShiftView = false;
        this.setHoursExceedsLimit = true;
      }
    }

    // ✅ Allowed hours — proceed with facility selection
    this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
      this.facilityValue.includes(rec.value)
    );

    console.log("selected facilityValue", JSON.stringify(this.facilityValue));
    console.log("ORG facilities", JSON.stringify(this.facilityOptions));
    console.log(
      "finalSelectedFacilities",
      JSON.stringify(this.finalSelectedFacilities)
    );

    // ⚠️ No facilities selected
    if (this.finalSelectedFacilities.length === 0) {
      this.confirMationMessage(
        "Error",
        "Please select at least one " +
          this.facilityPreferredName +
          " to create the shift.",
        "Error"
      );
      return;
    }
    const selectedFacility = this.finalSelectedFacilities.find(
      (f) => f.value === this.addShiftData.AddShiftFacilityValue
    );
    if (selectedFacility) {
      this.facilityPreferredName = selectedFacility.preferredName;
      this.participantPreferredName = selectedFacility.participantPreferredName;
      this.staffPreferredName = selectedFacility.staffPreferredName;
    }
    if (this.addShiftData.AddShiftFacilityValue) {
      this.addShiftData.AddShiftFacilityName =
        this.finalSelectedFacilities.find(
          (rec) => rec.value == this.addShiftData.AddShiftFacilityValue
        ).label;
      this.processShifts(this.addShiftData.AddShiftFacilityValue);
    }

    // ✅ All good — show calendar shift view
    this.isCalenderShiftView = true;
    this.setHoursExceedsLimit = false;
    this.createCalenderShift();
  }

  async createCalenderShift() {
    this.finalSelectedFacilities = [];

    console.log(
      " selected facilityValue in calender shift " +
        JSON.stringify(this.facilityValue)
    );
    console.log(" ORG facilities " + JSON.stringify(this.facilityOptions));
    this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
      this.facilityValue.includes(rec.value)
    );
    console.log(
      " finalSelectedFacilities in calender shift " +
        JSON.stringify(this.finalSelectedFacilities)
    );
    if (this.finalSelectedFacilities.length === 0) {
      this.confirMationMessage(
        "Error",
        "Please select at least one facility to create the shift.",
        "Error"
      );
      return;
    }
    this.isCalenderShiftView = true;
    this.setHoursExceedsLimit = false;

    // this.addShiftData.AddShiftFacilityValue=this.finalSelectedFacilities[0].value;
    this.addShiftData.AddShiftnotification = true;
    this.addShiftData.AddShiftType = "";
    this.isSingleClassForServiceCreation = true;
    this.isEditShiftScreenFlag = false;
    this.isIncludeParticipants = false;
    this.AddShiftIncludePartcipants = false;
    this.isCreateShiftButton = true;
    this.isStaffView = true;
    this.SplitShiftRows = [];
    this.isNewInsertOperation = true;
    this.startTimeSelectedHour = null;
    this.startTimeSelectedMinute = null;
    this.startTimeAMPM = null;
    this.endTimeSelectedHour = null;
    this.endTimeSelectedMinute = null;
    this.endTimeAMPM = null; // Store "AM" or "PM"
    this.cutsomShiftTemplate = null;
    this.riskindex = "";
    this.checkListDescription = "";
    //this.handleAddSplitShiftRow();

    this.facilityAddressCheckbox = true;
    this.SplitShiftVisible = false;
    this.AddShiftRecurringCheckboxValue = false;
    this.fetchFacilityAddressAndGeocode();
    this.isDisableParticipantCheckBox = true;
    if (this.isSplitCheckbox == true || this.serviceParticipant == null) {
      this.isDisableParticipantCheckBox = true;
    }
    this.isSplitCheckbox = false;

    //  console.log('Add shift data '+JSON.stringify(this.addShiftData));
    /*  getAvailableStaff({}) */
    this.shiftStaffId = "";
    this.servicesList = [];
    this.disableServiceSection = true;
    this.isDisbaleServiceButton = true;
    this.isVisibleCreateServicesButton = true;
    this.disableTimeButton = false;
    this.isRecurWeekFlag = false;
    this.isRecurmontlyFlag = false;
    this.RecurValue = "";
    this.recurEveryValue = 0;
    this.selectedDays = [];
    this.monthOfDay = 0;
    this.recurOccurencesValue = 0;
    this.recurEndDate = "";
    this.recurEndDateFormattedDate = "";
    this.ServiceTypeIdInParticipant = "";
    this.isRecurWeekFlag = false;
    this.isRecurmontlyFlag = false;
    this.isDisableSaveButton = false;
    this.addNewAddressCheckBox = false;
    this.participantAddressCheckBox = false;
    this.headingLabel = "Create Shift";
    this.hourlrRateLabel = "Hourly Rate";
    this.hourlyrateDisable = true;
    this.createShiftlabel = "Create Shift";
    this.ShiftwithStafftoApexId = null;
    this.isDisableSaveButton = true;
    this.RecurringWithIncludeAndNewParticipants = false;
    this.includeParticipantEvent = false;
    this.isParticipantServiceCreated = false;
    this.isShiftDragAndDrop = false;
    this.draggingStaffFullName = "";
     this.originalServiceAmounts={};
    // this.AddShiftAndServices=[];

    refreshApex(this.wiredServicesResult);
    await Promise.all([
      this.fetchStaffRoles(),
      this.staffSlistOnSelection(),
      this.handleLinkParticipants()
    ]);
    //  await Promise.all([this.staffSlistOnSelection(), this.handleLinkParticipants()]);
    this.AddShiftAndServices = [];
    this.rowShiftTypeEnable = false;
    this.hourlyRateEditable=false;
    this.rowShiftTimingsEnable = false;
    this.AddShiftAndServices = [this.initRow()];
    console.log(
      "this.addShiftData.AddShiftStaffValue  ==> " +
        this.addShiftData.AddShiftStaffValue
    );

    console.log("staffOptions ==>  " + JSON.stringify(this.staffOptions));
    let selectedStaff = this.staffOptions.find(
      (rec) => rec.value === this.addShiftData.AddShiftStaffValue
    );

    if (selectedStaff) {
      const { label, staffPaidBreak } = selectedStaff;
      console.log("staffPaidBreak ==> ", staffPaidBreak);

      this.AddShiftAndServices[0].stafflabel = label;
      this.selectedStaffLabel = "-" + label;
      this.AddShiftAndServices[0].staff = this.addShiftData.AddShiftStaffValue;
      this.AddShiftAndServices[0].staffPaidBreak = staffPaidBreak; // store paidBreak
    }

    const rate = this.getServiceStaffHourlyRate(
      this.addShiftData.AddShiftHoliday,
      this.AddShiftDayName,
      this.addShiftData.AddShiftStaffValue,
      this.addShiftData.AddShiftType
    );
    this.AddShiftAndServices[0].hourlyrate = rate;

    //  this.addRowForService();
    console.log(
      "this.AddShiftAndServices in create ===> " +
        JSON.stringify(this.AddShiftAndServices)
    );
  }

  /*   addRowForService(){

    const row={
      id: Date.now().toString(),AddShiftStartDate: null,AddShiftStaffValue: null,AddShiftFacilityValue: null,AddShiftRole: null,AddShiftType: null,AddShiftBreak: null,AddShiftDuration: 0,AddShiftStartTime: null,AddShiftStartTimeAMPM: null,AddShiftEndTime: null, AddShiftEndTimeAMPM: null, AddShiftnotification: false,AddShiftStaffHourlyRate: 0,AddShiftQuantity: 1,AddShiftNotes: null, AddShiftEOI: false,AddShiftId: null, AddShiftHoliday: false,AddShiftEnterOtherLocation: false,AddShiftParticipantAddressCheckbox: false,AddShiftEndDate: null,AddShiftTypeName: null,
      splitIndex:0,shiftWithStaffId: null,selectedNdisIdValue: null,SplitShift: false,serviceSupportId: null,participant: null,serviceTypeId: null,
    }
    this.AddShiftAndServices=[...this.AddShiftAndServices,row];
  } */

  async DocExpiryCheck(staffId, checkDateParam) {
    console.log("Parent record Id in addingPreTax: " + staffId);

    const response = await fetchStaff({ recordId: staffId }); // ⏳ wait for Apex
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

  handleLinkParticipants() {
    return fetchFacilitiess({ cname: "", isTrue: false }).then((response) => {
      this.participantoptions = response
        .filter(
          (rec) =>
            rec.Status__c === true &&
            rec.Facility__r.Status__c === true &&
            rec.Facility__c == this.addShiftData.AddShiftFacilityValue
        )
        .map((rec) => {
          return {
            value: rec.Id,
            label: rec.Name__c,
            riskStatus: rec.Risk_Status__c ? rec.Risk_Status__c : "Risk Free"
          };
        });
      // console.log("participantoptions " + JSON.stringify(this.participantoptions));
    });
  }

  handleCloseCalenderShiftView() {
    this.isCalenderShiftView = false;
    this.isStaffView = true;
    this.SplitShiftRows = [];
    this.isSplitCheckbox = false;
    this.recurTemplate = false;
    this.isHome = true;
  }
  // Add a new row
  handleAddRow() {
  const trimmedDesc = this.checkListDescription.trim();

  // ✅ Check character limit
  if (trimmedDesc.length > 1000) {
    this.confirMationMessage(
      "Error",
      "Description cannot exceed 1000 characters.",
      "Error"
    );
    return;
  }

  // ✅ Add row only if valid
  const newRow = {
    id: Date.now().toString(), // Store id as string
    index: this.ChekListrows.length + 1,
    description: trimmedDesc,
    mandatory: false,
    isCreatedFromStatic: false
  };

  this.ChekListrows = [...this.ChekListrows, newRow];
  this.checkListDescription = "";

  console.log("✅ Checklist after adding => " + JSON.stringify(this.ChekListrows));
}


  handleChecklistMandatoryChnage(event) {
    const rowId = event.target.dataset.id; // Use string id (no parseInt)
    this.ChekListrows = this.ChekListrows.map((row) => {
      if (row.id === rowId) {
        return { ...row, mandatory: event.target.checked };
      }
      return row;
    });
  }

  handleDeleteRow(event) {
    const rowId = event.currentTarget.dataset.id; // Keep as string
    console.log("handleDeleteRow triggered");
    console.log("Received rowId:", rowId, typeof rowId);
    console.log(
      "Current ChekListrows before deletion:",
      JSON.stringify(this.ChekListrows)
    );

    const rowToDelete = this.ChekListrows.find(
      (row) => String(row.id) === rowId
    ); // Convert to string for comparison
    console.log(
      "Row found to delete:",
      rowToDelete ? JSON.stringify(rowToDelete) : "No matching row found"
    );

    if (!rowToDelete) {
      console.warn(`No row found with id=${rowId}, delete operation aborted.`);
      return;
    }

    if (rowToDelete.checkListId) {
      if (!this.deletedChecklist) {
        this.deletedChecklist = [];
        console.log("Initialized deletedChecklist array");
      }
      this.deletedChecklist = [...this.deletedChecklist, rowToDelete];
      console.log(
        "Updated deletedChecklist:",
        JSON.stringify(this.deletedChecklist)
      );
    } else {
      console.log(
        "Row does not have checkListId; skipping adding to deletedChecklist"
      );
    }

    this.removeRowFromList(rowId); // Pass the string
    console.log(
      "CheckListrows after removeRowFromList call:",
      JSON.stringify(this.ChekListrows)
    );
  }

  removeRowFromList(rowId) {
    this.ChekListrows = this.ChekListrows.filter(
      (row) => String(row.id) !== rowId
    ); // Convert to string for comparison
    console.log(
      "Check list row after delete:",
      JSON.stringify(this.ChekListrows)
    );
    this.updateIndexes();
  }
  // Update indexes after a row is deleted
  updateIndexes() {
    this.ChekListrows = this.ChekListrows.map((row, index) => {
      return { ...row, index: index + 1 };
    });
  }

  // Update indexes after a row is deleted

  handleDeleteCheckBoxRow(event) {
    const rowId = parseInt(event.currentTarget.dataset.id, 10);
    this.SplitShiftRows = this.SplitShiftRows.filter((row) => row.id !== rowId);
    this.SplitShiftRows = this.SplitShiftRows.map((row, index) => {
      return { ...row, index: index + 1 };
    });
  }

  generateOptions(max) {
    const options = [];
    for (let i = 1; i <= max; i++) {
      // Starting from 1 for more realistic options
      options.push({ label: `${i}`, value: `${i}` });
    }
    return options;
  }
  async handleAddShiftChange(event) {
    this.addShiftData[event.target.name] = event.target.value;
    // console.log("addShift type " + JSON.stringify(this.addShiftData));
    console.log("event.target.name " + event.target.name);
    // console.log('add shift name'+this.AddShiftDayName)
    if (
      this.facilityAddressCheckbox == true &&
      event.target.name == "AddShiftFacilityValue"
    ) {
      this.getFacilityAddress();
    }

    if (event.target.name == "AddShiftNotes") {
      this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
    }
    if (
      event.target.name == "AddShiftStartDate" &&
      this.AddShiftRecurringCheckboxValue == true
    ) {
      this.callGetNumberOfRecurrences();
    }
    if (event.target.name == "AddShiftRole") {
      let result = await this.staffSlistOnSelection();
      console.log(
        "staff list in role change  ==>" + JSON.stringify(this.staffOptions)
      );
      if (this.staffOptions.length == 0) {
        this.confirMationMessage(
          "Information",
          "No staff members are currently available for the selected role.",
          "Info"
        );
        return;
      }

      this.addShiftData.AddShiftStaffValue = this.staffOptions[0].value;
      let staffLabel = this.staffOptions[0].label;
      console.log("staffLabel => ", staffLabel);
      this.selectedStaffLabel = this.groupShift != true ? "-" + staffLabel : "";

      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
        stafflabel: staffLabel,
        staff: this.addShiftData.AddShiftStaffValue,
        filteredstaff: [...this.staffOptions],
        staffPaidBreak: this.staffOptions[0].staffPaidBreak
      }));
    }
    if (event.target.name == "AddShiftTypeName") {
      console.log(
        "this.addShiftData.AddShiftTypeName ==>" +
          this.addShiftData.AddShiftTypeName
      );
      /* console.log(
        "shifNameOptions ==>" + JSON.stringify(this.shiftNameOptions)
      ); */
      let shifNames = this.shiftNameOptions.filter(
        (rec) => rec.value === this.addShiftData.AddShiftTypeName
      );
      console.log("shifNameOptions in onchnage  ==>" + JSON.stringify(shifNames));
       this.enableTimeRounding=shifNames[0].enableTimeRounding;

      this.splitShift = false;
      this.AddShiftAndServices = [];
      this.rowShiftTypeEnable = false;
      this.hourlyRateEditable=false;
      this.rowShiftTimingsEnable = false;
      this.AddShiftAndServices = [this.initRow()];
      console.log(
        "this.addShiftData.AddShiftStaffValue  ==> " +
          this.addShiftData.AddShiftStaffValue
      );

      console.log("staffOptions ==>  " + JSON.stringify(this.staffOptions));
      let selectedStaff = this.staffOptions.find(
        (rec) => rec.value === this.addShiftData.AddShiftStaffValue
      );

      if (selectedStaff) {
        const { label, staffPaidBreak } = selectedStaff; // get label + paidBreak (or other fields)

        this.AddShiftAndServices[0].stafflabel = label;
        this.selectedStaffLabel = "-" + label;
        this.AddShiftAndServices[0].staff =
          this.addShiftData.AddShiftStaffValue;
        this.AddShiftAndServices[0].staffPaidBreak = staffPaidBreak; // store paidBreak
      }
      this.AddShiftAndServices[0].shiftWithStaffId =
        this.isEditShiftScreenFlag == true ? this.ShiftwithStafftoApexId : null;
      const addressType =
        this.facilityAddressCheckbox == true
          ? "Facility"
          : this.participantAddressCheckBox == true
            ? "Participant"
            : "New";
      this.AddShiftAndServices[0].addressSource = addressType;
      const rate = this.getServiceStaffHourlyRate(
        this.addShiftData.AddShiftHoliday,
        this.AddShiftDayName,
        this.addShiftData.AddShiftStaffValue,
        this.addShiftData.AddShiftType
      );
      this.AddShiftAndServices[0].hourlyrate = rate;
      // this.AddShiftAndServices[0].shifttype=shifNames[0].Shift_Type__c;

      this.getShiftTimingsByFacility(shifNames);
    }
    if (event.target.name == "AddShiftStaffValue") {
      this.RolesStaffId = this.addShiftData.AddShiftStaffValue;
      /*  await this.DocExpiryCheck(this.RolesStaffId);
      if (this.documentExpired) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message:
              "One or more documents have expired. Please update them before proceeding.",
            variant: "error"
          })
        );
        this.isDisableSaveButton = true;
        return;
      } else {
        this.isDisableSaveButton = false;
      } */
      const rate = this.getServiceStaffHourlyRate(
        this.addShiftData.AddShiftHoliday,
        this.AddShiftDayName,
        this.addShiftData.AddShiftStaffValue,
        this.addShiftData.AddShiftType
      );

      this.addShiftData.AddShiftStaffHourlyRate = rate;
      if (this.isEditShiftScreenFlag == true) {
        this.isOriginalStaffChanged = true;
      }
      await this.fetchStaffRoles();
      let selectedStaff = this.staffOptions.find(
        (rec) => rec.value === this.addShiftData.AddShiftStaffValue
      );

      if (selectedStaff) {
        const { label, staffPaidBreak } = selectedStaff; // get label + paidBreak (or other fields)

        this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
          ...row,
          stafflabel: label,
          staff: this.addShiftData.AddShiftStaffValue,
          staffPaidBreak: staffPaidBreak
        }));
      }

      console.log(
        "selectedStaff in add shift  => ",
        JSON.stringify(this.AddShiftAndServices)
      );
       if (this.addShiftData.AddShiftType === "Custom") {
        const { enrichedSegments, updatedServices } =
          await this.prepareAndValidateCustomShifts();
        //  console.log("✅ Enriched Segments:", JSON.stringify(enrichedSegments));
        //  console.log("✅ Updated Services:", JSON.stringify(updatedServices));
      }
      //  await this.checkFatigue();
      /*  const isOverlapping = await this.getOverLappingdata();
        if (isOverlapping) {
          return; // ✅ stop execution if overlapping detected
        } */
    }

    // console.log("addShiftData " + JSON.stringify(this.addShiftData));
  }
  async getShiftTimingsByFacility(shifNames) {
    //  console.log("shift timings IN FACILITY timings  " + JSON.stringify(shifNames));

    this.cutsomShiftTemplate = false;
    this.IsLongShift = false;
    this.SplitShiftVisible = true;
    this.isSplitCheckbox = false;
    this.diableGroupShift = false;
    this.disableSplitShift = false;

    let startTime24 = this.formatMillisecondsToTime(shifNames[0].Start_Time__c);
    let endTime24 = this.formatMillisecondsToTime(shifNames[0].End_Time__c);
    const startAmPm = this.convertToAmPmObject(startTime24);
    const endAmPm = this.convertToAmPmObject(endTime24);
    console.log(" max duration  ==>" + shifNames[0].Duration__c);
    this.addshiftMaxDuration = shifNames[0].Duration__c
      ? shifNames[0].Duration__c
      : 0;

    this.addShiftData.AddShiftType = shifNames[0].Shift_Type__c;
    this.hourlyRateEditable = this.addShiftData.AddShiftType == "Sleepover Shift";
    this.addShiftData.AddShiftStartTime = startTime24
      ? `${startTime24}:00Z`
      : "00:00:00Z";
    this.addShiftData.AddShiftEndTime = endTime24
      ? `${endTime24}:00Z`
      : "00:00:00Z";
    this.addShiftData.AddShiftStartTimeAMPM = startAmPm.displayTime;
    this.addShiftData.AddShiftEndTimeAMPM = endAmPm.displayTime;

    const rate = this.getServiceStaffHourlyRate(
      this.addShiftData.AddShiftHoliday,
      this.AddShiftDayName,
      this.addShiftData.AddShiftStaffValue,
      this.addShiftData.AddShiftType
    );
    this.addShiftData.AddShiftStaffHourlyRate = rate;
    this.serviceStaffHourlyRate = rate;
    this.isDisableSaveButton = false;

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

    this.dispalyAmPMFormat();
    this.AddShiftAndServices.forEach((service) => {
      service.billablehours = this.getFinalDuration(
        this.addShiftData.AddShiftDuration,
        this.addShiftData.AddShiftBreak == 30 ? 0.5 : 0,
        service.staffPaidBreak
      );
      service.breakTime = this.addShiftData.AddShiftBreak;
      service.hourlyrate=rate;
    });

    if (this.addShiftData.AddShiftType === "Custom") {
      this.addshiftMaxDuration = 0;
      this.rowShiftTypeEnable = true;
      this.rowShiftTimingsEnable = true;
      this.diableGroupShift = true;
      this.disableSplitShift = true;
      this.hourlyRateEditable=true;

      let customShifts = shifNames[0].Custom_Shift_Timings__r || [];
      let shiftTypeDurationMap = {};
      let selectedStaff = this.staffOptions.find(
        (rec) => rec.value === this.addShiftData.AddShiftStaffValue
      );

      const { label, staffPaidBreak } = selectedStaff;

      customShifts.forEach((cs, index) => {
        let startTime24 = this.formatMillisecondsToTime(cs.Start_Time__c);
        let endTime24 = this.formatMillisecondsToTime(cs.End_Time__c);
        let startAmPmObj = this.convertToAmPmObject(startTime24);
        let endAmPmObj = this.convertToAmPmObject(endTime24);

        let row;
        if (index === 0 && this.AddShiftAndServices.length > 0) {
          row = this.AddShiftAndServices[0];
        } else {
          row = this.initRow();
        }

        // override with custom shift data
        row.shifttype = cs.Shift_Type__c || "";
        if (cs.Shift_Type__c) {
          if (!shiftTypeDurationMap[cs.Shift_Type__c]) {
            shiftTypeDurationMap[cs.Shift_Type__c] = 0;
          }
          shiftTypeDurationMap[cs.Shift_Type__c] += cs.Duration__c
            ? cs.Duration__c
            : 0;
        }

        row.hourlyrate = ""; // or calculate if needed
        row.rateLabel =
          cs.Shift_Type__c === "Sleepover Shift" ? "Allowance" : "Rate";
        row.customshiftlabel = cs.Shift_Type__c;
        this.addshiftMaxDuration += cs.Duration__c ? cs.Duration__c : 0;
        // update times
        row.starttime = startTime24 ? `${startTime24}:00Z` : "00:00:00Z";
        row.endtime = endTime24 ? `${endTime24}:00Z` : "00:00:00Z";

        row.startTimeSelectedHour = startAmPmObj.selectedHour;
        row.startTimeSelectedMinute = startAmPmObj.selectedMinute;
        row.startTimeSelectedAmPm =
          startAmPmObj.selectedAmPm.toUpperCase();
        row.startTimeDisplayTime = startAmPmObj.displayTime;

        row.endTimeSelectedHour = endAmPmObj.selectedHour;
        row.endTimeSelectedMinute = endAmPmObj.selectedMinute;
        row.endTimeSelectedAmPm =
          endAmPmObj.selectedAmPm.toUpperCase();
        row.endTimeDisplayTime = endAmPmObj.displayTime;
        row.staffPaidBreak = staffPaidBreak;

        if (!(index === 0 && this.AddShiftAndServices.length > 0)) {
          this.AddShiftAndServices.push(row);
        }
      });
      this.shiftTypeDurations = shiftTypeDurationMap;
      console.log(" max hours ==>" + JSON.stringify(this.shiftTypeDurations));

      /*  console.log(
        "this.AddShiftAndServices IN CUSTOM SHIFTS  ==>" +
          JSON.stringify(this.AddShiftAndServices)
      ); */
    }

    // ✅ Call Apex methods LAST
    // await this.checkFatigue();
    const isOverlapping = await this.getOverLappingdata(
      this.addShiftData.AddShiftStaffValue
    );
    if (isOverlapping) {
      return; // ✅ stop execution if overlapping detected
    }
    let avaliableId = null;
    const isValid = await this.checkShiftSetHours(
      avaliableId,
      this.addShiftData.AddShiftStaffValue
    );
    if (!isValid) {
      return; // 🚫 stop execution
    }
    if (this.addShiftData.AddShiftType === "Custom") {
      const { enrichedSegments, updatedServices } =
        await this.prepareAndValidateCustomShifts();
      //  console.log("✅ Enriched Segments:", JSON.stringify(enrichedSegments));
      //  console.log("✅ Updated Services:", JSON.stringify(updatedServices));
    }
  }

  // ✅ Utility method: prepares and validates custom shifts
  async prepareAndValidateCustomShifts() {
    // 1. Build segments array
    let customShiftsArray = this.AddShiftAndServices.map((custom, index) => ({
      shifttype: custom.shifttype,
      starttime: custom.starttime,
      endtime: custom.endtime,
      id: custom.id,
      rateLabel: custom.rateLabel,

      starttimeAmPm: custom.startTimeDisplayTime,
      endtimeAmPm: custom.endTimeDisplayTime,
      hourlyrate: custom.hourlyrate,
      index,

      startTimeSelectedHour: custom.startTimeSelectedHour,
      startTimeselectedMinute: custom.startTimeSelectedMinute,
      startTimeselectedAmPm: custom.startTimeSelectedAmPm,
      startTimdisplayTime: custom.startTimeDisplayTime,

      endTimeselectedHour: custom.endTimeSelectedHour,
      endTimeselectedMinute: custom.endTimeSelectedMinute,
      endTimeselectedAmPm: custom.endTimeSelectedAmPm,
      endTimeDdisplayTime: custom.endTimeDisplayTime,

      rowOnchangeOccured: custom.rowOnchangeOccured
    }));

    //console.log(" custom shift segments ==> " + JSON.stringify(customShiftsArray));

    // 2. Call Apex validation
    const result = await this.validateCustomShifts(customShiftsArray);
    let selectedStaff = this.staffOptions.find(
      (rec) => rec.value === this.addShiftData.AddShiftStaffValue
    );
    console.log("selectedStaff => ", JSON.stringify(selectedStaff));
    let staffLabel = selectedStaff ? selectedStaff.label : null;
    // 3. Parse enrichedSegmentsJson & update rows
    let enrichedSegments = [];
    if (result && result.enrichedSegmentsJson) {
      try {
        enrichedSegments = JSON.parse(result.enrichedSegmentsJson);

        console.log(" custom out put  , " + JSON.stringify(enrichedSegments));
        console.log(
          " addshift servies before creation ==> , " +
            JSON.stringify(this.AddShiftAndServices)
        );
        // Update AddShiftAndServices with enriched data
        this.AddShiftAndServices = this.AddShiftAndServices.map((service) => {
          let customResult = enrichedSegments.find(
            (seg) => seg.id === service.id
          );
          if (customResult) {
            let maxAllowed =
              this.shiftTypeDurations && service.shifttype
                ? this.shiftTypeDurations[service.shifttype]
                : null;

            /* if (  service.shifttype !== "Sleepover Shift" && maxAllowed &&customResult.duration > maxAllowed ) {
                this.confirMationMessage(
                  "Error",
                  `The shift type "${service.shifttype}" exceeds the maximum allowed duration of ${maxAllowed} hours. Please adjust the timings or contact your Facility Admin.`,
                  "Error"
                );
                return  // return immediately for this row
            } */
            const amount = (
              (service.unitprice || 0) * (customResult.duration || 0)
            ).toFixed(2);
            return {
              ...service,
              stafflabel: staffLabel,
              staff: this.addShiftData.AddShiftStaffValue,
              hourlyrate: customResult.hourlyrate,
              billablehours: this.getFinalDuration(
                customResult.duration,
                customResult.duration >= 5 ? 0.5 : 0,
                service.staffPaidBreak
              ),
              amount: amount
            };
          }
          return service;
        });
        this.formattedLongShifts(
          enrichedSegments,
          this.AddShiftAndServices[0].staffPaidBreak
        );
      } catch (e) {
        console.error("❌ Failed to parse enrichedSegmentsJson", e);
      }
    }

    console.log("📌 Parsed Segments:", JSON.stringify(enrichedSegments));

    // 4. Return both result + enriched segments if needed
    return {
      ...result,
      enrichedSegments,
      updatedServices: this.AddShiftAndServices
    };
  }

  async validateCustomShifts(cleanedSegments) {
    this.isDisableSaveButton = true;

    const payload = {
      shiftStartDate: this.addShiftData.AddShiftStartDate,
      shiftStartTime: this.addShiftData.AddShiftStartTime,
      shiftEndDate: this.addShiftData.AddShiftEndDate,
      shiftEndTime: this.addShiftData.AddShiftEndTime,
      segmentsJson: JSON.stringify(cleanedSegments),
      StaffId: this.addShiftData.AddShiftStaffValue
    };
    console.log("PAYLOAD BEFORE APEX " + JSON.stringify(payload));

    return validateSegments(payload) // ✅ return the Promise
      .then((result) => {
        if (result.enrichedSegmentsJson) {
          const enrichedSegments = JSON.parse(result.enrichedSegmentsJson);

          // ✅ Apply duration validation here
          if (this.shiftTypeDurations) {
            // make sure it's an object, not a string
            if (typeof this.shiftTypeDurations === "string") {
              this.shiftTypeDurations = JSON.parse(this.shiftTypeDurations);
            }

            for (let seg of enrichedSegments) {
              let maxAllowed = this.shiftTypeDurations[seg.shifttype];
              if (
                seg.shifttype !== "Sleepover Shift" && // skip Sleepover
                maxAllowed &&
                seg.duration > maxAllowed
              ) {
                this.isDisableSaveButton = true;
                this.confirMationMessage(
                  "Error",
                  `The shift type "${seg.shifttype}" exceeds the maximum allowed duration of ${maxAllowed} hours. Please adjust the timings or contact your Facility Admin.`,
                  "Error"
                );
                return {
                  isValid: false,
                  errorMessage: "Shift duration exceeded"
                };
              }
            }
          }
        } else {
          console.log("⚠️ No enrichedSegmentsJson available");
        }

        if (!result.isValid) {
          this.isDisableSaveButton = true;
          this.confirMationMessage(
            "Invalid Time",
            result.errorMessage,
            "error"
          );
        } else {
          this.isDisableSaveButton = false;
        }

        return result; // ✅ pass back to caller
      })
      .catch((error) => {
        console.error("❌ Apex call failed:", error);
        this.isDisableSaveButton = true;
        throw error; // ✅ propagate error to caller
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

  dispalyAmPMFormat() {
    console.log("🔄 dispalyAmPMFormat() called...");

    if (this.addShiftData.AddShiftStartTimeAMPM) {
      console.log(
        "⏱ Raw Start Time AMPM:",
        this.addShiftData.AddShiftStartTimeAMPM
      );

      let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(" ");
      console.log("   ➡️ Split into → time:", time, "| period:", period);

      let [startHour, startMinute] = time.split(":");
      console.log(
        "   ➡️ Time split → hour:",
        startHour,
        "| minute:",
        startMinute
      );

      this.startTimeSelectedHour = startHour;
      this.startTimeSelectedMinute = startMinute;
      this.startTimeAMPM = period == "AM" ? "AM" : "PM";

      console.log("✅ Parsed Start Time →", {
        startHour: this.startTimeSelectedHour,
        startMinute: this.startTimeSelectedMinute,
        startAMPM: this.startTimeAMPM
      });
    } else {
      console.warn("⚠️ No Start Time AMPM found in addShiftData");
    }

    if (this.addShiftData.AddShiftEndTimeAMPM) {
      console.log(
        "⏱ Raw End Time AMPM:",
        this.addShiftData.AddShiftEndTimeAMPM
      );

      let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(" ");
      console.log("   ➡️ Split into → time:", time, "| period:", period);

      let [endHour, endMinute] = time.split(":");
      console.log("   ➡️ Time split → hour:", endHour, "| minute:", endMinute);

      this.endTimeSelectedHour = endHour;
      this.endTimeSelectedMinute = endMinute;
      this.endTimeAMPM = period == "AM" ? "AM" : "PM";

      console.log("✅ Parsed End Time →", {
        endHour: this.endTimeSelectedHour,
        endMinute: this.endTimeSelectedMinute,
        endAMPM: this.endTimeAMPM
      });
    } else {
      console.warn("⚠️ No End Time AMPM found in addShiftData");
    }

    console.log("🏁 dispalyAmPMFormat() finished");
  }

  async checkFatigueForStaff(staffId) {
    try {
      const result = await getFatigueData({
        staffId: staffId,
        strtTimeText: this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),
        startdate: this.addShiftData.AddShiftStartDate
      });
      console.log("Fatigue Status for staff", staffId, ":", result);
      return result === true;
    } catch (error) {
      console.error("Error fetching fatigue data:", error);
      return false; // Default to no fatigue on error
    }
  }

  async getOverLappingdata(staffId) {
    try {
      console.log(' ShiftwithStaffId before overlapping  ==>'+this.ShiftwithStafftoApexId);
      const result = await getOverlappingShiftsData({
        strtTimeText: this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),
        endTimeText: this.addShiftData.AddShiftEndTimeAMPM.toLowerCase(),
        StaffID: staffId,
        startdate: this.addShiftData.AddShiftStartDate,
        shiftType: this.addShiftData.AddShiftType,
        ShiftwithStaffId: this.ShiftwithStafftoApexId
      });

      console.log("over lapping data " + JSON.stringify(result));

      if (result.isError === true) {
        this.confirMationMessage("Error", result.reason, "Error");
        return true; // ✅ overlapping detected
      } else {
        return false; // ✅ no overlapping
      }
    } catch (error) {
      console.error("Error fetching overlapping data:", error);
      throw error; // rethrow so caller knows it failed
    }
  }

  @track holidayPopup = false;
  async handleRecurEveryChange(event) {
    switch (event.target.name) {
      case "recurEvery":
        this.recurEveryValue = event.target.value;
        break;
      case "recurEndDate":
        this.recurEndDate = event.target.value;
        let recurDateParts = this.recurEndDate.split("-");
        this.recurEndDateFormattedDate =
          recurDateParts[2] + "/" + recurDateParts[1] + "/" + recurDateParts[0];
        // this.callGetNumberOfRecurrences();
        break;
      case "monthLyOptions":
        this.monthOfDay = event.target.value;
        this.isRecurDateDisabled = false;
        //  this.validateMonthLyOptions();
        break;
      case "recurCheckBox":
        this.AddShiftRecurringCheckboxValue = event.target.checked;
        this.recurTemplate = this.AddShiftRecurringCheckboxValue;

        if (!this.AddShiftRecurringCheckboxValue) {
          // Reset recurring fields when unchecked
          this.RecurValue = "";
          this.recurEveryValue = null;
          this.selectedDays = [];
          this.monthOfDay = null;
          this.recurOccurencesValue = null;
          this.recurEndDate = null;
          this.recurEndDateFormattedDate = "";
          this.isRecurWeekFlag = false;
          // **Skip validation when unchecked**
          this.isDisableSaveButton = false;

          return;
        }
        break;
      case "includeParticipants":
        this.AddShiftIncludePartcipants = event.target.checked;
        this.includeParticipantEvent = event.target.checked;
        this.isSingleClassForServiceCreation = false;
        if (this.isParticipantServiceCreated == true) {
          this.AddShiftIncludePartcipants = false;
          this.RecurringWithIncludeAndNewParticipants = true;
        }
        break;
    }

    console.log("recurCheckBox: ", this.AddShiftRecurringCheckboxValue);

    // **Only validate if recurCheckBox is checked**
    if (this.AddShiftRecurringCheckboxValue) {
      setTimeout(() => {
        this.isDisableSaveButton = this.validateRecurringOptions();
      }, 500);

      // Ensure API call only runs when all required values are available
      console.log(" this.RecurValue " + this.RecurValue);
      console.log(" this.recurEveryValue " + this.recurEveryValue);
      console.log(" this.recurEndDate " + this.recurEndDate);
      if (this.RecurValue && this.recurEveryValue && this.recurEndDate) {
        this.callGetNumberOfRecurrences();
      }
    }
  }

  callGetNumberOfRecurrences() {
    getNumberOfRecurrences({
      typeOfRecur: this.RecurValue,
      recurEvery: this.recurEveryValue,
      endDate: this.recurEndDate,
      shiftDate: this.addShiftData.AddShiftStartDate,
      weeklyDays: this.selectedDays,
      monthlyDay: this.monthOfDay
    })
      .then((response) => {
        this.selectedHolidayDates = [];
        this.removeHolidayDate = [];
        console.log(
          "response from getNumberOfRecurrences:",
          JSON.stringify(response)
        );

        if (response.isSuccess) {
          this.recurOccurencesValue = response.NumberOfOccurrences;
          this.isDisableSaveButton = false;

          // Now pass the result directly to your next method
          this.sendRecurEveryforWeeklyToApex(response);
        } else {
          this.confirMationMessage("Error", response.failureMessage, "Error");
          this.isDisableSaveButton = true;
        }
      })
      .catch((error) => {
        console.error("Error in getNumberOfRecurrences:", error);
      });
  }

  @track selectedHolidayDates = [];
  @track removeHolidayDate = [];

  handleholidayChange(event) {
    const index = event.target.dataset.index;
    const isChecked = event.target.checked;
    const originalDate = event.target.dataset.date;

    // Inline date formatter: converts "dd/MM/yyyy" to "yyyy-MM-dd"
    const formatDateToISO = (dateStr) => {
      if (!dateStr || typeof dateStr !== "string") return "";
      if (!dateStr.includes("/")) return dateStr; // already in ISO format
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    };

    const date = formatDateToISO(originalDate);

    console.log("--- handleholidayChange Triggered ---");
    console.log("Original Date:", originalDate);
    console.log("Formatted Date:", date);
    console.log("Checkbox Checked:", isChecked);
    console.log(
      "this.selectedHolidayDates",
      JSON.stringify(this.selectedHolidayDates)
    );
    console.log(
      "this.removeHolidayDate",
      JSON.stringify(this.removeHolidayDate)
    );

    // ✅ Update selected/unselected holiday arrays
    if (isChecked) {
      if (!this.selectedHolidayDates.includes(date)) {
        this.selectedHolidayDates.push(date);
        console.log("✅ Added to selectedHolidayDates:", date);
      }

      this.unselectedHolidayDates = this.unselectedHolidayDates.filter(
        (d) => d !== date
      );
      console.log("🗑 Removed from unselectedHolidayDates:", date);

      // ✅ Add date to recurrenceDatesList if not present
      if (!this.recurrenceDatesList.includes(date)) {
        this.recurrenceDatesList.push(date);
        console.log("📌 Added to recurrenceDatesList:", date);
      }
    } else {
      this.selectedHolidayDates = this.selectedHolidayDates.filter(
        (d) => d !== date
      );
      console.log("🗑 Removed from selectedHolidayDates:", date);

      if (!this.unselectedHolidayDates.includes(date)) {
        this.unselectedHolidayDates.push(date);
        console.log("✅ Added to unselectedHolidayDates:", date);
      }
    }

    // ✅ Fallback in case holidaysList is undefined
    this.removeHolidayDate = this.holidaysList;

    console.log("Holiday Dates:", JSON.stringify(this.removeHolidayDate));
    console.log(
      "recurrenceDatesList >>",
      JSON.stringify(this.recurrenceDatesList)
    );

    // Convert all holiday dates to yyyy-MM-dd
    const holidayDatesRaw = this.removeHolidayDate || [];
    const formattedHolidayDates = holidayDatesRaw.map((holiday) =>
      formatDateToISO(holiday.Date__c)
    );

    console.log(
      "📅 All Holiday Dates in yyyy-MM-dd format:",
      JSON.stringify(formattedHolidayDates)
    );
    console.log(
      "✅ Selected Holidays:",
      JSON.stringify(this.selectedHolidayDates)
    );

    // ✅ Filter recurrenceDatesList to keep:
    // 1. Dates NOT in the holiday list
    // 2. OR dates in the selected holiday list
    this.recurrenceDatesList = (this.recurrenceDatesList || []).filter(
      (d) =>
        !formattedHolidayDates.includes(d) ||
        this.selectedHolidayDates.includes(d)
    );

    console.log(
      "✅ Filtered recurrenceDatesList:",
      JSON.stringify(this.recurrenceDatesList)
    );

    this.HolidaySaveButton = this.selectedHolidayDates.length === 0;
    // HolidaySaveButton
  }

  handleholidayPopup() {
    //this.removeHolidayDate = this.holidaysList;

    // Inline date formatter: converts "dd/MM/yyyy" to "yyyy-MM-dd"
    const formatDateToISO = (dateStr) => {
      if (!dateStr || typeof dateStr !== "string") return "";
      if (!dateStr.includes("/")) return dateStr; // already in ISO format
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    };

    // Convert all holiday dates to yyyy-MM-dd
    const holidayDatesRaw = this.holidaysList || [];
    const formattedHolidayDates = holidayDatesRaw.map((holiday) =>
      formatDateToISO(holiday.Date__c)
    );

    console.log(
      "📅 All Holiday Dates in yyyy-MM-dd format:",
      JSON.stringify(formattedHolidayDates)
    );
    //  console.log('✅ Selected Holidays:', JSON.stringify(this.selectedHolidayDates));
    //  console.log('Holiday Dates:', JSON.stringify(this.removeHolidayDate));
    console.log(
      "recurrenceDatesList >>",
      JSON.stringify(this.recurrenceDatesList)
    );

    // ✅ Filter recurrenceDatesList to remove all holiday dates except selected ones
    this.recurrenceDatesList = (this.recurrenceDatesList || []).filter(
      (d) => !formattedHolidayDates.includes(d)
    );

    console.log(
      "✅ Updated recurrenceDatesList after filtering:",
      JSON.stringify(this.recurrenceDatesList)
    );
    this.holidayPopup = false;
    this.selectedHolidayDates = [];
    this.removeHolidayDate = [];
  }

  handleholidayPopupSave(event) {
    console.log("this.selectedHolidayDates >>" + this.selectedHolidayDates);
    if (!this.selectedHolidayDates || this.selectedHolidayDates.length === 0) {
      console.log("Selected Holiday Dates >> " + this.selectedHolidayDates);
      const holidayDatesToRemove = this.holidaysList.map((h) => h.Date__c);
      console.log(
        "Dates to remove from recurrenceDatesList:",
        JSON.stringify(holidayDatesToRemove)
      );

      // Filter out those dates from recurrenceDatesList
      this.recurrenceDatesList = this.recurrenceDatesList.filter(
        (date) => !holidayDatesToRemove.includes(date)
      );

      console.log(
        "Updated recurrenceDatesList after removal:",
        JSON.stringify(this.recurrenceDatesList)
      );
    }

    console.log("Save button clicked");
    this.holidayPopup = false;
    console.log(
      "this.recurrenceDatesList >> " + JSON.stringify(this.recurrenceDatesList)
    );
  }

  @track holidaysList = [];
  @track recurrenceDatesList = [];
  @track unselectedHolidayDates = [];
  sendRecurEveryforWeeklyToApex(response) {
    if (response.isSuccess && Array.isArray(response.RecurrenceDates)) {
      const recurrenceDates = response.RecurrenceDates.map((dateStr) => {
        const dateObj = new Date(dateStr);
        return dateObj.toISOString().split("T")[0]; // Convert to yyyy-MM-dd
      });

      console.log("recurrenceDates >>", recurrenceDates);
      this.recurrenceDatesList = recurrenceDates;
      this.unselectedHolidayDates = recurrenceDates;
      console.log("recurrenceDatesList >>", this.recurrenceDatesList);
      console.log("StaffId >>" + this.addShiftData.AddShiftStaffValue);
      const StaffId = this.addShiftData.AddShiftStaffValue;
      console.log("StaffId >>" + StaffId);

      HolidaysPopup({
        recurrenceDates: recurrenceDates,
        StaffId: StaffId
      })
        .then((result) => {
          console.log("Returned result from Apex:", JSON.stringify(result));

          const holidays = result.holidays || [];
          const holidayrateList = result.Holidayrate || [];

          let rateValue = null;
          console.log(" holiday pop up " + JSON.stringify(holidayrateList));
          console.log(" holidayrateList.length " + holidayrateList.length);
          if (holidayrateList.length > 0) {
            rateValue = holidayrateList[0].Public_holiday_Hourly_Rate__c;
            console.log("rateValue >> " + rateValue);
          }

          const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0"); // Months start from 0
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          };

          this.holidaysList = holidays
            .filter((h) => h && h.Id)
            .map((h) => ({
              Id: h.Id,
              Name: h.Holiday_Name__c,
              Date__c: formatDate(h.Date__c),
              Rate__c: rateValue,
              checked: false
            }));

          this.holidayPopup = this.holidaysList.length > 0;
          this.HolidaySaveButton = true;
        })
        .catch((error) => {
          console.error("Error calling Apex:", error);
        });
    } else {
      console.warn("Recurrence result missing or invalid.");
    }
  }

  async validateRecurringOptions() {
    console.log("Starting Recurring Options Validation...");

    /*  await this.DocExpiryCheck(
      this.addShiftData.AddShiftStaffValue,
      this.recurEndDate
    );
    if (this.documentExpired) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "Some documents expire before the recurrence end date. Please update them before proceeding.",
          variant: "error"
        })
      );
      this.isDisableSaveButton = true;
      return;
    }
 */
    let allFieldsValid = true; // Assume all fields are valid initially

    let fields = [
      {
        name: "typeOfRecurOption",
        selector: ".typeOfRecurOption",
        errorMessage: "Recur type is required."
      },
      {
        name: "recurEvery",
        selector: ".recurEvery",
        errorMessage: "Frequency is required"
      },
      {
        name: "recurEndDate",
        selector: ".recurEndDate",
        errorMessage: "End Date is required."
      }
    ];

    if (this.AddShiftRecurringCheckboxValue) {
      console.log("Recurring checkbox is checked, performing validation...");

      fields.forEach((field) => {
        let inputElement = this.template.querySelector(field.selector);
        if (inputElement) {
          let value = inputElement.value;

          if (!value) {
            console.warn(
              `Validation failed for: ${field.name}, Error: ${field.errorMessage}`
            );
            inputElement.setCustomValidity(field.errorMessage);
            allFieldsValid = false; // Mark as invalid if any field is empty
          } else {
            console.log(`Validation passed for: ${field.name}`);
            inputElement.setCustomValidity("");
          }

          inputElement.reportValidity();
        } else {
          console.error(
            `Field not found: ${field.name}, Selector: ${field.selector}`
          );
          allFieldsValid = false; // Assume invalid if field is missing
        }
      });
    } else {
      console.log(
        "Recurring checkbox is unchecked, clearing validation messages..."
      );
      allFieldsValid = false; // If checkbox is not checked, disable save button

      // Clear all error messages if checkbox is unchecked
      fields.forEach((field) => {
        let inputElement = this.template.querySelector(field.selector);
        if (inputElement) {
          inputElement.setCustomValidity("");
          inputElement.reportValidity();
        }
      });
    }

    this.isDisableSaveButton = !allFieldsValid; // Disable button if any field is missing
    return !allFieldsValid; // Return validation status
  }

  @track isRecurDateDisabled = false;
  handleRecurChange(event) {
    const maxValues = {
      Day: 15,
      Week: 12,
      Month: 3
    };

    this.RecurValue = event.target.value;
    this.monthOfDay = 0;
    this.recurEndDate = "";
    this.recurEndDateFormattedDate = "";

    switch (event.target.value) {
      case "Daily":
        this.RecurLabel = "Day";
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = false;
        this.isRecurDateDisabled = false;
        break;
      case "Fortnightly":
        this.RecurLabel = "Fortnight";
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = false;
        this.isRecurDateDisabled = false;
        break;

      case "Weekly":
        this.RecurLabel = "Week";
        this.isRecurWeekFlag = true;
        this.isRecurmontlyFlag = false;
        this.isRecurDateDisabled = true;
        break;
      case "Monthly":
        this.RecurLabel = "Month";
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = true;
        this.isRecurDateDisabled = true;
    }
    if (maxValues[this.RecurLabel]) {
      this.recurEveryOptions = this.generateOptions(maxValues[this.RecurLabel]);
      // console.log('recurEveryoptions '+JSON.stringify( this.recurEveryOptions))
    }
    this.isDisableSaveButton = this.validateRecurringOptions();
    this.isDisableSaveButton = true;
  }

  handleCheckboxChange(event) {
    const day = event.target.name; // Get the name of the checkbox (day)
    const isChecked = event.target.checked; // Check if the checkbox is selected
    this.recurEndDate = null;
    this.recurEndDateFormattedDate = "";
    this.isRecurDateDisabled = false;

    if (isChecked) {
      // Add the day if it's not already in the list
      if (!this.selectedDays.includes(day)) {
        this.selectedDays.push(day);
      }
    } else {
      // Remove the day from the list if it's unchecked
      this.selectedDays = this.selectedDays.filter((item) => item !== day);
    }

    console.log("Selected Days:", JSON.stringify(this.selectedDays)); // Log selected days
    if (
      this.AddShiftRecurringCheckboxValue &&
      this.recurEveryValue &&
      this.recurEndDate
    ) {
    }
  }

  async handleAddShiftTimeData(event) {
    this.isDisableSaveButton = false;
    const timeType = event.target.dataset.timetype;
    const childData = event.detail;
    // console.log('childData '+JSON.stringify(childData))
    //console.log('date types1 '+event.currentTarget.dataset.timetype);
    // console.log('date types2 '+event.currentTarget.dataset.ampm)
    this.addShiftData[event.currentTarget.dataset.timetype] =
      childData.twentyFourHourFormat;
    this.addShiftData[event.currentTarget.dataset.ampm] = childData.displaytime;
    this.addShiftData.AddShiftDuration = this.getDuration(
      this.addShiftData.AddShiftStartDate,
      this.addShiftData.AddShiftStartTime,
      this.addShiftData.AddShiftEndTime,
      this.addShiftData.AddShiftEndTimeAMPM,
      this.addShiftData.AddShiftType
    ).duration;
    console.log("MAX DURATION  IN onchange ==> " + this.addshiftMaxDuration);
    console.log(
      "this.addShiftData.AddShiftDuration ==>  " +
        this.addShiftData.AddShiftDuration
    );
   

   

    this.addShiftData.AddShiftBreak = this.getDuration(
      this.addShiftData.AddShiftStartDate,
      this.addShiftData.AddShiftStartTime,
      this.addShiftData.AddShiftEndTime,
      this.addShiftData.AddShiftEndTimeAMPM,
      this.addShiftData.AddShiftType
    ).breakTime;
    console.log("timeType >>", timeType);
    console.log("this.rateRows.length >>", this.rateRows.length);
    console.log(
      "this.addShiftData.AddShiftType >>",
      this.addShiftData.AddShiftType
    );
    if (this.addShiftData.AddShiftType != "Custom" && this.splitShift != true) {
      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
        billablehours: this.getFinalDuration(
          this.addShiftData.AddShiftDuration,
          this.addShiftData.AddShiftBreak == 30 ? 0.5 : 0,
          row.staffPaidBreak
        ),
        breakTime: this.addShiftData.AddShiftBreak
      }));
    }
     this.dispalyAmPMFormat();

     if (
      this.addShiftData.AddShiftType != "Sleepover Shift" &&
      this.addShiftData.AddShiftDuration > this.addshiftMaxDuration && this.addshiftMaxDuration  !=0
    ) {
      this.confirMationMessage(
        "Error",
        "This shift exceeds the maximum allowed duration of " +
          this.addshiftMaxDuration +
          " hours. Please shorten the shift or contact your Facility Admin to override this restriction.",
        "Error"
      );
      return;
    }
    if (this.addShiftData.AddShiftType === "Custom") {
      const { enrichedSegments, updatedServices } =
        await this.prepareAndValidateCustomShifts();
      //  console.log("✅ Enriched Segments:", JSON.stringify(enrichedSegments));
      //  console.log("✅ Updated Services:", JSON.stringify(updatedServices));
    }
    if (this.splitShift == true) {
      console.log(" in split shift validations ");
      const isValid = await this.validateSplitShiftsSegments();
      if (!isValid) {
        return; // stop further processing if validation failed
      }
    }

    
    // console.log('Add shift data:', JSON.stringify(this.addShiftData));
    // this.checkFatigue();
    const isOverlapping = await this.getOverLappingdata(
      this.addShiftData.AddShiftStaffValue
    );
    if (isOverlapping) {
      return; // ✅ stop execution if overlapping detected
    }
    let avaliableId = null;
    const isValid = await this.checkShiftSetHours(
      avaliableId,
      this.addShiftData.AddShiftStaffValue
    );
    if (!isValid) {
      return; // 🚫 stop execution
    }
  }

  /*  addressInputChange(event) {
    this.address.street = event.detail.street;
    this.address.citySuburb = event.detail.city;
    this.address.postalcode = event.detail.postalCode;
    this.address.provinceState = event.detail.province;
    this.address.country = event.detail.country;
    //this.fetchGeocode();
  } */

  getDuration(
    startDateString,
    startTimeString,
    endTimeString,
    endTimeAMPM,
    shiftType
  ) {
    // Validate input parameters
    if (
      !startDateString ||
      !startTimeString ||
      !endTimeString ||
      !endTimeAMPM ||
      !shiftType
    ) {
      return {
        duration: 0,
        breakTime: 0
      };
    }

    const dateParts = startDateString.split("-");
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months are zero-indexed
    const day = parseInt(dateParts[2], 10);

    const startParts = startTimeString.split(":");
    const startDate = new Date(
      year,
      month,
      day,
      parseInt(startParts[0], 10),
      parseInt(startParts[1], 10)
    );

    console.log(" start Date parts " + startParts);

    const endParts = endTimeString.split(":");
    let endDate = new Date(
      year,
      month,
      day,
      parseInt(endParts[0], 10),
      parseInt(endParts[1], 10)
    );

    console.log(" endParts date  parts " + endParts);

    const endTimeSplit = endTimeAMPM.split(" ");
    if (
      endTimeSplit[1] === "AM" &&
      (shiftType === "Night" ||
        shiftType === "Sleepover Shift" ||
        shiftType === "Custom")
    ) {
      endDate.setDate(endDate.getDate() + 1); // Adjust for overnight shifts
    }
    if (endTimeSplit[1] === "PM" && shiftType === "Custom") {
      const startMinutes =
        parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
      const endMinutes =
        parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

      if (startMinutes > endMinutes) {
        endDate.setDate(endDate.getDate() + 1); // Adjust for overnight shift
      }
    }
    //console.log(' sTART DATE '+startDate);
    // console.log(' END DATE '+endDate);
    const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    this.addShiftData.AddShiftEndDate = formattedEndDate;

    console.log("add Shift End Date  " + this.addShiftData.AddShiftEndDate);
    const durationInMilliseconds = endDate - startDate;
    const durationInMinutes = durationInMilliseconds / (1000 * 60);

    let hours = (durationInMinutes / 60).toFixed(2); // Calculate hours
    let breakTime = 0;

    if (hours >= 5) {
      breakTime = 30; // Apply 30-minute break
      const breaksInHours = (breakTime / 60).toFixed(2);
      // hours -= breaksInHours;
    }
    console.log('hours in onchnage==>'+hours);
     console.log('breakTime in onchnage==>'+breakTime);

    // Return the result as a JSON object
    return {
      duration: parseFloat(hours), // Ensure the duration is a number
      breakTime: breakTime
    };
  }


  EmptyAddressFields() {
    this.address.street = "";
    this.address.citySuburb = "";
    this.address.postalcode = "";
    this.address.provinceState = "";
    this.address.country = "";
    this.address.latitude = "";
    this.address.longitude = "";
  }

  get addressComponentStyle() {
    return this.addNewAddressCheckBox ? "" : "display: none;";
  }

  AdreesCheckboxChange(event) {
    const selectedValue = event.target.checked;
    const checkboxName = event.target.name;

    // Reset all checkboxes and address field initially
    this.facilityAddressCheckbox = false;
    this.participantAddressCheckBox = false;
    this.addNewAddressCheckBox = false;

    if (checkboxName === "facilityAddressCheckbox") {
      this.addNewAddressCheckBox = false;
      this.participantAddressCheckBox = false;
      if (!this.addShiftData.AddShiftFacilityValue) {
        this.confirMationMessage(
          "Error",
          "Please select " + this.facilityPreferredName,
          "Error"
        );
        this.isDisableSaveButton = true;
        this.facilityAddressCheckbox = false;
        this.addShiftData.AddShiftParticipantAddressCheckbox = false;
      } else {
        this.facilityAddressCheckbox = selectedValue;
        this.addShiftData.AddShiftParticipantAddressCheckbox = false;
        this.addShiftData.AddShiftEnterOtherLocation = false;
        this.fetchFacilityAddressAndGeocode();
        this.isDisableSaveButton = false;
      }
    } else if (checkboxName === "participantAddressCheckBox") {
      /*   console.log("service participnat " + this.serviceParticipant); */

    //  console.log(' participant address change==>'+this.activeRowIndex);
      this.facilityAddressCheckbox = false;
      this.addNewAddressCheckBox = false;
      this.participantAddressCheckBox = selectedValue;
      this.addShiftData.AddShiftEnterOtherLocation = true;
      this.addShiftData.AddShiftParticipantAddressCheckbox = true;
      this.isDisableSaveButton = true;
      console.log(' this.AddShiftAndServices.length in edit '+this.AddShiftAndServices.length);
       if (this.isEditShiftScreenFlag == true &&  this.AddShiftAndServices.length ==1) {
      console.log(' this.AddShiftAndServices.length in edit inside if ==> '+this.AddShiftAndServices.length);
         this.handleParticipantAddressSelection(0);
       }else if ((this.isEditShiftScreenFlag == true &&  this.AddShiftAndServices.length >1)){
          console.log('Checking participant names across multiple services...');

          // collect all participant names
          let participantValues = this.AddShiftAndServices.map(item => item.participant);

          // get the first participant name as reference
          let commonParticipant = participantValues[0];
          let allSame = participantValues.every(value => value === commonParticipant);

          if (!allSame) {
              // show warning message
              this.confirMationMessage(
                  'Warning',
                  'Multiple '+ this.participantPreferredName +' found. Please Choose Facility or New Address.',
                  'warning'
              );
              return; // stop further processing
          }

          // all rows have the same participant
        
          console.log('All rows have same participant:', commonParticipant);
          this.handleParticipantAddressSelectionMulti(commonParticipant);
        
       } else if(this.isEditShiftScreenFlag == false){
            this.handleParticipantAddressSelection(this.activeRowIndex);
       }
     
    } else {
      // addNewAddressCheckBox selected
      this.addNewAddressCheckBox = selectedValue;
      this.addShiftData.AddShiftEnterOtherLocation = selectedValue;
      this.addShiftData.AddShiftParticipantAddressCheckbox = false;
      this.facilityAddressCheckbox = false;
      this.participantAddressCheckBox = false;
      this.EmptyAddressFields();
      this.isDisableSaveButton = false;
    }
  }


   handleDescriptionChange(event) {
    this.checkListDescription = event.target.value;
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
  handlePublishShift(event) {
    console.log("isHoloday " + event.currentTarget.dataset.isholiday);
    this.rosterPublishDateAndRole = {
      rosterPublishDate: event.currentTarget.dataset.date,
      rosterPublishRole: event.currentTarget.dataset.role,
      isHoliday: event.currentTarget.dataset.isholiday
    };
    this.finalSelectedFacilities = [];

    console.log(" selected facilities " + JSON.stringify(this.facilityValue));
    console.log(" ORG facilities " + JSON.stringify(this.facilityOptions));
    this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
      this.facilityValue.includes(rec.value)
    );
    console.log(
      " selected facilities " + JSON.stringify(this.finalSelectedFacilities)
    );
    if (this.finalSelectedFacilities.length === 0) {
      this.confirMationMessage(
        "Error",
        "Please select at least one" +
          this.facilityPreferredName +
          " to create the shift.",
        "Error"
      );
      return;
    }
    this.isPublishShift = true;
    this.isStaffView = false;
    this.isCalenderShiftView = false;
  }
  handleUnderOverRoasting() {
    this.underOverRoastingFlag = true;
    /* this.isPublishShift=false;
    this.isStaffView=false;
    this.isCalenderShiftView=false; */
    this.shiftReportsFlag = false;
    this.isHome = false;
  }
  handleRosterSettings() {
    this.underOverRoastingFlag = false;
    this.isPublishShift = false;
    this.isStaffView = false;
    this.isCalenderShiftView = false;
    this.isParticipanTViewEnable = false;
    this.rosterSettingsFalg = true;
    this.shiftReportsFlag = false;
  }

  handleOverRosterBack(event) {
    this.underOverRoastingFlag = false;
    this.shiftReportsFlag = false;
    this.isHome = true;
    this.isAutoschedule = "";
  }
  handlerosterInvoiceBack() {
    this.childRosterInvoices = false;
    this.shiftReportsFlag = false;
    this.isHome = true;
    this.isStaffView = true;
    this.isAutoschedule = "";
  }
  handleShiftReports() {
    this.shiftReportsFlag = true;
    /* this.isPublishShift=false;
    this.isStaffView=false;
    this.isCalenderShiftView=false; */
    this.underOverRoastingFlag = false;
    this.rosterSettingsFalg = false;
    this.isHome = false;
  }
  handleShiftReportBack(event) {
    this.underOverRoastingFlag = false;
    this.shiftReportsFlag = false;
    this.isHome = true;
    this.isAutoschedule = "";
  }
  handlePublishBack(event) {
    this.isPublishShift = false;
    this.isStaffView = true;
    this.isCalenderShiftView = false;
    this.tableFlagFromParent = false;
    this.childRosterInvoices = false;
    this.underOverRoastingFlag = false;
    this.shiftReportsFlag = false;
    this.rosterSettingsFalg = false;
    if (this.loggedInUserType == "NDIS Org Admin") {
      refreshApex(this.wiredFacilityResult);
    }
    console.log("this.isOpen >>", this.isOpen);
    this.isOpen = false;
    console.log("this.isOpen >>", this.isOpen);

    this.loadStaffData();
  }
  handleUnAllocated(event) {
    console.log("unallocated " + event.currentTarget.dataset.unallocated);
    if (parseInt(event.currentTarget.dataset.unallocated) > 0) {
      this.rosterPublishDateAndRole = {
        rosterPublishDate: event.currentTarget.dataset.date,
        rosterPublishRole: event.currentTarget.dataset.role,
        isHoliday: event.currentTarget.dataset.isholiday
      };
      this.tableFlagFromParent = true;
      this.isPublishShift = true;
      this.isStaffView = false;
      this.isCalenderShiftView = false;
    } else {
      this.confirMationMessage(
        "Error",
        "Quantity must be equal to or greater than the original value.",
        "Error"
      );
    }
  }

  @track ShiftwithStafftoApexId = null;
  
  async handleEditShiftScreen(event) {
    event.stopPropagation();
    console.log("shift staff id " + event.currentTarget.dataset.shiftstaffid);
    this.shiftStaffId = event.currentTarget.dataset.shiftstaffid;
    this.finalSelectedFacilities = [];
    this.isShowMap = false;
    this.geolabel = "Shift Location";

    // console.log(" selected facilities " + JSON.stringify(this.facilityValue));
    // console.log(" ORG facilities " + JSON.stringify(this.facilityOptions));
    this.finalSelectedFacilities = this.facilityOptions;
    this.isHome = false;
    this.isStaffView = false;
    this.isCalenderShiftView = true;
    this.isPublishShift = false;
    this.isEditShiftScreenFlag = true;
    this.AddShiftRecurringCheckboxValue = false;
    this.isOriginalStaffChanged = false;
    this.deletedChecklist = [];
     this.originalServiceAmounts={};
    this.isDisableSaveButton = false;
    this.disableServiceSection = false;
    this.postInsertOperation == false;
    this.isTooltip = false;
    this.isModalOpen = false;
    this.SplitShiftVisible = true;
    this.headingLabel = "Edit Shift";
    this.createShiftlabel = "Update Shift";
    this.isDisableParticipantCheckBox = true;
    this.cutsomShiftTemplate = false;
    this.ServiceTypeIdInParticipant = "";
    this.emptyFields();
    this.isCreateShiftButton = false;
    this.participantAddressCheckBox = false;
    this.addNewAddressCheckBox = false;
    this.isSingleClassForServiceCreation = false;
    this.AddShiftIncludePartcipants = false;
    this.isSplitCheckbox = false;
    this.RecurringWithIncludeAndNewParticipants = false;
    this.isParticipantServiceCreated = false;
    this.disableNotification=true;
     this.rowShiftTypeEnable = false;
    this.rowShiftTimingsEnable = false;
    getAddShiftDataById({ shiftId: this.shiftStaffId }).then(async (result) => {
      //  console.log("shift data " + JSON.stringify(result));
      this.ShiftwithStafftoApexId = result.shiftwithstaffdata.Id;
      console.log(
        "this.ShiftwithStafftoApexId >>" + this.ShiftwithStafftoApexId
      );
      this.addShiftData = {
        AddShiftId: result.shiftwithstaffdata.Add_Shift__r.Id,
        AddShiftStartDate: result.shiftwithstaffdata.Start_Date__c
          ? result.shiftwithstaffdata.Start_Date__c
          : result.shiftwithstaffdata.Add_Shift__r.Start_Date__c,
        AddShiftStaffValue: result.shiftwithstaffdata.Staff__c,
        AddShiftFacilityValue:
          result.shiftwithstaffdata.Add_Shift__r.Facility__c,
        AddShiftRole: result.shiftwithstaffdata.Add_Shift__r.Role__c,
        AddShiftType: result.shiftwithstaffdata.Shift_Category__c
          ? result.shiftwithstaffdata.Shift_Category__c
          : result.shiftwithstaffdata.Add_Shift__r.Shift_Type__c,
        AddShiftBreak: result.shiftwithstaffdata.Add_Shift__r.Break__c,
        AddShiftDuration: result.shiftwithstaffdata.Add_Shift__r.Duration__c,
        AddShiftStartTime: this.convertTo24HourFormat(
          result.shiftwithstaffdata.Start_time_Formula__c
        ),
        AddShiftStartTimeAMPM:
          result.shiftwithstaffdata.Start_time_Formula__c.toUpperCase(),
        AddShiftEndTime: this.convertTo24HourFormat(
          result.shiftwithstaffdata.End_time_formula__c
        ),
        AddShiftEndTimeAMPM:
          result.shiftwithstaffdata.End_time_formula__c.toUpperCase(),
        AddShiftnotification: result.shiftwithstaffdata.Send_Notification__c,
        AddShiftStaffHourlyRate:
          result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c,
        AddShiftQuantity: result.shiftwithstaffdata.Add_Shift__r.Quantity__c,
        AddShiftNotes: result.shiftwithstaffdata.SignIn_Notes__c
          ? result.shiftwithstaffdata.SignIn_Notes__c
          : "",
        AddShiftEOI: result.shiftwithstaffdata.Add_Shift__r.Is_EOI__c,
        AddShiftHoliday:
          result.shiftwithstaffdata.Public_holiday__c == true ||
          result.shiftwithstaffdata.Recur_Holiday__c == true
            ? true
            : false,
        AddShiftEnterOtherLocation:
          result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c,
        AddShiftStatus: result.shiftwithstaffdata.Status__c,
        AddShiftParticipantAddressCheckbox:
          result.shiftwithstaffdata.Add_Shift__r
            .Participant_Address_checkbox__c,
        AddShiftEndDate: result.shiftwithstaffdata.Shift_End_Date__c
          ? result.shiftwithstaffdata.Shift_End_Date__c
          : result.shiftwithstaffdata.Add_Shift__r.End_Date__c,
        AddShiftTypeName: result.shiftwithstaffdata.Shift_Name__c
          ? result.shiftwithstaffdata.Shift_Name__c
          : result.shiftwithstaffdata.Add_Shift__r.Shift_Name__c
      };

      // 🔄 Log before calling dispalyAmPMFormat
      console.log("🔄 Calling dispalyAmPMFormat() with values →", {
        startTimeAMPM: this.addShiftData.AddShiftStartTimeAMPM,
        endTimeAMPM: this.addShiftData.AddShiftEndTimeAMPM,
        startTime: this.addShiftData.AddShiftStartTime,
        endTime: this.addShiftData.AddShiftEndTime
      });

      this.dispalyAmPMFormat();

      this.RolesStaffId = this.addShiftData.AddShiftStaffValue;
      this.enableTimeRounding=result.shiftwithstaffdata.Time_Rounded_Off__c;
        console.log("this.enableTimeRounding ==>" + this.enableTimeRounding);

      this.hourlrRateLabel = 
        this.addShiftData.AddShiftType == "Sleepover Shift"
          ? "Allowance"
          : "Hourly Rate";
    
    
      if (result.shiftwithstaffdata.Type_of_Address__c == "Facility") {
        this.facilityAddressCheckbox = true;
        this.addNewAddressCheckBox = false;
        this.participantAddressCheckBox = false;
      } else if (
        result.shiftwithstaffdata.Type_of_Address__c == "Participant"
      ) {
        this.facilityAddressCheckbox = false;
        this.addNewAddressCheckBox = false;
        this.participantAddressCheckBox = true;
      } else if (result.shiftwithstaffdata.Type_of_Address__c == "New") {
        this.facilityAddressCheckbox = false;
        this.addNewAddressCheckBox = true;
        this.participantAddressCheckBox = false;
      } else if (
        result.shiftwithstaffdata.Add_Shift__r
          .Participant_Address_checkbox__c == true
      ) {
        this.addNewAddressCheckBox = false;
        this.participantAddressCheckBox = true;
      } else if (
        result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c == true &&
        result.shiftwithstaffdata.Add_Shift__r
          .Participant_Address_checkbox__c == false
      ) {
        this.addNewAddressCheckBox = true;
      } else {
        this.facilityAddressCheckbox = result.shiftwithstaffdata.Add_Shift__r
          .Get_Facility__c
          ? false
          : true;
      }
 

      this.address.street = result.shiftwithstaffdata.Shift_Address__Street__s
        ? result.shiftwithstaffdata.Shift_Address__Street__s
        : result.shiftwithstaffdata.Add_Shift__r.Location__Street__s;
      this.address.citySuburb = result.shiftwithstaffdata.Shift_Address__City__s
        ? result.shiftwithstaffdata.Shift_Address__City__s
        : result.shiftwithstaffdata.Add_Shift__r.Location__City__s;
      this.address.postalcode = result.shiftwithstaffdata
        .Shift_Address__PostalCode__s
        ? result.shiftwithstaffdata.Shift_Address__PostalCode__s
        : result.shiftwithstaffdata.Add_Shift__r.Location__PostalCode__s;
      this.address.provinceState = result.shiftwithstaffdata
        .Shift_Address__StateCode__s
        ? result.shiftwithstaffdata.Shift_Address__StateCode__s
        : result.shiftwithstaffdata.Add_Shift__r.Location__StateCode__s;
      this.address.country = result.shiftwithstaffdata
        .Shift_Address__CountryCode__s
        ? result.shiftwithstaffdata.Shift_Address__CountryCode__s
        : result.shiftwithstaffdata.Add_Shift__r.Location__CountryCode__s;
      this.address.latitude = result.shiftwithstaffdata
        .Shift_Address__Latitude__s
        ? result.shiftwithstaffdata.Shift_Address__Latitude__s
        : result.shiftwithstaffdata.Add_Shift__r.Location__Latitude__s;
      this.address.longitude = result.shiftwithstaffdata
        .Shift_Address__Longitude__s
        ? result.shiftwithstaffdata.Shift_Address__Longitude__s
        : result.shiftwithstaffdata.Add_Shift__r.Location__Longitude__s;

      this.AddShiftDayName =
        result.shiftwithstaffdata.Add_Shift__r.Day_Name__c == "Saturday"
          ? "Day 5"
          : result.shiftwithstaffdata.Add_Shift__r.Day_Name__c == "Sunday"
            ? "Day 6"
            : result.shiftwithstaffdata.Add_Shift__r.Day_Name__c;
      this.finalAddShiftData.shiftaddress = this.address;
      this.finalAddShiftData.shiftDetails = this.addShiftData;
      this.jsonData2 = [
        {
          coords: {
            latitude: this.address.latitude,
            longitude: this.address.longitude
          }
        }
      ];
      this.setLatitudeLongitudeMarkersOnly();

      console.log(
        "finalAddShiftData  in EDIT ===> " +
          JSON.stringify(this.finalAddShiftData)
      );
      if (this.addShiftData.AddShiftFacilityValue) {
        this.processShifts(this.addShiftData.AddShiftFacilityValue);
      }

      const selectedFacility = this.finalSelectedFacilities.find(
        (f) => f.value === this.addShiftData.AddShiftFacilityValue
      );
      if (selectedFacility) {
        this.facilityPreferredName = selectedFacility.preferredName;
        this.participantPreferredName =
          selectedFacility.participantPreferredName;
        this.staffPreferredName = selectedFacility.staffPreferredName;
      }
      if (
        result.shiftwithstaffdata.Status__c == "InProgress" ||
        result.shiftwithstaffdata.Status__c == "Completed"
      ) {
        this.showLocation = true;
        this.disableServiceSection = true;
        this.disablePostInsertButtons = true;
        this.isDisableParticipantCheckBox = true;
        this.isDisableSaveButton = true;
        this.disableTimeButton = true;
      } else {
        this.showLocation = false;
        this.isDisableSaveButton = false;
        this.disableTimeButton = false;
      }
      if (result.shiftwithstaffdata.Split_Shifts__c == true) {
        this.disableServiceSection = true;
      }
      let cheklist = JSON.parse(result.checklistdata);
      console.log("check list rows " + JSON.stringify(cheklist));
      this.ChekListrows = cheklist.map((row, index) => {
        return {
          index: index + 1,
          id: Date.now() + index,
          checkListId: row.Id,
          description: row.Description__c,
          mandatory: row.Mandatory__c,
          addShift: row.Add_Shift__c,
          isCreatedFromStatic: row.Created_By_Static_Data__c,
          ShiftWithStaff__c: row.ShiftWithStaff__c
        };
      });
     // this.splitShift = result.shiftwithstaffdata.Split_Shifts__c;
      this.hideLocation = false;
      this.RecurValue = "";
      this.recurEveryValue = 0;
      this.selectedDays = [];
      this.monthOfDay = 0;
      this.recurOccurencesValue = 0;
      this.riskIndex = "";
      this.isRecurWeekFlag = false;
      this.isRecurmontlyFlag = false;
      this.showMuteIcon = false;
      this.showClearIcon = false;
      this.recurTemplate = false;
      const shiftType = result.shiftwithstaffdata.Add_Shift__r?.Shift_Type__c;
      if (shiftType == "Custom"     ) {
        this.rowShiftTypeEnable = true;
        this.hourlyRateEditable=true;
        this.rowShiftTimingsEnable = true;
        this.disableSplitShift=true;
        this.diableGroupShift=true;
      }
      if(result.shiftwithstaffdata.New_Split_Shift__c || result.shiftwithstaffdata.Split_Shifts__c){
          this.disableSplitShift=true;
      } 
       
     
      this.hourlyRateEditable = this.addShiftData.AddShiftType == "Sleepover Shift";
      const rows = [];
      const shift = result.shiftwithstaffdata;

      //   console.log("shift in edit", shift);

      const buildRow = (
        label,
        startMs,
        endMs,
        rate,
        duration,
        index,
        sourceLabel,
        strtDateOnly,
        isNextDay,
        id
      ) => {
        const startTime24 = this.formatMillisecondsToTime(startMs);
        const endTime24 = this.formatMillisecondsToTime(endMs);
        const startAmPm = this.convertToAmPmObject(startTime24);
        const endAmPm = this.convertToAmPmObject(endTime24);
        const row = {
          id: id,
          starttime: startTime24 ? `${startTime24}:00Z` : "00:00:00Z",
          endtime: endTime24 ? `${endTime24}:00Z` : "00:00:00Z",
          startAmPm: startAmPm.displayTime,
          endAmPm: endAmPm.displayTime,
          hourlyrate: rate?.toString() || "",
          shifttype: label,
          duration: duration || 0,
          index: index,
          sourceLabel: sourceLabel,
          rateLabel: label == "Sleepover Shift" ? "Allowance" : "Rate",
          startTimeselectedHour: startAmPm.selectedHour,
          startTimeselectedMinute: startAmPm.selectedMinute,
          startTimeselectedAmPm: startAmPm.selectedAmPm.toUpperCase(),
          startTimdisplayTime: startAmPm.displayTime,
          endTimeselectedHour: endAmPm.selectedHour,
          endTimeselectedMinute: endAmPm.selectedMinute,
          endTimeselectedAmPm: endAmPm.selectedAmPm.toUpperCase(),
          endTimeDdisplayTime: endAmPm.displayTime,
          startDateOnly: strtDateOnly,
          isNextDayStart: isNextDay
        };

        //  console.log("✅ Final row object built:", row);
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
        sourceLabel,
        strtDateOnly,
        isNextDay,
        id
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
              sourceLabel,
              strtDateOnly,
              isNextDay,
              id
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
        "morningShift",
        shift.Long_Morning_Start_Date_One__c,
        shift.Is_long_Morning_Next_Day_Start__c,
        shift.long_Morining_Service_Ref_Id__c
      );
      tryBuildRow(
        "Afternoon",
        shift.Is_Long_Afternoon__c,
        shift.Long_Afternoon_Start_Time__c,
        shift.Long_Afternoon_End_Time__c,
        shift.Long_Afternoon_Hourly_Rate__c,
        shift.Long_Afternoon_Shift_Duartion__c,
        shift.Long_Afternoon_Index__c,
        "afternoonShift",
        shift.Long_Afternoon_Start_Date_One__c,
        shift.Is_Long_Afternoon_Next_Day_Start__c,
        shift.long_Afternooon_Service_Ref_Id__c
      );
      tryBuildRow(
        "Night",
        shift.Is_Long_Night_Shift__c,
        shift.Long_Night_Start_Time__c,
        shift.Long_Night_End_Time__c,
        shift.Long_Night_Hourly_Rate__c,
        shift.Long_Night_Shift_Duartion__c,
        shift.Long_Night_Index__c,
        "nightShift",
        shift.Long_Night_Start_Date__c,
        shift.Is_Long_Night_Start_Next_Day__c,
        shift.long_Night_Service_Ref_Id__c
      );
      tryBuildRow(
        "Sleepover Shift",
        shift.Is_Long_SleepOver__c,
        shift.Long_Sleepover_Start_Time__c,
        shift.Long_Sleepover_End_Time__c,
        shift.Long_Sleepover_Allowance__c,
        shift.Long_Sleepover_Duartion__c,
        shift.Long_Sleepover_index__c,
        "sleepOverShift",
        shift.Long_Sleepover_Start_Date__c,
        shift.Is_Long_Sleepover_Next_Day_Start__c,
        shift.long_Sleepover_Service_Ref_Id__c
      );
      tryBuildRow(
        "Morning",
        shift.Is_long_Morning_Shift_two__c,
        shift.Long_Morning_Start_Time_Two__c,
        shift.Long_Morning_End_Time_Two__c,
        shift.Long_Morning_Rate_Two__c,
        shift.Long_Morning_Duartion_Two__c,
        shift.Long_Morning_Index_Two__c,
        "morningShiftTwo",
        shift.Long_Morning_Start_Date_Two__c,
        shift.Is_Long_Morning_Next_Day_Start_Two__c,
        shift.long_Morning_2_Service_Ref_Id__c
      );
      tryBuildRow(
        "Afternoon",
        shift.Is_Long_afternoon_shift_two__c,
        shift.Long_Afternoon_Start_Time_two__c,
        shift.Long_afternoon_End_Time_Two__c,
        shift.Long_Afternoon_Rate_Two__c,
        shift.Long_Afternoon_Duration_Two__c,
        shift.Long_Afternoon_Index_Two__c,
        "afternoonshiftTwo",
        shift.Long_Afternoon_Start_Date_Two__c,
        shift.Is_Long_Afternoon_Next_Day_Start_Two__c,
        shift.long_Afternooon_Two_Service_Ref_Id__c
      );

      //   this.IsLongShift = rows.length >= 1;

      rows.sort((a, b) => a.index - b.index);
      const rowsById = rows.reduce((acc, row) => {
        acc[row.id] = row;
        return acc;
      }, {});

      console.log("this.rateRows: in final edit", JSON.stringify(rowsById));

      await Promise.all([
        refreshApex(this.wiredServicesResult),
        this.fetchStaffRoles(),
        this.staffSlistOnSelection(),
        this.handleLinkParticipants()
      ]);

      // 🔹 Main method
      //  this.AddShiftAndServices = [this.initRow()];
      if (shiftType === "Custom") {
        console.log("🔄 Processing CUSTOM shift type");

        // Form array of rows based on rowsById count instead of servicesList
        const rowCount = Object.keys(rowsById).length;
        console.log("📊 Forming", rowCount, "rows based on rowsById count");

        if (rowCount > 0) {
          this.isIncludeParticipants =
            this.servicesList && this.servicesList.length > 0;
          console.log(
            "📋 Setting isIncludeParticipants to:",
            this.isIncludeParticipants
          );

          this.AddShiftAndServices = await this.buildCustomShiftServices(
            rowsById,
            result
          );
          console.log(
            "🏗️  Built Custom Shift Services:",
            this.AddShiftAndServices.length,
            "rows created"
          );
          console.log(
            "AddShiftAndServices in edit ==>" +
              JSON.stringify(this.AddShiftAndServices)
          );
        } else {
          console.log("⚠️  No shift rows found for Custom shift");
          let row = this.initRow(); // Create empty row
          this.AddShiftAndServices = [row];
          this.isIncludeParticipants = false;
          console.log(
            "📋 Empty row created, isIncludeParticipants set to:",
            this.isIncludeParticipants
          );
        }

        console.log("🔢 Sorting AddShiftAndServices by shift index...");
        this.AddShiftAndServices.sort((a, b) => {
          const indexA = a.index ?? Number.MAX_SAFE_INTEGER;
          const indexB = b.index ?? Number.MAX_SAFE_INTEGER;

          console.log(
            `📊 Sorting - Row A Index: ${indexA}, Row B Index: ${indexB}`
          );

          return indexA - indexB;
        });
      } else {
        if (this.servicesList && this.servicesList.length > 0) {
          this.isIncludeParticipants = true;
          this.AddShiftAndServices =
            await this.buildStandardShiftServices(result);
          this.isDisableParticipantCheckBox = false;
        } else {
          // 🔹 RESULT PASSED HERE TOO
          let row = this.populateRowCommon(this.initRow(), result);
          this.AddShiftAndServices = [row];
          this.isIncludeParticipants = false;
            console.log('this.AddShiftAndServices in edit  ==>'+JSON.stringify(this.AddShiftAndServices));
        }
      }
    });
  }

  populateRowCommon(row, result) {
    console.log("result in populateRowCommon => ");
    row.staff = result.shiftwithstaffdata.Staff__c;
    row.stafflabel = result.shiftwithstaffdata.Staff__r.NameToDisplay__c;
    row.hourlyrate = result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c || 0;
    row.shiftWithStaffId = this.ShiftwithStafftoApexId;
    row.billablehours = result.shiftwithstaffdata.Shift_Calculated_Duration__c
      ? result.shiftwithstaffdata.Shift_Calculated_Duration__c
      : result.shiftwithstaffdata.Add_Shift__r.Duration__c;

    row.startdate = result.shiftwithstaffdata.Start_Date__c || null;
    row.enddate = result.shiftwithstaffdata.Shift_End_Date__c || null;
    row.address = this.address;
    row.refId=result.shiftwithstaffdata.RefId__c;
    row.recurring =result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c;
    row.splitShiftRefId=result.shiftwithstaffdata.Split_Shift_RefId__c?result.shiftwithstaffdata.Split_Shift_RefId__c:null;
    row.splitShifts=result.shiftwithstaffdata.New_Split_Shift__c || result.shiftwithstaffdata.Split_Shifts__c;

    const startTime24 = this.formatMillisecondsToTime(
      result.shiftwithstaffdata.Shift_Start_Time__c
    );
    const endTime24 = this.formatMillisecondsToTime(
      result.shiftwithstaffdata.Shift_End_Time__c
    );

    const startAmPm = this.convertToAmPmObject(startTime24);
    const endAmPm = this.convertToAmPmObject(endTime24);

    row.starttime = startTime24 ? `${startTime24}:00Z` : "00:00:00Z" || null;
    row.endtime = endTime24 ? `${endTime24}:00Z` : "00:00:00Z" || null;
    row.starttimeAmPm=startAmPm.displayTime;
    row.endtimeAmPm=endAmPm.displayTime;
    row.startTimeSelectedHour = startAmPm.selectedHour;
    row.startTimeSelectedMinute = startAmPm.selectedMinute;
    row.startTimeSelectedAmPm = startAmPm.selectedAmPm.toUpperCase();
    row.startTimeDisplayTime = startAmPm.displayTime;

    row.endTimeSelectedHour = endAmPm.selectedHour;
    row.endTimeSelectedMinute = endAmPm.selectedMinute;
    row.endTimeSelectedAmPm = endAmPm.selectedAmPm.toUpperCase();
    row.endTimeDisplayTime = endAmPm.displayTime;

    row.strtDisableTimeButton = false;
    row.endDisableTimeButton = false;
    row.rowOnchangeOccured = false;
    


    return row;
  }

  // 🔹 NEW HELPER METHODS THAT ALSO RECEIVE result
  async buildCustomShiftServices(rowsById, result) {
    console.log("🔨 Building Custom Shift Services from rowsById...");
    console.log(
      "📊 rowsById contains:",
      Object.keys(rowsById).length,
      "shift rows"
    );

    // Create array from rowsById values and process each shift row
    const shiftRows = Object.values(rowsById);

    return await Promise.all(
      shiftRows.map(async (shiftRow, index) => {
        console.log(
          `\n🔧 Processing shift row ${index + 1}/${shiftRows.length}:`,
          shiftRow.id,
          shiftRow.shifttype,
          shiftRow.hourlyrate
        );

        // Create row from shift data instead of populateRowCommon
        let row = this.initRow();

        // Populate with shift row data
        Object.assign(row, {
          customshiftlabel: shiftRow.shifttype,
          shifttype: shiftRow.shifttype,
          starttime: shiftRow.starttime,
          endtime: shiftRow.endtime,
          startAmPm: shiftRow.startAmPm,
          endAmPm: shiftRow.endAmPm,
          hourlyrate: shiftRow.hourlyrate,
          duration: shiftRow.duration,
          index: shiftRow.index,
          sourceLabel: shiftRow.sourceLabel,
          rateLabel: shiftRow.rateLabel,
          startTimeSelectedHour: shiftRow.startTimeselectedHour,
          startTimeSelectedMinute: shiftRow.startTimeselectedMinute,
          startTimeSelectedAmPm: shiftRow.startTimeselectedAmPm,
          startTimeDisplayTime: shiftRow.startTimdisplayTime,
          endTimeSelectedHour: shiftRow.endTimeselectedHour,
          endTimeSelectedMinute: shiftRow.endTimeselectedMinute,
          endTimeSelectedAmPm: shiftRow.endTimeselectedAmPm,
          endTimeDisplayTime: shiftRow.endTimeDdisplayTime,
          startDateOnly: shiftRow.startDateOnly,
          isNextDayStart: shiftRow.isNextDayStart,
          id: shiftRow.id,
          rowOnchangeOccured: false,
          billablehours: shiftRow.duration
        });

        // Find matching service based on Custom_Shift_Reference_Id__c
        const matchingService = this.servicesList?.find(
          (service) => service.Custom_Shift_Reference_Id__c === shiftRow.id
        );

        if (matchingService) {
          console.log(
            "✅ Found matching service for shift row:",
            matchingService.Id,
            matchingService.Participant_Name__c
          );

          // Populate service-related data
          row.participant = matchingService.Client__c;
          row.participantlabel =
            matchingService.Participant_Name__c || "Select Participant";
          row.serviceId = matchingService.Id;

          console.log("📦 Loading service types and items...");
          await this.loadServiceTypesAndItems(row, matchingService);
          console.log("✅ Service types and items loaded");

          console.log("💰 Setting financial data...");
          this.setServiceFinancials(row, matchingService);
        } else {
          console.log(
            "⚠️  No matching service found for shift row ID:",
            shiftRow.id
          );
          // Keep row but mark as no participant
          row.participant = null;
          row.participantlabel = "Select Participant";
          row.serviceId = null;
        }

        // Add common data that doesn't depend on services
        row.staff = result.shiftwithstaffdata.Staff__c;
        row.stafflabel = result.shiftwithstaffdata.Staff__r.NameToDisplay__c;
        //  row.hourlyrate = result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c || 0;
        row.shiftWithStaffId = this.ShiftwithStafftoApexId;
        row.startdate = result.shiftwithstaffdata.Start_Date__c || null;
        row.enddate = result.shiftwithstaffdata.Shift_End_Date__c || null;
        row.address = this.address;
        row.billablehours = shiftRow.duration;
        row.refId=result.shiftwithstaffdata.RefId__c;
        row.recurring =result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c;

        console.log(`✅ Completed processing shift row ${index + 1}`);
        return row;
      })
    );
  }

  async buildStandardShiftServices(result) {
    return await Promise.all(
      this.servicesList.map(async (service) => {
        let row = this.populateRowCommon(this.initRow(), result);

        row.participant = service.Client__c;
        row.participantlabel =
          service.Participant_Name__c || "Select Participant";
        row.serviceId = service.Id;
        row.refId = service.Id;

        await this.loadServiceTypesAndItems(row, service);
        this.setServiceFinancials(row, service);

        return row;
      })
    );
  }

  // 🔹 OTHER HELPER METHODS
  async loadServiceTypesAndItems(row, service) {
    try {
      const fetchedServiceTypes = await getClientFunds({
        clientId: row.participant
      });
      const mappedTypes = fetchedServiceTypes.map((rec) => ({
        label: rec.Registration_Group__c,
        value: rec.Id,
        Plan_Type__c: rec.Plan_Type__c
      }));

      row.allservicetypes = [...mappedTypes];
      row.filteredservicetypes = [...mappedTypes];
      row.servicetype = service.Funds_Tracker__c;
      row.servicetypelabel =
        service.Funds_Tracker__r?.Registration_Group__c ||
        "Select Service Type";

      if (row.servicetype) {
        const catalogueResult = await getCatalogueData({
          serviceType: row.servicetype,
          clientId: row.participant
        });
        const mappedItems = catalogueResult.catalogueData.map((rec) => {
            let amountVal, nameVal;

            // Apply same condition logic as in your previous block
            if (
              this.otherThanNdis === true ||
              (this.otherThanNdis === false &&
                catalogueResult.catalogueData[0].Name.includes("Miscellaneous"))
            ) {
              amountVal = catalogueResult.clientJunctionMapAmount[rec.Id] || 0;
              nameVal =
                catalogueResult.clientJunctionMapName[rec.Id] ||
                rec.Support_Item_Name__c;
            } else {
              amountVal = rec[catalogueResult.statesCombined] || 0;
              nameVal = rec.Support_Item_Name__c;
            }

            return {
              ...rec,
              label: nameVal,
              value: rec.Id,
              unit: amountVal
            };
          });

        

        row.allserviceitems = [...mappedItems];
        row.filteredserviceitems = [...mappedItems];
        row.serviceitem = service.Service_Type__c;
          let selectedItemLabel = "Select Service Item";

          if (service.Support_Item_Name__c) {
          // Find the matching item from mappedItems
          const matchedItem = mappedItems.find(item => item.value === service.Service_Type__c);
          if (matchedItem) {
             selectedItemLabel = matchedItem.label; // label already has name - unit format
          } else {
          // fallback: show Support_Item_Name__c and its amount (if available)
          const amountVal =
          this.otherThanNdis === true ||(this.otherThanNdis === false && catalogueResult.catalogueData[0].Name.includes("Miscellaneous"))  ? catalogueResult.clientJunctionMapAmount[service.Service_Type__c] || 0
          : catalogueResult.statesCombined
          ? service[catalogueResult.statesCombined] || 0
          : 0;

          selectedItemLabel = `${service.Support_Item_Name__c} - ${amountVal}`;
          }
          }

          row.serviceitemlabel = selectedItemLabel;
      }
    } catch (err) {
      console.error("Error preloading service types/items", err);
    }
  }

  setServiceFinancials(row, service) {
    row.unitprice = service.Edited_Unit_Price__c || 0;
    row.billablehours = service.Qty__c || 0;
    row.amount = service.Amount__c ? service.Amount__c.toFixed(2) : "0.00";
       this.originalServiceAmounts[row.serviceId] = {
          amount:  row.amount,
          serviceItem:  row.serviceitem
      };
      console.log('old amounts ',JSON.stringify( this.originalServiceAmounts));
  }

  formatMillisecondsToTime(ms) {
    // console.log(`formatMillisecondsToTime called with ms: ${ms}`);

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");

    const formattedTime = `${hh}:${mm}`;

    // console.log(`Formatted Time in function: ${formattedTime}`);

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


  validateInputs() {
    let isValid = true; // Track overall form validity

    // Define fields to validate
    let fields = [
      {
        name: "AddShiftStartDate",
        selector: ".AddShiftStartDate",
        errorMessage: "Start Date is required."
      },
      {
        name: "AddShiftStaffValue",
        selector: ".AddShiftStaffValue",
        errorMessage: "Staff is required."
      },
      {
        name: "AddShiftFacilityValue",
        selector: ".AddShiftFacilityValue",
        errorMessage: "Facility is required."
      },
      {
        name: "AddShiftRole",
        selector: ".AddShiftRole",
        errorMessage: "Role is required."
      },
      {
        name: "AddShiftType",
        selector: ".AddShiftType",
        errorMessage: "Shift Type is required."
      }
    ];

    console.log("Starting Validation...");

    fields.forEach((field) => {
      let inputElement = this.template.querySelector(field.selector);

      if (inputElement) {
        let value = inputElement.value;
        let isFieldValid = true;

        // Use switch-case for validation logic
        switch (field.name) {
          case "AddShiftStartDate":
          case "AddShiftStaffValue":
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
        //console.log(`${field.name} Validation Completed.`);
      }
    });

    // console.log("Overall Validation Status:", isValid);
    return isValid;
  }

  validateAddress() {
    let addressCmp = this.template.querySelector(".addressClass");

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

      //  console.log("Address Data:", fields);

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
            if (!value || value.trim() === "") {
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
            if (!value || value.trim() === "") {
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

      //  console.log("Address Validation Completed. isValid:", isValid);
      return isValid;
    } else {
      console.error("Error: lightning-input-address component not found.");
      return false;
    }
  }
  async handleDragStart(event) {
    let staffId = event.currentTarget.dataset.id;
    event.dataTransfer.setData("staffId", event.currentTarget.dataset.id);
    console.log("Dragging staff with ID:", staffId);

    event.dataTransfer.setData("dataParam", event.currentTarget.dataset.param);
    event.dataTransfer.setData(
      "facilityval",
      event.currentTarget.dataset.facilityval
    );
    event.dataTransfer.setData(
      "sethours",
      event.currentTarget.dataset.sethours
    );
    event.dataTransfer.setData(
      "exceedhours",
      event.currentTarget.dataset.exceedhours
    );
  }
  handleDragOver(event) {
    event.preventDefault(); // Required to allow dropping
  }
  async handleDrop(event) {
    event.preventDefault();
    let draggedItemId = event.dataTransfer.getData("staffId");
    console.log("Dropped item ID:", draggedItemId);
    let dataParam = event.dataTransfer.getData("dataParam");
    console.log("data param " + dataParam);
    if (dataParam == "draggingFromStaff") {
      let facVal = event.dataTransfer.getData("facilityval");
      console.log("sethours  " + event.dataTransfer.getData("sethours"));
      console.log("exceedhours  " + event.dataTransfer.getData("exceedhours"));

      if (
        parseFloat(event.dataTransfer.getData("exceedhours")) >
        parseFloat(event.dataTransfer.getData("sethours"))
      ) {
        this.confirMationMessage(
          "Error",
          "Set hours for the following staff is exceeded.",
          "Error"
        );
      } else {
        this.emptyFields();
        let holiday = event.currentTarget.dataset.isholiday;
        let shiftdate = event.currentTarget.dataset.weekdate;
        let role = event.currentTarget.dataset.role;
        console.log("role " + role);
        console.log("facilityval " + facVal);
        console.log("holiday " + holiday);
        this.addShiftData.AddShiftRole = role;
        this.addShiftData.AddShiftStartDate = shiftdate;
        this.addShiftData.AddShiftFacilityValue = facVal;
        this.addShiftData.AddShiftHoliday = holiday == "true" ? true : false;
        this.AddShiftDayName = event.currentTarget.dataset.weekname;
        this.addShiftData.AddShiftStaffValue = draggedItemId;
        /* await this.DocExpiryCheck(draggedItemId);
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

        this.RolesStaffId = draggedItemId;
        this.addShiftData.AddShiftType = "General";
        this.ServiceStaffValue = draggedItemId;
        this.isCalenderShiftView = true;
        this.isEditShiftScreenFlag = false;
        this.isIncludeParticipants = false;
         this.isStaffView = true;
        this.SplitShiftRows = [];

        //  this.loadStaffComboBox();
        if (this.isSplitCheckbox == true || this.serviceParticipant == null) {
          this.isDisableParticipantCheckBox = true;
        }

          this.isHome = false;
          const rate = this.getServiceStaffHourlyRate(
          this.addShiftData.AddShiftHoliday,
          this.AddShiftDayName,
          this.addShiftData.AddShiftStaffValue,
          this.addShiftData.AddShiftType
          );

          this.addShiftData.AddShiftStaffHourlyRate = rate;
          this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
            this.facilityValue.includes(rec.value)
          );

          console.log("selected facilityValue", JSON.stringify(this.facilityValue));
          console.log("ORG facilities", JSON.stringify(this.facilityOptions));
          console.log(
          "finalSelectedFacilities",
          JSON.stringify(this.finalSelectedFacilities)
          );

          // ⚠️ No facilities selected
          if (this.finalSelectedFacilities.length === 0) {
            this.confirMationMessage(
            "Error",
            "Please select at least one " +
            this.facilityPreferredName +
            " to create the shift.",
            "Error"
            );
            return;
          }
          const selectedFacility = this.finalSelectedFacilities.find(
          (f) => f.value === this.addShiftData.AddShiftFacilityValue
          );
          if (selectedFacility) {
          this.facilityPreferredName = selectedFacility.preferredName;
          this.participantPreferredName = selectedFacility.participantPreferredName;
          this.staffPreferredName = selectedFacility.staffPreferredName;
          }
          if (this.addShiftData.AddShiftFacilityValue) {
          this.addShiftData.AddShiftFacilityName =
          this.finalSelectedFacilities.find(
          (rec) => rec.value == this.addShiftData.AddShiftFacilityValue
          ).label;
          this.processShifts(this.addShiftData.AddShiftFacilityValue);
          }

        this.createCalenderShift();
        
     /*    this.fetchFacilityAddressAndGeocode();
        this.facilityAddressCheckbox = true;
        this.addNewAddressCheckBox = false;
        this.participantAddressCheckBox = false;
        this.isNewInsertOperation = true;
        this.shiftStaffId = "";
        this.servicesList = []; */
      }
    } else {
      console.log(
        "  During  shift swap staff id ==>" +
          event.currentTarget.dataset.staffid
      );
      this.droppedStaffId = event.currentTarget.dataset.staffid;

      let weekDate = event.currentTarget.dataset.weekdate;
      this.droppedShiftDate = weekDate;

      let holiday = event.currentTarget.dataset.isholiday;
      let weekName = event.currentTarget.dataset.weekname;
      let isLeave = event.currentTarget.dataset.isleave == "true";
      console.log("is leave ==> " + event.currentTarget.dataset.isleave);
      console.log("weekName ==> " + weekName);
      console.log("holiday   ==>" + holiday);
      console.log(" Dropped Shift date " + weekDate);
      this.draggingRecurShiftValue = "Only this shift";

      this.draggingShiftDate = event.dataTransfer.getData("draggingShiftDate");

      console.log(
        "  During  shift swap staff id ==>" +
          event.currentTarget.dataset.sethours
      );
      console.log(
        "  During  shift swap staff id ==>" +
          event.currentTarget.dataset.exceedhours
      );
      console.log(" shift time " + event.dataTransfer.getData("shifttime"));
      console.log(" shifttype " + event.dataTransfer.getData("shifttype"));

      let shiftType = event.dataTransfer.getData("shifttype");
      this.draggingSleepoverFalg = shiftType == "Sleepover Shift";
      this.draggingSameStaffFlag =
        event.dataTransfer.getData("draggingstaffid") == this.droppedStaffId;
      this.draggingStaffFullName = event.currentTarget.dataset.fullname;

      console.log(" this.draggingSleepoverFalg " + this.draggingSleepoverFalg);
      console.log(" this.draggingSameStaffFlag " + this.draggingSameStaffFlag);

      let timeSplits = event.dataTransfer.getData("shifttime").split("-");
      let shiftRecurStatus = event.dataTransfer.getData("recurstatus");
      this.darggingShiftRecurtempalte =
        shiftRecurStatus == "true" ? true : false;

      this.draggingStaffrefId = event.dataTransfer.getData("refid");
      this.draggingStaffShiftId = event.dataTransfer.getData("shiftId");

      this.draggingStaffRate = event.dataTransfer.getData("shiftrate");

      console.log(
        " this.draggingstaffid " + event.dataTransfer.getData("draggingstaffid")
      );

      console.log(" time splits " + JSON.stringify(timeSplits));
      if (
        parseFloat(event.currentTarget.dataset.exceedhours) >=
          parseFloat(event.currentTarget.dataset.sethours) &&
        event.dataTransfer.getData("draggingstaffid") != this.droppedStaffId
      ) {
        this.confirMationMessage(
          "Error",
          "Set hours for the following staff is exceeded.",
          "Error"
        );
        return;
      }

      /*   await this.DocExpiryCheck(this.droppedStaffId);
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
      }
 */
      if (isLeave == true) {
        this.confirMationMessage(
          "Error",
          "This staff member is on leave and cannot be reassigned.",
          "Error"
        );
      } else if (timeSplits.length > 0) {
        getOverlappingShiftsData({
          strtTimeText: timeSplits[0].toString().toLowerCase().trim(),
          endTimeText: timeSplits[1].toString().toLowerCase().trim(),
          StaffID: this.droppedStaffId,
          startdate: weekDate,
          shiftType: shiftType,
          ShiftwithStaffId: null
        }).then((result) => {
          console.log("over lapping data " + JSON.stringify(result));
          if (result.isError == true) {
            this.confirMationMessage("Error", result.reason, "Error");
            this.isShiftDragAndDrop = false;
          } else {
            this.isShiftDragAndDrop = true;
            getFatigueData({
              staffId: this.droppedStaffId,
              strtTimeText: timeSplits[0].toString().toLowerCase().trim(),
              startdate: weekDate
            })
              .then((result) => {
                holiday = holiday == "true" ? true : false;
                this.droppedStaffRate = this.getServiceStaffHourlyRate(
                  holiday,
                  weekName,
                  this.droppedStaffId,
                  shiftType
                );
                console.log(" this.droppedStaffRate " + this.droppedStaffRate);
                //this.fatigueDetected = result;
                console.log("Fatigue Status:", result);
                if (result == true) {
                  // this.confirMationMessage('Error','The selected staff already has a shift within the start and end times. Please switch to the staff view and assign the services to the particular participant.','Error');
                  this.draggingShiftFatigueCheck = true;
                } else {
                  this.draggingShiftFatigueCheck = false;
                }
              })
              .catch((error) => {
                console.error("Error fetching fatigue data:", error);
              });
          }
        });
      }
    }
  }

  getServiceStaffHourlyRate(isHoliday, dayName, staffId, shiftType) {
    const staffRate = this.StaffHourlyRates[staffId]?.staffHoulryRate;
    console.log("SHIFT TYPE  " + shiftType);
    if (!staffRate) {
      console.log(" IN FALL BACK ");
      return 0.0; // fallback if no staff data
    }
    let rate = 0;
    this.hourlrRateLabel = "Hourly Rate";
    this.hourlyrateDisable = true;

    // Sleepover Shift with special cases
    if (shiftType == "Sleepover Shift") {
      console.log(" IN SLEEP OVER  ");
      this.hourlrRateLabel = "Allowance";
      this.hourlyrateDisable = false;
      rate = staffRate.Sleepover_Allowance__c || 0;
      console.log(`(Sleepover)>>`, rate);
      return parseFloat(rate.toFixed(2));
    }

    if (isHoliday) {
      this.hourlrRateLabel = "Hourly Rate";
      this.hourlyrateDisable = true;
      return parseFloat(
        (staffRate.Public_holiday_Hourly_Rate__c || 0).toFixed(2)
      );
    }

    switch (dayName) {
      case "Day 6": // Sunday
        this.hourlrRateLabel = "Hourly Rate";
        this.hourlyrateDisable = true;
        return parseFloat((staffRate.Sunday_Hourly_Rate__c || 0).toFixed(2));

      case "Day 5": // Saturday
        this.hourlrRateLabel = "Hourly Rate";
        this.hourlyrateDisable = true;
        return parseFloat((staffRate.Saturday_Hourly_Rate__c || 0).toFixed(2));

      default:
        switch (shiftType) {
          case "General":
          case "Morning":
            this.hourlrRateLabel = "Hourly Rate";
            this.hourlyrateDisable = true;
            return parseFloat(
              (staffRate.Working_Hours_Rate__c || 0).toFixed(2)
            );
          case "Night":
            this.hourlrRateLabel = "Hourly Rate";
            this.hourlyrateDisable = true;
            return parseFloat(
              (staffRate.Night_shift_Hourly_Rate__c || 0).toFixed(2)
            );

          case "Afternoon":
            this.hourlrRateLabel = "Hourly Rate";
            this.hourlyrateDisable = true;
            return parseFloat(
              (staffRate.Afternoon_shift_Hourly_Rate__c || 0).toFixed(2)
            );

          case "Custom":
            this.hourlrRateLabel = "Hourly Rate";
            this.hourlyrateDisable = true;
            return 0.0;

          default:
            this.hourlrRateLabel = "Hourly Rate";
            this.hourlyrateDisable = true;
            return parseFloat(
              (staffRate.Working_Hours_Rate__c || 0).toFixed(2)
            );
        }
    }
  }

  handleDeleteShift(event) {
    this.isShowSpinner = true;
    // Prevent deletion if status is "In Progress"

    if (
      this.shiftDeleteCOnfirmationInfo.status === "InProgress" ||
      this.shiftDeleteCOnfirmationInfo.status === "Completed"
    ) {
      this.confirMationMessage(
        "Error",
        "Shift cannot be deleted when it is In Progress or already Completed.",
        "error"
      );
      this.shiftDeleteConfirmation = false;
      this.isShowSpinner = false;
      return;
    }
    console.log("Before this.shiftStaffId==>" + this.shiftStaffId);
    // Assign shift ID
    this.shiftStaffId = this.shiftDeleteCOnfirmationInfo.shiftID;
    console.log("this.shiftStaffId==>" + this.shiftStaffId);

    // Refresh the service list before attempting to delete
    refreshApex(this.wiredServicesResult).then(() => {
      console.log("Updated Service List:", JSON.stringify(this.servicesList));

      // Check if services exist for the shift
      if (
        this.servicesList.length > 0 &&
        this.shiftDeleteCOnfirmationInfo.status === "InProgress" &&
        this.shiftDeleteCOnfirmationInfo.status === "Completed"
      ) {
        console.log("Services exist for shift.");
        this.confirMationMessage(
          "Error",
          "Cannot delete shift. Services are still associated.",
          "error"
        );
        this.shiftDeleteConfirmation = false;
        this.isShowSpinner = false;
      } else if (this.recurredShiftsDelete == true) {
        deleterecurShifts({
          refId: this.shiftDeleteCOnfirmationInfo.refId,
          recurDate: this.shiftDeleteCOnfirmationInfo.recurStartDate
        })
          .then((result) => {
            // console.log('result '+result)
            this.confirMationMessage(
              "Success",
              "Shift deleted successfully.",
              "success"
            );
            // Refresh the service list after deletion
            this.isShowSpinner = false;
            this.refreshStaffData();
            this.shiftDeleteConfirmation = false;
            return refreshApex(this.wiredServicesResult);
          })
          .catch((error) => {
            this.confirMationMessage("Error", "Error deleting shift.", "error");
            this.shiftDeleteConfirmation = false;
            this.isShowSpinner = false;
            console.log("error " + error);
          });
      } else {
        console.log("No Services exist for shift."); // Proceed with record deletion
        deleteRecord(this.shiftDeleteCOnfirmationInfo.shiftID)
          .then(() => {
            this.confirMationMessage(
              "Success",
              "Shift deleted successfully.",
              "success"
            );
            this.isShowSpinner = false;
            // Refresh the service list after deletion
            this.refreshStaffData();
            this.shiftDeleteConfirmation = false;
            return refreshApex(this.wiredServicesResult);
          })
          .catch((error) => {
            console.error("Error deleting shift:", error);
            this.confirMationMessage("Error", "Error deleting shift.", "error");
            this.shiftDeleteConfirmation = false;
            this.isShowSpinner = false;
          });
      }
    });
  }

  handleShowMoreModal(event) {
    console.log("Clicked More button");

    // Get the clicked <td> cell position
    const tdElement = event.currentTarget.closest("td");
    if (!tdElement) {
      console.error("Could not find parent TD element");
      return;
    }

    const tdRect = tdElement.getBoundingClientRect();
    // console.log('TD Element Position:', tdRect);

    // Get <td> width
    const tdWidth = tdRect.width;
    console.log("TD Width:", tdWidth);

    // Define modal height larger than <td>
    // const modalHeight = 500;

    // this.modalStyle = `top: ${tdRect.top + window.scrollY + 36}px;
    //                    left: ${tdRect.left - tdWidth - 93}px;
    //                    width: ${tdWidth}px;
    //                    height: auto;`;

    const modalHeightVh = 0.26 * window.innerHeight;
    const spacing = 8;
    const viewportHeight = window.innerHeight;

    // Get exact screen coordinates of the <td>
    const tdTop = tdRect.top + window.scrollY;
    const tdLeft = tdRect.left + window.scrollX;

    // Get available space above and below
    const spaceBelow = viewportHeight - tdRect.bottom;
    const spaceAbove = tdRect.top;

    // Vertical placement logic
    let topPosition;
    if (spaceBelow >= modalHeightVh + spacing) {
      topPosition = tdTop + tdRect.height + spacing; // show below
    } else if (spaceAbove >= modalHeightVh + spacing) {
      topPosition = tdTop - modalHeightVh - spacing; // show above
    } else {
      topPosition = tdTop + tdRect.height + spacing; // fallback
    }

    // ✅ THIS IS THE IMPORTANT PART: Align horizontally with the <td>
    this.modalStyle = `position: fixed;
                   top: ${topPosition}px;
                   left: ${tdLeft}px;
                   width: ${tdRect.width}px;
                   height: 26vh;
                   z-index: 1000;`;

    // console.log('Modal Position & Style:', this.modalStyle);

    // Open the modal
    this.isModalOpen = true;
    // console.log('Modal Open:', this.isModalOpen);
    console.log("staff id" + event.currentTarget.dataset.staffid);
    console.log("staff id" + event.currentTarget.dataset.date);
    let shiftDate = event.currentTarget.dataset.date;
    console.log("Shift Date " + shiftDate);
    this.moreShiftlist = [];

    getMultipleShiftsdata({
      shiftDate: shiftDate,
      staffId: event.currentTarget.dataset.staffid
    }).then((result) => {
      console.log("result" + JSON.stringify(result));
      this.moreShiftlist = result;
      this.moreShiftlist = this.moreShiftlist.map((rec) => {
        return {
          ...rec,
          moreStatus:
            rec.Status__c == "InProgress" ? "In Progress" : rec.Status__c,
          moreUiStatus: "more-" + rec.Status__c
        };
      });
    });
  }

  // Close the modal
  handleCloseModal() {
    console.log("Closing Modal...");

    const modal = this.template.querySelector(".custom-modal");

    if (modal) {
      modal.classList.add("closing"); // Start CRT close animation

      setTimeout(() => {
        modal.classList.add("hidden"); // Hide modal visually but keep in DOM
        this.isModalOpen = false; // Remove modal from DOM after animation completes
        console.log("Modal Closed:", this.isModalOpen);
      }, 500); // Matches CSS animation duration
    }
  }

  handleSearchName(event) {
    console.log("Search Name:", event.target.value);

    if (event.target.value) {
      this.searchName = event.target.value;
    } else {
      this.searchName = ""; // Reset if input is cleared
    }
    this.isShowSpinner = true;
    // Clear any existing timeout before setting a new one
    // clearTimeout(this.searchTimeout);
    setTimeout(() => {
      this.loadStaffData();
      this.isShowSpinner = false;
    }, 2000);

    // Set a new timeout to delay execution
    // Adjust delay time as needed (e.g., 500ms)
  }
  handleSectionToggle(event) {
    const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute
    console.log("Section ID:", sectionId);

    // Create a new array with updated values to trigger reactivity
    this.staffData = this.staffData.map((role) => {
      if (role.roleName === sectionId) {
        return {
          ...role,
          isExpanded: !role.isExpanded, // Toggle only the clicked section
          arrowcode: !role.isExpanded ? "\u2B9F" : "\u2B9C" // Up if expanded, down if collapsed
        };
      }
      return role; // Keep other sections unchanged
    });

    //  console.log('Updated Staff Data:', JSON.stringify(this.staffData));
  }

  get iconName() {
    if (this.isListening) {
      return "utility:unmuted";
    } else {
      return "utility:muted";
    }
  }

  // Alternative text for accessibility
  get altText() {
    if (this.isListening) {
      return "Unmute";
    } else {
      return "Mute";
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
      console.error("Error in toggleListening:", error.message);
    }
  }
  // Show icons when text area gains focus
  handleFocus() {
    console.log("handleFocus executing >>");
    try {
      this.showMuteIcon = true;
      this.isListening = false; // Ensure the state is not in listening mode
      if (this.recognition) {
        this.recognition.stop(); // Stop any ongoing recognition process
        this.recognition = null; // Clear recognition instance
      }
    } catch (error) {
      console.error("Error in handleFocus:", error.message);
    }
  }
  // Start speech recognition
  startListening() {
    try {
      console.log("Listening started...");
      if (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
      ) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          this.addShiftData.AddShiftNotes += Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          this.showClearIcon = true; // Show clear icon after transcription
        };

        recognition.onerror = (event) => {
          console.error("Error during speech recognition:", event.error);
        };

        recognition.onend = () => {
          console.log("Recognition ended");
          this.isListening = false;
        };

        recognition.start();
        this.recognition = recognition;
      } else {
        console.error("SpeechRecognition API not supported by this browser.");
        alert("SpeechRecognition API is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error in startListening:", error.message);
    }
  }

  // Stop speech recognition
  stopListening() {
    try {
      console.log("Listening stopped...");
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }
    } catch (error) {
      console.error("Error in stopListening:", error.message);
    }
  }

  // Clear text and hide clear icon
  clearText() {
    try {
      this.addShiftData.AddShiftNotes = "";
      this.showClearIcon = false;
      if (this.isListening) {
        //this.startListening();
        this.stopListening();
        this.addShiftData.AddShiftNotes = "";
      }
    } catch (error) {
      console.error("Error in clearText:", error.message);
    }
  }
  @track geolabel = "Shift Location";
  handleGetlocation() {
    // Toggle the map state
    this.isShowMap = !this.isShowMap;

    if (this.isShowMap) {
      // ✅ Staff Tracking view
      getJSONdata({
        shiftid: this.shiftStaffId,
        shiftstatus: this.addShiftData.AddShiftStatus,
        sdate: this.addShiftData.AddShiftStartDate
      })
        .then((result) => {
          this.jsonData = JSON.parse(result);
          console.log("JSON Data : " + JSON.stringify(this.jsonData));

          // Wait until DOM renders Staff Tracking container
          setTimeout(() => {
            this.setLatitudeLongitudeData(); // draw Staff Tracking map
          }, 0);
        })
        .catch((error) => {
          // this.isShowMap = false; // fallback to Shift Location
          console.error("Error loading JSON:", error);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error",
              message: "No data found.",
              variant: "error"
            })
          );
        });
      this.geolabel = "Staff Tracking";

      console.log("jsonData prepared for map:", JSON.stringify(this.jsonData));

      // ✅ Call your existing function
      this.setLatitudeLongitudeData();
    } else {
      this.geolabel = "Shift Location";
    }
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

  setLatitudeLongitudeMarkersOnly() {
    setTimeout(() => {
      const mapContainer = this.template.querySelector(".map-markers-only");

      if (!mapContainer) {
        console.error("Map container (markers only) not found");
        return;
      }

      if (this.mapMarkersOnly) {
        this.mapMarkersOnly.off();
        this.mapMarkersOnly.remove();
        this.mapMarkersOnly = null;
      }

      this.mapMarkersOnly = L.map(mapContainer).setView(
        [this.jsonData2[0].coords.latitude, this.jsonData2[0].coords.longitude],
        20
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(this.mapMarkersOnly);

      // Add markers only
      this.jsonData2.forEach((item) => {
        const lat = item.coords.latitude;
        const lng = item.coords.longitude;
        L.marker([lat, lng])
          .addTo(this.mapMarkersOnly)
          .bindPopup(`Location: ${lat}, ${lng}`);
      });
    }, 500);
  }

  get staffTrackingClass() {
    return this.isShowMap ? "map-container" : "map-container hidden";
  }

  get shiftLocationClass() {
    return this.isShowMap ? "map-markers-only hidden" : "map-markers-only";
  }

  hideHandleLocation() {
    this.hideLocation = false;
    this.isShowMap = false;
    this.mapMarkers = [];
    this.showLocation = true;
  }
  closeWarningMessage() {
    this.ServiceWarningMessage = false;
    this.shiftDeleteConfirmation = false;
    this.recurredShiftsDelete = false;
  }
  handleDeleteRecurShifts(event) {
    this.recurredShiftsDelete = event.target.checked;
    console.log("recurredShiftsDelete" + this.recurredShiftsDelete);
  }
  handleShiftDeleteConfirmation(event) {
    console.log("handleShiftDeleteConfirmation");
    console.log("recurstatus==>" + event.currentTarget.dataset.recurstatus);
    console.log("refid==>" + event.currentTarget.dataset.refid);
    this.recurredShiftsDelete = false;
    this.shiftDeleteCOnfirmationInfo = {};
    this.shiftDeleteCOnfirmationInfo.status =
      event.currentTarget.dataset.status;
    this.shiftDeleteCOnfirmationInfo.shiftID = event.currentTarget.dataset.id;
    this.shiftDeleteCOnfirmationInfo.refId = event.currentTarget.dataset.refid;
    this.shiftDeleteCOnfirmationInfo.recurStatus =
      event.currentTarget.dataset.recurstatus == "true" ? true : false;
    this.shiftDeleteCOnfirmationInfo.recurStartDate =
      event.currentTarget.dataset.weekdate;
    console.log(
      "  this.shiftDeleteCOnfirmationInfo.recurStartDate " +
        this.shiftDeleteCOnfirmationInfo.recurStartDate
    );
    console.log(
      "  this.shiftDeleteCOnfirmationInfo.refid " +
        this.shiftDeleteCOnfirmationInfo.refId
    );

    this.shiftDeleteConfirmation = true;
  }
  get participantViewLabelClass() {
    return this.isParticipanTViewEnable
      ? "roster-label roster-active-font"
      : "roster-label roster-inactive-font";
  }

  get staffViewLabelClass() {
    return this.isParticipanTViewEnable
      ? "roster-label roster-inactive-font"
      : "roster-label roster-active-font";
  }

  handletoggleParticipantView(event) {
    const isChecked = event.target.checked;

    this.isPopoverVisibleforShiftType = false;
    this.isPopoverVisible != this.isPopoverVisible;
    this.isPopoverVisible = false;
    if (isChecked) {
      // Toggle is ON → Staff View
      this.isParticipanTViewEnable = false;
      this.viewName = "Staff View";
      // this.isAutoSchedule = false;
      this.refreshStaffData();
      this.participantViewLabelClass = "roster-label roster-inactive-font";
      this.staffViewLabelClass = "roster-label roster-active-font";
    } else {
      // Toggle is OFF → Participant View
      this.isParticipanTViewEnable = true;
      this.viewName = "Participant View";
      //  this.isAutoSchedule = true;
      //   this.facIdlist = [...this.facIdlist];
      this.participantViewLabelClass = "roster-label roster-active-font";
      this.staffViewLabelClass = "roster-label roster-inactive-font";
    }
    console.log(
      "View Changed:",
      this.viewName,
      "| isParticipant:",
      this.isParticipanTViewEnable
    );
  }

  @track selectedView = "participant";
  @track viewName = "Participant View";

  handleParticipantView() {
    console.log(" handleParticipantView is called ");
    localStorage.setItem("selectedRosterView", "participant");
    let statusVal = [];
    this.statusfilterValue = [...statusVal];
    this.isParticipanTViewEnable = true;
    this.viewName = "Participant View";
    this.StatusOptionsforfilter = [
      { label: "Completed", value: "Completed" },
      { label: "In Progress", value: "InProgress" },
      { label: "Accepted", value: "Accepted" },
      { label: "Unassigned", value: "Unassigned" }
    ];
    this.viewName = "Participant View";
    this.isAutoschedule = "";
    //   this.facIdlist = [...this.facIdlist];
    this.participantViewLabelClass = "roster-label roster-active-font";
    this.staffViewLabelClass = "roster-label roster-inactive-font";
  }

  handleStaffView() {
    console.log(" handleStaffView is called ");
    localStorage.setItem("selectedRosterView", "staff");
    this.isParticipanTViewEnable = false;
    this.viewName = "Staff View";
    this.StatusOptionsforfilter = [
      { label: "Completed", value: "Completed" },
      { label: "In Progress", value: "InProgress" },
      { label: "Accepted", value: "Accepted" }
    ];
    this.isAutoschedule = "";
    let statusVal = [];
    this.statusfilterValue = [...statusVal];
    console.log(
      "this.statusfilterValue" + JSON.stringify(this.statusfilterValue)
    );
    setTimeout(() => {
      this.refreshStaffData();
    }, 500);
    this.participantViewLabelClass = "roster-label roster-inactive-font";
    this.staffViewLabelClass = "roster-label roster-active-font";
  }

  get participantTabClass() {
    return this.isParticipanTViewEnable ? "tab-button active" : "tab-button";
  }

  get staffTabClass() {
    return !this.isParticipanTViewEnable ? "tab-button active" : "tab-button";
  }

  get toggleLabel() {
    return this.isParticipanTViewEnable ? "Participant View" : "Staff View";
  }

  get isStaffViewToggleChecked() {
    return !this.isParticipanTViewEnable;
  }
  get datePickerStyle() {
    return this.isParticipanTViewEnable
      ? "width: 41%;" // Example width for Participant View
      : "width: 41%;"; // Example width for Staff View
  }

  handleFinalAllocate() {
    this.fatigueManagementFlag = false;
  }
  handleDeselectStaff() {
    this.isCalenderShiftView = false;
    this.fatigueManagementFlag = false;
  }
  handleSetHoursClose() {
    this.setHoursExceedsLimit = false;
    this.isCalenderShiftView = false;
    this.isShiftDragAndDrop = false;
  }

  get addIconClass() {
    const base = "material-icons add-icon";
    return this.disablePostInsertButtons
      ? `${base} disabled-icon`
      : `${base} active-icon`;
  }

  handleRiskNavigationFromChild(event) {
    //console.log('handleRiskNavigationFromChild');
    // console.log('evnt details '+JSON.stringify(event.detail));

    const editEvent = new CustomEvent("risknavigationfromroster", {
      detail: event.detail,
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(editEvent);
  }

  handleautoSchedule() {
    this.isParticipanTViewEnable = true;
    this.isAutoschedule = "auto";

    const child = this.template.querySelector(
      "c-tesseract-apps-participant-view"
    );
    if (child) {
      child.updateFlags();
    }

    console.log("auto schedule");
  }
  handlePublishShifts() {
    this.isParticipanTViewEnable = true;
    this.isAutoschedule = "publish";
    const child = this.template.querySelector(
      "c-tesseract-apps-participant-view"
    );
    if (child) {
      child.openPublishFlag();
    }

    console.log("auto schedule");
  }
  handlerosterInvoices() {
    this.childRosterInvoices = true;
    this.isStaffView = false;
    this.isCalenderShiftView = false;
    this.shiftReportsFlag = false;
    this.isHome = false;
  }
  handleRefreshParent() {
    this.facilityValue = [...this.facilityValue];
    this.serviceInvoiceFlag = true;
    console.log("Parent refresh  called ");
    if (this.serviceInvoiceFlag == true) {
      this.refreshStaffData();
    }
  }

  @track facilitySearchTerm = "";
  @track showFacilityOptions = false;
  @track facilityValue = [];

  get filteredFacilityOptions() {
    if (!this.facilitySearchTerm) return this.facilityOptions;

    return this.facilityOptions.filter((option) =>
      option.label.toLowerCase().includes(this.facilitySearchTerm.toLowerCase())
    );
  }

  get selectedFacilities() {
    return this.facilityOptions.filter((opt) =>
      this.facilityValue.includes(opt.value)
    );
  }

  get facilityCheckboxOptions() {
    return this.filteredFacilityOptions.map((option) => {
      return {
        ...option,
        checked: this.facilityValue.includes(option.value)
      };
    });
  }

  handleHorizontalScroll(event) {
    event.preventDefault(); // Prevent vertical scroll
    const container = event.currentTarget;
    container.scrollLeft += event.deltaY; // Apply vertical delta to horizontal scroll
  }

  // Show/hide dropdown
  showFacilityDropdown() {
    this.showFacilityOptions = true;
  }

  handleOutsideFacilityClick(event) {
    const container = this.template.querySelector(".facility-multiselect");
    if (container && !container.contains(event.target)) {
      this.showFacilityOptions = false;
    }
  }
  handleFacilityBlur() {
    setTimeout(() => {
      const dropdown = this.template.querySelector(".custom-dropdown");
      if (dropdown && !dropdown.contains(document.activeElement)) {
        this.showFacilityOptions = false;
      }
    }, 200);
  }

  handleFacilitySearchChange(event) {
    this.facilitySearchTerm = event.target.value;
  }
  handleFacilitySelect(event) {
    const selectedId = event.currentTarget.dataset.id;
    const selectedLabel =
      this.facilityOptions.find((f) => f.value === selectedId)?.label || "";
    this.SelectedComboBoxFacility = selectedId;
    this.facilityValue = [selectedId];
    this.facilitySearchTerm = selectedLabel;
    this.showFacilityOptions = false;

    /*  localStorage.setItem('SelectedComboBoxFacility', JSON.stringify(selectedId)); */
    this.loadStaffData();
  }

  clearFacilitySearch() {
    this.facilitySearchTerm = "";
    this.SelectedComboBoxFacility = "";
    this.facilityValue = [];
    this.showFacilityOptions = false;

    /*   localStorage.removeItem('SelectedComboBoxFacility'); */
    this.loadStaffData(); // Optional: reload without filtering
  }

  handleFacilityCheckboxChange(event) {
    const value = event.target.value;
    if (event.target.checked) {
      if (!this.facilityValue.includes(value)) {
        this.facilityValue = [...this.facilityValue, value];
      }
    } else {
      this.facilityValue = this.facilityValue.filter((v) => v !== value);
    }

    this.updateSearchInputLabel();
    /*  localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue)); */
    this.loadStaffData();
  }

  removeFacility(event) {
    const value = event.currentTarget.dataset.id;
    this.facilityValue = this.facilityValue.filter((v) => v !== value);
    this.updateSearchInputLabel();
    /*    localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue)); */
    this.loadStaffData();
  }

  updateSearchInputLabel() {
    const selectedLabels = this.selectedFacilities.map((f) => f.label);
    this.facilitySearchTerm = ""; // You can clear the input or keep the last typed string
  }

  get isNoStaffDataFound() {
    return (
      this.searchName?.trim() &&
      Array.isArray(this.staffData) &&
      this.staffData.length > 0 &&
      this.staffData.every(
        (role) => Array.isArray(role.staffData) && role.staffData.length === 0
      )
    );
  }
  get addressComponentStyle() {
    return this.addNewAddressCheckBox ? "" : "display: none;";
  }

  handleCreateNewShift() {
    console.log("splitShift " + this.splitShift);
    console.log("groupShift " + this.groupShift);

    this.finalAddShiftData.shiftaddress = this.address;
    this.finalAddShiftData.shiftDetails = this.addShiftData;

    if (
      this.validateInputs() &&
      this.validateAddress() &&
      this.addShiftData.AddShiftDuration > 0
    ) {
      this.handleSave();
    } else {
      this.isShowSpinner = false;
      if (this.addShiftData.AddShiftDuration <= 0) {
        this.confirMationMessage(
          "Error",
          "Start time should be earlier than end time.",
          "Error"
        );
      }
    }
  }

  async handleSave() {
    this.isShowSpinner = true;
    console.log(
      "AddShiftAndServices BEFORE save ==>  PRE" +
        JSON.stringify(this.AddShiftAndServices)
    );

    // Check if at least one row has staff value (first row validation)
    if (
      this.AddShiftAndServices.length > 0 &&
      !this.AddShiftAndServices[0].staff
    ) {
      this.confirMationMessage(
        "Error",
        "Staff selection is required for the first row before saving.",
        "Error"
      );
      this.isShowSpinner = false;
      return;
    }
      // ✅ Validate AddShiftNotes length
    const shiftNotes = this.finalAddShiftData?.shiftDetails?.AddShiftNotes || "";
    console.log("Shift notes length:", shiftNotes.length);

    if (shiftNotes.length > 1000) {
      this.confirMationMessage(
        "Error",
        `Shift notes cannot exceed 1000 characters. Current length: ${shiftNotes.length}.`,
        "Error"
      );
      this.isShowSpinner = false;
      return;
    }
     if (
      this.addShiftData.AddShiftType != "Sleepover Shift" &&
      this.addShiftData.AddShiftDuration > this.addshiftMaxDuration && this.addshiftMaxDuration  !=0
    ) {
      this.confirMationMessage(
        "Error",
        "This shift exceeds the maximum allowed duration of " +
          this.addshiftMaxDuration +
          " hours. Please shorten the shift or contact your Facility Admin to override this restriction.",
        "Error"
      );
       this.isShowSpinner = false;
      return;
    }

    // Validate participant and service details
    for (let row of this.AddShiftAndServices) {
      if (row.participant) {
        if (!row.servicetype || !row.serviceitem) {
          this.confirMationMessage(
            "Error",
            "All Service details are required when Participant is selected.",
            "Error"
          );
          this.isShowSpinner = false;
          return;
        }
      }
    }
    const firstRow = this.AddShiftAndServices[0];
    const firstStaffId = firstRow?.staff;

    // Check only the first staff for fatigue, overlapping, and set hours
    if (firstStaffId) {
      // Skip fatigue check if this row already has fatigue confirmed
      if (!firstRow.fatigueConfirmed) {
        // Check fatigue for first staff
        const isFatigued = await this.checkFatigueForStaff(firstStaffId);
        if (isFatigued) {
          this.fatigueManagementFlag = true;
          this.pendingSaveOperation = true;
          this.pendingStaffName = firstRow.stafflabel; // Store staff name for UI
          this.pendingRowIndex = 0; // Store row index
          this.isShowSpinner = false;
          return; // Wait for user decision
        }
      }

      // Check overlapping for first staff
      const isOverlapping = await this.getOverLappingdata(firstStaffId);
      if (isOverlapping) {
        this.isShowSpinner = false;
        return;
      }

      // Check set hours limits for first staff
      const isValid = await this.checkShiftSetHours(null, firstStaffId);
      if (!isValid) {
        this.confirMationMessage(
          "Error",
          "Set hours limit exceeded for the staff member.",
          "Error"
        );
        this.isShowSpinner = false;
        return;
      }
    }

    if (this.addShiftData.AddShiftType === "Custom") {
      const result = await this.prepareAndValidateCustomShifts();
      console.log("✅ Raw Result: in custom ==>", JSON.stringify(result));
    }
    if (this.splitShift == true) {
        if (this.AddShiftAndServices.length == 1) {
          this.confirMationMessage(
              "Warning",
              "Add at least two rows for a split shift.",
              "Warning"
          );
          this.isShowSpinner = false;
          return; 
         }
      
        const isValid = await this.validateSplitShiftsSegments();
        if (!isValid) {
           this.isShowSpinner = false;
          return; // stop further processing if validation failed
        }
      }
    const payload = {
      addShiftData: this.finalAddShiftData,
      staffRows: this.prepareStaffRows(),
      isSplitShift: this.splitShift,
      isGroupShift: this.groupShift,
      isCustomShift: this.customShift,
      isRecurringShift: this.AddShiftRecurringCheckboxValue,
      includeParticipants: this.AddShiftIncludePartcipants,
      isEdit: this.isEditShiftScreenFlag,
      LongShiftTimeSlots: JSON.stringify(this.LongShiftTimeSlots)
    };

    console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));

    // Use recurring dates if available, otherwise single date array
    const recurrenceDates =
      this.AddShiftRecurringCheckboxValue == true
        ? this.recurrenceDatesList
        : [this.finalAddShiftData.shiftDetails.AddShiftStartDate];
    console.log(
      " recurrence date list " + JSON.stringify(this.recurrenceDatesList)
    );
    if (this.deletedChecklist.length > 0) {
      // Create an array of deleteRecord promises
      // const deletePromises = this.deletedChecklist.map(rec => deleteRecord(rec.checkListId));
      let AddShiftCheckListId = [];
      this.deletedChecklist.forEach((row) => {
        AddShiftCheckListId.push(row.checkListId);
      });

      deleteCheckList({ checkListId: AddShiftCheckListId }).then((result) => {
        console.log("checklist delete result " + result);
      });
    }

    const serviceTypeIdSet = new Set();

    payload.staffRows.forEach((item) => {
      let servicesArray = item.services || [];
      servicesArray.forEach((ser) => {
        if (ser.serviceType) {
          serviceTypeIdSet.add(ser.serviceType);
        }
      });
    });

    const serviceTypeIdList = Array.from(serviceTypeIdSet);
    console.log("services array==> " + serviceTypeIdList);
    if (serviceTypeIdList.length > 0) {
       try {
            const result = await getFundsData({ fundsId: serviceTypeIdList });
            console.log("🔄 [Step 1] Apex returned funds:", JSON.stringify(result));
          console.log(
            "🔄 [Step 1] Apex returned funds:",
            JSON.stringify(result)
          );

          // Step 1: Map serviceTypeId → {available, spent}
          const fundMap = new Map();
          result.forEach((fund) => {
            console.log(
              `🗃️  Mapping fund: ${fund.Id}, Available: ${fund.Available_Funds__c}, Spent: ${fund.Spent_Amt__c}`
            );
            fundMap.set(fund.Id, {
              available: fund.Available_Funds__c || 0,
              spent: fund.Spent_Amt__c || 0,
              name: fund.Name || "Unknown Service"
            });
          });

          // Step 2: Aggregate usage by serviceTypeId - WITH EDIT LOGIC
          const usageMap = new Map();

          payload.staffRows.forEach((item) => {
            let servicesArray = item.services || [];
            servicesArray.forEach((ser) => {
              if (!ser.serviceType || ser.amount == null) {
                console.warn("⚠️ Skipping service due to missing data:", ser);
                return;
              }

              let totalAmount;
              const newAmount = parseFloat(ser.amount) || 0;

              if (this.isEditShiftScreenFlag) {
                // EDIT MODE: Calculate net change
                const originalAmount = this.originalServiceAmounts[ser.serviceType] 
                  ? parseFloat(this.originalServiceAmounts[ser.serviceType].amount) || 0 
                  : 0;
                
                const amountChange = newAmount - originalAmount;
                
                if (this.AddShiftRecurringCheckboxValue) {
                  totalAmount = amountChange * (this.recurOccurencesValue || 1);
                } else {
                  totalAmount = amountChange;
                }
                
                console.log(`✏️ EDIT MODE - Service: ${ser.serviceType}, Original: $${originalAmount}, New: $${newAmount}, Change: $${amountChange}, Total Impact: $${totalAmount}`);
              } else {
                // NEW SHIFT MODE: Use full amount
                if (this.AddShiftRecurringCheckboxValue) {
                  totalAmount = newAmount * (this.recurOccurencesValue || 1);
                } else {
                  totalAmount = newAmount;
                }
                console.log(`🆕 NEW SHIFT - Service: ${ser.serviceType}, Amount: $${newAmount}, Total: $${totalAmount}`);
              }

              // Add or update in usageMap
              if (usageMap.has(ser.serviceType)) {
                const updated = usageMap.get(ser.serviceType) + totalAmount;
                usageMap.set(ser.serviceType, updated);
                console.log(`🔁 Updated usageMap: ${ser.serviceType} → ${updated}`);
              } else {
                usageMap.set(ser.serviceType, totalAmount);
                console.log(`🆕 Set usageMap: ${ser.serviceType} → ${totalAmount}`);
              }
            });
          });

          // Step 3: Validate usage against available funds
          const exceededServices = [];

          usageMap.forEach((usedAmount, serviceType) => {
            const fund = fundMap.get(serviceType);
            if (fund) {
              console.log(
                `🔍 Checking serviceType=${serviceType}: used=${usedAmount}, available=${fund.available}`
              );

              if (usedAmount > fund.available) {
                exceededServices.push({
                  serviceType,
                  usedAmount,
                  available: fund.available
                });
                console.error(`❌ Funding exceeded for ${serviceType}`);
              }
            } else {
              console.warn(
                `⚠️ No fund data found for serviceType=${serviceType}`
              );
            }
          });

          // Step 4: Show toast if exceeded
          if (exceededServices.length > 0) {
            this.isShowSpinner = false;
            console.error(
              "🚨 Funding exceeded for these services:",
              exceededServices
            );

            const message = exceededServices
              .map((s) => {
                const fund = fundMap.get(s.serviceType);
                const serviceName = fund?.name || "Unknown Service";

                if (this.AddShiftRecurringCheckboxValue) {
                  return `Recurring service "${serviceName}" exceeds available funds.\nTotal recurring amount: $${s.usedAmount.toFixed(
                    2
                  )}, Available: $${s.available.toFixed(2)}`;
                } else {
                  return `Service "${serviceName}" exceeds available funds.\nUsed: $${s.usedAmount.toFixed(
                    2
                  )}, Available: $${s.available.toFixed(2)}`;
                }
              })
              .join("\n\n");

            this.confirMationMessage(
              "Funding Limit Exceeded",
              message,
              "error"
            );
            this.isShowSpinner = false;
            return;
          }
       
        } catch (error) {
          console.error("🔥 Apex call failed or validation error:", error);
          this.isShowSpinner = false;
          return; // Important: return here to stop execution
        }
    }
    createShift({
      jsonPayload: JSON.stringify(payload),
      recurrenceDates: recurrenceDates
    })
      .then((result) => {
       // console.log("✅ Shift created:", result);
        let parts = result.split("shifts ==>"); 
        let message = parts[0].trim();
        let shiftsJson = parts[1] ? JSON.parse(parts[1]) : [];

        console.log("✅ Message:", message);
        console.log("✅ First shift:", shiftsJson[0]);

        this.isCalenderShiftView = false;
        this.isHome = true;
        this.isStaffView = true;
        this.isShowSpinner = false;
        this.AddShiftAndServices = [];

         if (!this.isEditShiftScreenFlag && this.addShiftData.AddShiftnotification == true ) {
            const shift = shiftsJson[0];

        let rejectedStaffEmail = "";
              let typeOfShift = "";
              if (
                ( this.AddShiftRecurringCheckboxValue ==true )
              ) {
                typeOfShift = "Recurring";
              } else {
                typeOfShift = "createShift";
              }

            if (this.groupShift === true) {
              this.sendShiftEmailCommon(shift, '', true, false);
               generateAndSendNotification({
                role: shift.Role__c,
                strdate: this.addShiftData.AddShiftStartDate,
                staffId: '',
                isRjectedAllocation: false,
                rejectedStaffEmail: rejectedStaffEmail,
                facilityValue:shift.Facility__c,
                typeofshift: typeOfShift,
                ShiftId:shift.Id,
                groupShift:true
                
              }).then((response) => {});
            } else if (this.splitShift === true) {
              this.sendShiftEmailCommon(shift, this.addShiftData.AddShiftStaffValue, false, true);
               generateAndSendNotification({
                role: shift.Role__c,
                strdate: this.addShiftData.AddShiftStartDate,
                staffId: this.addShiftData.AddShiftStaffValue,
                isRjectedAllocation: false,
                rejectedStaffEmail: rejectedStaffEmail,
                facilityValue:
                 shift.Facility__c,
                typeofshift: typeOfShift,
                  ShiftId:'',
                groupShift:false
                
              }).then((response) => {});
            } else {
              this.sendShiftEmailCommon(
                shift,
                this.addShiftData.AddShiftStaffValue,
                false,
                false
              );

               generateAndSendNotification({
                role:  shift.Role__c,
                strdate: this.addShiftData.AddShiftStartDate,
                staffId: this.addShiftData.AddShiftStaffValue,
                isRjectedAllocation: false,
                rejectedStaffEmail: rejectedStaffEmail,
                facilityValue:
                  shift.Facility__c,
                typeofshift: typeOfShift,
                  ShiftId:'',
                groupShift:false
                
              }).then((response) => {});
            }
          }

        this.refreshStaffData();
        // Group Shift
        if (this.groupShift) {
          const message = this.isEditShiftScreenFlag
            ? "Group shifts have been updated successfully."
            : "Group shifts have been successfully added.";
          this.confirMationMessage("Success", message, "success");
        }

        // Split Shift
        if (this.splitShift) {
          const message = this.isEditShiftScreenFlag
            ? "Split shifts have been updated successfully."
            : "Split shifts have been created successfully.";
          this.confirMationMessage("Success", message, "success");
        }

        // General Shift
        if (!this.groupShift && !this.splitShift) {
          const title = this.isEditShiftScreenFlag
            ? "Shift Updated"
            : "Shift Created";
          const message = this.isEditShiftScreenFlag
            ? "Shift has been updated successfully."
            : "Shift has been created successfully.";
          this.confirMationMessage(title, message, "success");
        }
      })
      .catch((error) => {
        console.error("❌ Error:", JSON.stringify(error));
        this.isShowSpinner = false;
      });
  }

  sendShiftEmailCommon(shift, staffId = '', groupShift = false, splitShift = false) {
  const emailPayload = {
    shiftId: shift.Id,
    roleId: shift.Role__c,
    facilityId: shift.Facility__c,
    staffId: staffId,
    isrecur: this.AddShiftRecurringCheckboxValue,
    Sdate: this.addShiftData.AddShiftStartDate,
    Edate: this.recurEndDate,
    typeOfRecur: this.RecurValue,
    recurEvery: this.recurEveryValue,
    weeklyDays: this.selectedDays,
    monthlyDay: this.monthOfDay,
    groupShift: groupShift,
    splitShift: splitShift,
  };

  if(splitShift==false){
       sendShiftEmails(emailPayload).then((response) => {
    // Optional: handle response
    });
  }
   if(splitShift==true){
       sendSplitEmails(emailPayload).then((response) => {
    // Optional: handle response
    });
   }
 
}

  // ✅ Group staff + services before sending to Apex
  // ✅ Group staff + services before sending to Apex
  prepareStaffRows() {
    console.log("splitShift value:", this.splitShift);
    console.log("groupShift value:", this.groupShift);

    let staffRows;

    if (this.splitShift) {
      console.log("Processing SPLIT shift case");
      let splitShiftRefId = this.generateGUID();
      // 🔥 Split shifts → return rows as-is (no grouping by staff)
      staffRows = this.AddShiftAndServices.map((row) => {
        console.log("Processing split shift row for staff:", row.staff);
        return {
          staffId: row.staff,
          staffLabel: row.stafflabel,
          role: row.role,
          shifttype: row.shifttype,
          shiftnotes: this.finalAddShiftData.shiftDetails.AddShiftNotes,
          shiftnames: this.finalAddShiftData.shiftDetails.AddShiftTypeName,
          starttime: row.starttime,
          starttimeAmPm: row.starttimeAmPm,
          endtime: row.endtime,
          endtimeAmPm: row.endtimeAmPm,
          startdate: row.startdate,
          enddate: row.enddate,
          splitShifts:this.splitShift,
           address:
                 row.address &&
                      Object.values(row.address).some(v => v && v.toString().trim() !== "")
                  ? row.address : this.address,
          shiftWithStaffId: row.shiftWithStaffId,
          refId: row.refId,
          addressSource: row.addressSource,
          splitShiftRefId:row.splitShiftRefId?row.splitShiftRefId: splitShiftRefId,
          duration: row.billablehours,
          breakTime: row.breakTime,
          participantId: row.participant,
          participantLabel: row.participantlabel,
          hourlyRate: row.hourlyrate,
          staffPaidBreak: row.staffPaidBreak,
          enableTimeRounding: this.enableTimeRounding,
          recurring :row.recurring, 
          services: [
            {
              participantName: row.participantlabel,
              participantId: row.participant,
              serviceId: row.serviceId,
              serviceType: row.servicetype,
              serviceItem: row.serviceitem,
              serviceTypeName: row.servicetypelabel,
              serviceItemName: row.serviceitemlabel,
              unitPrice: row.unitprice,
              billableHours: row.billablehours,
              amount: row.amount,
              hourlyRate: row.hourlyrate
            }
          ],
          checkList: this.ChekListrows.map((item) => ({
            description: item.description,
            mandatory: item.mandatory,
            checkListId: item.checkListId,
            isCreatedFromStatic: item.isCreatedFromStatic,
            shiftWithStaffRefId: this.generateShiftStaffRefId(
              row.staff,
              row.startdate
            )
          }))
        };
      });
    } else {
      console.log("Processing GROUPED shift case");
   //   console.log("this.ChekListrows==> " + JSON.stringify(this.ChekListrows));
 console.log("this.address==> " + JSON.stringify(this.address));
      const reducedResult = this.AddShiftAndServices.reduce((acc, row) => {
       console.log("Processing row with staff:",JSON.stringify(row.address));
        const key = row.staff;

        if (!acc[key]) {
          console.log("Creating new staff entry for:", key);
          acc[key] = {
            staffId: row.staff,
            staffLabel: row.stafflabel,
            role: row.role,
            shifttype: this.finalAddShiftData.shiftDetails.AddShiftType,
            shiftnames: this.finalAddShiftData.shiftDetails.AddShiftTypeName,
            starttime: this.finalAddShiftData.shiftDetails.AddShiftStartTime,
            starttimeAmPm:
              this.finalAddShiftData.shiftDetails.AddShiftStartTimeAMPM,
            endtime: this.finalAddShiftData.shiftDetails.AddShiftEndTime,
            endtimeAmPm:
              this.finalAddShiftData.shiftDetails.AddShiftEndTimeAMPM,
            startdate: this.finalAddShiftData.shiftDetails.AddShiftStartDate,
            enddate: this.finalAddShiftData.shiftDetails.AddShiftEndDate,
            shiftnotes: this.finalAddShiftData.shiftDetails.AddShiftNotes,
         
            staffPaidBreak: row.staffPaidBreak,
             enableTimeRounding: this.enableTimeRounding,
            address:
                 row.address &&
                      Object.values(row.address).some(v => v && v.toString().trim() !== "")
                  ? row.address : this.address,
            shiftWithStaffId: row.shiftWithStaffId,
            duration:
              this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"
                ? this.finalAddShiftData.shiftDetails.AddShiftDuration
                : row.billablehours,
            breakTime: row.breakTime,
            splitShifts:row.splitShifts,
            splitShiftRefId:row.splitShiftRefId?row.splitShiftRefId: null,

            hourlyRate:
              this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"
                ? 0
                : row.hourlyrate,
            refId: row.refId,
            addressSource: row.addressSource,
            participants: [],
            services: [],
             recurring :row.recurring, 

            checkList: this.ChekListrows.map((item) => ({
              description: item.description,
              mandatory: item.mandatory,
              checkListId: item.checkListId,
              isCreatedFromStatic: item.isCreatedFromStatic,
              shiftWithStaffRefId: this.generateShiftStaffRefId(
                row.staff,
                this.finalAddShiftData.shiftDetails.AddShiftStartDate
              )
            }))
          };
        } else {
          console.log("Staff already exists in accumulator:", key);
        }

        console.log("Adding service for staff:", key);
        acc[key].services.push({
          participantName: row.participantlabel,
          participantId: row.participant,
          serviceType: row.servicetype,
          serviceId: row.serviceId,
          serviceTypeName: row.servicetypelabel,
          serviceItem: row.serviceitem,
          serviceItemName: row.serviceitemlabel,
          unitPrice: row.unitprice,
          billableHours: row.billablehours,
          amount: row.amount,
          hourlyRate: row.hourlyrate,
          customshiftRefId:
            this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"
              ? row.id
              : "",
          starttime:
            this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"
              ? row.starttime
              : null,
          endtime:
            this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"
              ? row.endtime
              : null
        });

        return acc;
      }, {});

      // console.log("Reduced result:", JSON.stringify(reducedResult));
      staffRows = Object.values(reducedResult);
      // console.log("Staff rows after Object.values:", JSON.stringify(staffRows));
    }

    console.log("✅ Final Staff Rows Payload:", JSON.stringify(staffRows));
    return staffRows;
  }
  generateGUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Add this method if it doesn't exist
  generateShiftStaffRefId(staffId, startDate) {
    const baseRefId = new Date().getTime().toString();
    return staffId + "_" + startDate + "_" + baseRefId;
  }

  async checkShiftSetHours(avaliableId, staffId) {
    try {
      const dateObj = new Date(this.addShiftData.AddShiftStartDate);
      const formattedDate = `${dateObj.getDate()}/${String(
        dateObj.getMonth() + 1
      ).padStart(2, "0")}/${dateObj.getFullYear()}`;

      console.log("Shift Date For Set Hours >>", formattedDate);

      const shiftDate = formattedDate;
      const startTime = this.addShiftData.AddShiftStartTimeAMPM;
      const endTime = this.addShiftData.AddShiftEndTimeAMPM;
      const shiftId = this.ShiftwithStafftoApexId;

      const result = await processSingleShift({
        avaliableId,
        shiftDate,
        startTime,
        endTime,
        staffId,
        shiftId
      });

      console.log("✅ Apex raw response:", result);

      const parsedResult = JSON.parse(result);
      const isAllowed = parsedResult.result;

      console.log("✅ isAllowed:", isAllowed);

      if (isAllowed) {
        // ⛔ Not allowed -> exceeds set hours
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: "Shift exceeds allowed set hours.",
            variant: "error"
          })
        );
        this.isShowSpinner = false;
        return false; // 🚫 Not allowed
      }

      return true; // ✅ Allowed
    } catch (error) {
      console.error("Error checking shift set hours:", error);
      throw error; // rethrow so caller knows it failed
    }
  }

  // Example call before Apex

  @track selectedRole;
  handleRoleTabClick(event) {
    const selected = event.currentTarget.dataset.role;

    // Set selected role
    this.selectedRole = selected;

    // Update filters
    this.chosenRole = [selected];
    this.SelctedComboBoxRole = selected;

    /*   localStorage.setItem('SelctedComboBoxRole', JSON.stringify(selected)); */
    localStorage.setItem("SelctedComboBoxRole", JSON.stringify(selected));

    this.loadStaffData(); // reload based on new role
  }

  // REMOVE this method if not using it anymore
  updateRoleTabClasses() {
    this.staffData = this.staffData.map((role) => {
      const isActiveTab = role.roleName === this.selectedRole;
      const isVisible = this.chosenRole.includes(role.roleName);

      let computedClass = "";
      if (isVisible) {
        computedClass = isActiveTab
          ? "role-tab-button role-tab-active"
          : "role-tab-button";
      }

      return {
        ...role,
        isExpanded: isActiveTab,
        computedClass
      };
    });
  }

  get computedRoleTabs() {
    return this.OrgNisationRoles.map((role) => {
      const isActive = role.value === this.selectedRole;
      return {
        ...role,
        computedClass: isActive
          ? "role-tab-button role-tab-active"
          : "role-tab-button"
      };
    });
  }

  disableLeftArrow = true;
  disableRightArrow = false;

  updateArrowVisibility = () => {
    const container = this.template.querySelector(
      '[data-id="roleTabsContainer"]'
    );
    if (!container) return;

    const scrollLeft = Math.ceil(container.scrollLeft);
    const scrollWidth = Math.ceil(container.scrollWidth);
    const clientWidth = Math.ceil(container.clientWidth);

    this.disableLeftArrow = scrollLeft <= 0;
    this.disableRightArrow = scrollLeft + clientWidth >= scrollWidth;
  };

  scrollTabsLeft() {
    const container = this.template.querySelector(
      '[data-id="roleTabsContainer"]'
    );
    if (container) {
      container.scrollBy({ left: -150, behavior: "smooth" });
      setTimeout(() => this.updateArrowVisibility(), 300);
      console.log("⬅ Scroll left clicked");
    }
  }

  scrollTabsRight() {
    const container = this.template.querySelector(
      '[data-id="roleTabsContainer"]'
    );
    if (container) {
      container.scrollBy({ left: 150, behavior: "smooth" });
      setTimeout(() => this.updateArrowVisibility(), 300);
      console.log("⬅ Scroll left clicked");
    }
  }

  handleScroll() {
    this.updateArrowVisibility();
  }
  toggleDropdown(event) {
    if (event) {
      event.stopPropagation(); // ⛔️ Prevents document click from firing
    }
    this.isOpen = !this.isOpen;
    console.log("🔁 toggleDropdown called. isOpen before toggle:", this.isOpen);

    if (this.isOpen) {
      // Add event listeners when dropdown opens
      setTimeout(() => {
        console.log(
          "🟢 Dropdown opened. Event listeners added (mousedown, keydown)"
        );

        document.addEventListener("click", this.handleClickOutside);
        document.addEventListener("keydown", this.handleEscapeKey);
      }, 0);
    } else {
      console.log("🔴 Dropdown closed. Event listeners removed");

      // Remove event listeners when dropdown closes
      document.removeEventListener("mousedown", this.handleClickOutside);
      document.removeEventListener("keydown", this.handleEscapeKey);
    }
  }

  handleClickOutside(event) {
    console.log("📍 Click detected outside handler fired");
    console.log("Clicked target:", event.target);

    const dropdown = this.template.querySelector(".dropdown-container");
    const button = this.template.querySelector(".settings-button");

    if (
      dropdown &&
      button &&
      !dropdown.contains(event.target) &&
      !button.contains(event.target)
    ) {
      this.closeDropdown();
    }
  }

  handleEscapeKey(event) {
    console.log("⌨️ Keydown detected:", event.key);

    if (event.key === "Escape") {
      this.closeDropdown();
    }
  }

  closeDropdown() {
    console.log("🧹 closeDropdown called. Setting isOpen to false");

    this.isOpen = false;
    document.removeEventListener("mousedown", this.handleClickOutside);
    document.removeEventListener("keydown", this.handleEscapeKey);
  }

  handleMenuItemClick(event) {
    console.log("✅ Menu item clicked");
    console.log("Action selected:", event.currentTarget.dataset.action);

    const action = event.currentTarget.dataset.action;
    console.log("actio name " + action);

    // Handle different menu actions
    switch (action) {
      case "autoSchedule":
        console.log("In this autoSchedule clicked");
        this.handleautoSchedule();
        break;
      case "publish":
        console.log("Open in publish clicked");
        this.handlePublishShifts();
        break;
      case "manageInvoices":
        console.log("manageInvoices");
        this.handlerosterInvoices();
        break;
      case "rosterSettings":
        console.log("rosterSettings");
        this.handleRosterSettings();
        break;
      case "underOverRoasting":
        console.log("underOverRoasting");
        this.handleUnderOverRoasting();
        break;
      case "compactView":
        this.isExpandedView = false;
        this.isCompactView = true;
        console.log("compactView");
        break;
      case "expandView":
        this.isExpandedView = true;
        this.isCompactView = false;
        console.log("expandView");
        publish(this.messageContext, FOOTER_MESSAGE_CHANNEL, {
          action: "expandSidebar"
        });
        break;
      case "shiftReport":
        console.log("shiftReport");
        this.handleShiftReports();
        break;
      default:
        break;
    }

    // Close dropdown after action
    //  this.closeDropdown();

    // Dispatch custom event for parent component
  }

  get dropdownClass() {
    return `dropdown-menu ${this.isOpen ? "show" : "hide"}`;
  }

  @track hoveredSplitShiftId = null;
  @track hoveredStaffId = null;
  @track hoveredShiftDate = null;

  handleSplitClick(event) {
    const clickedId = event.currentTarget.dataset.id;
    const clickedStaffId = event.currentTarget.dataset.staffid;
    const clickedDate = event.currentTarget.dataset.shiftdate;

    const isSame = this.hoveredSplitShiftId === clickedId;

    // Toggle: if clicked again, reset
    if (isSame) {
      console.log(`⚪ Shift deselected.`);
      this.hoveredSplitShiftId = null;
      this.hoveredStaffId = null;
      this.hoveredShiftDate = null;
    } else {
      console.log(
        `🟡 Shift selected: ${clickedId}, Staff: ${clickedStaffId}, Date: ${clickedDate}`
      );
      this.hoveredSplitShiftId = clickedId;
      this.hoveredStaffId = clickedStaffId;
      this.hoveredShiftDate = clickedDate;
    }

    this.updateHoveredFlags();
  }

  updateHoveredFlags() {
    console.log(
      "🔄 Updating hover flags for:",
      this.hoveredSplitShiftId,
      this.hoveredStaffId,
      this.hoveredShiftDate
    );
    console.log(
      "👀 Sample shift object:",
      JSON.stringify(
        this.staffData[0]?.staffData?.[0]?.shiftsByDay?.[0]?.shifts?.[0]
      )
    );

    const hoveredDateStr = this.hoveredShiftDate
      ? new Date(this.hoveredShiftDate).toISOString().split("T")[0]
      : null;

    const updatedStaffData = this.staffData.map((role) => {
      return {
        ...role,
        staffData: role.staffData.map((staff) => {
          const isTargetStaff = staff.staffId === this.hoveredStaffId;
          const shouldClear =
            !this.hoveredSplitShiftId || !hoveredDateStr || !isTargetStaff;

          const updatedShiftsByDay = staff.shiftsByDay.map((day) => {
            const dayDateStr = new Date(day.Shiftdate)
              .toISOString()
              .split("T")[0];
            const isTargetDay = dayDateStr === hoveredDateStr;

            const updatedShifts = (day.shifts || []).map((shift) => {
              if (!shift.isSplitShift) return shift;

              // Reset styles/flags if clearing or unrelated shift
              if (shouldClear || !isTargetDay) {
                return {
                  ...shift,
                  isHovered: false,
                  hideIfNotHovered: false,
                  dynamicClass: "",
                  calculatedStyle: shift.splitShiftColor || ""
                };
              }

              const isHovered = shift.Id === this.hoveredSplitShiftId;
              const hideIfNotHovered = !isHovered;

              return {
                ...shift,
                isHovered,
                hideIfNotHovered,
                dynamicClass: isHovered ? "split-hovered" : "",
                calculatedStyle:
                  (shift.splitShiftColor || "") +
                  (isHovered ? "; height: 84px;" : "")
              };
            });

            return { ...day, shifts: updatedShifts };
          });

          return { ...staff, shiftsByDay: updatedShiftsByDay };
        })
      };
    });

    this.staffData = updatedStaffData;
  }

  get processedStatusOptions() {
    return this.StatusOptionsforfilter.map((item) => {
      const isSelected = this.statusfilterValue.includes(item.value);
      return {
        ...item,
        dotClass: "legend-dot " + item.value.toLowerCase(),
        wrapperClass: "legend-item1 clickable" + (isSelected ? " active" : "")
      };
    });
  }
  handleStatusLegendClick(event) {
    const value = event.currentTarget.dataset.value;
    const newSelected = [...this.statusfilterValue];

    if (newSelected.includes(value)) {
      // Remove if already selected
      this.statusfilterValue = newSelected.filter((v) => v !== value);
    } else {
      // Add to selection
      newSelected.push(value);
      this.statusfilterValue = newSelected;
    }
  }

handleShiftCardClick(event) {
  event.stopPropagation();
  event.preventDefault();

  const clickedShiftId = event.currentTarget.dataset.id;
  const staffId = event.currentTarget.dataset.staffid;
  const clickedDay = event.currentTarget.dataset.day;

  console.log("🔵 Shift clicked → ID:", clickedShiftId, ", Staff ID:", staffId, ", Day:", clickedDay);

  function normalizeDate(date) {
    return new Date(date).toISOString().slice(0, 10);
  }

  const staffToCheck = this.staffData
    .flatMap((role) => role.staffData)
    .find((staff) => staff.staffId === staffId);

  const dayToCheck = staffToCheck?.shiftsByDay.find(
    (day) => normalizeDate(day.Shiftdate) === normalizeDate(clickedDay)
  );

  if (!dayToCheck) {
    console.warn("⚠️ No matching day found for clickedDay:", clickedDay);
    console.warn("🧩 Staff found:", !!staffToCheck);
    console.warn("🗓️ Available shift days for staff:", staffToCheck?.shiftsByDay.map((d) => d.Shiftdate));
  } else {
    console.log(
      "🔎 Precheck → isSingleGroupRecord:",
      dayToCheck.isSingleGroupRecord,
      ", splitShiftLength:",
      dayToCheck.splitShiftLength
    );
    // keep existing short-circuit for the pure non-split single case
    if (dayToCheck.isSingleGroupRecord && dayToCheck.splitShiftLength === 0) {
      console.log("⛔ Click ignored due to no shifts present.");
      console.log("📌 Flag values:");
      console.log("→ isSingleGroupRecord:", dayToCheck.isSingleGroupRecord);
      console.log("→ shiftsLength:", dayToCheck.splitShiftLength);
      console.log("→ Shiftdate:", dayToCheck.Shiftdate);
      return;
    }
  }

  console.log("📂 Starting expansion logic...");

  let hasLogged = false;

  this.staffData = this.staffData.map((role) => ({
    ...role,
    staffData: role.staffData.map((staff) => {
      if (staff.staffId !== staffId) return staff;

      return {
        ...staff,
        shiftsByDay: staff.shiftsByDay.map((day) => {
          const isTargetDay = day.Shiftdate === clickedDay && staff.staffId === staffId;

          let clickedShift = null;
          let isSplitShift = false;
          let refIDToExpand = null;
          let groupRefId = null;

          if (isTargetDay && !hasLogged) {
            clickedShift = (day.newUIGroupOfShifts || []).find((s) => s.Id === clickedShiftId);
            isSplitShift = clickedShift?.isSplitShift || false;
            refIDToExpand = clickedShift?.refID || null;
            groupRefId = clickedShift?.splitShiftRefId || null;

            console.log(
              "🟩 LOG FROM CLICK HANDLER → Shift ID:",
              clickedShiftId,
              ", isSplitShift:",
              isSplitShift,
              ", refID:",
              refIDToExpand,
              ", splitShiftRefId:",
              groupRefId
            );

            hasLogged = true; // ✅ Prevent future logs
          }

          // Hover state for the container cards (unchanged)
          const newShifts = (day.newUIGroupOfShifts || []).map((shift) => {
            const isClickedShift = isTargetDay && shift.Id === clickedShiftId;
            const isSplitContainer = isClickedShift && isSplitShift; // don't hover the split container
            return { ...shift, isHovered: isClickedShift && !isSplitContainer };
          });

          // 🎯 NEW: Build split tiles from shiftsByRefId (ALL parts in the group, not per-day)
          let updatedSplitShifts = day.splitShifts || [];
          let anySplitHovered = false;

          if (isTargetDay && isSplitShift) {
            // find the group in staff.shiftsByRefId
            const groups = staff.shiftsByRefId || [];
            let refGroup =
              (groupRefId && groups.find((g) => g.refId === groupRefId)) ||
              // fallback: match by refID of the clicked shift if splitShiftRefId missing
              (refIDToExpand &&
                groups.find((g) => (g.shifts || []).some((s) => s.refID === refIDToExpand)));

            if (!refGroup) {
              console.warn("❗ No matching refGroup found for", { groupRefId, refIDToExpand });
              // fall back to existing day-based behavior (keep previous logic)
              refGroup = { shifts: day.splitShifts || [] };
            }

            const groupShifts = Array.isArray(refGroup.shifts) ? refGroup.shifts : [];
            const totalSplits = groupShifts.length;

            const colorClasses = ["color-red", "color-blue", "color-green", "color-purple"];
            const heightPercent = 100 / Math.max(totalSplits || 1, 1);

            updatedSplitShifts = groupShifts.map((split, index) => {
              const fontSize =
                totalSplits === 2 ? 13 : totalSplits === 3 ? 10 : totalSplits >= 4 ? 8 : 14;
              const heightClass = `height-${Math.round(heightPercent)}`;
              const fontClass = `font-${fontSize}`;
              const colorClass = colorClasses[index] || "color-default";
              return {
                ...split,
                // UI fields expected by template:
                isHovered: true,                // show the mini split cards
                isSplitCardExpanded: false,     // collapsed by default
                colorClass,
                dynamicClass: `expanded-two-shift-split ${colorClass} ${heightClass} ${fontClass}`,
                expandedClass: ""               // set when expanded
              };
            });

            // set day-level split layout flags **by number of parts in the group**
            const count = totalSplits;
            day = {
              ...day,
              isSplitSingleGroupRecord: count === 1,
              isSplitTwoGroupOfShifts: count === 2,
              isSplitThreeGroupOfShifts: count === 3,
              isSplitFourGroupOfShifts: count >= 4
            };

            anySplitHovered = updatedSplitShifts.some((s) => s.isHovered);
          } else {
            // non-split click → keep current split array but make sure they're not hovered
            updatedSplitShifts = (day.splitShifts || []).map((split) => ({
              ...split,
              isHovered: false
            }));
            anySplitHovered = false;
          }

          const anyHovered = newShifts.some((s) => s.isHovered) || anySplitHovered;

          return {
            ...day,
            newUIGroupOfShifts: newShifts,
            splitShifts: updatedSplitShifts,
            anyShiftInGroupHovered: anyHovered,
            anySplitHovered: anySplitHovered,
            // keep previous behavior
            isShiftExpanded: isTargetDay ? false : day.isShiftExpanded
          };
        })
      };
    })
  }));

  this.staffData = JSON.parse(JSON.stringify(this.staffData));
  console.log("✅ Shift expansion complete.\n");
  console.log("🔽 Final Shift Flags State:");
  this.staffData.forEach((role) => {
    role.staffData.forEach((staff) => {
      staff.shiftsByDay.forEach((day) => {
        (day.newUIGroupOfShifts || []).forEach(() => {});
        (day.splitShifts || []).forEach(() => {});
      });
    });
  });
}

handleBackFromShiftCard(event) {
  event.stopPropagation();

  const shiftId = event.currentTarget.dataset.id;   // may be undefined for shared back button
  const shiftDay = event.currentTarget.dataset.day;

  console.log("🔙 Back button clicked → Shift ID:", shiftId, ", Day:", shiftDay);
  console.log("📂 Starting collapse logic...");

  this.staffData = this.staffData.map((role) => ({
    ...role,
    staffData: role.staffData.map((staff) => ({
      ...staff,
      shiftsByDay: staff.shiftsByDay.map((day) => {
        const isTargetDay = day.Shiftdate === shiftDay;

        // reset hovered for container only if we know which one
        const newShifts = (day.newUIGroupOfShifts || []).map((shift) => {
          const shouldReset = isTargetDay && shiftId && shift.Id === shiftId;
          return { ...shift, isHovered: shouldReset ? false : shift.isHovered };
        });

        // collapse all split tiles
        const updatedSplitShifts = (day.splitShifts || []).map((split) => ({
          ...split,
          isHovered: false,
          isSplitCardExpanded: false,
          dynamicClass: "",
          expandedClass: "",
          dynamicStyle: ""
        }));

        const anyHovered = newShifts.some((s) => s.isHovered) || updatedSplitShifts.some((s) => s.isHovered);

        return {
          ...day,
          newUIGroupOfShifts: newShifts,
          splitShifts: updatedSplitShifts,
          anyShiftInGroupHovered: anyHovered,
          anySplitHovered: false,
          isShiftExpanded: false
        };
      })
    }))
  }));

  this.staffData = JSON.parse(JSON.stringify(this.staffData));
  console.log("✅ Collapse complete.\n");
}

handleSplitShiftExpand(event) {
  const splitId = event.currentTarget.dataset.splitid;
  const clickedDay = event.currentTarget.dataset.day;

  console.log("🔵 handleSplitShiftExpand triggered");
  console.log("➡️ Clicked Split ID:", splitId);
  console.log("📅 Clicked Day:", clickedDay);

  this.staffData = this.staffData.map((role) => ({
    ...role,
    staffData: role.staffData.map((staff) => ({
      ...staff,
      shiftsByDay: staff.shiftsByDay.map((day) => {
        if (day.Shiftdate !== clickedDay) return day;

        const matchedSplit = (day.splitShifts || []).find((split) => split.Id === splitId);
        const colorClass = matchedSplit?.colorClass || "";

        const updatedSplits = (day.splitShifts || []).map((split) => {
          const isExpanded = split.Id === splitId;
          const finalExpandedClass = `expanded-two-shift ${colorClass}`;
          if (isExpanded) {
            console.log(`✅ Expanding split ID: ${split.Id}`);
            console.log(`🧩 Final Expanded Class: ${finalExpandedClass}`);
          }
          return {
            ...split,
            isSplitCardExpanded: isExpanded,
            isHovered: false,             // hide mini cards while expanded
            expandedClass: finalExpandedClass
          };
        });

        return {
          ...day,
          splitShifts: updatedSplits,
          anySplitHovered: false
        };
      })
    }))
  }));

  this.staffData = JSON.parse(JSON.stringify(this.staffData));
}

handleBackFromSplitShiftCard(event) {
  const clickedDay = event.currentTarget.dataset.day;

  this.staffData = this.staffData.map((role) => ({
    ...role,
    staffData: role.staffData.map((staff) => ({
      ...staff,
      shiftsByDay: staff.shiftsByDay.map((day) => {
        if (day.Shiftdate !== clickedDay || staff.staffId !== event.currentTarget.dataset.staffid) return day;

        const updatedSplits = (day.splitShifts || []).map((split) => ({
          ...split,
          isSplitCardExpanded: false,  // collapse full card
          isHovered: true              // show mini split cards again
        }));

        return {
          ...day,
          splitShifts: updatedSplits,
          anySplitHovered: true        // show shared back icon
        };
      })
    }))
  }));

  this.staffData = JSON.parse(JSON.stringify(this.staffData));
}


  get getIconContainerClass() {
    return this.isExpandedView
      ? "icon-container icon-expanded"
      : "icon-container";
  }

  get getIconItemClass() {
    return this.isExpandedView ? "icon-item expanded-font" : "icon-item";
  }
  get getDeleteIconClass() {
    return this.isExpandedView
      ? "material-icons-delete delete-icon delete-icon-expanded"
      : "material-icons-delete delete-icon";
  }
  get getExpandedTwoShiftClass() {
    return this.isExpandedView
      ? "expanded-two-shift expanded-font-12"
      : "expanded-two-shift";
  }
  handleShiftTranfer(event) {
    let shiftId = event.currentTarget.dataset.id;
    console.log(
      "status dragging shift status ==>" + event.currentTarget.dataset.status
    );
    if (
      event.currentTarget.dataset.status == "InProgress" ||
      event.currentTarget.dataset.status == "Completed"
    ) {
      this.confirMationMessage(
        "Error",
        "Shift cannot be reassigned when the status is In Progress or Completed.",
        "Error"
      );
      return;
    }

    event.dataTransfer.setData("shiftId", event.currentTarget.dataset.id);
    console.log("Dragging shift with ID: in shiftswap ", shiftId);
    event.dataTransfer.setData("dataParam", event.currentTarget.dataset.param);
    event.dataTransfer.setData(
      "shifttime",
      event.currentTarget.dataset.shifttime
    );
    event.dataTransfer.setData(
      "shifttype",
      event.currentTarget.dataset.shifttype
    );
    event.dataTransfer.setData("refid", event.currentTarget.dataset.refid);
    event.dataTransfer.setData(
      "recurstatus",
      event.currentTarget.dataset.recurstatus
    );

    event.dataTransfer.setData(
      "draggingShiftDate",
      event.currentTarget.dataset.day
    );
    event.dataTransfer.setData(
      "shiftrate",
      event.currentTarget.dataset.shiftrate
    );
    console.log("Dragging STAFF ID ", event.currentTarget.dataset.staffid);
    event.dataTransfer.setData(
      "draggingstaffid",
      event.currentTarget.dataset.staffid
    );
    console.log("shift rate " + event.dataTransfer.getData("shiftrate"));
  }
  handleShiftTransferDrop(event) {
    event.preventDefault();
    let draggedItemId = event.dataTransfer.getData("staffId");
    console.log("Dropped  staff  ID: in shiftswap ", draggedItemId);
    console.log("dropped shift id " + event.currentTarget.dataset.id);
  }

  // get getSplitShiftStyle() {
  //   return this.isExpandedView ? "font-size: 18px !important;" : "";
  // }

  handleKeyboardShortcut(event) {
    const isCtrlShift = (event.ctrlKey || event.metaKey) && event.shiftKey;

    if (isCtrlShift && event.key === "E") {
      event.preventDefault();

      if (!this.isExpandedView) {
        this.isExpandedView = true;
        this.isCompactView = false;

        // 🔁 Publish to expand the sidebar
        publish(this.messageContext, FOOTER_MESSAGE_CHANNEL, {
          action: "expandSidebar"
        });

        console.log("⌨️ Ctrl + Shift + E triggered: Expand View");
      }
    }

    if (isCtrlShift && event.key === "C") {
      event.preventDefault();

      if (this.isExpandedView) {
        this.isExpandedView = false;
        this.isCompactView = true;
      }
    }
  }

  handleDraagingRecurChangeValue(event) {
    this.draggingRecurShiftValue = event.detail.value;
    this.finalDraggingRefId = this.draggingStaffrefId;
    if (this.draggingRecurShiftValue == "Only this shift") {
      this.finalDraggingRefId = "";
    } else {
      this.finalDraggingRefId = this.draggingStaffrefId;
    }
  }
  handleAssignDragAndDrop() {
    console.log("⏳ Starting handleAssignDragAndDrop...");
    console.log("➡️ Rate:", this.droppedStaffRate);
    console.log("➡️ StaffId:", this.droppedStaffId);
    console.log("➡️ RefId:", this.finalDraggingRefId);
    console.log("➡️ ShiftId:", this.draggingStaffShiftId);
    console.log("➡️ Dragging Shift Date:", this.draggingShiftDate);
    console.log("➡️ Dropped Shift Date:", this.droppedShiftDate);
    this.isShowSpinner = true;
    assignShiftsInDrag({
      rate: this.droppedStaffRate,
      StaffId: this.droppedStaffId,
      refId: this.finalDraggingRefId,
      shiftId: this.draggingStaffShiftId,
      draggingShiftDate: this.draggingShiftDate,
      droppedShiftDate: this.droppedShiftDate
    })
      .then(() => {
        console.log("✅ Shift reassigned successfully.");
        this.refreshStaffData();
        this.emptyDragAndDrop();
        this.handlePublishedStatus();
        this.isShowSpinner = false;
      })
      .catch((error) => {
        console.error("❌ Error assigning shift:", error);
        this.emptyDragAndDrop();
        this.isShowSpinner = false;
        // optionally show error in UI
      });
  }
  emptyDragAndDrop() {
    this.isShiftDragAndDrop = false;
    this.droppedStaffRate = 0;
    this.droppedStaffId = "";
    this.finalDraggingRefId = "";
    this.darggingShiftRecurtempalte = false;
    this.draggingRecurShiftValue = "";
    this.draggingStaffRate = 0;
    this.draggingSleepoverFalg = false;
    this.draggingSameStaffFlag = false;
  }
  handlePublishStatusChange(event) {
    const status = event.detail;
    console.log("📢 Received publish status from child:", status);
    this.shiftPublishStatus = status;
    this.isParticipanTViewEnable = false;
  }

  // Pass facilityId as parameter
  async processShifts(facilityId) {
    try {
      const data = await this.fetchShiftData(facilityId);
      // console.log("Fetched Shift TYPE Records: ", JSON.stringify(data));
      this.shiftNameOptions = data.map((option) => ({
        ...option,
        label: option.Name,
        value: option.Id,
        duration: option.Duration__c,
        enableTimeRounding:option.Facility__r?.Organisation__r?.Enable_Time_Rounding__c || false,
      }));
      if (this.shiftNameOptions.length > 0) {
        this.otherThanNdis =
          this.shiftNameOptions[0].Facility__r.Type_of_Service__c != "NDIS";
      }
      if (this.isEditShiftScreenFlag == true) {
        console.log(
          " this.addShiftData.AddShiftTypeName ==> " +
            this.addShiftData.AddShiftTypeName
        );
        let shifNames = this.shiftNameOptions.filter(
          (rec) => rec.value === this.addShiftData.AddShiftTypeName
        );
        console.log("shifNameOptions in edit  ==>" + JSON.stringify(shifNames));
        this.addshiftMaxDuration = shifNames[0].duration;

        let customShifts = shifNames[0].Custom_Shift_Timings__r || [];
        let shiftTypeDurationMap = {};

        customShifts.forEach((cs, index) => {
          if (cs.Shift_Type__c) {
            if (!shiftTypeDurationMap[cs.Shift_Type__c]) {
              shiftTypeDurationMap[cs.Shift_Type__c] = 0;
            }
            shiftTypeDurationMap[cs.Shift_Type__c] += cs.Duration__c
              ? cs.Duration__c
              : 0;
          }
        });
        this.shiftTypeDurations = shiftTypeDurationMap;
        console.log(
          "shifNameOptions in edit  ==>" +
            JSON.stringify(this.shiftTypeDurations)
        );
      }

      console.log("this.otherThanNdis : ", this.otherThanNdis);
      // Process the data here...
    } catch (err) {
      console.error("Error in processShifts: ", JSON.stringify(err));
    }
  }
  fetchShiftData(facilityId) {
    return getShiftsTypeByFacility({ facilityId })
      .then((result) => {
        return result;
      })
      .catch((error) => {
        console.error("Error fetching shifts: ", error);
        this.shiftNameOptions = [];
        throw error;
      });
  }

  servicetypeoptions = [
    { label: "Community Access", value: "Community Access" },
    { label: "Personal Care", value: "Personal Care" },
    { label: "Transport", value: "Transport" },
    { label: "Domestic Assistance", value: "Domestic Assistance" },
    { label: "Social Support", value: "Social Support" }
  ];
  customShiftTimings = [];

  handleDocumentClick(event) {
    // Check if the click is inside any dropdown container
    const dropdownContainers = this.template.querySelectorAll(
      ".dropdown-container"
    );
    let clickedInside = false;

    dropdownContainers.forEach((container) => {
      if (container.contains(event.target)) {
        clickedInside = true;
      }
    });

    // Also check if clicked inside the service modal
    const serviceModal = this.template.querySelector(".slds-modal");
    if (serviceModal && serviceModal.contains(event.target)) {
      clickedInside = true;
    }

    if (!clickedInside) {
      console.log("🟦 Outside click: closing all table dropdowns==>");
      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
        showstaffdropdown: false,
        showparticipantdropdown: false,
        showservicetypedropdown: false,
        showserviceitemdropdown: false,
        showcustomshiftdropdown: false,

        staffchevronclass: "",
        participantchevronclass: "",
        servicetypechevronclass: "",
        customshiftchevronclass: ""
      }));

      this.showserviceitemmodal = false;
    }
  }

  // Prevent event propagation for elements inside dropdowns

  get hasData() {
    return this.AddShiftAndServices && this.AddShiftAndServices.length > 0;
  }

  get showAddRowButton() {
    // ✅ Group shift → always allow add row
    if (this.groupShift) {
      return true;
    }

    // ✅ Custom or Split shift → limit to 4 rows
    if (this.addShiftData.AddShiftType === "Custom" || this.splitShift) {
      return this.AddShiftAndServices.length < 4;
    }

    return false;
  }

  initRow() {
    return {
      id: Date.now().toString() + Math.random(),
      staff: null,
      stafflabel: "Select Staff",
      staffsearch: "",
      participant: null,
      participantlabel: "Select Participant",
      participantsearch: "",
      servicetype: null,
      servicetypelabel: "Select Service Type",
      servicetypesearch: "",
      serviceitem: null,
      serviceitemlabel: "Select Service Item",
      unitprice: 0,
      billablehours: this.addShiftData.AddShiftDuration,
      amount: "0.00",
      hourlyrate: 0,
      showstaffdropdown: false,
      showparticipantdropdown: false,
      showservicetypedropdown: false,
      isservicetypedisabled: true,
      staffchevronclass: "",
      participantchevronclass: "",
      servicetypechevronclass: "",
      filteredstaff: [...this.staffOptions],
      filteredparticipants: [...this.participantoptions],
      filteredservicetypes: [...this.servicetypeoptions],

      starttime: null,
      starttimeAmPm: "",
      endtime: "",
      endtimeAmPm: "",
      startdate: null,
      enddate: null,
      role: "",
      shifttype: "",
      shiftnotes: null,
      shiftduartion: 0,
      isotherlocation: false,
      shifttypename: "",
      participantdddresscheckbox: false,
      address: {},
      refId: null,
      rateLabel: "",
      duration: 0,
      breakTime: 0,

      startTimeSelectedHour: null,
      startTimeSelectedMinute: null,
      startTimeSelectedAmPm: null,
      startTimeDisplayTime: "Select Time",

      endTimeSelectedHour: null,
      endTimeSelectedMinute: null,
      endTimeSelectedAmPm: null,

      endTimeDisplayTime: "Select Time",
      strtDisableTimeButton: false,
      endDisableTimeButton: false,
      rowOnchangeOccured: false,
      facilityIconClass: "material-icons add-icon",
      participantIconClass: "material-icons add-icon",
      newIconClass: "material-icons add-icon",
      customshiftsoptions: [...this.longShiftOptions],
      customshiftlabel: "",
      showcustomshiftdropdown: false,
      customshiftchevronclass: "",
      addressSource: "",
      staffPaidBreak: false
    };
  }
  /* */

  async handleShiftOptionChange(event) {
    const selected = event.currentTarget.dataset.name;
    const isChecked = event.target.checked;

    if (selected === "splitShift") {
      this.splitShift = isChecked;
      this.rowShiftTimingsEnable = true;
      this.rowShiftTypeEnable = false;
      if (isChecked) {
        this.facilityAddressDisable = true;
        this.isDisableParticipantCheckBox = true;
        this.newAddressDisable = true;
        this.groupShift = false;
      }
      if (!isChecked) this.rowShiftTimingsEnable = false;
      if (this.isEditShiftScreenFlag == true) {
        const addressType =
          this.facilityAddressCheckbox == true
            ? "Facility"
            : this.participantAddressCheckBox == true
              ? "Participant"
              : "New";

        this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
          if (i === 0) {
            return {
              ...row,
              addressType: addressType,
              /* endtime:null,
                   endTimeSelectedHour: 12,
                  endTimeSelectedMinute: "00",
                  endTimeSelectedAmPm: "AM",
                  endTimeDisplayTime:"Select Time" , */

              // Clear any existing address when changing type
              facilityIconClass:
                addressType === "Facility"
                  ? "material-icons add-icon selected-address-icon-facility"
                  : "material-icons add-icon",
              participantIconClass:
                addressType === "Participant"
                  ? "material-icons add-icon selected-address-icon-participant"
                  : "material-icons add-icon",
              newIconClass:
                addressType === "New"
                  ? "material-icons add-icon selected-address-icon-new"
                  : "material-icons add-icon"
            };
          }
          return row;
        });

        console.log(
          " add shift servies in split ==> " +
            JSON.stringify(this.AddShiftAndServices)
        );
        const isValid = await this.validateSplitShiftsSegments();
        if (!isValid) {
          return; // stop further processing if validation failed
        }
      }
    } else if (selected === "groupShift") {
      this.selectedStaffLabel = "";
      this.groupShift = isChecked;
      this.rowShiftTimingsEnable = false;
      this.rowShiftTypeEnable = false;
      if (this.groupShift == true) {
        this.isDisableParticipantCheckBox = false;
      }
      if (isChecked) this.splitShift = false;
    }
  }

  async handleAddServiceRow() {
    // Check if previous row has staff value
    if (this.AddShiftAndServices.length >= 1) {
      const previousRowIndex = this.AddShiftAndServices.length - 1;
      const previousRow = this.AddShiftAndServices[previousRowIndex];
      if(!this.addShiftData.AddShiftTypeName){
           this.confirMationMessage(
          "Warning",
          "Please select Shift Name before adding a new row.",
          "Warning"
        );
        return;
      }

      if (
        (this.addShiftData.AddShiftType === "Custom" || this.splitShift) &&
        this.addShiftData.AddShiftStaffValue == null
      ) {
        this.confirMationMessage(
          "Error",
          "Please select staff before adding a new row.",
          "Error"
        );
        return;
      }

      if (!previousRow.staff) {
        this.confirMationMessage(
          "Error",
          "Please select staff for the previous row before adding a new row.",
          "Error"
        );
        return;
      }

      if (!previousRow.fatigueConfirmed) {
        const isFatigued = await this.checkFatigueForStaff(previousRow.staff);
        if (isFatigued) {
          this.fatigueManagementFlag = true;
          this.pendingAddRowOperation = true;
          this.pendingStaffName = previousRow.stafflabel; // Store staff name for UI
          this.pendingRowIndex = previousRowIndex; // Store row index
          return; // Wait for user decision
        }
      }

      const isOverlapping = await this.getOverLappingdata(previousRow.staff);
      if (isOverlapping) {
        return;
      }

      const isValid = await this.checkShiftSetHours(null, previousRow.staff);
      if (!isValid) {
        this.confirMationMessage(
          "Error",
          "Set hours limit exceeded for the staff member.",
          "Error"
        );
        return;
      }

      // Continue with existing validations...
      for (let row of this.AddShiftAndServices) {
        if (row.participant) {
          if (!row.servicetype || !row.serviceitem) {
            this.confirMationMessage(
              "Error",
              "All Service details are required when Participant is selected.",
              "Error"
            );
            return;
          }
        }
      }

      if (this.splitShift) {
        const lastRow =
          this.AddShiftAndServices[this.AddShiftAndServices.length - 1];
        if (!lastRow.address || Object.keys(lastRow.address).length === 0) {
          this.confirMationMessage(
            "Error",
            "Please provide address for the previous row before adding a new one.",
            "Error"
          );
          return;
        }
        if (!lastRow.starttime) {
          this.confirMationMessage(
            "Error",
            "Please provide Start Time for the previous row before adding a new one.",
            "Error"
          );
          return;
        }
        if (!lastRow.endtime) {
          this.confirMationMessage(
            "Error",
            "Please provide End Time for the previous row before adding a new one.",
            "Error"
          );
          return;
        }

        this.addNewAddressCheckBox = false;
        this.participantAddressCheckBox = false;
        this.facilityAddressCheckbox = true;
        this.addShiftData.AddShiftParticipantAddressCheckbox = false;
        this.addShiftData.AddShiftEnterOtherLocation = false;
        this.fetchFacilityAddressAndGeocode();
      }
    }

    // Add new row
    this.AddShiftAndServices = [...this.AddShiftAndServices, this.initRow()];

    // Existing logic for splitShift OR Custom...
    if (this.splitShift || this.addShiftData.AddShiftType === "Custom") {
      const staffLabel = this.AddShiftAndServices[0].stafflabel;
      console.log("staffLabel => ", staffLabel);

      if (this.splitShift) {
        this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
          ...row,
          stafflabel: staffLabel,
          staff: this.addShiftData.AddShiftStaffValue
        }));
      }

      if (this.addShiftData.AddShiftType === "Custom") {
        const lastIndex = this.AddShiftAndServices.length - 1;
        let lastRow = { ...this.AddShiftAndServices[lastIndex] };
        lastRow.shifttype = "Morning";
        lastRow.hourlyrate = 0;
        lastRow.rateLabel =
          lastRow.Shift_Type__c === "Sleepover Shift" ? "Allowance" : "Rate";
        lastRow.customshiftlabel = "Morning";
        lastRow.billablehours = 0;
        this.AddShiftAndServices[lastIndex] = lastRow;
      }
    }
  }

  toggleDropdownForCustomisation(event) {
    event.stopPropagation();
    const index = parseInt(event.currentTarget.dataset.index, 10);
    const field = event.currentTarget.dataset.field.toLowerCase();

    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        const dropdownKey = `show${field}dropdown`;
        const chevronKey = `${field}chevronclass`;
        const isOpen = !row[dropdownKey];
        console.log("open ==>" + isOpen);
        console.log("dropdownKey ==>" + dropdownKey);
        console.log("chevronKey ==>" + chevronKey);

        return {
          ...row,
          [dropdownKey]: isOpen,
          /*  [chevronKey]: isOpen
                            ? 'slds-icon-utility-chevrondown slds-icon_container slds-icon-utility-chevrondown_rotate'
                            : '', */
          // close other dropdowns in same row

          showstaffdropdown:
            field === "staff"
              ? this.splitShift == false
                ? isOpen
                : false
              : false,
          showparticipantdropdown: field === "participant" ? isOpen : false,
          showservicetypedropdown: field === "servicetype" ? isOpen : false,
          showserviceitemdropdown: field === "serviceitem" ? isOpen : false,
          showcustomshiftdropdown: field === "customshift" ? isOpen : false,

          staffchevronclass:
            this.splitShift == true && field === "staff"
              ? "slds-icon-utility-chevrondown slds-icon_container"
              : field === "staff" && isOpen
                ? "slds-icon-utility-chevrondown slds-icon_container slds-icon-utility-chevrondown_rotate"
                : field === "staff"
                  ? ""
                  : row.staffchevronclass,
          participantchevronclass:
            field === "participant" && isOpen
              ? "slds-icon-utility-chevrondown slds-icon_container slds-icon-utility-chevrondown_rotate"
              : field === "participant"
                ? ""
                : row.participantchevronclass,
          servicetypechevronclass:
            field === "servicetype" && isOpen
              ? "slds-icon-utility-chevrondown slds-icon_container slds-icon-utility-chevrondown_rotate"
              : field === "servicetype"
                ? ""
                : row.servicetypechevronclass,
          serviceitemchevronclass:
            field === "serviceitem" && isOpen
              ? "slds-icon-utility-chevrondown slds-icon_container slds-icon-utility-chevrondown_rotate"
              : field === "serviceitem"
                ? ""
                : row.serviceitemchevronclass,
          customshiftchevronclass:
            field === "customshift" && isOpen
              ? "slds-icon-utility-chevrondown slds-icon_container slds-icon-utility-chevrondown_rotate"
              : field === "customshift"
                ? ""
                : row.customshiftchevronclass
        };
      } else {
        // close all dropdowns in other rows
        return {
          ...row,
          showstaffdropdown: false,
          showparticipantdropdown: false,
          showservicetypedropdown: false,
          showserviceitemdropdown: false,
          staffchevronclass: "",
          participantchevronclass: "",
          servicetypechevronclass: "",
          serviceitemchevronclass: "",
          customshiftchevronclass: ""
        };
      }
    });
  }

  handleSearchInput(event) {
    const index = parseInt(event.currentTarget.dataset.index, 10);
    const field = event.currentTarget.dataset.field.toLowerCase();
    const value = event.currentTarget.value;

    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        const searchKey = `${field}search`;
        let filteredKey, optionsSource;

        switch (field) {
          case "staff":
            filteredKey = "filteredstaff";
            optionsSource = this.staffOptions;
            break;
          case "participant":
            filteredKey = "filteredparticipants";
            optionsSource = this.participantoptions;
            break;
          case "servicetype":
            filteredKey = "filteredservicetypes";
            // Always filter from full list
            optionsSource = row.allservicetypes || [];
            break;
          case "serviceitem":
            filteredKey = "filteredserviceitems";
            // Always filter from full list
            optionsSource = row.allserviceitems || [];
            break;
          default:
            return row;
        }

        // If search input empty, show all options (reset filter)
        const filtered =
          value.trim() === ""
            ? optionsSource
            : optionsSource.filter((opt) =>
                opt.label.toLowerCase().includes(value.toLowerCase())
              );

        return {
          ...row,
          [searchKey]: value,
          [filteredKey]: filtered,
          [`show${field}dropdown`]: true
        };
      }
      return row;
    });
  }

  async handleDropdownSelect(event) {
    event.stopPropagation();

    const index = parseInt(event.currentTarget.dataset.index, 10);
    const field = event.currentTarget.dataset.field.toLowerCase();
    const value = event.currentTarget.dataset.value;
    const label = event.currentTarget.dataset.label;
    this.activeRowIndex = index;

    this.AddShiftAndServices = await Promise.all(
      this.AddShiftAndServices.map(async (row, i) => {
        if (i === index) {
          let updatedRow = { ...row };

          // Generic updates
          updatedRow[`${field}label`] = label;
          updatedRow[`show${field}dropdown`] = false;
          updatedRow[`${field}chevronclass`] = "";

          // Field-specific logic
          if (field === "participant") {
            updatedRow.participant = value;
            updatedRow.filteredservicetypes = this.servicetypeoptions;
            if (this.groupShift == false) {
              this.isDisableParticipantCheckBox = false;
            }
            try {
              const response = await getClientFunds({ clientId: value });
              if (response) {
                const fetchedServiceTypes = response.map((rec) => ({
                  label: rec.Registration_Group__c,
                  value: rec.Id,
                  Plan_Type__c: rec.Plan_Type__c
                }));

                this.servicetypeoptions = [...fetchedServiceTypes];

                updatedRow = {
                  ...updatedRow,
                  allservicetypes: [...fetchedServiceTypes],
                  filteredservicetypes: [...fetchedServiceTypes],
                  servicetype: null,
                  servicetypelabel: "Select Service Type",
                  allserviceitems: [],
                  filteredserviceitems: [],
                  serviceitem: null,
                  serviceitemlabel: "Select Service Item",
                  unitprice: 0,
                  amount: "0.00",
                  isservicetypedisabled: true
                };
              }
            } catch (error) {
              console.error("Error fetching client funds:", error);
            }
          } else if (field === "servicetype") {
            updatedRow.servicetype = value;
            try {
              const result = await getCatalogueData({
                serviceType: value,
                clientId: updatedRow.participant
              });

              const catalogueData = result.catalogueData;
              const stateField = result.statesCombined;
              this.stateValue = stateField;

              this.serviceGroupName = catalogueData.map((rec) => {
                let amountVal, nameVal;

                if (
                  this.otherThanNdis === true ||
                  (this.otherThanNdis === false &&
                    result.catalogueData[0].Name.includes("Miscellaneous"))
                ) {
                  amountVal = result.clientJunctionMapAmount[rec.Id] || 0;
                  nameVal =
                    result.clientJunctionMapName[rec.Id] ||
                    rec.Support_Item_Name__c;
                } else {
                  amountVal = rec[stateField] || 0;
                  nameVal = rec.Support_Item_Name__c;
                }

                return {
                  ...rec,
                  label: nameVal,
                  value: rec.Id,
                  unit: amountVal
                };
              });

              updatedRow = {
                ...updatedRow,
                allserviceitems: [...this.serviceGroupName],
                filteredserviceitems: [...this.serviceGroupName],
                serviceitem: null,
                serviceitemlabel: "Select Service Item",
                unitprice: 0,
                amount: "0.00",
                isservicetypedisabled: false
              };
            } catch (error) {
              console.error("Error fetching catalogue data:", error);
            }
          } else if (field === "staff") {
            updatedRow.staff = value;
            const rate = this.getServiceStaffHourlyRate(
              this.addShiftData.AddShiftHoliday,
              this.AddShiftDayName,
              updatedRow.staff,
              this.addShiftData.AddShiftType
            );
            updatedRow.hourlyrate = rate;

            updatedRow.shiftWithStaffId=this.AddShiftAndServices.length >1?null:updatedRow.shiftWithStaffId;
            updatedRow.staffPaidBreak = this.staffOptions.find(
              (rec) => rec.value == value
            ).staffPaidBreak;
             updatedRow.billablehours =this.getFinalDuration(this.addShiftData.AddShiftDuration, this.addShiftData.AddShiftDuration >=5 ? 0.5:0,updatedRow.staffPaidBreak)
            /* 
          const isOverlapping = await this.getOverLappingdata(updatedRow.staff);
          if (isOverlapping) {
            return row; // 🚫 stop update, keep old row
          }

          const isValid = await this.checkShiftSetHours(null, updatedRow.staff);
          if (!isValid) {
            return row; // 🚫 stop update, keep old row
          } */
          } else if (field === "serviceitem") {
            updatedRow.serviceitem = value;
            updatedRow.unitprice = event.currentTarget.dataset.unit || 0;
            if (
              this.AddShiftRecurringCheckboxValue == true &&
              this.AddShiftIncludePartcipants == false
            ) {
              this.AddShiftIncludePartcipants = true;
            }

            const amount = (
              (updatedRow.unitprice || 0) * (updatedRow.billablehours || 0)
            ).toFixed(2);
            updatedRow.amount = amount;
          } else if (field === "customshift") {
            updatedRow.shifttype = value;
            updatedRow.customshiftlabel = value;
          }

          return updatedRow;
        }
        return row;
      })
    );
  }

  closeModal() {
    this.showserviceitemmodal = false;
  }

  handleUnitPriceOrHoursChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const value = parseFloat(event.target.value) || 0;
    const field = event.target.dataset.field;

    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        const updatedRow = {
          ...row,
          [field]: value
        };

        // Recalculate amount whenever either field changes
        const amount = (
          (updatedRow.unitprice || 0) * (updatedRow.billablehours || 0)
        ).toFixed(2);
        updatedRow.amount = amount;

        return updatedRow;
      }
      return row;
    });
  }
  handleHourlyRateChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const value = parseFloat(event.target.value) || 0;
    const field = event.target.dataset.field;

    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        const updatedRow = {
          ...row,
          [field]: value
        };
        updatedRow.rowOnchangeOccured = true;

        return updatedRow;
      }
      return row;
    });
  }

  async handleDeleteConfirmation(event) {
    const action = event.currentTarget.dataset.value;
    const index = parseInt(event.currentTarget.dataset.index, 10);

    console.log("⚡ Delete action triggered");
    console.log(
      "👉 Event dataset:",
      JSON.stringify(event.currentTarget.dataset)
    );
    console.log("👉 Index from dataset:", index);
    console.log("👉 Action from dataset:", action);

    this.participantServiceDeleteInfo = {};
     console.log(' shift status ==> '+this.addShiftData.AddShiftStatus)
     if(this.addShiftData.AddShiftStatus =='InProgress' || this.addShiftData.AddShiftStatus =='Completed' ){
       this.confirMationMessage(
        "Warning",
        "Service or shift cannot be deleted when the status is In Progress or Completed.",
        "Warning"
      );
      return;
     }

    // Log current row data
    //console.log("📋 AddShiftAndServices full list:", JSON.stringify(this.AddShiftAndServices));
    console.log(
      "📋 Row at index:",
      JSON.stringify(this.AddShiftAndServices[index])
    );
    const row = this.AddShiftAndServices[index];
    this.participantServiceDeleteInfo = {
      partcipantName: row.participantlabel,
      serviceId: row.serviceId,
      serviceName: row.serviceitemlabel,
      index: index
    };

    if (this.participantServiceDeleteInfo.serviceId) {
      console.log(
        "✅ participantServiceDeleteInfo populated:",
        JSON.stringify(this.participantServiceDeleteInfo)
      );

      this.ServiceWarningMessage = true;
      console.log(
        "⚠️ ServiceWarningMessage set to:",
        this.ServiceWarningMessage
      );
    } else {
      this.ServiceWarningMessage = false;
      if (this.AddShiftAndServices.length === 1) {
        this.showToast("Warning", "Cannot delete the last row", "warning");
        return;
      }
      this.AddShiftAndServices = this.AddShiftAndServices.filter(
        (_, i) => i !== index
      );
      if (this.addShiftData.AddShiftType === "Custom") {
        const { enrichedSegments, updatedServices } =
          await this.prepareAndValidateCustomShifts();
      }
    }
  }

  handleDeleteService(event) {
    this.isShowSpinner = true;

    // safety check
    if (!this.participantServiceDeleteInfo?.serviceId) {
      console.warn("⚠️ No serviceId found to delete.");
      this.isShowSpinner = false;
      return;
    }

    // Case 1: more than 1 row → delete + remove from array
    if (this.AddShiftAndServices.length > 1) {
      console.log(
        "🗑️ Deleting row at index:",
        this.participantServiceDeleteInfo.index
      );

      deleteRecord(this.participantServiceDeleteInfo.serviceId)
        .then(() => {
          this.confirMationMessage(
            "Success",
            "Service for " +
              this.participantServiceDeleteInfo.partcipantName +
              " deleted successfully.",
            "Success"
          );

          this.AddShiftAndServices = this.AddShiftAndServices.filter(
            (_, i) => i !== this.participantServiceDeleteInfo.index
          );
        })
        .catch((error) => {
          console.error("❌ Error deleting service:", error);
          this.confirMationMessage(
            "Error",
            "Failed to delete service.",
            "Error"
          );
        })
        .finally(async () => {
          this.isShowSpinner = false;
          this.ServiceWarningMessage = false;

          if (this.addShiftData.AddShiftType === "Custom") {
            const { enrichedSegments, updatedServices } =
              await this.prepareAndValidateCustomShifts();
          }
        });

      // Case 2: only 1 row → delete + clear row
    } else {
      console.log(
        "⚠️ Only one row left, deleting record but clearing row instead of removing."
      );

      deleteRecord(this.participantServiceDeleteInfo.serviceId)
        .then(() => {
          this.confirMationMessage(
            "Success",
            "Service for " +
              this.participantServiceDeleteInfo.partcipantName +
              " deleted successfully (row cleared).",
            "Success"
          );

          this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) =>
            i === 0
              ? {
                  ...row, // keep any hidden props like id/index
                  participant: "",
                  participantlabel: "Select Participant",
                  participantsearch: "",
                  servicetype: "",
                  servicetypelabel: "Select Service Type",
                  servicetypesearch: "",
                  serviceitem: "",
                  serviceitemlabel: "Select Service Item",
                  serviceId: "",
                  unitprice: 0
                }
              : row
          );

          // Refresh staff data
          this.refreshStaffData();
        })
        .catch((error) => {
          console.error("❌ Error deleting service:", error);
          this.confirMationMessage(
            "Error",
            "Failed to delete service.",
            "Error"
          );
        })
        .finally(async () => {
          this.isShowSpinner = false;
          this.ServiceWarningMessage = false;

          if (this.addShiftData.AddShiftType === "Custom") {
            const { enrichedSegments, updatedServices } =
              await this.prepareAndValidateCustomShifts();
          }
        });
    }
  }

  get computedStaticChecklist() {
    return this.staticChecklistItems.map((item) => {
      return {
        ...item,
        // Check if any checklist row matches either by ID or by description
        checked: this.ChekListrows.some(
          (row) =>
            row.id === item.id ||
            (row.isCreatedFromStatic && row.description === item.label)
        )
      };
    });
  }

  handleStaticChecklistToggle(event) {
    const itemId = event.target.dataset.id;
    const itemLabel = event.target.dataset.label;
    const isChecked = event.target.checked;

    // Check if item exists by ID or by description (for static items)
    const rowToToggle = this.ChekListrows.find(
      (row) =>
        row.id === itemId ||
        (row.isCreatedFromStatic && row.description === itemLabel)
    );

    if (isChecked && !rowToToggle) {
      // Add new static row
      this.ChekListrows = [
        ...this.ChekListrows,
        {
          id: itemId, // Use the static ID
          index: this.ChekListrows.length + 1,
          description: itemLabel,
          mandatory: false,
          isCreatedFromStatic: true
        }
      ];
      this.updateIndexes();
    } else if (!isChecked && rowToToggle) {
      // ✅ If row has checkListId, add to deletedChecklist before removing
      if (rowToToggle.checkListId) {
        if (!this.deletedChecklist) {
          this.deletedChecklist = [];
        }
        this.deletedChecklist = [...this.deletedChecklist, rowToToggle];
        console.log(
          "Updated deletedChecklist:",
          JSON.stringify(this.deletedChecklist)
        );
      }

      // Remove the row
      this.ChekListrows = this.ChekListrows.filter(
        (row) =>
          !(
            row.id === itemId ||
            (row.isCreatedFromStatic && row.description === itemLabel)
          )
      );
      this.updateIndexes();
    }

    console.log("check list " + JSON.stringify(this.ChekListrows));
  }

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }
  async handleGroupShiftTimeChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const field = event.target.dataset.field;
    const ampm = event.target.dataset.amapm;
    const childData = event.detail;
    console.log(" child timings  ==>" + JSON.stringify(childData));
   console.log(' add shift service before  ==> '+JSON.stringify(this.AddShiftAndServices));

    // Update the changed field
    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      // Update the time field if it's the edited row
      if (i === index) {
        row = {
          ...row,
          [field]: childData.twentyFourHourFormat,
          [ampm]: childData.displaytime
        };
          console.log("Row after applying change:", JSON.stringify(row));
      }

      const formatStartTimes = row.starttime
        ? this.convertToAmPmObject(row.starttime)
        : null;
      const formatEndTimes = row.endtime
        ? this.convertToAmPmObject(row.endtime)
        : null;
        console.log('formatStartTimes ==>'+JSON.stringify(formatStartTimes));
     console.log('formatEndTimes ==>'+JSON.stringify(formatEndTimes));
      return {
        ...row,
        startTimeSelectedHour: formatStartTimes?.selectedHour || null,
        startTimeSelectedMinute: formatStartTimes?.selectedMinute || null,
        startTimeSelectedAmPm:  formatStartTimes?.selectedAmPm.toUpperCase() ,
        startTimeDisplayTime: formatStartTimes?.displayTime || "Select Time",

        endTimeSelectedHour: formatEndTimes?.selectedHour ||null,
        endTimeSelectedMinute: formatEndTimes?.selectedMinute || null,
        endTimeSelectedAmPm:  formatEndTimes?.selectedAmPm.toUpperCase(),
        endTimeDisplayTime: formatEndTimes?.displayTime || "Select Time",

        shifttype:
          this.addShiftData.AddShiftType == "Custom"
            ? row.shifttype
            : this.addShiftData.AddShiftType
      };
    });

    console.log(
      `Updated SPLIT SHIFTS AFTER ENTER:\n${JSON.stringify(this.AddShiftAndServices)}`
    );
    if (this.AddShiftAndServices.length > 0) {
      console.log("=== STARTING VALIDATION ===");
      console.log("shiftStartDate:", this.addShiftData.AddShiftStartDate);
      console.log("shiftStartTime:", this.addShiftData.AddShiftStartTime);
      console.log("shiftEndDate:", this.addShiftData.AddShiftEndDate);
      console.log("shiftEndTime:", this.addShiftData.AddShiftEndTime);
      console.log("staffId:", this.addShiftData.AddShiftStaffValue);
      console.log("segments count:", this.AddShiftAndServices.length);
      console.log("segments data:", JSON.stringify(this.AddShiftAndServices));

      if (this.addShiftData.AddShiftType === "Custom") {
        const result = await this.prepareAndValidateCustomShifts();
        console.log("✅ Raw Result:", JSON.stringify(result));
      }
      if (this.splitShift == true) {
        const isValid = await this.validateSplitShiftsSegments();
        if (!isValid) {
          return; // stop further processing if validation failed
        }
      }
    } else {
      console.log("No segments to validate");
    }
  }

  formattedLongShifts(enrichedSegments, staffBreak) {
    console.log("break times ==>", staffBreak);
    if (enrichedSegments.length > 0) {
      const shiftTypeMap = {};
      const typeCount = {};

      enrichedSegments.forEach((row, idx) => {
        const baseType = row.shifttype || "Custom"; // fallback if missing
        if (!typeCount[baseType]) {
          typeCount[baseType] = 1;
        } else {
          typeCount[baseType]++;
        }

        const uniqueKey =
          typeCount[baseType] === 1
            ? baseType
            : `${baseType} ${typeCount[baseType]}`;

        shiftTypeMap[uniqueKey] = {
          ...row,
          duration: this.getFinalDuration(
            row.duration,
            row.duration >= 5 ? 0.5 : 0,
            staffBreak
          ),
          index: idx
        };
      });

      this.LongShiftTimeSlots = shiftTypeMap;
    }
    console.log(
      "Long shifts rows before creation  " +
        JSON.stringify(this.LongShiftTimeSlots)
    );
  }

  async validateSplitShiftsSegments() {
    console.log("=== VALIDATION start ===");
    try {
      const result = await validateAndEnrichShifts({
        shiftStartDate: this.addShiftData.AddShiftStartDate,
        shiftStartTime: this.addShiftData.AddShiftStartTime,
        shiftEndDate: this.addShiftData.AddShiftEndDate,
        shiftEndTime: this.addShiftData.AddShiftEndTime,
        segmentsJson: JSON.stringify(this.AddShiftAndServices),
        staffId: this.addShiftData.AddShiftStaffValue
      });

      console.log("=== VALIDATION RESULT ===");
      console.log("isValid:", result.isValid);
      console.log("errorMessage:", result.errorMessage);
      console.log(
        "enrichedSegments count:",
        result.enrichedSegments ? result.enrichedSegments.length : 0
      );
      console.log("Full validation result:", JSON.stringify(result));

      if (result.isValid) {
        console.log("✅ Validation successful");

        // Update AddShiftAndServices with enriched values
        this.AddShiftAndServices = this.AddShiftAndServices.map((rec) => {
          let segmentResult = result.enrichedSegments.find(
            (seg) => seg.id === rec.id
          );

          if (segmentResult) {
            if (
              this.addShiftData.AddShiftType != "Sleepover Shift" &&
              segmentResult.duration > this.addshiftMaxDuration  && this.addshiftMaxDuration  !=0
            ) {
              this.confirMationMessage(
                "Error",
                "This shift exceeds the maximum allowed duration of " +
                  this.addshiftMaxDuration +
                  " hours. Please shorten the shift or contact your Facility Admin to override this restriction.",
                "Error"
              );
            }

            return {
              ...rec,
              billablehours: this.getFinalDuration(
                segmentResult.duration,
                segmentResult.duration >= 5 ? 0.5 : 0,
                rec.staffPaidBreak
              ),
              startdate: segmentResult.startDate,
              enddate: segmentResult.endDate,
              hourlyrate: segmentResult.hourlyRate
            };
          } else {
            console.warn(
              "No matching enriched segment found for record ID:",
              rec.id
            );
            return rec;
          }
        });

        console.log(
          "Updated AddShiftAndServices:",
          JSON.stringify(this.AddShiftAndServices)
        );
        return true; // indicate success
      } else {
        console.error("❌ Validation failed:", result.errorMessage);
        this.confirMationMessage("Error", result.errorMessage, "Error");
        return false; // indicate failure
      }
    } catch (error) {
      console.error("=== VALIDATION ERROR ===");
      console.error("Error message:", error.message);
      console.error(
        "Error body:",
        error.body ? JSON.stringify(error.body) : "No body"
      );
      console.error("Error stack:", error.stack);

      if (
        error.body &&
        error.body.message &&
        error.body.message.includes("Unable to find Apex action method")
      ) {
        console.error("❌ APEX METHOD NOT FOUND - Check class/method name");
        console.error(
          "Expected method: SplitShiftValidations.validateAndEnrichShifts"
        );
      }
      return false;
    }
  }

  handleAddressSelection(event) {
    const addressType = event.currentTarget.dataset.type;
    const index = parseInt(event.currentTarget.dataset.index, 10);
    this.activeRowIndex = index;

    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        return {
          ...row,
          addressType: addressType,
          // Clear any existing address when changing type
          address: null,
          facilityIconClass:
            addressType === "facility"
              ? "material-icons add-icon selected-address-icon-facility"
              : "material-icons add-icon",
          participantIconClass:
            addressType === "participant"
              ? "material-icons add-icon selected-address-icon-participant"
              : "material-icons add-icon",
          newIconClass:
            addressType === "new"
              ? "material-icons add-icon selected-address-icon-new"
              : "material-icons add-icon"
        };
      }
      return row;
    });

    if (addressType === "facility") {
      this.handleFacilityAddressSelection(index);
      this.facilityAddressDisable = true;
      this.isDisableParticipantCheckBox = true;
      this.newAddressDisable = true;
    } else if (addressType === "participant") {
      this.handleParticipantAddressSelection(index);
      this.facilityAddressDisable = true;
      this.isDisableParticipantCheckBox = true;
      this.newAddressDisable = true;
    } else if (addressType === "new") {
      this.addNewAddressCheckBox = true;
      this.activeRowIndex = index;
      this.addShiftData.AddShiftEnterOtherLocation = true;
      this.addShiftData.AddShiftParticipantAddressCheckbox = false;
      this.facilityAddressCheckbox = false;
      this.participantAddressCheckBox = false;
      this.facilityAddressDisable = true;
      this.isDisableParticipantCheckBox = true;
      this.newAddressDisable = false;
      this.EmptyAddressFields();
    }
  }

  async getFacilityAddress(facilityId) {
    try {
      const result = await getFacilityAddress({ facilityId: facilityId });

      if (result && result.length > 0) {
        const facility = result[0];
        const addressData = {
          street: facility.Address__Street__s,
          citySuburb: facility.Address__City__s,
          provinceState: facility.Address__StateCode__s,
          postalcode: facility.Address__PostalCode__s,
          country:
            facility.Address__CountryCode__s == "AU"
              ? "Australia"
              : facility.Address__CountryCode__s
        };

        return {
          success: true,
          address: addressData,
          facility: facility
        };
      } else {
        return {
          success: false,
          error: "No facility found with the provided ID"
        };
      }
    } catch (error) {
      console.error("Error fetching facility address:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch facility address"
      };
    }
  }

  async fetchGeocode(addressData) {
    try {
      console.log("this.street >>", addressData.street);
      console.log("this.city >>", addressData.citySuburb);
      console.log("this.postalCode >>", addressData.postalcode);

      const fullAddress = `${addressData.street}, ${addressData.citySuburb} ${addressData.postalcode}, ${addressData.country || "AU"}`;
      const apiKey = GOOGLE_API_KEY;
      const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

      console.log("Fetching geocode for:", fullAddress);

      const response = await fetch(endpoint);
      const data = await response.json();

      console.log("Geocode API response:", data);

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const geocodedAddress = {
          ...addressData,
          latitude: location.lat,
          longitude: location.lng
        };

        console.log("Parsed coordinates:", location.lat, location.lng);
        console.log("Geocoded address:", JSON.stringify(geocodedAddress));
        this.jsonData2 = [
          { coords: { latitude: location.lat, longitude: location.lng } }
        ];

        console.log(
          "jsonData prepared for map:",
          JSON.stringify(this.jsonData2)
        );

        // ✅ Call your existing function
        this.setLatitudeLongitudeMarkersOnly();

        return {
          success: true,
          address: geocodedAddress,
          rawResponse: data
        };
      } else {
        console.warn("No geocode results found or status not OK");
        return {
          success: false,
          error: data.status || "Geocoding failed",
          rawResponse: data
        };
      }
    } catch (error) {
      console.error("Error calling Geocode API:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch geocode"
      };
    }
  }

  // Usage in your original method
  async fetchFacilityAddressAndGeocode() {
    const facilityId = this.addShiftData.AddShiftFacilityValue;
    const facilityResult = await this.getFacilityAddress(facilityId);

    if (facilityResult.success) {
      this.address = { ...this.address, ...facilityResult.address };

      // Fetch geocode for the address
      const geocodeResult = await this.fetchGeocode(this.address);
      if (geocodeResult.success) {
        this.address = { ...this.address, ...geocodeResult.address };
      } else {
        console.warn("Geocoding failed:", geocodeResult.error);
      }
      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
         address: this.address,
        addressSource: "Facility"
      }));
      console.log(
        " this.AddShiftAndServices ==>  " +
          JSON.stringify(this.AddShiftAndServices)
      );
    } else {
      console.error("Failed to get facility address:", facilityResult.error);
    }
  }

  async handleFacilityAddressSelection(index) {
    const facilityId = this.addShiftData.AddShiftFacilityValue;

    const facilityResult = await this.getFacilityAddress(facilityId);

    if (facilityResult.success) {
      // Update the row with facility address
      this.updateRowAddress(index, facilityResult.address, "Facility");
      console.log("Row address updated successfully");

      console.log("Fetching geocode for facility address...");
      this.addNewAddressCheckBox = false;
      this.addShiftData.AddShiftEnterOtherLocation = false;
      this.addShiftData.AddShiftParticipantAddressCheckbox = false;
      this.facilityAddressCheckbox = true;
      this.participantAddressCheckBox = false;
      // Fetch geocode for the address
      const geocodeResult = await this.fetchGeocode(facilityResult.address);

      if (geocodeResult.success) {
        // Update row with geocoded coordinates if needed
        this.updateRowWithGeocode(index, geocodeResult.address);
        console.log("Row geocode update completed");
      } else {
        console.log("Geocode failed with error:", geocodeResult.error);
      }
    } else {
      console.error("Failed to get facility address:", facilityResult.error);
      console.error("Error details:", JSON.stringify(facilityResult));
    }

    console.log("handleFacilityAddressSelection completed for index:", index);
  }

  // Helper method to update row with geocode data
  updateRowWithGeocode(index, geocodedAddress) {
    console.log("updateRowWithGeocode called with index:", index);

    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        console.log("Updating row at index:", i);
        const updatedRow = {
          ...row,
          address: {
            ...row.address,
            latitude: geocodedAddress.latitude,
            longitude: geocodedAddress.longitude
          }
        };
        console.log(
          "Updating row adress  at index:",
          JSON.stringify(updatedRow)
        );
        this.address = {
          latitude: geocodedAddress.latitude,
          longitude: geocodedAddress.longitude,
          street: row.address.street,
          citySuburb: row.address.citySuburb,
          postalcode: row.address.postalcode,
          provinceState: row.address.provinceState,
          country: row.address.country || "Australia"
        };

        return updatedRow;
      }

      return row;
    });

    console.log(
      "AddShiftAndServices after geocode update:",
      JSON.stringify(this.AddShiftAndServices)
    );
    console.log(
      "Geocoded address in facility change:",
      JSON.stringify(this.AddShiftAndServices)
    );
  }

  // Helper method to update row address
  updateRowAddress(index, addressData, source) {
    console.log(
      "updateRowAddress called with index:",
      index,
      "source:",
      source
    );

    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        console.log("Updating row at index:", i);
        const updatedRow = {
          ...row,
          address: addressData,
          addressSource: source,
          addressDisplay: `${addressData.street}, ${addressData.citySuburb}, ${addressData.provinceState}, ${addressData.postalcode}`
        };
        console.log("Row after address update:", JSON.stringify(updatedRow));
        return updatedRow;
      }
      return row;
    });

    console.log(
      "AddShiftAndServices after address update:",
      JSON.stringify(this.AddShiftAndServices)
    );
  }

  // Usage for participant address with geocoding
  async getParticipantAddress(participantId) {
    try {
      const result = await getClientById({ recordId: participantId });

      if (result && result.length > 0) {
        const participant = result[0];
        const addressData = {
          street: participant.Address__Street__s,
          citySuburb: participant.Address__City__s,
          provinceState: participant.Address__StateCode__s,
          postalcode: participant.Address__PostalCode__s,
          country:
            participant.Address__CountryCode__s == "AU"
              ? "Australia"
              : participant.Address__CountryCode__s
        };

        return {
          success: true,
          address: addressData,
          participant: participant
        };
      } else {
        return {
          success: false,
          error: "No participant found with the provided ID"
        };
      }
    } catch (error) {
      console.error("Error fetching participant address:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch participant address"
      };
    }
  }

  async handleParticipantAddressSelection(index) {
    console.log("index value ==> " + index);
   /*  console.log(
      " this.AddShiftAndServices " + JSON.stringify(this.AddShiftAndServices)
    ); */
    const participantId = this.AddShiftAndServices[index].participant;
    console.log("participantId==> " + participantId);

    /*   if (!participantId) {
        console.error('No participant selected for this row');
        return;
    } */

    const participantResult = await this.getParticipantAddress(participantId);

    if (participantResult.success) {
      this.updateRowAddress(index, participantResult.address, "Participant");
      this.addNewAddressCheckBox = false;
      this.addShiftData.AddShiftEnterOtherLocation = true;
      this.addShiftData.AddShiftParticipantAddressCheckbox = true;
      this.facilityAddressCheckbox = false;
      this.participantAddressCheckBox = true;

      // Fetch geocode for the address
      const geocodeResult = await this.fetchGeocode(participantResult.address);
      if (geocodeResult.success) {
        this.updateRowWithGeocode(index, geocodeResult.address);
      }

      // Enable save button and validate if needed
      
    } else {
      console.error(
        "Failed to get participant address:",
        participantResult.error
      );
      this.EmptyAddressFields();
      this.participantAddressCheckBox = false;
      this.confirMationMessage(
        "Error",
        "Please select a valid participant",
        "Error"
      );
     
    }
  }

  async addressInputChange(event) {
    console.log("addressInputChange called, splitShift:", this.splitShift);
    console.log("Event detail:", JSON.stringify(event.detail));

    if (this.splitShift) {
      // splitShift = true → Table row address (for split shifts)
      await this.updateTableRowAddress(event.detail);
    } else {
      // splitShift = false → Main address (for regular shifts)
      await this.updateMainAddress(event.detail);
    }

    console.log("addressInputChange completed");
  }

  async updateMainAddress(addressDetail) {
    console.log("Updating main address");
    return await this.updateAddress(addressDetail, true);
  }

  // Simplified table row address update
  async updateTableRowAddress(addressDetail) {
    console.log(
      "Updating table row address, activeRowIndex:",
      this.activeRowIndex
    );

    if (this.activeRowIndex !== null) {
      return await this.updateAddress(
        addressDetail,
        false,
        this.activeRowIndex
      );
    } else {
      console.warn("No active row index found for address update");
      return false;
    }
  }

  // Unified method to update address (main or table row)
  async updateAddress(addressDetail, isMainAddress = true, index = null) {
    if (!isMainAddress) {
      // Changed from isMainAddress to !isMainAddress
      // Update table row address (for split shifts)
      if (index !== null) {
        this.updateRowAddressFromEvent(index, addressDetail);
        console.log("Table row address updated successfully");

        // Fetch geocode for table row
        const rowAddress = this.AddShiftAndServices[index].address;
        return await this.fetchGeocodeForAddress(rowAddress, false, index);
      } else {
        console.warn("No active row index found for address update");
        return false;
      }
    } else {
      // Update main address (for regular shifts)
      this.address = {
        ...this.address,
        street: addressDetail.street,
        citySuburb: addressDetail.city,
        postalcode: addressDetail.postalCode,
        provinceState: addressDetail.province,
        country: addressDetail.country || "Australia"
      };
      console.log("Main address after update:", JSON.stringify(this.address));

      // Fetch geocode for main address
      return await this.fetchGeocodeForAddress(this.address, true);
    }
  }

  // Unified geocode method
  async fetchGeocodeForAddress(
    addressData,
    isMainAddress = true,
    index = null
  ) {
    console.log("Fetching geocode for address...");
    const geocodeResult = await this.fetchGeocode(addressData);

    if (geocodeResult.success) {
      if (!isMainAddress && index !== null) {
        this.updateRowWithGeocode(index, geocodeResult.address);
        console.log("Table row geocode completed");
      } else if (isMainAddress) {
        this.address = { ...this.address, ...geocodeResult.address };
       this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
        address: this.address,
        addressSource: "New",
       
      }));
        console.log("Main address geocode completed");
      }
      return true;
    }
    console.log("Geocode failed");
    return false;
  }

  // Simplified main address update

  // Shared helper method to update row address from event
  updateRowAddressFromEvent(index, addressDetail) {
    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      if (i === index) {
        const updatedAddress = {
          ...row.address,
          street: addressDetail.street,
          citySuburb: addressDetail.city,
          postalcode: addressDetail.postalCode,
          provinceState: addressDetail.province,
          country: addressDetail.country || "Australia"
        };

        return {
          ...row,
          address: updatedAddress,
          addressSource: "New",
          addressDisplay: `${addressDetail.street}, ${addressDetail.city}, ${addressDetail.province}, ${addressDetail.postalCode}`
        };
      }
      return row;
    });
    this.activeRowIndex = null;
  }
  async handleParticipantAddressSelectionMulti(participantValue) {
    try {
     // const participantId =participantValue ; // use tracked variable instead of index
      if (!participantValue) {
        console.error("No participant selected");
        return;
      }

      // Fetch participant address
      const participantResult = await this.getParticipantAddress(participantValue);

      if (!participantResult.success) {
        console.error(
          "Failed to get participant address:",
          participantResult.error
        );
        this.EmptyAddressFields();
        this.participantAddressCheckBox = false;
        this.confirMationMessage(
          "Error",
          "Please select a valid participant",
          "Error"
        );
        this.isDisableSaveButton = true;
        return;
      }

      const addressData = participantResult.address;

      // Fetch geocode for the address
      const geocodeResult = await this.fetchGeocode(addressData);

      let finalAddress = { ...addressData };
      if (geocodeResult.success) {
        finalAddress = {
          ...finalAddress,
          latitude: geocodeResult.address.latitude,
          longitude: geocodeResult.address.longitude
        };
      }

      // Update all rows with this address
      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
        address: finalAddress,
        addressSource: "Participant",
        addressDisplay: `${finalAddress.street}, ${finalAddress.citySuburb}, ${finalAddress.provinceState}, ${finalAddress.postalcode}`
      }));

      // Update top-level this.address
      this.address = {
        latitude: finalAddress.latitude,
        longitude: finalAddress.longitude,
        street: finalAddress.street,
        citySuburb: finalAddress.citySuburb,
        postalcode: finalAddress.postalcode,
        provinceState: finalAddress.provinceState,
        country: finalAddress.country || "Australia"
      };

      // Update UI flags
      this.addNewAddressCheckBox = false;
      this.addShiftData.AddShiftEnterOtherLocation = true;
      this.addShiftData.AddShiftParticipantAddressCheckbox = true;
      this.facilityAddressCheckbox = false;
      this.participantAddressCheckBox = true;

     
      console.log(
        "All rows updated with participant address:",
        JSON.stringify(this.AddShiftAndServices)
      );
      console.log("Top-level address:", JSON.stringify(this.address));
    } catch (error) {
      console.error("Error in handleParticipantAddressSelection:", error);
      this.EmptyAddressFields();
      this.confirMationMessage(
        "Error",
        "Something went wrong while fetching address",
        "Error"
      );
     
    }
  }
  handleShiftCreationParticipantView(event) {
    // this.shiftCreationParticipantView = true;
    this.isStaffView = false;
  }
  handleParticipantViewBack() {
    this.isStaffView = true;
    this.isHome = true;
    this.isParticipanTViewEnable = true;
  }
  // Handle "Yes" button in fatigue modal
  handleFinalAllocate() {
    if (this.pendingSaveOperation) {
      // Mark the row as fatigue confirmed
      if (this.pendingRowIndex !== null) {
        this.AddShiftAndServices[this.pendingRowIndex].fatigueConfirmed = true;
      }

      this.pendingSaveOperation = false;
      this.fatigueManagementFlag = false;
      this.handleSave(); // Retry the save operation
    } else if (this.pendingAddRowOperation) {
      // Mark the row as fatigue confirmed
      if (this.pendingRowIndex !== null) {
        this.AddShiftAndServices[this.pendingRowIndex].fatigueConfirmed = true;
      }

      this.pendingAddRowOperation = false;
      this.fatigueManagementFlag = false;
      this.continueAddServiceRow(); // Continue adding row
    }
  }

  // Handle "No" button in fatigue modal
  handleDeselectStaff() {
    // Simply remove staff from previous row if it was an add row operation
    if (this.pendingAddRowOperation && this.pendingRowIndex !== null) {
      this.AddShiftAndServices[this.pendingRowIndex].staff = null;
      this.AddShiftAndServices[this.pendingRowIndex].stafflabel =
        "Select Staff";
      this.AddShiftAndServices[this.pendingRowIndex].fatigueConfirmed = false; // Reset fatigue flag
    }
    if (this.addShiftData.AddShiftType === "Custom" || this.splitShift) {
      this.addShiftData.AddShiftStaffValue = null;
    }

    // Reset all flags
    this.pendingSaveOperation = false;
    this.pendingAddRowOperation = false;
    this.pendingStaffName = null;
    this.pendingRowIndex = null;
    this.fatigueManagementFlag = false;
  }

  // Continue adding row after fatigue check
  continueAddServiceRow() {
    // Add new row (rest of the handleAddServiceRow logic without validations)
    this.AddShiftAndServices = [...this.AddShiftAndServices, this.initRow()];

    if (this.splitShift || this.addShiftData.AddShiftType === "Custom") {
      const staffLabel = this.AddShiftAndServices[0].stafflabel;

      if (this.splitShift) {
        this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
          ...row,
          stafflabel: staffLabel,
          staff: this.addShiftData.AddShiftStaffValue
        }));
      }

      if (this.addShiftData.AddShiftType === "Custom") {
        const lastIndex = this.AddShiftAndServices.length - 1;
        let lastRow = { ...this.AddShiftAndServices[lastIndex] };
        lastRow.shifttype = "Morning";
        lastRow.hourlyrate = 0;
        lastRow.rateLabel =
          lastRow.Shift_Type__c === "Sleepover Shift" ? "Allowance" : "Rate";
        lastRow.customshiftlabel = "Morning";
        lastRow.billablehours = 0;
        this.AddShiftAndServices[lastIndex] = lastRow;
      }
    }
  }

  getFinalDuration(duration, breakTime, paidBreak) {
    const d = Number(duration) || 0;
    const b = Number(breakTime) || 0;

   /*  console.log("👉 Input Duration:", duration);
    console.log("👉 Input Break:", breakTime);
    console.log("👉 Paid Break flag:", paidBreak);
    console.log("👉 Parsed Duration (d):", d);
    console.log("👉 Parsed Break (b):", b);
 */
    if (paidBreak === true) {
     // console.log("✅ Staff has paid break → Returning Duration only");
      return d;
    } else {
      /* console.log("❌ Staff does NOT have paid break → Subtracting Break");
      console.log(`⏱ Final Duration = ${d} - ${b} = ${d - b}`); */
      return d - b;
    }
  }
}