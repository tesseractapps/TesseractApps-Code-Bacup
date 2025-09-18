import {LightningElement, wire, api, track } from 'lwc';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
//import getLedgerItems from '@salesforce/apex/CreateCompanyController.getLedgerItems';
// import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getAllLedgerItems from '@salesforce/apex/AccountingChartController.getAllLedgerItems';
//import getLedgerItemsforExpenses from '@salesforce/apex/AccountingModuleController.getLedgerItemsforExpenses';
// import createJournalEntries from '@salesforce/apex/AccountingModuleController.createJournalEntries';
 import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
// import getAccountingExpense from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getAccountingExpense';
//import getEntryOnEdit from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntryOnEdit';
//import updateExpense from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateExpense';
//import updateSalesEntry from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateSalesEntry';
import { refreshApex } from '@salesforce/apex';
//import deleteExpenseRecord from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.deleteExpenseRecord';
import saveUpdategeneralLedgerData from '@salesforce/apex/AccountingChartController.saveUpdategeneralLedgerData';
import getAccountingGeneralLedger from '@salesforce/apex/AccountingChartController.getAccountingGeneralLedger';
import getGeneralLedgerInEdit from '@salesforce/apex/AccountingChartController.getGeneralLedgerInEdit';
import { deleteRecord } from 'lightning/uiRecordApi';
import deleteInvoiceLines from '@salesforce/apex/AccountingModuleController.deleteMatchingRecords';
import getInvoiceHistoryDetails from '@salesforce/apex/AccountingChartController.getInvoiceHistoryDetails';

