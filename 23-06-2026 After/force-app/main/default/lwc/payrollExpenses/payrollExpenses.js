import { LightningElement, track, wire, api } from 'lwc';
import getFacilityData from '@salesforce/apex/PayrunSettingHandler.fetchFacilitiesByOrgId';
import getExpensesData from '@salesforce/apex/PayRollExpenseHandler.getExpensesData';
import { refreshApex } from '@salesforce/apex';
//import createExpensesAds from '@salesforce/apex/PayRollExpenseHandler.createExpensesAds';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import EXPENSES_OBJECT from '@salesforce/schema/Expenses__c';
import TYPEOFEXPENSES_FIELD from '@salesforce/schema/Expenses__c.Type_of_Expense__c';
import SUBTYPE_FIELD from '@salesforce/schema/Expenses__c.Sub_type__c';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import { loadScript } from 'lightning/platformResourceLoader';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import deleteRepository from '@salesforce/apex/PayRollExpenseHandler.deleteRepository';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import saveFile from '@salesforce/apex/PayRollExpenseHandler.saveFile';
import Id from '@salesforce/user/Id'; getExpenses
import getExpenses from '@salesforce/apex/PayRollExpenseHandler.getExpenses';

//import USER_Object from '@salesforce/schema/User';
//import USER_NAMES from '@salesforce/schema/User.Name';

export default class PayrollExpenses extends LightningElement {
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    

    @api recordId = "";
    @track facilityOptions;
    @track facilityList;
    @track selectedValue;
    @track dateValueData;
    @track selectedValueName;
    @track expensesAmount;
    @track recentEmpData = [];
    @track refreshTable = [];
    @track staffexpensesData;
    @track staffexpensesNoData;
    @track addExpenses = false;
    //Create Expense track fields
    @track amount;
    @track date;
    @track comments;
    @track subType;
    @track typeofExpense;
    @track typeofexpensesPicklistValues;
    @track suptypePicklistValues;
    @track chartJSLoaded;
    @track chart;
    @track openExpenses = false;
    
    @track startdateValueData;
    @track enddateValueData;
    @track gst;
    @track isEdit=false;
    @track recordId;
    @track facilityId;
    @track isVisible=false;
    @track fileName;
    @track showSpinner = false;
    @track addImport=false;
    @track isDescription;
    @track csvFileName;
    @api recordid;
    @track data;
    @track fileName = '';
    @track UploadFile = 'Upload CSV File';
    @track showLoadingSpinner = false;
    @track isTrue = false;
    @track selectedRecords;
    @track filesUploaded = [];
    //file;
    @track fileContents;
    @track fileReader;
    @track content;
    MAX_FILE_SIZE = 1500000;
    @track userId = Id;
    @track typeofExpense;
    @track subType;
    @track code;
    @track taxCode;
    @track description;
    @track enablePayment;
    @track expenseClaim;
    
    employee = My_Resource + '/myResource/images/expenses.svg';


    get isDesktop() {        
        return FORM_FACTOR === 'Large';
       
    }
    
    get isMobile() {       
        return FORM_FACTOR === 'Small';
    }

    @api reload() {
        this.addExpenses = false;
    }


