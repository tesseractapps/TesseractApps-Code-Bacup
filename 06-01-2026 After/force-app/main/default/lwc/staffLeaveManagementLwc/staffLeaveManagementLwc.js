import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from '@salesforce/apex';
import getLeaves from '@salesforce/apex/LeaveController.getLeaves';
import updateLeaveStatus from '@salesforce/apex/LeaveController.updateLeaveStatus';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getHolidayCount from '@salesforce/apex/LeaveController.getHolidayCount';
import getHolidayList from '@salesforce/apex/LeaveController.getHolidayList';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

export default class StaffLeaveManagementLwc extends LightningElement {

    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    admin = My_Resource + '/myResource/images/admin.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';

    @api staffId;
    @api orgId;
    @track noRecordsFlag=false;
    @track leaveflag=false;
    @track homeflag=true;
    @track leaves;
    @track duration;
    @track fromDate='';
    @track toDate='';
    @track type;
    @track Annual;
    @track paid;
    @track unpaid;
    @track balance;
    @track other;
    @track Sick;
    @track Parental;
    @track isdisablefields=false;
    @track dateErrorMessage;
    @track clientData;
    @track showSpinner;
    @track isModalOpen = false;
    @track currentUrl;
    @track typeofUser;
    @track ictUserType=true; 
    @track fieldErrorMap = {};
    //@track state ;
    @track holidayCount=0;
    wiredHolidaysResult;
    @track isHolidayModalOpen = false; 
    @track holidayList = [];
    @track holidays= [];
    wiredLeavesForStaff;
    @track dateSortOrder = 'asc';  
    @track dateSortIcon = 'utility:arrowup'; 
    @track staffState;
    @track selectedYear = '2024-2025';
    @track leaveOptions = [];
    @track negativeBalance;
    @track otherLeaveType;
    @track typeOfEmployee;
    @track commentsFlag=false;
    @track showLoadingSpinner=false;
    @track fileName;
    @track saveButtonDisable;

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }
   //@track selectedYear;
   yearOptions =[
    { label:'2023-2024',value:'2023-2024'},
    { label:'2024-2025',value:'2024-2025'},
    { label:'2025-2026',value:'2025-2026'},
    { label:'2026-2027',value:'2026-2027'},
    { label:'2027-2028',value:'2027-2028'},
    { label:'2028-2029',value:'2028-2029'},
   ]

   loadLeaveOptions() {
    // NES + Award Leaves (always available)
    const nesLeavesFTPT = [
        { label: "Annual Leave", value: "Annual Leave" },
        { label: "Personal Leave", value: "Personal Leave" }
    ];

    const nesLeavesAll = [
        { label: "Compassionate Leave", value: "Compassionate Leave" },
        { label: "Parental Leave", value: "Parental Leave" },
        { label: "Community Service Leave", value: "Community Service Leave" },
        { label: "FDV Leave", value: "FDV Leave" },
        { label: "Unpaid Carers Leave", value: "Unpaid Carers Leave" }
    ];

    const awardLeaves = [
        { label: "Long Service Leave", value: "Long Service Leave" },
        { label: "TOIL", value: "TOIL" },
        { label: "RDO/ADO", value: "RDO" }
    ];

    // COMPANY LEAVES — Should display ONLY IF OtherLeaveType__c == true
    const companyLeaves = [
        { label: "Bereavement Leave", value: "Bereavement Leave" },
        { label: "Birthday Leave", value: "Birthday Leave" },
        { label: "Wellness Leave", value: "Wellness Leave" },
        { label: "Religious Leave", value: "Religious Leave" },
        { label: "Study Leave", value: "Study Leave" },
        { label: "Volunteer Leave", value: "Volunteer Leave" }
    ];

    let finalOptions = [];

    // Add FT/PT NES leaves if applicable
    if (this.typeOfEmployee === "Full Time Permanent" || this.typeOfEmployee === "Part Time Permanent") {
        finalOptions = [...finalOptions, ...nesLeavesFTPT];
    }

    // Add All NES leaves
    finalOptions = [...finalOptions, ...nesLeavesAll];

    // Add Award/EBA leaves
    finalOptions = [...finalOptions, ...awardLeaves];

    // CONDITIONAL COMPANY LEAVES
    if (this.otherLeaveType) {
        finalOptions = [...finalOptions, ...companyLeaves];
    }

    this.leaveOptions = finalOptions;
}


   connectedCallback() {
   
    window.addEventListener('click', this.handleOutsideClick.bind(this));
    window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
}

