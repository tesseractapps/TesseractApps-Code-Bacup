import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import momentJS from "@salesforce/resourceUrl/momentJS";
import { loadScript } from "lightning/platformResourceLoader";
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Add_Shift__c';
import INDUSTRY_FIELD from '@salesforce/schema/Add_Shift__c.Role__c';
import getcurrentStaff from '@salesforce/apex/AddShiftController.getcurrentStaff';
import Rejectedshifts from '@salesforce/apex/AddShiftController.Rejectedshifts';
//import updateStaffShift from '@salesforce/apex/AddShiftController.updateStaffShift';
import roleBasedShift from '@salesforce/apex/AddShiftController.roleBasedShift';
import handleAllocation from '@salesforce/apex/AddShiftController.handleAllocation';
import getHours from '@salesforce/apex/AddShiftController.getSetHours';
import { refreshApex } from '@salesforce/apex';
import { RefreshEvent } from 'lightning/refresh';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getAddShiftData from '@salesforce/apex/RosterInvoicesHandler.getAddShiftData';
import getOverlappingShiftsData from '@salesforce/apex/AddShiftParticipantView.getOverlappingShiftsData';


export default class AddStaffLwc extends NavigationMixin(LightningElement)  {
  employee = My_Resource + '/myResource/images/MyRoster.png';
  @api defaultView; 
  @track isAddShift=false;
  @track currentStaffRole=[];
  @track daysList =[]; 
  @track showSpinner=false;
  activeSections = ['My Roster', 'Available Shifts'];
  // navigation
  @track startDateUTC; // sending to backend using time
  @track endDateUTC; // sending to backend using time
  @track formattedStartDate; // Title (Date Range)
  @track formattedEndDate; // Title (Date Range)
  @track dates = []; // Dates (Header)
  @track chosenRole; 
  dateShift = 7; // determines how many days we shift by
  // options
  @track datePickerString; // Date Navigation
  @track view = {
    // View Select
    options: [
      {
        label: "View by Day",
        value: "1/7"
      },      
    ],
    slotSize: 1,
    slots: 1
  };

  // gantt_chart_resource
  @track startDate;
  @track endDate; 
  @track shiftId;
  @track duration;
  @track allocatedshifts=[];
  @track totalHours=0;
  @track availableHours=0;
  @track setHours=0;
  @track toggleFlag=false;
  @track staffEmail;
  @track staffId;
  @track RejectedFlag = false;
  @track CommentsFlag = false;
  @track RejectId;
  @track todayDate;
 @track sixWeeksLater;
 @track isNextDisabled=false;

  colorOptions = [
    { label: 'Light Red', value: '#FFADAD', style: 'background-color: #FFADAD; color: black;' },
    { label: 'Light Orange', value: '#FFD6A5', style: 'background-color: #FFD6A5; color: black;' },
    { label: 'Light Yellow', value: '#FDFFB6', style: 'background-color: #FDFFB6; color: black;' },
    { label: 'Light Green', value: '#CAFFBF', style: 'background-color: #CAFFBF; color: black;' },
    { label: 'Light Blue', value: '#9BF6FF', style: 'background-color: #9BF6FF; color: black;' },
    { label: 'Pale Blue', value: '#A0C4FF', style: 'background-color: #A0C4FF; color: black;' },
    { label: 'Lavender', value: '#DDD8FF', style: 'background-color: #DDD8FF; color: black;' },
    { label: 'Light Pink', value: '#FFC6FF', style: 'background-color: #FFC6FF; color: black;' },
    { label: 'Light Beige', value: '#FDE8B3', style: 'background-color: #FDE8B3; color: black;' },
    { label: 'Light Aqua', value: '#C6EAED', style: 'background-color: #C6EAED; color: black;' },
    { label: 'Soft Yellow', value: '#E4E87E', style: 'background-color: #E4E87E; color: black;' }
];

 @wire(getRecord, { recordId: Id, fields: [UserEmail]}) 
    currentUserInfo({error, data}) {
        if (data) {

         this.staffEmail=data.fields.Email.value; 
         console.log(' this.staffEmail '+ this.staffEmail);

        }
        
     else if (error) {
        this.error = error ;
    }
    
    } 
    @track  staffList = [];
    error;

    @wire(getStaffByEmail, { email: '$staffEmail' })
    wiredStaff({ data, error }) {
        if (data) {
            this.staffList = data;
         
            this.staffId= this.staffList[0].Id;
               console.log('  this.staffId='+   this.staffId);
            this.error = undefined; 
        } else if (error) { 
            this.error = error;
            this.staffList = [];
        }
    }
  
  @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
  objectInfo;

