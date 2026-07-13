import { LightningElement, wire, api, track } from "lwc";
import getHrCoachingSessions from '@salesforce/apex/PmsController.getHrCoachingSessions';
//import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class TesseractAppsPmsHrCoachingLwc extends LightningElement {

    @api isHr;
    @api isManager;
    @api hrId;
    @api hrName;
    @track isPendingReviewTab = true;
    @track isHrTab = false;
    @track isHome = true;
    @track pendingRecords = [];
    @track coachingRecordId;
    @track isCoachingCreateEdit= false;
    @track selectedFacilityId;
    @track selectedFacilityName = '';
    @track isCoachingViewMode=false;
    @track isCoachingCreateMode=false;

    get pendingReviewTabClass(){
        return this.isPendingReviewTab ? 'menu-item1' : 'menu-item'; 
    }

    get hrTabClass(){
        return this.isHrTab ? 'menu-item1' : 'menu-item'; 
    }
     connectedCallback() {
        console.log('connectedCallback in TesseractAppsPmsHrCoachingLwc ');
       
        console.log('isManager:', this.isManager);
       // console.log('isStaff:', this.isStaff);
        console.log('isHr:', this.isHr);
        console.log('hrId : ', this.hrId);
        console.log('hrName : ',this.hrName);
        // console.log('isManagerCreated:', this.isManagerCreated);
        // console.log('isCreatedByManager:', this.isCreatedByManager);
        this.selectedFacilityId = localStorage.getItem("defaultFacilityId");
        console.log('selectedFacilityId: ' + this.selectedFacilityId);
        this.selectedFacilityName = localStorage.getItem("defaultFacilityLabel");
        console.log('selectedFacilityName : ',this.selectedFacilityName);
        if (this.selectedFacilityId) {
           this.loadCoachingSessions();
        } 
    }
    handlePendingReviewClick() {
        this.isPendingReviewTab = true;
        this.isHrTab = false;
        this.loadCoachingSessions();
       

    }

    handleHrClick() {
        this.isPendingReviewTab = false;
        this.isHrTab = true;
        // this.loadCoachingSessions();
    }
    loadCoachingSessions() {
        console.log('Loading coaching sessions...');
        console.log('selectedFacilityId in loadCoachingSessions:', this.selectedFacilityId);
            if (!this.selectedFacilityId) return;

        getHrCoachingSessions({ facilityId: this.selectedFacilityId })
            .then(result => {
                console.log('Result in getHrCoachingSessions : ', JSON.stringify(result));

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
                    const managerAckDate = firstChild?.Manager_Acknowledged_Date__c;
                    const staffAckDate = firstChild?.Staff_Acknowledged_Date__c;
                    //const hrAckDate = rec.HR_Acknowledged_Date__c;

                    console.log('staffId: ', staffId);
                    console.log('mgrId: ', mgrId);
                    console.log('manager: ', manager);
                    console.log('roleName: ', roleName);

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
                        ? (staffAckDate ? 'View' : 'Review')
                        : '';

                    //  Manager Label Logic
                    const managerCreatedReviewLabel = isManagerCreated
                        ? (managerAckDate ? 'View' : 'Review')
                        : '';
                    const hrReviewLabel = isRc || isManagerCreated
                        ? (hrAckDate ? 'View' : 'Review')
                        : '';
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
                        createdTypeClass,
                        
                        // COUNTS
                        employeeCount,
                        //roleCount,
                        managerCount:managerCount ||0,
                        hrCount:hrCount || 0,
                        coachingCreatedtype: coachingCreatedtype,
                        actionTypeRequired: actionType,

                        employeeName: employeeNames || '',
                        email: firstChild?.Staff__r?.Email_Address__c || '',
                        staffProfileUrl: profileUrl,

                        role: roleName || '',
                        criteria: rec.PMS_Staff_Template__r?.PMS_Role_Template__r?.Role_Title__c || '',
                        reviewCycleName: rec.PMS_Review_Cycle__r?.Name || '',

                        manager: manager?.Display_Nickname__c || '',
                        managerEmail: manager?.Email_Address__c || '',
                       // hrContact: '', 
                        hrContact:rec.HR_Name__c || '',

                        reviewDate: rec.PMS_Staff_Template__r?.Manager_Submitted_Date__c
                            ? this.formatDateTime(rec.PMS_Staff_Template__r.Manager_Submitted_Date__c)
                            : '',

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
                        hrReviewLabel:hrReviewLabel,
                        isEditable: !isFinalized,
                        coachingCreatedtype,
                        actionTypeRequired: actionType,
                        strengthsCount: strengths.length,
                        developmentAreasCount: development.length,
                        supportCount: support.length,

                    };

                    
                    
                });

                
                
                this.pendingRecords = mappedData;

                // console.log('Scheduled:', JSON.stringify(this.scheduledRecords));
                 console.log('Pending:', JSON.stringify(this.pendingRecords));
                //  this.managerCreatedRecords = mappedData.filter(rec => rec.isManagerCreated);
                //  console.log('Manager created Records:', JSON.stringify(this.managerCreatedRecords));

            })
            .catch(error => {
                console.error('Error fetching coaching sessions:', error);
            });
    }
    handleHrReview(event){
        const data = event.currentTarget.dataset;

        this.coachingRecordId = data.id; 

        console.log('Coaching Record Id:', this.coachingRecordId);
        console.log('isManager in handleScheduleReview : ', this.isManager);
        console.log('isHr : ', this.isHr);
        //this.loadSingleCoaching();
         this.isCoachingCreateEdit = false;
        setTimeout(() => {
            this.isHome = false;
            this.isCoachingViewMode = true;
            this.isCoachingCreateMode=false;
            this.isPendingReviewTab = false;
            this.isHrTab=false;
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
       handleBack(event) {

        console.log('BACK FROM:');
        this.isCoachingCreateEdit = false;
        this.isHome = true;
        this.coachingRecordId = null;
        this.isManagerTab = true;
        this.isPendingReviewTab = true;
        this.isHrTab=false;
          this.loadCoachingSessions();
    }


}