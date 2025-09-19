import { LightningElement,track ,wire,api  } from 'lwc';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getStaffData from '@salesforce/apex/AddShiftStaffView.getStaffData';
import getNumberOfRecurrences from '@salesforce/apex/RosterCreationRecurringHnadler.getNumberOfRecurrences';
import StaffsRolesWiseList from '@salesforce/apex/StaffController.StaffsRolesWiseList';
import createAddShift from '@salesforce/apex/RosterCreation.createAddShift';
import getAvailableStaff from '@salesforce/apex/AddShiftController.getAvailableStaff';
import fetchFacilitiess from '@salesforce/apex/ClientSearchController.fetchFacilitiess';
import getClientFunds from '@salesforce/apex/ServiceSupportPlanHandler.getClientFunds';
import getNDISServiceLineItem from '@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem';
import getFacilityAddress from '@salesforce/apex/AddShiftController.getFacilityAddress';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getClientById from '@salesforce/apex/ClientDataController.getClientById';
import getSeriveList from '@salesforce/apex/ServiceSupportPlanHandler.getServicesByShift';
import getAddShiftDataById from '@salesforce/apex/AddShiftController.getAddShiftDataById';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
//import sendPushNotification from '@salesforce/apex/mobilePushNotificationController.sendPushNotification';
import generateAndSendNotification from '@salesforce/apex/MobileAppNotificationsV2.generateAndSendNotification';
import getJSONdata from '@salesforce/apex/GeoTaggingfromAWS.getS3JsonData';
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import LEAFLET from '@salesforce/resourceUrl/leaflet';
import getMultipleShiftsdata from '@salesforce/apex/AddShiftController.getMultipleShiftsdata';
import getStaffByStatus from '@salesforce/apex/StaffController.getStaffByStatus';
import getFatigueData from '@salesforce/apex/RosterCreation.getFatigueData';
import getAllShiftWithSatff from '@salesforce/apex/ShiftwithStaffController.getAllShiftWithSatff';
import updateShiftDetails from '@salesforce/apex/ShiftwithStaffController.updateShiftDetails';
import deleteCheckList from '@salesforce/apex/ShiftwithStaffController.deleteCheckList';
import getOverlappingShiftsData from '@salesforce/apex/AddShiftParticipantView.getOverlappingShiftsData';
import HolidaysPopup from '@salesforce/apex/RosterCreationRecurringHnadler.HolidaysPopup';
import getCatalogueData from '@salesforce/apex/StaffAvailabilityController.getCatalogueData';
import deleterecurShifts from  '@salesforce/apex/AddShiftStaffView.deleterecurShifts';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';

export default class TesseractAppsRosterCreation extends LightningElement {
      @api isstaffviewfromparent
     @track currentStartDate;
     @track groupedShifts = [];
        @track currentEndDate;
        @track weekDaysWithDates = [];
        @track currentStartOfWeek; // Tracks the start of the current week
        @track monthName ;
        @track OrgNisationRoles=[];
        @track facilityOptions = [];
        @track facilityValue=[];
        @track chosenRole=[];
        @track orgId;
        @track staffData=[];
        @track isModalOpen = false;
        @track modalStyle = '';
        @track RostersDataRoleWise=[{
                    RoleName: "",
                    isExpanded: false,
                    weekQuantity:[],
                    weekData: [
                        
                    ],
                    staffData: []
           }]
        
        @track isPopoverVisible = false;
        @track isPopoverVisibleforShiftType = false;
        @track groupedShiftsWithSelection = false;
        @track rollName;
        @track viewName;
      
        @track SelctedComboBoxRole;
        @track SelectedComboBoxFacility;
        @track isTooltip=false;  
        @track shiftTooltipInformation={} 
        @track selectedDate;
        @track selectedDate1 = false;
        get options() {
            return [
                { label: 'Accepted', value: 'Accepted' },
                { label: 'In Progress', value: 'InProgress' },
                { label: 'Completed', value: 'Completed' },
            ];
          }
        @track activeSections = [];
        @track isStaffView = true;
        @track isCalenderShiftView = false;
        @track address = {
            street:null,
            citySuburb:null,
            country:null,
            provinceState:null,
            postalcode:null,
            latitude :null,
            longitude :null

        };
        @track ChekListrows = []; // Array to store the dynamic rows
        comboboxOptions = [
          { label: 'Give Meds', value: 'Give Meds' },
          { label: 'Check BP', value: 'Check BP' },
          { label: 'Sugar Level Test', value: 'Sugar Level Test' }
        ];
        @track recurOptions=[{label: 'Daily',value: 'Daily'  },{ label: 'Fortnightly',value: 'Fortnightly' },{ label: 'Weekly',value: 'Weekly' }, { label: 'Monthly',value: 'Monthly' }]
        @track  SplitShiftRows = [];
        @track recurEveryOptions=[];
        @track RecurLabel='Day';
        @track RecurValue;
        @track isRecurWeekFlag=false;
        @track isRecurmontlyFlag=false;
        @track recurEveryValue;
        @track recurEndDate;
        @track recurOccurencesValue=0;
        @track addShiftData={}
        @track partcipantServiceData={
                staffHoulrlyrate:0,
                splitShift:false,
                splitShiftStartTime:null,
                splitShiftEndTime:null,
                seviceParticipantId:null,
                serviceType:null,
                serviceState:null,
                serviceSupportPlanId:null,
                fundTrackerId:null,
                serviceTypeName:null,


        }
        @track finalAddShiftData={
                  shiftaddress:null,
                  shiftDetails:null,
        }
        @track monthOfDay=0;
        @track weekDays=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        @track selectedDays = [];
        @track monthLyOptions=[];
        @track staffComboBoxOptions=[]
        @track shiftTypeOptions=[{label: 'General', value:'General'},{label:'Morning', value:'Morning'}, {label: 'Afternoon', value: 'Afternoon'},{label: 'Night', value: 'Night'},{label: 'Custom', value: 'Custom'},{label: 'Sleepover Shift', value: 'Sleepover Shift'}];
        @track longShiftOptions=[{label:'Morning', value:'Morning'}, {label: 'Afternoon', value: 'Afternoon'},{label: 'Night', value: 'Night'},{label: 'Sleepover Shift', value: 'Sleepover Shift'}]
        @track StaffHourlyRates={};
        @track AddShiftDayName;
        @track AddShiftAdrress={ }
        @track AddShiftRecurringCheckboxValue=false;
        @track ParticipantOptions=[];
        @track isSplitCheckbox =false;
        @track fundOption=[];
        @track SplitShiftRowId;
        @track TotalFunds;
        @track NdisServiceGroupName=false;
        @track servicePlan;
        @track stateValue='';
        @track hourlrRateLabel='Hourly Rate';
        @track hourlyrateDisable=true;
        get stateOptions(){
          return [{ label: 'ACT', value: 'ACT__c' },{ label: 'NSW', value: 'NSW__c' },{ label: 'NT', value: 'NT__c' },{ label: 'QLD', value: 'QLD__c' },{ label: 'SA', value: 'SA__c' }, { label: 'TAS', value: 'TAS__c' }, { label: 'VIC', value: 'VIC__c' }, { label: 'WA', value: 'WA__c' },];
        }
        @track serviceGroupName=[];
        @track ServiceStaffValue;
        @track AddShiftServicesData=[];
        @track serviceParticipant;
        @track serviceTableAddButton=false;
        @track serviceStaffHourlyRate=0;
        @track isDisableParticipantCheckBox=false;
        @track isDisableSaveButton=false;
        @track addNewAddressCheckBox=false;
        @track facilityAddressCheckbox=false; 
        @track participantAddressCheckBox=false;
        @track checkListDescription = '';
        @track isPublishShift=false;
        @track rosterPublishDateAndRole={};
        @track tableFlagFromParent=false;
        @track shiftStaffId='';
        @track servicesList=[]; // To hold the services data
        wiredServicesResult;
        @track isEditShiftScreenFlag=false;
        @track AddShiftIncludePartcipants=false;
        @track isIncludeParticipants=false;
        @track isServiceEdit=false;
        @track serviceEditID=false;
        @track tooltipStyle = '';
        @track isTooltip = false;
        @track tooltipStyle = ''; // Dynamically sets tooltip position
        @track shiftTooltipInformation = {};
        @track isShowSpinner=false;
        wiredStaffData;
        @track  startDate;
        @track endDate;
        @track ServiceTypeIdInParticipant;
        @track isAnotherParticipantCreationInEdit=false;
        @track includeParticipantEvent=false;
        @track postInsertOperation=false;
        @track disablePostInsertButtons=false;
        @track isNewInsertOperation=false;
        @track disableServiceSection=false;
        @track createShiftlabel='Create Shift';
        @track isDisbaleServiceButton=false;
        @track isDisbaleServiceButton1 = false;
        @track isCreateShiftButton=true;
        @track parentAddShiftId='';
        @track isVisibleCreateServicesButton=true;
        @track isVisiblePlusIcon=true;
        @track isParticipanTViewEnable=false;
        @track shifts;
        @track isweeklyDataTooltip=false;
        @track isActionTooltip = false;
       
      
    @track serviceEditTotalFund=[];
    @track serviceEditFundOption=[];
    @track serviceEditGroupName=[];
    @track NdisServiceGroupNameinEdit=false;
    @track ServiceTypeEditvalue=false;
    @track ServiceStateEditValue='';
    @track ServiceEditNdisValue;
    @track searchName='';
    @track searchTimeout; 
    @track organisationShiftTimes;
    @track startTimeSelectedHour=12;
    @track startTimeSelectedminute='00';
    @track endtimeSelectedHour=12;
    @track endtimeSelectedminute='00'; 
    @track startTimeAMPM =false
    @track endTimeAMPM=false;
    @track SplitShiftVisible=true;
    @track disableTimeButton=false;
    isListening = false; 
    showMuteIcon = false; 
    showClearIcon = false; 
    recognition; 
    @track showLocation=false;
    @track jsonData;
    @track mapMarkers = []; 
    @track selectedShiftStatus;
    @track isShowMap=false;
    @track hideLocation=false;
    @track isMapLoaded = false;
    @track map;
    @track jsonData;
    leafletInitialized = false;
    polyline;
    @track recurTemplate=false    
    @track sectionFlags = {
      
      };
    @track  moreShiftlist=[];
      colors = ['#008000', '#FFD700', '#FF0000', '#0000FF'];
      // colors = ['#49CE2D', '#FF9D59', '#3BC8E8', '#FF66AB'];

    @track staffComboBoxRoles=[];
    wiredRolesStaffData;
    @track RolesStaffId;
    @track roleOptions=[];
    @track shiftList = [];
    @track shiftList1 = [];
    @track ServiceWarningMessage=false;
    @track participantServiceDeleteInfo={};
    @track shiftDeleteCOnfirmationInfo={};
    @track shiftDeleteConfirmation=false;
    @track headingLabel='Create Shift';
    @track riskIndex;
    @track fatigueManagementFlag=false;
    @track weeklyDataforStaff = false;
    @track SelectedComments;
    @track shiftEnableGeolocation = false;
    @track shiftEnableSignin = false;
    @track shiftwithstaffId;
    @track staffIdforweekly;
    @track setHoursExceedsLimit=false;
    @track SrviceParticipantName;
    @track deletedChecklist=[];
    @track disableSplitTime=false;
    @track cutsomShiftTemplate=false;
    @track IsLongShift=false;
    @track LongShiftTimeSlots={};
    @track childRosterInvoices=false;
    @track AllServicesByRoles=[];
    @track serviceInvoiceFlag=false;
    @track participantIdInEdit;
    @track recurredShiftsDelete=false;
    @track HolidaySaveButton=true;
    @track isAutoschedule 
    @track finalSelectedFacilities=[];
    
    roleOptions = [
      { label: 'Admin', value: 'admin' },
      { label: 'Manager', value: 'manager' },
      { label: 'Staff', value: 'staff' }
  ];
  @track rateRows = [];
  
  StatusOptionsforfilter = [
    { label: 'Completed', value: 'Completed' },
    { label: 'In-progress', value: 'InProgress' },
    { label: 'Accepted', value: 'Accepted' }
  ];
      renderedCallback() {
        // Check if leaflet resources are already loaded
        if (this.leafletInitialized) {
            return;
        }
  
        // Load Leaflet.js and Leaflet.css files
        Promise.all([
            loadScript(this, LEAFLET + '/leaflet.js'),
            loadStyle(this, LEAFLET + '/leaflet.css')
        ])
        .then(() => {
            this.leafletInitialized = true;
        })
        .catch(error => {
            console.error('Error loading Leaflet:', error);
        });
    }
         
        @wire(getSeriveList, {shiftStaffId: '$shiftStaffId' })
        wiredServices(response) {
          this.servicesList=[];
            this.wiredServicesResult = response; // Track the result for refreshApex
            const { data, error } = response;
            if (data) {
                this.servicesList = data; // Assign data to servicesList
             console.log('Service List IN WIRE METHOD  '+JSON.stringify(this.servicesList));
            } else if (error) {
                console.error('Error fetching services:', error);
            }
        }
        @wire(getStaffData, { roles: '$chosenRole', startDate: '$startDate', endDate: '$endDate', facIdlist: '$facilityValue',  orgID: '$orgId', weekDataJson: '$weekDaysWithDatesJSON',name:'$searchName',
          shiftTypeList:'$shiftTypefilterValue',statusList:'$statusfilterValue'
        })
      wiredStaffDataFunction(result) {
          this.wiredStaffData = result;
         // console.log('Staff data fetched:', JSON.stringify(this.wiredStaffData));
          if (result.data) {
            this.childRosterInvoices=false;
             this.AllServicesByRoles=[];
              this.staffData = result.data;
              console.log('Staff data fetched:', JSON.stringify(this.staffData));  
          } else if (result.error) {
              console.error('Error fetching staff data:', result.error);
          }
      }

      
      fetchStaffRoles() {
        getStaffByStatus({ recordId: this.RolesStaffId })
            .then(data => {
                 // console.log('STAFF ROLES DATA  ',JSON.stringify(data) ); // Debugging line
                if (data && Array.isArray(data) && data.length > 0) {
                    let roleString = data[0].Role__c;
                   // console.log('STAFF ROLES DATA 1 ',roleString );
                    if (roleString) {
                        this.roleOptions = roleString.split(';').map(role => ({
                            label: role,
                            value: role
                        }));
                      //  console.log('STAFF ROLES: ', JSON.stringify(this.roleOptions));
                    } else {
                        this.roleOptions = [];
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching staff roles: ', error);
                this.roleOptions = [];
            });
    }


    handleMouseOver(event) {
      event.target.style.whiteSpace = 'normal';
      event.target.style.overflow = 'visible';
      event.target.style.textOverflow = 'unset';
      event.target.style.maxWidth = 'none';
      event.target.style.position = 'static'; // allow it to reflow
  }
  
  handleMouseOut(event) {
      event.target.style.whiteSpace = 'nowrap';
      event.target.style.overflow = 'hidden';
      event.target.style.textOverflow = 'ellipsis';
      event.target.style.maxWidth = '200px';
      event.target.style.position = 'relative';
  }
  
      
    connectedCallback() {
      
        window.addEventListener('scroll', this.handleScrollOrClick);
        window.addEventListener('click', this.handleOutsideClick);
        this.initializeWeek(new Date()); // Initialize with the current week
     
        getFacilityData().then(response => {
            this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }));
            this.organisationShiftTimes=response[0].Organisation__r;
          //  console.log('organisationShiftTimes' +JSON.stringify(this.organisationShiftTimes));
    
            if (!this.facilityValue) {
                this.facilityValue = []; // Ensure it's an array
            }
    
            if (this.facilityOptions.length > 0) {
                this.facilityValue.push(this.facilityOptions[0].value);
                this.SelectedComboBoxFacility = this.facilityOptions[0].value;
            }
        }).catch(err => {
            console.error(err);
        });
    
        organizationDetails().then(response => {
            this.orgId = response.listofPriceBook.Id;
    
            let orgRoles = response.listofPriceBook.Roles__c;
            this.OrgNisationRoles = orgRoles.split(";").sort().map((rec, index)  => {
              this.sectionFlags[rec] = index === 0;
                this.activeSections.push(rec);
                return { value: rec, label: rec };
            });
      // console.log('section falgs '+JSON.stringify(this.sectionFlags));
           
            if (!this.chosenRole) {
                this.chosenRole = [];
            }
            if (!this.SelctedComboBoxRole) {
                this.SelctedComboBoxRole = [];
            }
    
            if (localStorage.getItem('SelctedComboBoxRole')) {
                this.chosenRole.push(JSON.parse(localStorage.getItem('SelctedComboBoxRole')));
                this.SelctedComboBoxRole = JSON.parse(localStorage.getItem('SelctedComboBoxRole'));
            } else if (this.OrgNisationRoles.length > 0) {
                this.SelctedComboBoxRole=this.OrgNisationRoles[0].value;
                this.chosenRole.push(this.OrgNisationRoles[0].value)
            }
    
            
            if (!this.facilityValue) {
                this.facilityValue = [];
            }
            if (!this.SelectedComboBoxFacility) {
                this.SelectedComboBoxFacility = [];
            }
    
           
            if (localStorage.getItem('SelectedComboBoxFacility')) {
                this.facilityValue.push(JSON.parse(localStorage.getItem('SelectedComboBoxFacility')));
                this.SelectedComboBoxFacility = JSON.parse(localStorage.getItem('SelectedComboBoxFacility'));
            } else if (this.facilityOptions.length > 0) {
                this.SelectedComboBoxFacility=this.facilityOptions[0].value;
                this.facilityValue.push(this.facilityOptions[0].value);
            }
    
            if (this.orgId != null && this.chosenRole.length > 0) {
                const storedRoles = localStorage.getItem('rosterRoles');
                if (storedRoles) {
                    this.chosenRole = JSON.parse(storedRoles);
                }
    
                const storedFacilities = localStorage.getItem('rosterFacilities');
                if (storedFacilities) {
                    this.facilityValue = JSON.parse(storedFacilities);
                }
    
                console.log('Selected Roles:', JSON.stringify(this.chosenRole));
                console.log('Selected Facilities:', JSON.stringify(this.facilityValue));
    
                this.loadStaffData();
               this.loadStaffComboBox();
                   console.log('isstaffview  in roster '+this.isstaffviewfromparent);
               if(this.isstaffviewfromparent ==true){
               
                   this.viewName = 'Staff View'; // This for the Toggle bar for view
               }else{
                this.isParticipanTViewEnable = true;
                this.viewName = 'Participant View';
               }
               
    
               
                this.isAutoSchedule = true;
                this.facIdlist = [...this.facIdlist];
            }
        });
    
