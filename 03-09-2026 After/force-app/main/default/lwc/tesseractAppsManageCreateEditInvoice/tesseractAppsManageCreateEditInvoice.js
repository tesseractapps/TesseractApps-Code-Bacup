import { LightningElement, api, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import My_Resource from '@salesforce/resourceUrl/myResource';
import autoTable from '@salesforce/resourceUrl/autotable';
import robotoFont from '@salesforce/resourceUrl/Roboto';
import jsPDF from '@salesforce/resourceUrl/jspdf';
import getEntityProfileTax from '@salesforce/apex/AccountingModuleController.getEntityProfileTax';
import getEntityProfiles from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles';
import fetchEntityList from '@salesforce/apex/XeroIntegrationController.fetchEntityList';
import organizationDetailsForRoster from '@salesforce/apex/InvoiceHandler.organizationDetailsForRoster';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getAccountingInvoiceById from '@salesforce/apex/InvoiceHandler.getAccountingInvoiceById';
import getAccountingInvoiceInEdit from '@salesforce/apex/InvoiceHandler.getAccountingInvoiceInEdit';
import reverseInvoice from '@salesforce/apex/InvoiceHandler.reverseInvoice';
import getInvoiceHistoryDetails from '@salesforce/apex/AccountingChartController.getInvoiceHistoryDetails';
import saveUpdateManageInvoice from '@salesforce/apex/InvoiceHandler.saveUpdateManageInvoice';
import deleteMatchingRecordsRfq from '@salesforce/apex/AccountingChartController.deleteMatchingRecordsRfq';
import getAllLedgerItems from '@salesforce/apex/AccountingChartController.getAllLedgerItems';
import createUpdateManualXeroInvoice from '@salesforce/apex/InvoiceHandler.createUpdateManualXeroInvoice';
import getAccountingInvoiceByIdXero from '@salesforce/apex/RosterInvoicesHandler.getAccountingInvoiceByIdXero';
//import getXeroInvoiceInEdit from '@salesforce/apex/AccountingChartController.getXeroInvoiceInEdit';
import deleteMatchingXeroRecords from '@salesforce/apex/InvoiceHandler.deleteMatchingXeroRecords';
import fetchCompanyByFacility from "@salesforce/apex/RosterInvoicesHandler.fetchCompanyByFacility";
import fetchFacilitiess from '@salesforce/apex/ClientSearchController.fetchFacilitiess';
import getXeroAccounts from '@salesforce/apex/XeroIntegrationController.getXeroAccounts';
import getLoggedInStaffDetails from '@salesforce/apex/IncidentInvestigationController.getLoggedInStaffDetails';
import getXeroInvoiceHistoryDetails from '@salesforce/apex/InvoiceHandler.getXeroInvoiceHistoryDetails';

export default class TesseractAppsManageCreateEditInvoice extends LightningElement {

    @api orgid;
    @api accountingService; // 'Tesseract System' | 'Xero' | 'MYOB'
    @api invoiceId; // set by parent for edit mode; undefined for create mode
    //@api isParticipantContext = false; // set true by manageInvoice's "Create Invoice"; AccountInvoice leaves it unset (false)
    @api faclist; // facility id(s) used to filter linkable participants; passed in by the parent

    @track salesEntryList = [];
    //@track showtableTax = false;
    @track isInvoiceflag = true;
    @track createEditInvoice = 'Create Invoice';
    @track buttonLabel = 'Save';
    @track entryType = 'Sales';
    @track entryNameOptions = [];
    @track selectedEntityName = '';
    @track participantNameOptions = [];
    @track selectedParticipantName = '';
    @track participantOptions = [];
    @track invoiceDate = null;
    @track dueDate = null;
    @track invoiceNo;
    @track comments;
    @track disabledSave = false;
    @track selectedStatus = 'Draft';
    @track notes;
    @track statusOptions = [];
    @track subTotal;
    @track taxAmount;
    @track totalAmount;
    @track taxDropdownStyle;
    @track customerDropdownStyle = '';
    @track filteredTaxCodes = [];
    @track isShowActivity = false;
    //@track amountarrey = [];
    @track postDate = null;
    @track disabledInvoiceNo = false;
    @track showHistoryTable = false;
    @track taxInclusive = false;
    @track editflag = false;
    @track companyId;
    @track companyname;
    @track isSalesFlag = false;
    @track isPurchasesFlag = false;
    @track isHome = false;
    @track isTitleMenuFlag = false;
    @track isSalesTableFlag = false;
    @track isToggleVisible = false;
    //@track isRFQEnabled = false;
    @track isNewEntityFlag = false;
    @track selectedCardType = '';
    @track ledgerItems = [];
    @track deletedRowIds = [];
    @track selectedRowId = null;
    @track popoverStyle = {};
    @track selectedDescription = null;
    @track selectedAmount = null;
    @track selectedItem = null;
    @track Status = null;
    @track allStatusOptions = [];
    @track selectedOptionAL1;
//@track selectedOptionTax1;
    @track selectedOptionAL = '';
    //@track selectedOptionTax = '';
    @track wiredEntityProfilesTax;
    @track activeRowIdB;
    //@track taxCodes = [];
    //@track isRFQ = false;
    @track isParticipantInvoice = false;
    //@track isInvoiceFromIct = false;
    @track invRecords;
    @track emailSentConfirmation = false;
    @track invoiceIdforEmail;
    @track edate;
    @track statusReverseFlag = false;
    @track currentInvoiceId;
    //@track fieldLabelMap = {};
    @track historyRows = [];
    @track historyRowsAll = [];
    @track paginationVisibleHistory = false;
    @track pageSizeOptionsHistory = [10, 25, 50, 100];
    @track pageNumberHistory = 1;
    @track totalPagesHistory = 0;
    @track totalRecordsHistory = 0;
    @track pageSizeHistory = 10;
    @track invoiceData;
    @track bank;
    @track accountNo;
    @track accountName;
    @track bsb;
    @track orgName;
    @track abn;
    @track orgLogo;
    @track errorMessage;
    @track listenForOutsideClick = false;
    @track highestTaxAmount = 0;
    @track selectedOptionALId;
    @track base64string;

    accountList = '';
    customerShowTable = false;
    FilteredLedgerItems = [];
    customerSelectedAccountId = '';
    activeRowId = '';
    wiredEntityProfilesResult;
    selectedFormat;
    @track isOpen = false;
    @track isHome =true;
    @track invoiceformatFlag = false;
    selectedPreview = null;
    showPreview = false;
    @track showAcknowledgementModal = false;   
    @track isAckChecked = false;            
    pendingSaveAction = null; 
    @track currentUser = ''; 
    @track loggedInStaffId1;
    @track  loggedInStaffName; 
    @track chkLabel;  

    jsPdfLoaded = false;
    @track fieldLabelMap = {
    'Acknowledged_By__c': 'Acknowledged By',
    'Acknowledged_Date__c': 'Acknowledged Date',
    'Amazon_URL__c': 'Amazon URL',
    'Email_Count__c': 'Email Count',
    'Description__c': 'Description',
    'Due_Date__c': 'Due Date',
    'GST__c': 'GST',
    'Invoice_Date__c': 'Invoice Date',
    'Invoice_No__c': 'Invoice No',
    'Invoice_Source__c': 'Invoice Source',
    'Is_Create_Manage_Invoice__c': 'Is Create/Manage Invoice',
    'Is_Service_Invoice__c': 'Is Service Invoice',
    'Participant__c': 'Participant',
    'Post_Date__c': 'Post Date',
    'Quantity__c': 'Quantity',
    'Services_Id_List__c': 'Services',
    'Staff__c': 'Staff',
    'Status__c': 'Status',
    'Sub_Total__c': 'Sub Total',
    'Tax__c': 'Tax',
    'Tax_Amount__c': 'Tax Amount',
    'Tax_Inclusive__c': 'Tax Inclusive',
    'Total_Amount__c': 'Total Amount',
    'Unit_Price__c': 'Unit Price',
    'Xero_Entity__c': 'Entity',
    'Xero_Account_Label__c': 'Account List',
    'Xero_Account_Id__c': 'Account Id',
    'Xero_Innvoice_Id__c': 'Xero Invoice Id',
    'Line_Items__c': 'Support Item',
    'Entity_Profile__c': 'Entity',
    'Accounting_Ledger_Items__c': 'Account List',
    'Amount_Paid__c': 'Amount Paid',
    'Balance_Amount__c': 'Balance Amount',
    'Company__c': 'Company',
    'Issued_Date__c': 'Issued Date',
    'Start_Date__c': 'Start Date'
};

    @track salesEntry = {
        company: this.companyId,
        entryType: 'Sales',
        entityName: '',
        InvoiceDate: '',
        PostDate: '',
        dueDate: '',
        InvoiceNo: '',
        taxInclusive: false,
        Status: 'Draft',
        comments: '',
        notes: ''
    };
    //  @track taxCodes = [
    //     {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
    //     {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
    //     {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
    //     {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
    //     {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
    //     {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    // ];
    @track amountarrey = { subTotal: 0, taxAmount: 0, totalAmount: 0 };

    get activityToggleLabel() {
        return this.showHistoryTable ? 'Hide Activity' : 'Show Activity';
    }

    get defaultTaxInclusive() {
       // return this.accountingService === 'Tesseract System';
       return true;
    }
    get isAccounting() {
        return this.accountingService === 'Tesseract System';
    }
    // get dropdownClass() {
    //     return `dropdown-menu ${this.isOpen ? "show" : "hide"}`;
    // }
    // get formattedFormats() {
    //     return this.formats.map(format => ({
    //         ...format,
    //         cardClass: format.isDefault
    //             ? 'invoice-card selected'
    //             : 'invoice-card'
    //     }));
    // }
    // get invoiceClass(){
    //     return (this.invoiceformatFlag ) ? 'menu-item1' : 'menu-item'; 
    
    // }
    get salesTableContainerClass() {
        return this.isAccounting
            ? 'table-container sales-entry-table slds-m-around_small'
            : 'table-container sales-entry-table xero-columns slds-m-around_small';
    }

    async connectedCallback() {
        console.log('TesseractAppsManageCreateEditInvoice connectedCallback called');
        console.log('faclist in connectedCallback : ', this.faclist);
        this.entryType = 'Sales';

        try {
            if (!this.jsPdfLoaded) {
                await loadScript(this, jsPDF);
                await loadScript(this, autoTable);
                await loadScript(this, robotoFont);
                this.jsPdfLoaded = true;
            }
        } catch (error) {
            console.error('Error loading PDF libraries:', error);
        }
        await this.loadLoggedInStaffDetails();
        this.handleInvoiceData();
        this.handleLinkParticipants();
        if (this.accountingService === 'Tesseract System' && !this.companyId) { 
            await this.loadCompanyFromFacility();
        }
        console.log('companyId in connectedCallback : ', this.companyId);
        console.log('companyname in connectedCallback : ', this.companyname);
        await this.loadEntityOptions();

        window.addEventListener('click', this.handleOutsideClick);
        this.handleShortcut = this.handleShortcut.bind(this);
        window.addEventListener('keydown', this.handleShortcut);

        this.allStatusOptions = [
            { label: 'Draft', value: 'Draft' },
            { label: 'Issued', value: 'Issued' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Unpaid', value: 'Unpaid' }
        ];
        this.statusOptions = [...this.allStatusOptions];

        this.taxInclusive = this.defaultTaxInclusive;

        if (this.invoiceId) {
            this.loadInvoiceForEdit(this.invoiceId);
        } else {
            //this.isParticipantInvoice = this.isParticipantContext;
            this.isParticipantInvoice = true;
            //this.isRFQ = false;
            //this.isInvoiceFromIct = false;
            this.salesEntry = { ...this.salesEntry, taxInclusive: this.taxInclusive };
            this.addRow();
        }
    }

    disconnectedCallback() {
        window.removeEventListener('click', this.handleOutsideClick);
        window.removeEventListener('keydown', this.handleShortcut);
    }

    handleOutsideClick = (event) => {
        if (this.listenForOutsideClick) {
            // const dropdownElement = this.template.querySelector('[data-id="taxTableDropdown"]');
            // if (dropdownElement && !dropdownElement.contains(event.target)) {
            //     //this.showtableTax = false;
            //     this.listenForOutsideClick = false;
            // }
            const dropdownElement1 = this.template.querySelector('[data-id="accountListTableDropdown"]');
            if (dropdownElement1 && !dropdownElement1.contains(event.target)) {
                this.customerShowTable = false;
                this.listenForOutsideClick = false;
            }
        }
    };
    async loadLoggedInStaffDetails() {
        try {
            const staffDetails = await getLoggedInStaffDetails();

            this.loggedInStaffId1 = staffDetails?.staffId || '';
            this.loggedInStaffName = staffDetails?.staffName || '';
            this.currentUser = this.loggedInStaffName;

            console.log('Logged in Staff Id:', this.loggedInStaffId1);
            console.log('Logged in Staff Name:', this.loggedInStaffName);
        } catch (error) {
            console.error('Error fetching logged-in staff details:', error);
            this.currentUser = '';
        }
    }

    async loadCompanyFromFacility() {
        if (!this.faclist) {
            console.warn('loadCompanyFromFacility skipped: faclist not provided by parent.');
            return;
        }

        try {
            const company = await fetchCompanyByFacility({ facilityId: this.faclist });

            if (company) {
                this.companyId = company.Id;
                this.companyname = company.Company_Name__c;
                this.salesEntry = { ...this.salesEntry, company: this.companyId };
                console.log(
                    'Fallback company found →',
                    this.companyId,
                    this.companyname
                );
            } else {
                console.log('No company found for this facility');
            }
        } catch (error) {
            console.error('Error in loadCompanyFromFacility:', error);
        }
    }
    // ---------- ENTITY OPTIONS (accounting vs Xero) ----------
    loadEntityOptions() {
        if (this.accountingService === 'Tesseract System') {
            return this.loadAccountingEntities();
        }
        if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
            return this.loadXeroEntities();
        }
        console.warn('Unhandled accountingService in loadEntityOptions:', this.accountingService);
        this.entryNameOptions = [];
        return Promise.resolve();
    }

    loadAccountingEntities() {
        return getEntityProfiles({ companyId: this.companyId })
            .then((result) => {
                this.entryNameOptions = (result || []).map((profile) => ({
                    label: `${profile.First_Name__c || ''} ${profile.Last_Name__c || ''}`.trim() || profile.Name__c,
                    value: profile.Id
                }));
            })
            .catch((error) => {
                console.error('Error fetching accounting entity profiles:', error);
                this.entryNameOptions = [];
            });
    }

    loadXeroEntities() {
        return fetchEntityList()
            .then((result) => {
                this.entryNameOptions = (result || [])
                    .filter(profile => profile.Xero_Contact_Id__c)
                    .map((profile) => ({
                        label: `${profile.First_Name__c || ''} ${profile.Last_Name__c || ''}`.trim(),
                        value: profile.Id
                    }));
            })
            .catch((error) => {
                console.error('Error fetching Xero entity profiles:', error);
                this.entryNameOptions = [];
            });
    }

    // ---------- LINKED PARTICIPANTS ----------

    handleLinkParticipants() {
        if (!this.faclist) {
            console.warn('handleLinkParticipants skipped: faclist not provided by parent.');
            this.participantOptions = [];
            return;
        }

        fetchFacilitiess({ cname: '', isTrue: false })
            .then(response => {
                console.log('participant response ' + JSON.stringify(response));

                this.participantOptions = (response || [])
                    .filter(rec => {
                        return (
                            rec.Participant_Facilities__r &&
                            rec.Participant_Facilities__r.some(
                                pf => this.faclist.includes(pf.Facility__c)
                            )
                        );
                    })
                    .map(rec => {
                        let riskLevels = rec.Risk_Managements__r?.map(
                            risk => risk.Risk_Index__c
                        ) || [];

                        let riskStatus = '';

                        if (riskLevels.includes('Extreme')) {
                            riskStatus = 'Extreme';
                        } else if (riskLevels.includes('High')) {
                            riskStatus = 'High';
                        } else if (riskLevels.includes('Medium')) {
                            riskStatus = 'Medium';
                        }

                        return {
                            value: rec.Id,
                            label: rec.Name__c,
                            riskStatus: riskStatus
                        };
                    });

                console.log('participantOptions ' + JSON.stringify(this.participantOptions));
            })
            .catch(error => {
                console.error(error);
                this.participantOptions = [];
            });
    }

    // ---------- EDIT LOAD ----------

    loadInvoiceForEdit(invoiceId) {
        this.editflag = true;
        this.createEditInvoice = 'Edit Invoice';
        this.buttonLabel = 'Update';
        this.disabledInvoiceNo = true;
        this.disabledSave = false;
        this.isShowActivity = true;
        this.currentInvoiceId = invoiceId;

        let fetchInvoice;

        if (this.accountingService === 'Tesseract System') {
            fetchInvoice = getAccountingInvoiceInEdit({ invoiceId: invoiceId });
        } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
            fetchInvoice = getAccountingInvoiceByIdXero({ invoiceId: invoiceId });
        } else {
            console.warn('Unhandled accountingService in loadInvoiceForEdit:', this.accountingService);
            return;
        }

        fetchInvoice
            .then((result) => {
                this.salesEntryList = [];
                if (!result || !result[0]) return;

                const invoice = result[0];
                let entries = [];

                if (this.accountingService === 'Tesseract System') {
                    entries = invoice.Accounting_Journal_Entry__r || [];
                     this.isParticipantInvoice = true;

                    // if (invoice.Is_RFQ__c === true) {
                    //     this.isRFQ = true;
                    //     this.isParticipantInvoice = false;
                    //     this.isInvoiceFromIct = false;
                    // } else if (invoice.Is_Service_Invoice__c === true || invoice.Participant__c) {
                    //     this.isRFQ = false;
                    //     this.isParticipantInvoice = true;
                    //     this.isInvoiceFromIct = false;
                    // } else if (invoice.ICT_Invoice_Entry__c === true) {
                    //     this.isRFQ = false;
                    //     this.isParticipantInvoice = false;
                    //     this.isInvoiceFromIct = true;
                    // } else {
                    //     this.isRFQ = false;
                    //     this.isParticipantInvoice = false;
                    //     this.isInvoiceFromIct = false;
                    // }
                } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
                    entries = invoice.Xero_Invoice_Entries__r || [];

                    // this.isRFQ = false;
                    // this.isInvoiceFromIct = false;
                    this.isParticipantInvoice = !!invoice.Participant__c;
                }

                this.companyId = invoice.Company__c;
                this.invoiceDate = invoice.Invoice_Date__c || '';
                this.postDate = invoice.Post_Date__c || '';
                console.log(' this.postDate : ', this.postDate);
                this.dueDate = invoice.Due_Date__c || '';
                this.invoiceNo = invoice.Invoice_No__c;
                this.taxInclusive = (entries[0]?.Tax_Inclusive__c !== undefined && entries[0]?.Tax_Inclusive__c !== null)
                    ? entries[0].Tax_Inclusive__c
                    : this.defaultTaxInclusive;
                this.selectedStatus = invoice.Status__c;
                this.subTotal = invoice.Sub_Total__c;
                this.taxAmount = parseFloat(invoice.GST__c || 0).toFixed(2);
                this.totalAmount = parseFloat(invoice.Total_Amount__c || 0).toFixed(2);
                //this.selectedEntityName = invoice.Entity_Profile__c || entries[0]?.Entity_Profile__c || '';
                const isXeroOrMyobEntity = this.accountingService === 'Xero' || this.accountingService === 'MYOB';

                this.selectedEntityName = isXeroOrMyobEntity
                    ? (invoice.Xero_Entity__c || '')
                    : (invoice.Entity_Profile__c || entries[0]?.Entity_Profile__c || '');
                this.selectedParticipantName = invoice.Participant__c || '';
                this.comments = invoice.Comments__c || entries[0]?.Comments__c || '';
                this.notes = invoice.Notes__c || entries[0]?.Notes__c || '';

                this.salesEntry = {
                    company: this.companyId || '',
                    entryType: 'Sales',
                    entityName: this.selectedEntityName,
                    InvoiceDate: this.invoiceDate || '',
                    PostDate: this.postDate || '',
                    dueDate: this.dueDate || '',
                    InvoiceNo: this.invoiceNo || '',
                    taxInclusive: this.taxInclusive,
                    Status: this.selectedStatus || '',
                    comments: this.comments,
                    notes: this.notes,
                    invoiceId: invoice.Id,
                    participantID: invoice.Participant__c || '',
                    ServicesList: invoice.Services_Id_List__c || ''
                };
                 console.log(' this.salesEntry : ', JSON.stringify(this.salesEntry));

                entries.forEach((entry, idx) => {
                    const taxRate = entry.Tax__c ? `${entry.Tax__c}%` : '0%';
                    const isXeroOrMyob = this.accountingService === 'Xero' || this.accountingService === 'MYOB';
                    const resolvedAccountList = isXeroOrMyob
                            ? (entry.Xero_Account_Label__c || '')
                            : (entry.Accounting_Ledger_Items__r
                                ? `${entry.Accounting_Ledger_Items__r.Account_Number__c} - ${entry.Accounting_Ledger_Items__r.Name}`
                                : '');
                    const resolvedAccountItemId = isXeroOrMyob
                            ? (entry.Xero_Account_Id__c || '')
                            : (entry.Accounting_Ledger_Items__c || '');
                    this.salesEntryList.push({
                        Id: entry.Id,
                        //sno: entry.Sl_no__c,
                        sno: idx + 1,
                        Description__c: entry.Description__c || '',
                        lineItems: entry.Line_Items__c || '',
                        accountList:resolvedAccountList,
                        Quantity__c: entry.Quantity__c || 0,
                        Amount__c: entry.Unit_Price__c || 0,
                        tax: taxRate,
                        taxvalue: taxRate,
                        accountItemId: resolvedAccountItemId,
                        calculatedAmount: (entry.Unit_Price__c || 0) * (entry.Quantity__c || 0),
                        subTotal: parseFloat(entry.Sub_Total__c || entry.Total_Amount__c || 0).toFixed(2),
                        taxAmount: parseFloat(entry.Tax_Amount__c || 0).toFixed(2),
                        totalAmount: parseFloat(entry.Total_Amount__c || 0).toFixed(2),
                        lineItems: entry.Line_Items__c || ''
                    });
                });
                const selectedRow = this.salesEntryList.find(item => item.Id);
               // this.selectedOptionTax1 = selectedRow ? selectedRow.tax : '';
                this.selectedOptionAL1 = selectedRow ? selectedRow.accountList : '';
                this.selectedOptionALId = selectedRow ? selectedRow.accountItemId : '';

                this.statusOptions = this.selectedStatus === 'Issued'
                    ? this.allStatusOptions.filter(opt => opt.value !== 'Draft')
                    : [...this.allStatusOptions];
            })
            .catch(error => console.error('Error fetching invoice details:', error));
    }

    // ---------- ROW MANAGEMENT ----------

    createRow() {
        return {
            Id: Date.now(),
            sno: this.salesEntryList.length + 1,
            lineItems: '',
            Description__c: '',
            accountList: this.selectedOptionAL1 || '',
            accountItemId: this.selectedOptionALId || '',
            Quantity__c: 0,
            UnitPrice__c: 0,
            Amount__c: 0,
            //tax: this.selectedOptionTax1 || ''
            tax: '0%'
        };
    }

    addRow() {
        const newRow = this.createRow();
        this.salesEntryList = [...this.salesEntryList, newRow];
        this.reindexSalesEntryList();
    }

    handleDeleteRow(event) {
        if (this.salesEntryList.length === 1) {
            this.showToast('Error', 'At least one row is required.', 'error');
            return;
        }
        const rowId = event.target?.dataset?.id || event.target.closest('[data-id]')?.dataset?.id;
        this.salesEntryList = this.salesEntryList.filter(row => String(row.Id) !== rowId);
        this.selectedRowId = null;
        if (this.createEditInvoice === 'Edit Invoice' || this.buttonLabel === 'Update') {
            if (!this.deletedRowIds) this.deletedRowIds = [];
            this.deletedRowIds.push(rowId);
        }
        this.recalculateTotals();
        this.reindexSalesEntryList();
    }

    reindexSalesEntryList() {
        this.salesEntryList = this.salesEntryList.map((row, index) => ({ ...row, sno: index + 1 }));
    }

    recalculateTotals() {
        let totalSubTotal = 0;
        //let totalTaxAmount = 0;
        let totalAmount = 0;

        this.salesEntryList = this.salesEntryList.map(entry => {
            const quantity = parseFloat(entry.Quantity__c) || 0;
            const unitPrice = parseFloat(entry.Amount__c) || 0;
            const rawAmount = parseFloat((quantity * unitPrice).toFixed(2));

            // let taxRateDecimal = 0;
            // if (entry.tax) {
            //     const rate = entry.tax.replace('%', '').trim();
            //     taxRateDecimal = parseFloat(rate) / 100 || 0;
            // }

            // let subTotal = 0, taxAmt = 0, total = 0;
            // if (this.taxInclusive) {
            //     subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
            //     taxAmt = parseFloat((rawAmount - subTotal).toFixed(2));
            //     total = rawAmount;
            // } else {
            //     taxAmt = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
            //     subTotal = rawAmount;
            //     total = parseFloat((subTotal + taxAmt).toFixed(2));
            // }

            // totalSubTotal += subTotal;
            // totalTaxAmount += taxAmt;
            // totalAmount += total;

            // return { ...entry, calculatedAmount: rawAmount, subTotal, taxAmount: taxAmt, totalAmount: total };
             totalSubTotal += rawAmount;
            totalAmount += rawAmount;

            return { ...entry, calculatedAmount: rawAmount, subTotal: rawAmount, taxAmount: 0, totalAmount: rawAmount };
        });

        this.subTotal = parseFloat(totalSubTotal.toFixed(2));
        // this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
        this.taxAmount = 0;
        this.totalAmount = parseFloat(totalAmount.toFixed(2));
        this.amountarrey = { subTotal: this.subTotal, taxAmount: this.taxAmount, totalAmount: this.totalAmount };
    }

    // ---------- FIELD CHANGE ----------

    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        this.salesEntry = { ...this.salesEntry, [fieldName]: fieldValue };

        switch (fieldName) {
            case 'participantName':
                this.selectedParticipantName = fieldValue;
                this.salesEntry.participantID = fieldValue;
                break;

            case 'entityName':
                this.selectedEntityName = fieldValue;
                if (this.accountingService === 'Tesseract System') {
                    this.fetchEntityProfileTax(this.selectedEntityName);
                } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
                    // Xero/MYOB entities carry no per-entity tax lookup today; rows stay at their default 0% tax.
                }
                break;

            case 'InvoiceDate':
                this.invoiceDate = fieldValue;
                this.salesEntry.InvoiceDate = fieldValue;
                if (!this.salesEntry.PostDate) {
                    this.salesEntry.PostDate = fieldValue;
                    this.postDate = fieldValue;
                }
                this.validateDateOrder();
                break;

            case 'PostDate':
                this.postDate = fieldValue;
                this.salesEntry.PostDate = fieldValue;
                this.validateDateOrder();
                break;

            case 'DueDate':
                this.dueDate = fieldValue;
                this.salesEntry.dueDate = fieldValue;
                this.validateDateOrder();
                break;

            case 'Status':
                this.selectedStatus = fieldValue;
                this.disabledSave = this.selectedStatus === 'Issued';
                break;

            case 'comments':
                this.comments = fieldValue;
                break;

            case 'notes':
                this.notes = fieldValue;
                break;

            default:
                console.warn(`Unhandled field name: ${fieldName}`);
                break;
        }
        console.log('salesEntry at end of handleChange:', JSON.stringify(this.salesEntry)); 
    }
    validateDateOrder() {
        const invoiceDateStr = this.salesEntry.InvoiceDate;
        const postDateStr = this.salesEntry.PostDate;
        const dueDateStr = this.salesEntry.dueDate;

        if (!invoiceDateStr) {
            return true;  
        }

        const invoiceDate = new Date(invoiceDateStr);
        let valid = true;

        if (postDateStr) {
            const postDate = new Date(postDateStr);
            if (postDate < invoiceDate) {
                this.showToast('Error', 'Post Date cannot be earlier than Invoice Date.', 'error');
                valid = false;
            }
        }

        if (dueDateStr) {
            const dueDate = new Date(dueDateStr);
            if (dueDate < invoiceDate) {
                this.showToast('Error', 'Due Date cannot be earlier than Invoice Date.', 'error');
                valid = false;
            }
        }

        return valid;
    }

    handleback() {
        this.isInvoiceflag = false;
        this.dispatchEvent(new CustomEvent('close', { detail: { cancelled: true } }));
    }

    // ---------- ENTITY TAX / LEDGER (accounting only) ----------

    fetchEntityProfileTax(entityId) {
        getEntityProfileTax({ entityId: entityId })
            .then((data) => {
                if (data && (data.tax || data.accountList)) {
                    this.wiredEntityProfilesTax = { data, error: null };
                    //const taxValue = this.appendPercentage(data.tax);
                    const entityAccountList = data.accountList;
                    const entityItemId = data.accountItemId;

                    this.salesEntryList = this.salesEntryList.map(entry => (
                        this.editflag
                            ? {
                                ...entry,
                                //tax: taxValue ? taxValue : (entry.tax || '0%'),
                                accountList: entityAccountList ? entityAccountList : (entry.accountList || ''),
                                accountItemId: entityItemId ? entityItemId : entry.accountItemId
                            }
                           // : { ...entry, tax: taxValue, accountList: entityAccountList, accountItemId: entityItemId }
                           : { ...entry, accountList: entityAccountList, accountItemId: entityItemId }
                    ));

                    const selectedRow = this.salesEntryList.find(item => item.Id);
                    //this.selectedOptionTax1 = selectedRow ? selectedRow.tax : '';
                    this.selectedOptionAL1 = selectedRow ? selectedRow.accountList : '';
                    //this.selectedOptionTax = selectedRow ? selectedRow.tax : '';
                    this.selectedOptionAL = selectedRow ? selectedRow.accountList : '';
                    this.selectedOptionALId = selectedRow ? selectedRow.accountItemId : '';

                   // this.updateTaxForSelectedRow(this.selectedOptionTax);
                } else {
                    //this.selectedOptionTax = '';
                    this.selectedOptionAL = '';
                  //  this.salesEntryList = this.salesEntryList.map(entry => ({ ...entry, tax: '', accountList: '' }));
                   this.salesEntryList = this.salesEntryList.map(entry => ({ ...entry, accountList: '' }));
                }
            })
            .catch(error => {
                this.wiredEntityProfilesTax = { data: null, error };
                console.error('Error in fetchEntityProfileTax:', error);
            });
    }

    handleInputChange(event) {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        if (fieldName === 'lineItems') {
            const input = event.target;

            if (/[A-Za-z]/.test(fieldValue)) {
                input.setCustomValidity(
                    'Support Item cannot contain alphabets.'
                );
                input.reportValidity();

                // Clear UI input
                input.value = '';

                // Clear value in salesEntryList
                this.salesEntryList = this.salesEntryList.map(sales => {
                    if (sales.Id === this.selectedRowId) {
                        return {
                            ...sales,
                            lineItems: ''
                        };
                    }
                    return sales;
                });

                // Stop further processing
                return;
            } else {
                input.setCustomValidity('');
                input.reportValidity();
            }
        }
        this.selectedRowId = event.currentTarget.dataset.id;

        let totalSubTotal = 0, totalAmount = 0;    //totalTaxAmount = 0, 

        this.salesEntryList = this.salesEntryList.map(sales => {
            let updatedRecord = { ...sales };
            if (sales.Id == this.selectedRowId) {
                updatedRecord[fieldName] = (fieldName === 'Quantity__c' || fieldName === 'Amount__c')
                    ? (parseFloat(fieldValue) || 0)
                    : fieldValue;
            }

            const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
            const amount = parseFloat(updatedRecord.Amount__c) || 0;
            const rawAmount = parseFloat((quantity * amount).toFixed(2));
            updatedRecord.calculatedAmount = rawAmount;

            if (this.entryType === 'Sales') {
                // let taxRateStr = updatedRecord.tax || this.selectedOptionTax || '0%';
                // let rate = taxRateStr.split(' ')[0].replace('%', '');
                // let taxRate = parseFloat(rate);
                // let taxRateDecimal = taxRate / 100;
                // if (isNaN(taxRate)) { taxRate = 0; taxRateDecimal = 0; }

                // if (this.taxInclusive) {
                //     const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
                //     const taxAmt = parseFloat((rawAmount - subTotal).toFixed(2));
                //     updatedRecord.subTotal = subTotal;
                //     updatedRecord.taxAmount = taxAmt;
                //     updatedRecord.totalAmount = rawAmount;
                // } else {
                //     const taxAmt = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
                //     const totalAmountCalc = parseFloat((rawAmount + taxAmt).toFixed(2));
                //     updatedRecord.subTotal = rawAmount;
                //     updatedRecord.taxAmount = taxAmt;
                //     updatedRecord.totalAmount = totalAmountCalc;
                // }

                // totalSubTotal += updatedRecord.subTotal;
                // totalTaxAmount += updatedRecord.taxAmount;
                // totalAmount += updatedRecord.totalAmount;
                updatedRecord.subTotal = rawAmount;
                updatedRecord.taxAmount = 0;
                updatedRecord.totalAmount = rawAmount;
                totalSubTotal += rawAmount;
                totalAmount += rawAmount;
            }
            return updatedRecord;
        });

        this.subTotal = parseFloat(totalSubTotal.toFixed(2));
        //this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
        this.taxAmount = 0;
        this.totalAmount = parseFloat(totalAmount.toFixed(2));
        this.amountarrey = { subTotal: this.subTotal, taxAmount: this.taxAmount, totalAmount: this.totalAmount };
    }

    handleRowFocus(event) {
        this.activeRowIdB = event.target.dataset.row;
    }

    handleDropdownPosition(event) {
        console.log('handleDropdownPosition  called');
        this.resetAllDropdowns();
        const rowId = event.target.dataset.id;
        this.activeRowId = rowId;
        //this.showtableTax = false;
        this.customerShowTable = !this.customerShowTable;

        const rect = event.target.getBoundingClientRect();
        this.customerDropdownStyle = `
            position:fixed;
            top: ${rect.bottom + 4}px;
            left: ${rect.left}px;
            width: 29%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        //this.fetchLedgerItems();
         this.fetchAccountListItems();
        if (this.customerShowTable) {
            setTimeout(() => { this.listenForOutsideClick = true; }, 0);
        } else {
            this.listenForOutsideClick = false;
        }
    }
    fetchAccountListItems() {
        if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
            this.fetchXeroAccountListItems();
        } else {
            this.fetchLedgerItems();
        }
    }
    fetchXeroAccountListItems() {
        console.log('fetchXeroAccountListItems called');
        getXeroAccounts()
            .then(result => {
                console.log('Result in fetchXeroAccountListItems ', JSON.stringify(result));
                this.ledgerItems = (result || []).map(acc => ({
                    id: acc.AccountID,
                    accNo: acc.Code || '',
                    itemName: acc.Name,
                    category: acc.Type || ''
                }));
                this.FilteredLedgerItems = this.ledgerItems;
                console.log('FilteredLedgerItems in fetchXeroAccountListItems ', JSON.stringify(this.FilteredLedgerItems));
            })
            .catch(error => {
                console.error('Error fetching Xero accounts for dropdown:', error);
                this.ledgerItems = [];
                this.FilteredLedgerItems = [];
                this.errorMessage = 'Error fetching Xero accounts: ' + (error.body?.message || error.message);
            });
    }

    handleCustomerSearch(event) {
        const inputValue = event.target.value;
        const searchLower = inputValue.toLowerCase();
        const rowId = event.target.dataset.id;

        this.salesEntryList = this.salesEntryList.map(sales =>
            sales.Id == rowId ? { ...sales, accountList: inputValue } : sales
        );

        this.FilteredLedgerItems = this.ledgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;
            return accNo.includes(searchLower) || itemName.includes(searchLower) || combined.includes(searchLower);
        });
        this.activeRowId = rowId;
        this.customerShowTable = true;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    // toggleDropdownTax(event) {
    //     this.resetAllDropdowns();
    //     this.selectedRowId = event.currentTarget.dataset.id;
    //     this.customerShowTable = false;
    //     this.showtableTax = !this.showtableTax;

    //     const rect = event.target.getBoundingClientRect();
    //     this.taxDropdownStyle = `
    //         position: fixed;
    //         top: ${rect.bottom + 4}px;
    //         left: ${rect.left}px;
    //         width: 16%;
    //         max-height: 300px;
    //         z-index: 1000;
    //         background: white;
    //         border: 1px solid #ccc;
    //         border-radius: 4%;
    //         overflow-y: auto;
    //         box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    //     `;
    //     this.filteredTaxCodes = this.taxCodes;
    //     if (this.showtableTax) {
    //         setTimeout(() => { this.listenForOutsideClick = true; }, 0);
    //     } else {
    //         this.listenForOutsideClick = false;
    //     }
    // }

    // handleTaxSearch(event) {
    //     const inputValue = event.target.value;
    //     const rowId = event.target.dataset.id;

    //     this.filteredTaxCodes = this.taxCodes.filter(tax => {
    //         const label = tax.label?.toLowerCase() || '';
    //         const code = tax.code?.toLowerCase() || '';
    //         const desc = tax.description?.toLowerCase() || '';
    //         return code.includes(inputValue) || desc.includes(inputValue) || label.includes(inputValue);
    //     });

    //     this.salesEntryList = this.salesEntryList.map(sales =>
    //         sales.Id == rowId ? { ...sales, tax: inputValue } : sales
    //     );
    //     this.activeRowId = rowId;
    //     this.showtableTax = true;
    // }

    handleCustomerSelection(event) {
        const recordId = event.currentTarget.dataset.id;
        const accountNumber = event.currentTarget.dataset.accno;
        const accountValue = event.currentTarget.dataset.value;
        const rowId = this.activeRowId;

        this.salesEntryList = this.salesEntryList.map(sales =>
            sales.Id == rowId
                ? { ...sales, accountList: `${accountNumber} - ${accountValue}`, accountItemId: recordId }
                : sales
        );
        this.customerShowTable = false;
        this.listenForOutsideClick = false;
    }

    // handleSelectionTax(event) {
    //     const rate = event.currentTarget.dataset.rate;
    //     let totalSubTotal = 0, totalTaxAmount = 0, totalAmount = 0;

    //     this.salesEntryList = this.salesEntryList.map(sales => {
    //         let updatedRecord = { ...sales };
    //         if (String(sales.Id) === this.selectedRowId) {
    //             updatedRecord.tax = `${rate}`;
    //             updatedRecord.taxvalue = rate;

    //             const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
    //             const unitPrice = parseFloat(updatedRecord.Amount__c) || 0;
    //             const rawAmount = parseFloat((quantity * unitPrice).toFixed(2));
    //             const taxRateDecimal = parseFloat(rate) / 100;
    //             updatedRecord.calculatedAmount = rawAmount;

    //             if (this.taxInclusive) {
    //                 const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
    //                 const taxAmt = parseFloat((rawAmount - subTotal).toFixed(2));
    //                 updatedRecord.subTotal = subTotal;
    //                 updatedRecord.taxAmount = taxAmt;
    //                 updatedRecord.totalAmount = rawAmount;
    //             } else {
    //                 const taxAmt = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
    //                 const total = parseFloat((rawAmount + taxAmt).toFixed(2));
    //                 updatedRecord.subTotal = rawAmount;
    //                 updatedRecord.taxAmount = taxAmt;
    //                 updatedRecord.totalAmount = total;
    //             }
    //         }

    //         totalSubTotal += parseFloat(updatedRecord.subTotal) || 0;
    //         totalTaxAmount += parseFloat(updatedRecord.taxAmount) || 0;
    //         totalAmount += parseFloat(updatedRecord.totalAmount) || 0;
    //         return updatedRecord;
    //     });

    //     this.amountarrey = {
    //         subTotal: totalSubTotal,
    //         taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
    //         totalAmount: parseFloat(totalAmount.toFixed(2))
    //     };
    //     this.subTotal = this.amountarrey.subTotal;
    //     this.taxAmount = this.amountarrey.taxAmount;
    //     this.totalAmount = this.amountarrey.totalAmount;
    //     this.selectedOptionTax = `${rate}`;
    //     this.showtableTax = false;
    //     this.listenForOutsideClick = false;
    // }

    resetAllDropdowns() {
        //this.showtableTax = false;
        this.customerShowTable = false;
        this.listenForOutsideClick = false;
    }

    // updateTaxForSelectedRow(taxRate) {
    //     let totalSubTotal = 0, totalTaxAmount = 0, totalAmount = 0;

    //     this.salesEntryList = this.salesEntryList.map(sales => {
    //         let updatedRecord = { ...sales };
    //         updatedRecord.tax = `${taxRate}`;
    //         updatedRecord.taxvalue = taxRate;

    //         const rate = taxRate.split(' ')[0].replace('%', '');
    //         const taxWithoutPercent = parseFloat(rate);
    //         const taxRateDecimal = parseFloat(rate) / 100;
    //         if (isNaN(taxWithoutPercent)) return updatedRecord;

    //         const quantity = parseFloat(updatedRecord.Quantity__c) || 0;
    //         const amount = parseFloat(updatedRecord.Amount__c) || 0;
    //         updatedRecord.calculatedAmount = parseFloat((quantity * amount).toFixed(2));
    //         const rawAmount = updatedRecord.calculatedAmount;

    //         if (this.taxInclusive) {
    //             const subTotal = parseFloat((rawAmount / (1 + taxRateDecimal)).toFixed(2));
    //             const taxAmt = parseFloat((rawAmount - subTotal).toFixed(2));
    //             updatedRecord.subTotal = subTotal;
    //             updatedRecord.taxAmount = taxAmt;
    //             updatedRecord.totalAmount = rawAmount;
    //         } else {
    //             const taxAmt = parseFloat((rawAmount * taxRateDecimal).toFixed(2));
    //             const total = parseFloat((rawAmount + taxAmt).toFixed(2));
    //             updatedRecord.subTotal = rawAmount;
    //             updatedRecord.taxAmount = taxAmt;
    //             updatedRecord.totalAmount = total;
    //         }

    //         totalSubTotal += parseFloat(updatedRecord.subTotal) || 0;
    //         totalTaxAmount += parseFloat(updatedRecord.taxAmount) || 0;
    //         totalAmount += parseFloat(updatedRecord.totalAmount) || 0;
    //         return updatedRecord;
    //     });

    //     this.amountarrey = { subTotal: totalSubTotal, taxAmount: totalTaxAmount, totalAmount: totalAmount };
    //     this.subTotal = totalSubTotal;
    //     this.taxAmount = parseFloat(totalTaxAmount.toFixed(2));
    //     this.totalAmount = parseFloat(totalAmount.toFixed(2));
    // }

    // appendPercentage(taxValue) {
    //     return taxValue != null ? `${taxValue}%` : '0%';
    // }

    // ---------- CLEAR / HISTORY ----------

    handleClear() {
        this.isInvoiceflag = false;
        this.selectedEntityName = null;
        this.selectedParticipantName = null;
        this.invoiceNo = '';
        this.comments = '';
        this.notes = '';
        this.selectedStatus = 'Draft';
        this.salesEntryList = [];
        this.customerShowTable = false;
        this.isShowActivity = false;
        this.showHistoryTable = false;
        //this.showtableTax = false;
        this.ledgerItems = [];
        this.deletedRowIds = [];
        this.selectedRowId = null;
        this.popoverStyle = {};
        this.subTotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
        this.selectedDescription = null;
        this.selectedAmount = null;
        this.selectedItem = null;
        this.entryType = 'Sales';
        this.invoiceDate = null;
        this.dueDate = null;
        this.postDate = null;
        this.Status = null;
        this.taxDropdownStyle = '';
        this.customerDropdownStyle = '';
        this.statusOptions = [...this.allStatusOptions];
        this.taxInclusive = this.defaultTaxInclusive;
        //this.isParticipantInvoice = this.isParticipantContext;
        this.isParticipantInvoice = true;
        // this.isRFQ = false;
        // this.isInvoiceFromIct = false;
        this.salesEntry = {
            company: this.companyId,
            entryType: 'Sales',
            entityName: '',
            InvoiceDate: '',
            PostDate: '',
            dueDate: '',
            InvoiceNo: '',
            taxInclusive: this.taxInclusive,
            Status: 'Draft',
            comments: '',
            notes: '',
            invoiceId: null,
            participantID: ''
        };
        this.selectedOptionAL = '';
        //this.selectedOptionTax = '';
        this.handleback();
    }

    handleHistoryClose() {
        this.showHistoryTable = false;
        this.editflag = true;
        this.createEditInvoice = 'Edit Invoice';
        this.buttonLabel = 'Update';
        this.selectedCardType = 'Customer';
        this.isInvoiceflag = true;
        this.disabledInvoiceNo = true;
        this.disabledSave = false;
        this.isShowActivity = true;
    }

    handleHistoryClick() {
        this.showHistoryTable = !this.showHistoryTable;
        if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
            getXeroInvoiceHistoryDetails({ invoiceId: this.currentInvoiceId })
                .then((result) => this.processHistoryResult(result))
                .catch((error) => console.error('Error fetching Xero invoice history:', error));
        } else {
            getInvoiceHistoryDetails({ invoiceId: this.currentInvoiceId })
                .then((result) => this.processHistoryResult(result))
                .catch((error) => console.error('Error fetching invoice history:', error));
        }
    }

    //     processHistoryResult(result) {
    //             const invoiceHistory = result.invoiceHistory || [];
    //             const entryHistory = result.entryHistory || [];
    //             let combinedHistory = [];
    //             let sno = 1;
    //             const seenCommentsNotes = new Set();
    //             const seenFieldTimeValues = new Set();
    //             const isRecordId = (val) => typeof val === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(val);
    //             const dateFields = new Set(['Invoice_Date__c', 'Due_Date__c', 'Post_Date__c']);

    //             const formatDateDDMMYYYY = (dateStr) => {
    //                 const date = new Date(dateStr);
    //                 if (isNaN(date.getTime())) return dateStr;
    //                 const day = String(date.getDate()).padStart(2, '0');
    //                 const month = String(date.getMonth() + 1).padStart(2, '0');
    //                 return `${day}/${month}/${date.getFullYear()}`;
    //             };

    //             const formatDateTime = (dateStr) => {
    //                 const date = new Date(dateStr);
    //                 if (isNaN(date.getTime())) return dateStr;
    //                 const day = String(date.getDate()).padStart(2, '0');
    //                 const month = String(date.getMonth() + 1).padStart(2, '0');
    //                 const hours = String(date.getHours()).padStart(2, '0');
    //                 const minutes = String(date.getMinutes()).padStart(2, '0');
    //                 return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
    //             };

    //             const formatValue = (val, field) => {
    //                 if (val === null || val === undefined) return '—';
    //                 if (field === 'Tax_Inclusive__c') return val ? 'True' : 'False';
    //                 if (dateFields.has(field)) return formatDateDDMMYYYY(val);
    //                 return val.toString();
    //             };

    //             [...invoiceHistory, ...entryHistory].forEach((record) => {
    //                 const field = record.Field;
    //                 const createdDate = record.CreatedDate;
    //                 if (!field || field.toLowerCase() === 'created') return;
    //                 if (isRecordId(record.OldValue) || isRecordId(record.NewValue)) return;
    //                 if ((field === 'Comments__c' || field === 'Notes__c') && seenCommentsNotes.has(field)) return;
    //                 if (field === 'Comments__c' || field === 'Notes__c') seenCommentsNotes.add(field);

    //                 const oldVal = formatValue(record.OldValue, field);
    //                 const newVal = formatValue(record.NewValue, field);
    //                 const keyOld = `${field}-${createdDate}-${oldVal}`;
    //                 const keyNew = `${field}-${createdDate}-${newVal}`;
    //                 if (seenFieldTimeValues.has(keyOld) || seenFieldTimeValues.has(keyNew)) return;
    //                 seenFieldTimeValues.add(keyOld);
    //                 seenFieldTimeValues.add(keyNew);

    //                 combinedHistory.push({
    //                     sno: sno++,
    //                     fieldName: this.fieldLabelMap[field] || field,
    //                     oldValue: oldVal,
    //                     newValue: newVal,
    //                     modifiedBy: record.CreatedBy?.Name || '—',
    //                     modifiedDate: formatDateTime(createdDate)
    //                 });
    //             });

    //             combinedHistory.sort((a, b) => new Date(a.modifiedDate) - new Date(b.modifiedDate));
    //             combinedHistory = combinedHistory.map((record, index) => ({ ...record, sno: index + 1 }));

    //             this.historyRowsAll = combinedHistory;
    //             this.totalRecordsHistory = combinedHistory.length;
    //             this.pageNumberHistory = 1;
    //             this.pageSizeHistory = 10;
    //             this.paginationVisibleHistory = this.totalRecordsHistory > 0;
    //             this.paginationHelperHistory();
    //         })
    //         .catch((error) => console.error('Error fetching history:', error));
    // }
    processHistoryResult(result) {
        const invoiceHistory = (result && result.invoiceHistory) || [];
        const entryHistory = (result && result.entryHistory) || [];
        const entityNameMap = (result && result.entityNameMap) || {}; 
        let combinedHistory = [];
        let sno = 1;
        const seenCommentsNotes = new Set();
        const seenFieldTimeValues = new Set();
        const isRecordId = (val) => typeof val === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(val);
        const dateFields = new Set(['Invoice_Date__c', 'Due_Date__c', 'Post_Date__c']);
        const dateTimeFields = new Set(['Acknowledged_Date__c']);  
        const entityFields = new Set(['Entity_Profile__c', 'Xero_Entity__c']);

        const formatDateDDMMYYYY = (dateStr) => {
            if (!dateStr) return '—';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${day}/${month}/${date.getFullYear()}`;
        };

        const formatDateTime = (dateStr) => {
            if (!dateStr) return '—';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
        };
        const formatEntityValue = (val) => {
            if (!val) return '—';
            return entityNameMap[val] || val;
        };
        const isEntityCodeFormat = (val) => typeof val === 'string' && /^E-\d+$/.test(val);

        const formatValue = (val, field) => {
            if (val === null || val === undefined || val === '') return '—';
            if (field === 'Tax_Inclusive__c') return val ? 'True' : 'False';
            if (dateFields.has(field)) return formatDateDDMMYYYY(val);
            if (dateTimeFields.has(field)) return formatDateTime(val);
            if (entityFields.has(field)) return formatEntityValue(val);   
            return String(val);
        };

        [...invoiceHistory, ...entryHistory].forEach((record) => {
            if (!record) return;

            const field = record.Field;
            const createdDate = record.CreatedDate;
            if (!field || field.toLowerCase() === 'created') return;
            if (field === 'Services_Id_List__c') return;
            //if (isRecordId(record.OldValue) || isRecordId(record.NewValue)) return;
            if (entityFields.has(field)) {
                const resolvedOld = formatEntityValue(record.OldValue);
                const resolvedNew = formatEntityValue(record.NewValue);
                if (isEntityCodeFormat(resolvedOld) || isEntityCodeFormat(resolvedNew)) return;
            }
            if (!entityFields.has(field) && (isRecordId(record.OldValue) || isRecordId(record.NewValue))) return;
            if ((field === 'Comments__c' || field === 'Notes__c') && seenCommentsNotes.has(field)) return;
            if (field === 'Comments__c' || field === 'Notes__c') seenCommentsNotes.add(field);

            const oldVal = formatValue(record.OldValue, field);
            const newVal = formatValue(record.NewValue, field);
            const keyOld = `${field}-${createdDate}-${oldVal}`;
            const keyNew = `${field}-${createdDate}-${newVal}`;
            if (seenFieldTimeValues.has(keyOld) || seenFieldTimeValues.has(keyNew)) return;
            seenFieldTimeValues.add(keyOld);
            seenFieldTimeValues.add(keyNew);

            combinedHistory.push({
                sno: sno++,
                fieldName: (this.fieldLabelMap && this.fieldLabelMap[field]) || field || 'Unknown Field',
                oldValue: oldVal,
                newValue: newVal,
                modifiedBy: (record.CreatedBy && record.CreatedBy.Name) || '—',
                modifiedDate: formatDateTime(createdDate)
            });
        });

        combinedHistory.sort((a, b) => new Date(a.modifiedDate) - new Date(b.modifiedDate));
        combinedHistory = combinedHistory.map((record, index) => ({ ...record, sno: index + 1 }));

        this.historyRowsAll = combinedHistory;
        this.totalRecordsHistory = combinedHistory.length;
        this.pageNumberHistory = 1;
        this.pageSizeHistory = 10;
        this.paginationVisibleHistory = this.totalRecordsHistory > 0;
        this.paginationHelperHistory();
    }

    get bDisableFirstHistory() { return this.pageNumberHistory == 1; }
    get bDisableLastHistory() { return this.pageNumberHistory == this.totalPagesHistory; }

    handleRecordsPerPageHistory(event) {
        this.pageSizeHistory = event.target.value;
        this.paginationHelperHistory();
    }
    previousPageHistory() { this.pageNumberHistory -= 1; this.paginationHelperHistory(); }
    nextPageHistory() { this.pageNumberHistory += 1; this.paginationHelperHistory(); }
    firstPageHistory() { this.pageNumberHistory = 1; this.paginationHelperHistory(); }
    lastPageHistory() { this.pageNumberHistory = this.totalPagesHistory; this.paginationHelperHistory(); }

    paginationHelperHistory() {
        this.historyRows = [];
        this.totalPagesHistory = Math.ceil(this.totalRecordsHistory / this.pageSizeHistory);
        if (this.pageNumberHistory <= 1) this.pageNumberHistory = 1;
        else if (this.pageNumberHistory >= this.totalPagesHistory) this.pageNumberHistory = this.totalPagesHistory;

        const startIdx = (this.pageNumberHistory - 1) * this.pageSizeHistory;
        const endIdx = this.pageNumberHistory * this.pageSizeHistory;
        const pageData = [];
        for (let i = startIdx; i < endIdx && i < this.totalRecordsHistory; i++) {
            pageData.push(Object.assign({}, this.historyRowsAll[i]));
        }
        this.historyRows = pageData;
    }

    // ---------- ORG / LEDGER DATA ----------

    handleInvoiceData() {
        organizationDetailsForRoster().then(response => {
            this.invoiceData = response.listofPriceBook;
            this.bank = response.listofPriceBook.Bank__c;
            this.accountNo = response.listofPriceBook.Account_Number__c;
            this.accountName = response.listofPriceBook.Account_Name__c;
            this.bsb = response.listofPriceBook.BSB__c;
            this.orgName = response.listofPriceBook.Name;
            this.abn = response.listofPriceBook.ABN__c;
            this.orgLogo = response.bolbdata;
            this.selectedFormat = response.listofPriceBook.Invoice_Format__c;  
            console.log('this.selectedFormat',this.selectedFormat); 
            // this.formats = this.formats.map(format => ({
            //     ...format,
            //     isDefault: format.id === this.selectedFormat
            // }));       
        });
    }

    fetchLedgerItems() {
        console.log('fetchLedgerItems  called');
        getAllLedgerItems({ companyId: this.companyId })
            .then(result => {
                console.log(' Result in fetchLedgerItems  ',JSON.stringify(result));
                this.ledgerItems = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name
                }));
                this.FilteredLedgerItems = this.ledgerItems;
                console.log(' FilteredLedgerItems in fetchLedgerItems  ',JSON.stringify(this.FilteredLedgerItems ));
            })
            .catch(error => {
                this.errorMessage = 'Error fetching ledger items: ' + error.body?.message;
            });
    }

    //readInvoiceDetails() {
        //let originalDate = new Date(this.edate);
        // let increased = new Date(originalDate);
        // increased.setDate(increased.getDate() + 1);
        // this.edate = increased.toISOString().slice(0, 10);
        // setTimeout(() => {
        //     let decreased = new Date(increased);
        //     decreased.setDate(decreased.getDate() - 1);
        //     this.edate = decreased.toISOString().slice(0, 10);
        // }, 200);
    //}

    stopPropagation(event) {
        event.stopPropagation();
    }

    // ---------- SAVE / SUBMIT ----------

    handleSave() {
        if (!this.validateInvoiceForm()) {
            return;
        }
        if (this.editflag) {
            this.pendingSaveAction = 'save';
            this.isAckChecked = false;
            this.chkLabel = 'I, ' + this.currentUser + ', acknowledge that I have made changes to this invoice';
            this.showAcknowledgementModal = true;
            return;
        }
        this.processSaveOrSubmit();
    }

    handleSubmit() {
        if (this.salesEntry.Status === 'Issued' && this.editflag === true) {
            this.salesEntry.Status = 'Issued';
        } else if (this.salesEntry.Status === 'Draft' && this.editflag === true) {
            this.salesEntry.Status = 'Issued';
        } else if (this.salesEntry.Status === 'Draft' && this.editflag === false) {
            this.salesEntry.Status = 'Issued';
        } else if (this.salesEntry.Status === 'Issued' && this.editflag === false) {
            this.salesEntry.Status = 'Issued';
        }
        if (!this.validateInvoiceForm()) {
            return;
        }
        if (this.editflag) {
            this.pendingSaveAction = 'submit';
            this.isAckChecked = false;
            this.chkLabel = 'I, ' + this.currentUser + ', acknowledge that I have made changes to this invoice';
            this.showAcknowledgementModal = true;
            return;
        }
        this.processSaveOrSubmit();
    }
    handleAckCheckboxChange(event) {
        this.isAckChecked = event.target.checked;
    }

    hideAcknowledgementModal() {
        this.showAcknowledgementModal = false;
        this.isAckChecked = false;
        this.pendingSaveAction = null;
    }

    async confirmAcknowledgement() {
        if (!this.isAckChecked) {
            this.showToast('Error', 'Please acknowledge before continuing.', 'error');
            return;
        }
        this.showAcknowledgementModal = false;
        const action = this.pendingSaveAction;
        this.pendingSaveAction = null;
        this.isAckChecked = false;

        await this.processSaveOrSubmit();
    }

    get isConfirmDisabled() {
        return !this.isAckChecked;
    }

    get currentUserLabelForAck() {
        return this.staffNameToDisplay || '';
    }
    validateInvoiceForm() {
        this.recalculateTotals();

        console.log('salesEntry at validation:', JSON.stringify(this.salesEntry));
        console.log('amountarrey at validation:', JSON.stringify(this.amountarrey)); 
        // if (
            
        //     !this.salesEntry.participantID ||
        //     !this.salesEntry.entityName ||
        //     !this.salesEntry.InvoiceDate ||
        //     !this.salesEntry.dueDate ||
        //     !this.salesEntry.PostDate ||
        //     !this.salesEntry.Status
        // ) {
        //     this.showToast('Error', 'Please enter the required fields.', 'error');
        //     return false;
        // }
        if (!this.salesEntry.participantID) {
            this.showToast('Error', 'Please select a Participant.', 'error');
            return false;
        }
        if (!this.salesEntry.entityName) {
            this.showToast('Error', 'Please select an Entity.', 'error');
            return false;
        }
        if (!this.salesEntry.InvoiceDate) {
            this.showToast('Error', 'Please enter the Invoice Date.', 'error');
            return false;
        }
        if (!this.salesEntry.PostDate) {
            this.showToast('Error', 'Please enter the Post Date.', 'error');
            return false;
        }
        if (!this.salesEntry.dueDate) {
            this.showToast('Error', 'Please enter the Due Date.', 'error');
            return false;
        }
        
        if (!this.salesEntry.Status) {
            this.showToast('Error', 'Please select a Status.', 'error');
            return false;
        }
        if (!this.validateDateOrder()) {
            return false;
        }
        const missingSupportItem = this.salesEntryList.some(row => !row.lineItems);
        const missingDescription = this.salesEntryList.some(row => !row.Description__c);

        if (missingSupportItem) {
            this.showToast('Error', 'Please enter Support Item for every line item.', 'error');
            return false; 
        }
        if (missingDescription) {
            this.showToast('Error', 'Please enter Description for every line item.', 'error');
            return false; 
        }
        if(this.accountingService === 'Tesseract System'){
            const missingAccountList = this.salesEntryList.some(row => !row.accountList);
           // const missingTax = this.salesEntryList.some(row => !row.tax);
            if (missingAccountList) {
                this.showToast('Error', 'Please select Account List for every line item.', 'error');
                return false; 
            }
            // if (missingTax) {
            //     this.showToast('Error', 'Please select Tax for every line item.', 'error');
            //     return false; 
            // }
        }
        return true;
    }

    async processSaveOrSubmit() {
        
       
        if (this.accountingService === 'Tesseract System') {
            await this.processAccountingSaveOrSubmit();
        } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
            await this.processXeroSaveOrSubmit();
        } else {
            console.warn('Unhandled accountingService in processSaveOrSubmit:', this.accountingService);
            this.showToast('Error', 'Unable to save: unrecognized accounting service.', 'error');
        }
    }

    async processAccountingSaveOrSubmit() {
        const isUpdate = !!this.salesEntry.invoiceId;
        this.dispatchEvent(new CustomEvent('savestart'));

        try {
            if (this.deletedRowIds && this.deletedRowIds.length > 0) {
                await deleteMatchingRecordsRfq({ deletedIdsJson: JSON.stringify(this.deletedRowIds) });
                this.deletedRowIds = [];
            }

            const result = await saveUpdateManageInvoice({
                salesEntryJson: JSON.stringify(this.salesEntry),
                salesEntryListJson: JSON.stringify(this.salesEntryList),
                amountEntryJson: JSON.stringify(this.amountarrey),
                acknowledgedByName: isUpdate ? this.currentUser : null
            });

            const tempInvoiceId = result.Id;

            // if (isUpdate) {
            //     this.showToast('Success', 'Invoice updated successfully', 'success');
            // } else {
            //     this.salesEntry.Status = 'Draft';
            //     this.showToast('Success', 'Invoice created successfully', 'success');
            // }

            const response = await getAccountingInvoiceById({ invoiceId: tempInvoiceId });
            this.invRecords = response;
            await this.generateBase64Data();

            setTimeout(() => { this.companyId = this.salesEntry.company; }, 0);

            const status = this.invRecords[0].Status__c;
            // this.emailSentConfirmation = status !== 'Draft';
            this.emailSentConfirmation = status === 'Issued';
            if (this.emailSentConfirmation) this.invoiceIdforEmail = tempInvoiceId;

            // this.readInvoiceDetails();
            this.isInvoiceflag = false;
            this.dispatchEvent(new CustomEvent('close', { detail: { invoiceId: tempInvoiceId, isUpdate, cancelled: false } }));
        } catch (error) {
            console.error('Error in processAccountingSaveOrSubmit:', error);
            this.dispatchEvent(new CustomEvent('saveerror', {
                detail: { message: error.body?.message || 'Invoice save failed.' }
            }));
        }
    }

    async processXeroSaveOrSubmit() {
        const isUpdate = !!this.salesEntry.invoiceId;
         const normalizedEntryList = this.salesEntryList.map(row => ({
            ...row,
            tax: (row.tax && row.tax.trim()) ? row.tax : '0%'
        }));
        this.dispatchEvent(new CustomEvent('savestart'));

        try {
            if (this.deletedRowIds && this.deletedRowIds.length > 0) {
                await deleteMatchingXeroRecords({ deletedIdsJson: JSON.stringify(this.deletedRowIds) });
                this.deletedRowIds = [];
            }

            const result = await createUpdateManualXeroInvoice({
                salesEntryJson: JSON.stringify(this.salesEntry),
                salesEntryListJson: JSON.stringify(normalizedEntryList),
                amountEntryJson: JSON.stringify(this.amountarrey),
                isParticipantInvoice: this.isParticipantInvoice,
                acknowledgedByName: isUpdate ? this.currentUser : null

            });

            const tempInvoiceId = result.Id;

            // if (isUpdate) {
            //     this.showToast('Success', 'Invoice updated successfully', 'success');
            // } else {
            //     this.salesEntry.Status = 'Draft';
            //     this.showToast('Success', 'Invoice created successfully', 'success');
            // }

            const response = await getAccountingInvoiceByIdXero({ invoiceId: tempInvoiceId });
            this.invRecords = response;
            await this.generateBase64Data();

            setTimeout(() => { this.companyId = this.salesEntry.company; }, 0);

            const status = this.invRecords[0].Status__c;
            this.emailSentConfirmation = status !== 'Draft';
            if (this.emailSentConfirmation) this.invoiceIdforEmail = tempInvoiceId;

            this.dispatchEvent(new CustomEvent('close', { detail: { invoiceId: tempInvoiceId, isUpdate , cancelled: false } }));
        } catch (error) {
            console.error('Error in processXeroSaveOrSubmit:', error);
            this.dispatchEvent(new CustomEvent('saveerror', {
                detail: { message: error.body?.message || 'Invoice save failed.' }
            }));
        }
    }

    // ---------- PDF GENERATION (common to both) ----------
    
    async generateBase64Data() {

        console.log('=================================');
        console.log('Selected Invoice Format:', this.selectedFormat);
        console.log('=================================');

        switch (this.selectedFormat) {

            case 'format1':
                await this.generateFormat1PDF();
                break;

            case 'format2':
                await this.generateFormat2PDF();
                break;

            case 'format3':
                await this.generateFormat3PDF();
                break;

            case 'format4':
                await this.generateFormat4PDF();
                break;

            case 'format5':
                await this.generateFormat5PDF();
                break;

            case 'format6':
                await this.generateFormat6PDF();
                break;

            case 'format7':
                await this.generateFormat7PDF();
                break;

            default:
                console.warn(
                    'No invoice format selected. Using Format 1.'
                );

                await this.generateFormat1PDF();
                break;
        }
    }

     async generateFormat1PDF() {
        console.log('jspdfentered');
            const { jsPDF } = window.jspdf;
            // var doc = new jsPDF();
             var doc = new window.jspdf.jsPDF();
            const invoice = this.invRecords[0];
                console.log('INVOICE RECORDS'+JSON.stringify(invoice));
   
            //var statePostalWithoutCommas = this.invRecords[0].Company__r.Address__c.replace(/,/g, " ");
           
        // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );
       
            doc.setFont("Roboto-Bold", "bold");
            //doc.setFontSize(20);
            //doc.text("DRAFT INVOICE", 20,25 );
           // doc.setTextColor(0,102,255);
           doc.setTextColor(0,0,0);
            doc.setFontSize(12);
           
            let headerY = 15; 

            if (this.orgLogo) {
                try {

                    const maxWidth = 40;
                    const maxHeight = 20;

                    // Get original logo size
                    const imgProps = doc.getImageProperties(this.orgLogo);

                    let imgWidth = imgProps.width;
                    let imgHeight = imgProps.height;

                    // Calculate scale without stretching
                    const scale = Math.min(
                        maxWidth / imgWidth,
                        maxHeight / imgHeight
                    );

                    imgWidth = imgWidth * scale;
                    imgHeight = imgHeight * scale;


                    // Center logo inside 40x20 area
                    const logoX = 10 + (maxWidth - imgWidth) / 2;
                    const logoY = 5 + (maxHeight - imgHeight) / 2;


                    doc.addImage(
                        this.orgLogo,
                        'PNG',
                        logoX,       // X
                        logoY,       // Y
                        imgWidth,    // proportional width
                        imgHeight    // proportional height
                    );


                    headerY = 30;   // text starts below logo

                } catch (e) {

                    console.log('Org logo error:', e);

                }
            }

            doc.text(this.orgName.toUpperCase(), 10, headerY); 
            //console.log('orgname '+this.orgname);    
           console.log('616');
            if (this.accountingService === 'Tesseract System') {
                doc.setTextColor(0,0,0);
                doc.setFont("Roboto-Bold", "bold");
                doc.setFontSize(12);
                doc.text("ABN: "+ invoice.Company__r.ABN__c, 10, headerY + 5);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        
            
                doc.setFontSize(10);
                doc.text(invoice.Company__r.Address_Latest__Street__s+",", 10,headerY + 10 );
                doc.text(`${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`, 10, headerY + 15);
                // doc.text("Contact: "+(invoice.Company__r.Phone_Number__c || ''), 10, headerY + 20);
                doc.text("Contact: "+invoice.Company__r.Phone_Number__c, 10, headerY + 20);
            
            } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
                doc.setTextColor(0,0,0);
                doc.setFont("Roboto-Bold", "bold");
                doc.setFontSize(12);
                doc.text("ABN: "+ invoice.Participant__r.Facility__r.ABN__c, 10, headerY + 5);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        
            
                doc.setFontSize(10);
                doc.text(invoice.Participant__r.Facility__r.Address__Street__s+",", 10,headerY + 10 );
                doc.text(`${invoice.Participant__r.Facility__r.Address__City__s} ${invoice.Participant__r.Facility__r.Address__StateCode__s} ${invoice.Participant__r.Facility__r.Address__PostalCode__s},`, 10, headerY + 15);
                //doc.text("Contact: "+(invoice.Participant__r.Facility__r.Phone__c || ''), 10, headerY + 20);
                doc.text("Contact: "+invoice.Participant__r.Facility__r.Phone__c, 10, headerY + 20);
            
            }
   
            
            let invoiceHeaderY = headerY; 
            // top  left side box start  
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
        // doc.text("Invoice Number", 150, 24);
            doc.text("TAX  INVOICE", 158, invoiceHeaderY);
            doc.setFont("Roboto-Bold", "bold");
            doc.setFontSize(12);
            doc.text(invoice.Name, 158, invoiceHeaderY + 5);
   
       
            const oldDate = invoice.Invoice_Date__c;
            const arr = oldDate.split('-');
            const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];      
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Date Issued: "+newDate, 158, invoiceHeaderY + 10);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);

            const oldDueDate = invoice.Due_Date__c || '';
            const dueArr = oldDueDate.split('-');
            const newDueDate = dueArr[2]+'/'+dueArr[1]+'/'+dueArr[0];      
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setFontSize(10);
            doc.text("Due Date: "+newDueDate, 158, invoiceHeaderY + 15);
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

            let participantStartY = taxInvoiceY + 6;

            const participant = invoice.Participant__r || {};

            // ✅ Correct participant name
            const participantName = participant.Name__c || '';
            const participantDob = participant.Date_Of_Birth__c || '';
            const formattedParticipantDob = new Date(participantDob)
                .toLocaleDateString('en-GB');
            console.log('participantDob : ',formattedParticipantDob);


            // ✅ Address in ONE LINE (comma separated)
            const participantAddress = [
                participant.Address__Street__s,
                participant.Address__City__s,
                participant.Address__StateCode__s,
                participant.Address__PostalCode__s
            ] 
        //    const participantAddress = [
        //     participant?.Facility__r?.Address__Street__s,
        //     participant?.Facility__r?.Address__City__s,
        //     participant?.Facility__r?.Address__StateCode__s,
        //     participant?.Facility__r?.Address__PostalCode__s
        // ]
            .filter(Boolean)          // removes null / undefined
            .join(', ');              // joins with commas

            // ✅ NDIS number (safe)
            const participantNDIS = participant.NDIS_Participant_ID__c || '';

            // Font size same style as Payable To
            doc.setFontSize(10);

            // Participant Name
            doc.setFont("Roboto-Bold", "bold");
            doc.text("Name", 10, participantStartY);
            doc.text(":", 55, participantStartY);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(participantName, 58, participantStartY);

            // Participant Address (single line)
            doc.setFont("Roboto-Bold", "bold");
            doc.text("DOB", 10, participantStartY + 5);
            doc.text(":", 55, participantStartY + 5);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(formattedParticipantDob, 58, participantStartY + 5, {
                maxWidth: 130   // keeps it clean on page
            });

            doc.setFont("Roboto-Bold", "bold");
            doc.text("Address", 10, participantStartY + 10);
            doc.text(":", 55, participantStartY + 10);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(participantAddress, 58, participantStartY + 10, {
                maxWidth: 130   // keeps it clean on page
            });


     
            if (participantNDIS) {
                doc.setFont("Roboto-Bold", "bold");
                doc.text("NDIS Number", 10, participantStartY + 15);
                doc.text(":", 55, participantStartY + 15);
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.text(participantNDIS, 58, participantStartY + 15);
            }

            // ✅ IMPORTANT: push table BELOW participant section
            let participantEndY = participantStartY + 21;



           
            function addFooter(doc) {
            let pageHeight = doc.internal.pageSize.height; // Get page height
            let footerY = pageHeight; // Footer position
       
            // Draw footer line
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.line(0, footerY - 12, 210, footerY - 12);
       
            // Footer text
            doc.setFontSize(10);
           /*  const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
            const img = new Image();
            img.src = logo;
           
            doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); */
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text("*Terms and Conditions apply", 10, footerY-5);
           
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
              console.log('RESULT'+JSON.stringify(result));
             console.log(
                'autoTable exists =>',
                typeof doc.autoTable
            );
            // Generating table using autoTable
            console.log('typeof doc.autoTable = ', typeof doc.autoTable);
            console.log('typeof window.autoTable = ', typeof window.autoTable);
            console.log('typeof window.jspdf.autoTable = ', typeof window.jspdf?.autoTable);
            console.log('BEFORE AUTOTABLE');
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
       console.log('AFTER AUTOTABLE');
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
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
              //  doc.text("*Terms and Conditions apply", 10, yPosition + 44);
               /*  doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.setTextColor(169, 169, 169);
                doc.text("All terms and conditions apply.", 10, yPosition + 48);
                */ doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
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
                doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
              //  doc.text("*Terms and Conditions apply", 10, yPosition + 44);
               /*  doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
                doc.setTextColor(169, 169, 169);
                doc.text("All terms and conditions apply.", 10, yPosition + 48); */
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
        
       const result1 = await uploadFile({
            base64: JSON.stringify(this.base64string),
            filename: this.invRecords[0].Name + '.pdf',
            recordId: this.invRecords[0].Id,
            obj: objectName
        });

        console.log('data in uploadFile', result1);
        

        // setTimeout(() => {

        //     // Show success toast
        //     const evt = new ShowToastEvent({
        //         title: 'Success',
        //         message: 'Invoice generated successfully.',
        //         variant: 'success',
        //         mode: 'dismissable'
        //     });

        //     this.dispatchEvent(evt);

        //     console.log('PDF generated and uploaded successfully');

        //     this.isInvoiceflag = true;
        //     this.showLoadingSpinner = false;
        //     this.selectedRecordMap = new Map();
        //     this.invRecords = [];

        //     refreshApex(this.wiredResult);
        //     refreshApex(this.wiredBulkServicesResult);

        // }, 2000);         
 
        }

        

  async generateFormat2PDF() {
    console.log('jspdfentered');

    const { jsPDF } = window.jspdf;
    // var doc = new jsPDF();
    var doc = new window.jspdf.jsPDF();
    const invoice = this.invRecords[0];

    console.log('INVOICE RECORDS' + JSON.stringify(invoice));

    // ============================================================
    // FORMAT 1 HEADER - CHANGED ONLY THIS SECTION
    // ============================================================

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setFontSize(10);

    const pageWidth = doc.internal.pageSize.getWidth();

    let headerY = 15;

    // ------------------------------------------------------------
    // LOGO
    // ------------------------------------------------------------

    if (this.orgLogo) {
        try {
            const maxWidth = 25;
            const maxHeight = 22;

            const imgProps = doc.getImageProperties(this.orgLogo);

            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            const scale = Math.min(
                maxWidth / imgWidth,
                maxHeight / imgHeight
            );

            imgWidth = imgWidth * scale;
            imgHeight = imgHeight * scale;

            const logoX = 10 + (maxWidth - imgWidth) / 2;
            const logoY = headerY + (maxHeight - imgHeight) / 2;

            doc.addImage(
                this.orgLogo,
                'PNG',
                logoX,
                logoY,
                imgWidth,
                imgHeight
            );

        } catch (e) {
            console.log('Org logo error:', e);
        }
    }

    // ------------------------------------------------------------
    // VERTICAL SEPARATOR
    // ------------------------------------------------------------

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);

    doc.line(
        38,
        headerY,
        38,
        headerY + 23
    );

    // ------------------------------------------------------------
    // COMPANY NAME
    // ------------------------------------------------------------

    const companyX = 43;

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);

    doc.text(
        this.orgName || '',
        companyX,
        headerY + 6
    );

    // ------------------------------------------------------------
    // COMPANY DETAILS
    // ------------------------------------------------------------

    if (this.accountingService === 'Tesseract System') {

        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(10);

        doc.text(
            "ABN",
            companyX,
            headerY + 11
        );

        doc.text( ":", companyX+14, headerY + 11);

        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(
            invoice.Company__r.ABN__c || '',
            companyX + 16,
            headerY + 11
        );

        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(
            "Address",
            companyX,
            headerY + 16
        );

       doc.text( ":", companyX+14, headerY + 16);

        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(
            `${invoice.Company__r.Address_Latest__Street__s || ''},${invoice.Company__r.Address_Latest__City__s || ''} ${invoice.Company__r.Address_Latest__StateCode__s || ''} ${invoice.Company__r.Address_Latest__PostalCode__s || ''}`,
            companyX + 16,
            headerY + 16,
            {
                maxWidth: 145
            }
        );

        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(
            "Contact",
            companyX,
            headerY + 21
        );
        doc.text( ":", companyX+14, headerY + 21);
         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(
            invoice.Company__r.Phone_Number__c || '',
            companyX + 16,
            headerY + 21
        );

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(
            "ABN",
            companyX,
            headerY + 11
        );

        doc.text( ":", companyX+14, headerY + 11);

         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
         
        doc.text(
            invoice.Participant__r.Facility__r.ABN__c || '',
            companyX + 16,
            headerY + 11
        );

        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(
            "Address",
            companyX,
            headerY + 16
        );

        doc.text( ":", companyX+14, headerY + 16);

         doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

        doc.text(
            `${invoice.Participant__r.Facility__r.Address__Street__s || ''},${invoice.Participant__r.Facility__r.Address__City__s || ''} ${invoice.Participant__r.Facility__r.Address__StateCode__s || ''} ${invoice.Participant__r.Facility__r.Address__PostalCode__s || ''}`,
            companyX + 16,
            headerY + 16,
            {
                maxWidth: 145
            }
        );

        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(
            "Contact",
            companyX,
            headerY + 21
        );

        doc.text( ":", companyX+14, headerY + 21);

        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(
            invoice.Participant__r.Facility__r.Phone__c || '',
            companyX + 16,
            headerY + 21
        );
    }

    // ------------------------------------------------------------
    // HEADER LINE
    // ------------------------------------------------------------

    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.3);

    doc.line(
        10,
        headerY + 29,
        pageWidth - 10,
        headerY + 29
    );

    // ------------------------------------------------------------
    // TAX INVOICE TO + INVOICE NUMBER
    // ------------------------------------------------------------

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(50, 50, 50);

    let taxInvoiceY = headerY + 39;

    doc.text(
        "Tax Invoice To:",
        10,
        taxInvoiceY
    );

    // Invoice Number - right side

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text(
        invoice.Name || '',
        pageWidth - 10,
        taxInvoiceY,
        {
            align: "right"
        }
    );

    // ------------------------------------------------------------
    // PARTICIPANT DETAILS
    // ------------------------------------------------------------

    let participantStartY = taxInvoiceY + 7;

    const participant = invoice.Participant__r || {};

    // Correct participant name
    const participantName = participant.Name__c || '';

    const participantDob = participant.Date_Of_Birth__c || '';

    let formattedParticipantDob = '';

    if (participantDob) {
        const dobDate = new Date(participantDob);

        if (!isNaN(dobDate.getTime())) {
            formattedParticipantDob =
                dobDate.toLocaleDateString('en-GB');
        }
    }

    console.log(
        'participantDob : ',
        formattedParticipantDob
    );

    // Address in ONE LINE
    const participantAddress = [
        participant.Address__Street__s,
        participant.Address__City__s,
        participant.Address__StateCode__s,
        participant.Address__PostalCode__s
    ]
        .filter(Boolean)
        .join(', ');

    // NDIS number
    const participantNDIS =
        participant.NDIS_Participant_ID__c || '';

    doc.setFontSize(9);

    // ------------------------------------------------------------
    // PARTICIPANT NAME
    // ------------------------------------------------------------

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text("Name", 10, participantStartY);
    doc.text(":", 33, participantStartY);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(participantName, 36, participantStartY, { maxWidth: 105 });

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DOB", 10, participantStartY + 5);
    doc.text(":", 33, participantStartY + 5);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(formattedParticipantDob, 36, participantStartY + 5, { maxWidth: 105 });

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Address", 10, participantStartY + 10);
    doc.text(":", 33, participantStartY + 10);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(participantAddress, 36, participantStartY + 10, { maxWidth: 105 });

    if (participantNDIS) {
        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("NDIS Number", 10, participantStartY + 15);
        doc.text(":", 33, participantStartY + 15);

        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(participantNDIS, 36, participantStartY + 15, { maxWidth: 100 });
    } 
// ------------------------------------------------------------
    // DATE ISSUED
    // ------------------------------------------------------------

  // ------------------------------------------------------------
// DATE ISSUED
// ------------------------------------------------------------

const oldDate =
    invoice.Invoice_Date__c || '';

let newDate = '';

if (oldDate) {
    const arr = oldDate.split('-');

    if (arr.length === 3) {
        newDate =
            arr[2] + '/' +
            arr[1] + '/' +
            arr[0];
    }
}

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);

doc.text(
    "Date Issued",
    159,
    participantStartY + 5
);

doc.text(
    ":",
    179,
    participantStartY + 5
);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

doc.text(
    newDate,
    200,
    participantStartY + 5,
    {
        align: "right"
    }
);

// ------------------------------------------------------------
// DUE DATE
// ------------------------------------------------------------

const oldDueDate =
    invoice.Due_Date__c || '';

let newDueDate = '';

if (oldDueDate) {
    const dueArr = oldDueDate.split('-');

    if (dueArr.length === 3) {
        newDueDate =
            dueArr[2] + '/' +
            dueArr[1] + '/' +
            dueArr[0];
    }
}

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);

doc.text(
    "Due Date",
    159,
    participantStartY + 10
);

doc.text(
    ":",
    179,
    participantStartY + 10
);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

doc.text(
    newDueDate,
    200,
    participantStartY + 10,
    {
        align: "right"
    }
);
    // IMPORTANT: push table BELOW participant section
    let participantEndY =
        participantStartY + 21;

    // ============================================================
    // FROM HERE DOWN - YOUR ORIGINAL CODE
    // ============================================================

     function addFooter(doc) {
        let pageHeight = doc.internal.pageSize.height;
        let footerY = pageHeight;

        // Draw footer line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(0, footerY - 12, 210, footerY - 12);

        // Footer text
        doc.setFontSize(10);
       /*  const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
        const img = new Image();
        img.src = logo;

        doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); */

        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("*Terms and Conditions apply", 10, footerY - 5);

        // Centered Footer Text
        doc.setFontSize(10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("Office Use Only", 90, footerY - 5);

        // Page Number
        doc.setFontSize(10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(`${doc.internal.getNumberOfPages()}`, 200, footerY - 5);
    } 

    let yPosition = participantEndY + 6; // spacing before table

    // let yPosition = 82;
    var result = [];
    var subTotal = 0;
    let tabledata = [];

    if (this.accountingService === 'Tesseract System') {
        tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
        console.log('INVOICE in Accounting ' + JSON.stringify(tabledata));
    } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
        tabledata = this.invRecords[0].Xero_Invoice_Entries__r;
        console.log('INVOICE in Xero ' + JSON.stringify(tabledata));
    }

    tabledata.forEach(record => {
        console.log('record.Service_Cancel_Payment__c : ', record.Service_Cancel_Payment__c);
        console.log('record.Total_Amount__c : ', record.Total_Amount__c);

        const isCancelled = record.Service_Cancel__c === true;

        const qtyValue = isCancelled ? "-" : record.Quantity__c.toFixed(2);

        const unitPriceValue = isCancelled
            ? "-"
            : record.Unit_Price__c.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
            });

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
        subTotal += isCancelled
            ? Number(record.Service_Cancel_Payment__c || 0)
            : record.Total_Amount__c;

        result.push([
            record.Line_Items__c,
            record.Description__c,
            qtyValue,
            unitPriceValue,
            record.Tax__c + '%',
            amountValue
        ]);
    });

    console.log(' record RESULT' + JSON.stringify(result));

    // Adding subtotal, GST, and total rows
    result.push([
        {
            content: "*Taxes are Exclusive",
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
        '$' + invoice.GST__c.toFixed(2)
    ]);

    result.push([
        "",
        "",
        "",
        "",
        "Total:",
        '$' + invoice.Total_Amount__c.toFixed(2)
    ]);

    console.log('RESULT' + JSON.stringify(result));
    console.log('RESULT' + JSON.stringify(result));

    console.log(
        'autoTable exists =>',
        typeof doc.autoTable
    );

    // Generating table using autoTable
    console.log('typeof doc.autoTable = ', typeof doc.autoTable);
    console.log('typeof window.autoTable = ', typeof window.autoTable);
    console.log('typeof window.jspdf.autoTable = ', typeof window.jspdf?.autoTable);
    console.log('BEFORE AUTOTABLE');

    doc.autoTable({
        startY: yPosition, // Starting Y position
        head: [["Support Item", "Description", "Qty", "Rate", "Tax", "Amount"]],
        body: result,
        theme: "plain",
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: "Roboto-Bold",
            fontStyle: "bold",
        },

        bodyStyles: {
            font: "Helvetica",
            font: "Roboto-VariableFont_wdth,wght",
            fontStyle: "normal",
        },

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
            if (["Total:"].includes(columnText)) {
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
                    doc.line(
                        cell.x,
                        cell.y,
                        cell.x + cell.width,
                        cell.y
                    );
                }

                // Bottom border (for normal rows and total row)
                if (rowIndex < totalRowsCount - 1) {
                    doc.line(
                        cell.x,
                        cell.y + cell.height,
                        cell.x + cell.width,
                        cell.y + cell.height
                    );
                }
            }

            if (columnText === "Total:") {
                doc.setDrawColor(0, 0, 0); // Black border
                doc.setLineWidth(0.2);

                if (data.column.index === 4 || data.column.index === 5) {

                    // Top border
                    doc.line(
                        cell.x,
                        cell.y,
                        cell.x + cell.width,
                        cell.y
                    );

                    // Bottom border
                    doc.line(
                        cell.x,
                        cell.y + cell.height,
                        cell.x + cell.width,
                        cell.y + cell.height
                    );
                }
            }
        },

        didDrawPage: function (data) {

            // Always add the footer on each page
            addFooter(data.doc);
        }
    });

    console.log('AFTER AUTOTABLE');

    let finalYPosition = doc.lastAutoTable.finalY;

    // addFooter(doc);

    let availableSpace = doc.internal.pageSize.height - finalYPosition;

    console.log('available Space ' + availableSpace);

   if (availableSpace > 100) {

    yPosition = finalYPosition + 35;

    doc.setFontSize(10);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("Bank Details", 10, yPosition);

    doc.setFont("Roboto-Bold", "bold");

    doc.text("Bank", 10, yPosition + 8);

    doc.text(":", 38, yPosition + 8);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.bank || " ", 43, yPosition + 8);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("Account Name", 10, yPosition + 14);

    doc.text(":", 38, yPosition + 14);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.accountName || " ", 43, yPosition + 14);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("BSB", 10, yPosition + 20);

    doc.text(":", 38, yPosition + 20);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.bsb || " ", 43, yPosition + 20);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("Account Number", 10, yPosition + 26);

    doc.text(":", 38, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.accountNo || " ", 43, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    
    addFooter(doc);
   // doc.text("*Terms and Conditions apply", 10, yPosition + 46);

   /*  doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.setTextColor(50, 50, 50);

    doc.text("All terms and conditions apply.", 45, yPosition + 46);
 */
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

} else {

    doc.addPage();

    yPosition = 25;

    doc.setFontSize(10);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("Bank Details", 10, yPosition);

    doc.setFont("Roboto-Bold", "bold");

    doc.text("Bank", 10, yPosition + 8);

    doc.text(":", 38, yPosition + 8);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.bank || " ", 43, yPosition + 8);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("Account Name", 10, yPosition + 14);

    doc.text(":", 38, yPosition + 14);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.accountName || " ", 43, yPosition + 14);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("BSB", 10, yPosition + 20);

    doc.text(":", 38, yPosition + 20);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.bsb || " ", 43, yPosition + 20);

    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text("Account Number", 10, yPosition + 26);

    doc.text(":", 38, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(this.accountNo || " ", 43, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    

    //doc.text("*Terms and Conditions apply", 10, yPosition + 46);

   /*  doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.setTextColor(50, 50, 50);

    doc.text("All terms and conditions apply.", 45, yPosition + 46); */
    addFooter(doc);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
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

    const result1 = await uploadFile({
        base64: JSON.stringify(this.base64string),
        filename: this.invRecords[0].Name + '.pdf',
        recordId: this.invRecords[0].Id,
        obj: objectName
    });

    console.log('data in uploadFile', result1);

    // setTimeout(() => {

    //     // Show success toast
    //     const evt = new ShowToastEvent({
    //         title: 'Success',
    //         message: 'Invoice generated successfully.',
    //         variant: 'success',
    //         mode: 'dismissable'
    //     });

    //     this.dispatchEvent(evt);

    //     console.log('PDF generated and uploaded successfully');

    //     this.isInvoiceflag = true;
    //     this.showLoadingSpinner = false;
    //     this.selectedRecordMap = new Map();
    //     this.invRecords = [];

    //     refreshApex(this.wiredResult);
    //     refreshApex(this.wiredBulkServicesResult);

    // }, 2000);
}

async generateFormat3PDF() {
    console.log('jspdfentered');

    const { jsPDF } = window.jspdf;
    // var doc = new jsPDF();
    var doc = new window.jspdf.jsPDF();
    const invoice = this.invRecords[0];

    console.log('INVOICE RECORDS' + JSON.stringify(invoice));

    // ============================================================
    // FORMAT 3 HEADER - ONLY THIS SECTION IS CHANGED
    // ============================================================

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);

    const contentLeft = 10;
    const contentRight = 200;

    let headerY = 20;

    // ============================================================
    // COMPANY DETAILS - LEFT
    // ============================================================

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 102, 51);

    doc.text(
        this.orgName || '',
        contentLeft,
        headerY
    );

    if (this.accountingService === 'Tesseract System') {

    // ABN
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);

    doc.text("ABN", contentLeft, headerY + 5);
    doc.text(":", contentLeft + 14, headerY + 5);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Company__r.ABN__c || '',
        contentLeft + 16,
        headerY + 5
    );

    // Address
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Address", contentLeft, headerY + 10);
    doc.text(":", contentLeft + 14, headerY + 10);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    const companyAddress =
        `${invoice.Company__r.Address_Latest__Street__s || ''},${invoice.Company__r.Address_Latest__City__s || ''} ${invoice.Company__r.Address_Latest__StateCode__s || ''} ${invoice.Company__r.Address_Latest__PostalCode__s || ''}`;

    doc.text(
        companyAddress,
        contentLeft + 16,
        headerY + 10,
        {
            maxWidth: 130
        }
    );

    // Contact
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Contact", contentLeft, headerY + 15);
    doc.text(":", contentLeft + 14, headerY + 15);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Company__r.Phone_Number__c || '',
        contentLeft + 16,
        headerY + 15
    );

} else if (
    this.accountingService === 'Xero' ||
    this.accountingService === 'MYOB'
) {

    // ABN
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);

    doc.text("ABN", contentLeft, headerY + 5);
    doc.text(":", contentLeft + 14, headerY + 5);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Participant__r.Facility__r.ABN__c || '',
        contentLeft + 16,
        headerY + 5
    );

    // Address
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Address", contentLeft, headerY + 10);
    doc.text(":", contentLeft + 14, headerY + 10);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    const facilityAddress =
        `${invoice.Participant__r.Facility__r.Address__Street__s || ''},${invoice.Participant__r.Facility__r.Address__City__s || ''} ${invoice.Participant__r.Facility__r.Address__StateCode__s || ''} ${invoice.Participant__r.Facility__r.Address__PostalCode__s || ''}`;

    doc.text(
        facilityAddress,
        contentLeft + 16,
        headerY + 10,
        {
            maxWidth: 130
        }
    );

    // Contact
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Contact", contentLeft, headerY + 15);
    doc.text(":", contentLeft + 14, headerY + 15);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Participant__r.Facility__r.Phone__c || '',
        contentLeft + 16,
        headerY + 15
    );
}

    // ============================================================
    // LOGO - RIGHT
    // ============================================================

    if (this.orgLogo) {
        try {
            const maxWidth = 40;
            const maxHeight = 25;

            const imgProps =
                doc.getImageProperties(this.orgLogo);

            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            const scale = Math.min(
                maxWidth / imgWidth,
                maxHeight / imgHeight
            );

            imgWidth = imgWidth * scale;
            imgHeight = imgHeight * scale;

            const logoX =
                contentRight - imgWidth;

            const logoY =
                headerY - 8 +
                (maxHeight - imgHeight) / 2;

            doc.addImage(
                this.orgLogo,
                'PNG',
                logoX,
                logoY,
                imgWidth,
                imgHeight
            );

        } catch (e) {
            console.log('Org logo error:', e);
        }
    }

    // ============================================================
    // HEADER LINE
    // SAME WIDTH AS TABLE
    // ============================================================

    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.3);

    doc.line(
        contentLeft,
        headerY + 24,
        contentRight,
        headerY + 24
    );

    // ============================================================
    // TAX INVOICE TO
    // ============================================================

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(50, 50, 50);

    let taxInvoiceY =
        headerY + 34;

    doc.text(
        "Tax Invoice To:",
        contentLeft,
        taxInvoiceY
    );

    // ============================================================
    // INVOICE NUMBER - RIGHT
    // ============================================================

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(0, 0, 0);

    doc.text(
        invoice.Name || '',
        contentRight,
        taxInvoiceY + 2,
        {
            align: "right"
        }
    );

    // ============================================================
    // PARTICIPANT DETAILS
    // ============================================================

    let participantStartY =
        taxInvoiceY + 7;

    const participant =
        invoice.Participant__r || {};

    // Correct participant name
    const participantName =
        participant.Name__c || '';

    const participantDob =
        participant.Date_Of_Birth__c || '';

    const formattedParticipantDob =
        participantDob
            ? new Date(participantDob)
                .toLocaleDateString('en-GB')
            : '';

    console.log(
        'participantDob : ',
        formattedParticipantDob
    );

    // Address in ONE LINE
    const participantAddress = [
        participant.Address__Street__s,
        participant.Address__City__s,
        participant.Address__StateCode__s,
        participant.Address__PostalCode__s
    ]
        .filter(Boolean)
        .join(', ');

    // NDIS number
    const participantNDIS =
        participant.NDIS_Participant_ID__c || '';


    // ============================================================
    // PARTICIPANT NAME
    // ============================================================
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text("Name", 10, participantStartY);
    doc.text(":", 33, participantStartY);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(participantName, 36, participantStartY, { maxWidth: 105 });

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text("DOB", 10, participantStartY + 5);
    doc.text(":", 33, participantStartY + 5);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(formattedParticipantDob, 36, participantStartY + 5, { maxWidth: 105 });

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text("Address", 10, participantStartY + 10);
    doc.text(":", 33, participantStartY + 10);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(participantAddress, 36, participantStartY + 10, { maxWidth: 105 });

    if (participantNDIS) {
        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);

        doc.text("NDIS Number", 10, participantStartY + 15);
        doc.text(":", 33, participantStartY + 15);

        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(participantNDIS, 36, participantStartY + 15, { maxWidth: 100 });
    }  

  // ============================================================
    // DATE ISSUED - RIGHT
    // ============================================================

    const oldDate = 
        invoice.Invoice_Date__c || ''; 

    let newDate = ''; 

    if (oldDate) { 
        const arr = 
            oldDate.split('-'); 
    
        if (arr.length === 3) { 
            newDate = 
                arr[2] + '/' + 
                arr[1] + '/' + 
                arr[0]; 
        } 
    } 
    
    doc.setTextColor(0, 0, 0); 
    
    doc.setFont( 
        "Roboto-Bold", 
        "bold" 
    ); 
    
    doc.text( 
        "Date Issued", 
        156, 
        participantStartY + 5 
    ); 
    
    doc.text( 
        ":", 
        178, 
        participantStartY + 5 
    ); 
    
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal"); 
    
    doc.text( 
        newDate, 
        200, 
        participantStartY + 5, 
        { 
            align: "right" 
        } 
    ); 
 
// ============================================================ 
// DUE DATE - RIGHT 
// ============================================================ 
 
const oldDueDate = 
    invoice.Due_Date__c || ''; 
 
let newDueDate = ''; 
 
if (oldDueDate) { 
    const dueArr = 
        oldDueDate.split('-'); 
 
    if (dueArr.length === 3) { 
        newDueDate = 
            dueArr[2] + '/' + 
            dueArr[1] + '/' + 
            dueArr[0]; 
    } 
} 
 
doc.setTextColor(0, 0, 0); 
 
doc.setFont( 
    "Roboto-Bold", 
    "bold" 
); 
 
doc.text( 
    "Due Date", 
    156, 
    participantStartY + 10 
); 
 
doc.text( 
    ":", 
    178, 
    participantStartY + 10 
); 
 
doc.setFont("Roboto-VariableFont_wdth,wght", "normal"); 
 

 
doc.text( 
    newDueDate, 
    200, 
    participantStartY + 10, 
    { 
        align: "right" 
    } 
);
    // ============================================================
    // IMPORTANT:
    // PUSH TABLE BELOW PARTICIPANT SECTION
    // ============================================================

    let participantEndY =
        participantStartY + 21;

    // ============================================================
    // FROM HERE DOWN = ORIGINAL CODE
    // ============================================================

    function addFooter(doc) {
        let pageHeight = doc.internal.pageSize.height; // Get page height
        let footerY = pageHeight; // Footer position

        // Draw footer line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(0, footerY - 12, 210, footerY - 12);

        // Footer text
        doc.setFontSize(10);
      /*   const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
        const img = new Image();
        img.src = logo; */

       // doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("*Terms and Conditions apply", 10, footerY - 5);

        // Centered Footer Text
        doc.setFontSize(10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("Office Use Only", 90, footerY - 5);

        // Page Number
        doc.setFontSize(10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(`${doc.internal.getNumberOfPages()}`, 200, footerY - 5);
    }

    let yPosition = participantEndY + 6; // spacing before table

    // let yPosition = 82;
    var result = [];
    var subTotal = 0;
    let tabledata = [];

    if (this.accountingService === 'Tesseract System') {
        tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
        console.log('INVOICE in Accounting ' + JSON.stringify(tabledata));
    } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
        tabledata = this.invRecords[0].Xero_Invoice_Entries__r;
        console.log('INVOICE in Xero ' + JSON.stringify(tabledata));
    }

    tabledata.forEach(record => {
        console.log('record.Service_Cancel_Payment__c : ', record.Service_Cancel_Payment__c);
        console.log('record.Total_Amount__c : ', record.Total_Amount__c);

        const isCancelled = record.Service_Cancel__c === true;

        const qtyValue = isCancelled ? "-" : record.Quantity__c.toFixed(2);

        const unitPriceValue = isCancelled
            ? "-"
            : record.Unit_Price__c.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
            });

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
        subTotal += isCancelled
            ? Number(record.Service_Cancel_Payment__c || 0)
            : record.Total_Amount__c;

        result.push([
            record.Line_Items__c,
            record.Description__c,
            qtyValue,
            unitPriceValue,
            record.Tax__c + '%',
            amountValue
        ]);
    });

    console.log(' record RESULT' + JSON.stringify(result));

    // Adding subtotal, GST, and total rows
    result.push([
        {
            content: "*Taxes are Exclusive",
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
        '$' + invoice.GST__c.toFixed(2)
    ]);

    result.push([
        "",
        "",
        "",
        "",
        "Total:",
        '$' + invoice.Total_Amount__c.toFixed(2)
    ]);

    console.log('RESULT' + JSON.stringify(result));
    console.log('RESULT' + JSON.stringify(result));

    console.log(
        'autoTable exists =>',
        typeof doc.autoTable
    );

    // Generating table using autoTable
    console.log('typeof doc.autoTable = ', typeof doc.autoTable);
    console.log('typeof window.autoTable = ', typeof window.autoTable);
    console.log('typeof window.jspdf.autoTable = ', typeof window.jspdf?.autoTable);
    console.log('BEFORE AUTOTABLE');

    doc.autoTable({
        startY: yPosition, // Starting Y position
        head: [["Support Item", "Description", "Qty", "Rate", "Tax", "Amount"]],
        body: result,
        theme: "plain",
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: "Roboto-Bold",
            fontStyle: "bold",
        },
        bodyStyles: {
            font: "Helvetica",
            font: "Roboto-VariableFont_wdth,wght",
            fontStyle: "normal",
        },
        columnStyles: {
            1: { cellWidth: 50, halign: "left" },
            2: { cellWidth: 25, halign: "left" },
            3: { cellWidth: 20, halign: "left" },
            4: { cellWidth: 20, halign: "right" },
            5: { cellWidth: 35, halign: "right" },
            6: { cellWidth: 35, halign: "right" }
        },

        didParseCell: function (data) {
            var columnText = data.row.raw[3];

            if (data.row.index === 0) {
                if (data.column.index === 4 || data.column.index === 5) {
                    data.cell.styles.halign = "right";
                } else {
                    data.cell.styles.halign = "left";
                }
            }

            // Make Sub Total, Total GST, and Total bold
            if (["Total:"].includes(columnText)) {
                data.cell.styles.font = "Roboto-Bold";
                data.cell.styles.fontStyle = "bold";
            }
        },

        didDrawCell: function (data) {
            var doc = data.doc;
            var cell = data.cell;
            var rowIndex = data.row.index;
            var totalRowsCount = result.length;

            // Get the text of the fourth column (index 3) to check row type
            var columnText = data.row.raw[4];

            // Apply border only to normal rows & total row
            if (!["Sub Total:", "Total GST:"].includes(columnText)) {
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);

                // Top border
                if (rowIndex === 0) {
                    doc.line(
                        cell.x,
                        cell.y,
                        cell.x + cell.width,
                        cell.y
                    );
                }

                // Bottom border
                if (rowIndex < totalRowsCount - 1) {
                    doc.line(
                        cell.x,
                        cell.y + cell.height,
                        cell.x + cell.width,
                        cell.y + cell.height
                    );
                }
            }

            if (columnText === "Total:") {
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);

                if (data.column.index === 4 || data.column.index === 5) {

                    // Top border
                    doc.line(
                        cell.x,
                        cell.y,
                        cell.x + cell.width,
                        cell.y
                    );

                    // Bottom border
                    doc.line(
                        cell.x,
                        cell.y + cell.height,
                        cell.x + cell.width,
                        cell.y + cell.height
                    );
                }
            }
        },

        didDrawPage: function (data) {
            // Always add the footer on each page
            addFooter(data.doc);
        }
    });

    console.log('AFTER AUTOTABLE');

    let finalYPosition = doc.lastAutoTable.finalY;

    // addFooter(doc);

    let availableSpace = doc.internal.pageSize.height - finalYPosition;
    console.log('available Space ' + availableSpace);

     if (availableSpace > 100) {
    yPosition = finalYPosition + 35;
    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank Details", 10, yPosition);

    doc.setFont("Roboto-Bold", "bold");
    doc.text("Bank", 10, yPosition + 8);
    doc.text(":", 38, yPosition + 8);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bank || " ", 42, yPosition + 8);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Name", 10, yPosition + 14);
    doc.text(":", 38, yPosition + 14);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountName || " ", 42, yPosition + 14);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("BSB", 10, yPosition + 20);
    doc.text(":", 38, yPosition + 20);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bsb || " ", 42, yPosition + 20);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Number", 10, yPosition + 26);
    doc.text(":", 38, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountNo || " ", 42, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

   // doc.text("*Terms and Conditions apply", 10, yPosition + 86);

    /* 
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text("All terms and conditions apply.", 45, yPosition + 46);
    */

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    addFooter(doc);

} else {
    doc.addPage();
    yPosition = 25;
    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank Details", 10, yPosition);

    doc.setFont("Roboto-Bold", "bold");
    doc.text("Bank", 10, yPosition + 8);
    doc.text(":", 38, yPosition + 8);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bank || " ", 42, yPosition + 8);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Name", 10, yPosition + 14);
    doc.text(":", 38, yPosition + 14);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountName || " ", 42, yPosition + 14);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("BSB", 10, yPosition + 20);
    doc.text(":", 38, yPosition + 20);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bsb || " ", 42, yPosition + 20);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Number", 10, yPosition + 26);
    doc.text(":", 38, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountNo || " ", 42, yPosition + 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setTextColor(100, 110, 140);
   // doc.text("Terms and Conditions apply", 10, yPosition + 46);

    /* 
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text("All terms and conditions apply.", 45, yPosition + 46);
    */

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    addFooter(doc);
}

    this.base64string = btoa(doc.output());

    console.log(
        'Generated PDF Base64: ' +
        this.base64string
    );

    console.log(
        'Generated PDF Name: ' +
        this.invRecords[0].Name
    );

    console.log(
        'Generated recordId: ' +
        this.invRecords[0].Id
    );

    let objectName;

    if (this.accountingService === 'Tesseract System') {
        objectName = 'AccountingInvoice';
    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {
        objectName = 'XeroInvoice';
    }

    console.log(
        'objectName : ',
        objectName
    );

    const result1 = await uploadFile({
        base64: JSON.stringify(this.base64string),
        filename: this.invRecords[0].Name + '.pdf',
        recordId: this.invRecords[0].Id,
        obj: objectName
    });

    console.log(
        'data in uploadFile',
        result1
    );

    // setTimeout(() => {

    //     // Show success toast
    //     const evt = new ShowToastEvent({
    //         title: 'Success',
    //         message: 'Invoice generated successfully.',
    //         variant: 'success',
    //         mode: 'dismissable'
    //     });

    //     this.dispatchEvent(evt);

    //     console.log('PDF generated and uploaded successfully');

    //     this.isInvoiceflag = true;
    //     this.showLoadingSpinner = false;
    //     this.selectedRecordMap = new Map();
    //     this.invRecords = [];

    //     refreshApex(this.wiredResult);
    //     refreshApex(this.wiredBulkServicesResult);

    // }, 2000);
}

async generateFormat4PDF() {
    console.log('jspdfentered');

    const { jsPDF } = window.jspdf;
    // var doc = new jsPDF();
    var doc = new window.jspdf.jsPDF();
    const invoice = this.invRecords[0];

    console.log('INVOICE RECORDS' + JSON.stringify(invoice));

    //var statePostalWithoutCommas = this.invRecords[0].Company__r.Address__c.replace(/,/g, " ");

    // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );

    doc.setFont("Roboto-Bold", "bold");
    //doc.setFontSize(20);
    //doc.text("DRAFT INVOICE", 20,25 );
    // doc.setTextColor(0,102,255);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    // ============================================================
    // FORMAT 3 HEADER
    // ============================================================

    const contentLeft = 10;
    const contentRight = 200;

    let headerY = 15;

    // ------------------------------------------------------------
    // LOGO - LEFT
    // ------------------------------------------------------------

    if (this.orgLogo) {
        try {

            const maxWidth = 25;
            const maxHeight = 25;

            // Get original logo size
            const imgProps = doc.getImageProperties(this.orgLogo);

            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            // Calculate scale without stretching
            const scale = Math.min(
                maxWidth / imgWidth,
                maxHeight / imgHeight
            );

            imgWidth = imgWidth * scale;
            imgHeight = imgHeight * scale;

            // Center logo inside area
            const logoX =
                contentLeft +
                (maxWidth - imgWidth) / 2;

            const logoY =
                headerY +
                (maxHeight - imgHeight) / 2;

            doc.addImage(
                this.orgLogo,
                'PNG',
                logoX,
                logoY,
                imgWidth,
                imgHeight
            );

        } catch (e) {

            console.log('Org logo error:', e);

        }
    }

    // ------------------------------------------------------------
    // COMPANY DETAILS - MIDDLE
    // ------------------------------------------------------------

    const companyX = 42;

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    doc.text(
        this.orgName || '',
        companyX,
        headerY + 8
    );

    console.log('616');

    if (this.accountingService === 'Tesseract System') {

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);

    doc.text("ABN", companyX, headerY + 14);
    doc.text(":", companyX + 14, headerY + 14);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Company__r.ABN__c || '',
        companyX + 16,
        headerY + 14
    );

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Address", companyX, headerY + 19);
    doc.text(":", companyX + 14, headerY + 19);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        `${invoice.Company__r.Address_Latest__Street__s || ''},${invoice.Company__r.Address_Latest__City__s || ''} ${invoice.Company__r.Address_Latest__StateCode__s || ''} ${invoice.Company__r.Address_Latest__PostalCode__s || ''}`,
        companyX + 16,
        headerY + 19,
        {
            maxWidth: 105
        }
    );

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Contact", companyX, headerY + 24);
    doc.text(":", companyX + 14, headerY + 24);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Company__r.Phone_Number__c || '',
        companyX + 16,
        headerY + 24
    );

} else if (
    this.accountingService === 'Xero' ||
    this.accountingService === 'MYOB'
) {

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);

    doc.text("ABN", companyX, headerY + 14);
    doc.text(":", companyX + 14, headerY + 14);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Participant__r.Facility__r.ABN__c || '',
        companyX + 16,
        headerY + 14
    );

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Address", companyX, headerY + 19);
    doc.text(":", companyX + 14, headerY + 19);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        `${invoice.Participant__r.Facility__r.Address__Street__s || ''},${invoice.Participant__r.Facility__r.Address__City__s || ''} ${invoice.Participant__r.Facility__r.Address__StateCode__s || ''} ${invoice.Participant__r.Facility__r.Address__PostalCode__s || ''}`,
        companyX + 16,
        headerY + 19,
        {
            maxWidth: 105
        }
    );

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");

    doc.text("Contact", companyX, headerY + 24);
    doc.text(":", companyX + 14, headerY + 24);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        invoice.Participant__r.Facility__r.Phone__c || '',
        companyX + 16,
        headerY + 24
    );
}

    // ------------------------------------------------------------
    // INVOICE NUMBER / DATE - RIGHT
    // ------------------------------------------------------------

    let invoiceHeaderY = headerY;

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text(
        invoice.Name || '',
        contentRight,
        invoiceHeaderY + 8,
        {
            align: "right"
        }
    );

    const oldDate = invoice.Invoice_Date__c || '';
    const arr = oldDate.split('-');

    let newDate = '';

    if (arr.length === 3) {
        newDate =
            arr[2] +
            '/' +
            arr[1] +
            '/' +
            arr[0];
    }

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Date Issued",
        156,
        invoiceHeaderY + 19
    );

    doc.text(
        ":",
        178,
        invoiceHeaderY + 19
    );

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        newDate,
        200,
        invoiceHeaderY + 19,
        {
            align: "right"
        }
    );

    const oldDueDate =
        invoice.Due_Date__c || '';

    const dueArr =
        oldDueDate.split('-');

    let newDueDate = '';

    if (dueArr.length === 3) {
        newDueDate =
            dueArr[2] +
            '/' +
            dueArr[1] +
            '/' +
            dueArr[0];
    }

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Due Date",
        156,
        invoiceHeaderY + 24
    );

    doc.text(
        ":",
        178,
        invoiceHeaderY + 24
    );

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        newDueDate,
        200,
        invoiceHeaderY + 24,
        {
            align: "right"
        }
    );
    // ------------------------------------------------------------
    // HEADER LINE
    // SAME LEFT / RIGHT AS TABLE
    // ------------------------------------------------------------

    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.3);

    doc.line(
        contentLeft,
        headerY + 31,
        contentRight,
        headerY + 31
    );

    // ============================================================
    // ORIGINAL FILE REFERENCE LOGIC
    // ============================================================

    let fileReference = '';

    console.log(
        'fileReference  1 ' +
        fileReference
    );

    console.log(
        'invoice.Participant__r ==> ' +
        invoice.Participant__r
    );

    if (invoice.Participant__r) {

        // console.log('invoice.Participant__r ==> '+JSON.stringify(invoice.Participant__r ))

        // fileReference = invoice.Participant__r.First_Name__c  +' '+ invoice.Participant__r.Last_Name__c ;

        fileReference =
            invoice.Participant__r.Name__c
                ? invoice.Participant__r.Name__c
                : '';

        console.log(
            'fileReference  1 ' +
            fileReference
        );
    }

    // ============================================================
    // PARTICIPANT DATA
    // DATA IS NOW USED AT THE BOTTOM
    // ============================================================

    const participant =
        invoice.Participant__r || {};

    const participantName =
        participant.Name__c || '';

    const participantDob =
        participant.Date_Of_Birth__c || '';

    const formattedParticipantDob =
        participantDob
            ? new Date(participantDob)
                .toLocaleDateString('en-GB')
            : '';

    console.log(
        'participantDob : ',
        formattedParticipantDob
    );

    // Address in ONE LINE
    const participantAddress = [
        participant.Address__Street__s,
        participant.Address__City__s,
        participant.Address__StateCode__s,
        participant.Address__PostalCode__s
    ]
        .filter(Boolean)
        .join(', ');

    // NDIS number
    const participantNDIS =
        participant.NDIS_Participant_ID__c || '';

    // ============================================================
    // TABLE START
    // ============================================================

    // Table starts directly below header
    let participantEndY =
        headerY + 31;

    function addFooter(doc) {
        let pageHeight = doc.internal.pageSize.height; // Get page height
        let footerY = pageHeight; // Footer position

        // Draw footer line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(
            0,
            footerY - 12,
            210,
            footerY - 12
        );

        // Footer text
        doc.setFontSize(10);
/* 
        const logo =
            My_Resource +
            '/myResource/images/FooterLogo.jpg';

        const img = new Image();
        img.src = logo;

        doc.addImage(
            img,
            'JPEG',
            30,
            footerY - 11,
            30,
            10
        );

        doc.setFont(
            "Roboto-VariableFont_wdth,wght",
            "normal"
        ); */

        doc.setTextColor(0, 0, 0);

        doc.text(
            "*Terms and Conditions apply",
            10,
            footerY - 5
        );

        // Centered Footer Text
        doc.setFontSize(10);

        doc.setFont(
            "Roboto-VariableFont_wdth,wght",
            "normal"
        );

        doc.setTextColor(0, 0, 0);

        doc.text(
            "Office Use Only",
            90,
            footerY - 5
        );

        // Page Number
        doc.setFontSize(10);

        doc.setFont(
            "Roboto-VariableFont_wdth,wght",
            "normal"
        );

        doc.text(
            `${doc.internal.getNumberOfPages()}`,
            200,
            footerY - 5
        );
    }

    let yPosition =
        participantEndY + 6;

    // let yPosition = 82;

    var result = [];
    var subTotal = 0;
    let tabledata = [];

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        tabledata =
            this.invRecords[0]
                .Accounting_Journal_Entry__r;

        console.log(
            'INVOICE in Accounting ' +
            JSON.stringify(tabledata)
        );

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        tabledata =
            this.invRecords[0]
                .Xero_Invoice_Entries__r;

        console.log(
            'INVOICE in Xero ' +
            JSON.stringify(tabledata)
        );
    }

    tabledata.forEach(record => {

        console.log(
            'record.Service_Cancel_Payment__c : ',
            record.Service_Cancel_Payment__c
        );

        console.log(
            'record.Total_Amount__c : ',
            record.Total_Amount__c
        );

        const isCancelled =
            record.Service_Cancel__c === true;

        const qtyValue =
            isCancelled
                ? "-"
                : record.Quantity__c.toFixed(2);

        const unitPriceValue =
            isCancelled
                ? "-"
                : record.Unit_Price__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        const amountValue =
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c ||
                    0
                ).toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                )
                : record.Total_Amount__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        console.log(
            'amountValue : ',
            amountValue
        );

        // subtotal only adds non-cancel entries OR add canceled payment?
        // (Your earlier code added only Total_Amount__c, so follow same logic)

        subTotal +=
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c ||
                    0
                )
                : record.Total_Amount__c;

        result.push([
            record.Line_Items__c,
            record.Description__c,
            qtyValue,
            unitPriceValue,
            record.Tax__c + '%',
            amountValue
        ]);
    });

    console.log(
        ' record RESULT' +
        JSON.stringify(result)
    );

    // Adding subtotal, GST, and total rows

    result.push([
        {
            content: "*Taxes are Exclusive",
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
        '$' + invoice.GST__c.toFixed(2)
    ]);

    result.push([
        "",
        "",
        "",
        "",
        "Total:",
        '$' + invoice.Total_Amount__c.toFixed(2)
    ]);

    console.log(
        'RESULT' +
        JSON.stringify(result)
    );

    console.log(
        'RESULT' +
        JSON.stringify(result)
    );

    console.log(
        'autoTable exists =>',
        typeof doc.autoTable
    );

    // Generating table using autoTable

    console.log(
        'typeof doc.autoTable = ',
        typeof doc.autoTable
    );

    console.log(
        'typeof window.autoTable = ',
        typeof window.autoTable
    );

    console.log(
        'typeof window.jspdf.autoTable = ',
        typeof window.jspdf?.autoTable
    );

    console.log(
        'BEFORE AUTOTABLE'
    );

    doc.autoTable({

        startY: yPosition,

        head: [
            [
                "Support Item",
                "Description",
                "Qty",
                "Rate",
                "Tax",
                "Amount"
            ]
        ],

        body: result,

        theme: "plain",

        margin: {
            left: 10,
            right: 10
        },

        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: "Roboto-Bold",
            fontStyle: "bold",
        },

        bodyStyles: {
            font: "Helvetica",
            font: "Roboto-VariableFont_wdth,wght",
            fontStyle: "normal",
        },

        columnStyles: {
            1: {
                cellWidth: 50,
                halign: "left"
            },

            2: {
                cellWidth: 25,
                halign: "left"
            },

            3: {
                cellWidth: 25,
                halign: "left"
            },

            4: {
                cellWidth: 25,
                halign: "right"
            },

            5: {
                cellWidth: 35,
                halign: "right"
            },

            6: {
                cellWidth: 35,
                halign: "right"
            }
        },

        didParseCell: function (data) {

            var columnText =
                data.row.raw[3];

            if (data.row.index === 0) {

                if (
                    data.column.index === 4 ||
                    data.column.index === 5
                ) {

                    data.cell.styles.halign =
                        "right";

                } else {

                    data.cell.styles.halign =
                        "left";
                }
            }

            // Make Sub Total, Total GST, and Total bold

            if (
                ["Total:"].includes(
                    columnText
                )
            ) {

                data.cell.styles.font =
                    "Roboto-Bold";

                data.cell.styles.fontStyle =
                    "bold";
            }
        },

        didDrawCell: function (data) {

            var doc = data.doc;
            var cell = data.cell;

            var rowIndex =
                data.row.index;

            var totalRowsCount =
                result.length;

            // Get the text of the fourth column (index 3) to check row type

            var columnText =
                data.row.raw[4];

            // Apply border only to normal rows & total row

            if (
                ![
                    "Sub Total:",
                    "Total GST:"
                ].includes(columnText)
            ) {

                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);

                // Top border (for first row or total row)

                if (rowIndex === 0) {

                    doc.line(
                        cell.x,
                        cell.y,
                        cell.x + cell.width,
                        cell.y
                    );
                }

                // Bottom border (for normal rows and total row)

                if (
                    rowIndex <
                    totalRowsCount - 1
                ) {

                    doc.line(
                        cell.x,
                        cell.y + cell.height,
                        cell.x + cell.width,
                        cell.y + cell.height
                    );
                }
            }

            if (
                columnText === "Total:"
            ) {

                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);

                if (
                    data.column.index === 4 ||
                    data.column.index === 5
                ) {

                    // Top border

                    doc.line(
                        cell.x,
                        cell.y,
                        cell.x + cell.width,
                        cell.y
                    );

                    // Bottom border

                    doc.line(
                        cell.x,
                        cell.y + cell.height,
                        cell.x + cell.width,
                        cell.y + cell.height
                    );
                }
            }
        },

        didDrawPage: function (data) {

            // Always add the footer on each page

            addFooter(data.doc);
        }
    });

    console.log(
        'AFTER AUTOTABLE'
    );

    let finalYPosition =
        doc.lastAutoTable.finalY;

    // addFooter(doc);

    let availableSpace =
        doc.internal.pageSize.height -
        finalYPosition;

    console.log(
        'available Space ' +
        availableSpace
    );

    // ============================================================
    // FORMAT 3 BOTTOM SECTION
    // PARTICIPANT LEFT / BANK RIGHT
    // ============================================================

if (availableSpace > 100) {

    yPosition = finalYPosition + 35;

    // --------------------------------------------------------
    // TAX INVOICE TO - LEFT
    // --------------------------------------------------------

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Tax Invoice To:", 10, yPosition + 6);

    // Participant Name
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Name", 10, yPosition + 13);
    doc.text(":", 33, yPosition + 13);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(participantName, 36, yPosition + 13, {
        maxWidth: 90
    });

    // Participant DOB
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DOB", 10, yPosition + 18);
    doc.text(":", 33, yPosition + 18);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(formattedParticipantDob, 36, yPosition + 18, {
        maxWidth: 90
    });

    // Participant Address
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Address", 10, yPosition + 23);
    doc.text(":", 33, yPosition + 23);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(participantAddress, 36, yPosition + 23, {
        maxWidth: 90
    });

    // NDIS Number
    if (participantNDIS) {
        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("NDIS Number", 10, yPosition + 28);
        doc.text(":", 33, yPosition + 28);

        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(participantNDIS, 36, yPosition + 28, {
            maxWidth: 90
        });
    }

    // --------------------------------------------------------
    // BANK DETAILS - RIGHT
    // --------------------------------------------------------

    const bankX = 145;

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank Details", bankX, yPosition + 6);

    // --------------------------------------------------------
    // BANK
    // --------------------------------------------------------

    let bankY = yPosition + 13;

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank", bankX, bankY);
    doc.text(":", bankX + 28, bankY);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    const bankText = doc.splitTextToSize(
        this.bank || " ",
        23
    );

    doc.text(
        bankText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(bankText.length, 1) * 5;

    // --------------------------------------------------------
    // ACCOUNT NAME
    // --------------------------------------------------------

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Account Name",
        bankX,
        bankY
    );

    doc.text(
        ":",
        bankX + 28,
        bankY
    );

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    const accountNameText = doc.splitTextToSize(
        this.accountName || " ",
        23
    );

    doc.text(
        accountNameText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(accountNameText.length, 1) * 5;

    // --------------------------------------------------------
    // BSB
    // --------------------------------------------------------

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "BSB",
        bankX,
        bankY
    );

    doc.text(
        ":",
        bankX + 28,
        bankY
    );

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    const bsbText = doc.splitTextToSize(
        this.bsb || " ",
        23
    );

    doc.text(
        bsbText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(bsbText.length, 1) * 5;

    // --------------------------------------------------------
    // ACCOUNT NUMBER
    // --------------------------------------------------------

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Account Number",
        bankX,
        bankY
    );

    doc.text(
        ":",
        bankX + 28,
        bankY
    );

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    const accountNumberText = doc.splitTextToSize(
        this.accountNo || " ",
        23
    );

    doc.text(
        accountNumberText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(accountNumberText.length, 1) * 5;

    // --------------------------------------------------------
    // BOTTOM LINE
    // --------------------------------------------------------

    const bottomLineY =
        Math.max(
            yPosition + 36,
            bankY + 3
        );

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(
        10,
        bottomLineY,
        200,
        bottomLineY
    );

    // --------------------------------------------------------
    // TERMS & CONDITIONS
    // --------------------------------------------------------

    doc.setFontSize(9);
    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    

  /*   doc.text(
        "*Terms and Conditions apply",
        10,
        bottomLineY + 11
    ); */

    /*
    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "All terms and conditions apply.",
        43,
        bottomLineY + 11
    );
    */

    addFooter(doc);

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

} else {

    doc.addPage();

    yPosition = 25;

    // --------------------------------------------------------
    // TAX INVOICE TO - LEFT
    // --------------------------------------------------------

    doc.setFontSize(9);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(
        "Tax Invoice To:",
        10,
        yPosition + 6
    );

    // Participant Name
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Name",
        10,
        yPosition + 13
    );

    doc.text(
        ":",
        33,
        yPosition + 13
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        participantName,
        36,
        yPosition + 13,
        {
            maxWidth: 90
        }
    );

    // Participant DOB
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "DOB",
        10,
        yPosition + 18
    );

    doc.text(
        ":",
        33,
        yPosition + 18
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        formattedParticipantDob,
        36,
        yPosition + 18,
        {
            maxWidth: 90
        }
    );

    // Participant Address
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Address",
        10,
        yPosition + 23
    );

    doc.text(
        ":",
        33,
        yPosition + 23
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        participantAddress,
        36,
        yPosition + 23,
        {
            maxWidth: 90
        }
    );

    // NDIS Number
    if (participantNDIS) {

        doc.setFont(
            "Roboto-Bold",
            "bold"
        );

        doc.setTextColor(
            0,
            0,
            0
        );

        doc.text(
            "NDIS Number",
            10,
            yPosition + 28
        );

        doc.text(
            ":",
            33,
            yPosition + 28
        );

        doc.setFont(
            "Roboto-VariableFont_wdth,wght",
            "normal"
        );

        doc.text(
            participantNDIS,
            36,
            yPosition + 28,
            {
                maxWidth: 90
            }
        );
    }

    // --------------------------------------------------------
    // BANK DETAILS - RIGHT
    // --------------------------------------------------------

    const bankX = 145;

    doc.setFontSize(9);
    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "Bank Details",
        bankX,
        yPosition + 6
    );

    // --------------------------------------------------------
    // BANK
    // --------------------------------------------------------

    let bankY = yPosition + 13;

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "Bank",
        bankX,
        bankY
    );

    doc.text(
        ":",
        bankX + 28,
        bankY
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    const bankText = doc.splitTextToSize(
        this.bank || " ",
        23
    );

    doc.text(
        bankText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(
        bankText.length,
        1
    ) * 5;

    // --------------------------------------------------------
    // ACCOUNT NAME
    // --------------------------------------------------------

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "Account Name",
        bankX,
        bankY
    );

    doc.text(
        ":",
        bankX + 28,
        bankY
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    const accountNameText = doc.splitTextToSize(
        this.accountName || " ",
        23
    );

    doc.text(
        accountNameText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(
        accountNameText.length,
        1
    ) * 5;

    // --------------------------------------------------------
    // BSB
    // --------------------------------------------------------

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "BSB",
        bankX,
        bankY
    );

    doc.text(
        ":",
        bankX + 28,
        bankY
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    const bsbText = doc.splitTextToSize(
        this.bsb || " ",
        23
    );

    doc.text(
        bsbText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(
        bsbText.length,
        1
    ) * 5;

    // --------------------------------------------------------
    // ACCOUNT NUMBER
    // --------------------------------------------------------

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "Account Number",
        bankX,
        bankY
    );

    doc.text(
        ":",
        bankX + 28,
        bankY
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    const accountNumberText = doc.splitTextToSize(
        this.accountNo || " ",
        23
    );

    doc.text(
        accountNumberText,
        bankX + 32,
        bankY
    );

    bankY += Math.max(
        accountNumberText.length,
        1
    ) * 5;

    // --------------------------------------------------------
    // BOTTOM LINE
    // --------------------------------------------------------

    const bottomLineY =
        Math.max(
            yPosition + 36,
            bankY + 3
        );

    doc.setDrawColor(
        220,
        220,
        220
    );

    doc.setLineWidth(
        0.3
    );

    doc.line(
        10,
        bottomLineY,
        200,
        bottomLineY
    );

    // --------------------------------------------------------
    // TERMS & CONDITIONS
    // --------------------------------------------------------

    doc.setFontSize(10);

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.setTextColor(
        169,
        169,
        169
    );

   /*  doc.text(
        "*Terms and Conditions apply",
        10,
        bottomLineY + 11
    ); */

    /*
    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "All terms and conditions apply.",
        43,
        bottomLineY + 11
    );
    */

    addFooter(doc);

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );
}

    // ============================================================
    // ORIGINAL BASE64 / UPLOAD CODE
    // ============================================================

    this.base64string =
        btoa(doc.output());

    console.log(
        'Generated PDF Base64: ' +
        this.base64string
    );

    console.log(
        'Generated PDF Name: ' +
        this.invRecords[0].Name
    );

    console.log(
        'Generated recordId: ' +
        this.invRecords[0].Id
    );

    let objectName;

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        objectName =
            'AccountingInvoice';

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        objectName =
            'XeroInvoice';
    }

    console.log(
        'objectName : ',
        objectName
    );

    const result1 =
        await uploadFile({
            base64: JSON.stringify(
                this.base64string
            ),
            filename:
                this.invRecords[0].Name +
                '.pdf',
            recordId:
                this.invRecords[0].Id,
            obj: objectName
        });

    console.log(
        'data in uploadFile',
        result1
    );

    // setTimeout(() => {

    //     // Show success toast
    //     const evt = new ShowToastEvent({
    //         title: 'Success',
    //         message: 'Invoice generated successfully.',
    //         variant: 'success',
    //         mode: 'dismissable'
    //     });

    //     this.dispatchEvent(evt);

    //     console.log('PDF generated and uploaded successfully');

    //     this.isInvoiceflag = true;
    //     this.showLoadingSpinner = false;
    //     this.selectedRecordMap = new Map();
    //     this.invRecords = [];

    //     refreshApex(this.wiredResult);
    //     refreshApex(this.wiredBulkServicesResult);

    // }, 2000);
}













async generateFormat5PDF() {
    console.log('jspdfentered');
    const { jsPDF } = window.jspdf;
    var doc = new window.jspdf.jsPDF();
    const invoice = this.invRecords[0];
    console.log('INVOICE RECORDS' + JSON.stringify(invoice));

    // ============================================================
    // BASIC SETTINGS
    // ============================================================

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    let headerY = 15;

    // ============================================================
    // HEADER BACKGROUND
    // ============================================================

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(5, 5, 200, 35, 2, 2, "F");

    // ============================================================
    // ORGANISATION DETAILS
    // ============================================================

    const companyX = 10;
    const companyValueX = 30;

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(this.orgName || "", companyX, headerY);

    if (this.accountingService === "Tesseract System") {
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("ABN", companyX, headerY + 6);
    doc.text(":", companyX + 14, headerY + 6);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(invoice.Company__r?.ABN__c || "", 26, headerY + 6);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Address", companyX, headerY + 11);
    doc.text(":", companyX + 14, headerY + 11);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(`${invoice.Company__r?.Address_Latest__Street__s || ""},${invoice.Company__r?.Address_Latest__City__s || ""} ${invoice.Company__r?.Address_Latest__StateCode__s || ""} ${invoice.Company__r?.Address_Latest__PostalCode__s || ""}`, 26, headerY + 11, { maxWidth: 135 });

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Contact", companyX, headerY + 16);
    doc.text(":", companyX + 14, headerY + 16);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(invoice.Company__r?.Phone_Number__c || "", 26, headerY + 16);

} else if (this.accountingService === "Xero" || this.accountingService === "MYOB") {
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("ABN", companyX, headerY + 6);
    doc.text(":", companyX + 14, headerY + 6);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(invoice.Participant__r?.Facility__r?.ABN__c || "", 26, headerY + 6);

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Address", companyX, headerY + 11);
    doc.text(":", companyX + 14, headerY + 11);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(`${invoice.Participant__r?.Facility__r?.Address__Street__s || ""},${invoice.Participant__r?.Facility__r?.Address__City__s || ""} ${invoice.Participant__r?.Facility__r?.Address__StateCode__s || ""} ${invoice.Participant__r?.Facility__r?.Address__PostalCode__s || ""}`, 26, headerY + 11, { maxWidth: 135 });

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Contact", companyX, headerY + 16);
    doc.text(":", companyX + 14, headerY + 16);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(invoice.Participant__r?.Facility__r?.Phone__c || "", 26, headerY + 16);
}
    // ============================================================
    // ORGANISATION LOGO - RIGHT SIDE
    // ============================================================

    if (this.orgLogo) {
        try {
            const maxWidth = 35;
            const maxHeight = 28;

            const imgProps = doc.getImageProperties(this.orgLogo);

            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            const scale = Math.min(
                maxWidth / imgWidth,
                maxHeight / imgHeight
            );

            imgWidth = imgWidth * scale;
            imgHeight = imgHeight * scale;

            const logoX = 165 + (maxWidth - imgWidth) / 2;
            const logoY = 7 + (maxHeight - imgHeight) / 2;

            doc.addImage(
                this.orgLogo,
                'PNG',
                logoX,
                logoY,
                imgWidth,
                imgHeight
            );

        } catch (e) {
            console.log('Org logo error:', e);
        }
    }

    // ============================================================
    // SECOND SECTION
    // ============================================================

    const secondSectionY = 42;

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(5, secondSectionY, 200, 35, 2, 2, "F");

    // ============================================================
    // INVOICE NUMBER
    // ============================================================

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text(
        invoice.Name || '',
        198,
        secondSectionY + 8,
        {
            align: "right"
        }
    );

    
    // ============================================================
    // DATE ISSUED
    // ============================================================

    const oldDate = invoice.Invoice_Date__c || '';
    const arr = oldDate.split('-');

    const newDate = arr.length === 3
        ? arr[2] + '/' + arr[1] + '/' + arr[0]
        : '';

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Date Issued",
        157,
        secondSectionY + 20
    );

    doc.text(
        ":",
        177,
        secondSectionY + 20
    );

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        newDate,
        198,
        secondSectionY + 20,
        {
            align: "right"
        }
    );

    // ============================================================
    // DUE DATE
    // ============================================================

    const oldDueDate = invoice.Due_Date__c || '';
    const dueArr = oldDueDate.split('-');

    const newDueDate = dueArr.length === 3
        ? dueArr[2] + '/' + dueArr[1] + '/' + dueArr[0]
        : '';

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(
        "Due Date",
        157,
        secondSectionY + 25
    );

    doc.text(
        ":",
        177,
        secondSectionY + 25
    );

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.text(
        newDueDate,
        198,
        secondSectionY + 25,
        {
            align: "right"
        }
    );
    // ============================================================
    // TAX INVOICE TO
    // ============================================================

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");

    doc.setTextColor(0, 0, 0);

    doc.text(
        "Tax Invoice To:",
        10,
        secondSectionY + 8
    );

    // ============================================================
    // PARTICIPANT DETAILS
    // ============================================================

    let participantStartY = secondSectionY + 15;

    const participant = invoice.Participant__r || {};

    const participantName =
        participant.Name__c || '';

    const participantDob =
        participant.Date_Of_Birth__c || '';

    const formattedParticipantDob =
        participantDob
            ? new Date(participantDob).toLocaleDateString('en-GB')
            : '';

    console.log(
        'participantDob : ',
        formattedParticipantDob
    );

    const participantAddress = [
        participant.Address__Street__s,
        participant.Address__City__s,
        participant.Address__StateCode__s,
        participant.Address__PostalCode__s
    ]
        .filter(Boolean)
        .join(', ');

    const participantNDIS =
        participant.NDIS_Participant_ID__c || '';

    doc.setFontSize(10);

    // ============================================================
    // NAME
    // ============================================================

        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Name", 10, participantStartY);
        doc.text(":", 33, participantStartY);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(participantName, 36, participantStartY, { maxWidth: 105 });

        // ============================================================
        // DOB
        // ============================================================

        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("DOB", 10, participantStartY + 5);
        doc.text(":", 33, participantStartY + 5);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(formattedParticipantDob, 36, participantStartY + 5, { maxWidth: 105 });

        // ============================================================
        // ADDRESS
        // ============================================================

        doc.setFont("Roboto-Bold", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Address", 10, participantStartY + 10);
        doc.text(":", 33, participantStartY + 10);
        doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
        doc.text(participantAddress, 36, participantStartY + 10, { maxWidth: 105 });

        // ============================================================
        // NDIS NUMBER
        // ============================================================

        if (participantNDIS) {
            doc.setFont("Roboto-Bold", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("NDIS Number", 10, participantStartY + 15);
            doc.text(":", 33, participantStartY + 15);
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.text(participantNDIS, 36, participantStartY + 15);
        }
    // ============================================================
    // PARTICIPANT END
    // ============================================================

      function addFooter(doc) {
            let pageHeight = doc.internal.pageSize.height; // Get page height
            let footerY = pageHeight; // Footer position
       
            // Draw footer line
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.line(0, footerY - 12, 210, footerY - 12);
       
            // Footer text
            doc.setFontSize(10);
           /*  const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
            const img = new Image();
            img.src = logo;
           
            doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); */
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text("*Terms and Conditions apply", 10, footerY-5);
           
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
 

    let participantEndY =
        participantStartY + 21;

    let yPosition =
        participantEndY + 6;

    // ============================================================
    // TABLE DATA
    // ============================================================

    var result = [];

    var subTotal = 0;

    let tabledata = [];

    if (this.accountingService === 'Tesseract System') {

        tabledata =
            this.invRecords[0].Accounting_Journal_Entry__r || [];

        console.log(
            'INVOICE in Accounting ' +
            JSON.stringify(tabledata)
        );

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        tabledata =
            this.invRecords[0].Xero_Invoice_Entries__r || [];

        console.log(
            'INVOICE in Xero ' +
            JSON.stringify(tabledata)
        );
    }

    // ============================================================
    // BUILD TABLE
    // ============================================================

    tabledata.forEach(record => {

        console.log(
            'record.Service_Cancel_Payment__c : ',
            record.Service_Cancel_Payment__c
        );

        console.log(
            'record.Total_Amount__c : ',
            record.Total_Amount__c
        );

        const isCancelled =
            record.Service_Cancel__c === true;

        const qtyValue =
            isCancelled
                ? "-"
                : record.Quantity__c.toFixed(2);

        const unitPriceValue =
            isCancelled
                ? "-"
                : record.Unit_Price__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        const amountValue =
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c || 0
                ).toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                )
                : record.Total_Amount__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        console.log(
            'amountValue : ',
            amountValue
        );

        subTotal +=
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c || 0
                )
                : record.Total_Amount__c;

        result.push([
            record.Line_Items__c,
            record.Description__c,
            qtyValue,
            unitPriceValue,
            record.Tax__c + '%',
            amountValue
        ]);
    });

    console.log(
        'record RESULT' +
        JSON.stringify(result)
    );

    // ============================================================
    // SUBTOTAL
    // ============================================================

    result.push([
        {
            content: "*Taxes are Exclusive",
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

    // ============================================================
    // GST
    // ============================================================

    result.push([
        "",
        "",
        "",
        "",
        "Total GST:",
        '$' + invoice.GST__c.toFixed(2)
    ]);

    // ============================================================
    // TOTAL
    // ============================================================

    result.push([
        "",
        "",
        "",
        "",
        "Total:",
        '$' + invoice.Total_Amount__c.toFixed(2)
    ]);

    console.log(
        'RESULT' +
        JSON.stringify(result)
    );

    console.log(
        'autoTable exists =>',
        typeof doc.autoTable
    );

    // ============================================================
    // AUTO TABLE
    // ORIGINAL TABLE STRUCTURE
    // ============================================================

     doc.autoTable({
                startY: yPosition, // Starting Y position
                head: [["Support Item","Description", "Qty", "Rate", "Tax", "Amount"]],
                body: result,
                theme: "plain",
                margin: { left: 10, bottom: 25 },
                headStyles: { fillColor: [248, 248, 248], textColor: [0, 0, 0], font: "Roboto-Bold", fontStyle: "bold", },
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
            
             willDrawPage: function(data) {

            const pageHeight =
                data.doc.internal.pageSize.height;

            const pageTop =
                data.pageNumber === 1
                    ? yPosition - 5
                    : 5;

            data.doc.setFillColor(
                248,
                248,
                248
            );

            data.doc.roundedRect(
                5,
                pageTop,
                200,
                pageHeight - pageTop - 20,
                2,
                2,
                "F"
            );
        },
        didDrawPage: function (data) {
               
                // Always add the footer on each page
                addFooter(data.doc);
            },

            });

    console.log(
        'AFTER AUTOTABLE'
    );

    // ============================================================
    // FINAL TABLE POSITION
    // ============================================================

    let finalYPosition =
        doc.lastAutoTable.finalY;

    let currentPage =
        doc.internal.getCurrentPageInfo().pageNumber;

    let pageHeight =
        doc.internal.pageSize.height;

    let availableSpace =
        pageHeight - finalYPosition;

    console.log(
        'finalYPosition = ' +
        finalYPosition
    );

    console.log(
        'currentPage = ' +
        currentPage
    );

    console.log(
        'available Space = ' +
        availableSpace
    );

    // ============================================================
    // REQUIRED SPACE
    // ============================================================

    const bankStartGap = 18;

    const bankHeight = 31;

    const termsGap = 8;

    const termsHeight = 10;

    const bottomMargin = 6;

    const requiredSpace =
        bankStartGap +
        bankHeight +
        termsGap +
        termsHeight +
        bottomMargin;

    // ============================================================
    // TABLE + BANK + TERMS FIT ON CURRENT PAGE
    // ============================================================

if (availableSpace >= requiredSpace) {

    const bankY = finalYPosition + bankStartGap;
    const mainSectionBottom = bankY + bankHeight;
    const termsY = mainSectionBottom + termsGap;

    // ========================================================
    // WHITE SPACE BELOW MAIN SECTION
    // ========================================================

    doc.setFillColor(255, 255, 255);
    doc.rect(0, mainSectionBottom + 1, 210, pageHeight - mainSectionBottom - 1, "F");

    // ========================================================
    // MAIN SECTION BORDER
    // TABLE + TOTALS + BANK DETAILS
    // ========================================================

    doc.setDrawColor(248, 248, 248);
    doc.setLineWidth(0.2);
    doc.roundedRect(5, yPosition - 5, 200, mainSectionBottom - (yPosition - 5), 2, 2, "S");

    // ========================================================
    // BANK DETAILS
    // ========================================================

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank Details", 10, bankY);

    // Bank
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank", 10, bankY + 7);
    doc.text(":", 40, bankY + 7);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bank || " ", 44, bankY + 7);

    // Account Name
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Name", 10, bankY + 13);
    doc.text(":", 40, bankY + 13);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountName || " ", 44, bankY + 13);

    // BSB
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("BSB", 10, bankY + 19);
    doc.text(":", 40, bankY + 19);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bsb || " ", 44, bankY + 19);

    // Account Number
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Number", 10, bankY + 25);
    doc.text(":", 40, bankY + 25);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountNo || " ", 44, bankY + 25);

    // ========================================================
    // TERMS AND CONDITIONS - SEPARATE SECTION
    // ========================================================

   /*  doc.setFillColor(248, 248, 248);
    doc.roundedRect(5, termsY, 200, termsHeight, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text("*Terms and Conditions apply", 10, termsY + 6);
     */
               
                
     addFooter(doc);
            

} else {

    // ========================================================
    // TABLE HAS REACHED PAGE BOTTOM
    // BANK DETAILS GO TO NEXT PAGE
    // ========================================================

    doc.addPage();

    let newPageHeight = doc.internal.pageSize.height;

    let bankY = 25;
    let mainSectionBottom = bankY + 31;
    let termsY = mainSectionBottom + 8;

    // ========================================================
    // MAIN BANK SECTION
    // ========================================================

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(5, 20, 200, mainSectionBottom - 20, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank Details", 10, bankY);

    // Bank
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bank", 10, bankY + 7);
    doc.text(":", 40, bankY + 7);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bank || " ", 44, bankY + 7);

    // Account Name
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Name", 10, bankY + 13);
    doc.text(":", 40, bankY + 13);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountName || " ", 44, bankY + 13);

    // BSB
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("BSB", 10, bankY + 19);
    doc.text(":", 40, bankY + 19);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.bsb || " ", 44, bankY + 19);

    // Account Number
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Account Number", 10, bankY + 25);
    doc.text(":", 40, bankY + 25);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(this.accountNo || " ", 44, bankY + 25);

    // ========================================================
    // TERMS SECTION
    // ========================================================

   /*  doc.setFillColor(248, 248, 248);
    doc.roundedRect(5, termsY, 200, termsHeight, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text("*Terms and Conditions apply", 10, termsY + 6);
    addFooter(doc); */
}

    // ============================================================
    // BASE64
    // ============================================================

    this.base64string =
        btoa(doc.output());

    console.log(
        'Generated PDF Base64: ' +
        this.base64string
    );

    console.log(
        'Generated PDF Name: ' +
        this.invRecords[0].Name
    );

    console.log(
        'Generated recordId: ' +
        this.invRecords[0].Id
    );

    // ============================================================
    // OBJECT NAME
    // ============================================================

    let objectName;

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        objectName =
            'AccountingInvoice';

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        objectName =
            'XeroInvoice';
    }

    console.log(
        'objectName : ',
        objectName
    );

    // ============================================================
    // UPLOAD FILE
    // ============================================================

    const result1 =
        await uploadFile({
            base64: JSON.stringify(
                this.base64string
            ),
            filename:
                this.invRecords[0].Name +
                '.pdf',
            recordId:
                this.invRecords[0].Id,
            obj:
                objectName
        });

    console.log(
        'data in uploadFile',
        result1
    );
}



async generateFormat6PDF() {
    console.log('jspdfentered');

    const { jsPDF } = window.jspdf;
    var doc = new window.jspdf.jsPDF();

    const invoice = this.invRecords[0];

    console.log(
        'INVOICE RECORDS ' +
        JSON.stringify(invoice)
    );

    // ============================================================
    // PAGE SETTINGS
    // ============================================================

    const pageWidth =
        doc.internal.pageSize.width;

    const pageHeight =
        doc.internal.pageSize.height;

    // ============================================================
    // PARTICIPANT DATA
    // ============================================================

    const participant =
        invoice.Participant__r || {};

    const participantName =
        participant.Name__c || '';

    const participantDob =
        participant.Date_Of_Birth__c || '';

    const formattedParticipantDob =
        participantDob
            ? new Date(
                participantDob
            ).toLocaleDateString('en-GB')
            : '';

    const participantAddress = [
        participant.Address__Street__s,
        participant.Address__City__s,
        participant.Address__StateCode__s,
        participant.Address__PostalCode__s
    ]
        .filter(Boolean)
        .join(', ');

    const participantNDIS =
        participant.NDIS_Participant_ID__c || '';

    // ============================================================
    // PARTICIPANT CONTACT
    // ============================================================

    const participantPhone =
        participant.Phone__c ||
        participant.Phone_Number__c ||
        '';

    const participantEmail =
        participant.Email__c ||
        '';

    // ============================================================
    // ORGANISATION DETAILS
    // ============================================================

    let organisationABN = '';
    let organisationAddress = '';
    let organisationPhone = '';

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        organisationABN =
            invoice.Company__r?.ABN__c ||
            '';

        organisationAddress = [
            invoice.Company__r?.Address_Latest__Street__s,
            invoice.Company__r?.Address_Latest__City__s,
            invoice.Company__r?.Address_Latest__StateCode__s,
            invoice.Company__r?.Address_Latest__PostalCode__s
        ]
            .filter(Boolean)
            .join(', ');

        organisationPhone =
            invoice.Company__r?.Phone_Number__c ||
            '';

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        organisationABN =
            invoice.Participant__r
                ?.Facility__r
                ?.ABN__c ||
            '';

        organisationAddress = [
            invoice.Participant__r
                ?.Facility__r
                ?.Address__Street__s,

            invoice.Participant__r
                ?.Facility__r
                ?.Address__City__s,

            invoice.Participant__r
                ?.Facility__r
                ?.Address__StateCode__s,

            invoice.Participant__r
                ?.Facility__r
                ?.Address__PostalCode__s
        ]
            .filter(Boolean)
            .join(', ');

        organisationPhone =
            invoice.Participant__r
                ?.Facility__r
                ?.Phone__c ||
            '';
    }

    // ============================================================
    // HEADER
    // ============================================================

    const logoX = 8;
    const logoY = 7;

    const logoMaxWidth = 30;
    const logoMaxHeight = 30;

    if (this.orgLogo) {

        try {

            const imgProps =
                doc.getImageProperties(
                    this.orgLogo
                );

            let imgWidth =
                imgProps.width;

            let imgHeight =
                imgProps.height;

            const scale =
                Math.min(
                    logoMaxWidth /
                        imgWidth,

                    logoMaxHeight /
                        imgHeight
                );

            imgWidth =
                imgWidth * scale;

            imgHeight =
                imgHeight * scale;

            const finalLogoX =
                logoX +
                (
                    logoMaxWidth -
                    imgWidth
                ) / 2;

            const finalLogoY =
                logoY +
                (
                    logoMaxHeight -
                    imgHeight
                ) / 2;

            doc.addImage(
                this.orgLogo,
                'PNG',
                finalLogoX,
                finalLogoY,
                imgWidth,
                imgHeight
            );

        } catch (e) {

            console.log(
                'Org logo error:',
                e
            );
        }
    }

    // ============================================================
    // ORGANISATION INFORMATION
    // ============================================================

    const companyX = 42;

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(this.orgName || '', companyX, 15);

    // ------------------------------------------------------------
    // ABN
    // ------------------------------------------------------------

    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("ABN", companyX, 21);
    doc.text(":", companyX + 14, 21);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(organisationABN, companyX + 17, 21);

    // ------------------------------------------------------------
    // ADDRESS
    // ------------------------------------------------------------

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Address", companyX, 26);
    doc.text(":", companyX + 14, 26);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(organisationAddress, companyX + 17, 26, {
        maxWidth: 92
    });

    // ------------------------------------------------------------
    // CONTACT
    // ------------------------------------------------------------

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Contact", companyX, 31);
    doc.text(":", companyX + 14, 31);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(organisationPhone, companyX + 17, 31, {
        maxWidth: 80
    });

    // ============================================================
    // INVOICE NUMBER
    // ============================================================

    doc.setFillColor(
        248,
        248,
        248
    );

    doc.roundedRect(
        165,
        8,
        32,
        8,
        1.5,
        1.5,
        "F"
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(10);

   

    doc.text(
        invoice.Name || '',
        181,
        13,
        {
            align: "center"
        }
    );

    // ============================================================
    // TOTAL AMOUNT
    // ============================================================

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.setFontSize(10);

   

    doc.text(
        "Total Amount",
        198,
        25,
        {
            align: "right"
        }
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
        40,
        40,
        40
    );

    doc.text(
        '$ ' +
        Number(
            invoice.Total_Amount__c || 0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ),
        198,
        31,
        {
            align: "right"
        }
    );

    // ============================================================
    // MAIN CARD
    // ============================================================

    const cardX = 10;
    const cardY = 42;
    const cardWidth = 190;

    // We will draw this after the table so height is known.

    // ============================================================
    // DATE BOX
    // ============================================================

    const dateBoxX = 15;
    const dateBoxY = 51;
    const dateBoxWidth = 45;
    const dateBoxHeight = 74;

    doc.setFillColor(
        248,
        248,
        248
    );

    doc.roundedRect(
        dateBoxX,
        dateBoxY,
        dateBoxWidth,
        dateBoxHeight,
        1.5,
        1.5,
        "F"
    );

    // ============================================================
    // INVOICE DATE
    // ============================================================

    const oldDate =
        invoice.Invoice_Date__c || '';

    const arr =
        oldDate.split('-');

    const newDate =
        arr.length === 3
            ? arr[2] +
              '/' +
              arr[1] +
              '/' +
              arr[0]
            : '';

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.setFontSize(10);

    

    doc.text(
        "Date Issued :",
        dateBoxX + 6,
        dateBoxY + 7
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(10);

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        newDate,
        dateBoxX + 6,
        dateBoxY + 14
    );

    // ============================================================
    // DUE DATE
    // ============================================================

    const oldDueDate =
        invoice.Due_Date__c || '';

    const dueArr =
        oldDueDate.split('-');

    const newDueDate =
        dueArr.length === 3
            ? dueArr[2] +
              '/' +
              dueArr[1] +
              '/' +
              dueArr[0]
            : '';

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.setFontSize(10);

    

    doc.text(
        "Due Date :",
        dateBoxX + 6,
        dateBoxY + 27
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        newDueDate,
        dateBoxX + 6,
        dateBoxY + 34
    );

    // ============================================================
    // PARTICIPANT DETAILS
    // ============================================================
const detailsX = 75;
const detailsY = 50;

doc.setFont("Roboto-Bold", "bold");
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text("Tax Invoice To:", detailsX, detailsY + 5);

// ============================================================
// NAME
// ============================================================

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);
doc.text("Name", detailsX, detailsY + 12);
doc.text(":", detailsX + 32, detailsY + 12);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
doc.text(participantName, detailsX + 36, detailsY + 12, {
    maxWidth: 100
});

// ============================================================
// DATE OF BIRTH
// ============================================================

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);
doc.text("DOB", detailsX, detailsY + 19);
doc.text(":", detailsX + 32, detailsY + 19);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
doc.text(formattedParticipantDob, detailsX + 36, detailsY + 19, {
    maxWidth: 100
});

// ============================================================
// ADDRESS
// ============================================================

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);
doc.text("Address", detailsX, detailsY + 26);
doc.text(":", detailsX + 32, detailsY + 26);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
doc.text(participantAddress, detailsX + 36, detailsY + 26, {
    maxWidth: 105
});

// ============================================================
// NDIS NUMBER
// ============================================================

if (participantNDIS) {

    doc.setFont("Roboto-Bold", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("NDIS Number", detailsX, detailsY + 34);
    doc.text(":", detailsX + 32, detailsY + 34);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.text(participantNDIS, detailsX + 36, detailsY + 34);
}

// ============================================================
// BANK DETAILS
// ============================================================

const bankY = 94;

doc.setFont("Roboto-Bold", "bold");
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text("Bank Details", detailsX, bankY);

// ============================================================
// BANK
// ============================================================

doc.setFont("Roboto-Bold", "bold");
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text("Bank", detailsX, bankY + 7);
doc.text(":", detailsX + 32, bankY + 7);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
doc.text(this.bank || " ", detailsX + 36, bankY + 7);

// ============================================================
// ACCOUNT NAME
// ============================================================

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);
doc.text("Account Name", detailsX, bankY + 14);
doc.text(":", detailsX + 32, bankY + 14);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
doc.text(this.accountName || " ", detailsX + 36, bankY + 14);

// ============================================================
// BSB
// ============================================================

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);
doc.text("BSB", detailsX, bankY + 21);
doc.text(":", detailsX + 32, bankY + 21);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
doc.text(this.bsb || " ", detailsX + 36, bankY + 21);

// ============================================================
// ACCOUNT NUMBER
// ============================================================

doc.setFont("Roboto-Bold", "bold");
doc.setTextColor(0, 0, 0);
doc.text("Account Number", detailsX, bankY + 28);
doc.text(":", detailsX + 32, bankY + 28);

doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
doc.text(this.accountNo || " ", detailsX + 36, bankY + 28); 


   function addFooter(doc) {
            let pageHeight = doc.internal.pageSize.height; // Get page height
            let footerY = pageHeight; // Footer position
       
            // Draw footer line
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.line(0, footerY - 12, 210, footerY - 12);
       
            // Footer text
            doc.setFontSize(10);
           /*  const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
            const img = new Image();
            img.src = logo;
           
            doc.addImage(img, 'JPEG', 30, footerY - 11, 30, 10); */
            doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text("*Terms and Conditions apply", 10, footerY-5);
           
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
         
   // ============================================================
    // TABLE DATA
    // ============================================================

    var result = [];

    var subTotal = 0;

    let tabledata = [];

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        tabledata =
            this.invRecords[0]
                .Accounting_Journal_Entry__r ||
            [];

        console.log(
            'INVOICE in Accounting ' +
            JSON.stringify(tabledata)
        );

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        tabledata =
            this.invRecords[0]
                .Xero_Invoice_Entries__r ||
            [];

        console.log(
            'INVOICE in Xero ' +
            JSON.stringify(tabledata)
        );
    }

    // ============================================================
    // BUILD TABLE
    // ============================================================

    tabledata.forEach(record => {

        console.log(
            'record.Service_Cancel_Payment__c : ',
            record.Service_Cancel_Payment__c
        );

        console.log(
            'record.Total_Amount__c : ',
            record.Total_Amount__c
        );

        const isCancelled =
            record.Service_Cancel__c === true;

        const qtyValue =
            isCancelled
                ? "-"
                : record.Quantity__c.toFixed(2);

        const unitPriceValue =
            isCancelled
                ? "-"
                : record.Unit_Price__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        const amountValue =
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c || 0
                ).toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                )
                : record.Total_Amount__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        subTotal +=
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c || 0
                )
                : record.Total_Amount__c;

        result.push([
            record.Line_Items__c,
            record.Description__c,
            qtyValue,
            unitPriceValue,
            record.Tax__c + '%',
            amountValue
        ]);
    });

    // ============================================================
    // TOTAL ROWS
    // ============================================================

    result.push([
        {
            content:
                "*Taxes are Exclusive",
            styles: {
                textColor: [
                    128,
                    128,
                    128
                ]
            }
        },
        "",
        "",
        "",
        "Sub Total:",
        '$' +
        subTotal.toFixed(2)
    ]);

    result.push([
        "",
        "",
        "",
        "",
        "Total GST:",
        '$' +
        invoice.GST__c.toFixed(2)
    ]);

    result.push([
        "",
        "",
        "",
        "",
        "Total:",
        '$' +
        invoice.Total_Amount__c.toFixed(2)
    ]);

    // ============================================================
    // TABLE START
    // ============================================================

    const tableStartY =
        128;

    // ============================================================
    // AUTO TABLE
    // ============================================================

    doc.autoTable({

        startY:
            tableStartY,

        head: [
            [
                "Support Item",
                "Description",
                "Qty",
                "Rate",
                "Tax",
                "Amount"
            ]
        ],

        body:
            result,

        theme:
            "plain",

        margin: {
            left: 15,
            right: 15,
            top: 10,
            bottom: 25
        },

        // ========================================================
        // HEADER
        // ========================================================

        headStyles: {

            fillColor: [
                248,
                248,
                248
            ],

            textColor: [
                0,
                0,
                0
            ],

            font:
                "Roboto-Bold",

            fontStyle:
                "bold",

            fontSize:
                10,

            cellPadding:
                3,

            lineWidth:
                0
        },

        // ========================================================
        // BODY
        // ========================================================

        bodyStyles: {

            font:
                "Roboto-VariableFont_wdth,wght",

            fontStyle:
                "normal",

            fontSize:
                10,

            textColor: [
                0,
                0,
                0
            ],

            cellPadding:
                3
        },

        // ========================================================
        // CORRECT WIDTHS
        // TOTAL = 180
        // PAGE AVAILABLE = 180
        // ========================================================

        columnStyles: {

            0: {
                cellWidth: 45,
                halign: "left"
            },

            1: {
                cellWidth: 40,
                halign: "left"
            },

            2: {
                cellWidth: 20,
                halign: "left"
            },

            3: {
                cellWidth: 25,
                halign: "left"
            },

            4: {
                cellWidth: 25,
                halign: "right"
            },

            5: {
                cellWidth: 25,
                halign: "right"
            }
        },

        // ========================================================
        // PARSE CELL
        // ========================================================

        didParseCell:
            function(data) {

                const columnText =
                    data.row.raw[4];

                // ------------------------------------------------
                // TOTAL ROW
                // ------------------------------------------------

                if (
                    columnText ===
                    "Total:"
                ) {

                    data.cell.styles.font =
                        "Roboto-Bold";

                    data.cell.styles.fontStyle =
                        "bold";
                }

                // ------------------------------------------------
                // ALIGNMENT
                // ------------------------------------------------

                if (
                    data.column.index === 4 ||
                    data.column.index === 5
                ) {

                    data.cell.styles.halign =
                        "right";

                } else {

                    data.cell.styles.halign =
                        "left";
                }
            },

        // ========================================================
        // TABLE LINES
        // ========================================================

        didDrawCell:
            function(data) {

                const tableDoc =
                    data.doc;

                const cell =
                    data.cell;

                const rowIndex =
                    data.row.index;

                const columnText =
                    data.row.raw[4];

                const totalRows =
                    result.length;

                tableDoc.setLineWidth(
                    0.2
                );

                tableDoc.setDrawColor(
                    180,
                    180,
                    180
                );

                // ------------------------------------------------
                // HEADER BOTTOM LINE
                // ------------------------------------------------

                if (
                    rowIndex === 0
                ) {

                    tableDoc.line(
                        cell.x,
                        cell.y +
                        cell.height,
                        cell.x +
                        cell.width,
                        cell.y +
                        cell.height
                    );
                }

                // ------------------------------------------------
                // NORMAL ROW BOTTOM
                // ------------------------------------------------

                if (
                    rowIndex > 0 &&
                    rowIndex <
                        totalRows - 3
                ) {

                    tableDoc.line(
                        cell.x,
                        cell.y +
                        cell.height,
                        cell.x +
                        cell.width,
                        cell.y +
                        cell.height
                    );
                }

                // ------------------------------------------------
                // TOTAL LINE
                // ------------------------------------------------

                if (
                    columnText ===
                    "Total:"
                ) {

                    if (
                        data.column.index === 4 ||
                        data.column.index === 5
                    ) {

                        tableDoc.setDrawColor(
                            160,
                            160,
                            160
                        );

                        tableDoc.line(
                            cell.x,
                            cell.y,
                            cell.x +
                            cell.width,
                            cell.y
                        );

                        tableDoc.line(
                            cell.x,
                            cell.y +
                            cell.height,
                            cell.x +
                            cell.width,
                            cell.y +
                            cell.height
                        );
                    }
                }
            },
             didDrawPage: function (data) {
            // Always add the footer on each page
            addFooter(data.doc);
        }
    });

    // ============================================================
    // FINAL TABLE POSITION
    // ============================================================

    let finalYPosition =
        doc.lastAutoTable.finalY;

    console.log(
        'FINAL TABLE Y = ' +
        finalYPosition
    );

    // ============================================================
    // MAIN CARD BORDER
    // ============================================================

    let cardBottom =
        finalYPosition + 7;

    const totalPages =
        doc.internal.getNumberOfPages();

    doc.setDrawColor(
        215,
        215,
        215
    );

    doc.setLineWidth(
        0.3
    );

    // ============================================================
    // SINGLE PAGE INVOICE
    // ============================================================

    if (
        totalPages === 1
    ) {

        doc.setPage(1);

        doc.roundedRect(
            cardX,
            cardY,
            cardWidth,
            cardBottom -
                cardY,
            2.5,
            2.5,
            "S"
        );

     //   addFooter(doc);

    } else {

    // ========================================================
    // FIRST PAGE
    // ========================================================

    doc.setPage(1);

    doc.roundedRect(
        cardX,
        cardY,
        cardWidth,
        pageHeight -
            cardY -
            20,
        2.5,
        2.5,
        "S"
    );

    // ========================================================
    // CONTINUATION PAGES
    // ========================================================

    for (
        let pageNumber = 2;
        pageNumber <= totalPages;
        pageNumber++
    ) {

        doc.setPage(pageNumber);

        // ----------------------------------------------------
        // MIDDLE PAGES
        // ----------------------------------------------------

        if (
            pageNumber <
            totalPages
        ) {

            doc.roundedRect(
                cardX,
                5,
                cardWidth,
                pageHeight - 25,
                2.5,
                2.5,
                "S"
            );

        } else {

            // ------------------------------------------------
            // LAST PAGE
            // ------------------------------------------------

            let lastPageBottom =
                finalYPosition + 7;

            // If the table reaches near the footer,
            // keep the border away from the footer.

            if (
                lastPageBottom >
                pageHeight - 20
            ) {

                lastPageBottom =
                    pageHeight - 20;
            }

            doc.roundedRect(
                cardX,
                5,
                cardWidth,
                lastPageBottom - 5,
                2.5,
                2.5,
                "S"
            );
        }
    }

    doc.setPage(totalPages);
}

  
    // ============================================================
    // RESET
    // ============================================================

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    // ============================================================
    // BASE64
    // ============================================================

    this.base64string =
        btoa(
            doc.output()
        );

    console.log(
        'Generated PDF Base64: ' +
        this.base64string
    );

    console.log(
        'Generated PDF Name: ' +
        this.invRecords[0].Name
    );

    console.log(
        'Generated recordId: ' +
        this.invRecords[0].Id
    );

    // ============================================================
    // OBJECT NAME
    // ============================================================

    let objectName;

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        objectName =
            'AccountingInvoice';

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        objectName =
            'XeroInvoice';
    }

    console.log(
        'objectName : ',
        objectName
    );

    // ============================================================
    // UPLOAD
    // ============================================================

    const result1 =
        await uploadFile({

            base64:
                JSON.stringify(
                    this.base64string
                ),

            filename:
                this.invRecords[0].Name +
                '.pdf',

            recordId:
                this.invRecords[0].Id,

            obj:
                objectName
        });

    console.log(
        'data in uploadFile',
        result1
    );
}


async generateFormat7PDF() {
    console.log('jspdfentered');

    const { jsPDF } = window.jspdf;
    var doc = new window.jspdf.jsPDF();

    const invoice = this.invRecords[0];

    console.log(
        'INVOICE RECORDS ' +
        JSON.stringify(invoice)
    );

    // ============================================================
    // PAGE SETTINGS
    // ============================================================

    const pageWidth =
        doc.internal.pageSize.width;

    const pageHeight =
        doc.internal.pageSize.height;

    // ============================================================
    // PARTICIPANT DATA
    // ============================================================

    const participant =
        invoice.Participant__r || {};

    const participantName =
        participant.Name__c || '';

    const participantDob =
        participant.Date_Of_Birth__c || '';

    const formattedParticipantDob =
        participantDob
            ? new Date(
                participantDob
            ).toLocaleDateString('en-GB')
            : '';

    const participantAddress = [
        participant.Address__Street__s,
        participant.Address__City__s,
        participant.Address__StateCode__s,
        participant.Address__PostalCode__s
    ]
        .filter(Boolean)
        .join(', ');

    const participantNDIS =
        participant.NDIS_Participant_ID__c || '';

   
    // ============================================================
    // ORGANISATION DETAILS
    // ============================================================

    let organisationABN = '';
    let organisationAddress = '';
    let organisationPhone = '';

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        organisationABN =
            invoice.Company__r?.ABN__c ||
            '';

        organisationAddress = [
            invoice.Company__r?.Address_Latest__Street__s,
            invoice.Company__r?.Address_Latest__City__s,
            invoice.Company__r?.Address_Latest__StateCode__s,
            invoice.Company__r?.Address_Latest__PostalCode__s
        ]
            .filter(Boolean)
            .join(', ');

        organisationPhone =
            invoice.Company__r?.Phone_Number__c ||
            '';

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        organisationABN =
            invoice.Participant__r
                ?.Facility__r
                ?.ABN__c ||
            '';

        organisationAddress = [
            invoice.Participant__r
                ?.Facility__r
                ?.Address__Street__s,

            invoice.Participant__r
                ?.Facility__r
                ?.Address__City__s,

            invoice.Participant__r
                ?.Facility__r
                ?.Address__StateCode__s,

            invoice.Participant__r
                ?.Facility__r
                ?.Address__PostalCode__s
        ]
            .filter(Boolean)
            .join(', ');

        organisationPhone =
            invoice.Participant__r
                ?.Facility__r
                ?.Phone__c ||
            '';
    }

    // ============================================================
    // HEADER
    // ============================================================

    const logoX = 8;
    const logoY = 7;

    const logoMaxWidth = 30;
    const logoMaxHeight = 30;

    if (this.orgLogo) {

        try {

            const imgProps =
                doc.getImageProperties(
                    this.orgLogo
                );

            let imgWidth =
                imgProps.width;

            let imgHeight =
                imgProps.height;

            const scale =
                Math.min(
                    logoMaxWidth /
                        imgWidth,

                    logoMaxHeight /
                        imgHeight
                );

            imgWidth =
                imgWidth * scale;

            imgHeight =
                imgHeight * scale;

            const finalLogoX =
                logoX +
                (
                    logoMaxWidth -
                    imgWidth
                ) / 2;

            const finalLogoY =
                logoY +
                (
                    logoMaxHeight -
                    imgHeight
                ) / 2;

            doc.addImage(
                this.orgLogo,
                'PNG',
                finalLogoX,
                finalLogoY,
                imgWidth,
                imgHeight
            );

        } catch (e) {

            console.log(
                'Org logo error:',
                e
            );
        }
    }

    // ============================================================
    // ORGANISATION INFORMATION
    // ============================================================

    const companyX = 42;

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        this.orgName || '',
        companyX,
        15
    );

    // ------------------------------------------------------------
    // ABN
    // ------------------------------------------------------------

    doc.setFontSize(8.5);

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "ABN :",
        companyX,
        21
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        169,
        169,
        169
    );

    doc.text(
        organisationABN,
        companyX + 10,
        21
    );

    // ------------------------------------------------------------
    // ADDRESS
    // ------------------------------------------------------------

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "Address :",
        companyX,
        26
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        169,
        169,
        169
    );

    doc.text(
        organisationAddress,
        companyX + 14,
        26,
        {
            maxWidth: 92
        }
    );

    // ------------------------------------------------------------
    // CONTACT
    // ------------------------------------------------------------

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "Contact :",
        companyX,
        31
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        169,
        169,
        169
    );

    doc.text(
        organisationPhone,
        companyX + 17,
        31,
        {
            maxWidth: 80
        }
    );

    // ============================================================
    // INVOICE NUMBER
    // ============================================================

    doc.setFillColor(
        248,
        248,
        248
    );

    doc.roundedRect(
        165,
        8,
        32,
        8,
        1.5,
        1.5,
        "F"
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(8);

    doc.setTextColor(
        50,
        50,
        50
    );

    doc.text(
        invoice.Name || '',
        181,
        13,
        {
            align: "center"
        }
    );

    // ============================================================
    // TOTAL AMOUNT
    // ============================================================

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
        100,
        110,
        140
    );

    doc.text(
        "Total Amount",
        198,
        25,
        {
            align: "right"
        }
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
        40,
        40,
        40
    );

    doc.text(
        '$ ' +
        Number(
            invoice.Total_Amount__c || 0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ),
        198,
        31,
        {
            align: "right"
        }
    );

    // ============================================================
    // MAIN CARD
    // ============================================================

    const cardX = 10;
    const cardY = 42;
    const cardWidth = 190;

    // We will draw this after the table so height is known.

    // ============================================================
    // DATE BOX
    // ============================================================

    const dateBoxX = 15;
    const dateBoxY = 51;
    const dateBoxWidth = 45;
    const dateBoxHeight = 74;

    doc.setFillColor(
        248,
        248,
        248
    );

    doc.roundedRect(
        dateBoxX,
        dateBoxY,
        dateBoxWidth,
        dateBoxHeight,
        1.5,
        1.5,
        "F"
    );

    // ============================================================
    // INVOICE DATE
    // ============================================================

    const oldDate =
        invoice.Invoice_Date__c || '';

    const arr =
        oldDate.split('-');

    const newDate =
        arr.length === 3
            ? arr[2] +
              '/' +
              arr[1] +
              '/' +
              arr[0]
            : '';

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(8);

    doc.setTextColor(
        100,
        110,
        140
    );

    doc.text(
        "Date Issued :",
        dateBoxX + 6,
        dateBoxY + 7
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        newDate,
        dateBoxX + 6,
        dateBoxY + 14
    );

    // ============================================================
    // DUE DATE
    // ============================================================

    const oldDueDate =
        invoice.Due_Date__c || '';

    const dueArr =
        oldDueDate.split('-');

    const newDueDate =
        dueArr.length === 3
            ? dueArr[2] +
              '/' +
              dueArr[1] +
              '/' +
              dueArr[0]
            : '';

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(8);

    doc.setTextColor(
        100,
        110,
        140
    );

    doc.text(
        "Due Date :",
        dateBoxX + 6,
        dateBoxY + 27
    );

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        newDueDate,
        dateBoxX + 6,
        dateBoxY + 34
    );

    // ============================================================
    // PARTICIPANT DETAILS
    // ============================================================

   const detailsX = 75;
const detailsY = 50;

doc.setFont(
    "Roboto-Bold",
    "bold"
);

doc.setFontSize(9);

doc.setTextColor(
    45,
    50,
    60
);

doc.text(
    "Participant Details",
    detailsX,
    detailsY + 5
);

// ============================================================
// NAME
// ============================================================

doc.setFont(
    "Roboto-Bold",
    "bold"
);

doc.setFontSize(8);

doc.setTextColor(
    100,
    110,
    140
);

doc.text(
    "Name :",
    detailsX,
    detailsY + 12
);

doc.setFont(
    "Roboto-VariableFont_wdth,wght",
    "normal"
);

doc.text(
    participantName,
    detailsX + 12,
    detailsY + 12,
    {
        maxWidth: 100
    }
);

// ============================================================
// DATE OF BIRTH
// ============================================================

doc.setFont(
    "Roboto-Bold",
    "bold"
);

doc.setTextColor(
    100,
    110,
    140
);

doc.text(
    "DOB :",
    detailsX,
    detailsY + 19
);

doc.setFont(
    "Roboto-VariableFont_wdth,wght",
    "normal"
);

doc.text(
    formattedParticipantDob,
    detailsX + 10,
    detailsY + 19,
    {
        maxWidth: 100
    }
);

// ============================================================
// ADDRESS
// ============================================================

doc.setFont(
    "Roboto-Bold",
    "bold"
);

doc.setTextColor(
    100,
    110,
    140
);

doc.text(
    "Address :",
    detailsX,
    detailsY + 26
);

doc.setFont(
    "Roboto-VariableFont_wdth,wght",
    "normal"
);

doc.text(
    participantAddress,
    detailsX + 16,
    detailsY + 26,
    {
        maxWidth: 105
    }
);

// ============================================================
// NDIS NUMBER
// ============================================================

if (participantNDIS) {

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setTextColor(
        100,
        110,
        140
    );

    doc.text(
        "NDIS Number :",
        detailsX,
        detailsY + 34
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        participantNDIS,
        detailsX + 21,
        detailsY + 34
    );
}
    // ============================================================
    // BANK DETAILS
    // ============================================================

    const bankY = 94;

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        "Bank Details",
        detailsX,
        bankY
    );

    // ============================================================
    // BANK
    // ============================================================

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.setFontSize(8);

    doc.setTextColor(
        100,
        110,
        140
    );

    doc.text(
        "Bank :",
        detailsX,
        bankY + 7
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        this.bank || " ",
        detailsX + 10,
        bankY + 7
    );

    // ============================================================
    // ACCOUNT NAME
    // ============================================================

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.text(
        "Account Name :",
        detailsX,
        bankY + 14
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        this.accountName || " ",
        detailsX + 24,
        bankY + 14
    );

    // ============================================================
    // BSB
    // ============================================================

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.text(
        "BSB :",
        detailsX,
        bankY + 21
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        this.bsb || " ",
        detailsX + 10,
        bankY + 21
    );

    // ============================================================
    // ACCOUNT NUMBER
    // ============================================================

    doc.setFont(
        "Roboto-Bold",
        "bold"
    );

    doc.text(
        "Account Number :",
        detailsX,
        bankY + 28
    );

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.text(
        this.accountNo || " ",
        detailsX + 26,
        bankY + 28
    );

    // ============================================================
    // TABLE DATA
    // ============================================================

    var result = [];

    var subTotal = 0;

    let tabledata = [];

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        tabledata =
            this.invRecords[0]
                .Accounting_Journal_Entry__r ||
            [];

        console.log(
            'INVOICE in Accounting ' +
            JSON.stringify(tabledata)
        );

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        tabledata =
            this.invRecords[0]
                .Xero_Invoice_Entries__r ||
            [];

        console.log(
            'INVOICE in Xero ' +
            JSON.stringify(tabledata)
        );
    }

    // ============================================================
    // BUILD TABLE
    // ============================================================

    tabledata.forEach(record => {

        console.log(
            'record.Service_Cancel_Payment__c : ',
            record.Service_Cancel_Payment__c
        );

        console.log(
            'record.Total_Amount__c : ',
            record.Total_Amount__c
        );

        const isCancelled =
            record.Service_Cancel__c === true;

        const qtyValue =
            isCancelled
                ? "-"
                : record.Quantity__c.toFixed(2);

        const unitPriceValue =
            isCancelled
                ? "-"
                : record.Unit_Price__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        const amountValue =
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c || 0
                ).toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                )
                : record.Total_Amount__c.toLocaleString(
                    'en-US',
                    {
                        style: 'currency',
                        currency: 'USD'
                    }
                );

        subTotal +=
            isCancelled
                ? Number(
                    record.Service_Cancel_Payment__c || 0
                )
                : record.Total_Amount__c;

        result.push([
            record.Line_Items__c,
            record.Description__c,
            qtyValue,
            unitPriceValue,
            record.Tax__c + '%',
            amountValue
        ]);
    });

    // ============================================================
    // TOTAL ROWS
    // ============================================================

    result.push([
        {
            content:
                "*Taxes are Exclusive",
            styles: {
                textColor: [
                    128,
                    128,
                    128
                ]
            }
        },
        "",
        "",
        "",
        "Sub Total:",
        '$' +
        subTotal.toFixed(2)
    ]);

    result.push([
        "",
        "",
        "",
        "",
        "Total GST:",
        '$' +
        invoice.GST__c.toFixed(2)
    ]);

    result.push([
        "",
        "",
        "",
        "",
        "Total:",
        '$' +
        invoice.Total_Amount__c.toFixed(2)
    ]);

    // ============================================================
    // TABLE START
    // ============================================================

    const tableStartY =
        128;

    // ============================================================
    // AUTO TABLE
    // ============================================================

    doc.autoTable({

        startY:
            tableStartY,

        head: [
            [
                "Support Item",
                "Description",
                "Qty",
                "Rate",
                "Tax",
                "Amount"
            ]
        ],

        body:
            result,

        theme:
            "plain",

        margin: {
            left: 15,
            right: 15,
            top: 10,
            bottom: 12
        },

        // ========================================================
        // HEADER
        // ========================================================

        headStyles: {

            fillColor: [
                248,
                248,
                248
            ],

            textColor: [
                0,
                0,
                0
            ],

            font:
                "Roboto-Bold",

            fontStyle:
                "bold",

            fontSize:
                8,

            cellPadding:
                3,

            lineWidth:
                0
        },

        // ========================================================
        // BODY
        // ========================================================

        bodyStyles: {

            font:
                "Roboto-VariableFont_wdth,wght",

            fontStyle:
                "normal",

            fontSize:
                8,

            textColor: [
                0,
                0,
                0
            ],

            cellPadding:
                3
        },

        // ========================================================
        // CORRECT WIDTHS
        // TOTAL = 180
        // PAGE AVAILABLE = 180
        // ========================================================

        columnStyles: {

            0: {
                cellWidth: 35,
                halign: "left"
            },

            1: {
                cellWidth: 50,
                halign: "left"
            },

            2: {
                cellWidth: 20,
                halign: "left"
            },

            3: {
                cellWidth: 25,
                halign: "left"
            },

            4: {
                cellWidth: 20,
                halign: "right"
            },

            5: {
                cellWidth: 30,
                halign: "right"
            }
        },

        // ========================================================
        // PARSE CELL
        // ========================================================

        didParseCell:
            function(data) {

                const columnText =
                    data.row.raw[4];

                // ------------------------------------------------
                // TOTAL ROW
                // ------------------------------------------------

                if (
                    columnText ===
                    "Total:"
                ) {

                    data.cell.styles.font =
                        "Roboto-Bold";

                    data.cell.styles.fontStyle =
                        "bold";
                }

                // ------------------------------------------------
                // ALIGNMENT
                // ------------------------------------------------

                if (
                    data.column.index === 4 ||
                    data.column.index === 5
                ) {

                    data.cell.styles.halign =
                        "right";

                } else {

                    data.cell.styles.halign =
                        "left";
                }
            },

        // ========================================================
        // TABLE LINES
        // ========================================================

        didDrawCell:
            function(data) {

                const tableDoc =
                    data.doc;

                const cell =
                    data.cell;

                const rowIndex =
                    data.row.index;

                const columnText =
                    data.row.raw[4];

                const totalRows =
                    result.length;

                tableDoc.setLineWidth(
                    0.2
                );

                tableDoc.setDrawColor(
                    180,
                    180,
                    180
                );

                // ------------------------------------------------
                // HEADER BOTTOM LINE
                // ------------------------------------------------

                if (
                    rowIndex === 0
                ) {

                    tableDoc.line(
                        cell.x,
                        cell.y +
                        cell.height,
                        cell.x +
                        cell.width,
                        cell.y +
                        cell.height
                    );
                }

                // ------------------------------------------------
                // NORMAL ROW BOTTOM
                // ------------------------------------------------

                if (
                    rowIndex > 0 &&
                    rowIndex <
                        totalRows - 3
                ) {

                    tableDoc.line(
                        cell.x,
                        cell.y +
                        cell.height,
                        cell.x +
                        cell.width,
                        cell.y +
                        cell.height
                    );
                }

                // ------------------------------------------------
                // TOTAL LINE
                // ------------------------------------------------

                if (
                    columnText ===
                    "Total:"
                ) {

                    if (
                        data.column.index === 4 ||
                        data.column.index === 5
                    ) {

                        tableDoc.setDrawColor(
                            160,
                            160,
                            160
                        );

                        tableDoc.line(
                            cell.x,
                            cell.y,
                            cell.x +
                            cell.width,
                            cell.y
                        );

                        tableDoc.line(
                            cell.x,
                            cell.y +
                            cell.height,
                            cell.x +
                            cell.width,
                            cell.y +
                            cell.height
                        );
                    }
                }
            }
    });

    // ============================================================
    // FINAL TABLE POSITION
    // ============================================================

    let finalYPosition =
        doc.lastAutoTable.finalY;

    console.log(
        'FINAL TABLE Y = ' +
        finalYPosition
    );

    // ============================================================
    // MAIN CARD BORDER
    // ============================================================

    let cardBottom =
        finalYPosition + 7;

    doc.setDrawColor(
        215,
        215,
        215
    );

    doc.setLineWidth(
        0.3
    );

    doc.roundedRect(
        cardX,
        cardY,
        cardWidth,
        cardBottom -
            cardY,
        2.5,
        2.5,
        "S"
    );

    // ============================================================
    // TERMS AND CONDITIONS
    // SEPARATE SECTION
    // ============================================================

    let termsY =
        finalYPosition + 15;

    // ------------------------------------------------------------
    // IF TERMS DO NOT FIT
    // ------------------------------------------------------------

    if (
        termsY >
        pageHeight - 12
    ) {

        doc.addPage();

        termsY = 12;
    }

    // ============================================================
    // TERMS BACKGROUND
    // ============================================================

    doc.setFillColor(
        248,
        248,
        248
    );

   /*  doc.roundedRect(
        5,
        termsY - 5,
        200,
        10,
        2,
        2,
        "F"
    ); */

    // ============================================================
    // TERMS TITLE
    // ============================================================

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    doc.setFontSize(
        8
    );

    doc.setTextColor(
        100,
        110,
        140
    );

    doc.text(
        "Terms and Conditions",
        10,
        termsY + 1
    );

    // ============================================================
    // TERMS TEXT
    // ============================================================

    doc.setTextColor(
        50,
        50,
        50
    );

    doc.text(
        "All terms and conditions apply.",
        42,
        termsY + 1
    );

    // ============================================================
    // RESET
    // ============================================================

    doc.setFont(
        "Roboto-VariableFont_wdth,wght",
        "normal"
    );

    // ============================================================
    // BASE64
    // ============================================================

    this.base64string =
        btoa(
            doc.output()
        );

    console.log(
        'Generated PDF Base64: ' +
        this.base64string
    );

    console.log(
        'Generated PDF Name: ' +
        this.invRecords[0].Name
    );

    console.log(
        'Generated recordId: ' +
        this.invRecords[0].Id
    );

    // ============================================================
    // OBJECT NAME
    // ============================================================

    let objectName;

    if (
        this.accountingService ===
        'Tesseract System'
    ) {

        objectName =
            'AccountingInvoice';

    } else if (
        this.accountingService === 'Xero' ||
        this.accountingService === 'MYOB'
    ) {

        objectName =
            'XeroInvoice';
    }

    console.log(
        'objectName : ',
        objectName
    );

    // ============================================================
    // UPLOAD
    // ============================================================

    const result1 =
        await uploadFile({

            base64:
                JSON.stringify(
                    this.base64string
                ),

            filename:
                this.invRecords[0].Name +
                '.pdf',

            recordId:
                this.invRecords[0].Id,

            obj:
                objectName
        });

    console.log(
        'data in uploadFile',
        result1
    );
}

    // async generateBase64Data() {
    //     const doc = new window.jspdf.jsPDF();
    //     const invoice = this.invRecords[0];

    //     doc.setFont('Roboto-Bold', 'bold');
    //     doc.setTextColor(0, 0, 0);
    //     doc.setFontSize(12);

    //     let headerY = 15;

    //     if (this.orgLogo) {
    //         try {
    //             const maxWidth = 40;
    //             const maxHeight = 20;
    //             const imgProps = doc.getImageProperties(this.orgLogo);
    //             let imgWidth = imgProps.width;
    //             let imgHeight = imgProps.height;
    //             const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    //             imgWidth *= scale;
    //             imgHeight *= scale;
    //             const logoX = 10 + (maxWidth - imgWidth) / 2;
    //             const logoY = 5 + (maxHeight - imgHeight) / 2;
    //             doc.addImage(this.orgLogo, 'PNG', logoX, logoY, imgWidth, imgHeight);
    //             headerY = 30;
    //         } catch (e) {
    //             console.log('Org logo error:', e);
    //         }
    //     }

    //     doc.text((this.orgname || '').toUpperCase(), 10, headerY);

    //     if (this.accountingService === 'Tesseract System') {
    //         doc.setTextColor(0, 0, 0);
    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.setFontSize(12);
    //         doc.text('ABN: ' + invoice.Company__r.ABN__c, 10, headerY + 5);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.setFontSize(10);
    //         doc.text(invoice.Company__r.Address_Latest__Street__s + ',', 10, headerY + 10);
    //         doc.text(`${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`, 10, headerY + 15);
    //         doc.text('Contact: ' + (invoice.Company__r.Phone_Number__c || ''), 10, headerY + 20);
    //     } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
    //         doc.setTextColor(0, 0, 0);
    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.setFontSize(12);
    //         doc.text('ABN: ' + invoice.Participant__r.Facility__r.ABN__c, 10, headerY + 5);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.setFontSize(10);
    //         doc.text(invoice.Participant__r.Facility__r.Address__Street__s + ',', 10, headerY + 10);
    //         doc.text(`${invoice.Participant__r.Facility__r.Address__City__s} ${invoice.Participant__r.Facility__r.Address__StateCode__s} ${invoice.Participant__r.Facility__r.Address__PostalCode__s},`, 10, headerY + 15);
    //         doc.text('Contact: ' + invoice.Participant__r.Facility__r.Phone__c, 10, headerY + 20);
    //     }

    //     let invoiceHeaderY = headerY;
    //     doc.setFont('Roboto-Bold', 'bold');
    //     doc.setFontSize(12);
    //     doc.text('TAX  INVOICE', 158, invoiceHeaderY);
    //     doc.text(invoice.Name, 158, invoiceHeaderY + 5);

    //     const arr = invoice.Invoice_Date__c.split('-');
    //     const newDate = `${arr[2]}/${arr[1]}/${arr[0]}`;
    //     doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //     doc.setFontSize(10);
    //     doc.text('Date Issued: ' + newDate, 158, invoiceHeaderY + 10);

    //     const oldDueDate = invoice.Due_Date__c || '';
    //     const dueArr = oldDueDate.split('-');
    //     const newDueDate = `${dueArr[2]}/${dueArr[1]}/${dueArr[0]}`;
    //     doc.text('Due Date: ' + newDueDate, 158, invoiceHeaderY + 15);

    //     doc.setFontSize(10);
    //     doc.setFont('Roboto-Bold', 'bold');
    //     doc.setTextColor(0, 0, 0);
    //     let taxInvoiceY = headerY + 40;
    //     doc.text('Tax Invoice To:', 10, taxInvoiceY);

    //     let participantStartY = taxInvoiceY + 6;
    //     const participant = invoice.Participant__r || {};
    //     const participantName = participant.Name__c || '';
    //     const participantDob = participant.Date_Of_Birth__c || '';
    //     const formattedParticipantDob = new Date(participantDob).toLocaleDateString('en-GB');
    //     const participantAddress = [
    //         participant.Address__Street__s,
    //         participant.Address__City__s,
    //         participant.Address__StateCode__s,
    //         participant.Address__PostalCode__s
    //     ].filter(Boolean).join(', ');
    //     const participantNDIS = participant.NDIS_Participant_ID__c || '';

    //     doc.setFontSize(10);
    //     doc.setFont('Roboto-Bold', 'bold');
    //     doc.text('Name', 10, participantStartY);
    //     doc.text(':', 55, participantStartY);
    //     doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //     doc.text(participantName, 58, participantStartY);

    //     doc.setFont('Roboto-Bold', 'bold');
    //     doc.text('DOB', 10, participantStartY + 5);
    //     doc.text(':', 55, participantStartY + 5);
    //     doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //     doc.text(formattedParticipantDob, 58, participantStartY + 5, { maxWidth: 130 });

    //     doc.setFont('Roboto-Bold', 'bold');
    //     doc.text('Address', 10, participantStartY + 10);
    //     doc.text(':', 55, participantStartY + 10);
    //     doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //     doc.text(participantAddress, 58, participantStartY + 10, { maxWidth: 130 });

    //     if (participantNDIS) {
    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.text('NDIS Number', 10, participantStartY + 15);
    //         doc.text(':', 55, participantStartY + 15);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.text(participantNDIS, 58, participantStartY + 15);
    //     }

    //     let participantEndY = participantStartY + 21;

    //     const addFooter = (docRef) => {
    //         let pageHeight = docRef.internal.pageSize.height;
    //         let footerY = pageHeight;
    //         docRef.setDrawColor(0, 0, 0);
    //         docRef.setLineWidth(0.2);
    //         docRef.line(0, footerY - 12, 210, footerY - 12);
    //         docRef.setFontSize(10);
    //         const logo = My_Resource + '/myResource/images/FooterLogo.jpg';
    //         const img = new Image();
    //         img.src = logo;
    //         docRef.addImage(img, 'JPEG', 30, footerY - 11, 30, 10);
    //         docRef.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         docRef.setTextColor(0, 0, 0);
    //         docRef.text('Powered by', 10, footerY - 5);
    //         docRef.setFontSize(10);
    //         docRef.text('Office Use Only', 90, footerY - 5);
    //         docRef.text(`${docRef.internal.getNumberOfPages()}`, 200, footerY - 5);
    //     };

    //     let yPosition = participantEndY + 6;
    //     let result = [];
    //     let subTotal = 0;
    //     let tabledata = [];

    //     if (this.accountingService === 'Tesseract System') {
    //         tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
    //     } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
    //         tabledata = this.invRecords[0].Xero_Invoice_Entries__r;
    //     }

    //     tabledata.forEach(record => {
    //         const isCancelled = record.Service_Cancel__c === true;
    //         const qtyValue = isCancelled ? '-' : record.Quantity__c.toFixed(2);
    //         const unitPriceValue = isCancelled ? '-' : record.Unit_Price__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    //         const amountValue = isCancelled
    //             ? Number(record.Service_Cancel_Payment__c || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    //             : record.Total_Amount__c.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    //         subTotal += isCancelled ? Number(record.Service_Cancel_Payment__c || 0) : record.Total_Amount__c;

    //         result.push([
    //             record.Line_Items__c,
    //             record.Description__c,
    //             qtyValue,
    //             unitPriceValue,
    //             record.Tax__c + '%',
    //             amountValue
    //         ]);
    //     });

    //     result.push([{ content: '*Taxes are Exclusive', styles: { textColor: [128, 128, 128] } }, '', '', '', 'Sub Total:', '$' + subTotal.toFixed(2)]);
    //     result.push(['', '', '', '', 'Total GST:', '$' + invoice.GST__c.toFixed(2)]);
    //     result.push(['', '', '', '', 'Total:', '$' + invoice.Total_Amount__c.toFixed(2)]);

    //     doc.autoTable({
    //         startY: yPosition,
    //         head: [['Support Item', 'Description', 'Qty', 'Rate', 'Tax', 'Amount']],
    //         body: result,
    //         theme: 'plain',
    //         margin: { left: 10 },
    //         headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: 'Roboto-Bold', fontStyle: 'bold' },
    //         bodyStyles: { font: 'Roboto-VariableFont_wdth,wght', fontStyle: 'normal' },
    //         columnStyles: {
    //             1: { cellWidth: 50, halign: 'left' },
    //             2: { cellWidth: 25, halign: 'left' },
    //             3: { cellWidth: 25, halign: 'left' },
    //             4: { cellWidth: 25, halign: 'right' },
    //             5: { cellWidth: 35, halign: 'right' },
    //             6: { cellWidth: 35, halign: 'right' }
    //         },
    //         didParseCell: (data) => {
    //             const columnText = data.row.raw[3];
    //             if (data.row.index === 0) {
    //                 data.cell.styles.halign = (data.column.index === 4 || data.column.index === 5) ? 'right' : 'left';
    //             }
    //             if (['Total:'].includes(columnText)) {
    //                 data.cell.styles.font = 'Roboto-Bold';
    //                 data.cell.styles.fontStyle = 'bold';
    //             }
    //         },
    //         didDrawCell: (data) => {
    //             const docRef = data.doc;
    //             const cell = data.cell;
    //             const rowIndex = data.row.index;
    //             const totalRowsCount = result.length;
    //             const columnText = data.row.raw[4];

    //             if (!['Sub Total:', 'Total GST:'].includes(columnText)) {
    //                 docRef.setDrawColor(0, 0, 0);
    //                 docRef.setLineWidth(0.2);
    //                 if (rowIndex === 0) docRef.line(cell.x, cell.y, cell.x + cell.width, cell.y);
    //                 if (rowIndex < totalRowsCount - 1) docRef.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
    //             }
    //             if (columnText === 'Total:' && (data.column.index === 4 || data.column.index === 5)) {
    //                 docRef.setDrawColor(0, 0, 0);
    //                 docRef.setLineWidth(0.2);
    //                 docRef.line(cell.x, cell.y, cell.x + cell.width, cell.y);
    //                 docRef.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
    //             }
    //         },
    //         didDrawPage: (data) => addFooter(data.doc)
    //     });

    //     let finalYPosition = doc.lastAutoTable.finalY;
    //     let availableSpace = doc.internal.pageSize.height - finalYPosition;

    //     const drawPaymentBlock = (yStart) => {
    //         doc.setDrawColor(0, 0, 0);
    //         doc.setLineWidth(0.5);
    //         doc.setLineDash([1, 1]);
    //         doc.line(10, yStart, 200, yStart);
    //         doc.setLineDash();

    //         doc.setFontSize(10);
    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.text('Payable to:', 10, yStart + 6);

    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.text('Bank', 10, yStart + 12);
    //         doc.text(':', 40, yStart + 12);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.text(this.bank || ' ', 42, yStart + 12);

    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.text('Account Name', 10, yStart + 16);
    //         doc.text(':', 40, yStart + 16);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.text(this.accountName || ' ', 42, yStart + 16);

    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.text('BSB', 10, yStart + 20);
    //         doc.text(':', 40, yStart + 20);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.text(this.bsb || ' ', 42, yStart + 20);

    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.text('Account Number', 10, yStart + 24);
    //         doc.text(':', 40, yStart + 24);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.text(this.accountNo || ' ', 42, yStart + 24);

    //         doc.setFontSize(10);
    //         doc.setFont('Roboto-Bold', 'bold');
    //         doc.text('Terms & Conditions:', 10, yStart + 44);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //         doc.setTextColor(169, 169, 169);
    //         doc.text('All terms and conditions apply.', 10, yStart + 48);
    //         doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //     };

    //     if (availableSpace > 100) {
    //         yPosition = finalYPosition + 35;
    //         drawPaymentBlock(yPosition);
    //         addFooter(doc);
    //     } else {
    //         doc.addPage();
    //         yPosition = 25;
    //         drawPaymentBlock(yPosition);
    //         addFooter(doc);
    //     }

    //     this.base64string = btoa(doc.output());

    //     let objectName;
    //     if (this.accountingService === 'Tesseract System') {
    //         objectName = 'AccountingInvoice';
    //     } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
    //         objectName = 'XeroInvoice';
    //     }

    //     await uploadFile({
    //         base64: JSON.stringify(this.base64string),
    //         filename: this.invRecords[0].Name + '.pdf',
    //         recordId: this.invRecords[0].Id,
    //         obj: objectName
    //     });
    // }

    // ---------- KEYBOARD SHORTCUTS ----------

    handleShortcut(event) {
        if (event.altKey && event.key.toLowerCase() === 'v') {
            event.preventDefault();
            this.template.querySelector('[data-id="invoiceNo"]')?.focus();
        }

        if (event.ctrlKey && event.key.toLowerCase() === 'd') {
            event.preventDefault();
            setTimeout(() => this.template.querySelector('lightning-input[data-id="invoiceDateField"]')?.focus(), 0);
        }

        if (event.ctrlKey && event.key.toLowerCase() === 'p') {
            event.preventDefault();
            setTimeout(() => this.template.querySelector('lightning-input[data-id="postDateField"]')?.focus(), 0);
        }

        if (event.altKey && event.key.toLowerCase() === 'd') {
            event.preventDefault();
            setTimeout(() => this.template.querySelector('lightning-input[data-id="dueDate"]')?.focus(), 10);
        }

        if (event.ctrlKey && event.shiftKey && (event.key.toLowerCase() === 'b' || event.code === 'KeyB')) {
            event.preventDefault();
            const firstHost = this.template.querySelector('[data-field="Description__c"]');
            const internalArea = firstHost?.shadowRoot?.querySelector('textarea');
            if (internalArea) setTimeout(() => internalArea.focus(), 0);
        }

        if (event.ctrlKey && event.key.toLowerCase() === 'l') {
            event.preventDefault();
            this.template.querySelector('[data-id="addNewLineBtn"]')?.click();
        }

        if (event.ctrlKey && event.key === 'Delete') {
            event.preventDefault();
            const rowId = this.activeRowIdB;
            if (!rowId) return;
            this.template.querySelector(`a.delete-row-link[data-id="${rowId}"]`)?.click();
        }

        if (event.ctrlKey && event.key.toLowerCase() === 'm') {
            event.preventDefault();
            setTimeout(() => this.template.querySelector('[data-id="commentsField"]')?.focus(), 0);
        }

        if (event.ctrlKey && event.key.toLowerCase() === 's') {
            event.preventDefault();
            this.template.querySelector('[data-id="saveBtn"]')?.click();
        }

        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            this.template.querySelector('lightning-button[data-id="submitBtn"]')?.click();
        }

        if (event.ctrlKey && event.key.toLowerCase() === 'q') {
            event.preventDefault();
            setTimeout(() => this.template.querySelector('[data-id="notesField"]')?.focus(), 10);
        }
    }

    // toggleDropdown(event) {
    //     if (event) {
    //     event.stopPropagation(); // ⛔️ Prevents document click from firing
    //     }
    //     this.isOpen = !this.isOpen;
    //     console.log("🔁 toggleDropdown called. isOpen before toggle:", this.isOpen);
    //     console.log(' this.isParticipanTViewEnable ==>'+this.isParticipanTViewEnable);

    //     if (this.isOpen) {
    //     // Add event listeners when dropdown opens
    //     setTimeout(() => {
    //         console.log(
    //         "🟢 Dropdown opened. Event listeners added (mousedown, keydown)"
    //         );

    //         document.addEventListener("click", this.handleClickOutside);
    //         document.addEventListener("keydown", this.handleEscapeKey);
    //     }, 0);
    //     } else {
    //     console.log("🔴 Dropdown closed. Event listeners removed");

    //     // Remove event listeners when dropdown closes
    //     document.removeEventListener("mousedown", this.handleClickOutside);
    //     document.removeEventListener("keydown", this.handleEscapeKey);
    //     }
    // }

    // formats = [
    //     {
    //         id: 'format1',
    //         name: 'Default Invoice',
    //         image: `${InvoiceFormats}/1.png`,
    //         isDefault: true
    //     },
    //     {
    //         id: 'format2',
    //         name: 'Sample Invoice One',
    //         image: `${InvoiceFormats}/2.png`,
    //         isDefault: false
    //     },
    //     {
    //         id: 'format3',
    //         name: 'Sample Invoice Two',
    //         image: `${InvoiceFormats}/3.png`,
    //         isDefault: false
    //     },
    //     {
    //         id: 'format4',
    //         name: 'Sample Invoice Three',
    //         image: `${InvoiceFormats}/4.png`,
    //         isDefault: false
    //     },
    //     {
    //         id: 'format5',
    //         name: 'Sample Invoice Four',
    //         image: `${InvoiceFormats}/5.png`,
    //         isDefault: false
    //     },
    //     {
    //         id: 'format6',
    //         name: 'Sample Invoice Five',
    //         image: `${InvoiceFormats}/6.png`,
    //         isDefault: false
    //     },
    
    // ];

    // handleMenuItemClick(event){
    //     this.invoiceformatFlag = true;
    //     this.isOpen = false;
    //     this.isHome = false;

    // }

    // handlePreview(event) {
    //     event.stopPropagation();

    //     const formatId = event.currentTarget.dataset.id;

    //     const format = this.formats.find(
    //         item => item.id === formatId
    //     );

    //     if (!format) {
    //         return;
    //     }

    //     this.selectedPreview = {
    //         ...format
    //     };

    //     this.showPreview = true;
    // }

    // closePreview() {
    //     this.showPreview = false;
    //     this.selectedPreview = null;
    // }

    // BacktoHome(event){
    //     this.isHome=true;
    //     this.invoiceformatFlag = false;

    // }   

    // handleDefaultChange(event) {
    //     const selectedFormatId = event.target.dataset.id;

    //     // Check current format before changing it
    //     const selectedFormat = this.formats.find(
    //         format => format.id === selectedFormatId
    //     );

    //     // If already default, don't do anything
    //     if (selectedFormat?.isDefault === true) {
    //         event.target.checked = true;
    //         return;
    //     }

    //     console.log('Organisation Id:', this.orgid);
    //     console.log('Selected Invoice Format:', selectedFormatId);

    //     // Update UI
    //     this.formats = this.formats.map(format => ({
    //         ...format,
    //         isDefault: format.id === selectedFormatId
    //     }));

    //     if (this.selectedPreview && this.selectedPreview.id === selectedFormatId) {
    //         this.selectedPreview = {
    //             ...this.selectedPreview,
    //             isDefault: true
    //         };
    //     }


    //     this.selectedFormat = selectedFormatId;

    //     // Update Organisation
    //     updateOrgInvoiceFormat({
    //         orgId: this.orgid,
    //         invoiceFormat: selectedFormatId
    //     })
    //         .then(result => {
    //             console.log('Invoice format updated:', result);

    //             this.showToast(
    //                 'Success',
    //                 'Invoice format updated successfully.',
    //                 'success'
    //             );
    //         })
    //         .catch(error => {
    //             console.error('Error updating invoice format:', error);

    //             this.showToast(
    //                 'Error',
    //                 error?.body?.message || 'Failed to update invoice format.',
    //                 'error'
    //             );
    //         }); 
    // }

}