import { LightningElement, track, wire, api } from "lwc";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import fetchFacilitiessForRoster from "@salesforce/apex/HrHomeHandler.fetchFacilitiessForRoster";
import getStaffData from "@salesforce/apex/AddShiftStaffView.getStaffData";
import getNumberOfRecurrences from "@salesforce/apex/RosterCreationRecurringHnadler.getNumberOfRecurrences";
import StaffsRolesWiseList from "@salesforce/apex/StaffController.StaffsRolesWiseList";
//import createAddShift from "@salesforce/apex/RosterCreation.createAddShift";
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
import validateStaffAvailabilityWithReasons from '@salesforce/apex/RosterCreation.validateStaffAvailabilityWithReasons';
import fetchBulkRoles from '@salesforce/apex/FacilityController.fetchBulkRoles';
import getDragDrogShifts from '@salesforce/apex/RostersPublishAndAssignHandler.getDragDrogShifts';
import saveRoleOrder from '@salesforce/apex/StaffAvailabilityController.saveRoleOrder';
import getRoleOrder from '@salesforce/apex/StaffAvailabilityController.getRoleOrder';
import getShiftDataByShiftId from '@salesforce/apex/AddShiftController.getShiftDataByShiftId';
import updateShiftCancellation from '@salesforce/apex/AddShiftController.updateShiftCancellation';
import deleteShiftNotification from '@salesforce/apex/AddShiftStaffView.deleteShiftNotification';
import checkShiftWithinAvailability from '@salesforce/apex/StaffAvailabilityValidation.checkShiftWithinAvailability';
import getStaffAvailability from '@salesforce/apex/StaffAvailabilityValidation.getStaffAvailability';
import saveTemplate from '@salesforce/apex/RosterTemplateController.saveTemplate';
import getTemplates from '@salesforce/apex/RosterTemplateController.getTemplates';
import createRosterTemplates from '@salesforce/apex/RosterTemplateController.createRosterTemplates';
import deleteRosterTemplate from '@salesforce/apex/RosterTemplateController.deleteRosterTemplate';
import getStaffWithApprovedLeaves from '@salesforce/apex/RosterTemplateController.getStaffWithApprovedLeaves';
import shiftComplianceValidations from '@salesforce/apex/ShiftComplianceController.shiftComplianceValidations';
import getServicesByShiftImperative from '@salesforce/apex/ServiceSupportPlanHandler.getServicesByShiftImperative';
import validateBrokenShiftSegments from '@salesforce/apex/BrokenShiftValidations.validateBrokenShiftSegments';
import getBrokenShiftsData from '@salesforce/apex/BrokenShiftValidations.getBrokenShiftsData';
import getRecurringShiftDates  from '@salesforce/apex/AddShiftStaffView.getRecurringShiftDates';
import getParticipantForms  from '@salesforce/apex/RosterFormsHandler.getParticipantForms';
import updateRecurringShiftChecklist  from '@salesforce/apex/AddShiftStaffView.updateRecurringShiftChecklist';
import updateMobielSetting  from '@salesforce/apex/FacilityController.updateMobielSetting';

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
  @track dragAndDropValiadtion=false;
  @track Orgid;
  @track state;

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
  @track hourlrRateLabel = "Rate($/hr)";
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
  @track childRejectedShifts = false;
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
  @track orginalShiftStaff='';
  @track shiftAddressInRosterSettings='';
  @track AddShiftArrayOriginal=[];
  @track shiftDeleteOrCancelOptions=[ { label: "Cancel Shift", value: "Cancel" },
                              { label: "Delete Shift", value: "Delete" }];
  @track isShiftDeleteCancel ='Delete';
  @track isShiftDeleteCancelTempalte=false;
  @track shiftDeleteCancelHeaderTemplate=false;
  @track shiftCanceltemplate=false;
  @track shiftDeleteTempalte=false;


  @track draggingStaffFatigueMessage = false;
  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  @track isShiftDragAndDrop = false;
  @track draggingShiftFatigueCheck = false;
  @track shiftCancellationPeriod=0;

  @track monthlyRosterShifts = [];