        this.recurEveryOptions = this.generateOptions(30);
        this.monthLyOptions = this.generateOptions(31);
        //this.fetchShifts();
       // console.log('Role options:', JSON.stringify(this.OrgNisationRoles));
    }

    disconnectedCallback() {
      // Remove event listeners when component is destroyed
      window.removeEventListener('scroll', this.handleScrollOrClick);
      window.removeEventListener('click', this.handleOutsideClick);
  }
    
  loadStaffComboBox(){
    this.staffComboBoxOptions=[];
    StaffsRolesWiseList( { orgId: this.orgId,facIdlist:this.facilityValue, roles: this.chosenRole,name:''}).then(response=> {
             
      this.staffComboBoxOptions= response.map(rec => {
        this.StaffHourlyRates[rec.Id] = { "staffHoulryRate": rec };
        return {
          label: rec.NameToDisplay__c,
          value: rec.Id
        };
       });
     // console.log('staff list'+JSON.stringify(this.staffComboBoxOptions));
      });
    //  console.log('staff hOURLY RATES '+JSON.stringify(this.StaffHourlyRates));
  }

    staffSlistOnSelection(){
        this.staffComboBoxOptions=[];
        let StaffRole=[];
       // console.log('stafff Roles '+this.addShiftData.AddShiftRole);
        StaffRole.push(this.addShiftData.AddShiftRole);
        console.log('stafff Roles1 '+JSON.stringify(StaffRole));
           StaffsRolesWiseList( { orgId: this.orgId,facIdlist:this.facilityValue, roles: StaffRole,name:''}).then(response=> { 
           
            this.staffComboBoxOptions= response.map(rec => {
              this.StaffHourlyRates[rec.Id] = { "staffHoulryRate": rec };
              return {
                label: rec.NameToDisplay__c,
                value: rec.Id
              };
            });
          // console.log('staff in create edit list'+JSON.stringify(this.staffComboBoxOptions));
         
            });
     }
     get weekDaysWithDatesJSON() {
      return JSON.stringify(this.weekDaysWithDates);
  }
        get formattedDate() {
            if (this.currentStartOfWeek) {
                const year = this.currentStartOfWeek.getFullYear();
                const month = String(this.currentStartOfWeek.getMonth() + 1).padStart(2, '0');
                const day = String(this.currentStartOfWeek.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            return '';
        }
    
        initializeWeek(startDate) {
            this.currentStartOfWeek = this.getStartOfWeek(startDate);
            this.weekDaysWithDates = this.calculateWeekDaysWithDates(this.currentStartOfWeek);
            console.log('Days '+JSON.stringify(this.weekDaysWithDates));
            

           // this.monthName = this.returnMonthName(this.currentStartOfWeek);
        }
    
        getStartOfWeek(date) {
            const startOfWeek = new Date(date);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday as start of the week
            return startOfWeek;
        }
    
        calculateWeekDaysWithDates(startOfWeek) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weekDaysWithDates = [];
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startOfWeek);
                currentDate.setDate(startOfWeek.getDate() + i);
    
                // Format date as DD-MM-YYYY
                const day = String(currentDate.getDate()).padStart(2, '0');
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const year = currentDate.getFullYear();
                const formattedDate = `${day}-${month}-${year}`;
                const uiFormattedDate=`${day}/${month}/${year}`;
    
                weekDaysWithDates.push({
                    day: days[i],
                    weekDays: formattedDate,
                    UiFormattedDate:uiFormattedDate
                });
            }
            return weekDaysWithDates;
        }
    
        returnMonthName(startOfWeek) {
            const monthName = startOfWeek.toLocaleString('default', { month: 'long' }); // Get the full month name
            return monthName;
        }
    
        loadPreviousWeek() {
            const previousWeekStart = new Date(this.currentStartOfWeek);
            previousWeekStart.setDate(this.currentStartOfWeek.getDate() - 7);
            this.initializeWeek(previousWeekStart);
            this.loadStaffData();
        }
    
        loadNextWeek() {
            const nextWeekStart = new Date(this.currentStartOfWeek);
            nextWeekStart.setDate(this.currentStartOfWeek.getDate() + 7);
            this.initializeWeek(nextWeekStart);
            this.loadStaffData();
        }
    
        handleDatePickerChange(event) {
            const selectedDate = new Date(event.target.value); // Input date from date picker
            if (isNaN(selectedDate)) {
                this.initializeWeek(new Date()); // Load with today's date if invalid
            } else {
                this.initializeWeek(selectedDate);
            }
            this.loadStaffData();
        }
         // Event handler for combobox changes
         handleChange(event) {
            const selectedValue = event.target.value; // Current combobox value
            const name = event.target.name; // Name of the combobox
    
           // console.log('Combobox name:', name);
           // console.log('Selected value:', selectedValue);
    
            if (name =='FacilityComboBox') {
               // console.log('Updating facility selection');
               this.SelectedComboBoxFacility=selectedValue;
                this.facilityValue = [selectedValue]; // Update the selected facility (single-select example)
            } else if (name =='RoleComboBox'){
              //  console.log('Updating role selection');
              this.SelctedComboBoxRole=selectedValue;
                this.chosenRole = [selectedValue]; // Update the selected role (single-select example)
            }
            localStorage.setItem('SelctedComboBoxRole', JSON.stringify(this.SelctedComboBoxRole));
            localStorage.setItem('SelectedComboBoxFacility', JSON.stringify(this.SelectedComboBoxFacility));
           
            this.loadStaffData();
        }
    
        // Method to load staff data from Apex
        loadStaffData() {
            this.isShowSpinner=true;
            console.log('Week days start ',(this.weekDaysWithDates[0]).weekDays);
            console.log('Week days end',(this.weekDaysWithDates[6]).weekDays);
            let startparts = (this.weekDaysWithDates[0]).weekDays.split('-');
    
            this.startDate = startparts[2]+'-'+startparts[1]+'-'+startparts[0];
            let endparts = (this.weekDaysWithDates[6]).weekDays.split('-');
            this.endDate = endparts[2]+'-'+endparts[1]+'-'+endparts[0];
            console.log('Week days start ',this.startDate);
            console.log('Week days end',this.endDate);
            this.refreshStaffData();
              
        }
        @track staffIdonweeklycanlander;
        @track staffFullName;
        handleWeeklyCalander(event) {
          // Example: Fire a custom event or handle logic here
            console.log('Clicked: ' + this.startDate + ' ' + this.endDate);
            this.staffIdonweeklycanlander = event.target.closest('.card').dataset.id;
            console.log('Clicked Role:'+event.currentTarget.dataset.staffroll);
            this.rollName = event.currentTarget.dataset.staffroll;
            const staffId = this.staffIdonweeklycanlander;
            console.log('Clicked Staff ID:', staffId);
            console.log('Clicked Staff ID:', staffId);
            const stafffirstname = event.currentTarget.dataset.stafffirstname;
            const stafflastname = event.currentTarget.dataset.stafflastname;
            console.log('Clicked Staff firstname:', stafffirstname);
            console.log('Clicked Staff lastname:', stafflastname);
            this.staffFullName = stafffirstname + ' ' + stafflastname;
            this.weeklyDataforStaff = true;
            this.refreshShifts(staffId);
        }

        scrollLeft() {
          let newStartDate = new Date(this.startDate);
          newStartDate.setDate(newStartDate.getDate() - 7); // Move back exactly 7 days
      
          let formattedStartDate = newStartDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
          // Calculate the end date by adding 6 more days (to get full week)
          let endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() + 6);
          let formattedEndDate = endDate.toISOString().split('T')[0];

          const staffId = this.staffIdonweeklycanlander;
          this.startDate = formattedStartDate;
          this.endDate = formattedEndDate;
          this.initializeWeek(this.startDate);
          this.refreshShifts(staffId);
      }

      scrollRight() {
        let newStartDate = new Date(this.startDate);
        newStartDate.setDate(newStartDate.getDate() + 7); // Move forward 7 days
    
        let formattedStartDate = newStartDate.toISOString().split('T')[0];
    
        let endDate = new Date(newStartDate);
        endDate.setDate(endDate.getDate() + 6);
        let formattedEndDate = endDate.toISOString().split('T')[0];
    
        console.log('➡️ Next Week: Start:', formattedStartDate, '| End:', formattedEndDate);

        const staffId = this.staffIdonweeklycanlander;
        this.startDate = formattedStartDate;
        this.endDate = formattedEndDate;
        //this.initializeWeek(this.startDate);
        this.refreshShifts(staffId);
    }
      

        refreshShifts(staffId) {
          console.log('Clicked: ' + this.startDate + ' ' + this.endDate);
          getAllShiftWithSatff({ staffId: staffId, StartDate: this.startDate, EndDate: this.endDate })
                .then(result => {
                    console.log('Shifts:', result);
                    // Do something with the result, like updating a tracked property
                      this.shifts = result;
                      this.groupShiftsByDate();
              })
            .catch(error => {
                console.error('Error fetching shifts:', error);
              });
        }

              groupShiftsByDate() {
                const grouped = {};
            
                this.shifts.forEach(shift => {
                    const rawDate = new Date(shift.Date__c);
                    const formattedDate = `${String(rawDate.getDate()).padStart(2, '0')}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${rawDate.getFullYear()}`;
            
                    if (!grouped[formattedDate]) {
                        grouped[formattedDate] = {
                            day: rawDate.toLocaleDateString('en-US', { weekday: 'short' }),
                            date: formattedDate,
                            allShifts: []
                        };
                    }
            
                    grouped[formattedDate].allShifts.push(shift);
                });
            
                this.groupedShifts = Object.values(grouped)
                    .sort((a, b) => {
                        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
                        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
                        return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
                    })
                    .map(group => {
                        const firstShift = group.allShifts[0];
                        const remainingShifts = group.allShifts.slice(1);
            
                        return {
                            day: group.day,
                            date: group.date,
                            firstShift: {
                                ...firstShift,
                                isExpanded: false,
                                toggleLabel: remainingShifts.length > 0 ? 'More' : '',
                                showMore: remainingShifts.length > 0,
                                clientPicture: firstShift.Services_and_Support_Plans__r?.[0]?.Client__r?.Picture__c,
                                clientFirstName: firstShift.Services_and_Support_Plans__r?.[0]?.Client__r?.First_Name__c || firstShift.Add_Shift__r?.Role__c,
                                clientLastName: firstShift.Services_and_Support_Plans__r?.[0]?.Client__r?.Last_Name__c || ''
                            },
                            remainingShifts: remainingShifts.map(shift => ({
                                ...shift,
                                clientPicture: shift.Services_and_Support_Plans__r?.[0]?.Client__r?.Picture__c,
                                clientFirstName: shift.Services_and_Support_Plans__r?.[0]?.Client__r?.First_Name__c || shift.Add_Shift__r?.Role__c,
                                clientLastName: shift.Services_and_Support_Plans__r?.[0]?.Client__r?.Last_Name__c || ''
                            }))
                        };
                    });
            }            
      

      get groupedShiftsWithSelection() {
        return this.groupedShifts.map(group => ({
            ...group,
            isSelected: group.date === this.selectedDate
        }));
    }    


      handleMore(event) {
        event.preventDefault();
        const clickedDate = event.currentTarget.dataset.date;
    
        // Toggle the isExpanded for that date group
        this.groupedShifts = this.groupedShifts.map(group => {
            if (group.date === clickedDate) {
                const updatedFirstShift = {
                    ...group.firstShift,
                    isExpanded: !group.firstShift.isExpanded,
                    toggleLabel: group.firstShift.isExpanded ? 'More' : 'Less'
                };
                return {
                    ...group,
                    firstShift: updatedFirstShift
                };
            }
            return group;
        });
    }    

    handleShiftClick(event){
      event.preventDefault();
      this.shiftwithstaffId = event.target.dataset.id;
      this.staffIdforweekly = event.target.dataset.staff;
      this.shiftEnableGeolocation = event.target.dataset.staffgeolocation=='true'?true:false;
      console.log('this.shiftwithstaffId:', this.shiftwithstaffId);
      console.log('this.staffIdforweekly:', this.staffIdforweekly);
      console.log('this.shiftEnableGeolocation:', this.shiftEnableGeolocation);
      this.isActionTooltip = true;
    }
    handleConfirmReset() {
      this.isActionTooltip = false;
      
      console.log('🟢 Sending Data:');
      console.log('shiftEnableGeolocation:', this.shiftEnableGeolocation);
      console.log('shiftEnableSignin:', this.shiftEnableSignin);
      console.log('SelectedComments:', this.SelectedComments);
      console.log('staffIdforweekly:', this.staffIdforweekly);
      console.log('shiftwithstaffId:', this.shiftwithstaffId);

      // Call Apex method
      updateShiftDetails({
          enableGeolocation: this.shiftEnableGeolocation,
          enableSignin: this.shiftEnableSignin,
          selectedComments: this.SelectedComments,
          staffId: this.staffIdforweekly,
          shiftwithstaffId: this.shiftwithstaffId
      })
      .then(() => {
          this.confirMationMessage('Success', 'Shift details updated successfully', 'success');
          console.log('✅ Shift updated successfully');
      })
      .catch(error => {
          console.error('❌ Error updating shift:', JSON.stringify(error));
          this.confirMationMessage('Error', 'Error updating shift details', 'error');
      });
      this.shiftEnableGeolocation = false;
      this.shiftEnableSignin = false;
      this.SelectedComments = '';
      this.staffIdforweekly = '';
      this.shiftwithstaffId = '';
    }
    handleCloseActionTooltip(event){
      this.isActionTooltip = false;
      this.shiftEnableGeolocation = false;
      this.shiftEnableSignin = false;
      this.SelectedComments = '';
      this.staffIdforweekly = '';
      this.shiftwithstaffId = '';
    }
    onchangeGeoLocation(event){
      console.log('onchangeGeoLocation'+event.target.checked);
      this.shiftEnableGeolocation = event.target.checked;
      console.log('this.shiftEnableGeolocation'+this.shiftEnableGeolocation);
    }
    onchangeEnableSignin(event){
      console.log('onchangeGeoLocation'+event.target.checked);
      this.shiftEnableSignin = event.target.checked
      console.log('this.shiftEnableSignin'+this.shiftEnableSignin);
    }
    onchangeComments(event){
      console.log('onchangeComments'+event.target.value);
      this.SelectedComments = event.target.value;
      console.log('this.SelectedComments'+this.SelectedComments);
    }  

    closeTooltip1(event){
      this.isweeklyDataTooltip = false;
      this.selectedDate1 = false;
    }
    

    handleClose(event) {  
      this.isShowSpinner=true;
      // Get today's date
      let today = new Date();
      
      // Find the start of the current week (Monday)
      let currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - today.getDay() + 1); // Adjust to Monday
  
      let formattedStartDate = currentMonday.toISOString().split('T')[0];
  
      // Calculate the end of the current week (Sunday)
      let currentSunday = new Date(currentMonday);
      currentSunday.setDate(currentMonday.getDate() + 6);
      let formattedEndDate = currentSunday.toISOString().split('T')[0];
  
      console.log('🔄 Reset to Current Week: Start:', formattedStartDate, '| End:', formattedEndDate);
  
      this.startDate = formattedStartDate;
      this.endDate = formattedEndDate;
      this.initializeWeek(this.startDate);
      this.weeklyDataforStaff = false;
      setTimeout(() => {
        this.isShowSpinner=false;  
      },800)
      
  }

        refreshStaffData() {
          //this.staffData=[];
          this.isShowSpinner = true;
          refreshApex(this.wiredStaffData)
              .finally(() => {
                setTimeout(() => {
                  this.isShowSpinner=false;
                },800)
              });
      }
        togglePopover() {
    console.log('🔁 Toggling Popover. Current state:', this.isPopoverVisible);

    // Flip the visibility
    this.isPopoverVisible = !this.isPopoverVisible;

    // Delay outside click activation to avoid instant close on opening
    if (this.isPopoverVisible) {
        setTimeout(() => {
            console.log('✅ Outside click detection enabled');
            this.listenForOutsideClick = true;
        }, 0);
    } else {
        console.log('❌ Popover closed manually');
        this.listenForOutsideClick = false;
    }
}

          closePopover() {
            this.isPopoverVisible = false;
            this.listenForOutsideClick = false;
        }

        togglePopoverforShiftType(){
          this.isPopoverVisibleforShiftType = !this.isPopoverVisibleforShiftType;

          if(this.viewName == 'Participant View'){
               this.isPopoverVisibleforShiftType = true;
          } else if(this.viewName == 'Staff View'){
            this.isPopoverVisible = false;
          }
          if (this.isPopoverVisibleforShiftType) {
        setTimeout(() => {
            this.listenForOutsideClickShiftType = true;
        }, 0);
    } else {
        this.listenForOutsideClickShiftType = false;
    }
          
        }

        closePopoverforShiftType(){
          this.isPopoverVisibleforShiftType = false;
          this.listenForOutsideClickShiftType = false;
        }
        @track shiftTypefilterValue = [];
        @track statusfilterValue = [];
        handleCheckBoxChange(event) {
            const selectedValues = event.detail.value;
            console.log('Selected Roles:', JSON.stringify(selectedValues));
    
            if (event.target.name === 'progress') {
              // Update chosen roles with selected values from the checkbox group
              this.chosenRole = [...selectedValues];
            } else if (event.target.name === 'Facility') {
              // Update selected facilities with selected values from the checkbox group
              this.facilityValue = [...selectedValues];
            } else if(event.target.name === 'ShiftTypeforFilter') {
              this.shiftTypefilterValue = [...selectedValues];
              console.log('this.shiftTypefilterValue==>'+this.shiftTypefilterValue);
            } else if(event.target.name === 'StatusforFilter') {
              this.statusfilterValue = [...selectedValues];
              console.log('this.statusfilterValue==>'+this.statusfilterValue);
            } 
            this.SelctedComboBoxRole = '';
            this.SelectedComboBoxFacility = '';
            localStorage.setItem('rosterRoles', JSON.stringify(this.chosenRole));
            localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue));
            console.log('Selected Roles:', JSON.stringify(this.chosenRole));
            console.log('Selected Facilities:', JSON.stringify(this.facilityValue));
            this.loadStaffData();
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
          uiStatus:event.currentTarget.dataset.status,
          shiftId: event.currentTarget.dataset.id,
          participantimage: event.currentTarget.dataset.participantimage,
          participantname: event.currentTarget.dataset.participantname,
          roleName:event.currentTarget.dataset.role,
          isRoleName:event.currentTarget.dataset.participantname ?false:true,
          position: `top: ${mouseY + 10}px; left: ${leftPosition}px;`, // Offset by 10px for better visibility
          recurstatus:event.currentTarget.dataset.recurstatus,
          refid:event.currentTarget.dataset.refid,
          Shiftdate:event.currentTarget.dataset.weekdate

      };
      console.log('Tooltip visible:',JSON.stringify( this.shiftTooltipInformation));
  
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
    // Tooltip close (no flag needed)
    const tooltip = this.template.querySelector('.tooltip');
    if (tooltip && !tooltip.contains(event.target)) {
        this.closeTooltip();
    }

    // Participant popover
    // Sidebar 1: Participant View - Facilities & Roles
    if (this.listenForOutsideClick) {
        const participantPopover = this.template.querySelector('[data-id="participant-popover"]');
        if (participantPopover && !participantPopover.contains(event.target)) {
            console.log('🟥 Outside click: closing participantPopover');
            this.isPopoverVisible = false;
            this.listenForOutsideClick = false;
        }

        const rolePopover = this.template.querySelector('[data-id="participant-role-popover"]');
        if (rolePopover && !rolePopover.contains(event.target)) {
            console.log('🟥 Outside click: closing participant-role-popover');
            this.isPopoverVisible = false;
            this.listenForOutsideClick = false;
        }
    }

    // ✅ Shift Type popover
    if (this.listenForOutsideClickShiftType) {
        const shiftTypePopover = this.template.querySelector('[data-id="shift-type-popover"]');
        if (shiftTypePopover && !shiftTypePopover.contains(event.target)) {
            console.log('⬅️ Outside click detected: closing Shift Type popover');
            this.isPopoverVisibleforShiftType = false;
            this.listenForOutsideClickShiftType = false;
        }
    }
    if (this.listenForOutsideClickShiftType) {
        const shiftTypePopoverParticipant = this.template.querySelector('[data-id="shift-type-popover-participant"]');
        if (shiftTypePopoverParticipant && !shiftTypePopoverParticipant.contains(event.target)) {
            console.log('⬅️ Outside click: closing Participant Shift Type sidebar');
            this.isPopoverVisibleforShiftType = false;
            this.listenForOutsideClickShiftType = false;
        }
    }
};

      closeTooltip(event) {
       this.isTooltip=false;
      }
      emptyFields(){
        this.addShiftData={
          AddShiftStartDate:null,
          AddShiftStaffValue:null,
          AddShiftFacilityValue:null,
          AddShiftRole:null,
          AddShiftType:null,
          AddShiftBreak:null,
          AddShiftDuration:0,
          AddShiftStartTime:null,
          AddShiftStartTimeAMPM:null,
          AddShiftEndTime:null,
          AddShiftEndTimeAMPM:null,
          AddShiftnotification:false,
          AddShiftStaffHourlyRate:0,
          AddShiftQuantity:1,
          AddShiftNotes:null,
          AddShiftEOI:false  ,
          AddShiftId:null  , 
          AddShiftHoliday:false ,
          AddShiftEnterOtherLocation:false,
          AddShiftParticipantAddressCheckbox:false,
          AddShiftEndDate:null

        }
        this.AddShiftAdrress={
          street:null,
          citySuburb:null,
          country:null,
          provinceState:null,
          postalcode:null
      }
      this.SplitShiftRows=[];
      this.ChekListrows=[];
      this.serviceParticipant='';
      this.disablePostInsertButtons=false;
      this.LongShiftTimeSlots={};
      this.EmptyAddressFields();
      this.rateRows=[];
      }
      handleConfirmSetHours(event){
        this.emptyFields();
        let holiday= event.currentTarget.dataset.isholiday;
        let shiftdate=event.currentTarget.dataset.weekdate;
        let role=event.currentTarget.dataset.role;
        console.log('role '+role);
        this.addShiftData.AddShiftStaffValue=event.currentTarget.dataset.staffid;
        this.RolesStaffId=event.currentTarget.dataset.staffid;
        this.addShiftData.AddShiftRole=role;
        this.addShiftData.AddShiftStartDate=shiftdate;
        this.addShiftData.AddShiftHoliday=holiday =="true"?true:false ;
        this.AddShiftDayName=event.currentTarget.dataset.weekname;
        this.IsLongShift=false;
        this.ServiceStaffValue=event.currentTarget.dataset.staffid;
          console.log('exceed hours '+event.currentTarget.dataset.exceedhours);
           console.log('sethours hours '+event.currentTarget.dataset.sethours);
        if(parseFloat(event.currentTarget.dataset.exceedhours)>parseFloat(event.currentTarget.dataset.sethours)){
          this.isCalenderShiftView = false; 
          this.setHoursExceedsLimit=true;
        }else{
          this.finalSelectedFacilities=[];

          console.log(' selected facilities '+JSON.stringify(this.facilityValue));
          console.log(' ORG facilities '+JSON.stringify(this.facilityOptions));
          this.finalSelectedFacilities = this.facilityOptions.filter(rec =>
          this.facilityValue.includes(rec.value)
          );
          console.log(' selected facilities '+JSON.stringify(this.finalSelectedFacilities)); 
          if(this.finalSelectedFacilities.length===0){
            this.confirMationMessage('Error','Please select at least one facility to create the shift.','Error');
            return ;
          }
          this.isCalenderShiftView = true; 
          this.setHoursExceedsLimit=false;
          this.createCalenderShift();
        }
      
      }
      createCalenderShift(){
          this.finalSelectedFacilities=[];

          console.log(' selected facilities '+JSON.stringify(this.facilityValue));
          console.log(' ORG facilities '+JSON.stringify(this.facilityOptions));
          this.finalSelectedFacilities = this.facilityOptions.filter(rec =>
          this.facilityValue.includes(rec.value)
          );
          console.log(' selected facilities '+JSON.stringify(this.finalSelectedFacilities)); 
          if(this.finalSelectedFacilities.length===0){
            this.confirMationMessage('Error','Please select at least one facility to create the shift.','Error');
            return ;
          }
       
        this.isCalenderShiftView = true; 
        this.setHoursExceedsLimit=false;

        this.addShiftData.AddShiftFacilityValue=this.SelectedComboBoxFacility;
        this.addShiftData.AddShiftnotification=true;
        this.addShiftData.AddShiftType='';
        this.isEditShiftScreenFlag=false;
        this.isIncludeParticipants=false;
        this.AddShiftIncludePartcipants=true;
        this.isCreateShiftButton=true;
        this.isStaffView=true;
        this.SplitShiftRows=[];
        this.isNewInsertOperation=true;
        this.startTimeSelectedHour = 12;
        this.startTimeSelectedMinute = '00';
        this.startTimeAMPM = false; 
        this.endTimeSelectedHour = 12;
        this.endTimeSelectedMinute = '00';
        this.endTimeAMPM = false; // Store "AM" or "PM"
        this.cutsomShiftTemplate=false;
        this.riskindex='';
        this.handleLinkParticipants();
        this.handleAddSplitShiftRow();
       
        this.facilityAddressCheckbox=true;
        this.SplitShiftVisible=false;
        this.AddShiftRecurringCheckboxValue=false;
          this.getFacilityAddress();
        this.isDisableParticipantCheckBox=true;
       /*  if(this.isSplitCheckbox== true||this.serviceParticipant ==null){
          this.isDisableParticipantCheckBox=true;
        } */
          this.isSplitCheckbox=false;
         
        
      //  console.log('Add shift data '+JSON.stringify(this.addShiftData));
       /*  getAvailableStaff({}) */
       this.shiftStaffId='';
       this.servicesList=[];
      this.disableServiceSection=true;
      this.isDisbaleServiceButton=true;
      this.isVisibleCreateServicesButton=true;
      this.disableTimeButton=false;
      this.isRecurWeekFlag=false;
      this.isRecurmontlyFlag=false;
      this.RecurValue=''
      this.recurEveryValue=0
      this.selectedDays=[]
      this.monthOfDay=0;
      this.recurOccurencesValue=0;
      this.recurEndDate='';
      this.ServiceTypeIdInParticipant='';
      this.isRecurWeekFlag=false;
      this.isRecurmontlyFlag=false;
      this.isDisableSaveButton=false;
      this.addNewAddressCheckBox=false;
      this.headingLabel='Create Shift';
      this.hourlrRateLabel='Hourly Rate';
      this.hourlyrateDisable=true; 
      
      
       refreshApex(this.wiredServicesResult);
       setTimeout(()=>{
        this.fetchStaffRoles();
        this.staffSlistOnSelection();
       // this.getHourlyStaffRates();
      },1500)
       
      }
      handleLinkParticipants(){
            fetchFacilitiess({cname:'',isTrue:false}).then(response=>{
             // console.log('participant response '+JSON.stringify(response));
              
              this.ParticipantOptions=response.filter(rec => (rec.Status__c === true && rec.Facility__r.Status__c===true )  ) // Check for 'Active' status
                                        .map(rec=>{
                                          let riskLevels = rec.Risk_Managements__r?.map(risk => risk.Risk_Index__c) || [];

                                          // Priority Order: Extreme > High > Medium > Low
                                          let riskStatus = "";
                                          if (riskLevels.includes('Extreme')) {
                                              riskStatus = 'Extreme';
                                          } else if (riskLevels.includes('High')) {
                                              riskStatus = 'High';
                                          } else if (riskLevels.includes('Medium')) {
                                              riskStatus = 'Medium';
                                          } // If none of the abov
                                                    return {
                                                      value:rec.Id,label:rec.Name,
                                                      riskStatus: riskStatus // Include risk level
                                                    }
                                            })
                console.log('participantOptions '+JSON.stringify(this.ParticipantOptions));
              }).catch(error=>{
      
                })
          }
      handleCloseCalenderShiftView(){
        this.isCalenderShiftView = false;
        this.isStaffView=true;
        this.SplitShiftRows=[];
        this.isSplitCheckbox = false;
        this.recurTemplate = false;

        }
      // Add a new row
      handleAddRow() {
        if (this.checkListDescription.trim() !== '') {
          const newRow = {
            id: Date.now(), // Unique ID for the row
            index: this.ChekListrows.length + 1, // Index for display
            description: this.checkListDescription, // Get description from input
            mandatory: false // Initial checkbox value
          };
          this.ChekListrows = [...this.ChekListrows, newRow];
          this.checkListDescription = ''; // Clear input after adding
        }
       
      }
      handleChecklistMandatoryChnage(event) {
        const rowId = parseInt(event.target.dataset.id, 10);
        this.ChekListrows = this.ChekListrows.map((row) => {
          if (row.id === rowId) {
            return { ...row, mandatory: event.target.checked };
          }
          return row;
        });
       
      }
      // Delete a row
      handleDeleteRow(event) {
        const rowId = parseInt(event.currentTarget.dataset.id, 10);
        const rowToDelete = this.ChekListrows.find(row => row.id === rowId);
    
        console.log('Check list rows before delete:', JSON.stringify(this.ChekListrows));
    
        if (rowToDelete && rowToDelete.checkListId) {
            // Initialize deletedChecklist if it's not set
            if (!this.deletedChecklist) {
                this.deletedChecklist = [];
            }
    
            // Add the deleted row to deletedChecklist only if checkListId exists
            this.deletedChecklist = [...this.deletedChecklist, rowToDelete];
    
            console.log('Deleted checklist (with checkListId only):', JSON.stringify(this.deletedChecklist));
        }
    
        // Remove the row from the main list
        this.removeRowFromList(rowId);
    }

    removeRowFromList(rowId) {
        this.ChekListrows = this.ChekListrows.filter(row => row.id !== rowId);
        console.log('Check list row after delete:', JSON.stringify(this.ChekListrows));
        this.updateIndexes();
    }

  
      // Update indexes after a row is deleted
      updateIndexes() {
        this.ChekListrows = this.ChekListrows.map((row, index) => {
          return { ...row, index: index + 1 };
        });
      }
  
      // Update indexes after a row is deleted
      

     
      handleDeleteCheckBoxRow(event){
        const rowId = parseInt(event.currentTarget.dataset.id, 10);
        this.SplitShiftRows = this.SplitShiftRows .filter((row) => row.id !== rowId);
        this.SplitShiftRows = this.SplitShiftRows.map((row, index) => {
          return { ...row, index: index + 1 };
        });
      }
      
    generateOptions(max) {
        const options = [];
        for (let i = 1; i <= max; i++) { // Starting from 1 for more realistic options
          options.push({ label: `${i}`, value: `${i}` });
        }
        return options;
    }
    handleAddShiftChange(event){
      this.addShiftData[event.target.name]=event.target.value;
      console.log('addShift type '+JSON.stringify(this.addShiftData));  

     // console.log('add shift name'+this.AddShiftDayName)
      if(this.facilityAddressCheckbox==true  && event.target.name =='AddShiftFacilityValue'){
        this.getFacilityAddress();
      }
      if(event.target.name =='AddShiftType' &&  this.addShiftData.AddShiftType){
        this.getOrganisationTimings();
       // this.getHourlyStaffRates();
        const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.addShiftData.AddShiftStaffValue,this.addShiftData.AddShiftType);
              
        this.addShiftData.AddShiftStaffHourlyRate= rate; 
      }
      if(event.target.name =='AddShiftNotes'){
        this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
      }
      if(event.target.name =='AddShiftStaffValue'){

       this.RolesStaffId=this.addShiftData.AddShiftStaffValue;
        const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.addShiftData.AddShiftStaffValue,this.addShiftData.AddShiftType);
              
       this.addShiftData.AddShiftStaffHourlyRate= rate; 
          this.fetchStaffRoles();
          this.getOverLappingdata();
      }
       
       console.log('addShiftData '+JSON.stringify(this.addShiftData))
    }
    getOrganisationTimings(){
      this.cutsomShiftTemplate=false;
      this.IsLongShift=false;
      switch (this.addShiftData.AddShiftType) {
        case 'Morning':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Morning_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Morning_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_End_Time__c.toLowerCase());
          //  this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Afternoon':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toLowerCase());
           // this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Night':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Night_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Night_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_End_Time__c.toLowerCase());
          //  this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'General':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.General_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.General_Shift_End_time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_End_time__c.toLowerCase());
         //   this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Custom':
          this.IsLongShift=true;
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Custom_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Custom_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_End_Time__c.toLowerCase());
         //   this.disableTimeButton=false;
            this.cutsomShiftTemplate=true;
            this.addRateRow();
            this.checkFatigue();
            break;
        case 'Sleepover Shift':
          this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Sleepover_Start__c.toUpperCase();
          this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toUpperCase();
          this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Start__c.toLowerCase());
          this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toLowerCase());
         // this.disableTimeButton=false;
          this.checkFatigue();
          break;
    
        default:
            console.warn(`Unknown shift type: ${this.addShiftData.AddShiftType}`);
            this.disableTimeButton=false;
            break;
            
    }
    
  
    // Calculate the shift duration after assigning values
    this.addShiftData.AddShiftDuration = this.getDuration(this.addShiftData.AddShiftStartDate, this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime, this.addShiftData.AddShiftEndTimeAMPM, this.addShiftData.AddShiftType).duration;
    this.addShiftData.AddShiftBreak= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).breakTime;
   
    console.log('addShiftData', JSON.stringify(this.addShiftData));
    this.dispalyAmPMFormat();
    this.getOverLappingdata(); 
}
dispalyAmPMFormat(){
  if (this.addShiftData.AddShiftStartTimeAMPM) {
    let [time, period] = this.addShiftData.AddShiftStartTimeAMPM.split(' ');  // Split into "2:00" and "AM"
    let [startHour, startMinute] = time.split(':');  // Split "2:00" into hour and minute
    this.startTimeSelectedHour = startHour;
    this.startTimeSelectedMinute = startMinute;
    this.startTimeAMPM = period =="AM" ?true:false; // Store "AM" or "PM"
}

if (this.addShiftData.AddShiftEndTimeAMPM) {
    let [time, period] = this.addShiftData.AddShiftEndTimeAMPM.split(' ');  // Split into "2:00" and "AM"
    let [endHour, endMinute] = time.split(':');  // Split "2:00" into hour and minute
    this.endTimeSelectedHour = endHour;
    this.endTimeSelectedMinute = endMinute;
    this.endTimeAMPM = period =="AM" ?true:false; // Store "AM" or "PM"
  }
 
}


    checkFatigue() {
      getFatigueData({ staffId: this.addShiftData.AddShiftStaffValue, strtTimeText: this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(), startdate: this.addShiftData.AddShiftStartDate })
          .then(result => {
              //this.fatigueDetected = result;
              console.log('Fatigue Status:', result);
              if(result==true){
               // this.confirMationMessage('Error','The selected staff already has a shift within the start and end times. Please switch to the staff view and assign the services to the particular participant.','Error');
                this.fatigueManagementFlag=true;
              }else{
                this.fatigueManagementFlag=false;
              }
          })
          .catch(error => {
              console.error('Error fetching fatigue data:', error);
          });
  }
  getOverLappingdata(){
    getOverlappingShiftsData({strtTimeText:this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),endTimeText:this.addShiftData.AddShiftEndTimeAMPM.toLowerCase(),StaffID:this.addShiftData.AddShiftStaffValue,startdate:this.addShiftData.AddShiftStartDate,shiftType:this.addShiftData.AddShiftType,ShiftwithStaffId:this.ShiftwithStafftoApexId}).then(result=>{
      console.log('over lapping data '+result);
      if(result==true){
        this.confirMationMessage('Error','The selected staff already has a shift within the start and end times.','Error');
        this.isDisableSaveButton=true;
      }else{
        this.isDisableSaveButton=false;
      }
     })
  }

    @track holidayPopup = false;
    handleRecurEveryChange(event) {
      switch (event.target.name) {
          case 'recurEvery':
              this.recurEveryValue = event.target.value;
              break;
          case 'recurEndDate':
              this.recurEndDate = event.target.value;
              this.callGetNumberOfRecurrences();              
              break;
          case 'monthLyOptions':
              this.monthOfDay = event.target.value;
              this.isRecurDateDisabled = false;
              this.validateMonthLyOptions(); 
              break;
          case 'recurCheckBox':
              this.AddShiftRecurringCheckboxValue = event.target.checked;
              this.recurTemplate = this.AddShiftRecurringCheckboxValue;
  
              if (!this.AddShiftRecurringCheckboxValue) {
                  // Reset recurring fields when unchecked
                  this.RecurValue = '';
                  this.recurEveryValue = null;
                  this.selectedDays = [];
                  this.monthOfDay = null;
                  this.recurOccurencesValue = null;
                  this.recurEndDate = null;
                  this.isRecurWeekFlag=false;
                  // **Skip validation when unchecked**
                  this.isDisableSaveButton = false;
                  return;
              }
              break;
          case 'includeParticipants':
              this.AddShiftIncludePartcipants = event.target.checked;
              this.includeParticipantEvent = event.target.checked;
              break;
      }
  
      console.log('recurCheckBox: ', this.AddShiftRecurringCheckboxValue);
  
      // **Only validate if recurCheckBox is checked**
      if (this.AddShiftRecurringCheckboxValue) {
        setTimeout(() => {
          this.isDisableSaveButton = this.validateRecurringOptions();
       }, 500);
         
  
          // Ensure API call only runs when all required values are available
          if (this.RecurValue && this.recurEveryValue && this.recurEndDate) {
              getNumberOfRecurrences({
                  typeOfRecur: this.RecurValue,
                  recurEvery: this.recurEveryValue,
                  endDate: this.recurEndDate,
                  shiftDate: this.addShiftData?.AddShiftStartDate,
                  weeklyDays: this.selectedDays,
                  monthlyDay: this.monthOfDay
              })
              .then(response => {
                  console.log('response: ', JSON.stringify(response));
                  if (response.isSuccess) {
                      this.recurOccurencesValue = response.NumberOfOccurrences;
                      this.isDisableSaveButton = false; // Enable button if API succeeds
                  } else {
                      this.confirMationMessage('Error', response.failureMessage, 'Error');
                      this.isDisableSaveButton = true; // Disable on API failure
                  }
              })
              .catch(error => {
                  console.error('Error in getNumberOfRecurrences: ', error);
                  this.isDisableSaveButton = true; // Ensure button is disabled on error
              });
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
      .then(response => {
        this.selectedHolidayDates=[];
        this.removeHolidayDate=[];
          console.log('response from getNumberOfRecurrences:', JSON.stringify(response));
  
          if (response.isSuccess) {
              this.recurOccurencesValue = response.NumberOfOccurrences;
              this.isDisableSaveButton = false;
  
              // Now pass the result directly to your next method
              this.sendRecurEveryforWeeklyToApex(response);
          } else {
              this.confirMationMessage('Error', response.failureMessage, 'Error');
              this.isDisableSaveButton = true;
          }
      })
      .catch(error => {
          console.error('Error in getNumberOfRecurrences:', error);
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
          if (!dateStr || typeof dateStr !== 'string') return '';
          if (!dateStr.includes('/')) return dateStr; // already in ISO format
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };
  
      const date = formatDateToISO(originalDate);
  
      console.log('--- handleholidayChange Triggered ---');
      console.log('Original Date:', originalDate);
      console.log('Formatted Date:', date);
      console.log('Checkbox Checked:', isChecked);
      console.log('this.selectedHolidayDates', JSON.stringify(this.selectedHolidayDates));
      console.log('this.removeHolidayDate', JSON.stringify(this.removeHolidayDate));
  
      // ✅ Update selected/unselected holiday arrays
      if (isChecked) {
          if (!this.selectedHolidayDates.includes(date)) {
              this.selectedHolidayDates.push(date);
              console.log('✅ Added to selectedHolidayDates:', date);
          }
  
          this.unselectedHolidayDates = this.unselectedHolidayDates.filter(d => d !== date);
          console.log('🗑 Removed from unselectedHolidayDates:', date);
  
          // ✅ Add date to recurrenceDatesList if not present
          if (!this.recurrenceDatesList.includes(date)) {
              this.recurrenceDatesList.push(date);
              console.log('📌 Added to recurrenceDatesList:', date);
          }
      } else {
          this.selectedHolidayDates = this.selectedHolidayDates.filter(d => d !== date);
          console.log('🗑 Removed from selectedHolidayDates:', date);
  
          if (!this.unselectedHolidayDates.includes(date)) {
              this.unselectedHolidayDates.push(date);
              console.log('✅ Added to unselectedHolidayDates:', date);
          }
      }
  
      // ✅ Fallback in case holidaysList is undefined
      this.removeHolidayDate = this.holidaysList;
  
      console.log('Holiday Dates:', JSON.stringify(this.removeHolidayDate));
      console.log('recurrenceDatesList >>', JSON.stringify(this.recurrenceDatesList));
  
      // Convert all holiday dates to yyyy-MM-dd
      const holidayDatesRaw = this.removeHolidayDate || [];
      const formattedHolidayDates = holidayDatesRaw.map(holiday => formatDateToISO(holiday.Date__c));
  
      console.log('📅 All Holiday Dates in yyyy-MM-dd format:', JSON.stringify(formattedHolidayDates));
      console.log('✅ Selected Holidays:', JSON.stringify(this.selectedHolidayDates));
  
      // ✅ Filter recurrenceDatesList to keep:
      // 1. Dates NOT in the holiday list
      // 2. OR dates in the selected holiday list
      this.recurrenceDatesList = (this.recurrenceDatesList || []).filter(d =>
          !formattedHolidayDates.includes(d) || this.selectedHolidayDates.includes(d)
      );
  
      console.log('✅ Filtered recurrenceDatesList:', JSON.stringify(this.recurrenceDatesList));
      
    this.HolidaySaveButton = this.selectedHolidayDates.length === 0;
     // HolidaySaveButton

  }
  
    
    handleholidayPopup() {
      //this.removeHolidayDate = this.holidaysList;
  
      // Inline date formatter: converts "dd/MM/yyyy" to "yyyy-MM-dd"
      const formatDateToISO = (dateStr) => {
          if (!dateStr || typeof dateStr !== 'string') return '';
          if (!dateStr.includes('/')) return dateStr; // already in ISO format
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };
  
      // Convert all holiday dates to yyyy-MM-dd
      const holidayDatesRaw = this.holidaysList || [];
      const formattedHolidayDates = holidayDatesRaw.map(holiday => formatDateToISO(holiday.Date__c));
  
      console.log('📅 All Holiday Dates in yyyy-MM-dd format:', JSON.stringify(formattedHolidayDates));
    //  console.log('✅ Selected Holidays:', JSON.stringify(this.selectedHolidayDates));
    //  console.log('Holiday Dates:', JSON.stringify(this.removeHolidayDate));
      console.log('recurrenceDatesList >>', JSON.stringify(this.recurrenceDatesList));
  
      // ✅ Filter recurrenceDatesList to remove all holiday dates except selected ones
      this.recurrenceDatesList = (this.recurrenceDatesList || []).filter(d =>
          !formattedHolidayDates.includes(d) 
      );
  
      console.log('✅ Updated recurrenceDatesList after filtering:', JSON.stringify(this.recurrenceDatesList));
      this.holidayPopup = false;
      this.selectedHolidayDates=[];
      this.removeHolidayDate=[];
     }

    handleholidayPopupSave(event){
      console.log('this.selectedHolidayDates >>'+this.selectedHolidayDates);
      if (!this.selectedHolidayDates || this.selectedHolidayDates.length === 0) {
        console.log('Selected Holiday Dates >> ' + this.selectedHolidayDates);
        const holidayDatesToRemove = this.holidaysList.map(h => h.Date__c);
        console.log('Dates to remove from recurrenceDatesList:', JSON.stringify(holidayDatesToRemove));
  
        // Filter out those dates from recurrenceDatesList
        this.recurrenceDatesList = this.recurrenceDatesList.filter(
            date => !holidayDatesToRemove.includes(date)
        );
  
        console.log('Updated recurrenceDatesList after removal:', JSON.stringify(this.recurrenceDatesList));
        
        }
      
      console.log('Save button clicked');
      this.holidayPopup = false;
      console.log('this.recurrenceDatesList >> '+JSON.stringify(this.recurrenceDatesList));
    }

    @track holidaysList = [];
    @track recurrenceDatesList = [];
    @track unselectedHolidayDates = [];
    sendRecurEveryforWeeklyToApex(response) {
      if (response.isSuccess && Array.isArray(response.RecurrenceDates)) {
          const recurrenceDates = response.RecurrenceDates.map(dateStr => {
              const dateObj = new Date(dateStr);
              return dateObj.toISOString().split('T')[0]; // Convert to yyyy-MM-dd
          });
  
          console.log('recurrenceDates >>', recurrenceDates);
          this.recurrenceDatesList = recurrenceDates;
          this.unselectedHolidayDates  = recurrenceDates;
          console.log('recurrenceDatesList >>', this.recurrenceDatesList);
          console.log('StaffId >>'+this.addShiftData.AddShiftStaffValue);
          const StaffId = this.addShiftData.AddShiftStaffValue
          console.log('StaffId >>'+StaffId);
  
          HolidaysPopup({ 
              recurrenceDates: recurrenceDates,
              StaffId: StaffId 
          })
          .then(result => {
              console.log('Returned result from Apex:', result);
  
              const holidays = result.holidays || [];
              const holidayrateList = result.Holidayrate || [];
  
              let rateValue = null;
              if (holidayrateList.length > 0) {
                  rateValue = holidayrateList[0].Public_holiday_Hourly_Rate__c;
                  console.log('rateValue >> ' + rateValue);
              }

              const formatDate = (dateStr) => {
                const d = new Date(dateStr);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0'); // Months start from 0
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
            };
  
              this.holidaysList = holidays
                  .filter(h => h && h.Id)
                  .map(h => ({
                      Id: h.Id,
                      Name: h.Holiday_Name__c,
                      Date__c: formatDate(h.Date__c),
                      Rate__c: rateValue,
                      checked: false
                  }));
  
              this.holidayPopup = this.holidaysList.length > 0;
              this.HolidaySaveButton=true;
          })
          .catch(error => {
              console.error('Error calling Apex:', error);
          });
      } else {
          console.warn('Recurrence result missing or invalid.');
      }
    }   
    
  validateRecurringOptions() {
    console.log("Starting Recurring Options Validation...");

    let allFieldsValid = true; // Assume all fields are valid initially

    let fields = [
        { name: "typeOfRecurOption", selector: ".typeOfRecurOption", errorMessage: "Recur type is required." },
        { name: "recurEvery", selector: ".recurEvery", errorMessage: "Frequency is required" },
        { name: "recurEndDate", selector: ".recurEndDate", errorMessage: "End Date is required." }
    ];

    if (this.AddShiftRecurringCheckboxValue) {
        console.log("Recurring checkbox is checked, performing validation...");

        fields.forEach(field => {
            let inputElement = this.template.querySelector(field.selector);
            if (inputElement) {
                let value = inputElement.value;

                if (!value) {
                    console.warn(`Validation failed for: ${field.name}, Error: ${field.errorMessage}`);
                    inputElement.setCustomValidity(field.errorMessage);
                    allFieldsValid = false; // Mark as invalid if any field is empty
                } else {
                    console.log(`Validation passed for: ${field.name}`);
                    inputElement.setCustomValidity("");
                }

                inputElement.reportValidity();
            } else {
                console.error(`Field not found: ${field.name}, Selector: ${field.selector}`);
                allFieldsValid = false; // Assume invalid if field is missing
            }
        });

    } else {
        console.log("Recurring checkbox is unchecked, clearing validation messages...");
        allFieldsValid = false; // If checkbox is not checked, disable save button

        // Clear all error messages if checkbox is unchecked
        fields.forEach(field => {
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
    
    this.RecurValue=event.target.value;
    this.monthOfDay=0;
    this.recurEndDate='';
   
   
    switch(event.target.value) {
        case 'Daily':
        case 'Fortnightly':
          this.RecurLabel= 'Day';
          this.isRecurWeekFlag=false; 
          this.isRecurmontlyFlag=false; 
          this.isRecurDateDisabled = false;              ;
          break; 

        case 'Weekly':  
          this.RecurLabel= 'Week' 
          this.isRecurWeekFlag=true; 
          this.isRecurmontlyFlag=false;
          this.isRecurDateDisabled = true;    
        break;
        case 'Monthly':
          this.RecurLabel= 'Month';
          this.isRecurWeekFlag=false; 
          this.isRecurmontlyFlag=true;
          this.isRecurDateDisabled = true;        
          }
    if (maxValues[this.RecurLabel]) {
        this.recurEveryOptions = this.generateOptions(maxValues[this.RecurLabel]);
       // console.log('recurEveryoptions '+JSON.stringify( this.recurEveryOptions))
    }
    this.isDisableSaveButton=this.validateRecurringOptions();
    this.isDisableSaveButton=true;
   
  }

  handleCheckboxChange(event) {
      const day = event.target.name; // Get the name of the checkbox (day)
      const isChecked = event.target.checked; // Check if the checkbox is selected
      this.recurEndDate = null;
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

    console.log('Selected Days:', JSON.stringify(this.selectedDays)); // Log selected days
      if( this.AddShiftRecurringCheckboxValue &&this.recurEveryValue && this.recurEndDate){
        /*getNumberOfRecurrences({typeOfRecur:this.RecurValue, recurEvery:this.recurEveryValue, endDate:this.recurEndDate, shiftDate:this.addShiftData.AddShiftStartDate,
          weeklyDays:this.selectedDays,monthlyDay:this.monthOfDay
        })
        .then(response => {
          console.log('response '+JSON.stringify(response))
          if(response.isSuccess){
            this.recurOccurencesValue=response.NumberOfOccurrences;
            this.isDisableSaveButton=false;            
          }else{
            this.confirMationMessage('Error', response.failureMessage, 'Error')
            this.isDisableSaveButton=true;
          }
          //this.recurOccurencesValue = response;
        })*/
      }
  }

  handleAddShiftTimeData (event){
    this.isDisableSaveButton=false;
    
    const childData = event.detail;
   // console.log('childData '+JSON.stringify(childData))
    //console.log('date types1 '+event.currentTarget.dataset.timetype);
   // console.log('date types2 '+event.currentTarget.dataset.ampm)
    this.addShiftData[event.currentTarget.dataset.timetype]=childData.twentyFourHourFormat;
    this.addShiftData[event.currentTarget.dataset.ampm]=childData.displaytime;
    this.addShiftData.AddShiftDuration= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).duration;
    this.addShiftData.AddShiftBreak= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).breakTime;
    this.dispalyAmPMFormat();
   // console.log('Add shift data:', JSON.stringify(this.addShiftData));
   this.checkFatigue();
   this.getOverLappingdata();
   
   /* if (this.addShiftData.AddShiftType === 'Custom') {
       this.rateRows = [];
       console.log('this.rateRows >> ' + JSON.stringify(this.rateRows));
   
      } */
  }

  addressInputChange(event){
    this.address.street=event.detail.street;
        this.address.citySuburb=event.detail.city;
        this.address.postalcode=event.detail.postalCode;
        this.address.provinceState=event.detail.province;
        this.address.country=event.detail.country;
          this.fetchGeocode();
  } 

   fetchGeocode() {
        console.log('this.street >>',  this.address.street);
        console.log('this.city >>',this.address.citySuburb);
        console.log('this.postalCode >>' , this.address.postalcode);
        const fullAddress = `${this.address.street}, ${this.address.citySuburb} ${this.address.postalcode}, AU`;
        const apiKey = GOOGLE_API_KEY;

        console.log('Fetching geocode for:', fullAddress);

        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                console.log('Geocode API response:', data);

                if (data.status === 'OK' && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    this.address.latitude=location.lat;
                    this.address.longitude=location.lng;
                    console.log('Parsed coordinates:', location.lat, location.lng);
                } else {
                    console.warn('No geocode results found or status not OK');
                }
                console.log('  address  '+JSON.stringify(this.address));
            })
            .catch(error => {
                console.error('Error calling Geocode API:', error);
                // Optional: handle error or fallback logic here
            });
    }

    getDuration(startDateString, startTimeString, endTimeString, endTimeAMPM, shiftType) {
      // Validate input parameters
      if (!startDateString || !startTimeString || !endTimeString || !endTimeAMPM || !shiftType) {
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
      const startDate = new Date(year, month, day, parseInt(startParts[0], 10), parseInt(startParts[1], 10));

      const endParts = endTimeString.split(":");
      let endDate = new Date(year, month, day, parseInt(endParts[0], 10), parseInt(endParts[1], 10));
     
      const endTimeSplit = endTimeAMPM.split(' ');
      if (endTimeSplit[1] === 'AM' && (shiftType === 'Night' || shiftType === 'Sleepover Shift' || shiftType === 'Custom'  ) ) {
          endDate.setDate(endDate.getDate() + 1); // Adjust for overnight shifts 
          
      }
      //console.log(' sTART DATE '+startDate);
     // console.log(' END DATE '+endDate);
      const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        this.addShiftData.AddShiftEndDate = formattedEndDate;
      const durationInMilliseconds = endDate - startDate;
      const durationInMinutes = durationInMilliseconds / (1000 * 60);

      let hours = (durationInMinutes / 60).toFixed(1); // Calculate hours
      let breakTime = 0;

      if (hours >= 5) {
          breakTime = 30; // Apply 30-minute break
          const breaksInHours = (breakTime / 60).toFixed(1);
          hours -= breaksInHours;
      }

      // Return the result as a JSON object
      return {
          duration: parseFloat(hours), // Ensure the duration is a number
          breakTime: breakTime
      };
  }
    splitShiftChange(event) {
    //this.SplitShiftRows=[];
    this.isSplitCheckbox = event.target.checked; // Corrected typo here
    this.isDisableParticipantCheckBox=true;
    this.isVisibleCreateServicesButton=false;
    this.SplitShiftRows=[];
    this.isVisiblePlusIcon=true;
     this.serviceGroupName=[];
      this.NdisServiceGroupName=false;
      this.stateValue=''
      this.isDisbaleServiceButton=true;
      this.ServiceTypeIdInParticipant='';
      this.serviceParticipant='';
      this.fundOption=[];
    this.isDisbaleServiceButton=true;
    console.log('splitShiftRows '+JSON.stringify(this.SplitShiftRows));
  //  this.SplitShiftRows=[];    
  }
  
    handleAddSplitShiftRow() {
        if (this.SplitShiftRows.length >= 4) {
          // Prevent adding more than 4 rows
          this.confirMationMessage('Error', 'You can only add up to 4 split shift rows.', 'Error');
          return;
      }
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
          serviceNameValue: '',
          serviceStatusValue: '',
          state: '',
          selectedNdisIdValue: null,
          SplitShift: false,
          startTimeAMPM: '',
          endTimeAMPM: '',
          serviceSuppoertId: null,
          participant: null,
          serviceTypeId: null,
          // Apply alternating colors to each new row
          splitShiftColor: `border-left: 10px solid ${this.colors[this.SplitShiftRows.length % this.colors.length]};`
      };

      this.SplitShiftRows = [...this.SplitShiftRows, newRow];
      this.isVisiblePlusIcon=false;
      this.serviceGroupName=[], this.servicePlan='';
      this.NdisServiceGroupName=false;
      this.isDisbaleServiceButton = true;
  }

  handleStartTimeChange(event) {
    const rowId = event.target.dataset.id;
    let newStartTime = event.detail; // Get the new start time from the event
    const basestartTime = this.addShiftData.AddShiftStartTime; // "HH:
    this.isDisbaleServiceButton=true;
    this.disableSplitTime=false;
    this.isDisbaleServiceButton1=false;

    const newStartDate = new Date(`1970-01-01T${newStartTime.twentyFourHourFormat}`);
    const newBaseStartTime = new Date(`1970-01-01T${basestartTime}`);
    console.log('new start time '+newStartDate);
    console.log('new base  time '+newBaseStartTime);
    const rowIndex = this.SplitShiftRows.findIndex(row => row.id === rowId);

  if (rowIndex === 0 && newStartDate < newBaseStartTime) {
        this.confirMationMessage('Error', 'First split start time must be greater than base shift start time.', 'Error');
        this.isDisbaleServiceButton=true;
        this.disableSplitTime=true;
        this.isDisbaleServiceButton1=true;
        return;
    }
      // Validate against the previous row's end time
      this.SplitShiftRows = this.SplitShiftRows.map(row => {
        if (row.id === rowId) {
        //  const previousEndTimeDate = previousRowEndTime ? new Date(`1970-01-01T${previousRowEndTime}Z`) : null;
            row.startTime = newStartTime.twentyFourHourFormat;
            console.log('row.startTime===>'+row.startTime); 
            row.startTimeAMPM = newStartTime.displaytime; 
            row.SplitShift=true;
            if (row.startTime && row.endTime) {
              this.updateDuration(row);
              console.log('Updated row duration:', row.duration);
          } else {
              console.warn('Missing start or end time, skipping duration update');
          } 
           // this.updateDuration(row);  
        }
        return row;
    });
    console.log('SPlit shifts ins start   '+ JSON.stringify(this.SplitShiftRows));

      const prevRow = this.SplitShiftRows[rowIndex - 1];
      const prevEndTime = prevRow.endTime;

      const prevEndDate = new Date(`1970-01-01T${prevEndTime}`);

      if (newStartDate < prevEndDate) {
          this.confirMationMessage('Error', 'Start time must be greater than previous row end time.', 'Error');
          this.isDisbaleServiceButton=true;
          this.disableSplitTime=true;
          this.isDisbaleServiceButton1=true;
           return;
      }  
    //  this.isDisbaleServiceButton=false;
     
    
}
  handleEndTimeChange(event) {
    const rowId = event.target.dataset.id;
    let newEndTime = event.detail; // Get the new end time from the event
    let hasNegativeDuration = false; // Flag to track invalid durations
    const baseEndTime = this.addShiftData.AddShiftEndTime; // "HH:mm:ssZ"
    this.isDisbaleServiceButton1 = false;

    // Convert times to Date objects
    const newEndDate = new Date(`1970-01-01T${newEndTime.twentyFourHourFormat}`);
    const baseEndDate = new Date(`1970-01-01T${baseEndTime}`);

    const rowIndex = this.SplitShiftRows.findIndex(row => row.id === rowId);
    this.SplitShiftRows = this.SplitShiftRows.map(row => {
      if (row.id === rowId) {
       
          row.endTime = newEndTime.twentyFourHourFormat; // Update 24-hour format end time
          row.endTimeAMPM = newEndTime.displaytime; 
          row.shiftType=this.addShiftData.AddShiftType
          console.log('row end time '+JSON.stringify(row));

          // Add validation for end time against start time
          const newStartDate = new Date(`1970-01-01T${row.startTime}`);

          if (newEndDate <= newStartDate) {
              this.confirMationMessage('Error', 'End time must be greater than start time.', 'Error');
              this.isDisbaleServiceButton1 = true;  // Disable the service button
              hasNegativeDuration = true;  // Flag that the duration is invalid
              return row;  // Don't continue with the row if the validation fails
          }

        //  this.updateDuration(row);
           if (row.startTime && row.endTime) {
            this.updateDuration(row);
            console.log('Updated row duration:', row.duration);
        } else {
            console.warn('Missing start or end time, skipping duration update');
        } 
          if (row.duration <= 0) {
            hasNegativeDuration = true;
            this.isDisbaleServiceButton=true;
          }
          this.isDisbaleServiceButton1 = false;
            console.log('row end time '+JSON.stringify(row));
      }
      return row;
  });
  console.log('SPlit shifts after end  '+ JSON.stringify(this.SplitShiftRows));
    // Validate last row end time
    if (rowIndex === this.SplitShiftRows.length - 1 && newEndDate > baseEndDate) {
        this.confirMationMessage('Error', 'Last split end time must be less than shift end time.', 'Error');
        this.isDisbaleServiceButton=true;
        this.isDisbaleServiceButton1 = true;
        return;
    }
   
}

// Calculate and update duration for the row
updateDuration(row) {
    const { startTime, endTime, startTimeAMPM, endTimeAMPM,shiftType } = row;
    console.log(' duration data  '+shiftType);

   /*  console.log(' duration '+durationData); */
    const durationData = this.getDuration(this.addShiftData.AddShiftStartDate,startTime, endTime,endTimeAMPM,shiftType);

    row.duration = durationData.duration;
    row.breakTime = durationData.breakTime;
}

// Handle changes in participants (if necessary)
handleParticipantChange(event) { 
  this.SplitShiftRowId = '';
  this.fundOption=[];
  this.ServiceTypeIdInParticipant='';
  const rowId = event.target.dataset.id;
  const newParticipant = event.target.value;
  this.serviceParticipant=newParticipant;
  const recordCount = this.SplitShiftRows.length; // Get the latest count
  this.riskIndex=this.ParticipantOptions.find(opt => opt.value === event.target.value).riskStatus;
  this.SplitShiftRows = this.SplitShiftRows.map((row, index) => {
      let heightStyle = "";
      
      switch (recordCount) {
          case 2:
              heightStyle = index === 0 
                  ? "cursor: pointer;position:relative; left:-10px;  height: 40px;" 
                  : "cursor: pointer;position:relative; left:-10px;  height: 40px;";
              break;
          case 3:
              heightStyle = index === 0 
                  ? "cursor: pointer;position:relative; left:-10px;  height: 28px;" 
                  : "cursor: pointer;position:relative; left:-10px;  height: 26px;";
              break;
          case 4:
              heightStyle = index === 0 
                  ? "cursor: pointer;position:relative; left:-10px;  height: 22px;" 
                  : "cursor: pointer;position:relative; left:-10px;  height: 20px;";
              break;
      }

      return {
          ...row,
          participant: row.id === rowId ? newParticipant : row.participant,
          splitShiftHeight: heightStyle
      };
  });

  this.SplitShiftRowId = rowId;
  this.NdisServiceGroupName=false;

  getClientFunds({ clientId: newParticipant })
      .then(response => {
          if (response) {
              this.TotalFunds = response;
              this.fundOption = response.map(rec => {
                  return { "label": rec.Registration_Group__c, "value": rec.Id };
              });
          }
      })
      .catch(error => {
          // Handle error
      });
}
 handleServiceChange(event){
   // console.log('event target'+JSON.stringify(event.target.options));
   //console.log('event details'+JSON.stringify(event.detail));
    let serviceTypeName=event.target.options.find(opt => opt.value === event.detail.value).label;
    console.log('service type name '+serviceTypeName);
    this.servicePlan=this.TotalFunds.find(opt => opt.Id === event.detail.value).Plan_Type__c;
     this.ServiceTypeIdInParticipant=event.detail.value;
    this.stateValue='';
    this.isDisbaleServiceButton=true;
    this.SplitShiftRows = this.SplitShiftRows.map(row => {
      if (row.id === this.SplitShiftRowId) {
          row.serviceTypeId =this.ServiceTypeIdInParticipant;   
      }
      return row;
    });
    console.log('this.serviceParticipant ==> '+this.serviceParticipant);
    if (this.ServiceTypeIdInParticipant) {
      this.serviceGroupName = [];
      this.NdisServiceGroupName = true;

      // Fetch catalogue data
      getCatalogueData({ serviceType: this.ServiceTypeIdInParticipant, clientId: this.serviceParticipant }).then(result => {
          const catalogueData = result.catalogueData;
          const stateField = result.statesCombined; // e.g., "NSW__c"

          this.stateValue = stateField;

          this.serviceGroupName = catalogueData.map(rec => {
              return {
                  ...rec,
                  amount: rec[stateField] || 0 // dynamically pick amount using stateField
              };
          });

          console.log('Service Group with Amounts:', JSON.stringify(this.serviceGroupName));
      }).catch(error => {
          console.error('Error fetching catalogue data:', error);
      });
  }
    
    console.log('Split shift in service '+JSON.stringify(this.SplitShiftRows ));
  }

  handleCheckboxSelection(event){
    const selectedId = event.target.getAttribute('data-id'); // Get the selected row's ID
    const selectedRow = this.serviceGroupName.find(row => row.Id === selectedId); 
    console.log('Selected row '+JSON.stringify(selectedRow));
    this.SplitShiftRows = this.SplitShiftRows.map(row => {
      if (row.id === this.SplitShiftRowId) {
          row.selectedNdisIdValue = selectedRow.Id;
           row.serviceNameValue = selectedRow.Name;
           let state=this.stateValue.split('_')
           row.state=state[0];
           row.StaffId = this.ServiceStaffValue;
           row.serviceStffaHourlyRate=this.serviceStaffHourlyRate;
           row.serviceDate=this.addShiftData.AddShiftStartDate;
          
      }
      return row;
    });
    // Update the isSelected property for all rows
    this.serviceGroupName = this.serviceGroupName.map(row => ({
        ...row,
        isSelected: row.Id === selectedId // Set true for the selected row, false for others
    }));
    if(this.isSplitCheckbox){
      this.serviceTableAddButton=true;
      this.isDisbaleServiceButton=true;
      this.isDisableSaveButton = false;
      this.isSplitCheckbox=true;
    }else{
      this.serviceTableAddButton=false;
      this.isDisbaleServiceButton=false;
      this.isDisableSaveButton = true;
    }
    console.log('Selected Row ID:', selectedId);
    console.log('Split shift'+JSON.stringify(this.SplitShiftRows ));
  }
  handleDeleteSplitCheckBoxRow(event) {
    const rowId = event.target.dataset.id;
    this.SplitShiftRows = this.SplitShiftRows.filter(row => row.id !== rowId);
    this.isVisiblePlusIcon=true;
   // this.isVisiblePlusIcon=this.SplitShiftRows.length==0?true:false;
    if(parseInt(this.SplitShiftRows.length) >= 2){
        console.log('split shift '+this.SplitShiftRows.length);
        this.isDisbaleServiceButton = false;
      }else{
        this.isDisbaleServiceButton = true;
      }
  }
  handleServiceStaffchange(event){
    console.log('Split shift'+JSON.stringify(this.SplitShiftRows ));
    if(event.target.name=='serviceStaff'){
      this.ServiceStaffValue=event.target.value;
    }else{
      this.serviceParticipant=event.target.value;
      this.isDisableParticipantCheckBox=false;
      this.serviceGroupName=[];
      this.NdisServiceGroupName=false;
      this.stateValue=''
      this.isDisbaleServiceButton=true;
         this.ServiceTypeIdInParticipant='';
       this.riskIndex=this.ParticipantOptions.find(opt => opt.value === event.target.value).riskStatus;
      this.SrviceParticipantName=this.ParticipantOptions.find(opt => opt.value === event.target.value).label;
     //  this.SrviceParticipantName=event.target.label;
       console.log('paerticipant name '+this.SrviceParticipantName);
      if(this.participantAddressCheckBox){
        this.getPartcipantAddress();
      }
     
    //  this.AddShiftIncludePartcipants=this.isEditShiftScreenFlag==true?true:false;
    }
    console.log('this.addShiftData.AddShiftHoliday '+this.addShiftData.AddShiftHoliday);
    console.log('AddShiftDayName '+this.AddShiftDayName);
    console.log('this.addShiftData.AddShiftType '+this.addShiftData.AddShiftType);
    const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.ServiceStaffValue,this.addShiftData.AddShiftType);
              
    this.serviceStaffHourlyRate = rate;
      console.log('this.serviceStaffHourlyRate '+this.serviceStaffHourlyRate);

    if(this.ServiceStaffValue && this.serviceParticipant){
      getClientFunds({clientId :this.serviceParticipant}).then(response=>{
         console.log('funds '+JSON.stringify(response));
          if(response){
            this.TotalFunds=response;
            this.fundOption=response.map(rec=>{
              return { "label": rec.Registration_Group__c,"value": rec.Id};
            });
          //  console.log('funds option'+JSON.stringify(this.fundOption));
          }
        }).catch(error=>{
        })
      this.SplitShiftRows = this.SplitShiftRows.map(row => 
        {
         this.SplitShiftRowId=row.id;
              row.StaffId = this.ServiceStaffValue;
              row.participant=this.serviceParticipant;
              row.serviceStffaHourlyRate=this.serviceStaffHourlyRate;
         return row;
       });
       console.log('SPlit row Id'+JSON.stringify(this.SplitShiftRowId));
       console.log('Split shift'+JSON.stringify(this.SplitShiftRows));
    }
    
  }
  handleServicetableButton() {
    this.NdisServiceGroupName = false;
    this.serviceGroupName = [];
    this.servicePlan = '';
    this.fundOption = [];
    this.stateValue = '';
    this.ServiceTypeIdInParticipant = '';
    this.riskIndex=''
    
    console.log('Split shift Length: ' +JSON.stringify( this.SplitShiftRows));

    // Check if every row has a duration greater than 
    this.isVisiblePlusIcon = true;
    // Enable "Create Services" button only if at least 2 valid rows exis

      if(parseInt(this.SplitShiftRows.length) >= 2){
        console.log('split shift '+this.SplitShiftRows.length);
        this.isDisbaleServiceButton = false;
      }else{
        this.isDisbaleServiceButton = true;
      }

       this.serviceTableAddButton=false;
    
    
}
  handleAddShiftSave(){
    this.isShowSpinner=true;
    this.finalAddShiftData.shiftaddress=this.address;
    this.finalAddShiftData.shiftDetails=this.addShiftData;
    console.log('service staff '+this.ServiceStaffValue);
    console.log('addShift staff '+this.addShiftData.AddShiftStaffValue);
    
    console.log('this.LongShiftTimeSlots>>',JSON.stringify(this.LongShiftTimeSlots));
    if(this.isNewInsertOperation==true &&this.postInsertOperation ==false){
      this.SplitShiftRows[0].StaffId=this.addShiftData.AddShiftStaffValue;
      this.SplitShiftRows[0].serviceStffaHourlyRate=this.addShiftData.AddShiftStaffHourlyRate;
      this.SplitShiftRows[0].LongShiftTimeSlots=JSON.stringify(this.LongShiftTimeSlots);
      this.AddShiftIncludePartcipants=false
    }
    console.log('finalAddShiftData '+JSON.stringify(this.finalAddShiftData));
    console.log('Split Shift rows '+JSON.stringify(this.SplitShiftRows));
   
    const checkListJsonData = this.ChekListrows.map(row => ({
      ...row, // Retains existing fields
      description: row.description,
      mandatory: row.mandatory
      }));
   console.log('isUpdate '+this.isEditShiftScreenFlag);

  /*   if(this.isEditShiftScreenFlag==true && this.AddShiftRecurringCheckboxValue==true){
           this.AddShiftIncludePartcipants= this.includeParticipantEvent

    }  */
    console.log('include participant '+this.AddShiftIncludePartcipants);

    if(this.validateInputs() && this.validateAddress() && this.addShiftData.AddShiftDuration >0){
      createAddShift({addshiftData:JSON.stringify(this.finalAddShiftData),isRecurring:this.AddShiftRecurringCheckboxValue,typeOfRecur:this.RecurValue,
        recurEvery:this.recurEveryValue,endDate:this.recurEndDate,shiftDate:this.addShiftData.AddShiftStartDate, weeklyDays:this.selectedDays,monthlyDay:this.monthOfDay,
        servicesJsonData:JSON.stringify(this.SplitShiftRows),checkListJsonData:JSON.stringify(checkListJsonData),isUpdate:this.isEditShiftScreenFlag,includeParticipants:this.AddShiftIncludePartcipants, recurrenceDates: this.recurrenceDatesList}).then(result=>{
         // console.log('result '+JSON.stringify(result));
         
          if(result.isSuccess){
            this.confirMationMessage('Success','Your shift has been successfully created. Please proceed with adding staff/participants to this shift.','Success');
            let shiftWithStaffList = JSON.parse(result.shiftWithstaffResult);
            let addShiftList = JSON.parse(result.AddShiftResult);
    
            console.log('Shift With Staff:',JSON.stringify(shiftWithStaffList) );
            console.log('Add Shift List:', JSON.stringify(addShiftList));
    
            if (shiftWithStaffList.length > 0) {
                console.log('First ShiftWithStaff ID:', shiftWithStaffList[0].Id);
                getAddShiftDataById({shiftId:shiftWithStaffList[0].Id}).then(result=>{
                  let cheklist=JSON.parse(result.checklistdata);
                  //console.log('shift data '+JSON.stringify(this.addShiftData));
                  this.ChekListrows=[];
                   this.ChekListrows = cheklist.map((row, index) => {
                     return { 
                         index: index + 1,
                         id: Date.now()+index,  // Ensure unique ID
                         checkListId: row.Id,
                         description: row.Description__c,
                         mandatory: row.Mandatory__c,
                         addShift: row.Add_Shift__c
                     };
                 });
                 console.log('this.ChekListrows after save', JSON.stringify(this.ChekListrows));
                })
            }
            if (addShiftList.length > 0) {
                console.log('First AddShift ID:', addShiftList[0].Id);
            }
             this.refreshStaffData();
            this.shiftStaffId=shiftWithStaffList[0].Id;
            if(this.addShiftData.AddShiftnotification ==true){
              console.log('send push notification')
              /*  sendPushNotification({role:this.addShiftData.AddShiftRole,strdate:this.addShiftData.AddShiftStartDate}).then(response=>{
            }); */
            generateAndSendNotification({role:this.addShiftData.AddShiftRole,strdate:this.addShiftData.AddShiftStartDate,staffId:this.addShiftData.AddShiftStaffValue}).then(response=>{
            });
          }
            setTimeout(()=>{
              this.disableServiceSection=false;
              this.isDisbaleServiceButton=false;
              this.isShowSpinner=false;
              refreshApex(this.wiredServicesResult);
              this.serviceParticipant='';
              this.ServiceTypeIdInParticipant='';
              this.stateValue='';
              this.servicePlan='';
              this.NdisServiceGroupName=false;
              this.serviceGroupName=[];
              this.fundOption=[];
              this.SrviceParticipantName='';
              this.riskIndex='';
              this.selectedHolidayDates=[];
               this.removeHolidayDate=[];
            /*   if(this.isEditShiftScreenFlag ==false){
                this.addShiftData.AddShiftId=addShiftList[0].Id;
                this.shiftStaffId=shiftWithStaffList[0].Id;
              } */
             if(this.postInsertOperation=true){
               this.postInsertOperation=false;
               this.addShiftData.AddShiftId=addShiftList[0].Id;
               this.parentAddShiftId=addShiftList[0].Id;
               this.shiftStaffId=shiftWithStaffList[0].Id;
               this.createShiftlabel="Update Shift" ;
               this.isCreateShiftButton=false;
               this.isEditShiftScreenFlag=true;
             // this.getServiceStaffHourlyRate();
                const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.ServiceStaffValue,this.addShiftData.AddShiftType);
              
              this.serviceStaffHourlyRate = rate;
             }
             this.disablePostInsertButtons=true;
             this.isDisableParticipantCheckBox=false;
              
              this.SplitShiftRows=[];
             this.handleAddSplitShiftRow();
             this.SplitShiftRows[0].shiftWithStaffId=shiftWithStaffList[0].Id
             this.RecurValue=''
             this.recurEveryValue=0
             this.selectedDays=[]
             this.monthOfDay=0;
             this.recurOccurencesValue=0;
             this.recurEndDate='';
            this.AddShiftRecurringCheckboxValue=false;
             this.isRecurWeekFlag=false;
             this.isRecurmontlyFlag=false; 
             this.SplitShiftVisible=true;
             this.isVisibleCreateServicesButton=true;  
             this.showMuteIcon = false;  
             this.showClearIcon = false;
             this.recurTemplate=false;
             this.headingLabel='Edit Shift';
              },1000)
          }else{
            console.log('Split shift'+result.message);  
            this.isShowSpinner=false;
            this.confirMationMessage('Error','Unknown error occured.','Error');
          }
         
        

      }); 
    }else{
      this.isShowSpinner=false;
          if(this.addShiftData.AddShiftDuration <=0){
          this.confirMationMessage('Error','Start Time should be greater than End Time.','Error');
          }
    }
          
  }

  EmptyAddressFields(){
    this.address.street='';
        this.address.citySuburb='';
        this.address.postalcode='';
        this.address.provinceState='';
        this.address.country='';
        this.address.latitude='';
        this.address.longitude='';
  }
  AdreesCheckboxChange(event){
    console.log('event name '+event.target.name)
    let selectedValue=event.target.checked
    if(event.target.name=='facilityAddressCheckbox'){ 
      this.addNewAddressCheckBox=false;
      this.participantAddressCheckBox=false; 
      if(!this.addShiftData.AddShiftFacilityValue){
        this.confirMationMessage('Error','Please Select facility','Error');
        this.isDisableSaveButton=true;
        this.facilityAddressCheckbox=false;
        this.addShiftData.AddShiftParticipantAddressCheckbox=false; 
      }else{
        this.getFacilityAddress();
        
        this.facilityAddressCheckbox=selectedValue;
        
        this.addShiftData.AddShiftEnterOtherLocation=this.addNewAddressCheckBox;
        this.isDisableSaveButton=false;
        this.addShiftData.AddShiftParticipantAddressCheckbox=false; 
      }
     
     
    } else if(event.target.name=='participantAddressCheckBox'){
      this.facilityAddressCheckbox=false;
      this.addNewAddressCheckBox=false;
      console.log('service participnat '+this.serviceParticipant);
      this.isDisableSaveButton=true;
      this.getPartcipantAddress();
      this.participantAddressCheckBox=selectedValue;   
      this.addShiftData.AddShiftEnterOtherLocation=true; 
      this.addShiftData.AddShiftParticipantAddressCheckbox=true; 
    }else{
      this.addNewAddressCheckBox=selectedValue;
      this.EmptyAddressFields();
      this.facilityAddressCheckbox=false;
      this.participantAddressCheckBox=false;
      this.addShiftData.AddShiftEnterOtherLocation=this.addNewAddressCheckBox; 
      this.isDisableSaveButton=false;
      this.addShiftData.AddShiftParticipantAddressCheckbox=false; 
    }

  }
  
  getPartcipantAddress(){
    getClientById({recordId:this.serviceParticipant}).then(result=>{
      const facility = result[0];
      this.address.street = facility.Address__Street__s;
      this.address.citySuburb  = facility.Address__City__s;
      if (facility.Address__CountryCode__s  == "AU"){
        this.address.country  = "Australia";
      }
      this.address.provinceState  = facility.Address__StateCode__s;
      this.address.postalcode  = facility.Address__PostalCode__s;
      this.isDisableSaveButton=true;
      this.fetchGeocode();
    }).catch(error=>{
      this.EmptyAddressFields();
      console.log(' error =>'+JSON.stringify(error));
      this.participantAddressCheckBox=false;
      this.confirMationMessage('Error','Please Select Participant','Error');
     // this.isDisableSaveButton=true;
    })
  }

  
  getFacilityAddress(){
      getFacilityAddress({ facilityId:this.addShiftData.AddShiftFacilityValue})
      .then((result) => {
       // console.log('facility address'+JSON.stringify(result));
        if (result && result.length > 0) {
          const facility = result[0];
          this.address.street = facility.Address__Street__s;
          this.address.citySuburb  = facility.Address__City__s;
          if (facility.Address__CountryCode__s  == "AU"){
            this.address.country  = "Australia";
          }
          this.address.provinceState  = facility.Address__StateCode__s;
          this.address.postalcode  = facility.Address__PostalCode__s;
          this.fetchGeocode();
        }
      })
      .catch((error) => {
      });
  }


  handleDescriptionChange(event) {
    this.checkListDescription = event.target.value;
  }

  confirMationMessage(title,message,variant){
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }
  handlePublishShift(event){
    console.log('isHoloday '+event.currentTarget.dataset.isholiday);
    this.rosterPublishDateAndRole={
      rosterPublishDate:event.currentTarget.dataset.date,
      rosterPublishRole:event.currentTarget.dataset.role,
      isHoliday:event.currentTarget.dataset.isholiday
    }
     this.finalSelectedFacilities=[];

    console.log(' selected facilities '+JSON.stringify(this.facilityValue));
    console.log(' ORG facilities '+JSON.stringify(this.facilityOptions));
    this.finalSelectedFacilities = this.facilityOptions.filter(rec =>
    this.facilityValue.includes(rec.value)
    );
    console.log(' selected facilities '+JSON.stringify(this.finalSelectedFacilities)); 
    if(this.finalSelectedFacilities.length===0){
      this.confirMationMessage('Error','Please select at least one facility to create the shift.','Error');
      return 
    }
    this.isPublishShift=true;
    this.isStaffView=false;
    this.isCalenderShiftView=false;
  }
  handlePublishBack(event){
    this.isPublishShift=false;
    this.isStaffView=true;
    this.isCalenderShiftView=false;
    this.tableFlagFromParent=false;
    this.childRosterInvoices=false;
    this.loadStaffData();
  }
  handleUnAllocated(event){
    console.log('unallocated '+event.currentTarget.dataset.unallocated);
    if(parseInt(event.currentTarget.dataset.unallocated)>0){
      this.rosterPublishDateAndRole={
        rosterPublishDate:event.currentTarget.dataset.date,
        rosterPublishRole:event.currentTarget.dataset.role,
        isHoliday:event.currentTarget.dataset.isholiday
      }
      this.tableFlagFromParent=true;
      this.isPublishShift=true;
      this.isStaffView=false;
      this.isCalenderShiftView=false;
    }else{
      this.confirMationMessage('Error','The quantity must be greater than zero before assignment.','Error');
    }
    
  }

  @track ShiftwithStafftoApexId = null;
  handleEditShiftScreen(event){
   // this.servicesList=[];
    console.log('shift staff id '+event.currentTarget.dataset.shiftstaffid);
    this.shiftStaffId=event.currentTarget.dataset.shiftstaffid;
      this.finalSelectedFacilities=[];

      console.log(' selected facilities '+JSON.stringify(this.facilityValue));
      console.log(' ORG facilities '+JSON.stringify(this.facilityOptions));
      this.finalSelectedFacilities = this.facilityOptions;
    
    //refreshApex(this.wiredServicesResult);
    this.isStaffView=true;
    this.isCalenderShiftView=true;
    this.isPublishShift=false;
    this.isEditShiftScreenFlag=true;
    this.isIncludeParticipants=true;
    this.AddShiftIncludePartcipants=true;
    this.AddShiftRecurringCheckboxValue=false;
    this.handleLinkParticipants();
    this.SplitShiftRows=[];
    this.deletedChecklist=[];
    this.disableServiceSection=false;
    /* this.isDisbaleServiceButton=false */
    this.isDisbaleServiceButton = true;
    this.postInsertOperation ==false;
    this.isTooltip=false;
    this.isModalOpen=false;
    this.SplitShiftVisible=true;
    
    this.headingLabel='Edit Shift';
    this.isDisableParticipantCheckBox=false;
    this.cutsomShiftTemplate=false;
     this.ServiceTypeIdInParticipant='';
    this.emptyFields();
   this.isCreateShiftButton=false;
   this.participantAddressCheckBox=false;
      getAddShiftDataById({shiftId:this.shiftStaffId}).then(result=>{
         console.log('shift data '+JSON.stringify(result));
         this.ShiftwithStafftoApexId = result.shiftwithstaffdata.Id;
         console.log('this.ShiftwithStafftoApexId >>'+this.ShiftwithStafftoApexId);
         this.addShiftData={
           AddShiftId:result.shiftwithstaffdata.Add_Shift__r.Id,
           AddShiftStartDate:result.shiftwithstaffdata.Add_Shift__r.Start_Date__c,
           AddShiftStaffValue:result.shiftwithstaffdata.Staff__c,
           AddShiftFacilityValue:result.shiftwithstaffdata.Add_Shift__r.Facility__c,
           AddShiftRole:result.shiftwithstaffdata.Add_Shift__r.Role__c,
           AddShiftType:result.shiftwithstaffdata.Add_Shift__r.Shift_Type__c,
           AddShiftBreak:result.shiftwithstaffdata.Add_Shift__r.Break__c,
           AddShiftDuration:result.shiftwithstaffdata.Add_Shift__r.Duration__c,
           AddShiftStartTime:this.convertTo24HourFormat(result.shiftwithstaffdata.Add_Shift__r.Start_Time_Text__c),
           AddShiftStartTimeAMPM:result.shiftwithstaffdata.Add_Shift__r.Start_Time_Text__c.toUpperCase(),
           AddShiftEndTime:this.convertTo24HourFormat(result.shiftwithstaffdata.Add_Shift__r.End_Time_Text__c),
           AddShiftEndTimeAMPM:result.shiftwithstaffdata.Add_Shift__r.End_Time_Text__c.toUpperCase(),
           AddShiftnotification:result.shiftwithstaffdata.Send_Notification__c,
           AddShiftStaffHourlyRate:result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c,
           AddShiftQuantity:result.shiftwithstaffdata.Add_Shift__r.Quantity__c,
           AddShiftNotes:result.shiftwithstaffdata.Add_Shift__r.Shift_Notes__c ?result.shiftwithstaffdata.Add_Shift__r.Shift_Notes__c:'',
           AddShiftEOI:result.shiftwithstaffdata.Add_Shift__r.Is_EOI__c  ,
           AddShiftHoliday:result.shiftwithstaffdata.Public_holiday__c ==true || result.shiftwithstaffdata.Recur_Holiday__c ==true ? true:false  ,
           AddShiftEnterOtherLocation:result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c  ,
           AddShiftStatus: result.shiftwithstaffdata.Status__c,
           AddShiftParticipantAddressCheckbox:result.shiftwithstaffdata.Add_Shift__r.Participant_Address_checkbox__c,
           AddShiftEndDate:result.shiftwithstaffdata.Add_Shift__r.End_Date__c
       }
       this.dispalyAmPMFormat();
       this.hourlrRateLabel= this.addShiftData.AddShiftType =='Sleepover Shift' ?'Allowance':'Hourly Rate';
       console.log('this.hourlrRateLabel 2696>>'+this.hourlrRateLabel);
       const shiftType = result.shiftwithstaffdata.Add_Shift__r?.Shift_Type__c;
       const rows = [];
       const shift=result.shiftwithstaffdata

        const buildRow = (label, startMs, endMs, rate, duration) => {
          const startTime24 = this.formatMillisecondsToTime(startMs);
          const endTime24 = this.formatMillisecondsToTime(endMs);

          const startAmPm = this.convertToAmPmObject(startTime24);
          const endAmPm = this.convertToAmPmObject(endTime24);

          return {
              id: Date.now() + Math.floor(Math.random() * 1000),
              startTime: `${startTime24}:00Z`,
              endTime: `${endTime24}:00Z`,
              hourlyRate: rate?.toString() || '',
              rowShiftType: label,
              duration: duration || 0,

              // Extra variables for start time
              startTimeselectedHour: startAmPm.selectedHour,
              startTimeselectedMinute: startAmPm.selectedMinute,
              startTimeselectedAmPm: startAmPm.selectedAmPm.toUpperCase()=="AM" ?true:false,
              startTimdisplayTime: startAmPm.displayTime,


              endTimeselectedHour: endAmPm.selectedHour,
              endTimeselectedMinute: endAmPm.selectedMinute,
              endTimeselectedAmPm: endAmPm.selectedAmPm.toUpperCase()=="AM" ?true:false,
              endTimeDdisplayTime: endAmPm.displayTime
          };
      };

    if (shiftType === 'Custom') {
      
        if (shift.Is_long_Morning__c) {
            rows.push(buildRow('Morning', shift.Long_Morning_Start_Time__c, shift.Long_Morning_End_Time__c, shift.Long_Morning_Hourly_Rate__c, shift.Long_Morning_Shift_Duartion__c));
        }
        if (shift.Is_Long_Afternoon__c) {
            rows.push(buildRow('Afternoon', shift.Long_Afternoon_Start_Time__c, shift.Long_Afternoon_End_Time__c, shift.Long_Afternoon_Hourly_Rate__c, shift.Long_Afternoon_Shift_Duartion__c));
        }
        if (shift.Is_Long_Night_Shift__c) {
            rows.push(buildRow('Night', shift.Long_Night_Start_Time__c, shift.Long_Night_End_Time__c, shift.Long_Night_Hourly_Rate__c, shift.Long_Night_Shift_Duartion__c));
        }
        if (shift.Is_Long_SleepOver__c) {
            console.log('shift.Long_Sleepover_Allowance__c >>'+shift.Long_Sleepover_Allowance__c);
            rows.push(buildRow('Sleepover Shift', shift.Long_Sleepover_Start_Time__c, shift.Long_Sleepover_End_Time__c, shift.Long_Sleepover_Allowance__c, shift.Long_Sleepover_Duration__c));
        }
    }
    this.rateRows = rows;
    this.IsLongShift=this.rateRows.length >=1 ?true:false;
    this.LongShiftTimeSlots={}
    this.rateRows.forEach(row => {
      this.LongShiftTimeSlots[row.rowShiftType] = row;
    });
    

    console.log('Formatted Shift Rows with AM/PM:', JSON.stringify(this.LongShiftTimeSlots));
       console.log('rows '+JSON.stringify(rows));
       this.hourlyrateDisable=true;
      if(result.shiftwithstaffdata.Add_Shift__r.Participant_Address_checkbox__c ==true){
        this.addNewAddressCheckBox=false;
        this.participantAddressCheckBox=true;
       }else if(result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c ==true && result.shiftwithstaffdata.Add_Shift__r.Participant_Address_checkbox__c ==false){
        this.addNewAddressCheckBox =true;
       }
      // this.addNewAddressCheckBox=result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c;
       // this.addNewAddressCheckBox=result.shiftwithstaffdata.Add_Shift__r.Participant_Address_checkbox__c ==true ? result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c;
      this.facilityAddressCheckbox=result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c ? false:true; 
      this.address.street=result.shiftwithstaffdata.Add_Shift__r.Location__Street__s;
      this.address.citySuburb=result.shiftwithstaffdata.Add_Shift__r.Location__City__s;
      this.address.postalcode=result.shiftwithstaffdata.Add_Shift__r.Location__PostalCode__s;
      this.address.provinceState=result.shiftwithstaffdata.Add_Shift__r.Location__StateCode__s;
      this.address.country=result.shiftwithstaffdata.Add_Shift__r.Location__CountryCode__s;
      this.address.latitude=result.shiftwithstaffdata.Add_Shift__r.Location__Latitude__s;
      this.address.longitude=result.shiftwithstaffdata.Add_Shift__r.Location__Longitude__s ;

       this.AddShiftDayName=result.shiftwithstaffdata.Add_Shift__r.Day_Name__c=='Saturday' ? 'Day 5':result.shiftwithstaffdata.Add_Shift__r.Day_Name__c=='Sunday' ? 'Day 6':result.shiftwithstaffdata.Add_Shift__r.Day_Name__c;
       console.log(' this.AddShiftDayName '+this.AddShiftDayName);
       let cheklist=JSON.parse(result.checklistdata);
       //console.log('shift data '+JSON.stringify(this.addShiftData));
        this.ChekListrows = cheklist.map((row, index) => {
          return { 
              index: index + 1,
              id: Date.now()+index,  // Ensure unique ID
              checkListId: row.Id,
              description: row.Description__c,
              mandatory: row.Mandatory__c,
              addShift: row.Add_Shift__c
          };
      });
       this.ServiceStaffValue=result.shiftwithstaffdata.Staff__c;
       this.serviceStaffHourlyRate=result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c;
       console.log('cheklist data '+JSON.stringify(this.ChekListrows));
       if( result.shiftwithstaffdata.Status__c=='InProgress' ||  result.shiftwithstaffdata.Status__c=='Completed' ){
        this.showLocation=true;
        this.disableServiceSection=true;
        this.disablePostInsertButtons=true;
        this.isDisableParticipantCheckBox=true;
        this.isDisableSaveButton=true;
        this.disableTimeButton=true;
       
      }else{
        this.showLocation=false;
        this.isDisableSaveButton=false;
        this.disableTimeButton=false;
      }
      if(result.shiftwithstaffdata.Split_Shifts__c==true){
        this.disableServiceSection=true;
       
      }
      this.hideLocation=false;
      
   //let serviceSupportId=this.servicesList[0].Id
      // console.log('services list '+JSON.stringify(this.servicesList));
      this.parentAddShiftId=result.shiftwithstaffdata.Add_Shift__r.Id;
      setTimeout(() => { 
       this.handleAddSplitShiftRow()
       this.SplitShiftRows[0].shiftWithStaffId=result.shiftwithstaffdata.Id;
       this.SplitShiftRows[0].serviceStffaHourlyRate=result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c;
       this.SplitShiftRows[0].StaffId=result.shiftwithstaffdata.Staff__c;
       this.SplitShiftRows[0].duration=result.shiftwithstaffdata.Add_Shift__r.Duration__c;
       this.SplitShiftRows[0].serviceDate=result.shiftwithstaffdata.Add_Shift__r.Start_Date__c;
       this.finalAddShiftData.shiftaddress=this.address;
       this.finalAddShiftData.shiftDetails=this.addShiftData;
       console.log('finalAddShiftData  in EDIT ===> '+JSON.stringify(this.finalAddShiftData));
       console.log('Split Shift rows '+JSON.stringify(this.SplitShiftRows));
       this.RecurValue=''
       this.recurEveryValue=0
       this.selectedDays=[]
       this.monthOfDay=0;
       this.recurOccurencesValue=0;
       this.riskIndex='';
       this.isRecurWeekFlag=false;
       this.isRecurmontlyFlag=false;
       this.showMuteIcon = false;
       this.showClearIcon = false;
       this.recurTemplate=false;
      // this.isDisableSaveButton=false;
       this.isVisibleCreateServicesButton=true; 
       this.staffSlistOnSelection();
       this.RolesStaffId=this.addShiftData.AddShiftStaffValue;
          this.fetchStaffRoles();
          console.log(' services length '+this.servicesList.length);

          refreshApex(this.wiredServicesResult).then(() => {
            if (this.servicesList.length > 0 || result.shiftwithstaffdata.Split_Shifts__c==true) {
              console.log(' if in service length')
              this.SplitShiftVisible =false;

             } else{
              this.SplitShiftVisible =true;
             } 
        });
           
       })
      
    }, 1500);
   
   
  }
  formatMillisecondsToTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');

    return `${hh}:${mm}`;
}
convertToAmPmObject(time24) {
  const [hourStr, minuteStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';

  if (hour === 0) hour = 12;
  else if (hour > 12) hour = hour - 12;

  return {
      selectedHour: hour.toString().padStart(2, '0'),
      selectedMinute: minute.toString().padStart(2, '0'),
      selectedAmPm: ampm,
      displayTime: `${hour.toString().padStart(2, '0')}:${minuteStr} ${ampm}`
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
   
    HandleServiceEdit(event){
      this.isServiceEdit=true;
      this.serviceEditID=event.currentTarget.dataset.id;
      this.ServiceTypeEditvalue=event.currentTarget.dataset.serviceid;
     // console.log('service partcipant '+event.currentTarget.dataset.serviceid)
      console.log('service name'+event.currentTarget.dataset.servicename)
     let servicesName=event.currentTarget.dataset.servicename;
     let ndisCatlogvalue=event.currentTarget.dataset.servicetype;
     this.participantIdInEdit =event.currentTarget.dataset.participantid;
      getClientFunds({clientId :event.currentTarget.dataset.participantid}).then(response=>{
        console.log('funds '+JSON.stringify(response));
        if(response){
         this.serviceEditTotalFund=response;
          this.serviceEditFundOption=response.map(rec=>{
            return { "label": rec.Registration_Group__c,"value": rec.Id};
          });
          this.NdisServiceGroupNameinEdit=true;
          getCatalogueData({ serviceType: this.ServiceTypeEditvalue, clientId: this.participantIdInEdit }).then(result => {
            const catalogueData = result.catalogueData;
            const stateField = result.statesCombined; // e.g., "NSW__c"
  
            this.ServiceStateEditValue = stateField;
  
            this.serviceEditGroupName = catalogueData.map(rec => {
              const isSelected = rec.Id === ndisCatlogvalue;
              return {
                  ...rec,
                  amount: rec[stateField] || 0,
                  isSelected: isSelected
              };
          });
  
            console.log('Service Group with Amounts:', JSON.stringify(this.serviceEditGroupName));
        }).catch(error => {
            console.error('Error fetching catalogue data:', error);
        });
  
        }
      }).catch(error=>{
      }) 
   }
   handleEditServiceChange(event){

    let servicesName=event.target.options.find(opt => opt.value === event.detail.value).label;
    console.log('shift servicesName '+servicesName);
    this.ServiceTypeEditvalue=event.detail.value;
    this.ServiceStateEditValue='';
    this.NdisServiceGroupNameinEdit=false;
    console.log('this.participantIdInEdit '+this.participantIdInEdit );
    if (this.ServiceTypeEditvalue) {
      this.serviceEditGroupName= [];
      this.NdisServiceGroupNameinEdit=true;
      // Fetch catalogue data
      getCatalogueData({ serviceType: this.ServiceTypeEditvalue, clientId: this.participantIdInEdit }).then(result => {
          const catalogueData = result.catalogueData;
          const stateField = result.statesCombined; // e.g., "NSW__c"

          this.ServiceStateEditValue = stateField;

          this.serviceEditGroupName = catalogueData.map(rec => {
              return {
                  ...rec,
                  amount: rec[stateField] || 0 // dynamically pick amount using stateField
              };
          });

          console.log('Service Group with Amounts:', JSON.stringify(this.serviceEditGroupName));
      }).catch(error => {
          console.error('Error fetching catalogue data:', error);
      });
  }

   }
  
   
  HandleEditNdisCheckBox(event){
    const selectedId = event.target.getAttribute('data-id'); // Get the selected row's ID
    const selectedRow = this.serviceEditGroupName.find(row => row.Id === selectedId); 
    console.log('Selected row '+JSON.stringify(selectedRow));
    this.ServiceEditNdisValue = selectedRow.Id;
    // Update the isSelected property for all rows
    this.serviceEditGroupName = this.serviceEditGroupName.map(row => ({
        ...row,
        isSelected: row.Id === selectedId // Set true for the selected row, false for others
    }));

    console.log('Selected Row ID:', selectedId);
  }
   handleHideServiceModal(){
    this.isServiceEdit=false;
    this.NdisServiceGroupNameinEdit=false;
    this.serviceEditGroupName=[];
    this.ServiceStateEditValue='';
   }
   handleServiceEditSubmit(event){
    event.preventDefault();// stop the form from submitting
    const fields = event.detail.fields; 
   // console.log('After fields>>'+this.ServiceTypeEditvalue);

    fields.Funds_Tracker__c=this.ServiceTypeEditvalue;
    fields.Service_Type__c=this.ServiceEditNdisValue;
    console.log('After fields>>'+JSON.stringify(fields));

    this.template.querySelector('lightning-record-edit-form[data-recid="serviceEdit"]').submit(fields);
  } 
  handleServiceEditSuccess(event){
    this.isServiceEdit=false;
    console.log('After Success '+JSON.stringify(event.detail));
   // this.template.querySelector('lightning-record-edit-form').reset()
   this.confirMationMessage('Success','Services Updated successfully','Success');
    refreshApex(this.wiredServicesResult);
    this.NdisServiceGroupNameinEdit=false;
    this.ServiceStateEditValue='';
   
  }
  handleDeleteService(event){
    this.isShowSpinner=true;
   // let serviceId=event.currentTarget.dataset.id;
    deleteRecord(this.participantServiceDeleteInfo.serviceId).then(() => {
      this.confirMationMessage('Success','The service for '+this.participantServiceDeleteInfo.partcipantName+' has been deleted successfully.','Success');
      refreshApex(this.wiredServicesResult);
      this.ServiceWarningMessage=false;
      this.refreshStaffData();
    });
  }
  handleDeleteConfirmation(event){
    this.ServiceWarningMessage=true;
    this.participantServiceDeleteInfo={};
    this.participantServiceDeleteInfo.partcipantName=event.currentTarget.dataset.participantname;
    this.participantServiceDeleteInfo.serviceId=event.currentTarget.dataset.id;
    this.participantServiceDeleteInfo.serviceName=event.currentTarget.dataset.servicename;

  }

  validateInputs() {
    let isValid = true; // Track overall form validity

    // Define fields to validate
    let fields = [
        { name: "AddShiftStartDate", selector: ".AddShiftStartDate", errorMessage: "Start Date is required." },
        { name: "AddShiftStaffValue", selector: ".AddShiftStaffValue", errorMessage: "Staff is required." },
        { name: "AddShiftFacilityValue", selector: ".AddShiftFacilityValue", errorMessage: "Facility is required." },
        { name: "AddShiftRole", selector: ".AddShiftRole", errorMessage: "Role is required." },
        { name: "AddShiftType", selector: ".AddShiftType", errorMessage: "Shift Type is required." },

    ];

    console.log("Starting Validation...");

    fields.forEach(field => {
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
  let addressCmp = this.template.querySelector('.addressClass');

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
                  if (!value || value.trim() === '') {
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
                  if (!value || value.trim() === '') {
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
    handleDragStart(event) {
     let staffId = event.currentTarget.dataset.id;
       event.dataTransfer.setData("staffId", event.currentTarget.dataset.id);
      console.log('Dragging staff with ID:', staffId);
    }
    handleDragOver(event) {
      event.preventDefault(); // Required to allow dropping
  }
  handleDrop(event) {
    event.preventDefault();
    let draggedItemId = event.dataTransfer.getData("staffId");
    console.log("Dropped item ID:", draggedItemId);

    this.emptyFields();
    let holiday= event.currentTarget.dataset.isholiday;
        let shiftdate=event.currentTarget.dataset.weekdate;
        let role=event.currentTarget.dataset.role;
        console.log('role '+role);
        this.addShiftData.AddShiftRole=role;
        
        this.addShiftData.AddShiftStartDate=shiftdate;
        this.addShiftData.AddShiftFacilityValue=this.SelectedComboBoxFacility;
        this.addShiftData.AddShiftHoliday=holiday =="true"?true:false ;
        this.AddShiftDayName=event.currentTarget.dataset.weekname;
        this.addShiftData.AddShiftStaffValue=draggedItemId;
        this.RolesStaffId=draggedItemId;
        this.addShiftData.AddShiftType='General';
        this.ServiceStaffValue=draggedItemId;
        this.isCalenderShiftView = true; 
        this.isEditShiftScreenFlag=false;
        this.isIncludeParticipants=false;
        this.AddShiftIncludePartcipants=true;
        this.isStaffView=true;
        this.SplitShiftRows=[];
         this.createCalenderShift();
      //  this.loadStaffComboBox();
        if(this.isSplitCheckbox== true||this.serviceParticipant ==null){
          this.isDisableParticipantCheckBox=true;
        }
    
      const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.addShiftData.AddShiftStaffValue,this.addShiftData.AddShiftType);
              
      this.addShiftData.AddShiftStaffHourlyRate= rate; 
       this.getFacilityAddress();
      this.facilityAddressCheckbox=true;
        this.addNewAddressCheckBox=false;
        this.participantAddressCheckBox=false;
       this.isNewInsertOperation=true;
       this.shiftStaffId='';
       this.servicesList=[];
       refreshApex(this.wiredServicesResult);

   }
   handleCreateServiceSection(event){
    this.isShowSpinner=true;
     this.LongShiftTimeSlots={};
      console.log('service staff '+this.ServiceStaffValue);
      console.log('addShift staff '+this.addShiftData.AddShiftStaffValue);
      this.SplitShiftRows[0].duration=this.addShiftData.AddShiftDuration;
      this.SplitShiftRows[0].startTime=this.addShiftData.AddShiftStartTime;
      this.SplitShiftRows[0].endTime=this.addShiftData.AddShiftEndTime;
      this.SplitShiftRows[0].serviceDate=this.addShiftData.AddShiftStartDate;
    //  this.SplitShiftRows[0].LongShiftTimeSlots=JSON.stringify(this.LongShiftTimeSlots);
      let checkListJsonData
       if(this.ServiceStaffValue ==this.addShiftData.AddShiftStaffValue &&this.postInsertOperation ==false){ 
        this.SplitShiftRows[0].shiftWithStaffId=this.shiftStaffId;
        this.AddShiftIncludePartcipants=true;
        this.isEditShiftScreenFlag=true;
        checkListJsonData=[]
        console.log('AddShiftIncludePartcipants' +this.AddShiftIncludePartcipants);
        console.log('isEditShiftScreenFlag' +this.isEditShiftScreenFlag)
        console.log('finalAddShiftData  in service ===> '+JSON.stringify(this.finalAddShiftData));
       
        console.log('checkListJsonData in service  '+JSON.stringify(this.ChekListrows));
        this.createFinalService(checkListJsonData);
        
        }
        if(this.ServiceStaffValue !=this.addShiftData.AddShiftStaffValue &&this.postInsertOperation ==false){ 
          this.addShiftData.AddShiftId=null;
          this.SplitShiftRows[0].shiftWithStaffId=null;
          this.AddShiftIncludePartcipants=true;
          this.isEditShiftScreenFlag=false;
          checkListJsonData = this.ChekListrows.map(row => ({
            ...row, // Retains existing fields
            description: row.description,
            mandatory: row.mandatory
            }));
           // console.log('AddShiftIncludePartcipants' +this.AddShiftIncludePartcipants);
           // console.log('isEditShiftScreenFlag' +this.isEditShiftScreenFlag)
          //  console.log('finalAddShiftData  in service ===> '+JSON.stringify(this.finalAddShiftData));
         //   console.log('Split Shift rows '+JSON.stringify(this.SplitShiftRows));
          //  console.log('checkListJsonData in service  '+JSON.stringify(this.ChekListrows));
            getOverlappingShiftsData({strtTimeText:this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),endTimeText:this.addShiftData.AddShiftEndTimeAMPM.toLowerCase(),StaffID:this.ServiceStaffValue,startdate:this.addShiftData.AddShiftStartDate,shiftType:this.addShiftData.AddShiftType,ShiftwithStaffId:this.ShiftwithStafftoApexId}).then(result=>{
              console.log('over lapping data '+result);
              if(result==true){
                this.confirMationMessage('Error','The selected staff already has a shift within the start and end times. Please click on shift and assign the services to the particular participant.','Error');
                this.isShowSpinner=false;
              }else{
                 this.createFinalService(checkListJsonData);
              }
             
             })
        }
     
    
      
      
        
   }
   createFinalService(checkListJsonData){
        if(this.validateAddress() ){
         
         /*  const newStartDate = new Date(`1970-01-01T${this.SplitShiftRows[0].startTime}`);
          const newEndDate = new Date(`1970-01-01T${this.SplitShiftRows[0].endTime}`);
          if (newEndDate <= newStartDate) {
              this.confirMationMessage('Error', 'End time must be greater than start time.', 'Error');
              this.isShowSpinner = false;
              return; 
          } */
         
          this.SplitShiftRows=this.SplitShiftRows.map( rec=>{
            return {
              ...rec,LongShiftTimeSlots:JSON.stringify(this.LongShiftTimeSlots)
            }
           
          })
          console.log('Split Shift rows '+JSON.stringify(this.SplitShiftRows));
           createAddShift({addshiftData:JSON.stringify(this.finalAddShiftData),isRecurring:this.AddShiftRecurringCheckboxValue,typeOfRecur:this.RecurValue,
            recurEvery:this.recurEveryValue,endDate:this.recurEndDate,shiftDate:this.addShiftData.AddShiftStartDate, weeklyDays:this.selectedDays,monthlyDay:this.monthOfDay,
            servicesJsonData:JSON.stringify(this.SplitShiftRows),checkListJsonData:JSON.stringify(checkListJsonData),isUpdate:this.isEditShiftScreenFlag,includeParticipants:this.AddShiftIncludePartcipants, recurrenceDates: this.recurrenceDatesList}).then(result=>{
             // console.log('result '+JSON.stringify(result));
           //  console.log('is split shifts '+this.isSplitCheckbox);
           
            
              if(result.isSuccess){
                if(this.isSplitCheckbox==true){
                  this.confirMationMessage('Success','The service has been successfully created.','Success');
                 }else{
                  this.confirMationMessage('Success','The service for '+this.SrviceParticipantName+' has been successfully created.','Success');
                 }
                let shiftWithStaffList = JSON.parse(result.shiftWithstaffResult);
                let addShiftList = JSON.parse(result.AddShiftResult);
        
                console.log('Shift With Staff:',JSON.stringify(shiftWithStaffList) );
                console.log('Add Shift List:', JSON.stringify(addShiftList));
        
                if (shiftWithStaffList.length > 0) {
                    console.log('First ShiftWithStaff ID:', shiftWithStaffList[0].Id);
                }
                if (addShiftList.length > 0) {
                    console.log('First AddShift ID:', addShiftList[0].Id);
                }
                 this.refreshStaffData();
                 refreshApex(this.wiredServicesResult);
                 this.serviceParticipant='';
                 this.ServiceTypeIdInParticipant='';
                 this.stateValue='';
                 this.servicePlan='';
                 this.NdisServiceGroupName=false;
                 this.serviceGroupName=[];
                 this.riskIndex='';
                 this.fundOption=[];
                 this.SrviceParticipantName='';
                  this.SplitShiftRows=[];
                  this.selectedHolidayDates = [];
                   this.removeHolidayDate=[];
      
                  this.isSplitCheckbox=false;
                 this.handleAddSplitShiftRow();
                 this.SplitShiftVisible=true;
                  console.log('Split shift'+JSON.stringify(this.SplitShiftRows));
                  this.addShiftData.AddShiftId=this.parentAddShiftId;
                  this.isVisibleCreateServicesButton=true; 
                  this.serviceTableAddButton=false
                  this.isDisableSaveButton = false;  
                 
              }else{
                console.log('Split shift'+result.message);  
                this.isShowSpinner=false;
                this.confirMationMessage('Error','Unknown error occured.','Error');
              }
          }); 
      //  this.createFinalService(checkListJsonData);
      }else{
        this.confirMationMessage('Error','Please select Address.','Error');
        this.isShowSpinner=false;
      }
    
   }
   getServiceStaffHourlyRate(isHoliday, dayName, staffId, shiftType) {
        const staffRate = this.StaffHourlyRates[staffId]?.staffHoulryRate;

        if (!staffRate) {
            return 0;
        }

        // Default settings
        let rate = 0;
        this.hourlrRateLabel = 'Hourly Rate';
        this.hourlyrateDisable = true;

        // Sleepover Shift with special cases
        if (shiftType === 'Sleepover Shift') {
            this.hourlrRateLabel = 'Allowance';
            this.hourlyrateDisable = false;
            rate = 0;
            
            console.log(`this.hourlrRateLabel (Sleepover)>>`, this.hourlrRateLabel);
            return rate;
        }

        // General public holiday
        if (isHoliday) {
            rate = staffRate.Public_holiday_Hourly_Rate__c || 0;
            console.log('this.hourlrRateLabel (Holiday)>>', this.hourlrRateLabel);
            return rate;
        }

        // Weekend handling
        if (dayName === 'Day 6') {
            rate = staffRate.Sunday_Hourly_Rate__c || 0;
            console.log('this.hourlrRateLabel (Sunday)>>', this.hourlrRateLabel);
            return rate;
        }

        if (dayName === 'Day 5') {
            rate = staffRate.Saturday_Hourly_Rate__c || 0;
            console.log('this.hourlrRateLabel (Saturday)>>', this.hourlrRateLabel);
            return rate;
        }

        // Shift Type Handling
        switch (shiftType) {
            case 'General':
            case 'Morning':
                rate = staffRate.Working_Hours_Rate__c || 0;
                break;
            case 'Night':
                rate = staffRate.Night_shift_Hourly_Rate__c || 0;
                break;
            case 'Afternoon':
                rate = staffRate.Afternoon_shift_Hourly_Rate__c || 0;
                break;
            case 'Custom':
                rate = 0;
                break;
            default:
                rate = staffRate.Working_Hours_Rate__c || 0;
        }

        console.log(`this.hourlrRateLabel (${shiftType})>>`, this.hourlrRateLabel);
        return rate;
    }


   handleUpdateShift(){
    this.isShowSpinner=true;
    console.log('service staff '+this.ServiceStaffValue);
   // console.log('addShift staff '+this.addShiftData.AddShiftStaffValue);
   
    this.SplitShiftRows[0].StaffId=this.addShiftData.AddShiftStaffValue;
    this.SplitShiftRows[0].serviceStffaHourlyRate=this.addShiftData.AddShiftStaffHourlyRate;
    this.SplitShiftRows[0].shiftWithStaffId=this.shiftStaffId;
    this.SplitShiftRows[0].LongShiftTimeSlots=JSON.stringify(this.LongShiftTimeSlots);
    this.AddShiftIncludePartcipants=this.AddShiftIncludePartcipants==true?true:false;
    this.isEditShiftScreenFlag=true;
    console.log('finalAddShiftData  in service '+JSON.stringify(this.finalAddShiftData));
    console.log('Split shift'+JSON.stringify(this.SplitShiftRows));
    console.log('Include participants '+this.AddShiftIncludePartcipants);
      if (this.deletedChecklist.length > 0) {
        // Create an array of deleteRecord promises
       // const deletePromises = this.deletedChecklist.map(rec => deleteRecord(rec.checkListId));
       let AddShiftCheckListId=[];
       this.deletedChecklist.forEach((row) => {
         AddShiftCheckListId.push(row.checkListId);
       })

        deleteCheckList({checkListId:AddShiftCheckListId}).then(result=>{

          console.log('checklist delete result '+result)})
    } 


    const checkListJsonData = this.ChekListrows.map(row => ({
      ...row, 
      description: row.description,
      mandatory: row.mandatory
      }));
      console.log('check list data  '+JSON.stringify(checkListJsonData));
      if(this.validateAddress() ){
        createAddShift({addshiftData:JSON.stringify(this.finalAddShiftData),isRecurring:this.AddShiftRecurringCheckboxValue,typeOfRecur:this.RecurValue,
          recurEvery:this.recurEveryValue,endDate:this.recurEndDate,shiftDate:this.addShiftData.AddShiftStartDate, weeklyDays:this.selectedDays,monthlyDay:this.monthOfDay,
          servicesJsonData:JSON.stringify(this.SplitShiftRows),checkListJsonData:JSON.stringify(checkListJsonData),isUpdate:this.isEditShiftScreenFlag,includeParticipants:this.AddShiftIncludePartcipants, recurrenceDates: this.recurrenceDatesList}).then(result=>{
           
            if(result.isSuccess){
              let shiftWithStaffList = JSON.parse(result.shiftWithstaffResult);
              let addShiftList = JSON.parse(result.AddShiftResult);
              this.confirMationMessage('Success','Your shift has been successfully updated. Please proceed with adding staff/participants to this shift.','Success');
           //   console.log('Shift With Staff:',JSON.stringify(shiftWithStaffList) );
            //  console.log('Add Shift List:', JSON.stringify(addShiftList));
      
              if (shiftWithStaffList.length > 0) {
                  console.log('First ShiftWithStaff ID:', shiftWithStaffList[0].Id);
                  getAddShiftDataById({shiftId:shiftWithStaffList[0].Id}).then(result=>{
                    let cheklist=JSON.parse(result.checklistdata);
                    //console.log('shift data '+JSON.stringify(this.addShiftData));
                    this.ChekListrows=[];
                     this.ChekListrows = cheklist.map((row, index) => {
                       return { 
                           index: index + 1,
                           id: Date.now()+index,  // Ensure unique ID
                           checkListId: row.Id,
                           description: row.Description__c,
                           mandatory: row.Mandatory__c,
                           addShift: row.Add_Shift__c
                       };
                   });
                   console.log('this.ChekListrows after save', JSON.stringify(this.ChekListrows));
                  })
                  
              }
              if (addShiftList.length > 0) {
                  console.log('First AddShift ID:', addShiftList[0].Id);
              }
               this.refreshStaffData();
               refreshApex(this.wiredServicesResult);
               this.SplitShiftRows=[]; //
               this.handleAddSplitShiftRow();
               
                this.SplitShiftRows[0].shiftWithStaffId=shiftWithStaffList[0].Id
                this.addShiftData.AddShiftId=this.parentAddShiftId;
                 this.RecurValue=''
                this.recurEveryValue=0
                this.selectedDays=[]
                this.monthOfDay=0;
                this.recurEndDate='';
                this.AddShiftRecurringCheckboxValue=false;
                this.AddShiftIncludePartcipants=false;
                this.showMuteIcon = false;
                this.showClearIcon = false;
                this.recurTemplate=false;
                this.isSplitCheckbox = false;
              this.selectedHolidayDates=[];
              this.removeHolidayDate=[];
                this.ShiftwithStafftoApexId = null;
                console.log('Split shift'+JSON.stringify(this.SplitShiftRows));
               
            }else{
              console.log('Split shift'+JSON.stringify(result));  
              this.isShowSpinner=false;
              this.confirMationMessage('Error','Unknown error occured.','Error');
            } 
  
        }); 

      }else{
        this.confirMationMessage('Error','Please select Address.','Error');
          this.isShowSpinner=false;
      }
       

   }

   handleDeleteShift(event) {
    this.isShowSpinner=true;
    // Prevent deletion if status is "In Progress"
   
    if (this.shiftDeleteCOnfirmationInfo.status === 'InProgress' || this.shiftDeleteCOnfirmationInfo.status === 'Completed' ) {
        this.confirMationMessage('Error', 'Cannot delete shift while it is In Progress or Completed.', 'error');
        this.shiftDeleteConfirmation=false;
        this.isShowSpinner=false;
        return;
    }
    console.log('Before this.shiftStaffId==>'+this.shiftStaffId);
    // Assign shift ID
    this.shiftStaffId = this.shiftDeleteCOnfirmationInfo.shiftID;
    console.log('this.shiftStaffId==>'+this.shiftStaffId);

    // Refresh the service list before attempting to delete
       refreshApex(this.wiredServicesResult).then(() => {
        console.log('Updated Service List:', JSON.stringify(this.servicesList));

        // Check if services exist for the shift
        if (this.servicesList.length > 0 && this.shiftDeleteCOnfirmationInfo.status ==='InProgress' &&  this.shiftDeleteCOnfirmationInfo.status === 'Completed' ) {
            console.log('Services exist for shift.');
            this.confirMationMessage('Error', 'Cannot delete shift. Services are still associated.', 'error');
            this.shiftDeleteConfirmation=false;
            this.isShowSpinner=false;
           
        }else if (this.recurredShiftsDelete==true){
            deleterecurShifts({refId:this.shiftDeleteCOnfirmationInfo.refId,recurDate:this.shiftDeleteCOnfirmationInfo.recurStartDate}).then(result=>{
               // console.log('result '+result) 
                   this.confirMationMessage('Success', 'Shifts deleted successfully.', 'success');
                     // Refresh the service list after deletion
                    this.refreshStaffData();
                    this.shiftDeleteConfirmation=false;
                    return refreshApex(this.wiredServicesResult);
              }).catch(error=>{
                 this.confirMationMessage('Error', 'Error deleting shift.', 'error');
                  this.shiftDeleteConfirmation=false;
                    this.isShowSpinner=false;
                console.log('error '+error)})
         }else{
        
            console.log('No Services exist for shift.'); // Proceed with record deletion
            deleteRecord(this.shiftDeleteCOnfirmationInfo.shiftID)
                .then(() => {
                    this.confirMationMessage('Success', 'Shift deleted successfully.', 'success');
    
                    // Refresh the service list after deletion
                    this.refreshStaffData();
                    this.shiftDeleteConfirmation=false;
                    return refreshApex(this.wiredServicesResult);
                   
                })
                .catch(error => {
                    console.error('Error deleting shift:', error);
                    this.confirMationMessage('Error', 'Error deleting shift.', 'error');
                    this.shiftDeleteConfirmation=false;
                    this.isShowSpinner=false;
                });
        }

       
    });
  }

  handleShowMoreModal(event) {
    console.log('Clicked More button');

    // Get the clicked <td> cell position
    const tdElement = event.currentTarget.closest('td');
    if (!tdElement) {
        console.error('Could not find parent TD element');
        return;
    }

    const tdRect = tdElement.getBoundingClientRect();
   // console.log('TD Element Position:', tdRect);

    // Get <td> width
    const tdWidth = tdRect.width;
    console.log('TD Width:', tdWidth);

    // Define modal height larger than <td>
    const modalHeight = 500; // Set to a larger height

    // Position the modal exactly at the left border of the <td>
    this.modalStyle = `top: ${tdRect.top + window.scrollY + 36}px; 
                       left: ${tdRect.left - tdWidth - 93}px; 
                       width: ${tdWidth}px; 
                       height: auto;`;

   // console.log('Modal Position & Style:', this.modalStyle);

    // Open the modal
    this.isModalOpen = true;
   // console.log('Modal Open:', this.isModalOpen);
    console.log('staff id'+event.currentTarget.dataset.staffid);
    console.log('staff id'+event.currentTarget.dataset.date);
    let shiftDate=event.currentTarget.dataset.date;
    console.log('Shift Date '+shiftDate);
    this.moreShiftlist=[];

    getMultipleShiftsdata({shiftDate:shiftDate,staffId:event.currentTarget.dataset.staffid}).then(result =>{
      console.log('result'+JSON.stringify(result));
       this.moreShiftlist=result;

    })
   
}

  // Close the modal
  handleCloseModal() {
    console.log('Closing Modal...');

    const modal = this.template.querySelector('.custom-modal');

    if (modal) {
        modal.classList.add('closing'); // Start CRT close animation

        setTimeout(() => {
            modal.classList.add('hidden'); // Hide modal visually but keep in DOM
            this.isModalOpen = false; // Remove modal from DOM after animation completes
            console.log('Modal Closed:', this.isModalOpen);
        }, 500); // Matches CSS animation duration
    }
}




    handleSearchName(event) {
      console.log('Search Name:', event.target.value);

      if (event.target.value) {
          this.searchName = event.target.value;
      } else {
          this.searchName = ''; // Reset if input is cleared
      }

      // Clear any existing timeout before setting a new one
     // clearTimeout(this.searchTimeout);
     setTimeout(() => {
      this.isShowSpinner = true;
      this.loadStaffData();
      }, 2000);
    
      // Set a new timeout to delay execution
    // Adjust delay time as needed (e.g., 500ms)
  }
  handleSectionToggle(event) {
    const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute
    console.log('Section ID:', sectionId);

    // Create a new array with updated values to trigger reactivity
    this.staffData = this.staffData.map((role) => {
      if (role.roleName === sectionId) {
          return {
              ...role,
              isExpanded: !role.isExpanded, // Toggle only the clicked section
              arrowcode: !role.isExpanded ? '\u2B9F' : '\u2B9C', // Up if expanded, down if collapsed
          };
      }
      return role; // Keep other sections unchanged
    });


  //  console.log('Updated Staff Data:', JSON.stringify(this.staffData));
 }

 get iconName() {
  if (this.isListening) {
       return 'utility:unmuted';
  } else {
       return 'utility:muted';
  }
}
   
// Alternative text for accessibility
get altText() {
   if (this.isListening) {
        return 'Unmute';
   } else {
       return 'Mute';
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
       console.error('Error in toggleListening:', error.message);
   }
}
// Show icons when text area gains focus
handleFocus() {
   console.log('handleFocus executing >>');
   try {
       this.showMuteIcon = true;
       this.isListening = false; // Ensure the state is not in listening mode
       if (this.recognition) {
          this.recognition.stop(); // Stop any ongoing recognition process
          this.recognition = null; // Clear recognition instance
       }
   } catch (error) {
       console.error('Error in handleFocus:', error.message);
   }
}
// Start speech recognition
startListening() {
   try {
       console.log('Listening started...');
       if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
           const SpeechRecognition =
               window.SpeechRecognition || window.webkitSpeechRecognition;
           const recognition = new SpeechRecognition();
           recognition.lang = 'en-US';
           recognition.continuous = true;
           recognition.interimResults = false;

           recognition.onresult = (event) => {
               this.addShiftData.AddShiftNotes += Array.from(event.results)
                   .map((result) => result[0].transcript)
                   .join('');
               this.showClearIcon = true; // Show clear icon after transcription
           };

           recognition.onerror = (event) => {
               console.error('Error during speech recognition:', event.error);
           };

           recognition.onend = () => {
               console.log('Recognition ended');
               this.isListening = false;
           };

           recognition.start();
           this.recognition = recognition;
       } else {
           console.error('SpeechRecognition API not supported by this browser.');
           alert('SpeechRecognition API is not supported in this browser.');
       }
   } catch (error) {
       console.error('Error in startListening:', error.message);
   }
}

// Stop speech recognition
stopListening() {
   try {
       console.log('Listening stopped...');
       if (this.recognition) {
           this.recognition.stop();
           this.recognition = null;
       }
   } catch (error) {
       console.error('Error in stopListening:', error.message);
   }
}

// Clear text and hide clear icon
clearText() {
   try {
    this.addShiftData.AddShiftNotes = '';
       this.showClearIcon = false;
       if (this.isListening) {
           //this.startListening();
           this.stopListening();
           this.addShiftData.AddShiftNotes = '';
          } 
   } catch (error) {
       console.error('Error in clearText:', error.message);
   }
   
}
handleGetlocation(){
  this.hideLocation=true;
  this.showLocation=false;
  getJSONdata( {shiftid: this.shiftStaffId, shiftstatus: this.addShiftData.AddShiftStatus, sdate: this.addShiftData.AddShiftStartDate} )
  .then(result => {
      this.jsonData = JSON.parse(result);
      //console.log("JSON Data : " + JSON.stringify(this.jsonData));  
      this.isShowMap = true;           
      this.setLatitudeLongitudeData();
  
  })
  .catch(error => {
    this.isShowMap=false;
      console.error('Error loading JSON:', error);
      this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error',
            message: 'No data found .',
            variant: 'Error'
          })
          );

  });
}

setLatitudeLongitudeData() {
  // Ensure the DOM is rendered before accessing it
  setTimeout(() => {
      const mapContainer = this.template.querySelector('.map-container');
      // Check if the mapContainer exists
      if (!mapContainer) {
          console.error('Map container not found');
          return; // Exit the function if the container is not found
      }
      // Initialize the Leaflet map if not already done
      if (!this.map) {
          this.map = L.map(mapContainer).setView([this.jsonData[0].coords.latitude, this.jsonData[0].coords.longitude], 20);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors'
          }).addTo(this.map);
      }
      // Add markers to the map
      this.jsonData.forEach(item => {
          const lat = item.coords.latitude;
          const lng = item.coords.longitude;
          L.marker([lat, lng]).addTo(this.map).bindPopup(`Location: ${lat}, ${lng}`);
          
      });
      // Draw the polyline between coordinates
      const polylineCoordinates = this.jsonData.map(item => [item.coords.latitude, item.coords.longitude]);

      // Check if a polyline already exists, and remove it
      if (this.polyline) {
          this.map.removeLayer(this.polyline);
      }

      this.polyline = L.polyline(polylineCoordinates, {
          color: 'blue',
          weight: 4,
          opacity: 0.6
      }).addTo(this.map);
  }, 1000); // Use setTimeout to ensure the DOM is rendered
}

  hideHandleLocation(){
    this.hideLocation=false;
    this.isShowMap=false;
    this.mapMarkers=[];
    this.showLocation=true;
  
  }
  closeWarningMessage() {
    this.ServiceWarningMessage=false;
    this.shiftDeleteConfirmation=false;
    this.recurredShiftsDelete=false;
   
}
handleDeleteRecurShifts(event){
  this.recurredShiftsDelete=event.target.checked;
  console.log('recurredShiftsDelete' + this.recurredShiftsDelete)
}
  handleShiftDeleteConfirmation(event){
  console.log('handleShiftDeleteConfirmation');
   console.log('recurstatus==>'+ event.currentTarget.dataset.recurstatus );
  console.log('refid==>'+ event.currentTarget.dataset.refid ); 
   this.recurredShiftsDelete=false;
  this.shiftDeleteCOnfirmationInfo={};
  this.shiftDeleteCOnfirmationInfo.status= event.currentTarget.dataset.status 
  this.shiftDeleteCOnfirmationInfo.shiftID =event.currentTarget.dataset.id;
  this.shiftDeleteCOnfirmationInfo.refId =  event.currentTarget.dataset.refid;
  this.shiftDeleteCOnfirmationInfo.recurStatus = event.currentTarget.dataset.recurstatus =='true' ?true:false;
  this.shiftDeleteCOnfirmationInfo.recurStartDate= event.currentTarget.dataset.weekdate;
   console.log('  this.shiftDeleteCOnfirmationInfo.recurStartDate ' +this.shiftDeleteCOnfirmationInfo.recurStartDate) 
    console.log('  this.shiftDeleteCOnfirmationInfo.refid ' +this.shiftDeleteCOnfirmationInfo.refId) 
 
  this.shiftDeleteConfirmation=true;

}
  @track isAutoSchedule = false;
