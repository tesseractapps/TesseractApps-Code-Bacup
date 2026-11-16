import { LightningElement, track, api } from 'lwc';
import loadStaffManagerDetails from '@salesforce/apex/PmsStaffTemplateController.loadStaffManagerDetails';
import saveGoal from '@salesforce/apex/PmsStaffTemplateController.saveGoal';
import getGoalById from '@salesforce/apex/PmsStaffTemplateController.getGoalById';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TesseractAppsPmsCreateEditGoalLwc extends LightningElement {

    //@api orgId;
    @api staffId;
    @api isStaff;
    @api isHr;
    @api isManager;
    @api goalId;
    @api isEditGoal;
    @track currentStep = 'step1';
    @track isCreateGoal=true;
    @track staffName;
    @track managerName;
    @track managerId;
    @track milestoneList=[];

    @track selectedGoalType = '';
    @track goalTitle = '';
    @track goalDescription = '';
    @track goalPriority = '';
    @track goalStartDate = '';
    @track goalEndDate = '';

    @track milestoneTitle = '';
    @track milestoneDescription = '';
    @track milestoneDueDate = '';
    @track milestoneStatus = '';
    
    @track measurementType = '';
    @track checkInFrequency = '';
    @track successIndicators = '';
    @track managerComments = '';
    @track skipMilestone = false;
    @track disableAllFields=false;
    @track selectedGoalDetails=[];
    @track saveLabel = 'Create';
    //@track completedLabel= 'Completed';
    //@track isSaveDisabled = false; 
    @track isCompleted = false;
    @track goalStatus;
    //@track isCompletedDisabled=false;
    @track editingId;
    @track isEditingMilestone=false;

    // @track showCancel=false;
    // @track showNext=false;
    // @track showPrevious=false;
    // @track showSave=false;
    // @track steps = [
    //     { label: 'Goal Info' },
    //     { label: 'Milestones' },
    //     { label: 'Success Criteria' },
    //     { label: 'Review' },
        
    // ];
    steps = ['step1','step2','step3','step4'];
    @track goalTypeOptions=[
        { label: 'Performance KPI', value: 'Performance KPI' },
        { label: 'Performance OKR', value: 'Performance OKR' },
        { label: 'Development Goal', value: 'Development Goal' },
        { label: 'Training Goal', value: 'Training Goal' },
    ];
    @track goalPriorityOptions=[
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' },
    ];
    @track goalStatusOptions=[
        { label: 'Not Started', value: 'Not Started' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Blocked', value: 'Blocked' },
    ];
    @track measurementTypeOptions=[
        { label: 'Number', value: 'Number' },
        { label: 'Percentage', value: 'Percentage' },
        { label: 'Rating ', value: 'Rating' },
        { label: 'Yes/No ', value: 'Yes/No' },
    ];
    @track checkInFrequencyOptions=[
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Bi-Weekly', value: 'Bi-Weekly' },
        { label: 'Monthly', value: 'Monthly' },
        { label: 'Quarterly', value: 'Quarterly' },
        { label: 'No regular checks', value: 'No regular checks' },
    ];

    get isStep1() {
        return this.currentStep === 'step1';
    }

    get isStep2() {
        return this.currentStep === 'step2';
    }

    get isStep3() {
        return this.currentStep === 'step3';
    }

    get isStep4() {
        return this.currentStep === 'step4';
    }
    get showCancel() {
        return this.currentStep === 'step1' || this.currentStep === 'step4';
    }

    get showNext() {
        return this.currentStep !== 'step4';
    }

    get showPrevious() {
        return this.currentStep !== 'step1';
    }

    get showSave() {
        return this.currentStep === 'step4' && !this.isHr;
    }
    // get showCompleted() {
    //     return this.currentStep === 'step4' && this.isEditGoal && this.isStaff;
    // }
    get showCompleted() {
        // return this.currentStep === 'step4' && this.isEditGoal && (this.isStaff || this.isManager) &&
        //    !this.isHr;
        return this.currentStep === 'step4' && this.isEditGoal && this.isStaff;
    }
    get showSkip() {
        return this.currentStep === 'step2' && this.isStaff && !this.isEditGoal;
    }

    get startToEndDate() {
        if (this.goalStartDate && this.goalEndDate) {
            return `${this.formatDate(this.goalStartDate)} - ${this.formatDate(this.goalEndDate)}`;
        }
        return '';
    }
    get reviewFrequency() {
        if (!this.checkInFrequency) return '';

        if (this.checkInFrequency === 'No regular checks') {
            return 'No Regular Check-Ins';
        }

        return `${this.checkInFrequency} Check-Ins`;
    }
    get isDueDateRequired() {
        return this.milestoneTitle && this.milestoneTitle.trim() !== '';
    }
    get isCompletedDisabled() {
        return this.goalStatus === 'Completed' ||
            this.isCompleted ||
            !this.milestoneList.length ||
            !this.milestoneList.every(m => m.status === 'Completed');
    }

    get isSaveDisabled() {
        //return this.goalStatus === 'Completed' || this.isCompleted;
         if (this.isStaff) {
            return this.goalStatus === 'Completed' || this.isCompleted;
        }

        if (this.isManager) {
            return !this.managerComments || this.managerComments.trim() === '';
        }

        return true;
    }
    get isMilestoneActionDisabled() {
        return !this.isStaff || 
            this.goalStatus === 'Completed' || 
            this.isCompleted;
    }
    get showMilestoneActions() {
        return this.isStaff;
        // && this.goalStatus !== 'Completed' && !this.isCompleted;
    }

    connectedCallback(){
        console.log('pms Staffid'+this.staffId);
        console.log('pms isStaff'+this.isStaff);
        console.log('isManager', this.isManager);
        console.log('isHr', this.isHr);
        console.log('pms goalId'+this.goalId);
        console.log('pms isEditGoal'+this.isEditGoal);

        if(this.isStaff){
            //this.disableAllFields = false;
            this.disableManagerComment = true;
            //this.showCompleted = true;
            //this.completedLabel = 'Completed';
            if(this.goalStatus === 'Completed' || this.isCompleted){
                this.disableAllFields = true;
               // this.isSaveDisabled = true;
                //this.isCompletedDisabled = true;
            } else {
                this.disableAllFields = false;
                //this.isSaveDisabled = false;
                //this.isCompletedDisabled = false;
            }
        } 
        else if(this.isManager){
            //this.showCompleted = true;
            this.saveLabel  = 'Submit';
            this.disableAllFields = true;
            this.disableManagerComment = false;
        } 
        else if(this.isHr && this.isEditGoal){
            this.disableAllFields = true;
            this.disableManagerComment = true;
           // this.isSaveDisabled = true;
            //this.showCompleted = false;
        }

        this.loadStaffDetails();
        if(this.goalId && this.isEditGoal){
            this.saveLabel = this.isManager ? 'Submit' : 'Update';
            console.log('pms isEditGoal');
            //this.saveLabel = 'Update';
            setTimeout(() => {
                this.loadGoalDetails();
            }, 500);
            
        }  else {
            console.log('pms isCreateGoal');
            this.saveLabel = 'Create';
            this.clearAllFields();
        }
         
 
    }
    
    loadStaffDetails(){
        loadStaffManagerDetails({ staffId: this.staffId })
        .then(result => {
            this.staffName = result.staffName;
            this.managerName = result.managerName;
            this.managerId = result.managerId;
            console.log('pms staffName ' + this.staffName);
            console.log('pms managerName ' + this.managerName);
            console.log('pms managerId ' + this.managerId);
        })
        .catch(error => {
            console.error('Error loading staff details', error);
        });
    }
    
    cancelCreateGoal(){
       // this.MyPmsFlag=false;
        this.isCreateGoal=false;
        //this.MyGoalsFlag=true;
        const closeEvent = new CustomEvent('closegoal');
        this.dispatchEvent(closeEvent);

    }
    @track dispalyGoalEndDate;
    @track dispalyGoalStartDate;
    handleGoalChange(event){

        const fieldName = event.target.name;
        const value = event.target.value;

        switch(fieldName){

            case 'selectedGoalType':
                this.selectedGoalType = value;
                break;

            case 'goalTitle':
                this.goalTitle = value;
                break;

            case 'goalDescription':
                this.goalDescription = value;
                break;

            case 'goalPriority':
                this.goalPriority = value;
                break;

            case 'goalStartDate':
                this.goalStartDate = value;
                this.dispalyGoalStartDate = this.formatDate(value);
                break;

            case 'goalEndDate':
                this.goalEndDate = value;
                 this.dispalyGoalEndDate = this.formatDate(value);
                break;

            case 'milestoneTitle':
                this.milestoneTitle = value;
                break;

            case 'milestoneDescription':
                this.milestoneDescription = value;
                break;

            case 'milestoneDueDate':
                if ( value && ((this.goalStartDate && value < this.goalStartDate) || (this.goalEndDate && value > this.goalEndDate) )) {

                    this.showToast(
                        'Error',
                       // `Due Date should be between ${this.dispalyGoalStartDate} and ${this.dispalyGoalEndDate}`,
                        'Due date should be between goal start date and goal end date',
                        'error'
                    );
                    this.milestoneDueDate='';
                    event.target.value = '';
                    return;
                }

                this.milestoneDueDate = value;
                break;

            case 'milestoneStatus':
                this.milestoneStatus = value;
                break;


            case 'measurementType':
                this.measurementType = value;
                break;

            case 'checkInFrequency':
                this.checkInFrequency = value;
                break;

            case 'successIndicators':
                this.successIndicators = value;
                break;

            case 'managerComments':
                this.managerComments = value;
                break;

            default:
                break;
        }
        console.log(fieldName + ' : ' + value);
        if (this.goalStartDate && this.goalEndDate) {

            if (fieldName === 'goalEndDate' && this.goalEndDate < this.goalStartDate) {

                this.showToast('Error','End Date cannot be earlier than Start Date', 'error');

                this.goalEndDate = '';
                if (fieldName === 'goalEndDate') {
                    event.target.value = null;
                }
                console.log('goalEndDate  inside date validation : ' + this.goalEndDate);
               
            }
            if (fieldName === 'goalStartDate' && this.goalStartDate > this.goalEndDate) {

                this.showToast( 'Error','Start Date cannot be later than End Date', 'error');

                this.goalStartDate = '';
                if (fieldName === 'goalStartDate') {
                    event.target.value = null;
                }
                console.log('goalStartDate  inside date validation : ' + this.goalStartDate);
            }
        }
       
       
    }
    
    handleNext() {

        switch(this.currentStep){

            case 'step1':
                if(!this.selectedGoalType || !this.goalTitle || !this.goalDescription || !this.goalPriority || !this.goalStartDate || !this.goalEndDate){
                    this.showToast('Error','Please fill all required Goal fields.','error');
                    return;
                }
                this.currentStep = 'step2';
            break;

            case 'step2':
                console.log('skipMilestone  in next: '+this.skipMilestone);
                if(this.milestoneTitle && !this.milestoneDueDate){
                    this.showToast( 'Error', 'Due Date is required when Milestone Title is entered.','error' );
                    return;
                }
                // if(this.milestoneList.length === 0){
                //     this.showToast('Error','Please add at least one milestone.','error');
                //     return;
                // }
                if(!this.skipMilestone && this.milestoneList.length === 0){
                    this.showToast('Error','Please add at least one milestone.','error' );
                    return;
                }
                this.currentStep = 'step3';

            break;

            case 'step3':
                if(!this.successIndicators){
                    this.showToast('Error','Please fill the required fields in Success Criteria.','error');
                    return;
                }
                this.currentStep = 'step4';
            break;

        }

    }
    
    handlePrevious() {
    
        console.log('currentStep : '+this.currentStep);
        console.log('skipMilestone  in previous: '+this.skipMilestone);
        
        if(this.currentStep === 'step4'){
            this.currentStep = 'step3';
        }
        else if(this.currentStep === 'step3'){
            this.currentStep = 'step2';
             this.skipMilestone = false;
        }
        else if(this.currentStep === 'step2'){
            this.currentStep = 'step1';
            // this.skipMilestone = false;
        }
    
    }

    handleAddMilestone() {
       
        if(this.goalStatus === 'Completed' || this.isCompleted){
            this.showToast('Error','Completed goal cannot be modified','error');
            return;
        }

        if(this.milestoneList.length >= 5){
            this.showToast('Error','Maximum 5 milestones are allowed.','error');
            return;
        }
        if (!this.milestoneTitle || !this.milestoneDueDate) {
            this.showToast('Error', 'Please fill all required Milestone fields.', 'error');
            return;
        }

        const milestoneData = {
            id: null,
            milestoneTitle: this.milestoneTitle,
            description: this.milestoneDescription || '',
            dueDate: this.milestoneDueDate,
            dueDateDisplay:this.formatDate(this.milestoneDueDate),
            status: this.milestoneStatus || '',
            key: Date.now().toString(),
        };

        this.milestoneList = [...this.milestoneList, milestoneData];

        this.clearMilestoneFields();
        this.isEditingMilestone = false;
       // this.checkMilestonesCompleted();
    }
    clearMilestoneFields() {

        this.milestoneTitle = '';
        this.milestoneDescription = '';
        this.milestoneDueDate = '';
        this.milestoneStatus = '';

    }
    handleDeleteMilestone(event) {
        if (this.goalStatus === 'Completed' ||this.isCompleted) {
            this.showToast('Error','Completed goal cannot be modified','error');
            return;
        }
        const key = event.currentTarget.dataset.key;
        this.milestoneList  = this.milestoneList .filter( mile => mile.key != key);
       // this.checkMilestonesCompleted();
    }
    clearAllFields() {

        this.selectedGoalType = '';
        this.goalTitle = '';
        this.goalDescription = '';
        this.goalPriority = '';
        // this.staffName = '';
        // this.managerName = '';
        this.goalStartDate = '';
        this.goalEndDate = '';


        this.milestoneTitle = '';
        this.milestoneDescription = '';
        this.milestoneDueDate = '';
        this.milestoneStatus = '';
        this.milestoneList = [];

        this.measurementType = '';
        this.checkInFrequency = '';
        this.successIndicators = '';
        this.managerComments = '';

    }
    handleSave() {

        console.log('Saving Goal...');

        const goalData = {
            goalId: this.goalId || null,
            goalType: this.selectedGoalType || null,
            goalTitle: this.goalTitle || null,
            description: this.goalDescription || null,
            priority: this.goalPriority || null,
            owner: this.staffName || null,
            staffId: this.staffId || null, 
            manager: this.managerName || null,
            startDate: this.goalStartDate || null,
            endDate: this.goalEndDate || null,
            measurementType: this.measurementType || null,
            checkInFrequency: this.checkInFrequency || null,
            successIndicators: this.successIndicators || null,
            managerComments: this.managerComments || null,
            goalStatus: this.goalStatus || 'Active' 
        };


        saveGoal({
            goalData: goalData,
            milestoneList: this.milestoneList
        })
        .then(goalId => {

            console.log('Created Goal Id:', goalId);

            this.showToast(
                'Success',
                'Goal created successfully',
                'success'
            );

            this.clearAllFields();   // reset form
            //this.currentStep = 'step1';    // go back to step1
            // this.loadGoals();
            // this.isCreateGoal=false;
            // this.MyGoalsFlag=true;
            const closeEvent = new CustomEvent('closegoal');
            this.dispatchEvent(closeEvent);

        })
        .catch(error => {

            console.error(error);
            this.showToast('Error','Error creating goal', 'error'  );
        });

    }
    handleSkip() {

        this.skipMilestone = true;
        this.milestoneTitle = '';
        this.milestoneDescription = '';
        this.milestoneDueDate = '';
        this.milestoneStatus = '';
        this.milestoneList = [];
        // if (this.currentStep < this.steps.length - 1) {
        //     this.currentStep++;
        // }
        if(this.currentStep === 'step2'){
            this.currentStep = 'step3';
        }

    }
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
    
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }
    loadGoalDetails(){

        if(!this.goalId){
            console.log('goalId is not');
            return;
        }

        getGoalById({ goalId: this.goalId })
            .then(result => {

                console.log('Goal Data:', result);

                this.selectedGoalDetails = result[0];

                this.selectedGoalType = this.selectedGoalDetails.Goal_Type__c;
                this.goalTitle = this.selectedGoalDetails.Goal_Title__c;
                this.goalDescription = this.selectedGoalDetails.Goal_Description__c;
                this.goalPriority = this.selectedGoalDetails.Goal_Priority__c;
                this.goalStartDate = this.selectedGoalDetails.Goal_Start_Date__c;
                this.goalEndDate = this.selectedGoalDetails.Goal_End_Date__c;
                this.measurementType = this.selectedGoalDetails.Measurement_Type__c;
                this.checkInFrequency = this.selectedGoalDetails.Check_In_Frequency__c;
                this.successIndicators = this.selectedGoalDetails.Success_Indicators__c;
                this.managerComments = this.selectedGoalDetails.Manager_Comments__c;
                this.goalStatus = this.selectedGoalDetails.Goal_Status__c;

                // milestones
                //this.milestoneList = this.selectedGoalDetails.milestones || [];
                this.milestoneList = this.selectedGoalDetails.PMS_Goal_Milestones__r
                    ? this.selectedGoalDetails.PMS_Goal_Milestones__r.map(m => ({
                        id: m.Id, 
                        key: m.Id, 
                        milestoneTitle: m.Milestone_Title__c,
                        description: m.Milestone_Description__c,
                        dueDate: m.Milestone_Due_Date__c,
                        dueDateDisplay: this.formatDate(m.Milestone_Due_Date__c),
                        status: m.Milestone_Status__c
                    }))
                    : [];
               
                if(this.isStaff){
                    if(this.goalStatus === 'Completed'){
                        this.isCompleted = true;
                        this.disableAllFields = true;
                    } else {
                        this.disableAllFields = false;
                    }
                     this.disableManagerComment = true;
                }
                //this.checkMilestonesCompleted();
            })
            .catch(error => {

                console.error('Error loading goal', error);

                this.showToast( 'Error', 'Unable to load goal details',  'error' );

            });
    }
   
    handleEditMilestone(event) {
        if (this.goalStatus === 'Completed' ||this.isCompleted) {
            this.showToast('Error','Completed goal cannot be modified','error');
            return;
        }
        const id = event.currentTarget.dataset.id || event.currentTarget.dataset.key;

        console.log('Edit clicked:', id);

        const milestone = this.milestoneList.find(
            m => m.id === id || m.key === id
        );
        if (milestone && milestone.status === 'Completed') {
            this.showToast('Error','Completed milestone cannot be edited','error');
            return;
        }

        if (milestone) {

            this.milestoneTitle = milestone.milestoneTitle;
            this.milestoneDescription = milestone.description;
            this.milestoneDueDate = milestone.dueDate;
            this.milestoneStatus = milestone.status;

            this.editingId = id;

            this.isEditingMilestone = true; 

            console.log('Editing milestone:', this.editingId);
        }
    }

    handleUpdateMilestone() {
        if(this.goalStatus === 'Completed' || this.isCompleted){
            this.showToast('Error','Completed goal cannot be modified','error');
            return;
        }

        this.milestoneList = this.milestoneList.map(mile => {

            if (mile.id === this.editingId || mile.key === this.editingId) {

                return {
                    ...mile,
                    milestoneTitle: this.milestoneTitle,
                    description: this.milestoneDescription,
                    dueDate: this.milestoneDueDate,
                    dueDateDisplay: this.formatDate(this.milestoneDueDate),
                    status: this.milestoneStatus
                };
            }

            return mile;
        });

        console.log('Milestone updated:', this.milestoneList);

        this.clearMilestoneFields();

        this.editingId = null;
        this.isEditingMilestone = false; 
       // this.checkMilestonesCompleted();
    }
    // checkMilestonesCompleted() {
    //     if (this.goalStatus === 'Completed' || this.isCompleted) {
    //         this.isCompletedDisabled = true;
    //         return;
    //     }

    //     if (!this.milestoneList || this.milestoneList.length === 0) {
    //         this.isCompletedDisabled = true;
    //         return;
    //     }

    //     const allCompleted = this.milestoneList.every(
    //         mile => mile.status === 'Completed'
    //     );

    //     this.isCompletedDisabled = !allCompleted;
    //     console.log('All milestones completed:', allCompleted);
    //     console.log('this.isCompletedDisabled : ', this.isCompletedDisabled);
    // }
    
    handleCompleted(){

        if(this.isCompletedDisabled){
            this.showToast( 'Error', 'All milestones must be completed before completing the goal.','error');
            return;
        }

        console.log('Marking Goal as Completed');

        this.goalStatus = 'Completed';
        this.handleSave();
        this.disableAllFields = true;
        this.disableManagerComment = true;
        this.isCompleted = true;
        //this.isCompletedDisabled = true;
        //this.isSaveDisabled = true;
    }


}