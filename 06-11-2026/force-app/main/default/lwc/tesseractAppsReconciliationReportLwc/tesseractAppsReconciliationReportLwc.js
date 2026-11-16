import { LightningElement , track, wire,api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import LightningConfirm from 'lightning/confirm';
import getKeyWords from '@salesforce/apex/ChartOfAccounts.getKeyWords';
import Id from '@salesforce/user/Id';
import OrgNisation from '@salesforce/schema/User.Organization_Name__c';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import insertAccounts from '@salesforce/apex/ChartOfAccounts.createRawData';
import getFinalAccountsdata from '@salesforce/apex/ChartOfAccounts.getFinalAccountsdata';
import { CurrentPageReference } from "lightning/navigation";
import { deleteRecord } from 'lightning/uiRecordApi';


export default class TesseractAppsReconciliationReportLwc extends NavigationMixin(LightningElement) {
    @api orgid;
    @api companyid;
    @api companyname;
    @track isTitleAndBack = true;
    @track isBackToParent = true;
    //@track orgidtrack;
    @track  columns =[
       
        {
            label: 'Date',
            fieldName: 'Date' ,  initialWidth: 100 , 
            typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}       
        },
        {            
            label: 'Amount',
            fieldName: 'Amountc',  initialWidth:100,
            
        },
        {            
            label: 'Description',
            fieldName: 'Description',  initialWidth:470
        },
    ];

    @track  expenseInvoiceColumns =[
    {
        label: 'Account Name',
        fieldName: 'AccountName' ,  initialWidth: 100 ,
        editable: true
        
                
    },
    {
            label: 'Account Number',
            fieldName: 'AccountNumber' ,  initialWidth: 100 , 
            editable: true
            
    },
    {
        label: 'Date',
        fieldName: 'Date' ,  initialWidth: 100 , 
                
        },
        {            
            label: 'Amount',
            fieldName: 'Amount',  initialWidth: 100,
            
        },
        {            
            label: 'Description',
            fieldName: 'Description',  initialWidth: 300
        },
        {            
            label: 'Category',
            fieldName: 'Category',  initialWidth: 150,
            editable: true,
        }
    ];
    @track  data = [];
    @track  ExpenseData=[];
    @track InvoiceData=[];
    @track selectedData=[];
    @track originalData = [];
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number

    @track pageSizeOptions1 = [10, 25, 50, 75, 100]; //Page size options
    @track records1 = []; //All records available in the data table
    @track totalRecords1 = 0; //Total no.of records
    @track pageSize1; //No.of records to be displayed per page
    @track totalPages1; //Total no.of pages
    @track pageNumber1 = 1; //Page number
    @track filteredSearchResults = [];
    @track searchKey = '';
    @track confirmAction = '';
    @track options = [];
    @track keyWordsList=[];
    wiredKeyWords
    @track orgName;
    @track rawData=[];
    @track finalData=[]

    @track CategoryValue = '';
    @track finalData = []; // Stores categorized transactions
    @track filteredData = []; // Stores the data displayed in the data table
    @track selectedKey = ''; // Stores the currently selected key (category)
    @track selectedCategory;
    @track disableGo=true;
    @track openAccountform=false;
    @track AccountName;
    @track AccountNumber;
    @track Catgeory;
    @track isImportForms=false;
    @track isChartOfAccounts=true;
    @track startDate;
    @track endDate;
    wiredAccountsList;
    @track FinalGroupWiseData=[];
    @track finalHtmlTable=[];
    @track AccountNumberJSON={};
    @track AcountNameOptions=[];
    @track typesOfcategoryOptions=[];
    @track orgDetails = false;
    @track ChartOfAccountFlag=false;
    @track openCHartForm=false;  
    @track chartId;
    @track firsttable=false;
    @track isAllSelected = false;
    @track isAllSelected1 = false;
    @track isDataEmpty = false;


    get Categoryoptions() {
        return [
            { label: 'Automatic', value: 'Automatic' },
            { label: 'Find and Match', value: 'FindandMatch' },
            { label: 'Manual', value: 'Manual' },
        ];
    }
    get isDataEmpty() {
        return !this.data || this.data.length === 0;
    }
/* 
    get typesOfcategoryOptions(){
        return [
            { label: 'Asset', value: 'Asset' },
            { label: 'Expense', value: 'Expense' },
            { label: 'Liability', value: 'Liability' },
        ];
    } */
    connectedCallback(){
        console.log('orgId IN TesseractAppsReconciliationReportLwc : '+this.orgid);
        // this.orgidtrack = this.orgid;
    }
    @wire(getRecord, { recordId: Id, fields: [OrgNisation]}) 
        userDetails({error, data}) {
            if (data) {
            console.log('organisation '+data.fields.Organization_Name__c.value);
            this.orgName=data.fields.Organization_Name__c.value;
            console.log('this.orgName : ', this.orgName);
            refreshApex(this.wiredKeyWords);
            } else if (error) {
            }
        }
    
    @wire(getKeyWords, { orgName: '$orgName' })
       wiredClient(result) {
           this.wiredKeyWords = result;
           const { data, error } = result;
   
           // Log to see if data is received
           console.log('Wired Result:', result);
   
           if (data) {
               this.keyWordsList = data;
               this.typesOfcategoryOptions = []; // Reinitialize to an empty array
   
               const uniqueCategories = new Set();
   
               // Check the structure of 'data'
               console.log('Data received from the wire:', JSON.stringify(data));
   
               data.forEach(rec => {
                   // Check each record's fields
                   console.log('Processing record: ', rec);
   
                   if (rec.Account_Name__c) {
                       // Add to AccountNumberJSON
                       this.AccountNumberJSON[rec.Account_Name__c] = { "AccountNumber": rec.Account_Number__c };
   
                       // Check if category is already added
                       if (!uniqueCategories.has(rec.Type_of_Key__c)) {
                           uniqueCategories.add(rec.Type_of_Key__c); // Add to Set
                           // Push to typesOfcategoryOptions array
                           this.typesOfcategoryOptions.push({ label: rec.Type_of_Key__c, value: rec.Type_of_Key__c });
                       }
                   }
               });
   
               // Log the final 'typesOfcategoryOptions' array
               console.log('Unique typesOfcategoryOptions: ', JSON.stringify(this.typesOfcategoryOptions));
           } else if (error) {
               console.error('Error: ', error);
           }
       }
        @wire(getFinalAccountsdata, { startDate: '$startDate', endDate: '$endDate',orgName: '$orgName' })
        wiredAwardsForStaff(result) {
            this.wiredAccountsList = result;
        // console.log('staff: ', result); // Debugging line
        this.finalHtmlTable=[];
        this.FinalGroupWiseData=[];
            const { data, error } = result;
            if (data) {
            // console.log('staff data: ', JSON.stringify(data)); // Debugging line
                this.FinalGroupWiseData=data;
                let groupwiseCategoryList = new Map();
                this.FinalGroupWiseData.forEach(rec => {
                let recordCopy = { ...rec };
                recordCopy.Date__c = new Date(recordCopy.Date__c).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
    
                if (!groupwiseCategoryList.has(recordCopy.Category__c)) {
                    groupwiseCategoryList.set(recordCopy.Category__c, []);
                }
                groupwiseCategoryList.get(recordCopy.Category__c).push(recordCopy);
            });
        
                const transactionsByKeyArray = Array.from(groupwiseCategoryList.entries());
            console.log('Transactions by Category:', JSON.stringify(transactionsByKeyArray));   
            this.finalHtmlTable= transactionsByKeyArray.map(category => ({
                categoryName: category[0],
                records: category[1],
                totalAmount: category[1].reduce((total, record) => total + record.Amount__c, 2).toFixed(2) 
            }));
            console.log('groupwiseCategoryList:', JSON.stringify(this.finalHtmlTable));
                        
            } else if (error) {
                console.error('Error: ', error); // Debugging line
            }
        } 
        get categoryOptions() {
        return this.keyWordsList.map(key => ({
            label: key.Type_of_Key__c, 
            value: key.Type_of_Key__c
        }));
    }


    // handleCSVUpload(event) {
    //     const files = event.detail.files;
    //     //console.log("#### files = "+JSON.stringify(files));
    //     if (files.length > 0) {
    //         const file = files[0];

    //         // start reading the uploaded csv file
    //         this.read(file);
    //     }
    // }

    // async read(file) {
    //     try {
    //         const result = await this.load(file);
    //         //console.log("#### result = "+JSON.stringify(result));
    //         // execute the logic for parsing the uploaded csv file
    //         this.parseCSV(result);
    //     } catch (e) {
    //         this.error = e;
    //     }
    // }

    // async load(file) {
    //     return new Promise((resolve, reject) => {
    //         const reader = new FileReader();

    //         reader.onload = () => {
    //             //console.log("#### reader.result = "+JSON.stringify(reader.result));
    //             resolve(reader.result);
    //         };
    //         reader.onerror = () => {
    //             //console.log("#### reader.error = "+JSON.stringify(reader.error));
    //             reject(reader.error);
    //         };
    //         //console.log("#### file = "+JSON.stringify(file));
    //         reader.readAsText(file);
    //     });
    // }

    // parseCSV(csv) {
    //     this.records = [];
    //     this.rawData=[];
    //     this.finalData=[];
    //     const lines = csv.split(/\r\n|\n/);
    //     const defaultHeaders = ['Date', 'Amount', 'Description'];
    //     const firstLine = lines[0].split(',');
    //     const isHeaderPresent = defaultHeaders.every(header => firstLine.includes(header));
    //     const headers = isHeaderPresent ? firstLine : defaultHeaders;
    
    //     // Map headers to columns
    //     this.columns = defaultHeaders.map((header) => {
    //         switch (header) {
    //             case 'Date':
    //                 return { label: 'Date', fieldName: 'Date', initialWidth: 100, typeAttributes: { month: "2-digit", day: "2-digit", year: "numeric" } };
    //             case 'Amount':
    //                 return { label: 'Amount', fieldName: 'Amount', initialWidth: 100 };
    //             case 'Description':
    //                 return { label: 'Description', fieldName: 'Description', initialWidth: 470 };
    //             default:
    //                 return { label: defaultHeaders, fieldName: defaultHeaders };
    //         }
    //     });
    
    //     const data = [];
    //     let idCounter = 1;
    
    //     // Parse CSV and format into a usable data structure
    //     for (let i = isHeaderPresent ? 1 : 0; i < lines.length; i++) {
    //         const currentline = lines[i].split(',');
    //         const isEmpty = defaultHeaders.some((header, index) => {
    //             const value = currentline[index] ? currentline[index].trim() : '';
    //             return (header === "Date" || header === "Description" || header === "Amount") && !value;
    //         });
    
    //         if (!isEmpty) {
    //             const obj = {};
    //             for (let j = 0; j < defaultHeaders.length; j++) {
    //                 obj[defaultHeaders[j]] = currentline[j] || '';
    //             }
    //             obj.Id = 'row-' + idCounter++;
    //             data.push(obj);
    //         }
    //     }
    //         this.rawData=data;
    //         this.records = data;
    //     this.originalData = data;
    //     this.totalRecords = this.records.length;
    //     this.pageSize = this.pageSizeOptions[0];
    //     this.pageNumber = 1;
    //     this.paginationHelper(); 
    //     // this.paginationData();
    
    //     console.log('Remaining unfiltered transactions:', this.records);
    // }
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

    toggleSecondTableVisibility(){
        this.firsttable=!this.firsttable;
        this.isImportForms=!this.isImportForms;
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

    // JS function to handel pagination logic 
    paginationHelper() {
        this.data = [];
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


    previousPage1() {
        this.pageNumber1 = this.pageNumber1 - 1;
        this.paginationHelper1();
    }

    nextPage1() {
        this.pageNumber1 = this.pageNumber1 + 1;
        this.paginationHelper1();
    }

    firstPage1() {
        this.pageNumber1 = 1;
        this.paginationHelper1();
    }

    lastPage1() {
        this.pageNumber1 = this.totalPages1;
        this.paginationHelper1();
    }
    
    // handleBack(event){
    //     /*  this[NavigationMixin.Navigate]({
    //             type: 'comm__namedPage',
    //             attributes: {
                    
    //                 pageName: 'payroll'
    //             },
    //         }); */      
            
    //         this[NavigationMixin.Navigate]({
    //         type: 'comm__namedPage',
    //         attributes: {
    //             pageName: 'payroll',
    //         },
    //         state: {
    //             c__propertyValue: "reporting",
    //         },
    //     });  
    //     }

        

        @wire(CurrentPageReference)
    currentPageRef

        paginationHelper1() {
        this.finalData = [];
        // calculate total pages
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        // set page number 
        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber1 - 1) * this.pageSize1; i < this.pageNumber1 * this.pageSize1; i++) {
            if (i === this.totalRecords1) {
                break;
            }
            this.finalData.push(this.records1[i]);            
        }       
    }
    
    handleRowSelection(event) {
        // Combine existing selectedData with newly selected rows
        const newSelectedData = [...this.selectedData, ...event.detail.selectedRows];
        
        // Use a Map to remove duplicates based on unique Id
        const uniqueData = new Map();
        newSelectedData.forEach(item => uniqueData.set(item.Id, item));
        
        // Convert back to an array
        this.selectedData = Array.from(uniqueData.values());   
    }
    
    
    
    
@track createFlag=false;
    
    handleInsertChartOfAccount(){
        const selectedInsertData = this.template.querySelector('lightning-datatable[data-tabale="secondTable"]').getSelectedRows();
        if (selectedInsertData.length === 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'No records selected. Please select at least one record to create chart of Accounts.',
                    variant: 'error',
                })
            );
            return; 
        }
        
            const finalInsertData = selectedInsertData.map(item => {
                const { Date, ...rest } = item; 
                const dateArray = Date.split('-');
        
                return { dateofAccount: dateArray[2] + '-' + dateArray[1] + '-' + dateArray[0], ...rest };
            });

            console.log('selected data '+JSON.stringify(finalInsertData));
            insertAccounts({ AccountsJsonString: JSON.stringify(finalInsertData),orgName:this.orgName })
                .then(response => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'success',
                            message: 'Accounts created successfully.',
                            variant: 'success',
                        })
                    );
                })
                .catch(error => {
                    
                }); 
                const selectedIds = new Set(selectedInsertData.map(item => item.Id));
                this.finalData = this.finalData.filter(item => !selectedIds.has(item.Id)); 
                this.isImportForms=false;
                this.isChartOfAccounts=true;
                 this.isTitleAndBack= true;
                this.isBackToParent = true;
                this.records1 =  this.finalData;
            
                this.totalRecords1 = this.records1.length;
                this.pageSize1 = this.pageSizeOptions1[0];
                this.pageNumber1 = 1;
                this.paginationHelper1();
            }
    

        handleCategoryChange(event) {
        this.selectedCategory= event.target.value;
        if(this.selectedCategory){
            this.disableGo=false;
        }else{
            this.disableGo=true;
        }
        
    }
    
    HandleManualdata(){
        if(this.selectedCategory=='Manual'){
            this.openAccountform=true;
        }
        
    }

    @track AccountName;
    @track AccountNumber;
    @track Catgeory;
    handleChange(event) {
        const field = event.target.name;
    
        if (field === 'category') {
            this.Catgeory = event.target.value;
            this.AcountNameOptions = []; // Clear previous options
    
            if (this.keyWordsList && this.keyWordsList.length > 0) {
                this.keyWordsList.forEach(rec => {
                    if (rec.Type_of_Key__c === this.Catgeory && rec.Account_Name__c) {
                        this.AcountNameOptions.push({
                            label: rec.Account_Name__c,
                            value: rec.Account_Name__c
                        });
                    }
                });
            }
    
            console.log('Account Options:', JSON.stringify(this.AcountNameOptions));
        } else if (field === 'name') {
            this.AccountName = event.target.value;
            this.AccountNumber = this.AccountNumberJSON[this.AccountName]?.AccountNumber || '';
        }
    }
    
    HandleSaveAccounts() {
        // Get selected rows from the datatable
        // const selectedInsertData = this.template.querySelector('lightning-datatable[data-tabale="maintable"]').getSelectedRows();
       const selectedInsertData = this.data.filter(row => row.isSelected);
        console.log('Original data:', JSON.stringify(selectedInsertData));
    
        // Process and format each selected row
        selectedInsertData.forEach(item => {
            // Format date to DD-MM-YYYY
            let formattedDate = this.formatDate(item.Date);
    
            // Parse and clean up Amount field
            let amount = this.cleanAmount(item.Amount);
    
            // Append formatted data to finalData array
            this.finalData.push({
                AccountName: this.AccountName,
                AccountNumber: this.AccountNumber,
                Category: this.Catgeory,
                ...item,
                Date: formattedDate,
                Amount: amount,
                isSelected: false
            });
        });
        // Clone array to refresh UI
        this.finalData = [...this.finalData];
        console.log('Formatted Final data:', JSON.stringify(this.finalData));
    
        // Call paginationData function
        //this.paginationData();
        this.records1 = this.finalData;
        this.totalRecords1 = this.records1.length;
        this.pageSize1 = this.pageSizeOptions1[0];
        this.pageNumber1 = 1;
        this.paginationHelper1();
        this.openAccountform = false;
        //this.isDataEmpty = false;
        this.isAllSelected1 = false;
          this.data = this.data.map(row => ({ ...row, isSelected: false }));
    }
    
    formatDate(inputDate) {
        if (!inputDate) return '';
    
        // Check if input date is in DD/MM/YYYY or DD-MM-YYYY format
        const dateRegex1 = /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/;
        if (dateRegex1.test(inputDate)) {
            const [, day, month, year] = inputDate.match(dateRegex1);
            return `${day}-${month}-${year}`;
        }
    
        // Parse other date formats if needed (e.g., YYYY-MM-DD or timestamps)
        const parsedDate = new Date(inputDate);
        if (!isNaN(parsedDate)) {
            const day = String(parsedDate.getDate()).padStart(2, '0');
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const year = parsedDate.getFullYear();
            return `${day}-${month}-${year}`;
        }
    
        // If date is unrecognized, return as-is or handle error as needed
        return inputDate;
    }
    
    cleanAmount(inputAmount) {
        // Remove any quotes around the amount and convert to number
        if (typeof inputAmount === 'string') {
            // Remove leading and trailing quotes if present
            inputAmount = inputAmount.replace(/"/g, '');
        }
    
        // Convert to a number for consistency
        return parseFloat(inputAmount) || 0; // Default to 0 if parsing fails
    }
        
        handleInvoiceSaveDraft(event){
            const draftValues = event.detail.draftValues;
            //console.log('Draft values ' + JSON.stringify(draftValues));
        
            // Merge draft values with the existing ExpenseData
            this.finalData = this.mergeDraftValues(draftValues, this.finalData);
            this.finalData = [...this.finalData];
            // Clear draft values to close the popup
            this.template.querySelector('lightning-datatable[data-tabale="secondTable"]').draftValues = [];
        }
        mergeDraftValues(draftValues, originalData) {
            const updatedData = originalData.map(item => {
                const draftValue = draftValues.find(draft => draft.Id === item.Id);
                return draftValue ? { ...item, ...draftValue } : item;
            });
            return updatedData;
        }

        temp(){
            if(this.selectedCategory=='Automatic'){
                let matchingTransactionsIds = new Map();
                let processedTransactions = new Set(); 
                let remainingData = [...this.rawData]; // Copy the raw data
                // Initialize finalData to store categorized transactions

                // Loop through each keyword
                this.keyWordsList.forEach(key => {
                    const keyword = key.Key_Word__c.toLowerCase();

                    remainingData = remainingData.filter(transaction => {
                        const description = transaction.Description.toLowerCase();
                        
                        // Skip if the transaction has already been processed
                        if (processedTransactions.has(transaction.Id)) {
                            return true; // Keep transaction in remainingData
                        }

                        // If the transaction description includes the keyword, categorize it
                        if (description.includes(keyword)) {
                            if (!matchingTransactionsIds.has(key.Type_of_Key__c)) {
                                matchingTransactionsIds.set(key.Type_of_Key__c, []);
                            }

                            // Add the transaction to the matching category
                            const categorizedTransaction = {
                                Category: key.Type_of_Key__c,
                                ...transaction
                            };

                            matchingTransactionsIds.get(key.Type_of_Key__c).push(categorizedTransaction);

                            // Push the categorized transaction to finalData

                        
                            this.finalData.push(categorizedTransaction);
                            this.finalData=[...this.finalData];
                            // Mark the transaction as processed
                            processedTransactions.add(transaction.Id);

                            // Log for debugging
                            this.paginationData();

                            return false; // Remove the processed transaction from remainingData
                        }

                        // Keep this transaction in remainingData if no match
                        return true;
                    });
                });

                // Convert matching transactions map to an array (if needed)
            /*   const transactionsByKeyArray = Array.from(matchingTransactionsIds.entries());
                console.log('Transactions by Category:', JSON.stringify(transactionsByKeyArray));
        */
                // Final categorized data
            } 
        }
    paginationData(){
        
        const selectedIds = new Set( this.finalData.map(item => item.Id));
    
            
        const remainingData = this.rawData.filter(data => !selectedIds.has(data.Id));
        
        console.log('Remaining data'+JSON.stringify(remainingData));
        this.records = [...remainingData]; 
        
        // Update the total number of records and initialize pagination
        this.totalRecords = this.records.length;
        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;
        
        // Trigger the pagination helper to handle paginated view
        this.paginationHelper();
        
    }

    colseAccountForm(event){
        this.openAccountform=false;
    }
    HandleBackToImport(event){
        this.isImportForms=true;
        this.isChartOfAccounts=false;
        this.isTitleAndBack= true;
        this.isBackToParent = false;
    }
    handleGetChartOfAccounts(){
        this.finalHtmlTable=[];
        this.isChartOfAccounts=true;
        this.isImportForms=false;
        this.isTitleAndBack= true;
        this.isBackToParent = true;
    }
    
    chartOfAccountsDates(event){
        if(event.target.name=='input1'){
            this.startDate=event.target.value;
        }else if(event.target.name=='input2'){
            this.endDate=event.target.value;
        }
        console.log('start date '+this.startDate+'end date '+this.endDate);
        refreshApex(this.wiredAccountsList)
        
    }

    HandleOpenChartOfAccount(){
        try{
            // refreshApex(this.wiredKeyWords);

            this.ChartOfAccountFlag=true;
            this.isChartOfAccounts=false;
            
        }catch(error){
            console.log('error=>'+error);
        }
        
    }
    closeChartOfAccount(event){
    this.ChartOfAccountFlag=false;
    this.isChartOfAccounts=true;
    
    }  

    OpenChartOfRecordEditform(){
        this.openCHartForm=true;  
        this.chartId='';
    }
    handleeditClose(){
        this.openCHartForm=false;     
    }

    handleSubmit(){
        this.template.querySelector('lightning-record-edit-form').submit(fields);  
    }

    HandlChartOfSuccess(){
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully !!",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        this.openCHartForm = false;
        refreshApex(this.wiredKeyWords);
    }
    handleEdit(event){
        this.openCHartForm=true;
        this.chartId=event.currentTarget.dataset.id;
    }
    HandleDelete(event){
        deleteRecord(event.currentTarget.dataset.id).then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                title: 'Success',
                message: 'Key Word has been deleted',
                variant: 'success'
                })
            );
            refreshApex(this.wiredKeyWords);
            });
            
    }  
    handleBack(){
        const customEvent = new CustomEvent('myevent', {
            detail: { message: 'Reconciliation' }
        });
        this.dispatchEvent(customEvent);
        
    }
      triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }
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
    //  handleRadioSelection1(event) {
    //     const selectedId = event.target.dataset.id;
    //     const isChecked = event.target.checked;

    //     // Update the isSelected property of the row
    //     this.data = this.data.map(row => {
    //         if (row.Id === selectedId) {
    //             row.isSelected = isChecked;
    //         }
    //         return row;
    //     });

    //     // Check if all rows are selected, then update the master checkbox
    //     this.updateMasterCheckboxState1();
    // }


    // Handle the master checkbox (select all)
    // handleSelectAll1(event) {
    //     const isChecked = event.target.checked;

    //     // Set the isSelected property of all rows to the state of the master checkbox
    //     this.data = this.data.map(row => {
    //         row.isSelected = isChecked;
    //         return row;
    //     });

    //     // Update the master checkbox state
    //     this.isAllSelected1 = isChecked;
    // }
    handleSelectAll1(event) {
        const isChecked = event.target.checked;

        // Set the isSelected property of all rows in finalData
        this.finalData = this.finalData.map(row => {
            row.isSelected = isChecked;
            return row;
        });

        this.isAllSelected1 = isChecked;
    }
    handleRadioSelection1(event) {
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;

        // Update the isSelected property of the row in finalData
        this.finalData = this.finalData.map(row => {
            if (row.Id === selectedId) {
                row.isSelected = isChecked;
            }
            return row;
        });

        // Update the master checkbox state for the second table
        this.updateMasterCheckboxState1();
    }

    // Update the master checkbox state based on the individual selections
    updateMasterCheckboxState1() {
        const allSelected = this.finalData.every(row => row.isSelected);
        const noneSelected = this.finalData.every(row => !row.isSelected);

        if (allSelected) {
            this.isAllSelected1 = true;
        } else if (noneSelected) {
            this.isAllSelected1 = false;
        } else {
            this.isAllSelected1 = false; // or handle indeterminate if needed
        }
    }
    handleEditInvoice(event) {
        const recordId = event.currentTarget.dataset.id;

        // Make only the clicked row editable, others not
        this.finalData = this.finalData.map(row => {
            return {
                ...row,
                isEditable: row.Id === recordId // true for clicked row, false for others
            };
        });

        // Force UI to re-render
        this.finalData = [...this.finalData];
    }
    handleFieldChange(event) {
    const recordId = event.target.dataset.id;
    const field = event.target.dataset.field;
    const value = event.target.value;

    this.finalData = this.finalData.map(row => {
        if (row.Id === recordId) {
            return {
                ...row,
                [field]: value // only update the field
                // DO NOT change isEditable here!
            };
        }
        return row;
    });

    // Optional to trigger re-render
    this.finalData = [...this.finalData];

}
handleBlur(event) {
    const recordId = event.target.dataset.id;

    this.finalData = this.finalData.map(row => {
        if (row.Id === recordId) {
            return {
                ...row,
                isEditable: false // exit edit mode
            };
        }
        return row;
    });

    this.finalData = [...this.finalData]; // trigger re-render
}
}