get participantViewLabelClass() {
    return this.isParticipanTViewEnable 
        ? 'roster-label roster-active-font' 
        : 'roster-label roster-inactive-font';
}

get staffViewLabelClass() {
    return this.isParticipanTViewEnable 
        ? 'roster-label roster-inactive-font' 
        : 'roster-label roster-active-font';
}

  handletoggleParticipantView(event){
    const isChecked = event.target.checked;

    
    this.isPopoverVisibleforShiftType = false;
    this.isPopoverVisible != this.isPopoverVisible;
this.isPopoverVisible = false;
     if (isChecked) {
        // Toggle is ON → Staff View
        this.isParticipanTViewEnable = false;
        this.viewName = 'Staff View';
        this.isAutoSchedule = false;
        this.refreshStaffData();
        this.participantViewLabelClass = 'roster-label roster-inactive-font';
        this.staffViewLabelClass = 'roster-label roster-active-font';
    } else {
        // Toggle is OFF → Participant View
        this.isParticipanTViewEnable = true;
        this.viewName = 'Participant View';
        this.isAutoSchedule = true;
        this.facIdlist = [...this.facIdlist];
        this.participantViewLabelClass = 'roster-label roster-active-font';
        this.staffViewLabelClass = 'roster-label roster-inactive-font';
    }
    console.log('View Changed:', this.viewName, '| isParticipant:', this.isParticipanTViewEnable);

   
  }
