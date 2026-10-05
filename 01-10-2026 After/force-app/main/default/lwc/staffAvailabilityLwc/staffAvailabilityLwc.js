import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import momentJS from "@salesforce/resourceUrl/momentJS";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import Id from '@salesforce/user/Id';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Add_Shift__c';
import INDUSTRY_FIELD from '@salesforce/schema/Add_Shift__c.Role__c';
import getShiftStaff from '@salesforce/apex/AddShiftController.getShiftStaff';
//sowmya
import { refreshApex } from '@salesforce/apex';
import allocationList from '@salesforce/apex/AddShiftController.allocationList';
import getEOIStaff from '@salesforce/apex/AddShiftController.getEOIStaff';
//import getFacilityLocationNames from '@salesforce/apex/AddShiftController.getFacilityLocationNames';
import getShiftList from '@salesforce/apex/AddShiftController.getShiftList';
import getAvailableStaff from '@salesforce/apex/AddShiftController.getAvailableStaff';
import allocateMultipleStaff from '@salesforce/apex/AddShiftController.allocateMultipleStaff';
import LightningConfirm from 'lightning/confirm';
//import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import getFacilityAddress from '@salesforce/apex/AddShiftController.getFacilityAddress';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import sendPushNotification from '@salesforce/apex/mobilePushNotificationController.sendPushNotification';
// praveen
import getClientFunds from '@salesforce/apex/ServiceSupportPlanHandler.getClientFunds';
import getNDISServiceLineItem from '@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem';
import createSupportRecord from '@salesforce/apex/ServiceSupportPlanHandler.createSupportRecord';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import StaffsRolesWiseList from '@salesforce/apex/StaffController.StaffsRolesWiseList';
import getJSONdata from '@salesforce/apex/GeoTaggingfromAWS.getS3JsonData';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import fetchFacilitiess from '@salesforce/apex/ClientSearchController.fetchFacilitiess';
import getSeriveList from '@salesforce/apex/ServiceSupportPlanHandler.getServicesByShift';
import shiftCardRecurringShifts from '@salesforce/apex/AddShiftController.shiftCardRecurringShifts';
import updateShiftStaff from '@salesforce/apex/AddShiftController.updateShiftStaff';
import CreateShiftWithStaff from '@salesforce/apex/AddShiftServicesHandler.CreateShiftWithStaff';
import LEAFLET from '@salesforce/resourceUrl/leaflet';
import { deleteRecord } from 'lightning/uiRecordApi';



const actions = [   
{ label: 'Edit', name: 'edit' }   ,
//{ label: 'Clone', name: 'Clone' }   ,
{label: 'Allocate Staff', name: 'Allocate Staff' } 
];
    
export default class RoasterManagement extends NavigationMixin(LightningElement) { 
    
attendence = My_Resource + '/myResource/images/attendence.svg'; 
groupicon = My_Resource + '/myResource/images/Groupicon.svg';
admin = My_Resource+'/myResource/images/RosterAdmin.png';
// design attributes
@api defaultView; 
@track isAddShift=false;
// navigation
@track startDateUTC; // sending to backend using time
@track endDateUTC; // sending to backend using time
@track formattedStartDate; // Title (Date Range)
@track formattedEndDate; // Title (Date Range)
@track dates = []; // Dates (Header)
@track ShiftIds=[]; //sowmya
@track cloneMsg='';
@track editStaffId;
dateShift = 7; // determines how many days we shift by
@track errorMessage = '';
@track street;
@track city;
@track state;
@track postalCode;
@track country;

@track faciltyId;
@track facilityStreet;
@track facilityCity;
@track facilityCountry;
@track facilityProvince;
@track facilityPostalCode;

@track numberofRecords;
@track facilityName;
@track locationName;
@track editStaff=false;

  
// options
@track datePickerString; // Date Navigation
@track view = {
  // View Select
  options: [
    {
      label: "View by Day",
      value: "1/7"
    },
    /*{
      label: "View by Week",
      value: "7/7"
    }*/
  ],
  slotSize: 1,
  slots: 1
};

// gantt_chart_resource
@track startDate;
@track endDate;
@track projectId;
@track resources = [];
@track records;
@track facilityOptions = [];
@track facilityVal;
@track editflag = false;
@track homeeditFlag=true;
@track selectedRole;
@track selectedAppstatus;
@track value;
@track chosenRole=[]; 
@track daysList =[];
@track recordId;
@track isLocationFieldVisible = true;
@track shiftId;
@track shiftdata;
@track editshift=false;
@track strttime;
@track endtime;
@track shiftdate;
@track availablestaffdata;
@track openStaff=false;
@track lstSelectedRecords=[];
@track draftValues;
@track selectedShiftDate;
@track startTimePickval;
@track endTimePickval;
@track durationinHours;
@track breakTime; 
userId = Id;
userProfileName;
@track spickval;
@track epickval;
@track statusValue = [];
@track facilityValue=[];
@track staffvalue;
@track selectedValuesList=[];
@track disableInput= true;
@track quantityOFshift;
@track unallocatedCount;
@track createdShiftRole;
@track sendNotification;
@track saveButtonDisable = false;
@track onChnageQuantity
@track showSpinner =false;
@track isHome=true;
@track organisationId;

@track shiftDayName;
@track organisationShiftTimes;
@track staffOverallrate ='Hourly Rate';
@track OrgNisationRoles=[];
@track staffList=[];
@track firstname='';
@track lastname='';
@track rolesData=[{}];
@track finaldataWithRoles=[];
wiredStaffs;

@track RolesDatesWisedata=[];
@track isEOI=false;
@track selectedShiftDayName;
@track selectedShifttype;
@track selectedShiftRole;
@track isPopoverVisible = false;
@track StaffDataJSONformat={};
@track staffHoursWagesDispaly=[];
@track showLocation=false;
@track jsonData;
@track mapMarkers = []; 
@track selectedShiftStatus;
@track isShowMap=false;
@track hideLocation=false;
@track listview;
@track emptyShiftPopOver=false;
/* @track activeSection = [];  */
@track activeSections = [];
@track selectedShiftEndDate;
@track NewShiftType;
@track serviceTimeOptions = [];
@track serviceStartTimevalue = '';
@track serviceEndtimeValue = '';
@track  industryFieldApiName ='';
@track numberOfShifts;
@track splitShifts = [];
@track showSpliOverShifts=false;
@track overallViewValue='';
@track shiftNotes;
//@track shiftNotesEdit;
isListening = false; 
showMuteIcon = false; 
showClearIcon = false; 
recognition; 

get isDesktop() {
  return FORM_FACTOR === 'Large';
}

get isMobile() {
  return FORM_FACTOR === 'Small';
}
get options() {
  return [
      { label: 'Accepted', value: 'Accepted' },
      { label: 'In Progress', value: 'InProgress' },
      { label: 'Completed', value: 'Completed' },
  ];
}
get staffOverallrate(){
  return this.staffOverallrate?this.staffOverallrate :'Hourly Rate';
}
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

@track columns = [
  { label: 'Quantity', fieldName: 'Quantity__c' },
  { label: 'Unallocated', fieldName: 'Un_Allocated__c' },
  { label: 'Date', fieldName: 'Start_Date__c', type: 'date', typeAttributes: { month: "2-digit", day: "2-digit", year: "numeric" }},
  { label: 'Start Time - End Time', fieldName: 'Shift_Start_End_Time__c' },
  { label: 'Duration', fieldName: 'Duration__c' },
  { label: 'Shift Type', fieldName: 'Shift_Type__c' },
  { label: 'Role', fieldName: 'Role__c' },
  { label: 'Facility', fieldName: 'Facility_Name__c' },
  { label: 'EOI', fieldName: 'Is_EOI__c' },
  { type: 'action', label: 'Action', initialWidth: 100, typeAttributes: { rowActions: actions }}
];

@track staffcolumns = [
  { label: 'First Name', fieldName: 'Name' },
  { label: 'Last Name', fieldName: 'Last_Name__c' },
  { label: 'Role', fieldName: 'Role__c' },
  { label: 'Facility', fieldName: 'Facility_Name__c' },
  { label: 'Hourly Rate', fieldName: 'Final_Overall_Rate__c', type: 'currency', editable: true },
  { label: 'Shift Duration', fieldName: 'shiftDuration' },
  { label: 'Shift Wages', fieldName: 'ShiftWages', type: 'currency' },
  { label: 'Allocate', fieldName: 'Attandance__c', type: 'boolean', editable: true },
  { label: 'Is Recurring', fieldName: 'Is_Recurring__c', type: 'boolean', editable: true },
  { label: 'Recurring End Date', fieldName: 'Recurring_Till__c', type: 'date', editable: true }
];


@track serviceSupportColumns = [
  { label: 'Staff Name', fieldName: 'Resource_Name__c', initialWidth: 170 },
  { label:'Participant Name',fieldName:'Participant_Name__c',initialWidth: 150},
  { label: 'Service Type', fieldName: 'Service_Type_Name__c', initialWidth: 220, wrapText: true },
  { label: 'Line Item', fieldName: 'Lineitem__c', initialWidth: 140 },
  { label: 'Available Funds', fieldName: 'Available_Fund__c', initialWidth: 150, type: 'currency', cellAttributes: { alignment: 'left' }},
  { label: 'Unit Price', fieldName: 'Unit_Price__c', initialWidth: 120, type: 'currency', cellAttributes: { alignment: 'left' }},
  { label: 'Amount', fieldName: 'Amount__c', initialWidth: 100, type: 'currency', cellAttributes: { alignment: 'left' }},
];


@wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
objectInfo;

@wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: INDUSTRY_FIELD})
IndustryPicklistValues;

@wire(getSeriveList, { shiftStaffId: '$editStaffId' })
wiredServices(response) {
    this.wiredServicesResult = response; // Track the result for refreshApex
    const { data, error } = response;
    if (data) {
        this.servicesList = data; // Assign data to servicesList
       //console.log('Service List '+JSON.stringify(this.servicesList));
    } else if (error) {
        console.error('Error fetching services:', error);
    }
}
  shiftOptions = [
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' }
  ];

  get viewOptions(){
    return  [
    { label: 'Staff View', value: 'Staff View' },
    { label: 'Participant View', value: 'Participant View' }
   ]
}

handleChange1(event) {
        const selectedValues = event.detail.value;

        if (event.target.name === 'progress') {
          // Update chosen roles with selected values from the checkbox group
          this.chosenRole = [...selectedValues];
        } else if (event.target.name === 'Facility') {
          // Update selected facilities with selected values from the checkbox group
          this.facilityValue = [...selectedValues];
        }
        // Log the updated values
        localStorage.setItem('rosterRoles', JSON.stringify(this.chosenRole));
        localStorage.setItem('rosterFacilities', JSON.stringify(this.facilityValue));
        console.log('Selected Roles:', JSON.stringify(this.chosenRole));
        console.log('Selected Facilities:', JSON.stringify(this.facilityValue));
       
        // Perform additional operations
        this.setDateHeaders();

  // Enable or disable input based on role selection
  if (this.chosenRole.length > 0) {
      this.disableInput = false;
  } else {
      this.disableInput = true;
  }
}

handleStaffChange(event){
    if(event.target.name =='searchStaff'){
   // console.log('event name ==>'+event.target.name);
    this.staffvalue= event.detail.value;
  }else if(event.target.name =='searchStatus'){
   // console.log('event name ==>'+event.target.name);
    this.statusValue=event.detail.value;
  }
 // console.log('staff ==>'+  this.staffvalue);
 // console.log('status ==>'+  this.statusValue);

}
/* handleParticipantViewchange(event) {
  if(event.target.dataset.name=='staffView'){
      this.cardFlag=false;
      this.listFlag=true;
      this.overallViewValue='Staff View';
  }else  if(event.target.dataset.name=='participantView'){
      this.cardFlag=true;
      this.listFlag=false;
      this.overallViewValue='Participant View';
  }
  console.log('staff ==>'+  this.overallViewValue);
      this.setDateHeaders();
 
} */

