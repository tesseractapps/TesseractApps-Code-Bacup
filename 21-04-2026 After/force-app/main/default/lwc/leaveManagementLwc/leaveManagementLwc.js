import { LightningElement, wire, api, track } from 'lwc';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import getStaffsByOrg from '@salesforce/apex/StaffController.getStaffsByOrg';
import getLeaves from '@salesforce/apex/LeaveController.getLeaves';
import getLeavesByUserRole from '@salesforce/apex/LeaveController.getLeavesByUserRole';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import My_Resource from "@salesforce/resourceUrl/myResource";
import ChartJS from '@salesforce/resourceUrl/chratJs'; 
import { loadScript } from 'lightning/platformResourceLoader';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import getStaffFacilityMap from '@salesforce/apex/staffFacilityHandler.getStaffFacilityMap';
import getLeaveById from '@salesforce/apex/LeaveController.getLeaveById';
// import getAllCashoutRequests from '@salesforce/apex/LeaveCashoutController.getAllCashoutRequests';
// import getCashoutById from '@salesforce/apex/LeaveCashoutController.getCashoutById';
// import updateCashoutStatus from '@salesforce/apex/LeaveCashoutController.updateCashoutStatus';
// import getEmployeeDetails from '@salesforce/apex/LeaveCashoutController.getEmployeeDetails';
// import getTerminationPayouts from '@salesforce/apex/LeaveCashoutController.getTerminationPayouts';
// import jsPDF from '@salesforce/resourceUrl/jspdf';
// import getOutstandingWages from '@salesforce/apex/LeaveCashoutController.getOutstandingWages';

export default class LeaveManagementLwc extends LightningElement {
    
    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    
    @track clientData;
    @track wiredClientResult;
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track StaffId;
    @track leaveflag=false;
    @track isHome=true;
    @track leaves=[];
    @track duration;
    @track fromDate;
    @track toDate;
    @track type;
    @track Annual;
    @track paid;
    @track unpaid;
    @track balance;
    @track other;
    @track Sick;
    @track Parental;
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; //used for when to show spinner
    @track fileName;
    @track doc;
    @track fileSize;
    @track file; //holding file instance
    @track myFile;    
    @track fileType;//holding file type
    @track fileReaderObj;
    @track isHome=true;
    @track isModalOpen=false;
    @track isHome2=true;
    @api orgid;
    @track orgleaves=[];
    @track staffuser=false;
    @track orgadmin=false;
    @track isdisablefields=false;
    @track isstatus=false;
    @track startDate;
    @track endDate;
    @track dateErrorMessage='';
    @track saveButtonDisable=false;
    @track statusValue;
    @track currentMonth;  
    @track currentYear;   
    @track startDate; 
    @track noRecordsFlag=false;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;
    chart;
    chartjsInitialized = false;                              
    wiredLeaveResult; 
    wiredLeaveorg;
    @track cashoutFlag=false;
    @track TerminationFlag =false;
    @track calendarFlag = false;
    @track staffFlag = false;
    @track FacilityId;
    @api currentloggedstaffid;
    @api staffid;
    @api fromtask = false;
    selectedRecordId;
    selectedRecord;
    isReviewModalOpen = false;
    rejectionReason = '';
    selectedDecision; // Approved or Rejected

    selectedStaffId;
    terminationDate;

    @track filteredCashoutList;
    @track searchKey = '';
    @track selectedStatuses = [];

    @track isTerminationModalOpen = false;
    @track terminationList = [];

    
    accruedAnnualLeave = 0;
    leaveLoadingRate = 0;
    annualLeavePayout = 0;
    manualLeaveAdjustment = 0;
    leaveNotes;
    terminationStatus = 'Draft';
    currentUserType;
    @track isHRAdmin = false;
    @track isPayrollAdmin = false;

    @track reviewTitle = '';
    @track decisionTitle = '';
    @track signoffTitle = '';
    @track decisionOptions = [];

    @track showMonthlyCalendar = false;
    @track showCalendar = false;
    @track showLeaveManagement = true;

    handleBackToHome() {
        this.calendarFlag = false;
        this.cashoutFlag = false;
        this.TerminationFlag = false;
        this.staffFlag = false;

        this.isHome = true;
    }

    payrollDecisionOptions = [
        { label: 'Approve', value: 'Approved' },
        { label: 'Reject', value: 'Payroll Admin Rejected' }
    ];

    statusOptions = [
        { label: 'HR Admin Approval Pending', value: 'HR Admin Approval Pending' },
        { label: 'Payroll Admin Approval Pending', value: 'Payroll Admin Approval Pending' },
        { label: 'HR Admin Rejected', value: 'HR Admin Rejected' },
        { label: 'Payroll Admin Rejected', value: 'Payroll Admin Rejected' },
        { label: 'Approved', value: 'Approved' }
    ];

    // renderedCallback() {
    //     Promise.all([
    //         loadScript(this, jsPDF).then(() => {
    //            // console.log("JS loaded jsPDF");
    //         }).catch(error => {
    //            // console.error("Error " + error);
    //         })
    //     ]);
    // }

    connectedCallback() {
        console.log('currentloggedstaffid',this.currentloggedstaffid);
        console.log('staffid',this.staffid);
        if(this.orgid){
        this.currentMonth=new Date().getMonth() + 1;
        this.currentYear=new Date().getFullYear();
        this.calculateDates(); 
        }else{
            return;
        }
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Faciility";
        this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
        this.FacilityId = localStorage.getItem('defaultFacilityId');
        this.loadStaff();
        // this.loadAllCashouts();
        // this.loadTerminationPayouts();
        this.loadUser();
    }

    loadUser() {
        getCurrentLoggedUserInfo()
            .then(u => {
                if (u.User_Type__c === 'HR Admin') {
                    this.isHRAdmin = true;
                    this.reviewTitle = 'HR Review Section';
                    this.decisionTitle = 'HR Decision';
                    this.signoffTitle = 'HR Sign Off';

                    this.decisionOptions = [
                        { label: 'Approve', value: 'Payroll Admin Approval Pending' },
                        { label: 'Rejected', value: 'HR Admin Rejected' }
                    ];
                } else if (u.User_Type__c === 'Payroll Admin') {
                    this.isPayrollAdmin = true;
                    this.reviewTitle = 'Payroll Admin Review Section';
                    this.decisionTitle = 'Payroll Admin Decision';
                    this.signoffTitle = 'Payroll Admin Sign-Off';

                    this.decisionOptions = [
                        { label: 'Approved', value: 'Approved' },
                        { label: 'Rejected', value: 'Payroll Admin Rejected' }
                    ];
                }
            })
            .catch(err => console.error(err));
    }

