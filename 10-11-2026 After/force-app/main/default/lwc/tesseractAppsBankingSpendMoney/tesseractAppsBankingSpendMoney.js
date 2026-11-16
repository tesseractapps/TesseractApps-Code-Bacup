import { LightningElement, track, api, wire } from 'lwc';
//import My_Resource from "@salesforce/resourceUrl/myResource";
 import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
//import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
import getLedgerItemsAssetsLiabilities from '@salesforce/apex/AccountingBankingController.getLedgerItemsAssetsLiabilities';
import getInvoicesBasedOnEntity from '@salesforce/apex/AccountingBankingController.getInvoicesBasedOnEntity';
//import updateEntityPaymentInvoices from '@salesforce/apex/AccountingBankingController.updateEntityPaymentInvoices';
import createPaymentWithInvoiceUpdates from '@salesforce/apex/AccountingBankingController.createPaymentWithInvoiceUpdates';
import updateLedgerItemId from '@salesforce/apex/AccountingBankingController.updateLedgerItemId';
import getAccountingPaymentPdf from '@salesforce/apex/AccountingBankingController.getAccountingPaymentPdf';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
//import Amount from '@salesforce/schema/Opportunity.Amount';
//import Amount from '@salesforce/schema/Opportunity.Amount';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
//import getAllLedgerItems from '@salesforce/apex/AccountingChartController.getAllLedgerItems';
import { refreshApex } from '@salesforce/apex';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import autoTable from '@salesforce/resourceUrl/autotable'
import robotoFont from '@salesforce/resourceUrl/Roboto';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
//import jsPDFResource from '@salesforce/resourceUrl/jspdf';
//import autoTableResource from '@salesforce/resourceUrl/autotable';
import getentityEmailForPaymentInvoices from '@salesforce/apex/AccountingBankingController.getentityEmailForPaymentInvoices';
import getEmailBodyforParentInvoices from '@salesforce/apex/AccountingBankingController.getEmailBodyforParentInvoices';
import sendEmailforInvoicePayments from '@salesforce/apex/AccountingBankingController.sendEmailforInvoicePayments';
import saveOverpaymentRecord from '@salesforce/apex/AccountingBankingController.saveOverpaymentRecord';
import getNextOverpaymentNumber from '@salesforce/apex/AccountingBankingController.getNextOverpaymentNumber';

export default class TesseractAppsBankingSpendMoney extends LightningElement {
   @track selectedCompany;
   @track companyname;
   wiredEntityProfilesResult;
   wiredInvoicesResult;
  // wiredEntityProfilesTax
   //@track paymentType = 'Cash Payment';
   @track isEntityFlag = true;
   @track entityNameOptions=[];
   @track entityName='';
   @track date;
   @track payee;
   @track amount;
   @track entryType = 'Purchases';
   @track customerDropdownStyle = '';
   @track toggleDropdownAccount = '';
    customerShowTable = false;
    FilteredLedgerItemsNew = [];
    FilteredLedgerItems = [];
    customerSelectedAccountId = '';
    activeRowId = '';
   @track ledgerItemsNew = [];
   @track ledgerItems = []; 

   @track invoiceRecordsTable = []; 
   @track selectedOptionCategory;
   @track selectedOptionAmount;
   @track isAllSelected = false;
   //@track rowTaxAmount=0;
   @track totalAllocated=0;
   @track totalPaid = 0;
   @track outOfBalance =0;
   @track disabledSubmit = true;
   @track selectedCount;
   @track isEntityPayment = true;
   //@track isCashPayment = true;
   @track invoiceNumber;
   @track invoiceName;
   @track invoiceDate;
   @track comments;
   @track cashPaymentAmount;
   @track salesEntryList = [];
   @track showtable = false;  
   @track showtableTax = false;  
   @track filteredTaxCodes = [];
   @track deletedRowIds = [];
   @track taxInclusive=false;
   @track selectedLedgerItemId;
   //@track paymentTypeOptions = [{label:'Cash Payment',value:'Cash Payment'},{label:'Entity Payment',value:'Entity Payment'}];
   @track selectedOptionALNew ='';
   @track taxDropdownStyle;
   @track isEditing =  false;
   // @track disabledAddRow = false;
   @track showInvoiceTable = true;
   // @track showAddOverPayment= false;
   @track isRemittanceFlag=false;
   @track selectedSubmitOption;
    @track invoiceEmailFlag = false;
    @track toAddress = '';
    @track ccAddress = '';
    @track parentIdforEmail;
    @track urlforEmail;
    @track invoiceDateforEmail;
    @track invoiceType;
    @track invoiceStartDate;
    @track invoiceEndDate;
    @track isSpendMoney = true;
     @track orgname;
     @track accountNo;
    @track bsb;
    @track bank;
    @track accountName;
    @track invRecords=[];
    @track paymentDetails=[];
    @track invoiceData;
   // @track urlforEmail;
    @track invoiceEmailFlag = false;
    @track toAddress = '';
    @track ccAddress = '';
    @track overPaymentAmount;
   // @track invoiceIdforEmail;
    
   //@track disableGo=true;
    //coming = My_Resource + '/myResource/images/Livesoon.png';
    @track entryOptions=[{label:'Sales',value:'Sales'} , {label:'Purchases',value:'Purchases'}];
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
    // @track  submitOptions = [
    //     { label: "Without Remittance", value: "WithoutRemittance" },
    //     { label: "With Remittance", value: "WithRemittance" },
    
