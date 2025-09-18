import { LightningElement, wire, api, track } from 'lwc';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
//import getLedgerItems from '@salesforce/apex/CreateCompanyController.getLedgerItems';
import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getLedgerItemsforExpenses from '@salesforce/apex/AccountingModuleController.getLedgerItemsforExpenses';
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
import UpdateDataFromInvoice from '@salesforce/apex/AccountingModuleController.UpdateDataFromInvoice';
import deleteInvoiceLines from '@salesforce/apex/AccountingModuleController.deleteMatchingRecords';
import sendEmail from '@salesforce/apex/InvoiceHandler.sendEmailforInvoiceforPurchases';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import getInvoiceHistoryDetails from '@salesforce/apex/AccountingChartController.getInvoiceHistoryDetails';
import getentityEmailForInvoices from '@salesforce/apex/AccountingChartController.getentityEmailForInvoices';


export default class RfqAccountingLwc extends LightningElement {
    rewards = My_Resource + '/myResource/images/invoice.svg';

    @api orgid;
    // @api companyid;
    // @api companyname;
    @track salesEntryList = [];  
    //@track customerShowTable = false;  
    @track showtableTax = false;  
    @track isInvoiceflag = false;
    @track invoiceflag=true;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track invoiceTable=[];
    @track edate;
    @track sdate;
    @track selectedCompany;
    wireInvoiceData;
    @track invoiceDeleteFlag=false;
    parentInvId;
    @track invoiceID;
    @track base64string;
    @track orgname;
    @track paginationVisible=false;

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
    wiredCompanyList;
    wiredEntityProfilesResult;
    @track entryNameOptions=[];
    @track totalEntry = [];
    @track selectedEntityName;
    @track taxInclusive=true;
    @track terms;
    @track invoiceDate=null;
    @track postDate=null;
    @track dueDate = null;
    @track invoiceNo;
    @track comments;
   // @track IncludeGST;
    @track Status;
    @track accountNo;
    @track bsb;
    @track bank;
    @track accountName;
    @track invRecords=[];
    @track taxDropdownStyle = '';
    @track deletedRowIds = [];
    @track isSalesFlag=true;
    @track isPurchasesFlag=false;
    @track showSpinner = false;
    @track createEditInvoice='Create RFQ Sales';
    @track buttonLabel='Save'; 
    @track isRFQ=true;
    @track backFlag=false;
    wiredEntityProfilesTax;
    @track customerDropdownStyle = '';

