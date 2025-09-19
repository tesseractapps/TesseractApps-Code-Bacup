import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
//import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingLedgerEntry.getEntityProfiles';
import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
import getIctList from '@salesforce/apex/RoasterManagementHandler.getIctList';
import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
import saveIctInvoiceData from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.saveIctInvoiceData';
import getIctInvoice from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getIctInvoice';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAccountingInvoiceById from '@salesforce/apex/InvoiceHandler.getAccountingInvoiceById';
import autoTable from '@salesforce/resourceUrl/autotable'
import robotoFont from '@salesforce/resourceUrl/Roboto';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import sendEmail from '@salesforce/apex/InvoiceHandler.sendEmailforInvoice';
import My_Resource from "@salesforce/resourceUrl/myResource";


export default class TesseractAppsAccountingIctTimesheetInvoice extends LightningElement {

    @api ictstaffid;
    @api orgid;
    @api invoicerate;
    @api description;
    @api stafffullname;
    @api staffrole;
    @track showICtinvoice=true;
    @track invoiceRowList = [];
    @track ictTimesheet=false;
    @track companyOptions = [];
    @track companyId;
    @track entryNameOptions=[];
    @track selectedEntityName;
    @track invoiceDate;
    @track staffFullname;
    @track staffRole;
    @track ictApprovedHours=0;
    @track invoiceRate;
    @track invoiceStartDate;
    @track invoiceEndDate;
    @track  dateIssued;
    @track orgname;
    @track invoiceNo;
    @track ledgerItems = []; 
    @track invoiceTo;
    @track entryType = 'Sales'; 
    //@track selectedGSTValue='Yes';
    @track selectedOptionAL;
    @track selectedOptionTax;
    @track invoiceTableFlag=true;
    @track invoiceTable = []; 
    @track showtable = false;  
    @track showtableTax = false;  
    @track selectedRowId;
    @track subTotal;
    @track taxAmount;
    @track totalAmount;
    @track comments;
    @track ictInvoiceEntry=true;
    @track accountNo;
    @track bsb;
    @track bank;
    @track accountName;
    @track invRecords=[];
    @track isModalOpen;
     @track taxInclusive=true;
   wiredEntityProfilesTax;
    invoiceIdToDelete;
    @track invoiceDeleteFlag=false;
    wireInvoiceData;
    wiredCompanyList;
    wiredEntityProfilesResult;
    accountList = '';
   // customerShowTable = false;
    FilteredLedgerItems = [];
    customerSelectedAccountId = '';
   @track  activeRowId = '';
    // @track options=[
    //     { label: 'Yes', value: 'Yes' },
    //     { label: 'No', value: 'No' }
    //     ] 
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
    connectedCallback() {
        console.log('orgid in connected callback : '+this.orgid);
        console.log('Invoice Rate:', this.invoicerate);
        console.log('Description:', this.description);
        console.log('Staff Name:', this.stafffullname);
        console.log('staffrole:', this.staffrole);
        this.invoiceRate=this.invoicerate;
        this.staffFullname=this.stafffullname;
        this.staffRole=this.staffrole;
        this.ictStaffID= this.ictstaffid;
        this.taxInclusive = true;
        if (this.description === 'undefined' ) {
            this.description = '';  // Set to empty string if undefined or null
        }
        console.log('Description after:', this.description);
        this.salesEntry = { 
            ...this.salesEntry, 
            ictstaffid:this.ictstaffid,
            staffFullName: this.staffFullname,  
            staffRole:  this.staffRole,
            InvoiceRate: this.invoiceRate,
            description: this.description
        };
        this.addNewInvoiceRow();
        // if(this.selectedGSTValue=='Yes'){
        //     this.invoiceRowList = this.invoiceRowList.map(row => ({
        //         ...row,
        //         selectedOptionTax: '10%' // Only update Quantity__c
        //       }));
        // }
        if(this.taxInclusive){
            this.invoiceRowList = this.invoiceRowList.map(row => ({
                ...row,
                selectedOptionTax: '10%' // Only update Quantity__c
              }));
        }
        this.handleInvoiceData();
        window.addEventListener('click', this.handleOutsideClick);
    }
    disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
    }
     @track listenForOutsideClick = false;
    handleOutsideClick = (event) => {
        if (this.listenForOutsideClick) {
            const dropdownElement = this.template.querySelector('[data-id="taxTableDropdown"]');
            if (dropdownElement && !dropdownElement.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.showtableTax = false;
                this.listenForOutsideClick = false;
            }
            const dropdownElement1 = this.template.querySelector('[data-id="accountListTableDropdown"]');
            if (dropdownElement1 && !dropdownElement1.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.showtable = false;
                this.listenForOutsideClick = false;
            }
        }
    };
     @track salesEntry = {
          company: '',
          entryType: 'Sales',
          entityName: '',
          InvoiceDate: '',
          StaffFullName: '',
          staffRole:  '',
          StartDate:'',
          EndDate: '',
          dateIssued:'',
          InvoiceRate: '',
          InvoiceNo: '',
          AprovedHours:'',
         // selectOption: 'Yes',
           taxInclusive: true,
          description: '',
          comments:''
         
      };
      @track amountarrey = {
        subTotal: '',
        taxAmount: '',
        totalAmount: ''
      };

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
              //this.jsPDFInitialized = true;
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
   handleInvoiceData() {
    // console.log('calling response raja');
     organizationDetails().then(response => {
        // console.log('calling response raja', JSON.stringify(response));
         this.invoiceData = response.listofPriceBook;
         this.bank = response.listofPriceBook.Bank__c;
         this.accountNo = response.listofPriceBook.Account_Number__c;
         this.accountName = response.listofPriceBook.Account_Name__c;
         this.bsb = response.listofPriceBook.BSB__c;
         this.orgname = response.listofPriceBook.Name;
            this.abn = response.listofPriceBook.ABN__c;
         /* this.desc = response.listofPriceBook.Description__c; */
        
     });
 }
    @wire(getCompany, {orgid:'$orgid'})
    wiredCompanies(result) {
        this.wiredCompanyList = result; // Store the wired result for refreshing
        const { data, error } = result;
        if (data) {
            console.log('company options '+JSON.stringify(data));
            this.companyOptions = data.map(company => ({
                label: company.Company_Name__c,
                value: company.Id
            }));
        } else if (error) {
            console.error('Error fetching companies:', error);
        }
    }
    // @wire(getEntityProfiles, {companyId: '$companyId' })
    // wiredEntityProfiles(result) {
    //     this.wiredEntityProfilesResult = result; // Store response for refreshApex
    //     const { data, error } = result;

    //     if (data) {
    //         console.log('Filtered Company options: ', JSON.stringify(data));
    //         this.entryNameOptions = data.map(entity => ({
    //             label: entity.Name__c 
    //                 ? entity.Name__c // Check if Name__c exists, use it
    //                 : `${entity.First_Name__c} ${entity.Last_Name__c}`, // Else fallback to First and Last name
    //             value: entity.Id
    //         }));
    //         this.error = undefined;
    //         console.log('Filtered Company options: ', JSON.stringify( this.entryNameOptions));
    //     } else if (error) {
    //         this.error = error;
    //         console.error('Error fetching entity profiles:', error);
    //     }
    // }
     @wire(getEntityProfiles, {companyId: '$companyId' , entryType:'$entryType' })
    wiredEntityProfiles(result) {
        this.wiredEntityProfilesResult = result; // Store response for refreshApex
        const { data, error } = result;
        console.log('Filtered entity options result: ', JSON.stringify(result));
        if (data) {
            console.log('Filtered entity options: ', JSON.stringify(data));
            this.entryNameOptions = data.map(entity => {
                const name = entity.Name__c
                    ? entity.Name__c
                    : `${entity.First_Name__c || ''} ${entity.Last_Name__c || ''}`.trim();

                // Only return the object if name is not empty
                return name ? { label: name, value: entity.Id } : null;
            })
            .filter(option => option !== null); // Remove null values
            this.error = undefined;
            console.log('Filtered entryNameOptions options: ', JSON.stringify( this.entryNameOptions));
            // if (!this.entryNameOptions.some(option => option.value === 'Add New Entity')) {
            //     this.entryNameOptions.push({ label: ' +  Add New Entity', value: 'Add New Entity' });
            // }
            console.log('Filtered entryNameOptions options after: ', JSON.stringify( this.entryNameOptions));
            
        } else if (error) {
            this.error = error;
            console.error('Error fetching entity profiles:', error);
        }
    }
    // @wire(getEntityProfileTax, { entityId: '$selectedEntityName' })
    // wiredTax(result) {
    //     this.wiredEntityProfilesTax = result; // Store response for refreshApex
    //     const { data, error } = result;
    //     console.log('getEntityProfileTax result: ', JSON.stringify(result));
        
    // //    if (data && (data.tax || data.accountList)) {
    //      if (data && (data.tax || data.accountList)) {
    //         console.log('selectedEntityName :', this.selectedEntityName); 

    //         const tax = data.tax;
    //         const entityAccountList = data.accountList;
    //         const entityItemId = data.accountItemId;
    //         const taxValue = this.appendPercentage(tax);
    //         // this.salesEntryList = this.salesEntryList.map(entry => ({
    //         //     ...entry,
    //         //     tax: taxValue,
    //         //     accountList: entry.accountList ? entry.accountList : (entityAccountList || ''),
    //         //     accountItemId: entry.accountItemId ? entry.accountItemId : entityItemId
    //         // }));
    //         this.invoiceRowList = this.invoiceRowList.map(entry => {
    //             return {
    //                 ...entry,
    //                 selectedOptionTax: taxValue,
    //                 selectedOptionAL: entry.selectedOptionAL ? entry.selectedOptionAL : (entityAccountList || ''),
    //                 accountItemId: entry.accountItemId ? entry.accountItemId : entityItemId
    //             };
    //         });

    //         this.selectedOptionTax = taxValue  || '';
    //         this.selectedOptionAL = entityAccountList || '';
            
    //         console.log('Tax Value in getEntityProfileTax :', this.selectedOptionTax);
    //         console.log('selectedOptionAL in getEntityProfileTax :', this.selectedOptionAL);
    //         console.log(' Sales Entry List in entity:', JSON.stringify(this.invoiceRowList));
    //     } else {
    //         // Handle no data or invalid structure
    //         console.warn('No valid Tax or AccountList received');

    //         // Prevent undefined from propagating
    //         this.selectedOptionTax = '';
    //         this.selectedOptionAL = '';

    //         this.invoiceRowList = this.invoiceRowList.map(entry => ({
    //             ...entry,
    //             selectedOptionTax: '',
    //             selectedOptionAL: '',
    //         }));
    //     }
    // }
    fetchEntityProfileTax(entityId) {
        getEntityProfileTax({ entityId: entityId })
            .then((data) => {
                console.log('getEntityProfileTax result: ', JSON.stringify(data));

                if (data && (data.tax || data.accountList)) {
                    console.log('selectedEntityName :', entityId); 

                    const tax = data.tax;
                    const entityAccountList = data.accountList;
                    const entityItemId = data.accountItemId;
                    const taxValue = this.appendPercentage(tax);

                   this.invoiceRowList = this.invoiceRowList.map(entry => {
                        return {
                            // ...entry,
                            // selectedOptionTax: taxValue,
                            // // ✅ Only override if selectedOptionAL is null or empty string
                            // selectedOptionAL: entry.selectedOptionAL && entry.selectedOptionAL !== '' 
                            //     ? entry.selectedOptionAL 
                            //     : (entityAccountList || ''),
                            // accountItemId: entry.accountItemId && entry.accountItemId !== ''
                            //     ? entry.accountItemId
                            //     : entityItemId
                            ...entry,
                                selectedOptionTax: taxValue,
                                selectedOptionAL: entityAccountList,
                                accountItemId:  entityItemId
                        };
                    });

                    this.selectedOptionTax = taxValue || '';
                    this.selectedOptionAL = entityAccountList || '';

                    console.log('Tax Value in getEntityProfileTax :', this.selectedOptionTax);
                    console.log('selectedOptionAL in getEntityProfileTax :', this.selectedOptionAL);
                    console.log('Sales Entry List in entity:', JSON.stringify(this.invoiceRowList));
                } else {
                    console.warn('No valid Tax or AccountList received');

                    this.selectedOptionTax = '';
                    this.selectedOptionAL = '';

                    this.invoiceRowList = this.invoiceRowList.map(entry => ({
                        ...entry,
                        selectedOptionTax: '',
                        selectedOptionAL: '',
                    }));
                }
            })
            .catch((error) => {
                console.error('Error fetching entity profile tax:', error);
                this.selectedOptionTax = '';
                this.selectedOptionAL = '';
            });
    }
    
    appendPercentage(taxValue) {
        // Assuming taxValue is already a number (like 10 for 10%)
        if (taxValue != null) {
            return `${taxValue}%`; // Append '%' to the number
        }
        return '0%'; // If no tax value, return '0%'
    }
   /*  @wire(getIctInvoice, { sDate: '$invoiceStartDate', eDate: '$invoiceEndDate', companyId: '$companyId',ictInvoiceEntry:'$ictInvoiceEntry' })
    wiredInvoiceData(result) {
        console.error('invoiceStartDate in wiredInvoiceData :', this.invoiceStartDate);
        console.error('invoiceEndDate in wiredInvoiceData :', this.invoiceEndDate);
        console.error('companyId in wiredInvoiceData :', this.companyId);
        this.wireInvoiceData = result;
        const { data, error } = result;
        
        if (data) {
            console.log('data in wiredInvoiceData'+JSON.stringify(data));
            // If data is successfully fetched, store it in invoiceTable and update the table visibility flag
            this.invoiceTable = data.map(list => {
                //let entityName = '';
        
                    // if (list.Accounting_Journal_Entry__r && list.Accounting_Journal_Entry__r.length > 0) {
                    //     const entityProfile = list.Accounting_Journal_Entry__r[0].Entity_Profile__r;
                    //     if (entityProfile) {
                    //         entityName = `${entityProfile.Last_Name__c || ''} ${entityProfile.First_Name__c || ''} ${entityProfile.Name__c || ''}`.trim();
                    //     }
                    // }
        
                    return {
                        Id: list.Id,
                        Name: list.Accounting_Invoices_Expenses__r.Name,
                        Url: list.Accounting_Invoices_Expenses__r.Amazon_URL__c,
                        
                        // description:list.Description__c,
                       // Status__c: list.Status__c,
                        GST__c: list.Accounting_Invoices_Expenses__r.GST__c,
                        Total_Amount__c: list.Accounting_Invoices_Expenses__r.Total_Amount__c,
                        entityName:`${list.Entity_Profile__r.Last_Name__c || ''} ${list.Entity_Profile__r.First_Name__c || ''} ${list.Entity_Profile__r.Name__c || ''}`.trim(), // Assign 'N/A' if no company name is found
                        ledgerItem:list.Accounting_Ledger_Items__r.Name,
                        Issueddate: list.Accounting_Invoices_Expenses__r.Issued_Date__c ? new Date(list.Accounting_Invoices_Expenses__r.Issued_Date__c).toLocaleDateString('en-GB') : '',
                        startdate: list.Accounting_Invoices_Expenses__r.Start_Date__c,
                        enddate: list.Accounting_Invoices_Expenses__r.End_Date__c,
                         //date: list.Start_Date__c ? new Date(list.Start_Date__c).toLocaleDateString('en-GB') : '',
                        // Invoice_Date__c:invoice.Invoice_Date__c ? new Date(invoice.Invoice_Date__c).toLocaleDateString('en-GB') : '',
                    };
                });
            console.log('Invoice data successfully fetched:', JSON.stringify(this.invoiceTable));
        } else if (error) {
            // If there is an error fetching data, handle it by logging or showing an error message
            console.error('Error fetching invoice data:', error);
            this.invoiceTableFlag = false; // Hide the table if no data
        }
    } */
        fetchInvoiceData() {
            console.log('invoiceStartDate in fetchInvoiceData:', this.invoiceStartDate);
            console.log('invoiceEndDate in fetchInvoiceData:', this.invoiceEndDate);
            console.log('companyId in fetchInvoiceData:', this.companyId);
        
            getIctInvoice({
                sDate: this.invoiceStartDate,
                eDate: this.invoiceEndDate,
                companyId: this.companyId,
                ictInvoiceEntry: this.ictInvoiceEntry
            })
            .then(data => {
                if (data) {
                    console.log('data in fetchInvoiceData:', JSON.stringify(data));
                    this.invoiceTable = data.map(list => ({
                        Id: list.Id,
                        Name: list.Accounting_Invoices_Expenses__r?.New_Format_Invoice_No__c,
                        Url: list.Accounting_Invoices_Expenses__r?.Amazon_URL__c,
                        GST__c: list.Accounting_Invoices_Expenses__r?.GST__c,
                        Total_Amount__c: list.Accounting_Invoices_Expenses__r?.Total_Amount__c,
                        entityName: `${list.Entity_Profile__r?.Last_Name__c || ''} ${list.Entity_Profile__r?.First_Name__c || ''} ${list.Entity_Profile__r?.Name__c || ''}`.trim(),
                        ledgerItem: list.Accounting_Ledger_Items__r?.Name,
                        Issueddate: list.Accounting_Invoices_Expenses__r?.Issued_Date__c
                            ? new Date(list.Accounting_Invoices_Expenses__r.Issued_Date__c).toLocaleDateString('en-GB')
                            : '',
                        startdate: list.Accounting_Invoices_Expenses__r?.Start_Date__c,
                        enddate: list.Accounting_Invoices_Expenses__r?.End_Date__c
                    }));
                    console.log('Invoice data successfully fetched:', JSON.stringify(this.invoiceTable));
                }
            })
            .catch(error => {
                console.error('Error fetching invoice data:', error);
                this.invoiceTableFlag = false;
            });
        }
    // You can have a method to refresh the data using `refreshApex`
    fetchInvoices() {
        //refreshApex(this.wireInvoiceData);
        this.fetchInvoiceData();
    }
    handlecloseInvoice(){
        this.showICtinvoice= false;
        //refreshApex(this.ictInvoiceList);
        this.ictTimesheet=true;
    } 
    // handleChange(event) {
    //     const fieldName = event.target.name;
    //     const fieldValue = event.target.value;
      
    //     this.salesEntry = { ...this.salesEntry, [fieldName]: fieldValue };
    //     console.log(`Updated Field - ${fieldName}:`, fieldValue);
    //     console.log('this.salesEntry===>'+JSON.stringify(this.salesEntry));
      
    //     if( fieldName == 'company'){
    //         this.companyId = event.target.value;
    //         refreshApex(this.wiredEntityProfilesResult);
    //     }
    //   }    
      
    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const fieldChecked = event.target.checked;
        const isToggle = event.target.type === 'toggle';
        const valueToSet = isToggle ? fieldChecked : fieldValue;

        // Update salesEntry correctly
        this.salesEntry = {
            ...this.salesEntry,
            [fieldName]: valueToSet
        };
       // this.salesEntry = { ...this.salesEntry, [fieldName]: fieldValue };
        console.log(`Updated Field - ${fieldName}:`, fieldValue);
        console.log('this.salesEntry===>'+JSON.stringify(this.salesEntry));
      
        switch(fieldName) {
            case 'company':
                this.companyId = fieldValue;
                console.log('Selected Company ID:', this.companyId);
                refreshApex(this.wiredEntityProfilesResult);
                break;
            case 'entityName':
                this.selectedEntityName = fieldValue;
                console.log('Selected Entity Name:', this.selectedEntityName);
                this.fetchEntityProfileTax(this.selectedEntityName);
                break;
            case 'InvoiceDate':
                this.invoiceDate = fieldValue;
                console.log('Invoice Date:', this.invoiceDate);
                break;
            case 'StartDate':
                this.invoiceStartDate = fieldValue;
                console.log('Selected  this.invoiceStartDate:',  this.invoiceStartDate);
                break;
            case 'EndDate':
                this.invoiceEndDate = fieldValue;
                console.log('Selected invoiceEndDate:', this.invoiceEndDate);

               // refreshApex(this.wireInvoiceData);
               this.fetchInvoiceData();
                break;
            case 'dateIssued':
                this.dateIssued = fieldValue;
                console.log('Selected dateIssued:', this.dateIssued);
                break;
            case 'comments':
                this.comments = fieldValue;
                console.log('Selected comments:', this.comments);
                break;
        
    
            case 'taxInclusive':
                this.taxInclusive = fieldChecked;
                console.log('🔄 Tax Inclusive:', this.taxInclusive);

                let taxValue = '';
                console.log('Entity:', this.selectedEntityName);
                console.log('Wire Tax:', this.wiredEntityProfilesTax);

                // Decide taxValue
                if (this.taxInclusive && this.selectedEntityName && this.wiredEntityProfilesTax?.data.tax) {
                    taxValue = this.appendPercentage(this.wiredEntityProfilesTax.data.tax);
                    console.log('✅ Tax from cache:', taxValue);
                } else {
                    taxValue = '0%';
                    //this.showtableTax = false;
                    console.log('🚫 Tax Inclusive disabled, using:', taxValue);
                }

                this.selectedOptionTax = taxValue; // Store globally

                // Update each row with new tax and recalculate amounts
                this.invoiceRowList = this.invoiceRowList.map(entry => {
                    const quantity = parseFloat(entry.Quantity__c) || 0;
                    const unitPrice = parseFloat(entry.UnitPrice__c) || 0;
                    const subTotal = parseFloat((quantity * unitPrice).toFixed(2));

                    // Use the assigned tax value per row
                    const taxRateStr = taxValue.replace('%', '');
                    const taxRate = parseFloat(taxRateStr) / 100;

                    let taxAmount = 0;
                    let totalAmount = subTotal;

                    if (this.taxInclusive && !isNaN(taxRate) && taxRate > 0) {
                        const multiplier = 1 + taxRate;
                        const calculatedSubTotal = parseFloat((subTotal / multiplier).toFixed(2));
                        taxAmount = parseFloat((subTotal - calculatedSubTotal).toFixed(2));
                        totalAmount = subTotal;
                    } else if (!this.taxInclusive) {
                        // Tax is excluded: show tax 0 and amount as subtotal
                        taxAmount = 0;
                        totalAmount = subTotal;
                    }

                    return {
                        ...entry,
                        selectedOptionTax: taxValue,
                        calculatedAmount: subTotal,
                        subTotal: subTotal,
                        taxAmount: taxAmount,
                        totalAmount: totalAmount
                    };
                });

                this.showtableTax = false;

                // Aggregate totals
                this.subTotal = this.invoiceRowList.reduce((acc, row) => acc + (row.subTotal || 0), 0).toFixed(2);
                this.taxAmount = this.invoiceRowList.reduce((acc, row) => acc + (row.taxAmount || 0), 0).toFixed(2);
                this.totalAmount = this.invoiceRowList.reduce((acc, row) => acc + (row.totalAmount || 0), 0).toFixed(2);

                console.log('🧾 Final Invoice List:', JSON.stringify(this.invoiceRowList));
                console.log('🧾 SubTotal:', this.subTotal, 'TaxAmount:', this.taxAmount, 'TotalAmount:', this.totalAmount);
                break;

            default:
                console.log('Unknown field:', fieldName);
                break;
        }
        this.fetchQuantity();
    }
   

    fetchQuantity(){
        if(this.invoiceStartDate != undefined &&  this.invoiceEndDate != undefined ){
            console.log('start date before  getIctList'+this.invoiceStartDate);
            console.log('end date  before  getIctList'+  this.invoiceEndDate );
            console.log('staff id  before  getIctList'+  this.ictStaffID );
            getIctList({staffId:this.ictStaffID,StartDate:this.invoiceStartDate,endDate:this.invoiceEndDate }).then(result=>{
             // console.log('ict  time records list'+JSON.stringify(result));
              this.ictInvoiceList =result;
              let approveHours=0;
              result.forEach(ictrec=>{
              let ChildAllocationList=ictrec.Allocations__r;
                  ChildAllocationList.forEach(allocrec=>{
                    if(allocrec.Working_Hours__c){
                      approveHours +=allocrec.Working_Hours__c;
                    }
                    
                  })
              });
              console.log('Approved hours'+approveHours);
              this.ictApprovedHours=approveHours.toFixed(2);
              this.quantityValue=approveHours.toFixed(2);
              this.salesEntry = { 
                ...this.salesEntry, 
                AprovedHours: this.quantityValue  
            };
              console.log('quantityValue'+this.quantityValue);
             
                this.invoiceRowList = this.invoiceRowList.map(row => ({
                  ...row,
                  Quantity__c: this.quantityValue  // Only update Quantity__c
                }));
                console.log('Updated invoiceRowList after getIctList===>', JSON.stringify(this.invoiceRowList));
                if (this.invoiceRowList.length === 1) {
                   // Assuming you have only one row in the list, assign selectedOptionTax to this.selectedOptionTax
                   this.selectedOptionTax = this.invoiceRowList[0].selectedOptionTax;
               }
               console.log('this.selectedOptionTax after getIctList: ' + this.selectedOptionTax);
               if(this.selectedOptionTax ||this.selectedOptionTax===0){
                this.invoiceRowList = this.invoiceRowList.map(sales => {
                    // No need to create a new updatedRecord, we directly update the existing row
                   // sales.selectedOptionTax = `${this.selectedOptionTax}`; // Set the tax rate
            
                    console.log('quantity in updated row:', sales.Quantity__c);
                    console.log('unitprice in updated row:', sales.UnitPrice__c);
                    
                    const quantity = parseFloat(sales.Quantity__c) || 0;
                    const unitPrice = parseFloat(sales.UnitPrice__c) || 0;
                    console.log(`Quantity: ${quantity}, Amount: ${unitPrice}`);
            
                    // Calculating the amount based on quantity and unit price
                    this.subTotal= Math.round(quantity * unitPrice);
                    console.log('Updated this.subTotal:', this.subTotal);
            
                    // ✅ Correcting SubTotal Calculation
                    this.subTotal = parseFloat( this.subTotal.toFixed(2));
                    console.log('subTotal in tax calculation (Sales):', this.subTotal);
                    
                    // // Extract numeric value from the tax rate
                    // let rateMatch = this.selectedOptionTax.match(/\d+(\.\d+)?/);
                    // let newRate = rateMatch ? parseFloat(rateMatch[0]) : 0;
            
                    // console.log('Extracted Rate:', newRate);
            
                    // if (isNaN(newRate) || newRate === 0) {
                    //     console.error('Invalid tax rate:', newRate);
                    //     return sales;
                    // }
            
                    // // Convert to tax multiplier
                    // const taxRate = (newRate / 100) + 1;
                    // console.log('Converted Tax Rate (Sales):', taxRate);
            
                    // // Calculate Taxable Amount
                    // const taxableAmount = this.subTotal / taxRate;
                    // console.log('Taxable Amount (before tax):', taxableAmount);
            
                    // // Calculate Tax Amount
                    // this.taxAmount = parseFloat((this.subTotal - taxableAmount).toFixed(2));
                    // console.log('Tax Amount (Sales):', this.taxAmount);
            
                    // // Update Total Amount (SubTotal + Tax)
                    // this.totalAmount = this.subTotal + this.taxAmount;
                    // console.log('Final Total Amount (Sales):', this.totalAmount);
                    this.calculateTaxTotalAmount();
                    // Return the updated row with tax calculations applied
                    return sales;
                });
            
                console.log('Updated Sales Entry List after tax calculation:', JSON.stringify(this.invoiceRowList));
            }
            }).catch(error=>{
             // console.log('error '+JSON.stringify(error));
            });
           //this.fetchInvoices();
           }
    }
   
    addNewInvoiceRow() {
        const newRow = {
            Id: Date.now().toString(),
            Description__c:this.description ,
            Quantity__c:  '',
            UnitPrice__c: this.invoiceRate,
            Tax__c: '',
            selectedOptionAL: '',  // default text
            selectedOptionTax: ''      // default text
        };
        this.invoiceRowList = [...this.invoiceRowList, newRow];
        console.log('this.invoiceRowList===>'+JSON.stringify(this.invoiceRowList));
    }
    
    handleDropdownPosition(event) {
        console.log('toggleDropdown');
         const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        this.activeRowId =rowId;
        //this.selectedRowId=event.currentTarget.dataset.id;
       
        //console.log('selectedRowId'+this.selectedRowId);
          // Calculate the position of the dropdown button
          console.log('entryType'+this.entryType);
          if( this.entryType==='Sales'){
            this.showtable = !this.showtable;
            console.log('showtable after : '+this.showtable);
             this.fetchLedgerItems(); 
        }
      
        const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
      
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X
        console.log('top==>'+ top + 'left===>'+left);
      
        this.toggleDropdownAccount = `
            position: absolute;
            top: ${top}px;
            left: ${left}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        console.log('this.ledgerItems===>'+JSON.stringify(this.ledgerItems));
        if (this.showtable) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
      }
      toggleDropdownTax(event) {
        console.log('toggleDropdown');
          // Calculate the position of the dropdown button 
          this.showtableTax = !this.showtableTax;
          if(!this.taxInclusive){
              this.showtableTax  = false;
          } 
        console.log('showtable after : '+this.showtableTax);
        //this.fetchLedgerItems(); 

        const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
    
        // Calculate position based on 10% X offset and 2% Y offset
        const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04); // subtract 2% from Y
        const left = rect.left + scrollX - (window.innerWidth * 0.165); // subtract 10% from X
    
        this.taxDropdownStyle = `
            position: absolute;
            top: ${top}px;
            left: ${left}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
          if (this.showtableTax) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }
    // handleSelectionTax(event) {
    //   const recordId = event.currentTarget.dataset.id;
    //   const code = event.currentTarget.dataset.code;
    //   const rate = event.currentTarget.dataset.rate;
    
    //   console.log('Record ID:', recordId);
    //   console.log('Selected Tax Code:', code);
    //   console.log('Tax Rate:', rate);
    
    //   // ✅ Update only the selected row in invoiceRowList
    //   this.invoiceRowList = this.invoiceRowList.map(sales => {
    //       if (String(sales.Id) === this.selectedRowId) {
    //           let updatedRecord = { 
    //               ...sales, 
    //               tax: `${rate}`,
    //               taxvalue: rate
    //           };
    
    //           const totalAmount = parseFloat(updatedRecord.Amount__c) || 0;
    //           const taxRate = parseFloat(rate) / 100;
    
    //           if (!isNaN(taxRate)) {
    //               updatedRecord.taxAmount = parseFloat((totalAmount * taxRate).toFixed(2));
    //               updatedRecord.totalAmount = parseFloat((totalAmount + updatedRecord.taxAmount).toFixed(2));
    //           } else {
    //               console.error('Invalid tax rate:', rate);
    //           }
    
    //           console.log('Updated Tax Amount:', updatedRecord.taxAmount);
    //           console.log('Updated Total Amount:', updatedRecord.totalAmount);
    //           return updatedRecord;
    //       }
    //       return sales;
    //   });
    
    //   this.selectedOptionTax = `${rate}`; // Update UI dropdown
    //   this.showtableTax = false; // Hide dropdown
    //   const newRow = {
    // // default text
    //         selectedOptionTax: this.selectedOptionTax     // default text
    //     };
    // this.invoiceRowList = [...this.invoiceRowList, newRow];
    //   console.log('Updated Sales Entry List:', JSON.stringify(this.invoiceRowList));
    // }
     handleSelectionTax(event) {
        const selectedRowId = event.currentTarget.dataset.id;
        const rate = event.currentTarget.dataset.rate;
    
        console.log('Selected Tax Rate:', rate);
    
        this.invoiceRowList = this.invoiceRowList.map(sales => {
            let updatedRecord = {
                ...sales,
                selectedOptionTax: `${rate}` 
            };
            this.selectedOptionTax = `${rate}`;  
            console.log(' quantity in handleSelectionTax:', updatedRecord.Quantity__c);
            console.log(' unitprice in handleSelectionTax:', updatedRecord.UnitPrice__c);
            const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
            const unitPrice = parseFloat(updatedRecord.UnitPrice__c) || 0;
            console.log(`Quantity: ${quantity}, Amount: ${unitPrice}`);
            this.subTotal = Math.round(quantity * unitPrice);
            console.log('Updated this.subTotal:', this.subTotal);
       
           
                // ✅ Correcting SubTotal Calculation
                this.subTotal = parseFloat(this.subTotal.toFixed(2));
                console.log('subTotal in handleInputChange (Sales):', this.subTotal);
                if(this.selectedOptionTax ||this.selectedOptionTax===0){  
                    this.calculateTaxTotalAmount();
                }
            return updatedRecord;  
        });
        this.showtableTax = false;  
        console.log('Updated Sales Entry List:', JSON.stringify(this.invoiceRowList));
         this.listenForOutsideClick = false;
    }        
   
    calculateTaxTotalAmount(){
         // ✅ Extract numeric value from tax rate
         let rateMatch = this.selectedOptionTax.match(/\d+(\.\d+)?/);
         let newrate = rateMatch ? parseFloat(rateMatch[0]) : 0;
 
         console.log('Extracted Rate:', newrate);
 
         if (isNaN(newrate)) {
             console.error('Invalid tax rate:', newrate);
             return;
         }
 
         // ✅ Convert to tax multiplier
         const taxRate = (newrate / 100) + 1;
         console.log('Converted Tax Rate (Sales):', taxRate);
        const taxableAmount = this.subTotal / taxRate;
        console.log('Taxable Amount (before tax):', taxableAmount);

        // ✅ Calculate Tax Amount correctly
        this.taxAmount = parseFloat((this.subTotal - taxableAmount).toFixed(2));
        console.log('Tax Amount (Sales):', this.taxAmount);

        /* // ✅ Fix NaN issue in subtotal calculation
        this.subTotal = parseFloat((this.totalAmount / taxRate).toFixed(2));
        console.log('SubTotal (Sales):', this.subTotal); */
        this.totalAmount =  parseFloat((this.subTotal + this.taxAmount).toFixed(2));
        console.log('Final Tax Amount (Sales):', this.totalAmount);
        // console.log('this.amountarrey==>'+this.amountarrey);
        // this.amountarrey = {
        //     subTotal: totalSubTotal,
        //     taxAmount: totalTaxAmount,
        //     totalAmount: totalAmount
        // };
        // console.log('amountarrey : ' + JSON.stringify(this.amountarrey));
    }

    handleInputChange(event) {
    const fieldName = event.target.dataset.field;
    const fieldValue = event.target.value;
    const recordId = event.target.dataset.id;
    this.selectedRowId=event.currentTarget.dataset.id;
    
    console.log('Field Name:', fieldName);
    console.log('Field Value:', fieldValue);
    console.log('Record ID:', recordId);
    console.log('this.selectedRowId'+ this.selectedRowId);
    
    // ✅ Update the correct record without modifying other entries
    this.invoiceRowList = this.invoiceRowList.map(sales => {
      console.log('sales.Id'+ sales.Id);
      if (this.selectedOptionTax  ||this.selectedOptionTax===0) {
          let updatedRecord = { ...sales, 
                                [fieldName]: fieldValue 
          };
    
          // ✅ Convert quantity & amount properly
          const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
          const unitPrice = parseFloat(updatedRecord.UnitPrice__c) || 0;
    
          console.log(`Quantity: ${quantity}, Amount: ${unitPrice}`);
    
          // ✅ Correct Multiplication Calculation
          this.subTotal = Math.round(quantity * unitPrice);
          console.log('Updated this.subTotal:',  this.subTotal);
     
         
              // ✅ Correcting SubTotal Calculation
              this.subTotal = parseFloat( this.subTotal.toFixed(2));
              console.log('subTotal in handleInputChange (Sales):', this.subTotal);
    
                this.calculateTaxTotalAmount();
              
          return updatedRecord; 
      }
      return sales;
    });
    
    console.log('Updated Sales Entry List:', JSON.stringify(this.invoiceRowList));
    }
    fetchLedgerItems() {
        console.log('Calling Apex Method: getLedgerItems...');
        console.log('companyId in fetchLedgerItems: ' + this.companyId);

        // Call the Apex method and pass companyId as parameter
        getLedgerItems({ companyId: this.companyId })
            .then(result => {
                console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

                // Process the data and map it to a proper format
                this.ledgerItems = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                }));

                console.log('Processed Ledger Items:', JSON.stringify(this.ledgerItems));
                this.FilteredLedgerItems = this.ledgerItems;
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }
    saveMultipleAccounts(){
        console.log('Sending to Apex:');
        console.log('Sales Entry:', JSON.stringify(this.salesEntry));
       
        this.invoiceRowList = this.invoiceRowList.map(sales => {
            // Assuming you want to update the current row with the new values
            let updatedRecord = { 
                ...sales, // Preserve existing fields in the row
            };
            // Return the updated record
            return updatedRecord;
        });
        console.log('invoiceRowListJson:', JSON.stringify(this.invoiceRowList));
        console.log('ictInvoiceEntry : '+this.ictInvoiceEntry);
        this.amountarrey = {
            subTotal: this.subTotal,
            taxAmount: this.taxAmount,
            totalAmount: this.totalAmount
        };
        console.log('amountarrey : ' + JSON.stringify(this.amountarrey));
        console.log('this.dateIssued  && this.invoiceStartDate && this.invoiceEndDate '+this.dateIssued  +'&&'+this.invoiceStartDate+ '&&' +this.invoiceEndDate )

        if(this.dateIssued  && this.invoiceStartDate && this.invoiceEndDate && this.invoiceRowList[0].selectedOptionAL ){
            let  staffWithDuplicate = [];
            this.invoiceTable.forEach(rec=>{
              staffWithDuplicate.push(rec.startdate+' to '+rec.enddate)
              
            });
            console.log('DUPLICATE'+JSON.stringify(staffWithDuplicate));
            let duplicateFound =false;
            let datesstring=this.invoiceStartDate+' to '+this.invoiceEndDate;
            console.log('DUPLICATE'+datesstring);
            if(staffWithDuplicate.includes(datesstring)){
              duplicateFound=true 
            }
            if( duplicateFound ==false){    
                 
        saveIctInvoiceData({ 
            salesEntryJson: JSON.stringify(this.salesEntry), 
            invoiceRowListJson: JSON.stringify(this.invoiceRowList),
            amountEntryJson: JSON.stringify(this.amountarrey),
            ictInvoiceEntry: this.ictInvoiceEntry
        })
        .then(result => {
            console.log('Journal Entries Created Successfully');
            // Handle success, show success message or refresh UI
            this.showToast('Success', 'Journal entries created successfully.', 'success');
            const tempInvoiceId = result.Id;  
            console.log('Temporary Invoice ID:', tempInvoiceId);
            
            getAccountingInvoiceById({ invoiceId: tempInvoiceId }).then(response => {
                //console.log('data of ', JSON.stringify(response));
                this.invRecords = response;
                console.log('invoice data for pdf ', JSON.stringify(this.invRecords));
                this.generatePDF();
            });
        })
        .catch(error => {
            console.error('Error creating journal entries:', error);
            
            // Check if the error has message and then log or show the message
            if (error.body && error.body.message) {
                this.showToast('Error', error.body.message, 'error');
            } else {
                this.showToast('Error', 'An unknown error occurred while creating journal entries.', 'error');
            }
        });
        console.log('CONSOLE1');
        // this.handleClear();
        setTimeout(() => {
           // refreshApex(this.wireInvoiceData);  
           this.fetchInvoiceData();
        }, 1000);
    } else{
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error',
            message: 'Invoice Already created ',
            variant: 'Error'
          })
        );
  }
    }else{
        // this.dispatchEvent(
        //   new ShowToastEvent({
        //     title: 'Error',
        //     message: 'Please enter Start Date, End Date,Date Issued and  AccountList ',
        //     variant: 'Error'
        //   })
        // );
        // this.accountRecList=[];
        // if (!this.companyId ) {
        //     this.showToast('Error', 'Please select the Company Name.', 'error');
        //     return;
        // }
        // if (!this.selectedEntityName ) {
        //     this.showToast('Error', 'Please select the Entities Name.', 'error');
        //     return;
        // }
        //  if (!this.invoiceDate ) {
        //     this.showToast('Error', 'Please select the Invoice Date.', 'error');
        //     return;
        // }
        // if (!this.invoiceStartDate ) {
        //     this.showToast('Error', 'Please select the Start Date.', 'error');
        //     return;
        // }
        // if (!this.invoiceEndDate ) {
        //     this.showToast('Error', 'Please select the End Date.', 'error');
        //     return;
        // }
        //  if (!this.dateIssued ) {
        //     this.showToast('Error', 'Please select the Due Date.', 'error');
        //     return;
        // }
        if (!this.companyId || !this.selectedEntityName || !this.invoiceDate || !this.invoiceStartDate || !this.invoiceEndDate || !this.dateIssued) {
            this.showToast('Error', 'Please Enter the required fields.', 'error');
            return;
        }

        if (!this.invoiceRowList[0].selectedOptionAL ) {
            this.showToast('Error', 'Please select the Account List.', 'error');
            return;
        }
        //this.accountRecList=[];
      }
       
    }
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
    generatePDF() {
        // console.log('document1 ', this.orgname);  +
          
         const { jsPDF } = window.jspdf;
         var doc = new jsPDF();
         const invoice = this.invRecords[0];
        // var statePostalWithoutCommas = this.statePostal.replace(/,/g, " ");
     
     
         // added for image and organization details
         //doc.addImage(this.orgLogo, "PNG", 120, 25, 70, 18);
         
         //doc.setDrawColor(0);  // Black border
         //doc.setFillColor(255); // White fill
         //doc.roundedRect(20, 230, 90, 50, 3, 3, 'FD'); // Box end---maheswari
     
         doc.setFont("Roboto-Bold", "bold");
         doc.setFontSize(12);
         doc.setTextColor(0,102,255);
        //  doc.text(invoice.Company__r.Company_Name__c.toUpperCase(), 10, 25);
         doc.text(this.orgname.toUpperCase(), 10, 25); 
         doc.setTextColor(0,0,0);
         doc.setFont("Roboto-Bold", "bold");
         //doc.setFont("Arial", "");
         doc.setFontSize(12);
         doc.text("ABN: "+invoice.Company__r.ABN__c, 10, 30);
     
         //doc.setDrawColor(229,229,229);
         //doc.setFillColor(229, 229, 229);
         //doc.rect(125, 27, 75, 30,"FD"); 
         
         doc.setFont("Roboto-Bold", "bold");
         doc.setFontSize(12);
         doc.text("TAX  INVOICE", 134, 25);// 120, 42
         //doc.text("Payable to : ", 25, 237);  /* Adjust hieht of the text --Maheswari */
      
          doc.setFont("Roboto-Bold", "bold");
         doc.setFontSize(12);
         doc.text(invoice.Name, 134, 30);//120, 53
        
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         doc.setFontSize(10);
         doc.text(invoice.Company__r.Address_Latest__Street__s+",", 10, 35);
         doc.text(`${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`, 10, 40);
         doc.text("Contact: "+invoice.Company__r.Phone_Number__c, 10, 45);
     
         const oldDate = invoice.Invoice_Date__c;
         const arr = oldDate.split('-');
         const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];
       
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         doc.setFontSize(10);
         doc.text("Date Issued: "+newDate, 134, 35);//120,58
     
         const oldsDate = invoice.Start_Date__c;
         const sarr = oldsDate.split('-');
         const newsDate = sarr[2]+'/'+sarr[1]+'/'+sarr[0];
     
         const oldeDate = invoice.End_Date__c;
         const earr = oldeDate.split('-');
         const neweDate = earr[2]+'/'+earr[1]+'/'+earr[0];
     
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         doc.setFontSize(10);
         doc.text("Billing Period: "+newsDate+" to "+neweDate, 134, 40);//120, 63

         const dueDate = invoice.Issued_Date__c;
         const darr = dueDate.split('-');
         const DueDate = darr[2]+'/'+darr[1]+'/'+darr[0];
       
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         doc.setFontSize(10);
         doc.text("Due Date: "+DueDate, 134, 45);
         
         doc.setFontSize(10);
        //c/accountExpense doc.text("TAX INVOICE To: " + invoice.Staff__r.Name, 10, 72);
        doc.text("TAX INVOICE To: " + invoice.Staff__r.Invoice_To__c, 10, 72);
         //doc.text(this.invRecords[0].Invoice_Parent__r.Staff__r.Invoice_To__c, 20, 89); 
       
         doc.setDrawColor(0);  
         doc.setFillColor(255, 255, 255);
        /*  doc.roundedRect(20, 220, 70, 28, 0, 0, 'FD');  */
     
         //doc.setDrawColor(0);  // Black border
         //doc.setFillColor(255); // White fill
         //doc.roundedRect(20, 220, 70, 30, 3, 3, 'FD'); // Box end---maheswari  20, 220, 90, 50, 3, 3, 'FD'
         doc.setDrawColor(0, 0, 0); // Black color
         doc.setLineWidth(0.5);
         doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
         doc.line(10, 222, 200, 222); // (startX, startY, endX, endY)
         doc.setLineDash();
         doc.setFontSize(10);
         doc.setFont("Roboto-Bold", "bold");
         doc.text("Payable to", 10, 226); // Text before the variable
         
         doc.setFont("Roboto-Bold", "bold");
         doc.text("Bank", 10, 232);
         doc.text(":", 40, 232); // Text before the variable
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal"); // Set font to bold for the variable
         if(this.bank){
           doc.text(this.bank, 42, 232);
         }else{
           doc.text(" ", 42, 232);
         }
         doc.setFont("Roboto-Bold", "bold");
         doc.text("Account Name", 10, 236); 
         doc.text(":", 40, 236);
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal"); 
         if(this.accountName){
           doc.text(this.accountName, 42, 236);
         }else{
           doc.text(" ", 42, 236);
         }
         doc.setFont("Roboto-Bold", "bold");
         doc.text("BSB", 10, 240); 
         doc.text(":", 40, 240);
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         if(this.bsb){
           doc.text(this.bsb, 42, 240);
         }else{
           doc.text(" ", 42, 240);
         }
         doc.setFont("Roboto-Bold", "bold");
         doc.text("Account Number", 10, 244);
         doc.text(":", 40, 244);
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         if(this.accountNo){
           doc.text(" "+this.accountNo, 41, 244);
         }else{
           doc.text(" ", 41, 244);
         }
         doc.setFontSize(10);
         doc.setFont("Roboto-Bold", "bold");
         doc.text("Terms & Conditions:", 10, 260);
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         doc.setTextColor(169, 169, 169);
         doc.text("All terms and conditions apply.", 10, 264);
         
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         doc.setFontSize(11);
        // console.log('invRecords of ', JSON.stringify(this.invRecords));
        doc.setTextColor(0, 0, 0);
         //footer text
         /* doc.setFont("Times New Roman", "");
         doc.setFontSize(11);
         doc.text("Office Use Only", 90, 290); */
         
        console.log('invRecords of ', JSON.stringify(this.invRecords));
         // var generateData = function(amount) {
           var result = [];
           var subTotal = 0;
           
           let tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
           console.log('INVOICE'+JSON.stringify(tabledata));
           tabledata.forEach(record => {
               subTotal += record.Total_Amount__c;
           
               result.push([
                   record.Description__c,
                   record.Quantity__c.toFixed(2),
                   record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                   record.Tax__c+'%', // Tax column
                   record.Total_Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
               ]);
           });
           
           
           // Adding subtotal, GST, and total rows
           result.push([{ content: "*Taxes are Exclusive", styles: { textColor: [128, 128, 128] } }, "", "","Sub Total:", '$' + subTotal.toFixed(2)]);
           result.push(["", "", "", "Total GST:", '$' + invoice.GST__c.toFixed(2)]);
           result.push(["", "", "", "Total:", '$' + invoice.Total_Amount__c.toFixed(2)]);
          
           // Generating table using autoTable
           doc.autoTable({
               startY: 88, // Starting Y position
               head: [["Description", "Qty", "Rate", "Tax", "Amount"]],
               body: result,
               theme: "plain",
               /* styles: { halign: "left" }, */
               margin: { left: 10, right: 10 },
               headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
               bodyStyles: { font: "Roboto-VariableFont_wdth,wght",  fontStyle: "normal", },
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
           
           });
           
           addFooter(doc);
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
             
             doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); // A
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
         
           
           // console.log('if this.message.allProducts type reddy table');
         //adding new page => praveen
          doc.addPage("a4","portrait");
           let startY = 15; 
           let margin = 10; // Set the left margin
           let maxWidth = doc.internal.pageSize.width - 2 * margin; // Calculate the maximum width
     
       this.ictInvoiceList.forEach(rec=>{ 
         
         
           let startAndEndDate = new Date(rec.Week_Start_Date__c).toLocaleDateString('en-GB')+ ' to ' +new Date( rec.Week_end_Date__c).toLocaleDateString('en-GB');
          
           var ictTable = [];
           var data = {};
           let allocationMapData = new Map()
           let ictAllocations=[];
           let approveHours=0;
           ictAllocations=rec.Allocations__r;
          
          // console.log('allocation for each week '+JSON.stringify(ictAllocations));
           if (ictAllocations && ictAllocations.length > 0){
           ictAllocations.forEach(allorec=>{
             allocationMapData.set(allorec.Day_name__c,allorec);
             if(allorec.Working_Hours__c)
               approveHours +=allorec.Working_Hours__c;
              });
           console.log('allocation  map '+ JSON.stringify(allocationMapData));
          // console.log('map get '+ JSON.stringify(allocationMapData.get('Monday')));
           }  
     
           let dayList=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
           let dayWithDates = new Map()
           dayList.forEach((day, index)=>{
            if (rec.Week_Start_Date__c) {
             let newDate=new Date(rec.Week_Start_Date__c) ;
             newDate.setDate(newDate.getDate()+index);
             dayWithDates.set(day,newDate);
             } 
            });
            // console.log('daysWithdates =>'+JSON.stringify(dayWithDates));
            // console.log('map get date'+ JSON.stringify(dayWithDates.get('Thursday')));
           dayList.forEach(day => {
             let data = [];
             if (allocationMapData.has(day)) {
                 data.push(day+'\n' + new Date(allocationMapData.get(day).Start_Date__c).toLocaleDateString('en-GB'));
                 data.push(allocationMapData.get(day).Start_Time_Formula__c);
                 data.push(allocationMapData.get(day).End_Time_Formula__c);
                 if(allocationMapData.get(day).Break_Start_Time_Formula__c && allocationMapData.get(day).Break_End_Time_Formula__c ){
                   data.push(allocationMapData.get(day).Break_Start_Time_Formula__c+'-'+allocationMapData.get(day).Break_End_Time_Formula__c);
                 }else{
                   data.push('-');
                 }
                 if(allocationMapData.get(day).Break_Start_Time2_Formula__c && allocationMapData.get(day).Break_End_Time2_Formula__c ){
                   data.push(allocationMapData.get(day).Break_Start_Time2_Formula__c+'-'+allocationMapData.get(day).Break_End_Time2_Formula__c);
                 }else{
                   data.push('-');
                 }
                 if(allocationMapData.get(day).Break_Start_Time3_Formula__c && allocationMapData.get(day).Break_End_Time3_Formula__c ){
                   data.push(allocationMapData.get(day).Break_Start_Time3_Formula__c+'-'+allocationMapData.get(day).Break_End_Time3_Formula__c);
                 }else{
                   data.push('-');
                 }
                 data.push(allocationMapData.get(day).Break__c);
                 data.push(allocationMapData.get(day).Working_Hours__c);
             } else {
                 data.push(day+'\n' + dayWithDates.get(day).toLocaleDateString('en-GB'));
                 data.push('-');
                 data.push('-');
                 data.push('-');
                 data.push('-');
                 data.push('-');
                 data.push('-');
                 data.push('-');
             }
             ictTable.push(data);
             });
            
             ictTable.push(["Total Hours", "", "", "","", "","", approveHours]);
            // ictTable.push(["Total Hours", "", "", "", rec.Total_Duration__c]);
          // console.log('table data'+JSON.stringify(ictTable));
         let availableSpace = doc.internal.pageSize.height - (startY + 10); // Calculate available space on the page
         let tableHeight = ictTable.length * 15; // Assuming each row has a height of 15
         if (availableSpace > tableHeight + 40) { // Check if there's enough space to fit both the table and additional text
               doc.setFont("Roboto-Bold", "bold");
               doc.setFontSize(10);
              // doc.text("Email Subject:TimeSheet Approval For "+this.staffFullname+' '+rec.Name+' from ' + startAndEndDate, 15, startY);
               const subjectText = "Email Subject: Timesheet Approval for " + this.staffFullname + ' ' + rec.Name + ' from ' + startAndEndDate;
               const subjectLines = doc.splitTextToSize(subjectText, maxWidth); // Split text into multiple lines
             
               doc.text(subjectLines, margin, startY); // Use the split text
               startY += subjectLines.length * 5+5; // Adjust startY based on the number of lines
               doc.text('Timesheet(s)', margin, startY);
              
               doc.autoTable( {
               
               startY: startY + 2,
               columnStyles: {
                0: { cellWidth: 24 },  // "Days" column
                1: { cellWidth: 20 },  // "StartTime" column
                2: { cellWidth: 20 },  // "EndTime" column
                3: { cellWidth: 32 },  // "Break 1" column
                4: { cellWidth: 32 },  // "Break 2" column
                5: { cellWidth: 32 },  // "Break 3" column
                6: { cellWidth: 15 },  // "Break" column
                7: { cellWidth: 15 }   // "Hours" column
                  },
             margin: { left: 10, right: 10 },
               theme:'grid',
               headStyles: { fillColor: [169, 169, 169],textColor: [255, 255, 255], font: "Roboto-Bold", fontStyle: "bold", halign: 'center', fontSize: 8, },
               bodyStyles: { font: "Roboto-VariableFont_wdth,wght",  fontStyle: "normal", fontSize: 8, },
               head: [["Days", "Start Time", "End Time","Break 1","Break 2","Break 3" ,"Break (mins)", "Hours"]],
               //  body:ictTable
                 body: ictTable.map(row => row.map(cell => ({content: cell, styles: {halign: 'center'}})))
               });
               doc.setFontSize(10);
              // console.log('last modified date and time '+ this.formatDateTime(rec.LastModifiedDate));
               doc.text("Approved Date and Time: "+this.formatDateTime(rec.LastModifiedDate), 10, doc.autoTable.previous.finalY + 10);
               const approvedByText = "Approved By: " + rec.Approver_Name__c;
               const approvedByWidth = doc.getTextWidth(approvedByText);
  
              // Calculate the position dynamically to align to the right margin
              const pageWidth = doc.internal.pageSize.width; // Get the page width
              const rightMargin = 10; // Set the margin from the right side
              const approvedByX = pageWidth - approvedByWidth - rightMargin; // Position the text to the right
  
              // Draw the "Approved By" text
              doc.text(approvedByText, approvedByX, doc.autoTable.previous.finalY + 10);
  
               //doc.text("Approved by: "+rec.Approver_Name__c,135, doc.autoTable.previous.finalY + 10);
               startY = doc.autoTable.previous.finalY + 20; 
               addFooter(doc);
           }else{
               doc.addPage();
               doc.setFont("Roboto-Bold", "bold");
               doc.setFontSize(10);
               startY= 15;
               //doc.text("Email Subject:TimeSheet Approval For "+this.staffFullname+' '+rec.Name+' from ' + startAndEndDate, 15, startY);
               const subjectText = "Email Subject: Timesheet Approval for " + this.staffFullname + ' ' + rec.Name + ' from ' + startAndEndDate;
               const subjectLines = doc.splitTextToSize(subjectText, maxWidth); // Split text into multiple lines
               doc.text(subjectLines, margin, startY); // Use the split text
               startY += subjectLines.length * 5+5; // Adjust startY based on the number of lines
               doc.text('Timesheet(s)', margin, startY);
               doc.autoTable( {
               startY:startY + 2,
               columnStyles: {
                0: { cellWidth: 24 },  // "Days" column
                1: { cellWidth: 20 },  // "StartTime" column
                2: { cellWidth: 20 },  // "EndTime" column
                3: { cellWidth: 32 },  // "Break 1" column
                4: { cellWidth: 32 },  // "Break 2" column
                5: { cellWidth: 32 },  // "Break 3" column
                6: { cellWidth: 15 },  // "Break" column
                7: { cellWidth: 15 }   // "Hours" column
                  },
               margin: { left: 10, right: 10 },
               theme:'grid',
               headStyles: { fillColor: [169, 169, 169],textColor: [255, 255, 255], font: "Roboto-Bold", fontStyle: "bold", halign: 'center', fontSize: 8, },
               bodyStyles: { font: "Roboto-VariableFont_wdth,wght",  fontStyle: "normal", fontSize: 8, },
               head: [["Days", "Start Time", "End Time","Break 1","Break 2","Break 3" ,"Break (mins)", "Hours"]],
              // bodyStyles: { font: "Roboto-VariableFont_wdth,wght",  fontStyle: "normal", },
               //  body:ictTable
               body: ictTable.map(row => row.map(cell => ({content: cell, styles: {halign: 'center'}})))
               });
               doc.setFontSize(10);
               doc.text("Approved Date and Time: "+this.formatDateTime(rec.LastModifiedDate), 10, doc.autoTable.previous.finalY + 10);
               const approvedByText = "Approved By: " + rec.Approver_Name__c;
               const approvedByWidth = doc.getTextWidth(approvedByText);
  
              // Calculate the position dynamically to align to the right margin
              const pageWidth = doc.internal.pageSize.width; // Get the page width
              const rightMargin = 10; // Set the margin from the right side
              const approvedByX = pageWidth - approvedByWidth - rightMargin; // Position the text to the right
  
              // Draw the "Approved By" text
              doc.text(approvedByText, approvedByX, doc.autoTable.previous.finalY + 10);
  
               /* doc.text("Approved By: "+rec.Approver_Name__c, 135, doc.autoTable.previous.finalY + 10); */
               startY = doc.autoTable.previous.finalY + 20; 
               addFooter(doc);
     
           }
         });  
        
         
         this.base64string = btoa(doc.output());
        // console.log('if this.message.allProducts type reddy table');
        this.showSpinner = true;
         //var docName=this.invRecords[0].Invoice_Parent__r.Name+'.pdf';
        // console.log('docName>',docName);
        uploadFile({base64:JSON.stringify( this.base64string), filename:this.invRecords[0].Name+'.pdf', recordId:this.invRecords[0].Id,obj:'AccountingInvoice'})
         .then(result=>{
            // console.log('data', result);                    
            // console.log('Upload result = ' +result);
            // this.fileName = this.fileName + ' - Uploaded Successfully'; 
         })            
         const evt = new ShowToastEvent({
             title: 'Success',
             message: 'Invoice Generated sucessfully ',
             variant: 'success',
             mode: 'dismissable'
         });
        // this.handlecloseInvoice();
         this.dispatchEvent(evt);
        setTimeout(() => {
                 this.fetchInvoices();
                this.showSpinner = false;
         }, 3000); 
         this.accountRecList=[];
     }
     @track invoiceEmailFlag = false;
     @track url;
     @track invoiceIdforEmail;
     handleRowAction(event) {
      const actionName = event.currentTarget.getAttribute('name');
      const row = event.currentTarget.getAttribute('data-id');
      const url1 = event.currentTarget.getAttribute('data-url');
      console.log('url1 >>',url1);
      console.log('actionName >>',actionName);
      this.url = url1;
      this.invoiceIdforEmail = row;
           console.log('row id'+row.Id);
            switch (actionName) {
                case 'delete':
                  this.invoiceDeleteFlag = true;
                  this.invoiceIdToDelete = row; 
                  console.log('row id'+this.invoiceIdToDelete);
                    break;
                 case 'view_details':
                    event.preventDefault(); 
                    this.invoiceDeleteFlag = false;
                    const url = url1;
                    this.currentUrl = url;
                    this.isHome=false;
                    this.showICtinvoice=false;
                    console.log('file url  '+ this.currentUrl);  
                   this.isModalOpen = true;
                 break;
                
                case 'email':
                   this.invoiceEmailFlag = true; 
            }    
      }
      handledelete(event){
        
          deleteRecord(this.invoiceIdToDelete).then(() => {
            this.dispatchEvent(
              new ShowToastEvent({
                title: 'Success',
                message: 'Invoice has been deleted',
                variant: 'success'
              })
            );
            //this.fetchInvoices();
           // refreshApex(this.wireInvoiceData);  
           this.fetchInvoiceData();
          }).catch(error => {
           // console.log('error=>'+JSON.stringify(error));
          });
          this.invoiceDeleteFlag = false;
    
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
      handledeleteclose(event){
        this.invoiceDeleteFlag = false;
      }   
      closeaddPayrollinvoice(){
        this.isModalOpen = false;
        this.currentUrl = null;
        this.showICtinvoice=true;
    } 
     handleCustomerSearch(event) {
        //const rowId = event.target.dataset.id;
        const recordId = event.currentTarget.dataset.id;   
        const inputValue = event.target.value;
        const searchLower = inputValue.toLowerCase();
        const rowId = event.target.dataset.id;
    // const rowId = this.activeRowId;
        console.log('Search Row ID:', rowId, 'Input:', inputValue);

        // this.salesEntryList = this.salesEntryList.map(sales => {
        //         if (sales.Id == rowId) {  // Directly checking with sales.Id
        //             return { 
        //                 ...sales, 
        //                 accountList: inputValue
                    
        //             };
        //         }
        //         return sales;
        //     });
        this.invoiceRowList = this.invoiceRowList.map(sales => {
                if (sales.Id == rowId) {  // Directly checking with sales.Id
                    return { 
                        ...sales, 
                       selectedOptionAL: inputValue
                    
                    };
                }
                return sales;
            });

        // Filter ledger items
        const filtered = this.ledgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            return accNo.includes(searchLower) || itemName.includes(searchLower) || combined.includes(searchLower);
        });

        console.log('Filtered Items:', filtered);

        this.FilteredLedgerItems = filtered;
        this.activeRowId = rowId;
        this.customerShowTable = true;
    }
    
    handleSelection(event) {
        const recordId = event.currentTarget.dataset.id; // ID of the clicked row
        const accountNumber = event.currentTarget.dataset.accno; // Account Number
        const accountValue = event.currentTarget.dataset.value; // Account Name
        //this.selectedRowId=event.currentTarget.dataset.id;
        const rowId = this.activeRowId; 

        console.log('Selected Record ID:', recordId);
        console.log('Account Number:', accountNumber);
        console.log('Account Value:', accountValue);
        console.log('Active Row ID:', rowId);
        // console.log('this.selectedRowId'+ this.selectedRowId);
        // ✅ Find the correct row in salesEntryList based on sales.Id
        this.invoiceRowList = this.invoiceRowList.map(sales => {
            console.log('sales.Id==>'+sales.Id);
            console.log('this.recordId==>'+sales.Id);

            console.log('Match found! Updating selectedOptionAL...');
            console.log('Before:', sales.selectedOptionAL);
            console.log('New Value:', `${accountNumber} - ${accountValue}`);
            if (sales.Id == rowId) {
                return { 
                    ...sales, 
                    selectedOptionAL: `${accountNumber} - ${accountValue}` ,
                    accountItemId: recordId,
                };
            }
            return sales;
        });

        //this.selectedOptionAL = `${accountNumber} - ${accountValue}`; // Update UI dropdown
        this.showtable = false; // Hide dropdown
        // const newRow = {
        //     // default text
        //     selectedOptionAL: this.selectedOptionAL     // default text
        //         };
        //     this.invoiceRowList = [...this.invoiceRowList, newRow];
        console.log('Updated invoiceRowList:', JSON.stringify(this.invoiceRowList));
         this.listenForOutsideClick = false;
    }

    @track fromAddress = '';
    @track toAddress = '';
    @track ccAddress = '';

    handleAddressChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;

        // Update the property based on field name
        if(fieldName === 'toAddress') {
            this.toAddress = fieldValue;
        } else if(fieldName === 'ccAddress') {
            this.ccAddress = fieldValue;
        }

        console.log(`${fieldName} changed to: ${fieldValue}`);
    }

    handleCloseModal(event){
        this.invoiceEmailFlag = false;
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
            url: this.url,
            invoiceStartDate: this.invoiceStartDate,
            invoiceEndDate: this.invoiceEndDate
        })
        .then(() => {
            console.log('Email sent successfully');
            this.showToast('Success', 'Email sent successfully!', 'success');
            this.fromAddress = '';
            this.toAddress = '';
            this.ccAddress = '';
            this.invoiceEmailFlag = false;
        })
        .catch(error => {
            console.error('Error sending email:', error);
            this.showToast('Error', 'Error sending email: ' + error.body?.message || error.message, 'error');
        });

    }
    
}