get toggleLabel() {
    return this.isParticipanTViewEnable ? 'Participant View' : 'Staff View';
}


get isStaffViewToggleChecked() {
    return !this.isParticipanTViewEnable;
}
get datePickerStyle() {
    return this.isParticipanTViewEnable 
        ? 'width: 18%;'   // Example width for Participant View
        : 'width: 23%;';  // Example width for Staff View
}


  handleFinalAllocate(){
    this.fatigueManagementFlag=false;
  }
  handleDeselectStaff(){
    this.isCalenderShiftView=false;
    this.fatigueManagementFlag=false;
 }
 handleSetHoursClose(){
    this.setHoursExceedsLimit=false;
    this.isCalenderShiftView = false; 

 }
 handleRiskNavigationFromChild(event){
   //console.log('handleRiskNavigationFromChild');
  // console.log('evnt details '+JSON.stringify(event.detail));

   const editEvent = new CustomEvent('risknavigationfromroster', {
        detail: event.detail,
        bubbles: true,
        composed: true
    });

    this.dispatchEvent(editEvent);
 }

 addRateRow() {
  if (this.rateRows.length < 4) {
      const newRow = {
          id: Date.now(), // or generate unique id however you like
          startTime: '',
          endTime: '',
          hourlyRate: ''
      };
      this.rateRows = [...this.rateRows, newRow];
  }
}
/* deleteRateRow(event) {
  const index = parseInt(event.currentTarget.dataset.index, 10);
  console.log('index >>'+ index);
  this.rateRows = this.rateRows.filter((item, i) => i !== index);
  console.log('rateRows >>'+ JSON.stringify(this.rateRows));
  console.log('LongShiftTimeSlots >>'+ JSON.stringify(this.LongShiftTimeSlots));
} */

 
deleteRateRow(event) {

    this.isDisableSaveButton = false;

    const index = parseInt(event.currentTarget.dataset.index, 10);

    const removedRowId = this.rateRows[index].id;
 
    // Remove the row from rateRows

    this.rateRows = this.rateRows.filter((item, i) => i !== index);
 
    // Nullify fields in LongShiftTimeSlots

    for (const key in this.LongShiftTimeSlots) {

        if (this.LongShiftTimeSlots[key].id === removedRowId) {

            this.LongShiftTimeSlots[key].startTime = '';

            this.LongShiftTimeSlots[key].endTime = '';

            this.LongShiftTimeSlots[key].hourlyRate = '0';

            this.LongShiftTimeSlots[key].duration = 0;

            break;

        }

    }
 
    // Check if no rows remain

    if (this.rateRows.length === 0) {

        this.confirMationMessage('Error', 'At least one row is required.', 'error');

        this.isDisableSaveButton = true;

        return;

    }
 
    // Helper to convert hour, minute, am/pm to total minutes

    const toMinutes = (hr, min, ampm) => {

        hr = parseInt(hr, 10);

        min = parseInt(min, 10);

        if (ampm === 'PM' && hr !== 12) hr += 12;

        if (ampm === 'AM' && hr === 12) hr = 0;

        return hr * 60 + min;

    };
 
    let isValid = true;
 
    for (let i = 0; i < this.rateRows.length; i++) {

        const row = this.rateRows[i];
 
        const rowStart = toMinutes(row.startTimeselectedHour, row.startTimeselectedMinute, row.startTimeselectedAmPm);

        const rowEnd = toMinutes(row.endTimeselectedHour, row.endTimeselectedMinute, row.endTimeselectedAmPm);
 
        if (i === 0) {

            const shiftStart = toMinutes(this.startTimeSelectedHour, this.startTimeSelectedMinute, this.startTimeAMPM);

            if (rowStart !== shiftStart) {

                this.confirMationMessage('Error', 'First row Start Time must match Shift Start Time.', 'error');

                this.isDisableSaveButton = true;

                isValid = false;

                break;

            }

        }
 
        if (i > 0) {

            const prevRow = this.rateRows[i - 1];

            const prevEnd = toMinutes(prevRow.endTimeselectedHour, prevRow.endTimeselectedMinute, prevRow.endTimeselectedAmPm);

            if (prevEnd !== rowStart) {

                this.confirMationMessage('Error', `Row ${i + 1} Start Time must match Row ${i} End Time.`, 'error');

                this.isDisableSaveButton = true;

                isValid = false;

                break;

            }

        }
 
        if (i === this.rateRows.length - 1) {

            const shiftEnd = toMinutes(this.endTimeSelectedHour, this.endTimeSelectedMinute, this.endTimeAMPM);
            console.log('shiftEnd >>',shiftEnd);
            console.log('shiftEnd >>',rowEnd);

            if (rowEnd !== shiftEnd) {

                this.confirMationMessage('Error', 'Last row End Time must match Shift End Time.', 'error');

                this.isDisableSaveButton = true;

                isValid = false;

                break;

            }
 
            // Additional check: Shift End must NOT be LESS than last row's End Time

            if (shiftEnd < rowEnd) {

                this.confirMationMessage('Error', 'Shift End Time cannot be earlier than the last row\'s End Time.', 'error');

                this.isDisableSaveButton = true;

                isValid = false;

                break;

            }

        }

    }
 
    if (isValid) {

        this.isDisableSaveButton = false;

    }
 
    console.log('rateRows after delete:', JSON.stringify(this.rateRows));

}

 

 handleRateRowTimeChange(event) {
  const index = parseInt(event.target.dataset.index, 10);
  const field = event.target.dataset.field;
  const ampm=event.target.dataset.amapm
  const childData = event.detail;

  // Update the changed field
  this.rateRows = this.rateRows.map((row, i) => {
    if (i === index) {
      return { ...row, [field]: childData.twentyFourHourFormat ,[ampm] : childData.displaytime };
    }
    return row;
  });

  const startDateStr = this.addShiftData.AddShiftStartDate;
  const endDateStr = this.addShiftData.AddShiftEndDate;
  const shiftStartTimeStr = this.addShiftData.AddShiftStartTime?.split(':');
  const shiftEndTimeStr = this.addShiftData.AddShiftEndTime?.split(':');
 
 // console.log('this.rateRows '+ JSON.stringify(this.rateRows));
 

  if (!startDateStr || !endDateStr || !shiftStartTimeStr || !shiftEndTimeStr) return;

  const [shiftStartHour, shiftStartMin] = shiftStartTimeStr;
  const [shiftEndHour, shiftEndMin] = shiftEndTimeStr;

  const shiftStart = new Date(`${startDateStr}T${shiftStartHour}:${shiftStartMin}:00`);
   console.log('start date 1 ' +shiftStart);
  let shiftEnd = new Date(`${endDateStr}T${shiftEndHour}:${shiftEndMin}:00`);
  console.log('start date 2 ' +shiftEnd);

  let lastRowEnd = null;
  let hasError = false;

    for (let i = 0; i < this.rateRows.length; i++) {
    const { startTime, endTime, rowShiftType, startAmPm, endAmPm } = this.rateRows[i];

      if (!startTime || !endTime || !rowShiftType) continue;

      const [sHour, sMin] = startTime.split(':');
      const [eHour, eMin] = endTime.split(':');

      let rowStart, rowEnd;

      // First row starts with base shift start date
      if (i === 0) {
        rowStart = new Date(`${startDateStr}T${sHour}:${sMin}:00`);

        if (rowShiftType === 'Night' && startAmPm.includes('AM') && endAmPm.includes('AM')) {
          // AM → AM night shift = Next Day
          rowStart.setDate(rowStart.getDate() + 1);
          rowEnd = new Date(rowStart);
          rowEnd.setHours(parseInt(eHour), parseInt(eMin));
        } else if (rowShiftType === 'Night' && startAmPm.includes('PM') && endAmPm.includes('AM')) {
          rowEnd = new Date(`${startDateStr}T${eHour}:${eMin}:00`);
          rowEnd.setDate(rowEnd.getDate() + 1); // ends next day
        } else {
          rowEnd = new Date(`${startDateStr}T${eHour}:${eMin}:00`);
        }

      } else {
        // Use previous row's end date as base
        rowStart = new Date(this.rateRows[i - 1].enddate);

        if (rowShiftType === 'Night' && startAmPm.includes('AM') && endAmPm.includes('AM')) {
          // AM → AM night shift = Next Day
          rowStart.setDate(rowStart.getDate() + 1);
          rowEnd = new Date(rowStart);
          rowEnd.setHours(parseInt(eHour), parseInt(eMin));
        } else if (rowShiftType === 'Night' && startAmPm.includes('PM') && endAmPm.includes('AM')) {
          rowEnd = new Date(rowStart);
          rowEnd.setHours(parseInt(eHour), parseInt(eMin));
          rowEnd.setDate(rowEnd.getDate() + 1); // ends next day
        } else {
          rowEnd = new Date(rowStart);
          rowEnd.setHours(parseInt(eHour), parseInt(eMin));
        }
      }

      // Fallback validation: make sure end is after start
      if (rowEnd <= rowStart) {
        rowEnd.setDate(rowEnd.getDate() + 1);
      }

      const durationInMs = rowEnd - rowStart;
      const durationInHours = durationInMs / (1000 * 60 * 60);

      this.rateRows[i].startdate = rowStart.toISOString();
      this.rateRows[i].enddate = rowEnd.toISOString();
      this.rateRows[i].duration = parseFloat(durationInHours.toFixed(2));

      // ===== VALIDATION SECTION =====
      if (rowEnd <= rowStart) {
        this.confirMationMessage('Invalid Time', `Row ${i + 1}: End time must be after start time`, 'error');
        hasError = true;
      }

      if (i > 0) {
        if (lastRowEnd && rowStart < lastRowEnd) {
          this.confirMationMessage('Overlap Error', `Row ${i + 1} overlaps with previous row`, 'error');
          hasError = true;
        }

        if (rowStart < shiftStart || rowEnd > shiftEnd) {
          this.confirMationMessage('Outside Shift Time', `Row ${i + 1} is outside the shift timing`, 'error');
          hasError = true;
        }
      }

      lastRowEnd = rowEnd;
  }

   console.log('rateRows 1 ==> '+JSON.stringify( this.rateRows));

  // Additional checks: first row start == shift start, last row end == shift end
  if (!hasError && this.rateRows.length > 0) {
    const first = this.rateRows[0];
    const last = this.rateRows[this.rateRows.length - 1];

    const [fH, fM] = first.startTime?.split(':');
    const [lH, lM] = last.endTime?.split(':');

    const firstStart = new Date(`${startDateStr}T${fH}:${fM}:00`);
    let lastEnd = new Date(`${startDateStr}T${lH}:${lM}:00`);
    if (lastEnd <= firstStart) lastEnd.setDate(lastEnd.getDate() + 1);

    if (firstStart.getTime() !== shiftStart.getTime()) {
      this.confirMationMessage('Start Time Mismatch', 'First row must match shift start time', 'error');
      hasError = true;
    }    
      if (lastEnd.getTime() !== shiftEnd.getTime()) {
        this.confirMationMessage('End Time Mismatch', 'Last row must match shift end time', 'error');
        hasError = true;
      }
  }
    console.log(' this.rateRows '+JSON.stringify(this.rateRows));
    const shiftTypeMap = {};
    this.rateRows.forEach(row => {
      shiftTypeMap[row.rowShiftType] = row;
    });
    this.LongShiftTimeSlots=shiftTypeMap;
  this.isDisableSaveButton = hasError;
}

  
    