handleSearch(){
 this.showSpinner=true;
 /* setTimeout(() => {
  this.showSpinner=false;
},1800) */
  this.setDateHeaders();
}

connectedCallback() {
  getFacilityData().then(response => {
     // console.log('facility and Org response '+JSON.stringify(response));
      this.organisationShiftTimes=response[0].Organisation__r;
     // console.log(' orgShiftTimes'+JSON.stringify(this.organisationShiftTimes));
      this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }))
      this.facilityValue.push(this.facilityOptions[0].value) ;

  }).catch(err => {
   // console.log(err);
  }); 
  organizationDetails().then(response => {
    let orgId = response.listofPriceBook.Id;
    this.organisationId = orgId;  
    console.log('organisation id:'+this.organisationId); 
   
   let orgRoles= response.listofPriceBook.Roles__c;
   //console.log('listofPriceBook:', response.listofPriceBook);
   this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
    this.activeSections.push(rec);
    return {
      value: rec,
      label: rec
    };
  });
    this.chosenRole.push( this.OrgNisationRoles[0].value);
    
    console.log('activesections '+ JSON.stringify(this.activeSections));
  //console.log('org roles '+ JSON.stringify(this.OrgNisationRoles));
    
    this.disableInput = false; 
  });

  Promise.all([
    loadScript(this, momentJS),getFacilityData(), organizationDetails()
  ]).then(() => {
    const storedRoles = localStorage.getItem('rosterRoles');
  if (storedRoles) {
      this.chosenRole = JSON.parse(storedRoles); 
      
  }
  const storedFacilities = localStorage.getItem('rosterFacilities');
  if (storedFacilities) {
      this.facilityValue = JSON.parse(storedFacilities);  
  }

    this.defaultView = 'View by Day';
    switch (this.defaultView) {
      case "View by Week":
        this.setView("7/7");
        break;
      default:
        this.setView("1/7");
    }
    this.setStartDate(new Date());
  });  
 
  this.EmptyAddressFields();

  this.template.addEventListener('focusin', (event) => {
            if (event.target.closest('.custom-field-wrapper')) {
                this.handleFocus(event);
            }
        });
}


/*** Navigation ***/
setStartDate(_startDate) {

 
  this.dates=[];
  this.RolesDatesWisedata=[];
  this.daysList = { shiftdata: [], staffdata: [] };
  if (_startDate instanceof Date && !isNaN(_startDate)) {   
    this.datePickerString = _startDate.toISOString();
    this.startDate = moment(_startDate)
      .day(1)
      .toDate();
    this.startDateUTC =
      moment(this.startDate)
        .utc()
        .valueOf() -
      moment(this.startDate).utcOffset() * 60 * 1000 +
      "";
    this.formattedStartDate = this.startDate.toLocaleDateString();

    this.setDateHeaders();
  } else {
    this.dispatchEvent(
      new ShowToastEvent({
        message: "Invalid Date",
        variant: "error"
      })
    );
  }
}

setDateHeaders() {
  // Compute end date based on view settings
  console.log('facility list '+this.facilityValue);
  console.log('role  list '+this.chosenRole);

  StaffsRolesWiseList( { orgId: this.organisationId,facIdlist:this.facilityValue, roles: this.chosenRole}).then(response=> {
   // this.staffList = response;
   //console.log('staff list '+JSON.stringify(response))
    response.forEach(rec=>{
      this.StaffDataJSONformat[rec.Id] = { "StaffDetails": { "firstname":rec.Name,"lastname":rec.Last_Name__c,"picture":rec.picture__c,"sethours":rec.Set_Hours__c,"CompletedHours":0.0,"earnedMoney": 0.0,"Role":rec.Role__c}};
    });
    this.staffHoursWagesDispaly=[];
  
  });

  this.showSpinner=true;
  this.dates=[];
  this.RolesDatesWisedata=[];
  this.StaffDataJSONformat={};
  this.endDate = moment(this.startDate)
    .add(this.view.slots * this.view.slotSize - 1, "days")
    .toDate();
  
  this.endDateUTC = moment(this.endDate).utc().valueOf() - moment(this.endDate).utcOffset() * 60 * 1000 + "";
  this.formattedEndDate = this.endDate.toLocaleDateString();

  // Define day names and initialize today's date
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  today = today.getTime();

  // Initialize dates object
  let dates = {};

  // Loop through dates and set up structure
  for (let date = moment(this.startDate); date <= moment(this.endDate); date.add(this.view.slotSize, "days")) {
    let index = date.format("YYYYMM");
    if (!dates[index]) {
      dates[index] = {
        dayName: '',
        name: date.format("MMMM"),
        days: [],
      };
    }

    let day = {
      class: "slds-col slds-p-vertical_x-small lwc-timeline_day",
      label: date.format("YYYY-MM-DD"),
      label1: date.format("DD/MM/YYYY"),
      label2: date.format("DD-MM-YY"),   
      start: date.toDate(),
      
    };

    if (this.view.slotSize > 1) {
      let end = moment(date).add(this.view.slotSize - 1, "days");
      day.end = end.toDate();
    } else {
      day.end = date.toDate();
      day.dayName = date.format("ddd");
      if (date.day() === 0) {
        day.class += " lwc-is-week-end";
      }
    }

    if (today >= day.start && today <= day.end) {
      day.class += " lwc-is-today";
    }

    dates[index].days.push(day);
    dates[index].style = `width: calc(${dates[index].days.length}/${this.view.slots} * 100%)`;
  }
  
 
  // Reorder dates
      this.dates = Object.values(dates);
      console.log('this.dates 0', JSON.stringify(this.dates));
      console.log('choosen role '+this.chosenRole)

      this.dates.forEach(month => {
        month.days.forEach(day => {
            // For each day, add roles with initial structure
            this.chosenRole.forEach(role => {
                day[role] = {
                    RolewiseShifts: [],
                    RolewiseStaff: [],
                    Quantity: 0,
                    Allocated:0,
                    UnAllocated:0,
                };
            });
        });
    });
      
   console.log('this.dates 1', JSON.stringify(this.dates));
    //console.log('choosen role in set '+this.chosenRole);
    allocationList({roles: this.chosenRole,startDate: new Date(this.startDate).toLocaleDateString('en-CA'),endDate: new Date(this.endDate).toLocaleDateString('en-CA'),facilities: this.facilityValue }).then(response => {
      //console.log('add shifts length'+response.length);
      //console.log(' add shift response '+JSON.stringify(response));
        this.ShiftIds=[];
            this.dates.forEach((record1) => {        
              let daysList = record1.days;
              for (var i = 0; i < daysList.length; i++) {    
                for (var j = 0; j < response.length; j++) {      
                  if (daysList[i].label === response[j].Start_Date__c) {
                    // Ensure Role__c and dayshift are defined in response
                    if(response[j].Role__c && daysList[i][response[j].Role__c]) {
                      this.ShiftIds.push(response[j].Id);
                      daysList[i][response[j].Role__c].RolewiseShifts.push(response[j]);
                      daysList[i][response[j].Role__c].Quantity +=response[j].Quantity__c;
                      daysList[i][response[j].Role__c].Allocated +=response[j].Allocated__c;
                      daysList[i][response[j].Role__c].UnAllocated +=response[j].Un_Allocated__c;
                    }
                  }        
                }       
              }
          });
          this.GetShiftStaffDetails();
         /*  setTimeout(() => {
           
          },600)
          */
  }) 
}

//praveen
GetShiftStaffDetails(){
  this.RolesDatesWisedata=[];
  this.staffHoursWagesDispaly=[];
  //console.log('shift id list'+ JSON.stringify(this.ShiftIds))
 // console.log('Complete staff earnings and hours '+JSON.stringify(this.StaffDataJSONformat));
    getShiftStaff({ShiftIds:this.ShiftIds,staff:this.staffvalue,statusList:this.statusValue}).then(response => { 
         
   this.dates.forEach((record1) => {     
    let daysList = record1.days;       
      for(var j=0;j<daysList.length;j++){ 
       // this.daysList[j].staffdata = [];   /// line added by praveen     
          for(var i=0;i<response.length;i++){ 
            if((daysList[j].label === response[i].Add_Shift__r.Start_Date__c && response[i].Add_Shift__r.Role__c ) ){  
            
              if (daysList[j][response[i].Add_Shift__r.Role__c]) {
               
                  let daystaff= {};             
                  daystaff.shiftType=response[i].Shift_Type__c;
                  daystaff.availability=response[i].Attendence__c;
                  daystaff.visible=true;
                  daystaff.Id=response[i].Id;
                  daystaff.location=response[i].Add_Shift__r.Role__c;
                  daystaff.staff=response[i].Staff__r.Name +' '+ response[i].Staff__r.Last_Name__c;
                  //daystaff.staff=response[i].Full_Name__c;
                  daystaff.starttime=response[i].start_time__c;
                  daystaff.endtime=response[i].End_Time__c;
                  daystaff.time=response[i].Add_Shift__r.Shift_Start_End_Time__c;
                  daystaff.startdt=response[i].Add_Shift__r.Start_Date__c;
                  daystaff.facName=response[i].Facility__c;
                  daystaff.locName=response[i].Add_Shift__r.Location__Street__s; 
                  daystaff.status=response[i].Status__c;
                  daystaff.state=response[i].State__c;
                  daystaff.shiftCreatedTime=response[i].Start_time_Formula__c;
                  daystaff.shiftEndTime=response[i].End_time_formula__c;
                  daystaff.shiftDuartion=response[i].Duration__c;
                  daystaff.staffID=response[i].Staff__c;
                  daystaff.staffHoulryrate=response[i].Staff_Final_Hourly_Rate__c;
                  daystaff.uiStatus=this.convertStatus(response[i].Status__c);
                  daystaff.parentId=response[i].Add_Shift__c;
                  daystaff.parentShiftType=response[i].Add_Shift__r.Shift_Type__c;
                  daystaff.parentShiftUnallocated=response[i].Add_Shift__r.Un_Allocated__c;
                  daystaff.parentdayname=response[i].Add_Shift__r.Day_Name__c; 
                  daystaff.parentShiftEOI=response[i].Add_Shift__r.Is_EOI__c;
                  daystaff.shiftEndDate=response[i].End_Date__c;
                  daystaff.cardcolor=response[i].Shiftcolor__c;
                  daystaff.isDeleteIcon=response[i].Status__c =='Accepted' ? true:false ;
                  daystaff.splitShifts=response[i].Add_Shift__r.Split_Shifts__c;
                  if (response[i].Staff__c) {
                    let staffId = response[i].Staff__c;  
                    // Check if StaffDataJSONformat[staffId] and StaffDetails exist
                    if (this.StaffDataJSONformat[staffId] && this.StaffDataJSONformat[staffId].StaffDetails) {
                      let staffDetails = this.StaffDataJSONformat[staffId].StaffDetails;
                  
                      // Update earnedMoney if Shift_Wage__c is available
                      if (response[i].Shift_Wage__c != null && response[i].Shift_Wage__c != undefined && response[i].Shift_Wage__c != '') {
                        staffDetails.earnedMoney = parseFloat(staffDetails.earnedMoney) + parseFloat(response[i].Shift_Wage__c);
                      }
                  
                      // Update CompletedHours if Duration__c is available
                      if (response[i].Duration__c && response[i].Duration__c != undefined && response[i].Duration__c != '') {
                        staffDetails.CompletedHours = parseFloat(staffDetails.CompletedHours) + parseFloat(response[i].Duration__c);
                      }
                  
                      // Ensure that earnedMoney is formatted to two decimal places
                      staffDetails.earnedMoney = parseFloat(staffDetails.earnedMoney).toFixed(2);
                  
                      // Update StaffDataJSONformat
                      this.StaffDataJSONformat[staffId].StaffDetails = staffDetails;
                    }
                  }
                
                  daysList[j][response[i].Add_Shift__r.Role__c].RolewiseStaff.push(daystaff);
                }
                 
            } 
          
          }
        } 

      })
   //  console.log('this.dates2', JSON.stringify(this.dates));
     this.RolesDatesWisedata=this.transformDataByRoles(this.dates)
     // console.log('this.dates final', JSON.stringify(this.RolesDatesWisedata));
      this.staffHoursWagesDispaly=Object.keys(this.StaffDataJSONformat).map(key => {
          return {
              id: key,
              details: this.StaffDataJSONformat[key].StaffDetails
          };
        });
        //console.log('Complete staff earnings and hours '+JSON.stringify(this.staffHoursWagesDispaly));
    })
     setTimeout(() => {
      this.showSpinner=false; 
    },800) 
   
}
 transformDataByRoles(daysArray) {
  let roleData = {};
  // Loop through each day's data
  daysArray.forEach(day => {
      day.days.forEach(dayEntry => {
          Object.keys(dayEntry).forEach(role => {
              // Ensure role data structure exists
              if (typeof dayEntry[role] === 'object' && dayEntry[role].RolewiseStaff !== undefined) {
                  if (!roleData[role]) {
                      roleData[role] = [];
                  }
                  // Push role data for each day
                  roleData[role].push({
                      date: dayEntry.label,
                      date1:dayEntry.label1,
                      RolewiseStaff: dayEntry[role].RolewiseStaff,
                      Quantity: dayEntry[role].Quantity,
                      Allocated: dayEntry[role].Allocated,
                      UnAllocated: dayEntry[role].UnAllocated
                  });
              }
          });
      });
  });

  // Convert roleData object to an array
  return Object.keys(roleData).map(role => ({
      roleName: role,
      days: roleData[role]
  }));
}