    @wire(getObjectInfo, { objectApiName: EXPENSES_OBJECT })
    objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: TYPEOFEXPENSES_FIELD })
    typeofexpensesPicklistValues;

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: SUBTYPE_FIELD })
    suptypePicklistValues;      
   
    connectedCallback() {        
        getFacilityData().then(response => {
            this.facilityList = response;
            this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }))          

        }).catch(err => {
           
        });

        //Dates
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        /* var last = new Date(new Date().getFullYear(), new Date().getMonth(), 9);
        this.edate = last.toISOString().slice(0, 10); */

        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.edate = last.toISOString().slice(0, 10);
        this.startdateValueData = this.sdate;
        this.enddateValueData = this.edate;
       // console.log('Start Date >>'+this.sdate);
       // console.log('End Date >>>'+this.edate);

        let tempConList = [];
        //this.records=[];
        getExpensesData({ staffId: this.selectedValue,startDate:this.startdateValueData,endDate:this.enddateValueData }).then(response => {
           // console.log('calling expenses Data1'); 

           // console.log('response>>>: '+JSON.stringify(response));
            if (response != null) {                
                response.forEach(record => {
                    let tempRec = Object.assign({}, record);
                    tempRec.paymentDate = new Date(tempRec.Date__c).toLocaleDateString('en-GB');
                    tempRec.Name = '/' + tempRec.Id;
                    tempRec.incgst = tempRec.Incl_GST__c;
                    if(tempRec.Type_of_Expense__c == 'Other'){
                        tempRec.description = tempRec.Description__c;
                    } else{
                        tempRec.description = tempRec.Sub_type__c;
                    }
                    expAmount = expAmount + tempRec.Amount__c;                
                    tempConList.push(tempRec);
                   // console.log('tempConList '+ JSON.stringify(tempConList));
                })            
                this.recentEmpData = tempConList;
               // console.log('RecentEmpData>>>'+JSON.stringify(this.recentEmpData));                
            }
        })
    }

    @track errorMessage = '';
    handleChange(event) {
       
        let value = event.detail.value;
        if (event.target.name == 'Facility') {
             this.facilityId=event.detail.value;
             this.isVisible=true;
            this.selectedValue = event.detail.value;
        }
        if (event.target.name == 'startdateValueData') {
            this.startdateValueData = event.detail.value;
            this.validateDates();
        }
        if (event.target.name == 'enddateValueData') {
            this.enddateValueData = event.detail.value;
            this.validateDates();
        }
        this.facilityOptions.forEach(record => {
            let tempRec = Object.assign({}, record);
            if (tempRec.value == this.selectedValue) {
                this.selectedValueName = tempRec.label;
            }
        });
       // console.log('this.StartdateValueData '+this.startdateValueData);
       // console.log('this.enddateValueData '+this.enddateValueData);
       // console.log('this.selectedValue '+this.selectedValue);
       // console.log('this.selectedValueName '+this.selectedValueName);
        this.expensesData();
    }

    validateDates() {
        if (this.startdateValueData && this.enddateValueData) {
            if (new Date(this.enddateValueData) < new Date(this.startdateValueData)) {
                this.errorMessage = 'End date cannot be before start date';
            } else {
                this.errorMessage = '';
            }
        }
    }
    
    changeExpense(event){        
        
        if(event.target.name=='typeofExpense'){
            this.typeofExpense=event.target.value; 
            console.log('222 type of expense >>>'+this.typeofExpense); 
        }
        
        if( this.typeofExpense !=null){ 
            console.log(' 226 Type of Expensse ' + this.typeofExpense);
            
            getExpenses({typeofExpense: this.typeofExpense }).then(result=>{

                console.log('Shad awards list '+JSON.stringify(result));
                if(result.length>0){
                    this.subType=result[0].Sub_Type__c;
                    this.code=result[0].Code__c;
                    this.taxCode=result[0].Tax_Code__c;
                    this.description=result[0].Description__c;
                    this.enablePayment=result[0].Enable_Payments__c;
                    this.expenseClaim=result[0].Expense_Claims__c;
                }else{
                    
                }
               
            });
        }
    }

    expensesData() {
        let tempConList = [];
        var expAmount = 0;
       // console.log('calling expenses Data');
        
        getExpensesData({ staffId: this.selectedValue,startDate:this.startdateValueData,endDate:this.enddateValueData }).then(response => {
           // console.log('calling expenses Data1');
            if (response != null) {      
                response.forEach(record => {
                    let tempRec = Object.assign({}, record);
                    tempRec.paymentDate = new Date(tempRec.Date__c).toLocaleDateString('en-GB');
                    tempRec.Name = '/' + tempRec.Id;
                    tempRec.incgst = tempRec.Incl_GST__c.toFixed(2);
                    tempRec.amount = tempRec.Amount__c.toFixed(2);
                    /* if(tempRec.Type_of_Expense__c == 'Other'){
                        tempRec.description = tempRec.Description__c;
                    } else{
                        tempRec.description = tempRec.Sub_type__c; 
                    } */
                    tempRec.description = tempRec.Description__c;
                    expAmount = expAmount + tempRec.Amount__c;                
                    tempConList.push(tempRec);
                   // console.log('tempConList '+ JSON.stringify(tempConList));
                });
                this.expensesAmount = expAmount;
               // console.log('Exp Amount >>>>'+this.expensesAmount);
                this.recentEmpData = tempConList;
                this.refreshTable = this.recentEmpData;
                refreshApex(this.recentEmpData);

                this.records = response;              
                this.totalRecords = response.length; // update total records count                 
                this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                this.pageNumber = 1;
                this.paginationHelper();

                if (this.recentEmpData.length > 0) {
                    this.staffexpensesData = true;
                    this.staffexpensesNoData = false;
                } else {
                    this.staffexpensesData = false;
                    this.staffexpensesNoData = true;
                }
               // console.log('this.recentEmpData ', this.recentEmpData.length);
            }
        }).catch(err => {
           // console.log('Oh noooo!!');
           // console.log(err);
            //alert(err);
        });
    }

    RefreshExpensesData(event)
    {
        this.expensesData();        
    }

    handleaddExpenses() {

        if (this.selectedValue == undefined ) {
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Please select the Facility',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);

        } else {
            this.addExpenses = true;
            this.openExpenses = true;
            this.isModalOpen = false;
            this.recordId ='';
            this.fileName ='';
            this.subType = '';
            this.code = '';
            this.expenseClaim = '';
            this.description = '';
            this.enablePayment = '';
        }
       // console.log('this.addExpenses ',this.addExpenses);
    }
    closeaddExpenses() {
        this.addExpenses = false;
        this.openExpenses = false;
    }

    handleChangeAd(event) {
        let value = event.detail.value;
        if (event.target.name == 'amount') {
            this.amount = event.detail.value;
        }
        if (event.target.name == 'gst') {
            this.gst = event.detail.value;
        }
        if (event.target.name == 'date') {
            this.date = event.detail.value;
        }
        if (event.target.name == 'comments') {
            this.comments = event.detail.value;
        }
        if (event.target.name == 'subType') {
            this.subType = event.detail.value;
        }
        if (event.target.name == 'typeofExpense') {
            this.typeofExpense = event.detail.value;
        }

    }

    onFileUpload(event) {        
        //this.isEdit=false;        
       // console.log('in files upload',event.target.files.length);
        if (event.target.files.length > 0) {
            this.showSpinner = true;
            this.selectedFilesToUpload = event.target.files;      
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;     
            
            if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
                this.isattachError=true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {        
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
                //read the file chunkwise
                let sliceSize = 1024;           
                let byteCharacters = atob(fileContents);
                let bytesLength = byteCharacters.length;
                let slicesCount = Math.ceil(bytesLength / sliceSize);                
                let byteArrays = new Array(slicesCount);
                for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    let begin = sliceIndex * sliceSize;
                    let end = Math.min(begin + sliceSize, bytesLength);                    
                    let bytes = new Array(end - begin);
                    for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);         
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
                
                //from arraybuffer create a File instance
                this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        this.showSpinner = false;
       // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
       // console.log('FileName>>>>'+this.fileName);
    }  
   
    handleSubmit(event){        
       
       // console.log('onsubmit event recordEditForm'+ event.detail.fields);
       // console.log('file chk>>',this.isFileAttached);
        const fields=event.detail.fields;
       // console.log('fields>>',fields);
       
         event.preventDefault();
        this.template.querySelector('lightning-record-edit-form').submit(fields);
      
        this.isEdit=false;
        // refreshApex(this.expensesData());
    }   

    handleSuccess(event){
        //alert('handleSuccess >>>> '+ this.isEdit);
        this.recordId=event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully !!',
                variant: 'success',
            }),
        ); 
       // console.log(this.isEdit);
       // console.log('base64>> ',this.base64FileData);       
       // console.log('in is edit false'+this.isEdit);
        //this.isEdit = true;
        this.showSpinner = true;
        //console.log('isEdit >>'+ this.isEdit);
        //Uploading files to AWS S3 bucket
        //if(this.base64FileData){
            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId: this.recordId,obj:'expense'})
            .then(result => {
               // console.log('Upload result = ' +result);
                this.fileName = this.fileName + ' - Uploaded Successfully';
                //call to show uploaded files        
                //this.fetchReplist();
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.file.name + ' - Uploaded Successfully!!!',
                        variant: 'success',
                    }),
                );
            })
            /*.catch(error => {
                // Error to show during upload
                window.console.log(error);
                this.dispatchEvent(s
                    new ShowToastEvent({
                        title: 'Error in AWS uploading File',
                        message: error.message,
                        variant: 'error',
                    }),
                );
                this.showSpinner = false;
            });  */          
        //}
       // this.expensesData();
        this.addExpenses = false;   
        this.openExpenses = false ;       
        this.isEdit=false;        
        this.showSpinner = false;   
        this.expensesData();
    }


    buildChart() {
        let valueData = [];
        let canvas = this.template.querySelector("canvas");
        let context = canvas.getContext("2d");
        let valuelabel = [];

        this.recentEmpData.forEach(record => {
            valueData.push(record.Type_of_Expense__c);
            valuelabel.push(record.Amount__c);
           // console.log("valueData>>>",JSON.stringify(valueData));
           // console.log("valuelabel>>>",JSON.stringify(valuelabel));
        })
        this.chart = new window.Chart(context, {
            type: "pie",
            data: {
                labels: valueData,
                datasets: [
                    {
                        label: "# of Votes",
                        data: valuelabel,
                        backgroundColor: [
                            "rgba(0, 225, 0, 1)",
                            "rgba(250, 250, 0, 1)",
                            "rgba(255, 99, 71, 1)",
                            "rgba(70, 130, 180, 1)",
                            "rgba(128, 128, 128, 1)",
                            "rgba(0, 255, 255, 1)",
                            "rgba(245,42 , 145, 1)",
                            "rgba(128,0 , 128, 0.7)",
                            "rgba(126,78 , 67, 0.7)",
                            "rgba(195,155 , 211, 0.7)",
                            "rgba(0,0 , 0, 0.7)",
                            "rgba(204,204 ,255,1)"
                        ],
                        borderColor: [
                            "rgba(0, 225, 0, 1)",
                            "rgba(250, 250, 0, 1)",
                            "rgba(255, 99, 71, 1)",
                            "rgba(70, 130, 180, 1)",
                            "rgba(128, 128, 128, 1)",
                            "rgba(0, 255, 255, 1)",
                            "rgba(245,42 , 145, 1)",
                            "rgba(128,0 , 128, 1)",
                            "rgba(126,78 , 67, 1)",
                            "rgba(195,155 , 211, 0.7)",
                            "rgba(0,0 , 0, 0.7)",
                            "rgba(204,204 ,255,1)"
                        ],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                legend: {
                    position: 'right'
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    constructor() {
        super();
        this.chartJSLoaded = false;
    }

    renderedCallback() {
        loadScript(this, ChartJS)
            .then(() => {
               // console.log("rendered", this.chartJSLoaded);
                this.chartJSLoaded = true;
                this.buildChart();
                  // this.expensesData();
            })
            .catch((error) => {

            });
    }

    hideModalBox(){
        this.addExpenses=false; 
        this.openExpenses = false;
        this.isEdit=false;  
        this.isFileAttached=false; 
        this.addImport=false;     
    }

    hanldeEdit(event)
    {        
        this.isEdit=true;
        this.addExpenses = true;
        this.openExpenses = false;
        this.isModalOpen = false;
        //this.isFileAttached=false;
        this.recordId = event.currentTarget.dataset.id;
       // console.log('Edit', this.recordId);
        this.fileName='';          
        this.expensesData(); 
        refreshApex(this.expensesData());     
    }

    handleDelete(event)
    {        
        this.recordId = event.currentTarget.dataset.id;
       // console.log('Delete', this.recordId);        
        this.delRep(this.recordId);  
        this.expensesData();
        refreshApex(this.expensesData());  
    }
    delRep(currentRow) {    
        deleteRepository({ repData: currentRow }).then(result => {
           // window.console.log('result^^' + result);
            //this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!!',
                message: 'Payroll Expense deleted Successfully.',
                variant: 'success'
            }));            
        }).catch(error => {
           // window.console.log('Error ====> ' + error);
           // this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!',
                message: JSON.stringify(error),
                variant: 'error'
            }));            
        });    
    } 
    
    //Import CSV File Code implemented by maheswari
    handleImport(){
        if (this.selectedValue == undefined ) {
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Please select the Facility',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);

        } else {
            this.addImport = true;
            this.fileName='';
        }         
    }       
    
    handleFilesChange(event) {
        if (event.target.files.length > 0) {        
            this.filesUploaded = event.target.files;        
            this.fileName = this.filesUploaded[0].name;        
        }        
    }
        
    handleSave() {        
        if (this.filesUploaded.length > 0) {        
            this.uploadFile();      
        } else {        
            this.fileName = 'Please select a CSV file to upload!!';        
        }        
    }
        
    uploadFile() {        
        if (this.filesUploaded[0].size > this.MAX_FILE_SIZE) {        
           // console.log('File Size is too large');        
            return;        
        }        
        this.showLoadingSpinner = true;        
        this.fileReader = new FileReader();        
        this.fileReader.onloadend = () => {        
        this.fileContents = this.fileReader.result;                
        this.saveFile();        
        }        
        this.fileReader.readAsText(this.filesUploaded[0]);        
    }
        
    saveFile() {             
        try {  
        // console.log('File Contents>>>>'+JSON.stringify(this.fileContents));      
        saveFile({ selectedValue:this.selectedValue, base64Data: JSON.stringify(this.fileContents), cdbId: this.recordid })        
        .then(result => {        
            if (result === null || result.length === 0) {        
                this.dispatchEvent(        
                new ShowToastEvent({        
                title: 'Warning',        
                message: 'The CSV file does not contain any data',        
                variant: 'warning',        
                }),        
                );        
            } else {        
                this.data = result;        
                this.fileName = this.fileName + ' - Uploaded Successfully';        
                this.isTrue = false;        
                this.showLoadingSpinner = false;        
                this.dispatchEvent(        
                    new ShowToastEvent({        
                        title: 'Success!!',        
                        message: this.filesUploaded[0].name + ' - Uploaded Successfully!!!',        
                        variant: 'success',        
                        }),        
                    );
                    this.addImport= false;      
                }        
            })        
        .catch(error => {        
            console.error(error);        
            this.showLoadingSpinner = false;        
                this.dispatchEvent(        
                    new ShowToastEvent({        
                    title: 'Error while uploading File',        
                    message: error.message,        
                    variant: 'error',        
                    }),        
                );        
            });        
            } catch (error) {        
            console.error(error);        
            this.showLoadingSpinner = false;        
            this.dispatchEvent(        
            new ShowToastEvent({        
                title: 'Error',        
                message: 'An unexpected error occurred.',        
                variant: 'error',        
                }),        
            );        
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

    @track Listofdata_Pagination = [];
    // JS function to handel pagination logic 
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
            tempConRec.dateIssued = new Date(tempConRec.Date__c).toLocaleDateString('en-GB');
            tempConRec.gst = tempConRec.Incl_GST__c.toFixed(2);
            tempConRec.amount = tempConRec.Amount__c.toFixed(2);
            tempConRec.amazonUrl = tempConRec.Amazon_URL__c;
            tempConRec.typeofExpense = tempConRec.Type_of_Expense__c; 
            tempConRec.description = tempConRec.Description__c; 
            tempConRec.userName  = tempConRec.User_Name__c;
            tempconList.push(tempConRec);           
        }
        refreshApex(tempconList);
       // console.log("Pagination : "+ JSON.stringify(tempconList));
        this.Listofdata_Pagination = tempconList;

    }

    /* @track expensesHeader = ['Date (yyyy-mm-dd)', 'Description', 'Amount' ];
    handleDownloadExpense(){
        let doc = '<table>';

        // Add styles for the table
        doc += '<style>';
        doc += 'table, th, td {';
        doc += '    border: 1px solid black;';
        doc += '    border-collapse: collapse;';
        doc += '}';
        doc += '</style>'; 
       
        doc += '<tr>';
        this.expensesHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';
        doc += '</table>';

        var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(doc);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        // use .csv or .xls as extension on below line if you want to export data
        downloadElement.download = 'DownloadExpenseFormat.xls';
        document.body.appendChild(downloadElement);
        downloadElement.click();

    } */

    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        this.addExpenses = true;
        this.isEdit = false;
        this.openExpenses = false;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        const fileType = this.getFileType(this.currentUrl);
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
            setTimeout(() => {
                this.closeModal();
            }, 1700);
            
        }  
    }
    handleBack(){
        this.currentUrl = '';
        this.addExpenses = false;
        this.isEdit = false;
        this.openExpenses = false;
        this.isModalOpen = false;
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}