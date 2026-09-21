// import { LightningElement, track } from 'lwc';
// import getBillingEntries from '@salesforce/apex/SupportBillingController.getBillingEntries';
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import generateInvoices from '@salesforce/apex/SupportBillingController.generateInvoices';
// import getInvoices from '@salesforce/apex/SupportBillingController.getInvoices';
// import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
// import autoTable from '@salesforce/resourceUrl/autotable'
// import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
// import robotoFont from '@salesforce/resourceUrl/Roboto';
// import My_Resource from "@salesforce/resourceUrl/myResource";
// import { loadScript } from "lightning/platformResourceLoader";
// import jsPDF from '@salesforce/resourceUrl/jspdf';
// import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
// export default class SupportCoordinatorBilling extends LightningElement {




import { LightningElement,wire,api,track } from 'lwc';
//import fetchFacilitiess from '@salesforce/apex/ClientSearchController.fetchFacilitiess';
import getAllParticipants from '@salesforce/apex/SupportParticipantController.getAllParticipants';
import getSupportInvoiceById from '@salesforce/apex/SupportBillingController.getSupportInvoiceById';
//import getCompanyAndAccountData1 from '@salesforce/apex/RosterInvoicesHandler.getCompanyAndAccountData1';
import generateInvoices from '@salesforce/apex/SupportBillingController.generateInvoices';
//import getInvoices from '@salesforce/apex/SupportBillingController.getInvoices';
import getBulkServicesHandler from '@salesforce/apex/SupportBillingController.getBulkServicesHandler';
import serviceSupportList from '@salesforce/apex/SupportBillingController.serviceSupportList';
import My_Resource from "@salesforce/resourceUrl/myResource";
import autoTable from '@salesforce/resourceUrl/autotable'
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import robotoFont from '@salesforce/resourceUrl/Roboto';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
//import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
//import { deleteRecord } from 'lightning/uiRecordApi';
//import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import updateQty from '@salesforce/apex/SupportBillingController.updateQty';
import cancelInvoiceApex from '@salesforce/apex/SupportBillingController.cancelInvoiceById';
// import getShiftStaffDetails from '@salesforce/apex/RosterInvoicesHandler.getReimbursementsByShiftStaffIds';
// import getEmailBodyServiceInvoice from '@salesforce/apex/RosterInvoicesHandler.getEmailBodyServiceInvoice';
// import sendEmail from '@salesforce/apex/RosterInvoicesHandler.sendEmailforServiceInvoice';
// //import getEmailBodyICT from '@salesforce/apex/InvoiceHandler.getEmailBodyICT';
// import getentityEmailForInvoices from '@salesforce/apex/AccountingChartController.getentityEmailForInvoices';

//import getParticipantFacilityMap  from '@salesforce/apex/RosterInvoicesHandler.getParticipantFacilityMap';
// import sendBulkServiceInvoiceEmails
//     from '@salesforce/apex/RosterInvoicesHandler.sendBulkServiceInvoiceEmails';
//import fetchEntity from "@salesforce/apex/RosterInvoicesHandler.fetchEntity";
import getClientFunds from "@salesforce/apex/ServiceSupportPlanHandler.getClientFunds";
//import getStaffsByOrg from "@salesforce/apex/StaffController.getStaffsByOrg";
import getCatalogueData from "@salesforce/apex/CatalogueDataHandler.getCatalogueData";
// import saveServiceSupportPlans  from '@salesforce/apex/RosterInvoicesHandler.saveServiceSupportPlans';
// import getPlanTypeOptions from '@salesforce/apex/RosterInvoicesHandler.getPlanTypeOptions';
import exportInvoicesCSV from '@salesforce/apex/RosterInvoicesHandler.exportInvoicesCSV';//


export default class SupportCoordinatorBilling extends LightningElement {
    @track startDate;
    @track endDate;
    // @api orgid;
    // @api faclist;
    // @api rolelist;
    @track orgid;
    @track servicesfromparent=[];
    @track accList=[];
    @track pageSizeOptions = [5,10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Pa
    @track error;
    @track disableBool = true;
    @track ParticipantOptions=[];
    @track serviceParticipant='';
    @track participantCheckBox=false;
    @track partcipantServicesMap= new Map();
    @track selectedRecordMap = new Map();
    @track salesEntryList = []; 
    @track invRecords=[];
    @track accountNo;
    @track bsb;
    @track bank;
    @track accountName;
    @track base64string;
    @track isShowSpinner1 = false;
    @track salesEntry = {
  
    };
    @track bulkServices = [];
    wiredBulkServicesResult;
    wiredBulkServicesResultForXero;
    @track partcipantIdList = [];
    @track currentUrl;
    @track isModalOpen = false;
    @track amountarrey = {
        subTotal: 0,
        taxAmount: 0,
        totalAmount: 0
    };
    @track orgName;
   @track isInvoiceflag=true;
    @track showProgressBar = false;
    @track progressValue = 0;
    //@track searchKey='' ;
    @track isShowSpinner=false;
     
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    @track pageSizeOptionsBulk = [5,10, 25, 50, 75, 100]; //Page size options
    @track recordsBulk = []; //All records available in the data table
    @track columnsBulk = []; //columns information available in the data table
    @track totalRecordsBulk = 0; //Total no.of records
    @track pageSizeBulk; //No.of records to be displayed per page
    @track totalPagesBulk; //Total no.of pages
    @track pageNumberBulk = 1;
    @track noDataErrorMessage;
    get bDisableFirstBulk() {
        return this.pageNumberBulk == 1;
    }
    get bDisableLastBulk() {
        return this.pageNumberBulk == this.totalPagesBulk;
    }
    @track ServiceWarningMessage=false;
    @track participantServiceDeleteInfo={};
    @track isModalRelate = true;
    @track statusService='';
    @track serviceStatusOption=[{label:'Pending Invoices',value:'Not Yet Invoiced'},{label:'Invoice Generated',value:'Generated'}];
    @track noRecordsFlag = true;
    @track noRecordsInvoiceFlag=true;
    @track facilityPreferredName;
    //@track participantPreferredName;
    @track oldQuantityValue=0;
    @track pendingInvoices = 0;
    @track generatedInvoices = 0;
    @track overdueInvoices = 0;
    @track totalAmount = 0;
    @track totalAmounttask = true;
    @track overdueInvoicestask = false;
    @track generatedInvoicestask = false;
    @track pendingInvoicestask = false;
    @track generatedflag = false;
    @track pendingflag = false;
    @track totalvalueflag = true;
    @track issuedRecords = [];    // only Issued
    @track cancelledRecords = []; // only Cancelled
    @track issuedPageList = [];      // visible subset for pagination
    @track issuedPageSizeOptions = [5, 10, 20, 50];
    @track issuedPageSize = 10;
    @track issuedPageNumber = 1;
    @track issuedTotal = 0;
    @track issuedTotalPages = 0;
    @track cancelledRecords = [];    // full Cancelled records
    @track cancelledPageList = [];   // visible subset for pagination
    @track cancelledPageSizeOptions = [5, 10, 20, 50];
    @track cancelledPageSize = 10;
    @track cancelledPageNumber = 1;
    @track cancelledTotal = 0;
    @track cancelledTotalPages = 0;
    @track shiftWithStaffIds;
    @track isReimbursementModalOpen = false;
    @track selectedRecord;
    @track generateInvoicepopup = false;
    @track tilesflag = false;
    @track accountingService;
    @track accountingServiceflag = false;
    @track createCompanyFlag = false;
    @track isFromManageInvoice=false;
    @track createCompanyFacilityId;
    @track selectedEntity = '';

    @track EntityNameOptions = [];
    //@track selectedCardType = 'Customer';
    @track EntityNameValue;
    @track filteredServiceTypeOptions = [];
    @track AddServiceStaffOptions=[];
    @track AddServiceStaffValue;
    @track AddServiceStartDate;
    @track serviceTypeName;
    @track isAddNewService=false;
    @track isEntityDisabled=false;
    @track serviceTypeId;
    @track serviceQuantity;
   
    @track startTime = null;
    @track startTime24 = null;
    @track startTimeDisplay = '';
    @track startTimeSelectedHour = null;
    @track startTimeSelectedMinute = null;
    @track startTimeAMPM = null;
    @track endTime = null;
    @track endTime24 = null;
    @track endTimeDisplay = '';
    @track endTimeSelectedHour = null;
    @track endTimeSelectedMinute = null;
    @track endTimeAMPM = null;
    companyByParticipantMap = {};
    availableFunds=0;
    @track NdisServiceGroupName = false;
    @track ndisflag = false;
    @track otherThanNdis = false;
    @track Miscellaneous = false;
    @track serviceGroupName = [];
    @track paginationVisible = false;
    @track pageSizeOptions3 = [5, 10, 20, 50];
    @track records3 = [];  
    @track totalRecords3 = 0; 
    @track pageSize3 = 5; 
    @track pageNumber3 = 1;
    @track totalPages3 = 0;
    @track recordsToDisplay3 = []; 
    @track stateValue;
    @track serviceParticipantOptions=[];
    @track isEntityFromAddService=false;
    @track allServiceRows = [];
    @track addServicePaginationVisible= false;
    @track addServiceVisible = false;
    @track showNoFundsModal=false;
    @track showCreateFundsFlag=false;
    @track participantType;
    @track typeOfService;
    @track individualFlag = false;
    @track companyFlag = false;
    @track xeroResponseforInvoiceStatus = [];
    @track myobResponseforInvoiceStatus = [];

    pdfLibLoaded = false;

    @track sectionIcons = {
        staffDetails: '\u2B9F', 
        Addressdetails: '\u2B9C',
        EmploymentDetails: '\u2B9C',
        InvoiceDetails: '\u2B9F',
        TaxationDetails: '\u2B9F',
        PreTaxDeduction: '\u2B9C',
        PostTaxDeduction: '\u2B9C',
        EmergencyDetails: '\u2B9F',
        BankDetails: '\u2B9F',
        SuperannuationDetails: '\u2B9F', 
        Leaves: '\u2B9C',
        ApproversDetails: '\u2B9C',
        staffDocumentation: '\u2B9C', 

        staffDetails1: '\u2B9F', 
        Addressdetails1: '\u2B9C',
        EmploymentDetails1: '\u2B9C',
        InvoiceDetails1: '\u2B9F',
        TaxationDetails1: '\u2B9F',
        PreTaxDeduction1: '\u2B9C',
        PostTaxDeduction1: '\u2B9C',
        EmergencyDetails1: '\u2B9F',
        BankDetails1: '\u2B9F',
        SuperannuationDetails1: '\u2B9F', 
        Leaves1: '\u2B9C',
        ApproversDetails1: '\u2B9C',
        staffDocumentation1: '\u2B9C',
    };

    @track sectionFlags = {
        staffDetails: true,
        Addressdetails: false,
        EmploymentDetails: false,
        InvoiceDetails: true,
        TaxationDetails: true,
        PreTaxDeduction: false,
        PostTaxDeduction: false,
        EmergencyDetails: true,
        BankDetails: true,
        SuperannuationDetails: true,
        Leaves: false,
        ApproversDetails: false,
        staffDocumentation: false,

        staffDetails1: true,
        Addressdetails1: false,
        EmploymentDetails1: false,
        InvoiceDetails1: true,
        TaxationDetails1: true,
        PreTaxDeduction1: false,
        PostTaxDeduction1: false,
        EmergencyDetails1: true,
        BankDetails1: true,
        SuperannuationDetails1: true,
        Leaves1: false,
        ApproversDetails1: false,
        staffDocumentation1: false,
    };
    get isAccounting() {
        return this.accountingService === 'Tesseract System';
    }
    //manendra start
    @track servicesPlanType = '';
    @track invoicePlanType = '';
    @track planTypeOptions = [];
    selectedInvoiceIds = [];
    @track invoicePartcipantIdList = [];
    @track entityOptions = [];
    showExportCSV = false;
    @track statePostal;
    connectedCallback() {
      //
     //  
       // console.log('faclist in manage invoice connectedCallback '+JSON.stringify(this.faclist));
     //   console.log('rolelist '+JSON.stringify(this.rolelist));
     
 
        /*  var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.startDate =  today.toISOString().slice(0, 10); // e.g., 2025-04-01
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.endDate = last.toISOString().slice(0, 10);   // e.g., 
       */
        const today = new Date();

        // Start: July 1 of current year
        // const startOfFY = new Date(today.getFullYear(), 6, 1);   // month index 6 = July
        // this.startDate = this.formatDate(startOfFY);

        // // End: June 30 of next year
        // const endOfFY = new Date(today.getFullYear() + 1, 5, 30); // month index 5 = June
        // this.endDate = this.formatDate(endOfFY);

        // console.log('📅 Start Date (FY): ' + this.startDate);
        // console.log('📅 End Date (FY): ' + this.endDate);

        // 🔴 Determine FY start year
        const fyStartYear =
            today.getMonth() >= 6        // July = 6
                ? today.getFullYear()    // On/after July → same year
                : today.getFullYear() - 1; // Before July → previous year

        // Start: July 1
        const startOfFY = new Date(fyStartYear, 6, 1);

        // End: June 30 (next year)
        const endOfFY = new Date(fyStartYear + 1, 5, 30);

        this.startDate = this.formatDate(startOfFY);
        this.endDate = this.formatDate(endOfFY);

        console.log('📅 Start Date (FY):', this.startDate);
        console.log('📅 End Date (FY):', this.endDate);


        // this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        // this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        // console.log('this.facilityPreferredName : ', this.facilityPreferredName);
        // this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
        // this.accountingService = localStorage.getItem("orgAccountingServices")
        // console.log('this.accountingService in connectedCallback : ',this.accountingService);
        // if (this.accountingService === 'Tesseract System') {
        //     this.addServiceVisible = true;
        // } else  {
        //     this.addServiceVisible = false;
        // }
        console.log('startdate'+this.startDate);
        console.log('enddate'+this.endDate);
        this.statusService=['Not Yet Invoiced','Cancelled'];
        this.pageNumber = 1;
        console.log('servicesfromparent '+JSON.stringify(this.servicesfromparent));
        this.handleLinkParticipants();
       // this.accList=[];
       // this.records=[];
        if (this.servicesfromparent) {
            // console.log('data in serviceSupportList:', JSON.stringify(data));
             //this.records = data;
             this.servicePAginationHelper(this.servicesfromparent);
            
         } else if (error) {
             this.records = [];
             this.error = error;
         }
         organizationDetails().then(response => {
             console.log('calling response raja', JSON.stringify(response));
             this.bank = response.listofPriceBook.Bank__c;
             this.accountNo = response.listofPriceBook.Account_Number__c;
             this.accountName = response.listofPriceBook.Account_Name__c;
             //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
             //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;             
             this.bsb = response.listofPriceBook.BSB__c;
             this.orgName=response.listofPriceBook.Name;
             this.orgid=response.listofPriceBook.Id;
            this.Contact=response.listofPriceBook.Contact_No__c;
            this.abn=response.listofPriceBook.ABN__c;
            const address = response.listofPriceBook.Address_Latest__c || {};
            this.statePostal = `${org.Address_Latest__Street__s},${org.Address_Latest__City__s}, ${org.Address_Latest__StateCode__s}, ${org.Address_Latest__PostalCode__s}`;
            this.orgLogo = response.bolbdata;
            console.log('org Id '+this.orgid);
            const street = address.street || '';
            const city   = address.city || '';
            const state  = address.stateCode || address.state || '';
            const postal = address.postalCode || '';
            const country = address.country || '';

             this.fullAddressLine = 
                    [city, state, postal,]
                    .filter(Boolean)
                    .join(', ');
                     this.street=response.listofPriceBook.Address_Latest__c.street;

             //this.accountingService = response.listofPriceBook.Accounting_Services__c;
             //console.log('this.accountingService >>>>>>>', this.accountingService);
            
             /* this.desc = response.li=tofPriceBook.Description__c; */
            //console.log('this.accountingService in organizationDetails : ',this.accountingService);
       this.cacheBuster = this.cacheBuster + 1;
         });
        // if (this.accountingService === 'Tesseract System') {
        //     refreshApex(this.wiredBulkServicesResult);
        // } else if (this.accountingService === 'Xero') {
        //      refreshApex(this.wiredBulkServicesResultForXero);
        // }
        // refreshApex(this.wiredResult);
        refreshApex(this.wiredBulkServicesResult);
    //     getPlanTypeOptions()
    // .then(result => {
    //     this.planTypeOptions = [{ label: 'All', value: '' }];

    //     result.forEach(item => {
    //         this.planTypeOptions.push({
    //             label: item,
    //             value: item
    //         });
    //     });
    // })
    // .catch(error => {
    //     console.error('Error fetching Plan Types', error);
    // });
    }


    // handlePlanTypeChange(event) {
    //     this.servicesPlanType  = event.detail.value;
    //     refreshApex(this.wiredResult);
    // }
    // handleInvoicePlanTypeChange(event){
    //     this.bulkServices = [];
    //     this.invoicePlanType = event.target.value;
    //      console.log('Invoice Plan Type Selected:', this.invoicePlanType);
    //     refreshApex(this.wiredBulkServicesResult);
    // }
  //manendra end

    formatDate(date) {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }


    @track data = [];

    wiredResult;
    debounceTimeout;
 
    cacheBuster = 0;

    constructor() {
        super();
        this.cacheBuster = Math.floor(Math.random() * 100000000); 
    }

@wire(serviceSupportList, { 
    clientIds:'$partcipantIdList',
    startDateStr:'$startDate',
    endDateStr:'$endDate',
    orgid:'$orgid',
   // name:'$searchKey',
    //status:'$statusService',
    cacheBuster:'$cacheBuster',
})

wiredServiceList(result) {

    this.wiredResult = result;

   // console.log( 'serviceSupportList result >>>>', JSON.stringify(result, null, 2)  );

    if(!result.data && !result.error){

        this.isShowSpinner = false;
        return;
    }

    if(result.error){

        console.error(
            '❌ Wire error:',
            result.error
        );

        this.records = [];
        this.accList = [];
        this.totalRecords = 0;
        this.pendingInvoices = 0;
        this.noRecordsFlag = true;
        this.servicesfromparent = [];
        this.isShowSpinner = false;

        return;
    }

    if(result.data){

        const serviceData = result.data;

        if(!serviceData || serviceData.length === 0){

            this.records = [];
            this.accList = [];
            this.totalRecords = 0;
            this.pendingInvoices = 0;
            this.noRecordsFlag = true;
            this.servicesfromparent = [];
            this.isShowSpinner = false;

            return;
        }

        // ✅ DIRECTLY USE DATA
        this.servicesfromparent = serviceData;
        this.servicePAginationHelper(this.servicesfromparent);
       // console.log( 'this.servicesfromparent  >>>>', JSON.stringify(this.servicesfromparent, null, 2));
        // this.shiftWithStaffIds =
        //     serviceData
        //         .filter(
        //             rec => rec.ShiftwithStaff__c
        //         )
        //         .map(
        //             rec => rec.ShiftwithStaff__c
        //         );

        // this.fetchShiftStaffDetails();
    }
}
 async  handleLinkParticipants() {
        try {

            console.log( '🔄 handleLinkParticipants START' );

            const data = await getAllParticipants();

            console.log( '📦 Raw Participants:',JSON.stringify(data, null, 2));

            // keep same variable name
            this.ParticipantOptions = data.map((p, index) => {

                    const participantName =
                        p.First_Name__c ||
                        p.Last_Name__c

                            ? `${p.First_Name__c || ''} ${p.Last_Name__c || ''}`.trim()

                            : p.Name || '';

                    console.log( `Participant ${index + 1}`,
                        {
                            id:p.Id,
                            firstName:p.First_Name__c,
                            lastName:p.Last_Name__c,
                            finalLabel:participantName
                        }
                    );

                    // let riskLevels =
                    //     p.Risk_Managements__r?.map(
                    //         risk => risk.Risk_Index__c
                    //     ) || [];

                    // let riskStatus = '';

                    // if(riskLevels.includes('Extreme')){
                    //     riskStatus = 'Extreme';
                    // } else if(riskLevels.includes('High')){
                    //     riskStatus = 'High';
                    // } else if(riskLevels.includes('Medium')){
                    //     riskStatus = 'Medium';
                    // }

                    return {
                        value:p.Id,
                        label:participantName

                        // riskStatus:riskStatus
                    };
                });
        console.log('participantOptions ' + JSON.stringify(this.ParticipantOptions));
         console.log( 'participantOptions LENGTH : ',this.ParticipantOptions.length );

        } catch(error){

        console.error(error);
        }

    }
        
    handleServiceStaffchange(event) {

        console.log(
            'Raw participant event:',
            JSON.stringify(event.detail)
        );

        const val = event.detail.value;


        // 🔥 ignore search typing event
        if (!Array.isArray(val)) {
            console.log(
                'Ignoring search text:',
                val
            );
            return;
        }


        const newList = val;


        const selectionChanged =
            newList.length !== this.partcipantIdList.length ||
            newList.some(
                id => !this.partcipantIdList.includes(id)
            );


        if (!selectionChanged) {
            return;
        }


        this.partcipantIdList = newList;


        console.log(
            'this.partcipantIdList ',
            JSON.stringify(this.partcipantIdList)
        );


        this.pageNumber = 1;


        refreshApex(this.wiredResult);
    }
    
    handleDateChange(event) {
        const field = event.target.name;
    
        if (field === 'start') {
            this.startDate = event.target.value;
        } else if (field === 'end') {
            this.endDate = event.target.value;
        }
        
     if (this.startDate && this.endDate) {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);

        if (start >= end) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid Date Range',
                    message: 'Start date should be earlier than end date.',
                    variant: 'error'
                })
            );
            return; // ❌ stop execution
        }
      }
    
        console.log('startdate'+this.startDate);
        console.log('enddate'+this.endDate);

        refreshApex(this.wiredResult);
    }

    // fetchShiftStaffDetails() {
    //     console.log('🔹 Starting fetchShiftStaffDetails...');

    //     getShiftStaffDetails({ shiftStaffIds: this.shiftWithStaffIds })
    //         .then(apexResult => {
    //             console.log('✅ Apex data received:', JSON.stringify(apexResult));

    //             // 🔹 Create a map: ShiftwithStaff__c → [Apex records]
    //             const shiftMap = {};
    //             apexResult.forEach((shift, index) => {
    //                 console.log(`🔹 Apex record ${index + 1}: Id=${shift.Id}, ShiftwithStaff__c=${shift.ShiftwithStaff__c}`);

    //                 if (!shiftMap[shift.ShiftwithStaff__c]) {
    //                     shiftMap[shift.ShiftwithStaff__c] = [];
    //                 }
    //                 shiftMap[shift.ShiftwithStaff__c].push(shift);
    //             });

    //             console.log('🔹 Shift Map (grouped):', JSON.stringify(shiftMap));

    //             // 🔹 Tag wire records with *list* of Apex records
    //             const taggedServiceList = this.servicesfromparent.map((wireRec, idx) => {
    //                 console.log(`🔹 Wire record ${idx + 1}: Id=${wireRec.Id}, ShiftwithStaff__c=${wireRec.ShiftwithStaff__c}`);

    //                 const mappedShifts = shiftMap[wireRec.ShiftwithStaff__c] || [];
    //                 if (mappedShifts.length > 0) {
    //                     console.log(`   ✅ Found ${mappedShifts.length} matching Apex records`);
    //                 } else {
    //                     console.log('   ⚠️ No matching Apex records found for this wire record');
    //                 }

    //                 return {
    //                     ...wireRec,
    //                     shiftStaffRecords: mappedShifts   // ⬅️ notice plural
    //                 };
    //             });

    //             console.log('🔹 Tagged Service List (with arrays):', JSON.stringify(taggedServiceList));

    //             // 🔹 Optional: warn if no match found
    //             this.servicesfromparent.forEach((wireRec, idx) => {
    //                 if (!shiftMap[wireRec.ShiftwithStaff__c]) {
    //                     console.warn(`⚠️ Wire record ${wireRec.Id} has ShiftwithStaff__c=${wireRec.ShiftwithStaff__c} but no matching Apex records`);
    //                 }
    //             });

    //             // 🔹 Send enriched list for pagination/display
    //             this.servicePAginationHelper(taggedServiceList);

    //             this.isShowSpinner = false;
    //             console.log('🔹 fetchShiftStaffDetails finished.');
    //         })
    //         .catch(error => {
    //             console.error('❌ Error fetching shift staff details:', error);
    //             this.isShowSpinner = false;
    //         });
    // }

    @wire(getBulkServicesHandler, { PartcipantIdList: '$invoicePartcipantIdList', sDate: '$startDate', eDate: '$endDate', orgid: '$orgid'})  // name:'$searchKey',
    async  wiredBulkServices(result) {
        this.wiredBulkServicesResult = result;
        this.isShowSpinner1 = true;
        /* await this.delay(4000);
        await this.delay(2000); */
       // console.log('📌 Current searchKey in  getBulkServicesHandler:', this.searchKey);
        // Wait until Xero data exists
      
        
        if (result.data) {
                console.log('📌 Raw result.data  wiredBulkServices >>>', JSON.parse(JSON.stringify(result.data)));
                  const serviceData = result.data;
                    const participantIdsValues = [
                        ...new Set(serviceData.map(r => r.SupportInvoice_To_SupportClient__c))
                    ]; 

                console.log('participantIds in bulk service ==>' +JSON.stringify(participantIdsValues));
                 if(participantIdsValues.length>0){
                   // getParticipantFacilityMap({participantIds: participantIdsValues}).then(participantFacilityMap=>{
                      //  console.log('participantFacilityMap in bulk service ==>' +JSON.stringify(participantFacilityMap));
                        // let filterData = serviceData.filter(rec => {
                        //     const participantId = rec.SupportInvoice_To_SupportClient__c;
                        //     //const facilities = participantFacilityMap[participantId] || [];
                        //     //return facilities.some(facId => this.faclist.includes(facId));;
                        // });
                        let filterData = [...serviceData];
                            
                        console.log('✅ After Facility Filter >>>', JSON.parse(JSON.stringify(filterData)));
                        //console.log('this.accountingService in wiredBulkServices : ',this.accountingService);
                        // 🔹 Map records
                        let mappedRecords = filterData.map(invoice => {
                            console.log('🧾 Processing Invoice >>>', JSON.parse(JSON.stringify(invoice)));

                            let fileReference = '';
                            let invoiceNo = '';
                            let invoiceType = '';
                            // let entityName = 'N/A';
                            // let xeroInvoiceId = null;
                            // let addToXeroClass = '';
                            // let addToXeroTitle = '';
                            // let entityLedgerItem = '';
                            // let xeroInvoiceStatus = '';

                            // if (invoice.Is_Service_Invoice__c) {
                                invoiceNo = invoice.Name;
                                invoiceType = 'Service';
                        
                           if (invoice.SupportInvoice_To_SupportClient__r) {

                                const firstName =invoice.SupportInvoice_To_SupportClient__r.First_Name__c || '';

                                const lastName =invoice.SupportInvoice_To_SupportClient__r.Last_Name__c || '';

                                fileReference =  `${firstName} ${lastName}`.trim();

                                console.log(' Participant Name:', fileReference);

                                console.log( 'Participant data:',JSON.stringify(  invoice.SupportInvoice_To_SupportClient__r  ) );
                            }
                            // if (this.accountingService === 'Tesseract System') {
                                if (invoice.Support_InvoiceItems__r && invoice.Support_InvoiceItems__r.length > 0) {
                                    const journalEntry = invoice.Support_InvoiceItems__r[0];
                                //  entityName = journalEntry.Entity_Profile_Name__c ? journalEntry.Entity_Profile_Name__c : 'N/A';
                                // entityLedgerItem=journalEntry.Accounting_Ledger_Items__r.Name ? journalEntry.Accounting_Ledger_Items__r.Name : 'N/A';
                                    console.log('📒 Journal Entry Found:', JSON.parse(JSON.stringify(journalEntry)));
                                
                                }

                            // } 
                        
                            // console.log('🏷️ Entity Name :', entityName);

                            let mapped = {
                                Id: invoice.Id,
                                Name: invoice.Name,
                                Status__c: invoice.Status__c,
                                //GST__c: invoice.GST__c,
                                //Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
                                amount: parseFloat(invoice.Amount__c).toFixed(2),
                                fileReference: fileReference || 'N/A',
                                invoiceNo: invoiceNo || '',
                                invoiceType:invoiceType || '',
                                invoiceNumber: invoiceNo || '',
                                //amazonUrl: invoice.SIL_PDF_Url__c,
                                amazonUrl : invoice?.AWS_URL__c?.trim()  || '',
                                invoiceDate: invoice.DateGenerated__c
                                    ? new Date(invoice.DateGenerated__c).toLocaleDateString('en-GB')
                                    : '',
                                // invoiceEntityName: entityName || '',
                                // entityLedgerItem:entityLedgerItem ||'Sales Income #1',
                                isCancelled: invoice.Status__c === 'Cancelled',
                                //emailCount: invoice.Email_Count__c || '', 

                            
                            };

                            console.log('✅ Mapped Invoice:', mapped);
                            return mapped;
                        });
                
                        this.recordsBulk = mappedRecords;
                        console.log( '📦 All Mapped Records >>>', JSON.parse(JSON.stringify(this.recordsBulk)));

                    
                        this.issuedRecords = mappedRecords.filter(rec => rec.Status__c === 'Generated');
                        this.cancelledRecords = mappedRecords.filter(rec => rec.Status__c === 'Cancelled');
                        console.log('🟩 Issued Records >>>', this.issuedRecords);
                        console.log('🟥 Cancelled Records >>>', JSON.stringify(this.cancelledRecords));

                        // -------------------------------
                        // Bulk pagination
                        // -------------------------------
                        this.totalRecordsBulk = this.recordsBulk.length;
                        this.noRecordsInvoiceFlag = this.recordsBulk.length > 0 ? false : true;
                        if(this.cancelledflag &&  this.cancelledRecords.length===0){
                            this.noRecordsInvoiceFlag =true;
                        }
                        this.pageSizeBulk = this.pageSizeOptionsBulk[0];
                        this.pageNumberBulk = 1;
                        this.totalAmount = this.recordsBulk.reduce((sum, rec) => sum + parseFloat(rec.amount), 0).toFixed(2);

                        console.log('📊 Bulk Pagination Init >>>', {
                            totalRecordsBulk: this.totalRecordsBulk,
                            pageSizeBulk: this.pageSizeBulk,
                            pageNumberBulk: this.pageNumberBulk,
                            totalAmount: this.totalAmount
                        });

                        this.paginationHelperBulk();

                        // -------------------------------
                        // Issued pagination init
                        // -------------------------------
                        this.issuedTotal = this.issuedRecords.length;
                        this.generatedInvoices = this.issuedRecords.length;
                        this.issuedPageSize = this.issuedPageSizeOptions[0];
                        this.issuedPageNumber = 1;
                        this.issuedTotalPages = Math.ceil(this.issuedTotal / this.issuedPageSize) || 1;

                        console.log('📑 Issued Pagination Init >>>', {
                            issuedTotal: this.issuedTotal,
                            issuedPageSize: this.issuedPageSize,
                            issuedPageNumber: this.issuedPageNumber,
                            issuedTotalPages: this.issuedTotalPages
                        });

                        this.updateIssuedPagination();

                        // -------------------------------
                        // Cancelled pagination init
                        // -------------------------------
                        this.cancelledTotal = this.cancelledRecords.length;
                        this.overdueInvoices = this.cancelledRecords.length;
                        this.cancelledPageSize = this.cancelledPageSizeOptions[0];
                        this.cancelledPageNumber = 1;
                        this.cancelledTotalPages = Math.ceil(this.cancelledTotal / this.cancelledPageSize) || 1;

                        console.log('📑 Cancelled Pagination Init >>>', {
                            cancelledTotal: this.cancelledTotal,
                            cancelledPageSize: this.cancelledPageSize,
                            cancelledPageNumber: this.cancelledPageNumber,
                            cancelledTotalPages: this.cancelledTotalPages
                        });

                        this.updateCancelledPagination();
                        this.isShowSpinner = false;

                        console.log('✅ Final Issued Records:', this.issuedRecords);
                        console.log('✅ Final Cancelled Records:', this.cancelledRecords);
                   // })
               } else {
                    // No participant IDs in returned data → clear all stale invoice rows
                    this.recordsBulk          = [];
                    this.bulkServices         = [];
                    this.issuedRecords        = [];
                    this.cancelledRecords     = [];
                    this.issuedPageList       = [];
                    this.cancelledPageList    = [];
                    this.noRecordsInvoiceFlag = true;
                    this.totalRecordsBulk     = 0;
                    this.totalAmount          = 0;
                    this.generatedInvoices    = 0;
                    this.overdueInvoices      = 0;
                    this.isShowSpinner1        = false;
                    this.isShowSpinner       = false;
                }
            
               
                
                this.isShowSpinner1        = false;
                this.isShowSpinner       = false;
            } else if (result.error) {
                this.isShowSpinner1        = false;
                this.isShowSpinner       = false;
                console.error('❌ Error fetching bulk services:', result.error);
            }
       
    }
   