    get isRejected() {
        return this.selectedDecision === 'HR Admin Rejected' ||
            this.selectedDecision === 'Payroll Admin Rejected';
    }

    get eligibilityTitle() {
        return this.isPayrollAdmin
            ? 'Payroll Admin Eligibility & Compliance Checks'
            : 'HR Eligibility & Compliance Checks';
    }

    get notesLabel() {
        return this.isPayrollAdmin ? 'Note' : 'Notes';
    }
         
    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserRole =data.fields.User_Role__c.value;

            if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ||this.currentUserRole == 'Portal Account Partner Manager' ){
                this.orgadmin=true;
                this.isHome2=true;
                 this.staffuser=false;
                this.isdisablefields=false;
                this.isstatus=true;
                console.log('orgid'+this.orgid);
             } 
             if(this.currentUserRole == 'Portal Account Partner User'){
                this.staffuser=true;
                this.isHome2=true;
                this.isdisablefields=true;
                this.isstatus=false;
             }
            
           
            console.log('current role ' +this.currentUserRole);
            console.log(' staffUser '+this.staffuser);
            console.log(' org admin  '+ this.orgadmin);
        } else if (error) {
            this.usererror = error ;
        }
    }
 
    /*  connectedCallback() {
        this.disableRightClick();
        this.disableShortcuts();
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
 */

    @track annualUsed;
    @track personalUsed;
    @track annualRemaining;
    @track personalRemaining;
    @track annualPercent;
    @track personalPercent;


 
    @wire(getStaffById, { recordId: '$StaffId'})
    wiredClient(result) {
        this.wiredClientResult = result;
        console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        /* if (data) {
            console.log('Data: ', data); // Debugging line
            this.clientData = data;
            this.StaffId = this.clientData[0].Id;
            this.Annual=this.clientData[0].Annual_Leave__c;
            this.Sick=this.clientData[0].Sick_Leave__c;
            this.Parental=this.clientData[0].Parental_Leave__c;
            this.other=this.clientData[0].Bereavement_Leave__c;
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        } */
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

            this.annualUsed = leaves.reduce((sum, rec) => {
                return sum + (rec.Annual_Used__c || 0);
            }, 0);

            this.personalUsed = leaves.reduce((sum, rec) => {
                return sum + (rec.Personal_Used__c || 0);
            }, 0);

          this.annualRemaining = Number(((this.Annual || 0) - this.annualUsed).toFixed(2));
          this.personalRemaining = Number(((this.Sick || 0) - this.personalUsed).toFixed(2));


            this.annualPercent = Math.round((this.annualUsed / this.Annual) * 100) || 0;
            this.personalPercent = Math.round((this.personalUsed / this.Sick) * 100) || 0;


        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    }
    
    @wire(getLeaves, { recordId: '$StaffId', OrgId: '$orgid' })
    wiredLeavesForStaff(result) {
        if(!this.StaffId && !this.orgid){
            return;
        }
        this.wiredLeaveResult = result;
        console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
            console.log('Table data: ', data); // Debugging line
            this.leaves = data.map(leave => {
                return {
                    ...leave,
                    fromdate: leave.From__c ? new Date(leave.From__c).toLocaleDateString('en-GB') : '',
                    Todate: leave.To__c ? new Date(leave.To__c).toLocaleDateString('en-GB') : ''
                };
            });
            console.log('Table data......>: '+JSON.stringify(this.leaves));     
            this.recentEmpData1 = this.leaves;
            this.records1 = this.leaves;
            this.totalRecords1 = data.length; // update total records count
            this.pageSize1 = this.pageSizeOptions1[0]; // set pageSize with default value as first option
            this.pageNumber1 = 1;
            this.paginationHelper1();                
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    } 

    @track statusCounts = { Approved: 0, Rejected: 0, Requested: 0 };

  /*   @wire(getLeavesByOrg, { orgId: '$orgid', startDate: '$startDate', endDate: '$endDate' })
    wiredLeaves(result) {
        
        console.log('orgId:', this.orgid);          // Log the orgId
        console.log('startDate:', this.startDate);   // Log the startDate
        console.log('endDate:', this.endDate);       // Log the endDate

        this.wiredLeaveorg= result;
        console.log('Result: ',JSON.stringify(result)); // Debugging line

        const { data, error } = result;
        if (data) {
             // Debugging line
            this.orgleaves = data.map(leave => {
                return {
                    ...leave,
                    fromdate: leave.From__c ? new Date(leave.From__c).toLocaleDateString('en-GB') : '',
                    Todate: leave.To__c ? new Date(leave.To__c).toLocaleDateString('en-GB') : '',
                     isLinkEnabled: leave.Status__c !== 'Approved' && leave.Status__c !== 'Rejected'
                };
            });   
            this.statusCounts = { Approved: 0, Rejected: 0, Requested: 0 };

            // Count occurrences of each status
            this.orgleaves.forEach(leave => {
                const status = leave.Status__c;
                if (status === 'Approved') {
                    this.statusCounts.Approved++;
                } else if (status === 'Rejected') {
                    this.statusCounts.Rejected++;
                } else if (status === 'Requested') {
                    this.statusCounts.Requested++;
                }
            });
            this.renderChart();
           // this.recentEmpData = this.orgleaves;
            this.records = this.orgleaves;
            this.totalRecords = data.length; // update total records count
            this.pageSize = this.pageSizeOptions[0]; // set pageSize with default value as first option
            this.pageNumber = 1;
            this.paginationHelper();
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
        
    }  */
   tLogoUrl = `${Loading_Logo}/TLogo.png`;
            tImageUrl = `${Loading_Logo}/T.png`;
        
            get logoUrl() {
                return this.tLogoUrl;
            }
        
            get imageUrl() {
                return this.tImageUrl;
            }
   @wire(getLeavesByUserRole, {
                orgId: '$orgid',
                startDate: '$startDate',
                endDate: '$endDate'
            })
