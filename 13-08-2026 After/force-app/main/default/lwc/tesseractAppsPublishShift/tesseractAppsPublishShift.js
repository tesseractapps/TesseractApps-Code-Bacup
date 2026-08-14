import { LightningElement, track, api } from "lwc";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getFacilityAddress from "@salesforce/apex/AddShiftController.getFacilityAddress";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import rosterPublish from "@salesforce/apex/RostersPublishAndAssignHandler.rosterPublish";
import getStaffHourlyRates from "@salesforce/apex/RostersPublishAndAssignHandler.getStaffHourlyRates";
import getShiftList from "@salesforce/apex/AddShiftController.getShiftList";
import allocateMultipleStaff from "@salesforce/apex/AddShiftController.allocateMultipleStaff";
//import sendPushNotification from '@salesforce/apex/mobilePushNotificationController.sendPushNotification';
import generateAndSendNotification from "@salesforce/apex/MobileAppNotificationsV2.generateAndSendNotification";
import fetchFacilitiess from "@salesforce/apex/ClientSearchController.fetchFacilitiess";
import sendShiftEmails from "@salesforce/apex/StaffEmailNotificationController.sendShiftEmails";
import getStaffList from "@salesforce/apex/AwardController.getStaffListforRosterManager";
import getfacilityById from "@salesforce/apex/FacilityController.getfacilityById";
import getClientById from "@salesforce/apex/ClientDataController.getClientById";
import getClientFunds from "@salesforce/apex/ServiceSupportPlanHandler.getClientFunds";
//import getCatalogueData from "@salesforce/apex/StaffAvailabilityController.getCatalogueData";
import getCatalogueData from "@salesforce/apex/CatalogueDataHandler.getCatalogueData";

import getShiftsTypeByFacility from "@salesforce/apex/RosterInvoicesHandler.getShiftsTypeByFacility";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import LEAFLET from "@salesforce/resourceUrl/leaflet";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import GOOGLE_API_KEY from "@salesforce/label/c.Google_Geocode_API_Key";
import fetchBulkRoles from '@salesforce/apex/FacilityController.fetchBulkRoles';
import Name from "@salesforce/schema/Account.Name";
import validateStaffAvailabilityWithReasons from '@salesforce/apex/RosterCreation.validateStaffAvailabilityWithReasons';
import checkShiftWithinAvailability from '@salesforce/apex/StaffAvailabilityValidation.checkShiftWithinAvailability';


export default class TesseractAppsPublishShift extends LightningElement {
  @api roleandadate = {};
  @api tablelagfromparent = false;
  @api startdate;
  @api enddate;
  @track addShiftData = {
    AddShiftStartDate: null,
    AddShiftStaffValue: null,
    AddShiftFacilityValue: null,
    AddShiftParticipantValue: null,
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
    AddShiftQuantity: 0,
    AddShiftNotes: null,
    AddShiftEOI: false,
    AddShiftId: null,
    AddShiftHoliday: false,
    AddShiftEnterOtherLocation: false,
    AddShiftParticipantAddressCheckbox: false,
    selectedServiceInfoJson: null,
    AddShiftTypeName: null,
    AddShiftEndDate: null,
  shiftGeoLocation: true,

  };
  @track address = {
    street: null,
    citySuburb: null,
    country: null,
    provinceState: null,
    postalcode: null,
    latitude: null,
    longitude: null
  };
  @track isAddShiftList = true;
  @track AddShiftTable = [];
  @track OrgNisationRoles = [];
  @track facilityOptions = [];
  @track facilityValue = [];
  @track chosenRole = [];
  @track orgId;
  @track shiftTypeOptions = [
    { label: "General", value: "General" },
    { label: "Morning", value: "Morning" },
    { label: "Afternoon", value: "Afternoon" },
    { label: "Night", value: "Night" },
    { label: "Custom", value: "Custom" },
    { label: "Sleepover Shift", value: "Sleepover Shift" }

  ];
  @track facilityAddressCheckbox = false;
  @track participantAddressCheckBox = false;
  @track addNewAddressCheckBox = false;
  @track addressValueCheckbox = false;
  @track isDisableSaveButton = false;
  @track finalAddShiftData = {
    shiftaddress: null,
    shiftDetails: null
  };
  @track staffHorlyRateList = [];
  @track filteredRole = [];
  @track isAllocateTable = false;
  @track isHomeFlag = false;
  @track isUnallocateTable = false;
  @track unAllocatedTableList = [];
  @track finalAllocationList = [];
  @track unallocatedCount = 0;
  @track isDisableAllocated = false;
  @track selectedShiftId;
  @track selectedShiftDate;
  @track allocateLabel = "Create";
  @track isHoliday = false;
  @track isShowSpinner = false;
  @track isEoICheckBoxVisible = true;
  @track isEoICheckBoxtrue = false;
  @track organisationShiftTimes;
  @track startTimeSelectedHour = null;
  @track startTimeSelectedminute = null;
  @track endtimeSelectedHour = null;
  @track endtimeSelectedminute = null;
  @track startTimeAMPM = null;
  @track endTimeAMPM = null;
  @track savButtonDisable = false;
  @track isEditShiftScreen = false;
  @track AddShiftOriginalQuantity = 0;
  @track disableTimeButton = false;
  @track isNotificationVisible = true;
  isListening = false;
  filteredStaffList = [];
  savedStaffIds = [];
  originalEOIStaffIds =[];
  get selectedAllocationShift() {
    let details = {
      shiftType: '',
      role: '',
      facilityName: '',
      date: '',
      startTime: '',
      endTime: '',
      duration: '',
      eoi: 'False',
      shiftTypeClass: 'shift-type-default'
    };

    if (this.isAllocateTable) {
      if (this.selectedShiftId) {
        let selected = this.unAllocatedTableList.find(s => s.Id === this.selectedShiftId);
        if (selected) {
          details.shiftType = selected.Shift_Type__c || '';
          details.role = selected.Role__c || '';
          details.facilityName = selected.Facility_Name__c || '';
          details.date = selected.date || '';
          
          if (selected.Shift_Start_End_Time__c) {
            let parts = selected.Shift_Start_End_Time__c.split('-');
            if (parts.length === 2) {
              details.startTime = parts[0].trim();
              details.endTime = parts[1].trim();
            } else {
              details.startTime = selected.Shift_Start_End_Time__c;
            }
          }
          
          details.duration = selected.duration ? `${selected.duration} Hours` : '';
          details.eoi = selected.EOIvalue || 'False';

          let shiftTypeClass = 'shift-type-default';
          if (selected.Shift_Type__c === 'General') {
            shiftTypeClass = 'shift-type-general';
          } else if (selected.Shift_Type__c === 'Night') {
            shiftTypeClass = 'shift-type-night';
          } else if (selected.Shift_Type__c === 'Morning') {
            shiftTypeClass = 'shift-type-morning';
          } else if (selected.Shift_Type__c === 'Custom') {
            shiftTypeClass = 'shift-type-custom';
          } else if (selected.Shift_Type__c === 'Afternoon') {
            shiftTypeClass = 'shift-type-afternoon';
          }
          details.shiftTypeClass = shiftTypeClass;
          return details;
        }
      }

      details.shiftType = this.addShiftData.AddShiftType || '';
      details.role = this.addShiftData.AddShiftRole || '';
      
      if (this.addShiftData.AddShiftFacilityValue && this.facilityOptions) {
        let fac = this.facilityOptions.find(f => f.value === this.addShiftData.AddShiftFacilityValue);
        details.facilityName = fac ? fac.label : '';
      }

      if (this.addShiftData.AddShiftStartDate) {
        let rawDate = this.addShiftData.AddShiftStartDate;
        try {
          let dateParts = rawDate.split('-');
          if (dateParts.length === 3) {
            details.date = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
          } else {
            details.date = rawDate;
          }
        } catch(e) {
          details.date = rawDate;
        }
      }

      details.startTime = this.addShiftData.AddShiftStartTimeAMPM || '';
      details.endTime = this.addShiftData.AddShiftEndTimeAMPM || '';
      details.duration = this.addShiftData.AddShiftDuration ? `${this.addShiftData.AddShiftDuration} Hours` : '';
      details.eoi = this.addShiftData.AddShiftEOI ? 'True' : 'False';

      let shiftTypeClass = 'shift-type-default';
      if (this.addShiftData.AddShiftType === 'General') {
        shiftTypeClass = 'shift-type-general';
      } else if (this.addShiftData.AddShiftType === 'Night') {
        shiftTypeClass = 'shift-type-night';
      } else if (this.addShiftData.AddShiftType === 'Morning') {
        shiftTypeClass = 'shift-type-morning';
      } else if (this.addShiftData.AddShiftType === 'Custom') {
        shiftTypeClass = 'shift-type-custom';
      } else if (this.addShiftData.AddShiftType === 'Afternoon') {
        shiftTypeClass = 'shift-type-afternoon';
      }
      details.shiftTypeClass = shiftTypeClass;
    }
    return details;
  }

  get totalQuantity() {
    let total = 0;
    if (this.unAllocatedTableList) {
      this.unAllocatedTableList.forEach(shift => {
        total += Number(shift.Quantity__c || 0);
      });
    }
    return String(total).padStart(2, '0');
  }

  get totalUnallocated() {
    let total = 0;
    if (this.unAllocatedTableList) {
      this.unAllocatedTableList.forEach(shift => {
        total += Number(shift.Un_Allocated__c || 0);
      });
    }
    return String(total).padStart(2, '0');
  }

  get totalAllocated() {
    let qty = 0;
    let unallocated = 0;
    if (this.unAllocatedTableList) {
      this.unAllocatedTableList.forEach(shift => {
        qty += Number(shift.Quantity__c || 0);
        unallocated += Number(shift.Un_Allocated__c || 0);
      });
    }
    let allocated = qty - unallocated;
    return String(allocated >= 0 ? allocated : 0).padStart(2, '0');
  }
  showMuteIcon = false;
  showClearIcon = false;
  recognition;
  @track disableRole = false;
  @track headingLabel = "Add Shift(s)";
  @track isVisibleSaveButton = true;
  @track fatigueManagementFlag = false;
  @track fatigueConfirmationMessge;
  @track setHoursIndicatorflag = false;
  @track setHoursIndiactorConfirmation;
  @api facilityarray = [];
  @track navigateTo;
  @track staffData = [];
  @track selectedStaffIds = [];
  @track addShiftEOI = false;
  @track otherThanNDISUser;
  @track ParticipantOptions = [];
  @track ServiceTypeIdInParticipant;
  @track selectedServiceInfo = {};
  @track serviceType = false;
  @track RoleFilter = [];
  @track isRoleChangedDuringFilterChange = "All";
  @track documentExpired = false;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  leafletInitialized = false;
  polyline;
  @track isMapLoaded = false;
  @track map;

