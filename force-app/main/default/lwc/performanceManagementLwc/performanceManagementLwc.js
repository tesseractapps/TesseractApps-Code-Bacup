import { LightningElement , wire, api, track } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getStaffList from '@salesforce/apex/PerformanceController.getStaffList';
import getReviewer from '@salesforce/apex/PerformanceController.getReviewer';
import getStaffReviewerDetails from '@salesforce/apex/PerformanceController.getStaffReviewerDetails';
import getLibraryGoals from '@salesforce/apex/PerformanceController.getLibraryGoals';
import getUserData from '@salesforce/apex/PerformanceController.getUserData';
import checkPerformanceRecordExist from '@salesforce/apex/PerformanceController.checkPerformanceRecordExist';
import fetchLibraryGoalDetails from '@salesforce/apex/PerformanceController.fetchLibraryGoalDetails';
import getPerformanceById from '@salesforce/apex/PerformanceController.getPerformanceById';
import insertPerformanceGoal from '@salesforce/apex/PerformanceController.insertPerformanceGoal';
import getGoalsByPerformanceId from '@salesforce/apex/PerformanceController.getGoalsByPerformanceId';
import updateGoalData from '@salesforce/apex/PerformanceController.updateGoalData';
import { getRecord } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id'; 
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import getAwards from '@salesforce/apex/AwardController.getAwards';
import { refreshApex } from '@salesforce/apex';
import updatePerformanceStatus from '@salesforce/apex/PerformanceController.updatePerformanceStatus';
//import Save_Icon from '@salesforce/resourceUrl/Save_Icon';
//import Edit_Icon from '@salesforce/resourceUrl/Edit_Icon';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getPerformanceRecords from '@salesforce/apex/PerformanceController.getPerformanceRecords';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import updatePerformanceOutcome from '@salesforce/apex/PerformanceController.updatePerformanceOutcome';
//import getAdminUserEmails from '@salesforce/apex/PerformanceController.getAdminUserEmails';

export default class PerformanceManagementLwc extends LightningElement {
    @api hrFlag;
    @api orgid;
    @api myprofile;
    @track performanceFlag=false;
    @track homeflag=true;
    @track orgadmin=true;
    @track goalNewForm =false;
    @track buttonVisible;
    @track saveButtonDisable = false;
    @track staffEmail ='';
    @track facility='';
    @track Id;
    @track userStaffId;
    @track goalStaff;
    @track status;
    @track goalName='';
    @track isPrivate =false;
    @track startDate;
    @track endDate;
    @track staffName;
    @track staffOptions;
    @track staffRole='';
    @track levelId='';
    @track priority;
    @track libraryGoal='';
    @track libraryGoalId;
    @track libraryGoalOptions=[];
    @track reviewerId;
    @track reviewFromDate;
    @track reviewToDate;
    @track goalData;
    @track targetDate;
    @track relatedLink='';
    @track description='';
    @track successCriteria='';
    @track conversationNotes='';
    @track dateOfJoining='';
    @track isMidYearReviewRequired= false;
    @track midYearReviewDate;
    @track goalSettingMeeting;
    @track outcome;
    @track goalActualWeightage='';
    @track selectedPerformance;
    @track fullName;
    @track performanceId;
    @track goalList = [];
    @track performanceStatus;
    //@track goalSubmissionDate;
    @track goalAwardsTab=false;
    @track performanceTableFlag= true;
    @track staffDetailedView=false;
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; 
    @track fieldErrorMap = {};
    //@track refreshTable = [];
     @track currentUser;
     @track userEmail;
     @track userRole;
     @track userType;
    @track selectedYear = '2025-2026';              //'2024-2025';
    @track addLibraryGoalFlag=false;
    @track userDetails=[];
   // @track adminEmails=[];
    wiredStaffList;
    wiredUserDetails;
    wiredPerformanceResult;
    wiredPerformanceRecord;
    wiredGoals;
    wiredAwardResult;
    wiredAwardsForStaff;
    wiredGoalsResult;
    wiredPerformanceStaff;
    wiredPerformanceRecordsResult;
     @track performanceData=[];
     @track goalFlag=false;
     @track awardsFlag=false;
     @track overallflag=false;
     @track isEditable = false;
     @track isReviewerEditable=false;
     @track reviewerEmail='';
     @track yearOfAchievement;
     @track recordId;
     @track staffPerfId;
     @track goals = [];
     @track Awards = [];
     buttonDisabled = false;
     @track isFinishClicked = false;
     @track finishConfirmFlag=false;
     @track isDetailsVisible = false;
     @track isEditEnabled = false; // Toggle this value dynamically
     @track staffEmailflag= true;
     @track facilityFlag= true;
    // @track saveIconUrl = Save_Icon;
    // @track editIconUrl = Edit_Icon;
     @track isSaveEnabled= false;
     @track filteredStaffList = [];
     @track searchStaff = '';
     //@track filteredPerformData = []; 
     @track performanceGoalId;
     @track orgPerformance;
     @track staffPerformance;
     @track reviewerOptions=[];
     @track filteredPerformanceData = [];
     @track selectedStaffId = '';
     @track performanceRecordsExist = [];
     @track isStaffDisabled = false;
     @track dateErrorMessageFrom;
     @track dateErrorMessageTo;
     @track dateErrorMessageEnd;
     @track dateErrorMessageStart;
     @track dateErrorMessageTarget;
     @track roleTooltipText;
     @track isPopoverVisible = false;
     @track OrgNisationRoles=[];
     @track monthValue=[];
     @track chosenRole=[];
     @track goalRecords=[];
     @track isFinishDisabled=false;
     @track paginationVisible=false;
     @track noRecordsFlag=false;
     @track facilityPreferredName;
     @track participantPreferredName;
     //@track isMyProfile=false;
     @track todayDate = new Date().toISOString().split('T')[0]; 
     activeSections = ['performanceDetails','manageGoalDetails'];
     timeout;
     //@track hideorShowEdit=false;
     //@track isStaffEditing = true;
     @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    // yearOptions =[
    //     { label:'2023-2024',value:'2023-2024'},
    //     { label:'2024-2025',value:'2024-2025'},
    //     { label:'2025-2026',value:'2025-2026'},
    //    ]
    yearOptions = [
   // { label: '2023-2024', value: '2023-2024' },
    { label: '2024-2025', value: '2024-2025' },
    { label: '2025-2026', value: '2025-2026' }, // ✅ No extra spaces
];
    priorityOptions=[
        { label:'High',value:'High'},
        { label:'Medium',value:'Medium'},
        { label:'Low',value:'Low'}
    ]
    
    levelOptions =[
        { label:'NDIS Org Admin',value:'NDIS Org Admin'},
        { label:'Roster Manager',value:'Roster Manager'},
        { label:'HR Admin',value:'HR Admin'},
        { label:'Facility Admin',value:'Facility Admin'}, 
        { label:'NDIS Staff',value:'NDIS Staff'}, 
        { label:'Payroll Admin',value:'Payroll Admin'}
    ]
    goalSettingMeetingOptions=[
        { label:'Yes',value:'Yes'},
        { label:'No',value:'No'} 
    ]
    @track monthOptions = [
        { label: 'Jan - Mar', value: 'Jan-Mar' },
        { label: 'Apr - Jun', value: 'Apr-Jun' },
        { label: 'Jul - Sep', value: 'Jul-Sep' },
        { label: 'Oct - Dec', value: 'Oct-Dec' },
    ];
    @track sectionFlags = {
        performanceDetails: true,
        manageGoalDetails:false,
    };
    @track sectionIcons = {
        performanceDetails: '\u2B9F', 
        manageGoalDetails:'\u2B9C',
    };
    
