import {LightningElement, wire, api, track } from 'lwc';
import getProfileId from '@salesforce/apex/CreateCompanyController.getProfileId';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getCompanyForEntity from '@salesforce/apex/CreateCompanyController.getCompanyForEntity';
import getEntityOnEdit from '@salesforce/apex/AccountingModuleController.getEntityOnEdit';

export default class TesseractAppsAccountingEntities extends LightningElement {
    @api selectedid;
    @api options;
    @api recordId;
    @api editcompanyname;
    @api isCustomer;
    @track profileFlag =true;
    //@track cardDetailsFlag;
    @track buyingFlag;
    @track sellingFlag=false;
    @track paymentSupplierFlag;
    @track paymentCustomerFlag;
    @track historyFlag;
    @track homeFlag =true;;
    @track isRemittanceEmail = false;
    @track isIndividual=false;
   
    @track customerFlag;
    @track selectedCardType;
    @track selectedDesignation;
    //@track recordId;
    @track recordId1;
    @track recordId2;
    @track recordId3;
    @track recordId4;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track isCardTypeDisabled=false;
    @track selectedPurchaseLayout;
    @track selectedCompId;
    // @track saveButtonDisable1=false;
    // @track saveButtonDisable2=false;
    // @track saveButtonDisable3=false;
    // @track saveButtonDisable4=false;
    // @track saveButtonDisable5=false;
    // @track nextButtonDisable1=false;
    // @track nextButtonDisable2=false;
    @track creditLimit;
    @track creditLimit1;
    @track discountEarlyPayment;
    @track volumeDiscount1;
    @track discountEarlyPayment1;
    @track volumeDiscount;
    @track taxCode;
    @track isTaxCode=false;
    @track selectedSaleLayout;
    @track selectedInvoiceDelivery;
    @track itemPriceLevel;
    @track profileId;
    @track remittanceStatus;
    @track profileSupplierId;
    @track profileCustomerId;
    @track paymentMethod;
    @track isDropdownOpen = false;
    @track isDropdownOpen1 = false;
    @track selectedOption = 'Select an option';
    @track selectedOption1 = 'Select an option';
    @track selectedcomp;
    @track companyOptions;
    @track tax;
    @track tax1;
    wiredProfileId;
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
    @track paymentMethodOptions = [
        { label:'American Express',value:'American Express'},
        { label:'Bank Card',value:'Bank Card'},
        { label:'Barter Card',value:'Barter Card'},
        { label:'Cash',value:'Cash'},
        { label:'Cheque',value:'Cheque'},
        { label:'Diners Club',value:'Diners Club'},
        { label:'EFTPOS',value:'EFTPOS'},
        { label:'Master Card',value:'Master Card'},
        { label:'Money Order',value:'Money Order'},
        { label:'Visa',value:'Visa'},
        { label:'Other',value:'Other'} 
    ];
    toggleDropdown() {
        console.log('toggleDropdown');
        this.isDropdownOpen = !this.isDropdownOpen;
        console.log('this.isDropdownOpen'+this.isDropdownOpen);
    }
    toggleDropdown1() {
        console.log('toggleDropdown');
        this.isDropdownOpen1 = !this.isDropdownOpen1;
        console.log('this.isDropdownOpen1'+this.isDropdownOpen1);
    }
 