  @api loggedInUserType;
  @track shiftNameOptions = [];
  @track serviceNameDisplay = "";
  @track addshiftMaxDuration = 0;
  @track hourlyRateLabel = 'Hourly Rate'
  @track showErrorModal = false;
  @track staffDateConflicts = [];
  @track unavailableTemplate = false;
  @track unavailableStaffNames = [];
  @track rejectedStaffNames = [];
  @track shiftPenaltyMode = '';
  @track fatigueStaffNames = [];
  @track schadsSleepoverWarningStaff = [];
  @track searchStaffText = "";
  filteredStaffData = [];
  isAllSelected = false;
  @track unavailableMarkedStaff = [];
  /*  @track EOIvalue; */

  HandleBack() {
    console.log("navigateTo " + this.navigateTo);
    if (this.navigateTo == "AllocationShifts") {
      this.isHomeFlag = false;
      this.isUnallocateTable = true;
      this.isAllocateTable = false;
      this.isVisibleSaveButton = false;
      this.navigateTo = "home";
      this.hourlyRateLabel = 'Hourly Rate';
      let startDate=this.addShiftData.AddShiftStartDate;
      let parsedate=this.addShiftData.AddShiftStartDate.split('-');
     let finalDate=parsedate[2] + "/" + parsedate[1] + "/" + parsedate[0]
       this.getInitialShiftDeatils(this.addShiftData.AddShiftRole,finalDate);
    } else if (this.navigateTo == "home") {
      this.dispatchEvent(new CustomEvent("publishbackbutton"));
    }

    this.serviceType = false;
  }
  connectedCallback() {
    let selectedRole = localStorage.getItem("SelctedComboBoxRole");
    console.log("selectedRole :", selectedRole);

    console.log(
      "facility val from parent :",
      JSON.stringify(this.facilityarray)
    );
    console.log(' this.roleandadate.rosterPublishRole ' + JSON.stringify(this.roleandadate));
    console.log("is holiday :", this.roleandadate.isHoliday);
    this.addShiftData.AddShiftHoliday =
      this.roleandadate.isHoliday == "true" ? true : false;
    if (this.addShiftData.AddShiftHoliday == true) {
      this.confirMationMessage(
        "Public Holiday",
        "This shift falls on a public holiday. Holiday rates will be applied.",
        "warning"
      );
    }

    this.handleRosterPasteShortcutBound = this.handleRosterPasteShortcut.bind(this);
    window.addEventListener('keydown', this.handleRosterPasteShortcutBound);

     console.log('this.roleandadate.rosterPublishDate==>'+this.roleandadate.rosterPublishDate);
    let startDate = this.roleandadate.rosterPublishDate.split("-");
   
    this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName =
      localStorage.getItem("defaultStaffPreferredName") || "Staff";
    this.addShiftData.AddShiftStartDate =
      startDate[2] + "-" + startDate[1] + "-" + startDate[0];
      let finalApexDate=startDate[0] + "/" + startDate[1] + "/" + startDate[2];
    this.addShiftData.AddShiftnotification = true;
    console.log("start date " + this.startdate);
    console.log("end date " + this.enddate);

     let role = [];
      if(this.roleandadate.rosterPublishRole =='All'){
         role =this.roleandadate.orgRoles
          .filter(item => item.value !== 'All')
          .map(item => item.value);

          this.addShiftData.AddShiftRole=role[0]
      }else{
         role.push(this.roleandadate.rosterPublishRole)
        this.addShiftData.AddShiftRole = this.roleandadate.rosterPublishRole;
      }
      console.log('Roles before apex' +JSON.stringify(role));
      
      console.log(' this.addShiftData.AddShiftRole in connected callback' + this.addShiftData.AddShiftRole);
    if (this.tablelagfromparent == true) {
      //   console.log('Received data in start date:', this.addShiftData.AddShiftStartDate);
      //   console.log('Received data in role:', this.addShiftData.AddShiftRole);
      
     
     /*  if (selectedRole == 'All') {
        role = this.roleandadate.orgRoles
          .filter(item => item.value !== 'All')
          .map(item => item.value);
      } else {
        role.push(this.addShiftData.AddShiftRole)
      } */

      this.getInitialShiftDeatils(role,finalApexDate);

      this.isHomeFlag = false;
      this.isUnallocateTable = true;

      this.headingLabel = "Shift Allocation";
      this.isVisibleSaveButton = false;
    } else {
      this.isHomeFlag = true;
      this.isAllocateTable = false;
    }

    getFacilityData()
      .then((response) => {
        this.facilityOptions = response.map((record) => ({
          value: record.Id,
          label: record.Name,
          preferredName: record.Facility_Preferred_Name_Formula__c,
          participantPreferredName: record.Participant_Preferred_Name_Formla__c,
          staffPreferredName: record.Staff_Preferred_Name_Formual__c,
          shiftPenaltyMode: record.Shift_Penalty_Mode__c,
        }));

        this.finalSelectedFacilities = this.facilityOptions.filter((rec) =>
          this.facilityarray.includes(rec.value)
        );
        //  console.log('number of facilities  ==>'+JSON.stringify(this.facilityOptions));
        console.log("number of facilities  ==>" + this.facilityOptions.length);
        this.organisationShiftTimes = response[0].Organisation__r;
        this.facilityValue.push(this.facilityOptions[0].value);
        this.facilityAddressCheckbox = true;
        this.addShiftData.AddShiftFacilityValue = this.facilityarray[0];
        this.addShiftData.AddShiftFacilityValue = this.facilityarray[0];
        if (this.addShiftData.AddShiftFacilityValue) {
          this.processShifts(this.addShiftData.AddShiftFacilityValue);
        }


        if (this.facilityAddressCheckbox == true) {
          this.getFacilityAddress();
          this.addressValueCheckbox = true;
        }
      })
      .catch((err) => {
        // console.log(err);
      });

    organizationDetails().then((response) => {
      console.log("response >>", JSON.stringify(response));
      this.orgId = response.listofPriceBook.Id;
      console.log("this.orgId >>", this.orgId);
      console.log("this.facilityValue >>", JSON.stringify(this.facilityValue));

      console.log("this.otherThanNDISUser >>", this.otherThanNDISUser);

      fetchBulkRoles({ facilityIDList: [this.addShiftData.AddShiftFacilityValue] }).then(
        facRoles => {
          console.log("facRoles " + JSON.stringify(facRoles));
          facRoles.forEach(rec => {
            this.OrgNisationRoles.push({ label: rec.Role_Name__c, value: rec.Role_Name__c })
          });
          this.RoleFilter = this.OrgNisationRoles;
          let AllFilter = { value: "All", label: "All" };
          this.OrgNisationRoles = [AllFilter, ...this.OrgNisationRoles];
          console.log("this.OrgNisationRoles " + JSON.stringify(this.OrgNisationRoles));
        })
      console.log("RoleFilter " + JSON.stringify(this.RoleFilter));
      this.isRoleChangedDuringFilterChange = "All";
      const selectedFacility = this.facilityOptions.find(
        (f) => f.value === this.addShiftData.AddShiftFacilityValue
      );
      if (selectedFacility) {
        this.shiftPenaltyMode = selectedFacility.shiftPenaltyMode;

      }
      console.log('selectedFacility ==>' + this.shiftPenaltyMode);

    });
    this.navigateTo = "home";
    this.handleLinkParticipants();
  }

