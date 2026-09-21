import { LightningElement, track, api, wire } from 'lwc';
import getLedgerItemsAssetsLiabilities from '@salesforce/apex/AccountingBankingController.getLedgerItemsAssetsLiabilities';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getAllLedgerItems from '@salesforce/apex/AccountingChartController.getAllLedgerItems';
import deleteMatchingRecordsRfq from '@salesforce/apex/AccountingChartController.deleteMatchingRecordsRfq';
import updateDataForCashPayment from '@salesforce/apex/AccountingBankingController.updateDataForCashPayment';
import updateLedgerItemId from '@salesforce/apex/AccountingBankingController.updateLedgerItemId';
import updateDataForCashReceipt from '@salesforce/apex/AccountingBankingController.updateDataForCashReceipt';

export default class TesseractAppsBankingCashTransactionsLwc extends LightningElement {

    @track selectedCompany;
    @track companyname;
    @track isCashPayment = true;
    @track isReceiptsFlag= false;
    @track transactionType = 'Payments';
    @track entryType ;
    @track customerDropdownStyle = '';
    customerShowTable = false;
    FilteredLedgerItemsNew = [];
    customerSelectedAccountId = '';
    activeRowId = '';
    @track ledgerItemsNew = [];
    @track transactionTypeOptions = [{label:'Payments',value:'Payments'},{label:'Receipts',value:'Receipts'}];
    @track selectedOptionALNew ='';
    @track invoiceNumber;
    @track invoiceName;
    @track invoiceDate;
    @track comments;
    @track cashPaymentAmount;
    @track salesEntryList = [];
    @track listenForOutsideClick = false;
    @track showtable = false;  
    @track showtableTax = false;  
    @track filteredTaxCodes = [];
    @track deletedRowIds = [];
    // @track taxInclusive=false;
    @track taxInclusive=true;
    @track ledgerItemsNew = [];
    @track ledgerItems = []; 
    //@track cashTotalAllocated;
    @track taxAmount;
    @track cashTotalPaid;
   // @track cashOutOfBalance;
    @track selectedOptionTax;
    @track selectedLedgerItemId;
    //@track disabledSubmit = true;
    @track amount;

     selectedRowIdReceit;
    @track InvoiceNoReceit = '';
    @track invoiceDateReceit = '';
    @track taxInclusiveReceit = true;
    @track commentsReceit = '';
    @track salesEntryListReceit = [];
    @track showtableReceit = false;
    @track showtableTaxReceit = false;

    @track FilteredLedgerItemsReceit = [];
    @track filteredTaxCodesReceit = [];
  //  @track cashTotalAllocatedReceit = 0;  
    @track cashTotalReceived = 0;        
    //@track cashOutOfBalanceReceit = 0;
    @track taxAmountReceived=0;
    @track taxDropdownStyle;
    toggleDropdownAccountReceit = '';
    @track taxDropdownStyleReceit;
    @track activeRowIdReceit;
    @track deletedRowIdsReceit = [];
   // disabledCashReceitSubmit = true;
   @track isTaxAmountChangeFlag=false;
   @track selectedTaxChangeOption;
    @track selectedRowId; 
    @track amountarrey = [];  
    @track isTaxAmountChangeFlagReceit=false;
   @track selectedTaxReceitChangeOption;
   

    @track salesEntry = {
        company: this.selectedCompany,
        entryType: 'Purchases',
        InvoiceDate: '',
        InvoiceNo: '',
        comments: '',
        taxInclusive: true
    };
    @track salesEntryReceit = {
        company: this.selectedCompany,
        entryType: 'Sales',   
        InvoiceDateReceit: '',
        InvoiceNoReceit: '',
        commentsReceit: '',
        taxInclusiveReceit: true
    };
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
     createRow() {
        const newRow = {
            Id: Date.now(),
            sno: this.salesEntryList.length + 1,
            Description__c: '',
            // accountList: this.selectedOptionAL1,
            // accountItemId: this.selectedOptionALId,
            accountList: '6-',
            accountItemId: '',
            Amount__c: 0,
            Cash_Paid__c:'',
           // tax: this.selectedOptionTax1,
            tax: '',
            paid:0,
            allowTaxEdit: false
        };
        return newRow;
    }

    
    get paymentsClass(){
        return this.isCashPayment  ? 'menu-item1' : 'menu-item'; 
    }
    get receiptsClass(){
      return this.isReceiptsFlag  ? 'menu-item1' : 'menu-item'; 
    }
    get taxChangeOptions() {
        return [
          { label: "Proceed with Override", value: "ProceedWithOverride" },
          { label: "Cancel", value: "cancel" }
        ];
    }
    get taxReceitChangeOptions() {
        return [
          { label: "Proceed with Override", value: "ProceedWithOverrideReceit" },
          { label: "Cancel", value: "cancelReceit" }
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
         const today = new Date().toISOString().split('T')[0];
        
       if (this.entryType === 'Purchases'  || this.isCashPayment) {
            this.invoiceDate = today;
            
            this.salesEntry = {
                ...this.salesEntry,
                InvoiceDate: today,
                company: this.selectedCompany
            };

            console.log('Default Purchase InvoiceDate set:', this.salesEntry.InvoiceDate);

            // Create first empty row for Payment
            this.addRow();
        }

        // 🟩 CASE 2: Sales (Cash Receipt)
        if (this.entryType === 'Sales' || this.isReceiptsFlag) {
               console.log('addRowReceit');
            this.invoiceDateReceit = today;

            this.salesEntryReceit = {
                ...this.salesEntryReceit,
                InvoiceDateReceit: today,
                company: this.selectedCompany
            };

            console.log('Default Receipt InvoiceDate set:', this.salesEntryReceit.InvoiceDateReceit);

            // Create first empty row for Receipt
            this.addRowReceit();
        }
        window.addEventListener('click', this.handleOutsideClick);
   }
    @track highestTaxAmount = 0;
    disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
    }
   
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

             const dropdownElementReceit = this.template.querySelector('[data-id="accountListTableDropdownReceit"]');
            if (dropdownElementReceit && !dropdownElementReceit.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdownReceit');
                this.showtableReceit = false;
                this.listenForOutsideClick = false;
                
            }

