import { LightningElement,track,api,wire } from 'lwc';
import fetchFeedback from '@salesforce/apex/ActivityStatementHandler.fetchFeedback';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import FirstName from '@salesforce/schema/User.FirstName'; 
import LastName from '@salesforce/schema/User.LastName';
import UserEmail from '@salesforce/schema/User.Email';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';

export default class FeedbackLwc extends LightningElement {
    @track addFeedback = true;
    @track staffFeedbackData = false;
    @track staffFeedbackNoData = false;
    @track isOpenModal = false;
    @track Listofdata_Pagination = [];
    @track recentEmpData = [];
    @api recordId = '';
    @api clientId;

    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number
    @track showSpinner=false;
    wiredFeedbackData;
    @track rating;
    @track staffName;
    @track comments;
    @track isOrgName;
    @track userEmail;
    @track userFName;
    @track userLName;
    @track feedbackRecords = [];     

    connectedCallback(){
        console.log('CLient Id >>'+ this.clientId);        
        if(this.clientId){
            refreshApex(this.wiredFeedbackData);
        }
    }
    handleCreate(){
        this.isOpenModal = true;
        this.addFeedback = false;        
        this.staffName = '';
        this.comments = '';
        this.recordId = '';
    }
    handleBack(){
        this.currentUrl = '';
        this.addFeedback = true;
        this.isOpenModal=false;
        refreshApex(this.wiredFeedbackData);
    }  

    hideModalBox(){
        this.isOpenModal=false;
        this.addFeedback = true;
        refreshApex(this.wiredFeedbackData);
    }
    @wire(fetchFeedback, { clientId: '$clientId' })
    wiredFeedback(response) {
        console.log('Response >>'+JSON.stringify(response));
        this.wiredFeedbackData = response; // Store the wire result for refreshApex
        const { data, error } = response;
        if (data) {
           // console.log('Fetch Feedback >' + JSON.stringify(data));
            let tempConList = [];
            data.forEach(record => {
                let tempRec = Object.assign({}, record);
                tempRec.Name = '/' + tempRec.Id;
                tempRec.staffName = tempRec.Staff__r.Name;
                tempRec.comments = tempRec.Comments__c;
                tempRec.userName = this.userFName +' '+this.userLName;
                tempRec.time = tempRec.Created_Time__c;                
                tempRec.rating = tempRec.Rating__c;
                const rating = tempRec.Rating__c || 0;
                tempRec.starRating = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                console.log('Rating >> '+tempRec.rating);
                tempConList.push(tempRec);
            });
            this.recentEmpData = tempConList;
            this.records = tempConList;
            this.totalRecords = data.length; // update total records count
            this.pageSize = this.pageSizeOptions[0]; // set pageSize with default value as first option
            this.pageNumber = 1;
            this.paginationHelper(); // Call your pagination method
            this.staffFeedbackData = this.recentEmpData.length > 0;
            this.staffFeedbackNoData = this.recentEmpData.length === 0;
           // this.showSpinner = false;
        } else if (error) {
            console.error('Error fetching feedback:', error);
            this.showSpinner = false;
        }
    }

    @wire(getRecord, { recordId: Id, fields: [UserOrgName,UserEmail,FirstName,LastName]}) 
    currentUserInfo({error, data}) {           
        if (data) {
            this.isOrgName = data.fields.Organization_Name__c.value;
            this.userEmail = data.fields.Email.value;
            this.userFName = data.fields.FirstName.value;
            this.userLName = data.fields.LastName.value;            
            console.log('User First Name >> '+ this.userFName);
            console.log('User Last Name >> '+ this.userLName);
           
        } else if (error) {
            this.usererror = error ;
        }
    }

    handleSubmit(event){  
        event.preventDefault(); 
        const fields=event.detail.fields;
        console.log('fields>>',fields);
        fields.Added_By__c=this.clientId; 
        fields.Rating__c = parseInt(this.rating);
        console.log('Rating on Submit >'+fields.Rating__c);
        this.template.querySelector('lightning-record-edit-form').submit(fields);              
        refreshApex(this.wiredFeedbackData);
        console.log('Updating the record ', JSON(stringify(fields)));        
        this.addFeedback = true;
        this.isOpenModal = false;        
    } 

    handleSuccess(event){
        this.recordId=event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully !!',
                variant: 'success',
            }),
        );  
        this.isOpenModal = false;   
        this.addFeedback = true;
        setTimeout(() => {
            refreshApex(this.wiredFeedbackData);
            this.showSpinner = false;
        }, 5000); 
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
        this.Listofdata_Pagination = [];
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
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
       // console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.Listofdata_Pagination = tempconList;
        refreshApex(this.wiredFeedbackData);
    }

    get stars() {
        let starsArray = [];
        for (let i = 1; i <= 5; i++) {
            starsArray.push({
                class: i <= this.rating ? 'star-filled' : 'star-empty',
                index: i // Add index to track the star
            });
        }
        return starsArray;
    }

    // Handle click event on stars
    handleStarClick(event) {
        const selectedStar = event.target.dataset.index; // Get the clicked star index
        this.rating = parseInt(selectedStar); // Update the rating with the selected star index
    }

    handleEdit(event) {              
        this.recordId = event.currentTarget.dataset.id;
        console.log('Record Id >>'+this.recordId);
        const recordToEdit =  this.records.find(record => record.Id === this.recordId);
       // const recordToEdit = this.feedbackRecords.find(record => record.Id === this.recordId);

        if (recordToEdit) {            
            this.rating = recordToEdit.Rating__c; // Set the current rating for the stars UI
        }
        this.isOpenModal = true;
        this.addFeedback = false;        
    }

    fetchRefreshFeedback(){
       this.showSpinner = true;
        this.records=[];
        setTimeout(() => {
            refreshApex(this.wiredFeedbackData);
            this.showSpinner = false;
        }, 2000); 
    }
}