import { LightningElement, track, api } from 'lwc';
import savFundTransfer from '@salesforce/apex/ClientFundTransferHandler.savFundTransfer';
import fundTrackerRecord from '@salesforce/apex/ClientFundTransferHandler.fundTrackerRecord';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchfundTracker from '@salesforce/apex/ClientFundTransferHandler.fetchfundTracker';

const actions = [   
    { label: 'Edit', name: 'edit' }    
 ];

export default class ClientFundTranfer extends LightningElement {

     //Nagendra code for Pagination Start
     @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
     @track records = []; //All records available in the data table
     @track columns = []; //columns information available in the data table
     @track totalRecords = 0; //Total no.of records
     @track pageSize; //No.of records to be displayed per page
     @track totalPages; //Total no.of pages
     @track pageNumber = 1; //Page number    
     @track recordsToDisplay = []; //Records to be displayed on the page
 
     get bDisableFirst() {
         return this.pageNumber == 1;
     }
     get bDisableLast() {
         return this.pageNumber == this.totalPages;
     }
     //Nagendra code for Pagination End

    @track chartJSLoaded;
    @track chart;
    @track creaetFundFlag = false;
    @track displayFundTracker = false;
    @track newAddFundTracker;
    @track createAddNew = false;
    @track isOpenModal = false;
    @track objectApiName = 'Client__c';

    @track amountApprovedValue;
    @track amountApprovedDateValue;
    @track amount;
    @track gst;
    @track serviceStatus;
    @track description;
    @track serviceDate;
    @track fundTrackList = [];
    @api clientId;
    @track fundRecord;
    @track serviceType;
    @track approvedDate;
    @track amountApproved;
    @track availableFunds;
    @track error;
    @track accList;
    @track recordId;
    @track rowOffset = 0;
    @track isEdit=false;
    @track isFileAttached=false;
    @track statu;
    @track paginationVisible=false;    
    
    @track columns = [       
        {label: 'Service Type', fieldName: 'Registration_Group__c', initialWidth: 160, wrapText:true },
        {label: 'Approved Start Date', fieldName: 'Approved_Date__c', type: 'date',
        typeAttributes:{day: "2-digit",month: "2-digit",year: "numeric"}, initialWidth: 150},
        {label: 'Approved Fund',fieldName: 'Amount_approved__c',type: 'currency', initialWidth: 150,cellAttributes: { alignment: 'left' }},
        {label: 'Spent',fieldName: 'Spent_Amt__c',type: 'currency', initialWidth: 80,cellAttributes: { alignment: 'left' }},
        {label: 'Available Funds',fieldName: 'Available_Funds__c',type: 'currency', initialWidth: 150,cellAttributes: { alignment: 'left' }},
        {label: 'Status',fieldName: 'Status__c', initialWidth: 80},
        {
            label: 'Action',
            type: 'action',
            initialWidth: 150,
            typeAttributes: {
                rowActions: actions,
            }
        }
    ];
        
    get animationclass() {
        return this.template ? 'right-align' : 'right-align-reverse';
    }
    constructor() {
        super();
        this.chartJSLoaded = false;
    }
    handleChange(event) {
        console.log(event.detail.name);
        if (event.target.name == 'amountApproved') {
            this.amountApprovedValue = event.detail.value;
            console.log('amountApprovedValue  ', this.amountApprovedValue);
        }
        if (event.target.name == 'amountApprovedDate') {
            this.amountApprovedDateValue = event.target.value;
            console.log('amountApprovedDateValue  ', this.amountApprovedDateValue);
        }
        if (event.target.name == 'amount') {
            this.amount = event.target.value;
            console.log('amount  ', this.amount);
        }
        if (event.target.name == 'gst') {
            this.gst = event.target.value;
            console.log('gst  ', this.gst);
        }
        if (event.target.name == 'serviceStatus') {
            this.serviceStatus = event.target.value;
            console.log('serviceStatus  ', this.serviceStatus);
        }
        if (event.target.name == 'description') {
            this.description = event.target.value;
            console.log('description  ', this.description);
        }
        if (event.target.name == 'serviceDate') {
            this.serviceDate = event.target.value;
            console.log('serviceDate  ', this.serviceDate);
        }
    }
    handleClick() {
        savFundTransfer({
            clientId: this.clientId, amountApprovedValue: this.amountApprovedValue,
            amountApprovedDateValue: this.amountApprovedDateValue
        }).then(result => {
            fundTrackerRecord({ clientId: this.clientId }).then(response => {
                this.fundRecord = response.Id;
                this.displayFundTracker = true;
                this.creaetFundFlag = false;                
            })           
        })
    }

