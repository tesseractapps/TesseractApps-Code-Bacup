import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import momentJS from "@salesforce/resourceUrl/momentJS";
import { loadScript } from "lightning/platformResourceLoader";
import getStaffAllocation from '@salesforce/apex/RoasterManagementHandler.getStaffAllocation';
import getStaffAlocationData from '@salesforce/apex/RoasterManagementHandler.getStaffAlocationData';
//import holidayList from '@salesforce/apex/HolidayList.holidayList';
import getFacilityData from '@salesforce/apex/StaffController.fetchFacilitiess';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { deleteRecord } from 'lightning/uiRecordApi';
import FORM_FACTOR from '@salesforce/client/formFactor';
import getAllShiftWithSatff from '@salesforce/apex/AddShiftController.getAllShiftWithSatff';
import getMultipleShiftsdata from '@salesforce/apex/AddShiftController.getMultipleShiftsdata';
import updateAllocations from '@salesforce/apex/AddShiftController.updateAllocations';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import LightningConfirm from 'lightning/confirm';
//import getDuration from '@salesforce/apex/RoasterManagementHandler.getDuration';
import getRosterAllocationInvoiceData from '@salesforce/apex/RoasterManagementHandler.getRosterAllocationInvoiceData';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import insertInvoice from '@salesforce/apex/InvoiceHandler.insertInvoice';
import listofInvoices from '@salesforce/apex/InvoiceHandler.listofInvoices';
import listofInvoicesParent from '@salesforce/apex/InvoiceHandler.listofInvoicesParent';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import jsPDF from '@salesforce/resourceUrl/jspdf';
import getShiftReimbursements from '@salesforce/apex/SubmissionsController.getShiftReimbursements';
import getCheckListByShiftId from '@salesforce/apex/SignInCheckListAndNotesHandler.getCheckListByShiftId';
import getActivityLog from '@salesforce/apex/SignInCheckListAndNotesHandler.getActivityLog';
import holidayList from '@salesforce/apex/LeaveController.holidayListbyOrg';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import robotoFont from '@salesforce/resourceUrl/Roboto';
import autoTable from '@salesforce/resourceUrl/autotable';
import getAddShiftDataById from '@salesforce/apex/AddShiftController.getAddShiftDataById';
const actions = [
  { label: 'View Invoice', name: 'view_details' },
  { label: 'Delete', name: 'delete' },
];

export default class roasterManagement extends NavigationMixin(LightningElement) {
  attendence = My_Resource + '/myResource/images/TimeSheets.png';
  @api recordId = "";
  @api objectApiName;
  @track isShowModal = false;
  @track isResourceView;
  @track isProjectView;
  @track isRecordTypeView;
  // design attributes
  @api defaultView;
  @track visible = false;
  @track sDate;
  @track staffData;
  @track allocationList;
  @track visibleData;
  @track finalStaffData = [];
  @track allocationId;
  // navigation
  @track startDateUTC; // sending to backend using time
  @track endDateUTC; // sending to backend using time
  @track formattedStartDate; // Title (Date Range)
  @track formattedEndDate; // Title (Date Range)
  @track dates = []; // Dates (Header)
  dateShift = 7; // determines how many days we shift by
  @track holidayList;
  @track holidayDateList = [];
  @track isHome=false;

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
  @track shiftID;
  @track currentUserRole;
  @track editTimings;
  @track facSelectedValue;
  @track recordsFalg=true;
  @track pageSizeOptions = [5, 10, 25, 50, 75, 100];
  @track paginationRecords=[];
  @track totalRecords = 0; //Total no.of records
  @track pageSize; //No.of records to be displayed per page
  @track totalPages; //Total no.of pages
  @track pageNumber = 1; //Page number  
  wiredReimbursement;
  @track dayWiseReimburesements=[];
  @track totalReiAmount=0.00;
  @track grandTotal=0.00;
  @track totalShiftWages=0.00;
  @track isReimburesementsTable=false;
  @track checklistData = [];
  @track error;
  wiredCheckListResponse;
  @track addShiftId = null;
  @track isShowChecklsit=false;
  @track isShowActivity=false;
  @track shiftActivity;
  wiredActivityresponse;
  @track activitydata=[];
  @track state;
  @track staffid;
  @track Shiftdate;
  @track shifts=[];
  @track moreFlag=false;
  @track ShiftRatelabel='Hourly Rate';
  @track shiftType;
  @track currentShiftrates=0;
  @track varianceRate=0;
  @track SleepOverNightHourlyRates=0;
  @track isExtendedShift=false;
  @track isSleepOver=false;
  @track extendedWage=0;
  @track sleepOverWage=0;
  @track extendedDuartion=0;
  @track sleepovernightshiftduartion=0;
  userId = Id;
  @track staffDetails = [];
  @track enddate;
  @track shiftEndtime;
  @track rmInvoiceFlag=false;
  @track isLongMorningShift=false;
  @track isLongAfternoonShift=false;
  @track isLongNightShift=false;
  @track isLongSleepoverShift=false;
  @track isCustomShifts =false;
  @track columns = [
    { label: 'Invoice No', fieldName: 'Name',  initialWidth: 80 },
    { label: 'Start Date', fieldName: 'Start_Date__c',  initialWidth:150,type: 'date', 
      typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}}, 
    { label: 'End Date', fieldName: 'End_Date__c',  initialWidth: 150,type: 'date', 
    typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}},
    { label: 'Issue Date', fieldName: 'Date_Issued__c',  initialWidth: 150, type: 'date',
      typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"} },
   /*  { label: 'View Invoice', fieldName: 'Amazon_URL__c',  initialWidth: 150 ,
       type: 'url'
    }, */
    {
      type: 'action',
      label: 'Action',  
      initialWidth: 300, 
      typeAttributes: { rowActions: actions },
    }
  ];


  activeSections = ['StaffDetails','OriginalStaffDetails', 'CompletedStaffDetails', 'ExtendedShift', 'SleepoverShift'];
  @track sectionFlags = {
    staffDetails: true,
    OriginalStaffDetails: true,
    CompletedStaffDetails: true,
    ExtendedShift: true,
    SleepoverShift: true,
    longMorningShift:true,
    longAfternoonShift:true,
    longNightShift:true,
    LongSleepoVershift:true,
    CustomShift:true
    
};
@track extendedHoursandmins=''

