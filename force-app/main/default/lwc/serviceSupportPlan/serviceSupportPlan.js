import { LightningElement, track, wire,api } from 'lwc';
import serviceSupportList from '@salesforce/apex/ServiceSupportPlanHandler.serviceSupportList';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchFiles from '@salesforce/apex/ServiceSupportPlanHandler.fetchFiles';
import fetchSupId from '@salesforce/apex/ServiceSupportPlanHandler.fetchSupId';
import getSupportData from '@salesforce/apex/ServiceSupportPlanHandler.getSupportData';
import InsertServiceInvoice from '@salesforce/apex/ServiceSupportPlanHandler.InsertServiceInvoice';
import getInvoices from '@salesforce/apex/ServiceSupportPlanHandler.getInvoices';
//sowmya
import getClientFunds from '@salesforce/apex/ServiceSupportPlanHandler.getClientFunds';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
//import 'jspdf-autotable';
//import jspdfautotable from '@salesforce/resourceUrl/jspdfautotable';
import autoTable from '@salesforce/resourceUrl/autotable';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getOrgName from '@salesforce/apex/TaskCreateHandler.getOrgName';
import getNDISServiceLineItem from '@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem';
//maheswari
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import UserType from '@salesforce/schema/User.User_Type__c'; 
import My_Resource from "@salesforce/resourceUrl/myResource";
import robotoFont from '@salesforce/resourceUrl/Roboto';
//import updateServiceStatus from '@salesforce/apex/ServiceSupportPlanHandler.updateServiceStatus';

const actions = [   
    { label: 'Edit', name: 'edit' }   
 ];

export default class ServiceSupportPlan extends NavigationMixin(LightningElement) {
    
