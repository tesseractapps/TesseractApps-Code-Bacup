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
//import sendPushNotification from '@salesforce/apex/mobilePushNotificationController.sendPushNotification';
import generateAndSendNotification from '@salesforce/apex/MobileAppNotificationsV2.generateAndSendNotification';
import getJSONdata from '@salesforce/apex/GeoTaggingfromAWS.getS3JsonData';
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import LEAFLET from '@salesforce/resourceUrl/leaflet';
import getServicesByDate from '@salesforce/apex/ServiceSupportPlanHandler.getServicesByDate';
import getStaffByStatus from '@salesforce/apex/StaffController.getStaffByStatus';
import getOverlappingShiftsData from '@salesforce/apex/AddShiftParticipantView.getOverlappingShiftsData';
import getFatigueData from '@salesforce/apex/RosterCreation.getFatigueData';

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
        postalcode:null
    };
    @track ChekListrows = []; // Array to store the dynamic rows
    comboboxOptions = [
      { label: 'Give Meds', value: 'Give Meds' },
      { label: 'Check BP', value: 'Check BP' },
      { label: 'Sugar Level Test', value: 'Sugar Level Test' }
    ];
    @track recurOptions=[{label: 'Daily',value: 'Daily'  },{ label: 'Weekly',value: 'Weekly' }, { label: 'Monthly',value: 'Monthly' }]
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

    // Called when the component is initialized
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
    this.handleRefresh()
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
      }
      
  EmptyAddressFields(){
    this.address.street='';
        this.address.citySuburb='';
        this.address.postalcode='';
        this.address.provinceState='';
        this.address.country='';
  }
    handleOpenParticipantShiftView(event){
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
         this.addShiftData.AddShiftFacilityValue=this.facIdlist[0];
         this.addShiftData.AddShiftHoliday=holiday =="true"?true:false ;
         this.AddShiftDayName=event.currentTarget.dataset.weekname;
         this.addShiftData.AddShiftnotification=true;
         this.addShiftData.AddShiftType='';
         this.isEditShiftScreenFlag=false;
         this.isIncludeParticipants=false;
         this.AddShiftIncludePartcipants=true;
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
         this.isDisableParticipantCheckBox=true;
         this.participantAddressCheckBox=false;
         console.log('participant id '+ this.isDisableParticipantCheckBox);
         this.handleAddSplitShiftRow();
         this.handleLinkParticipants();
         this.SplitShiftRows[0].participant=participantid;
         this.serviceParticipant=participantid
         this.facilityAddressCheckbox=true;
         this.SplitShiftVisible=false;
         this.AddShiftRecurringCheckboxValue=false;
       
        this.getFacilityAddress();
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
       // this.isDisableParticipantCheckBox=false;
        this.serviceGroupName=[];
        this.NdisServiceGroupName=false;
        this.stateValue=''
        this.isDisbaleServiceButton=true;
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
        this.getHourlyStaffRates();
      
      }
      if(event.target.name =='AddShiftNotes'){
        this.showClearIcon = this.addShiftData.AddShiftNotes.length > 0;
      }
      if(event.target.name =='AddShiftStaffValue'){

       this.RolesStaffId=this.addShiftData.AddShiftStaffValue;
          this.fetchStaffRoles();
          this.getHourlyStaffRates();
          this.getOverLappingdata();
         
      }
       
       console.log('addShiftData '+JSON.stringify(this.addShiftData))
    }
      

   
    getOrganisationTimings(){

      switch (this.addShiftData.AddShiftType) {
        case 'Morning':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Morning_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Morning_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Morning_Shift_End_Time__c.toLowerCase());
            this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Afternoon':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Afternoon_Shift_End_Time__c.toLowerCase());
            this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Night':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Night_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Night_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Night_Shift_End_Time__c.toLowerCase());
            this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'General':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.General_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.General_Shift_End_time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.General_Shift_End_time__c.toLowerCase());
            this.disableTimeButton=true;
            this.checkFatigue();
            break;
    
        case 'Custom':
            this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Custom_Shift_Start_Time__c.toUpperCase();
            this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Custom_Shift_End_Time__c.toUpperCase();
            this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_Start_Time__c.toLowerCase());
            this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Custom_Shift_End_Time__c.toLowerCase());
            this.disableTimeButton=false;
            this.checkFatigue();
            break;
        case 'Sleepover Shift':
          this.addShiftData.AddShiftStartTimeAMPM = this.organisationShiftTimes.Sleepover_Start__c.toUpperCase();
          this.addShiftData.AddShiftEndTimeAMPM = this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toUpperCase();
          this.addShiftData.AddShiftStartTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Start__c.toLowerCase());
          this.addShiftData.AddShiftEndTime = this.convertTo24HourFormat(this.organisationShiftTimes.Sleepover_Shift_End_Time__c.toLowerCase());
          this.disableTimeButton=false;
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
    getOverlappingShiftsData({strtTimeText:this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),endTimeText:this.addShiftData.AddShiftEndTimeAMPM.toLowerCase(),StaffID:this.addShiftData.AddShiftStaffValue,startdate:this.addShiftData.AddShiftStartDate,shiftType:this.addShiftData.AddShiftType}).then(result=>{
      console.log('over lapping data '+result);
      if(result==true){
        this.confirMationMessage('Error','The selected staff already has a shift within the start and end times. Please switch to the staff view and assign the services to the particular participant.','Error');
        this.isDisableSaveButton=true;
      }else{
        this.isDisableSaveButton=false;
      }
     })
  }

    getHourlyStaffRates(){
    //  console.log('staff in hourly rates '+JSON.stringify( this.StaffHourlyRates));
     console.log('this.addShiftData.AddShiftType '+this.addShiftData.AddShiftType);
   // console.log('this.addShiftData.AddShiftType '+this.addShiftData.AddShiftType);
      if (this.addShiftData.AddShiftHoliday) {
        this.addShiftData.AddShiftStaffHourlyRate = this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Public_holiday_Hourly_Rate__c || 0;
        return; // Exit function as holiday rate takes priority
        }
      switch (this.AddShiftDayName) {
        case 'Day 6': // Apply Sunday rate
            this.addShiftData.AddShiftStaffHourlyRate =  this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Sunday_Hourly_Rate__c || 0;
            break;

        case 'Day 5': // Apply Saturday rate
            this.addShiftData.AddShiftStaffHourlyRate =  this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Saturday_Hourly_Rate__c || 0;
            break;

        default: // For other days, determine by shift type
            switch (this.addShiftData.AddShiftType) {
                case 'General':
                case 'Morning':
                case 'Custom':
                  console.log('this.addShiftData.AddShiftType in general  '+this.addShiftData.AddShiftType);
                    this.addShiftData.AddShiftStaffHourlyRate =  this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Working_Hours_Rate__c || 0;
                    this.hourlrRateLabel='Hourly Rate';
                    this.hourlyrateDisable=true;
                   // console.log('this.addShiftData.AddShiftStaffHourlyRate '+this.addShiftData.AddShiftStaffHourlyRate);
                    break;
                case 'Night':
                  console.log('this.addShiftData.AddShiftType in night '+this.addShiftData.AddShiftType);
                    this.addShiftData.AddShiftStaffHourlyRate =  this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Night_shift_Hourly_Rate__c || 0;
                    this.hourlrRateLabel='Hourly Rate';
                    this.hourlyrateDisable=true; 
                 //   console.log('this.addShiftData.AddShiftStaffHourlyRate  night '+this.addShiftData.AddShiftStaffHourlyRate);   
                    break;

                case 'Afternoon':
                   console.log('this.addShiftData.AddShiftType in afternoon '+this.addShiftData.AddShiftType);
                    this.addShiftData.AddShiftStaffHourlyRate =  this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Afternoon_shift_Hourly_Rate__c || 0;
                    this.hourlrRateLabel='Hourly Rate';
                    console.log('this.addShiftData.AddShiftStaffHourlyRate  After noon '+this.addShiftData.AddShiftStaffHourlyRate);   
                    this.hourlyrateDisable=true;  
                    break;
                case 'Sleepover Shift':
                    console.log('this.addShiftData.AddShiftType in sleep over '+this.addShiftData.AddShiftType);
                  this.addShiftData.AddShiftStaffHourlyRate =  0;
                  this.hourlrRateLabel='Allowance';
                  this.hourlyrateDisable=false;  
                  console.log('this.addShiftData.AddShiftStaffHourlyRate sleep over '+this.addShiftData.AddShiftStaffHourlyRate);   
                  break;

                default: // If shift type is not recognized
                    this.addShiftData.AddShiftStaffHourlyRate = this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Working_Hours_Rate__c || 0;
                   // console.log('No matching shift type for AddShiftType');     
            }
            break;
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
    handleRecurEveryChange(event) {
      switch (event.target.name) {
          case 'recurEvery':
              this.recurEveryValue = event.target.value;
              break;
          case 'recurEndDate':
              this.recurEndDate = event.target.value;
              break;
          case 'monthLyOptions':
              this.monthOfDay = event.target.value;
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
   
   
    switch(event.target.value) {
        case 'Daily':
          this.RecurLabel= 'Day';
          this.isRecurWeekFlag=false; 
          this.isRecurmontlyFlag=false;               ;
              break; 
     
        case 'Weekly':  
        this.RecurLabel= 'Week' 
        this.isRecurWeekFlag=true; 
        this.isRecurmontlyFlag=false;    
            break;
        case 'Monthly':
          this.RecurLabel= 'Month';
          this.isRecurWeekFlag=false; 
          this.isRecurmontlyFlag=true;         
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
        getNumberOfRecurrences({typeOfRecur:this.RecurValue, recurEvery:this.recurEveryValue, endDate:this.recurEndDate, shiftDate:this.addShiftData.AddShiftStartDate,
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
        })
      }
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
      if (endTimeSplit[1] === 'AM' && (shiftType === 'Night' || shiftType === 'Sleepover Shift') ) {
          endDate.setDate(endDate.getDate() + 1); // Adjust for overnight shifts 
      }

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
      this.ChekListrows = this.ChekListrows .filter((row) => row.id !== rowId);
      this.updateIndexes();
    }

    // Update indexes after a row is deleted
    updateIndexes() {
      this.ChekListrows = this.ChekListrows.map((row, index) => {
        return { ...row, index: index + 1 };
      });
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
        
      }).catch(error=>{
        this.EmptyAddressFields();
        console.log(' error =>'+JSON.stringify(error));
        this.participantAddressCheckBox=false;
        this.confirMationMessage('Error','Please Select Participant','Error');
       // this.isDisableSaveButton=true;
      })
    }
      handleAddShiftSave(){
          this.isShowSpinner=true;
          this.finalAddShiftData.shiftaddress=this.address;
          this.finalAddShiftData.shiftDetails=this.addShiftData;
          console.log('service staff '+this.ServiceStaffValue);
          console.log('addShift staff '+this.addShiftData.AddShiftStaffValue);
          
         
          if(this.isNewInsertOperation==true &&this.postInsertOperation ==false){
            this.SplitShiftRows[0].StaffId=this.addShiftData.AddShiftStaffValue;
            this.SplitShiftRows[0].serviceStffaHourlyRate=this.addShiftData.AddShiftStaffHourlyRate;
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
         console.log(' check list data '+JSON.stringify(checkListJsonData));
      
        /*   if(this.isEditShiftScreenFlag==true && this.AddShiftRecurringCheckboxValue==true){
                 this.AddShiftIncludePartcipants= this.includeParticipantEvent
      
          }  */
          console.log('include participant '+this.AddShiftIncludePartcipants);
      
           if(this.validateInputs() && this.validateAddress() && this.addShiftData.AddShiftDuration >0){
            createAddShift({addshiftData:JSON.stringify(this.finalAddShiftData),isRecurring:this.AddShiftRecurringCheckboxValue,typeOfRecur:this.RecurValue,
              recurEvery:this.recurEveryValue,endDate:this.recurEndDate,shiftDate:this.addShiftData.AddShiftStartDate, weeklyDays:this.selectedDays,monthlyDay:this.monthOfDay,
              servicesJsonData:JSON.stringify(this.SplitShiftRows),checkListJsonData:JSON.stringify(checkListJsonData),isUpdate:this.isEditShiftScreenFlag,includeParticipants:this.AddShiftIncludePartcipants}).then(result=>{
        
                this.confirMationMessage('Success','Your shift has been successfully created. Please proceed with adding staff/participants to this shift.','Success');
                if(result.isSuccess){
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
                  
                  this.shiftStaffId=shiftWithStaffList[0].Id;
                  if(this.addShiftData.AddShiftnotification ==true){
                    console.log('send push notification')
              
                  generateAndSendNotification({role:this.addShiftData.AddShiftRole,strdate:this.addShiftData.AddShiftStartDate,staffId:this.addShiftData.AddShiftStaffValue}).then(response=>{
                  });
                }
                  setTimeout(()=>{
                    this.disableServiceSection=false;
                    this.isDisbaleServiceButton=false;
                    this.isShowSpinner=false;
                    this.handleRefresh();
                   this.ServiceTypeIdInParticipant='';
                   this.stateValue='';
                    this.servicePlan='';
                    this.NdisServiceGroupName=false;
                    this.serviceGroupName=[];
                   if(this.postInsertOperation=true){
                     this.postInsertOperation=false;
                     this.addShiftData.AddShiftId=addShiftList[0].Id;
                     this.parentAddShiftId=addShiftList[0].Id;
                     this.shiftStaffId=shiftWithStaffList[0].Id;
                     this.createShiftlabel="Update Shift" ;
                     this.isCreateShiftButton=false;
                     this.isEditShiftScreenFlag=true;
                     this.ServiceStaffValue=this.addShiftData.AddShiftStaffValue;
                   
                     this.getFundOptions();
                    this.getServiceStaffHourlyRate();
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
                }
               
              
      
            }); 
          }else{
            this.isShowSpinner=false;
                if(this.addShiftData.AddShiftDuration <=0){
                this.confirMationMessage('Error','Start Time should be greater than End Time.','Error');
                }
          } 
                
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
        if(event.target.name=='serviceStaff'){
          this.ServiceStaffValue=event.target.value;
        }
       
    
        switch (this.AddShiftDayName) {
          case 'Day 6': // Apply Sunday rate
              this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Sunday_Hourly_Rate__c || 0;
              break;
          case 'Day 5': // Apply Saturday rate
              this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Saturday_Hourly_Rate__c || 0;
              break;
    
          default: // For other days, determine by shift type
              switch (this.addShiftData.AddShiftType) {
                  case 'General':
                  case 'Morning':
                  case 'Custom':
                      this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Working_Hours_Rate__c || 0;
                      break;
                  case 'Night':
                      this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Night_shift_Hourly_Rate__c || 0;
                      break;
                  case 'Afternoon':
                      this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Afternoon_shift_Hourly_Rate__c || 0;
                      break;
                  case 'Sleepover Shift':
                        this.addShiftData.AddShiftStaffHourlyRate =  this.addShiftData.AddShiftStaffHourlyRate;
                        break;
                 // break;
                  default: 
                      this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Working_Hours_Rate__c || 0;
                     // console.log('No matching shift type for AddShiftType');
              }
              break;
        }
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
      if(serviceTypeName){
        this.serviceGroupName=[];
        this.NdisServiceGroupName=false;
        getNDISServiceLineItem({ServiceItemNames :serviceTypeName,ServiceDate:this.addShiftData.AddShiftStartDate}).then(response=>{
          this.serviceGroupName=response;
        // console.log('service type '+JSON.stringify(this.serviceGroupName));
        
        })
      }
      console.log('Split shift in service '+JSON.stringify(this.SplitShiftRows ));
    }
    HandlestateChange(event) {
      this.stateValue = event.target.value;
      this.isDisbaleServiceButton=true;
      console.log('state value ' + this.stateValue);
          if (this.stateValue) {
            this.NdisServiceGroupName=true;
            this.serviceGroupName = this.serviceGroupName.map((item) => {
                const amount = item[this.stateValue]; // Dynamically fetch the state's amount field
                // console.log('amount '+amount);
                if (amount !== undefined) {
                    return { ...item, amount }; // Include the state's amount in the filtered row
                }
                return { ...item, amount: 0.00 }; // Add an empty amount for rows without the state's field
            });
            //console.log(' Service list based on state change '+JSON.stringify(this.serviceGroupName));
            
        }
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
      console.log('Selected Row ID:', selectedId);
      console.log('Split shift after selection'+JSON.stringify(this.SplitShiftRows ));
    }
    handleCreateServiceSection(event){
      this.isShowSpinner=true;
     
        console.log('service staff '+this.ServiceStaffValue);
        console.log('addShift staff '+this.addShiftData.AddShiftStaffValue);
        this.SplitShiftRows[0].duration=this.addShiftData.AddShiftDuration;
        this.SplitShiftRows[0].startTime=this.addShiftData.AddShiftStartTime;
        this.SplitShiftRows[0].endTime=this.addShiftData.AddShiftEndTime;
        this.SplitShiftRows[0].serviceDate=this.addShiftData.AddShiftStartDate;
        console.log('finalAddShiftData  in service ===> '+JSON.stringify(this.finalAddShiftData));
        let checkListJsonData
    
         if(this.ServiceStaffValue ==this.addShiftData.AddShiftStaffValue &&this.postInsertOperation ==false){ 
         console.log('first if ')
          this.SplitShiftRows[0].shiftWithStaffId=this.shiftStaffId;
          this.AddShiftIncludePartcipants=true;
          this.isEditShiftScreenFlag=true;
        //  checkListJsonData=[]
          this.createfinalSerivce();
          }
          if(this.ServiceStaffValue !=this.addShiftData.AddShiftStaffValue &&this.postInsertOperation ==false){ 
            this.addShiftData.AddShiftId=null;
            console.log('Second if  ')
            this.SplitShiftRows[0].shiftWithStaffId=null;
            this.AddShiftIncludePartcipants=true;
            this.isEditShiftScreenFlag=false;
            checkListJsonData = this.ChekListrows.map(row => ({
              ...row, // Retains existing fields
              description: row.description,
              mandatory: row.mandatory
              }));
            if(this.validateAddress() ){
              getOverlappingShiftsData({strtTimeText:this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),endTimeText:this.addShiftData.AddShiftEndTimeAMPM.toLowerCase(),StaffID:this.ServiceStaffValue,startdate:this.addShiftData.AddShiftStartDate,shiftType:this.addShiftData.AddShiftType}).then(result=>{
                console.log('over lapping data '+result);
                if(result==true){
                  this.confirMationMessage('Error','The selected staff already has a shift within the start and end times. Please switch to the staff view and assign the services to the particular participant.','Error');
                  this.isShowSpinner=false;
                }else{
                   this.createfinalSerivce();
                }
               
               })
            } else{
                this.confirMationMessage('Error','Please select Address.','Error');
                this.isShowSpinner=false;
              
            }
           
            
          }
       
       
        
     }
    createfinalSerivce(){
      console.log('AddShiftIncludePartcipants' +this.AddShiftIncludePartcipants);
      console.log('isEditShiftScreenFlag' +this.isEditShiftScreenFlag)
    
      console.log('Split Shift rows in service '+JSON.stringify(this.SplitShiftRows));
      console.log('checkListJsonData '+JSON.stringify(this.ChekListrows));
      const checkListJsonData =[]
       
         createAddShift({addshiftData:JSON.stringify(this.finalAddShiftData),isRecurring:this.AddShiftRecurringCheckboxValue,typeOfRecur:this.RecurValue,
          recurEvery:this.recurEveryValue,endDate:this.recurEndDate,shiftDate:this.addShiftData.AddShiftStartDate, weeklyDays:this.selectedDays,monthlyDay:this.monthOfDay,
          servicesJsonData:JSON.stringify(this.SplitShiftRows),checkListJsonData:JSON.stringify(checkListJsonData),isUpdate:this.isEditShiftScreenFlag,includeParticipants:this.AddShiftIncludePartcipants}).then(result=>{
            console.log('result '+JSON.stringify(result));
            this.confirMationMessage('Success','The service has been successfully created.','Success');
            if(result.isSuccess){
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
              setTimeout(() => {
                this.handleRefresh();
                refreshApex(this.wiredServicesResult);
              }, 1000);
             //  this.serviceParticipant='';
               this.ServiceTypeIdInParticipant='';
               this.stateValue='';
               this.servicePlan='';
               this.NdisServiceGroupName=false;
               this.serviceGroupName=[];
             //  this.riskIndex='';
              // this.fundOption=[];
                this.SplitShiftRows=[];

                this.isSplitCheckbox=false;
               this.handleAddSplitShiftRow();
               this.SplitShiftVisible=true;
                console.log('Split shift'+JSON.stringify(this.SplitShiftRows));
                this.addShiftData.AddShiftId=this.parentAddShiftId;
                this.isVisibleCreateServicesButton=true; 
                this.serviceTableAddButton=false 
                this.isShowSpinner=false; 
               
            }else{
              console.log('Split shift'+result.message);  
              this.isShowSpinner=false;
            }
        });
    }
     getServiceStaffHourlyRate(){
      if (this.addShiftData.AddShiftHoliday) {
        this.serviceStaffHourlyRate = this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Public_holiday_Hourly_Rate__c || 0;
        return; // Exit function as holiday rate takes priority
        }
      switch (this.AddShiftDayName) {
        case 'Day 6': // Apply Sunday rate
        this.serviceStaffHourlyRate =  this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Sunday_Hourly_Rate__c || 0;
           // this.serviceStaffHourlyRate=this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Sunday_Hourly_Rate__c || 0;
            break;
  
        case 'Day 5': // Apply Saturday rate
          this.serviceStaffHourlyRate =  this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Saturday_Hourly_Rate__c || 0;
          //  this.serviceStaffHourlyRate=this.StaffHourlyRates[this.addShiftData.AddShiftStaffValue].staffHoulryRate.Saturday_Hourly_Rate__c || 0;
            break;
  
        default: // For other days, determine by shift type
            switch (this.addShiftData.AddShiftType) {
                case 'General':
                case 'Morning':
                case 'Custom':
                    this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Working_Hours_Rate__c || 0;
                    break;
  
                case 'Night':
                   this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Night_shift_Hourly_Rate__c || 0;
                    break;
  
                case 'Afternoon':
                    this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Afternoon_shift_Hourly_Rate__c || 0;
                    break;
  
                default: // If shift type is not recognized
                   this.serviceStaffHourlyRate=this.StaffHourlyRates[this.ServiceStaffValue].staffHoulryRate.Working_Hours_Rate__c || 0;
                   // console.log('No matching shift type for AddShiftType');
            }
            break;
      }
  
     }

     handleEditShiftScreen(event){
        // this.servicesList=[];
         console.log('shift staff id '+event.currentTarget.dataset.shiftstaffid);
         let participantid=event.currentTarget.dataset.participantid;
        
       
         this.shiftStaffId=event.currentTarget.dataset.shiftstaffid;
         this.openParticipantshiftView=true;
         refreshApex(this.wiredServicesResult);
         this.isEditShiftScreenFlag=true;
         this.isIncludeParticipants=true;
         this.AddShiftIncludePartcipants=true;
         this.AddShiftRecurringCheckboxValue=false;
      
         this.SplitShiftRows=[];
         this.disablePostInsertButtons=true;
         this.disableServiceSection=false;
         /* this.isDisbaleServiceButton=false */
         this.isDisbaleServiceButton = true;
         this.postInsertOperation ==false;
         this.SplitShiftVisible=true;
         this.disableTimeButton=true;
         this.headingLabel='Edit Shift';
         this.emptyFields();
         this.isDisableParticipantCheckBox=false;
        this.isCreateShiftButton=false;
        this.disablePostInsertButtons=true;
        this.participantAddressCheckBox=false;
           getAddShiftDataById({shiftId:this.shiftStaffId}).then(result=>{
              console.log('shift data '+JSON.stringify(result));
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
                AddShiftHoliday:result.shiftwithstaffdata.Public_holiday__c  ,
                AddShiftEnterOtherLocation:result.shiftwithstaffdata.Add_Shift__r.Get_Facility__c  ,
                AddShiftStatus: result.shiftwithstaffdata.Status__c,
                AddShiftParticipantAddressCheckbox:result.shiftwithstaffdata.Add_Shift__r.Participant_Address_checkbox__c
            }
            this.hourlrRateLabel= this.addShiftData.AddShiftType =='Sleepover Shift' ?'Allowance':'Hourly Rate';
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
            
           }else{
             this.showLocation=false;
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
            position: `top: ${mouseY + 10}px; left: ${leftPosition}px;` 
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
      console.log('staff id'+event.currentTarget.dataset.participantid);
      console.log('staff id'+event.currentTarget.dataset.weekdate);
      let shiftDate=event.currentTarget.dataset.weekdate;
      console.log('Shift Date '+shiftDate);
      this.moreShiftlist=[];
      getServicesByDate({participantId:event.currentTarget.dataset.participantid,startDate:shiftDate}).then(result => {
        this.moreShiftlist=result;
      //this.openMoreShiftModal=true; 
      console.log('More shift list'+JSON.stringify(result)); 
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

     handleUpdateShift(){
      this.isShowSpinner=true;
      console.log('service staff '+this.ServiceStaffValue);
     // console.log('addShift staff '+this.addShiftData.AddShiftStaffValue);
     
      this.SplitShiftRows[0].StaffId=this.addShiftData.AddShiftStaffValue;
      this.SplitShiftRows[0].serviceStffaHourlyRate=this.addShiftData.AddShiftStaffHourlyRate;
      this.SplitShiftRows[0].shiftWithStaffId=this.shiftStaffId;
      this.AddShiftIncludePartcipants=this.AddShiftIncludePartcipants==true?true:false;
      this.isEditShiftScreenFlag=true;
      console.log('finalAddShiftData  in service '+JSON.stringify(this.finalAddShiftData));
      console.log('Split shift'+JSON.stringify(this.SplitShiftRows));
      console.log('Include participants '+this.AddShiftIncludePartcipants);
  
      if(this.validateAddress() ){
       /*  getOverlappingShiftsData({strtTimeText:this.addShiftData.AddShiftStartTimeAMPM.toLowerCase(),endTimeText:this.addShiftData.AddShiftEndTimeAMPM.toLowerCase(),StaffID:this.addShiftData.AddShiftStaffValue,startdate:this.addShiftData.AddShiftStartDate,shiftType:this.addShiftData.AddShiftType}).then(result=>{
          console.log('over lapping data '+result);
          if(result==true){
            this.confirMationMessage('Error','The selected staff already has a shift within the start and end times. Please switch to the staff view and assign the services to the particular participant.','Error');
            this.isShowSpinner=false;
          }else{
            
          }
         
         }); */
         this.createfinalSerivce(); 
      }else{
          this.confirMationMessage('Error','Please select Address.','Error');
          this.isShowSpinner=false;
        }
   
  
     }
     HandleServiceEdit(event){
           this.isServiceEdit=true;
           this.serviceEditID=event.currentTarget.dataset.id;
           this.ServiceTypeEditvalue=event.currentTarget.dataset.serviceid;
          // console.log('service partcipant '+event.currentTarget.dataset.serviceid)
           console.log('service name'+event.currentTarget.dataset.servicename)
          let servicesName=event.currentTarget.dataset.servicename
           getClientFunds({clientId :event.currentTarget.dataset.participantid}).then(response=>{
             console.log('funds '+JSON.stringify(response));
             if(response){
              this.serviceEditTotalFund=response;
               this.serviceEditFundOption=response.map(rec=>{
                 return { "label": rec.Registration_Group__c,"value": rec.Id};
               });
                 getNDISServiceLineItem({ServiceItemNames :servicesName,ServiceDate:this.addShiftData.AddShiftStartDate}).then(response=>{
                   this.serviceEditGroupName=response;
                    // console.log('service type '+JSON.stringify(this.serviceEditGroupName));
           
                 }).catch(error=>{
                   
                 })
       
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
         if(servicesName){
           getNDISServiceLineItem({ServiceItemNames :servicesName,ServiceDate:this.addShiftData.AddShiftStartDate}).then(response=>{
             this.serviceEditGroupName=response;
          //  console.log('service type '+JSON.stringify(this.serviceEditGroupName));
           
           })
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
           this.confirMationMessage('Success','Service  has been deleted successfully ','Success');
           refreshApex(this.wiredServicesResult);
           this.ServiceWarningMessage=false;
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
     
      
}