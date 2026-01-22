import { LightningElement,api, track,wire } from 'lwc';
import PendingShifts from '@salesforce/apex/SignInController.PendingShifts';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import updateSignInTime from '@salesforce/apex/SignInController.updateSignInTime';
import updateSignOutTime from '@salesforce/apex/SignInController.updateSignoutTime';
import createReimbursement from '@salesforce/apex/SignInController.craeteReimbursement';
import { loadScript } from "lightning/platformResourceLoader";
import momentJS from "@salesforce/resourceUrl/momentJS";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { RefreshEvent } from 'lightning/refresh';
import { refreshApex } from '@salesforce/apex';
import LightningConfirm from 'lightning/confirm';
import getCheckListByShiftId from '@salesforce/apex/SignInCheckListAndNotesHandler.getCheckListByShiftId';
import updateCheckListRecords from '@salesforce/apex/SignInCheckListAndNotesHandler.updateCheckListRecords';
import addShiftActivity from '@salesforce/apex/SignInCheckListAndNotesHandler.addShiftActivity';
import getActivityLog from '@salesforce/apex/SignInCheckListAndNotesHandler.getActivityLog';
import requestSignIn from '@salesforce/apex/SignInController.requestSignIn';
import requestSignOut from '@salesforce/apex/SignInController.requestSignOut';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import createBreakTimeRecord from '@salesforce/apex/SignInController.createBreakTimeRecord';
import updateBreakTimeRecord from '@salesforce/apex/SignInController.updateBreakTimeRecord';
import getShiftDetailsById from '@salesforce/apex/SignInController.getShiftDetailsById';

export default class SigninPageLwc extends LightningElement {
   
    SingIn = My_Resource+'/myResource/images/Signin_Payroll.png';
    @track signinList;
    @track selectedShift;  
    @track meters;
    @track mileage;
    @track others;
    @track fileName;
    @track datePickerString=new Date().toLocaleDateString('en-GB');
    @track startDate;   
   // @track signoutDisable=false;
    @track signoutDisable=true;
    @track bDisable=true;
    @track ShiftType;
    @track startTime;
    @track endtime;
    @track role;
    @track facility;
    @track startTimeEndtime;
   @track DateShift;
    @track role;
    @track Location;
    @track rowLength;
    @track shiftBoolean =false;
    @track attachDisable=true;
    @track prsentDate;
    @track status;
    @track reiburseFileLength;
    @track amount;
    @track shiftEndDate;
    @track shiftNotes;
   // @track isSubmitted =false;
   @track checklistData = [];
    @track error;
    wiredCheckListResponse;
    @track addShiftId = null;
    @track isShowChecklsit=false;
    @track isShowActivity=false;
    @track shiftActivity;
    wiredActivityresponse;
    @track activitydata=[];
    @track disableActivityandChecklist=true;
    isListening = false; 
    showMuteIcon = false; 
    showClearIcon = false; 
    recognition; 
    @track ExtendedDuartion=0;
    @track AddShiftDuartion=0;
    @track  isExtentedShift=false;
    @track extendedShiftDetailsFlag=false;
    @track isShowActivityinReview=false;
    @track isShowChecklsitinReview=false;
    @track isSleepOverShift=0;
    @track sleepoverTemplate=false;
    @track selectedHours = 0;
    @track selectedMinutes = 0;
    @track SleepoverNightShiftHours = 0;
    @track logSleepoverHours=false;
    @track LoghoursButtontemplate=false;
    @track sleepOverFinalLogOut=false;
    @track FinalShiftDuartion=0;
    @track extendedComments;
    @track nightShiftHourComments;
    @track finalReviewActivity=[];
    @track signInRequesttemplate=false;
    @track requestSignDisbale=true;
    @track extendedDurationFormatted;
    @track SleepoverShiftFormattedHours;
    @track vehicleValue = '';
    @track noRecordsFlag=false;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;
    @track requestSignOutDisbale = true;
    @track signOutRequesttemplate=false;
    @track requestSignOut = false;
    @track participant;
    @track isSigninVisible = true;
    @track isSignoutVisible = true;
    @track isBreakinVisible = false;
    @track isBreakoutVisible = false;
    @track breakInDisable = true;
    @track breakOutDisable = true;
    @track breakInTime;
    @track breakStartDate;
    @track breakOutTime;
    @track breakEndDate;
    @track currentBreakId;
    @track formattedStartDate;
    @track shiftDetails;
    