  @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: INDUSTRY_FIELD})
  IndustryPicklistValues;  
  

  handleChange(event) {
    this.chosenRole = event.detail.value; 
    this.setDateHeaders();
  }

  get isDesktop() {
      return FORM_FACTOR === 'Large';
  }
  
  get isMobile() {
      return FORM_FACTOR === 'Small';
  }

  get dynamicselectedColor1() {
    return `background: ${this.selectedColor1};`;
}
get dynamicselectedColor2() {
  return `background: ${this.selectedColor2};`;
}

  connectedCallback() {
    this.mounted();
    this.defaultView = 'View by Day';
    Promise.all([
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

    getHours().then(response=>{
      console.log('sert hours'+response);
      this.setHours=response;
    }).catch(error=>{
      console.log('set hours error==>'+error);
    }) ;

    this.todayDate = new Date();  
    
    // Calculate 6 weeks later (42 days)
    this.sixWeeksLater = new Date(this.todayDate);
    this.sixWeeksLater.setDate(this.sixWeeksLater.getDate() + 42);  

    console.log('sixWeeksLater',this.sixWeeksLater);
    console.log('todayDate',this.todayDate)
  }    
    
  /*** Navigation ***/
  setStartDate(_startDate) {
    this.daysList.shiftdata=[];
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
   
    //  this.formattedStartDate = this.startDate.toLocaleDateString();
    this.formattedStartDate = this.startDate;
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
  //  console.log('this.startDate',this.startDate);
    this.daysList.shiftdata=[];
    this.endDate = moment(this.startDate)
      .add(this.view.slots * this.view.slotSize - 1, "days")
      .toDate();
    this.endDateUTC =
      moment(this.endDate)
        .utc()
        .valueOf() -
      moment(this.endDate).utcOffset() * 60 * 1000 +
      "";
   // this.formattedEndDate = this.endDate.toLocaleDateString();
   this.formattedEndDate = this.endDate;

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
          type:'Staff Name',
          days: [],             
        };
      }
      
      let day = {
        class: "slds-col slds-p-vertical_x-small  lwc-timeline_day",
        label: date.format("YYYY-MM-DD"),
        label1: date.format("DD-MM-YY"), 
        start: date.toDate(),
        staffdata:[],
        shiftdata:[]
      };     
     // console.log('viewsize,',this.view.slotSize);
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
      
    // reorder    
    this.dates = Object.values(dates);
    let rolearray=[];

    console.log('dates>',this.dates);

     console.log('this.startDate'+this.formatDate(this.startDate));
    console.log('this.endDate'+this.formatDate(this.endDate));
    console.log('this.sixWeeksLater'+this.formatDate(this.sixWeeksLater));
    

    getcurrentStaff({startDate : this.formatDate(this.startDate),endDate :this.formatDate(this.endDate)}).then(response => {
      var hours = 0;
    // console.log('getcurrentStaff>>',JSON.stringify(response));   
      console.log('getcurrentStaff>>',response.length);    
      this.dates.forEach((record1) => {                     
      this.daysList = record1.days;
      console.log('daylist>>',JSON.stringify(this.daysList));  
      for(var j=0;j<this.daysList.length;j++){      
        for(var i=0;i<response.length;i++){ 
          let daystaff= {};
          if((this.daysList[j].label==response[i].Add_Shift__r.Start_Date__c && response[i].Add_Shift__r.Start_Date__c < this.formatDate(this.sixWeeksLater)) ){
            console.log('DaysList start date',this.daysList[j].label);
            console.log('record start date',response[i].Add_Shift__r.Start_Date__c);  
          console.log('this.sixWeeksLater'+this.formatDate(this.sixWeeksLater));
            daystaff.shiftType=response[i].Shift_Type__c;
            daystaff.availability=response[i].Attendence__c;
            daystaff.visible=true;
            daystaff.Id=response[i].Id;
            daystaff.role=response[i].Add_Shift__r.Role__c;
            daystaff.time=response[i].Add_Shift__r.Shift_Start_End_Time__c;
            daystaff.staff=response[i].Staff__r.Name;
            daystaff.stafftime=response[i].start_time__c;  
            daystaff.status=response[i].Status__c;        
            daystaff.endtime=response[i].End_Time__c;
            daystaff.facility=response[i].Facility__c;
            daystaff.location=response[i].Add_Shift__r.Location__Street__s;
            daystaff.shiftdate=response[i].Add_Shift__r.Start_Date__c;
            //this.setHours = response[i].Set_Hours__c;
            this.allocatedshifts.push(response[i].Shift_Type__c);
            hours = hours + response[i].Duration__c;
          //  console.log('consoleHours '+ response[i].Duration__c); 
         //   console.log('Hours '+hours);  
            this.daysList[j].staffdata.push(daystaff);       
          } 
         // this.daysList[j].staffdata.push(daystaff);
        }
       this.totalHours =  hours;
       // console.log('TotalHours '+this.totalHours);
      }
    })
     // console.log("daysList in days getcurrentStaff>>>>",JSON.stringify(this.dates)); 
      this.availableHours = this.setHours - this.totalHours;
   //   console.log('available hours '+this.availableHours); 

    })
    this.getAvailableShifts();
  }   
  //Start Available Shifts Code
  getAvailableShifts(){
    roleBasedShift({ startDate: new Date(this.startDate).toLocaleDateString('en-CA'),endDate :new Date(this.endDate).toLocaleDateString('en-CA')}).then(response => {
     // console.log('resp shift>>',JSON.stringify(response));      
      this.dates.forEach((record1) => {                     
      this.daysList = record1.days;     
        
     // console.log('daylist in shift>>',JSON.stringify(this.daysList));
      // console.log('day label>',daysList[i].label);
      for(var j=0;j<this.daysList.length;j++){      
        for(var i=0;i<response.length;i++){ 
          
          if((this.daysList[j].label==response[i].Start_Date__c) &&  (response[i].Un_Allocated__c > 0) && !(this.allocatedshifts.includes(response[i].Name)) && response[i].Start_Date__c < this.formatDate(this.sixWeeksLater)){
            let dayshift= {};
         //   console.log('DaysList start date in shift',this.daysList[j].label);
       //     console.log('record start date in shift',response[i].Start_Date__c);           
            dayshift.Name=response[i].Name;
            dayshift.Facility=response[i].Facility_Name__c;
            dayshift.Location=response[i].Location__Street__s;
            dayshift.Id=response[i].Id;
            dayshift.StartEndTime=response[i].Shift_Start_End_Time__c; 
            dayshift.role=response[i].Role__c;
            dayshift.duration = response[i].Duration__c;
            dayshift.isEOI=response[i].Is_EOI__c;
            dayshift.ischecked=false;
            dayshift.isinterest=false;
            this.daysList[j].shiftdata.push(dayshift);        
          } 
        
        }
      }
    });
     // console.log("daysList in days>>>>",JSON.stringify(this.dates));         
    });
  }    
      
 
  navigateToToday() {
    this.allDayList=[];
   this.setStartDate(new Date());    
    this.isNextDisabled=false  ;
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
   // console.log('_startDate' +_startDate )  ;
     
  }


 navigateToDay(event) {
    const selectedDate = new Date(event.target.value + "T00:00:00"); // Local midnight
    this.allDayList = [];
   this.setStartDate(selectedDate); // Proceed if valid 
}

