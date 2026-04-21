import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getLeaves from '@salesforce/apex/LeaveController.getLeaves';
import updateLeaveStatus from '@salesforce/apex/LeaveController.updateLeaveStatus';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import My_Resource from '@salesforce/resourceUrl/myResource';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getHolidayCount from '@salesforce/apex/LeaveController.getHolidayCount';
import getHolidayList from '@salesforce/apex/LeaveController.getHolidayList';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
// import getCashoutRequests from '@salesforce/apex/LeaveCashoutController.getCashoutRequests';
// import getCashoutById from '@salesforce/apex/LeaveCashoutController.getCashoutById';
import jsPDF from '@salesforce/resourceUrl/jspdf';

export default class StaffLeaveManagementLwc extends LightningElement {
  primary = My_Resource + '/myResource/images/Primary.svg';
  secondary = My_Resource + '/myResource/images/Secondary.svg';
  admin = My_Resource + '/myResource/images/admin.svg';
  infoicon = My_Resource + '/myResource/images/Info_Icon.png';
  infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';

  @api staffId;
  @api orgId;
  @track noRecordsFlag = false;
  @track leaveflag = false;
  @track homeflag = true;
  @track isCashoutPage = false;
  @track leaves;
  @track duration;
  @track fromDate = '';
  @track toDate = '';
  @track type;
  @track Annual;
  @track paid;
  @track unpaid;
  @track balance;
  @track other;
  @track Sick;
  @track Parental;
  @track isdisablefields = false;
  @track dateErrorMessage;
  @track clientData;
  @track showSpinner;
  @track isModalOpen = false;
  @track currentUrl;
  @track typeofUser;
  @track ictUserType = true;
  @track fieldErrorMap = {};
  //@track state ;
  @track holidayCount = 0;
  wiredHolidaysResult;
  @track isHolidayModalOpen = false;
  @track holidayList = [];
  @track holidays = [];
  wiredLeavesForStaff;
  @track dateSortOrder = 'asc';
  @track dateSortIcon = 'utility:arrowup';
  @track staffState;
  @track selectedYear = '2024-2025';
  @track leaveOptions = [];
  @track negativeBalance;
  @track otherLeaveType;
  @track typeOfEmployee;
  @track commentsFlag = false;
  @track showLoadingSpinner = false;
  @track fileName;
  @track saveButtonDisable;
  @track isCashoutModalOpen = false;
  @track baseRate = 0;
  @track cashoutHours;
  @track isViewModalOpen = false;
  @track selectedCashout;

  @track pageSize = 10;
  @track pageNumber = 1;
  @track totalRecords = 0;
  @track totalPages = 0;

  pageSizeOptions = [10, 20, 50];

