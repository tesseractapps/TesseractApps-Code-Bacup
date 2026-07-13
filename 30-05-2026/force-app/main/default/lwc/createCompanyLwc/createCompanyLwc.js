import { LightningElement, track, api,wire } from 'lwc';
import getUserOrganisation from '@salesforce/apex/CreateCompanyController.getUserOrganisation';
import getFacility from '@salesforce/apex/CreateCompanyController.getFacility';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import getProfiles from '@salesforce/apex/CreateCompanyController.getProfiles';
//import deleteCompanyRecord from '@salesforce/apex/CreateCompanyController.deleteCompanyRecord';
//import getIndustryOptions from '@salesforce/apex/AccountingMasterDBController.getIndustryOptions';
//import getAccountList from '@salesforce/apex/CreateCompanyController.getAccountList';
//import saveAccountList from '@salesforce/apex/CreateCompanyController.insertAccountList';
import getAccountingData from '@salesforce/apex/CreateCompanyController.getAccountingData';
//import checkCompanyNameExistFY from '@salesforce/apex/CreateCompanyController.checkCompanyNameExistFY';
import insertCompany from '@salesforce/apex/CreateCompanyController.insertCompany';
import saveFinancialYearApex from '@salesforce/apex/CreateCompanyController.saveFinancialYearApex';
import checkCompanyName from '@salesforce/apex/CreateCompanyController.checkCompanyName';
import getCompanyOnEdit from '@salesforce/apex/AccountingModuleController.getCompanyOnEdit';
import updateCompany from '@salesforce/apex/AccountingModuleController.updateCompany';
import getEntityOnEdit from '@salesforce/apex/AccountingModuleController.getEntityOnEdit';
import saveActivityStatement from '@salesforce/apex/CreateCompanyController.saveActivityStatement';
import saveNewAccountList from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.saveNewAccountList';
import getNewHierarchyData from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getNewHierarchyData';
import updateLedgerItemName from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateLedgerItemName';
import insertLedgerItem from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertLedgerItem';
import insertLedger from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertLedger';
import insertSubCategory from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertSubCategory';
import insertCategory from '@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertCategory';
import checkItemTransactions from '@salesforce/apex/CreateCompanyController.checkItemTransactions';
import myResource from '@salesforce/resourceUrl/Sample_Account_List'; 
import instructionsResource from '@salesforce/resourceUrl/Import_AL_Instructions';

export default class CreateCompanyLwc extends LightningElement {
    //fileUrl = '/resource/UserExportDownload';
    @api orgidtrack;
    @track isHome=true;
    @track isBack=true;
    @api isFromManageInvoice;
    @api isFromFacility;
    @api createCompanyFacilityId;
    @track selectedCompany='All';
    @track facilityOptions=[];
    @track createCompanyFlag=false;
    @track selectedCompanyName;
    @track disableCreate;
    @track enableEntity=false;
    @track financialYears = [];
    @track accountList = [];
    @track buttonLabel = 'Save'; 
    @track selectedFinancialYears = [];  
    @track selectedAccountList = []; 
    @track createEditCompany='Create Company';
    @track selectedEntityId;
    @track recordId;
    @track isDisabled=false;
    @track abn;
    @track contactName;
    @track contactNo;
    @track emailId;
    @track region;
    @track country;
    @track currency;
    @track orgTable=false;
    @track companyTable=false;
    @track saveButtonDisable = false;
    @track saveButtonDisable1 = false;
    @track saveButtonDisable2 = false;
    @track recordId1;
    @track companyData=[];
    @track getCompanyResult=[];
    wiredAccountingOrgResult;
    wiredCompanyResult;
    @track recordIdFY;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track street1;
    @track city1;
    @track country1;
    @track province1;
    @track postalcode1;
    @track selectedOrg;
    @track orgOptions=[];
    @track selectedcomp;
    @track selectedcomp2;
    @track showChild=false;
    @track companyOptions=[];
    @track companyOptionsAll=[];
    @track isCreate=true;
    @track company;
    @track image;
    @track allCardsFlag;
    @track customerFlag =true;
    @track supplierFlag;
    @track employeeFlag;
    @track personalFlag;
    @track allCardsEditFlag;
    @track customerEditFlag;
    @track supplierEditFlag;
    @track employeeEditFlag;
    @track personalEditFlag;
    @track createCardFlag;
    @track isCustomer='Customer';
    @track allProfiles=[];
    @track customerProfiles=[];
    @track supplierProfiles=[];
    @track industryOptions;
    @track categoryIds = [];
    @track searchProfile='';
    @track filteredAllProfiles=[];
    @track filteredCustomerProfiles=[];
    @track filteredSupplierProfiles =[];
    currentCompanyRowIndex =0; //for Shortcut key 
    wiredProfileResult;
    wiredIndustryOptionsData;
    wiredCompanyOptionsResult;
    wiredAccountsResult;
    wiredAccountList;
   // @track selectedStartMonth;
    @track selectedEndMonth;
    @track selectedYear;
    expandedCategory = {};
    expandedSubCategory = {};
    expandedLedger = {};
    @track nextButtonDisable1=true;
    @track saveConfirmFlag=false;
    @track companyName;
    @track nextButtonDisable2=true;
    //@track nextButtonDisable3=true;
    @track saveConfirmFlag1=false;
    @track radioCompanyId;
    @track radioCompanyOptions;
    @track industry;
    @track hierarchyData = [];
    @track paginationVisible=false;
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; 
    @track records=[];
    @track accountingOrgId;
    @track gstAccountingMethod;
    @track taxFileNumber;
    @track paygWithheldPriod;
    @track paygIncomeTaxMethod;
    @track isFringeBenefitsTax=false;
    @track isFuelTaxCredits=false;
    @track isWineEqualisationTax=false;
    @track industryDisable=false;
    //@track forSales='Tax Exclusive';
    //@track forPurchases = 'Tax Inclusive';
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track EditCompanyFlag =false;
    categoryIds = [];
    @track selectedIndustry = 'Service';
    wireFacility;
    wiredCompanyTableResult;
    @track isLoading = false;
    @track companyNameInEdit;
    @track backFlag=false;
    @track addIndustry = false;
    @track selectedIndustry1;
    @track enableddisabled = true;
    disabledAccountName = false;
    @track isClear = false;
    @track chartFlag  = true;
    @track ActivityFlag = false;
    @track EntityFlag = false;
    @track selectedLedgerId;
    @track selectedSubCatId;
    @track selectedCatId;
    @track selectedLedgerAccountNo;
    @track selectedLedgerAccountName;
    @track contextLevel;
    @track isItemEdit = false;
    @track isAddingItem = false;
    @track accountNo;
    @track accountName;
    @track disabledSave = false;
    @track filteredAccountOptions = [];
    @track selectedAccountName = '';
    @track taxCode; //for Tax code
    @track accountList;// for child accountList
    @track sectionFlags = {
        financialYearDetails: true,
        accountListDetails: true,
        Activity1: true,
        EntityDetails: true     
    };

     @track sectionIcons = {
        financialYearDetails: '\u2B9F', 
        accountListDetails: '\u2B9F',
        Activity1: '\u2B9F',
        EntityDetails: '\u2B9F'
    };

    yearOptions =[
        { label:'2024-25',value:'2024-25'},
        { label:'2025-26',value:'2025-26'},
        { label:'2026-27',value:'2026-27'},
    ];
    monthOptions =[
        { label: 'January', value: 'January'},
        { label: 'February',value: 'February'},
        { label: 'March',   value: 'March'},
        { label: 'April',   value: 'April'},
        { label: 'May',     value: 'May'},
        { label: 'June',    value: 'June'},
        { label: 'July',    value: 'July'},
        { label: 'August',  value: 'August'},
        { label:'September',value: 'September'},
        { label: 'October', value: 'October'},
        { label: 'November',value: 'November'},
        { label: 'December',value: 'December'}
    ];

    industryOptions =[
        { label: '+  Add New Industry',   value: 'Add New Industry'},
        { label: 'Service', value: 'Service'},
        { label: 'Manufacturing',value: 'Manufacturing'},
        { label: 'Retail Org',   value: 'Retail Org'},
        { label: 'NFP Org',   value: 'NFP Org'},
        { label: 'Imp & Exp Org',     value: 'Imp & Exp Org'},
        { label: 'NDIS',   value: 'NDIS'},
        { label: 'Companies',   value: 'Companies'}
       
    ];
   @track  accountNameOptions = [
        { label: 'Category',   value: 'Category'},
        { label: 'Subcategory',     value: 'Subcategory'},
        { label: 'Ledger Name',   value: 'Ledger Name'},
        { label: 'Ledger Items',   value: 'Ledger Items'}
    ]
    gstAccountingMethodOptions=[
        { label: 'Accruals Basis', value: 'Accruals Basis'},
        { label: 'Cash Basis',value: 'Cash Basis'},
        { label: 'None',   value: 'None'}
    
    ];
    gstCalculationOptions =[
        { label: 'Monthly', value: 'Monthly'},
        { label: 'Quarterly(Option1)',value: 'Quarterly(Option1)'},
        { label: 'Quarterly(Option2)',   value: 'Quarterly(Option2)'},
        { label: 'Quarterly(Option3)',value: 'Quarterly(Option3)'},
        { label: 'Annually',   value: 'Annually'},
        { label: 'None',   value: 'None'}
    
    ];
    paygWithheldPriodOptions=[
        { label: 'Monthly', value: ' Monthly'},
        { label: 'Quarterly',value: 'Quarterly'},
        { label: 'None',   value: 'None'}
    
    ];
    paygIncomeTaxMethodOptions=[
        { label: 'Option 1 (Pay Installment quarterly)', value: 'Option 1 (Pay Installment quarterly)'},
        { label: 'Option 2 (Income times rate)',value: 'Option 2 (Income times rate)'},
        { label: 'None',   value: 'None'}
    
    ];
    forSalesOptions =[
        { label:'Tax Exclusive',value:'Tax Exclusive'}
    ];
    forPurchasesOptions =[
        { label:'Tax Inclusive',value:'Tax Inclusive'}
    ];
    connectedCallback(){
        console.log('orgId  IN CreateCompanyLwc: '+this.orgidtrack);
        console.log('isFromManageInvoice  IN CreateCompanyLwc: '+this.isFromManageInvoice);
        console.log('isFromFacility  IN CreateCompanyLwc: '+this.isFromFacility);
        console.log('createCompanyFacilityId  IN CreateCompanyLwc: '+this.createCompanyFacilityId);
        
        refreshApex(this.wiredCompanyResult);  
        const savedIndustryOptions = localStorage.getItem('industryOptions');
        if (savedIndustryOptions) {
            this.industryOptions = JSON.parse(savedIndustryOptions);
        }
        console.log('Company industryOptions in connectedCallback :', JSON.stringify(this.industryOptions));
        // if(this.isFromManageInvoice){
        //     this.createEditCompany='Create Company';
        //     this.buttonLabel = 'Save';
        //     this.createCompanyFlag=true;
        //    // this.companyOptions=[];
        //     this.isHome=false; 
        //     this.isCreate=true;
        //     this.industryDisable = false;
        //     this.addIndustry = false;
        //     this.enableddisabled = true;
        //     console.log('Industry Selected before:', this.selectedIndustry);
        //     this.selectedIndustry = 'Service';
        //     console.log('Industry Selected after:', this.selectedIndustry);
        //     this.isClear = false;
        // } else if(this.isFromFacility){
        //     this.createEditCompany='Create Company';
        //     this.buttonLabel = 'Save';
        //     this.createCompanyFlag=true;
        //    // this.companyOptions=[];
        //     this.isHome=false; 
        //     this.isCreate=true;
        //     this.industryDisable = false;
        //     this.addIndustry = false;
        //     this.enableddisabled = true;
        //     console.log('Industry Selected before:', this.selectedIndustry);
        //     this.selectedIndustry = 'Service';
        //     console.log('Industry Selected after:', this.selectedIndustry);
        //     this.isClear = false;
        // }
        console.log('facilityOptions  IN handleCreateCompany before: '+  JSON.stringify(this.facilityOptions)); 
        if (this.isFromFacility || this.isFromManageInvoice) {
              this.createEditCompany='Create Company';
            this.buttonLabel = 'Save';
            this.createCompanyFlag=true;
           // this.companyOptions=[];
            this.isHome=false; 
            this.isCreate=true;
            this.industryDisable = false;
            this.addIndustry = false;
            this.enableddisabled = true;
            console.log('Industry Selected before:', this.selectedIndustry);
            this.selectedIndustry = 'Service';
            console.log('Industry Selected after:', this.selectedIndustry);
            this.isClear = false;
            console.log('facilityOptions  IN handleCreateCompany: '+  JSON.stringify(this.facilityOptions));  
            if(!this.selectedCompany) {
                this.handleClear();
            } else{
                this.selectedcomp='';
                this.selectedYear='';
                this.selectedEndMonth='';
                this.gstAccountingMethod='';
                this.taxFileNumber='';
                this.gstCalculation='';
                this.paygWithheldPriod='';
                this.paygIncomeTaxMethod='';
                this.isFringeBenefitsTax=false;
                this.isFuelTaxCredits=false;
                this.isWineEqualisationTax=false;
            }
            this.selectedIndustry1 = '';
            this.hierarchyData = [];
            if(this.selectedIndustry && this.createEditCompany=='Create Company') {
                this.fetchAccountingData();
            }
        }
        //Shortcut keys
                this.handleShortcut = this.handleShortcut.bind(this);
                window.addEventListener("keydown", this.handleShortcut);

    }
    renderedCallback() {
    if (this.companyRowsFocusable) return;
    this.companyRowsFocusable = true;

    const rows = this.template.querySelectorAll('tr.tr');
    rows.forEach(r => r.setAttribute("tabindex", "0"));
}


