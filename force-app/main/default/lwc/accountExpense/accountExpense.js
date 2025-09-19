import {LightningElement, wire, api, track } from 'lwc';
//import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
//import getLedgerItems from '@salesforce/apex/CreateCompanyController.getLedgerItems';
//import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getLedgerItemsforExpenses from '@salesforce/apex/AccountingModuleController.getLedgerItemsforExpenses';
//import createJournalEntries from '@salesforce/apex/AccountingModuleController.createJournalEntries';
 import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import getAccountingPurchases from '@salesforce/apex/AccountingChartController.getAccountingPurchases';
import getAccountingPurchasesInEdit from '@salesforce/apex/AccountingChartController.getAccountingPurchasesInEdit';
//import updateExpense from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateExpense';
import { refreshApex } from '@salesforce/apex';
//import deleteExpenseRecord from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.deleteExpenseRecord';
import deleteInvoiceLines from '@salesforce/apex/AccountingModuleController.deleteMatchingRecords';
import UpdateDataFromPurchases from '@salesforce/apex/AccountingChartController.UpdateDataFromPurchases';
import sendEmail from '@salesforce/apex/InvoiceHandler.sendEmailforInvoiceforPurchases';
import { deleteRecord } from 'lightning/uiRecordApi';
import getentityEmailForInvoices from '@salesforce/apex/AccountingChartController.getentityEmailForInvoices';
import getInvoiceHistoryDetails from '@salesforce/apex/AccountingChartController.getInvoiceHistoryDetails';

