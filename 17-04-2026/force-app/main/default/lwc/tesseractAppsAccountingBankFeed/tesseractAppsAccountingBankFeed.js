import { LightningElement, track, api, wire } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getLedgerItemsforExpenses from '@salesforce/apex/AccountingModuleController.getLedgerItemsforExpenses';
 import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
//import getLedgerItemsAssetsLiabilities from '@salesforce/apex/AccountingBankingController.getLedgerItemsAssetsLiabilities';
import { refreshApex } from '@salesforce/apex';

export default class TesseractAppsAccountingBankFeed extends LightningElement {
   @track isHome =true; 
   @track isContent = true;
  // @api companyname;
   @api orgid;
   //@api companyid;
   @track isImportForms =  true;
   @track isattachError = false;
   @track isAllSelected = false;
    //@track isAllSelected1 = false;
   @track isDataEmpty = false;
   @track  data = [];
   @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
   @track records = []; //All records available in the data table
   @track originalData = [];
   @track totalRecords = 0; //Total no.of records
   @track pageSize; //No.of records to be displayed per page
   @track totalPages; //Total no.of pages
   @track pageNumber = 1; //Page number

   @track entryType;
   @track entryNameOptions=[];
   @track selectedEntityName='';
   @track selectedOptionAL = ''; 
   @track selectedOptionTax;
   FilteredLedgerItems=[];
   @track ledgerItems = [];
   @track selectedCompany;
   @track isDropdownOpen = false;
   @track showtable = false; 
   @track searchTerm ='';
   @track postDate;


   @track isTitleMenuFlag = true;
   @track isBankFeedFlag= true;
   @track isSpendMoneyFlag= false;
   @track isReceiveMoneyFlag= false;
   @track isCashTransationsFlag = false;
   @track paymentType = 'Cash Payment';
   @track isEntityFlag = false;
   @track entityNameOptions=[];
   @track entityName='';
   @track date;
   @track payee;
   @track amount;
   @track customerDropdownStyle = '';
    customerShowTable = false;
    FilteredLedgerItemsNew = [];
    customerSelectedAccountId = '';
    activeRowId = '';
   @track ledgerItemsNew = [];
   @track paymentTypeOptions = [{label:'Cash Payment',value:'Cash Payment'},{label:'Entity Payment',value:'Entity Payment'}];
    @track selectedOptionALNew;
    @track paginationVisible=false;