HandleShiftType(event){

  this.startTimePickval='';
  this.endTimePickval='';
    if(event.detail.value=='Morning'){
      this.startTimePickval=this.organisationShiftTimes.Morning_Shift_Start_Time__c;
      this.endTimePickval=this.organisationShiftTimes.Morning_Shift_End_Time__c;
      this.selectedShiftEndDate=this.selectedShiftDate;
    }
    if(event.detail.value=='Afternoon'){
      this.startTimePickval=this.organisationShiftTimes.Afternoon_Shift_Start_Time__c;
      this.endTimePickval=this.organisationShiftTimes.Afternoon_Shift_End_Time__c;
      this.selectedShiftEndDate=this.selectedShiftDate;
    }
    if(event.detail.value=='Night'){
      this.startTimePickval=this.organisationShiftTimes.Night_Shift_Start_Time__c;
      this.endTimePickval=this.organisationShiftTimes.Night_Shift_End_Time__c;

    let dateObj = new Date(this.selectedShiftDate);
    dateObj.setDate(dateObj.getDate() + 1);
        // Convert the Date object back to "YYYY-MM-DD" format
    this.selectedShiftEndDate= dateObj.toISOString().split("T")[0];
    
    }
    if(event.detail.value=='General'){
      this.startTimePickval=this.organisationShiftTimes.General_Shift_Start_Time__c;
      this.endTimePickval=this.organisationShiftTimes.General_Shift_End_time__c;
      this.selectedShiftEndDate=this.selectedShiftDate;
    }
    if(event.detail.value=='Custom'){
      this.startTimePickval=this.organisationShiftTimes.Custom_Shift_Start_Time__c;
      this.endTimePickval=this.organisationShiftTimes.Custom_Shift_End_Time__c;
      this.selectedShiftEndDate=this.selectedShiftDate;
    }
   // console.log('end date '+this.selectedShiftEndDate);
    this.NewShiftType=event.detail.value;
}

addresschange(event){
    
    if (!event.detail.street || !event.detail.city || !event.detail.postalCode || !event.detail.province) {
      this.errorMessage = 'Please provide complete address information.';
      this.saveButtonDisable = true;
  }
else{
  this.errorMessage = '';
  this.saveButtonDisable = false;
 // console.log('event detail'+JSON.stringify(event.detail)); 
  this.facilityStreet=event.detail.street;
  this.facilityCity=event.detail.city;
  this.facilityPostalCode=event.detail.postalCode;
  this.facilityProvince=event.detail.province;
  this.facilityCountry=event.detail.country;

}
    
}

navigateToToday() {
  this.allDayList=[];
  this.setStartDate(new Date());    
} 

navigateToPrevious() {   
  this.allDayList=[];
  let _startDate = new Date(this.datePickerString);  
  _startDate.setDate(_startDate.getDate() - this.dateShift);
  this.setStartDate(_startDate);    
}

navigateToNext() { 
  this.allDayList=[];
  let _startDate = new Date(this.datePickerString);  
  _startDate.setDate(_startDate.getDate() + this.dateShift);
  this.setStartDate(_startDate);    
}

navigateToDay(event) {
  this.allDayList=[];
  this.setStartDate(new Date(event.target.value));    
}

setView(value) {
  let values = value.split("/");
  this.view.value = value;
  this.view.slotSize = parseInt(value[0], 10);
  this.view.slots = parseInt(values[1], 10);
}

handleViewChange(event) {
  this.allDayList=[];
  this.setView(event.target.value);
  this.setDateHeaders();
} 

openAddShift(event){   
  this.startTimePickval='';
  this.endTimePickval='';
  this.createdShiftRole='';
  this.shiftNotes = '';
  this.showMuteIcon = false;
  this.showClearIcon = false;

    switch (event.currentTarget.dataset.dayname) {
      case 'Sun':
        this.shiftDayName = "Sunday";
        break;
      case 'Mon':
        this.shiftDayName = "Monday";
        break;
      case 'Tue':
        this.shiftDayName = "Tuesday";
        break;
      case 'Wed':
        this.shiftDayName = "Wednesday";
        break;
      case 'Thu':
        this.shiftDayName = "Thursday";
        break;
      case 'Fri':
        this.shiftDayName = "Friday";
        break;
      case 'Sat':
        this.shiftDayName = "Saturday";
    }
  
  let currentDate= event.currentTarget.dataset.id;
  this.selectedShiftDate =currentDate;
  //this.selectedShiftEndDate=currentDate // //added by praveen
 // console.log('currentDate>>>>',currentDate);
  this.isAddShift=true;
  this.editshift=false;
  this.isHome=false;
  this.selectedShiftRole='';
  this.draggedStaffId='';
  this.eoiInDragAndDrop=false;
  this.draggedStaffRole='';
  this.EmptyAddressFields();  
}

EmptyAddressFields(){
  this.facilityStreet = '';
  this.facilityCity = '';
  this.facilityCountry = '';
  this.facilityProvince = '';
  this.facilityPostalCode = '';
}

closeModal(){
  this.isAddShift=false;
  this.editshift=false;
  this.editStaff=false;
  this.isHome=true;
  this.splitShiftNotification=false;
  this.emptyServiceFields();
  this.showMuteIcon = false;
  if (this.recognition) {
    this.recognition.stop(); // Stop any ongoing recognition process
    this.recognition = null; // Clear recognition instance
    }
}

handleFacilityChange(event) {
 // console.log('Event:', event);
  const selectedFacilityId = event.detail.value;
  this.faciltyId=selectedFacilityId.toString(); 

  if (!this.IsGetFacility && this.faciltyId)  {
   // console.log('Entering the if condition.')
    getFacilityAddress({ facilityId:this.faciltyId })
    .then((result) => {
      if (result && result.length > 0) {
       // console.log('Result from Apex:', result);
        const facility = result[0];
       // console.log('Facility:', facility);
        this.facilityStreet = facility.Address__Street__s;
        this.facilityCity = facility.Address__City__s;
        if (facility.Address__CountryCode__s == "AU")
        {
          this.facilityCountry = "Australia";
        }
        //this.facilityCountry = facility.Address__CountryCode__s;
        this.facilityProvince = facility.Address__StateCode__s;
        this.facilityPostalCode = facility.Address__PostalCode__s;

       // console.log("facilityCountry Code: >>>> " + facility.Address__CountryCode__s);
       // console.log("facilityStreet Code: >>>> " + facility.Address__Street__s);
       // console.log("State Code: >>>> " + facility.Address__StateCode__s);
       // console.log("PostalCode Code: >>>> " + facility.Address__PostalCode__s);

      }
    })
    .catch((error) => {
      alert('Error fetching facility address: ' + JSON.stringify(error));
    });
  }
else {
    // Set the address fields to empty
    this.EmptyAddressFields();
  }
}

handleCheckboxChange(event) {
 // console.log('in chkbpx');
    if (event.detail.checked)  {
      this.IsGetFacility=true;
        if (this.IsGetFacility) {
          this.EmptyAddressFields();
      }  
    }else{
      this.IsGetFacility=false;
      if(!this.IsGetFacility){
        this.handleFacilityChange({ detail: { value: this.faciltyId } });
      }
    }      
}
handleRoleChange(event){
  if(event.target.name=='role'){
    this.createdShiftRole=event.target.value;
  }
  if(event.target.name=='sendNotification'){
    this.sendNotification=event.target.value;
  }
  if(event.target.name=='quantityChange'){
   // console.log('qunatity==> '+this.quantityOFshift);
   // console.log('qunatity change value==> '+event.target.value);
    this.onChnageQuantity=event.target.value;
  }

}

//end
handleSuccess(event) {
  this.setDateHeaders();   
  const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Changes Saved Successfully",
      variant: "success"
  });
  this.dispatchEvent(toastEvent);
  // new method added by praveen for mobile push notification
  if(this.sendNotification){
      sendPushNotification({role:this.createdShiftRole,strdate:this.selectedShiftDate}).then(response=>{
    });
  }
  this.isAddShift=false;
  this.editflag=false;   
  this.editStaff=false;
  this.editshift=false;
  let displayData=[];
  this.isHome=true;
  this.selectedShiftRole='';
  this.showcardPopOver=false;
  let fields = event.detail.fields;
  let successShiftID=event.detail.id;
  //console.log('fields in success '+JSON.stringify(fields));
  
  if(this.draggedStaffId !=null && this.draggedStaffId !=undefined && this.draggedStaffId !='') {
    setTimeout(() => {
      
      this.emptyShiftPopOver=true;
      this.selctedShiftType=fields.Shift_Type__c.value;
      this.selctdshiftcardDayname=fields.Day_Name__c.value;
      this.selctedCardShiftDate=fields.Start_Date__c.value;
      this.selectedCardShiftID=successShiftID;
      console.log('success id '+ this.selectedCardShiftID);
     }, 2000);
  
  }
  
}

handleSubmit(event){
  
  if (this.facilityStreet &&   this.facilityStreet &&  this.facilityCity && this.facilityPostalCode ) {
         // console.log('in submit');
          event.preventDefault();// stop the form from submitting
          const fields = event.detail.fields;
        // alert(JSON.stringify(fields));
          fields.Location__Street__s = this.facilityStreet;
          fields.Location__City__s =  this.facilityCity;
          fields.Location__StateCode__s = this.facilityProvince;
          fields.Location__CountryCode__s = 'AU';
          fields.Location__PostalCode__s = this.facilityPostalCode;
         // console.log('After fields>>'+JSON.stringify(fields));
          fields.Start_Date__c = this.selectedShiftDate;
          fields.End_Date__c = this.selectedShiftEndDate; //added by praveen
          fields.Start_Time__c=this.spickval;
          fields.End_Time__c=this.epickval;
          fields.Day_Name__c=this.shiftDayName;  
          fields.Break__c = this.breakTime.toString();   
          //fields.Break__c	= toString(this.breakTime);
          fields.Duration__c = this.durationinHours;
          fields.Role__c = this.createdShiftRole;
         // console.log('After fields>>'+JSON.stringify(fields));
          this.template.querySelector('lightning-record-edit-form').submit(fields);
    }else{
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'Please provide complete address information.',
          variant: 'Error'
        })
        );
        event.preventDefault();  
      }
      
  }

