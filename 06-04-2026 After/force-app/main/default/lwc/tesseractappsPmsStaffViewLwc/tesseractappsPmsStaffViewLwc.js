import { LightningElement, track, api } from 'lwc';
import getTemplatesByStaff from '@salesforce/apex/PmsStaffTemplateController.getTemplatesByStaff';
import saveOrSubmitStaffResponse from '@salesforce/apex/PmsStaffTemplateController.saveOrSubmitStaffResponse';
import getGoalsByStaff from '@salesforce/apex/PmsStaffTemplateController.getGoalsByStaff';
import getCoachingByStaff from '@salesforce/apex/PmsStaffTemplateController.getCoachingByStaff';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TesseractappsPmsStaffViewLwc extends LightningElement {
    @track myPmsFlag = true;
    @track myGoalsFlag = false;
    @api orgId;
    @api staffId;
    @track templates = [];
    @track showDetails=false;
    @track selectedTemplate = {};
    @track isHome = true;
    @track goalsList = [];
    @track isCreateGoal=false;
    // @track currentStep = 0;
    @track staffName;
    @track managerName;
    @track isStaff=true;
    @track isEditGoal = false;
    @track myCoachingFlag = false;
    @track myPipFlag = false;
    @track staffCoachingRecords=[];
    @track isReviewCoaching = false;
    @track isCoachingViewMode=false;
    @track isCoachingCreateMode=false;
    @track coachingRecordId;
    @track isHomeMainContainer = true;

    get myPmsClass(){
        return (this.isHome) ? 'menu-item1' : 'menu-item'; 
    
    }
    get myGoalsClass(){
        return (this.myGoalsFlag) ? 'menu-item1' : 'menu-item'; 
    
    }
    get myCoachingClass(){
        return (this.myCoachingFlag) ? 'menu-item1' : 'menu-item'; 
    
    }
    get myPipClass(){
        return (this.myPipFlag) ? 'menu-item1' : 'menu-item'; 
    
    }
    
    ratingOptions = [
        { label: 'Below Expectations', value: 'Below Expectations' },
        { label: 'Partially Meets Expectations', value: 'Partially Meets Expectations' },
        { label: 'Meets Expectations', value: 'Meets Expectations' },
        { label: 'Exceeds Expectations', value: 'Exceeds Expectations' },
        { label: 'Outstanding', value: 'Outstanding' }
    ];


    connectedCallback(){
        console.log('pms Staffid'+this.staffId);
        this.loadTemplates();
        this.loadGoals();
        if (this.staffId) {
           this.loadCoachingSessions();
        }
    }

    get developmentGoalCount(){
        // return this.goalsList?.length || 0;
        return this.goalsList?.filter(g => g.status === 'Active').length || 0;
    }

    get completedGoalCount(){
        return this.goalsList?.filter(g => g.status === 'Completed').length || 0;
    }

    loadTemplates() {
        getTemplatesByStaff({ staffId: this.staffId })
            .then(result => {
            console.log('result:', JSON.stringify(result));
                this.templates = result.map(template => {
                    this.staffName = template.staffName;
                    this.managerName = template.managerName;
                    console.log('staffName: ', this.staffName );
                    console.log('managerName: ', this.managerName);
                
                    // Merge KPI ratings into KPI array
                    const kpis = template.kpis.map(kpi => ({
                        ...kpi,
                        staffRating: template.kpiRatings?.[kpi.Id] || '',
                        staffComment: template.kpiComments?.[kpi.Id] || ''
                    }));

                    // Merge OKR ratings
                    const okrs = template.okrs.map(okr => ({
                        ...okr,
                        staffRating: template.okrRatings?.[okr.Id] || '',
                        staffComment: template.okrComments?.[okr.Id] || ''
                    }));

                    // Merge Competency ratings
                    const competencies = template.competencies.map(comp => ({
                        ...comp,
                        staffRating: template.competencyRatings?.[comp.Id] || '',
                        staffComment: template.competencyComments?.[comp.Id] || ''
                    }));

                    return {
                        ...template,
                        effectiveDateFormatted: this.formatDate(template.effectiveDate),
                        kpis,
                        okrs,
                        competencies,
                        kpiCount: kpis.length,
                        okrCount: okrs.length,
                        competencyCount: competencies.length
                    };
                });

                console.log('Templates:', JSON.stringify(this.templates));

            })
            .catch(error => {
                console.error(error);
            });
    }

    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    handleMyPms(){
        this.isHome = true;
        this.isHomeMainContainer = true;
        this.myPmsFlag = true;
        this.myCoachingFlag = false;
        this.myPipFlag = false;
        this.myGoalsFlag = false;
        this.showDetails = false;
    }
   
    handleMyCoaching(){
        this.isHomeMainContainer = true;
        this.isHome = false;
        this.myPmsFlag = false;
        this.myCoachingFlag = true;
        this.myPipFlag = false;
        this.myGoalsFlag = false;
        this.showDetails = false;
        if (this.staffId) {
           this.loadCoachingSessions();
        }
    }
    handleMyPip(){
        this.isHome = false;
        this.isHomeMainContainer = true;
        this.myPmsFlag = false;
        this.myCoachingFlag = false;
        this.myPipFlag = true;
        this.myGoalsFlag = false;
        this.showDetails = false;
       
    }
     handleMyGoals(){
        this.isHomeMainContainer = true;
        this.isHomeMainContainer = true;
        this.isHome = false;
        this.myPmsFlag = false;
        this.myCoachingFlag = false;
        this.myPipFlag = false;
        this.myGoalsFlag = true;
        this.showDetails = false;
        this.loadGoals();
    }
    handleClose(){
        this.isHomeMainContainer = true;
        this.isHome = true;
        this.myPmsFlag = true;
        this.myGoalsFlag = false;
        this.showDetails = false;

    }

    handleView(event) {
        const templateId = event.currentTarget.dataset.id;

        const selected = this.templates.find(
            temp => temp.templateId === templateId
        );
        const isAssignedToStaff = selected.Status === 'Assigned to Staff';
        console.log('isAssignedToStaff', isAssignedToStaff);

        this.selectedTemplate = {
            ...selected,
            kpiTabLabel: `KPIs (${selected.kpiCount})`,
            okrTabLabel: `OKRs (${selected.okrCount})`,
            competencyTabLabel: `Competencies (${selected.competencyCount})`,
            EditDisabled: !isAssignedToStaff,
        };

        console.log('Selected Template:', JSON.stringify(this.selectedTemplate));

        this.showDetails = true;
        this.myPmsFlag = false;
    }

    // ==========================
    // KPI HANDLERS
    // ==========================
    handleKpiRatingChange(event) {
        const id = event.target.dataset.id;
        const value = event.detail.value;

        this.selectedTemplate.kpis =
            this.selectedTemplate.kpis.map(kpi =>
                kpi.Id === id ? { ...kpi, staffRating: value } : kpi
            );

            console.log('KPIs:', JSON.stringify(this.selectedTemplate.kpis));
    }

    handleKpiCommentChange(event) {
        const id = event.target.dataset.id;
        const value = event.target.value;

        this.selectedTemplate.kpis =
            this.selectedTemplate.kpis.map(kpi =>
                kpi.Id === id ? { ...kpi, staffComment: value } : kpi
            );
    }

    // ==========================
    // OKR HANDLERS
    // ==========================
    handleOkrRatingChange(event) {
        const id = event.target.dataset.id;
        const value = event.detail.value;

        this.selectedTemplate.okrs =
            this.selectedTemplate.okrs.map(okr =>
                okr.Id === id ? { ...okr, staffRating: value } : okr
            );
    }

    handleOkrCommentChange(event) {
        const id = event.target.dataset.id;
        const value = event.target.value;

        this.selectedTemplate.okrs =
            this.selectedTemplate.okrs.map(okr =>
                okr.Id === id ? { ...okr, staffComment: value } : okr
            );
    }

    // ==========================
    // COMPETENCY HANDLERS
    // ==========================
    handleCompetencyRatingChange(event) {
        const id = event.target.dataset.id;
        const value = event.detail.value;

        this.selectedTemplate.competencies =
            this.selectedTemplate.competencies.map(comp =>
                comp.Id === id ? { ...comp, staffRating: value } : comp
            );
    }

    handleCompetencyCommentChange(event) {
        const id = event.target.dataset.id;
        const value = event.target.value;

        this.selectedTemplate.competencies =
            this.selectedTemplate.competencies.map(comp =>
                comp.Id === id ? { ...comp, staffComment: value } : comp
            );
    }

    // ==========================
    // BUILD PAYLOAD
    // ==========================
    buildPayload() {
        return {
            staffTemplateId: this.selectedTemplate.stafftemplateId,
            kpis: this.selectedTemplate.kpis,
            okrs: this.selectedTemplate.okrs,
            competencies: this.selectedTemplate.competencies
        };

    }

    // ==========================
    // TOAST
    // ==========================
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    handleSaveDraft() {

        const payload = this.buildPayload();

        console.log('Sending to Apex:', JSON.stringify(payload));

        saveOrSubmitStaffResponse({
            requestJson: JSON.stringify(payload),  // MUST MATCH APEX PARAM NAME
            isSubmit: false
        })
        .then(() => {
            this.showToast('Success', 'Draft Saved Successfully', 'success');
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', error.body?.message || 'Error', 'error');
        });
    }

    handleSubmitreview() {

        const payload = this.buildPayload();

        console.log('Sending to Apex:', JSON.stringify(payload));

        saveOrSubmitStaffResponse({
            requestJson: JSON.stringify(payload),  // MUST MATCH APEX PARAM NAME
            isSubmit: true
        })
        .then(() => {
            this.showToast('Success', 'Review Submitted Successfully', 'success');
            this.handleClose();
            this.loadTemplates();
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', error.body?.message || 'Error', 'error');
        });
    }

    handleCreateGoal(){
        this.myGoalsFlag=true;
        this.myPmsFlag=false;
        this.isCreateGoal=true;
        this.isEditGoal=false;

        // this.currentStep = 0;
        // this.clearAllFields();
    }
    handleCloseGoal(){
        this.myPmsFlag=false;
        this.isCreateGoal=false;
        this.myGoalsFlag=true;
        setTimeout(() => {
            this.loadGoals();
        }, 500);
       

    //    // this.listenForOutsideClick = true;
    }
    
    loadGoals() {
        if (!this.staffId) {
            // this.showToast('Error', 'Please select a Staff.', 'error');
            return;
        }
        getGoalsByStaff({ staffId: this.staffId  })
            .then(result => {

                console.log('Goals:', result);
                
                 this.goalsList  = result.map(item => {
                    return {
                        goalId: item.Id,
                        goalName: item.Goal_Title__c,
                        description: item.Goal_Description__c,
                        managerName: item.managerName, 
                        status: item.Goal_Status__c,

                        // dateFormatted:
                        //     item.Goal_Start_Date__c && item.Goal_End_Date__c
                        //     ? item.Goal_Start_Date__c + ' - ' + item.Goal_End_Date__c
                        //     : ''
                        dateFormatted:
                            item.Goal_Start_Date__c && item.Goal_End_Date__c
                            ? `${this.formatDate(item.Goal_Start_Date__c)} - ${this.formatDate(item.Goal_End_Date__c)}`
                            : ''
                    };

                });

            })
            .catch(error => {

                console.error('Error loading goals', error);

                this.showToast(
                    'Error',
                    'Unable to load goals',
                    'error'
                );

            });
    }
    
    handleGoalsView(event){
        const goalId = event.currentTarget.dataset.id;

        console.log('Selected goalId Id:', goalId);

        // Store selected Id
        this.selectedgoalId = goalId;

        this.loadGoals();
        this.myGoalsFlag=true;
        this.myPmsFlag=false;
        this.isCreateGoal=true;
        this.isEditGoal=true;
    }
    loadCoachingSessions() {
        console.log('this.staffId in Loading Coaching Sessions... ', this.staffId);
        getCoachingByStaff({ staffId: this.staffId })
            .then(result => {
                console.log('RAW RESULT in getCoachingByStaff : ', JSON.stringify(result));
                const sessions = result.sessions || [];
                const roles = result.roles || {};
                const managers = result.managers || {};
                this.totalCoachingSessionCount = result.totalCount || 0;
                this.acknowledgedCount = result.acknowledgedCount || 0;
                this.pendingAcknowledgementCount = result.pendingCount || 0;

                // this.staffCoachingRecords = (result.sessions || []).map(session => {
                this.staffCoachingRecords = sessions.map(session => {

                    let actions = session.PMS_Coaching_Action__r || [];

                    // let strengths = actions.filter(a => a.Action_Type__c === 'Strengths');
                    // let development = actions.filter(a => a.Action_Type__c === 'Development Areas');
                    // let Support = actions.filter(a => a.Action_Type__c === 'Support & Resources');
                    let strengths = (actions || []).filter(a => (a.Action_Type__c || '') === 'Strengths');
                    let development = (actions || []).filter(a => (a.Action_Type__c || '') === 'Development Areas');
                    let support = (actions || []).filter(a => (a.Action_Type__c || '') === 'Support & Resources');

                    const child = (session.PMS_Staff_Coaching__r || [])[0] || {};
                    const staff = child.Staff__r || {};
                    
                    const managerId = staff.Manager__c;
                    const manager = managerId && managers[managerId] ? managers[managerId] : {};
                    let isCreatedByRc = session.isCreatedByRc__c;
                    let isCreatedByManager  = session.isCreatedByManager__c || false;
                   // let child = (session.PMS_Staff_Coaching__r || [])[0];

                    const isAcknowledged = child?.Is_Staff_Acknowledged__c || false;
                    const coachingCreatedtype = session.isCreatedByRc__c
                        ? 'Triggered from RC'
                        : 'Created by Manager';
                    let createdTypeClass = 'slds-badge slds-badge_light slds-truncate ';

                    // Based on type
                    if (session.isCreatedByRc__c) {
                        createdTypeClass += 'badge-rc'; // Purple
                    } else {
                        createdTypeClass += 'coaching-badge'; // Orange
                    }
                    
                    return {
                        Id: session.Id,
                        hrContact:session.HR_Name__c || '', 
                        coachingTitle: session.Coaching_Title__c || '',
                        coachingType: session.Coaching_Type__c || '',
                        coachingDescription: session.Coaching_Description__c || '',

                        coachingCreatedtype: coachingCreatedtype,

                        coachingCreatedDate: this.formatDate(session.CreatedDate),
                        coachingLastUpdated: this.formatDate(session.LastModifiedDate),

                        reviewCycleName: session.PMS_Review_Cycle__r?.Name || '',
                        criteria: session.PMS_Staff_Template__r?.PMS_Role_Template__r?.Role_Title__c || '',

                        //employeeName: session.PMS_Staff_Template__r?.Staff__r?.Display_Nickname__c || '',
                        //email: session.PMS_Staff_Template__r?.Staff__r?.Email_Address__c || '',
                        role: roles[child.Staff__c] || '',

                        manager: manager.Display_Nickname__c || '',
                        managerEmail: manager.Email_Address__c || '',
                        managerProfileUrl: manager.picture__c || '',
                       // staffProfileUrl: session.PMS_Staff_Template__r?.Staff__r?.picture__c || '',
                        employeeName: staff.Display_Nickname__c || '',
                        email: staff.Email_Address__c || '',
                        staffProfileUrl: staff.picture__c || '',
                        managerId: staff.Manager__c || '',
                        staffType: child.Staff_Type__c || 'Staff',
                        staffType: child.Staff_Type__c || 'Staff',

                        strengthsCount: strengths.length,
                        developmentAreasCount: development.length,
                        supportCount: support.length,

                        buttonLabel: isAcknowledged ? 'View' : 'Review and Acknowledge',
                        isAcknowledged: isAcknowledged,
                        // employeeComment: child?.Staff_Coaching_Comments__c || '',
                        // managerComment: child?.Manager_Coaching_Comments__c || '',
                        employeeComment: child.Staff_Coaching_Comments__c || '',
                        managerComment: child.Manager_Coaching_Comments__c || '',

                        isCreatedByRc: session.isCreatedByRc__c,
                        createdTypeClass

                        //hrContact: session.CreatedBy?.Name || '',
                        //reviewDate: this.formatDate(session.PMS_Staff_Template__r?.Manager_Submitted_Date__c)
                    };
                });

                console.log('Formatted Records:', JSON.stringify(this.staffCoachingRecords));

            })
            .catch(error => {
                console.error('ERROR:', error);
            });
    }
    
    handleStaffReview(event){
        console.log('Staff Review Clicked...');

        this.coachingRecordId = event.currentTarget.dataset.id; 
        this.isReviewCoaching=false;
        setTimeout(() => {
           
            this.isCoachingViewMode = true;
            this.isCoachingCreateMode=false;
            this.isHome = false;
            this.myPmsFlag = false;
            this.myCoachingFlag = false;
            this.myPipFlag = false;
            this.myGoalsFlag = false;
            this.showDetails = false;
            this.isHomeMainContainer = false;
            this.isReviewCoaching=true;
         }, 0);    

    }
    handleBackFromCoachingCreateEdit() {
       
        this.isHome = false;
        this.myPmsFlag = false;
        this.myCoachingFlag = true;
        this.myPipFlag = false;
        this.myGoalsFlag = false;
        this.showDetails = false;
        this.isCreateGoal=false;
        this.isHomeMainContainer = true;
        // this.isReviewCoaching=false;
        setTimeout(() => {
            this.loadCoachingSessions();
        }, 500);
        
    }

    

}