handleRateRowInputChange(event) {
  const index = parseInt(event.target.dataset.index, 10);
  const field = event.target.name;
  const value = event.target.value;
  console.log('field ' + field);
  console.log(' this.addShiftData.AddShiftHoliday' +this.addShiftData.AddShiftHoliday)
  console.log(' this.addShiftData.AddShiftDayName' +this.AddShiftDayName)
  console.log(' this.addShiftData.AddShiftStaffValue' +this.addShiftData.AddShiftStaffValue)
 
  this.rateRows = this.rateRows.map((row, i) => {
      if (i === index) {
          let updatedRow = { ...row, [field]: value };

          if (field === 'rowShiftType') {
              // Calculate hourly rate based on shift type
              const calculatedRate = this.getServiceStaffHourlyRate(
                  this.addShiftData.AddShiftHoliday,
                  this.AddShiftDayName,
                  this.addShiftData.AddShiftStaffValue,
                  value // This is the selected rowShiftType
              );
              console.log(' calculatedRate' +calculatedRate)
              // Add calculated rate to the row
              updatedRow.hourlyRate = calculatedRate.toString();
          }

          return updatedRow;
      }

      return row;
  });

  // Update LongShiftTimeSlots if needed
  const shiftTypeMap = {};
  this.rateRows.forEach(row => {
      shiftTypeMap[row.rowShiftType] = row;
  });
  this.LongShiftTimeSlots = shiftTypeMap;

  console.log('Mapped by rowShiftType:', JSON.stringify(this.LongShiftTimeSlots));
}