handleSubmitEdit(event){
  if( !this.facilityStreet &&   !this.facilityStreet &&  !this.facilityCity && !this.facilityPostalCode ){
    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Error',
        message: 'Please provide complete address information.',
        variant: 'Error'
      })
      );  
      event.preventDefault();  
    }else if( this.onChnageQuantity <this.quantityOFshift || this.onChnageQuantity==0 ){
            this.dispatchEvent(
              new ShowToastEvent({
                title: 'Error',
                message: 'The quantity should not be empty or less than the original quantity.',
                variant: 'Error'
              })
              );  
              event.preventDefault();  
    }else{
     // console.log('in submit edit');
      event.preventDefault();// stop the form from submitting
        const fields = event.detail.fields;
        // alert(JSON.stringify(fields));
          fields.Location__Street__s = this.facilityStreet;
          fields.Location__City__s =  this.facilityCity;
          fields.Location__StateCode__s = this.facilityProvince;
          fields.Location__CountryCode__s = 'AU';
          fields.Location__PostalCode__s = this.facilityPostalCode;
         // console.log('After fields>>'+JSON.stringify(fields));
          fields.Start_Date__c = this.selectedShiftDate;
          fields.End_Date__c = this.selectedShiftEndDate; //added by praveen
          fields.Day_Name__c=this.shiftDayName;  
          fields.Start_Time__c=this.spickval;
          fields.End_Time__c=this.epickval;
          fields.Break__c	= this.breakTime.toString();
          fields.Duration__c = this.durationinHours;
         // console.log('After fields in edit>>'+JSON.stringify(fields));
      //  this.template.querySelector('lightning-record-edit-form').submit(fields);  
      this.template.querySelector('lightning-record-edit-form[data-recid="Edit"]').submit(fields); 
    }
  
}

handleEditShift(event) {
  this.editflag=true;
  this.isHome=false;
  this.draggedStaffId='';
  this.eoiInDragAndDrop=false;
  this.draggedStaffRole='';
  console.log('choosen role in Quantity '+event.currentTarget.dataset.rolename)   
  getShiftList({role: event.currentTarget.dataset.rolename,startDate:event.currentTarget.dataset.id}).then(response => {      
    this.shiftdata=response;
     //console.log('SHiftdata ???'+JSON.stringify(this.shiftdata));
    }).catch(error=>{
      console.log('erorr '+JSON.stringify(erorr));
    });
  
  this.recordId = facId;
}

hideModalBox(){
  this.availablestaffdata=[];
  this.editflag=false;
  this.openStaff=false;
  this.isHome=true;
}

handleRowActions(event){  
  this.showMuteIcon = false;
  this.showClearIcon = false;  
 // this.showClearIcon = this.shiftNotes.length > 0;
  const actionName = event.detail.action.name;
  const row = event.detail.row;
  //console.log('Row   '+JSON.stringify(row));
 // console.log('Row Id  '+row.Id);
  this.IsGetFacility=row.Get_Facility__c;
  this.facilityStreet = row.Location__Street__s;
  this.facilityCity = row.Location__City__s;
  this.selectedShiftDate=row.Start_Date__c; 
  this.startTimePickval=row.Start_time_picklist__c;
  this.endTimePickval=row.End_time_picklist__c;
  this.selectedShifttype=row.Shift_Type__c;
  this.selectedShiftDayName=row.Day_Name__c;

  console.log('selected Shift type '+this.selectedShifttype);
  console.log('selected Shift day name '+this.selectedShiftDayName);
  //this.selectedShiftEndDate=row.End_Date__c; //added by praveen
  this.breakTime=row.Break__c;
  this.durationinHours=row.Duration__c;
  this.isEOI=row.Is_EOI__c;
 // console.log('selected date ====>'+ this.selectedShiftDate);
 // console.log('selected start time ====>'+ this.startTimePickval);
 // console.log('selected end time  ====>'+ this.endTimePickval);
 // console.log('selected break  time  ====>'+ this.breakTime);
  console.log('selected duration time  ====>'+ this.durationinHours);
 // console.log('selected shift quantity'+row.Quantity__c);
  this.quantityOFshift=row.Quantity__c;
  this.unallocatedCount=row.Un_Allocated__c;
 // console.log('selected shift un allocated'+row.Un_Allocated__c);

  if (row.Location__CountryCode__s == "AU")
  {
    this.facilityCountry = "Australia";
  }
  //this.facilityCountry = row.Location__CountryCode__s;
  this.facilityProvince = row.Location__StateCode__s;
  this.facilityPostalCode = row.Location__PostalCode__s;
 // console.log('selected row ====>'+JSON.stringify(row.Id));
  this.shiftId=row.Id;
  this.strttime=row.Start_Time__c;
  this.endtime=row.End_Time__c;
  this.shiftdate=row.Start_Date__c;
  this.facilityName = row.Facility_Name__c;  
  //this.locationName = row.Location__Street__s; 
  this.shiftNotes=row.Shift_Notes__c;  
  this.selectedShiftRole=(row.Role__c);
  switch (actionName) {        
      case 'edit':
          this.isAddShift=false;
          this.editshift=true;
          this.isHome=false;
          this.editStaff=false;
          this.openStaff=false;
          this.editflag=false;
          break;   
      //case 'Clone':
        //this.handleClone(row.Id);
        //break;
      case 'Allocate Staff':  
      this.totalWages=0;   
        this.handleAddStaff();   
        break;
  }

}
@track eoiShifstaff=[];

handleEOIStaff(){   //this.chosenRole 
  getEOIStaff({Role:this.selectedShiftRole,shiftId:this.shiftId}).then(response => {   //this.selectedShiftRole 
    this.availablestaffdata=this.getAavilabledataWithrates(response)
  console.log('avaliable  eoi staff data '+JSON.stringify(this.availablestaffdata));
  
  this.availablestaffdata.forEach(ss=>{      
    this.eoiShifstaff=ss.ShiftwithStaffs__r;
    })  
   
  })
}

handleAddStaff(){
  this.openStaff=true;
  this.editflag=false;
  this.isHome=false;
  if(this.isEOI==true){
    this.handleEOIStaff(); 
  }else{
    this.displayAvailableStaff();   
  }
  
  
}

