import { LightningElement , track, wire,api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import insertExpenses from '@salesforce/apex/PayRollExpenseHandler.insertExpenses';
import insertInvoices from '@salesforce/apex/PayRollExpenseHandler.insertInvoices';
import LightningConfirm from 'lightning/confirm';
import saveSearchKey from '@salesforce/apex/PayRollExpenseHandler.saveSearchKey';
import getSearchKeys from '@salesforce/apex/PayRollExpenseHandler.getSearchKeys';

export default class ImportExpenseInvoiceCSV extends NavigationMixin(LightningElement) {

  @track  columns =[
        /* {   label: 'Id',initialWidth: 75, 
            fieldName: 'Id' 
        }, */
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
       label: 'Date',
       fieldName: 'Date' ,  initialWidth: 100 , 
        typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}       
       },
       {            
           label: 'Amount',
           fieldName: 'Amount',  initialWidth: 100,
         
       },
       {            
           label: 'Description',
           fieldName: 'Description',  initialWidth: 150
       },
       {
        label: 'Include GST',
        fieldName:'IncludeGST',
        type: 'boolean', 
        editable: true,
        },
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
    @track filteredSearchResults = [];
    @track searchKey = '';
    @track confirmAction = '';
    @track options = [];
    @wire(getSearchKeys)
    wiredSearchKeys({ error, data }) {
        if (data) {
            if (data.trim()) {
                const keywords = new Set(data.split(' '));
                this.options = [...keywords].map(key => {
                    return { label: key, value: key };
                });
            } else {
                this.options = [{ label: 'No search keys found', value: 'no_search_keys' }];
            }
        } else if (error) {
            this.options = [{ label: 'No search keys found', value: 'no_search_keys' }];
            //console.error('Error fetching search keys: ', error);
        }
       // console.log('option '+JSON.stringify(this.options));
    }

    handleCSVUpload(event) {
        const files = event.detail.files;
        //console.log("#### files = "+JSON.stringify(files));
        if (files.length > 0) {
            const file = files[0];

            // start reading the uploaded csv file
            this.read(file);
        }
    }

    async read(file) {
        try {
            const result = await this.load(file);
            //console.log("#### result = "+JSON.stringify(result));
            // execute the logic for parsing the uploaded csv file
            this.parseCSV(result);
        } catch (e) {
            this.error = e;
        }
    }

    async load(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                //console.log("#### reader.result = "+JSON.stringify(reader.result));
                resolve(reader.result);
            };
            reader.onerror = () => {
                //console.log("#### reader.error = "+JSON.stringify(reader.error));
                reject(reader.error);
            };
            //console.log("#### file = "+JSON.stringify(file));
            reader.readAsText(file);
        });
    }

    parseCSV(csv) {
        this.records=[];
        // parse the csv file and treat each line as one item of an array
        const lines = csv.split(/\r\n|\n/);
        //console.log("#### lines = "+JSON.stringify(lines));
        // parse the first line containing the csv column headers
        const defaultHeaders = ['Date', 'Amount', 'Description'];
        const firstLine = lines[0].split(',');
        const isHeaderPresent = defaultHeaders.every(header => firstLine.includes(header));
    
        // If headers are present, use them; otherwise, use default headers
        const headers = isHeaderPresent ? firstLine : defaultHeaders;

       // console.log("#### headers = "+JSON.stringify(headers));
        // iterate through csv headers and transform them to column format supported by the datatable
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
         // return { label: header, fieldName: header };
        }); 
       //console.log("#### this.columns = "+JSON.stringify(this.columns));
        const data = [];
        let idCounter = 1; // Start ID counter
        // iterate through csv file rows and transform them to format supported by the datatable
        for (let i = isHeaderPresent ? 1 : 0; i < lines.length; i++) {
            const currentline = lines[i].split(',');
    
            // Check if any of the required fields ("Date", "Description", "Amount") are empty
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
    
        // Assign the converted csv data for the lightning datatable
        this.records = data;
        this.originalData = data;
        this.totalRecords = this.records.length;
        this.pageSize = this.pageSizeOptions[0];
        this.pageNumber = 1;
        this.paginationHelper();
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
  
    handleBack(event){
        this[NavigationMixin.Navigate]({
             type: 'comm__namedPage',
             attributes: {
                 
                 pageName: 'payroll'
             },
         }); 
       
     }
     handleClear(event){
        if(event.target.name=='totalTable'){
            this.data=[];
            this.selectedData=[];
        }
        if(event.target.name=='expenseTable'){
            this.ExpenseData=[];
        }
        if(event.target.name=='invoiceTable'){
            this.InvoiceData=[];
        }
       
     }
     
     async handleMove(event) {
        this.confirmAction = event.target.name;
        if (this.searchKey) {
            const result = await LightningConfirm.open({
                message: 'Do you want to save the search key?',
                variant: 'header',
                label: 'Please Confirm',
                theme: 'warning',
            });

            if (result) {
                await this.saveSearchKeyToApex(this.searchKey);
            }
        }

        this.moveDataTo(this.confirmAction);
    }

    async saveSearchKeyToApex(searchKey) {
        try {
            await saveSearchKey({ searchKey: searchKey });
           // console.log('Search key saved successfully.');
        } catch (error) {
           // console.error('Error saving search key: ', error);
        }
    }
 
    moveDataTo(type) {
        const newData = [];

        // Move filtered search results to the respective data array
        if (this.filteredSearchResults.length > 0) {
           // console.log(`handle filtered ${type} search results ` + JSON.stringify(this.filteredSearchResults));
            const filteredData = this.filteredSearchResults.map(value => {
                return { ...value, IncludeGST: true };
            });
            newData.push(...filteredData);
            // Remove moved data from originalData
            const filteredIds = new Set(this.filteredSearchResults.map(item => item.Id));
            this.originalData = this.originalData.filter(item => !filteredIds.has(item.Id));
        }

        // Move selected data to the respective data array
        if (this.selectedData.length > 0) {
           // console.log(`handle selected ${type} data ` + JSON.stringify(this.selectedData));
            const selectedData = this.selectedData.map(value => {
                return { ...value, IncludeGST: true };
            });
            newData.push(...selectedData);
            // Remove moved data from originalData
            const selectedIds = new Set(this.selectedData.map(item => item.Id));
            this.originalData = this.originalData.filter(item => !selectedIds.has(item.Id));
        }

        // Remove duplicates from newData
        const uniqueData = new Map();
        newData.forEach(item => uniqueData.set(item.Id, item));
        const finalData = Array.from(uniqueData.values());

        if (type === 'expenses') {
            this.ExpenseData = [...this.ExpenseData, ...finalData];
        } else if (type === 'invoices') {
            this.InvoiceData = [...this.InvoiceData, ...finalData];
        }

       // console.log(`updated original data after move ` + JSON.stringify(this.originalData));

        // Clear filtered search results and selected data
        this.filteredSearchResults = [];
        this.selectedData = [];

        this.records = this.originalData;
        this.totalRecords = this.records.length;
        this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
        this.pageNumber = 1;
        this.paginationHelper();
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
    
    handlesearch(event) {
        let dividesearch=[];
        let dropDown;
        //console.log('name 1 '+event.target.value)
        if(event.target.name=='enter-search'){
           // console.log('name 2 '+event.target.value)
            this.searchKey = event.target.value.toLowerCase().trim(); // Trim leading and trailing spaces
            dividesearch =this.searchKey.split(' ').filter(keyword => keyword.length > 0); // Filter out any empty strings
        }
        if(event.target.name=='dropDown'){
           // console.log('name 3 '+event.target.value)
            dropDown = event.target.value.toLowerCase().trim(); // Trim leading and trailing spaces
            dividesearch =dropDown.split(' ').filter(keyword => keyword.length > 0); // Filter out any empty strings
        }
        
        //console.log('divide search '+dividesearch);
        if (this.searchKey ||dropDown) {
         
            this.filteredSearchResults = this.originalData.filter(rec => {
                if (rec.Description) {
                    // Check if at least one keyword in dividesearch is included in rec.Description
                    return dividesearch.some(keyword => rec.Description.toLowerCase().includes(keyword));
                }
                return false;
            });
    
           // console.log("#### filtered data = " + JSON.stringify(this.filteredSearchResults));
        } else {
            this.filteredSearchResults = [];
            this.records = [...this.originalData];  // Reset to original data if search key is empty
           // console.log("#### reset data = " + JSON.stringify(this.originalData));
        }
    
        this.records = this.filteredSearchResults.length > 0 ? this.filteredSearchResults : this.originalData;
        this.totalRecords = this.records.length;
        this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
        this.pageNumber = 1;
        this.paginationHelper(); // call helper method to update pagination logic
    }
    
    

    handleSaveDraft(event) {
        const draftValues = event.detail.draftValues;
        //console.log('Draft values ' + JSON.stringify(draftValues));
    
        // Merge draft values with the existing ExpenseData
        this.ExpenseData = this.mergeDraftValues(draftValues, this.ExpenseData);
      
        // Clear draft values to close the popup
        this.template.querySelector('lightning-datatable[data-tabale="expenseTable"]').draftValues = [];
    }

    async handleinsertExpenseData() {

        const selectedExpenseData = this.template.querySelector('lightning-datatable[data-tabale="expenseTable"]').getSelectedRows();
        
        if (selectedExpenseData.length === 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'No records selected. Please select at least one record to create Expenses.',
                    variant: 'error',
                })
            );
            return; // Exit the function if no rows are selected
        }
        const result = await LightningConfirm.open({
            message: 'Are you sure to create Expenses?',
            variant: 'header',
            label: 'Please Confirm',
            theme: 'Warning',
        });
        
        if (result) {
          //  const selectedExpenseData = this.template.querySelector('lightning-datatable[data-tabale="expenseTable"]').getSelectedRows();
            const finalExpenseData = selectedExpenseData.map(item => {
                const { Date, ...rest } = item; 
                const dateArray = Date.split('-');
        
                return { DateOfIssue: dateArray[2] + '-' + dateArray[1] + '-' + dateArray[0], ...rest };
            });
            insertExpenses({ expenseJson: JSON.stringify(finalExpenseData) })
                .then(response => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'success',
                            message: 'Expenses created successfully.',
                            variant: 'success',
                        })
                    );
                })
                .catch(error => {
                    //console.log('error ' + error);
                }); 
                const selectedIds = new Set(selectedExpenseData.map(item => item.Id));
                this.ExpenseData = this.ExpenseData.filter(item => !selectedIds.has(item.Id));
                //console.log('final  expense ' + JSON.stringify(this.ExpenseData));
        }
    }
    
    handleInvoiceSaveDraft(event){
        const draftValues = event.detail.draftValues;
        //console.log('Draft values ' + JSON.stringify(draftValues));
    
        // Merge draft values with the existing ExpenseData
        this.InvoiceData = this.mergeDraftValues(draftValues, this.InvoiceData);
      
        // Clear draft values to close the popup
        this.template.querySelector('lightning-datatable[data-tabale="invoiceTable"]').draftValues = [];
    }

    async handleinsertInvoiceData(){
        const selectedInsertData = this.template.querySelector('lightning-datatable[data-tabale="invoiceTable"]').getSelectedRows();
        if (selectedInsertData.length === 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'No records selected. Please select at least one record to create Invoices.',
                    variant: 'error',
                })
            );
            return; // Exit the function if no rows are selected
        }

        const result = await LightningConfirm.open({
            message: 'Are you sure to create Invoices?',
            variant: 'header',
            label: 'Please Confirm',
            theme: 'Warning',
        });
        
        if (result) {
           // const selectedExpenseData = this.template.querySelector('lightning-datatable[data-tabale="invoiceTable"]').getSelectedRows();
            const finalInsertData = selectedInsertData.map(item => {
                const { Date, ...rest } = item; 
                const dateArray = Date.split('-');
        
                return { DateOfIssue: dateArray[2] + '-' + dateArray[1] + '-' + dateArray[0], ...rest };
            });
           // console.log('final data '+JSON.stringify(finalInsertData));
               insertInvoices({ expenseJson: JSON.stringify(finalInsertData) })
                .then(response => {
                    //console.log('Insert successful', response);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'success',
                            message: 'Invoices created successfully.',
                            variant: 'success',
                        })
                    );
                })
                .catch(error => {
                   // console.log('error ' + error);
                }); 
                const selectedIds = new Set(selectedInsertData.map(item => item.Id));
                this.InvoiceData = this.InvoiceData.filter(item => !selectedIds.has(item.Id));
               // console.log('final  invoice1 ' + JSON.stringify(this.InvoiceData));
            }
        }

     mergeDraftValues(draftValues, originalData) {
        const updatedData = originalData.map(item => {
          const draftValue = draftValues.find(draft => draft.Id === item.Id);
          return draftValue ? { ...item, ...draftValue } : item;
        });
        return updatedData;
      }
}