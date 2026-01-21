import { LightningElement, track, wire, api } from "lwc";
import getParticipantData from "@salesforce/apex/AddShiftParticipantView.getParticipantData";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
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
import generateAndSendNotification from "@salesforce/apex/MobileAppNotificationsV2.generateAndSendNotification";
import getJSONdata from "@salesforce/apex/GeoTaggingfromAWS.getS3JsonData";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import LEAFLET from "@salesforce/resourceUrl/leaflet";
import getServicesByDate from "@salesforce/apex/ServiceSupportPlanHandler.getServicesByDate";
import getStaffByStatus from "@salesforce/apex/StaffController.getStaffByStatus";
import getOverlappingShiftsData from "@salesforce/apex/AddShiftParticipantView.getOverlappingShiftsData";
import getFatigueData from "@salesforce/apex/RosterCreation.getFatigueData";
import HolidaysPopup from "@salesforce/apex/RosterCreationRecurringHnadler.HolidaysPopup";
import assignShifts from "@salesforce/apex/RosterAutoScheduleHandler.assignShifts";
import currnetLoggedInFcaility from "@salesforce/apex/RosterAutoScheduleHandler.currnetLoggedInFcaility";
import Id from "@salesforce/user/Id";
import { getRecord } from "lightning/uiRecordApi";
import UserEmail from "@salesforce/schema/User.Email";
import publishShifts from "@salesforce/apex/RosterAutoScheduleHandler.publishShifts";
//import getCatalogueData from "@salesforce/apex/StaffAvailabilityController.getCatalogueData";
import getCatalogueData from "@salesforce/apex/CatalogueDataHandler.getCatalogueData";
import GOOGLE_API_KEY from "@salesforce/label/c.Google_Geocode_API_Key";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getFundsData from "@salesforce/apex/RosterCreation.getFundsData";
import deleteCheckList from "@salesforce/apex/ShiftwithStaffController.deleteCheckList";
import sendShiftEmails from "@salesforce/apex/StaffEmailNotificationController.sendShiftEmails";
import getfacilityById from "@salesforce/apex/FacilityController.getfacilityById";
import validateSegments from "@salesforce/apex/CustomShiftsValidations.validateSegments";
import getPublishData from "@salesforce/apex/RosterAutoScheduleHandler.getPublishData";
import processSingleShift from "@salesforce/apex/StaffAvailabilityController.processSingleShift";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import getShiftsTypeByFacility from "@salesforce/apex/RosterInvoicesHandler.getShiftsTypeByFacility";
import getShiftTypes from "@salesforce/apex/AddShiftParticipantView.getShiftTypes";
//import createUnassignedShift from "@salesforce/apex/RosterCreation.createUnassignedShift";
import unAssignedList from "@salesforce/apex/RosterCreation.unAssignedList";
import createShift from "@salesforce/apex/RosterCreationVersionTwo.createShift";
import validateAndEnrichShifts from "@salesforce/apex/SplitShiftValidations.validateAndEnrichShifts";
import validateStaffAvailabilityWithReasons from '@salesforce/apex/RosterCreation.validateStaffAvailabilityWithReasons';
import fetchBulkRoles from '@salesforce/apex/FacilityController.fetchBulkRoles';


export default class TesseractAppsParticipantView extends LightningElement {
  @track participantData = {}; // Store participant data
  @track error; // Store errors
  @track searchName = ""; // Search input
  @api isExpandedView = false;
  @api isCompactView = false;

  @api startDate = null;
  @api endDate = null;
  @api facIdlist = [];
  @api chosenRole = [];
  @api choosenShiftType = [];
  @api choosenStatus = [];
  @api orgId = "";
  @api weekDataJson = "";
  @track openParticipantshiftView = false;
  @track participantDataflag = true;
  @track currentStartDate;
  @track currentEndDate;
  @track weekDaysWithDates = [];
  @track currentStartOfWeek; // Tracks the start of the current week
  @track monthName;
  @track OrgNisationRoles = [];
  @track facilityOptions = [];
  @track facilityValue = [];
  @track orgId;
  @track staffData = [];
  @track isModalOpen = false;
  @track modalStyle = "";
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

  @track SelctedComboBoxRole;
  @track SelectedComboBoxFacility;
  @track isTooltip = false;
  @track shiftTooltipInformation = {};
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
  @track staffComboBoxOptions = [];
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
  @track participantIdInEdit;
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
  @track isDisableParticipantCheckBox = true;
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
  @track isCreateShiftButton = true;
  @track parentAddShiftId = "";
  @track isVisibleCreateServicesButton = true;
  @track isVisiblePlusIcon = true;
  @track isParticipanTViewEnable = false;

  get weekDaysWithDatesJSON() {
    return JSON.stringify(this.weekDaysWithDates);
  }
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
  @track startTimeSelectedHour;
  @track startTimeSelectedminute;
  @track endtimeSelectedHour;
  @track endtimeSelectedminute;
  @track startTimeAMPM;
  @track endTimeAMPM;
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
  colors = ["#008000", "#FFD700", "#FF0000", "#0000FF"]; // Green, Yellow, Red, Blue