handleEditStaff(event){  
  this.emptyServiceFields(); 
  this.editStaffId=event.currentTarget.dataset.id;   
  this.editStaff=true;
  refreshApex(this.wiredServicesResult);
 
  this.isHome=false;
 // this.stateValue=event.currentTarget.dataset.state;
  this.shiftcreatedtime=event.currentTarget.dataset.shiftcreatedtime.toLowerCase();
  this.shiftendtime=event.currentTarget.dataset.shiftendtime.toLowerCase();
  console.log('start time '+this.shiftcreatedtime);
  console.log('start time '+this.shiftendtime);

  this.shiftduartion=event.currentTarget.dataset.shiftduartion;
  this.shiftCreatedDate=event.currentTarget.dataset.shiftdate;
  this.shiftStaffID=event.currentTarget.dataset.staffid;
  this.handleServiceStaffId=event.currentTarget.dataset.staffid;
  this.selectedShiftStatus=event.currentTarget.dataset.status;
  this.selectedCardShiftID=event.currentTarget.dataset.shiftid;
  this.RecurrStaffHourlyRate=parseFloat(event.currentTarget.dataset.staffhoulryrate);
  this.selctedShiftType=event.currentTarget.dataset.shifttype;
  this.selctdshiftcardDayname=event.currentTarget.dataset.shiftdayname;
  this.shiftCardEnddate=event.currentTarget.dataset.shiftenddate;
  const isSplitShift = event.currentTarget.dataset.splitshift === 'true';
  this.splitCheckbox=isSplitShift;
  const isStatusAccepted = event.currentTarget.dataset.status === 'Accepted';

  this.disableSplitCheckBox = isSplitShift || !isStatusAccepted;
  this.disableAllserviceSection= !isStatusAccepted ;
  this.serviceStaffDisable=!isStatusAccepted;
  console.log('shift card end date '+this.shiftCardEnddate);
  this.serviceType=false;
  this.serviceGroupName=[];
  this.NdisServiceGroupName=false;
  this.servicePlan=false;
  this.mapMarkers=[];
  this.isShowMap=false;
  this.hideLocation=false;
  this.includeParticipants=false;
  this.reCurringStaffChecked=false;
  this.shiftRecurrEndDate='';
  this.ShowOnlyRecurrStaffSubmit=false;
  this.ShowParticipnatRecurSubmit=false;
  this.isSplitShiftnumberDisable=true;
  this.NdisServiceGroupNameinEdit=false;
  this.splitShiftNotification=false;
  //console.log('spli shift '+typeof(this.splitCheckbox));
  console.log('spli shifts  Disable'+this.disableSplitCheckBox  );

        if( this.selectedShiftStatus=='InProgress' ||  this.selectedShiftStatus=='Completed' ){
          this.showLocation=true;
        }else{
          this.showLocation=false;
        }
        this.handleLinkParticipants();
        StaffsRolesWiseList({ orgId: this.organisationId, facIdlist: [], roles: [] }).then(response => {
         // console.log('Staff Roles List Response: ', response);
          if (response && response.length > 0) {
            this.ServiceStaffList = response.map(rec => {
              this.serviceStaffHoulryRate[rec.Id] = { "staffHoulryRate": rec };
              return {
                label: rec.NameToDisplay__c,
                value: rec.Id
              };
            });
           
            this.hourlyRateCalculations();
          } else {
            console.log('No staff data returned');
          }
        }).catch(error => {
          console.error('Error fetching staff roles: ', JSON.stringify(error));
        });
        this.splitShifts=[];
        this.shiftOptions = [
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
          { label: '6', value: '6' }
        ];
       
     let temp={"addShiftId":this.selectedCardShiftID,"startTime":this.shiftcreatedtime,"endTime":this.shiftendtime,"startDate":this.shiftCreatedDate,"endDate":this.shiftCardEnddate};
       this.splitShifts.push(temp);
       console.log('split shifts '+ JSON.stringify(this.splitShifts));

        
  }
  HandleServiceStaffChange(event){
    console.log('event detail staff '+event.detail.value);
   // this.shiftStaffID=event.detail.value; 
   this.handleServiceStaffId=event.detail.value;
   // console.log('Staff List: ', JSON.stringify(this.serviceStaffHoulryRate));
   this.hourlyRateCalculations();
   this.isStaffChangedInService=true;
   
  }
  handleGroupShiftStaff(event){
    this.editStaffId=event.currentTarget.dataset.id; 
    console.log('shift Id'+this.editStaffId)
    refreshApex(this.wiredServicesResult);
    setTimeout(() => {
   
      //this.groupOfListOfStaff=this.servicesList.
      this.groupOfListOfStaff= Array.from(
        new Map(this.servicesList.map(item => [item.Service_Users__c, item])).values()
        );
       // console.log('servList'+JSON.stringify(this.groupOfListOfStaff));
      this.GroupedStaff=true;
      if(this.servicesList.length>0){
        this.ShowGroupOfStaff=true;
      }else{
         this.ShowGroupOfStaff=false;
      }
     
     }, 1000);
  
  }

  hourlyRateCalculations(){
    if (this.selctdshiftcardDayname === 'Saturday') {
      this.finalhourlyRate = this.serviceStaffHoulryRate[this.handleServiceStaffId].staffHoulryRate.Saturday_Hourly_Rate__c || 0;
    } else if (this.selctdshiftcardDayname === 'Sunday') {
      this.finalhourlyRate = this.serviceStaffHoulryRate[this.handleServiceStaffId].staffHoulryRate.Sunday_Hourly_Rate__c || 0;
    } else if (this.selctedShiftType === 'General' || this.selctedShiftType === 'Morning' || this.selctedShiftType === 'Custom') {
     
      this.finalhourlyRate = this.serviceStaffHoulryRate[this.handleServiceStaffId].staffHoulryRate.Working_Hours_Rate__c || 0;
    } else if (this.selctedShiftType === 'Night') {
      this.finalhourlyRate = this.serviceStaffHoulryRate[this.handleServiceStaffId].staffHoulryRate.Night_shift_Hourly_Rate__c || 0;
    } else if (this.selctedShiftType === 'Afternoon') {
      this.finalhourlyRate = this.serviceStaffHoulryRate[this.handleServiceStaffId].staffHoulryRate.Afternoon_shift_Hourly_Rate__c || 0;
    } else {
      this.finalhourlyRate = this.serviceStaffHoulryRate[this.handleServiceStaffId].staffHoulryRate.Working_Hours_Rate__c || 0;
    }
    console.log('service staff hourly rate: ',  this.finalhourlyRate );
  }

  @track isMapLoaded = false;
  @track map;
  @track jsonData;
  leafletInitialized = false;
  polyline;
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

  handleGetlocation(){
    this.hideLocation=true;
    this.showLocation=false;
    getJSONdata( {shiftid: this.editStaffId, shiftstatus: this.selectedShiftStatus, sdate: this.shiftCreatedDate} )
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

displayAvailableStaff(){
  this.availablestaffdata=[];
  getAvailableStaff({Role: this.selectedShiftRole,startDate:this.shiftdate,startime: this.strttime,endtime:this.endtime}).then(response => { 
     
    console.log('avaliable staff data '+JSON.stringify(response));
     //   console.log('selected Shift type '+this.selectedShifttype);
      //  console.log('selected Shift day name '+this.selectedShiftDayName);
        this.availablestaffdata=this.getAavilabledataWithrates(response);
       // console.log('avaliable staff data '+JSON.stringify(this.availablestaffdata));
      
    });
}

handleInputChange(event) {
    let index = event.target.dataset.id;
    let fieldName = event.target.name;
    let value;

    // Handle toggle input
    if (event.target.type === 'toggle') {
        value = event.target.checked;  // Will be true if checked, false if unchecked
    } else {
        value = event.target.value;  // For other input types
    }
    console.log('field name ' + fieldName);
    console.log('value  ' + value);


    for(let i = 0; i < this.availablestaffdata.length; i++) {
        if(this.availablestaffdata[i].index === parseInt(index)) {
            this.availablestaffdata[i][fieldName] = value;
        }
    }

    this.totalWages=this.calculateTotalShiftWage(this.availablestaffdata)
    console.log('total wages '+this.totalWages);
}
@track totalWages=0;

  calculateTotalShiftWage(data){
    let wages=0;
      for (let i = 0; i < data.length; i++) {
          if ( data[i].ShiftWages != null  && data[i].Attandance__c ==true ) {
            wages +=(parseFloat(data[i].ShiftWages));
          }  
      }
     
      return wages;
  }

getAavilabledataWithrates(response){
  let tempconList=[];

  response.forEach((record,index) => {

    let tempConRec = Object.assign({}, record);
      let ind= index;
        ind =ind +1;
        tempConRec.index=ind;
        tempConRec.Id=tempConRec.Id;
        tempConRec.Name=tempConRec.Name;
        tempConRec.Last_Name__c=tempConRec.Last_Name__c;
        tempConRec.Role__c=tempConRec.Role__c;
        tempConRec.Facility_Name__c=tempConRec.Facility_Name__c;
        if(this.selectedShifttype=='General'){
        // this.staffOverallrate='General Hourly Rate';
          tempConRec.Final_Overall_Rate__c=tempConRec.Working_Hours_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Working_Hours_Rate__c ? record.Working_Hours_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2);
        }else if(this.selectedShifttype=='Morning'){
         // this.staffOverallrate='Morning Hourly Rate';
          tempConRec.Final_Overall_Rate__c=tempConRec.Working_Hours_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Working_Hours_Rate__c ? record.Working_Hours_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2);
        }else if(this.selectedShifttype=='Afternoon'){
         // this.staffOverallrate='Afternoon Hourly Rate';
          tempConRec.Final_Overall_Rate__c=tempConRec.Afternoon_shift_Hourly_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Afternoon_shift_Hourly_Rate__c ? record.Afternoon_shift_Hourly_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2);
        }else if(this.selectedShifttype=='Night'){
         // this.staffOverallrate='Night Hourly Rate';
          tempConRec.Final_Overall_Rate__c=tempConRec.Night_shift_Hourly_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Night_shift_Hourly_Rate__c ? record.Night_shift_Hourly_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2);
        }else if(this.selectedShifttype=='Custom'){
          //this.staffOverallrate='General Hourly Rate';
          tempConRec.Final_Overall_Rate__c=tempConRec.Working_Hours_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Working_Hours_Rate__c ? record.Working_Hours_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2); 
        }else{
          tempConRec.Final_Overall_Rate__c=tempConRec.Working_Hours_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Working_Hours_Rate__c ? record.Working_Hours_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2);
        }
        if(this.selectedShiftDayName=='Saturday'){
         // this.staffOverallrate='Saturday Hourly Rate';
          tempConRec.Final_Overall_Rate__c=tempConRec.Saturday_Hourly_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Saturday_Hourly_Rate__c ? record.Saturday_Hourly_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2);
        }
        if(this.selectedShiftDayName=='Sunday'){
         //.staffOverallrate='Sunday Hourly Rate';
          tempConRec.Final_Overall_Rate__c=tempConRec.Sunday_Hourly_Rate__c;
          tempConRec.ShiftWages= (parseFloat((record.Sunday_Hourly_Rate__c ? record.Sunday_Hourly_Rate__c : 0)) * parseFloat((this.durationinHours ?this.durationinHours :0 ))).toFixed(2);
        }
        tempConRec.shiftDuration=this.durationinHours;
        tempConRec.Attandance__c=false;
        tempConRec.Is_Recurring__c=false;
        tempConRec.Recurring_Till__c=tempConRec.Recurring_Till__c ?tempConRec.Recurring_Till__c :'' ;
        tempConRec.ShiftwithStaffs__r=(tempConRec.ShiftwithStaffs__r ? tempConRec.ShiftwithStaffs__r :'');
        tempConRec.Active_or_Non_Active__c=tempConRec.Active_or_Non_Active__c;
        tempConRec.Status__c=tempConRec.Status__c;
        if(tempConRec.Status__c==true){
          tempConRec.disableStatus=false
        }else{
          tempConRec.disableStatus=true;
        }
        tempconList.push(tempConRec);
  });
  return tempconList;
}

/* @track accountRecList = []; */


@track confirmationFlag=false;
@track confirmationData = {};
 getConfirmation(event){
  //this.lstSelectedRecords=this.template.querySelector("lightning-datatable").draftValues;
  //console.log('this.draftValues2',  JSON.stringify(this.lstSelectedRecords));
  this.lstSelectedRecords=this.availablestaffdata.map(rec=>{
    return {
      Id: rec.Id,
      finalOverallRate: rec.Final_Overall_Rate__c,
      attendance: rec.Attandance__c,
      isRecurring: rec.Is_Recurring__c,
      recurringTill: rec.Recurring_Till__c ? rec.Recurring_Till__c : null, // Format to YYYY-MM-DD
      shiftWithStaffs: rec.ShiftwithStaffs__r ? rec.ShiftwithStaffs__r : []
  }
  })
  console.log('selcted staff after allocation '+JSON.stringify(this.lstSelectedRecords));
  let selectedShiftList=[];
  let selectedShifstaff=[];
  let selectstaff=[];
  this.lstSelectedRecords.forEach(item=>{
    if(item.attendance ==true){
      selectedShiftList.push(item);
      selectstaff.push(item.Id);
    }
    
    if(this.isEOI ==true){  
      this.eoiShifstaff.forEach(ss=>{     
        if(selectstaff.includes(ss.Staff__c)){
          selectedShifstaff.push(ss);
        }
    })
  }
  })
   
  if(selectedShiftList.length >this.unallocatedCount){
    this.dispatchEvent(
      new ShowToastEvent({
          title: 'Error',
          message: 'Selected staff list should not be  greater than "Quantity  OR Unallocated " of shift',
          variant: 'Error',
      }),
    );
  }  else if(this.validateData(selectedShiftList)) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Error',
        message: 'Recurring shifts must have a "Recurring Till" date.',
        variant: 'error',
      })
    );
    this.openStaff=true;
  }else{
    this.confirmationFlag=true;
    this.confirmationData = { selectedShiftList, selectedShifstaff };
   
}


}
handleconfirmation(event){
  const { selectedShiftList, selectedShifstaff } = this.confirmationData;
  try{
    console.log('selectd',JSON.stringify(selectedShiftList));
    allocateMultipleStaff({ shiftId: this.shiftId, staffJson: JSON.stringify(selectedShiftList),shiftDate:this.shiftdate,shiftwithstaff:selectedShifstaff })
    .then(result => {
      //alert(result)
      if (result.startsWith('expired')) {
          // Extract the names of expired staff members from the response
          const expiredStaffNames = result.split(':')[1];
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: 'Unable to allocate the shift due to one of the staff mandatory document expired. Please uncheck the staff ' + expiredStaffNames,
                  variant: 'error',
              })
          );
          this.openStaff = false;
      } 
      else if(result.startsWith('going to expire')){
        const notifyStaffNames = result.split(':')[1];
        const event = new ShowToastEvent({
            title: 'Warning',
            message: 'Following staff mandatory document is going to be expire tomorrow : ' + notifyStaffNames,
            variant: 'warning',
        });
        this.dispatchEvent(event);
        this.handleSuccess();
        this.openStaff = false;
      }
      else {
          // Handle other cases when staff data inserted successfully
          //alert('Success');
          this.handleSuccess();
          this.openStaff = false;
      }
    })
    .catch(error => {
        console.error('Error adding contact', JSON.stringify(error));
        this.dispatchEvent(
          new ShowToastEvent({
              title: 'Shift Rejected',
              message: ((error.body.message.split(',')[1]).split(':'))[0],
              variant: 'Error'
          })
        );
    });
  this.confirmationFlag=false;
  this.openStaff=false;
  this.isHome=true;
  }catch(e){
    console.log('error in catch block');
  }
     
}
handleconfirmationclose(event){
  this.confirmationFlag=false;
}
validateData(selectedShiftList){
  for (const item of selectedShiftList) {
    if (item.isRecurring === true) {
     // console.log('is recurring:', item.Is_Recurring__c);
     // console.log('recurring till date:', item.Recurring_Till__c);
      if (!item.recurringTill) { // Check if Recurring_Till__c is empty
        return true; // Exit the loop immediately
      }
    }
  }
  return false; // No issues found
}