  getInitialShiftDeatils(role,startDate){
     getShiftList({
        role: role,
        startDate: startDate
      })
        .then((response) => {
          console.log("shiftlist:", JSON.stringify(response));
          let filteredShifts = response.filter((rec) =>
            this.facilityarray.includes(rec.Facility__c)
          );

          this.unAllocatedTableList = filteredShifts.map((rec, index) => {
            const rawDate = rec.Start_Date__c;
            const formattedDate = new Date(rawDate).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              }
            );
            let EOIvalue = rec.Is_EOI__c ? "True" : "False";
            let duration = parseFloat(rec.Duration__c).toFixed(2);
            return {
              ...rec,
              serialNumber: index + 1,
              date: formattedDate,
              EOIvalue: EOIvalue,
              duration: duration
            };
          });
        })
        .catch((err) => {
          console.error("Error fetching shift list:", err);
        });


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


  }

  handleAddShiftTimeData(event) {
    console.log('time deatils '+JSON.stringify(event.detail));
    // Validate Start Time
    
    if (!event.detail || event.detail.displaytime === null) {

        const timeType = event.currentTarget.dataset.timetype;

        if (timeType === "AddShiftStartTime") {
            // Clear only Start Time
            this.startTimeSelectedHour = null;
            this.startTimeSelectedMinute = null;
            this.startTimeAMPM = null;

            this.addShiftData.AddShiftStartTime = null;
            this.addShiftData.AddShiftStartTimeAMPM = null;
        }

        if (timeType === "AddShiftEndTime") {
            // Clear only End Time
            this.endTimeSelectedHour = null;
            this.endTimeSelectedMinute = null;
            this.endTimeAMPM = null;

            this.addShiftData.AddShiftEndTime = null;
            this.addShiftData.AddShiftEndTimeAMPM = null;
        }

        // Reset calculated values
        this.addShiftData.AddShiftDuration = 0;
        this.addShiftData.AddShiftBreak = 0;

        console.warn(`⛔ ${timeType} cleared`);
        return;
    }
    if (this.addShiftData.AddShiftEOI == true) {
      this.confirMationMessage(
        "Info ",
        "Please check the staff details before proceeding.",
        "info"
      );
      this.savButtonDisable = true;
    }
    const childData = event.detail;
    this.addShiftData[event.currentTarget.dataset.timetype] =
      childData.twentyFourHourFormat;
    this.addShiftData[event.currentTarget.dataset.ampm] = childData.displaytime;


        if (
        !this.addShiftData.AddShiftStartTime ||
        !this.addShiftData.AddShiftEndTime ||
        !this.addShiftData.AddShiftStartTimeAMPM ||
        !this.addShiftData.AddShiftEndTimeAMPM
    ) {
        this.addShiftData.AddShiftDuration = 0;
        this.addShiftData.AddShiftBreak = 0;
    } else {
        const durationResult = this.getDuration(
            this.addShiftData.AddShiftStartDate,
            this.addShiftData.AddShiftStartTime,
            this.addShiftData.AddShiftEndTime,
            this.addShiftData.AddShiftEndTimeAMPM,
            this.addShiftData.AddShiftType
        );

        this.addShiftData.AddShiftDuration = durationResult.duration;
        this.addShiftData.AddShiftBreak = durationResult.breakTime;
    }
    this.dispalyAmPMFormat();
    console.log("Updated addShiftData:", JSON.stringify(this.addShiftData));
  }
  addressInputChange(event) {
    this.address.street = event.detail.street;
    this.address.citySuburb = event.detail.city;
    this.address.postalcode = event.detail.postalCode;
    this.address.provinceState = event.detail.province;
    this.address.country = event.detail.country;
    setTimeout(() => this.validateAddress(), 300);

    this.fetchGeocode();
  }

  getDuration(
    startDateString,
    startTimeString,
    endTimeString,
    endTimeAMPM,
    shiftType
  ) {
    console.log("--- getDuration called ---");
    console.log("Input Params:", {
      startDateString,
      startTimeString,
      endTimeString,
      endTimeAMPM,
      shiftType
    });

    // Validate input parameters
    if (
      !startDateString ||
      !startTimeString ||
      !endTimeString ||
      !endTimeAMPM ||
      !shiftType
    ) {
      console.warn("Missing one or more required parameters.");
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
    console.log("Parsed date:", { year, month, day });

    // Parse start time
    const startParts = startTimeString.split(":");
    const startDate = new Date(
      year,
      month,
      day,
      parseInt(startParts[0], 10),
      parseInt(startParts[1], 10)
    );
    console.log("Start Date:", startDate.toString());

    // Parse end time
    const endParts = endTimeString.split(":");
    let endDate = new Date(
      year,
      month,
      day,
      parseInt(endParts[0], 10),
      parseInt(endParts[1], 10)
    );
    console.log("Initial End Date:", endDate.toString());

    // Adjust for overnight shifts only if end time is before start time
    if (
      shiftType === "Night" ||
      shiftType === "Custom" ||
      shiftType === "Sleepover Shift"
    ) {
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
        console.log(
          `${shiftType} shift adjusted: endDate moved to next day to correct negative duration.`
        );
      } else {
        console.log(`${shiftType} shift: no date adjustment needed.`);
      }
    }

    // Calculate duration
    let durationInMilliseconds = endDate - startDate;
    let durationInMinutes = durationInMilliseconds / (1000 * 60);

    // Limit duration to 24 hours
    if (durationInMinutes > 1440) {
      console.warn("Duration exceeds 24 hours. Capping to 24 hours.");
      durationInMinutes = 1440;
    }

    console.log("Duration in minutes:", durationInMinutes);

    let hours = (durationInMinutes / 60).toFixed(2);
    console.log("Calculated raw hours:", hours);

    let breakTime = 0;

    if (hours >= 5) {
      breakTime = 30;
      const breaksInHours = (breakTime / 60).toFixed(2);
      hours -= breaksInHours;
      console.log(`Break time of 30 mins applied. Adjusted hours: ${hours}`);
    } else {
      console.log("No break time applied (less than 5 hours).");
    }

    // Set formatted end date to the component state
    const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    console.log("Formatted End Date:", formattedEndDate);
    this.addShiftData.AddShiftEndDate = formattedEndDate;

    const result = {
      duration: parseFloat(hours),
      breakTime: breakTime
    };

    console.log("Final Duration Result:", result);
    return result;
  }

  handleAddShiftChange(event) {
    const { name, type, value, checked } = event.target;
    console.log('name ==> ' + name);
    console.log('value ==> ' + value);

    /*   console.log("this.orgId >> ", this.orgId);
      console.log(
        "addShiftData.AddShiftFacilityValue >>",
        this.addShiftData.AddShiftFacilityValue
      );
      console.log(
        "addShiftData.AddShiftParticipantValue >>",
        this.addShiftData.AddShiftParticipantValue
      ); */

    if (type === "checkbox") {
      this.addShiftData[name] = checked;
      console.log(`[checkbox] Field '${name}' changed to: ${checked}`);

      if (name === "AddShiftEOI") {
        this.addShiftEOI = checked; // <-- Sync checkbox to toggle template
        console.log(
          "this.addShiftData.AddShiftType >>",
          this.addShiftData.AddShiftType
        );
        console.log(
          "this.addShiftData.AddShiftStartTimeAMPM >>",
          this.addShiftData.AddShiftStartTimeAMPM
        );
        console.log(
          "this.addShiftData.AddShiftEndTimeAMPM >>",
          this.addShiftData.AddShiftEndTimeAMPM
        );
        if (checked &&
          this.addShiftData.AddShiftType != null &&
          this.addShiftData.AddShiftStartTimeAMPM != null &&
          this.addShiftData.AddShiftEndTimeAMPM != null
        ) {
          this.confirMationMessage(
            "Info ",
            "Please check the staff details before proceeding.",
            "info"
          );
          this.savButtonDisable = true;
        } else {
          this.savButtonDisable = false;
        }

      }
    } else {
      this.addShiftData[name] = value;

    }
     if(name === "AddShiftFacilityValue"){
        this.addShiftData.AddShiftTypeName='';
        this.addShiftData.AddShiftType=''; 
      }
       if (name === "AddShiftFacilityValue"){
         this.addShiftData.AddShiftRole='';
       }
    if (name === "AddShiftFacilityValue" || this.facilityAddressCheckbox === true) {
     
      // 🟡 Update preferred name
      const selectedFacility = this.facilityOptions.find(
        (f) => f.value === this.addShiftData.AddShiftFacilityValue
      );
      if (selectedFacility) {
        this.facilityPreferredName = selectedFacility.preferredName;
        this.participantPreferredName =
          selectedFacility.participantPreferredName;
        this.staffPreferredName = selectedFacility.staffPreferredName;
      }

      this.getFacilityAddress();

      if (this.addShiftData.AddShiftFacilityValue) {
      
        this.processShifts(this.addShiftData.AddShiftFacilityValue);
        this.OrgNisationRoles = [];
        this.RoleFilter = [];
        fetchBulkRoles({ facilityIDList: [this.addShiftData.AddShiftFacilityValue] }).then(
          facRoles => {
            console.log("facRoles IN ONCHANGE " + JSON.stringify(facRoles));
            facRoles.forEach(rec => {
              this.OrgNisationRoles.push({ label: rec.Role_Name__c, value: rec.Role_Name__c })
            });
            this.RoleFilter = this.OrgNisationRoles;
         //   this.addShiftData.AddShiftRole=this.OrgNisationRoles[0].value;
            let AllFilter = { value: "All", label: "All" };
            this.OrgNisationRoles = [AllFilter, ...this.OrgNisationRoles];
            console.log("this.OrgNisationRoles IN ONCHANGE" + JSON.stringify(this.OrgNisationRoles));
            console.log("RoleFilter IN ONCHANGE " + JSON.stringify(this.RoleFilter));
            // this.addShiftData.AddShiftRole=this.RoleFilter[0].value;
          })

      }

    }
    if (event.target.name == "AddShiftTypeName") {

      console.log(
        "this.addShiftData.AddShiftTypeName ==>" +
        this.addShiftData.AddShiftTypeName
      );
      console.log(
        "shifNameOptions ==>" + JSON.stringify(this.shiftNameOptions)
      );
      if (this.addShiftData.AddShiftEOI == true) {
        this.confirMationMessage(
          "Info ",
          "Please check the staff details before proceeding.",
          "info"
        );
        this.savButtonDisable = true;
      }
      let shifNames = this.shiftNameOptions.filter(
        (rec) => rec.value === this.addShiftData.AddShiftTypeName
      );
      console.log("shifNameOptions ==>" + JSON.stringify(shifNames));
      this.getShiftTimingsByFacility(shifNames);
      if (this.otherThanNDISUser == true) {
        this.getFullFundList();
      }
    }
    if (name === "AddShiftType" && this.addShiftData.AddShiftType) {
      if (this.addShiftData.AddShiftEOI == true) {
        this.confirMationMessage(
          "Info ",
          "Please check the staff details before proceeding.",
          "info"
        );
        this.savButtonDisable = true;
      }

    }

    if (name === "AddShiftParticipantValue") {
      this.savButtonDisable = false;
      this.addShiftData[name] = value;
      this.getFullFundList();
    }
    if (name === "AddShiftNotes") {
      this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
    }

    if (name === "AddShiftQuantity") {
      this.clearFieldError(".AddShiftQuantity");
    }

    console.log("Updated addShiftData:", JSON.stringify(this.addShiftData));
  }

  clearFieldError(selector) {
    const el = this.template.querySelector(selector);
    if (el) {
      el.setCustomValidity("");
      el.reportValidity();
    }
  }


  getFullFundList() {
    if (this.addShiftData.AddShiftParticipantValue) {
      getClientFunds({ clientId: this.addShiftData.AddShiftParticipantValue })
        .then((response) => {
          console.log("response >>", response);
          if (!response || response.length === 0) {
            this.serviceType = false;
            this.savButtonDisable = true;
            this.confirMationMessage(
              "Warning",
              "No service funds available for the selected participant.",
              "Warning"
            );
            return;
          }
          if (response) {
            this.TotalFunds = response;
            this.ServiceTypeIdInParticipant = response[0].Id;
            console.log(
              "this.ServiceTypeIdInParticipant >>",
              this.ServiceTypeIdInParticipant
            );
            this.fundOption = response.map((rec) => {
              return { label: rec.Registration_Group__c, value: rec.Id };
            });

            console.log("✅ Calling serviceFundSelection...");
            this.serviceFundSelection();
            this.serviceType = true;
          }
        })
        .catch((error) => {
          // Handle error
        });
    }
  }

  serviceFundSelection() {
    console.log("✅ Called serviceFundSelection...");

    getCatalogueData({
      serviceType: this.ServiceTypeIdInParticipant,
      clientId: this.addShiftData.AddShiftParticipantValue
    })
      .then((result) => {
        console.log("📦 result :", JSON.stringify(result));
        const catalogueData = result.catalogueData;

        const stateField = result.statesCombined; // e.g., "NSW__c"
        this.stateValue = stateField;

        // Attach calculated amounts using state-specific value
        /*   this.serviceGroupName = catalogueData.map((rec) => {
                return {
                    ...rec,
                    amount: this.otherThanNDISUser == true ? result.amount ||0 : rec[stateField] || 0
                };
            }); */

        this.serviceGroupName = catalogueData.map((rec) => {
          let amountVal, nameVal;

          if (
            this.otherThanNdis === true ||
            (this.otherThanNdis === false &&
              result.catalogueData[0].Name.includes("Miscellaneous"))
          ) {
            // ✅ Pull from junction maps using the record Id
            amountVal = result.clientJunctionMapAmount[rec.Id] || 0;
            nameVal =
              result.clientJunctionMapName[rec.Id] || rec.Support_Item_Name__c;
          } else {
            // ✅ Normal case → use state field from catalogue record
            amountVal = rec[stateField] || 0;
            nameVal = rec.Support_Item_Name__c;
          }

          return {
            ...rec,
            amount: amountVal,
            Support_Item_Name__c: nameVal
          };
        });

        console.log(
          "📊 Service Group with Amounts:",
          JSON.stringify(this.serviceGroupName)
        );

        // ✅ Store selected service group ID
        this.selectedServiceGroupId = this.serviceGroupName[0]?.Id;
        console.log(
          "📌 Selected Service Group ID:",
          this.selectedServiceGroupId
        );
        console.log(
          "catalogueData.editedCatalogName ==> " + result.editedCatalogName
        );
        const formattedAmount = new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
          minimumFractionDigits: 2
        }).format(this.serviceGroupName[0].amount);

        this.serviceNameDisplay =
          this.serviceGroupName[0].Name + " - " + formattedAmount;

        // ✅ Create and store JSON info
        this.selectedServiceInfo = {
          serviceTypeId: this.ServiceTypeIdInParticipant,
          serviceGroupId: this.selectedServiceGroupId,
          participantId: this.addShiftData.AddShiftParticipantValue,
          amount: this.serviceGroupName[0].amount
        };

        // Store the JSON string inside your tracked addShiftData object
        this.addShiftData.selectedServiceInfoJson = JSON.stringify(
          this.selectedServiceInfo
        );

        console.log(
          "📦 selectedServiceInfo:",
          JSON.stringify(this.selectedServiceInfo)
        );
        console.log(
          "🧾 JSON format:",
          this.addShiftData.selectedServiceInfoJson
        );
        console.log("Updated addShiftData:", JSON.stringify(this.addShiftData));
      })
      .catch((error) => {
        console.error("❌ Error fetching catalogue data:", error);
      });
  }

  async handleOpenEOIModal(event) {


   /*   if (this.headingLabel !== "Edit Shift(s)") {  */
      try {
        await this.fetchEOIStaff();
      } catch (error) {
         this.confirMationMessage(
              "Error",
             "Failed to fetch staff list",
              "error"
            );
       
      }
    
 /*  } */
}

  async fetchEOIStaff() {
    console.log(
      "📥 Fetching EOI staff for facility:",
      this.addShiftData.AddShiftFacilityValue
    );
    console.log("🎯 Role to filter (if any):", this.addShiftData.AddShiftRole);
    console.log("Shift Date:", this.addShiftData.AddShiftStartDate);
    console.log("Shift Duration:", this.addShiftData.AddShiftStartDate);

    if (!this.addShiftData.AddShiftFacilityValue) {
      
         this.confirMationMessage(
              "Warning",
             this.facilityPreferredName+" is required",
              "warning"
            );
        return;
    }
     if (!this.addShiftData.AddShiftTypeName) {
      
         this.confirMationMessage(
              "Warning",
             "Shift Name is required",
              "warning"
            );
        return;
    }

    if (!this.addShiftData.AddShiftRole || 
        !this.addShiftData.AddShiftRole.trim()) {
        this.confirMationMessage(
              "Warning",
             "Role is required",
              "warning"
            );
        return;
    }


    if (!this.addShiftData.AddShiftStartTimeAMPM) {
       
         this.confirMationMessage(
              "Warning",
             "Start Time is required",
              "warning"
            );
        return;
    }

    if (!this.addShiftData.AddShiftEndTimeAMPM) {
      
        
         this.confirMationMessage(
              "Warning",
             "End Time is required",
              "warning"
            );
        return;
    }


    console.log(
        "📥 Fetching EOI staff for facility:",
        this.addShiftData.AddShiftFacilityValue
    );

    return getStaffList({
      orgId: this.orgId,
      facilityId: this.addShiftData.AddShiftFacilityValue,
      shiftDate: this.addShiftData.AddShiftStartDate,
      endDate: this.addShiftData.AddShiftEndDate,
      startTime: this.addShiftData.AddShiftStartTimeAMPM,
      endTime: this.addShiftData.AddShiftEndTimeAMPM,
      Role: this.addShiftData.AddShiftRole.trim()
    })
      .then((result) => {
        //  console.log(`✅ Apex returned ${result.length} staff records`);
        console.table(result);

        let filteredStaff = result;
       this.isEoICheckBoxtrue = true;

        this.staffData = filteredStaff.map((staff) => ({...staff,

          // keep previous selection
          isSelected: this.selectedStaffIds  && this.selectedStaffIds.includes(staff.Id),
          isSaved: this.selectedStaffIds && this.selectedStaffIds.includes(staff.Id),
          isDisabled: this.headingLabel === "Edit Shift(s)" &&this.originalEOIStaffIds.includes(staff.Id)
      }));

        this.filteredStaffData = [...this.staffData];
        this.savedStaffIds = [...this.selectedStaffIds];

      const enabledStaff = this.filteredStaffData.filter(
            staff => !staff.isDisabled
        );

        this.isAllSelected =
            enabledStaff.length > 0 &&
            enabledStaff.every(staff => staff.isSelected);

       console.log('staff in EOI=>'+JSON.stringify(this.staffData));
      })
      .catch((error) => {
        this.isEoICheckBoxtrue = false;
        console.error("❌ Error fetching staff from Apex:", error);
        throw error;
      });
  }


  handleStaffCheckboxChange(event) {

    const staffId = event.target.dataset.id;
    const isChecked = event.target.checked;


    // update master data
    this.staffData = this.staffData.map(staff => {

        if(staff.Id === staffId){
            return {
                ...staff,
                isSelected:isChecked
            };
        }

        return staff;
    });


    // refresh filtered data without losing search
    this.applyStaffSearch();


    this.updateSelectedStaffIds();

}

  handleSelectAllStaff(event) {

    const checked = event.target.checked;

    // Only visible searched staff
    const visibleIds = this.filteredStaffData.map(staff => staff.Id);

    this.staffData = this.staffData.map(staff => {

        // Skip disabled staff
        if (staff.isDisabled) {
            return staff;
        }

        // Select/Deselect only visible & enabled staff
        if (visibleIds.includes(staff.Id)) {
            return {
                ...staff,
                isSelected: checked
            };
        }

        // Keep existing selection for non-visible staff
        return staff;
    });

    this.applyStaffSearch();
    this.updateSelectedStaffIds();
}
  handleStaffSearch(event){

    this.searchStaffText = event.target.value;

    this.applyStaffSearch();
}
handleAllocatedStaffSearch(event) {
    const searchKey = event.target.value.toLowerCase();

    if (searchKey) {
        this.filteredStaffList = this.staffHorlyRateList.filter(staff =>
            staff.fullName &&
            staff.fullName.toLowerCase().includes(searchKey)
        );
    } else {
        this.filteredStaffList = [...this.staffHorlyRateList];
    }
}
applyStaffSearch(){

    let searchValue = 
        this.searchStaffText
        ? this.searchStaffText.toLowerCase()
        : "";


    if(searchValue){

        this.filteredStaffData =
            this.staffData.filter(staff =>
                staff.DisplayName &&
                staff.DisplayName
                .toLowerCase()
                .includes(searchValue)
            );

    }else{

        this.filteredStaffData = [
            ...this.staffData
        ];
    }


    // header checkbox state
    this.isAllSelected =
    this.filteredStaffData.filter(staff => !staff.isDisabled).length > 0 &&
    this.filteredStaffData
        .filter(staff => !staff.isDisabled)
        .every(staff => staff.isSelected);
}
updateSelectedStaffIds(){

    this.selectedStaffIds =
        this.staffData
        .filter(staff => staff.isSelected)
        .map(staff => staff.Id);


    console.log(
        "Selected Staff => ",
        JSON.stringify(this.selectedStaffIds)
    );
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
          /*  const trackData = [
          { coords: { latitude: location.lat, longitude: location.lng } }
        ];
        console.log('trackData',JSON.stringify(trackData)); */
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
            JSON.stringify(this.jsonData2)
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

      this.mapMarkersOnly = L.map(mapContainer, {
        attributionControl: false
      }).setView(
        [this.jsonData2[0].coords.latitude, this.jsonData2[0].coords.longitude],
        20
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: ""
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

  handleInsertEOIStaff(event) {
    console.log("this.selectedStaffIds >>", this.selectedStaffIds);
     this.savedStaffIds = [...this.selectedStaffIds];

    // Update saved state ONLY for enabled rows
    this.staffData = this.staffData.map(staff => {

        if (staff.isDisabled) {
            return staff;
        }

        return {
            ...staff,
            isSaved: staff.isSelected
        };
    });
    this.isEoICheckBoxtrue = false;
    this.savButtonDisable = false;
    console.log("this.savButtonDisable >>", this.savButtonDisable);
  }

  handleCloseModalEOIStaff() {
    console.log("this.headingLabel >>", this.headingLabel);

    if (this.headingLabel === "Add Shift(s)") {
      // Clear selection
      this.selectedStaffIds = [...this.savedStaffIds];

      this.staffData = this.staffData.map((staff) => ({
          ...staff,
          isSelected: this.savedStaffIds.includes(staff.Id)
      }));
    } else if (this.headingLabel === "Edit Shift(s)") {

            const originalSelectedIds = this.addShiftData?.EOI_Staff__c
                ? this.addShiftData.EOI_Staff__c.split(",")
                : [];

            // Restore last saved selection
            this.selectedStaffIds = [...this.savedStaffIds];

            this.staffData = this.staffData.map((staff) => {

                const isOriginal = originalSelectedIds.includes(staff.Id);

                // Original EOI staff stay disabled and checked
                if (isOriginal) {
                    return {
                        ...staff,
                        isSelected: true,
                        isDisabled: true
                    };
                }

                // Restore saved state for editable rows
                return {
                    ...staff,
                    isSelected: this.savedStaffIds.includes(staff.Id),
                    isDisabled: false
                };
            });
        }
    this.searchStaffText="";
    this.isEoICheckBoxtrue = false;
  }

  handleLinkParticipants() {
    fetchFacilitiess({ cname: "", isTrue: false })
      .then((response) => {
        // console.log('participant response '+JSON.stringify(response));

        this.ParticipantOptions = response
          .filter(
            (rec) =>
              rec.Status__c === true &&
              rec.Facility__r.Status__c === true &&
              rec.Facility__c == this.addShiftData.AddShiftFacilityValue
          ) // Check for 'Active' status
          .map((rec) => {
            let riskLevels =
              rec.Risk_Managements__r?.map((risk) => risk.Risk_Index__c) || [];

            // Priority Order: Extreme > High > Medium > Low
            let riskStatus = "";
            if (riskLevels.includes("Extreme")) {
              riskStatus = "Extreme";
            } else if (riskLevels.includes("High")) {
              riskStatus = "High";
            } else if (riskLevels.includes("Medium")) {
              riskStatus = "Medium";
            } // If none of the abov
            return {
              value: rec.Id,
              label: rec.Name__c,
              riskStatus: riskStatus // Include risk level
            };
          });
        console.log(
          "participantOptions " + JSON.stringify(this.ParticipantOptions)
        );
      })
      .catch((error) => { });
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

  validateInputs() {
    let isValid = true; // Track overall form validity

    // Define fields to validate
    let fields = [
      {
        name: "AddShiftQuantity",
        selector: ".AddShiftQuantity",
        errorMessage: "Quantity must be greater than 0."
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
      },
      {
        name: "AddShiftDuration",
        selector: ".AddShiftDuration",
        errorMessage: "Start time must be earlier than end time."
      }
    ];

    console.log("Starting Validation...");

    fields.forEach((field) => {
      let inputElement = this.template.querySelector(field.selector);

      if (inputElement) {
        let value = inputElement.value;
        const numValue = Number(value);
        let isFieldValid = true;

        // Use switch-case for validation logic
        switch (field.name) {
          case "AddShiftQuantity":
            const numValue = Number(value);

            if (isNaN(numValue)) {
              isFieldValid = false;
              field.errorMessage = "Please enter a valid number.";
            } else if (numValue <= 0) {
              isFieldValid = false;
              field.errorMessage = "Quantity must be greater than 0.";
            } else if (!Number.isInteger(numValue)) {
              isFieldValid = false;
              field.errorMessage = "Quantity cannot include decimals.";
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

      console.log("Address Validation Completed. isValid:", isValid);
      return isValid;
    } else {
      console.error("Error: lightning-input-address component not found.");
      return false;
    }
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
    const checkboxName = event.target.name;
    const isChecked = event.target.checked;
    this.savButtonDisable = false;

    console.log("➡️ Checkbox changed:", checkboxName, "| Checked:", isChecked);

    // ✅ Reset all checkboxes first
    console.log("🔄 Resetting all checkboxes...");
    this.facilityAddressCheckbox = false;
    this.participantAddressCheckBox = false;
    this.addNewAddressCheckBox = false;
    this.addressValueCheckbox = false;
    this.isDisableSaveButton = false;

    // ❗ Early validation after reset: Facility
    if (checkboxName === "facilityAddressCheckbox" && isChecked) {
      if (!this.addShiftData.AddShiftFacilityValue) {
        console.error("❌ Facility not selected.");
        this.confirMationMessage("Error", "Please Select facility", "Error");
        this.isDisableSaveButton = true;

        // Force uncheck visually
        event.target.checked = false;
        return;
      }
    }

    // ❗ Early validation after reset: Participant
    if (checkboxName === "participantAddressCheckBox" && isChecked) {
      if (!this.addShiftData.AddShiftParticipantValue) {
        console.error("❌ Participant not selected.");
        this.confirMationMessage("Error", "Please Select Participant", "Error");
        this.isDisableSaveButton = true;

        // Force uncheck visually
        event.target.checked = false;
        return;
      }
    }

    // ✅ Proceed to set the clicked checkbox
    switch (checkboxName) {
      case "facilityAddressCheckbox":
        if (isChecked) {
          console.log("✅ Facility address selected.");
          this.facilityAddressCheckbox = true;
          this.getFacilityAddress();
          this.addressValueCheckbox = true;
        } else {
          console.log(
            "🧹 Facility checkbox unchecked. Clearing address fields."
          );
          this.EmptyAddressFields();
        }
        break;

      case "participantAddressCheckBox":
        if (isChecked) {
          this.getPartcipantAddress();
          console.log("✅ Participant address selected.");
          this.participantAddressCheckBox = true;
          this.addressValueCheckbox = true;
        } else {
          console.log(
            "🧹 Participant checkbox unchecked. Clearing address fields."
          );
          this.EmptyAddressFields();
        }
        break;

      case "addNewAddressCheckBox":
        if (isChecked) {
          console.log("✅ Add New Address selected.");
          this.addNewAddressCheckBox = true;
          this.EmptyAddressFields();
        } else {
          console.log(
            "🧹 Add New checkbox unchecked. Clearing address fields."
          );
          this.EmptyAddressFields();
        }
        break;

      default:
        console.warn("⚠️ Unknown checkbox name:", checkboxName);
    }

    // 🔄 Update Add Other Location
    this.addShiftData.AddShiftEnterOtherLocation =
      this.addNewAddressCheckBox || this.participantAddressCheckBox;
    this.addShiftData.AddShiftParticipantAddressCheckbox =
      this.participantAddressCheckBox;
    console.log(
      "📝 AddShiftEnterOtherLocation set to:",
      this.addShiftData.AddShiftEnterOtherLocation
    );
    console.log(
      "📝 AddShiftParticipantAddressCheckbox set to:",
      this.addShiftData.AddShiftParticipantAddressCheckbox
    );
  }

  getPartcipantAddress() {
    getClientById({ recordId: this.addShiftData.AddShiftParticipantValue })
      .then((result) => {
        const facility = result[0];
        this.address.street = facility.Address__Street__s;
        this.address.citySuburb = facility.Address__City__s;
        if (facility.Address__CountryCode__s == "AU") {
          this.address.country = "Australia";
        }
        this.address.provinceState = facility.Address__StateCode__s;
        this.address.postalcode = facility.Address__PostalCode__s;
        this.isDisableSaveButton = false;
        this.fetchGeocode();
      })
      .catch((error) => {
        this.EmptyAddressFields();
        console.log(" error =>" + JSON.stringify(error));
        this.participantAddressCheckBox = false;
        this.confirMationMessage("Error", "Please Select Participant", "Error");
        this.isDisableSaveButton = true;
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
      .catch((error) => { });
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
  handleAddShiftSave() {
     if (!this.addShiftData.AddShiftTypeName) {
        this.confirMationMessage(
            "Error",
            "Shift Name is required.",
            "Error"
        );
        this.isShowSpinner = false;
        return;
    }
    /*  if (!this.addShiftData.AddShiftType || !this.addShiftData.AddShiftTypeName) {
        this.confirMationMessage(
            "Error",
            "Shift Type is required.",
            "Error"
        );
        this.isShowSpinner = false;
        return;
    } */

    // Validate Shift Role
    if (!this.addShiftData.AddShiftRole) {
        this.confirMationMessage(
            "Error",
            "Shift Role is required.",
            "Error"
        );
        this.isShowSpinner = false;
        return;
    }
    if (!this.addShiftData.AddShiftStartTime ||!this.addShiftData.AddShiftStartTimeAMPM) {
        this.confirMationMessage(
            "Error",
            "Start Time is required.",
            "Error"
        );
        this.isShowSpinner = false;
        return;
    }

    // Validate End Time
    if (!this.addShiftData.AddShiftEndTime || !this.addShiftData.AddShiftEndTimeAMPM ) {
        this.confirMationMessage(
            "Error",
            "End Time is required.",
            "Error"
        );
        this.isShowSpinner = false;
        return;
    }
     if (!this.addShiftData.AddShiftType || !this.addShiftData.AddShiftTypeName) {
        this.confirMationMessage(
            "Error",
            "Shift Type is required.",
            "Error"
        );
        this.isShowSpinner = false;
        return;
    }

    // Validate Shift Role
    if (!this.addShiftData.AddShiftRole) {
        this.confirMationMessage(
            "Error",
            "Shift Role is required.",
            "Error"
        );
        this.isShowSpinner = false;
        return;
    }

    this.finalAddShiftData.shiftaddress = this.address;
    this.finalAddShiftData.shiftDetails = this.addShiftData;
    this.selectedShiftId = "";
    this.selectedShiftDate = "";
    this.isShowSpinner = true;
       this.navigateTo = "home";
    //this.navigateTo = "AllocationShifts";

    // console.log('validate input '+this.validateInputs());
    // console.log('validate '+this.validateAddress());
    console.log("finalAddShiftData " + JSON.stringify(this.finalAddShiftData));

    if (
      this.participantAddressCheckBox == false &&
      this.facilityAddressCheckbox == false &&
      this.addNewAddressCheckBox == false
    ) {
      this.confirMationMessage("Error", "Address is Required.", "Error");
      this.savButtonDisable = true;
      this.isShowSpinner = false;
      return;
    }
    if (
      this.addShiftData.AddShiftType != "Sleepover Shift" &&
      this.addShiftData.AddShiftDuration > this.addshiftMaxDuration && this.addshiftMaxDuration != 0
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

    console.log(
      "Participant Value:",
      this.addShiftData.AddShiftParticipantValue
    );
    console.log("Other_than_NDIS_User__c:", this.otherThanNDISUser);
    if (
      this.addShiftData.AddShiftParticipantValue == null &&
      this.otherThanNDISUser == true
    ) {
      this.confirMationMessage("Error", "Participant is required.", "Error");
      this.isShowSpinner = false;
      return;
    }

    if (this.addShiftData.AddShiftQuantity > 99) {
      this.confirMationMessage(
        "Error",
        "Quantity must not exceed 99.",
        "Error"
      );
      this.isShowSpinner = false;
      return;
    }

    if (
      this.isEditShiftScreen == true &&
      this.addShiftData.AddShiftQuantity < this.AddShiftOriginalQuantity
    ) {
      this.confirMationMessage(
        "Error",
        "The quantity should not be empty or less than the original quantity.",
        "Error"
      );
      this.isShowSpinner = false;
    } else if (
      this.validateInputs() &&
      this.validateAddress() &&
      this.addShiftData.AddShiftDuration > 0
    ) {
      let facVal = [];
      facVal.push(this.addShiftData.AddShiftFacilityValue);

      console.log("selectedStaffIds >>", this.selectedStaffIds);
      rosterPublish({
        addshiftData: JSON.stringify(this.finalAddShiftData),
        startdate: this.startdate,
        enddate: this.enddate,
        facilityVal: facVal,
        selectedStaffIds: [...this.selectedStaffIds]
      })
        .then((result) => {
          console.log("result email" + JSON.stringify(result));
          // const Id = JSON.parse(result.shiftId);
          //console.log(' add shift id'+Id);
          if (result.isSuccess) {
            this.selectedShiftId = result.shiftid;
            console.log(`Shift Id: ${this.selectedShiftId}`);
            if (this.addShiftData.AddShiftEOI == false) {
              this.hourlyRateLabel = this.addShiftData.AddShiftType == "Sleepover Shift" ? 'Allowance' : 'Hourly Rate';
              this.isAllocateTable = true;
              this.isHomeFlag = false;
              this.isUnallocateTable = false;
              this.savButtonDisable = true;
              this.staffHorlyRateList = JSON.parse(result.staffHourlyRates);
              this.filteredStaffList = [...this.staffHorlyRateList];
              this.filteredRole = JSON.parse(result.staffHourlyRates);
              console.log(
                "Parsed Staff Hourly Rates:",
                JSON.stringify(this.staffHorlyRateList)
              );
              if (this.staffHorlyRateList.length > 0) {
                this.selectedShiftDate = this.staffHorlyRateList[0].shiftDate;
                this.unallocatedCount = this.staffHorlyRateList[0].quantity;

                console.log(`Shift start date: ${this.selectedShiftDate}`);
              }
            } else {
              this.isAllocateTable = false;
              this.isHomeFlag = true;
              this.isUnallocateTable = false;
              this.HandleBack();
            }
            console.log("Result: " + JSON.stringify(result));

            if (this.isEditShiftScreen == false) {
              this.confirMationMessage(
                "Success",
                "Your shift has been successfully created. Please proceed with adding staff to this shift.",
                "Success"
              );
            } else {
              this.confirMationMessage(
                "Success",
                "Your shift has been successfully updated. Please proceed with adding staff to this shift.",
                "Success"
              );
            }

            if (
              this.addShiftData.AddShiftnotification == true &&
              this.isEditShiftScreen == false &&
              this.headingLabel !== "Edit Shift(s)"
            ) {
              console.log("send push notification");
              /*  sendPushNotification({role:this.addShiftData.AddShiftRole,strdate:this.addShiftData.AddShiftStartDate}).then(response=>{
              }); */
              let rejectedStaffEmail = "";
              let typeOfShift = "";
              console.log("isEOICheckBoxtrue" + this.addShiftData.AddShiftEOI);
              if (this.addShiftData.AddShiftEOI == true) {
                typeOfShift = "isEOI";
                console.log("type of shift" + typeOfShift);
              } else {
                typeOfShift = "addShift"; // or recurring/serviceShift based on logic
                console.log("type of shift" + typeOfShift);
              }

              generateAndSendNotification({
                role: this.addShiftData.AddShiftRole,
                strdate: this.addShiftData.AddShiftStartDate,
                staffId: "",
                isRjectedAllocation: false,
                rejectedStaffEmail: rejectedStaffEmail,
                facilityValue: this.addShiftData.AddShiftFacilityValue,
                typeofshift: typeOfShift,
                ShiftId: '',
                groupShift: false,
                endDate: this.addShiftData.AddShiftEndDate,
                shiftType: this.addShiftData.AddShiftType,
                startTime: this.addShiftData.AddShiftStartTime,
                endTime: this.addShiftData.AddShiftEndTime,
                address: this.formattedAddress,
                latitude: this.address.latitude,
                longitude: this.address.longitude
              }).then((response) => { });
              console.log(
                "send email parameters" +
                this.selectedShiftId +
                "" +
                this.addShiftData.AddShiftRole +
                "" +
                this.addShiftData.AddShiftFacilityValue
              );
              sendShiftEmails({
                shiftId: this.selectedShiftId,
                roleId: this.addShiftData.AddShiftRole,
                facilityId: this.addShiftData.AddShiftFacilityValue,
                staffId: "",
                isrecur: false,
                Sdate: "",
                Edate: "",
                typeOfRecur: '',
                recurEvery: '',
                weeklyDays: [],
                monthlyDay: 0,
                groupShift: false,
                splitShift: false,
              }).then((response) => { });
            }
            this.isShowSpinner = false;
            // this.isEditShiftScreen=false;
            // this.disableTimeButton=false;
          } else {
            this.confirMationMessage("Error", result.message, "Error");
            this.isShowSpinner = false;
          }
        })
        .catch((error) => {
          console.log("error >>" + error);
        });
    } else {
      this.isShowSpinner = false;
      if (this.addShiftData.AddShiftDuration <= 0) {
        this.confirMationMessage(
          "Error",
          "Start time must be earlier than end time.",
          "Error"
        );
      }
    }
  }

 async handleAllocateToggle(event) {
    const staffId = event.currentTarget.dataset.id;
    const isChecked = event.target.checked;

    // update original list
    this.staffHorlyRateList = this.staffHorlyRateList.map((staff) =>
        staff.Id === staffId
            ? { ...staff, isAllocate: isChecked }
            : staff
    );


    // keep filtered list toggle state synced
    this.filteredStaffList = this.filteredStaffList.map((staff) =>
        staff.Id === staffId
            ? { ...staff, isAllocate: isChecked }
            : staff
    );


    const allocatedStaff = this.staffHorlyRateList.filter(
        (staff) => staff.isAllocate
    );

    this.finalAllocationList = allocatedStaff;

    console.log(
        "Updated Staff Hourly Rates (Checked Only):",
        JSON.stringify(this.finalAllocationList)
    );


    if (allocatedStaff.length > this.unallocatedCount) {
        this.confirMationMessage(
            "Error",
            "Exceeded shift allocation limit. No more staff can be allocated.",
            "Error"
        );

        this.isDisableAllocated = true;

    } else {
        this.isDisableAllocated = false;
    }
}

  async DocExpiryCheck(staffId, checkDateParam) {
    console.log("Parent record Id in addingPreTax: " + staffId);
    console.log("checkDateParam: " + checkDateParam);

    const response = await fetchStaff({ recordId: staffId }); // ⏳ wait for Apex
    console.log("staff list after save: " + JSON.stringify(response));
    console.log("response.length: " + Object.keys(response).length);

    let childRec = response.Child_Staffs__r || [];
    this.documentExpired = false; // reset flag
    let checkDate = checkDateParam ? new Date(checkDateParam) : new Date();

    for (let rec of childRec) {
      const isExpired =
        rec.Compliance__c === true &&
        new Date(rec.Expiry_Date__c) < checkDate;

      const isRejected = rec.Status__c === "Rejected";
      const isPending = rec.Status__c === "Pending";

      if (isExpired || isRejected || isPending) {
        this.documentExpired = true;
        break;
      }
    }
  }

  handleUnAllocated(event) {
    this.isHomeFlag = false;
    this.isUnallocateTable = false;
    this.isAllocateTable = true;
    //this.navigateTo = "AllocationShifts";
    this.navigateTo = "home";
    let shiftId = event.currentTarget.dataset.shiftid;
    this.unallocatedCount = event.currentTarget.dataset.quantity;
    this.selectedShiftId = shiftId;
    console.log(`Shift Id: ${this.selectedShiftId}`);
    this.selectedShiftDate = event.currentTarget.dataset.startdate;
    this.addShiftData.AddShiftType = event.currentTarget.dataset.shifttype;
    this.addShiftData.AddShiftFacilityValue = event.currentTarget.dataset.fac;
    let timeSplit = event.currentTarget.dataset.time.split('-');
    this.addShiftData.AddShiftStartTimeAMPM = timeSplit[0].trim();
    this.addShiftData.AddShiftEndTimeAMPM = timeSplit[1].trim();
    console.log(`AddShiftStartTimeAMPM: ${this.addShiftData.AddShiftStartTimeAMPM}`);
    console.log(`AddShiftEndTimeAMPM: ${this.addShiftData.AddShiftEndTimeAMPM}`);


    //console.log('sleepover shfit or not '+)
    this.hourlyRateLabel = event.currentTarget.dataset.shifttype == 'Sleepover Shift' ? 'Allowance' : 'Hourly Rate';
    this.headingLabel = "Shift Allocation";
    console.log("Eoi value==>" + event.currentTarget.dataset.eoivalue);
    this.isVisibleSaveButton = false;
    let facVal = [];
    console.log(" in if ");
    facVal.push(event.currentTarget.dataset.fac);

    console.log("number of facilities  ==>" + JSON.stringify(facVal));

    let filteredShiftList = this.unAllocatedTableList.filter(
      (staff) => staff.Id === shiftId
    );
    console.log("shift list" + JSON.stringify(filteredShiftList));
    getStaffHourlyRates({
      addShiftList: JSON.stringify(filteredShiftList),
      startdate: this.startdate,
      enddate: this.enddate,
      facilityVal: facVal
    })
      .then((result) => {
        this.staffHorlyRateList = JSON.parse(result);
        this.filteredStaffList = [...this.staffHorlyRateList];
        console.log(
          "Staff hourly rate " + JSON.stringify(this.staffHorlyRateList)
        );
      })
      .catch((error) => {
        console.error("Error fetching staff hourly rates:", error);
      });
  }
  async HandleAllocate(event) {
    // console.log('Updated Staff Hourly Rates (Checked Only):', JSON.stringify(this.finalAllocationList));
    // this.headingLabel='Allocate Staff';
    // Creating the allocation JSON using map function

    const staffIds = this.finalAllocationList.map(staff => staff.Id);

    console.log("Allocated Staff Ids:", staffIds);
    console.log("Allocated this.addShiftData.AddShiftStartDate :", this.addShiftData.AddShiftStartDate);
    console.log("Allocated this.addShiftData.AddShiftStartDate :", this.addShiftData.AddShiftStartTimeAMPM);
    console.log("Allocated this.addShiftData.AddShiftStartDate :", this.addShiftData.AddShiftEndTimeAMPM);
    const recurrenceDates = [this.addShiftData.AddShiftStartDate];
    this.showErrorModal = false;
    this.unavailableTemplate = false;

    const selectedFacility = this.facilityOptions.find(
      (f) => f.value === this.addShiftData.AddShiftFacilityValue
    );
    if (selectedFacility) {
      this.shiftPenaltyMode = selectedFacility.shiftPenaltyMode;

    }
    console.log('facilityMode =>' + this.shiftPenaltyMode);
    console.log('shiftType =>' + this.addShiftData.AddShiftType);


    const result = await validateStaffAvailabilityWithReasons({
      staffIds: staffIds,
      inputDates: recurrenceDates,
      startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
      endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
      isAvailability: 'Yes',
      isEditMode: false,
      currentShiftId: null,
      currentAvailabilityId: null,
      shiftFacilityId: this.addShiftData.AddShiftFacilityValue,
      shiftRole: this.addShiftData.AddShiftRole,
      shiftType: this.addShiftData.AddShiftType,
      otherGroupShiftShiftIds:null
    });
    console.log('validateStaffAvailability  result==> ' + JSON.stringify(result));
    const isOverlapping = this.handleNonRecurringValidation(result);
    console.log('isOverlapping==> ' + isOverlapping);
    if (!isOverlapping) {
      //    this.isShowSpinner = false;
      return;
    }

    const Unavailresult = await checkShiftWithinAvailability({
      staffIds: staffIds,
      inputDates: recurrenceDates,
      startTimeStr: this.addShiftData.AddShiftStartTimeAMPM,
      endTimeStr: this.addShiftData.AddShiftEndTimeAMPM,
      shiftType: this.addShiftData.AddShiftType,
      facilityMode: this.shiftPenaltyMode
    });
    console.log('result  in availability ' + JSON.stringify(Unavailresult));
    if (Unavailresult && Object.keys(Unavailresult).length > 0) {

      this.unavailableStaffNames = Object.values(Unavailresult.unavailableStaff);
        this.unavailableMarkedStaff = Object.values(Unavailresult.unavailableMarkedStaff || {});
      console.log('Unavailable staff:', JSON.stringify(this.unavailableStaffNames));
      // const names = this.unavailableStaffNames.join(', ');
      this.rejectedStaffNames = Unavailresult.rejectedStaffNames;
      console.log('rejectedStaffNames staff:', JSON.stringify(this.rejectedStaffNames));
      this.fatigueStaffNames = Unavailresult.fatigueStaffNames || [];
      this.schadsSleepoverWarningStaff = Unavailresult.schadsSleepoverWarningStaff || [];


      this.unavailableTemplate = this.unavailableStaffNames.length > 0 || this.rejectedStaffNames.length > 0 || this.fatigueStaffNames.length > 0 || this.schadsSleepoverWarningStaff.length > 0 ||
                     this.unavailableMarkedStaff.length > 0;
      if (this.unavailableTemplate) {
        return;
      }
    }

    const exceededStaff = this.finalAllocationList.filter(
      (staff) => staff.exceedsLimit == true
    );
    const setHoursExceeded = this.finalAllocationList.filter(
      (staff) => staff.setHoursIndicator == true
    );
    const exceededNames = exceededStaff.map((staff) => staff.fullName);
    const setHoursStaffNames = setHoursExceeded.map((staff) => staff.fullName);
    if (setHoursStaffNames.length > 0) {
      this.setHoursIndicatorflag = true;
      this.isAllocateTable = false;
      this.setHoursIndiactorConfirmation = ` ${setHoursStaffNames.join(", ")}`;
    } else {
      // Check if any staff exceed the limit
      if (exceededNames.length > 0) {
        this.fatigueManagementFlag = true;
        this.isAllocateTable = false;
        this.fatigueConfirmationMessge = ` ${exceededNames.join(", ")}`;
      } else {
        this.fatigueManagementFlag = false;
        this.fatigueConfirmationMessge;
        this.isAllocateTable = true;
        this.handleFinalAllocate();
      }
    }
  }
  HandleNavigateToFatigue() {
    this.setHoursIndicatorflag = false;
    console.log(
      "finalAllocationList",
      JSON.stringify(this.finalAllocationList)
    );
    const exceededStaff = this.finalAllocationList.filter(
      (staff) => staff.exceedsLimit == true
    );
    const exceededNames = exceededStaff.map((staff) => staff.fullName);
    console.log("exceededStaff", JSON.stringify(exceededStaff));

    if (exceededNames.length > 0) {
      this.fatigueManagementFlag = true;
      this.isAllocateTable = false;
      this.fatigueConfirmationMessge = ` ${exceededNames.join(", ")}`;
    } else {
      this.fatigueManagementFlag = false;
      this.fatigueConfirmationMessge;
      //  this.isAllocateTable=true;
      this.handleFinalAllocate();
    }
  }
  handleDeselectStaff() {
    this.fatigueManagementFlag = false;
    this.setHoursIndicatorflag = false;
    this.isAllocateTable = true;
  }
  handleFinalAllocate() {
    console.log("in final allocate ");
    this.isShowSpinner = true;
     this.unavailableTemplate = false;
    let allocateStaffJSON = this.finalAllocationList.map((rec) => {
      return {
        Id: rec.Id,
        finalOverallRate: rec.Hourlyrate || 0,
        attendance: true,
        isRecurring: false,
        recurringTill: null,
        shiftWithStaffs: rec.shiftwithstaff
      };
    });

    console.log(
      "Final Allocated Staff JSON:",
      JSON.stringify(allocateStaffJSON)
    );
   
    console.log(`shiftDate: ${this.selectedShiftDate}`);
    let executedFromMobile = false;
    allocateMultipleStaff({
      shiftId: this.selectedShiftId,
      staffJson: JSON.stringify(allocateStaffJSON),
      shiftDate: this.selectedShiftDate,
      shiftwithstaff: [],
      isExecutedFromMobile: executedFromMobile
    })
      .then((result) => {
        console.log("Result: " + JSON.stringify(result));
        this.confirMationMessage(
          "Success",
          "Shifts allocated successfully.",
          "Success"
        );
        this.fatigueManagementFlag = false;
        this.unavailableTemplate = false;
         this.isShowSpinner = false;
         this.HandleBack();

        /* if (this.otherThanNDISUser == true && this.navigateTo == "home") {
          this.isHomeFlag = true;
          this.isAllocateTable = false;
          this.addShiftData.AddShiftRole = "";
          this.addShiftData.AddShiftParticipantValue = "";
          this.serviceType = false;
        } else {
         
        } */
      })
      .catch((err) => {
        console.error("Error fetching shift list:", err);
        this.isShowSpinner = false;
        this.fatigueManagementFlag = false;
        this.confirMationMessage(
          "Error",
          "Error Occured while allocating staff",
          "Error"
        );
      });
  }

  get isEditMode() {
    return this.headingLabel === "Edit Shift(s)";
  }

  async handleUnAllocatedEdit(event) {
    this.isHomeFlag = true;
    this.isUnallocateTable = false;
    this.isAllocateTable = false;
    this.allocateLabel = "Update";
    this.serviceType = false;
    this.savButtonDisable = false;
    this.isEditShiftScreen = true;
    this.isNotificationVisible = false;
    this.disableRole = true;
    this.headingLabel = "Edit Shift(s)";
    this.disableTimeButton = true;
    this.isVisibleSaveButton = true;
    this.navigateTo = "AllocationShifts";
    this.finalSelectedFacilities = this.finalSelectedFacilities;
    this.participantAddressCheckBox = false;
    this.addNewAddressCheckBox = false;
    this.addressValueCheckbox = false;

    const shiftData = this.unAllocatedTableList.find(
      (shift) => shift.Id === event.currentTarget.dataset.shiftid
    );
    console.log("Shift row:", JSON.stringify(shiftData));

    if (shiftData) {
      this.addShiftData = {
        AddShiftId: shiftData.Id,
        AddShiftStartDate: shiftData.Start_Date__c,
        AddShiftEndDate:shiftData.End_Date__c,
        AddShiftStaffValue: null,
        AddShiftFacilityValue: shiftData.Facility__c,
        AddShiftRole: shiftData.Role__c,
        AddShiftType: shiftData.Shift_Type__c,
        AddShiftBreak: shiftData.Break__c,
        AddShiftDuration: shiftData.Duration__c,
        AddShiftStartTime: this.convertTo24HourFormat(
          shiftData.Start_Time_Text__c.toLowerCase()
        ),
        AddShiftStartTimeAMPM: shiftData.Start_Time_Text__c.toUpperCase(),
        AddShiftEndTime: this.convertTo24HourFormat(shiftData.End_Time_Text__c),
        AddShiftEndTimeAMPM: shiftData.End_Time_Text__c.toUpperCase(),
        AddShiftnotification: shiftData.Send_Notification__c,
        AddShiftStaffHourlyRate: null,
        AddShiftQuantity: shiftData.Quantity__c,
        AddShiftNotes: shiftData.Shift_Notes__c ? shiftData.Shift_Notes__c : "",
        AddShiftEOI: shiftData.Is_EOI__c,
        AddShiftHoliday: shiftData.Public_holiday__c,
        AddShiftEnterOtherLocation: shiftData.Get_Facility__c,
        AddShiftParticipantAddressCheckbox:
          shiftData.Participant_Address_checkbox__c,
        EOI_Staff__c: shiftData.EOI_Staff__c,
        selectedServiceInfoJson: shiftData.Service_Details__c,
        AddShiftTypeName: shiftData.Shift_Name__c,
         shiftGeoLocation:shiftData.Shift_Geo_Location__c =='Enabled' ?true:false
      };
      this.dispalyAmPMFormat();

      if (shiftData.Service_Details__c) {
        try {
          const serviceDetails = JSON.parse(shiftData.Service_Details__c);
          this.ServiceTypeIdInParticipant = serviceDetails.serviceTypeId;
          this.selectedServiceGroupId = serviceDetails.serviceGroupId;
          this.addShiftData.AddShiftParticipantValue =
            serviceDetails.participantId;

          console.log(
            "Parsed Service Type ID:",
            this.ServiceTypeIdInParticipant
          );
          console.log("Parsed Service Group ID:", this.selectedServiceGroupId);
          console.log(
            "Parsed Participant ID:",
            this.addShiftData.AddShiftParticipantValue
          );
        } catch (error) {
          console.error("Failed to parse Service_Details__c:", error);
        }
      }

      // Update EOI flag
      this.addShiftEOI = shiftData.Is_EOI__c === true;

      console.log("shiftData.Is_EOI__c >>", shiftData.Is_EOI__c);
      if (shiftData.Is_EOI__c == true) {
        this.isEoICheckBoxVisible = true;
      } else {
        this.isEoICheckBoxVisible = false;
      }
      console.log("this.isEoICheckBoxVisible >>", this.isEoICheckBoxVisible);

      this.selectedStaffIds = shiftData.EOI_Staff__c
        ? shiftData.EOI_Staff__c.split(",")
        : [];
      console.log("this.selectedStaffIds >>", this.selectedStaffIds);
      this.originalEOIStaffIds = [...this.selectedStaffIds];

      // Fetch staff and wait
        // await this.fetchEOIStaff();
/* 
      const selectedIds = this.selectedStaffIds || [];
      this.staffData = this.staffData.map((staff) => ({
        ...staff,
        isSelected: selectedIds.includes(staff.Id),
        isDisabled: this.headingLabel === "Edit Shift(s)" &&selectedIds.includes(staff.Id)
      })); */
      this.addNewAddressCheckBox = shiftData.Get_Facility__c;
      this.facilityAddressCheckbox = shiftData.Get_Facility__c ? false : true;
      this.address.street = shiftData.Location__Street__s;
      this.address.citySuburb = shiftData.Location__City__s;
      this.address.postalcode = shiftData.Location__PostalCode__s;
      this.address.provinceState = shiftData.Location__StateCode__s;
      this.address.country = shiftData.Location__CountryCode__s;
      this.AddShiftOriginalQuantity = shiftData.Quantity__c;
      this.address.latitude = shiftData.Location__Latitude__s;
      this.address.longitude = shiftData.Location__Longitude__s;
      console.log("latitude >>", this.address.latitude);
      console.log("longitude >>", this.address.longitude);
      this.jsonData2 = [
        {
          coords: {
            latitude: this.address.latitude,
            longitude: this.address.longitude
          }
        }
      ];
      this.setLatitudeLongitudeMarkersOnly();

      const selectedFacility = this.facilityOptions.find(
        (f) => f.value === this.addShiftData.AddShiftFacilityValue
      );
      if (selectedFacility) {
        this.shiftPenaltyMode = selectedFacility.shiftPenaltyMode;

      }

      // Extract Start Time values
      if (this.addShiftData.AddShiftStartTimeAMPM) {
        let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(" ");
        let [startHour, startMinute] = time.split(":");
        this.startTimeSelectedHour = startHour;
        this.startTimeSelectedMinute = startMinute;
        this.startTimeAMPM = period === "AM" ? "AM" : "PM"; // Store "AM" or "PM"
      }

      // Extract End Time values
      if (this.addShiftData.AddShiftEndTimeAMPM) {
        let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(" ");
        let [endHour, endMinute] = time.split(":");
        this.endTimeSelectedHour = endHour;
        this.endTimeSelectedMinute = endMinute;
        this.endTimeAMPM = period === "AM" ? "AM" : "PM"; // Store "AM" or "PM"
      }

      if (
        shiftData.Participant_Address_checkbox__c == true &&
        shiftData.Get_Facility__c == true
      ) {
        this.participantAddressCheckBox = true;
        this.addNewAddressCheckBox = false;
        this.addressValueCheckbox = true;
        this.serviceType = true;
        console.log(
          "this.participantAddressCheckBox  >>",
          this.participantAddressCheckBox
        );
        console.log(
          "this.addNewAddressCheckBox  >>",
          this.addNewAddressCheckBox
        );
        console.log("this.addressValueCheckbox  >>", this.addressValueCheckbox);
      }

      if (
        shiftData.Get_Facility__c == false &&
        shiftData.Participant_Address_checkbox__c == false
      ) {
        this.addressValueCheckbox = true;
      }

      if (this.otherThanNDISUser == true) {
        this.serviceType = true;
      }
    
     // await this.fetchEOIStaff();
      // this.facilityAddressCheckbox = shiftData.Get_Facility__c ? false : true;

      console.log("Shift row:", JSON.stringify(this.addShiftData));
    } else {
      console.error(
        "Shift not found for ID:",
        event.currentTarget.dataset.shiftid
      );
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

  handleRoleFilterChange(event) {
    console.log("Handle Role change  " + event.target.value);
    let role = event.target.value?.trim().toLowerCase(); // convert to lowercase
    console.log("this.headingLabel >>", this.headingLabel);

    if (this.headingLabel === "Add Shift(s)") {
      console.log("this.filteredRole >>", JSON.stringify(this.filteredRole));

      if (role == "all") {
        this.staffHorlyRateList = this.filteredRole;
        return;
      } else {
        if (this.filteredRole && Array.isArray(this.filteredRole)) {
          const filtered = this.filteredRole.filter((item) => {
            if (!item.role) return false;

            const roles = item.role
              .split(";")
              .map((r) => r.trim().toLowerCase());
            return roles.includes(role); // 'role' should already be lowercased
          });

          // ✅ Add serialNumber to each filtered item
          this.staffHorlyRateList = filtered.map((item, index) => {
            return {
              ...item,
              serialNumber: index + 1
            };
          });

          console.log(
            "Filtered staff hourly rate list >>",
            JSON.stringify(this.staffHorlyRateList)
          );
        }
      }
    } else {
      // fallback logic to call Apex
      let facVal = [];
      facVal.push(this.addShiftData.AddShiftFacilityValue);
      console.log("this.selectedShiftId >>", this.selectedShiftId);
      console.log(
        "this.unAllocatedTableList >>",
        JSON.stringify(this.unAllocatedTableList)
      );
      let filteredShiftList = this.unAllocatedTableList.filter(
        (staff) => staff.Id === this.selectedShiftId
      );
      console.log("shift list" + JSON.stringify(filteredShiftList));
      getStaffHourlyRates({
        addShiftList: JSON.stringify(filteredShiftList),
        startdate: this.startdate,
        enddate: this.enddate,
        facilityVal: facVal,
        filterRole: role
      })
        .then((result) => {
          this.staffHorlyRateList = JSON.parse(result);
          console.log(
            "Staff hourly rate " + JSON.stringify(this.staffHorlyRateList)
          );
        })
        .catch((error) => {
          console.error("Error fetching staff hourly rates:", error);
        });
    }
  }
  async processShifts(facilityId) {
    try {
      const data = await this.fetchShiftData(facilityId);
       console.log("Fetched Shift TYPE Records: ", JSON.stringify(data));
     this.shiftNameOptions = (data || [])
        .filter(option => option.Shift_Type__c !== 'Custom')
        .map(option => ({
            ...option,
            label: option.Name,
            value: option.Id
        }));
      console.log(
        "Fetched Shift TYPE Records: ",
        JSON.stringify(this.shiftNameOptions)
      );

      if (this.shiftNameOptions.length > 0) {
        this.otherThanNDISUser =
          this.shiftNameOptions[0].Facility__r.Type_of_Service__c != "NDIS";
      }

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
  getShiftTimingsByFacility(shifNames) {

    let startTime24 = this.formatMillisecondsToTime(shifNames[0].Start_Time__c);
    let endTime24 = this.formatMillisecondsToTime(shifNames[0].End_Time__c);
    const startAmPm = this.convertToAmPmObject(startTime24);
    const endAmPm = this.convertToAmPmObject(endTime24);
    console.log(
      "shift type " + JSON.stringify(shifNames[0].Shift_Type__c)
    );

    this.addShiftData.AddShiftType = shifNames[0].Shift_Type__c;
    this.addshiftMaxDuration = shifNames[0].Duration__c ? shifNames[0].Duration__c : 0;
    console.log(' this.addshiftMaxDuration ==> ' + this.addshiftMaxDuration);
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

    if (this.addShiftData.AddShiftType === "Custom") {
      this.addshiftMaxDuration = 0;
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
        this.addshiftMaxDuration += cs.Duration__c ? cs.Duration__c : 0;
      })

    }
    console.log('max duration in custom  ' + this.addshiftMaxDuration);
    if (
      this.addShiftData.AddShiftType != "Sleepover Shift" &&
      this.addShiftData.AddShiftDuration > this.addshiftMaxDuration && this.addshiftMaxDuration != 0
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
  }
  dispalyAmPMFormat() {
    if (this.addShiftData.AddShiftStartTimeAMPM) {
      let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(" "); // Split into "2:00" and "AM"
      let [startHour, startMinute] = time.split(":"); // Split "2:00" into hour and minute
      this.startTimeSelectedHour = startHour;
      this.startTimeSelectedMinute = startMinute;
      this.startTimeAMPM = period == "AM" ? "AM" : "PM"; // Store "AM" or "PM"
    }

    if (this.addShiftData.AddShiftEndTimeAMPM) {
      let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(" "); // Split into "2:00" and "AM"
      let [endHour, endMinute] = time.split(":"); // Split "2:00" into hour and minute
      this.endTimeSelectedHour = endHour;
      this.endTimeSelectedMinute = endMinute;
      this.endTimeAMPM = period == "AM" ? "AM" : "PM"; // Store "AM" or "PM"
    }
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
  get formattedAddress() {
    const parts = [
      this.address?.street,
      this.address?.citySuburb,
      this.address?.provinceState,
      this.address?.postalcode
    ].filter(part => part && part.trim() !== '');
    return parts.join(', ');
  }

  handleNonRecurringValidation(validationResult) {
    this.staffDateConflicts = [];

    for (const [staffId, dateReasons] of Object.entries(validationResult)) {
      if (Object.keys(dateReasons).length > 0) {
        const staffRecord = this.finalAllocationList.find(staff => staff.Id === staffId);
        const staffName = staffRecord ? staffRecord.fullName : 'Unknown Staff';

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
  closeErrorModal() {
    // Close the modal
    this.showErrorModal = false;
    // Clear the errors
    this.staffDateConflicts = [];
    this.unavailableStaffNames = [];
     this.unavailableMarkedStaff = [];
    this.rejectedStaffNames = [];
    this.unavailableTemplate = false;
    this.fatigueStaffNames = [];
    this.schadsSleepoverWarningStaff = [];


  }
  get hasUnavailableStaff() {
    return this.unavailableStaffNames && this.unavailableStaffNames.length > 0;
  }

  get hasRejectedStaff() {
    return this.rejectedStaffNames && this.rejectedStaffNames.length > 0; 
  }

  get hasFatigueStaff() {
    return this.fatigueStaffNames && this.fatigueStaffNames.length > 0;
  }
  get hasSchadsSleepoverWarning() {
    return this.schadsSleepoverWarningStaff?.length > 0;
  }
  get hasUnavailableMarkedStaff() {
    return this.unavailableMarkedStaff &&this.unavailableMarkedStaff.length > 0;
}

  handleRosterPasteShortcut(event) {

    const path =
      event.composedPath();

    const ignorePaste =
      path.some(
        el =>
          el?.dataset?.pasteIgnore === 'true' ||
          el?.classList?.contains(
            'ignore-roster-paste'
          )
      );

    // =========================================
    // ONLY RUN WHEN NOT IGNORING
    // =========================================
    if (!ignorePaste) {
      return
    }
  }
  get hasNoRecords() {
    return !this.filteredStaffList || this.filteredStaffList.length === 0;
}
handleAddShiftGeoLocationChange(event) {
    this.addShiftData = {
        ...this.addShiftData,
        shiftGeoLocation: event.target.checked
    };

    console.log('this.addShiftData.shiftGeoLocation =>', this.addShiftData.shiftGeoLocation);
}

}