//     renderedCallback() {
//         if (this.jsPDFInitialized) {
//          return; // Prevent reloading scripts multiple times
//      } 
//      console.log('child  rendered call back called ')
//        Promise.all([
//          // loadScript(this, Dompurify),
         
//            loadScript(this, jsPDF),
//           loadScript(this, autoTable),
//           //this line of code is for using custom font in jspdf because jspdf supports only few fonts like courier,times-roman and helvitica.
//           //to use custom font we have downloaded the font from google which is .ttf converted ttf to js and upload in static resource.
//           loadScript(this, robotoFont)
         
//            ]).then(() => {   
//               this.jsPDFInitialized = true;
//              console.log('✅ jsPDF and ROBOTO font loaded');
  
//              // ✅ Register the Roboto font manually
//              if (window.jspdf && window.callAddFont) {
//                  window.jspdf.jsPDF.API.events.push(['addFonts', window.callAddFont]);
//                  console.log('✅ Roboto font registered via callAddFont');
//              } else {
//                  console.warn('⚠️ callAddFont or jsPDF not available in window scope');
//              }
//                        // ✅ Register the autoTable plugin
//             if (window.jspdf?.jsPDF && window.jspdf?.autoTable) {
//                 window.jspdf.jsPDF.API.autoTable = window.jspdf.autoTable;
//                 console.log('✅ autoTable registered with jsPDF');
//             } else {
//                 console.error('❌ autoTable plugin or jsPDF not properly loaded.');
//             }
    
//              // Verify if font is registered
//              const { jsPDF } = window.jspdf;
//              const doc = new jsPDF();
//              console.log('🧾 Available fonts:', doc.getFontList());  
//             // console.log("JS loaded jsPDF");
//            }).catch(error => {
//             // console.error("Error " + error);
//            });;
//    }
scriptLoadingPromise;
scriptLoaded = false;renderedCallback() {

    if (this.scriptLoadingPromise) {
        return;
    }

    console.log('Loading jsPDF scripts...');

    this.scriptLoadingPromise = loadScript(this, jsPDF)

        .then(() => {

            console.log('✅ jsPDF loaded');

            return loadScript(this, autoTable);
        })

        .then(() => {

            console.log('✅ autoTable loaded');

            return loadScript(this, robotoFont);
        })

        .then(() => {

            console.log('✅ Roboto font loaded');

            // Register font
            if (window.jspdf && window.callAddFont) {

                window.jspdf.jsPDF.API.events.push([
                    'addFonts',
                    window.callAddFont
                ]);

                console.log('✅ Font registered');
            }

            // Register autoTable
            if (
                window.jspdf &&
                window.jspdf.jsPDF &&
                window.jspdf.autoTable
            ) {

                window.jspdf.jsPDF.API.autoTable =
                    window.jspdf.autoTable;

                console.log(
                    '✅ autoTable registered'
                );

            } else {

                console.error(
                    '❌ autoTable registration failed'
                );
            }

            this.scriptLoaded = true;

        })

        .catch(error => {

            console.error(
                '❌ Script loading failed',
                error
            );
        });
}
//    handleSearchInput(event) {
//     let value = event.target.value;
//     this.searchKey = value;
   