            // Tax dropdown for cash receipt
            const dropdownTaxReceit = this.template.querySelector('[data-id="taxTableDropdownReceit"]');
            if (dropdownTaxReceit && !dropdownTaxReceit.contains(event.target)) {
                console.log('🟥 Outside click: taxTableDropdownReceit');
                this.showtableTaxReceit = false;
                this.listenForOutsideClick = false;
            }
        }
    };
    addRow() {
        console.log('addRow');
        this.resetAllDropdowns(); 

        const newRow = this.createRow();
        this.salesEntryList = [...this.salesEntryList, newRow];
        console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
        this.reindexSalesEntryList(); // ensure S.No is always in order
        //this.disabledSubmit = true;
        // Get highest taxAmount
        const taxAmounts = this.salesEntryList
            .map(row => Number(row.taxAmount))
            .filter(val => !isNaN(val));
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
    
    handleSupplierSearch1(event) {
        const rowId = event.target.dataset.id;
        let inputValue = event.target.value;

        console.log("Typing Input:", inputValue);

        // Update row value immediately
        this.salesEntryList = this.salesEntryList.map(row => {
            if (row.Id == rowId) {
                return { ...row, accountList: inputValue };
            }
            return row;
        });

        const searchLower = inputValue.toLowerCase();

        // Filter normally on user input
        const filtered = this.ledgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || "";
            const itemName = item.itemName?.toLowerCase() || "";
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });

        this.FilteredLedgerItems = filtered;
        this.activeRowId1 = rowId;
        this.showtable = true;
    }

    
    toggleDropdownTax(event) {
        this.resetAllDropdowns(); 
        this.selectedRowId = event.currentTarget.dataset.id;
        this.showtableTax = !this.showtableTax;
        console.log(' this.showtableTax11  : ', this.showtableTax );

        
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
            console.log(' this.showtableTax 22 : ', this.showtableTax );

        if (this.showtableTax) {
                console.log(' this.showtableTax 33 : ', this.showtableTax );

            setTimeout(() => {
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            this.listenForOutsideClick = false;
        }
         console.log(' this.showtableTax 44 : ', this.showtableTax );
    }
    handleDropdownPosition(event) {
        this.resetAllDropdowns(); 
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

    filterLedgerForSixPrefix(rowId) {
        const row = this.salesEntryList.find(r => r.Id == rowId);
        const searchLower = (row?.accountList || "").toLowerCase();

        this.FilteredLedgerItems = this.ledgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || "";
            const itemName = item.itemName?.toLowerCase() || "";
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.startsWith("6") ||   // MAIN FILTER FOR 6-
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });

        console.log("🔎 Filtered Immediately for:", searchLower);
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
    

    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const fieldChecked=event.target.checked;
        
        const isToggle = event.target.type === 'toggle';
        const valueToSet = isToggle ? fieldChecked : fieldValue;

        this.salesEntry = {
            ...this.salesEntry,
            [fieldName]: valueToSet
        };
        console.log(`Updated Field - ${fieldName}:`, fieldValue);
        console.log('this.salesEntry===>'+JSON.stringify(this.salesEntry));
        switch(fieldName) {
            case 'InvoiceNo':
                this.invoiceNumber = fieldValue;
                 console.log('Invoice No:', this.invoiceNumber);
                this.salesEntry = {
                    ...this.salesEntry,
                    InvoiceNo: fieldValue     
                };
                 console.log('Invoice No Updated:', this.salesEntry.InvoiceNo);
                break;
            case 'InvoiceDate':
                this.invoiceDate = fieldValue;

                // this.salesEntry = {
                //     ...this.salesEntry,
                //     InvoiceDate: fieldValue   
                // };

                // console.log('Invoice Date Updated:', this.salesEntry.InvoiceDate);
                break;
    

            case 'invoiceName':
                this.invoiceName = fieldValue;
                console.log(' invoiceName:', this.invoiceName);
                break;

            case 'comments':
                this.comments = fieldValue;
                console.log('comments:', this.comments);
                    break;
           
            //  case 'taxInclusive':
            //     this.taxInclusive =fieldChecked;
            //     console.log('Tax Inclusive:', this.taxInclusive);
            //     this.amountarrey = {
            //         subTotal: 0,
            //         taxAmount: 0,
            //         totalAmount: 0
            //     };

            //     this.taxAmount = 0;
            //     this.cashTotalAmount = 0;
            //     this.cashTotalPaid = 0;
            //     this.comments='';

            //     // 2️⃣ Reset All Rows Completely
            //     this.salesEntryList = this.salesEntryList.map(item => ({
            //         ...item,
            //         Amount__c: '',
            //         Tax_Amount__c: '',
            //         Description__c:'',
            //         accountList:'',
            //         tax:'',
            //         Cash_Paid__c: '',
            //         subTotal: 0,
            //         taxAmount: 0,
            //         totalAmount: 0
            //     }));

            //     console.log('🔄 All fields cleared due to Tax Inclusive toggle');
            //     console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
            //     console.log('📊 Totals Reset:', JSON.stringify(this.amountarrey));
            //     break;

             default:
                console.log('Unknown field:', fieldName);
                break;
        }
    }
    @track selectedTaxRowId= null;
    @track oldTaxValue= null;
    // @track allowTaxEdit  = false;
    //selectedRowId 
    handleTaxFocus(event) {
        const recordId = event.target.dataset.id;
        if (!recordId) return;

        // get row
        const row = this.salesEntryList.find(r => String(r.Id) === String(recordId));
        if (!row) {
            console.warn("⚠ TAX FOCUS — row undefined");
            return;
        }

        // ⭐ FIX — if this row already allowed, do NOT show popup again
        if (row.allowTaxEdit === true) {
            console.log("✔ Row already allowed edit, no popup");
            return;
        }

        // store row id & value
        this.selectedTaxRowId = recordId;
        this.oldTaxValue = row.Tax_Amount__c ?? 0;

        console.log("🟡 TAX FIELD FOCUSED");
        console.log("Stored old value:", this.oldTaxValue);

        // show popup
        this.isTaxAmountChangeFlag = true;
    }

    handleInputChange(event) {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        const recordId = event.target.dataset.id;

        this.salesEntryList = this.salesEntryList.map(row => {
            let updated = { ...row };

            if (row.Id == recordId) {

                if (fieldName === "Cash_Paid__c") {
                    const cashPaid = parseFloat(fieldValue) || 0;

                    const taxPercent = parseFloat((row.tax || "0%").replace("%", "")) || 0;
                    const rate = taxPercent / 100;

                    const amount = parseFloat((cashPaid / (1 + rate)).toFixed(2));
                    const taxAmount = parseFloat((cashPaid - amount).toFixed(2));

                    updated.Amount__c = amount;
                    updated.Tax_Amount__c = taxAmount;
                    updated.Cash_Paid__c = cashPaid;
                }

                else if (fieldName === "Tax_Amount__c") {
                    if (!updated.allowTaxEdit) return updated;

                    const newTax = parseFloat(fieldValue) || 0;
                    const cashPaid = parseFloat(updated.Cash_Paid__c) || 0;

                    updated.Tax_Amount__c = newTax;
                    updated.Amount__c = parseFloat((cashPaid - newTax).toFixed(2));
                }

                else {
                    updated[fieldName] = fieldValue;
                }
            }

            return updated;
        });

        let totalAmount = 0;
        let totalTax = 0;
        let totalPaid = 0;

        this.salesEntryList.forEach(row => {
            totalAmount += parseFloat(row.Amount__c) || 0;
            totalTax += parseFloat(row.Tax_Amount__c) || 0;
            totalPaid += parseFloat(row.Cash_Paid__c) || 0;
        });

        this.amountarrey = {
            subTotal: parseFloat(totalAmount.toFixed(2)),   // = Total Amount
            taxAmount: parseFloat(totalTax.toFixed(2)),  
            totalAmount:parseFloat((totalAmount + totalTax).toFixed(2)), 
        };

        this.cashTotalAmount = this.amountarrey.subTotal;  // show Total Amount
        this.taxAmount = this.amountarrey.taxAmount;       // show Tax
        this.cashTotalPaid = parseFloat(totalPaid.toFixed(2));  // show Total Paid
        console.log('📊 Updated Amount Array:', JSON.stringify(this.amountarrey));
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
    }

    handleTaxChangeOption(event) {
        const selected = event.detail.value;
        console.log("USER SELECTED:", selected);

        this.salesEntryList = this.salesEntryList.map(row => {

            if (String(row.Id) === String(this.selectedTaxRowId)) {

                if (selected === "cancel") {
                    row.Tax_Amount__c = this.oldTaxValue;
                    row.taxAmount = this.oldTaxValue;
                    row.totalAmount = (row.subTotal ?? 0) + this.oldTaxValue;

                    // cancel = still blocked
                    row.allowTaxEdit = false;
                }

                if (selected === "ProceedWithOverride") {
                    //   row now permanently editable
                    row.allowTaxEdit = true;
                }
            }

            return row;
        });

        this.isTaxAmountChangeFlag = false;
        this.cashRecalculateTotals();
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
        if( this.isCashPayment){
            if (!this.deletedRowIds) {
                this.deletedRowIds = [];
            }
            this.deletedRowIds.push(rowId);
            console.log('Deleted Row IDs:', this.deletedRowIds);
        }
        
        this.cashRecalculateTotals();
        this.reindexSalesEntryList();
    
        // ✅ Update highest tax amount after deletion
        const taxAmounts = this.salesEntryList
            .map(row => Number(row.taxAmount))
            .filter(val => !isNaN(val));
        console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
    }
   
    cashRecalculateTotals() {
        // Sum only the visible columns (do not recompute rows)
        let sumAmount = 0;
        let sumTax = 0;
        let sumPaid = 0;

        if (!Array.isArray(this.salesEntryList)) {
            this.salesEntryList = [];
        }

        this.salesEntryList.forEach(entry => {
            // Parse each value safely
            const amt = parseFloat(entry.Amount__c) || 0;
            const tax = parseFloat(entry.Tax_Amount__c) || 0;
            const paid = parseFloat(entry.Cash_Paid__c) || 0;
            console.log('  amt : ',  amt);
            console.log('tax  : ', tax);
            console.log(' paid : ',  paid);


            sumAmount += amt;
            sumTax += tax;
            sumPaid += paid;
        });

        // Store totals (rounded to 2 decimals)
        this.amountarrey = {
            subTotal: parseFloat(sumAmount.toFixed(2)),   // used for "Total Amount" display
            taxAmount: parseFloat(sumTax.toFixed(2)),     // used for "Tax" display
            totalAmount: parseFloat((sumAmount + sumTax).toFixed(2)) // optional if you need Amount+Tax
        };

        // UI bindings
        this.cashTotalAmount = this.amountarrey.subTotal;
        this.taxAmount = this.amountarrey.taxAmount;
        this.cashTotalPaid = parseFloat(sumPaid.toFixed(2));

        // Debug logs
        console.log('✅ cashRecalculateTotals -> amountarrey:', JSON.stringify(this.amountarrey));
        console.log('✅ cashRecalculateTotals -> cashTotalPaid:', this.cashTotalPaid);
    }

    @track activeRowId1;
    handleDropdownPosition1(event) {

        console.log('toggleDropdown');
        this.resetAllDropdowns(); 
        //const rowId = event.target.dataset.id;
        const rowId = event.currentTarget.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        this.activeRowId1 =rowId;
        // this.filterLedgerForSixPrefix(rowId);
        this.fetchLedgerItemsforExpenses(rowId); 
         
        const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
   
        this.toggleDropdownAccount = `
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
    
        //  if (this.showtable) {
        //     setTimeout(() => {
        //         console.log('✅ Outside click detection enabled');
        //         this.listenForOutsideClick = true;
        //     }, 0);
        // } else {
        //     console.log('❌ Popover closed manually');
        //     this.listenForOutsideClick = false;
        // }

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
        this.activeRowId1 = rowId;
        this.showtableTax = true;
    }
      @track selectedItemId;
    // Handle the selection of a ledger item from the popover
    handleSelection(event) {
        // Use event.currentTarget to refer to the <tr> element, not the clicked <td> element
        const recordId = event.currentTarget.dataset.id;
         const accountNumber = event.currentTarget.dataset.accno;  // Account Number
        const accountValue = event.currentTarget.dataset.value;   
        const rowId = this.activeRowId1; // ID of the row currently being edited
    
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
    
    handleSelectionTax(event) {                   //   // WORKING CODE BEFORE,TAXAMOUNT  CHANGE ,
        const recordId = event.currentTarget.dataset.id;
        const code = event.currentTarget.dataset.code;
        const rate = event.currentTarget.dataset.rate;

       // console.log('🔹 Record ID in Tax:', recordId);
        console.log('🔹 Selected Tax Code:', code);
        console.log('🔹 Tax Rate (%):', rate);
        //console.log('🔹 Tax Inclusive?', this.taxInclusive);
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
        console.log('this.selectedRowId in handleSelectionTax : ', this.selectedRowId);

        this.salesEntryList = this.salesEntryList.map(sales => {
            let updated= { ...sales };

            if (String(sales.Id) === this.selectedRowId) {
                updated.tax = `${rate}`;
                updated.taxvalue = rate;
                let taxRate = parseFloat(rate) / 100 || 0;

                console.log('updated.tax :', updated.tax );
                console.log('updated.taxvalue:', updated.taxvalue);
                console.log(' Tax Rate :', taxRate);
                
                console.log('updated.taCash_Paid__cxvalue:', updated.Cash_Paid__c);
                const cashPaid = parseFloat(updated.Cash_Paid__c) || 0;
                console.log(' cashPaid :', cashPaid);

                if(cashPaid > 0){
                   console.log(' cashPaid 111:', cashPaid);
                  const amount = parseFloat((cashPaid / (1 + taxRate)).toFixed(2));
                  const taxAmount = parseFloat((cashPaid - amount).toFixed(2));
                     console.log(' amount :', amount);
                       console.log(' taxAmount :', taxAmount);
                    updated.Amount__c = amount;
                    updated.Tax_Amount__c = taxAmount;
                    updated.Cash_Paid__c = cashPaid;
                   
                    console.log(' updated.Amount__c : ',  updated.Amount__c);
                    console.log(' updated.Tax_Amount__c : ',  updated.Tax_Amount__c);
                    console.log(' updated.Cash_Paid__c : ',  updated.Cash_Paid__c);
                }
            }
              
            return updated;
        });

        let totalAmount = 0;
        let totalTax = 0;
        let totalPaid = 0;

        this.salesEntryList.forEach(row => {
            totalAmount += parseFloat(row.Amount__c) || 0;
            totalTax += parseFloat(row.Tax_Amount__c) || 0;
            totalPaid += parseFloat(row.Cash_Paid__c) || 0;
        });

        this.amountarrey = {
            subTotal: parseFloat(totalAmount.toFixed(2)),   // = Total Amount
            taxAmount: parseFloat(totalTax.toFixed(2)),     // = Total Tax
             totalAmount:parseFloat((totalAmount + totalTax).toFixed(2)),
        };

        this.cashTotalAmount = this.amountarrey.subTotal;  // show Total Amount
        this.taxAmount = this.amountarrey.taxAmount;       // show Tax
        this.cashTotalPaid = parseFloat(totalPaid.toFixed(2));  // show Total Paid
        this.showtableTax = false;
         this.listenForOutsideClick = false;

        console.log('📊 Updated Amount Array:', JSON.stringify(this.amountarrey));
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryList));
       // console.log('🧾 Totals → SubTotal:', this.subTotal, ', TaxAmount:', this.taxAmount, ', TotalAmount:', this.totalAmount);
    }

    fetchLedgerItemsforExpenses(rowId) {
        console.log('Calling Apex Method: getLedgerItemsforExpenses...');
        console.log('companyId in fetchLedgerItemsforExpenses: ' + this.selectedCompany);

        getAllLedgerItems({ companyId: this.selectedCompany })
            .then(result => {
                console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

                this.ledgerItems = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                }));

                console.log('Processed Ledger Items:', JSON.stringify(this.ledgerItems));

                // Correct order
                this.FilteredLedgerItems = this.ledgerItems;

                // MUST be called after data arrives
                this.filterLedgerForSixPrefix(rowId);
               // this.showtable = true;
                 this.showtable = !this.showtable;

                if (this.showtable) {
                    setTimeout(() => {
                        console.log('✅ Outside click detection enabled');
                        this.listenForOutsideClick = true;
                    }, 0);
                } else {
                    console.log('❌ Popover closed manually');
                    this.listenForOutsideClick = false;
                }
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message;
            });
    }

    handlePayments(){
        this.resetAllDropdowns();  
        this.isCashPayment =true;
        this.isReceiptsFlag=false;
        this.entryType = 'Purchases';
        this.selectedOptionALNew='';
        this.selectedOptionCategory = '';
        this.selectedOptionAmount = null;
        this.selectedLedgerItemId = '';
        this.paymentsViewLabelClass = "roster-label roster-inactive-font";
        this.receiptsViewLabelClass = "roster-label roster-active-font";
        const today = new Date().toISOString().split('T')[0];
        if (this.entryType === 'Purchases'  || this.isCashPayment) {
            this.invoiceDate = today;
            
            this.salesEntry = {
                ...this.salesEntry,
                InvoiceDate: today,
                company: this.selectedCompany
            };

            console.log('Default Purchase InvoiceDate set:', this.salesEntry.InvoiceDate);

            // Create first empty row for Payment
          //  this.addRow();
           if (!this.salesEntryList || this.salesEntryList.length === 0) {
                this.addRow();
            }
           // this.listenForOutsideClick = false;
        }   
    }
    handleReceipts(){ 
        this.resetAllDropdowns();  
        this.isReceiptsFlag=true;
        this.isCashPayment=false;
        this.entryType = 'Sales';
        this.selectedOptionALNew='';
        this.selectedOptionCategory = '';
        this.selectedOptionAmount = null;
        this.selectedLedgerItemId = '';
        this.paymentsViewLabelClass = "roster-label roster-inactive-font";
        this.receiptsViewLabelClass = "roster-label roster-active-font";
        const today = new Date().toISOString().split('T')[0];
         // 🟩 CASE 2: Sales (Cash Receipt)
        if (this.entryType === 'Sales' || this.isReceiptsFlag) {
               console.log('addRowReceit');
            this.invoiceDateReceit = today;

            this.salesEntryReceit = {
                ...this.salesEntryReceit,
                InvoiceDateReceit: today,
                company: this.selectedCompany
            };

            console.log('Default Receipt InvoiceDate set:', this.salesEntryReceit.InvoiceDateReceit);

            // Create first empty row for Receipt
            //this.addRowReceit();
            if (!this.salesEntryListReceit || this.salesEntryListReceit.length === 0) {
                this.addRowReceit();
            }
            //this.listenForOutsideClick = false;
        }
        
    }
    resetAllDropdowns() {
        this.showtable = false;
        this.showtableTax = false;
        this.customerShowTable = false;
        this.showtableReceit = false;
        this.showtableTaxReceit = false;

        this.listenForOutsideClick = false;
    }
    handleCashClear(){
        
        //console.log('console in clear');
        this.taxInclusive=true;
        this.invoiceNumber = '';
        this.comments = '';
        this.ledgerItems = []; 
        this.deletedRowIds = [];    
        this.selectedRowId = null;        
        this.selectedItem = null; 
        this.invoiceDate = null;
        this.taxDropdownStyle = '';
        this.customerDropdownStyle= '';
        this.taxAmount = 0;
        this.cashTotalPaid =0;
        this.cashTotalAmount =0;
        this.salesEntry = {
            company: this.selectedCompany,
            entryType: 'Purchases',
            InvoiceDate: '',
            InvoiceNo: '',
            comments: '', 
        };
        this.selectedOptionALNew='';
       // this.selectedAmount=0;
        this.selectedOptionTax='';
        this.salesEntryList.length =1;
        if (this.salesEntryList.length > 0) {
            this.salesEntryList = this.salesEntryList.map(entry => {
                return {
                    ...entry,
                    // sno:1,
                    Description__c: '',
                    Amount__c: '',
                    Cash_Paid__c:'',
                    accountList:'6-',
                    tax:'',
                    Tax_Amount__c:'',
                    allowTaxEdit: false
                };
            });
        }
        //this.listenForOutsideClick = false;
        this.resetAllDropdowns(); 

    } 
    
    handleCashSubmit() {

        if (!this.invoiceDate) {
            this.showToast('Error', 'Please Enter the required fields.', 'error');
            return;
        }
        const payment = {
            company: this.selectedCompany,
            paymentDate: this.invoiceDate,
            overalTotalPaid: this.cashTotalPaid,
            fromLedger: this.selectedLedgerItemId,
            isCashPayment:true
           
        };

        console.log('Payment Payload:', JSON.stringify(payment));
        console.log('Handling save for invoice');
        console.log('Sales Entry:', JSON.stringify(this.salesEntry));
        console.log('Sales Entry List:', JSON.stringify(this.salesEntryList));
        console.log('amountArray:', JSON.stringify(this.amountarrey));

       // const isUpdate = !!this.salesEntry.invoiceId;

        console.log('deletedRowIds BEFORE:', JSON.stringify(this.deletedRowIds));

        if (this.deletedRowIds && this.deletedRowIds.length > 0) {
            deleteMatchingRecordsRfq({
                deletedIdsJson: JSON.stringify(this.deletedRowIds)
            })
            .then(() => {
                console.log('Deleted rows successfully.');
                this.deletedRowIds = [];
            })
            .catch(error => {
                console.error('Error deleting rows:', error);
                this.showToast('Error', 'Failed to delete rows', 'error');
            });
        }

        updateDataForCashPayment({
            salesEntryJson: JSON.stringify(this.salesEntry),
            salesEntryListJson: JSON.stringify(this.salesEntryList),
            amountEntryJson: JSON.stringify(this.amountarrey),
            paymentJson: JSON.stringify(payment)

        })
        .then(result => {
            console.log('Result from Apex:', result);

            const tempInvoiceId = result.Id;
            console.log('Temporary Invoice ID:', tempInvoiceId);

            //if (isUpdate) {
                this.showToast('Success', 'Invoice submitted successfully', 'success');
            // } else {
            //     this.showToast('Success', 'Purchases data saved successfully', 'success');
            // }

           
            this.entryType= 'Purchases',
            this.updatePayFromAccountLedgerId(this.selectedLedgerItemId, this.cashTotalPaid,this.selectedOptionCategory,this.entryType );
           
        })
        .catch(error => {
            console.error('Error saving invoice:', error);

            const msg = error?.body?.message || 'An unknown error occurred while saving invoice.';
            this.showToast('Error', msg, 'error');
        });
    }

    updatePayFromAccountLedgerId(selectedLedgerItemId,amount, category,entryType) {
           console.log('this.entrytype  in updatePayFromAccountLedgerId :',entryType);
             console.log('this.cashTotalPaid  in updatePayFromAccountLedgerId :', this.cashTotalPaid);
        updateLedgerItemId({ ledgerItemId: selectedLedgerItemId ,amount:amount, category: category, entryType:entryType })
            .then(result => {
                console.log('✅ Ledger Item successfully updated:', result);
                this.handleCashClear();
            })
            .catch(error => {
                console.error('❌ Error updating Pay from Account value :', error);
            });
    }
      showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

      get paymentsTabClass() {
    return this.isCashPayment ? "tab-button active" : "tab-button";
  }

    get receiptsTabClass() {
    return this.isReceiptsFlag ? "tab-button active" : "tab-button";
  }

     createRowReceit() {
        return {
            Id: Date.now(),
            sno: this.salesEntryListReceit.length + 1,

            Description_Receit__c: '',
            accountListReceit: '4-',
            accountItemIdReceit: '',

            Amount_Receit__c: 0,
            // UnitPrice__c:0,
            // Quantity__c:0,
            taxReceit: '',
            taxRateReceit: 0,
            //taxAmountReceit: 0,
            Tax_Amount_Receit__c:0,
            allowTaxEditReceit: false,
            Cash_Receit__c: 0
        };
    }

     addRowReceit() {
          console.log('addRowReceit');
        const newRow = this.createRowReceit();
        this.salesEntryListReceit = [...this.salesEntryListReceit, newRow];
        console.log('this.salesEntryListReceit===>'+JSON.stringify(this.salesEntryListReceit));
        this.reindexSalesEntryListReceit(); 
       // this.validateSubmitButtonReceit();
       this.disabledSubmitReceit = true;
        //this.disabledSubmit = true;
        // Get highest taxAmount
        // const taxAmounts = this.salesEntryListReceit
        //     .map(row => Number(row.taxAmount))
        //     .filter(val => !isNaN(val));
    }
     reindexSalesEntryListReceit() {
        let reindexedListReceit = [];

        for (let i = 0; i < this.salesEntryListReceit.length; i++) {
            let row = { ...this.salesEntryListReceit[i] };
            row.sno = i + 1;
            reindexedListReceit.push(row);
        }

        this.salesEntryListReceit = [...reindexedListReceit]; // ✅ triggers UI reactivity
    }
    
    
    handleSupplierSearchReceit(event) {
        const rowId = event.target.dataset.id;
        let inputValue = event.target.value;

        console.log("Typing Input (Receipt):", inputValue);

        // Update row value immediately
        this.salesEntryListReceit = this.salesEntryListReceit.map(row => {
            if (row.Id == rowId) {
                return { ...row, accountListReceit: inputValue };
            }
            return row;
        });

        const searchLower = inputValue.toLowerCase();

        // Filter based on user input
        const filtered = this.ledgerItemsReceit.filter(item => {
            const accNo = item.accNo?.toLowerCase() || "";
            const itemName = item.itemName?.toLowerCase() || "";
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });

        this.FilteredLedgerItemsReceit = filtered;
        this.activeRowIdReceit = rowId;
        this.showtableReceit = true;
    }

    toggleDropdownTaxReceit(event) {
        this.resetAllDropdowns(); 
        this.selectedRowIdReceit = event.currentTarget.dataset.id;
        this.showtableTaxReceit = !this.showtableTaxReceit;

        const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
   
        this.taxDropdownStyleReceit = `
            position:fixed;
            top: ${rect.bottom + 4}px;
            left: ${rect.left}px;
            width: 16%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        this.filteredTaxCodesReceit = this.taxCodes;

        if (this.showtableTaxReceit) {
            setTimeout(() => {
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            this.listenForOutsideClick = false;
        }
    }
    handleChangeReceit(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const fieldChecked = event.target.checked;

        const isToggle = event.target.type === 'toggle';
        const valueToSet = isToggle ? fieldChecked : fieldValue;

        // Update main Receipt object
        this.salesEntryReceit = {
            ...this.salesEntryReceit,
            [fieldName]: valueToSet
        };

        console.log(`Updated Field (Receit) - ${fieldName}:`, fieldValue);
        console.log('this.salesEntryReceit ===> ' + JSON.stringify(this.salesEntryReceit));

        switch (fieldName) {

            case 'InvoiceNoReceit':
                this.invoiceNumberReceit = fieldValue;
                break;

            case 'InvoiceDateReceit':
                this.invoiceDateReceit = fieldValue;
                break;

            case 'commentsReceit':
                this.commentsReceit = fieldValue;
                break;

            //  case 'taxInclusiveReceit':
            //     this.taxInclusiveReceit = fieldChecked;
            //     console.log('Tax Inclusive Receit:', this.taxInclusiveReceit);

            //     let totalSub = 0;
            //     let totalTax = 0;
            //     let totalAmt = 0;

            //     this.salesEntryListReceit = this.salesEntryListReceit.map(entry => {

            //         const updatedEntry = { ...entry };

            //         const amount = parseFloat(updatedEntry.Amount__c) || 0;
            //         updatedEntry.calculatedAmount = parseFloat((amount).toFixed(2));
            //         const rawAmount = updatedEntry.calculatedAmount;

            //         const rate = updatedEntry.tax?.toString().split(' ')[0].replace('%', '') || '0';
            //         const taxRateDecimal = parseFloat(rate) / 100;

            //         if (this.taxInclusiveReceit && !isNaN(taxRateDecimal)) {

            //             const sub = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
            //             const taxAmt = parseFloat((rawAmount - sub).toFixed(2));

            //             updatedEntry.subTotal = sub;
            //             updatedEntry.taxAmount = taxAmt;
            //             updatedEntry.totalAmount = rawAmount;

            //             console.log('✅ [RECEIPT TAX INCLUSIVE]', sub, taxAmt, rawAmount);

            //         } else {

            //             const taxAmt = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
            //             const totalAmountCalc = parseFloat((rawAmount + taxAmt).toFixed(2));

            //             updatedEntry.subTotal = rawAmount;
            //             updatedEntry.taxAmount = taxAmt;
            //             updatedEntry.totalAmount = totalAmountCalc;

            //             console.log('✅ [RECEIPT TAX EXCLUSIVE]', rawAmount, taxAmt, totalAmountCalc);
            //         }

            //         totalSub += updatedEntry.subTotal;
            //         totalTax += updatedEntry.taxAmount;
            //         totalAmt += updatedEntry.totalAmount;

            //         return updatedEntry;
            //     });

            //     // this.subTotalReceit = parseFloat(totalSub.toFixed(2));
            //     // this.taxAmountReceit = parseFloat(totalTax.toFixed(2));
            //     // this.totalAmountReceit = parseFloat(totalAmt.toFixed(2));

            //     this.amountArrayReceit = {
            //         subTotal: this.subTotalReceit,
            //         taxAmount: this.taxAmountReceit,
            //         totalAmount: this.totalAmountReceit
            //     };
            //     this.salesEntryListReceit = this.salesEntryListReceit.map(entry => {
            //         return {
            //             ...entry,
            //             Cash_Receit__c: ''   // Clear input box
            //         };
            //     });
            //     this.taxAmountReceived = '';
            //     this.cashTotalReceived='';
            //     this.cashTotalAmountReceived ='';
            //     console.log('Updated Receipt List:', JSON.stringify(this.salesEntryListReceit));
            //     console.log('Receipt Totals:', this.amountArrayReceit);
            //     break;

            default:
                console.log('Unknown field (Receit):', fieldName);
                break;
        }
    }
     @track selectedTaxReceitRowId= null;
    @track oldTaxReceitValue= null;
    // @track allowTaxEdit  = false;
    //selectedRowId 
    handleTaxReceitFocus(event) {
        const recordId = event.target.dataset.id;
        if (!recordId) return;

        // get row
        const row = this.salesEntryListReceit.find(r => String(r.Id) === String(recordId));
        if (!row) {
            console.warn("⚠ TAX FOCUS — row undefined");
            return;
        }

        // ⭐ FIX — if this row already allowed, do NOT show popup again
        if (row.allowTaxEditReceit === true) {
            console.log("✔ Row already allowed edit, no popup");
            return;
        }

        // store row id & value
        this.selectedTaxReceitRowId = recordId;
        this.oldTaxReceitValue = row.Tax_Amount__c ?? 0;

        console.log("🟡 TAX FIELD FOCUSED");
        console.log("Stored old value:", this.oldTaxReceitValue);
        this.isTaxAmountChangeFlagReceit = true;
    }
    
    // handleInputChangeReceit(event) {
    //     const fieldName = event.target.dataset.field;
    //     const fieldValue = event.target.value;
    //     const recordId = event.target.dataset.id;

    //     this.selectedRowIdReceit = recordId;

    //     let totalSubTotal = 0;
    //     let totalTaxAmount = 0;
    //     let totalTotalAmount = 0;
    //     let totalReceived = 0;

    //     this.salesEntryListReceit = this.salesEntryListReceit.map(row => {
    //         let updated = { ...row };

            
    //         if (row.Id == this.selectedRowIdReceit) {

    //             // 1️⃣ ALWAYS update AMOUNT first
    //             if (fieldName === "Amount_Receit__c") {
    //                 updated.Amount_Receit__c = parseFloat(fieldValue) || 0;
    //             }

    //             // 2️⃣ Validate Cash Receipt (must use UPDATED amount, not old row.amount)
    //             else if (fieldName === "Cash_Receit__c") {
    //                 const rowAmount = parseFloat(updated.Amount_Receit__c) || 0;  // ← FIXED

    //                 // Get tax rate
    //                 let taxRateStr = updated.taxReceit || "0%";
    //                 let rate = taxRateStr.replace("%", "").trim();
    //                 let taxRate = (parseFloat(rate) || 0) / 100;

    //                 // Allowed maximum amount
    //                 let allowedPaid = this.taxInclusiveReceit
    //                     ? rowAmount
    //                     : rowAmount + (rowAmount * taxRate);

    //                 const entered = parseFloat(fieldValue) || 0;

    //                 // ❌ If invalid
    //                 if (entered > allowedPaid) {
    //                     this.showToast(
    //                         "Error",
    //                         `Cash Receipt cannot exceed ${allowedPaid} for this row.`,
    //                         "error"
    //                     );
    //                     updated.Cash_Receit__c = "";
    //                 } else {
    //                     updated.Cash_Receit__c = entered;
    //                 }
    //             }

    //             // 3️⃣ Other normal fields
    //             else {
    //                 updated[fieldName] = fieldValue;
    //             }
    //         }

    //         const rawAmount = parseFloat(updated.Amount_Receit__c) || 0;

    //         let taxRateStr = updated.taxReceit || "0%";
    //         let rate = taxRateStr.replace("%", "").trim();
    //         let taxRateDecimal = (parseFloat(rate) || 0) / 100;

    //         let subTotal, taxAmount, total;

    //         if (this.taxInclusiveReceit) {
    //             subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
    //             taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));
    //             total = rawAmount;
    //         } else {
    //             subTotal = rawAmount;
    //             taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
    //             total = parseFloat((subTotal + taxAmount).toFixed(2));
    //         }

    //         updated.subTotal = subTotal;
    //         updated.taxAmount = taxAmount;
    //         updated.totalAmount = total;

    //         // Accumulate for totals
    //         totalSubTotal += subTotal;
    //         totalTaxAmount += taxAmount;
    //         totalTotalAmount += total;
    //         totalReceived += parseFloat(updated.Cash_Receit__c) || 0;

    //         return updated;
    //     });

    //     this.amountarreyReceit = {
    //         subTotal: parseFloat(totalSubTotal.toFixed(2)),
    //         taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
    //         totalAmount: parseFloat(totalTotalAmount.toFixed(2))
    //     };
    //     if (fieldName === "Cash_Receit__c" ) {
    //         this.taxAmountReceived = this.amountarreyReceit.taxAmount;
    //         this.cashTotalAmountReceived = this.amountarreyReceit.subTotal;
    //     }
        
    //     this.cashTotalReceived = parseFloat(totalReceived.toFixed(2));

    //     console.log("📌 Receipt Totals amountarreyReceit:", this.amountarreyReceit);
    //     console.log("✔ Total Tax:", this.taxAmountReceived);
    //     console.log("✔ Total Received:", this.cashTotalReceived);
    // }
      handleInputChangeReceit(event) {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        const recordId = event.target.dataset.id;

        this.selectedRowIdReceit = recordId;

        // let totalSubTotal = 0;
        // let totalTaxAmount = 0;
        // let totalTotalAmount = 0;
        // let totalReceived = 0;

        this.salesEntryListReceit = this.salesEntryListReceit.map(row => {
            let updated = { ...row };

            
            if (row.Id == this.selectedRowIdReceit) {

              if (fieldName === "Cash_Receit__c") {
                    const cashReceit = parseFloat(fieldValue) || 0;
                    const taxPercent = parseFloat((row.taxReceit || "0%").replace("%", "")) || 0;
                    const rate = taxPercent / 100;
                     console.log("💰 Cash Receipt Entered:", cashReceit);
                     console.log("🧮 Tax %:", taxPercent, "Rate decimal:", rate);

                    const amount = parseFloat((cashReceit / (1 + rate)).toFixed(2));
                    const taxAmount = parseFloat((cashReceit - amount).toFixed(2));

                    console.log(" Calculated Amount:", amount);
                    console.log(" Calculated Tax Amount:", taxAmount);

                    updated.Amount_Receit__c = amount;
                    updated.Tax_Amount_Receit__c = taxAmount;
                    updated.Cash_Receit__c = cashReceit;

                    console.log(" updated.Amount_Receit__c:", updated.Amount_Receit__c);
                    console.log(" updated.Tax_Amount_Receit__c:", updated.Tax_Amount_Receit__c);
                    console.log(" updated.Amount_Receit__c:", updated.Amount_Receit__c);

              }  else if (fieldName === "Tax_Amount_Receit__c") {
                    console.log("fieldName === Tax_Amount_Receit__c");
                    if (!updated.allowTaxEditReceit) {
                         console.log(" !updated.allowTaxEditReceit");
                        return updated;
                    }

                    const newTax = parseFloat(fieldValue) || 0;
                    const cashReceit = parseFloat(updated.Cash_Receit__c) || 0;
                    console.log(" newTax:", newTax);
                    console.log(" cashReceit:", cashReceit);

                    updated.Tax_Amount_Receit__c = newTax;
                    updated.Amount_Receit__c = parseFloat((cashReceit - newTax).toFixed(2));
                    console.log(" updated.Tax_Amount_Receit__c:", updated.Tax_Amount_Receit__c);
                    console.log(" updated.Amount_Receit__c:", updated.Amount_Receit__c);
                }

                   
                else {
                    updated[fieldName] = fieldValue;
                }
            }
            return updated;
        });

        let totalAmount = 0;
        let totalTax = 0;
        let totalReceit = 0;

        this.salesEntryListReceit.forEach(row => {
            totalAmount += parseFloat(row.Amount_Receit__c) || 0;
            totalTax += parseFloat(row.Tax_Amount_Receit__c) || 0;
            totalReceit += parseFloat(row.Cash_Receit__c) || 0;
        });

        this.amountarreyReceit = {
            subTotal: parseFloat(totalAmount.toFixed(2)),   // = Total Amount
            taxAmount: parseFloat(totalTax.toFixed(2)),  
            totalAmount:parseFloat((totalAmount + totalTax).toFixed(2)), 
        };

        this.cashTotalAmountReceived = this.amountarreyReceit.subTotal;  // show Total Amount
        this.taxAmountReceived = this.amountarreyReceit.taxAmount;       // show Tax
        this.cashTotalReceived = parseFloat(totalReceit.toFixed(2));  // show Total Paid
        console.log('📊 Updated Amount Array:', JSON.stringify(this.amountarreyReceit));
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryListReceit));  

        console.log("✔ Total Tax:", this.taxAmountReceived);
        console.log("✔ Total Received:", this.cashTotalReceived);
    }
    
    handleTaxReceitChangeOption(event) {
        const selected = event.detail.value;
        console.log("USER SELECTED:", selected);

        this.salesEntryListReceit = this.salesEntryListReceit.map(row => {

            if (String(row.Id) === String(this.selectedRowIdReceit)) {

                if (selected === "cancelReceit") {
                    row.Tax_Amount_Receit__c = this.oldTaxReceitValue;
                    row.taxAmount = this.oldTaxReceitValue;
                    row.totalAmount = (row.subTotal ?? 0) + this.oldTaxReceitValue;

                    // cancel = still blocked
                    row.allowTaxEditReceit = false;
                }

                if (selected === "ProceedWithOverrideReceit") {
                    // ⭐ FIX — row now permanently editable
                    row.allowTaxEditReceit = true;
                }
            }

            return row;
        });

        this.isTaxAmountChangeFlagReceit = false;
        this.cashRecalculateTotalsReceit();
    }


    handleDeleteRowReceit(event) {
        console.log('handleDeleteRowReceit');

        // At least one row required
        if (this.salesEntryListReceit.length === 1) {
            this.showToast('Error', 'At least one row is required.', 'error');
            return;
        }

        const rowId = event.currentTarget.dataset.id;

        // Remove the row
        this.salesEntryListReceit = this.salesEntryListReceit.filter(
            row => String(row.Id) !== rowId
        );

        this.selectedRowIdReceit = null;

        // Track deleted rows for receipt
        if (!this.deletedRowIdsReceit) {
            this.deletedRowIdsReceit = [];
        }
        this.deletedRowIdsReceit.push(rowId);

        console.log('Deleted Row IDs (Receit):', this.deletedRowIdsReceit);

        // Recalculate totals for receipt side
        this.cashRecalculateTotalsReceit();

        // Reindex rows
        this.reindexSalesEntryListReceit();

        // Debug log
        console.log('Updated salesEntryListReceit:', JSON.stringify(this.salesEntryListReceit));
    }
    // cashRecalculateTotalsReceit() {

    //     let totalSubTotal = 0;
    //     let totalTaxAmount = 0;
    //     let totalAmount = 0;

    //     this.salesEntryListReceit = this.salesEntryListReceit.map(entry => {

    //         // const quantity = parseFloat(entry.Quantity__c) || 0;
    //         // const unitPrice = parseFloat(entry.UnitPrice__c) || 0;

    //         // // Amount = Qty × Unit Price
    //         // const rawAmount = parseFloat((quantity * unitPrice).toFixed(2));
    //         const amount = parseFloat(entry.Amount_Receit__c) || 0;
    //         const rawAmount = parseFloat(( amount).toFixed(2));


    //         let taxRateDecimal = 0;
    //         if (entry.tax) {
    //             const rate = entry.tax.replace('%', '').trim();
    //             taxRateDecimal = parseFloat(rate) / 100 || 0;
    //         }

    //         let subTotal = 0;
    //         let taxAmount = 0;
    //         let total = 0;

    //         if (this.taxInclusiveReceit) {
    //             // Tax already included
    //             subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
    //             taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));
    //             total = rawAmount;
    //         } else {
    //             // Tax added on top
    //             taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
    //             subTotal = rawAmount;
    //             total = parseFloat((subTotal + taxAmount).toFixed(2));
    //         }

    //         totalSubTotal += subTotal;
    //         totalTaxAmount += taxAmount;
    //         totalAmount += total;

    //         return {
    //             ...entry,
    //             calculatedAmount: rawAmount,
    //             subTotal: subTotal,
    //             taxAmount: taxAmount,
    //             totalAmount: total,
    //            // Amount__c: rawAmount // keep consistent
    //         };
    //     });

    //     // Store totals
    //     this.amountarreyReceit = {
    //         subTotal: parseFloat(totalSubTotal.toFixed(2)),
    //         taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
    //         totalAmount: parseFloat(totalAmount.toFixed(2))
    //     };

    //     this.taxAmountReceived = this.amountarreyReceit.taxAmount;
    //     this.cashTotalAmountReceived =this.amountarreyReceit.subTotal;
    //     let totalPaid = 0;
    //     this.salesEntryListReceit.forEach(entry => {
    //         totalPaid += parseFloat(entry.Cash_Receit__c) || 0;
    //     });
    //     this.cashTotalReceived = this.amountarreyReceit.totalPaid;
    //     console.log("📌 Receipt Totals Recalculated amountarreyReceit:", JSON.stringify(this.amountarreyReceit));
    //     console.log("📌 Updated Receipt Rows:", JSON.stringify(this.salesEntryListReceit));
    // }

     cashRecalculateTotalsReceit() {
        let sumAmount = 0;
        let sumTax = 0;
        let sumReceived = 0;

        if (!Array.isArray(this.salesEntryListReceit)) {
            this.salesEntryListReceit = [];
        }

        this.salesEntryListReceit.forEach(entry => {
            // Parse each value safely
            const amt = parseFloat(entry.Amount_Receit__c) || 0;
            const tax = parseFloat(entry.Tax_Amount_Receit__c) || 0;
            const paid = parseFloat(entry.Cash_Receit__c) || 0;
            console.log('  amt : ',  amt);
            console.log('tax  : ', tax);
            console.log(' paid : ',  paid);


            sumAmount += amt;
            sumTax += tax;
            sumReceived += paid;
        });

        this.amountarreyReceit = {
            subTotal: parseFloat(sumAmount.toFixed(2)),  
            taxAmount: parseFloat(sumTax.toFixed(2)),    
            totalAmount: parseFloat((sumAmount + sumTax).toFixed(2))
        };

        this.cashTotalAmountReceived = this.amountarreyReceit.subTotal;
        this.taxAmountReceived = this.amountarreyReceit.taxAmount;
        this.cashTotalReceived = parseFloat(sumReceived.toFixed(2));

        // Debug logs
        console.log('✅ cashRecalculateTotals -> amountarreyReceit:', JSON.stringify(this.amountarreyReceit));
        console.log('✅ cashRecalculateTotals -> cashTotalReceived:', this.cashTotalReceived);
    }
    handleDropdownPositionReceit(event) {

        console.log('toggleDropdown (Receipt)');
        this.resetAllDropdowns(); 

        //const rowId = event.target.dataset.id;
        const rowId = event.currentTarget.dataset.id;

        const recordId = event.currentTarget.dataset.id;

        this.activeRowIdReceit = rowId;

        // Open/close dropdown
        this.showtableReceit = !this.showtableReceit;
        console.log('showtableReceit after : ' + this.showtableReceit);
     
        // Fetch Ledger Items for Receipt
         this.fetchLedgerItemsforExpensesReceit(rowId);
        // this.filterLedgerForFourPrefix(rowId);

        const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
   
        this.toggleDropdownAccountReceit = `
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
        if (this.showtableReceit) {
            setTimeout(() => {
                console.log('✅ Outside click (Receipt) enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Receipt popover closed manually');
            this.listenForOutsideClick = false;
        }
    }
    
    filterLedgerForFourPrefix(rowId) {
        if (!this.ledgerItemsReceit || this.ledgerItemsReceit.length === 0) {
            this.FilteredLedgerItemsReceit = [];
            return;
        }

        const row = this.salesEntryListReceit.find(r => r.Id == rowId);
        let searchLower = (row?.accountListReceit || "").toLowerCase();

        // ⭐ If initial value is "4-" OR blank → force show only prefix 4 accounts
        if (searchLower === "" || searchLower === "4-") {
            this.FilteredLedgerItemsReceit = this.ledgerItemsReceit.filter(
                item => item.accNo?.startsWith("4")
            );
            return;
        }

        // ⭐ Otherwise use normal search
        this.FilteredLedgerItemsReceit = this.ledgerItemsReceit.filter(item => {
            const accNo = item.accNo?.toLowerCase() || "";
            const itemName = item.itemName?.toLowerCase() || "";
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });
    }


    handleTaxSearchReceit(event) {

        const inputValue = event.target.value;
        const searchLower = inputValue.toLowerCase();
        const rowId = event.target.dataset.id;

        console.log('📌 Receipt Tax Search Row ID:', rowId, 'Input:', inputValue);

        // Filter tax codes for the receipt dropdown
        const filtered = this.taxCodes.filter(tax => {
            const label = tax.label?.toLowerCase() || '';
            const code = tax.code?.toLowerCase() || '';
            const desc = tax.description?.toLowerCase() || '';

            return (
                code.includes(searchLower) ||
                desc.includes(searchLower) ||
                label.includes(searchLower)
            );
        });

        console.log('🎯 Filtered Tax Codes (Receipt):', filtered);

        // Update the tax field of ONLY the row typed (Receipt List!)
        this.salesEntryListReceit = this.salesEntryListReceit.map(row => {
            if (row.Id == rowId) {
                return {
                    ...row,
                    tax: inputValue
                };
            }
            return row;
        });

        // Assign filtered list to Receipt UI variable
        this.filteredTaxCodesReceit = filtered;

        // Store active row for Receipt tax selection
        this.activeRowIdTaxReceit = rowId;

        // Show receipt tax table
        this.showtableTaxReceit = true;
    }
    handleSelectionTaxReceit(event) {                  
        const recordId = event.currentTarget.dataset.id;
        const code = event.currentTarget.dataset.code;
        const rate = event.currentTarget.dataset.rate;

       // console.log('🔹 Record ID in Tax:', recordId);
        console.log('🔹 Selected Tax Code:', code);
        console.log('🔹 Tax Rate (%):', rate);
        //console.log('🔹 Tax Inclusive?', this.taxInclusive);
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryListReceit));
        console.log('this.selectedRowIdReceit in handleTaxSearchReceit : ', this.selectedRowIdReceit);

        this.salesEntryListReceit = this.salesEntryListReceit.map(sales => {
            let updated= { ...sales };

            if (String(sales.Id) === this.selectedRowIdReceit) {
                updated.taxReceit = `${rate}`;
                updated.taxValueReceit = rate;
                let taxRate = parseFloat(rate) / 100 || 0;

                console.log('updated.tax :', updated.taxReceit );
                console.log('updated.taxValueReceit:', updated.taxValueReceit);
                console.log(' Tax Rate :', taxRate);
                
                console.log('updated.Cash_Receit__c:', updated.Cash_Receit__c);
                const cashReceit = parseFloat(updated.Cash_Receit__c) || 0;
                console.log(' cashReceit :', cashReceit);

                if(cashReceit > 0){
                   console.log(' cashReceit 111:', cashReceit);
                   const amount = parseFloat((cashReceit / (1 + taxRate)).toFixed(2));
                   const taxAmount = parseFloat((cashReceit - amount).toFixed(2));
                    console.log(' amount :', amount);
                    console.log(' taxAmount :', taxAmount);
                    updated.Amount_Receit__c = amount;
                    updated.Tax_Amount_Receit__c = taxAmount;
                    updated.Cash_Receit__c = cashReceit;
                   
                    console.log(' updated.Amount_Receit__c : ',  updated.Amount_Receit__c);
                    console.log(' updated.Tax_Amount_Receit__c : ',  updated.Tax_Amount_Receit__c);
                    console.log(' updated.Cash_Receit__c : ',  updated.Cash_Receit__c);
                }
            }
              
            return updated;
        });

        let totalAmount = 0;
        let totalTax = 0;
        let totalPaid = 0;

        this.salesEntryListReceit.forEach(row => {
            totalAmount += parseFloat(row.Amount_Receit__c) || 0;
            totalTax += parseFloat(row.Tax_Amount_Receit__c) || 0;
            totalPaid += parseFloat(row.Cash_Receit__c) || 0;
        });

        this.amountarreyReceit = {
            subTotal: parseFloat(totalAmount.toFixed(2)),   // = Total Amount
            taxAmount: parseFloat(totalTax.toFixed(2)),     // = Total Tax
             totalAmount:parseFloat((totalAmount + totalTax).toFixed(2)),
        };

        this.cashTotalAmountReceived = this.amountarreyReceit.subTotal;  // show Total Amount
        this.taxAmountReceived = this.amountarreyReceit.taxAmount;       // show Tax
        this.cashTotalReceived = parseFloat(totalPaid.toFixed(2));  // show Total Paid
        this.showtableTaxReceit = false;
         this.listenForOutsideClick = false;

        console.log('📊 Updated Amount Array:', JSON.stringify(this.amountarreyReceit));
        console.log('📦 Updated Sales Entry List:', JSON.stringify(this.salesEntryListReceit));
       // console.log('🧾 Totals → SubTotal:', this.subTotal, ', TaxAmount:', this.taxAmount, ', TotalAmount:', this.totalAmount);
    }
   
    handleSelectionReceit(event) {
        const recordId = event.currentTarget.dataset.id;
        const accountNumber = event.currentTarget.dataset.accno;
        const accountValue = event.currentTarget.dataset.value;
        const rowId = this.activeRowIdReceit; // Receipt active row

        console.log('📌 Receipt → Selected Record ID:', recordId);
        console.log('Account Number:', accountNumber);
        console.log('Account Value:', accountValue);
        console.log('Active Receipt Row ID:', rowId);

        this.salesEntryListReceit = this.salesEntryListReceit.map(row => {
            if (row.Id == rowId) {
                return {
                    ...row,
                    accountListReceit: `${accountNumber} - ${accountValue}`,
                    accountItemIdReceit: recordId
                };
            }
            return row;
        });

        this.showtableReceit = false;
        this.listenForOutsideClick = false;

        console.log(
            'Updated Receipt Entry List (handleSelectionReceit):',
            JSON.stringify(this.salesEntryListReceit)
        );
    }
    // handleSelectionTaxReceit(event) {
    //     const recordId = event.currentTarget.dataset.id;
    //     const code = event.currentTarget.dataset.code;
    //     const rate = event.currentTarget.dataset.rate;

    //     console.log('📌 Receipt → Selected Tax Code:', code, 'Rate:', rate);
    //     console.log('Active Receipt Row ID:', this.selectedRowIdReceit);

    //     let totalSubTotal = 0;
    //     let totalTaxAmount = 0;
    //     let totalAmount = 0;

    //     this.salesEntryListReceit = this.salesEntryListReceit.map(row => {
    //         let updated = { ...row };

    //         if (String(row.Id) === this.selectedRowIdReceit) {
    //             updated.taxReceit = `${rate}`;
    //             updated.taxValueReceit = rate;

    //             const amount = parseFloat(updated.Amount__c) || 0;
    //             const rawAmount = parseFloat(amount.toFixed(2));
    //             const taxRateDecimal = parseFloat(rate) / 100;

    //             updated.calculatedAmount = rawAmount;

    //             if (this.taxInclusiveReceit) {
    //                 const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
    //                 const taxAmount = parseFloat((rawAmount - subTotal).toFixed(2));

    //                 updated.subTotal = subTotal;
    //                 updated.taxAmount = taxAmount;
    //                 updated.totalAmount = rawAmount;
    //             } else {
    //                 const taxAmount = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
    //                 const totalAmt = parseFloat((rawAmount + taxAmount).toFixed(2));

    //                 updated.subTotal = rawAmount;
    //                 updated.taxAmount = taxAmount;
    //                 updated.totalAmount = totalAmt;
    //             }
    //         }

    //         totalSubTotal += parseFloat(updated.subTotal) || 0;
    //         totalTaxAmount += parseFloat(updated.taxAmount) || 0;
    //         totalAmount += parseFloat(updated.totalAmount) || 0;

    //         return updated;
    //     });

    //     this.amountarreyReceit = {
    //         subTotal: parseFloat(totalSubTotal.toFixed(2)),
    //         taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
    //         totalAmount: parseFloat(totalAmount.toFixed(2))
    //     };

    //     this.selectedTaxOptionReceit = `${rate}`;
    //     this.showtableTaxReceit = false;
    //     this.listenForOutsideClick = false;

    //     console.log('📦 Updated Receipt Entry List:', JSON.stringify(this.salesEntryListReceit));
    //     console.log('📊 Receipt Totals amountarreyReceit:', JSON.stringify(this.amountarreyReceit));
    // }
    fetchLedgerItemsforExpensesReceit(rowId) {
        console.log('Calling Apex Method: getLedgerItemsforExpenses...');
        console.log('companyId in fetchLedgerItemsforExpenses: ' + this.selectedCompany);

        // Call the Apex method and pass companyId as parameter
        getAllLedgerItems({ companyId: this.selectedCompany })
            .then(result => {
                console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

                // Process the data and map it to a proper format
                this.ledgerItemsReceit = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                }));

                console.log('Processed Ledger Items:', JSON.stringify(this.ledgerItemsReceit));
                this.FilteredLedgerItemsReceit = this.ledgerItemsReceit;
                  
                this.filterLedgerForFourPrefix(rowId);
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }
    handleCashClearReceit() {
        this.taxInclusiveReceit=true;
        this.InvoiceNoReceit = '';
        this.commentsReceit = '';
        this.ledgerItemsReceit = [];
        this.deletedRowIdsReceit = [];
        this.selectedRowIdReceit = null;
        this.selectedItemReceit = null;
        this.invoiceDateReceit = null;

        this.taxDropdownStyleReceit = '';
        this.customerDropdownStyleReceit = '';

        this.cashTotalAllocatedReceit = 0;
        this.cashTotalReceived = 0;
        this.cashOutOfBalanceReceit = 0;
        this.taxAmountReceived = 0;
        this.cashTotalAmountReceived = 0;

        this.salesEntryReceit = {
            company: this.selectedCompany,
            entryType: 'Sales',
            InvoiceDate: '',
            InvoiceNo: '',
            comments: ''
        };

        this.selectedOptionALNewReceit = '';
        this.selectedOptionTaxReceit = '';
        this.salesEntryListReceit.length =1;
        if (this.salesEntryListReceit.length > 0) {
            this.salesEntryListReceit = this.salesEntryListReceit.map(entry => {
                return {
                    ...entry,
                    Description_Receit__c: '',
                    Amount_Receit__c: '',
                    Cash_Receit__c: '' , // Receipt equivalent of Cash_Paid
                    accountListReceit:'4-',
                    taxReceit:'',
                    Tax_Amount_Receit__c:'',
                     allowTaxEditReceit: false,
                };
            });
        }
           this.resetAllDropdowns(); 
    }
    handleCashReceitSubmit() {

        if (!this.invoiceDateReceit) {
            this.showToast('Error', 'Please Enter the required fields.', 'error');
            return;
        }
        const payment = {
            company: this.selectedCompany,
            paymentDate: this.invoiceDateReceit,
            overalTotalReceived: this.cashTotalReceived,
            fromLedger: this.selectedLedgerItemId,
            isCashReceived:true
           
        };
        console.log('Payment Payload:', JSON.stringify(payment));
        console.log('Handling save for Cash Receipt');
        console.log('Sales Entry (Receipt):', JSON.stringify(this.salesEntryReceit));
        console.log('Sales Entry List (Receipt):', JSON.stringify(this.salesEntryListReceit));
        console.log('Amount Array (Receipt):', JSON.stringify(this.amountarreyReceit));

        console.log('deletedRowIdsReceit BEFORE:', JSON.stringify(this.deletedRowIdsReceit));

        if (this.deletedRowIdsReceit && this.deletedRowIdsReceit.length > 0) {
            deleteMatchingRecordsRfq({
                deletedIdsJson: JSON.stringify(this.deletedRowIdsReceit)
            })
            .then(() => {
                console.log('Deleted rows successfully (Receipt).');
                this.deletedRowIdsReceit = [];
            })
            .catch(error => {
                console.error('Error deleting rows (Receipt):', error);
                this.showToast('Error', 'Failed to delete rows', 'error');
            });
        }

        updateDataForCashReceipt({
            salesEntryJson: JSON.stringify(this.salesEntryReceit),
            salesEntryListJson: JSON.stringify(this.salesEntryListReceit),
            amountEntryJson: JSON.stringify(this.amountarreyReceit),
            paymentJson: JSON.stringify(payment)
        })
        .then(result => {
            console.log('Result from Apex (Receipt):', result);

            const tempInvoiceId = result.Id;
            console.log('Temporary Receipt Invoice ID:', tempInvoiceId);

            this.showToast('Success', 'Receipt submitted successfully', 'success');

            // SAME SHARED FUNCTION ─ DO NOT CHANGE
           // this.updatePayFromAccountLedgerId(this.selectedLedgerItemIdReceit);
            this.updatePayFromAccountLedgerId(this.selectedLedgerItemId, this.cashTotalReceived,this.selectedOptionCategory,this.entryType );
            this.handleCashClearReceit();
        })
        .catch(error => {
            console.error('Error saving receipt:', error);

            const msg = error?.body?.message ||
                        'An unknown error occurred while saving receipt.';
            this.showToast('Error', msg, 'error');
        });
}





    















    
   
}