import { LightningElement, track, api } from 'lwc';
import getTemplatesByManager from '@salesforce/apex/PmsManagerTemplateController.getTemplatesByManager';
import SubmitManagerResponse from '@salesforce/apex/PmsManagerTemplateController.SubmitManagerResponse';
import ReassignToStaff from '@salesforce/apex/PmsManagerTemplateController.ReassignToStaff';
import getGoalsByManager from '@salesforce/apex/PmsManagerTemplateController.getGoalsByManager';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TesseractappsPmsManagerViewLwc extends LightningElement {
    @track MyPmsFlag = true;
    //@track MyGoalsFlag = false;
    @api managerId;
    @track totalEmployees = 0;
    @track submittedCount = 0;
    @track completedCount = 0;
    @track pendingCount = 0;
    @track ReviewFlag = false;
    @track SelectedStaff;
    @track reviews =[];
    @track pendingReviews =[];
    @track completedReviews =[];
    @track goalsList=[];
    @track selectedgoalId;
    @track isCreateGoal = false;
    @track isManager=true;
    @track isEditGoal = false;
    @track selectedFacilityId;
     @track selectedFacilityName = '';
    activeTab = 'KPI';
    activeTab1 = 'pending';
    @track handleReturnRequestFlag=false;
    @track showWorkflowHelp= false;

     ratingOptions = [
    { label: 'Below Expectations', value: 'Below Expectations' },
    { label: 'Partially Meets Expectations', value: 'Partially Meets Expectations' },
    { label: 'Meets Expectations', value: 'Meets Expectations' },
    { label: 'Exceeds Expectations', value: 'Exceeds Expectations' },
    { label: 'Outstanding', value: 'Outstanding' }
    ];

    handleTabClick(event){
        this.activeTab = event.currentTarget.dataset.tab;
    }

    handleTabChange(event) {
        this.activeTab1 = event.target.dataset.tab;
        if (this.activeTab1 === 'goals') {
            this.loadGoals();
        }
   }

    get isKPI(){
        return this.activeTab === 'KPI';
    }

    get isOKR(){
        return this.activeTab === 'OKR';
    }

    get isCompetency(){
        return this.activeTab === 'COMP';
    }

    get activeTabPending() {
    return this.activeTab1 === 'pending';
    }

    get activeTabCompleted() {
        return this.activeTab1 === 'completed';
    }

    get activeTabGoals() {
        return this.activeTab1 === 'goals';
    }

     get PendingClass() {
        return this.activeTab1 === 'pending' ? 'tab active' : 'tab';
    }

    get CompletedClass() {
        return this.activeTab1 === 'completed' ? 'tab active' : 'tab';
    }

     get goalsClass() {
        return this.activeTab1 === 'goals' ? 'tab active' : 'tab';
    }


        get kpiTabClass() {
        return this.activeTab === 'KPI' ? 'tab active' : 'tab';
    }

    get okrTabClass() {
        return this.activeTab === 'OKR' ? 'tab active' : 'tab';
    }

    get compTabClass() {
        return this.activeTab === 'COMP' ? 'tab active' : 'tab';
    }

      get MyPmsClass(){
        return (this.MyPmsFlag) ? 'menu-item1' : 'menu-item'; 
    
    }
    // get MyGoalsClass(){
    //     return (this.MyGoalsFlag) ? 'menu-item1' : 'menu-item'; 
    
    // }
    
     connectedCallback() {
        this.loadReviews();
        this.selectedFacilityId = localStorage.getItem("defaultFacilityId");
        console.log('selectedFacilityId: ' + this.selectedFacilityId);
        this.selectedFacilityName = localStorage.getItem("defaultFacilityLabel");
        console.log('selectedFacilityName : ',this.selectedFacilityName);
    }

    loadReviews() {
        if (!this.managerId) {
            console.error('Manager Id not provided');
            return;
        }
          //if (!this.selectedFacilityId) return;

        this.isLoading = true;

        getTemplatesByManager({ managerId: this.managerId })
            .then(result => {
                console.log('Apex Result:', JSON.stringify(result));
         this.reviews = result.map(review => {

                // ===== COMPETENCIES =====
                const competencies = review.competencies.map(comp => ({
                    ...comp,
                    comment: review.competencyComments?.[comp.Id] || '',
                    rating: review.competencyRatings?.[comp.Id] || '',
                    ManagerComment: review.managerCompetencyComments?.[comp.Id] || '',
                    ManagerRating: review.managerCompetencyRatings?.[comp.Id] || ''
                    
                }));

                // ===== KPIs =====
                const kpis = review.kpis.map(kpi => ({
                    ...kpi,
                    comment: review.kpiComments?.[kpi.Id] || '',
                    rating: review.kpiRatings?.[kpi.Id] || '',
                    ManagerComment: review.managerKpiComments?.[kpi.Id] || '',
                    ManagerRating: review.managerKpiRatings?.[kpi.Id] || ''
                }));

                // ===== OKRs =====
                const okrs = review.okrs.map(okr => ({
                    ...okr,
                    comment: review.okrComments?.[okr.Id] || '',
                    rating: review.okrRatings?.[okr.Id] || '',
                    ManagerComment: review.managerOkrComments?.[okr.Id] || '',
                    ManagerRating: review.managerOkrRatings?.[okr.Id] || '' 
                }));

                return {
                    staffTemplateId: review.stafftemplateId,
                    staffId:review.StaffId,
                    staffName: review.staffName,
                    roleTitle: review.roleTitle,
                    cycle: review.ReviewcycleName,
                    effectiveDate: review.effectiveDate,
                    Email:review.Email,
                    managerName:review.managerName,
                    staffSubmittedDate: review.staffSubmittedDate? new Intl.DateTimeFormat('en-GB').format(new Date(review.staffSubmittedDate)).replace(/\//g, '/'): '',
                    status:review.Status,
                    Staffstatus:(review.Status === 'Assigned to Staff') ? 'Pending' : 'Submitted',
                    statusClass: (!review.Status || review.Status === 'Assigned to Staff') ? 'status-pending': 'status-submitted',
                    isEditable:review.isEditable,
                    ManagerComments:review.ManagerComments,
                    // pendingReviewLabel:( review.Status === 'Submitted to HR' || review.Status === 'Completed' )
                    //                             ? 'View'
                    //                             : 'Start Review',
                    competencies,
                    kpis,
                    okrs,
                    kpiCount: kpis.length,
                    okrCount: okrs.length,
                    competencyCount: competencies.length
                };
            });
                this.error = undefined;
                 console.log('Review Result:', JSON.stringify(this.reviews));

                  this.pendingReviews = this.reviews.filter(
                    r => r.status === 'Assigned to Staff'|| r.status === 'Submitted to Manager'
                );
                 console.log('Pending Review Result:', JSON.stringify(this.pendingReviews));

                this.completedReviews = this.reviews.filter(
                    r => r.status === 'Submitted to HR' || r.status === 'Completed'
                );
                 console.log('Completed Review Result:', JSON.stringify(this.completedReviews));
                   this.totalEmployees = this.reviews.length;

                this.completedCount = this.reviews.filter(
                    r => r.status === 'Submitted to HR' || r.status === 'Completed'
                ).length;

                this.submittedCount = this.reviews.filter(
                    r => r.status === 'Submitted to Manager'
                ).length;

                this.pendingCount = this.reviews.filter(
                    r => r.status === 'Assigned to Staff'
                ).length;
            })
            .catch(error => {
                console.error('Error:', error);
                this.error = error.body ? error.body.message : error.message;
                this.reviews = [];
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleMyPms() {
        this.MyPmsFlag = true;
       // this.MyGoalsFlag = false;
        this.ReviewFlag = false;
    }

     handleMyPms() {
        this.MyPmsFlag = true;
        //this.MyGoalsFlag = false;
        this.ReviewFlag = false;
    }

    handleReview(event){
         const selectedId = event.currentTarget.dataset.staffid;
          const reviewType = event.currentTarget.dataset.type;

        // Find selected staff
        const selected = this.reviews.find(
            staff => staff.staffId === selectedId
        );
         this.showWorkflowHelp = reviewType === 'pending';
         if (selected.Staffstatus === 'Pending') {
            this.showToast('Error', 'Staff has not submitted the review yet.', 'error');
            return;
        }
         this.SelectedStaff = {
        ...selected,
        kpiTabLabel: `KPIs (${selected.kpiCount})`,
        okrTabLabel: `OKRs (${selected.okrCount})`,
        competencyTabLabel: `Competencies (${selected.competencyCount})`,
       /*  EditDisabled: !isAssignedToStaff, */
    };
        console.log(' this.SelectedStaff',JSON.stringify( this.SelectedStaff));
        this.MyPmsFlag = false;
        //this.MyGoalsFlag = false;
        this.ReviewFlag = true;
    }


      // ==========================
        // KPI HANDLERS
        // ==========================
        handleKpiRatingChange(event) {
            const id = event.target.dataset.id;
            const value = event.detail.value;
    
            this.SelectedStaff.kpis =
                this.SelectedStaff.kpis.map(kpi =>
                    kpi.Id === id ? { ...kpi, ManagerRating: value } : kpi
                );
    
                console.log('KPIs:', JSON.stringify(this.SelectedStaff.kpis));
        }
    
        handleKpiCommentChange(event) {
            const id = event.target.dataset.id;
            const value = event.target.value;
    
            this.SelectedStaff.kpis =
                this.SelectedStaff.kpis.map(kpi =>
                    kpi.Id === id ? { ...kpi, ManagerComment: value } : kpi
                );
        }
    
        // ==========================
        // OKR HANDLERS
        // ==========================
        handleOkrRatingChange(event) {
            const id = event.target.dataset.id;
            const value = event.detail.value;
    
            this.SelectedStaff.okrs =
                this.SelectedStaff.okrs.map(okr =>
                    okr.Id === id ? { ...okr, ManagerRating: value } : okr
                );
        }
    
        handleOkrCommentChange(event) {
            const id = event.target.dataset.id;
            const value = event.target.value;
    
            this.SelectedStaff.okrs =
                this.SelectedStaff.okrs.map(okr =>
                    okr.Id === id ? { ...okr, ManagerComment: value } : okr
                );
        }
    
        // ==========================
        // COMPETENCY HANDLERS
        // ==========================
        handleCompetencyRatingChange(event) {
            const id = event.target.dataset.id;
            const value = event.detail.value;
    
            this.SelectedStaff.competencies =
                this.SelectedStaff.competencies.map(comp =>
                    comp.Id === id ? { ...comp, ManagerRating: value } : comp
                );
        }
    
        handleCompetencyCommentChange(event) {
            const id = event.target.dataset.id;
            const value = event.target.value;
    
            this.SelectedStaff.competencies =
                this.SelectedStaff.competencies.map(comp =>
                    comp.Id === id ? { ...comp, ManagerComment: value } : comp
                );
        }
    
        // ==========================
        // BUILD PAYLOAD
        // ==========================
        buildPayload() {
            return {
                staffTemplateId: this.SelectedStaff.staffTemplateId,
                managerComments: this.SelectedStaff.ManagerComments,
                kpis: this.SelectedStaff.kpis,
                okrs: this.SelectedStaff.okrs,
                competencies: this.SelectedStaff.competencies
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

            handleManagerComment(event){
        this.SelectedStaff.ManagerComments = event.target.value;
    }
    
    
        handleSubmit() {
    
        const payload = this.buildPayload();
    
        console.log('Sending to Apex:', JSON.stringify(payload));
    
         SubmitManagerResponse({
            requestJson: JSON.stringify(payload),  // MUST MATCH APEX PARAM NAME
            isSubmit: true
        })
        .then(() => {
            this.showToast('Success', 'Review Submitted Successfully', 'success');
            this.loadReviews();
             this.handleMyPms();
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', error.body?.message || 'Error', 'error');
        });  
    }


    // handleReassign() {
             
    //     const stafftemplateId = this.SelectedStaff.staffTemplateId;
    //     ReassignToStaff({ staffTemplateId: stafftemplateId })
    //     .then(() => {
    //         console.log('Status updated');
    //         this.showToast('Success', 'Reassigned to Staff Successfully', 'success');
    //          this.loadReviews();
    //          this.handleMyPms();
    //     })
    //     .catch(error => {
    //         console.error(error);
    //     });
    // }
    
    handleReassign() {

        this.handleReturnRequestFlag = true;
    }
    handleNoRequestChanges() {

        this.handleReturnRequestFlag = false;
    }
    handleYesRequestChanges() {

        this.handleReturnRequestFlag = false;
        const stafftemplateId = this.SelectedStaff.staffTemplateId;
         if (!stafftemplateId) {
            this.showToast('Error', 'Template Id is missing.', 'error');
            return;
        }
        ReassignToStaff({ staffTemplateId: stafftemplateId })
        .then(() => {
            console.log('Status updated');
            this.showToast('Success', 'Reassigned to Staff Successfully', 'success');
             this.loadReviews();
             this.handleMyPms();
        })
        .catch(error => {
            console.error(error);
        });
    }

    handleback() {
        const event = new CustomEvent('back');
        this.dispatchEvent(event);
    }
    loadGoals() {
        console.log('loadGoals called');
          if (!this.selectedFacilityId) return;
        getGoalsByManager({facilityId: this.selectedFacilityId, managerId: this.managerId })
            .then(result => {

                console.log('Goals:', result);

                this.goalsList = result.map(item => ({
                    goalId: item.Id,
                    staffName: item.Staff__r.Display_Nickname__c,
                    goalName: item.Goal_Title__c,
                    goalType: item.Goal_Type__c,
                    dateFormatted:
                        `${this.formatDate(item.Goal_Start_Date__c)} - ${this.formatDate(item.Goal_End_Date__c)}`,
                    status: item.Goal_Status__c || ''
                }));

            })
            .catch(error => {
                console.error('Error loading goals', error);
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
    handleGoalsView(event){
        const goalId = event.currentTarget.dataset.id;

        console.log('Selected goalId Id:', goalId);

        // Store selected Id
        this.selectedgoalId = goalId;

        this.loadGoals();
        this.activeTab1 = 'goals'
        this.isEditGoal=true;
        this.isCreateGoal=true;
    }
    handleCloseGoal(){
        //this.MyPmsFlag=false;
        this.isCreateGoal=false;
       // this.MyGoalsFlag=true;
        this.activeTab1 = 'goals'
        setTimeout(() => {
            this.loadGoals();
        }, 500);
       

    //    // this.listenForOutsideClick = true;
    }
    // get reviewWorkflowTooltip() {
    //     const staffName = this.SelectedStaff?.staffName || 'the employee';

    //     return `Review Workflow

    //         What happens after you submit this review

    //         1. Submit for Discussion
    //         Complete your ratings and click submit below.

    //         2. Schedule Discussion Meeting
    //         Meet with ${staffName} to discuss performance, listen to feedback, and agree on goals.

    //         3. Finalize for HR
    //         After the meeting, finalize the review to send it to HR for approval.

    //         4. HR Final Review
    //         HR reviews and approves compensation decisions.`;
    // }
//     get reviewWorkflowTooltip() {
//         const staffName = this.SelectedStaff?.staffName || 'the employee';
    
//         return [
//             'Review Workflow',
//             '',
//             '1. Submit for Discussion',
//             '   Complete your ratings and click Submit.',
//             '',
//             '2. Schedule Discussion Meeting',
//             `   Meet with ${staffName} to discuss performance, feedback, and goals.`,
//             '',
//             '3. Finalize for HR',
//             '   After the meeting, finalize the review and send it to HR.',
//             '',
//             '4. HR Final Review',
//             '   HR reviews and approves compensation decisions.'
//         ].join('\n');
// }
get reviewWorkflowTooltip() {
    const staffName = this.SelectedStaff?.staffName || 'the employee';

    return 'Review Workflow\r\n\r\n' +
           'What happens after you submit this review\r\n\r\n' +
           '1. Submit for Discussion\r\n' +
           'Complete your ratings and click Submit.\r\n\r\n' +
           '2. Schedule Discussion Meeting\r\n' +
           `Meet with ${staffName} to discuss performance, feedback, and goals.\r\n\r\n` +
           '3. Finalize for HR\r\n' +
           'After the meeting, finalize the review and send it to HR.\r\n\r\n' +
           '4. HR Final Review\r\n' +
           'HR reviews and approves compensation decisions.';
}
  isVisible = false;

    showTooltip() {
        this.isVisible = true;
    }

    hideTooltip() {
        this.isVisible = false;
    }

    
}