//         console.log('searchKey '+value);
//         console.log('📌 Current searchKey before refreshApex:', this.searchKey);/* 
//         this.isShowSpinner=true; */
//          setTimeout(() => {
//             // if (this.accountingService === 'Tesseract System') {
//             //     refreshApex(this.wiredBulkServicesResult);
//             // } else if (this.accountingService === 'Xero') {
//             //     refreshApex(this.wiredBulkServicesResultForXero);
//             // }
//             refreshApex(this.wiredBulkServicesResult);
//             refreshApex(this.wiredResult);
//         }, 3000); 
//         // Wait 2 seconds after user stops typing
//     }
    triggerRefresh() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            
        }, 2000);
    }

    servicePAginationHelper(serviceList) {
        console.log('🔹 Entered servicePAginationHelper');
        try {
           // console.log('✅ Incoming serviceList:', JSON.parse(JSON.stringify(serviceList)));
        } catch (err) {
            console.error('❌ Failed to stringify incoming serviceList:', err);
        }

        try {
            this.records = serviceList.map((item, index) => {
               // console.log(`\n🔹 Processing record ${index + 1} with Id=${item.Id}`);

                // --- base fields ---
                const slno = index + 1;
                const firstName =item.SupportClient_To_Notes__r?.First_Name__c || '';
                
                const lastName = item.SupportClient_To_Notes__r?.Last_Name__c || '';

                const participantFullName = `${firstName} ${lastName}`.trim();
               const serviceType = item.Support_CoordinatorCatalogueGroup__r?.Name || ''; 
               console.log( '📌 serviceType:', serviceType );
               
                const ServiceDate = item.Entry_Date__c
                    ? new Date(item.Entry_Date__c).toLocaleDateString('en-GB')
                    : '';
                let amount = item.Total_Cost__c != null ? parseFloat(item.Total_Cost__c).toFixed(2) : '0.00';
                const serviceAmount = parseFloat(item.Total_Cost__c || 0);
                // const availableFunds = item.Available_Fund__c != null
                //     ? parseFloat(item.Available_Fund__c).toFixed(2)
                //     : '0.00';
                const unitprice = item.Charge_Level__c != null
                                    ? parseFloat(item.Charge_Level__c).toFixed(2)
                                    : '0.00';
                const Qty = item.Duration_Hours__c != null ? parseFloat(item.Duration_Hours__c).toFixed(2) : '0.00';
               // let uistatus = item.Status__c === 'Not Yet Invoiced' ? 'Pending' : item.Status__c;

                let uistatus =  'Pending';
                const createdFrom = item.Created_From__c ||'';
                if (item.Status__c === 'Cancelled') {
                    const cancelLabel = item.Billable__c
                        ?  ' (Billable)'
                        : ' (Non-Billable)';

                    uistatus = uistatus + cancelLabel;
                   // amount=item.Cancel_Payment__c != null ? parseFloat(item.Cancel_Payment__c).toFixed(2) : '0.00';
                }

               

                   const participantInvoiceAmount = serviceAmount;

               // const participantTitle = isManualService ? 'Created via Add Service' : participantFullName;
            //    const participantTitle = isManualService
            //         ? 'This invoice is raised independently\nand is not generated from a shift.'
            //         : participantFullName;

            

                // --- new aggregation logic ---
                //let participantExtraAmount = 0;
                //let hasPendingReimbursement = false;

                // 🟩 Case 1: multiple Apex records
                // if (item.shiftStaffRecords && Array.isArray(item.shiftStaffRecords)) {
                //     console.log(`   🔹 Found ${item.shiftStaffRecords.length} shiftStaffRecords`);

                //     item.shiftStaffRecords.forEach((rec, idx) => {
                //         console.log(`   🔸 shiftStaffRecords[${idx}] =>`, JSON.parse(JSON.stringify(rec)));

                //         // Sum up participant-based mileage/service amounts
                //         if (rec.Mileage_Bill__c === 'Participant') {
                //             participantExtraAmount += parseFloat(rec.Mileage_Amount__c || 0);
                //             console.log(`      ➕ Mileage_Amount__c: ${rec.Mileage_Amount__c}`);
                //         }

                //         if (rec.Service_Amount__c === 'Participant') {
                //             participantExtraAmount += parseFloat(rec.Amount__c || 0);
                //             console.log(`      ➕ Service Amount__c: ${rec.Amount__c}`);
                //         }

                //         // Detect pending reimbursement
                //         if (rec.Approval_Status__c === 'Pending') {
                //             hasPendingReimbursement = true;
                //             console.log(`      ⚠️ Pending Approval found`);
                //         }
                //     });
                // }

                // 🟨 Case 2: fallback single object (legacy)
                // else if (item.shiftStaffRecord) {
                //     console.log(`   🔹 Single shiftStaffRecord:`, JSON.parse(JSON.stringify(item.shiftStaffRecord)));

                //     const rec = item.shiftStaffRecord;
                //     if (rec.Mileage_Bill__c === 'Participant') {
                //         participantExtraAmount += parseFloat(rec.Mileage_Amount__c || 0);
                //         console.log(`      ➕ Mileage_Amount__c: ${rec.Mileage_Amount__c}`);
                //     }

                //     if (rec.Service_Amount__c === 'Participant') {
                //         participantExtraAmount += parseFloat(rec.Amount__c || 0);
                //         console.log(`      ➕ Service Amount__c: ${rec.Amount__c}`);
                //     }

                //     if (rec.Approval_Status__c === 'Pending') {
                //         hasPendingReimbursement = true;
                //         console.log(`      ⚠️ Pending Approval found`);
                //     }
                // }

                //console.log(`   ✅ participantExtraAmount total: ${participantExtraAmount}`);
                //console.log(`   ✅ hasPendingReimbursement: ${hasPendingReimbursement}`);

                return {
                    ...item,
                    slno,
                    participantFullName,
                    serviceType,
                     Status__c: item.Status__c || 'Pending',
                    ServiceDate,
                    amount,
                    //availableFunds,
                    unitprice,
                    Qty,
                    uistatus,
                    createdFrom,
                    //totalReimbursementAmount,
                   // participantExtraAmount,   // 🔹 aggregated total
                   // hasPendingReimbursement,  // 🔹 flag
                    isEditingQty: false,
                    // entityName,
                    // fundsTrackerId,
                   // isManualService,
                   // participantTitle,
                   // Resource_Name__c,
                    participantInvoiceAmount,
                    // reimbursementAmount,
                    // reimbursementQty,
                    // reimbursementRate,
                    // reimbursementList: item.ParticipantReimbrusements__r || [],
                };
            });

            console.log('🔹 Finished mapping records');
            this.noRecordsFlag = this.records.length === 0;
            console.log(`📊 noRecordsFlag: ${this.noRecordsFlag}`);
            console.log('\n✅ Final this.records:', JSON.parse(JSON.stringify(this.records)));

        } catch (err) {
            console.error('❌ Error in servicePAginationHelper map():', err, err.stack);
        }

        // --- pagination setup ---
        this.pendingInvoices = this.records.length;
        this.totalRecords = serviceList.length;
        this.pageSize = this.pageSizeOptions[0];
        console.log(`📊 pendingInvoices: ${this.pendingInvoices}`);
        console.log(`📊 totalRecords: ${this.totalRecords}`);
        console.log(`📊 pageSize: ${this.pageSize}`);

        console.log('🔹 Calling paginationHelper()...');
         console.log(`📊 noRecordsFlag before  in paginationHelper in servicePAginationHelper: ${this.noRecordsFlag}`);
        this.paginationHelper();
         console.log(`📊 noRecordsFlag after  in paginationHelper in servicePAginationHelper: ${this.noRecordsFlag}`);
        console.log('✅ paginationHelper() call finished.');
    }

   
        HandleBack() {
        this.dispatchEvent(new CustomEvent("rosterinvoicebackbutton"));
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
    @track isAllSelected = false;
    paginationHelper() {
        this.accList = [];
       // console.log('this.records in paginationHelper:', JSON.stringify(this.records));
         //this.noRecordsFlag = !this.records || this.records.length === 0;
         console.log(`📊 noRecordsFlag before  in paginationHelper: ${this.noRecordsFlag}`);
            this.noRecordsFlag = this.records.length > 0 ? false : true;
            console.log(`📊 noRecordsFlag after  in paginationHelper: ${this.noRecordsFlag}`);
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
        let AllServiceListMap = new Map();
    
        this.accList.forEach(rec => {
       
                const clientId = rec.SupportClient_To_Notes__r?.Id;
                if (!AllServiceListMap.has(clientId)) {
                     AllServiceListMap.set(clientId, []);
                }
                 AllServiceListMap.get(clientId).push(rec);
          
        });
       //  console.log(' this.accList in paginationHelper:', JSON.stringify( this.accList));
    
        const allKeys = Array.from(AllServiceListMap.keys());
      //   console.log('allKeys in paginationHelper:', allKeys);
          console.log(`📊 noRecordsFlag after  in paginationHelper111: ${this.noRecordsFlag}`);
        //console.log('Size of accList >>> ' + this.accList.length);
        //this.pendingInvoices = this.accList.length;
    
        // setTimeout(() => {
        //     console.log('setTimeout in paginationHelper ');
        //     const headerCheckbox = this.template.querySelector('thead lightning-input[type="checkbox"]');
        //     console.log('headerCheckbox in paginationHelper : ',headerCheckbox);
        //     if (headerCheckbox) {
        //         headerCheckbox.checked = false;
        //         console.log('headerCheckbox in paginationHelper if  : ',headerCheckbox.checked);
        //     }
        // }, 1000);
        this.isAllSelected = false;
        this.disableBool = true;
        //console.log('')
        // this.accList = this.accList.map(acc => ({
        //     ...acc,
        //     isChecked: false
        // }));
    }

    // Helper: return a Set of selected statuses
getSelectedStatusesSet() {
    return new Set(Array.from(this.selectedRecordMap.values()).map(v => v.status));
}

// Helper: check if any selected has Invoice Generated
hasInvoiceGeneratedSelected() {
    return Array.from(this.selectedRecordMap.values()).some(v => v.status === 'Generated');
}

// Helper: allowed statuses (exact strings)
isAllowedStatus(status) {
    return status === 'Not Yet Invoiced' || status === 'Cancelled';
}

// Helper: check the "all same and allowed" condition
allSelectedStatusesAreSameAndAllowed() {
    const statuses = this.getSelectedStatusesSet(); // Set of status strings
    if (statuses.size === 0) return false; // nothing selected => invalid
    if (statuses.size > 1) return false;  // mixture of statuses => invalid
    const onlyStatus = Array.from(statuses)[0];
    return this.isAllowedStatus(onlyStatus);
}
isCancelledNonBillableStatusPair(status, billFlag) {
    console.log('status  '+status);
     console.log('billFlag  '+billFlag);
    return status === 'Cancelled' && billFlag === false;
}


/* -------------------------
   Checkbox change handler
   ------------------------- */
   // isEntityExist= true;
    async  handleCheckboxChange(event) {
        const recordId = event.target.dataset.id;
        const status = event.target.dataset.status; // raw status coming from DOM
        //const fundsTrackerId = event.target.dataset.fundstrackerid;
        const billRaw = event.target.dataset.bill;
        const bill = billRaw === 'true' || billRaw === true;
        const isChecked = event.target.checked;

        // ---- DEBUG LOGS (very explicit) ----
        console.log('--- handleCheckboxChange START ---');
        console.log('recordId:', recordId);
        console.log('raw status from dataset:', status);
        // console.log('fundsTrackerId:', fundsTrackerId);
         console.log('raw bill value from dataset:', billRaw, '-> interpreted bill boolean:', bill);
        console.log('isChecked (user action):', isChecked);
        console.log('selectedRecordMap BEFORE change:', Array.from(this.selectedRecordMap.entries()));

        // Block selecting Cancelled + Non-Billable
        if (isChecked && status === 'Cancelled'  && bill === false) {   //&& bill === false
            // revert checkbox in UI
            event.target.checked = false;

            // keep action disabled
            this.disableBool = true;

            // specific not-allowed toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Not Allowed',
                    message: 'Cancelled (Non-Billable) records cannot be selected.',
                    variant: 'warning',
                    mode: 'dismissable'
                })
            );

            console.log('Blocked: Cancelled + Non-Billable selection attempt. Exiting handler.');
            console.log('--- handleCheckboxChange END ---');
            return;
        }

        // Normal add/remove from map
        if (isChecked) {
            //this.selectedRecordMap.set(recordId, { status, fundsTrackerId, bill });
            const acc = this.accList.find(a => a.Id === recordId);

            this.selectedRecordMap.set(recordId, {
                status,
               // fundsTrackerId,
                bill,
                clientId: acc?.SupportClient_To_Notes__r?.Id // 🔥 NEW
            });
        } else {
            this.selectedRecordMap.delete(recordId);
        }

        // Update accList row checked state so UI reflects the change
        this.accList = this.accList.map(acc => acc.Id === recordId ? { ...acc, isChecked } : acc);
        
        this.partcipantServicesMap = new Map();

        
        // group by clientId
        // this.accList.forEach(rec => {
        //     if (rec.isChecked === true) {
        //         const clientId = rec.Client__r?.Id;
        //         if (clientId) {
        //             if (!this.partcipantServicesMap.has(clientId)) {
        //                 this.partcipantServicesMap.set(clientId, []);
        //             }
        //             this.partcipantServicesMap.get(clientId).push(rec);
        //         }
        //     }
        // });
        this.selectedRecordMap.forEach(value => {
            const clientId = value.clientId;
            if (clientId) {
                if (!this.partcipantServicesMap.has(clientId)) {
                    this.partcipantServicesMap.set(clientId, []);
                }
                this.partcipantServicesMap.get(clientId).push(value);
            }
        });

        const allKeys = Array.from(this.partcipantServicesMap.keys());
        console.log('✅ All Client IDs (keys):', allKeys);
        this.accList = this.accList.map(acc => ({
            ...acc
           // showCreateCompanyIcon: false
        }));
        console.log('participantServicesMap :', Array.from(this.partcipantServicesMap.entries()));
        console.log('accList :', JSON.stringify(this.accList));
        console.log('selectedRecordMap :', Array.from(this.selectedRecordMap.entries()));
        // if (allKeys.length > 0 && !this.accountingServiceflag) {
        //     await this.checkCompanyExist();
        //     const hasCompanyMissing = this.accList.some(
        //         acc => acc.isChecked === true && acc.showCreateCompanyIcon === true
        //     );

        // }

        // /* =====================================================
        // 6️⃣ ENTITY CHECK (LOCAL) 🔴 NEW
        // ===================================================== */
        // const isEntityValid = this.checEntityExist();
        // if (!isEntityValid) {
        //     return;
        // }

        // Update joined status string
        this.checkStatus = Array.from(this.selectedRecordMap.values()).map(v => v.status).join(',');

        // ---- MORE DEBUG: show derived values used for final validation ----
        const statusesSet = this.getSelectedStatusesSet();
        console.log('selected statuses set:', Array.from(statusesSet));

        const hasInvoiceGenerated = this.hasInvoiceGeneratedSelected();
        console.log('hasInvoiceGeneratedSelected():', hasInvoiceGenerated);

        // NOTE: log each status and whether isAllowedStatus() thinks it's allowed
        Array.from(statusesSet).forEach(s => {
            console.log(`isAllowedStatus("${s}") =>`, this.isAllowedStatus(s));
        });

       // const allSameAndAllowed = this.allSelectedStatusesAreSameAndAllowed();
       // console.log('allSelectedStatusesAreSameAndAllowed():', allSameAndAllowed);
        // const hasCompanyMissing = this.accList.some(
        //     acc => acc.showCreateCompanyIcon
        // );

       if (this.selectedRecordMap.size > 0 && !hasInvoiceGenerated ) {   //  && allSameAndAllowed  // If invalid, only show toast when user was trying to check a box
            this.disableBool = false;
            console.log('Selection VALID -> disableBool = false');
        } else {
            this.disableBool = true;
            console.log('Selection INVALID -> disableBool = true');

            // show invalid-selection toast only when user was checking (not unchecking)
            if (isChecked) {
                console.log('Will show Invalid Selection toast because user tried to check and final selection invalid.');
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Invalid Selection',
                        message: 'Please select records with the same status: either "Pending" or "Cancelled".',
                        variant: 'warning',
                        mode: 'dismissable'
                    })
                );
            } else {
                console.log('No toast: user was unchecking (no need to warn).');
            }
        }

        // Update header checkbox state
        this.isAllSelected = this.accList.length > 0 && this.accList.every(acc => acc.isChecked);

        console.log('selectedRecordMap AFTER change:', Array.from(this.selectedRecordMap.entries()));
        console.log('checkStatus:', this.checkStatus);
        console.log('disableBool final:', this.disableBool);
        console.log('--- handleCheckboxChange END ---');
    }

    handleInvoiceParticipantChange(event) {

        const val = event.detail.value;

        // Ignore search typing
        if (!Array.isArray(val)) {
            return;
        }

        this.invoicePartcipantIdList =
            val.length > 0 ? val : [];


        // reset invoice pagination
        this.pageNumberBulk      = 1;
        this.issuedPageNumber    = 1;
        this.cancelledPageNumber = 1;


        setTimeout(() => {
            refreshApex(this.wiredBulkServicesResult);
        }, 500);
    }
    handleCheckBoxVisible(){

        this.participantCheckBox = !this.participantCheckBox;
    }

     tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    async handleGenerateInvoice() {
        this.isInvoiceflag = false;
        this.disableBool = false;
        this.showProgressBar = true;
        this.progressValue = 0;
        try {
          
            await this.handleAccountingInvoiceGeneration();
           
        } catch (error) {
        console.error('❌ Error in handleGenerateInvoice:', error);
        // Optionally show error message to user
        } finally {
            // ✅ Always hide spinner
            this.showProgressBar = false;
        }
    }
    
    async handleAccountingInvoiceGeneration() {
        console.log('handleAccountingInvoiceGeneration is calling : ');

        if (!this.partcipantServicesMap) {
            this.partcipantServicesMap = new Map();
        }
        this.partcipantServicesMap.clear();

        // group by clientId
        this.accList.forEach(rec => {
            if (rec.isChecked === true) {
                const clientId = rec.SupportClient_To_Notes__r?.Id;
                if (!this.partcipantServicesMap.has(clientId)) {
                    this.partcipantServicesMap.set(clientId, []);
                }
                this.partcipantServicesMap.get(clientId).push(rec);
            }
        });

        const allKeys = Array.from(this.partcipantServicesMap.keys());
        console.log('✅ All Client IDs (keys):', allKeys);

        let index = 0;
        for (const key of allKeys) {
            console.log('⏳ Processing participantId:', key);
           // const companyId = this.companyByParticipantMap[key];
            // if (!companyId) {
            //     console.error('❌ Company missing for participant:', key);
            //     continue; // safety fallback
            // }

            
            try {
                //const company = companyResponse[key];
               //const accountValue = accountResponse[key] || {};
                const participantServices = this.partcipantServicesMap.get(key) || [];

                console.log('➡️ participantServices:', JSON.stringify(participantServices));
                if (participantServices.length === 0) {
                    continue;
                 }

                this.salesEntryList = [];
                this.salesEntry = this.emptyAccoutDetails();

                // --- build SalesEntry with entityProfileId ---
                this.salesEntry = {
                   // company: companyId || null,
                   // entryType: 'Sales',
                    // entityName: participantServices.length > 0 ? participantServices[0].entityName : null,
                    // entityProfileId: participantServices.length > 0 ? participantServices[0].entityProfileId : null, // 👈 here
                    participantId: key || '',
                    entryDate: new Date().toISOString().split('T')[0],
                   // PostDate: null,
                    //dueDate: null,
                   // IncludeGST: 'Yes',
                    status: 'Generated',
                    //comments: '',
                    participantID: key,
                    //ServicesList: '',
                    //taxInclusive: true,
                   // InvoiceNo: Date.now().toString()
                    InvoiceNo:'',
                    servicesList: participantServices .map(row => row.Id) .join(','),
                    totalAmount: participantServices.reduce( (sum, row) => sum + Number( String( row.participantInvoiceAmount || 0 ) .replace('$', '') .replace(',', '') ), 0 )
                  
                };

                

                //    participantServices.forEach(service => {
                //         // ✅ 1. SERVICE ROW (existing)
                //         this.addRow(service, {
                //             Id: service.accountItemId
                //         });
                        
                //     }); 
            this.salesEntryList = participantServices.map( (row, rowIndex) => ({ 
                sno: rowIndex + 1,
                 noteId: row.Id || '', 
                 participantId: row.SupportClient_To_Notes__c || '', 
                 serviceType: row.serviceType || '', 
                 supportItemName: row .Support_CoordinatorCatalogue__r ?.Support_Item_Name__c || '',
                 supportItemNumber: row .Support_CoordinatorCatalogue__r ?.Support_Item_Number__c || '',
                 description: row.Description__c ||'',
                hours: Number( String(row.Qty || 0) .replace('$', '') .replace(',', '') ), 
                unitPrice: Number( String(row.unitprice || 0) .replace('$', '') .replace(',', '') ), 
                amount: Number( String( row.participantInvoiceAmount || 0 ) .replace('$', '') .replace(',', '') ), 
                status: row.Status__c || 'Pending' }) );



                // services list
               // this.salesEntry.ServicesList = participantServices.map(s => s.Id).join(',');

                //this.recalculateTotals();
                console.log('📤 Sending to Apex:');
                console.log('SalesEntry:', JSON.stringify(this.salesEntry));
                console.log('SalesEntryList:', JSON.stringify(this.salesEntryList));
                 //console.log('this.amountarrey', JSON.stringify(this.amountarrey));

                //  const updateResult = await UpdateDataFromInvoice({
                //     salesEntryJson: JSON.stringify(this.salesEntry),
                //     salesEntryListJson: JSON.stringify(this.salesEntryList),
                //     amountEntryJson: JSON.stringify(this.amountarrey),
                //     isRFQ: false,
                //     isParticipantInvoice: true
                // });
                const invoiceId  = await generateInvoices({
                    salesEntryJson:JSON.stringify(this.salesEntry),
                    salesEntryListJson:JSON.stringify(this.salesEntryList)
                });
                const invoiceResponse =
                        await getSupportInvoiceById({ invoiceId });

                console.log( 'invoiceResponse =>', JSON.stringify(invoiceResponse) );
               
             this.invRecords = [invoiceResponse];

            const base64 =
                 await this.generateBase64Data();
               
                this.progressValue = Math.round(((index + 1) / allKeys.length) * 100);
                index++;  
            } catch (error) {
                console.error('❌ Error for participantId', key, error);
                this.showProgressBar = false;
            }

            await this.sleep(2000);
            setTimeout(() => {
                refreshApex(this.wiredBulkServicesResult);
                this.isInvoiceflag = true;
                this.showProgressBar = false;
                this.progressValue = 0;
                this.disableBool = true;
                refreshApex(this.wiredResult);
            }, allKeys.length * 3000);
        }
    }

    // Helper sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateBase64Data() {
        console.log('jspdfentered');
          await this.scriptLoadingPromise;

            //const { jsPDF } = window.jspdf;
            var doc = new window.jspdf.jsPDF();
            //new jsPDF();
            
            const invoice = this.invRecords[0];
                console.log('INVOICE RECORDS'+JSON.stringify(invoice));
                  const safe = (v) => v === null || v === undefined ? '' : String(v);
   
            //var statePostalWithoutCommas = this.invRecords[0].Company__r.Address__c.replace(/,/g, " ");
           
        // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );


             const firstName =safe(invoice.SupportInvoice_To_SupportClient__r ?.First_Name__c );

            const lastName =safe(invoice .SupportInvoice_To_SupportClient__r?.Last_Name__c);
           
            const clientName = `${firstName} ${lastName}`.trim();

            const invoiceId = safe(invoice.Name);

            let rawDate =safe(invoice.DateGenerated__c);

            let serviceDate = '';

            if (rawDate) {
                const dateObj = new Date(rawDate);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                serviceDate = `${day}/${month}/${year}`;
            }

            const orgName = safe(this.orgName || '');

            const abn = safe(this.abn || '');

            const street = safe(this.street || '');

            const cityLine =safe(this.fullAddressLine || '');

            const phone =safe(this.Contact || '');


            doc.setFont("Roboto-Bold", "bold");
            // ===============================
            // ORGANISATION LOGO + DYNAMIC HEADER
            // ===============================

            let headerY = 15;


            if (this.orgLogo) {

                try {

                    const maxWidth = 40;
                    const maxHeight = 20;


                    const imgProps = doc.getImageProperties(this.orgLogo);


                    let imgWidth = imgProps.width;
                    let imgHeight = imgProps.height;


                    const scale = Math.min(
                        maxWidth / imgWidth,
                        maxHeight / imgHeight
                    );


                    imgWidth = imgWidth * scale;
                    imgHeight = imgHeight * scale;


                    const logoX =
                        10 + (maxWidth - imgWidth) / 2;


                    const logoY =
                        5 + (maxHeight - imgHeight) / 2;



                    doc.addImage(
                        this.orgLogo,
                        'PNG',
                        logoX,
                        logoY,
                        imgWidth,
                        imgHeight
                    );


                    headerY = 30;


                } catch(error){

                    console.log(
                        'Org logo error',
                        error
                    );

                }
            }



            // ORG NAME

            doc.setTextColor(0,102,255);

            doc.setFont(
                "Roboto-Bold",
                "bold"
            );

            doc.setFontSize(12);


            doc.text(
                orgName.toUpperCase(),
                10,
                headerY
            );  
            //console.log('orgname '+this.orgname);    
           console.log('616');
            //if (this.accountingService === 'Tesseract System') {
                doc.setTextColor(0,0,0);
                doc.setFont("Roboto-Bold", "bold");
                doc.setFontSize(12);
                doc.text(
                    "ABN: "+ abn,
                    10,
                    headerY + 5
                );
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        
            
                doc.setFontSize(10);
                doc.text(
                    street +",",
                    10,
                    headerY + 10
                );
               doc.text(
                    cityLine,
                    10,
                    headerY + 15
                );
                doc.text(
                    "Contact: "+ phone,
                    10,
                    headerY + 20
                );
                            
            
            //}
   
            
          let invoiceHeaderY = headerY;
            // top  left side box start  
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
        // doc.text("Invoice Number", 150, 24);
            doc.text("TAX  INVOICE", 158, invoiceHeaderY);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text(invoiceId, 158,  invoiceHeaderY + 5);
   
       
           // const oldDate = invoice.Invoice_Date__c;
           // const arr = oldDate.split('-');
           // const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];      
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Date Issued: "+serviceDate, 158, invoiceHeaderY + 10);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);

            //let fileReference='';
            //console.log('fileReference  1 '+fileReference );
            //console.log('invoice.Participant__r ==> '+invoice.Participant__r );
           
            // doc.text("TAX INVOICE To: "+fileReference , 10, 72);   

            doc.setFontSize(10);
            doc.setFont("Roboto-Bold", "bold");
            doc.setTextColor(0, 0, 0);
          let taxInvoiceY = headerY + 40;


            doc.text(
                "Tax Invoice To:",
                10,
                taxInvoiceY
            );


            let participantStartY =
                taxInvoiceY + 6;

            const participant = invoice.SupportInvoice_To_SupportClient__r || {};

            // ✅ Correct participant name
            //const participantName = participant.Name__c || '';

            // ✅ Address in ONE LINE (comma separated)
            const participantAddress = [
                participant.Address__Street__s,
                participant.Address__City__s,
                participant.Address__StateCode__s,
                participant.Address__PostalCode__s
            ]
            .filter(Boolean)          // removes null / undefined
            .join(', ');              // joins with commas

           // ✅ NDIS number (safe)
          // const participantNDIS = participant.NDIS_Number__c || '';
            const participantNDIS =
                safe(participant.NDIS_Number__c || '');
            // Font size same style as Payable To
            doc.setFontSize(10);

            // Participant Name
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Name", 10, participantStartY);
            doc.text(":", 55, participantStartY);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(clientName, 58, participantStartY);

            // Participant Address (single line)
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Address", 10, participantStartY + 5);
            doc.text(":", 55, participantStartY + 5);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(participantAddress, 58, participantStartY + 5, {
                maxWidth: 130   // keeps it clean on page
            });

            // // NDIS Number
            // doc.setFont("Roboto-Bold", "bold");
            // doc.text("NDIS Number", 10, participantStartY + 10);
            // doc.text(":", 55, participantStartY + 10);
            // doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            // doc.text(participantNDIS, 58, participantStartY + 10);

            // NDIS Number – show ONLY if value exists
            if (participantNDIS) {
                doc.setFont("Roboto-Bold", "bold");
                doc.text("NDIS Number", 10, participantStartY + 10);
                doc.text(":", 55, participantStartY + 10);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(participantNDIS, 58, participantStartY + 10);
            }

            // ✅ IMPORTANT: push table BELOW participant section
            let participantEndY = participantStartY + 16;



           
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
           
           let yPosition = participantEndY + 6; // spacing before table

            // let yPosition = 82;
            var result = [];
            var subTotal = 0;
            let tabledata = [];
           // if (this.accountingService === 'Tesseract System') {
                  tabledata = this.invRecords[0].Support_InvoiceItems__r;
                console.log('INVOICE in Accounting '+JSON.stringify(tabledata));
           
           
          
           
           tabledata.forEach(record => {
               //console.log('record.Service_Cancel_Payment__c : ', record.Service_Cancel_Payment__c);
                    //console.log('record.Total_Amount__c : ', record.Total_Amount__c);

                //     const isCancelled = record.Service_Cancel__c === true;

                //     const qtyValue = isCancelled ? "-" : record.Quantity__c.toFixed(2);

                //     const unitPriceValue = isCancelled
                //         ? "-"
                //         : record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

                //     const amountValue = isCancelled
                //         ? Number(record.Service_Cancel_Payment__c || 0).toLocaleString('en-US', { 
                //             style: 'currency', 
                //             currency: 'USD' 
                //         })
                //         : record.Total_Amount__c.toLocaleString('en-US', { 
                //             style: 'currency', 
                //             currency: 'USD' 
                //         });
                //  console.log('amountValue : ', amountValue);
                //     // subtotal only adds non-cancel entries OR add canceled payment?  
                //     // (Your earlier code added only Total_Amount__c, so follow same logic)
                //     subTotal += isCancelled ? Number(record.Service_Cancel_Payment__c || 0) : record.Total_Amount__c;
                 const supportItemNumber =
                    safe(
                        record.Support_Item_Number__c
                            || 'N/A'
                    );

                // const supportItemName =
                //     safe(
                //         record.Service_Type_Name__c || ''
                //     );

                const description =
                    safe(
                        record.Description__c || ''
                    );

                const qty =
                    Number(
                        record.BillableHours__c || 0
                    );

                const rate =
                    Number(
                        record.UnitPrice__c || 0
                    );

                const amount =
                    Number(
                        record.Amount__c || 0
                    );

                subTotal += amount;

                            result.push([
                                supportItemNumber,
                               description,
                               qty.toFixed(2),
                               '$' + rate.toFixed(2),
                               '0%',
                               '$' + amount.toFixed(2)
                            ]);
                        });

            console.log(' record RESULT'+JSON.stringify(result));
           
            // Adding subtotal, GST, and total rows
         const gstAmount =
    Number(invoice.Tax_Amount__c || 0);

