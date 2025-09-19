import { LightningElement, track, wire, api } from 'lwc';
import getParticipantData from '@salesforce/apex/AddShiftParticipantView.getParticipantData';
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
import generateAndSendNotification from '@salesforce/apex/MobileAppNotificationsV2.generateAndSendNotification';
import getJSONdata from '@salesforce/apex/GeoTaggingfromAWS.getS3JsonData';
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import LEAFLET from '@salesforce/resourceUrl/leaflet';
import getServicesByDate from '@salesforce/apex/ServiceSupportPlanHandler.getServicesByDate';
import getStaffByStatus from '@salesforce/apex/StaffController.getStaffByStatus';
import getOverlappingShiftsData from '@salesforce/apex/AddShiftParticipantView.getOverlappingShiftsData';
import getFatigueData from '@salesforce/apex/RosterCreation.getFatigueData';
import HolidaysPopup from '@salesforce/apex/RosterCreationRecurringHnadler.HolidaysPopup';
import assignShifts from '@salesforce/apex/RosterAutoScheduleHandler.assignShifts';
import currnetLoggedInFcaility from '@salesforce/apex/RosterAutoScheduleHandler.currnetLoggedInFcaility';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserEmail from '@salesforce/schema/User.Email';
import publishShifts from '@salesforce/apex/RosterAutoScheduleHandler.publishShifts';
import getCatalogueData from '@salesforce/apex/StaffAvailabilityController.getCatalogueData';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import getFundsData from  '@salesforce/apex/RosterCreation.getFundsData';
import deleteCheckList from '@salesforce/apex/ShiftwithStaffController.deleteCheckList';

export default class TesseractAppsParticipantView extends LightningElement {
    @track participantData = {}; // Store participant data
    @track error; // Store errors
    @track searchName = ''; // Search input
    
    @api startDate = null;
    @api endDate = null;
    @api facIdlist = [];
    @api chosenRole=[];
    @api choosenShiftType=[];
    @api choosenStatus=[];
    @api orgId = '';
    @api weekDataJson = '';
    @track openParticipantshiftView=false;
    @track currentStartDate;
    @track currentEndDate;
    @track weekDaysWithDates = [];
    @track currentStartOfWeek; // Tracks the start of the current week
    @track monthName ;
    @track OrgNisationRoles=[];
    @track facilityOptions = [];
    @track facilityValue=[];
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
  
    @track SelctedComboBoxRole;
    @track SelectedComboBoxFacility;
    @track isTooltip=false;  
    @track shiftTooltipInformation={} 
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
    @track shiftTypeOptions=[{label: 'General', value:'General'},{label:'Morning', value:'Morning'},{label: 'Afternoon', value: 'Afternoon'},{label: 'Night', value: 'Night'},{label: 'Custom', value: 'Custom'},{label: 'Sleepover Shift', value: 'Sleepover Shift'}];
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
    @track participantIdInEdit
    get stateOptions(){
      return [
        { label: 'ACT', value: 'ACT__c' },
        { label: 'NSW', value: 'NSW__c' },
        { label: 'NT', value: 'NT__c' },
        { label: 'QLD', value: 'QLD__c' },
        { label: 'SA', value: 'SA__c' },
        { label: 'TAS', value: 'TAS__c' },
        { label: 'VIC', value: 'VIC__c' },
        { label: 'WA', value: 'WA__c' },
    ];
    }
    @track serviceGroupName=[];
    @track ServiceStaffValue;
    @track AddShiftServicesData=[];
    @track serviceParticipant;
    @track serviceTableAddButton=false;
    @track serviceStaffHourlyRate=0;
    @track isDisableParticipantCheckBox=true;
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
    @track isCreateShiftButton=true;
    @track parentAddShiftId='';
    @track isVisibleCreateServicesButton=true;
    @track isVisiblePlusIcon=true;
    @track isParticipanTViewEnable=false;
   
    get weekDaysWithDatesJSON() {
      return JSON.stringify(this.weekDaysWithDates);
  }
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
    colors = ['#008000', '#FFD700', '#FF0000', '#0000FF']; // Green, Yellow, Red, Blue

    @track staffComboBoxRoles=[];
    wiredRolesStaffData;
    @track RolesStaffId;
    @track roleOptions=[];
    @track ServiceWarningMessage=false;
    @track participantServiceDeleteInfo={};
    @track shiftDeleteCOnfirmationInfo={};
    @track shiftDeleteConfirmation=false;
    @track headingLabel='Create Shift';
    @track riskIndex;
    @track fatigueManagementFlag=false;
    @track cutsomShiftTemplate=false;
    @track IsLongShift=false;
    @track LongShiftTimeSlots={};
    @track rateRows = [];
    @track rows = [
      { id: '1', label: 'Classification', isIcon: true, direction: 'arrowup', iconName: 'utility:arrowup', directionLabel: 'Low to High' },
      { id: '2', label: 'Risk Index', isIcon: true, direction: 'arrowup', iconName: 'utility:arrowup', directionLabel: 'Low to High' },
      { id: '3', label: 'Employment Type', isRadio: true, value: 'Permanent' },
      { id: '4', label: 'Preferred Staff', isCheckbox: true, value: false },
      { id: '5', label: 'Fatigue Management', isCheckbox: true, value: false },
      { id: '6', label: 'Geo Location', isSlider: true, value: 50 }
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
  @track publishTempalte=false;
  @track HolidaySaveButton=true;
  @track isOriginalStaffChanged=false;
  @track ShiftwithStafftoApexId = null;
  @track recurEndDateFormattedDate
   @track deletedChecklist=[];
   @track finalSelectedFacilities=[];
  @track isSingleClassForServiceCreation=true;
    @api
    updateFlags() {
      //  this.participantData = false;
        this.autoschdulePopup = true; // Only this flag becomes true
        console.log('Child flags updated:', this.firstFlag, this.secondFlag);
    }
    @api
    openPublishFlag(){
        this.publishTempalte=true;
     }
     @api isautoschedulepopup;
    // Called when the component is initialized
    renderedCallback() {
        // Check if leaflet resources are already loaded
        console.log('RENDERED IN Participant View')
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

    @wire(getRecord, { recordId: Id, fields: [UserEmail]}) 
         userDetails({error, data}) {
             if (data) {
                 this.currentUserEmail=data.fields.Email.value;
                 if(this.currentUserEmail){
                    currnetLoggedInFcaility({UserEmail: this.currentUserEmail}).then(result =>{
                      console.log('result ' +JSON.stringify(result));

                      const orderMap = {};
                      const valueMap = {};

                      const pairs = [
                          { label: 'Classification',     api: 'Classification' },
                          { label: 'Risk Index',         api: 'Risk_Index' },
                          { label: 'Employment Type',    api: 'Employment_Type' },
                          { label: 'Preferred Staff',    api: 'Preferred_Staff' },
                          { label: 'Fatigue Management', api: 'Fatigue_Management' },
                           { label: 'Geo Location',       api: 'Radius' }
                      ];

                      pairs.forEach(p => {
                          if (result[`${p.api}_Order__c`] !== undefined) {
                              orderMap[p.label] = result[`${p.api}_Order__c`];
                          }
                          if (result[`${p.api}_Value__c`] !== undefined) {
                              valueMap[p.label] = result[`${p.api}_Value__c`];
                          }
                      });

              
                      const patchedRows = this.rows.map(r => {
                          const incoming = valueMap[r.label];
                          if (incoming === undefined) {
                              return r;                               // nothing new → keep as-is
                          }

                          if (r.isIcon) {                             // arrow-icon rows
                              const highToLow = incoming === 'High to Low';
                              return {
                                  ...r,
                                  directionLabel : incoming,
                                  direction      : highToLow ? 'arrowdown' : 'arrowup',
                                  iconName       : highToLow ? 'utility:arrowdown' : 'utility:arrowup'
                              };
                          }

                          // checkbox / radio rows
                          return { ...r, value: incoming };
                      });

              
                      patchedRows.sort((a, b) => {
                          const oa = orderMap[a.label];
                          const ob = orderMap[b.label];

                          if (oa !== undefined && ob !== undefined) return oa - ob; // both ordered
                          if (oa !== undefined) return -1;                          // only a ordered
                          if (ob !== undefined) return 1;                           // only b ordered
                          return 0;                                                 // neither ordered
                      });

                      this.rows = patchedRows;
                                  })
                                }
    
             } else if (error) {
                 this.usererror = error ;
             }
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
                        console.log('STAFF ROLES: ', JSON.stringify(this.roleOptions));
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
      event.target.style.textAlign = 'justify';
  }

  handleMouseOut(event) {
      event.target.style.whiteSpace = 'nowrap';
      event.target.style.overflow = 'hidden';
  }
  connectedCallback() {
    this.handleRefresh();
    window.addEventListener('scroll', this.handleScrollOrClick);
    window.addEventListener('click', this.handleOutsideClick);
     

    getFacilityData().then(response => {
        this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }));
        this.organisationShiftTimes=response[0].Organisation__r;
        console.log('organisationShiftTimes' +JSON.stringify(this.organisationShiftTimes));
      }).catch(err => {
        console.error(err);
     });

