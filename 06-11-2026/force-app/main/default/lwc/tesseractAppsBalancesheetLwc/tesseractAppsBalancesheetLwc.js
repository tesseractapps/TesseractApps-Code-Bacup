import { LightningElement, track, api,wire } from 'lwc';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import getAccountListByCompanyNew from '@salesforce/apex/AccountingModuleController.getAccountListByCompanyNew';
import { refreshApex } from '@salesforce/apex';

export default class TesseractAppsBalancesheetLwc extends LightningElement {

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
        @track assetData = [];
        @track liabilityData = [];
        @track totalAsset;
        @track totalLiability;
        wiredAccountList;
        wireEntryList;
        @track backFlag=false;
    
        connectedCallback(){
            console.log('orgId IN TesseractAppsBalancesheetLwc : '+this.orgid);
            console.log('companyid IN TesseractAppsBalancesheetLwc : '+this.companyid);
           // this.orgidtrack = this.orgid;
        }
      /*   @wire(getCompany, {orgid:'$orgid'})
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
        
                                if (isExpense) {
                                    this.totalExpense += subTotal;
                                } else {
                                    this.totalIncome += subTotal;
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
            */  
        @wire(getAccountListByCompanyNew, { companyId: '$companyid' })
        wiredAccounts(result) {
            this. wiredAccountList = result;
            console.log('wiredAccountList is calling>>');
            const { data, error } = result;
        
            if (data) {
                console.log('data in wire : ' + JSON.stringify(data));
        
                this.expenseData = [];
                this.incomeData = [];
                this.assetData = [];
                this.liabilityData = [];
                this.totalExpense = 0;
                this.totalIncome = 0;
                this.totalAsset = 0;
                this.totalLiability = 0;
        
                data.forEach((accountList) => {
                    accountList.categories.forEach((category, categoryIndex) => {
                        const isExpense = category.accountName === "Expenses";
                        const isIncome = category.accountName === "Income";
                        const isAsset = category.accountName === "Assets";
                        const isLiability = category.accountName === "Liabilities";
        
                        if (isExpense || isIncome || isAsset || isLiability) {
                            const processedSubcategories = (category.subCategories || []).map((subcategory, subIndex) => {
                                let subTotal = 0;
        
                                const ledgerNames = (subcategory.ledgers || []).map((ledger, ledgerIndex) => {
                                    const ledgerItems = (ledger.ledgerItems || []).map((ledgerItem, ledgerItemIndex) => {
                                        const amount = ledgerItem.amount || 0;
        
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
        
                                // Accumulate totals based on category
                                if (isExpense) {
                                    this.totalExpense += subTotal;
                                } else if (isIncome) {
                                    this.totalIncome += subTotal;
                                } else if (isAsset) {
                                    this.totalAsset += parseFloat(subTotal.toFixed(2));
                                } else if (isLiability) {
                                    this.totalLiability += subTotal;
                                }
        
                                return {
                                    uniqueKey: `${isExpense ? 'expense' : isIncome ? 'income' : isAsset ? 'asset' : 'liability'}-subcategory-${categoryIndex}-${subIndex}`,
                                    subcategoryName: subcategory.accountName,
                                    subTotal: subTotal.toFixed(2),
                                    ledgerNames
                                };
                            });
        
                            if (isExpense) {
                                this.expenseData = processedSubcategories;
                            } else if (isIncome) {
                                this.incomeData = processedSubcategories;
                            } else if (isAsset) {
                                this.assetData = processedSubcategories;
                            } else if (isLiability) {
                                this.liabilityData = processedSubcategories;
                            }
                        }
                    });
                });
        
                this.profitOrLoss = (this.totalIncome - this.totalExpense).toFixed(2);
                const equityCapital = this.liabilityData.find(
                    (subcategory) => subcategory.subcategoryName === 'Capital'
                );
        
                if (equityCapital) {
                    equityCapital.subTotal += parseFloat(this.profitOrLoss);
                    equityCapital.ledgerNames.push({
                        ledgerName: 'Profit or Loss',
                        ledgerItems: [
                            {
                                uniqueKey: `profit-loss-${Date.now()}`,
                                name: 'Profit or Loss',
                                amount: parseFloat(this.profitOrLoss)
                            }
                        ]
                    });
                    this.totalLiability += parseFloat(this.profitOrLoss); // Add to totalLiability
                } else {
                    const newEquityCapital = {
                        uniqueKey: `capital-${Date.now()}`,
                        subcategoryName: 'Capital',
                        subTotal: parseFloat(this.profitOrLoss),
                        ledgerNames: [
                            {
                                 ledgerName: 'Profit or Loss', 
                                ledgerItems: [
                                    {
                                        uniqueKey: `profit-loss-${Date.now()}`,
                                        name: 'Profit or Loss',
                                        amount: parseFloat(this.profitOrLoss)
                                    }
                                ]
                            }
                        ]
                    };
                    this.liabilityData.push(newEquityCapital);
                    this.totalLiability += parseFloat(this.profitOrLoss); // Add to totalLiability
                }
                this.totalLiability = this.totalLiability.toFixed(2);
                this.totalAsset  = this.totalAsset.toFixed(2);
                console.log('Expense Data:', JSON.stringify(this.expenseData, null, 2));
                console.log('Income Data:', JSON.stringify(this.incomeData, null, 2));
                console.log('Asset Data:', JSON.stringify(this.assetData, null, 2));
                console.log('Liability Data:', JSON.stringify(this.liabilityData, null, 2));
                console.log('Total Expense:', this.totalExpense);
                console.log('Total Income:', this.totalIncome);
                console.log('Total Asset:', this.totalAsset);
                console.log('Total Liability:', this.totalLiability);
                console.log('Profit or Loss:', this.profitOrLoss);
                console.log('Net Assets:', this.netAssets); // Net Assets Display
        
            } else if (error) {
                console.error('Error fetching account data:', error);
            }
        }
        
    
        handleChangeCompany(event){
            this.selectedCompany=event.target.value;
            console.log('Select Company===>'+event.target.value);
            console.log('Select Company===>'+this.selectedCompany);
            refreshApex(this.wiredAccountList); 
        }
        
       
        handleBack(){
             const customEvent = new CustomEvent('myevent', {
                 detail: { message: 'Balancesheet' }
             });
             this.dispatchEvent(customEvent);
            
         }
         fetchReplist (){
            refreshApex(this.wiredAccountList);
            
        }
}