disconnectedCallback() {
    window.removeEventListener('click', this.handleOutsideClick.bind(this));
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
}

 handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
}

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label';
    }
    get FromClass() {
        return this.getFieldClass('From__c');
    }
     get ToClass() {
        return this.getFieldClass('To__c');
    }

   
    handleleave(event){
        if (!this.typeOfEmployee) {
           this.dispatchEvent(
        new ShowToastEvent({
            title: 'Employment Type Missing',
            message: 'Please update Employment Type in Staff record to apply leave.',
            variant: 'error',
            mode: 'sticky'
        })
    );
            return; // ⛔ stop further execution
        }
        this.leaveflag=true;
        this.homeflag=true;
        this.isModalOpen=false;
         this.duration='';
         this.fromDate='';
         this.toDate='';
         this.type='';
         this.paid='';
         this.unpaid='';
         this.balance='';
         this.leaverecordId='';
         this.isdisablefields=false;
        this.isstatus=false;
        this.fileName='';
        this.dateErrorMessage='';
        this.state=this.staffState;
        this.base64FileData='';
        
    }
    handleCancel(event){
        this.leaveflag=false;
        this.homeflag=true;
        //this.state = '';
    }
    @track leavestatus;
    @track cancelFlag =false;
    @track leaveid;
    handlecancelleave(event){
         let status =event.currentTarget.dataset.status;
          this.leaveid=event.currentTarget.dataset.id;
          this.cancelcomments='';
          if(status === 'Cancelled' || status === 'Withdraw'||  status === 'Rejected'){
           this.dispatchEvent(
            new ShowToastEvent({
                title: 'Action Not Allowed',
                message: 'You are not allowed to cancel this leave again.',
                variant: 'warning',
                mode: 'dismissable'
            })
            
        );
        return;
          }
    
        if (status === 'Approved') {
            this.leavestatus = 'Withdraw';
            this.commentsFlag=true;
        } else {
            this.leavestatus = 'Cancelled';
        }
        
      this.cancelFlag=true;

    }
    closeleavecancel(event){
         this.cancelFlag=false;
         this.commentsFlag=false;

    }
    Confirmleavecancel(event){
       /*  if(this.leavestatus==='Approved' && !this.cancelcomments){
             this.dispatchEvent(
            new ShowToastEvent({
                title: 'error',
                message: 'Please give comments.',
                variant: 'error',
                mode: 'dismissable'
            })
            
        );
        return;
        } */
       if (this.leavestatus === 'Withdraw' ) {
        if (!this.cancelcomments || this.cancelcomments.trim() === '') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please enter comments before submitting.',
                    variant: 'error'
                })
            );
            return;
        }
    
    
}

        console.log('leaveid',this.leaveid,'status',this.leavestatus)
      updateLeaveStatus({
        leaveId: this.leaveid,
        statusValue: this.leavestatus,
        cancelComments: this.cancelcomments
    })
    .then(() => {
        // Optional: refresh UI / show toast
       this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Leave status updated successfully.',
                variant: 'success',
                mode: 'dismissable'
            })
        );
         this.cancelFlag=false;
         this.commentsFlag=false;
         refreshApex(this.wiredLeaveResult);
    })
    .catch(error => {
        console.error('Error updating leave status', error);
    });
    }

    handleMouseOver(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoiconhover; // Change the image
            img.style.opacity = '1'; // Fade-in the new image
        }, 150); // Wait for the fade-out to complete
    }
    
    handleMouseOut(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoicon; // Change back to the default image
            img.style.opacity = '1'; // Fade-in the default image
        }, 150); // Wait for the fade-out to complete
    }

    @track annualUsed;
    @track personalUsed;
    @track annualRemaining;
    @track personalRemaining;
    @track annualPercent;
    @track personalPercent;

    @wire(getStaffById, { recordId: '$staffId' })
    wiredClient(result) {
        if (!this.staffId) {
            return; // Exit if no recordId is present
        } 
        this.wiredClientResult = result;
        console.log('staff details: ', JSON.stringify(result)); // Debugging line

        const { data, error } = result;
        if (data) {
            console.log('Data: ', data); // Debugging line
            this.clientData = data;
            this.image = this.clientData[0].picture__c;
            this.StaffId = this.clientData[0].Id;
            this.Annual=this.clientData[0].Annual_leave_Accrued__c;
            this.Sick=this.clientData[0].Personal_Leave_Accur__c;
           /*  this.Parental=this.clientData[0].Parental_Leave__c;
            this.other=this.clientData[0].Bereavement_Leave__c; */
            this.typeOfUser = this.clientData[0].Type_of_User__c; 
            this.staffState =  this.clientData[0].State__c;
            this.negativeBalance = this.clientData[0].Facility__r.Organisation__r.Negative_Balance__c;
            this.otherLeaveType = this.clientData[0].Facility__r.Organisation__r.Other_Leave_Type__c;
            this.typeOfEmployee = this.clientData[0].Type_of_Employe__c;
            console.log('negativeBalance: ', this.negativeBalance);

            let leaves = this.clientData[0].Leaves__r || [];
/* 
            this.annualUsed = leaves.reduce((sum, rec) => {
                return sum + (rec.Annual_Used__c || 0);
            }, 0);

            this.personalUsed = leaves.reduce((sum, rec) => {
                return sum + (rec.Personal_Used__c || 0);
            }, 0); */
            this.annualUsed = Number(
                leaves.reduce((sum, rec) => {
                    return sum + (rec.Annual_Used__c || 0);
                }, 0).toFixed(2)
            );

            this.personalUsed = Number(
                leaves.reduce((sum, rec) => {
                    return sum + (rec.Personal_Used__c || 0);
                }, 0).toFixed(2)
            );


          this.annualRemaining = Number(((this.Annual || 0) - this.annualUsed).toFixed(2));
          this.personalRemaining = Number(((this.Sick || 0) - this.personalUsed).toFixed(2));


            this.annualPercent = Math.round((this.annualUsed / this.Annual) * 100) || 0;
            this.personalPercent = Math.round((this.personalUsed / this.Sick) * 100) || 0;

            if(this.typeOfUser=='ICT User'){         
                // this.isICtUserInViewForm=true;
                 this.ictUserType=true;
             }else{
                // this.isICtUserInViewForm=false;
                 this.ictUserType=false;
             }
              this.loadLeaveOptions();

        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
        //this.state=this.staffState;
        //console.log('state 1 >> '+this.staffState);
    }

    @track approvedCount; 
    @track RejectedCount; 
    @track cancelledCount; 
    @track requestedCount; 
    

    @wire(getLeaves, { recordId: '$staffId', OrgId: '$orgId' })
    wiredLeavesForStaff(result) {
        if (!this.staffId && !this.orgId) {
            return; // Exit if no recordId is present
        } 
        this.wiredLeaveResult = result;
        console.log('Result: ', JSON.stringify(result)); // Debugging line

        const { data, error } = result;
        this.noRecordsFlag = !(data && data.length > 0);
        if (data) {
            console.log('Table data: ', data); // Debugging line
            this.leaves = data.map(leave => {
                return {
                    ...leave,
                    fromdate: leave.From__c ? new Date(leave.From__c).toLocaleDateString('en-GB') : '',
                    Todate: leave.To__c ? new Date(leave.To__c).toLocaleDateString('en-GB') : '',
                     Leave_Duration__c: leave.Leave_Duration__c ? Number(leave.Leave_Duration__c).toFixed(2): '0',

        paid__c: leave.paid__c != null
            ? Number(leave.paid__c).toFixed(2)
            : '0',

        unpaid__c: leave.unpaid__c != null
            ? Number(leave.unpaid__c).toFixed(2)
            : '0' 
                };
            });
            console.log('Table data......>: '+JSON.stringify(this.leaves));      
        let approved = 0;
        let Rejected = 0;
        let cancelled = 0;
        let requested = 0;

        data.forEach(rec => {
            const status = rec.Status__c;

            if (status === 'Approved') {
                approved++;
            } 
            else if (status === 'Cancelled') {
                cancelled++;
            } 
            else if (status === 'Rejected') {
                Rejected++;
            } 
            else if (status === 'Requested') {
                requested++;
            }
        });

        // Assign to tracked variables
        this.approvedCount = approved;
        this.RejectedCount = Rejected;
        this.cancelledCount = cancelled;
        this.requestedCount = requested;               
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    } 

   /*  handleInput(event){
       // console.log('Handle Input Executing');
   const fieldName = event.target.fieldName;
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);
    console.log('field',field);


    this.fieldErrorMap[field] = !isValid;
        //this.state=this.staffState;
       // console.log('state 2 >> '+this.state);
        if (fieldName === 'From__c') {
            this.fromDate = event.target.value;
            console.log('From Date >> '+this.fromDate);
        
        } else if (fieldName === 'To__c') {
            this.toDate = event.target.value;
            console.log('To Date >> '+this.toDate);
            
        }else if (fieldName === 'Type_of_Leave__c') {
            this.type = event.target.value;
        }
        else if (fieldName === 'State__c') {
        this.state = event.target.value;
        }
        //console.log('state 3 >> '+this.state);

        if (this.fromDate && this.toDate && this.state) {
           
            if (new Date(this.toDate) < new Date(this.fromDate)) { 
                 this.dateErrorMessage = 'You cannot set to date that precedes the from date.';
                 this.saveButtonDisable=true;
            } else {
                this.dateErrorMessage = '';
                this.saveButtonDisable=false;
                this.fetchHolidays();
            }
        }
       
        if (this.fromDate && this.toDate && this.state) {
            //this.fetchHolidays();
            
            console.log('holiday count'+this.holidayCount);
            setTimeout(() => {
            if(this.holidayCount !=undefined && this.holidayCount !=null){
                const duration = this.calculateBusinessDays(new Date(this.fromDate), new Date(this.toDate));
                console.log('duration'+duration);
                this.duration = duration - this.holidayCount;

                if (this.type && this.duration && this.state) {
                    let leaveBalance;
                    if (this.type === 'Annual Leave') {
                        leaveBalance = this.Annual;
                    } else if (this.type === 'Sick Leave') {
                        leaveBalance = this.Sick;
                    } else if (this.type === 'Parental Leave') {
                        leaveBalance = this.Parental;
                    } else if (this.type === 'Other Leave') {
                        leaveBalance = this.other;
                    } else {
                        console.error(`Leave type '${this.type}' is not recognized.`);
                        return;
                    }
                    let remainingBalance = leaveBalance - this.duration;
                    this.balance = remainingBalance;
                    if (remainingBalance >= 0) {
                        this.paid = this.duration;
                        this.unpaid = 0;
                    } else {
                        this.paid = leaveBalance;
                        this.unpaid = Math.abs(remainingBalance);
                        this.balance=0;
                    }
                    console.log(`Updated balance: ${this.balance}`);
                }
            }
        }, 1000);
           
        }
        
        
    } */


handleLeaveChange(event) {
    this.type = event.detail.value;
    this.selectedLeaveType = event.detail.value;

    console.log('Selected Leave Type:', this.type);

    // Recalculate as soon as leave type changes
    this.recalculateLeave();
}

@track durationType;
@track startTime;
@track endTime;
@track iscustom=false;

handleInput(event) {

    const fieldName = event.target.fieldName;
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid', isValid);
    console.log('field', field);

    this.fieldErrorMap[field] = !isValid;

    if (fieldName === 'From__c') {
        this.fromDate = event.target.value;
        console.log('From Date >> ' + this.fromDate);

    } else if (fieldName === 'To__c') {
        this.toDate = event.target.value;
        console.log('To Date >> ' + this.toDate);

    } else if (fieldName === 'State__c') {
        this.state = event.target.value;
    }else if (fieldName === 'Duration_Type__c') {
        this.durationType = event.target.value;
        if (this.durationType === 'Custom Hours') {
            this.iscustom = true;
        }else{
            this.iscustom = false;
            this.startTime = '';
            this.endTime = '';
        }
    }
    else if (fieldName === 'Start_Time__c') {
        this.startTime = event.target.value;
    }
    else if (fieldName === 'End_Time__c') {
        this.endTime = event.target.value;
    }

    // Validate date order
    if (this.fromDate && this.toDate && this.state) {
        if (new Date(this.toDate) < new Date(this.fromDate)) {
            this.dateErrorMessage = 'You cannot set to date that precedes the from date.';
            this.dispatchEvent(
        new ShowToastEvent({
            title: 'Validation Error',
            message:'You cannot set to date that precedes the from date.',
            variant: 'error',
            mode: 'dismissable'
        })
    );
            this.saveButtonDisable = true;
            return;
        } else {
            this.dateErrorMessage = '';
            this.saveButtonDisable = false;
            this.fetchHolidays();
        }
    }

    // Once values are present, recalculate leave
    this.recalculateLeave();
}

dailyHours = 7.6; // NES Standard hours/day

recalculateLeave() {

    if (!this.fromDate || !this.toDate || !this.state || !this.type || !this.durationType) {
        return;
    }

    console.log('Recalculating leave...');

    setTimeout(() => {
        if (this.holidayCount == null) return;

        // 1. Calculate business days
        const totalDays = this.calculateBusinessDays(
            new Date(this.fromDate),
            new Date(this.toDate)
        );
        console.log('Business Days:', totalDays);

        console.log('Holiday Count:', this.holidayCount);

        // Remove holidays
         this.duration=0;
        let payableDays = totalDays - this.holidayCount;
         if (this.durationType === 'Half day') {
            console.log('Half Day');
                payableDays = payableDays / 2;
        }

        if (this.durationType === 'Custom Hours') {

            if (!this.startTime || !this.endTime) return;

            const start = this.convertTimeToMinutes(this.startTime);
            const end = this.convertTimeToMinutes(this.endTime);

            if (end <= start) {
                this.showError('End time must be greater than start time');
                return;
            }

            let requestedMinutes = end - start;
            let RequestedHours = requestedMinutes / 60;
            let totalCustomHours = RequestedHours * payableDays;
            
            // Convert hours → days (NES 7.6 hrs)
            payableDays = totalCustomHours/ this.dailyHours;
        }

        // 2. Convert days → hours (NES)
        const leaveHours = payableDays * this.dailyHours;
        this.duration = Number(leaveHours.toFixed(2));// Duration__c field now stores HOURS
        console.log('Leave Hours (NES):', leaveHours);

        // 3. Determine accrued balance based on leave type
        let balanceHours = 0;
        let isAccruedLeave = false; 

        if (this.type === 'Annual Leave') {
            balanceHours = this.annualRemaining;  // Annual_leave_Accrued__c
            isAccruedLeave = true;
        } else if (this.type === 'Personal Leave') {
            balanceHours = this.personalRemaining; // Personal_Leave_Accur__c
            isAccruedLeave = true; 
        } else {

            // 🔶 NEW: Skip balance & paid/unpaid for all other leave types
            this.paid = 0;
            this.unpaid = 0;
            this.balance = 0;
            console.log('Non-accrued leave – skipping balance deduction.');
            return;   // 🔶 NEW — stops further paid/unpaid logic
        }

        console.log('Accrued Balance Hours:', balanceHours);

        // 4. Calculate remaining balance
        let remaining = balanceHours - leaveHours;
        if(remaining < 0 &&  this.negativeBalance==false){
           console.log('Remaining Balance Hours:', remaining)
            this.saveButtonDisable = true;
            const toastEvent = new ShowToastEvent({
            title: "error",
            message: "You cannot request more leave than you have accrued.",
            variant: "error"
        });
       
        this.dispatchEvent(toastEvent);
        return;
        }

        if(isAccruedLeave){
          this.balance = remaining;

        if (remaining >= 0) {
            this.paid = leaveHours;
            this.unpaid = 0;

        } else {
            this.paid = balanceHours;
            this.unpaid = Math.abs(remaining);
            this.balance = 0;
        }
         this.saveButtonDisable = false;
        }
       
      

        console.log('Paid Hours:', this.paid);
        console.log('Unpaid Hours:', this.unpaid);
        console.log('Remaining Hours:', this.balance);

    }, 300);
}

convertTimeToMinutes(timeStr) {
    // Handles "HH:mm" or "HH:mm:ss"
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
}


   

    fetchHolidays() {
        // Call the Apex method imperatively
        getHolidayCount({ startDate: this.fromDate, endDate: this.toDate, state: this.state })
            .then((data) => {
                console.log('Public Holidays:', data);

                // Assuming data is an array of holiday records
                this.publicHolidays = data.map(holiday => holiday.Date__c);
                this.holidayCount = this.publicHolidays.length; // Get the count of holidays
               
                this.weekendHolidays = data.filter(holiday => {
                    const holidayDate = new Date(holiday.Date__c);
                    const dayOfWeek = holidayDate.getDay();
                    return dayOfWeek === 0 || dayOfWeek === 6;
                });
                this.weekendHolidayCount = this.weekendHolidays.length; 
                console.log(`Holiday Count: ${this.holidayCount}`);
                console.log(`weekend Holiday Count: ${this.weekendHolidayCount}`);
                this.holidayCount=this.holidayCount-this.weekendHolidayCount;
                console.log(` NEW Holiday Count: ${this.holidayCount}`);

            })
            .catch((error) => {
                console.error('Error fetching holidays:', error);
                this.publicHolidays = [];
                this.holidayCount = 0; // No holidays available
            });
    }
    calculateBusinessDays(startDate, endDate) {
        let count = 0;
        let currentDate = new Date(startDate);
        

        while (currentDate <= endDate) {
            // Check if current date is a weekend
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return count;
    }

   /* @wire(getHolidayCount, { startDate: '$fromDate', endDate: '$toDate', state: '$state' })
    wiredHolidays(result) {
        this.wiredHolidaysResult = result; // Store the wire result for refresh
        const { data, error } = result;

        if (data) {
            console.log('Public Holidays:', data);
            this.publicHolidays = data.map(holiday => holiday.Date__c);
             this.holidayCount = this.publicHolidays.length;
            
            this.error = undefined;
        } else if (error) {
            console.error('Error fetching holidays:', error);
            this.error = error;
            this.publicHolidays = [];
        }
    }*/


    handleError(event) {
        // Implement your error handling logic here
        console.error('Record save error:', JSON.stringify(event.detail));
         this.showLoadingSpinner = false;
    }
    handleSuccess(event){
        console.log('hi');

        this.leaveflag=false;
        this.homeflag=true; 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Leave requested successfully.",
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
       // console.log('base64>> ',this.base64FileData);       
        /* refreshApex(this.wiredLeaveResult); */
        
        let LeaveRecID=event.detail.id;
        
        //Uploading files to AWS S3 bucket
       if(this.fileName.length>0)
        {
    console.log('file name'+JSON.stringify(this.base64FileData));
        uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:LeaveRecID, obj:'leave'}).then(result => {
           this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: this.file.name + ' - Uploaded Successfully!!!',
                    variant: 'success',
                }),
            );
           
        })
                 
         
    }
        
            setTimeout(() => {
                refreshApex(this.wiredLeaveResult);
            }, 1200);
         this.fileName='';
        this.showLoadingSpinner = false;
    }
    handleSubmit(event){
        this.showLoadingSpinner = true;
        
         event.preventDefault();
        const fields = event.detail.fields;
        fields.Staff__c=this.staffId;
        fields.Type_of_Leave__c=this.type;
       
        this.template.querySelector('lightning-record-edit-form').submit(fields);
         setTimeout(() => {
            this.showSpinner=false;
        }, 2000); 
       }
       onFileUpload(event) {       
        this.isattachError=false;
        if (event.target.files.length > 0) {
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
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        
       /*  console.log('fileName>>',this.fileName);
        console.log('file prepared');
       */
       
    }
    

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
    // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.leaveflag=false;
        this.homeflag=false;
        
    }

    closeviewfile(event) {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.homeflag=true;
        this.leaveflag=false;
    }
     // Fetch holiday list and open modal
     getHolidayList() {
        getHolidayList({state: this.state, financialYear: this.selectedYear})
            .then(result => {
                this.holidays =result;
               // console.log('holidays  >> '+this.holidays);
               //console.log('state 3 >> '+this.state);
                this.sortHolidaysByDate();

                this.isHolidayModalOpen = true;
            })
            .catch(error => {
                console.error('Error fetching holiday list:', error);
            });
    }
    handleSortDate() {
        if (this.dateSortOrder === 'asc') {
            this.dateSortOrder = 'desc'; 
            this.dateSortIcon = 'utility:arrowdown';
        } else {
            this.dateSortOrder = 'asc'; 
            this.dateSortIcon = 'utility:arrowup';
        }
        this.sortHolidaysByDate(); 
    } 
    sortHolidaysByDate() { 
        // Sorting based on the selected order (ascending or descending)
            this.holidayList = [...this.holidays].sort((a, b) => {
            if (this.dateSortOrder === 'asc') {
                 return new Date(a.Date__c) - new Date(b.Date__c);
            } else {
                 return new Date(b.Date__c) - new Date(a.Date__c);
            }
         }).map(holiday => {
            // Formatting the date
            const formattedDate = this.formatDate(holiday.Date__c);

            return {
                ...holiday,
                formattedDate 
            };
           
        });
    }
    formatDate(date) {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    handleHolidayClick() {
       // console.log('handleHolidayClick  is executing>> ');
       //console.log('state 3 >> '+this.state);
       
       refreshApex(this.wiredClientResult); 
       // this.isFinancialYear = true;
        this.getHolidayList(); // Fetch holiday list and open modal
    }
     // Close the modal
     handleCloseModal() {
        this.isHolidayModalOpen = false;
    }
    handleYearChange(event) {
        //this.selectedYear = '2024-25';
        this.selectedYear = event.target.value;
        this.getHolidayList(); 
    }
    @track cancelcomments;
    handleCancelComments(event){
        this.cancelcomments=event.currentTarget.value;
    }


    //Slide-In-Out-Animation
    @track header = true; // Always true
    @track animationClass = ''; // Tracks the animation class
    
    toggleHeader(event) {
        event.stopPropagation(); // Prevent triggering the outside click listener when clicking the icon
        const gridElement = this.template.querySelector('.grid');
    
        if (gridElement.classList.contains('slide-in')) {
            // Slide out the header
            gridElement.classList.remove('slide-in');
            gridElement.classList.add('slide-out');
    
            // Hide the header after the animation completes
            setTimeout(() => {
                gridElement.style.visibility = 'hidden';
                console.log('Header is now hidden after sliding out.');
            }, 500); // Match the animation duration
        } else {
            // Slide in the header
            gridElement.style.visibility = 'visible'; // Ensure it is visible before sliding in
            gridElement.classList.remove('slide-out');
            gridElement.classList.add('slide-in');
    
            console.log('Header is now visible after sliding in.');
        }
    }
    

handleOutsideClick(event) {
const gridElement = this.template.querySelector('.grid');
if (
    gridElement &&
    !gridElement.contains(event.target) && // Ensure click is outside the grid
    !event.target.closest('img') // Ensure click is not on the icon
) {
    if (gridElement.classList.contains('slide-in')) {
        // Slide out the header
        gridElement.classList.remove('slide-in');
        gridElement.classList.add('slide-out');
    }
}
}

preventClose(event) {
event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
}

triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
}

handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            event.preventDefault();
            this.handleleave();
            }
    }
}