    // ];
    rewards = My_Resource + '/myResource/images/invoice.svg';
    get submitOptions() {
        return [
          { label: "Submit Without Remittance", value: "WithoutRemittance" },
          { label: "Submit With Remittance", value: "WithRemittance" }
        ];
    }
   connectedCallback(){

        console.log("TesseractAppsAccountingBankFeed");
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.selectedCompany  = storedCompanyId;
            this.companyname = storedCompanyName;
            console.log('Company from localStorage connectedCallback bank feed:', this.selectedCompany, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback bank feed');
        }        
        console.log("this.companyname in bank feed"+this.companyname);
        //console.log("this.companyid in bank feed"+this.companyid);
        console.log("this.selectedCompany in bank feed"+this.selectedCompany);
         //this.addRow();
           const today = new Date();
            this.date = today.toISOString().slice(0, 10);
          
            this.handleInvoiceData();
        window.addEventListener('click', this.handleOutsideClick);
   }
   disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
    }
     renderedCallback() {
        if (this.jsPDFInitialized) {
         return; // Prevent reloading scripts multiple times
     } 
       Promise.all([
         // loadScript(this, Dompurify),
         
           loadScript(this, jsPDF),
          loadScript(this, autoTable),
        //  loadScript(this, jsPDFResource),
        //  loadScript(this, autoTableResource),
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
    @track listenForOutsideClick = false;
     handleOutsideClick = (event) => {
        if (this.listenForOutsideClick) {
           
             const dropdownElement3 = this.template.querySelector('[data-id="accountListTableDropdown"]');
            if (dropdownElement3 && !dropdownElement3.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.customerShowTable = false;
                this.listenForOutsideClick = false;
            }
             const dropdownElement1 = this.template.querySelector('[data-id="accountListTableDropdown1"]');
            if (dropdownElement1 && !dropdownElement1.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.showtable = false;
                this.listenForOutsideClick = false;
            }
            const dropdownElement = this.template.querySelector('[data-id="taxTableDropdown"]');
            if (dropdownElement && !dropdownElement.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.showtableTax = false;
                this.listenForOutsideClick = false;
            }
        }
    };
   
    
    @track highestTaxAmount = 0;
    //@track overPayment = null;
   
   @wire(getEntityProfiles, {companyId: '$selectedCompany' , entryType:'$entryType' })
    wiredEntityProfiles(result) {
        this.wiredEntityProfilesResult = result; // Store response for refreshApex
        const { data, error } = result;
        console.log('Filtered entity options result: ', JSON.stringify(result));
        if (data) {
            console.log('Filtered entity options: ', JSON.stringify(data));
            this.entityNameOptions = data.map(entity => {
                const name = entity.Name__c
                    ? entity.Name__c
                    : `${entity.First_Name__c || ''} ${entity.Last_Name__c || ''}`.trim();

                // Only return the object if name is not empty
                return name ? { label: name, value: entity.Id } : null;
            })
            .filter(option => option !== null); // Remove null values
            this.error = undefined;
            console.log('Filtered entryNameOptions options: ', JSON.stringify( this.entryNameOptions));
        
        } else if (error) {
            this.error = error;
            console.error('Error fetching entity profiles:', error);
        }
    }
   
    @wire(getInvoicesBasedOnEntity, { companyId: '$selectedCompany', entityId: '$entityName' })
    wiredInvoices(result) {
        console.log('getInvoicesBasedOnEntity result: ');
        console.log('entityName :', this.entityName);
        console.log('getInvoicesBasedOnEntity result: ', JSON.stringify(result));
        this.wiredInvoicesResult = result; // Store response for refreshApex
        const { data, error } = result;
        if (!this.entityName) {
            console.log('⛔ No entity selected → skipping invoice load');
            this.invoiceRecordsTable = [];
            return;
        }
        if (data) {
              console.log('getInvoicesBasedOnEntity INSIDE IF  result: ');
            this.invoiceRecordsTable = []; // Initialize first
            const excludedLedgerItems = ['GST Paid', 'Trade Creditors'];
             data.forEach(invoice => {
                const journalEntries = invoice.Accounting_Journal_Entry__r || [];
                const invoiceEntry = journalEntries.find(
                    item =>
                        item.Sl_no__c === 1 &&
                        item.Accounting_Ledger_Items__r &&
                        item.Accounting_Ledger_Items__r.Category__r &&
                        !excludedLedgerItems.includes(item.Accounting_Ledger_Items__r.Name)
                    );

                    const ledgerItemName = invoiceEntry ? invoiceEntry.Accounting_Ledger_Items__r.Name : null;
                    console.log('ledgerItemName : ', ledgerItemName);
                    console.log('invoiceEntry :', invoiceEntry);
           
                    this.invoiceRecordsTable.push({
                        Id: invoice.Id,
                        invoiceNo:invoice.Invoice_No__c,
                        invoiceAutoNo:invoice.Name,
                        invoiceDate:invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
                        invoiceAmount: invoice.Total_Amount__c != null && !isNaN(invoice.Total_Amount__c)
                            ? `$${parseFloat(invoice.Total_Amount__c).toFixed(2)}`
                            : null,
                       
                        invoicePaid: invoice.Amount_Paid__c != null && !isNaN(invoice.Amount_Paid__c)
                            ? `$${parseFloat(invoice.Amount_Paid__c).toFixed(2)}`
                            : `$0.00`,
                         toPay: `$0.00`,
                        //  originalInvoicePaid: invoice.Amount_Paid__c || '$0.00',
                        //  originalBalance: invoice.Balance_Amount__c || '$0.00',
                        originalBalance: 
                            invoice.Balance_Amount__c != null && !isNaN(invoice.Balance_Amount__c)
                                ? Number(invoice.Balance_Amount__c)
                                : Number(invoice.Total_Amount__c),
                        originalInvoicePaid:
                            invoice.Amount_Paid__c != null && !isNaN(invoice.Amount_Paid__c)
                                ? Number(invoice.Amount_Paid__c)
                                : 0,
                        // balance: invoice.Total_Amount__c != null && !isNaN(invoice.Total_Amount__c)
                        //     ? `$${parseFloat(invoice.Total_Amount__c).toFixed(2)}` // balance = full amount
                        //     : null,
                         balance: invoice.Balance_Amount__c != null && !isNaN(invoice.Balance_Amount__c)
                            ? `$${parseFloat(invoice.Balance_Amount__c).toFixed(2)}` 
                            :  `$${parseFloat(invoice.Total_Amount__c).toFixed(2)}`,
                            // balance: invoice.Balance_Amount__c != null && !isNaN(invoice.Balance_Amount__c)
                            // ? `$${parseFloat(invoice.Balance_Amount__c).toFixed(2)}`
                            // : null,

                       // tax: invoice.GST__c || 0,
                       // ledgerItem: ledgerItemName,
                       // entries: childEntries,
                        isSelected: false,
                        isEditing: false,
                        isEditIcon: false,
                        //isExpanded: false,
                        //hasDetails: false
                    });
                     console.log('invoiceRecordsTable result: ', JSON.stringify(this.invoiceRecordsTable));
                });
        
        } else if (error) {
            console.error('Error in wiredInvoices: ', error);
        }
    }
    
    appendPercentage(taxValue) {
        // Assuming taxValue is already a number (like 10 for 10%)
        if (taxValue != null) {
            return `${taxValue}%`; // Append '%' to the number
        }
        return '0%'; // If no tax value, return '0%'
    }
     handleSpenMoneyChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        // const fieldChecked = event.target.checked;

        // const isToggle = event.target.type === 'toggle';
        // const valueToSet = isToggle ? fieldChecked : fieldValue;
        console.log(`Updated Field - ${fieldName}:`, fieldValue);
      
         switch (fieldName) {
           
            case 'entityName':
                this.entityName = fieldValue;
                console.log('this.entityName in onchange: ' + this.entityName);
                 refreshApex(this.wiredInvoicesResult);
                 //this.showAddOverPayment= true;
                break;
            case 'date':
                 this.date = fieldValue;
                console.log('date:', this.date);
                break;
    
            case 'payee':
                this.payee = fieldValue;
                console.log('this.payee in onchange: ' + this.payee);
                break;

            case 'amount':
                this.amount = fieldValue;
                console.log('this.amount in onchange: ' + this.amount);
                // setTimeout(() => {
                //        this.reCalculateAmount();
                // }, 2000);
                this.totalAllocated = this.amount;
               

                console.log('this.totalAllocated in  amount onchange: ' + this.totalAllocated);
                console.log('this.totalPaid in  amount onchange: ' + this.totalPaid);
                if(this.totalAllocated && this.totalPaid){
                    this.outOfBalance = parseFloat((this.totalAllocated - this.totalPaid).toFixed(2));
                    console.log('this.outOfBalance in onchange: ' + this.outOfBalance);
                } else {
                    this.outOfBalance = 0;
                }
                
                console.log('this.isAllSelected in onchange total paid : ' + this.isAllSelected);
                if(this.isAllSelected && (this.selectedCount === 1)){
                    this.disabledSubmit = false;
                    console.log('isAllSelected  and selectedCount === 1 then  → disabledSubmit = false');
                } else if(this.isAllSelected || (this.selectedCount > 1)){
                    console.log('All checkboxes are selected or more than one selected ');
                    if( this.outOfBalance==0 && this.totalPaid){
                        this.disabledSubmit = false;
                        console.log('outOfBalance is 0 → disabledSubmit = false');
                    }else{
                        this.disabledSubmit = true;
                        console.log('outOfBalance is NOT 0 → disabledSubmit = true');
                    }
                } else {
                   // if(this.totalPaid && )
                    //this.disabledSubmit = false;
                    //console.log('Not all checkboxes selected → disabledSubmit = false');
                    console.log('Not all checkboxes selected ');

                }
                 this.handleAmountChangedRevalidateOP();
                if (!this.amount) {
                   
                    this.outOfBalance = 0;
                   
                    return;
                }
                 break;
               
            default:
                console.warn(`Unhandled field name: ${fieldName}`);
                break;
 
        }
          console.log('this.outOfBalance in onchange last: ' + this.outOfBalance);
       
    } 
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    } 
   
    handleAmountChangedRevalidateOP() {
        console.log("📌 Amount changed → clearing all invoice selections...");

        // 1️⃣ Remove OP row if exists
        this.removeOverpaymentRow();

        // 2️⃣ Reset ALL rows completely
        this.invoiceRecordsTable = this.invoiceRecordsTable.map(row => {
            return {
                ...row,
                isSelected: false,
                isEditIcon: false,
                isEditing: false,
                toPay: '$0.00',
                toPayValue: 0,
                invoicePaid: `$${(row.originalInvoicePaid ?? 0).toFixed(2)}`,
                balance: `$${(row.originalBalance ?? 0).toFixed(2)}`
            };
        });

        // 3️⃣ Reset totals
        this.totalPaid = 0;
        //this.totalAllocated = 0;
        this.outOfBalance=0;

        console.log("✔ All rows cleared due to amount change.");
    }

     fetchItems() {
        console.log('Calling Apex Method: fetchItems...');
        console.log('companyId in fetchItems: ' + this.selectedCompany);

        // Call the Apex method and pass companyId as parameter
        getLedgerItemsAssetsLiabilities({ companyId: this.selectedCompany })
            .then(result => {
                console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

                // Process the data and map it to a proper format
                this.ledgerItemsNew = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                    amount: item.Amount__c || 0,

                }));

                console.log('Processed Ledger Items:', JSON.stringify(this.ledgerItemsNew));
                this.FilteredLedgerItemsNew = this.ledgerItemsNew;
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }  
    handleDropdownPosition(event) {
        const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        this.activeRowId =rowId;
        
        
        const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
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
        this.customerShowTable = !this.customerShowTable;
        this.fetchItems();
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
    handleCustomerSelection(event) {
        const recordId = event.currentTarget.dataset.id;      // ID of selected ledger item
        const accountNumber = event.currentTarget.dataset.accno;  
        const accountValue = event.currentTarget.dataset.value;   
        const category = event.currentTarget.dataset.category;  
        const amount = event.currentTarget.dataset.amount;   
        const rowId = this.activeRowId; // ID of the row currently being edited

        console.log('Selected Record ID:', recordId);
        console.log('Account Number:', accountNumber);
        console.log('Account Value:', accountValue);
        console.log('Account amount:', amount);
        console.log('Account category:', category);
        console.log('Active Row ID:', rowId);
        this.selectedOptionALNew = `${accountNumber} - ${accountValue}` ;
        this.selectedOptionCategory = category;
        this.selectedOptionAmount = amount;
        this.selectedLedgerItemId = recordId;
        console.log('Selected Option AL:', this.selectedOptionALNew);
        console.log('selectedOptionCategory:', this.selectedOptionCategory);
        console.log('selectedOptionAmount:', this.selectedOptionAmount);
        console.log('selectedLedgerItemId:', this.selectedLedgerItemId);
        // Hide dropdown and reset active row
        this.customerShowTable = false;
        //this.activeRowId = null;
       // console.log('Updated Sales Entry List handleCustomerSelection :', JSON.stringify(this.salesEntryList));
        this.listenForOutsideClick = false;
    }
    recalculateTotals() {
        console.log(' recalculateTotals :');
        console.log('disabledSubmit in recalculateTotals  start:', this.disabledSubmit);
        let totalAmount = 0;
       // let totalTax = 0;
        let totalPaid = 0;
        this.outOfBalance=0;
        console.log('Updated invoiceRecordsTable IN recalculateTotals:', JSON.stringify(this.invoiceRecordsTable));
        this.invoiceRecordsTable.forEach(row => {
            if (row.isSelected) {
           
                let amountValue = typeof row.invoiceAmount === 'string'
                ? parseFloat(row.invoiceAmount.replace('$', '')) 
                : Number(row.invoiceAmount);
            

                totalAmount += isNaN(amountValue) ? 0 : amountValue;
                let toPayValue = typeof row.toPayValue === 'string'
                    ? parseFloat(row.toPayValue.replace('$', ''))
                    : Number(row.toPayValue);
                totalPaid += isNaN(toPayValue) ? 0 : toPayValue;
            } 
        });

       
        this.totalPaid = parseFloat(totalPaid.toFixed(2));
        console.log(' totalPaid in recalculateTotals :', this.totalPaid);
        console.log(' totalAllocated in recalculateTotals :', this.totalAllocated);
        if(this.totalPaid){
            this.outOfBalance = this.totalAllocated - this.totalPaid;
        }
        if (this.totalPaid !==0 && this.outOfBalance == 0 && this.outOfBalance !=null) {
            this.disabledSubmit = false;
            console.log('totalPaid is not zero AND outOfBalance is 0 → disabledSubmit = false in count=1');
        } else {
            this.disabledSubmit = true;
            console.log('Either totalPaid is zero or outOfBalance != 0 → disabledSubmit = true  in count=1');
        }
       // console.log('Recalculated Total Allocated:', this.totalAllocated);
        console.log('disabledSubmit in recalculateTotals :', this.disabledSubmit);
        console.log('Recalculated Out of Balance in recalculateTotals:', this.outOfBalance);
    }
    handleSupplierSearch(event) {
        //const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        const inputValue = event.target.value;
        const searchLower = inputValue.toLowerCase();
        const rowId = event.target.dataset.id;
    // const rowId = this.activeRowId;
        console.log('Search Row ID:', rowId, 'Input:', inputValue);
        this.selectedOptionALNew =inputValue;
      
        const filtered = this.ledgerItemsNew.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            return accNo.includes(searchLower) || itemName.includes(searchLower) || combined.includes(searchLower);
        });
        console.log('Filtered Items:', filtered);
        this.FilteredLedgerItemsNew = filtered;
        this.activeRowId = rowId;
        this.customerShowTable = true;
    }
    handleSelectAll(event) {
        const isChecked = event.target.checked;
         if (!isChecked) {
            this.removeOverpaymentRow();
        }
        // Set the isSelected property of all rows to the state of the master checkbox
        this.invoiceRecordsTable = this.invoiceRecordsTable.map(row => {
            const paid = row.originalInvoicePaid ?? 0;
            const bal  = row.originalBalance ?? 0;
            if (!isChecked) {
            //    this.removeOverpaymentRow();
                return {
                    ...row,
                    isSelected: isChecked,
                    isEditIcon: isChecked,
                    toPay: `$0.00`,
                    toPayValue: 0,
                    isEditing: false,
                    //balance: row.invoiceAmount,
                    invoicePaid: `$${paid.toFixed(2)}`,
                    balance: `$${bal.toFixed(2)}`
                   // isExpanded: false,
                    //hasDetails: false,
                    // entries: row.entries.map(entry => ({
                    //     ...entry,
                    //     paid: `$0.00`,
                    //     paidValue: 0,
                    //     balance: entry.amount,
                    //     isSelected: false,
                    //     isEditIcon: false
                    // }))
                };
            } else {
                return {
                    ...row,
                    isSelected: true,
                    isEditIcon: true
                    // Keep existing paid info on select
                };
            }

        });

        // Update the master checkbox state
        this.isAllSelected = isChecked;
        if (!isChecked) {
           // this.removeOverpaymentRow();
            // Collapse all invoices
            this.invoiceRecordsTable = this.invoiceRecordsTable.map(row => ({
                ...row,
               // isExpanded: false,
                //hasDetails: false
            }));
        }
        //this.totalPaid =0;
        //this.outOfBalance = 0;
        this.recalculateTotals();
        this.updateMasterCheckboxState();
        console.log('outOfBalance in handleSelectAll:, ',this.outOfBalance);
    }
    handleRadioSelection(event) {
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;
        if (!isChecked) {
            this.removeOverpaymentRow();
        }
        if (!this.amount) {
            console.error('❌ Error: please enter Amount');
            //throw new Error('Total Paid cannot be greater than the invoice amount.');
            this.showToast('Error', 'please enter Amount', 'error');
            // this.totalPaid = 0;
             //this.outOfBalance = 0;
             event.target.checked = false;

            // ❗ Also update the data model in case it already changed
            this.invoiceRecordsTable = this.invoiceRecordsTable.map(row => {
                if (row.Id === selectedId) {
                    return {
                        ...row,
                        isSelected: false,
                        isEditIcon: false,
                        toPay: `$0.00`,
                        toPayValue: 0,
                        balance: row.balance,
                        //isExpanded: false,
                       // hasDetails: false,
                        // entries: row.entries.map(entry => ({
                        //     ...entry,
                        //     paid: `$0.00`,
                        //     paidValue: 0,
                        //     balance: entry.amount,
                        //     isSelected: false,
                        //     isEditIcon: false
                        // }))
                    };
                }
                return row;
            });

            //this.outOfBalance = 0;
             this.recalculateTotals();
             this.updateMasterCheckboxState();
            return;
        }
        
        console.log('Selected Id: ', selectedId, 'Checked: ', isChecked);

        // Update the isSelected property of the row
       this.invoiceRecordsTable = this.invoiceRecordsTable.map(row => {
                const paid = row.originalInvoicePaid ?? 0;
                const bal  = row.originalBalance ?? 0;
            if (row.Id === selectedId) {
                if (!isChecked) {
                     //this.removeOverpaymentRow();
                    // ⛔ Unchecked → reset the values
                    return {
                        ...row,
                        isSelected: false,
                        isEditIcon: false,
                        toPay: `$0.00`,
                        toPayValue: 0,
                        //balance: row.balance,
                        isEditing: false,
                        invoicePaid: `$${paid.toFixed(2)}`,
                        balance: `$${bal.toFixed(2)}`
                        // isExpanded: false,
                        // hasDetails: false,
                        // entries: row.entries.map(entry => ({
                        //     ...entry,
                        //     paid: `$0.00`,
                        //     paidValue: 0,
                        //     balance: entry.amount,
                        //     isSelected: false,
                        //     isEditIcon: false
                        // }))
                    };
                } else {
                    // ✅ Checked → just mark as selected and enable edit icon
                    return {
                        ...row,
                        isSelected: true,
                        isEditIcon: true
                    };
                }
            }
            return row;
        });

    
        // Check if all rows are selected, then update the master checkbox
       // this.isEditIcon = true;
       const anySelected = this.invoiceRecordsTable.some(row => row.isSelected);
        if (!anySelected) {
            this.invoiceRecordsTable = this.invoiceRecordsTable.map(row => ({
                ...row,
                // isExpanded: false,
                // hasDetails: false
            }));
        }
        this.recalculateTotals();  
        this.updateMasterCheckboxState();
          console.log('outOfBalance in handleRadioSelection:, ',this.outOfBalance);
    }
     
    updateMasterCheckboxState() {
        console.log(' updateMasterCheckboxState :');
        const selectedRows = this.invoiceRecordsTable.filter(row => row.isSelected);
        const selectedCount = selectedRows.length;
        this.selectedCount = selectedCount;
        console.log('Selected Rows: ', selectedRows);
        console.log('Selected Count: ', this.selectedCount);
        const allSelected = this.invoiceRecordsTable.every(row => row.isSelected);
        const noneSelected = this.invoiceRecordsTable.every(row => !row.isSelected);
        

        if (allSelected) {
                this.isAllSelected = true;
                console.log('Set isAllSelected = true');
                console.log('totalPaid in updateMasterCheckboxState: ',this.totalPaid);
                console.log('outOfBalance in updateMasterCheckboxState:, ',this.outOfBalance);
                console.log('totalAllocated in updateMasterCheckboxState:, ',this.totalAllocated);
                if(this.selectedCount === 1){
                    console.log('☑️ Only one row selected');
                    if (this.totalPaid !==0 && this.outOfBalance == 0) {
                        this.disabledSubmit = false;
                        console.log('totalPaid is not zero AND outOfBalance is 0 → disabledSubmit = false in count=1');
                    } else {
                        this.disabledSubmit = true;
                        console.log('Either totalPaid is zero or outOfBalance != 0 → disabledSubmit = true  in count=1');
                    }
                    // this.disabledSubmit = false; 
                
                } else if (this.totalPaid !==0 && this.outOfBalance == 0) {
                    this.disabledSubmit = false;
                    console.log('totalPaid is not zero AND outOfBalance is 0 → disabledSubmit = false');
            
                } else {
                    this.disabledSubmit = true;
                    console.log('Either totalPaid is zero or outOfBalance != 0 → disabledSubmit = true');
                }
       
        } else if (this.selectedCount > 1) {
            console.log('Selected Count>1 ');
            console.log('totalPaid in Selected Count>0: ',this.totalPaid);
            console.log('outOfBalance in Selected Count>0:, ',this.outOfBalance);
            console.log('totalAllocated in Selected Count>0:, ',this.totalAllocated);
            if (this.totalPaid !==0 && this.outOfBalance == 0) {
                this.disabledSubmit = false;
                console.log('totalPaid is not zero AND outOfBalance is 0 → disabledSubmit = false in count>1');
            } else {
                this.disabledSubmit = true;
                console.log('Either totalPaid is zero or outOfBalance != 0 → disabledSubmit = true  in count>1');
            }
        } else if (noneSelected) {
            this.isAllSelected = false;
            console.log('Set isAllSelected = false');
            // this.totalPaid =0;
            //this.outOfBalance = 0;
            
            if(this.totalPaid !==0 && this.outOfBalance==0){
                this.disabledSubmit = false;
                console.log('Set disabledSubmit  updateMasterCheckboxState1= false');
            } else {
                this.disabledSubmit = true;
                console.log('Set disabledSubmit  updateMasterCheckboxState2= true');
            }
     
        } else {
            this.isAllSelected = false; 
            console.log('Partial selection → isAllSelected = false');
            if(this.totalPaid!==0 && this.outOfBalance==0){
                this.disabledSubmit = false;
                console.log('Set disabledSubmit updateMasterCheckboxState3 = false');
            }
            
        }
        console.log('Master checkbox state updated. isAllSelected: ', this.isAllSelected);
        this.recalculateTotals();  
    }
    
    handleSubmit(){
        this.isRemittanceFlag=true;
    }
    handleSubmitOptionChange(event) {
        this.selectedSubmitOption = event.detail.value;
    }
    
    handleRemittanceClose(){
        this.isRemittanceFlag=false;
    }

    @track paymentRecordId;
    // handleRemittanceSubmit() {
    async handleRemittanceSubmit() {
        try { 
            if (!this.selectedSubmitOption ){
                console.warn(' No option selected for submission.');
                this.showToast('Error', 'No option selected for submission', 'error');
                            
                return;
            }
            //const selectedRows = this.invoiceRecordsTable.filter(row => row.isSelected);
            const selectedRows = this.invoiceRecordsTable.filter(
                row => row.isSelected && !row.isOverPayment
            );

            if (selectedRows.length === 0) {
                console.warn(' No invoices selected for submission.');
                this.showToast('Error', 'No invoices selected for submission', 'error');
                        
                return;
            }
            const cleanAmount = value => {
                if (typeof value === 'string') {
                    return parseFloat(value.replace(/[$,]/g, ''));
                }
                return value;
            };
            
            // const updates = selectedRows.map(row => ({
                
            //     Id: row.Id,
            //     paidAmount: cleanAmount(row.toPay),
            //     balanceAmount: cleanAmount((row.invoiceAmount)-(row.toPay)),
            //     isEntityPayment: true
            // }));
            const invoiceUpdates  = selectedRows.map(row => {
                // LOG RAW VALUES
                console.log('------------------------------');
                console.log('🔢 Raw invoiceAmount:', row.invoiceAmount);
                console.log('🔢 Raw toPay:', row.toPay);

                const invoiceAmount = cleanAmount(row.invoiceAmount);
                const toPay = cleanAmount(row.toPay);
                const toPayValue = cleanAmount(row.toPayValue); 
                const originalPaid = cleanAmount(row.originalInvoicePaid);
                const invoicePaid = originalPaid+toPay;

                console.log('💰 Clean invoiceAmount:', invoiceAmount);
                console.log('💸 Clean toPay:', toPay);
                console.log('💸 Clean invoicePaid:', invoicePaid);

                const balance = invoiceAmount - invoicePaid;

                console.log('💵 paidAmount:', toPay);
                console.log('📉 balanceAmount:', balance);
                const historyEntry = {
                    date: this.date,           // UI date
                    time: new Date().toLocaleTimeString(), 
                    invoicePaid:  originalPaid,
                    // toPay: toPay,
                    toPayValue:toPayValue,
                    balance: balance
                };

                console.log('📝 historyEntry Prepared:', JSON.stringify(historyEntry, null, 2));
                return {
                    Id: row.Id,
                    invoiceAutoNo: row.invoiceAutoNo,
                    paidAmount: invoicePaid,
                    balanceAmount: balance,
                    isEntityPayment: true,
                    entryType:this.entryType,
                     historyEntry: historyEntry
                };
            });
            const payment = {
                entity: this.entityName,
                company: this.selectedCompany,
                paymentDate: this.date,
                overalTotalPaid: this.totalPaid,   
                fromLedger: this.selectedLedgerItemId,
                payee:this.payee
            
            };
           
        // console.log(' Submitting the following invoices:', JSON.stringify(updates, null, 2));
        // updateEntityPaymentInvoices({ invoiceList: updates })
            console.log('Sending payment + invoices:', { payment, invoiceUpdates });

            const paymentId = await createPaymentWithInvoiceUpdates({
                paymentRecord: payment,
                invoiceList: invoiceUpdates,
                isSpendMoney: this.isSpendMoney
            });

            console.log('✅ Payments submitted successfully:', paymentId);
            this.showToast('Success', 'Payments submitted successfully', 'success');

            // Save returned parent ID
            this.paymentRecordId = paymentId;

            const opRow = this.invoiceRecordsTable.find(r => r.isOverPayment);
          

            if (opRow) {
                console.log("💲 Saving Overpayment row to backend...");
               
                await saveOverpaymentRecord({
                    companyId: this.selectedCompany,
                    paymentId: paymentId,
                    amount: Number(opRow.toPayValue),
                    paymentDate:  opRow.invoiceDateISO,
                    opNumber: opRow.invoiceNo,
                    isSpendMoney: this.isSpendMoney
                });

                console.log("✅ Overpayment saved successfully!");
            }
         
          
            console.log('this.selectedLedgerItemId in submit :', this.selectedLedgerItemId);
            this.updatePayFromAccountLedgerId(this.selectedLedgerItemId);
            this.isRemittanceFlag=false;
            console.log('selectedSubmitOption : ',this.selectedSubmitOption);
            if (this.selectedSubmitOption == "WithRemittance") {
                console.log('with Remittance : ');
                this.parentIdforEmail = paymentId;
                //const opRow = this.invoiceRecordsTable.find(r => r.isOverPayment);

                const response = await getAccountingPaymentPdf({
                    paymentId: paymentId
                  //  includeOverpayment: opRow ? true : false 
                });

               this.paymentDetails = response.payment;
               this.invRecords = response.invoices;
                if (opRow) {
                    this.overPaymentAmount = Number(opRow?.toPayValue || 0);
                    this.paymentDetails.overpayment = {
                        amount: Number(opRow.toPayValue),
                        date: opRow.invoiceDate,
                        opNumber: opRow.invoiceNo
                    };
                }
             
                console.log('📌 Parent Payment Record:', JSON.stringify(this.paymentDetails));
                console.log('📄 Invoice Line Items:', JSON.stringify(this.invRecords));
                this.generateBase64Data();
                this.toAddress = '';
                this.ccAddress = '';

                this.invoiceEmailFlag = true;
                this.getEmail(this.parentIdforEmail);
                this.handleGetEmailBody();
                        
            } 
            setTimeout(() => {
                console.log('entityName in submit :', this.entityName);
                refreshApex(this.wiredInvoicesResult);
                this.amount='';
                this.totalAllocated='';
                this.totalPaid='';
                this.outOfBalance='';
                this.payee='';
                //this.date='';
                
                this.date =  new Date().toISOString().slice(0, 10);
                this.selectedSubmitOption ='';
                //this.isRemittanceFlag = false;
            }, 500);
        
        } catch (error) {
            console.error('❌ Error submitting invoices:', error);
        }
    }
    updatePayFromAccountLedgerId(ledgerId) {
        console.log('this.entrytype  in updatePayFromAccountLedgerId :', this.entryType);
        updateLedgerItemId({ ledgerItemId: ledgerId ,amount:this.amount, category: this.selectedOptionCategory, entryType:this.entryType })
            .then(result => {
                console.log('✅ Ledger Item successfully updated:', result);
            })
            .catch(error => {
                console.error('❌ Error updating Pay from Account value :', error);
            });
    }
    handleInvoiceData() {
        console.log('calling handleInvoiceData');
        organizationDetails().then(response => {
         console.log('calling response organizationDetails', JSON.stringify(response));
            this.invoiceData = response.listofPriceBook;
            this.bank = response.listofPriceBook.Bank__c;
            this.accountNo = response.listofPriceBook.Account_Number__c;
            this.accountName = response.listofPriceBook.Account_Name__c;
            this.bsb = response.listofPriceBook.BSB__c;
            this.orgname = response.listofPriceBook.Name;
            console.log('this.orgname  in org : ', this.orgname );

        this.abn = response.listofPriceBook.ABN__c;
            /* this.desc = response.listofPriceBook.Description__c; */   
        });
    }
   
    generateBase64Data() { 
         console.log('jspdfentered');
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        let overRowIndex = null;
        const payment = this.paymentDetails;
        console.log('payment RECORDS '+JSON.stringify(payment));
        const invoices = this.invRecords;
        console.log('invoices RECORDS '+JSON.stringify(invoices));

        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(16);
        doc.text("REMITTANCE ADVICE", 105, 15, { align: "center" });
        
        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0,102,255);
        doc.setFontSize(12);
        doc.text((this.orgname || "").toUpperCase(), 10, 25);  
        console.log('orgname '+this.orgname);     

        doc.setTextColor(0,0,0);
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(12);
        doc.text("ABN: "+ (payment.Company__r.ABN__c || ""), 10, 30);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    
        
        doc.setFontSize(10);
        doc.text(payment.Company__r.Address_Latest__Street__s+",", 10,35 );
        doc.text(`${payment.Company__r.Address_Latest__City__s} ${payment.Company__r.Address_Latest__StateCode__s} ${payment.Company__r.Address_Latest__PostalCode__s},`, 10, 40);
        doc.text("Contact: "+payment.Company__r.Phone_Number__c, 10, 45);
    
        // top  left side box start  
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(12);
    // doc.text("Invoice Number", 150, 24);
       // doc.text("Payment ", 160, 25);
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(12);
        doc.text(payment.Name, 160, 30);

    
        const oldDate = payment.Payment_Date__c;
        const arr = oldDate.split('-');
        const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];       
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setFontSize(10);
        doc.text("Date : "+newDate, 160, 35);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setFontSize(10);

        // doc.text("TAX INVOICE To: " , 10, 72);  
        /* doc.text("TAX INVOICE To: "+invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.First_Name__c+" "+invoice.Accounting_Journal_Entry__r[0].Entity_Profile__r.Last_Name__c, 10, 72); */                 
        doc.text(payment.Entity_Profile__r.Name__c ? payment.Entity_Profile__r.Name__c 
        : payment.Entity_Profile__r.First_Name__c + " " + payment.Entity_Profile__r.Last_Name__c , 10, 72);

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
       
        let invoiceLines = this.invRecords;   // List of invoice rows returned from Apex
        // let result = [];
        let totalInvoiceAmount = 0;
        let totalPreviousPaid = 0;
        let totalPaidNow = 0;
        let totalBalance = 0;

        invoiceLines.forEach((inv, index) => {
            console.log(`🔹 Line ${index + 1}:`, JSON.stringify(inv));
            // totalPaid += inv.Amount_Paid__c || 0;         
            //totalBalance += inv.Balance_Amount__c || 0;
            let previousPaid = 0;
            let paidNow = 0;
            let balanceNow = inv.Balance_Amount__c || 0;

            // Parse history JSON
            if (inv.Payment_History_JSON__c) {
                try {
                    const history = JSON.parse(inv.Payment_History_JSON__c);

                    // ⚡ TAKE LAST OBJECT — ALWAYS LATEST ENTRY
                    if (history.length > 0) {
                        const latest = history[history.length - 1];

                        previousPaid = latest.invoicePaid || 0;
                        paidNow = latest.toPayValue || 0;
                        balanceNow = latest.balance || balanceNow;
                    }
                } catch (e) {
                    console.error("❌ Error parsing Payment_History_JSON__c", e);
                }
            }
             if (inv.Payment_History_JSON__c) {
        try {
            const history = JSON.parse(inv.Payment_History_JSON__c);

            // ⚡ TAKE LAST OBJECT — ALWAYS LATEST ENTRY
            if (history.length > 0) {
                const latest = history[history.length - 1];

                previousPaid = latest.invoicePaid || 0;
                paidNow = latest.toPayValue || 0;
                balanceNow = latest.balance || balanceNow;
            }
        } catch (e) {
            console.error("❌ Error parsing Payment_History_JSON__c", e);
        }
    }

   // totalInvoiceAmount += inv.Total_Amount__c || 0;
    totalPreviousPaid += previousPaid;
    totalPaidNow += paidNow;
    totalBalance += balanceNow;

            result.push([
                inv.Invoice_No__c || "",
                //inv.Invoice_Date__c || "",
                inv.Invoice_Date__c 
                ? new Date(inv.Invoice_Date__c).toLocaleDateString('en-GB')
                : "",
                 (inv.Total_Amount__c || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                (previousPaid).toLocaleString("en-US", { style: "currency", currency: "USD" }),
                (paidNow).toLocaleString("en-US", { style: "currency", currency: "USD" }),
                (balanceNow).toLocaleString("en-US", { style: "currency", currency: "USD" })
            ]);
        });
        
        // result.push([
        //     "",                       // Invoice No
        //     "",                       // Date
        //     { content: "Total", styles: { fontStyle: "bold", halign: "left"  } },
        //     { 
        //         content: totalPreviousPaid.toLocaleString("en-US", { style: "currency", currency: "USD" }),
        //         styles: { fontStyle: "bold", halign: "right" }
        //     },
        //     { 
        //         content: totalPaidNow.toLocaleString("en-US", { style: "currency", currency: "USD" }),
        //         styles: { fontStyle: "bold", halign: "right" }
        //     },
        //     { 
        //         content: totalBalance.toLocaleString("en-US", { style: "currency", currency: "USD" }),
        //         styles: { fontStyle: "bold", halign: "right" }
        //     }
        // ]);
        let overpayment = this.overPaymentAmount || 0;
        

    if (overpayment > 0 && this.paymentDetails.overpayment) {

        const op = this.paymentDetails.overpayment;
        //Add sub-heading row


         overRowIndex = result.length;
        result.push([
            { 
                content: "Overpayment:",
                colSpan: 6,
                styles: { font: "Roboto-Bold", fontStyle: "bold", halign: "left" }
            },
            {}, {}, {}, {}, {}
        ]);

        // Add overpayment data row with SAME invoice headers
        result.push([
                op.opNumber || "",          // Invoice No
                op.date || "",              // Invoice Date
                "",                         // Total
                "",                         // Previous Paid
                overpayment.toLocaleString("en-US", { 
                    style: "currency", 
                    currency: "USD" 
                }),                         // Paid Now
                ""                          // Balance
            ]);
        }
        let finalPaidTotal = totalPaidNow + (overpayment || 0);



        result.push([
            "",
            "",
            { content: "Total", styles: { fontStyle: "bold" } },
            {
                content: totalPreviousPaid.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD"
                }),
                styles: { fontStyle: "bold", halign: "right" }
            },
            {
                content: finalPaidTotal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD"
                }),
                styles: { fontStyle: "bold", halign: "right" }
            },
            {
                content: totalBalance.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD"
                }),
                styles: { fontStyle: "bold", halign: "right" }
            }
        ]);
    console.log('RESULT'+JSON.stringify(result));
        // Generating table using autoTable
        doc.autoTable({
            startY: yPosition, // Starting Y position
            // head: [["Invoice No", "Date", "Total", "Paid", "Balance"]],
            head: [["Invoice No", "Date", "Total", "Paid to Date", "Paid", "Balance"]],
            body: result,
            theme: "plain",
            /* styles: { halign: "left" }, */
            margin: { left: 10 },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
            bodyStyles: { font: "Helvetica", font: "Roboto-VariableFont_wdth,wght", fontStyle: "normal", },
            /* bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] }, */
            columnStyles: {
            0: { cellWidth: 35, halign: "left" },  // Description left-aligned
            1: { cellWidth: 30, halign: "left" },  // Qty left-aligned
            2: { cellWidth: 30, halign: "right" },  // Rate left-aligned
            3: { cellWidth: 30, halign: "right" }, // Tax right-aligned
            4: { cellWidth: 30, halign: "right" }, // Amount right-aligned
            5: { cellWidth: 30, halign: "right" } 
            },
        
        didParseCell: function (data) {
            const row = data.row.index;
            const col = data.column.index;
            const lastRow = result.length - 1;

            // Right-align numeric columns (Total, Paid, Balance)
            if (col === 2 || col === 3 || col === 4 ||col === 5) {
                data.cell.styles.halign = "right";
            }

                if (row === overRowIndex) {
                data.cell.styles.font = "Roboto-Bold";
                data.cell.styles.fontStyle = "bold";
            }

            // Make TOTAL row bold
            if (row === lastRow) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.font = "Roboto-Bold";
            }
        },

        didDrawCell: function (data) {

                // ❌ Remove underline for Overpayment row
            if (overRowIndex !== null && data.section === "body" && data.row.index === overRowIndex) {
                return; // remove underline
            }
            const doc = data.doc;
            const cell = data.cell;
            const row = data.row.index;
            const lastRow = result.length - 1;

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.25);

            // 1️⃣ TOP border of header
            if (data.section === "head") {
                doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
            }

            // 2️⃣ BOTTOM border of header (new line you need)
            if (data.section === "head" && data.row.index === data.table.head.length - 1) {
                doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
            }

            // 3️⃣ Body row borders except last row (Total row)
            if (data.section === "body" && row !== lastRow) {
                doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
            }
        },


        didDrawPage: function (data) {
            
            // Always add the footer on each page
            addFooter(data.doc);
        }
        });
        let finalY = doc.lastAutoTable.finalY + 12;
    
        let finalYPosition = doc.lastAutoTable.finalY;
    // addFooter(doc);

    
    
        let availableSpace = doc.internal.pageSize.height-finalYPosition;
        console.log('available Space ' +availableSpace);
        
        if(availableSpace >100){
            // Adding payment details at the bottom
            yPosition=finalYPosition + 35;
            doc.setFontSize(10);

            doc.setDrawColor(0, 0, 0); // Black color
            doc.setLineWidth(0.5);
            doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
            doc.line(10, yPosition + 6, 200, yPosition + 6); // (startX, startY, endX, endY)
            doc.setLineDash();
        
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
    console.log('Generated PDF Name: ' + this.paymentDetails.Name);
        console.log('Generated recordId: ' + this.paymentDetails.Id);
        // const filename = `${this.invRecords[0].Name}.pdf`;
        // console.log('Using filename:', filename);

    uploadFile({base64:JSON.stringify( this.base64string), filename:this.paymentDetails.Name+'.pdf', recordId:this.paymentDetails.Id,obj:'AccountingInvoicePayment'})
    .then(result=>{
            console.log('data in uploadFile', result);                    
        //this.handleInvoicFlag();
        // console.log('Upload result = ' +result);
    //   this.fileName = this.invRecords[0].Name + ' - Uploaded Successfully';
        setTimeout(() => {  
           
            getAccountingPaymentPdf({ paymentId: this.paymentDetails.Id })
                .then(response => {
                    console.log(' response in upload:', JSON.stringify(response));

                    if (response && response.payment) {
                        this.urlforEmail = response.payment.Amazon_URL__c;
                        console.log('URL SET → ' + this.urlforEmail);
                    } else {
                        console.error('⚠ No payment object in response');
                    }
                })
                .catch(error => {
                    console.error('Error retrieving PDF URL: ', error);
                });
        }, 500); 
    setTimeout(() => {
        refreshApex(this.wireInvoiceData);
        
    }, 2000);
    })            
    const evt = new ShowToastEvent({
        title: 'Success',
        message: 'Invoice Generated sucessfully '+this.invRecords[0].Invoice_No__c,
        variant: 'success',
        mode: 'dismissable'
    });
   
    }
    @track activeRowId1;
    @track selectedItemId;
    @track selectedRowId; 
     @track amountarrey = [];    
    
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
        this.activeRowId1 = rowId;
        this.showtableTax = true;
    }
   
    handleEdit(event) {
        const id = event.target.dataset.id;

        this.invoiceRecordsTable = this.invoiceRecordsTable.map(invoice => {
            if (invoice.Id === id) {

                // const paid = Number(invoice.originalInvoicePaid) || 0;
                // const bal  = Number(invoice.originalBalance) || 0;
                 const paid = invoice.originalInvoicePaid ?? 0;
                 const bal  = invoice.originalBalance ?? 0;

                return {
                    ...invoice,
                    isEditing: true,

                    // reset input
                    toPayValue: null,
                    toPay: '',

                    // ALWAYS return formatted strings → avoid replace() error
                    invoicePaid: `$${paid.toFixed(2)}`,
                    balance: `$${bal.toFixed(2)}`
                };
            }
            return invoice;
        });
        this.totalPaid=0;
        this.outOfBalance=0;
        this.removeOverpaymentRow();
       // this.recalculateTotals();     
    }

    handlePaidChange(event) {
        const invoiceId = event.target.dataset.id;
        const newValue = parseFloat(event.target.value) || 0;

        this.invoiceRecordsTable = this.invoiceRecordsTable.map(invoice => {
            if (invoice.Id === invoiceId) {
                return {
                    ...invoice,
                    toPayValue: newValue  // temporarily store user input
                };
            }
            return invoice;
        });
       // this.isEditIcon = false;
    }

    handleQtyKeyDown(event) {
        if (event.key === 'Enter') {
            this.saveRow({ currentTarget: { dataset: { id: event.target.dataset.id } } });
           // this.saveEntryRow({ currentTarget: { dataset: { id: event.target.dataset.id } } });
        }
    }
    
    saveRow(event) {
        console.log('saveRow before');
        // const invoiceId = event.target.dataset.id;
        const invoiceId = event.currentTarget.dataset.id;
        console.log('Clicked Save for Invoice ID:', invoiceId);

        console.log('🔍 Before update - isEditing states:');
        this.invoiceRecordsTable.forEach(inv => {
            console.log(`ID: ${inv.Id}, isEditing1: ${inv.isEditing}`);
        });
        // Step 1: Clone the table with updates for the specific row
        let updatedTable = this.invoiceRecordsTable.map(invoice => {
            if (invoice.Id === invoiceId) {
           
                const balance = parseFloat(invoice.balance.replace('$', '')) || 0;
                const amount = parseFloat(invoice.invoiceAmount.replace('$', '')) || 0;
                const newPaid = invoice.toPayValue || 0;
           
                const originalPaid = amount - balance;
                console.log('balance:', balance);
                console.log('amount:', amount);
                console.log('originalPaid:', originalPaid);
                console.log('newPaid:', newPaid);
                 
                if (newPaid  > amount || newPaid > balance) {
                    this.showToast('Error', 'To Pay value cannot exceed row amount  or balance .', 'error');

                    return {
                        ...invoice,
                        toPayValue: 0,      
                        //  toPay: `$${previousToPay.toFixed(2)}`,
                        isEditing: true  ,  
                        balance: `$${balance.toFixed(2)}`,
                    };
                }
                
                const totalInvoicePaid = originalPaid + newPaid;
                const newBalance = amount - totalInvoicePaid;
                console.log('newBalance:', newBalance);
                console.log('totalInvoicePaid:', totalInvoicePaid);
                console.log(`✅ Row validation passed for ID ${invoiceId} → exiting edit mode`);
                // return {
                //     ...invoice,
                //     paid: `$${newPaid.toFixed(2)}`,
                //     balance: `$${newBalance.toFixed(2)}`,
                //     isEditing: false
                // };
                const formattedBalance = `$${newBalance.toFixed(2)}`;
                return {
                    ...invoice,
                    toPay: `$${newPaid.toFixed(2)}`,
                   // invoicePaid: `$${totalInvoicePaid.toFixed(2)}`,
                    balance: formattedBalance,
                    toPayValue: newPaid,
                    isEditing: false
                };
            }
            return invoice;
        });

        // Step 2: Calculate totalPaid from the updated table
        const totalPaid = updatedTable.reduce((sum, invoice) => {
            console.log('invoice.toPay:', invoice.toPay);
            // console.log('totalPaid:', totalPaid);
            const paid = parseFloat(invoice.toPay?.replace('$', '')) || 0;
            return sum + paid;
        }, 0);
        //console.log('totalPaid after:', totalPaid);
                  
        const allowedTotal = parseFloat(this.amount?.replace('$', '')) || 0;
        console.log('🔍 After row update - isEditing states:');
        updatedTable.forEach(inv => {
            console.log(`ID: ${inv.Id}, isEditing2: ${inv.isEditing}`);
        });

        if (totalPaid > allowedTotal) {
            this.showToast('Error', 'Total Paid cannot exceed Initial Amount.', 'error');
        
            const rollbackTable = updatedTable.map(invoice => {
                if (invoice.Id === invoiceId) {
                    // const amount = parseFloat(invoice.invoiceAmount.replace('$', '')) || 0;
                    // const balance = parseFloat(invoice.originalBalance.replace('$', '')) || 0;
                    function toNumber(value) {
                        if (!value) return 0;
                        return parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
                    }

                    const amount = toNumber(invoice.invoiceAmount);
                    const balance = toNumber(invoice.originalBalance);
                    return {
                        ...invoice,
                        toPayValue: 0,  // clear value
                        toPay: `$0.00`,
                        isEditing: true,
                        balance: `$${balance.toFixed(2)}`
                    };
                }
                return invoice;
            });

            this.invoiceRecordsTable = [...rollbackTable];
            return;
        }
        console.log('🔍 After total validation - isEditing states:');
        updatedTable.forEach(inv => {
            console.log(`ID: ${inv.Id}, isEditing3: ${inv.isEditing}`);
        });
        // Step 3: Apply validated updates
        //this.invoiceRecordsTable = updatedTable;
        this.invoiceRecordsTable = [...updatedTable];
        this.totalPaid = totalPaid;

        // Step 4: Calculate outOfBalance
        if (this.totalAllocated) {
            this.outOfBalance = parseFloat((this.totalAllocated - this.totalPaid).toFixed(2));
            console.log('this.outOfBalance in onchange: ' + this.outOfBalance);
        } else {
            this.outOfBalance = 0;
        }

        console.log('this.totalPaid in amount onchange: ' + this.totalPaid);
        console.log('✅ Final state - isEditing states after update:');
        this.invoiceRecordsTable.forEach(inv => {
            console.log(`ID: ${inv.Id}, isEditing4: ${inv.isEditing}`);
        });

        console.log('➡️ saveRow END');
        
        this.addOverpaymentRow();
        this.recalculateTotals();
        
        this.updateMasterCheckboxState();
    }
    
    async  addOverpaymentRow(){
        console.log("Checking if all rows are fully allocated before adding Overpayment...");

        let selectedRows = this.invoiceRecordsTable.filter(r => r.isSelected && !r.isOverPayment);
        const allowedTotal = parseFloat(this.amount?.replace('$', '')) || 0;
        // 1️⃣ If nothing selected → NO overpayment
        if (selectedRows.length === 0) {
            console.log("⛔ No selected rows. No Overpayment row added.");
            return;
        }
        if (!this.isAllSelected) {
            console.log("⛔ All rows are not selected . No Overpayment row added.");
            return;
        }

        // 2️⃣ All selected rows must be fully allocated
        const allAllocated = selectedRows.every(row => {
            const balance = Number(row.originalBalance || 0);
            const paid = Number(row.toPayValue || 0);
            return paid === balance;
        });

        if (!allAllocated) {
            console.log("⛔ Some selected rows are NOT fully allocated → NO Overpayment.");
            return;
        }

        // 3️⃣ Calculate remaining amount
        const remaining = allowedTotal - this.totalPaid;

        if (remaining <= 0) {
            console.log("⛔ No remaining amount → No Overpayment row.");
            return;
        }
          this.overPaymentAmount = remaining;

        // 4️⃣ Check if OP row already exists
        // const opExists = this.invoiceRecordsTable.some(r => r.isOverPayment);

        // if (opExists) {
        //     console.log("⚠ Overpayment row already exists. Skipping.");
        //     return;
        // }

        // // 5️⃣ Create Overpayment row
        // console.log("Adding Overpayment row...");

        // const randomNum = Math.floor(100000 + Math.random() * 900000);

         const opExists = this.invoiceRecordsTable.some(r => r.isOverPayment);
        if (opExists) {
            console.log("⚠ Overpayment row already exists.");
            return;
        }

        let nextOpNumber;
        try {
             nextOpNumber = await getNextOverpaymentNumber({ 
                companyId: this.selectedCompany 
            });
            console.log('Next OP Number from backend:', nextOpNumber);
        } catch (error) {
            console.error('Error fetching next OP number:', error);
            return;
        }
        const formattedDate = new Date(this.date).toLocaleDateString('en-GB');
        const isoDate = new Date(this.date).toISOString().split("T")[0];
        const overPayRow = {
            Id: nextOpNumber,
            invoiceNo: nextOpNumber,
          //  invoiceDate: new Date().toISOString().split('T')[0],
            invoiceDate:formattedDate,
            invoiceDateISO: isoDate,
            invoiceAmount: '$0.00',
            invoicePaid: '$0.00',
            toPay: `$${remaining.toFixed(2)}`,
            toPayValue: remaining,
            originalBalance: 0,
            originalInvoicePaid: 0,
            balance: '$0.00',
            isSelected: true,
            isEditing: false,
            isEditIcon: false,
            isOverPayment: true
        };
      
        this.invoiceRecordsTable = [...this.invoiceRecordsTable, overPayRow];

        this.totalPaid += remaining;
        this.totalAllocated = this.totalPaid;
        this.outOfBalance = 0;
        this.disabledSubmit = false;

        console.log("Overpayment row successfully added:", overPayRow);
        
    }
    removeOverpaymentRow() {
        const before = this.invoiceRecordsTable.length;

        this.invoiceRecordsTable = this.invoiceRecordsTable.filter(
            row => !row.isOverPayment
        );

        if (before !== this.invoiceRecordsTable.length) {
            console.log("🗑 Overpayment row removed.");
        }

        // After removing OP row, recalc totals
        this.recalculateTotals();
    }
    // checkBalanceforSubmit(invoice) {
    //     console.log('checkBalanceforSubmit');
    //     const invoiceBalance = parseFloat(invoice.balance?.replace('$', '')) || 0;
    //     const totalEntryBalance = invoice.entries.reduce((sum, entry) => {
    //         return sum + (parseFloat(entry.balance?.replace('$', '')) || 0);
    //     }, 0);

    //     console.log(`🔍 Checking balance match → Invoice Balance: ${invoiceBalance}, Sum of Entry Balances: ${totalEntryBalance}`);

    //     if (invoiceBalance === totalEntryBalance) {
    //         console.log('✅ Invoice and entry balances match. Updating master checkbox state...');
    //         this.updateMasterCheckboxState();
    //     } else {
    //         this.disabledSubmit = true;
    //         console.warn('❌ Invoice and entry balances do not match. Not updating master checkbox.');
    //     }
    // }
    getEmail(parentIdforEmail){
        console.log('invoiceId for email: '+parentIdforEmail);
        getentityEmailForPaymentInvoices({ invoiceId: parentIdforEmail }) // Pass your actual invoiceId
            .then(result => {
                //console.log('Invoice Data:', JSON.stringify(result));
                console.log('Fetched Email:', result);

                // to and cc coming from APex json

                    this.toAddress = result?.to || '';
                    this.ccAddress = result?.cc || '';
                    console.log('toAddress in get Email : ', this.toAddress);
                    console.log('ccAddress  in get Email : ', this.ccAddress);
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
    //@track emailCounts = 0;
    @track emailSubject;
    @track emailBody;
    handleGetEmailBody() {
        console.log('handleGetEmailBody');
        console.log('parentIdforEmail:', this.parentIdforEmail);
       
            getEmailBodyforParentInvoices({
                invoiceid: this.parentIdforEmail
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
        //}
    }
    handleSendEmail(event){
        if (!this.toAddress) {
            // Show error message using alert or toast
            this.showToast('error', 'To Address is required', 'error');
            return;
        }
        console.log('this.urlforEmail in in send email = ' + this.urlforEmail);
        sendEmailforInvoicePayments({
            invoiceid: this.parentIdforEmail,
            toAddress: this.toAddress,
            ccAddress: this.ccAddress,
            url: this.urlforEmail,
            subject: this.emailSubject,
            body: this.emailBody,
            
        })
        .then((updatedCount) => {
            console.log('Email sent successfully : ', updatedCount);
            this.showToast('Success', 'Email sent successfully', 'success');
            this.fromAddress = '';
            this.toAddress = '';
            this.ccAddress = '';
            this.emailSubject = '';
            this.emailBody = '';
            this.invoiceEmailFlag = false;
             
        })
        .catch(error => {
            console.error('Error sending email:', error);
            this.showToast('Error', 'Error sending email: ' + error.body?.message || error.message, 'error');
        });

    }
}