    handleSelection(event) {
        //this.selectedOption = event.currentTarget.dataset.value;
          const selectedRow = event.currentTarget;
          // Retrieve the label (data-value) and rate (data-value1) from the clicked row
          const selectedLabel = selectedRow.getAttribute('data-value');
          const selectedRate = selectedRow.getAttribute('data-value2');
  
          // Set the selected values
          this.selectedOption = selectedLabel;  // Store the label (e.g., 'GST, Goods & Service Tax, 10%')
          this.tax1 = selectedRate;               // Store the rate (e.g., '10%')
  
          // Log both values to ensure they are being captured correctly
          console.log('Selected Option (Label):', this.selectedOption);
          console.log('Selected Rate:', this.tax1);
  
          this.isDropdownOpen = !this.isDropdownOpen;
       // this.isDropdownOpen = false;
    }
    handleSelection1(event) {
       
        const selectedRow = event.currentTarget;

        // Retrieve the label (data-value) and rate (data-value1) from the clicked row
        const selectedLabel = selectedRow.getAttribute('data-value');
        const selectedRate = selectedRow.getAttribute('data-value1');

        // Set the selected values
        this.selectedOption1 = selectedLabel;  // Store the label (e.g., 'GST, Goods & Service Tax, 10%')
        this.tax = selectedRate;               // Store the rate (e.g., '10%')

        // Log both values to ensure they are being captured correctly
        console.log('Selected Option (Label):', this.selectedOption1);
        console.log('Selected Rate:', this.tax);

        this.isDropdownOpen1 = !this.isDropdownOpen1;
        
    }
    connectedCallback(){
       // this.selectedcomp=this.selectedId;
        console.log('selected company in connected callback: '+ this.selectedid);
        console.log('recordId in connected callback IN: '+ this.recordId);
        this.selectedCompId=this.selectedid;
        console.log('selectedCompId in  connected callback: '+ this.selectedCompId);
        console.log('Received companyOptions in child:', JSON.stringify(this.options));
        console.log('isCustomer in connected callback IN: '+ this.isCustomer);
        console.log('editcompanyname in  connected callback: '+ this.editcompanyname);
       this.hideParentHandler();
        if(this.isCustomer=='Customer'){
            this.customerFlag=true;
            this.selectedCardType='Customer';
            this.isCardTypeDisabled =true;
        } else if(this.isCustomer=='Supplier'){
            this.customerFlag=false; 
            this.selectedCardType='Supplier';
            this.isCardTypeDisabled =true;
           
        } else{
            this.selectedCardType='';
           // console.log('selectedCardType in else connectedCallback : '+ this.selectedCardType);
            this.isCardTypeDisabled =false;
        }
       
        this.selectedPurchaseLayout='Service';
        this.selectedSaleLayout='Service';
        if(this.recordId){
            console.log('recordId in connectedCallback : '+ this.recordId);
            this.fetchEntityOnEdit(this.recordId);
            // console.log('selectedDesignation in connectedCallback : '+ this.selectedDesignation);
            // if( this.selectedDesignation=='Individual'){
            //     this.isIndividual=true;
            // } else {
            //     this.isIndividual=false;
            // }
            // console.log('isIndividual in connectedCallback : '+ this.isIndividual);
          
        }
      // console.log('selectedCardType in connectedCallback : '+ this.selectedCardType); 
    }
    hideParentHandler(){
        const event = new CustomEvent('hideaccountingsettings');
        this.dispatchEvent(event);
    }
    @wire(getProfileId)
    wiredProfileIds(result) {
        this.wiredProfileId = result; 
        const { data, error } = result; 
        if (data) {
            // Store the Ids in the component state
            this.profileSupplierId = data.SupplierId;
            this.profileCustomerId = data.CustomerId;
            //console.log('profileSupplierId :', this.profileSupplierId);
            //console.log('profileCustomerId Id:', this.profileCustomerId);
        } else if (error) {
            console.error('Error:', error);
        }
    }
    // @wire(getCompany)
    // wiredCompanyData(result ) {
    //     this.wiredCompanyResult = result; 
    //     const { data, error } = result;

