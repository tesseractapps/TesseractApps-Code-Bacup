import { LightningElement,track } from 'lwc';
import getLeads from '@salesforce/apex/issueRegisterSearch.getLeads';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { NavigationMixin } from 'lightning/navigation';


export default class TesseractSales extends NavigationMixin(LightningElement) {
    @track leads=[];
    @track availableIssues=[];
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track headeringName;
    @track records =[];
    @track isOpenModal = false;
    @track selectedFilesToUpload;
    @track fileName = '';
    @track showLoadingSpinner = false;
   // @track UploadFile = 'Upload CSV File';
    @track filesUploaded = [];
    @track fileContents;
    MAX_FILE_SIZE = 1500000;
    @track fileType;
    @track fileSize;
    @track showSpinner;
    @track fileReaderObj;
    @track myFile;
    @track status;
    @track recordId;
    @track noRecordsFlag = false;
    @track sortBy;
    @track sortDirection = 'asc';
    @track isHome=true;

    connectedCallback(){

        this.fetchLeads();    
    }


    fetchLeads() {
        this.records = [];
        let tempconList = [];    
        getLeads()
            .then(response => {
                if (response && response.length > 0) {
                    response.forEach(record => {
                        let tempConRec = Object.assign({}, record);
                        tempConRec.Id = tempConRec.Id;
                        tempConRec.name = tempConRec.Name;
                        tempConRec.companyName = tempConRec.Company;
                        tempConRec.status = tempConRec.Status;
                        tempConRec.planStartDate = tempConRec.Plan_Start_Date__c ? new Date(tempConRec.Plan_Start_Date__c).toLocaleDateString('en-GB') : '';
                        tempConRec.planEndDate = tempConRec.Plan_End_Date__c ? new Date(tempConRec.Plan_End_Date__c).toLocaleDateString('en-GB') : '';
                        tempConRec.billing = tempConRec.Billing_Per_user__c;
                        tempConRec.accountManagerName = tempConRec.Account_Manager_Name__c;
                        tempConRec.salesExecName = tempConRec.Sales_Exec_Name__c;
                        tempConRec.referenceName = tempConRec.Reference_Name__c;
                        tempConRec.amazonUrl = tempConRec.Amazon_Url__c;
                        tempconList.push(tempConRec);
                    });
    
                    this.records = tempconList;
                    this.noRecordsFlag = false;
                    this.totalRecords = this.records.length;
                    this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
                    this.pageNumber = 1;
    
                    this.paginationHelper();
                } else {
                    this.noRecordsFlag = true;
                }
            })
        .catch(error => {
            console.error('Error fetching leads:', error);
            this.noRecordsFlag = true;
        });
    }

    sortData(event) {
        const { key } = event.currentTarget.dataset;
        const isReverse = this.sortBy === key && this.sortDirection === 'asc';
        this.sortDirection = isReverse ? 'desc' : 'asc';
        this.sortBy = key;
        this.sortRecords(this.sortBy, this.sortDirection);
    }

    sortData(event) {
        const { key } = event.currentTarget.dataset;
        const isReverse = this.sortBy === key && this.sortDirection === 'asc';
        this.sortDirection = isReverse ? 'desc' : 'asc';
        this.sortBy = key;
        this.sortRecords(this.sortBy, this.sortDirection);
    }

    sortRecords(field, direction) {
        let parseData = JSON.parse(JSON.stringify(this.records));
        let keyValue = (a) => {
            return a[field];
        };
        let isReverse = direction === 'asc' ? 1 : -1;
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x).toLowerCase() : '';
            y = keyValue(y) ? keyValue(y).toLowerCase() : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.records = parseData;
        this.paginationHelper();
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
        this.availableIssues = [];
        //console.log('response in new pagination 2'+JSON.stringify( this.records));  
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }  
            let tempConRec = Object.assign({}, this.records[i]);
           
            tempconList.push(tempConRec);           
        }
        this.availableIssues= tempconList;       
        console.log('response in new pagination 3'+JSON.stringify(this.availableIssues));                
    } 

    handleCreateNewSales(){
        this.isOpenModal = true;
        this.recordId = '';
        this.headeringName = 'Create New Sales';
        this.fileName = '';
        this.buttonName = 'Save';
    }
    hideModalBox(){
        this.isOpenModal=false;
    }
    handleChangeStatus(event) {
        this.status = event.detail.value;
       // console.log('Status is>>'+this.status);
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
       
    }

    handleSubmit(event){ 
        event.preventDefault();       
        const fields=event.detail.fields;       
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form').submit(fields);  
        //this.template.querySelector('lightning-record-edit-form').submit(fields);    
        //this.isEdit=false;
    }

    handleSuccess(event){
        this.recordId=event.detail.id;
        console.log('215 record Id>>'+ this.recordId);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully !!',
                variant: 'success',
            }),
        ); 
       // console.log('base64>> ',this.base64FileData);       
        this.showSpinner = true;
        //Uploading files to AWS S3 bucket
        if(this.fileName.length > 0){
            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId: this.recordId,obj:'lead'})
            .then(result => {
               // console.log('Upload result = ' +result);
                this.fileName = this.fileName + ' - Uploaded Successfully';            
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.file.name + ' - Uploaded Successfully!!!',
                        variant: 'success',
                    }),
                );
            }).catch(error => {
                //window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error in uploading File',
                        message: error.message,
                        variant: 'error',
                    }),
                );
                this.showSpinner = false;
            });
        }        
        this.isOpenModal = false;           
        this.showSpinner = false;
        setTimeout(() => {
            this.fetchLeads();
        }, 2000);       
    }

    @track buttonName;
    handleRowActions(event) {
        const actionName =  event.currentTarget.dataset.actionname;
        console.log('Action name >>>'+actionName);
        //const actionName = event.detail.action.name;        
        this.recordId = event.currentTarget.dataset.id;
        console.log('Record Id is >>>'+this.recordId);
        switch (actionName) {        
            case 'Edit':          
            this.isOpenModal=true; 
            break;            
        }
        this.buttonName='Update';
        this.fileName='';
    } 
    
    handleback() {           
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: 'home'
            }
        }); 
    }
    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isOpenModal=false;
        this.isHome=false;
        if(this.currentUrl){
            this.isModalOpen = true;  
        }else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Warning!!',
                    message: 'There is no attachments!!',
                    variant: 'warning',
                }),
            ); 
            this.isModalOpen = false; 
            this.isHome=true; 
        }
       
        console.log('is modal   '+ this.isModalOpen);  
    }

    closeSaleslinvoice(){
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isOpenModal=false;
        this.isHome=true;
    } 
	
}