    handleSectionToggle(event) {
        // const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute

        // // Toggle the flag and update the icon dynamically
        // this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        // this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
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
    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName,UserType]}) 
    userDetailsData({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.userEmail=data.fields.Email.value;
            this.userRole =data.fields.User_Role__c.value;
            // this.userType  =data.fields.User_Type__c.value;
             if (this.myprofile) {
                this.userType= 'NDIS Staff';
            } else {
                this.userType  =data.fields.User_Type__c.value;
            }
            this.orgadmin=true;
        } else if (error) {
            this.usererror = error ;
        }
    }
    connectedCallback(){
        //refreshApex(this.wiredAwardResult);
        // console.log('orgid  in connected call back'+this.orgid);
        console.log('myprofile  in connected call back'+this.myprofile);
        if(this.orgid!= null){
            refreshApex(this.wiredPerformanceRecordsResult);
            refreshApex(this.wiredGoalsResult);
        }
        organizationDetails().then(response => {
            // console.log('orgid  in connected call back'+this.orgid);
            this.orgid = response.listofPriceBook.Id;
            this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
            let orgRoles= response.listofPriceBook.Roles__c;

            //console.log('listofPriceBook:', response.listofPriceBook);
            this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
                this.activeSections.push(rec);
                return {
                value: rec,
                label: rec
                };
            });       
        }); 
        const storedRoles = localStorage.getItem('filterRoles');
        if (storedRoles) {
            this.chosenRole = JSON.parse(storedRoles); 
            
        }
        const storedMonths = localStorage.getItem('filterMonths');
        if (storedMonths) {
            this.monthValue = JSON.parse(storedMonths);  
        }
        //console.log('role options  '+JSON.stringify(this.OrgNisationRoles));  
        if (this.myprofile) {
            this.userType='';
            this.filteredPerformanceData = [];
            this.performanceRecords = [];
            this.userType= 'NDIS Staff';
            console.log('userType  in connected call back for myprofile: '+this.userType);  
        }
    }
     @wire(getUserData)
     wiredUserDetails({data,error}){
        if(data){
             this.userDetails=data;
              //console.log('userDetails IN wiredUserDetails : '+JSON.stringify(this.userDetails ));
        } else if(error){
              console.log('Error fetching User etails : '+error);
        }
     }

   // Wire to get Staff data from Apex
    // @wire(getStaffList, { userType: '$userType' , orgid: '$orgid' })
    // wiredStaffList({ data, error }) {
    //    // console.log('orgid  in staff list'+this.orgid);
    //     if (data) {
    //         this.staffOptions = data.map(staff => ({
    //             label: `${staff.Name} ${staff.Last_Name__c}`,
    //             value: staff.Id
    //         }));
             
    //          console.log('  staff options length:', this.staffOptions.length);
    //        // console.log('staff options'+  JSON.stringify(this.staffOptions));
    //         if (data.length === 1) {

    //             this.selectedStaffId = data[0].Id;
    //            // console.log('selectedStaffId in wire : '+ this.selectedStaffId );
    //             this.checkPerformanceForStaff(this.selectedStaffId); 
    //             this.fetchStaffDetails(this.selectedStaffId);
    //         }
    //         //this.filteredStaffList = data;
    //     } else if (error) {
    //         this.showErrorToast(error.body.message);
    //     }
    //     //console.log(' staffOptions in wiredStaffList '+JSON.stringify(this.staffOptions));
    // } 

    // @wire(getAdminUserEmails)
    // wiredAdminEmails({ data, error }) {
    //     if (data) {
    //         this.adminEmails = data.map(email => email.toLowerCase());
    //         console.log('adminEmails: ', JSON.stringify(this.adminEmails));
    //     } else {
    //         this.adminEmails = [];
    //     }
    // }
    @wire(getStaffList, { userType: '$userType' , orgid: '$orgid' ,selectedYear:  '$selectedYear' })
    wiredStaffList({ data, error }) {
       // console.log('orgid  in staff list'+this.orgid);
        if (data) {
            console.log('data  IN  getStaffList'+  JSON.stringify(data));
            const storedFacilityId = localStorage.getItem('defaultFacilityId');
            const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
            console.log('storedFacilityId'+storedFacilityId);
            console.log('storedFacilityLabel'+storedFacilityLabel);
            console.log('data length  '+ data.length);

            const filteredStaff = data.filter(staff => staff.Facility__c === storedFacilityId);
            console.log('filteredStaff after '+  JSON.stringify(filteredStaff));

        //      const staffByFacility = data.filter(staff => staff.Facility__c === storedFacilityId);
        //     console.log('staffByFacility length: ' + staffByFacility.length);
        //     console.log('staffByFacility: ' + JSON.stringify(staffByFacility));

        //     // Step 2: Filter out staff whose emails are in adminEmails
        //    const filteredStaff = staffByFacility.filter(staff => {
        //         const staffEmail = staff.Email_Address__c ? staff.Email_Address__c.toLowerCase() : '';
        //         return !this.adminEmails.includes(staffEmail);
        //     });
            console.log('filteredStaff length (after excluding admin emails): ' + filteredStaff.length);
            console.log('filteredStaff: ' + JSON.stringify(filteredStaff));
            
            this.staffOptions = filteredStaff.map(staff => ({
               // label: `${staff.Name} ${staff.Last_Name__c}`,
               label: `${staff.Display_Nickname__c}`,
                value: staff.Id
            }));
            console.log('staff options'+  JSON.stringify(this.staffOptions));
            console.log('  staff options length:', this.staffOptions.length);
            if (data.length === 1 && this.myprofile) {
                this.staffOptions = data.map(staff => ({
               // label: `${staff.Name} ${staff.Last_Name__c}`,
               label: `${staff.Display_Nickname__c}`,
                value: staff.Id
            }));

                this.selectedStaffId = data[0].Id;
                console.log('selectedStaffId in wire : '+ this.selectedStaffId );
                this.checkPerformanceForStaff(this.selectedStaffId); 
                this.fetchStaffDetails(this.selectedStaffId);
            }
            //this.filteredStaffList = data;
        } else if (error) {
            this.showErrorToast(error.body.message);
        }
        //console.log(' staffOptions in wiredStaffList '+JSON.stringify(this.staffOptions));
    } 
    checkPerformanceForStaff(staffId) {
        //console.log('selectedStaffId  in checkPerformanceForStaff>> '+this.staffId);
        checkPerformanceRecordExist({ staffId: staffId, selectedYear: this.selectedYear })
            .then(result => {
              
                this.isStaffDisabled = result;  // Disable the Staff combobox if performance record exists              
            })
            .catch(error => {
                console.error('Error checking performance record existence:', error);
            });
    }
    @wire(getStaffByEmail, { email: '$userEmail' })
    wiredClient(result) {
        this.wiredClientResult = result;
        //console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
           // console.log('Data: ', data); // Debugging line
            this.clientData = data;
            this.userStaffId = this.clientData[0].Id;
            //console.log('userStaffId: ',this.userStaffId ); 
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    }
    @wire(getReviewer,{orgid: '$orgid'})
    wiredReviewers({ data, error }) {
        if (data) {

            const storedFacilityId = localStorage.getItem('defaultFacilityId');
            const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
            console.log('storedFacilityId'+storedFacilityId);
            console.log('storedFacilityLabel'+storedFacilityLabel);

            console.log('reviewer data length  '+ data.length);

            const filteredReviewer = data.filter(staff => staff.Facility__c === storedFacilityId);
            console.log('filteredReviewer after '+  JSON.stringify(filteredReviewer));

            console.log('  filteredReviewer length :', filteredReviewer.length);
            this.reviewerOptions = filteredReviewer.map(staff => ({
                //label: `${staff.Name} ${staff.Last_Name__c}`,
                 label: `${staff.Display_Nickname__c}`,
                value: staff.Id
            }));
            console.log('reviewer options'+  JSON.stringify(this.reviewerOptions));
            console.log('  reviewerOptionss length:', this.reviewerOptions.length);

           // Map the data into a format suitable for the combobox options
            // this.reviewerOptions = data.map(staff => ({
            //     label: `${staff.Name} ${staff.Last_Name__c}`,  // Display name in the combobox
            //     value: staff.Id      // The value that will be stored when selected
            // }));
            console.log('Reviewer options'+  JSON.stringify(this.reviewerOptions));
            if (data.length === 1) {
                this.reviewerId = data[0].Id;
                //console.log('reviewerId  in getReviewer>> '+this.reviewerId);
               // this.checkPerformanceForStaff(this.selectedStaffId); 
                this.fetchReviewerEmail();
            }
        } else if (error) {
            // Handle any errors
            console.error('Error fetching reviewers:', error);
        }
       //console.log('reviewerOptions '+JSON.stringify(this.reviewerOptions ));
    }
    //  @wire(getPerformanceRecords, { orgid: '$orgid', userType: '$userType' })
    // wiredPerformanceRecords(response) {
    //     console.log('wiredPerformanceRecords');
    //     console.log('userType  in wiredPerformanceRecords: '+this.userType);  
    //     this.wiredPerformanceRecordsResult = response; // Save response for refreshApex
    //     const { data, error } = response;
    //     if (data) {
    //         //console.log('Raw data from wire method:', JSON.stringify(data));
    //         this.performanceRecords = this.mapPerformanceData(data);
    //         // console.log('performanceRecords:', JSON.stringify(this.performanceRecords));
    //         this.records =this.performanceRecords;              
    //         this.totalRecords = this.performanceRecords.length; // Update total records count                
    //         this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
    //         this.pageNumber = 1;
    //         //this.filteredPerformData = [...this.orgPerformance];  
    //        if(this.totalRecords>0){
    //           this.paginationVisible=true;
    //        }
    //         //this.filteredPerformanceData = [...this.performanceRecords]; // Default: show all records
    //         this.paginationHelper();
    //         this.error = undefined;
    //         this.applyFilters();
            
    //     } else if (error) {
    //         this.performanceRecords = [];
    //         this.filteredPerformanceData = [];
    //         this.error = 'Error retrieving performance records';
    //     }
    //     // if (this.selectedYear) {
    //     //     this.filterPerformanceByYear(this.selectedYear);
    //     // }
    // }
    @wire(getPerformanceRecords, { orgid: '$orgid', userType: '$userType' })
    wiredPerformanceRecords(response) {
        console.log('wiredPerformanceRecords');
        console.log('userType  in wiredPerformanceRecords: '+this.userType);  
        this.wiredPerformanceRecordsResult = response; // Save response for refreshApex
        const { data, error } = response;
        if (data) {
            const storedFacilityId = localStorage.getItem('defaultFacilityId');
            const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
            console.log('storedFacilityId'+storedFacilityId);
            console.log('storedFacilityLabel'+storedFacilityLabel);
            
            //console.log('Raw data from wire method:', JSON.stringify(data));
            // this.performanceRecords = this.mapPerformanceData(data);
            const mappedData = this.mapPerformanceData(data);
            console.log('mappedData from wire method:', JSON.stringify(mappedData));
            const filteredRecords = mappedData.filter(performance => performance.Staff__r.Facility__c === storedFacilityId);
            this.performanceRecords =filteredRecords;
            console.log('performanceRecords:', JSON.stringify(this.performanceRecords));
            this.records =this.performanceRecords;              
            this.totalRecords = this.performanceRecords.length; // Update total records count                
            this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
            this.pageNumber = 1;
            //this.filteredPerformData = [...this.orgPerformance];  
           if(this.totalRecords>0){
              this.paginationVisible=true;
           }
            //this.filteredPerformanceData = [...this.performanceRecords]; // Default: show all records
            this.paginationHelper();
            this.error = undefined;
            this.applyFilters();
            
        } else if (error) {
            this.performanceRecords = [];
            this.filteredPerformanceData = [];
            this.error = 'Error retrieving performance records';
        }
        // if (this.selectedYear) {
        //     this.filterPerformanceByYear(this.selectedYear);
        // }
    }
    mapPerformanceData(data) {
        console.log('data for Performance >> ', JSON.stringify(data));
        return data.map((performance) => {
            const financialYear = this.getFinancialYear(performance.Review_Period_From__c);

            //console.log('Mapped Performance Record:', { ...performance, financialYear }); // Debugging: Log the mapped record
            return {
                ...performance,
                financialYear: financialYear, // Add financialYear to the mapped data
                //fullName: `${performance.Staff__r?.Name ?? 'N/A'} ${performance.Staff__r?.Last_Name__c ?? ''}`,
               //fullName: performance.Staff__r?.Display_Nickname__c ?? '',
                fullName: `${performance.Staff__r?.Display_Nickname__c ?? ''}`,
                formattedReviewFrom: performance.Review_Period_From__c
                    ? new Date(performance.Review_Period_From__c).toLocaleDateString('en-GB')
                    : '',
                formattedReviewTo: performance.Review_Period_To__c
                    ? new Date(performance.Review_Period_To__c).toLocaleDateString('en-GB')
                    : '',
                reviewerName: performance.Reviewer__r?.Display_Nickname__c ?? '',

                status: performance.Status__c ?? 'In Progress',
                outcome: performance.Outcome_or_Weightage__c && performance.Outcome_or_Weightage__c !== 0
                    ? performance.Outcome_or_Weightage__c
                    : '-',
                staffRole: performance.Staff__r?.Role__c
                    ? performance.Staff__r.Role__c.split(';').join(', ')
                    : '',
            };
        });
    }

    // Helper function to get the financial year based on the review period
    getFinancialYear(reviewPeriodStart) {
        if (reviewPeriodStart) {
            const startDate = new Date(reviewPeriodStart);
            const startYear = startDate.getFullYear();
            const endYear = startYear + 1;
            return `${startYear}-${endYear}`;
        }
        return '';
    }
    handleYearChange(event) {
        this.selectedYear = event.target.value;
        this.applyFilters(); 
    }
   
    @wire(getGoalsByPerformanceId, { performanceId: '$performanceId' })
    wiredGoals( result) {
       // console.log('performanceId in getGoalsByPerformanceId:', this.performanceId);
       this.wiredGoalsResult = result;
        this.goalList = []; // Reset the goal list
        this.buttonVisible = false; // Reset button visibility
        this.error = undefined; // Clear any previous errors
        const { data, error } = result;
        if (data) {
            this.goalList = data.map(goal => {
                const isEditable = this.inLineStaffEdit(goal);
                const isReviewerEditable = this.inLineReviewerEdit(goal);
                const isStaffEmailMatching = this.userEmail === goal.Performance__r?.Staff_Email__c;
                const isReviewerEmailMatching = this.userEmail === goal.Performance__r?.Reviewer_Email__c;
                return {
                    ...goal,
                    GoalName: goal.Goal_Name__c ?? '',
                    Description: goal.Description__c ?? '',
                    actualWeightage: goal.Actual_Weightage_of_the_Goal__c ?? '',
                    staffComments: goal.Staff_Comments__c ?? '',
                    staffAssignedWeightage: goal.Staff_Assigned_Weightage__c ?? '',
                    reviewerComments: goal.Reviewer_Comments__c ?? '',
                    reviewerAssignedWeightage: goal.Reviewer_Assigned_Weightage__c ?? '',
                    staffEmail: goal.Performance__r?.Staff_Email__c ?? '',
                    reviewerEmail: goal.Performance__r?.Reviewer_Email__c ?? '',
                    isEditable: isEditable,
                    isReviewerEditable: isReviewerEditable,
                    isStaffEmailMatching:isStaffEmailMatching,
                    isReviewerEmailMatching:isReviewerEmailMatching
                };
            });
           // console.log(' this.isReviewerEditable 111 : '+ this.isReviewerEditable);
           // console.log('goalList after mapping: ', JSON.stringify(this.goalList));
           if (this.goalList.length > 0) {
            this.performanceStatus = this.goalList[0].Performance__r?.Status__c ?? '';
            }
            const isStaffEligible = this.goalList.some(goal => 
                goal.isStaffEmailMatching && !this.performanceStatus // Performance status is empty
                
            );
           // console.log('performance status in staff : ' +this.performanceStatus);
            // Check if Reviewer Conditions are met
            const isReviewerEligible = this.goalList.some(goal => 
                goal.isReviewerEmailMatching && this.performanceStatus === "Need Reviewer Acceptance" // Status check
            );
            //console.log('performance status in Reviewer : ' +this.performanceStatus);
            // Enable buttons based on conditions
            if (isStaffEligible || isReviewerEligible) {
                this.isSaveEnabled = true;
                this.isEditEnabled = true;
                this.buttonVisible = true;
            } 
           else {
                // Check if any goal field is editable
                const reviewerFieldEditable = this.goalList.some(goal => goal.isReviewerEditable);
                const staffFieldEditable = this.goalList.some(goal => goal.isEditable);
               
               // console.log('performance status in else : ' +this.performanceStatus);
               // console.log('reviewerFieldEditable: '+reviewerFieldEditable);
               // console.log('staffFieldEditable: '+staffFieldEditable);
               
                this.buttonVisible = staffFieldEditable;
                this.isSaveEnabled = staffFieldEditable;
                if(!this.performanceStatus && reviewerFieldEditable){
                    this.isSaveEnabled = false;
                    this.isEditEnabled = false;
                    this.buttonVisible = true; 
                    this.isFinishDisabled=true;
                }
            }
           // console.log('buttonVisible:', this.buttonVisible);
        } else if (error) {
            console.error('Error fetching data:', error);
            this.error = error; // Store the error
            this.goalList = []; // Clear goal list
            this.buttonVisible = false; // Hide the button in case of an error
        }  
    }

    handleError(error) {
        console.error(error);
    }

    @wire(getPerformanceById, { performanceId: '$performanceId' })
    wiredPerformance({ data, error }) {
        if (data) {
           // console.log('performance result: ', JSON.stringify(data));
            this.staffPerfId = data.Staff__r?.Id; // Safely accessing the Staff__r.Id field
            //console.log('staffPerfId: ', this.staffPerfId);
        } else if (error) {
            console.error('Error fetching performance details: ', error);
        }
    }
    @wire(getAwards, { recordId: '$staffPerfId', orgId: '$orgid' })
    wiredAwardsForStaff(result) {
        this.wiredAwardResult = result;
        const { data, error } = result;
        // console.log('Staff Id in awards 99: '+this.staffPerfId );
        //console.log('orgid  in awards999'+this.orgid);
        //console.log('Wire result in awards:', JSON.stringify(result)); 
        if (data) {
            this.Awards = data.map(Award => {
                return {
                    ...Award,
                    yearOfAchievement : Award.Date__c ? new Date(Award.Date__c).getFullYear() : ''
                };
            });
        } else if (error) {
            console.error('Error: ', error);
            this.handleError(error);
        }
    }

    formatDate(dateString) {
    const date = new Date(dateString);
    if (!date.getTime()) return null; // Return null if the date is invalid
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Return the date in 'YYYY-MM-DD' format
    }
    
    handleStaffChange(event) {
        const staffId = event.target.value;
        this.selectedStaffId = staffId;
       // console.log('staff id in handleStaffChange>> '+this.staffId);

        // Check if performance already exists for the selected staff
        this.checkPerformanceForStaff(staffId);
       // console.log('staff id>> '+this.staffId);
        this.fetchStaffDetails(staffId);
    }
    
    fetchLevelByUser(){
        //console.log('fetchLevelByUser');
       // console.log(' userDetails in fetchLevelByUser' +this.userDetails );
        const matchedUser= this.userDetails.find(function(user){
           return this.staffEmail===user.Email;
           
        }, this);
          console.error('matchedUser:', matchedUser);
    
        if(matchedUser){
           this.levelId = matchedUser.User_Type__c; 
           this.updateLibraryGoalOptions()
           // refreshApex(this.wiredLibraryGoalResult);
        } else{
            this.levelId ='';
        }
        //console.log('levelId  in fetch level:'+this.levelId);   
    }
   
    fetchReviewerEmail() {
        getStaffReviewerDetails({ staffOrReviewerId: this.reviewerId, isReviewer: true })
            .then((result) => {
                this.reviewerEmail = result.reviewerEmail; // Get email from the result map
            })
            .catch((error) => {
                console.error('Error fetching reviewer email:', error);
            });
    }

    // Fetch Staff Details
    fetchStaffDetails(staffId) {
        //console.log('Fetching details for staffId: ' + staffId); 
       
        getStaffReviewerDetails({ staffOrReviewerId: staffId, isReviewer: false })
            .then((result) => {
                 console.log('Result in fetchStaffDetails: ', JSON.stringify(result));
                //console.log('staff id in fetchStaffDetails>> '+staffId);
                this.facility = result.staffDetails.Facility_Name__c || ''; 
                this.staffRole = result.staffDetails.Role__c ? result.staffDetails.Role__c.split(';').join(', ') : ''; 
                this.staffEmail = result.staffDetails.Email_Address__c || '';
                this.dateOfJoining = result.staffDetails.Emp_Start_Date__c || '';
                this.fetchLevelByUser();
            })
            .catch((error) => {
                console.error('Error fetching staff details:', error);
            });
    }
   
    handleReviewerChange(event) {
       
         this.reviewerId = event.target.value;
        // Find the reviewer name based on the selected reviewerId
        const selectedReviewer = this.reviewerOptions.find(option => option.value === this.reviewerId);
        this.reviewerName = selectedReviewer ? selectedReviewer.label : '';
        if (this.reviewerId) {
            this.fetchReviewerEmail();
       }
    }
    handleLibraryGoal(event){
        this.libraryGoalId = event.target.value; 

      // console.log('libraryGoal Id in handleLibraryGoal >> '+this.libraryGoalId);
       const selectedGoal = this.libraryGoalOptions.find(option => option.value === this.libraryGoalId);
       this.libraryGoal = selectedGoal ? selectedGoal.label : '';  // Set the label for the selected goal
       //console.log('libraryGoal in handleLibraryGoal >> ' + this.libraryGoal); 
      

        if (this.libraryGoalId) {
            this.handleLibraryGoalFetch(this.libraryGoalId);
        } else {
            console.log('No library goal selected.');
        }
        //this.handleLibraryGoalFetch(libraryGoalId);
    }
     handleLibraryGoalFetch(libraryGoalId) {
       // console.log('handleLibraryGoalFetch');
       // console.log('libraryGoalId in handleLibraryGoalFetch >> ' + libraryGoalId);
        
        // Ensure the libraryGoalId is correctly passed to the Apex method
        fetchLibraryGoalDetails({ libraryGoalId })
            .then(result => {
                //console.log('Result in handleLibraryGoalFetch: ', JSON.stringify(result));
                // Prepopulate the description and weightage fields
                this.description = result.Description__c || ''; // Description field
                this.goalActualWeightage = parseFloat(result.Actual_Weightage_of_the_Goal__c) || 0; // Weightage field
            })
            .catch(error => {
                console.error('Error fetching Library Goal details:', error);
            });
    }
   
    handleNewGoal(){
        //this.slideClass = 'slide-left';
        this.goalNewForm=true;
        this.fieldErrorMap = {};
        this.addLibraryGoalFlag=false;
        this.homeflag = true;
        this.goalNewTable= false;
        this.staffDetailedView=false;
        this.awardsFlag=false;
        //this.clearPeformFields();
        refreshApex();
    }     
   
    updateLibraryGoalOptions() {
        this.libraryGoal = '';  // Clear previous selection
                
        console.log('levelId in update library goal:' + this.levelId);
        console.log('orgid in update library goal:' + this.orgid);
        console.log('staffRole in update library goal:' + this.staffRole);
        // Assuming you fetch the library goal list based on levelId
        getLibraryGoals({ levelId: this.levelId, staffRole: this.staffRole, orgid: this.orgid})
            .then((result) => {
                console.log('RESULT in updateLibraryGoalOptions: ', JSON.stringify(result));
                // Map the result to library goal options
                this.libraryGoalOptions = result.map(goal => ({
                    label: goal.Name, 
                    value: goal.Id   
                }));
                this.libraryGoalId = '';
                console.log('libraryGoalOptions in updateLibraryGoalOptions: ', JSON.stringify(this.libraryGoalOptions));
            })
            .catch((error) => {
                console.error('Error fetching Library Goal options:', error);
                this.libraryGoalOptions = [];
                this.libraryGoal = ''; // Clear the selection in case of error
                this.libraryGoalId = '';  // Clear the ID
            });
    }
   

    handlePriorityChange(event){
        this.isPrivate=event.target.checked; 
    }
    handleMidYearReviewChange(event){
        this.isMidYearReviewRequired=event.target.value; 
        console.log('isMidYearReviewRequired >> ' + this.isMidYearReviewRequired);
    }

    handleChangePerform(event) {
        
        const fieldName = event.target.fieldName;
        const fieldValue = event.target.value;

        const isValid = event.target.reportValidity();
        this.fieldErrorMap[fieldName] = !isValid;
        console.log('valid',isValid);
        if (!isValid) {
            return;
        }

        switch (fieldName) {
            case 'Review_Period_From__c':
                this.reviewFromDate = fieldValue;
                console.log('reviewrdate :'+this.reviewFromDate);
                break;
            case 'Review_Period_To__c':
                this.reviewToDate = fieldValue;
                break;
            default:
                break;
        }
        this.validateReviewPeriodDates();
    }
    handleChange(event) {
        // Get the name of the field that triggered the change
        const fieldName = event.target.name;
        const fieldValue = event.target.value;

        const isValid = event.target.reportValidity();
        this.fieldErrorMap[fieldName] = !isValid;
        console.log('valid',isValid);
        if (!isValid) {
            return;
        }
    
        switch (fieldName) {
            case 'goalName':
                this.goalName = fieldValue;
                console.log('goal name ' + this.goalName);
                break;
            case 'startDate':
                this.startDate = fieldValue;
                console.log('goal startDate ' + this.startDate);
                break;
            case 'endDate':
                this.endDate = fieldValue;
                break;
            case 'targetDate':
                this.targetDate = fieldValue;
                break;
            case 'priority':
                this.priority = fieldValue;
                break;
            case 'goalActualWeightage':
                this.goalActualWeightage = fieldValue;
                break;
            case 'relatedLink':
                this.relatedLink = fieldValue;
                break;
            case 'description':
                this.description = fieldValue;
                break;
            case 'successCriteria':
                this.successCriteria = fieldValue;
                break;
            case 'conversationNotes':
                this.conversationNotes = fieldValue;
                break;
            case 'midYearReviewDate':
                this.midYearReviewDate = fieldValue;
                break;
            case 'goalSettingMeeting':
                this.goalSettingMeeting = fieldValue;
                break;
            default:
                break;
        }
            this.validateDates();
    }

    validateDates() {
        let goalStartDate = new Date(this.startDate);
        let goalEndDate = new Date(this.endDate);
        let goalTargetDate = new Date(this.targetDate);
        let today = new Date();
        
        // Strip time (set to midnight) to compare only the date part
        goalStartDate.setHours(0, 0, 0, 0);
        goalEndDate.setHours(0, 0, 0, 0);
        goalTargetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        //Check startDate, endDate, and targetDate validity
        if (goalStartDate && (goalStartDate < today)) {
            this.dateErrorMessageStart = 'The Start date cannot be earlier than Today.';
        } else {
            this.dateErrorMessageStart = '';
        }

        if (this.endDate &&  (goalEndDate < goalStartDate)) {
            this.dateErrorMessageEnd = 'The End date cannot precede the Start date.';
        } else {
            this.dateErrorMessageEnd = '';
        }

        if (goalTargetDate && (goalTargetDate < goalStartDate) || (goalTargetDate >= goalEndDate)) {
            this.dateErrorMessageTarget = 'Target Date must be between Start Date and End Date.';
        } else {
            this.dateErrorMessageTarget = '';
        }
    }
    validateReviewPeriodDates() {
        let reviewDateFrom = new Date(this.reviewFromDate);
        let reviewDateTo = new Date(this.reviewToDate);
        let today = new Date();
        
        // Strip time (set to midnight) to compare only the date part
        reviewDateFrom.setHours(0, 0, 0, 0);
        reviewDateTo.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (reviewDateFrom && (reviewDateFrom < today)) {
            //console.log('Review Date: ' + reviewDateFrom);
            //console.log('Today Date: ' + today);
            this.dateErrorMessageFrom = 'The Review Period From cannot be earlier than today.';
            //console.log('dateErrorMessageFrom :'+this.dateErrorMessageFrom);
        } else {
            this.dateErrorMessageFrom = '';
        }

        if (reviewDateTo && (reviewDateTo < reviewDateFrom)) {
            this.dateErrorMessageTo = 'The Review Period To cannot precede the Review Period From.';
        } else {
            this.dateErrorMessageTo = '';
        }
    }
    isRequiredFieldsEmpty() {
        return !this.goalName || !this.startDate || !this.endDate || !this.targetDate || !this.priority || !this.libraryGoalId;
    }

    isInvalidDateFields() {
       // return this.dateErrorMessageStart || this.dateErrorMessageEnd || this.dateErrorMessageTarget;
       return this.dateErrorMessageStart || this.dateErrorMessageEnd || this.dateErrorMessageTarget;
    }
    handleAddGoal() {
        // Validate required fields before adding goal
        if (this.isRequiredFieldsEmpty()) {
            this.showToast('Error','Please fill in all required fields.','Error');
            return;
        }

        // Validate date fields for Review Period and Goal Period
        if (this.isInvalidDateFields()) {
            this.showToast('Error','Please correct the date errors.','Error');
            return; // Don't proceed if there are any date errors
        }
            let formatStartDateList=this.startDate.split('-');
            let formatEndDateList=this.endDate.split('-');
            let formatTargetDateList=this.targetDate.split('-');
           // let private=this.isPrivate 

        const goalData = {
            libraryGoalId: this.libraryGoalId,
            goalName: this.goalName,
            //isPrivate: this.isPrivate,
            isPrivate: this.isPrivate === true ? 'True' : 'False',
            isPrivateNew: this.isPrivate,
            startDate: this.formatDate(this.startDate),
            endDate: this.formatDate(this.endDate),
            targetDate: this.formatDate(this.targetDate),
            formatStartDate:formatStartDateList[2]+'/'+formatStartDateList[1]+'/'+formatStartDateList[0],
            formatEndDate:formatEndDateList[2]+'/'+formatEndDateList[1]+'/'+formatEndDateList[0],
            formatTargetDate:formatTargetDateList[2]+'/'+formatTargetDateList[1]+'/'+formatTargetDateList[0],
            priority: this.priority,
            goalActualWeightage: this.goalActualWeightage,
            relatedLink: this.relatedLink,
            description: this.description,
            successCriteria: this.successCriteria,
            conversationNotes: this.conversationNotes,
            key: Date.now()
        };

        // Validate weightage
        let newGoalWeightage = parseFloat(this.goalActualWeightage || 0);
        let totalWeightage = this.goals.reduce((acc, goal) => acc + parseFloat(goal.goalActualWeightage || 0), 0);

        if (totalWeightage + newGoalWeightage > 100) {
           // alert("Total Actual weightage of all goals should not exceed 100%");
           this.showToast('Error','Total Actual weightage of all goals should not exceed 100%.','Error');
            return;
        }

        // Add goal to the list
        this.goals = [...this.goals, goalData];
        this.clearGoalFields();
    }

    clearGoalFields() {
        this.libraryGoalId='';
        this.goalName = '';
        this.isPrivate = false;
        this.startDate = '';
        this.endDate = '';
        this.targetDate = '';
        this.priority = '';
        this.relatedLink = '';
        this.description = '';
        this.successCriteria = '';
        this.conversationNotes = '';
        this.goalActualWeightage = '';
    }

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label-new';
    }
    get ReviewPeriodFromClass() {
        return this.getFieldClass('Review_Period_From__c');
    }
     get ReviewPeriodToClass() {
        return this.getFieldClass('Review_Period_To__c');
    }
     get startDateClass() {
        return this.getFieldClass('startDate');
    }
     get endDateClass() {
        return this.getFieldClass('endDate');
    }
     get targetDateClass() {
        return this.getFieldClass('targetDate');
    }

    handleSuccessPerformance(event) {
        console.log('success called');
        this.goalNewForm = false; // Hide goal form after submission
        this.homeflag = true; 
        console.log('Form submitted successfully! Record ID:', event.detail.id);
        this.performanceGoalId = event.detail.id;

        // Show success toast
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Performance and Goals saved successfully.",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);

        // Prepare and save goals
        const goalDataList = this.goals.map(goal => ({
            libraryGoalId:goal.libraryGoalId,
            goalName: goal.goalName,
            isPrivateNew: goal.isPrivateNew,
            startDate: goal.startDate,
            endDate: goal.endDate,
            targetDate: goal.targetDate,
            priority: goal.priority,
            goalActualWeightage: goal.goalActualWeightage,
            relatedLink: goal.relatedLink,
            description: goal.description,
            successCriteria: goal.successCriteria,
            conversationNotes: goal.conversationNotes,
        }));

        insertPerformanceGoal({ performanceGoalId: this.performanceGoalId, goalDataList })
            .then(() => {
                console.log('Goals created successfully');
                refreshApex(this.wiredPerformanceRecordsResult);

                // Clear goals and hide form
                this.goals = [];
                this.goalNewForm = false; // Hide goal form
                this.homeflag = true;    // Navigate to home or parent view

                // Clear form fields
                this.clearPeformFields();
                // this.resetPerformanceForm();
            })
            .catch(error => {
                console.error('Error saving goals:', error);
            });
            refreshApex(this.wiredPerformanceRecordsResult); 
            refreshApex(this.wiredStaffList); 
            this.goalNewForm = false;
            this.clearPeformFields();
    }
   
    SubmitAll(event) {
        event.preventDefault(); // Prevent default form submission
        this.isDetailsVisible = true;
        // Validate if all goal fields are populated and total weightage equals 100
        const isGoalFieldsComplete = this.goals.every(goal => 
            goal.goalName && goal.startDate && goal.endDate && goal.targetDate && goal.priority && goal.goalActualWeightage
        );

        if (!isGoalFieldsComplete) {
            this.showErrorToast('Please fill in all goal fields before submitting.');
            return;
        }
        let newGoalWeightage = parseFloat(this.goalActualWeightage || 0);
        let totalWeightage = this.goals.reduce((acc, goal) => acc + parseFloat(goal.goalActualWeightage || 0), 0);
        if (this.goals.length === 0 || ((totalWeightage + newGoalWeightage) !== 100 )) {
            this.showErrorToast('Please add goals before submitting and The total actual weightage of all goals must equal 100%.');
            return;
        }        

        // Validate dates
        if (this.isInvalidDateFields() || this.dateErrorMessageTo || this.dateErrorMessageFrom) {
            this.showErrorToast('Please correct the date errors.');
            return;
        }

        // Check performance for staff
        this.checkPerformanceForStaff(this.selectedStaffId);
        if (this.isStaffDisabled) {
            this.showWarningToast('Performance record already exists for the selected staff.');
            return;
        }
        let staffEmail = this.staffEmail;
        let facility = this.facility;
        let staffRole = this.staffRole;
        let dateOfJoining = this.dateOfJoining;
        let reviewerEmail = this.reviewerEmail;
    
        // You can add these manually collected values to the fields object
        let fields = event.detail.fields;
        fields.Staff__c = this.selectedStaffId;
        fields.Reviewer__c = this.reviewerId;
        fields.Staff_Email__c = staffEmail;  // Manually adding disabled field value
        fields.Facility__c = facility;  // Manually adding disabled field value
        fields.Role__c = staffRole;  // Manually adding disabled field value
        fields.Date_Of_Joining__c = dateOfJoining;  // Manually adding disabled field value
        fields.Reviewer_Email__c = reviewerEmail;  // Manually adding disabled field value
    
        this.roleTooltipText = staffRole; 
        this.template.querySelector('lightning-record-edit-form[data-recrdform="performanceGoalForm"]').submit(fields);
        
        refreshApex(this.wiredPerformanceRecordsResult);
        refreshApex(this.wiredStaffList);
        this.clearPeformFields();
        this.goalNewForm = false;
        
    }
    clearPeformFields(){
        //this.staffId='';
        this.reviewerId='';
        this.reviewFromDate='';
        this.reviewToDate='';
        this.goalSettingMeeting='';
        this.isMidYearReviewRequired=false;
        this.staffEmail='';
        this.facility='';
        this.staffRole='';
        this.dateOfJoining='';
        this.levelId=''; 
        this.reviewerEmail= '';     
        this.dateErrorMessageFrom = '';
        this.dateErrorMessageTo = '';
        this.dateErrorMessageStart = '';
        this.dateErrorMessageEnd = '';
        this.selectedStaffId = '';
        refreshApex();

        this.clearGoalFields();
    }
    showErrorToast(message) {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error',
        });
        this.dispatchEvent(evt);
    }

     showWarningToast(message) {
        const evt = new ShowToastEvent({
            title: 'Warning!',
            message: message,
            variant: 'warning',
        });
        this.dispatchEvent(evt);
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
         if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        } 
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
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
        console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.filteredPerformanceData = tempconList;
    }
    
    // Pagination Refresh (e.g., when data is updated)
    paginationrefresh() {
        refreshApex(this.wiredPerformanceRecordsResult).then(() => {
            // Reset to the first page after data refresh
            this.pageNumber = 1;
            this.pageSize = this.pageSizeOptions[0]; // Set default page size
    
            // Reapply filters and refresh pagination
            this.applyFilters();
        }).catch(error => {
            console.error('Error refreshing data: ', error);
        });
    }
    handleSettingsClick(){
            //this.homeflag = false;
            this.addLibraryGoalFlag=true;
            this.goalNewForm= false;
           // this.headeringName = 'New Library Goal';
            this.staffId='';
            this.staffDetailedView=false;
            //this.performanceTableFlag=false;
    }
     handleClose(){
            this.addLibraryGoalFlag=false;
            this.homeflag = true; 
            this.goalNewForm=false; 
            this.goalNewTable= false;
            this.clearPeformFields();
            this.goals=[];
            refreshApex();                       
     }
     handleStaffClose(){
            this.staffDetailedView=false;
          
           // this.paginationrefresh();
            this.goalFlag=false;
            this.awardsFlag=false;
            this.homeflag = true;
           
    }
    
    handleStaffView(event){
         this.performanceId = event.currentTarget.dataset.id;
         console.log('performanceId 556677: '+ this.performanceId);
        
        this.staffDetailedView = true; 
            if (this.performanceId) {
                
                //refreshApex(this.wiredGoalsResult);
                this.goalFlag = true;
                //this.updateButtonVisibility();
                this.homeflag = false
            } else {
                console.error('No recordId available to display form');
            }   
    }
   
    handlePerformanceGoal(){
        this.goalFlag=true; 
        this.awardsFlag=false;
        //this.buttonVisible=true;
    }
    handlePerformanceAwards(){
         //refreshApex(this.wiredAwardResult);
         this.awardsFlag=true; 
         this.goalFlag=false; 
    }
    get selectedClassPerformanceGoals(){          
        return this.goalFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassPerformanceAwards(){          
        return this.awardsFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassPerformanceOverall(){          
        return this.overallflag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    
    updatePerformanceStatus(updatedGoals) {
        updatePerformanceStatus({ goalList: updatedGoals })
            .then(() => {
               // console.log('orgid 888: '+this.orgid);
                console.log('Performance status updated successfully.');
                //this.showSuccessToast('Performance status updated successfully.');
                refreshApex(this.wiredPerformanceRecordsResult);
            })
            .catch(error => {
                console.error('Error updating performance status:', error);
            });  
    }
    
    handleFinisConfirm(){
        this.finishConfirmFlag= true;
    }
    handleYesFinish(){
        console.log("Yes button clicked.");
       this.handleFinishGoal();
       this.finishConfirmFlag= false;
        // Store that the finish action has been confirmed in sessionStorage
       // sessionStorage.setItem('finishConfirmed', 'true');
        // Disable save and edit buttons after confirmation
       // this.isEditEnabled = false;
       // this.isSaveEnabled = false;
    }
    handleNoFinish(){
        this.finishConfirmFlag= false;
       this.staffDetailedView=true; 
    }
    
    inLineStaffEdit(goal) {
        const isStaffEmailMatching = this.userEmail === goal.Performance__r?.Staff_Email__c;
        const isFieldsEmpty = (goal.Staff_Comments__c === '' || goal.Staff_Comments__c == null) && 
                              (goal.Staff_Assigned_Weightage__c === '' || goal.Staff_Assigned_Weightage__c == null);
        
        return isStaffEmailMatching && isFieldsEmpty;  // Return true if both conditions are met
    }
    inLineReviewerEdit(goal) {
        const isReviewerEmailMatching = this.userEmail === goal.Performance__r?.Reviewer_Email__c;
        const isFieldsEmpty = (goal.Reviewer_Comments__c === '' || goal.Reviewer_Comments__c == null) && 
                              (goal.Reviewer_Assigned_Weightage__c === '' || goal.Reviewer_Assigned_Weightage__c == null);
        
        return isReviewerEmailMatching && isFieldsEmpty;  // Return true if both conditions are met
    }

    handleStaffField(event) {
        const goalId = event.target.dataset.id;  // Get the goal ID
        const fieldName = event.target.dataset.field;  // Get the field name (Staff_Comments__c or Staff_Assigned_Weightage__c)
        const updatedValue = event.target.value;  // Get the updated value
    
        // Find the goal in the local goal list based on the goal ID
        const goal = this.goalList.find(g => g.Id === goalId);
    
        if (goal) {
            // Update the corresponding field based on the field name
            if (fieldName === 'Staff_Comments__c') {
                goal.Staff_Comments__c = updatedValue;
            } else if (fieldName === 'Staff_Assigned_Weightage__c') {
                goal.Staff_Assigned_Weightage__c = updatedValue;
            }
        }
    }
    handleReviewerField(event) {
        const goalId = event.target.dataset.id;  // Get the goal ID
        const fieldName = event.target.dataset.field;  // Get the field name (Staff_Comments__c or Staff_Assigned_Weightage__c)
        const updatedValue = event.target.value;  // Get the updated value
    
        // Find the goal in the local goal list based on the goal ID
        const goal = this.goalList.find(g => g.Id === goalId);
    
        if (goal) {
            // Update the corresponding field based on the field name
            if (fieldName === 'Reviewer_Comments__c') {
                goal.Reviewer_Comments__c = updatedValue;
            } else if (fieldName === 'Reviewer_Assigned_Weightage__c') {
                goal.Reviewer_Assigned_Weightage__c = updatedValue;
            }
        }
    }
    get editIconClass() {
        return this.isEditEnabled ? 'enabled-icon' : 'disabled-icon';
    }
    get saveIconClass() {
        return this.isSaveEnabled ? 'enabled-icon' : 'disabled-icon';
    }
    handleSaveGoal(event) {
       
        const goalId = event.target.dataset.id; // Get the goal Id from the clicked save icon
        const goalToSave = this.goalList.find(goal => goal.Id === goalId);
        //console.log('save clicked ');
        if (goalToSave) {
            if (goalToSave.Staff_Assigned_Weightage__c > goalToSave.Actual_Weightage_of_the_Goal__c) {
                this.showToast('Error', 'Staff weightage cannot be more than the actual weightage.', 'Error');
                return; // Exit if validation fails
            }
    
            if (goalToSave.Reviewer_Assigned_Weightage__c > goalToSave.Actual_Weightage_of_the_Goal__c) {
                this.showToast('Error', 'Reviewer weightage cannot be more than the actual weightage.', 'Error');
                return; // Exit if validation fails
            }
           
            //console.log('performance status in save : ' +this.performanceStatus);
            const updatedGoals = [goalToSave]; // Update only the clicked goal
    
            // Call Apex to update the goal
            updateGoalData({ goalList: updatedGoals })
                .then(() => {
                   // console.log('Goal successfully updated:', JSON.stringify(goalToSave));
    
                    // Make fields read-only after saving
                    if ((goalToSave.Staff_Comments__c || goalToSave.Staff_Assigned_Weightage__c) && goalToSave.isEditable) {

                        console.log('save clicked at Staff');
                        //console.log('goalToSave.Staff_Comments__c:',goalToSave.Staff_Comments__c);
                        //console.log('goalToSave.Performance__r.Status__c:',goalToSave.Performance__r.Status__c);
                        goalToSave.isEditable = false; // Staff fields read-only
                        this.isEditEnabled =true; 
                    }
                    if ((goalToSave.Reviewer_Comments__c || goalToSave.Reviewer_Assigned_Weightage__c) && goalToSave.isReviewerEditable) {
                       // console.log('save clicked at Reviewer');
                      
                        goalToSave.isReviewerEditable = false; // Reviewer fields read-only
                        this.isEditEnabled =true; 
                    }
                })
                .catch(error => {
                    console.error('Error saving goal:', error);
                });
                //this.isEditEnabled =true;
        }
       
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,  // success, error, info, warning
            mode: 'dismissable' // You can also use 'pester' or 'sticky'
        });
        this.dispatchEvent(evt);
    }
    handleEditGoal(event) {
        if (!this.isEditEnabled) {
           // console.log('Editing is disabled');
            return; // Prevent action when editing is disabled
        }
    
       // console.log('isEditEnabled:', this.isEditEnabled);
       let isStaffEmailMatching = false;
       let isReviewerEmailMatching = false;

       this.goalList.forEach(goal => {
           // Check if the user's email matches either the staff or reviewer email
           isStaffEmailMatching = this.userEmail === goal.Performance__r?.Staff_Email__c;
           isReviewerEmailMatching = this.userEmail === goal.Performance__r?.Reviewer_Email__c;
       });
      // console.log('isStaffEmailMatching in edit: ' + isStaffEmailMatching);
      // console.log('isReviewerEmailMatching in edit: ' + isReviewerEmailMatching);
        const goalId = event.target.dataset.id;
        const goalToEdit = this.goalList.find(goal => goal.Id === goalId);
    
        if (goalToEdit) {
            const isStaffFieldsSaved = goalToEdit.Staff_Comments__c || goalToEdit.Staff_Assigned_Weightage__c;
            const isReviewerFieldsSaved = goalToEdit.Reviewer_Comments__c || goalToEdit.Reviewer_Assigned_Weightage__c;
    
            // Enable editing of the respective fields
            if (isStaffFieldsSaved && isStaffEmailMatching) {
                goalToEdit.isEditable = true;
                goalToEdit.isReviewerEditable = false;  // Prevent editing reviewer fields
            }
    
            if (isReviewerFieldsSaved && isReviewerEmailMatching ) {
                goalToEdit.isEditable = false;  // Prevent editing staff fields
                goalToEdit.isReviewerEditable = true;
            }
        }
    }
   
    handleFinishGoal() {
        let validationFailed = false; // Flag to track if any validation failed
    
        // Loop through the goals to perform validation
        this.goalList.forEach(goal => {
            if ((goal.Staff_Comments__c || goal.Staff_Assigned_Weightage__c) && goal.isEditable !== false) {
                console.log('finish clicked at Staff');
                if (goal.Staff_Assigned_Weightage__c > goal.Actual_Weightage_of_the_Goal__c) {
                    this.showToast('Error', 'Staff weightage cannot be more than the actual weightage.', 'Error');
                    validationFailed = true; // Mark as failed if validation error occurs
                    return; // Exit the loop if validation fails
                }
                goal.isEditable = false;
            } else if ((goal.Reviewer_Comments__c || goal.Reviewer_Assigned_Weightage__c) && goal.isReviewerEditable !== false) {
                console.log('finish clicked at Reviewer');
                if (goal.Reviewer_Assigned_Weightage__c > goal.Actual_Weightage_of_the_Goal__c) {
                    this.showToast('Error', 'Reviewer weightage cannot be more than the actual weightage.', 'Error');
                    validationFailed = true; // Mark as failed if validation error occurs
                    return; // Exit the loop if validation fails
                }
                goal.isReviewerEditable = false;
            }
        });
    
        if (validationFailed) {
            console.log('Validation failed, finish action aborted.');
            return; // Exit the function if validation failed and prevent updates
        }
    
        // If validation passed, proceed with updating the goals
        const updatedGoals = this.goalList.filter(goal => 
            goal.Staff_Comments__c || goal.Staff_Assigned_Weightage__c || goal.Reviewer_Comments__c || goal.Reviewer_Assigned_Weightage__c
        );
    
        console.log('updated goals in finish : ' + updatedGoals.length);
    
        if (updatedGoals.length >= 0) {
            updateGoalData({ goalList: updatedGoals })
                .then(result => {
                    console.log('Successfully updated goals:', result);
    
                    // Check for incomplete goals
                    const incompleteStaffGoals = this.goalList.filter(goal => !goal.Staff_Comments__c || !goal.Staff_Assigned_Weightage__c);
                    const incompleteReviewerGoals = this.goalList.filter(goal => !goal.Reviewer_Comments__c || !goal.Reviewer_Assigned_Weightage__c);
                    
                    // Check email matching for Staff and Reviewer
                    let isStaffEmailMatching = false;
                    let isReviewerEmailMatching = false;
    
                    this.goalList.forEach(goal => {
                        // Check if the user's email matches either the staff or reviewer email
                        isStaffEmailMatching = this.userEmail === goal.Performance__r?.Staff_Email__c;
                        isReviewerEmailMatching = this.userEmail === goal.Performance__r?.Reviewer_Email__c;
                    });
    
                   // console.log('isStaffEmailMatching: ' + isStaffEmailMatching);
                   //  console.log('isReviewerEmailMatching: ' + isReviewerEmailMatching);
                   // console.log('incompleteStaffGoals in finish : ' + incompleteStaffGoals.length);
                    // Check for incomplete goals and email matching
                    if (incompleteStaffGoals.length > 0 && isStaffEmailMatching) {
                        this.showToast('Error', 'Staff fields must be filled before finishing.', 'Error');
                      //  console.log('Incomplete staff goals found, finish action aborted.');
                    
                        // Enable "Save" and "Edit" buttons if incomplete staff goals found
                        return; // Exit if incomplete staff goals
                    } else if (incompleteReviewerGoals.length > 0 && isReviewerEmailMatching) {
                        this.showToast('Error', 'Reviewer fields must be filled before finishing.', 'Error');
                      //  console.log('Incomplete reviewer goals found, finish action aborted.');
    
                        // Enable "Save" and "Edit" buttons if incomplete reviewer goals found
                        return; // Exit if incomplete reviewer goals
                    } else {
                       
                        // Proceed with status update and disable buttons
                        this.buttonVisible = false;
                        this.isEditEnabled = false;
                        this.isSaveEnabled = false;
                        this.updatePerformanceStatus(updatedGoals);
                      //  console.log('performanceId in finish : '+this.performanceId);
                        this.updatePerformanceOutcome();
                    }
    
                    // Success - Toast message and goal update success
                    const toastEvent = new ShowToastEvent({
                        title: "Success",
                        message: "Comments and Weightage successfully submitted",
                        variant: "success"
                    });
                    this.dispatchEvent(toastEvent);
                })
                .catch(error => {
                    console.error('Error updating goals:', error);
                });
        }
    }
    
    handleSearchChange(event) {
        this.searchStaff = event.target.value;
        clearTimeout(this.timeout); // Clear the previous timeout
        this.timeout = setTimeout(() => {
            this.applyFilters(); // Apply filters after delay
        }, 1000);
    }

    // Handle keyup for search (Optional: Trigger search on Enter key)
    handleKeyup(event) {
        if (event.key === 'Enter') {
            this.handleSearchChange(event); // Trigger search on Enter key
        }
    }

   
    handleDeleteGoal(event) {
        // Get the unique key from the clicked delete icon
        const goalKey = event.currentTarget.dataset.key;
    
        console.log('Deleting goal with key:', goalKey);
    
        // Filter out the goal with the matching key
        this.goals = this.goals.filter(goal => goal.key !== parseInt(goalKey, 10));
    
       // console.log('Updated goals array after deletion:', this.goals);
        this.clearGoalFields();
    }
   
    toggleDetails() {
        this.isDetailsVisible = !this.isDetailsVisible; // Toggle the visibility state
    }

    get showHideLink() {
        return this.isDetailsVisible ? 'Hide Details' : 'Show Details'; // Update the link text dynamically
    }
    get helpTextContent() {
        return this.isDetailsVisible
            ? 'Hides Staff and Reviewer details'
            : 'Shows Staff and Reviewer details';
    }
    togglePopover() {
        this.isPopoverVisible = !this.isPopoverVisible;
    }
    closePopover() {
        this.isPopoverVisible = false;
    }
    handleCheckBoxChange(event) {
        const selectedValues = event.detail.value;
       // console.log('Selected Values:', JSON.stringify(selectedValues));
        if (event.target.name === 'progress') {
            // Update chosen roles with selected values from the checkbox group
            this.chosenRole = [...selectedValues];
        } else if (event.target.name === 'months') {
            // Update selected months with selected values from the checkbox group
            this.monthValue = [...selectedValues];
        }
        localStorage.setItem('filterRoles', JSON.stringify(this.chosenRole));
        localStorage.setItem('filterMonths', JSON.stringify(this.monthValue));
       
       // console.log('Selected Roles:', JSON.stringify(this.chosenRole));
       // console.log('Selected Months:', JSON.stringify(this.monthValue));

        // Apply the filter based on selected role and month
        this.applyFilters();
    }

    applyFilters() {
        // if (this.myprofile) {
        //     this.userType='';
        //     this.userType= 'NDIS Staff';
        //     console.log('userType  in applyFilters for myprofile: '+this.userType);  
        // }
        console.log('performanceRecords IN applyFilters:', JSON.stringify(this.performanceRecords));
        let filteredData = [...this.performanceRecords]; // Start with all records
        console.log('Data before applying filters:', JSON.stringify(filteredData));
        // Filter by selected year
       
        if (this.searchStaff) {
           // console.log('Filtering by search term:', this.searchStaff);
    
            // Create a case-insensitive regular expression from the search term
            const searchPattern = new RegExp(this.searchStaff.trim(), 'i'); // Make sure to trim the search term
           // console.log('Search Pattern:', searchPattern); // Debug the regular expression
    
            filteredData = filteredData.filter((performance) => {
                // Combine name and last name (ensure trimming any extra spaces)
                const fullName = `${performance.Staff__r?.Name ?? ''} ${performance.Staff__r?.Last_Name__c ?? ''}`.trim();
    
                //console.log('Full name after search filter:', fullName); // Debug the full name
    
                // Perform case-insensitive matching
                return searchPattern.test(fullName);
            });
        }
       
         if (this.chosenRole.length > 0) {
            //console.log('chosen role');
            console.log('filterdata in chosenrole:', JSON.stringify(filteredData));
            filteredData = filteredData.filter(record =>
                this.chosenRole.some(role => record.staffRole && record.staffRole.includes(role))
            );
        } 
       
        if (this.monthValue.length > 0) {
            filteredData = filteredData.filter(record => {
                if (!record.formattedReviewFrom) return false; // Ensure the date exists
        
                // Convert "DD/MM/YYYY" string to a proper Date object
                const dateParts = record.formattedReviewFrom.split('/');
                const reviewFromMonth = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`).getMonth(); // YYYY-MM-DD format
        
                return this.monthValue.some(month => {
                    switch (month) { 
                        case 'Jan-Mar':
                            return (reviewFromMonth >= 0 && reviewFromMonth <= 2);
                        case 'Apr-Jun':
                            return (reviewFromMonth >= 3 && reviewFromMonth <= 5);
                        case 'Jul-Sep':
                            return (reviewFromMonth >= 6 && reviewFromMonth <= 8);
                        case 'Oct-Dec':
                            return (reviewFromMonth >= 9 && reviewFromMonth <= 11);
                        default:
                            return false;
                    }
                });
            });
        }
       
        if (this.selectedYear) {
            console.log('selectedYear');
            
            const startYear = parseInt(this.selectedYear.split('-')[0]);
            const endYear = parseInt(this.selectedYear.split('-')[1]);
            const startDate = new Date(startYear, 6, 1); // July 1st of the start year
            const endDate = new Date(endYear, 5, 30);   // June 30th of the end year
            filteredData = filteredData.filter((record) => {
                const reviewFromDate = new Date(record.Review_Period_From__c);
                const reviewToDate = new Date(record.Review_Period_To__c);
                return reviewFromDate >= startDate && reviewToDate <= endDate;
            });
        } 
        console.log('Filtered Data after applying all filters before pagination:', JSON.stringify(filteredData));

        // Update filtered data
        this.filteredPerformanceData=[];
        this.records= filteredData;
        console.log('Filtered Data after applying all filter in filteredPerformanceData:', JSON.stringify( this.filteredPerformanceData));
        this.totalRecords = filteredData.length;
        // Reset pagination to the first page whenever filters are applied
        console.log(' this.totalRecords  in applyFilters :'+ this.totalRecords);
        this.pageNumber = 1;
        this.paginationVisible=false;
        if(this.totalRecords>0){
            this.paginationVisible=true;
            console.log(' this.paginationVisible  in applyFilters :'+ this.paginationVisible);
        }
        // After applying filters, run pagination
        this.paginationHelper();
    }
    updatePerformanceOutcome() {
        console.log('updatePerformanceOutcome CALLED');
        console.log('performanceId in updatePerformanceOutcome : '+this.performanceId);
        // Call the Apex method to update the performance outcome
        updatePerformanceOutcome({ performanceId: this.performanceId })
            .then(result => {
                console.log('Performance outcome updated successfully:', result);
            })
            .catch(error => {
                console.error('Error updating performance outcome:', error);
                // Handle error here (optional)
            });
    }
    
}