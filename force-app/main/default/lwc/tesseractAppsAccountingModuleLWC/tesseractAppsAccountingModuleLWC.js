import { LightningElement, track, api,wire } from 'lwc';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import getAccountListByCompany from '@salesforce/apex/AccountingModuleController.getAccountListByCompany';
import { refreshApex } from '@salesforce/apex';
import getRelatedRecords from '@salesforce/apex/AccountingModuleController.getRelatedRecords';

export default class TesseractAppsAccountingModuleLWC extends LightningElement {

    @api orgid;
    // @api companyid;
    // @api companyname;
    @track orgidtrack;
    @track isHome=true;
    //@track createCompanyflag = false;
    @track chartofAccountsflag = true;
    @track companyOptions = [];
    @track selectedCompany;
    @track hierarchyData=[];
    @track entryDetailedTable=false;
    @track entryData=[];
    @track itemId;
     @track edate;
    @track sdate;
    @track isActive = false;
    wiredAccountList;
    wireEntryList;

    connectedCallback(){
        console.log('orgId IN TesseractAppsAccountingModuleLWC : '+this.orgid);
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.selectedCompany  = storedCompanyId;
            this.companyname = storedCompanyName;
            console.log('Company from localStorage connectedCallback chart of accounts:', this.selectedCompany, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback chart of accounts');
        }        
       // console.log('companyid in connectedCallback  chart of accounts: ', this.companyid);
        //this.selectedCompany = this.companyid;
        console.log('selectedCompany in connectedCallback  chart of accounts: ', this.selectedCompany);
        console.log(' companyname in connectedCallback  chart of accounts: ', this.companyname);
       // this.orgidtrack = this.orgid;
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1);
        this.edate = last.toISOString().slice(0, 10);

