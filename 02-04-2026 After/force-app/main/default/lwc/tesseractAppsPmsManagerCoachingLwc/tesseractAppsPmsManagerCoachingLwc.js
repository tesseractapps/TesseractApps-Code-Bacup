import { LightningElement, wire, api, track } from "lwc";
import getCoachingSessions from '@salesforce/apex/PmsManagerTemplateController.getCoachingSessions';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class TesseractAppsPmsManagerCoachingLwc extends LightningElement {

    @api managerId;
    @track isCoachingTab = true;
    @track isManagerTab = false;
    @track activeTab = 'scheduled';
    @track scheduledRecords = [];
    @track pendingRecords = [];
    @track managerCreatedRecords=[];
    @track isHome = true;
    @track isScheduleCoaching = false;
    @track staffName;
    @track staffEmail;
    @track sraffRole;
    @track staffManager;
    @track hrContact;
    @track templateCriteria;
    @track staffProfileUrl;
    @api isManager;
    @api isHr;
    @track isCoachingViewMode=false;
    @track isCoachingCreateMode=false;
    @track isReviewCoaching = false;
    @track isReviewManagerCoaching=false;
    // @track reviewDate;
    @track coachingRecordId;
    @track isCoachingCreateEdit= false;
    @track isManagerCreated= false;
   // @track mode='';
    @track source='';
    @track selectedFacilityId;
    @track selectedFacilityName = '';
    
    
    connectedCallback() {
        console.log('managerId: ' + this.managerId);
        console.log('isManager in TesseractAppsPmsManagerCoachingLwc : ' + this.isManager);
        this.selectedFacilityId = localStorage.getItem("defaultFacilityId");
        console.log('selectedFacilityId: ' + this.selectedFacilityId);
        this.selectedFacilityName = localStorage.getItem("defaultFacilityLabel");
        console.log('selectedFacilityName : ',this.selectedFacilityName);
        if(this.activeTab === 'scheduled') {
            this.loadCoachingSessions();
        }
    }

    get coachingTabClass(){
        return this.isCoachingTab ? 'menu-item1' : 'menu-item'; 
    }

    get managerTabClass(){
        return this.isManagerTab ? 'menu-item1' : 'menu-item'; 
    }

    get coachingScheduledClass() {
        return this.activeTab === 'scheduled' ? 'tab active' : 'tab';
    }

    get coachingPendingClass() {
        return this.activeTab === 'pending' ? 'tab active' : 'tab';
    }

    get isScheduledTab() {
        return this.activeTab === 'scheduled';
    }

    get isPendingTab() {
        return this.activeTab === 'pending';
    }
    // get acknowledgementContainerClass() {
    //     return this.isDisabledAcknowledgementContainer 
    //         ? 'slds-box disabled-box' 
    //         : 'slds-box';
    // }
    // get isDisabled() {
    //     return this.isDisabledAcknowledgementContainer;
    // }

    // get isEmployeeCommentDisabled() {
    //     return this.isDisabledAcknowledgementContainer || this.disableEmployeeComments;
    // }

    // get isConfirmAcknowledged() {
    //     return this.isDisabledAcknowledgementContainer || !this.isAcknowledged;
    // }
    // get statusBadge() {

    //     console.log('=== STATUS DEBUG ===');

    //     console.log('hrSubmitted:', this.hrSubmitted);
    //     console.log('hrAcknowledgementDate:', this.hrAcknowledgementDate);
    //     console.log('managerFinalized:', this.managerFinalized);

    //     const sessions = this.staffSessions || [];

    //     const allStaffAcknowledged = sessions.length > 0 &&
    //         sessions.every(s => s.employeeAcknowledgementDate);

    //     const allManagerAcknowledged = sessions.length > 0 &&
    //         sessions.every(s => s.managerAcknowledgementDate);

    //     console.log('allStaffAcknowledged:', allStaffAcknowledged);
    //     console.log('allManagerAcknowledged:', allManagerAcknowledged);

    //     // if (this.hrSubmitted) {
    //     //     return 'Submitted';
    //     // }

    //     if (this.hrAcknowledgementDate) {
    //         return 'HR Acknowledged';
    //     }

    //     if (this.managerFinalized) {
    //         return 'Finalized to HR';
    //     }

    //     if (allManagerAcknowledged) {
    //         return 'Manager Acknowledged';
    //     }

    //     if (allStaffAcknowledged) {
    //         return 'Employee Acknowledged';
    //     }

    //     return 'Pending Employee Acknowledgement';
    // }
    // get statusClass() {

    //     switch (this.statusBadge) {

    //         case 'HR Acknowledged':
    //             return 'slds-badge slds-theme_success slds-theme_light';

    //         case 'Finalized to HR':
    //             return 'slds-badge slds-theme_success slds-theme_light';

    //         case 'Manager Acknowledged':
    //             return 'slds-badge slds-theme_warning slds-theme_light';

    //         case 'Employee Acknowledged':
    //             return 'slds-badge slds-theme_warning slds-theme_light';

    //         case 'Pending Employee Acknowledgement':
    //             return 'slds-badge slds-theme_error slds-theme_light';

    //         default:
    //             return 'slds-badge slds-theme_inverse';
    //     }
    // }
    handlCoachingClick() {
        this.isCoachingTab = true;
        this.isManagerTab = false;
       // this.activeTab ='scheduled';
        console.log('activeTab in handlCoachingClick: ' + this.activeTab);
        this.loadCoachingSessions();
       

    }

    handlManagerClick() {
        this.isCoachingTab = false;
        this.isManagerTab = true;
       // this.activeTab === '';
        console.log('activeTab in handlManagerClick: ' + this.activeTab);
         this.loadCoachingSessions();
    }

    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.tab;
        console.log('activeTab in handleTabClick: ' + this.activeTab);
        //if(this.activeTab === 'scheduled') {
            this.loadCoachingSessions();
       // }
        
    }
    
    loadCoachingSessions() {
         if (!this.selectedFacilityId) return;

        console.log('managerId IN loadCoachingSessions : ' + this.managerId);

        getCoachingSessions({ facilityId: this.selectedFacilityId ,managerId: this.managerId })
            .then(result => {

                const sessions = result.sessions || [];
                const managers = result.managers || {};
                const roles = result.roles || {};

                console.log('session length : ', sessions.length);
                console.log('Sessions:', JSON.stringify(sessions));
                console.log('Managers:', JSON.stringify(managers));
                console.log('Roles:', JSON.stringify(roles));


                const mappedData = sessions.map(rec => {

                    const children = rec.PMS_Staff_Coaching__r || [];
                    const firstChild = children.length > 0 ? children[0] : {};

                    const staffId = firstChild?.Staff__c;
                    const mgrId = firstChild?.Staff__r?.Manager__c;

                    // const manager = managers[mgrId];
                    const manager = mgrId && managers[mgrId] ? managers[mgrId] : {};
                    const roleName = roles[staffId];

                    const employeeNames = children.map(c => c.Staff__r?.Display_Nickname__c).join(', ');
                  //  const employeeCount = children.length;
                    const coachingType = rec.Coaching_Type__c;

                    console.log('staffId: ', staffId);
                    console.log('mgrId: ', mgrId);
                    console.log('manager: ', manager);
                    console.log('roleName: ', roleName);

                    const coachingCreatedtype = rec.isCreatedByRc__c
                        ? 'Triggered from RC'
                        : 'Created by Manager';
                    let createdTypeClass = 'slds-badge slds-badge_light slds-truncate ';

                    // Based on type
                    if (rec.isCreatedByRc__c) {
                        createdTypeClass += 'badge-rc'; // Purple
                    } else {
                        createdTypeClass += 'coaching-badge'; // Orange
                    }

                    const actionType = (rec.isCreatedByRc__c && !rec.isScheduledCoaching__c)
                        ? 'Action Required - Schedule Coaching Session'
                       // : 'Action Required';
                        : '';
                  
                    const profileUrl = firstChild?.Staff__r?.picture__c || '';

                    console.log( 'Profile URL mapping:',  profileUrl  );
                    const isRc = rec.isCreatedByRc__c === true;
                    const isManagerCreated = rec.isCreatedByManager__c === true;
                    const isFinalized = rec.Is_Manager_Finalized__c === true;

                    const isPending = rec.isCreatedByRc__c === true && rec.isScheduledCoaching__c === true;
                    const isScheduling = rec.isCreatedByRc__c === true && rec.isScheduledCoaching__c === false;
                    const type = rec.Coaching_Type__c || '';

                    const isIndividual = isManagerCreated && type === 'Individual Employee';
                    const isGroup = isManagerCreated && type === 'Groups - Multiple Employees';
                    const isManagerHr = isManagerCreated && type === 'Managers and HRs Coaching';
                    const isManagerOnly = isManagerCreated && type === 'Managers Only coaching';
                   

                    //  Pending Label Logic
                    const pendingReviewLabel = isPending
                        ? (isFinalized ? 'View' : 'Review')
                        : '';

                    //  Manager Label Logic
                    const managerCreatedReviewLabel = isManagerCreated
                        ? (isFinalized ? 'View' : 'Review')
                        : '';

                    const allStaffAcknowledged = children.length > 0 &&
                        children.every(c => c.Staff_Acknowledged_Date__c);

                    //  MANAGER STATUS
                    const allManagerAcknowledged = children.length > 0 &&
                        children.every(c => c.Manager_Acknowledged_Date__c);

                    //  HR + FINAL FLAGS
                    const hrAckDate = rec.HR_Acknowledged_Date__c;
                    const hrSubmitted = rec.Is_HR_Submitted__c === true;
                    const managerFinalized = rec.Is_Manager_Finalized__c === true;

                    console.log('=== STATUS DEBUG ===');
                    console.log('Record Id:', rec.Id);
                    console.log('allStaffAcknowledged:', allStaffAcknowledged);
                    console.log('allManagerAcknowledged:', allManagerAcknowledged);
                    console.log('managerFinalized:', managerFinalized);
                    console.log('hrAckDate:', hrAckDate);
                    console.log('hrSubmitted:', hrSubmitted);

                    //  DEFAULT
                    let statusBadge = 'Pending Employee Acknowledgement';

                    // PRIORITY ORDER
                    if (hrSubmitted) {
                        statusBadge = 'HR Submitted';
                    }
                    else if (hrAckDate) {
                        statusBadge = 'HR Acknowledged';
                    }
                    else if (managerFinalized) {
                        statusBadge = 'Finalized to HR';
                    }
                    else if (allManagerAcknowledged) {
                        statusBadge = 'Manager Acknowledged';
                    }
                    else if (allStaffAcknowledged) {
                        statusBadge = 'Employee Acknowledged';
                    }

                    //  COLOR (LIGHT ONLY)
                    let statusClass = 'slds-badge slds-theme_error slds-theme_light';

                    switch (statusBadge) {

                        // case 'Submitted':
                        // case 'HR Acknowledged':
                        // case 'Manager Finalized':
                        //     statusClass = 'slds-badge badge-success';
                        //     break;

                        // case 'Manager Acknowledged':
                        // case 'Employee Acknowledged':
                        // case 'Pending Employee Acknowledgement':    
                        //     statusClass = 'slds-badge badge-warning';
                        //     break;
                         case 'HR Submitted':
                            statusClass = 'slds-badge badge-submitted';
                            break;

                        case 'HR Acknowledged':
                            statusClass = 'slds-badge badge-hr';
                            break;

                        case 'Finalized to HR':
                            statusClass = 'slds-badge badge-finalized';
                            break;

                        case 'Manager Acknowledged':
                            statusClass = 'slds-badge badge-manager';
                            break;

                        case 'Employee Acknowledged':
                            statusClass = 'slds-badge badge-employee';
                            break;

                        case 'Pending Employee Acknowledgement':
                            statusClass = 'slds-badge badge-pending';
                            break;
                    }
                   let managerCount = 0;
                   let hrCount = 0;
                   let employeeCount = 0;

                    children.forEach(c => {
                        if (c.Staff_Type__c === 'Manager') {
                            managerCount++;
                        } 
                        else if (c.Staff_Type__c === 'HR') {
                            hrCount++;
                        } 
                        else if (c.Staff_Type__c === 'Staff') {
                            employeeCount++;
                        }
                    });
                    let actions = rec.PMS_Coaching_Action__r || [];

                    let strengths = (actions || []).filter(a => (a.Action_Type__c || '') === 'Strengths');
                    let development = (actions || []).filter(a => (a.Action_Type__c || '') === 'Development Areas');
                    let support = (actions || []).filter(a => (a.Action_Type__c || '') === 'Support & Resources');
                        
                    return {
                        Id: rec.Id,
                        isRc,
                        isManagerCreated,
                        isIndividual,
                        isGroup,
                        isManagerHr,
                        isManagerOnly,
                        isFinalized,
                        statusBadge,
                        statusClass,

                        // COUNTS
                        employeeCount,
                        //roleCount,
                        managerCount:managerCount ||0,
                        hrCount:hrCount || 0,
                       // coachingCreatedtype: coachingCreatedtype,
                        actionTypeRequired: actionType,

                        employeeName: employeeNames || '',
                        email: firstChild?.Staff__r?.Email_Address__c || '',
                        staffProfileUrl: profileUrl,

                        role: roleName || '',
                        criteria: rec.PMS_Staff_Template__r?.PMS_Role_Template__r?.Role_Title__c || '',
                        reviewCycleName: rec.PMS_Review_Cycle__r?.Name || '',

                        manager: manager?.Display_Nickname__c || '',
                        managerEmail: manager?.Email_Address__c || '',
                        //hrContact: '', 

                        reviewDate: rec.PMS_Staff_Template__r?.Manager_Submitted_Date__c
                            ? this.formatDateTime(rec.PMS_Staff_Template__r.Manager_Submitted_Date__c)
                            : '',
                        hrContact:rec.HR_Name__c || '',                       
                        coachingTitle: rec.Coaching_Title__c || '',
                        coachingDescription: rec.Coaching_Description__c || '',
                        reviewCycleName: rec.PMS_Review_Cycle__r?.Name || '',
                        coachingCreatedDate: this.formatDateTime(rec.CreatedDate) || '',
                        coachingLastUpdated: this.formatDateTime(rec.LastModifiedDate) || '',
                        meetingDate: rec.Meeting_Date__c ? this.formatDate(rec.Meeting_Date__c) : '',
                        meetingTime: rec.Meeting_Time__c ? this.formatTime(rec.Meeting_Time__c) : '',
                        meetingType: rec.Meeting_Type__c || '',
                       // isManagerCreated: rec.isCreatedByManager__c === true,
                        
                        isScheduled: rec.isCreatedByRc__c === true &&  rec.isScheduledCoaching__c === false,
                        //isPending: rec.isCreatedByRc__c === true &&  rec.isScheduledCoaching__c === true,
                        isPending: isPending,

                        pendingReviewLabel: pendingReviewLabel,
                        managerCreatedReviewLabel: managerCreatedReviewLabel,

                        isEditable: !isFinalized,
                        coachingCreatedtype,
                        createdTypeClass,
                        actionTypeRequired: actionType,
                        strengthsCount: strengths.length,
                        developmentAreasCount: development.length,
                        supportCount: support.length,

                    };

                  
                   
                });

                this.scheduledRecords = mappedData.filter(rec => rec.isScheduled);
               
                this.pendingRecords = mappedData.filter(rec => rec.isPending);

                console.log('Scheduled:', JSON.stringify(this.scheduledRecords));
                console.log('Pending:', JSON.stringify(this.pendingRecords));
                 this.managerCreatedRecords = mappedData.filter(rec => rec.isManagerCreated);
                 console.log('Manager created Records:', JSON.stringify(this.managerCreatedRecords));

            })
            .catch(error => {
                console.error('Error fetching coaching sessions:', error);
            });
    }
    

    handleScheduleCoaching(event){
        const data = event.currentTarget.dataset;

        this.coachingRecordId = data.id; 
       
        console.log('Coaching Record Id:', this.coachingRecordId);
        console.log('isManager in handleScheduleCoaching : ', this.isManager);
        //this.loadSingleCoaching();
        this.isCoachingCreateEdit = false;
        setTimeout(() => {
            this.isHome = false;
            //this.mode = 'create';
            this.source = 'schedule';
            this.isCoachingCreateMode=true;
            this.isCoachingViewMode=false;
            this.isManagerCreated=false;
            this.isCoachingTab = false;
            this.activeTab = '';
            this.isCoachingCreateEdit = true; 

        }, 0);
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
    // addStrength() {
    //     this.strengthsList = this.strengthsList.map(item => ({
    //         ...item,
    //         isLast: false,
    //        // showDelete: true
    //     }));

    //     this.strengthsList = [
    //         ...this.strengthsList,
    //         // { id: Date.now(), value: '', isLast: true, showDelete: true}
    //          { id: Date.now(), value: '', isLast: true}
    //     ];
    // }

    // addDevelopment() {
    //     this.developmentList = this.developmentList.map(item => ({
    //         ...item,
    //         isLast: false,
    //        // showDelete: true
    //     }));

    //     this.developmentList = [
    //         ...this.developmentList,
    //         // { id: Date.now(), value: '', isLast: true, showDelete: true }
    //         { id: Date.now(), value: '', isLast: true }
    //     ];
    // }

    // addSupport() {
    //     this.supportList = this.supportList.map(item => ({
    //         ...item,
    //         isLast: false,
    //        // showDelete: true
    //     }));

    //     this.supportList = [
    //         ...this.supportList,
    //         // { id: Date.now(), value: '', isLast: true , showDelete: true}
    //          { id: Date.now(), value: '', isLast: true }
    //     ];
    // }

    // handleStrengthChange(event) {
    //     const index = event.target.dataset.index;
    //     const value = event.target.value;

    //     this.strengthsList = this.strengthsList.map((item, i) => {
    //         return i == index ? { ...item, value } : item;
    //     });
    // }

    // handleDevelopmentChange(event) {
    //     const index = event.target.dataset.index;
    //     const value = event.target.value;

    //     this.developmentList = this.developmentList.map((item, i) => {
    //         return i == index ? { ...item, value } : item;
    //     });
    // }

    // handleSupportChange(event) {
    //     const index = event.target.dataset.index;
    //     const value = event.target.value;

    //     this.supportList = this.supportList.map((item, i) => {
    //         return i == index ? { ...item, value } : item;
    //     });
    // }
    handleChange(event) {
        const index = event.target.dataset.index;
        const value = event.target.value;
        const listName = event.target.name;

        this[listName] = this[listName].map((item, i) => {
            return i == index ? { ...item, value } : item;
        });
    }
    // handleBackFromCoachingCreateEdit() {
    //     this.isHome = true;
    //     this.isPerformanceReview = false;
    //     this.isPerformanceImprovement=false;

    //     this.isHome = true;
    //     this.isScheduleCoaching = false;
    //     this.isCoachingTab = true;
    //     //this.isScheduledTab=true;
    //     //this.activeTab = 'scheduled';
    //     //this.loadCoachingSessions();
    //     this.activeTab = 'pending';
    //     this.loadCoachingSessions();
        
    // }
    //   handleBackFromCoachingCreateEdit() {
    //     this.isHome = true;
    //     this.isPerformanceReview = false;
    //     this.isPerformanceImprovement=false;

    //     this.isHome = true;
    //     this.isScheduleCoaching = false;
    //     this.isCoachingTab = true;
    //     //this.isScheduledTab=true;
    //     //this.activeTab = 'scheduled';
    //     //this.loadCoachingSessions();
    //     this.activeTab = 'pending';
    //     this.loadCoachingSessions();
        
    // }
    //   handleBackFromCoachingCreateEditManager() {
    //     this.isHome = true;
    //     this.isPerformanceReview = false;
    //     this.isPerformanceImprovement=false;

    //     this.isHome = true;
    //     this.isScheduleCoaching = false;
    //     this.isManagerTab = true;
    //     //this.isScheduledTab=true;
    //     //this.activeTab = 'scheduled';
    //     //this.loadCoachingSessions();
    //    // this.activeTab = '';
    //     this.loadCoachingSessions();
        
    // }

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
    handleScheduleReview(event){
        const data = event.currentTarget.dataset;

        this.coachingRecordId = data.id; 

        console.log('Coaching Record Id:', this.coachingRecordId);
        console.log('isManager in handleScheduleReview : ', this.isManager);
        //this.loadSingleCoaching();
         this.isCoachingCreateEdit = false;
        setTimeout(() => {
            this.isHome = false;
            //this.mode = 'create';
            this.source = 'schedule';
           // this.isCoachingCreateMode=true;
            // this.isScheduleCoaching = true;
            this.isCoachingViewMode = true;
            this.isCoachingCreateMode=false;
            this.source = 'schedulereview';
            this.isManagerCreated=false;
            this.isCoachingTab = false;
            this.isManagerTab=false;
            this.activeTab = '';
            this.isCoachingCreateEdit = true; 

        }, 0);

    }
    handleManagerReview(event) {
        const data = event.currentTarget.dataset;

        this.coachingRecordId = data.id; 

       // this.mode = record.isFinalized ? 'view' : 'edit';
        this.isCoachingCreateEdit = false;
        setTimeout(() => {
            this.isManagerCreated = true;
            this.isHome = false;
            this.source = 'managerReview';
            this.isCoachingViewMode = true;
            this.isCoachingCreateMode=false;
            this.isCoachingTab = false;
            this.isManagerTab=false;
            this.activeTab = '';
            this.isCoachingCreateEdit= true;
        }, 0);
    }

     handleCreateCoachingNote(event){

       
        console.log('isManager in handleCreateCoachingNote : ', this.isManager);

        this.coachingRecordId = '';
        console.log('Coaching Record Id:', this.coachingRecordId);

        console.log('Opening CREATE (Manager) mode');
        this.isCoachingCreateEdit = false;
        setTimeout(() => {
        
            this.source = 'managerCreate';

            this.isManagerCreated = true;     
        // this.isManagerCoachingCreateMode = true;
            this.isCoachingViewMode = false;
            this.isHome = false;
            this.isCoachingCreateMode = true;
            //this.isReviewCoaching = false;
            this.isCoachingTab = false;
            this.isManagerTab = false;
            this.activeTab = '';
            this.isCoachingCreateEdit = true;
        }, 0);
    }
    handleBack(event) {

        const source = this.source;

        console.log('BACK FROM:', source);
        this.isCoachingCreateEdit = false;
        this.isHome = true;

        this.mode = null;
        this.coachingRecordId = null;

        if (source === 'managerCreate') {
            this.isManagerTab = true;
            this.isCoachingTab=false;
        }

        if (source === 'schedule') {
            this.isCoachingTab = true;
             this.isManagerTab = false;
            this.activeTab='pending';
        
        }

        if (source === 'schedulereview') {
            this.isCoachingTab = true;
             this.isManagerTab = false;
            this.activeTab='pending';
        }

        if (source === 'managerReview') {
            this.isManagerTab = true;
            this.isCoachingTab=false;
        }
          this.loadCoachingSessions();
    }


}