    dateShift = 1;
    @track columns = [
        { label: 'Location', fieldName: 'Shift_Locations__c',  initialWidth: 150 }, 
        { label: 'Date', fieldName: 'Date__c',  initialWidth: 150 , type: 'date',
          typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"} },
        { label: 'Start Time', fieldName: 'Start_time_Formula__c',  initialWidth: 150 },
        { label: 'End Time', fieldName: 'End_time_formula__c',  initialWidth: 150},
        { label: 'Role', fieldName: 'Role_formula__c',  initialWidth: 150 },
        { label: 'Facility Name', fieldName: 'Facility_Names__c',  initialWidth: 150 },
      ];

    @track vehicleOptions = [
          { label: 'Fuel', value: 'Fuel' },
          { label: 'Electric', value: 'Electric' },
      ];

      fetchOrgDetails() {
          orgDetails()
              .then((response) => {
                  console.log("Response for Org Details =>", response);
                  this.Orgid = response.Id;
                  this.orgfullname = response.Name;
                 //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                 //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
              })
              .catch((error) => {
                  console.error("Error fetching org details:", error);
                  this.error = error;
              });
      }

 
    connectedCallback() {
        //console.log('submission connected call back');
       
        Promise.all([
            loadScript(this, momentJS)
          ]).then(() => {  
            this.setStartDate(new Date());
            this.fetchOrgDetails();
            //this.handleVisbility();
          });
          this.disableRightClick();
          this.disableShortcuts(); 
         
      console.log('generateHoursOptions '+JSON.stringify(this.generateHoursOptions));
      console.log('generateMinutesOptions '+JSON.stringify(this.generateMinutesOptions));
      this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
      this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
      this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
      console.log('participantPreferredName '+ this.participantPreferredName);
      console.log('facilityPreferredName '+ this.facilityPreferredName);
      console.log('staffPreferredName '+ this.staffPreferredName);
    } 

    @wire(getCheckListByShiftId, { addShiftId: '$addShiftId',selectedShift:'$selectedShift' })
    wiredChecklist(response) {
        this.wiredCheckListResponse = response;
       // this.checklistData = [];
        const { data, error } = response;
       
        if (data) {
            this.checklistData = data.checklist;
            this.error = undefined;
          
        } else if (error) {
            this.error = error;
            this.checklistData = [];
        }
    }
    
    @wire(getActivityLog, { shiftWithStaffID: '$selectedShift' })
    wiredActivity(response) {
        this.wiredActivityresponse = response;
      //  this.activitydata = [];
        const { data, error } = response;
       
        if (data) {
        
            this.activitydata = data.records;
            
            this.error = undefined;
          
        } else if (error) {
            this.error = error;
            this.activitydata = [];
        }
    }


    disableRightClick() {
      document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
      });
  }

  disableShortcuts() {
      document.addEventListener('keydown', function(e) {
          // Prevent F12 (Inspect), Ctrl+Shift+I (Inspect), Ctrl+Shift+C (Element picker), and Ctrl+Shift+J (Console)
          if (
              e.key === 'F12' ||
              (e.ctrlKey && e.shiftKey && e.key === 'I') ||
              (e.ctrlKey && e.shiftKey && e.key === 'C') ||
              (e.ctrlKey && e.shiftKey && e.key === 'J') ||
              (e.ctrlKey && e.shiftKey && e.key === 'K')
          ) {
              e.preventDefault();
          }
      });
  }

    getStaffShifts(datePickerString){ 
     //console.log('date pick==>'+this.datePickerString);   
        PendingShifts({startDate: this.datePickerString}).then(response => {
            this.noRecordsFlag = !(response && response.length > 0);
          this.signinList = response.map(rec => ({
            ...rec,
            uidate: rec.Date__c ? new Date(rec.Date__c).toLocaleDateString('en-GB') : ''
        }));
            console.log('response==>'+JSON.stringify(response));
          }).catch(err => {
           // console.log(err);
           this.noRecordsFlag = true;
          });
          this.bDisable = true;
          this.signoutDisable = true;
          this.isBreakinVisible = false;
          this.isBreakoutVisible = false;
    }
    setStartDate(_startDate) {
        if (_startDate instanceof Date && !isNaN(_startDate)) {      
          this.datePickerString = _startDate.toISOString();
          //console.log('in strdate',_startDate.toISOString());
          this.startDate = moment(_startDate)
            .day(1)
            .toDate();
          this.startDateUTC =
            moment(this.startDate)
              .utc()
              .valueOf() -
            moment(this.startDate).utcOffset() * 60 * 1000 +
            "";
         this.formattedStartDate = _startDate.toLocaleDateString('en-IN');
         //console.log('strt date',this.startDate);
         this.getStaffShifts(this.datePickerString);       
        } else {
          this.dispatchEvent(
            new ShowToastEvent({
              message: "Invalid Date",
              variant: "error"
            })
          );
        }
    }
    navigateToToday() {
      this.attachDisable = true;
        this.allDayList=[];
        this.setStartDate(new Date());    
        this.emptyFields(); 
        this.requestSignOutDisbale = true;
        this.requestSignOut = false;
      }
    
      navigateToPrevious() {   
       this.attachDisable = true;
        this.allDayList=[];
        let _startDate = new Date(this.datePickerString);  
        _startDate.setDate(_startDate.getDate() - this.dateShift);
        this.setStartDate(_startDate);  
        this.emptyFields();  
        this.requestSignOutDisbale = true;
        this.requestSignOut = false;
      }
    
      navigateToNext() { 
        this.attachDisable = true;
        this.allDayList=[];
        let _startDate = new Date(this.datePickerString);
       // let _startDate = new Date(this.startDate);
       // console.log('nextdate',_startDate.getDate());
        _startDate.setDate(_startDate.getDate() + this.dateShift);
        this.setStartDate(_startDate);  
        this.emptyFields(); 
        this.requestSignOutDisbale = true;
        this.requestSignOut = false;
      }
    
      navigateToDay(event) {
        //console.log('nav');
        this.requestSignOutDisbale = true;
        this.allDayList=[];
        this.setStartDate(new Date(event.target.value )); 
        this.emptyFields();    
      }

      get generateHoursOptions() {
        return [...Array(10).keys()].map(hour => ({
            label: `${hour} Hours`,
            value: `${hour.toString()}` // Ensure value is a string
        }));
    }
    
    get generateMinutesOptions() {
        return [...Array(12).keys()].map(min => ({
            label: `${min * 5} Minutes`,
            value: `${min * 5}`
        }));
    }

      emptyFields(){
        this.Location='';
        this.startTime='';
        this.endtime='';
        this.DateShift='';
        this.role='';
        this.facility='';
        this.status='';
        this.shiftNotes='';
        this.addShiftId='';
        this.selectedShift='';
         this.checklistData=[];
         this.activitydata=[];
         this.endDuartionInHours=0;
         this.AddShiftDuartion=0;
         this.isSleepOverShift=0;
         this.FinalShiftDuartion=0;
         this.isExtentedShift=false;
         this.extendedShiftDetailsFlag=false;
         this.isShowChecklsitinReview=false;
         this.isShowActivityinReview=false;
         this.sleepoverTemplate=false;
         this.LoghoursButtontemplate=false;
         this.sleepOverFinalLogOut=false;  
         this.extendedDurationFormatted='';
         this.SleepoverShiftFormattedHours='';
         this.SleepoverNightShiftHours=0;
         this.isSigninVisible = true;
         this.isSignoutVisible = true;
         this.isBreakinVisible = false;
         this.isBreakoutVisible = false;
      }

   /* handleSelected( event ) {  
       // console.log('length of rows'+event.detail.selectedRows.length)
        //this.rowLength=event.detail.selectedRows.length; 
        const selectedRowId = event.target.dataset.id; 
    const isChecked = event.target.checked; 
   // let selectedRows = [...(this.selectedRows || [])];
   let selectedRows = [];
    if (isChecked) {
        // Find the selected row from the table data
        let Row = this.signinList.find(row => row.Id === selectedRowId);
        if (Row) {
            selectedRows.push(Row); // Add to selected rows array
        }
      //  this.disableActivityandChecklist=false;
    } else {
        // Remove from selectedRows if unchecked
        selectedRows = selectedRows.filter(row => row.Id !== selectedRowId);
        //this.disableActivityandChecklist=true;
    }
    
    selectedRows.forEach((selectedRow) => {
               this.selectedShift=selectedRow.Id;
               this.ShiftType=selectedRow.Shift_Type__c;
               this.Location=selectedRow.Shift_Locations__c;
               this.startTime=selectedRow.Start_time_Formula__c;
               this.endtime=selectedRow.End_time_formula__c;
               this.role=selectedRow.Role_formula__c;
               this.facility=selectedRow.Staff__r.Facility__r.Name;
               this.DateShift= new Date(selectedRow.Date__c).toLocaleDateString('en-GB');
               this.shiftEndDate= new Date(selectedRow.Add_Shift__r.End_Date__c).toLocaleDateString('en-GB');
               this.shiftNotes=selectedRow.SignIn_Notes__c;
               this.AddShiftDuartion=selectedRow.Add_Shift_Duration_hh_mm__c;
               console.log('selected shift start date==>'+ this.DateShift);
               console.log('selected shift end date==>'+ this.shiftEndDate);
               //this.status=selectedRow.Status__c; 
               this.status=this.convertStatus(selectedRow.Status__c);
               this.addShiftId=selectedRow.Add_Shift__r.Id;
               this.isSleepOverShift=selectedRow.Sleepover_shift__c;
            
              // console.log('selected shift==>'+this.selectedShift);
              // console.log('staff start time==>'+selectedRow.Add_Shift__r.Start_time_Formula__c);
              // console.log('staff start  data type==>'+typeof(selectedRow.Add_Shift__r.Start_time_Formula__c));
              // console.log('log in time'+selectedRow.Log_In_Date_Time__c);
          
               const starttimeArry= selectedRow.Add_Shift__r.Start_time_Formula__c.split(":");
               const endTimeArry= selectedRow.Add_Shift__r.End_time_formula__c.split(":");
               console.log('Array==>'+endTimeArry);
             
                var today = new Date(); 
                var presentday=today.getDate();
                if(presentday<10){
                  presentday='0'+presentday;
                }
                var presentMonth=(today.getMonth()+1);
                if(presentMonth<10){
                  presentMonth='0'+presentMonth;
                }
               // console.log('present day'+presentday);
               // console.log('present month'+presentMonth);
                this.prsentDate=(presentday)+"/"+(presentMonth)+"/"+today.getFullYear() ;
                //console.log('after modification present date'+this.prsentDate);
                const timeValue=(today.getHours() + ":" + today.getMinutes());
                //console.log(' hours'+today.getHours());
                //console.log(' hours'+starttimeArry[0]);
               // console.log(' minutesNow'+today.getMinutes());
               // console.log(' shifminutest'+starttimeArry[1]);
                let ShiftStratTime = new Date();
                ShiftStratTime.setHours(parseInt(starttimeArry[0], 10));
                ShiftStratTime.setMinutes(parseInt(starttimeArry[1], 10));
                let durationInMilliseconds = ShiftStratTime - today;
                //console.log('durationMilliseconds'+durationInMilliseconds);
                let durationInMinutes = durationInMilliseconds / (1000 * 60);
                console.log('durationIn minutes'+durationInMinutes);
                let [day, month, year] = this.shiftEndDate.split('/').map(Number);
                let endtime = new Date(year, month - 1, day); 
                endtime.setHours(parseInt(endTimeArry[0], 10));
                endtime.setMinutes(parseInt(endTimeArry[1], 10));
                //console.log(today+'===='+endtime);
               // console.log('today -endtime '+today-endtime)
                if((durationInMinutes <= 15  && durationInMinutes >=(-30)  ) && selectedRow.Log_In_Date_Time__c ==null &&  (this.DateShift ==this.prsentDate ||  this.prsentDate==this.shiftEndDate)){ //(today-endtime) <=0  &&
                  this.bDisable=false;
                 
                } else  {
                  this.bDisable=true;
                }

                if(selectedRow.Log_Out_Date_Time__c ==null &&  (this.DateShift ==this.prsentDate ||  this.prsentDate==this.shiftEndDate)){
                    if (shiftDate > todayDate) {
                      this.requestSignOutDisbale = false;
                    } else {
                      this.requestSignOutDisbale = true;
                    }
                } else  {
                  this.requestSignOutDisbale=false;
                }
                console.log('endtime===='+endtime);
                console.log('Tooday ===='+today);
              //  console.log('endtime -today '+endtime-today);
                let endDurationInMilliSeconds =today-endtime;
                let endDuartionInHours = endDurationInMilliSeconds / (1000 * 60 * 60);
                console.log(' endDuartionInHours'+endDuartionInHours);
                this.ExtendedDuartion=endDuartionInHours;
                let extendedHours = Math.trunc(this.ExtendedDuartion);  // Get the whole number part (hours)
                let extendedMinutes = Math.abs(this.ExtendedDuartion % 1) * 60; // Get the decimal part and convert to minutes

                this.extendedDurationFormatted = `${extendedHours.toString().padStart(2, '0')}:${extendedMinutes.toFixed(0).padStart(2, '0')}`;


                if (selectedRow.Log_In_Date_Time__c !=null && selectedRow.Log_Out_Date_Time__c ==null  &&  (this.DateShift ==this.prsentDate ||  this.prsentDate==this.shiftEndDate)  ){ //&& endDuartionMinutes <=30
                 // console.log('logintime'+selectedRow.Log_In_Date_Time__c);
                 console.log('inside if request  ');
                  this.signoutDisable=false;
                  this.attachDisable=false;
                  this.disableActivityandChecklist=false;
                }else {
                  console.log('inside else request  ');
                  this.signoutDisable=true;
                  this.attachDisable=true;
                  this.disableActivityandChecklist=true;
                }
                if(selectedRow.Log_In_Date_Time__c ==null && durationInMinutes <(-30) &&    (this.DateShift ==this.prsentDate ||  this.prsentDate==this.shiftEndDate) &&  selectedRow.Enable_Sign_In__c!=true){
                  
                  this.requestSignDisbale=false
                }else{
                  this.requestSignDisbale=true
                }
                if(selectedRow.Log_In_Date_Time__c ==null && selectedRow.Enable_Sign_In__c==true  ){
                  this.bDisable=false;
                }
                if(selectedRow.Log_Out_Date_Time__c ==null && selectedRow.Enable_Sign_Out__c==true  ){
                  this.signoutDisable=false;
                  this.requestSignDisbale = true;
                }
                if(selectedRow.Log_Out_Date_Time__c !=null ){
                  this.requestSignOutDisbale = true;
                }
                if(selectedRow.Log_Out_Date_Time__c ==null && this.status == 'In Progress'){
                  this.requestSignOutDisbale = true;
                }   
         }); 
       
    }*/
    

    /* handleSelected(event) {  
    const selectedRowId = event.target.dataset.id; 
    const isChecked = event.target.checked; 

    let selectedRows = [];

    if (isChecked) {
        let Row = this.signinList.find(row => row.Id === selectedRowId);
        if (Row) {
            selectedRows.push(Row);
        }
    } else {
        selectedRows = selectedRows.filter(row => row.Id !== selectedRowId);
    }

    selectedRows.forEach((selectedRow) => {
        // Assign shift details
        this.selectedShift = selectedRow.Id;
        this.ShiftType = selectedRow.Shift_Type__c;
        this.Location = selectedRow.Shift_Locations__c;
        this.startTime = selectedRow.Start_time_Formula__c;
        this.endtime = selectedRow.End_time_formula__c;
        this.role = selectedRow.Role_formula__c;
        this.facility = selectedRow.Staff__r.Facility__r.Name;
        this.DateShift = new Date(selectedRow.Date__c).toLocaleDateString('en-GB');
        this.shiftEndDate = new Date(selectedRow.Add_Shift__r.End_Date__c).toLocaleDateString('en-GB');
        this.shiftNotes = selectedRow.SignIn_Notes__c;
        this.AddShiftDuartion = selectedRow.Add_Shift_Duration_hh_mm__c;
        this.status = this.convertStatus(selectedRow.Status__c);
        this.addShiftId = selectedRow.Add_Shift__r.Id;
        this.isSleepOverShift = selectedRow.Sleepover_shift__c;

        const starttimeArry = selectedRow.Add_Shift__r.Start_time_Formula__c.split(":");
        const endTimeArry = selectedRow.Add_Shift__r.End_time_formula__c.split(":");

        let today = new Date(); 
        let presentday = today.getDate().toString().padStart(2, '0');
        let presentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
        this.prsentDate = `${presentday}/${presentMonth}/${today.getFullYear()}`;

        // Parse shift start time
        let ShiftStratTime = new Date();
        ShiftStratTime.setHours(parseInt(starttimeArry[0], 10));
        ShiftStratTime.setMinutes(parseInt(starttimeArry[1], 10));

        let durationInMilliseconds = ShiftStratTime - today;
        let durationInMinutes = durationInMilliseconds / (1000 * 60);

        // Parse shift end date/time
        let [dayEnd, monthEnd, yearEnd] = this.shiftEndDate.split('/').map(Number);
        let endtime = new Date(yearEnd, monthEnd - 1, dayEnd); 
        endtime.setHours(parseInt(endTimeArry[0], 10));
        endtime.setMinutes(parseInt(endTimeArry[1], 10));

        // Parse shift start date only (for comparing with todayDate)
        let [dayStart, monthStart, yearStart] = this.DateShift.split('/').map(Number);
        let shiftDate = new Date(yearStart, monthStart - 1, dayStart);
        let todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Enable/Disable Sign-In button
        if ((durationInMinutes <= 15 && durationInMinutes >= -30) 
            && selectedRow.Log_In_Date_Time__c == null 
            && (this.DateShift == this.prsentDate || this.prsentDate == this.shiftEndDate)) {
            this.bDisable = false;
        } else {
            this.bDisable = true;
        }

        // If admin forced sign-in enabled
        if (selectedRow.Log_In_Date_Time__c == null && selectedRow.Enable_Sign_In__c == true) {
            this.bDisable = false;
        }

        // Extended duration calculation
        let endDurationInMilliSeconds = today - endtime;
        let endDuartionInHours = endDurationInMilliSeconds / (1000 * 60 * 60);
        this.ExtendedDuartion = endDuartionInHours;
        let extendedHours = Math.trunc(this.ExtendedDuartion);  
        let extendedMinutes = Math.abs(this.ExtendedDuartion % 1) * 60; 
        this.extendedDurationFormatted = `${extendedHours.toString().padStart(2, '0')}:${extendedMinutes.toFixed(0).padStart(2, '0')}`;

        console.log('selectedRow.Log_In_Date_Time__c >>>', selectedRow.Log_In_Date_Time__c);
        console.log('selectedRow.Log_Out_Date_Time__c >>>', selectedRow.Log_Out_Date_Time__c);
        console.log('selectedRow.Log_Out_Date_Time__c >>>', selectedRow.Log_Out_Date_Time__c);
        console.log('this.DateShift >>>', this.DateShift);
        console.log('this.prsentDate >>>', this.prsentDate);
        console.log('this.shiftEndDate >>>', this.shiftEndDate);
        // Sign-out / attachments enablement
        if (selectedRow.Log_In_Date_Time__c != null 
            && selectedRow.Log_Out_Date_Time__c == null  
            && (this.DateShift == this.prsentDate || this.prsentDate == this.shiftEndDate)) {
            this.signoutDisable = false;
            this.attachDisable = false;
            this.disableActivityandChecklist = false;
        } else {
            this.signoutDisable = true;
            this.attachDisable = true;
            this.disableActivityandChecklist = true;
        }

        // Request Sign-In button enablement
        if (selectedRow.Log_In_Date_Time__c == null 
            && durationInMinutes < -30 
            && (this.DateShift == this.prsentDate || this.prsentDate == this.shiftEndDate) 
            && selectedRow.Enable_Sign_In__c != true) {
            this.requestSignDisbale = false;
        } else {
            this.requestSignDisbale = true;
        }

        // ✅ Consolidated Request Sign-Out Logic
        this.requestSignOutDisbale = true; // default

        if (selectedRow.Log_Out_Date_Time__c == null 
            && (this.DateShift == this.prsentDate || this.prsentDate == this.shiftEndDate)) {
            
            // Allow if shift date is greater than today
            if (shiftDate > todayDate) {
                this.requestSignOutDisbale = false;
            }

            // Allow if Enable_Sign_Out__c is true
            if (selectedRow.Enable_Sign_Out__c == true) {
                this.requestSignOutDisbale = false;
                this.signoutDisable = false;
                this.requestSignDisbale = true;
            }
        }

        // If already logged out → must always disable
        if (selectedRow.Log_Out_Date_Time__c != null) {
            this.requestSignOutDisbale = true;
        }

        // If status is In Progress but not logged out → request sign out must stay disabled
        if (selectedRow.Log_Out_Date_Time__c == null && this.status == 'In Progress') {
            this.requestSignOutDisbale = false;
        }

        // 🚨 NEW CONDITION: Disable if DateShift is today or in the future
        if (this.DateShift >= this.prsentDate) {
            this.requestSignOutDisbale = true;
        }

        if(selectedRow.Enable_Sign_Out__c == true){
          this.requestSignOutDisbale = true;
          this.signoutDisable = false;
        }
        
    }); 
} */

    handleSelected(event) {  
      const selectedRowId = event.target.dataset.id; 
      const isChecked = event.target.checked; 
      console.log('row selected ',selectedRowId );
      
      getShiftDetailsById({ shiftId: selectedRowId })
        .then(response => {
          let selectedRows = [];
          this.noRecordsFlag = !(response && response.length > 0);
                this.shiftDetails = response.map(rec => ({
                  ...rec
                  //uidate: rec.Date__c ? new Date(rec.Date__c).toLocaleDateString('en-GB') : ''
              }));

          if (isChecked) {
              let Row = this.shiftDetails.find(row => row.Id === selectedRowId);
              if (Row) {
                  selectedRows.push(Row);
              }
          } else {
              selectedRows = selectedRows.filter(row => row.Id !== selectedRowId);
          }
          console.log('selectedRows',JSON.stringify(selectedRows));

          selectedRows.forEach((selectedRow) => {
              // Assign shift details
              this.selectedShift = selectedRow.Id;
              this.ShiftType = selectedRow.Shift_Type__c;
              this.Location = selectedRow.Shift_Locations__c;
              this.startTime = selectedRow.Start_time_Formula__c;
              this.endtime = selectedRow.End_time_formula__c;
              this.role = selectedRow.Role_formula__c;
              this.facility = selectedRow.Staff__r.Facility__r.Name;
              this.DateShift = new Date(selectedRow.Date__c).toLocaleDateString('en-GB');
              this.shiftEndDate = new Date(selectedRow.Add_Shift__r.End_Date__c).toLocaleDateString('en-GB');
              this.shiftNotes = selectedRow.SignIn_Notes__c;
              this.AddShiftDuartion = selectedRow.Add_Shift_Duration_hh_mm__c;
              this.status = this.convertStatus(selectedRow.Status__c);
              this.addShiftId = selectedRow.Add_Shift__r.Id;
              this.isSleepOverShift = selectedRow.Sleepover_shift__c;
            
            if (selectedRow.Services_and_Support_Plans__r && selectedRow.Services_and_Support_Plans__r.length > 0) {
                    const firstPlan = selectedRow.Services_and_Support_Plans__r[0];
                    this.participant = firstPlan.Client__r.Display_Nickname__c;  // Access Name__c inside Client__r
                } else {
                    this.participant = '';
                }
                console.log('participant', this.participant);

              const starttimeArry = selectedRow.Add_Shift__r.Start_time_Formula__c.split(":");
              const endTimeArry = selectedRow.Add_Shift__r.End_time_formula__c.split(":");

              let today = new Date(); 
              let presentday = today.getDate().toString().padStart(2, '0');
              let presentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
              this.prsentDate = `${presentday}/${presentMonth}/${today.getFullYear()}`;

              // Parse shift start time
              let ShiftStratTime = new Date();
              ShiftStratTime.setHours(parseInt(starttimeArry[0], 10));
              ShiftStratTime.setMinutes(parseInt(starttimeArry[1], 10));

              let durationInMilliseconds = ShiftStratTime - today;
              let durationInMinutes = durationInMilliseconds / (1000 * 60);

              // Parse shift end date/time
              let [dayEnd, monthEnd, yearEnd] = this.shiftEndDate.split('/').map(Number);
              let endtime = new Date(yearEnd, monthEnd - 1, dayEnd); 
              endtime.setHours(parseInt(endTimeArry[0], 10));
              endtime.setMinutes(parseInt(endTimeArry[1], 10));

              // Parse shift start date only (for comparing with todayDate)
              let [dayStart, monthStart, yearStart] = this.DateShift.split('/').map(Number);
              let shiftDate = new Date(yearStart, monthStart - 1, dayStart);
              let todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

              // Enable/Disable Sign-In button
              if ((durationInMinutes <= 15 && durationInMinutes >= -30) 
                  && selectedRow.Log_In_Date_Time__c == null 
                  && (this.DateShift == this.prsentDate || this.prsentDate == this.shiftEndDate)) {
                  this.bDisable = false;
              } else {
                  this.bDisable = true;
              }

              // If admin forced sign-in enabled
              if (selectedRow.Log_In_Date_Time__c == null && selectedRow.Enable_Sign_In__c == true) {
                  this.bDisable = false;
              }

              // Extended duration calculation
              let endDurationInMilliSeconds = today - endtime;
              let endDuartionInHours = endDurationInMilliSeconds / (1000 * 60 * 60);
              this.ExtendedDuartion = endDuartionInHours;
              let extendedHours = Math.trunc(this.ExtendedDuartion);  
              let extendedMinutes = Math.abs(this.ExtendedDuartion % 1) * 60; 
              this.extendedDurationFormatted = `${extendedHours.toString().padStart(2, '0')}:${extendedMinutes.toFixed(0).padStart(2, '0')}`;

              console.log('selectedRow.Log_In_Date_Time__c >>>', selectedRow.Log_In_Date_Time__c);
              console.log('selectedRow.Log_Out_Date_Time__c >>>', selectedRow.Log_Out_Date_Time__c);
              console.log('this.DateShift >>>', this.DateShift);
              console.log('this.prsentDate >>>', this.prsentDate);
              console.log('this.shiftEndDate >>>', this.shiftEndDate);

              // Sign-out / attachments enablement
              if (selectedRow.Log_In_Date_Time__c != null 
                  && selectedRow.Log_Out_Date_Time__c == null  
                  && ( this.prsentDate ==this.DateShift  || this.prsentDate == this.shiftEndDate)) {
                    console.log( 'signin and no signout');
                    if (selectedRow.Break_Timings__r && selectedRow.Break_Timings__r.length > 0) {
                        const firstBreak = selectedRow.Break_Timings__r[0];

                        this.currentBreakId = firstBreak.Id;
                        console.log('this.currentBreakId  in selected rows : ',this.currentBreakId);
                        if (!firstBreak.Break_End_Time__c) {
                            // Still in a break, enable Breakout
                            this.isBreakinVisible = true;
                            this.isBreakoutVisible = true;
                            this.isSigninVisible = false;
                            this.isSignoutVisible = false;

                            this.breakOutDisable=false;
                            this.breakInDisable = true;
                        }

                        console.log('First Break Record ID:', this.breakRecordId);
                    } else {
                        console.log('No break records found for this shift.');
                        this.isSigninVisible = false;
                        this.isSignoutVisible = true;
                        this.isBreakinVisible = true;
                        this.isBreakoutVisible = false;

                        this.breakInDisable = false;
                        this.signoutDisable = false;
                    }
                  // this.signoutDisable = false;
                  this.attachDisable = false;
                  this.disableActivityandChecklist = false;
              } else {
                  console.log('no signin and signout');
                  this.signoutDisable = true;
                  this.attachDisable = true;
                  this.disableActivityandChecklist = true;
                  //

                  this.isBreakinVisible = false;
                  this.isBreakoutVisible = false;
                  this.isSigninVisible = true;
                  this.isSignoutVisible = true;

              }

              // Request Sign-In button enablement
              if (selectedRow.Log_In_Date_Time__c == null 
                  && durationInMinutes < -30 
                  && (this.DateShift == this.prsentDate || this.prsentDate == this.shiftEndDate) 
                  && selectedRow.Enable_Sign_In__c != true) {
                  this.requestSignDisbale = false;
              } else {
                  this.requestSignDisbale = true;
              }

              // ✅ Request Sign-Out Logic
              this.requestSignOutDisbale = true; // default

              if (selectedRow.Log_Out_Date_Time__c == null) {
                  // Rule 1: If shiftDate is today or future → always disable
                  if (shiftDate >= todayDate) {
                      this.requestSignOutDisbale = true;
                  } else {
                      // Rule 2: Allow request sign-out for past shifts
                      this.requestSignOutDisbale = false;
                  }

                  // Rule 3: If status is In Progress (and past shift), allow request
                  if (this.status === 'In Progress' && shiftDate < todayDate) {
                      this.requestSignOutDisbale = false;
                  } else {
                      this.requestSignOutDisbale = true;
                  }

                  // Rule 4: If Enable_Sign_Out__c is true → allow direct signout, request disabled
                  if (selectedRow.Enable_Sign_Out__c === true) {
                      this.requestSignOutDisbale = true; // request disabled
                      this.signoutDisable = false;       // allow normal signout
                      this.requestSignDisbale = true;
                  }
              } else {
                  // Already logged out → always disable
                  this.requestSignOutDisbale = true;
              }

              // 🚨 Final safeguard: If signout is enabled, request must stay disabled
              if (this.signoutDisable === false) {
                  this.requestSignOutDisbale = true;
              }

            
          }); 
      })
      .catch(error => {
          console.error('Error fetching shift by ID:', error);
      });
  }



    onFileUpload(event) {
        this.isattachError=false;
        this.reiburseFileLength=event.target.files.length;
        if (event.target.files.length > 0) {
            this.showSpinner = true;
            this.selectedFilesToUpload = event.target.files;      
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;     
            
            if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
                this.isattachError=true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {        
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
                //read the file chunkwise
                let sliceSize = 1024;           
                let byteCharacters = atob(fileContents);
                let bytesLength = byteCharacters.length;
                let slicesCount = Math.ceil(bytesLength / sliceSize);                
                let byteArrays = new Array(slicesCount);
                for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    let begin = sliceIndex * sliceSize;
                    let end = Math.min(begin + sliceSize, bytesLength);                    
                    let bytes = new Array(end - begin);
                    for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);         
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
                
                //from arraybuffer create a File instance
                this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                    console.log('base64FileData IN onFileUpload : '+JSON.stringify(this.base64FileData))
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        this.showSpinner = false;
        console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
        console.log('file prepared');
      }  
      handleChange(event){
     
        if(event.target.name=="Amount"){
          this.amount=event.target.value;
        }
        if(event.target.name=="others"){
          this.others=event.target.value;
        }
        if(event.target.name=="comment"){
          this.comments=event.target.value;
        }
        if(event.target.name=="vehicle"){
          this.vehicleValue=event.target.value;
          console.log('vehicleValue >>'+ this.vehicleValue);
        }
             
      }      
     
      onSubmitForApproval(){
        if(this.others && this.comments && this.reiburseFileLength ){
        createReimbursement({signinId:this.selectedShift,Amount:parseFloat(this.amount),MileageAndOthers:this.others, typeofvehicle: this.vehicleValue, comments: this.comments,isupdate:false,reimbId:'NA'})
        .then(result => {
          console.log('reimbursements id'+result);
          this.recordId=result;
          console.log('rec id'+ this.recordId);
          console.log('base64FileData'+JSON.stringify(this.base64FileData))
          this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Reimbursement send for approval successfully.',
                variant: 'success',
            }),
        );
         // this.showSpinner = true;
          if(this.fileName.length > 0){
            console.log('file length'+this.fileName.length);
            console.log('reimburse recordId'+this.recordId);
            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:this.recordId,obj:'reimburse'}).then(result => {
                console.log('Upload result = ' +result);
                this.fileName = this.fileName + ' - Uploaded Successfully';                
                //const myTimeout = setTimeout( this.createInvoices(), 10000); 
                this.showSpinner = false;                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.file.name + ' - Uploaded Successfully!!!',
                        variant: 'success',
                    }),
                );
                this.amount = '';
                this.others = '';
                this.vehicleValue = '';
                this.comments = '';
                this.base64FileData = [];
                this.fileName = '';
                this.reiburseFileLength = 0;
                this.recordId = '';
                this.selectedShift = '';
                this.attachDisable=false;


            })
              .catch(error => {
                 // window.console.log(error);
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: 'Error in uploading File',
                          message: error.message,
                          variant: 'error',
                      }),
                  );
                  this.showSpinner = false;
                  this.amount = '';
                  this.others = '';
                  this.vehicleValue = '';
                  this.comments = '';
                  this.base64FileData = [];
                  this.fileName = '';
                  this.reiburseFileLength = 0;
                  this.recordId = '';
                  this.selectedShift = '';
                  this.attachDisable=false;
              });
              
            }
          }).catch(error=>{
            this.error = error;
            console.log('Error >>>'+JSON.stringify(this.error));
          });
                   

         // this.isSubmitted =true;
          this.dispatchEvent(new RefreshEvent());
        } else{
          this.dispatchEvent(
            new ShowToastEvent({
              title: 'Error',
              message: 'Please provide Mileage, Comments , others and file ',
              variant: 'Error'
            })
          );
        }
      }

      handleSigninTime(){
        var today = new Date();      
        this.loginTime=(today.getHours() + ":" + today.getMinutes());     
        //console.log( ' this.loginTime',this.loginTime)  ;
        //console.log( ' this.loginTime format==>',typeof(this.loginTime)) ;
        updateSignInTime({loginTime: this.loginTime,signinId: this.selectedShift,isSignInFromWeb:true}).then(result => {
         // console.log('SingIn Id>>>>>'+this.signinId);
         // console.log('result???'+result);
          if(result){
            this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Success!!',
                  message: 'Successfully Signed In',
                  variant: 'success',
              }),
          );
          }

        }).catch(error=>{
          this.error = error;
         // console.log('Error >>>'+JSON.stringify(this.error));
        })
        
        this.isSigninVisible = false;
        this.isSignoutVisible = true;
        this.isBreakinVisible = true;
        this.isBreakoutVisible = false;

        //this.bDisable=true;
        this.signoutDisable=false;
        this.breakInDisable=false;
       // this.breakOutDisable=true;


        this.attachDisable =false;
        this.dispatchEvent(new RefreshEvent());
        refreshApex(this.signinList);
      }

      @track shiftnotes;
      @track shiftnotesTemplate = false;
      
      handleSignOutTime(){
        console.log(' end duration in hours '+this.ExtendedDuartion);
        console.log(' Add shift Duration  in hours '+this.AddShiftDuartion);
        console.log('  shift end time '+this.endtime);
        console.log('isSleepOverShift '+ this.isSleepOverShift)
        console.log(' this.activitydata '+JSON.stringify(this.checklistData));
        
        this.finalReviewActivity=[];
        this.isShowActivityinReview=this.activitydata.length>0 ?true:false;
        this.finalReviewActivity = this.activitydata.map((activity, index) => ({
          ...activity, // Spread existing activity properties
          serialNumber: index + 1 // Add serial number starting from 1
      }));
  
        this.isShowChecklsitinReview=this.checklistData.length>0 ?true:false;
        if(this.ExtendedDuartion >=0){
          this.shiftnotesTemplate=true;
          this.isExtentedShift=true;
          this.addShiftNotes=false;
        
          this.ExtendedDuartion=this.ExtendedDuartion.toFixed(2);
          
        }else{
          console.log('in else condition '+ this.shiftnotesTemplate)
          this.isExtentedShift=false;
          this.shiftnotesTemplate = true;
          this.sleepoverTemplate=this.isSleepOverShift;

          this.addShiftNotes= this.sleepoverTemplate ==true? false:true;
          this.LoghoursButtontemplate= this.sleepoverTemplate;
        }
        this.attachDisable = true;

        this.isSigninVisible = true;
        this.isSignoutVisible = true;
        this.isBreakinVisible = false;
        this.isBreakoutVisible = false;

        this.bDisable=true;
        this.signoutDisable=true;
        //this.breakInDisable=true;
        //this.breakOutDisable=true;
       
       // console.log('sign out shift==>'+this.selectedShift);
      }
      handleBreakTime(event) {
        const actionName = event.target.name;
        var today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();      
        const breakTime =(today.getHours() + ":" + today.getMinutes()); 

        switch (actionName) {
            case 'breakIn':
                console.log('breakIn clicked');
                this.breakInTime = breakTime;
                this.breakStartDate =  `${year}-${month}-${day}`;
                console.log('breakInTime==>'+this.breakInTime);
                console.log('breakStartDate==>'+this.breakStartDate);

                
                console.log('selected shift in handleBreakTime==>'+this.selectedShift);
                createBreakTimeRecord({ shiftId: this.selectedShift, breakInTime: this.breakInTime, breakStartDate: this.breakStartDate })
                  .then((result) => {
                      this.currentBreakId = result;
                      console.log('Break record created:', result);
                      this.isSigninVisible = false;
                      this.isSignoutVisible = false;
                      this.isBreakinVisible = true;
                      this.isBreakoutVisible = true;

                      //this.bDisable=true;
                      //this.signoutDisable=true;
                      this.breakInDisable=true;
                      this.breakOutDisable=false;
                  })
                  .catch((error) => {
                      console.error('Error creating break record:', error);
                  });
                break;

            case 'breakout':
                console.log('Breakout clicked');
               
                this.breakOutTime = breakTime;
                this.breakEndDate =   `${year}-${month}-${day}`;
                console.log('breakOutTime==>'+this.breakOutTime);
                console.log('breakEndDate==>'+this.breakEndDate);
                
                console.log('this.currentBreakId  in  handle breakout click : ',this.currentBreakId);
                if (this.currentBreakId) {
                    updateBreakTimeRecord({
                        breakId: this.currentBreakId,
                        breakOutTime: this.breakOutTime,
                        breakEndDate: this.breakEndDate
                    })
                    .then(() => {
                        console.log('Break record updated.');
                        this.currentBreakId = null; // Reset for next break
                        this.isSigninVisible = false;
                        this.isSignoutVisible = true;
                        this.isBreakinVisible = true;
                        this.isBreakoutVisible = false;

                        //this.bDisable=true;
                          this.signoutDisable=false;
                          this.breakInDisable=false;
                        // this.breakOutDisable=true;
                    })
                    .catch(error => {
                        console.error('Error updating break record:', error);
                    });
                } else {
                    console.warn('No break ID found for update.');
                }
                break;

            default:
                console.warn('Unknown break action:', actionName);
        }
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
    
    @track notesInputField=false;
    @track addShiftNotes=false;

    handleAddNotes(){
      this.notesInputField=true;
      this.addShiftNotes=false;      
    }

    handleShiftNotesChange(event){        
      this.shiftnotes=event.target.value;          
    }
    
    handleeditClose(event){
      this.notesInputField=false; 
      
     

       this.signoutFinal();
      this.addShiftNotes=false;
     // this.emptyFields();
      //this.signoutDisable=true;
      this.isExtentedShift=false;
      this.extendedShiftDetailsFlag=false;
      this.isShowChecklsitinReview=false;
      this.isShowActivityinReview=false;
      this.sleepoverTemplate=false;
      this.LoghoursButtontemplate=false;
      this.sleepOverFinalLogOut=false;
      this.shiftnotesTemplate=false;  
      this.nightShiftHourComments='' ;
      this.extendedComments='';
     // this.sleepoverTemplate=false;
  
    }
    handleShiftNotesTemplateClose(){
      console.log(' this.requestSignOut before : ',  this.requestSignOut );
      console.log('signOutRequesttemplate before => ', this.signOutRequesttemplate);
      this.attachDisable = false;
      this.isExtentedShift=false;
      this.extendedShiftDetailsFlag=false;
      this.isShowChecklsitinReview=false;
      this.isShowActivityinReview=false;
      this.sleepoverTemplate=false;
      this.LoghoursButtontemplate=false;
      this.sleepOverFinalLogOut=false;
      this.shiftnotesTemplate=false; 
      this.nightShiftHourComments='' ;
      this.extendedComments='';
      this.signInRequesttemplate=false;
      this.signOutRequesttemplate = false;
      this.logSleepoverHours=false;
      this.requestSignOut = false;
      console.log('signOutRequesttemplate after => ', this.signOutRequesttemplate);
      console.log(' this.requestSignOut after : ',  this.requestSignOut );
    }

    handleSignOutClose(){
      this.addShiftNotes = false;
    }

    handleUpdateNotes(event){
      this.addShiftNotes=false;
      this.signoutFinal(); 
      this.notesInputField=false;
      this.addShiftNotes=false;
      this.shiftnotesTemplate=false;
      //this.signoutDisable=true;
    }
    
    signoutFinal(){
      var today = new Date();         
      this.logOutTime=(today.getHours() + ":" + today.getMinutes()); 
    
      if( this.isExtentedShift==true){
        this.logOutTime=''
        console.log('endtime '+this.endtime);
      
          let timeParts = this.endtime.split(/[: ]/); // Split by ":" and " "
          let endHours = parseInt(timeParts[0], 10);
          let endMinutes = timeParts[1];
          let period = timeParts[2]; // AM or PM

          if (period === 'PM' && endHours !== 12) {
              endHours += 12; // Convert PM hours to 24-hour format
          } else if (period === 'AM' && endHours === 12) {
              endHours = 0; // Convert 12 AM to 00
          }

          this.logOutTime = `${endHours}:${endMinutes}`; // Assign converted time
          
      }
      console.log('logOutTime '+this.logOutTime);
      console.log(' ExtendedDuartion '+this.ExtendedDuartion);
      console.log(' SleepoverNightShiftHours '+this.SleepoverNightShiftHours);
       updateSignOutTime({logOutTime: this.logOutTime,signinId: this.selectedShift, shiftNotes: this.shiftnotes,isSignOutFromWeb:true,SleepoverNightShiftHours:this.SleepoverNightShiftHours,
        nightShiftHourComments:this.nightShiftHourComments,extendedComments:this.extendedComments
       }).then(result => {
       // console.log('result???'+result);
        if(result){
        this.dispatchEvent(
          new ShowToastEvent({
              title: 'Success!!',
              message: 'Shift signed out successfully.',
              variant: 'success',
          }),
        );
       }
      }).catch(error=>{
        this.error = error;
      })
      this.signoutDisable=true; 
    }
    HandlegetCheckLIst(){
    this.isShowChecklsit=true;
    console.log('addShiftid '+ this.addShiftId);
    if(!this.addShiftId){
      this.confirMationMessage('Error','Select a shift from the list to proceed.','Error');
      this.isShowChecklsit=false;
    }
   
    setTimeout(()=>{
      refreshApex(this.wiredCheckListResponse);
    },1000)
    }
    handleeditCloseCheckList(event){
      this.isShowChecklsit=false;
      this.isShowActivity=false;
      this.shiftActivity='';
     // this.checklistData=[];
     // this.activitydata=[];
    }

    handleCheckboxChange(event) {
      let recordId = event.target.dataset.id;
      let updatedValue = event.target.checked;

      this.checklistData = this.checklistData.map(item => {
          if (item.id === recordId) {
              return { ...item, isCompleted: updatedValue };
          }
          return item;
      });
      console.log('check list '+JSON.stringify(this.checklistData));
  }

  // Bulk Update Handler
  handleCheckListUpdate() {
    let updatedRecords = this.checklistData.filter(item => item.isCompleted) 
    .map(item => ({
        id: item.id,
        isCompleted: item.isCompleted
    }));
      console.log('check list '+JSON.stringify(updatedRecords));
       updateCheckListRecords({ checklistUpdatesJson:JSON.stringify(updatedRecords)})
          .then(result => {
            console.log('result '+JSON.stringify(result));
            if(result.success){
              this.confirMationMessage('Success','Checklist updated successfully','success');
              this.handleeditCloseCheckList();
            }else{
               this.confirMationMessage('Error',result.message,'error');
               this.handleeditCloseCheckList();
            }
              
              return refreshApex(this.wiredCheckListResponse);
          })
           
  }
  HandleActivityLog(){
    console.log('shiftWithStaff Id '+ this.selectedShift);
    if(!this.selectedShift){
      this.confirMationMessage('Error','Select a shift from the list to proceed.','Error');
      this.isShowActivity=false;
    } else{
      refreshApex(this.wiredActivityresponse);
      this.isShowActivity=true;
    }
  }
  handleActivityChange(event){
    this.shiftActivity=event.target.value;
    this.showClearIcon = this.shiftActivity.length > 0;
  }
  handleAddActivity(event){
   // console.log('shift activity '+event.target.value)
    console.log('shift activity '+this.shiftActivity)
     addShiftActivity({shiftStaffId:this.selectedShift,Activity:this.shiftActivity}).then(result => {
      if(result){
        console.log('result '+JSON.stringify(result));
          setTimeout(()=>{
            this.confirMationMessage('Success','Activity added successfully','success');
            this.shiftActivity='';
            this.handleeditCloseCheckList();
            refreshApex(this.wiredActivityresponse);
          },1000)
       
        }
      }) 
    
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
  get iconName() {
    console.log('isListening  in get icon:'+this.isListening);
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
    console.log('toggleListening>>');
     try {
      console.log('isListening :'+this.isListening);
         this.isListening = !this.isListening;
         if (this.isListening) {
          console.log('if in toggle listning');
             this.startListening();
         } else {
             this.stopListening();
         }
     } catch (error) {
         console.error('Error in toggleListening:', error.message);
     }
  }
  handleFocus() {
    console.log('handleFocus executing >>');
    try {
        this.showMuteIcon = true;
        console.log('showMuteIcon :'+this.showMuteIcon);
        this.isListening = false; // Ensure the state is not in listening mode
        if (this.recognition) {
          this.recognition.stop(); // Stop any ongoing recognition process
          this.recognition = null; // Clear recognition instance
        }
    } catch (error) {
        console.error('Error in handleFocus:', error.message);
    }
  }
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
                this.shiftActivity += Array.from(event.results)
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
          this.shiftActivity = '';
          this.showClearIcon = false;
          if (this.isListening) {
              //this.startListening();
              this.stopListening();
              this.shiftActivity = '';
            } 
      } catch (error) {
          console.error('Error in clearText:', error.message);
      }
      
  }
  handleExtendedShiftReview(){
    this.extendedShiftDetailsFlag=true;
    this.isExtentedShift=false;
    
    this.sleepoverTemplate=this.isSleepOverShift;
    this.LoghoursButtontemplate=true;
    this.logSleepoverHours=false;
    console.log('sleepoverTemplate ' +this.sleepoverTemplate);
   // refreshApex(this.wiredCheckListResponse);
   // console.log('check list data  '+JSON.stringify(this.checklistData));
 
  }
  handleSleepoverLogHours(){
      this.logSleepoverHours=true;
      this.LoghoursButtontemplate=false;
      this.sleepOverFinalLogOut=true;
      
  }
    handleHoursChange(event) {
      this.selectedHours = event.target.value; // Store as string
      this.calculateTotalHours();
    }

    handleMinutesChange(event) {
      this.selectedMinutes = event.target.value; // Store as string
      this.calculateTotalHours();
    }

    // Convert to total hours while keeping selected values as strings
    calculateTotalHours() {
      let hours = parseInt(this.selectedHours, 10) || 0;
      let minutes = parseInt(this.selectedMinutes, 10) || 0;
      
      this.SleepoverNightShiftHours = hours + minutes / 60;
      this.SleepoverNightShiftHours = this.SleepoverNightShiftHours.toFixed(2);
      this.SleepoverShiftFormattedHours=hours +':'+minutes;
     // this.FinalShiftDuartion=this.AddShiftDuartion-this.SleepoverNightShiftHours;
    }
    handleReasons(event){
      console.log('event '+JSON.stringify(event));
      console.log('event.target.name '+event.target.name);
      console.log('event.target.value '+event.target.value)
        if(event.target.name=='ExtendedComments'){
            this.extendedComments=event.target.value;
            
        }else if(event.target.name=='nightShiftHourComents'){
            this.nightShiftHourComments=event.target.value;
            
        }
        console.log('extendedComments '+this.extendedComments);
        console.log('nightShiftHourComents '+this.nightShiftHourComments);
    }
    handleSignInReQUest(){
        this.signInRequesttemplate=true;
    }
    handleSignOutReQUest(event) {
        this.signOutRequesttemplate = event.target.checked; 
        this.requestSignOut = event.target.checked;
        console.log('signOutRequesttemplate => ', this.signOutRequesttemplate);
    }

    HandleFinalRequestSignIn(){
      console.log('shift Id'+ this.selectedShift);
      requestSignIn({shiftId:this.selectedShift}).then(result=>{
              console.log('result '+JSON.stringify(result));
                if(result.success){
                  this.confirMationMessage('Success',result.message,'success');
                }else{
                  this.confirMationMessage('Success',result.message,'success');
                }
                this.signInRequesttemplate=false;        
      })
    }

    HandleFinalRequestSignOut(){
      console.log('shift Id'+ this.selectedShift);
      requestSignOut({shiftId:this.selectedShift}).then(result=>{
              console.log('result '+JSON.stringify(result));
                if(result.success){
                  this.confirMationMessage('Success',result.message,'success');
                }else{
                  this.confirMationMessage('Success',result.message,'success');
                }
                this.signOutRequesttemplate=false;        
      })
    }
   
}