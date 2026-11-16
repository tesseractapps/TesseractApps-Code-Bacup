import { LightningElement,track,wire,api } from 'lwc';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import LightningConfirm from 'lightning/confirm';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent"; 
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import insertRFQ from '@salesforce/apex/RFQHandler.insertRFQ';
import getAllRFQData from '@salesforce/apex/RFQHandler.getAllRFQData';
import getAllRFQchildData from '@salesforce/apex/RFQHandler.getAllRFQchildData';
import getSearchKeys from '@salesforce/apex/InvoiceHandler.getSearchKeys';
import saveSearchKey from '@salesforce/apex/InvoiceHandler.saveSearchKey';
import sendEmail from '@salesforce/apex/RFQHandler.sendEmail';
import updateRFQ from '@salesforce/apex/RFQHandler.updateRFQ';
import getRFQHistory from '@salesforce/apex/RFQHandler.getRFQHistory';


export default class RfqComponent extends NavigationMixin(LightningElement) {
    rewards = My_Resource + '/myResource/images/RFQ.png';
    @api orgDetailsFromParent=[];
    @track isHome=false;
    @track isDefaultPAge=false;
    @track isCreateNewRFQ=false;
    @track sdate='';
    @track edate='';
    @track viewOrgDetails=false;
    @track viewOrgLabel='Show more';
    @track rfqTOData;
    @track dateIssued;
    @track duedate;
    @track fileRefrence;
    @track selectedValue; 
    @track accountRecList = [];
    @track subTotalVal=0;
    @track GSTVal=0;
    @track totalAmount=0;
    @track orgId='';
    @track orgLogo;
    @track rfqName;
    wiredRFQData;
    @track RFQdata=[];
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number 
    @track rfqFileName;  
    @track parentRfqId;
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
    @track addImport=false;
    @api orgLogo
    @track childRfqsData=[];

    @track base64string;
    @track currentUrl;
    @track isHistoryVisible=false;
    @track isHistoryOpen=true;
    @track status='Draft';
    @track sendEmailTemplate=false;
    @track emaillKeyOptions;
    @track currentEvent;
    @track toAdreess;
    @track RFQHistory;
    @track isSendButton=false;

    @track options=[
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ];
    @track statusOptions=[
        { label: 'Draft', value: 'Draft' },
        { label: 'Issued', value: 'Issued' }
    ]


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


    @wire(getAllRFQData, { sDate: '$sdate', eDate: '$edate', orgId: '$orgId' })
    wireddata(result) {
        this.wiredRFQData = result;
        //console.log('RFQ Data: ', result);
        if (result.data) {
         
            this.records= result.data.map(rec => {
                return {
                    ...rec,
                    dateIssued: rec.Date_Issued__c ? new Date(rec.Date_Issued__c).toLocaleDateString('en-GB') : '',
                };
            });
        //    console.log('records Data: ', JSON.stringify( this.records)); // Check if data is logged here    
            this.totalRecords =this.records.length; // update total records count                 
            this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
            this.pageNumber = 1;
            this.paginationHelper();
        } else if (result.error) {
            console.error('Error: ', result.error);
        }
    }
    
    connectedCallback(){
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.edate = last.toISOString().slice(0, 10); 
        console.log('Start Date >>>'+this.sdate);
        console.log('End Date >>'+this.edate);
        this.isHome=true;
        this.isDefaultPAge=true;
        
        this.orgId=this.orgDetailsFromParent.Id;
        // console.log('calling data blob', response.bolbdata);
        this.orgname =this.orgDetailsFromParent.Name;
        this.abn = this.orgDetailsFromParent.ABN__c;
        this.rcti = this.orgDetailsFromParent.RCTI__c;
        this.address =this.orgDetailsFromParent.Address_Latest__Street__s;
        this.statePostal = this.orgDetailsFromParent.Address_Latest__City__s + ',' + this.orgDetailsFromParent.Address_Latest__StateCode__s + ',' +this.orgDetailsFromParent.Address_Latest__PostalCode__s;
        this.contactNo = this.orgDetailsFromParent.Contact_No__c;
        this.bank = this.orgDetailsFromParent.Bank__c;
        this.accountNo = this.orgDetailsFromParent.Account_Number__c;
        this.accountName = this.orgDetailsFromParent.Account_Name__c;
        this.bsb = this.orgDetailsFromParent.BSB__c;
       // console.log('org logo '+JSON.stringify(this.orgLogo))
        refreshApex(this.wiredRFQData);
       
    }