const totalAmount =
    Number(invoice.Amount__c || 0);

result.push([
    {
        content: "*Taxes are Inclusive",
        styles: {
            textColor: [128, 128, 128]
        }
    },
    "",
    "",
    "",
    "Sub Total:",
    '$' + subTotal.toFixed(2)
]);

result.push([
    "",
    "",
    "",
    "",
    "Total GST:",
    '$' + gstAmount.toFixed(2)
]);

result.push([
    "",
    "",
    "",
    "",
    "Total:",
    '$' + totalAmount.toFixed(2)
]);

console.log(
    'RESULT =>',
    JSON.stringify(result)
);
            console.log('RESULT'+JSON.stringify(result));
                       console.log(
    'autoTable exists =>',
    typeof window.jspdf?.jsPDF?.API?.autoTable
);
            // Generating table using autoTable
            doc.autoTable({
                startY: yPosition, // Starting Y position
               // head: [["Support Item","Description", "Qty", "Rate", "Tax", "Amount"]],
                head: [["Support Item", "Description", "Qty", "Rate", "Tax", "Amount"]],
                body: result,
                theme: "plain",
                margin: { left: 10 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
                bodyStyles: { font: "Helvetica", font: "Roboto-VariableFont_wdth,wght", fontStyle: "normal", },
                columnStyles: {
                1: { cellWidth: 50, halign: "left" },  // Description left-aligned
                2: { cellWidth: 25, halign: "left" },  // Qty left-aligned
                3: { cellWidth: 25, halign: "left" },  // Rate left-aligned
                4: { cellWidth: 25, halign: "right" }, // Tax right-aligned
                5: { cellWidth: 35, halign: "right" },
                6: { cellWidth: 35, halign: "right" }   // Amount right-aligned
                },
                didParseCell: function (data) {
                var columnText = data.row.raw[3]; // Get column text
                if (data.row.index === 0) {
                    if (data.column.index === 4 || data.column.index === 5) {
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
                var columnText = data.row.raw[4];
       
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
                   
                    if (data.column.index === 4 || data.column.index === 5 ) {
                   
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
                doc.text("Payable to:", 10, yPosition + 6);
               
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
                doc.text("Payable to:", 10, yPosition + 6);
               
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Bank:", 10, yPosition + 12);
                doc.text(":", 40, yPosition + 12);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bank || " ", 42, yPosition + 12);
   
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Name:", 10, yPosition + 16);
                doc.text(":", 40, yPosition + 16);      
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.accountName || " ", 42, yPosition + 16);
   
                doc.setFont("Roboto-Bold", "bold");
                doc.text("BSB:", 10, yPosition + 20);
                doc.text(":", 40, yPosition + 20);      
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(this.bsb || " ", 42, yPosition + 20);
   
                doc.setFont("Roboto-Bold", "bold");
                doc.text("Account Number:", 10, yPosition + 24);
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
           
            
            console.log('Generated PDF Base64: ' + this.base64string);
            console.log('Generated PDF Name: ' + this.invRecords[0].Name);
                console.log('Generated recordId: ' + this.invRecords[0].Id);
            
            let objectName;
           
             uploadFile({base64:JSON.stringify( this.base64string), filename:this.invRecords[0].Name+'.pdf', recordId:this.invRecords[0].Id, obj: 'SupportInvoice'})
            .then(result=>{
                setTimeout(() => {
                    console.log('data in uploadFile', result);     
                    // Show success toast message
                    const evt = new ShowToastEvent({
                        title: 'Success',
                        message: 'Invoice generated successfully.',
                        variant: 'success',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
        
                    console.log('PDF generated and uploaded successfully');
                                    
                        this.isInvoiceflag=true;
                        this.showLoadingSpinner = false;
                    // this.selectedRecordMap =  [];
                        this.selectedRecordMap = new Map();   
                        this.invRecords=[]; 
                    
                    //  this.disableBool = true;
                
                        refreshApex(this.wireServiceList);
                        refreshApex(this.wiredBulkServicesResult);
                        // if (this.accountingService === 'Tesseract System') {
                        //     refreshApex(this.wiredBulkServicesResult);
                        // } else if (this.accountingService === 'Xero') {
                        //     refreshApex(this.wiredBulkServicesResultForXero);
                        // }
                        
                    }, 3000)
            })            

        
            // doc.save('Invoice.pdf');
            //  console.log('isSalesFlag  in pdf: ', this.isSalesFlag);
            //  console.log('isRFQEnabled in pdf : ', this.isRFQEnabled);
            //  console.log('isInvoiceflag in pdf : ', this.isInvoiceflag);
            //console.log('invoiceflag in pdf : ', this.invoiceflag);
                //return this.base64string;
        }

   createRow(service, accountValue) {
    let gstRate = 0;
    if (service.GST__c === 'Yes') {
        gstRate = 10;
    }

    const quantity = service.Qty;
    const unitPrice = service.unitprice;
    const subtotal = quantity * unitPrice;

    const taxMultiplier = 1 + (gstRate / 100);
    const taxAmount = parseFloat((subtotal - (subtotal / taxMultiplier)).toFixed(2));
    const totalAmountCalculated = parseFloat((subtotal + taxAmount).toFixed(2));

    console.log('row in sales Cancel_Payment__c ==> ' + service.Cancel_Payment__c);

    // simple, safe parse of cancel value
    let cancelValueNum = parseFloat(service?.Cancel_Payment__c);
    if (!isFinite(cancelValueNum)) {
        cancelValueNum = 0;
    }

    // your cancel flag (use same field you used elsewhere)
    const isCancelled = !!service.Bill_Participant__c;

    // if cancelled, use cancelValueNum as total amount, otherwise use calculated total
    const finalTotalAmount = isCancelled ? parseFloat(cancelValueNum.toFixed(2)) : totalAmountCalculated;

    const newRow = {
        Id: Date.now(),
        sno: this.salesEntryList.length + 1,
        Description__c: service.Description__c,
        accountList: (accountValue?.Name || '') + ' - ' + (accountValue?.Account_Number__c || ''),
        Quantity__c: quantity,
        UnitPrice__c: unitPrice,
        Amount__c: unitPrice,
        tax: gstRate + '%',
        taxvalue: gstRate + '%',
        accountItemId: accountValue?.Id || '',
        subTotal: parseFloat(subtotal.toFixed(2)),   // ✅ Subtotal (without tax)
        taxAmount: taxAmount,                         // ✅ Tax extracted
        totalAmount: finalTotalAmount,                // <-- changed: respecting cancel flag
        lineItems: service.Lineitem__c,
        isServiceCancel: isCancelled,
        // keep cancelPayment numeric (2 decimals)
        cancelPayment: parseFloat(cancelValueNum.toFixed(2))
    };

    console.log('row in sales entry list ==> ' + JSON.stringify(newRow));
    return newRow;
}
    
    addRow(service,accountValue) {
        const newRow = this.createRow(service,accountValue);
        this.salesEntryList = [...this.salesEntryList, newRow];
     //   console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
        this.reindexSalesEntryList(); // ensure S.No is always in order
    }
    reindexSalesEntryList() {
        this.salesEntryList = this.salesEntryList.map((row, index) => ({
            ...row,
            sno: index + 1
        }));
    }
    emptyAccoutDetails(){
        const row={
            //company: '',
           // entryType: 'Sales',
           // entityName: null,
            InvoiceDate: '',
           // PostDate: '',
           // InvoiceNo: '',
            //IncludeGST: '',
            Status: '',
            //comments: ''
        }
        return row;
    }
   
    recalculateTotals() {
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;
    
        this.salesEntryList.forEach(entry => {
            totalSubTotal += parseFloat(entry.subTotal) || 0;
            totalTaxAmount += parseFloat(entry.taxAmount) || 0;
            totalAmount += parseFloat(entry.totalAmount) || 0;
        });
    
        this.amountarrey = {
            subTotal: parseFloat(totalSubTotal.toFixed(2)),
            taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2))
        };
    
        // Optional: set them separately too
      
    }
   
    handleView(event) {
        const url = event.currentTarget.dataset.url;
        event.preventDefault(); 
        refreshApex(this.wiredResult);
        refreshApex(this.wiredBulkServicesResult);
        // if (this.accountingService === 'Tesseract System') {
        //     refreshApex(this.wiredBulkServicesResult);
        // } else if (this.accountingService === 'Xero') {
        //      refreshApex(this.wiredBulkServicesResultForXero);
        // }

        setTimeout(() => {
            this.currentUrl = url;
            console.log('file url  ' + this.currentUrl);  
            console.log('this.generatedInvoicestask  >>>', this.generatedInvoicestask);

            // ✅ Check if generatedInvoicesTask is true
            if (this.generatedInvoicestask === true) {
                this.generatedflag = false;
                this.tilesflag = true;
                console.log('this.generatedflag  >>>', this.generatedflag);
                console.log('generatedInvoicesTask is true → setting generatedflag to false');
            }

            if (this.totalAmounttask === true) {
                this.totalvalueflag = false;
                this.tilesflag = true;
                console.log('this.totalvalueflag  >>>', this.totalvalueflag);
            }

            if (this.overdueInvoicestask === true) {
                this.cancelledflag = false;
                this.tilesflag = true;
                console.log('this.totalvalueflag  >>>', this.totalvalueflag);
            }

            this.isModalOpen = true;
            this.isModalRelate = false;
        }, 1000);
    }


    closeaddPayrollinvoice(){
        this.isModalOpen = false;
        this.isModalRelate = true;
        this.currentUrl = null;
        if (this.generatedInvoicestask === true) {
            this.generatedflag = true;
            this.tilesflag = false;
        }

        if (this.totalAmounttask === true) {
            this.totalvalueflag = true;
            this.tilesflag = false;
        }

        if (this.overdueInvoicestask === true) {
            this.cancelledflag = true;
            this.tilesflag = false;
        }
        refreshApex(this.wiredBulkServicesResult);
        // if (this.accountingService === 'Tesseract System') {
        //     refreshApex(this.wiredBulkServicesResult);
        // } else if (this.accountingService === 'Xero') {
        //      refreshApex(this.wiredBulkServicesResultForXero);
        // }
    }

    handleRecordsPerPageBulk(event) {        
        this.pageSizeBulk = event.target.value;        
        this.paginationHelperBulk();
    }

    previousPageBulk() {
        this.pageNumberBulk = this.pageNumberBulk - 1;
        this.paginationHelperBulk();
    }

    nextPageBulk() {
        this.pageNumberBulk = this.pageNumberBulk + 1;
        this.paginationHelperBulk();
    }

    firstPageBulk() {
        this.pageNumberBulk = 1;
        this.paginationHelperBulk();
    }

    lastPageBulk() {
        this.pageNumberBulk = this.totalPagesBulk;
        this.paginationHelperBulk();
    }
  

    paginationHelperBulk() {

        //for 2nd table
       // this.bulkSelectAllChecked = false;
    this.disableBulkInvoice = true;
     this.selectedInvoiceIds = [];//manendra
    this.showExportCSV = false;//manendra
    this.recordsBulk = this.recordsBulk.map(r => ({
        ...r,
        isChecked: false
    }));
    //force false
   // this.bulkSelectAllChecked = Boolean(false);
        this.bulkServices = [];
          console.log('this.totalRecordsBulk in paginationHelperBulk ==>' +JSON.stringify(this.totalRecordsBulk));
        // calculate total pages
        this.totalPagesBulk = Math.ceil(this.totalRecordsBulk / this.pageSizeBulk);

        // set page number 
        if (this.pageNumberBulk <= 1) {
            this.pageNumberBulk = 1;
        } else if (this.pageNumberBulk >= this.pageNumberBulk) {
            this.pageNumberBulk = this.pageNumberBulk;
        }
       // console.log('this.records in paginationHelper:', JSON.stringify(this.records));
        console.log('pageNumber>>>'+this.pageNumberBulk);
        console.log('pageSize>>>'+this.pageSizeBulk);
        console.log('totalRecords>>>'+this.totalRecordsBulk);
        // set records to display on current page 
        for (let i = (this.pageNumberBulk - 1) * this.pageSizeBulk; i < this.pageNumberBulk * this.pageSizeBulk; i++) {
            if (i === this.totalRecordsBulk) {
                break;
            }
            this.bulkServices.push(this.recordsBulk[i]);            
        } 
            console.log('this.bulkServices in paginationHelperBulk ==>' +JSON.stringify(this.bulkServices));
      
       
    }
     handleDeleteConfirmation(event){
            this.ServiceWarningMessage=true;
            this.participantServiceDeleteInfo={};
            this.participantServiceDeleteInfo.partcipantName=event.currentTarget.dataset.participantname;
             this.participantServiceDeleteInfo.serviceId=event.currentTarget.dataset.id;
            console.log('this.participantServiceDeleteInfo '+JSON.stringify(this.participantServiceDeleteInfo))
        
        
          } 
          closeWarningMessage() {
            this.ServiceWarningMessage=false;
           
        }
        handleDeleteService(event){
                 this.isShowSpinner=true;
                // let serviceId=event.currentTarget.dataset.id;
                 deleteRecord(this.participantServiceDeleteInfo.serviceId).then(() => {
                    const evt = new ShowToastEvent({
                        title: 'Success',
                        message: 'Service deleted successfully.',
                        variant: 'success',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt)
                   refreshApex(this.wiredBulkServicesResult);
                    // if (this.accountingService === 'Tesseract System') {
                    //     refreshApex(this.wiredBulkServicesResult);
                    // } else if (this.accountingService === 'Xero') {
                    //     refreshApex(this.wiredBulkServicesResultForXero);
                    // }
                   this.isShowSpinner=false;
                   this.ServiceWarningMessage=false;
                 });
     }
     handleServiceChange(event){
        this.accList= [];
        this.statusService=event.detail.value;
          refreshApex(this.wiredResult);
     }

    enableQtyEdit(event) {
        const recordId = event.currentTarget.dataset.id;
         console.log('recordId in enable '+recordId);
        const status = event.currentTarget.dataset.status;
         this.oldQuantityValue=parseFloat(event.currentTarget.dataset.quantity);
         console.log('oldQuantityValue in enable '+this.oldQuantityValue);
        if (status === 'Generated') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Action not allowed',
                    message: 'Billable Hours cannot be edited once an invoice has been generated.',
                    variant: 'error'
                })
            );
            return;
        }
        this.accList =  this.accList.map(acc => {
            return { ...acc, isEditingQty: acc.Id === recordId };
        });
    }

handleQtyChange(event) {
    const recordId = event.target.dataset.id;

   
    const valueStr = event.target.value;
    let newValue = parseFloat(valueStr);

    // Check for invalid or negative values
    if ( newValue < 0) {
        console.log('Record Id'+recordId);
        console.log('acc list'+this.oldQuantityValue);
        console.log('acc list'+JSON.stringify(this.accList));
     //   const oldQty = this.accList.find(acc => acc.Id === recordId)?.Qty__c ;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Invalid Value',
                message: 'Billable Hours must be a positive number.',
                variant: 'error'
            })
        );

        // Reset to previous value & exit edit mode
        this.accList = this.accList.map(acc =>
            acc.Id === recordId ? { ...acc, isEditingQty: false, Qty:parseFloat(this.oldQuantityValue).toFixed(2)}: acc
        );

        return;
    }

    // Always fix to 2 decimal places
  //  newValue = parseFloat(newValue).toFixed(2);

    this.accList = this.accList.map(acc =>
        acc.Id === recordId ? { ...acc, Qty: newValue } : acc
    );
}



    handleQtyKeyDown(event) {
        if (event.key === 'Enter') {
            this.saveRow({ currentTarget: { dataset: { id: event.target.dataset.id } } });
        }
    }

 saveRow(event) {
    this.isShowSpinner = true;
    const recordId = event.currentTarget.dataset.id;
    let record = this.accList.find(acc => acc.Id === recordId);

    // Ensure it’s fixed to 2 decimals before sending to Apex
    let fixedQty = parseFloat(record.Qty || 0).toFixed(2);

    updateQty({ recordId: recordId, newQty: fixedQty })
        .then(() => {
            this.isShowSpinner = false;

            this.accList = this.accList.map(acc =>
                acc.Id === recordId
                    ? { ...acc, Qty: fixedQty, isEditingQty: false }
                    : acc
            );

            this.showToast('Success', 'Quantity updated successfully', 'success');
            refreshApex(this.wiredResult);
        })
        .catch(error => {
            this.isShowSpinner = false;

            this.accList = this.accList.map(acc =>
                acc.Id === recordId ? { ...acc, isEditingQty: false } : acc
            );

            this.showToast('Error', 'Failed to update quantity', 'error');
        });
}


    handleMetricClick(event) {
        const metricId = event.currentTarget.dataset.id;
        this.selectedMetricId = metricId;

        console.log("📌 Metric clicked:", metricId);
    this.servicesPlanType        = '';
    this.invoicePlanType         = '';
    this.partcipantIdList        = [];
    this.invoicePartcipantIdList = [];
    //this.searchKey               = '';
        // Filter based on selected metric
        switch (metricId) {
        case "Pending":
            this.totalAmounttask = false;
            this.overdueInvoicestask = false;
            this.generatedInvoicestask = false;
            this.pendingInvoicestask = true;
            this.generatedflag = false;
            this.pendingflag = true;
            this.totalvalueflag = false;
            this.cancelledflag = false;
            console.log("✅ Selected Status set to Pending");
            break;
        case "Generated":
            this.totalAmounttask = false;
            this.overdueInvoicestask = false;
            this.generatedInvoicestask = true;
            this.pendingInvoicestask = false;
            this.generatedflag = true;
            this.pendingflag = false;
            this.totalvalueflag = false;
            this.cancelledflag = false;
            console.log("✅ Selected Status set to Generated");
            break;
        case "Overdue":
            this.totalAmounttask = false;
            this.overdueInvoicestask = true;
            this.generatedInvoicestask = false;
            this.pendingInvoicestask = false;
            this.generatedflag = false;
            this.pendingflag = false;
            this.totalvalueflag = false;
            this.cancelledflag = true;
            console.log("✅ Selected Status set to Overdue");
            break;
        case "Total":
            
            this.totalAmounttask = true;
            this.overdueInvoicestask = false;
            this.generatedInvoicestask = false;
            this.pendingInvoicestask = false;
            this.generatedflag = false;
            this.pendingflag = false;
            this.totalvalueflag = true;
            this.cancelledflag = false;
            console.log("✅ Selected Status set to All");
            break;
        default:
            console.warn("⚠️ Unknown metric clicked:", metricId);
        }

        console.log("🎯 Final selectedMetricId:", this.selectedMetricId);
       // console.log("🎯 Final selectedStatus:", this.selectedStatus);
    }


    handleDownload(event) {
        event.preventDefault(); // 🚫 block link navigation
        event.stopPropagation();

        const url = event.currentTarget.dataset.url;
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', ''); // let browser decide filename
            link.setAttribute('target', '_blank'); // open in new tab if download isn't supported
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('❌ Download URL not found.');
        }
    }

    handleCancel(event) {
        event.preventDefault(); // 🚫 stop link opening
        event.stopPropagation(); // 🚫 stop bubbling

        const invoiceId = event.currentTarget.dataset.id;
        console.log("🛑 Cancel clicked for Invoice:", invoiceId);

        this.cancelInvoice(invoiceId);
    }

    // Call Apex
    cancelInvoice(invoiceId) {
        cancelInvoiceApex({ invoiceId })
            .then(() => {
                this.showToast("Success", "Invoice cancelled successfully", "success");
                // 🔄 Refresh the table
                return refreshApex(this.wiredBulkServicesResult);
                //  if (this.accountingService === 'Tesseract System') {
                //    return  refreshApex(this.wiredBulkServicesResult);
                // } else if (this.accountingService === 'Xero') {
                //    return refreshApex(this.wiredBulkServicesResultForXero);
                // }
            })
            .catch(error => {
                console.error("❌ Cancel error:", error);
                this.showToast("Error", error.body?.message || "Failed to cancel invoice", "error");
            });
    }


    // updateIssuedPagination() {
    
    //      //  CLEAR bulk button
    //      this.disableBulkInvoice = true;

    //     const start = (this.issuedPageNumber - 1) * this.issuedPageSize;
    //     const end = this.issuedPageNumber * this.issuedPageSize;
    //     this.issuedPageList = this.issuedRecords.slice(start, end);
    // }

    updateIssuedPagination() {
    
         //  CLEAR bulk button
         // this.bulkSelectAllChecked = false;
            this.disableBulkInvoice = true;
           this.selectedInvoiceIds = [];//manendra
           this.showExportCSV = false;//manendra
        const start = (this.issuedPageNumber - 1) * this.issuedPageSize;
        const end = this.issuedPageNumber * this.issuedPageSize;
        this.issuedPageList = this.issuedRecords.slice(start, end).map(r => ({
            ...r,
            isChecked: false
        }));
    }

    handleRecordsPerPageIssued(event) {
        this.issuedPageSize = parseInt(event.target.value, 10);
        this.issuedPageNumber = 1;
        this.issuedTotalPages = Math.ceil(this.issuedTotal / this.issuedPageSize) || 1;
        this.updateIssuedPagination();
    }

    firstPageIssued() {
        this.issuedPageNumber = 1;
        this.updateIssuedPagination();
    }

    previousPageIssued() {
        if (this.issuedPageNumber > 1) {
            this.issuedPageNumber -= 1;
            this.updateIssuedPagination();
        }
    }

    nextPageIssued() {
        if (this.issuedPageNumber < this.issuedTotalPages) {
            this.issuedPageNumber += 1;
            this.updateIssuedPagination();
        }
    }

    lastPageIssued() {
        this.issuedPageNumber = this.issuedTotalPages;
        this.updateIssuedPagination();
    }

    get issuedDisableFirst() {
        return this.issuedPageNumber === 1;
    }
    get issuedDisableLast() {
        return this.issuedPageNumber === this.issuedTotalPages;
    }

    // -------------------------------
    // 🔹 Cancelled Pagination Helpers
    // -------------------------------
    updateCancelledPagination() {
        const start = (this.cancelledPageNumber - 1) * this.cancelledPageSize;
        const end = this.cancelledPageNumber * this.cancelledPageSize;
        this.cancelledPageList = this.cancelledRecords.slice(start, end);
    }

    handleRecordsPerPageCancelled(event) {
        this.cancelledPageSize = parseInt(event.target.value, 10);
        this.cancelledPageNumber = 1;
        this.cancelledTotalPages = Math.ceil(this.cancelledTotal / this.cancelledPageSize) || 1;
        this.updateCancelledPagination();
    }

    firstPageCancelled() {
        this.cancelledPageNumber = 1;
        this.updateCancelledPagination();
    }

    previousPageCancelled() {
        if (this.cancelledPageNumber > 1) {
            this.cancelledPageNumber -= 1;
            this.updateCancelledPagination();
        }
    }

    nextPageCancelled() {
        if (this.cancelledPageNumber < this.cancelledTotalPages) {
            this.cancelledPageNumber += 1;
            this.updateCancelledPagination();
        }
    }

    lastPageCancelled() {
        this.cancelledPageNumber = this.cancelledTotalPages;
        this.updateCancelledPagination();
    }

    get cancelledDisableFirst() {
        return this.cancelledPageNumber === 1;
    }
    get cancelledDisableLast() {
        return this.cancelledPageNumber === this.cancelledTotalPages;
    }


    handleParticipantExtraClick(event) {
        const recordId = event.currentTarget.dataset.id;
        console.log('✅ Clicked record Id:', recordId);

        const record = this.records.find(rec => rec.Id === recordId);
        console.log('✅ Retrieved record:', JSON.stringify(record));

        if (!record) {
            console.error('❌ Record not found for ID:', recordId);
            return;
        }

        let breakdownItems = [];

        // -----------------------------
        // 1️⃣ Normalize shiftStaffRecord safely
        // -----------------------------
        const shiftRecords = record.shiftStaffRecord
            ? (Array.isArray(record.shiftStaffRecord)
                ? record.shiftStaffRecord
                : [record.shiftStaffRecord])
            : [];

        console.log('📌 shiftRecords:', JSON.stringify(shiftRecords));

        // -----------------------------
        // 2️⃣ Loop safely - prevent undefined crashes
        // -----------------------------
        shiftRecords.forEach(sr => {
            if (!sr) {
                console.warn('⚠️ Found undefined shift record, skipping');
                return;
            }

            console.log('🔍 Processing shift record:', JSON.stringify(sr));

            // Mileage entry
            if (sr.Mileage_Bill__c === 'Participant') {
                breakdownItems.push({
                    label: 'Mileage',
                    details: `${sr.Mileage_Others__c || ''} @ $${sr.Mileage_Amount__c || 0}/km`,
                    amount: sr.Mileage_Amount__c || 0
                });
            }

            // Service entry
            if (sr.Service_Amount__c === 'Participant') {
                breakdownItems.push({
                    label: 'Service',
                    details: sr.Name || 'Service Charge',
                    amount: sr.Amount__c || 0
                });
            }
        });

        // -----------------------------
        // 3️⃣ Format Date
        // -----------------------------
        let formattedDate = '';
        if (record.Date_of_Service__c) {
            const d = new Date(record.Date_of_Service__c);
            formattedDate = `${String(d.getDate()).padStart(2, '0')}/` +
                            `${String(d.getMonth() + 1).padStart(2, '0')}/` +
                            `${d.getFullYear()}`;
        }

        // -----------------------------
        // 4️⃣ Prepare modal record
        // -----------------------------
        this.selectedRecord = {
            ...record,
            breakdownItems,
            participantExtraAmount: record.participantExtraAmount,
            date: formattedDate,
            participantName: record.Client__r?.Name__c || ''
        };

        this.isReimbursementModalOpen = true;

        console.log('🔹 Final breakdownItems:', JSON.stringify(breakdownItems));
    }


    closeReimbursementModal() {
        this.isReimbursementModalOpen = false;  // 👈 close modal
        this.selectedRecord = null;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    @track invoiceEmailFlag = false;
    @track toAddress = '';
    @track ccAddress = '';
    @track invoiceIdforEmail;
    @track urlforEmail;
    @track invoiceDateforEmail;
    //@track invoiceType;
    // @track invoiceStartDate;
    // @track invoiceEndDate;
    handleEmailAction(event) {
        const status = event.currentTarget.getAttribute('data-status'); // Add this in your HTML as a data attribute
        if (status === 'Cancelled') {
            this.showToast('Error', 'Cannot send email for a Cancelled invoice.', 'error');
            return;
        }
        const invoiceId = event.currentTarget.getAttribute('data-id');
        const amazonUrl = event.currentTarget.getAttribute('data-url');
        const invoiceDate = event.currentTarget.getAttribute('data-invoicedate');
      
        // const invoicetype = event.currentTarget.getAttribute('data-invoicetype');
        // const invoiceStartDate = event.currentTarget.getAttribute('data-startdate');

        // const invoiceEndDate = event.currentTarget.getAttribute('data-enddate'); 
        // const entryId = event.currentTarget.getAttribute('data-entryid');   
        // this.invoiceStartDate =  invoiceStartDate;
        // this.invoiceEndDate = invoiceEndDate;    
        //  this.invoiceType = invoicetype;
        //  this.entryId = entryId;
        // console.log('this.invoiceType: '+this.invoiceType);
        // console.log('invoiceStartDate: '+this.invoiceStartDate);
        // console.log('invoiceEndDate: '+this.invoiceEndDate);
        this.invoiceIdforEmail = invoiceId;
        this.urlforEmail = amazonUrl;
        this.invoiceDateforEmail = invoiceDate;
        console.log('Invoice ID:', invoiceId);
        console.log('URL:', amazonUrl);
        console.log('Invoice Date:', invoiceDate);
        this.invoiceEmailFlag = true;
        this.getEmail(this.invoiceIdforEmail);
        this.handleGetEmailBody();
    }
    // getEmail(invoiceIdforEmail){
    //     console.log('invoiceId for email: '+invoiceIdforEmail);
    //     if (this.accountingService === 'Tesseract System') {
    //         getentityEmailForInvoices({ invoiceId: invoiceIdforEmail }) // Pass your actual invoiceId
    //             .then(result => {
    //                 //console.log('Invoice Data:', JSON.stringify(result));
    //                 console.log('Fetched Email:', result);
    //             const entityEmail = result;
    //                 this.toAddress = entityEmail;
    //             })
    //             .catch(error => {
    //                 console.error('Error fetching entity email:', error);
    //             });
    //     } else if (this.accountingService === 'Xero') {
    //           getentityEmailForXeroInvoices({ invoiceId: invoiceIdforEmail }) // Pass your actual invoiceId
    //             .then(result => {
    //                 //console.log('Invoice Data:', JSON.stringify(result));
    //                 console.log('Fetched Email:', result);
    //             const entityEmail = result;
    //                 this.toAddress = entityEmail;
    //             })
    //             .catch(error => {
    //                 console.error('Error fetching entity email:', error);
    //             });
    //     }
       
    // }

    getEmail(invoiceIdforEmail){
        console.log('invoiceId for email: '+invoiceIdforEmail);
        if (this.accountingService === 'Tesseract System') {
            getentityEmailForInvoices({ invoiceId: invoiceIdforEmail }) // Pass your actual invoiceId
                .then(result => {
                     console.log('Invoice Data in getentityEmailForInvoices :', JSON.stringify(result));
                console.log('Fetched Email:', result);

                // to and cc coming from APex json

                 this.toAddress = result?.to || '';
                 this.ccAddress = result?.cc || '';
                })
                .catch(error => {
                    console.error('Error fetching entity email:', error);
                });
        } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
              getentityEmailForXeroInvoices({ invoiceId: invoiceIdforEmail }) // Pass your actual invoiceId
                .then(result => {
                    //console.log('Invoice Data:', JSON.stringify(result));
                    console.log('Fetched Email:', result);
                const entityEmail = result;
                    this.toAddress = entityEmail;
                })
                .catch(error => {
                    console.error('Error fetching entity email:', error);
                });
        }
       
    }
    handleEmailOnChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;

        switch (fieldName) {
            case 'toAddress':
                this.toAddress = fieldValue;
                break;
            case 'ccAddress':
                this.ccAddress = fieldValue;
                break;
            case 'emailSubject':
                this.emailSubject = fieldValue;
                break;
            case 'emailBody':
                this.emailBody = fieldValue;
                break;
            default:
                console.warn(`Unhandled field: ${fieldName}`);
                 break;
        }

        console.log(`${fieldName} changed to: ${fieldValue}`);
    }

    handleCloseModal(event){
        this.invoiceEmailFlag = false;
    }
    @track emailCounts = 0;
    @track emailSubject;
    @track emailBody;
    handleGetEmailBody() {
        console.log('handleGetEmailBody');
        console.log('invoiceIdforEmail:', this.invoiceIdforEmail);
        console.log('invoiceDateforEmail:', this.invoiceDateforEmail); 
                                                                               //else if (this.invoiceType == 'Sales')
        // console.log('this.invoiceType in email body:, ', this.invoiceType);

        getEmailBodyServiceInvoice({
            invoiceid: this.invoiceIdforEmail
        // invoiceDate: new Date(this.invoiceDateforEmail)
        })
        .then(result => {
            console.log('Result from Apex in  getEmailBodyServiceInvoice:', result);
            this.emailSubject = result?.subject || 'Default Subject';
            this.emailBody = result?.body ||  'Default Body';
        })
        .catch(error => {
            console.error('Error fetching email content:', error);
        });
        
    }
     handleSendEmail(event){
            if (!this.toAddress) {
                // Show error message using alert or toast
                this.showToast('error', 'To Address is required', 'error');
                return;
            }

            console.log('this.urlforEmail >>>>>', this.urlforEmail);
            sendEmail({
                invoiceid: this.invoiceIdforEmail,
                toAddress: this.toAddress,
                ccAddress: this.ccAddress,
                url: this.urlforEmail,
                subject: this.emailSubject,
                body: this.emailBody,
               
            })
            .then((updatedCount) => {
                console.log('Email sent successfully');
                this.showToast('Success', 'Email sent successfully', 'success');
                this.fromAddress = '';
                this.toAddress = '';
                this.ccAddress = '';
                this.emailSubject = '';
                this.emailBody = '';
                this.invoiceEmailFlag = false;
                // refreshApex(this.wireInvoiceData);
                this.emailCounts = updatedCount;
                console.log('this.emailCounts : ' + this.emailCounts);
            })
            .catch(error => {
                console.error('Error sending email:', error);
                this.showToast('Error', 'Error sending email: ' + error.body?.message || error.message, 'error');
            });
    
        }

          
    // async loadAuthLink() {
    //     console.log('🌀 [Step 4] Fetching MYOB authorization link from Apex...');
    
    //     try {
    //         this.loading = true;
    //         this.currentUrl = window.location.href;
    //         console.log('currentUrl >>>>', this.currentUrl);
    //         const result = await getMyobAuthLink({ redirectUrl: this.currentUrl });
    //         console.log('✅ [Step 4.1] Apex returned MYOB auth link:', result);

    //         if (result) {
    //             console.log('🟩 [Step 4.2] Opening MYOB auth page in new tab...');
    //             // 🔹 Opens MYOB in NEW TAB (not popup)
    //             const newTab = window.location.href = result;
    //             if (newTab) {
    //                 console.log('✅ [Step 4.3] New tab opened successfully:', newTab.location);
    //             } else {
    //                 console.warn('⚠️ [Step 4.3] Popup blocker may have prevented new tab.');
    //             }
    //         } else {
    //             console.error('❌ [Step 4.4] No auth link returned from Apex.');
    //         }
    //     } catch (error) {
    //         console.error('❌ [Step 4.5] Error while fetching MYOB auth link:', error);
    //     } finally {
    //         this.loading = false;
    //         console.log('✅ [Step 4.6] loadAuthLink() completed.');
    //     }
    // }

    // async exchangeCodeAndCloseTab(code) {
    //     try {
    //         this.loading = true;
    //         console.log('✅ Access code:', code);

    //         // Load any saved tokens
    //         const savedAccess  = sessionStorage.getItem("myobAccessToken");
    //         const savedRefresh = sessionStorage.getItem("myobRefreshToken");
    //         const savedUri     = sessionStorage.getItem("companyFileUri");
    //         const savedGuid    = sessionStorage.getItem("myobcompanyFileGuid");

    //         console.log('savedAccess >>>>>>', savedAccess);
    //         console.log('savedRefresh >>>>>>', savedRefresh);
    //         console.log('companyFileUri >>>>>>', savedUri);
    //         console.log('companyFileGuid >>>>>>', savedGuid);

    //         this.token          = savedAccess;
    //         this.refreshToken   = savedRefresh;
    //         this.companyFileUri = savedUri;
    //         this.companyFileGuid = savedGuid;

    //         // STEP 1: No saved tokens → Exchange code
    //         if (!savedAccess || !savedRefresh || savedAccess === "undefined" || savedRefresh === "undefined") {
    //             console.log("🔵 No saved tokens — calling Apex token exchange");

    //             // Generate redirect URL
    //             const baseUrl = window.location.origin + '/s/';
    //             const tokenResponse = await exchangeMyobCodeForToken({
    //                 code: code,
    //                 redirectUrl: baseUrl
    //             });

    //             const tokenData = JSON.parse(tokenResponse);

    //             this.token = tokenData.access_token;
    //             this.refreshToken = tokenData.refresh_token;

    //             console.log('🔐 Access Token:', this.token);
    //             console.log('🔐 Refresh Token:', this.refreshToken);

    //             // STEP 2: Get refreshed tokens + company file details
    //             const companyFilesJson = await getMyobCompanyFiles({
    //                 accessToken: this.token,
    //                 refreshToken: this.refreshToken,
    //                 businessId: this.businessId
    //             });

    //             const resp = JSON.parse(companyFilesJson);

    //             // Update refreshed tokens
    //             this.token = resp.access_token;
    //             this.refreshToken = resp.refresh_token;

    //             console.log('🆕 NEW Access Token:', this.token);
    //             console.log('🆕 NEW Refresh Token:', this.refreshToken);

    //             const companyFiles = resp.companyFiles;

    //             // Validate company file structure
    //             if (!companyFiles || !companyFiles.CompanyFile) {
    //                 console.error('❌ No CompanyFile returned from MYOB');
    //                 return;
    //             }

    //             // Correct extraction based on MYOB response
    //             this.companyFileGuid = companyFiles.CompanyFile.Id;
    //             this.companyFileUri  = companyFiles.CompanyFile.Uri;

    //             console.log('🏢 Company File GUID:', this.companyFileGuid);
    //             console.log('🔗 Company File URI:', this.companyFileUri);

    //             // Save tokens + company file details
    //             sessionStorage.setItem('myobAccessToken', this.token);
    //             sessionStorage.setItem('myobRefreshToken', this.refreshToken);
    //             sessionStorage.setItem('companyFileUri', this.companyFileUri);
    //             sessionStorage.setItem('myobcompanyFileGuid', this.companyFileGuid);

    //         } else {
    //             console.log("🟢 Saved tokens found — skipping code exchange");
    //         }

    //         console.log('Final Access Token:', this.token);
    //         console.log('Final Refresh Token:', this.refreshToken);
    //         console.log('Final Company File GUID:', this.companyFileGuid);
    //         console.log('Final Company File URI:', this.companyFileUri);

    //         // STEP 3: Fetch Company File Details (needs GUID)
    //         const companyDetails = await getCompanyFileDetails({
    //             accessToken: this.token,
    //             companyFileGuid: this.companyFileGuid
    //         });

    //         console.log('🏢 Company File Details:', companyDetails);            

    //     } catch (error) {
    //         console.error('❌ Error during MYOB integration flow:', error);
    //     } finally {
    //         this.loading = false;
    //     }
    // }

    //======================Bulk Emails======================//
   // selectedBulkInvoiceIds = new Set();