  @track staffComboBoxRoles = [];
  wiredRolesStaffData;
  @track RolesStaffId;
  @track roleOptions = [];
  @track ServiceWarningMessage = false;
  @track participantServiceDeleteInfo = {};
  @track shiftDeleteCOnfirmationInfo = {};
  @track shiftDeleteConfirmation = false;
  @track headingLabel = "Create Service";
  @track riskIndex;
  @track fatigueManagementFlag = false;
  @track cutsomShiftTemplate = false;
  @track IsLongShift = false;
  @track LongShiftTimeSlots = {};
  @track rateRows = [];
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

  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }

  @track autoschdulePopup = false;
  @track publishTempalte = false;
  @track HolidaySaveButton = true;
  @track isOriginalStaffChanged = false;
  @track ShiftwithStafftoApexId = null;
  @track recurEndDateFormattedDate;
  @track deletedChecklist = [];
  @track finalSelectedFacilities = [];
  @track RecurringWithIncludeAndNewParticipants = false;
  @track isSingleClassForServiceCreation = true;
  @api loggedInUserType;
  @track publishEndDate = "";
  @track publishStartDate = " ";
  @track isPublishDisable = true;
  @track isParticipantServiceCreated = false;
  @track isCheckboxChecked = false;
  @track isPublishDisable = true;
  @track shiftPublishStatus = "";
  @track otherThanNdis = false;
  @track AllStaffListBasedOnRoles = [];
  @track RoleFilter = [];
  @track shiftNameOptions = [];
  @track shiftTimeMap = new Map();
  @track shiftStatusUnassigned;
  @track shiftwithstaffIdUnassigned;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  @track enableTimeRounding=false;
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
  @track selectedParticipantLabel;
   @track hourlyRateEditable=false;
  @track disableNotification=false;
  @track shiftAddressInRosterSettings='';
  @track showErrorModal=false;
 @track staffDateConflicts = [];
 @track originalServiceAmounts = {};
 refreshTimestamp

  @api
  updateFlags() {
    //  this.participantData = false;
    this.autoschdulePopup = true; // Only this flag becomes true
    console.log("Child flags updated:", this.firstFlag, this.secondFlag);
  }
  @api
  openPublishFlag() {
    this.publishTempalte = true;
    this.isPublishDisable = true;
    this.publishEndDate = "";
    this.publishStartDate = "";
    this.isCheckboxChecked = false;
  }
  @api isautoschedulepopup;
  // Called when the component is initialized
  renderedCallback() {
    // Check if leaflet resources are already loaded
    console.log("RENDERED IN Participant View");
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
  }

  @wire(getRecord, { recordId: Id, fields: [UserEmail] })
  userDetails({ error, data }) {
    if (data) {
      this.currentUserEmail = data.fields.Email.value;
      if (this.currentUserEmail) {
        currnetLoggedInFcaility({ UserEmail: this.currentUserEmail }).then(
          (result) => {
            console.log("result " + JSON.stringify(result));

            const orderMap = {};
            const valueMap = {};

            const pairs = [
              { label: "Classification", api: "Classification" },
              { label: "Risk Index", api: "Risk_Index" },
              { label: "Employment Type", api: "Employment_Type" },
              { label: "Preferred Staff", api: "Preferred_Staff" },
              { label: "Fatigue Management", api: "Fatigue_Management" },
              { label: "Geo Location", api: "Radius" }
            ];

            pairs.forEach((p) => {
              if (result[`${p.api}_Order__c`] !== undefined) {
                orderMap[p.label] = result[`${p.api}_Order__c`];
              }
              if (result[`${p.api}_Value__c`] !== undefined) {
                valueMap[p.label] = result[`${p.api}_Value__c`];
              }
            });

            const patchedRows = this.rows.map((r) => {
              const incoming = valueMap[r.label];
              if (incoming === undefined) {
                return r; // nothing new → keep as-is
              }

              if (r.isIcon) {
                // arrow-icon rows
                const highToLow = incoming === "High to Low";
                return {
                  ...r,
                  directionLabel: incoming,
                  direction: highToLow ? "arrowdown" : "arrowup",
                  iconName: highToLow ? "utility:arrowdown" : "utility:arrowup"
                };
              }

              // checkbox / radio rows
              return { ...r, value: incoming };
            });

            patchedRows.sort((a, b) => {
              const oa = orderMap[a.label];
              const ob = orderMap[b.label];

              if (oa !== undefined && ob !== undefined) return oa - ob; // both ordered
              if (oa !== undefined) return -1; // only a ordered
              if (ob !== undefined) return 1; // only b ordered
              return 0; // neither ordered
            });

            this.rows = patchedRows;
          }
        );
      }
    } else if (error) {
      this.usererror = error;
    }
  }
  @wire(getSeriveList, { shiftStaffId: "$shiftStaffId" })
  wiredServices(response) {
    this.servicesList = [];
    this.wiredServicesResult = response; // Track the result for refreshApex
    const { data, error } = response;
    if (data) {
      this.servicesList = data.map((rec) => {
        return {
          ...rec,
          unitprice: rec.Edited_Unit_Price__c || rec.Unit_Price__c
        };
      });
      console.log(
        "Service List IN WIRE METHOD",
        JSON.stringify(this.servicesList)
      );
    } else if (error) {
      console.error("Error fetching services:", error);
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
    event.target.style.textAlign = "justify";
  }

  handleMouseOut(event) {
    event.target.style.whiteSpace = "nowrap";
    event.target.style.overflow = "hidden";
  }
  connectedCallback() {
    this.handleRefresh();
    window.addEventListener("scroll", this.handleScrollOrClick);
    window.addEventListener("click", this.handleOutsideClick);
    this.handleDocumentClickBound = this.handleDocumentClickDropdown.bind(this);
    document.addEventListener("click", this.handleDocumentClickBound);
    getFacilityData()
      .then((response) => {
        this.facilityOptions = response.map((record) => ({
          value: record.Id,
          label: record.Name,
          preferredName: record.Facility_Preferred_Name_Formula__c,
          participantPreferredName: record.Participant_Preferred_Name_Formla__c,
          staffPreferredName: record.Staff_Preferred_Name_Formula__c
        }));
        this.organisationShiftTimes = response[0].Organisation__r;
        console.log(
          "organisationShiftTimes" + JSON.stringify(this.organisationShiftTimes)
        );
      })
      .catch((err) => {
        console.error(err);
      });

    organizationDetails().then((response) => {
      this.orgId = response.listofPriceBook.Id;
      fetchBulkRoles({facilityIDList:this.facIdlist}).then(
             facRoles =>{
              console.log("facRoles " + JSON.stringify(facRoles));
               facRoles.forEach(rec=>{
                   this.OrgNisationRoles.push({label:rec.Role_Name__c ,value:rec.Role_Name__c})
                });
                this.RoleFilter=this.OrgNisationRoles;
               let AllFilter = { value: "All", label: "All" };
               this.OrgNisationRoles = [AllFilter, ...this.OrgNisationRoles];
               console.log("this.OrgNisationRoles " + JSON.stringify(this.OrgNisationRoles));
       });
     

      
    });
    this.loadShiftTypes();

    this.recurEveryOptions = this.generateOptions(30);
    this.monthLyOptions = this.generateOptions(31);
    console.log("isautoschedulepopup " + this.isautoschedulepopup);
    console.log("logged in userType " + this.loggedInUserType);
    if (this.isautoschedulepopup == "auto") {
      this.updateFlags();
    }
    if (this.isautoschedulepopup == "publish") {
      this.openPublishFlag();
    }
    // this.loadParticipantData();
    // console.log('Role options:', JSON.stringify(this.OrgNisationRoles));
  }

  async loadShiftTypes() {
    try {
      const facIdlist = this.facIdlist; // pass facility Ids here
      const result = await getShiftTypes({ facIdlist });

      let tempObj = {}; // 🔹 use plain object instead of Map
      console.log("color result", JSON.stringify(result));

      result.forEach((sh) => {
        if (!tempObj[sh.Facility__c]) {
          tempObj[sh.Facility__c] = {}; // init facility object
        }

        let cssStyle =
          `border-left: 6px solid ${sh.Colour__c}; ` +
          `background-color: ${sh.Colour__c}20; ` +
          `border-radius: 6px;`;

        tempObj[sh.Facility__c][sh.Id] = cssStyle;
      });

      this.shiftTimeMap = tempObj;
      console.log("ShiftTimeMap", JSON.stringify(this.shiftTimeMap));
    } catch (error) {
      console.error("Error loading shift types", error);
    }
  }

  generateOptions(max) {
    const options = [];
    for (let i = 1; i <= max; i++) {
      // Starting from 1 for more realistic options
      options.push({ label: `${i}`, value: `${i}` });
    }
    return options;
  }
  disconnectedCallback() {
    // Remove event listeners when component is destroyed
    window.removeEventListener("scroll", this.handleScrollOrClick);
    window.removeEventListener("click", this.handleOutsideClick);
    if (this.handleDocumentClickBound) {
      document.removeEventListener("click", this.handleDocumentClickBound);
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
          staffPaidBreak:rec.Paid_Break__c
        };
      });
      //  console.log("staff in create edit list ==>" + JSON.stringify(this.staffOptions));
    });
  }
  // Wire method to call Apex
  // @wire(getParticipantData, {
  //   startDate: "$startDate",
  //   endDate: "$endDate",
  //   facIdlist: "$facIdlist",
  //   orgID: "$orgId",
  //   weekDataJson: "$weekDataJson",
  //   name: "$searchName",
  //   shiftTypeList: "$choosenShiftType",
  //   statusList: "$choosenStatus"
  // })
  // wiredGetParticipantData(result) {
  //   this.wiredparticipantdata = result;
  //   this.isShowSpinner = true;
  //   //console.log("Apex Called:", JSON.stringify(result));
  //   if (result.data) {
  //     this.participantData = result.data;
  //     console.log("Apex Called:", JSON.stringify(this.participantData));
  //     this.isShowSpinner = false;
  //     this.error = undefined;
  //   } else if (result.error) {
  //     console.error("Apex Error:", JSON.stringify(result.error));
  //     this.isShowSpinner = false;
  //     this.error = result.error;
  //     this.participantData = {};
  //   }
  // }

  @wire(getParticipantData, {
    startDate: "$startDate",
    endDate: "$endDate",
    facIdlist: "$facIdlist",
    orgID: "$orgId",
    weekDataJson: "$weekDataJson",
    name: "$searchName",
    shiftTypeList: "$choosenShiftType",
    statusList: "$choosenStatus",
     refreshKey: "$refreshTimestamp" 
  })
  wiredGetParticipantData(result) {
    this.wiredparticipantdata = result;
    this.isShowSpinner = true;
   console.log("✅ RAW Participant Data:", JSON.stringify(result));
    if (result.data) {
      const rawParticipants = result.data.Participnat || [];
      const weekData = result.data.weekData || [];

     // console.log("✅ RAW Participant Data:", JSON.stringify(rawParticipants));
    //  console.log("✅ Week Data:", JSON.stringify(weekData));

      const initializedParticipants = rawParticipants.map((participant) => ({
        ...participant,
        servicesByDay: (participant.servicesByDay || []).map((day) => ({
          ...day,
          services: (day.services || []).map((serv) => ({
            ...serv,
            isHovered: false,
            hideIfNotHovered: false
          }))
        }))
      }));

      this.participantData = {
        Participnat: initializedParticipants,
        weekData: weekData
      };

      console.log(
        "✅ Final Participant Data:",
        JSON.stringify(this.participantData)
      );

      this.isShowSpinner = false;
      this.error = undefined;
    } else if (result.error) {
      console.error("❌ Apex Error:", JSON.stringify(result.error));
      this.isShowSpinner = false;
      this.error = result.error;
      this.participantData = {};
    }
  }

  loadParticipantData() {
    this.isShowSpinner = true;
    getParticipantData({
      startDate: this.startDate,
      endDate: this.endDate,
      facIdlist: this.facIdlist,
      orgID: this.orgId,
      weekDataJson: this.weekDataJson,
      name: this.searchName,
      shiftTypeList: this.choosenShiftType,
      statusList: this.choosenStatus
    })
      .then((result) => {
        console.log("Apex Response:", result);
        this.participantData = result;
        this.error = undefined;
        this.isShowSpinner = false;
      })
      .catch((error) => {
        console.error("Apex Error:", error);
        this.error = error;
        this.participantData = {};
        this.isShowSpinner = false;
      });
  }

  // Refresh the data manually
  handleRefresh() {
    console.log("Refreshing Data...");
     this.refreshTimestamp = Date.now();
    setTimeout(() => {
      refreshApex(this.wiredparticipantdata)
        .then(() => console.log("Data Refreshed Successfully"))
        .catch((error) => console.error("Refresh Failed:", error));
    }, 1500);
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
      AddShiftTypeName: null
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
    this.isDisableParticipantCheckBox = true;
    this.EmptyAddressFields();
    this.LongShiftTimeSlots = {};
    this.rateRows = [];
    this.IsLongShift = false;
    this.selectedParticipantLabel = "";
    this.groupShift=false;
    this.rowShiftTimingsEnable=false;
    this.rowShiftTypeEnable=false;
    this.hourlyRateEditable=false;
    this.disableNotification=false;
    this.shiftAddressInRosterSettings='';
     this.showErrorModal=false;
     this.staffDateConflicts = [];
      this.originalServiceAmounts={};
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

  async handleOpenParticipantShiftView(event) {
    console.log(
      "selected   facilities in  from participant view" +
        JSON.stringify(this.facIdlist)
    );
    this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
      this.facIdlist.includes(rec.value)
    );
    console.log(
      "final  facilities in participant view" +
        JSON.stringify(this.finalSelectedFacilities)
    );
    if (this.finalSelectedFacilities.length === 0) {
      this.confirMationMessage(
        "Error",
        "Please select at least one " +
          this.facilityPreferredName +
          "to create the shift.",
        "Error"
      );
      return;
    }
    this.participantDataflag = false;
    this.openParticipantshiftView = true;
    this.emptyFields();
    let holiday = event.currentTarget.dataset.isholiday;
    let shiftdate = event.currentTarget.dataset.weekdate;
    let role = this.chosenRole[0];
    let participantid = event.currentTarget.dataset.participantid;
    console.log("participant id " + participantid);
    console.log("date " + shiftdate + " role " + role + " holiday " + holiday);
    this.addShiftData.AddShiftRole = role;
    this.addShiftData.AddShiftStartDate = shiftdate;
    // this.addShiftData.AddShiftFacilityValue=this.finalSelectedFacilities[0].value;
    this.addShiftData.AddShiftFacilityValue =
      event.currentTarget.dataset.facvalue;
    console.log(
      "AddShiftFacilityValue " + this.addShiftData.AddShiftFacilityValue
    );
    const selectedFacility = this.finalSelectedFacilities.find(
      (f) => f.value === this.addShiftData.AddShiftFacilityValue
    );
    if (selectedFacility) {
      this.facilityPreferredName = selectedFacility.preferredName;
      this.participantPreferredName = selectedFacility.participantPreferredName;
      this.staffPreferredName = selectedFacility.staffPreferredName;
    }
   

    this.addShiftData.AddShiftHoliday = holiday == "true" ? true : false;
    this.AddShiftDayName = event.currentTarget.dataset.weekname;
    console.log(" AddShiftDayName ===>" + this.AddShiftDayName);
    this.addShiftData.AddShiftnotification = true;
    this.addShiftData.AddShiftType = "";
    this.isEditShiftScreenFlag = false;
    this.isIncludeParticipants = false;
    this.isCreateShiftButton = true;
    this.SplitShiftRows = [];
    this.isNewInsertOperation = true;
    this.startTimeSelectedHour = null;
    this.startTimeSelectedMinute = null;
    this.startTimeAMPM = null;
    this.endTimeSelectedHour = null;
    this.endTimeSelectedMinute = null;
    this.endTimeAMPM = null; // Store "AM" or "PM"
    this.riskindex = "";
    this.checkListDescription = "";
    this.isDisableParticipantCheckBox = true;
    this.participantAddressCheckBox = false;
    this.createShiftlabel = "Create Shift";
    
    this.handleAddSplitShiftRow();

    this.SplitShiftRows[0].participant = participantid;
    this.serviceParticipant = participantid;
    this.facilityAddressCheckbox = true;
    this.SplitShiftVisible = false;
    this.AddShiftRecurringCheckboxValue = false;
    this.ShiftwithStafftoApexId = null;
    this.isSingleClassForServiceCreation = true;
    this.fetchFacilityAddressAndGeocode();
    this.isSplitCheckbox = false;
    this.recurTemplate = false;

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
    this.isRecurWeekFlag = false;
    this.isRecurmontlyFlag = false;
    this.addNewAddressCheckBox = false;
    this.participantAddressCheckBox = false;
    this.headingLabel = "Create Service";
    this.hourlrRateLabel = "Hourly Rate";
    this.hourlyrateDisable = true;
    this.isDisableSaveButton = true;
    this.isParticipantServiceCreated = false;
      this.enableTimeRounding=false;
     this.hourlyRateEditable=false;
    if (this.addShiftData.AddShiftFacilityValue) {
      this.processShifts(this.addShiftData.AddShiftFacilityValue);
    }
      let fac=[];
        fac.push(this.addShiftData.AddShiftFacilityValue);
    
        const facRoles = await fetchBulkRoles({ facilityIDList: fac });
        console.log("facRoles " + JSON.stringify(facRoles));
    
       let rolesArray=[];
        facRoles.forEach(rec => {
            rolesArray.push({ label: rec.Role_Name__c, value: rec.Role_Name__c });
        });
        
        this.RoleFilter = [...rolesArray]; 
    refreshApex(this.wiredServicesResult);
    this.dispatchEvent(new CustomEvent("shiftcreationparticipantview"));
    await Promise.all([
      this.fetchStaffRoles(),
      this.staffSlistOnSelection(),
      this.handleLinkParticipants()
    ]);
    this.AddShiftAndServices = [this.initRow()];

    let participantLabel = this.participantoptions.find(
      (rec) => rec.value === participantid
    ).label;
    this.selectedParticipantLabel = participantLabel;

    // Make map callback async so you can use await
    this.AddShiftAndServices = await Promise.all(
      this.AddShiftAndServices.map(async (row) => {
        let updatedRow = {
          ...row,
          participantlabel: participantLabel,
          participant: participantid
        };

        try {
          const response = await getClientFunds({ clientId: participantid });
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

        return updatedRow;
      })
    );
  }
  handleAddSplitShiftRow() {
    const newRow = {
      id: Date.now().toString(), // Unique ID for each row
      index: this.SplitShiftRows.length, // Store the index
      startTime: null,
      endTime: null,
      duration: 0,
      serviceStffaHourlyRate: 0,
      serviceDate: this.addShiftData.AddShiftStartDate,
      StaffId: null,
      shiftWithStaffId: null,
      serviceNameValue: "",
      serviceStatusValue: "",
      state: "",
      selectedNdisIdValue: null,
      SplitShift: false,
      startTimeAMPM: "",
      endTimeAMPM: "",
      serviceSuppoertId: null,
      participant: null,
      serviceTypeId: null,
      // Apply alternating colors to each new row
      splitShiftColor: `border-left: 10px solid ${this.colors[this.SplitShiftRows.length % this.colors.length]};`
    };

    this.SplitShiftRows = [...this.SplitShiftRows, newRow];
    ((this.serviceGroupName = []), (this.servicePlan = ""));
    this.NdisServiceGroupName = false;
    this.isDisbaleServiceButton = true;
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

  getFacilityAddress() {
    getFacilityAddress({ facilityId: this.addShiftData.AddShiftFacilityValue })
      .then((result) => {
        // console.log('facility address'+JSON.stringify(result));
        if (result && result.length > 0) {
          const facility = result[0];
          this.address.street = facility.Address__Street__s;
          this.address.citySuburb = facility.Address__City__s;
          if (facility.Address__CountryCode__s == "AU") {
            this.address.country = "Australia";
          }
          this.address.provinceState = facility.Address__StateCode__s;
          this.address.postalcode = facility.Address__PostalCode__s;
          this.fetchGeocode();
        }
      })
      .catch((error) => {});
  }
  handleCloseCalenderParticipantView() {
    this.participantDataflag = true;
    this.openParticipantshiftView = false;
    this.dispatchEvent(new CustomEvent("backparticipantview"));
  }
  async handleAddShiftChange(event) {
    this.addShiftData[event.target.name] = event.target.value;
    // console.log('add shift name'+this.AddShiftDayName)
    if (
      this.facilityAddressCheckbox == true &&
      event.target.name == "AddShiftFacilityValue"
    ) {
      this.getFacilityAddress();
    }

      if (event.target.name == "AddShiftTypeName") {
      console.log(
          "this.addShiftData.AddShiftTypeName ==>" +
          this.addShiftData.AddShiftTypeName
      );
      console.log(
          "shifNameOptions ==>" + JSON.stringify(this.shiftNameOptions)
      );
      let shifNames = this.shiftNameOptions.filter(
          (rec) => rec.value === this.addShiftData.AddShiftTypeName
      );
      console.log("shifNameOptions ==>" + JSON.stringify(shifNames));
      this.enableTimeRounding = shifNames[0].enableTimeRounding;

      this.splitShift = false;
      
      // PRESERVE EXISTING ROWS IN EDIT MODE
      if (this.isEditShiftScreenFlag) {
          // Edit mode - preserve existing rows, only reset flags
          this.rowShiftTypeEnable = false;
          this.rowShiftTimingsEnable = false;
          this.hourlyRateEditable = false;
          
          // If no rows exist, initialize one
          if (this.AddShiftAndServices.length === 0) {
              this.AddShiftAndServices = [this.initRow()];
          }
      } else {
          // Create mode - reset everything
          this.AddShiftAndServices = [];
          this.rowShiftTypeEnable = false;
          this.rowShiftTimingsEnable = false;
          this.hourlyRateEditable = false;
          this.AddShiftAndServices = [this.initRow()];
      }

      console.log(
          "this.addShiftData.AddShiftStaffValue in creation   ==> " +
          this.addShiftData.AddShiftStaffValue
      );

      let participantLabel = this.participantoptions.find(
          (rec) => rec.value == this.serviceParticipant
      ).label;
      
      // Update participant information for all rows
      if (this.isEditShiftScreenFlag) {
          this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
              ...row,
              participantlabel: participantLabel,
              participant: this.serviceParticipant,
              shiftWithStaffId: this.ShiftwithStafftoApexId
          }));
      } else {
          this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
              ...row,
              participantlabel: participantLabel,
              participant: this.serviceParticipant,
              shiftWithStaffId: null
          }));
      }

      const addressType =
          this.facilityAddressCheckbox == true
              ? "Facility"
              : this.participantAddressCheckBox == true
                  ? "Participant"
                  : "New";

      // Update addressSource for all rows
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

      // Update hourly rate for all rows
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
       this.confirMationMessage(
          "Warning",
          "Updating the staff role may modify the staff list and assigned selections.",
          "Warning"
      );
      
      this.addShiftData.AddShiftStaffValue = this.staffOptions[0].value;
      let staffLabel = this.staffOptions[0].label;
      console.log("staffLabel => ", staffLabel);

      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
        stafflabel: staffLabel,
        staff: this.addShiftData.AddShiftStaffValue,
        filteredstaff: [...this.staffOptions],
         staffPaidBreak :this.staffOptions[0].staffPaidBreak
      }));
    }
    if (
      event.target.name == "AddShiftStartDate" &&
      this.AddShiftRecurringCheckboxValue == true
    ) {
      this.callGetNumberOfRecurrences();
    }
    if (event.target.name == "AddShiftNotes") {
      this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
    }

    if (event.target.name == "AddShiftStaffValue") {
  this.RolesStaffId = this.addShiftData.AddShiftStaffValue;
  
  this.ServiceStaffValue = this.addShiftData.AddShiftStaffValue;
  
  if (this.addShiftData.AddShiftStatus != "Unassigned") {
    this.getFundOptions();
  }

  // Add null check here
  if (this.addShiftData.AddShiftStaffValue) {
    let selectedStaff = this.staffOptions.find(
      (rec) => rec.value === this.addShiftData.AddShiftStaffValue
    );

    if (selectedStaff) {
      const { label, staffPaidBreak } = selectedStaff;

      this.AddShiftAndServices = this.AddShiftAndServices.map((row) => ({
        ...row,
        stafflabel: label,
        staff: this.addShiftData.AddShiftStaffValue,
        staffPaidBreak: staffPaidBreak
      }));
    }
  }

  this.addShiftData.AddShiftStaffHourlyRate = 0;
  this.serviceStaffHourlyRate = 0;
  
 /*  const isOverlapping = await this.getOverLappingdata(
    this.addShiftData.AddShiftStaffValue
  );
  console.log("isOverlapping ==>" + JSON.stringify(isOverlapping));
  if (isOverlapping) {
    return;
  } */

  // Add null check here too
  if (this.addShiftData.AddShiftType === "Custom" && this.addShiftData.AddShiftStaffValue) {
    const { enrichedSegments, updatedServices } = await this.prepareAndValidateCustomShifts();
  }
}

    console.log("addShiftData " + JSON.stringify(this.addShiftData));
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
 async getShiftTimingsByFacility(shifNames) {
    console.log("🚀 getShiftTimingsByFacility STARTED");
    console.log("📋 shifNames:", JSON.stringify(shifNames));
    console.log("👤 AddShiftStaffValue:", this.addShiftData.AddShiftStaffValue);
    console.log("🔄 staffOptions:", JSON.stringify(this.staffOptions));

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
    console.log("⏰ max duration ==>" + shifNames[0].Duration__c);
    this.addshiftMaxDuration = shifNames[0].Duration__c
      ? shifNames[0].Duration__c
      : 0;
    
    this.addShiftData.AddShiftType = shifNames[0].Shift_Type__c;
    console.log("🔧 AddShiftType set to:", this.addShiftData.AddShiftType);
    this.hourlyRateEditable = this.addShiftData.AddShiftType == "Sleepover Shift";
    this.addShiftData.AddShiftStartTime = startTime24
      ? `${startTime24}:00Z`
      : "00:00:00Z";
    this.addShiftData.AddShiftEndTime = endTime24
      ? `${endTime24}:00Z`
      : "00:00:00Z";
    this.addShiftData.AddShiftStartTimeAMPM = startAmPm.displayTime;
    this.addShiftData.AddShiftEndTimeAMPM = endAmPm.displayTime;

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
    
    if (this.addShiftData.AddShiftStaffValue) {
        console.log("💰 Calculating rate for staff:", this.addShiftData.AddShiftStaffValue);
        const rate = this.getServiceStaffHourlyRate(
        this.addShiftData.AddShiftHoliday,
        this.AddShiftDayName,
        this.addShiftData.AddShiftStaffValue,
        this.addShiftData.AddShiftType
        );
        this.addShiftData.AddShiftStaffHourlyRate = rate;
        this.serviceStaffHourlyRate = rate;
        console.log("💵 Rate calculated:", rate);
    }
   
    this.AddShiftAndServices = this.AddShiftAndServices.map((service) => ({
        ...service,
        billablehours: this.getFinalDuration(
          this.addShiftData.AddShiftDuration,
          this.addShiftData.AddShiftBreak == 30 ? 0.5 : 0,
          service.staffPaidBreak
        ),
        breakTime: this.addShiftData.AddShiftBreak
      }));

    console.log("🏠 Checking address type:", shifNames[0].Type_of_Address__c);
   if(shifNames[0].Type_of_Address__c && shifNames[0].Type_of_Address__c=='Facility' ){
      this.shiftAddressInRosterSettings=shifNames[0].Type_of_Address__c;
            this.addNewAddressCheckBox = false;
            this.participantAddressCheckBox = false;
            if (!this.addShiftData.AddShiftFacilityValue) {
              console.log("❌ No facility selected, showing error");
              this.confirMationMessage(
              "Error",
              "Please select " + this.facilityPreferredName,
              "Error"
              );
           
            this.facilityAddressCheckbox = false;
            this.addShiftData.AddShiftParticipantAddressCheckbox = false;
            } else {
              console.log('✅ Facility address selected, fetching address');
            this.facilityAddressCheckbox = true;
            this.addShiftData.AddShiftParticipantAddressCheckbox = false;
            this.addShiftData.AddShiftEnterOtherLocation = false;
            this.fetchFacilityAddressAndGeocode();
            this.isDisableSaveButton = false;
            }
    }else if(shifNames[0].Type_of_Address__c && shifNames[0].Type_of_Address__c=='Participant'){
         console.log("🏠 Participant address selected");
         this.shiftAddressInRosterSettings=shifNames[0].Type_of_Address__c;
            this.facilityAddressCheckbox = false;
            this.addNewAddressCheckBox = false;
            this.participantAddressCheckBox = true;
            this.addShiftData.AddShiftEnterOtherLocation = true;
            this.addShiftData.AddShiftParticipantAddressCheckbox = true;
            this.EmptyAddressFields();
           this.handleParticipantAddressSelection();
    } 

    console.log("🔍 Checking if Custom shift type...");
    if (this.addShiftData.AddShiftType === "Custom") {
        console.log("🎯 CUSTOM SHIFT DETECTED");
        this.addshiftMaxDuration = 0;
        this.rowShiftTypeEnable = true;
        this.rowShiftTimingsEnable = true;
        this.diableGroupShift = true;
        this.disableSplitShift = true;
        this.hourlyRateEditable = true;

        let customShifts = shifNames[0].Custom_Shift_Timings__r || [];
        console.log("📊 Custom shifts found:", customShifts.length);
        let shiftTypeDurationMap = {};
        
        console.log("🔎 Looking for staff in staffOptions...");
        console.log("🔍 Staff Value to find:", this.addShiftData.AddShiftStaffValue);
        console.log("📋 Available staffOptions:", JSON.stringify(this.staffOptions));
        
        let selectedStaff = null;
        let staffLabel = "No Staff Selected";
        let staffPaidBreak = false;

        // Safe staff lookup - handle null case
        if (this.addShiftData.AddShiftStaffValue) {
            selectedStaff = this.staffOptions.find(
                (rec) => rec.value === this.addShiftData.AddShiftStaffValue
            );

            console.log("👤 Selected staff result:", selectedStaff);
            
            if (selectedStaff) {
                console.log("✅ Staff found:", selectedStaff.label);
                staffLabel = selectedStaff.label;
                staffPaidBreak = selectedStaff.staffPaidBreak;
                console.log("📝 Staff label:", staffLabel, "Paid break:", staffPaidBreak);
            } else {
                console.log("⚠️ Staff value exists but not found in staffOptions");
                staffLabel = "Staff Not Found";
                staffPaidBreak = false;
            }
        } else {
            console.log("ℹ️ No staff selected, using default values");
            staffLabel = "No Staff Selected";
            staffPaidBreak = false;
        }

        // Handle custom shifts with edit mode preservation
        if (this.isEditShiftScreenFlag) {
            console.log("✏️ EDIT MODE - Preserving existing rows");
            customShifts.forEach((cs, index) => {
                console.log(`🔄 Processing custom shift ${index + 1}/${customShifts.length}`);
                let startTime24 = this.formatMillisecondsToTime(cs.Start_Time__c);
                let endTime24 = this.formatMillisecondsToTime(cs.End_Time__c);
                let startAmPmObj = this.convertToAmPmObject(startTime24);
                let endAmPmObj = this.convertToAmPmObject(endTime24);

                let row;
                if (index < this.AddShiftAndServices.length) {
                    row = this.AddShiftAndServices[index];
                    console.log(`📝 Using existing row ${index}`);
                } else {
                    row = this.initRow();
                    this.AddShiftAndServices.push(row);
                    console.log(`➕ Created new row ${index}`);
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
                row.participantlabel= this.selectedParticipantLabel,
                row.participant= this.serviceParticipant
            });
        } else {
            console.log("🆕 CREATE MODE - Initializing new rows");
            // Create mode - original logic
            customShifts.forEach((cs, index) => {
                console.log(`🔄 Processing custom shift ${index + 1}/${customShifts.length}`);
                let startTime24 = this.formatMillisecondsToTime(cs.Start_Time__c);
                let endTime24 = this.formatMillisecondsToTime(cs.End_Time__c);
                let startAmPmObj = this.convertToAmPmObject(startTime24);
                let endAmPmObj = this.convertToAmPmObject(endTime24);

                let row;
                if (index === 0 && this.AddShiftAndServices.length > 0) {
                    row = this.AddShiftAndServices[0];
                    console.log("📝 Using first existing row");
                } else {
                    row = this.initRow();
                    this.AddShiftAndServices.push(row);
                    console.log(`➕ Created new row ${index}`);
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
                 row.participantlabel= this.selectedParticipantLabel,
                row.participant= this.serviceParticipant
            });
        }
        
        this.shiftTypeDurations = shiftTypeDurationMap;
        console.log("📊 Shift type durations:", JSON.stringify(this.shiftTypeDurations));
    }
    
    console.log("🔍 Checking staff validation conditions...");
    if (this.addShiftData.AddShiftStaffValue) {
        console.log("✅ Staff value exists, running validations");
        console.log("🔍 Checking for overlapping shifts...");
       /*  const isOverlapping = await this.getOverLappingdata(
            this.addShiftData.AddShiftStaffValue
        );
        console.log("📅 Overlap check result:", isOverlapping);
        if (isOverlapping) {
            console.log("❌ Overlap detected, stopping execution");
            return; // ✅ stop execution if overlapping detected
        }
        
        let avaliableId = null;
        console.log("🔍 Checking shift set hours...");
        const isValid = await this.checkShiftSetHours(
            avaliableId,
            this.addShiftData.AddShiftStaffValue
        );
        console.log("⏰ Shift set hours check result:", isValid);
        if (!isValid) {
            console.log("❌ Shift set hours invalid, stopping execution");
            return; // 🚫 stop execution
        } */
        
        if (this.addShiftData.AddShiftType === "Custom") {
            console.log("🎯 Calling prepareAndValidateCustomShifts...");
            const { enrichedSegments, updatedServices } = await this.prepareAndValidateCustomShifts();
            console.log("✅ prepareAndValidateCustomShifts completed");
            console.log("📊 Enriched Segments:", JSON.stringify(enrichedSegments));
            console.log("📋 Updated Services:", JSON.stringify(updatedServices));
        }
    } else {
        console.log("ℹ️ No staff value, skipping validations");
    }
    
    console.log("🏁 getShiftTimingsByFacility COMPLETED");
}

  // ✅ Utility method: prepares and validates custom shifts
 async prepareAndValidateCustomShifts() {
    console.log("CUSTOM VALIDATION CALLED  => ");
    
    // Move the declaration to the top and fix variable name
    let selectedStaff = this.staffOptions.find(
      (rec) => rec.value === this.addShiftData.AddShiftStaffValue
    );
    console.log("selectedStaff => ", JSON.stringify(selectedStaff));
    
    let staffLabel = selectedStaff ? selectedStaff.label : '';
    console.log("staffLabel => ", staffLabel);
    
    // 1. Build segments array
    let customShiftsArray = this.AddShiftAndServices.map((custom, index) => ({
      shifttype: custom.shifttype,
      starttime: custom.starttime,
      endtime: custom.endtime,
      id: custom.id,
      rateLabel: custom.rateLabel,
      staff: this.addShiftData.AddShiftStaffValue,
      stafflabel: staffLabel,
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

    // 2. Call Apex validation
    const result = await this.validateCustomShifts(customShiftsArray);

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
            return {
              ...service,
              stafflabel: staffLabel,
              staff: this.addShiftData.AddShiftStaffValue,
              hourlyrate: customResult.hourlyrate,
              billablehours: this.getFinalDuration(customResult.duration, customResult.duration >=5 ? 0.5:0, service.staffPaidBreak),
              amount: amount
            };
          }
          return service;
        });
        
        // Add null check for AddShiftAndServices[0]
        if (this.AddShiftAndServices.length > 0) {
          this.formattedLongShifts(enrichedSegments, this.AddShiftAndServices[0].staffPaidBreak);
        }
      } catch (e) {
        console.error("❌ Failed to parse enrichedSegmentsJson", e);
      }
    }

    console.log("📌 Parsed Segments:", JSON.stringify(enrichedSegments));

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
      console.log(" staffId ==>" + staffId);
      if (staffId) {
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
      }
    } catch (error) {
      console.error("Error fetching overlapping data:", error);
      throw error; // rethrow so caller knows it failed
    }
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

   getServiceStaffHourlyRate(isHoliday, dayName, staffId, shiftType) {
  // Get staff data with safe navigation
  const staffData = this.StaffHourlyRates[staffId]?.staffHoulryRate;
  
  if (!staffData) {
    console.log("IN FALLBACK - No staff data found for staffId: " + staffId);
    return 0.0;
  }

  // Get child role (backend already filtered to matching role)
  const childRole = staffData.StaffRoles__r && staffData.StaffRoles__r.length > 0 
    ? staffData.StaffRoles__r[0] 
    : null;
  
  console.log("Staff Data: " + JSON.stringify(staffData));
  console.log("Child Role: " + (childRole ? JSON.stringify(childRole) : "No child role found"));
  console.log("Shift Type: " + shiftType);
  console.log("Day Name: " + dayName);
  console.log("Is Holiday: " + isHoliday);

  let rate = 0;
  this.hourlrRateLabel = "Hourly Rate";
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

  // Public Holiday
  if (isHoliday) {
    this.hourlrRateLabel = "Hourly Rate";
    this.hourlyrateDisable = true;
    rate = childRole?.Public_Holiday_Hourly_Rate__c || staffData.Public_holiday_Hourly_Rate__c || 0;
    console.log("Holiday Rate: " + rate + " (Source: " + (childRole?.Public_Holiday_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
    return parseFloat(rate.toFixed(2));
  }

  switch (dayName) {
    case "Day 6": // Sunday
      this.hourlrRateLabel = "Hourly Rate";
      this.hourlyrateDisable = true;
      rate = childRole?.Sunday_Hourly_Rate__c || staffData.Sunday_Hourly_Rate__c || 0;
      console.log("Sunday Rate: " + rate + " (Source: " + (childRole?.Sunday_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
      return parseFloat(rate.toFixed(2));

    case "Day 5": // Saturday
      this.hourlrRateLabel = "Hourly Rate";
      this.hourlyrateDisable = true;
      rate = childRole?.Saturday_Hourly_Rate__c || staffData.Saturday_Hourly_Rate__c || 0;
      console.log("Saturday Rate: " + rate + " (Source: " + (childRole?.Saturday_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
      return parseFloat(rate.toFixed(2));

    default:
      switch (shiftType) {
        case "General":
        case "Morning":
          this.hourlrRateLabel = "Hourly Rate";
          this.hourlyrateDisable = true;
          rate = childRole?.Hourly_Rate__c || staffData.Working_Hours_Rate__c || 0;
          console.log("Working Hours/Morning Rate: " + rate + " (Source: " + (childRole?.Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));

        case "Night":
          this.hourlrRateLabel = "Hourly Rate";
          this.hourlyrateDisable = true;
          rate = childRole?.Night_Shift_Hourly_Rate__c || staffData.Night_shift_Hourly_Rate__c || 0;
          console.log("Night Shift Rate: " + rate + " (Source: " + (childRole?.Night_Shift_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));

        case "Afternoon":
          this.hourlrRateLabel = "Hourly Rate";
          this.hourlyrateDisable = true;
          rate = childRole?.Afternoon_Shift_Hourly_Rate__c || staffData.Afternoon_shift_Hourly_Rate__c || 0;
          console.log("Afternoon Shift Rate: " + rate + " (Source: " + (childRole?.Afternoon_Shift_Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));

        case "Custom":
          this.hourlrRateLabel = "Hourly Rate";
          this.hourlyrateDisable = true;
          console.log("Custom Shift - Returning 0.0");
          return 0.0;

        default:
          this.hourlrRateLabel = "Hourly Rate";
          this.hourlyrateDisable = true;
          rate = childRole?.Hourly_Rate__c || staffData.Working_Hours_Rate__c || 0;
          console.log("Default Working Hours Rate: " + rate + " (Source: " + (childRole?.Hourly_Rate__c ? "Child Role" : "Parent Staff") + ")");
          return parseFloat(rate.toFixed(2));
      }
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
  @track holidayPopup = false;
  handleRecurEveryChange(event) {
    this.isSingleClassForServiceCreation = false;
    switch (event.target.name) {
      case "recurEvery":
        this.recurEveryValue = event.target.value;
        break;
      case "recurEndDate":
        this.recurEndDate = event.target.value;
        let recurDateParts = this.recurEndDate.split("-");
        this.recurEndDateFormattedDate =
          recurDateParts[2] + "/" + recurDateParts[1] + "/" + recurDateParts[0];
        this.callGetNumberOfRecurrences();
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
        if (
          this.AddShiftRecurringCheckboxValue == true &&
          this.isEditShiftScreenFlag == true &&
          this.isParticipantServiceCreated == true
        ) {
          this.AddShiftIncludePartcipants = false;
          this.RecurringWithIncludeAndNewParticipants = true;
        } else {
          this.isSingleClassForServiceCreation = true;
        }
        break;
      case "includeParticipants":
        this.AddShiftIncludePartcipants = event.target.checked;
        this.includeParticipantEvent = event.target.checked;

        break;
    }

    console.log("recurCheckBox: ", this.AddShiftRecurringCheckboxValue);

    // **Only validate if recurCheckBox is checked**
    if (this.AddShiftRecurringCheckboxValue) {
      setTimeout(() => {
        this.isDisableSaveButton = this.validateRecurringOptions();
      }, 500);

      // Ensure API call only runs when all required values are available
      if (this.RecurValue && this.recurEveryValue && this.recurEndDate) {
        /*   getNumberOfRecurrences({
          typeOfRecur: this.RecurValue,
          recurEvery: this.recurEveryValue,
          endDate: this.recurEndDate,
          shiftDate: this.addShiftData?.AddShiftStartDate,
          weeklyDays: this.selectedDays,
          monthlyDay: this.monthOfDay
        })
          .then((response) => {
            console.log("response: ", JSON.stringify(response));
            if (response.isSuccess) {
              this.recurOccurencesValue = response.NumberOfOccurrences;
              this.isDisableSaveButton = false; // Enable button if API succeeds
            } else {
              this.confirMationMessage(
                "Error",
                response.failureMessage,
                "Error"
              );
              this.isDisableSaveButton = true; // Disable on API failure
            }
            if (this.addShiftData.AddShiftType == "Custom") {
              this.validateCustomShifts(this.rateRows);
            }
          })
          .catch((error) => {
            console.error("Error in getNumberOfRecurrences: ", error);
            this.isDisableSaveButton = true; // Ensure button is disabled on error
          }); */
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

  @track selectedHolidayDates = [];
  @track removeHolidayDate = [];

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
    } */

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
      case "Fortnightly":
        this.RecurLabel = "Day";
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
  }
  async handleAddShiftTimeData(event) {
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
    this.addShiftData.AddShiftBreak = this.getDuration(
      this.addShiftData.AddShiftStartDate,
      this.addShiftData.AddShiftStartTime,
      this.addShiftData.AddShiftEndTime,
      this.addShiftData.AddShiftEndTimeAMPM,
      this.addShiftData.AddShiftType
    ).breakTime;
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
    if (this.addShiftData.AddShiftType != "Custom") {
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

    // console.log('Add shift data:', JSON.stringify(this.addShiftData));
    /* const isOverlapping = await this.getOverLappingdata();
    if (isOverlapping) {
      return; // ✅ stop execution if overlapping detected
    } */
  }
  addressInputChange(event) {
    this.address.street = event.detail.street;
    this.address.citySuburb = event.detail.city;
    this.address.postalcode = event.detail.postalCode;
    this.address.provinceState = event.detail.province;
    this.address.country = event.detail.country;
    this.fetchGeocode();
  }

  fetchGeocode() {
    console.log("this.street >>", this.address.street);
    console.log("this.city >>", this.address.citySuburb);
    console.log("this.postalCode >>", this.address.postalcode);
    const fullAddress = `${this.address.street}, ${this.address.citySuburb} ${this.address.postalcode}, AU`;
    const apiKey = GOOGLE_API_KEY;

    console.log("Fetching geocode for:", fullAddress);

    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        console.log("Geocode API response:", data);

        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          this.address.latitude = location.lat;
          this.address.longitude = location.lng;
          console.log("Parsed coordinates:", location.lat, location.lng);
          this.jsonData2 = [
            {
              coords: {
                latitude: this.address.latitude,
                longitude: this.address.longitude
              }
            }
          ];

          console.log(
            "jsonData prepared for map:",
            JSON.stringify(this.jsonData)
          );

          // ✅ Call your existing function
          this.setLatitudeLongitudeMarkersOnly();
        } else {
          console.warn("No geocode results found or status not OK");
        }
        console.log("  address  " + JSON.stringify(this.address));
      })
      .catch((error) => {
        console.error("Error calling Geocode API:", error);
        // Optional: handle error or fallback logic here
      });
  }

  @track mapMarkersOnly;
  @track jsonData2;

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

    const endParts = endTimeString.split(":");
    let endDate = new Date(
      year,
      month,
      day,
      parseInt(endParts[0], 10),
      parseInt(endParts[1], 10)
    );

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
    const durationInMilliseconds = endDate - startDate;
    const durationInMinutes = durationInMilliseconds / (1000 * 60);

    let hours = (durationInMinutes / 60).toFixed(2); // Calculate hours
    let breakTime = 0;

    if (hours >= 5) {
      breakTime = 30; // Apply 30-minute break
      const breaksInHours = (breakTime / 60).toFixed(2);
    /*   hours -= breaksInHours; */
    }

    // Return the result as a JSON object
    return {
      duration: parseFloat(hours), // Ensure the duration is a number
      breakTime: breakTime
    };
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
  handleDescriptionChange(event) {
    this.checkListDescription = event.target.value;
  }
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
    const rowId = event.target.dataset.id; // Use string id (no parseInt)
    this.ChekListrows = this.ChekListrows.map((row) => {
      if (row.id === rowId) {
        return { ...row, mandatory: event.target.checked };
      }
      return row;
    });
  }
  // Delete a row
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
      console.log("service participnat " + this.serviceParticipant);
      this.facilityAddressCheckbox = false;
      this.addNewAddressCheckBox = false;
      this.participantAddressCheckBox = selectedValue;
      this.addShiftData.AddShiftEnterOtherLocation = true;
      this.addShiftData.AddShiftParticipantAddressCheckbox = true;
      this.isDisableSaveButton = false;
      this.handleParticipantAddressSelection();
    } else {
      // addNewAddressCheckBox selected
      this.addNewAddressCheckBox = selectedValue;
      this.addShiftData.AddShiftEnterOtherLocation = selectedValue;
      this.addShiftData.AddShiftParticipantAddressCheckbox = false;
      this.facilityAddressCheckbox = false;
      this.participantAddressCheckBox = false;
      this.EmptyAddressFields();
    }
  }

  getPartcipantAddress() {
    getClientById({ recordId: this.serviceParticipant })
      .then((result) => {
        const facility = result[0];
        this.address.street = facility.Address__Street__s;
        this.address.citySuburb = facility.Address__City__s;
        if (facility.Address__CountryCode__s == "AU") {
          this.address.country = "Australia";
        }
        this.address.provinceState = facility.Address__StateCode__s;
        this.address.postalcode = facility.Address__PostalCode__s;
        this.fetchGeocode();
        this.isDisableSaveButton = false;
      })
      .catch((error) => {
        this.EmptyAddressFields();
        console.log(" error =>" + JSON.stringify(error));
        this.participantAddressCheckBox = false;
        this.confirMationMessage(
          "Error",
          "Please select " + this.participantPreferredName,
          "Error"
        );
        this.isDisableSaveButton = true;
      });
  }

  getFundOptions() {
    if (this.serviceParticipant) {
      getClientFunds({ clientId: this.serviceParticipant })
        .then((response) => {
          //  console.log('funds '+JSON.stringify(response));
          if (response.length > 0) {
            this.TotalFunds = response;
            this.fundOption = response.map((rec) => {
              return {
                label: rec.Registration_Group__c,
                value: rec.Id,
                Plan_Type__c: rec.Plan_Type__c
              };
            });
            console.log("funds option ==>" + JSON.stringify(this.fundOption));
            if (
              (this.otherThanNdis == true &&
                this.fundOption[0].label.includes("Other")) ||
              (this.otherThanNdis == false &&
                this.fundOption[0].label.includes("Miscellaneous"))
            ) {
              this.ServiceTypeIdInParticipant = this.fundOption[0].value;
              this.servicePlan = this.fundOption[0].Plan_Type__c;
              this.serviceFundSelection();
            }
          } /* else{
            this.confirMationMessage(
                "Warning",
                "Fund is missing or incomplete for the selected shift name. Please update accordingly.",
                "warning"
            );
          } */
        })
        .catch((error) => {});
      this.SplitShiftRows = this.SplitShiftRows.map((row) => {
        this.SplitShiftRowId = row.id;
        row.StaffId = this.ServiceStaffValue;
        row.participant = this.serviceParticipant;
        row.serviceStffaHourlyRate = this.serviceStaffHourlyRate;
        return row;
      });
      console.log("SPlit row Id" + JSON.stringify(this.SplitShiftRowId));
      console.log("Split shift" + JSON.stringify(this.SplitShiftRows));
    }
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


  
 

 
  serviceNdisSelection(selectedId) {
    const selectedRow = this.serviceGroupName.find(
      (row) => row.Id === selectedId
    );
    console.log("Selected row " + JSON.stringify(selectedRow));
    console.log("Selected split shift Id " + this.SplitShiftRowId);
    this.SplitShiftRows = this.SplitShiftRows.map((row) => {
      row.selectedNdisIdValue = selectedRow.Id;
      row.serviceNameValue = selectedRow.Name;
      let state = this.stateValue.split("_");
      row.state = state[0];
      row.StaffId = this.ServiceStaffValue;
      row.serviceStffaHourlyRate = this.serviceStaffHourlyRate;
      row.serviceDate = this.addShiftData.AddShiftStartDate;
      row.participant = this.serviceParticipant;
      row.serviceAmount = selectedRow.amount;
      return row;
    });
    this.isParticipantServiceCreated = true;
    // Update the isSelected property for all rows
    this.serviceGroupName = this.serviceGroupName.map((row) => ({
      ...row,
      isSelected: row.Id === selectedId // Set true for the selected row, false for others
    }));
    if (this.isSplitCheckbox) {
      this.serviceTableAddButton = true;
      this.isDisbaleServiceButton = true;
      this.isSplitCheckbox = true;
    } else {
      this.serviceTableAddButton = false;
      this.isDisbaleServiceButton = false;
    }
    this.isDisableParticipantCheckBox = false;
    this.AddShiftIncludePartcipants = true;
    this.isSingleClassForServiceCreation = true;
    //

    if (
      this.AddShiftRecurringCheckboxValue == true &&
      this.isEditShiftScreenFlag == true
    ) {
      this.AddShiftIncludePartcipants = false;
      this.RecurringWithIncludeAndNewParticipants = true;
    }

    console.log("Selected Row ID:", selectedId);
    console.log(
      "Split shift after selection" + JSON.stringify(this.SplitShiftRows)
    );
  }

  async handleEditShiftScreen(event) {
    event.stopPropagation();
    try{

    
    console.log("shift staff id " + event.currentTarget.dataset.shiftstaffid);
    console.log('service id in edit ==>'+event.currentTarget.dataset.serviceid);
    let serviceId=event.currentTarget.dataset.serviceid;
    this.shiftStaffId = event.currentTarget.dataset.shiftstaffid;
    this.finalSelectedFacilities = [];
    this.isShowMap = false;
    this.geolabel = "Shift Location";

    // console.log(" selected facilities " + JSON.stringify(this.facilityValue));
    // console.log(" ORG facilities " + JSON.stringify(this.facilityOptions));
    this.finalSelectedFacilities = this.facilityOptions;
    this.participantDataflag = false;
    this.openParticipantshiftView = true;
    this.dispatchEvent(new CustomEvent("shiftcreationparticipantview"));
    this.isPublishShift = false;
    this.isEditShiftScreenFlag = true;
    this.AddShiftRecurringCheckboxValue = false;
    this.isOriginalStaffChanged = false;
    this.deletedChecklist = [];
    this.isDisableSaveButton = false;
    this.disableServiceSection = false;
    this.postInsertOperation == false;
    this.isTooltip = false;
    this.isModalOpen = false;
    this.SplitShiftVisible = true;
    this.headingLabel = "Edit Service";
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
    this.rowShiftTypeEnable=false;
    this.rowShiftTimingsEnable=false;
     this.disableNotification=false;
      this.showErrorModal=false;
    this.staffDateConflicts = [];
      this.originalServiceAmounts={};


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
          : result.shiftwithstaffdata.Add_Shift__r.Shift_Name__c
      };

      this.dispalyAmPMFormat();

      this.RolesStaffId = this.addShiftData.AddShiftStaffValue;
        this.enableTimeRounding=result.shiftwithstaffdata.Time_Rounded_Off__c;
        console.log("this.enableTimeRounding ==>" + this.enableTimeRounding);

      this.hourlrRateLabel =
        this.addShiftData.AddShiftType == "Sleepover Shift"
          ? "Allowance"
          : "Hourly Rate";
      console.log("this.hourlrRateLabel 2696>>" + this.hourlrRateLabel);
      this.hourlyrateDisable =
        this.addShiftData.AddShiftType == "Sleepover Shift" ? false : true;
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

      /* console.log(
             "finalAddShiftData  in EDIT ===> " +
             JSON.stringify(this.finalAddShiftData)
         ); */
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
      this.splitShift = result.shiftwithstaffdata.Split_Shifts__c;
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
      if (shiftType == "Custom") {
        this.rowShiftTypeEnable = true;
        this.rowShiftTimingsEnable = true;
         this.hourlyRateEditable=true;
          this.disableSplitShift=true;
        this.diableGroupShift=true;
      }
      const rows = [];
      const shift = result.shiftwithstaffdata;
     this.hourlyRateEditable = this.addShiftData.AddShiftType == "Sleepover Shift";
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
      console.log("service in edit ==> " + JSON.stringify(this.servicesList));
      if (this.addShiftData.AddShiftStatus === "Unassigned") {
        const result = await unAssignedList({
          shiftWithStaffId: this.ShiftwithStafftoApexId
        });
        console.log("👉 unAssignedList result:", JSON.stringify(result));
        this.servicesList = result;
        // Process result here
      }

      // 🔹 Main method
      //  this.AddShiftAndServices = [this.initRow()];
      if (
        shiftType === "Custom" &&
        this.addShiftData.AddShiftStatus != "Unassigned"
      ) {
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
      } else if (
        this.servicesList &&
        this.servicesList.length > 0 &&
        this.addShiftData.AddShiftType != "Custom"
      ) {
        console.log("service ==> " + JSON.stringify(this.servicesList));
        this.isIncludeParticipants = true;

        this.AddShiftAndServices =  await this.buildStandardShiftServices(result,serviceId);
        this.isDisableParticipantCheckBox = false;
        console.log('  adshift services after render ==>'+JSON.stringify(this.AddShiftAndServices));
      } else if (
        this.servicesList &&
        this.servicesList.length > 0 &&
        this.addShiftData.AddShiftType == "Custom" &&
        this.addShiftData.AddShiftStatus === "Unassigned"
      ) {
        console.log(
          " this.addShiftData.AddShiftTypeName ==> " +
            this.addShiftData.AddShiftTypeName
        );
        let shifNames = this.shiftNameOptions.filter(
          (rec) => rec.value === this.addShiftData.AddShiftTypeName
        );

        this.addshiftMaxDuration = 0;
        this.rowShiftTypeEnable = true;
        this.rowShiftTimingsEnable = true;
        this.diableGroupShift = true;
        this.disableSplitShift = true;

        // get custom shift timings
        let customShifts = shifNames[0].Custom_Shift_Timings__r || [];
        let shiftTypeDurationMap = {};

        // ✅ take base service (first one)
        const baseService = this.servicesList[0];
        this.serviceParticipant = baseService.Client__c;

        // set participant label
        let participantLabel = this.participantoptions.find(
          (rec) => rec.value === this.serviceParticipant
        )?.label;
        this.selectedParticipantLabel = participantLabel;

        // ✅ fetch funds once
        const fetchedServiceTypes = await getClientFunds({
          clientId: this.serviceParticipant
        });

        const mappedTypes = fetchedServiceTypes.map((rec) => ({
          label: rec.Registration_Group__c,
          value: rec.Id,
          Plan_Type__c: rec.Plan_Type__c
        }));

        // ✅ fetch catalogue once (if serviceType exists)
        let mappedItems = [];
        if (baseService.Funds_Tracker__c) {
          const catalogueResult = await getCatalogueData({
            serviceType: baseService.Funds_Tracker__c,
            clientId: this.serviceParticipant
          });

          mappedItems = catalogueResult.catalogueData.map((rec) => ({
            label: rec.Support_Item_Name__c,
            value: rec.Id,
            unit: rec[catalogueResult.statesCombined] || 0,
            ...rec
          }));
        }

        // ✅ build rows in a single loop
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

          // ---- Shift-specific values ----
          row.shifttype = cs.Shift_Type__c || "";
          if (cs.Shift_Type__c) {
            if (!shiftTypeDurationMap[cs.Shift_Type__c]) {
              shiftTypeDurationMap[cs.Shift_Type__c] = 0;
            }
            shiftTypeDurationMap[cs.Shift_Type__c] += cs.Duration__c
              ? cs.Duration__c
              : 0;
          }
          row.staff = null;
          row.stafflabel = "Select Staff";
          row.participant = this.serviceParticipant;
          row.participantlabel = participantLabel;
          row.hourlyrate = "";
          row.rateLabel =
            cs.Shift_Type__c === "Sleepover Shift" ? "Allowance" : "Rate";
          row.customshiftlabel = cs.Shift_Type__c;

          this.addshiftMaxDuration += cs.Duration__c ? cs.Duration__c : 0;

          // timings
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
          row.unassignedStatus =
            this.addShiftData.AddShiftStatus === "Unassigned";
          row.unassignedRefId = baseService.ShiftwithStaff__r.RefId__c
            ? baseService.ShiftwithStaff__r.RefId__c
            : null;

          row.serviceId = index == 0 ? baseService.Id : null;
          row.shiftWithStaffId = this.ShiftwithStafftoApexId;

          // ---- Service-related values ----
          row.allservicetypes = [...mappedTypes];
          row.filteredservicetypes = [...mappedTypes];
          row.servicetype = baseService.Funds_Tracker__c;
          row.servicetypelabel =
            baseService.Funds_Tracker__r?.Registration_Group__c ||
            "Select Service Type";

          row.allserviceitems = [...mappedItems];
          row.filteredserviceitems = [...mappedItems];
          row.serviceitem = baseService.Service_Type__c;
          row.serviceitemlabel =
            baseService.Support_Item_Name__c || "Select Service Item";

          row.unitprice = baseService.Edited_Unit_Price__c || 0;
          row.billablehours = baseService.Qty__c || 0;
          row.amount = baseService.Amount__c
            ? baseService.Amount__c.toFixed(2)
            : "0.00";

          // push row if new
          if (!(index === 0 && this.AddShiftAndServices.length > 0)) {
            this.AddShiftAndServices.push(row);
          }
        });

        // save duration map
        this.shiftTypeDurations = shiftTypeDurationMap;

        console.log(
          "this.AddShiftAndServices AFTER CUSTOM SHIFTS ==> ",
          JSON.stringify(this.AddShiftAndServices)
        );
      } else {
        // 🔹 RESULT PASSED HERE TOO
        let row = this.populateRowCommon(this.initRow(), result);
        this.AddShiftAndServices = [row];
        this.isIncludeParticipants = false;
      }
    });
   }catch (error) {
      console.error("❌ Error in buildStandardShiftServices:", error);
   }

  }

  populateRowCommon(row, result) {
    console.log("result in populateRowCommon => ");
    row.staff =
      this.addShiftData.AddShiftStatus === "Unassigned"
        ? null
        : result.shiftwithstaffdata.Staff__c;
    row.stafflabel =
      this.addShiftData.AddShiftStatus === "Unassigned"
        ? "Select Staff"
        : result.shiftwithstaffdata.Staff__r.Display_Nickname__c;
    row.hourlyrate = result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c || 0;
    row.shiftWithStaffId = this.ShiftwithStafftoApexId;

    row.startdate = result.shiftwithstaffdata.Start_Date__c || null;
    row.enddate = result.shiftwithstaffdata.Shift_End_Date__c || null;
    row.address = this.address;
    row.recurring =result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c;
    row.splitShiftRefId=result.shiftwithstaffdata.Split_Shift_RefId__c?result.shiftwithstaffdata.Split_Shift_RefId__c:null;
    row.splitShifts=result.shiftwithstaffdata.New_Split_Shift__c;
     row.role=result.shiftwithstaffdata.Role__c ?result.shiftwithstaffdata.Role__c : result.shiftwithstaffdata.Add_Shift__r.Role__c;

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
           rowBillableHoursChanged:false,
          billablehours: shiftRow.duration,
           rowOnchangeOccured: false,
          rowBillableHoursChanged:false,
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
          this.serviceParticipant= matchingService.Client__c;
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
        row.stafflabel = result.shiftwithstaffdata.Staff__r.Display_Nickname__c;
        //  row.hourlyrate = result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c || 0;
        row.shiftWithStaffId = this.ShiftwithStafftoApexId;
        row.startdate = result.shiftwithstaffdata.Start_Date__c || null;
        row.enddate = result.shiftwithstaffdata.Shift_End_Date__c || null;
        row.address = this.address;
        row.billablehours = shiftRow.duration;
        row.recurring =result.shiftwithstaffdata.Do_you_want_to_set_this_Recurring_Roster__c;
           row.role= result.shiftwithstaffdata.Role__c ?result.shiftwithstaffdata.Role__c : result.shiftwithstaffdata.Add_Shift__r.Role__c

        console.log(`✅ Completed processing shift row ${index + 1}`);
        return row;
      })
    );
  }

 async buildStandardShiftServices(result, serviceId) {
    console.log("🔹 buildStandardShiftServices called");
    console.log("   ServiceId to process:", serviceId);
    console.log("   Result input:", result);

    // Map all services
    const rows = await Promise.all(
        this.servicesList.map(async (service) => {
            try {
                console.log("   🔸 Checking service:", service.Id);

                if (service.Id === serviceId) {
                   // console.log("      ✅ Service matched:", service.Id);

                    // Initialize row
                    let row = this.populateRowCommon(this.initRow(), result);
                 //   console.log("      Row after populateRowCommon:", row);

                    // Set participant info
                    this.serviceParticipant = service.Client__c;
                 //   console.log("      Service participant:", this.serviceParticipant);

                    let participantLabel = this.participantoptions.find(
                        (rec) => rec.value === this.serviceParticipant
                    )?.label;
                    this.selectedParticipantLabel = participantLabel;
                  //  console.log("      Selected participant label:", participantLabel);

                    row.participant = service.Client__c;
                    row.participantlabel = service.Participant_Name__c || "Select Participant";
                    row.serviceId = service.Id;
                    row.refId = service.Id;
                    console.log("      Row after setting participant and service IDs:", row);

                    // Unassigned logic
                    row.unassignedStatus = this.addShiftData.AddShiftStatus === "Unassigned";
                    if (row.unassignedStatus) {
                        row.unassignedRefId = service.ShiftwithStaff__r?.RefId__c || null;
                        console.log("      Row unassignedRefId:", row.unassignedRefId);
                    }

                    // Load service types and items
              //      console.log("      Loading service types and items for row...");
                    await this.loadServiceTypesAndItems(row, service);
                   // console.log("      Service types and items loaded.");

                    // Set financials
                    this.setServiceFinancials(row, service);
                   // console.log("      Financials set for row:", row);

                    return row;
                } else {
                    console.log("      ❌ Service skipped:", service.Id);
                    return null; // ensure a value for Promise.all
                }
            } catch (error) {
                console.error(
                    `      ⚠️ Error processing service ${service.Id}:`,
                    error
                );
                return null; // skip errored service
            }
        })
    );

    // Filter out any null values
    const filteredRows = rows.filter((r) => r !== null);

    console.log("   🔹 Final rows returned:", filteredRows);
    return filteredRows;
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

  showTooltip(event) {
    event.stopPropagation(); // Prevent immediate closing when clicking inside
    /*  console.log('shift time'+event.currentTarget.dataset.shifttime);
        console.log('servcie Id'+event.currentTarget.dataset.id);
        console.log('shift Id'+event.currentTarget.dataset.shiftstaffid);
        console.log('participant id '+event.currentTarget.dataset.participantid);
        console.log( 'staff name'+event.currentTarget.dataset.staffname);
        console.log('service staff image '+event.currentTarget.dataset.servicestaffimage);
 */
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
      serviceid: event.currentTarget.dataset.id,
      servicestaffimage: event.currentTarget.dataset.servicestaffimage,
      participantid: event.currentTarget.dataset.participantid,
      shiftstaffid: event.currentTarget.dataset.shiftstaffid,
      staffname: event.currentTarget.dataset.staffname,
      position: `top: ${mouseY + 10}px; left: ${leftPosition}px;`,
      unassignedservice:
        event.currentTarget.dataset.unassignedservice == "true" ? true : false,
      rolename: event.currentTarget.dataset.rolename,
      uiStatus: event.currentTarget.dataset.status,
      cssUiStatus: event.currentTarget.dataset.cssuistatus
    };
    console.log(
      "Tooltip visible:",
      JSON.stringify(this.shiftTooltipInformation)
    );
  }
  /* async handleShowMoreModal(event) {
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
    console.log("staff id" + event.currentTarget.dataset.participantid);
    console.log("staff id" + event.currentTarget.dataset.weekdate);
    let shiftDate = event.currentTarget.dataset.weekdate;
    console.log("Shift Date " + shiftDate);
    this.moreShiftlist = [];
    getServicesByDate({
      participantId: event.currentTarget.dataset.participantid,
      startDate: shiftDate
    }).then((result) => {
      this.moreShiftlist = result;
      //this.openMoreShiftModal=true;
      this.moreShiftlist = this.moreShiftlist.map((rec) => {
        let uiStatus = "";

        if (rec.Un_Assigned_Service__c == true) {
          uiStatus = "Unassigned";
        }
        if (rec.ShiftwithStaff__r?.Attendence__c == true) {
          uiStatus =
            rec.ShiftwithStaff__r.Status__c === "InProgress"
              ? "In Progress"
              : rec.ShiftwithStaff__r.Status__c;
        }
        console.log("uiStatus " + uiStatus);
          let newInlineStyle = "";
          let facId = rec.ShiftwithStaff__r.Add_Shift__r.Facility__c;
          let shiftId = rec.ShiftwithStaff__r.Add_Shift__r.Shift_Name__c; // ⚠ check this field!
           console.log("ShiftTimeMap", JSON.stringify(this.shiftTimeMap));
          console.log("facId", facId);
          console.log("shiftId", shiftId);
          if (this.shiftTimeMap[facId] && this.shiftTimeMap[facId][shiftId]) {
          newInlineStyle = this.shiftTimeMap[facId][shiftId];
          }
             console.log("newInlineStyle", newInlineStyle);
          return {
          ...rec,
              unassignedService:
                  rec.Un_Assigned_Service__c === true ||
                  rec.Assigned_Service__c === true,
              uiStatus: uiStatus,
              cssUiStatus:
                rec.Un_Assigned_Service__c == true
                ? "Unassigned"
                : rec.ShiftwithStaff__r.Status__c,
              newInlineStyle: newInlineStyle
          };
      });

      console.log("More shift list" + JSON.stringify(this.moreShiftlist));
    });
  } */

  async handleShowMoreModal(event) {
    // ▶ Log that the function has been triggered
    console.log("▶ handleShowMoreModal fired");
    console.log("Clicked element:", event.currentTarget);

    // 🔹 Find the parent <td> element of the clicked button
    //    This is necessary to align the modal with the table cell
    const tdElement = event.currentTarget.closest("td");
    if (!tdElement) {
      console.error("❌ Could not find parent TD element");
      return; // Exit function if no <td> found
    }

    // 🔹 Get the bounding rectangle of the <td> relative to viewport
    //    Returns: {top, left, bottom, right, width, height}
    const tdRect = tdElement.getBoundingClientRect();
    console.log("📐 TD Rect:", JSON.stringify(tdRect));

    // 🔹 Width of <td> (used for setting modal width)
    const tdWidth = tdRect.width;
    console.log("📏 TD Width:", tdWidth);

    // 🔹 Calculate modal height (26% of viewport height)
    const modalHeightVh = 0.26 * window.innerHeight;
    const spacing = 8; // Space between modal and <td>
    const viewportHeight = window.innerHeight;
    console.log("🖥️ Viewport Height:", viewportHeight);
    console.log("📏 Modal Height (vh):", modalHeightVh);

    // 🔹 Get absolute position of <td> (accounting for page scroll)
    const tdTop = tdRect.top + window.scrollY;
    const tdLeft = tdRect.left + window.scrollX;
    console.log("📍 tdTop:", tdTop, "tdLeft:", tdLeft);

    // 🔹 Calculate available space above and below <td>
    const spaceBelow = viewportHeight - tdRect.bottom;
    const spaceAbove = tdRect.top;
    console.log("⬇ Space Below:", spaceBelow, "⬆ Space Above:", spaceAbove);

    // 🔹 Decide vertical placement of the modal
    let topPosition;
    if (spaceBelow >= modalHeightVh + spacing) {
      // Enough space below → place modal below the cell
      console.log("✅ Enough space below, placing modal below");
      topPosition = tdTop + tdRect.height + spacing;
    } else if (spaceAbove >= modalHeightVh + spacing) {
      // Enough space above → place modal above the cell
      console.log("✅ Enough space above, placing modal above");
      topPosition = tdTop - modalHeightVh - spacing;
    } else {
      // Not enough space → fallback below
      console.log("⚠ Not enough space, using fallback (below)");
      topPosition = tdTop + tdRect.height + spacing;
    }

    // 🔹 Build modal style string (fixed positioning)
    this.modalStyle = `position: fixed;
                   top: ${topPosition}px;
                   left: ${tdLeft}px;
                   width: ${tdRect.width}px;
                   height: 26vh;
                   z-index: 1000;`;
    console.log("🎨 Modal Style:", this.modalStyle);

    // 🔹 Open the modal
    this.isModalOpen = true;
    console.log("🟢 Modal Opened");

    // 🔹 Get participant ID and week date from dataset attributes
    console.log("👤 staffId:", event.currentTarget.dataset.participantid);
    console.log("📅 weekDate:", event.currentTarget.dataset.weekdate);

    // 🔹 Store the selected shift date
    let shiftDate = event.currentTarget.dataset.weekdate;
    console.log("🗓️ Shift Date:", shiftDate);

    // 🔹 Clear old shift list before fetching new data
    this.moreShiftlist = [];

    // 🔹 Log Apex call parameters
    console.log("📡 Calling getServicesByDate Apex with:", {
      participantId: event.currentTarget.dataset.participantid,
      startDate: shiftDate
    });

    // 🔹 Call Apex method to fetch shifts for participant on the given date
    getServicesByDate({
      participantId: event.currentTarget.dataset.participantid,
      startDate: shiftDate
    })
      .then((result) => {
        // 🔹 Log the returned result from Apex
        console.log("✅ Apex result received:", JSON.stringify(result));

        // 🔹 Transform each record for UI display
        this.moreShiftlist = result.map((rec, idx) => {
          console.log(`🔄 Processing record [${idx}]`, JSON.stringify(rec));

          // 🔹 Determine UI status text for the shift
          let uiStatus = "";
          if (rec.Un_Assigned_Service__c == true) {
            uiStatus = "Unassigned"; // Shift not assigned
          }
          if (rec.ShiftwithStaff__r?.Attendence__c == true) {
            // If staff attended, show In Progress or actual status
            uiStatus =
              rec.ShiftwithStaff__r.Status__c === "InProgress"
                ? "In Progress"
                : rec.ShiftwithStaff__r.Status__c;
          }
          console.log(`   ▶ uiStatus for record [${idx}]:`, uiStatus);

          // 🔹 Determine inline CSS style based on facility & shift
          let newInlineStyle = "";
          let facId = rec.ShiftwithStaff__r.Add_Shift__r.Facility__c;
          let shiftId = rec.ShiftwithStaff__r.Add_Shift__r.Shift_Name__c;
          console.log(`   ▶ facId: ${facId}, shiftId: ${shiftId}`);
          console.log("   ▶ shiftTimeMap:", JSON.stringify(this.shiftTimeMap));

          if (this.shiftTimeMap[facId] && this.shiftTimeMap[facId][shiftId]) {
            newInlineStyle = this.shiftTimeMap[facId][shiftId];
          }
          console.log(
            `   ▶ newInlineStyle for record [${idx}]:`,
            newInlineStyle
          );

          // 🔹 Construct the transformed record to use in template
          let transformed = {
            ...rec, // Spread original record

            // 🔹 unassignedService will be TRUE if either:
            //    - The record is marked as "Un_Assigned_Service__c"
            //    - OR the record has "Assigned_Service__c"
            //    This is the property used in template:
            //      <template if:true={shift.unassignedService}>
            unassignedService: rec.Un_Assigned_Service__c === true,

            // 🔹 Friendly UI status text
            uiStatus: uiStatus,

            // 🔹 CSS status for styling (Unassigned or actual status)
            cssUiStatus:
              rec.Un_Assigned_Service__c == true
                ? "Unassigned"
                : rec.ShiftwithStaff__r.Status__c,

            // 🔹 Inline style for coloring/shifts
            newInlineStyle: newInlineStyle
          };
          console.log(
            `✅ Final transformed record [${idx}]:`,
            JSON.stringify(transformed)
          );
          return transformed;
        });

        // 🔹 Log the final shift list ready to display in modal
        console.log(
          "📋 Final More shift list:",
          JSON.stringify(this.moreShiftlist)
        );
      })
      .catch((error) => {
        // 🔹 Handle Apex call errors
        console.error("❌ Error in getServicesByDate:", error);
      });
  }

  closeTooltip() {
    this.isTooltip = false;
  }

  // Close tooltip when scrolling
  handleScrollOrClick = () => {
    this.closeTooltip();
  };

  // Close tooltip when clicking outside
  handleOutsideClick = (event) => {
    const tooltip = this.template.querySelector(".tooltip");
    if (tooltip && !tooltip.contains(event.target)) {
      this.closeTooltip();
    }
  };
  handleCloseModal() {
    console.log("Closing Modal...");
    this.participantData = true;
    this.openParticipantshiftView = false;
    // const modal = this.template.querySelector(".custom-modal");

    // if (modal) {
    //   modal.classList.add("closing"); // Start CRT close animation

    //   setTimeout(() => {
    //     modal.classList.add("hidden"); // Hide modal visually but keep in DOM
    // Remove modal from DOM after animation completes
    //     console.log("Modal Closed:", this.isModalOpen);
    //   }, 500); // Matches CSS animation duration
    // }
  }
  handleSearchName(event) {
    console.log("Search Name:", event.target.value);

    if (event.target.value) {
      this.searchName = event.target.value;
    } else {
      this.searchName = ""; // Reset if input is cleared
    }

    // Clear any existing timeout before setting a new one
    // clearTimeout(this.searchTimeout);
    setTimeout(() => {
      // this.isShowSpinner = true;
      this.handleRefresh();
    }, 2000);
  }

  HandleServiceEdit(event) {
    this.isServiceEdit = true;
    this.serviceEditID = event.currentTarget.dataset.id;
    this.ServiceTypeEditvalue = event.currentTarget.dataset.serviceid;
    // console.log('service partcipant '+event.currentTarget.dataset.serviceid)
    console.log("service name" + event.currentTarget.dataset.servicename);
    let servicesName = event.currentTarget.dataset.servicename;
    let ndisCatlogvalue = event.currentTarget.dataset.servicetype;
    this.participantIdInEdit = event.currentTarget.dataset.participantid;
    getClientFunds({ clientId: event.currentTarget.dataset.participantid })
      .then((response) => {
        console.log("funds " + JSON.stringify(response));
        if (response.length > 0) {
          this.serviceEditTotalFund = response;
          this.serviceEditFundOption = response.map((rec) => {
            return { label: rec.Registration_Group__c, value: rec.Id };
          });
          this.NdisServiceGroupNameinEdit = true;
          getCatalogueData({
            serviceType: this.ServiceTypeEditvalue,
            clientId: this.participantIdInEdit
          })
            .then((result) => {
              const catalogueData = result.catalogueData;
              const stateField = result.statesCombined; // e.g., "NSW__c"

              this.ServiceStateEditValue = stateField;

              this.serviceEditGroupName = catalogueData.map((rec) => {
                let amountVal, nameVal;
                const isSelected = rec.Id === ndisCatlogvalue;
                if (
                  this.otherThanNdis === true ||
                  (this.otherThanNdis === false &&
                    result.catalogueData[0].Name.includes("Miscellaneous"))
                ) {
                  // ✅ Pull from junction maps using the record Id
                  amountVal = result.clientJunctionMapAmount[rec.Id] || 0;
                  nameVal =
                    result.clientJunctionMapName[rec.Id] ||
                    rec.Support_Item_Name__c;
                } else {
                  // ✅ Normal case → use state field from catalogue record
                  amountVal = rec[stateField] || 0;
                  nameVal = rec.Support_Item_Name__c;
                }

                return {
                  ...rec,
                  amount: amountVal,
                  Support_Item_Name__c: nameVal,
                  isSelected: isSelected
                };
              });

              console.log(
                "Service Group with Amounts:",
                JSON.stringify(this.serviceEditGroupName)
              );
            })
            .catch((error) => {
              console.error("Error fetching catalogue data:", error);
            });
        } /* else{
          this.confirMationMessage(
                "Warning",
                "Fund is missing or incomplete for the selected shift name. Please update accordingly.",
                "warning"
            );
        } */
      })
      .catch((error) => {});
  }
  handleEditServiceChange(event) {
    let servicesName = event.target.options.find(
      (opt) => opt.value === event.detail.value
    ).label;
    console.log("shift servicesName " + servicesName);
    this.ServiceTypeEditvalue = event.detail.value;
    this.ServiceStateEditValue = "";
    this.NdisServiceGroupNameinEdit = false;
    console.log("this.participantIdInEdit " + this.participantIdInEdit);
    if (this.ServiceTypeEditvalue) {
      this.serviceEditGroupName = [];
      this.NdisServiceGroupNameinEdit = true;
      // Fetch catalogue data
      getCatalogueData({
        serviceType: this.ServiceTypeEditvalue,
        clientId: this.participantIdInEdit
      })
        .then((result) => {
          const catalogueData = result.catalogueData;
          const stateField = result.statesCombined; // e.g., "NSW__c"

          this.ServiceStateEditValue = stateField;

          this.serviceEditGroupName = catalogueData.map((rec) => {
            let amountVal, nameVal;
            const isSelected = rec.Id === ndisCatlogvalue;
            if (
              this.otherThanNdis === true ||
              (this.otherThanNdis === false &&
                result.catalogueData[0].Name.includes("Miscellaneous"))
            ) {
              // ✅ Pull from junction maps using the record Id
              amountVal = result.clientJunctionMapAmount[rec.Id] || 0;
              nameVal =
                result.clientJunctionMapName[rec.Id] ||
                rec.Support_Item_Name__c;
            } else {
              // ✅ Normal case → use state field from catalogue record
              amountVal = rec[stateField] || 0;
              nameVal = rec.Support_Item_Name__c;
            }

            return {
              ...rec,
              amount: amountVal,
              Support_Item_Name__c: nameVal,
              isSelected: isSelected
            };
          });
          console.log(
            "Service Group with Amounts:",
            JSON.stringify(this.serviceEditGroupName)
          );
        })
        .catch((error) => {
          console.error("Error fetching catalogue data:", error);
        });
    }
  }

  HandleEditServicestateChange(event) {
    this.ServiceStateEditValue = event.target.value;
    console.log("state value==>" + this.ServiceStateEditValue);
    this.NdisServiceGroupNameinEdit = true;

    console.log("if==>" + this.ServiceStateEditValue);
    console.log("service type " + JSON.stringify(this.serviceEditGroupName));
    this.serviceEditGroupName = this.serviceEditGroupName.map((item) => {
      const amount = item[this.ServiceStateEditValue]; // Dynamically fetch the state's amount field
      // console.log('amount '+amount);
      if (amount !== undefined) {
        return { ...item, amount }; // Include the state's amount in the filtered row
      }
      return { ...item, amount: 0.0 }; // Add an empty amount for rows without the state's field
    });
    console.log(
      " Service list based on state change " +
        JSON.stringify(this.serviceEditGroupName)
    );
  }
  HandleEditNdisCheckBox(event) {
    const selectedId = event.target.getAttribute("data-id"); // Get the selected row's ID
    const selectedRow = this.serviceEditGroupName.find(
      (row) => row.Id === selectedId
    );
    console.log("Selected row " + JSON.stringify(selectedRow));
    this.ServiceEditNdisValue = selectedRow.Id;
    // Update the isSelected property for all rows
    this.serviceEditGroupName = this.serviceEditGroupName.map((row) => ({
      ...row,
      isSelected: row.Id === selectedId // Set true for the selected row, false for others
    }));

    console.log("Selected Row ID:", selectedId);
  }
  handleHideServiceModal() {
    this.isServiceEdit = false;
    this.NdisServiceGroupNameinEdit = false;
    this.serviceEditGroupName = [];
    this.ServiceStateEditValue = "";
  }
  handleServiceEditSubmit(event) {
    event.preventDefault(); // stop the form from submitting
    const fields = event.detail.fields;
    // console.log('After fields>>'+this.ServiceTypeEditvalue);

    fields.Funds_Tracker__c = this.ServiceTypeEditvalue;
    fields.Service_Type__c = this.ServiceEditNdisValue;
    console.log("After fields>>" + JSON.stringify(fields));
    const selectedRow = this.serviceEditGroupName.find(
      (row) => row.isSelected === true
    );

    if (selectedRow) {
      fields.Edited_Unit_Price__c = selectedRow.amount; // ✅ save amount to backend
    }

    this.template
      .querySelector('lightning-record-edit-form[data-recid="serviceEdit"]')
      .submit(fields);
  }
  handleServiceEditSuccess(event) {
    this.isServiceEdit = false;
    console.log("After Success " + JSON.stringify(event.detail));
    // this.template.querySelector('lightning-record-edit-form').reset()
    this.confirMationMessage(
      "Success",
      "Services updated successfully",
      "Success"
    );
    refreshApex(this.wiredServicesResult);
    this.NdisServiceGroupNameinEdit = false;
    this.ServiceStateEditValue = "";
  }

  handleDeleteService(event) {
    this.isShowSpinner = true;
    // let serviceId=event.currentTarget.dataset.id;
    deleteRecord(this.participantServiceDeleteInfo.serviceId).then(() => {
      this.confirMationMessage(
        "Success",
        "Service for " +
          this.participantServiceDeleteInfo.partcipantName +
          " deleted successfully.",
        "Success"
      );
      refreshApex(this.wiredServicesResult).then(() => {
        console.log(" service data is refrshed ");
        if (this.servicesList.length > 0) {
        } else {
          console.log(" else in service length after delete");
          console.log(
            " if in service length after delete" + this.servicesList.length
          );
          if (this.participantAddressCheckBox == true) {
            this.facilityAddressCheckbox = true;
            this.participantAddressCheckBox = false;
            this.addNewAddressCheckBox = false;
            this.addShiftData.AddShiftParticipantAddressCheckbox = false;
            this.addShiftData.AddShiftEnterOtherLocation = false;

            this.isDisableSaveButton = false;
            this.getFacilityAddress();
            this.handleCreateShift();
          }
          this.isShowSpinner = false;
        }
      });
      this.ServiceWarningMessage = false;
      this.isShowSpinner = false;
      this.handleRefresh();
    });
  }