handleSelectedstaff(event){
  var selectedRecords =  this.template.querySelector("lightning-datatable").getSelectedRows();
  this.draftValues=event.detail.draftvalues;
 // console.log('this.draftValues',this.draftValues);
  if(selectedRecords.length > 0){
     // console.log('selectedRecords are ', selectedRecords);

      let ids = '';
      selectedRecords.forEach(currentItem => {
          ids = ids + ',' + currentItem.Id ;
         // console.log(this.template.querySelector("lightning-datatable").draftValues);
      });
      this.selectedIds = ids.replace(/^,/, '');
      this.lstSelectedRecords = selectedRecords;
     // console.log('selectedRecords are 2 ',  this.lstSelectedRecords );
      alert(this.selectedIds);
    }
}

handleavailability(event)
{    
  var staffID=event.currentTarget.dataset.id;    
  event.target.checked = true;
  const element = this.template.querySelector('[data-id='+staffID+']');
  
  this.dispatchEvent(
    new ShowToastEvent({
        title: 'Roster!!',
        message: 'You cannot in-active the roster!!!',
        variant: 'Roster',
    }),
  );
}
closeopenstaff(event){
  this.isHome=true;
  this.openStaff=false;
}

timeChange(event) {
  if (event.target.name == "startTime") {
      this.startTimePickval = event.target.value;
  }
  if (event.target.name == "endTime") {
      this.endTimePickval = event.target.value;
  }

  let starttimevalue = this.convertTo24Hour(this.startTimePickval);
  this.spickval = starttimevalue + ':00Z';

  let endTimeValue = this.convertTo24Hour(this.endTimePickval);
  this.epickval = endTimeValue + ':00Z';

  // Parse date parts from selectedShiftDate
  let Dateparts = this.selectedShiftDate.split("-");
  let year = parseInt(Dateparts[0], 10);
  let month = parseInt(Dateparts[1], 10) - 1; // Months are zero-indexed
  let day = parseInt(Dateparts[2], 10);

  // Start date with time
  let startParts = this.spickval.split(":");
  let startDate = new Date(year, month, day, parseInt(startParts[0], 10), parseInt(startParts[1], 10));
  //console.log("start date: " + startDate);

  // Handle end date and possible shift into the next day
  let endParts = this.epickval.split(":");
  let endDate = new Date(year, month, day, parseInt(endParts[0], 10), parseInt(endParts[1], 10));

  // If it's a night shift and the end time is in AM
  let eindTimeSplit = this.endTimePickval.split(' ');
  if (eindTimeSplit[1] == 'am' && this.NewShiftType == 'Night') {
      endDate.setDate(endDate.getDate() + 1);
      this.selectedShiftEndDate = endDate.toISOString().split("T")[0];
  } else {
      this.selectedShiftEndDate = this.selectedShiftDate;
  }

  //console.log("end date: " + endDate);

  // Calculate duration in milliseconds and convert to hours
  let durationInMilliseconds = endDate - startDate;
  let durationInMinutes = durationInMilliseconds / (1000 * 60);
  let hours = (durationInMinutes / 60).toFixed(1);

  this.durationinHours = hours;
  if (this.durationinHours >= 5) {
      this.breakTime = 30;
      let breaks = (this.breakTime / 60).toFixed(1);
      this.durationinHours -= breaks;
  } else {
      this.breakTime = 0;
  }

  console.log('Duration with breaks: ' + this.durationinHours);
}


  convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'pm') {
        hours = parseInt(hours, 10) + 12;
    }
    if(hours<10 && hours !=0){
      hours='0'+hours;
    }

    return `${hours}:${minutes}`;
}

  convertStatus(status){
    if(status=='Accepted'){
      return 'Accepted' ;
    }else if(status=='InProgress'){
      return 'In Progress';
    }else if(status=='Completed'){
      return 'Completed';
    }
  
  }
navigatetoHome() {
  this[NavigationMixin.Navigate]({
    type: 'comm__namedPage',
    attributes: {
      //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
      pageName: 'home'
    },
  });
}

@track fundOption;
@track serviceType;
@track ndisState;
@track serviceGroupName=[];
@track NdisServiceGroupName;
@track serviceTypeName;
@track serviceTypeId;
@track shiftcreatedtime;
@track shiftendtime ;
@track shiftduartion;
@track stateValue;
@track shiftCreatedDate;
@track particpantID;
@track shiftStaffID;
@track selectedNdisIdValue;
@track serviceNameValue;
@track servicePlan;
@track TotalFunds;
@track staffHoulryRate;
@track shiftWage;
@track servicesList; // To hold the services data
wiredServicesResult; 
@track ServiceStaffList=[];
@track serviceStaffHoulryRate={};
@track finalhourlyRate=0.00;
@track GroupedStaff=false;
@track shiftWithStaffComments;
@track ShowGroupOfStaff=false;
@track groupOfListOfStaff=[];
@track handleServiceStaffId;
@track isStaffChangedInService=false
@track shiftCardEnddate;
@track splitShiftNotification=false;
@track disableSplitCheckBox=false;
@track disableAllserviceSection=false;

    handleLinkParticipants(){
      fetchFacilitiess({cname:'',isTrue:false}).then(response=>{
        
        this.ParticipantOptions=response.filter(rec => (rec.Status__c === true && rec.Facility__r.Status__c===true )  ) // Check for 'Active' status
                                  .map(rec=>{
                                              return {
                                                value:rec.Id,label:rec.Name
                                              }
                                      })
          //console.log('response '+JSON.stringify(this.ParticipantOptions));
        }).catch(error=>{

          })
    }
  particapantChange(event){
    console.log('participantValue '+event.target.value);
     this.particpantID=event.target.value;
    this.serviceType=false;
    this.fundOption=[];
    this.serviceGroupName=[];
    this.NdisServiceGroupName=false;
    getClientFunds({clientId :event.target.value}).then(response=>{
      console.log('funds '+JSON.stringify(response));
      if(response){
        this.TotalFunds=response;
        this.serviceType=true;
        this.fundOption=response.map(rec=>{
          return { "label": rec.Registration_Group__c,"value": rec.Id};
        });
        console.log('funds option'+JSON.stringify(fundOption));
      }
    }).catch(error=>{
    }) 
  }

  handleServiceChange(event){
   // console.log('event target'+JSON.stringify(event.target.options));
   //console.log('event details'+JSON.stringify(event.detail));
    console.log('shift created date '+this.shiftCreatedDate);
    this.serviceTypeName=event.target.options.find(opt => opt.value === event.detail.value).label;
    console.log('shift created date '+this.serviceTypeName);
    this.servicePlan=this.TotalFunds.find(opt => opt.Id === event.detail.value).Plan_Type__c;
    this.serviceTypeId=event.detail.value;
    this.stateValue='';
    this.NdisServiceGroupName=false;
    this.NdisServiceGroupNameinEdit=false;
    if(this.serviceTypeName){
      getNDISServiceLineItem({ServiceItemNames :this.serviceTypeName,ServiceDate:this.shiftCreatedDate}).then(response=>{
       this.serviceGroupName=response;
       console.log('service type '+JSON.stringify(this.serviceGroupName));
      
      })
    }
  }
  HandlestateChange(event) {
    this.stateValue = event.target.value;
    console.log('state value ' + this.stateValue);
        if (this.stateValue) {
          console.log('ref '+event.currentTarget.dataset.ref)
          this.NdisServiceGroupName=event.currentTarget.dataset.ref=='increation' ?true:false;
          this.NdisServiceGroupNameinEdit=event.currentTarget.dataset.ref=='inedit' ?true:false;
          this.serviceGroupName = this.serviceGroupName.map((item) => {
              const amount = item[this.stateValue]; // Dynamically fetch the state's amount field
             // console.log('amount '+amount);
              if (amount !== undefined) {
                  return { ...item, amount }; // Include the state's amount in the filtered row
              }
              return { ...item, amount: 0.00 }; // Add an empty amount for rows without the state's field
          });
          console.log(' Service list based on state change '+JSON.stringify(this.serviceGroupName));
      }
}

  handleEditShiftStaffChange(event){
    this.shiftStaffID
    if(event.target.name=='staff'){
      this.shiftStaffID=event.target.value;
    } if(event.target.name=='comments'){
      this.shiftWithStaffComments=event.target.value;
    }
  }
  handleShiftWithStaff(event){
    /*   event.preventDefault();// stop the form from submitting
      const fields = event.detail.fields;
      fields.Service_Type__c=this.serviceTypeName; */
     // console.log('After fields in edit>>'+JSON.stringify(fields));
      //  this.template.querySelector('lightning-record-edit-form').submit(fields);    
      if(this.reCurringStaffChecked){
        console.log('recur condition checked');
        if(this.shiftRecurrEndDate == undefined || this.shiftRecurrEndDate == null || this.shiftRecurrEndDate == ''){
          this.closePopover();
          const toastEvent = new ShowToastEvent({
            title: "Rejected",
            message: "Please provide Recurring End Date",
            variant: "Error"
          });
         this.dispatchEvent(toastEvent);
         return;
        }else{
          this.openRecurringModal = true;
          this.ShowOnlyRecurrStaffSubmit=true;
       /*    this.template.querySelector('lightning-record-edit-form[data-recid="shitWithStaff"]').submit(fields); */
        } 
      }else{
        console.log('edit staff id '+this.editStaffId);
        updateShiftStaff({
          ShiftWithStaffId:this.editStaffId,
          StaffID:this.shiftStaffID,
          comments:this.shiftWithStaffComments
        }).then((response) => {
            this.handleShiftWithStaffSuccess();
        })
      }
  }
  handleCheckboxSelection(event){
    const selectedId = event.target.getAttribute('data-id'); // Get the selected row's ID
    const selectedRow = this.serviceGroupName.find(row => row.Id === selectedId); 
    console.log('Selected row '+JSON.stringify(selectedRow));
    this.selectedNdisIdValue = selectedRow.Id;
    this.serviceNameValue =selectedRow.Name;
    // Update the isSelected property for all rows
    this.serviceGroupName = this.serviceGroupName.map(row => ({
        ...row,
        isSelected: row.Id === selectedId // Set true for the selected row, false for others
    }));

    console.log('Selected Row ID:', selectedId);
  }
  handleShiftWithStaffSuccess(event){
      this.setDateHeaders();   
      const toastEvent = new ShowToastEvent({
          title: "Success",
          message: "Changes Saved Successfully",
          variant: "success"
      });
      this.dispatchEvent(toastEvent);
     /*  this.isAddShift=false;
      this.editflag=false;   
      this.editStaff=false;
      this.editshift=false; */
      let displayData=[];
        
  }

  handleServicecreate(){
   // this.validateServiceData();
    if(this.stateValue==undefined || this.stateValue==null || this.stateValue==''){
      const evt = new ShowToastEvent({
          title: 'Error',
          message: 'Please provide State',
          variant: 'Error',
          mode: 'dismissable'
      });
      this.dispatchEvent(evt);
      }else if(this.particpantID==undefined || this.particpantID==null || this.particpantID==''){
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Please provide Participant',
            variant: 'Error',
            mode: 'dismissable'
          });
        this.dispatchEvent(evt);
      }
        else if(this.serviceTypeId==undefined || this.serviceTypeId==null || this.serviceTypeId==''){
      const evt = new ShowToastEvent({
          title: 'Error',
          message: 'Please provide Service Type',
          variant: 'Error',
          mode: 'dismissable'
      });
      this.dispatchEvent(evt);
    }else if(this.selectedNdisIdValue==undefined || this.selectedNdisIdValue==null || this.selectedNdisIdValue==''){
      const evt = new ShowToastEvent({
        title: 'Error',
        message: 'Please select Service',
        variant: 'Error',
        mode: 'dismissable'
      });
      this.dispatchEvent(evt);
    }else if(this.splitShifts.length==0){
          const evt = new ShowToastEvent({
            title: 'Error',
            message: "You don't have any available shifts",
            variant: 'Error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
        this.splitShiftNotification=false;
    }
      else  if(this.splitCheckbox==true){

        this.isSplitShiftnumberDisable=true;
        this.splitShiftNotification=true;
        this.serviceStaffDisable=true;
        this.numberOfShifts=this.splitShifts.length;
        console.log('number of split shifts '+this.numberOfShifts);
       /*  console.log('split shift length  '+this.splitShifts.length); */
        console.log('split shift  '+JSON.stringify(this.splitShifts));

      }else{
        this.isSplitShiftnumberDisable=false;
        this.generateSplitShifts();
      }
    
  }
  generateSplitShifts(){
    if(this.splitShifts.length>0){
     
      console.log('input json '+JSON.stringify(this.splitShifts[0]));
      console.log('is staff changed '+this.isStaffChangedInService);
    CreateShiftWithStaff({ shiftId: this.selectedCardShiftID, StartTime:this.shiftcreatedtime , endTime:this.shiftendtime ,Hourlyrate:this.finalhourlyRate,staffId:this.handleServiceStaffId ,ShiftList:JSON.stringify(this.splitShifts[0]),isStaffChnaged:this.isStaffChangedInService,isSplitCheckBox:this.splitCheckbox})
      .then(result => {
       
        console.log('out put '+result)
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        let shiftWithStaffId = (result === 'updated AddShiftdeatils') ? this.editStaffId : result;
        console.log('after selected >>'+this.selectedNdisIdValue);
        let state=this.stateValue.split('_')
        //console.log('state '+state[0])
       // console.log('input json '+JSON.stringify(this.splitShifts[0]));
          createSupportRecord({serviceNameValue:this.serviceNameValue,serviceStatusValue:'Not Yet Invoiced',state:state[0],startTime:this.shiftcreatedtime,
            endTime:this.shiftendtime,serviceStartDateValue:this.shiftCreatedDate,recordId:this.particpantID,fundID:this.serviceTypeId,staffID:this.handleServiceStaffId,
            selectedNdisIdValue:this.selectedNdisIdValue,duartion:this.shiftduartion,shiftWithStaffId: shiftWithStaffId,ShiftList: JSON.stringify(this.splitShifts[0])}).then(res=>{
               // console.log('servcie type '+res);
                if(res){
                  this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Service Type is created for above shift',
                        variant: 'Success',
                    }),
                  );
                  refreshApex(this.wiredServicesResult);
                  if(this.splitCheckbox==false){
                    this.emptyServiceFields();
                  }else{
                    this.splitShiftNotification=false;
                  }
                  
                }
               
                this.setDateHeaders();  
            }).catch(error=>{
              console.log('servcie type '+JSON.stringify(error));
                const toastEvent = new ShowToastEvent({
                  title: "Error",
                  message: " Problem occurred while creating Service Type",
                  variant: "Error"
              });
              this.dispatchEvent(toastEvent);
            });
          this.splitShifts = this.splitShifts.slice(1); 
          this.shiftOptions = this.generateShiftOptions(); 
            if (this.shiftOptions.length > 0) {
              this.numberOfShifts = this.shiftOptions[this.shiftOptions.length - 1].value;
          }

      }).catch(error=>{
        console.error('Error adding shift', JSON.stringify(error));
        this.dispatchEvent(
          new ShowToastEvent({
              title: 'Shift Rejected',
              message: ((error.body.message.split(',')[1]).split(':'))[0],
              variant: 'Error'
          })
        );
    
      })

     }
  }

  emptyServiceFields() {
    this.serviceGroupName=[];
    this.serviceNameValue='';
    this.stateValue='';
    this.particpantID='';
    this.serviceTypeId='';
    this.selectedNdisIdValue='';
    this.servicePlan='';
    this.NdisServiceGroupName=false;
    this.handleServiceStaffId='';
    this.finalhourlyRate=0.00;
    this.serviceStaffDisable=false;
    this.shiftOptions=[];
    this.numberOfShifts='';
    this.disableSplitCheckBox=false;
   this.splitShiftNotification=false;
   this.splitCheckbox=false;
   this.isStaffChangedInService=false;
  }
  generateShiftOptions() {
    return this.splitShifts.map((shift, index) => ({ label: `${index + 1}`, value: `${index + 1}` }));
  }
  
    togglePopover() {
      this.isPopoverVisible = !this.isPopoverVisible;
    }

