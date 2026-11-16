import { LightningElement, track, wire } from 'lwc';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import userDetials from '@salesforce/apex/HrHomeHandler.userDetials';
import createJobAds from '@salesforce/apex/HrHomeHandler.createJobAds';
import getJobAds from '@salesforce/apex/HrHomeHandler.getJobAds';
import getEmployeeData from '@salesforce/apex/HrHomeHandler.getEmployeeData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ADD_OBJECT from '@salesforce/schema/Advertisement__c';
import LOCATION_FIELD from '@salesforce/schema/Advertisement__c.Location__c';
import CONTRACT_FIELD from '@salesforce/schema/Advertisement__c.Contract_type__c';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';
import My_Resource from "@salesforce/resourceUrl/myResource";


export default class HrHome extends NavigationMixin(LightningElement) {

    @track onboardFlag = false;
    @track empflag = false;
    @track isJobAdModalOpen = false;
    @track isAppstatusModalOpen = false;
    @track isinterviewsModalOpen = false;
    @track offerdocumentation = false;
    @track onboarding = false;
    @track publishflag = true;
    @track jobAdsList;
    @track accounts;
    @track data;
    @track addAppStatus = false;
    @track facilityOptions = [];
    @track staffList = [];
    @track staffListRecords;
    @track staffContact;
    @track staffEmail;
    @track contactId;
    @track LocationPicklistValues;
    @track contractPicklistValues;
    @track refreshTable = [];
    @track interviewdata;
    @track rewardsFlag = false;
    @track trainingFlag = false;
    @track empManagementflag = false;
    @track addEmployee = false;
    @track viewEmployee = false;
    @track searchEmployee = false;
    @track recentEmpData;
    @track recordId;
    @track hrFlag = true;
    //Job Advertisement track fields
    @track jobAdDisplay = true;
    @track roles;
    @track contact;
    @track sDate;
    @track eDate;
    @track title;
    @track description;
    @track loc;
    @track facility;
    @track contracttype;