export default class TesseractAppsAccountingSalesEntry extends LightningElement {
    @api orgid;
    // @api companyid;
    // @api companyname;
    @track salesEntryList = [];  
    @track showtable = false;  
    @track showtableTax = false;  
    @track ledgerItems = [];     
    @track companyId;            
    //@track companyOptions = [];  
    @track selectedRowId;        
    @track popoverStyle = {};
    @track selectedOptionAL; 
    @track selectedOptionTax;
   // @track subTotal;
    @track taxAmount;
    //@track totalAmount;   
    @track selectedDescription;
    @track selectedAmount;
    @track selectedItem; 
  //  @track entryType; 
   // @track selectedCardType='';
    wiredCompanyList;
    wiredEntityProfilesResult;
    //@track entryNameOptions=[];
    //@track selectedEntityName;
    @track taxInclusive=false;
    @track invoiceDate=null;
    @track postDate=null;
    @track invoiceNo;
    @track comments;
    @track createEditEntry=' Create Entry';
    @track addEntry = false;
    @track entryFlag = true;
    @track selectedCompany;
   // @track companyOptions = []; 
    @track startdateValueData;
    @track enddateValueData;
    @track errorMessage = '';
    @track staffexpensesData=true;
    @track Listofdata_Pagination = [];
    @track expensesAmount;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number  
    wireEntryData;
    @track buttonLabel='Save';
    @track invoiceDeleteFlag=false;
    @track selectedExpenseId;
    @track isGeneralSales=false;
    @track paginationVisible=false;
    @track isAddDisabled = false;
    FilteredLedgerItems = [];
    @track selectedCrDr;
    @track toggleDropdownAccount;
    // @track isCustomer = false;
    // @track isSupplier  = true;
    @track disabledInvoiceNo = false;
    activeRowId = '';
    @track deletedRowIds = [];
    @track accountCategory;
    @track notes;
    @track balance;
     @track isShowActivity = false;
    @track historyRows = [];
    @track showHistoryTable = false;
    @track pageSizeOptionsHistory = [10, 25, 50, 75, 100]; //Page size options
    @track recordsHistory = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecordsHistory = 0; //Total no.of records
    @track pageSizeHistory; //No.of records to be displayed per page
    @track totalPagesHistory; //Total no.of pages
    @track pageNumberHistory = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track paginationVisibleHistory=false;
    @track filteredTaxCodes = [];
     @track disabledSave = false;
    @track crDrOptions = [{label:'Cr',value:'Cr'},{label:'Dr',value:'Dr'}];
   // @track entryOptions=[{label:'Purchases',value:'Purchases'},{label:'Sales',value:'Sales'}];
    @track entityOptions= [{label:'Supplier',value:'Supplier'},{label:'Customer',value:'Customer'}];
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
     @track salesEntry = {
        company: this.selectedCompany,
        InvoiceDate: '',
        PostDate: '',
        InvoiceNo: '',
        taxInclusive: false,
        comments: '',
        notes: ''
    };
     fieldLabelMap = {
        // Parent object: Accounting_Invoices_Expenses__c
        //'Name': 'Invoice Name',
        'Post_Date__c': 'Post Date',
        'Due_Date__c': 'Due Date',
        'Invoice_Date__c': 'Invoice Date',
        //'Status__c': 'Status',
        'GST__c': 'GST',
        'Total_Amount__c': 'Total Amount',
        'Sub_Total__c': 'Sub Total',
        'Invoice_No__c': 'Invoice No',
        'Issued_Date__c': 'Issued Date',
        'CreatedDate': 'Created Date',
        'LastModifiedDate': 'Last Modified Date',

        // Child object: Accounting_Journal_Entry__c
        'Cr_Dr__c': 'Cr/Dr',
        'Description__c': 'Description',
        'Amount__c': 'Amount',
        'Tax_Amount__c': 'Tax Amount',
        'Total_Amount__c': 'Total Amount',
        'Sub_Total__c': 'Sub Total',
        'Tax_Inclusive__c': 'Tax Inclusive',
        'Sl_no__c': 'Sl No',
        //'Entity_Profile__c': 'Entity Profile',
        //'Entity_Profile_Name__c': 'Entity Name',
        'Comments__c': 'Comments',
        'Notes__c': 'Notes',
        'Unit_Price__c': 'Unit Price',
        'Quantity__c': 'Quantity',
        'Tax__c': 'Tax',
        'Accounting_Ledger_Items__c': 'Ledger Item'
    };
      get activityToggleLabel() {
        return this.showHistoryTable ? 'Hide Activity' : 'Show Activity';
    }
    connectedCallback(){
        console.log('orgId IN general ledger : '+this.orgid);
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.selectedCompany  = storedCompanyId;
            this.companyname = storedCompanyName;
            console.log('Company from localStorage connectedCallback general ledger:', this.selectedCompany, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback general ledger');
        } 

       // console.log('companyid in connectedCallback general ledger : ', this.companyid);
       // this.selectedCompany = this.companyid;
        console.log(' companyname in connectedCallback  general ledger: ', this.companyname);
        console.log(' selectedCompany in connectedCallback  general ledger: ', this.selectedCompany);
        //this.addRow();
       
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.startdateValueData = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.enddateValueData = last.toISOString().slice(0, 10);
        this.taxInclusive = false;
        //this.fetchLedgerItems();
        window.addEventListener('click', this.handleOutsideClick);
    }
     disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
    }
     @track listenForOutsideClick = false;
    handleOutsideClick = (event) => {
        if (this.listenForOutsideClick) {
            const dropdownElement = this.template.querySelector('[data-id="taxTableDropdown"]');
            if (dropdownElement && !dropdownElement.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.showtableTax = false;
                this.listenForOutsideClick = false;
            }
            const dropdownElement1 = this.template.querySelector('[data-id="accountListTableDropdown"]');
            if (dropdownElement1 && !dropdownElement1.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.showtable = false;
                this.listenForOutsideClick = false;
            }
        }
    };
    
    @wire(getEntityProfiles, {companyId: '$selectedCompany' , entryType:'$entryType' })
    wiredEntityProfiles(result) {
        console.log('entryType in wire general ledger: ', this.entryType);
        this.wiredEntityProfilesResult = result; // Store response for refreshApex
        const { data, error } = result;

        if (data) {
            console.log('Filtered entity options: ', JSON.stringify(data));
            this.entryNameOptions = data.map(entity => {
                const name = entity.Name__c
                    ? entity.Name__c
                    : `${entity.First_Name__c || ''} ${entity.Last_Name__c || ''}`.trim();

                // Only return the object if name is not empty
                return name ? { label: name, value: entity.Id } : null;
            })
            .filter(option => option !== null); // Remove null values
            this.error = undefined;
            console.log('Filtered Company options: ', JSON.stringify( this.entryNameOptions));
        } else if (error) {
            this.error = error;
            console.error('Error fetching entity profiles:', error);
        }
    }

    appendPercentage(taxValue) {
        // Assuming taxValue is already a number (like 10 for 10%)
        if (taxValue != null) {
            return `${taxValue}%`; // Append '%' to the number
        }
        return '0%'; // If no tax value, return '0%'
    }

        
    addRow() {
       // if (this.salesEntryList.length < 3) {
            const newRow = this.createRow();
            this.salesEntryList = [...this.salesEntryList, newRow];
            this.reindexSalesEntryList();

           
        //}
    }
    createRow() {
        const newRow = {
           Id: Date.now().toString() + Math.random().toString(16).slice(2),
            sno: this.salesEntryList.length + 1,
            Description__c: '',
            accountList:  '',
           // selectedCrDr: '',
            Cr_Dr__c: '',
            Amount__c: 0,
            tax: '0%'
            //taxAmount: ''
        };
        return newRow;
    }
    reindexSalesEntryList() {
        this.salesEntryList = this.salesEntryList.map((row, index) => ({
            ...row,
            sno: index + 1
        }));
    }
    fetchLedgerItems() {
        console.log('Calling Apex Method: getLedgerItems...');
        console.log('companyId in fetchLedgerItems: ' + this.selectedCompany);

        // Call the Apex method and pass companyId as parameter
        getAllLedgerItems({ companyId: this.selectedCompany })
            .then(result => {
                console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

                // Process the data and map it to a proper format
                this.ledgerItems = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                }));

                console.log('Processed Ledger Items:', JSON.stringify(this.ledgerItems));
                this.FilteredLedgerItems = this.ledgerItems;
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }

    // fetchLedgerItemsforExpenses() {
    //     console.log('Calling Apex Method: getLedgerItemsforExpenses...');
    //     console.log('companyId in fetchLedgerItemsforExpenses: ' + this.selectedCompany);

    //     // Call the Apex method and pass companyId as parameter
    //     getLedgerItemsforExpenses({ companyId: this.selectedCompany })
    //         .then(result => {
    //             console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

    //             // Process the data and map it to a proper format
    //             this.ledgerItems = result.map(item => ({
    //                 id: item.Id,
    //                 accNo: item.Account_Number__c,
    //                 itemName: item.Name,
    //                 category: item.Category__r.Name,
    //             }));

    //             console.log('Processed Ledger Items:', JSON.stringify(this.ledgerItems));
    //         })
    //         .catch(error => {
    //             console.error('Error fetching ledger items:', JSON.stringify(error));
    //             this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
    //         });
    // }
    
    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const fieldChecked=event.target.checked;
        console.log('this.salesEntry BEFORE===>'+JSON.stringify(this.salesEntry));
        this.salesEntry = {
            ...this.salesEntry,
            [fieldName]: fieldValue
        };

        this.salesEntry = { ...this.salesEntry, [fieldName]: fieldValue };
        console.log(`Updated Field - ${fieldName}:`, fieldValue);
        console.log('this.salesEntry===>'+JSON.stringify(this.salesEntry));
        switch(fieldName) {

            case 'InvoiceDate':
                this.invoiceDate = fieldValue;
                console.log('Invoice Date:', this.invoiceDate);
                break;
    
            case 'PostDate':
                this.postDate = fieldValue;
                console.log('Post Date:', this.postDate);
                break;
    
            case 'InvoiceNo':
                this.invoiceNo = fieldValue;
                console.log('Invoice No:', this.invoiceNo);
                break;
            case 'comments':
                this.comments = fieldValue;
                console.log('comments:', this.comments);
                    break;
            case 'notes':
                this.notes = fieldValue;
                console.log('notes:', this.notes);
                    break;
            case 'startdateValueData':
                this.startdateValueData = fieldValue;
                console.log('startdateValueData:', this.startdateValueData);
                break;
            case 'enddateValueData':
                this.enddateValueData = fieldValue;
                console.log('enddateValueData:', this.enddateValueData);
                break;
            default:
                console.log('Unknown field:', fieldName);
                break;
        }
    }
     closeaddExpenses() {
        this.addEntry = true;
        this.entryFlag = false;
        
    }
    hideModalBox(){
        this.entryFlag=true; 
        this.addEntry = false;
        refreshApex(this.wireEntryData); 
        //this.handleClear();
        this.selectedEntityName = null;
        this.taxInclusive = false;
        this.isShowActivity = false; 
        this.disabledInvoiceNo = false; 
        this.showHistoryTable = false; 
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.entryType = '';
        this.comments = '';
        this.subTotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
        this.notes = '';
        console.log('Description in clear:', this.selectedDescription);
        console.log(' this.selectedAmount in clear:',  this.selectedAmount);
        this.selectedDescription='';
        this.selectedAmount='';
               // this.selectedDescription='';
        this.selectedOptionAL='';
       // this.selectedAmount=0;
        this.selectedOptionTax='';
        if (this.salesEntryList.length > 0) {
            this.salesEntryList = this.salesEntryList.map(entry => {
                return {
                    ...entry,
                    Description__c: '',
                    Amount__c: '',
                    accountList: '',
                    //selectedCrDr: '',
                    Cr_Dr__c: '',
                    tax:  ''  

                };
            });
        }
        // this.isEdit=false;  
        // this.isFileAttached=false; 
        // this.addImport=false;     
    } 
     handleAddEntry(){
       // this.handleClear();
        this.entryFlag=false; 
        this.addEntry = true;
        this.createEditEntry='Create Entry';
        this.buttonLabel = 'Save';
        this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = false;
         this.disabledInvoiceNo = false;
        this.isShowActivity = false;  
        this.showHistoryTable = false; 
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.entryType = '';
        this.comments = '';
        this.subTotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
        this.isAddDisabled = false;
        console.log('Description in clear:', this.selectedDescription);
        console.log(' this.selectedAmount in clear:',  this.selectedAmount);
        this.selectedDescription='';
        this.selectedAmount='';
               // this.selectedDescription='';
        this.selectedOptionAL='';
       // this.selectedAmount=0;
        this.selectedOptionTax='';
        // if (this.salesEntryList.length > 0) {
        //     this.salesEntryList = this.salesEntryList.map(entry => {
        //         return {
        //             ...entry,
        //             Description__c: '',
        //             Amount__c: ''
        //         };
        //     });
        // }
        this.salesEntryList = [];
        this.salesEntry = {
                        company: this.selectedCompany || '',
                        //entityName: this.selectedEntityName,
                        InvoiceDate: '',
                        PostDate: '',
                        InvoiceNo: '',
                        taxInclusive: false,
                        //Status: this.selectedStatus || '',
                        invoiceId: null, 
                        //comments: invoice.Accounting_Journal_Entry__r[0].Comments__c || '',
                        //notes: invoice.Accounting_Journal_Entry__r[0].Notes__c || '',  

                    };
        this.salesEntryList.push(this.createRow());
        this.salesEntryList.push(this.createRow());
        this.reindexSalesEntryList(); 

    }
     handleDeleteRow(event) {
        console.log('handleDeleteRow');
        if (this.salesEntryList.length === 1 || this.salesEntryList.length === 2) {
            this.showToast('Error', 'At least two rows are required. ', 'error');
            return;
        }
        const rowId = event.currentTarget.dataset.id;  // Keep as string
        this.salesEntryList = this.salesEntryList.filter(row => String(row.Id) !== rowId);
        this.selectedRowId = null;
        if( this.createEditInvoice=='Edit Entry' ||this.buttonLabel =='Update'){
            if (!this.deletedRowIds) {
                this.deletedRowIds = [];
            }
            this.deletedRowIds.push(rowId);
            console.log('Deleted Row IDs:', this.deletedRowIds);
        }
        
        //this.recalculateTotals();
        this.reindexSalesEntryList();
    
        // ✅ Update highest tax amount after deletion
        const taxAmounts = this.salesEntryList
            .map(row => Number(row.taxAmount))
            .filter(val => !isNaN(val));
        console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
    }
        
     get isDesktop() {        
        return FORM_FACTOR === 'Large';
       
    }
    
    get isMobile() {       
        return FORM_FACTOR === 'Small';
    }
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    //@track isExpense=false;
    @wire(getAccountingGeneralLedger, { sDate: '$startdateValueData', eDate: '$enddateValueData', companyId: '$selectedCompany' })
    wiredEntryData(result) {
        console.log('selectedCompany in wiredEntryData before:', this.selectedCompany);
        this.wireEntryData = result;
       
        console.log('result in wiredExpenseData:', JSON.stringify(result));

        const { data, error } = result;
        if (data) {
            console.log('result in wiredEntryData inside if :', JSON.stringify(result));
           
            this.records = data.map(invoice => {
                const allEntries = invoice.Accounting_Journal_Entry__r || [];
               
                const entryWithSlNo1 = allEntries.find(
                    entry => entry.Sl_no__c === 1
                );

                const firstRowDescription = entryWithSlNo1 ? entryWithSlNo1.Description__c : null;
                //const sl1LedgerName = entryWithSlNo1?.Accounting_Ledger_Items__r?.Name || '';
                //const isSl1NonGST = sl1LedgerName !== 'GST Paid' && sl1LedgerName !== 'GST Collected';

                 const sortedLedgerData = allEntries
                    .filter(entry => entry.Sl_no__c && entry.Accounting_Ledger_Items__r?.Name)
                    .map(entry => ({
                        slNo: entry.Sl_no__c,
                        ledgerName: entry.Accounting_Ledger_Items__r.Name,
                        amount: parseFloat(entry.Amount__c || 0).toFixed(2),
                        taxAmount: parseFloat(entry.Tax_Amount__c || 0).toFixed(2)
                    }))
                    .sort((a, b) => a.slNo - b.slNo);

                console.log('Structured Ledger Data:', JSON.stringify(sortedLedgerData, null, 2));

                 
                const allDescriptionsMap = new Map();
                   allEntries.forEach(entry => {
                        if (entry.Sl_no__c && entry.Description__c) {
                            if (!allDescriptionsMap.has(entry.Sl_no__c)) {
                                allDescriptionsMap.set(entry.Sl_no__c, entry.Description__c);
                            }
                        }
                    });

                // 3. Convert to formatted string sorted by Sl_no__c
                const sortedDescriptions = [...allDescriptionsMap.entries()]
                    .sort((a, b) => a[0] - b[0])
                    .map(([slNo, desc]) => `${desc}`)
                    .join('\n');

               const firstNonGstEntry = sortedLedgerData.find(
                    item => item.ledgerName !== 'GST Paid' && item.ledgerName !== 'GST Collected'
                );

                // const gstEntry = sortedLedgerData.find(
                //     item => item.ledgerName === 'GST Paid' || item.ledgerName === 'GST Collected'
                // );

                const amount = firstNonGstEntry ? parseFloat(firstNonGstEntry.amount).toFixed(2) : '0.00';
                const gst = firstNonGstEntry ? parseFloat(firstNonGstEntry.taxAmount).toFixed(2) : '0.00';
                const ledgerItemName = firstNonGstEntry?.ledgerName || '';
                console.log('amount in wiredEntryData:', amount);
                console.log('gst in wiredEntryData:', gst);
                console.log('ledgerItem in wiredEntryData:', ledgerItemName);
                    //const tax = 
                return {
                    Id: invoice.Id,
                    Name: invoice.Name,
                   // Status__c: invoice.Status__c,
                    // description:invoice.Accounting_Journal_Entry__r[0].Description__c,
                    description:firstRowDescription,
                    allDescriptions: sortedDescriptions,
                    date: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
                    gst: gst,
                    amount: amount,
                    ledgerItem: ledgerItemName
                    //invoiceNumber: invoice.Invoice_Number__c,
                   // amazonUrl: invoice.Amazon_URL__c,
                    //invoiceDate: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : ''
                };
            });
             let expAmount = 0;
        
             // Loop through the records and sum the 'amount' field
             this.records.forEach(record => {
                 // Add the amount to expAmount. Make sure to handle null/undefined values.
                 if (record.amount) {
                     expAmount += parseFloat(record.amount);
                 }
             });
             this.expensesAmount = expAmount;   
             console.log(' this.records in wiredEntryData:', JSON.stringify( this.records));
            this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
            //  if (this.totalRecords > 0) {
            //         this.paginationVisible = true;
            //     }
            this.paginationHelper();
            console.log('expenseData in wiredEntryData:', JSON.stringify(this.records));
        } else if (error) {
            // Handle error
            console.error('Error retrieving company data:', JSON.stringify(error));
            this.error = error.body.message;  // Storing error message
           // this.showErrorToast(this.error); // Show error toast if necessary
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

  
    paginationHelper() {
        //this.recentEmpData = [];
        // calculate total pages
        if (this.totalRecords > 0) {
            this.paginationVisible = true;
        } else{
            this.paginationVisible = false;
        }
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
       // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }

       // console.log("pageNumber  : "+ JSON.stringify(this.pageNumber));
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records[i]);
            // tempConRec.dateIssued = new Date(tempConRec.Date__c).toLocaleDateString('en-GB');
            // tempConRec.gst = tempConRec.Incl_GST__c.toFixed(2);
            // tempConRec.amount = tempConRec.Amount__c.toFixed(2);
            // tempConRec.amazonUrl = tempConRec.Amazon_URL__c;
            // tempConRec.typeofExpense = tempConRec.Type_of_Expense__c; 
            // tempConRec.description = tempConRec.Description__c; 
            // tempConRec.userName  = tempConRec.User_Name__c;
            tempconList.push(tempConRec);           
        }
        //refreshApex(tempconList);
       // console.log("Pagination : "+ JSON.stringify(tempconList));
        this.Listofdata_Pagination = tempconList;

    }
    
    toggleDropdownAccountList(event) {
        console.log('toggleDropdown');
         //this.showtable = false;
        // this.selectedOptionAL = '';
        const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        this.activeRowId =rowId;
        console.log('showtable in toggleDropdown : ',this.showtable);
        this.showtable = !this.showtable;
          // Calculate the position of the dropdown button
        // if( this.selectedCardType==='Customer'){
        //     this.showtable = !this.showtable;
        //     console.log('showtable after : '+this.showtable);
        //     this.fetchLedgerItems(); 
        // }
        // if( this.selectedCardType==='Supplier'){
        //     this.showtable = !this.showtable;
        //     console.log('showtable after : '+this.showtable);
        //     this.fetchLedgerItemsforExpenses(); 
        // }
         console.log('showtable in toggleDropdown after : ',this.showtable);
        this.fetchLedgerItems(); 
       
        const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
    
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04)-38; // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.165)-35; // subtract 10% from X
    
        this.toggleDropdownAccount = `
            position: absolute;
            top: ${top}px;
            left: ${left}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;console.log('showtable in toggleDropdown before if  : ',this.showtable); 
        if (this.showtable) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
        this.FilteredLedgerItems = [...this.ledgerItems];
    }
    toggleDropdownTax(event) {
        console.log('toggleDropdown');
          // Calculate the position of the dropdown button 
        this.selectedRowId=event.currentTarget.dataset.id;
         console.log('selectedRowId'+this.selectedRowId);
          this.showtableTax = !this.showtableTax;
        //   if(!this.taxInclusive){
        //       this.showtableTax  = false;
        //   } 
        console.log('showtable after : '+this.showtableTax);
        //this.fetchLedgerItems(); 

        const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
    
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X
    
        this.taxDropdownStyle = `
            position: absolute;
            top: ${top}px;
            left: ${left}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        this.filteredTaxCodes = this.taxCodes;
         if (this.showtableTax) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }
     @track selectedItemId;
    // Handle the selection of a ledger item from the popover
    handleSelection(event) {

        const recordId = event.currentTarget.dataset.id;
        const accountNumber = event.currentTarget.dataset.accno;  // Account Number
        const accountCategory = event.currentTarget.dataset.category;  // Account Number
        const accountValue = event.currentTarget.dataset.value;   
        const rowId = this.activeRowId; // ID of the row currently being edited
    
        this.accountCategory = accountCategory;
        console.log('Selected Record ID:', recordId);
        console.log('Account Number:', accountNumber);
        console.log('accountCategory:', this.accountCategory);
        console.log('Account Value:', accountValue);
        console.log('Active Row ID:', rowId);
        this.salesEntryList = this.salesEntryList.map(sales => {
                if (sales.Id == rowId) {  // Directly checking with sales.Id
                    return { 
                        ...sales, 
                        accountList: `${accountNumber} - ${accountValue}` ,
                        accountItemId: recordId,
                        accountCategory:  this.accountCategory 
                    };
                }
                return sales;
            });
    
        // Hide the table once an item is selected
        this.showtable = false;
         console.log('Updated Sales Entry List handleSelectionAL :', JSON.stringify(this.salesEntryList));
        this.listenForOutsideClick = false;
    }
     @track amountarrey = [];  
    handleSelectionTax(event) {
        const recordId = event.currentTarget.dataset.id;
        const code = event.currentTarget.dataset.code;
        const rate = event.currentTarget.dataset.rate;

        console.log('🔹 Record ID in Tax:', recordId);
        console.log('🔹 Selected Tax Code:', code);
        console.log('🔹 Tax Rate (%):', rate);
        console.log('selectedRowId in tax selection:', this.selectedRowId);

        this.salesEntryList = this.salesEntryList.map(row => {
            let updatedRecord = { ...row };

            if (String(row.Id) === String(this.selectedRowId)) {
                const amount = parseFloat(updatedRecord.Amount__c) || 0;
                const taxRateDecimal = parseFloat(rate) / 100;
                const taxAmount = parseFloat((amount * taxRateDecimal).toFixed(2));

                updatedRecord.tax = rate;
                updatedRecord.taxvalue = rate;
                updatedRecord.taxAmount = taxAmount;
                updatedRecord.Tax_Amount__c = taxAmount; 

                console.log('✅ Updated Row Tax:', updatedRecord);
            }

            return updatedRecord;
        });

        this.selectedOptionTax = `${rate}`;
        this.showtableTax = false;
        this.listenForOutsideClick = false;

        console.log('📦 Updated salesEntryList:', JSON.stringify(this.salesEntryList));

       this.calculateBalance();
    }

    handleInputChange(event) {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        const recordId = event.target.dataset.id;
        this.selectedRowId = recordId;

        let syncedAmount = null;

        this.salesEntryList = this.salesEntryList.map((entry, index) => {
            let updatedRecord = { ...entry };

            // Initialize manual flag on second row
            if (index === 1 && !updatedRecord.hasOwnProperty('isAmountManuallyEdited')) {
                updatedRecord.isAmountManuallyEdited = false;
            }

            // Field update logic
            if (String(updatedRecord.Id) === String(recordId)) {
                if (fieldName === 'Amount__c') {
                    updatedRecord.Amount__c = parseFloat(fieldValue) || 0;
                    syncedAmount = updatedRecord.Amount__c;

                    if (index === 1) {
                        updatedRecord.isAmountManuallyEdited = true;
                    }
                } else {
                    updatedRecord[fieldName] = fieldValue;

                    if (fieldName === 'Cr_Dr__c') {
                        syncedAmount = parseFloat(updatedRecord.Amount__c) || 0;
                    }
                }
            }

            // Tax calculation (always exclusive, per row only)
            const amount = parseFloat(updatedRecord.Amount__c) || 0;
            const rate = (updatedRecord.tax || this.selectedOptionTax || '0%').split(' ')[0].replace('%', '');
            const taxRate = parseFloat(rate);
            updatedRecord.taxAmount = isNaN(taxRate) ? 0 : parseFloat((amount * (taxRate / 100)).toFixed(2));

            return updatedRecord;
        });

        // Cr/Dr sync and Amount sync logic
        if (this.salesEntryList.length >= 2) {
            let firstRow = { ...this.salesEntryList[0] };
            let secondRow = { ...this.salesEntryList[1] };

            if (String(firstRow.Id) === recordId && fieldName === 'Cr_Dr__c') {
                const firstCrDr = firstRow.Cr_Dr__c;
                secondRow.Cr_Dr__c = (firstCrDr === 'Cr') ? 'Dr' : 'Cr';
                secondRow.selectedCrDr = secondRow.Cr_Dr__c;

                if (!secondRow.isAmountManuallyEdited) {
                    secondRow.Amount__c = syncedAmount;

                    const amt = parseFloat(syncedAmount) || 0;
                    const rate = (secondRow.tax || this.selectedOptionTax || '0%').split(' ')[0].replace('%', '');
                    const taxRate = parseFloat(rate);
                    secondRow.taxAmount = isNaN(taxRate) ? 0 : parseFloat((amt * (taxRate / 100)).toFixed(2));
                }

            } else if (String(secondRow.Id) === recordId && fieldName === 'Cr_Dr__c') {
                const secondCrDr = secondRow.Cr_Dr__c;
                firstRow.Cr_Dr__c = (secondCrDr === 'Cr') ? 'Dr' : 'Cr';
                firstRow.selectedCrDr = firstRow.Cr_Dr__c;
            }


            // Save changes
            this.salesEntryList[0] = firstRow;
            this.salesEntryList[1] = secondRow;

            // Update balance
            // const firstAmt = parseFloat(firstRow.Amount__c) || 0;
            // const secondAmt = parseFloat(secondRow.Amount__c) || 0;
            // this.balance = parseFloat((firstAmt - secondAmt).toFixed(2));
            const firstAmt = (parseFloat( this.salesEntryList[0].Amount__c) || 0) + (parseFloat( this.salesEntryList[0].taxAmount) || 0);
            const secondAmt = (parseFloat(this.salesEntryList[1].Amount__c) || 0) + (parseFloat(this.salesEntryList[1].taxAmount) || 0);
            this.balance = parseFloat((firstAmt - secondAmt).toFixed(2));
            if(this.balance === 0){
                this.disabledSave = false;
            } else {
                this.disabledSave = true;
            }
        }

        // No total tax calculation required
        delete this.taxAmount;
        this.amountarrey = {}; // or remove this line if unused

        console.log('📊 Balance (1st - 2nd row):', this.balance);
        console.log('📋 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    }

    handleSave(){
    
        if (!this.salesEntry.InvoiceDate || !this.salesEntry.PostDate  ) {
            this.showToast('Error', 'Please Enter the required fields.', 'error');
            return;
        }
        console.log('Sending to Apex for Update:');
        console.log('Sales Entry:', JSON.stringify(this.salesEntry));
        console.log('Sales Entry List in save:', JSON.stringify(this.salesEntryList));
        //console.log('deletedRowIds IN SAVE:', JSON.stringify(this.deletedRowIds));
        console.log('Select Company in save===>'+this.selectedCompany);

        const isUpdate = !!this.salesEntry.invoiceId; // true if updating
        saveUpdategeneralLedgerData({
            salesEntryJson: JSON.stringify(this.salesEntry),
            salesEntryListJson: JSON.stringify(this.salesEntryList),
            //deletedRowIdsJson: JSON.stringify(this.deletedRowIds),
            companyId: this.selectedCompany
        
        })
        .then(result => {
            console.log('Result from Apex:', result);
            const tempInvoiceId = result.Id;  
            console.log('Temporary Invoice ID:', tempInvoiceId);
            //this.showToast('Success', 'General ledger data saved successfully', 'success');
                //getAccountingInvoiceById({ invoiceId: tempInvoiceId }); 
            if (isUpdate) {
                this.showToast('Success', 'General Ledger Entry updated successfully.', 'success');
            } else {
                this.showToast('Success', 'General Ledger Entry created successfully.', 'success');
            }
            //this.companyId = this.salesEntry.company;  // Assuming salesEntry contains the correct companyId
            //console.log('Updated companyId after save:', this.companyId);
            console.log('updated Sales Entry List:', JSON.stringify(this.salesEntryList));
            refreshApex(this.wireEntryData); 
            this.handleClear();
            //refreshApex(this.wireInvoiceData);
           // this.showToast('Success', 'Update successfully', 'success');
            // Handle result as needed
        })
        .catch(error => {
            this.showToast('Error', error.body.message, 'error');
        });
            console.log('deletedRowIds BEFORE:', JSON.stringify(this.deletedRowIds));
            if (this.deletedRowIds && this.deletedRowIds.length > 0) {
            console.log('deletedRowIds:', JSON.stringify(this.deletedRowIds));
            deleteInvoiceLines({ deletedIdsJson: JSON.stringify(this.deletedRowIds) })
                .then(() => {
                    console.log('Deleted rows handled successfully.');
                    // Optionally clear deletedRowIds after deletion
                    this.deletedRowIds = [];
                })
                .catch(error => {
                    console.error('Error deleting rows:', error);
                    this.showToast('Error', 'Failed to delete rows', 'error');
                });
        }
    } 
    handleClear(){
        //console.log('console in clear');
        //this.selectedCompany = null;
        //this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = false;
        this.isShowActivity = false;
        this.disabledInvoiceNo = false;  
        this.showHistoryTable = false; 
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.entryType = '';
        this.comments = '';
        this.subTotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
         this.ledgerItems = []; 
        this.deletedRowIds = [];    
        this.selectedRowId = null;   
         this.salesEntry = {
                        company: this.selectedCompany || '',
                        //entityName: this.selectedEntityName,
                        InvoiceDate: '',
                        PostDate: '',
                        InvoiceNo: '',
                        taxInclusive: false,
                        //Status: this.selectedStatus || '',
                        invoiceId: null, 
                        //comments: invoice.Accounting_Journal_Entry__r[0].Comments__c || '',
                        //notes: invoice.Accounting_Journal_Entry__r[0].Notes__c || '',  

                    };
        console.log('Description in clear:', this.selectedDescription);
        console.log(' this.selectedAmount in clear:',  this.selectedAmount);
        this.selectedDescription='';
        this.selectedAmount='';
               // this.selectedDescription='';
        this.selectedOptionAL='';
       // this.selectedAmount=0;
        this.selectedOptionTax='';
        if (this.salesEntryList.length > 0) {
            this.salesEntryList = this.salesEntryList.map(entry => {
                return {
                    ...entry,
                    Description__c: '',
                    Amount__c: '',
                    accountList: '',
                    //selectedCrDr: '',
                    Cr_Dr__c: '',
                    tax:  ''  

                };
            });
        }
        this.entryFlag=true; 
        this.addEntry = false;
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

   
  
    handleChangeCompany(event){
        this.selectedCompany=event.target.value;
        console.log('Select Company===>'+event.target.value);
        console.log('Select Company===>'+this.selectedCompany);
       // refreshApex(this.wiredAccountList); 
    }
   
    handleClick(event){
        this.entryFlag = false;
        this.addEntry = true;
        this.createEditEntry='Edit Entry';
        this.buttonLabel ='Update';
        this.isShowActivity = true;
        this.disabledInvoiceNo = true;
        this.entryID=event.currentTarget.dataset.id;
            console.log('Edit button clicked for entryID : ' + this.entryID);
            this.fetchEntryDetails(this.entryID);
           
    }
    fetchEntryDetails(entryID) {
        console.log('Fetching entry details for entryID: ' + entryID);
        
       
         getGeneralLedgerInEdit({ invoiceId: entryID })
            .then(result => {
                console.log('Result of edit: ', JSON.stringify(result));
                this.salesEntryList = [];
                if (result && result[0]) {
                    const invoice = result[0];
                    const entries = invoice.Accounting_Journal_Entry__r || [];
                    console.log('entries :', JSON.stringify(entries));

                    this.companyId = invoice.Company__c;
                    this.invoiceDate = invoice.Invoice_Date__c;
                    this.postDate = invoice.Post_Date__c;
                    this.invoiceNo = invoice.Invoice_No__c;
                    this.taxInclusive = entries[0]?.Tax_Inclusive__c || false;
                    this.comments = invoice.Accounting_Journal_Entry__r[0].Comments__c || '';
                    this.notes =  invoice.Accounting_Journal_Entry__r[0].Notes__c || '';
                    //this.selectedStatus = invoice.Status__c;
                    //this.subTotal = invoice.Sub_Total__c;
                    //this.taxAmount = parseFloat(invoice.GST__c).toFixed(2);
                    //this.totalAmount = parseFloat(invoice.Total_Amount__c).toFixed(2);
                   // this.selectedEntityName = entries[0]?.Entity_Profile__c || '';
                // refreshApex(this.wiredEntityProfilesResult);
                    this.salesEntry = {
                        company: this.companyId || '',
                        //entityName: this.selectedEntityName,
                        InvoiceDate: this.invoiceDate || '',
                        PostDate: this.postDate || '',
                        InvoiceNo: this.invoiceNo || '',
                        taxInclusive: this.taxInclusive,
                        //Status: this.selectedStatus || '',
                        invoiceId: invoice.Id, 
                        comments: invoice.Accounting_Journal_Entry__r[0].Comments__c || '',
                        notes: invoice.Accounting_Journal_Entry__r[0].Notes__c || '' 

                    };
                    console.log('Updated salesEntry:', JSON.stringify(this.salesEntry));
                    const validEntries = entries.filter(entry =>
                        entry.Amount__c !== undefined &&
                        // entry.Quantity__c !== undefined &&
                        entry.Tax__c !== undefined
                    );
                    console.log('Valid Entries:', validEntries);
                    console.log(' salesEntryList in edit before:', JSON.stringify(this.salesEntryList));

                  validEntries.forEach(entry => {
                    const ledgerItem = entry.Accounting_Ledger_Items__r || {};

                    // ✅ Skip GST ledger items in edit mode
                    const ledgerName = ledgerItem.Name || '';
                    if (ledgerName === 'GST Paid' || ledgerName === 'GST Collected') {
                        return; // skip this row
                    }

                    const taxRate = entry.Tax__c ? `${entry.Tax__c}%` : '0%';
                   // const taxAmountInEdit = entry.Tax_Amount__c || '';
                    const newRow = {
                        Id: entry.Id,
                        sno: entry.Sl_no__c,
                        Description__c: entry.Description__c || '',
                        accountList: ledgerItem.Account_Number__c && ledgerItem.Name
                            ? `${ledgerItem.Account_Number__c} - ${ledgerItem.Name}`
                            : '',
                        Amount__c: entry.Amount__c || 0,
                        Tax_Amount__c: entry.Tax_Amount__c || 0,
                        tax: taxRate,
                        accountItemId: entry.Accounting_Ledger_Items__c || '',
                        taxvalue: taxRate,
                        selectedCrDr:entry.Cr_Dr__c,
                        Cr_Dr__c: entry.Cr_Dr__c,
                        RowKey__c: entry.RowKey__c,
                        accountCategory: ledgerItem.Category__r.Name

                    };

                    this.salesEntryList.push(newRow);
                });
                    console.log('Final salesEntryList:', JSON.stringify(this.salesEntryList));
                    // this.amountarrey = {
                    //     subTotal: this.subTotal,
                    //     taxAmount: this.taxAmount,
                    //     totalAmount: this.totalAmount
                    // };
                }
                // if (this.salesEntryList.length >= 2) {
                //     // const firstAmount = parseFloat(this.salesEntryList[0].Amount__c) || 0;
                //     // const secondAmount = parseFloat(this.salesEntryList[1].Amount__c) || 0;
                //     // this.balance = (firstAmount - secondAmount).toFixed(2);
                //     // console.log('✅ Calculated Balance:', this.balance);
                //     const firstAmt = (parseFloat( this.salesEntryList[0].Amount__c) || 0) + (parseFloat( this.salesEntryList[0].Tax_Amount__c) || 0);
                //     const secondAmt = (parseFloat(this.salesEntryList[1].Amount__c) || 0) + (parseFloat(this.salesEntryList[1].Tax_Amount__c) || 0);
                //     this.balance = parseFloat((firstAmt - secondAmt).toFixed(2));
                //     console.log('✅ Calculated Balance:', this.balance);
                // } else {
                //     this.balance = '';
                // }
                this.calculateBalance();
            })
            .catch(error => {
                this.showToast('Error', 'Error fetching entry data!', 'error');
                console.error('Error fetching entry data', error);
            });
    }
    RefreshExpensesData(){
        refreshApex(this.wireEntryData);  
    }
    calculateBalance() {
        if (this.salesEntryList.length >= 2) {
            const firstAmt = (parseFloat(this.salesEntryList[0].Amount__c) || 0) + (parseFloat(this.salesEntryList[0].Tax_Amount__c || this.salesEntryList[0].taxAmount) || 0);
            const secondAmt = (parseFloat(this.salesEntryList[1].Amount__c) || 0) + (parseFloat(this.salesEntryList[1].Tax_Amount__c || this.salesEntryList[1].taxAmount) || 0);

            this.balance = parseFloat((firstAmt - secondAmt).toFixed(2));
            console.log('✅ Recalculated Balance:', this.balance);
             if(this.balance === 0){
                this.disabledSave = false;
            } else {
                this.disabledSave = true;
            }
        } else {
            this.balance = '';
        }
    }
    handleDelete(event){

     const expenseId  = event.currentTarget.dataset.id;
     console.log('event data >>'+expenseId );
     this.selectedExpenseId = expenseId; 
     this.invoiceDeleteFlag=true;
       
    }
    //  handleYesDelete(event){
    //     if ( this.selectedExpenseId ) {
    //         deleteExpenseRecord({ expenseId:  this.selectedExpenseId  })
    //             .then(() => {
    //                 // Remove the deleted record from the local list
                   
    //                 console.log('Deleted successfully');
    //                 refreshApex(this.wireEntryData); 
    //                 this.showToast('Success', 'Entry is deleted successfully', 'success');
    //             })
    //             .catch(error => {
    //                 console.error('Error deleting record:', error);
    //                 this.showToast('Error', error.body.message || 'Failed to delete', 'error');
    //             });
    //     }
    //         this.paginationHelper();    
    //         this.invoiceDeleteFlag=false;
    //     }
      handleYesDelete(event){
            let tempconList=[];
            deleteRecord(this.selectedExpenseId).then(() => {
                this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'General Ledger Entry deleted successfully.',
                    variant: 'success'
                })
                );
                refreshApex(this.wireEntryData);
            }); 
            this.paginationHelper();    
            this.invoiceDeleteFlag=false;
        }
        handleDeleteclose(event){
            this.invoiceDeleteFlag=false;
        }

    handleSearch(event) {
       
        const recordId = event.currentTarget.dataset.id;   
        const inputValue = event.target.value;
        const searchLower = inputValue.toLowerCase();
        const rowId = event.target.dataset.id;
    // const rowId = this.activeRowId;
        console.log('Search Row ID:', rowId, 'Input:', inputValue);

        this.salesEntryList = this.salesEntryList.map(sales => {
                if (sales.Id == rowId) {  // Directly checking with sales.Id
                    return { 
                        ...sales, 
                        accountList: inputValue
                    
                    };
                }
                return sales;
            });
        const filtered = this.ledgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            return accNo.includes(searchLower) || itemName.includes(searchLower) || combined.includes(searchLower);
        });
        console.log('Filtered Items:', filtered);
        this.FilteredLedgerItems = filtered;
        this.activeRowId = rowId;
       this.showtable = true;
    }
    @track historyRowsAll = [];   
    handleHistoryClick(event) {
        console.log('this.entryID : ' + this.entryID);
       // this.showHistoryTable = true;
        this.showHistoryTable = !this.showHistoryTable;
          console.log('this.showHistoryTable : ' + this.showHistoryTable);
    
        getInvoiceHistoryDetails({ invoiceId: this.entryID })
        .then((result) => {
            const invoiceHistory = result.invoiceHistory || [];
            const entryHistory = result.entryHistory || [];
    
            let combinedHistory = [];
            let sno = 1;
    
            const seenCommentsNotes = new Set();
            const seenFieldTimeValues = new Set();
    
            const isRecordId = (val) =>
                typeof val === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(val);
    
            const dateFields = new Set(['Invoice_Date__c', 'Post_Date__c']);
    
            const formatDateDDMMYYYY = (dateStr) => {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return dateStr; // fallback
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            };
    
            const formatDateTime = (dateStr) => {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return dateStr;
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            };
    
            const formatValue = (val, field) => {
                if (val === null || val === undefined) return '—';
                if (field === 'Tax_Inclusive__c') {
                    return val ? 'True' : 'False';
                }
                if (dateFields.has(field)) return formatDateDDMMYYYY(val);
                return val.toString();
            };
    
            const allHistory = [...invoiceHistory, ...entryHistory];
    
            allHistory.forEach((record) => {
                const field = record.Field;
                const createdDate = record.CreatedDate;
    
                if (!field || field.toLowerCase() === 'created') return;
    
                if (isRecordId(record.OldValue) || isRecordId(record.NewValue)) return;
    
                if ((field === 'Comments__c') && seenCommentsNotes.has(field)) return;
                if (field === 'Comments__c') seenCommentsNotes.add(field);
    
                const oldVal = formatValue(record.OldValue, field);
                const newVal = formatValue(record.NewValue, field);
    
                const keyOld = `${field}-${createdDate}-${oldVal}`;
                const keyNew = `${field}-${createdDate}-${newVal}`;
    
                if (seenFieldTimeValues.has(keyOld) || seenFieldTimeValues.has(keyNew)) return;
    
                seenFieldTimeValues.add(keyOld);
                seenFieldTimeValues.add(keyNew);
    
                combinedHistory.push({
                    sno: sno++,
                    fieldName: this.fieldLabelMap[field] || field,
                    oldValue: oldVal,
                    newValue: newVal,
                    modifiedBy: record.CreatedBy?.Name || '—',
                    modifiedDate: formatDateTime(createdDate)
                });
            });
    
            combinedHistory.sort((a, b) => new Date(a.modifiedDate) - new Date(b.modifiedDate));
             combinedHistory = combinedHistory.map((record, index) => ({
            ...record,
            sno: index + 1
        }));
            //this.historyRows = combinedHistory;
            this.historyRowsAll = combinedHistory; // full history list for pagination
            this.totalRecordsHistory = combinedHistory.length;
            this.pageNumberHistory = 1;
            this.pageSizeHistory = 10; // or your default page size
            this.paginationVisibleHistory = this.totalRecordsHistory > 0;
            this.paginationHelperHistory();
    
        })
        .catch((error) => {
            console.error('❌ Error fetching history:', error);
        });
    
    }
        get bDisableFirstHistory() {
            return this.pageNumberHistory == 1;
        }
    
        get bDisableLastHistory() {
            return this.pageNumberHistory == this.totalPagesHistory;
        }
        handleRecordsPerPageHistory(event) {
            this.pageSizeHistory = event.target.value;
            this.paginationHelperHistory();
        }
    
        previousPageHistory() {
            this.pageNumberHistory = this.pageNumberHistory - 1;
            this.paginationHelperHistory();
        }
    
        nextPageHistory() {
            this.pageNumberHistory = this.pageNumberHistory + 1;
            this.paginationHelperHistory();
        }
    
        firstPageHistory() {
            this.pageNumberHistory = 1;
            this.paginationHelperHistory();
        }
    
        lastPageHistory() {
            this.pageNumberHistory = this.totalPagesHistory;
            this.paginationHelperHistory();
        }
        paginationHelperHistory() {
            this.historyRows = [];
    
            // Calculate total pages
            this.totalPagesHistory = Math.ceil(this.totalRecordsHistory / this.pageSizeHistory);
    
            // Boundary conditions
            if (this.pageNumberHistory <= 1) {
                this.pageNumberHistory = 1;
            } else if (this.pageNumberHistory >= this.totalPagesHistory) {
                this.pageNumberHistory = this.totalPagesHistory;
            }
    
            // Prepare current page records
            const startIdx = (this.pageNumberHistory - 1) * this.pageSizeHistory;
            const endIdx = this.pageNumberHistory * this.pageSizeHistory;
    
            let pageData = [];
            for (let i = startIdx; i < endIdx && i < this.totalRecordsHistory; i++) {
                const row = Object.assign({}, this.historyRowsAll[i]);
                pageData.push(row);
            }
    
            this.historyRows = pageData;
        }
        handleHistoryClose(){
            this.showHistoryTable = false;
            this.editflag = true;
            this.entryFlag = false;
            this.addEntry = true;
            this.createEditEntry='Edit Entry';
            this.buttonLabel ='Update';
            this.isShowActivity = true;
            this.disabledInvoiceNo = true;
           
            
        }
        handleTaxSearch(event) {
        //const rowId = event.target.dataset.id;
        //const recordId = event.currentTarget.dataset.id;   
        const inputValue = event.target.value;
        const searchLower = inputValue.toLowerCase();
        const rowId =event.target.dataset.id;
        console.log('Search Row ID:', rowId, 'Input:', inputValue, 'searchLower:', searchLower);

       

        const filtered = this.taxCodes.filter(tax => {
            const label = tax.label?.toLowerCase() || '';
            const code = tax.code?.toLowerCase() || '';
            const desc = tax.description?.toLowerCase() || '';
            return (
                code.includes(inputValue) ||
                desc.includes(inputValue) ||
                label.includes(inputValue)
            );
        });

        console.log('🎯 Filtered Tax Codes:', filtered);

         this.salesEntryList = this.salesEntryList.map(sales => {
            if (sales.Id == rowId) {
                return {
                    ...sales,
                    tax: inputValue
                   // filteredTaxOptions: filtered,
                   // showTaxDropdown: true
                };
            }
            return sales;
        });

        this.filteredTaxCodes = filtered;
        this.activeRowId = rowId;
        this.showtableTax = true;
    }
}