// Close popover when the close button is clicked
  closePopover() {
      this.isPopoverVisible = false;
      this.showcardPopOver=false;
      this.emptyShiftPopOver=false;
      this.openRecurringModal=false;
      this.GroupedStaff=false;
      this.ShowParticipnatRecurSubmit=false;
  }
  @track draggedStaffId; 
  @track showcardPopOver=false;
  @track blshiftCardDrop = false;
  @track selctedShiftType='';
  @track selctdshiftcardDayname='';
  @track selectedCardShiftID='';
  @track selctedCardShiftDate='';
  @track draggedfullname;
  @track ParticipantOptions;
  @track openRecurringModal=false;
  @track shiftRecurrEndDate;
  @track RecurrStaffHourlyRate=0;
  @track includeParticipants=false;
  @track reCurringStaffChecked=false;
  @track ShowParticipnatRecurSubmit=false;
  @track ShowOnlyRecurrStaffSubmit=false;
  @track eoiInDragAndDrop=false;
  @track draggedStaffRole;
  @track splitCheckbox=false;
  @track  isSplitShiftnumberDisable=false;
  @track  serviceStaffDisable=false;
  @track isdeleteIcon=false;
  @track isServiceEdit=false;
  @track serviceEditID='';
  @track NdisServiceGroupNameinEdit=false;

  handleDragStart(event) {
      this.draggedStaffId = event.target.dataset.id;
      this.draggedfullname = event.target.dataset.fname+' '+event.target.dataset.lname ;
      this.draggedStaffRole=event.target.dataset.rolename;
      console.log('Dragging staff with ID:', this.draggedStaffId);
  }
  handleDragOver1(event) {
    this.blshiftCardDrop = false;
    event.preventDefault();    
  }

  handleDragOver2(event) {
    this.blshiftCardDrop = true;
    event.preventDefault();    
  }


  handleDrop(event) {
    if (this.blshiftCardDrop == false){
      console.log('dragged id '+this.draggedStaffId);
      if(this.draggedStaffId ==undefined){
        const toastEvent = new ShowToastEvent({
          title: "Rejected",
          message: "Please drag once again",
          variant: "Error"
        });
       this.dispatchEvent(toastEvent);
       return ;
      }
     
      this.selectedShiftDate =event.currentTarget.dataset.id;
      this.createdShiftRole=event.currentTarget.dataset.rolename;

      let splitStaffRoles=this.draggedStaffRole.split(';');
      console.log('split role '+splitStaffRoles);
      if(!splitStaffRoles.includes(this.createdShiftRole)){
          const toastEvent = new ShowToastEvent({
            title: "Rejected",
            message: "The selected staff role does not match the shift role.",
            variant: "Error"
          });
        this.dispatchEvent(toastEvent);
       return ;
      }
      this.isAddShift=true;
      this.editshift=false;
      this.isHome=false;
      this.selectedShiftRole='';
      this.startTimePickval='';
      this.endTimePickval='';
      this.eoiInDragAndDrop=true;
      this.EmptyAddressFields();  
 
      this.selctdshiftcardDayname=this.getDayName(this.selectedShiftDate);
      this.shiftDayName=this.selctdshiftcardDayname;
      console.log('dayname '+this.selctdshiftcardDayname);
    }
    event.preventDefault();
    console.log('hi'); 
  }
    getDayName(dateString) {
        const date = new Date(dateString);
        // Check if the date is valid
        if (isNaN(date)) {
            return 'Invalid Date';
        }
        // Get the day name using toLocaleDateString method
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        return dayName;
    }
  handleCardDrop(event)
  {
    event.preventDefault();
    let eoi=event.currentTarget.dataset.shifteoi;
    this.blshiftCardDrop = true;
    if(eoi=== 'true'){
      console.log('eoi shift '+eoi);
      const toastEvent = new ShowToastEvent({
        title: "Shift Rejected",
        message: "You have selected EOI Shift",
        variant: "Error"
      });
      this.dispatchEvent(toastEvent);
    }else if(event.currentTarget.dataset.shiftunalloc==0){
      const toastEvent = new ShowToastEvent({
        title: "Shift Rejected",
        message: "You Don't have any available shifts ",
        variant: "Error"
      });
     this.dispatchEvent(toastEvent);
    }else if(this.draggedStaffId ==undefined){
      const toastEvent = new ShowToastEvent({
        title: "Rejected",
        message: "Please drag once again",
        variant: "Error"
      });
     this.dispatchEvent(toastEvent);
    
    }else{
        this.showcardPopOver=true;
        this.selctedShiftType=event.currentTarget.dataset.shifttype;
        this.selctdshiftcardDayname=event.currentTarget.dataset.shiftdayname;
        this.selectedCardShiftID=event.currentTarget.dataset.shiftid;
        this.selctedCardShiftDate=event.currentTarget.dataset.shiftdate1
    }
   
  }

  handleCreateShiftWithStaff(){
    console.log('shift type '+this.selctedShiftType);
    console.log('slected day name' +this.selctdshiftcardDayname);

    getStaffById({recordId:this.draggedStaffId}).then(response=>{
      console.log('selected Staff response '+JSON.stringify(response));
      let staffFinalHourlyrate=0
      if(this.selctdshiftcardDayname=='Saturday'){
        staffFinalHourlyrate=response[0].Saturday_Hourly_Rate__c;
      }else if(this.selctdshiftcardDayname=='Sunday'){
        staffFinalHourlyrate=response[0].Sunday_Hourly_Rate__c;
      }else if(this.selctedShiftType=='General'|| this.selctedShiftType=='Morning' || this.selctedShiftType=='Custom'){
        staffFinalHourlyrate=response[0].Working_Hours_Rate__c;
      }else if(this.selctedShiftType=='Night'){
        staffFinalHourlyrate=response[0].Night_shift_Hourly_Rate__c;
      }else if(this.selctedShiftType=='Afternoon'){
        staffFinalHourlyrate=response[0].Afternoon_shift_Hourly_Rate__c;
      }else{
        staffFinalHourlyrate=response[0].Working_Hours_Rate__c;
      }
      
      let alloccateStaffJSon=[{ "Id":this.draggedStaffId,"finalOverallRate":staffFinalHourlyrate,"attendance":true,"isRecurring":false,recurringTill: null, 
        shiftWithStaffs: []}];
      console.log('final json '+JSON.stringify(alloccateStaffJSon));

      allocateMultipleStaff({ shiftId: this.selectedCardShiftID, staffJson:JSON.stringify(alloccateStaffJSon) ,shiftDate:this.selctedCardShiftDate,shiftwithstaff:[] })
      .then(result => {
        this.draggedStaffId='';
        this.draggedfullname='';
        this.emptyShiftPopOver=false;
        this.showcardPopOver=false;
        this.draggedStaffRole='';
        this.eoiInDragAndDrop=false;
       // this.handleSuccess();
       this.setDateHeaders();   
      const toastEvent = new ShowToastEvent({
          title: "Success",
          message: "Changes Saved Successfully",
          variant: "success"
      });
      this.dispatchEvent(toastEvent);
      }).catch(error=>{
        console.error('Error adding contact', error);
        this.dispatchEvent(
          new ShowToastEvent({
              title: 'Shift Rejected',
              message: ((error.body.message.split(',')[1]).split(':'))[0],
              variant: 'Error'
          })
        );
        
      this.draggedStaffId='';
      this.draggedfullname='';
      this.eoiInDragAndDrop=false;
      this.draggedStaffRole='';
      this.showcardPopOver=false;
      this.emptyShiftPopOver=false;
      })

    }).catch(error=>{
      this.draggedStaffId='';
      this.draggedfullname='';
      this.draggedStaffRole='';
      this.eoiInDragAndDrop=false;
      this.showcardPopOver=false;
      this.emptyShiftPopOver=false;

    })

  }
  @track staffrecurflag=false;
  HandleRecurrStaff(event) {
    //console.log('Event Triggered:', event); // Log the full event object

    if (event.target.name === 'recurrStaff') {
        console.log('Recurr Staff checkbox triggered');
        this.reCurringStaffChecked=event.target.value;
        if(this.reCurringStaffChecked){
          this.staffrecurflag=true;
        }else{
          this.staffrecurflag=false;
        }
        console.log('Recurr Participant checkbox triggered'+this.reCurringStaffChecked);
    } 

    if (event.target.name === 'recurrParticipant') {
       
        this.includeParticipants=event.target.value;
        console.log('Recurr Participant checkbox triggered'+this.includeParticipants);
    }
}

  HandlerecurringDateChnage(event){
    console.log('recurring date change '+event.target.value);
    this.shiftRecurrEndDate=event.target.value;

  }
  handleAllocateRecurSatff(event){
    if(this.includeParticipants==false){
      this.ShowOnlyRecurrStaffSubmit=false;
      this.ShowParticipnatRecurSubmit=true;
    }else{
      this.submitRecurring();
    }
   
  }
  handleWithoutRecurParticipants(){
    this.submitRecurring();
  }

  handleWithRecurParticipants(){
    this.includeParticipants=true;
    this.submitRecurring(); 
  }

  submitRecurring(){
    shiftCardRecurringShifts({shiftId:this.selectedCardShiftID,hourlyrate:this.RecurrStaffHourlyRate, recurringEndDate:this.shiftRecurrEndDate,StaffId:this.shiftStaffID,shiftWithStaffID:this.editStaffId,includeParticipants:this.includeParticipants}).then(response=>{
      this.closePopover();
      this.closeModal();
      this.handleSuccess();
     
      }).catch(error=>{

      })
  }

  handleNumberOfShiftsChange(event) {
    this.numberOfShifts = event.target.value;
    this.generateShifts()
}

  generateShifts() {
    /*  if (!this.startTime || !this.endTime || !this.numberOfShifts) {
          alert('Please fill in all fields!');
          return;
      } */

    // Assuming these are already correctly defined in your context
    const start = new Date(`${this.shiftCreatedDate}T${this.convertTo24Hour(this.shiftcreatedtime)}Z`);
    const end = new Date(`${this.shiftCardEnddate}T${this.convertTo24Hour(this.shiftendtime)}Z`);
    const numShifts = parseInt(this.numberOfShifts, 10);

    const totalMinutes = (end - start) / (1000 * 60);
    const segmentMinutes = totalMinutes / numShifts;

    const shifts = [];
    let currentStart = start;

    for (let i = 0; i < numShifts; i++) {
      const currentEnd = new Date(currentStart.getTime() + segmentMinutes * 60 * 1000);

      // Check if the shift crosses midnight
      let endDateAdjusted = currentEnd.getUTCDate() !== currentStart.getUTCDate() ? currentEnd : null;

      // Add shift to the shifts array with formatted date and time
      shifts.push({
          id: i,
          name: `Shift ${i + 1}`,
          startDateTime: this.formatDateTimeWithRounding(currentStart),
          endDateTime: this.formatDateTimeWithRounding(currentEnd, endDateAdjusted),  // Adjusted end date if next day
      });

      currentStart = currentEnd;
  }


    this.splitShifts = shifts;
    this.showSpliOverShifts = true;
    console.log('split shifts:', JSON.stringify(this.splitShifts));
    this.createShifts();
  }