export default class AccountExpense extends LightningElement {
    @api orgid;
    // @api companyid;
    // @api companyname;
    @track salesEntryList = [];  
    @track showtable = false;  
    @track showtableTax = false;  
    @track ledgerItems = [];     
    @track companyId;            
    @track companyOptions = [];  
    @track selectedRowId;        
    @track popoverStyle = {};
    @track selectedOptionAL; 
    @track selectedOptionTax;
    @track subTotal;
    @track taxAmount;
    @track totalAmount;   
    @track selectedDescription;
    @track selectedAmount;
    @track selectedItem; 
    @track entryType; 
 @track deletedRowIds = [];
    wiredCompanyList;
    wiredEntityProfilesResult;
    wiredEntityProfilesTax;
    @track entryNameOptions=[];
    @track selectedEntityName;
    @track taxInclusive=true;
    //@track terms;
    @track invoiceDate=null;
    @track postDate=null;
    @track invoiceNo;
    @track comments;
    @track openExpenses = false;
    @track isExpenses = true;
    @track selectedCompany;
    @track companyOptions = []; 
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
    wireExpenseData;
    @track buttonLabel='Save';
    @track invoiceDeleteFlag=false;
    @track selectedExpenseId;
      // Variables for Supplier dropdown
   // supplierSearchTerm = '';
    FilteredLedgerItems = [];
    @track editflag = false;
    @track createEditExpense='Create Purchases';
    @track entryOptions=[{label:'Purchases',value:'Purchases'}];
    @track entryType = 'Purchases';
    @track entityOptions= [{label:'Supplier',value:'Supplier'}];
    @track selectedCardType = 'Supplier';
    @track paginationVisible=false;
    @track disabledInvoiceNo = true;
    @track selectedOptionTax1 ='';
    @track selectedOptionAL1 ='';
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
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
    fieldLabelMap = {
        // Parent object: Accounting_Invoices_Expenses__c
        //'Name': 'Invoice Name',
        'Post_Date__c': 'Post Date',
        'Due_Date__c': 'Due Date',
        'Invoice_Date__c': 'Invoice Date',
        'Status__c': 'Status',
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
        'Entity_Profile__c': 'Entity Profile',
        'Entity_Profile_Name__c': 'Entity Name',
        'Comments__c': 'Comments',
        'Notes__c': 'Notes',
        'Unit_Price__c': 'Unit Price',
        'Quantity__c': 'Quantity',
        'Tax__c': 'Tax',
        'Accounting_Ledger_Items__c': 'Ledger Item'
    };
    connectedCallback(){
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.companyId  = storedCompanyId;
            this.companyname = storedCompanyName;
            console.log('Company from localStorage connectedCallback AccountExpense:', this.companyId, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback AccountExpense');
        }
        //console.log('companyid in connectedCallback AccountExpense: ', this.companyid);
       // this.companyId = this.companyid;
        console.log(' companyname in connectedCallback AccountExpense: ', this.companyname);
        console.log('companyId in connectedCallback AccountExpense: ', this.companyId);
        console.log('entityOptions : ', JSON.stringify( this.entityOptions));
         this.taxInclusive = true;
        //this.selectedCardType ='Supplier';
        console.log('selectedCardType in connectedCallback AccountExpense: ', this.selectedCardType);
        if(this.selectedCardType){
            setTimeout(() => {
                refreshApex(this.wiredEntityProfilesResult);
            }, 1000);
        }
        this.addRow();

        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.startdateValueData = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.enddateValueData = last.toISOString().slice(0, 10);
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

     @track salesEntry = {
        company: this.companyId,
        entryType: 'Purchases',
        entityName: '',
        InvoiceDate: '',
        PostDate: '',
        InvoiceNo: '',
        taxInclusive: true,
        //Status: '',
        comments: ''
    };
     createRow() {
        const newRow = {
            Id: Date.now(),
            sno: this.salesEntryList.length + 1,
            Description__c: '',
            accountList: this.selectedOptionAL1 || '',
            accountItemId: this.selectedOptionALId,
            Amount__c: 0,
            tax: this.selectedOptionTax1,
            inputId: `input-${Date.now()}` 
        };
        return newRow;
    }
    
    @track highestTaxAmount = 0;
    addRow() {

        const newRow = this.createRow();
        this.salesEntryList = [...this.salesEntryList, newRow];
        console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
        this.reindexSalesEntryList(); // ensure S.No is always in order
    
        // Get highest taxAmount
        const taxAmounts = this.salesEntryList
            .map(row => Number(row.taxAmount))
            .filter(val => !isNaN(val));
    }
    @wire(getEntityProfiles, {companyId: '$companyId' , entryType:'$entryType' })
    wiredEntityProfiles(result) {
        console.log('entryType in wire AccountExpense: ', this.entryType);
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
            console.log('Filtered entryNameOptions options: ', JSON.stringify( this.entryNameOptions));
            if (!this.entryNameOptions.some(option => option.value === 'Add New Entity')) {
                this.entryNameOptions.push({ label: ' +  Add New Entity', value: 'Add New Entity' });
            }
            console.log('Filtered entryNameOptions options after: ', JSON.stringify( this.entryNameOptions));
        } else if (error) {
            this.error = error;
            console.error('Error fetching entity profiles:', error);
        }
    }
     @track selectedOptionALId;
     fetchEntityProfileTax(entityId) {
        getEntityProfileTax({ entityId: entityId })
            .then((data) => {
                console.log('getEntityProfileTax result: ', JSON.stringify(data));

                if (data && (data.tax || data.accountList)) {
                    console.log('selectedEntityName :', entityId); 

                    this.wiredEntityProfilesTax = { data: data, error: null };

                    const tax = data.tax;
                    const entityAccountList = data.accountList;
                    const entityItemId = data.accountItemId;
                    const taxValue = this.appendPercentage(tax);

                    if (this.editflag === true) {
                        this.salesEntryList = this.salesEntryList.map(entry => ({
                            ...entry,
                            tax: taxValue ? taxValue : (entry.tax || '0%'),
                            accountList: entityAccountList ? entityAccountList : (entry.accountList || ''),
                            accountItemId: entityItemId ? entityItemId : entry.accountItemId
                        }));
                        console.log(' Sales Entry List in entity IN EDIT:', JSON.stringify(this.salesEntryList));
                    } else {
                        this.salesEntryList = this.salesEntryList.map(entry => ({
                            ...entry,
                            tax: taxValue,
                            accountList: entityAccountList,
                            accountItemId: entityItemId
                        }));
                        console.log(' Sales Entry List in entity IN CREATE:', JSON.stringify(this.salesEntryList));
                    }

                    const selectedRow = this.salesEntryList.find(item => item.Id);
                    this.selectedOptionTax1 = selectedRow ? selectedRow.tax : '';        
                    this.selectedOptionAL1 = selectedRow ? selectedRow.accountList : '';
                    this.selectedOptionTax = selectedRow ? selectedRow.tax : '';        
                    this.selectedOptionAL = selectedRow ? selectedRow.accountList : '';
                    this.selectedOptionALId = selectedRow ? selectedRow.accountItemId : '';

                    console.log('Tax Value in getEntityProfileTax :', this.selectedOptionTax);
                    console.log('selectedOptionAL in getEntityProfileTax :', this.selectedOptionAL);
                    console.log(' Sales Entry List in entity:', JSON.stringify(this.salesEntryList));

                    this.updateTaxForSelectedRow(this.selectedOptionTax);
                } else {
                    console.warn('No valid Tax or AccountList received');
                    this.selectedOptionTax = '';
                    this.selectedOptionAL = '';

                    this.salesEntryList = this.salesEntryList.map(entry => ({
                        ...entry,
                        tax: '',
                        accountList: '',
                    }));
                }
            })
            .catch(error => {
                this.wiredEntityProfilesTax = { data: null, error: error };
                console.error('Error in fetchEntityProfileTax:', error);
            });
        }
        updateTaxForSelectedRow(taxRate) {
            let totalSubTotal = 0;
            let totalTaxAmount = 0;
            let totalAmount = 0;

            this.salesEntryList = this.salesEntryList.map(sales => {
                let updatedRecord = { ...sales };

                    updatedRecord.tax = `${taxRate}`;
                    updatedRecord.taxvalue = taxRate;
                    console.log(' updatedRecord.taxvalue  : ' ,  updatedRecord.taxvalue);

                    let rate =taxRate.split(' ')[0].replace('%', '');
                    let taxWithoutPercent = parseFloat(rate);
                    let taxRateDecimal = parseFloat(rate) / 100;
                
                    if (isNaN(taxWithoutPercent)) {
                            console.error('Invalid tax rate:', rate);
                            return updatedRecord;
                        }

                    //const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
                    const amount = parseFloat(updatedRecord.Amount__c) || 0;
                    updatedRecord.calculatedAmount = parseFloat(( amount).toFixed(2));
                    //updatedRecord.subTotal = parseFloat(updatedRecord.calculatedAmount.toFixed(2));
                    const rawAmount = updatedRecord.calculatedAmount;
                    if (this.taxInclusive) {
                        const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
                        const taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));
                        updatedRecord.subTotal = subTotal;
                        updatedRecord.taxAmount = taxAmount;
                        updatedRecord.totalAmount = rawAmount;
                        console.log('✅ [TAX INCLUSIVE]  updateTaxForSelectedRow ', subTotal, taxAmount, rawAmount);
                    } else {
                        const taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
                        const totalAmountCalc = parseFloat((rawAmount + taxAmount).toFixed(2));
                        updatedRecord.subTotal = rawAmount;
                        updatedRecord.taxAmount = taxAmount;
                        updatedRecord.totalAmount = totalAmountCalc;
                        console.log('✅ [TAX EXCLUSIVE] updateTaxForSelectedRow', rawAmount, taxAmount, totalAmountCalc);
                    }
                
                totalSubTotal += parseFloat(updatedRecord.subTotal) || 0;
                totalTaxAmount += parseFloat(updatedRecord.taxAmount) || 0;
                totalAmount += parseFloat(updatedRecord.totalAmount) || 0;

                return updatedRecord;
            });

            this.amountarrey = {
                subTotal: totalSubTotal,
                taxAmount: totalTaxAmount,
                totalAmount: totalAmount
            };

            this.subTotal = totalSubTotal;
            this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
            this.totalAmount = parseFloat(totalAmount.toFixed(2));
    }

    appendPercentage(taxValue) {
        // Assuming taxValue is already a number (like 10 for 10%)
        if (taxValue != null) {
            return `${taxValue}%`; // Append '%' to the number
        }
        return '0%'; // If no tax value, return '0%'
    }

    fetchLedgerItemsforExpenses() {
        console.log('Calling Apex Method: getLedgerItemsforExpenses...');
        console.log('companyId in fetchLedgerItemsforExpenses: ' + this.companyId);

        // Call the Apex method and pass companyId as parameter
        getLedgerItemsforExpenses({ companyId: this.companyId })
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
   
    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const fieldChecked=event.target.checked;

        const isToggle = event.target.type === 'toggle';
        const valueToSet = isToggle ? fieldChecked : fieldValue;

        // Update salesEntry correctly
        this.salesEntry = {
            ...this.salesEntry,
            [fieldName]: valueToSet
        };
        console.log(`Updated Field - ${fieldName}:`, fieldValue);
        console.log('this.salesEntry===>'+JSON.stringify(this.salesEntry));
      
    
        switch(fieldName) {
            // case 'company':
            //     this.companyId = fieldValue;
            //     console.log('Selected Company ID:', this.companyId);
            //     break;
            case 'entryType':
                this.entryType = fieldValue;
                console.log('Selected entryType:', this.entryType);
                break;
            case 'subTotal':
                this.subTotal = fieldValue;
                console.log('Selected sub total:', this.subTotal);
                break;
            case 'entityType':
                this.selectedCardType = fieldValue;
                console.log('Selected Entity Type:', this.selectedCardType);

                setTimeout(() => {
                    refreshApex(this.wiredEntityProfilesResult);
                }, 1000);
                break;
    
            case 'entityName':
                this.selectedEntityName = fieldValue;
                console.log('Selected Entity Name:', this.selectedEntityName);
                this.fetchEntityProfileTax(this.selectedEntityName);

                if (this.selectedEntityName === 'Add New Entity') {
                    console.log('isNewEntityFlag in if : '+  this.isNewEntityFlag);
                    this.isNewEntityFlag = true;
                    console.log('isNewEntityFlag in if AFTER : '+  this.isNewEntityFlag);
                    this.isExpenses = false;
                    this.openExpenses = false;
                    // this.isSalesFlag=false;
                    // this.isPurchasesFlag=false;
                    // this.isInvoiceflag = false;
                    // //this.isRFQEnabled=false; 
                    // this.isHome = false;
                    // this.isTitleMenuFlag = false;
                    // //this.isSalesFlag = false;
                    // this.isSalesTableFlag = false;
                    // this.isToggleVisible = false;
                }
               
                break;
    
            case 'taxInclusive':
                this.taxInclusive =fieldChecked;
                console.log('Tax Inclusive:', this.taxInclusive);
               let totalSubTotal = 0;
                let totalTaxAmount = 0;
                let totalAmount = 0;

                let taxValue = '';
                
                // ✅ Now recalculate financials for each row
                this.salesEntryList = this.salesEntryList.map(entry => {
                    const updatedEntry = { ...entry };

                    //const quantity = parseFloat(updatedEntry.Quantity__c) || 0;
                    const amount = parseFloat(updatedEntry.Amount__c) || 0;
                    updatedEntry.calculatedAmount = parseFloat((amount).toFixed(2));
                    const rawAmount =   updatedEntry.calculatedAmount;

                    const rate = updatedEntry.tax?.toString().split(' ')[0].replace('%', '') || '0';
                    const taxRateDecimal  = parseFloat(rate) / 100;

                    if (this.taxInclusive && !isNaN(taxRateDecimal )) {
                        const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
                        const taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));
                        updatedEntry.subTotal = subTotal;
                        updatedEntry.taxAmount = taxAmount;
                        updatedEntry.totalAmount = rawAmount;
                        console.log('✅ [TAX INCLUSIVE]', subTotal, taxAmount, rawAmount);
                    } else {
                        const taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
                        const totalAmountCalc = parseFloat((rawAmount + taxAmount).toFixed(2));
                        updatedEntry.subTotal = rawAmount;
                        updatedEntry.taxAmount = taxAmount;
                        updatedEntry.totalAmount = totalAmountCalc;
                        console.log('✅ [TAX EXCLUSIVE]', rawAmount, taxAmount, totalAmountCalc);
                    }

                    totalSubTotal += updatedEntry.subTotal;
                    totalTaxAmount += updatedEntry.taxAmount;
                    totalAmount += updatedEntry.totalAmount;

                    return updatedEntry;
                });

                // ✅ Set final totals
                this.subTotal = parseFloat(totalSubTotal.toFixed(2));
                this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
                this.totalAmount = parseFloat(totalAmount.toFixed(2));

                this.amountarrey = {
                    subTotal: this.subTotal,
                    taxAmount: this.taxAmount,
                    totalAmount: this.totalAmount
                };

                console.log('Updated Sales Entry List after Tax Inclusive toggle:', JSON.stringify(this.salesEntryList));
                console.log('Totals:', this.amountarrey);
                break;
    
            // case 'Terms':
            //     this.terms = fieldValue;
            //     console.log('Terms:', this.terms);
            //     break;
    
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
            case 'startdateValueData':
                this.startdateValueData = fieldValue;
                console.log('startdateValueData:', this.startdateValueData);
                break;
            case 'enddateValueData':
                this.enddateValueData = fieldValue;
                console.log('enddateValueData:', this.enddateValueData);
                break;
                            
                    // if (event.target.name == 'startdateValueData') {
                    //     this.startdateValueData = event.detail.value;
                    //     this.validateDates();
                    // }
                    // if (event.target.name == 'enddateValueData') {
                    //     this.enddateValueData = event.detail.value;
                    //     this.validateDates();
                    // }
            default:
                console.log('Unknown field:', fieldName);
                break;
        }
    }
    
    
    handleDropdownPosition(event) {

        console.log('toggleDropdown');
         const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        this.activeRowId =rowId;
          // Calculate the position of the dropdown button
        //this.selectedOptionAL = '';
        this.showtable = !this.showtable;
        console.log('showtable after : '+this.showtable);
        this.fetchLedgerItemsforExpenses(); 
        
        const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
    
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.18); // subtract 10% from X
    
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
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
         if (this.showtable) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }



    // toggleDropdownTax(event) {
    //     console.log('toggleDropdown');
    //      this.selectedRowId=event.currentTarget.dataset.id;
    //      console.log('selectedRowId'+this.selectedRowId);
    //       // Calculate the position of the dropdown button 
    //      this.showtableTax = !this.showtableTax;
    //     //   if(!this.taxInclusive){
    //     //       this.showtableTax  = false;
    //     //   } 
    //     //   else{
    //     //     this.showtableTax = !this.showtableTax;
    //     //   }
          
    //     console.log('showtable after : '+this.showtableTax);
    //     //this.fetchLedgerItems(); 

    //     const rect = event.currentTarget.getBoundingClientRect();
    //     const scrollY = window.scrollY || window.pageYOffset;
    //     const scrollX = window.scrollX || window.pageXOffset;
    
    //     // Calculate position based on 10% X offset and 2% Y offset
    //     // const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
    //     // const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X
    //     const top = rect.top + scrollY + rect.height - 36;   // Adjust -17 as needed
    //     const left = rect.left + scrollX-350;  
    
    //     this.taxDropdownStyle = `
    //         position: absolute;
    //         top: ${top}px;
    //         left: ${left}px;
    //         width: 23%;
    //         max-height: 300px;
    //         z-index: 1000;
    //         background: white;
    //         border: 1px solid #ccc;
    //         border-radius: 4%;
    //         overflow-y: auto;
    //         box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    //     `;
    //      if (this.showtableTax) {
    //         setTimeout(() => {
    //             console.log('✅ Outside click detection enabled');
    //             this.listenForOutsideClick = true;
    //         }, 0);
    //     } else {
    //         console.log('❌ Popover closed manually');
    //         this.listenForOutsideClick = false;
    //     }
    // }
    toggleDropdownTax(event) {
    this.selectedRowId = event.currentTarget.dataset.id;
    this.showtableTax = !this.showtableTax;

    const rect = event.currentTarget.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    const top = rect.top + scrollY + rect.height - 36;

    // 📐 Adjust offset based on device DPI
    let leftOffset;
    const dpr = window.devicePixelRatio;

    if (dpr === 1) {           // 100% zoom, 96 DPI
        leftOffset = 350;
    } else if (dpr === 1.25) { // 125% zoom, ~120 DPI
        leftOffset = 300;
    } else if (dpr === 1.5) {  // 150%
        leftOffset = 250;
    } else {
        leftOffset = 280; // fallback for unknown scales
    }

    const left = rect.left + scrollX - leftOffset;

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

    if (this.showtableTax) {
        setTimeout(() => {
            this.listenForOutsideClick = true;
        }, 0);
    } else {
        this.listenForOutsideClick = false;
    }
}

    @track selectedItemId;
    // Handle the selection of a ledger item from the popover
    handleSelection(event) {
        // Use event.currentTarget to refer to the <tr> element, not the clicked <td> element
        const recordId = event.currentTarget.dataset.id;
         const accountNumber = event.currentTarget.dataset.accno;  // Account Number
        const accountValue = event.currentTarget.dataset.value;   
        const rowId = this.activeRowId; // ID of the row currently being edited
    
        console.log('Selected Record ID:', recordId);
        console.log('Account Number:', accountNumber);
        console.log('Account Value:', accountValue);
        console.log('Active Row ID:', rowId);
        this.salesEntryList = this.salesEntryList.map(sales => {
                if (sales.Id == rowId) {  // Directly checking with sales.Id
                    return { 
                        ...sales, 
                        accountList: `${accountNumber} - ${accountValue}` ,
                        accountItemId: recordId,
                    };
                }
                return sales;
            });
    
        // Hide the table once an item is selected
        this.showtable = false;
        console.log('Updated Sales Entry List handleSelectionAL :', JSON.stringify(this.salesEntryList));
        this.listenForOutsideClick = false;
    }
    //@track selectedRowId; 
     @track amountarrey = [];    
     handleSelectionTax(event) {
        const recordId = event.currentTarget.dataset.id;
        const code = event.currentTarget.dataset.code;
        const rate = event.currentTarget.dataset.rate;

        console.log('🔹 Record ID in Tax:', recordId);
        console.log('🔹 Selected Tax Code:', code);
        console.log('🔹 Tax Rate (%):', rate);
        console.log('🔹 Tax Inclusive?', this.taxInclusive);
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));

        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;

        this.salesEntryList = this.salesEntryList.map(sales => {
            let updatedRecord = { ...sales };

            if (String(sales.Id) === this.selectedRowId) {
                updatedRecord.tax = `${rate}`;
                updatedRecord.taxvalue = rate;

               // const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
                const amount = parseFloat(updatedRecord.Amount__c) || 0;
                const rawAmount = parseFloat((amount).toFixed(2));
                const taxRateDecimal = parseFloat(rate) / 100;

                updatedRecord.calculatedAmount = rawAmount;

                // console.log('🧮 Quantity:', quantity);
                console.log('🧮 amount:', amount);
                console.log('🧮 Raw Amount (Qty × Price):', rawAmount);
                console.log('🧮 Tax Rate (Decimal):', taxRateDecimal);

                if (this.taxInclusive) {
                    // Tax is included in total amount
                    const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
                    const taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));

                    updatedRecord.subTotal = subTotal;
                    updatedRecord.taxAmount = taxAmount;
                    updatedRecord.totalAmount = rawAmount;

                    console.log('✅ [TAX INCLUSIVE]');
                    console.log('➡️ Sub Total:', subTotal);
                    console.log('➡️ Tax Amount:', taxAmount);
                    console.log('➡️ Total Amount:', rawAmount);
                } else {
                    // Tax is added on top
                    const taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
                    const totalAmount = parseFloat((rawAmount + taxAmount).toFixed(2));

                    updatedRecord.subTotal = rawAmount;
                    updatedRecord.taxAmount = taxAmount;
                    updatedRecord.totalAmount = totalAmount;

                    console.log('✅ [TAX EXCLUSIVE]');
                    console.log('➡️ Sub Total:', rawAmount);
                    console.log('➡️ Tax Amount:', taxAmount);
                    console.log('➡️ Total Amount:', totalAmount);
                }

                console.log('🔄 Updated Record:', JSON.stringify(updatedRecord));
            }

            totalSubTotal += parseFloat(updatedRecord.subTotal) || 0;
            totalTaxAmount += parseFloat(updatedRecord.taxAmount) || 0;
            totalAmount += parseFloat(updatedRecord.totalAmount) || 0;

            return updatedRecord;
        });

        this.amountarrey = {
            subTotal: totalSubTotal,
            taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2))
        };

        this.subTotal = this.amountarrey.subTotal;
        this.taxAmount = this.amountarrey.taxAmount;
        this.totalAmount = this.amountarrey.totalAmount;

        this.selectedOptionTax = `${rate}`;
        this.showtableTax = false;
        this.listenForOutsideClick = false;

        console.log('📊 Updated Amount Array:', JSON.stringify(this.amountarrey));
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
        console.log('🧾 Totals → SubTotal:', this.subTotal, ', TaxAmount:', this.taxAmount, ', TotalAmount:', this.totalAmount);
    }
   
   // Handle input changes for amount
    handleInputChange(event) {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        const recordId = event.target.dataset.id;
        this.selectedRowId = event.currentTarget.dataset.id;

        console.log('Field Name:', fieldName);
        console.log('Field Value:', fieldValue);
        console.log('Record ID:', recordId);
        console.log('this.selectedRowId:', this.selectedRowId);

        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;

        this.salesEntryList = this.salesEntryList.map(sales => {
            let updatedRecord = { ...sales };

            // 🔁 Update only the edited row's field
            if (sales.Id == this.selectedRowId) {
                if (fieldName === 'Amount__c') {
                    updatedRecord[fieldName] = parseFloat(fieldValue) || 0;
                } else {
                    updatedRecord[fieldName] = fieldValue;
                }
            }

            // 🔢 Extract quantity and amount
           // const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
            const amount = parseFloat(updatedRecord.Amount__c) || 0;
            const rawAmount = parseFloat(( amount).toFixed(2));

            updatedRecord.calculatedAmount = rawAmount;

            if (this.entryType === 'Purchases') {
                // 📌 Use row-level tax if exists
                let taxRateStr = updatedRecord.tax || this.selectedOptionTax || '0%';
                let rate = taxRateStr.split(' ')[0].replace('%', '');
                let taxRate = parseFloat(rate);
                let taxRateDecimal = taxRate / 100;

                if (isNaN(taxRate)) {
                    taxRate = 0;
                    taxRateDecimal = 0;
                }

                // 💰 Tax Inclusive / Exclusive calculation
                if (this.taxInclusive) {
                    const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
                    const taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));

                    updatedRecord.subTotal = subTotal;
                    updatedRecord.taxAmount = taxAmount;
                    updatedRecord.totalAmount = rawAmount;
                } else {
                    const taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
                    const totalAmountCalc = parseFloat((rawAmount + taxAmount).toFixed(2));

                    updatedRecord.subTotal = rawAmount;
                    updatedRecord.taxAmount = taxAmount;
                    updatedRecord.totalAmount = totalAmountCalc;
                }

                // 📊 Accumulate totals
                totalSubTotal += updatedRecord.subTotal;
                totalTaxAmount += updatedRecord.taxAmount;
                totalAmount += updatedRecord.totalAmount;
            }

            return updatedRecord;
        });

        // 🧮 Assign calculated totals
        this.subTotal = parseFloat(totalSubTotal.toFixed(2));
        this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
        this.totalAmount = parseFloat(totalAmount.toFixed(2));

        // Store totals in amountarrey object if used elsewhere
        this.amountarrey = {
            subTotal: this.subTotal,
            taxAmount: this.taxAmount,
            totalAmount: this.totalAmount
        };

        console.log('📌 Final Totals:', this.amountarrey);
        console.log('📋 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    }
   
    // handleSaveExpense() {
    //     if (!this.selectedEntityName || !this.invoiceDate || !this.postDate  || !this.entryType || !this.invoiceNo) {
    //         this.showToast('Error', 'Please Enter the required fields.', 'error');
    //         return;
    //     }
    //     //console.log()
    //     // Log the inputs to see what values are being passed to the Apex method
    //     console.log('Handling save for journal entries');
    //     console.log('Sending to Apex for Update:');
    //     console.log('Sales Entry:', JSON.stringify(this.salesEntry));
    //     console.log('Sales Entry List in save:', JSON.stringify(this.salesEntryList));
    //     console.log('amountarrey : ' + JSON.stringify(this.amountarrey));
        
    //     const isUpdate = !!this.salesEntry.invoiceId; // true if updating
    //     UpdateDataFromPurchases({
    //         salesEntryJson: JSON.stringify(this.salesEntry),
    //         salesEntryListJson: JSON.stringify(this.salesEntryList),
    //         amountEntryJson: JSON.stringify(this.amountarrey) 
    //         //isExpenses: isExpenses      //console.log('console in update');
    //         //createdFromExpenses: true,

    //     })
    //     .then(result => {
    //         console.log('Result from Apex:', result);
    //         const tempInvoiceId = result.Id;  
    //         console.log('Temporary Invoice ID:', tempInvoiceId);
    //         //this.showToast('Success', 'Purchases Data saved successfully', 'success');
    //         this.companyId = this.salesEntry.company;  // Assuming salesEntry contains the correct companyId
    //         console.log('Updated companyId after save:', this.companyId);
    //         console.log('updated Sales Entry List:', JSON.stringify(this.salesEntryList));
           
    //         if (isUpdate) {
    //             this.showToast('Success', 'Data updated successfully', 'success');
    //         } else {
    //             this.showToast('Success', 'Purchases data saved successfully', 'success');
    //         }
    //         refreshApex(this.wireExpenseData);
    //         //this.showToast('Success', 'Update successfully', 'success');
    //         this.handleClear();
    //     })
    //     .catch(error => {
    //         console.error('Error creating journal entries:', error);
            
    //         // Check if the error has message and then log or show the message
    //         if (error.body && error.body.message) {
    //             this.showToast('Error', error.body.message, 'error');
    //         } else {
    //             this.showToast('Error', 'An unknown error occurred while creating journal entries.', 'error');
    //         }
    //     });
       
    //     console.log('deletedRowIds BEFORE:', JSON.stringify(this.deletedRowIds));
    //         if (this.deletedRowIds && this.deletedRowIds.length > 0) {
    //             console.log('deletedRowIds:', JSON.stringify(this.deletedRowIds));
    //             deleteInvoiceLines({ deletedIdsJson: JSON.stringify(this.deletedRowIds) })
    //                 .then(() => {
    //                     console.log('Deleted rows handled successfully.');
    //                     // Optionally clear deletedRowIds after deletion
    //                     this.deletedRowIds = [];
    //                 })
    //                 .catch(error => {
    //                     console.error('Error deleting rows:', error);
    //                     this.showToast('Error', 'Failed to delete rows', 'error');
    //                 });
    //         }
    //    // this.handleClear();
    // }
    async handleSaveExpense() {
        if (!this.selectedEntityName || !this.invoiceDate || !this.postDate || !this.entryType || !this.invoiceNo) {
            this.showToast('Error', 'Please Enter the required fields.', 'error');
            return;
        }

        console.log('Handling save for journal entries');
        console.log('Sending to Apex for Update:');
        console.log('Sales Entry:', JSON.stringify(this.salesEntry));
        console.log('Sales Entry List in save:', JSON.stringify(this.salesEntryList));
        console.log('amountarrey : ' + JSON.stringify(this.amountarrey));

        const isUpdate = !!this.salesEntry.invoiceId; // true if updating

        try {
            // ✅ Delete rows first if any
            console.log('deletedRowIds BEFORE:', JSON.stringify(this.deletedRowIds));
            if (this.deletedRowIds && this.deletedRowIds.length > 0) {
                console.log('deletedRowIds:', JSON.stringify(this.deletedRowIds));
                await deleteInvoiceLines({ deletedIdsJson: JSON.stringify(this.deletedRowIds) });
                console.log('Deleted rows handled successfully.');
                this.deletedRowIds = [];
            }

            // ✅ Save or update
            const result = await UpdateDataFromPurchases({
                salesEntryJson: JSON.stringify(this.salesEntry),
                salesEntryListJson: JSON.stringify(this.salesEntryList),
                amountEntryJson: JSON.stringify(this.amountarrey)
                // isExpenses: isExpenses,
                // createdFromExpenses: true,
            });

            console.log('Result from Apex:', result);
            const tempInvoiceId = result.Id;
            console.log('Temporary Invoice ID:', tempInvoiceId);

            this.companyId = this.salesEntry.company;
            console.log('Updated companyId after save:', this.companyId);
            console.log('updated Sales Entry List:', JSON.stringify(this.salesEntryList));

            if (isUpdate) {
                this.showToast('Success', 'Data updated successfully', 'success');
            } else {
                this.showToast('Success', 'Purchases data saved successfully', 'success');
            }

            refreshApex(this.wireExpenseData);
            this.handleClear();

        } catch (error) {
            console.error('Error creating journal entries:', error);
            if (error.body && error.body.message) {
                this.showToast('Error', error.body.message, 'error');
            } else {
                this.showToast('Error', 'An unknown error occurred while creating journal entries.', 'error');
            }
        }
    }


    handleDeleteRow(event) {
        console.log('handleDeleteRow');
        if (this.salesEntryList.length === 1) {
            this.showToast('Error', 'At least one row is required. ', 'error');
            return;
        }
        const rowId = event.currentTarget.dataset.id;  // Keep as string
        this.salesEntryList = this.salesEntryList.filter(row => String(row.Id) !== rowId);
        this.selectedRowId = null;
        if( this.createEditExpense=='Edit Purchase' ||this.buttonLabel =='Update'){
            if (!this.deletedRowIds) {
                this.deletedRowIds = [];
            }
            this.deletedRowIds.push(rowId);
            console.log('Deleted Row IDs:', this.deletedRowIds);
        }
        
        this.recalculateTotals();
        this.reindexSalesEntryList();
    
        // ✅ Update highest tax amount after deletion
        const taxAmounts = this.salesEntryList
            .map(row => Number(row.taxAmount))
            .filter(val => !isNaN(val));
        console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
    }
        
    // reindexSalesEntryList() {
    //     this.salesEntryList = this.salesEntryList.map((row, index) => ({
    //         ...row,
    //         sno: index + 1
    //     }));
    // }
     reindexSalesEntryList() {
        let reindexedList = [];

        for (let i = 0; i < this.salesEntryList.length; i++) {
            let row = { ...this.salesEntryList[i] };
            row.sno = i + 1;
            reindexedList.push(row);
        }

        this.salesEntryList = [...reindexedList]; // ✅ triggers UI reactivity
    }
    recalculateTotals() {
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;

        this.salesEntryList = this.salesEntryList.map(entry => {
            //const quantity = parseFloat(entry.Quantity__c) || 0;
            const amount = parseFloat(entry.Amount__c) || 0;
            const rawAmount = parseFloat(( amount).toFixed(2));
            
            let taxRateDecimal = 0;
            if (entry.tax) {
                const rate = entry.tax.replace('%', '').trim();
                taxRateDecimal = parseFloat(rate) / 100 || 0;
            }

            let subTotal = 0;
            let taxAmount = 0;
            let total = 0;

            if (this.taxInclusive) {
                // Tax is included in raw amount
                subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
                taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));
                total = rawAmount;
            } else {
                // Tax is on top
                taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
                subTotal = rawAmount;
                total = parseFloat((subTotal + taxAmount).toFixed(2));
            }

            totalSubTotal += subTotal;
            totalTaxAmount += taxAmount;
            totalAmount += total;

            return {
                ...entry,
                calculatedAmount: rawAmount,
                subTotal: subTotal,
                taxAmount: taxAmount,
                totalAmount: total
            };
        });

        this.subTotal = parseFloat(totalSubTotal.toFixed(2));
        this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
        this.totalAmount = parseFloat(totalAmount.toFixed(2));

        this.amountarrey = {
            subTotal: this.subTotal,
            taxAmount: this.taxAmount,
            totalAmount: this.totalAmount
        };

        console.log('✅ Totals recalculated:', JSON.stringify(this.amountarrey));
        console.log('📦 Updated salesEntryList:', JSON.stringify(this.salesEntryList));
    }
    handleClear(){
        //console.log('console in clear');
        this.isExpenses = true;
        this.openExpenses = false;
        //this.companyId = null;
         this.salesEntryList = [];
        this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = false;
        this.isShowActivity = false; 
        this.showHistoryTable = false; 
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.comments = '';
        this.subTotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
        this.salesEntry = {
            company: this.companyId,
            entryType: 'Purchases',
            entityName: '',
            InvoiceDate: '',
            PostDate: '',
            InvoiceNo: '',
            taxInclusive:false,
            //Status: '',
            comments: '',
            invoiceId:null
        };
    this.ledgerItems = []; 
     this.deletedRowIds = [];    
    this.selectedRowId = null;  
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
                    Amount__c: ''
                };
            });
        }
        this.backToParent();
    }
    backToParent(){
        const event = new CustomEvent('backfromexpenses', {
            detail: {}, // You can send data if needed
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event); 
       
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
    //track  isExpense=true;
    @wire(getAccountingPurchases, { sDate: '$startdateValueData', eDate: '$enddateValueData', companyId: '$companyId' })
    wiredExpenseData(result) {
        console.log('selectedCompany in wiredExpenseData before:', this.companyId);
        this.wireExpenseData = result;
       
        console.log('result in wiredExpenseData:', JSON.stringify(result));

        const { data, error } = result;
        if (data) {
            console.log('result in wiredExpenseData inside if :', JSON.stringify(result));
            
            this.records = data.map(invoice => {
                let entityName = '';
                const entryWithSlNo1 = invoice.Accounting_Journal_Entry__r.find(
                    entry => entry.Sl_no__c === 1
                );

                const firstRowDescription = entryWithSlNo1 ? entryWithSlNo1.Description__c : null;

                 const allDescriptionsMap = new Map();
                 invoice.Accounting_Journal_Entry__r.forEach(entry => {
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

                const invoiceEntry = invoice.Accounting_Journal_Entry__r.find(
                    item =>
                        item.Sl_no__c === 1 &&
                        item.Accounting_Ledger_Items__r &&
                        item.Accounting_Ledger_Items__r.Category__r &&
                        item.Accounting_Ledger_Items__r.Category__r.Name === 'Expenses'
                    );

                    const ledgerItemName = invoiceEntry ? invoiceEntry.Accounting_Ledger_Items__r.Name : null;
                
                if (invoice.Accounting_Journal_Entry__r && invoice.Accounting_Journal_Entry__r.length > 0) {
                    const entityProfile = invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r;
                    if (entityProfile) {
                        entityName = `${entityProfile.First_Name__c || ''} ${entityProfile.Last_Name__c || ''} ${entityProfile.Name__c || ''}`.trim();
                    }
                }
                
                return {
                    Id: invoice.Id,
                    Name: invoice.Invoice_No__c,
                   // Status__c: invoice.Status__c,
                    // description:invoice.Accounting_Journal_Entry__r[0].Description__c,
                    description:firstRowDescription,
                    allDescriptions: sortedDescriptions,
                    date: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
                    gst: parseFloat(invoice.GST__c).toFixed(2),
                    amount: parseFloat(invoice.Total_Amount__c).toFixed(2),
                    entityName: entityName || 'N/A',  // Assign 'N/A' if no company name is found
                    //ledgerItem:invoice.Accounting_Journal_Entry__r[0].Accounting_Ledger_Items__r.Name,
                    ledgerItem:ledgerItemName,
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
             console.log(' this.records in wiredExpenseData:', JSON.stringify( this.records));
            this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
            if (this.totalRecords > 0) {
                    this.paginationVisible = true;
                }
            this.paginationHelper();
            console.log('expenseData in wiredExpenseData:', JSON.stringify(this.records));
        } else if (error) {
            // Handle error
            console.error('Error retrieving company data:', JSON.stringify(error));
            this.error = error.body.message;  // Storing error message
           // this.showErrorToast(this.error); // Show error toast if necessary
        }
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
    handleaddExpenses() {
       
        this.isExpenses = false;
        this.openExpenses = true;
        this.createEditExpense='Create Purchases';
        this.buttonLabel = 'Save';
        this.disabledInvoiceNo = false;
        this.isShowActivity = false; 
        this.showHistoryTable = false; 
        //this.handleClear();
          this.salesEntry = {
            company: this.companyId,
            entryType: 'Purchases',
            entityName: '',
            InvoiceDate: '',
            PostDate: '',
            InvoiceNo: '',
            taxInclusive:true,
           // Status: '',
            comments: '',
            invoiceId:null
        };  
        //this.companyId = null;
       // this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = true;
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.comments = '';
        this.subTotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
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
        // this.addRow();
        if( this.salesEntryList.length === 0) {

            this.addRow();
        }
        if (this.salesEntryList.length > 0) {
            this.salesEntryList = this.salesEntryList.map(entry => {
                return {
                    ...entry,
                   //Id: Date.now(),
                    //sno: this.salesEntryList.length + 1,
                    Description__c: '',
                    accountList: '',
                    accountItemId: '',
                    Amount__c: 0,
                    tax: ''
                };
            });
        }
          this.hideParent();
    }
    hideParent(){
        const event = new CustomEvent('addexpenses', {
            detail: { triggerExpenseFlag: true }, // optional payload
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
    RefreshExpensesData(){
        refreshApex(this.wireExpenseData);  
    }
    closeaddExpenses() {
        this.isExpenses = true;
        this.openExpenses = false;
    }
    hideModalBox(){
        this.isExpenses=true; 
        this.openExpenses = false;
        refreshApex(this.wireExpenseData);
        // this.isEdit=false;  
        // this.isFileAttached=false; 
        // this.addImport=false;   
        this.backToParent(); 
        this.handleClear();
    }
    handleChangeCompany(event){
        this.selectedCompany=event.target.value;
        console.log('Select Company===>'+event.target.value);
        console.log('Select Company===>'+this.selectedCompany);
       // refreshApex(this.wiredAccountList); 
    }
    handleClick(event){
        this.isExpenses = false;
        this.openExpenses = true;
        this.disabledInvoiceNo = true;
        this.isShowActivity = true;
        this.createEditExpense='Edit Purchase';
        this.buttonLabel = 'Update';
        this.expenseID=event.currentTarget.dataset.id;
            console.log('Edit button clicked for expenseID : ' + this.expenseID);
            this.fetchExpenseDetails(this.expenseID);
            this.hideParent();    
    }
    fetchExpenseDetails(expenseID) {
        console.log('Fetching expense details for invoiceID: ' + expenseID);
        
        // getExpenseOnEdit({ expenseID: expenseID })
        //     .then(result => {
        //         console.log('Expense data fetched:', JSON.stringify(result));
    
        //         if (result) {
        //             // Map the fields to your form data
        //             const expense = result;
        //             const entityProfile = result.Entity_Profile__r;
                   
        //         // Create the entryNameOptions dynamically based on Entity_Profile__r fields
        //             this.entryNameOptions = [{
        //                 label: entityProfile.Name__c 
        //                     ? entityProfile.Name__c // Use Name__c if available
        //                     : `${entityProfile.First_Name__c} ${entityProfile.Last_Name__c}`, // Use First Name and Last Name otherwise
        //                 value: entityProfile.Id
        //             }];
        //             console.log('entryNameOptions :', JSON.stringify(this.entryNameOptions));
                   
        //             this.selectedEntityName=expense.Entity_Profile__r.Id;
        //             console.log('selectedEntityName: ' + this.selectedEntityName);
        //             // Ensure the data is assigned to the form variables
        //             this.companyId =expense.Company__c, 
        //             this.totalAmount = expense.Amount__c || 0;
        //             this.selectedAmount = expense.Amount__c || 0;
        //             this.taxAmount = expense.Tax_Amount__c || 0;
        //             this.subTotal = this.totalAmount - this.taxAmount; // You may want to calculate it like this (assuming)
        //             //this.selectedOptionAL = expense.Accounting_Ledger_Items__r ? expense.Accounting_Ledger_Items__r.Name : '';
        //             this.selectedOptionAL = expense.Accounting_Ledger_Items__r ? ` ${expense.Accounting_Ledger_Items__r.Account_Number__c} ${expense.Accounting_Ledger_Items__r.Name}`: '';
                    
        //            this.selectedDescription = expense.Description__c || '';
        //             this.selectedCardType = expense.Entity_Profile__r ? expense.Entity_Profile__r.Card_Type__c : '';
                   
        //             this.taxInclusive = expense.Tax_Inclusive__c || false; // Set taxInclusive if applicable
        //             //this.terms = expense.Terms__c || ''; // Set terms if applicable
        //             this.invoiceDate = expense.Invoice_Date__c || '';
        //             this.postDate = expense.Post_Date__c || ''; // Set post date if applicable
        //             this.invoiceNo = expense.Invoice_No__c	 || ''; // Assuming Name is the invoice number
        //             this.entryType = expense.Entry_Type__c || '';
        //             this.comments = expense.Comments__c || '';
        //             console.log('expense.Tax__c : ' + expense.Tax__c);
        //             // this.selectedOptionTax=expense.Tax__c ? `${expense.Tax__c}%` : '';
        //             this.selectedOptionTax = (expense.Tax__c !== null && expense.Tax__c !== undefined)
        //                                             ? `${expense.Tax__c}%`
        //                                             : '';
        //             console.log('selectedOptionTax in edit: ' + this.selectedOptionTax);
        //             const selectedOptionALName = this.selectedOptionAL.split(' - ')[1];
        //             console.log(' selectedOptionALName:', selectedOptionALName);
        //             this.selectedItemId = expense.Accounting_Ledger_Items__r.Id;
        //             console.log(' selectedItemId in edit:', this.selectedItemId);
        //             // Log populated fields
        //             console.log('Populated Fields: ', {
        //                 totalAmount: this.totalAmount,
        //                 taxAmount: this.taxAmount,
        //                 subTotal: this.subTotal,
        //                 selectedItem: this.selectedOptionALName,
        //                 selectedDescription: this.selectedDescription,
        //                 selectedCardType: this.selectedCardType,
        //                 selectedEntityName: this.selectedEntityName,
        //                 taxInclusive: this.taxInclusive,
        //                 invoiceDate: this.invoiceDate,
        //                 postDate: this.postDate,
        //                 invoiceNo: this.invoiceNo,
        //                 entryType: this.entryType,
        //                 comments: this.comments,
        //                 amount: this.selectedAmount,
        //                 selectedOptionTax:this.selectedOptionTax,
        //                 entrynameOptions:  this.entryNameOptions,
        //                 companyId:this.companyId
        //             });
    
        //             // Optionally update your button label or form title for edit mode
        //             this.createEditExpense = 'Edit Purchase';
        //             this.buttonLabel = 'Update';
        //             this.expenseID = expenseID;  // Store the ID for future use
        //         } else {
        //             this.showToast('Error', 'No data found for the expense!', 'error');
        //         }
        //     })
        //     .catch(error => {
        //         this.showToast('Error', 'Error fetching expense data!', 'error');
        //         console.error('Error fetching expense data', error);
        //     });
         this.editflag = true;

          
       // this.currentInvoiceId = event.currentTarget.dataset.id;
       // console.log('currentInvoiceId: ' + this.currentInvoiceId);
        getAccountingPurchasesInEdit({ invoiceId: expenseID })
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
                    //this.selectedStatus = invoice.Status__c;
                   // this.comments = invoice.
                    this.subTotal = invoice.Sub_Total__c;
                    this.taxAmount = parseFloat(invoice.GST__c).toFixed(2);
                    this.totalAmount = parseFloat(invoice.Total_Amount__c).toFixed(2);
                    this.selectedEntityName = entries[0]?.Entity_Profile__c || '';
                // refreshApex(this.wiredEntityProfilesResult);
                    this.salesEntry = {
                        company: this.companyId || '',
                        entryType: 'Purchases',
                        entityName: this.selectedEntityName,
                        InvoiceDate: this.invoiceDate || '',
                        PostDate: this.postDate || '',
                        InvoiceNo: this.invoiceNo || '',
                        taxInclusive: this.taxInclusive,
                        //Status: this.selectedStatus || '',
                        invoiceId: invoice.Id
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
                        const taxRate = entry.Tax__c ? `${entry.Tax__c}%` : '0%'; // default to 0%
                        this.comments = entry.Comments__c || '';
                        const newRow = {
                            Id: entry.Id,
                            sno: entry.Sl_no__c,
                            Description__c: entry.Description__c || '',
                            accountList: ledgerItem.Account_Number__c && ledgerItem.Name
                                ? `${ledgerItem.Account_Number__c} - ${ledgerItem.Name}`
                                : '',
                            //Quantity__c: entry.Quantity__c || 0,
                            Amount__c: entry.Amount__c || 0,
                        // tax: entry.Tax__c ? `${entry.Tax__c}%` : '',
                            tax: taxRate,
                            accountItemId: entry.Accounting_Ledger_Items__c || '',
                            taxvalue: entry.Tax__c ? `${entry.Tax__c}%` : '0%',
                            calculatedAmount: entry.Unit_Price__c * entry.Quantity__c || 0, 
                            subTotal: parseFloat(entry.Total_Amount__c).toFixed(2) || 0,
                            taxAmount: parseFloat(entry.Tax_Amount__c).toFixed(2) || 0,
                            totalAmount: parseFloat(entry.Amount__c).toFixed(2) || 0,

                        };
                        this.salesEntryList.push(newRow);
                    });
                    console.log('Final salesEntryList:', JSON.stringify(this.salesEntryList));
                    this.amountarrey = {
                        subTotal: this.subTotal,
                        taxAmount: this.taxAmount,
                        totalAmount: this.totalAmount
                    };
                }
            })
            .catch(error => {
                console.error('Error fetching invoice details:', error);
            });

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
    //                 refreshApex(this.wireExpenseData); 
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
                    message: 'Invoice is deleted successfully',
                    variant: 'success'
                })
                );
                refreshApex(this.wireExpenseData);
            }); 
           // this.paginationHelper();    
            this.invoiceDeleteFlag=false;
        }
        handleDeleteclose(event){
            this.invoiceDeleteFlag=false;
        }
        childevent(event){
       
            const name = event.detail.message;
            console.log('CHILD MESSAGE'+name);
         
            switch (name) { 
                case 'Entities':
                    this.isNewEntityFlag = false;
                    this.selectedEntityName='';
                    this.selectedCardType = 'Supplier';
                    // this.isInvoiceflag = true;
                    // //this.salesClass = true;
                    // this.isTitleMenuFlag = false;
                    // this.isToggleVisible = false;
                    // this.isSalesFlag = true;
                    // this.isSalesTableFlag =false;
                    // // this.gstType = null;
                    // // this.selectedStatus = null;
                    this.isExpenses = false;
                    this.openExpenses = true;
                    this.createEditExpense='Create Purchases';
                    this.buttonLabel = 'Save';
                   
                   
                    refreshApex(this.wiredEntityProfilesResult);
                    break;
    
            
                default:
                 this.isHome=true;
                
            }  
        } 
    handleSupplierFocus() {
        this.showtable = true;
        //this.fetchLedgerItemsforExpenses();
        this.FilteredLedgerItems = [...this.ledgerItems];

    }

    handleSupplierBlur() {
        setTimeout(() => {
            this.showtable = false;
        }, 200);
    }

    handleSupplierSearch(event) {
         const recordId = event.currentTarget.dataset.id;   
        const inputValue = event.target.value;
        const searchLower = inputValue.toLowerCase();
        const rowId = event.target.dataset.id;
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

    @track invoiceEmailFlag = false;
    @track toAddress = '';
    @track ccAddress = '';
    @track invoiceIdforEmail;
    handleEmailAction(event) {
        const invoiceId = event.currentTarget.getAttribute('data-id');

        this.invoiceIdforEmail = invoiceId;
        console.log('Invoice ID:', invoiceId);
        this.invoiceEmailFlag = true;
        this.getEmail(this.invoiceIdforEmail);
    }
    getEmail(invoiceIdforEmail){
        console.log('invoiceId for email: '+invoiceIdforEmail);
        getentityEmailForInvoices({ invoiceId: invoiceIdforEmail }) // Pass your actual invoiceId
            .then(result => {
                //console.log('Invoice Data:', JSON.stringify(result));
                console.log('Fetched Email:', result);
            const entityEmail = result;
                this.toAddress = entityEmail;
            })
            .catch(error => {
                console.error('Error fetching entity email:', error);
            });
    }

    handleAddressChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;

        // Update the property based on field name
        if(fieldName === 'toAddress') {
            this.toAddress = fieldValue;
        } else if(fieldName === 'ccAddress') {
            this.ccAddress = fieldValue;
        }

        console.log(`${fieldName} changed to: ${fieldValue}`);
    }

    handleCloseModal(event){
        this.invoiceEmailFlag = false;
    }

    handleSendEmail(event){
        if (!this.toAddress) {
            // Show error message using alert or toast
            this.showToast('error', 'To Address is required', 'error');
            return;
        }
        sendEmail({
            invoiceid: this.invoiceIdforEmail,
            toAddress: this.toAddress,
            ccAddress: this.ccAddress
        })
        .then(() => {
            console.log('Email sent successfully');
            this.showToast('Success', 'Email sent successfully!', 'success');
            this.fromAddress = '';
            this.toAddress = '';
            this.ccAddress = '';
            this.invoiceEmailFlag = false;
        })
        .catch(error => {
            console.error('Error sending email:', error);
            this.showToast('Error', 'Error sending email: ' + error.body?.message || error.message, 'error');
        });

    }
    @track historyRowsAll = [];   
    handleHistoryClick(event) {
        console.log('this.expenseID : ' + this.expenseID);
        this.showHistoryTable = true;
       // this.showHistoryTable = !this.showHistoryTable;
          console.log('this.showHistoryTable : ' + this.showHistoryTable);
    
        getInvoiceHistoryDetails({ invoiceId: this.expenseID })
        .then((result) => {
            const invoiceHistory = result.invoiceHistory || [];
            const entryHistory = result.entryHistory || [];
    
            let combinedHistory = [];
            let sno = 1;
    
            const seenCommentsNotes = new Set();
            const seenFieldTimeValues = new Set();
    
            const isRecordId = (val) =>
                typeof val === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(val);
    
            const dateFields = new Set(['Invoice_Date__c', 'Due_Date__c', 'Post_Date__c']);
    
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
                if (field === 'Comments__c' ) seenCommentsNotes.add(field);
    
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
        this.isExpenses = false;
        this.openExpenses = true;
        this.disabledInvoiceNo = true;
        this.isShowActivity = true;
        this.createEditExpense='Edit Purchase';
        this.buttonLabel = 'Update';
        this.disabledSave = false;
       
    }
    
}