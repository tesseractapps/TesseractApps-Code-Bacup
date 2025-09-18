import { LightningElement, track, api,wire } from 'lwc';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import getAccountListByCompanyNew from '@salesforce/apex/AccountingModuleController.getAccountListByCompanyNew';
import { refreshApex } from '@salesforce/apex';

export default class TesseractAppsProfitandlossLwc extends LightningElement {

    @api orgid;
    @api companyid;
    @api companyname;
    @track orgidtrack;
    @track isHome=true;
    @track createCompanyflag = false;
    @track chartofAccountsflag = true;
    @track companyOptions = [];
    @track selectedCompany;
    @track hierarchyData=[];
    @track entryDetailedTable=false;
    @track entryData=[];
    @track itemId;
    @track incomeData = [];
    @track expenseData = [];
    @track totalIncome;
    @track totalExpense;
    wiredAccountList;
    wireEntryList;
    @track backFlag=false;

    connectedCallback(){
        console.log('companyid IN TesseractAppsProfitandlossLwc : '+this.companyid);
       // this.orgidtrack = this.orgid;
    }
   /*  @wire(getCompany, {orgid:'$orgid'})
    wiredCompanies({ data, error }) {
        if (data) {
            console.log('data===>'+JSON.stringify(data));
            this.companyOptions = data.map(company => ({
                label: company.Company_Name__c,
                value: company.Id
            }));
            if (this.companyOptions.length > 0) {
                this.selectedCompany = this.companyOptions[0].value;
            }
            console.log('this.companyOptions===>'+JSON.stringify(this.companyOptions));
        } else if (error) {
            console.error('Error fetching companies:', error);
        }
    } */

  /*   @wire(getAccountListByCompany, { companyId: '$selectedCompany' })
wiredAccounts(result) {
    console.log('wiredAccountList is calling>>');
    this.wiredAccountList = result;
    const { data, error } = result;

    if (data) {
        console.log('data in wire : ' + JSON.stringify(data));

        // Arrays to store Assets and Liabilities separately
        let assetsArray = [];
        let liabilitiesArray = [];

        // Iterate over each accountList and segregate categories
        data.forEach(accountList => {
            accountList.categories.forEach(category => {
                // Check if the category is 'Assets' or 'Liabilities'
                if (category.accountName === "Assets") {
                    // Add Asset category details to assetsArray
                    assetsArray.push(...this.processCategoryData(category));
                } else if (category.accountName === "Liabilities") {
                    // Add Liability category details to liabilitiesArray
                    liabilitiesArray.push(...this.processCategoryData(category));
                }
            });
        });

        // You now have two arrays: assetsArray and liabilitiesArray
        console.log('Assets Array:', JSON.stringify(assetsArray));
        console.log('Liabilities Array:', JSON.stringify(liabilitiesArray));

    } else if (error) {
        console.error('Error fetching account data:', error);
    }
} */

    @wire(getAccountListByCompanyNew, { companyId: '$companyid' })
    wiredAccounts(result) {
        this.wiredAccountList = result;

        console.log('wiredAccountList is calling>>');
        const { data, error } = result;
    
        if (data) {
            console.log('data in wire : ' + JSON.stringify(data));
    
            this.expenseData = [];
            this.incomeData = [];
            this.totalExpense = 0;
            this.totalIncome = 0;
    
            data.forEach((accountList) => {
                accountList.categories.forEach((category, categoryIndex) => {
                    if (category.accountName === "Expenses" || category.accountName === "Income") {
                        const isExpense = category.accountName === "Expenses";
    
                        const processedSubcategories = (category.subCategories || []).map((subcategory, subIndex) => {
                            let subTotal = 0;
    
                            const ledgerNames = (subcategory.ledgers || []).map((ledger, ledgerIndex) => {
                                const ledgerItems = (ledger.ledgerItems || []).map((ledgerItem, ledgerItemIndex) => {
                                    // Placeholder amount (since not provided in the response)
                                    const amount = ledgerItem.amount || 0;  // Example random amount
    
                                    subTotal += amount;
    
                                    return {
                                        uniqueKey: `ledgerItem-${categoryIndex}-${subIndex}-${ledgerIndex}-${ledgerItemIndex}`,
                                        name: ledgerItem.accountName,
                                        Id: ledgerItem.Id,
                                        amount: amount
                                    };
                                });
    
                                return {
                                    ledgerName: ledger.accountName,
                                    ledgerItems
                                };
                            });
    
                            // if (isExpense) {
                            //     this.totalExpense += subTotal;
                            // } else {
                            //     this.totalIncome += subTotal;
                            // }
                            if (isExpense) {
                                this.totalExpense = parseFloat((this.totalExpense + subTotal).toFixed(2));
                            } else {
                                this.totalIncome = parseFloat((this.totalIncome + subTotal).toFixed(2));
                            }
                            return {
                                uniqueKey: `${isExpense ? 'expense' : 'income'}-subcategory-${categoryIndex}-${subIndex}`,
                                subcategoryName: subcategory.accountName,
                                subTotal,
                                ledgerNames
                            };
                        });
    
                        if (isExpense) {
                            this.expenseData = processedSubcategories;
                        } else {
                            this.incomeData = processedSubcategories;
                        }
                    }
                });
            });
    
            this.profitOrLoss = (this.totalIncome - this.totalExpense).toFixed(2);
    
            console.log('Expense Data:', JSON.stringify(this.expenseData, null, 2));
            console.log('Income Data:', JSON.stringify(this.incomeData, null, 2));
            console.log('Total Expense:', this.totalExpense);
            console.log('Total Income:', this.totalIncome);
            console.log('Profit or Loss:', this.profitOrLoss);
    
        } else if (error) {
            console.error('Error fetching account data:', error);
        }
    }
         
// Helper function to process and extract required data from categories
/* processCategoryData(category) {
    let categoryData = [];

    category.subCategories.forEach(subCategory => {
        subCategory.ledgers.forEach(ledger => {
            ledger.ledgerItems.forEach(item => {
                categoryData.push({
                    categoryName: category.accountName,
                    subCategoryName: subCategory.accountName,
                    ledgerName: ledger.accountName,
                    accountNumber: item.accountNumber,
                    accountName: item.accountName,
                    amount: item.amount || null // Set to null if amount is not available
                });
            });
        });
    });

    return categoryData;
} */

    formatAmount(amount) {
        return '$' + amount.toFixed(2);  // Ensure two decimal places, even if the amount is a whole number
    }

    handleChangeCompany(event){
        this.selectedCompany=event.target.value;
        console.log('Select Company===>'+event.target.value);
        console.log('Select Company===>'+this.selectedCompany);
        refreshApex(this.wiredAccountList); 
    }
    handleBack(){
       // this.isHome=false;
       // this.backFlag=true;
        const customEvent = new CustomEvent('myevent', {
            detail: { message: 'PROFIT' }
        });
        this.dispatchEvent(customEvent);
       
    }
     fetchReplist (){
        refreshApex(this.wiredAccountList);
        
    }

}