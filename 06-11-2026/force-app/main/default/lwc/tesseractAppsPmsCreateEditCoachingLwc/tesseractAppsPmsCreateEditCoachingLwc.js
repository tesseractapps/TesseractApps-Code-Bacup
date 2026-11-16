import { LightningElement, wire, api, track } from "lwc";
import saveCoachingData from '@salesforce/apex/PmsManagerTemplateController.saveCoachingData';
import getCoachingSessionDetails from '@salesforce/apex/PmsManagerTemplateController.getCoachingSessionDetails';
import changeRequestCoaching from '@salesforce/apex/PmsManagerTemplateController.changeRequestCoaching';
import getManagersAndHrByFacility from '@salesforce/apex/PmsManagerTemplateController.getManagersAndHrByFacility';
import createOrUpdateManagerCoaching from '@salesforce/apex/PmsManagerTemplateController.createOrUpdateManagerCoaching';
import getStaffsByOrg from '@salesforce/apex/PmsController.getStaffsByOrg';
import fetchBulkRoles from '@salesforce/apex/FacilityController.fetchBulkRoles';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class TesseractAppsPmsCreateEditCoachingLwc extends LightningElement {

    @track isHome = true;
    @api coachingId;
    @api staffId;
    @api hrId;
    @api hrName;
    // @api coachingCreatedtype;
    @api isManager;
    @api isStaff;
    @api isHr;
    @api viewMode;
    @api createMode;
    @api isManagerCreated;
    @api isHrCreated;
    @track staffName = '';
    @track staffEmail = '';
    @track staffRole = '';
    @track staffManager = '';
    @track hrContact = '';
    @track templateCriteria = '';
    @track staffProfileUrl = '';
    @track reviewDate = '';
    //@track coachingId = '';
    @track coachingCreatedtype = '';

    @track coachingTitle;
    @track description;
    @track meetingDate;
    @track location;
    @track meetingType;
    @track discussionSummary;
    @track outcomeAgreements;
    @track promotion = false;
    @track pip = false;
    @track improvement = false;
    @track additionalDetails;
    @track isDisabledAcknowledgementContainer = false;
   // @track disableEmployeeComments = false;
    @track employeeComment;
    //@track disableEmployeeComments;
    @track isAcknowledged = false;
   // @track empAcknowledged = false;
    @track managerComments = '';
    @track hrComments = '';
    @track isCreatedByManager=false;
   // @track hasConfirmedAcknowledgement= false;
    @track hrAcknowledgementDate;
   // @track employeeAcknowledgementDate;
    //@track acknowledgementDate;
    @track managerProfileUrl;

    @track coachingType = '';
    @track employeeList = [];
    @track managerList = [];
    @track hrList = [];
    @track selectedFacilityId;
    @track selectedFacilityName = '';
    @track roleOptions = [];
    @track selectedRolesInApply=[];
    @track staffCoachingData = [];
    @track managerFinalized=false;
    @track hrSubmitted=false;
    @track confidentialNotes;
    @track hrConfidentialNotes;
    @track isScheduleCoaching = false;
    @track isCreatedByHr = false;

    @track meetingTimeSelectedHour = '';
    @track meetingTimeSelectedMinute = '';
    @track meetingTimeAMPM = true; // true = AM, false = PM
    @track meetingTime = '';
    @track meetingUiTime = '';
    @track disableTimeButton = false;
    //@track strengthsList = [];
    // @track developmentList = [{ id: 1, value: '', isLast: true , showDelete: false} ];
    // @track supportList = [{ id: 1, value: '', isLast: true ,showDelete: false} ];
    // @track strengthsList = [{ id: 1, value: '', isLast: true , showDelete: false} ];
    @track developmentList = [{ id: 1, value: '', isLast: true} ];
    @track supportList = [{ id: 1, value: '', isLast: true} ];
    @track strengthsList = [{ id: 1, value: '', isLast: true} ];
    @track meetingTypeOptions = [
        { label: "Office", value: "Office" },
        { label: "Virtual", value: "Virtual" },
        { label: "Hybrid", value: "Hybrid" }
    ];
    @track coachingCreatedBy;
    @track coachingLastUpdatedBy;

    // @track coachingTypeOptions = [
    //     { label: "Individual Employee", value: "Individual Employee" },
    //     { label: "Groups - Multiple Employees", value: "Groups - Multiple Employees" },
    //     { label: "Managers and HRs Coaching", value: "Managers and HRs Coaching" },
    //     { label: "Managers Only coaching", value: "Managers Only coaching" }
    // ];

 
    // get isDisabled() {
    //     return this.isDisabledAcknowledgementContainer;
    // }
    get hasConfirmedAcknowledgement() {

        if (this.isStaff) {
            return this.currentStaffSession?.employeeAcknowledgementDate || false;
        }

        if (this.isManager) {
            return this.currentStaffSession?.managerAcknowledgementDate || false;
        }

        if (this.isHr) {
            return this.hrAcknowledged || false;
        }

        return false;
    }
    get showChangeRequestButton() {

        const staffAck = this.currentStaffSession?.employeeAcknowledgementDate;

        if (this.isManager) {
        return staffAck && !this.isAcknowledged;
        }

        if (this.isHr) {
            return staffAck && !this.isAcknowledged;
        }

        return false;
    }
    get employeeAcknowledgedStatus() {
        const staffAck = this.currentStaffSession?.empAcknowledged;
        const date = this.currentStaffSession?.employeeAcknowledgementDate;

        if (staffAck && date) {
            return 'Employee Acknowledged';
        }
        return '';
    }
    get isAcknowledgementDisabled() {

        if (this.isStaff) {
            return this.hasConfirmedAcknowledgement;
        }

       // return  !this.isAllStaffAcknowledged; 
       if (this.isManager) {
            return !this.isAllStaffAcknowledged;
        }

        // HR → ONLY after manager finalized
        if (this.isHr) {
            return !this.managerFinalized;
        }

        return true;
    }

    get isConfirmAcknowledged() {

        if (this.hasConfirmedAcknowledgement) {
            return true;
        }

        if (this.isManager || this.isHr) {
            return this.isDisabledAcknowledgementContainer || !this.isAcknowledged;
        }

        if (this.isStaff) {
            return false;
        }

        return true;
    }
    get currentStaffSession() {
        console.log(' currentStaffSession getter called');


        if (!this.staffSessions || this.staffSessions.length === 0) {
            console.log(' No staffSessions');
            return null;
        }
        console.log(' staffSessions:', JSON.stringify(this.staffSessions));
        console.log(' staffId:', this.staffId);
        if (this.staffId) {
            return this.staffSessions.find(s => s.staffId === this.staffId);
        }

        // Fallback → single staff case
        if (this.staffSessions.length === 1) {
            return this.staffSessions[0];
        }

        return null;
    }
    get staffCommentForAck() {
        return this.currentStaffSession?.employeeComment || '';
    }
    // get staffAcknowledged() {
    //     return this.currentStaffSession
    //         ? this.currentStaffSession.empAcknowledged
    //         : false;
    // }
    get staffAcknowledged() {

        console.log('👉 staffAcknowledged getter called');

        console.log('currentStaffSession:', JSON.stringify(this.currentStaffSession));

        const value = this.currentStaffSession
            ? this.currentStaffSession.empAcknowledged
            : false;

        console.log('👉 empAcknowledged value from getter:', value);

        return value;
    }
    get staffAcknowledgementDate() {
        return this.currentStaffSession?.employeeAcknowledgementDate || '';
    }
    get acknowledgementDate() {
        return this.currentStaffSession?.managerAcknowledgementDate || '';
    }
    get isAllStaffAcknowledged() {
        return (this.staffSessions || []).length > 0 &&
            this.staffSessions.every(s => s.employeeAcknowledgementDate);
    }
    get showConfidentialNotes() {
        return this.isManager || this.isHr;
    }
    get isPipDisabled() {
        return this.promotion || this.improvement;
    }

    get isPromotionDisabled() {
        return this.pip;
    }

    get isImprovementDisabled() {
        return this.pip;
    }

    // get isFinalizeDisabled() {

    //      if (this.isManager && this.managerFinalized) {
    //         return true;
    //     }
    //      if (this.isHr && this.hrSubmitted) {
    //         return true;
    //     }

    //     if (this.isManager) {
    //         return !(this.managerComments && this.managerComments.trim() !== '' && this.isAcknowledged);
    //     }

    //     if (this.isHr) {
    //         return !(this.hrComments && this.hrComments.trim() !== '' && this.isAcknowledged);
    //     }

    //     return true;
    // }
    get isFinalizeDisabled() {

        // ================= MANAGER =================
        if (this.isManager) {

            // Already finalized → always disabled
            if (this.managerFinalized) {
                return true;
            }

            const hasComments = this.managerComments && this.managerComments.trim() !== '';
            const hasAck = this.isAcknowledged;
            const hasAckDate = !!this.currentStaffSession?.managerAcknowledgementDate;

            // Enable only if ALL true
            return !(hasComments && hasAck && hasAckDate);
        }

        // ================= HR =================
        if (this.isHr) {

            // Already submitted → always disabled
            if (this.hrSubmitted) {
                return true;
            }

            const hasComments = this.hrComments && this.hrComments.trim() !== '';
            const hasAck = this.isAcknowledged;
            const hasAckDate = !!this.hrAcknowledgementDate;

            // Enable only if ALL true
            return !(hasComments && hasAck && hasAckDate);
        }

        return true;
    }



    get isEditMode() {
        return !this.createMode && !this.viewMode;
    }
    // get isAcknowledgementDisabled() {
    //     return this.isDisabled || this.hasConfirmedAcknowledgement;
    // }
   
  
    get finalizeLabel() {

        if (this.isHr) {
            return 'Submit';
        }

        return 'Finalise to HR';
    }
    // get showEditButton() {
    //     return this.isManager && !this.isAcknowledged;
    // }
    get showEditButton() {
        return this.isManager && !this.currentStaffSession?.managerAcknowledgementDate;
    }

    // get showChangeRequestButton() {

    //     // Manager → after staff acknowledged
    //     if (this.isManager) {
    //        return this.empAcknowledged && !this.isAcknowledged;
    //     }

    //     // HR → after manager acknowledged
    //     if (this.isHr) {
    //        // return this.isAcknowledged;
    //         return this.empAcknowledged && !this.isAcknowledged;
    //     }

    //     return false;
    // }
    // get employeeAcknowledgedStatus() {
    //     if (this.empAcknowledged && this.employeeAcknowledgementDate) {
    //         return 'Employee Acknowledged';
    //     }
    //     return '';
    // }

    get managerAcknowledgedStatus() {
        if (this.isAcknowledged && this.acknowledgementDate) {
            return 'Manager Acknowledged';
        }
        return '';
    }


    get isIndividual() {
        return this.coachingType === 'Individual Employee';
    }

    get isGroup() {
        return this.coachingType === 'Groups - Multiple Employees';
    }

    get isManagerHr() {
        return this.coachingType === 'Managers and HRs Coaching';
    }

    get isManagersOnly() {
        return this.coachingType === 'Managers Only Coaching';
    }
    get isHrsOnly() {
        return this.coachingType === 'HRs Only Coaching';
    }
    get showStaffMangerHRList() {
        return (
            (this.employeeList && this.employeeList.length > 0) ||
            (this.managerList && this.managerList.length > 0) ||
            (this.hrList && this.hrList.length > 0)
        );
    }
   
    // get commentStaffList() {
    //     let selectedList = [];

    //     if (this.isIndividual || this.isGroup) {
    //         selectedList = (this.employeeList || []).filter(emp => emp.isSelected);
    //     }

        
    //     return selectedList;  //selectedList.slice(0, 4)
    // }
    // get commentStaffList() {

    //     return (this.staffSessions || []).map(s => ({

    //         id: s.staffId,
    //         name: s.staffName,
    //         staffType: s.staffType,

    //         comment: s.staffType === 'Staff'
    //             ? s.employeeComment
    //             : s.managerComment,

    //         commentLabel: this.getCommentLabel(s.staffType)

    //     }));
    // }
    get commentStaffList() {

        //  VIEW / EDIT MODE (existing records)
        if (this.staffSessions && this.staffSessions.length > 0) {

            return this.staffSessions.map(s => ({
                id: s.staffId,
                name: s.staffName,
                staffType: s.staffType,

                comment: s.staffType === 'Staff'
                    ? (s.employeeComment || '')
                    : (s.managerComment || ''),

                commentLabel: this.getCommentLabel(s.staffType)
            }));
        }

        //  CREATE MODE (Manager Created → no backend data yet)
        let list = [];

        // Employees
        if (this.employeeList) {
            list = [
                ...list,
                ...this.employeeList
                    .filter(e => e.isSelected)
                    .map(e => ({
                        id: e.id,
                        name: e.name,
                        staffType: 'Staff',
                        comment: '',
                        commentLabel: 'Employee Comments'
                    }))
            ];
        }

        // Managers
        if (this.managerList) {
            list = [
                ...list,
                ...this.managerList
                    .filter(m => m.isSelected)
                    .map(m => ({
                        id: m.id,
                        name: m.name,
                        staffType: 'Manager',
                        comment: '',
                        commentLabel: 'Manager Comments'
                    }))
            ];
        }

        // HR
        if (this.hrList) {
            list = [
                ...list,
                ...this.hrList
                    .filter(h => h.isSelected)
                    .map(h => ({
                        id: h.id,
                        name: h.name,
                        staffType: 'HR',
                        comment: '',
                        commentLabel: 'HR Comments'
                    }))
            ];
        }

        return list;
    }
    get showManagerCommentsSection() {

        if (!this.isManagerOrHrCreated) return false;

        if (!this.coachingType) return false;

        if (!this.selectedRolesInApply || this.selectedRolesInApply.length === 0) {
            return false;
        }

        if (!this.commentStaffList || this.commentStaffList.length === 0) {
            return false;
        }

        return true;
    }
    get employeeSessions() {
        return (this.staffSessions || []).filter(s => s.staffType === 'Staff');
    }

    get managerSessions() {
        return (this.staffSessions || []).filter(s => s.staffType === 'Manager');
    }

    get hrSessions() {
        return (this.staffSessions || []).filter(s => s.staffType === 'HR');
    }
   
    get acknowledgementContainerClass() {

        if (this.isStaff) {
            return this.hasConfirmedAcknowledgement
                ? 'slds-box disabled-box'
                : 'slds-box';
        }

        //  MANAGER / HR

        //  CASE 2 → NOT ALL STAFF ACK → FULL DISABLE
        if (!this.isAllStaffAcknowledged) {
            return 'slds-box disabled-box';
        }

        // CASE 1 → ALL STAFF ACK → ENABLE MANAGER/HR AREA
        return 'slds-box';
    }
   
    get isStaffCommentDisabled() {
        return !this.isStaff || this.hasConfirmedAcknowledgement;
    }

    get isManagerHrDisabled() {

        if (this.isStaff) return true;

        //  NOT ALL STAFF ACK → disable everything
        if (!this.isAllStaffAcknowledged) return true;

        if (this.isManager) {
            return !!this.currentStaffSession?.managerAcknowledgementDate;
        }

        //  disable if HR already acknowledged
        if (this.isHr) {
            if (!this.managerFinalized) {
                return true; 
            }

            return !!this.hrAcknowledgementDate;
        }

        //  ALL STAFF ACK → allow manager/hr
        return false;
    }
    // get isConfidentialDisabled() {
    //     return this.hrSubmitted; 
    // }
     get isConfidentialDisabled() {
        if(this.isHr && this.hrSubmitted){
            return true; 
        }
        if(this.isManager && this.managerFinalized){
            return true; 
        }
    }
    get isManagerOrHrCreated() {
        return this.isManagerCreated || this.isHrCreated;
    }
    get coachingTypeOptions() {
        return [
            { label: "Individual Employee", value: "Individual Employee" },
            { label: "Groups - Multiple Employees", value: "Groups - Multiple Employees" },
            { label: "Managers and HRs Coaching", value: "Managers and HRs Coaching" },
            this.isHrCreated
                ? { label: "HRs Only Coaching", value: "HRs Only Coaching" }
                : { label: "Managers Only Coaching", value: "Managers Only Coaching" }
        ];
    }
    
    getCommentLabel(staffType) {

        if (!staffType) return 'Employee Comments';

        if (staffType === 'Staff') return 'Employee Comments';
        if (staffType === 'Manager') return 'Manager Comments';
        if (staffType === 'HR') return 'HR Comments';

        return 'Comments';
    }
    connectedCallback() {
        console.log('connectedCallback in TesseractAppsPmsCreateEditCoachingLwc ');
        console.log('coachingId:', this.coachingId);
        console.log('staffid : ', this.staffId);
        console.log('isManager:', this.isManager);
        console.log('isStaff:', this.isStaff);
        console.log('isHr:', this.isHr);
        console.log('viewMode:', this.viewMode);
        console.log('createMode:', this.createMode);
        console.log('isManagerCreated:', this.isManagerCreated);
        console.log('isCreatedByManager:', this.isCreatedByManager);
        console.log('isHRcreated : ',this.isHrCreated);
        this.selectedFacilityId = localStorage.getItem("defaultFacilityId");
        console.log('selectedFacilityId: ' + this.selectedFacilityId);
        this.selectedFacilityName = localStorage.getItem("defaultFacilityLabel");
        console.log('selectedFacilityName : ',this.selectedFacilityName);
        if(this.isHr){
           
            console.log('hrId : ', this.hrId);
            console.log('hrName : ', this.hrName);
        }
      
        if (this.selectedFacilityId) {
            //this.loadStaffList();
            this.fetchFacilityRoles();
        } else {
            console.warn('No facility found in localStorage');
        }

        // console.log('staffName:', this.staffName);
        // console.log('staffEmail:', this.staffEmail);
        // console.log('staffRole:', this.staffRole);
        // console.log('staffManager:', this.staffManager);
        // console.log('hrContact:', this.hrContact);
        // console.log('templateCriteria:', this.templateCriteria);
        // console.log('staffProfileUrl:', this.staffProfileUrl);
        // console.log('reviewDate:', this.reviewDate);
        // console.log('coachingCreatedtype:', this.coachingCreatedtype);
        if (this.createMode) {
            this.initializeDefaultLists();
        }
        if (this.coachingId) {
           // this.initializeDefaultLists(); 
            this.loadCoachingData();
        }
        if (this.selectedFacilityId && this.coachingType && this.selectedRolesInApply && this.selectedRolesInApply.length > 0 ) {
            console.log('🚀 Loading staff...');
            // this.loadStaffList();
            // this.loadManagerList();
             if(this.coachingType === 'Individual Employee' || this.coachingType === 'Groups - Multiple Employees'){
                    console.log('🚀 Loading staff...');
                this.loadStaffList();
            } else if (this.coachingType === 'Managers and HRs Coaching' || this.coachingType === 'Managers Only Coaching' || this.coachingType === 'HRs Only Coaching'){
                    this.loadManagerList();
            }
        } 
        

    }
    initializeDefaultLists() {
        this.strengthsList = [{ id: Date.now(), value: '', isLast: true }];
        this.developmentList = [{ id: Date.now(), value: '', isLast: true }];
        this.supportList = [{ id: Date.now(), value: '', isLast: true }];
    }
    addStrength() {
        this.strengthsList = this.strengthsList.map(item => ({
            ...item,
            isLast: false,
           // showDelete: true
        }));

        this.strengthsList = [
            ...this.strengthsList,
            // { id: Date.now(), value: '', isLast: true, showDelete: true}
             { id: Date.now(), value: '', isLast: true}
        ];
    }

    addDevelopment() {
        this.developmentList = this.developmentList.map(item => ({
            ...item,
            isLast: false,
           // showDelete: true
        }));

        this.developmentList = [
            ...this.developmentList,
            // { id: Date.now(), value: '', isLast: true, showDelete: true }
            { id: Date.now(), value: '', isLast: true }
        ];
    }

    addSupport() {
        this.supportList = this.supportList.map(item => ({
            ...item,
            isLast: false,
           // showDelete: true
        }));

        this.supportList = [
            ...this.supportList,
            // { id: Date.now(), value: '', isLast: true , showDelete: true}
             { id: Date.now(), value: '', isLast: true }
        ];
    }

    //  handleChange(event) {
    //     const index = event.target.dataset.index;
    //     const value = event.target.value;
    //     const listName = event.target.name;

    //     this[listName] = this[listName].map((item, i) => {
    //         return i == index ? { ...item, value } : item;
    //     });
    // }
    
    handleChange(event) {

        const name = event.target.name;
        const value = event.target.value;
        const index = event.target.dataset.index;

        switch (name) {

            case 'coachingTitle':
                this.coachingTitle = value;
                break;

            case 'description':
                this.description = value;
                break;

            case 'meetingDate':
                this.meetingDate = value;
                break;

            case 'meetingTime':
                this.meetingTime = value;
                break;

            case 'location':
                this.location = value;
                break;

            case 'meetingType':
                this.meetingType = value;
                break;

            case 'discussionSummary':
                this.discussionSummary = value;
                break;

            case 'outcomeAgreements':
                this.outcomeAgreements = value;
                break;

            case 'confidentialNotes':
                this.confidentialNotes = value;
                break;

            case 'hrConfidentialNotes':
                this.hrConfidentialNotes = value;
                break;

            case 'additionalDetails':
                this.additionalDetails = value;
                break;

            // case 'comments':
            //     this.comments = value;
            //     break;
            case 'managerComments':
                this.managerComments = value;
                break;

            case 'hrComments':
                this.hrComments = value;
                break;

            case 'employeeComment':
                this.employeeComment = value;
                break;

            case 'strengthsList':
                this.strengthsList = this.strengthsList.map((item, i) => {
                    return i == index ? { ...item, value } : item;
                });
                break;

            case 'developmentList':
                this.developmentList = this.developmentList.map((item, i) => {
                    return i == index ? { ...item, value } : item;
                });
                break;

            case 'supportList':
                this.supportList = this.supportList.map((item, i) => {
                    return i == index ? { ...item, value } : item;
                });
                break;
            case 'coachingType':
                this.coachingType = value;
                //this.resetSelections();
                //this.loadStaffList(); 
                 if (this.selectedFacilityId && this.coachingType && this.selectedRolesInApply && this.selectedRolesInApply.length > 0 ) {
                    console.log(' this.coachingType : ', this.coachingType);
                    if(this.coachingType === 'Individual Employee' || this.coachingType === 'Groups - Multiple Employees'){
                         console.log('🚀 Loading staff...');
                        this.loadStaffList();
                    } else if (this.coachingType === 'Managers and HRs Coaching' || this.coachingType === 'Managers Only Coaching' || this.coachingType === 'HRs Only Coaching'){
                         this.loadManagerList();
                    }
                   
                }  
                break;

            default:
                console.warn('Unhandled change field:', name);
        }
      
        console.log(`Field Changed → ${name} :`, value);
    }
    handleCheckboxChange(event) {

        const name = event.target.name;
        const checked = event.target.checked;
        console.log(' Checkbox Change Triggered');
        console.log('name:', name);
        console.log('checked:', checked);
        console.log('staffId:', this.staffId);
        if (this.isStaff && name === 'staffAck') {

           // this.empAcknowledged = checked;

            this.staffSessions = this.staffSessions.map(s => {
                if (s.staffId === this.staffId) {
                    console.log(' Updating session:', s);
                    return { ...s, empAcknowledged: checked };
                }
                return s;
            });
             console.log(' Updated staffSessions:', JSON.stringify(this.staffSessions));
            return;
        }
        if (name === 'isAcknowledged') {
            this.isAcknowledged = checked;
            return;
        }

        switch (name) {

            case 'promotion':
                this.promotion = checked;
                if (this.promotion) {
                    this.pip = false;
                }
                break;

            case 'pip':
                this.pip = checked;
                if (this.pip) {
                    this.promotion = false;
                    this.improvement = false;
                }
                break;

            case 'improvement':
                this.improvement = checked;
                if (this.improvement) {
                    this.pip = false;
                }
                break;

            case 'isAcknowledged':
                this.isAcknowledged = checked;
                break;

            default:
                console.warn('Unhandled checkbox:', name);
        }
        console.log(`Checkbox Changed → ${name} :`, checked);

    }
    

    // handleDelete(event) {
    //     const index = event.currentTarget.dataset.index;
    //     const listName = event.currentTarget.dataset.list;

    //     let list = this[listName];

    //     // remove item using filter
    //     list = list.filter((item, i) => i != index);

    //     list = list.map((item, i, arr) => ({
    //         ...item,
    //         isLast: i === arr.length - 1,
    //         showDelete: arr.length > 1
    //     }));

    //     this[listName] = list;
    // }
    handleCancel() {
        console.log('Cancel clicked');

        this.isHome = false;
        const event = new CustomEvent('back');
        this.dispatchEvent(event);
    }
    handleCreateCoachingRc() {
        console.log('Create Coaching clicked');
        if (!this.coachingTitle || !this.meetingDate || !this.meetingTime || !this.meetingType ) {
            this.showToast('Error', 'Please fill all required fields.', 'error');
            return;
        }
        if (
            (this.promotion || this.pip || this.improvement) &&
            (!this.additionalDetails || this.additionalDetails.trim() === '')
        ) {
            this.showToast('Error', 'Please enter Additional Details in Advanced Recommendations.', 'error');
            return;
        }
        let coachingData = this.prepareCoachingData();
        let actions = this.prepareActions();

        console.log('Coaching Data:', JSON.stringify(coachingData));
        console.log('Actions:', JSON.stringify(actions));
        console.log('selectedFacilityId IN handleCreateCoachingRc', this.selectedFacilityId);
        saveCoachingData({
            facilityId: this.selectedFacilityId,
            coachingData: coachingData,
            actionList: actions
        })
        .then(() => {
            console.log('SUCCESS');
            this.showToast('Success', 'Coaching Session Saved Successfully', 'success');
            this.isHome = false;
            const event = new CustomEvent('back');
            this.dispatchEvent(event);
        })
        .catch(error => {
            console.error('ERROR:', error);
        });
    }
     handleUpdateCoaching() {
        console.log('Create Coaching clicked');
        if (!this.coachingTitle || !this.meetingDate || !this.meetingTime || !this.meetingType ) {
            this.showToast('Error', 'Please fill all required fields.', 'error');
            return;
        }
        // if(this.isCreatedByManager){
        //      if (!this.coachingType  || !this.coachingType || !this.selectedRolesInApply || this.selectedRolesInApply.length === 0 ) {
        //         this.showToast('Error', 'Please fill all required fields.', 'error');
        //         return;
        //     }
        // }
        if (
            (this.promotion || this.pip || this.improvement) &&
            (!this.additionalDetails || this.additionalDetails.trim() === '')
        ) {
            this.showToast('Error', 'Please enter Additional Details in Advanced Recommendations.', 'error');
            return;
        }
        let coachingData = this.prepareCoachingData();
        let actions = this.prepareActions();

        console.log('Coaching Data:', JSON.stringify(coachingData));
        console.log('Actions:', JSON.stringify(actions));
        console.log('selectedFacilityId IN handleCreateCoachingRc', this.selectedFacilityId);
        saveCoachingData({
            facilityId: this.selectedFacilityId,
            coachingData: coachingData,
            actionList: actions
        })
        .then(() => {
            console.log('SUCCESS');
            this.showToast('Success', 'Coaching Session Saved Successfully', 'success');
            this.isHome = false;
            const event = new CustomEvent('back');
            this.dispatchEvent(event);
        })
        .catch(error => {
            console.error('ERROR:', error);
        });
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

    // prepareCoachingData() {
    //     return {
    //         Id: this.coachingId,

    //         coachingTitle: this.coachingTitle || '',
    //         meetingDate: this.meetingDate || null,
    //         meetingTime: this.meetingTime || '',
    //         location: this.location || '',
    //         meetingType: this.meetingType || '',
    //         description: this.description || '',
    //         discussionSummary: this.discussionSummary || '',
    //         outcomeAgreements: this.outcomeAgreements || '',
    //        // confidentialNotes: this.confidentialNotes || '',
    //        // hrConfidentialNotes: this.hrConfidentialNotes || '',
    //         additionalDetails: this.additionalDetails || '',

    //         employeeComment: this.employeeComment || '',
    //         managerComments: this.managerComments || '',
    //         hrComments: this.hrComments || '',

    //         promotion: this.promotion || false,
    //         pip: this.pip || false,
    //         improvement: this.improvement || false
    //     };
    // }
    prepareCoachingData() {

        let data = {
            Id: this.coachingId,

            coachingTitle: this.coachingTitle || '',
            meetingDate: this.meetingDate || null,
            meetingTime: this.meetingTime || '',
            location: this.location || '',
            meetingType: this.meetingType || '',
            description: this.description || '',
            discussionSummary: this.discussionSummary || '',
            outcomeAgreements: this.outcomeAgreements || '',
            additionalDetails: this.additionalDetails || '',

            employeeComment: this.employeeComment || '',
            managerComments: this.managerComments || '',
            hrComments: this.hrComments || '',

            promotion: this.promotion || false,
            pip: this.pip || false,
            improvement: this.improvement || false
        };

        // ✅ ONLY MANAGER sends this
        if (this.isManager) {
            data.confidentialNotes = this.confidentialNotes || '';
        }

        // ✅ ONLY HR sends this
        if (this.isHr) {
            data.hrConfidentialNotes = this.hrConfidentialNotes || '';
        }

        return data;
    }
  
    prepareActions(){
         let actions = [];

        (this.strengthsList || []).forEach(item => {
            if (item && item.value && item.value.trim() !== '') {
                actions.push({
                    Id: (item.id && item.id.length === 18) ? item.id : '',
                    Action_Name__c: item.value.trim(),
                    Type__c: 'Strengths'
                });
            }
        });

        (this.developmentList || []).forEach(item => {
            if (item && item.value && item.value.trim() !== '') {
                actions.push({
                    Id: (item.id && item.id.length === 18) ? item.id : '',
                    Action_Name__c: item.value.trim(),
                    Type__c: 'Development Areas'
                });
            } 
        });

        (this.supportList || []).forEach(item => {
            if (item && item.value && item.value.trim() !== '') {
                actions.push({
                    // Id: item.id || null, 
                    Id: (item.id && item.id.length === 18) ? item.id : '',
                    Action_Name__c: item.value.trim(),
                    Type__c: 'Support & Resources'
                });
            }
        });
        return actions;
    }
   
    loadCoachingData() {
        getCoachingSessionDetails({ coachingId: this.coachingId })
            .then(result => {
                const session = result.session || {};
                const children = session.PMS_Staff_Coaching__r || [];

                
                // this.coachingCreatedBy = session.CreatedBy?.Name || '';
                // this.coachingLastUpdatedBy = session.LastModifiedBy?.Name || '';
                this.coachingCreatedBy = session.CreatedBy.Full_Name__c || '';
                this.coachingLastUpdatedBy = session.LastModifiedBy.Full_Name__c || '';
                console.log(" this.coachingCreatedBy IN loadCoachingData " +  this.coachingCreatedBy);
                console.log(" this.coachingLastUpdatedBy IN loadCoachingData " +  this.coachingLastUpdatedBy);
                this.coachingCreatedDate = this.formatDateTime(session.CreatedDate);
                this.coachingLastUpdatedDate = this.formatDateTime(session.LastModifiedDate);
                this.coachingTitle = session.Coaching_Title__c || '';
                this.description = session.Coaching_Description__c || '';
                this.discussionSummary = session.Discussion_Summary__c || '';
                this.outcomeAgreements = session.Outcome_Aggrements__c || '';
                this.meetingDate = this.formatDate(session.Meeting_Date__c);
                this.meetingTime = this.formatTime(session.Meeting_Time__c);
                this.meetingUiTime = this.formatTime(session.Meeting_Time__c);
                console.log(" this.meetingTime IN loadCoachingData " +  this.meetingTime);
                console.log(" this.meetingUiTime IN loadCoachingData " +  this.meetingUiTime);
                this.dispalyAmPMFormat();
                this.meetingType = session.Meeting_Type__c || '';
                this.location = session.Location__c || '';
                this.confidentialNotes = session.Manager_Confidential_Notes__c || '';
                this.hrConfidentialNotes = session.HR_Confidential_Notes__c || '';
                this.promotion = session.Recommendation_for_Promotion__c || false;
                this.pip = session.Recommendation_for_PIP__c || false;
                this.improvement = session.Recommendation_for_Increment__c || false;
                this.additionalDetails = session.Recommendation_Additional_Details__c || '';
                //this.coachingCreatedtype = session.isCreatedByRc__c ? 'Triggered from Review Cycle' : 'Created by Manager';
                if (session.isCreatedByRc__c) {
                    this.coachingCreatedtype = 'Triggered from Review Cycle';
                } else if (session.isCreatedByHR__c) {
                    this.coachingCreatedtype = 'Created by HR';
                } else if (session.isCreatedByManager__c) {
                    this.coachingCreatedtype = 'Created by Manager';
                }
                this.isCreatedByRc = session.isCreatedByRc__c || false;
                this.isCreatedByHr = session.isCreatedByHR__c || false;
                this.isCreatedByManager = session.isCreatedByManager__c || false;
                this.isScheduleCoaching= session.isScheduledCoaching__c || false;
                this.hrAcknowledged = session.Is_Hr_Acknowledged__c || false;
                this.hrComments = session.HR_Coaching_Comments__c || '';
                this.managerFinalized= session.Is_Manager_Finalized__c || false,
                this.hrSubmitted = session.Is_HR_Submitted__c || false,
                this.templateCriteria = session.PMS_Staff_Template__r?.PMS_Role_Template__r?.Role_Title__c || '';
                this.reviewCycleName = session.PMS_Review_Cycle__r?.Name || '';

                this.hrAcknowledgementDate = session.HR_Acknowledged_Date__c
                    ? this.formatDateTime(session.HR_Acknowledged_Date__c)
                    : null;
               // if (this.isCreatedByManager) {
                    this.coachingType = session.Coaching_Type__c || '';
               // }

                this.staffSessions = (children || []).map(child =>
                    this.mapChildSession(child, result.roles, result.managers)
                );
                
                this.staffSessions.forEach(child => {
                
                    child.empAcknowledged = child.empAcknowledged || false;
                    child.employeeComment = child.employeeComment || '';
                    child.employeeAcknowledgementDate = child.employeeAcknowledgementDate || null;
                    //child.isDisabledAcknowledgementContainer = !child.empAcknowledged;
                   // child.disableEmployeeComments = child.empAcknowledged;;

                    child.managerAcknowledged = child.managerAcknowledged || false;
                    child.managerComment = child.managerComment || '';
                    child.managerAcknowledgementDate = child.managerAcknowledgementDate || null;

                });
                if (!this.isCreatedByManager && this.staffSessions.length > 0) {

                    const first = this.staffSessions[0];

                    this.staffName = first.staffName || '';
                    this.staffRole = first.staffRole || '';
                    this.staffEmail = first.staffEmail || '';
                    this.staffManager = first.staffManager || '';
                    this.staffProfileUrl = first.staffProfileUrl || '';
                    //this.empAcknowledged = first.empAcknowledged;
                    //this.employeeComment = first.employeeComment;
                   // this.employeeAcknowledgementDate = first.employeeAcknowledgementDate;

                    this.isAcknowledged = first.managerAcknowledged;
                    this.managerComments = first.managerComment;
                    //this.acknowledgementDate = first.managerAcknowledgementDate;
                    console.log('staffName in !this.isCreatedByManager && this.staffSessions.length > 0 :', this.staffName);
                    console.log('staffEmail:', this.staffEmail);
                    console.log('staffRole:', this.staffRole);
                    console.log('staffManager:', this.staffManager);
                   // console.log('empAcknowledged:', this.empAcknowledged);
                    console.log('employeeComment:', this.employeeComment);
                    console.log('staffProfileUrl:', this.staffProfileUrl);
                   // console.log('employeeAcknowledgementDate:', this.employeeAcknowledgementDate);
                    console.log('isAcknowledged:', this.isAcknowledged);
                }
                //if (this.isCreatedByManager) {

                // this.commentStaffList = (this.staffSessions || []).map(s => ({
                //         id: s.staffId,
                //         name: s.staffName,
                //         comment: s.employeeComment
                //     }));
                // }
                if (this.isStaff) {
                    const current = this.currentStaffSession;

                    //this.empAcknowledged = current?.empAcknowledged || false;
                    this.employeeComment = current?.employeeComment || '';
                }

                if (this.isManager) {
                    const current = this.currentStaffSession;

                    this.isAcknowledged = current?.managerAcknowledged || false;
                    this.managerComments = current?.managerComment || '';
                }

                if (this.isHr) {
                    this.isAcknowledged = this.hrAcknowledged || false;
                }
                // this.hasAllStaffAcknowledged =
                //     this.staffSessions &&
                //     this.staffSessions.length > 0 &&
                //     this.staffSessions.every(s => s.empAcknowledged);

                this.hasAllManagerAcknowledged =
                    this.staffSessions &&
                    this.staffSessions.length > 0 &&
                    this.staffSessions.every(s => s.managerAcknowledged);

                const actions = session.PMS_Coaching_Action__r || [];
                this.strengthsList = this.mapActions(actions, 'Strengths');
                this.developmentList = this.mapActions(actions, 'Development Areas');
                this.supportList = this.mapActions(actions, 'Support & Resources');

                console.log('staffSessions:', this.staffSessions);
                console.log('coachingCreatedtype:', this.coachingCreatedtype);
            })
            .catch(error => {
                console.error(error);
            });
    }


    mapChildSession(child, rolesMap, managersMap) {
        const staffId = child.Staff__c;
        const staff = child.Staff__r || {};
        const manager = managersMap?.[staff.Manager__c] || {};
       

        return {
            id: child.Id,
            staffId: staffId,
            staffType: child.Staff_Type__c || '',
        
            staffName: staff.Display_Nickname__c || '',
            staffEmail: staff.Email_Address__c || '',
            staffRole: rolesMap?.[staffId] || '',
            staffProfileUrl: staff.picture__c || '',
            staffManager: manager.Display_Nickname__c || '',
            managerEmail: manager.Email_Address__c || '',
            managerProfileUrl: manager.picture__c || null,
            commentLabel: this.getCommentLabel(child.Staff_Type__c),
            employeeComment: child.Staff_Coaching_Comments__c || '',
            managerComment: child.Manager_Coaching_Comments__c || '',
            empAcknowledged: child.Is_Staff_Acknowledged__c || false,
            managerAcknowledged: child.Is_Manager_Acknowledged__c || false,
            employeeAcknowledgementDate: child.Staff_Acknowledged_Date__c
                ? this.formatDateTime(child.Staff_Acknowledged_Date__c)
                : null,
            managerAcknowledgementDate: child.Manager_Acknowledged_Date__c
                ? this.formatDateTime(child.Manager_Acknowledged_Date__c)
                : null,
            
               
            employeeAcknowledgedStatus: child.Is_Staff_Acknowledged__c ? 'Acknowledged' : ''
        };
    }

    // Map actions by type
    // mapActions(actions, type) {
    //     const filtered = actions.filter(a => a.Action_Type__c === type);
    //     return filtered.length
    //         ? filtered.map((a, index) => ({
    //             id: a.Id,
    //             value: a.Action_Name__c,
    //             isLast: index === filtered.length - 1
    //         }))
    //         : [{ id: Date.now(), value: '', isLast: true }];
    // }
    mapActions(actions, type) {

        const filtered = (actions || []).filter(a => a.Action_Type__c === type);

        return filtered.length
            ? filtered.map((a, index) => ({
                id: a.Id,
                value: a.Action_Name__c,
                isLast: index === filtered.length - 1
            }))
            : [{ id: Date.now(), value: '', isLast: true }];
    }
    formatDateTime(dateString) {
        console.log('Date String:', dateString);
        if (!dateString) return 'N/A';

        const date = new Date(dateString);

        const options = {
            month: 'short',   // Mar
            day: '2-digit',   // 19
            year: 'numeric',  // 2026
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };

        return new Intl.DateTimeFormat('en-US', options)
            .format(date)
            .replace(',', ''); 
    }
    
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }
    formatTime(ms) {
        if (!ms) return '';

        let totalSeconds = Math.floor(ms / 1000);
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);

        let ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // 0 → 12

        let formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${formattedMinutes} ${ampm}`;
    }
    handleEditCoaching(event){
        // const data = event.currentTarget.dataset;
        // this.coachingRecordId = data.id;
        console.log('Coaching Record Id:', this.coachingId);
       // this.createMode = true;
        this.viewMode = false;  
        
        this.loadCoachingData();
        this.isHome = true;
        //this.isScheduleCoaching = false;
        this.isCoachingTab = false;
        this.createMode = false; 
        console.log('createMode:', this.createMode);
    }
    handleFinalizeToHr() {
        console.log('Finalize clicked');

        if (!this.isAcknowledged) {
            this.showToast('Error', 'Please acknowledge before finalizing', 'error');
            return;
        }

        if (this.isManager && (!this.managerComments || this.managerComments.trim() === '')) {
            this.showToast('Error', 'Please enter manager comments', 'error');
            return;
        }

        if (this.isHr && (!this.hrComments || this.hrComments.trim() === '')) {
            this.showToast('Error', 'Please enter HR comments', 'error');
            return;
        }
        let coachingData = {
            Id: this.coachingId
        };

        if (this.isManager) {
            coachingData.isFinalized = true; 
            coachingData.confidentialNotes = this.confidentialNotes || '';
        }

        if (this.isHr) {
            coachingData.isSubmitted = true; 

            coachingData.hrId = this.hrId || '';
            coachingData.hrName = this.hrName || '';
            coachingData.hrConfidentialNotes = this.hrConfidentialNotes || '';
        }

        saveCoachingData({
            coachingData,
            actionList: []
        })
        .then(() => {

            this.showToast(
                'Success',
                this.isHr ? 'Submitted Successfully' : 'Finalized Successfully',
                'success'
            );

           //this.hasConfirmedAcknowledgement = true;
            this.loadCoachingData();
            //this.isDisabledAcknowledgementContainer = true;
           // this.disableEmployeeComments = true;
            const event = new CustomEvent('back');
            this.dispatchEvent(event);
            this.loadCoachingData();

        })
        .catch(error => console.error(error));

    }
    handleCancelView() {
        console.log('Cancel clicked');
        this.isHome = false;
        const event = new CustomEvent('back');
        this.dispatchEvent(event);
    }
    handleConfirmAcknowledgement() {

        // if (!this.isAcknowledged) {
        //     this.showToast('Error', 'Please check acknowledgement before confirming', 'error');
        //     return;
        // }
         console.log(' Confirm Clicked');

        console.log('isStaff:', this.isStaff);
        console.log('isManager:', this.isManager);
        console.log('isHr:', this.isHr);

        console.log('currentStaffSession:', JSON.stringify(this.currentStaffSession));

        const isChecked = this.isStaff
            ? this.currentStaffSession?.empAcknowledged
            : this.isAcknowledged;
         console.log(' isChecked value:', isChecked);

        console.log(' employeeComment:', this.employeeComment);

        if (!isChecked) {
            console.log(' FAILED: checkbox not detected');
            this.showToast('Error', 'Please check acknowledgement before confirming', 'error');
            return;
        }
        if(this.isStaff && (!this.employeeComment || this.employeeComment.trim() === '')){
            this.showToast('Error', 'Please enter Staff Comments', 'error');
            return;
        }
        if(this.isManager && (!this.managerComments || this.managerComments.trim() === '')){
            this.showToast('Error', 'Please enter Manager Comments', 'error');
            return;
        }
        if(this.isHr && (!this.hrComments || this.hrComments.trim() === '')){
            this.showToast('Error', 'Please enter HR Comments', 'error');
            return;
        }

        let coachingData = this.prepareCoachingData();

        coachingData.isStaffAcknowledged = this.isStaff ? true : null;
        coachingData.isManagerAcknowledged = this.isManager ? true : null;
        coachingData.isHrAcknowledged = this.isHr ? true : null;
        console.log('selectedFacilityId IN handleConfirmAcknowledgement', this.selectedFacilityId);
        let actions = this.prepareActions();

        saveCoachingData({
            coachingData,
            actionList: actions
        })
        .then(() => {

            //this.hasConfirmedAcknowledgement = true;
            this.loadCoachingData();
           // this.isDisabledAcknowledgementContainer = true;
            //this.disableEmployeeComments = true;
            this.showToast('Success', 'Acknowledged Successfully', 'success');
            if(this.isStaff){
                
                setTimeout(() => {

                    this.isHome = false;
                    const event = new CustomEvent('back');
                    this.dispatchEvent(event);

                }, 500);
            }

        })
        .catch(error => console.error(error));

       // this.handleCreateCoaching();
    }
    handleChangeRequest() {

        console.log('Change Request clicked');
        console.log('isManager:', this.isManager);
        console.log('isHr:', this.isHr);
        console.log('coachingId:', this.coachingId);

        changeRequestCoaching({
            coachingId: this.coachingId,
            isManager: this.isManager || false,
            isHr: this.isHr || false
        })
        .then(() => {

            this.showToast('Success', 'Change Request Sent Successfully', 'success');

            // if (this.isManager) {
            //     //this.empAcknowledged = false;
            //     //this.employeeComment = '';
            // }

            // if (this.isHr) {
            //     this.isAcknowledged = false;
            //    // this.managerComments = '';
            // }

           // this.hasConfirmedAcknowledgement = false;
            //this.isDisabledAcknowledgementContainer = false;

            // reload data
            this.loadCoachingData();

        })
        .catch(error => {
            console.error(error);
        });
    }

    handleSingleSelect(event) {

        const selectedId = event.target.value;
        const isSelected = event.target.checked;

        // Update UI
        this.employeeList = this.employeeList.map(emp => ({
            ...emp,
            isSelected: emp.id === selectedId && isSelected
        }));

        // Only ONE allowed → reset + add
        if (isSelected) {
            this.staffCoachingData = [{
                staffId: selectedId,
                staffType: 'Staff',
                managerComment: '',
                employeeComment: '',
                isStaffAcknowledged: false,
                isManagerAcknowledged: false
            }];
        } else {
            this.staffCoachingData = [];
        }
    }

   
    // handleSingleSelect(event) {
    //     const selectedId = event.target.value;

    //     this.employeeList = this.employeeList.map(emp => ({
    //         ...emp,
    //         isSelected: emp.id === selectedId
    //     }));
    // }
   
    // handleMultiSelect(event) {
    //     const selectedId = event.target.value;

    //     this.employeeList = this.employeeList.map(emp => {
    //         if (emp.id === selectedId) {
    //             return { ...emp, isSelected: !emp.isSelected };
    //         }
    //         return emp;
    //     });
    // }
    handleMultiSelect(event) {

        const selectedId = event.target.value;
        const isSelected = event.target.checked;

        this.employeeList = this.employeeList.map(emp => {

            if (emp.id === selectedId) {

                if (isSelected) {
                    // ADD (avoid duplicate)
                    if (!this.staffCoachingData.some(s => s.staffId === emp.id)) {
                        this.staffCoachingData = [
                            ...this.staffCoachingData,
                            {
                                staffId: emp.id,
                                staffType: 'Staff',
                                managerComment: '',
                                employeeComment: '',
                                isStaffAcknowledged: false,
                                isManagerAcknowledged: false
                            }
                        ];
                    }
                } else {
                    // REMOVE
                    this.staffCoachingData =
                        this.staffCoachingData.filter(s => s.staffId !== emp.id);
                }

                return { ...emp, isSelected };
            }

            return emp;
        });
    }

    // handleManagerSelect(event) {
    //     const selectedId = event.target.value;

    //     this.managerList = this.managerList.map(m => {
    //         if (m.id === selectedId) {
    //             return { ...m, isSelected: !m.isSelected };
    //         }
    //         return m;
    //     });
    // }
     handleManagerSelect(event) {

        const selectedId = event.target.value;
        const isSelected = event.target.checked;

        this.managerList = this.managerList.map(mgr => {

            if (mgr.id === selectedId) {

                if (isSelected) {
                    if (!this.staffCoachingData.some(s => s.staffId === mgr.id)) {
                        this.staffCoachingData = [
                            ...this.staffCoachingData,
                            {
                                staffId: mgr.id,
                                staffType: 'Manager',
                                managerComment: '',
                                employeeComment: '',
                                isStaffAcknowledged: false,
                                isManagerAcknowledged: false
                            }
                        ];
                    }
                } else {
                    this.staffCoachingData =
                        this.staffCoachingData.filter(s => s.staffId !== mgr.id);
                }

                return { ...mgr, isSelected };
            }

            return mgr;
        });
    }

    // handleHrSelect(event) {
    //     const selectedId = event.target.value;

    //     this.hrList = this.hrList.map(h => {
    //         if (h.id === selectedId) {
    //             return { ...h, isSelected: !h.isSelected };
    //         }
    //         return h;
    //     });
    // }
     handleHrSelect(event) {

        const selectedId = event.target.value;
        const isSelected = event.target.checked;

        this.hrList = this.hrList.map(hr => {

            if (hr.id === selectedId) {

                if (isSelected) {
                    if (!this.staffCoachingData.some(s => s.staffId === hr.id)) {
                        this.staffCoachingData = [
                            ...this.staffCoachingData,
                            {
                                staffId: hr.id,
                                staffType: 'HR',
                                managerComment: '',
                                employeeComment: '',
                                isStaffAcknowledged: false,
                                isManagerAcknowledged: false
                            }
                        ];
                    }
                } else {
                    this.staffCoachingData =
                        this.staffCoachingData.filter(s => s.staffId !== hr.id);
                }

                return { ...hr, isSelected };
            }

            return hr;
        });
    }

    getSelectedEmployees() {
        return this.employeeList
            .filter(e => e.isSelected)
            .map(e => e.id);
    }

    getSelectedManagers() {
        return this.managerList
            .filter(m => m.isSelected)
            .map(m => m.id);
    }

    getSelectedHr() {
        return this.hrList
            .filter(h => h.isSelected)
            .map(h => h.id);
    }
    loadManagerList() {
        console.log('loadManagerList...');

        if (!this.selectedFacilityId) return;

        getManagersAndHrByFacility({ facilityId: this.selectedFacilityId })
            .then(result => {
                console.log('inside getManagersAndHrByFacility...');

                console.log('Manager List:', JSON.stringify(result));
                const managers = result.managers || [];
                const hrs = result.hrs || [];

                this.managerList = managers.map(mgr => ({
                    id: mgr.Id,
                    name: mgr.Display_Nickname__c || mgr.Name,
                    email: mgr.Email_Address__c || '',
                    staffProfileUrl: mgr.picture__c || null,

                   role: mgr.StaffRoles__r?.length
                        ? mgr.StaffRoles__r[0].RoleName__c
                        : '',

                    isSelected: false
                }));

                this.hrList = hrs.map(hr => ({
                    id: hr.Id,
                    name: hr.Display_Nickname__c || hr.Name,
                    email: hr.Email_Address__c || '',
                    staffProfileUrl: hr.picture__c || null,
                    role: hr.StaffRoles__r?.length
                        ? hr.StaffRoles__r[0].RoleName__c
                        : '',
                    isSelected: false
                }));

                console.log('Managers:', this.managerList);
                console.log('HRs:', this.hrList);


            })
            .catch(error => {
                console.error('Error loading staff:', error);
            });
    }
    loadStaffList(){
        if (!this.selectedRolesInApply || this.selectedRolesInApply.length === 0) {
            this.staffList = [];
            // this.staffCount = 0;
            // this.totalStaffCount = 0;
            //this.errorMessage = '';
            return; 
        }
        const roleNames = (this.selectedRolesInApply || []).map(id => {
        const role = this.roleOptions.find(r => r.value === id);
        return role ? role.label : null;
        }).filter(name => name);

        console.log('OrgId:', this.orgid);
        console.log('FacilityId:', this.selectedFacilityId);
        console.log('Role Names:', JSON.stringify(roleNames));

        getStaffsByOrg({
            orgId: this.orgid,
            facilityId: this.selectedFacilityId,
            roleNames: roleNames
        })
        .then(result => {
                console.log('Staff List:', JSON.stringify(result));

            this.employeeList = result.map(emp => ({
                id: emp.Id,
                name: emp.Display_Nickname__c || emp.Name,
                email: emp.Email_Address__c || '',
                staffProfileUrl: emp.picture__c || null,

                role: emp.StaffRoles__r?.length
                    ? emp.StaffRoles__r[0].RoleName__c
                    : '',

                isSelected: false
            }));

        })
        .catch(error => {
            console.error('Error loading staff:', error);
        });
    }
    handleRoleChange(event) {

        if (!Array.isArray(event.detail.value)) {
            console.log('🚫Ignored search typing event:', event.detail);
            return;
        }

        const selectedRoleValues = event.detail.value || [];

        this.selectedRolesInApply = [...selectedRoleValues];

        console.log('✅ Selected Roles:', this.selectedRolesInApply);

        if (this.selectedFacilityId && this.coachingType && this.selectedRolesInApply && this.selectedRolesInApply.length > 0 ) {
            console.log('🚀 Loading staff...');
            //this.loadStaffList();
             //this.loadManagerList();
            if(this.coachingType === 'Individual Employee' || this.coachingType === 'Groups - Multiple Employees'){
                    console.log('🚀 Loading staff...');
                this.loadStaffList();
            } else if (this.coachingType === 'Managers and HRs Coaching' || this.coachingType === 'Managers Only Coaching' || this.coachingType === 'HRs Only Coaching'){
                    this.loadManagerList();
            }
        } 
    }
    fetchFacilityRoles(){
           
            let facilityIds = [];
           
            if ( this.selectedFacilityId) {
                facilityIds.push( this.selectedFacilityId);
        
            }
            console.log("facilityIds  " + JSON.stringify(facilityIds));
            if (facilityIds.length > 0) {
       
                fetchBulkRoles({ facilityIDList: facilityIds })
                    .then(facRoles => {
    
                        console.log("facRoles  " + JSON.stringify(facRoles));
                        console.log('Returned roles length:', facRoles.length);
                        // Safety check in case Apex returns null
                        const mappedRoles = (facRoles || []).map(rec => ({
                            label: rec.Role_Name__c,
                            value: rec.Id,
                            //checked:false
                        }));
    
                      
                        this.roleOptions = [
                           // { label: 'All', value: 'All', checked: false },
                            ...mappedRoles.map(role => ({
                                ...role,
                                checked: false
                            }))
                        ];
                        // this.roleTemplateOptions=[...mappedRoles];
                        this.selectedRoles = [];
                        //this.selectedRole = 'All';
                    })
                    .catch(error => {
                        console.error('Error fetching roles:', error);
                    });
            }
    
        }

    // handleStaffDataChange(event) {

    //     const staffId = event.target.dataset.id;
    //     const field = event.target.dataset.field;

    //     let value;

    //     if (event.target.type === 'checkbox') {
    //         value = event.target.checked;
    //     } else {
    //         value = event.target.value;
    //     }

    //     this.staffCoachingData = this.staffCoachingData.map(item => {

    //         if (item.staffId === staffId) {
    //             return { ...item, [field]: value };
    //         }

    //         return item;
    //     });
    // }
    handleStaffDataChange(event) {

        const staffId = event.target.dataset.id;
        const field = event.target.dataset.field;

        let value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;

        this.staffCoachingData = this.staffCoachingData.map(item => {

            if (item.staffId === staffId) {
                return { ...item, [field]: value };
            }

            return item;
        });
    }
    prepareStaffData() {

        return (this.staffCoachingData || []).map(item => ({
            staffId: item.staffId,
            staffType: item.staffType,  
            managerComment: item.managerComment || '',
            employeeComment: item.employeeComment || '',
            isStaffAcknowledged: item.isStaffAcknowledged || false,
            isManagerAcknowledged: item.isManagerAcknowledged || false
        }));
    }
    prepareManagerHrCoachingData() {

        return {
            Id: this.coachingId || null,

            coachingTitle: this.coachingTitle || '',
            coachingType: this.coachingType || '',

            meetingDate: this.meetingDate || null,
            meetingTime: this.meetingTime || null,

            location: this.location || '',
            meetingType: this.meetingType || '',

            description: this.description || '',
            discussionSummary: this.discussionSummary || '',
            outcomeAgreements: this.outcomeAgreements || '',

            confidentialNotes: this.confidentialNotes || '',
            hrConfidentialNotes: this.hrConfidentialNotes || '',
            additionalDetails: this.additionalDetails || '',

            promotion: this.promotion || false,
            pip: this.pip || false,
            improvement: this.improvement || false,

            hrComments: this.hrComments || '',

            isFinalized: this.isFinalized || false,
            isSubmitted: this.isSubmitted || false,
            isHrAcknowledged: this.isHrAcknowledged || false,
            isManagerCreated: this.isManagerCreated || false,
            isHrCreated: this.isHrCreated || false
        };
    }

    // prepareManagerCoachingActions() {

    //     return (this.actions || []).map(item => ({
    //         Id: item.id || '',
    //         Action_Name__c: item.value,
    //         Type__c: item.type
    //     }));
    // }
    // prepareActions(){
    //      let actions = [];

    //     (this.strengthsList || []).forEach(item => {
    //         if (item && item.value && item.value.trim() !== '') {
    //             actions.push({
    //                 Id: (item.id && item.id.length === 18) ? item.id : null,
    //                 Action_Name__c: item.value.trim(),
    //                 Type__c: 'Strengths'
    //             });
    //         }
    //     });

    //     (this.developmentList || []).forEach(item => {
    //         if (item && item.value && item.value.trim() !== '') {
    //             actions.push({
    //                 Id: (item.id && item.id.length === 18) ? item.id : null,
    //                 Action_Name__c: item.value.trim(),
    //                 Type__c: 'Development Areas'
    //             });
    //         }
    //     });

    //     (this.supportList || []).forEach(item => {
    //         if (item && item.value && item.value.trim() !== '') {
    //             actions.push({
    //                 // Id: item.id || null, 
    //                 Id: (item.id && item.id.length === 18) ? item.id : null,
    //                 Action_Name__c: item.value.trim(),
    //                 Type__c: 'Support & Resources'
    //             });
    //         }
    //     });
    //     return actions;
    // }
    handleCreateCoaching(){
        console.log('Create Coaching clicked');
        if(this.isManagerCreated || this.isHrCreated){
            this.handleManagerCreateCoaching();
        }else{
            this.handleCreateCoachingRc();
        }
    }
    handleManagerCreateCoaching() {

         if (!this.coachingTitle || !this.coachingType || !this.selectedRolesInApply || this.selectedRolesInApply.length === 0 || !this.meetingDate || !this.meetingTime || !this.meetingType ) {
            this.showToast('Error', 'Please fill all required fields.', 'error');
            return;
        }
        if (
            (this.promotion || this.pip || this.improvement) &&
            (!this.additionalDetails || this.additionalDetails.trim() === '')
        ) {
            this.showToast('Error', 'Please enter Additional Details in Advanced Recommendations.', 'error');
            return;
        }
        let coachingData = this.prepareManagerHrCoachingData();
        let actionList = this.prepareActions();
        let staffDataList = this.prepareStaffData();

        if (!staffDataList.length) {
            this.showToast('Error', 'Please select at least one employee', 'error');
            return;
        }

        console.log('coachingData:', JSON.stringify(coachingData));
        console.log('staffDataList:', JSON.stringify(staffDataList));
        console.log('actionList:', JSON.stringify(actionList));

        createOrUpdateManagerCoaching({
            facilityId: this.selectedFacilityId,
            coachingData: coachingData,
            actionList: actionList,
            staffDataList: staffDataList
        })
        .then((result) => {

            this.coachingId = result; 

            this.showToast('Success', 'Coaching Saved Successfully', 'success');

            this.dispatchEvent(new CustomEvent('back'));
        })
        .catch(error => {
            console.error('ERROR:', error);
            this.showToast('Error', 'Something went wrong', 'error');
        });
    }

    get gridClass() {
        return this.isCreatedByManager || this.isCreatedByHr
            ? 'slds-grid slds-wrap'
            : 'slds-grid slds-wrap slds-align_absolute-center';
    }
    handlemeetingTimeData(event) {
        //const timeType = event.target.dataset.timetype;
        const childData = event.detail;
        console.log('childData:  '+JSON.stringify(childData))
        const displayTime = childData?.displaytime || "";
        const twentyFourHourFormat = childData?.twentyFourHourFormat || "";

        console.log("displayTime " + displayTime);
        console.log("twentyFourHourFormat " + twentyFourHourFormat);
        this.meetingTime = twentyFourHourFormat;
        this.meetingUiTime = displayTime;
        console.log(" this.meetingTime  " +  this.meetingTime);
        console.log(" this.meetingUiTime  " +  this.meetingUiTime);
        this.dispalyAmPMFormat();
        console.log(" this.meetingTime after  " +  this.meetingTime);
        console.log(" this.meetingUiTime  after" +  this.meetingUiTime);
    }

    dispalyAmPMFormat() {
        console.log("🔄 dispalyAmPMFormat() called...");

        if (this.meetingUiTime) {
    
        let [time, period] = this.meetingUiTime.split(" ");
    

        let [startHour, startMinute] = time.split(":");
    

        this.meetingTimeSelectedHour = startHour;
        this.meetingTimeSelectedMinute = startMinute;
        this.meetingTimeAMPM = period == "AM" ? "AM" : "PM";
        console.log(" this.meetingTimeSelectedHour  " +  this.meetingTimeSelectedHour);
        console.log(" this.meetingTimeSelectedMinute  " +  this.meetingTimeSelectedMinute);
        console.log(" this.meetingTimeAMPM  " +  this.meetingTimeAMPM);

        
        } else {
            console.warn("⚠️ No Start Time AMPM found in addShiftData");
        }


        console.log("🏁 dispalyAmPMFormat() finished");
    }
}