     disconnectedCallback() {
    window.removeEventListener("keydown", this.handleShortcut);
        }

    get showItemModal() {
        return this.isItemEdit || this.isAddingItem;
    }
    get modalTitle() {
        return this.isItemEdit ? 'Edit Account List' : 'Add New Account';
    }
    get isAccountNoDisabled() {
        return this.isItemEdit; // Only disable in edit
    }
    get isAccountNoRequired() {
        return this.isAddingItem; // Only required in add
    }
    get accountLabel() {
        // if (this.contextLevel === 'items') {
        //     return 'Ledger Item';
        // }
        switch (this.selectedAccountName) {
            case 'Category':
                return 'Category';
            case 'Subcategory':
                return 'Subcategory';
            case 'Ledger Name':
                return 'Ledger';
            case 'Ledger Items':
                return 'Ledger Item';
            default:
                return 'Account';
        }
    }

    // @wire(getFacility, { orgidtrack: '$orgidtrack' })
    // wiredFacility(result) {
    //     this.wireFacility = result; 
    //     console.log('result in wiredFacility:', JSON.stringify(result));
    //     console.log('orgid  in wiredFacility : '+this.orgidtrack); 
    //     const { data, error } = result;
    //     if (data) {
    //         this.facilityOptions = data.map(facility => ({
    //             label: facility.Name,
    //             value: facility.Id
    //         }));
    //      console.log('facilityOptions : '+  JSON.stringify(this.facilityOptions));  
         
    //      //refreshApex(this.wireFacility);  
    //     } else if (error) {
    //         this.showErrorToast(error.body.message);
    //     }
    // } 
    @wire(getFacility, { orgidtrack: '$orgidtrack' })
    wiredFacility(result) {
        this.wireFacility = result; 

        console.log('result in wiredFacility:', JSON.stringify(result));
        console.log('orgid in wiredFacility:', this.orgidtrack);

        const { data, error } = result;

        if (data) {
            // 1️⃣ Build full list once
            const allFacilities = data.map(facility => ({
                label: facility.Name,
                value: facility.Id
            }));

            console.log('allFacilities:', JSON.stringify(allFacilities));

            // 2️⃣ Filter if coming from Facility / Invoice
            if (this.isFromFacility || this.isFromManageInvoice) {
                const matchedFacility = allFacilities.find(
                    fac => fac.value === this.createCompanyFacilityId
                );

                if (matchedFacility) {
                    this.facilityOptions = [matchedFacility];
                    this.selectedFacility = matchedFacility.value;
                    console.log('facilityOptions  IN wiredFacility: '+  JSON.stringify(this.facilityOptions)); 
                } else {
                    this.facilityOptions = [];
                    this.selectedFacility = null;
                    console.log('facilityOptions  IN wiredFacility111: '+  JSON.stringify(this.facilityOptions)); 
                }
            } 
            // 3️⃣ Normal case – show all facilities
            else {
                this.facilityOptions = allFacilities;
            }

        } else if (error) {
            console.error(error);
            this.showErrorToast(error.body?.message);
        }
    }
   
    handleCreateCompany(){
        this.selectedcomp = '';
        this.createEditCompany='Create Company';
        this.buttonLabel = 'Save';
        this.createCompanyFlag=true;
        this.companyOptions=[];
        this.isHome=false; 
        this.isCreate=true;
        this.industryDisable = false;
        this.addIndustry = false;
        this.enableddisabled = true;
        console.log('Industry Selected before:', this.selectedIndustry);
        this.selectedIndustry = 'Service';
        console.log('Industry Selected after:', this.selectedIndustry);
        this.isClear = false;
        console.log('facilityOptions  IN handleCreateCompany: '+  JSON.stringify(this.facilityOptions));  
        if(!this.selectedCompany) {
            this.handleClear();
        } else{
            this.selectedcomp='';
            this.selectedYear='';
            this.selectedEndMonth='';
            this.gstAccountingMethod='';
            this.taxFileNumber='';
            this.gstCalculation='';
            this.paygWithheldPriod='';
            this.paygIncomeTaxMethod='';
            this.isFringeBenefitsTax=false;
            this.isFuelTaxCredits=false;
            this.isWineEqualisationTax=false;
        }
        this.selectedIndustry1 = '';
        this.hierarchyData = [];
        if(this.selectedIndustry && this.createEditCompany=='Create Company') {
            this.fetchAccountingData();
        }
       refreshApex(this.wireFacility); 
        this.hideParentHandler();
    }
    handleCancel(){
        this.isBack=true;
    }
    // handleClose(){
    //     this.isHome=true; 
    //     this.createCompanyFlag=false;
    //     this.EditCompanyFlag =false;
    //     refreshApex(this.wireFacility); 
    //     refreshApex(this.wiredCompanyResult); 
    //     this.selectedIndustry1 = '';
    //     this.selectedIndustry = '';
    //     this.hierarchyData = [];
    //     this.hideParentHandler();
    //     this.handleClear();
    // }
    // handleClose(){
    //     console.log("isFromFacility:", this.isFromFacility);
    //     console.log("isFromManageInvoice:", this.isFromManageInvoice);
    //     this.createCompanyFlag=false;
    //     this.EditCompanyFlag =false;
    //     this.selectedIndustry1 = '';
    //     this.selectedIndustry = '';
    //     this.hierarchyData = [];
    //     this.handleClear();
    //     if(this.isFromFacility || this.isFromManageInvoice){
    //         this.isHome = false;

    //         const customEvent = new CustomEvent("createcompanyback", {
    //             detail: { message: "Hello from Create Company!" }
    //         });
    //         this.dispatchEvent(customEvent);

    //     } else {
    //         this.isHome=true; 
    //         refreshApex(this.wireFacility); 
    //         refreshApex(this.wiredCompanyResult); 
    //         this.hideParentHandler();
    //     }
      
    // }
    handleClose() {
        console.log("isFromFacility:", this.isFromFacility);
        console.log("isFromManageInvoice:", this.isFromManageInvoice);

        this.createCompanyFlag = false;
        this.EditCompanyFlag = false;
        this.selectedIndustry1 = '';
        this.selectedIndustry = '';
        this.hierarchyData = [];
        this.handleClear();

        this.navigateAfterCreateCompany();
    }
    navigateAfterCreateCompany() {
        if (this.isFromFacility || this.isFromManageInvoice) {
            this.isHome = false;

            this.dispatchEvent(
                new CustomEvent("createcompanyback", {
                    detail: { message: "Company saved successfully" }
                })
            );
        } else {
            this.isHome = true;
            refreshApex(this.wireFacility);
            refreshApex(this.wiredCompanyResult);
            this.hideParentHandler();
        }
    }

    handleBack(){
        this.isHome=false;
    }

    hideParentHandler(){
        console.log('hideParentHandler calling  >> ');
        const event = new CustomEvent('hideaccountingsettings');
        this.dispatchEvent(event);
    }
    handleHideAccountingSettings(){
        this.hideParentHandler(); 
    }
    
    handleSaveCompany() {
        console.log('handleSave ');
        if (!this.selectedcomp || this.selectedcomp === '') {
            this.showToast('Error', 'Please select a Company before saving.', 'error');
            return;
        }
        const industry = this.selectedIndustry;
        const newIndustry = this.selectedIndustry1;
        const selectedIndustry = newIndustry || industry; // Only one is used

        if (!selectedIndustry) {
            this.showToast('Error', 'Please select Industry before saving.', 'error');
            return;
        }
        console.log('handleSave - Creating company with Id:', this.selectedcomp);
        //console.log('orgid  in handleSaveCompany : '+this.orgidtrack);
        if (!this.radioCompanyOptions) {
            this.radioCompanyOptions = [];  // Initialize the array if it's not already
        }
        // Save the Company first
        insertCompany({ companyId: this.selectedcomp})
            .then(result => {
                console.log('Company created successfully. Company ID:', result);  // Log the newly created Company ID
                const companyId  = result;  // Get the newly created Company ID
                this.radioCompanyId=companyId;
                console.log('radioCompanyId in insertCompany:', this.radioCompanyId);
                //console.log('CradioCompanyOptions :', JSON.stringify(this.radioCompanyOptions)); 
                this.showToast('Success', 'Company has been created successfully', 'success');
                
                // Now create the Financial Year and Account List
                this.createFinancialYearAndAccountList([companyId]);
                this.handleSaveAccount(companyId);
                this.handleSaveActivityStatement(companyId);

                this.saveConfirmFlag=false;
                this.createCompanyFlag=false;
                this.navigateAfterCreateCompany();
            })
            .catch(error => {
                console.error('Error creating company:', error);
                this.showToast('Error', 'Unable to create the company. Try refreshing the page.', 'error');
           });
      
        //this.isHome=true;  
        //this.hideParentHandler();     
    }

    // Method to create Financial Year and Account List creation after company is created
    createFinancialYearAndAccountList(companyIds) {
        console.log('createFinancialYearAndAccountList - Company ID:', companyIds);
        
        // Create Financial Year record with company ID
        saveFinancialYearApex({ selectedCompanyIds: companyIds, year: this.selectedYear, endMonth: this.selectedEndMonth })
            .then(result => {
                console.log('Financial Year created successfully:', result);
                this.showToast('Success', 'Financial Year has been created successfully for the Company', 'success');
                const companyId = companyIds[0];                 
            })
            .catch(error => {
                console.error('Error creating Financial Year:', error);
                this.showToast('Error', 'Failed to create Financial Year', 'error');
            });
    }

    get chartClass(){
        return this.chartFlag  ? 'menu-item1' : 'menu-item'; 
    
    }
    get ActivityClass(){
        return this.ActivityFlag  ? 'menu-item1' : 'menu-item'; 
    
    }
    get EntityClass(){
        return this.EntityFlag  ? 'menu-item1' : 'menu-item'; 
      
    }
    
    handlechart(event){
        this.chartFlag  = true;
        this.ActivityFlag = false;
        this.EntityFlag = false;
    }
    handleActivity(event){
        this.chartFlag  = false;
        this.ActivityFlag = true;
        this.EntityFlag = false;
    }
    handleEntity(event){
        this.chartFlag  = false;
        this.ActivityFlag = false;
        this.EntityFlag = true;
    }

