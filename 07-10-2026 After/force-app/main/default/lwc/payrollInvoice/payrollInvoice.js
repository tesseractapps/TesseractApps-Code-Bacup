import { LightningElement,track,wire,api } from 'lwc';
import insertInvoice from '@salesforce/apex/InvoiceHandler.insertInvoice';
import listofInvoicesParent from '@salesforce/apex/InvoiceHandler.listofInvoicesParent';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
//import emailAttach from '@salesforce/apex/SingleEmailAttachment.emailAttach';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import listofInvoices from '@salesforce/apex/InvoiceHandler.listofInvoices';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import LightningConfirm from 'lightning/confirm';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent"; 
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { refreshApex } from '@salesforce/apex';
//import saveFile from '@salesforce/apex/InvoiceHandler.saveFile';
import getInvoiceListInPayroll from '@salesforce/apex/ServiceSupportPlanHandler.getInvoiceListInPayroll';
import updateInvoice from '@salesforce/apex/InvoiceHandler.updateInvoice';
import getSearchKeys from '@salesforce/apex/InvoiceHandler.getSearchKeys';
import saveSearchKey from '@salesforce/apex/InvoiceHandler.saveSearchKey';
import sendEmail from '@salesforce/apex/InvoiceHandler.sendEmail';
import { NavigationMixin } from 'lightning/navigation';
import getInvoiceParentHistory from '@salesforce/apex/InvoiceHandler.getInvoiceParentHistory';
import autoTable from '@salesforce/resourceUrl/autotable';
import robotoFont from '@salesforce/resourceUrl/Roboto';

let invoiceList = [];
export default class PayrollInvoice extends NavigationMixin(LightningElement) {

    rewards = My_Resource + '/myResource/images/invoice.svg';

    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page

    @track invoiceTable=[];
    @track edate;
    @track sdate;
    @track isInvoiceflag = false;
    @track dateIssued;
    @track taxinvoice;
    @track description;
    @track quantity;
    @track unitPrice;
    @track orgId;
    @track orgLogo;
    @track index=1;
    @track delIndex;
    @track isnewPaySetting = false;
    @track payrunSetting;
    @track payrun;
    @track currentRecordPdf;
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
    @track invoiceDeleteFlag=false;
    parentInvId;
    @track base64string;
    @track invRecords;
    @track invoiceData;
    @track subTotal;
    @track gst;
    @track isInvoiceflag=false;
    @track invoiceflag=false;
    @track taxinvoice;
    @track dateIssued;
     
    @track quantity;
    @track unitPrice;
    @track selectedValue='Yes';
    @track invoiceID;
    @track invoiceFileName;
    @track invlist=[];
    @track invoiceList = [];
    /* @track invoicetype;
    @track serviceInvoiceFlag;
    @track payRollinvoiceFlag;*/
    @track datesFlag=true; 
    @track invoiceToData;
    @track emaillKeyOptions;
    @track isRFQEnabled=false;
    @track handleSendEmailFlag=false;
    

    @track options=[
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ]
    @track InvoiceOptions=[
        { label: 'Payroll Invoice', value: 'PayrollInvoice' },
        {label: 'Service Invoice', value: 'ServiceInvoice' }]
    @track statuOptions=[
        { label: 'Draft', value: 'Draft' },
        { label: 'Issued', value: 'Issued' },
        { label: 'Received', value: 'Received' },
        ]

    @track accountRecList = [];
     /*   {
            description: '',           
            quantity: '',
            unitPrice: '',
            key: ' ' //this.index
        }
    ];*/

    get isDesktop() {        
        return FORM_FACTOR === 'Large';
    }
    
    get isMobile() {       
        return FORM_FACTOR === 'Small';
    }

    @api reload(){
      this.invoiceflag=true; 
      this.isInvoiceflag=false; 
    }