     accountList = '';
    customerShowTable = false;
    FilteredLedgerItems = [];
    customerSelectedAccountId = '';
     activeRowId = '';
    @track filteredCompanyOptions = [];
    @track disabledInvoiceNo = false;
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
    @track entryOptions=[{label:'Purchases',value:'Purchases'},{label:'Sales',value:'Sales'}];
    @track entityOptions= [{label:'Customer',value:'Customer'}];
    @track selectedCardType = 'Customer';
    @track gstOptions=[{label:'Yes',value:'Yes'},{label:'No',value:'No'}];
    @track StatusOptions=[{label:'Draft',value:'Draft'},{label:'Issued',value:'Issued'},{label:'Received',value:'Received'}];
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];

   //@track selectedRowIdTax;
    @track currentUrl;
    @track isModalOpen = false;
    connectedCallback(){
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.companyId  = storedCompanyId;
            this.companyname = storedCompanyName;
            console.log('Company from localStorage connectedCallback RfqAccountingLwc:', this.companyId, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback RfqAccountingLwc');
        }
        //console.log('companyid in connectedCallback RfqAccountingLwc: ', this.companyid);
        //this.companyId = this.companyid;
        console.log(' companyname in connectedCallback RfqAccountingLwc: ', this.companyname);
        console.log('companyId in connectedCallback RfqAccountingLwc: ', this.companyId);
        console.log('entityOptions : ', JSON.stringify( this.entityOptions));
        //this.selectedCardType ='Supplier';
        console.log('selectedCardType in connectedCallback RfqAccountingLwc: ', this.selectedCardType);
        if(this.selectedCardType){
            setTimeout(() => {
                refreshApex(this.wiredEntityProfilesResult);
            }, 1000);
        }
        this.addRow();
        this.entryType = 'Sales';
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.edate = last.toISOString().slice(0, 10);
        this.handleInvoiceData();
        //this.invoiceflag=true;
        //refreshApex(this.wireInvoiceData);
        this.isRFQ=true;
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
        InvoiceNo: '',
        dueDate: '',
        //IncludeGST: '',
        taxInclusive: true,
        Status: '',
        comments: ''
    };
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
    // @wire(getCompany, {orgid:'$orgid'})
    // wiredCompanies(result) {
    //     this.wiredCompanyList = result; // Store the wired result for refreshing
    //     const { data, error } = result;
    //     if (data) {
          
    //         this.companyOptions = data.map(company => ({
    //             label: company.Company_Name__c,
    //             value: company.Id
    //         }));
    //         console.log('company options '+JSON.stringify(this.companyOptions));
    //         this.selectedCompany=this.companyOptions[0].value;
    //     } else if (error) {
    //         console.error('Error fetching companies:', error);
    //     }
    // }
     @wire(getCompany, {orgid:'$orgid'})
        wiredCompanies(result) {
            this.wiredCompanyList = result; // Store the wired result for refreshing
            const { data, error } = result;
            if (data) {
              
                this.companyOptions = data.map(company => ({
                    label: company.Company_Name__c,
                    value: company.Id
                }));
                console.log('company options '+JSON.stringify(this.companyOptions));
               // this.selectedCompany=this.companyOptions[0].value;
               console.log('companyid in  wire getCompany : ', this.companyId);
               if (this.companyId && this.companyOptions.length > 0) {
                this.filteredCompanyOptions = this.companyOptions.filter(
                    opt => opt.value === this.companyId
                   
                );
                console.log('filteredCompanyOptions  '+JSON.stringify(this.filteredCompanyOptions));
                this.companyId=this.filteredCompanyOptions[0].value;
                console.log('companyId in  wire getCompany : ', this.companyId);
                if (this.filteredCompanyOptions.length > 0) {
                    this.salesEntry = {
                        ...this.salesEntry,
                        company: this.filteredCompanyOptions[0].value
                    };
                    console.log('salesEntry updated with company:', JSON.stringify(this.salesEntry));
                }
            }
            } else if (error) {
                console.error('Error fetching companies:', error);
            }
        }
    // @wire(getEntityProfiles, {companyId: '$companyId' })
    // wiredEntityProfiles(result) {
    //     this.wiredEntityProfilesResult = result; // Store response for refreshApex
    //     const { data, error } = result;

    //     if (data) {
    //         console.log('Filtered Company options: ', JSON.stringify(data));
    //         this.entryNameOptions = data.map(entity => ({
    //             label: entity.Name__c 
    //                 ? entity.Name__c // Check if Name__c exists, use it
    //                 : `${entity.First_Name__c} ${entity.Last_Name__c}`, // Else fallback to First and Last name
    //             value: entity.Id
    //         }));
    //         this.error = undefined;
    //         console.log('Filtered Company options: ', JSON.stringify( this.entryNameOptions));
    //     } else if (error) {
    //         this.error = error;
    //         console.error('Error fetching entity profiles:', error);
    //     }
    // }
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
            console.log('Filtered Company options: ', JSON.stringify( this.entryNameOptions));
        } else if (error) {
            this.error = error;
            console.error('Error fetching entity profiles:', error);
        }
    }
    // @wire(getEntityProfileTax, { entityId: '$selectedEntityName' })
    //    wiredTax(result) {
    //         console.log('getEntityProfileTax result: ', JSON.stringify(result));
    //        this.wiredEntityProfilesTax = result; // Store response for refreshApex
    //        const { data, error } = result;
   
    //       if (data && (data.tax || data.accountList)) {
    //            console.log('selectedEntityName :', this.selectedEntityName); 
   
    //            const tax = data.tax;
    //            const entityAccountList = data.accountList;
    //            const taxValue = this.appendPercentage(tax);
    //            const entityItemId = data.accountItemId;
    //            if(this.createEditInvoice == 'Edit RFQ Sales'){
    //                 this.salesEntryList = this.salesEntryList.map(entry => ({
    //                     ...entry,
    //                     tax: entry.tax || '0%',
    //                     accountList: entry.accountList ? entry.accountList : (entityAccountList || ''),
    //                     accountItemId: entry.accountItemId ? entry.accountItemId : entityItemId
    //                 }));
    //             } else {
    //                 this.salesEntryList = this.salesEntryList.map(entry => ({
    //                     ...entry,
    //                     tax: taxValue,
    //                     accountList: entry.accountList ? entry.accountList : (entityAccountList || ''),
    //                     accountItemId: entry.accountItemId ? entry.accountItemId : entityItemId
    //                 }));
    //             }
   
    //            this.selectedOptionTax = taxValue  || '';
    //            this.selectedOptionAL = entityAccountList || '';
               
    //            console.log('Tax Value in getEntityProfileTax :', this.selectedOptionTax);
    //            console.log('selectedOptionAL in getEntityProfileTax :', this.selectedOptionAL);
    //            console.log(' Sales Entry List in entity:', JSON.stringify(this.salesEntryList));
    //        } else {
    //            // Handle no data or invalid structure
    //            console.warn('No valid Tax or AccountList received');
   
    //            // Prevent undefined from propagating
    //            this.selectedOptionTax = '';
    //            this.selectedOptionAL = '';
   
    //            this.salesEntryList = this.salesEntryList.map(entry => ({
    //                ...entry,
    //                tax: '',
    //                accountList: '',
    //            }));
    //        }
    //    }
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
   
    appendPercentage(taxValue) {
        // Assuming taxValue is already a number (like 10 for 10%)
        if (taxValue != null) {
            return `${taxValue}%`; // Append '%' to the number
        }
        return '0%'; // If no tax value, return '0%'
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
    }
    handlePurchases(){
        this.isSalesFlag=false;
        this.isPurchasesFlag=true;
        //this.isHome = false;
      
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
    
    addRow() {
        const newRow = this.createRow();
        this.salesEntryList = [...this.salesEntryList, newRow];
        console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
        this.reindexSalesEntryList(); // ensure S.No is always in order
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
        const rowId = event.currentTarget.dataset.id;  // Keep as string
        this.salesEntryList = this.salesEntryList.filter(row => String(row.Id) !== rowId);
        this.selectedRowId = null;
        if( this.createEditInvoice=='Edit RFQ Sales' ||this.buttonLabel =='Update'){
            if (!this.deletedRowIds) {
                this.deletedRowIds = [];
            }
            this.deletedRowIds.push(rowId);
            console.log('Deleted Row IDs:', this.deletedRowIds);
        }
        this.recalculateTotals();
        this.reindexSalesEntryList();
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

        console.log('✅ Totals recalculated:', JSON.stringify(this.amountarrey));
        console.log('📦 Updated salesEntryList:', JSON.stringify(this.salesEntryList));
    }

    fetchLedgerItems() {
        console.log('Calling Apex Method: getLedgerItems...');
        console.log('companyId in fetchLedgerItems: ' + this.companyId);

        // Call the Apex method and pass companyId as parameter
        getLedgerItems({ companyId: this.companyId })
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
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }
    
    // handleChange(event) {
    //     const fieldName = event.target.name;
    //     const fieldValue = event.target.value;

    //     this.salesEntry = { ...this.salesEntry, [fieldName]: fieldValue };
    //     console.log(`Updated Field - ${fieldName}:`, fieldValue);
    //     console.log('this.salesEntry===>'+JSON.stringify(this.salesEntry));

    //     if( fieldName == 'company'){
    //         this.companyId = event.target.value;
    //         refreshApex(this.wiredEntityProfilesResult);
    //     }
    // }    
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
            case 'company':
                this.companyId = fieldValue;
                refreshApex(this.wiredEntityProfilesResult);
                break;

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
            case 'InvoiceDate':
                 this.invoiceDate = fieldValue;
                this.salesEntry.InvoiceDate = fieldValue;

                // if (!this.salesEntry.PostDate) {
                //     this.salesEntry.PostDate = fieldValue;
                //     this.postDate = fieldValue;
                //     console.log('Auto-set PostDate:', fieldValue);
                // }
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

            default:
                console.warn(`Unhandled field name: ${fieldName}`);
                break;
        }
       
    }    
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

    // handleSelection(event) {
    //     const recordId = event.currentTarget.dataset.id; // ID of the clicked row
    //     const accountNumber = event.currentTarget.dataset.accno; // Account Number
    //     const accountValue = event.currentTarget.dataset.value; // Account Name
    //     //this.selectedRowId=event.currentTarget.dataset.id;
    
    //     console.log('Record ID in AL:', recordId);
    //     console.log('Account Number:', accountNumber);
    //     console.log('Account Value:', accountValue);
    
    //     // ✅ Find the correct row in salesEntryList based on sales.Id
    //     this.salesEntryList = this.salesEntryList.map(sales => {
    //         if (sales.Id == this.selectedRowId) {  // Directly checking with sales.Id
    //             return { 
    //                 ...sales, 
    //                 accountList: `${accountNumber} - ${accountValue}` ,
    //                 accountItemId: recordId,
    //             };
    //         }
    //         return sales;
    //     });
    
    //     this.selectedOptionAL = `${accountNumber}  ${accountValue}`; // Update UI dropdown
    //     this.customerShowTable = false; // Hide dropdown
    
    //     console.log('Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    // }           
   
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
        console.log('📋 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    }
    
    // handleSaveEntry() {
    //     this.showSpinner = true;
    //     console.log('Sending to Apex:');
    //     console.log('Sales Entry:', JSON.stringify(this.salesEntry));
    //     console.log('Sales Entry List:', JSON.stringify(this.salesEntryList));
    //     console.log('amountarrey : ' + JSON.stringify(this.amountarrey));
    
    //     saveSalesData({ 
    //         salesEntryJson: JSON.stringify(this.salesEntry), 
    //         salesEntryListJson: JSON.stringify(this.salesEntryList),
    //         amountEntryJson: JSON.stringify(this.amountarrey)
    //     })
    //     .then(result => {
    //         const tempInvoiceId = result.Id;  
    //         console.log('Temporary Invoice ID:', tempInvoiceId);
    //         this.showToast('Success', 'Sales Data saved successfully', 'success');
    //             //getAccountingInvoiceById({ invoiceId: tempInvoiceId }); 

    //         getAccountingInvoiceById({ invoiceId: tempInvoiceId }).then(response => {
    //             //console.log('data of ', JSON.stringify(response));
    //             this.invRecords = response;
    //             console.log('invoice data for pdf ', JSON.stringify(this.invRecords));
    //             //this.generateBase64Data();
    //         });
            
    //         //this.this.salesEntryList = [];
    //         this.handleClear();
    //         this.addRow();
    //         // refreshApex(this.wiredCompanyList);
    //         refreshApex(this.wireInvoiceData);
    //         this.showSpinner = false;
    //     })
    //     .catch(error => {
    //         this.showToast('Error', error.body.message, 'error');
    //         this.showSpinner = false;
    //     });
    // }

            generateBase64Data() { 
            console.log('jspdfentered');
            const { jsPDF } = window.jspdf;
            var doc = new jsPDF();
            const invoice = this.invRecords[0];
                    console.log('INVOICE RECORDS'+JSON.stringify(invoice));

            //var statePostalWithoutCommas = this.invRecords[0].Company__r.Address__c.replace(/,/g, " "); 
            
            // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );
        
            doc.setFont("Roboto-Bold", "bold");
            //doc.setFontSize(20);
            //doc.text("DRAFT INVOICE", 20,25 );
            doc.setTextColor(0,102,255);
            doc.setFontSize(12);
             doc.text(this.orgname.toUpperCase(), 10, 25);  
            // doc.text(invoice.Company__r.Company_Name__c.toUpperCase(), 10, 25);  
            console.log('orgname '+this.orgname);     
            console.log('616');

            doc.setTextColor(0,0,0);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text("ABN: "+ invoice.Company__r.ABN__c, 10, 30);
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
            doc.text(invoice.Name, 160, 30);

            
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
                
           /*  doc.text("TAX INVOICE To: "+invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.First_Name__c+" "+invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.Last_Name__c, 10, 72); */                   
            
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
                //subTotal += record.Total_Amount__c;
            
                result.push([
                    record.Description__c,
                    record.Quantity__c.toFixed(2),
                    record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    record.Tax__c, // Tax column
                    record.Total_Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    record.Sub_Total__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                ]);
            });
            
            
            // Adding subtotal, GST, and total rows
            //result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' + subTotal.toFixed(2)]);
             const taxNote = this.taxInclusive ? "*Taxes are Inclusive" : "*Taxes are Exclusive";
             result.push([{ content: taxNote, styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' +  parseFloat(invoice.Sub_Total__c).toFixed(2)]);
            result.push(["", "", "", "Total GST:", '$' + invoice.GST__c.toFixed(2)]);
            result.push(["", "", "", "Total:", '$' + invoice.Total_Amount__c.toFixed(2)]);
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
                doc.setDrawColor(0, 0, 0); // Black color
                doc.setLineWidth(0.5);
                doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
                doc.line(10, yPosition, 200, yPosition); // (startX, startY, endX, endY)
                doc.setLineDash();
                
                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Payable to:", 10, yPosition + 6);
                
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Bank", 10, yPosition + 12);
                doc.text(":", 40, yPosition + 12);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bank || " ", 42, yPosition + 12);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Name", 10, yPosition + 16); 
                doc.text(":", 40, yPosition + 16);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountName || " ", 42, yPosition + 16);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("BSB", 10, yPosition + 20); 
                doc.text(":", 40, yPosition + 20);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bsb || " ", 42, yPosition + 20);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Number", 10, yPosition + 24);
                doc.text(":", 40, yPosition + 24);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountNo || " ", 42, yPosition + 24);

                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Terms & Conditions:", 10, yPosition + 44);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.setTextColor(169, 169, 169);
                doc.text("All terms and conditions apply.", 10, yPosition + 48);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                addFooter(doc);

            }else{
                doc.addPage();

                yPosition = 25;
                doc.setDrawColor(0, 0, 0); // Black color
                doc.setLineWidth(0.5);
                doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
                doc.line(10, yPosition, 200, yPosition); // (startX, startY, endX, endY)
                doc.setLineDash();
                
                
                
                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Payable to:", 10, yPosition + 6);
                
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Bank:", 10, yPosition + 12);
                doc.text(":", 40, yPosition + 12);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bank || " ", 42, yPosition + 12);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Name:", 10, yPosition + 16); 
                doc.text(":", 40, yPosition + 16);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountName || " ", 42, yPosition + 16);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("BSB:", 10, yPosition + 20); 
                doc.text(":", 40, yPosition + 20);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bsb || " ", 42, yPosition + 20);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Number:", 10, yPosition + 24);
                doc.text(":", 40, yPosition + 24);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountNo || " ", 42, yPosition + 24);

                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Terms & Conditions:", 10, yPosition + 44);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.setTextColor(169, 169, 169);
                doc.text("All terms and conditions apply.", 10, yPosition + 48);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

                addFooter(doc);
            }
            
            
            
            this.base64string = btoa(doc.output());
            
            
            console.log('Generated PDF Base64: ' + this.base64string);
            console.log('Generated PDF Name: ' + this.invRecords[0].Name);
            console.log('Generated recordId: ' + this.invRecords[0].Id);

            uploadFile({base64:JSON.stringify( this.base64string), filename:this.invRecords[0].Name+'.pdf', recordId:this.invRecords[0].Id,obj:'AccountingInvoice'})
            .then(result=>{
                // console.log('data', result);                    
                //this.handleInvoicFlag();
                // console.log('Upload result = ' +result);
            //   this.fileName = this.invRecords[0].Name + ' - Uploaded Successfully'; 
            setTimeout(() => {
            refreshApex(this.wireInvoiceData);
            }, 2000);
            })            
            const evt = new ShowToastEvent({
                title: 'Success',
                message: 'Invoice Generated sucessfully '+this.invRecords[0].Name,
                variant: 'success',
                mode: 'dismissable'
            });
            // doc.save('Invoice.pdf');
        
            //return this.base64string;
        }


    handleClear(){
        this.isInvoiceflag = false;
        this.invoiceflag= true;
        //console.log('console in clear');
       // this.companyId = null;
       // this.selectedCardType = '';
        this.selectedEntityName = null;
        //this.taxInclusive = false;
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
       // this.invoiceNo = '';
        this.comments = '';
         this.isShowActivity = false;  
        this.showHistoryTable = false; 
        // this.subTotal = 0;
        // this.taxAmount = 0;
        // this.totalAmount = 0;
        //this.gstType = null;
        this.selectedStatus = null;
        this.salesEntryList = []; 
        this.dueDate = null; 
    this.customerShowTable = false;  
    this.showtableTax = false;  
    this.ledgerItems = []; 
    this.deletedRowIds = [];    
    //this.companyId = null;  
    this.selectedRowId = null;        
    this.popoverStyle = {};
    this.selectedOptionAL = null; 
    this.selectedOptionTax = null;
    this.subTotal = 0;
    this.taxAmount = 0;
    this.totalAmount = 0;   
    this.selectedDescription = null;
    this.selectedAmount = null;
    this.selectedItem = null; 
    this.entryType = 'Sales'; 
    this.selectedCardType = null;
   // this.selectedEntityName = null;
    //this.taxInclusive = false;
    this.terms = null;
    this.invoiceDate = null;
    this.postDate = null;
    this.invoiceNo = null;
    this.comments = null;
    //this.IncludeGST = null;
    this.Status = null;
    this.taxDropdownStyle = '';
    this.customerDropdownStyle= '';
    refreshApex(this.wiredCompanyList);
    this.salesEntry = {
        company: this.companyId,
        entryType: 'Sales',
        entityName: '',
        InvoiceDate: '',
        PostDate: '',
        InvoiceNo: '',
        dueDate: '',
        //IncludeGST: '',
        taxInclusive: true,
        Status: '',
        comments: '',
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
        this.backToParent(); 
       
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
        this.selectedRowId=event.currentTarget.dataset.id;
       
        console.log('selectedRowId'+this.selectedRowId);
        this.showtableTax = !this.showtableTax;
    
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
            width: 16%;
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
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }

    handleInvoicFlag() {

        this.isInvoiceflag = true;
        this.invoiceflag=false;
        this.createEditInvoice='Create RFQ Sales';
        this.buttonLabel = 'Save';
        this.selectedCardType = 'Customer';
        this.disabledInvoiceNo = true;
         this.isShowActivity = false;  
        this.showHistoryTable = false;
        // this.gstType = null;
        // this.selectedStatus = null;
          this.taxInclusive = true;
           this.salesEntry = {
            company: this.companyId,
            entryType: 'Sales',
            entityName: '',
            InvoiceDate: '',
            PostDate: '',
            dueDate: '',
            InvoiceNo: '',
            //IncludeGST: '',
            taxInclusive:true,
            Status: '',
            comments: '',
            invoiceId:null
        };
        
        //this.handleClear();
        if( this.salesEntryList.length === 0) {

            this.addRow();
        }
        this.hideParent();
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
    @wire(getAccountingInvoice, { sDate: '$sdate', eDate: '$edate', companyId: '$companyId' , isRFQ: '$isRFQ' })
    wiredInvoiceData(result) {
        console.log('companyId in getAccountingInvoice before:', this.companyId);
        this.wireInvoiceData = result;
        console.log('result in wiredInvoiceData:', JSON.stringify(result));
    
        const { data, error } = result;
        if (data) {
            this.records = data.map(invoice => {
                let companyName = '';

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
                        item.Accounting_Ledger_Items__r.Category__r.Name === 'Income'
                    );

                    const ledgerItemName = invoiceEntry ? invoiceEntry.Accounting_Ledger_Items__r.Name : null;
                if (invoice.Accounting_Journal_Entry__r && invoice.Accounting_Journal_Entry__r.length > 0) {
                    const entityProfile = invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r;
                    console.log('entityProfile in wiredInvoiceData:', JSON.stringify(entityProfile));
                    if (entityProfile) {
                        companyName = `${entityProfile.First_Name__c || ''} ${entityProfile.Last_Name__c || ''} ${entityProfile.Name__c || ''}`.trim();
                    }
                }
    
                return {
                    Id: invoice.Id,
                    Name: invoice.Name,
                    Status__c: invoice.Status__c,
                    description: firstRowDescription,
                    allDescriptions: sortedDescriptions,
                    ledgerItem: ledgerItemName,
                   // GST__c: invoice.GST__c,
                    GST__c: parseFloat(invoice.GST__c).toFixed(2),
                    Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
                    companyName: companyName || '',  // Assign 'N/A' if no company name is found
                    invoiceNumber: invoice.Invoice_Number__c,
                    amazonUrl: invoice.Amazon_URL__c,
                    invoiceDate: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : ''
                };
            });
    
            console.log(' this.records in wiredInvoiceData:', JSON.stringify(this.records));
            this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
             if (this.totalRecords > 0) {
                    this.paginationVisible = true;
                }
            this.paginationHelper();
            console.log('companyData in wiredCompanyData:', JSON.stringify(this.invoiceTable));
        } else if (error) {
            console.error('Error retrieving company data:', JSON.stringify(error));
            this.error = error.body.message;  // Storing error message
            this.showErrorToast(this.error); // Show error toast if necessary
        }
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
    handleDelete(event) {
      
        this.parentInvId = event.currentTarget.dataset.id;
        this.invoiceDeleteFlag=true;
      
   }
    handleYesDelete(event){
                let tempconList=[];
                deleteRecord(this.parentInvId).then(() => {
                    this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Invoice is deleted successfully',
                        variant: 'success'
                    })
                    );
                    refreshApex(this.wireInvoiceData);
                }); 
                this.paginationHelper();    
                this.invoiceDeleteFlag=false;
    }
    handleDeleteclose(event){
        this.invoiceDeleteFlag=false;
    }
    handleback(){
        this.isInvoiceflag = false;
        this.invoiceflag=true;
        this.handleClear();
        this.backToParent(); 
    }
    readInvoiceDetails(){
        refreshApex(this.wireInvoiceData);  
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
    handleedit(event) {
        this.createEditInvoice='Edit RFQ Sales';
        this.buttonLabel ='Update';
        this.disabledInvoiceNo = true;
        this.salesEntryList = [];
        this.invoiceflag = false;
        this.isInvoiceflag = true;
         this.isShowActivity = true;
        this.currentInvoiceId=event.currentTarget.dataset.id;
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
                    this.postDate = invoice.Post_Date__c;
                    this.dueDate = invoice.Due_Date__c;
                    this.invoiceNo = invoice.Name;
                    this.taxInclusive = entries[0]?.Tax_Inclusive__c || false;
                    this.selectedStatus = invoice.Status__c;
                    this.subTotal = invoice.Sub_Total__c;
                    this.taxAmount = parseFloat(invoice.GST__c).toFixed(2);
                    this.totalAmount = parseFloat(invoice.Total_Amount__c).toFixed(2);
                    this.selectedEntityName = entries[0]?.Entity_Profile__c || '';
                    this.comments = entries[0].Comments__c || '';
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
                        invoiceId: invoice.Id
                    };
                    console.log('Updated salesEntry:', JSON.stringify(this.salesEntry));
                    const validEntries = entries.filter(entry =>
                        entry.Unit_Price__c !== undefined &&
                        entry.Quantity__c !== undefined &&
                        entry.Tax__c !== undefined
                    );
                        console.log('Valid Entries:', validEntries);
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
            this.hideParent(); 
    } 
    
    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isInvoiceflag=false;
        this.invoiceflag=false;
        this.invoiceDeleteFlag=false;
        this.isInvoiceflag=false;
        this.hideParent();
    }

    closeModal() {
        this.isModalOpen = false;
        this.invoiceflag=true;
       
    }
    closeaddPayrollinvoice(){
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isModalOpen = false;
        this.invoiceflag=true;
        this.backToParent();

    }
    // handleSave(){
    //     if (!this.salesEntry.entityName || !this.salesEntry.InvoiceDate || !this.salesEntry.dueDate ||
    //         !this.salesEntry.PostDate || !this.salesEntry.Status
    //             ) {
    //         this.showToast('Error', 'Please Enter the required fields.', 'error');
    //         return;
    //     }
    //     console.log('Sending to Apex for Update:');
    //     console.log('Sales Entry:', JSON.stringify(this.salesEntry));
    //     console.log('Sales Entry List:', JSON.stringify(this.salesEntryList));
    //     console.log('amountarrey : ' + JSON.stringify(this.amountarrey));
      
    //     UpdateDataFromInvoice({
    //         salesEntryJson: JSON.stringify(this.salesEntry),
    //         salesEntryListJson: JSON.stringify(this.salesEntryList),
    //         amountEntryJson: JSON.stringify(this.amountarrey),
    //         isRFQ: this.isRFQ,
    //         isParticipantInvoice: false
    //     })
    //     .then(result => {
    //         console.log('Result from Apex:', result);
    //         const tempInvoiceId = result.Id;  
    //         console.log('Temporary Invoice ID:', tempInvoiceId);
    //         this.showToast('Success', 'Sales Data saved successfully', 'success');
    //         // if (this.buttonLabel === 'Save') {
    //         //     this.showToast('Success', 'Sales Data saved successfully', 'success');
    //         // } else if (this.buttonLabel === 'Update') {
    //         //     this.showToast('Success', 'Update successfully', 'success');
    //         // }
           
    //          //getAccountingInvoiceById({ invoiceId: tempInvoiceId }); 

    //         getAccountingInvoiceById({ invoiceId: tempInvoiceId }).then(response => {
    //             //console.log('data of ', JSON.stringify(response));
    //             this.invRecords = response;
    //             console.log('invoice data for pdf ', JSON.stringify(this.invRecords));
    //             this.generateBase64Data();
    //         });
    //         this.handleClear();
    //         refreshApex(this.wireInvoiceData);
           
    //         this.showToast('Success', 'Update successfully', 'success');
            
    //         // Handle result as needed
    //     })
    //     .catch(error => {
    //         this.showToast('Error', error.body.message, 'error');
    //     });

    //     if (this.deletedRowIds && this.deletedRowIds.length > 0) {
    //         console.log('deletedRowIds:', JSON.stringify(this.deletedRowIds));
    //         deleteInvoiceLines({ deletedIdsJson: JSON.stringify(this.deletedRowIds) })
    //             .then(() => {
    //                 console.log('Deleted rows handled successfully.');
    //                 // Optionally clear deletedRowIds after deletion
    //                 this.deletedRowIds = [];
    //             })
    //             .catch(error => {
    //                 console.error('Error deleting rows:', error);
    //                 this.showToast('Error', 'Failed to delete rows', 'error');
    //             });
    //     }

    // } 
      async handleSave() {
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
                await deleteInvoiceLines({ deletedIdsJson: JSON.stringify(this.deletedRowIds) });
                console.log('Deleted rows handled successfully.');
                this.deletedRowIds = [];
            }
    
            // ✅ Step 3: Save or update invoice
            const result = await UpdateDataFromInvoice({
                salesEntryJson: JSON.stringify(this.salesEntry),
                salesEntryListJson: JSON.stringify(this.salesEntryList),
                amountEntryJson: JSON.stringify(this.amountarrey),
                isRFQ: this.isRFQ,
                isParticipantInvoice: false
            });
    
            console.log('Result from Apex:', result);
            const tempInvoiceId = result.Id;
            console.log('Temporary Invoice ID:', tempInvoiceId);
    
            // ✅ Step 4: Show success toast based on action
            if (isUpdate) {
                this.showToast('Success', 'Data updated successfully', 'success');
            } else {
                this.salesEntry.Status = 'Draft';
                this.showToast('Success', 'Sales data saved successfully', 'success');
            }
    
            // ✅ Step 5: Fetch updated invoice details for PDF
            const response = await getAccountingInvoiceById({ invoiceId: tempInvoiceId });
            this.invRecords = response;
            console.log('invoice data for pdf:', JSON.stringify(this.invRecords));
            this.generateBase64Data();
    
            // ✅ Step 6: Post-update cleanup
            this.companyId = this.salesEntry.company;
            console.log('Updated companyId after save:', this.companyId);
            console.log('Updated Sales Entry List in save:', JSON.stringify(this.salesEntryList));
            this.handleClear();
            refreshApex(this.wireInvoiceData);
    
        } catch (error) {
            console.error('Error in processSaveOrSubmit:', error);
            this.showToast('Error', error.body?.message || 'Something went wrong', 'error');
        }
    }
    // HandleRFQ(event){
    //     // Handle toggle input
    //     if (event.target.type === 'toggle') {
    //         this.isRFQEnabled = event.target.checked;  // Will be true if checked, false if unchecked
           
    //     }
       
    //     console.log('Toggle value: ' + this.isRFQEnabled );
    // }
    hideParent(){
        const event = new CustomEvent('addrfq', {
            detail: { triggerExpenseFlag: true }, // optional payload
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
    backToParent(){
        const event = new CustomEvent('backfromrfq', {
            detail: {}, // You can send data if needed
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event); 
       
    }
    // handleCustomerFocus(event) {
    //     this.activeRowId = event.target.dataset.id;
    //     this.customerShowTable = true;
    //     this.activeRowId =rowId;
    //     //this.fetchLedgerItems();
    //     // Show all ledger items initially or filtered based on existing search term
    //     const row = this.salesEntryList.find(s => s.Id === this.activeRowId);
    //     const searchTerm = row?.accountList?.toLowerCase() || '';

    //     this.FilteredLedgerItems = this.ledgerItems.filter(item => {
    //         return item.accNo.toLowerCase().includes(searchTerm) || item.itemName.toLowerCase().includes(searchTerm);
            
    //     });
    //         console.log('FilteredLedgerItems in focus:', JSON.stringify(this.FilteredLedgerItems));
    // }
    handleDropdownPosition(event) {
        const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
       //const rowId = this.activeRowId;
       this.activeRowId =rowId;
        // this.salesEntryList = this.salesEntryList.map(sales => {
        //         if (sales.Id == rowId) {  // Directly checking with sales.Id
        //             return { 
        //                 ...sales, 
        //                 accountList: ''
                    
        //             };
        //         }
        //         return sales;
        //     });
            const rect = event.currentTarget.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            const top = rect.bottom + scrollY - 46;  // originally -27, now subtracting 19 more
            const left = rect.left + scrollX - 251;  // origin

            this.customerDropdownStyle = `
                position: absolute;
                top: ${top}px;
                left: ${left}px;
                width: 29%;
                max-height: 300px;
                z-index: 1000;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                overflow-y: auto;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `;
            this.customerShowTable = !this.customerShowTable;
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
        const rowId =event.target.dataset.id;
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

        // Filter ledger items
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

    // handleCustomerBlur() {
    //     // Small delay to allow item selection
    //     setTimeout(() => {
    //         this.customerShowTable = false;
    //         this.activeRowId = null;
    //     }, 200);
    // }

    // preventClose(event) {
    //     event.preventDefault();
    // }

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

        console.log('Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
        this.listenForOutsideClick = false;
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
            console.log('this.currentInvoiceId : ' + this.currentInvoiceId);
            this.showHistoryTable = true;
           // this.showHistoryTable = !this.showHistoryTable;
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
                 this.createEditInvoice='Edit RFQ Sales';
                this.buttonLabel ='Update';
              
               // this.salesEntryList = [];
                this.invoiceflag = false;
                this.isInvoiceflag = true;
                this.disabledInvoiceNo = true;
                this.disabledSave = false;
                this.isShowActivity = true; 
            }
}