         if (this.wiredAccountList) {
            refreshApex(this.wiredAccountList);
        }
    }
   
    @wire(getAccountListByCompany, {  sDate: '$sdate', eDate: '$edate', companyId: '$selectedCompany', isActive: '$isActive' })
    wiredAccounts(result) {
        console.log('wiredAccountList is calling>>');
        console.log('selectedCompany in wire  chart of accounts: ', this.selectedCompany);
       
        this.wiredAccountList = result;
        const { data, error } = result;

        if (data) {
            console.log('data in wire : ' + JSON.stringify(data));
            let sortedData = [...data];
            // Sort Account List by Account Number (or any other criteria you want)
            sortedData.sort((a, b) => {
                const numA = parseInt(a.accountListName.split('-')[0], 10);
                const numB = parseInt(b.accountListName.split('-')[0], 10);
                return numA - numB;
            });
           // let formattedAmount = "$0.00";
            // Initialize hierarchyData with Account Lists
            this.hierarchyData = sortedData.map(accountList => ({
                ...accountList,
                expanded: true,  // Start with account lists expanded
                iconName: 'utility:chevronright',
                categories: accountList.categories.map(category => ({
                    ...category,
                    expanded: true,
                    iconName: 'utility:chevronright',
                    amount:   this.formatAmount(0),
                    subCategories: category.subCategories.map(subCategory => ({
                        ...subCategory,
                        expanded: true,
                        iconName: 'utility:chevronright',
                        amount:   this.formatAmount(0),
                        ledgers: subCategory.ledgers.map(ledger => ({
                            ...ledger,
                            expanded: true,
                            iconName: 'utility:chevronright',
                            amount:   this.formatAmount(0),
                            items: ledger.ledgerItems 
                            ? ledger.ledgerItems.map(item => ({
                                ...item,
                                id: item.Id,
                                amount:  this.formatAmount(item.calculatedAmount  || 0) // Set to 0 if null or undefined
                            }))
                            : []
                            // ledgerItems: ledger.ledgerItems.map(item => ({
                            //     ...item,
                            //     amount: this.formatCurrency(item.Amount__c || 0) // Make sure a default value is used if Amount__c is null or undefined
                            // }))
                        }))
                    }))
                }))
            }));
            console.log('hierarchyData : ' + JSON.stringify(this.hierarchyData));
        } else if (error) {
            console.error('Error fetching account data:', error);
        }
    }
    formatAmount(amount) {
        return '$' + amount.toFixed(2);  // Ensure two decimal places, even if the amount is a whole number
    }
   
    @wire(getRelatedRecords, { sDate: '$sdate', eDate: '$edate', itemId: '$itemId' })
    wiredEntries(result) {
        console.log('itemId in wiredEntries:', this.itemId);
        console.log('result received in wiredEntries:', JSON.stringify(result));
        this.wireEntryList = result;
        const { data, error } = result;
        if (data) {
            this.entryData = data.map((entry, index) => {
                // Default value for entityName
                let entityName = '';

                // Check if entry.Entity_Profile__r exists and contains the needed fields
                if (entry.Entity_Profile__r) {
                    // Handle based on Card_Type__c
                    if (entry.Entity_Profile__r.Designation__c === 'Individual') {
                        // Concatenate FirstName and LastName for Customer
                        entityName = `${entry.Entity_Profile__r.First_Name__c ?? ''} ${entry.Entity_Profile__r.Last_Name__c ?? ''}`;
                    } else if (entry.Entity_Profile__r.Designation__c === 'Company') {
                        // Show Name for Supplier
                        entityName = entry.Entity_Profile__r.Name__c ?? '';
                    } else {
                        // Handle other cases (if any)
                        entityName = ''; // Default empty if not Customer or Supplier
                    }
                }

                console.log('entityName:', entityName); // Log the entityName value

                return {
                    SNo: index + 1,
                    ledgerItemName: entry.Accounting_Ledger_Items__r?.Name ?? '',
                    ledgerName: entry.Accounting_Ledger_Items__r?.Ledger_Name__r?.Name ?? '',
                    subCategory: entry.Accounting_Ledger_Items__r?.Sub_Category__r?.Name ?? '',
                    category: entry.Accounting_Ledger_Items__r?.Category__r?.Name ?? '',
                    entityName: entityName,  // Set the entityName here
                    companyName: entry.Company__r?.Company_Name__c ?? '',
                    orgName: entry.Company__r?.Organisation__r?.Name ?? '',
                    createdDate: entry.Invoice_Date__c ? new Date(entry.Invoice_Date__c).toLocaleDateString() : '',
                    amount: entry.Total_Amount__c ?? ''
                };
            });
            console.log('Data received in wiredEntries:', JSON.stringify(this.entryData));
        } else if (error) {
            // Handle error
            console.error('Error fetching records:', error);
        }
    }
    // fetchRelatedRecords() {
    //     if (!this.sdate || !this.edate || !this.itemId) {
    //         console.warn('Missing input(s)', {
    //             sdate: this.sdate,
    //             edate: this.edate,
    //             itemId: this.itemId
    //         });
    //         return;
    //     }

    //     getRelatedRecords({
    //         sDate: this.sdate,
    //         eDate: this.edate,
    //         itemId: this.itemId
    //     })
    //     .then(result => {
    //         console.log('Fetched related records:', result);
    //         this.wireEntryList = result;

    //         this.entryData = result.map((entry, index) => {
    //             let entityName = '';

    //             if (entry.Entity_Profile__r) {
    //                 const designation = entry.Entity_Profile__r.Designation__c;

    //                 if (designation === 'Individual') {
    //                     entityName = `${entry.Entity_Profile__r.First_Name__c ?? ''} ${entry.Entity_Profile__r.Last_Name__c ?? ''}`.trim();
    //                 } else if (designation === 'Company') {
    //                     entityName = entry.Entity_Profile__r.Name__c ?? '';
    //                 }
    //             }

    //             return {
    //                 SNo: index + 1,
    //                 ledgerItemName: entry.Accounting_Ledger_Items__r?.Name ?? '',
    //                 ledgerName: entry.Accounting_Ledger_Items__r?.Ledger_Name__r?.Name ?? '',
    //                 subCategory: entry.Accounting_Ledger_Items__r?.Sub_Category__r?.Name ?? '',
    //                 category: entry.Accounting_Ledger_Items__r?.Category__r?.Name ?? '',
    //                 entityName: entityName,
    //                 companyName: entry.Company__r?.Company_Name__c ?? '',
    //                 orgName: entry.Company__r?.Organisation__r?.Name ?? '',
    //                 createdDate: entry.Invoice_Date__c ? new Date(entry.Invoice_Date__c).toLocaleDateString() : '',
    //                 amount: entry.Total_Amount__c ?? ''
    //             };
    //         });

    //         console.log('Processed entryData:', JSON.stringify(this.entryData));
    //     })
    //     .catch(error => {
    //         console.error('Error fetching related records:', error);
    //     });
    // }
    // Toggle Account List expansion/collapse
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

    handleChangeCompany(event){
        this.selectedCompany=event.target.value;
        console.log('Select Company===>'+event.target.value);
        console.log('Select Company===>'+this.selectedCompany);
        refreshApex(this.wiredAccountList); 
    }

    handleDoubleClick(event) {
        refreshApex(this.wireEntryList); 
        this.entryDetailedTable=true;
        this.isHome=false;
        this.chartofAccountsflag=false;
        
        const itemId = event.currentTarget.dataset.id;
        console.log('Double-clicked Account Number:', itemId);
        this.itemId=itemId;
        // Add additional functionality here, like navigation or editing logic
        
    }
    handleClose(){
        this.isHome=true;
        this.entryDetailedTable=false;
        this.chartofAccountsflag=true;
    }
    fetchReplist (){
        refreshApex(this.wiredAccountList);
        
    }
      fetchReplist1 (){
        refreshApex(this.wireEntryList);
        
    }
    HandleActiveInactive(event) {
        const fieldName = event.target.name;
        const fieldChecked = event.target.checked;
         switch(fieldName) {
            case 'input1':
                    this.isActive = fieldChecked;
                    console.log('isActive :', this.isActive);
                    refreshApex(this.wiredAccountList);
                    break;
            default:
            console.log('Unknown field:', fieldName);
            break; 
         }     
    }
    hadleDates(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        if (fieldName == 'sdate') {
            this.sdate = fieldValue;
            console.log('this.sdate  :',this.sdate );
            
        }
        if (fieldName == 'edate') {
            this.edate = fieldValue;
            console.log('edate :', this.edate);
        }
    }
}