// Icons for the toggle buttons
@track sectionIcons = {
    staffDetails: '\u2B9F', 
    OriginalStaffDetails: '\u2B9F', 
    CompletedStaffDetails: '\u2B9F', 
    ExtendedShift: '\u2B9F', 
    SleepoverShift: '\u2B9F',
    longMorningShift:'\u2B9F',
    longAfternoonShift:'\u2B9F',
    longNightShift:'\u2B9F',
    LongSleepoVershift:'\u2B9F', 
    CustomShift:'\u2B9F'
    
};
handleSectionToggle(event) {
    const sectionId = event.currentTarget.dataset.id;
    const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);

    if (!this.sectionFlags[sectionId]) {
        // First click: Set the section to true so it loads in the DOM
        this.sectionFlags[sectionId] = true;
    } else {
        // From second click onwards: Just toggle the hidden-section class
        sectionElement.classList.toggle('hidden-section');
    }

    // Toggle the icon dynamically
    this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
}

  get isDesktop() {
    return FORM_FACTOR === 'Large';
  }

  get isMobile() {
    return FORM_FACTOR === 'Small';
  }

    @wire(getCheckListByShiftId, { addShiftId: '$addShiftId' })
    wiredChecklist(response) {
        this.wiredCheckListResponse = response;
         this.checklistData = [];
        const { data, error } = response;
        
        if (data) {
            this.checklistData = data.checklist;
            console.log('check list data '+JSON.stringify( this.checklistData ));
            this.error = undefined;
          
        } else if (error) {
            this.error = error;
            this.checklistData = [];
        }
    }

  @wire(getActivityLog, { shiftWithStaffID: '$shiftID' })
      wiredActivity(response) {
          this.wiredActivityresponse = response;
         this.activitydata = [];
          const { data, error } = response;
         
          if (data) {
          
              this.activitydata = data.records;
              console.log('Activity list data '+JSON.stringify( this.activitydata ));
              this.error = undefined;
            
          } else if (error) {
              this.error = error;
              this.activitydata = [];
          }
      }

  @wire(getRecord, { recordId: Id, fields: [UsrRoleName ]}) 
    currentUserInfo({error, data}) {
       // console.log('userid',Id);
       // console.log('data',JSON.stringify(data));
       // console.log('error',JSON.stringify(error));
        if (data) {
          this.currentUserRole =data.fields.User_Role__c.value;
         // console.log('role==>'+this.currentUserRole);
          if(this.currentUserRole =='Portal Account Partner Executive' || this.currentUserRole == 'Portal Account Partner Manager' || this.currentUserRole =='CEO' || this.currentUserRole =='Admin'){
            this.editTimings=true;
          }else{
            this.editTimings=false;
          }
        }
    }
    
    renderedCallback() {
      /*  if (this.jsPDFInitialized) {
        return; // Prevent reloading scripts multiple times
    }  */
      Promise.all([
        // loadScript(this, Dompurify),
        
          loadScript(this, jsPDF),
         loadScript(this, autoTable),
         //this line of code is for using custom font in jspdf because jspdf supports only few fonts like courier,times-roman and helvitica.
         //to use custom font we have downloaded the font from google which is .ttf converted ttf to js and upload in static resource.
         loadScript(this, robotoFont)
        
          ]).then(() => {   
             this.jsPDFInitialized = true;
            console.log('✅ jsPDF and ROBOTO font loaded');
 
            // ✅ Register the Roboto font manually
            if (window.jspdf && window.callAddFont) {
                window.jspdf.jsPDF.API.events.push(['addFonts', window.callAddFont]);
                console.log('✅ Roboto font registered via callAddFont');
            } else {
                console.warn('⚠️ callAddFont or jsPDF not available in window scope');
            }
 
            // Verify if font is registered
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            console.log('🧾 Available fonts:', doc.getFontList());  
           // console.log("JS loaded jsPDF");
          }).catch(error => {
           // console.error("Error " + error);
          });;
  }

  connectedCallback() {
    this.isHome=true;

    this.defaultView = 'View by Day';
    Promise.all([
      loadScript(this, jsPDF),
      loadScript(this, momentJS)
    ]).then(() => {
      switch (this.defaultView) {
        case "View by Week":
          this.setView("7/7");
          break;
        default:
          this.setView("1/7");
      }
      this.setStartDate(new Date());
    });
    getFacilityData().then(response => {
      this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }))
      this.facilityVal=this.facilityOptions[0].value;
      this.facSelectedValue=this.facilityVal;
     console.log('facility first value'+this.facilityOptions[0].value);
    /*  holidayList().then(response => {
      this.holidayList = response;
      });  */
      if(this.facilityVal){
        organizationDetails().then(response => {
          // console.log('calling response raja', JSON.stringify(response));
           this.invoiceData = response.listofPriceBook;
          // console.log('calling data blob', response.listofPriceBook.Id);
          // console.log('calling data blob', response.bolbdata);
           this.orgId = response.listofPriceBook.Id;
           this.orgname = response.listofPriceBook.Name;
           this.abn = response.listofPriceBook.ABN__c;
           this.rcti = response.listofPriceBook.RCTI__c;
           this.address =response.listofPriceBook.Address_Latest__Street__s
           this.statePostal =response.listofPriceBook.Address_Latest__City__s+','+  response.listofPriceBook.Address_Latest__StateCode__s + ',' + response.listofPriceBook.Address_Latest__PostalCode__s;
           this.contactNo = response.listofPriceBook.Contact_No__c;
           this.bank = response.listofPriceBook.Bank__c;
           this.accountNo = response.listofPriceBook.Account_Number__c;
           this.accountName = response.listofPriceBook.Account_Name__c;
           this.bsb = response.listofPriceBook.BSB__c;
           this.desc = response.listofPriceBook.Description__c;
           this.orgLogo = response.bolbdata;
           this.state =response.listofPriceBook.Address_Latest__StateCode__s;
          // console.log('invoiceData data ', JSON.stringify(this.invoiceData));
          // console.log('orgId>>>>', this.orgId);
         });
        this.handleVisbility();
      }
  
    }).catch(err => {
     // console.log(err);
    });
  }

  /*** Navigation ***/
  setStartDate(_startDate) {
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
    this.endDate = moment(this.startDate)
      .add(this.view.slots * this.view.slotSize - 1, "days")
      .toDate();
    this.endDateUTC =
      moment(this.endDate)
        .utc()
        .valueOf() -
      moment(this.endDate).utcOffset() * 60 * 1000 +
      "";
    this.formattedEndDate = this.endDate.toLocaleDateString();

    const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    today = today.getTime();

    let dates = {};

    for (let date = moment(this.startDate); date <= moment(this.endDate); date.add(this.view.slotSize, "days")) {
      let index = date.format("YYYYMM");
      if (!dates[index]) {
        dates[index] = {
          dayName: '',
          name: date.format("MMMM"),
          days: []         
        };
      }

      let day = {
        class: "slds-col slds-p-vertical_x-small slds-m-top_x-small lwc-timeline_day",
        label: date.format("MM/DD/YYYY"),
        label1: date.format("DD/MM/YYYY"),
        start: date.toDate(),
        duration: 0
      };
      if (this.view.slotSize > 1) {
        let end = moment(date).add(this.view.slotSize - 1, "days");
        day.end = end.toDate();
      } else {
        day.end = date.toDate();
        day.dayName = date.format("ddd");
        if (date.day() === 0) {
          day.class = day.class + " lwc-is-week-end";
        }
      }

      if (today >= day.start && today <= day.end) {
        day.class += " lwc-is-today";
      }

      dates[index].days.push(day);
      dates[index].style =
        "width: calc(" +
        dates[index].days.length +
        "/" +
        this.view.slots +
        "*100%)";
    }

    // reorder index
    this.dates = Object.values(dates);

    let dateLoad = new Date(this.datePickerString);
    let year = dateLoad.getFullYear();
      let month = (dateLoad.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, so add 1
      let day = dateLoad.getDate().toString().padStart(2, '0');
      let formattedDate = `${year}-${month}-${day}`;

    console.log('for holiday list parameter--->'+formattedDate+this.state);
    if (formattedDate && this.state) {
      holidayList({ datePicker: formattedDate, state: this.state })
          .then(response => {
              this.holidayList = response;
              console.log('Holiday list:', JSON.stringify(this.holidayList));
              this.updateHolidayDates();
          })
          .catch(error => {
              console.error('Error fetching holiday list:', error);
          });
          

  }
}

updateHolidayDates() {
      
  const todayDate = new Date().toISOString().split('T')[0];
  this.dates.forEach(month => {
month.days.forEach(day => {
    if (day.start instanceof Date) {
        const formattedDate = day.start.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD

        // Check if current day is a holiday
        const holiday = this.holidayList.find(h => h.Date__c === formattedDate);

        if (formattedDate === todayDate && holiday) {
            // If today is also a holiday, keep holiday name but prioritize today's color
            day.holidayName = holiday.Holiday_Name__c;
            day.bgColor = 'bgColor3'; // Current date color takes priority
        } else if (holiday) {
            // If it's just a holiday, apply holiday color
            day.holidayName = holiday.Holiday_Name__c;
            day.bgColor = 'bgColor1';
        } else if (formattedDate === todayDate) {
            // If it's just today, apply current date color
            day.bgColor = 'bgColor3';
        } else {
            // Normal day
            day.holidayName = "";
            day.bgColor = 'bgColor2';
        }
    } else {
        console.warn('Invalid day.start value:', day.start);
    }
});
});

  console.log('Updated dates with holidays:', JSON.stringify(this.dates));
}
fetchShifts() {
  getMultipleShiftsdata({ shiftDate: this.Shiftdate, staffId: this.staffid })
      .then(result => {
          this.shifts = result;
          this.error = undefined;
          console.log('More shifts'+JSON.stringify(this.shifts));
      })
      .catch(error => {
          this.error = error;
          this.shifts = [];
      });
}
  navigateToToday() {
    this.setStartDate(new Date());
    this.handleVisbility();
  }

  navigateToPrevious() {
    let _startDate = new Date(this.datePickerString);  
    _startDate.setDate(_startDate.getDate() - this.dateShift);
   // console.log('strtdt>',this.startDate);
   // console.log('enddt>',this.endDate);
    this.setStartDate(_startDate);
    this.handleVisbility();
  }

  navigateToNext() {
    let _startDate = new Date(this.datePickerString);  
    _startDate.setDate(_startDate.getDate() + this.dateShift);
    this.setStartDate(_startDate);
    this.handleVisbility();
  }

  navigateToDay(event) {
    this.setStartDate(new Date(event.target.value));
   // console.log(this.startDate);
    this.handleVisbility();
  }

  setView(value) {
    let values = value.split("/");
    this.view.value = value;
    this.view.slotSize = parseInt(value[0], 10);
    this.view.slots = parseInt(values[1], 10);
  }

  handleViewChange(event) {
    this.setView(event.target.value);
    this.setDateHeaders();
    this.handleVisbility();
  }
  /*** /Navigation ***/

  handleButton(event) {
    let vis = event.target.dataset.name;
  }

  handleSave(event) {
    let vis = event.target.dataset.name;
    let facId = event.currentTarget.dataset.id;
    this.staffData = facId;
    this.sDate = vis;
   // console.log("this.sDate final", this.sDate);
    this.isShowModal = true;
  }

  handleChange(event) {
    this.facilityVal = event.detail.value;
    this.facSelectedValue=event.detail.value;
    this.handleVisbility();

  }

  handleVisbility() {
    this.isHome=true;
    let staffList = [];
    let dateList = [];
    var dayValue = '';
    var finalStaffDate = '';
    var staffFinalDate = '';
    var daysValues = [];
   
    getStaffAllocation({ facId: this.facilityVal }).then(response => {
      this.records = response;
      if(this.records.length >0){
        this.recordsFalg=true;
      }else{
        this.recordsFalg=false;
      }
      staffList = response;
      this.finalStaffData = [];
      this.records.forEach((record) => {
        this.dates.forEach((record1) => {
          var style = record1.style;
         // console.log("style>>>>", style);
          var daysList = record1.days;
          for (var i = 0; i < daysList.length; i++) {
            daysValues.push(moment(daysList[i].label).format('YYYY-MM-DD'));
          }
        });
        for (var j = 0; j < daysValues.length; j++) {
          var dayName = 'Day' + j;

          dayValue = dayValue + '"' + dayName + '"' + ':' + '"' + daysValues[j] + '"' + ',';
        }
        var description = "";
        if (record.Description__c != null || record.Description__c != undefined){          
          if (record.Description__c.search('\n') || record.Description__c.search('\n\r') || record.Description__c.search('\r') || record.Description__c.search('\r\n') || record.Description__c.search('\\'))
          {
            description = record.Description__c.replaceAll('\n', '\\n').replaceAll('\r', '\\r').replaceAll('\r\n', '\\r\\n');
          }
          else
          {
            description = record.Description__c;
          }            
        }
        else
        {
          description = record.Description__c;
        }

        finalStaffDate = '"Id"' + ':' + '"' + record.Id + '"' + ',' + '"Name"' + ':' + '"' + record.Name + '"' + ',' + '"Last_Name__c"' + ':' + '"' + record.Last_Name__c + '"' +','+'"hoursRate"'+':'+'"'+record.Invoice_Rate__c+'"'+','+'"role"'+':'+'"'+record.Role__c+'"'+','+'"invoiceTo"'+':'+'"'+record.Invoice_To__c+'"'+','+'"description"'+':'+'"'+description+'"'+
          ',' + '"bgcolour1"' + ':' + '""' + ',' + '"bgcolour2"' + ':' + '""' + ',' + '"bgcolour3"' + ':' + '""' + ',' + '"bgcolour4"' + ':' + '""' + ',' + '"bgcolour5"' + ':' + '""' + ',' + '"bgcolour6"' + ':' + '"bgcolor"' + ',' + '"bgcolour7"' + ':' + '"bgcolor"' + ',' + '"sType1"' + ':' + '""' + ',' + '"sType2"' + ':' + '""' +
          ',' + '"sType3"' + ':' + '""' + ',' + '"sType4"' + ':' + '""' + ',' + '"sType5"' + ':' + '""' + ',' + '"sType6"' + ':' + '""' + ',' + '"sType7"' + ':' + '""' +
          ',' + '"alocId1"' + ':' + '""' + ',' + '"alocId2"' + ':' + '""' + ',' + '"alocId3"' + ':' + '""' + ',' + '"alocId4"' + ':' + '""' +
          ',' + '"alocId5"' + ':' + '""' + ',' + '"alocId6"' + ':' + '""' + ',' + '"alocId7"' + ':' + '""' + ',' + '"holiday1"' + ':' + '""' + ',' + '"holiday2"' + ':' + '""' + ',' + '"holiday3"' + ':' + '""' + ',' + '"holiday4"' + ':' + '""' + ',' + '"holiday5"' + ':' + '""' + ',' + '"style"' + ':' + '"style"';
        staffFinalDate = '{' + dayValue + finalStaffDate + '}';
       // console.log('staffFinalDate',staffFinalDate);
        const jsonRec = JSON.parse(staffFinalDate);
        this.finalStaffData.push(jsonRec);
      });
      console.log('pick  date1 '+this.datePickerString);
      let  yearStart=this.startDate.getFullYear();
      let  monthStart=(this.startDate.getMonth() + 1).toString().padStart(2, '0');
      let  daystart=this.startDate.getDate().toString().padStart(2, '0');
      let  weekStartDate = `${yearStart}-${monthStart}-${daystart}`;
      console.log('start date1 '+weekStartDate);

      let  yearEnd=this.endDate.getFullYear();
      let  monthEnd=(this.endDate.getMonth() + 1).toString().padStart(2, '0');
      let  dayEnd=this.endDate.getDate().toString().padStart(2, '0');
      let  weekEndDate = `${yearEnd}-${monthEnd}-${dayEnd}`;
      console.log('End date1 '+weekEndDate);

      console.log('facility id '+this.facilityVal);

      getAllShiftWithSatff({faciID:this.facilityVal,StartDate:weekStartDate,EndDate:weekEndDate}).then(response=>{
        this.allocationList = response;
        //console.log('Allocation List length'+ this.allocationList.length)
        console.log('Allocation List'+JSON.stringify( this.allocationList));
        for (var i = 0; i < this.finalStaffData.length; i++) {
          var hours=0;
          let  shiftIDLiSt=[];
          let rosterstatus='';
          let tempArry1=[];let tempArry2=[];let tempArry3=[];let tempArry4=[]; let  tempArry5=[]; let tempArry6=[];
          let  tempArry7=[];
         
          for (var j = 0; j < this.allocationList.length; j++) {
           
           // console.log('shiftwithsatff length'+ this.allocationList.length)
            if (this.finalStaffData[i].Id == this.allocationList[j].Staff__c && (this.finalStaffData[i].Day0 == this.allocationList[j].Date__c)) {
      
              this.finalStaffData[i]['bgcolour1'] = 'slds-theme_message';
              let tempConRec={};
              tempConRec.shifttime= this.allocationList[j].Start_time_Formula__c+'-'+this.allocationList[j].End_time_formula__c;
              tempConRec.id=this.allocationList[j].Id;
              tempConRec.sType=this.allocationList[j].Add_Shift_Duration_hh_mm__c;
              tempConRec.shiftWage=this.allocationList[j].Shift_Wage__c;
              tempConRec.shiftType=this.allocationList[j].Add_Shift__r.Shift_Type__c;
              tempConRec.addShiftId=this.allocationList[j].Add_Shift__c;
              tempConRec.currentShiftRates=this.allocationList[j].Staff_Final_Hourly_Rate__c;
              tempConRec.extendedDuartion=this.allocationList[j].Extended_Duration__c;
              tempConRec.extendedVarianceRate=this.allocationList[j].Variance_Rate__c;
              tempConRec.sleepOverNightShiftHours=this.allocationList[j].Sleepover_Night_Shift_hours__c  ;
              tempConRec.sleepoverNightShiftRate=this.allocationList[j].Sleepover_Night_Shift_Hourly_Rate__c;
              tempConRec.extendedDurationInHoursandMins=this.allocationList[j].Extended_Duration_in_Hours_and_Mins__c;
              tempConRec.extendedWages=this.allocationList[j].Variance_Wage__c;
              tempConRec.sleepoverNightWages=this.allocationList[j].Sleepover_Variance_Wages__c;
              tempConRec.enddate=this.allocationList[j].End_Date__c;
              if(this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c){
                tempConRec.actualDuration=this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c;
                }
              if(this.allocationList[j].Actual_Duration__c){
                hours=hours+this.allocationList[j].Actual_Duration__c;
                }
                if(this.allocationList[j].Extended_Duration__c){
                  tempConRec.isExtended=parseFloat(this.allocationList[j].Extended_Duration__c)>0?true:false;
                  hours=hours+this.allocationList[j].Extended_Duration__c;
                }
              //  console.log(' EXTENDED DURATION IN fIRST DAY '+tempConRec.extendedDuartion)
                
            
              if(this.allocationList[j].Approval_Status__c && this.allocationList[j].Approval_Status__c !=null ){
                rosterstatus=this.allocationList[j].Approval_Status__c;
              }
              shiftIDLiSt.push(this.allocationList[j].Id);
              tempArry1.push(tempConRec);
              let IndexArry1=[];
              IndexArry1.push(tempArry1[0])
              this.finalStaffData[i]['arryOFshifts1'] = tempArry1;
              this.finalStaffData[i]['Firstshift'] = IndexArry1;
              this.finalStaffData[i]['hasMoreShifts1'] = tempArry1.length>1 ? true:false;
            }
            if (this.finalStaffData[i].Id == this.allocationList[j].Staff__c && (this.finalStaffData[i].Day1 == this.allocationList[j].Date__c)) {      
              this.finalStaffData[i]['bgcolour2'] = 'slds-theme_message';
              let tempConRec={};
              tempConRec.shifttime= this.allocationList[j].Start_time_Formula__c+'-'+this.allocationList[j].End_time_formula__c;
              tempConRec.id=this.allocationList[j].Id;
              tempConRec.sType=this.allocationList[j].Add_Shift_Duration_hh_mm__c;
              tempConRec.shiftWage=this.allocationList[j].Shift_Wage__c;
              tempConRec.addShiftId=this.allocationList[j].Add_Shift__c;
              tempConRec.shiftType=this.allocationList[j].Add_Shift__r.Shift_Type__c;
              tempConRec.currentShiftRates=this.allocationList[j].Staff_Final_Hourly_Rate__c;
            
              tempConRec.extendedDuartion=this.allocationList[j].Extended_Duration__c;
              tempConRec.extendedVarianceRate=this.allocationList[j].Variance_Rate__c;
              tempConRec.sleepOverNightShiftHours=this.allocationList[j].Sleepover_Night_Shift_hours__c  ;
              tempConRec.sleepoverNightShiftRate=this.allocationList[j].Sleepover_Night_Shift_Hourly_Rate__c;
              tempConRec.extendedWages=this.allocationList[j].Variance_Wage__c;
              tempConRec.sleepoverNightWages=this.allocationList[j].Sleepover_Variance_Wages__c;
              tempConRec.extendedDurationInHoursandMins=this.allocationList[j].Extended_Duration_in_Hours_and_Mins__c;
              tempConRec.enddate=this.allocationList[j].End_Date__c;
              if(this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c){
                tempConRec.actualDuration=this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c;
                }
              if(this.allocationList[j].Actual_Duration__c){
              hours=hours+this.allocationList[j].Actual_Duration__c;
              }
              if(this.allocationList[j].Extended_Duration__c){
                hours=hours+this.allocationList[j].Extended_Duration__c;
                tempConRec.isExtended=parseFloat(this.allocationList[j].Extended_Duration__c)>0?true:false;
              }
            
              if(this.allocationList[j].Approval_Status__c &&  this.allocationList[j].Approval_Status__c !=null){
                rosterstatus=this.allocationList[j].Approval_Status__c;
              }
              shiftIDLiSt.push(this.allocationList[j].Id);
           
              tempArry2.push(tempConRec);
              let IndexArry2=[];
              IndexArry2.push(tempArry2[0]);
              this.finalStaffData[i]['arryOFshifts2'] = tempArry2;
              this.finalStaffData[i]['secondshift'] = IndexArry2;
              this.finalStaffData[i]['hasMoreShifts2'] = tempArry2.length>1 ? true:false;
            }
            if (this.finalStaffData[i].Id == this.allocationList[j].Staff__c && (this.finalStaffData[i].Day2 == this.allocationList[j].Date__c)) {
              this.finalStaffData[i]['bgcolour3'] = 'slds-theme_message';
              let tempConRec={};
              tempConRec.shifttime= this.allocationList[j].Start_time_Formula__c+'-'+this.allocationList[j].End_time_formula__c;
              tempConRec.id=this.allocationList[j].Id;
              tempConRec.sType=this.allocationList[j].Add_Shift_Duration_hh_mm__c;
              tempConRec.shiftWage=this.allocationList[j].Shift_Wage__c;
              tempConRec.addShiftId=this.allocationList[j].Add_Shift__c;
              tempConRec.shiftType=this.allocationList[j].Add_Shift__r.Shift_Type__c;
              tempConRec.currentShiftRates=this.allocationList[j].Staff_Final_Hourly_Rate__c;
            
              tempConRec.extendedDuartion=this.allocationList[j].Extended_Duration__c;
              tempConRec.extendedVarianceRate=this.allocationList[j].Variance_Rate__c;
              tempConRec.sleepOverNightShiftHours=this.allocationList[j].Sleepover_Night_Shift_hours__c  ;
              tempConRec.sleepoverNightShiftRate=this.allocationList[j].Sleepover_Night_Shift_Hourly_Rate__c;
              tempConRec.extendedWages=this.allocationList[j].Variance_Wage__c;
              tempConRec.sleepoverNightWages=this.allocationList[j].Sleepover_Variance_Wages__c;
              tempConRec.extendedDurationInHoursandMins=this.allocationList[j].Extended_Duration_in_Hours_and_Mins__c;
              tempConRec.enddate=this.allocationList[j].End_Date__c;
              if(this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c){
                tempConRec.actualDuration=this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c;
                }
              if(this.allocationList[j].Actual_Duration__c){
                hours=hours+this.allocationList[j].Actual_Duration__c;
                }
                if(this.allocationList[j].Extended_Duration__c){
                  tempConRec.isExtended=parseFloat(this.allocationList[j].Extended_Duration__c)>0?true:false;
                  hours=hours+this.allocationList[j].Extended_Duration__c;
                }
             
              if(this.allocationList[j].Approval_Status__c && this.allocationList[j].Approval_Status__c !=null){
                rosterstatus=this.allocationList[j].Approval_Status__c;
              }
              shiftIDLiSt.push(this.allocationList[j].Id);
              tempArry3.push(tempConRec);
              let IndexArry3=[];
              IndexArry3.push(tempArry3[0]);
              
              this.finalStaffData[i]['arryOFshifts3'] = tempArry3;
              this.finalStaffData[i]['Thirdshift'] = IndexArry3;
              this.finalStaffData[i]['hasMoreShifts3'] = tempArry3.length>1 ? true:false;
            }
            if (this.finalStaffData[i].Id == this.allocationList[j].Staff__c && (this.finalStaffData[i].Day3 == this.allocationList[j].Date__c)) {
              this.finalStaffData[i]['bgcolour4'] = 'slds-theme_message';
              let tempConRec={};
              tempConRec.shifttime= this.allocationList[j].Start_time_Formula__c+'-'+this.allocationList[j].End_time_formula__c;
              tempConRec.id=this.allocationList[j].Id;
              tempConRec.sType=this.allocationList[j].Add_Shift_Duration_hh_mm__c;
              tempConRec.shiftWage=this.allocationList[j].Shift_Wage__c;
              tempConRec.addShiftId=this.allocationList[j].Add_Shift__c;
              tempConRec.shiftType=this.allocationList[j].Add_Shift__r.Shift_Type__c;
              tempConRec.currentShiftRates=this.allocationList[j].Staff_Final_Hourly_Rate__c;
           
              tempConRec.extendedDuartion=this.allocationList[j].Extended_Duration__c;
              tempConRec.extendedVarianceRate=this.allocationList[j].Variance_Rate__c;
              tempConRec.sleepOverNightShiftHours=this.allocationList[j].Sleepover_Night_Shift_hours__c  ;
              tempConRec.sleepoverNightShiftRate=this.allocationList[j].Sleepover_Night_Shift_Hourly_Rate__c;
              tempConRec.extendedWages=this.allocationList[j].Variance_Wage__c;
              tempConRec.sleepoverNightWages=this.allocationList[j].Sleepover_Variance_Wages__c;
              tempConRec.extendedDurationInHoursandMins=this.allocationList[j].Extended_Duration_in_Hours_and_Mins__c;
              tempConRec.enddate=this.allocationList[j].End_Date__c;
              if(this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c){
                tempConRec.actualDuration=this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c;
                }
                if(this.allocationList[j].Actual_Duration__c){
                  hours=hours+this.allocationList[j].Actual_Duration__c;
                  }
                  if(this.allocationList[j].Extended_Duration__c){
                    tempConRec.isExtended=parseFloat(this.allocationList[j].Extended_Duration__c)>0?true:false;
                    hours=hours+this.allocationList[j].Extended_Duration__c;
                  }
             
              if(this.allocationList[j].Approval_Status__c && this.allocationList[j].Approval_Status__c !=null){
                rosterstatus=this.allocationList[j].Approval_Status__c;
              }
              shiftIDLiSt.push(this.allocationList[j].Id);
              tempArry4.push(tempConRec);
              let IndexArry4=[];
              IndexArry4.push(tempArry4[0]);
              this.finalStaffData[i]['arryOFshifts4'] = tempArry4;
              this.finalStaffData[i]['Fouthshift'] = IndexArry4;
              this.finalStaffData[i]['hasMoreShifts4'] = tempArry4.length>1 ? true:false;
          
            }
            if (this.finalStaffData[i].Id == this.allocationList[j].Staff__c && (this.finalStaffData[i].Day4 == this.allocationList[j].Date__c)) {
              this.finalStaffData[i]['bgcolour5'] = 'slds-theme_message';
              let tempConRec={};
              tempConRec.shifttime= this.allocationList[j].Start_time_Formula__c+'-'+this.allocationList[j].End_time_formula__c;
              tempConRec.id=this.allocationList[j].Id;
              tempConRec.sType=this.allocationList[j].Add_Shift_Duration_hh_mm__c;
              tempConRec.shiftWage=this.allocationList[j].Shift_Wage__c;
              tempConRec.addShiftId=this.allocationList[j].Add_Shift__c;
              tempConRec.shiftType=this.allocationList[j].Add_Shift__r.Shift_Type__c;
              tempConRec.currentShiftRates=this.allocationList[j].Staff_Final_Hourly_Rate__c;
          
              tempConRec.extendedDuartion=this.allocationList[j].Extended_Duration__c;
              tempConRec.extendedVarianceRate=this.allocationList[j].Variance_Rate__c;
              tempConRec.sleepOverNightShiftHours=this.allocationList[j].Sleepover_Night_Shift_hours__c  ;
              tempConRec.sleepoverNightShiftRate=this.allocationList[j].Sleepover_Night_Shift_Hourly_Rate__c;
              tempConRec.extendedWages=this.allocationList[j].Variance_Wage__c;
              tempConRec.sleepoverNightWages=this.allocationList[j].Sleepover_Variance_Wages__c;
              tempConRec.extendedDurationInHoursandMins=this.allocationList[j].Extended_Duration_in_Hours_and_Mins__c;
              tempConRec.enddate=this.allocationList[j].End_Date__c;
              if(this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c){
                tempConRec.actualDuration=this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c;
                }
              if(this.allocationList[j].Actual_Duration__c){
                hours=hours+this.allocationList[j].Actual_Duration__c;
                }
                if(this.allocationList[j].Extended_Duration__c){
                  tempConRec.isExtended=parseFloat(this.allocationList[j].Extended_Duration__c)>0?true:false;
                  hours=hours+this.allocationList[j].Extended_Duration__c;
                }
            
              if(this.allocationList[j].Approval_Status__c && this.allocationList[j].Approval_Status__c !=null){
                rosterstatus=this.allocationList[j].Approval_Status__c;
              }
              shiftIDLiSt.push(this.allocationList[j].Id);
              tempArry5.push(tempConRec);
              
              let IndexArry5=[];
              IndexArry5.push(tempArry5[0]);
              this.finalStaffData[i]['arryOFshifts5'] = tempArry5;
              this.finalStaffData[i]['Fifthshift'] = IndexArry5;
              this.finalStaffData[i]['hasMoreShifts5'] = tempArry5.length>1 ? true:false;
              
            }
            if (this.finalStaffData[i].Id == this.allocationList[j].Staff__c && (this.finalStaffData[i].Day5 == this.allocationList[j].Date__c)) {
              this.finalStaffData[i]['bgcolour6'] = 'slds-theme_message';
              let tempConRec={};
              tempConRec.shifttime= this.allocationList[j].Start_time_Formula__c+'-'+this.allocationList[j].End_time_formula__c;
              tempConRec.id=this.allocationList[j].Id;
              tempConRec.sType=this.allocationList[j].Add_Shift_Duration_hh_mm__c;
              tempConRec.shiftWage=this.allocationList[j].Shift_Wage__c;
              tempConRec.addShiftId=this.allocationList[j].Add_Shift__c;
              tempConRec.shiftType=this.allocationList[j].Add_Shift__r.Shift_Type__c;
              tempConRec.currentShiftRates=this.allocationList[j].Staff_Final_Hourly_Rate__c;
           
              tempConRec.extendedDuartion=this.allocationList[j].Extended_Duration__c;
              tempConRec.extendedVarianceRate=this.allocationList[j].Variance_Rate__c;
              tempConRec.sleepOverNightShiftHours=this.allocationList[j].Sleepover_Night_Shift_hours__c  ;
              tempConRec.sleepoverNightShiftRate=this.allocationList[j].Sleepover_Night_Shift_Hourly_Rate__c;
              tempConRec.extendedWages=this.allocationList[j].Variance_Wage__c;
              tempConRec.sleepoverNightWages=this.allocationList[j].Sleepover_Variance_Wages__c;
              tempConRec.extendedDurationInHoursandMins=this.allocationList[j].Extended_Duration_in_Hours_and_Mins__c;
              tempConRec.enddate=this.allocationList[j].End_Date__c;
              if(this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c){
                tempConRec.actualDuration=this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c;
                }
              if(this.allocationList[j].Actual_Duration__c){
                hours=hours+this.allocationList[j].Actual_Duration__c;
                }
                if(this.allocationList[j].Extended_Duration__c){
                  console.log(' extended duartion in loop '+this.allocationList[j].Extended_Duration__c);
                  tempConRec.isExtended=parseFloat(this.allocationList[j].Extended_Duration__c)>0?true:false;
                  hours=hours+this.allocationList[j].Extended_Duration__c;
                }
              if(this.allocationList[j].Approval_Status__c && this.allocationList[j].Approval_Status__c !=null){
                rosterstatus=this.allocationList[j].Approval_Status__c;
              }
              shiftIDLiSt.push(this.allocationList[j].Id);
              tempArry6.push(tempConRec);
              let IndexArry6=[];
              IndexArry6.push(tempArry6[0]);
              this.finalStaffData[i]['arryOFshifts6'] = tempArry6;
              this.finalStaffData[i]['Sixthshift'] = IndexArry6;
              this.finalStaffData[i]['hasMoreShifts6'] = tempArry6.length>1 ? true:false;
            }
            if (this.finalStaffData[i].Id == this.allocationList[j].Staff__c && (this.finalStaffData[i].Day6 == this.allocationList[j].Date__c)) {
              this.finalStaffData[i]['bgcolour7'] = 'slds-theme_message';
              let tempConRec={};
              tempConRec.shifttime= this.allocationList[j].Start_time_Formula__c+'-'+this.allocationList[j].End_time_formula__c;
              tempConRec.id=this.allocationList[j].Id;
              tempConRec.sType=this.allocationList[j].Add_Shift_Duration_hh_mm__c;
              tempConRec.shiftWage=this.allocationList[j].Shift_Wage__c;
              tempConRec.addShiftId=this.allocationList[j].Add_Shift__c;
              tempConRec.shiftType=this.allocationList[j].Add_Shift__r.Shift_Type__c;
              tempConRec.currentShiftRates=this.allocationList[j].Staff_Final_Hourly_Rate__c;
          
              tempConRec.extendedDuartion=this.allocationList[j].Extended_Duration__c;
              tempConRec.extendedVarianceRate=this.allocationList[j].Variance_Rate__c;
              tempConRec.sleepOverNightShiftHours=this.allocationList[j].Sleepover_Night_Shift_hours__c  ;
              tempConRec.sleepoverNightShiftRate=this.allocationList[j].Sleepover_Night_Shift_Hourly_Rate__c;
              tempConRec.extendedWages=this.allocationList[j].Variance_Wage__c;
              tempConRec.sleepoverNightWages=this.allocationList[j].Sleepover_Variance_Wages__c;
              tempConRec.extendedDurationInHoursandMins=this.allocationList[j].Extended_Duration_in_Hours_and_Mins__c;
              tempConRec.enddate=this.allocationList[j].End_Date__c;
              if(this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c){
                tempConRec.actualDuration=this.allocationList[j].Actual_Duration_In_Hours_and_Mins__c;
                }
              if(this.allocationList[j].Actual_Duration__c){
                hours=hours+this.allocationList[j].Actual_Duration__c;
                }
                if(this.allocationList[j].Extended_Duration__c){
                  tempConRec.isExtended=parseFloat(this.allocationList[j].Extended_Duration__c)>0?true:false;
                  hours=hours+this.allocationList[j].Extended_Duration__c;
                }
             
              if(this.allocationList[j].Approval_Status__c && this.allocationList[j].Approval_Status__c !=null){
                rosterstatus=this.allocationList[j].Approval_Status__c;
              }
              shiftIDLiSt.push(this.allocationList[j].Id);
              tempArry7.push(tempConRec);
              let IndexArry7=[];
              IndexArry7.push(tempArry7[0]);
              this.finalStaffData[i]['arryOFshifts7'] = tempArry7;
              this.finalStaffData[i]['Seventhshift'] = IndexArry7;
              this.finalStaffData[i]['hasMoreShifts7'] = tempArry7.length>1 ? true:false;
            }
            let hoursSplit=(parseFloat(hours).toFixed(2)).split(".");
            console.log('hours split==>'+hoursSplit);
            let hourAndMins=hoursSplit[0]+' Hr:'+((hoursSplit[1]/100)*60).toFixed(0)+' Mins'
           // console.log('hours and minutes==>'+hourAndMins);
            this.finalStaffData[i]['totalHOurs'] = hourAndMins;
            this.finalStaffData[i]['shiftIDList'] = shiftIDLiSt;
            this.finalStaffData[i]['rosterstatus'] = rosterstatus;
  
            if((this.finalStaffData[i]['rosterstatus'] =='' )){
              this.finalStaffData[i]['isSubmitButton']=false;
            }else{
              this.finalStaffData[i]['isSubmitButton']=true;
            }
  
          }
        }
        console.log('staff data==>'+ JSON.stringify(this.finalStaffData));
        this.paginationRecords =this.finalStaffData;              
        this.totalRecords =this.finalStaffData.length; // update total records count                 
        this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
        this.pageNumber = 1;
        this.paginationHelper();
      })
     //console.log('staff data==>'+ JSON.stringify(this.finalStaffData));
    
      
    });
     
    refreshApex(this.finalStaffData);
  }
  handleEditShift(event){
    this.showSpinner = true;
    setTimeout(() => {
      
     this.showSpinner = false;
       }, 2000); 
    this.moreFlag=false;
    this.editflag=true;
    this.isHome=false;
   // console.log('ShiftWithsatffID ==>'+event.currentTarget.dataset.id);
   
    this.dayWiseReimburesements=[];
    this.enddate='';
    this.shiftEndtime='';

    this.totalReiAmount=0.00;
    this.grandTotal=0.00;
    this.totalShiftWages=parseFloat(event.currentTarget.dataset.shiftwages).toFixed(2);
    this.shiftID=event.currentTarget.dataset.id;
    this.addShiftId=event.currentTarget.dataset.addshiftid;
    this.extendedHoursandmins=event.currentTarget.dataset.extendedinhourandmins;
    //console.log('ShiftWages '+event.currentTarget.dataset.shiftwages);
    this.enddate=event.currentTarget.dataset.enddate;

    let etimeParts=event.currentTarget.dataset.totaltime.split('-');
    this.shiftEndtime=etimeParts[1];

    //console.log('enddate '+);
   
    this.shiftType=event.currentTarget.dataset.shifttype;
    this.staffid=event.currentTarget.dataset.staffid;
    console.log('staff id '+this.staffid);
    this.currentShiftrates=event.currentTarget.dataset.currentshiftrates;
    console.log('extended duartion  '+event.currentTarget.dataset.extendedduation);
    this.isExtendedShift=parseFloat(event.currentTarget.dataset.extendedduation)>0?true:false;
    console.log('isextended '+this.isExtendedShift);
   
 
    this.isSleepOver=parseFloat(event.currentTarget.dataset.sleepovernightshift)>0 ?true:false;
    this.SleepOverNightHourlyRates=event.currentTarget.dataset.sleepovernightshiftrate;
    this.varianceRate=event.currentTarget.dataset.extendedvariancerate;
   
    this.extendedWage=0;
    this.sleepOverWage=0;
    this.extendedDuartion=0;
    this.sleepovernightshiftduartion=0;
    this.extendedWage=parseFloat(event.currentTarget.dataset.extendedwages);
    this.sleepOverWage=parseFloat(event.currentTarget.dataset.sleepovernightwages);
    this.sleepovernightshiftduartion =parseFloat(event.currentTarget.dataset.sleepovernightshift);
    this.extendedDuartion=parseFloat(event.currentTarget.dataset.extendedduation)
    console.log('extendedwages '+  this.extendedDuartion);
    console.log('sleepovernightwages '+this.sleepovernightshiftduartion);
     getAddShiftDataById({shiftId:this.shiftID}).then(result=>{
             console.log('shift data '+JSON.stringify(result));
              this.isCustomShifts=this.shiftType=='Custom';
              console.log('isCustomShifts' +this.isCustomShifts);
              this.isLongMorningShift=result.shiftwithstaffdata.Is_long_Morning__c;
              this.isLongAfternoonShift=result.shiftwithstaffdata.Is_Long_Afternoon__c;
              this.isLongNightShift=result.shiftwithstaffdata.Is_Long_Night_Shift__c;
              this.isLongSleepoverShift=result.shiftwithstaffdata.Is_Long_SleepOver__c;

            })
   /*  if(event.currentTarget.dataset.shifttype=='Half Day'){
      this.ShiftRatelabel='Hourly Rate';
    } */
      this.ShiftRatelabel=event.currentTarget.dataset.shifttype=='Sleepover Shift' ?'Allowance':'Hourly Rate';
     

    getShiftReimbursements({shiftId:this.shiftID}).then(response=>{
      response.forEach(rec => {
        if (rec.Approval_Status__c === 'Approved') {
          const amount = rec.Total_Amount__c || 0;  // Fallback to 0 if Amount__c is null/undefined
          this.totalReiAmount += amount;
            }
           
        this.dayWiseReimburesements.push({
            ...rec,
            shiftdate: rec.ShiftDate__c ? new Date(rec.ShiftDate__c).toLocaleDateString('en-GB') : ''
        });
      });
        this.totalReiAmount=this.totalReiAmount.toFixed(2)
        console.log('type of extend' +typeof(this.extendedWage));
        console.log('type of sleepover '+typeof(this.sleepOverWage));
        this.grandTotal=(parseFloat(this.totalShiftWages)+parseFloat(this.totalReiAmount)).toFixed(2);
        if(this.isExtendedShift){
          this.grandTotal = parseFloat(this.grandTotal)+parseFloat(this.extendedWage);
         
        }
        if(this.isSleepOver){
          this.grandTotal = parseFloat(this.grandTotal)+parseFloat(this.sleepOverWage);
        }
        this.grandTotal=  this.grandTotal.toFixed(2);
        //console.log('Reimbursemenst Amount '+this.totalReiAmount);
        if(this.dayWiseReimburesements.length>0){
          this.isReimburesementsTable=true;
        }else{
          this.isReimburesementsTable=false;
        }
      }).catch(error=>{

      });
      refreshApex(this.wiredCheckListResponse);
      refreshApex(this.wiredActivityresponse);
   
   
  }
  @track popupStyle = '';
  handleMoreShift(event){
    
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    let tooltipWidth = 150; // Approximate width of tooltip
    let offsetX = 10; // Small gap from cursor
    let leftPosition = mouseX - tooltipWidth - offsetX;
    if (leftPosition < 0) {
      leftPosition = 10; // Keep a minimum margin from the left edge
  }

        
      
    this.popupStyle = `top: ${mouseY - 117}px; left: ${leftPosition-240}px;`;
    console.log('style'+this.popupStyle);
     this.staffid=event.currentTarget.dataset.id;
     this.Shiftdate=event.currentTarget.dataset.date;
     this.moreFlag=true;
    console.log('staffid and date'+this.staffid+this.Shiftdate);
    this.fetchShifts();
  }
  closeTooltip() {
    this.moreFlag = false;
}
 
  handleeditClose() {
    this.editflag = false;
    this.isHome=true;
    this.isExtendedShift=false;
    this.isSleepOver=false;

  }
  handleUpdate(event){
    event.preventDefault();// stop the form from submitting
    const fields = event.detail.fields;
   // console.log('in this.isExtendedShift'+this.isExtendedShift)
   this.extendedDuartion=parseFloat(this.extendedDuartion);
   this.varianceRate=parseFloat(this.varianceRate);
    fields.Variance_Rate__c=this.varianceRate;
    fields.Extended_Duration__c=this.extendedDuartion;
    fields.Extended_Duration_in_Hours_and_Mins__c=this.extendedHoursandmins;
    console.log('in update'+JSON.stringify(fields))
    this.template.querySelector('lightning-record-edit-form').submit(fields);

  }
    handleeditAllocation(){
      const toastEvent = new ShowToastEvent({
        title: "Success",
        message: "Changes Saved Successfully",
        variant: "success"
      });
    this.dispatchEvent(toastEvent);
    this.editflag = false;
    this.handleVisbility();
    }
    @track submissionFlag=false;
    @track confirmationData={};
     handleSubmission(event){
      let totalHours=event.currentTarget.dataset.totalhours;
      //let totalShiftIdlist=event.currentTarget.dataset.staffidlist;
     // console.log('total hours==>'+totalHours);
      let totalShiftIdlist = new Set();
      const allocarray=event.currentTarget.dataset.staffidlist.split(",");
        for(var s=0;s<allocarray.length;s++){
          totalShiftIdlist.add(allocarray[s]);
          }
          console.log('shift id list  '+Array.from(totalShiftIdlist));

      if(totalHours =='0 Hr:0 Mins'){
            this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Submission Rejected',
                  message: 'Please provide total hours',
                  variant: 'Error'
              })
            );
          }else{
            this.submissionFlag=true;
            this.confirmationData = { totalShiftIdlist, totalHours };
            
          }     
    }
    handlesubmit(event){
      const { totalShiftIdlist, totalHours } = this.confirmationData;
      updateAllocations({shiftIDlist:Array.from(totalShiftIdlist)}).then(response=>{
        const toastEvent = new ShowToastEvent({
          title: "Success",
          message: "Timesheet is Approved.",
          variant: "success"
        });
      this.dispatchEvent(toastEvent);
      this.handleVisbility();
      }).catch(error=>{
        console.log('error=>'+JSON.stringify(error));
        this.dispatchEvent(
          new ShowToastEvent({
              title: 'Shift Rejected',
              message: ((error.body.message.split(',')[1]).split(':'))[0],
              variant: 'Error'
          })
        );
      })
      this.submissionFlag=false;
    }
    handlesubmissionclose(event){
      this.submissionFlag=false;
    }

    @track invoiceRate;
    @track invoiceStartDate;
    @track invoiceEndDate;
    @track invParentId;
    @track invoiceFileName;
    @track invRecords;
    @track ictStaffID;
   // @track ictInvoiceList;
    @track staffFullname;
    @track staffRole;
    @track ictApprovedHours;
    @track tempConRec={}
    @track descrValue;
    @track quantityValue;
    @track unitPrice;
    @track showICtinvoice;
    @track orgId ;
    @track orgname ;
    @track abn ;
    @track rcti ;
    @track address ;
    @track statePostal ;
    @track contactNo ;
    @track bank ;
    @track accountNo ;
    @track accountName ;
    @track bsb ;
    @track desc ;
    @track orgLogo ;
    @track options=[
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' }
      ] 
    @track  dateIssued;
    @track  selectedGSTValue='Yes';
    @track accountRecList = [];
    @track invoiceTable;  
    @track invoiceTo;
    @track description;
    @track showSpinner=false;
    @track isModalOpen = false;
    @track currentUrl;

     generateICTInvoice(event){
     // this.showICtinvoice= true;
      this.rmInvoiceFlag=true;
      this.invoiceRate=event.currentTarget.dataset.invrate;
      this.unitPrice=event.currentTarget.dataset.invrate;
      this.ictStaffID=event.currentTarget.dataset.staffid;
      let fname =event.currentTarget.dataset.firstname;
      let lname=event.currentTarget.dataset.lastname;
      this.staffFullname =fname+' '+lname;
      this.staffRole=event.currentTarget.dataset.role;
      let accountRecList = [];
      this.accountRecList = accountRecList;
      this.invoiceTo=event.currentTarget.dataset.invoiceto;
      this.description=event.currentTarget.dataset.description;
      this.descrValue=this.description;
      
      this.invoiceEndDate ='';
      this.invoiceStartDate='';
      this.ictApprovedHours=0;
      this.quantityValue=0;
      this.invoiceTable=[];
      this.dateIssued='';
      this.isHome=false;
    }
    handlecloseInvoice(){
      this.showICtinvoice= false;
    } 
    changeHandler(event) {
      if (event.target.name == 'StartDate') {
          this.invoiceStartDate = event.target.value;
         // console.log('start date'+this.invoiceStartDate);
      }
      if (event.target.name == 'EndDate') {
        this.invoiceEndDate = event.target.value;
       // console.log('end date'+  this.invoiceEndDate );
    }
      if (event.target.name == 'dateIssued') {
          this.dateIssued = event.target.value;
      }
      if(event.target.name=='selectOption'){
         // console.log('Selected value '+event.target.value);
          this.selectedGSTValue = event.target.value;
      }
      if(event.target.name=='attachApproval'){
        this.attachApproval = event.target.value;
       // console.log('Selected value '+ event.target.value);
      } 
       if(this.invoiceStartDate != undefined &&  this.invoiceEndDate != undefined ){
        getRosterAllocationInvoiceData({staffId:this.ictStaffID,StartDate:this.invoiceStartDate,endDate:this.invoiceEndDate }).then(result=>{
         // console.log('ict records list'+JSON.stringify(result));
         // this.ictInvoiceList =result;
          let approveHours=0;
          result.forEach(rec=>{
            approveHours +=rec.Working_Hours__c;
            approveHours +=rec.Extended_Hours__c?rec.Extended_Hours__c:0;
          })
         // console.log('Approved hours'+approveHours);
          this.ictApprovedHours=approveHours.toFixed(2);
          this.quantityValue=approveHours.toFixed(2);
        });
       this.fetchInvoices();
       }
    } 

    fetchInvoices(){
     // console.log('staff id'+this.ictStaffID);
      listofInvoicesParent({ sDate: this.invoiceStartDate , eDate:this.invoiceEndDate ,staffID:this.ictStaffID }).then(response => {
        console.log('invoice record list'+JSON.stringify(response));
        this.invoiceTable = response.map(assign => ({
          ...assign,
          Startdate: assign.Start_Date__c ? new Date(assign.Start_Date__c).toLocaleDateString('en-GB') : '',
          Enddate: assign.End_Date__c ? new Date(assign.End_Date__c).toLocaleDateString('en-GB') : '',
          Issueddate: assign.Date_Issued__c ? new Date(assign.Date_Issued__c).toLocaleDateString('en-GB') : '',
      }));
      
      }).catch(error=>{
       // console.log('invoice record list'+JSON.stringify(error));
      })
    }
    handleInputChange(event) {
   
      if(event.target.name =='Description'){
        this.descrValue = event.target.value;
      }
      if(event.target.name =='Quantity'){
        this.quantityValue = event.target.value;
      }
      if(event.target.name =='UnitPrice'){
        this.unitPrice = event.target.value;
      }  
  }
    saveMultipleAccounts() {
     // console.log('on save function ');
      this.tempConRec={'Description':this.descrValue,'Quantity':this.quantityValue,'UnitPrice':this.unitPrice}
      this.accountRecList.push(this.tempConRec);
      // console.log('input invoice  data'+ JSON.stringify(this.accountRecList));
       if(this.selectedGSTValue == undefined){
      this.selectedGSTValue = 'Yes';
      }  
      if(this.dateIssued  && this.invoiceStartDate && this.invoiceEndDate ){
  
        let  staffWithDuplicate = [];
        this.invoiceTable.forEach(rec=>{
          staffWithDuplicate.push(rec.Start_Date__c+' to '+rec.End_Date__c)
        });
       // console.log('duplicate variable'+(staffWithDuplicate));
        let duplicateFound =false;
        let datesstring=this.invoiceStartDate+' to '+this.invoiceEndDate;
        if(staffWithDuplicate.includes(datesstring)){
          duplicateFound=true 
        }
        if( duplicateFound ==false){
        insertInvoice({ JsonString: JSON.stringify(this.accountRecList), OrgId: this.orgId, dateIssue: this.dateIssued, invoice: this.taxinvoice, includeGst :this.selectedGSTValue,startDate:this.invoiceStartDate,enddate:this.invoiceEndDate,staffID:this.ictStaffID,invoiceTo:this.invoiceTo,
          dueDate:null,invoiceStatus:'Issued',fileref:null,invName:null
        })
        .then(result => {
         // console.log('invoice parent rec==>'+JSON.stringify(result))
            this.invParentId=result.Id;
            //this.invoiceFileName=result.name;
           // console.log('invoice parent id'+this.invParentId)
          listofInvoices({ invParentId: this.invParentId }).then(response => {
           // console.log('data of ', JSON.stringify(response));
            this.invRecords = response;
            this.generatePDF();
        });
       });
      } else{
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error',
            message: 'Invoice Already created ',
            variant: 'Error'
          })
        );
      }
      }else{
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error',
            message: 'Please enter Start Date, End Date and Date Issued ',
            variant: 'Error'
          })
        );
        this.accountRecList=[];
      }
    }
  @track invoiceDeleteFlag=false;
  invoiceIdToDelete;

   handleRowAction(event) {
      const actionName = event.target.name;
      const row = event.currentTarget.dataset.id;
      const url = event.currentTarget.dataset.url;
     console.log('row id'+row+url);
      switch (actionName) {
          case 'delete':
            this.invoiceDeleteFlag = true;
            this.invoiceIdToDelete = row; 
            console.log('row id'+this.invoiceIdToDelete);
            break;
          case 'view_details':
            event.preventDefault(); 
            const url1 = url;
            this.currentUrl = url1;
           // console.log('file url  '+ this.currentUrl);  
            this.isModalOpen = true;
            this.isHome=false;
            this.editflag=false;
          break;
      }
    }
    handledelete(event){
      deleteRecord(this.invoiceIdToDelete).then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success',
            message: 'Invoice has been deleted',
            variant: 'success'
          })
        );
        this.fetchInvoices();
        refreshApex(this.invoiceTable);
      }).catch(error => {
       // console.log('error=>'+JSON.stringify(error));
     });
     this.invoiceDeleteFlag=false;

    }
    handledeleteclose(event){
      this.invoiceDeleteFlag = false;
    }
    
    closeModal() {
      this.isModalOpen = false;
      this.currentUrl = null;
      this.isHome=true;
     // this.editflag=true;
    }

    handleView(event) {
      event.preventDefault(); 
      const url = event.currentTarget.dataset.url;
      this.currentUrl = url;
     // console.log('file url  '+ this.currentUrl);  
      this.isModalOpen = true;
      this.isHome=false;
      this.editflag=false;
      
      const fileType = this.getFileType(this.currentUrl);
      
      //console.log('file type: ' + fileType);
      // Check if the file type is not PNG or PDF
       if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
          setTimeout(() => {
              this.closeModal();
              
          }, 1700);
          
      }  
  }
  generatePDF() {
    // console.log('document1 ', this.orgname);       
     const { jsPDF } = window.jspdf;
     var doc = new jsPDF();
     var statePostalWithoutCommas = this.statePostal.replace(/,/g, " ");
     doc.setFont("Roboto-Bold", "bold");
     doc.setFontSize(12);
     doc.setTextColor(0,102,255);
     doc.text(this.orgname.toUpperCase(), 10, 25);        
     doc.setTextColor(0,0,0);
     doc.setFont("Roboto-Bold", "bold");
     
     doc.setFontSize(12);
     doc.text("ABN: "+this.abn, 10, 30);
      doc.setFont("Roboto-Bold", "bold");
     doc.setFontSize(12);
     doc.text("TAX  INVOICE", 134, 25);//120,42

     doc.setFont("Roboto-Bold", "bold");
     doc.setFontSize(12);
     doc.text(this.invRecords[0].Invoice_Parent__r.Name, 134, 30);//120, 53
     
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
     doc.setFontSize(10);
     doc.text(this.address+",", 10, 35);
     doc.text(statePostalWithoutCommas+",", 10, 40);
     doc.text("Contact: "+this.contactNo, 10, 45);

 
     // added for image and organization details
     //doc.addImage(this.orgLogo, "PNG", 120, 25, 70, 18);
     doc.setDrawColor(0, 0, 0); // Black color
     doc.setLineWidth(0.5);
     doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
     doc.line(10, 222, 200, 222); // (startX, startY, endX, endY)
     doc.setLineDash();
     doc.setFontSize(10);
     doc.setFont("Roboto-Bold", "bold");
     doc.text("Payable to", 10, 226); // Text before the variable
     
     doc.setFont("Roboto-Bold", "bold");
     doc.text("Bank", 10, 232); // Text before the variable
     doc.text(":", 40, 232);
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal"); // Set font to bold for the variable
     if(this.bank){
       doc.text(this.bank, 42, 232);
     }else{
       doc.text(" ", 42, 232);
     }
     doc.setFont("Roboto-Bold", "bold");
     doc.text("Account Name", 10, 236); 
     doc.text(":", 40, 236);
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal"); 
     if(this.accountName){
       doc.text(this.accountName, 42, 236);
     }else{
       doc.text(" ", 42, 236);
     }
     doc.setFont("Roboto-Bold", "bold");
     doc.text("BSB", 10, 240); 
     doc.text(":", 40, 240);
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
     if(this.bsb){
       doc.text(this.bsb, 42, 240);
     }else{
       doc.text(" ", 42, 240);
     }
     doc.setFont("Roboto-Bold", "bold");
     doc.text("Account Number", 10, 244);
     doc.text(":", 40, 244);
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
     if(this.accountNo){
       doc.text(" "+this.accountNo, 41, 244);
     }else{
       doc.text(" ", 41, 244);
     }
     
     
     
     
     const oldDate = this.invRecords[0].Invoice_Parent__r.Date_Issued__c;
     const arr = oldDate.split('-');
     const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
     doc.setFontSize(10);
     doc.text("Date Issued: "+newDate, 134, 35);
     const oldsDate = this.invRecords[0].Invoice_Parent__r.Start_Date__c;
     const sarr = oldsDate.split('-');
     const newsDate = sarr[2]+'/'+sarr[1]+'/'+sarr[0];
 
     const oldeDate = this.invRecords[0].Invoice_Parent__r.End_Date__c;
     const earr = oldeDate.split('-');
     const neweDate = earr[2]+'/'+earr[1]+'/'+earr[0];
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
     doc.setFontSize(10);
     doc.text("For the Period: "+newsDate+" to "+neweDate, 134, 40);
     doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
     doc.setFontSize(10);
     doc.text("TAX INVOICE To: "+ this.invRecords[0].Invoice_Parent__r.Staff__r.Invoice_To__c, 10, 72);
    /*  doc.setFont("Times New Roman", "bold");
     doc.setFontSize(12);
     doc.text(this.invRecords[0].Invoice_Parent__r.Name, 130, 41); */
    
     doc.setFontSize(10);
       doc.setFont("Roboto-Bold", "bold");
       doc.text("Terms & Conditions:", 10, 260);
       doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
       doc.setTextColor(169, 169, 169);
       doc.text("All terms and conditions apply.", 10, 264);
       
       doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
       doc.setFontSize(10);

     function addFooter(doc) {
      let pageHeight = doc.internal.pageSize.height; // Get page height
      let footerY = pageHeight; // Footer position
  
      // Draw footer line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(0, footerY - 12, 210, footerY - 12);
  
      // Footer text
      doc.setFontSize(10);
      const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
      const img = new Image();
      img.src = logo;
      
      doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); 
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("Powered by", 10, footerY-5);
      
      // Centered Footer Text
      doc.setFontSize(10);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("Office Use Only", 90, footerY-5);
  
      // Page Number
      doc.setFontSize(10);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(`${doc.internal.getNumberOfPages()}`, 200, footerY-5);
  }
    var result = [];
    var subTotal = 0;
    
    this.invRecords.forEach(record => {
        subTotal += record.Amount__c;
    
        result.push([
            record.Description__c,
            record.Quantity__c.toFixed(2),
            record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            "10%", // Tax column
            record.Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        ]);
    });
    
    
    // Adding subtotal, GST, and total rows
    result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' + this.invRecords[0].Invoice_Parent__r.Total_Amount__c.toFixed(2)]);
    result.push(["", "", "", "Total GST:", '$' + this.invRecords[0].Invoice_Parent__r.Total_GST__c.toFixed(2)]);
    result.push(["", "", "", "Total:", '$' + this.invRecords[0].Invoice_Parent__r.Total__c.toFixed(2)]);
   
    // Generating table using autoTable
    doc.autoTable({
        startY: 88, // Starting Y position
        head: [["Description", "Qty", "Rate", "Tax", "Amount"]],
        body: result,
        theme: "plain",
        /* styles: { halign: "left" }, */
        margin: { left: 10, right: 10 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
        bodyStyles: { font: "Roboto-VariableFont_wdth,wght",  fontStyle: "normal", },
        /* bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] }, */
        columnStyles: {
          0: { cellWidth: 80, halign: "left" },  // Description left-aligned
          1: { cellWidth: 25, halign: "left" },  // Qty left-aligned
          2: { cellWidth: 25, halign: "left" },  // Rate left-aligned
          3: { cellWidth: 25, halign: "right" }, // Tax right-aligned
          4: { cellWidth: 35, halign: "right" }  // Amount right-aligned
        },
        didParseCell: function (data) {
          var columnText = data.row.raw[3]; // Get column text
          if (data.row.index === 0) { 
            if (data.column.index === 3 || data.column.index === 4) {
                data.cell.styles.halign = "right";
            } else {
                data.cell.styles.halign = "left";
            }
        }
          // Make Sub Total, Total GST, and Total bold
          if ([ "Total:"].includes(columnText)) {
           data.cell.styles.font = "Roboto-Bold"; 
           data.cell.styles.fontStyle = "bold";
          }
      },
        didDrawCell: function (data) {  
          var doc = data.doc;
          var cell = data.cell;
          var rowIndex = data.row.index;
          var totalRowsCount = result.length; // Total rows including subtotal, GST, and total
          
          // Get the text of the fourth column (index 3) to check row type
          var columnText = data.row.raw[3]; 
  
          // Apply border only to normal rows & total row
          if (!["Sub Total:", "Total GST:"].includes(columnText)) {
              doc.setDrawColor(0, 0, 0); // Black border
              doc.setLineWidth(0.2);
  
              // Top border (for first row or total row)
              if (rowIndex === 0) { 
                  doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
              }
  
              // Bottom border (for normal rows and total row)
              if (rowIndex < totalRowsCount - 1 ) {
                  doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
              }
              
          }
          if (columnText === "Total:") {
            doc.setDrawColor(0, 0, 0); // Black border
            doc.setLineWidth(0.2);
            
            if (data.column.index === 4 || data.column.index === 3 ) {
             
              // Top border
              doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
  
              // Bottom border
              doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
          }
           
            
        }
      },
      didDrawPage: function (data) {
                
        // Always add the footer on each page
        addFooter(data.doc);
    }
    
    });


     this.base64string = btoa(doc.output());
    // console.log('if this.message.allProducts type reddy table');
     this.showSpinner = true;
     var docName=this.invRecords[0].Invoice_Parent__r.Name+'.pdf';
    // console.log('docName>',docName);
     uploadFile({base64:JSON.stringify(this.base64string), filename:docName, recordId:this.invParentId,obj:'invoiceParent'})
     .then(result=>{
        // console.log('data', result);                    
        // console.log('Upload result = ' +result);
        // this.fileName = this.fileName + ' - Uploaded Successfully'; 
     })            
     const evt = new ShowToastEvent({
         title: 'Success',
         message: 'Invoice Generated sucessfully '+docName,
         variant: 'success',
         mode: 'dismissable'
     });
     //this.handlecloseInvoice();
     this.dispatchEvent(evt);
     setTimeout(() => {
       this.fetchInvoices();
      this.showSpinner = false;
   }, 3000); 
   this.accountRecList=[];
     //refreshApex(this.invoiceTable);
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

  get bDisableFirst() {
    return this.pageNumber == 1;
}
get bDisableLast() {
    return this.pageNumber == this.totalPages;
}    
handleRecordsPerPage(event) {
    this.pageSize = event.target.value;
    this.paginationHelper();
}
previousPage() {
    this.pageNumber = this.pageNumber - 1;
    this.paginationHelper();
}
nextPage() {
    this.pageNumber = this.pageNumber + 1;
    this.paginationHelper();
}
firstPage() {
    this.pageNumber = 1;
    this.paginationHelper();
}
lastPage() {
    this.pageNumber = this.totalPages;
    this.paginationHelper();
}
paginationHelper() {
 // console.log('calling pagination Data >>'+JSON.stringify(this.paginationRecords));
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
   // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
    if (this.pageNumber <= 1) {
        this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
        this.pageNumber = this.totalPages;
    }
    let tempconList=[];   
   // console.log('calling pagination Data1 >>'+JSON.stringify(tempconList));    
    for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
        if (i === this.totalRecords) {
            break;
        }            
        let tempConRec = Object.assign({}, this.paginationRecords[i]);           
        tempconList.push(tempConRec);    
    }
    
    this.finalStaffData=tempconList;
}
HandlegetCheckLIst(){
  this.isShowChecklsit=true;
  this.isShowActivity=false;
  }
  handleeditCloseCheckList(event){
    this.isShowChecklsit=false;
    this.isShowActivity=false;
   // this.checklistData=[];
   // this.activitydata=[];
  }

  HandleActivityLog(){
    this.isShowActivity=true;
    this.isShowChecklsit=false;
  }
  handleExtendedTypeOfPay(event) {
    let selectedValue = event.target.value;
    let nextShiftType;
    let hourlyRate = 0;
    this.varianceRate=0;

    console.log('Selected Value:', selectedValue);

    getStaffById({ recordId: this.staffid })
        .then(result => {
            console.log('Staff Data:', JSON.stringify(result));

            // Store staff data
            let staffData = result[0]; // Assuming only one record is returned

            // Determine Next Shift Type using switch
            switch (selectedValue) {
                case 'Next Shift Pay Rates':
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
                case 'Current Shift Pay Rates':
                    nextShiftType = "Current Shift Pay Rates";
                    break;
                case 'Over Time Pay Rates':
                    nextShiftType = "Over Time Pay Rates";
                    break;
                case 'Add New Pay Rates':
                    nextShiftType = "Add New Pay Rates";
                    break;
                default:
                    nextShiftType = "None";
            }

            console.log('Calculated Shift Type:', nextShiftType);

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

            console.log('Calculated Hourly Rate:', hourlyRate);
              this.varianceRate=hourlyRate;
           //   console.log('type of extend' +typeof(this.extendedWage));
           //   console.log('type of sleepover '+typeof(this.sleepOverWage));
          
           this.calculateExtendedWage();
            
            // If needed, store the next shift type and hourly rate for use elsewhere in the component
        })
        .catch(error => {
            console.error('Error fetching staff data:', error);
        });
}
  calculateExtendedWage(){
    this.grandTotal=0.00;
    this.totalReiAmount=0;
    getShiftReimbursements({shiftId:this.shiftID}).then(response=>{
     response.forEach(rec => {
       if (rec.Approval_Status__c === 'Approved') {
         const amount = rec.Total_Amount__c || 0;  // Fallback to 0 if Amount__c is null/undefined
         this.totalReiAmount += amount;
           }
          
     });
       this.totalReiAmount=this.totalReiAmount.toFixed(2);
       this.grandTotal=(parseFloat(this.totalShiftWages)+parseFloat(this.totalReiAmount)).toFixed(2);
         this.extendedWage=parseFloat(this.varianceRate)*parseFloat(this.extendedDuartion);
         this.grandTotal = parseFloat(this.grandTotal)+(parseFloat(this.varianceRate)*parseFloat(this.extendedDuartion))+parseFloat(this.sleepOverWage);
         this.extendedWage=this.extendedWage.toFixed(2);
         this.grandTotal=  this.grandTotal.toFixed(2);
      
     });
  }
 
  handleSleepOverTypeOfPay(event){

    let selectedValue = event.target.value
    let hourlyRate = 0;
    this.SleepOverNightHourlyRates=0;
    console.log('Selected Value:', selectedValue);

    getStaffById({ recordId: this.staffid })
        .then(result => {
            console.log('Staff Data:', JSON.stringify(result));

            // Store staff data
            let staffData = result[0]; // Assuming only one record is returned

            // Determine Next Shift Type using switch
            switch (selectedValue) {
                case 'Night Shift Rates':
                  hourlyRate = staffData.Night_shift_Hourly_Rate__c; 
                    break;
                case 'Add New Rates':
                  hourlyRate = 0;
                    break;
                case 'None':
                  hourlyRate = 0;
                    break;
               
                default:
                  console.log('hourly rate '+hourlyRate);
            }

            console.log('Calculated Hourly Rate:', hourlyRate);
            this.SleepOverNightHourlyRates=hourlyRate;
            this.calcuatesleepovernightwage();
            // If needed, store the next shift type and hourly rate for use elsewhere in the component
        })
        .catch(error => {
            console.error('Error fetching staff data:', error);
        });

  }
  calcuatesleepovernightwage(){
    this.grandTotal=0.00;
    this.totalReiAmount=0;
    getShiftReimbursements({shiftId:this.shiftID}).then(response=>{
     response.forEach(rec => {
       if (rec.Approval_Status__c === 'Approved') {
         const amount = rec.Total_Amount__c || 0;  // Fallback to 0 if Amount__c is null/undefined
         this.totalReiAmount += amount;
           }
          
     });
       this.totalReiAmount=this.totalReiAmount.toFixed(2)
     
       this.grandTotal=(parseFloat(this.totalShiftWages)+parseFloat(this.totalReiAmount)).toFixed(2);
     
         this.sleepOverWage=parseFloat(this.SleepOverNightHourlyRates)*parseFloat(this.sleepovernightshiftduartion);
         this.grandTotal = parseFloat(this.grandTotal)+(parseFloat(this.SleepOverNightHourlyRates)*parseFloat(this.sleepovernightshiftduartion))+parseFloat(this.extendedWage);
        
         this.sleepOverWage=this.sleepOverWage.toFixed(2);
         this.grandTotal=  this.grandTotal.toFixed(2);
      
     });
  }
  
    handleOnchangeExtendedRates(event){
      this.varianceRate=event.target.value;
      if(this.varianceRate == undefined || this.varianceRate == null || this.varianceRate == ''){
        this.varianceRate=0;
      }
      this.calculateExtendedWage();
    }
    handleOnchangeNightRates(event){

      this.SleepOverNightHourlyRates=event.target.value;
       if(this.SleepOverNightHourlyRates == undefined || this.SleepOverNightHourlyRates == null || this.SleepOverNightHourlyRates == ''){
        this.SleepOverNightHourlyRates=0;
      }
      this.calcuatesleepovernightwage();

    }
    handleLogOutChnage(event) {
      console.log('End time:', event.target.value);
      console.log('Shift end time:', this.shiftEndtime.toLowerCase());
      console.log('End date:', this.enddate);
  
      // Convert shift end time to 24-hour format
      let shiftEndTime24 = this.convertTo24HourFormat(this.shiftEndtime.toLowerCase());
    //  console.log('Converted Shift End Time (24-hour):', shiftEndTime24);
  
      // Combine end date with shift end time
      let shiftEndDateTime = new Date(`${this.enddate}T${shiftEndTime24.replace("Z", "")}`);
      
      // Combine end date with event target value (end time)
      let eventEndTime = new Date(`${this.enddate}T${event.target.value}`);
  
      // Calculate duration in milliseconds
      let durationMs = eventEndTime - shiftEndDateTime;
      console.log('eventEndTime: $'+eventEndTime);
      console.log('shiftEndDateTime: $'+shiftEndDateTime);
      
      // Convert milliseconds to total hours (including fractions)
      let durationHours = durationMs / (1000 * 60 * 60);
  
      console.log(`Total Duration: ${durationHours.toFixed(2)} hours`);
      this.isExtendedShift=parseFloat(durationHours) >0?true :false;
      this.extendedDuartion=parseFloat(durationHours).toFixed(2);

      let totalMinutes = Math.round(durationHours * 60);
      let hh = Math.floor(totalMinutes / 60);
      let mm = totalMinutes % 60;

      // Store formatted duration
      this.extendedHoursandmins = `${hh}:${mm.toString().padStart(2, '0')}`;
      console.log(`Extended Duration (HH:mm): ${this.extendedHoursandmins}`);
     
  }

    convertTo24HourFormat(timeStr) {
      
      timeStr = timeStr.trim();
      console.log('timeStr' +timeStr);
      console.log('type of '+typeof(timeStr));  
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
     console.log("Converted Time (24-hour):", `${formattedHours}:${minutes}:00Z`);
      return `${formattedHours}:${minutes}:00Z`;
  }
}