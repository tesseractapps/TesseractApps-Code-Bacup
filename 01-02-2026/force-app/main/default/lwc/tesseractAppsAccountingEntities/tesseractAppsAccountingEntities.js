import {LightningElement, wire, api, track } from 'lwc';
//import getProfileId from '@salesforce/apex/CreateCompanyController.getProfileId';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
//import getCompanyForEntity from '@salesforce/apex/CreateCompanyController.getCompanyForEntity';
import getEntityOnEdit from '@salesforce/apex/AccountingModuleController.getEntityOnEdit';
import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getLedgerItemsforExpenses from '@salesforce/apex/AccountingModuleController.getLedgerItemsforExpenses';
import getOrganisationEmail from '@salesforce/apex/AccountingModuleController.getOrganisationEmail';


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
   // @track individualAbn=false; // Vamshi
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
    @track toggleDropdownAccount;
    @track toggleDropdownAccount1;
    @track toggleDropdownAccount2;
    @track toggleDropdownAccount3;
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
    //@track profileSupplierId;
    //@track profileCustomerId;
    @track paymentMethod;
    @track isDropdownOpen = false;
    @track isDropdownOpen1 = false;
    @track selectedOption = 'Select an option';
    @track selectedOption1 = 'Select an option';
    @track selectedcomp;
    @track companyOptions;
    @track tax;
    @track tax1;
    @track customerDropdownStyle = '';
    @track toEmail='';
    @track includeOrgEmail = false; //org email vamshi
    orgEmail = null; // from Apex
    @track formLoaded=false;
    _toEmailInitialized = false;
    //@track showTable = false;
    @track customerLedgerItems = []; 
    @track supplierLedgerItems = [];
    //@track filteredLedgerItems = []; 
    
    customerSearchTerm = '';
    customerShowTable = false;
    customerFilteredLedgerItems = [];
    customerSelectedAccountId = '';

    // Variables for Supplier dropdown
    supplierSearchTerm = '';
    supplierShowTable = false;
    supplierFilteredLedgerItems = [];
    supplierSelectedAccountId = '';

  //  wiredProfileId;
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


    @track sectionFlags = {
    Mandatory: true,
    NonMandatory: false
    //Addressdetails: true,    
    };

    @track sectionIcons = {
        Mandatory: '\u2B9F', 
        NonMandatory: '\u2B9C',
    };

    @api taxChild;      
    @api accList; 
    @track showAdvanced = false;   // Default OFF

    handleToggleAdvanced(event) {  //Vamshi added for Toggle Entity UI
        this.showAdvanced = event.target.checked;
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
    
//vamshi ABN field can be optional for individual type
    get isAbnRequired() {
        return !this.isIndividual; 
    }

        handleIncludeOrgEmail(event) {
        this.includeOrgEmail = event.target.checked;
        console.log("Include Org Email Checked? ", this.includeOrgEmail);

        if (this.includeOrgEmail) {
            this.fetchAndAppendOrgEmail();   // append to CC email
        } else {
            this.removeOrgEmail();           // remove from CC email
        }
        }


//     fetchAndAppendOrgEmail() {
//     getOrganisationEmail({ companyId: this.selectedCompId })
//         .then(result => {

//             this.orgEmail = result ? result.trim() : '';

//             // Current text value from lightning-input (not input-field)
//             let existing = this.toEmail ? this.toEmail.trim() : '';

//             // CASE 1: If To Email is empty → just put Org Email
//             if (!existing) {
//                 this.toEmail = this.orgEmail;
//                 return;
//             }

//             // CASE 2: Convert to array
//             let emails = existing.split(',')
//                                  .map(e => e.trim().toLowerCase());

//             // CASE 3: If not already present → add email
//             if (!emails.includes(this.orgEmail.toLowerCase())) {
//                 emails.push(this.orgEmail);
//             }

//             this.toEmail = emails.join(', ');
//         })
//         .catch(error => {
//             console.error('Error fetching org email:', error);
//         });
    // }
    @track Orgabn;
    @track facilityabn;
    @track showAbnPopup=false;
    @track selectedAbnType = '';
    get abnOptions() {
            return [
                { label: 'Organisation ABN', value: 'org' },
                { label: 'Facility ABN', value: 'facility' },
                { label: 'Manual Entry', value: 'custom' }
            ];
        }
// handleabn(event){
//     this.showAbnPopup=true;
// }

handleAbnSelection(event) {
        this.selectedAbnType = event.target.value;
        console.log('this.selectedAbnType',this.selectedAbnType);
         console.log('this.Orgabn', this.Orgabn);
    }

    get isCustom() {
        return this.selectedAbnType === 'custom';
    }

    handleCustomAbn(event) {
        this.customAbn = event.target.value;
    }
    applyAbnSelection() {
        let abnValue = '';

        if (this.selectedAbnType === 'org') {
            abnValue = this.Orgabn;
        } 
        else if (this.selectedAbnType === 'facility') {
            abnValue = this.facilityabn;
        } 
        else if (this.selectedAbnType === 'custom') {
            abnValue = this.customAbn;
        }
        console.log('abnValue', abnValue);
         console.log('this.Orgabn', this.Orgabn);

        // Set value in lightning-input-field
        const abnField = this.template.querySelector('[data-field="abnField"]');
         console.log('abnField', abnField);
        if (abnField) {
             console.log('abnField', abnField);
            abnField.value = abnValue;
             
            
        }

        // Close popup
        this.showAbnPopup = false;
    }
        closeAbnPopup(event){
            this.showAbnPopup=false;
        }
        // fetchAndAppendOrgEmail() {
        //     // only run if user has checked the "include org email" checkbox
        //     if (!this.includeOrgEmail) {
        //         console.log('Include Org Email is false — skipping fetchAndAppendOrgEmail');
        //         return;
        //     }
        //     getOrganisationEmail({ companyId: this.selectedCompId })
        //         .then(result => {
        //             console.log('org details using company id',JSON.stringify(result));
        //             this.orgEmail = result[0].Organization__r.Email__c ? result[0].Organization__r.Email__c.trim() : '';
        //             this.Orgabn=result[0].Organization__r.ABN__c ? result[0].Organization__r.ABN__c : '';
        //             this.facilityabn=result[0].ABN__c ? result[0].ABN__c : '';
        //             console.log('org abn and facility abn',this.Orgabn);
        //             const toEmailField = this.template.querySelector('[data-field="toEmail"]');
        //             if (!toEmailField) {
        //                 console.error("❌ To_Email__c not found");
        //                 return;
        //             }

        //             let existing = toEmailField.value ? toEmailField.value.trim() : "";

        //             let emails = existing
        //                 ? existing.split(',').map(e => e.trim().toLowerCase())
        //                 : [];

        //             if (!emails.includes(this.orgEmail.toLowerCase())) {
        //                 emails.push(this.orgEmail);
        //             }

        //             toEmailField.value = emails.join(', ');
        //             this.toEmail = toEmailField.value;
        //         })
        //         .catch(err => console.error("Org Email Fetch Error", err));
        // }
    fetchAndAppendOrgEmail() {
    //if (!this.includeOrgEmail) return;
    getOrganisationEmail({ companyId: this.selectedCompId })
        .then(result => {
                if (this.includeOrgEmail){
                      this.orgEmail = result[0].Organization__r.Email__c?.trim();
                }
          
            this.Orgabn=result[0].Organization__r.ABN__c ? result[0].Organization__r.ABN__c : '';
            this.facilityabn=result[0].ABN__c ? result[0].ABN__c : '';
            console.log('org abn and facility abn',this.Orgabn);

            const ccField = this.template.querySelector('[data-field="ccEmail"]');
            console.log('ccField',ccField);
            if (!ccField) return;

            let existing = ccField.value ? ccField.value.trim() : '';

            let emails = existing
                ? existing.split(',').map(e => e.trim().toLowerCase())
                : [];

            if (!emails.includes(this.orgEmail.toLowerCase())) {
                emails.push(this.orgEmail);
            }

            ccField.value = emails.join(', ');
            this.ccEmail = ccField.value;
            console.log('ccField',ccField);
        })
        .catch(err => console.error("Org Email Fetch Error", err));
        }


    removeOrgEmail() {
    const ccField = this.template.querySelector('[data-field="ccEmail"]');
    if (!ccField || !this.orgEmail) return;

    let current = ccField.value ? ccField.value.trim() : '';

    let emails = current
        .split(',')
        .map(e => e.trim())
        .filter(e => e.toLowerCase() !== this.orgEmail.toLowerCase());

    ccField.value = emails.join(', ');
    this.ccEmail = ccField.value;
    }

    // renderedCallback() {
    
    //     // INIT To Email only once
        
    //     if (!this._toEmailInitialized) {
    //         const field = this.template.querySelector(
    //             'lightning-input-field[field-name="To_Email__c"]'
    //         );

    //         if (field && field.value) {
    //             this.toEmail = field.value;
    //         }
    //         this._toEmailInitialized = true;
    //     }

        
    // }
    handleCcEmailChange(event) {
        this.ccEmail = event.target.value;
    }


    handleToEmailChange(event) {
        this.toEmail = event.target.value;
        }

    toggleDropdown(event) {
        console.log('toggleDropdown');
         event.stopPropagation(); 
       // const rect = event.currentTarget.getBoundingClientRect();
        // scrollY = window.scrollY || window.pageYOffset;
        //const scrollX = window.scrollX || window.pageXOffset;
      
        // Calculate position based on 10% X offset and 2% Y offset
        //const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04)-38; // subtract 2% from Y
        //const left = rect.left + scrollX - (window.innerWidth * 0.165) - 35 + 140; // subtract 10% from X
        //console.log('top==>'+ top + 'left===>'+left);

         const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
      
        //prviously position: absolute fixed !important
        this.toggleDropdownAccount3 = `
            position: fixed;   
           top: ${rect.bottom + 4}px;
            left: ${rect.left}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
         
        this.isDropdownOpen = !this.isDropdownOpen;
        console.log('this.isDropdownOpen'+this.isDropdownOpen);
         if (this.isDropdownOpen) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }
    // toggleDropdown1(event) {
    //      event.stopPropagation(); 
    //     console.log('toggleDropdown');
    //     this.isDropdownOpen1 = !this.isDropdownOpen1;
    //     const rect = event.currentTarget.getBoundingClientRect();
    //     const scrollY = window.scrollY || window.pageYOffset;
    //     const scrollX = window.scrollX || window.pageXOffset;
      
    //     // Calculate position based on 10% X offset and 2% Y offset
    //     const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04)-38; // subtract 2% from Y
    //     const left = rect.left + scrollX - (window.innerWidth * 0.165)-35; // subtract 10% from X
    //     console.log('top==>'+ top + 'left===>'+left);
      
    //     this.toggleDropdownAccount1 = `
    //         position: relative;
    //         top: -330px;
    //         left: 34px;
    //         width: 23%;
    //         max-height: 300px;
    //         z-index: 1000;
    //         background: white;
    //         border: 1px solid #ccc;
    //         border-radius: 4%;
    //         overflow-y: auto;
    //         overflow-x: hidden;
    //         box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    //     `;
    //     console.log('this.isDropdownOpen1'+this.isDropdownOpen1);
    //      if (this.isDropdownOpen1) {
    //         setTimeout(() => {
    //             console.log('✅ Outside click detection enabled');
    //             this.listenForOutsideClick = true;
    //         }, 0);
    //     } else {
    //         console.log('❌ Popover closed manually');
    //         this.listenForOutsideClick = false;
    //     }
    // }
 
    //Vamshi made Changes to Tax Code dropdown
     toggleDropdown1(event) {
            event.stopPropagation();
             this.isDropdownOpen1 = !this.isDropdownOpen1;

            // const rect = event.currentTarget.getBoundingClientRect();
            // const scrollY = window.scrollY || window.pageYOffset;

            // //  Place dropdown EXACTLY below the button
            // const top = rect.bottom + scrollY - 67;        // 67 is px
            // const left = rect.left -306;                       // 292 is px

             const inputEl = event.target;
             const rect = inputEl.getBoundingClientRect();

            this.toggleDropdownAccount1 = `
                position: fixed;
                top: ${rect.bottom + 4}px;
                left: ${rect.left}px;
                width: 23%;
                max-height: 300px;
                z-index: 10000;
                background: white;
                border: 1px solid #ccc;
                border-radius: 6px;
                overflow-y: auto;
                overflow-x: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;

            if (this.isDropdownOpen1) {
                setTimeout(() => (this.listenForOutsideClick = true), 0);
            } else {
                this.listenForOutsideClick = false;
            }
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
        this.listenForOutsideClick = false;
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
         this.listenForOutsideClick = false;
        
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

         // APPLY TAX CODE ONLY ONCE
        // this.selectedOption1= this.taxChild;
       
        // // APPLY ACCOUNT LIST ONLY ONCE
        // this.customerSearchTerm = this.accList;
        
        //  console.log('Tax from parent..',this.selectedOption1);
        //  console.log('accList from parent..',this.customerSearchTerm);

       this.hideParentHandler();
       this.fetchAndAppendOrgEmail();
        if(this.isCustomer=='Customer'){
            this.customerFlag=true;
            this.sellingFlag=true;
            this.buyingFlag=false;
            this.selectedCardType='Customer';
            this.isCardTypeDisabled =true;
            this.fetchLedgerItems();
            // Customer default values
         this.selectedOption1 = this.taxChild ? this.taxChild:'';       // Customer Tax Code
        this.customerSearchTerm = this.accList ? this.accList:'';     // Customer Account List
        } else if(this.isCustomer=='Supplier'){
            this.customerFlag=false;
            this.sellingFlag=false;
            this.buyingFlag=true;
            this.selectedCardType='Supplier';
            this.isCardTypeDisabled =true;
            this.fetchLedgerItemsforExpenses();
           // Supplier default values
        this.selectedOption = this.taxChild ? this.taxChild :'';       // Supplier Tax Code
       this.supplierSearchTerm = this.accList? this.accList :'';    // Supplier Account List
           
        } else{
            this.selectedCardType='';
           // console.log('selectedCardType in else connectedCallback : '+ this.selectedCardType);
            this.isCardTypeDisabled =false;
        }
       
        this.selectedPurchaseLayout='Service';
        this.selectedSaleLayout='Service';
        if(this.recordId){
            console.log('recordId in connectedCallback : '+ this.recordId);
            //this.fetchEntityOnEdit(this.recordId); //Commented by Vamshi
        }
        //  document.addEventListener('click', this.handleOutsideClick);
      // console.log('selectedCardType in connectedCallback : '+ this.selectedCardType); 
      window.addEventListener('click', this.handleOutsideClick);
      // console.log('selectedCardType in connectedCallback : '+ this.selectedCardType); 

      //Vamshi Added to change payment details for supplier  and buyer in new form 301-310
        if (this.isCustomer === 'Customer') {
            this.paymentCustomerFlag = true;
            this.paymentSupplierFlag = false;
        } else if (this.isCustomer === 'Supplier') {
            this.paymentSupplierFlag = true;
            this.paymentCustomerFlag = false;
        }
        console.log('selling flag', this.sellingFlag);
        console.log('Buying flag',this.buyingFlag);
        console.log('customer flag',this.isCustomer);

    //      // Only set defaults IF parent did not pass values
    // if (!this.selectedOption1 && this.taxChild) {
    //     this.selectedOption1 = this.taxChild;
    // }

    // if (!this.customerSearchTerm && this.accList) {
    //     this.customerSearchTerm = this.accList;
    // }
   
    
    }

    // connectedCallback() {
    // console.log('selected company in connected callback: '+ this.selectedid);
    // console.log('recordId in connected callback IN: '+ this.recordId);

    // this.selectedCompId = this.selectedid;

    // console.log('Tax from parent..', this.taxChild);
    // console.log('accList from parent..', this.accList);

    // // ---------------------------------------
    // // CUSTOMER SIDE  (Already working)
    // // ---------------------------------------
    // if (this.isCustomer === 'Customer') {

    //     // Customer flags
    //     this.customerFlag = true;
    //     this.sellingFlag = true;
    //     this.buyingFlag = false;

    //     // Customer default values
    //     this.selectedOption1 = this.taxChild;       // Customer Tax Code
    //     this.customerSearchTerm = this.accList;     // Customer Account List

    //     this.selectedCardType = 'Customer';
    //     this.isCardTypeDisabled = true;

    //     this.fetchLedgerItems();
    // }

    // // ---------------------------------------
    // // SUPPLIER SIDE  (NEW ADDITION)
    // // ---------------------------------------
    // else if (this.isCustomer === 'Supplier') {

    //     // Supplier flags
    //     this.customerFlag = false;
    //     this.sellingFlag = false;
    //     this.buyingFlag = true;

    //     // Supplier default values
    //     this.selectedOption = this.taxChild;       // Supplier Tax Code
    //     this.supplierSearchTerm = this.accList;    // Supplier Account List

    //     this.selectedCardType = 'Supplier';
    //     this.isCardTypeDisabled = true;

    //     this.fetchLedgerItemsforExpenses();
    // }

    // // Payment flags
    // if (this.isCustomer === 'Customer') {
    //     this.paymentCustomerFlag = true;
    //     this.paymentSupplierFlag = false;
    // } else if (this.isCustomer === 'Supplier') {
    //     this.paymentSupplierFlag = true;
    //     this.paymentCustomerFlag = false;
    // }

    // this.selectedPurchaseLayout = 'Service';
    // this.selectedSaleLayout = 'Service';

    // window.addEventListener('click', this.handleOutsideClick);
    // }

    handleFormLoad(event) {
        console.log("📌 LREF Form Loaded");
        if (this.formLoaded) {
            return; // prevent running twice
        }
        this.formLoaded = true;
        // ACCESS RECORD VALUES LOADED BY LREF
        const rec = event.detail.records[this.recordId]?.fields;
        // ----------------------------
        // FIX 1: Restore Email
        // ----------------------------
        const toEmailField = this.template.querySelector('[data-field="toEmail"]');
        if (toEmailField) {
            this.toEmail = rec.To_Email__c ? rec.To_Email__c.value : '';
            toEmailField.value = this.toEmail;
        }
        // ----------------------------
        // FIX 2: Restore Address
        // ----------------------------
        this.street     = rec.Address_Latest__Street__s?.value || '';
        this.city       = rec.Address_Latest__City__s?.value || '';
        this.province   = rec.Address_Latest__StateCode__s?.value || '';
        this.postalcode = rec.Address_Latest__PostalCode__s?.value || '';
        this.country    = 'Australia';

        // ----------------------------
        // FIX 3: Determine Individual Type AFTER LREF loads
        // ----------------------------
        if (rec.Designation__c?.value === 'Individual') {
        this.isIndividual = true;
    } else {
    this.isIndividual = false;
}
        console.log("👤 isIndividual:", this.isIndividual);
    }

    disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
    }
    @track listenForOutsideClick = false;
    handleOutsideClick = (event) => {
        if (this.listenForOutsideClick) {
            const dropdownElement = this.template.querySelector('[data-id="taxTableSelling"]');
            if (dropdownElement && !dropdownElement.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.isDropdownOpen1 = false;
                this.listenForOutsideClick = false;
            }
            const dropdownElement1 = this.template.querySelector('[data-id="taxTableBuying"]');
            if (dropdownElement1 && !dropdownElement1.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.isDropdownOpen = false;
                this.listenForOutsideClick = false;
            }
            const dropdownElement3 = this.template.querySelector('[data-id="accountListTableCustomer"]');
            if (dropdownElement3 && !dropdownElement3.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.customerShowTable = false;
                this.listenForOutsideClick = false;
            }
            const dropdownElement4 = this.template.querySelector('[data-id="accountListTableSupplier"]');
            if (dropdownElement4 && !dropdownElement4.contains(event.target)) {
                console.log('🟥 Outside click: accountListTableDropdown');
                this.supplierShowTable = false;
                this.listenForOutsideClick = false;
            }
        }
    };
    // disconnectedCallback() {
    //     document.removeEventListener('click', this.handleOutsideClick);
    // }
    // handleOutsideClick = (event) => {
    //     const dropdownElement = this.template.querySelector('[data-id="taxDropdown"]');

    //     if (dropdownElement && !dropdownElement.contains(event.target)) {
    //         this.isDropdownOpen1 = false;
    //         this.isDropdownOpen = false;
    //     }
    // };

    hideParentHandler(){
        const event = new CustomEvent('hideaccountingsettings');
        this.dispatchEvent(event);
    }
    // @wire(getProfileId)
    // wiredProfileIds(result) {
    //     this.wiredProfileId = result; 
    //     const { data, error } = result; 
    //     if (data) {
    //         // Store the Ids in the component state
    //         this.profileSupplierId = data.SupplierId;
    //         this.profileCustomerId = data.CustomerId;
    //         console.log('profileSupplierId :', this.profileSupplierId);
    //         console.log('profileCustomerId Id:', this.profileCustomerId);
    //     } else if (error) {
    //         console.error('Error:', error);
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
        this.dispatchEvent(new CustomEvent('cancel'));
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
            // case 'designation':
            //     this.selectedDesignation = fieldValue;
            //     if( this.selectedDesignation=='Individual'){
            //         this.isIndividual=true;
            //     } else {
            //         this.isIndividual=false;
            //     }
            //     break;
            case 'designation':
                const fieldValue = event.detail.value || event.target.value;
                this.selectedDesignation = fieldValue;

                this.isIndividual = (fieldValue === 'Individual');
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
            // case 'remittanceStatus':
            //     this.remittanceStatus = fieldValue;
            //     if( this.remittanceStatus=='To be Emailed'){
            //         this.isRemittanceEmail=true;
            //     } else{
            //         this.isRemittanceEmail=false; 
            //     }
            //     break;

             case 'remittanceStatus':
                const fieldValue1 = event.detail.value;
                this.remittanceStatus = fieldValue1;
                this.isRemittanceEmail = (fieldValue1 === 'To be Emailed');
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
            message: "Profile updated successfully.",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
       
        let profileId = event.detail.id; // example of using event detail
        console.log('profile  Record ID:', profileId); 
        this.recordId = profileId;
       // refreshApex(this.wiredProfileId);
       this.navigateToCreateCompany();
    }
    // handleSubmitProfile(event){
    //     console.log('in submit');
    //     console.log('selected company in handleSubmitProfile: '+ this.selectedCompId);
    //     event.preventDefault();// stop the form from submitting
    //     const fields = event.detail.fields;
    //     // const requiredFields = ['Name__c', 'First_Name__c', 'Last_Name__c'];
    //     // const missingField = requiredFields.find(fieldName => !fields[fieldName] || !this.template.querySelector(`lightning-input-field[field-name="${fieldName}"]`));
       
    //     // if (missingFields.length > 0) {
    //     //     // If any required fields are missing or empty, display an error message
    //     //     console.log('  SOME fieldS are missing or empty.');
    //     //     this.showToast('Error',' Some fieldS are missing or empty.','Error');
    //     //     return; // Exit the method without submitting the form
    //     // }
    //     if(this.isCustomer=='Customer'){
          
    //         this.selectedCardType='Customer';
          
    //     } else if(this.isCustomer=='Supplier'){
         
    //         this.selectedCardType='Supplier';  
           
    //     }
    //     fields.Card_Type__c = this.selectedCardType;
    //     console.log('selectedCardType in profile submit : '+ fields.Card_Type__c);
    //     fields.Address_Latest__Street__s  = this.street;
    //     fields.Address_Latest__City__s  = this.city;
    //     fields.Address_Latest__StateCode__s = this.province;
    //     fields.Address_Latest__Country__s =  this.country;
    //     fields.Address_Latest__PostalCode__s = this.postalcode;
    //     fields.Company__c=this.selectedCompId;
        
    // //     const emailField = this.template.querySelector(
    // //     'lightning-input-field[field-name="To_Email__c"]'
    // // );
    // const toEmailField = this.template.querySelector(
    // 'lightning-input-field[field-name="To_Email__c"]'
    // );

    // fields.To_Email__c = this.toEmail;
    // fields.Include_Org_Email__c = this.includeOrgEmail;
    // this.template.querySelector(
    //     'lightning-record-edit-form[data-recordform="profileForm"]'
    // ).submit(fields);

    //      console.log('company in profile : '+fields.Company__c);
    //     console.log('After fields>>'+JSON.stringify(fields));
    //    // this.template.querySelector('lightning-record-edit-form[data-recordform="profileForm"]').submit(fields);
    //     //refreshApex(this.wiredProfileId);
    //     // this.creditLimit = '$0.00';
    //     // this.creditLimit1 = '$0.00';
    //     // this.volumeDiscount=0.00;
    //     // this.volumeDiscount1=0.00;
    //     // this.discountEarlyPayment=0.00;
    //     // this.discountEarlyPayment1=0.00;
    //     this.profileFlag=false; 
    //     if(this.customerFlag){
    //         this.sellingFlag=true;
    //     } else{
    //         this.buyingFlag=true;
    //     }
    //     this.paymentSupplierFlag=false;
    //     this.paymentCustomerFlag=false;
    // }
      //updated handleSubmitProfile() by Vamshi

      

     handleSubmitProfile(event) {
        console.log('---- SUBMIT START ----');

        event.preventDefault();
        const fields = event.detail.fields;
        const requiredFields = ['Name__c', 'First_Name__c', 'Last_Name__c'];
        const missingField = requiredFields.find(fieldName => !fields[fieldName] || !this.template.querySelector(`lightning-input-field[field-name="${fieldName}"]`));
       
        // if (missingField.length > 0) {
        //     // If any required fields are missing or empty, display an error message
        //     console.log('  SOME fieldS are missing or empty.');
        //     this.showToast('Error',' Some fieldS are missing or empty.','Error');
        //     return; // Exit the method without submitting the form
        // }
        console.log('Selected company:', this.selectedCompId);

        // CARD TYPE
        if (this.isCustomer === 'Customer') {
            this.selectedCardType = 'Customer';
        } else if (this.isCustomer === 'Supplier') {
            this.selectedCardType = 'Supplier';
        }
        fields.Card_Type__c = this.selectedCardType;

        // ADDRESS
        fields.Address_Latest__Street__s   = this.street;
        fields.Address_Latest__City__s     = this.city;
        fields.Address_Latest__StateCode__s = this.province;
        fields.Address_Latest__Country__s  = this.country;
        fields.Address_Latest__PostalCode__s = this.postalcode;

        // COMPANY
        fields.Company__c = this.selectedCompId;

        // ✅ ONLY IF YOU REALLY HAVE THIS FIELD ON Entity_Profile__c
        fields.Entity_Profile__c = this.recordId;

        // TO EMAIL + ORG EMAIL
        fields.To_Email__c = this.toEmail;
        fields.Include_Org_Email__c = this.includeOrgEmail;


         console.log('company in profile : '+fields.Company__c);
        console.log('After fields>>'+JSON.stringify(fields));
      // this.template.querySelector('lightning-record-edit-form[data-recordform="profileForm"]').submit(fields);
        // refreshApex(this.wiredProfileId);
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

        // TAX / ACCOUNT / LEDGER
        if (this.customerFlag) {
            fields.Tax_Code__c              = this.selectedOption1 || null;
            fields.Tax__c                   = this.tax || null;
            fields.AccountList__c           = this.customerSearchTerm || null;
            fields.Accounting_Ledger_Items__c = this.customerSelectedAccountId || null;
        } else if (this.buyingFlag) {
            fields.Tax_Code__c              = this.selectedOption || null;
            fields.Tax__c                   = this.tax1 || null;
            fields.AccountList__c           = this.supplierSearchTerm || null;
            fields.Accounting_Ledger_Items__c = this.supplierSelectedAccountId || null;
        }

        console.log('After fields >> ', JSON.stringify(fields));

        if(this.isCustomer === 'Supplier'){
    if (!this.selectedOption || !this.supplierSearchTerm ||
             !this.street || !this.city
            || !this.country || !this.postalcode || !this.province) {                                                              
        this.showToast('Error', 'Please select the required fields.', 'error');
        return;
        }
        }
            if(this.isCustomer === 'Customer'){
            if(!this.selectedOption1 || !this.customerSearchTerm ||
                 !this.street || !this.city
                || !this.country || !this.postalcode || !this.province) {
            this.showToast('Error', 'Please select the required fields. ', 'error');
            return; // Prevent form submission
            }
            }
    
        

        this.template.querySelector(
            'lightning-record-edit-form[data-recordform="profileForm"]'
        ).submit(fields);

        console.log('---- SUBMIT END ----');
    }
 

    handleSuccessBuying(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Buying details updated successfully.",
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
    // handleSubmitBuying(event){
    //     // console.log('in submit');
    //     event.preventDefault();// stop the form from submitting
    //    // refreshApex(this.wiredProfileId); 
    //     // if (!this.selectedOption) {
    //     //     console.log('Some fields are missing or empty.');
    //     //     this.showToast('Error', 'Some fields are missing or empty.', 'error');
    //     //     return; // Exit the method without submitting the form
    //     // }
    //     const fields = event.detail.fields;
    //     //  if (!this.profileSupplierId) {
    //     //     this.showToast('Error', 'Please submit Profile details before submitting Buying Details.', 'error');
    //     //     return; // Prevent form submission
    //     // }
    //      if (!this.selectedOption || !this.supplierSearchTerm) {
    //         this.showToast('Error', 'Please select the required fields.', 'error');
    //         return; // Prevent form submission
    //     }
    //     fields.Tax_Code__c = this.selectedOption;
    //     console.log('tax code....',fields.Tax_Code__c);
    //     fields.AccountList__c = this.supplierSearchTerm;
    //     console.log('AccountList__c....',fields.AccountList__c);
    //     fields.Accounting_Ledger_Items__c = this.supplierSelectedAccountId;
    //    // fields.Tax_Code__c = this.selectedOption1;
    //     fields.Tax__c = this.tax1;
    //     console.log(' tax in handleSubmitBuying:', fields.Tax__c);

    //    // console.log('profileSupplierId Id in handleSubmitBuying:', this.profileSupplierId);
    //     console.log('recordId Id in handleSubmitBuying:', this.recordId);
    //     //fields.Entity_Profile__c=this.profileSupplierId;
    //     fields.Entity_Profile__c=this.recordId;
    //     console.log('After fields>>'+JSON.stringify(fields));
    //    // this.template.querySelector('lightning-record-edit-form[data-recordform="buyingForm"]').submit(fields);
    //   // Submit
    // const form = this.template.querySelector('[data-recordform="buyingForm"]');
    //      if (!form) {
    //     console.error('❌ buyingForm not found');
    //     return;
    // }

    // form.submit(fields);
    // }

    //updated handleSubmitBuying() By Vamshi
    handleSubmitBuying(event) {
    event.preventDefault();
    const fields = event.detail.fields;

    if (!this.selectedOption || !this.supplierSearchTerm) {
        this.showToast('Error', 'Please select the required fields.', 'error');
        return;
    }

    fields.Tax_Code__c = this.selectedOption;
    fields.Tax__c = this.tax1;
    fields.AccountList__c = this.supplierSearchTerm;
    fields.Accounting_Ledger_Items__c = this.supplierSelectedAccountId;

    // Entity Profile relationship
    fields.Entity_Profile__c = this.recordId;

    console.log("BUYING fields>>", JSON.stringify(fields));

    // ✅ ONLY ONE SUBMIT
    this.template.querySelector(
        'lightning-record-edit-form[data-recordform="buyingForm"]'
    ).submit(fields);
}

   
    handleSuccessSelling(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Selling Details updated Successfully.",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        let sellingId = event.detail.id; // example of using event detail
        console.log('selling  Record ID:', sellingId); 
        this.recordId2 = sellingId;
        console.log('selling  Record ID  this.recordId2:',  this.recordId2); 
        this.paymentCustomerFlag=true;
        this.paymentSupplierFlag=false;
        this.profileFlag=false; 
        this.sellingFlag=false;
        this.buyingFlag=false;     
    }
    handleSubmitSelling(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
       // refreshApex(this.wiredProfileId); 
        const fields = event.detail.fields;
        // if (!this.selectedOption1) {
        //     console.log('Some fields are missing or empty.');
        //     this.showToast('Error', 'Some fields are missing or empty.', 'error');
        //     return; // Exit the method without submitting the form
        // }
    //    if (!this.profileCustomerId) {
    //         this.showToast('Error', 'Please submit Prifile details before submitting Selling Details.', 'error');
    //         return; // Prevent form submission
    //     }
        if (!this.selectedOption1 || !this.customerSearchTerm) {
            this.showToast('Error', 'Please select the required fields. ', 'error');
            return; // Prevent form submission
        }
        fields.Tax_Code__c = this.selectedOption1;
        fields.AccountList__c = this.customerSearchTerm;
        fields.Accounting_Ledger_Items__c = this.customerSelectedAccountId ;
        fields.Tax__c = this.tax;
        console.log(' tax in handleSubmitSelling:', fields.Tax__c);  
        //console.log('profileCustomer Id in handleSubmitSelling:', this.profileCustomerId);
        console.log('recordId Id in handleSubmitSelling:', this.recordId);
      //  fields.Entity_Profile__c=this.profileCustomerId;
        fields.Entity_Profile__c=this.recordId;
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recordform="sellingForm"]').submit(fields);
       
    }
    handleSuccessBuyingPayment(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Supplier record saved successfully.",
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
        //refreshApex(this.wiredProfileId); 
        const fields = event.detail.fields;
        // if (!this.profileSupplierId) {
        //     this.showToast('Error', 'Please submit Buying details before submitting Payment Details.', 'error');
        //     return; // Prevent form submission
        // }
        //fields.Entity_Profile__c=this.profileSupplierId;
          fields.Entity_Profile__c=this.recordId;
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recordform="buyingPaymentForm"]').submit(fields);
        
    }
    handleSuccessSellingPayment(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Customer record saved successfully.",
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
       // refreshApex(this.wiredProfileId); 
        const fields = event.detail.fields; 
        // if (!this.profileCustomerId) {
        //     this.showToast('Error', 'Please submit Selling details before submitting Payment Details.', 'error');
        //     return; // Prevent form submission
        // }
        //fields.Entity_Profile__c=this.profileCustomerId;
        fields.Entity_Profile__c=this.recordId;
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
 

    // handleSearch(event) {
    //     const searchKey = event.target.value.toLowerCase();
    //     this.filteredLedgerItems = this.ledgerItems.filter(item =>
    //         item.itemName.toLowerCase().includes(searchKey) ||
    //         item.accNo.toLowerCase().includes(searchKey) ||
    //         item.category.toLowerCase().includes(searchKey)
    //     );
    // }

    // handleSelection(event) {
    //     const selectedItem = event.currentTarget.dataset;
    //     console.log('Selected Item:', selectedItem);
    //     this.showtable = false; // Hide dropdown after selection
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
                // this.selectedOption1 = entitySellingRecords && entitySellingRecords.length > 0 ? entitySellingRecords[0].Tax_Code__c : null;
                // this.selectedOption = entityBuyingRecords && entityBuyingRecords.length > 0 ? entityBuyingRecords[0].Tax_Code__c : null;

                // this.customerSearchTerm = entitySellingRecords && entitySellingRecords.length > 0 ? entitySellingRecords[0].AccountList__c : null;
                // this.supplierSearchTerm = entityBuyingRecords && entityBuyingRecords.length > 0 ? entityBuyingRecords[0].AccountList__c : null;

                // this.customerSelectedAccountId = entitySellingRecords && entitySellingRecords.length > 0 ? entitySellingRecords[0].Accounting_Ledger_Items__c : null;
                // this.supplierSelectedAccountId = entityBuyingRecords && entityBuyingRecords.length > 0 ? entityBuyingRecords[0].Accounting_Ledger_Items__c : null;

                //  this.tax = entitySellingRecords && entitySellingRecords.length > 0 ? entitySellingRecords[0].Tax__c : null;
                // this.tax1 = entityBuyingRecords && entityBuyingRecords.length > 0 ? entityBuyingRecords[0].Tax__c : null;

                // Handle tax code selection for customer or supplier
                    this.selectedOption1 =
                        entitySellingRecords && entitySellingRecords.length > 0
                            ? entitySellingRecords[0].Tax_Code__c
                            : 'Select Tax Code';

                    this.selectedOption =
                        entityBuyingRecords && entityBuyingRecords.length > 0
                            ? entityBuyingRecords[0].Tax_Code__c
                            : 'Select Tax Code';

                    // Account List (Customer/Supplier)
                    this.customerSearchTerm =
                        entitySellingRecords && entitySellingRecords.length > 0
                            ? entitySellingRecords[0].AccountList__c
                            : '';

                    this.supplierSearchTerm =
                        entityBuyingRecords && entityBuyingRecords.length > 0
                            ? entityBuyingRecords[0].AccountList__c
                            : '';

                    // Accounting Ledger Item Ids
                    this.customerSelectedAccountId =
                        entitySellingRecords && entitySellingRecords.length > 0
                            ? entitySellingRecords[0].Accounting_Ledger_Items__c
                            : null;

                    this.supplierSelectedAccountId =
                        entityBuyingRecords && entityBuyingRecords.length > 0
                            ? entityBuyingRecords[0].Accounting_Ledger_Items__c
                            : null;

                    // Tax % values
                    this.tax =
                        entitySellingRecords && entitySellingRecords.length > 0
                            ? entitySellingRecords[0].Tax__c
                            : '';

                    this.tax1 =
                        entityBuyingRecords && entityBuyingRecords.length > 0
                            ? entityBuyingRecords[0].Tax__c
                            : '';
            Promise.resolve().then(() => {
                this.selectedOption = this.selectedOption;
                this.selectedOption1 = this.selectedOption1;
                this.customerSearchTerm = this.customerSearchTerm;
                this.supplierSearchTerm = this.supplierSearchTerm;
            });

                console.log('selectedOption (Entity_Buying): ' + this.selectedOption1);
                console.log('selectedOption (Entity_Selling): ' + this.selectedOption);
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
    //   toggleDropdownAccountList(event) {
    //     console.log('toggleDropdown');

    //     // If you need row-level context, use this:
    //     this.selectedRowId = event.currentTarget.dataset.id || null;
    //     console.log('selectedRowId:', this.selectedRowId);
    //     this.showTable = true;
    //     // Fix comparison operators and logic
    //     if (this.selectedCardType === 'Customer') {
    //         console.log('showtable after (Customer):', this.showTable);
    //         this.fetchLedgerItems(); // Customer-specific
    //     }

    //     if (this.selectedCardType === 'Supplier') {  
    //         console.log('showtable after (Supplier):', this.showTable);
    //         this.fetchLedgerItemsforExpenses(); // Supplier-specific
    //     }
    // }
     fetchLedgerItems() {
        console.log('Calling Apex Method: getLedgerItems...');
        console.log('companyId in fetchLedgerItems: ' + this.selectedCompId);

        // Call the Apex method and pass companyId as parameter
        getLedgerItems({ companyId: this.selectedCompId })
            .then(result => {
                console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

                // Process the data and map it to a proper format
                this.customerLedgerItems = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                }));

                console.log('Processed Ledger Items:', JSON.stringify(this.customerLedgerItems));
                 this.customerFilteredLedgerItems = this.customerLedgerItems;
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }

    fetchLedgerItemsforExpenses() {
        console.log('Calling Apex Method: getLedgerItemsforExpenses...');
        console.log('companyId in fetchLedgerItemsforExpenses: ' + this.selectedCompId);

        // Call the Apex method and pass companyId as parameter
        getLedgerItemsforExpenses({ companyId: this.selectedCompId })
            .then(result => {
                console.log('Ledger Items Fetched from Apex:', JSON.stringify(result));

                // Process the data and map it to a proper format
                this.supplierLedgerItems = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                }));

                console.log('Processed Ledger Items:', JSON.stringify(this.supplierLedgerItems));
                 this.supplierFilteredLedgerItems = this.supplierLedgerItems;
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }
    // handleFocus() {
    //     this.showTable = true;
    //     this.filteredLedgerItems = [...this.ledgerItems];
    // }

    // // Close dropdown only after selection or click outside
    // handleBlur(event) {
    //     setTimeout(() => {
    //         this.showTable = false;
    //     }, 200); // Give time for click to register
    // }

    // // Prevent table from closing on click
    // preventClose(event) {
    //     event.preventDefault();
    // }

    // // Filter list on input
    // // handleSearch(event) {
    // //     this.searchTerm = event.target.value;
    // //     const searchLower = this.searchTerm.toLowerCase();

    // //     this.filteredLedgerItems = this.ledgerItems.filter(item =>
    // //         item.accNo.toLowerCase().includes(searchLower) ||
    // //         item.itemName.toLowerCase().includes(searchLower) 
    // //     );
    // //     this.showTable = true;
    // // }
    // handleSearch(event) {
    //     this.searchTerm = event.target.value;
    //     const searchLower = this.searchTerm.toLowerCase();

    //     this.filteredLedgerItems = this.ledgerItems.filter(item => {
    //         const accNo = item.accNo?.toLowerCase() || '';
    //         const itemName = item.itemName?.toLowerCase() || '';
    //         const combined = `${accNo} - ${itemName}`;

    //         return (
    //             accNo.includes(searchLower) ||
    //             itemName.includes(searchLower) ||
    //             combined.toLowerCase().includes(searchLower)
    //         );
    //     });

    //     // If empty input, show full list
    //     if (!this.searchTerm) {
    //         this.filteredLedgerItems = [...this.ledgerItems];
    //     }

    //     this.showTable = true;
    // }


    // // Handle selection from table
    // handleSelection(event) {
    //     const itemName = event.currentTarget.dataset.value;
    //     const selectedId = event.currentTarget.dataset.id;
    //     const accNo = event.currentTarget.dataset.accno;

    //     this.searchTerm = `${accNo} - ${itemName}`;
    //     this.selectedAccountId = selectedId;
    //     this.showTable = false;

    //     console.log('selectedName :', selectedName);
    //     console.log('Selected Account Number:',selectedAccNo );
    //     console.log('Selected Account Id:',selectedId);
    //     console.log('selectedAccountDisplay:',this.selectedAccountDisplay);
    // }
    // handleCustomerFocus() {
    //     this.customerShowTable = true;
    //     this.customerFilteredLedgerItems = [...this.customerLedgerItems];
    // }

    // handleCustomerBlur() {
    //     setTimeout(() => {
    //         this.customerShowTable = false;
    //     }, 200);
    // }

    handleCustomerSearch(event) {
        this.customerSearchTerm = event.target.value;
        const searchLower = this.customerSearchTerm.toLowerCase();

        this.customerFilteredLedgerItems = this.customerLedgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });

        if (!this.customerSearchTerm) {
            this.customerFilteredLedgerItems = [...this.customerLedgerItems];
        }
        this.customerShowTable = true;
    }

    handleCustomerSelection(event) {
        const itemName = event.currentTarget.dataset.value;
        const selectedId = event.currentTarget.dataset.id;
        const accNo = event.currentTarget.dataset.accno;

        this.customerSearchTerm = `${accNo} - ${itemName}`;
        this.customerSelectedAccountId = selectedId;
        this.customerShowTable = false;

        console.log('Customer selected:', this.customerSearchTerm, selectedId);
        this.listenForOutsideClick = false;
    }
    // handleSupplierFocus() {
    //     this.supplierShowTable = true;
    //     this.supplierFilteredLedgerItems = [...this.supplierLedgerItems];
    // }

    // handleSupplierBlur() {
    //     setTimeout(() => {
    //         this.supplierShowTable = false;
    //     }, 200);
    // }

    handleSupplierSearch(event) {
        this.supplierSearchTerm = event.target.value;
        const searchLower = this.supplierSearchTerm.toLowerCase();

        this.supplierFilteredLedgerItems = this.supplierLedgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });

        if (!this.supplierSearchTerm) {
            this.supplierFilteredLedgerItems = [...this.supplierLedgerItems];
        }

        this.supplierShowTable = true;
    }

    handleSupplierSelection(event) {
        const itemName = event.currentTarget.dataset.value;
        const selectedId = event.currentTarget.dataset.id;
        const accNo = event.currentTarget.dataset.accno;

        this.supplierSearchTerm = `${accNo} - ${itemName}`;
        this.supplierSelectedAccountId = selectedId;
        this.supplierShowTable = false;

        console.log('Supplier selected:', this.supplierSearchTerm, selectedId);
        this.listenForOutsideClick = false;
    }
     handleSupplierALClick(event) {
       // this.supplierSearchTerm = ''; commented by vamshi line 1778
    //     const rowId = event.target.dataset.id;
    //     const recordId = event.currentTarget.dataset.id;   
    //    // this.activeRowId =rowId;
    //     const rect = event.currentTarget.getBoundingClientRect();
    //     const scrollY = window.scrollY || window.pageYOffset;
    //     const scrollX = window.scrollX || window.pageXOffset;
    //     const top = rect.bottom + scrollY - 46;  // originally -27, now subtracting 19 more
    //     const left = rect.left + scrollX - 251;  // origin

    //     this.customerDropdownStyle = `
    //         position: absolute;
    //         top: ${top}px;
    //         left: ${left}px;
    //         width: 29%;
    //         max-height: 300px;
    //         z-index: 1000;
    //         background: white;
    //         border: 1px solid #ccc;
    //         border-radius: 4px;
    //         overflow-y: auto;
    //         box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    //     `;

    //   const rect = event.currentTarget.getBoundingClientRect();
    //     const scrollY = window.scrollY || window.pageYOffset;
    //     const scrollX = window.scrollX || window.pageXOffset;
      
        // Calculate position based on 10% X offset and 2% Y offset
        // const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04)-38; // subtract 2% from Y
        // const left = rect.left + scrollX - (window.innerWidth * 0.165)-35; // subtract 10% from X
        // console.log('top==>'+ top + 'left===>'+left);
        event.stopPropagation(); 
        const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
      
        this.toggleDropdownAccount2 = `
            position: fixed;
            top: ${rect.bottom + 4}px;
            left: ${rect.left}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        this.supplierShowTable = !this.supplierShowTable;
        //this.fetchLedgerItems();
        if (this.supplierShowTable) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }

     handleCustomerALClick(event) {
       // this.customerSearchTerm = ''; 

    //     const rowId = event.target.dataset.id;
    //     const recordId = event.currentTarget.dataset.id;   
    //    // this.activeRowId =rowId;
    //     const rect = event.currentTarget.getBoundingClientRect();
    //     const scrollY = window.scrollY || window.pageYOffset;
    //     const scrollX = window.scrollX || window.pageXOffset;
    //     const top = rect.bottom + scrollY - 46;  // originally -27, now subtracting 19 more
    //     const left = rect.left + scrollX - 251;  // origin

    //     this.customerDropdownStyle = `
    //         position: absolute;
    //         top: ${top}px;
    //         left: ${left}px;
    //         width: 29%;
    //         max-height: 300px;
    //         z-index: 1000;
    //         background: white;
    //         border: 1px solid #ccc;
    //         border-radius: 4px;
    //         overflow-y: auto;
    //         box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    //     `;

    // const rect = event.currentTarget.getBoundingClientRect();
     //   const scrollY = window.scrollY || window.pageYOffset;
     //   const scrollX = window.scrollX || window.pageXOffset;
      
        // Calculate position based on 10% X offset and 2% Y offset
       // const top = rect.top + scrollY + rect.height - (window.innerHeight * 0.04)-38; // subtract 2% from Y
       // const left = rect.left + scrollX - (window.innerWidth * 0.165)-35; // subtract 10% from X
        event.stopPropagation();
         const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
      
        this.toggleDropdownAccount = `
            position: fixed;            
            top: ${rect.bottom + 4}px;
            left: ${rect.left}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        this.customerShowTable = !this.customerShowTable;
        //this.fetchLedgerItems();
        if (this.customerShowTable) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }

}