async wiredLeaves(result) {
    console.log("🔥🔥 WIREDLEAVES ENTERED 🔥🔥");

    this.showSpinner = true;
    this.wiredLeaveorg = result;

    const { data, error } = result;

    if (error) {
        console.error('Wire Error: ', error);
        this.handleError(error);
        this.showSpinner = false;
        return;
    }

    if (!data) {
        this.showSpinner = false;
        return;
    }

    try {
        /* =========================================================
           1️⃣ Preprocess leaves
           ========================================================= */
        let allLeaves = data.map(leave => ({
            ...leave,
                /* ✅ ADD THIS LINE */
            statusClass: this.getStatusClass(leave.Status__c),
            staffId: leave.Staff__c,
            fromdate: leave.From__c
                ? new Date(leave.From__c).toLocaleDateString('en-GB')
                : '',
            Todate: leave.To__c
                ? new Date(leave.To__c).toLocaleDateString('en-GB')
                : '',
            isLinkEnabled:
                leave.Status__c !== 'Approved' &&
                leave.Status__c !== 'Rejected' &&
                leave.Status__c !== 'Cancelled'
        }));

        this.orgleaves = allLeaves;

        /* =========================================================
           2️⃣ Facility context
           ========================================================= */
        const storedFacilityId =
            localStorage.getItem('defaultFacilityId');

        console.log('storedFacilityId:', storedFacilityId);

        /* =========================================================
           3️⃣ Collect Staff IDs
           ========================================================= */
        const staffIds = [ ...new Set(allLeaves.map(l => l.Staff__c))
        ];

        /* =========================================================
           4️⃣ Fetch Staff → Facility map
           ========================================================= */
        const staffFacilityMap = await getStaffFacilityMap({ staffIds });

        console.log(
            'staffFacilityMap ==> ',
            JSON.stringify(staffFacilityMap)
        );

        /* =========================================================
           5️⃣ Apply FACILITY FILTER (SAME LOGIC AS BEFORE)
           ========================================================= */
        let finalData = allLeaves.filter(leave => {
            const facilities =
                staffFacilityMap[leave.staffId] || [];
            return facilities.includes(storedFacilityId);
        });

        console.log('final data ', JSON.stringify(finalData));

        /* =========================================================
           6️⃣ Status counts
           ========================================================= */
        this.statusCounts = {
            Approved: 0,
            Rejected: 0,
            Requested: 0
        };

        finalData.forEach(leave => {
            if (leave.Status__c === 'Approved') {
                this.statusCounts.Approved++;
            } else if (leave.Status__c === 'Rejected') {
                this.statusCounts.Rejected++;
            } else if (leave.Status__c === 'Requested') {
                this.statusCounts.Requested++;
            }
        });

        /* =========================================================
           7️⃣ Pagination
           ========================================================= */
        this.records = [...finalData];
        this.totalRecords = finalData.length;
        this.allLeaves = [...finalData];
        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;
        this.paginationHelper();

        /* =========================================================
           8️⃣ AUTO OPEN LEAVE FROM TASK (🔥 NEW)
           ========================================================= */
        console.log(
                "🧭 [AUTO-OPEN CHECK] fromtask:",
                this.fromtask,
                "taskleaveid:",
                this.taskleaveid,
                "autoOpenedFromTask:",
                this.autoOpenedFromTask
            );

            if (
                this.fromtask === true &&
                this.taskleaveid &&
                !this.autoOpenedFromTask
            ) {

                console.log(
                    "🚀 [AUTO-OPEN START] Trying to auto-open Leave from Task:",
                    this.taskleaveid
                );

                // 🔍 Try current filtered month first
                let match = finalData.find(
                    l => l.Id === this.taskleaveid
                );

                console.log(
                    "🔍 [AUTO-OPEN SEARCH RESULT - CURRENT MONTH]:",
                    match
                );

                // 🔁 If not in this month → try full dataset & switch calendar
                if (!match && !this.dateSwitchInProgress) {

                    console.warn(
                        "⚠️ [AUTO-OPEN] Not in wire data — fetching leave by Id"
                    );

                    this.dateSwitchInProgress = true;

                    getLeaveById({ leaveId: this.taskleaveid })
                        .then(leaveRec => {
                            console.log(
                                "📥 [AUTO-OPEN] Loaded leave directly:",
                                leaveRec
                            );

                            this.switchCalendarToLeaveDate(leaveRec);
                        })
                        .catch(err => {
                            console.error(
                                "❌ [AUTO-OPEN] Could not load Leave by Id:",
                                err
                            );
                        });

                    return; // wait for next wire run
                }


                // ✅ Found in current month after switch
                if (match) {
                    this.autoOpenedFromTask = true;
                    this.dateSwitchInProgress = false;

                    console.log(
                        "✅ [AUTO-OPEN SUCCESS] Found Leave → firing handleorgedit",
                        match.Id
                    );

                    // Fake click → open record
                    this.handleorgedit({
                        currentTarget: {
                            dataset: {
                                id: match.Id,
                                staffid: match.Staff__c,
                                managerid: match.Staff__r?.Manager__c,
                                url: match.Leave_Document__c,
                                status: match.Status__c,
                                durationtype:
                                    match.Duration_Type__c
                            }
                        }
                    });

                    console.log(
                        "📢 [AUTO-OPEN] Dispatching leavetaskconsumed event"
                    );

                    this.dispatchEvent(
                        new CustomEvent("leavetaskconsumed", {
                            bubbles: true,
                            composed: true
                        })
                    );

                } else if (!this.dateSwitchInProgress) {
                    console.warn(
                        "⚠️ [AUTO-OPEN FAILED] Leave not found even after switch:",
                        this.taskleaveid
                    );
                }

            } else {
                console.log(
                    "⏭️ [AUTO-OPEN SKIPPED] Conditions not met",
                    {
                        fromtask: this.fromtask,
                        taskleaveid: this.taskleaveid,
                        autoOpenedFromTask: this.autoOpenedFromTask
                    }
                );
            }



    } catch (err) {
        console.error('Leaves facility filter error:', err);
        this.handleError(err);
    } finally {
        this.showSpinner = false;
    }
}
dateSwitchInProgress = false;