    renderedCallback() {
        if (this.jsPDFInitialized) {
            return; // Prevent reloading scripts multiple times
        } 
        Promise.all([
         // loadScript(this, Dompurify),
         
           loadScript(this, jsPDF),
          loadScript(this, autoTable),
          //this line of code is for using custom font in jspdf because jspdf supports only few fonts like courier,times-roman and helvitica.
          //to use custom font we have downloaded the font from google which is .ttf converted ttf to js and upload in static resource.
          loadScript(this, robotoFont)
         
           ]).then(() => {   
              this.jsPDFInitialized = true;
             console.log('✅ jsPDF and ROBOTO font loaded');
  
             // ✅ Register the Roboto font manually
             if (window.jspdf && window.callAddFont) {
                 window.jspdf.jsPDF.API.events.push(['addFonts', window.callAddFont]);
                 console.log('✅ Roboto font registered via callAddFont');
             } else {
                 console.warn('⚠️ callAddFont or jsPDF not available in window scope');
             }
  
             // Verify if font is registered
             const { jsPDF } = window.jspdf;
             const doc = new jsPDF();
             console.log('🧾 Available fonts:', doc.getFontList());  
            // console.log("JS loaded jsPDF");
           }).catch(error => {
            // console.error("Error " + error);
           });;
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
        this.isRFQEnabled=false;   
    }

    hadleDates(event) {
        var sname = event.target.name;

        if (event.target.name == 'sdate') {
            this.sdate = event.detail.value;
            
        }
        if (event.target.name == 'edate') {
            this.edate = event.detail.value;
        }
         this.readInvoiceDetails()
    }

    @track isPreview=false;
    handlePreview(event) {
        let parentInvId = event.currentTarget.dataset.id;
        let parentInvName  = event.currentTarget.dataset.name;
        this.invoiceFileName = parentInvName;
        this.invoiceID = parentInvId;
       // console.log("parentInvoice>>>", parentInvId);
        listofInvoices({ invParentId: parentInvId }).then(response => {
            console.log('data for pdf ', JSON.stringify(response));
            this.invRecords = response;
            this.generatePDF();
            this.isPreview=true;
        });
    }

