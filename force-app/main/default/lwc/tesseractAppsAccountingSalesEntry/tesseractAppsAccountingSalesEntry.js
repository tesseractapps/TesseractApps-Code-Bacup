import {LightningElement, wire, api, track } from 'lwc';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
//import getLedgerItems from '@salesforce/apex/CreateCompanyController.getLedgerItems';
import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getLedgerItemsforExpenses from '@salesforce/apex/AccountingModuleController.getLedgerItemsforExpenses';
import createJournalEntries from '@salesforce/apex/AccountingModuleController.createJournalEntries';
 import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import getAccountingExpense from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getAccountingExpense';
import getEntryOnEdit from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntryOnEdit';
import updateExpense from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateExpense';
import updateSalesEntry from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateSalesEntry';
import { refreshApex } from '@salesforce/apex';
import deleteExpenseRecord from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.deleteExpenseRecord';

export default class TesseractAppsAccountingSalesEntry extends LightningElement {
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
    @track selectedCardType='';
    wiredCompanyList;
    wiredEntityProfilesResult;
    @track entryNameOptions=[];
    @track selectedEntityName;
    @track taxInclusive=true;
    @track terms;
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
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
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
    FilteredLedgerItems = [];
    @track entryOptions=[{label:'Purchases',value:'Purchases'},{label:'Sales',value:'Sales'}];
    @track entityOptions= [{label:'Supplier',value:'Supplier'},{label:'Customer',value:'Customer'}];
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
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
        if( this.entryType==='Sales'){
            this.selectedCardType = 'Customer';
            console.log('selectedCardType in connectedCallback : '+this.selectedCardType);  

        } else if( this.entryType==='Purchases'){
            this.selectedCardType = 'Supplier';
            console.log('selectedCardType in connectedCallback : '+this.selectedCardType);
        }
        this.addRow();
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.startdateValueData = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.enddateValueData = last.toISOString().slice(0, 10);
        this.taxInclusive = true;

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
    @wire(getCompany, {orgid:'$orgid'})
    wiredCompanies(result) {
        this.wiredCompanyList = result; // Store the wired result for refreshing
        const { data, error } = result;
        if (data) {
            console.log('company options '+JSON.stringify(data));
            this.companyOptions = data.map(company => ({
                label: company.Company_Name__c,
                value: company.Id
            }));
            // if (this.companyOptions.length > 0) {
            //     this.selectedCompany = this.companyOptions[0].value;
            // }
            console.log('company options in general ledger '+JSON.stringify(this.companyOptions));
            // this.selectedCompany=this.companyOptions[0].value;
            console.log('selectedCompany in  wire general ledger : ', this.selectedCompany);
            if (this.selectedCompany && this.companyOptions.length > 0) {
                this.filteredCompanyOptions = this.companyOptions.filter(
                    opt => opt.value === this.selectedCompany
                    
                );
                console.log('filteredCompanyOptions  '+JSON.stringify(this.filteredCompanyOptions));
                this.selectedCompany=this.filteredCompanyOptions[0].value;
                console.log('companyId in  wire getCompany : ', this.selectedCompany);
                // if (this.filteredCompanyOptions.length > 0) {
                //     this.salesEntry = {
                //         ...this.salesEntry,
                //         company: this.filteredCompanyOptions[0].value
                //     };
                //     console.log('salesEntry updated with company:', JSON.stringify(this.salesEntry));
                // }
            }
        } else if (error) {
            console.error('Error fetching companies:', error);
        }
    }
    // @wire(getEntityProfiles, { cardType: '$selectedCardType',companyId: '$selectedCompany' })
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
//   @wire(getEntityProfileTax, { entityId: '$selectedEntityName' })
//       wiredTax(result) {
//           this.wiredEntityProfilesTax = result; // Store response for refreshApex
//           const { data, error } = result;
  
//           if (data) {
//               // If the Apex call returns a tax value, assign it to selectedOptionTax
//               this.selectedOptionTax = this.appendPercentage(data);
//               console.log('Tax Value:', this.selectedOptionTax); // Log the tax value for verification
//           } else if (error) {
//               // If there's an error, handle it (e.g., log to console)
//               console.error('Error fetching tax:', error);
//           }
          
//       }
    @wire(getEntityProfileTax, { entityId: '$selectedEntityName' })
    wiredTax(result) {
            console.log('getEntityProfileTax result: ', JSON.stringify(result));
        this.wiredEntityProfilesTax = result; // Store response for refreshApex
        const { data, error } = result;

        if (data) {
            console.log('selectedEntityName :', this.selectedEntityName); 
            const tax = data.tax;
            const entityAccountList = data.accountList;
            const taxValue = this.appendPercentage(tax); // Convert to '10%' etc.
            const entityItemId = data.accountItemId;
            this.selectedItemId = entityItemId;
            this.selectedOptionTax = taxValue;
           // this.selectedOptionAL = entityAccountList || '';
            if (!this.selectedOptionAL || this.selectedOptionAL.trim() === '') {
                this.selectedOptionAL = entityAccountList || '';
            }
            console.log('Tax Value in getEntityProfileTax :', this.selectedOptionTax); // Log the tax value for verification
                console.log('selectedOptionAL in getEntityProfileTax :', this.selectedOptionAL);
            // })
        } else if (error) {
            // If there's an error, handle it (e.g., log to console)
            console.error('Error fetching tax:', error);
        }
    }

