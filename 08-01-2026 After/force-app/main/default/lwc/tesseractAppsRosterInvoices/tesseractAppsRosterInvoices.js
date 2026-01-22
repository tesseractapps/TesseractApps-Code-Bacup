import { LightningElement,wire,api,track } from 'lwc';
import fetchFacilitiess from '@salesforce/apex/ClientSearchController.fetchFacilitiess';
import getCompanyAndAccountData from '@salesforce/apex/RosterInvoicesHandler.getCompanyAndAccountData';
import UpdateDataFromInvoice from '@salesforce/apex/AccountingModuleController.UpdateDataFromInvoice';
import getBulkServicesHandler from '@salesforce/apex/RosterInvoicesHandler.getBulkServicesHandler';
import serviceSupportList from '@salesforce/apex/RosterInvoicesHandler.serviceSupportList';
import My_Resource from "@salesforce/resourceUrl/myResource";
import autoTable from '@salesforce/resourceUrl/autotable'
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import robotoFont from '@salesforce/resourceUrl/Roboto';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getAccountingInvoiceById from '@salesforce/apex/InvoiceHandler.getAccountingInvoiceById';
import { deleteRecord } from 'lightning/uiRecordApi';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import updateQty from '@salesforce/apex/RosterInvoicesHandler.updateQty';
import cancelInvoiceApex from '@salesforce/apex/RosterInvoicesHandler.cancelInvoiceById';
import getShiftStaffDetails from '@salesforce/apex/RosterInvoicesHandler.getReimbursementsByShiftStaffIds';
import getEmailBodyServiceInvoice from '@salesforce/apex/RosterInvoicesHandler.getEmailBodyServiceInvoice';
import sendEmail from '@salesforce/apex/RosterInvoicesHandler.sendEmailforServiceInvoice';
//import getEmailBodyICT from '@salesforce/apex/InvoiceHandler.getEmailBodyICT';
import getentityEmailForInvoices from '@salesforce/apex/AccountingChartController.getentityEmailForInvoices';
import createUpdateXeroInvoice from '@salesforce/apex/RosterInvoicesHandler.createUpdateXeroInvoice';
import getAccountingInvoiceByIdXero from '@salesforce/apex/RosterInvoicesHandler.getAccountingInvoiceByIdXero';
//import getBulkServicesHandlerForXero from '@salesforce/apex/RosterInvoicesHandler.getBulkServicesHandlerForXero';
import createInvoiceInXero from '@salesforce/apex/XeroIntegrationController.createOrUpdateXeroInvoice';
import getentityEmailForXeroInvoices from '@salesforce/apex/RosterInvoicesHandler.getentityEmailForXeroInvoices';
import getMyobAuthLink from '@salesforce/apex/MyobIntegrationController.getMyobAuthLink';
import exchangeMyobCodeForToken from '@salesforce/apex/MyobIntegrationController.exchangeMyobCodeForToken';
import getMyobCompanyFiles  from '@salesforce/apex/MyobIntegrationController.getMyobCompanyFiles';
import getCompanyFileDetails  from '@salesforce/apex/MyobIntegrationController.getCompanyFileDetails';
import createMyobInvoice  from '@salesforce/apex/MyobIntegrationController.createMyobInvoice';
import getParticipantFacilityMap  from '@salesforce/apex/RosterInvoicesHandler.getParticipantFacilityMap';

export default class TesseractAppsRosterInvoices extends LightningElement {
    @track startDate;
    @track endDate;
    @api orgid;
    @api faclist;
    @api rolelist;
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
    @track searchKey='' ;
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
    @track serviceStatusOption=[{label:'Pending Invoices',value:'Not Yet Invoiced'},{label:'Invoice Generated',value:'Invoice Generated'}];
    @track noRecordsFlag = true;
    @track noRecordsInvoiceFlag=true;
    @track facilityPreferredName;
    @track participantPreferredName;
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
    @track accountingServiceflag1 = false;

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
   