// Format helper (YYYY-MM-DD)
formatDate(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
  handleConfirm(event) {
      this.RejectId = event.currentTarget.dataset.id;
      let shiftDateStr = event.currentTarget.dataset.shiftdate; // "YYYY-MM-DD"
      let status = event.currentTarget.dataset.status;

      // Convert shiftDate and todayDate to actual Date objects
      let shiftDate = new Date(shiftDateStr);
      shiftDate.setHours(0, 0, 0, 0); // Normalize shift date
      let today = new Date(); 
      today.setHours(0, 0, 0, 0); // Normalize to midnight to compare only the date

      console.log('Shift Date:', shiftDate);
      console.log('Today Date:', today);

      if (shiftDate < today) {
          // Throw error if shift is in the past
          dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: 'You cannot reject a shift that was scheduled for a previous day.',
                  variant: 'error'
              })
          );
      }else if (status != 'Accepted') {
           dispatchEvent(
              new ShowToastEvent({
                  title: 'Rejected',
                  message: 'You cannot reject a shift that is currently In Progress or Completed.',
                  variant: 'error'
              })
          );
          
      } else  {
         this.RejectedFlag = true;
       
      } 

      console.log('RejectId:', this.RejectId);
  }

  handleRejectedClose(event){
    this.RejectedFlag = false;
    this.CommentsFlag = false;
    this.RejectId = '';
  }
  handleComments(event){
    this.CommentsFlag = true;
    this.RejectedFlag = false;
  }
  handleCommentsChange(event){
    this.comments = event.currentTarget.value;
    console.log('comments '+this.comments);
  }
 
  handleRejected(event){
   console.log('Shift entered');
    Rejectedshifts({ shiftStaffId: this.RejectId, comments: this.comments })
            .then(() => {
                console.log('Shift rejected successfully');
                 this.setDateHeaders();
                // You can show a toast or refresh list here
            })
            .catch(error => {
                console.error('Error rejecting shift:', error);
            });
    this.CommentsFlag = false;  
    this.RejectedFlag = false;
    this.RejectId = '';
    this.comments = '';


  }

  

  onChangehandleallocation(event){    
    this.showSpinner=true;
    this.duration = event.currentTarget.dataset.dur;  
    console.log('duration '+this.duration);
    console.log('set hours '+ this.setHours);
    console.log('total hours and duration '+(Number(this.totalHours) + Number(this.duration)));
    this.shiftId=event.currentTarget.dataset.id;
    event.currentTarget.dataset.chk=true; 
   // console.log(ind);
    if((Number(this.totalHours) + Number(this.duration)) <= this.setHours ){
      this.shiftId=event.currentTarget.dataset.id;
      getAddShiftData({AddShift : this.shiftId}).then(res=>{
        console.log('res ' +JSON.stringify(res));
        console.log( 'Start_Time_Text__c ' + res[0].Start_Time_Text__c);
        console.log( 'End_Time_Text__c ' + res[0].End_Time_Text__c);
    console.log( 'End_Time_Text__c ' + res[0].Start_Date__c);
      console.log( 'staffId ' + this.staffId);

        getOverlappingShiftsData({strtTimeText:res[0].Start_Time_Text__c,endTimeText:res[0].Start_Time_Text__c,StaffID:this.staffId,startdate:res[0].Start_Date__c,shiftType:res[0].Shift_Type__c,ShiftwithStaffId:null}).then(result=>{
          console.log('over lapping data '+result);
           this.showSpinner=false;
         if(result==true){
          //  this.confirMationMessage('Error','The selected staff already has a shift within the start and end times.','Error');
            const element = this.template.querySelector('[data-id='+this.shiftId+']'); 
            element.checked=false;  
          //event.currentTarget.dataset.chk=false;
          this.showSpinner=false;
      
          this.dispatchEvent(
            new ShowToastEvent({
                title: 'Shift Rejected',
                message: 'The selected staff already has a shift within the start and end times.',
                variant: 'Error'
            })
          );
            
          } else{
          handleAllocation({ shiftId:this.shiftId,EOI:false }).then(response=> {
          // event.currentTarget.dataset.chk=true
            this.setDateHeaders();  
            this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Shift Allocated',
                  message: 'You have been allocated to Shift',
                  variant: 'success'
              })
            );     
            this.showSpinner=false;
          }).catch(error=>{
            
          })
          
          } 
        })
      })
    }
    else{
      //alert('else');
      const element = this.template.querySelector('[data-id='+this.shiftId+']'); 
      element.checked=false;    
      event.currentTarget.dataset.chk=false;
      this.dispatchEvent(
        new ShowToastEvent({
            title: 'Shift Rejected',
            message: 'You cannot accept this shift as it will exceed your set hours per week. Please contact Roster admin',
            variant: 'error'
        })    
      );      
      this.showSpinner=false;       
     
   //  
   refreshApex(this.daysList);
    }
    refreshApex(this.daysList);
  }
  
  onChangehandleinterest(event){
    this.shiftId=event.currentTarget.dataset.id;
    handleAllocation({ shiftId:this.shiftId,EOI:true }).then(response=> {
     // event.currentTarget.dataset.chk=true
      this.setDateHeaders();  
      this.dispatchEvent(
        new ShowToastEvent({
            title: 'Interest Confirmed',
            message: 'You have expressed interest in this Shift',
            variant: 'success'
        })
      );     
      this.showSpinner=false;
    }).catch(error=>{
      const element = this.template.querySelector('[data-id='+this.shiftId+']'); 
       element.checked=false;  
      //event.currentTarget.dataset.chk=false;
      this.showSpinner=false;
      console.log('error message'+JSON.stringify(error));
      this.dispatchEvent(
        new ShowToastEvent({
            title: 'EOI Failed',
            message: ((error.body.message.split(',')[1]).split(':'))[0],
            variant: 'Error'
        })
      );
           
    })
  }
    @track selectedColor1;
    @track selectedColor2;

    /* handleColorChange(event) {
        this.selectedColor = event.target.name;
        localStorage.setItem('selectedColor', this.selectedColor);
    } */
        handleColorChange(event) {
          const colorInput = event.target.name; // Get the name of the input
          const colorValue = event.target.value; // Get the color value
  
          if (colorInput === 'roster') {
              this.selectedColor1 = colorValue;
              localStorage.setItem('selectedColor1', colorValue);
          } else if (colorInput === 'shifts') {
              this.selectedColor2 = colorValue;
              localStorage.setItem('selectedColor2', colorValue);
          }
      }
    mounted() {
      const savedColor1 = localStorage.getItem('selectedColor1');
        const savedColor2 = localStorage.getItem('selectedColor2');
        
        if (savedColor1) {
            this.selectedColor1 = savedColor1;
        }
        if (savedColor2) {
            this.selectedColor2 = savedColor2;
        }
    }

    get dynamicStyles() {
        return `background: ${this.selectedColor1};`;
    }
    get dynamicStyles2() {
      return `background: ${this.selectedColor2};`;
  }
 
}