import { LightningElement, track, wire, api } from 'lwc';
//Import apex method 
import fetchFacilitiess from '@salesforce/apex/StaffController.fetchStaffs';
import statusStaff from '@salesforce/apex/StaffController.statusStaff';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import My_Resource from "@salesforce/resourceUrl/myResource";



export default class StaffDataWithPagination extends NavigationMixin(LightningElement) {
    employee = My_Resource + '/myResource/images/employee.svg';
    // JS Properties
    @track address;
    recordId;
    subscription = {};
    CHANNEL_NAME = '/event/RefreshDataTable__e';
    records = []; //All records available in the data table
    totalRecords = 0; //Total no.of records
    pageSize; //No.of records to be displayed per page
    totalPages; //Total no.of pages
    pageNumber = 1; //Page number    
    recordsToDisplay = []; //Records to be displayed on the page
    @track refreshTable = [];
    @track recordsToDisplay = [];
    @api selectedName;
    @api facilityButton;
    @track orgNam = '';
    @track visible = false;
    @track fname = '';
    @track lname = '';
    @track firstname='';
    @track lastname ='';


    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    // connectedCallback method called when the element is inserted into a document
    connectedCallback() {


        //Platform Event 
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        onError(error => {
            console.error('Received error from server: ', error);
        });
    }

    handleEvent = event => {
        const refreshRecordEvent = event.data.payload;
        if (refreshRecordEvent.RecordId__c === this.recordId) {
            this.recordId = '';
            return refreshApex(this.refreshTable);
        }
    }

    disconnectedCallback() {
        unsubscribe(this.subscription, () => {
            console.log('Successfully unsubscribed');
        });
    }

    @wire(fetchFacilitiess, { recordId: '$selectedName', firstname: '$firstname', lastname: '$lastname' }) recordsToDisplay(result) {

        this.refreshTable = result;
        if (result.data) {
            //console.log('RESULT--> ' + JSON.stringify(result));
            this.records = result.data;
            this.totalRecords = result.data.length; // update total records count                 
            this.pageSize = 6;
            if (this.totalRecords > 6) {
                this.visible = true;
            }
            //console.log('Org details Key : ',keyValue);
            // this.pageSizeOptions[0]; //set pageSize with default value as first option
            this.paginationHelper(); // call helper menthod to update pagination logic 
        }

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
    // JS function to handel pagination logic 
    paginationHelper() {
        this.recordsToDisplay = [];
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.recordsToDisplay.push(this.records[i]);
        }
        refreshApex(this.refreshTable);

    }

    handleClear() {
        let listOfsearchString = [];
        this.fname = '';
        this.lname = '';

    }

    handleSearch(event) {
        console.log(event.target.label);
        var inp = this.template.querySelectorAll("lightning-input");
        let listOfsearchString = [];

        inp.forEach(function (element) {

            if (element.name == "fname") {
                this.fname = element.value;
                listOfsearchString.push(element.value);
            }

            else if (element.name == "lname") {
                this.lname = element.value;
                listOfsearchString.push(element.value);
            }


        }, this);
        console.log(JSON.stringify(listOfsearchString));
        fetchFacilitiess({ recordId: this.selectedName, firstname: this.fname, lastname: this.lname })
            .then(response => {
                this.refreshTable = response;               
                    console.log('RESULT--> ' + JSON.stringify(response));
                    this.records = response;
                    this.totalRecords = response.length; // update total records count                 
                    this.pageSize = 6;
                    if (this.totalRecords > 6) {
                        this.visible = true;
                    }
                    
                this.paginationHelper(); 
                
            });
    }


    // create a new facility
    handleCreateNewFacility() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Staff__c',
                actionName: 'new',
            },
        });

    }

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    handleEditFacility(event) {

        let facId = event.currentTarget.dataset.id;
        this.recordId = facId;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: facId,
                objectApiName: 'Staff__c',
                actionName: 'edit'
            },
        });
    }

    handlefacStatus(event) {
        let facId = event.currentTarget.dataset.id;
        let facstatus = event.target.dataset.name;
        let finalStatus;
        let message;
        if (facstatus == 'true') {
            finalStatus = 'false';
            message = 'Staff is Inactive'
        }
        else if (facstatus == 'false') {
            finalStatus = 'true';
            message = 'Staff is Active'
        }
        statusStaff({ IdValue: facId, status: finalStatus }).then(response => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: '',
                    message: message,
                    variant: 'success'
                })
            );

            refreshApex(this.refreshTable);

        });

    }

}