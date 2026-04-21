import { LightningElement, wire, api, track } from "lwc";
import getAllStaffTemplates from '@salesforce/apex/PmsController.getAllStaffTemplates';
import getStaffTemplateDetailsById from '@salesforce/apex/PmsController.getStaffTemplateDetailsById';
import saveHrResponseData from '@salesforce/apex/PmsController.saveHrResponseData';
import getAllGoalsByFacility from '@salesforce/apex/PmsController.getAllGoalsByFacility';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import reassignToManager from '@salesforce/apex/PmsController.ReassignToManager';

export default class TesseractAppsPmsHrViewLwc extends LightningElement {
    @track hrViewFlag = true;
    @track selectedFacilityId;
    @track selectedFacilityName;
    @track staffTemplateList = [];
    @track isStaffHomeTable=true;
    @track isStaffTemplateView=false;
    @track staffKpiList=[];
    @track staffOkrList=[];
    @track staffCompetencyList =[];
    @track templateStaffName;
    @track templateStaffEmail;
    @track templateStaffmanager;
    @track performanceRating;
    @track potentialRating;
    @track flightRiskLevel;
    @track readinessLevel;
    @track adjustRating ;
    @track justification;
    @track salaryAdjustment;
    @track bonusAdjustment;
    @track approvePromotion = false;
    @track hrNotes;
    @track managerRequest;
    //@track isHrFieldsDisabled=false;
    @track templateStatus;
    pendingReviewsCount = 0;
    finalizedCount = 0;
    coachingNotesCount = 0;
    @track goalsCreatedCount = 0;
    @track newJobTitle = '';
    activeTab1 = 'reviews';
    @track goalsList=[];
    @track selectedgoalId;
    @track isCreateGoal = false;
    @track isHr=true;
    @track isEditGoal = false;
    @track staffId;
    // finalScore = 91.6;

    // scoreCards = [
    //     {
    //         id: 1,
    //         label: 'KPI Performance',
    //         weight: 50,
    //         score: 40,
    //         color: 'blue'
    //     },
    //     {
    //         id: 2,
    //         label: 'OKR Achievements',
    //         weight: 35,
    //         score: 78,
    //         color: 'lightblue'
    //     },
    //     {
    //         id: 3,
    //         label: 'Behavioral Competencies',
    //         weight: 15,
    //         score: 98,
    //         color: 'green'
    //     }
    // ];    
        
    //@track hrId='';

    // @track staffTemplateList = [
    //     {
    //         Id: "1",
    //         staffName: "Sara Chen",
    //         email: "Smith.887t@agegrase.com",
    //         role: "Senior Software Account",
    //         manager: "John Gresham",
    //         reviewCycle: "2025 Performance Review",
    //         templateName: "Engineering Template",
    //         status: "Submitted"
    //     }
    // ];

    // KPI LIST (DYNAMIC)
    // @track staffKpiList = [
    //     {
    //         id: 1,
    //         title: "Sprint Velocity (KPI)",
    //         type: "Delivery",
    //         description: "Average story points completed per sprint",
    //         target: "43%",
    //         weight: "66%",
    //         employee: {
    //             rating: "Meet expectations",
    //             comment:
    //                 "I think I meet expectations and have done a very good job completing sprint tasks."
    //         },
    //         manager: {
    //             rating: "Low expectations",
    //             comment:
    //                 "Velocity could improve but quality of work is good."
    //         }
    //     },

    //     {
    //         id: 2,
    //         title: "Code Quality",
    //         type: "Engineering",
    //         description: "Maintain clean, scalable and testable code",
    //         target: "85%",
    //         weight: "20%",
    //         employee: {
    //             rating: "Exceeds expectations",
    //             comment:
    //                 "Focused on improving maintainability and reduced bugs."
    //         },
    //         manager: {
    //             rating: "Meet expectations",
    //             comment:
    //                 "Code quality is good but documentation can improve."
    //         }
    //     }
    // ];
    

    @track activeTab = 'compare';

    handleTabClick(event) {
        this.activeTab = event.target.dataset.tab;
        console.log(' this.activeTab : ', this.activeTab);
    }
    get hrViewClass(){
        return (this.hrViewFlag) ? 'menu-item1' : 'menu-item';
   
    }
 