    connectedCallback() {
      //
     //   console.log('org Id '+this.orgid);
        console.log('faclist '+JSON.stringify(this.faclist));
     //   console.log('rolelist '+JSON.stringify(this.rolelist));
     
 
        /*  var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.startDate =  today.toISOString().slice(0, 10); // e.g., 2025-04-01
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.endDate = last.toISOString().slice(0, 10);   // e.g., 
       */
        const today = new Date();

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        this.businessId = urlParams.get('businessId');

        if (!this.businessId) {
            console.log('❌ businessId is NULL at initial load');
        } else {
            console.log('✅ businessId:', this.businessId);
        }

        console.log('🔹 businessId:', this.businessId);
        console.log('🔹 [Step 1.1] URL params parsed:', urlParams.toString());
        console.log('🔹 [Step 1.2] Code from URL:', code);
        console.log('🔹 [Step 1.3] window.location.origin:', window.location.origin);
        console.log('🔹 [Step 1.4] window.location.href:', window.location.href);

        // ---------------------------------------------------
        // ⭐ Run MYOB exchange when redirect code detected
        // ---------------------------------------------------
        if (code) {
            console.log('🔵 Running token exchange flow for MYOB...');
            this.exchangeCodeAndCloseTab(code);  // NO RETURN HERE
        }

        // Start: July 1 of current year
        const startOfFY = new Date(today.getFullYear(), 6, 1);   // month index 6 = July
        this.startDate = this.formatDate(startOfFY);

        // End: June 30 of next year
        const endOfFY = new Date(today.getFullYear() + 1, 5, 30); // month index 5 = June
        this.endDate = this.formatDate(endOfFY);

        console.log('📅 Start Date (FY): ' + this.startDate);
        console.log('📅 End Date (FY): ' + this.endDate);


        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
        this.accountingService = localStorage.getItem("orgAccountingServices");

        console.log(
            'this.accountingService RAW:',
            this.accountingService,
            'type:',
            typeof this.accountingService
        );

        // ✅ Normalize value
        const service = this.accountingService
            ? this.accountingService.trim().toUpperCase()
            : null;

        console.log('Normalized accountingService:', service);

        if (service === 'XERO' || service === 'MYOB') {
            console.log('✅ Accounting service matched:', service);
            this.accountingServiceflag = true;
        } else {
            this.accountingServiceflag = false;
        }
        console.log('startdate'+this.startDate);
        console.log('enddate'+this.endDate);
        console.log('orgid'+this.orgid);
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
             this.accountingService = response.listofPriceBook.Accounting_Services__c;
             /* this.desc = response.li=tofPriceBook.Description__c; */
            console.log('this.accountingService in organizationDetails : ',this.accountingService);
            console.log(
                'this.accountingService RAW:',
                this.accountingService,
                'type:',
                typeof this.accountingService
            );

            // ✅ Normalize value
            const service = this.accountingService
                ? this.accountingService.trim().toUpperCase()
                : null;

            console.log('Normalized accountingService:', service);

            if (service === 'XERO' || service === 'MYOB') {
                console.log('✅ Accounting service matched:', service);
                this.accountingServiceflag = true;
            } else {
                this.accountingServiceflag = false;
            }
                this.cacheBuster = this.cacheBuster + 1;
            });
        // if (this.accountingService === 'Tesseract System') {
        //     refreshApex(this.wiredBulkServicesResult);
        // } else if (this.accountingService === 'Xero') {
        //      refreshApex(this.wiredBulkServicesResultForXero);
        // }
        // refreshApex(this.wiredResult);
        refreshApex(this.wiredBulkServicesResult);
    }


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
        clientIds: '$partcipantIdList', 
        startDateStr: '$startDate', 
        endDateStr: '$endDate', 
        orgid: '$orgid',
        name: '$searchKey',
        status: '$statusService' ,
        accountingService: '$accountingService',
        cacheBuster: '$cacheBuster'  
    })
    wiredServiceList(result) {
        console.log('🔹 Wire result received wiredServiceList :', result);
     //    console.log('📌 Current searchKey in  serviceSupportList:', this.searchKey);

        this.isShowSpinner = true;
        this.wiredResult = result;

        if (!result.data && !result.error) {
        console.log('⏭ wiredServiceList: initial empty state (no data/error yet) – ignoring');
        this.isShowSpinner = false;
        return;
    }

    if (result.error) {
        console.error('❌ Wire error:', result.error);
        this.isShowSpinner = false;
        return;
    }

  if (result.data) {
            console.log('✅ Data received from wire:', JSON.stringify(result.data));
            console.log('✅ Data received from wire LENGTH :', JSON.stringify(result.data.length));
             const serviceData = result.data;
                    const participantIdsValues = [
                        ...new Set(serviceData.map(r => r.Client__c))
                    ]; 
            console.log('participantIds in serviceSupportList ==>' +JSON.stringify(participantIdsValues));
           if(participantIdsValues.length>0){
                            getParticipantFacilityMap({participantIds: participantIdsValues}).then(participantFacilityMap=>{
                                console.log('participantFacilityMap in serviceSupportList ==>' +JSON.stringify(participantFacilityMap));

            
                            let filterData = serviceData.filter(rec => {
                                    const participantId = rec.Client__c;
                                    const facilities = participantFacilityMap[participantId] || [];
                                    return facilities.some(facId => this.faclist.includes(facId));;
                                });
                    console.log('🔹 Filtered by facility list:', filterData);

                    this.servicesfromparent = filterData;
                    console.log('this.accountingService in wiredServiceList : ',this.accountingService);
                    if (this.accountingService === 'Tesseract System') {
                        this.servicesfromparent = filterData.map(rec => {
                            console.log('rec.Funds_Tracker__r?.Entity_Profile__c  >>>>', rec.Funds_Tracker__r?.Entity_Profile__c);
                            return {
                                ...rec,
                                entityProfileId: rec.Funds_Tracker__r?.Entity_Profile__c
                            };
                        });

                        console.log('🔹 servicesfromparent with entityProfileId:', JSON.stringify(this.servicesfromparent));

                    } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
                        this.accountingServiceflag = true;
                        console.log('this.accountingService ===> ', this.accountingService);
                        console.log('this.accountingServiceflag ===> ', this.accountingServiceflag);
                        this.servicesfromparent = filterData.map(rec => {
                            console.log('rec.Funds_Tracker__r?.Xero_Entity__c  >>>>', rec.Funds_Tracker__r?.Xero_Entity__c);
                            return {
                                ...rec,
                                entityProfileId: rec.Funds_Tracker__r?.Xero_Entity__c
                            };
                        });

                        console.log('🔹 servicesfromparent with entityProfileId for Xero:', JSON.stringify(this.servicesfromparent));
                    }

                
                    this.shiftWithStaffIds = filterData
                        .filter(rec => rec.ShiftwithStaff__c)
                        .map(rec => rec.ShiftwithStaff__c);

                    console.log('✅ Collected ShiftwithStaff__c IDs:', JSON.stringify(this.shiftWithStaffIds));

                    this.fetchShiftStaffDetails();
                })

            }else{
                this.isShowSpinner = false;   
            }
             
            

        } else if (result.error) {
            console.error('❌ Wire error:', result.error);
            this.isShowSpinner = false;
        }
    }

    // 🔹 Separate method to fetch Apex data using collected ShiftwithStaff__c
    /* fetchShiftStaffDetails() {
        console.log('🔹 Starting fetchShiftStaffDetails...');

        getShiftStaffDetails({ shiftStaffIds: this.shiftWithStaffIds })
            .then(apexResult => {
                console.log('✅ Apex data received:', JSON.stringify(apexResult));

                // 🔹 Create a map from Apex data: ShiftwithStaff__c → Apex record
                const shiftMap = {};
                apexResult.forEach((shift, index) => {
                    console.log(`🔹 Apex record ${index + 1}: Id=${shift.Id}, ShiftwithStaff__c=${shift.ShiftwithStaff__c}`);
                    shiftMap[shift.ShiftwithStaff__c] = shift;
                });

                console.log('🔹 Shift Map from Apex:', JSON.stringify(shiftMap));

                // 🔹 Tag wire records with matching Apex record
                const taggedServiceList = this.servicesfromparent.map((wireRec, idx) => {
                    console.log(`🔹 Wire record ${idx + 1}: Id=${wireRec.Id}, ShiftwithStaff__c=${wireRec.ShiftwithStaff__c}`);

                    // Check if wire record's ShiftwithStaff__c exists in Apex map
                    const mappedShift = shiftMap[wireRec.ShiftwithStaff__c] || null;
                    if (mappedShift) {
                        console.log(`   ✅ Matched Apex record Id=${mappedShift.Id}`);
                    } else {
                        console.log('   ⚠️ No matching Apex record found for this wire record');
                    }

                    // Return wire record with tagged Apex record
                    return {
                        ...wireRec,
                        shiftStaffRecord: mappedShift
                    };
                });

                console.log('🔹 Tagged Service List:', JSON.stringify(taggedServiceList));

                // 🔹 Optional: check if all ShiftwithStaff__c from wire exist in Apex
                this.servicesfromparent.forEach((wireRec, idx) => {
                    if (!shiftMap[wireRec.ShiftwithStaff__c]) {
                        console.warn(`⚠️ Wire record ${wireRec.Id} has ShiftwithStaff__c=${wireRec.ShiftwithStaff__c} but no matching Apex record`);
                    }
                });

                // 🔹 Call pagination helper with tagged list
                this.servicePAginationHelper(taggedServiceList);

                this.isShowSpinner = false;
                console.log('🔹 fetchShiftStaffDetails finished.');
            })
            .catch(error => {
                console.error('❌ Error fetching shift staff details:', error);
                this.isShowSpinner = false;
            });
    } */


    fetchShiftStaffDetails() {
        console.log('🔹 Starting fetchShiftStaffDetails...');

        getShiftStaffDetails({ shiftStaffIds: this.shiftWithStaffIds })
            .then(apexResult => {
                console.log('✅ Apex data received:', JSON.stringify(apexResult));

                // 🔹 Create a map: ShiftwithStaff__c → [Apex records]
                const shiftMap = {};
                apexResult.forEach((shift, index) => {
                    console.log(`🔹 Apex record ${index + 1}: Id=${shift.Id}, ShiftwithStaff__c=${shift.ShiftwithStaff__c}`);

                    if (!shiftMap[shift.ShiftwithStaff__c]) {
                        shiftMap[shift.ShiftwithStaff__c] = [];
                    }
                    shiftMap[shift.ShiftwithStaff__c].push(shift);
                });

                console.log('🔹 Shift Map (grouped):', JSON.stringify(shiftMap));

                // 🔹 Tag wire records with *list* of Apex records
                const taggedServiceList = this.servicesfromparent.map((wireRec, idx) => {
                    console.log(`🔹 Wire record ${idx + 1}: Id=${wireRec.Id}, ShiftwithStaff__c=${wireRec.ShiftwithStaff__c}`);

                    const mappedShifts = shiftMap[wireRec.ShiftwithStaff__c] || [];
                    if (mappedShifts.length > 0) {
                        console.log(`   ✅ Found ${mappedShifts.length} matching Apex records`);
                    } else {
                        console.log('   ⚠️ No matching Apex records found for this wire record');
                    }

                    return {
                        ...wireRec,
                        shiftStaffRecords: mappedShifts   // ⬅️ notice plural
                    };
                });

                console.log('🔹 Tagged Service List (with arrays):', JSON.stringify(taggedServiceList));

                // 🔹 Optional: warn if no match found
                this.servicesfromparent.forEach((wireRec, idx) => {
                    if (!shiftMap[wireRec.ShiftwithStaff__c]) {
                        console.warn(`⚠️ Wire record ${wireRec.Id} has ShiftwithStaff__c=${wireRec.ShiftwithStaff__c} but no matching Apex records`);
                    }
                });

                // 🔹 Send enriched list for pagination/display
                this.servicePAginationHelper(taggedServiceList);

                this.isShowSpinner = false;
                console.log('🔹 fetchShiftStaffDetails finished.');
            })
            .catch(error => {
                console.error('❌ Error fetching shift staff details:', error);
                this.isShowSpinner = false;
            });
    }

    @wire(getBulkServicesHandler, { PartcipantIdList: '$partcipantIdList', sDate: '$startDate', eDate: '$endDate', orgid: '$orgid', name:'$searchKey' })
  async  wiredBulkServices(result) {
        this.wiredBulkServicesResult = result;
        console.log('📌 Current searchKey in  getBulkServicesHandler:', this.searchKey);
    
            console.log('this.accountingService in getBulkServicesHandler : ',this.accountingService);
                console.log(
                'this.accountingService RAW:',
                this.accountingService,
                'type:',
                typeof this.accountingService
            );

            // ✅ Normalize value
            const service = this.accountingService
                ? this.accountingService.trim().toUpperCase()
                : null;

            console.log('Normalized accountingService:', service);

            if (service === 'XERO' || service === 'MYOB') {
                console.log('✅ Accounting service matched:', service);
                this.accountingServiceflag = true;
            } else {
                this.accountingServiceflag = false;
            }
        
        if (result.data) {
                console.log('📌 Raw result.data  wiredBulkServices >>>', JSON.parse(JSON.stringify(result.data)));
                  const serviceData = result.data;
                    const participantIdsValues = [
                        ...new Set(serviceData.map(r => r.Participant__c))
                    ]; 

          console.log('participantIds in bulk service ==>' +JSON.stringify(participantIdsValues));
                 if(participantIdsValues.length>0){
                        getParticipantFacilityMap({participantIds: participantIdsValues}).then(participantFacilityMap=>{
                                    console.log('participantFacilityMap in bulk service ==>' +JSON.stringify(participantFacilityMap));
                            let filterData = serviceData.filter(rec => {
                                const participantId = rec.Participant__c;
                                const facilities = participantFacilityMap[participantId] || [];
                                return facilities.some(facId => this.faclist.includes(facId));;
                            });
                console.log('✅ After Facility Filter >>>', JSON.parse(JSON.stringify(filterData)));
                console.log('this.accountingService in wiredBulkServices : ',this.accountingService);
                // 🔹 Map records
                let mappedRecords = filterData.map(invoice => {
                    console.log('🧾 Processing Invoice >>>', JSON.parse(JSON.stringify(invoice)));

                    let fileReference = '';
                    let entityName = 'N/A';
                    let xeroInvoiceId = null;
                    let addToXeroClass = '';
                    let addToXeroTitle = '';

                    if (invoice.Participant__r) {
                        fileReference = invoice.Participant__r.Name__c ? invoice.Participant__r.Name__c : '';
                        console.log('👤 Participant Name:', fileReference);
                    }
                    if (this.accountingService === 'Tesseract System') {
                        if (invoice.Accounting_Journal_Entry__r && invoice.Accounting_Journal_Entry__r.length > 0) {
                            const journalEntry = invoice.Accounting_Journal_Entry__r[0];
                            entityName = journalEntry.Entity_Profile_Name__c ? journalEntry.Entity_Profile_Name__c : 'N/A';
                            console.log('📒 Journal Entry Found:', JSON.parse(JSON.stringify(journalEntry)));
                            console.log('🏷️ Entity Name:', entityName);
                        }

                    } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
    
                        const entity = invoice.Xero_Entity__r;
                        entityName = entity ? `${entity.First_Name__c || ''} ${entity.Last_Name__c || ''}`.trim() : 'N/A';
                        console.log('🏷️ Entity Name in xero:', entityName);

                        xeroInvoiceId = invoice.Xero_Innvoice_Id__c || null;
                        if (xeroInvoiceId) {
                            addToXeroClass = 'disabled-xero';
                            if(this.accountingService === 'Xero'){
                                addToXeroTitle = 'Already added to Xero';
                            }if(this.accountingService === 'MYOB'){
                                addToXeroTitle = 'Already added to MYOB';
                            }
                        } else {
                            addToXeroClass = '';
                            if(this.accountingService === 'Xero'){
                                addToXeroTitle = 'Send to Xero';
                            }if(this.accountingService === 'MYOB'){
                                addToXeroTitle = 'Send to MYOB';
                            }
                        }
                        console.log(`Invoice ${invoice.Id}: XeroInvoiceId=${xeroInvoiceId}, addToXeroClass=${addToXeroClass},addToXeroTitle=${addToXeroTitle}`);

                    }
                      console.log('🏷️ Entity Name :', entityName);

                    let mapped = {
                        Id: invoice.Id,
                        Name: invoice.Name,
                        Status__c: invoice.Status__c,
                        GST__c: invoice.GST__c,
                        Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
                        fileReference: fileReference || 'N/A',
                        invoiceNumber: invoice.Invoice_Number__c || '',
                        amazonUrl: invoice.Amazon_URL__c,
                        invoiceDate: invoice.Invoice_Date__c
                            ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB')
                            : '',
                        invoiceEntityName: entityName || '',
                        isCancelled: invoice.Status__c === 'Cancelled',
                        emailCount: invoice.Email_Count__c || '', 

                        showAddToXero:
                            invoice.Status__c === 'Cancelled' || this.accountingService !== 'Xero' || this.accountingService !== 'MYOB',

                        xeroInvoiceId: xeroInvoiceId || null,
                        addToXeroClass: addToXeroClass || '',

                      
                        addToXeroTitle:
                            this.accountingService === 'Xero' || this.accountingService === 'MYOB'
                                ? `Already added to ${this.accountingService}`
                                : 'Send to Accounting System',
                    };

                    console.log('✅ Mapped Invoice:', mapped);
                    return mapped;
                });
              
                this.recordsBulk = mappedRecords;
                console.log('📦 All Mapped Records >>>', this.recordsBulk);

             
                this.issuedRecords = mappedRecords.filter(rec => rec.Status__c === 'Issued');
                this.cancelledRecords = mappedRecords.filter(rec => rec.Status__c === 'Cancelled');
                console.log('🟩 Issued Records >>>', this.issuedRecords);
                console.log('🟥 Cancelled Records >>>', this.cancelledRecords);

                // -------------------------------
                // Bulk pagination
                // -------------------------------
                this.totalRecordsBulk = this.recordsBulk.length;
                this.noRecordsInvoiceFlag = this.recordsBulk.length > 0 ? false : true;
                this.pageSizeBulk = this.pageSizeOptionsBulk[0];
                this.pageNumberBulk = 1;
                this.totalAmount = this.recordsBulk.reduce((sum, rec) => sum + parseFloat(rec.Total_Amount__c), 0).toFixed(2);

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

                console.log('✅ Final Issued Records:', this.issuedRecords);
                console.log('✅ Final Cancelled Records:', this.cancelledRecords);
                            })
                } else{
                      this.isShowSpinner = false;
                }
               
                

            } else if (result.error) {
                console.error('❌ Error fetching bulk services:', result.error);
            }
       
    }
    // @wire(getBulkServicesHandlerForXero, { PartcipantIdList: '$partcipantIdList', sDate: '$startDate', eDate: '$endDate', orgid: '$orgid', name:'$searchKey' })
    // wiredBulkServicesForXero(result) {
    //     this.wiredBulkServicesResultForXero = result;
    //     console.log('📌 Current searchKey in  getBulkServicesHandlerForXero:', this.searchKey);
    //     this.showProgressBar = true;
    //     setTimeout(() => {
    //         console.log('this.accountingService in getBulkServicesHandlerForXero : ',this.accountingService);
    //             // 🔹 Map records
    //         if (this.accountingService !== 'Xero') {
    //             this.recordsBulk = [];
    //             this.issuedRecords = [];
    //             this.cancelledRecords = [];
    //             this.totalRecordsBulk = 0;
    //             this.noRecordsInvoiceFlag = true;
    //             this.totalAmount = 0;
    //             this.showProgressBar = false;
    //             console.warn('⚠️ Skipping processing because accountingService is not Tesseract.');
    //             return;
    //         } else if (result.data) {
    //             console.log('📌 Raw result.data  getBulkServicesHandlerForXero >>>', JSON.parse(JSON.stringify(result.data)));

    //             // 🔹 Filter by facility
    //             let filterData = result.data.filter(rec =>
    //                 this.faclist.includes(rec.Participant__r?.Facility__c)
    //             );
    //             console.log('✅ After Facility Filter >>>', JSON.parse(JSON.stringify(filterData)));
            
    //             let mappedRecords = filterData.map(invoice => {
    //                 console.log('🧾 Processing Invoice  in getBulkServicesHandlerForXero>>>', JSON.parse(JSON.stringify(invoice)));

    //                 let fileReference = '';
    //                 let entityName = 'N/A';

    //                 if (invoice.Participant__r) {
    //                     fileReference = invoice.Participant__r.Name__c ? invoice.Participant__r.Name__c : '';
    //                     console.log('👤 Participant Name:', fileReference);
    //                 }
    //                 if (this.accountingService === 'Tesseract System') {
    //                     if (invoice.Accounting_Journal_Entry__r && invoice.Accounting_Journal_Entry__r.length > 0) {
    //                         const journalEntry = invoice.Accounting_Journal_Entry__r[0];
    //                         entityName = journalEntry.Entity_Profile_Name__c ? journalEntry.Entity_Profile_Name__c : 'N/A';
    //                         console.log('📒 Journal Entry Found:', JSON.parse(JSON.stringify(journalEntry)));
    //                         console.log('🏷️ Entity Name:', entityName);
    //                     }

    //                 } else if (this.accountingService === 'Xero') {
    //                     const entity = invoice.Xero_Entity__r;
    //                     entityName = entity ? `${entity.First_Name__c || ''} ${entity.Last_Name__c || ''}`.trim() : 'N/A';
    //                     console.log('🏷️ Entity Name in xero:', entityName);
    //                 }
                    

    //                 let mapped = {
    //                     Id: invoice.Id,
    //                     Name: invoice.Name,
    //                     Status__c: invoice.Status__c,
    //                     GST__c: invoice.GST__c,
    //                     Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
    //                     fileReference: fileReference || 'N/A',
    //                     invoiceNumber: invoice.Invoice_Number__c,
    //                     amazonUrl: invoice.Amazon_URL__c,
    //                     invoiceDate: invoice.Invoice_Date__c
    //                         ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB')
    //                         : '',
    //                     invoiceEntityName: entityName,
    //                     isCancelled: invoice.Status__c === 'Cancelled',
    //                     emailCount: invoice.Email_Count__c || '', 
    //                     //invoiceType: invoiceType,
    //                     // invoiceStartDate:invoice.Start_Date__c,
    //                     // invoiceEndDate:invoice.End_Date__c
    //                 // entryId: invoice.Accounting_Journal_Entry__r[0].Id
    //                 };
    //                 console.log('✅ Mapped Invoice:', mapped);
    //                 return mapped;
    //             });

    //             // 🔹 All records
    //             this.recordsBulk = mappedRecords;
    //             console.log('📦 All Mapped Records >>>', this.recordsBulk);

    //             // 🔹 Separate Issued + Cancelled
    //             this.issuedRecords = mappedRecords.filter(rec => rec.Status__c === 'Issued');
    //             this.cancelledRecords = mappedRecords.filter(rec => rec.Status__c === 'Cancelled');
    //             console.log('🟩 Issued Records >>>', this.issuedRecords);
    //             console.log('🟥 Cancelled Records >>>', this.cancelledRecords);

    //             // -------------------------------
    //             // Bulk pagination
    //             // -------------------------------
    //             this.totalRecordsBulk = this.recordsBulk.length;
    //             this.noRecordsInvoiceFlag = this.recordsBulk.length > 0 ? false : true;
    //             this.pageSizeBulk = this.pageSizeOptionsBulk[0];
    //             this.pageNumberBulk = 1;
    //             this.totalAmount = this.recordsBulk.reduce((sum, rec) => sum + parseFloat(rec.Total_Amount__c), 0).toFixed(2);

    //             console.log('📊 Bulk Pagination Init >>>', {
    //                 totalRecordsBulk: this.totalRecordsBulk,
    //                 pageSizeBulk: this.pageSizeBulk,
    //                 pageNumberBulk: this.pageNumberBulk,
    //                 totalAmount: this.totalAmount
    //             });

    //             this.paginationHelperBulk();

    //             // -------------------------------
    //             // Issued pagination init
    //             // -------------------------------
    //             this.issuedTotal = this.issuedRecords.length;
    //             this.generatedInvoices = this.issuedRecords.length;
    //             this.issuedPageSize = this.issuedPageSizeOptions[0];
    //             this.issuedPageNumber = 1;
    //             this.issuedTotalPages = Math.ceil(this.issuedTotal / this.issuedPageSize) || 1;

    //             console.log('📑 Issued Pagination Init >>>', {
    //                 issuedTotal: this.issuedTotal,
    //                 issuedPageSize: this.issuedPageSize,
    //                 issuedPageNumber: this.issuedPageNumber,
    //                 issuedTotalPages: this.issuedTotalPages
    //             });

    //             this.updateIssuedPagination();

    //             // -------------------------------
    //             // Cancelled pagination init
    //             // -------------------------------
    //             this.cancelledTotal = this.cancelledRecords.length;
    //             this.overdueInvoices = this.cancelledRecords.length;
    //             this.cancelledPageSize = this.cancelledPageSizeOptions[0];
    //             this.cancelledPageNumber = 1;
    //             this.cancelledTotalPages = Math.ceil(this.cancelledTotal / this.cancelledPageSize) || 1;

    //             console.log('📑 Cancelled Pagination Init >>>', {
    //                 cancelledTotal: this.cancelledTotal,
    //                 cancelledPageSize: this.cancelledPageSize,
    //                 cancelledPageNumber: this.cancelledPageNumber,
    //                 cancelledTotalPages: this.cancelledTotalPages
    //             });

    //             this.updateCancelledPagination();

    //             console.log('✅ Final Issued Records:', this.issuedRecords);
    //             console.log('✅ Final Cancelled Records:', this.cancelledRecords);

    //         } else if (result.error) {
    //             console.error('❌ Error fetching bulk services:', result.error);
    //         }
    //         this.showProgressBar = false;
    //     }, 1000); 
    // }
 
    renderedCallback() {
        if (this.jsPDFInitialized) {
         return; // Prevent reloading scripts multiple times
     } 
     console.log('child  rendered call back called ')
       Promise.all([
         // loadScript(this, Dompurify),
         
           loadScript(this, jsPDF),
          loadScript(this, autoTable),
          //this line of code is for using custom font in jspdf because jspdf supports only few fonts like courier,times-roman and helvitica.
          //to use custom font we have downloaded the font from google which is .ttf converted ttf to js and upload in static resource.
          loadScript(this, robotoFont)
         
           ]).then(() => {   
              //this.jsPDFInitialized = true;
             console.log('✅ jsPDF and ROBOTO font loaded');
  
             // ✅ Register the Roboto font manually
             if (window.jspdf && window.callAddFont) {
                 window.jspdf.jsPDF.API.events.push(['addFonts', window.callAddFont]);
                 console.log('✅ Roboto font registered via callAddFont');
             } else {
                 console.warn('⚠️ callAddFont or jsPDF not available in window scope');
             }
                       // ✅ Register the autoTable plugin
            if (window.jspdf?.jsPDF && window.jspdf?.autoTable) {
                window.jspdf.jsPDF.API.autoTable = window.jspdf.autoTable;
                console.log('✅ autoTable registered with jsPDF');
            } else {
                console.error('❌ autoTable plugin or jsPDF not properly loaded.');
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

   handleSearchInput(event) {
    let value = event.target.value;
    this.searchKey = value;
   
        console.log('searchKey '+value);
        console.log('📌 Current searchKey before refreshApex:', this.searchKey);
        this.isShowSpinner=true;
         setTimeout(() => {
            // if (this.accountingService === 'Tesseract System') {
            //     refreshApex(this.wiredBulkServicesResult);
            // } else if (this.accountingService === 'Xero') {
            //     refreshApex(this.wiredBulkServicesResultForXero);
            // }
            refreshApex(this.wiredBulkServicesResult);
            refreshApex(this.wiredResult);
        }, 3000); 
        // Wait 2 seconds after user stops typing
    }
    triggerRefresh() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            
        }, 2000);
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

    /* servicePAginationHelper(serviceList) {
        console.log('🔹 Entered servicePAginationHelper');
        try {
            console.log('✅ Incoming serviceList:', JSON.parse(JSON.stringify(serviceList)));
        } catch (err) {
            console.error('❌ Failed to stringify incoming serviceList:', err);
        }

        try {
            this.records = serviceList.map((item, index) => {
                console.log(`\n🔹 Processing record ${index + 1} with Id=${item.Id}`);

                // --- existing fields ---
                const slno = index + 1;
                const participantFullName = item.Client__r?.Name__c || '';
                const ServiceDate = item.Date_of_Service__c
                    ? new Date(item.Date_of_Service__c).toLocaleDateString('en-GB')
                    : '';
                const amount = item.Amount__c != null ? parseFloat(item.Amount__c).toFixed(2) : '0.00';
                const availableFunds = item.Available_Fund__c != null
                    ? parseFloat(item.Available_Fund__c).toFixed(2)
                    : '0.00';
                const unitprice = item.Edited_Unit_Price__c != null
                    ? parseFloat(item.Edited_Unit_Price__c).toFixed(2)
                    : (item.Unit_Price__c != null ? parseFloat(item.Unit_Price__c).toFixed(2) : '0.00');
                const Qty__c = item.Qty__c != null ? parseFloat(item.Qty__c).toFixed(2) : '0.00';
                const uistatus = item.Status__c === 'Not Yet Invoiced' ? 'Pending' : item.Status__c;
                const totalReimbursementAmount = item.totalReimbursementAmount != null
                    ? parseFloat(item.totalReimbursementAmount).toFixed(2)
                    : '0.00';

                console.log('item.Funds_Tracker__r?.Entity_Profile__c  >>>', item.Funds_Tracker__r?.Entity_Profile__c );
                const entityName = item.Funds_Tracker__r?.Entity_Profile__c || null;

                // --- new logic: participantExtraAmount + pending status ---
                let participantExtraAmount = 0;
                let hasPendingReimbursement = false;

                if (item.shiftStaffRecord && Array.isArray(item.shiftStaffRecord)) {
                    console.log(`   shiftStaffRecord has ${item.shiftStaffRecord.length} entries`);

                    item.shiftStaffRecord.forEach((rec, idx) => {
                        console.log(`   🔹 Checking shiftStaffRecord ${idx + 1}:`, JSON.parse(JSON.stringify(rec)));

                        if (rec.Mileage_Bill__c === 'Participant') {
                            participantExtraAmount += parseFloat(rec.Mileage_Amount__c || 0);
                            console.log(`      ➕ Added Mileage_Amount__c: ${rec.Mileage_Amount__c}`);
                        }

                        if (rec.Service_Amount__c === 'Participant') {
                            participantExtraAmount += parseFloat(rec.Amount__c || 0);
                            console.log(`      ➕ Added Service Amount__c: ${rec.Amount__c}`);
                        }

                        if (rec.Approval_Status__c === 'Pending') {
                            hasPendingReimbursement = true;
                            console.log(`      ⚠️ Found Pending status in shiftStaffRecord`);
                        }
                    });
                } else if (item.shiftStaffRecord) {
                    console.log(`   shiftStaffRecord is a single object:`, JSON.parse(JSON.stringify(item.shiftStaffRecord)));

                    if (item.shiftStaffRecord.Mileage_Bill__c === 'Participant') {
                        participantExtraAmount += parseFloat(item.shiftStaffRecord.Mileage_Amount__c || 0);
                        console.log(`      ➕ Added Mileage_Amount__c: ${item.shiftStaffRecord.Mileage_Amount__c}`);
                    }

                    if (item.shiftStaffRecord.Service_Amount__c === 'Participant') {
                        participantExtraAmount += parseFloat(item.shiftStaffRecord.Amount__c || 0);
                        console.log(`      ➕ Added Service Amount__c: ${item.shiftStaffRecord.Amount__c}`);
                    }

                    if (item.shiftStaffRecord.Approval_Status__c === 'Pending') {
                        hasPendingReimbursement = true;
                        console.log(`      ⚠️ Found Pending status in single shiftStaffRecord`);
                    }
                }

                console.log(`   ✅ Final participantExtraAmount: ${participantExtraAmount}`);
                console.log(`   ✅ hasPendingReimbursement: ${hasPendingReimbursement}`);

                return {
                    ...item,
                    slno,
                    participantFullName,
                    ServiceDate,
                    amount,
                    availableFunds,
                    unitprice,
                    Qty__c,
                    uistatus,
                    totalReimbursementAmount,
                    participantExtraAmount,   // 🔹 new field
                    hasPendingReimbursement,  // 🔹 new flag
                    isEditingQty: false,
                    entityName
                };
            });

            console.log('🔹 Finished mapping records');
            console.log('🔹 Records length:', this.records.length);
            console.log(`📊 noRecordsFlag before: ${this.noRecordsFlag}`);
            this.noRecordsFlag = this.records.length > 0 ? false : true;
            console.log(`📊 noRecordsFlag after: ${this.noRecordsFlag}`);

            try {
                console.log('\n✅ Final this.records:', JSON.parse(JSON.stringify(this.records)));
            } catch (err) {
                console.error('❌ Failed to stringify this.records:', err);
            }

        } catch (err) {
            console.error('❌ Error in servicePAginationHelper map():', err, err.stack);
        }

        // --- pagination setup ---
        this.pendingInvoices = this.records.length;
        this.totalRecords = serviceList.length;
        //this.noRecordsFlag = serviceList.length > 0 ? false : true;
        //  this.noRecordsFlag = this.records.length > 0 ? false : true;

        console.log(`📊 pendingInvoices: ${this.pendingInvoices}`);
        console.log(`📊 totalRecords: ${this.totalRecords}`);
        console.log(`📊 noRecordsFlag: ${this.noRecordsFlag}`);

        this.pageSize = this.pageSizeOptions[0];
        console.log(`📊 pageSize set to: ${this.pageSize}`);

        console.log('🔹 Calling paginationHelper()...');
        this.paginationHelper();
        console.log('✅ paginationHelper() call finished.');
    } */

    servicePAginationHelper(serviceList) {
        console.log('🔹 Entered servicePAginationHelper');
        try {
            console.log('✅ Incoming serviceList:', JSON.parse(JSON.stringify(serviceList)));
        } catch (err) {
            console.error('❌ Failed to stringify incoming serviceList:', err);
        }

        try {
            this.records = serviceList.map((item, index) => {
                console.log(`\n🔹 Processing record ${index + 1} with Id=${item.Id}`);

                // --- base fields ---
                const slno = index + 1;
                const participantFullName = item.Client__r?.Name__c || '';
                const ServiceDate = item.Date_of_Service__c
                    ? new Date(item.Date_of_Service__c).toLocaleDateString('en-GB')
                    : '';
                let amount = item.Amount__c != null ? parseFloat(item.Amount__c).toFixed(2) : '0.00';
                const availableFunds = item.Available_Fund__c != null
                    ? parseFloat(item.Available_Fund__c).toFixed(2)
                    : '0.00';
                const unitprice = item.Edited_Unit_Price__c != null
                    ? parseFloat(item.Edited_Unit_Price__c).toFixed(2)
                    : (item.Unit_Price__c != null ? parseFloat(item.Unit_Price__c).toFixed(2) : '0.00');
                const Qty__c = item.Qty__c != null ? parseFloat(item.Qty__c).toFixed(2) : '0.00';
                let uistatus = item.Status__c === 'Not Yet Invoiced' ? 'Pending' : item.Status__c;
                if (item.Status__c === 'Cancelled') {
                    const cancelLabel = item.Bill_Participant__c
                        ?  ' (Billable)'
                        : ' (Non-Billable)';

                    uistatus = uistatus + cancelLabel;
                    amount=item.Cancel_Payment__c != null ? parseFloat(item.Cancel_Payment__c).toFixed(2) : '0.00';
                }

                const totalReimbursementAmount = item.totalReimbursementAmount != null
                    ? parseFloat(item.totalReimbursementAmount).toFixed(2)
                    : '0.00';
                //const entityName = item.Funds_Tracker__r?.Entity_Profile__c || null;
                const fundsTrackerId = item.Funds_Tracker__c || null;
                //const xeroEntityName = item.Funds_Tracker__r?.Xero_Entity__c || null;
                console.log('fundsTrackerId IN servicePAginationHelper : ', fundsTrackerId);
                let entityName = null;

                switch (this.accountingService) {
                    case 'Xero':
                        entityName = item.Funds_Tracker__r?.Xero_Entity__c || null;
                        break;
                    case 'Accounting':
                        entityName = item.Funds_Tracker__r?.Entity_Profile__c || null;
                        break;
                    default:
                        entityName = null; 
                }

                // --- new aggregation logic ---
                let participantExtraAmount = 0;
                let hasPendingReimbursement = false;

                // 🟩 Case 1: multiple Apex records
                if (item.shiftStaffRecords && Array.isArray(item.shiftStaffRecords)) {
                    console.log(`   🔹 Found ${item.shiftStaffRecords.length} shiftStaffRecords`);

                    item.shiftStaffRecords.forEach((rec, idx) => {
                        console.log(`   🔸 shiftStaffRecords[${idx}] =>`, JSON.parse(JSON.stringify(rec)));

                        // Sum up participant-based mileage/service amounts
                        if (rec.Mileage_Bill__c === 'Participant') {
                            participantExtraAmount += parseFloat(rec.Mileage_Amount__c || 0);
                            console.log(`      ➕ Mileage_Amount__c: ${rec.Mileage_Amount__c}`);
                        }

                        if (rec.Service_Amount__c === 'Participant') {
                            participantExtraAmount += parseFloat(rec.Amount__c || 0);
                            console.log(`      ➕ Service Amount__c: ${rec.Amount__c}`);
                        }

                        // Detect pending reimbursement
                        if (rec.Approval_Status__c === 'Pending') {
                            hasPendingReimbursement = true;
                            console.log(`      ⚠️ Pending Approval found`);
                        }
                    });
                }

                // 🟨 Case 2: fallback single object (legacy)
                else if (item.shiftStaffRecord) {
                    console.log(`   🔹 Single shiftStaffRecord:`, JSON.parse(JSON.stringify(item.shiftStaffRecord)));

                    const rec = item.shiftStaffRecord;
                    if (rec.Mileage_Bill__c === 'Participant') {
                        participantExtraAmount += parseFloat(rec.Mileage_Amount__c || 0);
                        console.log(`      ➕ Mileage_Amount__c: ${rec.Mileage_Amount__c}`);
                    }

                    if (rec.Service_Amount__c === 'Participant') {
                        participantExtraAmount += parseFloat(rec.Amount__c || 0);
                        console.log(`      ➕ Service Amount__c: ${rec.Amount__c}`);
                    }

                    if (rec.Approval_Status__c === 'Pending') {
                        hasPendingReimbursement = true;
                        console.log(`      ⚠️ Pending Approval found`);
                    }
                }

                console.log(`   ✅ participantExtraAmount total: ${participantExtraAmount}`);
                console.log(`   ✅ hasPendingReimbursement: ${hasPendingReimbursement}`);

                return {
                    ...item,
                    slno,
                    participantFullName,
                    ServiceDate,
                    amount,
                    availableFunds,
                    unitprice,
                    Qty__c,
                    uistatus,
                    totalReimbursementAmount,
                    participantExtraAmount,   // 🔹 aggregated total
                    hasPendingReimbursement,  // 🔹 flag
                    isEditingQty: false,
                    entityName,
                    fundsTrackerId
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
        this.paginationHelper();
        console.log('✅ paginationHelper() call finished.');
    }


    handleLinkParticipants(){
                         fetchFacilitiess({cname:'',isTrue:false}).then(response=>{
                                // console.log('participant response '+JSON.stringify(response));

                                this.ParticipantOptions=response.filter(rec => (rec.Status__c === true && rec.Facility__r.Status__c===true  &&    this.faclist.includes(rec.Facility__c)) ) // Check for 'Active' status
                                    .map(rec=>{
                                        let riskLevels = rec.Risk_Managements__r?.map(risk => risk.Risk_Index__c) || [];

                                        // Priority Order: Extreme > High > Medium > Low
                                        let riskStatus = "";
                                        if (riskLevels.includes('Extreme')) {
                                            riskStatus = 'Extreme';
                                        } else if (riskLevels.includes('High')) {
                                            riskStatus = 'High';
                                        } else if (riskLevels.includes('Medium')) {
                                            riskStatus = 'Medium';
                                        } // If none of the abov
                                                return {
                                                    value:rec.Id,label:rec.Name__c,
                                                    riskStatus: riskStatus // Include risk level
                                                }
                                        })
                                //  console.log('participantOptions '+JSON.stringify(this.ParticipantOptions));
                                }).catch(error=>{

                  })
                
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
        console.log('this.records in paginationHelper:', JSON.stringify(this.records));
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
       
                const clientId = rec.Client__r?.Id;
                if (!AllServiceListMap.has(clientId)) {
                     AllServiceListMap.set(clientId, []);
                }
                 AllServiceListMap.get(clientId).push(rec);
          
        });
    
        const allKeys = Array.from(AllServiceListMap.keys());
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
  
   /*  handleCheckboxChange(event) {
        const recordId = event.currentTarget.dataset.id;
        const status = event.currentTarget.dataset.status;
        const fundsTrackerId = event.currentTarget.dataset.fundstrackerid;
        console.log('event.currentTarget.checked'+event.currentTarget.checked);
        console.log('recordId'+recordId);
        console.log('status'+status);
        console.log('fundsTrackerId'+fundsTrackerId);
      
    
        if(event.currentTarget.checked){
            this.selectedRecordMap.set(recordId, status);
           //  console.log('this.selectedRecordMap'+this.selectedRecordMap);
        } else {
            this.selectedRecordMap.delete(recordId);
        }
    
        this.checkStatus = Array.from(this.selectedRecordMap.values()).join(',');
    
        if(this.selectedRecordMap.size > 0 && !this.checkStatus.includes('Invoice Generated')) {
            this.disableBool = false;
        } else {
            this.disableBool = true;
        }
       // console.log('selectedRecordMap --> ',JSON.stringify(Array.from(this.selectedRecordMap.entries())) );
       this.accList = this.accList.map(acc => {
        if (recordId === acc.Id) {
            return {
                ...acc,
                isChecked: event.currentTarget.checked
            };
        }
        return acc;
       });
        const allChecked = this.accList.every(acc => acc.isChecked);
        this.isAllSelected = allChecked;
       console.log('this.disableBool  '+this.disableBool);
       console.log('accList --> ',JSON.stringify(this.accList)) ;
    } 

    handleSelectAll(event) {
        const isChecked = event.target.checked;
        console.log(`🔘 handleSelectAll triggered. isChecked: ${isChecked}`);
        this.isAllSelected = isChecked;
        this.selectedRecordMap = new Map(); // Reset map
        console.log('🧹 Cleared selectedRecordMap');
        this.template.querySelectorAll('lightning-input[data-id]').forEach(input => {
            input.checked = isChecked;
            const recordId = input.dataset.id;
            const status = input.dataset.status;
            console.log(`➡️ Checkbox ${recordId} - Status: ${status} - Checked: ${isChecked}`);
            if (isChecked) {
                this.selectedRecordMap.set(recordId, status);
                console.log('this.selectedRecordMap'+this.selectedRecordMap);
            }
        });
    
        this.checkStatus = Array.from(this.selectedRecordMap.values()).join(',');
        console.log(`📄 checkStatus: ${this.checkStatus}`);
        
        if (this.selectedRecordMap.size > 0 && !this.checkStatus.includes('Invoice Generated')) {
            this.disableBool = false;
        } else {
            this.disableBool = true;

        }
        this.accList = this.accList.map(acc => {
                return {
                    ...acc,
                    isChecked: event.currentTarget.checked
                };
           });
    
        console.log('accList'+JSON.stringify(this.accList));
        console.log('this.disableBool  '+this.disableBool);

        console.log(`✅ Updated accList with isChecked: ${isChecked}`);
        console.log(`📌 Selected Record Map:`, Array.from(this.selectedRecordMap.entries()));

    
      //  console.log('All selectedRecordMap --> ',JSON.stringify (Array.from(this.selectedRecordMap.entries())));
    } */

    // Helper: return a Set of selected statuses
getSelectedStatusesSet() {
    return new Set(Array.from(this.selectedRecordMap.values()).map(v => v.status));
}

// Helper: check if any selected has Invoice Generated
hasInvoiceGeneratedSelected() {
    return Array.from(this.selectedRecordMap.values()).some(v => v.status === 'Invoice Generated');
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
handleCheckboxChange(event) {
    const recordId = event.target.dataset.id;
    const status = event.target.dataset.status; // raw status coming from DOM
    const fundsTrackerId = event.target.dataset.fundstrackerid;
    const billRaw = event.target.dataset.bill;
    const bill = billRaw === 'true' || billRaw === true;
    const isChecked = event.target.checked;

    // ---- DEBUG LOGS (very explicit) ----
    console.log('--- handleCheckboxChange START ---');
    console.log('recordId:', recordId);
    console.log('raw status from dataset:', status);
    console.log('fundsTrackerId:', fundsTrackerId);
    console.log('raw bill value from dataset:', billRaw, '-> interpreted bill boolean:', bill);
    console.log('isChecked (user action):', isChecked);
    console.log('selectedRecordMap BEFORE change:', Array.from(this.selectedRecordMap.entries()));

    // Block selecting Cancelled + Non-Billable
    if (isChecked && status === 'Cancelled' && bill === false) {
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
        this.selectedRecordMap.set(recordId, { status, fundsTrackerId, bill });
    } else {
        this.selectedRecordMap.delete(recordId);
    }

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

    const allSameAndAllowed = this.allSelectedStatusesAreSameAndAllowed();
    console.log('allSelectedStatusesAreSameAndAllowed():', allSameAndAllowed);

    // If invalid, only show toast when user was trying to check a box
    if (this.selectedRecordMap.size > 0 && !hasInvoiceGenerated && allSameAndAllowed) {
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

    // Update accList row checked state so UI reflects the change
    this.accList = this.accList.map(acc => acc.Id === recordId ? { ...acc, isChecked } : acc);

    // Update header checkbox state
    this.isAllSelected = this.accList.length > 0 && this.accList.every(acc => acc.isChecked);

    console.log('selectedRecordMap AFTER change:', Array.from(this.selectedRecordMap.entries()));
    console.log('checkStatus:', this.checkStatus);
    console.log('disableBool final:', this.disableBool);
    console.log('--- handleCheckboxChange END ---');
}



/* -------------------------
   Select All handler
   ------------------------- */
handleSelectAll(event) {
    const isChecked = event.target.checked;
    console.log('handleSelectAll -> isChecked:', isChecked);

    this.isAllSelected = isChecked;

    // Rebuild selectedRecordMap according to isChecked. Use accList data (source of truth).
    this.selectedRecordMap = new Map();
    if (isChecked) {
        this.accList.forEach(acc => {
            // If you want to skip rows that are not selectable, add a condition here.
            // e.g. if (!this.isRowSelectable(acc)) return;
            this.selectedRecordMap.set(acc.Id, { status: acc.Status__c, fundsTrackerId: acc.fundsTrackerId });
        });
    }
      if (isChecked) {
        const hasCancelledNonBillable = this.accList.some(acc =>
            acc.Status__c === 'Cancelled' &&
            !(acc.Bill_Participant__c === true ||
              String(acc.Bill_Participant__c).toLowerCase() === 'true')
        );

        if (hasCancelledNonBillable) {
            // block selection
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

            return; // 🚫 STOP here – no further logic
        }
    }

    // update checkStatus string
    this.checkStatus = Array.from(this.selectedRecordMap.values()).map(v => v.status).join(',');

    // Determine disableBool using same rules as single checkbox
    const hasInvoiceGenerated = this.hasInvoiceGeneratedSelected();
    const allSameAndAllowed = this.allSelectedStatusesAreSameAndAllowed();

    if (this.selectedRecordMap.size > 0 && !hasInvoiceGenerated && allSameAndAllowed) {
        this.disableBool = false;
    } else {
        this.disableBool = true;
         this.dispatchEvent(
        new ShowToastEvent({
            title: 'Invalid Selection',
            message: 'Please select records with the same status: either "Pending" or "Cancelled".',
            variant: 'warning',
            mode: 'dismissable'   // or 'dismissable'
        })
    ); 
    }

    // Update accList so the template updates checkboxes via checked={acc.isChecked}
    this.accList = this.accList.map(acc => ({ ...acc, isChecked }));

    console.log('selectedRecordMap (after selectAll):', Array.from(this.selectedRecordMap.entries()));
    console.log('disableBool:', this.disableBool);
}


    handleServiceStaffchange(event) {
        this.partcipantIdList = event.detail.value;
        setTimeout(() => {
            refreshApex(this.wiredResult);
        }, 2000);
       
       
       
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

    /*async handleGenerateInvoice() {
        this.isInvoiceflag=false;
        this.disableBool = false;
        this.showProgressBar = true;
        this.progressValue = 0;
        if (!this.partcipantServicesMap) {
            this.partcipantServicesMap = new Map();
        }
        this.partcipantServicesMap.clear();
    
        this.accList.forEach(rec => {
            if (rec.isChecked == true) {
                const clientId = rec.Client__r?.Id;
                if (!this.partcipantServicesMap.has(clientId)) {
                    this.partcipantServicesMap.set(clientId, []);
                }
                this.partcipantServicesMap.get(clientId).push(rec);
            }
        });
    
        const allKeys = Array.from(this.partcipantServicesMap.keys());
        console.log('✅ All Client IDs (keys):', allKeys);
       // this.partcipantIdList=allKeys;
    
        // ✅ Loop through each client key sequentially
        const result = await getCompanyAndAccountData({ participantIdList: allKeys });
        console.log('✅ Result for participantId', JSON.stringify(result));
        const companyResponse = result.ClientCompany || {};
        const accountResponse = result.AccountList || {};

       const noDataNames = Object.values(companyResponse)
            .filter(value => typeof value === 'string' && value.startsWith("NoData "))
            .map(value => value.replace("NoData ", "").trim());

        if (noDataNames.length > 0) {
            this.disableBool = true;
            this.noDataErrorMessage = noDataNames.join(', ');
          //  console.warn("🚫 Participants with no data:", noDataNames);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Invoice Generation Failed',
                        message: `Company details are missing for the following ${this.participantPreferredName}: ${this.noDataErrorMessage}`,
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
                this.showProgressBar = false;
                this.isInvoiceflag=true;
            return;
        }
        
        let index = 0;
         for (const key of allKeys) {
            console.log('⏳ Fetching for participantId:', key);
    
            try {
                const company = companyResponse[key];
                const accountValue = accountResponse[key] || {};
                console.log('company  ' +JSON.stringify(company));
                console.log('accountValue  ' +JSON.stringify(accountValue));
            
                const participantServices = this.partcipantServicesMap.get(key) || [];
    
                this.salesEntryList = [];
                this.salesEntry = this.emptyAccoutDetails();
                console.log('participantServices >>>>', participantServices);
    
                this.salesEntry = {
                    company: company || null,
                    entryType: "Sales",
                    entityName: participantServices.length > 0 ? participantServices[0].entityName : null,
                    entityProfileId: participantServices.length > 0 ? participantServices[0].entityProfileId : null,
                    InvoiceDate: new Date().toISOString().split('T')[0],
                    PostDate: null,
                    dueDate:null,
                    IncludeGST: "Yes",
                    Status: "Issued",
                    comments: "",
                    participantID: key,
                    ServicesList:'',
                    taxInclusive:true,
                    InvoiceNo:Date.now().toString()
                };
    
                participantServices.forEach((service,index) => {
                    this.addRow(service, accountValue);
                });
                this.salesEntry.ServicesList = participantServices.map(service => service.Id).join(',');
    
                this.recalculateTotals();
                console.log('Sending to Apex for Update:');
                console.log('Sales Entry:', JSON.stringify(this.salesEntry));
                console.log('Sales Entry List:', JSON.stringify(this.salesEntryList));
                console.log('amountarrey : ' + JSON.stringify(this.amountarrey));

                const updateResult = await UpdateDataFromInvoice({
                    salesEntryJson: JSON.stringify(this.salesEntry),
                    salesEntryListJson: JSON.stringify(this.salesEntryList),
                    amountEntryJson: JSON.stringify(this.amountarrey),
                    isRFQ: false,
                    isParticipantInvoice: true
                });
    
                console.log('✅ Updated for participantId', key, JSON.stringify(updateResult));
                const tempInvoiceId = updateResult.Id;  
                console.log('Temporary Invoice ID:', tempInvoiceId);
                await getAccountingInvoiceById({ invoiceId: tempInvoiceId })
                            .then(response => {
                                this.invRecords = response;
                                console.log('Invoice data for PDF:', JSON.stringify(this.invRecords));
                                this.generateBase64Data();
                               // this.generateOldPdf();
                            })
                            .catch(error => {
                                console.error('❌ Error fetching invoice by ID:', JSON.stringify(error));
                            });
              this.progressValue = Math.round(((index + 1) / allKeys.length) * 100);
              index++;
            } catch (error) {
                console.error('❌ Error for participantId', key, error);
                this.showProgressBar = false;
            }
    
            await this.sleep(2000);
            setTimeout(() => {
               refreshApex(this.wiredBulkServicesResult);
                this.isInvoiceflag=true;
                this.showProgressBar = false; 
                this.progressValue = 0;
                this.disableBool = true;
                refreshApex(this.wiredResult); 
            }, allKeys.length *3000)
        }
    }*/


    // async handleGenerateInvoice() {
    //     this.isInvoiceflag = false;
    //     this.disableBool = false;
    //     this.showProgressBar = true;
    //     this.progressValue = 0;

    //     if (!this.partcipantServicesMap) {
    //         this.partcipantServicesMap = new Map();
    //     }
    //     this.partcipantServicesMap.clear();

    //     // group by clientId
    //     this.accList.forEach(rec => {
    //         if (rec.isChecked === true) {
    //             const clientId = rec.Client__r?.Id;
    //             if (!this.partcipantServicesMap.has(clientId)) {
    //                 this.partcipantServicesMap.set(clientId, []);
    //             }
    //             this.partcipantServicesMap.get(clientId).push(rec);
    //         }
    //     });

    //     const allKeys = Array.from(this.partcipantServicesMap.keys());
    //     console.log('✅ All Client IDs (keys):', allKeys);

    //     // fetch company/account data
    //     const result = await getCompanyAndAccountData({ participantIdList: allKeys });
    //     console.log('✅ getCompanyAndAccountData result:', JSON.stringify(result));

    //     const companyResponse = result.ClientCompany || {};
    //     const accountResponse = result.AccountList || {};
    //     console.log('📦 companyResponse:', JSON.stringify(companyResponse));
    //     console.log('📦 accountResponse:', JSON.stringify(accountResponse));


    //     // handle missing data
    //     const noDataNames = Object.values(companyResponse)
    //         .filter(value => typeof value === 'string' && value.startsWith('NoData '))
    //         .map(value => value.replace('NoData ', '').trim());
    //     console.log('🚫 noDataNames:', noDataNames);

    //     this.noDataErrorMessage = noDataNames.join(', ');
    //     console.log('🚫 noDataErrorMessage:', this.noDataErrorMessage);
    //     if (noDataNames.length > 0) {
    //         this.disableBool = true;
    //        // this.noDataErrorMessage = noDataNames.join(', ');
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Invoice Generation Failed',
    //                 message: `Company details are missing for: ${this.noDataErrorMessage}`,
    //                 variant: 'error',
    //                 mode: 'sticky'
    //             })
    //         );
    //         this.showProgressBar = false;
    //         this.isInvoiceflag = true;
    //         return;
    //     }

    //     let index = 0;
    //     for (const key of allKeys) {
    //         console.log('⏳ Processing participantId:', key);

    //         try {
    //             const company = companyResponse[key];
    //             const accountValue = accountResponse[key] || {};
    //             const participantServices = this.partcipantServicesMap.get(key) || [];

    //             console.log('➡️ participantServices:', JSON.stringify(participantServices));

    //             this.salesEntryList = [];
    //             this.salesEntry = this.emptyAccoutDetails();

    //             // --- build SalesEntry with entityProfileId ---
    //             this.salesEntry = {
    //                 company: company || null,
    //                 entryType: 'Sales',
    //                 entityName: participantServices.length > 0 ? participantServices[0].entityName : null,
    //                 entityProfileId: participantServices.length > 0 ? participantServices[0].entityProfileId : null, // 👈 here
    //                 InvoiceDate: new Date().toISOString().split('T')[0],
    //                 PostDate: null,
    //                 dueDate: null,
    //                 IncludeGST: 'Yes',
    //                 Status: 'Issued',
    //                 comments: '',
    //                 participantID: key,
    //                 ServicesList: '',
    //                 taxInclusive: true,
    //                 InvoiceNo: Date.now().toString()
    //             };

    //             // add rows
    //             participantServices.forEach(service => {
    //                 this.addRow(service, accountValue);
    //             });

    //             // services list
    //             this.salesEntry.ServicesList = participantServices.map(s => s.Id).join(',');

    //             this.recalculateTotals();
    //             console.log('📤 Sending to Apex:');
    //             console.log('SalesEntry:', JSON.stringify(this.salesEntry));
    //             console.log('SalesEntryList:', JSON.stringify(this.salesEntryList));

    //             const updateResult = await UpdateDataFromInvoice({
    //                 salesEntryJson: JSON.stringify(this.salesEntry),
    //                 salesEntryListJson: JSON.stringify(this.salesEntryList),
    //                 amountEntryJson: JSON.stringify(this.amountarrey),
    //                 isRFQ: false,
    //                 isParticipantInvoice: true
    //             });

    //             console.log('✅ UpdateDataFromInvoice result:', JSON.stringify(updateResult));

    //             const tempInvoiceId = updateResult.Id;
    //             console.log('Temporary Invoice ID:', tempInvoiceId);

    //             await getAccountingInvoiceById({ invoiceId: tempInvoiceId })
    //                 .then(response => {
    //                     this.invRecords = response;
    //                     console.log('📄 Invoice data for PDF:', JSON.stringify(this.invRecords));
    //                     this.generateBase64Data();
    //                 })
    //                 .catch(error => {
    //                     console.error('❌ Error fetching invoice by ID:', JSON.stringify(error));
    //                 });

    //             this.progressValue = Math.round(((index + 1) / allKeys.length) * 100);
    //             index++;
    //         } catch (error) {
    //             console.error('❌ Error for participantId', key, error);
    //             this.showProgressBar = false;
    //         }

    //         await this.sleep(2000);
    //         setTimeout(() => {
    //             refreshApex(this.wiredBulkServicesResult);
    //             this.isInvoiceflag = true;
    //             this.showProgressBar = false;
    //             this.progressValue = 0;
    //             this.disableBool = true;
    //             refreshApex(this.wiredResult);
    //         }, allKeys.length * 3000);
    //     }
    // }


    async handleGenerateInvoice() {
        this.isInvoiceflag = false;
        this.disableBool = false;
        this.showProgressBar = true;
        this.progressValue = 0;
        try {
            console.log('this.accountingService in handleGenerateInvoice: ',this.accountingService);

            // Assuming `this.selectedInvoiceType` holds value: 'Xero' or 'Accounting'
            if (this.accountingService === 'Tesseract System') {
            await this.handleAccountingInvoiceGeneration();
            } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
                await this.handleXeroInvoiceGeneration();
            }
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
                const clientId = rec.Client__r?.Id;
                if (!this.partcipantServicesMap.has(clientId)) {
                    this.partcipantServicesMap.set(clientId, []);
                }
                this.partcipantServicesMap.get(clientId).push(rec);
            }
        });

        const allKeys = Array.from(this.partcipantServicesMap.keys());
        console.log('✅ All Client IDs (keys):', allKeys);

        // fetch company/account data
        const result = await getCompanyAndAccountData({ participantIdList: allKeys });
        console.log('✅ getCompanyAndAccountData result:', JSON.stringify(result));

        const companyResponse = result.ClientCompany || {};
        const accountResponse = result.AccountList || {};
        console.log('📦 companyResponse:', JSON.stringify(companyResponse));
        console.log('📦 accountResponse:', JSON.stringify(accountResponse));


        // handle missing data
        const noDataNames = Object.values(companyResponse)
            .filter(value => typeof value === 'string' && value.startsWith('NoData '))
            .map(value => value.replace('NoData ', '').trim());
        console.log('🚫 noDataNames:', noDataNames);

        this.noDataErrorMessage = noDataNames.join(', ');
        console.log('🚫 noDataErrorMessage:', this.noDataErrorMessage);
        if (noDataNames.length > 0) {
            this.disableBool = true;
           // this.noDataErrorMessage = noDataNames.join(', ');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invoice Generation Failed',
                    message: `Company details are missing for: ${this.noDataErrorMessage}`,
                    variant: 'error',
                    mode: 'sticky'
                })
            );
            this.showProgressBar = false;
            this.isInvoiceflag = true;
            return;
        }

        let index = 0;
        for (const key of allKeys) {
            console.log('⏳ Processing participantId:', key);

            try {
                const company = companyResponse[key];
                const accountValue = accountResponse[key] || {};
                const participantServices = this.partcipantServicesMap.get(key) || [];

                console.log('➡️ participantServices:', JSON.stringify(participantServices));

                this.salesEntryList = [];
                this.salesEntry = this.emptyAccoutDetails();

                // --- build SalesEntry with entityProfileId ---
                this.salesEntry = {
                    company: company || null,
                    entryType: 'Sales',
                    entityName: participantServices.length > 0 ? participantServices[0].entityName : null,
                    entityProfileId: participantServices.length > 0 ? participantServices[0].entityProfileId : null, // 👈 here
                    InvoiceDate: new Date().toISOString().split('T')[0],
                    PostDate: null,
                    dueDate: null,
                    IncludeGST: 'Yes',
                    Status: 'Issued',
                    comments: '',
                    participantID: key,
                    ServicesList: '',
                    taxInclusive: true,
                   // InvoiceNo: Date.now().toString()
                    InvoiceNo:''
                };

                // add rows
                participantServices.forEach(service => {
                    this.addRow(service, accountValue);
                });

                // services list
                this.salesEntry.ServicesList = participantServices.map(s => s.Id).join(',');

                this.recalculateTotals();
                console.log('📤 Sending to Apex:');
                console.log('SalesEntry:', JSON.stringify(this.salesEntry));
                console.log('SalesEntryList:', JSON.stringify(this.salesEntryList));

                const updateResult = await UpdateDataFromInvoice({
                    salesEntryJson: JSON.stringify(this.salesEntry),
                    salesEntryListJson: JSON.stringify(this.salesEntryList),
                    amountEntryJson: JSON.stringify(this.amountarrey),
                    isRFQ: false,
                    isParticipantInvoice: true
                });

                console.log('✅ UpdateDataFromInvoice result:', JSON.stringify(updateResult));

                const tempInvoiceId = updateResult.Id;
                console.log('Temporary Invoice ID:', tempInvoiceId);

                await getAccountingInvoiceById({ invoiceId: tempInvoiceId })
                    .then(response => {
                        this.invRecords = response;
                        console.log('📄 Invoice data for PDF:', JSON.stringify(this.invRecords));
                        this.generateBase64Data();
                    })
                    .catch(error => {
                        console.error('❌ Error fetching invoice by ID:', JSON.stringify(error));
                    });

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

    async handleXeroInvoiceGeneration() {
        console.log('🚀 handleXeroInvoiceGeneration() STARTED');
        console.log('📦 accList:', JSON.stringify(this.accList));

        if (!this.partcipantServicesMap) {
            this.partcipantServicesMap = new Map();
        }

        this.partcipantServicesMap.clear();
        console.log('🧹 Cleared partcipantServicesMap');

        // ------------------------------------------------------
        // 🔹 Step 1: GROUP SERVICES BY CLIENT ID
        // ------------------------------------------------------
        console.log('📌 Grouping services by participantId...');
        this.accList.forEach(rec => {
            console.log(`➡️ Checking rec: ${rec.Id}, isChecked=${rec.isChecked}`);
            if (rec.isChecked === true) {
                const clientId = rec.Client__r?.Id;
                console.log('🟦 Found checked record → clientId =', clientId);

                if (!this.partcipantServicesMap.has(clientId)) {
                    console.log('🆕 New participant added to map:', clientId);
                    this.partcipantServicesMap.set(clientId, []);
                }

                this.partcipantServicesMap.get(clientId).push(rec);
            }
        });

        const allKeys = Array.from(this.partcipantServicesMap.keys());
        console.log('🧾 Participant Keys:', allKeys);

        
        let index = 0;

        // ------------------------------------------------------
        // 🔹 Step 2: PROCESS EACH PARTICIPANT ONE-BY-ONE
        // ------------------------------------------------------
        for (const key of allKeys) {
            console.log('⏳ Processing participantId:', key);
            console.log('📂 Participant service list:', JSON.stringify(this.partcipantServicesMap.get(key)));

            try {

                const participantServices = this.partcipantServicesMap.get(key) || [];
                console.log(`🟩 Total Services for ${key}:`, participantServices.length);

                // Reset structures
                this.xeroSalesEntryList = [];
                this.xeroSalesEntry = this.xeroEmptyAccoutDetails();

                // ------------------------------------------------------
                // 🔹 Step 3: BUILD MAIN SALES ENTRY
                // ------------------------------------------------------
                console.log('🛠 Building xeroSalesEntry object...');
                this.xeroSalesEntry = {
                    entityName: participantServices.length > 0 ? participantServices[0].entityName : null,
                    entityProfileId: participantServices.length > 0 ? participantServices[0].entityProfileId : null,
                    InvoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: null,
                    Status: 'Issued',
                    participantID: key,
                    ServicesList: '',
                    taxInclusive: false,
                    InvoiceNo: ''
                };

                console.log('🟦 xeroSalesEntry (initial):', JSON.stringify(this.xeroSalesEntry));

                // ------------------------------------------------------
                // 🔹 Step 4: ADD ROWS FOR EACH SERVICE
                // ------------------------------------------------------
                participantServices.forEach(service => {
                    console.log('➕ Adding service to invoice:', JSON.stringify(service));
                    this.addRowForXero(service);
                });

                // Add services list
                this.xeroSalesEntry.ServicesList =
                    participantServices.map(s => s.Id).join(',');

                console.log('📄 ServicesList:', this.xeroSalesEntry.ServicesList);

                // Recalculate totals
                this.recalculateTotalsForXero();
                console.log('🧮 Totals recalculated');
                console.log('🧾 xeroSalesEntry (final):', JSON.stringify(this.xeroSalesEntry));
                console.log('📦 xeroSalesEntryList:', JSON.stringify(this.xeroSalesEntryList));

                // ------------------------------------------------------
                // 🔹 Step 5: SEND TO APEX createUpdateXeroInvoice()
                // ------------------------------------------------------
                console.log('📤 SENDING to Apex → createUpdateXeroInvoice');
                const updateResult = await createUpdateXeroInvoice({
                    salesEntryJson: JSON.stringify(this.xeroSalesEntry),
                    salesEntryListJson: JSON.stringify(this.xeroSalesEntryList),
                    amountEntryJson: JSON.stringify(this.amountarrey),
                    isParticipantInvoice: true
                });

                console.log('✅ Apex createUpdateXeroInvoice RESPONSE:', JSON.stringify(updateResult));

                const tempInvoiceId = updateResult.Id;
                console.log('🆔 Temporary Invoice ID Created:', tempInvoiceId);

                // ------------------------------------------------------
                // 🔹 Step 6: FETCH INVOICE FOR PDF
                // ------------------------------------------------------
                console.log('📥 Fetching full invoice using getAccountingInvoiceByIdXero...');
                await getAccountingInvoiceByIdXero({ invoiceId: tempInvoiceId })
                    .then(response => {
                        console.log('📄 Invoice Data Returned:', JSON.stringify(response));
                        this.invRecords = response;
                        this.generateBase64Data();
                    })
                    .catch(error => {
                        console.error('❌ ERROR fetching invoice for PDF:', JSON.stringify(error));
                    });

                // ------------------------------------------------------
                // 🔹 Step 7: PROGRESS BAR
                // ------------------------------------------------------
                this.progressValue = Math.round(((index + 1) / allKeys.length) * 100);
                console.log(`📊 Progress Updated → ${this.progressValue}%`);

                index++;

            } catch (error) {
                console.error(`❌ ERROR processing participantId ${key}:`, error);
                this.showProgressBar = false;
            }

            // ------------------------------------------------------
            // 🔹 Step 8: WAIT before next iteration
            // ------------------------------------------------------
            console.log('⏸ Waiting 2 seconds before next participant...');
            await this.sleep(2000);

            // ------------------------------------------------------
            // 🔹 Step 9: FINAL CLEANUP (after ALL participants processed)
            // ------------------------------------------------------
            setTimeout(() => {

                console.log('🔄 Final refreshApex & UI Updates starting...');

                refreshApex(this.wiredBulkServicesResultForXero);
                refreshApex(this.wiredResult);

                this.isInvoiceflag = true;
                this.showProgressBar = false;
                this.progressValue = 0;
                this.disableBool = true;

                console.log('🎉 Processing complete for all participants');

            }, allKeys.length * 3000);
        }

        console.log('🏁 handleXeroInvoiceGeneration COMPLETED');
    }

    // Helper sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateBase64Data() {
        console.log('jspdfentered');
            const { jsPDF } = window.jspdf;
            var doc = new jsPDF();
            const invoice = this.invRecords[0];
                console.log('INVOICE RECORDS'+JSON.stringify(invoice));
   
            //var statePostalWithoutCommas = this.invRecords[0].Company__r.Address__c.replace(/,/g, " ");
           
        // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );
       
            doc.setFont("Roboto-Bold", "bold");
            //doc.setFontSize(20);
            //doc.text("DRAFT INVOICE", 20,25 );
            doc.setTextColor(0,102,255);
            doc.setFontSize(12);
            doc.text(this.orgName.toUpperCase(), 10, 25);  
            //console.log('orgname '+this.orgname);    
           console.log('616');
            if (this.accountingService === 'Tesseract System') {
                doc.setTextColor(0,0,0);
                doc.setFont("Roboto-Bold", "bold");
                doc.setFontSize(12);
                doc.text("ABN: "+ invoice.Company__r.ABN__c, 10, 30);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        
            
                doc.setFontSize(10);
                doc.text(invoice.Company__r.Address_Latest__Street__s+",", 10,35 );
                doc.text(`${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`, 10, 40);
                doc.text("Contact: "+invoice.Company__r.Phone_Number__c, 10, 45);
            
            } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
                doc.setTextColor(0,0,0);
                doc.setFont("Roboto-Bold", "bold");
                doc.setFontSize(12);
                doc.text("ABN: "+ invoice.Participant__r.Facility__r.ABN__c, 10, 30);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        
            
                doc.setFontSize(10);
                doc.text(invoice.Participant__r.Facility__r.Address__Street__s+",", 10,35 );
                doc.text(`${invoice.Participant__r.Facility__r.Address__City__s} ${invoice.Participant__r.Facility__r.Address__StateCode__s} ${invoice.Participant__r.Facility__r.Address__PostalCode__s},`, 10, 40);
                doc.text("Contact: "+invoice.Participant__r.Facility__r.Phone__c, 10, 45);
            
            }
   
            
       
            // top  left side box start  
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
        // doc.text("Invoice Number", 150, 24);
            doc.text("TAX  INVOICE", 158, 25);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text(invoice.Name, 158, 30);
   
       
            const oldDate = invoice.Invoice_Date__c;
            const arr = oldDate.split('-');
            const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];      
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Date Issued: "+newDate, 158, 35);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);

            let fileReference='';
            console.log('fileReference  1 '+fileReference );
            console.log('invoice.Participant__r ==> '+invoice.Participant__r );
            if (invoice.Participant__r) {
                //  console.log('invoice.Participant__r ==> '+JSON.stringify(invoice.Participant__r ))
                //  fileReference = invoice.Participant__r.First_Name__c  +' '+ invoice.Participant__r.Last_Name__c ;
                fileReference = invoice.Participant__r.Name__c ? invoice.Participant__r.Name__c : '';
                 console.log('fileReference  1 '+fileReference );
              }
           
            doc.text("TAX INVOICE To: "+fileReference , 10, 72);                  
           
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
            let tabledata = [];
            if (this.accountingService === 'Tesseract System') {
                  tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
                console.log('INVOICE in Accounting '+JSON.stringify(tabledata));
            } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
                  tabledata = this.invRecords[0].Xero_Invoice_Entries__r;
                  console.log('INVOICE in Xero '+JSON.stringify(tabledata));
            }
           
          
           
           tabledata.forEach(record => {
               console.log('record.Service_Cancel_Payment__c : ', record.Service_Cancel_Payment__c);
                    console.log('record.Total_Amount__c : ', record.Total_Amount__c);

                    const isCancelled = record.Service_Cancel__c === true;

                    const qtyValue = isCancelled ? "-" : record.Quantity__c.toFixed(2);

                    const unitPriceValue = isCancelled
                        ? "-"
                        : record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

                    const amountValue = isCancelled
                        ? Number(record.Service_Cancel_Payment__c || 0).toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: 'USD' 
                        })
                        : record.Total_Amount__c.toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: 'USD' 
                        });
                 console.log('amountValue : ', amountValue);
                    // subtotal only adds non-cancel entries OR add canceled payment?  
                    // (Your earlier code added only Total_Amount__c, so follow same logic)
                    subTotal += isCancelled ? Number(record.Service_Cancel_Payment__c || 0) : record.Total_Amount__c;

                    result.push([
                        record.Line_Items__c,
                        record.Description__c,
                        qtyValue,
                        unitPriceValue,
                        record.Tax__c + '%',
                        amountValue
                    ]);
                });

            console.log(' record RESULT'+JSON.stringify(result));
           
            // Adding subtotal, GST, and total rows
            result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "", "", "Sub Total:", '$' + subTotal.toFixed(2)]);
            result.push(["", "", "", "", "Total GST:", '$' + invoice.GST__c.toFixed(2)]);
            result.push(["", "", "", "", "Total:", '$' + invoice.Total_Amount__c.toFixed(2)]);
        console.log('RESULT'+JSON.stringify(result));
            // Generating table using autoTable
            doc.autoTable({
                startY: yPosition, // Starting Y position
                head: [["Support Item","Description", "Qty", "Rate", "Tax", "Amount"]],
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
        if (this.accountingService === 'Tesseract System') {
           objectName = 'AccountingInvoice';
        } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
             objectName = 'XeroInvoice';
        }
        console.log('objectName : ', objectName);
        uploadFile({base64:JSON.stringify( this.base64string), filename:this.invRecords[0].Name+'.pdf', recordId:this.invRecords[0].Id,obj:objectName})
        .then(result=>{
            setTimeout(() => {
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

    const quantity = service.Qty__c;
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
            company: '',
            entryType: 'Sales',
            entityName: null,
            InvoiceDate: '',
            PostDate: '',
           // InvoiceNo: '',
            IncludeGST: '',
            Status: '',
            comments: ''
        }
        return row;
    }
     xeroEmptyAccoutDetails(){
        const row={
           // company: '',
            //entryType: 'Sales',
            entityName: null,
            InvoiceDate: '',
           // PostDate: '',
            InvoiceNo: '',
            //IncludeGST: '',
            Status: '',
            //comments: ''
        }
        return row;
    }
    createRowForXero(service) {
        let gstRate = 0;
        // if (service.GST__c === 'Yes') {
        //     gstRate = 10;
        // }
       
        const quantity =service.Qty__c ;
        const unitPrice = service.unitprice ;
        const subtotal = quantity * unitPrice;
      
        const taxMultiplier = 1 + (gstRate / 100);
      //  console.log('taxMultiplier '+taxMultiplier);
        const taxAmount = parseFloat((subtotal - (subtotal / taxMultiplier)).toFixed(2));
     //   console.log('taxAmount '+taxAmount);
        const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
    //    console.log('totalAmount '+totalAmount);
    
        const newRow = {
            Id: Date.now(),
            sno: this.xeroSalesEntryList.length + 1,
            Description__c: service.Description__c,
            //accountList: accountValue?.Name || '' +' - '+accountValue ?.Account_Number__c || '',
            Quantity__c: quantity,
            UnitPrice__c: unitPrice,
            Amount__c: unitPrice,
            tax: gstRate + '%',
            taxvalue: gstRate + '%',
           // accountItemId: accountValue?.Id || '',
            subTotal: parseFloat(subtotal.toFixed(2)),   // ✅ Subtotal (without tax)
            taxAmount: taxAmount,                        // ✅ Tax extracted
            totalAmount: totalAmount,
             lineItems:service.Lineitem__c                    // ✅ Subtotal + Tax
        };
       // console.log('row ==> '+JSON.stringify(newRow));
        return newRow;
    }
    
    addRowForXero(service) {
        const newRow = this.createRowForXero(service);
        this.xeroSalesEntryList = [...this.xeroSalesEntryList, newRow];
     //   console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
        this.reindexSalesEntryListForXero(); // ensure S.No is always in order
    }
    reindexSalesEntryListForXero() {
        this.xeroSalesEntryList = this.xeroSalesEntryList.map((row, index) => ({
            ...row,
            sno: index + 1
        }));
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
    recalculateTotalsForXero() {
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalAmount = 0;
    
        this.xeroSalesEntryList.forEach(entry => {
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
        this.bulkServices = [];
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
        this.statusService=event.detail.value;
          refreshApex(this.wiredResult);
     }

    enableQtyEdit(event) {
        const recordId = event.currentTarget.dataset.id;
        const status = event.currentTarget.dataset.status;
         this.oldQuantityValue=parseFloat(event.currentTarget.dataset.quantity);
         console.log('oldQuantityValue in enable '+this.oldQuantityValue);
        if (status === 'Invoice Generated') {
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
            acc.Id === recordId ? { ...acc, isEditingQty: false, Qty__c:parseFloat(this.oldQuantityValue).toFixed(2)}: acc
        );

        return;
    }

    // Always fix to 2 decimal places
  //  newValue = parseFloat(newValue).toFixed(2);

    this.accList = this.accList.map(acc =>
        acc.Id === recordId ? { ...acc, Qty__c: newValue } : acc
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
    let fixedQty = parseFloat(record.Qty__c || 0).toFixed(2);

    updateQty({ recordId: recordId, newQty: fixedQty })
        .then(() => {
            this.isShowSpinner = false;

            this.accList = this.accList.map(acc =>
                acc.Id === recordId
                    ? { ...acc, Qty__c: fixedQty, isEditingQty: false }
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
        console.log("🎯 Final selectedStatus:", this.selectedStatus);
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


    updateIssuedPagination() {
        const start = (this.issuedPageNumber - 1) * this.issuedPageSize;
        const end = this.issuedPageNumber * this.issuedPageSize;
        this.issuedPageList = this.issuedRecords.slice(start, end);
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


    /* handleParticipantExtraClick(event) {
        const recordId = event.currentTarget.dataset.id;
        console.log('✅ Clicked record Id:', recordId);

        const record = this.records.find(rec => rec.Id === recordId);

        console.log('✅ Clicked record Id:', record);

        if (record) {
            let breakdownItems = [];

            // Normalize to array
            const shiftRecords = Array.isArray(record.shiftStaffRecord)
                ? record.shiftStaffRecord
                : [record.shiftStaffRecord];

            shiftRecords.forEach(rec => {
                if (rec.Mileage_Bill__c === 'Participant') {
                    breakdownItems.push({
                        label: 'Mileage',
                        details: `${rec.Mileage_Others__c || ''} @ $${rec.Mileage_Amount__c || 0}/km`,
                        amount: rec.Mileage_Amount__c || 0
                    });
                }

                if (rec.Service_Amount__c === 'Participant') {
                    breakdownItems.push({
                        label: 'Service',
                        details: rec.Name || 'Service Charge',
                        amount: rec.Amount__c || 0
                    });
                }
            });


            let formattedDate = '';
            if (record.Date_of_Service__c) {
                const d = new Date(record.Date_of_Service__c);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                formattedDate = `${day}/${month}/${year}`;
            }

            this.selectedRecord = {
                ...record,
                breakdownItems,
                participantExtraAmount: record.participantExtraAmount,
                date: formattedDate,
                participantName: record.Client__r.Name__c
            };

            this.isReimbursementModalOpen = true;
            console.log('🔹 Modal breakdownItems:', JSON.stringify(breakdownItems));
        }
    } */

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
        /* handleAddToXero(event) {
            console.log('handleAddToXero calling:');
            const invoiceId = event.currentTarget.dataset.id;
            console.log('➕ Send to Xero for invoiceId:', invoiceId);
            const invoice = this.recordsBulk.find(inv => inv.Id === invoiceId);

            if (!invoice) {
                console.warn('⚠️ Invoice not found in local list!');
                return;
            }

            // ✅ Restrict if invoice already linked to Xero or marked as disabled
            if (invoice.xeroInvoiceId || invoice.addToXeroClass === 'disabled-xero') {
                console.warn('⚠️ Invoice already added to Xero — skipping API call.');
                this.showToast('Error', 'This invoice is already added to Xero.', 'Error');
                return;
            }

            console.log('')

            // Call Apex
            if (this.accountingService === 'Xero') {
                createInvoiceInXero({ invoiceId: invoiceId }) // pass parameters as object
                    .then((result) => {
                        console.log('✅ Xero creation result:', result);
                        invoice.addToXeroClass = 'disabled-xero';
                        
                        if (this.accountingService === 'Xero') {
                            invoice.addToXeroTitle = 'Already added to Xero';
                        } else if (this.accountingService === 'MYOB') {
                            invoice.addToXeroTitle = 'Already added to MYOB';
                        }


                        this.recordsBulk = [...this.recordsBulk]; // Refresh UI
                        
                        this.showToast('Success', 'Invoice has Created in the Xero', 'success');
                        //this.fetchContactsfromXero();
                    })
                    .catch((error) => {
                        console.error('❌ Error creating Entity in Xero:', error);
                        // Optionally, show error toast
                        invoice.addToXeroClass = '';
                        
                        if (this.accountingService === 'Xero') {
                            invoice.addToXeroTitle = 'Send to Xero';
                        } else if (this.accountingService === 'MYOB') {
                            invoice.addToXeroTitle = 'Send to MYOB';
                        }

                        this.recordsBulk = [...this.recordsBulk];

                    });
            }


            if (this.accountingService === 'MYOB') {
                    const savedToken = sessionStorage.getItem('myobAccessToken');
                    const savedCompanyFileUri = sessionStorage.getItem('companyFileUri');
        
                    console.log("📦 Retrieved Token:", savedToken);
                    console.log("📦 Retrieved Company File URI:", savedCompanyFileUri);
        
                    // ---------------------------------------------------------------
                    // ⭐ 1) CHECK IF TOKEN OR COMPANY FILE URI IS MISSING
                    // ---------------------------------------------------------------
                    if (!savedToken || !savedCompanyFileUri || savedToken === 'undefined' || savedCompanyFileUri === 'undefined') {
                        console.log("🔵 Missing MYOB token or companyFileUri — calling loadAuthLink()");
                        
                        this.loadAuthLink();  // ⬅️ redirect user to authenticate MYOB again
                        return; // ⛔ stop here — do NOT call createMyobTimesheet
                    }
        
                    // ---------------------------------------------------------------
                    // ⭐ 2) BOTH VALUES EXIST → CALL createMyobTimesheet
                    // ---------------------------------------------------------------
                    console.log("🟢 Token & CompanyFileUri found — calling createMyobTimesheet()");
                }
        } */

        handleAddToXero(event) {
            console.log('handleAddToXero calling:');

            const invoiceId = event.currentTarget.dataset.id;
            console.log('➕ Send to Xero/MYOB for invoiceId:', invoiceId);

            const invoice = this.recordsBulk.find(inv => inv.Id === invoiceId);

            if (!invoice) {
                console.warn('⚠️ Invoice not found in local list!');
                return;
            }

            // ---------------------------------------------------------
            // 1️⃣ VALIDATE — PREVENT DOUBLE SUBMISSION
            // ---------------------------------------------------------
            if (invoice.xeroInvoiceId || invoice.addToXeroClass === 'disabled-xero') {
                console.warn('⚠️ Invoice already added — skipping API call.');
                this.showToast('Error', 'This invoice is already added.', 'error');
                return;
            }

            this.showProgressBar = true;

            // ---------------------------------------------------------
            // 2️⃣ XERO INVOICE CREATION
            // ---------------------------------------------------------
            if (this.accountingService === 'Xero') {
                createInvoiceInXero({ invoiceId: invoiceId })
                    .then((result) => {
                        console.log('✅ Xero creation result:', result);

                        invoice.addToXeroClass = 'disabled-xero';
                        invoice.addToXeroTitle = 'Already added to Xero';

                        this.recordsBulk = [...this.recordsBulk];

                        this.showToast('Success', 'Invoice created in Xero successfully!', 'success');
                    })
                    .catch((error) => {
                        console.error('❌ Error creating invoice in Xero:', error);

                        invoice.addToXeroClass = '';
                        invoice.addToXeroTitle = 'Send to Xero';

                        this.recordsBulk = [...this.recordsBulk];

                        this.showToast('Error', error.body?.message || error.message, 'error');
                    })
                    .finally(() => {
                        this.showProgressBar = false;
                    });

                return; // IMPORTANT → Stop here for Xero
            }

            // ---------------------------------------------------------
            // 3️⃣ MYOB INVOICE CREATION
            // ---------------------------------------------------------
            if (this.accountingService === 'MYOB') {
                const savedToken = sessionStorage.getItem('myobAccessToken');
                const savedCompanyFileUri = sessionStorage.getItem('companyFileUri');
                const savedRefresh = sessionStorage.getItem("myobRefreshToken");

                console.log("📦 Retrieved MYOB Token:", savedToken);
                console.log("📦 Retrieved MYOB Refresh:", savedRefresh);
                console.log("📦 Retrieved MYOB Company File URI:", savedCompanyFileUri);

                // 3a — Validate Token + CompanyFileUri
                if (!savedToken || !savedCompanyFileUri ||
                    savedToken === 'undefined' || savedCompanyFileUri === 'undefined') {

                    console.log("🔵 Missing MYOB token or companyFileUri — calling loadAuthLink()");
                    this.loadAuthLink();
                    this.showProgressBar = false;
                    return;
                }
                console.log("🟢 Token & CompanyFileUri found — calling createMyobInvoice()");

                // 3b — Call Apex to create MYOB Invoice
                createMyobInvoice({
                    invoiceId: invoiceId,
                    accessToken: savedToken,
                    refreshToken: savedRefresh,
                    companyFileUri: savedCompanyFileUri
                })
                .then((result) => {
                    console.log('✅ MYOB Invoice creation result:', result);

                    invoice.addToXeroClass = 'disabled-xero';
                    invoice.addToXeroTitle = 'Already added to MYOB';

                    this.recordsBulk = [...this.recordsBulk];

                    this.showToast('Success', 'Invoice created in MYOB successfully!', 'success');
                })
                .catch((error) => {
                    console.error('💥 Error creating invoice in MYOB:', error);

                    invoice.addToXeroClass = '';
                    invoice.addToXeroTitle = 'Send to MYOB';

                    this.recordsBulk = [...this.recordsBulk];

                    this.showToast('Error', error.body?.message || error.message, 'error');
                })
                .finally(() => {
                    this.showProgressBar = false;
                });
            }
        }

          
    async loadAuthLink() {
        console.log('🌀 [Step 4] Fetching MYOB authorization link from Apex...');
    
        try {
            this.loading = true;
            this.currentUrl = window.location.href;
            console.log('currentUrl >>>>', this.currentUrl);
            const result = await getMyobAuthLink({ redirectUrl: this.currentUrl });
            console.log('✅ [Step 4.1] Apex returned MYOB auth link:', result);

            if (result) {
                console.log('🟩 [Step 4.2] Opening MYOB auth page in new tab...');
                // 🔹 Opens MYOB in NEW TAB (not popup)
                const newTab = window.location.href = result;
                if (newTab) {
                    console.log('✅ [Step 4.3] New tab opened successfully:', newTab.location);
                } else {
                    console.warn('⚠️ [Step 4.3] Popup blocker may have prevented new tab.');
                }
            } else {
                console.error('❌ [Step 4.4] No auth link returned from Apex.');
            }
        } catch (error) {
            console.error('❌ [Step 4.5] Error while fetching MYOB auth link:', error);
        } finally {
            this.loading = false;
            console.log('✅ [Step 4.6] loadAuthLink() completed.');
        }
    }

    async exchangeCodeAndCloseTab(code) {
        try {
            this.loading = true;
            console.log('✅ Access code:', code);

            // Load any saved tokens
            const savedAccess  = sessionStorage.getItem("myobAccessToken");
            const savedRefresh = sessionStorage.getItem("myobRefreshToken");
            const savedUri     = sessionStorage.getItem("companyFileUri");
            const savedGuid    = sessionStorage.getItem("myobcompanyFileGuid");

            console.log('savedAccess >>>>>>', savedAccess);
            console.log('savedRefresh >>>>>>', savedRefresh);
            console.log('companyFileUri >>>>>>', savedUri);
            console.log('companyFileGuid >>>>>>', savedGuid);

            this.token          = savedAccess;
            this.refreshToken   = savedRefresh;
            this.companyFileUri = savedUri;
            this.companyFileGuid = savedGuid;

            // STEP 1: No saved tokens → Exchange code
            if (!savedAccess || !savedRefresh || savedAccess === "undefined" || savedRefresh === "undefined") {
                console.log("🔵 No saved tokens — calling Apex token exchange");

                // Generate redirect URL
                const baseUrl = window.location.origin + '/s/';
                const tokenResponse = await exchangeMyobCodeForToken({
                    code: code,
                    redirectUrl: baseUrl
                });

                const tokenData = JSON.parse(tokenResponse);

                this.token = tokenData.access_token;
                this.refreshToken = tokenData.refresh_token;

                console.log('🔐 Access Token:', this.token);
                console.log('🔐 Refresh Token:', this.refreshToken);

                // STEP 2: Get refreshed tokens + company file details
                const companyFilesJson = await getMyobCompanyFiles({
                    accessToken: this.token,
                    refreshToken: this.refreshToken,
                    businessId: this.businessId
                });

                const resp = JSON.parse(companyFilesJson);

                // Update refreshed tokens
                this.token = resp.access_token;
                this.refreshToken = resp.refresh_token;

                console.log('🆕 NEW Access Token:', this.token);
                console.log('🆕 NEW Refresh Token:', this.refreshToken);

                const companyFiles = resp.companyFiles;

                // Validate company file structure
                if (!companyFiles || !companyFiles.CompanyFile) {
                    console.error('❌ No CompanyFile returned from MYOB');
                    return;
                }

                // Correct extraction based on MYOB response
                this.companyFileGuid = companyFiles.CompanyFile.Id;
                this.companyFileUri  = companyFiles.CompanyFile.Uri;

                console.log('🏢 Company File GUID:', this.companyFileGuid);
                console.log('🔗 Company File URI:', this.companyFileUri);

                // Save tokens + company file details
                sessionStorage.setItem('myobAccessToken', this.token);
                sessionStorage.setItem('myobRefreshToken', this.refreshToken);
                sessionStorage.setItem('companyFileUri', this.companyFileUri);
                sessionStorage.setItem('myobcompanyFileGuid', this.companyFileGuid);

            } else {
                console.log("🟢 Saved tokens found — skipping code exchange");
            }

            console.log('Final Access Token:', this.token);
            console.log('Final Refresh Token:', this.refreshToken);
            console.log('Final Company File GUID:', this.companyFileGuid);
            console.log('Final Company File URI:', this.companyFileUri);

            // STEP 3: Fetch Company File Details (needs GUID)
            const companyDetails = await getCompanyFileDetails({
                accessToken: this.token,
                companyFileGuid: this.companyFileGuid
            });

            console.log('🏢 Company File Details:', companyDetails);            

        } catch (error) {
            console.error('❌ Error during MYOB integration flow:', error);
        } finally {
            this.loading = false;
        }
    }
        
}