/*   get isMonthlyView() {
    return this.selectedViewType === 'monthly';
  }
 */
 

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
    { label: "Manager", value: "manager" }
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
  @track disableGroupShift  = false;
  @track disableSplitShift = false;

  StatusOptionsforfilter = [
    { label: "Completed", value: "Completed" },
    { label: "In Progress", value: "InProgress" },
    { label: "Accepted", value: "Accepted" },
    { label: "Unassigned", value: "Unassigned" },
    { label: "Cancelled", value: "Cancelled" }
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
  @track showErrorModal=false;
  @track staffDateConflicts = [];
  @track TimeInDragAndDrop;
  @track shiftRecurDeleteInCancel=false;
  @track unavailableStaffNames =[];
  @track unavailableTemplate=false;
  @track staffAvailabilityList=[];
  
  
  @track refreshTimestamp
 @track  selectedViewType = 'weekly';
  viewOptions = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Fortnightly', value: 'fortnightly' },
   { label: 'Monthly', value: 'monthly' }
  ];
  @track numberOfDays = 7;

   @track shifCancelData = {
    shiftLabel: "",
    staffName: "",
    participantName: "Unallocated",
    reason: "Other",
    cancelledBy: "Participant",
    staffPayment: 0,
    originalStaffValue: "0",
    originalParticipantValue: "0",
    note: "",
    shortNotice: "Yes",
    billParticipant: true
  };
   reasonOptions = [
    { label: "Participant Request", value: "Participant Request" },
    { label: "Staff Unavailable", value: "Staff Unavailable" },
    { label: "Provider Cancelled", value: "Provider Cancelled" },
    { label: "Medical Reason", value: "Medical Reason" },
    { label: "Weather", value: "Weather" },
    { label: "Other", value: "Other" },
  ];

  cancelledByOptions = [
    { label: "Participant", value: "Participant" },
    { label: "Admin", value: "Admin" }
  ];
   billOptions = [
        { label: "Yes - Bill participant", value: "yes" },
        { label: "No - No billing will occur", value: "no" }
    ];
    cancelModeOptions = [
  { label: 'Combined', value: 'combined' },
  { label: 'Individual', value: 'individual' }
];

  @track shiftTemplateFlag = false;

    // STEP CONTROL
    @track showOptions = false;
    @track showSaveForm = false;
    @track showTemplateList = false;

    // FORM FIELDS
    @track templateName;
    @track templateType = 'Weekly';
    @track shiftTemplateStartDate;
    @track shiftTemplateEndDate;
    @track showApplyTemplate = false;
    @track selectedTemplate;
    @track rosterTemplateProceedStartDate;
    @track rosterTemplateProceedEndDate;

    // RADIO VALUES
    @track selectedOption = '';

    // DATA
    @track RosterTemplates = [];
    @track copyParticipant = true;
    @track copyShiftNotes = true;
    @track copyChecklist = true;
    @track staffLeaves = [];
    @track showLeavesData = false;
    @track selectedShiftMode='Active';
    @track staffDateWarnings = [];
    @track showComplianceWarningModal = false;
    @track finalEndStaffRows
    @track finalEndRecurrenceDates;
    @track shiftPenaltyMode;
    @track brokenShift=false;
    @track disableBrokenShift=false;
    @track showExtendedBrokenUI = false;
    @track extendedBrokenMeta = {
        breakOne: 0,
        breakTwo: 0,
        doubleRate: 0,
        extraHours: 0,
        brokenBreakStartOne:null,
        brokenBreakEndOne:null,
        brokenBreakStartTwo:null,
        brokenBreakEndTwo:null,
    };
    @track employmentTypeInBrokenShift='';
    @track orignalShiftTime;
    @track recurringDatesForChild;
    @track showFormsModal = false;
     @track currentRowIndex = null;
    @track allParticipantForms = [];    
    @track selectedParticipantForms = [];
    @track recuringShiftsToDelete=[];
    @track openRecurCheckList=false;
    @track refreshparticipantview=false;
    @track showMobileSettings =false ;
    @track mobileSettingFacilityValue;
    @track enableSignIn=false;
    @track enableSignOut=false;

    // STEP 1 OPTIONS
    templateOptions = [
        { label: 'Save Current Template', value: 'save' },
        { label: 'View Saved Templates', value: 'view' }
    ];

    // TEMPLATE TYPE OPTIONS
    typeOptions = [
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Fortnightly', value: 'Fortnightly' }
    ];

    // Getter for radio-group value
    get billParticipantValue() {
        return this.shifCancelData.billParticipant ? "yes" : "no";
    }

    // Getter for radio checked logic
    get notBillParticipant() {
        return !this.shifCancelData.billParticipant;
    }

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
    statusList: "$statusfilterValue",
     refreshKey: "$refreshTimestamp" // Add this parameter
  })

  wiredStaffDataFunction(result) {
   this.staffData=[];
   this.wiredStaffData = result;
    if (result.data) {
      //console.log("Staff Data in the Roster Manger >>>", result.data);
      this.childRosterInvoices = false;

      let initializedData = result.data.map((role) => ({
        ...role,
        staffData: role.staffData.map((staff) => ({
          ...staff,
          shiftsByDay: (staff.shiftsByDay || []).map((day) => {
            let newUIGroup = day.newUIGroupOfShifts || [];
            let isAddShiftVisible = newUIGroup.length < 4;

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

      setTimeout(() => {
        this.isShowSpinner = false; // HIDE SPINNER WHEN DATA IS READY

      console.log("✅ Staff data initialized:", JSON.stringify(this.staffData));
    }, 1200);
    
    } else if (result.error) {
      console.error("❌ Error fetching staff data:", result.error);
      this.isShowSpinner = false; // HIDE SPINNER ON ERROR TOO
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
    console.log('Manage Invoice Started');
    this.loadStaffRoleOrder();
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
      this.state = userData.Address_Latest__StateCode__s;
      if (userType == "NDIS Org Admin") {
        fetchFacilitiessForRoster()
          .then((response) => {
            this.facilityOptions = response.map((record) => ({
              value: record.Id,
              label: record.Name,
              preferredName: record.Facility_Preferred_Name_Formula__c,
              participantPreferredName:
                record.Participant_Preferred_Name_Formla__c,
              staffPreferredName: record.Staff_Preferred_Name_Formula__c,
              shiftPenaltyMode:record.Shift_Penalty_Mode__c,
              shiftCancellationPeriod: record.Shift_Cancellation_Period__c
            }));

            console.log("facilityOptions ", this.facilityOptions);
            
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
            //  this.facilityValue.push(storedFacilityId);
             this.restoreFacilitySelection(storedFacilityId);
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
              record.Facility__r.Staff_Preferred_Name_Formla__c,
            shiftPenaltyMode:record.Facility__r.Shift_Penalty_Mode__c,
            shiftCancellationPeriod: record.Shift_Cancellation_Period__c
          }));

          fetchFacilitiessForRoster().then((response) => {
            this.organisationShiftTimes = response[0].Organisation__r;

          });
          if (this.facilityOptions.length > 0) {
          //  this.facilityValue.push(storedFacilityId);
            this.SelectedComboBoxFacility = storedFacilityId;
          }
          this.restoreFacilitySelection(storedFacilityId);
          
          this.fetchInitialData();
        });
      }
    });
  }
  restoreFacilitySelection(storedFacilityId) {
        console.log('--- START ---');

        const storedFacilities = localStorage.getItem('rosterFacilities');
        console.log('localStorage:', storedFacilities);

        let facilityArray = [];

        // Load existing
        if (storedFacilities) {
          try {
            const parsed = JSON.parse(storedFacilities);
            facilityArray = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.error('parse error');
          }
        }

        console.log('BEFORE:', JSON.stringify(facilityArray));
        console.log('INCOMING ID:', storedFacilityId);

        if (storedFacilityId) {
          facilityArray = facilityArray.filter(id => id !== storedFacilityId);
          facilityArray.push(storedFacilityId);
        }

        console.log('AFTER PUSH:', JSON.stringify(facilityArray));

        this.facilityValue = [...facilityArray]; // force reactivity
         localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue));

        console.log('FINAL facilityValue:', JSON.stringify(this.facilityValue));

        // 🔴 CRITICAL: check overwrite later
        setTimeout(() => {
          console.log('AFTER 1s facilityValue:', JSON.stringify(this.facilityValue));
        }, 1000);

        console.log('--- END ---');
      }


  @track rolesInternal;

  loadStaffRoleOrder() {
      getRoleOrder()
          .then(res => {

              console.log("Staff Role Order from Apex:", res);

              if (res) {
                  // Convert JSON string → Array
                  const roleOrderList = JSON.parse(res);

                  console.log("Parsed Role Order: ", roleOrderList);

                  // Use inside component
                  this.rolesInternal = roleOrderList;
                  console.log("Role Order (JSON):", JSON.stringify(this.rolesInternal));
              } else {
                  console.log("No saved order found.");
              }

          })
          .catch(error => {
              console.error("Error getting role order", error);
          });
  }

  fetchInitialData() {
      organizationDetails().then((response) => {
      this.orgId = response.listofPriceBook.Id;
      this.Orgid = response.listofPriceBook.Id;
      this.state = response.listofPriceBook.Address_Latest__StateCode__s;
       this.selectedViewType = localStorage.getItem("rosterViewType") || "weekly";
        console.log('this.selectedViewType in connected callback', this.selectedViewType );

           if (this.selectedViewType === 'monthly') {
              let startparts = this.weekDaysWithDates[0].weekDays.split("-");
            this.startDate = startparts[2] + "-" + startparts[1] + "-" + startparts[0];
                  this.isMonthlyView=true;
                  this.isStaffView = false;
                  this.isCalenderShiftView = false;
                  this.shiftReportsFlag = false;
                  this.isHome = false;
             }
    
    
      fetchBulkRoles({ facilityIDList: this.facilityValue })
        .then(facRoles => {
            console.log("facRoles " + JSON.stringify(facRoles));

            // Clear OrgNisationRoles first to avoid duplicates
           this.OrgNisationRoles = [];

          // Use Set to track unique role names
          let uniqueRoles = new Set();

          facRoles.forEach(rec => {
              if (!uniqueRoles.has(rec.Role_Name__c)) {
                  uniqueRoles.add(rec.Role_Name__c);

                  this.OrgNisationRoles.push({
                      label: rec.Role_Name__c,
                      value: rec.Role_Name__c
                  });
              }
          });

            this.RoleFilter = this.OrgNisationRoles;

            // Add "All" at the top
            let AllFilter = { value: "All", label: "All" };
            this.OrgNisationRoles = [AllFilter, ...this.OrgNisationRoles];

            console.log("Before Sorting this.OrgNisationRoles " + JSON.stringify(this.OrgNisationRoles));

            // -----------------------------------------------------------
            // 🔥 APPLY SAVED ROLE ORDER (rolesInternal)
            // -----------------------------------------------------------
            if (this.rolesInternal && this.rolesInternal.length > 0) {
                console.log("rolesInternal:", JSON.stringify(this.rolesInternal));

                // Convert string: ["Admin;Cleaner;AIN;..."]
                let savedOrderList = this.rolesInternal[0].split(";");

                console.log("Parsed savedOrderList:", savedOrderList);

                // Create a map for quick lookup
                const roleMap = new Map();
                this.OrgNisationRoles.forEach(role => {
                    roleMap.set(role.value, role);
                });

                let sortedRoles = [];

                // Add roles in saved order
                savedOrderList.forEach(roleName => {
                    if (roleMap.has(roleName)) {
                        sortedRoles.push(roleMap.get(roleName));
                        roleMap.delete(roleName);
                    }
                });

                // Add any leftover roles
                roleMap.forEach(role => {
                    sortedRoles.push(role);
                });

                // Move "All" to the top
                const indexAll = sortedRoles.findIndex(r => r.value === "All");
                if (indexAll > -1) {
                    const allItem = sortedRoles.splice(indexAll, 1)[0];
                    sortedRoles.unshift(allItem);
                }

                this.OrgNisationRoles = sortedRoles;
                console.log("After Sorting this.OrgNisationRoles:", JSON.stringify(this.OrgNisationRoles));
            }
            // -----------------------------------------------------------

            // Initialize arrays properly
            if (!this.chosenRole || !Array.isArray(this.chosenRole)) {
                this.chosenRole = [];
            }
            if (!this.SelctedComboBoxRole) {
                this.SelctedComboBoxRole = '';
            }

            console.log('SelctedComboBoxRole from cache or initial  ' + localStorage.getItem("SelctedComboBoxRole"));

          if (localStorage.getItem("SelctedComboBoxRole")) {
            let selectedRole = localStorage.getItem("SelctedComboBoxRole");

            selectedRole = selectedRole.replace(/"/g, '');

            this.SelctedComboBoxRole = selectedRole;
            this.selectedRole = selectedRole;
        }

        // Handle role selection logic
        if (this.OrgNisationRoles.length > 0) {
            console.log(' org role in else block ' + this.OrgNisationRoles[0].value);

            const roleValues = this.OrgNisationRoles.map(r => r.value);

            // 🔴 NEW CHECK: if stored role is invalid
            if (
                !this.SelctedComboBoxRole ||
                this.SelctedComboBoxRole === '' ||
                !roleValues.includes(this.SelctedComboBoxRole)
            ) {
                console.log('Stored role invalid → selecting ALL');

                this.SelctedComboBoxRole = 'All';
                this.selectedRole = 'All';
            }

            // Clear chosenRole before populating
            this.chosenRole = [];

            if (this.SelctedComboBoxRole === 'All') {
                this.OrgNisationRoles.forEach(roleObj => {
                    if (roleObj.value !== 'All') {
                        this.chosenRole.push(roleObj.value);
                    }
                });
            } else {
                this.chosenRole.push(this.SelctedComboBoxRole);
            }
        }

            console.log('this.chosenRole FINAL ' + JSON.stringify(this.chosenRole));
            this.loadStaffData();

          
            if (!this.SelectedComboBoxFacility) {
                this.SelectedComboBoxFacility = [];
            }

            if (this.orgId != null && this.chosenRole.length > 0) {
                console.log("isstaffview in roster " + this.isstaffviewfromparent);
                if (this.isstaffviewfromparent == true) {
                    this.viewName = "Staff View";
                } else {
                    this.isParticipanTViewEnable = true;
                    this.viewName = "Participant View";
                }
                this.isAutoSchedule = true;
            }

            const savedView = localStorage.getItem("selectedRosterView");
            if (savedView === "staff") {
                console.log("✔ Calling handleStaffView() from fetchInitialData()");
                this.handleStaffView();
            } else {
                console.log("✔ Calling handleParticipantView() from fetchInitialData()");
                this.handleParticipantView();
            }
       

            this.recurEveryOptions = this.generateOptionsdaily(30);
            this.monthLyOptions = this.generateDateOptions(31);

        })
        .catch(facRoleError => {
            console.error("Error in fetchBulkRoles:", facRoleError);
        });
     });
}

  disconnectedCallback() {
    // Remove event listeners when component is destroyed
    window.removeEventListener("keydown", this.handleKeyboardShortcut);
    window.removeEventListener("scroll", this.handleScrollOrClick);
    window.removeEventListener("click", this.handleOutsideClick);
    window.removeEventListener("click", this._handleOutsideFacilityClick);
    document.removeEventListener("click", this.handleClickOutside);
    document.removeEventListener("keydown", this.handleEscapeKey);
/*   window.removeEventListener('click', this.availOutsideClick, true);
  window.removeEventListener('scroll', this.availOutsideClick, true);
  window.removeEventListener('resize', this.availOutsideClick, true); */
    window.addEventListener('click', this.availOutsideClick);
    window.addEventListener('scroll', this.availOutsideClick);
    window.addEventListener('resize', this.availOutsideClick);

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

  /* staffSlistOnSelection() {

    console.log( 'this.addShiftData.AddShiftFacilityValue '+this.addShiftData.AddShiftFacilityValue);
       console.log( 'this.addShiftData.AddShiftRole '+this.addShiftData.AddShiftRole);
    return StaffsRolesWiseList({
      orgId: this.orgId,
      facIdlist: [this.addShiftData.AddShiftFacilityValue],
      roles: [this.addShiftData.AddShiftRole],
      name: ""
    }).then((response) => {
      console.log('stafaf option '+JSON.stringify(response));
      this.staffOptions = response.map((rec) => {
        this.StaffHourlyRates[rec.Id] = { staffHoulryRate: rec };
        return {
          label: rec.Display_Nickname__c,
          value: rec.Id,
          staffPaidBreak: rec.Paid_Break__c
        };
      });
    });
  } */
 staffSlistOnSelection() {
    console.log('staffSlistOnSelection → START');
    console.log('Selected Role:', this.addShiftData.AddShiftRole);
    console.log('Selected Facility:', this.addShiftData.AddShiftFacilityValue);

    return StaffsRolesWiseList({
        orgId: this.orgId,
        facIdlist: [this.addShiftData.AddShiftFacilityValue],
        roles: [this.addShiftData.AddShiftRole],
        name: ""
    }).then((response) => {

       // console.log('Apex response:', JSON.stringify(response));

        this.staffOptions = response.map((rec) => {

            const staffRoles = rec.StaffRoles__r|| [];
       //     console.log('Staff:', rec.Id, 'Roles:', JSON.stringify(staffRoles));

            const matchedRole = staffRoles.find(
                role => role.RoleName__c === this.addShiftData.AddShiftRole
            );

        /*     console.log(
                'Matched Role:',
                JSON.stringify(matchedRole)
            ); */

            this.StaffHourlyRates[rec.Id] = {
                staffHoulryRate: rec
            };

            const staffOption = {
                label: rec.Display_Nickname__c,
                value: rec.Id,
                staffPaidBreak: rec.Paid_Break__c,
                typeOfJob: matchedRole?.Type_of_Job__c || '',
                categoryType: matchedRole?.Category_Type__c || ''
            };

           /*  console.log(
                'staffOption:',
                JSON.stringify(staffOption)
            ); */

            return staffOption;
        });

       /*  console.log(
            'Final staffOptions:',
            JSON.stringify(this.staffOptions)
        );

        console.log('staffSlistOnSelection → END'); */
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

  /* initializeWeek(startDate) {
   // this.currentStartOfWeek = this.getStartOfWeek(startDate);
    this.currentStartOfWeek = new Date(startDate);
      this.selectedViewType = localStorage.getItem("rosterViewType") || "weekly";
    this.numberOfDays = this.selectedViewType === 'fortnightly' ? 14 : 7;
    this.weekDaysWithDates = this.calculateWeekDaysWithDates(
        this.currentStartOfWeek,
        this.numberOfDays
    );
    console.log("Days " + JSON.stringify(this.weekDaysWithDates));
} */

initializeWeek(startDate) {
    this.currentStartOfWeek = this.getStartOfWeek(startDate);
      this.selectedViewType = localStorage.getItem("rosterViewType") || "weekly";
    this.numberOfDays = this.selectedViewType === 'fortnightly' ? 14 : 7;
    this.weekDaysWithDates = this.calculateWeekDaysWithDates(
        this.currentStartOfWeek,
        this.numberOfDays
    );
    console.log("Days " + JSON.stringify(this.weekDaysWithDates));
}


 

 getStartOfWeek(date) {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay(); // 0=Sun,1=Mon,...6=Sat
  // Calculate how many days to subtract to reach Monday
  const diff = (day === 0 ? -6 : 1 - day); // if Sunday → go back 6 days
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  return startOfWeek;
}

  calculateWeekDaysWithDates(startOfWeek, numberOfDays = 7) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekDaysWithDates = [];
    for (let i = 0; i < numberOfDays; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);

        // Get day name (reuse days array for fortnightly)
        const dayIndex = i % 7;
        const dayName = days[dayIndex];

        // Format date as DD-MM-YYYY
        const day = String(currentDate.getDate()).padStart(2, "0");
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const year = currentDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        const uiFormattedDate = `${day}`;

        weekDaysWithDates.push({
            day: dayName,
            weekDays: formattedDate,
            UiFormattedDate: uiFormattedDate
        });
    }
    return weekDaysWithDates;
}

// handleViewTypeChange(event) {
//     this.selectedViewType = event.detail.value;
//     this.isShowSpinner = true;
    
//     // Reinitialize with current start date
//     this.initializeWeek(this.currentStartOfWeek);
//     localStorage.setItem("rosterSelectedDate", this.currentStartOfWeek.toISOString());
//     localStorage.setItem("rosterViewType", this.selectedViewType);
    
//     this.loadStaffData();
//     // this.isShowSpinner = false;
// }


  handleViewTypeChange(event) {
    this.selectedViewType = event.detail.value;
    this.isShowSpinner = true;

    // Persist selection
    localStorage.setItem("rosterViewType", this.selectedViewType);

    // ================= MONTHLY =================
if (this.selectedViewType === 'monthly') {

    this.isMonthlyView=true;
    this.isStaffView = false;
    this.isCalenderShiftView = false;
    this.shiftReportsFlag = false;
    this.isHome = false;

    // Store date context
    localStorage.setItem(
      "rosterSelectedDate",
      this.currentStartOfWeek?.toISOString()
    );

    // Load monthly dat

  } 
    // ================= WEEKLY / FORTNIGHTLY =================
    else {
      this.isMonthlyView=false;
      // Reinitialize weekly/fortnightly view
      this.initializeWeek(this.currentStartOfWeek);

      localStorage.setItem(
        "rosterSelectedDate",
        this.currentStartOfWeek.toISOString()
      );

      // Existing weekly staff load
      this.loadStaffData();
    }
  }


  returnMonthName(startOfWeek) {
    const monthName = startOfWeek.toLocaleString("default", { month: "long" }); // Get the full month name
    return monthName;
  }
loadPreviousWeek() {
    console.log('🚀 loadPreviousPeriod() called');
    console.log('📊 Current view type:', this.selectedViewType);
    
    const daysToSubtract = this.selectedViewType === 'fortnightly' ? 14 : 7;
    console.log('📅 Days to subtract:', daysToSubtract);
    
    console.log('📆 Current start of week before:', this.currentStartOfWeek);
    const previousPeriodStart = new Date(this.currentStartOfWeek);
    previousPeriodStart.setDate(this.currentStartOfWeek.getDate() - daysToSubtract);
    console.log('📆 Previous period start:', previousPeriodStart);
    
    this.initializeWeek(previousPeriodStart);
    localStorage.setItem("rosterSelectedDate", previousPeriodStart.toISOString());
    console.log('💾 Saved to localStorage:', previousPeriodStart.toISOString());
    
    this.isShowSpinner = true;
    console.log('🔄 Spinner shown');
    
    this.loadStaffData();
    
    this.isShowSpinner = false;
    console.log('✅ loadPreviousPeriod() completed');
}

loadNextWeek() {
    console.log('🚀 loadNextPeriod() called');
    console.log('📊 Current view type:', this.selectedViewType);
    
    const daysToAdd = this.selectedViewType === 'fortnightly' ? 14 : 7;
    console.log('📅 Days to add:', daysToAdd);
    
    console.log('📆 Current start of week before:', this.currentStartOfWeek);
    const nextPeriodStart = new Date(this.currentStartOfWeek);
    nextPeriodStart.setDate(this.currentStartOfWeek.getDate() + daysToAdd);
    console.log('📆 Next period start:', nextPeriodStart);
    
    this.initializeWeek(nextPeriodStart);
    localStorage.setItem("rosterSelectedDate", nextPeriodStart.toISOString());
    console.log('💾 Saved to localStorage:', nextPeriodStart.toISOString());
    
    this.isShowSpinner = true;
    console.log('🔄 Spinner shown');
    
    this.loadStaffData();
    
    this.isShowSpinner = false;
    console.log('✅ loadNextPeriod() completed');
}

handleDatePickerChange(event) {
    console.log('🚀 handleDatePickerChange() called');
    console.log('🎯 Event target:', event.target);
    
    const field = event.target.name;
    const isValid = event.target.reportValidity();
    console.log("✅ Field validity:", isValid, "Field name:", field);

    this.fieldErrorMap[field] = !isValid;
    console.log('❌ Field error map updated:', this.fieldErrorMap);
    
    const selectedDate = new Date(event.target.value);
    console.log('📅 Selected date from picker:', selectedDate);
    console.log('📅 Selected date value:', event.target.value);
    
    if (isNaN(selectedDate)) {
        console.log('⚠️ Invalid date detected, using current date');
        this.initializeWeek(new Date());
    } else {
        console.log('✅ Valid date, initializing week with:', selectedDate);
        this.initializeWeek(selectedDate);
        localStorage.setItem("rosterSelectedDate", selectedDate.toISOString());
        console.log('💾 Saved to localStorage:', selectedDate.toISOString());
    }
    
    this.isShowSpinner = true;
    console.log('🔄 Spinner shown');
    
    this.loadStaffData();
    
    this.isShowSpinner = false;
    console.log('✅ handleDatePickerChange() completed');
}

navigateToToday() {
    console.log('🚀 handleTodayClick() called');

    const today = new Date();

    console.log('📅 Today:', today);

    // ✅ SAME AS onchange
    this.initializeWeek(today);

    localStorage.setItem("rosterSelectedDate", today.toISOString());

    this.isShowSpinner = true;

    this.loadStaffData();

    this.isShowSpinner = false;

    console.log('✅ Today loaded');
}

  // Method to load staff data from Apex
  loadStaffData() {
    console.log('🚀 loadStaffData() called');
    console.log('📊 Number of days:', this.numberOfDays);
    console.log('📅 Week days with dates:', this.weekDaysWithDates);
    
    if (!this.weekDaysWithDates || this.weekDaysWithDates.length === 0) {
        console.log('❌ No week days data available');
        return;
    }
    
    // Use dynamic indexing based on numberOfDays
    let startparts = this.weekDaysWithDates[0].weekDays.split("-");
    let endparts = this.weekDaysWithDates[this.weekDaysWithDates.length - 1].weekDays.split("-");
    
    console.log('📅 First day data:', this.weekDaysWithDates[0]);
    console.log('📅 Last day data:', this.weekDaysWithDates[this.weekDaysWithDates.length - 1]);
    
    // Force reactivity by creating new objects
    this.startDate = null;
    this.endDate = null;
    this.refreshTimestamp = Date.now();
    
    // Use setTimeout to ensure reactivity
    setTimeout(() => {
        this.startDate = startparts[2] + "-" + startparts[1] + "-" + startparts[0];
        this.endDate = endparts[2] + "-" + endparts[1] + "-" + endparts[0];
        
        console.log("📅 Final startDate:", this.startDate);
        console.log("📅 Final endDate:", this.endDate);
        console.log("📊 Total days in range:", this.weekDaysWithDates.length);
        
        if (this.startDate && this.endDate) {
            console.log('✅ Dates valid, refreshing staff data');
            this.refreshStaffData();
            this.handlePublishedStatus();
        } else {
            console.log('❌ Invalid dates, cannot load staff data');
        }
    }, 0);
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
      this.weeklyDataforStaff = false;
      setTimeout(() => {
        this.isShowSpinner = false;
      }, 800);
    }
  
 
  refreshStaffData() {
  console.log('choosen role in load staff data after clicking all ==' + JSON.stringify(this.chosenRole));
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
     // this.updateRoleTabClasses();
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
      AddShiftFacilityName: null,
      sil:false
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
    this.disableGroupShift  = false;
    this.disableSplitShift = false;
    this.brokenShift=false;
    this.disableBrokenShift=false;
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
    this.orginalShiftStaff='';
    this.shiftAddressInRosterSettings='';
    this.AddShiftArrayOriginal=[];
    this.showErrorModal=false;
    this.staffDateConflicts = [];
    this.showComplianceWarningModal=false;
    this.staffDateWarnings = [];
  
  }
  async handleConfirmSetHours(event) {
    this.emptyFields();
   

    let holiday = event.currentTarget.dataset.isholiday;
    let shiftdate = event.currentTarget.dataset.weekdate;
    let role = event.currentTarget.dataset.role;
    let setHrsflag = event.currentTarget.dataset.staffsethrs;
    console.log("role " + role);
    console.log("restrictSetHours setHrsflag >> ", setHrsflag);
    this.addShiftData.AddShiftStaffValue = event.currentTarget.dataset.staffid;
    this.RolesStaffId = event.currentTarget.dataset.staffid;
 //   this.addShiftData.AddShiftRole = role;
    this.addShiftData.AddShiftStartDate = shiftdate;
    console.log(' facility value from staff  '+event.currentTarget.dataset.facilityval);
     console.log(' role value from staff  '+event.currentTarget.dataset.staffroles);
       let roleFacilityVal = event.currentTarget.dataset.staffroles; // Admin-a1Bxxx,Nurse-a1Byyy
     this.addShiftData.AddShiftHoliday = holiday == "true" ? true : false;
    this.AddShiftDayName = event.currentTarget.dataset.weekname;
    this.IsLongShift = false;
    this.ServiceStaffValue = event.currentTarget.dataset.staffid;
    console.log("exceed hours " + event.currentTarget.dataset.exceedhours);
    console.log("sethours hours " + event.currentTarget.dataset.sethours);
    console.log("setHrs flag >> ", setHrsflag);
    const exceedHours = parseFloat(event.currentTarget.dataset.exceedhours);
    const setHours = parseFloat(event.currentTarget.dataset.sethours);
   let facilityVal = event.currentTarget.dataset.facilityval;
   console.log('facilityVal ==>'+facilityVal);
    this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
      this.facilityValue.includes(rec.value)
    );

  console.log('finalSelectedFacilities:', JSON.stringify(this.finalSelectedFacilities));

  if (facilityVal) {
      let facilityArr = facilityVal.split(',').map(f => f.trim());
      console.log('facilityArr:', facilityArr);

      // Extract only values from finalSelectedFacilities
      let allowedFacilityIds = this.finalSelectedFacilities.map(rec => rec.value);
      console.log('allowedFacilityIds:', allowedFacilityIds);

      // Find first matching facility
      let matchedFacility = facilityArr.find(fac => allowedFacilityIds.includes(fac));
      console.log('matchedFacility:', matchedFacility);

      this.addShiftData.AddShiftFacilityValue = matchedFacility || null;
      console.log('Assigned Facility:', this.addShiftData.AddShiftFacilityValue);

  } else {
      this.addShiftData.AddShiftFacilityValue = null;
      console.log('No facilityVal found → Assigned null');
  }
  // console.log("ORG facilities", JSON.stringify(this.facilityOptions));
   
    let fac=[];
    fac.push(this.addShiftData.AddShiftFacilityValue);

    const facRoles = await fetchBulkRoles({ facilityIDList: fac });
    console.log("facRoles " + JSON.stringify(facRoles));

   let rolesArray=[];
    facRoles.forEach(rec => {
        rolesArray.push({ label: rec.Role_Name__c, value: rec.Role_Name__c });
    });
   
    
    this.RoleFilter = [...rolesArray];
  
    let selectedFacilityForRole = this.addShiftData.AddShiftFacilityValue;

    console.log("roleFacilityVal:", roleFacilityVal);
    console.log("selectedFacilityForRole:", selectedFacilityForRole);

    let matchedRole = null;

    if (roleFacilityVal && selectedFacilityForRole) {
        let roleFacilityArr = roleFacilityVal.split(',').map(rf => rf.trim());
        console.log("roleFacilityArr:", roleFacilityArr);

        for (let rf of roleFacilityArr) {
            let [roleName, facilityId] = rf.split('-');

            if (facilityId === selectedFacilityForRole) {
                matchedRole = roleName;
                break;
            }
        }
    }

    this.addShiftData.AddShiftRole = matchedRole;
    console.log("Assigned Role:", this.addShiftData.AddShiftRole);

   

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

    console.log(  "finalSelectedFacilities=>", JSON.stringify(this.finalSelectedFacilities));
    console.log('this.addShiftData.AddShiftFacilityValue=>'+ this.addShiftData.AddShiftFacilityValue);
    const selectedFacility = this.finalSelectedFacilities.find(
      (f) => f.value === this.addShiftData.AddShiftFacilityValue
    );
   
    if (selectedFacility) {
      this.facilityPreferredName = selectedFacility.preferredName;
      this.participantPreferredName = selectedFacility.participantPreferredName;
      this.staffPreferredName = selectedFacility.staffPreferredName;
      this.shiftPenaltyMode=selectedFacility.shiftPenaltyMode;
  
    }
    if (this.addShiftData.AddShiftFacilityValue) {
      this.addShiftData.AddShiftFacilityName =
        this.finalSelectedFacilities.find(
          (rec) => rec.value == this.addShiftData.AddShiftFacilityValue
        ).label;
       
    }
    this.isHome = false;
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
   // console.log(" ORG facilities " + JSON.stringify(this.facilityOptions));
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
    this.hourlrRateLabel = "Rate($/hr)";
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
    this.unavailableStaffNames=[];
    this.unavailableTemplate=false;
    this.selectedShiftMode='Active';
    this.finalEndRecurrenceDates=[];
    this.finalEndStaffRows=[];
    this.showExtendedBrokenUI =false;
    this.extendedBrokenMeta={
        breakOne: 0,
        breakTwo: 0,
        doubleRate: 0,
        extraHours: 0,
         brokenBreakStartOne:null,
        brokenBreakEndOne:null,
        brokenBreakStartTwo:null,
        brokenBreakEndTwo:null,
    };
    this.orignalShiftTime='';
    this.recuringShiftsToDelete=[];
    this.recurringDatesForChild=[];
    // this.AddShiftAndServices=[];
    await this.processShifts(this.addShiftData.AddShiftFacilityValue);

      let shifNames = this.shiftNameOptions.filter(
      (rec) => rec.value === this.addShiftData.AddShiftTypeName
    );
      console.log(' shift options 1969'+this.addShiftData.AddShiftFacilityValue)
   
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
      const { label, staffPaidBreak,categoryType,typeOfJob  } = selectedStaff;
      console.log('categoryType ==> '+JSON.stringify(categoryType));
      console.log("staffPaidBreak ==> ", staffPaidBreak);

      this.AddShiftAndServices[0].stafflabel = label;
      this.selectedStaffLabel = "-" + label;
      this.AddShiftAndServices[0].staff = this.addShiftData.AddShiftStaffValue;
      this.AddShiftAndServices[0].staffPaidBreak = staffPaidBreak; // store paidBreak
      console.log(' categoryType in create '+categoryType);
      this.employmentTypeInBrokenShift=typeOfJob;
     
       const ALLOWED_CATEGORIES = [
          'Social and community services employee',
          'Home care employee'
        ];

      this.disableBrokenShift =
          !ALLOWED_CATEGORIES.includes(categoryType);
        }
       this.getShiftTimingsByFacility(shifNames);


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
    return fetchFacilitiess({ cname: '', isTrue: false })
        .then((response) => {
            const selectedFacilityId = this.addShiftData.AddShiftFacilityValue;

            this.participantoptions = response
                .filter((rec) => {
                    // Defensive checks
                    const hasActiveFacility =
                        rec.Participant_Facilities__r &&
                        rec.Participant_Facilities__r.some(
                            (pf) =>
                                pf.Active__c === true &&
                                pf.Facility__c === selectedFacilityId
                        );

                    return (
                        rec.Status__c === true &&
                        rec.Facility__r?.Status__c === true &&
                        hasActiveFacility
                    );
                })
                .map((rec) => {
                    return {
                        value: rec.Id,
                        label: rec.Display_Nickname__c,
                        riskStatus: rec.Risk_Status__c
                            ? rec.Risk_Status__c
                            : 'Risk Free'
                    };
                });
        })
        .catch((error) => {
            console.error('Error fetching participants', error);
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
   if (!trimmedDesc) {
    this.confirMationMessage(
      "Error",
      "Description cannot be empty.",
      "Error"
    );
    return;
   }

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

    console.log('===== Mandatory Checkbox Changed =====');

    const rowId = event.target.dataset.id;
    const checkedValue = event.target.checked;

    console.log('Clicked RowId =>', rowId);
    console.log('Checked Value =>', checkedValue);

    console.log('Before Update =>', JSON.stringify(this.ChekListrows));

    this.ChekListrows = this.ChekListrows.map((row) => {

        console.log('Comparing Row =>', row.id, 'with', rowId);

        // ⭐ IMPORTANT FIX (convert both to string)
        if (String(row.id) === String(rowId)) {

            console.log('MATCH FOUND → Updating Mandatory');

            return {
                ...row,
                mandatory: checkedValue
            };
        }

        return row;
    });

    console.log('After Update =>', JSON.stringify(this.ChekListrows));
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

  async handleAddShiftChange(event) {
    this.addShiftData[event.target.name] = event.target.value;
    // console.log("addShift type " + JSON.stringify(this.addShiftData));
    console.log("event.target.name " + event.target.name);
    console.log("event.target.value " + event.target.value);
    // console.log('add shift name'+this.AddShiftDayName)
    if (
      this.facilityAddressCheckbox == true &&
      event.target.name == "AddShiftFacilityValue"
    ) {
      this.getFacilityAddress();
    }
    if(event.target.name == "AddShiftFacilityValue"){
       this.confirMationMessage(
          "Warning",
          "Updating the Facility may modify the staff list and assigned selections.",
          "Warning"
      );
      let fac=[];
      fac.push(this.addShiftData.AddShiftFacilityValue);

      const facRoles = await fetchBulkRoles({ facilityIDList: fac });
      console.log("facRoles " + JSON.stringify(facRoles));

    let rolesArray=[];
      facRoles.forEach(rec => {
          rolesArray.push({ label: rec.Role_Name__c, value: rec.Role_Name__c });
      });
    
    
      this.RoleFilter = [...rolesArray];
      this.addShiftData.AddShiftRole=this.RoleFilter[0].value;
          await Promise.all([
          this.staffSlistOnSelection(),
          this.handleLinkParticipants()
        ]);
         /*  console.log(
            "staff list in role change  ==>" + JSON.stringify(this.staffOptions)
          ); */
        this.processShifts(this.addShiftData.AddShiftFacilityValue);

       
     
       this.getFacilityAddress();
        const hasStaff = this.staffOptions.length > 0;

        const selectedStaff = hasStaff
            ? this.staffOptions[0]
            : {
                value: null,
                label: 'Select staff',
                staffPaidBreak: false
            };

        // Assign values
        this.addShiftData.AddShiftStaffValue = selectedStaff.value;

        let staffLabel = selectedStaff.label;

        console.log("staffLabel => ", staffLabel);

        this.selectedStaffLabel =
            this.groupShift !== true ? "-" + staffLabel : "";

        // Map update
        this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
            ...row,
            stafflabel: staffLabel,
            staff: selectedStaff.value,
            filteredstaff: [...this.staffOptions],
            staffPaidBreak: selectedStaff.staffPaidBreak,
            filteredparticipants: [...this.participantoptions],
            filteredservicetypes: [],
            filteredserviceitems:[],
            allservicetypes:[],
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
        }));
        if (this.staffOptions.length == 0) {
            this.confirMationMessage(
              "Information",
              "No staff members are currently available for the selected role.",
              "Info"
            );
        return;
      }
    }

    if (event.target.name == "AddShiftNotes") {
      this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
    }
    if (event.target.name == "AddShiftStartDate" && this.AddShiftRecurringCheckboxValue == true) {
      this.callGetNumberOfRecurrences();
    }
    if (event.target.name == "AddShiftStartDate"){
       this.addShiftData.AddShiftBreak = this.getDuration(
          this.addShiftData.AddShiftStartDate,
          this.addShiftData.AddShiftStartTime,
          this.addShiftData.AddShiftEndTime,
          this.addShiftData.AddShiftEndTimeAMPM,
          this.addShiftData.AddShiftType
        ).breakTime;
    }
    if (event.target.name == "AddShiftRole") {
      let result = await this.staffSlistOnSelection();
      console.log(
        "staff list in role change  ==>" + JSON.stringify(this.staffOptions)
      );
     
      this.confirMationMessage(
          "Warning",
          "Updating the staff role may modify the staff list and assigned selections.",
          "Warning"
      );
      

     const selectedStaff = this.staffOptions[0] ?? {
          value: null,
          label: 'Select staff',
          staffPaidBreak: false
      };

      this.addShiftData.AddShiftStaffValue = selectedStaff.value;

      let staffLabel = selectedStaff.label;

      console.log("staffLabel => ", staffLabel);

      this.selectedStaffLabel =
          this.groupShift !== true && selectedStaff.value
              ? "-" + staffLabel
              : "";

      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
          ...row,
          stafflabel: staffLabel,
          staff: selectedStaff.value,
          filteredstaff: [...this.staffOptions],
          staffPaidBreak: selectedStaff.staffPaidBreak
      }));
       if (this.staffOptions.length == 0) {
        this.confirMationMessage(
          "Information",
          "No staff members are currently available for the selected role.",
          "Info"
        );
        return;
      }
    }
 if (event.target.name == "AddShiftTypeName") {
      console.log(
        "this.addShiftData.AddShiftTypeName ==>" +
          this.addShiftData.AddShiftTypeName
      );
      this.groupShift=false;
      this.splitShift=false;
      this.brokenShift=false;
      this.showExtendedBrokenUI =false;
      this.extendedBrokenMeta={
          breakOne: 0,
          breakTwo: 0,
          doubleRate: 0,
          extraHours: 0,
          brokenBreakStartOne:null,
          brokenBreakEndOne:null,
          brokenBreakStartTwo:null,
          brokenBreakEndTwo:null,
      };
      
      let shifNames = this.shiftNameOptions.filter(
        (rec) => rec.value === this.addShiftData.AddShiftTypeName
      );
      console.log("shifNameOptions in onchnage  ==>" + JSON.stringify(shifNames));
      this.enableTimeRounding = shifNames[0].enableTimeRounding;
      
      // PRESERVE EXISTING ROWS IN EDIT MODE
      if (this.isEditShiftScreenFlag) {
        // Edit mode - preserve existing rows, only reset flags
        this.rowShiftTypeEnable = false;
        this.hourlyRateEditable = false;
        this.rowShiftTimingsEnable = false;
        
        // If no rows exist, initialize one
        if (this.AddShiftAndServices.length === 0) {
          this.AddShiftAndServices = [this.initRow()];
        }
      } else {
        // Create mode - reset everything
        this.AddShiftAndServices = [];
        this.rowShiftTypeEnable = false;
        this.hourlyRateEditable = false;
        this.rowShiftTimingsEnable = false;
        this.AddShiftAndServices = [this.initRow()];
      }

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

        // Update staff information in rows
        if (this.isEditShiftScreenFlag) {
          // In edit mode, update all rows with staff info
          this.AddShiftAndServices = this.AddShiftAndServices.map((row, index) => ({
            ...row,
            stafflabel: index === 0 ? label : row.stafflabel, // Only update label for first row or keep existing
            staff: this.addShiftData.AddShiftStaffValue,
            staffPaidBreak: staffPaidBreak
          }));
        } else {
          // Create mode - only update first row
          this.AddShiftAndServices[0].stafflabel = label;
          this.AddShiftAndServices[0].staff = this.addShiftData.AddShiftStaffValue;
          this.AddShiftAndServices[0].staffPaidBreak = staffPaidBreak;
        }
        
        this.selectedStaffLabel = "-" + label;
      }

      // Update shiftWithStaffId
      if (this.isEditShiftScreenFlag) {
        this.AddShiftAndServices = this.AddShiftAndServices.map(row => ({
          ...row,
          shiftWithStaffId: this.ShiftwithStafftoApexId
        }));
      } else {
        this.AddShiftAndServices[0].shiftWithStaffId = null;
      }

      const addressType =
        this.facilityAddressCheckbox == true
          ? "Facility"
          : this.participantAddressCheckBox == true
            ? "Participant"
            : "New";

      // Update addressSource
      if (this.isEditShiftScreenFlag) {
        this.AddShiftAndServices = this.AddShiftAndServices.map(row => ({
          ...row,
          addressSource: addressType
        }));
      } else {
        this.AddShiftAndServices[0].addressSource = addressType;
      }

      const rate = this.getServiceStaffHourlyRate(
        this.addShiftData.AddShiftHoliday,
        this.AddShiftDayName,
        this.addShiftData.AddShiftStaffValue,
        this.addShiftData.AddShiftType
      );

      // Update hourly rate
      if (this.isEditShiftScreenFlag) {
        this.AddShiftAndServices = this.AddShiftAndServices.map(row => ({
          ...row,
          hourlyrate: rate
        }));
      } else {
        this.AddShiftAndServices[0].hourlyrate = rate;
      }

      this.getShiftTimingsByFacility(shifNames);
    }
    if (event.target.name == "AddShiftStaffValue") {
      this.RolesStaffId = this.addShiftData.AddShiftStaffValue;
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
        const { label, staffPaidBreak,categoryType,typeOfJob } = selectedStaff; // get label + paidBreak (or other fields)
         const ALLOWED_CATEGORIES = [
              'Social and community services employee',
              'Home care employee'
          ];

        const isAllowedCategory = ALLOWED_CATEGORIES.includes(categoryType);
        this.employmentTypeInBrokenShift=typeOfJob;

        // ===============================
        // CASE 1: Broken is selected
        // ===============================
        if (this.brokenShift === true) {

            if (!isAllowedCategory) {
                // ❌ Broken no longer allowed
                this.brokenShift = false;
                this.disableBrokenShift = true;

                this.disableSplitShift = false;
                this.disableGroupShift = false;

            } else {
                // ✅ Broken allowed and selected
                this.disableBrokenShift = false;

                this.disableSplitShift = true;
                this.disableGroupShift = true;
            }
        }

        // ===============================
        // CASE 2: Broken is NOT selected
        // ===============================
        else {
            // Broken availability depends on category
            this.disableBrokenShift = !isAllowedCategory;

            // Others are always available
            this.disableSplitShift = false;
            this.disableGroupShift = false;
        }


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
    }

     console.log("addShiftData " + JSON.stringify(this.addShiftData));
  }