    // get overviewTabClass() {
    //     return this.activeTab === 'overview' ? 'tab active' : 'tab';
    // }

    get compareTabClass() {
        return this.activeTab === 'compare' ? 'tab active' : 'tab';
    }

    get talentTabClass() {
        return this.activeTab === 'talent' ? 'tab active' : 'tab';
    }

    get actionTabClass() {
        return this.activeTab === 'action' ? 'tab active' : 'tab';
    }

    // get isOverviewTab() {
    //     return this.activeTab === 'overview';
    // }
    get isCompareTab() {
        return this.activeTab === 'compare';
    }

    get isTalentTab() {
        return this.activeTab === 'talent';
    }

    get isActionTab() {
        return this.activeTab === "action";
    }

    // performanceOptions = [
    //     { label: "High - Top Performer", value: "high" },
    //     { label: "Medium - Solid Performer", value: "medium" },
    //     { label: "Low - Need Development", value: "low" }
    // ];

    // potentialOptions = [
    //     { label: "High - Ready for next Level", value: "high" },
    //     { label: "Medium - Growing Potential", value: "medium" },
    //     { label: "Low - Limited Growth", value: "low" }
    // ];

    // riskOptions = [
    //     { label: "Low - Stable and Engaged", value: "low" },
    //     { label: "Medium - Monitor closely", value: "medium" },
    //     { label: "High - Retention Risk", value: "high" },
    //     { label: "Critical - Action", value: "critical" }
    // ];

    // readinessOptions = [
    //     { label: "Ready Now (0-6 Months)", value: "now" },
    //     { label: "Ready In (1 Year)", value: "year" },
    //     { label: "Ready In (2+ Year)", value: "later" },
    //     { label: "Not Ready", value: "notready" }
    // ]; 
    performanceOptions = [
        { label: "High - Top Performer", value: "High - Top Performer" },
        { label: "Medium - Solid Performer", value: "Medium - Solid Performer" },
        { label: "Low - Need Development", value: "Low - Need Development" }
    ];

    potentialOptions = [
        { label: "High - Ready for next Level", value: "High - Ready for next Level" },
        { label: "Medium - Growing Potential", value: "Medium - Growing Potential" },
        { label: "Low - Limited Growth", value: "Low - Limited Growth" }
    ];

    riskOptions = [
        { label: "Low - Stable and Engaged", value: "Low - Stable and Engaged" },
        { label: "Medium - Monitor closely", value: "Medium - Monitor closely" },
        { label: "High - Retention Risk", value: "High - Retention Risk" },
        { label: "Critical - Action", value: "Critical - Action" }
    ];

    readinessOptions = [
        { label: "Ready Now (0-6 Months)", value: "Ready Now (0-6 Months)" },
        { label: "Ready In (1 Year)", value: "Ready In (1 Year)" },
        { label: "Ready In (2+ Year)", value: "Ready In (2+ Year)" },
        { label: "Not Ready", value: "Not Ready" }
    ];
    
// ACTION TAB DATA

    // @track actionData = {
    //     finalScore: "95.7%",
    //     ratingLabel: "Exceptional",
    //     adjustRating: "",
    //     justification: "",
    //     salaryAdjustment: "",
    //     bonusAdjustment: "",
    //     approvePromotion: false,
    //     //pipEnabled: false,
    //     hrNotes: "",
    //     managerRequest: ""
    // };

    // ratingOptions = [
    //     { label: "Exceptional", value: "Exceptional" },
    //     { label: "Exceeds Expectations", value: "Exceeds Expectations" },
    //     { label: "Meets Expectations", value: "Meets Expectations" },
    //     { label: "Needs Improvement", value: "Needs Improvement" }
    // ];    
    connectedCallback() {
        console.log('connectedCallback in TesseractAppsPmsHrViewLwc: ');
        // const storedFacilityId = localStorage.getItem("defaultFacilityId");
        this.selectedFacilityId = localStorage.getItem("defaultFacilityId");
        console.log('selectedFacilityId: ' + this.selectedFacilityId);
        this.selectedFacilityName = localStorage.getItem("defaultFacilityLabel");
        console.log('selectedFacilityName : ',this.selectedFacilityName);
        this.activeTab === 'compare';
        this.loadStaffTemplates(); 
        this.loadGoals();
        // this.scoreCards = this.scoreCards.map(card => {
        //             return {
        //                 ...card,
        //                 progressStyle: `width:${card.score}%`,
        //                 progressClass: `progress-fill ${card.color}`,
        //                 scoreClass: `score-text ${card.color}`,
        //                 calculationText: `${card.score}% = ${(card.score * card.weight / 100).toFixed(0)}% Weight`
        //             };
        //         });
    }
    get promotionToggleTrack() {
        return this.approvePromotion ? 'toggle-track active' : 'toggle-track';
    }