handleautoSchedule(){
  this.isParticipanTViewEnable=true;
  this.isAutoschedule='auto';

  const child = this.template.querySelector('c-tesseract-apps-participant-view');
        if (child) {
            child.updateFlags();
        }

    console.log('auto schedule');
}
handlePublishShifts(){
   this.isParticipanTViewEnable=true;
    this.isAutoschedule='publish';
  const child = this.template.querySelector('c-tesseract-apps-participant-view');
  if (child) {
      child.openPublishFlag();
  }

   console.log('auto schedule');
}
handlerosterInvoices(){
  this.childRosterInvoices=true;
  this.isStaffView=false;
  this.isCalenderShiftView=false;
}
  handleRefreshParent() {
 
    this.facilityValue = [...this.facilityValue];
     this.serviceInvoiceFlag=true;
    console.log('Parent refresh  called ');
    if(this.serviceInvoiceFlag==true){
      this.refreshStaffData();
    }
  
   
  } 

  @track facilitySearchTerm = '';
@track showFacilityOptions = false;

// Filtered options
get filteredFacilityOptions() {
    if (!this.facilitySearchTerm) return this.facilityOptions;
    const searchLower = this.facilitySearchTerm.toLowerCase();
    return this.facilityOptions.filter(option =>
        option.label.toLowerCase().includes(searchLower)
    );
}

