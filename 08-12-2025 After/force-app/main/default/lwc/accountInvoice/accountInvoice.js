import {LightningElement, wire, api, track } from 'lwc';
//import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
 import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import getAccountingInvoice from '@salesforce/apex/AccountingModuleController.getAccountingInvoice';
import getAccountingInvoiceById from '@salesforce/apex/InvoiceHandler.getAccountingInvoiceById';
import autoTable from '@salesforce/resourceUrl/autotable'
import robotoFont from '@salesforce/resourceUrl/Roboto';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getAccountingInvoiceInEdit from '@salesforce/apex/InvoiceHandler.getAccountingInvoiceInEdit';
//import UpdateDataFromInvoice from '@salesforce/apex/AccountingModuleController.UpdateDataFromInvoice';
//import deleteInvoiceLines from '@salesforce/apex/AccountingModuleController.deleteMatchingRecords';
import sendEmail from '@salesforce/apex/InvoiceHandler.sendEmailforInvoiceforSales';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import getentityEmailForInvoices from '@salesforce/apex/AccountingChartController.getentityEmailForInvoices';
import getInvoiceHistoryDetails from '@salesforce/apex/AccountingChartController.getInvoiceHistoryDetails';
//import getLedgerItemsPrioritizedIncome from '@salesforce/apex/AccountingChartController.getLedgerItemsPrioritizedIncome';
import saveUpdateRfqInvoice from '@salesforce/apex/AccountingChartController.saveUpdateRfqInvoice';
import deleteMatchingRecordsRfq from '@salesforce/apex/AccountingChartController.deleteMatchingRecordsRfq';
import getAllLedgerItems from '@salesforce/apex/AccountingChartController.getAllLedgerItems';
import getEmailBody from '@salesforce/apex/InvoiceHandler.getEmailBody';
import getAllSalesInvoice from '@salesforce/apex/AccountingModuleController.getAllSalesInvoice';
import getEmailBodyICT from '@salesforce/apex/InvoiceHandler.getEmailBodyICT';
import reverseInvoice from '@salesforce/apex/InvoiceHandler.reverseInvoice';