switchCalendarToLeaveDate(leave) {
    if (!leave?.From__c) {
        console.warn(
            "⚠️ [AUTO-SWITCH DATE] Leave has no From__c — skipping calendar switch"
        );
        return;
    }

    const leaveDate = new Date(leave.From__c);

    const targetMonth = leaveDate.getMonth() + 1; // JS month index
    const targetYear = leaveDate.getFullYear();

    console.log(
        "📅 [AUTO-SWITCH DATE] Switching calendar to:",
        targetMonth,
        targetYear
    );

    this.currentMonth = targetMonth;
    this.currentYear = targetYear;

    this.calculateDates();
    this.fetchLeaveData();
}



handleCardClick(event) {
    const name = event.currentTarget.dataset.name;

    this.cashoutFlag = name === 'cashout';
    this.TerminationFlag = name === 'termination';
    this.calendarFlag = name === 'calendar';
    this.staffFlag = name === 'staff';
    this.isHome = false;
}

@track staffList=[];
// @track totalAccruedHours;
@track cancelledLeavesCount;
@track requestedLeavesCount;
@track totalStaffCount;
// @track highBalance;
@track totalAnnualLeave;
@track totalPersonalLeave;
@track allLeaves = [];
@track activeTile = null; //active tile: annual, personal and null