/*   handleDeleteConfirmation(event) {
    this.ServiceWarningMessage = true;
    this.participantServiceDeleteInfo = {};
    this.participantServiceDeleteInfo.partcipantName =  event.currentTarget.dataset.participantname;
    this.participantServiceDeleteInfo.serviceId =  event.currentTarget.dataset.id;
    this.participantServiceDeleteInfo.serviceName =event.currentTarget.dataset.servicename;
  } */
  closeWarningMessage() {
    this.ServiceWarningMessage = false;
    this.shiftDeleteConfirmation = false;
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
    this.isShowMap = !this.isShowMap;

    if (this.isShowMap) {
      getJSONdata({
        shiftid: this.shiftStaffId,
        shiftstatus: this.addShiftData.AddShiftStatus,
        sdate: this.addShiftData.AddShiftStartDate
      })
        .then((result) => {
          this.jsonData = JSON.parse(result);
          //console.log("JSON Data : " + JSON.stringify(this.jsonData));

          this.setLatitudeLongitudeData();
        })
        .catch((error) => {
          console.error("Error loading JSON:", error);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error",
              message: "No data found .",
              variant: "Error"
            })
          );
        });
      this.geolabel = "Staff Tracking";
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
  handleFinalAllocate() {
    this.fatigueManagementFlag = false;
  }
  handleDeselectStaff() {
    //   this.isCalenderShiftView=false;
    this.openParticipantshiftView = false;
    this.fatigueManagementFlag = false;
  }
  handleRiskNavigation(event) {
    const participantId = event.currentTarget.dataset.participantid;
     const typeOfService = event.currentTarget.dataset.typeofservice;
    //console.log("typeOfService", typeOfService);
    // const isNdis = typeOfService === "NDIS";
    let isNdis;
    if(typeOfService === "NDIS") {
      isNdis= true;
    } else {
      isNdis= false;
    }
  
    //console.log("participantId " + participantId);
    //console.log("isNdis", isNdis);
    const editEvent = new CustomEvent("risknavigation", {
      detail: { participantId: participantId, naviagte: "riskmanagement" , ndisFlag: isNdis},
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(editEvent);
  }
  

  /* Auto Schedule Started*/

  handleCloseautoSchedule() {
    this.autoschdulePopup = false;
    this.isautoschedulepopup == "";
    //this.participantData = true;
    // this.loadParticipantData();
    this.handleRefresh();
  }

  draggedIndex;

  handleDragStart(event) {
    this.draggedIndex = +event.currentTarget.dataset.index;
  }

  handleDragOver(event) {
    event.preventDefault();
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

    console.log("auto schedule row (after): " + JSON.stringify(this.rows));
    this.isShowSpinner = true;
    assignShifts({
      startDate: this.startDate,
      endDate: this.endDate,
      AutoScheduleParameters: JSON.stringify(this.rows),
      facList: this.facIdlist
    })
      .then((result) => {
        console.log("Result  ==>", JSON.stringify(result));
        this.confirMationMessage(
          "Success",
          "Shifts assigned successfully.",
          "Success"
        );
        this.handleRefresh();
        this.autoschdulePopup = false;
        this.isShowSpinner = false;
      })
      .catch((error) => {
        console.error("Error updating shift:", error);
        this.confirMationMessage(
          "Error",
          "Error occured while assigning shifts.",
          "Error"
        );
        this.autoschdulePopup = false;
        this.isShowSpinner = false;
      });
  }
  handlePublishClose() {
    this.publishTempalte = false;
    this.publishEndDate = "";
    this.publishStartDate = "";
  }
  handleFinalPublish() {
    console.log("facIdlist " + JSON.stringify(this.facIdlist));
    console.log("orgId " + this.orgId);

    publishShifts({
      startDate: this.publishStartDate,
      endDate: this.publishEndDate,
      facList: this.facIdlist,
      orgId: this.orgId
    })
      .then(() => {
        this.confirMationMessage(
          "Success",
          "Shifts published successfully.",
          "Success"
        );
        this.handleRefresh();
        getPublishData({
          startDate: this.publishStartDate,
          endDate: this.publishEndDate,
          facList: this.facIdlist,
          orgId: this.orgId
        })
          .then((result) => {
            console.log(
              "âœ… Retrieved published shift data:",
              JSON.stringify(result)
            );
            this.shiftPublishStatus = "";

            if (!result || result.length === 0) {
              this.shiftPublishStatus = "";
            } else {
              const autoShifts = result.filter(
                (shift) => shift.Is_Auto_Schedule_Shift__c === true
              );

              if (
                autoShifts.some(
                  (shift) => shift.Is_Published_Shifts__c === false
                )
              ) {
                // Priority: if any auto-scheduled shift is unpublished → Unpublished
                this.shiftPublishStatus = "Unpublished";
                this.statusIcon = "light_off";
              } else if (
                autoShifts.length > 0 &&
                autoShifts.every(
                  (shift) => shift.Is_Published_Shifts__c === true
                )
              ) {
                // If all auto-scheduled shifts are published → Published
                this.shiftPublishStatus = "Published";
                this.statusIcon = "lightbulb";
              } else {
                // If there are no auto-scheduled shifts → empty
                this.shiftPublishStatus = "";
              }
            }

            console.log("ðŸ” Overall Status:", this.shiftPublishStatus);

            // ðŸ”¼ Notify parent (optional)
            this.dispatchEvent(
              new CustomEvent("publishstatuschange", {
                detail: this.shiftPublishStatus
              })
            );
          })
          .catch((error) => {
            console.error("âŒ Error retrieving shifts:", error);
            this.shiftPublishStatus = "";
            this.dispatchEvent(
              new CustomEvent("publishstatuschange", {
                detail: ""
              })
            );
          });
        this.publishTempalte = false;
        this.isShowSpinner = false;
      })
      .catch((error) => {
        console.error("Error updating shift:", error);
        this.confirMationMessage(
          "Error",
          "Error Occured While Publishing Shifts",
          "Error"
        );
        this.publishTempalte = false;
        this.isShowSpinner = false;
      });
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
     /*  const isOverlapping = await this.getOverLappingdata(firstStaffId);
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
      } */
    }

    if (this.addShiftData.AddShiftType === "Custom") {
      const result = await this.prepareAndValidateCustomShifts();
      console.log("✅ Raw Result: in custom ==>", JSON.stringify(result));
    }
     let staffRows=this.prepareStaffRows()
    const payload = {
      addShiftData: this.finalAddShiftData,
      staffRows:staffRows ,
      isSplitShift: this.splitShift,
      isGroupShift: this.groupShift,
      isCustomShift: this.customShift,
      isRecurringShift: this.AddShiftRecurringCheckboxValue,
      includeParticipants: true,
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
        const staffIds = staffRows.map(staff => staff.staffId);
     
         const result = await validateStaffAvailabilityWithReasons({
               staffIds: staffIds,
               inputDates: recurrenceDates,
               startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
               endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
               isAvailability: 'Yes',
               isEditMode: this.isEditShiftScreenFlag,
               currentShiftId: this.ShiftwithStafftoApexId,
               currentAvailabilityId:null
           });
           console.log('validateStaffAvailability  result==> '+JSON.stringify(result));
           const isOverlapping=  this.handleNonRecurringValidation(result);
                 if (!isOverlapping) {
                 this.isShowSpinner = false;
                 return;
           }
       createShift({
         jsonPayload: JSON.stringify(payload),
         recurrenceDates: recurrenceDates,
          staffDateConflictsJson:JSON.stringify(this.staffDateConflicts)
       })
         .then((result) => {
                this.postSuccessOperation(result);
         })
         .catch((error) => {
           console.error("❌ Error:", JSON.stringify(error));
           this.isShowSpinner = false;
         });
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
     hanleRecurShiftsCreation(){
       
            const recurrenceDates =
         this.AddShiftRecurringCheckboxValue == true
           ? this.recurrenceDatesList
           : [this.finalAddShiftData.shiftDetails.AddShiftStartDate];
       console.log(
         " recurrence date list " + JSON.stringify(this.recurrenceDatesList)
       );
         
         let staffRows=this.prepareStaffRows()
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
         };
        console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));
          console.log("🚀 this.staffDateConflicts:", JSON.stringify(this.staffDateConflicts)); 
        this.isShowSpinner = true;
        this.showErrorModal = false;
      createShift({
         jsonPayload: JSON.stringify(payload),
         recurrenceDates: recurrenceDates,
          staffDateConflictsJson:JSON.stringify(this.staffDateConflicts)
       })
         .then((result) => {
             this.postSuccessOperation(result);
             this.closeErrorModal();
         })
         .catch((error) => {
           console.error("❌ Error:", JSON.stringify(error));
           this.isShowSpinner = false;
         });
   }
   
   closeErrorModal() {
           // Close the modal
           this.showErrorModal = false;
           // Clear the errors
          this.staffDateConflicts = [];
       }

  postSuccessOperation(result){
          let parts = result.split("shifts ==>"); 
        let message = parts[0].trim();
        let shiftsJson = parts[1] ? JSON.parse(parts[1]) : [];

        console.log("✅ Message:", message);
        console.log("✅ First shift:", shiftsJson[0]);
        this.openParticipantshiftView = false;
        this.participantDataflag = true;
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
                              groupShift:true,
                            endDate: this.addShiftData.AddShiftEndDate,
                            shiftType:this.addShiftData.AddShiftType,
                            startTime:this.addShiftData.AddShiftStartTime,
                            endTime: this.addShiftData.AddShiftEndTime,
                            address:this.formattedAddress,
                            latitude:this.address.latitude,
                            longitude:this.address.longitude
                              
                 }).then((response) => {});
            }  else {
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

        this.handleRefresh();
        this.dispatchEvent(new CustomEvent("backparticipantview"));
        // Group Shift
        if (this.groupShift) {
          const message = this.isEditShiftScreenFlag
            ? "Group shifts have been updated successfully."
            : "Group shifts have been successfully added.";
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
  
    sendShiftEmails(emailPayload).then((response) => {
      // Optional: handle response
    });
  }

  // ✅ Group staff + services before sending to Apex
  // ✅ Group staff + services before sending to Apex
  prepareStaffRows() {
    console.log("splitShift value:", this.splitShift);
    console.log("groupShift value:", this.groupShift);

    let staffRows;

    if (this.splitShift) {
      console.log("Processing SPLIT shift case");
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
          address:
                 row.address &&
                      Object.values(row.address).some(v => v && v.toString().trim() !== "")
                  ? row.address : this.address,
          shiftWithStaffId: row.shiftWithStaffId,
          refId: row.refId,
          addressSource: row.addressSource,

          participantId: row.participant,
          participantLabel: row.participantlabel,
          hourlyRate: row.hourlyrate,
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
      console.log("this.ChekListrows==> " + JSON.stringify(this.ChekListrows));

      const reducedResult = this.AddShiftAndServices.reduce((acc, row) => {
        console.log("Processing row with staff:", row.staff);
        const key = row.staff;

        if (!acc[key]) {
          console.log("Creating new staff entry for:", key);
          acc[key] = {
            staffId: row.staff,
            staffLabel: row.stafflabel,
            role: this.finalAddShiftData.shiftDetails.AddShiftRole,
            shifttype: this.finalAddShiftData.shiftDetails.AddShiftType,
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
            shiftnames: this.finalAddShiftData.shiftDetails.AddShiftTypeName,
            unassignedStatus: row.unassignedStatus,
            unassignedRefId: row.unassignedRefId,
            recurring :row.recurring==false?this.AddShiftRecurringCheckboxValue :row.recurring, 
            address:
                 row.address &&
                      Object.values(row.address).some(v => v && v.toString().trim() !== "")
                  ? row.address : this.address,
            shiftWithStaffId: row.shiftWithStaffId,
            duration:  this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"? this.finalAddShiftData.shiftDetails.AddShiftDuration:  row.billablehours,
            breakTime: row.breakTime,
            hourlyRate:
              this.finalAddShiftData.shiftDetails.AddShiftType == "Custom"
                ? 0
                : row.hourlyrate,
            refId: row.refId,
            addressSource: row.addressSource,
            participants: [],
            services: [],

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

  // Add this method if it doesn't exist
  generateShiftStaffRefId(staffId, startDate) {
    const baseRefId = new Date().getTime().toString();
    return staffId + "_" + startDate + "_" + baseRefId;
  }

  dispalyAmPMFormat() {
  console.log("dispalyAmPMFormat() called");
  console.log("Shift Data:", this.addShiftData);

  if (this.addShiftData.AddShiftStartTimeAMPM) {
  //  console.log("Parsing Start Time:", this.addShiftData.AddShiftStartTimeAMPM);

    let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(" ");
  //  console.log("Start Time split -> time:", time, "period:", period);

    let [startHour, startMinute] = time.split(":");
 //   console.log("Start Time further split -> hour:", startHour, "minute:", startMinute);

    this.startTimeSelectedHour = startHour;
    this.startTimeSelectedMinute = startMinute;
    this.startTimeAMPM = period == "AM" ? "AM" : "PM";

    
  }

  if (this.addShiftData.AddShiftEndTimeAMPM) {
   // console.log("Parsing End Time:", this.addShiftData.AddShiftEndTimeAMPM);

    let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(" ");
  //  console.log("End Time split -> time:", time, "period:", period);

    let [endHour, endMinute] = time.split(":");
   // console.log("End Time further split -> hour:", endHour, "minute:", endMinute);

    this.endTimeSelectedHour = endHour;
    this.endTimeSelectedMinute = endMinute;
    this.endTimeAMPM = period == "AM" ? "AM" : "PM";

    /* console.log("Final End Time Values ->", {
      hour: this.endTimeSelectedHour,
      minute: this.endTimeSelectedMinute,
      ampm: this.endTimeAMPM
    }); */
  }
}


  getTdClass(dayShift) {
    return dayShift.isSizeZeroFlag
      ? "slds-text-align_center"
      : "slds-text-align_center styled-td";
  }
  handlePublishDateChange(event) {
    const field = event.target.name;
    const val = event.target.value;
    console.log(`ðŸ“… Date changed - ${field}: ${val}`);

    if (field === "start") {
      this.publishStartDate = val;
    } else if (field === "end") {
      this.publishEndDate = val;
    }

    this.evaluatePublishEnable();
  }

  handlePublishCheckboxChange(event) {
    this.isCheckboxChecked = event.target.checked;
    console.log("âœ… Checkbox checked:", this.isCheckboxChecked);
    this.evaluatePublishEnable();
  }

  evaluatePublishEnable() {
    console.log("ðŸ”Ž Evaluating Publish Button State...");
    console.log("âž¡ï¸ Start Date:", this.publishStartDate);
    console.log("âž¡ï¸ End Date:", this.publishEndDate);
    console.log("âž¡ï¸ Checkbox:", this.isCheckboxChecked);

    const isValidDates =
      this.publishStartDate &&
      this.publishEndDate &&
      new Date(this.publishEndDate) > new Date(this.publishStartDate);

    this.isPublishDisable = !(isValidDates && this.isCheckboxChecked);
    console.log("ðŸš¦ Submit button disabled:", this.isPublishDisable);
  }

  get getIconContainerClass() {
    return this.isExpandedView
      ? "icon-container icon-expanded"
      : "icon-container";
  }
  get getIconItemClass() {
    return this.isExpandedView ? "icon-item expanded-font" : "icon-item";
  }

  get expandedShiftClass() {
    return this.isExpandedView
      ? "expanded-two-shift expanded-two-shift-expanded"
      : "expanded-two-shift";
  }

  expandedServiceId = null;

  handleParticipantServiceClick(event) {
    event.stopPropagation();
    event.preventDefault();

    const clickedServiceId = event.currentTarget.dataset.serviceid;
    const participantId = event.currentTarget.dataset.participantid;
    const clickedDay = event.currentTarget.dataset.day;

    console.log(
      "🔵 Service clicked → ID:",
      clickedServiceId,
      ", Participant ID:",
      participantId,
      ", Day:",
      clickedDay
    );

    // Deep clone for reactivity
    let clonedData = JSON.parse(JSON.stringify(this.participantData));

    clonedData.Participnat = clonedData.Participnat.map((participant) => {
      if (participant.participantId !== participantId) return participant;

      return {
        ...participant,
        servicesByDay: participant.servicesByDay.map((day) => {
          const isTargetDay = day.Shiftdate === clickedDay;

          const updatedServices = (day.services || []).map((service) => {
            const isHovered = isTargetDay && service.Id === clickedServiceId;
            return {
              ...service,
              isHovered,
              hideIfNotHovered: isTargetDay && !isHovered
            };
          });

          const hasHovered = updatedServices.some((s) => s.isHovered);

          if (isTargetDay) {
            console.log(
              `🟦 Target Day Found → ${clickedDay}, Hovered ID: ${clickedServiceId}`
            );
          }

          return {
            ...day,
            services: updatedServices,
            hasHovered: isTargetDay ? hasHovered : false
          };
        })
      };
    });

    this.participantData = clonedData;

    console.log(
      "✅ Participant data updated with isHovered + hasHovered flags"
    );
  }
  

  handleCollapseServiceCard(event) {
    event.stopPropagation();
    event.preventDefault();

    const serviceId = event.currentTarget.dataset.serviceid;
    const participantId = event.currentTarget.dataset.participantid;
    const shiftDate = event.currentTarget.dataset.day;

    console.log(
      "🔙 Collapse requested → Service ID:",
      serviceId,
      ", Participant ID:",
      participantId,
      ", Day:",
      shiftDate
    );

    // Deep clone for safety
    let clonedData = JSON.parse(JSON.stringify(this.participantData));

    clonedData.Participnat = clonedData.Participnat.map((participant) => {
      if (participant.participantId !== participantId) return participant;

      return {
        ...participant,
        servicesByDay: participant.servicesByDay.map((day) => {
          if (day.Shiftdate !== shiftDate) return day;

          return {
            ...day,
            hasHovered: false, // 👈 Reset this to show all cards
            services: (day.services || []).map((service) => ({
              ...service,
              isHovered: false,
              hideIfNotHovered: false
            }))
          };
        })
      };
    });

    this.participantData = clonedData;
  }
  async processShifts(facilityId) {
    try {
      const data = await this.fetchShiftData(facilityId);
      // console.log("Fetched Shift TYPE Records: ", JSON.stringify(data));
      this.shiftNameOptions = data.map((option) => ({
        ...option,
        label: option.Name,
        value: option.Id,
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

      /* console.log(
        "Fetched Shift TYPE Records: ",
        JSON.stringify(this.shiftNameOptions)
      ); */
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

  servicetypeoptions = [];
  customShiftTimings = [];

  handleDocumentClickDropdown(event) {
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
       duration:0,
      breakTime:0,


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
       staffPaidBreak:false
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
          this.pendingStaffName = previousRow.stafflabel;
          this.pendingRowIndex = previousRowIndex;
          return;
        }
      }

     /*  const isOverlapping = await this.getOverLappingdata(previousRow.staff);
      if (isOverlapping) {
        return;
      } */

    /*   const isValid = await this.checkShiftSetHours(null, previousRow.staff);
      if (!isValid) {
        this.confirMationMessage(
          "Error",
          "Set hours limit exceeded for the staff member.",
          "Error"
        );
        return;
      } */

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
    }

    // Add new row first
    this.AddShiftAndServices = [...this.AddShiftAndServices, this.initRow()];

    // 🔧 FIX: Only fetch service types if serviceParticipant exists
    if (this.serviceParticipant) {
      try {
        const response = await getClientFunds({
          clientId: this.serviceParticipant
        });
        if (response) {
          const fetchedServiceTypes = response.map((rec) => ({
            label: rec.Registration_Group__c,
            value: rec.Id,
            Plan_Type__c: rec.Plan_Type__c
          }));

          this.servicetypeoptions = [...fetchedServiceTypes];
        }
      } catch (error) {
        console.error("Error fetching service types:", error);
        // Continue with existing service type options even if API fails
      }
    }

    // Update only the latest (last) row
    const lastIndex = this.AddShiftAndServices.length - 1;
    let lastRow = {
      ...this.AddShiftAndServices[lastIndex],
      allservicetypes: [...this.servicetypeoptions],
      filteredservicetypes: [...this.servicetypeoptions],
      participantlabel: this.selectedParticipantLabel,
      participant: this.serviceParticipant
    };

    // Replace the last row in the array
    this.AddShiftAndServices = [
      ...this.AddShiftAndServices.slice(0, lastIndex),
      lastRow
    ];

    // Existing logic for splitShift OR Custom...
    if (this.addShiftData.AddShiftType === "Custom") {
      const staffLabel = this.AddShiftAndServices[0].stafflabel;
      console.log("staffLabel => ", staffLabel);

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
               if(this.shiftAddressInRosterSettings !='' && this.shiftAddressInRosterSettings != null && this.shiftAddressInRosterSettings != undefined ){
                   this.handleParticipantAddressSelection();
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
          console.log("🔄 SERVICE TYPE FIELD CHANGED");
          console.log("📝 Field:", field);
          console.log("🎯 Value:", value);
          console.log("👤 Participant ID:", updatedRow.participant);
          console.log("📊 Current row data:", JSON.stringify(updatedRow));
          
          updatedRow.servicetype = value;
          
          try {
              console.log("🚀 Calling getCatalogueData API...");
              console.log("📋 Parameters - serviceType:", value, "clientId:", updatedRow.participant);
              
              const result = await getCatalogueData({
                  serviceType: value,
                  clientId: updatedRow.participant
              });

              console.log("✅ getCatalogueData API SUCCESS");
              console.log("📦 Raw API result:", JSON.stringify(result));
              
              const catalogueData = result.catalogueData;
              const stateField = result.statesCombined;
              this.stateValue = stateField;

              console.log("📋 Catalogue data received:", catalogueData ? catalogueData.length : 0, "items");
              console.log("🏛️ State field:", stateField);
              console.log("🔍 Other than NDIS flag:", this.otherThanNdis);

              this.serviceGroupName = catalogueData.map((rec, index) => {
                  console.log(`📊 Processing catalogue item ${index + 1}/${catalogueData.length}`);
                  console.log("📝 Item details:", JSON.stringify(rec));
                  
                  let amountVal, nameVal;

                  if (
                      this.otherThanNdis === true ||
                      (this.otherThanNdis === false &&
                          result.catalogueData[0].Name.includes("Miscellaneous"))
                  ) {
                      console.log("💰 Using client junction map pricing");
                      amountVal = result.clientJunctionMapAmount[rec.Id] || 0;
                      nameVal =
                          result.clientJunctionMapName[rec.Id] ||
                          rec.Support_Item_Name__c;
                          
                      console.log("🔍 Client junction amount:", amountVal);
                      console.log("🏷️ Client junction name:", nameVal);
                  } else {
                      console.log("💰 Using state field pricing");
                      amountVal = rec[stateField] || 0;
                      nameVal = rec.Support_Item_Name__c;
                      
                      console.log("🔍 State field amount:", amountVal);
                      console.log("🏷️ Support item name:", nameVal);
                  }
                  const processedItem = {
                      ...rec,
                      label: nameVal,
                      value: rec.Id,
                      unit: amountVal
                  };
                  
                  console.log(`✅ Processed item ${index + 1}:`, JSON.stringify(processedItem));
                  return processedItem;
              });

              console.log("📋 Final serviceGroupName:", JSON.stringify(this.serviceGroupName));
              console.log("🔄 Updating row with new service items...");
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

              console.log("✅ Row updated successfully");
              console.log("📊 Updated row data:", JSON.stringify(updatedRow));
              console.log("📦 All service items count:", updatedRow.allserviceitems.length);
              console.log("🔍 Filtered service items count:", updatedRow.filteredserviceitems.length);

          } catch (error) {
              console.error("❌ ERROR fetching catalogue data:", error);
              console.error("🔍 Error details:", {
                  message: error.message,
                  stack: error.stack,
                  serviceType: value,
                  clientId: updatedRow.participant
              });
              
              // Fallback: set empty arrays if API fails
              updatedRow = {
                  ...updatedRow,
                  allserviceitems: [],
                  filteredserviceitems: [],
                  serviceitem: null,
                  serviceitemlabel: "Select Service Item",
                  unitprice: 0,
                  amount: "0.00",
                  isservicetypedisabled: false
              };
              
              console.log("🔄 Fallback: Setting empty service items due to error");
          }
          
          console.log("🏁 SERVICE TYPE PROCESSING COMPLETED");
      } else if (field === "staff") {
            updatedRow.staff = value;
            const rate = this.getServiceStaffHourlyRate(
              this.addShiftData.AddShiftHoliday,
              this.AddShiftDayName,
              updatedRow.staff,
              this.addShiftData.AddShiftType
            );
            updatedRow.hourlyrate = rate;
            updatedRow.staffPaidBreak=this.staffOptions.find(rec=>rec.value==value).staffPaidBreak;
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
    console.log(' shift status ==> '+this.addShiftData.AddShiftStatus)

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
           this.handleRefresh();
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
    console.log("=== handleGroupShiftTimeChange START ===");

    const index = parseInt(event.target.dataset.index, 10);
    console.log("Index of changed row:", index);

    const field = event.target.dataset.field;
    console.log("Field being updated:", field);

    const ampm = event.target.dataset.amapm;
    console.log("AM/PM field being updated:", ampm);

    const childData = event.detail;
    console.log("Child data received from event:", JSON.stringify(childData));

    console.log(
      "Before updating AddShiftAndServices:",
      JSON.stringify(this.AddShiftAndServices)
    );

    // Update the changed field
    this.AddShiftAndServices = this.AddShiftAndServices.map((row, i) => {
      console.log(`\nProcessing row index ${i}:`, JSON.stringify(row));

      // Update the time field if it's the edited row
      if (i === index) {
        console.log("This row is being updated");
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
      console.log("Formatted start time object:", formatStartTimes);

      const formatEndTimes = row.endtime
        ? this.convertToAmPmObject(row.endtime)
        : null;
      console.log("Formatted end time object:", formatEndTimes);

      const updatedRow = {
        ...row,
        startTimeSelectedHour: formatStartTimes?.selectedHour || null,
        startTimeSelectedMinute: formatStartTimes?.selectedMinute || null,
        startTimeSelectedAmPm: formatStartTimes.selectedAmPm.toUpperCase() ,
        startTimeDisplayTime: formatStartTimes?.displayTime || "Select Time",

        endTimeSelectedHour: formatEndTimes?.selectedHour || null,
        endTimeSelectedMinute: formatEndTimes?.selectedMinute || null,
        endTimeSelectedAmPm:  formatEndTimes.selectedAmPm.toUpperCase(),
        endTimeDisplayTime: formatEndTimes?.displayTime || "Select Time",

        shifttype:
          this.addShiftData.AddShiftType == "Custom"
            ? row.shifttype
            : this.addShiftData.AddShiftType
      };

      console.log("Row after mapping all fields:", JSON.stringify(updatedRow));
      return updatedRow;
    });

    console.log(
      "Updated AddShiftAndServices:",
      JSON.stringify(this.AddShiftAndServices)
    );

    if (this.AddShiftAndServices.length > 0) {
      console.log("=== STARTING VALIDATION ===");
      console.log("Shift Start Date:", this.addShiftData.AddShiftStartDate);
      console.log("Shift Start Time:", this.addShiftData.AddShiftStartTime);
      console.log("Shift End Date:", this.addShiftData.AddShiftEndDate);
      console.log("Shift End Time:", this.addShiftData.AddShiftEndTime);
      console.log("Staff ID:", this.addShiftData.AddShiftStaffValue);
      console.log("Segments count:", this.AddShiftAndServices.length);
      console.log("Segments data:", JSON.stringify(this.AddShiftAndServices));

      if (this.addShiftData.AddShiftType === "Custom") {
        console.log("Preparing and validating custom shifts...");
        const result = await this.prepareAndValidateCustomShifts();
        console.log(
          "✅ Raw Result from prepareAndValidateCustomShifts:",
          JSON.stringify(result)
        );
      }

      if (this.splitShift === true) {
        console.log("Validating split shift segments...");
        const isValid = await this.validateSplitShiftsSegments();
        console.log("Split shift validation result:", isValid);
        if (!isValid) {
          console.log("Validation failed. Exiting function.");
          return; // stop further processing if validation failed
        }
      }
    } else {
      console.log("No segments to validate.");
    }

    console.log("=== handleGroupShiftTimeChange END ===\n");
  }

  formattedLongShifts(enrichedSegments) {
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

        shiftTypeMap[uniqueKey] = { ...row, index: idx };
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
              segmentResult.duration > this.addshiftMaxDuration && this.addshiftMaxDuration  !=0
   
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
              billablehours: segmentResult.duration,
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
      this.handleParticipantAddressSelection();
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

  async handleParticipantAddressSelection() {
    try {
      const participantId = this.serviceParticipant; // use tracked variable instead of index
      if (!participantId) {
        console.error("No participant selected");
        return;
      }

      // Fetch participant address
      const participantResult = await this.getParticipantAddress(participantId);

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
      this.addShiftData.AddShiftParticipantAddressCheckbox = false;
      this.facilityAddressCheckbox = false;
      this.participantAddressCheckBox = true;

      // Enable save button
      this.isDisableSaveButton = false;

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
      this.isDisableSaveButton = true;
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
 
    if (paidBreak === true) {
        console.log('✅ Staff has paid break → Returning Duration only');
        return d;
    } else {
        console.log('❌ Staff does NOT have paid break → Subtracting Break');
        console.log(`⏱ Final Duration = ${d} - ${b} = ${d - b}`);
        return d - b;
    }
}
stopPropagation(event) {
    event.stopPropagation();
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
}