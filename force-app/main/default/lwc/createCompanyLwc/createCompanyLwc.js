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


export default class CreateCompanyLwc extends LightningElement {
    //fileUrl = '/resource/UserExportDownload';


    @api orgidtrack;
    @track isHome=true;
    @track isBack=true;
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
    //@track selectedIndustry;
    @track categoryIds = [];
    @track searchProfile='';
    @track filteredAllProfiles=[];
    @track filteredCustomerProfiles=[];
    @track filteredSupplierProfiles =[];
    wiredProfileResult;
    wiredIndustryOptionsData;
    wiredCompanyOptionsResult;
    wiredAccountsResult;
    wiredAccountList;
    //wiredNewAccountList;
   // @track selectedStartMonth;
    @track selectedEndMonth;
    @track selectedYear;
    //@track  hierarchyData = [];
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
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
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
    @track isItemEdit = false;
    @track accountNo;
    @track accountName;
    @track disabledSave = false;
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
        { label:'2025-26',value:'2025-26'}
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
        //this.selectedCompany='';
        //refreshApex(this.wireFacility); 
        refreshApex(this.wiredCompanyResult);  
        const savedIndustryOptions = localStorage.getItem('industryOptions');
        if (savedIndustryOptions) {
            this.industryOptions = JSON.parse(savedIndustryOptions);
        }
        console.log('Company industryOptions in connectedCallback :', JSON.stringify(this.industryOptions));
    }
    @wire(getFacility, { orgidtrack: '$orgidtrack' })
    wiredFacility(result) {
        this.wireFacility = result; 
        console.log('result in wiredFacility:', JSON.stringify(result));
        console.log('orgid  in wiredFacility : '+this.orgidtrack);
        const { data, error } = result;
        if (data) {
            this.facilityOptions = data.map(facility => ({
                label: facility.Name,
                value: facility.Id
            }));
         console.log('facilityOptions : '+  JSON.stringify(this.facilityOptions));  
         refreshApex(this.wireFacility);
        // this.companyOptions=this.facilityOptions;
         //console.log('companyOptions : '+  JSON.stringify(this.companyOptions));  
        } else if (error) {
            this.showErrorToast(error.body.message);
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
        this.selectedIndustry = 'Service';
        this.isClear = false;
        console.log('facilityOptions  IN handleCreateCompany: '+  JSON.stringify(this.facilityOptions));  
        if(!this.selectedCompany) {
            this.handleClear();
        }
        this.selectedIndustry1 = '';
        this.hierarchyData = [];
        //refreshApex(this.wireFacility); 
        if(this.selectedIndustry && this.createEditCompany=='Create Company') {
           //refreshApex(this.wiredAccountList);
            this.fetchAccountingData();

           //refreshApex(this.wiredNewAccountList);
        }
       
        this.hideParentHandler();
    }
    handleCancel(){
        this.isBack=true;
    }
    handleClose(){
        this.isHome=true; 
        this.createCompanyFlag=false;
        this.EditCompanyFlag =false;
        
        refreshApex(this.wireFacility); 
        refreshApex(this.wiredCompanyResult); 
        this.selectedIndustry1 = '';
        this.selectedIndustry = '';
        this.hierarchyData = [];
        this.hideParentHandler();
        this.handleClear();
    }
    handleBack(){
        this.isHome=false;
        //this.backFlag=true;
       
    }

    hideParentHandler(){
        console.log('hideParentHandler calling  >> ');
        const event = new CustomEvent('hideaccountingsettings');
        this.dispatchEvent(event);
    }
    handleHideAccountingSettings(){
        this.hideParentHandler(); 
    }
    // navigateEntitycardHandler(){
    //     console.log('navigateEntitycardHandler calling  >> ');
    //     const event = new CustomEvent('navigateentitycard');
    //     this.dispatchEvent(event);
    // }
    handleSaveCompany() {
        
        console.log('handleSave ');
         if (!this.selectedcomp || this.selectedcomp === '') {
            this.showToast('Error', 'Please select a Company before saving.', 'error');
            return;
        }
        const industry = this.selectedIndustry;
        const newIndustry = this.selectedIndustry1;
        const selectedIndustry = newIndustry || industry; // Only one is used

        // if (!this.selectedIndustry || !this.selectedIndustry1 ) {
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
    
                //this.radioCompanyOptions.push(companyId);
                //console.log('CradioCompanyOptions :', JSON.stringify(this.radioCompanyOptions)); 
                this.showToast('Success', 'Company has been created successfully', 'success');
                
                // Now create the Financial Year and Account List
                this.createFinancialYearAndAccountList([companyId]);
                // if(this.selectedIndustry){
                //     this.handleSaveAccountList(companyId);
                // }else if (this.selectedIndustry1){
                //     this.handleSaveNewAccountList(companyId);
                // }
               this.handleSaveAccount(companyId);
                this.handleSaveActivityStatement(companyId);
                //this.enableEntity=true;
                
            })
            .catch(error => {
                console.error('Error creating company:', error);
                this.showToast('Error', 'Failed to create Company', 'error');

                // let errorMessage = 'An unexpected error occurred.';

                // if (error?.body?.message) {
                //     const fullMessage = error.body.message;

                //     // Attempt to extract custom error message
                //     const parts = fullMessage.split('FIELD_CUSTOM_VALIDATION_EXCEPTION,');
                //     if (parts.length > 1) {
                //         errorMessage = parts[1].split(':')[0].trim();
                //     } else {
                //         // Fallback to full message
                //         errorMessage = fullMessage;
                //     }
                // }

                // this.showToast('Error', errorMessage, 'error');
           });
        this.saveConfirmFlag=false;
        this.createCompanyFlag=false;
        this.isHome=true;  
        this.hideParentHandler();
       // this.handleClear();
            
    }
    // Method to create Financial Year and Account List creation after company is created
    createFinancialYearAndAccountList(companyIds) {
        console.log('createFinancialYearAndAccountList - Company ID:', companyIds);
        
        // Create Financial Year record with company ID
        saveFinancialYearApex({ selectedCompanyIds: companyIds, year: this.selectedYear, endMonth: this.selectedEndMonth })
            .then(result => {
                console.log('Financial Year created successfully:', result);
                this.showToast('Success', 'Financial Year has been created successfully for the Company', 'success');
                // Once Financial Year is created, call handleSaveAccountList
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
      @track chartFlag  = true;
      @track ActivityFlag = false;
      @track EntityFlag = false;
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

    // handleSaveAccountList(companyId) {
    //     console.log('Industry Selected before:', this.selectedIndustry);
    //     console.log('Company Selected Id before:', companyId);
    //     if (this.selectedIndustry && companyId) {
    //         console.log('Industry Selected:', this.selectedIndustry);
    //         console.log('Company Selected Id:', companyId);
    
    //         saveAccountList({ industryId: this.selectedIndustry, companyId: companyId })
    //             .then(result => {
    //                //console.log('saveAccountList created successfully. ', result);  
    //                 if (result === 'Success') {
    //                     this.showToast('Success', 'Account List has been created successfully  for the Company', 'success');
    //                    // this.currentStep ='step4';
    //                 //    refreshApex(this.wiredCompanyResult);  
    //                 } else {
    //                     this.showToast('Error', result, 'Error');
    //                 }
    //             })
    //             .catch(error => {
    //                 console.error('Error sending data:', error);
    //                 this.showToast('Error', 'Failed to create Account List', 'error');
    //             });
    //     } else {
    //         console.error('Please select both Industry and Company before submitting.');
    //         this.showToast('Error', 'Please select both Industry and Company before submitting.', 'error');
    //     }
    // }
    // handleSaveNewAccountList(companyId) {
    //     console.log('selectedIndustry1  before:', this.selectedIndustry1);
    //     console.log('Company Selected Id before:', companyId);
    //     if (this.selectedIndustry1 && companyId) {
    //         console.log('selectedIndustry1 INSIDE IF IN SAVE:', this.selectedIndustry1);
    //         console.log('Company Selected Id:', companyId);
           
    //         const hierarchyJson = JSON.stringify(this.hierarchyData);
    //         console.log('Company hierarchyJson :', JSON.stringify(this.hierarchyData));
    //         saveNewAccountList({ industryId: this.selectedIndustry1, companyId: companyId ,hierarchyJson: hierarchyJson})
    //             .then(result => {
    //                console.log('saveNewAccountList created successfully. ', result);  
    //                if (result === 'Success') {
    //                 console.log('saveNewAccountList inside  if. ');  
    //                 this.showToast('Success', 'New industry and account list saved successfully.', 'success');
    
    //                 // ✅ Add new industry to dropdown
    //                 if (!this.industryOptions.find(opt => opt.value === this.selectedIndustry1)) {
    //                     this.industryOptions = [
    //                         ...this.industryOptions,
    //                         {
    //                             label: this.selectedIndustry1,
    //                             value: this.selectedIndustry1
    //                         }
    //                     ];

    //                     // Save the updated industryOptions to localStorage
    //                     localStorage.setItem('industryOptions', JSON.stringify(this.industryOptions));
    //                 }
    //                  console.log('Company industryOptions :', JSON.stringify(this.industryOptions));
    //                 // Optionally reset new industry field
    //                 //this.selectedIndustry = this.selectedIndustry1;
    //                 //this.selectedIndustry1 = '';
    //                 this.addIndustry = false;
    //                 this.enableddisabled = true;
    //                 //this.selectedIndustry = 'Service';
    //                 this.isClear = false;
    //             } else {
    //                 this.showToast('Error', result, 'error');
    //             }
    //         })
    //             .catch(error => {
    //                 console.error('Error sending data:', error);
    //                 this.showToast('Error', 'Failed to create new Industry and  Account List', 'error');
    //             });
    //     } else {
    //         console.error('Please enter new Industry for the selected Company.');
    //         this.showToast('Error', 'Please enter new Industry for the selected Company.', 'error');
    //     }
    // }
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

            // Add to dropdown if it's a new industry
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
            // Once Financial Year is created, call handleSaveAccountList
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
           // console.log('customerProfiles >>  '+JSON.stringify(this.customerProfiles));
            this.supplierProfiles = data.supplierProfiles || [];
            //console.log('supplierProfiles >>  '+JSON.stringify(this.supplierProfiles));
            this.filteredAllProfiles = [...this.allProfiles];
            this.filteredCustomerProfiles = [...this.customerProfiles];
            this.filteredSupplierProfiles = [...this.supplierProfiles];
        } else if (error) {
            console.error('Error fetching profiles:', error);
        }
    }
   
    // @wire(getAccountingData ,{selectedIndustry: '$selectedIndustry'})
    // wiredAccounts(result) {
    //     console.log('wiredAccountList is calling>>');
    //     console.log('selectedIndustry IN wiredAccounts:', this.selectedIndustry);
    //     this.wiredAccountList = result;
    //     const { data, error } = result;

    //     if (data) {
    //         console.log('Data in wire:', JSON.stringify(data));

    //         // Check if data is an array before mapping
    //         if (Array.isArray(data)) {
    //             let initialIndustryData = data.map(category => ({
    //                 ...category,
    //                 expanded: true,
    //                 iconName: 'utility:chevronright',
    //                 categories: [category].map(cat => ({
    //                     ...cat,
    //                     expanded: true,
    //                     iconName: 'utility:chevronright',
    //                     subCategories: cat.subCategories?.map(subCategory => ({
    //                         ...subCategory,
    //                         expanded: true,
    //                         iconName: 'utility:chevronright',
    //                         ledgers: subCategory.ledgers?.map(ledger => ({
    //                             ...ledger,
    //                             expanded: true,
    //                             iconName: 'utility:chevronright',
    //                             items: ledger.items || []
    //                         })) || []
    //                     })) || []
    //                 }))
    //             }));
    //             this.hierarchyData = [...initialIndustryData];
    //             console.log('hierarchyData:', JSON.stringify(this.hierarchyData));
    //         } else {
    //             console.error('Data is not in expected array format:', data);
    //         }
    //     } else if (error) {
    //         console.error('Error fetching account data:', error);
    //     }
    // }
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
    
    // get dynamicInput() {
    //     return {
    //         industry: this.selectedIndustry || '',
    //         newIndustry: this.selectedIndustry1 || ''
    //     };
    // }
    //@wire(getNewHierarchyData, { industry: '$dynamicInput.industry', newIndustry: '$dynamicInput.newIndustry' })
    // @wire(getNewHierarchyData ,{selectedIndustry: '$selectedIndustry'})
    // wiredHierarchy(result) {
    //     // console.log('industry:', industry);
    //     // console.log('newIndustry:', newIndustry);
    //     console.log('selectedIndustry:', this.selectedIndustry);
    //     //console.log('selectedIndustry1:', this.selectedIndustry1);
    
    //     this.wiredNewAccountList = result;
    //     const { data, error } = result;
    
    //     if (data) {
    //         console.log('Data in wire:', JSON.stringify(data));
    
    //         if (Array.isArray(data)) {
    //             this.hierarchyData = data.map(accountList => ({
    //                 ...accountList,
    //                 expanded: true,
    //                 iconName: 'utility:chevronright',
    //                 categories: accountList.categories?.map(category => ({
    //                     ...category,
    //                     expanded: true,
    //                     iconName: 'utility:chevronright',
    //                     subCategories: category.subCategories?.map(subCategory => ({
    //                         ...subCategory,
    //                         expanded: true,
    //                         iconName: 'utility:chevronright',
    //                         ledgers: subCategory.ledgers?.map(ledger => ({
    //                             ...ledger,
    //                             expanded: true,
    //                             iconName: 'utility:chevronright',
    //                             items: ledger.items || []
    //                         })) || []
    //                     })) || []
    //                 })) || []
    //             }));
    //             console.log('hierarchyData:', JSON.stringify(this.hierarchyData));
    //         } else {
    //             console.error('Data is not in expected array format:', data);
    //         }
    //     } else if (error) {
    //         console.error('Error fetching account data:', error);
    //     }
    // }
 
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
                // console.log('fy in handle change after');
                this.selectedIndustry = fieldValue;
                console.log('selectedIndustry :'+this.selectedIndustry);
                 if(this.selectedIndustry && this.createEditCompany=='Create Company') {
                    //refreshApex(this.wiredAccountList);
                        this.fetchAccountingData();

                    //refreshApex(this.wiredNewAccountList);
                 }
                break;
            case 'selectedIndustry1':
                this.selectedIndustry1 = fieldValue;
                console.log('selectedIndustry1 :'+this.selectedIndustry1);
                break;
        }
        if(this.selectedIndustry ==='Add New Industry'){
            this.addIndustry = true;
            this.enableddisabled = false;
            this.isClear = true;
            this.selectedIndustry='';
        }
        this.isLoading = true;
        this.hierarchyData = [];
        //console.log(`Updated ${event.target.name}: ${event.target.value}`);
       // console.log('selectedIndustry : '+this.selectedIndustry);
        //refreshApex(this.wiredAccountsResult);
        setTimeout(() => {
            this.isLoading = false;
        }, 3000);  
    }
  
    // showToast(title, message, variant) {
    //     const event = new ShowToastEvent({
    //         title,
    //         message,
    //         variant,
    //     });
    //     this.dispatchEvent(event);
    // }
    
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
    // showToast(title, message, variant) {
    //     const event = new ShowToastEvent({
    //         title,
    //         message,
    //         variant,
    //     });
    //     this.dispatchEvent(event);
    // }
    
    fetchReplist(){
        refreshApex(this.wiredProfileResult);
    }
    handleEdit(event) {
        this.createCompanyFlag = false;
        this.EditCompanyFlag = true;
        this.isCreate=false;
        this.chartFlag=true;
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
            
                // if (accountList) {
                //     console.log('accountList in getCompanyOnEdit: ', JSON.stringify(accountList));
                //     this.selectedIndustry = accountList.Industry__c || '';
                // } else {
                //     this.selectedIndustry = '';
                // }
                if (accountList) {
                    const industryValue = accountList.Industry__c || '';
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
                    //     this.selectedIndustry1 = '';  // Clear in case of old data
                    //     console.log(' this.selectedIndustry IN  if:',  this.selectedIndustry);
                    // } else {                    
                    //     //this.selectedIndustry1 = industryValue;
                    //     //this.selectedIndustry1 = '';
                    //     //this.selectedIndustry = '';  // Clear in case of old data
                    //     console.log(' this.selectedIndustry1 IN  else:',  this.selectedIndustry1);
                    //     setTimeout(() => {
                    //         this.selectedIndustry1 = industryValue;
                    //         this.selectedIndustry ='';
                    //         console.log(' this.selectedIndustry1 IN  setTimeout:',  this.selectedIndustry1);
                    //         //refreshApex(this.wiredNewAccountList);
                    //     }, 500);  
                    // }
                    //this.loadHierarchyData(companyId);
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
        
        // Prepare the company data
        // const companyData = {
        //     Id: this.selectedId,  // The ID of the company to update
        //     Financial_Year__r: this.selectedFinancialYears, // Financial Years to update
        //     Account_List__r: this.selectedAccountList // Account List to update
        // };
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
        // if(this.supplierFlag){

        //     this.createCardFlag=true;
        // }
        console.log(' this.isCustomer '+ this.isCustomer);
        this.selectedEntityId='';
        this.createCardFlag=true;
        this.createCompanyFlag=false;
        this.EditCompanyFlag=false;
        this.isHome = false;
        this.hideParentHandler();
        
    }
    childevent(event){
        // this.isHome =false;
        // this.createCardFlag = false;
        // this.createCardFlag=false; 
        // this.EditCompanyFlag=true;
        // this.chartFlag = false;
        // this.EntityFlag = true;
        // this.ActivityFlag = false; 
        //this.hideParentHandler(); 

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
        // Log the filtered results at the end to see what we have
        //console.log('Filtered All Profiles:', this.filteredAllProfiles);
        //console.log('Filtered Customer Profiles:', this.filteredCustomerProfiles);
        //console.log('Filtered Supplier Profiles:', this.filteredSupplierProfiles);
    } 
    
    handleEditEntity(event){
        this.selectedEntityId = event.target.dataset.id;
        console.log('Edit button clicked for selectedEntityId: ' + this.selectedEntityId);
        if( this.selectedEntityId){
            this.fetchEntityOnEdit(this.selectedEntityId);
        }
          
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
                // if(result){
                //     console.log('isCustomer in getEntityOnEdit: ' + result.Card_Type__c);
                //     this.isCustomer=result.Card_Type__c;
                //     console.log('isCustomer in getEntityOnEdit: ' + this.isCustomer);
                // }
                if (result && result.companyRecord) {  // Make sure companyRecord exists
                    console.log('isCustomer in getEntityOnEdit: ' + result.companyRecord.Card_Type__c);
                    this.isCustomer = result.companyRecord.Card_Type__c;  // Access Card_Type__c from companyRecord
                    console.log('isCustomer in getEntityOnEdit: ' + this.isCustomer);
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
        const fileUrl = '/resource/Sample_Account_List';  // Update the file URL if necessary
        window.open(fileUrl, '_blank');

    }
    handleInstructions(event){
        const fileUrl = '/resource/Import_AL_Instructions';  // Update the file URL if necessary
        window.open(fileUrl, '_blank');
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
            this.showToast('Error', 'Please enter Industry name', 'error');
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

    handleEditItem(event){
        // console.log('item:', event.currentTarget.dataset);
        // const item = event.currentTarget.dataset.item; 
        // console.log('Item :', item);
        const itemId = event.currentTarget.dataset.id;
        const itemName = event.currentTarget.dataset.name;
        const accountNumber = event.currentTarget.dataset.accountno;
        console.log('Edit clicked for item:', itemId);
        console.log('Item name:', itemName);
        console.log('Item accountNumber:', accountNumber);
        this.isItemEdit = true;
       // this.disabledSave = false;
        this.accountNo = accountNumber;
        this.accountName = itemName;
        this.selectedItemId = itemId;
        if (this.accountName ==='Trade Debtors' || this.accountName ==='Trade Creditors' || this.accountName ==='GST Paid' || this.accountName ==='GST Collected'){
            this.disabledAccountName = true;
            this.disabledSave = true;
            this.showToast('Error', 'This Ledger Item cannot be updated ', 'error');
        } else{
            this.disabledAccountName = false;
            this.disabledSave = false;
        }
      
    }
    handleItemCancel(){
        this.isItemEdit = false;
    }
    handleItemSave(event) {

        console.log('this.selectedItemId:', this.selectedItemId);
        const updatedName = this.accountName;
        console.log('updatedName: ', updatedName);
        if (this.selectedItemId) {
            updateLedgerItemName({ itemId: this.selectedItemId , updatedName: updatedName })
                .then(result => {
                    if (result === 'Success') {
                      
                         this.updateLocalLedgerItemName(updatedName);
                        this.showToast('Success', 'Account List has been updated successfully', 'success');
                        
                        this.isItemEdit = false; // ✅ close popup after update
                    } else {
                        this.showToast('Error', result, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error updating ledger item:', error);
                    this.showToast('Error', error.body?.message || 'Unknown error occurred', 'error');
                });
        } 
        else {
            this.updateLocalLedgerItemName(updatedName);
            this.showToast('Success', 'Account List has been updated successfully)', 'success');
            this.isItemEdit = false;
            //refreshApex(this.wiredAccountList);
           // refreshApex(this.wiredNewAccountList);
        }
    }
    // updateLocalLedgerItemName(updatedName) {
    //     this.hierarchyData.forEach(accountList => {
    //         accountList.categories?.forEach(category => {
    //             category.subCategories?.forEach(subCategory => {
    //                 subCategory.ledgers?.forEach(ledger => {
    //                     ledger.items?.forEach(item => {
    //                         // Check if the account number matches
    //                         if (item.accountNumber === this.accountNo) {
    //                             item.name = updatedName; // Update the item name
    //                         }
    //                     });
    //                 });
    //             });
    //         });
    //     });
    //     this.hierarchyData = [...this.hierarchyData];
    // }
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

}