    HandleRFQflag(event){
        this.isDefaultPAge=false;
        this.isCreateNewRFQ=true;
        this.RFQHistory='';
        this.rfqName ='';
        this.rfqTOData = '';
        this.amazonUrl='';
        this.dateIssued = '';
        this.selectedValue = 'Yes';
        this.fileRefrence='';
        this.status='Draft'
        this.duedate=''
        this.subTotalVal=0;
        this.GSTVal=0;
        this.totalAmount=0;
        this.isSendButton=true;
        this.isHistoryOpen=false;
        this.accountRecList=[];
        let accountRecList = [];
        this.createRow(accountRecList);
        this.accountRecList = accountRecList;
       
    }
    handleback(){
        this.isDefaultPAge=true;
        this.isCreateNewRFQ=false;
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

    changeHandler(event) {
        if (event.target.name == 'dateIssued') {
            this.dateIssued = event.target.value;
          // this.combinedDates.push(this.dateIssued);
        }
        if(event.target.name=='selectOption'){
           // console.log('Selected value '+event.target.value);
            this.selectedValue = event.target.value;
            this.subTotalVal=parseFloat(this.calCulateGST(this.accountRecList).amount).toFixed(2);
            this.GSTVal=parseFloat(this.calCulateGST(this.accountRecList).Gst).toFixed(2);
            this.totalAmount= (parseFloat(this.subTotalVal)+parseFloat(this.GSTVal)).toFixed(2); 
        }
        if(event.target.name=='rfqto'){
           // console.log('Invoie to value '+event.target.value);
            this.rfqTOData = event.target.value;
        }
        if(event.target.name=='duedate'){
            // console.log('Invoie to value '+event.target.value);
             this.duedate = event.target.value;
         }
         if(event.target.name=='FileReference'){
           //  console.log('Invoie to value '+event.target.value);
            this.fileRefrence = event.target.value;
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
        console.log('after remove total amount  '+this.calCulateGST(this.accountRecList).amount +' with GSt  '+this.calCulateGST(this.accountRecList).Gst);
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

     saveInvoiceOnly() {
        if (this.selectedValue === undefined) {
            this.selectedValue = 'Yes';
        }
        this.status = 'Draft';
    
        if (this.dateIssued === undefined || this.dateIssued === null || this.dateIssued === '') {
            this.showErrorToast('Error', 'Please provide Date Issued');
            return;
        }
        
       /*  const dueDateParts = this.duedate.split('-');
        const dueDate = new Date(parseInt(dueDateParts[0], 10), parseInt(dueDateParts[1], 10) - 1, parseInt(dueDateParts[2], 10));
       
        if (dueDate.toISOString() < new Date().toISOString()) {
            this.showErrorToast('Error', 'Due Date should not be less than today');
            return;
        }
    
        if (new Date(this.dateIssued).toISOString() < new Date().toISOString()) {
            this.showErrorToast('Error', 'Issue date should not be less than today');
            return;
        }
        if (new Date(this.duedate).toISOString() < new Date().toISOString()) {
            this.showErrorToast('Error', 'Issue date should not be less than today');
            return;
        } */
    
        const validationError = this.dueDateValidation(this.dateIssued, this.duedate);
        if (validationError) {
            this.showErrorToast('Error', 'Due Date cannot be earlier than the Date Issued.');
            return;
        }
    
        if (this.rfqTOData === undefined || this.rfqTOData === null || this.rfqTOData === '') {
            this.showErrorToast('Error', 'Please provide Invoice to');
            return;
        }
    
        if (this.fileRefrence === undefined || this.fileRefrence === null || this.fileRefrence === '') {
            this.showErrorToast('Error', 'Please provide File Reference');
            return;
        }
    
        try {
            this.validateData(this.accountRecList);
            insertRFQ({
                JsonString: JSON.stringify(this.accountRecList),
                OrgId: this.orgId,
                dateIssue: this.dateIssued,
                includeGst: this.selectedValue,
                rfqTo: this.rfqTOData,
                dueDate: this.duedate,
                fileref: this.fileRefrence,
                rfqName: this.rfqName,
                status: this.status
            })
            .then(result => {
                this.showSuccessToast('Success', 'Details Saved successfully');
                refreshApex(this.wiredRFQData);
                this.isCreateNewRFQ = false;
                this.isDefaultPAge = true;
            });
        } catch (Error) {
            this.showErrorToast('Error', Error.message);
        }
    }
    
    dueDateValidation(issue, due) {
        console.log(' issue date condition   '+new Date(issue)>new Date(due))
        if(new Date(issue)>new Date(due)){
            return true;
        }else{
            return false;
        }
    }
    
    showErrorToast(title, message) {
        const evt = new ShowToastEvent({
            title,
            message,
            variant: 'Error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }
    
    showSuccessToast(title, message) {
        const evt = new ShowToastEvent({
            title,
            message,
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }
    
    
    
  saveMultipleAccounts() {
    // console.log('SelectedValue >>>'+this.selectedValue);
    if(this.selectedValue == undefined){
        this.selectedValue = 'Yes';
    }
    this.status='Issued';
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
            message: 'Due Date cannot be earlier than the Date Issued.',
            variant: 'Error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);

    }else if(this.rfqTOData==undefined || this.rfqTOData==null || this.rfqTOData==''){
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
            console.log('JSOn data'+JSON.stringify(this.accountRecList));
            insertRFQ({ JsonString: JSON.stringify(this.accountRecList), OrgId: this.orgId, dateIssue: this.dateIssued, includeGst :this.selectedValue, rfqTo: this.rfqTOData,dueDate:this.duedate,fileref:this.fileRefrence,rfqName:this.rfqName,status:this.status })
            .then(result => {
                this.parentRfqId=result.Id;
                if(result){
                    getAllRFQchildData({parentId:result.Id}).then(response=>{
                        console.log('Result child data '+JSON.stringify(response));
                        this.childRfqsData=response;
                        this.rfqFileName = response[0].RFQ__r.Name ;
                        this.generatePDF();
                      }).catch(error=>{
        
                      })
                }
             
               // this.readInvoiceDetails();
               const evt = new ShowToastEvent({
                  title: 'Success',
                  message: 'Details Saved successfully ',
                  variant: 'success',
                  mode: 'dismissable'
              });
              this.dispatchEvent(evt);
            
              this.isCreateNewRFQ=false;
              this.isDefaultPAge=true;

             // console.log('Paged Records:', JSON.stringify(this.records));    

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
        try {
           
            this.RFQdata = [];
            // Calculate total pages
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            // Set the page number bounds
            if (this.pageNumber <= 1) {
                this.pageNumber = 1;
            } else if (this.pageNumber >= this.totalPages) {
                this.pageNumber = this.totalPages;
            }
            // Check if totalRecords exist and handle empty data gracefully
            if (!this.records || this.records.length === 0) {
                console.log('No records available to paginate.');
                return;
            }
            // Set records to display on current page
            let tempconList = [];
            for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
                if (i >= this.totalRecords) {
                    break;
                }
                let tempConRec = Object.assign({}, this.records[i]);
                tempconList.push(tempConRec);
            }
            this.RFQdata = tempconList;  
            
        } catch (Error) {
            const evt = new ShowToastEvent({
                title: 'Error',
                message: Error.message,
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }
    }

    generatePDF() {
        let fileRef;
        if(this.fileRefrence != null || this.fileRefrence !=undefined ||this.fileRefrence !=''){
             fileRef=this.fileRefrence.replaceAll(" ","-");
        }else{
            fileRef='-';
        }
        let docName=this.rfqFileName+'-'+fileRef+'.pdf';
       // console.log('docName>',docName);
        uploadFile({base64:JSON.stringify(this.generateBase64Data()), filename:docName, recordId:this.parentRfqId,obj:'RFQ'})
        .then(result=>{
            refreshApex(this.wiredRFQData);
        })            
        const evt = new ShowToastEvent({
            title: 'Success',
            message: 'Invoice Generated sucessfully '+docName,
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
      //  refreshApex(this.invoiceTable);
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
        console.log('orgname '+this.orgname);     
    
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
        doc.text("RFQ Number", 150, 24);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(this.childRfqsData[0].RFQ__r.Name, 150, 28);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RFQ Date ", 150, 34);
        doc.setFont("Helvetica", "bold");
        const oldDate = this.childRfqsData[0].RFQ__r.Date_Issued__c;
        const arr = oldDate.split('-');
        const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];       
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(newDate, 150, 38);
    
      /* top  left side box end  */

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RFQ to: ", 22, 65);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);
        doc.text(this.childRfqsData[0].RFQ__r.RFQ_To__c,39, 65);
        doc.setFontSize(12);
        doc.setFont("Helvetica", "bold");
        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(20, 71, 170, 5,"FD");

        doc.text("Description ", 22, 75);
        doc.text("Quantity", 110, 75);
        doc.text("Unit Price", 140, 75);
        doc.text("Amount", 173, 75);
        doc.setFont("Helvetica", "normal");
        // Manually placing each item
        let yPosition = 82;
        this.childRfqsData.forEach(record => {
            let availableSpace = doc.internal.pageSize.height - yPosition;
            if (availableSpace < 30) {  // If there's less than 30 units of space, add a new page
             doc.addPage();
             yPosition = 35;  // Reset yPosition to the starting position for the new page
         }
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
            doc.text(record.Quantity__c.toFixed(2), 110, yPosition);
            doc.text(record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD', }), 140, yPosition);
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
        doc.text('$'+this.childRfqsData[0].RFQ__r.Total_Amount__c.toFixed(2), 173, yPosition);
    
        yPosition += 6;
        doc.text("Total GST:", 140, yPosition);
        doc.text('$'+this.childRfqsData[0].RFQ__r.Total_GST__c.toFixed(2), 173, yPosition);

        doc.setFont("Helvetica", "bold");
        yPosition += 3;
        // Draw the line at the new yPosition
        doc.line(100, (yPosition),190, (yPosition),'F');
        yPosition += 6;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Total:", 140, yPosition);
        doc.text('$'+this.childRfqsData[0].RFQ__r.Total__c.toFixed(2), 173, yPosition);

        console.log('y position' +yPosition);
        console.log('total height  ' +doc.internal.pageSize.height);
    
        let availableSpace = doc.internal.pageSize.height-yPosition;
        console.log('available Space ' +availableSpace);
       /*  doc.setFont("Helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Office Use Only", 90, 290); */
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

    handleedit(event){
        this.isCreateNewRFQ = true;
        this.isDefaultPAge=false;
        this.accountRecList=[];
        let accountRecList = [];
        console.log('id '+event.currentTarget.dataset.id);
        this.parentRfqId=event.currentTarget.dataset.id;
        this.isHistoryVisible=true;
        this.isHistoryOpen= true; 
        this.RFQHistory='';
        getAllRFQchildData({parentId:this.parentRfqId}).then(response=>{
            this.childRfqsData=response;
            this.rfqName = response[0].RFQ__r.Name;
            this.rfqTOData = response[0].RFQ__r.RFQ_To__c;
            this.amazonUrl=response[0].RFQ__r.Amazon_Url__c;
            this.dateIssued = response[0].RFQ__r.Date_Issued__c;
            this.selectedValue = response[0].RFQ__r.Include_GST__c;
            this.fileRefrence=response[0].RFQ__r.File_Reference__c;
            this.duedate=response[0].RFQ__r.Due_Date__c
            accountRecList = response.map((rec, index)=>{
                return{ 
                    index: (index+1), Description:rec.Description__c,Quantity:rec.Quantity__c,UnitPrice:rec.Unit_Price__c
                }
            });
            //this.addRow();
            this.createRow(this.accountRecList);
            this.accountRecList = accountRecList;
            this.subTotalVal=parseFloat(this.calCulateGST(this.accountRecList).amount).toFixed(2);
            this.GSTVal=parseFloat(this.calCulateGST(this.accountRecList).Gst).toFixed(2);
            this.totalAmount= (parseFloat(this.subTotalVal)+parseFloat(this.GSTVal)).toFixed(2);
             this.status=response[0].RFQ__r.Status__c;
             if( this.status=='Issued'){
                this.isSendButton=false;
             }else{
                this.isSendButton=true;
             }
        });  
    }

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;   
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome=true;
        this.sendEmailTemplate=false;
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

        handleEmailpdf(){
            try{
                let fileRef;
               
            if(this.fileRefrence != null || this.fileRefrence !=undefined ||this.fileRefrence !=''){
                 fileRef=this.fileRefrence.replaceAll(" ","-");
            }else{
                fileRef='-';
            }
            let docName= this.rfqName+'-'+fileRef+'.pdf';
            console.log('doc name'+docName);
            console.log('base 64 '+JSON.stringify(this.generateBase64Data()));
            
            sendEmail({ base64: JSON.stringify(this.generateBase64Data()) ,staffEmail:this.toAdreess,orgName:this.orgname,fileName:docName}).then(result => {
                const evt = new ShowToastEvent({
                    title: 'Success',
                    message: 'Email has been sent successfully ',
                    variant: 'success',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                updateRFQ({parentID:this.parentRfqId}).then(result=>{
                }); 
                this.isCreateNewRFQ=false;
                this.isDefaultPAge=true;
                this.sendEmailTemplate=false;
                });
            }catch(error){
                console.log('error '+(error));
                const evt = new ShowToastEvent({
                    title: 'Error',
                    message: error.message,
                    variant: 'Error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
            }
            
        }
        saveSearchKeyToApex(emailKey) {
            console.log('to  email  '+ emailKey);
            saveSearchKey({ emailKey: emailKey }).then(response=>{
                console.log('Search key saved successfully.'+JSON.stringify(response));
               });
        }

        HandleOpenHistory(){
            this.isHistoryOpen= false;
            this.RFQHistory=[];
            getRFQHistory({parentID:this.parentRfqId}).then(response=>{
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
            
                   this.RFQHistory=templist;
                   console.log('history data new '+JSON.stringify(this.RFQHistory));
       
               })
            console.log('falg '+this.isHistoryOpen);
        }
    
        closeHistory(){
            this.isHistoryOpen= true; 
            this.RFQHistory='';
            console.log('falg '+this.isHistoryOpen);
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
        Handlerefresh(){
            refreshApex(this.wiredRFQData);
        }
    

}