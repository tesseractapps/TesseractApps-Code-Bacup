import {LightningElement, wire, api, track } from 'lwc';
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
import sendEmail from '@salesforce/apex/InvoiceHandler.sendEmailforInvoiceforSales';
import getAccountingInvoiceInEdit from '@salesforce/apex/InvoiceHandler.getAccountingInvoiceInEdit';
import UpdateDataFromInvoice from '@salesforce/apex/AccountingModuleController.UpdateDataFromInvoice';
import deleteInvoiceLines from '@salesforce/apex/AccountingModuleController.deleteMatchingRecords';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';

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
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
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
    wiredCompanyList;
    wiredEntityProfilesResult;
    @track entryNameOptions=[];
    @track totalEntry = [];
    @track selectedEntityName='';
    @track taxInclusive=true;
    @track terms;
    @track invoiceDate=null;
    @track postDate=null;
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
    @track entryOptions=[{label:'Purchases',value:'Purchases'},{label:'Sales',value:'Sales'}];
    // @track entityOptions= [{label:'Supplier',value:'Supplier'},{label:'Customer',value:'Customer'}];
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
            console.log('Company from localStorage connectedCallback AccountInvoice:', this.companyId, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback AccountInvoice');
        }        
        console.log('companyId in connectedCallback AccountInvoice: ', this.companyId);
        console.log(' companyname in connectedCallback AccountInvoice: ', this.companyname);
        this.addRow();
        this.entryType = 'Sales';
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.edate = last.toISOString().slice(0, 10);
        this.handleInvoiceData();
        //this.invoiceflag=true;
        //refreshApex(this.wireInvoiceData);
        this.isRFQEnabled=false; 
        this.isRFQ=false; 
       // document.addEventListener('click', this.handleOutsideClick);
        window.addEventListener('click', this.handleOutsideClick);
      // console.log('selectedCardType in connectedCallback : '+ this.selectedCardType); 
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
        //IncludeGST: '',
        taxInclusive: true,
        Status: '',
        comments: ''
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
           console.log('companyId in  wire getCompany : ', this.companyId);
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
    @wire(getEntityProfileTax, { entityId: this.selectedEntityName })
    wiredTax(result) {
         console.log('getEntityProfileTax result: ', JSON.stringify(result));
        this.wiredEntityProfilesTax = result; // Store response for refreshApex
        const { data, error } = result;

       if (data && (data.tax || data.accountList)) {
            console.log('selectedEntityName :', this.selectedEntityName); 

            const tax = data.tax;
            const entityAccountList = data.accountList;
            const entityItemId = data.accountItemId;
            const taxValue = this.appendPercentage(tax);

            // this.salesEntryList = this.salesEntryList.map(entry => ({
            //     ...entry,
            //     tax: taxValue,
            //     accountList: entityAccountList || '', // fallback to empty array
            //     accountItemId: entityItemId
            // }));

            if(this.editflag == false){
                 this.salesEntryList = this.salesEntryList.map(entry => ({
                    ...entry,
                    tax: taxValue ? taxValue : (entry.tax || '0%'),
                    accountList: entityAccountList ? entityAccountList : (entry.accountList || ''),
                    accountItemId: entry.accountItemId ? entry.accountItemId : entityItemId
                }));
                  console.log(' Sales Entry List in entity IN EDIT:', JSON.stringify(this.salesEntryList));
            } else {
                this.salesEntryList = this.salesEntryList.map(entry => ({
                    ...entry,
                    tax: taxValue,
                    accountList:entityAccountList,
                    accountItemId:entityItemId
                }));
                  console.log(' Sales Entry List in entity IN CREATE:', JSON.stringify(this.salesEntryList));
            }

            const selectedRow = this.salesEntryList.find(item => item.Id);
            this.selectedOptionTax = selectedRow ? selectedRow.tax : '';        
            this.selectedOptionAL = selectedRow ? selectedRow.accountList : '';
            
            console.log('Tax Value in getEntityProfileTax :', this.selectedOptionTax);
            console.log('selectedOptionAL in getEntityProfileTax :', this.selectedOptionAL);
            console.log(' Sales Entry List in entity:', JSON.stringify(this.salesEntryList));
            this.updateTaxForSelectedRow(this.selectedOptionTax);
        } else {
            // Handle no data or invalid structure
            console.warn('No valid Tax or AccountList received');

            // Prevent undefined from propagating
            this.selectedOptionTax = '';
            this.selectedOptionAL = '';

            this.salesEntryList = this.salesEntryList.map(entry => ({
                ...entry,
                tax: '',
                accountList: '',
            }));
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

            const taxRateFloat = (parseFloat(taxRate) / 100) + 1;

            const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
            const amount = parseFloat(updatedRecord.Amount__c) || 0;
            updatedRecord.calculatedAmount = parseFloat((quantity * amount).toFixed(2));
            updatedRecord.subTotal = parseFloat(updatedRecord.calculatedAmount.toFixed(2));

            const taxableAmount = parseFloat((updatedRecord.subTotal / taxRateFloat).toFixed(2));
            updatedRecord.taxAmount = parseFloat((updatedRecord.subTotal - taxableAmount).toFixed(2));
            updatedRecord.totalAmount = parseFloat((updatedRecord.subTotal + updatedRecord.taxAmount).toFixed(2));
        

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
            accountList: this.selectedOptionAL,
            Quantity__c: 0,
            UnitPrice__c: 0,
            Amount__c: 0,
            tax: this.selectedOptionTax
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
        const rowId = event.currentTarget.dataset.id;  // Keep as string
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
        this.salesEntryList = this.salesEntryList.map((row, index) => ({
            ...row,
            sno: index + 1
        }));
    }
    recalculateTotals() {
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;
    
        this.salesEntryList.forEach(entry => {
            console.log('entry.Amount__c'+entry.Amount__c);
            console.log('entry.Quantity__c'+entry.Quantity__c);
            console.log('entry.tax'+entry.tax);
            const rate = entry.tax.replace('%', '');
            console.log('taxRate==>'+rate);
            const taxRate = (parseFloat(rate) / 100) + 1;
            console.log('taxRate==>'+taxRate);
            console.log('entry.Quantity__c==>' + entry.Quantity__c);
            console.log('entry.Amount__c==>' + entry.Amount__c);
            const quantity = parseFloat(entry.Quantity__c) || 0;
            const amount = parseFloat(entry.Amount__c) || 0;
            const calculatedAmount = quantity * amount;
            console.log('calculatedAmount===>'+calculatedAmount);
            const taxableAmount = parseFloat((calculatedAmount / taxRate).toFixed(2));
            console.log('taxableAmount==>' + taxableAmount);
            const taxAmount = calculatedAmount - taxableAmount;
            console.log('taxAmount==>'+taxAmount);
            this.taxAmount = taxAmount;
            console.log('this.taxAmount==>'+this.taxAmount);
            this.subTotal = calculatedAmount;
            console.log('this.subTotal==>'+this.subTotal);
            this.totalAmount = calculatedAmount + taxAmount;
            totalSubTotal += parseFloat(this.subTotal) ;
            totalTaxAmount += parseFloat(this.taxAmount);
            totalAmount += parseFloat(this.totalAmount);
        });
    
        this.amountarrey = {
            subTotal: totalSubTotal,
            taxAmount: totalTaxAmount,
            totalAmount: totalAmount
        };
    
        this.subTotal = parseFloat(totalSubTotal.toFixed(2));
        this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
        this.totalAmount = parseFloat(totalAmount.toFixed(2));
    
        console.log('✅ Totals recalculated after deletion:', JSON.stringify(this.amountarrey));
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

                if (this.editflag === false) {
                    this.salesEntryList = this.salesEntryList.map(entry => ({
                        ...entry,
                        tax: taxValue ? taxValue : (entry.tax || '0%'),
                        accountList: entityAccountList ? entityAccountList : (entry.accountList || ''),
                        accountItemId: entry.accountItemId ? entry.accountItemId : entityItemId
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
                this.selectedOptionTax = selectedRow ? selectedRow.tax : '';        
                this.selectedOptionAL = selectedRow ? selectedRow.accountList : '';

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
                console.log('selectedEntityName:', this.selectedEntityName);
                this.fetchEntityProfileTax(this.selectedEntityName);
                console.log('this.wiredEntityProfilesTax:', this.wiredEntityProfilesTax);
                console.log('✅ Debug: Wire Tax Data?', this.wiredEntityProfilesTax?.data.tax);
                // Get tax from cached wire if entity is selected and data exists
              if (this.taxInclusive && this.selectedEntityName && this.wiredEntityProfilesTax?.data.tax) {
                    taxValue = this.appendPercentage(this.wiredEntityProfilesTax.data.tax);
                    console.log('Tax fetched from cache:', taxValue);

                    // ✅ Assign tax directly to each row
                    this.salesEntryList = this.salesEntryList.map(entry => ({
                        ...entry,
                        tax: taxValue
                    }));
                } else if (!this.taxInclusive) {
                    taxValue = '0%';
                    this.customerShowTable = false;
                       console.log('taxValue in else:', taxValue);
                    this.salesEntryList = this.salesEntryList.map(entry => ({
                        ...entry,
                        tax: taxValue
                    }));
                }
                // Store the value globally in case it's needed
                this.selectedOptionTax = taxValue;
                

                // ✅ Now recalculate financials for each row
                this.salesEntryList = this.salesEntryList.map(entry => {
                    const updatedEntry = { ...entry };

                    const quantity = parseFloat(updatedEntry.Quantity__c) || 0;
                    const amount = parseFloat(updatedEntry.Amount__c) || 0;
                    updatedEntry.calculatedAmount = parseFloat((quantity * amount).toFixed(2));

                    const rate = updatedEntry.tax?.toString().split(' ')[0].replace('%', '') || '0';
                    const taxRate = parseFloat(rate) / 100;

                    if (this.taxInclusive && !isNaN(taxRate)) {
                        const taxMultiplier = 1 + taxRate;
                        updatedEntry.subTotal = parseFloat(updatedEntry.calculatedAmount.toFixed(2));
                       // updatedEntry.totalAmount = parseFloat((updatedEntry.calculatedAmount / taxMultiplier).toFixed(2));
                       
                        //updatedEntry.subTotal = updatedEntry.calculatedAmount;
                       // updatedEntry.taxAmount = parseFloat((updatedEntry.calculatedAmount - updatedEntry.subTotal).toFixed(2));
                       const taxableAmount = updatedEntry.subTotal / taxMultiplier;
                       updatedEntry.taxAmount = parseFloat((updatedEntry.subTotal - taxableAmount).toFixed(2));
                       updatedEntry.totalAmount = updatedEntry.subTotal + updatedEntry.taxAmount;
                    } else {
                        updatedEntry.subTotal = updatedEntry.calculatedAmount;
                        updatedEntry.taxAmount = 0;
                        updatedEntry.totalAmount = updatedEntry.calculatedAmount;
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

            default:
                console.warn(`Unhandled field name: ${fieldName}`);
                break;
        }
       
    }    
   
      handleSelectionTax(event) {
      
      //  const recordId = event.currentTarget.dataset.id;
         const recordId =event.currentTarget.dataset.id;
        const code = event.currentTarget.dataset.code;
        const rate = event.currentTarget.dataset.rate;
    
        console.log('Record ID in Tax:', recordId);
        console.log('Selected Tax Code:', code);
        console.log('Tax Rate:', rate);
    
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;
    
        // ✅ Update only the selected row in salesEntryList and recalculate all totals
        this.salesEntryList = this.salesEntryList.map(sales => {
            let updatedRecord = { ...sales };
    
            if (String(sales.Id) === this.selectedRowId) {
                updatedRecord.tax = `${rate}`;
                console.log('updatedRecord.tax : '+updatedRecord.tax);
                updatedRecord.taxvalue = rate;
    
                const totalAmount = parseFloat(updatedRecord.Amount__c) || 0;
                console.log('totalAmount in Tax: '+totalAmount);
                const taxRate = (parseFloat(rate) / 100) + 1;
                console.log('taxRate==>' + taxRate);
                console.log('updatedRecord==>' + JSON.stringify(updatedRecord));
                if (updatedRecord.subTotal != null || updatedRecord.subTotal == 'Undefined') {
                    console.log('updatedRecord.Quantity__c==>' + updatedRecord.Quantity__c);
                    console.log('updatedRecord.Amount__c==>' + updatedRecord.Amount__c);
                    const taxableAmount = parseFloat((updatedRecord.subTotal / taxRate).toFixed(2));
                    console.log('taxableAmount==>' + taxableAmount);
                    updatedRecord.taxAmount = parseFloat((updatedRecord.subTotal - taxableAmount).toFixed(2));
                    updatedRecord.totalAmount = parseFloat((updatedRecord.subTotal + updatedRecord.taxAmount).toFixed(2));
                } else {
                    console.log('updatedRecord.Quantity__c==>' + updatedRecord.Quantity__c);
                    console.log('updatedRecord.Amount__c==>' + updatedRecord.Amount__c);

                    const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
                    const amount = parseFloat(updatedRecord.Amount__c) || 0;
            
                    console.log(`Quantity: ${quantity}, Amount: ${amount}`);
            
                    // ✅ Correct Multiplication Calculation
                   // updatedRecord.calculatedAmount = Math.round(quantity * amount);
                    updatedRecord.calculatedAmount = parseFloat((quantity * amount).toFixed(2));
                    console.log('Updated Calculated Amount:', updatedRecord.calculatedAmount);
                    updatedRecord.subTotal = parseFloat(updatedRecord.calculatedAmount.toFixed(2));
                    console.log('updatedRecord.subTotal==>' +  updatedRecord.subTotal);
                    const taxableAmount = parseFloat((updatedRecord.subTotal / taxRate).toFixed(2));
                    console.log('taxableAmount==>' + taxableAmount);
                    updatedRecord.taxAmount = parseFloat((updatedRecord.subTotal - taxableAmount).toFixed(2));
                    updatedRecord.totalAmount = parseFloat((updatedRecord.subTotal + updatedRecord.taxAmount).toFixed(2));
                }
    
                console.log('Updated Tax Amount:', updatedRecord.taxAmount);
                console.log('Updated Total Amount:', updatedRecord.totalAmount);
                
            }
    
            // ✅ Accumulate totals for all records
            totalSubTotal += parseFloat(updatedRecord.subTotal) || 0;
            totalTaxAmount += parseFloat(updatedRecord.taxAmount) || 0;
            totalAmount += parseFloat(updatedRecord.totalAmount) || 0;
    
            return updatedRecord;
        });

        console.log('this.amountarrey==>'+this.amountarrey);
        this.amountarrey = {
            subTotal: totalSubTotal,
            taxAmount: totalTaxAmount,
            totalAmount: totalAmount
        };
        
        //this.salesEntry.push(this.amountarrey); // ✅ Add to array
        console.log('amountarrey : ' + JSON.stringify(this.amountarrey));
        console.log('Updated Sales Entry List handleSelectionTax:', JSON.stringify(this.salesEntryList));
    
        // ✅ Assign updated totals separately
        this.subTotal = totalSubTotal;
        this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
        this.totalAmount = parseFloat(totalAmount.toFixed(2));
    
        this.selectedOptionTax = `${rate}`; // Update UI dropdown
         // Hide dropdown
    
        console.log('Total SubTotal:', this.subTotal);
        console.log('Total Tax Amount:', this.taxAmount);
        console.log('Total Amount in handleSelectionTax:', this.totalAmount);
        console.log('Updated Sales Entry List handleSelectionTax after:', JSON.stringify(this.salesEntryList));
        //console.log('📌 Final Totals:', totalEntry);
        //console.log('✅ Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
        this.showtableTax = false;
         this.listenForOutsideClick = false;
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
        // if(fieldName == 'Description__c'){

        // } 

        if(fieldName == 'Quantity__c'  || fieldName == 'Amount__c' || fieldName == 'Description__c'){
        // ✅ Update the correct record and recalculate totals for all records
        this.salesEntryList = this.salesEntryList.map(sales => {
            console.log('sales.Id:', sales.Id);
            let updatedRecord = { ...sales };
    
            if (sales.Id == this.selectedRowId) {
                updatedRecord[fieldName] = fieldValue;
            }
    
            // ✅ Convert quantity & amount properly
            const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
            const amount = parseFloat(updatedRecord.Amount__c) || 0;
    
            console.log(`Quantity: ${quantity}, Amount: ${amount}`);
    
            // ✅ Correct Multiplication Calculation
            //updatedRecord.calculatedAmount = Math.round(quantity * amount);
            updatedRecord.calculatedAmount = parseFloat((quantity * amount).toFixed(2));
            console.log('Updated Calculated Amount:', updatedRecord.calculatedAmount);
    
            if (this.entryType === 'Sales') {
                updatedRecord.subTotal = parseFloat(updatedRecord.calculatedAmount.toFixed(2));
                console.log('subTotal:', updatedRecord.subTotal);
                console.log('this.selectedOptionTax:', this.selectedOptionTax);
                console.log('sales.tax123:', sales.tax);
                if (this.selectedOptionTax || sales.tax) {
                    console.log('sales.tax=='+sales.tax);
                    if(this.selectedOptionTax == null || this.selectedOptionTax == 'Undefined' || !this.selectedOptionTax){
                        this.selectedOptionTax = sales.tax;
                    }
                    console.log('Selected Tax Option:', this.selectedOptionTax);
    
                    let rate = this.selectedOptionTax.split(' ')[0].replace('%', '');
                    let taxRate = parseFloat(rate);
    
                    if (isNaN(taxRate)) {
                        console.error('Invalid tax rate:', rate);
                        return updatedRecord;
                    }
    
                    // ✅ Corrected Tax Calculation
                    let taxMultiplier = 1 + (taxRate / 100);
                    const taxableAmount = updatedRecord.subTotal / taxMultiplier;
                    updatedRecord.taxAmount = parseFloat((updatedRecord.subTotal - taxableAmount).toFixed(2));
                    updatedRecord.totalAmount = updatedRecord.subTotal + updatedRecord.taxAmount;
    
                    console.log('Tax Amount:', updatedRecord.taxAmount);
                    console.log('Total Amount :', updatedRecord.totalAmount);
                } else {
                    updatedRecord.taxAmount = 0;
                    updatedRecord.totalAmount = updatedRecord.subTotal;
                }
    
                // ✅ Accumulate totals for all records
                totalSubTotal += updatedRecord.subTotal;
                totalTaxAmount += updatedRecord.taxAmount;
                totalAmount += updatedRecord.totalAmount;
                console.log('this.amountarrey BEFORE==>'+JSON.stringify(this.amountarrey));
            this.amountarrey = {
            subTotal: totalSubTotal,
            taxAmount: totalTaxAmount,
            totalAmount: totalAmount
        };
        console.log('this.amountarrey AFTER==>'+JSON.stringify(this.amountarrey));
            }
            console.log('Total Amount before:', this.totalAmount);
            return updatedRecord;
        });
    
        // ✅ Assign total values (rounded to 2 decimal places)
        this.subTotal = parseFloat(totalSubTotal.toFixed(2));
        this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
        this.totalAmount = parseFloat(totalAmount.toFixed(2));
    
        console.log('Total SubTotal:', this.subTotal);
        console.log('Total Tax Amount:', this.taxAmount);
        console.log('Total Amount in handleInputChange:', this.totalAmount);
        console.log('Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    }
    }
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
        // doc.text(invoice.Company__r.Company_Name__c.toUpperCase(), 10, 25);  
        doc.text(this.orgname.toUpperCase(), 10, 25);  
        //console.log('orgname '+this.orgname);     
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
            subTotal += record.Total_Amount__c;
            console.log('subTotal  with added Total_Amount__c : ',subTotal );
        
            result.push([
                record.Description__c,
                record.Quantity__c.toFixed(2),
                record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                record.Tax__c+'%',// Tax column
                record.Total_Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            ]);
        });
        
        
        // Adding subtotal, GST, and total rows
        result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' +  parseFloat(subTotal).toFixed(2)]);
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
    //  console.log('isSalesFlag  in pdf: ', this.isSalesFlag); 
    //  console.log('isRFQEnabled in pdf : ', this.isRFQEnabled); 
    //  console.log('isInvoiceflag in pdf : ', this.isInvoiceflag); 
    //console.log('invoiceflag in pdf : ', this.invoiceflag); 
        //return this.base64string;
    }
    handleClear(){
        //console.log('console in clear');
        //this.companyId = null;
        this.isInvoiceflag = false;
        this.isSalesFlag = true;
        this.isSalesTableFlag = true;
        this.isTitleMenuFlag = true;
        this.isToggleVisible = true;
        this.isRFQEnabled=false;
        this.selectedCardType = '';
        this.selectedEntityName = null;
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.comments = '';
        this.selectedStatus = null;
        this.salesEntryList = [];  
    //this.showtable = false; 
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
        //IncludeGST: '',
        taxInclusive:false,
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
        if(!this.taxInclusive){
              this.showtableTax  = false;
          } 
    
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
        this.selectedCardType = 'Customer';
        this.isInvoiceflag = true;
        //this.salesClass = true;
        this.isTitleMenuFlag = false;
        this.isToggleVisible = false;
        this.isSalesFlag = false;
        this.isSalesTableFlag =false;
        //this.taxInclusive = true;
        this.salesEntry = {
            company: this.companyId,
            entryType: 'Sales',
            entityName: '',
            InvoiceDate: '',
            PostDate: '',
            InvoiceNo: '',
            //IncludeGST: '',
            taxInclusive:true,
            Status: '',
            comments: '',
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
                
                if (invoice.Accounting_Journal_Entry__r && invoice.Accounting_Journal_Entry__r.length > 0) {
                    const entityProfile = invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r;
                    if (entityProfile) {
                        companyName = `${entityProfile.First_Name__c || ''} ${entityProfile.Last_Name__c || ''} ${entityProfile.Name__c || ''}`.trim();
                    }
                }
                
    
                return {
                    Id: invoice.Id,
                    Name: invoice.New_Format_Invoice_No__c,
                    Status__c: invoice.Status__c,
                    GST__c: parseFloat(invoice.GST__c).toFixed(2),
                    Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
                    companyName: companyName || 'N/A',  // Assign 'N/A' if no company name is found
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
        this.isSalesFlag = true;
        this.isSalesTableFlag = true;
        this.isTitleMenuFlag = true;
        this.isToggleVisible = true;
        this.isRFQEnabled=false;
        this.handleClear();

    }
    readInvoiceDetails(){
        refreshApex(this.wireInvoiceData);  
    }

   /* handleedit(event) {
        this.createEditInvoice='Edit Sales';
        this.buttonLabel ='Update';
        this.selectedCardType = 'Customer';
        this.isInvoiceflag = true;
        this.isSalesFlag = false;
        this.isSalesTableFlag = false;
        this.isTitleMenuFlag = false;
        //this.isToggleVisible = false;
        this.isRFQEnabled=false;
        this.currentInvoiceId=event.currentTarget.dataset.id;
        console.log('currentInvoiceId: ' + this.currentInvoiceId);
        getAccountingInvoiceInEdit({ invoiceId: this.currentInvoiceId})
            .then(result => {
                console.log('Result of edit: ' + JSON.stringify(result));
                this.salesEntryList = [];
                // this.isSalesFlag = false;
                // this.isInvoiceflag = true;
    
                if (result && result[0]) {
                   
                    this.companyId= result[0].Company__c;
                    refreshApex(this.wiredEntityProfilesResult);
                    this.invoiceDate = result[0].Invoice_Date__c;
                    this.postDate = result[0].Post_Date__c;
                    this.invoiceNo = result[0].Invoice_No__c;
                    //this.gstType = result[0].Include_GST__c;
                    this.taxInclusive = result[0].Accounting_Journal_Entry__r[0].Tax_Inclusive__c;
                    //console.log(' this.taxInclusive IN EDIT==>'+  result[0].Accounting_Journal_Entry__r[0].Tax_Inclusive__c);
                    //console.log(' this.taxInclusive IN EDIT==>'+ this.taxInclusive);
                    this.selectedStatus = result[0].Status__c;
                    this.subTotal = result[0].Sub_Total__c;
                    this.taxAmount = result[0].GST__c;
                    this.totalAmount = parseFloat(result[0].Total_Amount__c).toFixed(2);;
                    this.selectedEntityName = result[0].Accounting_Journal_Entry__r?.[0]?.Entity_Profile__c || '';
                   console.log('result[0].Entity_Profile__c==>'+result[0].Entity_Profile__c);
                    this.salesEntry = {
                        company: this.companyId || '',
                        entryType: 'Sales',  
                        entityName: this.selectedEntityName,
                        InvoiceDate: this.invoiceDate || '',
                        PostDate: this.postDate || '',
                        InvoiceNo: this.invoiceNo || '',
                        //IncludeGST: this.gstType || '',
                        taxInclusive: this.taxInclusive || false,
                        Status: this.selectedStatus || '',
                        invoiceId: result[0].Id                        
                    };
                    console.log('Updated salesEntry:', JSON.stringify(this.salesEntry));
                    if (result[0].Accounting_Journal_Entry__r) {
                        
                        const validEntries = result[0].Accounting_Journal_Entry__r.filter(entry =>
                            entry.Unit_Price__c !== undefined &&
                            entry.Quantity__c !== undefined &&
                            entry.Tax__c !== undefined
                        );
    
                       
                        validEntries.forEach(entry => {
                            const newRow = {
                                Id: entry.Id,
                                sno: entry.Sl_no__c,
                                Description__c: entry.Description__c || '',
                                // accountList: entry.Accounting_Ledger_Items__r?.Account_Number__c || '' + 
                                //              entry.Accounting_Ledger_Items__r?.Name || '',

                                accountList: entry.Accounting_Ledger_Items__r ? ` ${entry.Accounting_Ledger_Items__r.Account_Number__c} ${entry.Accounting_Ledger_Items__r.Name}`: '',
                                Quantity__c: entry.Quantity__c || 0,
                                Amount__c: entry.Unit_Price__c || 0,
                                tax: entry.Tax__c ? `${entry.Tax__c}%` : '',
                                accountItemId: entry.Accounting_Ledger_Items__c || ''
                            };
    
                            this.salesEntryList = [...this.salesEntryList, newRow];
                        });
                        
    
                        console.log('Updated salesEntryList IN EDIT:', JSON.stringify(this.salesEntryList));
                        this.amountarrey = {
                            subTotal: this.subTotal,
                            taxAmount: this.taxAmount,
                            totalAmount: this.totalAmount
                        };
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching invoice details:', error);
            });
    } */
    
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
                this.postDate = invoice.Post_Date__c;
                this.invoiceNo = invoice.Invoice_No__c;
                this.taxInclusive = entries[0]?.Tax_Inclusive__c || false;
                this.selectedStatus = invoice.Status__c;
                this.subTotal = invoice.Sub_Total__c;
                this.taxAmount = parseFloat(invoice.GST__c).toFixed(2);
                this.totalAmount = parseFloat(invoice.Total_Amount__c).toFixed(2);
                this.selectedEntityName = entries[0]?.Entity_Profile__c || '';

               // refreshApex(this.wiredEntityProfilesResult);

                this.salesEntry = {
                    company: this.companyId || '',
                    entryType: 'Sales',
                    entityName: this.selectedEntityName,
                    InvoiceDate: this.invoiceDate || '',
                    PostDate: this.postDate || '',
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

                validEntries.forEach(entry => {
                    const ledgerItem = entry.Accounting_Ledger_Items__r || {};
                    const newRow = {
                        Id: entry.Id,
                        sno: entry.Sl_no__c,
                        Description__c: entry.Description__c || '',
                        accountList: ledgerItem.Account_Number__c && ledgerItem.Name
                            ? `${ledgerItem.Account_Number__c} ${ledgerItem.Name}`
                            : '',
                        Quantity__c: entry.Quantity__c || 0,
                        Amount__c: entry.Unit_Price__c || 0,
                        tax: entry.Tax__c ? `${entry.Tax__c}%` : '',
                        accountItemId: entry.Accounting_Ledger_Items__c || ''
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

        this.editflag =false;
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
    handleSave(){

        if (!this.salesEntry.entityName || !this.salesEntry.InvoiceDate || 
            !this.salesEntry.PostDate || !this.salesEntry.Status
                ) {
            this.showToast('Error', 'Please complete the required fields before saving.', 'error');
            return;
        }
        console.log('Sending to Apex for Update:');
        console.log('Sales Entry:', JSON.stringify(this.salesEntry));
        console.log('Sales Entry List in save:', JSON.stringify(this.salesEntryList));
        console.log('amountarrey : ' + JSON.stringify(this.amountarrey));

        UpdateDataFromInvoice({
            salesEntryJson: JSON.stringify(this.salesEntry),
            salesEntryListJson: JSON.stringify(this.salesEntryList),
            amountEntryJson: JSON.stringify(this.amountarrey),  
            isRFQ: this.isRFQ,
            isParticipantInvoice: false
        })
        .then(result => {
            console.log('Result from Apex:', result);
            const tempInvoiceId = result.Id;  
            console.log('Temporary Invoice ID:', tempInvoiceId);
            this.showToast('Success', 'Sales Data saved successfully', 'success');
             //getAccountingInvoiceById({ invoiceId: tempInvoiceId }); 

            getAccountingInvoiceById({ invoiceId: tempInvoiceId }).then(response => {
                //console.log('data of ', JSON.stringify(response));
                this.invRecords = response;
                console.log('invoice data for pdf ', JSON.stringify(this.invRecords));
                this.generateBase64Data();
            });
            this.companyId = this.salesEntry.company;  // Assuming salesEntry contains the correct companyId
            console.log('Updated companyId after save:', this.companyId);
            console.log('updated Sales Entry List:', JSON.stringify(this.salesEntryList));
            this.handleClear();
            refreshApex(this.wireInvoiceData);
            this.showToast('Success', 'Update successfully', 'success');
            // Handle result as needed
        })
        .catch(error => {
            this.showToast('Error', error.body.message, 'error');
        });
        // console.log('deletedRowIds BEFORE:', JSON.stringify(this.deletedRowIds));
        // if (this.deletedRowIds && this.deletedRowIds.length > 0) {
        //     console.log('deletedRowIds:', JSON.stringify(this.deletedRowIds));
        //     deleteInvoiceLines({ deletedIdsJson: JSON.stringify(this.deletedRowIds) })
        //         .then(() => {
        //             console.log('Deleted rows handled successfully.');
        //             // Optionally clear deletedRowIds after deletion
        //             this.deletedRowIds = [];
        //         })
        //         .catch(error => {
        //             console.error('Error deleting rows:', error);
        //             this.showToast('Error', 'Failed to delete rows', 'error');
        //         });
        // }

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
                // this.gstType = null;
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
    //  handleCustomerFocus(event) {
    //     this.activeRowId = event.target.dataset.id;
    //     this.customerShowTable = true;
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
    this.activeRowId =rowId;
    // this.salesEntryList = this.salesEntryList.map(sales => {
    //         if (sales.Id == rowId) {  // Directly checking with sales.Id
    //             return { 
    //                 ...sales, 
    //                 accountList: this.selectedOptionAL
                   
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

    console.log('Updated Sales Entry List handleCustomerSelection :', JSON.stringify(this.salesEntryList));
        this.listenForOutsideClick = false;
    }

    @track invoiceEmailFlag = false;
    @track toAddress = '';
    @track ccAddress = '';
    @track invoiceIdforEmail;
    @track urlforEmail;
    @track invoiceDateforEmail;
    handleEmailAction(event) {
        const invoiceId = event.currentTarget.getAttribute('data-id');
        const amazonUrl = event.currentTarget.getAttribute('data-url');
        const invoiceDate = event.currentTarget.getAttribute('data-invoicedate');

        this.invoiceIdforEmail = invoiceId;
        this.urlforEmail = amazonUrl;
        this.invoiceDateforEmail = invoiceDate;
        console.log('Invoice ID:', invoiceId);
        console.log('URL:', amazonUrl);
        console.log('Invoice Date:', invoiceDate);
        this.invoiceEmailFlag = true;
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
            ccAddress: this.ccAddress,
            url: this.urlforEmail,
            invoiceDate: new Date(this.invoiceDateforEmail)
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

}