export default class AccountInvoice extends LightningElement {
     rewards = My_Resource + '/myResource/images/invoice.svg';
    @api orgid;
    @track salesEntryList = [];  
    @track showtableTax = false;  
    @track isInvoiceflag = false;
    @track isSalesTableFlag = true;
    @track isToggleVisible = true;
    @track isTitleMenuFlag = true;
    //@track invoiceflag=true;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track invoiceTable=[];
    @track orgname;
    @track edate;
    @track sdate;
    @track selectedCompany;
    wireInvoiceData;
    //wiredAllInvoiceData;
    @track invoiceDeleteFlag=false;
    parentInvId;
    @track invoiceID;
    @track base64string;
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
    @track entryType = 'Sales'; 
    @track selectedCardType='';
    wiredEntityProfilesResult;
    @track entryNameOptions=[];
    @track totalEntry = [];
    @track selectedEntityName='';
    @track taxInclusive=true;
    @track invoiceDate=null;
    @track postDate=null;
    @track dueDate = null;
    @track invoiceNo;
    @track comments;
    @track Status;
    @track accountNo;
    @track bsb;
    @track bank;
    @track accountName;
    @track invRecords=[];
    @track taxDropdownStyle;
    @track customerDropdownStyle = '';
    @track deletedRowIds = [];
    @track isSalesFlag=true;
    @track isPurchasesFlag=false;
    @track showSpinner = false;
    @track createEditInvoice='Create Sales';
    @track buttonLabel='Save'; 
    @track isRFQEnabled=false;
    @track isRFQ=false;
    @track filteredCompanyOptions = [];
    @track isAddEntityVisible = false;
    @track isNewEntityFlag = false;
    wiredEntityProfilesTax;
    @track paginationVisible=false;
    @track dateErrorMessageEnd;
     @track dateErrorMessageStart;
    accountList = '';
    customerShowTable = false;
    FilteredLedgerItems = [];
    customerSelectedAccountId = '';
    activeRowId = '';
    @track disabledInvoiceNo = true;
    @track selectedOptionTax1 ='';
    @track selectedOptionAL1 ='';
    @track disabledSave = false;
    @track selectedStatus = 'Draft';
    @track notes;
    @track statusOptions = []; 
    @track isShowActivity = false;
    @track historyRows = [];
    @track showHistoryTable = false;
    @track filteredTaxCodes = [];
    @track pageSizeOptionsHistory = [10, 25, 50, 75, 100]; //Page size options
    @track recordsHistory = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecordsHistory = 0; //Total no.of records
    @track pageSizeHistory; //No.of records to be displayed per page
    @track totalPagesHistory; //Total no.of pages
    @track pageNumberHistory = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track paginationVisibleHistory=false;
    @track entryId;
    @track globalSearchValue = '';
    @track records = [];       // full dataset from Apex
    @track invoiceTable = [];  // displayed filtered dataset
    @track filteredRecords = [];
    @track emailSentConfirmation=false;
    @track statusReverseFlag=false;
    @track isParticipantInvoice=false;
    activeRowIdB =null; //Shortcut Keys related
    //@track activityToggleLabel = '';
    @track entryOptions=[{label:'Purchases',value:'Purchases'},{label:'Sales',value:'Sales'}];
    @track entityOptions= [{label:'Customer',value:'Customer'}];
    @track selectedCardType = 'Customer';
    @track gstOptions=[{label:'Yes',value:'Yes'},{label:'No',value:'No'}];
    @track allStatusOptions =[{label:'Draft',value:'Draft'},{label:'Issued',value:'Issued'}];    //   ,{label:'Reversed',value:'Reversed'},{label:'Received',value:'Received'}
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
    @track currentUrl;
    @track isModalOpen = false;
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
            console.log('Company from localStorage connectedCallback AccountInvoice:', this.companyId, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback AccountInvoice');
        }        
        console.log('companyId in connectedCallback AccountInvoice: ', this.companyId);
        console.log(' companyname in connectedCallback AccountInvoice: ', this.companyname);
        this.addRow();
        this.entryType = 'Sales';
       /*  var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.edate = last.toISOString().slice(0, 10); */
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 90);
        this.sdate = pastDate.toISOString().slice(0, 10);  
        this.edate = today.toISOString().slice(0, 10);
        this.handleInvoiceData();
        //this.invoiceflag=true;
       // refreshApex(this.wireInvoiceData);
       // this.readInvoiceDetails();
       //console.log('invoiceData in connectedCallback :', JSON.stringify(this.invoiceData));
        this.isRFQEnabled=false; 
        this.isRFQ=false; 
       // document.addEventListener('click', this.handleOutsideClick);
        window.addEventListener('click', this.handleOutsideClick);
      // console.log('selectedCardType in connectedCallback : '+ this.selectedCardType); 

         this.handleShortcut = this.handleShortcut.bind(this);
         window.addEventListener("keydown", this.handleShortcut);

      
    }

    disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
          window.removeEventListener('keydown', this.handleShortcut);
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
                this.customerShowTable = false;
                this.listenForOutsideClick = false;
            }
        }
    };
    @track salesEntry = {
        company: this.companyId,
        entryType: 'Sales',
        entityName: '',
        InvoiceDate: '',
        PostDate: '',
        dueDate: '',
        InvoiceNo: '',
        taxInclusive: true,
        Status: '',
        comments: '',
        notes: ''
    };
     get activityToggleLabel() {
        return this.showHistoryTable ? 'Hide Activity' : 'Show Activity';
    }
    renderedCallback() {
        if (this.jsPDFInitialized) {
         return; // Prevent reloading scripts multiple times
     } 
       Promise.all([
         // loadScript(this, Dompurify),
         
           loadScript(this, jsPDF),
          loadScript(this, autoTable),
          //this line of code is for using custom font in jspdf because jspdf supports only few fonts like courier,times-roman and helvitica.
          //to use custom font we have downloaded the font from google which is .ttf converted ttf to js and upload in static resource.
          loadScript(this, robotoFont)
         
           ]).then(() => {   
              //this.jsPDFInitialized = true;
             console.log('✅ jsPDF and ROBOTO font loaded');
  
             // ✅ Register the Roboto font manually
             if (window.jspdf && window.callAddFont) {
                 window.jspdf.jsPDF.API.events.push(['addFonts', window.callAddFont]);
                 console.log('✅ Roboto font registered via callAddFont');
             } else {
                 console.warn('⚠️ callAddFont or jsPDF not available in window scope');
             }
  
             // Verify if font is registered
             const { jsPDF } = window.jspdf;
             const doc = new jsPDF();
             console.log('🧾 Available fonts:', doc.getFontList());  
            // console.log("JS loaded jsPDF");
           }).catch(error => {
            // console.error("Error " + error);
           });;
   }
    @track amountarrey = [];
   
    @wire(getEntityProfiles, {companyId: '$companyId' , entryType:'$entryType' })
    wiredEntityProfiles(result) {
        this.wiredEntityProfilesResult = result; // Store response for refreshApex
        const { data, error } = result;
        console.log('Filtered entity options result: ', JSON.stringify(result));
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

                const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
                const amount = parseFloat(updatedRecord.Amount__c) || 0;
                updatedRecord.calculatedAmount = parseFloat((quantity * amount).toFixed(2));
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
    get salesClass(){
        return this.isSalesFlag  ? 'menu-item1' : 'menu-item'; 
    }
    get purchasesClass(){
      return this.isPurchasesFlag  ? 'menu-item1' : 'menu-item'; 
    }
    handleSales(){
        this.isSalesFlag=true;
        this.isPurchasesFlag=false;
        //this.isHome = false;
        this.isRFQEnabled=false; 
        this.isHome = true;
        this.isTitleMenuFlag = true;
        //this.isSalesFlag = false;
        this.isSalesTableFlag = true;
        this.isToggleVisible = true;
    }

//     connectedCallback() {
//     this._keyHandler = this.handleKeyPress.bind(this);
//     window.addEventListener('keydown', this._keyHandler);
// }

// disconnectedCallback() {
//     window.removeEventListener('keydown', this._keyHandler);
// }

// handleKeyPress(event) {
//     // ALT + E
//     if (event.altKey && event.key.toLowerCase() === 'e') {
//         event.preventDefault();
//         this.handleSales();  // or any function you want to call
//     }
// }


    handlePurchases(){
        this.isSalesFlag=false;
        this.isPurchasesFlag=true;
        this.isInvoiceflag = false;
        //this.isHome = false;
        this.isRFQEnabled=false; 
        this.isHome = true;
        this.isTitleMenuFlag = true;
        this.isToggleVisible = false;
        this.isPurchasesFlag = true;
    } 
    createRow() {
        const newRow = {
            Id: Date.now(),
            sno: this.salesEntryList.length + 1,
            Description__c: '',
            accountList: this.selectedOptionAL1,
            accountItemId: this.selectedOptionALId,
            Quantity__c: 0,
            UnitPrice__c: 0,
            Amount__c: 0,
            tax: this.selectedOptionTax1
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
        
    handleInvoiceData() {
        // console.log('calling response raja');
         organizationDetails().then(response => {
            // console.log('calling response raja', JSON.stringify(response));
             this.invoiceData = response.listofPriceBook;
             this.bank = response.listofPriceBook.Bank__c;
             this.accountNo = response.listofPriceBook.Account_Number__c;
             this.accountName = response.listofPriceBook.Account_Name__c;
             this.bsb = response.listofPriceBook.BSB__c;
             this.orgname = response.listofPriceBook.Name;
            this.abn = response.listofPriceBook.ABN__c;
             /* this.desc = response.listofPriceBook.Description__c; */   
         });
     }

    handleDeleteRow(event) {
        console.log('handleDeleteRow');
        if (this.salesEntryList.length === 1) {
            this.showToast('Error', 'At least one row is required. ', 'error');
            return;
        }
       // const rowId = event.currentTarget.dataset.id;  // Keep as string
        const rowId = event.target?.dataset?.id || event.target.closest('[data-id]')?.dataset?.id;
        this.salesEntryList = this.salesEntryList.filter(row => String(row.Id) !== rowId);
        this.selectedRowId = null;
        if( this.createEditInvoice=='Edit Sales' ||this.buttonLabel =='Update'){
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
            const quantity = parseFloat(entry.Quantity__c) || 0;
            const unitPrice = parseFloat(entry.Amount__c) || 0;
            const rawAmount = parseFloat((quantity * unitPrice).toFixed(2));
            
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

        console.log('✅ Totals recalculated in recalculateTotals:', JSON.stringify(this.amountarrey));
        console.log('📦 Updated salesEntryList IN recalculateTotals:', JSON.stringify(this.salesEntryList));
    }

    fetchLedgerItems() {
        console.log('Calling Apex Method: getLedgerItems...');
        console.log('companyId in fetchLedgerItems: ' + this.companyId);

        // Call the Apex method and pass companyId as parameter
        getAllLedgerItems({ companyId: this.companyId })
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

     handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const fieldChecked = event.target.checked;

        const isToggle = event.target.type === 'toggle';
        const valueToSet = isToggle ? fieldChecked : fieldValue;

        // Update salesEntry correctly
        this.salesEntry = {
            ...this.salesEntry,
            [fieldName]: valueToSet
        };

        //this.salesEntry = { ...this.salesEntry, [fieldName]: fieldValue };
        console.log(`Updated Field - ${fieldName}:`, fieldValue);
        console.log('this.salesEntry===>'+JSON.stringify(this.salesEntry));
      
         switch (fieldName) {
           
            case 'entityName':
                this.selectedEntityName = fieldValue;
                console.log('this.selectedEntityName in onchange: ' + this.selectedEntityName);
                this.fetchEntityProfileTax(this.selectedEntityName);

                if (this.selectedEntityName === 'Add New Entity') {
                    console.log('isNewEntityFlag in if: ' + this.isNewEntityFlag);
                    this.isNewEntityFlag = true;
                    console.log('isNewEntityFlag AFTER: ' + this.isNewEntityFlag);
                    this.isSalesFlag = false;
                    this.isPurchasesFlag = false;
                    this.isInvoiceflag = false;
                    this.isHome = false;
                    this.isTitleMenuFlag = false;
                    this.isSalesTableFlag = false;
                    this.isToggleVisible = false;
                }
                break;
            case 'InvoiceDate':
                 this.invoiceDate = fieldValue;
                this.salesEntry.InvoiceDate = fieldValue;

                if (!this.salesEntry.PostDate) {
                    this.salesEntry.PostDate = fieldValue;
                    this.postDate = fieldValue;
                    console.log('Auto-set PostDate:', fieldValue);
                }
                break;
    
            case 'PostDate':
                this.postDate = fieldValue;
                this.salesEntry.PostDate = fieldValue;
                console.log('Post Date:', this.postDate);
                break;
            case 'DueDate':
                this.dueDate = fieldValue;
                this.salesEntry.dueDate = fieldValue;
                console.log('dueDate :', this.dueDate);
                break;
    
            case 'Status':
                this.selectedStatus = fieldValue;
                console.log('this.selectedStatus in onchange: ' + this.selectedStatus);
                // if(this.selectedStatus =='Issued' || this.selectedStatus =='Received'){
                if(this.selectedStatus =='Issued'){
                    this.disabledSave = true;
                 } else {
                     this.disabledSave = false;
                 }
                break;

          case 'taxInclusive':
                this.taxInclusive = fieldChecked;
                console.log('Tax Inclusive:', this.taxInclusive);

                let totalSubTotal = 0;
                let totalTaxAmount = 0;
                let totalAmount = 0;

                let taxValue = '';
                
                // ✅ Now recalculate financials for each row
                this.salesEntryList = this.salesEntryList.map(entry => {
                    const updatedEntry = { ...entry };

                    const quantity = parseFloat(updatedEntry.Quantity__c) || 0;
                    const amount = parseFloat(updatedEntry.Amount__c) || 0;
                    updatedEntry.calculatedAmount = parseFloat((quantity * amount).toFixed(2));
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
            case 'comments':
                this.comments = fieldValue;
                console.log('comments:', this.comments);
                    break;
            case 'notes':
                this.notes = fieldValue;
                console.log('notes:', this.notes);
                    break;

            default:
                console.warn(`Unhandled field name: ${fieldName}`);
                break;
        }
       
    }    

    
clean(value) {
    return (value || '')
        .toString()
        .replace(/\$/g, '')   // remove $
        .replace(/,/g, '')    // remove commas
        .toLowerCase();
        }

    handleGlobalSearch(event) {
        const searchValue = (event.target.value || '').trim().toLowerCase();
        this.globalSearchValue = searchValue;

        const searchKey = this.clean(searchValue);   // NEW

        // Always start from the full dataset
        let result = [...this.records];

        // Apply only if something is typed
        if (searchValue) {
            result = result.filter((rec) => {
                const invoiceId = rec.Name ? rec.Name.toLowerCase() : '';
                const description = rec.description ? rec.description.toLowerCase() : '';
                const entityName = rec.companyName ? rec.companyName.toLowerCase() : '';
                const ledgerItem = rec.ledgerItem ? rec.ledgerItem.toLowerCase() : '';
                //const gst = rec.GST__c ? rec.GST__c.toString().toLowerCase() : '';
               // const amount = rec.Total_Amount__c ? rec.Total_Amount__c.toString().toLowerCase() : '';
                const gst = this.clean(rec.GST__c);
                const amount = this.clean(rec.Total_Amount__c);
                const status = rec.Status__c ? rec.Status__c.toLowerCase() : '';
                const invoiceType = rec.invoiceType ? rec.invoiceType.toLowerCase() : '';
                const dateGenerated = rec.invoiceDate ? rec.invoiceDate.toLowerCase() : '';

                // Return true if any field contains the search value
                return (
                    invoiceId.includes(searchValue) ||
                    description.includes(searchValue) ||
                    entityName.includes(searchValue) ||
                    ledgerItem.includes(searchValue) ||
                    gst.includes(searchKey) ||
                    amount.includes(searchKey) ||
                    status.includes(searchValue) ||
                    invoiceType.includes(searchValue) ||
                    dateGenerated.includes(searchValue)
                );
            });
        }

        // Update filtered and paged data
        this.filteredRecords = [...result];
        this.totalRecords = this.filteredRecords.length;
        this.pageNumber = 1;

        // 🧩 Directly update visible table data
        const startIdx = 0;
        const endIdx = this.pageSize;
        this.invoiceTable = this.filteredRecords.slice(startIdx, endIdx);

        // Show/hide pagination
        this.paginationVisible = this.totalRecords > this.pageSize;
    }

    paginationHelper() {
        // Always reference filteredRecords (even if empty)
        const dataList = Array.isArray(this.filteredRecords)
            ? this.filteredRecords
            : [];

        // Update visibility & total count
        this.totalRecords = dataList.length;
        this.paginationVisible = this.totalRecords > 0;

        // Calculate total pages safely
        this.totalPages =
            this.pageSize > 0 ? Math.ceil(this.totalRecords / this.pageSize) : 1;

        // Keep page number within valid range
        if (this.pageNumber < 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber > this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        // Slice data for current page
        const startIdx = (this.pageNumber - 1) * this.pageSize;
        const endIdx = this.pageNumber * this.pageSize;
        const pageData = dataList.slice(startIdx, endIdx);

        // Update the table
        this.invoiceTable = [...pageData];

        // 🧠 Debug (optional)
        // console.log('paginationHelper: totalRecords=', this.totalRecords, 
        //             'pageNumber=', this.pageNumber,
        //             'records shown=', this.invoiceTable.map(r => r.Name));
    }

    handleSelectionTax(event) {
        console.log('📦 Updated Sales Entry List in tax before :', JSON.stringify(this.salesEntryList));
        const recordId = event.currentTarget.dataset.id;
        const code = event.currentTarget.dataset.code;
        const rate = event.currentTarget.dataset.rate;

        console.log('🔹 Record ID in Tax:', recordId);
        console.log('🔹 Selected Tax Code:', code);
        console.log('🔹 Tax Rate (%):', rate);
        console.log('🔹 Tax Inclusive?', this.taxInclusive);
        console.log('📦 Updated Sales Entry List in tax  :', JSON.stringify(this.salesEntryList));

        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;

        this.salesEntryList = this.salesEntryList.map(sales => {
            let updatedRecord = { ...sales };

            if (String(sales.Id) === this.selectedRowId) {
                updatedRecord.tax = `${rate}`;
                updatedRecord.taxvalue = rate;

                updatedRecord.subTotal = 0;
                updatedRecord.taxAmount = 0;
                updatedRecord.totalAmount = 0;

                    //console.log('✅ [TAX INCLUSIVE]');
                    console.log('➡️ Sub Total before in tax:', updatedRecord.subTotal);
                    console.log('➡️ Tax Amount before in tax:', updatedRecord.taxAmount);
                    console.log('➡️ Total Amount before in tax:', updatedRecord.totalAmount);

                const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
                const unitPrice = parseFloat(updatedRecord.Amount__c) || 0;
                const rawAmount = parseFloat((quantity * unitPrice).toFixed(2));
                const taxRateDecimal = parseFloat(rate) / 100;

                updatedRecord.calculatedAmount = rawAmount;

                console.log('🧮 Quantity:', quantity);
                console.log('🧮 Unit Price:', unitPrice);
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

                console.log('🔄 Updated Record in tax:', JSON.stringify(updatedRecord));
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

        console.log('📊 Updated Amount Array  in Tax:', JSON.stringify(this.amountarrey));
        console.log('📦 Updated Sales Entry List in Tax after:', JSON.stringify(this.salesEntryList));
        console.log('🧾 Totals → SubTotal  in Tax:', this.subTotal, ', TaxAmount:', this.taxAmount, ', TotalAmount:', this.totalAmount);
    }
 
    stopPropagation(event) {
        event.stopPropagation();
    }              
    
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
                if (fieldName === 'Quantity__c' || fieldName === 'Amount__c') {
                    updatedRecord[fieldName] = parseFloat(fieldValue) || 0;
                } else {
                    updatedRecord[fieldName] = fieldValue;
                }
            }

            // 🔢 Extract quantity and amount
            const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
            const amount = parseFloat(updatedRecord.Amount__c) || 0;
            const rawAmount = parseFloat((quantity * amount).toFixed(2));

            updatedRecord.calculatedAmount = rawAmount;

            if (this.entryType === 'Sales') {
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
        console.log('📋 Updated Sales Entry List in input change:', JSON.stringify(this.salesEntryList));
    }
    //@track notesPdf;
    generateBase64Data() { 
    console.log('jspdfentered');
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        const invoice = this.invRecords[0];
            console.log('INVOICE RECORDS '+JSON.stringify(invoice));
        //this.notesPdf = invoice.Accounting_Journal_Entry__r[0].Comments__c;
       // console.log('this.notes in pdf :', invoice.Accounting_Journal_Entry__r[0].Comments__c);
        //var statePostalWithoutCommas = this.invRecords[0].Company__r.Address__c.replace(/,/g, " "); 
        
    // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );
    
        doc.setFont("Roboto-Bold", "bold");
        //doc.setFontSize(20);
        //doc.text("DRAFT INVOICE", 20,25 );
        doc.setTextColor(0,102,255);
        doc.setFontSize(12);
        // doc.text(invoice.Company__r.Company_Name__c.toUpperCase(), 10, 25);  
        doc.text(this.orgname.toUpperCase(), 10, 25);  
        //console.log('orgname '+this.orgname);     
    console.log('616');

        doc.setTextColor(0,0,0);
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(12);
        doc.text("ABN: "+ (invoice.Company__r.ABN__c || ""), 10, 30);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    
        
        doc.setFontSize(10);
        doc.text(invoice.Company__r.Address_Latest__Street__s+",", 10,35 );
        doc.text(`${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`, 10, 40);
        doc.text("Contact: "+invoice.Company__r.Phone_Number__c, 10, 45);
    
        // top  left side box start  
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(12);
    // doc.text("Invoice Number", 150, 24);
        doc.text("TAX  INVOICE", 160, 25);
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(12);
        doc.text(invoice.Invoice_No__c, 160, 30);

    
        const oldDate = invoice.Invoice_Date__c;
        const arr = oldDate.split('-');
        const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];       
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setFontSize(10);
        doc.text("Date Issued: "+newDate, 160, 35);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setFontSize(10);

        const dueDate = invoice.Due_Date__c;
        const arr1 = dueDate.split('-');
        const newDate1 = arr1[2]+'/'+arr1[1]+'/'+arr1[0];       
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setFontSize(10);
        doc.text("Due Date: "+newDate1, 160, 40);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setFontSize(10);
        
        // doc.text("TAX INVOICE To: " , 10, 72);  
        /* doc.text("TAX INVOICE To: "+invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.First_Name__c+" "+invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.Last_Name__c, 10, 72); */                 
       doc.text("TAX INVOICE To: " + (invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.Name__c ? invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.Name__c 
       : invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.First_Name__c + " " + invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.Last_Name__c ), 10, 72);

        function addFooter(doc) {
        let pageHeight = doc.internal.pageSize.height; // Get page height
        let footerY = pageHeight; // Footer position
    
        // Draw footer line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(0, footerY - 12, 210, footerY - 12);
    
        // Footer text
        doc.setFontSize(10);
        const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
        const img = new Image();
        img.src = logo;
        
        doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); 
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("Powered by", 10, footerY-5);
        
        // Centered Footer Text
        doc.setFontSize(10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("Office Use Only", 90, footerY-5);
    
        // Page Number
        doc.setFontSize(10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(`${doc.internal.getNumberOfPages()}`, 200, footerY-5);
    }
        
        
        let yPosition = 82; 
        var result = [];
        var subTotal = 0;
        
        let tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
        console.log('INVOICE'+JSON.stringify(tabledata));
        tabledata.forEach(record => {
           // subTotal += record.Total_Amount__c;
            console.log('Total_Amount__c: ',record.Total_Amount__c );
           // subTotal += record.Total_Amount__c;
            //console.log('subTotal  with added Total_Amount__c : ',subTotal );
        
            result.push([
                record.Description__c,
                record.Quantity__c.toFixed(2),
                record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                record.Tax__c+'%',// Tax column
                record.Total_Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                record.Sub_Total__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            ]);
        });
        
        
        // Adding subtotal, GST, and total rows
       // result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' +  parseFloat(subTotal).toFixed(2)]);
          const taxNote = this.taxInclusive ? "*Taxes are Inclusive" : "*Taxes are Exclusive";
          result.push([{ content: taxNote, styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' +  parseFloat(invoice.Sub_Total__c).toFixed(2)]);
       // result.push(["", "", "", "Total GST:", '$' + invoice.GST__c.toFixed(2)]);
       result.push(["", "", "", "Total GST:", '$' + parseFloat(invoice.GST__c).toFixed(2)]);
        // result.push(["", "", "", "Total:", '$' + invoice.Total_Amount__c.toFixed(2)]);
          result.push(["", "", "", "Total:", '$' + parseFloat(invoice.Total_Amount__c).toFixed(2)]);
        
    console.log('RESULT'+JSON.stringify(result));
        // Generating table using autoTable
        doc.autoTable({
            startY: yPosition, // Starting Y position
            head: [["Description", "Qty", "Rate", "Tax", "Amount"]],
            body: result,
            theme: "plain",
            /* styles: { halign: "left" }, */
            margin: { left: 10 },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
            bodyStyles: { font: "Helvetica", font: "Roboto-VariableFont_wdth,wght", fontStyle: "normal", },
            /* bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] }, */
            columnStyles: {
            0: { cellWidth: 80, halign: "left" },  // Description left-aligned
            1: { cellWidth: 25, halign: "left" },  // Qty left-aligned
            2: { cellWidth: 25, halign: "left" },  // Rate left-aligned
            3: { cellWidth: 25, halign: "right" }, // Tax right-aligned
            4: { cellWidth: 35, halign: "right" }  // Amount right-aligned
            },
            didParseCell: function (data) {
            var columnText = data.row.raw[3]; // Get column text
            if (data.row.index === 0) { 
                if (data.column.index === 3 || data.column.index === 4) {
                    data.cell.styles.halign = "right";
                } else {
                    data.cell.styles.halign = "left";
                }
            }
            // Make Sub Total, Total GST, and Total bold
            if ([ "Total:"].includes(columnText)) {
            data.cell.styles.font = "Roboto-Bold"; 
            data.cell.styles.fontStyle = "bold";
            }
        },
            didDrawCell: function (data) {  
            var doc = data.doc;
            var cell = data.cell;
            var rowIndex = data.row.index;
            var totalRowsCount = result.length; // Total rows including subtotal, GST, and total
            
            // Get the text of the fourth column (index 3) to check row type
            var columnText = data.row.raw[3]; 
    
            // Apply border only to normal rows & total row
            if (!["Sub Total:", "Total GST:"].includes(columnText)) {
                doc.setDrawColor(0, 0, 0); // Black border
                doc.setLineWidth(0.2);
    
                // Top border (for first row or total row)
                if (rowIndex === 0) { 
                    doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
                }
    
                // Bottom border (for normal rows and total row)
                if (rowIndex < totalRowsCount - 1 ) {
                    doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
                }
                
            }
            if (columnText === "Total:") {
                doc.setDrawColor(0, 0, 0); // Black border
                doc.setLineWidth(0.2);
                
                if (data.column.index === 4 || data.column.index === 3 ) {
                
                // Top border
                doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
    
                // Bottom border
                doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
            }        
            }
        },
        didDrawPage: function (data) {
            
            // Always add the footer on each page
            addFooter(data.doc);
        }
        });
    
        let finalYPosition = doc.lastAutoTable.finalY;
    // addFooter(doc);

    
    
        let availableSpace = doc.internal.pageSize.height-finalYPosition;
        console.log('available Space ' +availableSpace);
        
        if(availableSpace >100){
            // Adding payment details at the bottom
            yPosition=finalYPosition + 35;
            doc.setFontSize(10);

            doc.setFont("Roboto-Bold", "bold");
            doc.text("Notes : ", 10, yPosition );
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            
            const labelWidth = doc.getTextWidth("Notes : "); // get width to align text next to it
            const noteText = invoice.Accounting_Journal_Entry__r[0].Notes__c || '';
            const wrappedNotes = doc.splitTextToSize(noteText, 180 - labelWidth); // wrap based on remaining width
            doc.text(wrappedNotes, 10 + labelWidth, yPosition); // text starts immediately after "Notes :"
            //doc.text( invoice.Accounting_Journal_Entry__r.Notes__c || " ", 20, yPosition);

            doc.setDrawColor(0, 0, 0); // Black color
            doc.setLineWidth(0.5);
            doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
            doc.line(10, yPosition + 6, 200, yPosition + 6); // (startX, startY, endX, endY)
            doc.setLineDash();
            
            doc.setFontSize(10);
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Payable to:", 10, yPosition + 12);
            
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Bank", 10, yPosition + 18);
            doc.text(":", 40, yPosition + 18);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.bank || " ", 42, yPosition + 18);

            doc.setFont("Roboto-Bold", "bold");
            doc.text("Account Name", 10, yPosition + 22); 
            doc.text(":", 40, yPosition + 22);       
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.accountName || " ", 42, yPosition + 22);

            doc.setFont("Roboto-Bold", "bold");
            doc.text("BSB", 10, yPosition + 26); 
            doc.text(":", 40, yPosition + 26);       
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.bsb || " ", 42, yPosition + 26);

            doc.setFont("Roboto-Bold", "bold");
            doc.text("Account Number", 10, yPosition + 30);
            doc.text(":", 40, yPosition + 30);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.accountNo || " ", 42, yPosition + 30);

            doc.setFontSize(10);
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Terms & Conditions:", 10, yPosition + 50);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setTextColor(169, 169, 169);
            doc.text("All terms and conditions apply.", 10, yPosition + 54);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            addFooter(doc);

        }else{
            doc.addPage();

            yPosition = 25;
            doc.setFontSize(10);
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Notes :", 10, yPosition );
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            const labelWidth1 = doc.getTextWidth("Notes : "); // get width to align text next to it
            const noteText1 = invoice.Accounting_Journal_Entry__r[0].Notes__c || '';
            const wrappedNotes1 = doc.splitTextToSize(noteText1, 180 - labelWidth1); // wrap based on remaining width
            doc.text(wrappedNotes1, 10 + labelWidth1, yPosition); // text starts immediately after "Notes :"


            doc.setDrawColor(0, 0, 0); // Black color
            doc.setLineWidth(0.5);
            doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
            doc.line(10, yPosition + 6, 200, yPosition + 6); // (startX, startY, endX, endY)
            doc.setLineDash();
            
            doc.setFontSize(10);
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Payable to:", 10, yPosition + 12);
            
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Bank", 10, yPosition + 18);
            doc.text(":", 40, yPosition + 18);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.bank || " ", 42, yPosition + 18);

            doc.setFont("Roboto-Bold", "bold");
            doc.text("Account Name:", 10, yPosition + 22); 
            doc.text(":", 40, yPosition + 22);       
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.accountName || " ", 42, yPosition + 22);

            doc.setFont("Roboto-Bold", "bold");
            doc.text("BSB:", 10, yPosition + 26); 
            doc.text(":", 40, yPosition + 26);       
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.bsb || " ", 42, yPosition + 26);

            doc.setFont("Roboto-Bold", "bold");
            doc.text("Account Number:", 10, yPosition + 30);
            doc.text(":", 40, yPosition + 30);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(this.accountNo || " ", 42, yPosition + 30);

            doc.setFontSize(10);
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Terms & Conditions:", 10, yPosition + 50);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setTextColor(169, 169, 169);
            doc.text("All terms and conditions apply.", 10, yPosition + 54);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

            addFooter(doc);
        }
        
        this.base64string = btoa(doc.output());
        
        
    console.log('Generated PDF Base64: ' + this.base64string);
    console.log('Generated PDF Name: ' + this.invRecords[0].Name);
        console.log('Generated recordId: ' + this.invRecords[0].Id);
        // const filename = `${this.invRecords[0].Name}.pdf`;
        // console.log('Using filename:', filename);

    uploadFile({base64:JSON.stringify( this.base64string), filename:this.invRecords[0].Invoice_No__c+'.pdf', recordId:this.invRecords[0].Id,obj:'AccountingInvoice'})
    .then(result=>{
         console.log('data in uploadFile', result);                    
        //this.handleInvoicFlag();
        // console.log('Upload result = ' +result);
    //   this.fileName = this.invRecords[0].Name + ' - Uploaded Successfully';
        setTimeout(() => {  
            //console.log('Generated recordId inside upload: ' + this.invRecords[0].Id);
                getAccountingInvoiceById({ invoiceId: this.invRecords[0].Id }).then(response => {
                 console.log(' response in upload:', JSON.stringify(response));
                  if (response && response.length > 0) {
                        this.urlforEmail = response[0].Amazon_URL__c;
                       // console.log('this.urlforEmail in Upload = ' + this.urlforEmail);
                  }
            });
        }, 500); 
    setTimeout(() => {
        refreshApex(this.wireInvoiceData);
        // refreshApex(this.wiredAllInvoiceData);
        // console.log('start date in save : ',this.sdate);
        // console.log('end date in save : ',this.edate);
        // console.log('invoiceData in handleYesDelete:', JSON.stringify(this.invoiceData)); 
    }, 2000);
    })            
    const evt = new ShowToastEvent({
        title: 'Success',
        message: 'Invoice Generated sucessfully '+this.invRecords[0].Invoice_No__c,
        variant: 'success',
        mode: 'dismissable'
    });
    // doc.save('Invoice.pdf');
    //  console.log('isSalesFlag  in pdf: ', this.isSalesFlag); 
    //  console.log('isRFQEnabled in pdf : ', this.isRFQEnabled); 
    //  console.log('isInvoiceflag in pdf : ', this.isInvoiceflag); 
    //console.log('invoiceflag in pdf : ', this.invoiceflag); 
        //return this.base64string;
    }
    handleClear(){
        //console.log('console in clear');
        this.isInvoiceflag = false;
        this.isSalesFlag = true;
        this.isSalesTableFlag = true;
        this.isTitleMenuFlag = true;
        this.isToggleVisible = true;
        this.isRFQEnabled=false;
        this.selectedCardType = '';
        this.selectedEntityName = null;
        this.invoiceNo = '';
        this.comments = '';
        this.notes = '';
        this.selectedStatus = null;
        this.salesEntryList = [];  
    //this.showtable = false; 
    this.customerShowTable = false; 
    this.isShowActivity = false;  
    this.showHistoryTable = false; 
    this.showtableTax = false;  
    this.ledgerItems = []; 
    this.deletedRowIds = [];    
    this.selectedRowId = null;        
    this.popoverStyle = {};
    this.subTotal = 0;
    this.taxAmount = 0;
    this.totalAmount = 0;   
    this.selectedDescription = null;
    this.selectedAmount = null;
    this.selectedItem = null; 
    this.entryType = 'Sales'; 
    //this.taxInclusive = false;
    this.invoiceDate = null;
    this.dueDate = null;
    this.postDate = null;
    this.Status = null;
    this.taxDropdownStyle = '';
    this.customerDropdownStyle= '';
    this.statusOptions = [...this.allStatusOptions];
    //refreshApex(this.wiredCompanyList);
    this.salesEntry = {
        company: this.companyId,
        entryType: 'Sales',
        entityName: '',
        InvoiceDate: '',
        PostDate: '',
        dueDate: '',
        InvoiceNo: '',
        taxInclusive:false,
        Status: '',
        comments: '',
        notes: '',
        invoiceId:null
    };
        console.log('Description in clear:', this.selectedDescription);
        console.log(' this.selectedAmount in clear:',  this.selectedAmount);
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
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

    toggleDropdownTax(event) {
        this.resetAllDropdowns(); 
        this.selectedRowId=event.currentTarget.dataset.id;
       
        console.log('selectedRowId'+this.selectedRowId);
        this.customerShowTable=false;
        this.showtableTax = !this.showtableTax;
        // if(!this.taxInclusive){
        //       this.showtableTax  = false;
        //   } 
    
        /* const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
    
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X */

       /*  const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
      
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04)-38; // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.165)-35; // subtract 10% from X
        console.log('top==>'+ top + 'left===>'+left); */

        const inputE2 = event.target;
        const rect = inputE2.getBoundingClientRect();
    
        this.taxDropdownStyle = `
            position: fixed;
            top: ${rect.bottom + 4}px;
            left: ${rect.left}px;
            width: 16%;
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

    handleInvoicFlag() {
        this.selectedCardType = 'Customer';
        this.isInvoiceflag = true;
        this.editflag =false;
        //this.salesClass = true;
        this.isTitleMenuFlag = false;
        this.isToggleVisible = false;
        this.isSalesFlag = false;
        this.isSalesTableFlag =false;
        this.statusOptions = [...this.allStatusOptions]; 
        this.selectedStatus ='Draft';
        this.disabledInvoiceNo = true;
        this.isShowActivity = false; 
        this.taxInclusive = true; 
        this.showHistoryTable = false;
        // if(this.selectedStatus =='Issued' || this.selectedStatus =='Received'){
         if(this.selectedStatus =='Issued'){
            this.disabledSave = true;
        } else {
            this.disabledSave = false;
        }
        this.salesEntry = {
            company: this.companyId,
            entryType: 'Sales',
            entityName: '',
            InvoiceDate: '',
            PostDate: '',
            dueDate: '',
            InvoiceNo: '',
            taxInclusive:true,
            Status: 'Draft',
            comments: '',
             notes: '',
            invoiceId:null
        };
       
        
        // this.gstType = null;
        // this.selectedStatus = null;
        this.createEditInvoice='Create Sales';
        this.buttonLabel = 'Save';
        if( this.salesEntryList.length === 0) {

        this.addRow();
        }
        console.log(' Entity name  options in create: ', JSON.stringify( this.entryNameOptions));
        // if(this.entryNameOptions.length === 0){
        //     this.isAddEntityVisible = true;
        // }
        if (this.salesEntryList.length > 0) {
            this.salesEntryList = this.salesEntryList.map(entry => {
                return {
                    ...entry,
                   //Id: Date.now(),
                    //sno: this.salesEntryList.length + 1,
                    Description__c: '',
                    accountList: '',
                    accountItemId: '',
                    Quantity__c: 0,
                    UnitPrice__c: 0,
                    Amount__c: 0,
                    tax: ''
                };
            });
        }
    
         console.log('selectedStatus in create:', this.selectedStatus);
         console.log(' salesEntry in create: ', JSON.stringify( this.salesEntry));
    }
    
    get isDesktop() {        
        return FORM_FACTOR === 'Large';
    }
    
    get isMobile() {       
        return FORM_FACTOR === 'Small';
    }
    handleChangeCompany(event){
        this.selectedCompany=event.target.value;
        console.log('Select Company===>'+event.target.value);
        console.log('Select Company===>'+this.selectedCompany);
       // refreshApex(this.wiredAccountList); 
      
    }
    
    hadleDates(event) {
        var fieldName = event.target.name;
        var fieldValue = event.target.value;
        if (fieldName == 'sdate') {
            this.sdate = fieldValue;
            
        }
        if (fieldName == 'edate') {
            this.edate = fieldValue;
        }
    }
    @wire(getAccountingInvoice, { sDate: '$sdate', eDate: '$edate', companyId: '$companyId' ,  isRFQ: '$isRFQ'})
    wiredInvoiceData(result) {
        console.log('selectedCompany in getAccountingInvoice before:', this.companyId);
        this.wireInvoiceData = result;
        console.log('result in wiredInvoiceData:', JSON.stringify(result));
    
        const { data, error } = result;
        if (data) {
            this.records = data.map(invoice => {
                let companyName = '';
               // const journalEntries = invoice.Accounting_Journal_Entry__r || [];
               let invoiceType = '';
                if (invoice.Is_Service_Invoice__c) {
                    invoiceType = 'Service';
                } else if (invoice.ICT_Invoice_Entry__c) {
                    invoiceType = 'ICT';
                } else if (invoice.Is_Payroll_Sales__c) {
                    invoiceType = 'Sales';
                }

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

                const excludedLedgerItems = ['GST Collected', 'Trade Debtors'];
                const invoiceEntry = invoice.Accounting_Journal_Entry__r.find(
                    item =>
                        item.Sl_no__c === 1 &&
                        item.Accounting_Ledger_Items__r &&
                        item.Accounting_Ledger_Items__r.Category__r &&
                       // item.Accounting_Ledger_Items__r.Category__r.Name           //=== 'Income'
                        !excludedLedgerItems.includes(item.Accounting_Ledger_Items__r.Name)
                    );

                    const ledgerItemName = invoiceEntry ? invoiceEntry.Accounting_Ledger_Items__r.Name : null;
                
                if (invoice.Accounting_Journal_Entry__r && invoice.Accounting_Journal_Entry__r.length > 0) {
                    const entityProfile = invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r;
                    if (entityProfile) {
                        companyName = `${entityProfile.First_Name__c || ''} ${entityProfile.Last_Name__c || ''} ${entityProfile.Name__c || ''}`.trim();
                    }
                    
                }
                
                return {
                    Id: invoice.Id,
                    Name: invoice.Invoice_No__c,
                    Status__c: invoice.Status__c,
                    description: firstRowDescription,
                    allDescriptions: sortedDescriptions,
                    ledgerItem: ledgerItemName,
                    GST__c: parseFloat(invoice.GST__c).toFixed(2),
                    Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
                    companyName: companyName || '',  // Assign 'N/A' if no company name is found
                    invoiceNumber: invoice.Invoice_Number__c,
                    amazonUrl: invoice.Amazon_URL__c,
                    invoiceDate: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
                    emailCount: invoice.Email_Count__c,
                    invoiceType: invoiceType,
                    disableEditLink: invoiceType === 'Service' || invoiceType === 'ICT',
                    dynamicTitle:invoice.Invoice_No__c?.startsWith('INV-') ? 'Sales Invoice' :
                        invoice.Invoice_No__c?.startsWith('CN-')  ? 'Credit Note' :
                        '',
                   isEntityInvoice: invoice.Is_Entity_Payment__c || false,
                   balanceAmount: invoice.Balance_Amount__c 
                        ? parseFloat(invoice.Balance_Amount__c).toFixed(2)
                        : '0.00',
                    amountPaid: invoice.Amount_Paid__c
                        ? parseFloat(invoice.Amount_Paid__c).toFixed(2)
                        : '0.00'
                };

            });
            console.log(' this.records in wiredInvoiceData:....', JSON.stringify(this.records));
           // this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
           // this.pageNumber = 1;
            // if (this.totalRecords > 0) {
            //         this.paginationVisible = true;
            //     }
           // this.paginationHelper();

                //vamshi added 1920 to 1925
                // ✅ Initialize table data and pagination fro global search usage
            this.filteredRecords = [...this.records];
            this.totalRecords = this.filteredRecords.length;
            this.paginationHelper();

           this.fetchAllInvoices(); 
            console.log('companyData in wiredCompanyData:', JSON.stringify(this.invoiceTable));
        } else if (error) {
            console.error('Error retrieving company data:', JSON.stringify(error));
            this.error = error.body.message;  // Storing error message
            this.showErrorToast(this.error); // Show error toast if necessary
        }
    }
    @track invoiceData =[];
    // @wire(getAllSalesInvoice, { sDate: '$sdate', eDate: '$edate', companyId: '$companyId' ,  isRFQ: '$isRFQ'})
    // wiredAllInvoices(result) {
    //     console.log('selectedCompany in getAllSalesInvoice before:', this.companyId);
    //     this.wiredAllInvoiceData = result;
    //     console.log('result in getAllSalesInvoice:', JSON.stringify(result));
    
    //     const { data, error } = result;
    //     if (data) {
    //         this.invoiceData = data.map(invoice => {
    //             let companyName = '';
    //            //const journalEntries = invoice.Accounting_Journal_Entry__r || [];

    //             let invoiceType = '';
    //             if (invoice.Is_Service_Invoice__c) {
    //                 invoiceType = 'Service';
    //             } else if (invoice.ICT_Invoice_Entry__c) {
    //                 invoiceType = 'ICT';
    //             } else if (invoice.Is_Payroll_Sales__c) {
    //                 invoiceType = 'Sales';
    //             }
    //             const excludedLedgerItems = ['GST Collected', 'Trade Debtors'];
    //             const invoiceEntry = invoice.Accounting_Journal_Entry__r.find(
    //                 item =>
                        
    //                     item.Accounting_Ledger_Items__r &&
    //                     item.Accounting_Ledger_Items__r.Category__r &&
    //                    // item.Accounting_Ledger_Items__r.Category__r.Name           //=== 'Income'
    //                     !excludedLedgerItems.includes(item.Accounting_Ledger_Items__r.Name)
    //                 );

    //                 const ledgerItemName = invoiceEntry ? invoiceEntry.Accounting_Ledger_Items__r.Name : null;
    //                 const description = invoiceEntry ? invoiceEntry.Description__c : '';


    //             if (invoice.Accounting_Journal_Entry__r && invoice.Accounting_Journal_Entry__r.length > 0) {
    //                 const entityProfile = invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r;
    //                 if (entityProfile) {
    //                     companyName = `${entityProfile.First_Name__c || ''} ${entityProfile.Last_Name__c || ''} ${entityProfile.Name__c || ''}`.trim();
    //                 }
                    
    //             }
                
    //             return {
    //                 Id: invoice.Id,
    //                 Name: invoice.Name,
    //                 Status__c: invoice.Status__c || '',
    //                 description: description,
    //                 allDescriptions: description,
    //                 ledgerItem: ledgerItemName,
    //                 GST__c: parseFloat(invoice.GST__c).toFixed(2),
    //                 Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
    //                 companyName: companyName || 'N/A',  // Assign 'N/A' if no company name is found
    //                 //invoiceNumber: invoice.Invoice_Number__c,
    //                 amazonUrl: invoice.Amazon_URL__c,
    //                 invoiceDate: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
    //                 invoiceType: invoiceType,
    //                 disableEditLink: invoiceType === 'Service' || invoiceType === 'ICT',
                    
    //             };
    //         });
    //         console.log('companyData in getAllSalesInvoice AFTER:', JSON.stringify(this.invoiceData));
    //         console.log('companyData in getAllSalesInvoice AFTER length : ', this.invoiceData.length);
    //        this.combineInvoiceData(); 
        
    //        console.log('invoiceTable in getAllSalesInvoice:', JSON.stringify(this.invoiceTable));
    //        console.log('invoiceTable in getAllSalesInvoice AFTER length : ', this.invoiceTable.length);
    //     } else if (error) {
    //         console.error('Error fetching invoice data:', error);
    //         this.error = error;
    //         this.invoiceData = undefined;
    //     }
    // }
    fetchAllInvoices() {
        console.log('Calling getAllSalesInvoice imperatively with:', this.sdate, this.edate, this.companyId, this.isRFQ);

        getAllSalesInvoice({ sDate: this.sdate, eDate: this.edate, companyId: this.companyId, isRFQ: this.isRFQ })
            .then(data => {
                if (data) {
                    this.invoiceData = data.map(invoice => {
                        let companyName = '';
                        let invoiceType = '';

                        if (invoice.Is_Service_Invoice__c) {
                            invoiceType = 'Service';
                        } else if (invoice.ICT_Invoice_Entry__c) {
                            invoiceType = 'ICT';
                        } else if (invoice.Is_Payroll_Sales__c) {
                            invoiceType = 'Sales';
                        }

                        const excludedLedgerItems = ['GST Collected', 'Trade Debtors'];
                        const invoiceEntry = invoice.Accounting_Journal_Entry__r?.find(
                            item =>
                                item.Accounting_Ledger_Items__r &&
                                item.Accounting_Ledger_Items__r.Category__r &&
                                !excludedLedgerItems.includes(item.Accounting_Ledger_Items__r.Name)
                        );
                     
                        const ledgerItemName = invoiceEntry?.Accounting_Ledger_Items__r?.Name || null;
                        const description = invoiceEntry?.Description__c || '';

                        if (invoice.Accounting_Journal_Entry__r?.length > 0) {
                            const entityProfile = invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r;
                            if (entityProfile) {
                                companyName = `${entityProfile.First_Name__c || ''} ${entityProfile.Last_Name__c || ''} ${entityProfile.Name__c || ''}`.trim();
                            }
                        }

                        return {
                            Id: invoice.Id,
                            //Name: invoice.Name,
                           Name: invoice.Invoice_No__c && invoice.Invoice_No__c.trim() !== ''
                                ? invoice.Invoice_No__c
                                : invoice.Name,
                            Status__c: invoice.Status__c || '',
                            description: description,
                            allDescriptions: description,
                            ledgerItem: ledgerItemName,
                            GST__c: parseFloat(invoice.GST__c).toFixed(2),
                            Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
                            companyName: companyName || '',    //'N/A'
                            amazonUrl: invoice.Amazon_URL__c,
                            invoiceDate: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
                            invoiceType: invoiceType,
                            disableEditLink: invoiceType === 'Service' || invoiceType === 'ICT',
                            invoiceStartDate:invoice.Start_Date__c,
                            invoiceEndDate:invoice.End_Date__c,
                            entryId: invoice.Accounting_Journal_Entry__r[0].Id
                        };
                    });

                    console.log('Fetched All Sales Invoices:', this.invoiceData);
                    this.combineInvoiceData();
                }
            })
            .catch(error => {
                console.error('Error fetching sales invoices:', error);
                this.error = error;
                this.invoiceData = [];
                this.showErrorToast('Failed to load invoices.');
            });
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
        this.invoiceTable = [];
        if (this.totalRecords > 0) {
            this.paginationVisible = true;
        } else{
            this.paginationVisible = false;
        }
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
       // console.log('total pages '+this.totalPages );
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
               // console.log('break');
                break;
            }  
            let tempConRec = Object.assign({}, this.records[i]);
           
            tempconList.push(tempConRec);           
        }
        this.invoiceTable = tempconList;  
        //console.log('tempconrec>>'+JSON.stringify(this.invoiceTable));       
    }
    combineInvoiceData() {
        // if ( this.records &&  this.invoiceData) {
        //     this.records = [...this.records, ...this.invoiceData];
        //     this.totalRecords = this.records.length;
        //     this.pageNumber = 1;
        //     this.paginationHelper();
        // }
       
        const firstList = Array.isArray(this.records) ? this.records : [];
        const secondList = Array.isArray(this.invoiceData) ? this.invoiceData : [];
        console.log('firstList>>'+JSON.stringify(firstList));
        console.log('secondList>>'+JSON.stringify(secondList));
        const combined = [...firstList, ...secondList];
         console.log('combined>>'+JSON.stringify(combined));

        // Remove duplicates by Id
        const uniqueInvoices = [];
        const seenIds = new Set();

        for (const inv of combined) {
            if (!seenIds.has(inv.Id)) {
                seenIds.add(inv.Id);
                uniqueInvoices.push(inv);
            }
        }

        this.records = uniqueInvoices;
        this.totalRecords = this.records.length;
        this.pageNumber = 1;
        this.paginationHelper();
        
    }
    @track CreditnoteFlag;

    handleDelete(event) {
      
        this.parentInvId = event.currentTarget.dataset.id;
        const status = event.currentTarget.dataset.status;
        const isEntity = event.currentTarget.dataset.isentityinvoice;
        const amountPaid = parseFloat(event.currentTarget.dataset.amountpaid);
        const balanceAmount = parseFloat(event.currentTarget.dataset.balanceamount);

        console.log('status : ',status);
        console.log('parentInvId  in delete : ',this.parentInvId);
      
        console.log('id : ', this.parentInvId, 'isEntity : ', isEntity, 'amountPaid : ', amountPaid, 'balanceAmount : ', balanceAmount);

        if(status === 'Reversed'){
           this.showToast('Error', 'You cannot delete the invoice with status reversed.', 'error');
            return;
        }
        if (status === 'Issued' && isEntity === 'true' && amountPaid > 0) {
            this.showToast(
                'Error',
                'You cannot delete or create a credit note for an entity invoice that has received payments.',
                'error'
            );
            return;
        }
         
        if(status === 'Issued'){
          this.CreditnoteFlag=true;
        }else{

           this.invoiceDeleteFlag=true; 
        }
   }
    handleCreditnote(event) {
        this.editflag = true;
        this.createEditInvoice = 'Create Credit Note';
        this.buttonLabel = 'Update';
        this.selectedCardType = 'Customer';
        this.isInvoiceflag = true;
        this.isSalesFlag = false;
        this.isSalesTableFlag = false;
        this.isTitleMenuFlag = false;
        this.isRFQEnabled = false;
        this.disabledInvoiceNo = true;
        this.disabledSave = false;
        this.isShowActivity = true;
        this.CreditnoteFlag=false;
        this.invoiceDeleteFlag=false; 
        this.statusReverseFlag=true;
        //this.activityToggleLabel = '';

        ///  ADDED FOR  CREDIT NOTE  STATUS ISSUE 
         this.selectedStatus= 'Reversed';
        console.log('allStatusOptions..', JSON.stringify(this.allStatusOptions));
        console.log('statusOptions..', JSON.stringify(this.statusOptions));

        if (!this.statusOptions.find(opt => opt.value === 'Reversed')) {
             console.log('statusOptions inside if ');
            this.allStatusOptions.push({ label: 'Reversed', value: 'Reversed' });
                console.log('statusOptions..123', JSON.stringify(this.statusOptions));

             this.statusOptions = this.allStatusOptions.filter(opt => opt.value !== 'Draft' && opt.value !== 'Issued');
                 console.log('statusOptions..345', JSON.stringify(this.statusOptions));
                  console.log('allStatusOptions..345', JSON.stringify(this.allStatusOptions));
        }
       // this.statusOptions = [ { label: 'Reversed', value: 'Reversed' } ];


        console.log('allStatusOptions..2', JSON.stringify(this.allStatusOptions));
        console.log('statusOptions..2',JSON.stringify(this.statusOptions));

        this.currentInvoiceId =  this.parentInvId;
        console.log('currentInvoiceId: ' + this.currentInvoiceId);
        getAccountingInvoiceInEdit({ invoiceId: this.currentInvoiceId })
            .then(result => {
                console.log('Result of edit in credit note : ', JSON.stringify(result));
                this.salesEntryList = [];
                if (result && result[0]) {
                    const invoice = result[0];
                    const entries = invoice.Accounting_Journal_Entry__r || [];

                    this.companyId = invoice.Company__c;
                    this.invoiceDate = invoice.Invoice_Date__c;
                    this.postDate = invoice.Post_Date__c ? invoice.Post_Date__c: invoice.Invoice_Date__c;
                    //this.dueDate = invoice.Due_Date__c;
                    this.dueDate = invoice.Due_Date__c ? invoice.Due_Date__c : new Date().toISOString().slice(0, 10);
                    this.invoiceNo = invoice.Invoice_No__c.replace('INV-', 'CN-');
                    console.log('this.invoiceNo in credit note :', this.invoiceNo);
                    this.taxInclusive = entries[0]?.Tax_Inclusive__c || false;
                    this.selectedStatus = 'Reversed';
                    this.subTotal = -(invoice.Sub_Total__c);
                    this.taxAmount = -(parseFloat(invoice.GST__c).toFixed(2));
                    this.totalAmount = -(parseFloat(invoice.Total_Amount__c).toFixed(2));
                    this.selectedEntityName = entries[0]?.Entity_Profile__c || '';
                    this.comments = entries[0].Comments__c || '';
                    this.notes =  entries[0].Notes__c || '';
                    if (invoice.Is_Payroll_Sales__c === true) {
                        console.log('isSales');
                        this.isRFQ = false;
                        this.isParticipantInvoice=false;
                    }

                    // PARTICIPANT invoice → set participant flag
                    if (invoice.Is_Service_Invoice__c === true) {
                        console.log('isServices');
                        this.isRFQ = false;
                        this.isParticipantInvoice=true;
                    }
                // refreshApex(this.wiredEntityProfilesResult);
                    this.salesEntry = {
                        company: this.companyId || '',
                        entryType: 'Sales',
                        entityName: this.selectedEntityName,
                        InvoiceDate: this.invoiceDate || '',
                        PostDate: this.postDate || '',
                        dueDate: this.dueDate || '',
                        InvoiceNo: this.invoiceNo || '',
                        taxInclusive: this.taxInclusive,
                        Status: this.selectedStatus || '',
                        comments: entries[0].Comments__c || '',
                        notes: entries[0].Notes__c || '', 
                        invoiceId: null
                    };
                    console.log('Updated salesEntry in credit note :', JSON.stringify(this.salesEntry));
                    const validEntries = entries.filter(entry =>
                        entry.Unit_Price__c !== undefined &&
                        entry.Quantity__c !== undefined &&
                        entry.Tax__c !== undefined
                    );
                     console.log('Valid Entries:', JSON.stringify(validEntries));
                    console.log(' salesEntryList in edit before credit note :', JSON.stringify(this.salesEntryList));
                    validEntries.forEach((entry,index )=> {
                        const ledgerItem = entry.Accounting_Ledger_Items__r || {};
                        const taxRate = entry.Tax__c ? `${entry.Tax__c}%` : '0%'; // default to 0%
                        const newRow = {
                            // Id: entry.Id,
                            // Id:index ==0? Date.now() : Date.now()+1,
                            Id: Date.now() + index,   
                            sno: entry.Sl_no__c,
                            Description__c: entry.Description__c || '',
                            accountList: ledgerItem.Account_Number__c && ledgerItem.Name
                                ? `${ledgerItem.Account_Number__c} - ${ledgerItem.Name}`
                                : '',
                            Quantity__c: entry.Quantity__c || 0,
                            Amount__c: -(entry.Unit_Price__c) || 0,
                        // tax: entry.Tax__c ? `${entry.Tax__c}%` : '',
                            tax: taxRate,
                            accountItemId: entry.Accounting_Ledger_Items__c || '',
                            taxvalue: entry.Tax__c ? `${entry.Tax__c}%` : '0%',
                            calculatedAmount:-(entry.Unit_Price__c * entry.Quantity__c )|| 0, 
                            subTotal: -(parseFloat(entry.Total_Amount__c).toFixed(2)) || 0,
                            taxAmount: -(parseFloat(entry.Tax_Amount__c).toFixed(2)) || 0,
                            totalAmount: -(parseFloat(entry.Sub_Total__c).toFixed(2)) || 0,

                        };
                        this.salesEntryList.push(newRow);
                    });
                    console.log('Final salesEntryList in credit note :', JSON.stringify(this.salesEntryList));
                    if(this.selectedStatus =='Issued'){
                        this.statusOptions = this.allStatusOptions.filter(opt => opt.value !== 'Draft');
                        this.disabledSave = false;
                    // } else if (this.selectedStatus === 'Received') {
                    //     this.statusOptions = this.allStatusOptions.filter(opt => opt.value !== 'Draft' && opt.value !== 'Issued');
                    //      this.disabledSave = false;
                    // } else {
                    //     this.statusOptions = [...this.allStatusOptions]; // show all
                    // }
                   
                   // } else if (this.selectedStatus === 'Received') {
                     } else if (this.selectedStatus === 'Reversed') {
                        this.statusOptions = this.allStatusOptions.filter(
                            opt => opt.value !== 'Draft' && opt.value !== 'Issued'
                        );

                        // // Step 2: Add 'Received' if not already present
                        // if (!this.statusOptions.find(opt => opt.value === 'Received')) {
                        //     this.statusOptions.push({ label: 'Received', value: 'Received' });
                        // }
                        this.disabledSave = false;
                    }   else if(this.selectedStatus =='Draft'){
                        this.statusOptions = [...this.allStatusOptions]; // show all
                    }
                     
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

        //this.editflag =false;
    }
    handlecloseCreditnote(){
    this.CreditnoteFlag=false;
    this.parentInvId='';
     this.statusReverseFlag=false;
    }
    handleYesDelete(event){
        let tempconList=[];
        this.invoiceTable = [];
        deleteRecord(this.parentInvId).then(() => {
            this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Invoice deleted successfully.',
                variant: 'success'
            })
            );
           // refreshApex(this.wireInvoiceData);
           setTimeout(() => {
                refreshApex(this.wireInvoiceData);
                // this.sdate = this.sdate;
                //  this.edate = this.edate;
                let originalDate = new Date(this.sdate);

                // Add 1 day
                originalDate.setDate(originalDate.getDate() + 1);
                console.log('originalDate date in save : ',originalDate);
                // Remove 1 day (back to the original date)
                originalDate.setDate(originalDate.getDate() - 1);

                // Set it back if needed
                this.sdate = originalDate;
                 console.log('start date in save : ',this.sdate);
                console.log('end date in save : ',this.edate);
            }, 2000);
            // // refreshApex(this.wiredAllInvoiceData);
            // console.log('start date in save : ',this.sdate);
            // console.log('end date in save : ',this.edate);
            // console.log('invoiceData in handleYesDelete:', JSON.stringify(this.invoiceData));
          


        });
        // refreshApex(this.wireInvoiceData).then(() => {
        //     // after refetch, re-merge
        //     this.combineInvoiceData();  
        //     this.paginationHelper();
        // }); 
       // this.readInvoiceDetails();
        //refreshApex(this.wireInvoiceData);
        this.paginationHelper();    
        this.invoiceDeleteFlag=false;
    }
    handleDeleteclose(event){
        this.invoiceDeleteFlag=false;
    }
    handleback(){
        this.isInvoiceflag = false;
        this.isSalesFlag = true;
        this.isSalesTableFlag = true;
        this.isTitleMenuFlag = true;
        this.isToggleVisible = true;
        this.isRFQEnabled=false;
        this.statusOptions = [...this.allStatusOptions];
        this.handleClear();
    }
    readInvoiceDetails(){
        console.log('readInvoiceDetails is calling : ');
     //   refreshApex(this.wireInvoiceData); 
        // refreshApex(this.wiredAllInvoiceData); 
        // console.log('start date in save : ',this.sdate);
        // console.log('end date in save : ',this.edate);
        // console.log('invoiceData in handleYesDelete:', JSON.stringify(this.invoiceData));
        
        let originalDate = new Date(this.edate);
        console.log("edate originalDate in refresh is", originalDate.toISOString().slice(0,10));

        // Increase 1 day and assign to edate
        let increased = new Date(originalDate);
        increased.setDate(increased.getDate() + 1);
        this.edate = increased.toISOString().slice(0,10);
        console.log("edate increased refresh is", this.edate);
    setTimeout(() => {
        // Decrease 1 day and assign again to edate
        let decreased = new Date(increased);
        decreased.setDate(decreased.getDate() - 1);
        this.edate = decreased.toISOString().slice(0,10);
        console.log("edate decreased refresh is", this.edate);

    }, 1000);
    }
   
    @track editflag = false;
    handleedit(event) {
        this.editflag = true;
        this.createEditInvoice = 'Edit Sales';
        this.buttonLabel = 'Update';
        this.selectedCardType = 'Customer';
        this.isInvoiceflag = true;
        this.isSalesFlag = false;
        this.isSalesTableFlag = false;
        this.isTitleMenuFlag = false;
        this.isRFQEnabled = false;
        this.disabledInvoiceNo = true;
        this.disabledSave = false;
        this.isShowActivity = true;
        //this.activityToggleLabel = '';

        console.log('allStatusOptions..IN EDIT', JSON.stringify(this.allStatusOptions));
        console.log('statusOptions.. IN EDIT', JSON.stringify(this.statusOptions));

        this.currentInvoiceId = event.currentTarget.dataset.id;
        console.log('currentInvoiceId: ' + this.currentInvoiceId);
        getAccountingInvoiceInEdit({ invoiceId: this.currentInvoiceId })
            .then(result => {
                console.log('Result of edit: ', JSON.stringify(result));
                this.salesEntryList = [];
                if (result && result[0]) {
                    const invoice = result[0];
                    const entries = invoice.Accounting_Journal_Entry__r || [];

                    this.companyId = invoice.Company__c;
                    this.invoiceDate = invoice.Invoice_Date__c;
                    this.postDate = invoice.Post_Date__c ? invoice.Post_Date__c: invoice.Invoice_Date__c;
                    //this.dueDate = invoice.Due_Date__c;
                    this.dueDate = invoice.Due_Date__c ? invoice.Due_Date__c : new Date().toISOString().slice(0, 10);
                    this.invoiceNo = invoice.Invoice_No__c;
                    this.taxInclusive = entries[0]?.Tax_Inclusive__c || false;
                    this.selectedStatus = invoice.Status__c;
                    this.subTotal = invoice.Sub_Total__c;
                    this.taxAmount = parseFloat(invoice.GST__c).toFixed(2);
                    this.totalAmount = parseFloat(invoice.Total_Amount__c).toFixed(2);
                    this.selectedEntityName = entries[0]?.Entity_Profile__c || '';
                    this.comments = entries[0].Comments__c || '';
                    this.notes =  entries[0].Notes__c || '';
                // refreshApex(this.wiredEntityProfilesResult);
                    this.salesEntry = {
                        company: this.companyId || '',
                        entryType: 'Sales',
                        entityName: this.selectedEntityName,
                        InvoiceDate: this.invoiceDate || '',
                        PostDate: this.postDate || '',
                        dueDate: this.dueDate || '',
                        InvoiceNo: this.invoiceNo || '',
                        taxInclusive: this.taxInclusive,
                        Status: this.selectedStatus || '',
                        comments: entries[0].Comments__c || '',
                        notes: entries[0].Notes__c || '', 
                        invoiceId: invoice.Id
                    };
                    console.log('Updated salesEntry:', JSON.stringify(this.salesEntry));
                    const validEntries = entries.filter(entry =>
                        entry.Unit_Price__c !== undefined &&
                        entry.Quantity__c !== undefined &&
                        entry.Tax__c !== undefined
                    );
                     console.log('Valid Entries:', JSON.stringify(validEntries));
                    console.log(' salesEntryList in edit before:', JSON.stringify(this.salesEntryList));
                    validEntries.forEach(entry => {
                        const ledgerItem = entry.Accounting_Ledger_Items__r || {};
                        const taxRate = entry.Tax__c ? `${entry.Tax__c}%` : '0%'; // default to 0%
                        const newRow = {
                            Id: entry.Id,
                            sno: entry.Sl_no__c,
                            Description__c: entry.Description__c || '',
                            accountList: ledgerItem.Account_Number__c && ledgerItem.Name
                                ? `${ledgerItem.Account_Number__c} - ${ledgerItem.Name}`
                                : '',
                            Quantity__c: entry.Quantity__c || 0,
                            Amount__c: entry.Unit_Price__c || 0,
                        // tax: entry.Tax__c ? `${entry.Tax__c}%` : '',
                            tax: taxRate,
                            accountItemId: entry.Accounting_Ledger_Items__c || '',
                            taxvalue: entry.Tax__c ? `${entry.Tax__c}%` : '0%',
                            calculatedAmount: entry.Unit_Price__c * entry.Quantity__c || 0, 
                            subTotal: parseFloat(entry.Total_Amount__c).toFixed(2) || 0,
                            taxAmount: parseFloat(entry.Tax_Amount__c).toFixed(2) || 0,
                            totalAmount: parseFloat(entry.Sub_Total__c).toFixed(2) || 0,

                        };
                        this.salesEntryList.push(newRow);
                    });
                    console.log('Final salesEntryList:', JSON.stringify(this.salesEntryList));


                    if(this.selectedStatus =='Issued'){
                        this.statusOptions = this.allStatusOptions.filter(opt => opt.value !== 'Draft'  &&  opt.value !== 'Reversed');
                        this.disabledSave = false;
                       
                         console.log('statusOptions 222..', JSON.stringify(this.statusOptions));
                    // } else if (this.selectedStatus === 'Received') {
                    //     this.statusOptions = this.allStatusOptions.filter(opt => opt.value !== 'Draft' && opt.value !== 'Issued');
                    //      this.disabledSave = false;
                    // } else {
                    //     this.statusOptions = [...this.allStatusOptions]; // show all
                    // }
                   
                    // } else if (this.selectedStatus === 'Received') {
                    } else if (this.selectedStatus === 'Reversed') {
                        this.statusOptions = this.allStatusOptions.filter(
                            opt => opt.value !== 'Draft' && opt.value !== 'Issued'
                        );
                        
                         console.log('statusOptions 333..', JSON.stringify(this.statusOptions));

                        // // Step 2: Add 'Received' if not already present
                        // if (!this.statusOptions.find(opt => opt.value === 'Received')) {
                        //     this.statusOptions.push({ label: 'Received', value: 'Received' });
                        // }
                        if (!this.statusOptions.find(opt => opt.value === 'Reversed')) {
                            this.statusOptions.push({ label: 'Reversed', value: 'Reversed' });
                        }
                        this.disabledSave = false;
                        
                         console.log('statusOptions 444..', JSON.stringify(this.statusOptions));
                    }   else if(this.selectedStatus =='Draft'){
                        this.statusOptions = this.allStatusOptions.filter(
                            opt => opt.value !== 'Reversed' 
                        );
                        this.statusOptions = [...this.allStatusOptions]; // show all
                    }
                     
                    this.amountarrey = {
                        subTotal: this.subTotal,
                        taxAmount: this.taxAmount,
                        totalAmount: this.totalAmount
                    };
                    
                console.log('statusOptions 555..', JSON.stringify(this.statusOptions));
                }
            })
            .catch(error => {
                console.error('Error fetching invoice details:', error);
            });

        //this.editflag =false;
    }
    // Added by Vamshi to handle the sales and purchase title sections.
    handleHideBanner() {
    console.log('🔹 Hiding Sales/Purchases banner');
    this.isTitleMenuFlag = false; // hide banner
    }


//Export functionality Vamshi

handleExport() {
    // 👇 Use the same array your table uses
    const data = this.invoiceTable || [];

    console.log('Export data:', JSON.stringify(data));

    if (!data || data.length === 0) {
        this.showToast('No Data', 'No records available to export', 'warning');
        return;
    }

    const columns = [
        { label: 'Invoice No', key: 'Name' },
        { label: 'Description', key: 'description' },
        { label: 'Entity Name', key: 'companyName' },
        { label: 'Date Generated', key: 'invoiceDate' },
        { label: 'Ledger Item', key: 'ledgerItem' },
        { label: 'GST', key: 'GST__c' },
        { label: 'Amount', key: 'Total_Amount__c' },
        { label: 'Status', key: 'Status__c' },
        { label: 'Invoice Type', key: 'invoiceType' }
    ];

    const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
    };

    const csvRows = [];
    csvRows.push(columns.map(c => escapeCSV(c.label)).join(','));

    data.forEach(item => {
        const row = columns.map(c => escapeCSV(item[c.key]));
        csvRows.push(row.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Invoices_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}


// Optional toast helper (if using lightning/platformShowToastEvent)
showToast(title, message, variant = 'info') {
    const evt = new ShowToastEvent({ title, message, variant });
    this.dispatchEvent(evt);
}

// Optional Toast Helper
showToast(title, message, variant) {
    const event = new ShowToastEvent({
        title,
        message,
        variant
    });
    this.dispatchEvent(event);
}


    handleShowBanner() {
        console.log('🔹 Showing Sales/Purchases banner again');
        this.isTitleMenuFlag = true; // show banner again
        this.isPurchasesFlag = true; // return to Purchases view (optional)
    }

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isInvoiceflag=false;
        this.isSalesFlag=false;
        this.invoiceDeleteFlag=false;
        this.isInvoiceflag=false;
        this.isSalesTableFlag = false;
        this.isTitleMenuFlag = false;
        this.isToggleVisible = false;
    }

    closeModal() {
        this.isModalOpen = false;
        this.isRFQEnabled=false;
       
    }
    closeaddPayrollinvoice(){
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isModalOpen = false;
        this.isRFQEnabled=false;
        this.isInvoiceflag = false;
        this.isSalesFlag=true;
        this.isSalesTableFlag = true;
        this.isTitleMenuFlag = true;
        this.isToggleVisible = true;
    }
    handleSave() {
       // this.salesEntry.Status = 'Draft';
        this.processSaveOrSubmit();
        //  if (this.statusReverseFlag) {
        //     reverseInvoice({ recordId: this.currentInvoiceId })
        //     .then(() => {
        //         console.log('Invoice reversed');
        //     })
        //     .catch(error => {
        //         console.error('Error reversing invoice:', error);
        //     });
        //      // refreshApex(this.wireInvoiceData);
        //     this.readInvoiceDetails(); 
        // }
    }

    handleSubmit() {
         if (this.salesEntry.Status === 'Issued' && this.editflag === true) {
           // this.salesEntry.Status = 'Received';
           this.salesEntry.Status = 'Issued';
        } else if (this.salesEntry.Status === 'Draft' && this.editflag === true) {
            this.salesEntry.Status = 'Issued';
        // } else if (this.salesEntry.Status === 'Received' && this.editflag === true) {
        //     this.salesEntry.Status = 'Received';
        } else if (this.salesEntry.Status === 'Draft' && this.editflag === false) {
            this.salesEntry.Status = 'Issued';
        } else if (this.salesEntry.Status === 'Issued' && this.editflag === false) {
            this.salesEntry.Status = 'Issued';
        } 
        // else if (this.salesEntry.Status === 'Received' && this.editflag === false) {
        //     this.salesEntry.Status = 'Received';
        // }

         this.processSaveOrSubmit();
        //  if (this.statusReverseFlag) {
        //     reverseInvoice({ recordId: this.currentInvoiceId })
        //     .then(() => {
        //         console.log('Invoice reversed');
        //     })
        //     .catch(error => {
        //         console.error('Error reversing invoice:', error);
        //     });
        //     this.readInvoiceDetails();
           
        // }
    }
   
    async processSaveOrSubmit() {
      

        // ✅ Step 1: Validate required fields
        if (
            !this.salesEntry.entityName || 
            !this.salesEntry.InvoiceDate || 
            !this.salesEntry.dueDate ||
            !this.salesEntry.PostDate || 
            !this.salesEntry.Status
        ) {
            this.showToast('Error', 'Please enter the required fields.', 'error');
            return;
        }

        console.log('Sending to Apex for Update:');
        console.log('Sales Entry:', JSON.stringify(this.salesEntry));
        console.log('Sales Entry List in save:', JSON.stringify(this.salesEntryList));
        console.log('amountarrey:', JSON.stringify(this.amountarrey));

        const isUpdate = !!this.salesEntry.invoiceId;

        try {
            // ✅ Step 2: Delete rows if any marked for deletion
            console.log('deletedRowIds BEFORE:', JSON.stringify(this.deletedRowIds));
            if (this.deletedRowIds && this.deletedRowIds.length > 0) {
                console.log('deletedRowIds:', JSON.stringify(this.deletedRowIds));
                await deleteMatchingRecordsRfq({ deletedIdsJson: JSON.stringify(this.deletedRowIds) });
                console.log('Deleted rows handled successfully.');
                this.deletedRowIds = [];
            }

            // ✅ Step 3: Save or update invoice
            const result = await saveUpdateRfqInvoice({
                salesEntryJson: JSON.stringify(this.salesEntry),
                salesEntryListJson: JSON.stringify(this.salesEntryList),
                amountEntryJson: JSON.stringify(this.amountarrey),
                isRFQ: this.isRFQ,
                isParticipantInvoice: this.isParticipantInvoice
            });

            console.log('Result from Apex:', result);
            const tempInvoiceId = result.Id;
            console.log('Temporary Invoice ID:', tempInvoiceId);

            // ✅ Step 4: Show success toast based on action
            if (isUpdate) {
                this.showToast('Success', 'Sales record updated successfully', 'success');
            } else {
                this.salesEntry.Status = 'Draft';
                this.showToast('Success', 'Sales record created successfully', 'success');
            }

            // ✅ Step 5: Fetch updated invoice details for PDF
            const response = await getAccountingInvoiceById({ invoiceId: tempInvoiceId });
            this.invRecords = response;
            console.log('invoice data for pdf:', JSON.stringify(this.invRecords));
            this.generateBase64Data();

           // refreshApex(this.wireInvoiceData);
            // ✅ Step 6: Post-update cleanup
            setTimeout(() => {
                this.companyId = this.salesEntry.company;
            }, 0);
            console.log('Updated companyId after save:', this.companyId);
            console.log('Updated Sales Entry List in save:', JSON.stringify(this.salesEntryList));
            this.handleClear();
            /* this.emailSentConfirmation = true;
            if( this.emailSentConfirmation){
                this.invoiceIdforEmail= tempInvoiceId;
                console.log('  this.invoiceIdforEmail in emailSentConfirmation:',  this.invoiceIdforEmail);
            } */
           console.log('invoice status ',this.invRecords[0].Status__c);
            const status= this.invRecords[0].Status__c;
            if (status !== 'Draft' ) {
                this.emailSentConfirmation = true;
                if( this.emailSentConfirmation){
                    this.invoiceIdforEmail= tempInvoiceId;
                    console.log('  this.invoiceIdforEmail in emailSentConfirmation:',  this.invoiceIdforEmail);
                }
            } else {
                 this.emailSentConfirmation = false;
            }
             console.log('this.edate in submit : ',this.edate);
           
            //  if (this.statusReverseFlag) {
               
            //         console.log('this.statusReverseFlag in submit : ',this.statusReverseFlag);
            //         // this.fetchAllInvoices();
                    
            //        let originalDate = new Date(this.edate);
            //         console.log("edate originalDate is", originalDate.toISOString().slice(0,10));

            //         // Increase 1 day and assign to edate
            //         let increased = new Date(originalDate);
            //         increased.setDate(increased.getDate() + 1);
            //         this.edate = increased.toISOString().slice(0,10);
            //         console.log("edate increased is", this.edate);
            //     setTimeout(() => {
            //         // Decrease 1 day and assign again to edate
            //         let decreased = new Date(increased);
            //         decreased.setDate(decreased.getDate() - 1);
            //         this.edate = decreased.toISOString().slice(0,10);
            //         console.log("edate decreased is", this.edate);

            //     }, 1000);
                 
            //  } 
            //   this.readInvoiceDetails();
           
            if (this.statusReverseFlag) {
                reverseInvoice({ recordId: this.currentInvoiceId })
                .then(() => {
                    console.log('Invoice reversed');
                })
                .catch(error => {
                    console.error('Error reversing invoice:', error);
                });
             
            
            }
            this.readInvoiceDetails();
                
          //  }

            // refreshApex(this.wiredAllInvoiceData);
            // console.log('start date in save : ',this.sdate);
            // console.log('end date in save : ',this.edate);
        
            // console.log('invoiceData in handleYesDelete:', JSON.stringify(this.invoiceData));
        } catch (error) {
            console.error('Error in processSaveOrSubmit:', error);
            this.showToast('Error', error.body?.message || 'Something went wrong', 'error');
        }
    }
    HandleRFQ(event){
        // Handle toggle input
        if (event.target.type === 'toggle') {
            this.isRFQEnabled = event.target.checked;  // Will be true if checked, false if unchecked
            console.log('Toggle value: ' + this.isRFQEnabled );
            if( this.isRFQEnabled ==true){
                this.isInvoiceflag = false;
                this.isSalesTableFlag = false;
            } else {
               // this.isInvoiceflag = false;
                this.isSalesFlag = true;
                this.isSalesTableFlag = true;
                this.isTitleMenuFlag = true;
                this.isToggleVisible = true;
            }
        }   
    }
    handleExpenseFlag(event) {
       // this.isHome = false;
        this.isInvoiceflag = false;
        //this.isPurchasesFlag = false;
        this.isSalesFlag = false;
        this.isSalesTableFlag = false;
        this.isTitleMenuFlag = false;
        this.isToggleVisible = false;
        //this.isExpenseFlag = true; // for example, show expense form
    }
    handleBackFromExpense(event) {
       // this.isHome = true;
        this.isTitleMenuFlag = true;
        this.isSalesFlag = false;
        this.isSalesTableFlag = false;
        this.isToggleVisible = false;
        this.isPurchasesFlag = true; // If you want to go back to Purchases section
    }
    
    hideSalesFromRfqFlag(event) {
        console.log('hideSalesFromRfqFlag');
      
        // this.isInvoiceflag = false;
         this.isSalesFlag = true;
        // this.isSalesTableFlag = false;
         this.isTitleMenuFlag = false;
         this.isToggleVisible = false;
        // this.isPurchasesFlag = false;
        // this.isRFQEnabled = false;
        //this.isExpenseFlag = true; // for example, show expense form
        console.log('this.isRFQEnabled in hideSalesFromRfqFlag : ' + this.isRFQEnabled);

    }
    handleBackFromRfq(event) {
        console.log('handleBackFromRfq');
       
        this.isTitleMenuFlag = true;
        //this.isSalesFlag = true;
        this.isToggleVisible = true;
        this.isRFQEnabled = true;
        this.isSalesTableFlag = false;
        //this.isPurchasesFlag = false; // If you want to go back to Purchases section
        //this.isRFQEnabled = !isRFQEnabled;
        console.log('this.isRFQEnabled in handleBackFromRfq : ' + this.isRFQEnabled);
    }
    childevent(event){
        const name = event.detail.message;
        console.log('CHILD MESSAGE'+name);
        switch (name) { 
            case 'Entities':
                this.isNewEntityFlag = false;
                this.selectedEntityName='';
                this.selectedCardType = 'Customer';
                this.isInvoiceflag = true;
                //this.salesClass = true;
                this.isTitleMenuFlag = false;
                this.isToggleVisible = false;
                this.isSalesFlag = true;
                this.isSalesTableFlag =false;
                // this.selectedStatus = null;
                this.createEditInvoice='Create Sales';
                this.buttonLabel = 'Save';
               
                if( this.salesEntryList.length === 0) {
        
                this.addRow();
                }
                refreshApex(this.wiredEntityProfilesResult);
                break;

            default:
             this.isHome=true;  
        }  
    } 
    handleDropdownPosition(event) {
        this.resetAllDropdowns(); 
        const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        this.activeRowId =rowId;
        this.showtableTax =false;
        this.customerShowTable=!this.customerShowTable;
        console.log('this.customerShowTable',this.customerShowTable);
        // this.salesEntryList = this.salesEntryList.map(sales => {
        //         if (sales.Id == rowId) {  // Directly checking with sales.Id
        //             return { 
        //                 ...sales, 
        //                 accountList: this.selectedOptionAL
                    
        //             };
        //         }
        //         return sales;
        //     });
        /*  const rect = event.currentTarget.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            const top = rect.bottom + scrollY - 46;  // originally -27, now subtracting 19 more
            const left = rect.left + scrollX - 251;  // origin
            
    */
        const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
    /*  const tdRect = inputEl.closest('td').getBoundingClientRect();

        // Perfect position relative to table cell
        const top = rect.bottom - tdRect.top + 4;
        const left = rect.left - tdRect.left; */
        this.customerDropdownStyle = `
            position:fixed;
            top: ${rect.bottom + 4}px;
            left: ${rect.left}px;
            width: 29%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
       // this.customerShowTable = !this.customerShowTable;
        this.fetchLedgerItems();
         if (this.customerShowTable) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }
   
    handleCustomerSearch(event) {
        //const rowId = event.target.dataset.id;
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
        this.customerShowTable = true;
    }
    handleCustomerSelection(event) {
        const recordId = event.currentTarget.dataset.id;      // ID of selected ledger item
        const accountNumber = event.currentTarget.dataset.accno;  // Account Number
        const accountValue = event.currentTarget.dataset.value;   // Account Name
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
        // Hide dropdown and reset active row
        this.customerShowTable = false;
        //this.activeRowId = null;
        console.log('Updated Sales Entry List handleCustomerSelection :', JSON.stringify(this.salesEntryList));
        this.listenForOutsideClick = false;
    }
    @track invoiceEmailFlag = false;
    @track toAddress = '';
    @track ccAddress = '';
    @track invoiceIdforEmail;
    @track urlforEmail;
    @track invoiceDateforEmail;
    @track invoiceType;
    @track invoiceStartDate;
    @track invoiceEndDate;
    handleEmailAction(event) {
        const status = event.currentTarget.getAttribute('data-status'); // Add this in your HTML as a data attribute
        if (status === 'Draft') {
            this.showToast('Error', 'Cannot send email for a Draft invoice.', 'error');
            return;
        }
        const invoiceId = event.currentTarget.getAttribute('data-id');
        const amazonUrl = event.currentTarget.getAttribute('data-url');
        const invoiceDate = event.currentTarget.getAttribute('data-invoicedate');
      
        const invoicetype = event.currentTarget.getAttribute('data-invoicetype');
        const invoiceStartDate = event.currentTarget.getAttribute('data-startdate');

        const invoiceEndDate = event.currentTarget.getAttribute('data-enddate'); 
        const entryId = event.currentTarget.getAttribute('data-entryid');   
        this.invoiceStartDate =  invoiceStartDate;
        this.invoiceEndDate = invoiceEndDate;    
         this.invoiceType = invoicetype;
         this.entryId = entryId;
        console.log('this.invoiceType: '+this.invoiceType);
        console.log('invoiceStartDate: '+this.invoiceStartDate);
        console.log('invoiceEndDate: '+this.invoiceEndDate);
        this.invoiceIdforEmail = invoiceId;
        this.urlforEmail = amazonUrl;
        this.invoiceDateforEmail = invoiceDate;
        console.log('Invoice ID:', invoiceId);
        console.log('URL:', amazonUrl);
        console.log('Invoice Date:', invoiceDate);
        this.invoiceEmailFlag = true;
        this.getEmail(this.invoiceIdforEmail);
       // this.getccEmail(this.invoiceIdforEmail);
        this.handleGetEmailBody();
    }
    // getEmail(invoiceIdforEmail){
    //     console.log('invoiceId for email: '+invoiceIdforEmail);
    //     getentityEmailForInvoices({ invoiceId: invoiceIdforEmail }) // Pass your actual invoiceId
    //         .then(result => {
    //             //console.log('Invoice Data:', JSON.stringify(result));
    //             console.log('Fetched Email:', result);
    //         const entityEmail = result;
    //             this.toAddress = entityEmail;
    //         })
    //         .catch(error => {
    //             console.error('Error fetching entity email:', error);
    //         });
    // }
     getEmail(invoiceIdforEmail){
        console.log('invoiceId for email: '+invoiceIdforEmail);
        getentityEmailForInvoices({ invoiceId: invoiceIdforEmail }) // Pass your actual invoiceId
            .then(result => {
                //console.log('Invoice Data:', JSON.stringify(result));
                console.log('Fetched Email:', result);

                // to and cc coming from APex json

                 this.toAddress = result?.to || '';
                 this.ccAddress = result?.cc || '';
            })
            .catch(error => {
                console.error('Error fetching entity email:', error);
            });
    }
    handleEmailOnChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;

        switch (fieldName) {
            case 'toAddress':
                this.toAddress = fieldValue;
                break;
            case 'ccAddress':
                this.ccAddress = fieldValue;
                break;
            case 'emailSubject':
                this.emailSubject = fieldValue;
                break;
            case 'emailBody':
                this.emailBody = fieldValue;
                break;
            default:
                console.warn(`Unhandled field: ${fieldName}`);
                 break;
        }

        console.log(`${fieldName} changed to: ${fieldValue}`);
    }

    handleCloseModal(event){
        this.invoiceEmailFlag = false;
    }
    @track emailCounts = 0;
    @track emailSubject;
    @track emailBody;
    handleGetEmailBody() {
        console.log('handleGetEmailBody');
        console.log('invoiceIdforEmail:', this.invoiceIdforEmail);
        console.log('invoiceDateforEmail:', this.invoiceDateforEmail); 
       if(this.invoiceType == 'ICT'){
            console.log('this.invoiceType in email body:', this.invoiceType);
            console.log('this.invoiceStartDate in email body:', this.invoiceStartDate);
            console.log('this.invoiceEndDate in email body :', this.invoiceEndDate);
            console.log('this.entryId in email body:', this.entryId);
            getEmailBodyICT({
                invoiceid: this.entryId,
                invoiceStartDate: this.invoiceStartDate,
                invoiceEndDate: this.invoiceEndDate
               // invoiceDate: new Date(this.invoiceDateforEmail)
            })
            .then(result => {
                console.log('Result from Apex in  getEmailBodyICT:', result);
                this.emailSubject = result?.subject || 'Default Subject';
                this.emailBody = result?.body ||  'Default Body';
            })
            .catch(error => {
                console.error('Error fetching email content:', error);
            });
       }  else {                                                                          //else if (this.invoiceType == 'Sales')
            console.log('this.invoiceType in email body:, ', this.invoiceType);

            getEmailBody({
                invoiceid: this.invoiceIdforEmail
            // invoiceDate: new Date(this.invoiceDateforEmail)
            })
            .then(result => {
                console.log('Result from Apex in  getEmailBody:', result);
                this.emailSubject = result?.subject || 'Default Subject';
                this.emailBody = result?.body ||  'Default Body';
            })
            .catch(error => {
                console.error('Error fetching email content:', error);
            });
        }
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
            ccAddress: this.ccAddress,
            url: this.urlforEmail,
            subject: this.emailSubject,
            body: this.emailBody,
            
        })
        .then((updatedCount) => {
            console.log('Email sent successfully');
            this.showToast('Success', 'Email sent successfully', 'success');
            this.fromAddress = '';
            this.toAddress = '';
            this.ccAddress = '';
            this.emailSubject = '';
            this.emailBody = '';
            this.invoiceEmailFlag = false;
                refreshApex(this.wireInvoiceData);
            this.emailCounts = updatedCount;
            console.log('this.emailCounts : ' + this.emailCounts);
        })
        .catch(error => {
            console.error('Error sending email:', error);
            this.showToast('Error', 'Error sending email: ' + error.body?.message || error.message, 'error');
        });

    }
    @track historyRowsAll = [];   
    handleHistoryClick(event) {
        console.log('this.currentInvoiceId : ' + this.currentInvoiceId);
    // this.showHistoryTable = true;
        this.showHistoryTable = !this.showHistoryTable;
        console.log('this.showHistoryTable : ' + this.showHistoryTable);

        getInvoiceHistoryDetails({ invoiceId: this.currentInvoiceId })
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

                if ((field === 'Comments__c' || field === 'Notes__c') && seenCommentsNotes.has(field)) return;
                if (field === 'Comments__c' || field === 'Notes__c') seenCommentsNotes.add(field);

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
        this.createEditInvoice = 'Edit Sales';
        this.buttonLabel = 'Update';
        this.selectedCardType = 'Customer';
        this.isInvoiceflag = true;
        this.isSalesFlag = false;
        this.isSalesTableFlag = false;
        this.isTitleMenuFlag = false;
        this.isRFQEnabled = false;
        this.disabledInvoiceNo = true;
        this.disabledSave = false;
        this.isShowActivity = true; 
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
    handleYesEmail(event) {
        this.toAddress = '';
        this.ccAddress = '';
        this.invoiceEmailFlag = true;
        this.emailSentConfirmation=false;
        this.getEmail(this.invoiceIdforEmail);
        this.handleGetEmailBody();
    }
    handleEmailClose(event){
        this.emailSentConfirmation=false;
        this.handleClear();
    }
    resetAllDropdowns() {
        this.showtableTax = false;
        this.customerShowTable = false;
        this.listenForOutsideClick = false;
    }


     handleRowFocus(event) {
        this.activeRowIdB = event.target.dataset.row;
        // console.log("Active row:", this.activeRowIdB);
     }
        //------------------SHORTCUT KEYS------------------//

   handleShortcut(event){

                 if (event.altKey && event.key.toLowerCase() === 'v') {
            event.preventDefault();

            const invoiceField = this.template.querySelector('[data-id="invoiceNo"]');

            if (invoiceField) {
                invoiceField.focus();
                console.log("Focused Invoice No field using alt + v");
            }
        }

        // ALT + T → Toggle Tax Inclusive
        if (event.altKey && event.key.toLowerCase() === "t") {
            event.preventDefault();

            const toggle = this.template.querySelector('[data-id="taxInclusiveToggle"]');
            if (toggle) {
                toggle.click();   // Simulate click → this triggers onchange
                console.log("Toggled Tax Inclusive using Alt + T");
            }
        }

          
         // CTRL + D → Focus Invoice Date
        if (event.ctrlKey && event.key.toLowerCase() === "d") {
            event.preventDefault();

            const invoiceDateField = this.template.querySelector(
                'lightning-input[data-id="invoiceDateField"]'
            );

            if (invoiceDateField) {
                setTimeout(() => {
                    invoiceDateField.focus();
                }, 0);

                console.log("Focused invoice Date using Ctrl + d");
            } else {
                console.log("invoice Date field not found.");
            }
        }   
         // CTRL + P → Focus Post Date
        if (event.ctrlKey && event.key.toLowerCase() === "p") {
            event.preventDefault();

            const postDateField = this.template.querySelector(
                'lightning-input[data-id="postDateField"]'
            );

            if (postDateField) {
                setTimeout(() => {
                    postDateField.focus();
                }, 0);

                console.log("Focused invoice Date using Ctrl + p");
            } else {
                console.log("invoice Date field not found.");
            }
        }

                // ALT + D → Focus Due Date field
        if (event.altKey && event.key.toLowerCase() === "d") {
            event.preventDefault();

            const dueDateField = this.template.querySelector(
                'lightning-input[data-id="dueDate"]'
            );

            if (dueDateField) {
                // lightning-input supports focus()
                setTimeout(() => {
                    dueDateField.focus();
                }, 10);

                console.log("Focused Due Date field using Alt + D");
            } else {
                console.log("Due Date field not found.");
            }
        }
  

        // CTRL + SHIFT + D → Focus FIRST Description textarea
        if (
        event.ctrlKey &&
        event.shiftKey &&
        (event.key.toLowerCase() === "b" || event.code === "KeyB")) {
        event.preventDefault();

        // 1️⃣ Get the lightning-textarea host (the wrapper)
        const firstHost = this.template.querySelector('[data-field="Description__c"]');

        if (firstHost) {
            // 2️⃣ Get internal real <textarea>
            const internalArea = firstHost.shadowRoot.querySelector("textarea");

            if (internalArea) {
                setTimeout(() => {
                    internalArea.focus();
                }, 0);

                console.log("Focused FIRST Description field using Ctrl+Shift+D");
            } else {
                console.log("Internal <textarea> not found.");
            }
        } else {
            console.log("No description lightning-textarea found.");
        }
    }
        //ctrl + L add new line
        // CTRL + L → Add New Line
        if (event.ctrlKey && event.key.toLowerCase() === "l") {
            event.preventDefault();

            const btn = this.template.querySelector('[data-id="addNewLineBtn"]');

            if (btn) {
                btn.click();       // simulate the button click → triggers addRow()
                console.log("Added new line via Ctrl + L");
            } else {
                console.log("Add New Line button not found.");
            }     

        } 
        
        
            // CTRL + DELETE → delete the active row
        if (event.ctrlKey && event.key === "Delete") {
            event.preventDefault();

            const rowId = this.activeRowIdB;

            if (!rowId) {
                console.log("No active row to delete.");
                return;
            }

            const deleteLink = this.template.querySelector(
                `a.delete-row-link[data-id="${rowId}"]`
            );

            if (deleteLink) {
                deleteLink.click(); // simulate delete
                console.log("Deleted row via shortcut:", rowId);
            } else {
                console.log("Delete link not found for row:", rowId);
            }
        }



        // CTRL + M → Focus Comments
            if (event.ctrlKey && event.key.toLowerCase() === "m") {
                event.preventDefault();

                const commentsField = this.template.querySelector('[data-id="commentsField"]');

                if (commentsField) {
                    // lightning-textarea supports .focus()
                    setTimeout(() => {
                        commentsField.focus();
                    }, 0);

                    console.log("Focused Comments using Ctrl + M");
                } else {
                    console.log("Comments field not found.");
                }
            }

            // CTRL + S → Save record
        if (event.ctrlKey && event.key.toLowerCase() === "s") {
            event.preventDefault();  // prevent browser Save dialog

            const saveBtn = this.template.querySelector('[data-id="saveBtn"]');
            if (saveBtn) {
                saveBtn.click();    // simulate button click
                console.log("Document saved via Ctrl + S");
            } else {
                console.log("Save button not found.");
            }
        }

                // CTRL + ENTER → Submit
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();

            // find the submit button
            const submitBtn = this.template.querySelector(
                'lightning-button[data-id="submitBtn"]'
            );

            if (submitBtn) {
                submitBtn.click();   // trigger the actual submit logic
                console.log("Submitted via Ctrl + Enter");
            } else {
                console.log("Submit button not found.");
            }
        }

                // CTRL + Q → Focus Notes textarea
        if (event.ctrlKey && event.key.toLowerCase() === "q") {
            event.preventDefault();

            const notesField = this.template.querySelector('[data-id="notesField"]');

            if (notesField) {
                // lightning-textarea supports focus() directly
                setTimeout(() => {
                    notesField.focus();
                }, 10);

                console.log("Focused Notes field using Ctrl + q");
            } else {
                console.log("Notes field not found.");
            }
        }






   }




}