    appendPercentage(taxValue) {
        // Assuming taxValue is already a number (like 10 for 10%)
        if (taxValue != null) {
            return `${taxValue}%`; // Append '%' to the number
        }
        return '0%'; // If no tax value, return '0%'
    }

        
    createRow(salesEntryList) {
        if (salesEntryList.length >= 1) {
            return; // Prevent adding more than two rows
        }
        let accountObject = {};
        accountObject.description = null;
        accountObject.accountList = null;
        accountObject.amount = null;
        accountObject.tax = null;
        salesEntryList.push(accountObject);
    }
    addRow() {
        this.createRow(this.salesEntryList);
    }

    fetchLedgerItems() {
        console.log('Calling Apex Method: getLedgerItems...');
        console.log('companyId in fetchLedgerItems: ' + this.selectedCompany);

        // Call the Apex method and pass companyId as parameter
        getLedgerItems({ companyId: this.selectedCompany })
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

    fetchLedgerItemsforExpenses() {
        console.log('Calling Apex Method: getLedgerItemsforExpenses...');
        console.log('companyId in fetchLedgerItemsforExpenses: ' + this.selectedCompany);

        // Call the Apex method and pass companyId as parameter
        getLedgerItemsforExpenses({ companyId: this.selectedCompany })
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
    
    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const fieldChecked=event.target.checked;
        switch(fieldName) {
            case 'company':
                this.companyId = fieldValue;
                console.log('Selected Company ID:', this.companyId);
                break;
            case 'entryType':
                this.entryType = fieldValue;
                console.log('Selected entryType:', this.entryType);
                if( this.entryType==='Sales'){
                    this.selectedCardType = 'Customer';
                    console.log('selectedCardType in onchange : '+this.selectedCardType);  
                    refreshApex(this.wiredEntityProfilesResult);
                    this.fetchLedgerItems();
                     this.selectedEntityName = null;
                    this.taxInclusive = true;
                    this.invoiceDate = null;
                    this.postDate = null;
                    this.invoiceNo = '';
                    //this.entryType = '';
                    this.comments = '';
                    this.subTotal = 0;
                    this.taxAmount = 0;
                    this.totalAmount = 0;
                   // console.log('Description in clear:', this.selectedDescription);
                   // console.log(' this.selectedAmount in clear:',  this.selectedAmount);
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
                } else if( this.entryType==='Purchases'){
                    this.selectedCardType = 'Supplier';
                    console.log('selectedCardType in onchange : '+this.selectedCardType);
                    refreshApex(this.wiredEntityProfilesResult);
                    this.fetchLedgerItemsforExpenses();
                                 this.taxInclusive = true;
                    this.invoiceDate = null;
                    this.postDate = null;
                    this.invoiceNo = '';
                    //this.entryType = '';
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
                }
                // setTimeout(() => {
                //     refreshApex(this.wiredEntityProfilesResult);
                // }, 1000);
                break;
            case 'subTotal':
                this.subTotal = fieldValue;
                console.log('Selected sub total:', this.subTotal);
                break;
            // case 'entityType':
            //     this.selectedCardType = fieldValue;
            //     console.log('Selected Entity Type:', this.selectedCardType);
            //     setTimeout(() => {
            //         refreshApex(this.wiredEntityProfilesResult);
            //     }, 1000);
            //     break;
    
            case 'entityName':
                this.selectedEntityName = fieldValue;
                console.log('Selected Entity Name:', this.selectedEntityName);
                break;
    
          case 'taxInclusive':
                this.taxInclusive = fieldChecked;
                console.log('🔄 Tax Inclusive Toggled:', this.taxInclusive);

                // Default tax value
                let taxRate = 0;

                if (!this.taxInclusive) {
                    this.selectedOptionTax = '0%';
                    this.taxAmount = 0;
                    this.showtableTax = false;
                    if (this.entryType === 'Purchases' && this.selectedAmount) {
                        this.totalAmount = parseFloat(this.selectedAmount.toFixed(2));
                        console.log('🧾 Purchases Total Amount:', this.totalAmount);

                        const rateStr = this.selectedOptionTax.replace('%', '');
                        taxRate = parseFloat(rateStr) / 100;

                        if (!isNaN(taxRate)) {
                            const multiplier = 1 + taxRate;
                            this.subTotal = parseFloat((this.totalAmount / multiplier).toFixed(2));
                            this.taxAmount = parseFloat((this.totalAmount - this.subTotal).toFixed(2));
                        }
                    }

                    if (this.entryType === 'Sales' && this.selectedAmount) {
                        this.subTotal = parseFloat(this.selectedAmount.toFixed(2));
                        const match = this.selectedOptionTax.match(/\d+(\.\d+)?/);
                        taxRate = match ? parseFloat(match[0]) / 100 : 0;

                        if (!isNaN(taxRate)) {
                            const multiplier = 1 + taxRate;
                            const taxableAmount = this.subTotal / multiplier;
                            this.taxAmount = parseFloat((this.subTotal - taxableAmount).toFixed(2));
                            this.totalAmount = this.subTotal + this.taxAmount;
                        }
                    }

                } else {
                    // this.showtableTax = true;
                    // ✅ Tax Inclusive = true
                    if (this.selectedEntityName && this.wiredEntityProfilesTax?.data.tax) {
                        this.selectedOptionTax = this.appendPercentage(this.wiredEntityProfilesTax.data.tax);
                        console.log('✅ Tax from cache:', this.selectedOptionTax);
                    } else {
                        console.warn('⚠️ Missing entity or tax data');
                        this.selectedOptionTax = '0%';
                    }

                    const rateStr = this.selectedOptionTax.replace('%', '');
                    taxRate = parseFloat(rateStr) / 100;

                    if (this.entryType === 'Purchases' && this.selectedAmount && !isNaN(taxRate)) {
                        this.totalAmount = parseFloat(this.selectedAmount.toFixed(2));
                        const multiplier = 1 + taxRate;
                        this.subTotal = parseFloat((this.totalAmount / multiplier).toFixed(2));
                        this.taxAmount = parseFloat((this.totalAmount - this.subTotal).toFixed(2));
                    }

                    if (this.entryType === 'Sales' && this.selectedAmount && !isNaN(taxRate)) {
                        this.subTotal = parseFloat(this.selectedAmount.toFixed(2));
                        const multiplier = 1 + taxRate;
                        const taxableAmount = this.subTotal / multiplier;
                        this.taxAmount = parseFloat((this.subTotal - taxableAmount).toFixed(2));
                        this.totalAmount = this.subTotal + this.taxAmount;
                    }
                }

                // Final logs
                console.log('🧾 Final SubTotal:', this.subTotal);
                console.log('💰 Final TaxAmount:', this.taxAmount);
                console.log('💵 Final TotalAmount:', this.totalAmount);
                break;

    
            case 'Terms':
                this.terms = fieldValue;
                console.log('Terms:', this.terms);
                break;
    
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
            // case 'entitytype':
            //         this.entitytype = fieldValue;
            //         console.log('entitytype:', this.invoiceNo);
            //         break;
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
            default:
                console.log('Unknown field:', fieldName);
                break;
        }
    }
    
    
    toggleDropdownAccountList(event) {
        console.log('toggleDropdown');
         //this.showtable = false;
         this.selectedOptionAL = '';
          // Calculate the position of the dropdown button
        if( this.entryType==='Sales'){
            this.showtable = !this.showtable;
            console.log('showtable after : '+this.showtable);
            this.fetchLedgerItems(); 
        }
        if( this.entryType==='Purchases'){
            this.showtable = !this.showtable;
            console.log('showtable after : '+this.showtable);
            this.fetchLedgerItemsforExpenses(); 
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
    
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X
    
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
        this.FilteredLedgerItems = [...this.ledgerItems];
    }
    toggleDropdownTax(event) {
        console.log('toggleDropdown');
          // Calculate the position of the dropdown button 
          this.showtableTax = !this.showtableTax;
          if(!this.taxInclusive){
              this.showtableTax  = false;
          } 
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

        // Use event.currentTarget to refer to the <tr> element, not the clicked <td> element
        const recordId = event.currentTarget.dataset.id; 
        const selectedRow = event.currentTarget;
        console.log('Selected Row:', selectedRow);
        console.log('Account Number:', selectedRow.dataset.accno);
        this.selectedItem= selectedRow.dataset.value
        console.log('Item Name:', this.selectedItem);
         this.selectedItemId =  recordId;
         console.log(' this.selectedItemId:',  this.selectedItemId);
    
        if (selectedRow.dataset.accno && selectedRow.dataset.value) {
           this.selectedOptionAL = `${selectedRow.dataset.accno} - ${selectedRow.dataset.value}`;
           //this.selectedOptionAL = selectedRow.dataset.accno;
        } else {
            console.log('Selected item does not have expected data.');
        }
    
        console.log('Updated Selected Option:', this.selectedOptionAL);
    
        // Hide the table once an item is selected
        this.showtable = false;
        this.listenForOutsideClick = false;
    }
    handleSelectionTax(event) {
        console.log('this.entryType====>'+this.entryType);
        //Get the clicked row's data using dataset
        const selectedRow = event.currentTarget; // The <tr> element
        const code = selectedRow.dataset.code;
        const description = selectedRow.dataset.description;
        const rate = selectedRow.dataset.rate;
        const label = selectedRow.dataset.value; // This is the 'label' we need

        // Log the selected data for debugging purposes
        console.log('Selected Tax Code:', code);
        console.log('Description:', description);
        console.log('Rate:', rate);
        console.log('Label:', label); // Log the 'label' that was clicked

        if(this.entryType==='Sales'){
            // Update the selectedOptionTax to display the selected option
            this.selectedOptionTax = `${rate}`;
            //this.selectedOptionTax = event.currentTarget.dataset.value;
            //console.log('Updated Selected Option in tax:', this.selectedOption);
            // Optionally, hide the table after a selection
            this.showtableTax = false;  // Hide the dropdown table after selecting a row
            //this.subTotal=this.selectedAmount;
            console.log('subtotal:  '+this.subTotal);
            console.log('subTotal:', this.subTotal);
            console.log('rate:', rate);
            const subTotal = parseFloat(this.subTotal); // Convert amount to a float

            if (isNaN(subTotal)) {
                console.error('Invalid amount:', this.subTotal);
                return; // Exit if amount is invalid
            }
        
            // Convert rate to a decimal (e.g., 10% => 0.10)
            const taxRate = (parseFloat(rate) / 100) + 1;
        
            if (isNaN(taxRate)) {
                console.error('Invalid tax rate:', rate);
                return; // Exit if tax rate is invalid
            }
        
            if( this.selectedAmount &&  this.selectedOptionTax ){
                this.taxAmount = subTotal / taxRate;
            }
        
            // Log the tax amount for debugging purposes
            console.log('Amount:', subTotal);
            console.log('Tax Rate:', taxRate);
            console.log('Calculated Tax Amount:', this.taxAmount);
            this.taxAmount = (subTotal - this.taxAmount).toFixed(2);
            console.log('Calculated Tax Amount:', this.taxAmount);
            this.totalAmount= (subTotal + this.taxAmount).toFixed(2);
            console.log('Calculated Tax Amount:', this.totalAmount);
        }
        if( this.entryType==='Purchases'){
            this.selectedOptionTax = `${rate}`;
            //this.selectedOptionTax = event.currentTarget.dataset.value;
            //console.log('Updated Selected Option in tax:', this.selectedOption);
            // Optionally, hide the table after a selection
            this.showtableTax = false;  // Hide the dropdown table after selecting a row
            console.log(' this.selectedAmount in handleSelectionTax:',  this.selectedAmount);
            //this.totalAmount=this.selectedAmount;
            console.log('totalAmount in handleSelectionTax :  '+this.totalAmount);
            console.log('rate:', rate);
            const totalAmount = parseFloat(this.totalAmount); // Convert amount to a float

            if (isNaN(totalAmount)) {
                console.error('Invalid amount:', this.totalAmount);
                return; // Exit if amount is invalid
            }
        
            // Convert rate to a decimal (e.g., 10% => 0.10)
            const taxRate = (parseFloat(rate) / 100) + 1;
        
            if (isNaN(taxRate)) {
                console.error('Invalid tax rate:', rate);
                return; // Exit if tax rate is invalid
            }
        
            if( this.selectedAmount &&  this.selectedOptionTax ){
                this.taxAmount = totalAmount / taxRate;
            }
        
            // Log the tax amount for debugging purposes
            console.log('Amount:', totalAmount);
            console.log('Tax Rate:', taxRate); 
            console.log('Calculated Tax Amount:', this.taxAmount);
            this.taxAmount = (totalAmount - this.taxAmount).toFixed(2);
            console.log('Calculated Tax Amount:', this.taxAmount);
            this.subTotal= (totalAmount - this.taxAmount).toFixed(2);
        }
          this.listenForOutsideClick = false;
    }
    
    handleDescChange(event)
   {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        const field = event.target.dataset.field;

        if (this.salesEntryList.length > 0) {
            let updatedRecord = { ...this.salesEntryList[0], [fieldName]: fieldValue };

            if (fieldName === 'Description__c')
            {
                this.selectedDescription = fieldValue;
                console.log('this.selectedDescription:', this.selectedDescription);
            }
        }
   }
   handleInputChange(event) {
    const fieldName = event.target.dataset.field;
    const fieldValue = event.target.value;

    console.log('Field Name:', fieldName);
    console.log('Field Value:', fieldValue);

    if (this.salesEntryList.length > 0) {
        let updatedRecord = { ...this.salesEntryList[0], [fieldName]: fieldValue };

        if (fieldName === 'Amount__c') {
            console.log(`Updated Amount for Row: ${fieldValue}`);
            this.selectedAmount = parseFloat(fieldValue);
            console.log('this.selectedAmount:', this.selectedAmount);

            if (this.entryType === 'Sales') {
                // ✅ Ensure selectedAmount is valid
                this.selectedAmount = parseFloat(this.selectedAmount) || 0;
                
                // ✅ Round SubTotal for Sales
                //this.subTotal = Math.round(this.selectedAmount);
                this.subTotal =parseFloat(this.selectedAmount.toFixed(2));
                console.log('subTotal in handleInputChange (Sales):', this.subTotal);
            
                if (this.selectedOptionTax) {
                    console.log('Selected Tax Option (Sales):', this.selectedOptionTax);
            
                    // ✅ Extract numeric value from tax rate
                    let rateMatch = this.selectedOptionTax.match(/\d+(\.\d+)?/);
                    let rate = rateMatch ? parseFloat(rateMatch[0]) : 0;
            
                    console.log('Extracted Rate:', rate);
            
                    if (isNaN(rate)) {
                        console.error('Invalid tax rate:', rate);
                        return;
                    }
            
                    // ✅ Convert to tax multiplier
                    const taxRate = (rate / 100) + 1;
                    console.log('Converted Tax Rate (Sales):', taxRate);
            
                    // ✅ Ensure totalAmount is valid
                    /* this.totalAmount = parseFloat(this.totalAmount);
                    console.log('Total Amount (before calculations):', this.totalAmount); */

                    const taxableAmount = this.subTotal / taxRate;
                    console.log('Taxable Amount (before tax):', taxableAmount);

                    // ✅ Calculate Tax Amount correctly
                    this.taxAmount = parseFloat((this.subTotal - taxableAmount).toFixed(2));
                    console.log('Tax Amount (Sales):', this.taxAmount);
            
                    /* // ✅ Fix NaN issue in subtotal calculation
                    this.subTotal = parseFloat((this.totalAmount / taxRate).toFixed(2));
                    console.log('SubTotal (Sales):', this.subTotal); */
                    this.totalAmount = this.subTotal + this.taxAmount;
                    console.log('Final Tax Amount (Sales):', this.totalAmount);
            
                    
                }
            } else if (this.entryType === 'Purchases') {
                // **Purchases** logic (similar approach to Sales)

                if (this.selectedAmount) {
                    // Round the totalAmount to the nearest integer (in case it needs rounding)
                   // this.totalAmount = Math.round(this.selectedAmount);
                    this.totalAmount = parseFloat(this.selectedAmount.toFixed(2));
                    console.log('totalAmount in handleInputChange (Purchases):', this.totalAmount);

                    if (this.selectedOptionTax) {
                        console.log('Selected Tax Option (Purchases):', this.selectedOptionTax);

                        let rate = this.selectedOptionTax.split(' ')[0];
                        console.log('Raw Rate from selectedOptionTax:', rate);

                        rate = rate.replace('%', '');
                        console.log('Rate without % sign:', rate);

                        const taxRate = (parseFloat(rate) / 100) + 1;
                        console.log('Converted Tax Rate (Purchases):', taxRate);

                        if (isNaN(taxRate)) {
                            console.error('Invalid tax rate:', rate);
                            return;
                        }

                        this.subTotal = parseFloat((this.totalAmount / taxRate).toFixed(2));
                        console.log('SubTotal (Purchases):', this.subTotal);

                        this.taxAmount = parseFloat((this.totalAmount - this.subTotal).toFixed(2));
                        console.log('Tax Amount (Purchases):', this.taxAmount);
                    }
                }
            }
        }

        // Log the updated record and update the sales entry list
        console.log('Updated Record:', JSON.stringify(updatedRecord));
        this.salesEntryList = [updatedRecord];
        console.log('Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    }
}

    handleSave(){
        if (this.buttonLabel === 'Save') {
            this.handleSaveEntry();
        } else  if(this.buttonLabel === 'Update'){
            this.handleUpdate();
            refreshApex(this.wireEntryData);
        } 
    }
    
    handleSaveEntry() {
        if (!this.selectedEntityName || !this.invoiceDate || !this.postDate || !this.entryType ) {
            this.showToast('Error', 'Please complete the required fields before saving.', 'error');
            return;
        }
        // Log the inputs to see what values are being passed to the Apex method
        console.log('Handling save for journal entries');
        console.log('Company ID:', this.selectedCompany);
        console.log('Total Amount:', this.totalAmount);
        console.log('Tax Amount:', this.taxAmount);
        console.log('Subtotal:', this.subTotal); // Log the subtotal value to confirm it is set correctly
        console.log('Selected Item:', this.selectedOptionAL);
        console.log('Description:', this.selectedDescription);
        console.log('tax:', this.selectedOptionTax);
        // Check if subtotal is null or undefined before proceeding
        if (this.subTotal == null || this.subTotal === undefined) {
            console.error('Error: Subtotal is not set or is invalid.');
            this.showToast('Error', 'Subtotal is required and cannot be null.', 'error');
            return;  // Exit the function if subtotal is invalid
        }
        console.log(' this.isGeneralSales  in BEFORE:',  this.isGeneralSales);
        if( this.entryType==='Sales'){
            this.isGeneralSales= true;
        } else {
            this.isGeneralSales= false;
        }
       
             const selectedOptionALName = this.selectedOptionAL.split(' - ')[1];
               console.log(' selectedOptionALName:', selectedOptionALName);

        console.log(' this.isGeneralSales  in handleSaveEntry:',  this.isGeneralSales);
        // Now call the Apex method to create journal entries
        createJournalEntries({
            companyId: this.selectedCompany,
            totalAmount: this.totalAmount,
            taxAmount: this.taxAmount,
            subTotal: this.subTotal, // Ensure this is passed correctly
            selectedItem: selectedOptionALName, // Pass the selected item's name (not Id)
            description: this.selectedDescription,
            createdFromExpenses: 'false',
            //entity: this.entryType,
            isGeneralSales:this.isGeneralSales,
            selectedCardType: this.selectedCardType,
            selectedEntityName: this.selectedEntityName,
            taxInclusive: this.taxInclusive,
            terms: this.terms,
            invoiceDate: this.invoiceDate,
            postDate: this.postDate,
            invoiceNo: this.invoiceNo,
            entryType: this.entryType,
            comments: this.comments,
            amount: this.selectedAmount,
            tax: this.selectedOptionTax
        })
        
        .then(result => {
            console.log('Journal Entries Created Successfully');
            // Handle success, show success message or refresh UI
            this.showToast('Success', 'Journal entries created successfully.', 'success');
            refreshApex(this.wireEntryData); 
        })
        .catch(error => {
            console.error('Error creating journal entries:', error);
            
            // Check if the error has message and then log or show the message
            if (error.body && error.body.message) {
                this.showToast('Error', error.body.message, 'error');
            } else {
                this.showToast('Error', 'An unknown error occurred while creating journal entries.', 'error');
            }
        });
        this.handleClear();
        
        // this.entryFlag=true; 
        // this.addEntry = false;
       
    }
    handleClear(){
        //console.log('console in clear');
        //this.selectedCompany = null;
        //this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = false;
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.entryType = '';
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
        if (this.salesEntryList.length > 0) {
            this.salesEntryList = this.salesEntryList.map(entry => {
                return {
                    ...entry,
                    Description__c: '',
                    Amount__c: ''
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
    @wire(getAccountingExpense, { sDate: '$startdateValueData', eDate: '$enddateValueData', companyId: '$selectedCompany',isExpense:false })
    wiredEntryData(result) {
        console.log('selectedCompany in wiredEntryData before:', this.selectedCompany);
        this.wireEntryData = result;
       
        console.log('result in wiredExpenseData:', JSON.stringify(result));

        const { data, error } = result;
        if (data) {
            console.log('result in wiredEntryData inside if :', JSON.stringify(result));
            // Map over the data and store it in companyData
            this.records = data.map(expense => ({
                
                  Id: expense.Id,
                  Name: expense.Accounting_Invoices_Expenses__r.New_Format_Invoice_No__c,
                  description:expense.Description__c,
                 entryType: expense.Entry_Type__c,
                 entityName: expense.Entity_Profile__r
                 ? (expense.Entity_Profile__r.First_Name__c && expense.Entity_Profile__r.Last_Name__c
                     ? `${expense.Entity_Profile__r.First_Name__c} ${expense.Entity_Profile__r.Last_Name__c}`  // Use First and Last Name if available
                     : expense.Entity_Profile__r.Name__c)  // Use Name if First and Last Name are not available
                 : 'No Entity Profile', 
                 gst: expense.Tax_Amount__c,
                 amount: expense.Amount__c,
                 ledgerItem:expense.Accounting_Ledger_Items__r.Name,

                 date: expense.Invoice_Date__c ? new Date(expense.Invoice_Date__c).toLocaleDateString('en-GB') : '',
               // Invoice_Date__c:invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
             }));
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
             if (this.totalRecords > 0) {
                    this.paginationVisible = true;
                }
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
    closeaddExpenses() {
        this.addEntry = true;
        this.entryFlag = false;
    }
    hideModalBox(){
        this.entryFlag=true; 
        this.addEntry = false;
        refreshApex(this.wireEntryData); 
        // this.isEdit=false;  
        // this.isFileAttached=false; 
        // this.addImport=false;     
    }
    handleChangeCompany(event){
        this.selectedCompany=event.target.value;
        console.log('Select Company===>'+event.target.value);
        console.log('Select Company===>'+this.selectedCompany);
       // refreshApex(this.wiredAccountList); 
    }
    handleAddEntry(){
        this.entryFlag=false; 
        this.addEntry = true;
        this.createEditEntry='Create Entry';
        this.buttonLabel = 'Save';
        this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = true;
        this.terms = '';
        this.invoiceDate = null;
        this.postDate = null;
        this.invoiceNo = '';
        this.entryType = '';
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
    handleClick(event){
        this.entryFlag = false;
        this.addEntry = true;
        this.createEditEntry='Edit Entry';
        this.buttonLabel ='Update';
        this.entryID=event.currentTarget.dataset.id;
            console.log('Edit button clicked for entryID : ' + this.entryID);
            this.fetchEntryDetails(this.entryID);
           
    }
    fetchEntryDetails(entryID) {
        console.log('Fetching entry details for entryID: ' + entryID);
        
        getEntryOnEdit({ entryID: entryID })
            .then(result => {
                console.log('entry data fetched:', JSON.stringify(result));
    
               
                if (result) {
                    // Map the fields to your form data
                    const expense = result;
                    const entityProfile = result.Entity_Profile__r;
                   
                // Create the entryNameOptions dynamically based on Entity_Profile__r fields
                    this.entryNameOptions = [{
                        label: entityProfile.Name__c 
                            ? entityProfile.Name__c // Use Name__c if available
                            : `${entityProfile.First_Name__c} ${entityProfile.Last_Name__c}`, // Use First Name and Last Name otherwise
                        value: entityProfile.Id
                    }];
                    console.log('entryNameOptions :', JSON.stringify(this.entryNameOptions));
                   
                    this.selectedEntityName=expense.Entity_Profile__r.Id;
                    console.log('selectedEntityName: ' + this.selectedEntityNam);
                    // Ensure the data is assigned to the form variables
                    this.selectedCompany =expense.Company__c, 
                    this.totalAmount = expense.Amount__c || 0;
                    this.selectedAmount = expense.Amount__c || 0;
                    this.taxAmount = expense.Tax_Amount__c || 0;
                    this.subTotal = this.totalAmount - this.taxAmount; // You may want to calculate it like this (assuming)
                    //this.selectedOptionAL = expense.Accounting_Ledger_Items__r ? expense.Accounting_Ledger_Items__r.Name : '';
                    this.selectedOptionAL = expense.Accounting_Ledger_Items__r ? ` ${expense.Accounting_Ledger_Items__r.Account_Number__c} ${expense.Accounting_Ledger_Items__r.Name}`: '';
                    
                   this.selectedDescription = expense.Description__c || '';
                    this.selectedCardType = expense.Entity_Profile__r ? expense.Entity_Profile__r.Card_Type__c : '';
                   
                    this.taxInclusive = expense.Tax_Inclusive__c || false; // Set taxInclusive if applicable
                    //this.terms = expense.Terms__c || ''; // Set terms if applicable
                    this.invoiceDate = expense.Invoice_Date__c || '';
                    this.postDate = expense.Post_Date__c || ''; // Set post date if applicable
                    this.invoiceNo = expense.Invoice_No__c	 || ''; // Assuming Name is the invoice number
                    this.entryType = expense.Entry_Type__c || '';
                    this.comments = expense.Comments__c || '';
                    this.selectedOptionTax=expense.Tax__c ? `${expense.Tax__c}%` : '';
                     const selectedOptionALName = this.selectedOptionAL.split(' - ')[1];
                     console.log(' selectedOptionALName:', selectedOptionALName);
                    // Log populated fields
                    console.log('Populated Fields: ', {
                        totalAmount: this.totalAmount,
                        taxAmount: this.taxAmount,
                        subTotal: this.subTotal,
                        selectedItem: this.selectedOptionALName,
                        selectedDescription: this.selectedDescription,
                        selectedCardType: this.selectedCardType,
                        selectedEntityName: this.selectedEntityName,
                        taxInclusive: this.taxInclusive,
                        invoiceDate: this.invoiceDate,
                        postDate: this.postDate,
                        invoiceNo: this.invoiceNo,
                        entryType: this.entryType,
                        comments: this.comments,
                        amount: this.selectedAmount,
                        selectedOptionTax:this.selectedOptionTax,
                        entrynameOptions:  this.entryNameOptions
                    });
    
                    // Optionally update your button label or form title for edit mode
                    this.createEditExpense = 'Edit Entry';
                    this.buttonLabel = 'Update';
                    this.entryID = entryID;  // Store the ID for future use
                } else {
                    this.showToast('Error', 'No data found for the expense!', 'error');
                }
            })
            .catch(error => {
                this.showToast('Error', 'Error fetching entry data!', 'error');
                console.error('Error fetching entry data', error);
            });
    }
    RefreshExpensesData(){
        refreshApex(this.wireEntryData);  
    }
    handleUpdate() {
       
        const updatedEntry = {
            Id: this.entryID,  // The ID of the expense to update
            Description__c: this.selectedDescription,
            Quantity__c: this.selectedQuantity,
            Unit_Price__c: this.selectedUnitPrice,
            Tax__c: this.selectedOptionTax,
            Comments__c: this.selectedComments,
            Invoice_Date__c: this.invoiceDate,
            Amount__c: this.totalAmount,
            Tax_Amount__c: this.taxAmount,
            Entry_Type__c: this.entryType,
            Entity_Profile__c: this.selectedEntityName,  // Use the selected entity name
            //Accounting_Ledger_Items__c: this.selectedOptionAL,  // Use selected ledger item
             Accounting_Ledger_Items__c:  this.selectedItemId,
            Invoice_No__c: this.invoiceNo,
            Tax_Inclusive__c: this.taxInclusive,
            Post_Date__c: this.postDate,
            Company__c:this.selectedCompany,
            Sub_Total__c:this.subTotal,
            Entity_type__c:this.selectedCardType,


        };
        console.log('updatedEntry==>'+JSON.stringify(updatedEntry));

    //     if(this.entryType==='Purchases'){
    //         // Call the Apex method to update the expense
    //         updateExpense({ updatedExpense: updatedEntry })
    //             .then(result => {
    //                 if (result) {
    //                     // If the update is successful, provide feedback to the user
    //                     this.showToast('Success', 'Entry updated successfully!', 'success');
                      
    //                 } else {
    //                     // If the update fails, show an error message
    //                     this.showToast('Error', 'Failed to update entry!', 'error');
    //                 }
    //                 // console.log('refresh1');
    //                 // refreshApex(this.wireEntryData);
    //                 // console.log('refresh2'); 
    //                 return refreshApex(this.wireEntryData);
    //             })
    //             .catch(error => {
    //                 // Handle any errors that occur during the update
    //                 this.showToast('Error', 'Error updating entry data!', 'error');
    //                 console.error('Error updating entry:', error);
    //             });
    //     } else if(this.entryType==='Sales'){
    //         updateSalesEntry({ updatedExpense: updatedEntry })
    //         .then(result => {
    //             if (result) {
    //                 // If the update is successful, provide feedback to the user
    //                 this.showToast('Success', 'Entry updated successfully!', 'success');
                    
    //             } else {
    //                 // If the update fails, show an error message
    //                 this.showToast('Error', 'Failed to update entry!', 'error');
    //             }
    //             // refreshApex(this.wireEntryData);
    //             return refreshApex(this.wireEntryData);
    //         })
    //         .catch(error => {
    //             // Handle any errors that occur during the update
    //             this.showToast('Error', 'Error updating entry data!', 'error');
    //             console.error('Error updating entry:', error);
    //         });
    //     }
    //    //refreshApex(this.wireEntryData);
    let updatePromise;

    // Decide the update method based on Entry Type
    if (this.entryType === 'Purchases') {
        updatePromise = updateExpense({ updatedExpense: updatedEntry });
    } else if (this.entryType === 'Sales') {
        updatePromise = updateSalesEntry({ updatedExpense: updatedEntry });
    }

    updatePromise
        .then(result => {
            if (result) {
                this.showToast('Success', 'Entry updated successfully!', 'success');
                refreshApex(this.wireEntryData);
            } else {
                this.showToast('Error', 'Failed to update entry!', 'error');
            }
        })
        .then(() => {
            console.log('Data refreshed after update');
        })
        .catch(error => {
            this.showToast('Error', 'Error updating entry data!', 'error');
            console.error('Error updating entry:', error);
        }); 
        this.entryFlag=true; 
        this.addEntry = false; 
    }

    handleDelete(event){

     const expenseId  = event.currentTarget.dataset.id;
     console.log('event data >>'+expenseId );
     this.selectedExpenseId = expenseId; 
     this.invoiceDeleteFlag=true;
       
    }
     handleYesDelete(event){
        if ( this.selectedExpenseId ) {
            deleteExpenseRecord({ expenseId:  this.selectedExpenseId  })
                .then(() => {
                    // Remove the deleted record from the local list
                   
                    console.log('Deleted successfully');
                    refreshApex(this.wireEntryData); 
                    this.showToast('Success', 'Entry is deleted successfully', 'success');
                })
                .catch(error => {
                    console.error('Error deleting record:', error);
                    this.showToast('Error', error.body.message || 'Failed to delete', 'error');
                });
        }
            this.paginationHelper();    
            this.invoiceDeleteFlag=false;
        }
        handleDeleteclose(event){
            this.invoiceDeleteFlag=false;
        }
    // handleFocus() {
    //     this.showtable = true;
    //     //this.fetchLedgerItemsforExpenses();
    //     this.FilteredLedgerItems = [...this.ledgerItems];

    // }

    // handleBlur() {
    //     setTimeout(() => {
    //         this.showtable = false;
    //     }, 200);
    // }

    handleSearch(event) {
        this.selectedOptionAL = event.target.value;
        const searchLower = this.selectedOptionAL.toLowerCase();

        this.FilteredLedgerItems = this.ledgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });

        if (!this.selectedOptionAL) {
            this.FilteredLedgerItems = [...this.ledgerItems];
        }

        this.showtable = true;
    }

}