    handleSaveAccount(companyId) {
        const industry = this.selectedIndustry;
        const newIndustry = this.selectedIndustry1;
        const selectedIndustry = newIndustry || industry; // Only one is used

        if (!selectedIndustry || !companyId) {
            this.showToast('Error', 'Please select Industry and Company before saving.', 'error');
            return;
        }
        const hierarchyJson = JSON.stringify(this.hierarchyData);

        console.log('📦 Sending to Apex:');
        console.log('Industry:', industry);
        console.log('NewIndustry:', newIndustry);
        console.log('CompanyId:', companyId);
        console.log('Hierarchy JSON:',  JSON.stringify(hierarchyJson));

        saveNewAccountList({
            industry: industry,
            newIndustry: newIndustry,
            companyId: companyId,
            hierarchyJson: hierarchyJson
        })
        .then(result => {
            console.log('✅ Response from Apex:', JSON.stringify(result));
            if (result === 'Success') {
                this.showToast('Success', `Account List saved successfully for industry: ${selectedIndustry}`, 'success');

                if (newIndustry && !this.industryOptions.find(opt => opt.value === newIndustry)) {
                    this.industryOptions = [
                        ...this.industryOptions,
                        { label: newIndustry, value: newIndustry }
                    ];
                    localStorage.setItem('industryOptions', JSON.stringify(this.industryOptions));
                }

                this.addIndustry = false;
                this.enableddisabled = true;
                this.isClear = false;

            } else {
                this.showToast('Error', result, 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error saving account list:', error);
            this.showToast('Error', error?.body?.message || 'Failed to save account list.', 'error');
        });
    }

    handleSaveActivityStatement(companyId){
        console.log('Company Selected Id in saveActivityStatement :', companyId);
        const activityStatementData = {
            gstAccountingMethod: this.gstAccountingMethod,
            taxFileNumber:this.taxFileNumber,
            gstCalculation:this.gstCalculation,
            paygWithheldPriod: this.paygWithheldPriod,
            paygIncomeTaxMethod: this.paygIncomeTaxMethod,
            isFringeBenefitsTax: this.isFringeBenefitsTax,
            isFuelTaxCredits:this.isFuelTaxCredits,
            isWineEqualisationTax:this.isWineEqualisationTax,
            forSales: this.forSales,
            forPurchases: this.forPurchases
           
        };
        console.log('companactivityStatementDatayData :', JSON.stringify(activityStatementData));
        saveActivityStatement({  companyId: companyId, activityStatementData: activityStatementData })
        .then(result => {
            console.log('Activity Statement created successfully:', result);
            this.showToast('Success', 'Activity Statement has been created successfully for the Company', 'success');
            refreshApex(this.wiredCompanyResult); 
        })
        .catch(error => {
            console.error('Error creating Activity Statement:', error);
            this.showToast('Error', 'Failed to create Activity Statement', 'error');
        });
    }
    @wire(getCompany, { selectedId: '$selectedCompany', orgid: '$orgidtrack' })
    wiredCompanyData(result) {
        console.log('selectedCompany in wire:', this.selectedCompany);
        this.wiredCompanyResult = result;
        const { data, error } = result;
        console.log('data in  wiredCompanyData >>'+JSON.stringify(data));
        if (data) {
            // Store the full list of companies to use for the dropdown options
            this.getCompanyResult = data.map(company => ({
                Id: company.Id,
                Company_Name__c: company.Company_Name__c,
                ABN__c: company.ABN__c,
                Phone_Number__c: company.Phone_Number__c,
                Email__c: company.Email__c
            }));

            // If data is available, populate the dropdown options
            this.companyOptionsAll = data.map(company => ({
                label: company.Company_Name__c,  // Company name as label
                value: company.Id                // Company ID as value
            }));

            // Always ensure the "All" option is present at the top of the dropdown
            if (!this.companyOptionsAll.some(option => option.value === 'All')) {
                this.companyOptionsAll.unshift({ label: 'All', value: 'All' });
            }

            // Update the table data based on the selected company
            if (this.selectedCompany === 'All') {
                this.companyData = [...this.getCompanyResult];
                this.records = this.getCompanyResult; // The list of all available records (can be filtered)
                this.totalRecords = this.records.length; // Update the total records count
               // this.pageSize = this.pageSizeOptions ? this.pageSizeOptions[0] : 10; // Default page size
                this.pageSize = this.pageSizeOptions[0];
                this.pageNumber = 1; // Initial page number
               // this.filteredCompanyData = []; // Empty filtered data initially
        
                // If we have records, then pagination is visible
                if (this.totalRecords > 0) {
                    this.paginationVisible = true;
                } else {
                      this.paginationVisible = false;
                }
                this.paginationHelper(); 
            } else {
                this.companyData = this.getCompanyResult.filter(company => company.Id === this.selectedCompany);
                this.paginationVisible = false; 
            } 
            
        } else if (error) {
            console.error('Error retrieving company data:', JSON.stringify(error));
            this.error = error.body.message || error.message;
        }
    }
   
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id;
        const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);
    
        if (!this.sectionFlags[sectionId]) {
            // First click: Set the section to true so it loads in the DOM
            this.sectionFlags[sectionId] = true;
        } else {
            // From second click onwards: Just toggle the hidden-section class
            sectionElement.classList.toggle('hidden-section');
        }
        // Toggle the icon dynamically
        this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
    }

    @wire(getProfiles ,{radioCompanyId: '$radioCompanyId' })
    wiredProfiles(result) {
        //console.log('selectedcomp IN wiredProfiles:', this.selectedcomp);
        this.wiredProfileResult = result; 
        const { data, error } = result;
        if (data) {
            console.log('wiredProfiles data >> ' +JSON.stringify(data));
           console.log('wiredProfiles calling>>');
            this.allProfiles = data.allProfiles || [];
            this.filteredProfiles = this.allProfiles;
            console.log('allProfiles >>  '+JSON.stringify(this.allProfiles));
            this.customerProfiles = data.customerProfiles || [];
            this.supplierProfiles = data.supplierProfiles || [];
            this.filteredAllProfiles = [...this.allProfiles];
            this.filteredCustomerProfiles = [...this.customerProfiles];
            this.filteredSupplierProfiles = [...this.supplierProfiles];
        } else if (error) {
            console.error('Error fetching profiles:', error);
        }
    }
   
    fetchAccountingData() {
        console.log('Calling getAccountingData with:', this.selectedIndustry);

        getAccountingData({ selectedIndustry: this.selectedIndustry })
            .then(data => {
                console.log('Data in imperative call:', JSON.stringify(data));

                if (Array.isArray(data)) {
                    const initialIndustryData = data.map(category => ({
                        ...category,
                        expanded: true,
                        iconName: 'utility:chevronright',
                        categories: [category].map(cat => ({
                            ...cat,
                            expanded: true,
                            iconName: 'utility:chevronright',
                            subCategories: cat.subCategories?.map(subCategory => ({
                                ...subCategory,
                                expanded: true,
                                iconName: 'utility:chevronright',
                                ledgers: subCategory.ledgers?.map(ledger => ({
                                    ...ledger,
                                    expanded: true,
                                    iconName: 'utility:chevronright',
                                    items: ledger.items || []
                                })) || []
                            })) || []
                        }))
                    }));
                    this.hierarchyData = [...initialIndustryData];
                    console.log('hierarchyData:', JSON.stringify(this.hierarchyData));
                } else {
                    console.error('Data is not in expected array format:', data);
                }
            })
            .catch(error => {
                console.error('Error in imperative getAccountingData:', error);
            });
    }
 
    fetchHierarchyData(industryValue ,companyId ) {
        console.log('industryValue:', industryValue);
        console.log('companyId:', companyId);

        getNewHierarchyData({ selectedIndustry: industryValue, companyId: companyId })
            .then(data => {
                console.log('Data from imperative call:', JSON.stringify(data));

                if (Array.isArray(data)) {
                    let selectedIndustryData = data.map(accountList => ({
                        ...accountList,
                        expanded: true,
                        iconName: 'utility:chevronright',
                        categories: accountList.categories?.map(category => ({
                            ...category,
                            expanded: true,
                            iconName: 'utility:chevronright',
                            subCategories: category.subCategories?.map(subCategory => ({
                                ...subCategory,
                                expanded: true,
                                iconName: 'utility:chevronright',
                                ledgers: subCategory.ledgers?.map(ledger => ({
                                    ...ledger,
                                    expanded: true,
                                    iconName: 'utility:chevronright',
                                    items: ledger.items || []
                                })) || []
                            })) || []
                        })) || []
                    }));
                    this.hierarchyData = [...selectedIndustryData];
                    console.log('hierarchyData:', JSON.stringify(this.hierarchyData));
                    
                } else {
                    console.error('Unexpected data format:', data);
                }
            })
            .catch(error => {
                console.error('Error fetching account data:', error);
            });
    }

    toggleAccountList(event) {
        const accountListId = event.target.dataset.id;
        const accountList = this.hierarchyData.find(list => list.accountListId === accountListId);
        if (accountList) {
            accountList.expanded = !accountList.expanded;
            accountList.iconName = accountList.expanded ? 'utility:chevrondown' : 'utility:chevronright';
        }
    }

    // Toggle Category expansion/collapse
    toggleCategory(event) {
        const categoryId = event.target.dataset.id;
        const category = this.hierarchyData
            .flatMap(accountList => accountList.categories)
            .find(cat => cat.accountNumber === categoryId);
        if (category) {
            category.expanded = !category.expanded;
            category.iconName = category.expanded ? 'utility:chevrondown' : 'utility:chevronright';
        }
    }

    // Toggle Subcategory expansion/collapse
    toggleSubCategory(event) {
        const categoryId = event.target.dataset.categoryId;
        const subCategoryId = event.target.dataset.subcategoryId;
        const category = this.hierarchyData
            .flatMap(accountList => accountList.categories)
            .find(cat => cat.accountNumber === categoryId);
        const subCategory = category?.subCategories.find(sub => sub.accountNumber === subCategoryId);
        if (subCategory) {
            subCategory.expanded = !subCategory.expanded;
            subCategory.iconName = subCategory.expanded ? 'utility:chevrondown' : 'utility:chevronright';
        }
    }

    // Toggle Ledger expansion/collapse
    toggleLedger(event) {
        const subCategoryId = event.target.dataset.subcategoryId;
        const ledgerId = event.target.dataset.ledgerId;
        const category = this.hierarchyData
            .flatMap(accountList => accountList.categories)
            .find(cat => cat.subCategories.some(sub => sub.accountNumber === subCategoryId));
        const subCategory = category?.subCategories.find(sub => sub.accountNumber === subCategoryId);
        const ledger = subCategory?.ledgers.find(ld => ld.accountNumber === ledgerId);
        if (ledger) {
            ledger.expanded = !ledger.expanded;
            ledger.iconName = ledger.expanded ? 'utility:chevrondown' : 'utility:chevronright';
        }
    }
    