@track bulkPageList = [];  
//@track bulkSelectAllChecked = false;
@track disableBulkInvoice = true;

updateBulkInvoiceButtonState() {
    // Enable only if at least one valid row is checked
    this.disableBulkInvoice =
        !this.bulkServices.some(row => row.isChecked);
}

get isIssuedHeaderChecked() {
    return (
        this.issuedPageList &&
        this.issuedPageList.length > 0 &&
        this.issuedPageList.every(r => r.isChecked)
    );
}
get isBulkHeaderChecked() {
    return (
        this.bulkServices &&
        this.bulkServices.length > 0 &&
        this.bulkServices.every(r => r.isChecked)
    );
}

handleBulkInvoiceCheckboxChange(event) {
    const recordId = event.target.dataset.id;
    const isChecked = event.target.checked;

    // 🔑 Decide active list (NO behavior change)
    const listName = this.generatedflag
        ? 'issuedPageList'
        : 'bulkServices';

    // 1️⃣ Update selection on ACTIVE list only
    this[listName] = this[listName].map(inv =>
        inv.Id === recordId ? { ...inv, isChecked } : inv
    );

    // 2️⃣ Validate entity (existing logic, untouched)
    const isValid = this.checkBulkEntityExist();
    if (!isValid) {
        // 🔴 FORCE UI uncheck
        event.target.checked = false;

        // 🔴 FORCE state uncheck (ACTIVE list only)
        this[listName] = this[listName].map(inv =>
            inv.Id === recordId ? { ...inv, isChecked: false } : inv
        );
    }

    // 3️⃣ Update Bulk button state (page-scoped)
    this.disableBulkInvoice =
        !this[listName].some(i => i.isChecked);
         this.selectedInvoiceIds = this[listName]
        .filter(i => i.isChecked)
        .map(i => i.Id);

    // ⭐ NEW — Show export button if any selected
    this.showExportCSV = this.selectedInvoiceIds.length > 0;


    // 4️⃣ Header checkbox reflects CURRENT PAGE ONLY
    this.bulkSelectAllChecked =
        this[listName].length > 0 &&
        this[listName].every(i => i.isChecked);
}

