import { LightningElement, track, api } from 'lwc';
import savFundTransfer from '@salesforce/apex/ClientFundTransferHandler.savFundTransfer';
import fundTrackerRecord from '@salesforce/apex/ClientFundTransferHandler.fundTrackerRecord';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchfundTracker from '@salesforce/apex/ClientFundTransferHandler.fetchfundTracker';
import getNDISServiceLineItem from '@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem';
import insertClientFundTrackerLinks from '@salesforce/apex/ServiceSupportPlanHandler.insertClientFundTrackerLinks';
import getSelectedSupportItems from '@salesforce/apex/ClientFundTransferHandler.getSelectedSupportItems';
import deletedSelectedId from '@salesforce/apex/ClientFundTransferHandler.deletedSelectedId';
import checkFundExists from '@salesforce/apex/ClientFundTransferHandler.checkFundExists';

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
    @track headeringName;
    @track buttonName ='';  
    @track showSpinner=false;
    
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
                        spentAmount: `${item.Spent_Amt__c}`,
                        state: item.State__c
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
        this.displayFundTracker= true;
        this.recordId = '';
        this.serviceGroupName =[];
        this.stateValue='';
        this.headeringName = 'Add New Fund';
        this.buttonName = 'Save';
        this.NdisServiceGroupName = false;
        this.serviceTypeName = '';
        this.saveDisabled = true;
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

    @track supportCatalogList = []; // List of all NDIS Support Catalog items
    @track preSelectedSupportItemIds = []; 

    handleRowActions(event) {
        const actionName = event.currentTarget.dataset.name;
        const rowId = event.currentTarget.dataset.accid;
        console.log('row: ' + rowId);
        this.recordId = rowId;
        this.stateValue = event.currentTarget.dataset.state;
        console.log('State values in edit :' + this.stateValue);
        this.serviceTypeName = event.currentTarget.dataset.fundname;
        console.log('on edit service type :' + this.serviceTypeName);       
        this.approvedDate = event.currentTarget.dataset.approveddate;
        console.log('Raw approved date:', this.approvedDate);
    
        // Format the approved date from dd/mm/yyyy to yyyy-mm-dd
        if (this.approvedDate) {
            const parts = this.approvedDate.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                this.approvedDate = `${year}-${month}-${day}`;
                console.log('Formatted approved date (yyyy-mm-dd):', this.approvedDate);
            } else {
                console.error('Unexpected approvedDate format:', this.approvedDate);
            }
        }
    
        if (actionName === 'edit') {
            this.headeringName = 'Update Funds Tracker';
            this.isEdit = true;
            this.createAddNew = false; // make sure add mode is OFF
            this.displayFundTracker = false;
            this.buttonName = 'Update';
            this.serviceGroupName = [];
    
            // Step 1: Fetch NDIS Service Line Items
            getNDISServiceLineItem({ ServiceItemNames: this.serviceTypeName, ServiceDate: this.approvedDate })
                .then(ndisResponse => {
                    let fetchedItems = ndisResponse.map(item => {
                        const amount = item[this.stateValue];
                        return {
                            ...item,
                            amount: amount !== undefined ? amount : 0.00,
                            checkbox: false // default unchecked
                        };
                    });
    
                    // Step 2: Fetch selected support items
                    return getSelectedSupportItems({ fundTrackerId: rowId, clientId: this.clientId, state: this.stateValue })
                        .then(selectedItems => {
                            console.log('Selected Items from EDIT: ' + JSON.stringify(selectedItems));
    
                            // Step 3: Mark matched items as selected
                            fetchedItems = fetchedItems.map(item => {
                                const match = selectedItems.find(sel =>
                                    sel.NDIS_Support_Catalogue__c === item.Id
                                );
                                if (match) {
                                    return {
                                        ...item,
                                        junctionId: match.Id,
                                        isSelected: true
                                    };
                                }
                                return item;
                            });
    
                            this.records1 = fetchedItems;
                            this.totalRecords1 = this.records1.length;
                            this.pageSize1 = this.pageSizeOptions1[0];
                            this.pageNumber1 = 1;
                            this.paginationHelper1();
                            this.NdisServiceGroupName = true;
                            console.log('Updated serviceGroupName with checkbox and Id:', JSON.stringify(this.serviceGroupName));
                        })
                        .catch(error => {
                            console.error('Error fetching selected support items: ', error);
                            this.serviceGroupName = fetchedItems;
                        });
    
                })
                .catch(error => {
                    console.error('Error fetching NDIS Catalog data', error);
                    this.serviceGroupName = [];
                });
        }
    }
        

    // Method to determine if a checkbox should be pre-checked
    isChecked(itemId) {
        return this.selectedServiceRows.includes(itemId);
    }

    
    @track serviceTypeName = '';
    @track NdisServiceGroupName = false;
    @track serviceGroupName = [];
    @track isDisbaleServiceButton = false;
    @track stateValue='';
    @track errorMessage;
   
    @track errorMessageFlag = false;
    @track ServiceStateEditValue='';
    get stateOptions(){
        return [{ label: 'ACT', value: 'ACT__c' },{ label: 'NSW', value: 'NSW__c' },{ label: 'NT', value: 'NT__c' },{ label: 'QLD', value: 'QLD__c' },{ label: 'SA', value: 'SA__c' }, { label: 'TAS', value: 'TAS__c' }, { label: 'VIC', value: 'VIC__c' }, { label: 'WA', value: 'WA__c' },];
    }

    handleServiceChange(event) {
        const name = event.target.name;
        const value = event.target.value;
        if (name === 'serviceType') {
            this.serviceTypeName = value;
        } else if (name === 'approvedDate') {
            this.approvedDate = value;
        }
        console.log('Approved Date : '+this.approvedDate);

        this.serviceGroupName = [];
        this.NdisServiceGroupName = false;
        this.stateValue = '';

        if(this.serviceTypeName && this.clientId){
            checkFundExists({ 
            clientId: this.clientId, 
            serviceType: this.serviceTypeName
            }).then(exists => {
                if (exists) {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Error',
                        message: 'Fund already exists for this Participant.',
                        variant: 'error'
                    }));
                    this.serviceGroupName = []; // clear items
                    return;
                } else {
                    // Optional: Call fetch logic if no duplicate fund found
                    getNDISServiceLineItem({ 
                        ServiceItemNames: this.serviceTypeName, 
                        ServiceDate: this.approvedDate 
                    })
                    .then(response => {
                        this.serviceGroupName = response.map(item => ({
                            ...item
                        }));
                    })
                    .catch(error => {
                        console.error('Error fetching NDIS Catalog:', error);
                        this.serviceGroupName = [];
                    });
                }
            })
        }

        if (this.serviceTypeName && this.approvedDate) {
           // this.isDisbaleServiceButton = true;
            const approvedDateObj = new Date(this.approvedDate);

           // const approvedDateObj = new Date(this.approvedDate);
            const formattedApprovedDate = approvedDateObj.toISOString().split('T')[0];

            console.log('Approved Date:', formattedApprovedDate);

            // Define financial year ranges
            const fy2023Start = new Date('2023-07-01');
            const fy2024End = new Date('2099-06-30');

            console.log('Approved Date Object:', approvedDateObj);
            console.log('FY Start:', fy2023Start, 'FY End:', fy2024End);

            // Check if the approved date falls within 2023-24 or 2024-25 FY
            if (approvedDateObj < fy2023Start || approvedDateObj > fy2024End) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Invalid Date',
                    message: 'Please select an Approved Date after July 1st 2023 financial year.',
                    variant: 'error',
                }));
                return;
            }

            getNDISServiceLineItem({ ServiceItemNames: this.serviceTypeName, ServiceDate:this.approvedDate })
                .then(response => {
                    console.log('Response Data :'+JSON.stringify(response));
                    this.serviceGroupName = response.map(item => ({
                        ...item/* ,
                        isSelected: false */ // optional checkbox management
                    }));
                    console.log('Fetched NDIS Catalog items:', JSON.stringify(this.serviceGroupName));                   
                })
                .catch(error => {
                    console.error('Error fetching NDIS Catalog data', error);
                    this.serviceGroupName = [];
                });
               
        } else {
            this.NdisServiceGroupName = false;
            this.serviceGroupName = [];
        }
    }
    @track selectedSupportItemsGlobal = []; // holds selected items across states
    handleServiceStateChange(event) {
        this.stateValue = event.target.value;
        this.NdisServiceGroupName = false;

        if (this.stateValue) {
            const selectedLabel = this.stateOptions.find(opt => opt.value === this.stateValue)?.label;
            this.selectedStateForBackend = selectedLabel;

            getNDISServiceLineItem({ ServiceItemNames: this.serviceTypeName, ServiceDate: this.approvedDate })
                .then(ndisResponse => {
                    let newStateItems = ndisResponse.map(item => {
                        const amount = item[this.stateValue];
                        return {
                            ...item,
                            amount: amount !== undefined ? amount : 0.00,
                            isSelected: false
                        };
                    });

                    if (this.isEdit) {
                        return getSelectedSupportItems({ fundTrackerId: this.recordId, clientId: this.clientId, state: this.stateValue })
                            .then(previouslySelected => {
                                // Mark existing ones as selected
                                newStateItems = newStateItems.map(item => {
                                    const match = previouslySelected.find(sel => sel.NDIS_Support_Catalogue__c === item.Id);
                                    if (match) {
                                        item.isSelected = true;
                                        item.junctionId = match.Id;
                                    }
                                    return item;
                                });

                                // Merge global selected support items
                                const previouslySelectedIds = this.selectedSupportItemsGlobal.map(i => i.Id);
                                const newSelections = newStateItems.filter(i => i.isSelected && !previouslySelectedIds.includes(i.Id));
                                this.selectedSupportItemsGlobal = [...this.selectedSupportItemsGlobal, ...newSelections];

                                // Combine all current records: show only unique by Id
                                const allItemsMap = new Map();
                                [...this.selectedSupportItemsGlobal, ...newStateItems].forEach(item => {
                                    allItemsMap.set(item.Id, item); // avoids duplication
                                });

                                this.records1 = Array.from(allItemsMap.values());
                                this.totalRecords1 = this.records1.length;
                                this.pageSize1 = this.pageSizeOptions1[0];
                                this.pageNumber1 = 1;
                                this.paginationHelper1();
                            });
                    } else {
                        // Create mode
                        const newSelections = newStateItems.filter(i => i.isSelected);
                        const previouslySelectedIds = this.selectedSupportItemsGlobal.map(i => i.Id);
                        const mergedSelections = [...this.selectedSupportItemsGlobal];

                        newSelections.forEach(item => {
                            if (!previouslySelectedIds.includes(item.Id)) {
                                mergedSelections.push(item);
                            }
                        });

                        this.selectedSupportItemsGlobal = mergedSelections;

                        const allItemsMap = new Map();
                        [...this.selectedSupportItemsGlobal, ...newStateItems].forEach(item => {
                            allItemsMap.set(item.Id, item);
                        });

                        this.records1 = Array.from(allItemsMap.values());
                        this.totalRecords1 = this.records1.length;
                        this.pageSize1 = this.pageSizeOptions1[0];
                        this.pageNumber1 = 1;
                        this.paginationHelper1();
                    }
                })
                .catch(error => {
                    console.error('Error fetching records after state change:', error);
                    this.records1 = [];
                });
        }
    }

   /*  handleServiceStateChange(event) {
        this.stateValue = event.target.value;
        console.log('Selected state value: ', this.stateValue);
        this.NdisServiceGroupName = false;
        if (this.stateValue) {
            const selectedLabel = this.stateOptions.find(opt => opt.value === this.stateValue)?.label;
            this.selectedStateForBackend = selectedLabel;
            console.log('Selected state label to be saved: ', this.selectedStateForBackend);
    
            // Re-fetch based on current selected values
            getNDISServiceLineItem({ ServiceItemNames: this.serviceTypeName, ServiceDate: this.approvedDate })
                .then(ndisResponse => {
                    let fetchedItems = ndisResponse.map(item => {
                        const amount = item[this.stateValue];
                        return {
                            ...item,
                            amount: amount !== undefined ? amount : 0.00,
                            checkbox: false
                        };
                    });
    
                    // If you're in edit mode, match selected support items
                    if (this.isEdit) {
                        return getSelectedSupportItems({ fundTrackerId: this.recordId, clientId: this.clientId, state: this.stateValue })
                            .then(selectedItems => {
                                console.log('Selected Items on state change (edit): ' + JSON.stringify(selectedItems));
    
                                fetchedItems = fetchedItems.map(item => {
                                    const match = selectedItems.find(sel =>
                                        sel.NDIS_Support_Catalogue__c === item.Id
                                    );
                                    if (match) {
                                        return {
                                            ...item,
                                            junctionId: match.Id,
                                            isSelected: true
                                        };
                                    }
                                    return item;
                                });
                               
                                this.records1 = fetchedItems;
                                this.totalRecords1 = this.records1.length;
                                this.pageSize1 = this.pageSizeOptions1[0];
                                this.pageNumber1 = 1;
                                this.paginationHelper1();
                               
                            });
                    } else {
                        // Create mode — just update list
                        this.records1 = fetchedItems;
                        this.totalRecords1 = this.records1.length;
                        this.pageSize1 = this.pageSizeOptions1[0];
                        this.pageNumber1 = 1;
                        this.paginationHelper1();
                    }
                })
                .catch(error => {
                    console.error('Error fetching records after state change:', error);
                    this.records1 = [];
                });
        }
    } //Working code */

    @track selectedServiceRows = []; // To hold selected rows
    @track saveDisabled = true;

    handleCheckboxSelection(event) {
        const rowId = event.target.dataset.id;
        const rowName = event.target.dataset.name;
        const isChecked = event.target.checked;
    
        // Find the full row data from the original list
        const selectedRow = this.serviceGroupName.find(item => item.Id === rowId);
    
        if (isChecked) {
            // Only add if not already present
            if (!this.selectedServiceRows.some(row => row.Id === rowId)) {
                this.selectedServiceRows.push(selectedRow);
            }
        } else {
            // Remove from selected rows
            this.selectedServiceRows = this.selectedServiceRows.filter(row => row.Id !== rowId);
        }
     
        this.serviceGroupName = this.serviceGroupName.map(item => {
            if (item.Id === rowId) {
                return {
                    ...item,
                    isSelected: isChecked
                };
            }
            return item; // Return item as-is if not matched
        });
        this.saveDisabled = this.selectedServiceRows.length === 0;
        console.log('service  groups '+JSON.stringify(this.serviceGroupName));
    }

     // Form submit - extend default behavior
    handleSubmit(event) {      
        console.log('onsubmit event recordEditForm'+ event.detail.fields);
     //   this.handleFund();

        event.preventDefault();
        const fields=event.detail.fields;
        fields.Client__c = this.clientId;
        fields.State__c = this.stateValue;
        console.log('State : '+fields.State__c);
        console.log('Handle Submit : '+fields.Client__c);
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleSuccess(event) {
        const fundTrackerId = event.detail.id;
        console.log('🎯 Fund inserted: ', fundTrackerId);
    
        let selectedCatalogIds = [];
        let deleteIDS = [];
    
      
    
        if (this.createAddNew === true && this.isEdit === false) {
            selectedCatalogIds = this.selectedServiceRows.map(row => row.Id);
        }
    
        if (this.isEdit === true) {
            deleteIDS = this.serviceGroupName
                .filter(item => item.junctionId != null && item.isSelected === false)
                .map(item => item.junctionId);
    
            selectedCatalogIds = this.serviceGroupName
                .filter(item => item.junctionId == null && item.isSelected === true)
                .map(item => item.Id);
        }
    
        console.log('delete ids:', JSON.stringify(deleteIDS));
        console.log('selected ids:', JSON.stringify(selectedCatalogIds));
    
        let deletePromise = Promise.resolve();
        let insertPromise = Promise.resolve();
    
        if (deleteIDS.length > 0) {
            deletePromise = deletedSelectedId({ selectedDeletedId: deleteIDS })
                .then(result => {
                    console.log('✅ Deleted ClientFundTrackerJN__c records:', JSON.stringify(result));
                   
                })
                .catch(error => {
                    console.error('❌ Error deleting ClientFundTrackerJN__c records:', JSON.stringify(error));
                });
        }
    
        if (selectedCatalogIds.length > 0) {
            insertPromise = insertClientFundTrackerLinks({
                fundTrackerId: fundTrackerId,
                participantId: this.clientId,
                selectedCatalogIds: selectedCatalogIds,
                state: this.stateValue
            })
            .then(() => {
                console.log('✅ ClientFundTrackerJN__c records inserted successfully');
             
            })
            .catch(error => {
                console.error('❌ Error inserting ClientFundTrackerJN__c records:', error);
            });
        }
    
        // Ensure both complete before UI update
        Promise.all([deletePromise, insertPromise]).then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Details Saved Successfully !!',
                    variant: 'success'
                })
            );
            this.serviceGroupName = [];
            this.selectedServiceRows = [];
            console.log('service groups:', JSON.stringify(this.serviceGroupName));
            console.log('selectedServiceRows groups:', JSON.stringify(this.selectedServiceRows));
            this.createAddNew = false;
            this.isEdit = false;
            this.displayFundTracker = true;
            this.handleFund();  // Re-fetch the fund tracker list
           
        });
    }
     
    @track pageSizeOptions1 = [10, 25, 50, 75, 100]; //Page size options
    @track records1 = []; //All records available in the data table
    @track columns1 = []; //columns information available in the data table
    @track totalRecords1 = 0; //Total no.of records
    @track pageSize1; //No.of records to be displayed per page
    @track totalPages1; //Total no.of pages
    @track pageNumber1 = 1; //Page number    
    @track recordsToDisplay1 = []; //Records to be displayed on the page

    get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }
    handleRecordsPerPage(event) {        
        this.pageSize1 = event.target.value;   
        this.pageNumber1 = 1;     
        this.paginationHelper1();
    }

    previousPage1() {
        this.pageNumber1 = this.pageNumber1 - 1;
        this.paginationHelper1();
    }

    nextPage1() {
        this.pageNumber1 = this.pageNumber1 + 1;
        this.paginationHelper1();
    }

    firstPage1() {
        this.pageNumber1 = 1;
        this.paginationHelper1();
    }

    lastPage1() {
        this.pageNumber1 = this.totalPages1;
        this.paginationHelper1();
    }

    // JS function to handel pagination logic 
    paginationHelper1() {
        this.serviceGroupName = [];
        this.NdisServiceGroupName = true;
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }
        for (let i = (this.pageNumber1 - 1) * this.pageSize1; i < this.pageNumber1 * this.pageSize1; i++) {
            if (i === this.totalRecords1) {
                break;
            }
            this.serviceGroupName.push(this.records1[i]);
            
        }     
        console.log('serviceGroupName '+JSON.stringify(this.serviceGroupName));   
    }
    
    
}