// Helper function to format date and time with rounding
    formatDateTimeWithRounding(date, overrideDate = null) {
      let hours = date.getUTCHours();
      let minutes = date.getUTCMinutes();

      // Round to the nearest 30 minutes
      if (minutes < 15) {
          minutes = 0; // Round down to the hour
      } else if (minutes < 45) {
          minutes = 30; // Round to the half-hour
      } else {
          minutes = 0; // Round up to the next hour
          hours += 1;
      }

      // Adjust for date changes (if transitioning to the next day)
      const day = overrideDate
          ? new Date(overrideDate).getUTCDate().toString().padStart(2, '0')
          : date.getUTCDate().toString().padStart(2, '0');

      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      const formattedHours = hours % 12 || 12; // Convert to 12-hour format
      const period = hours >= 12 ? 'pm' : 'am';
      const formattedMinutes = minutes.toString().padStart(2, '0'); // Add leading zero to minutes

      // Return full formatted date-time (date + time)
      return `${year}-${month}-${day}*${formattedHours}:${formattedMinutes} ${period}`;
    }
  
  closeSplitShifts(){
        this.showSpliOverShifts = false;
  }
  createShifts() {
    this.splitShifts = this.splitShifts.map((shift, index) => {
        // Extract date and time for both start and end date/times
        const { date: startDate, time: startTime } = this.extractDateAndTime(shift.startDateTime);
        const { date: endDate, time: endTime } = this.extractDateAndTime(shift.endDateTime); // Process endDateTime as well
  
        // Log to check the output of endDateTime extraction
        console.log('Extracted endDateTime:', shift.endDateTime, '=>', endDate, endTime);
  
        return {
            addShiftId: index === 0 ? this.selectedCardShiftID || null : null,
            ...shift,
            startDate: startDate,   // Start Date
            startTime: startTime,   // Start Time
            endDate: endDate,       // End Date
            endTime: endTime        // End Time
        };
    });
  
    console.log('split shifts:', JSON.stringify(this.splitShifts));
    // Proceed with whatever further logic is required
  }
  
  // Helper function to extract the date and time from a string like '2024-11-18 9:00 am'
  extractDateAndTime(dateTime) {
    // Split the dateTime string into date and time parts at the first space
    const [date, time] = dateTime.split('*'); // Only split at the first space
  
    // Return the date and time
    return {
        date: date,  // Extract date part
        time: time   // The remaining time part (am/pm included)
    };
  }
  
  onSplitchange(event){
    this.splitCheckbox=event.target.checked;
    console.log('split check '+this.splitCheckbox)
    this.isSplitShiftnumberDisable=this.splitCheckbox==false;
  }
    get cardViewClass(){
      return this.cardFlag ? 'staff' : 'participant'; // you can use your custom class here.
    }

    get listViewClass(){
      return this.listFlag ? 'staff' : 'participant'; // you can use your custom class here.
    }
    handleDeleteShift(event){
      this.showSpinner=true;
      console.log('status '+event.currentTarget.dataset.status);
      this.editStaffId=event.currentTarget.dataset.id;  
      let  shiftid=event.currentTarget.dataset.id
       refreshApex(this.wiredServicesResult);
       setTimeout(()=>{
        console.log('service length '+typeof(this.servicesList.length));
        if(this.servicesList.length===0){
          console.log('service id  '+shiftid);
          deleteRecord(shiftid).then(() => {
            console.log('delete calll  '+shiftid);
            this.dispatchEvent(
              new ShowToastEvent({
                title: 'Success',
                message: 'Shift has been deleted',
                variant: 'success'
              })
            );
            this.showSpinner=false;
             this.setDateHeaders();
          });
      }else{
          const toastEvent = new ShowToastEvent({
            title: "Action Denied",
            message: "You can only delete shifts without any service",
            variant: "error"
          });
          this.dispatchEvent(toastEvent);
          this.showSpinner=false;
      }
       },1000);
     
    } 
    HandleServiceEdit(event){
        this.isServiceEdit=true;
        this.serviceEditID=event.currentTarget.dataset.id;
        this.serviceTypeId=event.currentTarget.dataset.serviceid;
        console.log('service partcipant '+event.currentTarget.dataset.serviceid)
       // console.log('service name'+event.currentTarget.dataset.servicename)
       let servicesName=event.currentTarget.dataset.servicename
        getClientFunds({clientId :event.currentTarget.dataset.participantid}).then(response=>{
          console.log('funds '+JSON.stringify(response));
          if(response){
            this.TotalFunds=response;
            this.fundOption=response.map(rec=>{
              return { "label": rec.Registration_Group__c,"value": rec.Id};
            });
              getNDISServiceLineItem({ServiceItemNames :servicesName,ServiceDate:this.shiftCreatedDate}).then(response=>{
                this.serviceGroupName=response;
                  console.log('service type '+JSON.stringify(this.serviceGroupName));
        
              }).catch(error=>{
                
              })
    
          }
        }).catch(error=>{
        }) 
     }
     handleHideServiceModal(){
      this.isServiceEdit=false;
      this.NdisServiceGroupNameinEdit=false;
      this.stateValue='';
      this.emptyServiceFields();
     }
     handleServiceEditSubmit(event){
      event.preventDefault();// stop the form from submitting
      const fields = event.detail.fields; 
      fields.Funds_Tracker__c=this.serviceTypeId;
      fields.Service_Type__c=this.selectedNdisIdValue;
      console.log('After fields>>'+JSON.stringify(fields));

      this.template.querySelector('lightning-record-edit-form[data-recid="serviceEdit"]').submit(fields);
    } 
    handleServiceEditSuccess(event){
      this.isServiceEdit=false;
     // this.template.querySelector('lightning-record-edit-form').reset();
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Success',
          message: 'Services Updated successfully',
          variant: 'success'
        })
      );
      refreshApex(this.wiredServicesResult);
      this.NdisServiceGroupNameinEdit=false;
      this.stateValue='';
      this.emptyServiceFields();
    }
    get iconName() {
      if (this.isListening) {
           return 'utility:unmuted';
      } else {
           return 'utility:muted';
      }
      //this.isAddShift=true;
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
                   this.shiftNotes += Array.from(event.results)
                       .map((result) => result[0].transcript)
                       .join('');
                   this.showClearIcon = true; // Show clear icon after transcription

                   console.log('shift notes  AT START', this.shiftNotes);

               };
               if(this.showClearIcon=false){
                //this.shiftNotes = '';
                console.log('clear 123 called')
                this.shiftNotes = '';
                //this.shiftNotesEdit = '';
                   console.log('SHIFT Notes new >> '+this.shiftNotes);
               }

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
           this.shiftNotes = '';
          //  if(this.shiftNotesEdit){
          //   this.shiftNotesEdit = '';
          //  }
           
           this.showClearIcon = false;
           if (this.isListening) {
            //this.startListening();
            this.stopListening();
            this.shiftNotes = '';
           // this.shiftNotesEdit = '';
           } 
       } catch (error) {
           console.error('Error in clearText:', error.message);
       }
       
       
    }

    handleFocus(event) {
       const field = event.target.closest('.custom-field-wrapper').dataset.fieldName;
       if (field === 'Shift_Notes__c') {
         this.showMuteIcon = true;
         this.showClearIcon = this.shiftNotes.length > 0;
         //this.showClearIcon = this.shiftNotesEdit.length > 0;
         try {
           // Reset to mute icon state
           this.isListening = false; // Ensure the state is not in listening mode
           if (this.recognition) {
           this.recognition.stop(); // Stop any ongoing recognition process
           this.recognition = null; // Clear recognition instance
           }
           console.log('Focus detected: Resetting to mute state.');
        } catch (error) {
           console.error('Error in handleFocus:', error.message);
        }
    }

    }
    handleShiftNotes(event) {
     // this.showMuteIcon = true;
      try {
        this.shiftNotes = event.target.value;
        //this.handleFocus();
        this.showClearIcon = this.shiftNotes.length > 0;
      } catch (error) {
        console.error('Error in handleTextChange:', error.message);
      }
    } 
   
  }