loadStaff() {
       
        getStaffsByOrg({ recordId: this.orgid, FacilityId:this.FacilityId })
        .then(result => {
            this.staffList = result || [];

            // 1️⃣ TOTAL STAFF COUNT
            this.totalStaffCount = this.staffList.length;

            // INIT COUNTERS
            // let totalAccruedHours = 0;
            let totalAnnualLeave = 0;
            let totalPersonalLeave = 0;
            let cancelledLeavesCount = 0;
            let requestedLeavesCount = 0;
            let highBalanceCount = 0;

            // 2️⃣ LOOP THROUGH STAFF
            this.staffList.forEach(staff => {

                // TOTAL ACCRUED HOURS (Annual + Personal)
                /*
                totalAccruedHours += Number(staff.Annual_leave_Accrued__c || 0);
                totalAccruedHours += Number(staff.Personal_Leave_Accur__c || 0);

                const annualHours = Number(staff.Annual_leave_Accrued__c || 0);

                if (annualHours >= 304) {
                    highBalanceCount++;
                }
                */

                // ANNUAL LEAVE ACCRUED
                totalAnnualLeave += Number(staff.Annual_leave_Accrued__c || 0);

                // PERSONAL LEAVE ACCRUED
                totalPersonalLeave += Number(staff.Personal_Leave_Accur__c || 0);

                // 3️⃣ LEAVES COUNT
                if (staff.Leaves__r && staff.Leaves__r.length > 0) {
                    staff.Leaves__r.forEach(leave => {
                        if (leave.Status__c === 'Cancelled') {
                            cancelledLeavesCount++;
                        } else if (leave.Status__c === 'Requested') {
                            requestedLeavesCount++;
                        }
                    });
                }
            });

            // ASSIGN FINAL VALUES
            // this.totalAccruedHours = Number(totalAccruedHours.toFixed(2));
            this.cancelledLeavesCount = cancelledLeavesCount;
            this.requestedLeavesCount = requestedLeavesCount;
            // this.highBalance = highBalanceCount;
            this.totalAnnualLeave = Number(totalAnnualLeave.toFixed(2));
            this.totalPersonalLeave = Number(totalPersonalLeave.toFixed(2));

            console.log('Total Staff:', this.totalStaffCount);
            console.log('Cancelled Leaves:', this.cancelledLeavesCount);
            console.log('Requested Leaves:', this.requestedLeavesCount);
        })
        .catch(err => {
            this.error = err;
            console.error('Error loading staff:', err);
        })
        .finally(() => {
            this.isLoading = false;
        });
    }

 
    renderChart() {
        // Ensure Chart.js is loaded before rendering
        if (!this.chartjsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.chartjsInitialized = true;
                    this.initializeChart();
                })
                .catch(error => {
                    console.error('Error loading ChartJS: ', error);
                });
        } else {
            this.initializeChart();
        }
    }

    initializeChart() {
        const canvas = this.template.querySelector('canvas.chart');
        const ctx = canvas.getContext('2d');
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Approved', 'Rejected', 'Requested'],
                datasets: [{
                    label: 'Leave Status',
                    data: [
                        this.statusCounts.Approved,
                        this.statusCounts.Rejected,
                        this.statusCounts.Requested
                    ],
                    backgroundColor: ['rgb(144, 245, 144)', 'rgb(238, 101, 101)', 'rgb(255, 255, 0)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            
                    legend: {
                        display: true,
                        position: "right"
                    }
                
            }
        });
    }

       

    handleleave(event){
        this.leaveflag=true;
        this.isHome2=false;
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
    }

    handleCancel(event){
        this.leaveflag=false;
        this.isHome=true;
        this.isHome2=true;
         this.chartjsInitialized = false; 
        //this.renderChart();
       /*  this.navigateToToday();  */
       
       
   
    }
    handleInput(event){
        const fieldName = event.target.fieldName;

        if (fieldName === 'From__c') {
            this.fromDate = event.target.value;
        
        } else if (fieldName === 'To__c') {
            this.toDate = event.target.value;
            
        }else if (fieldName === 'Type_of_Leave__c') {
            this.type = event.target.value;
        }
        if (this.fromDate && this.toDate) {
            if (new Date(this.toDate) < new Date(this.fromDate)) { 
                 this.dateErrorMessage = 'You cannot set to date that precedes the from date.';
                 this.saveButtonDisable=true;
            } else {
                this.dateErrorMessage = '';
                this.saveButtonDisable=false;
            }
        }
        
        if (this.fromDate && this.toDate) {
            const duration = this.calculateBusinessDays(new Date(this.fromDate), new Date(this.toDate));
            this.duration = duration;
        }
        if (this.type && this.duration) {
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

    handleError(error) {
        // Implement your error handling logic here
        console.error('Error in wired method:', error);
    }
    handleSuccess(event){
        console.log('hi');

        
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Leave status updated successfully.",
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
       // console.log('base64>> ',this.base64FileData);       
        this.showSpinner = true;
        refreshApex(this.wiredLeaveResult);
        refreshApex(this.wiredLeaveorg);
        this.leaveflag=false;
        this.isHome=true;  
        this.isHome2=true;
        let LeaveRecID=event.detail.id;
        //Uploading files to AWS S3 bucket
        if(this.base64FileData!=undefined)
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
                 
        this.showSpinner = false; 
    }
        
            setTimeout(() => {
                refreshApex(this.wiredLeaveResult);
                refreshApex(this.wiredLeaveorg);
            }, 1200);
         this.fileName='';
        
    }
    handleSubmit(event){
    
         event.preventDefault();
           const fields = event.detail.fields;

            if (this.managerId !== this.currentloggedstaffid) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Unauthorized',
                message: 'You are not authorized to approve or reject.',
                variant: 'error',
                mode: 'dismissable'
            })
        );
        return; // ❌ STOP execution
    }
             /* if(this.isdisablefields==false){
                fields.Staff__c=this.StaffId;
                this.template.querySelector('lightning-record-edit-form').submit(fields);
             }else{
                console.log('hi');
                if (this.statusValue === 'Rejected' || this.statusValue === 'Approved') {
                    console.log('hi2');
                    fields.Approved_by__c=this.currentUser;
                    this.template.querySelector('lightning-record-edit-form').submit(fields);
                }else{ 
                    console.log('hi3');
                    this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error!!',
                        message:'You can either Approve or Reject',
                        variant: 'Error',
                    }),
                );
                   return;
                }
            
             } */
                if (this.statusValue === 'Rejected' || this.statusValue === 'Approved' ||  this.statusValue === 'Cancelled') {
                    console.log('hi2');
                    fields.Approved_by__c=this.currentUser;
                     console.log('this.currentUser;',this.currentUser);
                    this.template.querySelector('lightning-record-edit-form').submit(fields);
                }else{ 
                    console.log('hi3');
                    this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Warning!',
                        message:'You can either Approve or Reject',
                        variant: 'warning',
                    }),
                );
                   return;
                }


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
        this.showSpinner = false;
       /*  console.log('fileName>>',this.fileName);
        console.log('file prepared');
       */
       
    }
    @track editContext = {};
    handleStatus(event){
        this.statusValue = event.target.value;
        console.log('status ------>'+this.statusValue);
    }
    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
        this.leaveflag=true;
    }
    closeviewfile(event){
        this.isModalOpen = false;
        this.isHome=true;
        this.isHome2=true;
        this.currentUrl ='';
        this.leaveflag=false;
        if (this.editContext && this.editContext.id) {
        this.handleorgedit({
            currentTarget: {
                dataset: {
                    id: this.editContext.id,
                    staffid: this.editContext.staffid,
                    managerid: this.editContext.managerid,
                    url: this.editContext.url,
                    status: this.editContext.status,
                    durationtype: this.editContext.durationtype
                }
            }
        });
    }
    }
    @track Docurl;
    @track iscustom=false;
    @track managerId;
    @api taskleaveid;
    autoOpenedFromTask = false;


    handleorgedit(event){
        this.leaveflag=true;
        this.iscustom=false;
        this.leaverecordId=event.currentTarget.dataset.id;
        this.StaffId=event.currentTarget.dataset.staffid;
         this.managerId=event.currentTarget.dataset.managerid;
         console.log('current logged staff id '+this.managerId);

        this.Docurl=event.currentTarget.dataset.url;
        const status = event.currentTarget.dataset.status;
        if (status === 'Withdraw') {
            this.commentsFlag=true;
        } else {
            this.commentsFlag=false;
        }
        const durationtype=event.currentTarget.dataset.durationtype;
        if (durationtype === 'Custom Hours') {
            this.iscustom = true;
        }
        this.isdisablefields=true;
        this.isstatus=true;
        this.isHome2=false;
        this.editContext = {
        id: this.leaverecordId,
        staffid: this.StaffId,
        url: this.Docurl,
        managerid: this.managerId,
        status: status,
        durationtype: durationtype
        
    };
        
    }    


    
    
    previousMonth() {
        if (this.currentMonth > 1) {
            this.currentMonth -= 1;
        } else {
            this.currentMonth = 12; // Wrap to December
            this.currentYear -= 1;  // Move to the previous year
        }
        this.calculateDates(); // Recalculate dates when month changes
        this.fetchLeaveData();
    }

    nextMonth() {
        if (this.currentMonth < 12) {
            this.currentMonth += 1;
        } else {
            this.currentMonth = 1; // Wrap to January
            this.currentYear += 1;  // Move to the next year
        }
        this.calculateDates(); // Recalculate dates when month changes
        this.fetchLeaveData();
    }

    previousYear() {
        this.currentYear -= 1;
        this.calculateDates(); // Recalculate dates when year changes
        this.fetchLeaveData();
    }

    nextYear() {
        this.currentYear += 1;
        this.calculateDates(); // Recalculate dates when year changes
        this.fetchLeaveData();
    }

    // Calculate Start and End Dates
    calculateDates() {
        console.log('Current Year:', this.currentYear);
        console.log('Current Month:', this.currentMonth);
        
        if (this.currentMonth && this.currentYear) {
            // Calculate start of the month
            const startOfMonth = new Date(this.currentYear, this.currentMonth - 1, 1);
            this.startDate = this.formatDate(startOfMonth); // Sets DD-MM-YYYY
            
            // Calculate end of the month (last day of the current month)
            const endOfMonth = new Date(this.currentYear, this.currentMonth, 0); // Last day of current month
            this.endDate = this.formatDate(endOfMonth); // Sets DD-MM-YYYY
            
            console.log('Start date:', this.startDate);
            console.log('End date:', this.endDate);
        } else {
            console.error('Start date cannot be calculated. Month or Year is invalid.');
            this.startDate = undefined;
            this.endDate = undefined;
        }
       /*  if(this.startDate!=undefined && this.endDate!=undefined){
            refreshApex(wiredLeaveorg);
        } */
    }

    // Helper method to format date to DD-MM-YYYY
    formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    // Method to Fetch Data
    fetchLeaveData() {
        refreshApex(this.wiredLeaveorg);
    }

    // Month and Year Display
    get currentMonthName() {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return `${monthNames[this.currentMonth - 1]} ${this.currentYear}`;
    }
    navigateToToday(event){
        this.currentMonth=new Date().getMonth() + 1;
        this.currentYear=new Date().getFullYear();
        this.calculateDates(); 
    }

    
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number
    
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber === this.totalPages || this.totalPages === 0;
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
        this.orgleaves = [];
        if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        } 
        this.showSpinner = false;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        let tempconList=[];   
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
       // console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.orgleaves = tempconList;
      //  refreshApex(this.wiredFeedbackData);
    }

    @track pageSizeOptions1 = [10, 25, 50, 75, 100]; //Page size options
    @track records1 = []; //All records available in the data table
    @track columns1 = []; //columns information available in the data table
    @track totalRecords1 = 0; //Total no.of records
    @track pageSize1; //No.of records to be displayed per page
    @track totalPages1; //Total no.of pages
    @track pageNumber1 = 1; //Page number

    get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }    
    handleRecordsPerPage1(event) {
        this.pageSize1 = event.target.value;
        this.paginationHelper1();
    }
    previousPage1() {
        this.pageNumber1 = this.pageNumber1 - 1;
        this.paginationHelper1();
    }
    nextPage1() {
        this.pageNumber1 = this.pageNumber1 + 1;
        this.paginationHelper1();
    }
    firstPage1() {
        this.pageNumber1 = 1;
        this.paginationHelper1();
    }
    lastPage1() {
        this.pageNumber1 = this.totalPages1;
        this.paginationHelper1();
    }
    paginationHelper1() {
        this.leaves = [];
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }
        let tempconList=[];   
        for (let i = (this.pageNumber1 - 1) * this.pageSize1; i < this.pageNumber1 * this.pageSize1; i++) {
            if (i === this.totalRecords1) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records1[i]);           
            tempconList.push(tempConRec);    
        }
       // console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.leaves = tempconList;
       // refreshApex(this.wiredFeedbackData);
    }

    handleback(){
        this.cashoutFlag = false;
        this.TerminationFlag = false;;
        this.calendarFlag = false;
        this.staffFlag = false;;
        this.isHome = true;
    }

    disconnectedCallback() {
        // Reset task-driven navigation context
        this.fromtask = false;
        this.taskleaveid = null;
        this.autoOpenedFromTask = false;
    }

    getStatusClass(status) {

        switch (status) {

            case 'HR Admin Approval Pending':
                return 'status-pill status-warning';

            case 'Payroll Admin Approval Pending':
                return 'status-pill status-info';

            case 'HR Admin Rejected':
                return 'status-pill status-danger';

            case 'Payroll Admin Rejected':
                return 'status-pill status-danger';

            case 'Approved':
                return 'status-pill status-success';

            default:
                return 'status-pill status-secondary';
        }
    }

    @track cashoutList = [];

    /*
    loadAllCashouts() {

        getAllCashoutRequests({ orgId: this.orgid })
            .then(result => {

                console.log('Cashout records from Apex:', result);
                console.log('Record count:', result ? result.length : 0);

                if (!result || result.length === 0) {
                    this.cashoutList = [];
                    this.filteredCashoutList = [];
                    return;
                }

                this.cashoutList = result.map(r => ({
                    id: r.Id,
                    employeeName: r.Staff__r?.Name,
                    role: r.Staff_Role__r?.RoleName__c,
                    employmentType: r.Staff__r?.Type_of_Employe__c,
                    hours: r.Hours_Requested_to_Cash__c,
                    requestedDate: this.formattedDate(r.Date__c),
                    status: r.Status__c,
                    statusClass: this.getStatusClass(r.Status__c),
                    basePayRate: r.Base_Pay_Rate__c,
                    leaveLoadingRate:
                        r.Staff__r?.Facility__r?.Organisation__r?.Leave_Loading_Rate__c || 0,
                    hrOfficer: r.HR_Officer__r?.Name
                }));

                console.log('Mapped cashoutList:', this.cashoutList);

                this.filteredCashoutList = [...this.cashoutList];

                console.log('filteredCashoutList:', this.filteredCashoutList);

                this.calculateStatusCounts();
            })
            .catch(error => {
                console.error('Error loading cashouts', error);
            });
    }    

    handleBackToHome() {
        this.cashoutFlag = false;
        this.TerminationFlag = false;
        this.calendarFlag = false;
        this.staffFlag = false;
        this.isHome = true;
    }

    handleCashoutView(event) {
        this.selectedRecordId = event.currentTarget.dataset.id;
        this.loadRecordDetails();
    }

    loadRecordDetails() {
        getCashoutById({ recordId: this.selectedRecordId })
            .then(result => {
                this.selectedRecord = result;
                this.isReviewModalOpen = true;
            })
            .catch(error => {
                console.error(error);
            });
    }

    decisionOptions = [
        { label: 'Approve', value: 'Payroll Admin Approval Pending' },
        { label: 'Reject', value: 'HR Admin Rejected' }
    ];

    get isRejected() {
        return this.selectedDecision  === 'HR Admin Rejected';
    }

    handleDecisionChange(event) {
        this.selectedDecision  = event.detail.value;
    }

    handleRejectionChange(event) {
        this.rejectionReason = event.target.value;
    }

    handleDecisionSubmit() {

        if (!this.selectedDecision) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'Please select a decision',
                    variant: 'warning'
                })
            );
            return;
        }

        if (this.isRejected && !this.rejectionReason) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'Please enter a rejection reason',
                    variant: 'warning'
                })
            );
            return;
        }

        updateCashoutStatus({
            recordId: this.selectedRecordId,
            status: this.selectedDecision,
            rejectionReason: this.rejectionReason,
            hrName: this.hrName
        })
        .then(() => {

            let message = '';

            if (this.selectedDecision === 'Approved') {
                message = 'Cashout request approved successfully.';
            }
            else if (this.selectedDecision === 'Payroll Admin Approval Pending') {
                message = 'Cashout request forwarded to Payroll Admin.';
            }
            else if (this.selectedDecision === 'HR Admin Rejected' || this.selectedDecision === 'Payroll Admin Rejected') {
                message = 'Cashout request rejected.';
            }

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: message,
                    variant: 'success'
                })
            );

            this.isReviewModalOpen = false;
            this.loadAllCashouts();

        })
        .catch(error => {
            console.error(error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Error updating cashout request',
                    variant: 'error'
                })
            );
        });
    }

    closeReviewModal() {
        this.isReviewModalOpen = false;
        this.selectedRecordId = null;
        this.selectedRecord = null;
        this.selectedDecision = null;
        this.rejectionReason = '';
        this.hrNotes = '';
        this.hrName = '';
        this.hrDate = null;
        this.hrSignature = '';
        this.hrConfirmation = false;
    }

    formattedDate(dateString) {
        if (!dateString) return ''
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    handleDownloadPdf(event) {
        const recordId = event.currentTarget.dataset.id;

        getCashoutById({ recordId })
            .then(result => {
                this.generateCashoutPdf(result);
            })
            .catch(error => {
                console.error('Error fetching record for PDF:', error);
            });
    }

    async generateCashoutPdf(record) {

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let currentY = 20;
        const maxWidth = 170;

        const addNewPageIfNeeded = (height = 10) => {
            if (currentY + height > 280) {
                doc.addPage();
                currentY = 20;
            }
        };

        const addLabelAndText = (label, value) => {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, currentY);
            currentY += 6;

            doc.setFont(undefined, 'normal');
            const lines = doc.splitTextToSize(value || 'N/A', maxWidth);
            addNewPageIfNeeded(lines.length * 6);

            lines.forEach(line => {
                doc.text(line, 20, currentY);
                currentY += 6;
            });

            currentY += 4;
        };

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`Leave Cashout Request`, 60, currentY);
        currentY += 12;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        currentY += 10;

        doc.line(20, currentY, 190, currentY);
        currentY += 10;

        addLabelAndText('Employee Name:', record.Staff__r?.Name);
        addLabelAndText('Role:', record.Staff__r?.Role__c);
        addLabelAndText('Employment Type:', record.Staff__r?.Type_of_Employe__c);
        addLabelAndText('Pay Period:', record.Pay_Period__c);

        doc.line(20, currentY, 190, currentY);
        currentY += 10;

        addLabelAndText('Hours Requested:', `${record.Hours_Requested_to_Cash__c} Hrs`);
        addLabelAndText('Base Pay Rate:', `$${record.Base_Pay_Rate__c}`);
        addLabelAndText('Leave Loading Rate:', `${record.Leave_Loading_Rate__c || 0}%`);
        addLabelAndText('Total Estimated Cashout:', `$${record.Total_Cashout__c}`);
        addLabelAndText('Reason for Cashout:', record.Reason_for_Cashout__c);

        doc.line(20, currentY, 190, currentY);
        currentY += 10;

        addLabelAndText('Current Status:', record.Status__c);
        addLabelAndText('HR Officer:', record.HR_Admin__c);
        addLabelAndText('Rejection Reason:', record.Rejection_Reason__c);

        addLabelAndText('Employee Signature:', record.Signature__c);
        addLabelAndText('Signed Date:', record.Date__c);

        doc.save(`Cashout_${record.Name || record.Id}.pdf`);
    }

    calculateStatusCounts() {

        this.pendingCount = 0;
        this.rejectedCount = 0;
        this.approvedCount = 0;

        this.cashoutList.forEach(r => {

            switch (r.status) {

                case 'HR Admin Approval Pending':
                case 'Payroll Admin Approval Pending':
                    this.pendingCount++;
                    break;

                case 'HR Admin Rejected':
                case 'Payroll Admin Rejected':
                    this.rejectedCount++;
                    break;

                case 'Approved':
                    this.approvedCount++;
                    break;
            }
        });
    }

    handleSearch(event) {
        console.log('--- SEARCH TRIGGERED ---');
        const rawValue = event.target.value;
        console.log('Raw Input Value:', rawValue);
        this.searchKey = rawValue ? rawValue.toLowerCase() : '';
        console.log('Normalized Search Key:', this.searchKey);
        console.log('Total Records Before Filter:', this.cashoutList?.length);
        this.filteredCashoutList = this.cashoutList.filter(record => {
            const name = record.employeeName || '';
            console.log('Checking Record Name:', name);
            const match =
                name.toLowerCase().includes(this.searchKey);
            console.log('Match Result:', match);
            return match;
        });
        console.log('Total Records After Filter:', this.filteredCashoutList.length);
        console.log('Filtered Records:', JSON.stringify(this.filteredCashoutList));
        console.log('--- SEARCH COMPLETE ---');
    }

    toggleFilterDropdown(event) {
        event.stopPropagation();
        this.isFilterOpen = !this.isFilterOpen;
    }

    handleStatusChange(event) {
        this.selectedStatuses = event.detail.value;
        this.applyFilters();
    }

    applyFilters() {
        const statuses = this.selectedStatuses || [];
        this.filteredCashoutList = this.cashoutList.filter(record => {
            const matchesSearch =
                !this.searchKey ||
                record.employeeName?.toLowerCase().includes(this.searchKey);
            const matchesStatus =
                statuses.length === 0 ||
                statuses.includes(record.status);
            return matchesSearch && matchesStatus;
        });
    }

    openTerminationModal() {
        this.isTerminationModalOpen = true;
    }

    closeTerminationModal() {
        this.isTerminationModalOpen = false;
    }

    handleTerminationSuccess() {
        this.isTerminationModalOpen = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Termination payout created successfully',
                variant: 'success'
            })
        );
        this.loadTerminationPayouts();
    }

    role;
    employmentType;
    basePayRate;
    classificationLevel;
    classificationPayPoint;
    startDate;

    unpaidOrdinaryWages = 0;
    unpaidOvertime = 0;
    unpaidAllowances = 0;
    outstandingTotal = 0;

    noticePeriod = 0;
    noticeStatus = 'worked';
    payInLieu = 0;

    oneOffAdjustment = 0;
    outstandingAllowances = 0;
    allowanceAdjustmentTotal = 0;

    sectionSubtotal = 0;

    handleEmployeeChange(event) {

        const staffId = event.target.value;

        if(!staffId){
            return;
        }

        this.selectedStaffId = staffId;

        getEmployeeDetails({ staffId: staffId })
            .then(result => {

                if(result){

                    if (result.StaffRoles__r && result.StaffRoles__r.length) {

                        const primaryRole = result.StaffRoles__r[0];

                        this.role = primaryRole.RoleName__c;
                        this.basePayRate = primaryRole.Hourly_Rate__c;
                        this.classificationPayPoint = primaryRole.Classification_Pay_Point__c;
                        this.classificationLevel = primaryRole.Classification_Level__c;
                    }

                    this.employmentType = result.Type_of_Employe__c;
                    this.startDate = result.Emp_Start_Date__c;
                    this.accruedAnnualLeave = result.Annual_leave_Accrued__c;
                    this.leaveLoadingRate =
                        result.Facility__r?.Organisation__r?.Leave_Loading_Rate__c;
                }

            })
            .then(() => {

                this.calculateAnnualLeave();

                if(!this.selectedStaffId || !this.terminationDate){
                    return;
                }

                return getOutstandingWages({
                    staffId: this.selectedStaffId,
                    terminationDate: this.terminationDate
                });

            })
            .then(result => {

                if(result){
                    this.unpaidOrdinaryWages = result.unpaidOrdinaryWages || 0;
                }

            })
            .catch(error => {
                console.error('Error fetching employee details / wages', error);
            });
    }

    calculateOutstandingTotal(){
        this.outstandingTotal =
            Number(this.unpaidOrdinaryWages) +
            Number(this.unpaidOvertime) +
            Number(this.unpaidAllowances);
    }

    calculateSubtotal(){
        this.sectionSubtotal =
            Number(this.outstandingTotal) +
            Number(this.payInLieu) +
            Number(this.allowanceAdjustmentTotal);
    }

    loadTerminationPayouts() {

        getTerminationPayouts({ orgId: this.orgid })
            .then(result => {

                this.terminationList = [
                    ...result.map(r => ({

                        id: r.Id,
                        employeeName: r.Staff__r?.Name,
                        role: r.Staff__r?.Role__c,
                        employmentType: r.Staff__r?.Type_of_Employe__c,
                        terminationDate: r.Termination_Date__c,
                        status: r.Status__c,
                        statusClass: this.getStatusClass(r.Status__c),
                        accruedAnnualLeave: r.Staff__r?.Annual_leave_Accrued__c,
                        hrOfficer: r.CreatedBy?.Name

                    }))
                ];

            })
            .catch(error => {
                console.error('Error loading termination payouts', error);
            });

    }

    noticeOptions = [
        { label: 'Worked', value: 'Worked' },
        { label: 'Paid in Lieu', value: 'Paid in Lieu' }
    ];

    handleNoticeChange(event){
        this.noticeStatus = event.detail.value;
    }

    get unpaidOrdinaryWagesFormatted(){
        return '$' + Number(this.unpaidOrdinaryWages).toFixed(2);
    }

    get unpaidOvertimeFormatted(){
        return '$' + Number(this.unpaidOvertime).toFixed(2);
    }

    get unpaidAllowancesFormatted(){
        return '$' + Number(this.unpaidAllowances).toFixed(2);
    }

    get outstandingTotalFormatted(){
        return '$' + Number(this.outstandingTotal).toFixed(2);
    }

    get payInLieuFormatted(){
        return '$' + Number(this.payInLieu).toFixed(2);
    }

    get allowanceAdjustmentTotalFormatted(){
        return '$' + Number(this.allowanceAdjustmentTotal).toFixed(2);
    }

    get sectionSubtotalFormatted(){
        return '$' + Number(this.sectionSubtotal).toFixed(2);
    }

    calculateAnnualLeave(){
        const base = this.accruedAnnualLeave * this.basePayRate;
        const loading = base * (this.leaveLoadingRate / 100);
        this.annualLeavePayout = base + loading;
    }

    handleFormSubmit(event) {
        fields.Status__c = this.terminationStatus;
        this.template
            .querySelector('lightning-record-edit-form')
            .submit(fields);
    }

    handleSaveDraft() {
        this.terminationStatus = 'Draft';
        this.template.querySelector('lightning-record-edit-form').submit();
    }

    handleSubmitTermination() {
        this.terminationStatus = 'Pending';
    }

    handleTerminationDateChange(event){
        this.terminationDate = event.target.value;
    }

    hrName;
    handleHrNameChange(event) {
        this.hrName = event.target.value;
    }

    */
    
    handleLeaveTileClick(event) {
        const leaveType = event.currentTarget.dataset.type;

        console.log('Current Active Tile:', this.activeTile);
        console.log('Total records before action:', this.allLeaves.length);

        if (this.activeTile === leaveType) {
            this.activeTile = null;
            this.records = [...this.allLeaves];
            this.totalRecords = this.records.length;
            this.pageNumber = 1;
            this.paginationHelper();
            console.log('===== FILTER RESET COMPLETE =====');
            return;
        }

        console.log('Applying filter for:', leaveType);
        this.activeTile = leaveType;
        const filteredLeaves = this.allLeaves.filter(
            leave => leave.Type_of_Leave__c === leaveType
        );
        console.log('Filtered records count:', filteredLeaves.length);
        console.log('Filtered records:', JSON.stringify(filteredLeaves));
        this.records = filteredLeaves;
        this.totalRecords = filteredLeaves.length;
        this.pageNumber = 1;
        this.paginationHelper();
    }

    get isAnnualSelected() {
        return this.activeTile === 'Annual Leave';
    }

    get isPersonalSelected() {
        return this.activeTile === 'Personal Leave';
    }

    get annualTileClass() {
        return this.activeTile === 'Annual Leave' ? 'active' : '';
    }

    get personalTileClass() {
        return this.activeTile === 'Personal Leave' ? 'active' : '';
    }
    
}