     handleDelete(event) {
      
         this.parentInvId = event.currentTarget.dataset.id;
         this.invoiceDeleteFlag=true;
       
        
    }
    handledelete(event){
             let tempconList=[];
             deleteRecord(this.parentInvId).then(() => {
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
             this.invoiceDeleteFlag=false;
    }
    handledeleteclose(event){
        this.invoiceDeleteFlag=false;
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

  
   @track slno;
    generatePDF() {
        let fileRef;
        if(this.fileRefrence != null || this.fileRefrence !=undefined ||this.fileRefrence !=''){
             fileRef=this.fileRefrence.replaceAll(" ","-");
        }else{
            fileRef='-';
        }
        let docName=this.invoiceFileName+'-'+fileRef+'.pdf';
       // console.log('docName>',docName);
        uploadFile({base64:JSON.stringify(this.generateBase64Data()), filename:docName, recordId:this.invoiceID,obj:'invoiceParent'})
        .then(result=>{
           // console.log('data', result);                    
            //this.handleInvoicFlag();
           // console.log('Upload result = ' +result);
            this.fileName = this.fileName + ' - Uploaded Successfully'; 
        })            
        const evt = new ShowToastEvent({
            title: 'Success',
            message: 'Invoice Generated sucessfully '+docName,
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
        refreshApex(this.invoiceTable);
    }

    handleInvoicFlag() {
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
    handleback(){
        this.isInvoiceflag = false;
        this.invoiceflag=true;

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
            this.invoiceFileName = response[0].Invoice_Parent__r.Name;
            this.invoiceToData = response[0].Invoice_Parent__r.Invoice_To__c;
            this.amazonUrl=response[0].Invoice_Parent__r.Amazon_URL__c;
            this.dateIssued = response[0].Invoice_Parent__r.Date_Issued__c;
            this.selectedValue = response[0].Invoice_Parent__r.Include_GST__c;
            this.invoiceStatus=response[0].Invoice_Parent__r.Status__c;
            this.fileRefrence=response[0].Invoice_Parent__r.File_Reference__c;
            this.duedate=response[0].Invoice_Parent__r.Due_Date__c
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

            if(this.invoiceStatus=='Issued' || this.invoiceStatus=='Received' ){
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
            else if (this.invoiceStatus =='Received') { 
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
    //sowmya new code begins
  async handleReceived(){
            let finalStatus ;
            let message;
            if (this.invoiceStatus =='Issued') {
                finalStatus = 'Received';
                message = 'Status marked as Received';
            
            }
            else if (this.invoiceStatus =='Received') {
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
    handleOpenEmail(){
        this.sendEmailTemplate=true;
    }

    hadleEmailChange(event){
        this.currentEvent='';
        this.toAdreess=event.detail.value;
        this.currentEvent=event.target.name
    }


 handleSendEmail(){   
            if (this.toAdreess &&this.currentEvent=='emaiText') {
                this.handleSendEmailFlag=true;
            } 
            if(this.toAdreess && this.currentEvent=='emaildropDown'){
                this.handleEmailpdf();
            }
        }
        handleEmail(event){
            if (this.toAdreess &&this.currentEvent=='emaiText') {  
                this.saveSearchKeyToApex(this.toAdreess);
                    this.handleEmailpdf();
                }
                this.handleSendEmailFlag=false;
        }
        handleEmailclose(event){
            this.handleEmailpdf();
            this.handleSendEmailFlag=false;
            
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

        generateBase64Data() { 
            const { jsPDF } = window.jspdf;
            var doc = new jsPDF();
            var statePostalWithoutCommas = this.statePostal.replace(/,/g, " "); 
            
           // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );
        
           doc.setFont("Roboto-Bold", "bold");
            //doc.setFontSize(20);
            //doc.text("DRAFT INVOICE", 20,25 );
            doc.setTextColor(0,102,255);
            doc.setFontSize(12);
            doc.text(this.orgname.toUpperCase(), 10, 25);  
            console.log('orgname '+this.orgname);     
        
            doc.setTextColor(0,0,0);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text("ABN: "+this.abn, 10, 30);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        
            
              doc.setFontSize(10);
            doc.text(this.address+",", 10,35 );
            doc.text(statePostalWithoutCommas+",", 10, 40);
            doc.text("Contact: "+this.contactNo, 10, 45);
        
            /* top  left side box start  */
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
           // doc.text("Invoice Number", 150, 24);
            doc.text("TAX  INVOICE", 134, 25);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text(this.invRecords[0].Invoice_Parent__r.Name, 134, 30);

           
            const oldDate = this.invRecords[0].Invoice_Parent__r.Date_Issued__c;
            const arr = oldDate.split('-');
            const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];       
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Date Issued: "+newDate, 134, 35);

            
        
            
            const oldsDate = this.sdate;
            const sarr = oldsDate.split('-');
            const newsDate = sarr[2]+'/'+sarr[1]+'/'+sarr[0];
            const oldeDate = this.edate;
            const earr = oldeDate.split('-');
            const neweDate = earr[2]+'/'+earr[1]+'/'+earr[0];
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Billing Period: "+newsDate+" to "+neweDate, 134, 40);
            const DueDate = this.invRecords[0].Invoice_Parent__r.Due_Date__c;
            const darr = DueDate.split('-');
            const DDate = darr[2]+'/'+darr[1]+'/'+darr[0];       
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Due Date: "+DDate, 134, 45);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            /* doc.text(this.invRecords[0].Invoice_Parent__r.Invoice_To__c,59, 65); */
            doc.text("TAX INVOICE To: " + this.invRecords[0].Invoice_Parent__r.Invoice_To__c, 10, 72);
           
            
            function addFooter(doc) {
              let pageHeight = doc.internal.pageSize.height; // Get page height
              let footerY = pageHeight; // Footer position
          
              // Draw footer line
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.2);
              doc.line(0, footerY - 12, 210, footerY - 12);
          
              // Footer text
              doc.setFontSize(10);
              const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
              const img = new Image();
              img.src = logo;
              
              doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); 
              doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
              doc.setTextColor(0, 0, 0);
              doc.text("Powered by", 10, footerY-5);
              
              // Centered Footer Text
              doc.setFontSize(10);
              doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
              doc.setTextColor(0, 0, 0);
              doc.text("Office Use Only", 90, footerY-5);
          
              // Page Number
              doc.setFontSize(10);
              doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
              doc.text(`${doc.internal.getNumberOfPages()}`, 200, footerY-5);
          }
            
            
            let yPosition = 82; 
            var result = [];
            var subTotal = 0;
            console.log('INVOICE'+JSON.stringify(this.invRecords));
            this.invRecords.forEach(record => {
                subTotal += record.Amount__c;
            
                result.push([
                    record.Description__c,
                    record.Quantity__c.toFixed(2),
                    record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    "10%", // Tax column
                    record.Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                ]);
            });
            
            
            // Adding subtotal, GST, and total rows
            result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' + this.invRecords[0].Invoice_Parent__r.Total_Amount__c.toFixed(2)]);
            result.push(["", "", "", "Total GST:", '$' + this.invRecords[0].Invoice_Parent__r.Total_GST__c.toFixed(2)]);
            result.push(["", "", "", "Total:", '$' + this.invRecords[0].Invoice_Parent__r.Total__c.toFixed(2)]);
           console.log('RESULT'+JSON.stringify(this.result));
            // Generating table using autoTable
            doc.autoTable({
                startY: yPosition, // Starting Y position
                head: [["Description", "Qty", "Rate", "Tax", "Amount"]],
                body: result,
                theme: "plain",
                /* styles: { halign: "left" }, */
                margin: { left: 10 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
                bodyStyles: { font: "Helvetica", font: "Roboto-VariableFont_wdth,wght", fontStyle: "normal", },
                /* bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] }, */
                columnStyles: {
                  0: { cellWidth: 80, halign: "left" },  // Description left-aligned
                  1: { cellWidth: 25, halign: "left" },  // Qty left-aligned
                  2: { cellWidth: 25, halign: "left" },  // Rate left-aligned
                  3: { cellWidth: 25, halign: "right" }, // Tax right-aligned
                  4: { cellWidth: 35, halign: "right" }  // Amount right-aligned
                },
                didParseCell: function (data) {
                  var columnText = data.row.raw[3]; // Get column text
                  if (data.row.index === 0) { 
                    if (data.column.index === 3 || data.column.index === 4) {
                        data.cell.styles.halign = "right";
                    } else {
                        data.cell.styles.halign = "left";
                    }
                }
                  // Make Sub Total, Total GST, and Total bold
                  if ([ "Total:"].includes(columnText)) {
                   data.cell.styles.font = "Roboto-Bold"; 
                   data.cell.styles.fontStyle = "bold";
                  }
              },
                didDrawCell: function (data) {  
                  var doc = data.doc;
                  var cell = data.cell;
                  var rowIndex = data.row.index;
                  var totalRowsCount = result.length; // Total rows including subtotal, GST, and total
                  
                  // Get the text of the fourth column (index 3) to check row type
                  var columnText = data.row.raw[3]; 
          
                  // Apply border only to normal rows & total row
                  if (!["Sub Total:", "Total GST:"].includes(columnText)) {
                      doc.setDrawColor(0, 0, 0); // Black border
                      doc.setLineWidth(0.2);
          
                      // Top border (for first row or total row)
                      if (rowIndex === 0) { 
                          doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
                      }
          
                      // Bottom border (for normal rows and total row)
                      if (rowIndex < totalRowsCount - 1 ) {
                          doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
                      }
                      
                  }
                  if (columnText === "Total:") {
                    doc.setDrawColor(0, 0, 0); // Black border
                    doc.setLineWidth(0.2);
                    
                    if (data.column.index === 4 || data.column.index === 3 ) {
                     
                      // Top border
                      doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
          
                      // Bottom border
                      doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
                  }
                   
                    
                }
              },
              didDrawPage: function (data) {
                
                // Always add the footer on each page
                addFooter(data.doc);
            }
            });
          
            let finalYPosition = doc.lastAutoTable.finalY;
           // addFooter(doc);

           
        
            let availableSpace = doc.internal.pageSize.height-finalYPosition;
            console.log('available Space ' +availableSpace);
            
            if(availableSpace >100){
                // Adding payment details at the bottom
                yPosition=finalYPosition + 35;
                doc.setDrawColor(0, 0, 0); // Black color
                doc.setLineWidth(0.5);
                doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
                doc.line(10, yPosition, 200, yPosition); // (startX, startY, endX, endY)
                doc.setLineDash();
                
                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Payable to", 10, yPosition + 6);
                
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Bank", 10, yPosition + 12);
                doc.text(":", 40, yPosition + 12);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bank || " ", 42, yPosition + 12);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Name", 10, yPosition + 16); 
                doc.text(":", 40, yPosition + 16);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountName || " ", 42, yPosition + 16);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("BSB", 10, yPosition + 20); 
                doc.text(":", 40, yPosition + 20);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bsb || " ", 42, yPosition + 20);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Number", 10, yPosition + 24);
                doc.text(":", 40, yPosition + 24);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountNo || " ", 42, yPosition + 24);

                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Terms & Conditions:", 10, yPosition + 44);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.setTextColor(169, 169, 169);
                doc.text("All terms and conditions apply.", 10, yPosition + 48);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                addFooter(doc);

            }else{
                doc.addPage();

                yPosition = 25;
                doc.setDrawColor(0, 0, 0); // Black color
                doc.setLineWidth(0.5);
                doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
                doc.line(10, yPosition, 200, yPosition); // (startX, startY, endX, endY)
                doc.setLineDash();
                
                
                
                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Payable to", 10, yPosition + 6);
                
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Bank", 10, yPosition + 12);
                doc.text(":", 40, yPosition + 12);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bank || " ", 42, yPosition + 12);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Name", 10, yPosition + 16); 
                doc.text(":", 40, yPosition + 16);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountName || " ", 42, yPosition + 16);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("BSB", 10, yPosition + 20); 
                doc.text(":", 40, yPosition + 20);       
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bsb || " ", 42, yPosition + 20);

                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Number", 10, yPosition + 24);
                doc.text(":", 40, yPosition + 24);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountNo || " ", 42, yPosition + 24);

                doc.setFontSize(10);
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Terms & Conditions:", 10, yPosition + 44);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.setTextColor(169, 169, 169);
                doc.text("All terms and conditions apply.", 10, yPosition + 48);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

                addFooter(doc);
            }
           
        
            this.base64string = btoa(doc.output());
          //  console.log('Generated PDF Base64: ' + this.base64string);
        
            return this.base64string;
        }
        
     saveSearchKeyToApex(emailKey) {
        console.log('to  email  '+ emailKey);
        saveSearchKey({ emailKey: emailKey }).then(response=>{
            console.log('Search key saved successfully.'+JSON.stringify(response));
           });
    }

    changeHandler(event) {
        /* if (event.target.name == 'taxinvoice') {
            this.taxinvoice = event.target.value;
        } */
        if (event.target.name == 'dateIssued') {
            this.dateIssued = event.target.value;
          //  this.combinedDates.push(this.dateIssued);
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
        
    }
    @track subTotalVal=0;
    @track GSTVal=0;
    @track totalAmount=0;
    @track duedate;
    @track invoiceStatus='Draft';
    @track fileRefrence;
    @track isModalOpen = false;
    @track currentUrl;
    @track viewOrgDetails=false;
    @track viewOrgLabel='Show more';
    @track isSendButton=false;
    @track isReceived=false;
    @track combinedDates=[];
     @track isHistoryOpen=true;

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
                message: 'Due Date cannot be earlier than the Date Issued.',
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
               
                insertInvoice({ JsonString: JSON.stringify(this.accountRecList), OrgId: this.orgId, dateIssue: this.dateIssued, invoice: this.taxinvoice, includeGst :this.selectedValue, invoiceTo: this.invoiceToData,dueDate:this.duedate,invoiceStatus:this.invoiceStatus,fileref:this.fileRefrence,invName:this.invoiceFileName })
                .then(result => {
                    this.isInvoiceflag = false;
                    this.invoiceflag=true;
                    this.readInvoiceDetails();

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
                message: 'Due Date cannot be earlier than the Date Issued.',
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
                insertInvoice({ JsonString: JSON.stringify(this.accountRecList), OrgId: this.orgId, dateIssue: this.dateIssued, invoice: this.taxinvoice, includeGst :this.selectedValue, invoiceTo: this.invoiceToData,dueDate:this.duedate,invoiceStatus:'Issued',fileref:this.fileRefrence,invName:this.invoiceFileName })
                .then(result => {
                   // console.log('602 result >>>'+JSON.stringify(result));
                   // console.log("create Invoice");                    
                    this.invoiceID = result.Id;
                   // console.log("parentInvoice>>>", this.invoiceID);
                    listofInvoices({ invParentId: this.invoiceID }).then(response => {
                        //console.log('data of ', JSON.stringify(response));
                        this.invRecords = response;
                        this.invoiceFileName = response[0].Invoice_Parent__r.Name;
                        this.invoiceToData = response.Invoice_To__c;
                        this.generatePDF();
                        this.isInvoiceflag = false;
                        this.invoiceflag=true;
                        this.readInvoiceDetails();
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

    dueDateValidation(issue,due){
        if(new Date(issue)>new Date(due)){
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
        //console.log('tempconrec>>'+JSON.stringify(this.invoiceTable));       
    }

    readInvoiceDetails(){
           this.invoiceTable=[];
            let tempconList=[];
            this.records=[];
            listofInvoicesParent({ sDate: this.sdate, eDate: this.edate }).then(response => {
                response.forEach((record) => {
                    let tempConRec = Object.assign({}, record);
                    tempConRec.dateIssued = new Date(tempConRec.Date_Issued__c).toLocaleDateString('en-GB');
                    //tempConRec.descName = new Date(tempConRec.Date_Issued__c.slice(0, 10)).toLocaleString('en-us', { month: 'short', year: 'numeric' });
                    if(tempConRec.Is_Created_From_CSV__c==true){
                        tempConRec.gst = tempConRec.Total_CSV_GST__c.toFixed(2);
                        tempConRec.amount = tempConRec.Final_CSV_Total__c.toFixed(2);
                    }else{
                        tempConRec.gst = tempConRec.Total_GST__c.toFixed(2);
                        tempConRec.amount = tempConRec.Total_Amount__c.toFixed(2);
                    }
                   
                   /*  if(record.Invoices__r[0].Description__c == undefined || record.Invoices__r[0].Description__c == null){
                        tempConRec.Description = '';
                    } else {
                        tempConRec.Description = record.Invoices__r[0].Description__c;
                    } */

                    if(tempConRec.File_Reference__c ==undefined ||  tempConRec.File_Reference__c == null){
                        tempConRec.fileReference='';
                    }else{
                        tempConRec.fileReference=tempConRec.File_Reference__c;
                    }
                    tempConRec.amazonUrl = tempConRec.Amazon_URL__c;
                    tempConRec.fileName = tempConRec.Invoice_To__c;
                    tempConRec.Status = tempConRec.Status__c;
                    
                    tempconList.push(tempConRec);
                })
               // this.invoiceTable = tempconList;
               
                this.records = tempconList;  
               // console.log('payroll invoice >>'+JSON.stringify(this.records));
                this.serviceInvoice();
                        
            })
        
       
    }

    serviceInvoice(){
        let tempconList=[];
        getInvoiceListInPayroll({orgId:this.orgId,sDate: this.sdate, eDate: this.edate }).then(record=>{
            //this.records=record;
            record.forEach(rec=>{
                let tempConRec ={};
                tempConRec.Id=rec.Id;
                tempConRec.dateIssued = new Date(rec.Date_of_Invoice__c).toLocaleDateString('en-GB');
                // tempConRec.descName = tempConRec.Date_Format__c;
                if(rec.Total_GST__c){
                    tempConRec.gst = rec.Total_GST__c;
                }else{
                    tempConRec.gst = 0
                   
                }
                tempConRec.Name=rec.Name;
                tempConRec.amazonUrl = rec.Amazon_Service_URL__c;
               /*  if(rec.Description__c == undefined || rec.Description__c == null){
                    tempConRec.Description = '';
                } else{
                    tempConRec.Description = rec.Description__c;
                } */

                tempConRec.fileReference='';
                tempConRec.fileName = rec.File_Name__c;
                if(rec.Amount__c){
                    tempConRec.amount = rec.Amount__c;
                }else{
                    tempConRec.amount = 0;
                }
                tempConRec.Status = rec.Status__c;
                tempConRec.ServiceInvoice = rec.Is_Service_Invoice__c;               
                tempconList.push(tempConRec);  
            }) ;
           // console.log("service invoice >>>"+JSON.stringify(tempconList));
            this.records = this.records.concat(tempconList); // Combine the records from both methods
            this.totalRecords = this.records.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
            this.paginationHelper();
        }).catch(error=>{
           // console.log('error '+error);
        })
    }

    @track invoiceHeader = ['Date of Issue (yyyy-mm-dd)', 'Include GST','Description', 'Quantity', 'Unit Price' ];
    
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
    

    //Import CSV File Code implemented by maheswari
    handleImport(){        
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                
                pageName: 'importexpenseinvoice'
            },
        });    
    }

    hideModalBox(){
        this.isInvoiceflag=false; 
        this.isFileAttached=false; 
        this.addImport=false;     
    }
    
    handleFilesChange(event) {
        if (event.target.files.length > 0) {        
            this.filesUploaded = event.target.files;        
            this.fileName = this.filesUploaded[0].name;        
        }        
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

    getFileName(url) {
        return url.substring(url.lastIndexOf('/') + 1);
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
    HandleRFQ(event){
        // Handle toggle input
        if (event.target.type === 'toggle') {
            this.isRFQEnabled = event.target.checked;  // Will be true if checked, false if unchecked
           
        }
       
        console.log('Toggle value: ' + this.isRFQEnabled );
    }
}