    organizationDetails().then(response => {
        this.orgId = response.listofPriceBook.Id;

        if (this.orgId != null && this.chosenRole.length > 0) {

            console.log('Selected shift in participant view:', JSON.stringify(this.choosenShiftType));
            console.log('Selected status in participant view:', JSON.stringify(this.choosenStatus));
           // this.facilityValue
           this.loadStaffComboBox();
        }
    });

    this.recurEveryOptions = this.generateOptions(30);
    this.monthLyOptions = this.generateOptions(31);
    console.log('isautoschedulepopup '+this.isautoschedulepopup);
    if(this.isautoschedulepopup =='auto'){
      this.updateFlags();
    }
    if(this.isautoschedulepopup =='publish'){
      this.openPublishFlag();
    }
   // this.loadParticipantData();
   // console.log('Role options:', JSON.stringify(this.OrgNisationRoles));
   }


   generateOptions(max) {
    const options = [];
    for (let i = 1; i <= max; i++) { // Starting from 1 for more realistic options
      options.push({ label: `${i}`, value: `${i}` });
    }
    return options;
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
        console.log('staff hOURLY RATES '+JSON.stringify(this.StaffHourlyRates));
    }
  
      staffSlistOnSelection(){
          this.staffComboBoxOptions=[];
          let StaffRole=[];
          console.log('stafff Roles '+this.addShiftData.AddShiftRole);
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
    // Wire method to call Apex
     @wire(getParticipantData, {
        startDate: '$startDate',
        endDate: '$endDate',
        facIdlist: '$facIdlist',
        orgID: '$orgId',
        weekDataJson: '$weekDataJson',
        name: '$searchName',
        shiftTypeList:'$choosenShiftType',
        statusList:'$choosenStatus'
    })
    wiredGetParticipantData(result) {   
        this.wiredparticipantdata = result;
        this.isShowSpinner=true;
        console.log('Apex Called:', JSON.stringify(result));
        if (result.data) {
         //  this.participantData={}
            this.participantData = result.data;
            this.isShowSpinner=false;
            this.error = undefined;
        } else if (result.error) {
            console.error('Apex Error:', JSON.stringify(result.error));
            this.isShowSpinner=false;
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
          console.log('Apex Response:', result);
          this.participantData = result;
          this.error = undefined;
          this.isShowSpinner = false;
      })
      .catch((error) => {
          console.error('Apex Error:', error);
          this.error = error;
          this.participantData = {};
          this.isShowSpinner = false;
      });
  }

    // Refresh the data manually
    handleRefresh() {
        console.log('Refreshing Data...');
        setTimeout(()=>{
          refreshApex(this.wiredparticipantdata)
          .then(() => console.log('Data Refreshed Successfully'))
          .catch(error => console.error('Refresh Failed:', error));
        },1500)
 
      
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
          AddShiftParticipantAddressCheckbox:false
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
      this.isDisableParticipantCheckBox=true;
      this.EmptyAddressFields();
      this.LongShiftTimeSlots={};
      this.rateRows=[];
      this.IsLongShift=false;
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
 
    handleOpenParticipantShiftView(event){
       console.log('selected   facilities in  from participant view' +JSON.stringify( this.facIdlist));
          this.finalSelectedFacilities = this.facilityOptions.filter(rec =>
          this.facIdlist.includes(rec.value)
          );
           console.log('final  facilities in participant view' +JSON.stringify( this.finalSelectedFacilities));
          if(this.finalSelectedFacilities.length===0){
          this.confirMationMessage('Error','Please select at least one facility to create the shift.','Error');
          return ;
        }
     this.openParticipantshiftView=true;
     this.emptyFields();
     let holiday= event.currentTarget.dataset.isholiday;
         let shiftdate=event.currentTarget.dataset.weekdate;
         let role=this.chosenRole[0];
         let participantid=event.currentTarget.dataset.participantid;
         console.log('participant id '+participantid);
        console.log('date '+shiftdate+' role '+role+' holiday '+holiday)
         this.addShiftData.AddShiftRole=role;
         this.addShiftData.AddShiftStartDate=shiftdate;
         this.addShiftData.AddShiftFacilityValue=this.finalSelectedFacilities[0].value;
         this.addShiftData.AddShiftHoliday=holiday =="true"?true:false ;
         this.AddShiftDayName=event.currentTarget.dataset.weekname;
         console.log(' AddShiftDayName ===>'+ this.AddShiftDayName);
         this.addShiftData.AddShiftnotification=true;
         this.addShiftData.AddShiftType='';
         this.isEditShiftScreenFlag=false;
         this.isIncludeParticipants=false;
      //   this.AddShiftIncludePartcipants=true;
         this.isCreateShiftButton=true;
         this.SplitShiftRows=[];
         this.isNewInsertOperation=true;
         this.startTimeSelectedHour = 12;
         this.startTimeSelectedMinute = '00';
         this.startTimeAMPM = false; 
         this.endTimeSelectedHour = 12;
         this.endTimeSelectedMinute = '00';
         this.endTimeAMPM = false; // Store "AM" or "PM"
         this.riskindex='';
         this.checkListDescription = '';
         this.isDisableParticipantCheckBox=true;
         this.participantAddressCheckBox=false;
         this.createShiftlabel='Create Shift';
         this.handleAddSplitShiftRow();
         this.handleLinkParticipants();
         this.SplitShiftRows[0].participant=participantid;
         this.serviceParticipant=participantid
         this.facilityAddressCheckbox=true;
         this.SplitShiftVisible=false;
         this.AddShiftRecurringCheckboxValue=false;
          this.ShiftwithStafftoApexId=null;
         this.isSingleClassForServiceCreation=true;
        this.getFacilityAddress();
           this.isSplitCheckbox=false;
          this.recurTemplate=false;
         
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
        this.recurEndDateFormattedDate='';
       this.isRecurWeekFlag=false;
       this.isRecurmontlyFlag=false;
       this.isDisableSaveButton=false;
       this.addNewAddressCheckBox=false;
       this.participantAddressCheckBox=false;
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
      this.serviceGroupName=[], this.servicePlan='';
      this.NdisServiceGroupName=false;
      this.isDisbaleServiceButton = true;
  }
   handleLinkParticipants(){
      fetchFacilitiess({cname:'',isTrue:false}).then(response=>{
       // console.log('participant response '+JSON.stringify(response));
        
        this.ParticipantOptions=response.filter(rec => (rec.Status__c === true && rec.Facility__r.Status__c===true )  ) // Check for 'Active' status
                                  .map(rec=>{
                                  //  let riskLevels = rec.Risk_Managements__r?.map(risk => risk.Risk_Index__c) || [];
                                              return {
                                                value:rec.Id,label:rec.Name__c,
                                                riskStatus: (rec.Risk_Status__c !=null && rec.Risk_Status__c !=undefined && rec.Risk_Status__c !=''  ) ? rec.Risk_Status__c  :'Risk Free'// Include risk level
                                              }
                                      })
          console.log('participantOptions '+JSON.stringify(this.ParticipantOptions));

          this.serviceGroupName=[];
          this.NdisServiceGroupName=false;
          this.stateValue=''
          this.isDisbaleServiceButton=true;
          this.ServiceTypeIdInParticipant='';
           this.riskIndex=this.ParticipantOptions.find(opt => opt.value === this.serviceParticipant).riskStatus;
        }).catch(error=>{
  
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
    handleCloseCalenderParticipantView(){
        this.openParticipantshiftView=false;
    }
    handleAddShiftChange(event){
      this.addShiftData[event.target.name]=event.target.value;
     // console.log('add shift name'+this.AddShiftDayName)
      if(this.facilityAddressCheckbox==true  && event.target.name =='AddShiftFacilityValue'){
        this.getFacilityAddress();
      }
      if(event.target.name =='AddShiftType' &&  this.addShiftData.AddShiftType){
        this.getOrganisationTimings();
       // this.getHourlyStaffRates();
       const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.addShiftData.AddShiftStaffValue,this.addShiftData.AddShiftType);
       this.addShiftData.AddShiftStaffHourlyRate= rate;  
        this.serviceStaffHourlyRate=rate;   
      
      }
      if(event.target.name =='AddShiftNotes'){
        this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
      }
      if(event.target.name =='AddShiftStaffValue'){

       this.RolesStaffId=this.addShiftData.AddShiftStaffValue;
       this.ServiceStaffValue=this.addShiftData.AddShiftStaffValue;
       this.fetchStaffRoles();
       this.getFundOptions();
        //  this.getHourlyStaffRates();
       const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.addShiftData.AddShiftStaffValue,this.addShiftData.AddShiftType);
       this.addShiftData.AddShiftStaffHourlyRate= rate;  
       this.serviceStaffHourlyRate=rate;   
      this.getOverLappingdata();
       if(this.isEditShiftScreenFlag==true){
        this.isOriginalStaffChanged=true;
       }
         
      }

      if (this.IsLongShift) {
          this.rateRows = this.rateRows.map(row => ({
              ...row,
              rateLabel: 'Rate'
          }));
      }
       
       console.log('addShiftData '+JSON.stringify(this.addShiftData))
    }
      

   
    getOrganisationTimings(){
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
          //  this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Night':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Night_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Night_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_End_Time__c.toLowerCase());
         //   this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'General':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.General_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.General_Shift_End_time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_End_time__c.toLowerCase());
           // this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Custom':
          this.IsLongShift=true;
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Custom_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Custom_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_End_Time__c.toLowerCase());
          //  this.disableTimeButton=false;
            this.SplitShiftVisible=false;
             this.rateRows=[];
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
           // this.disableTimeButton=false;
            break;
    }
    
    
  
    // Calculate the shift duration after assigning values
    this.addShiftData.AddShiftDuration = this.getDuration(this.addShiftData.AddShiftStartDate, this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime, this.addShiftData.AddShiftEndTimeAMPM, this.addShiftData.AddShiftType).duration;
    this.addShiftData.AddShiftBreak= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).breakTime;
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
    console.log('addShiftData', JSON.stringify(this.addShiftData));
    this.getOverLappingdata();
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
      console.log('over lapping data '+JSON.stringify(result));
       if(result.isError==true){
        this.confirMationMessage('Error',result.reason,'Error');
        this.isDisableSaveButton=true;
      }else{
        this.isDisableSaveButton=false;
      } 
     })
  }

  getServiceStaffHourlyRate(isHoliday, dayName, staffId, shiftType) {
    const staffRate = this.StaffHourlyRates[staffId]?.staffHoulryRate;

    if (!staffRate) {
        return 0; // fallback if no staff data
    }

    // Sleepover Shift with special cases
    if (shiftType === 'Sleepover Shift') {
        this.hourlrRateLabel = 'Allowance';
        this.hourlyrateDisable = false;
        rate = 0;
        console.log(`this.hourlrRateLabel (Sleepover)>>`, this.hourlrRateLabel);
        return rate;
    }

    if (isHoliday) {
        this.hourlrRateLabel = 'Hourly Rate';
        this.hourlyrateDisable = true;
        return staffRate.Public_holiday_Hourly_Rate__c || 0;
    }

    switch (dayName) {
        case 'Day 6': // Sunday
            this.hourlrRateLabel = 'Hourly Rate';
            this.hourlyrateDisable = true;
            return staffRate.Sunday_Hourly_Rate__c || 0;

        case 'Day 5': // Saturday
            this.hourlrRateLabel = 'Hourly Rate';
            this.hourlyrateDisable = true;
            return staffRate.Saturday_Hourly_Rate__c || 0;

        default:
            switch (shiftType) {
                case 'General':
                case 'Morning':
                    this.hourlrRateLabel = 'Hourly Rate';
                    this.hourlyrateDisable = true;
                    return staffRate.Working_Hours_Rate__c || 0;
                case 'Night':
                    this.hourlrRateLabel = 'Hourly Rate';
                    this.hourlyrateDisable = true;
                    return staffRate.Night_shift_Hourly_Rate__c || 0;
                    
                case 'Afternoon':
                    this.hourlrRateLabel = 'Hourly Rate';
                    this.hourlyrateDisable = true;
                    return staffRate.Afternoon_shift_Hourly_Rate__c || 0;

                case 'Sleepover Shift':
                    this.hourlrRateLabel = 'Allowance';
                    this.hourlyrateDisable = false;
                    return 0;
                  
                case 'Custom':
                  this.hourlrRateLabel = 'Hourly Rate';
                  this.hourlyrateDisable = true;
                  return 0;

                default:
                    this.hourlrRateLabel = 'Hourly Rate';
                    this.hourlyrateDisable = true;
                    return staffRate.Working_Hours_Rate__c || 0;
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
       this.isSingleClassForServiceCreation=false;
      switch (event.target.name) {
          case 'recurEvery':
              this.recurEveryValue = event.target.value;
              break;
          case 'recurEndDate':
              this.recurEndDate = event.target.value;
               let recurDateParts=this.recurEndDate.split('-');
              this.recurEndDateFormattedDate=recurDateParts[2] +'/'+recurDateParts[1] +'/'+recurDateParts[0] ;
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
                   this.recurEndDateFormattedDate=''
                  this.isRecurWeekFlag=false;
                  // **Skip validation when unchecked**
                  this.isDisableSaveButton = false;
                /// this.AddShiftIncludePartcipants=false;
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

        HolidaysPopup({ 
            recurrenceDates: recurrenceDates 
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

            this.holidaysList = holidays
                .filter(h => h && h.Id)
                .map(h => ({
                    Id: h.Id,
                    Name: h.Holiday_Name__c,
                    Date__c: h.Date__c,
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

  @track selectedHolidayDates = [];
  @track removeHolidayDate = [];
 

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


  handleRecurChange(event) {
    const maxValues = {
        Day: 15,
        Week: 12,
        Month: 3
    };
    
    this.RecurValue=event.target.value;
    this.monthOfDay=0;
    this.recurEndDate='';
    this.recurEndDateFormattedDate=''
   
   
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
      this.recurEndDateFormattedDate=''
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

  }
  handleAddShiftTimeData (event){
    const childData = event.detail;
   // console.log('childData '+JSON.stringify(childData))
    //console.log('date types1 '+event.currentTarget.dataset.timetype);
   // console.log('date types2 '+event.currentTarget.dataset.ampm)
    this.addShiftData[event.currentTarget.dataset.timetype]=childData.twentyFourHourFormat;
    this.addShiftData[event.currentTarget.dataset.ampm]=childData.displaytime;
    this.addShiftData.AddShiftDuration= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).duration;
    this.addShiftData.AddShiftBreak= this.getDuration(this.addShiftData.AddShiftStartDate,this.addShiftData.AddShiftStartTime,this.addShiftData.AddShiftEndTime,this.addShiftData.AddShiftEndTimeAMPM,this.addShiftData.AddShiftType).breakTime;

   // console.log('Add shift data:', JSON.stringify(this.addShiftData));
   this.getOverLappingdata();
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
    confirMationMessage(title,message,variant){
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
      console.log('check list row '+JSON.stringify(this.ChekListrows));
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
    // AdreesCheckboxChange(event){
    //   console.log('event name '+event.target.name)
    //   let selectedValue=event.target.checked
    //   if(event.target.name=='facilityAddressCheckbox'){ 
    //     this.addNewAddressCheckBox=false;
    //     this.participantAddressCheckBox=false; 
    //     if(!this.addShiftData.AddShiftFacilityValue){
    //       this.confirMationMessage('Error','Please Select facility','Error');
    //       this.isDisableSaveButton=true;
    //       this.facilityAddressCheckbox=false;
    //       this.addShiftData.AddShiftParticipantAddressCheckbox=false; 
    //     }else{
    //       this.getFacilityAddress();
          
    //       this.facilityAddressCheckbox=selectedValue;
          
    //       this.addShiftData.AddShiftEnterOtherLocation=this.addNewAddressCheckBox;
    //       this.isDisableSaveButton=false;
    //       this.addShiftData.AddShiftParticipantAddressCheckbox=false; 
    //     }
       
       
    //   } else if(event.target.name=='participantAddressCheckBox'){
    //     this.facilityAddressCheckbox=false;
    //     this.addNewAddressCheckBox=false;
    //     console.log('service participnat '+this.serviceParticipant);
    //     this.getPartcipantAddress();
    //     this.participantAddressCheckBox=selectedValue;   
    //     this.addShiftData.AddShiftEnterOtherLocation=true; 
    //     this.addShiftData.AddShiftParticipantAddressCheckbox=true; 
    //   }else{
    //     this.addNewAddressCheckBox=selectedValue;
    //     this.EmptyAddressFields();
    //     this.facilityAddressCheckbox=false;
    //     this.participantAddressCheckBox=false;
    //     this.addShiftData.AddShiftEnterOtherLocation=this.addNewAddressCheckBox; 
    //     this.isDisableSaveButton=false;
    //     this.addShiftData.AddShiftParticipantAddressCheckbox=false; 
    //   }
  
    // }

get addressComponentStyle() {
  return this.addNewAddressCheckBox ? '' : 'display: none;';
}
      AdreesCheckboxChange(event) {
    const selectedValue = event.target.checked;
    const checkboxName = event.target.name;

    // Reset all checkboxes and address field initially
    this.facilityAddressCheckbox = false;
    this.participantAddressCheckBox = false;
    this.addNewAddressCheckBox = false;

    if (checkboxName === 'facilityAddressCheckbox') {
      this.addNewAddressCheckBox=false;
        this.participantAddressCheckBox=false;
      if (!this.addShiftData.AddShiftFacilityValue) {
        this.confirMationMessage('Error', 'Please Select facility', 'Error');
        this.isDisableSaveButton = true;
        this.facilityAddressCheckbox=false;
        this.addShiftData.AddShiftParticipantAddressCheckbox=false; 
      } else {
        this.facilityAddressCheckbox = selectedValue;
        this.addShiftData.AddShiftParticipantAddressCheckbox = false;
        this.addShiftData.AddShiftEnterOtherLocation = false;
        this.isDisableSaveButton = false;
        this.getFacilityAddress();
      }

    } else if (checkboxName === 'participantAddressCheckBox') {
      console.log('service participnat ' + this.serviceParticipant);
      this.facilityAddressCheckbox=false;
      this.addNewAddressCheckBox=false;
      this.participantAddressCheckBox = selectedValue;
      this.addShiftData.AddShiftEnterOtherLocation = true;
      this.addShiftData.AddShiftParticipantAddressCheckbox = true;
     this.isDisableSaveButton = false;
      this.getPartcipantAddress();

    } else {
      // addNewAddressCheckBox selected
      this.addNewAddressCheckBox = selectedValue;
      this.addShiftData.AddShiftEnterOtherLocation = selectedValue;
      this.addShiftData.AddShiftParticipantAddressCheckbox = false;
      this.facilityAddressCheckbox=false;
      this.participantAddressCheckBox=false;
      this.EmptyAddressFields();
      this.isDisableSaveButton = false;
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
         this.fetchGeocode();
      }).catch(error=>{
        this.EmptyAddressFields();
        console.log(' error =>'+JSON.stringify(error));
        this.participantAddressCheckBox=false;
        this.confirMationMessage('Error','Please Select Participant','Error');
        this.isDisableSaveButton=true;
      })
    }
    
        getFundOptions(){
          if(this.ServiceStaffValue && this.serviceParticipant){
            getClientFunds({clientId :this.serviceParticipant}).then(response=>{
              //  console.log('funds '+JSON.stringify(response));
                if(response){
                  this.TotalFunds=response;
                  this.fundOption=response.map(rec=>{
                    return { "label": rec.Registration_Group__c,"value": rec.Id};
                  });
                  console.log('funds option'+JSON.stringify(this.fundOption));
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
      handleServiceStaffchange(event){
        console.log('Split shift'+JSON.stringify(this.SplitShiftRows ));
          this.ServiceStaffValue=event.target.value;
          console.log(' this.addShiftData.AddShiftHoliday '+this.addShiftData.AddShiftHoliday);
          console.log('this.AddShiftDayName '+this.AddShiftDayName);
          console.log(' this.ServiceStaffValue'+this.ServiceStaffValue);

          console.log(' this.addShiftData.AddShiftType '+this.addShiftData.AddShiftType);

        if(this.ServiceStaffValue){
          const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.ServiceStaffValue,this.addShiftData.AddShiftType);
          this.serviceStaffHourlyRate=rate;
          console.log('rate '+rate);
        }
        getOverlappingShiftsData({strtTimeText:this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),endTimeText:this.addShiftData.AddShiftEndTimeAMPM.toLowerCase(),StaffID:this.ServiceStaffValue,startdate:this.addShiftData.AddShiftStartDate,shiftType:this.addShiftData.AddShiftType,ShiftwithStaffId:this.ShiftwithStafftoApexId}).then(result=>{
          console.log('over lapping data '+result);
          if(result==true){
            this.confirMationMessage('Error','The selected staff already has a shift within the start and end times. Please switch to the staff view and assign the services to the particular participant.','Error');
            this.isDisableSaveButton=true;
          }else{
            this.isDisableSaveButton=false;
          }
        })
      
       
       // console.log('addshiftdata in edit  '+JSON.stringify(this.addShiftData))
        
       
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
            row.serviceTypeId =this.ServiceTypeIdInParticipant;   
        return row;
      });
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
      console.log('Selected split shift Id '+this.SplitShiftRowId);
      this.SplitShiftRows = this.SplitShiftRows.map(row => {
            row.selectedNdisIdValue = selectedRow.Id;
            row.serviceNameValue = selectedRow.Name;
            let state=this.stateValue.split('_')
            row.state=state[0];
            row.StaffId = this.ServiceStaffValue;
            row.serviceStffaHourlyRate=this.serviceStaffHourlyRate;
            row.serviceDate=this.addShiftData.AddShiftStartDate;
            row.participant=this.serviceParticipant;
            row.serviceAmount=selectedRow.amount;
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
        this.isSplitCheckbox=true;
      }else{
        this.serviceTableAddButton=false;
        this.isDisbaleServiceButton=false;
      }
       this.isDisableParticipantCheckBox=false;
         this.AddShiftIncludePartcipants=true;
       this.isSingleClassForServiceCreation=true;
     // 
      console.log('Selected Row ID:', selectedId);
      console.log('Split shift after selection'+JSON.stringify(this.SplitShiftRows ));
    }
   
   
    
     handleEditShiftScreen(event){
        // this.servicesList=[];
         console.log('shift staff id '+event.currentTarget.dataset.shiftstaffid);
         let participantid=event.currentTarget.dataset.participantid;
         this.isEditShiftScreenFlag=true;
       
         this.shiftStaffId=event.currentTarget.dataset.shiftstaffid;
        this.finalSelectedFacilities=[];

        console.log(' selected facilities '+JSON.stringify(this.facilityValue));
        console.log(' ORG facilities '+JSON.stringify(this.facilityOptions));
        this.finalSelectedFacilities = this.facilityOptions;
         this.openParticipantshiftView=true;
         refreshApex(this.wiredServicesResult);
      
         this.isIncludeParticipants=true;
         this.AddShiftIncludePartcipants=true;
         this.AddShiftRecurringCheckboxValue=false;
         this.recurTemplate=false;
         this.SplitShiftRows=[];
          this.deletedChecklist=[];
         this.disablePostInsertButtons=false;
         this.disableServiceSection=false;
         /* this.isDisbaleServiceButton=false */
         this.isDisbaleServiceButton = true;
         this.postInsertOperation ==false;
         this.isModalOpen=false;
         this.SplitShiftVisible=true;
    /*    this.disableTimeButton=true; */
         this.headingLabel='Edit Shift';
        this.createShiftlabel="Update Shift" ;
        this.isOriginalStaffChanged=false;
         this.emptyFields();
     
        this.isCreateShiftButton=false;
       this.isSingleClassForServiceCreation=false;
        this.participantAddressCheckBox=false;
         this.addNewAddressCheckBox=false;
           getAddShiftDataById({shiftId:this.shiftStaffId}).then(result=>{
              console.log('shift data '+JSON.stringify(result));
                this.ShiftwithStafftoApexId = result.shiftwithstaffdata.Id;
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
                AddShiftEndDate:result.shiftwithstaffdata.Add_Shift__r.End_Date__c,
                
            }
            this.hourlrRateLabel= this.addShiftData.AddShiftType =='Sleepover Shift' ?'Allowance':'Hourly Rate';
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
                    rows.push(buildRow('Sleepover', shift.Long_Sleepover_Start_Time__c, shift.Long_Sleepover_End_Time__c, shift.Long_Sleepover_Hourly_Rate__c, shift.Long_Sleepover_Duration__c));
                }
            }
            this.rateRows = rows;
            this.IsLongShift=this.rateRows.length >=1 ?true:false;
            this.LongShiftTimeSlots={}
            this.rateRows.forEach(row => {
              this.LongShiftTimeSlots[row.rowShiftType] = row;
            });
         

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
             this.disableTimeButton=true;
             this.disablePostInsertButtons=true;
            this.isDisableParticipantCheckBox=true;
           }else{
             this.showLocation=false;
             this.isDisableParticipantCheckBox=false;
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
            this.isDisableSaveButton=false;
            this.isVisibleCreateServicesButton=true; 
            this.serviceParticipant=participantid;
          
            console.log('participant  id '+this.serviceParticipant);
            this.handleLinkParticipants();
            this.getFundOptions();
            this.staffSlistOnSelection();
            this.RolesStaffId=this.addShiftData.AddShiftStaffValue;
               this.fetchStaffRoles();     
            })
           
         }, 2000);
        
        
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

       getFundOptions(){
        if(this.ServiceStaffValue && this.serviceParticipant){
          getClientFunds({clientId :this.serviceParticipant}).then(response=>{
            //  console.log('funds '+JSON.stringify(response));
              if(response){
                this.TotalFunds=response;
                this.fundOption=response.map(rec=>{
                  return { "label": rec.Registration_Group__c,"value": rec.Id};
                });
                console.log('funds option'+JSON.stringify(this.fundOption));
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
            position: `top: ${mouseY + 10}px; left: ${leftPosition}px;` ,
            unassignedservice:event.currentTarget.dataset.unassignedservice =='true'?true:false,
            rolename:event.currentTarget.dataset.rolename,
            uiStatus:event.currentTarget.dataset.status,
            cssUiStatus:event.currentTarget.dataset.cssuistatus
        };
        console.log('Tooltip visible:',JSON.stringify( this.shiftTooltipInformation)); 
    
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
      console.log('staff id'+event.currentTarget.dataset.participantid);
      console.log('staff id'+event.currentTarget.dataset.weekdate);
      let shiftDate=event.currentTarget.dataset.weekdate;
      console.log('Shift Date '+shiftDate);
      this.moreShiftlist=[];
      getServicesByDate({participantId:event.currentTarget.dataset.participantid,startDate:shiftDate}).then(result => {
        this.moreShiftlist=result;
      //this.openMoreShiftModal=true; 
    this.moreShiftlist = this.moreShiftlist.map(rec => {
          let uiStatus = '';
          
          if (rec.Un_Assigned_Service__c==true) {
              uiStatus = 'Unassigned';
          } 
          if (rec.ShiftwithStaff__r?.Attendence__c==true) {
              uiStatus = rec.ShiftwithStaff__r.Status__c ==='InProgress'?'In Progress' :rec.ShiftwithStaff__r.Status__c;
          }
            console.log('uiStatus '+uiStatus);
          return {
              ...rec,
              unassignedService: (rec.Un_Assigned_Service__c === true || rec.Assigned_Service__c === true),
              uiStatus:uiStatus,
              cssUiStatus:rec.Un_Assigned_Service__c==true? 'Unassigned' : rec.ShiftwithStaff__r.Status__c
          };
      });

      console.log('More shift list'+JSON.stringify(this.moreShiftlist)); 
     })
  
     
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
        const tooltip = this.template.querySelector('.tooltip');
        if (tooltip && !tooltip.contains(event.target)) {
            this.closeTooltip();
        }
    };
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
   // this.isShowSpinner = true;
    this.handleRefresh()
    }, 2000);
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
       
        HandleEditServicestateChange(event){
         this.ServiceStateEditValue = event.target.value;
         console.log('state value==>' + this.ServiceStateEditValue);
         this.NdisServiceGroupNameinEdit=true;
            
         console.log('if==>' + this.ServiceStateEditValue);
         console.log('service type '+JSON.stringify(this.serviceEditGroupName));
         this.serviceEditGroupName = this.serviceEditGroupName.map((item) => {
             const amount = item[this.ServiceStateEditValue]; // Dynamically fetch the state's amount field
             // console.log('amount '+amount);
             if (amount !== undefined) {
                 return { ...item, amount }; // Include the state's amount in the filtered row
             }
             return { ...item, amount: 0.00 }; // Add an empty amount for rows without the state's field
         });
         console.log(' Service list based on state change '+JSON.stringify(this.serviceEditGroupName));
          
     
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
       refreshApex(this.wiredServicesResult).then(() => {
        console.log(' service data is refrshed ');
            if (this.servicesList.length > 0 ) {
             

             } else{
               console.log(' else in service length after delete');
                console.log(' if in service length after delete' +this.servicesList.length);
                 if(this.participantAddressCheckBox==true){ 
                    this.facilityAddressCheckbox = true;
                    this.participantAddressCheckBox=false;
                     this.addNewAddressCheckBox=false;
                    this.addShiftData.AddShiftParticipantAddressCheckbox = false;
                    this.addShiftData.AddShiftEnterOtherLocation = false;
                    
                    this.isDisableSaveButton = false;
                    this.getFacilityAddress();
                    this.handleCreateShift();
                } 
                this.isShowSpinner=false;      
             
             }
            });
      this.ServiceWarningMessage=false;
       this.isShowSpinner=false;   
      this.handleRefresh();
    });
  }

       handleDeleteConfirmation(event){
         this.ServiceWarningMessage=true;
         this.participantServiceDeleteInfo={};
         this.participantServiceDeleteInfo.partcipantName=event.currentTarget.dataset.participantname;
         this.participantServiceDeleteInfo.serviceId=event.currentTarget.dataset.id;
         this.participantServiceDeleteInfo.serviceName=event.currentTarget.dataset.servicename;
     
       }
       closeWarningMessage() {
        this.ServiceWarningMessage=false;
        this.shiftDeleteConfirmation=false;
       
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
      handleFinalAllocate(){
        this.fatigueManagementFlag=false;
      }
      handleDeselectStaff(){
     //   this.isCalenderShiftView=false;
       this.openParticipantshiftView=false;
        this.fatigueManagementFlag=false;
     }
     handleRiskNavigation(event){
      const participantId = event.currentTarget.dataset.participantid;
      console.log('participantId '+participantId);
        const editEvent = new CustomEvent('risknavigation', {
            detail: { participantId:participantId,naviagte:'riskmanagement' },
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
   // this.LongShiftTimeSlots={};
    const shiftTypeMap = {};
    this.rateRows.forEach(row => {
        shiftTypeMap[row.rowShiftType] = row;
    });
     this.LongShiftTimeSlots = { ...this.LongShiftTimeSlots, ...shiftTypeMap };
 
    console.log('rateRows after delete:', JSON.stringify(this.rateRows));
     console.log('Mapped by rowShiftType: after delete:', JSON.stringify(this.LongShiftTimeSlots));
}
 handleRateRowTimeChange(event) {
  this.isDisableSaveButton = false;
  const index = parseInt(event.target.dataset.index, 10);
  const field = event.target.dataset.field;
  const ampm = event.target.dataset.amapm;
  const childData = event.detail;

  // Update the changed field
  this.rateRows = this.rateRows.map((row, i) => {
    if (i === index) {
      return {
        ...row,
        [field]: childData.twentyFourHourFormat,
        [ampm]: childData.displaytime
      };
    }
    return row;
  });
 console.log('rateRows 11 ',JSON.stringify(this.rateRows));
  const startDateStr = this.addShiftData.AddShiftStartDate;
  const endDateStr = this.addShiftData.AddShiftEndDate;
  const shiftStartTimeStr = this.addShiftData.AddShiftStartTime?.split(':');
  const shiftEndTimeStr = this.addShiftData.AddShiftEndTime?.split(':');

  if (!startDateStr || !endDateStr || !shiftStartTimeStr || !shiftEndTimeStr) return;

  const [shiftStartHour, shiftStartMin] = shiftStartTimeStr;
  const [shiftEndHour, shiftEndMin] = shiftEndTimeStr;

  const shiftStart = new Date(`${startDateStr}T${shiftStartHour}:${shiftStartMin}:00`);
  let shiftEnd = new Date(`${endDateStr}T${shiftEndHour}:${shiftEndMin}:00`);

  let lastRowEnd = null;
  let hasError = false;

  for (let i = 0; i < this.rateRows.length; i++) {
    const { startTime, endTime, rowShiftType, startAmPm, endAmPm } = this.rateRows[i];

    if (!startTime || !endTime || !rowShiftType) continue;

    const [sHour, sMin] = startTime.split(':');
    const [eHour, eMin] = endTime.split(':');

    let rowStart, rowEnd;

    // First row base date
    if (i === 0) {
      rowStart = new Date(`${startDateStr}T${sHour}:${sMin}:00`);

      if (rowShiftType === 'Night' && startAmPm.includes('AM') && endAmPm.includes('AM')) {
        rowStart.setDate(rowStart.getDate() + 1);
        rowEnd = new Date(rowStart);
        rowEnd.setHours(parseInt(eHour), parseInt(eMin));
      } else if (rowShiftType === 'Night' && startAmPm.includes('PM') && endAmPm.includes('AM')) {
        rowEnd = new Date(`${startDateStr}T${eHour}:${eMin}:00`);
        rowEnd.setDate(rowEnd.getDate() + 1);
      } else {
        rowEnd = new Date(`${startDateStr}T${eHour}:${eMin}:00`);
      }

    } else {
      rowStart = new Date(this.rateRows[i - 1].enddate);

      if (rowShiftType === 'Night' && startAmPm.includes('AM') && endAmPm.includes('AM')) {
        rowStart.setDate(rowStart.getDate() + 1);
        rowEnd = new Date(rowStart);
        rowEnd.setHours(parseInt(eHour), parseInt(eMin));
      } else if (rowShiftType === 'Night' && startAmPm.includes('PM') && endAmPm.includes('AM')) {
        rowEnd = new Date(rowStart);
        rowEnd.setHours(parseInt(eHour), parseInt(eMin));
        rowEnd.setDate(rowEnd.getDate() + 1);
      } else {
        rowEnd = new Date(rowStart);
        rowEnd.setHours(parseInt(eHour), parseInt(eMin));
      }
    }

    if (rowEnd <= rowStart) {
      rowEnd.setDate(rowEnd.getDate() + 1);
    }

    const durationInMs = rowEnd - rowStart;
    const durationInHours = durationInMs / (1000 * 60 * 60);

    this.rateRows[i].startdate = rowStart.toISOString();
    this.rateRows[i].enddate = rowEnd.toISOString();
    this.rateRows[i].duration = parseFloat(durationInHours.toFixed(2));

    // VALIDATIONS
    if (rowEnd <= rowStart) {
      this.confirMationMessage('Invalid Time', `Row ${i + 1}: End time must be after start time`, 'error');
      hasError = true;
    }

    if (i > 0) {
      if (lastRowEnd && rowStart < lastRowEnd) {
        this.confirMationMessage('Overlap Error', `Row ${i + 1} overlaps with previous row`, 'error');
        hasError = true;
      }

      if (lastRowEnd && rowStart.getTime() !== lastRowEnd.getTime()) {
        this.confirMationMessage(
          'Time Continuity Error',
          `Row ${i + 1} must start exactly when Row ${i} ends`,
          'error'
        );
        hasError = true;
      }

      if (rowStart < shiftStart || rowEnd > shiftEnd) {
        this.confirMationMessage('Outside Shift Time', `Row ${i + 1} is outside the shift timing`, 'error');
        hasError = true;
      }
    }

    lastRowEnd = rowEnd;
  }

  // Final validation: first row must match shiftStart, last row must match shiftEnd
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
 console.log('rateRows ',JSON.stringify(this.rateRows));
  const shiftTypeMap = {};
  this.rateRows.forEach(row => {
    shiftTypeMap[row.rowShiftType] = row;
  });
  this.LongShiftTimeSlots = shiftTypeMap;
  console.log('LongShiftTimeSlots ',JSON.stringify(this.LongShiftTimeSlots));
  this.isDisableSaveButton = hasError;
}   
    
handleRateRowInputChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const field = event.target.name;
    const value = event.target.value;

    this.rateRows = this.rateRows.map((row, i) => {
        if (i === index) {
            let updatedRow = { ...row, [field]: value };

            if (field === 'rowShiftType') {
                const calculatedRate = this.getServiceStaffHourlyRate(
                    this.addShiftData.AddShiftHoliday,
                    this.AddShiftDayName,
                    this.addShiftData.AddShiftStaffValue,
                    value
                );
                updatedRow.hourlyRate = calculatedRate.toString();

                // Set label based on shift type
                updatedRow.rateLabel = value === 'Sleepover Shift' ? 'Allowance' : 'Rate';
            }

            return updatedRow;
        }
        return row;
    });

    const shiftTypeMap = {};
    this.rateRows.forEach(row => {
        shiftTypeMap[row.rowShiftType] = row;
    });
    this.LongShiftTimeSlots = shiftTypeMap;
}


    /* Auto Schedule Started*/

    handleCloseautoSchedule() { 
      this.autoschdulePopup = false;
      this.isautoschedulepopup =='';
      //this.participantData = true;
     // this.loadParticipantData();
     this.handleRefresh()
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
       console.log('  auto schedule row in drop '+JSON.stringify(this.rows));
    }
    stopDragPropagation(event) {
      event.stopPropagation();
    }


    toggleArrow(event) {
      const index = +event.currentTarget.dataset.index;
      const currentDirection = this.rows[index].direction;
      const newDirection = currentDirection === 'arrowup' ? 'arrowdown' : 'arrowup';
      const updatedRows = [...this.rows];
  
      updatedRows[index].direction = newDirection;
      updatedRows[index].iconName = `utility:${newDirection}`;
      updatedRows[index].directionLabel = newDirection === 'arrowup' ? 'Low to High' : 'High to Low';
  
      this.rows = updatedRows; // trigger reactivity
      console.log('  auto schedule row '+JSON.stringify(this.rows));
  }
  

    get rowIconName() {
      return (row) => {
          return row.direction === 'up' ? 'utility:arrowup' : 'utility:arrowdown';
      };
    }

    handleInputChange(event) {
      const index = +event.target.dataset.index;
      let value;

      if (event.target.type === 'checkbox') {
          value = event.target.checked;
      } else {
          value = event.target.value; // slider/radio both use value
      }

      this.rows[index].value = value;
      this.rows = [...this.rows]; // trigger reactivity

      console.log('Updated rows:', JSON.stringify(this.rows));
    }


    get previewRows() {
      return this.rows.map((row) => {
          let displayValue = '';
  
          if (row.isCheckbox) {
              displayValue = row.value ? 'Checked' : 'Unchecked';
          } else if (row.isRadio) {
              displayValue = row.value || 'Not selected';
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
          { label: 'Permanent', value: 'Permanent' },
          { label: 'Casual', value: 'Casual' }
      ];
    } 
    handleRun() {
     console.log('startDate: ' + this.startDate);
    console.log('endDate: ' + this.endDate);
    console.log('auto schedule row (before): ' + JSON.stringify(this.rows));

    if (Array.isArray(this.rows)) {
        this.rows = this.rows.map((row, index) => {
            return {
                ...row,
                index: index + 1
            };
        });
    }

    console.log('auto schedule row (after): ' + JSON.stringify(this.rows));
    this.isShowSpinner = true;
      assignShifts({ startDate: this.startDate, endDate: this.endDate,AutoScheduleParameters :JSON.stringify(this.rows) }).then(result=>{
        console.log('Result  ==>',JSON.stringify(result));
         this.confirMationMessage('Success', 'Shifts Assigned Successfully', 'Success');
          this.handleRefresh();
          this.autoschdulePopup=false;
          this.isShowSpinner=false;
  

      }).catch(error => {
          console.error('Error updating shift:', error);
          this.confirMationMessage('Error', 'Error Occured While Assigning Shifts', 'Error');
         this.autoschdulePopup=false;
          this.isShowSpinner=false;
        
      });
     
    } 
    handlePublishClose(){
       this.publishTempalte=false;
    } 
    handleFinalPublish  (){
       publishShifts({ startDate: this.startDate, endDate: this.endDate })
      .then(() => {
          this.confirMationMessage('Success', 'Shifts Published Successfully', 'Success');
          this.handleRefresh();
          this.publishTempalte=false;
          this.isShowSpinner=false;
  
      })
      .catch(error => {
          console.error('Error updating shift:', error);
          this.confirMationMessage('Error', 'Error Occured While Publishing Shifts', 'Error');
          this.publishTempalte=false;
          this.isShowSpinner=false;
        
      });
      
    }

    handleCreateShift(){
      this.isShowSpinner=true;
      this.finalAddShiftData.shiftaddress=this.address;
      this.finalAddShiftData.shiftDetails=this.addShiftData;
      this.SplitShiftRows[0].duration=this.addShiftData.AddShiftDuration;
      this.SplitShiftRows[0].startTime=this.addShiftData.AddShiftStartTime;
      this.SplitShiftRows[0].endTime=this.addShiftData.AddShiftEndTime;
      this.SplitShiftRows[0].serviceDate=this.addShiftData.AddShiftStartDate;
      let successMessage='';
       const checkListJsonData = this.ChekListrows.map(row => ({
          ...row, // Retains existing fields
          description: row.description,
          mandatory: row.mandatory
          }));
      this.SplitShiftRows=this.SplitShiftRows.map( rec=>{
              return {
                ...rec,LongShiftTimeSlots:JSON.stringify(this.LongShiftTimeSlots)
              }
              
            });
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
      console.log('service staff ====> '+this.ServiceStaffValue);
      console.log('addShift staff =====> '+this.addShiftData.AddShiftStaffValue);
     //   console.log('SrviceParticipantName  ====> '+this.SrviceParticipantName);
        if(this.isEditShiftScreenFlag ==false){
          successMessage='Your shift has been successfully created. Please proceed with adding staff/participants to this shift.';
        }else{
           successMessage='Your shift has been successfully updated. Please proceed with adding staff/participants to this shift.';
        }
         if(this.SrviceParticipantName != null && this.SrviceParticipantName != undefined && this.SrviceParticipantName != ''){
             // successMessage='The service for '+this.SrviceParticipantName+' has been successfully created.';
            //  this.AddShiftIncludePartcipants=true
        } 
      if(this.isNewInsertOperation==true &&this.postInsertOperation ==false){
        console.log(' first if ==>')
          this.SplitShiftRows[0].StaffId=this.addShiftData.AddShiftStaffValue;
          this.SplitShiftRows[0].serviceStffaHourlyRate=this.addShiftData.AddShiftStaffHourlyRate;
          //this.AddShiftIncludePartcipants=true;
    
        }
       
    
       if(this.ServiceStaffValue !=this.addShiftData.AddShiftStaffValue ){ 
            console.log(' second if ==>')
              this.addShiftData.AddShiftId=null;
              this.SplitShiftRows[0].shiftWithStaffId=null;
              this.SplitShiftRows[0].StaffId=this.ServiceStaffValue;
              this.SplitShiftRows[0].serviceStffaHourlyRate=this.serviceStaffHourlyRate;
       }
       // console.log('finalAddShiftData '+JSON.stringify(this.finalAddShiftData));
       // console.log('Split Shift rows '+JSON.stringify(this.SplitShiftRows));
       if(this.isEditShiftScreenFlag==true &&  this.isOriginalStaffChanged ==true ){
            console.log('isEditShiftScreenFlag ==> for same staff ')
            this.addShiftData.AddShiftId=this.parentAddShiftId;
            this.SplitShiftRows[0].StaffId=this.addShiftData.AddShiftStaffValue;
            this.SplitShiftRows[0].serviceStffaHourlyRate=this.addShiftData.AddShiftStaffHourlyRate;
             this.SplitShiftRows[0].shiftWithStaffId=this.shiftStaffId;
      
       }
      
        console.log('finalAddShiftData ====> '+JSON.stringify(this.finalAddShiftData));
        console.log(' is recurrig ====>'+this.AddShiftRecurringCheckboxValue);
        console.log(' typeOfRecur ====>'+this.RecurValue);
        console.log(' recurEvery ====>'+this.recurEveryValue);
        console.log(' endDate =====> ' +this.recurEndDate);
        console.log(' shiftDate =====> ' +this.addShiftData.AddShiftStartDate);
        console.log(' weeklyDays =====> ' +this.selectedDays);
        console.log(' monthlyDay =====> ' +this.monthlyDay);
        console.log(' servicesJsonData =====> ' +JSON.stringify(this.SplitShiftRows));
        console.log(' checkListJsonData =====> ' +JSON.stringify(checkListJsonData));
        console.log('isUpdate =====> ' +this.isEditShiftScreenFlag);
        console.log('includeParticipants =====> ' +this.AddShiftIncludePartcipants);
        console.log('recurrenceDates =====> ' +this.recurrenceDatesList);
    if(this.participantAddressCheckBox ==false && this.facilityAddressCheckbox ==false && this.addNewAddressCheckBox ==false ){
              this.confirMationMessage('Error','Address is Required.','Error'); 
                  this.isShowSpinner=false; 
                return;       
      }
        const serviceTypeIdSet = new Set();
          this.SplitShiftRows.forEach(item => {
              if (item.serviceTypeId) {
                  serviceTypeIdSet.add(item.serviceTypeId);
              }
          });
          const serviceTypeIdList = Array.from(serviceTypeIdSet);
    
     getFundsData({ fundsId: serviceTypeIdList })
    .then(result => {
        console.log('🔄 [Step 1] Apex returned funds:', JSON.stringify(result));

        // Step 1: Map serviceTypeId → {available, spent}
        const fundMap = new Map();
        result.forEach(fund => {
            console.log(`🗃️  Mapping fund: ${fund.Id}, Available: ${fund.Available_Funds__c}, Spent: ${fund.Spent_Amt__c}`);
            fundMap.set(fund.Id, {
                available: fund.Available_Funds__c || 0,
                spent: fund.Spent_Amt__c || 0,
                name: fund.Name || 'Unknown Service'
            });
        });

        // Step 2: Aggregate usage by serviceTypeId
        const usageMap = new Map();
        this.SplitShiftRows.forEach(row => {
            if (!row.serviceTypeId || row.duration == null || row.serviceAmount == null) {
                console.warn('⚠️ Skipping row due to missing data:', row);
                return;
            }

            const totalAmount = row.duration * row.serviceAmount;
            console.log(`➕ Row: serviceTypeId=${row.serviceTypeId}, duration=${row.duration}, amount=${row.serviceAmount}, total=${totalAmount}`);

            if (usageMap.has(row.serviceTypeId)) {
                const updated = usageMap.get(row.serviceTypeId) + totalAmount;
                usageMap.set(row.serviceTypeId, updated);
                console.log(`🔁 Updated usageMap: ${row.serviceTypeId} → ${updated}`);
            } else {
                usageMap.set(row.serviceTypeId, totalAmount);
                console.log(`🆕 Set usageMap: ${row.serviceTypeId} → ${totalAmount}`);
            }
        });

        // Step 3: Validate usage against available funds
        const exceededServices = [];

        usageMap.forEach((usedAmount, serviceTypeId) => {
            const fund = fundMap.get(serviceTypeId);
            if (fund) {
                const totalSpent = fund.spent + usedAmount;
                console.log(`🔍 Checking serviceTypeId=${serviceTypeId}: used=${usedAmount}, spent=${fund.spent}, total=${totalSpent}, available=${fund.available}`);

                if (totalSpent > fund.available) {
                    exceededServices.push({
                        serviceTypeId,
                        usedAmount,
                        totalSpent,
                        available: fund.available
                    });
                    console.error(`❌ Funding exceeded for ${serviceTypeId}`);
                }
            } else {
                console.warn(`⚠️ No fund data found for serviceTypeId=${serviceTypeId}`);
            }
        });

        // Step 4: Show toast if exceeded
        if (exceededServices.length > 0) {
            console.error('🚨 Funding exceeded for these services:', exceededServices);

            const message = exceededServices.map(s =>
                `Service "${fundMap.get(s.serviceTypeId).name}" exceeds available funds. Used: $${s.usedAmount.toFixed(2)}, Available: $${s.available.toFixed(2)}`
            ).join('\n');
             this.confirMationMessage('Funding Limit Exceeded', message, 'error');
                 this.isShowSpinner=false;
            return; // Stop further processing
        } else {
             if(this.validateInputs() && this.validateAddress() && this.addShiftData.AddShiftDuration >0){
          createAddShift({addshiftData:JSON.stringify(this.finalAddShiftData),isRecurring:this.AddShiftRecurringCheckboxValue,typeOfRecur:this.RecurValue,
            recurEvery:this.recurEveryValue,endDate:this.recurEndDate,shiftDate:this.addShiftData.AddShiftStartDate, weeklyDays:this.selectedDays,monthlyDay:this.monthOfDay,
            servicesJsonData:JSON.stringify(this.SplitShiftRows),checkListJsonData:JSON.stringify(checkListJsonData),isUpdate:this.isEditShiftScreenFlag,includeParticipants:this.AddShiftIncludePartcipants, recurrenceDates: this.recurrenceDatesList,isSingleClass:this.isSingleClassForServiceCreation}).then(result=>{
             // console.log('result '+JSON.stringify(result));
             
              if(result.isSuccess){
                this.confirMationMessage('Success',successMessage,'Success');
                let shiftWithStaffList = JSON.parse(result.shiftWithstaffResult);
                let addShiftList = JSON.parse(result.AddShiftResult);
        
                console.log('Shift With Staff:',JSON.stringify(shiftWithStaffList) );
                console.log('Add Shift List:', JSON.stringify(addShiftList));
      
              
                this.shiftStaffId=shiftWithStaffList[0].Id;
                if(this.addShiftData.AddShiftnotification ==true){
                  console.log('send push notification')
                 
                generateAndSendNotification({role:this.addShiftData.AddShiftRole,strdate:this.addShiftData.AddShiftStartDate,staffId:this.addShiftData.AddShiftStaffValue}).then(response=>{
                });
              }
               
                  getAddShiftDataById({shiftId:shiftWithStaffList[0].Id}).then(result=>{
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
         
       //let serviceSupportId=this.servicesList[0].Id
          // console.log('services list '+JSON.stringify(this.servicesList));
          this.parentAddShiftId=result.shiftwithstaffdata.Add_Shift__r.Id;
                  this.disableServiceSection=false;
                  this.isDisbaleServiceButton=false;
                  this.isShowSpinner=false;
                  this.ServiceTypeIdInParticipant='';
                  this.stateValue='';
                  this.servicePlan='';
                  this.NdisServiceGroupName=false;
                  this.serviceGroupName=[];
                  this.fundOption=[];
                  this.riskIndex='';
                  this.selectedHolidayDates=[];
                   this.removeHolidayDate=[];
                   this.addShiftData.AddShiftId=addShiftList[0].Id;
                   this.parentAddShiftId=addShiftList[0].Id;
                   this.createShiftlabel="Update Shift" ;
                   this.isEditShiftScreenFlag=true;
                 // this.getServiceStaffHourlyRate();
                    const rate = this.getServiceStaffHourlyRate( this.addShiftData.AddShiftHoliday, this.AddShiftDayName,this.ServiceStaffValue,this.addShiftData.AddShiftType);
                 this.serviceStaffHourlyRate = rate;
                  this.SplitShiftRows=[];
                 this.RecurValue=''
                 this.recurEveryValue=0
                 this.selectedDays=[]
                 this.monthOfDay=0;
                 this.recurOccurencesValue=0;
                 this.recurEndDate='';
                  this.recurEndDateFormattedDate='';
                this.AddShiftRecurringCheckboxValue=false;
                 this.isRecurWeekFlag=false;
                 this.isRecurmontlyFlag=false; 
                 this.SplitShiftVisible=true;
                 this.isVisibleCreateServicesButton=true;  
                 this.showMuteIcon = false;  
                 this.showClearIcon = false;
                 this.recurTemplate=false;
                 this.headingLabel='Edit Shift';
              
           this.handleAddSplitShiftRow()
           this.SplitShiftRows[0].shiftWithStaffId=result.shiftwithstaffdata.Id;
           this.SplitShiftRows[0].serviceStffaHourlyRate=result.shiftwithstaffdata.Staff_Final_Hourly_Rate__c;
           this.SplitShiftRows[0].StaffId=result.shiftwithstaffdata.Staff__c;
           this.SplitShiftRows[0].duration=result.shiftwithstaffdata.Add_Shift__r.Duration__c;
           this.SplitShiftRows[0].serviceDate=result.shiftwithstaffdata.Add_Shift__r.Start_Date__c;
           this.finalAddShiftData.shiftaddress=this.address;
           this.finalAddShiftData.shiftDetails=this.addShiftData;
           this.staffSlistOnSelection();
               this.getFundOptions();
           this.RolesStaffId=this.addShiftData.AddShiftStaffValue;
              this.fetchStaffRoles();
              console.log(' services length '+this.servicesList.length);
              this.openParticipantshiftView=false;
              refreshApex(this.wiredServicesResult).then(() => {
                if (this.servicesList.length > 0 || result.shiftwithstaffdata.Split_Shifts__c==true) {
                  console.log(' if in service length')
                  this.SplitShiftVisible =false;
    
                 } else{
                  this.SplitShiftVisible =true;
                 } 
            });
               
            this.handleRefresh();
          
        }, 1000);
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
    })
    .catch(error => {
        console.error('🔥 Apex call failed or validation error:', error);
          this.isShowSpinner=false;
    });
    
      
    
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

getTdClass(dayShift) {
    return dayShift.isSizeZeroFlag
        ? 'slds-text-align_center'
        : 'slds-text-align_center styled-td';
}

}