    addressInputChange1(event) {
        /* console.log('event detail'+JSON.stringify(event.detail));  */
        this.street1 = event.detail.street;
        this.city1 = event.detail.city;
        this.province1 = event.detail.province;
        this.country1 = event.detail.country;
        this.postalcode1 = event.detail.postalCode;
    }
    handleIndustyChange(event){
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        switch (fieldName) {

        // this.selectedIndustry= fieldValue;
            case 'selectedIndustry':
                this.selectedIndustry = fieldValue;
                console.log('selectedIndustry :'+this.selectedIndustry);
                 if(this.selectedIndustry && this.createEditCompany=='Create Company') {
                    //refreshApex(this.wiredAccountList);
                        this.fetchAccountingData();
                 }
                break;
            case 'selectedIndustry1':
                this.selectedIndustry1 = fieldValue;
                console.log('selectedIndustry1 :'+this.selectedIndustry1);
                    this.enableddisabled = false;
                break;
        }
        if(this.selectedIndustry ==='Add New Industry'){
            this.addIndustry = true;
            this.enableddisabled = false;
            this.isClear = true;
            this.selectedIndustry='';
        }
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 3000);  
    }
  
    handleChange(event){
        const fieldName = event.target.name;
        const fieldValue = event.target.value; 
        const fieldChecked=event.target.checked;
        switch (fieldName) {

            case 'companyName':
                
                this.selectedCompany  = fieldValue;
                console.log('selectedcomp in handleChange:', this.selectedCompany);
                if( this.selectedCompany ==='All'){
                    this.orgidtrack = this.orgidtrack;
                    console.log(' if selectedcomp in handleChange:', this.selectedCompany);
                    this.companyData=[...this.getCompanyResult];
                  //  refreshApex(this.wiredCompanyResult); 
                } else {
                    console.log(' else selectedcomp in handleChange:', this.selectedCompany);
                   // refreshApex(this.wiredCompanyResult); 
                   //this.companyData = this.getCompanyResult.filter(rec => rec.Id === this.selectedCompany);
                   this.companyData = this.getCompanyResult.filter(company => company.Id === this.selectedCompany);
                }

                break;
            case 'organisation':
                this.selectedOrg = fieldValue;
                break;
            // case 'industry':
            //     this.industry=fieldValue;
            //     break; 
            case 'year':
               // console.log('fy in handle change after');
                this.selectedYear = fieldValue;
                console.log('year :'+this.selectedYear);
                break;
            case 'endMonth':
                this.selectedEndMonth = fieldValue;
                console.log('end month :'+this.selectedEndMonth);
                break;
            // case 'startMonth':
            //     this.selectedStartMonth = fieldValue;
            //     console.log('start month :'+this.selectedStartMonth);
            //     break; 
                
            case 'facilityName':
                this.selectedcomp = fieldValue;
                console.log('this.selectedcomp:'+this.selectedcomp);
                break; 
            case 'gstAccountingMethod':
                // console.log('fy in handle change after');
                    this.gstAccountingMethod = fieldValue;
                    console.log('gstAccountingMethod :'+this.gstAccountingMethod);
                    break;
            case 'taxFileNumber':
                this.taxFileNumber = fieldValue;
                console.log('taxFileNumber :'+this.taxFileNumber);
                break;
            case 'gstCalculation':
                this.gstCalculation = fieldValue;
                console.log('gstCalculation :'+this.gstCalculation);
                break; 
                
            case 'paygWithheldPriod':
                this.paygWithheldPriod = fieldValue;
                console.log('paygWithheldPriod:'+this.paygWithheldPriod);
                break;
            case 'paygIncomeTaxMethod':
                // console.log('fy in handle change after');
                this.paygIncomeTaxMethod = fieldValue;
                console.log('paygIncomeTaxMethod :'+this.paygIncomeTaxMethod);
                break;
            case 'forSales':
                this.forSales = fieldValue;
                console.log('forSales :'+this.forSales);
                break;
            case 'forPurchases':
                this.forPurchases = fieldValue;
                console.log('forPurchases :'+this.forPurchases);
                break; 
            case 'isFringeBenefitsTax':
                // console.log('fy in handle change after');
                this.isFringeBenefitsTax = fieldChecked;
                console.log('isFringeBenefitsTax :'+this.isFringeBenefitsTax);
                break;
            case 'isFuelTaxCredits':
                this.isFuelTaxCredits = fieldChecked;
                console.log('isFuelTaxCredits :'+this.isFuelTaxCredits);
                break;
            case 'isWineEqualisationTax':
                this.isWineEqualisationTax = fieldChecked;
                console.log('isWineEqualisationTax :'+this.isWineEqualisationTax);
                break; 
            case 'accountName':
                this.accountName = fieldValue;
                console.log('accountName :'+this.accountName);
                break; 
            case 'accountNo':
                this.accountNo = fieldValue;
                if (this.isAddingItem && this.checkAccountNoExist(fieldValue)) {
                   // this.accountNo = '';
                    this.disabledSave = true;
                    this.showToast('Error', 'This Account Number already exists.', 'error');
                  setTimeout(() => {
                        this.accountNo = '';
                        const inputEl = this.template.querySelector('input[data-id="accountNoInput"]');
                        if (inputEl) {
                            inputEl.value = '';
                        }
                    }, 1000);
                   
                } else {
                    this.disabledSave = false;
                    this.accountNo = fieldValue;

                }
                console.log('accountNo  :'+this.accountNo );
                break; 
            default:
                break;
        }
    }
    checkIfCompanyExists() {
        console.log('checkIfCompanyExists');
        console.log('Selected company name before checkCompanyName:', this.selectedCompanyName); 
        checkCompanyName({ companyName: this.selectedCompanyName })
            .then(result => {
                console.log('Selected company name in checkCompanyName:', this.selectedCompanyName); 
                // Disable the button if company name already exists
                this.disableCreate = result;
            })
            .catch(error => {
                // Handle errors
                console.error('Error checking company name', error);
            });
    }
    @wire(getUserOrganisation)
    wiredOrg({ error, data }) {
       // console.log('data in getUserOrganisation : '+JSON.stringify(data));
        if (data) {
            // If we successfully fetch the organization, populate the form fields
           // console.log('orgName  before: '+ this.orgName);
            this.orgName = data.Name;
           // console.log('orgName : '+ this.orgName);
            this.abn=data.ABN__c;
            this.contactName = data.Contact_Name__c;
            this.contactNo=data.Contact_No__c;
         //   console.log('email before : '+ this.emailId);
            this.emailId=data.Email__c ;
            this.city =data.Address_Latest__City__s; 
            this.country =data.Address_Latest__CountryCode__s;
            this.province = data.Address_Latest__StateCode__s;
            this.postalcode = data.Address_Latest__PostalCode__s; 
            this.street=data.Address_Latest__Street__s; 
          //  console.log('street : '+ this.street);
            this.isDisabled = true; // Disabling the fields since they are prefilled
        } else if (error) {
            console.error('Error fetching organization: ', error);
        }
    }
   
    handleSave(){
        if (this.buttonLabel === 'Save') {
            this.saveConfirmFlag=true;
        } else  if(this.buttonLabel === 'Update'){
            this.handleUpdate();
            console.log(' console in Company updated2:');  
            refreshApex(this.wiredCompanyResult);
            console.log(' console in Company updated3:'); 
        } 
    }
    handleNoSave(){
        this.saveConfirmFlag=false;;
    }
    
    fetchReplist(){
        refreshApex(this.wiredProfileResult);
    }
    handleEdit(event) {
        this.createCompanyFlag = false;
        this.EditCompanyFlag = true;
        this.isCreate=false;
        this.chartFlag=true;
       // this.ActivityFlag = false;
       // this.EntityFlag = false;
       this.ActivityFlag = false;
        this.EntityFlag = false;
        this.isHome = false;
        //this.facilityOptions=[];
        console.log('facilityOptions : '+  JSON.stringify(this.facilityOptions));
        console.log('companyOptions : '+  JSON.stringify(this.companyOptions));    
        this.createEditCompany='Edit Company';
        this.buttonLabel = 'Update';
        this.isHome = false; 
        this.enableEntity=true;
        this.selectedId = event.target.dataset.id;
        console.log('Edit button clicked for Company ID: ' + this.selectedId);
        this.isLoading = true;
        this.hierarchyData=[];
        // if(this.selectedIndustry && this.createEditCompany=='Edit Company') {
        //    //refreshApex(this.wiredAccountList);
        //   this.fetchHierarchyData();
        // }
        

        this.hideParentHandler();
        setTimeout(() => {
            this.isLoading = false;
            this.fetchCompanyDetails(this.selectedId);
        }, 1000);
       
    }

    getFirstRecord(array) {
        return Array.isArray(array) && array.length > 0 ? array[0] : null;
    }
    @track companyIndustry;
    fetchCompanyDetails(companyId) {
        console.log('fetchCompanyDetails is calling');
        console.log('Fetching company details for Company ID: ' + companyId);
        
        getCompanyOnEdit({ companyId: companyId })
        .then(result => {
            console.log('Company data fetched:', result);

            if (result) {
                // Populate company options
                this.companyOptions = result.companyOptions.map(company => ({
                    label: company.Company_Name__c,
                    value: company.Id
                }));
                console.log('companyOptions in getCompanyOnEdit: ', JSON.stringify(this.companyOptions));
            
                this.companyNameInEdit = result.company.Company_Name__c;
            
                // Financial Year Data
                let financialYear = this.getFirstRecord(result.company.Financial_Year__r);
            
                if (financialYear) {
                    console.log('financialYear in getCompanyOnEdit before: ', JSON.stringify(financialYear));
                    this.selectedYear = financialYear.Financial_Year__c || '';
                    console.log('financialYear field  in getCompanyOnEdit: ', this.selectedYear);
                    this.selectedEndMonth = financialYear.End_Month__c || '';
                   // this.selectedStartMonth = financialYear.Start_Month__c || '';
                } else {
                    this.selectedYear = '';
                    this.selectedEndMonth = '';
                    //this.selectedStartMonth = '';
                }
            
                console.log('financialYear in getCompanyOnEdit: ', JSON.stringify(financialYear));
            
                // Account List Data
                let accountList = this.getFirstRecord(result.company.Account_List__r);
            
                if (accountList) {
                    const industryValue = accountList.Industry__c || '';
                    this.companyIndustry = industryValue;
                    console.log('accountList in getCompanyOnEdit: ', JSON.stringify(accountList));
                    console.log('Industry from accountList:', industryValue);
                    // const existsInOptions = this.industryOptions.some(option => option.value === industryValue);
                    console.log('industryOptions in getCompanyOnEdit: ', JSON.stringify(this.industryOptions));
                    //Check if industryValue exists in industryOptions
                    const existsInOptions = this.industryOptions.some(option => option.value === industryValue);
                    console.log('existsInOptions accountList:', existsInOptions);
                    this.addIndustry = !existsInOptions;
                    console.log(' this.addIndustry IN  accountList:',  this.addIndustry);
                    if (industryValue) {
                        this.fetchHierarchyData(industryValue,companyId);
                    }
                        this.selectedIndustry = industryValue;
                    
                } 
            
                // Activity Statement Data (BAS and IAS)
                let activityStatementList = this.getFirstRecord(result.company.BAS_and_IASs__r);
            
                if (activityStatementList) {
                    console.log('activityStatementList in getCompanyOnEdit:', JSON.stringify(activityStatementList));
                    this.gstAccountingMethod = activityStatementList.GST_Accounting_Method__c || '';
                    this.taxFileNumber = activityStatementList.Tax_File_Number__c || '';
                    this.gstCalculation = activityStatementList.GST_Calculation__c || '';
                    console.log('gstCalculation IN getCompanyOnEdit:', this.gstCalculation);
                    this.paygWithheldPriod = activityStatementList.PAYG_Withheld_Period__c || '';
                    this.paygIncomeTaxMethod = activityStatementList.PAYG_Income_Tax_Method__c || '';
                    this.isFringeBenefitsTax = activityStatementList.Fringe_Benefits_Tax__c || false;
                    this.isFuelTaxCredits = activityStatementList.Fuel_Tax_Credits__c || false;
                    this.isWineEqualisationTax = activityStatementList.Wine_Equalisation_Tax__c || false;
                    this.forSales = activityStatementList.For_Sales__c || '';
                    this.forPurchases = activityStatementList.For_Purchases__c || '';
                } else {
                    this.gstAccountingMethod = '';
                    this.taxFileNumber = '';
                    this.gstCalculation = '';
                    this.paygWithheldPriod = '';
                    this.paygIncomeTaxMethod = '';
                    this.isFringeBenefitsTax = false;
                    this.isFuelTaxCredits = false;
                    this.isWineEqualisationTax = false;
                    this.forSales = '';
                    this.forPurchases = '';
                }
            
                 //this.radioCompanyId = this.selectedcomp;
                this.radioCompanyId =result.company.Id;
                console.log('radioCompanyId in getCompanyOnEdit:', this.radioCompanyId);
                this.radioCompanyOptions = this.companyOptions;
            
                // Extra fields
                this.selectedFinancialYears = result.company.Financial_Year__r || [];
                this.selectedAccountList = result.company.Account_List__r || [];
            
                this.buttonLabel = 'Update';
                this.industryDisable = true;
            
                // Final console log
                console.log('Populated Fields: ', {
                    selectedYear: this.selectedYear,
                    selectedEndMonth: this.selectedEndMonth,
                   // selectedStartMonth: this.selectedStartMonth,
                    selectedIndustry: this.selectedIndustry,
                    gstCalculation: this.gstCalculation
                });
            } else {
                this.showToast('Error', 'No data found for this company!', 'error');
                console.log('No company data returned for ID:', companyId);
            }
        })
        .catch(error => {
            this.showToast('Error', 'Error fetching company data!', 'error');
            console.error('Error fetching company data', error);
            console.log('Error details:', error);
        });
    }
    handleUpdate() {
        console.log('--- handleUpdate() method started ---');
        
        const companyData = {
            selectedId: this.selectedId,
            selectedYear:this.selectedYear,
            selectedEndMonth:this.selectedEndMonth,
           // selectedStartMonth: this.selectedStartMonth,
            //selectedIndustry: this.selectedIndustry,
            gstAccountingMethod: this.gstAccountingMethod,
            taxFileNumber:this.taxFileNumber,
            gstCalculation:this.gstCalculation,
            paygWithheldPriod: this.paygWithheldPriod,
            paygIncomeTaxMethod: this.paygIncomeTaxMethod,
            isFringeBenefitsTax: this.isFringeBenefitsTax,
            isFuelTaxCredits:this.isFuelTaxCredits,
            isWineEqualisationTax:this.isWineEqualisationTax,
            forSales: this.forSales,
            forPurchases: this.forPurchases
           
        };
        console.log('companyData:', JSON.stringify(companyData));
    
        // Call Apex to update the company record with the stringified data
        updateCompany({ companyData: companyData })
            .then(result => {
                this.showToast('Success', 'Company updated successfully!', 'success');
                console.log('Company updated:', result);
            })
            .catch(error => {
                this.showToast('Error', 'Error updating company!', 'error');
                console.error('Error updating company', error);
            });
            //console.log(' console in Company updated1:');  
            // this.saveConfirmFlag=false;
           
            this.isHome=true; 
            this.createCompanyFlag=false;
            this.EditCompanyFlag =false;
            this.hideParentHandler();
    }
    handleClear(){
        console.log('facilityOptions in handleClear : '+  JSON.stringify(this.facilityOptions));
        this.selectedcomp='';
       // this.selectedcomp1='';
        this.selectedYear='';
        this.selectedEndMonth='';
       // this.selectedStartMonth='';
       // this.selectedcomp2='';
        this.selectedIndustry='';

        this.gstAccountingMethod='';
        this.taxFileNumber='';
        this.gstCalculation='';
        this.paygWithheldPriod='';
        this.paygIncomeTaxMethod='';
        this.isFringeBenefitsTax=false;
        this.isFuelTaxCredits=false;
        this.isWineEqualisationTax=false;
        this.forSales='';
        this.forPurchases='';
         
    }
    get allCardsClass(){
        return (this.allCardsFlag || this.allCardsEditFlag) ? 'menu-item1' : 'menu-item';
    }
    get customerClass(){
        return (this.customerFlag || this.customerEditFlag) ? 'menu-item1' : 'menu-item';
    }
    get supplierClass(){
        return (this.supplierFlag || this.supplierEditFlag) ? 'menu-item1' : 'menu-item'; 
    }
    get employeeClass(){
        return (this.employeeFlag || this.employeeEditFlag) ? 'menu-item1' : 'menu-item';
    }
    get personalClass(){
        return (this.personalFlag || this.personalEditFlag) ? 'menu-item1' : 'menu-item';
    }
    handleAllClass(){
        this.allCardsFlag=true;
        this.customerFlag=false;
        this.supplierFlag=false;
        this.employeeFlag=false;
        this.personalFlag=false;
        this.allCardsEditFlag=false;
        this.customerEditFlag=false;
        this.supplierEditFlag=false;
        // this.employeeEditFlag=false;
        // this.personalEditFlag=false;
        this.isCustomer='';
    }
    handleCustomer(){
        this.allCardsFlag=false;
        this.customerFlag=true;
        this.supplierFlag=false;
        this.employeeFlag=false;
        this.personalFlag=false;
        this.allCardsEditFlag=false;
        this.customerEditFlag=false;
        this.supplierEditFlag=false;
        // this.employeeEditFlag=false;
        // this.personalEditFlag=false;
        this.isCustomer='Customer';
    }
    handleSupplier(){
        this.allCardsFlag=false;
        this.customerFlag=false;
        this.supplierFlag=true;
        this.employeeFlag=false;
        this.personalFlag=false;
        this.allCardsEditFlag=false;
        this.customerEditFlag=false;
        this.supplierEditFlag=false;
        // this.employeeEditFlag=false;
        // this.personalEditFlag=false;
        this.isCustomer='Supplier';
    }
    handleEmployee(){
        this.allCardsFlag=false;
        this.customerFlag=false;
        this.supplierFlag=false;
        this.employeeFlag=true;
        this.personalFlag=false;
        this.allCardsEditFlag=false;
        this.customerEditFlag=false;
        this.supplierEditFlag=false;
        this.employeeEditFlag=false;
        this.personalEditFlag=false;
        this.isCustomer='';
    }
    handlePersonal(){
        this.allCardsFlag=false;
        this.customerFlag=false;
        this.supplierFlag=false;
        this.employeeFlag=false;
        this.personalFlag=true;
        this.allCardsEditFlag=false;
        this.customerEditFlag=false;
        this.supplierEditFlag=false;
        this.employeeEditFlag=false;
        this.personalEditFlag=false;
        this.isCustomer='';
    }
    handleCreateCard(){
        
        console.log(' this.isCustomer '+ this.isCustomer);
        this.selectedEntityId='';
        this.createCardFlag=true;
        this.createCompanyFlag=false;
        this.EditCompanyFlag=false;
        this.taxCode='';
        this.accountList='';
        this.isHome = false;

        this.hideParentHandler();
        
    }
    childevent(event){

        const name = event.detail.message;
        console.log('CHILD MESSAGE'+name);
     
        switch (name) { 
            case 'Entities':
                this.EditCompanyFlag=true;
                this.chartFlag = false;
                this.EntityFlag = true;
                this.ActivityFlag = false; 
                this.createCardFlag =false;
                this.isHome=false;
                refreshApex(this.wiredProfileResult);
                break;

        
            default:
             this.isHome=true;
        }  
    } 
    handleSearchChange(event) {
        this.searchProfile = event.target.value;
        //console.log('searchProfile : '+this.searchProfile);
        clearTimeout(this.timeout); // Clear the previous timeout
        this.timeout = setTimeout(() => {
            this.applySearch(); // Apply filters after delay
        }, 1000);
    }
    handleKeyup(event) {
        if (event.key === 'Enter') {
            this.handleSearchChange(event); // Trigger search on Enter key
        }
    }
    applySearch() {
        //console.log('Search term entered: ' + this.searchProfile);
        // If the search term is present
        if (this.searchProfile) {
            const searchPattern = new RegExp(this.searchProfile, 'i'); // 'i' for case-insensitive matching
            this.filteredAllProfiles = this.allProfiles.filter(profile => {
                let fullName = '';
                if (profile.Name__c) {
                    fullName = profile.Name__c;  
                } else {
                    fullName = `${profile.First_Name__c ?? ''} ${profile.Last_Name__c ?? ''}`.trim();  // Ensure full name is trimmed
                }
                //console.log('All profiles full name being matched: ' + fullName);
                return searchPattern.test(fullName);
            });
            this.filteredCustomerProfiles = this.customerProfiles.filter(profile => {
                let fullName = '';
                if (profile.Name__c) {
                    fullName = profile.Name__c; 
                } else {
                    fullName = `${profile.First_Name__c ?? ''} ${profile.Last_Name__c ?? ''}`.trim();  // Ensure full name is trimmed
                }
                //console.log('Customer full name being matched: ' + fullName);
                return searchPattern.test(fullName);
            });
            this.filteredSupplierProfiles = this.supplierProfiles.filter(profile => {
                let fullName = '';
                if (profile.Name__c) {
                    fullName = profile.Name__c;  
                } else {
                    fullName = `${profile.First_Name__c ?? ''} ${profile.Last_Name__c ?? ''}`.trim();  // Ensure full name is trimmed
                }
                //console.log('Supplier full name being matched: ' + fullName);
                return searchPattern.test(fullName);
            });
        } else {
            // If the search term is empty, show all profiles
            this.filteredAllProfiles = [...this.allProfiles];
            this.filteredCustomerProfiles = [...this.customerProfiles];
            this.filteredSupplierProfiles = [...this.supplierProfiles];
        }
        
    } 
    
    handleEditEntity(event){
        if(this.allCardsFlag){
            this.isCustomer=event.currentTarget.dataset.card;
        }
        console.log('iscustomer',this.isCustomer);

        this.taxCode= event.currentTarget.dataset.taxcode; //Vamshi
        this.accountList=event.currentTarget.dataset.acclist; //need to invoke in html
        console.log('Parent passed taxCode:', this.taxCode);
        console.log('Parent passed accountList:', this.accountList);

        this.selectedEntityId = event.target.dataset.id;
        console.log('Edit button clicked for selectedEntityId: ' + this.selectedEntityId);
         console.log("CLICKED ICON → RAW DATASET:", JSON.stringify(event.target.dataset));
        console.log("dataset.taxCode:", event.currentTarget.dataset.taxCode);
        console.log("dataset.accList:", event.currentTarget.dataset.accList);

        if( this.selectedEntityId){
            this.fetchEntityOnEdit(this.selectedEntityId);
        }
          //  Read card type (Customer / Supplier / Employee / Personal) add by vamshi
       // this.isCustomer = event.currentTarget.dataset.cardtype;
        this.createCardFlag=true;
        this.createCompanyFlag=false;
        this.EditCompanyFlag=false;
        this.isHome = false;
        this.hideParentHandler();

       
    }
    fetchEntityOnEdit(entityId){
        console.log('fetchEntityOnEdit IS CALLED:');
        console.log('selectedEntityId IN fetchEntityOnEdit : ' + entityId);
        getEntityOnEdit({ recordId: this.selectedEntityId })
            .then(result => {
                console.log('Company data fetched:', JSON.stringify(result));
                
                if (result && result.companyRecord) {  // Make sure companyRecord exists
                    console.log('isCustomer in getEntityOnEdit: ' + result.companyRecord.Card_Type__c);
                    this.isCustomer = result.companyRecord.Card_Type__c;  // Access Card_Type__c from companyRecord
                    console.log('isCustomer in getEntityOnEdit: ' + this.isCustomer);
                    // ⭐ ADD THESE TWO LINES 
                    // this.taxCode = company.Tax_Code__c || null;
                    // this.accountList = company.AccountList__c || null;

                }
            })
            .catch(error => {
                console.error('Error in fetchEntityOnEdit:', error);
            });
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
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
       // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        let tempconList=[];   
       // console.log('calling pagination Data1 >>'+JSON.stringify(tempconList));    
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
        //console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.companyData= tempconList;
    }
    handleClearNewIndustry(){
        this.addIndustry = false;
        this.enableddisabled = true;
        this.selectedIndustry = 'Service';
        this.selectedIndustry1 = '';
        this.isClear = false;
        this.uploadedFiles = null;
    }
    handleDownloadTemplate(event){
      //  const fileUrl = '/resource/Sample_Account_List';  // Update the file URL if necessary
       // window.open(fileUrl, '_blank');
        window.open(myResource, '_blank');


    }
    handleInstructions(event){
        //const fileUrl = '/resource/Import_AL_Instructions';  // Update the file URL if necessary
       // window.open(fileUrl, '_blank');
        window.open(instructionsResource, '_blank');
    }
    @track uploadedFiles;
   // @track uploadedFileName = '';
    handleButtonImport() {
          console.log('selectedIndustry1 IN handleButtonImport:', this.selectedIndustry1);
        // Trigger file input click
        if(this.selectedIndustry1){
             console.log('selectedIndustry1 IN handleButtonImport IF:', this.selectedIndustry1);
           // this.template.querySelector('.file-input').click();
           const fileInput = this.template.querySelector('.file-input');
            // 🔄 Reset file input to allow re-upload of the same file
            fileInput.value = null;
    
            fileInput.click();
           
        } else {
            this.showToast('Error', 'Please enter an industry name before importing.', 'error');
        } 
       
    }
    handleImport(event) {
        
        console.log('Function called in LWC');

        console.log('Event:', event);

        const fileList = event.target.files;
        console.log('Uploaded Files:', JSON.stringify(fileList));

        if (fileList && fileList.length > 0) {
            const fileInput = fileList[0];
            this.uploadedFiles = fileInput;

            console.log('File Input:', fileInput);
            console.log('File Name:', fileInput.name);
            console.log('this.uploadedFiles:', JSON.stringify(this.uploadedFiles));

            if (!fileInput.name.endsWith('.csv')) {
                this.showToast('Error', 'Please upload a CSV file.', 'error');
                this.enableddisabled = false;
                return;
            }

            this.enableddisabled = true;
            // this.uploadedFileName = fileInput.name;
            // this.uploadfilenameflag = true;

            this.readFileContent(fileInput);
        }
    }
    
    readFileContent(file) {
       
        //     console.log('Structured Nested JSON:', JSON.stringify(structuredData));
            if (!file.name.endsWith('.csv')) {
                this.showToast('Invalid File', 'Please upload a CSV file.', 'error');
                return;
            }

            const reader = new FileReader();
            
            reader.onload = () => {
                const fileContents = reader.result;
                console.log('CSV File Contents:', fileContents);
                
                const structuredData = this.parseCsvToNestedJson(fileContents);
                if (structuredData === null) {
                    console.log('CSV Validation Failed');
                    return;
                }

                console.log('Structured Nested JSON:', JSON.stringify(structuredData));
                // You can continue with further processing here (e.g., send to Apex)
            

            reader.onerror = () => {
                this.showToast('File Read Error', 'Unable to read the file.', 'error');
            };
    
            if (Array.isArray(structuredData)) {
               let importedData = structuredData.map(category => ({
                    ...category,
                    expanded: true,
                    iconName: 'utility:chevronright',
                    categories: [category].map(cat => ({
                        ...cat,
                        expanded: true,
                        iconName: 'utility:chevronright',
                        subCategories: cat.subCategories?.map(subCategory => ({
                            ...subCategory,
                            expanded: true,
                            iconName: 'utility:chevronright',
                            ledgers: subCategory.ledgers?.map(ledger => ({
                                ...ledger,
                                expanded: true,
                                iconName: 'utility:chevronright',
                                items: ledger.items || []
                            })) || []
                        })) || []
                    }))
                }));
                this.hierarchyData  = [...importedData];
                console.log('hierarchyData:', JSON.stringify(this.hierarchyData));
            }
        };
        reader.readAsText(file);
    }
   
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
    parseCsvToNestedJson(csvText) {
        const lines = csvText.trim().split('\n');
        lines.shift(); // Remove the header line

        const result = [];
        const getTrimmed = str => str.replace(/^["']|["']$/g, '').trim();

        const categories = {};
        this.validationErrors = [];

        // Set of required names (can include categories, ledgers, or ledger items)
        const requiredNames = new Set([
            'Assets',
            'Liabilities',
            'Equity',
            'Income',
            'Cost Of Goods sold',
            'Expenses',
            'Trade Debtors',
            'GST Paid',
            'Trade Creditors',
            'GST Collected',
            'Supplier Over Payment',
            'Customer Over Payment'
        
        ]);

        const foundRequiredNames = new Set();

        for (const line of lines) {
            const [snoRaw, accNumRaw, nameRaw] = line.split(',');
            const sno = snoRaw.trim();
            const accountNumber = getTrimmed(accNumRaw);
            const name = getTrimmed(nameRaw);

            if (name === '') continue;

            const parts = sno.split('.');

            // Track required names that are found
            if (requiredNames.has(name)) {
                foundRequiredNames.add(name);
            }

            // Build hierarchy as before
            if (parts.length === 1) {
                const category = {
                    accountNumber,
                    name,
                    subCategories: []
                };
                categories[sno] = category;
                result.push(category);

            } else if (parts.length === 2) {
                const parentKey = parts[0];
                const parentCategory = categories[parentKey];
                if (!parentCategory) continue;

                const subCategory = {
                    accountNumber,
                    name,
                    ledgers: []
                };

                categories[sno] = subCategory;
                parentCategory.subCategories.push(subCategory);

            } else if (parts.length === 3) {
                const parentKey = parts.slice(0, 2).join('.');
                const parentSubCategory = categories[parentKey];
                if (!parentSubCategory) continue;

                const ledger = {
                    accountNumber,
                    name,
                    items: []
                };

                categories[sno] = ledger;
                parentSubCategory.ledgers.push(ledger);

            } else if (parts.length === 4) {
                const parentKey = parts.slice(0, 3).join('.');
                const parentLedger = categories[parentKey];
                if (!parentLedger) continue;

                const item = {
                    accountNumber,
                    name
                };
                parentLedger.items.push(item);
            }
        }

        // Check for missing required names
        const missingNames = [...requiredNames].filter(name => !foundRequiredNames.has(name));
        if (missingNames.length > 0) {
            this.validationErrors.push(`Missing required names: ${missingNames.join(', ')}`);
            this.enableddisabled = false;
        }

        if (this.validationErrors.length > 0) {
            const errorMessage = this.validationErrors.join('\n');
            this.showToast('Validation Error', errorMessage, 'error');
            console.log('Validation Errors:', this.validationErrors);
            this.enableddisabled = false;
            return null;
        }

        return result;
    }

    @track selectedItemId;
    async handleEditItem(event){
        // console.log('item:', event.currentTarget.dataset);
        // const item = event.currentTarget.dataset.item; 
        // console.log('Item :', item);
        const itemId = event.currentTarget.dataset.id;
        const itemName = event.currentTarget.dataset.name;
        const accountNumber = event.currentTarget.dataset.accountno;

        console.log('Edit clicked for item:', itemId);
        console.log('Item name:', itemName);
        console.log('Item accountNumber:', accountNumber);
        this.selectedAccountName = 'Ledger Items';
        this.isItemEdit = true;
        this.isAddingItem = false;
       // this.disabledSave = false;
        this.accountNo = accountNumber;
        this.accountName = itemName;
        this.selectedItemId = itemId;
        if (this.accountName ==='Trade Debtors' || this.accountName ==='Trade Creditors' || this.accountName ==='GST Paid' || this.accountName ==='GST Collected' 
              || this.accountName ==='Supplier Over Payment'  || this.accountName ==='Customer Over Payment'){
        
            this.disabledAccountName = true;
            this.disabledSave = true;
            //console.log('this.disabledAccountName : ',this.disabledAccountName);
            //console.log('this.disabledSave : ',this.disabledSave);
            this.showToast('Error', 'This ledger item is system managed and cannot be edited.', 'error');
              return;
        } 
            this.disabledAccountName = false;
            this.disabledSave = false;
        
        //console.log('this.disabledAccountName 111: ',this.disabledAccountName);
        //console.log('this.disabledSave 111: ',this.disabledSave);
        try {
            const isUsed = await checkItemTransactions({ itemId });

            if (isUsed) {
                this.disabledAccountName = true;
                this.disabledSave = true;
               // this.showToast('Error', 'This ledger item is already used in a Invoice and cannot be edited.', 'error');
                this.showToast('Error', 'This entry is part of a posted invoice and is locked for accounting integrity.', 'error');
               
                return;
            }

            // ✅ If not used, allow editing
            this.disabledAccountName = false;
            this.disabledSave = false;
            //console.log('this.disabledAccountName 222: ',this.disabledAccountName);
            //console.log('this.disabledSave 222 : ',this.disabledSave);

        } catch (error) {
            console.error('Error checking item usage:', error);
            this.showToast('Error', 'Failed to check if item is used in any Invoice.', 'error');
            this.disabledAccountName = true;
            this.disabledSave = true;
        }
        //console.log('this.disabledAccountName333 : ',this.disabledAccountName);
        //console.log('this.disabledSave 333: ',this.disabledSave);
    }  
    
    handleItemCancel(){
        this.isItemEdit = false;
        this.isAddingItem = false;
        this.showItemModal = false;
        this.selectedAccountName = ''; 
    }
    
    handleItemSave(event) {
        console.log('handleItemSave called');
        console.log('this.selectedItemId:', this.selectedItemId);
        console.log('Selected Level:', this.contextLevel);
        const updatedName = this.accountName;
        const updatedAccountNo = this.accountNo;
        console.log('updatedName in save : ', updatedName);
        console.log('updatedAccountNo in save : ', updatedAccountNo);
        console.log('this.companyIndustry in Save:', this.companyIndustry);
        console.log('this.selectedId in Save:', this.selectedId);

        if (this.isItemEdit) {
            console.log('Edit mode active');
            this.isAddingItem = false;
            if (this.selectedItemId) {
                console.log('Updating existing item with Id:', this.selectedItemId);
                updateLedgerItemName({ itemId: this.selectedItemId , updatedName: updatedName })
                    .then(result => {
                        console.log('Update result:', result);
                        if (result === 'Success') {
                            this.updateLocalLedgerItemName(updatedName);
                            this.showToast('Success', 'Account List updated successfully.', 'success');
                            this.isItemEdit = false; // ✅ close popup after update
                        } else {
                            this.showToast('Error', result, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error updating ledger item:', error);
                        this.showToast('Error', error.body?.message || 'Unknown error occurred', 'error');
                    });
            } else {
                console.log('No selectedItemId but isItemEdit is true — updating local only');
                this.updateLocalLedgerItemName(updatedName);
                this.showToast('Success', 'Account List updated successfully.', 'success');
                this.isItemEdit = false;
            }
        } else if (this.isAddingItem) {
            console.log('➕ Add mode active for:', this.contextLevel);
            console.log('Add mode active');
            this.isItemEdit = false;
            
            // Add new flow
            if (this.checkAccountNoExist(updatedAccountNo)) {
                console.log('Account number already exists:', updatedAccountNo);
                this.showToast('Error', 'Account Number already exists.', 'error');
                return;
            }
            if (!updatedName || !updatedAccountNo) {
                this.showToast('Error', 'Both Account Number and Name are required.', 'error');
                return;
            }
            const isNewCompanyMode = !this.selectedId;

            const isCategoryExpanded = this.getExpandedState('category');
            const isSubCategoryExpanded = this.getExpandedState('subcategory');
            const isLedgerExpanded = this.getExpandedState('ledger');

            const expandedStates = {
                isCategoryExpanded,
                isSubCategoryExpanded,
                isLedgerExpanded
            };

            switch (this.contextLevel) {
                case 'category':
                    if (isNewCompanyMode) {
                        console.log('isNewCompanyMode is true for category');
                        this.addNewInLocalHierarchy(updatedName, updatedAccountNo,expandedStates);
                        this.showToast('Success', 'Category added locally.', 'success');
                    } else {
                        insertCategory({
                            accountNumber: updatedAccountNo,
                            name: updatedName,
                            companyId: this.selectedId
                        })
                            .then(result => {
                                //this.fetchCompanyDetails(this.selectedId);
                                this.fetchHierarchyData(this.companyIndustry, this.selectedId);
                                this.showToast('Success', 'New Category added successfully.', 'success');
                                this.isAddingItem = false;
                            })
                            .catch(error => {
                                console.error('Error inserting category:', error);
                                this.showToast('Error', error.body?.message || 'Failed to add category', 'error');
                            });
                    }
                    break;

                case 'subcategory':
                    if (isNewCompanyMode) {
                         console.log('isNewCompanyMode is true for subcategory');
                        this.addNewInLocalHierarchy(updatedName, updatedAccountNo,expandedStates);
                        this.showToast('Success', 'Subcategory added locally.', 'success');
                    } else {
                        insertSubCategory({
                            accountNumber: updatedAccountNo,
                            name: updatedName,
                            categoryId: this.selectedCatId
                        })
                            .then(result => {
                                //this.fetchCompanyDetails(this.selectedId);
                                this.fetchHierarchyData(this.companyIndustry, this.selectedId);
                                this.showToast('Success', 'New SubCategory added successfully.', 'success');
                                this.isAddingItem = false;
                            })
                            .catch(error => {
                                console.error('Error inserting subcategory:', error);
                                this.showToast('Error', error.body?.message || 'Failed to add subcategory', 'error');
                            });
                    }        
                    break;

                case 'ledger':
                    if (isNewCompanyMode) {
                         console.log('isNewCompanyMode is true for ledger');
                        this.addNewInLocalHierarchy(updatedName, updatedAccountNo,expandedStates);
                        this.showToast('Success', 'Ledger added locally.', 'success');
                    } else {
                        insertLedger({
                            accountNumber: updatedAccountNo,
                            name: updatedName,
                            subCategoryId: this.selectedSubCatId,
                            categoryId: this.selectedCatId
                        })
                            .then(result => {
                                this.fetchHierarchyData(this.companyIndustry, this.selectedId);
                                this.showToast('Success', 'New Ledger added successfully.', 'success');
                                this.isAddingItem = false;
                            })
                            .catch(error => {
                                console.error('Error inserting ledger:', error);
                                this.showToast('Error', error.body?.message || 'Failed to add ledger', 'error');
                            });
                    }
                    break;

                case 'item':
                default:
                    if (isNewCompanyMode) {
                         console.log('isNewCompanyMode is true for item');
                        this.addNewInLocalHierarchy(updatedName, updatedAccountNo,expandedStates);
                        this.showToast('Success', 'Ledger Item added locally.', 'success');
                    } else {
                        insertLedgerItem({
                            accountNumber: updatedAccountNo,
                            name: updatedName,
                            ledgerId: this.selectedLedgerId,
                            subCategoryId: this.selectedSubCatId,
                            categoryId: this.selectedCatId
                        })
                            .then(result => {
                                if (result?.Id) {
                                    this.fetchHierarchyData(this.companyIndustry, this.selectedId);
                                    this.showToast('Success', 'New Ledger Item added successfully.', 'success');
                                    this.isAddingItem = false;
                                } else {
                                    this.showToast('Error', 'Failed to add ledger item.', 'error');
                                }
                            })
                            .catch(error => {
                                console.error('Error inserting ledger item:', error);
                                this.showToast('Error', error.body?.message || 'Unknown error occurred', 'error');
                            });
                        }
                        break;
            }
        } else {
            console.log('No action specified');
            this.showToast('Error', 'No action specified.', 'error');
        }
        this.disabledSave = true;
       // this.showItemModal = false;
        this.isItemEdit = false;
        this.isAddingItem = false;
    }
   updateLocalLedgerItemName(updatedName) {
        this.hierarchyData = this.hierarchyData.map(accountList => ({
            ...accountList,
            categories: accountList.categories?.map(category => ({
                ...category,
                subCategories: category.subCategories?.map(subCategory => ({
                    ...subCategory,
                    ledgers: subCategory.ledgers?.map(ledger => ({
                        ...ledger,
                        items: ledger.items?.map(item => {
                            // Match by Id if it exists, otherwise fall back to accountNumber
                            const isMatch = (item.Id && item.Id === this.selectedItemId)
                                        || (!item.Id && item.accountNumber === this.accountNo);
                            if (isMatch) {
                                return { ...item, name: updatedName };
                            }
                            return item;
                        })
                    }))
                }))
            }))
        }));
    }
    @track selectedCatName;
    @track selectedSubCatName;
    @track selectedLedgerName;
    @track selectedName;
    handleAddNewAL(event) {
        console.log('➕ Add New Clicked');

        const level = event.currentTarget.dataset.level; 
        const id = event.currentTarget.dataset.id;
        const catId = event.currentTarget.dataset.categoryId;
        const subCatId = event.currentTarget.dataset.subcategoryId;
        const ledgerId = event.currentTarget.dataset.ledgerId;
        const accountNumber = event.currentTarget.dataset.accountno;
        const name = event.currentTarget.dataset.name;

        const catName = event.currentTarget.dataset.categoryName;
        const subCatName = event.currentTarget.dataset.subcategoryName;
        const ledgerName = event.currentTarget.dataset.ledgerName;

        console.log('🔤 Parent Category Name:', catName);
        console.log('🔤 Parent Subcategory Name:', subCatName);
        console.log('🔤 Parent Ledger Name:', ledgerName);
       
        //this.selectedSubCatName = subCatName;
        //this.selectedLedgerName = ledgerName;

        console.log('➡️ Level:', level);
        console.log('🆔 ID:', id);
        console.log('📁 Category ID:', catId);
        console.log('📂 SubCategory ID:', subCatId);
        console.log('📄 Ledger ID:', ledgerId);
        console.log('🔢 Account No:', accountNumber);
        console.log('📝 Name:', name);
        // Store common context based on level
        this.contextLevel = level;
        this.contextId = id;
        this.selectedName = name;
        // Optional: Set all IDs to null initially
        this.selectedCatId = null;
        this.selectedSubCatId = null;
        this.selectedLedgerId = null;
        this.selectedLedgerAccountNo = null;
        this.selectedLedgerAccountName = null;
       
        this.isAddingItem = true;
        this.isItemEdit = false;
        
        // Update context based on level
       if (this.contextLevel === 'category') {
             console.log(' category  level : ');
            this.selectedCatId = id;
            console.log('   this.selectedCatId in category  level : ',  this.selectedCatId);
            this.selectedCatName = name;
            console.log(' this.selectedCatName in category  level : ',  this.selectedCatName);
            this.filteredAccountOptions = this.accountNameOptions.filter(opt =>
                ['Category', 'Subcategory'].includes(opt.value)
            );
            console.log('🔽 Filtered Options category : ', JSON.stringify(this.filteredAccountOptions));
            
        } else if (level === 'subcategory') {
            this.selectedCatId = catId;
            console.log('   this.selectedCatId in subcategory  level : ',  this.selectedCatId);
            this.selectedSubCatId = id;
            console.log('   this.selectedSubCatId in subcategory  level : ',  this.selectedSubCatId);
            this.selectedCatName = catName;
            this.selectedSubCatName = name;
            console.log(' this.selectedCatName in subcategory  level : ',  this.selectedCatName);
            console.log(' this.selectedSubCatName in subcategory  level : ',  this.selectedSubCatName);
            this.filteredAccountOptions = this.accountNameOptions.filter(opt =>
                opt.value === 'Ledger Name'
            );
            console.log('🔽 Filtered Options subcategory : ', JSON.stringify(this.filteredAccountOptions));
           
        } else if (level === 'ledger') {
            this.selectedCatId = catId;
            this.selectedSubCatId = subCatId;
           this.selectedLedgerId = id;
            this.selectedLedgerAccountNo = accountNumber;
            this.selectedLedgerAccountName = name;
            this.selectedCatName = catName;
            this.selectedSubCatName = subCatName;
            this.selectedLedgerName = name;
            console.log(' this.selectedCatName in ledger  level : ',  this.selectedCatName);
            console.log(' this.selectedSubCatName in ledger  level : ',  this.selectedSubCatName);
            console.log(' this.selectedLedgerName in ledger  level : ',  this.selectedLedgerName);
            this.filteredAccountOptions = this.accountNameOptions.filter(opt =>
                opt.value === 'Ledger Items'
            );
            console.log('🔽 Filtered Options in ledger : ', JSON.stringify(this.filteredAccountOptions));
            
        } else if (level === 'item') {
            this.selectedCatId = catId;
            this.selectedSubCatId = subCatId;
            this.selectedLedgerId = ledgerId;
            this.selectedLedgerAccountNo = event.currentTarget.dataset.ledgerAccountno;
            this.selectedLedgerAccountName = event.currentTarget.dataset.ledgerAccountname;
           // this.filteredAccountOptions = [];
            this.isAddingItem = false;
            this.isItemEdit = false;
           // this.showItemModal = false;
       }

        console.log('📁 Category ID AFTER:', this.selectedCatId);
        console.log('📂 SubCategory ID AFTER :', this.selectedSubCatId);
        console.log('📄 Ledger ID AFTER :', this.selectedLedgerId);
        this.selectedItemId = null;

        this.accountNo = '';
        this.accountName = '';
        this.disabledAccountName = false;
        this.disabledSave = false;

        // Open modal or form section (if needed)
        // this.openAddModal = true;
        this.selectedAccountName = this.filteredAccountOptions[0]?.value || '';
        console.log(` Context set for ${level} successfully`);
        this.contextLevel = this.updateContextLevel(this.selectedAccountName);
        console.log(' Selected Account Name:', this.selectedAccountName);
        console.log(' Updated contextLevel:', this.contextLevel);
    }
   
    checkAccountNoExist(accountNo) {
        return this.hierarchyData.some(accountList => 
            accountList.categories?.some(category => 
                category.accountNumber === accountNo ||
                category.subCategories?.some(subCategory => 
                    subCategory.accountNumber === accountNo ||
                    subCategory.ledgers?.some(ledger => 
                        ledger.accountNumber === accountNo ||
                        ledger.items?.some(item => item.accountNumber === accountNo)
                    )
                )
            )
        );
    }

    handleAccountChange(event) {
        this.selectedAccountName = event.detail.value;
        console.log('✅ Dropdown selection changed to:', this.selectedAccountName);
        if (this.contextLevel === 'category' && this.selectedAccountName === 'Subcategory') {
            // ✅ User is adding a Subcategory under the selected Category
            this.selectedCatName = this.selectedName; // or use `this.contextId` or `this.contextName`
            console.log('🔗 selectedCatName set from category context:', this.selectedCatName);
        }

        this.contextLevel = this.updateContextLevel(this.selectedAccountName);
        console.log('📌 Updated contextLevel:', this.contextLevel);
        console.log(' this.selectedCatName in handleAccountChange : ',  this.selectedCatName);
    }
    updateContextLevel(accountName) {
        switch (accountName) {
            case 'Category':
                return 'category';
            case 'Subcategory':
                return 'subcategory';
            case 'Ledger Name':
                return 'ledger';
            case 'Ledger Items':
                return 'item';
            default:
                return '';
        }
    }
    addNewInLocalHierarchy(name, accountNumber,expandedStates = {}) {
        const level = this.contextLevel;

        console.log(`🧩 Creating new: ${level}`);
        console.log('📌 Name:', name);
        console.log('🔢 Account Number:', accountNumber);

        this.hierarchyData = this.hierarchyData || [{ categories: [] }];
        const accountList = this.hierarchyData[0];

        const newAccount = {
            name: name,
            accountNumber: accountNumber,
            Id: null,
            expanded: true,
            iconName: 'utility:chevronright'
        };

        switch (level) {
            case 'category':
                console.log('📂 Adding Category...');
                console.log('this.selectedAccountName : ', this.selectedAccountName);
                accountList.categories.push({
                    ...newAccount,
                    expanded: expandedStates.isCategoryExpanded,
                    iconName: expandedStates.isCategoryExpanded ? 'utility:chevrondown' : 'utility:chevronright',
                    subCategories: []
                  
                });
               
                console.log('✅ Category added locally:', newAccount);
                break;

            case 'subcategory':
                console.log('📁 Adding Subcategory...');
                console.log('➡️ Searching for category:', this.selectedCatName);
                const category = accountList.categories.find(c => c.name === this.selectedCatName);
                if (!category) {
                    console.error('❌ Parent category not found:', this.selectedCatName);
                    this.showToast('Error', 'Parent category not found for subcategory.', 'error');
                    return;
                }
                category.expanded = true;
                category.iconName = 'utility:chevronright';
                category.subCategories = category.subCategories || [];
                category.subCategories.push({
                    ...newAccount,
                    expanded: expandedStates.isSubCategoryExpanded,
                    iconName: expandedStates.isSubCategoryExpanded ? 'utility:chevrondown' : 'utility:chevronright',
                    ledgers: []
                    
                });
                console.log('✅ Subcategory added locally under:', this.selectedCatName);
                break;

            case 'ledger':
                console.log('📑 Adding Ledger...');
                console.log('➡️ Searching for category:', this.selectedCatName);
                const cat2 = accountList.categories.find(c => c.name === this.selectedCatName);
                console.log('➡️ Searching for subcategory:', this.selectedSubCatName);
                const subCat = cat2?.subCategories?.find(sc => sc.name === this.selectedSubCatName);

                if (!subCat) {
                    console.error('❌ Parent subcategory not found:', this.selectedSubCatName);
                    this.showToast('Error', 'Parent subcategory not found for ledger.', 'error');
                    return;
                }
                // cat2.expanded = true;
                // subCat.expanded = true;
                // subCat.iconName = 'utility:chevronright';
                // subCat.ledgers = subCat.ledgers || [];
                subCat.ledgers.push({
                    ...newAccount,
                    expanded: expandedStates.isLedgerExpanded,
                    iconName: expandedStates.isLedgerExpanded ? 'utility:chevrondown' : 'utility:chevronright',
                    items: [],
                   
                });
                console.log('✅ Ledger added under:', this.selectedSubCatName);
                break;

            case 'item':
                console.log('📄 Adding Item...');
                console.log('➡️ Searching for category:', this.selectedCatName);
                const cat3 = accountList.categories.find(c => c.name === this.selectedCatName);

                console.log('➡️ Searching for subcategory:', this.selectedSubCatName);
                const subCat2 = cat3?.subCategories?.find(sc => sc.name === this.selectedSubCatName);

                console.log('➡️ Searching for ledger:', this.selectedLedgerName);
                const ledger = subCat2?.ledgers?.find(l => l.name === this.selectedLedgerName);

                if (!ledger) {
                    console.error('❌ Parent ledger not found:', this.selectedLedgerName);
                    console.log('📊 Available ledgers:', subCat2?.ledgers?.map(l => l.name));
                    this.showToast('Error', 'Parent ledger not found for item.', 'error');
                    return;
                }
                // cat3.expanded = true;
                // subCat2.expanded = true;
                // ledger.expanded = true;
                // ledger.iconName = 'utility:chevronright';
                // ledger.items = ledger.items || [];
                // ledger.items.push(newAccount);
                 ledger.items.push({
                    ...newAccount
                });
                console.log('✅ Item added under ledger:', this.selectedLedgerName);
                break;

            default:
                console.error('❌ Unknown hierarchy level:', level);
                this.showToast('Error', 'Unknown hierarchy level.', 'error');
        }
        // let allCategories = [];
        // this.hierarchyData.forEach(accountList => {
        //     if (accountList.categories) {
        //         allCategories = allCategories.concat(accountList.categories);
        //     }
        // });

        // allCategories.sort((a, b) =>
        //     a.accountNumber.localeCompare(b.accountNumber, undefined, { numeric: true })
        // );

        // if (this.hierarchyData.length > 0) {
        //     this.hierarchyData[0].categories = allCategories;
        // }

        //this.hierarchyData = [this.hierarchyData[0]];

       // this.hierarchyData = [...this.hierarchyData];
        console.log('✅ Local hierarchy after add:', JSON.stringify(this.hierarchyData, null, 2));
    }
    getExpandedState(level) {
        const accountList = this.hierarchyData?.[0];

        switch (level) {
            case 'category':
                return accountList.categories.find(c => c.name === this.selectedCatName)?.expanded ?? false;

            case 'subcategory':
                const cat = accountList.categories.find(c => c.name === this.selectedCatName);
                return cat?.subCategories?.find(sc => sc.name === this.selectedSubCatName)?.expanded ?? false;

            case 'ledger':
                const cat2 = accountList.categories.find(c => c.name === this.selectedCatName);
                const subCat = cat2?.subCategories?.find(sc => sc.name === this.selectedSubCatName);
                return subCat?.ledgers?.find(l => l.name === this.selectedLedgerName)?.expanded ?? false;

            default:
                return false;
        }    

    }
            highlightCompanyRow(index) {
    const rows = this.template.querySelectorAll('tr.tr');
    if (!rows.length) return;

    rows.forEach(r => r.classList.remove('slds-is-selected'));

    const row = rows[index];
    if (row) {
        row.classList.add('slds-is-selected');
        row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}



      //------------------------- ShortCUT Keys ------------------------//

         handleShortcut(event){


                        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "b") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="companyNameField"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Opened Company dropdown using Ctrl + Shift + B");
                        } else {
                            console.log("Company dropdown NOT FOUND.");
                        }
                    }


            if (event.ctrlKey && event.key.toLowerCase() === "u") {
                        event.preventDefault();

                        const btn = this.template.querySelector('[data-id="createCOmpany"]');

                        if (btn) {
                            btn.click();   // Simulate click → calls handleAccountingSettings()
                            console.log("OpenedCreate Company using Ctrl + u");
                        } else {
                            console.log("OpenedCreate Company  button not found.");
                        }
                    }

            // ----------------------------
            // COMPANY TABLE navigation
            // ----------------------------
            const companyRows = this.template.querySelectorAll('tr.tr');

            if (companyRows.length > 0) {

                // Arrow Down
                if (event.key === "ArrowDown") {
                    event.preventDefault();

                    this.currentCompanyRowIndex = Math.min(
                        this.currentCompanyRowIndex + 1,
                        companyRows.length - 1
                    );

                    this.highlightCompanyRow(this.currentCompanyRowIndex);
                    console.log("Company → Row Down:", this.currentCompanyRowIndex);
                }

                // Arrow Up
                if (event.key === "ArrowUp") {
                    event.preventDefault();

                    this.currentCompanyRowIndex = Math.max(
                        this.currentCompanyRowIndex - 1,
                        0
                    );

                    this.highlightCompanyRow(this.currentCompanyRowIndex);
                    console.log("Company → Row Up:", this.currentCompanyRowIndex);
                }

                // Enter → Open selected company
                if (event.key === "Enter") {
                    event.preventDefault();

                    const activeRow = companyRows[this.currentCompanyRowIndex];
                    if (!activeRow) return;

                    const editLink = activeRow.querySelector("a[data-id]");
                    if (editLink) {
                        editLink.click();    // triggers handleEdit()
                        console.log("Opened company:", editLink.dataset.id);
                    }
                }
            }
                if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "c") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="companyField"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Opened Company dropdown using Ctrl + Shift + c");
                        } else {
                            console.log("Company dropdown NOT FOUND.");
                        }
                    }            
                    
                    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="fyear"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Opened Financial Year dropdown using ctrl+shift+f");
                        } else {
                            console.log("Financial Year NOT FOUND.");
                        }
                    }            

                    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "m") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="monthField"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Opened Company dropdown using ctrl+shift+m");
                        } else {
                            console.log("Month NOT FOUND.");
                        }
                    }   
                    
                    if (event.ctrlKey && event.key.toLowerCase() === "i") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="selectedInd"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Focused Industry dropdown using ctrl+i");
                        } else {
                            console.log("Industry NOT FOUND.");
                        }
                    }
                    
                     if (event.ctrlKey && event.key.toLowerCase() === "d") {
                        event.preventDefault();

                        const btn = this.template.querySelector('[data-id="downloadTemplate"]');

                        if (btn) {
                            btn.click();   // Simulate click → calls handleAccountingSettings()
                            console.log("Opened downloadTemplate using Ctrl + u");
                        } else {
                            console.log("Accounting downloadTemplate button not found.");
                        }
                    }
                     if (event.ctrlKey && event.key.toLowerCase() === "u") {
                        event.preventDefault();

                        const btn = this.template.querySelector('[data-id="importBtn"]');

                        if (btn) {
                            btn.click();   // Simulate click → calls handleAccountingSettings()
                            console.log("Opened Accounting Settings using Ctrl + u");
                        } else {
                            console.log("Import button not found.");
                        }
                    }

                    //Focus GST Accounting Method
                     if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="gstindustryField"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Opened GST Industry  dropdown using ctrl+Shift+i");
                        } else {
                            console.log("Gst Industry NOT FOUND.");
                        }
                    }
                    
                   //Focus GST Calculation Method
                     if (event.altKey && event.key.toLowerCase() === "x") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="gstCalculation"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Opened GST Calculation  dropdown using ctrl+Shift+i");
                        } else {
                            console.log("Gst Calculation NOT FOUND.");
                        }
                    }

                    //Focus PAYG Withinheld Period
                     if (event.ctrlKey && event.key.toLowerCase() === "k") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="PayGWithheldPeriod"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Focussed PayGWithheldPeriod  dropdown using ctrl+K");
                        } else {
                            console.log("PayGWithheldPeriod Calculation NOT FOUND.");
                        }
                    }

                    //Focus PAYG Income Tax PerioMethod
                     if (event.ctrlKey && event.key.toLowerCase() === "j") {
                        event.preventDefault();

                        const combo = this.template.querySelector(
                            'lightning-combobox[data-id="PayGIncomeTax"]'
                        );

                        if (combo) {
                            setTimeout(() => {
                                combo.focus();         // Move focus
                                combo.openDropdown();  // Programmatically open dropdown
                            }, 0);

                            console.log("Focussed PayGWithheldPeriod  dropdown using ctrl+K");
                        } else {
                            console.log("PayGWithheldPeriod Calculation NOT FOUND.");
                        }
                    }


                                    // ALT + 1 → Toggle "Fringe Benefits Tax" checkbox
                if (event.altKey && event.key === "1") {
                    event.preventDefault();

                    const checkbox = this.template.querySelector('lightning-input[data-id="fringeBenefitsTax"]');

                    if (checkbox) {
                        // Toggle state
                        checkbox.checked = !checkbox.checked;

                        // Manually trigger onchange
                        checkbox.dispatchEvent(new CustomEvent("change", {
                            detail: { value: checkbox.checked }
                        }));

                        console.log("Toggled Fringe Benefits Tax (Alt + 1)");
                    } else {
                        console.log("Fringe Benefits Tax checkbox not found.");
                    }
                }
                    
                                    // ALT + 2 → Toggle "Fuel Tax Credits" checkbox
                if (event.altKey && event.key === "2") {
                    event.preventDefault();

                    const checkbox = this.template.querySelector('lightning-input[data-id="checkFuelTaxCredits"]');

                    if (checkbox) {
                        // Toggle state
                        checkbox.checked = !checkbox.checked;

                        // Manually trigger onchange
                        checkbox.dispatchEvent(new CustomEvent("change", {
                            detail: { value: checkbox.checked }
                        }));

                        console.log("Toggled Fuel Tax Credits (Alt + 2)");
                    } else {
                        console.log("Fuel Tax Credits checkbox not found.");
                    }
                }
                    
                        // ALT + 3 → Toggle "checkWineEqualisationTax" checkbox
                if (event.altKey && event.key === "3") {
                    event.preventDefault();

                    const checkbox = this.template.querySelector('lightning-input[data-id="checkWineEqualisationTax"]');

                    if (checkbox) {
                        // Toggle state
                        checkbox.checked = !checkbox.checked;

                        // Manually trigger onchange
                        checkbox.dispatchEvent(new CustomEvent("change", {
                            detail: { value: checkbox.checked }
                        }));

                        console.log(" WineEqualisation Tax(Alt + 3)");
                    } else {
                        console.log(" WineEqualisation Tax  checkbox not found.");
                    }
                }


                        //SAVE form
                        if (event.ctrlKey && event.key.toLowerCase() === "s") {
                        event.preventDefault();

                        const btn = this.template.querySelector('[data-id="saveBtn"]');

                        if (btn) {
                            btn.click();   // Simulate click → calls handleAccountingSettings()
                            console.log("Opened Accounting Settings using Ctrl + u");
                        } else {
                            console.log("Import button not found.");
                        }
                    }
        }

                 
                       
    }