// Show/hide dropdown
showFacilityDropdown() {
    this.showFacilityOptions = true;
}
handleFacilityBlur() {
    setTimeout(() => this.showFacilityOptions = false, 200);
}
handleFacilitySearchChange(event) {
    this.facilitySearchTerm = event.target.value;
     console.log('facilitySearchTerm '+this.facilitySearchTerm);
}
handleFacilitySelect(event) {
    const selectedId = event.currentTarget.dataset.id;
     console.log('this.facilityOptions '+JSON.stringify(this.facilityOptions) );
    const selectedLabel = this.facilityOptions.find(f => f.value === selectedId)?.label || '';
    
     console.log('selectedLabel '+selectedLabel);
    this.SelectedComboBoxFacility = selectedId;
    this.facilityValue = [selectedId];
    console.log('this.facilityValue '+this.facilityValue);
     console.log('this.facilitySearchTerm  '+this.facilityValue);
    this.facilitySearchTerm = selectedLabel;
    this.showFacilityOptions = false;
    console.log('SelectedComboBoxFacility '+this.SelectedComboBoxFacility);

    localStorage.setItem('SelectedComboBoxFacility', JSON.stringify(selectedId));
    this.loadStaffData();
}

clearFacilitySearch() {
    this.facilitySearchTerm = '';
    this.SelectedComboBoxFacility = '';
    this.facilityValue = [];
    this.showFacilityOptions = false;

    localStorage.removeItem('SelectedComboBoxFacility');
    this.loadStaffData(); // Optional: reload without filtering
}

get isNoStaffDataFound() {
    return (
        this.searchName?.trim() &&
        Array.isArray(this.staffData) &&
        this.staffData.length > 0 &&
        this.staffData.every(role => Array.isArray(role.staffData) && role.staffData.length === 0)
    );
}





}