    //         // Handle latest company for dropdown options
    //         if (data && data.companyOptions) {
    //             this.companyOptions = [{
    //                 label: data.companyOptions.Company_Name__c,  // Label will be the Company Name
    //                 value: data.companyOptions.Id                // Value will be the Company ID
    //             }];
    //             this.selectedcomp = data.companyOptions.Id;  // Set the selected ID to the latest company
    //            // console.log('Company options:', JSON.stringify(this.companyOptions));
    //         } else if (error) {
    //         console.error("Error fetching company data:", error);
    //     }
    // }
    // @wire(getCompanyForEntity, { selectedId: '$selectedId' })
    // wiredCompanyData(result) {
    //     this.wiredCompanyResult = result; 
    //     console.log('result in wiredCompanyResult:', JSON.stringify(result));
    //     console.log('selectedId  in wiredCompanyResult : '+this.selectedId);
    //     const { data, error } = result;
    //     if (data) {
    //         this.companyOptions = data.map(company => ({
    //             label: company.Company_Name__c,
    //             value: company.Id
    //         }));
    //         if (this.companyOptions.length === 1) {
    //             this.selectedCompId = this.companyOptions[0].value;  // Set the selectedId as the first company's Id
    //             console.log('Prepopulated selectedCompId:', this.selectedCompId);
    //         }
    //      console.log('companyOptions  in wiredCompanyData : '+  JSON.stringify(this.companyOptions));  
    //     } else if (error) {
    //         this.showErrorToast(error.body.message);
    //     }
    // } 
    get profileClass(){
        return this.profileFlag ? 'menu-item1' : 'menu-item';
    }
    // get cardDetailsClass(){
    //     return this.cardDetailsFlag ? 'menu-item1' : 'menu-item';
    // }
    get buyingClass(){
        return this.buyingFlag ? 'menu-item1' : 'menu-item'; 
    }
    get sellingClass(){
        return this.sellingFlag ? 'menu-item1' : 'menu-item'; 
    }
    get paymentClassSupplier(){
        return this.paymentSupplierFlag ? 'menu-item1' : 'menu-item';
    }
    get paymentClassCustomer(){
        return this.paymentCustomerFlag ? 'menu-item1' : 'menu-item';
    }
    get historyClass(){
        return this.historyFlag ? 'menu-item1' : 'menu-item';
    }
    handleClose(){
        this.profileFlag=false;
        this.homeFlag=true;
    }
    handleClose1(){
        this.buyingFlag=false;
        this.homeFlag=true;
    }
    handleClose2(){
        this.paymentFlag=false;
        this.homeFlag=true;
    }
    navigateToCreateCompany(){
        
        this.selectedCardType='';
        console.log('selectedCardType in back : '+ this.selectedCardType);
        const customEvent = new CustomEvent('clientevent', {
            detail: { message: 'Entities' }
        });
        this.dispatchEvent(customEvent);
      //  this.paymentCustomerFlag=false;
        this.homeFlag=false;
        //this.hideParentHandler();
    }
    handleChange(event){
        const fieldName = event.target.name;
        const fieldValue = event.target.value; 
        switch (fieldName) {
            case 'cardType':
                this.selectedCardType = fieldValue;
                break;
            case 'designation':
                this.selectedDesignation = fieldValue;
                if( this.selectedDesignation=='Individual'){
                    this.isIndividual=true;
                } else {
                    this.isIndividual=false;
                }
                break;
            case 'creditLimit':
                this.creditLimit =fieldValue;
               //console.log('creditLimit : '+this.creditLimit);
                break;
            case 'discountEarlyPayment':
                this.discountEarlyPayment = fieldValue;
               // console.log('discountEarlyPayment : '+this.discountEarlyPayment);
                break;
            case 'volumeDiscount':
                this.volumeDiscount =fieldValue;
                //console.log('volumeDiscount : '+this.volumeDiscount);
                break;
            case 'invoiceDelivery':
                this.selectedInvoiceDelivery =fieldValue;
                break;
            case 'itemPriceLevel':
                this.itemPriceLevel =fieldValue;
                break;
            case 'creditLimit1':
                this.creditLimit1 =fieldValue;
                console.log('creditLimit : '+this.creditLimit);
                break;
            case 'discountEarlyPayment1':
                this.discountEarlyPayment = fieldValue;
               // console.log('discountEarlyPayment1 : '+this.discountEarlyPayment);
                break;
            case 'volumeDiscount1':
                this.volumeDiscount =fieldValue;
               //console.log('volumeDiscount1 : '+this.volumeDiscount);
                break;
            case 'remittanceStatus':
                this.remittanceStatus = fieldValue;
                if( this.remittanceStatus=='To be Emailed'){
                    this.isRemittanceEmail=true;
                } else{
                    this.isRemittanceEmail=false; 
                }
                break;
            case 'paymentMethod':
                this.paymentMethod =fieldValue;
               // console.log('paymentMethod : '+this.paymentMethod);
                break;
                
            default:
                break;
        }
    }
    // handleTaxCode(){
    //     this.isTaxCode=true; 
    // }
    addressInputChange(event) {
        /* console.log('event detail'+JSON.stringify(event.detail));  */
        this.street = event.detail.street;
        this.city = event.detail.city;
        this.province = event.detail.province;
        this.country = event.detail.country;
        this.postalcode = event.detail.postalCode;
    }
    handleSuccessProfile(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
       
        let profileId = event.detail.id; // example of using event detail
        console.log('profile  Record ID:', profileId); 
        this.recordId = profileId;
        refreshApex(this.wiredProfileId);
    }
    handleSubmitProfile(event){
        console.log('in submit');
        console.log('selected company in handleSubmitProfile: '+ this.selectedCompId);
        event.preventDefault();// stop the form from submitting
        const fields = event.detail.fields;
        // const requiredFields = ['Name__c', 'First_Name__c', 'Last_Name__c'];
        // const missingField = requiredFields.find(fieldName => !fields[fieldName] || !this.template.querySelector(`lightning-input-field[field-name="${fieldName}"]`));
       
        // if (missingFields.length > 0) {
        //     // If any required fields are missing or empty, display an error message
        //     console.log('  SOME fieldS are missing or empty.');
        //     this.showToast('Error',' Some fieldS are missing or empty.','Error');
        //     return; // Exit the method without submitting the form
        // }
        if(this.isCustomer=='Customer'){
          
            this.selectedCardType='Customer';
          
        } else if(this.isCustomer=='Supplier'){
         
            this.selectedCardType='Supplier';  
           
        }
        fields.Card_Type__c = this.selectedCardType;
        console.log('selectedCardType in profile submit : '+ fields.Card_Type__c);
        fields.Address_Latest__Street__s  = this.street;
        fields.Address_Latest__City__s  = this.city;
        fields.Address_Latest__StateCode__s = this.province;
        fields.Address_Latest__Country__s =  this.country;
        fields.Address_Latest__PostalCode__s = this.postalcode;
        fields.Company__c=this.selectedCompId;

         console.log('company in profile : '+fields.Company__c);
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recordform="profileForm"]').submit(fields);
        //refreshApex(this.wiredProfileId);
        // this.creditLimit = '$0.00';
        // this.creditLimit1 = '$0.00';
        // this.volumeDiscount=0.00;
        // this.volumeDiscount1=0.00;
        // this.discountEarlyPayment=0.00;
        // this.discountEarlyPayment1=0.00;
        this.profileFlag=false; 
        if(this.customerFlag){
            this.sellingFlag=true;
        } else{
            this.buyingFlag=true;
        }
        this.paymentSupplierFlag=false;
        this.paymentCustomerFlag=false;
    }
    handleSuccessBuying(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        let buyingId = event.detail.id; // example of using event detail
        // console.log('buying  Record ID:', buyingId);  
        this.recordId1 = buyingId;
        this.profileFlag=false; 
        this.sellingFlag=false;
        this.buyingFlag=false;
        this.paymentCustomerFlag=false;
        this.paymentSupplierFlag=true;
    }
    handleSubmitBuying(event){
        // console.log('in submit');
        event.preventDefault();// stop the form from submitting
        refreshApex(this.wiredProfileId); 
        // if (!this.selectedOption) {
        //     console.log('Some fields are missing or empty.');
        //     this.showToast('Error', 'Some fields are missing or empty.', 'error');
        //     return; // Exit the method without submitting the form
        // }
        const fields = event.detail.fields;
        fields.Tax_Code__c = this.selectedOption;

       // fields.Tax_Code__c = this.selectedOption1;
        fields.Tax__c = this.tax1;
        console.log(' tax in handleSubmitBuying:', fields.Tax__c);

        //console.log('profileSupplierId Id in handleSubmitBuying:', this.profileSupplierId);
        fields.Entity_Profile__c=this.profileSupplierId;
        //console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recordform="buyingForm"]').submit(fields);
        
    }
    handleSuccessSelling(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        let sellingId = event.detail.id; // example of using event detail
        console.log('selling  Record ID:', sellingId); 
        this.recordId2 = sellingId;
        this.paymentCustomerFlag=true;
        this.paymentSupplierFlag=false;
        this.profileFlag=false; 
        this.sellingFlag=false;
        this.buyingFlag=false;     
    }
    handleSubmitSelling(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
        refreshApex(this.wiredProfileId); 
        const fields = event.detail.fields;
        // if (!this.selectedOption1) {
        //     console.log('Some fields are missing or empty.');
        //     this.showToast('Error', 'Some fields are missing or empty.', 'error');
        //     return; // Exit the method without submitting the form
        // }
        fields.Tax_Code__c = this.selectedOption1;
        fields.Tax__c = this.tax;
        console.log(' tax in handleSubmitSelling:', fields.Tax__c);  
        console.log('profileCustomer Id in handleSubmitSelling:', this.profileCustomerId);
        fields.Entity_Profile__c=this.profileCustomerId;
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recordform="sellingForm"]').submit(fields);
       
    }
    handleSuccessBuyingPayment(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        let buyingPaymentId = event.detail.id; // example of using event detail
        console.log('paymentSupplier Record ID:', buyingPaymentId);  
        this.recordId3 = buyingPaymentId;
        this.paymentSupplierFlag=false;
        this.homeFlag=false;
        // this.buyingFlag=false;  
        // this.profileFlag=false;

        // this.sellingFlag=false; 
        //  this.paymentFlag=false;
        
        //  this.paymentCustomerFlag=false;
        
       

        this.navigateToCreateCompany(); 
    }
    handleSubmitBuyingPayment(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
        refreshApex(this.wiredProfileId); 
        const fields = event.detail.fields;
        fields.Entity_Profile__c=this.profileSupplierId;
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recordform="buyingPaymentForm"]').submit(fields);
        
    }
    handleSuccessSellingPayment(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        let sellingPaymentId = event.detail.id; // example of using event detail
        console.log('sellingPaymentId Record ID:', sellingPaymentId);  
        this.recordId4 = sellingPaymentId;
        this.paymentCustomerFlag=false;
         this.homeFlag=false;
        // this.sellingFlag=false; 
        // this.profileFlag=false;

        // this.buyingFlag=false;
        //  this.paymentFlag=false;
        //  this.paymentSupplierFlag=false;
        
        
        this.navigateToCreateCompany();
    }
    handleSubmitSellingPayment(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
        refreshApex(this.wiredProfileId); 
        const fields = event.detail.fields; 
        fields.Entity_Profile__c=this.profileCustomerId;
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recordform="SellingPaymentForm"]').submit(fields); 
       
    }
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,  // success, error, info, warning
            mode: 'dismissable' // You can also use 'pester' or 'sticky'
        });
        this.dispatchEvent(evt);
    }
    // handleNext1() {
    //     this.creditLimit = '$0.00';
    //     this.creditLimit1 = '$0.00';
    //     this.volumeDiscount=0.00;
    //     this.volumeDiscount1=0.00;
    //     this.discountEarlyPayment=0.00;
    //     this.discountEarlyPayment1=0.00;
    //     this.profileFlag=false;
    //     if(this.customerFlag){
    //         this.sellingFlag=true;
    //     } else{
    //         this.buyingFlag=true;
    //     }
    //     this.paymentSupplierFlag=false;
    //     this.paymentCustomerFlag=false;
    // }
    // handleNext2() {
    //     if(this.customerFlag){
    //         this.paymentCustomerFlag=true;
    //     } else{
    //         this.paymentSupplierFlag=true;
    //     }
    //     this.sellingFlag=false;
    //     this.buyingFlag=false;  
    //     this.profileFlag=false;
    // }
    handlePrevious2() {
        this.profileFlag=true;
        this.sellingFlag=false;
        this.buyingFlag=false; 
        this.paymentSupplierFlag=false;
        this.paymentCustomerFlag=false;
        if(this.selectedCardType){
            this.isCardTypeDisabled =true;  
        } 
      
            console.log('recordId in handlePrevious2 : '+ this.recordId); 

    }
    handlePrevious3() {
        // this.creditLimit = '$0.00';
        // this.creditLimit1 = '$0.00';
        // this.volumeDiscount=0.00;
        // this.volumeDiscount1=0.00;
        // this.discountEarlyPayment=0.00;
        // this.discountEarlyPayment1=0.00;
        if(this.customerFlag){
            this.sellingFlag=true;
        } else{
            this.buyingFlag=true;
        }
        this.paymentSupplierFlag=false;
        this.paymentCustomerFlag=false;
        this.profileFlag=false;

    }
     // toggleDropdown() {
    //     console.log('toggleDropdown');
    //     this.isDropdownOpen = true;
    //     console.log('this.isDropdownOpen'+this.isDropdownOpen);
    // }

    // // Handle the selection of a tax code from the dropdown
    // handleTaxCodeSelection(event) {
    //     this.selectedOption = event.currentTarget.dataset.value;
    //     this.isDropdownOpen = false;
    // }
    handleProfile(){
        this.profileFlag=true;
       // this.cardDetailsFlag=false;
        this.buyingFlag=false;
        this.sellingFlag=false;
        this.paymentSupplierFlag=false;
        this.paymentCustomerFlag=false;
        this.historyFlag=false; 
    }
    // // handleCardDetails(){
    // //     this.profileFlag=false;
    // //     this.cardDetailsFlag=true;
    // //     this.buyingFlag=false;
    // //     this.paymentFlag=false;
    // //     this.historyFlag=false;
    // // }
    handleBuyingDetails(){
        this.profileFlag=false;
       // this.cardDetailsFlag=false;
        this.buyingFlag=true;
        this.sellingFlag=false;
        this.paymentFlag=false;
        this.paymentSupplierFlag=false;
        this.paymentCustomerFlag=false;
        this.historyFlag=false;
    }
    handleSellingDetails(){
        this.profileFlag=false;
       // this.cardDetailsFlag=false;
       this.buyingFlag=false;
       this.sellingFlag=true;
        this.paymentFlag=false;
        this.paymentSupplierFlag=false;
        this.paymentCustomerFlag=false;
        this.historyFlag=false;
    }
    handleSupplierPaymentDetails(){
        this.profileFlag=false;
       // this.cardDetailsFlag=false;
        this.buyingFlag=false;
        this.sellingFlag=false;
        this.paymentSupplierFlag=true;
        this.paymentCustomerFlag=false;
        this.historyFlag=false;
    }
    handleCustomerPaymentDetails(){
        this.profileFlag=false;
       // this.cardDetailsFlag=false;
        this.buyingFlag=false;
        this.sellingFlag=false;
        this.paymentSupplierFlag=false;
        this.paymentCustomerFlag=true;
        this.historyFlag=false;
    }
    fetchEntityOnEdit(recordId){
        console.log('Fetching Entity details : ' + this.recordId);
    //     getEntityOnEdit({ recordId: recordId })
    //     .then(result => {
    //         console.log('Company data fetched:', result);

    //         if (result) {
    //             this.recordId1 = result.Entity_Buying__r && result.Entity_Buying__r.length > 0 ? result.Entity_Buying__r[0].Id : null;
    //             this.recordId2 = result.Entity_Selling__r && result.Entity_Selling__r.length > 0 ? result.Entity_Selling__r[0].Id : null;
    //             this.recordId3 = result.Entity_Payment__r && result.Entity_Payment__r.length > 0 ? result.Entity_Payment__r[0].Id : null;
    //             this.recordId4 = result.Entity_Selling_Payment__r && result.Entity_Selling_Payment__r.length > 0 ? result.Entity_Selling_Payment__r[0].Id : null;
    //             this.street=result.Address_Latest__Street__s;
    //             this.city=result.Address_Latest__City__s;
    //             this.province=result.Address_Latest__StateCode__s;
    //             this.country='Australia';
    //             this.postalcode=result.Address_Latest__PostalCode__s;
    //             this.selectedDesignation=result.Designation__c;
    //             console.log('selectedDesignation in connectedCallback : '+ this.selectedDesignation);
    //             if( this.selectedDesignation=='Individual'){
    //                 this.isIndividual=true;
    //             } else {
    //                 this.isIndividual=false;
    //             }
    //             console.log('isIndividual in connectedCallback : '+ this.isIndividual);
               
    //              this.selectedOption1=result.Entity_Selling__r && result.Entity_Selling__r.length > 0 ? result.Entity_Selling__r[0].Tax_Code__c : null;
                
    //              this.selectedOption=result.Entity_Buying__r && result.Entity_Buying__r.length > 0 ? result.Entity_Buying__r[0].Tax_Code__c : null;
                 
    //             console.log('recordId1 (Entity_Buying): ' + this.recordId1);
    //             console.log('recordId2 (Entity_Selling): ' + this.recordId2);
    //             console.log('recordId3 (Entity_Buying_Payment): ' + this.recordId3);
    //             console.log('recordId4 (Entity_Selling_Payment): ' + this.recordId4);
    //         } else {
    //             this.showToast('Error', 'No data found !', 'error');
                
    //         }
    //     })
    //     .catch(error => {
    //         this.showToast('Error', 'Error fetching c data!', 'error');
    //         console.error('Error fetching  data', error);
    //         console.log('Error details:', error);
    //     });
    getEntityOnEdit({ recordId: this.recordId })
    .then(result => {
        console.log('Company data fetched:', result);

        // Check if result is not null and process the data
        if (result) {
            // Access the parent company record
            const companyRecord = result.companyRecord;

            // Access related child records
            const entityBuyingRecords = result.entityBuyingRecords;
            const entitySellingRecords = result.entitySellingRecords;
            const entitySellingPaymentRecords = result.entitySellingPaymentRecords;
            const entityPaymentRecords = result.entityPaymentRecords;
            console.log('selectedCardType  in getEntityOnEdit: ' +this.selectedCardType);
            // Use the related child records to set the IDs
            this.recordId1 = entityBuyingRecords && entityBuyingRecords.length > 0 ? entityBuyingRecords[0].Id : null;
            this.recordId2 = entitySellingRecords && entitySellingRecords.length > 0 ? entitySellingRecords[0].Id : null;
            this.recordId3 = entityPaymentRecords && entityPaymentRecords.length > 0 ? entityPaymentRecords[0].Id : null;
            this.recordId4 = entitySellingPaymentRecords && entitySellingPaymentRecords.length > 0 ? entitySellingPaymentRecords[0].Id : null;

            // Set other properties from companyRecord (parent)
            this.street = companyRecord.Address_Latest__Street__s;
            this.city = companyRecord.Address_Latest__City__s;
            this.province = companyRecord.Address_Latest__StateCode__s;
            this.country = 'Australia'; // Static value
            this.postalcode = companyRecord.Address_Latest__PostalCode__s;
            this.selectedDesignation = companyRecord.Designation__c;

            // Log the selected designation
            console.log('selectedDesignation in connectedCallback: ' + this.selectedDesignation);

            // Determine if the designation is "Individual"
            if (this.selectedDesignation === 'Individual') {
                this.isIndividual = true;
            } else {
                this.isIndividual = false;
            }
            console.log('isIndividual in connectedCallback: ' + this.isIndividual);

            // Handle tax code selection for customer or supplier
            this.selectedOption1 = entitySellingRecords && entitySellingRecords.length > 0 ? entitySellingRecords[0].Tax_Code__c : null;
            this.selectedOption = entityBuyingRecords && entityBuyingRecords.length > 0 ? entityBuyingRecords[0].Tax_Code__c : null;

            // Log the IDs
            console.log('recordId1 (Entity_Buying): ' + this.recordId1);
            console.log('recordId2 (Entity_Selling): ' + this.recordId2);
            console.log('recordId3 (Entity_Buying_Payment): ' + this.recordId3);
            console.log('recordId4 (Entity_Selling_Payment): ' + this.recordId4);

        } else {
            // Show error message if no data is found
            this.showToast('Error', 'No data found!', 'error');
        }
    })
    .catch(error => {
        // Handle error
        this.showToast('Error', 'Error fetching data!', 'error');
        console.error('Error fetching data', error);
        console.log('Error details:', error);
    });
     }
}