async getShiftTimingsByFacility(shifNames) {
  console.log("getShiftTimingsByFacility :called ",JSON.stringify(shifNames) );
    this.cutsomShiftTemplate = false;
    this.IsLongShift = false;
    this.SplitShiftVisible = true; 
    this.isSplitCheckbox = false;
    this.disableGroupShift  = false;
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
     this.hourlrRateLabel =this.addShiftData.AddShiftType == "Sleepover Shift" ? "Allowance" :"Rate($/hr)";
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
    
    // Update billable hours and break time for all rows
   
      this.AddShiftAndServices = this.AddShiftAndServices.map((service) => ({
        ...service,
        billablehours: this.getFinalDuration(
          this.addShiftData.AddShiftDuration,
          this.addShiftData.AddShiftBreak == 30 ? 0.5 : 0,
          service.staffPaidBreak
        ),
        breakTime: this.addShiftData.AddShiftBreak,
        hourlyrate: rate
      }));
   
      console.log('shift address called in shiftname ==>'+shifNames[0].Type_of_Address__c);
    if(shifNames[0].Type_of_Address__c && shifNames[0].Type_of_Address__c=='Facility' ){
      this.shiftAddressInRosterSettings=shifNames[0].Type_of_Address__c;
            this.addNewAddressCheckBox = false;
            this.participantAddressCheckBox = false;
            if (!this.addShiftData.AddShiftFacilityValue) {
              this.confirMationMessage(
              "Error",
              "Please select " + this.facilityPreferredName,
              "Error"
              );
           
            this.facilityAddressCheckbox = false;
            this.addShiftData.AddShiftParticipantAddressCheckbox = false;
            } else {

              console.log('shift address called in shiftname ==>')
            this.facilityAddressCheckbox = true;
            this.addShiftData.AddShiftParticipantAddressCheckbox = false;
            this.addShiftData.AddShiftEnterOtherLocation = false;
            this.fetchFacilityAddressAndGeocode();
            this.isDisableSaveButton = false;
            }
    }else if(shifNames[0].Type_of_Address__c && shifNames[0].Type_of_Address__c=='Participant'){
         this.shiftAddressInRosterSettings=shifNames[0].Type_of_Address__c;
            this.facilityAddressCheckbox = false;
            this.addNewAddressCheckBox = false;
            this.participantAddressCheckBox = true;
            this.addShiftData.AddShiftEnterOtherLocation = true;
            this.addShiftData.AddShiftParticipantAddressCheckbox = true;
             this.EmptyAddressFields();
    } 

    if (this.addShiftData.AddShiftType === "Custom") {
      this.addshiftMaxDuration = 0;
      this.rowShiftTypeEnable = true;
      this.rowShiftTimingsEnable = true;
      this.disableGroupShift  = true;
      this.disableSplitShift = true;
      this.disableBrokenShift=true;
      this.hourlyRateEditable = true;

      let customShifts = shifNames[0].Custom_Shift_Timings__r || [];
      let shiftTypeDurationMap = {};
      let selectedStaff = this.staffOptions.find(
        (rec) => rec.value === this.addShiftData.AddShiftStaffValue
      );

      const { label, staffPaidBreak } = selectedStaff;

      // Handle custom shifts with edit mode preservation
      if (this.isEditShiftScreenFlag) {
        // Edit mode - map existing rows to custom shifts, add new ones if needed
        customShifts.forEach((cs, index) => {
          let startTime24 = this.formatMillisecondsToTime(cs.Start_Time__c);
          let endTime24 = this.formatMillisecondsToTime(cs.End_Time__c);
          let startAmPmObj = this.convertToAmPmObject(startTime24);
          let endAmPmObj = this.convertToAmPmObject(endTime24);

          let row;
          if (index < this.AddShiftAndServices.length) {
            // Use existing row
            row = this.AddShiftAndServices[index];
          } else {
            // Add new row if more custom shifts than existing rows
            row = this.initRow();
            this.AddShiftAndServices.push(row);
          }

          // Update row with custom shift data
          row.shifttype = cs.Shift_Type__c || "";
          if (cs.Shift_Type__c) {
            if (!shiftTypeDurationMap[cs.Shift_Type__c]) {
              shiftTypeDurationMap[cs.Shift_Type__c] = 0;
            }
            shiftTypeDurationMap[cs.Shift_Type__c] += cs.Duration__c
              ? cs.Duration__c
              : 0;
          }

          row.hourlyrate = "";
          row.rateLabel =
            cs.Shift_Type__c === "Sleepover Shift" ? "Allowance" : "Rate";
          row.customshiftlabel = cs.Shift_Type__c;
          this.addshiftMaxDuration += cs.Duration__c ? cs.Duration__c : 0;
          
          // Update times
          row.starttime = startTime24 ? `${startTime24}:00Z` : "00:00:00Z";
          row.endtime = endTime24 ? `${endTime24}:00Z` : "00:00:00Z";

          row.startTimeSelectedHour = startAmPmObj.selectedHour;
          row.startTimeSelectedMinute = startAmPmObj.selectedMinute;
          row.startTimeSelectedAmPm = startAmPmObj.selectedAmPm.toUpperCase();
          row.startTimeDisplayTime = startAmPmObj.displayTime;

          row.endTimeSelectedHour = endAmPmObj.selectedHour;
          row.endTimeSelectedMinute = endAmPmObj.selectedMinute;
          row.endTimeSelectedAmPm = endAmPmObj.selectedAmPm.toUpperCase();
          row.endTimeDisplayTime = endAmPmObj.displayTime;
          row.staffPaidBreak = staffPaidBreak;
        });
      } else {
        // Create mode - original logic
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
            this.AddShiftAndServices.push(row);
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

          row.hourlyrate = "";
          row.rateLabel =
            cs.Shift_Type__c === "Sleepover Shift" ? "Allowance" : "Rate";
         row.isCustomShift=cs.Shift_Type__c === "Sleepover Shift"
          row.customshiftlabel = cs.Shift_Type__c;
          this.addshiftMaxDuration += cs.Duration__c ? cs.Duration__c : 0;
          
          row.starttime = startTime24 ? `${startTime24}:00Z` : "00:00:00Z";
          row.endtime = endTime24 ? `${endTime24}:00Z` : "00:00:00Z";

          row.startTimeSelectedHour = startAmPmObj.selectedHour;
          row.startTimeSelectedMinute = startAmPmObj.selectedMinute;
          row.startTimeSelectedAmPm = startAmPmObj.selectedAmPm.toUpperCase();
          row.startTimeDisplayTime = startAmPmObj.displayTime;

          row.endTimeSelectedHour = endAmPmObj.selectedHour;
          row.endTimeSelectedMinute = endAmPmObj.selectedMinute;
          row.endTimeSelectedAmPm = endAmPmObj.selectedAmPm.toUpperCase();
          row.endTimeDisplayTime = endAmPmObj.displayTime;
          row.staffPaidBreak = staffPaidBreak;
        });
      }
      
      this.shiftTypeDurations = shiftTypeDurationMap;
      console.log(" max hours ==>" + JSON.stringify(this.shiftTypeDurations));
    }
    if (this.addShiftData.AddShiftType === "Custom") {
      const { enrichedSegments, updatedServices } =
        await this.prepareAndValidateCustomShifts();
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
      isCustomShift:custom.rateLabel === "Sleepover Shift",

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

      rowOnchangeOccured: custom.rowOnchangeOccured,
      rowBillableHoursChanged:custom.rowBillableHoursChanged,
      billablehours:custom.billablehours,
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
            const amount = (
              (service.unitprice || 0) * (customResult.duration || 0)
            ).toFixed(2);
             console.log('service.rowBillableHoursChanged '+service.rowBillableHoursChanged );
              const calculatedBillableHours = (service.rowBillableHoursChanged == false) 
                  ? this.getFinalDuration(
                      customResult.duration,
                      customResult.duration >= 5 ? 0.5 : 0,
                      service.staffPaidBreak
                  ) 
              : customResult.duration;
           customResult.duration = calculatedBillableHours;
            return {
              ...service,
             
              stafflabel: staffLabel,
              staff: this.addShiftData.AddShiftStaffValue,
              hourlyrate: customResult.hourlyrate,
               billablehours: calculatedBillableHours,
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
     console.log(
          " addshift servies before creation ==> , " +
            JSON.stringify(this.AddShiftAndServices)
        );

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
      StaffId: this.addShiftData.AddShiftStaffValue,
      role: this.addShiftData.AddShiftRole
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
   // console.log("🔄 dispalyAmPMFormat() called...");

    if (this.addShiftData.AddShiftStartTimeAMPM) {
   
      let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(" ");
  

      let [startHour, startMinute] = time.split(":");
  

      this.startTimeSelectedHour = startHour;
      this.startTimeSelectedMinute = startMinute;
      this.startTimeAMPM = period == "AM" ? "AM" : "PM";

    
    } else {
      console.warn("⚠️ No Start Time AMPM found in addShiftData");
    }

    if (this.addShiftData.AddShiftEndTimeAMPM) {
     /*  console.log(
        "⏱ Raw End Time AMPM:",
        this.addShiftData.AddShiftEndTimeAMPM
      ); */

      let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(" ");
 
      let [endHour, endMinute] = time.split(":");

      this.endTimeSelectedHour = endHour;
      this.endTimeSelectedMinute = endMinute;
      this.endTimeAMPM = period == "AM" ? "AM" : "PM";

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
            const selectedRole = this.addShiftData.AddShiftRole;
          console.log("Selected Role >> " + selectedRole);

            let matchedRoleRate = null;
        if (holidayrateList.length > 0) {
            const staffRecord = holidayrateList[0];
            if (selectedRole && staffRecord.StaffRoles__r && staffRecord.StaffRoles__r.length > 0) {
              const matchedRole = staffRecord.StaffRoles__r.find(role => 
                role.RoleName__c && 
                role.RoleName__c.trim().toLowerCase() === selectedRole.trim().toLowerCase() &&
                role.Active__c === true
              );
              
              if (matchedRole && matchedRole.Public_Holiday_Hourly_Rate__c != null) {
                matchedRoleRate = matchedRole.Public_Holiday_Hourly_Rate__c;
                console.log("Using Child Role Rate >> " + matchedRoleRate + " for Role: " + selectedRole);
              }
            }
            
            // Use child role rate if found, otherwise fallback to parent staff rate
            rateValue = matchedRoleRate !== null 
                        ? matchedRoleRate 
                        : staffRecord.Public_holiday_Hourly_Rate__c;
            
            console.log("Final Rate Value >> " + rateValue + " (Source: " + (matchedRoleRate !== null ? "Child Role" : "Parent Staff") + ")");
          }

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
        this.recurEveryOptions = this.generateOptionsdaily(15);
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = false;
        this.isRecurDateDisabled = false;
        break;
      case "Fortnightly":
        this.RecurLabel = "Fortnight";
        this.recurEveryOptions = this.generateFortnightlyOptions(15);
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = false;
        this.isRecurDateDisabled = false;
        break;

      case "Weekly":
        this.RecurLabel = "Week";
        this.recurEveryOptions = this.generateWeeklyOptions(6);
        this.isRecurWeekFlag = true;
        this.isRecurmontlyFlag = false;
        this.isRecurDateDisabled = true;
        break;
      case "Monthly":
        this.RecurLabel = "Month";
        this.recurEveryOptions = this.generateMonthlyOptions(3);
        this.monthLyOptions = this.generateDateOptions(31);
        this.isRecurWeekFlag = false;
        this.isRecurmontlyFlag = true;
        this.isRecurDateDisabled = true;
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
    this.addShiftData[event.currentTarget.dataset.timetype] =  childData.twentyFourHourFormat;
    this.addShiftData[event.currentTarget.dataset.ampm] = childData.displaytime;
    this.addShiftData.AddShiftDuration = this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime, this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM, this.addShiftData.AddShiftType ).duration;
    console.log("MAX DURATION  IN onchange ==> " + this.addshiftMaxDuration);
    console.log( "this.addShiftData.AddShiftDuration ==>  " + this.addShiftData.AddShiftDuration );
   

    this.addShiftData.AddShiftBreak = this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM, this.addShiftData.AddShiftType).breakTime;
    console.log("timeType >>", timeType);
    console.log("this.rateRows.length >>", this.rateRows.length);
    console.log("this.addShiftData.AddShiftType >>",this.addShiftData.AddShiftType);


    this.AddShiftAndServices = this.AddShiftAndServices.map(row => ({
      ...row,
      hourlyrate:  this.getServiceStaffHourlyRate(this.addShiftData.AddShiftHoliday, this.AddShiftDayName, row.staff, this.addShiftData.AddShiftType )
    }));
    
    if (this.addShiftData.AddShiftType != "Custom" && this.splitShift != true && this.brokenShift !=true ) {
      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => {
            const updatedRow = {
              ...row,
              billablehours: this.getFinalDuration(
                this.addShiftData.AddShiftDuration,
                this.addShiftData.AddShiftBreak == 30 ? 0.5 : 0,
                row.staffPaidBreak
              ),
              breakTime: this.addShiftData.AddShiftBreak
            };
            
            const amount = (
              (updatedRow.unitprice || 0) * (updatedRow.billablehours || 0)
            ).toFixed(2);
            
            updatedRow.amount = amount;
            
            return updatedRow;
          });
    }
     this.dispalyAmPMFormat();

     if ( this.addShiftData.AddShiftType != "Sleepover Shift" &&
      this.addShiftData.AddShiftDuration > this.addshiftMaxDuration && this.addshiftMaxDuration  !=0 ) {
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
     if (this.brokenShift == true) {
          const isValid = await this.validateBrokenShiftsSegments();
          if (!isValid) {
            this.isShowSpinner = false;
            return; // stop further processing if validation failed
          }
      }
       if(this.orignalShiftTime && timeType=='AddShiftEndTime'){
           console.log(' this.addShiftData ==>'+this.addShiftData.AddShiftEndTimeAMPM);
            this.recalculateBrokenExcessHours(this.addShiftData.AddShiftEndTimeAMPM);
             let selectedStaff = this.staffOptions.find(
                (rec) => rec.value === this.addShiftData.AddShiftStaffValue
              );

             if (selectedStaff) {
              const { label, staffPaidBreak,categoryType,typeOfJob } = selectedStaff; // get label + paidBreak (or other fields)
              const ALLOWED_CATEGORIES = [
                    'Part-time',
                    'Casual'
                ];

            const isAllowedCategory = ALLOWED_CATEGORIES.includes(typeOfJob);
             if (!isAllowedCategory) {
              console.log('⛔ Minimum engagement skipped (Not Part-time/Casual)');
              return;
          }
             this.recalculateMinimumEngagement(this.ShiftwithStafftoApexId,this.addShiftData.AddShiftStartTimeAMPM,this.addShiftData.AddShiftEndTimeAMPM);
    
         }
           
      } 


  }

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
  get formattedAddress() {
    const parts = [
        this.address?.street,
        this.address?.citySuburb,
        this.address?.provinceState,
        this.address?.postalcode
    ].filter(part => part && part.trim() !== '');
    return parts.join(', ');
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
      isHoliday: event.currentTarget.dataset.isholiday,
      orgRoles:this.OrgNisationRoles
    };
    this.finalSelectedFacilities = [];

    console.log(" selected facilities " + JSON.stringify(this.facilityValue));
    console.log("  this.rosterPublishDateAndRole  " + JSON.stringify( this.rosterPublishDateAndRole ));
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

  handleRejectedBack(event) {
    this.childRejectedShifts = false;
    this.shiftReportsFlag = false;
    this.isHome = true;
    this.isStaffView = true;
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
  closeShiftTemplate(){
    this.shiftTemplateFlag=false;
    this.showOptions =false;
     this.resetState();
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
        isHoliday: event.currentTarget.dataset.isholiday,
         orgRoles:this.OrgNisationRoles
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
    this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
        this.facilityValue.includes(rec.value)
    );
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
    this.disableNotification=false;
    this.rowShiftTypeEnable = false;
    this.rowShiftTimingsEnable = false;
    this.showErrorModal=false;
    this.staffDateConflicts = [];
    this.showComplianceWarningModal=false;
     this.staffDateWarnings = [];
      this.finalEndRecurrenceDates=[];
    this.finalEndStaffRows=[];
    this.showExtendedBrokenUI=false;
    this.extendedBrokenMeta = {
        breakOne: 0,
        breakTwo: 0,
        doubleRate: 0,
        extraHours: 0,
        brokenBreakStartOne:null,
        brokenBreakEndOne:null,
        brokenBreakStartTwo:null,
        brokenBreakEndTwo:null,
    };
     this.recuringShiftsToDelete=[];
    this.recurringDatesForChild=[];
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
        AddShiftRole:result.shiftwithstaffdata.Role__c ?result.shiftwithstaffdata.Role__c : result.shiftwithstaffdata.Add_Shift__r.Role__c,
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
          : result.shiftwithstaffdata.Add_Shift__r.Shift_Name__c,
          sil:result.shiftwithstaffdata.SIL__c
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
          : "Rate($/hr)";
    
    
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

      this.shiftDeleteCOnfirmationInfo.refId = result.shiftwithstaffdata.RefId__c;
      this.shiftDeleteCOnfirmationInfo.recurStatus = result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c;
      
      

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
         this.shiftPenaltyMode=selectedFacility.shiftPenaltyMode;
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
      this.selectedShiftMode= result.shiftwithstaffdata.Status__c=='Draft'?'Draft':'Active';
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
      if(result.shiftwithstaffdata.New_Split_Shift__c || result.shiftwithstaffdata.Split_Shifts__c){
          this.disableSplitShift=true;
      } 
       
       if(result.shiftwithstaffdata.Broken_Shift__c){
        const parsedTimes = this.parseOriginalShiftTimes(result.shiftwithstaffdata.Add_Shift__r.Shift_Start_End_Time__c);
        this.orignalShiftTime = parsedTimes.start; 
        this.disableBrokenShift=true;
      } 
      if(result.shiftwithstaffdata.Broken_Extended_Duration__c >0){
        this.showExtendedBrokenUI=true;
        this.extendedBrokenMeta.extraHours=result.shiftwithstaffdata.Broken_Extended_Duration__c;
        this.extendedBrokenMeta.hourlyRate=result.shiftwithstaffdata.Broken_Extended_Rate__c;
        this.extendedBrokenMeta.brokenExtendedWages=result.shiftwithstaffdata.Broken_Extended_Wage__c;
      }
       
     
        if (shiftType == "Custom") {
          this.rowShiftTypeEnable = true;
          this.hourlyRateEditable = true;
          this.rowShiftTimingsEnable = true;
          this.disableSplitShift = true;
          this.disableGroupShift  = true;
        } else if (this.addShiftData.AddShiftType == "Sleepover Shift") {
          this.hourlyRateEditable = true;
        }
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
          isCustomShift:label === "Sleepover Shift",
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

     // console.log("this.rateRows: in final edit", JSON.stringify(rowsById));

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
       // console.log("📊 Forming", rowCount, "rows based on rowsById count");

        if (rowCount > 0) {
          this.isIncludeParticipants =
            this.servicesList && this.servicesList.length > 0;
       /*    console.log(
            "📋 Setting isIncludeParticipants to:",
            this.isIncludeParticipants
          ); */

          this.AddShiftAndServices = await this.buildCustomShiftServices(
            rowsById,
            result
          );
         /*  console.log(
            "🏗️  Built Custom Shift Services:",
            this.AddShiftAndServices.length,
            "rows created"
          ); */
         /*  console.log(
            "AddShiftAndServices in edit ==>" +
              JSON.stringify(this.AddShiftAndServices)
          ); */
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
     console.log("result in populateRowCommon row.staff => "+ row.staff);
    this.orginalShiftStaff=result.shiftwithstaffdata.Staff__c;

    row.stafflabel = result.shiftwithstaffdata.Staff__r.Display_Nickname__c;
     console.log("result in populateRowCommon   row.stafflabel => "+ row.stafflabel);
    row.hourlyrate = result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c || 0;
    row.shiftWithStaffId = this.ShiftwithStafftoApexId;
    row.billablehours = result.shiftwithstaffdata.Shift_Calculated_Duration__c
      ? result.shiftwithstaffdata.Shift_Calculated_Duration__c
      : result.shiftwithstaffdata.Add_Shift__r.Duration__c;

    row.startdate = result.shiftwithstaffdata.Start_Date__c || null;
    row.enddate = result.shiftwithstaffdata.Shift_End_Date__c || null;
    row.address = this.address;
    row.refId=result.shiftwithstaffdata.RefId__c;
    row.recurring =result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c?result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c:false ;
    row.splitShiftRefId=result.shiftwithstaffdata.Split_Shift_RefId__c?result.shiftwithstaffdata.Split_Shift_RefId__c:null;
    row.splitShifts=result.shiftwithstaffdata.New_Split_Shift__c || result.shiftwithstaffdata.Split_Shifts__c;
    row.brokenShifts=result.shiftwithstaffdata.Broken_Shift__c || result.shiftwithstaffdata.Broken_Shift__c;
    row.role=result.shiftwithstaffdata.Role__c ?result.shiftwithstaffdata.Role__c : result.shiftwithstaffdata.Add_Shift__r.Role__c;
    row.brokenExtendedWages =result.shiftwithstaffdata.Broken_Extended_Wage__c ||0;
    row.extraHours =result.shiftwithstaffdata.Broken_Extended_Duration__c ||0;
    row.doubleRate =result.shiftwithstaffdata.Broken_Extended_Rate__c || 0;
    row.brokenShiftAllowance =result.shiftwithstaffdata.Broken_Shift_Allowance__c || 0;
    row.isMinimumEngagementApplied=result.shiftwithstaffdata.Minimum_Engagement_Applied__c ;

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
    row.rowBillableHoursChanged=false;
    


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
          isCustomShift:shiftRow.isCustomShift,
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
          rowOnchangeOccured: true,
          rowBillableHoursChanged:true,
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
          row.participantlabel =  matchingService.Participant_Name__c || "Select Participant";
          row.serviceId = matchingService.Id;
          row.selectedForms = matchingService.Participant_Forms__c ? matchingService.Participant_Forms__c.split(',').map(id => id.trim()) : [];
          row.formsIconClass = row.selectedForms.length > 0 ? "material-icons add-icon selected-address-icon-participant": "material-icons add-icon";

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
        row.stafflabel = result.shiftwithstaffdata.Staff__r.Display_Nickname__c;
        //  row.hourlyrate = result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c || 0;
        row.shiftWithStaffId = this.ShiftwithStafftoApexId;
        row.startdate = result.shiftwithstaffdata.Start_Date__c || null;
        row.enddate = result.shiftwithstaffdata.Shift_End_Date__c || null;
        row.address = this.address;
        row.billablehours = shiftRow.duration;
        row.refId=result.shiftwithstaffdata.RefId__c;
        row.recurring =result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c;
        row.role= result.shiftwithstaffdata.Role__c ?result.shiftwithstaffdata.Role__c : result.shiftwithstaffdata.Add_Shift__r.Role__c

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
       // row.refId = service.Id;
        row.selectedForms = service.Participant_Forms__c ? service.Participant_Forms__c.split(',').map(id => id.trim()) : [];
        row.formsIconClass = row.selectedForms.length > 0 ? "material-icons add-icon selected-address-icon-participant": "material-icons add-icon";
 

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
            if(this.participantAddressCheckBox ==true || this.facilityAddressCheckbox==true ) {

            }
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
      // ✅ If invalid and either checkbox is true, show confirmation message
    if (!isValid && (this.participantAddressCheckBox || this.facilityAddressCheckbox)) {
      this.confirMationMessage(
        "Error",
        "Please fill in all required address fields before proceeding.",
        "Error"
      );
    }

      //  console.log("Address Validation Completed. isValid:", isValid);
      return isValid;
    } else {
      console.error("Error: lightning-input-address component not found.");
      return false;
    }
  }
  async handleDragStart(event) {
  console.log("🎯 Drag Start Triggered");

  const { id, role, param, facilityval, sethours, exceedhours ,staffroles} =
    event.currentTarget.dataset;

  // Set transfer data
  event.dataTransfer.setData("draggingstaffid", id);
  event.dataTransfer.setData("draggedRole", role);
  event.dataTransfer.setData("dataParam", param);
  event.dataTransfer.setData("facilityval", facilityval);
  event.dataTransfer.setData("sethours", sethours);
  event.dataTransfer.setData("exceedhours", exceedhours);
   event.dataTransfer.setData("draggedMultiRole", staffroles);

  // Pretty logs
  console.log(
    "📦 Drag Data:",
    {
      staffId: id,
      role,
      param,
      facilityval,
      sethours,
      exceedhours,
    }
  );
}
  handleDragOver(event) {
    event.preventDefault(); // Required to allow dropping
  }

  async handleDrop(event) {
    event.preventDefault();

    // 🔥 FULL EVENT LOGGING — ADDED
    console.group("📌 DROP EVENT DEBUG");
    console.log("Event:", event);
    console.log("Event Type:", event.type);
    console.log("Target:", event.target);
    console.log("Current Target:", event.currentTarget);

    console.group("📌 DataTransfer Object");
    console.log("dataTransfer:", event.dataTransfer);
    console.log("Available Keys:", event.dataTransfer.types);
   
    console.log("staffId:", event.dataTransfer.getData("staffId"));
    console.log("dataParam:", event.dataTransfer.getData("dataParam"));

    let draggedItemId = event.dataTransfer.getData("draggingstaffid")
    console.log("draggedItemId:", draggedItemId);

    if (!draggedItemId) {
        console.warn("No staffId found in drag data. Skipping drop handling.");
        return;
    }

    console.groupEnd();
    
    console.groupEnd();
    // END EVENT LOGGING

    let role =  event.dataTransfer.getData("draggedRole");
   
    console.log("role " + role);
   
    console.log('event >>>>>', event.dataTransfer);
   
    let dataParam = event.dataTransfer.getData("dataParam");
    console.log("data param " + dataParam);
    
    if (dataParam == "draggingFromStaff") {
      let roleFacilityVal =  event.dataTransfer.getData("draggedMultiRole");
      let facVal = event.dataTransfer.getData("facilityval");
      console.log("sethours  " + event.dataTransfer.getData("sethours"));
      console.log("exceedhours  " + event.dataTransfer.getData("exceedhours"));
      this.emptyFields();
      let holiday = event.currentTarget.dataset.isholiday;
      let shiftdate = event.currentTarget.dataset.weekdate;
      this.addShiftData.AddShiftHoliday = holiday == "true" ? true : false;
      this.AddShiftDayName = event.currentTarget.dataset.weekname;
      this.addShiftData.AddShiftStartDate = shiftdate;
       
        console.log("facilityval " + facVal);
        console.log("holiday " + holiday);
       let facilityVal = event.currentTarget.dataset.facilityval;
          console.log('facilityVal ==>'+facilityVal);
            this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
              this.facilityValue.includes(rec.value)
            );

          console.log('finalSelectedFacilities:', JSON.stringify(this.finalSelectedFacilities));

          if (facilityVal) {
              let facilityArr = facilityVal.split(',').map(f => f.trim());
              console.log('facilityArr:', facilityArr);

              // Extract only values from finalSelectedFacilities
              let allowedFacilityIds = this.finalSelectedFacilities.map(rec => rec.value);
              console.log('allowedFacilityIds:', allowedFacilityIds);

              // Find first matching facility
              let matchedFacility = facilityArr.find(fac => allowedFacilityIds.includes(fac));
              console.log('matchedFacility:', matchedFacility);

              this.addShiftData.AddShiftFacilityValue = matchedFacility || null;
              console.log('Assigned Facility:', this.addShiftData.AddShiftFacilityValue);

          } else {
              this.addShiftData.AddShiftFacilityValue = null;
              console.log('No facilityVal found → Assigned null');
          }
          // console.log("ORG facilities", JSON.stringify(this.facilityOptions));
          
            let fac=[];
            fac.push(this.addShiftData.AddShiftFacilityValue);

            const facRoles = await fetchBulkRoles({ facilityIDList: fac });
            console.log("facRoles " + JSON.stringify(facRoles));

          let rolesArray=[];
            facRoles.forEach(rec => {
                rolesArray.push({ label: rec.Role_Name__c, value: rec.Role_Name__c });
            });
          
            
            this.RoleFilter = [...rolesArray];
          
            let selectedFacilityForRole = this.addShiftData.AddShiftFacilityValue;

            console.log("roleFacilityVal:", roleFacilityVal);
            console.log("selectedFacilityForRole:", selectedFacilityForRole);

            let matchedRole = null;

            if (roleFacilityVal && selectedFacilityForRole) {
                let roleFacilityArr = roleFacilityVal.split(',').map(rf => rf.trim());
                console.log("roleFacilityArr:", roleFacilityArr);

                for (let rf of roleFacilityArr) {
                    let [roleName, facilityId] = rf.split('-');

                    if (facilityId === selectedFacilityForRole) {
                        matchedRole = roleName;
                        break;
                    }
                }
            }

            this.addShiftData.AddShiftRole = matchedRole;
            console.log("Assigned Role:", this.addShiftData.AddShiftRole);

        

       // this.addShiftData.AddShiftRole = role;
        
      //  this.addShiftData.AddShiftFacilityValue = facVal;
       
        this.addShiftData.AddShiftStaffValue = draggedItemId;
      
        this.RolesStaffId = draggedItemId;
        this.addShiftData.AddShiftType = "General";
        this.ServiceStaffValue = draggedItemId;
        this.isCalenderShiftView = true;
        this.isEditShiftScreenFlag = false;
        this.isIncludeParticipants = false;
        this.isStaffView = true;
        this.SplitShiftRows = [];
       
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
           this.shiftPenaltyMode=selectedFacility.shiftPenaltyMode;
        }

        if (this.addShiftData.AddShiftFacilityValue) {
          this.addShiftData.AddShiftFacilityName =
            this.finalSelectedFacilities.find(
              (rec) => rec.value == this.addShiftData.AddShiftFacilityValue
            ).label;

          this.processShifts(this.addShiftData.AddShiftFacilityValue);
        }

        console.log("Dropped item ID:", this.addShiftData.AddShiftStaffValue);

        this.createCalenderShift();
        
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

      this.TimeInDragAndDrop = '';

      let timeSplits = event.dataTransfer.getData("shifttime").split("-");
      this.TimeInDragAndDrop = timeSplits;

      let shiftRecurStatus = event.dataTransfer.getData("recurstatus");
      this.darggingShiftRecurtempalte =
        shiftRecurStatus == "true" ? true : false;

      this.draggingStaffrefId = event.dataTransfer.getData("refid");
      this.draggingStaffShiftId = event.dataTransfer.getData("shiftId");

      this.draggingStaffRate = event.dataTransfer.getData("shiftrate");
       console.log("draggedRole:drop ", event.dataTransfer.getData("draggedRole"));
    console.log("facilityid: drop ", event.dataTransfer.getData("facilityid"));
    this.addShiftData.AddShiftRole=event.dataTransfer.getData("draggedRole");
    this.addShiftData.AddShiftFacilityValue=event.dataTransfer.getData("facilityid");

      console.log(
        " this.draggingstaffid " + event.dataTransfer.getData("draggingstaffid")
      );

      let staffIds = [];
      staffIds.push(this.droppedStaffId);
      const recurrenceDates = [weekDate];

      console.log(" time splits " + JSON.stringify(timeSplits));
      console.log('🔍 Validating staff availability...');
      console.log('Staff IDs:', staffIds.length, 'dates:', recurrenceDates.length);
      console.log('Time:', timeSplits[0], '-', timeSplits[1]);

      this.dragAndDropValiadtion = false;
      this.isShiftDragAndDrop = true;
      this.finalDraggingRefId = '';
      let result = await this.staffSlistOnSelection();
      getFatigueData({
        staffId: this.droppedStaffId,
        strtTimeText: timeSplits[0].toString().toLowerCase().trim(),
        startdate: weekDate
      })
        .then(async (result) => {
          holiday = holiday == "true" ? true : false;
          console.log('in drop  ')
          console.log('holiday => '+holiday);
          console.log('weekName => '+weekName);
          console.log('this.droppedStaffId => '+this.droppedStaffId);
          console.log('shiftType => '+shiftType);
        
          this.droppedStaffRate = this.getServiceStaffHourlyRate(
            holiday,
            weekName,
            this.droppedStaffId,
            shiftType
          );

          console.log(" this.droppedStaffRate " + this.droppedStaffRate);
          console.log("Fatigue Status:", result);

          if (result == true) {
            this.draggingShiftFatigueCheck = true;
          } else {
            this.draggingShiftFatigueCheck = false;
          }
        })
        .catch((error) => {
          console.error("Error fetching fatigue data:", error);
        });
    }
}


  getServiceStaffHourlyRate(isHoliday, dayName, staffId, shiftType) {
  // Get staff data with safe navigation
  const staffData = this.StaffHourlyRates[staffId]?.staffHoulryRate;
  console.log(
  `📌 StaffHourlyRates dump:
  ${JSON.stringify(this.StaffHourlyRates, null, 2)}`
);
  
  if (!staffData) {
    console.log("IN FALLBACK - No staff data found for staffId: " + staffId);
    return 0.0;
  }

  // Get child role (backend already filtered to matching role)
  const childRole = staffData.StaffRoles__r && staffData.StaffRoles__r.length > 0 
    ? staffData.StaffRoles__r[0] 
    : null;
  
 // console.log("Staff Data: " + JSON.stringify(staffData));
  //console.log("Child Role: " + (childRole ? JSON.stringify(childRole) : "No child role found"));
  console.log("Shift Type: " + shiftType);
  console.log("Day Name: " + dayName);
  console.log("Is Holiday: " + isHoliday);
  console.log('start time in houlry rate '+this.addShiftData.AddShiftStartTime);
  console.log('End time in houlry rate '+this.addShiftData.AddShiftEndTime);
   console.log('shift penalty mode in hourly rate==>'+this.shiftPenaltyMode);

  let rate = 0;
  this.hourlrRateLabel = "Rate($/hr)";
  this.hourlyrateDisable = true;

  // Sleepover Shift with special cases
  if (shiftType == "Sleepover Shift") {
    console.log("IN SLEEPOVER SHIFT");
    this.hourlrRateLabel = "Allowance";
    this.hourlyrateDisable = false;
    rate = childRole?.Sleepover_Allowance__c || staffData.Sleepover_Allowance__c || 0;
    console.log("Sleepover Rate: " + rate + " (Source: " + (childRole?.Sleepover_Allowance__c ? "Child Role" : "Parent Staff") + ")");
    return parseFloat(rate.toFixed(2));
  }
 

   if (
        this.shiftPenaltyMode === "Schads" &&
         !["Day 5", "Day 6", "Day 12", "Day 13"].includes(dayName) && this.addShiftData.AddShiftType != "Custom"
    ) {
      console.log('inside if penalty mode');

        // Convert Salesforce time (HH:mm:ssZ) → seconds
        const toSeconds = (sfTime) => {
            if (!sfTime) return null;
            const clean = sfTime.replace("Z", "");
            const [h, m, s] = clean.split(":").map(Number);
            return h * 3600 + m * 60 + s;
        };

        const startSec = toSeconds(this.addShiftData.AddShiftStartTime);
        const endSec = toSeconds(this.addShiftData.AddShiftEndTime);

        const SIX_AM = 6 * 3600;        // 06:00:00
        const EIGHT_PM = 20 * 3600;     // 20:00:00
        const MIDNIGHT = 24 * 3600;     // 24:00:00

        console.log("SCHADS Start Seconds:", startSec);
        console.log("SCHADS End Seconds:", endSec);

        // 🔴 NIGHT SHIFT — highest priority
        if (
            startSec !== null &&
            endSec !== null &&
            (startSec < SIX_AM || endSec >= MIDNIGHT)
        ) {
            rate =
                childRole?.Night_Shift_Hourly_Rate__c ||
                staffData.Night_shift_Hourly_Rate__c ||
                0;

            console.log("SCHADS NIGHT rate applied:", rate);
            return parseFloat(rate.toFixed(2));
        }

        // 🟠 AFTERNOON SHIFT
        if (
            endSec !== null &&
            endSec >= EIGHT_PM &&
            endSec < MIDNIGHT
        ) {
            rate =
                childRole?.Afternoon_Shift_Hourly_Rate__c ||
                staffData.Afternoon_shift_Hourly_Rate__c ||
                0;

            console.log("SCHADS AFTERNOON rate applied:", rate);
            return parseFloat(rate.toFixed(2));
        }
    }


  // Public Holiday
  if (isHoliday) {
    this.hourlrRateLabel = "Rate($/hr)";
    this.hourlyrateDisable = true;
    rate = childRole?.Public_Holiday_Hourly_Rate__c || staffData.Public_holiday_Hourly_Rate__c || 0;
    console.log("Holiday Rate: " + rate + " (Source: " + (childRole?.Public_Holiday_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
    return parseFloat(rate.toFixed(2));
  }

  switch (dayName) {
    case "Day 6": // Sunday
     case "Day 13": 
      this.hourlrRateLabel = "Rate($/hr)";
      this.hourlyrateDisable = true;
      rate = childRole?.Sunday_Hourly_Rate__c || staffData.Sunday_Hourly_Rate__c || 0;
      console.log("Sunday Rate: " + rate + " (Source: " + (childRole?.Sunday_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
      return parseFloat(rate.toFixed(2));

    case "Day 5": // Saturday
    case "Day 12":
      this.hourlrRateLabel = "Rate($/hr)";
      this.hourlyrateDisable = true;
      rate = childRole?.Saturday_Hourly_Rate__c || staffData.Saturday_Hourly_Rate__c || 0;
      console.log("Saturday Rate: " + rate + " (Source: " + (childRole?.Saturday_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
      return parseFloat(rate.toFixed(2));

    default:
      switch (shiftType) {
        case "General":
        case "Morning":
          this.hourlrRateLabel = "Rate($/hr)";
          this.hourlyrateDisable = true;
          rate = childRole?.Hourly_Rate__c || staffData.Working_Hours_Rate__c || 0;
          console.log("Working Hours/Morning Rate: " + rate + " (Source: " + (childRole?.Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));

        case "Night":
          this.hourlrRateLabel = "Rate($/hr)";
          this.hourlyrateDisable = true;
          rate = childRole?.Night_Shift_Hourly_Rate__c || staffData.Night_shift_Hourly_Rate__c || 0;
          console.log("Night Shift Rate: " + rate + " (Source: " + (childRole?.Night_Shift_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));

        case "Afternoon":
          this.hourlrRateLabel = "Rate($/hr)";
          this.hourlyrateDisable = true;
          rate = childRole?.Afternoon_Shift_Hourly_Rate__c || staffData.Afternoon_shift_Hourly_Rate__c || 0;
          console.log("Afternoon Shift Rate: " + rate + " (Source: " + (childRole?.Afternoon_Shift_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));

        case "Custom":
          this.hourlrRateLabel = "Rate($/hr)";
          this.hourlyrateDisable = true;
          console.log("Custom Shift - Returning 0.0");
          return 0.0;

        default:
          this.hourlrRateLabel = "Rate($/hr)";
          this.hourlyrateDisable = true;
          rate = childRole?.Hourly_Rate__c || staffData.Working_Hours_Rate__c || 0;
          console.log("Default Working Hours Rate: " + rate + " (Source: " + (childRole?.Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));
      }
  }
}


  handleDeleteShift(event) {
    this.isShowSpinner = true;
    // Prevent deletion if status is "In Progress"
 console.log('this.isShiftDeleteCancel in delete conf',this.isShiftDeleteCancel);
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
      }else if (this.isShiftDeleteCancel === 'Cancel') {
        this.shiftCanceltemplate = true;
        this.isShiftDeleteCancelTempalte = false;
        this.shiftDeleteCancelHeaderTemplate=false;
        this.shiftDeleteConfirmation = false;
        this.isShowSpinner = false;

    getShiftDataByShiftId({ ShiftId: this.shiftDeleteCOnfirmationInfo.shiftID })
        .then(result => {
            console.log('result during shift cancel ' + JSON.stringify(result));

            // default placeholders
            let participantName = "Unallocated";
            let servicesRows = [];
            let totalOriginal = 0;

            if (result && result.length > 0) {
                const shift = result[0];

                // build shift label
                const startDate = new Date(shift.Start_Date__c);
            let formattedDate = startDate.toLocaleDateString('en-US', {
              month: '2-digit', day: '2-digit', year: 'numeric'
            });
          formattedDate =String(startDate.getDate()).padStart(2, "0") + "/" +String(startDate.getMonth() + 1).padStart(2, "0") + "/" +  startDate.getFullYear();
                const startTime = shift.Start_time_Formula__c; // e.g. "9:00 AM"
                const endTime = shift.End_time_formula__c;     // e.g. "5:00 PM"
                const shiftLabel = `${formattedDate}, ${startTime} - ${endTime}`;

                // Build service rows if present
                if (shift.Services_and_Support_Plans__r?.length > 0) {
                    const services = shift.Services_and_Support_Plans__r;

                    // unique participant names
                    participantName = [
                        ...new Set(
                            services.map(s => s.Client__r?.Display_Nickname__c || "Unallocated")
                        )
                    ].join(', ');

                    // build service rows for UI (id, displayName, originalAmount, payment, billParticipant)
                   servicesRows = services.map(s => {
                      const orig = Number(s.Amount__c) || 0;
                      const billBool = true; // default boolean
                      return {
                          id: s.Id,
                          displayName: s.Client__r?.Display_Nickname__c || 'Unallocated',
                          originalAmount: orig,
                          payment: orig,
                          billParticipant: billBool,         // boolean for backend
                          billValue: billBool ? 'yes' : 'no', // string for template binding
                          serviceName: s.Support_Item_Name__c,
                          billParticipant:true,
                          participantAmount:0
                      };
                  });

                    totalOriginal = servicesRows.reduce((sum, r) => sum + (Number(r.originalAmount) || 0), 0);
                }

                const staffName = shift.Staff__r?.Display_Nickname__c || "Unassigned";
                const defaultMode = (servicesRows.length > 1) ? 'combined' : 'individual';

                // single assignment for shifCancelData (numbers used for amounts)
               
                  this.shifCancelData = {
                    shiftLabel: shiftLabel,
                    staffName: staffName,
                    participantName: participantName,

                    services: servicesRows,
                    // totals
                    staffPayment: servicesRows.reduce((sum, x) => sum + (Number(x.payment) || 0), 0),
                    originalStaffValue: servicesRows.reduce((sum,x) => sum + (Number(x.originalAmount)||0), 0),
                    originalParticipantValue: servicesRows.reduce((sum,x) => sum + (Number(x.originalAmount)||0), 0),
                    participantPayment:0,

                    // defaults
                    reason: "Other",
                    cancelledBy: "Participant",
                    note: "",
                    shortNotice: "Yes",
                    billParticipant: true,
                    cancelMode: defaultMode
                  };

                console.log('Shift-cancel screen data → ', JSON.stringify(this.shifCancelData));
            }
        })
        .catch(err => {
            console.error('Error fetching shift for cancel:', err);
        });
}else if (this.recurredShiftsDelete == true) {
        this.shiftDeleteConfirmation = false;
        this.shiftCanceltemplate=false;
        this.isShiftDeleteCancelTempalte=false;
        this.shiftDeleteCancelHeaderTemplate=false;
        console.log(' ref id '+this.shiftDeleteCOnfirmationInfo.refId);
        console.log(' ref id '+this.shiftDeleteCOnfirmationInfo.recurStartDate);
        console.log('recuring shifts to delete ==>'+JSON.stringify(this.recuringShiftsToDelete));
        deleterecurShifts({
          refId: this.shiftDeleteCOnfirmationInfo.refId,
          recurDate: this.shiftDeleteCOnfirmationInfo.recurStartDate,
          recuringShiftsToDelete :this.recuringShiftsToDelete
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
            this.recuringShiftsToDelete=[];
            this.refreshStaffData();
           
            return refreshApex(this.wiredServicesResult);
          })
          .catch((error) => {
            this.confirMationMessage("Error", "Error deleting shift.", "error");
            this.shiftDeleteConfirmation = false;
            this.isShowSpinner = false;
            console.log("error " +JSON.stringify(error) );
          });
      } else {
        console.log("No Services exist for shift."); // Proceed with record deletion
            this.shiftDeleteConfirmation = false;
            this.shiftCanceltemplate=false;
            this.isShiftDeleteCancelTempalte=false;
            this.shiftDeleteCancelHeaderTemplate=false;
            deleteShiftNotification({shiftId :this.shiftDeleteCOnfirmationInfo.shiftID}).then(result=>{
              console.log('result ==> '+JSON.stringify());
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
                  
                    return refreshApex(this.wiredServicesResult);
                  })
                  .catch((error) => {
                    console.error("Error deleting shift:", error);
                    this.confirMationMessage("Error", "Error deleting shift.", "error");
                    this.shiftDeleteConfirmation = false;
                    this.isShowSpinner = false;
                  });
            })
       
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
    this.isShiftDeleteCancelTempalte=false;
    this.shiftDeleteCancelHeaderTemplate=false;
    this.openRecurCheckList=false;
   // this.recuringShiftsToDelete=[];

  }
  handleDeleteRecurShifts(event) {
    this.recurredShiftsDelete = event.target.checked;
    this.isShiftDeleteCancelTempalte=true;
    this.shiftDeleteCancelHeaderTemplate=false;
    console.log("recurredShiftsDelete" + this.recurredShiftsDelete);
  }
 async handleShiftDeleteConfirmation(event) {
    console.log("handleShiftDeleteConfirmation");
    console.log("status==>" + event.currentTarget.dataset.status);
    console.log("refid==>" + event.currentTarget.dataset.refid);
    console.log("facilityId==>" + event.currentTarget.dataset.facilityid);
    const facilityId = event.currentTarget.dataset.facilityid;

    // Find selected facility
    const selectedFacility = this.facilityOptions.find(
      (fac) => fac.value === facilityId
    );

    // Assign shift cancellation period
    this.shiftCancellationPeriod = selectedFacility
      ? Number(selectedFacility.shiftCancellationPeriod)
      : 0;

    console.log("Assigned Shift Cancellation Period:",this.shiftCancellationPeriod);

    const status = event.currentTarget.dataset.status;
      if (status === 'Cancelled' || status === 'Completed' || status === 'InProgress') {
        this.confirMationMessage(
            "Action Not Allowed",
            "This shift cannot be cancelled because it is already " + status.toLowerCase() + ".",
            "warning"
        );
        return;
    }
    this.recurredShiftsDelete = false;
    this.isShiftDeleteCancel ='Delete';
    this.shiftDeleteCOnfirmationInfo = {};
    this.shiftDeleteCOnfirmationInfo.status = event.currentTarget.dataset.status;
    this.shiftDeleteCOnfirmationInfo.shiftID = event.currentTarget.dataset.id;
     
    this.shiftDeleteCOnfirmationInfo.refId = event.currentTarget.dataset.refid;
    this.shiftDeleteCOnfirmationInfo.recurStatus = event.currentTarget.dataset.recurstatus == "true" ? true : false;

    
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
    this.shiftCanceltemplate=false;
    this.shiftDeleteTempalte=false;
     this.shiftRecurDeleteInCancel=false;
        const dateStr = this.shiftDeleteCOnfirmationInfo.recurStartDate; // "YYYY-MM-DD"
      const [year, month, day] = dateStr.split('-').map(Number);

      // recur date at LOCAL midnight (no time portion)
      const recurMidnight = new Date(year, month - 1, day);

      // today at LOCAL midnight (drop hours/minutes/seconds)
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // difference in whole days (integer)
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.round((recurMidnight - todayMidnight) / msPerDay);
      const bufferDays = Number(this.shiftCancellationPeriod);
      console.log("diffDays >>", diffDays);
      console.log("Buffer Days >>", bufferDays);
     /*  await refreshApex(this.wiredServicesResult).then(() => {
      console.log("Updated Service List:", JSON.stringify(this.servicesList));

      // Check if services exist for the shift
      
        this.servicesList.length > 0
      }) */

  
    let servResult= await getServicesByShiftImperative({shiftStaffId:this.shiftDeleteCOnfirmationInfo.shiftID});
     console.log('servResult '+servResult.length);

      console.log("diffDays:", diffDays);
/*
      if (diffDays < 0) {
        // negative → confirmation only
        this.shiftDeleteConfirmation = true;
        this.isShiftDeleteCancelTempalte = false;
      } else if (diffDays < 7 && servResult.length ) {
        // 0 to 6 → show template
        this.isShiftDeleteCancelTempalte = true;
        this.shiftDeleteConfirmation = false;
       this.shiftRecurDeleteInCancel=this.shiftDeleteCOnfirmationInfo.recurStatus;

      } else {
        // 7+ days → confirmation only
        this.shiftDeleteConfirmation = true;
        this.isShiftDeleteCancelTempalte = false;
      }
       
    console.log("isShiftDeleteCancelTempalte:", this.isShiftDeleteCancelTempalte); 
    console.log("shiftDeleteConfirmation:", this.shiftDeleteConfirmation); 
*/
    if (diffDays < 0) {
        // negative → confirmation only
        this.shiftDeleteConfirmation = true;
        this.isShiftDeleteCancelTempalte = false;
        this.shiftDeleteCancelHeaderTemplate=false;
      } else if (diffDays < bufferDays && servResult.length && status !='Draft' ) {
        // 0 to 6 → show template
        this.isShiftDeleteCancelTempalte = true;
        this.shiftDeleteCancelHeaderTemplate=true;
        this.shiftDeleteConfirmation = false;
       this.shiftRecurDeleteInCancel=this.shiftDeleteCOnfirmationInfo.recurStatus;
      } else {
        // 7+ days → confirmation only
        this.shiftDeleteConfirmation = true;
        this.isShiftDeleteCancelTempalte = false;
        this.shiftDeleteCancelHeaderTemplate=false;
      }
       if(this.shiftDeleteCOnfirmationInfo.recurStatus ==true){
       const recurDates = await getRecurringShiftDates({
        refId: this.shiftDeleteCOnfirmationInfo.refId
        });
        console.log('recurDates ==>'+JSON.stringify(recurDates));
         this.recurringDatesForChild=recurDates;

    }
    

    console.log("isShiftDeleteCancelTempalte:", this.isShiftDeleteCancelTempalte); 
    console.log("shiftDeleteConfirmation:", this.shiftDeleteConfirmation);

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
       { label: "Draft", value: "Draft" },
      { label: "Completed", value: "Completed" },
      { label: "In Progress", value: "InProgress" },
      { label: "Accepted", value: "Accepted" },
      { label: "Unassigned", value: "Unassigned" },
      { label: "Cancelled", value: "Cancelled" }
    ];
    this.viewOptions=[
      { label: 'Weekly', value: 'weekly' },
      { label: 'Fortnightly', value: 'fortnightly' }
    ]
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
       { label: "Draft", value: "Draft" },
      { label: "Completed", value: "Completed" },
      { label: "In Progress", value: "InProgress" },
      { label: "Accepted", value: "Accepted" },
      { label: "Cancelled", value: "Cancelled" }
    ];
     this.viewOptions=[
      { label: 'Weekly', value: 'weekly' },
      { label: 'Fortnightly', value: 'fortnightly' },
      { label: 'Monthly', value: 'monthly' }
    ]
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
  handleRejectedshifts() {
    this.childRejectedShifts = true;
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
  //console.log('--- selectedFacilities GETTER ---');
 // console.log('facilityValue:', JSON.stringify(this.facilityValue));

  const result = this.facilityOptions.filter((opt) =>
    this.facilityValue.includes(opt.value)
  );

  /* console.log(
    'selectedFacilities result:',
    JSON.stringify(result.map(r => r.value))
  ); */

  return result;
}

 get facilityCheckboxOptions() {
  //console.log('--- facilityCheckboxOptions GETTER ---');
  //console.log('facilityValue:', JSON.stringify(this.facilityValue));

  const result = this.filteredFacilityOptions.map((option) => {
    return {
      ...option,
      checked: this.facilityValue.includes(option.value)
    };
  });

  /* console.log(
    'checkbox checked values:',
    JSON.stringify(
      result.filter(r => r.checked).map(r => r.value)
    )
  ); */

  return result;
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


  

  handleFacilityCheckboxChange(event) {
    const value = event.target.value;
    if (event.target.checked) {
      if (!this.facilityValue.includes(value)) {
        this.facilityValue = [...this.facilityValue, value];
      }
    } else {
      this.facilityValue = this.facilityValue.filter((v) => v !== value);
    }
    console.log('this.facilityValue ==> '+JSON.stringify(this.facilityValue));
    localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue));
    this.updateSearchInputLabel();
    this.fetchInitialData();
  }

  removeFacility(event) {
    const value = event.currentTarget.dataset.id;
    this.facilityValue = this.facilityValue.filter((v) => v !== value);
    this.updateSearchInputLabel();
     localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue));
       localStorage.removeItem('SelctedComboBoxRole');
    this.fetchInitialData();
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
     if (!this.addShiftData.AddShiftTypeName ) {
      this.confirMationMessage(
        "Error",
        "This shift name is required before saving." ,
        "Error"
      );
       this.isShowSpinner = false;
      return;
    }

    // Check if at least one row has staff value (first row validation)
     const allHaveStaff = this.AddShiftAndServices.every(row => row.staff);
    
    if (!allHaveStaff) {
      this.confirMationMessage(
        "Error",
        "Staff selection is required for all rows before saving.",
        "Error"
      );
      this.isShowSpinner = false;
      return;
    }
      if (this.recurEndDate) {
      const startDate = new Date(this.addShiftData.AddShiftStartDate);
      const endDate = new Date(this.recurEndDate);

      console.log('Validation check:');
      console.log('Start Date:', startDate);
      console.log('End Date:', endDate);

      if (startDate > endDate) {
        //  console.error('Validation Error: Start date cannot be after the end date.');
          this.confirMationMessage(
              "Error",
              "Start date cannot be after the end date.",
              "Error"
          );
          this.isShowSpinner = false;
          return;
      }
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
        if (this.brokenShift == true) {
          if (this.AddShiftAndServices.length == 1) {
            this.confirMationMessage(
                "Warning",
                "Add at least two rows for a Broken shift.",
                "Warning"
            );
            this.isShowSpinner = false;
            return; 
          }
        
          const isValid = await this.validateBrokenShiftsSegments();
          if (!isValid) {
            this.isShowSpinner = false;
            return; // stop further processing if validation failed
          }
      }



    // Use recurring dates if available, otherwise single date array
    const recurrenceDates =
      this.AddShiftRecurringCheckboxValue == true
        ? this.recurrenceDatesList
        : [this.finalAddShiftData.shiftDetails.AddShiftStartDate];
    console.log(
      " recurrence date list " + JSON.stringify(this.recurrenceDatesList)
    );
      
      let staffRows=this.prepareStaffRows();
      this.finalEndStaffRows=staffRows;
      const payload = {
          addShiftData: this.finalAddShiftData,
          staffRows:staffRows ,
          isSplitShift: this.splitShift,
          isGroupShift: this.groupShift,
          isCustomShift: this.customShift,
          isRecurringShift: this.AddShiftRecurringCheckboxValue,
          includeParticipants: this.AddShiftIncludePartcipants,
          isEdit: this.isEditShiftScreenFlag,
          LongShiftTimeSlots: JSON.stringify(this.LongShiftTimeSlots),
          selectedShiftMode:this.selectedShiftMode,
          isBrokenShift:this.brokenShift,
          brokenExtended:JSON.stringify(this.extendedBrokenMeta)
          
      };
     console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));

    
    
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
          console.log('old amounts ',JSON.stringify( this.originalServiceAmounts));
             
          if (this.isEditShiftScreenFlag) {
              // EDIT MODE: Calculate net change
              const originalAmount = this.originalServiceAmounts[ser.serviceId] 
                ? parseFloat(this.originalServiceAmounts[ser.serviceId].amount) || 0 
                : 0;
                console.log('originalAmount ==>' +originalAmount);

               console.log('newAmount ==>' +newAmount);
              const amountChange = newAmount - originalAmount;
              
              // If amount is same or less, skip funding validation for this service
              if (amountChange <= 0) {
                  console.log(`✅ EDIT MODE - No increase in amount, skipping funding check for service: ${ser.serviceType}`);
                  return; // Skip this service in forEach
              }
              
              if (this.AddShiftRecurringCheckboxValue) {
                  totalAmount = amountChange * (this.recurOccurencesValue || 1);
              } else {
                  totalAmount = amountChange;
              }
              
              console.log(`✏️ EDIT MODE - Service: ${ser.serviceType}, Original: $${originalAmount}, New: $${newAmount}, Change: $${amountChange}, Total Impact: $${totalAmount}`);
          }else {
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
    
      const staffIds = this.finalEndStaffRows.map(staff => staff.staffId);
      this.finalEndRecurrenceDates=recurrenceDates;

       const result = await validateStaffAvailabilityWithReasons({
            staffIds: staffIds,
            inputDates: recurrenceDates,
            startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
            endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
            isAvailability: 'Yes',
            isEditMode: this.isEditShiftScreenFlag,
            currentShiftId: this.ShiftwithStafftoApexId,
            currentAvailabilityId:null,
            shiftFacilityId:this.addShiftData.AddShiftFacilityValue,
            shiftRole :this.addShiftData.AddShiftRole
        });
        console.log('validateStaffAvailability  result==> '+JSON.stringify(result));
        const isOverlapping=  this.handleNonRecurringValidation(result);
              if (!isOverlapping) {
              this.isShowSpinner = false;
              return;
        }
      // new implementation for availability
  
       const shiftCompliance = await shiftComplianceValidations({
            facilityId :this.addShiftData.AddShiftFacilityValue,
            staffIds: staffIds,
            inputDates: recurrenceDates,
            startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
            endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
            isEditMode: this.isEditShiftScreenFlag,
            currentShiftId: this.ShiftwithStafftoApexId,
             shiftRole :this.addShiftData.AddShiftRole
      
        });
        console.log('shiftCompliance  result==> '+JSON.stringify(shiftCompliance));
          
            const isValid = this.handleShiftComplianceWarnings(shiftCompliance);

          if (!isValid) {
              this.isShowSpinner = false;
              return;
          }
            
        const Unavailresult = await  checkShiftWithinAvailability({
            staffIds: staffIds,
            inputDates: recurrenceDates,
            startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
            endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
        });
        console.log('result  in availability '+JSON.stringify(Unavailresult));
        if (Unavailresult && Object.keys(Unavailresult).length > 0) {
  
          this.unavailableStaffNames = Object.values(Unavailresult);

          console.log('Unavailable staff:',  JSON.stringify(this.unavailableStaffNames));
          const names = this.unavailableStaffNames.join(', ');
       

          this.isShowSpinner = false;
          this.unavailableTemplate=true;
          return;
         }

         

    
 if (this.deletedChecklist.length > 0) {
      let AddShiftCheckListId = [];
      this.deletedChecklist.forEach((row) => {
        AddShiftCheckListId.push(row.checkListId);
      });

      deleteCheckList({ checkListId: AddShiftCheckListId }).then((result) => {
        console.log("checklist delete result " + result);
      });
    }



    createShift({
      jsonPayload: JSON.stringify(payload),
      recurrenceDates: recurrenceDates,
       staffDateConflictsJson:JSON.stringify(this.staffDateConflicts)
    })
      .then((result) => {
        
        if(this.recuringShiftsToDelete?.length){
            this.updateChecklistInRecurring();
        }
             this.postSuccessOperation(result);
      })
      .catch((error) => {
        console.error("❌ Error:", JSON.stringify(error));
        this.isShowSpinner = false;
      }); 
  }
  handleCloseUnavailabletemplate(){
    this.unavailableTemplate=false;
    this.unavailableStaffNames=[];
    this.showComplianceWarningModal=false;
    this.staffDateWarnings=[];
    this.showMobileSettings=false;

  }

 
   handleNonRecurringValidation(validationResult) {
    this.staffDateConflicts = [];
    
    for (const [staffId, dateReasons] of Object.entries(validationResult)) {
        if (Object.keys(dateReasons).length > 0) {
            const staffRecord = this.staffOptions.find(staff => staff.value === staffId);
            const staffName = staffRecord ? staffRecord.label : 'Unknown Staff';
            
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
                staffName: staffName,
                conflictDates: conflictDates
            });
        }
    }
    
    if (this.staffDateConflicts.length > 0) {
        this.showErrorModal = true;
        return false;
    }
    return true;
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

  async hanleProceedWithShiftCompliance(){
    this.showComplianceWarningModal=false;
    this.staffDateWarnings=[];
      const staffIds = this.finalEndStaffRows.map(staff => staff.staffId);
        const Unavailresult = await  checkShiftWithinAvailability({
            staffIds: staffIds,
            inputDates: this.finalEndRecurrenceDates,
            startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
            endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
        });
        console.log('result  in availability '+JSON.stringify(Unavailresult));
        if (Unavailresult && Object.keys(Unavailresult).length > 0) {
  
          this.unavailableStaffNames = Object.values(Unavailresult);

          console.log('Unavailable staff:',  JSON.stringify(this.unavailableStaffNames));
          const names = this.unavailableStaffNames.join(', ');
       

          this.isShowSpinner = false;
          this.unavailableTemplate=true;
          return;
         }

         
     if (this.deletedChecklist.length > 0) {
          let AddShiftCheckListId = [];
          this.deletedChecklist.forEach((row) => {
            AddShiftCheckListId.push(row.checkListId);
          });

          deleteCheckList({ checkListId: AddShiftCheckListId }).then((result) => {
            console.log("checklist delete result " + result);
          });
        }
        
          const payload = {
              addShiftData: this.finalAddShiftData,
              staffRows:this.finalEndStaffRows ,
              isSplitShift: this.splitShift,
              isGroupShift: this.groupShift,
              isCustomShift: this.customShift,
              isRecurringShift: this.AddShiftRecurringCheckboxValue,
              includeParticipants: this.AddShiftIncludePartcipants,
              isEdit: this.isEditShiftScreenFlag,
              LongShiftTimeSlots: JSON.stringify(this.LongShiftTimeSlots),
              selectedShiftMode:this.selectedShiftMode,
               isBrokenShift:this.brokenShift,
                brokenExtended:JSON.stringify(this.extendedBrokenMeta)
          };
        this.isShowSpinner = true;

       

        createShift({
          jsonPayload: JSON.stringify(payload),
          recurrenceDates: this.finalEndRecurrenceDates,
          staffDateConflictsJson:JSON.stringify(this.staffDateConflicts)
        })
          .then((result) => {
                this.postSuccessOperation(result);
                 if(this.recuringShiftsToDelete?.length){
              this.updateChecklistInRecurring();
            }
          })
          .catch((error) => {
            console.error("❌ Error:", JSON.stringify(error));
            this.isShowSpinner = false;
          }); 
    
    }

    handleFinalRosterCreation(){
        if (this.deletedChecklist.length > 0) {
      let AddShiftCheckListId = [];
      this.deletedChecklist.forEach((row) => {
        AddShiftCheckListId.push(row.checkListId);
      });

      deleteCheckList({ checkListId: AddShiftCheckListId }).then((result) => {
        console.log("checklist delete result " + result);
      });
    }
    this.unavailableTemplate=false;
 
      const payload = {
          addShiftData: this.finalAddShiftData,
          staffRows:this.finalEndStaffRows ,
          isSplitShift: this.splitShift,
          isGroupShift: this.groupShift,
          isCustomShift: this.customShift,
          isRecurringShift: this.AddShiftRecurringCheckboxValue,
          includeParticipants: this.AddShiftIncludePartcipants,
          isEdit: this.isEditShiftScreenFlag,
          LongShiftTimeSlots: JSON.stringify(this.LongShiftTimeSlots),
          selectedShiftMode:this.selectedShiftMode,
           isBrokenShift:this.brokenShift,
          brokenExtended:JSON.stringify(this.extendedBrokenMeta)
      };
     console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));
       console.log("🚀 this.staffDateConflicts:", JSON.stringify(this.staffDateConflicts)); 
     this.isShowSpinner = true;
     this.showErrorModal = false;

      
   createShift({
      jsonPayload: JSON.stringify(payload),
      recurrenceDates: this.finalEndRecurrenceDates,
       staffDateConflictsJson:JSON.stringify(this.staffDateConflicts)
    })
      .then((result) => {
          this.postSuccessOperation(result);
          this.closeErrorModal();
          if(this.recuringShiftsToDelete?.length){
          this.updateChecklistInRecurring();
      }

      })
      .catch((error) => {
        console.error("❌ Error:", JSON.stringify(error));
        this.isShowSpinner = false;
      });
    }
 async hanleRecurShiftsCreation(){
       this.showErrorModal = false;
       const staffIds = this.finalEndStaffRows.map(staff => staff.staffId);
      const shiftCompliance = await shiftComplianceValidations({
              facilityId :this.addShiftData.AddShiftFacilityValue,
              staffIds: staffIds,
              inputDates: this.finalEndRecurrenceDates,
              startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
              endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
              isEditMode: this.isEditShiftScreenFlag,
              currentShiftId: this.ShiftwithStafftoApexId,
               shiftRole :this.addShiftData.AddShiftRole
        
          });
        console.log('shiftCompliance  result==> '+JSON.stringify(shiftCompliance));
          
          const isValid = this.handleShiftComplianceWarnings(shiftCompliance);

          if (!isValid) {
              this.isShowSpinner = false;
              return;
          }
            
        const Unavailresult = await  checkShiftWithinAvailability({
            staffIds: staffIds,
            inputDates: this.finalEndRecurrenceDates,
            startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
            endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
        });
        console.log('result  in availability '+JSON.stringify(Unavailresult));
        if (Unavailresult && Object.keys(Unavailresult).length > 0) {
  
          this.unavailableStaffNames = Object.values(Unavailresult);

          console.log('Unavailable staff:',  JSON.stringify(this.unavailableStaffNames));
          const names = this.unavailableStaffNames.join(', ');
       

          this.isShowSpinner = false;
          this.unavailableTemplate=true;
          return;
         }
  
    if (this.deletedChecklist.length > 0) {
      let AddShiftCheckListId = [];
      this.deletedChecklist.forEach((row) => {
        AddShiftCheckListId.push(row.checkListId);
      });

      deleteCheckList({ checkListId: AddShiftCheckListId }).then((result) => {
        console.log("checklist delete result " + result);
      });
    }
    this.unavailableTemplate=false;
   
      const payload = {
          addShiftData: this.finalAddShiftData,
          staffRows:this.finalEndStaffRows ,
          isSplitShift: this.splitShift,
          isGroupShift: this.groupShift,
          isCustomShift: this.customShift,
          isRecurringShift: this.AddShiftRecurringCheckboxValue,
          includeParticipants: this.AddShiftIncludePartcipants,
          isEdit: this.isEditShiftScreenFlag,
          LongShiftTimeSlots: JSON.stringify(this.LongShiftTimeSlots),
          selectedShiftMode:this.selectedShiftMode,
          isBrokenShift:this.brokenShift,
          brokenExtended:JSON.stringify(this.extendedBrokenMeta)
      };
     console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));
       console.log("🚀 this.staffDateConflicts:", JSON.stringify(this.staffDateConflicts)); 
     this.isShowSpinner = true;
    
   
   createShift({
      jsonPayload: JSON.stringify(payload),
      recurrenceDates: this.finalEndRecurrenceDates,
       staffDateConflictsJson:JSON.stringify(this.staffDateConflicts)
    })
      .then((result) => {
          this.postSuccessOperation(result);
          this.closeErrorModal();
        if(this.recuringShiftsToDelete?.length){
          this.updateChecklistInRecurring();
        }

      })
      .catch((error) => {
        console.error("❌ Error:", JSON.stringify(error));
        this.isShowSpinner = false;
      });
   }

  handleShiftComplianceWarnings(validationResult) {
    this.staffDateWarnings = [];

    // Iterate staff-wise
    for (const [staffId, dateMap] of Object.entries(validationResult)) {

        if (!dateMap || Object.keys(dateMap).length === 0) {
            continue;
        }

        const staffRecord =
            this.staffOptions.find(s => s.value === staffId);

        const staffName = staffRecord
            ? staffRecord.label
            : 'Unknown Staff';

        const conflictDates = [];

        // -----------------------------
        // SORT DATES CHRONOLOGICALLY
        // -----------------------------
        const sortedDates = Object.keys(dateMap)
            .sort((a, b) => new Date(a) - new Date(b));

        // -----------------------------
        // EXPAND REASONS PER DATE
        // -----------------------------
        for (const dateString of sortedDates) {

            const reasons = dateMap[dateString];

            if (!reasons || reasons.length === 0) {
                continue;
            }

            for (const reason of reasons) {

                conflictDates.push({
                    key: staffId + '_' + dateString + '_' + reason,
                    rawDate: dateString,
                    displayDate: this.formatDisplayDate(dateString),
                    reason: reason
                });
            }
        }

        // -----------------------------
        // PUSH STAFF BLOCK
        // -----------------------------
        if (conflictDates.length > 0) {
            this.staffDateWarnings.push({
                staffId: staffId,
                staffName: staffName,
                conflictDates: conflictDates
            });
        }
    }

    // -----------------------------
    // SHOW MODAL IF WARNINGS EXIST
    // -----------------------------
    if (this.staffDateWarnings.length > 0) {
        this.showComplianceWarningModal = true;
        return false;
    }

    return true;
}



    closeErrorModal() {
        // Close the modal
        this.showErrorModal = false;
        // Clear the errors
       this.staffDateConflicts = [];
       this.isShiftDragAndDrop=false;
       this.unavailableTemplate=false;
       this.unavailableStaffNames=[];

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
postSuccessOperation(result){
    // console.log("✅ Shift created:", result);
        let parts = result.split("shifts ==>"); 
        let message = parts[0].trim();
        let shiftsJson = parts[1] ? JSON.parse(parts[1]) : [];

        console.log("✅ Message:", message);
        console.log("✅ First shift:", shiftsJson[0]);
        console.log('selectedShiftMode ==>'+this.selectedShiftMode);

        this.isCalenderShiftView = false;
        this.isHome = true;
        this.isStaffView = true;
        this.isShowSpinner = false;
        this.AddShiftAndServices = [];
        
      if (this.addShiftData.AddShiftnotification == true  && this.selectedShiftMode=='Active') { //
         
          console.log('🟦 addShiftData object:', JSON.stringify(this.addShiftData))
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
                groupShift:true,
                endDate: this.addShiftData.AddShiftEndDate,
                shiftType:this.addShiftData.AddShiftType,
                startTime:this.addShiftData.AddShiftStartTime,
                endTime: this.addShiftData.AddShiftEndTime,
                address:this.formattedAddress,
                latitude:this.address.latitude,
                longitude:this.address.longitude
                
              }).then((response) => {});
            } else if (this.splitShift === true || this.brokenShift ==true) {
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
                groupShift:false,
              endDate: this.addShiftData.AddShiftEndDate,
              shiftType:this.addShiftData.AddShiftType,
              startTime:this.addShiftData.AddShiftStartTime,
              endTime: this.addShiftData.AddShiftEndTime,
              address:this.formattedAddress,
              latitude:this.address.latitude,
              longitude:this.address.longitude
                
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
                groupShift:false,
                endDate: this.addShiftData.AddShiftEndDate,
                shiftType:this.addShiftData.AddShiftType,
                startTime:this.addShiftData.AddShiftStartTime,
                endTime: this.addShiftData.AddShiftEndTime,
                address:this.formattedAddress,
                latitude:this.address.latitude,
                longitude:this.address.longitude
                
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
}
  // ✅ Group staff + services before sending to Apex
  // ✅ Group staff + services before sending to Apex
  prepareStaffRows() {
    console.log("splitShift value:", this.splitShift);
    console.log("groupShift value:", this.groupShift);

    let staffRows;

   if (this.splitShift || this.brokenShift) {
      console.log("Processing SPLIT shift case");
      let splitShiftRefId = this.generateGUID();
      // 🔥 Split shifts → return rows as-is (no grouping by staff)
      staffRows = this.AddShiftAndServices.map((row) => {
        console.log("Processing split shift row for staff:", row.staff);
        return {
          staffId: row.staff,
          staffLabel: row.stafflabel,
          role: this.finalAddShiftData.shiftDetails.AddShiftRole,
          shifttype: row.shifttype,
          shiftnotes: this.finalAddShiftData.shiftDetails.AddShiftNotes,
          shiftnames: this.finalAddShiftData.shiftDetails.AddShiftTypeName,
          sil:this.finalAddShiftData.shiftDetails.sil,
          starttime: row.starttime,
          starttimeAmPm: row.starttimeAmPm,
          endtime: row.endtime,
          endtimeAmPm: row.endtimeAmPm, 
          startdate: row.startdate,
          enddate: row.enddate,
          splitShifts: this.splitShift,
           brokenShifts : this.brokenShift,
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
          doubleRate: row.doubleRate,   
          extraHours: row.extraHours,
          brokenExtendedWages: row.brokenExtendedWages,
          brokenShiftAllowance:row.brokenShiftAllowance,
          isMinimumEngagementApplied:row.isMinimumEngagementApplied,
         
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
              hourlyRate: row.hourlyrate,
              selectedForms:
              row.selectedForms && row.selectedForms.length ? row.selectedForms.join(',') : ''
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
            role: this.finalAddShiftData.shiftDetails.AddShiftRole,
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
            sil:this.finalAddShiftData.shiftDetails.sil,
         
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
            brokenShifts :row.brokenShifts,
            splitShiftRefId:row.splitShiftRefId?row.splitShiftRefId: null,
            doubleRate: row.doubleRate,   
            extraHours: row.extraHours,
            brokenExtendedWages: row.brokenExtendedWages,
            brokenShiftAllowance:row.brokenShiftAllowance,
           isMinimumEngagementApplied:row.isMinimumEngagementApplied,

            hourlyRate:
              this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"
                ? 0
                : row.hourlyrate,
            refId: row.refId,
            addressSource: row.addressSource,
            participants: [],
            services: [],
             recurring :row.recurring==false?this.AddShiftRecurringCheckboxValue :row.recurring , 

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
            this.finalAddShiftData.shiftDetails.AddShiftType == "Custom" ? row.id : "",
          starttime: this.finalAddShiftData.shiftDetails.AddShiftType == "Custom" ? row.starttime : null,
          endtime:this.finalAddShiftData.shiftDetails.AddShiftType == "Custom" ? row.endtime  : null,
          selectedForms:row.selectedForms && row.selectedForms.length? row.selectedForms.join(',') : '',
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
  @track roleOrderString;
  handleRoleTabClick(event) {
      const selected = event.currentTarget.dataset.role;

      // Set selected role
      this.selectedRole = selected;

      // Update filters - Handle "All" case differently
      if (selected === 'All') {
          // Clear and push all role values except "All" from OrgNisationRoles
          this.chosenRole = [];
          this.OrgNisationRoles.forEach(roleObj => {
              if (roleObj.value !== 'All') {
                  this.chosenRole.push(roleObj.value);
              }
          });
      } else {
          this.chosenRole = [selected];
      }
      
      this.SelctedComboBoxRole = selected;
      console.log('chosenRole ==>' + JSON.stringify(this.chosenRole));
      localStorage.setItem("SelctedComboBoxRole", selected);

      this.loadStaffData(); // reload based on new role
  }

  handleRoleDragStart(event) {
      this.draggedRole = event.currentTarget.dataset.role;
      
  }

  handleRoleDragOver(event) {
      event.preventDefault(); // Required to allow dropping
  }

  handleRoleDrop(event) {
      event.preventDefault();
      const droppedRole = event.currentTarget.dataset.role;

      // ❌ Do NOT allow ANY drag-drop onto "All"
      if (droppedRole === "All") {
          console.log("⛔ 'All' cannot be moved. Ignoring drop.");
          return;
      }

      // ❌ Prevent dragging "All" itself
      if (this.draggedRole === "All") {
          console.log("⛔ 'All' cannot be dragged. Ignoring drop.");
          return;
      }

      if (this.draggedRole === droppedRole) return;

      let items = [...this.OrgNisationRoles];

      const draggedIndex = items.findIndex(i => i.value === this.draggedRole);
      const droppedIndex = items.findIndex(i => i.value === droppedRole);

      const [removed] = items.splice(draggedIndex, 1);
      items.splice(droppedIndex, 0, removed);

      // ⚠️ Always force "All" to index 0
      items = this.fixAllFirst(items);

      this.OrgNisationRoles = items;

      // Create stored string
      this.roleOrderString = items.map(r => r.label).join(";");

      console.log("New Role Order ==> ", JSON.stringify(items));
      console.log("Role Order String ==> ", this.roleOrderString);

      this.saveRoleOrderToBackend();
  }

  fixAllFirst(list) {
      // Extract All
      const allItem = list.find(i => i.value === "All");

      // Filter the rest
      const withoutAll = list.filter(i => i.value !== "All");

      // Return with "All" always at the front
      return [allItem, ...withoutAll];
  }

  saveRoleOrderToBackend() {

      saveRoleOrder({ newOrder: this.roleOrderString })
          .then(() => {
              console.log("Role order saved successfully");
          })
          .catch(error => {
              console.error("Error saving role order", error);
          });
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
    /* console.log('🔍 computedRoleTabs called');
    console.log('🔍 OrgNisationRoles:', JSON.stringify(this.OrgNisationRoles));
    console.log('🔍 selectedRole:', this.selectedRole); */
    const result = this.OrgNisationRoles.map((role) => {
        const isActive = role.value === this.selectedRole;
        //console.log('🔍 Processing role:', role.value, 'isActive:', isActive);
        
        return {
            ...role,
            computedClass: isActive
                ? "role-tab-button role-tab-active"
                : "role-tab-button"
        };
    });
    
   // console.log('🔍 computedRoleTabs result:', JSON.stringify(result));
    return result;
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
    console.log(' this.isParticipanTViewEnable ==>'+this.isParticipanTViewEnable);

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
      case "Rejectedshifts":
        console.log("Rejectedshifts");
        this.handleRejectedshifts();
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
      case "Templates":
        console.log("Templates");
       // this.handleShiftReports();
        this.closeShiftTemplate();
        this.shiftTemplateFlag=true;
         this.showOptions =true;

        break;
        case "mobileSettings":
        console.log("Templates");
        this.mobileSettingFacilityValue=this.SelectedComboBoxFacility
          this.fetchFacilitySettings(this.mobileSettingFacilityValue);

        this.showMobileSettings=true;
   

        break;
        case "CalendarSettings":
        console.log("Templates");
       // this.handleShiftReports();
        this.closeShiftTemplate();
        this.shiftTemplateFlag=true;
         this.showOptions =true;

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
                totalSplits === 2 ? 13 : totalSplits === 3 ? 14 : totalSplits >= 4 ? 8 : 14;
              const heightClass = `height-${Math.round(heightPercent)}`;
              const fontClass = `font-${fontSize}`;
              const colorClass = colorClasses[index] || "color-default";
              return {
                ...split,
                // UI fields expected by template:
                isHovered: true,                // show the mini split cards
                isSplitCardExpanded: false,     // collapsed by default
                colorClass,
                dynamicClass: `expanded-two-shift-split ${colorClass} ${heightClass} ${fontClass}-${this.selectedViewType}`,
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
          const finalExpandedClass = `expanded-two-shift-${this.selectedViewType} ${colorClass}`;
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


  // get getIconContainerClass() {
  //   return this.isExpandedView
  //     ? "icon-container icon-expanded"
  //     : "icon-container";
  // }

get getIconContainerClass() {
    let classString = this.isExpandedView 
        ? "icon-container icon-expanded"
        : "icon-container";

    // 1. Check for Fortnightly view AND Expanded view
    if (this.selectedViewType === 'fortnightly' && this.isExpandedView) {
        
         // Add the specific class for the 140px height override
         classString += " fortnightly-expanded-height-140";
         
    } else if (this.selectedViewType === 'fortnightly') {
        // 2. Fortnightly BUT NOT Expanded (e.g., for a different compact height like 52px)
        // If you need a height other than the default here, use a class like this:
        classString += " fortnightly-height-auto";
    }
    
    // Note: When isExpandedView is true but selectedViewType is NOT 'fortnightly' (e.g., 'weekly'),
    // the class will be "icon-container icon-expanded", and your 200px rule will apply.

    return classString;
}

  // get getIconItemClass() {
  //   return this.isExpandedView ? "icon-item expanded-font" : "icon-item";
  // }

  get getIconItemClass() {
    let classString = this.isExpandedView ? "icon-item expanded-font" : "icon-item";

    // ⭐ Check selectedViewType and append the specific class for 6.1px
    if (this.selectedViewType === 'fortnightly') {
        classString += " fortnightly-font"; 
    }

    return classString;
}
  


  // In your LWC JavaScript file (.js)

get getDeleteIconClass() {
    // Start with the classes based on isExpandedView (which likely corresponds to fortnightly)
    let classString = this.isExpandedView
      ? "material-icons-delete delete-icon delete-icon-expanded"
      : "material-icons-delete delete-icon";

    // ⭐ Check selectedViewType and append the font size class
    if (this.selectedViewType === 'fortnightly') {
        classString += " delete-icon-fortnightly";
    }

    return classString;
}
get getTypeIconClass() {
    // Start with the classes based on isExpandedView (which likely corresponds to fortnightly)
    let classString = this.isExpandedView
      ? "material-icons shiftTypeIcon"
      : "material-icons shiftTypeIcon";

    // ⭐ Check selectedViewType and append the font size class
    if (this.selectedViewType === 'fortnightly') {
        classString += " delete-icon-fortnightly";
    }

    return classString;
}

get getExpandedTwoShiftClass() {
    // 1. Start with classes based on isExpandedView
    let classString = this.isExpandedView
      ? "expanded-two-shift expanded-font-12"
      : "expanded-two-shift";

    // ⭐ 2. Check selectedViewType and append the font size removal class
    if (this.selectedViewType === 'fortnightly') {
        // Add the class used to override the fixed font size
        classString += " remove-font-size-fortnightly";
    }

    return classString;
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
    console.log('event.currentTarget.dataset.role in drag'  +event.currentTarget.dataset.role);

   event.dataTransfer.setData("draggedRole", event.currentTarget.dataset.role);
    event.dataTransfer.setData("facilityid", event.currentTarget.dataset.facilityid);
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
     this.finalDraggingRefId = "";
   // this.finalDraggingRefId = this.draggingStaffrefId;
    if (this.draggingRecurShiftValue == "Only this shift") {
      this.finalDraggingRefId = "";
    } else {
      this.finalDraggingRefId = this.draggingStaffrefId;
    }
  }
  async handleAssignDragAndDropFinalValidation(timeSplits,droppedStaffId){
     let staffIds=[];
      staffIds.push(droppedStaffId);
          const dragShiftsList = await getDragDrogShifts({
                              StaffId: this.droppedStaffId,
                              refId: this.finalDraggingRefId,
                              shiftId: this.draggingStaffShiftId,
                              draggingShiftDate: this.draggingShiftDate,
                              droppedShiftDate: this.droppedShiftDate
                      });
                            console.log('Shifts retrieved:',JSON.stringify(dragShiftsList) );
                              const startDate = new Date(this.draggingShiftDate);
                              const endDate = new Date(this.droppedShiftDate);
                              const numberOfDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

                              console.log('Number of days between dates:', numberOfDays);

                              // Extract and subtract days from each shift date
                              const processedDates = dragShiftsList.map(shift => {
                              const shiftDate = new Date(shift.Start_Date__c);

                              // Subtract the number of days from each shift date
                              shiftDate.setDate(shiftDate.getDate() + numberOfDays);

                              // Return the date in YYYY-MM-DD format
                              return shiftDate.toISOString().split('T')[0];
                              });

                              console.log('Processed dates:', processedDates);
                              

                            const result = await validateStaffAvailabilityWithReasons({
                                  staffIds: staffIds,
                                  inputDates: processedDates,
                                  startTimeStr: timeSplits[0].toString().toUpperCase().trim(),
                                  endTimeStr: timeSplits[1].toString().toUpperCase().trim(),
                                  isAvailability: 'Yes',
                                  isEditMode: false,
                                  currentShiftId: null,
                                  shiftFacilityId:this.addShiftData.AddShiftFacilityValue,
                                  shiftRole :this.addShiftData.AddShiftRole
                              });
                              console.log('validateStaffAvailability  result==> '+JSON.stringify(result));
                            
                              
                                  this.staffDateConflicts = [];
                          
                                for (const [staffId, dateReasons] of Object.entries(result)) {
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
                                            staffName: this.draggingStaffFullName,
                                            conflictDates: conflictDates
                                        });
                                    }
                                }
                          
                                  if (this.staffDateConflicts.length > 0) {
                                            // this.showErrorModal = true;
                                    this.dragAndDropValiadtion =true;
                                  }else{
                                    this.handleAssignDragAndDrop();
                                  }
                              console.log(' this.staffDateConflicts==> '+JSON.stringify( this.staffDateConflicts));
  }
  handleAssignDragAndDropInRecurring(){
     this.handleAssignDragAndDropFinalValidation(this.TimeInDragAndDrop,this.droppedStaffId);

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
      droppedShiftDate: this.droppedShiftDate,
       staffDateConflictsJson:JSON.stringify(this.staffDateConflicts)
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
     this.refreshStaffData(); 
  }

  // Pass facilityId as parameter
   async processShifts(facilityId) {
    try {
      const PRIORITY_ORDER = [
          'General',
          'Morning',
          'Afternoon',
          'Night',
          'Sleepover Shift'
      ];
       const data = await this.fetchShiftData(facilityId);

        // Sort shifts by required priority
        const sortedData = [...data].sort((a, b) => {
            const aType = (a.Shift_Type__c || '').toLowerCase();
            const bType = (b.Shift_Type__c || '').toLowerCase();

            const priority = PRIORITY_ORDER.map(t => t.toLowerCase());

            const aIndex = priority.indexOf(aType);
            const bIndex = priority.indexOf(bType);

            // Both are priority types
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }

            // Only A is priority
            if (aIndex !== -1) return -1;

            // Only B is priority
            if (bIndex !== -1) return 1;

            // Neither is priority → keep backend order
            return 0;
        });

        // Map after sorting
        this.shiftNameOptions = sortedData.map(option => ({
            ...option,
            label: option.Name,
            value: option.Id,
            duration: option.Duration__c,
            enableTimeRounding:
                option.Facility__r?.Organisation__r?.Enable_Time_Rounding__c || false
        }));
          if (this.isEditShiftScreenFlag != true) {
           

             this.addShiftData.AddShiftTypeName=  this.shiftNameOptions.length > 0 ?this.shiftNameOptions[0].value :'';

        }
     /*  this.addShiftData.AddShiftTypeName =(!this.isEditShiftScreenFlag && this.shiftNameOptions.length > 0)
        ? this.shiftNameOptions[0].value : ''; */

      console.log(' shift name options  before facility'+JSON.stringify(this.shiftNameOptions));
         console.log(' this      .addShiftData.AddShiftFacilityValue'+this.addShiftData.AddShiftFacilityValue)
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
        if (this.addShiftData.AddShiftType != "Custom") {
        this.addshiftMaxDuration = shifNames[0].duration;
        }else{
          this.addshiftMaxDuration=0;
        }

        let customShifts = shifNames[0].Custom_Shift_Timings__r || [];
        let shiftTypeDurationMap = {};
        console.log("customShifts in edit  ==>" + JSON.stringify(customShifts));

        customShifts.forEach((cs, index) => {
          if (cs.Shift_Type__c) {
            if (!shiftTypeDurationMap[cs.Shift_Type__c]) {
              shiftTypeDurationMap[cs.Shift_Type__c] = 0;
            }
            shiftTypeDurationMap[cs.Shift_Type__c] += cs.Duration__c
              ? cs.Duration__c
              : 0;
              this.addshiftMaxDuration += cs.Duration__c ? cs.Duration__c : 0;
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
      console.error("Error in processShifts: ", err);
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
    console.log('🟨 Document click fired');

      const path = event.composedPath();
  
      // ✅ Ignore clicks inside Shift Mode radios
      const shiftModeContainers = this.template.querySelectorAll('.shift-mode-container');
      for (let container of shiftModeContainers) {
          if (path.includes(container)) {
            
              return;
          }
      }

    

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
     if (this.groupShift || this.brokenShift) {
    return true;
  }

    // ✅ Custom or Split shift → limit to 4 rows
    if (this.addShiftData.AddShiftType === "Custom" || this.splitShift || this.brokenShift) {
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
      rowBillableHoursChanged:false,
      facilityIconClass: "material-icons add-icon",
      participantIconClass: "material-icons add-icon",
      newIconClass: "material-icons add-icon",
      customshiftsoptions: [...this.longShiftOptions],
      customshiftlabel: "",
      showcustomshiftdropdown: false,
      customshiftchevronclass: "",
      addressSource: "",
      staffPaidBreak: false,
      extraHours:0,
      doubleRate:0,
      brokenExtendedWages:0,
      isExtendedBroken:false,
      brokenShiftAllowance:0,
      brokenShifts:false,
      isMinimumEngagementApplied:false,
      selectedForms :[],
      formsSelected :false,
      formsIconClass : "material-icons add-icon"

      
    };
  }
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
      this.brokenShift = false;

      // ✅ NEW: disable other shifts
      this.disableGroupShift  = true;
      this.disableBrokenShift = true;

      if (
        this.shiftAddressInRosterSettings !== "" &&
        this.shiftAddressInRosterSettings !== null &&
        this.shiftAddressInRosterSettings !== undefined
      ) {
        this.handleAddressSelection({
          currentTarget: {
            dataset: {
              type:
                this.shiftAddressInRosterSettings === "Facility"
                  ? "facility"
                  : "participant",
              index: 0
            }
          }
        });
      }
    }

    if (!isChecked) {
      this.rowShiftTimingsEnable = false;
      this.facilityAddressDisable = false;
      this.isDisableParticipantCheckBox = false;
      this.newAddressDisable = false;

      // ✅ NEW: re-enable other shifts
      this.disableGroupShift  = false;
      //this.disableBrokenShift = false;
       let selectedStaff = this.staffOptions.find(
        (rec) => rec.value === this.addShiftData.AddShiftStaffValue
      );

      if (selectedStaff) {
        const { label, staffPaidBreak,categoryType,typeOfJob } = selectedStaff; // get label + paidBreak (or other fields)
         const ALLOWED_CATEGORIES = [
              'Social and community services employee',
              'Home care employee'
          ];

        const isAllowedCategory = ALLOWED_CATEGORIES.includes(categoryType);
        this.employmentTypeInBrokenShift=typeOfJob;
        this.disableBrokenShift = !isAllowedCategory;
      }

    }

    if (this.isEditShiftScreenFlag === true) {
      const addressType =
        this.facilityAddressCheckbox === true
          ? "Facility"
          : this.participantAddressCheckBox === true
            ? "Participant"
            : "New";

      this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
        if (i === 0) {
          return {
            ...row,
            addressType: addressType,
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

      const isValid = await this.validateSplitShiftsSegments();
      if (!isValid) {
        return;
      }
    }

  } else if (selected === "groupShift") {
    this.selectedStaffLabel = "";
    this.brokenShift = false;
    this.groupShift = isChecked;
    this.rowShiftTimingsEnable = false;
    this.rowShiftTypeEnable = false;

    // ✅ NEW: disable / enable other shifts
    if (isChecked) {
      this.disableSplitShift = true;
      this.disableBrokenShift = true;
      this.splitShift = false;
    } else {
      this.disableSplitShift = false;
     // this.disableBrokenShift = false;
       let selectedStaff = this.staffOptions.find(
        (rec) => rec.value === this.addShiftData.AddShiftStaffValue
      );

        if (selectedStaff) {
          const { label, staffPaidBreak,categoryType,typeOfJob } = selectedStaff; // get label + paidBreak (or other fields)
          const ALLOWED_CATEGORIES = [
                'Social and community services employee',
                'Home care employee'
            ];

          const isAllowedCategory = ALLOWED_CATEGORIES.includes(categoryType);
          this.employmentTypeInBrokenShift=typeOfJob;
          this.disableBrokenShift = !isAllowedCategory;
      }
    }

    if (this.groupShift === true) {
      this.isDisableParticipantCheckBox = false;
    }

  } else if (selected === "brokenShift") {
    this.brokenShift = true;
    this.groupShift = false;
    this.splitShift = false;
    this.rowShiftTimingsEnable = true;
    this.rowShiftTypeEnable = false;

    if (isChecked) {
      this.facilityAddressDisable = true;
      this.isDisableParticipantCheckBox = true;
      this.newAddressDisable = true;

      // ✅ NEW: disable other shifts
      this.disableSplitShift = true;
      this.disableGroupShift = true;

      if (
        this.shiftAddressInRosterSettings !== "" &&
        this.shiftAddressInRosterSettings !== null &&
        this.shiftAddressInRosterSettings !== undefined
      ) {
        this.handleAddressSelection({
          currentTarget: {
            dataset: {
              type:
                this.shiftAddressInRosterSettings === "Facility"
                  ? "facility"
                  : "participant",
              index: 0
            }
          }
        });
      }
    }

    if (!isChecked) {
      this.brokenShift = false;
      this.rowShiftTimingsEnable = false;
      this.facilityAddressDisable = false;
      this.isDisableParticipantCheckBox = false;
      this.newAddressDisable = false;

      // ✅ NEW: re-enable other shifts
      this.disableSplitShift = false;
      this.disableGroupShift = false;
    }

    if (this.isEditShiftScreenFlag === true) {
      const addressType =
        this.facilityAddressCheckbox === true
          ? "Facility"
          : this.participantAddressCheckBox === true
            ? "Participant"
            : "New";

      this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
        if (i === 0) {
          return {
            ...row,
            addressType: addressType,
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

      const isValid = await this.validateBrokenShiftsSegments();
      if (!isValid) {
        return;
      }
    }
  }
}

 



disableOtherShifts(active) {
  if (active !== 'splitShift') this.disableSplitShift = true;
  if (active !== 'groupShift') this.disableGroupShift = true;
  if (active !== 'brokenShift') this.disableBrokenShift = true;
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
        (this.addShiftData.AddShiftType === "Custom" || this.splitShift || this.brokenShift) &&
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

      if (this.splitShift || this.brokenShift) {
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
     if(this.shiftAddressInRosterSettings !='' && this.shiftAddressInRosterSettings != null && this.shiftAddressInRosterSettings != undefined) {
          
          console.log('=== Shift Address in Roster Settings Condition ===');
          console.log('shiftAddressInRosterSettings value:', this.shiftAddressInRosterSettings);
          console.log('previousRowIndex:', previousRowIndex);
          console.log('target row index:', previousRowIndex + 1);
          
          const addressType = this.shiftAddressInRosterSettings == 'Facility' ? 'facility' : 'participant';
          console.log('Determined address type:', addressType);
          
          console.log('Calling handleAddressSelection with simulated event...');
          
          this.handleAddressSelection({
            currentTarget: {
              dataset: {
                type: addressType,
                index: previousRowIndex + 1
              }
            }
          });
          
          console.log('handleAddressSelection call completed for roster settings');
          
        } else{
              this.addNewAddressCheckBox = false;
              this.participantAddressCheckBox = false;
              this.facilityAddressCheckbox = true;
              this.addShiftData.AddShiftParticipantAddressCheckbox = false;
              this.addShiftData.AddShiftEnterOtherLocation = false;
              this.fetchFacilityAddressAndGeocode();
        }

       
      }
    }

    // Add new row
    this.AddShiftAndServices = [...this.AddShiftAndServices, this.initRow()];

    // Existing logic for splitShift OR Custom...
    if (this.splitShift || this.addShiftData.AddShiftType === "Custom" || this.brokenShift) {
      const staffLabel = this.AddShiftAndServices[0].stafflabel;
      console.log("staffLabel => ", staffLabel);

      if (this.splitShift || this.brokenShift) {
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
           lastRow.isCustomShift=lastRow.Shift_Type__c === "Sleepover Shift";
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
          ( this.splitShift == true  || this.brokenShift ==true) && field === "staff"
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
            updatedRow.selectedForms = [];
            updatedRow.formsSelected = false;
            updatedRow.formsIconClass = "material-icons add-icon";

            
            if (this.groupShift == false) {
              this.isDisableParticipantCheckBox = false;
            }
            try {
               if(this.shiftAddressInRosterSettings !='' && this.shiftAddressInRosterSettings != null && this.shiftAddressInRosterSettings != undefined ){
                        const source = this.shiftAddressInRosterSettings 
                    const facilityIconClass = source === "Facility" 
                    ? "material-icons add-icon selected-address-icon-facility" 
                    : "material-icons add-icon";

                    const participantIconClass = source === "Participant" 
                    ? "material-icons add-icon selected-address-icon-participant" 
                    : "material-icons add-icon";

                    const newIconClass = source === "New" 
                    ? "material-icons add-icon selected-address-icon-new" 
                    : "material-icons add-icon"; 
                    updatedRow.facilityIconClass= facilityIconClass,
                    updatedRow.participantIconClass=participantIconClass,
                    updatedRow.newIconClass=newIconClass
           
                  this.handleParticipantAddressSelectionMulti(value);
              } 
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
              console.log('getCatalogueData ==>'+JSON.stringify(result));

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
               console.log('serviceGroupName ==>'+JSON.stringify( this.serviceGroupName ));
                   let autoSelectedServiceItem = null;
                  let autoSelectedUnitPrice = 0;

                  if (result.ShiftTypeMap && this.addShiftData.AddShiftType) {
                  // Find first service item that matches current shift type
                  const matchingService = this.serviceGroupName.find(item => {
                    const shiftTypes = result.ShiftTypeMap[item.Id];
                    return shiftTypes && shiftTypes.split(';').includes(this.addShiftData.AddShiftType);
                  });

                  if (matchingService) {
                    autoSelectedServiceItem = matchingService.value;
                    autoSelectedUnitPrice = matchingService.unit;
                    }
                    if ( this.AddShiftRecurringCheckboxValue == true && this.AddShiftIncludePartcipants == false ) {
                            this.AddShiftIncludePartcipants = true;
                    }
                  }
                       

              updatedRow = {
                        ...updatedRow,
            allserviceitems: [...this.serviceGroupName],
            filteredserviceitems: [...this.serviceGroupName],
            serviceitem: autoSelectedServiceItem,
            serviceitemlabel: autoSelectedServiceItem ? 
            this.serviceGroupName.find(item => item.value === autoSelectedServiceItem)?.label : "Select Service Item",
            unitprice: autoSelectedUnitPrice,
            amount: autoSelectedServiceItem ? 
            (autoSelectedUnitPrice * (updatedRow.billablehours || 0)).toFixed(2) : "0.00",
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
            if(this.isEditShiftScreenFlag==true && this.AddShiftAndServices.length >1){
              console.log('this.orginalShiftStaff =='+this.orginalShiftStaff +' updatedRow.staff=='+updatedRow.staff);
              updatedRow.shiftWithStaffId= this.orginalShiftStaff==updatedRow.staff ?this.ShiftwithStafftoApexId:null;
              console.log('updatedRow.shiftWithStaffId =='+updatedRow.shiftWithStaffId);
            }
            const selectedStaff = this.staffOptions.find(rec => rec.value === value);
            updatedRow.staffPaidBreak = selectedStaff.staffPaidBreak;

             updatedRow.billablehours =this.getFinalDuration(this.addShiftData.AddShiftDuration, this.addShiftData.AddShiftDuration >=5 ? 0.5:0,updatedRow.staffPaidBreak);
             let categoryType=selectedStaff.categoryType;
            console.log('categoryType in onchange==> '+categoryType);
          const ALLOWED_CATEGORIES = [
              'Social and community services employee',
              'Home care employee'
          ];
          this.employmentTypeInBrokenShift=selectedStaff.typeOfJob;

        const isAllowedCategory = ALLOWED_CATEGORIES.includes(categoryType);
     //   this.employmentTypeInBrokenShift=typeOfJob;

        // ===============================
        // CASE 1: Broken is selected
        // ===============================
        if (this.brokenShift === true) {

            if (!isAllowedCategory) {
                // ❌ Broken no longer allowed
                this.brokenShift = false;
                this.disableBrokenShift = true;

                this.disableSplitShift = false;
                this.disableGroupShift = false;

            } else {
                // ✅ Broken allowed and selected
                this.disableBrokenShift = false;

                this.disableSplitShift = true;
                this.disableGroupShift = true;
            }
        }

        // ===============================
        // CASE 2: Broken is NOT selected
        // ===============================
        else {
            // Broken availability depends on category
            this.disableBrokenShift = !isAllowedCategory;

            // Others are always available
            this.disableSplitShift = false;
            this.disableGroupShift = false;
        }


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
          console.log(' this.StaffHourlyRates ' + JSON.stringify(this.StaffHourlyRates));
           const rate = this.getServiceStaffHourlyRate(
              this.addShiftData.AddShiftHoliday,
              this.AddShiftDayName,
               updatedRow.staff,
              value
             );
            updatedRow.shifttype = value;
            updatedRow.customshiftlabel = value;
            updatedRow.rowOnchangeOccured = true;
            updatedRow.hourlyrate=rate;
            updatedRow.isCustomShift=value=== "Sleepover Shift";
          }

          return updatedRow;
        }
        return row;
      })
    );
  
  }

  handleClearSelection(event) {
  event.stopPropagation();

  const index = parseInt(event.currentTarget.dataset.index, 10);
  const field = event.currentTarget.dataset.field.toLowerCase();

  this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
    if (i === index) {
      let updatedRow = { ...row };

      if (field === 'participant') {
        updatedRow.participant = null;
        updatedRow.participantlabel = 'Select Participant';

        // 🔹 Reset dependent fields (IMPORTANT)
        updatedRow.allservicetypes = [];
        updatedRow.filteredservicetypes = [];
        updatedRow.servicetype = null;
        updatedRow.servicetypelabel = 'Select Service Type';

        updatedRow.allserviceitems = [];
        updatedRow.filteredserviceitems = [];
        updatedRow.serviceitem = null;
        updatedRow.serviceitemlabel = 'Select Service Item';

        updatedRow.unitprice = 0;
        updatedRow.amount = '0.00';
      }

      if (field === 'serviceitem') {
          updatedRow.serviceitem = null;
          updatedRow.serviceitemlabel = 'Select Service Item';

          // 🔹 Reset pricing (IMPORTANT)
          updatedRow.unitprice = 0;
          updatedRow.amount = '0.00';
        }

        if (field === 'servicetype') {
            updatedRow.servicetype = null;
            updatedRow.servicetypelabel = 'Select Service Type';

            // 🔹 Reset dependent service items
            updatedRow.allserviceitems = [];
            updatedRow.filteredserviceitems = [];
            updatedRow.serviceitem = null;
            updatedRow.serviceitemlabel = 'Select Service Item';

            // 🔹 Reset pricing
            updatedRow.unitprice = 0;
            updatedRow.amount = '0.00';
          }

      return updatedRow;
    }
    return row;
  });
}
 async handleFormsIconClick(event){
  this.allParticipantForms=[];
  this.selectedParticipantForms=[];
    const index = parseInt(event.currentTarget.dataset.index,10);
    const row = this.AddShiftAndServices[index];
    console.log('row.selectedForms' +JSON.stringify(row.selectedForms));

    if(!row.participant){
       this.confirMationMessage(
        "Warning",
        "Please select a "+this.participantPreferredName+" before opening Forms.",
        "Warning"
       );

        return;
    }

    this.currentRowIndex = index;

    try{
    
        const result = await getParticipantForms({
            participantId : row.participant
        });
         if(!result || result.length === 0){
            this.confirMationMessage(
                "Warning",
                "No Forms available for the selected " + this.participantPreferredName + ".",
                "Warning"
            );
            return; // do NOT open popup
        }

          console.log(' participants form ' +JSON.stringify(result));

        this.allParticipantForms = result.map(f => ({
            ...f,
            isSelected : (row.selectedForms || []).includes(f.formId)
        }));

        this.selectedParticipantForms = [...(row.selectedForms || [])];

        this.showFormsModal = true;
         console.log('allParticipantForms in in handleFormsIconClick ==>' +JSON.stringify(this.allParticipantForms));
        console.log('selectedParticipantForms in handleFormsIconClick ==>' +JSON.stringify(this.selectedParticipantForms));

    }catch(e){
        console.error(e);
    }
}

  handleFormSelection(event){

      const formId = event.target.value;
      const isChecked = event.target.checked;

      if(isChecked){
          this.selectedParticipantForms.push(formId);
      }else{
          this.selectedParticipantForms =
              this.selectedParticipantForms.filter(id => id !== formId);
      }

      // update UI selection
      this.allParticipantForms = this.allParticipantForms.map(f => ({
          ...f,
          isSelected : this.selectedParticipantForms.includes(f.formId)
      }));
       console.log('allParticipantForms in in form slection ==>' +JSON.stringify(this.allParticipantForms));
        console.log('selectedParticipantForms in in form slection ==>' +JSON.stringify(this.selectedParticipantForms));
  }

  applySelectedForms(){

    const index = this.currentRowIndex;

    this.AddShiftAndServices = this.AddShiftAndServices.map((row,i)=>{

        if(i === index){

            const formsIconClass =
                this.selectedParticipantForms.length > 0
                ? "material-icons add-icon selected-address-icon-participant"
                : "material-icons add-icon";

            return {
                ...row,
                selectedForms : [...this.selectedParticipantForms],
                formsIconClass : formsIconClass
            };
        }
        return row;
    });
    console.log('Forms data after selction ==>' +JSON.stringify(this.AddShiftAndServices));

    this.closeFormsModal();
}

closeFormsModal(){
    this.showFormsModal = false;
    this.currentRowIndex = null;
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
        updatedRow.rowBillableHoursChanged=field=='billablehours';

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
          this.isShiftDeleteCancelTempalte=false;
          this.shiftDeleteCancelHeaderTemplate=false;

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
         rowBillableHoursChanged:false,
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
      if ( this.brokenShift) {
        const isValid = await this.validateBrokenShiftsSegments();
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
          duration:(row.rowBillableHoursChanged==false )? this.getFinalDuration(
            row.duration,
            row.duration >= 5 ? 0.5 : 0,
            staffBreak
          ): row.duration,
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
    console.log("Add shift data:", JSON.stringify(this.AddShiftAndServices));
    console.log("Add shift strat date:", this.addShiftData.AddShiftStartDate);
    console.log("Add shift strat date:",this.addShiftData.AddShiftEndDate);

    try {
      const result = await validateAndEnrichShifts({
        shiftStartDate: this.addShiftData.AddShiftStartDate,
        shiftStartTime: this.addShiftData.AddShiftStartTime,
        shiftEndDate: this.addShiftData.AddShiftEndDate,
        shiftEndTime: this.addShiftData.AddShiftEndTime,
        segmentsJson: JSON.stringify(this.AddShiftAndServices),
        staffId: this.addShiftData.AddShiftStaffValue,
        role: this.addShiftData.AddShiftRole
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
              billablehours:this.getFinalDuration(
                segmentResult.duration,
                segmentResult.duration >= 5 ? 0.5 : 0,
                rec.staffPaidBreak
              ) ,
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
  async validateBrokenShiftsSegments(){
     console.log("=== VALIDATION start in broken shift ===");
    console.log("Add shift data:", JSON.stringify(this.AddShiftAndServices));
    console.log("Add shift strat date:", this.addShiftData.AddShiftStartDate);
    console.log("Add shift strat date:",this.addShiftData.AddShiftEndDate);
    console.log('employment type '+this.employmentTypeInBrokenShift)

    try {
      const result = await validateBrokenShiftSegments({
        shiftStartDate: this.addShiftData.AddShiftStartDate,
        shiftStartTime: this.addShiftData.AddShiftStartTime,
        shiftEndDate: this.addShiftData.AddShiftEndDate,
        shiftEndTime: this.addShiftData.AddShiftEndTime,
        segmentsJson: JSON.stringify(this.AddShiftAndServices),
        employmentType:this.employmentTypeInBrokenShift,
        staffId: this.addShiftData.AddShiftStaffValue,
        role: this.addShiftData.AddShiftRole
      });

      console.log("=== VALIDATION RESULT in broken shift ===");
      console.log("isValid:", result.isValid);
      console.log("errorMessage:", result.errorMessage);
      console.log(
        "enrichedSegments count:",
        result.enrichedSegments ? result.enrichedSegments.length : 0
      );
      console.log("Full validation result in broken:", JSON.stringify(result));

      if (result.isValid) {
        console.log("✅ Validation successful");
         // Update AddShiftAndServices with enriched values
        this.AddShiftAndServices = this.AddShiftAndServices.map((rec) => {
          let segmentResult = result.enrichedSegments.find(
            (seg) => seg.id === rec.id
          );

          if (segmentResult) {
              const isExtendedBrokenSegment = segmentResult.doubleRate > 0 && segmentResult.extraHours > 0;

            // 🔴 Set tracked UI state ONCE (last segment)
            
                this.showExtendedBrokenUI = isExtendedBrokenSegment;
                this.extendedBrokenMeta = {
                    breakOne: segmentResult.breakOne,
                    breakTwo: segmentResult.breakTwo,
                    doubleRate: segmentResult.doubleRate,   // number
                    extraHours: segmentResult.extraHours,
                    hourlyRate: segmentResult.doubleRate,   // number
                    brokenExtendedWages: segmentResult.doubleRate * segmentResult.extraHours,
                    brokenBreakStartOne : segmentResult.breakOneStartTime,
                    brokenBreakEndOne: segmentResult.breakOneEndTime,
                    brokenBreakStartTwo: segmentResult.breakTwoStartTime,
                    brokenBreakEndTwo: segmentResult.breakTwoEndTime,
                };

            

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
              billablehours:this.getFinalDuration(
                segmentResult.duration,
                segmentResult.duration >= 5 ? 0.5 : 0,
                rec.staffPaidBreak
              ) ,
              startdate: segmentResult.startDate,
              enddate: segmentResult.endDate,
              hourlyrate: segmentResult.hourlyRate,
              doubleRate: segmentResult.doubleRate,   
              extraHours: segmentResult.extraHours,
              brokenExtendedWages: segmentResult.doubleRate * segmentResult.extraHours,
              brokenShiftAllowance:segmentResult.brokenShiftAllowance,
              isMinimumEngagementApplied:segmentResult.isMinimumEngagementApplied,

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
          "Updated AddShiftAndServices in broken:",
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
          "Expected method: broken.validateAndEnrichShifts"
        );
      }
      return false;
    }

  }




  handleAddressSelection(event) {
    console.log('=== Address Selection Triggered ===');
    const addressType = event.currentTarget.dataset.type;
    const index = parseInt(event.currentTarget.dataset.index, 10);
    
    console.log('Selected address type:', addressType);
    console.log('Row index:', index);
    console.log('Previous active row index:', this.activeRowIndex);

    this.activeRowIndex = index;
    console.log('New active row index set to:', this.activeRowIndex);

    // REMOVED: The mapping logic that sets icon classes - now handled by updateRowAddress

    console.log('Address type condition check:', addressType);

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
  updateRowAddress(index, address, source) {
    console.log('updateRowAddress called with index:', index, 'source:', source);
    
    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
        if (i === index) {
            // Determine the correct icon classes based on the address source
            const facilityIconClass = source === "Facility" 
                ? "material-icons add-icon selected-address-icon-facility" 
                : "material-icons add-icon";
                
            const participantIconClass = source === "Participant" 
                ? "material-icons add-icon selected-address-icon-participant" 
                : "material-icons add-icon";
                
            const newIconClass = source === "New" 
                ? "material-icons add-icon selected-address-icon-new" 
                : "material-icons add-icon";

            const updatedRow = {
                ...row,
                address: address,
                addressSource: source,
                addressDisplay: `${address.street}, ${address.citySuburb}, ${address.provinceState}, ${address.postalcode}`,
                facilityIconClass: facilityIconClass,
                participantIconClass: participantIconClass,
                newIconClass: newIconClass
            };
            console.log('Row after address update:', updatedRow);
            return updatedRow;
        }
        return row;
    });
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

    if (this.splitShift || this.brokenShift) {
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
        addressDisplay: `${finalAddress.street}, ${finalAddress.citySuburb}, ${finalAddress.provinceState}, ${finalAddress.postalcode}`, 
       
        
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
    if (this.addShiftData.AddShiftType === "Custom" || this.splitShift || this.brokenShift) {
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

    if (this.splitShift || this.addShiftData.AddShiftType === "Custom" || this.brokenShift) {
      const staffLabel = this.AddShiftAndServices[0].stafflabel;

      if (this.splitShift || this.brokenShift) {
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
          lastRow.isCustomShift=lastRow.Shift_Type__c === "Sleepover Shift";
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
      console.log("✅ Staff has paid break → Returning Duration only");
      return d;
    } else {
       console.log("❌ Staff does NOT have paid break → Subtracting Break");
      console.log(`⏱ Final Duration = ${d} - ${b} = ${d - b}`); 
      return d - b;
    }
  }
  handleNotificationChange(event) {
    const fieldName = event.target.name;
    const value = event.target.checked;

    this.addShiftData = {
        ...this.addShiftData,
        [fieldName]: value
    };

    console.log('📩 addShiftData updated:', JSON.stringify(this.addShiftData));
}

  // Getter to compute the dynamic class name
  get staffInfoClass() {
    // If 'weekly' is selected, use 'staff-info weekly-class'
    if (this.selectedViewType === 'weekly') {
      return 'staff-info weekly-class';
    }
    // If 'fortnightly' is selected, use 'staff-info fortnightly-class'
    if (this.selectedViewType === 'fortnightly') {
      return 'staff-info fortnightly-class';
    }
    // Default fallback
    return 'staff-info';
  }

  // ⭐ NEW Getter for the center-status div
    get centerStatusClass() {
        const baseClasses = 'center-status slds-grid slds-grid_align-center';
        
        if (this.selectedViewType === 'fortnightly') {
            // Add a specific class for fortnightly styling (e.g., center-status-fortnightly)
            return `${baseClasses} center-status-fortnightly`;
        }
        
        // For weekly or default, return only the base classes
        return baseClasses;
    }

    get getBackIconClass() {
        let classString = "material-icons back-icon";

        // Append the specific class for the fortnightly font size change
        if (this.selectedViewType === 'fortnightly') {
            classString += " back-icon-fortnightly";
        }

        return classString;
    }

    get getSingleExpDetailsClass() {
    let classString = "singleexp-details";

    // Append the specific class for the fortnightly font size change
    if (this.selectedViewType === 'fortnightly') {
        classString += " singleexp-details-fortnightly";
    }

    return classString;
}

get getAddIconClass() {
    let classString = "material-icons add-icon";

    // Append the specific class for the fortnightly font size change
    if (this.selectedViewType === 'fortnightly') {
        classString += " add-icon-fortnightly";
    }

    return classString;
}

get infoClass() {
    return this.selectedViewType === 'fortnightly'
        ? 'info fortnight-view'
        : 'info';
}

get dayCellClass() {
    return this.selectedViewType === 'fortnightly'
        ? 'day-cell-header fortnightly'
        : 'day-cell-header';
}
handleShiftDeleteOrCancel(event){
    this.isShiftDeleteCancel=event.target.value;
  //  this.shiftCanceltemplate=this.isShiftDeleteCancel=='Cancel'?true:false;
    this.shiftDeleteTempalte=this.isShiftDeleteCancel=='Delete'?true:false;
     this.shiftRecurDeleteInCancel=this.isShiftDeleteCancel=='Delete' && this.shiftDeleteCOnfirmationInfo.recurStatus==true ?true:false;
    console.log('this.isShiftDeleteCancel',this.isShiftDeleteCancel);
}
handleShiftCancelClose(){
    this.shiftCanceltemplate=false;
    this.shiftDeleteTempalte=false;
}
handlebackToCancelHeader(){
  this.recurredShiftsDelete=false;
  this.shiftDeleteCancelHeaderTemplate=true;
}
 handleShiftCancelChange = (event) => {
    const field = event.target.dataset.field || event.target.name;
    if (!field) return;

    // unified value extraction
    const serviceId = event.target.dataset.serviceId;
    const rawValue = (event.detail && event.detail.value !== undefined) ? event.detail.value : event.target.value;

    // Mode change (Combined / Individual)
    if (field === 'cancelMode') {
        const mode = String(rawValue);
        // update model
        this.shifCancelData = { ...this.shifCancelData, cancelMode: mode };
        // if switching to combined, recompute staffPayment from services totals
        if (mode === 'combined') {
            const total = (this.shifCancelData.services || []).reduce((s, it) => s + (Number(it.payment) || 0), 0);
            this.shifCancelData.staffPayment = total;
        }
        return;
    }

    // SERVICE-LEVEL updates (individual)
    if (serviceId) {
        const services = (this.shifCancelData.services || []).map(s => {
            if (s.id !== serviceId) return { ...s };
            const updated = { ...s };
        if (field === 'servicePayment') {
            let entered = rawValue === '' ? 0 : Number(rawValue);
            const max = Number(s.originalAmount) || 0;

            // ❗ VALIDATION: cannot exceed originalAmount
            if (entered > max) {
                this.confirMationMessage(
                    "Invalid Amount",
                    `Payment cannot exceed the original service value (${max}).`,
                    "warning"
                );
                entered = max; // clamp to original
            }

           updated.payment = Number(parseFloat(entered).toFixed(2));
        }  else if (field === 'serviceBill') {
                updated.billValue = String(rawValue);
                updated.billParticipant = String(rawValue).toLowerCase() === 'yes';
                  updated.participantAmount = String(rawValue).toLowerCase() === 'no' ?0: updated.participantAmount;
        }  else if (field === 'serviceParticipantAmount') {
            let entered = rawValue === '' ? 0 : Number(rawValue);
            const max = Number(s.originalAmount) || 0;

            // ❗ VALIDATION: participant amount cannot exceed originalAmount
            if (entered > max) {
                this.confirMationMessage(
                    "Invalid Amount",
                    `Participant amount cannot exceed the original service value (${max}).`,
                    "warning"
                );
                entered = max; // clamp to original
            }

            updated.participantAmount = Number(parseFloat(entered).toFixed(2));
        }

            return updated;
        });

        const total = services.reduce((sum, it) => sum + (Number(it.payment) || 0), 0);

        this.shifCancelData = {
            ...this.shifCancelData,
            services,
            staffPayment: total
        };
        return;
    }

    // COMBINED-mode top-level staffPayment or billParticipant change
    if (field === 'staffPayment' && this.isCombinedMode) {
        // entered total must not exceed originalStaffValue (unless originalStaffValue==0)
        const entered = Number(rawValue) || 0;
        const max = Number(this.shifCancelData.originalStaffValue) || 0;
        if (max > 0 && entered > max) {
            this.confirMationMessage("Invalid Amount", `Staff payment cannot exceed ${max}`, "warning");
            // clamp
            this.shifCancelData = { ...this.shifCancelData, staffPayment: Number(max.toFixed(2))};
            return;
        }
        // distribute proportionally across services
        const services = this.distributePaymentsAcrossServices(entered, this.shifCancelData.services);
        this.shifCancelData = { ...this.shifCancelData, services, staffPayment: Number(parseFloat(entered).toFixed(2)) };
        return;
    }
    // COMBINED-MODE: participantPayment entry (apply same value to all services)
      if (field === 'participantPayment' && this.isCombinedMode) {
          let entered = Number(rawValue) || 0;
          const max = Number(this.shifCancelData.originalParticipantValue) || 0;

          if (entered > max) {
              this.confirMationMessage(
                  "Invalid Amount",
                  `Participant payment cannot exceed ${max}.`,
                  "warning"
              );
              entered = max;
          }

          const services = (this.shifCancelData.services || []).map(s => ({
              ...s,
              participantAmount: Number(parseFloat(entered).toFixed(2))
          }));

          this.shifCancelData = {
              ...this.shifCancelData,
              participantPayment: Number(parseFloat(entered).toFixed(2)),
              services
          };
          return;
      }


      if (field === 'billParticipant' && this.isCombinedMode) {
        const flag = String(rawValue).toLowerCase() === 'yes';

        const services = (this.shifCancelData.services || []).map(s => ({
            ...s,
            billParticipant: flag,
            billValue: flag ? 'yes' : 'no',
            participantAmount: flag ? Number(s.originalAmount || 0) : 0
        }));

        this.shifCancelData = {
            ...this.shifCancelData,
            billParticipant: flag,
            participantPayment: flag ? this.shifCancelData.originalParticipantValue : 0,
            services
        };
        return;
    }

    // fallback for other fields (reason, cancelledBy, note, etc.)
    let value = rawValue;
    if (field === 'billParticipant') {
        value = String(rawValue).toLowerCase() === 'yes';
    }
    this.shifCancelData = { ...this.shifCancelData, [field]: value };
};

distributePaymentsAcrossServices(total, services) {
    if (!Array.isArray(services) || services.length === 0) return services || [];

    const svcCopy = services.map(s => ({ ...s }));
    const totalOrig = svcCopy.reduce((sum, s) => sum + (Number(s.originalAmount) || 0), 0);

    if (totalOrig === 0) {
        // distribute evenly
        const per = Number((total / svcCopy.length).toFixed(2));
        for (let i = 0; i < svcCopy.length; i++) {
            svcCopy[i].payment = per;
        }
        // adjust last item for rounding
        const sumNow = svcCopy.reduce((s, it) => s + (Number(it.payment) || 0), 0);
        svcCopy[svcCopy.length - 1].payment = Number((svcCopy[svcCopy.length - 1].payment + (total - sumNow)).toFixed(2));
        return svcCopy;
    }

    // proportional distribution
    let accumulated = 0;
    for (let i = 0; i < svcCopy.length; i++) {
        const s = svcCopy[i];
        if (i < svcCopy.length - 1) {
            const part = total * (Number(s.originalAmount) || 0) / totalOrig;
            s.payment = Number(part.toFixed(2));
            accumulated += s.payment;
        } else {
            // last one gets remainder to avoid rounding issues
            s.payment = Number((total - accumulated).toFixed(2));
        }
    }
    return svcCopy;
}
  async handleShiftCancelConfirm() {
        // choose the shift Id (replace with your actual variable if different)
       
        // prepare payload from your shifCancelData
         const payload = {
          reason: this.shifCancelData.reason,
          note: this.shifCancelData.note,
          cancelledBy: this.shifCancelData.cancelledBy,
          staffPayment: Number(this.shifCancelData.staffPayment) || 0,
          billParticipant: !!this.shifCancelData.billParticipant,
          cancelMode: this.shifCancelData.cancelMode || 'individual',
          services: (this.shifCancelData.services || []).map(s => ({
            serviceId: s.id,
            payment: Number(s.payment) || 0,
            billParticipant: !!s.billParticipant,
            participantAmount: Number(s.participantAmount) || 0    // NEW
          }))
      };

        const payloadJson = JSON.stringify(payload);
        console.log('payloadJson ' +payloadJson);

        // optional: show spinner flag if you have one
        this.isShowSpinner = true;
            let shiftId =this.shiftDeleteCOnfirmationInfo.shiftID
            this.isShowSpinner = false;
            const result = await updateShiftCancellation({
                shiftId,
                payloadJson
            });
            
             console.log('result during shift cancel '+JSON.stringify(result));
  
            if (result && result.success) {
              this.confirMationMessage( "Success", "Shift cancellation updated successfully", "success");
             

            } else {
                const message = (result && result.message) ? result.message : 'Unknown server error';
                 this.confirMationMessage('Update failed', message, 'error');
               
            } 
            this.shiftCanceltemplate = false;
            this.refreshStaffData(); 
          
        
    }
    get showModeSelector() {
  return Array.isArray(this.shifCancelData?.services) && this.shifCancelData.services.length > 1;
}

get isCombinedMode() {
  // default to combined when services > 1 and cancelMode not set
  const mode = this.shifCancelData?.cancelMode || (this.showModeSelector ? 'combined' : 'individual');
  return mode === 'combined';
}

get isIndividualMode() {
  return !this.isCombinedMode;
}

// used to bind combined bill radio (string)
get combinedBillValue() {
  return this.shifCancelData?.billParticipant ? 'yes' : 'no';
}




isAvailabilityOpen = false;
isAvailabilityClosing = false;
activeAvailabilityStaffId = null; 
availTop = 0;
availLeft = 0;

availPanelStyle = '';

get availPanelClass() {
  return `availPanel ${this.isAvailabilityClosing ? 'availClosing' : 'availOpen'}`;
}

availStopInsideClick(event) {
  event.stopPropagation();
}

handleUnavailableShifts = async (event) => {
  event.stopPropagation();

  const staffId = event.currentTarget.dataset.id;
  this.activeAvailabilityStaffId = staffId;

  const iconRect = event.currentTarget.getBoundingClientRect();

  const panelWidth = 320;
  const panelHeight = 260;
  const gap = 8;
  const padding = 12;
  const pointerAnchor = 24;

  // Open first so panel exists
  this.isAvailabilityClosing = false;
  this.isAvailabilityOpen = true;

  // Wait for render
  requestAnimationFrame(() => {
    const panel = this.template.querySelector("section.availPanel");
    if (!panel) return;

    // Find transformed ancestor of the PANEL (not the icon)
    const findTransformAncestor = (startEl) => {
      let el = startEl.parentElement;
      while (el && el !== document.body) {
        const t = window.getComputedStyle(el).transform;
        if (t && t !== "none") return el;
        el = el.parentElement;
      }
      return null;
    };

    const ctxEl = findTransformAncestor(panel);
    const ctxRect = ctxEl ? ctxEl.getBoundingClientRect() : { top: 0, left: 0 };

    // Compute coords in the panel's coordinate system
    let left = (iconRect.right - ctxRect.left) + gap;
    left = Math.min(left, (window.innerWidth - ctxRect.left) - panelWidth - padding);
    left = Math.max(padding, left);

    const iconCenterY = iconRect.top + iconRect.height / 2;
    let top = (iconCenterY - ctxRect.top) - pointerAnchor;

    const maxTop = (window.innerHeight - ctxRect.top) - panelHeight - padding;
    top = Math.max(padding, Math.min(top, maxTop));

    const pointerTop = (iconCenterY - ctxRect.top) - top;

    this.availPanelStyle = `top:${top}px; left:${left}px; --availPointerTop:${pointerTop}px;`;

    console.log("PANEL ctxEl:", ctxEl, "ctxRect:", ctxRect);
    console.log("ICON rect:", iconRect);
    console.log("FINAL style:", this.availPanelStyle);
  });

  // Fetch data (unchanged)
  try {
    const result = await getStaffAvailability({
      staffId,
      startDate: this.startDate,
      endDate: this.endDate
    });

    this.staffAvailabilityList = (result || []).map((item) => ({
      ...item,
       startDateFormatted: this.formatDateDDMMYYYY(item.Start_Date__c),
      startTimeFormatted: this.convertToAmPmObject(
        this.formatMillisecondsToTime(item.Start_Time__c)
      )?.displayTime,
      endTimeFormatted: this.convertToAmPmObject(
        this.formatMillisecondsToTime(item.End_Time__c)
      )?.displayTime,
      availTypePillClass:
        item.Type__c === "Unavailable"
          ? "availPill availPillRed"
          : "availPill availPillGreen"
    }));
  } catch (e) {
    this.staffAvailabilityList = [];
  }

  window.addEventListener("click", this.availOutsideClick, true);
  window.addEventListener("scroll", this.availOutsideClick, true);
  window.addEventListener("resize", this.availOutsideClick, true);
};



formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}



availOutsideClick = () => {
  this.availClose();
};

availClose = (event) => {
  if (event) event.stopPropagation();
  if (!this.isAvailabilityOpen) return;

  this.isAvailabilityClosing = true;

  window.removeEventListener('click', this.availOutsideClick, true);
  window.removeEventListener('scroll', this.availOutsideClick, true);
  window.removeEventListener('resize', this.availOutsideClick, true);

  // Must match CSS animation time
  window.setTimeout(() => {
    this.isAvailabilityOpen = false;
    this.isAvailabilityClosing = false;
  }, 180);
};


  handleTemplateChange(event) {
    console.log('handleTemplateChange → event fired');

    const field = event.target.dataset.field;
    console.log('Field:', field);

    // lightning-radio-group uses event.detail.value
    const value = event.detail?.value ?? event.target.value;
    console.log('Incoming value:', value);

    this[field] = value;
    console.log('Updated component field:', field, '=>', this[field]);

    console.log(
        'Current templateType:',
        this.templateType,
        'Start Date:',
        this.shiftTemplateStartDate
    );

    if (
        (field === 'templateType' || field === 'shiftTemplateStartDate') &&
        this.shiftTemplateStartDate
    ) {
        const start = new Date(this.shiftTemplateStartDate);
        const end = new Date(start);

        console.log('Start date object:', start.toDateString());

        if (this.templateType === 'Weekly') {
            console.log('Applying WEEKLY logic');
            end.setDate(start.getDate() + 6);
        }

        if (this.templateType === 'Fortnightly') {
            console.log('Applying FORTNIGHTLY logic');
            end.setDate(start.getDate() + 13);
        }

        this.shiftTemplateEndDate = end.toISOString().split('T')[0];
        console.log(
            'Calculated End Date:',
            this.shiftTemplateEndDate
        );
    } else {
        console.log('Auto-calculation skipped');
    }
}


 handleShiftTemplateOptionChange(event) {
        const value = event.detail.value;

        this.selectedOption = value;
        this.showOptions = false;
        this.showSaveForm = false;
        this.showTemplateList = false;

        if (value === 'save') {
          this.showSaveForm = true;
          this.shiftTemplateStartDate = this.startDate;
          this.shiftTemplateEndDate = this.endDate;


        } else if (value === 'view') {
            this.showTemplateList = true;
             this.loadTemplates(); // optional
        }
    }

    // GENERIC FORM CHANGE HANDLER
   /*  handleTemplateChange(event) {
        const field = event.target.dataset.field;
        const value = event.detail?.value ?? event.target.value;

        if (field) {
            this[field] = value;
        }
    } */
     resetState() {
        this.showOptions = true;
        this.showSaveForm = false;
        this.showTemplateList = false;
        this.selectedOption = '';
        this.showApplyTemplate=false;
        this.templateName='';
    }
  async saveTemplate() {
    console.log('Saving Template', {
        templateName: this.templateName,
        templateType: this.templateType,
        startDate: this.shiftTemplateStartDate,
        endDate: this.shiftTemplateEndDate
    });
  const spanError = this.validateTemplateSpan();
      if (spanError) {
          this.confirMationMessage(
              'Error',
              spanError,
              'error'
          );
          return; // STOP execution
      } 
    const payLoadForTempalte = {
        templateName: this.templateName,
        templateType: this.templateType,
        startDate: this.shiftTemplateStartDate,
        endDate: this.shiftTemplateEndDate,
        facilityId: this.SelectedComboBoxFacility
    };
     console.log(' this.SelectedComboBoxFacility '+ this.SelectedComboBoxFacility);
    try {
        const result = await saveTemplate(payLoadForTempalte);

        // Handle error returned from Apex
        if (result && result.startsWith('Error:')) {
            const errorMessage = result.replace(/^Error:\s*/, '');

            this.confirMationMessage(
                'Error',
                errorMessage,
                'error'
            );
            return; // stop execution immediately
        }

// Success flow
          this.confirMationMessage(
              'Success',
              result || 'Roster template saved successfully.',
              'success'
          );

      this.loadTemplates();
      this.rosterTemplateProceedStartDate= this.shiftTemplateStartDate;
      this.rosterTemplateProceedEndDate=this.shiftTemplateEndDate;


        setTimeout(() => {
            this.selectedTemplate = this.RosterTemplates[0];
            this.showTemplateList = false;
            this.showSaveForm = false;
            this.showOptions = false;
            this.showApplyTemplate = true;
        }, 1000);

    } catch (error) {
        // Apex execution or network error
        this.confirMationMessage(
            'Error',
            error?.body?.message || 'Unexpected error occurred.',
            'error'
        );
    }
}
validateTemplateSpan() {
    console.log('validateTemplateSpan → START');

    if (!this.shiftTemplateStartDate || !this.shiftTemplateEndDate) {
        console.log(
            'validateTemplateSpan → Missing dates',
            this.shiftTemplateStartDate,
            this.shiftTemplateEndDate
        );
        return null; // let existing required-field validation handle this
    }

    const start = new Date(this.shiftTemplateStartDate);
    const end = new Date(this.shiftTemplateEndDate);

    console.log(
        'validateTemplateSpan → Start:',
        start.toDateString(),
        'End:',
        end.toDateString()
    );

    // Calculate inclusive day span
    const diffInDays =
        Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    console.log(
        'validateTemplateSpan → Template Type:',
        this.templateType,
        'Span (days):',
        diffInDays
    );

    if (this.templateType === 'Weekly' && diffInDays !== 7) {
        console.log('validateTemplateSpan → Weekly validation FAILED');
        return 'For Weekly templates, the date range must be exactly 7 days.';
    }

    if (this.templateType === 'Fortnightly' && diffInDays !== 14) {
        console.log('validateTemplateSpan → Fortnightly validation FAILED');
        return 'For Fortnightly templates, the date range must be exactly 14 days.';
    }

    console.log('validateTemplateSpan → Validation PASSED');
    return null;
}



    loadTemplates() {
        getTemplates({facilityId: this.SelectedComboBoxFacility})
            .then(result => {
                this.RosterTemplates = result.map(temp => ({
                    ...temp,
                    formattedStartDate: this.formatDate(temp.Start_Date__c),
                    formattedEndDate: this.formatDate(temp.End_Date__c),
                    formattedCreatedDate: this.formatDate(temp.CreatedDate)
                }));
            })
            .catch(error => {
                console.error('Error loading templates', error);
            });
    }
  formatDate(dateValue) {
    if (!dateValue) {
        return '';
    }

    const date = new Date(dateValue);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}
handleTemplateClick(event) {
    const templateId = event.currentTarget.dataset.id;

    this.selectedTemplate = this.RosterTemplates.find(
        temp => temp.Id === templateId
    );
    console.log('Selected Template', JSON.stringify(this.selectedTemplate));
    this.rosterTemplateProceedStartDate=this.startDate;
    this.rosterTemplateProceedEndDate=this.endDate;

    // Switch modal view
    this.showSaveForm=false;
    this.showOptions=false;
    this.showTemplateList = false;
    this.showApplyTemplate = true;
   this.loadStaffLeaves();
}
handleBackShowApplyTemplate() {
    this.showSaveForm=false;
    this.showOptions=false;
    this.showTemplateList = true;
    this.showApplyTemplate = false; 
}
handleRosterTemplateCheckboxChange(event) {
    const field = event.target.dataset.field;
    const value = event.target.checked; // ✅ checkbox uses checked

    this[field] = value;

    console.log(field, value);
}
handleProceedToRosterTemplate(){
  console.log('handleProceedToRosterTemplate');
  console.log('rosterTemplateProceedStartDate '+this.rosterTemplateProceedStartDate);
  console.log('rosterTemplateProceedEndDate '+this.rosterTemplateProceedEndDate);
  console.log('copyParticipant '+this.copyParticipant);
  console.log('copyShiftNotes '+this.copyShiftNotes);
  console.log('copyChecklist '+this.copyChecklist);
  console.log('selectedTemplate.Id '+JSON.stringify( this.selectedTemplate));
  console.log( ' selected facilities '+ JSON.stringify(this.facilityValue) );
  this.isShowSpinner = true;
  this.shiftTemplateFlag=false;
  createRosterTemplates({
    rosterTemplate :JSON.stringify([this.selectedTemplate]),
    startDate : this.rosterTemplateProceedStartDate,
    endDate : this.rosterTemplateProceedEndDate,
    facilityIdList : this.facilityValue,
    copyChecklist : this.copyChecklist,
    copyParticipant : this.copyParticipant,
    copyShiftNotes : this.copyShiftNotes
  })
  .then(result => {
     this.isShowSpinner = false;
    this.closeShiftTemplate();
  
    console.log('result   '+JSON.stringify(result));
      this.confirMationMessage( "Success", "Rosters created successfully.", "success");
     this.refreshStaffData(); 
     if (this.isParticipanTViewEnable) {
        // force change detection + ensure condition
        this.refreshparticipantview = false;

        setTimeout(() => {
            this.refreshparticipantview = true;
        }, 0);
    }
   
  }).catch(error => {
    this.isShowSpinner = false;
    this.confirMationMessage( "Error", "Error creating Rosters.", "error");
    console.log('error '+JSON.stringify(error));
  })
   
}
handleBackShowTemplateList(){
  this.showSaveForm=false;
  this.showOptions=true;
  this.showTemplateList = false;
  this.showApplyTemplate = false;
    this.selectedOption = '';
}
handleDeleteTemplate(event) {
   event.stopPropagation();
    const templateId = event.currentTarget.dataset.templateid;
     this.showApplyTemplate = false;
    console.log('templateId '+templateId);
    deleteRosterTemplate({
        templateId : templateId
    })
    .then(result => {
        console.log('result '+JSON.stringify(result));
        this.confirMationMessage( "Success", "Roster Template is deleted successfully.", "success");
       
        this.loadTemplates();
    })  
    .catch(error => {
        console.log('error '+JSON.stringify(error));
    }) 
   }

get hasTemplates() {
    return this.RosterTemplates && this.RosterTemplates.length > 0;
}

get showNoTemplatesMessage() {
    return this.showTemplateList && (!this.RosterTemplates || this.RosterTemplates.length === 0);
}

 loadStaffLeaves() {
  console.log('loadStaffLeaves');
  console.log('this.rosterTemplateProceedStartDate =>'+this.rosterTemplateProceedStartDate);
   console.log('this.endrosterTemplateProceedEndDateDate =>'+this.rosterTemplateProceedEndDate);

        getStaffWithApprovedLeaves({
            startDate: this.rosterTemplateProceedStartDate,
            endDate: this.rosterTemplateProceedEndDate,
            facilityIdList: this.facilityValue
        })
            .then(result => {
                console.log('Staff leaves =>', JSON.stringify(result));

                this.staffLeaves = result.map(r => ({
                    ...r,
                    fromDateFormatted: r.fromDate
                        ? new Date(r.fromDate).toLocaleDateString('en-GB')
                        : '',
                    toDateFormatted: r.toDate
                        ? new Date(r.toDate).toLocaleDateString('en-GB')
                        : ''
                }));

                this.showLeavesData = this.staffLeaves.length >0;
            })
            .catch(error => {
                console.error('Error fetching staff leaves', error);
                this.staffLeaves = [];
                this.showLeavesData = true;
            });
    }
     get isDraft() {
        return this.selectedShiftMode === 'Draft';
    }

    get isAssign() {
        return this.selectedShiftMode === 'Active';
    }

    // onchange handler
    handleShiftModeChange(event) {
       console.log('Selected Mode:', this.selectedShiftMode);
        event.stopPropagation();
        this.selectedShiftMode = event.target.value;
        console.log('Selected Mode:', this.selectedShiftMode);
    }


    handleMonthlyBack() {
      // Switch back to Weekly
      this.selectedViewType = 'weekly';
      localStorage.setItem("rosterViewType", "weekly");

      // Restore weekly UI state
      this.isStaffView = true;
      this.isCalenderShiftView = false;
      this.shiftReportsFlag = false;
      this.isHome = true;
      this.isMonthlyView=false;

      // Rebuild weekly view
      this.initializeWeek(this.currentStartOfWeek);
      this.loadStaffData();
}

get monthlyStaffList() {
  const staffMap = new Map();

  (this.staffData || []).forEach(role => {
    (role.staffData || []).forEach(staff => {
      if (!staffMap.has(staff.staffId)) {
        staffMap.set(staff.staffId, {
          staffId: staff.staffId,
          staffName: staff.disPlayName || `${staff.firstName} ${staff.lastName}`,
          profileUrl: staff.profileUrl
        });
      }
    });
  });

  return Array.from(staffMap.values());
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

recalculateBrokenExcessHours(endTimeChange) {

    console.log("========== BROKEN SHIFT DEBUG START ==========");

    // Only run for broken shifts
    if (!this.orignalShiftTime) {
        console.log("❌ originalShiftTime is missing");
        return;
    }

  

    // Convert original shift start to 24h
    let shiftStart24 = this.convertTo24HourFormat(
        this.orignalShiftTime.toLowerCase()
    );

    // remove Z just in case
   // Convert BOTH times to 24h ISO-safe format
    let endTime24 = this.convertTo24HourFormat(
        endTimeChange.toLowerCase()
    );

   

    let startTimeClean = shiftStart24?.replace("Z", "");
    let endTimeClean   = endTime24?.replace("Z", "");

    let startString = `${this.addShiftData.AddShiftEndDate}T${startTimeClean}`;
    let endString   = `${this.addShiftData.AddShiftEndDate}T${endTimeClean}`;


    let startDT = new Date(startString);
    let endDT   = new Date(endString);



    // Handle overnight scenario
    if (endDT <= startDT) {
      //  console.log("🌙 Overnight detected — adding 1 day to endDT");
        endDT.setDate(endDT.getDate() + 1);
    }

    let spanHours =
        (endDT.getTime() - startDT.getTime()) / (1000 * 60 * 60);

    let excess = spanHours > 12 ? (spanHours - 12) : 0;
     console.log("🔄 Broken Shift Span:", spanHours, " Excess:", excess);
    console.log("========== BROKEN SHIFT DEBUG END ==========");

    let extraHours = Number(excess.toFixed(2));
    let rate       = extraHours <= 0 ? 0 :  this.AddShiftAndServices[0].hourlyrate;
    let wages      = Number((rate * extraHours).toFixed(2));

    console.log("✅ recalculated extraHours:", extraHours);
    console.log("✅ recalculated rate:", rate);
    console.log("✅ recalculated wages:", wages);

    // ⚡ IMPORTANT: Assign NEW OBJECT reference (triggers UI refresh)
    this.extendedBrokenMeta = {
        extraHours: extraHours,
        hourlyRate: rate,
        brokenExtendedWages: wages
    };
    this.AddShiftAndServices[0].brokenExtendedWages = wages;
    this.AddShiftAndServices[0].doubleRate = rate;
    this.AddShiftAndServices[0].extraHours = extraHours;


    // control UI visibility
    this.showExtendedBrokenUI = extraHours > 0;

   
}

async recalculateMinimumEngagement(
    editSegmentId,
    editedStartAMPM,
    editedEndAMPM
) {

    console.log("===== MIN ENG REBALANCE START =====");

    try {

        /* -------------------------------------------
           Fetch broken shift segments
        --------------------------------------------*/
        const brokenShiftData = await getBrokenShiftsData({
            AddshiftId: this.addShiftData.AddShiftId
        });

        if (!brokenShiftData?.length) {
            console.log("❌ No broken shift records returned");
            return;
        }

        /* -------------------------------------------
           Helper: AM/PM → Date
        --------------------------------------------*/
        const toDate = (timeAMPM) => {
            const t24 = this.convertTo24HourFormat(
                timeAMPM.toLowerCase()
            ).replace("Z", "");

            return new Date(
                `${this.addShiftData.AddShiftEndDate}T${t24}`
            );
        };

        const round = v => Math.round(v * 100) / 100;

        /* -------------------------------------------
           STEP 1 — Edited BASE duration
        --------------------------------------------*/
        let editedBaseDuration = 0;

        brokenShiftData.forEach(seg => {

            const startAMPM =
                seg.Id === editSegmentId
                    ? editedStartAMPM
                    : seg.Start_time_Formula__c;

            const endAMPM =
                seg.Id === editSegmentId
                    ? editedEndAMPM
                    : seg.End_time_formula__c;

            let startDT = toDate(startAMPM);
            let endDT   = toDate(endAMPM);

            if (endDT <= startDT) {
                endDT.setDate(endDT.getDate() + 1);
            }

            const duration =
                (endDT - startDT) / (1000 * 60 * 60);

            if (seg.Id === editSegmentId) {
                editedBaseDuration = duration;
            }
        });

        editedBaseDuration = round(editedBaseDuration);

        console.log("🎯 editedBaseDuration >>>", editedBaseDuration);

        /* -------------------------------------------
           STEP 2 — Total payable hours
        --------------------------------------------*/
        let totalPayableHours = 0;

        brokenShiftData.forEach(seg => {

            if (seg.Id === editSegmentId) {
                totalPayableHours += editedBaseDuration;
            } else {
                totalPayableHours +=
                    Number(seg.Shift_Calculated_Duration__c) || 0;
            }
        });

        totalPayableHours = round(totalPayableHours);

        console.log("🔢 totalPayableHours >>>", totalPayableHours);

        /* -------------------------------------------
           STEP 3 — Minimum Engagement
        --------------------------------------------*/
        const MIN_ENGAGEMENT = 2;

        let upliftNeeded =
            totalPayableHours < MIN_ENGAGEMENT
                ? round(MIN_ENGAGEMENT - totalPayableHours)
                : 0;

        console.log("📈 upliftNeeded >>>", upliftNeeded);

        /* -------------------------------------------
           STEP 4 — UPDATE BILLABLE HOURS
        --------------------------------------------*/

        this.AddShiftAndServices =
            this.AddShiftAndServices.map(row => {

                let updated = { ...row };

                /* ===== EDITED SEGMENT ===== */
                if (row.shiftWithStaffId === editSegmentId) {

                    let newBillableHours = editedBaseDuration;

                    // ✅ Add uplift
                    if (upliftNeeded > 0) {
                        newBillableHours =
                            editedBaseDuration + upliftNeeded;

                        console.log(
                            "➕ Uplift added >>>",
                            upliftNeeded
                        );
                    }

                    updated.billablehours = round(newBillableHours);
                    updated.isMinimumEngagementApplied =
                        upliftNeeded > 0;

                    updated.rowBillableHoursChanged = true;

                    updated.amount = (
                        (updated.unitprice || 0) *
                        updated.billablehours
                    ).toFixed(2);

                    console.log("✅ Edited row updated");
                }

                return updated;
            });

        /* -------------------------------------------
           STEP 5 — REMOVE EXCESS UPLIFT (if any)
        --------------------------------------------*/
        if (totalPayableHours > MIN_ENGAGEMENT) {

            let remainingExcess =
                round(totalPayableHours - MIN_ENGAGEMENT);

            console.log(
                "♻️ Excess uplift detected >>>",
                remainingExcess
            );

            this.AddShiftAndServices =
                this.AddShiftAndServices.map(row => {

                    if (
                        row.isMinimumEngagementApplied &&
                        remainingExcess > 0
                    ) {

                        let updated = { ...row };

                        const baseWorked =
                            Number(row.baseDuration ||
                                   row.duration ||
                                   0);

                        const upliftPortion =
                            updated.billablehours - baseWorked;

                        const removable =
                            Math.min(
                                remainingExcess,
                                Math.max(0, upliftPortion)
                            );

                        updated.billablehours =
                            round(updated.billablehours - removable);

                        remainingExcess =
                            round(remainingExcess - removable);

                        updated.amount = (
                            (updated.unitprice || 0) *
                            updated.billablehours
                        ).toFixed(2);

                        console.log(
                            "♻️ Removed uplift >>>",
                            removable
                        );

                        return updated;
                    }

                    return row;
                });
        }

        console.log("===== MIN ENG REBALANCE SUCCESS =====");

    } catch (error) {
        console.error("❌ Error in minimum engagement:", error);
    }
}


handleChildSelection(event){

    const selectedDates = event.detail.selectedDates;
    console.log('Parent received selected dates', JSON.stringify(selectedDates));
    this.recuringShiftsToDelete=selectedDates;
 
}
get showRecurringIcon() {
    //console.log('Checklistrows:', JSON.stringify(this.ChekListrows));
    //console.log('shiftDeleteCOnfirmationInfo:', JSON.stringify(this.shiftDeleteCOnfirmationInfo));

    return (
        (this.ChekListrows?.length ?? 0) > 0 &&
        this.shiftDeleteCOnfirmationInfo?.recurStatus === true && this.isEditShiftScreenFlag == true
    );
}
async handleOpenRecurChecklist(){
    console.log('recuring shifts to previously selcted==>'+JSON.stringify(this.recuringShiftsToDelete));
     console.log('this.shiftDeleteCOnfirmationInfo.refId==>'+this.shiftDeleteCOnfirmationInfo.refId);
    this.openRecurCheckList=true;
    const recurDates = await getRecurringShiftDates({
        refId: this.shiftDeleteCOnfirmationInfo.refId
        });
        console.log('recurDates in check list ==>'+JSON.stringify(recurDates));
         this.recurringDatesForChild=recurDates;
         this.recurredShiftsDelete=this.recurringDatesForChild.length>0;
}
closeWarningMessageForCheckList(){
  this.openRecurCheckList=false;
   console.log('recuring shifts to delete ==>'+JSON.stringify(this.recuringShiftsToDelete));
}


updateChecklistInRecurring(){

    updateRecurringShiftChecklist({
        refId: this.shiftDeleteCOnfirmationInfo.refId,
        recuringShiftsToDelete: this.recuringShiftsToDelete,
        checklistJson: JSON.stringify(this.ChekListrows),
          deletedChecklistJson: JSON.stringify(this.deletedChecklist)
    })
    .then((result) => {

        console.log('Checklist updated successfully');

        this.confirMationMessage(
            "Success",
            "Recurring checklist updated successfully.",
            "success"
        );

    })
    .catch((error) => {

        console.log('Error updating checklist => ', JSON.stringify(error));

        this.confirMationMessage(
            "Error",
            "Error updating recurring checklist.",
            "error"
        );

    });
}

handleMoblieSettingChange(event) {

    const field = event.detail?.field || event.target.dataset.field;
    const value = event.detail?.value || event.target.value;

    if (field === 'facility') {
        this.mobileSettingFacilityValue = value;
        this.fetchFacilitySettings(value);
    } 
    else if (field === 'enableSignIn') {
        this.enableSignIn = event.target.checked;
    } 
    else if (field === 'enableSignOut') {
        this.enableSignOut = event.target.checked;
    }

    console.log('mobileSettingFacilityValue => ' + this.mobileSettingFacilityValue);
}

fetchFacilitySettings(facilityId) {
    getfacilityById({ facId: facilityId })
        .then(result => {
            // Assuming Apex returns { enableSignIn: true/false, enableSignOut: true/false }
            this.enableSignIn = result.Enable_Sign_In_Request__c;
            this.enableSignOut = result.Enable_Sign_out_Request__c;
        })
        .catch(error => {
            console.error('Error fetching facility settings', error);
        });
}

handleFinalAssignMobileSettings() {
    // Basic guard
    if (!this.mobileSettingFacilityValue) {
        console.error('Facility is required');
        return;
    }
 console.log('mobileSettingFacilityValue '+this.mobileSettingFacilityValue);
  console.log('enableSignOut '+this.enableSignOut);
  console.log('enableSignIn '+this.enableSignIn);
    updateMobielSetting({
        facilityId: this.mobileSettingFacilityValue,
        enableSignInRequest: this.enableSignIn ?this.enableSignIn :false,
        enableSignOutRequest: this.enableSignOut ?this.enableSignOut :false
    })
    .then(() => {
        // Success handling
        console.log('Settings updated successfully');

        // Optional: close modal
        this.handleCloseUnavailabletemplate();

        // Optional: toast
        this.showToast('Success', 'Mobile settings updated', 'success');
    })
    .catch(error => {
        console.error('Error updating settings', error);

        this.showToast('Error', 'Failed to update settings', 'error');
    });
}


}