   //@track disableGo=true;
    coming = My_Resource + '/myResource/images/Livesoon.png';
    @track entryOptions=[{label:'Sales',value:'Sales'} , {label:'Purchases',value:'Purchases'}];
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
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
        window.addEventListener('click', this.handleOutsideClick);
   }
   disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
    }
    @track listenForOutsideClick = false;
     handleOutsideClick = (event) => {
        if (this.listenForOutsideClick) {
           
            const dropdownElement1 = this.template.querySelector('[data-id="taxTable"]');
            if (dropdownElement1 && !dropdownElement1.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.isDropdownOpen = false;
                this.listenForOutsideClick = false;
            }
            const dropdownElement2 = this.template.querySelector('[data-id="accountListTable"]');
            if (dropdownElement2 && !dropdownElement2.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.showtable = false;
                this.listenForOutsideClick = false;
            }
             const dropdownElement3 = this.template.querySelector('[data-id="accountListTableDropdown"]');
            if (dropdownElement3 && !dropdownElement3.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.customerShowTable = false;
                this.listenForOutsideClick = false;
            }
           
        }
    };
   @wire(getEntityProfiles, {companyId: '$selectedCompany' , entryType:'$entryType' })
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
        //    if (!this.entryNameOptions.some(option => option.value === 'Add New Entity')) {
        //        this.entryNameOptions.push({ label: ' +  Add New Entity', value: 'Add New Entity' });
        //    }
        //    console.log('Filtered entryNameOptions options after: ', JSON.stringify( this.entryNameOptions));
            
        } else if (error) {
            this.error = error;
            console.error('Error fetching entity profiles:', error);
        }
    }
    
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
            
            this.selectedOptionTax = taxValue;
            this.selectedOptionAL = entityAccountList;
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
    handleCSVUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            const file = files[0];

            // Check for file size (e.g., limit to 512MB)
            const MAX_FILE_SIZE = 512 * 1024 * 1024; // 512MB
            if (file.size > MAX_FILE_SIZE) {
                this.isattachError = true;
                return;
            }

            // Set file name for UI
            this.fileName = file.name;

            // Start reading the uploaded csv file
            this.read(file);
        }
    }

    // Read the CSV file
    async read(file) {
        try {
            this.showSpinner = true;
            const result = await this.load(file); // Load file content
            this.parseCSV(result); // Parse CSV content
        } catch (e) {
            this.error = e;
            this.showSpinner = false;
        }
    }

    // Load the file content
    async load(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = () => {
                reject(reader.error);
            };

            reader.readAsText(file);
        });
    }

    // Parse the CSV content
    parseCSV(csv) {
        this.records = [];
        const lines = csv.split(/\r\n|\n/);
        const defaultHeaders = ['Date', 'Amount', 'Description'];
        const firstLine = lines[0].split(',');

        const isHeaderPresent = defaultHeaders.every(header => firstLine.includes(header));
        const headers = isHeaderPresent ? firstLine : defaultHeaders;

        // Map headers to columns
        this.columns = defaultHeaders.map((header) => {
            switch (header) {
                case 'Date':
                    return { label: 'Date', fieldName: 'Date', initialWidth: 100, typeAttributes: { month: "2-digit", day: "2-digit", year: "numeric" } };
                case 'Amount':
                    return { label: 'Amount', fieldName: 'Amount', initialWidth: 100 };
                case 'Description':
                    return { label: 'Description', fieldName: 'Description', initialWidth: 470 };
                default:
                    return { label: defaultHeaders, fieldName: defaultHeaders };
            }
        });

        const data = [];
        let idCounter = 1;

        // Parse CSV and format into a usable data structure
        for (let i = isHeaderPresent ? 1 : 0; i < lines.length; i++) {
            const currentline = lines[i].split(',');

            // Skip empty lines or rows with missing required columns
            const isEmpty = defaultHeaders.some((header, index) => {
                const value = currentline[index] ? currentline[index].trim() : '';
                return (header === "Date" || header === "Description" || header === "Amount") && !value;
            });

            if (!isEmpty) {
                const obj = {};
                for (let j = 0; j < defaultHeaders.length; j++) {
                    obj[defaultHeaders[j]] = currentline[j] || '';
                }
                obj.Id = 'row-' + idCounter++;
                data.push(obj);
            }
        }

        this.records = data;
       // this.data = data; // Update data bound to the table
        this.showSpinner = false; // Hide spinner
         
        this.originalData = data;
        this.totalRecords = this.records.length;
        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;
        this.paginationHelper(); 
       // this.paginationData();
    
        console.log('Remaining unfiltered transactions:', this.records);
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
    // previousPage() {
    //     this.pageNumber = this.pageNumber - 1;
    //     this.paginationHelper();
    // }

    // nextPage() {
    //     this.pageNumber = this.pageNumber + 1;
    //     this.paginationHelper();
    // }

    // firstPage() {
    //     this.pageNumber = 1;
    //     this.paginationHelper();
    // }

    // lastPage() {
    //     this.pageNumber = this.totalPages;
    //     this.paginationHelper();
    // }
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
        this.data = [];
        if (this.totalRecords > 0) {
            this.paginationVisible = true;
        } else{
            this.paginationVisible = false;
        }
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.data.push(this.records[i]);            
        }       
    }

     triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    // handleCSVSearch(event) {
    //     console.log('search');
    //     this.searchTerm = event.target.value.toLowerCase();
    //     console.log('Search term:', this.searchTerm);

    //     if (this.searchTerm) {
    //         const filtered = this.originalData.filter(row =>
    //             row.Description && row.Description.toLowerCase().includes(this.searchTerm)
    //         );

    //         console.log('Filtered records count:', filtered.length);
    //         console.log('Filtered data:', filtered);

    //         this.records = filtered;
    //     } else {
    //         console.log('Search cleared. Restoring original data.');
    //         this.records = [...this.originalData];
    //     }

    //     this.totalRecords = this.records.length;
    //     this.pageNumber = 1;

    //     console.log('Total records after filtering:', this.totalRecords);

    //     this.paginationHelper(); // This updates this.data for the table
    //     console.log('Data after pagination:', this.data);
    // }
    handleCSVSearch(event) {
       console.log('search');
        this.searchTerm = event.target.value.toLowerCase();
        console.log('Search term:', this.searchTerm);

        if (this.searchTerm) {
            const filtered = this.originalData.filter(row =>
                row.Description && row.Description.toLowerCase().includes(this.searchTerm)
            );

            console.log('Filtered records count:', filtered.length);
            console.log('Filtered data:', filtered);

            this.records = filtered;
        } else {
            console.log('Search cleared. Restoring original data.');
            this.records = [...this.originalData];
        }

        this.totalRecords = this.records.length;
        this.pageNumber = 1;

        console.log('Total records after filtering:', this.totalRecords);

        this.paginationHelper(); // This updates this.data for the table
        console.log('Data after pagination:', this.data);
   }
    // handleCSVSearch(event) {
    //     console.log('This is firing');
    //     this.searchTerm = event.target.value;
    //     console.log('Search term:', this.searchTerm);
    // }

    handleRadioSelection(event) {
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;

        // Update the isSelected property of the row
        this.data = this.data.map(row => {
            if (row.Id === selectedId) {
                row.isSelected = isChecked;
            }
            return row;
        });

        // Check if all rows are selected, then update the master checkbox
        this.updateMasterCheckboxState();
    }

    // Handle the master checkbox (select all)
    handleSelectAll(event) {
        const isChecked = event.target.checked;

        // Set the isSelected property of all rows to the state of the master checkbox
        this.data = this.data.map(row => {
            row.isSelected = isChecked;
            return row;
        });

        // Update the master checkbox state
        this.isAllSelected = isChecked;
    }

    // Update the master checkbox state based on the individual selections
    updateMasterCheckboxState() {
        const allSelected = this.data.every(row => row.isSelected);
        const noneSelected = this.data.every(row => !row.isSelected);

        if (allSelected) {
            this.isAllSelected = true;
        } else if (noneSelected) {
            this.isAllSelected = false;
        } else {
            this.isAllSelected = false; // This can be used to show indeterminate state, but for simplicity we just reset it.
        }
    }
    //  handleFocus() {
    //     this.showtable = true;
    //     //this.fetchLedgerItemsforExpenses();
    //      this.fetchLedgerItems();
    //     this.FilteredLedgerItems = [...this.ledgerItems];

    // }

    // handleBlur() {
    //     setTimeout(() => {
    //         this.showtable = false;
    //     }, 200);
    // }

    handleSearch(event) {
        // this.selectedOptionAL = event.target.value;
        // const searchLower = this.selectedOptionAL.toLowerCase();

        // this.FilteredLedgerItems = this.ledgerItems.filter(item => {
        //     const accNo = item.accNo?.toLowerCase() || '';
        //     const itemName = item.itemName?.toLowerCase() || '';
        //     const combined = `${accNo} - ${itemName}`;

        //     return (
        //         accNo.includes(searchLower) ||
        //         itemName.includes(searchLower) ||
        //         combined.includes(searchLower)
        //     );
        // });

        // if (!this.selectedOptionAL) {
        //     this.FilteredLedgerItems = [...this.ledgerItems];
        // }

        // this.showtable = true;
        this.selectedOptionAL = event.target.value;
        console.log("Selected Option (raw):", this.selectedOptionAL);

        const searchLower = this.selectedOptionAL.toLowerCase();
        console.log("Search (lowercased):", searchLower);

        console.log("ledgerItems  IN SEARCH :", this.ledgerItems);

        this.FilteredLedgerItems = this.ledgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            const match = (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );

            // Log each item's comparison
            console.log(`Checking item: accNo="${accNo}", itemName="${itemName}", combined="${combined}", match=${match}`);

            return match;
        });

        if (!this.selectedOptionAL) {
            console.log("No selected option — resetting filter to full list.");
            this.FilteredLedgerItems = [...this.ledgerItems];
        }

        this.showtable = true;
        console.log("Filtered Items:", this.FilteredLedgerItems);

            
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
                this.FilteredLedgerItems = this.ledgerItems;
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
        switch(fieldName) {
           
            case 'entryType':
                this.entryType = fieldValue;
                console.log('Selected entryType:', this.entryType);
                if( this.entryType==='Sales'){
                    // this.selectedCardType = 'Customer';
                    // console.log('selectedCardType in onchange : '+this.selectedCardType);  
                    refreshApex(this.wiredEntityProfilesResult);
                      this.fetchLedgerItems();
                } else if( this.entryType==='Purchases'){
                    // this.selectedCardType = 'Supplier';
                    // console.log('selectedCardType in onchange : '+this.selectedCardType);
                     refreshApex(this.wiredEntityProfilesResult);
                     this.fetchLedgerItemsforExpenses();
                }
                // setTimeout(() => {
                //     refreshApex(this.wiredEntityProfilesResult);
                // }, 1000);
                break;
    //         case 'subTotal':
    //             this.subTotal = fieldValue;
    //             console.log('Selected sub total:', this.subTotal);
    //             break;
    //         // case 'entityType':
    //         //     this.selectedCardType = fieldValue;
    //         //     console.log('Selected Entity Type:', this.selectedCardType);
    //         //     setTimeout(() => {
    //         //         refreshApex(this.wiredEntityProfilesResult);
    //         //     }, 1000);
    //         //     break;
    
            case 'entityName':
                this.selectedEntityName = fieldValue;
                console.log('Selected Entity Name:', this.selectedEntityName);
                break;
    
    
    //         case 'InvoiceDate':
    //             this.invoiceDate = fieldValue;
    //             console.log('Invoice Date:', this.invoiceDate);
    //             break;
    
            case 'PostDate':
                this.postDate = fieldValue;
                console.log('Post Date:', this.postDate);
                break;
    
    //         case 'InvoiceNo':
    //             this.invoiceNo = fieldValue;
    //             console.log('Invoice No:', this.invoiceNo);
    //             break;
    //         // case 'entitytype':
    //         //         this.entitytype = fieldValue;
    //         //         console.log('entitytype:', this.invoiceNo);
    //         //         break;
    //         case 'comments':
    //             this.comments = fieldValue;
    //             console.log('comments:', this.comments);
    //                 break;
    //         case 'startdateValueData':
    //             this.startdateValueData = fieldValue;
    //             console.log('startdateValueData:', this.startdateValueData);
    //             break;
    //         case 'enddateValueData':
    //             this.enddateValueData = fieldValue;
    //             console.log('enddateValueData:', this.enddateValueData);
    //             break;
            default:
                console.log('Unknown field:', fieldName);
                break;
        }
    }
    
    toggleDropdownAccountList(event) {
        console.log('toggleDropdown');
        // this.showtable = false;
         //this.showtable = !this.showtable;
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
        // const rect = event.currentTarget.getBoundingClientRect();
        // const scrollY = window.scrollY || window.pageYOffset;
        // const scrollX = window.scrollX || window.pageXOffset;
    
        // // Calculate position based on 10% X offset and 2% Y offset
        // const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        // const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X
    
        // this.toggleDropdownAccount = `
        //     position: absolute;
        //     top: ${top}px;
        //     left: ${left}px;
        //     width: 23%;
        //     max-height: 300px;
        //     z-index: 1000;
        //     background: white;
        //     border: 1px solid #ccc;
        //     border-radius: 4%;
        //     overflow-y: auto;
        //     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        // `;
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
     toggleDropdown(event) {
        console.log('toggleDropdown');
         //event.stopPropagation(); 
        this.isDropdownOpen = !this.isDropdownOpen;
        console.log('this.isDropdownOpen'+this.isDropdownOpen);

        // const rect = event.currentTarget.getBoundingClientRect();
        // const scrollY = window.scrollY || window.pageYOffset;
        // const scrollX = window.scrollX || window.pageXOffset;
    
        // // Calculate position based on 10% X offset and 2% Y offset
        // const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        // const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X
    
        // this.taxDropdownStyle = `
        //     position: absolute;
        //     top: ${top}px;
        //     left: ${left}px;
        //     width: 23%;
        //     max-height: 300px;
        //     z-index: 1000;
        //     background: white;
        //     border: 1px solid #ccc;
        //     border-radius: 4%;
        //     overflow-y: auto;
        //     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        // `;
          if (this.isDropdownOpen) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }
     
     handleSelectionTax(event) {
    //     
           const selectedRow = event.currentTarget;
          // Retrieve the label (data-value) and rate (data-value1) from the clicked row
          const selectedLabel = selectedRow.getAttribute('data-value');
          const selectedRate = selectedRow.getAttribute('data-value2');
          console.log('Selected Option (Label):', this.selectedLabel);
          console.log('Selected Rate:', this.tax1);
          this.selectedOptionTax =  selectedRate; 
          this.isDropdownOpen = !this.isDropdownOpen;
            this.listenForOutsideClick = false;
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
        this.showtable = !this.showtable ;
        this.listenForOutsideClick = false;
    }
    handleSubmit() {
         const selectedRows = this.data.filter(row => row.isSelected);

        console.log('Selected Rows:', JSON.stringify(selectedRows)); // ✅ Confirm selected rows are coming in

        if (selectedRows.length === 0) {
            this.showToast('Error', 'Please select at least one row.', 'error');
            return;
        }

        selectedRows.forEach((row, index) => {
            // Check if Amount exists and is a valid number
            const rawAmount =  row.Amount?.replace(/"/g, ''); // clean up quotes
            const subTotal = parseFloat(rawAmount); // Treat this as the subTotal
               console.log('Parsed SubTotal:', subTotal);
            if (isNaN(subTotal)) {
                console.warn(`Row ${index + 1} skipped — invalid amount:`, rawAmount);
                return;
            }

                const taxRateStr = this.selectedOptionTax?.replace('%', '') || '0';
            const taxRate = parseFloat(taxRateStr);
            const taxMultiplier = (taxRate / 100) + 1;

            const taxAmount = parseFloat((subTotal * (taxMultiplier - 1)).toFixed(2));
            const totalAmount = parseFloat((subTotal + taxAmount).toFixed(2));


            console.log('Sub Total:', subTotal);
            console.log('Tax Amount:', taxAmount);
            console.log('Total Amount:', totalAmount);

            // Call Apex method for each selected row
        //     const promise = createJournalEntries({
        //         companyId: this.companyId,
        //         totalAmount: amount,
        //         taxAmount: taxAmount,
        //         subTotal: subTotal,
        //         selectedItem: this.selectedOptionAL,
        //         description: row.Description,
        //         entryType: this.entryType,
        //         selectedCardType: null,
        //         selectedEntityName: this.selectedEntityName,
        //         taxInclusive: true,
        //         terms: this.terms,
        //         invoiceDate: row.Date,
        //         postDate: this.postDate,
        //         invoiceNo: null,
        //         comments: null,
        //         createdFromExpenses: 'false',
        //         isGeneralSales: this.entryType === 'Sales',
        //         amount: amount,
        //         tax: taxRate.toString()
        //     })
        //     .then(() => {
        //         console.log('Successfully created journal entries for:', row);
        //     })
        //     .catch(error => {
        //         console.error('Failed to create journal entries for:', row, error);
        //     });

        //     promises.push(promise);
        // });

        // // Wait for all journal entries to complete
        // Promise.all(promises)
        //     .then(() => {
        //         this.showToast('Success', 'All invoices and journal entries created successfully.', 'success');
        //         // Optional: refresh view or clear selection
        //     })
        //     .catch(() => {
        //         this.showToast('Error', 'Some invoices or entries failed to create. Check logs.', 'error');
        //     });

         console.log(`Row ${index + 1}:`);
        console.log('→ Description:', row.Description);
        console.log('→ Date:', row.Date);
        console.log('→ Sub Total:', subTotal);
        console.log('→ Tax Rate:', taxRate + '%');
        console.log('→ Tax Amount:', taxAmount);
        console.log('→ Total Amount:', totalAmount);
        console.log('→ Account:', this.selectedOptionAL);
        console.log('→ Entity Name:', this.selectedEntityName);
        console.log('→ Entry Type:', this.entryType);
      
        });
    }




    get bankFeedClass(){
        return this.isBankFeedFlag  ? 'menu-item1' : 'menu-item'; 
    }
    get spendMoneyClass(){
      return this.isSpendMoneyFlag  ? 'menu-item1' : 'menu-item'; 
    }
    get receiveMoneyClass(){
      return this.isReceiveMoneyFlag  ? 'menu-item1' : 'menu-item'; 
    }
    get cashTransationsClass(){
      return this.isCashTransationsFlag  ? 'menu-item1' : 'menu-item'; 
    }
    handleBankFeed(){
        this.isBankFeedFlag=true;
        this.isSpendMoneyFlag=false;
        this.isReceiveMoneyFlag=false;
        this.isCashTransationsFlag = false; 
        this.isTitleMenuFlag = true;
       // this.isHome = true;
        //this.isDataEmpty = false;
    }
    handleSpendMoney(){
        this.isBankFeedFlag=false;
        this.isSpendMoneyFlag=true;
        this.isReceiveMoneyFlag=false;
        this.isCashTransationsFlag = false; 
        this.isTitleMenuFlag = true;
        // this.isHome = false;
        // this.isDataEmpty = true;
    } 
    handleReceiveMoney(){
        this.isBankFeedFlag=false;
        this.isSpendMoneyFlag=false;
        this.isReceiveMoneyFlag=true; 
        this.isCashTransationsFlag = false;
        this.isTitleMenuFlag = true;
        // this.isHome = false;
        // this.isDataEmpty = true;
    } 
    handleCashTransations(){
        this.isBankFeedFlag=false;
        this.isSpendMoneyFlag=false;
        this.isReceiveMoneyFlag=false; 
        this.isCashTransationsFlag = true;
        this.isTitleMenuFlag = true;
       
        // this.isHome = false;
        // this.isDataEmpty = true;
    }  
    
   

}