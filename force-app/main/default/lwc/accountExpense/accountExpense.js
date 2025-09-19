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
import getExpenseOnEdit from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getExpenseOnEdit';
import updateExpense from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateExpense';
import { refreshApex } from '@salesforce/apex';
import deleteExpenseRecord from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.deleteExpenseRecord';

export default class AccountExpense extends LightningElement {
    @api orgid;
    @api companyid;
    @api companyname;
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
   
    wiredCompanyList;
    wiredEntityProfilesResult;
    @track entryNameOptions=[];
    @track selectedEntityName;
    @track taxInclusive=false;
    @track terms;
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
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
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

    @track createEditExpense='Create Purchases';
    @track entryOptions=[{label:'Purchases',value:'Purchases'}];
    @track entryType = 'Purchases';
    @track entityOptions= [{label:'Supplier',value:'Supplier'}];
    @track selectedCardType = 'Supplier';
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
    connectedCallback(){
        console.log('companyid in connectedCallback AccountExpense: ', this.companyid);
        this.companyId = this.companyid;
        console.log(' companyname in connectedCallback AccountExpense: ', this.companyname);
        console.log('companyId in connectedCallback AccountExpense: ', this.companyid);
        console.log('entityOptions : ', JSON.stringify( this.entityOptions));
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
    }
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
            if (this.companyOptions.length > 0) {
                this.selectedCompany = this.companyOptions[0].value;
            }
        } else if (error) {
            console.error('Error fetching companies:', error);
        }
    }
    // @wire(getEntityProfiles, { cardType: '$selectedCardType',companyId: '$companyId' })
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
    //         console.log('entryNameOptions : ', JSON.stringify( this.entryNameOptions));
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
    @wire(getEntityProfileTax, { entityId: '$selectedEntityName' })
    wiredTax({ error, data }) {
        if (data) {
            // If the Apex call returns a tax value, assign it to selectedOptionTax
            this.selectedOptionTax = this.appendPercentage(data);
            console.log('Tax Value:', this.selectedOptionTax); // Log the tax value for verification
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
    //     if (fieldName === 'company') {
    //         this.companyId = fieldValue;
    //         console.log('Selected Company ID:', this.companyId);
    //     }
    //     if (fieldName === 'entryType') {
    //         this.entryType = fieldValue;
    //         console.log('Selected entryType: ', this.entryType);
    //     }
    //     if (fieldName === 'subTotal') {
    //         this.subTotal = fieldValue;
    //         console.log('Selected sub total:', this.subTotal);
    //     }
    // }
    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
    
        switch(fieldName) {
            case 'company':
                this.companyId = fieldValue;
                console.log('Selected Company ID:', this.companyId);
                break;
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
                this.taxInclusive = fieldValue;
                console.log('Tax Inclusive:', this.taxInclusive);
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
    
    
    toggleDropdownAccountList(event) {
        console.log('toggleDropdown');
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
       
    }
    toggleDropdownTax(event) {
        console.log('toggleDropdown');
          // Calculate the position of the dropdown button 
          this.showtableTax = !this.showtableTax;
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
    }
    // Handle the selection of a ledger item from the popover
    handleSelection(event) {
        // Use event.currentTarget to refer to the <tr> element, not the clicked <td> element
        const selectedRow = event.currentTarget;
    
        console.log('Selected Row:', selectedRow);
        console.log('Account Number:', selectedRow.dataset.accno);
        this.selectedItem= selectedRow.dataset.value
        console.log('Item Name:', this.selectedItem);
    
        if (selectedRow.dataset.accno && selectedRow.dataset.value) {
           this.selectedOptionAL = `${selectedRow.dataset.accno} - ${selectedRow.dataset.value}`;
           //this.selectedOptionAL = selectedRow.dataset.accno;
        } else {
            console.log('Selected item does not have expected data.');
        }
    
        console.log('Updated Selected Option:', this.selectedOptionAL);
    
        // Hide the table once an item is selected
        this.showtable = false;
    }

    handleSelectionTax(event) {
        console.log('this.entryType====>' + this.entryType);
    
        // Get the clicked row's data using dataset
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
    
        if (this.entryType === 'Sales') {
            // Update the selectedOptionTax to display the selected option
            this.selectedOptionTax = `${rate}`;
            this.showtableTax = false;  // Hide the dropdown table after selecting a row
    
            console.log('Subtotal:', this.subTotal);
            console.log('Rate:', rate);
    
            const subTotal = parseFloat(this.subTotal);
    
            if (isNaN(subTotal)) {
                console.error('Invalid amount:', this.subTotal);
                return; // Exit if amount is invalid
            }
    
            // Convert rate to decimal (e.g., 10% => 0.10)
            const taxRate = parseFloat(rate) / 100;
    
            if (isNaN(taxRate)) {
                console.error('Invalid tax rate:', rate);
                return; // Exit if tax rate is invalid
            }
    
            if (this.selectedAmount && this.selectedOptionTax) {
                this.taxAmount = parseFloat((subTotal * taxRate).toFixed(2)); // Round to 2 decimals
            }
    
            // Calculate Total Amount (Sales) (Rounded to 2 decimals)
            this.totalAmount = parseFloat((subTotal + this.taxAmount).toFixed(2));
    
            // Log the tax amount for debugging purposes
            console.log('Amount:', subTotal);
            console.log('Tax Rate:', taxRate);
            console.log('Calculated Tax Amount (Sales):', this.taxAmount);
            console.log('Total Amount (Sales):', this.totalAmount);
        } 
        else if (this.entryType === 'Purchases') {
            this.selectedOptionTax = `${rate}`;
            this.showtableTax = false;  // Hide the dropdown table after selecting a row
    
            console.log('Selected Amount in handleSelectionTax:', this.selectedAmount);
            console.log('Total Amount in handleSelectionTax:', this.totalAmount);
            console.log('Rate:', rate);
    
            const totalAmount = parseFloat(this.totalAmount);
    
            if (isNaN(totalAmount)) {
                console.error('Invalid amount:', this.totalAmount);
                return; // Exit if amount is invalid
            }
    
            // Convert rate to decimal and add 1 for purchases formula (e.g., 10% => 1.10)
            const taxRate = 1 + (parseFloat(rate) / 100);
    
            if (isNaN(taxRate)) {
                console.error('Invalid tax rate:', rate);
                return; // Exit if tax rate is invalid
            }
    
            if (this.selectedAmount && this.selectedOptionTax) {
                this.subTotal = parseFloat((totalAmount / taxRate).toFixed(2)); // Round to 2 decimals
                this.taxAmount = parseFloat((totalAmount - this.subTotal).toFixed(2)); // Round to 2 decimals
            }
    
            // Log the calculated values
            console.log('Total Amount:', totalAmount);
            console.log('Tax Rate:', taxRate);
            console.log('Calculated SubTotal (Purchases):', this.subTotal);
            console.log('Calculated Tax Amount (Purchases):', this.taxAmount);
        }
    }
    
    
    // handleInputChange(event) {
    //     const fieldName = event.target.dataset.field;  
    //     const fieldValue = event.target.value;  
    
    //     // Assuming you only have one row, you can access it directly
    //     console.log('Field Name:', fieldName);  
    //     console.log('Field Value:', fieldValue);  
    
    //     // Update the salesEntryList directly
    //     if (this.salesEntryList.length > 0) {
    //         let updatedRecord = { ...this.salesEntryList[0], [fieldName]: fieldValue };
    //         if (fieldName === 'Description__c') {
    //             this.selectedDescription =fieldValue;
    //             console.log(' this.selecteDescription:',  this.selectedDescription);
    //         }

    //         // You can add any other specific logic for the 'amount' field if necessary
    //         if (fieldName === 'Amount__c') {
    //             // You can do some specific validation or formatting for the amount field if needed
    //             console.log(`Updated Amount for Row : ${fieldValue}`);
    //             this.selectedAmount =fieldValue;
    //             console.log(' this.selectedAmount:',  this.selectedAmount);
    //             if(this.entryType==='Sales'){
    //                 this.subTotal=this.selectedAmount;
    //                 console.log('subTotal in handleInputChange :  '+this.subTotal);
    //             } else if (this.entryType==='Purchases'){
    //                 this.totalAmount=this.selectedAmount;
    //                 console.log('totalAmount in handleInputChange :  '+this.totalAmount);
    //             }
    //         }
    //         // Log the updated record
    //         console.log('Updated Record:', JSON.stringify(updatedRecord));
    
    //         // Update the salesEntryList
    //         this.salesEntryList = [updatedRecord];  // We replace the old record with the updated one
    
    //         console.log('Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    //     }
    // }
   // Handle input changes for amount

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
        const field = event.target.dataset.field;
        // this.salesEntryList = { ...this.salesEntryList[0], [field]: event.target.value };
        console.log('Field Name:', field);
        console.log('Field Name:', fieldName);
        console.log('Field Value:', fieldValue);    

        if (this.salesEntryList.length > 0) {
            let updatedRecord = { ...this.salesEntryList[0], [fieldName]: fieldValue };

            if (fieldName === 'Amount__c') {
                console.log(`Updated Amount for Row: ${fieldValue}`);
                this.selectedAmount = parseFloat(fieldValue);
                console.log('this.selectedAmount:', this.selectedAmount);

                if (this.entryType === 'Sales') {
                    // Sales logic remains unchanged
                    this.subTotal = parseFloat(this.selectedAmount.toFixed(2));
                    console.log('subTotal in handleInputChange (Sales):', this.subTotal);

                    if (this.selectedOptionTax) {
                        console.log('Selected Tax Option (Sales):', this.selectedOptionTax);

                        let rate = this.selectedOptionTax.split(' ')[0];
                        console.log('Raw Rate from selectedOptionTax:', rate);

                        rate = rate.replace('%', '');
                        console.log('Rate without % sign:', rate);

                        const taxRate = parseFloat(rate) / 100;
                        console.log('Converted Tax Rate (Sales):', taxRate);

                        if (isNaN(taxRate)) {
                            console.error('Invalid tax rate:', rate);
                            return;
                        }

                        // Calculate Tax Amount for Sales (Rounded to 2 decimals)
                        this.taxAmount = parseFloat((this.subTotal * taxRate).toFixed(2));
                        console.log('Calculated Tax Amount (Sales):', this.taxAmount);

                        // Calculate Total Amount (Sales) (Rounded to 2 decimals)
                        this.totalAmount = parseFloat((this.subTotal + this.taxAmount).toFixed(2));
                        console.log('Total Amount (Sales):', this.totalAmount);
                    }
                } 
                else if (this.entryType === 'Purchases') {
                    // **Fixed Purchases Calculation (Rounded to 2 Decimals)**
                    if (this.selectedAmount) {
                        this.totalAmount = parseFloat(this.selectedAmount.toFixed(2));
                        console.log('totalAmount in handleInputChange (Purchases):', this.totalAmount);

                        if (this.selectedOptionTax) {
                            console.log('Selected Tax Option (Purchases):', this.selectedOptionTax);

                            let rate = this.selectedOptionTax.split(' ')[0];
                            console.log('Raw Rate from selectedOptionTax:', rate);

                            rate = rate.replace('%', '');
                            console.log('Rate without % sign:', rate);

                            const taxRate = parseFloat(rate) / 100;
                            console.log('Converted Tax Rate (Purchases):', taxRate);

                            if (isNaN(taxRate)) {
                                console.error('Invalid tax rate:', rate);
                                return;
                            }

                            // ✅ Corrected Formula for Purchases (Rounded to 2 Decimals)
                            const taxCalculatedValue = 1 + taxRate;
                            console.log('Tax Calculated Value (Purchases):', taxCalculatedValue);

                            this.subTotal = parseFloat((this.totalAmount / taxCalculatedValue).toFixed(2));
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
            this.handleSaveExpense();
        } else  if(this.buttonLabel === 'Update'){
            this.handleUpdate();
            //refreshApex(this.wireExpenseData); 
        } 
   }
  


    
    handleSaveExpense() {

        console.log()
        // Log the inputs to see what values are being passed to the Apex method
        console.log('Handling save for journal entries');
        console.log('Company ID:', this.companyId);
        console.log('Total Amount:', this.totalAmount);
        console.log('Tax Amount:', this.taxAmount);
        console.log('Subtotal:', this.subTotal); // Log the subtotal value to confirm it is set correctly
        console.log('Selected Item:', this.selectedItem);
        console.log('Description:', this.selectedDescription);
        console.log('Tax: '+ this.selectedOptionTax);
        console.log('amount: '+ this.selectedAmount);
    
        // Check if subtotal is null or undefined before proceeding
        if (this.subTotal == null || this.subTotal === undefined) {
            console.error('Error: Subtotal is not set or is invalid.');
            this.showToast('Error', 'Subtotal is required and cannot be null.', 'error');
            return;  // Exit the function if subtotal is invalid
        }
    
        // Now call the Apex method to create journal entries
        createJournalEntries({
            companyId: this.companyId,
            totalAmount: this.totalAmount,
            taxAmount: this.taxAmount,
            subTotal: this.subTotal, // Ensure this is passed correctly
            selectedItem: this.selectedItem, // Pass the selected item's name (not Id)
            description: this.selectedDescription,
            createdFromExpenses: true,
            //entity: this.entryType,
    
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
            refreshApex(this.wireExpenseData);  
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
    }
    handleClear(){
        //console.log('console in clear');
        this.isExpenses = true;
        this.openExpenses = false;
        //this.companyId = null;
        this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = false;
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
    @wire(getAccountingExpense, { sDate: '$startdateValueData', eDate: '$enddateValueData', companyId: '$companyId',isExpense:true })
    wiredExpenseData(result) {
        console.log('selectedCompany in wiredExpenseData before:', this.companyId);
        this.wireExpenseData = result;
       
        console.log('result in wiredExpenseData:', JSON.stringify(result));

        const { data, error } = result;
        if (data) {
            console.log('result in wiredExpenseData inside if :', JSON.stringify(result));
            // Map over the data and store it in companyData
            this.records = data.map(expense => ({
                
                  Id: expense.Id,
                 Name: expense.Name,
                 description:expense.Description__c,
                 entityName: expense.Entity_Profile__r
                    ? (expense.Entity_Profile__r.First_Name__c && expense.Entity_Profile__r.Last_Name__c
                        ? `${expense.Entity_Profile__r.First_Name__c} ${expense.Entity_Profile__r.Last_Name__c}`  // Use First and Last Name if available
                        : expense.Entity_Profile__r.Name__c)  // Use Name if First and Last Name are not available
                    : 'No Entity Profile', 
                 invoiceNo: expense.Invoice_Number__c,
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
             console.log(' this.records in wiredExpenseData:', JSON.stringify( this.records));
            this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
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
        //this.handleClear();
           
        //this.companyId = null;
       // this.selectedCardType = '';
        this.selectedEntityName = null;
        this.taxInclusive = false;
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
        if (this.salesEntryList.length > 0) {
            this.salesEntryList = this.salesEntryList.map(entry => {
                return {
                    ...entry,
                    Description__c: '',
                    Amount__c: ''
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
        this.createEditExpense='Edit Purchase';
        this.expenseID=event.currentTarget.dataset.id;
            console.log('Edit button clicked for expenseID : ' + this.expenseID);
            this.fetchExpenseDetails(this.expenseID);
            this.hideParent();    
    }
    fetchExpenseDetails(expenseID) {
        console.log('Fetching expense details for invoiceID: ' + expenseID);
        
        getExpenseOnEdit({ expenseID: expenseID })
            .then(result => {
                console.log('Expense data fetched:', JSON.stringify(result));
    
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
                    console.log('selectedEntityName: ' + this.selectedEntityName);
                    // Ensure the data is assigned to the form variables
                    this.companyId =expense.Company__c, 
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
                    // Log populated fields
                    console.log('Populated Fields: ', {
                        totalAmount: this.totalAmount,
                        taxAmount: this.taxAmount,
                        subTotal: this.subTotal,
                        selectedItem: this.selectedItem,
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
                        entrynameOptions:  this.entryNameOptions,
                        companyId:this.companyId
                    });
    
                    // Optionally update your button label or form title for edit mode
                    this.createEditExpense = 'Edit Purchase';
                    this.buttonLabel = 'Update';
                    this.expenseID = expenseID;  // Store the ID for future use
                } else {
                    this.showToast('Error', 'No data found for the expense!', 'error');
                }
            })
            .catch(error => {
                this.showToast('Error', 'Error fetching expense data!', 'error');
                console.error('Error fetching expense data', error);
            });
    }
    handleUpdate() {
        // Create the updated expense object
        const updatedExpense = {
            Id: this.expenseID,  // The ID of the expense to update
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
            Accounting_Ledger_Items__c: this.selectedOptionAL,  // Use selected ledger item
            Invoice_No__c: this.invoiceNo,
            Tax_Inclusive__c: this.taxInclusive,
            Post_Date__c: this.postDate,
            Company__c:this.companyId,
            Sub_Total__c:this.subTotal,
            Entity_type__c:this.selectedCardType,


        };
        console.log('updatedExpense==>'+JSON.stringify(updatedExpense));
    
        // Call the Apex method to update the expense
        updateExpense({ updatedExpense: updatedExpense })
            .then(result => {
                if (result) {
                    
                    // If the update is successful, provide feedback to the user
                    this.showToast('Success', 'Expense updated successfully!', 'success');
                    refreshApex(this.wireExpenseData); 
                    
                } else {
                    // If the update fails, show an error message
                    this.showToast('Error', 'Failed to update expense!', 'error');
                }
            })
            .catch(error => {
                // Handle any errors that occur during the update
                this.showToast('Error', 'Error updating expense data!', 'error');
                console.error('Error updating expense:', error);
            });
            // console.log('console1');
            // refreshApex(this.wireExpenseData); 
            // console.log('console2'); 
            this.handleClear();
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
                    refreshApex(this.wireExpenseData); 
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
    
}