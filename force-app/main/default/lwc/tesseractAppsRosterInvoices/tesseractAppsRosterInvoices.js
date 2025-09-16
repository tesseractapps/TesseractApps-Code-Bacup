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
            let startYear, endYear;

            if (today.getMonth() < 6) {
                // Before July (months 0–5) → previous financial year
                startYear = today.getFullYear() - 1;
                endYear = today.getFullYear();
            } else {
                // July or later (months 6–11) → current financial year
                startYear = today.getFullYear();
                endYear = today.getFullYear() + 1;
            }

            // Set start date: July 1 of startYear
            this.startDate = `${startYear}-07-01`;

            // Set end date: June 30 of endYear
            this.endDate = `${endYear}-06-30`;


        console.log('startdate'+this.startDate);
        console.log('enddate'+this.endDate);
        console.log('orgid'+this.orgid);
        this.statusService=['Not Yet Invoiced'];
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
            // console.log('calling response raja', JSON.stringify(response));
             this.bank = response.listofPriceBook.Bank__c;
             this.accountNo = response.listofPriceBook.Account_Number__c;
             this.accountName = response.listofPriceBook.Account_Name__c;
             this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
             this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;             
             this.bsb = response.listofPriceBook.BSB__c;
             this.orgName=response.listofPriceBook.Name
             /* this.desc = response.li=tofPriceBook.Description__c; */
            
         });
         refreshApex(this.wiredResult);
         refreshApex(this.wiredBulkServicesResult);
    }
    @track data = [];

    wiredResult;
    debounceTimeout;

    @wire(serviceSupportList, { clientIds: '$partcipantIdList', startDateStr: '$startDate', endDateStr: '$endDate', orgid: '$orgid',name:'$searchKey',status:'$statusService' })
    wiredServiceList(result) {
        this.servicesfromparent=[];
        this.isShowSpinner=true;
        this.wiredResult = result;
        if (result.data) {
               let filterData=result.data.filter(rec => this.faclist.includes(rec.Client__r?.Facility__c));
                this.servicesfromparent = filterData;
                console.log('✅ Filtered data:', JSON.stringify(this.servicesfromparent));
                this.servicePAginationHelper(this.servicesfromparent);
                this.isShowSpinner=false; 
      
        } else if (result.error) {
            console.error('❌ Error:', result.error);
            this.isShowSpinner=false;  
        }
    }

    // Dynamically builds the client ID list from input (for demo: treats search input as single ID)


    @wire(getBulkServicesHandler, { PartcipantIdList: '$partcipantIdList', sDate: '$startDate', eDate: '$endDate', orgid: '$orgid',name:'$searchKey' })
    wiredBulkServices(result) {
        this.wiredBulkServicesResult = result;
        if (result.data) {
            let filterData=result.data.filter(rec =>
                                                      this.faclist.includes(rec.Participant__r?.Facility__c));

                                                        this.recordsBulk = filterData.map(invoice => {
                                                        let fileReference = '';
                                                        //   console.log('invoice.Participant__r '+JSON.stringify(invoice.Participant__r))
                                                        if (invoice.Participant__r) {
                                                        //  console.log('invoice.Participant__r ==> '+JSON.stringify(invoice.Participant__r ))
                                                        fileReference = invoice.Participant__r.Name__c ? invoice.Participant__r.Name__c :''  ;
                                                        //  console.log('fileReference  1 '+fileReference )
                                                        }
                                                    
                                                        return {
                                                            Id: invoice.Id,
                                                            Name: invoice.Name,
                                                            Status__c: invoice.Status__c,
                                                            GST__c: invoice.GST__c,
                                                            Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
                                                            fileReference: fileReference || 'N/A',  // Assign 'N/A' if no company name is found
                                                            invoiceNumber: invoice.Invoice_Number__c,
                                                            amazonUrl: invoice.Amazon_URL__c,
                                                            invoiceDate: invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : ''
                                                        };
                                                    });
                                                 //   console.log('✅ Bulk services data this.recordsBulk: ', JSON.stringify( this.recordsBulk ));
                                                    this.totalRecordsBulk =  this.recordsBulk.length; 
                                                      this.noRecordsInvoiceFlag = this.recordsBulk.length>0 ?false:true;
                                                      console.log('this.noRecordsInvoiceFlag '+this.noRecordsInvoiceFlag);
                                                    this.pageSizeBulk = this.pageSizeOptionsBulk[0]; 
                                                    this.pageNumberBulk = 1;
                                                    this.paginationHelperBulk();
         
           
        } else if (result.error) {
            console.error('❌ Error fetching bulk services:', result.error);
        }
    }
   

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
        this.isShowSpinner=true;
         setTimeout(() => {
          
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
    servicePAginationHelper(serviceList) {
        this.records = [];
        this.records = serviceList.map((item, index) => ({
            ...item,
            slno: index + 1,
            participantFullName: item.Client__r.Name__c ,
            ServiceDate: item.Date_of_Service__c
                ? new Date(item.Date_of_Service__c).toLocaleDateString('en-GB')
                : '',
            amount: item.Amount__c != null ? parseFloat(item.Amount__c).toFixed(2) : 0.00,
            availableFunds: item.Available_Fund__c != null ? parseFloat(item.Available_Fund__c).toFixed(2) : 0.00,
            unitprice: item.Unit_Price__c != null ? parseFloat(item.Unit_Price__c).toFixed(2) : 0.00,
            Qty__c: item.Qty__c != null
                ? parseFloat(item.Qty__c).toFixed(2)
                : '0.00',
            uistatus: item.Status__c === 'Not Yet Invoiced' ? 'Pending Invoice' : item.Status__c,
            isEditingQty: false
        }));
        
        console.log('this.records in serviceSupportList:', JSON.stringify(this.records));
        this.totalRecords = serviceList.length; 
        console.log('this.totalRecords length  ' + this.totalRecords.length);
        this.noRecordsFlag = serviceList.length > 0 ? false : true;
        console.log('this.noRecordsFlag ' + this.noRecordsFlag);
        this.pageSize = this.pageSizeOptions[0]; 
        this.paginationHelper();
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
        let AllServiceListMap = new Map();
    
        this.accList.forEach(rec => {
       
                const clientId = rec.Client__r?.Id;
                if (!AllServiceListMap.has(clientId)) {
                     AllServiceListMap.set(clientId, []);
                }
                 AllServiceListMap.get(clientId).push(rec);
          
        });
    
        const allKeys = Array.from(AllServiceListMap.keys());
         
       
    }
  
    handleCheckboxChange(event) {
        const recordId = event.currentTarget.dataset.id;
        const status = event.currentTarget.dataset.status;
        console.log('event.currentTarget.checked'+event.currentTarget.checked);
        console.log('recordId'+recordId);
        console.log('status'+status);
      
    
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

       console.log('this.disableBool  '+this.disableBool);
///  console.log('accList --> ',JSON.stringify(this.accList)) ;
    } 

    handleSelectAll(event) {
        const isChecked = event.target.checked;
    
        this.selectedRecordMap = new Map(); // Reset map
    
        this.template.querySelectorAll('lightning-input[data-id]').forEach(input => {
            input.checked = isChecked;
            const recordId = input.dataset.id;
            const status = input.dataset.status;
    
            if (isChecked) {
                this.selectedRecordMap.set(recordId, status);
                console.log('this.selectedRecordMap'+this.selectedRecordMap);
            }
        });
    
        this.checkStatus = Array.from(this.selectedRecordMap.values()).join(',');
    
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
    
      //  console.log('All selectedRecordMap --> ',JSON.stringify (Array.from(this.selectedRecordMap.entries())));
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

    async handleGenerateInvoice() {
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

             
    
                this.salesEntry = {
                    company: company || null,
                    entryType: "Sales",
                    entityName: null,
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
                refreshApex(this.wiredResult); 
            }, allKeys.length *3000)
        }
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
   
            doc.setTextColor(0,0,0);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text("ABN: "+ invoice.Company__r.ABN__c, 10, 30);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
       
           
            doc.setFontSize(10);
            doc.text(invoice.Company__r.Address_Latest__Street__s+",", 10,35 );
            doc.text(`${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`, 10, 40);
            doc.text("Contact: "+invoice.Company__r.Phone_Number__c, 10, 45);
            
       
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
                 fileReference = invoice.Participant__r.First_Name__c  +' '+ invoice.Participant__r.Last_Name__c ;
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
           
            let tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
            console.log('INVOICE'+JSON.stringify(tabledata));
            tabledata.forEach(record => {
                subTotal += record.Total_Amount__c;
           
                result.push([
                    record.Line_Items__c,
                    record.Description__c,
                    record.Quantity__c.toFixed(2),
                    record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    record.Tax__c+'%',// Tax column
                    record.Total_Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                ]);
            });
           
           
            // Adding subtotal, GST, and total rows
            result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "", "", "Sub Total:", '$' + subTotal.toFixed(2)]);
            result.push(["", "", "", "", "Total GST:", '$' + invoice.GST__c.toFixed(2)]);
            result.push(["", "", "", "", "Total:", '$' + invoice.Total_Amount__c.toFixed(2)]);
        console.log('RESULT'+JSON.stringify(result));
            // Generating table using autoTable
            doc.autoTable({
                startY: yPosition, // Starting Y position
                head: [["Line_Items__c","Description", "Qty", "Rate", "Tax", "Amount"]],
                body: result,
                theme: "plain",
                /* styles: { halign: "left" }, */
                margin: { left: 10 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
                bodyStyles: { font: "Helvetica", font: "Roboto-VariableFont_wdth,wght", fontStyle: "normal", },
                /* bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] }, */
                columnStyles: {
               /*  0: { cellWidth: 25, halign: "left" }, */
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
   
        uploadFile({base64:JSON.stringify( this.base64string), filename:this.invRecords[0].Name+'.pdf', recordId:this.invRecords[0].Id,obj:'AccountingInvoice'})
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
                    
                }, 3000)
        })            

       
        // doc.save('Invoice.pdf');
        //  console.log('isSalesFlag  in pdf: ', this.isSalesFlag);
        //  console.log('isRFQEnabled in pdf : ', this.isRFQEnabled);
        //  console.log('isInvoiceflag in pdf : ', this.isInvoiceflag);
        //console.log('invoiceflag in pdf : ', this.invoiceflag);
            //return this.base64string;
        }

    generateOldPdf(){
        try {
            // Preparing PDF document using jsPDF (you've already imported jsPDF)
            const { jsPDF } = window.jspdf;
            var doc = new jsPDF();
            const invoice = this.invRecords[0];
            // orgName
            doc.setFontSize(12);
            doc.setFont("Roboto-Bold", "bold");
            doc.setTextColor(0, 102, 255);
            doc.text(invoice.Company__r.Company_Name__c.toUpperCase(), 10, 25);
    
            doc.setTextColor(0, 0, 0);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text("ABN: " + invoice.Company__r.ABN__c, 10, 30);
    
            // Tax Invoice
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text("TAX INVOICE", 160, 25);
    
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);        
            doc.text(invoice.Name, 160, 30);
    
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);  
            console.log('invoice  1 '+JSON.stringify(invoice ));    
            doc.text(invoice.Company__r.Address_Latest__Street__s+",", 10, 35);
            doc.text(`${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`, 10, 40);  // Avoiding commas in address
            doc.text("Contact: " + invoice.Company__r.Phone_Number__c, 10, 45);
            const oldDate = invoice.Invoice_Date__c;
            const arr = oldDate.split('-');
            const newDate = arr[2]+'/'+arr[1]+'/'+arr[0]; 
            let fileReference='';
            if (invoice.Participant__r) {
                //  console.log('invoice.Participant__r ==> '+JSON.stringify(invoice.Participant__r ))
                 fileReference = invoice.Participant__r.First_Name__c  +' '+ invoice.Participant__r.Last_Name__c ;
                 console.log('fileReference  1 '+fileReference );
              }
      
    
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Date Issued: " + newDate, 160, 35);
    
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);        
            doc.text("Reference: "+fileReference, 10, 72);

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
                { title: "Item", dataKey: "Line_Items__c" },    
                { title: "Description", dataKey: "Description__c" },
                { title: "Quantity", dataKey: "Quantity__c" },
                { title: "Unit Price", dataKey: "Unit_Price__c" },
                { title: "Tax", dataKey: "Tax" },
                { title: "Amount", dataKey: "Total_Amount__c" }
            ];

            console.log('🧾 Columns passed to autoTable:', JSON.stringify(columns));
    
            doc.setLineWidth(0.1); // Set border line width to a smaller value
            doc.setFillColor(224, 224, 224); // Background color for cells
            doc.setFontSize(10); // Font size for the text
            doc.setFont("Roboto-VariableFont_wdth,wght", ""); // Font style
    
            // Preparing PDF invoice records
            var result = [];
            var subTotal = 0;
            
            let tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
            console.log('INVOICE'+JSON.stringify(tabledata));
            tabledata.forEach(record => {
                subTotal += record.Total_Amount__c;
            
                result.push([
                    record.Line_Items__c,
                    record.Description__c,
                    record.Quantity__c.toFixed(2),
                    record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    
                    record.Total_Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                ]);
            });
            tabledata=tabledata.map(record => {
                return {
                    ... record,
                    Tax: "No"
                }
                
            })
                    

            doc.autoTable({
                columns: columns,
                body: tabledata,
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
            // Upload the file
            uploadFile({base64:JSON.stringify( this.base64string), filename:this.invRecords[0].Name+'.pdf', recordId:this.invRecords[0].Id,obj:'AccountingInvoice'})
             .then(result=>{
            // console.log('data', result);                    
            //this.handleInvoicFlag();
            // console.log('Upload result = ' +result);
        //   this.fileName = this.invRecords[0].Name + ' - Uploaded Successfully'; 
       /*  setTimeout(() => {
            refreshApex(this.wireInvoiceData);
        }, 2000); */
           })  
    
            // After the file is uploaded, refresh the data
            console.log('Refreshing data after upload...');
    
         
    
            // Show success toast message
            const evt = new ShowToastEvent({
                title: 'Success',
                message: 'Invoice generated successfully.',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
    
            // Refresh other relevant data
           // await refreshApex(this.invoiceTable);
            //await refreshApex(this.accList);
    
            // Disable the flag if necessary
    ;
    
            console.log('PDF generated and uploaded successfully');
        } catch (error) {
            console.error('Error during PDF generation and upload:', error);
            // Handle error as needed (e.g., show error toast)
        }
    } 
   createRow(service, accountValue) {
        let gstRate = 0;
        if (service.GST__c === 'Yes') {
            gstRate = 10;
        }
       // console.log('unitPrice ==> '+accountValue?.Name);
       // console.log('unitPrice ==> '+accountValue ?.Account_Number__c);
       // console.log('unitPrice ==> '+service.Unit_Price__c);
      //  console.log('quantity ==> '+service.Qty__c);
        const quantity =service.Qty__c ;
        const unitPrice = service.Unit_Price__c ;
        const subtotal = quantity * unitPrice;
      //  console.log('quantity '+quantity);
     //   console.log('unitPrice '+unitPrice);
     //   console.log('subtotal '+subtotal);
      
      //  console.log('gstRate '+gstRate);
    
        const taxMultiplier = 1 + (gstRate / 100);
      //  console.log('taxMultiplier '+taxMultiplier);
        const taxAmount = parseFloat((subtotal - (subtotal / taxMultiplier)).toFixed(2));
     //   console.log('taxAmount '+taxAmount);
        const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
    //    console.log('totalAmount '+totalAmount);
    
        const newRow = {
            Id: Date.now(),
            sno: this.salesEntryList.length + 1,
            Description__c: service.Description__c,
            accountList: accountValue?.Name || '' +' - '+accountValue ?.Account_Number__c || '',
            Quantity__c: quantity,
            UnitPrice__c: unitPrice,
            Amount__c: unitPrice,
            tax: gstRate + '%',
            taxvalue: gstRate + '%',
            accountItemId: accountValue?.Id || '',
            subTotal: parseFloat(subtotal.toFixed(2)),   // ✅ Subtotal (without tax)
            taxAmount: taxAmount,                        // ✅ Tax extracted
            totalAmount: totalAmount,
             lineItems:service.Lineitem__c                    // ✅ Subtotal + Tax
        };
       // console.log('row ==> '+JSON.stringify(newRow));
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
        setTimeout(() => {
        
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isModalRelate = false;
        this.isInvoiceflag=false;
        }, 1000);
       

    }
    closeaddPayrollinvoice(){
        this.isModalOpen = false;
        this.isModalRelate = true;
        this.currentUrl = null;
        this.isInvoiceflag=true;
        refreshApex(this.wiredBulkServicesResult);
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

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
      
    

    
}