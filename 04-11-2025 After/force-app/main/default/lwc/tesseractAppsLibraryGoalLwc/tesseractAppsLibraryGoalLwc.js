import { LightningElement , wire, api, track } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getUserDetails from '@salesforce/apex/PerformanceController.getUserDetails';
import getLibraryGoals from '@salesforce/apex/PerformanceController.getLibraryGoals';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import { getRecord } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id'; 
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import { refreshApex } from '@salesforce/apex';

export default class TesseractAppsLibraryGoalLwc extends LightningElement {
    @api orgid;
    @track homeflag=true;
    @track libraryGoalData=[];
    @track records=[];
    @track noRecordsFlag=false;
    //@track totalRecords;
    @track levelId;
    @track orgRoles;
    @track description;
    @track actualWeightage;
    @track organisationRoles=[];
    @track levelOptions=[];
    @track addLibraryGoalFlag=false;
    @track userDetails={};
    @track isCreateDisabled=false;
    wiredLibraryResult;
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; 
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track paginationVisible=false;
    // levelOptions =[
    //     { label:'Roster Manager',value:'Roster Manager'},
    //     { label:'HR Admin',value:'HR Admin'},
    //     { label:'NDIS Staff',value:'NDIS Staff'},
    //     { label:'Payroll Admin',value:'Payroll Admin'},
    //     /*{ label:'ICT Staff',value:'ICT Staff'},
    //     { label:'Outlet Admin',value:'Outlet Admin'},
    //     { label:'Tesseract Admin',value:'Tesseract Admin'},
    //     { label:'ICT Admin',value:'ICT Admin'},
    //     { label:'Dev Admin',value:'Dev Admin'},
    //     { label:'NDIS Participants',value:'NDIS Participants'},
    //     { label:'Payroll Accountant for Multiple',value:'Payroll Accountant for Multiple'},
    //     { label:'Accountant for Organisation',value:'Accountant for Organisation'}*/
    // ]
    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName,UserType]}) 
    userDetailsData({error, data}) {
        if (data) {
           //  console.log('orgid '+this.orgid);
            this.currentUser = data.fields.Name.value; 
            this.userEmail=data.fields.Email.value;
            this.userRole =data.fields.User_Role__c.value;
            this.userType  =data.fields.User_Type__c.value;
            
            if(this.userType==='HR Admin' || this.userType==='NDIS Org Admin' || this.userType==='Facility Admin'){
                this.isCreateDisabled=false;
            } else{
                this.isCreateDisabled=true;
            }
           
            console.log('orgid '+this.orgid);
        } else if (error) {
            this.usererror = error ;
        }
    }
    connectedCallback() {
        console.log('orgid connectedCallback '+this.orgid);
        
        organizationDetails().then(response => {
           
        let orgRoles= response.listofPriceBook.Roles__c;
        //console.log('listofPriceBook:', response.listofPriceBook);
        this.organisationRoles = orgRoles.split(";").sort().map(rec => {
            return {
            value: rec,
            label: rec
            };
        });
           
        //console.log('org roles '+ JSON.stringify(this.organisationRoles));
            
        });
        window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
    }

    disconnectedCallback() {
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
    }

    @wire(getUserDetails)
    wiredUserDetails({data,error}){
            if(data){
                 this.userDetails=data;
                 //console.log('userDetails IN wiredUserDetails : '+JSON.stringify(this.userDetails ));
                 const userTypes = Object.keys(this.userDetails);
                 this.levelOptions = userTypes.map(type => ({
                    label: type,  // The label that will appear in the dropdown
                    value: type   // The actual value that will be passed when selected
                })); 
                 //console.log('levelOptions :', JSON.stringify(this.levelOptions)); 
            } else if(error){
                  console.log('Error fetching User etails : '+error);
            }
    }
    @wire(getLibraryGoals, {  orgid: '$orgid',levelId: '' })
    wiredLibraryData(result) {
        this.wiredLibraryResult = result; 
        console.log('orgid WIRE '+this.orgid);
        //console.log('wiredLibraryResult: '+JSON.stringify(this.wiredLibraryResult));
        const { data, error } = result; // Destructure data and error from the result

        if (data) {
           
            this.libraryGoalData = data; 
            this.records=this.libraryGoalData;
            //console.log('records IN WIRE:' + JSON.stringify(this.records));
            this.totalRecords=this.libraryGoalData.length;
            console.log('totalRecords in wire: '+this.totalRecords);
            this.pageSize = this.pageSizeOptions[0]; 
            this.pageNumber = 1;
            if(this.totalRecords>0){
                this.paginationVisible=true;
             }
            this.paginationHelper();
           // console.log('libraryGoal Data IN WIRE '+ JSON.stringify( this.libraryGoalData));
           
        } else if (error) {
            console.error("Error fetching data:", error); // Handle error
        }
       // this.paginationHelper();
    }
    
    handleNewLibrary(){ 
        this.addLibraryGoalFlag=true;
        this.homeflag = true;  
        this.clearLibraryFields(); 
    }
    handleClose(){
        this.addLibraryGoalFlag=false;
        this.homeflag = true; 
        this.clearLibraryFields();
    }
    handleChange(event){
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        switch (fieldName) {
            case 'levelId':
                this.levelId = fieldValue;
                console.log('levelId ' + this.levelId);
                break;
            case 'role':
                this.orgRoles = fieldValue;
                console.log('role' + this.orgRoles);
                break;
                case 'description':
                this.description = fieldValue;
                console.log('role' + this.description);
                break;
        }
    }
    handleSubmit(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
        if (!this.levelId) {
            const toastEvent = new ShowToastEvent({
                title: "Error",
                message: "Please fill mandatory fields.",
                variant: "error"
            });
            this.dispatchEvent(toastEvent);
            return; // Stop the submit if validation fails
        }
       
        const goalName = event.detail.fields.Name;
       // console.log('goalName in submit : '+goalName);
        //console.log('libraryGoalData in submit : '+JSON.stringify(this.records));
        const existingGoal = this.records.find(goal => goal.Name === goalName);// Assuming `this.libraryGoalName` holds the new goal name
       // console.log('existingGoal  IN SUBMIT: '+JSON.stringify(existingGoal));
        if (existingGoal) {
            const toastEvent = new ShowToastEvent({
                title: "Error",
                message: "A library goal with this name already exists.",
                variant: "error"
            });
            this.dispatchEvent(toastEvent);
            return; // Stop the submit if the goal name already exists
        }
       
        // if (!this.actualWeightage) {
        //     alert("Please fill in all required fields.");
        //     return;
        // }
        
        const fields = event.detail.fields; 
        fields.Level__c = this.levelId;
        fields.Role__c = this.orgRoles;
        fields.Description__c = this.description;
        this.actualWeightage=fields.Actual_Weightage_of_the_Goal__c;
        fields.Organization__c=this.orgid;
        //fields.Actual_Weightage_of_the_Goal__c = this.actualWeightage; 
        // console.log('actualWeightage  IN SUBMIT123: '+this.actualWeightage);
        // if (this.actualWeightage>100) {
        //     const toastEvent = new ShowToastEvent({
        //         title: "Error",
        //         message: "Actual weightage of the goal should not exceed 100%",
        //         variant: "error"
        //     });
        //     this.dispatchEvent(toastEvent);
        //     return; 
        // }
        if (this.actualWeightage <= 0 || this.actualWeightage > 100) {
            let message = '';
        
            if (this.actualWeightage <= 0) {
                message = 'Actual Weightage of the goal should be greater than 0.';
            } else if (this.actualWeightage > 100) {
                message = 'Actual weightage of the goal should not exceed 100%.';
            }
        
            const toastEvent = new ShowToastEvent({
                title: "Error",
                message: message,
                variant: "error"
            });
            this.dispatchEvent(toastEvent);
            return; 
        }
        
        console.log('actualWeightage IN SUBM: ' + this.actualWeightage);
       // console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form').submit(fields); 
        this.addLibraryGoalFlag=false;
       
        this.homeflag = true;
       // this.clearLibraryFields();
        refreshApex(this.wiredLibraryResult); 
    }
    handleSuccess(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Goal created successfully.",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        let libraryGoalId = event.detail.id;
        
        let libraryGoal = event.detail.fields.Name.value;// example of using event detail
        let actualWeightage = event.detail.fields.Actual_Weightage_of_the_Goal__c.value; 
        console.log('Library Goal Record ID:', libraryGoalId);
        console.log('Library Goal name:', libraryGoal);
        console.log('actualWeightage:', actualWeightage);
        console.log('this.levelId:', this.levelId);
    
        refreshApex(this.wiredLibraryResult);
        this.clearLibraryFields();
    }
    
    clearLibraryFields(){
        this.levelId='';
        this.orgRoles='';
        this.description='';
        this.actualWeightage='';
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
       // this.pageSize = this.pageSizeOptions[0]; 
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
        
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            } 
                 
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
      //  console.log('calling pagination Data tempConRec >>'+JSON.stringify(tempConRec));
       // console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.libraryGoalData = tempconList;
    }
    
    // Pagination Refresh (e.g., when data is updated)
    paginationrefresh() {
        refreshApex(this.wiredLibraryResult).then(() => {
            // Reset to the first page after data refresh
            this.pageNumber = 1;
            this.pageSize = this.pageSizeOptions[0]; // Set default page size
             this.paginationHelper();
         
        }).catch(error => {
            console.error('Error refreshing data: ', error);
        });
    }   

    handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            event.preventDefault();
            this.handleNewLibrary();
            }
    }
}