  @track pagedLeaves = [];

  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }
  //@track selectedYear;
  yearOptions = [
    { label: '2023-2024', value: '2023-2024' },
    { label: '2024-2025', value: '2024-2025' },
    { label: '2025-2026', value: '2025-2026' },
    { label: '2026-2027', value: '2026-2027' },
    { label: '2027-2028', value: '2027-2028' },
    { label: '2028-2029', value: '2028-2029' },
  ];

  loadLeaveOptions() {
    // NES + Award Leaves (always available)
    const nesLeavesFTPT = [
      { label: 'Annual Leave', value: 'Annual Leave' },
      { label: 'Personal Leave', value: 'Personal Leave' },
    ];

    const nesLeavesAll = [
      { label: 'Compassionate Leave', value: 'Compassionate Leave' },
      { label: 'Parental Leave', value: 'Parental Leave' },
      { label: 'Community Service Leave', value: 'Community Service Leave' },
      { label: 'FDV Leave', value: 'FDV Leave' },
      { label: 'Unpaid Carers Leave', value: 'Unpaid Carers Leave' },
    ];

    const awardLeaves = [
      { label: 'Long Service Leave', value: 'Long Service Leave' },
      { label: 'TOIL', value: 'TOIL' },
      { label: 'RDO/ADO', value: 'RDO/ADO' },
    ];

    // COMPANY LEAVES — Should display ONLY IF OtherLeaveType__c == true
    const companyLeaves = [
      { label: 'Bereavement Leave', value: 'Bereavement Leave' },
      { label: 'Birthday Leave', value: 'Birthday Leave' },
      { label: 'Wellness Leave', value: 'Wellness Leave' },
      { label: 'Religious Leave', value: 'Religious Leave' },
      { label: 'Study Leave', value: 'Study Leave' },
      { label: 'Volunteer Leave', value: 'Volunteer Leave' },
      { label: 'Extended Leave', value: 'Extended Leave' },
    ];

    let finalOptions = [];

    // Add FT/PT NES leaves if applicable
    if (
      this.typeOfEmployee === 'Full Time Permanent' ||
      this.typeOfEmployee === 'Part Time Permanent'
    ) {
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
    // this.loadCashoutRequests();
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
    console.log('isValid', isValid);

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

  handleleave(event) {
    if (!this.typeOfEmployee) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Employment Type Missing',
          message: 'Please update Employment Type in Staff record to apply leave.',
          variant: 'error',
          mode: 'sticky',
        })
      );
      return; // ⛔ stop further execution
    }
    this.leaveflag = true;
    this.homeflag = true;
    this.isModalOpen = false;
    this.duration = '';
    this.fromDate = '';
    this.toDate = '';
    this.type = '';
    this.paid = '';
    this.unpaid = '';
    this.balance = '';
    this.leaverecordId = '';
    this.isdisablefields = false;
    this.isstatus = false;
    this.fileName = '';
    this.dateErrorMessage = '';
    this.state = this.staffState;
    this.base64FileData = '';
    this.durationType = '';
  }
  handleCancel(event) {
    this.leaveflag = false;
    this.homeflag = true;
    //this.state = '';
  }
  @track leavestatus;
  @track cancelFlag = false;
  @track leaveid;
  pagedList = [];
  handlecancelleave(event) {
    let status = event.currentTarget.dataset.status;
    this.leaveid = event.currentTarget.dataset.id;
    this.cancelcomments = '';
    if (status === 'Cancelled' || status === 'Withdraw' || status === 'Rejected') {
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Action Not Allowed',
          message: 'You are not allowed to cancel this leave again.',
          variant: 'warning',
          mode: 'dismissable',
        })
      );
      return;
    }

    if (status === 'Approved') {
      this.leavestatus = 'Withdraw';
      this.commentsFlag = true;
    } else {
      this.leavestatus = 'Cancelled';
    }

    this.cancelFlag = true;
  }
  closeleavecancel(event) {
    this.cancelFlag = false;
    this.commentsFlag = false;
  }
  Confirmleavecancel(event) {
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
    if (this.leavestatus === 'Withdraw') {
      if (!this.cancelcomments || this.cancelcomments.trim() === '') {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error',
            message: 'Please enter comments before submitting.',
            variant: 'error',
          })
        );
        return;
      }
    }

    console.log('leaveid', this.leaveid, 'status', this.leavestatus);
    updateLeaveStatus({
      leaveId: this.leaveid,
      statusValue: this.leavestatus,
      cancelComments: this.cancelcomments,
    })
      .then(() => {
        // Optional: refresh UI / show toast
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success',
            message: 'Leave status updated successfully.',
            variant: 'success',
            mode: 'dismissable',
          })
        );
        this.cancelFlag = false;
        this.commentsFlag = false;
        refreshApex(this.wiredLeaveResult);
      })
      .catch((error) => {
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
  @track effectiveAnnualBalance;
  @track personalRemaining;
  @track annualPercent;
  @track personalPercent;
  @track leaveLoadingEnabled = false;
  @track leaveLoadingRate = 0;

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
      this.Annual = this.clientData[0].Annual_leave_Accrued__c;
      this.Sick = this.clientData[0].Personal_Leave_Accur__c;
      /*  this.Parental=this.clientData[0].Parental_Leave__c;
            this.other=this.clientData[0].Bereavement_Leave__c; */
      this.typeOfUser = this.clientData[0].Type_of_User__c;
      this.staffState = this.clientData[0].State__c;
      this.negativeBalance = this.clientData[0].Facility__r.Organisation__r.Negative_Balance__c;
      this.otherLeaveType = this.clientData[0].Facility__r.Organisation__r.Other_Leave_Type__c;
      this.typeOfEmployee = this.clientData[0].Type_of_Employe__c;
      this.baseRate = this.clientData[0].Working_Hours_Rate__c;
      this.leaveLoadingEnabled = this.clientData[0].Facility__r?.Organisation__r?.Leave_Loading__c;
      this.leaveLoadingRate =
        this.clientData[0].Facility__r?.Organisation__r?.Leave_Loading_Rate__c;
      console.log('leaveLoadingEnabled: ', this.leaveLoadingEnabled);
      console.log('leaveLoadingRate: ', this.leaveLoadingRate);
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
        leaves
          .reduce((sum, rec) => {
            return sum + (rec.Annual_Used__c || 0);
          }, 0)
          .toFixed(2)
      );

      this.personalUsed = Number(
        leaves
          .reduce((sum, rec) => {
            return sum + (rec.Personal_Used__c || 0);
          }, 0)
          .toFixed(2)
      );

      this.effectiveAnnualBalance = Number(((this.Annual || 0) - this.annualUsed).toFixed(2));
      this.personalRemaining = Number(((this.Sick || 0) - this.personalUsed).toFixed(2));

      this.annualPercent = Math.round((this.annualUsed / this.Annual) * 100) || 0;
      this.personalPercent = Math.round((this.personalUsed / this.Sick) * 100) || 0;

      if (this.typeOfUser == 'ICT User') {
        // this.isICtUserInViewForm=true;
        this.ictUserType = true;
      } else {
        // this.isICtUserInViewForm=false;
        this.ictUserType = false;
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
      this.leaves = data.map((leave) => {
        return {
          ...leave,
          fromdate: leave.From__c ? new Date(leave.From__c).toLocaleDateString('en-GB') : '',
          Todate: leave.To__c ? new Date(leave.To__c).toLocaleDateString('en-GB') : '',
          Leave_Duration__c: leave.Leave_Duration__c
            ? Number(leave.Leave_Duration__c).toFixed(2)
            : '0',

          paid__c: leave.paid__c != null ? Number(leave.paid__c).toFixed(2) : '0',

          unpaid__c: leave.unpaid__c != null ? Number(leave.unpaid__c).toFixed(2) : '0',
        };
      });

      this.totalRecords = this.leaves.length;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

      this.updatePagedData();

      console.log('Table data......>: ' + JSON.stringify(this.leaves));
      let approved = 0;
      let Rejected = 0;
      let cancelled = 0;
      let requested = 0;

      data.forEach((rec) => {
        const status = rec.Status__c;

        if (status === 'Approved') {
          approved++;
        } else if (status === 'Cancelled') {
          cancelled++;
        } else if (status === 'Rejected') {
          Rejected++;
        } else if (status === 'Requested') {
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
  @track iscustom = false;

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
    } else if (fieldName === 'Duration_Type__c') {
      this.durationType = event.target.value;
      if (this.durationType === 'Custom Hours') {
        this.iscustom = true;
      } else {
        this.iscustom = false;
        this.startTime = '';
        this.endTime = '';
      }
    } else if (fieldName === 'Start_Time__c') {
      this.startTime = event.target.value;
    } else if (fieldName === 'End_Time__c') {
      this.endTime = event.target.value;
    }

    // Validate date order
    if (this.fromDate && this.toDate && this.state) {
      if (new Date(this.toDate) < new Date(this.fromDate)) {
        this.dateErrorMessage = 'You cannot set to date that precedes the from date.';
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Validation Error',
            message: 'You cannot set to date that precedes the from date.',
            variant: 'error',
            mode: 'dismissable',
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

  paidLeaveTypes = new Set([
    'compassionate leave',
    'toil',
    'rdo/ado',
    'bereavement leave',
    'birthday leave',
    'wellness leave',
    'volunteer leave'
  ]);

  unpaidLeaveTypes = new Set([
    'parental leave',
    'unpaid carers leave',
    'extended leave'
  ]);

  recalculateLeave() {
    if (!this.fromDate || !this.toDate || !this.state || !this.type || !this.durationType) {
      return;
    }

    console.log('Recalculating leave...');

    setTimeout(() => {
      if (this.holidayCount == null) return;

      // 1. Calculate business days
      const totalDays = this.calculateBusinessDays(new Date(this.fromDate), new Date(this.toDate));
      console.log('Business Days:', totalDays);

      console.log('Holiday Count:', this.holidayCount);

      // Remove holidays
      this.duration = 0;
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
        payableDays = totalCustomHours / this.dailyHours;
      }

      // 2. Convert days → hours (NES)
      const leaveHours = payableDays * this.dailyHours;
      this.duration = Number(leaveHours.toFixed(2)); // Duration__c field now stores HOURS
      console.log('Leave Hours (NES):', leaveHours);

      const leaveType = (this.type || '').trim().toLowerCase();
      // 3. Determine accrued balance based on leave type
      let balanceHours = 0;
      let isAccruedLeave = false;

      console.log('Selected Leave Type RAW:', this.type);
      console.log('Normalized Leave Type:', leaveType);
      console.log('Paid Types:', Array.from(this.paidLeaveTypes));
      console.log('Unpaid Types:', Array.from(this.unpaidLeaveTypes));

      if (leaveType === 'annual leave') {
        balanceHours = this.effectiveAnnualBalance; // Annual_leave_Accrued__c
        isAccruedLeave = true;
      } else if (leaveType === 'personal leave') {
        balanceHours = this.personalRemaining; // Personal_Leave_Accur__c
        isAccruedLeave = true;
      }
      // ✅ Fully Paid Leaves
      else if (this.paidLeaveTypes.has(leaveType)) {

        this.paid = leaveHours;
        this.unpaid = 0;
        this.balance = null;

        console.log('Fully Paid Leave');
        this.saveButtonDisable = false;
        return;
      }
      // ✅ Fully Unpaid Leaves
      else if (this.unpaidLeaveTypes.has(leaveType)) {

        this.paid = 0;
        this.unpaid = leaveHours;
        this.balance = null;

        console.log('Fully Unpaid Leave');
        this.saveButtonDisable = false;
        return;
      } 
      
      else {
        // 🔶 NEW: Skip balance & paid/unpaid for all other leave types
        this.paid = 0;
        this.unpaid = 0;
        this.balance = 0;
        console.log('Non-accrued leave – skipping balance deduction.');
        return; // 🔶 NEW — stops further paid/unpaid logic
      }

      console.log('Accrued Balance Hours:', balanceHours);

      // 4. Calculate remaining balance
      let remaining = balanceHours - leaveHours;
      if (remaining < 0 && this.negativeBalance == false) {
        console.log('Remaining Balance Hours:', remaining);
        this.saveButtonDisable = true;
        const toastEvent = new ShowToastEvent({
          title: 'error',
          message: 'You cannot request more leave than you have accrued.',
          variant: 'error',
        });

        this.dispatchEvent(toastEvent);
        return;
      }

      if (isAccruedLeave) {
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
    return h * 60 + m;
  }

  fetchHolidays() {
    // Call the Apex method imperatively
    getHolidayCount({ startDate: this.fromDate, endDate: this.toDate, state: this.state })
      .then((data) => {
        console.log('Public Holidays:', data);

        // Assuming data is an array of holiday records
        this.publicHolidays = data.map((holiday) => holiday.Date__c);
        this.holidayCount = this.publicHolidays.length; // Get the count of holidays

        this.weekendHolidays = data.filter((holiday) => {
          const holidayDate = new Date(holiday.Date__c);
          const dayOfWeek = holidayDate.getDay();
          return dayOfWeek === 0 || dayOfWeek === 6;
        });
        this.weekendHolidayCount = this.weekendHolidays.length;
        console.log(`Holiday Count: ${this.holidayCount}`);
        console.log(`weekend Holiday Count: ${this.weekendHolidayCount}`);
        this.holidayCount = this.holidayCount - this.weekendHolidayCount;
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
  handleSuccess(event) {
    console.log('hi');

    this.leaveflag = false;
    this.homeflag = true;
    const toastEvent = new ShowToastEvent({
      title: 'Success',
      message: 'Leave requested successfully.',
      variant: 'success',
    });
    this.dispatchEvent(toastEvent);
    // console.log('base64>> ',this.base64FileData);
    /* refreshApex(this.wiredLeaveResult); */

    let LeaveRecID = event.detail.id;

    //Uploading files to AWS S3 bucket
    if (this.fileName.length > 0) {
      console.log('file name' + JSON.stringify(this.base64FileData));
      uploadFile({
        base64: JSON.stringify(this.base64FileData),
        filename: this.fileName,
        recordId: LeaveRecID,
        obj: 'leave',
      }).then((result) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success!!',
            message: this.file.name + ' - Uploaded Successfully!!!',
            variant: 'success',
          })
        );
      });
    }

    setTimeout(() => {
      refreshApex(this.wiredLeaveResult);
    }, 1200);
    this.fileName = '';
    this.showLoadingSpinner = false;
  }
  handleSubmit(event) {
    this.showLoadingSpinner = true;

    event.preventDefault();
    const fields = event.detail.fields;
    fields.Staff__c = this.staffId;
    fields.Type_of_Leave__c = this.type;

     // 🔴 Validation
    if (!fields.Type_of_Leave__c) {
        this.showLoadingSpinner = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Please select Type of Leave before submitting.',
                variant: 'error'
            })
        );
        return; // stop submission
    }

    this.template.querySelector('lightning-record-edit-form').submit(fields);
    setTimeout(() => {
      this.showSpinner = false;
    }, 2000);
  }
  onFileUpload(event) {
    this.isattachError = false;
    if (event.target.files.length > 0) {
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.selectedFilesToUpload[0].name.split(' ').join('');
      this.fileType = this.selectedFilesToUpload[0].type;
      this.fileSize = this.selectedFilesToUpload[0].size;

      if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {
        this.isattachError = true;
      }
      //create an intance of File
      this.fileReaderObj = new FileReader();

      //this callback function in for fileReaderObj.readAsDataURL
      this.fileReaderObj.onloadend = () => {
        //get the uploaded file in base64 format
        let fileContents = this.fileReaderObj.result;
        fileContents = fileContents.substr(fileContents.indexOf(',') + 1);

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
          for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
          }
          byteArrays[sliceIndex] = new Uint8Array(bytes);
        }

        //from arraybuffer create a File instance
        this.myFile = new File(byteArrays, this.fileName, { type: this.fileType });

        //callback for final base64 String format
        let reader = new FileReader();
        reader.onloadend = () => {
          let base64data = reader.result;
          this.base64FileData = base64data.substr(base64data.indexOf(',') + 1);
        };
        reader.readAsDataURL(this.myFile);
      };
      this.fileReaderObj.readAsDataURL(this.file);
    }
  }

  handleView(event) {
    event.preventDefault();

    const recordId = event.currentTarget.dataset.id;

    if (!recordId) return;

    getCashoutById({ recordId })
      .then((result) => {
        this.selectedCashout = result;
        this.isViewModalOpen = true;

        // Close other sections
        this.leaveflag = false;
        this.isCashoutModalOpen = false;
        this.homeflag = false;
      })
      .catch((error) => {
        console.error('Error fetching cashout record:', error);
      });
  }

  closeviewfile(event) {
    event.preventDefault();
    this.isModalOpen = false;
    this.currentUrl = null;
    this.homeflag = true;
    this.leaveflag = false;
  }
  // Fetch holiday list and open modal
  getHolidayList() {
    getHolidayList({ state: this.state, financialYear: this.selectedYear })
      .then((result) => {
        this.holidays = result;
        // console.log('holidays  >> '+this.holidays);
        //console.log('state 3 >> '+this.state);
        this.sortHolidaysByDate();

        this.isHolidayModalOpen = true;
      })
      .catch((error) => {
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
    this.holidayList = [...this.holidays]
      .sort((a, b) => {
        if (this.dateSortOrder === 'asc') {
          return new Date(a.Date__c) - new Date(b.Date__c);
        } else {
          return new Date(b.Date__c) - new Date(a.Date__c);
        }
      })
      .map((holiday) => {
        // Formatting the date
        const formattedDate = this.formatDate(holiday.Date__c);

        return {
          ...holiday,
          formattedDate,
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
  handleCancelComments(event) {
    this.cancelcomments = event.currentTarget.value;
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

  // handleRequestCashout() {
  //   this.homeflag = false;
  //   this.leaveflag = false;
  //   this.isCashoutPage = true;
  // }

  // handleBackToHome() {
  //   this.isCashoutPage = false;
  //   this.homeflag = true;
  // }

  // openAddModal() {
  //   console.log('Opening Modal');
  //   console.log('Current Reserved Hours:', this.reservedCashoutHours);
  //   console.log('Current Effective Balance:', this.effectiveAnnualBalance);
  //   this.cashoutHours = 0;
  //   this.isCashoutModalOpen = true;
  // }

  // closeCashoutModal() {
  //   this.isCashoutModalOpen = false;
  // }

  // loadCashoutRequests() {
  //   getCashoutRequests()
  //     .then((result) => {
  //       let reserved = 0;

  //       this.pagedList = result.map((r) => {
  //         const status = r.Status__c;

  //         const isRejected = status === 'HR Admin Rejected' || status === 'Payroll Admin Rejected';

  //         if (!isRejected) {
  //           reserved += Number(r.Hours_Requested_to_Cash__c || 0);
  //         }

  //         return {
  //           id: r.Id,
  //           requestId: r.Request_ID__c,
  //           requestDate: this.formatDate(r.Date__c),
  //           hours: r.Hours_Requested_to_Cash__c,
  //           amount: r.Total_Cashout__c,
  //           status: r.Status__c,
  //           statusClass: this.getStatusClass(status),
  //           lastUpdated: this.formatDateTime(r.LastModifiedDate),
  //         };
  //       });

  //       this.reservedCashoutHours = reserved;

  //       console.log('Reserved Hours:', reserved);
  //     })
  //     .catch((error) => {
  //       console.error('Error loading cashouts', error);
  //     });
  // }

  // get reservedCashoutHours() {
  //   if (!this.pagedList) return 0;

  //   return this.pagedList
  //     .filter((r) => r.status !== 'HR Admin Rejected' && r.status !== 'Payroll Admin Rejected')
  //     .reduce((sum, r) => sum + Number(r.hours || 0), 0);
  // }

  // get effectiveAnnualBalance() {
  //   const accrued = Number(this.Annual || 0);
  //   const used = Number(this.annualUsed || 0);
  //   const reserved = Number(this.reservedCashoutHours || 0);

  //   return Number((accrued - used - reserved).toFixed(2));
  // }

  // get maximumAvailable() {
  //   const remaining = Number(this.effectiveAnnualBalance || 0);
  //   const minimum = Number(this.minimumRequired || 0);

  //   const max = remaining - minimum;

  //   return max > 0 ? Number(max.toFixed(2)) : 0;
  // }

  // get minimumRequired() {
  //   if (this.typeOfEmployee === 'Full Time Permanent') return 152;
  //   if (this.typeOfEmployee === 'Part Time Permanent') return 80;
  //   return 0;
  // }

  // get baseAmount() {
  //   return this.baseRate * this.cashoutHours;
  // }

  // handleHoursChange(event) {
  //   let value = parseFloat(event.target.value);

  //   if (isNaN(value)) {
  //     this.cashoutHours = 0;
  //     return;
  //   }

  //   // Limit to 2 decimals
  //   value = Number(value.toFixed(2));

  //   // Prevent exceeding maximum
  //   if (value > this.maximumAvailable) {
  //     value = this.maximumAvailable;
  //   }

  //   this.cashoutHours = value;
  // }

  // get leaveLoading() {
  //   if (!this.leaveLoadingEnabled) {
  //     return 0;
  //   }
  //   return this.leaveLoadingRate;
  // }

  // get totalPayment() {
  //   const base = Number(this.baseAmount || 0);
  //   const percentage = Number(this.leaveLoading || 0);
  //   const loadingAmount = (base * percentage) / 100;
  //   const total = base + loadingAmount;
  //   return Number(total.toFixed(2));
  // }

  // handleFormSubmit(event) {
  //   event.preventDefault();
  //   console.log('Submitting Cashout');
  //   console.log('Requested Hours:', this.cashoutHours);
  //   console.log('Maximum Available:', this.maximumAvailable);
  //   const fields = event.detail.fields;
  //   const hours = parseFloat(this.cashoutHours) || 0;

  //   if (!hours || hours <= 0) {
  //     this.dispatchEvent(
  //       new ShowToastEvent({
  //         title: 'Error',
  //         message: 'Please enter valid cash out hours greater than 0.',
  //         variant: 'error',
  //       })
  //     );
  //     return;
  //   }

  //   if (hours > this.maximumAvailable) {
  //     this.dispatchEvent(
  //       new ShowToastEvent({
  //         title: 'Error',
  //         message: 'Cash out hours exceed maximum available.',
  //         variant: 'error',
  //       })
  //     );
  //     return;
  //   }
  //   fields.Staff__c = this.staffId;
  //   fields.Base_Pay_Rate__c = this.baseRate;
  //   fields.Status__c = 'HR Admin Approval Pending';
  //   fields.Base_Payment_Amount__c = this.baseAmount;
  //   fields.Leave_Loading_Rate__c = this.leaveLoading;
  //   fields.Total_Cashout__c = this.totalPayment;
  //   fields.Total_Cashout__c = this.totalPayment;

  //   this.template.querySelector('lightning-record-edit-form').submit(fields);
  // }

  // handleCashoutSuccess(event) {
  //   this.dispatchEvent(
  //     new ShowToastEvent({
  //       title: 'Success',
  //       message: 'Cash out request submitted successfully.',
  //       variant: 'success',
  //     })
  //   );

  //   this.closeCashoutModal();

  //   // Refresh table in background
  //   setTimeout(() => {
  //     this.loadCashoutRequests();
  //   }, 400);
  // }

  // getStatusClass(status) {
  //   switch (status) {
  //     case 'HR Admin Approval Pending':
  //       return 'status-pill status-hr-pending';

  //     case 'Payroll Admin Approval Pending':
  //       return 'status-pill status-payroll-pending';

  //     case 'HR Admin Rejected':
  //       return 'status-pill status-hr-rejected';

  //     case 'Payroll Admin Rejected':
  //       return 'status-pill status-payroll-rejected';

  //     case 'Approved':
  //       return 'status-pill status-approved';

  //     default:
  //       return 'status-pill status-default';
  //   }
  // }

  // formatDate(dateString) {
  //   if (!dateString) return '';

  //   const date = new Date(dateString);

  //   const day = String(date.getDate()).padStart(2, '0');
  //   const month = String(date.getMonth() + 1).padStart(2, '0');
  //   const year = date.getFullYear();

  //   return `${day}/${month}/${year}`;
  // }

  // formatDateTime(dateTimeString) {
  //   if (!dateTimeString) return '';
  //   const date = new Date(dateTimeString);
  //   const day = String(date.getDate()).padStart(2, '0');
  //   const month = String(date.getMonth() + 1).padStart(2, '0');
  //   const year = date.getFullYear();
  //   let hours = date.getHours();
  //   const minutes = String(date.getMinutes()).padStart(2, '0');
  //   const ampm = hours >= 12 ? 'PM' : 'AM';
  //   hours = hours % 12;
  //   hours = hours ? hours : 12; // 0 → 12
  //   const formattedHours = String(hours).padStart(2, '0');
  //   return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  // }

  // handleDownloadPdf(event) {
  //   const recordId = event.currentTarget.dataset.id;

  //   getCashoutById({ recordId })
  //     .then((result) => {
  //       this.generateCashoutPdf(result);
  //     })
  //     .catch((error) => {
  //       console.error('Error fetching record for PDF:', error);
  //     });
  // }

  // async generateCashoutPdf(record) {
  //   const { jsPDF } = window.jspdf;
  //   const doc = new jsPDF();

  //   let currentY = 20;
  //   const maxWidth = 170;

  //   const addNewPageIfNeeded = (height = 10) => {
  //     if (currentY + height > 280) {
  //       doc.addPage();
  //       currentY = 20;
  //     }
  //   };

  //   const addLabelAndText = (label, value) => {
  //     doc.setFontSize(11);
  //     doc.setFont(undefined, 'bold');
  //     doc.text(label, 20, currentY);
  //     currentY += 6;

  //     doc.setFont(undefined, 'normal');
  //     const lines = doc.splitTextToSize(value || 'N/A', maxWidth);
  //     addNewPageIfNeeded(lines.length * 6);

  //     lines.forEach((line) => {
  //       doc.text(line, 20, currentY);
  //       currentY += 6;
  //     });

  //     currentY += 4;
  //   };

  //   /* ================= HEADER ================= */
  //   doc.setFontSize(16);
  //   doc.setFont(undefined, 'bold');
  //   doc.text(`Leave Cashout Request`, 60, currentY);
  //   currentY += 12;

  //   doc.setFontSize(12);
  //   doc.setFont(undefined, 'normal');
  //   currentY += 10;

  //   doc.line(20, currentY, 190, currentY);
  //   currentY += 10;

  //   /* ================= STAFF DETAILS ================= */
  //   addLabelAndText('Employee Name:', record.Staff__r?.Name);
  //   addLabelAndText('Role:', record.Staff_Role__r?.RoleName__c);
  //   addLabelAndText('Employment Type:', record.Staff__r?.Type_of_Employe__c);
  //   addLabelAndText('Pay Period:', record.Pay_Period__c);

  //   doc.line(20, currentY, 190, currentY);
  //   currentY += 10;

  //   /* ================= REQUEST DETAILS ================= */
  //   addLabelAndText('Hours Requested:', `${record.Hours_Requested_to_Cash__c} Hrs`);
  //   addLabelAndText('Base Pay Rate:', `$${record.Base_Pay_Rate__c}`);
  //   addLabelAndText('Leave Loading Rate:', `${record.Leave_Loading_Rate__c || 0}%`);
  //   addLabelAndText('Total Estimated Cashout:', `$${record.Total_Cashout__c}`);
  //   addLabelAndText('Reason for Cashout:', record.Reason_for_Cashout__c);

  //   doc.line(20, currentY, 190, currentY);
  //   currentY += 10;

  //   /* ================= HR DECISION ================= */
  //   addLabelAndText('Current Status:', record.Status__c);

  //   /* ================= SIGNATURE ================= */
  //   addLabelAndText('Employee Signature:', record.Signature__c);
  //   addLabelAndText('Signed Date:', record.Date__c);

  //   /* ================= SAVE ================= */
  //   doc.save(`Cashout_${record.Name || record.Id}.pdf`);
  // }

  // closeViewModal() {
  //   this.isViewModalOpen = false;
  //   this.homeflag = false;
  //   this.isCashoutPage = true;
  // }

updatePagedData() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedLeaves = this.leaves.slice(start, end);
}

// Navigation
firstPage() {
    this.pageNumber = 1;
    this.updatePagedData();
}

previousPage() {
    if (this.pageNumber > 1) {
        this.pageNumber--;
        this.updatePagedData();
    }
}

nextPage() {
    if (this.pageNumber < this.totalPages) {
        this.pageNumber++;
        this.updatePagedData();
    }
}

lastPage() {
    this.pageNumber = this.totalPages;
    this.updatePagedData();
}

// Page size change
handleRecordsPerPage(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.pageNumber = 1;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

    this.updatePagedData();
}

get bDisableFirst() {
    return this.pageNumber === 1;
}

get bDisableLast() {
    return this.pageNumber === this.totalPages;
}
  
}