handleSelectAllInvoices(event) {
    const isChecked = event.target.checked;

    // 🔑 Decide active list (NO behavior change)
    const listName = this.generatedflag
        ? 'issuedPageList'
        : 'bulkServices';

    // 1️⃣ Apply selection to CURRENT PAGE ONLY
    this[listName] = this[listName].map(inv => ({
        ...inv,
        isChecked
    }));

    // 2️⃣ Validate entities (existing logic, untouched)
    this.checkBulkEntityExist();

    // 3️⃣ Enable Bulk Invoice only if at least one valid row is checked
    this.disableBulkInvoice =
        !this[listName].some(i => i.isChecked);
         this.selectedInvoiceIds = this[listName]
        .filter(i => i.isChecked)
        .map(i => i.Id);

    // ⭐ NEW — Control Export CSV visibility
    this.showExportCSV = this.selectedInvoiceIds.length > 0;

    // 4️⃣ Header checkbox reflects CURRENT PAGE ONLY
    this.bulkSelectAllChecked =
        this[listName].length > 0 &&
        this[listName].every(i => i.isChecked);
}
//manendra csv start
// handleExportCSV() {
//     const listName = this.generatedflag 
//         ? 'issuedPageList' 
//         : 'bulkServices';

//     const selectedRecords = this[listName].filter(i => i.isChecked);

//     const nonIssuedRecords = selectedRecords.filter(
//         i => i.Status__c !== 'Issued'
//     );

//     if (nonIssuedRecords.length > 0) {
//         const nonIssuedNames = nonIssuedRecords
//             .map(i => i.Name || i.fileReference || i.Id)
//             .join(', ');

//         this.showToast(
//             'Invalid Selection',
//             `Please select only Issued invoices to generate CSV. Non-Issued invoice(s) found: ${nonIssuedNames}`,
//             'error'
//         );
//         return;
//     }

//     if (this.selectedInvoiceIds.length === 0) {
//         this.showToast('Error', 'Please select at least one invoice to export.', 'error');
//         return;
//     }

//     exportInvoicesCSV({ invoiceIds: this.selectedInvoiceIds })
//         .then(result => {
//             const element = document.createElement('a');
//             element.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(result);
//             element.target = '_self';
//             element.download = 'NDIS_Invoice_Export.csv';
//             document.body.appendChild(element);
//             element.click();
//             document.body.removeChild(element);

//             // ✅ Reset checkboxes after successful export
//             this[listName] = this[listName].map(row => ({
//                 ...row,
//                 isChecked: false
//             }));
//             this.selectedInvoiceIds = [];
//             this.showExportCSV = false;
//             this.disableBulkInvoice = true;

//             this.showToast('Success', 'CSV exported successfully.', 'success');
//         })
//         .catch(error => {
//             console.error('CSV Export Error:', error);
//             this.showToast('Error', error?.body?.message || 'Failed to export CSV.', 'error');
//         });
// }
//manendra csv end
isBulkSending = false;
isBulkSending = false;