    get promotionToggleKnob() {
        return this.approvePromotion ? 'toggle-knob active' : 'toggle-knob';
    }

    get promotionToggleLabelClass() {
        return this.approvePromotion ? 'toggle-label active' : 'toggle-label inactive';
    }

    get promotionToggleLabel() {
        return this.approvePromotion ? 'Active' : 'Inactive';
    }
    handlePromotionToggle() {

        if(this.isHrFieldsDisabled){
            return;
        }

        this.approvePromotion = !this.approvePromotion;

       // this.isNewTitleDisabled = !this.approvePromotion;
    }

    loadStaffTemplates() {
           if (!this.selectedFacilityId) {
               console.error('Facility Id not provided');
               return;
           }
   
        getAllStaffTemplates({ facilityId: this.selectedFacilityId })
        .then(result => {
            console.log('result: ',JSON.stringify(result));

            const templates = result.templates;
            const roles = result.roles;
            const managers = result.managers;
            this.pendingReviewsCount = 0;
            this.finalizedCount = 0;

            this.staffTemplateList = templates.map(t => {
                const status = t.Status__c || '';

                // count based on status
                if (status === 'Completed') {
                    this.finalizedCount++;
                } else {
                    this.pendingReviewsCount++;
                }
                return {
                    Id: t.Id,
                    staffName: t.Staff__r.Display_Nickname__c || '',
                    email: t.Staff__r.Email_Address__c || '',
                    role: roles[t.Staff__c] || '',
                    manager: managers[t.Staff__r.Manager__c] || '',
                    reviewCycle: t.PMS_Role_Template__r.PMS_Review_Cycle__r.Name,
                    templateName: t. PMS_Role_Template__r.Role_Title__c || '',
                    status: status
                    
                };

            });
            console.log('staffTemplateList: ',JSON.stringify(this.staffTemplateList));

        })
        .catch(error => {
            console.error(error);
        });
            
    }
    handleView(event) {

        const templateId = event.currentTarget.dataset.id;
        const staffName = event.currentTarget.dataset.staffname;
        const email = event.currentTarget.dataset.email;
        const managerName = event.currentTarget.dataset.managername;
        const status = event.currentTarget.dataset.status;

        console.log('Template Id:', templateId);
        console.log('Staff Name:', staffName);
        console.log('Email:', email);
        console.log('managerName:', managerName);
        console.log('status:', status);
        
        if (status !== 'Submitted to HR' && status !== 'Completed') {
            this.showToast(
                'Error',
                'This review cannot be accessed because the staff member and manager have not yet submitted it to HR.',
                'error'
            );
            return;
        }
        //if ( status !== 'Completed') {
            this.clearAllFields();
       // }
         
        this.selectedTemplateId = templateId;
        console.log('Selected Template Id:', this.selectedTemplateId);
        // hide dashboard
        this.isStaffHomeTable = false;
        this.isStaffTemplateView=true;
        this.templateStaffName = staffName;
        this.templateStaffEmail = email;
        this.templateStaffmanager = managerName;
        console.log('templateStaffName : ', this.templateStaffName);
        console.log('templateStaffEmail : ', this.templateStaffEmail);
        console.log('templateStaffmanager : ', this.templateStaffmanager);
        this.templateStatus = status;
        // if( this.templateStatus !== 'Submitted to HR'){
        //     this.isFieldsDisabled = true;
        // }
        // else{
        //     this.isFieldsDisabled = false;
        // }
        console.log('isFieldsDisabled:', this.isFieldsDisabled);

        this.activeTab = null;

        setTimeout(() => {
            this.activeTab = 'compare';
        }, 0);
        this.getStaffTemplateDetails();


    }
    get isHrFieldsDisabled() {
        return this.templateStatus !== 'Submitted to HR';
    }
    get isNewTitleDisabled() {
        return !this.approvePromotion || this.isHrFieldsDisabled;
    }
    get promotionToggleWrapperClass() {
        return this.isHrFieldsDisabled
            ? 'custom-toggle-wrapper toggle-disabled'
            : 'custom-toggle-wrapper';
    }
    handleCancel() {
        this.isStaffTemplateView = false;
        this.isStaffHomeTable = true;
        this.clearAllFields();

        
    }
    handleBack() {
         this.isStaffTemplateView = false;
        const event = new CustomEvent('back');
        this.dispatchEvent(event);
    }
    // getStaffTemplateDetails(){
    //      console.log('Selected Template Id:', this.selectedTemplateId);