    //Nagendra code for Pagination Start
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track isEdit=false;
    @track invoiceFileName='';
    @track invoiceId='';
    @track invoiceDate;
    @track checkStatus='';
    @track participantlogin = false;
    activeSections = ['Services', 'Service Agreement', 'Invoices'];

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    //Nagendra code for Pagination End
    @track pageSizeOptions1 = [10, 25, 50, 75, 100];
    @track pageSize1;
    @track totalPages1; 
    @track pageNumber1 = 1;
    @track records1 = [];
    get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }
 
    @track serviceNameValue;
    @track serviceStatusValue;
    @track serviceStartDateValue;
    @track serviceEndDateValue;
    @track pageNumber;
    @track creaetServiceFlag = false;
    @track listofSericeFlag = true;
    @track imageUploadFlag=false;
    @track fileNameFlag=true;
    @track isOpenModal=false;
    @track funddata;
    @track openservice=false;
    @api servicerecordId;
    @api clientId;
    @track showfunds =false;
    @track selectedfund;
    @track invoiceTable=[];
    @track isInvoiceflag=false;
    @track invoiceflag=false;
    @track error;
    @track accList;
    @track recordId;    
    @track lstAllFiles;
    @track error;
    @track imagelistFlag;
    @track newSupId;   
    @track disableBool = true;
    @track invRecords = [];
    @track insertedInvoice=[];
    @track pdfInvoiceRecords = [];
    StaffName;
    ServiceIds;
    @track invoiceList=[];
    @track selectedServicesId;
    fileData
    @track isStaffName = false;
    @track popUpData=[];
    @track popupvisible=false;
    @track orgName;
    @track services;
    @track orgNames;
    @track orgStreet;
    @track stateCode;
    @track postalCode;
    @track countryCode;
    @track orgCity;
    @track contactNo;
        
    @track serviceGroupName=[];
    @track selectedServiceIds;
    @track lstServiceSelectedRecords;
    @track selectedNdisIdValue;
    @track ndisName;
    @track ndisState;
    @track plantype;
    @track startTimePickval;
    @track endTimePickval;
    @track fundOption=[];
    @track stateValue='';
    @track NdisServiceGroupNameinEdit=false;
    wireServiceList;
    @track showLoadingSpinner=false;
    @track sectionFlags = {
        Services: true,
        ServiceAgreement: true,
        Invoice: true,        
    };

    @track sectionIcons = {
        Services: '\u2B9F', 
        ServiceAgreement: '\u2B9F',
        Invoice: '\u2B9F',
    };
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute
        // Toggle the flag and update the icon dynamically
        this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
    } 

    get stateOptions(){
        return [
          { label: 'ACT', value: 'ACT__c' },
          { label: 'NSW', value: 'NSW__c' },
          { label: 'NT', value: 'NT__c' },
          { label: 'QLD', value: 'QLD__c' },
          { label: 'SA', value: 'SA__c' },
          { label: 'TAS', value: 'TAS__c' },
          { label: 'VIC', value: 'VIC__c' },
          { label: 'WA', value: 'WA__c' },
      ];
      }
    stateChange(event){
        let stateName = event.target.value;
        //console.log('StateName>>>'+stateName);
        if (stateName == '')
        {   
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: '',
                }
            ];
        }
        if (stateName == "ACT")
        {   
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'ACT__c',
                }
            ];
        }
        if (stateName == "NSW")
        {
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'NSW__c',
                }
            ];
        }        
        if(stateName == 'NT'){
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'NT__c',
                }
            ];           
        }
        if(stateName == 'QLD'){
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'QLD__c',
                }
            ];           
        }
        if(stateName == 'SA'){
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'SA__c',
                }
            ];           
        }
        if(stateName == 'TAS'){
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'TAS__c',
                }
            ];           
        }
        if(stateName == 'VIC'){
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'VIC__c',
                }
            ];           
        }        
        if(stateName == 'WA'){
            this.ndisState= [
                {
                label: 'Registration Group Name	',
                fieldName: 'Name'        
                },
                {
                    label: 'Support Item Name',
                    fieldName: 'Support_Item_Name__c',
                   
                },
                {
                    label: 'Support Item Number',
                    fieldName: 'Support_Item_Number__c',
                    
                },
                {            
                    label: 'Amount',
                    fieldName: 'WA__c',
                }
            ];           
        }
    }
    
    @track columns = [
        {
        label: 'Resource Name',
        fieldName: 'Resource_Name__c',
        initialWidth: 150
        },
        {
            label: 'Service Type',
            fieldName: 'Service_Type_Name__c',
            initialWidth: 150,            
            wrapText:true
        },
        {
            label: 'Line Item',
            fieldName: 'Lineitem__c',
            initialWidth: 140
        },
        {
            label: 'Available Funds',
            fieldName: 'Available_Fund__c',
            initialWidth: 150,
            type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {
            label: 'Service Date',
            fieldName: 'Date_of_Service__c',
            initialWidth: 130,
            type: 'date',
            typeAttributes:
                {
                    month: "2-digit",day: "2-digit",year: "numeric"
                }
        },
        {
            label: 'Qty',
            fieldName: 'Qty__c',
            initialWidth: 70
        },
        {
            label: 'Unit Price',
            fieldName: 'Unit_Price__c',
            initialWidth: 120,
            type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {
            label: 'GST',
            fieldName: 'GST__c',
            initialWidth: 80
        },
        {
            label: 'Amount',
            fieldName: 'Amount__c',
            initialWidth: 100,
            type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {
            label: 'Status',
            fieldName: 'Status__c',
            initialWidth: 130
        },
        {            
            type: 'action',
            label: 'Action',  
            initialWidth: 100,          
            typeAttributes: {
                rowActions: actions,
            }
        }
    ];

    @track fundcolumns = [
        {
        label: 'Registration Group',
        fieldName: 'Registration_Group__c'        
        },
        {
            label: 'Approved Amount',
            fieldName: 'Amount_approved__c',
           
        },
        {
            label: 'Amount Spent',
            fieldName: 'Spent_Amt__c',
            
        },
        {
            label: 'Available Funds',
            fieldName: 'Available_Funds__c',
          
        }        
    ];   

    get acceptedFormats() {
        return ['.pdf','.png','.jpg'];
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
  

    connectedCallback() {
       // console.log('record servicerecordId id',this.servicerecordId);        
        fetchFiles({recordId:this.servicerecordId})
        .then(result=>{
            this.lstAllFiles = result; 
            if(this.lstAllFiles.length>0){
                this.fileNameFlag=true;
                this.imagelistFlag=true;
            }else{
                this.fileNameFlag=true;                
                this.imagelistFlag=false;
            }
            this.error = undefined;
        }).catch(error=>{
            this.lstAllFiles = undefined; 
            this.error = error;
        })

        //funddetails
        getClientFunds({clientId:this.clientId})
        .then(result=>{
            this.funddata = result;
            this.error = undefined;
        }).catch(error=>{
            this.funddata = undefined; 
            this.error = error;
        })        
        this.readInvoiceDetails();

        //Read OrgName
        getOrgName().then(result=>{
            this.orgName = result;
        });
        //Read Organization name and address
        orgDetails().then(response=>{
            this.orgRecord=response;
            this.Picklist_Value = response.Id;
            this.abn = response.ABN__c;
            this.orgNames = response.Name;
            this.orgStreet = response.Address_Latest__Street__s;
            this.orgCity = response.Address_Latest__City__s;
            this.stateCode = response.Address_Latest__StateCode__s;
            this.postalCode = response.Address_Latest__PostalCode__s;
            this.countryCode = response.Address_Latest__CountryCode__s;
            this.contactNo = response.Contact_No__c;          
           // console.log('OrgName>>>'+this.orgNames);
            
        });  
    } 
    
    // fetchservicelist(){
    //     //Nagendra Pagination Start
    //     this.records=[];
    //     serviceSupportList({clientId:this.clientId}).then(result=>{            
    //         if (result != null) {  
    //             console.log('result in serviceSupportList : '+JSON.stringify(result));              
    //             this.records = result;              
    //             this.totalRecords = result.length; // update total records count                 
    //             this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
    //             this.pageNumber = 1;
    //             this.paginationHelper(); // call helper menthod to update pagination logic 
    //         } 
    //     }).catch(error=>{
    //         this.accList = undefined; 
    //         this.error = error;
    //     })
    //     //Nagendra Pagination End        
    // }
    @wire(serviceSupportList, { clientId: '$clientId' })
    wiredServiceList(result) {
        console.log(' wiredServiceList called>>');
        //console.log('result in serviceSupportList:', JSON.stringify(result));
        this.wireServiceList = result;
        const { data, error } = result;
        if (data) {
           // console.log('data in serviceSupportList:', JSON.stringify(data));
            this.records = data;
            //console.log('this.records in serviceSupportList:', JSON.stringify(this.records));
            this.totalRecords = data.length; 
            this.pageSize = this.pageSizeOptions[0]; 
            this.pageNumber = 1;
            this.paginationHelper(); 
        } else if (error) {
            this.records = [];
            this.error = error;
        }
    }

    toast(title){
        const toastEvent = new ShowToastEvent({
            title, 
            variant:"success"
        })
        this.dispatchEvent(toastEvent)
    }

    //Nagendra Pagination code start
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
        this.accList = [];
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
       // console.log('this.records in paginationHelper:', JSON.stringify(this.records));
        console.log('pageNumber>>>'+this.pageNumber);
        console.log('pageSize>>>'+this.pageSize);
        console.log('totalRecords>>>'+this.totalRecords);
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.accList.push(this.records[i]);            
        } 
        //console.log(' this.accList in paginationHelper:', JSON.stringify( this.accList));      
        //refreshApex(this.wireServiceList);
    }
    //Nagendra Pagination Code End
   //pagination for invoices
    handleRecordsPerPage1(event) {        
        this.pageSize1 = event.target.value;        
        this.paginationHelper1();
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

    // JS function to handel pagination logic 
    paginationHelper1() {
        this.invoiceTable = [];
        // calculate total pages
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        // set page number 
        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }
       // console.log('this.records in paginationHelper:', JSON.stringify(this.records));
        console.log('pageNumber>>>'+this.pageNumber);
        console.log('pageSize>>>'+this.pageSize);
        console.log('totalRecords>>>'+this.totalRecords);
        // set records to display on current page 
        for (let i = (this.pageNumber1 - 1) * this.pageSize1; i < this.pageNumber1 * this.pageSize1; i++) {
            if (i === this.totalRecords1) {
                break;
            }
            this.invoiceTable.push(this.records1[i]);            
        } 
        //console.log(' this.accList in paginationHelper:', JSON.stringify( this.accList));      
        //refreshApex(this.wireServiceList);
    }


    handleClose() {
       this.creaetServiceFlag = false;
        this.listofSericeFlag = true;
        this.openservice=false;
    }

    handleAddNewService() {
        //console.log('calling method');
        this.isOpenModal=true;     
        this.showfunds=true;
        this.openservice=false; 
        this.listofSericeFlag = true;
        this.imageUploadFlag=false;
        this.fileNameFlag=true;
        this.creaetServiceFlag = false;
        this.errorMessage;
        this.saveDisabled = true;
    }
    handleSubmit(event){
        this.isOpenModal=false;
        this.openservice=false;
        this.showfunds=false;

        event.preventDefault();
        const fields=event.detail.fields;
        fields.Service_Type__c = this.selectedNdisIdValue;
        fields.Funds_Tracker__c=this.selectedfund;
        fields.Client__c=this.clientId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
        
        this.isEdit=false;
    }
    handleSuccess(event){
        //this.fetchservicelist();  
        refreshApex(this.wireServiceList);      
        this.showfunds=false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully!!!',
                variant: 'success',
            }),
        );      
    }
    handleError(event){    
        alert(JSON.stringify(event.detail));
        this.showToast(event.detail.detail); 
    }
    
    showToast(msg){
        const event = new ShowToastEvent({
            title: 'Error',
            message: msg,
            variant: 'Error',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }
    hideModalBox(){
        this.isOpenModal=false;
        this.showfunds=false;
        this.isEdit=false; 
        this.stateValue='';  
        this.NdisServiceGroupNameinEdit=false;           
    }      
    
    handleAddNewSupportPlan(){        
        this.imageUploadFlag=true;
        this.fileNameFlag=false;
        fetchSupId({recordId:this.servicerecordId})
        .then(result=>{
            this.newSupId=result;
           // console.log('raja is the document ',this.newSupId);
        })       
    }

    handleUploadFinished(event) {
        this.imageUploadFlag=false;
        this.fileNameFlag=true;
        this.connectedCallback();
    }

    handleChange(event) {
       // console.log(event.detail.name);
        if (event.target.name == 'serviceName') {
            this.serviceNameValue = event.detail.value;
           // console.log('serviceName  ', this.serviceNameValue);
        }
        if (event.target.name == 'serviceStatus') {
            this.serviceStatusValue = event.target.value;
           // console.log('serviceStatus  ', this.serviceStatusValue);
        }
        if (event.target.name == 'serviceStartDate') {
            this.serviceStartDateValue = event.detail.value;
           // console.log('serviceStartDate  ', this.serviceStartDateValue);
        }
        if (event.target.name == 'serviceEndDate') {
            this.serviceEndDateValue = event.detail.value;
           // console.log('serviceEndDate  ', this.serviceEndDateValue);
        }
    }
    handleInvoicFlag() {
        this.isInvoiceflag = true;
        this.invoiceflag=false;
    }

    @api reload(){
        this.invoiceflag=true; 
        this.isInvoiceflag=false; 
    }
       
    async readInvoiceDetails() {
        try {
            // Clear the existing invoice data and initialize an empty list
            this.invoiceTable = [];
            let tempconList = [];
            const InvoiceDetails = await getInvoices({ clientId: this.clientId });
            this.isInvoiceflag = true;
           
            InvoiceDetails.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                tempConRec.dateIssued = new Date(tempConRec.Date_of_Invoice__c).toLocaleDateString('en-GB');
                tempConRec.userName = tempConRec.User_Name__c;
                tempConRec.name = tempConRec.Name;
                tempconList.push(tempConRec);
            });
            
            this.records1 = tempconList;
            this.totalRecords1 = tempconList.length; 
            console.log('this.totalRecords1: '+this.totalRecords1);
            this.pageSize1 = this.pageSizeOptions1[0]; 
            this.pageNumber1 = 1;
            this.paginationHelper1(); 
 

            console.log('clientId  in getInvoices : '+this.clientId);
            
           // console.log('records after getInvoices: '+JSON.stringify( this.records));
            //this.records = [... this.records ];
            //let cltId =this.clientId;
            //this.clientId = cltId;
            //console.log('clientId after getInvoices: '+this.clientId);
            await this.sleep(1000);
            // Wait for the refreshApex to complete for wireServiceList
            await refreshApex(this.wireServiceList);
           // console.log('records after refreshApex getInvoices 5343654473: '+JSON.stringify( this.records));
            //this.paginationHelper(); 
            console.log('Invoice details and lists refreshed successfully.');
        } catch (error) {
            console.error('Error while fetching or refreshing invoice details:', error);
            this.showLoadingSpinner = false;
        }
        //this.fetchReplist();
        this.showLoadingSpinner = false;
    }
   
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    fetchReplist(){
        refreshApex(this.wireServiceList);
    }
    @track description =[];
    @track totalAmount=0;
    
    async getSelectedRec() {   
        this.showLoadingSpinner = true;     
        this.lstSelectedRecords = [];
        this.invRecords = [];
        this.pdfInvoiceRecords = []; 
        this.description = [];       
        this.isStaffName = false;
        const selectedRecords = this.template.querySelector("lightning-datatable").getSelectedRows();
        
        if (selectedRecords.length > 0) {
            let ids = '';            
            selectedRecords.forEach(currentItem => {
                ids = ids + ',' + currentItem.Id;                
            });
            this.selectedIds = ids.replace(/^,/, '');
            this.lstSelectedRecords = selectedRecords;
            this.selectedServicesId = this.selectedIds;
    
            try {
                const result = await getSupportData({ SPIdList: this.lstSelectedRecords });
                console.log('result in serviceSupportList:', JSON.stringify(result)); 
                this.totalAmount = 0;
                
                if (result.length > 0) {                    
                    result.forEach(record => {
                        let eachInvRecord = {};
                        eachInvRecord.resourcename = record.Resource_Name__c; 
                        eachInvRecord.lineitem = record.Lineitem__c;                        
                        eachInvRecord.desc = record.Description__c;
                        eachInvRecord.qty = record.Qty__c;
                        eachInvRecord.unitprice = record.Unit_Price__c;
                        eachInvRecord.gst = record.GST__c;
                        eachInvRecord.amt = record.Amount__c;
                        eachInvRecord.participantName = record.Client__r.Name__c;
                        eachInvRecord.facName = record.Client__r.Facility_Name__c;
                        eachInvRecord.facStreet = record.Client__r.Facility__r.Address__Street__s;
                        eachInvRecord.fAddress = record.Facility_Address__c;
                        eachInvRecord.facState = record.Client__r.Facility__r.Address__StateCode__s;
                        eachInvRecord.facCity = record.Client__r.Facility__r.Address__City__s;
                        eachInvRecord.facCountry = record.Client__r.Facility__r.Address__CountryCode__s;
                        eachInvRecord.ABN = record.Organization_ABN__c;
                        eachInvRecord.Status = record.Status__c;
                        this.totalAmount += record.Amount__c;
                        this.invRecords.push(eachInvRecord);
    
                        if (!this.isStaffName) {
                            this.StaffName = record.Resource_Name__c; 
                            this.ServiceIds = record.Id;
                            this.description = record.Description__c;
                            this.isStaffName = true;
                        } else {
                            this.StaffName = this.StaffName + ',' + record.Resource_Name__c; 
                            this.ServiceIds = this.ServiceIds + ',' + record.Id;
                        }
                    });
    
                    this.pdfInvoiceRecords = this.invRecords.map(item => {
                        return {
                            Item: item.lineitem,
                            Description: item.desc,
                            Quantity: item.qty,
                            UnitPrice: '$' + item.unitprice,
                            GST: item.gst,
                            Amount: '$' + item.amt
                        };
                    });
                }
    
                await this.createInvoices();
            } catch (error) {
                console.error('Error getting support data:', error);
                this.showLoadingSpinner = false; 
            }
        } 
    }
    

    async createInvoices() {
        try {
            const result = await InsertServiceInvoice({
                userName: this.StaffName,
                clientId: this.clientId,
                services: this.ServiceIds,
                description: this.description,
                amount: this.totalAmount
            });
    
            result.forEach(item => {
                this.invoiceId = item.Id;
                this.invoiceFileName = item.Name;                
                let text = item.Date_of_Invoice__c;                
    
                if (text.length > 0) {
                    if (text.indexOf("-") !== -1) {
                        const myArray = text.split("-");
                        this.invoiceDate = myArray[2] + '/' + myArray[1] + '/' + myArray[0];
                    }                    
                } else {
                    this.invoiceDate = item.Date_of_Invoice__c;
                }
            });
    
            await this.generatePDF1();
        } catch (error) {
            console.error('Error creating invoices:', error);
            this.showLoadingSpinner = false; 
        }
    }

    getNDISServiceData(){
        console.log('Service Date ::'+this.selectedShiftDate);
        getNDISServiceLineItem({ ServiceItemNames: this.ndisName,ServiceDate: this.selectedShiftDate}).then(result => {
            console.log('Services data with dates >>>'+JSON.stringify(result));
            this.serviceGroupName = result;
            if(this.services == ''){
                this.serviceGroupName = [];
            }
 
         }).catch(error=>{
             this.error = error;
         })
    }

    openServicePage(){       
        var selectedRecords =  this.template.querySelector('[class="fundTable"]').getSelectedRows();
       // console.log('selectedRecords >>>'+JSON.stringify(selectedRecords));
        if(selectedRecords.length > 0 && selectedRecords.length <2){
           // console.log('selectedRecords are ', selectedRecords);
            
            let ids = '';
            selectedRecords.forEach(currentItem => {
                ids = ids + ',' + currentItem.Id;
            });
            this.selectedIds = ids.replace(/^,/, '');
            this.lstSelectedRecords = selectedRecords;
           // console.log('Work In progress>>>',this.lstSelectedRecords);
            this.selectedfund=this.lstSelectedRecords[0].Id;
            //changes made by maheswari line 830,846
            this.plantype = this.lstSelectedRecords[0].Plan_Type__c;
            //Start Auto searching while opening the Service Window
            this.ndisName = this.lstSelectedRecords[0].Registration_Group__c;
            this.getNDISServiceData();
           
            this.openservice=true;
            this.showfunds=false;
        }  
        else{
           // console.log('Choose one fund');
            this.showToast('Choose one Fund to proceed');
            this.openservice=false;
        } 
    }   

    handleRowActions(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        console.log('selected row ====>'+JSON.stringify(row))
        this.recordId = row.Id;
        this.selectedfund=row.Funds_Tracker__c;
        this.selectedShiftDate=row.Date_of_Service__c
        switch (actionName) {        
            case 'edit':          
                this.isEdit=true;
                this.errorMessage;
                this.saveDisabled = false;
                this.NdisServiceGroupNameinEdit=false;
                this.stateValue='';
                getClientFunds({clientId :row.Client__c}).then(response=>{
                  //console.log('funds '+JSON.stringify(response));
                  if(response){
                    this.TotalFunds=response;
                    this.serviceType=true;
                    this.fundOption=response.map(rec=>{
                      return { "label": rec.Registration_Group__c,"value": rec.Id};
                    });
                   // console.log('funds option'+JSON.stringify(fundOption));
                   //console.log('service type names '+row.Service_Type_Name__c);

                    getNDISServiceLineItem({ServiceItemNames :row.Service_Type_Name__c,ServiceDate:this.selectedShiftDate}).then(response=>{
                        this.serviceGroupName=response;
                       // console.log('service type '+JSON.stringify(this.serviceGroupName));
                       
                       })
                  }
                }).catch(error=>{
                })
                break;            
        }
    }   

    handleSelected( event ) {   
        this.checkStatus='';
        event.detail.selectedRows.forEach((selectedRow) => {
           this.checkStatus=this.checkStatus+','+selectedRow.Status__c;
        });     
   
        if (  event.detail.selectedRows.length > 0 && (!this.checkStatus.includes('Invoice Generated'))) {            
            this.disableBool = false;
        } else {            
            this.disableBool = true;            
        }
    }   

    createHeaders(keys) {
        var result = [];
        for (var i = 0; i < keys.length; i += 1) {
            result.push({ id: keys[i], name: keys[i], prompt: keys[i], width: 42, align: "center", padding: 0 });
        }
        return result;
    }

    async generatePDF1() {
        try {
            // Preparing PDF document using jsPDF (you've already imported jsPDF)
            const { jsPDF } = window.jspdf;
            var doc = new jsPDF();
            
            // orgName
            doc.setFontSize(12);
            doc.setFont("Roboto-Bold", "bold");
            doc.setTextColor(0, 102, 255);
            doc.text(this.orgName.toUpperCase(), 10, 25);
    
            doc.setTextColor(0, 0, 0);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text("ABN: " + this.invRecords[0].ABN, 10, 30);
    
            // Tax Invoice
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text("TAX INVOICE", 160, 25);
    
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);        
            doc.text(this.invoiceFileName, 160, 30);
    
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);      
            doc.text(this.invRecords[0].facStreet+",", 10, 35);
            doc.text(this.invRecords[0].fAddress.replace(/,/g, " ")+",", 10, 40);  // Avoiding commas in address
            doc.text("Contact: " + this.contactNo, 10, 45);
    
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Date Issued: " + this.invoiceDate, 160, 35);
    
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);        
            doc.text("Reference: " + this.invRecords[0].participantName, 10, 72);

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
    
            // Columns for autoTable
            var columns = [
                { title: "Item", dataKey: "Item" },
                { title: "Description", dataKey: "Description" },
                { title: "Quantity", dataKey: "Quantity" },
                { title: "Unit Price", dataKey: "UnitPrice" },
                { title: "Tax", dataKey: "GST" },
                { title: "Amount", dataKey: "Amount" }
            ];
    
            doc.setLineWidth(0.1); // Set border line width to a smaller value
            doc.setFillColor(224, 224, 224); // Background color for cells
            doc.setFontSize(10); // Font size for the text
            doc.setFont("Roboto-VariableFont_wdth,wght", ""); // Font style
    
            // Preparing PDF invoice records
            this.pdfInvoiceRecords = this.pdfInvoiceRecords.map(record => ({
                ...record,
                Quantity: parseFloat(record.Quantity).toFixed(2) // Convert to float and fix to 2 decimals
            }));
    
            doc.autoTable({
                columns: columns,
                body: this.pdfInvoiceRecords,
                styles: {
                    fontSize: 10,
                    textColor: [0, 0, 0],
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0]
                },
                 startY: 90, 
                //startX: 10, // Start X position of the table
                theme: 'grid', // Use 'grid' theme for the table
                margin: { left: 10 },
                headStyles: {
                    fillColor: [192, 192, 192], // Grey color for header fill
                    textColor: [0, 0, 0], // Text color for header (black)
                    font: "Roboto-Bold",
                    fontStyle: 'bold' // Font style for header text (bold)
                }, 
                bodyStyles: { font: "Roboto-VariableFont_wdth,wght",  fontStyle: "normal", },
                didDrawPage: function (data) {
                
                    // Always add the footer on each page
                    addFooter(data.doc);
                },
                tableWidth: doc.internal.pageSize.width - 20,  // 10px left and right margin
                startX: 10 // Set startX to the left margin

            });
    
           /*  // Office Use Only
            doc.setFont("Calibri", "");
            doc.setFontSize(11);
            doc.text("Office Use Only", 90, 290); */
    
            // Convert the PDF to base64
            this.base64string = btoa(doc.output());
            
            // Prepare the file name and invoice ID
            var docName = this.invoiceFileName + '.pdf';
            var invoiceID = this.invoiceId;
            console.log('docName>',docName);
            // Upload the file
            await uploadFile({
                base64: JSON.stringify(this.base64string),
                filename: docName,
                recordId: this.invoiceId,
                obj: 'invoice'
            });
    
            // After the file is uploaded, refresh the data
            console.log('Refreshing data after upload...');
    
            // Wait for the refresh to complete
           // await new Promise(resolve => setTimeout(resolve, 500)); // Delay for data consistency
    
            // Refresh the invoice details
            await this.readInvoiceDetails(); // Refresh the invoice details
    
            // Refresh wireServiceList data
          //  await refreshApex(this.wireServiceList);
    
            // Handle invoice flag and set file name
            this.handleInvoicFlag();
            this.fileName = this.fileName + ' - Uploaded Successfully';
    
            // Show success toast message
            const evt = new ShowToastEvent({
                title: 'Success',
                message: 'Invoice Generated successfully',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
    
            // Refresh other relevant data
           // await refreshApex(this.invoiceTable);
            //await refreshApex(this.accList);
    
            // Disable the flag if necessary
            this.disableBool = true;
    
            console.log('PDF generated and uploaded successfully');
        } catch (error) {
            console.error('Error during PDF generation and upload:', error);
            this.showLoadingSpinner = false;
            // Handle error as needed (e.g., show error toast)
        }
    }
    
    handleDownload(event){      
       // console.log("PDF records>>>> ", this.invRecords); 
    }
      
    serviceChange(event){
        this.services = event.target.value;
       // console.log('Services >>>'+this.services);
        getNDISServiceLineItem({ ServiceItemNames: this.services,ServiceDate: this.selectedShiftDate}).then(result => {
           // console.log('result >>>'+JSON.stringify(result));
            this.serviceGroupName = result;
            if(this.services == ''){
                this.serviceGroupName = [];
            }

        }).catch(error=>{
            this.error = error;
        })
    }    

    handleRowSelection(event) {
        var selectedServiceRows=event.detail.selectedRows;
        console.log('before selectedServiceRows>>'+JSON.stringify(selectedServiceRows));        
        this.selectedNdisIdValue = selectedServiceRows[0].Id;
        this.ndisName = selectedServiceRows[0].Name;
        console.log('after selected >>'+this.selectedNdisIdValue);
        console.log('after selected >>'+this.ndisName);
        if(this.qty <= 0 &&this.selectedNdisIdValue!=null) {
            this.errorMessage = 'End time always should be greater than Start time';
            this.saveDisabled = true;
            this.errorMessageFlag=true;
        } else {
            this.errorMessage='';            
            this.saveDisabled = false;
            this.errorMessageFlag=false;
        }
       /*  if(){
            this.saveDisabled = true;
        } */
    }

    @track serviceHeader = ['Resource Name', 'Service Type', 'Line Item', 'Available Funds', 'Service Date','Qty','Unit Price','GST', 'Amount','Status' ];
    handleDownloadServices(){
        let doc = '<table>';

        // Add styles for the table
        doc += '<style>';
        doc += 'table, th, td {';
        doc += '    border: 5px solid black;';
        doc += '    border-collapse: collapse;';
        doc += '}';
        doc += '</style>';
       
        doc += '<tr>';
        doc += '<td colspan="10"><h3 style="font-size: 24; font-family: Calibri; text-align:center;">' +  this.orgNames + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="10" style="font-size: 20; font-family: Calibri; text-align:center;">Address: ' + this.orgStreet +', '+ this.orgCity  +', '+ this.stateCode +', '+this.postalCode + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="10" style="text-align:left;font-size: 20; font-family: Calibri; text-align:center;">Contact No: ' +  this.contactNo + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="10" style="text-align:left; font-size: 20; font-family: Calibri; text-align:center;">ABN: ' + this.abn + '</td>';
        doc += '</tr>';
        
        doc += '<tr><td colspan="10"></td></tr>';
        doc += '<tr><td colspan="10"></td></tr>';

        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="10" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'Services Data' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';

        doc += '<tr>';
        this.serviceHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';

        this.accList.forEach(fieldsData => {
            doc += '<tr>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Resource_Name__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' +fieldsData.Service_Type_Name__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Lineitem__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.Available_Fund__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:left;">' + fieldsData.Date_of_Service__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Qty__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.Unit_Price__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.GST__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.Amount__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Status__c + '</td>';
            doc += '</tr>';
        }); 
        
        // Add a blank row for spacing
        doc += '<tr><td colspan="10"></td></tr>';

        // End of Table 1
        doc += '</table>';

        var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(doc);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        // use .csv or .xls as extension on below line if you want to export data
        downloadElement.download = 'Services.xls';
        document.body.appendChild(downloadElement);
        downloadElement.click();
    }

    @track selectedShiftDate;
    @track spickval;
    @track epickval;
    @track qty;
    timeChange(event){        
        if(event.target.name=="startTime"){
            this.startTimePickval=event.target.value;
           // console.log('start time picklist'+ this.startTimePickval);
        }
        if(event.target.name=="endTime"){
            this.endTimePickval=event.target.value;
           // console.log('start time picklist'+ this.endTimePickval);
        }
        if(event.target.name=="date"){
            this.selectedShiftDate=event.target.value;
            console.log('sselectedShiftDate'+ this.selectedShiftDate);
        } 
        console.log('Onchange service date ::'+this.selectedShiftDate);
        this.getNDISServiceData();
       // let starttimevalue=  this.convertTo24Hour(this.startTimePickval);
      //  this.spickval=starttimevalue+':00Z';
     //  console.log(' satrt time value in 24 hours format ==>'+ this.spickval);

      //  let endTimeValue=  this.convertTo24Hour(this.endTimePickval);
      //  this.epickval=endTimeValue+':00Z';
       // console.log('end value in 24 hours format ==>'+ this.epickval);
        //if(this.epickval >)
    
       // console.log('date value in time change==>'+this.selectedShiftDate);
        let Dateparts=this.selectedShiftDate.split("-");
        let startParts =this.startTimePickval.split(":");
       // console.log('start time parts==>'+startParts);
        let startDate = new Date();
        
        startDate.setDate(parseInt(Dateparts[2], 10));
        startDate.setHours(parseInt(startParts[0], 10));
        startDate.setMinutes(parseInt(startParts[1], 10));
       // console.log("start date"+startDate);

        let endParts = this.endTimePickval.split(":");
       // console.log('end time parts==>'+endParts);
        
        let endDate = new Date();
        endDate.setDate(parseInt(Dateparts[2], 10));
        endDate.setHours(parseInt(endParts[0], 10));
        endDate.setMinutes(parseInt(endParts[1], 10));
       // console.log("end date"+endDate);
    
        let durationInMilliseconds = endDate - startDate;
       // console.log("duration in millisec"+durationInMilliseconds);
        
        // Convert milliseconds to hours and minutes
        let durationInMinutes = (durationInMilliseconds / (1000 * 60));
       // console.log("duration in minutes"+durationInMinutes);
        let hours = (durationInMinutes / 60).toFixed(1);
       // console.log("duration in hours"+hours); 
        this.qty = hours;  
        
    }
    
    @track errorMessage;
    @track saveDisabled = false;
    @track errorMessageFlag = false;
    convertTo24Hour(time12h) {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
    
        if (hours === '12') {
            hours = '00';
        }
    
        if (modifier === 'pm') {
            hours = parseInt(hours, 10) + 12;
        }
        if(hours<10 && hours !=0){
          hours='0'+hours;
        }
    
        return `${hours}:${minutes}`;
    }

    @track isModalOpen = false;
    @track currentUrl;
    
    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileName(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }

    @track userTypeValue;
    wireuser
    @track error;
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [UserType]
        }) wireuser({
            error,
            data
        }) {
        if (error) {
            this.error = error;
        } else if (data) {
            this.userTypeValue=data.fields.User_Type__c.value;
            if(this.userTypeValue == 'NDIS Participants'){
                this.participantlogin=false;
            } else {
                this.participantlogin=true;

            }        
        }
    }

    handleServiceChange(event){
        // console.log('event target'+JSON.stringify(event.target.options));
        //console.log('event details'+JSON.stringify(event.detail));
         console.log('shift created date '+this.selectedShiftDate);
         this.services=event.target.options.find(opt => opt.value === event.detail.value).label;
         console.log('shift created date '+this.services);
         this.selectedfund=event.detail.value;
         if(this.services){
           getNDISServiceLineItem({ServiceItemNames :this.services,ServiceDate:this.selectedShiftDate}).then(response=>{
            if(response){
            this.NdisServiceGroupNameinEdit=false;
            this.stateValue='';
            this.serviceGroupName=response;
           // console.log('service type '+JSON.stringify(this.serviceGroupName));
            }
           })
         }
       }
       HandlestateChange(event) {
        this.stateValue = event.target.value;
        console.log('state value ' + this.stateValue);
            if (this.stateValue) {
              this.serviceGroupName = this.serviceGroupName.map((item) => {
                  const amount = item[this.stateValue]; // Dynamically fetch the state's amount field
                 // console.log('amount '+amount);
                  if (amount !== undefined) {
                      return { ...item, amount }; // Include the state's amount in the filtered row
                  }
                  return { ...item, amount: 0.00 }; // Add an empty amount for rows without the state's field
              });
              this.NdisServiceGroupNameinEdit=true;
              console.log(' Service list based on state change '+JSON.stringify(this.serviceGroupName));
          }
    }

    handleCheckboxSelection(event){
        const selectedId = event.target.getAttribute('data-id'); // Get the selected row's ID
        const selectedRow = this.serviceGroupName.find(row => row.Id === selectedId); 
        console.log('Selected row '+JSON.stringify(selectedRow));
        this.selectedNdisIdValue = selectedRow.Id;
        // Update the isSelected property for all rows
        this.serviceGroupName = this.serviceGroupName.map(row => ({
            ...row,
            isSelected: row.Id === selectedId // Set true for the selected row, false for others
        }));
    
        console.log('Selected Row ID:', selectedId);
      }
  
}