    handleFund() {
        this.displayFundTracker = false;
        fetchfundTracker({ clientId: this.clientId }).then(result=>{            
            if (result != null) {                
                this.records = result.map(item => {
                    return {
                        id: item.Id,
                        registrationGroup: item.Registration_Group__c,
                        status: item.Status__c,
                        approvedDate: item.Approved_Date__c? new Date(item.Approved_Date__c).toLocaleDateString('en-GB') : '',  
                        amountApproved: `$${item.Amount_approved__c}`, 
                        availableFunds: `$${item.Available_Funds__c}`, 
                        spentAmount: `$${item.Spent_Amt__c}`
                    };
                });
                
                this.totalRecords = result.length; // update total records count                 
                this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                this.pageNumber = 1;
                if(this.totalRecords>0){
                    this.paginationVisible=true;
                 }
                this.paginationHelper(); // call helper menthod to update pagination logic 
                this.newAddFundTracker = true;
                this.displayFundTracker = true;
            }
            else
            {
                this.newAddFundTracker = false;
                this.displayFundTracker = false;
            }
        }).catch(error=>{
            this.accList = undefined; 
            this.error = error;
        })
    }

    connectedCallback() {
        this.handleFund();
        fundTrackerRecord({ clientId: this.clientId }).then(response => {
            if (response === null) {
            } else {
                this.fundRecord = response.Id;
                this.displayFundTracker = true;
            }
        });       
    }

    handleFundSpent() {
        console.log('calling method');        
        
        this.createAddNew=true;
        this.creaetFundFlag=false;
        this.displayFundTracker= false;
    }

    //Nagendra Pagination code start
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
        this.accList = [];
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.accList.push(this.records[i]);
            
        }     
        console.log('accList'+JSON.stringify(this.accList));   
    }
    //Nagendra Pagination Code End

    handleClose() {
        this.createAddNew = false;
    }

    renderedCallback() {
        loadScript(this, ChartJS)
            .then(() => {
                this.chartJSLoaded = true;
                this.template.querySelector('c-pie-chart-lwc ').buildChart();
            })
            .catch((error) => {
        });
    }

    handleError(event)
    {              
        this.showToast(event.detail.detail);
    }

    showToast(msg){
        const event = new ShowToastEvent({
            title: 'Error',
            message: msg,
            variant: 'Error',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    handleSubmit(event){
        this.createAddNew=false;
        this.isEdit=false;
        console.log('onsubmit event recordEditForm'+ event.detail.fields);

        event.preventDefault();
        const fields=event.detail.fields;
        fields.Client__c=this.clientId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleSuccess(event){
        this.handleFund(); 
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully !!',
                variant: 'success',
            }),
        ); 
    }

    hideModalBox(){
        this.createAddNew=false;
        this.isEdit=false;
        this.displayFundTracker= true;
    }

    toast(title){
        const toastEvent = new ShowToastEvent({
            title, 
            variant:"success"
        })
        this.dispatchEvent(toastEvent)
    }

    handleRowActions(event) {
        const actionName = event.currentTarget.dataset.name;
        const row = event.currentTarget.dataset.accid;
        console.log('row'+row);;
        this.recordId = row;
        switch (actionName) {        
            case 'edit':          
                this.isEdit=true;
                this.recordId = row;
                //this.createAddNew = false;
                this.displayFundTracker= false;
                break; 
                       
        }
    }
}