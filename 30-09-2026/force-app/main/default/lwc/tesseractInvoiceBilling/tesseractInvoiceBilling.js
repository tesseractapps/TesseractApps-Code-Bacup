import { LightningElement, track, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import listofInvoices from '@salesforce/apex/TesseractInvoiceHandler.listofInvoices';
import listofInvoicesParent from '@salesforce/apex/TesseractInvoiceHandler.listofInvoicesParent';
import insertInvoice from '@salesforce/apex/TesseractInvoiceHandler.insertInvoice';
import { ShowToastEvent } from "lightning/platformShowToastEvent"; 
import { deleteRecord } from 'lightning/uiRecordApi';
import LightningConfirm from 'lightning/confirm';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import updateInvoice from '@salesforce/apex/TesseractInvoiceHandler.updateInvoice';
import getSearchKeys from '@salesforce/apex/TesseractInvoiceHandler.getSearchKeys';
import saveSearchKey from '@salesforce/apex/TesseractInvoiceHandler.saveSearchKey';
import sendEmail from '@salesforce/apex/TesseractInvoiceHandler.sendEmail';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import getInvoiceParentHistory from '@salesforce/apex/TesseractInvoiceHandler.getInvoiceParentHistory';

export default class TesseractInvoiceBilling extends NavigationMixin(LightningElement) {

    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page

    @track invoiceTable=[];
    @track isInvoiceflag = false;
    @track dateIssued;
    @track taxinvoice;
    @track description;
    @track quantity;
    @track unitPrice;
    @track orgId;
    @track orgLogo;
    @track orgname;
    @track abn;
    @track rcti;
    @track address;
    @track statePostal;
    @track contactNo;
    @track bank;
    @track accountName;
    @track bsb;
    @track accountNo;
    @track index=1;
    @track delIndex;
    @track invoiceData = false;
    @track invoiceflag=false;
    @track sdate;
    @track edate;
    @track isDesktop = true;
    @track isInvoice=false;
    @track selectedValue='Yes';
    @track viewOrgDetails=false;
    @track viewOrgLabel='Show more';
    @track accountRecList = [];
    @track selectedValueInvoice;
    @track invoiceToData;
    @track invoiceStatus;
    @track startDate;
    @track endDate;
    @track invoiceFileName;
    @track subTotalVal=0;
    @track GSTVal=0;
    @track totalAmount=0;
    @track duedate;
    @track invoiceStatus='Draft';
    @track fileRefrence;

    
    @track statuslabel;
    @track sendEmailTemplate=false;
    @track toAdreess;
    @track amazonUrl;
    @track currentEvent;
    @track isInvoice=false;
    @track isInvoiceToggle=false;
    @track invoiceHistory;
    @track createdDateTime;
    @track createdBy;
    @track isSaveButton=false;
    @track isGenerateButton=false;
    @track isHistoryVisible=false;
    @track isHistoryOpen=true;
    @track isModalOpen = false;
    @track currentUrl;

    @track options=[
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ];
    
    @track statuOptions=[
        { label: 'Draft', value: 'Draft' },
        { label: 'Invoice Generated', value: 'Invoice Generated' },
        { label: 'Issued', value: 'Issued' },
        { label: 'Payment Received', value: 'Payment Received' },
        { label: 'Over Due', value: 'Over Due' },
        { label: 'Payment Rejected', value: 'Payment Rejected' }
    ];

    @track optionsInvoiceTo =[
        { label: 'Ace Info Systems Pty Ltd', value: 'Ace Info Systems Pty Ltd' },
        { label: '24 Care Australia Pty Ltd', value: '24 Care Australia Pty Ltd' },
        { label: 'ASJ Tech Pty Ltd', value: 'ASJ Tech Pty Ltd' },
        { label: 'Pinnacle IT Services Pty Ltd', value: 'Pinnacle IT Services Pty Ltd' }
    ];

    @api reload(){
        this.invoiceflag=true; 
        this.isInvoiceflag=false; 
    }

    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
               // console.log("JS loaded jsPDF");
            }).catch(error => {
               // console.error("Error " + error);
            })
        ]);
    }

    @wire(getSearchKeys)
    wiredSearchKeys({ error, data }) {
        if (data) {
            if (data.trim()) {
                const keywords = new Set(data.split(' '));
                this.emaillKeyOptions = [...keywords].map(key => {
                    return { label: key, value: key };
                });
            } else {
                this.emaillKeyOptions = [{ label: 'No Email found', value: 'no_Email_Found' }];
            }
        } else if (error) {
            this.emaillKeyOptions = [{ label: 'No Email found', value: 'no_Email_Found' }];
            //console.error('Error fetching search keys: ', error);
        }
       // console.log('option '+JSON.stringify(this.options));
    }

    connectedCallback(){
        this.invoiceflag=true;
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.edate = last.toISOString().slice(0, 10);
       // console.log('Start Date >>>'+this.sdate);
       // console.log('End Date >>'+this.edate);
        this.handleInvoiceData();    
    }

    hadleDates(event) {
        var sname = event.target.name;

        if (event.target.name == 'sdate') {
            this.sdate = event.detail.value;            
        }
        if (event.target.name == 'edate') {
            this.edate = event.detail.value;
        }
        this.readInvoiceDetails();
    }

    handleInvoiceData() {
        // console.log('calling response raja');
         organizationDetails().then(response => {
            // console.log('calling response raja', JSON.stringify(response));
             this.invoiceData = response.listofPriceBook;
            // console.log('calling data blob', response.listofPriceBook.Id);
            // console.log('calling data blob', response.bolbdata);
             this.orgId = response.listofPriceBook.Id;
             this.orgname = response.listofPriceBook.Name;
             this.abn = response.listofPriceBook.ABN__c;
             this.rcti = response.listofPriceBook.RCTI__c;
             this.address =response.listofPriceBook.Address_Latest__Street__s;
             this.statePostal = response.listofPriceBook.Address_Latest__City__s + ',' + response.listofPriceBook.Address_Latest__StateCode__s + ',' + response.listofPriceBook.Address_Latest__PostalCode__s;
             this.contactNo = response.listofPriceBook.Contact_No__c;
             this.bank = response.listofPriceBook.Bank__c;
             this.accountNo = response.listofPriceBook.Account_Number__c;
             this.accountName = response.listofPriceBook.Account_Name__c;
             this.bsb = response.listofPriceBook.BSB__c;
             this.desc = response.listofPriceBook.Description__c;
             this.orgLogo = response.bolbdata;
            // console.log('invoiceData data ', JSON.stringify(this.invoiceData));
            // console.log('orgId>>>>', this.orgId);
            this.readInvoiceDetails();
         });
    }

    async handleDelete(event) {      
        let parentInvId = event.currentTarget.dataset.id;
       // console.log("parentInvoice>>>", parentInvId);
        const result = await LightningConfirm.open({
            message: 'Click OK to Delete Invoice',
            variant: 'header',
            label: 'Click OK to Delete Invoice',
            theme: 'Warning',
        });
        if (result == true) {
           // console.log("parentInvoice>>>", parentInvId);
            let tempconList=[];
            deleteRecord(parentInvId).then(() => {
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: 'Success',
                    message: 'Invoice is deleted successfully',
                    variant: 'success'
                  })
                );
                this.readInvoiceDetails();
            }); 
            this.paginationHelper();  
        }    
    }

    handleOpenEmail(){
        this.sendEmailTemplate=true;
    }

    hadleEmailChange(event){
        this.currentEvent='';
        this.toAdreess=event.detail.value;
        this.currentEvent=event.target.name
    }

    async handleSendEmail(){   
        if (this.toAdreess &&this.currentEvent=='emaiText') {
            const result = await LightningConfirm.open({
                message: 'Do you want to save the Email?',
                variant: 'header',
                label: 'Please Confirm',
                theme: 'warning',
            });
            if (result) {  
            this.saveSearchKeyToApex(this.toAdreess);
                this.handleEmailpdf();
            }else{
                this.handleEmailpdf(); 
            }
        } 
        if(this.toAdreess && this.currentEvent=='emaildropDown'){
            this.handleEmailpdf();
            
        }
    }

    saveSearchKeyToApex(emailKey) {
        console.log('to  email  '+ emailKey);
        saveSearchKey({ emailKey: emailKey }).then(response=>{
            console.log('Search key saved successfully.'+JSON.stringify(response));
        });
    }

    handleEmailpdf(){
        let fileRef;
        if(this.fileRefrence != null || this.fileRefrence !=undefined ||this.fileRefrence !=''){
                fileRef=this.fileRefrence.replaceAll(" ","-");
        }else{
            fileRef='-';
        }
        
        let docName=this.invoiceFileName+'-'+fileRef+'.pdf';
        sendEmail({ base64: JSON.stringify(this.generateBase64Data()) ,staffEmail:this.toAdreess,orgName:this.orgname,fileName:docName}).then(result => {
            const evt = new ShowToastEvent({
                title: 'Success',
                message: 'Email has been sent successfully ',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            updateInvoice({invID:this.invoiceID,statusVal: this.invoiceStatus,typeOfUpdate:'Email'}).then(result=>{
            }); 

            this.isInvoiceflag = false;
            this.invoiceflag=true;
            this.sendEmailTemplate=false;
            this.readInvoiceDetails();
        });
    }    

    async handleReceived(){
        let finalStatus ;
        let message;
        if (this.invoiceStatus =='Issued') {
            finalStatus = 'Payment Received';
            message = 'Status marked as Received';        
        }
        else if (this.invoiceStatus =='Payment Received') {
            finalStatus = 'Issued';
            message = 'Status marked as Issued';
        }  
        
        updateInvoice({invID:this.invoiceID,statusVal: finalStatus,typeOfUpdate:'Status'}).then(result=>{
            const evt = new ShowToastEvent({
                title: 'Success',
                message: message,
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            this.isInvoiceflag = false;
            this.invoiceflag=true;
            this.readInvoiceDetails();
        });     
    }

     @track slno;
     generatePDF() {
         let fileRef;
         if(this.fileRefrence != null || this.fileRefrence !=undefined ||this.fileRefrence !=''){
              fileRef=this.fileRefrence.replaceAll(" ","-");
         }else{
             fileRef='-';
         }
         let docName=this.invoiceFileName+'-'+fileRef+'.pdf';
        // console.log('base64>>>'+JSON.stringify(this.generateBase64Data()));
         uploadFile({base64:JSON.stringify(this.generateBase64Data()), filename:docName, recordId:this.invoiceID, obj:'tesseractInvoice'})
         .then(result=>{
            console.log('data', result);                    
             //this.handleInvoicFlag();
             //this.fileName = this.fileName + ' - Uploaded Successfully'; 
         })            
         const evt = new ShowToastEvent({
             title: 'Success',
             message: 'Invoice Generated sucessfully '+docName,
             variant: 'success',
             mode: 'dismissable'
         });
         this.dispatchEvent(evt);
        
     }

    handleInvoicFlag(){
        this.isInvoiceflag = true;
        this.invoiceflag=false;
        this.invoiceFileName ='';
        this.invoiceToData='';
        this.dateIssued = '';
        this.selectedValue = 'Yes';
        this.invoiceStatus='Draft';
        this.fileRefrence='';
        this.duedate='';
        this.subTotalVal=0;
        this.GSTVal=0;
        this.totalAmount=0;
        this.isSendButton=true;
        this.isHistoryOpen=false;
        this.isInvoice=false;
        this.isSaveButton=false;
        this.isInvoiceToggle=false;
        this.isHistoryVisible=false;
        this.accountRecList=[];
        let accountRecList = [];
        this.createRow(accountRecList);
        this.accountRecList = accountRecList;
    }

    handleedit(event){
        this.isInvoiceflag = true;
        this.isInvoice=true;
        this.invoiceflag=false;
        this.accountRecList=[];
        let accountRecList = [];
        console.log('id '+event.currentTarget.dataset.id);
        this.invoiceID=event.currentTarget.dataset.id;
        this.isHistoryVisible=true;
        this.isHistoryOpen= true; 
        this.invoiceHistory='';
        listofInvoices({ invParentId: event.currentTarget.dataset.id}).then(response => {
            console.log('data of ', JSON.stringify(response));
            this.invRecords = response;
            this.invoiceFileName = response[0].Tesseract_Invoice__r.Name;
            console.log('Invoice File Name>>'+this.invoiceFileName);
            this.invoiceToData = response[0].Tesseract_Invoice__r.Organisation_Name__c;
            this.amazonUrl=response[0].Tesseract_Invoice__r.Amazon_URL__c;
            this.dateIssued = response[0].Tesseract_Invoice__r.Date_Issued__c;
            this.selectedValue = response[0].Tesseract_Invoice__r.Include_GST__c;
            this.invoiceStatus=response[0].Tesseract_Invoice__r.Status__c;
            this.fileRefrence=response[0].Tesseract_Invoice__r.File_Reference__c;
            this.duedate=response[0].Tesseract_Invoice__r.Due_Date__c
            accountRecList = response.map((rec, index)=>{
                return{ 
                    index: (index+1), Description:rec.Description__c,Quantity:rec.No_of_Users__c,UnitPrice:rec.Billing_Per_User__c
                }
            });
            //this.addRow();
            this.createRow(this.accountRecList);
            this.accountRecList = accountRecList;
            this.subTotalVal=parseFloat(this.calCulateGST(this.accountRecList).amount).toFixed(2);
            this.GSTVal=parseFloat(this.calCulateGST(this.accountRecList).Gst).toFixed(2);
            this.totalAmount= (parseFloat(this.subTotalVal)+parseFloat(this.GSTVal)).toFixed(2);

            if(this.invoiceStatus=='Issued' || this.invoiceStatus=='Payment Received' ){
                this.isInvoiceToggle=true;
            }else{
                this.isInvoiceToggle=false;  
            }
            if(this.invoiceStatus=='Draft'){
                this.isSendButton=true;
                this.isSaveButton=false;
            
            }else if (this.invoiceStatus =='Issued') {
                this.statuslabel = 'Mark as Received'; 
                this.isSendButton=false;
                this.isSaveButton=true;
            }
            else if (this.invoiceStatus =='Payment Received') { 
                this.statuslabel= 'Mark as Issued';
                this.isSendButton=true;
                this.isSaveButton=true;
            }  
        }); 
       

    }
   
    formatDateTime(datetimeString) {
        const date = new Date(datetimeString);
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const year = date.getUTCFullYear();
          const timeOptions = {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
              timeZone: 'Australia/Sydney'
          };
          const timeFormatter = new Intl.DateTimeFormat('en-US', timeOptions);
          const formattedTime = timeFormatter.format(date);
          const formattedDate = `${day}/${month}/${year}`;
          return `${formattedDate} ${formattedTime}`;
      
    }

    get isDesktop() {        
        return FORM_FACTOR === 'Large';
    }

    handleback() {           
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: 'home'
            }
        }); 
    }

    handlemodelback(){
        this.isInvoiceflag = false;
        this.invoiceflag=true;
    }

     closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.sendEmailTemplate=false;
    }
    closeaddPayrollinvoice(){
        this.isModalOpen = false;
        this.currentUrl = null;
        this.sendEmailTemplate=false;
        this.invoiceflag=true;
    } 

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isInvoiceflag=false;
        this.invoiceflag=false;
    }

    @track isPreview=false;
    handlePreview(event) {
        let parentInvId = event.currentTarget.dataset.id;
        let parentInvName  = event.currentTarget.dataset.name;
        this.invoiceFileName = parentInvName;
        this.invoiceID = parentInvId;
       // console.log("parentInvoice>>>", parentInvId);
        listofInvoices({ invParentId: parentInvId }).then(response => {
           // console.log('data of ', JSON.stringify(response));
            this.invRecords = response;
            this.generatePDF();
            this.isPreview=true;
        });
    }

    changeHandler(event) {        
        if (event.target.name == 'dateIssued') {
            this.dateIssued = event.target.value;
        }
        if(event.target.name=='selectOption'){
           // console.log('Selected value '+event.target.value);
            this.selectedValue = event.target.value;
            this.subTotalVal=parseFloat(this.calCulateGST(this.accountRecList).amount).toFixed(2);
            this.GSTVal=parseFloat(this.calCulateGST(this.accountRecList).Gst).toFixed(2);
            this.totalAmount= (parseFloat(this.subTotalVal)+parseFloat(this.GSTVal)).toFixed(2);
        }
        if(event.target.name=='invoiceto'){
           // console.log('Invoie to value '+event.target.value);
            this.invoiceToData = event.target.value;
        }
        if(event.target.name=='duedate'){
            // console.log('Invoie to value '+event.target.value);
             this.duedate = event.target.value;
        }
        if(event.target.name=='selectStatus'){
            // console.log('Invoie to value '+event.target.value);
             this.selectStatus = event.target.value;
        }
        if(event.target.name=='FileReference'){
            // console.log('Invoie to value '+event.target.value);
            this.fileRefrence = event.target.value;
         }
       /*  if(event.target.name=='startDate'){
            // console.log('Invoie to value '+event.target.value);
             this.duedate = event.target.value;
        }
        if(event.target.name=='endDate'){
            // console.log('Invoie to value '+event.target.value);
             this.selectStatus = event.target.value;
        } */
    }

    handleHideOrgDetails(event){       
        if(this.viewOrgDetails==false){
            this.viewOrgDetails=  true;
            this.viewOrgLabel= 'Hide Details';
        }else if(this.viewOrgDetails==true){
            this.viewOrgDetails=  false;
            this.viewOrgLabel= 'Show more';
        }      
    }

    handleInputChange(event) {
        let index = event.target.dataset.id;
        let fieldName = event.target.name;
        let value = event.target.value;
        for(let i = 0; i < this.accountRecList.length; i++) {
            if(this.accountRecList[i].index === parseInt(index)) {
                this.accountRecList[i][fieldName] = value;
            }
        }
            try{
                this.NumericCheck(this.accountRecList);
                this.subTotalVal=parseFloat(this.calCulateGST(this.accountRecList).amount).toFixed(2);
                this.GSTVal=parseFloat(this.calCulateGST(this.accountRecList).Gst).toFixed(2);
                this.totalAmount= (parseFloat(this.subTotalVal)+parseFloat(this.GSTVal)).toFixed(2);
               // console.log('Account rec list??'+ this.accountRecList);  
            }catch(Error){
                const evt = new ShowToastEvent({
                    title: 'Error',
                    //message: 'Please Provide  Description ,Quantity and Unit Price',
                    message: Error.message,
                    variant: 'Error',
                    mode: 'dismissable' 
                });
                this.dispatchEvent(evt);
               
            } 
                   
  
    }

    NumericCheck(accountRecList) {
        for (let i = 0; i < accountRecList.length; i++) {
            let record = accountRecList[i];
            if (record.Quantity !== null && record.UnitPrice !== null) {
                // Check if Quantity and UnitPrice are numeric
                if (isNaN(record.Quantity) || isNaN(record.UnitPrice)) {
                    throw new Error(`Quantity and Unit Price must be numeric and without any characters at row ${record.index}`);
                }
            }
        }
    }

    createRow(accountRecList) {
        let accountObject = {};
        if(accountRecList.length > 0) {
            accountObject.index = accountRecList[accountRecList.length - 1].index + 1;
        } else {
            accountObject.index = 1;
        }
        accountObject.Description = null;
        accountObject.Quantity = null;
        accountObject.UnitPrice = null;
        accountRecList.push(accountObject);
        
       
    }
   
    addRow() {
        this.createRow(this.accountRecList);
    }

    removeRow(event) {
        let toBeDeletedRowIndex = event.target.name;
       // console.log(toBeDeletedRowIndex);
        let accountRecList = [];
        for(let i = 0; i < this.accountRecList.length; i++) {
            let tempRecord = Object.assign({}, this.accountRecList[i]); //cloning object
           // console.log(tempRecord);
            if(tempRecord.index !== toBeDeletedRowIndex) {
                accountRecList.push(tempRecord);
            }
        }
        for(let i = 0; i < accountRecList.length; i++) {
            accountRecList[i].index = i + 1;
        }
        this.accountRecList = accountRecList;
       // console.log('after remove total amount  '+this.calCulateGST(this.accountRecList).amount +' with GSt  '+this.calCulateGST(this.accountRecList).Gst);
        this.subTotalVal=parseFloat(this.calCulateGST(this.accountRecList).amount).toFixed(2);
        this.GSTVal=parseFloat(this.calCulateGST(this.accountRecList).Gst).toFixed(2);
        this.totalAmount= (parseFloat(this.subTotalVal)+parseFloat(this.GSTVal)).toFixed(2)
    }

    calCulateGST(data) {
        /* 
         if (isNaN(data[i].Quantity) || isNaN(data[i].UnitPrice)) {
             const index = data[i].index;
             throw new Error(`Quantity and Unit Price must be numeric at row ${index}`);
         } */
         let totalAmout=0;
         let totalGST=0 
         for (let i = 0; i < data.length; i++) {
             if ( data[i].Quantity != null && data[i].UnitPrice != null) {
                 totalAmout +=(data[i].Quantity*data[i].UnitPrice);
             }  
         }
         if(this.selectedValue=='Yes'){
             totalGST=(totalAmout*0.1);
         }else{
             totalGST=0;
         }
        console.log('total amount '+totalAmout);
         console.log('total GST '+totalGST);
         return {amount:totalAmout.toFixed(2),Gst:totalGST.toFixed(2)};
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
        console.log('tempconrec>>'+JSON.stringify(this.invoiceTable));       
    }

    saveInvoiceOnly(){
        // console.log('SelectedValue >>>'+this.selectedValue);
        if(this.selectedValue == undefined){
            this.selectedValue = 'Yes';
        }
        if(this.invoiceStatus == undefined){
            this.invoiceStatus = 'Draft';
        }
        // console.log('length of '+JSON.stringify(this.accountRecList));
       
        if(this.dateIssued ==undefined){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide Date Issued',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            }else if(this.dueDateValidation(this.dateIssued, this.duedate)){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Due Date can not be greater than Date Issued',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);

        }else if(this.invoiceToData==undefined || this.invoiceToData==null || this.invoiceToData==''){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide Invoice to',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }else if(this.fileRefrence==undefined || this.fileRefrence==null || this.fileRefrence==''){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide File Reference',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }else {
            try {                
                this.validateData(this.accountRecList);
                
                insertInvoice({ JsonString: JSON.stringify(this.accountRecList), dateIssue: this.dateIssued, includeGst :this.selectedValue, invoiceTo: this.invoiceToData ,dueDate:this.duedate ,invoiceStatus:this.invoiceStatus, fileref:this.fileRefrence, invName:this.invoiceFileName })
                .then(result => {
                    const evt = new ShowToastEvent({
                        title: 'Success',
                        message: 'Data saved successfully!',
                        variant: 'Success',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                    this.isInvoiceflag = false;
                    this.invoiceflag=true;
                    this.readInvoiceDetails();
                });
            } catch (Error) {
                console.log('in error ')
                const evt = new ShowToastEvent({
                    title: 'Error',
                    //message: 'Please Provide  Description ,Quantity and Unit Price',
                    message: Error.message,
                    variant: 'Error',
                    mode: 'dismissable' 
                });
                this.dispatchEvent(evt);
            }    
        }
    }

    saveMultipleAccounts() {
        // console.log('SelectedValue >>>'+this.selectedValue);
        if(this.selectedValue == undefined){
            this.selectedValue = 'Yes';
        }
        
        if(this.invoiceStatus == undefined){
            this.invoiceStatus = 'Draft';
        }
        // console.log('length of '+JSON.stringify(this.accountRecList));
        if(this.dateIssued ==undefined){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide Date Issued',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }else if(this.dueDateValidation(this.dateIssued, this.duedate)){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Due Date can not be greater than Date Issued',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);

        }else if(this.invoiceToData==undefined || this.invoiceToData==null || this.invoiceToData==''){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide Invoice to',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }else if(this.fileRefrence==undefined || this.fileRefrence==null || this.fileRefrence==''){
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide File Reference',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }else{
            try {                
                this.validateData(this.accountRecList);
                console.log('Account List>>'+JSON.stringify(this.accountRecList));
                console.log('date issuesd'+this.dateIssued);
                console.log('due date'+this.duedate);
                console.log('invoice to'+this.invoiceToData);
                console.log('file refe'+this.fileRefrence);
                insertInvoice({ JsonString: JSON.stringify(this.accountRecList), dateIssue: this.dateIssued, includeGst :this.selectedValue, invoiceTo: this.invoiceToData,dueDate:this.duedate,invoiceStatus:'Issued', fileref:this.fileRefrence, invName:this.invoiceFileName })
                .then(result => {
                    // console.log('602 result >>>'+JSON.stringify(result));
                    // console.log("create Invoice");                    
                    this.invoiceID = result.Id;
                    // console.log("parentInvoice>>>", this.invoiceID);
                    listofInvoices({ invParentId: this.invoiceID }).then(response => {
                        //console.log('data of ', JSON.stringify(response));
                        this.invRecords = response;
                        this.invoiceFileName = response[0].Tesseract_Invoice__r.Name;
                        //console.log('803 Invoice File Name>>'+this.invoiceFileName);
                        this.invoiceToData = response.Organisation_Name__c;
                        this.noOfUser = response.No_of_Users__c;
                        this.BillPerUser = response.Billing_Per_User__c;
                        this.generatePDF();
                        this.readInvoiceDetails();
                        this.isInvoiceflag = false;
                        this.invoiceflag=true;
                    }); 

                });
            } catch (Error) {
                const evt = new ShowToastEvent({
                    title: 'Error',
                    //message: 'Please Provide  Description ,Quantity and Unit Price',
                    message: Error.message,
                    variant: 'Error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
            }
        
        }
    }

    readInvoiceDetails(){
        this.invoiceTable=[];
            let tempconList=[];
            this.records=[];
        console.log('Start Date >>>'+ this.sdate);
         console.log('End Date >>'+this.edate);
       // console.log('540Tempconlist >>>'+JSON.stringify(tempconList));
       listofInvoicesParent({ sDate: this.sdate, eDate:this.edate }).then(response => {
            response.forEach((record) => {
                console.log('554 response>>>'+JSON.stringify(response));
                let tempConRec = Object.assign({}, record);
                tempConRec.dateIssued = new Date(tempConRec.Date_Issued__c).toLocaleDateString('en-GB');
                //tempConRec.descName = new Date(tempConRec.Date_Issued__c.slice(0, 10)).toLocaleString('en-us', { month: 'short', year: 'numeric' });
                
                tempConRec.gst = tempConRec.Total_GST__c.toFixed(2);
                tempConRec.amount = tempConRec.Total_Amount__c.toFixed(2);                

                tempConRec.amazonUrl = tempConRec.Amazon_URL__c;
                 if(tempConRec.File_Reference__c ==undefined ||  tempConRec.File_Reference__c == null){
                    tempConRec.fileReference='';
                }else{
                    tempConRec.fileReference=tempConRec.File_Reference__c;
                } 
               // tempConRec.fileName = tempConRec.Organisation_Name__c;                
                tempConRec.Status = tempConRec.Status__c;
                tempconList.push(tempConRec);               
            })
            // this.invoiceTable = tempconList;
            this.records = tempconList;  
           
            this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
            this.paginationHelper();                   
        })
    }

    dueDateValidation(issue,due){
        if(new Date(issue)<new Date(due)){
            return true;
        }else{
            return false;
        }
    }
    validateData(data) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].Description == null || data[i].Quantity == null || data[i].UnitPrice == null) {
                const index = data[i].index;
                  throw new Error(`Description and Quantity cannot be null at row ${index}`); 
            }
            if (data[i].Description.length > 250) {
                const index = data[i].index;
                throw new Error(`Description cannot exceed 250 characters at row ${index}`);
            }
            if (isNaN(data[i].Quantity) || isNaN(data[i].UnitPrice)) {
                const index = data[i].index;
                throw new Error(`Quantity and Unit Price must be numeric and without any characters at row ${index}`);
            }
        }
    }

    generateBase64Data() { 
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        var statePostalWithoutCommas = this.statePostal.replace(/,/g, " "); 
        
       // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );
    
       doc.setFont("Helvetica", "normal");
        //doc.setFontSize(20);
        //doc.text("DRAFT INVOICE", 20,25 );
        doc.setTextColor(0,102,255);
        doc.setFontSize(12);
        doc.text(this.orgname, 22, 20);  
       
        doc.setTextColor(0,0,0);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text("ABN: "+this.abn, 22, 25);
        doc.setFont("Helvetica", "normal");
    
        
        doc.setFontSize(10);
        doc.text(this.address, 22,35 );
        doc.text(statePostalWithoutCommas, 22, 40);
        doc.text("Contact: "+this.contactNo, 22, 45);
    
        /* top  left side box start  */
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Invoice Number", 150, 24);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(this.invRecords[0].Tesseract_Invoice__r.Name, 150, 28);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Invoice Date ", 150, 34);
        doc.setFont("Helvetica", "bold");
        const oldDate = this.invRecords[0].Tesseract_Invoice__r.Date_Issued__c;
        const arr = oldDate.split('-');
        const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];       
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(newDate, 150, 38);
    
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text("For the Period ", 150, 44);
        const oldsDate = this.sdate;
        const sarr = oldsDate.split('-');
        const newsDate = sarr[2]+'/'+sarr[1]+'/'+sarr[0];
        const oldeDate = this.edate;
        const earr = oldeDate.split('-');
        const neweDate = earr[2]+'/'+earr[1]+'/'+earr[0];
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(newsDate+" to "+neweDate, 150, 48); 

      /* top  left side box end  */

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("TAX INVOICE To: ", 22, 65);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);
        doc.text(this.invRecords[0].Tesseract_Invoice__r.Organisation_Name__c,59, 65);
        doc.setFontSize(12);
        doc.setFont("Helvetica", "bold");
        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(20, 71, 170, 5,"FD");

        doc.text("Description ", 22, 75);
        doc.text("Quantity", 110, 75);
        doc.text("Unite Price", 140, 75);
        doc.text("Amount", 173, 75);
        doc.setFont("Helvetica", "normal");
        // Manually placing each item
        let yPosition = 82;
        console.log('Inv Records >>>'+JSON.stringify(this.invRecords));
        this.invRecords.forEach(record => {
           // Split the description text into multiple lines if it's too long
            //doc.addFont('Roboto-monospace.ttf', 'Roboto', 'monospace');
           // doc.addFont('ComicSansMS', 'Comic Sans', 'normal');
           // doc.setFont('Comic Sans');
           //doc.setFontStyle("roboto");
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            let descriptionLines = doc.splitTextToSize(record.Description__c, 80); // 80 is the width limit for the description column
            doc.text(descriptionLines, 22, yPosition);

            // Only increase the yPosition by the number of lines in the description
            let descriptionHeight = descriptionLines.length * 5; // Adjust the line height as needed (here it's 6)

            // Align the other columns with the first line of the description
            doc.text(record.Billing_Per_User__c.toFixed(2), 110, yPosition);
            doc.text(record.No_of_Users__c.toLocaleString('en-US', { style: 'currency', currency: 'USD', }), 140, yPosition);
            doc.text(record.Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), 173, yPosition);

            yPosition += descriptionHeight; // Adjust yPosition based on the description height
            
            doc.setLineWidth(0.5);
            // Draw the line at the new yPosition
            doc.line(20, (yPosition-3), 190, (yPosition-3));

            // Add a small gap after each item
            yPosition += 2; 
        });
    
        // Manually adding Subtotal, Total GST, and Total
        yPosition += 1;
        
        doc.text("Subtotal:", 140, yPosition);
        doc.text('$'+this.invRecords[0].Tesseract_Invoice__r.Total_Amount__c.toFixed(2), 173, yPosition);
    
        yPosition += 6;
        doc.text("Total GST:", 140, yPosition);
        doc.text('$'+this.invRecords[0].Tesseract_Invoice__r.Total_GST__c.toFixed(2), 173, yPosition);

        doc.setFont("Helvetica", "bold");
        yPosition += 3;
        // Draw the line at the new yPosition
        doc.line(100, (yPosition),190, (yPosition),'F');
        yPosition += 6;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Total:", 140, yPosition);
        doc.text('$'+this.invRecords[0].Tesseract_Invoice__r.Total__c.toFixed(2), 173, yPosition);

        console.log('y position' +yPosition);
        console.log('total height  ' +doc.internal.pageSize.height);
    
        let availableSpace = doc.internal.pageSize.height-yPosition;
        console.log('available Space ' +availableSpace);
        
        if(availableSpace >60){
            // Adding payment details at the bottom
            yPosition += 35;
            doc.setDrawColor(0);
            doc.setFillColor(255, 255, 255);
            doc.setLineWidth(0.1);
            doc.roundedRect(20, yPosition, 70, 28, 0, 0, 'S');
            
            doc.setFontSize(10);
            doc.setFont("Helvetica", "bold");
            doc.text("Payable to:", 25, yPosition + 6);
            
            doc.setFont("Helvetica", "bold");
            doc.text("Bank:", 25, yPosition + 12);
            doc.setFont("Helvetica", "normal");
            doc.text(this.bank || " ", 36, yPosition + 12);

            doc.setFont("Helvetica", "bold");
            doc.text("Account Name:", 25, yPosition + 16);        
            doc.setFont("Helvetica", "normal");
            doc.text(this.accountName || " ", 52, yPosition + 16);

            doc.setFont("Helvetica", "bold");
            doc.text("BSB:", 25, yPosition + 20);        
            doc.setFont("Helvetica", "normal");
            doc.text(this.bsb || " ", 35, yPosition + 20);

            doc.setFont("Helvetica", "bold");
            doc.text("Account Number:", 25, yPosition + 24);
            doc.setFont("Helvetica", "normal");
            doc.text(this.accountNo || " ", 55, yPosition + 24);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text("Office Use Only", 90, 290);
        }else{
            doc.addPage();

            yPosition = 35;
            doc.setDrawColor(0);
            doc.setFillColor(255, 255, 255);
            doc.setLineWidth(0.1);
            doc.roundedRect(20, yPosition, 70, 28, 0, 0, 'S');
            
            
            doc.setFontSize(10);
            doc.setFont("Helvetica", "bold");
            doc.text("Payable to:", 25, yPosition + 6);
            
            doc.setFont("Helvetica", "bold");
            doc.text("Bank:", 25, yPosition + 12);
            doc.setFont("Helvetica", "normal");
            doc.text(this.bank || " ", 36, yPosition + 12);

            doc.setFont("Helvetica", "bold");
            doc.text("Account Name:", 25, yPosition + 16);        
            doc.setFont("Helvetica", "normal");
            doc.text(this.accountName || " ", 52, yPosition + 16);

            doc.setFont("Helvetica", "bold");
            doc.text("BSB:", 25, yPosition + 20);        
            doc.setFont("Helvetica", "normal");
            doc.text(this.bsb || " ", 35, yPosition + 20);

            doc.setFont("Helvetica", "bold");
            doc.text("Account Number:", 25, yPosition + 24);
            doc.setFont("Helvetica", "normal");
            doc.text(this.accountNo || " ", 55, yPosition + 24);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text("Office Use Only", 90, 290);
        }
        this.base64string = btoa(doc.output());
      //  console.log('Generated PDF Base64: ' + this.base64string);    
        return this.base64string;
    }

    HandleOpenHistory(){
        this.isHistoryOpen= false;
        this.invoiceHistory=[];
        getInvoiceParentHistory({parentID:this.invoiceID}).then(response=>{
            let templist=[];
                   if (response) {
                       this.createdDateTime = this.formatDateTime(response[0].Parent.CreatedDate);
                       this.createdBy = response[0].Parent.CreatedBy.Name;
                       console.log('created time ' + this.createdDateTime);
                       console.log('created by ' + response[0].Parent.CreatedBy.Name);
       
                        response.forEach(rec => {
                           let tempConRec = Object.assign({}, rec);
                           tempConRec.modifiedDateAndTime = this.formatDateTime(tempConRec.Parent.LastModifiedDate);
                           tempConRec.modifiedBy = tempConRec.Parent.LastModifiedBy.Name;
                           tempConRec.FieldName = tempConRec.Field;
                           tempConRec.Newvalue = tempConRec.NewValue ? tempConRec.NewValue : '';
                           tempConRec.Oldvalue = tempConRec.OldValue ? tempConRec.OldValue : '';
                           console.log('tempteck '+tempConRec)
                           templist.push(tempConRec) ;
                       });
                   }
        
               this.invoiceHistory=templist;
               console.log('history data new '+JSON.stringify(this.invoiceHistory));
   
           })
        console.log('falg '+this.isHistoryOpen);
    }

    closeHistory(){
        this.isHistoryOpen= true; 
        this.invoiceHistory='';
        console.log('falg '+this.isHistoryOpen);
    }
}