    //     getStaffTemplateDetails({ templateId: this.selectedTemplateId })
    //         .then(result => {
    //             console.log('Template Details:', result);

    //             // store returned data
    //             this.templateDetails = result;

    //         })
    //         .catch(error => {
    //             console.error('Error fetching template details:', error);
    //         });
    // }
    getStaffTemplateDetails(){
        console.log('getStaffTemplateDetails calling ... ');
        console.log('Selected Template Id in getStaffTemplateDetails :', this.selectedTemplateId);
        this.staffKpiList = [];
        this.staffOkrList = [];
        this.staffCompetencyList = [];

        getStaffTemplateDetailsById({ templateId: this.selectedTemplateId })
        .then(result => {

            console.log('Template Details:', JSON.stringify(result));
            if (!result || !result.staffTemplate || !result.roleTemplate) {
                return;
            }
            const staffTemplate = result.staffTemplate;
            const roleTemplate = result.roleTemplate;
            this.performanceRating = staffTemplate.HR_Performance_Rating__c || '';
            this.potentialRating = staffTemplate.HR_Potential_Rating__c || '';
            this.flightRiskLevel = staffTemplate.HR_Flight_Risk_Level__c || '';
            this.readinessLevel = staffTemplate.HR_Readiness_Response__c || '';

            this.adjustRating = staffTemplate.HR_Adjust_Rating__c || '';
            this.justification = staffTemplate.HR_Justification__c || '';

            this.salaryAdjustment = staffTemplate.HR_Salary_Adjustment__c || '';
            this.bonusAdjustment = staffTemplate.HR_Bonus_Adjustment__c || '';

            this.approvePromotion = staffTemplate.HR_Approve_Promotion__c || false;
            this.newJobTitle = staffTemplate.HR_New_Job_Title__c || '';

            this.hrNotes = staffTemplate.HR_Notes__c || '';
            this.managerRequest = staffTemplate.HR_Request_Change_to_Manager__c || '';

            const kpiResponses = staffTemplate.Staff_Kpi_Responses__r || [];
            const okrResponses = staffTemplate.Staff_Okr_Responses__r || [];
            const compResponses = staffTemplate.Staff_Competency_Responses__r || [];

            console.log('staffTemplate: ', JSON.stringify(staffTemplate));
            console.log('roleTemplate: ', JSON.stringify(roleTemplate));
            console.log('kpiResponses: ', JSON.stringify(kpiResponses));
            console.log('okrResponses: ', JSON.stringify(okrResponses));
            console.log('compResponses: ', JSON.stringify(compResponses));

            this.staffKpiList = (roleTemplate.PMS_KPIs__r || []).map(kpi => {

                const response = kpiResponses.find(r => r.PMS_KPI__c === kpi.Id);

                return {
                    id: kpi.Id,
                    kpiTitle: kpi.Name,
                    kpiDescription: kpi.KPI_Description__c,
                    //kpiTarget: kpi.KPI_Target__c,
                    kpiTarget: this.formatTarget(kpi.KPI_Target__c, kpi.Unit__c),
                    kpiWeight: kpi.KPI_Weight__c,

                    employeeRating: response?.Staff_Rating__c || '',
                    employeeComment: response?.Staff_Comments__c || '',
                    managerRating: response?.Manager_Rating__c || '',
                    managerComment: response?.Manager_Comments__c || ''
                };
            });

            this.staffOkrList = (roleTemplate.PMS_OKRs__r || []).map(okr => {

                const response = okrResponses.find(r => r.PMS_OKR__c === okr.Id);

                return {
                    id: okr.Id,
                    title: okr.OKR_Objective__c,
                    description: okr.OKR_Description__c,
                    target: okr.Key_Target__c,
                    weight: okr.OKR_Weight__c,

                    employeeRating: response?.Staff_Rating__c || '',
                    employeeComment: response?.Staff_Comments__c || '',
                    managerRating: response?.Manager_Rating__c || '',
                    managerComment: response?.Manager_Comments__c || ''
                };
            });

            this.staffCompetencyList = (roleTemplate.PMS_Competencies__r || []).map(comp => {

                const response = compResponses.find(r => r.PMS_Competency__c === comp.Id);

                return {
                    id: comp.Id,
                    title: comp.Name,
                    description: comp.Competency_Description__c,
                    weight: comp.Competency_Weight__c,

                    employeeRating: response?.Staff_Rating__c || '',
                    employeeComment: response?.Staff_Comments__c || '',
                    managerRating: response?.Manager_Rating__c || '',
                    managerComment: response?.Manager_Comments__c || ''
                };
            });

        })
        .catch(error => {
            console.error('Error loading template details', error);
        });

    }
    formatTarget(value, unit) {

        if (!value) return '';

        if (unit === 'Percentage') {
            return value + '%';
        }

        if (unit === 'Hours') {
            return value + ' hrs';
        }

        return value;
    }
    handleTalentChange(event) {

        const field = event.target.name;
        const value = event.detail.value;

        console.log('Talent Field:', field);
        console.log('Selected Value:', value);

        switch(field) {

            case 'performanceRating':
                this.performanceRating = value;
                console.log('this.performanceRating : ',this.performanceRating);
                break;

            case 'potentialRating':
                this.potentialRating = value;
                console.log('this.potentialRating : ',this.potentialRating);
                break;

            case 'flightRiskLevel':
                this.flightRiskLevel = value;
                console.log('this.potentialRating : ',this.potentialRating);
                break;

            case 'readinessLevel':
                this.readinessLevel = value;
                console.log('this.readinessLevel : ',this.readinessLevel);
                break;

            default:
                console.warn('Unknown talent field:', field);
        }

    }
    handleActionChange(event) {

        const field = event.target.name;
        const value = event.target.type === 'toggle'
            ? event.target.checked
            : event.target.value;

        console.log('Field Changed:', field);
        console.log('New Value:', value);

        switch(field) {

            case 'adjustRating':
                this.adjustRating = value;
                console.log('Updating Adjust Rating : ', this.adjustRating);
                break;

            case 'justification':
                this.justification = value;
                console.log('Updating Justification : ', this.justification);
                break;

            case 'salaryAdjustment':
                this.salaryAdjustment = value;
                console.log('Updating Salary Adjustment : ', this.salaryAdjustment);
                break;

            case 'bonusAdjustment':
                this.bonusAdjustment = value;
                console.log('Updating Bonus Adjustment : ' , this.bonusAdjustment);
                break;

            // case 'approvePromotion':
            //     this.approvePromotion = value;
            //      console.log('Updating Promotion Toggle : ', this.approvePromotion);
            //     break;

            case 'newJobTitle':
                this.newJobTitle = value;
                console.log('Updating New Job Title : ', this.newJobTitle);
                break;

            case 'hrNotes':
                this.hrNotes = value;
                console.log('Updating HR Notes  : ',this.hrNotes);
                break;

            case 'managerRequest':
                this.managerRequest = value;
                console.log('Updating Manager Request : ',this.managerRequest);
                break;

            default:
                console.warn('Unknown field:', field);
        }

        

    }
    clearAllFields(){
        this.performanceRating = null;
        this.potentialRating = null;
        this.flightRiskLevel = null;
        this.readinessLevel = null;

        /* Action Tab Fields */
        this.adjustRating = null;
        this.justification = null;
        this.salaryAdjustment = null;
        this.bonusAdjustment = null;
        this.approvePromotion = false;
        this.newJobTitle = null;
        this.hrNotes = null;
        this.managerRequest = null;
    }
    isRequiredHrResponseFields() {
         return !this.performanceRating ||
                !this.potentialRating ||
                !this.flightRiskLevel ||
                !this.readinessLevel ||
                !this.justification ||
                !this.salaryAdjustment ||
                !this.bonusAdjustment ||
                !this.hrNotes ||
                !this.managerRequest
    }
    handleApprove() {

        if (this.isRequiredHrResponseFields()) {
            this.showToast('Error', 'Please fill all fields in Talent and Action tabs.', 'error');
            
            return;
        } 
        if (!this.selectedTemplateId) {
            this.showToast('Error', 'Template Id is missing.', 'error');
            return;
        }
        const hrData = {
            performanceRating: this.performanceRating,
            potentialRating: this.potentialRating,
            flightRiskLevel: this.flightRiskLevel,
            readinessLevel: this.readinessLevel,
            adjustRating: this.adjustRating,
            justification: this.justification,
            salaryAdjustment: this.salaryAdjustment,
            bonusAdjustment: this.bonusAdjustment,
            approvePromotion: this.approvePromotion,
            newJobTitle: this.newJobTitle,
            hrNotes: this.hrNotes,
            managerRequest: this.managerRequest
        };

        saveHrResponseData({ hrData: hrData, templateId: this.selectedTemplateId })
        .then(() => {

            // this.dispatchEvent(
            //     new ShowToastEvent({
            //         title: 'Success',
            //         message: 'Review Approved & Finalized Successfully',
            //         variant: 'success'
            //     })
            // );
            this.showToast('Success', 'Review Approved & Finalized Successfully.', 'success');
            this.isStaffTemplateView = false;
            this.isStaffHomeTable = true;
            this.clearAllFields();
            this.loadStaffTemplates();

        })
        .catch(error => {

            console.error('Error saving record', error);

           this.showToast('Error', 'Error saving HR response.', 'error');

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
    handleRequestChanges() {

        if (!this.selectedTemplateId) {
            this.showToast('Error', 'Template Id is missing.', 'error');
            return;
        }

        reassignToManager({ staffTemplateId: this.selectedTemplateId })
            .then(() => {

                this.showToast(
                    'Success',
                    'Review has been reassigned to the manager for changes.',
                    'success'
                );

                // go back to dashboard
                this.isStaffTemplateView = false;
                this.isStaffHomeTable = true;

            })
            .catch(error => {

                console.error('Error reassigning to manager', error);

                this.showToast(
                    'Error',
                    'Unable to send the review back to the manager.',
                    'error'
                );

            });
    }
    handleTabClick1(event) {

        const tabName = event.currentTarget.dataset.tab;

        this.activeTab1 = tabName;
        console.log('Active Tab:', this.activeTab1);
        if ( this.activeTab1 === 'goals') {

            this.loadGoals(); // call apex
        }
    }
    get performanceTabClass() {
        return this.activeTab1 === 'reviews' ? 'tab active' : 'tab';
    }

    get goalsTabClass() {
        return this.activeTab1 === 'goals' ? 'tab active' : 'tab';
    }
    get activeTabGoals() {
        return this.activeTab1 === 'goals';
    }
    get activeTabPerformance() {
        return this.activeTab1 === 'reviews';
    }
    handleGoalsView(event){
        const goalId = event.currentTarget.dataset.id;
        const staffId = event.currentTarget.dataset.staffid;

        console.log('Selected goalId Id:', goalId);
        console.log('Selected Goal StaffId:', staffId);
        this.staffId=staffId;
         console.log('Selected Goal this.staffId:', this.staffId);
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
    loadGoals() {
        console.log('loadGoals called');
        if (!this.selectedFacilityId) {
            console.error('Facility Id not provided');
            return;
        }
   
        getAllGoalsByFacility({ facilityId: this.selectedFacilityId })
            .then(result => {

                console.log('Goals:', result);

                this.goalsList = result.map(item => ({
                    goalId: item.Id,
                    staffId: item.Staff__c,
                    staffName: item.Staff__r.Display_Nickname__c,
                    goalName: item.Goal_Title__c,
                    goalType: item.Goal_Type__c,
                    dateFormatted:
                        `${this.formatDate(item.Goal_Start_Date__c)} - ${this.formatDate(item.Goal_End_Date__c)}`,
                    status: item.Goal_Status__c || ''
                }));
                this.goalsCreatedCount = this.goalsList.length;

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

    
}