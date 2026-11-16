import { LightningElement, track, wire, api } from 'lwc';
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
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import userOrgName from '@salesforce/schema/User.Organization_Name__c';
import { CurrentPageReference } from "lightning/navigation";

/* import { api } from 'lwc'; */


const fields = [UsrRoleName,userOrgName];
export default class HrCommunity extends LightningElement {
    @api searchValue;
    /* @api selectedName; */
    @track onboardFlag = true;
    @track empflag = false;
    @track isJobAdModalOpen = false;
    @track isAppstatusModalOpen = false;
    @track isinterviewsModalOpen = false;
    @track offerdocumentation = false;
    @track onboarding = false;
    @track tSign = false;
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
    @track hrflag=true;
    //@track empManagementflag = true;
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
    @track profileflag=false;
    @track orgid;
    @track error;
    @track isStaffVisible=false;
    @track leaveflag=false;
    @track performanceFlag=false;
    @track sectionFlags = {
        job: true,
        Applications: false, 
        Interviews: false,   
        offer: false, 
        TSign: false,
        Onboarding: false,
    };

     @track sectionIcons = {
        job: '\u2B9F', 
        Applications: '\u2B9C',
        Interviews: '\u2B9C', 
        offer: '\u2B9C',
        TSign: '\u2B9C',
        Onboarding: '\u2B9C',
           
    };
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute

        // Toggle the flag and update the icon dynamically
        this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
    }


    activeSections = ['Job Advertisements', 'Applications', 'Interviews', 'Offer and Documentation', 'Onboarding', 'TSign'];

    //Images to display side panel
    employee = My_Resource + '/myResource/images/employee.svg';
    recruitment = My_Resource + '/myResource/images/recruitment.svg';
    rewards = My_Resource + '/myResource/images/rewards.svg';
    training = My_Resource + '/myResource/images/training.svg';
    coming = My_Resource + '/myResource/images/Livesoon.png';
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Small';
    }
    @wire (organizationDetails) orgDeatails({ error, data }) {
        if (data) {
         
          this.orgid=data.listofPriceBook.Id;

          console.log('org Id==>'+this.orgid);
            this.error = undefined;
        } else if (error) {
            this.error = error;
        
        }
    
    }
    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,userOrgName]}) 
    currentUserInfo({error, data}) {
        if (data) {
            this.currentUserRole =data.fields.User_Role__c.value;

            if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ||this.currentUserRole == 'Portal Account Partner Manager'){
               this.isStaffVisible=true; 
               this.handleEmp();
            } 
            if(this.currentUserRole == 'Portal Account Partner User'){
                this.isStaffVisible=false;
                this.profileflag=true;

            }
        }
     else if (error) {
        this.error = error ;
    }
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
   
    @wire(CurrentPageReference)
    currentPageRef


    @api
    get propertyValue() {
        if(this.currentPageRef.state.c__propertyValue){
            return  this.currentPageRef.state.c__propertyValue
        }else{
            return 'staff';
        }
        
    }

    connectedCallback() {
        //alert("1111");
        //Default view of recruitment and onboard
       // this.handleOnboard();
       //this.handleEmp();
    //    this.disableRightClick();
       this.disableShortcuts(); 
       console.log('Property Value:', this.propertyValue);
       if(this.propertyValue=='leaves'){
        this.handleLeave();
    } 

   
    

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
                tempRec.NameId = '/' + tempRec.Id;
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


    //Onclick Recruitment & Onboard image
    handleOnboard() {
        this.profileflag=false;
        this.onboardFlag = true;
        this.empManagementflag = false;
        this.rewardsFlag = false;
        this.trainingFlag = false
        this.hrFlag = false;
        this.rosterFlag = false;
        this.isJobAdModalOpen = true;
        this.leaveFlag=false;
        this.performanceFlag=false; 
        this.openjobAdModal();

    }
    handleEmp() {
        this.profileflag=false;
        this.onboardFlag = false;
        this.empManagementflag = true;
        this.rewardsFlag = false;
        this.trainingFlag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = true;
        this.searchEmployee = false;
        this.addEmployee = false;
        this.leaveFlag=false;
        this.performanceFlag=false;
    }
    handleprofile() {
        this.profileflag=true;
        this.onboardFlag = false;
        this.empManagementflag = false;
        this.rewardsFlag = false;
        this.trainingFlag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee =false;
        this.searchEmployee = false;
        this.addEmployee = false;
        this.leaveFlag=false;
        this.performanceFlag=false;
    }



    handleRewards() {
        this.profileflag=false;
        this.rewardsFlag = true;
        this.trainingFlag = false;
        this.onboardFlag = false;
        this.empManagementflag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = false;
        this.searchEmployee = false;
        this.addEmployee = false;
        this.leaveFlag=false;
        this.performanceFlag=false;
    }
    handleTraining() {
        this.profileflag=false;
        this.trainingFlag = true;
        this.onboardFlag = false;
        this.rewardsFlag = false;
        this.empManagementflag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = false;
        this.searchEmployee = false;
        this.addEmployee = false;
        this.leaveFlag=false;
        this.performanceFlag=false;
    }
    handleLeave() {
        this.profileflag=false;
        this.trainingFlag = false;
        this.onboardFlag = false;
        this.rewardsFlag = false;
        this.empManagementflag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = false;
        this.searchEmployee = false;
        this.addEmployee = false;
        this.leaveFlag=true;
        this.performanceFlag=false;
    }
    handlePerformance(){            
        this.profileflag=false;
        this.trainingFlag = false;
        this.onboardFlag = false;
        this.rewardsFlag = false;
        this.empManagementflag = false;
        this.hrFlag = false;
        this.rosterFlag = false;
        this.viewEmployee = false;
        this.searchEmployee = false;
        this.addEmployee = false;
        this.leaveFlag=false; 
        this.performanceFlag=true;
        console.log('Performance Management123 clicked');
    }

    openjobAdModal() {
        // to open modal set isModalOpen tarck value as true
        this.isJobAdModalOpen = true;
        this.profileflag=false;
        this.jobAdDisplay = true;
        this.isAppstatusModalOpen = false;
        this.isinterviewsModalOpen = false;
        this.offerdocumentation = false;
        this.onboarding = false;
        this.tSign = false;
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
        this.tSign = false;
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
        this.tSign = false;
    }
    offerDocumentation() {
        this.isinterviewsModalOpen = false;
        this.isAppstatusModalOpen = false;
        this.isJobAdModalOpen = false;
        this.offerdocumentation = true;
        this.onboarding = false;
        this.tSign = false;
    }
    onBoarding() {
        this.isinterviewsModalOpen = false;
        this.isAppstatusModalOpen = false;
        this.isJobAdModalOpen = false;
        this.offerdocumentation = false;
        this.onboarding = true;
        this.tSign = false;
    }
    tSign() {
        this.isinterviewsModalOpen = false;
        this.isAppstatusModalOpen = false;
        this.isJobAdModalOpen = false;
        this.offerdocumentation = false;
        this.onboarding = false;
        this.tSign = true;
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
        this.leaveFlag=false;

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
        return this.isJobAdModalOpen ? ' slds-box Hrsubbutton' : 'slds-box '; // you can use your custom class here.
    }
    get selectedClassJobmob(){
        return this.isJobAdModalOpen ? 'slds-size_1-of-3 slds-box Hrsubbutton' : 'slds-size_1-of-3 slds-box'; // you can use your custom class here.
    }
    get selectedClassApplication(){
        return this.isAppstatusModalOpen ? ' slds-box Hrsubbutton' : ' slds-box'; // you can use your custom class here.
    }
    get selectedClassApplicationmob(){
        return this.isAppstatusModalOpen ? 'slds-size_1-of-3 slds-box Hrsubbutton' : 'slds-size_1-of-3 slds-box '; // you can use your custom class here.
    }
    get selectedClassinterview(){
        return this.isinterviewsModalOpen ? 'slds-box Hrsubbutton' : 'slds-box '; // you can use your custom class here.
    }
    get selectedClassinterviewmob(){
        return this.isinterviewsModalOpen ? 'slds-size_1-of-3 slds-box Hrsubbutton' : 'slds-size_1-of-3 slds-box '; // you can use your custom class here.
    }
    get selectedClassonboard(){
        return this.onboarding ? ' slds-box Hrsubbutton' : 'slds-box '; // you can use your custom class here.
    }
    get selectedClassonboardmob(){
        return this.onboarding ? 'slds-size_1-of-3 slds-box Hrsubbutton' : 'slds-size_1-of-3 slds-box '; // you can use your custom class here.
    }
    get selectedClassJoboffer(){
        return this.offerdocumentation ? ' slds-box Hrsubbutton' : 'slds-box'; // you can use your custom class here.
    }
    get selectedClassJoboffermob(){
        return this.offerdocumentation ? 'slds-size_2-of-3 slds-box Hrsubbutton' : 'slds-size_2-of-3 slds-box'; // you can use your custom class here.
    }


    get selectedClass(){
        return this.onboardFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }

    get selectedClassemp(){
        return this.empManagementflag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassprofile(){
        return this.profileflag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
   


    get selectedClassrewards(){
        return this.rewardsFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClasstraining(){
        return this.trainingFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassleave(){
        return this.leaveFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
    }
    get selectedClassPerformance(){          
        return this.performanceFlag ? 'HrClass2' : 'HrClass1'; // you can use your custom class here.
  
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
    handleSearchValue(event){
        this.searchValue=event.detail;
    }
   


}