    //Images to display side panel
    employee = My_Resource + '/myResource/images/employee.svg';
    recruitment = My_Resource + '/myResource/images/recruitment.svg';
    rewards = My_Resource + '/myResource/images/rewards.svg';
    training = My_Resource + '/myResource/images/training.svg';

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Small';
    }

    //Job Advertisiment object info to fetch picklist 
    @wire(getObjectInfo, { objectApiName: ADD_OBJECT })
    objectInfo;
    //Fetch location picklistvalues
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: LOCATION_FIELD })
    LocationPicklistValues;
    //to get type of employeement picklist values
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: CONTRACT_FIELD })
    contractPicklistValues;

    connectedCallback() {
        //Default view of recruitment and onboard
        this.handleOnboard();

        // Fetch facility data 
        getFacilityData().then(response => {
            this.facilityList = response;
            this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }))

        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);
        });

        //Logged in user details
        userDetials().then(response => {
            this.contact = response.Name;
            this.contactId = response.Id;
            this.staffContact = response.MobilePhone;
            this.staffEmail = response.Email;
        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);
        });
        // Fetch staff details
        let tempConList = [];
        getEmployeeData().then(response => {
            response.forEach(record => {
                let tempRec = Object.assign({}, record);
                tempRec.Name = '/' + tempRec.Id;
                tempConList.push(tempRec);
            });
            this.recentEmpData = tempConList;
            this.refreshTable = this.recentEmpData;
            refreshApex(this.recentEmpData);
        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);
            //alert(err);
        });
    }

    //Onclick Recruitment & Onboard image
    handleOnboard() {
        this.onboardFlag = true;
        this.empManagementflag = false;
        this.rewardsFlag = false;
        this.trainingFlag = false
        this.hrFlag = false;
        this.rosterFlag = false;
        this.isJobAdModalOpen = true;
        this.openjobAdModal();
    }
    handleEmp() {
        this.onboardFlag = false;
        this.empManagementflag = true;
        this.rewardsFlag = false;
        this.trainingFlag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = true;
        this.searchEmployee = false;
        this.addEmployee = false;
    }
    handleRewards() {
        this.rewardsFlag = true;
        this.trainingFlag = false;
        this.onboardFlag = false;
        this.empManagementflag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = false;
        this.searchEmployee = false;
        this.addEmployee = false;
    }
    handleTraining() {
        this.trainingFlag = true;
        this.onboardFlag = false;
        this.rewardsFlag = false;
        this.empManagementflag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = false;
        this.searchEmployee = false;
        this.addEmployee = false;
    }

    openjobAdModal() {
        // to open modal set isModalOpen tarck value as true
        this.isJobAdModalOpen = true;
        this.jobAdDisplay = true;
        this.isAppstatusModalOpen = false;
        this.isinterviewsModalOpen = false;
        this.offerdocumentation = false;
        this.onboarding = false;
        let tempConList = [];
        getJobAds().then(response => {
            response.forEach(record => {
                let tempRec = Object.assign({}, record);
                tempRec.jobTitle = '/' + tempRec.Id;
                tempConList.push(tempRec);
            });
            this.accounts = tempConList;
            this.refreshTable = this.accounts;
            refreshApex(this.refreshTable);
        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);
        });
    }

    //open Job Application component   
    openAppstatusModal() {
        // to open modal set isModalOpen tarck value as true
        this.isAppstatusModalOpen = true;
        this.isJobAdModalOpen = false;
        this.jobAdDisplay = false;
        this.isinterviewsModalOpen = false;
        this.offerdocumentation = false;
        this.onboarding = false;
    }

    //Create new job input data capture
    handleChangeAd(event) {
        let value = event.detail.value;
        if (event.target.name == 'title') {
            this.title = event.detail.value;
            console.log('title>>>>', this.title);
        }
        if (event.target.name == 'description') {
            this.description = event.detail.value;
            console.log('description>>>>', this.description);
        }
        if (event.target.name == 'location') {
            this.location = event.detail.value;
            console.log('location>>>>', this.location);
        }
        // Staff list details will be displayed based on facility
        if (event.target.name == 'facility') {
            this.facility = event.detail.value;
            console.log('facility>>>>', this.facility);
        }
        if (event.target.name == 'contracttype') {
            this.contracttype = event.detail.value;
            console.log('contracttype>>>>', this.contracttype);
        }
        if (event.target.name == 'roles') {
            this.roles = event.detail.value;
            console.log('role>>>>', this.roles);
        }
        if (event.target.name == 'sDate') {
            this.sDate = event.detail.value;
            console.log('role>>>>', this.sDate);
        }
        if (event.target.name == 'eDate') {
            this.eDate = event.detail.value;
            console.log('role>>>>', this.eDate);
        }

    }

    //To save the  new Job Advertisements
    handleSubmit(event) {
        if (this.title == undefined || this.facility == undefined) {
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Provide the required fields',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }
        else {
            createJobAds({ title: this.title, description: this.description, ctype: this.contracttype, facility: this.facility, loc: this.location, roles: this.roles, contactId: this.contactId, sDate: this.sDate, eDate: this.eDate }).then(response => {
                console.log('createjobad');
                let tempConList = [];
                getJobAds().then(response => {
                    response.forEach(record => {
                        let tempRec = Object.assign({}, record);
                        tempRec.jobTitle = '/' + tempRec.Id;
                        tempConList.push(tempRec);
                    });
                    this.accounts = tempConList;
                    this.refreshTable = this.accounts;
                    refreshApex(this.refreshTable);
                    //console.log("adlength2====.", this.refreshTable.length);
                })
                this.jobAdDisplay = true;
            });
        }
    }

    openInterviewModal() {
        // to open modal set isModalOpen tarck value as true
        this.isinterviewsModalOpen = true;
        this.isAppstatusModalOpen = false;
        this.isJobAdModalOpen = false;
        this.offerdocumentation = false;
        this.onboarding = false;
    }
    offerDocumentation() {
        this.isinterviewsModalOpen = false;
        this.isAppstatusModalOpen = false;
        this.isJobAdModalOpen = false;
        this.offerdocumentation = true;
        this.onboarding = false;
    }
    onBoarding() {
        this.isinterviewsModalOpen = false;
        this.isAppstatusModalOpen = false;
        this.isJobAdModalOpen = false;
        this.offerdocumentation = false;
        this.onboarding = true;
    }

    closeInterviewModal() {
        // to close modal set isModalOpen tarck value as false
        this.isinterviewsModalOpen = false;

    }
    handleAddEmp(event) {
        var buttonLabel = event.target.dataset.name;
        if (buttonLabel == 'addemployee') {
            this.addEmployee = true;
            this.viewEmployee = false;
            this.searchEmployee = false;
        }
        if (buttonLabel == 'viewemployee') {
            this.viewEmployee = true;
            this.addEmployee = false;
            this.searchEmployee = false;

        }
        if (buttonLabel == 'searchemployee') {
            this.searchEmployee = true;
            console.log("buttonLabel>>>>", buttonLabel);
            this.viewEmployee = false;
            this.addEmployee = false;
        }
    }

    cancelEmp() {
        this.addEmployee = false;
        this.viewEmployee = true;
    }

    handleEdit(event) {
        let facId = event.currentTarget.dataset.id;
        console.log("selectedId====>", facId);
        this.recordId = facId;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: facId,
                objectApiName: 'staff__c',
                actionName: 'edit'
            },
        });
    }
    hrHome() {
        this.hrFlag = true;
        this.onboardFlag = false;
        this.empflag = false;
        this.addEmployee = false;
        this.viewEmployee = false;
        this.searchEmployee = false;
        this.empManagementflag = false;
        this.rewardsFlag = false;
        this.trainingFlag = false;
        this.rosterFlag = false;

    }

    handleSave() {
        this.template.querySelector('c-emp-management').employmeeSaveRecord();
        this.addEmployee = false;
        this.viewEmployee = true;
        const event = new ShowToastEvent({
            title: '',
            message: 'Employee Record Saved Successfully',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

   
    handleAddEmployee(){
        this.addEmployee = true;
        this.viewEmployee = false;
        this.searchEmployee = false;
    }

    //create new Job Ad
    handleCreateNewJobAdd() {
        this.jobAdDisplay = false;
    }
    closeCreateNewJobAdd() {
        this.jobAdDisplay = true;
    }

    get selectedClassJob(){
        return this.isJobAdModalOpen ? 'slds-size_1-of-7 slds-box slds-theme_inverse' : 'slds-size_1-of-7 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassJobmob(){
        return this.isJobAdModalOpen ? 'slds-size_1-of-3 slds-box slds-theme_inverse' : 'slds-size_1-of-3 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassApplication(){
        return this.isAppstatusModalOpen ? 'slds-size_1-of-7 slds-box slds-theme_inverse' : 'slds-size_1-of-7 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassApplicationmob(){
        return this.isAppstatusModalOpen ? 'slds-size_1-of-3 slds-box slds-theme_inverse' : 'slds-size_1-of-3 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassinterview(){
        return this.isinterviewsModalOpen ? 'slds-size_1-of-7 slds-box slds-theme_inverse' : 'slds-size_1-of-7 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassinterviewmob(){
        return this.isinterviewsModalOpen ? 'slds-size_1-of-3 slds-box slds-theme_inverse' : 'slds-size_1-of-3 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassonboard(){
        return this.onboarding ? 'slds-size_1-of-7 slds-box slds-theme_inverse' : 'slds-size_1-of-7 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassonboardmob(){
        return this.onboarding ? 'slds-size_1-of-3 slds-box slds-theme_inverse' : 'slds-size_1-of-3 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassJoboffer(){
        return this.offerdocumentation ? 'slds-size_2-of-7 slds-box slds-theme_inverse' : 'slds-size_2-of-7 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }
    get selectedClassJoboffermob(){
        return this.offerdocumentation ? 'slds-size_2-of-3 slds-box slds-theme_inverse' : 'slds-size_2-of-3 slds-box slds-theme_alert-texture'; // you can use your custom class here.
    }


    get selectedClass(){
        return this.onboardFlag ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }

    get selectedClassemp(){
        return this.empManagementflag ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get selectedClassrewards(){
        return this.rewardsFlag ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    get selectedClasstraining(){
        return this.trainingFlag ? 'slds-theme_default geeks slds-box' : ' geeks slds-box'; // you can use your custom class here.
  
    }
    
    get selectedClassviewemp(){
        let bgcolor='';
        if(this.viewEmployee){
            bgcolor='slds-size_1-of-7 slds-box slds-theme_inverse';
        } else if(this.addEmployee){
            bgcolor='slds-size_1-of-7 slds-box slds-theme_inverse';
        } else{
            bgcolor='slds-size_1-of-7 slds-box slds-theme_alert-texture';
        }
        return bgcolor;
    }
    get selectedClassviewempmob(){
        let bgcolor='';
        if(this.viewEmployee){
            bgcolor='slds-size_1-of-2 slds-box slds-theme_inverse';
        } else if(this.addEmployee){
            bgcolor='slds-size_1-of-2 slds-box slds-theme_inverse';
        } else{
            bgcolor='slds-size_1-of-2 slds-box slds-theme_alert-texture';
        }
        return bgcolor;
    }

    get selectedClasssearchemp(){
        return this.searchEmployee ? 'slds-size_1-of-7 slds-box slds-theme_inverse' : 'slds-size_1-of-7 slds-box slds-theme_alert-texture'; // you can use your custom class here.
  
    }

    get selectedClasssearchempmob(){
        return this.searchEmployee ? 'slds-size_1-of-2 slds-box slds-theme_inverse' : 'slds-size_1-of-2 slds-box slds-theme_alert-texture'; // you can use your custom class here.
  
    }


}