// 🔹 Bulk Invoice button click
handleBulkInvoiceEmail() {

    // 🔑 Decide active list (NO behavior change)
    const listName = this.generatedflag
        ? 'issuedPageList'
        : 'bulkServices';

    // 1️⃣ Collect selected invoice IDs (ACTIVE table only)
    const selectedInvoiceIds = this[listName]
        .filter(row => row.isChecked)
        .map(row => row.Id);

    console.log(
        '✅ Selected Invoice IDs:',
        JSON.parse(JSON.stringify(selectedInvoiceIds))
    );

    if (selectedInvoiceIds.length === 0) {
        this.showToast(
            'Error',
            'Please select at least one invoice.',
            'error'
        );
        return;
    }

    this.isBulkSending = true;
    console.log('⏳ Enqueuing bulk email job...');

    // 2️⃣ Call Apex (unchanged)
    sendBulkServiceInvoiceEmails({
        invoiceIds: selectedInvoiceIds
    })
    .then(result => {
        this.showToast(
            'Success',
            // `${result.successCount} invoice(s) queued for email delivery.`,
            // 'Bulk invoices generated successfully',
             'Bulk invoice emails sent successfully',
            'success'
        );

        // 3️⃣ Reset UI selection (ACTIVE table only)
        this[listName] = this[listName].map(row => ({
            ...row,
            isChecked: false
        }));

        this.disableBulkInvoice = true;
        this.bulkSelectAllChecked = false;
    })
    .catch(error => {
        this.showToast(
            'Error',
            error?.body?.message || 'Failed to send bulk invoices.',
            'error'
        );
    })
    .finally(() => {
        this.isBulkSending = false;
    });
}


    // 🔹 Reusable toast helper
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }


    // handleAddService(){
    //     this.isAddNewService = true;
    //     this.serviceGroupName = [];
    //     this.serviceParticipant = null;
    //     this.serviceTypeId = null;
    //     this.serviceQuantity = null;
    //     this.AddServiceStartDate = null;
    //     this.stateValue = null;
    //     this.EntityNameValue = null;
    //     this.isEntityDisabled = false;
    //     this.clearStartEndTime();
    //     // this.loadEntityProfiles();
    //     this.loadServiceParticipantOptions();
    //     this.loadStaffOptions();
    // }
    // cancelAddService(){
    //     this.isAddNewService = false;
    //     this.serviceGroupName = [];
    //     this.serviceParticipant = null;
    //     this.serviceTypeId = null;
    //     this.serviceQuantity = null;
    //     this.AddServiceStartDate = null;
    //     this.stateValue = null;
    //     this.EntityNameValue = null;
    //     this.isEntityDisabled = false;
    //     this.NdisServiceGroupName = false;
    //     this.addServicePaginationVisible = false;
    //     this.clearStartEndTime();
    // }
    clearStartEndTime(){
        this.startTime = null;
        this.startTime24 = null;
        this.startTimeDisplay = '';
        this.startTimeSelectedHour = null;
        this.startTimeSelectedMinute = null;
        this.startTimeAMPM = null;

        this.endTime = null;
        this.endTime24 = null;
        this.endTimeDisplay = '';
        this.endTimeSelectedHour = null;
        this.endTimeSelectedMinute = null;
        this.endTimeAMPM = null;
    }
    // handleAddServiceChange(event) {
    //     const fieldName = event.target.name;
    //     const fieldValue = event.target.value;

    //     switch (fieldName) {

    //         case 'serviceParticipant':
    //             this.serviceParticipant = fieldValue;
    //             console.log('serviceParticipant >>>', this.serviceParticipant);

    //             const selectedRec = this.serviceParticipantOptions.find(
    //                 (opt) => opt.value === fieldValue
    //             );

    //             // 3️⃣ update dependent fields
    //             this.typeOfService = selectedRec?.typeofservice || null;
    //             this.participantType = selectedRec?.participanttype || null;

    //             console.log('typeofservice:', this.typeOfService);
    //             console.log('participanttype:', this.participantType);
    //             this.ndisflag = false;
    //             this.individualFlag = false;
    //             this.companyFlag = false;

    //             if (this.typeOfService === 'NDIS') {
    //                 this.ndisflag = true;
    //             } else if (this.participantType === 'Individual') {
    //                 this.individualFlag = true;
    //             } else if (this.participantType === 'Company') {
    //                 this.companyFlag = true;
    //             }

    //             // Reset dependent Service Type
    //             this.serviceTypeName = null;
    //             this.serviceTypeId = null;
    //             this.filteredServiceTypeOptions = [];
                
    //             this.serviceTypeId = null;
    //             this.selectedStateForBackend = null;  
    //             this.serviceGroupName = [];
    //             this.NdisServiceGroupName = false;
    //             this.EntityNameOptions = [];
    //             this.EntityNameValue = null;
    //             this.isEntityDisabled = false;
    //             this.availableFunds = null;
    //             this.clearStartEndTime();
            
    //             console.log('serviceTypeId111 >>>', this.serviceTypeId);
    //             console.log('serviceTypeName (LABEL)111 >>>', this.serviceTypeName);
    //             if (this.serviceParticipant) {
    //                 this.loadServiceTypesForParticipant(this.serviceParticipant);
    //                 console.log('serviceTypeId555 >>>', this.serviceTypeId);
    //                 console.log('serviceTypeName (LABEL)555 >>>', this.serviceTypeName);
    //             }
    //             break;

    //         case 'serviceTypeName':
    //             // FundTracker Id
    //             // this.serviceTypeName = fieldValue;
    //             // console.log('serviceTypeName >>>', this.serviceTypeName);
    //             // const selectedService = this.filteredServiceTypeOptions.find(
    //             //     o => o.value === fieldValue
    //             // );
    //             this.serviceTypeId = fieldValue;

    //             const selectedService = this.filteredServiceTypeOptions.find(
    //                 o => o.value === fieldValue
    //             );

    //             if (!selectedService) {
    //                 console.warn('No service type matched');
    //                 return;
    //             }
    //             this.serviceTypeName = selectedService.label;
    //             this.selectedStateForBackend = selectedService.state;
    //             this.availableFunds = selectedService.availableFunds ?? 0;

    //             console.log('serviceTypeId >>>', this.serviceTypeId);
    //             console.log('serviceTypeName (LABEL) >>>', this.serviceTypeName);
    //             console.log('Derived State >>>', this.selectedStateForBackend);
    //             this.serviceGroupName = [];
    //             this.NdisServiceGroupName = true;
    //             if (selectedService && selectedService.entityProfile) {
    //                 this.EntityNameOptions = [{
    //                     label: selectedService.entityName ,
    //                     value: selectedService.entityProfile
    //                 }];
    //                 this.EntityNameValue = selectedService.entityProfile;
    //                 console.log('EntityNameValue >>>', this.EntityNameValue);
    //                 this.isEntityDisabled = true;
    //                 this.NdisServiceGroupName=true;
                    
    //             } else {
    //                 this.EntityNameOptions = [
    //                     { label: '+ Add New Entity', value: 'Add New Entity' }
    //                 ];
    //                 this.EntityNameValue = null;
    //                 this.isEntityDisabled = false;
    //             }
    //             //  if (this.serviceTypeName && this.serviceParticipant ) {
    //             //     console.log('this.serviceTypeName : ',this.serviceTypeName);
    //             //     console.log('this.AddServiceStartDate : ',this.AddServiceStartDate);  
    //             //           // Optional: Call fetch logic if no duplicate fund found
    //             //           getNDISServiceLineItem({
    //             //             ServiceItemNames: this.serviceTypeName,
    //             //             ServiceDate: this.AddServiceStartDate
    //             //           })
    //             //             .then((response) => {
    //             //                 console.log('response in getNDISServiceLineItem : ',response);
    //             //               this.serviceGroupName = response.map((item) => ({
    //             //                 ...item
    //             //               }));
    //             //             })
    //             //             .catch((error) => {
    //             //               console.error("Error fetching NDIS Catalog:", error);
    //             //               this.serviceGroupName = [];
    //             //             });
    //             //         }
    //             if (this.serviceTypeName && this.selectedStateForBackend) {
    //                 this.fetchNdisServiceLineItems();
    //                 console.log('serviceTypeId222 >>>', this.serviceTypeId);
    //                 console.log('serviceTypeName (LABEL)222 >>>', this.serviceTypeName);
    //             }
    //             break;

    //         case 'EntityNameValue':
    //             this.EntityNameValue = fieldValue;
    //             console.log('EntityNameValue selected >>>', this.EntityNameValue);

    //             if (fieldValue === 'Add New Entity') {
    //                 this.isEntityFromAddService=true; 
    //                 this.isEntityExist = false; 
    //                 this.isFromManageInvoice = true;  
    //                 this.createCompanyFacilityId = this.faclist; 
    //                 this.createCompanyFundTrackerId= this.serviceTypeId;
    //                 this.createCompanyFlag = true;
    //                 this.isAddNewService = false;
    //                 this.tilesflag = true;
    //                 this.isModalRelate = false;
    //                 this.generatedflag = false;
    //                 this.pendingflag = false;
    //                 this.totalvalueflag = false;
    //                 this.cancelledflag = false;
                    
    //             } else {
    //                 this.createCompanyFlag = false;
    //                 this.isEntityExist = true;
    //                 this.isEntityFromAddService=false; 
    //                 this.isFromManageInvoice = false; 
    //                 this.isAddNewService = true;
    //             }
    //             break;

    //         case 'AddServiceStaffValue':
    //             this.AddServiceStaffValue = fieldValue;
    //             break;

    //         // case 'AddServiceStartDate':
    //         //     this.AddServiceStartDate = fieldValue;
               
    //         //     console.log('serviceTypeId333 >>>', this.serviceTypeId);
    //         //     console.log('serviceTypeName (LABEL)333>>>', this.serviceTypeName);
    //         //     if (this.serviceTypeName && this.selectedStateForBackend) {
    //         //         this.fetchNdisServiceLineItems();
    //         //         console.log('serviceTypeId444 >>>', this.serviceTypeId);
    //         //         console.log('serviceTypeName (LABEL)444>>>', this.serviceTypeName);
    //         //     }
    //         //     break;
           
    //         // case 'AddServiceStartDate': {
    //         //     const input = event.target;

    //         //     if (!input.checkValidity()) {
    //         //        // input.setCustomValidity('');
    //         //         // this.dispatchEvent(
    //         //         //     new ShowToastEvent({
    //         //         //         title: 'Error',
    //         //         //         message: 'Service Date cannot be a future date.',
    //         //         //         variant: 'error'
    //         //         //     })
    //         //         // );
    //         //       //  input.value = null;              // clear UI
    //         //         this.AddServiceStartDate = null; // clear JS
    //         //         return;
    //         //     }

    //         //     // ✅ Valid date
    //         //     this.AddServiceStartDate = input.value;

    //         //     console.log('serviceTypeId333 >>>', this.serviceTypeId);
    //         //     console.log('serviceTypeName (LABEL)333>>>', this.serviceTypeName);

    //         //     if (this.serviceTypeName && this.selectedStateForBackend) {
    //         //         this.fetchNdisServiceLineItems();
    //         //         console.log('serviceTypeId444 >>>', this.serviceTypeId);
    //         //         console.log('serviceTypeName (LABEL)444>>>', this.serviceTypeName);
    //         //     }

    //         //     break;
    //         // }
    //          case 'AddServiceStartDate':
    //            // this.AddServiceStartDate = fieldValue;
    //             console.log('AddServiceStartDate >>>', this.AddServiceStartDate);
    //             // const selected = new Date(fieldValue);
    //             const selected = new Date(fieldValue + 'T00:00:00');
    //             const today = new Date();
    //             today.setHours(0, 0, 0, 0);

    //             if (selected > today) {

    //                 this.dispatchEvent(
    //                     new ShowToastEvent({
    //                         title: 'Error',
    //                         message: 'Service Date cannot be a future date.',
    //                         variant: 'error'
    //                     })
    //                 );

    //                 // 🔥 CLEAR
    //                 event.target.value = null;
    //                 this.AddServiceStartDate = null;
    //                 return;
    //             }
    //             this.AddServiceStartDate = fieldValue;
    //             console.log('serviceTypeId333 >>>', this.serviceTypeId);
    //             console.log('serviceTypeName (LABEL)333>>>', this.serviceTypeName);
    //             if (this.serviceTypeName && this.selectedStateForBackend) {
    //                 this.fetchNdisServiceLineItems();
    //                 console.log('serviceTypeId444 >>>', this.serviceTypeId);
    //                 console.log('serviceTypeName (LABEL)444>>>', this.serviceTypeName);
    //             }
    //             break;
            

    //         default:
    //             console.warn('Unhandled Add Service field:', fieldName);
    //     }
    // }
    loadServiceTypesForParticipant(participantId) {
        getClientFunds({ clientId: participantId })
            .then(fetchedServiceTypes => {
                if (!fetchedServiceTypes || fetchedServiceTypes.length === 0) {
                    this.filteredServiceTypeOptions = [];
                    this.serviceTypeId = null;
                    this.serviceTypeName = null;
                    this.selectedStateForBackend = null;
                    this.NdisServiceGroupName = false;
                    this.serviceGroupName = [];
                    this.EntityNameOptions = [];
                    this.EntityNameValue = null;
                    this.isEntityDisabled = false;


                    // this.dispatchEvent(
                    //     new ShowToastEvent({
                    //         title: 'Error',
                    //        // message: 'No funds or Service Type records are available for the selected Participant.',
                    //        message: 'No funds are allocated for this Participant. To continue, please allocate funds.',
                    //         variant: 'error',
                           
                    //     })
                    // );
                    this.showNoFundsModal=true;
                    this.isAddNewService=false;
                    return; 
                }

                this.filteredServiceTypeOptions = fetchedServiceTypes.map(rec => {
                    let entityName = '';

                    if ( rec.Entity_Profile__r?.First_Name__c || rec.Entity_Profile__r?.Last_Name__c ) {
                        entityName = `${rec.Entity_Profile__r?.First_Name__c || ''} ${rec.Entity_Profile__r?.Last_Name__c || ''}`.trim();
                    } else {
                        entityName = rec.Entity_Profile__r?.Name__c || '';
                    }

                    return {
                        label: rec.Registration_Group__c,
                        value: rec.Id,
                        entityProfile: rec.Entity_Profile__c || null,
                        entityName,
                        planType: rec.Plan_Type__c,
                        state: rec.State__c,
                        status: rec.Status__c,
                        availableFunds: rec.Available_Funds__c
                    };
                });

                console.log(
                    'Filtered Service Type Options:',
                    JSON.stringify(this.filteredServiceTypeOptions)
                );
            })
            .catch(error => {
                console.error(error);
                this.filteredServiceTypeOptions = [];
            });
    }
    loadStaffOptions() {
        const contractorOption = {
            label: 'Contractor',
            value: 'CONTRACTOR'
        };
        
        console.log('this.orgid  loadStaffOptions>>>', this.orgid);
        console.log('this.faclist  loadStaffOptions>>>', this.faclist);
       

        getStaffsByOrg({
            recordId: this.orgid,
            FacilityId: this.faclist
        })
            .then(result => {
                const staffOptions = (result || []).map(staff => ({
                    label: staff.Name,  
                    value: staff.Id
                }));

                this.AddServiceStaffOptions = [
                    contractorOption,
                    ...staffOptions
                ];
                console.log('AddServiceStaffOptions >>>', JSON.stringify(this.AddServiceStaffOptions));
                this.AddServiceStaffValue = this.AddServiceStaffOptions[0].value;
                
            })
            .catch(error => {
                console.error(error);
                this.AddServiceStaffOptions = [contractorOption];

            });
    }
    handleTimeChange(event) {
        console.log('handleTimeChange');
        event.preventDefault();

        const timeType = event.target.dataset.timetype; // START or END
        const { displaytime, twentyFourHourFormat } = event.detail || {};
        console.log(' Time Type:', timeType);
        console.log(' Display Time:', displaytime);
        console.log(' 24h Format:', twentyFourHourFormat);

        if (!displaytime || !twentyFourHourFormat) {
            console.warn(' Missing time data, exiting handleTimeChange');
            return;
        }

        // Split display time → "9:15 AM"
        const [time, ampm] = displaytime.split(" ");
        const [hour, minute] = time.split(":");
        console.log(' Parsed Time:', { hour, minute, ampm });

        if (timeType === "START") {
            console.log(' Processing START time');
            this.startTimeSelectedHour = hour;
            this.startTimeSelectedMinute = minute;
            this.startTimeAMPM = ampm;
            this.startTimeDisplay = displaytime;
            this.startTime24 = twentyFourHourFormat;
            this.startTime = this.startTime24;
            console.log(' START time set:', {
                startTimeDisplay: this.startTimeDisplay,
                startTime24: this.startTime24
            });

        }

        if (timeType === "END") {
            console.log(' Processing END time');
            this.endTimeSelectedHour = hour;
            this.endTimeSelectedMinute = minute;
            this.endTimeAMPM = ampm;
            this.endTimeDisplay = displaytime;
            this.endTime24 = twentyFourHourFormat;
            this.endTime = this.endTime24; 
            console.log(' END time set:', {
                endTimeDisplay: this.endTimeDisplay,
                endTime24: this.endTime24
            });
           
        }
        console.log(' Current Times State:', {
            starttime: this.startTime,
            endTime: this.endTime
        });
        if (this.startTime && this.endTime) {
            console.log(' Both times available → calling calculateDuration');
            this.calculateDuration();
        }
    } 
    timeToMinutes(time24) {
        // "07:30:00Z" → 450
        const clean = time24.replace('Z', '');
        const [h, m] = clean.split(':').map(Number);
        return h * 60 + m;
    }
    async fetchNdisServiceLineItems() {
        try {
            console.log('🚀 Fetching catalogue data');
            console.log('Service Type (Id):', this.serviceTypeId);
            console.log('Client:', this.serviceParticipant);

            // Clear previous results (NO MERGE)
            this.serviceGroupName = [];
            this.records3 = [];
            this.pageNumber3 = 1;

            const result = await getCatalogueData({
                serviceType: this.serviceTypeId,     
                clientId: this.serviceParticipant
            });

            console.log('getCatalogueData ==> ', JSON.stringify(result));

            const catalogueData = result.catalogueData || [];
            const stateField = result.statesCombined;    
            this.stateValue = stateField;

            console.log('Derived State from backend:', this.stateValue);

            this.records3 = catalogueData.map((rec) => {
                let unitPrice;
                let displayName;

                if (
                    this.otherThanNdis === true ||
                    (
                        this.otherThanNdis === false &&
                        catalogueData[0]?.Name?.includes('Miscellaneous')
                    )
                ) {
                    unitPrice = result.clientJunctionMapAmount?.[rec.Id] || 0;
                    displayName =
                        result.clientJunctionMapName?.[rec.Id] ||
                        rec.Support_Item_Name__c;
                } else {
                    unitPrice = rec[stateField] || 0;
                    displayName = rec.Support_Item_Name__c;
                }

                return {
                    ...rec,
                    isSelected: false,
                    serviceSupportItem: displayName,
                    amount: unitPrice,        //  used by table
                    unit: unitPrice,          // keep if needed elsewhere
                    label: displayName,
                    value: rec.Id
                };
            });
           
            console.log(
                'Mapped records3 ==> ',
                JSON.stringify(this.records3)
            );
             this.totalRecords3 = this.records3.length;
            console.log('totalRecords3 ==> ', this.totalRecords3);
           
            if(this.totalRecords3 > 0){
                this.addServicePaginationVisible = true;
                console.log('addServicePaginationVisible ==> ', this.addServicePaginationVisible);
            }
            this.paginationHelper3();
            console.log('addServicePaginationVisible after==> ', this.addServicePaginationVisible);
            this.NdisServiceGroupName = true;

        } catch (error) {
            console.error('❌ Error fetching catalogue data:', error);
            this.serviceGroupName = [];
            this.NdisServiceGroupName = false;
            this.records3 = [];
            this.addServicePaginationVisible = false;
            
        }
    }
    calculateDuration() {
        console.log(' ENTER calculateDuration');

        // Guard checks
        if (!this.AddServiceStartDate) {
            console.warn(' Missing Service Date');
            return;
        }
        if (!this.startTime || !this.endTime) {
            console.warn(' Missing start or end time', {
                starttime: this.startTime,
                endTime: this.endTime
            });
            return;
        }

        console.log(' Service Date:', this.AddServiceStartDate);
        console.log(' Start Time:', this.startTime);
        console.log(' End Time:', this.endTime);

        let startDateChange = new Date();
        let endDateChange = new Date();

        const dateParts = this.AddServiceStartDate.split("-");
        const startParts = this.startTime.split(":");
        const endParts = this.endTime.split(":");

        startDateChange.setFullYear(
            Number(dateParts[0]),
            Number(dateParts[1]) - 1,
            Number(dateParts[2])
        );
        startDateChange.setHours(
            Number(startParts[0]),
            Number(startParts[1]),
            0,
            0
        );

        endDateChange.setFullYear(
            Number(dateParts[0]),
            Number(dateParts[1]) - 1,
            Number(dateParts[2])
        );
        endDateChange.setHours(
            Number(endParts[0]),
            Number(endParts[1]),
            0,
            0
        );

        console.log(' Start DateTime:', startDateChange);
        console.log(' End DateTime:', endDateChange);

        const durationInMs = endDateChange - startDateChange;
        console.log(' Duration (ms):', durationInMs);

        const durationInMinutes = durationInMs / (1000 * 60);
        console.log(' Duration (minutes):', durationInMinutes);

        let hours = durationInMinutes / 60;
        console.log(' Raw Hours:', hours);

        
        if (hours <= 0 || isNaN(hours)) {
            console.warn(' Invalid duration, resetting quantity');
            this.serviceQuantity = 0;
            this.recalculateServiceTotals();
            return;
        }

        // ✅ STORE quantity (same for all rows)
        this.serviceQuantity = Number(hours.toFixed(2));

        console.log(' Final Quantity (hours):', this.serviceQuantity);

        // ✅ Recalculate totals for all rows
        this.recalculateServiceTotals();
    }

    recalculateServiceTotals() {
        console.log('  recalculateServiceTotals');
       if (!this.records3?.length) {
            console.warn(' No service rows to recalculate');
            return;
        }
        console.log(' Rows before calculation:', JSON.stringify(this.records3));
       // this.serviceGroupName = this.serviceGroupName.map(row => {
        this.records3 = this.records3.map(row => {
            
            const unitPrice = Number(row.amount || 0);
            const total = unitPrice * this.serviceQuantity;
            console.log(' Row Calc:', {
                serviceId: row.Id,
                unitPrice,
                quantity: this.serviceQuantity,
                total
            });

            return {
                ...row,
                quantity: this.serviceQuantity,
                serviceTotalAmount: total.toFixed(2)
            };
        });
         console.log(
            'Rows after calculation:',
            JSON.stringify(this.serviceGroupName)
        );
        this.paginationHelper3();
    }
    // handleCheckboxSelection(event) {
    //     const recordId = event.target.dataset.id;
    //     const checked = event.target.checked;

    //     console.log('☑️ Checkbox toggled:', { recordId, checked });

    //     this.serviceGroupName = this.serviceGroupName.map(row => {
    //         if (row.Id === recordId) {
    //             return {
    //                 ...row,
    //                 isSelected: checked
    //             };
    //         }
    //         return row;
    //     });

    //     const selectedCount = this.serviceGroupName.filter(r => r.isSelected).length;
    //     console.log('✅ Selected rows count:', selectedCount);  
    // }
    handleCheckboxSelection(event) {
        const recordId = event.target.dataset.id;
        const checked = event.target.checked;

        console.log('☑️ Checkbox toggled (catalogue):', { recordId, checked });
        this.records3 = this.records3.map(row =>
            row.Id === recordId
                ? { ...row, isSelected: checked }
                : row
        );
        this.serviceGroupName = this.serviceGroupName.map(row =>
            row.Id === recordId
                ? { ...row, isSelected: checked }
                : row
        );
        //this.recalculateServiceTotals();
        const isValid = this.validateFundsForSelectedServices();
        if (!isValid) {
            console.warn('❌ Funds exceeded – reverting selection');
            this.records3 = this.records3.map(row =>
                row.Id === recordId
                    ? { ...row, isSelected: false }
                    : row
            );
            this.serviceGroupName = this.serviceGroupName.map(row =>
                row.Id === recordId
                    ? { ...row, isSelected: false }
                    : row
            );
            return;
        }
        const selectedCount = this.serviceGroupName.filter(r => r.isSelected).length;
        console.log('✅ Selected service rows:', selectedCount);
          this.paginationHelper3();
    }

    // saveAddService() {
    //     if (!this.serviceParticipant) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Please select a Participant.',
    //                 variant: 'error'
    //             })
    //         );
    //         return;
    //     }

    //     // 2️⃣ Service Type
    //     if (!this.serviceTypeId) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Please select a Service Type.',
    //                 variant: 'error'
    //             })
    //         );
    //         return;
    //     }

    //     // 3️⃣ Entity Name
    //     if (!this.EntityNameValue) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Please select an Entity Name.',
    //                 variant: 'error'
    //             })
    //         );
    //         return;
    //     }

    //     // 4️⃣ Service Date
    //     if (!this.AddServiceStartDate) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Please select a Service Date.',
    //                 variant: 'error'
    //             })
    //         );
    //         return;
    //     }

    //     // 5️⃣ Start Time
    //     if (!this.startTime) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Please select a Start Time.',
    //                 variant: 'error'
    //             })
    //         );
    //         return;
    //     }
    //     if (!this.endTime) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Please select a End Time.',
    //                 variant: 'error'
    //             })
    //         );
    //         return;
    //     }
    //     console.log(' Start Time in save :', this.startTime);
    //     console.log(' End Time in save :', this.endTime);
    //      if (this.startTime && this.endTime) {
    //         console.log(' Both times available → calling calculateDuration');
           
    //         const startMinutes = this.timeToMinutes(this.startTime);
    //         const endMinutes = this.timeToMinutes(this.endTime);

    //         //  End before or equal to Start
    //         if (endMinutes <= startMinutes) {
    //             console.log('startMinutes: ',startMinutes);
    //             console.log('endMinutes: ',endMinutes);

    //             this.dispatchEvent(
    //                 new ShowToastEvent({
    //                     title: 'Invalid Time',
    //                     message: 'End time cannot be earlier than start time.',
    //                     variant: 'error'
    //                 })
    //             );

    //             // //  Clear ONLY end time
    //             // this.endTime = null;
    //             // this.endTime24 = null;
    //             // this.endTimeDisplay = '';
    //             // this.endTimeSelectedHour = null;
    //             // this.endTimeSelectedMinute = null;
    //             // this.endTimeAMPM = null;
    //             console.log(' END time set:', {
    //                 endTimeDisplay: this.endTimeDisplay,
    //                 endTime24: this.endTime24,
    //                 endTime:this.endTime ,
    //                 endTimeSelectedHour:this.endTimeSelectedHour,
    //                 endTimeSelectedMinute:this.endTimeSelectedMinute ,
    //                 endTimeAMPM:this.endTimeAMPM 
    //             });
    //             return;
    //         }
    //     }

    //    // const selectedRows = this.serviceGroupName.filter(r => r.isSelected);
    //    const selectedRows = this.records3.filter(r => r.isSelected);
       
    //     console.log('selectedRows length : ',selectedRows.length);
    //     console.log(
    //         '✅ ALL selectedRows (across pages):',
    //         JSON.stringify(selectedRows)
    //     );

    //     if (!selectedRows.length) {
    //         console.warn('❌ No rows selected');
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: 'Please select at least one Service Support Items .',
    //                 variant: 'error',
    //                 mode: 'dismissable'
    //             })
    //         );
    //         return;
    //     }

    //     console.log('🟢 Saving selected services:', JSON.stringify(selectedRows));
    //     const participantLabel =
    //         this.serviceParticipantOptions.find(
    //             p => p.value === this.serviceParticipant
    //         )?.label || '';

    //     let staffLabel = '';
    //     if (this.AddServiceStaffValue === 'CONTRACTOR') {
    //         staffLabel = 'Contractor';
    //     } else {
    //         staffLabel =
    //             this.AddServiceStaffOptions.find(
    //                 s => s.value === this.AddServiceStaffValue
    //             )?.label || '';
    //     }

    //     console.log('Resolved participantLabel:', participantLabel);
    //     console.log('Resolved staffLabel:', staffLabel);
    //     const payload = selectedRows.map(row => {
    //         const record = {
    //             Client__c: this.serviceParticipant,
    //             Funds_Tracker__c: this.serviceTypeId,
    //             Service_Type__c: row.Id,
    //             Services__c: row.serviceSupportItem,
    //             Qty__c: this.serviceQuantity,
    //             Edited_Unit_Price__c: row.amount,
    //             Status__c: 'Not Yet Invoiced',
    //             Date_of_Service__c: this.AddServiceStartDate,
    //             Start_Time_24_Format__c: this.startTime,
    //             End_Time_24_Format__c: this.endTime,
    //             State__c: this.stateValue ,
    //             manual_Service__c: true
                
    //         };

    //         // 👇 STAFF LOGIC
    //         if (this.AddServiceStaffValue === 'CONTRACTOR') {
    //             record.Contractor_Name__c = 'Contractor'; 
    //         } else {
    //             //record.Service_Users__c = this.AddServiceStaffValue || ''; 
    //             record['Service_Users__c'] = this.AddServiceStaffValue || '';
    //         }

    //         return record;
    //     });

    //     console.log('📦 Final save payload:', JSON.stringify(payload));

    //      this.showProgressBar = true;
    //      saveServiceSupportPlans({ services: payload })
    //     .then(savedServices => {
    //         console.log('savedServices : ',JSON.stringify(savedServices));
    //         // ---------- FORMAT UI DATA ----------
    //         const formattedServiceDate = new Date(this.AddServiceStartDate)
    //             .toLocaleDateString('en-GB');

    //         const formattedQty = parseFloat(this.serviceQuantity).toFixed(2);
    //         console.log('formattedQty : ',formattedQty);
    //         console.log('formattedServiceDate : ',formattedServiceDate);
    //         console.log('selectedRows : ',JSON.stringify(selectedRows));
          

    //         // ---------- BUILD UI ROWS USING REAL IDs ----------
    //         const manualRows = savedServices.map((svc, index) => ({
    //             Id: svc.Id, 

    //             Status__c: svc.Status__c,
    //             Client__c: svc.Client__c,
    //             Client__r: {
    //                 Id: svc.Client__r.Id,
    //                 First_Name__c: svc.Client__r.First_Name__c,
    //                 Last_Name__c: svc.Client__r.Last_Name__c,
    //                 Facility__c: svc.Client__r.Facility__c
    //             },
    //             participantFullName: participantLabel,
    //             fundsTrackerId: svc.Funds_Tracker__c,
    //             Funds_Tracker__c: svc.Funds_Tracker__c,
    //             Funds_Tracker__r: {
    //                 Id: svc.Funds_Tracker__r.Id,
    //                 Entity_Profile__c:
    //                     svc.Funds_Tracker__r.Entity_Profile__c || ''
    //             },
    //              entityProfileId:svc.Funds_Tracker__r.Entity_Profile__c,
    //             // Client__r: { Id: svc.Client__c },

               
    //             Resource_Name__c: staffLabel,
    //             Service_Type_Name__c: selectedRows[index].serviceSupportItem,
    //             Services__c: svc.Services__c,

    //             ServiceDate: formattedServiceDate,
    //             Date_of_Service__c: svc.Date_of_Service__c,
    //             Qty__c: formattedQty,
    //             unitprice: selectedRows[index].amount,
    //             amount: (formattedQty * selectedRows[index].amount).toFixed(2),
    //             Lineitem__c: svc.Lineitem__c,
    //             Description__c: svc.Description__c,
            
    //             uistatus: 'Pending',
    //             isManualService: true,

    //             // participantTitle: 'Created via Add Service',
    //            // participantTitle: 'This invoice is raised independently and is not generated from a shift .',
    //            participantTitle: 'This invoice is raised independently\nand is not generated from a shift.',
                
    //             participantExtraAmount: 0,
    //             GST__c: 'No',

    //             Bill_Participant__c: svc.Bill_Participant__c,
    //             bill: svc.Bill_Participant__c
    //         }));
    //              console.log('manualRows : ',JSON.stringify(manualRows));

    //             // Add to table list
    //            // this.accList = [...manualRows, ...this.accList];

    //             this.serviceGroupName = [];
    //             this.serviceParticipant = null;
    //             this.serviceTypeId = null;
    //             this.serviceQuantity = null;
    //             this.AddServiceStartDate = null;
    //             this.stateValue = null;
    //             this.EntityNameValue = null;
    //             this.isEntityDisabled = false;
    //             this.isAddNewService = false;
                
    //             this.clearStartEndTime();
    //             this.records = [...manualRows, ...this.records];
    //             this.totalRecords = this.records.length;
    //             this.paginationHelper();
    //             this.pendingInvoices = this.records.length;
    //             this.NdisServiceGroupName = false;
    //             this.addServicePaginationVisible = false;

    //             //this.totalRecords = serviceList.length;
    //             setTimeout(() => {
    //                refreshApex(this.wiredResult);
    //             }, 1000);
                  
               
    //         })
    //         .catch(error => {
    //             console.error('❌ Save failed:', error);
                
    //         })
    //         .finally(() => {
    //             this.showProgressBar = false;
    //         });
    // }
    loadServiceParticipantOptions() {
        return fetchFacilitiess({ cname: '', isTrue: false })
            .then((response) => {
                //const selectedFacilityId = this.addShiftData.AddShiftFacilityValue;
               // const selectedFacilityId = this.faclist;
                console.log('this.faclist Id:', this.faclist);

                this.serviceParticipantOptions = response
                    .filter((rec) => {
                        // check active child facility match
                        const hasActiveFacility =
                            rec.Participant_Facilities__r &&
                            rec.Participant_Facilities__r.some(
                                (pf) =>
                                    pf.Active__c === true &&
                                    this.faclist.includes(pf.Facility__c)
                            );

                        return (
                            rec.Status__c === true &&
                            rec.Facility__r?.Status__c === true &&
                            hasActiveFacility
                        );
                    })
                    .map((rec) => ({
                        value: rec.Id,
                        label: rec.Display_Nickname__c,
                        typeofservice: rec.Facility__r?.Type_of_Service__c,
                        participanttype: rec.ParticipantType__c
                    }));

                console.log(  'serviceParticipantOptions:', JSON.stringify(this.serviceParticipantOptions));
                console.log('serviceParticipantOptions  length '+this.serviceParticipantOptions.length);
            })
            .catch((error) => {
                console.error('Error fetching participants', error);
            });
    }
    handleOpenCreateCompany(event) {
        const facilityId = event.currentTarget.dataset.facilityId;
        const fundTrackerId = event.currentTarget.dataset.fundstrackerid;

        console.log('🏥 Facility Id:', facilityId);
        console.log('💰 Fund Tracker Id:', fundTrackerId);
        localStorage.removeItem('facilityRecordId');

        this.createCompanyFacilityId = facilityId;
        this.createCompanyFundTrackerId = fundTrackerId;
        console.log('this.createCompanyFundTrackerId ', this.createCompanyFundTrackerId);
       

        this.tilesflag = true;
        this.isModalRelate = false;
        this.generatedflag = false;
        this.pendingflag = false;
        this.totalvalueflag = false;
        this.cancelledflag = false;

        this.createCompanyFlag = true;
        this.isFromManageInvoice = true;
        
    }
    validateFundsForSelectedServices() {
        
        if (!this.serviceGroupName?.length || !this.serviceQuantity) {
            return true;
        }

        const selectedRows = this.serviceGroupName.filter(r => r.isSelected);

        if (!selectedRows.length) {
            return true;
        }

        const totalSelectedAmount = selectedRows.reduce((sum, row) => {
            const unitPrice = Number(row.amount || 0);
            return sum + (unitPrice * this.serviceQuantity);
        }, 0);

        console.log('💰 Total Selected Amount:', totalSelectedAmount);
        console.log('💰 Available Funds:', this.availableFunds);

        if (this.availableFunds != null && totalSelectedAmount > this.availableFunds) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                     //message: 'The selected Service Support Items amount exceeds the available fundsof the service .',
                    message: 'All allocated funds for this service have been fully utilised. Add funds in the Funds Tracker to continue.',
                    variant: 'error',
                    
                })
            );
            return false;
        }

        return true;
    }
    get bDisableFirst3() {
        return this.pageNumber3 === 1;
    }

    get bDisableLast3() {
        return this.pageNumber3 === this.totalPages3;
    }
    handleRecordsPerPage3(event) {
        this.pageSize3 = Number(event.target.value);
        this.pageNumber3 = 1;
        this.paginationHelper3();
    }

    previousPage3() {
        this.pageNumber3 = this.pageNumber3 - 1;
        this.paginationHelper3();
    }

    nextPage3() {
        this.pageNumber3 = this.pageNumber3 + 1;
        this.paginationHelper3();
    }

    firstPage3() {
        this.pageNumber3 = 1;
        this.paginationHelper3();
    }

    lastPage3() {
        this.pageNumber3 = this.totalPages3;
        this.paginationHelper3();
    }
    paginationHelper3() {

        this.serviceGroupName = [];
        this.NdisServiceGroupName = true;

        if (!this.records3 || this.records3.length === 0) {
            this.totalPages3 = 0;
            this.addServicePaginationVisible= false;
            return;
        }

        this.totalRecords3 = this.records3.length;
        this.totalPages3 = Math.ceil(this.totalRecords3 / this.pageSize3);

        if (this.pageNumber3 <= 1) {
            this.pageNumber3 = 1;
        } else if (this.pageNumber3 >= this.totalPages3) {
            this.pageNumber3 = this.totalPages3;
        }

        for (
            let i = (this.pageNumber3 - 1) * this.pageSize3;
            i < this.pageNumber3 * this.pageSize3;
            i++
        ) {
            if (i === this.totalRecords3) {
                break;
            }
            this.serviceGroupName.push(this.records3[i]);
        }

        this.addServicePaginationVisible = this.totalPages3 > 0;

        console.log(
            'serviceGroupName (paginated) >>>',
            JSON.stringify(this.serviceGroupName)
        );
    }
    handleNoFunds(){
        this.showNoFundsModal=false;
        this.isAddNewService=true;
        this.serviceParticipant = null;
    }
    handleCreateFunds(){
        this.showCreateFundsFlag=true;
        this.isAddNewService = false;
        this.isFromManageInvoice=true;
        this.tilesflag = true;
        this.isModalRelate = false;
        this.generatedflag = false;
        this.pendingflag = false;
        this.totalvalueflag = false;
        this.cancelledflag = false;
        this.showNoFundsModal=false;
    }
    handleBackToManageInvoice(event) {
         const { fundTrackerId, cancelled } = event.detail;

        console.log(
            '⬅️ Returning to Manage Invoice' );
        this.isAddNewService = true;
        this.isFromManageInvoice = false;
        this.tilesflag = false;
        this.isModalRelate = true;
        this.generatedflag = false;
        this.pendingflag = false;
        this.totalvalueflag = true;
        this.showNoFundsModal = false;
        this.showCreateFundsFlag=false
        if (cancelled) {
            console.log('Cancel → return without refresh',  cancelled );
           // this.cancelledflag = true;
            return; // ⛔ do nothing else
        }

        // 🔹 SAVE FLOW
        console.log(
            'Save → refresh funds for FundTrackerId:',
            fundTrackerId
        );

        this.cancelledflag = false;
        this.loadServiceTypesForParticipant(this.serviceParticipant);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    get tableContainerClass() {
        return this.accountingServiceflag
            ? 'table-container issuedInvoiceTable accounting'
            : 'table-container  no-accounting';
    }

    get accountingStatusLabel() {
        return `${this.accountingService} Status`;
    }

     async handleSelectAll(event) {
        const isChecked = event.target.checked;
        console.log('handleSelectAll -> isChecked:', isChecked);

        this.isAllSelected = isChecked;

        // 🔥 RESET map
        this.selectedRecordMap = new Map();

        if (isChecked) {
            // 🚫 Block Cancelled + Non-Billable (same rule as single checkbox)
            const hasCancelledNonBillable = this.accList.some(acc =>
                acc.Status__c === 'Cancelled' &&
                !(acc.Billable__c === true ||
                String(acc.Billable__c).toLowerCase() === 'true')
            );

            if (hasCancelledNonBillable) {
                this.disableBool = true;
                this.isAllSelected = false;
                event.target.checked = false;

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Not Allowed',
                        message: 'Cancelled (Non-Billable) records cannot be selected.',
                        variant: 'warning',
                        mode: 'dismissable'
                    })
                );
                return;
            }

            
            this.accList.forEach(acc => {
                this.selectedRecordMap.set(acc.Id, {
                    status: acc.Status__c,
                    //fundsTrackerId: acc.fundsTrackerId,
                    bill: acc.Billable__c,
                    clientId: acc.SupportClient_To_Notes__r?.Id // 🔥 REQUIRED
                });
            });
        }
         this.checkStatus = Array.from(this.selectedRecordMap.values())
            .map(v => v.status)
            .join(',');

        const hasInvoiceGenerated = this.hasInvoiceGeneratedSelected();
       // const allSameAndAllowed = this.allSelectedStatusesAreSameAndAllowed();

        if (this.selectedRecordMap.size > 0 && !hasInvoiceGenerated ) {  //&& allSameAndAllowed
            this.disableBool = false;
        } else {
            this.disableBool = true;

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid Selection',
                    message: 'Please select records with the same status: either "Pending" or "Cancelled".',
                    variant: 'warning',
                    mode: 'dismissable'
                })
            );
        }
        // Update UI checkboxes
        this.accList = this.accList.map(acc => ({
            ...acc,
            isChecked
        }));

        // if (!isChecked) {
        //     this.accList = this.accList.map(acc => ({
        //         ...acc,
        //        // showCreateCompanyIcon: false,   
        //        // matchedFacilityId: null, 
        //        // fundsTrackerId:  null ,
        //         entityProfileId: null,
        //         entityName:null,
        //         accountItemId: null       
        //     }));

        //     this.disableBool = true;            
        //     return;                            
        // }
        // 🔥 SINGLE SOURCE OF VALIDATION
        //if (this.selectedRecordMap.size > 0) {
        if (isChecked && !this.disableBool) {
           // await this.checkCompanyExist();
        }
        // const hasCompanyMissing = this.accList.some(
        //     acc => acc.isChecked && acc.showCreateCompanyIcon
        // );

        // if (hasCompanyMissing) {
        //     this.disableBool = true;
        //     this.isEntityExist = false; 
        //     return;
        // }

        // const isEntityValid = this.checEntityExist();
        // if (!isEntityValid) {
        //     return;
        // }

        console.log(
            'selectedRecordMap (after selectAll):',
            Array.from(this.selectedRecordMap.entries())
        );
    }


}