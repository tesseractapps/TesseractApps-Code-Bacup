import {LightningElement, wire, api, track } from 'lwc';
import ICONS from '@salesforce/resourceUrl/Account_Reports_Icons';


export default class TesseractAppsAccountingReportsLwc extends LightningElement {

    @api orgid;
    @track isHome=true; 
    // @api companyid;
    // @api companyname;
    @track showProfitLoss = false;
    showSuperannuation = false;
    showBalanceSheet = false;
    showReconciliation = false;
    showClientAccounts = false;
    showActivityStatement = false;
    showWages = false;
    showDepartmentAccounts = false;

    reportOptions = [
        { name: 'profitLoss', label: 'Profit and Loss', iconUrl: `${ICONS}/Profit_and_loss.png`, class: 'report-card' },
        { name: 'superannuation', label: 'Superannuation', iconUrl: `${ICONS}/Super.png`, class: 'report-card' },
        { name: 'balanceSheet', label: 'Balance Sheet', iconUrl: `${ICONS}/Balance_Sheet.png`, class: 'report-card' },
        { name: 'reconciliation', label: 'Reconciliation', iconUrl: `${ICONS}/Reconcilation.png`, class: 'report-card' },
        { name: 'clientAccounts', label: 'Client Accounts', iconUrl: `${ICONS}/Client_Accounts.png`, class: 'report-card' },
        { name: 'activityStatement', label: 'Activity Statement', iconUrl: `${ICONS}/Activity_Statement.png`, class: 'report-card' },
        { name: 'wages', label: 'Wages', iconUrl: `${ICONS}/Wages.png`, class: 'report-card' },
        { name: 'departmentAccounts', label: 'Departmental Accounts', iconUrl: `${ICONS}/Departmental_Accounts.png`, class: 'report-card' }
    ];
    connectedCallback(){
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.companyId  = storedCompanyId;
            this.companyname = storedCompanyName;
            console.log('Company from localStorage connectedCallback AccountingReports:', this.companyId, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback AccountingReports');
        }
        //console.log('companyid in connectedCallback AccountingReports: ', this.companyid);
        //this.companyId = this.companyid;
        console.log(' companyname in connectedCallback AccountingReports: ', this.companyname);
        console.log('companyId in connectedCallback AccountingReports: ', this.companyId);
    }
    handleCardClick(event) {
        const selected = event.currentTarget.dataset.name;
        console.log('Card clicked: ', selected);
        // Remove .selected from all cards
        this.template.querySelectorAll('.report-card').forEach(card => {
            card.classList.remove('selected');
            console.log('Removed "selected" class from card: ', card);
        });
    
        // Add .selected to clicked card
        event.currentTarget.classList.add('selected');
    
        console.log('Added "selected" class to card: ', event.currentTarget);
        // Reset all flags
        this.resetAllFlags();
        this.isHome = false;
    
        switch (selected) {
            case 'profitLoss':
                this.showProfitLoss = true;
                break;
            case 'superannuation':
                this.showSuperannuation = true;
                break;
            case 'balanceSheet':
                this.showBalanceSheet = true;
                break;
            case 'reconciliation':
                this.showReconciliation = true;
                break;
            case 'clientAccounts':
                this.showClientAccounts = true;
                break;
            case 'activityStatement':
                this.showActivityStatement = true;
                break;
            case 'wages':
                this.showWages = true;
                break;
            case 'departmentAccounts':
                this.showDepartmentAccounts = true;
                break;
        }
    }
    

    resetAllFlags() {
        this.showProfitLoss = false;
        this.showSuperannuation = false;
        this.showBalanceSheet = false;
        this.showReconciliation = false;
        this.showClientAccounts = false;
        this.showActivityStatement = false;
        this.showWages = false;
        this.showDepartmentAccounts = false;
    }
     handleChildEvent(event){
        const name = event.detail.message;
        console.log('CHILD MESSAGE'+name);
     
        switch (name) {
           case 'PROFIT':
               this.showProfitLoss=false;
               this.isHome=true;
     
     
               break;
     
           case 'Balancesheet':
            this.showBalanceSheet=false;
            this.isHome=true;
  
     
               break;
            case 'WAGES':
                this.showWages=false;
                this.isHome=true;
                break;
            case 'ActivityStatement':
                this.showActivityStatement=false;
                this.isHome=true;
                break;
            case 'Reconciliation':
                this.showReconciliation=false;
                this.isHome=true;
                break;
        
           default:
            this.isHome=true;
       }
            
        }
        handleBack(){
             this.isHome=true;
             this.showProfitLoss = false;
             this.showSuperannuation = false;
             this.showBalanceSheet = false;
             this.showReconciliation = false;
             this.showClientAccounts = false;
             this.showActivityStatement = false;
             this.showWages = false;
             this.showDepartmentAccounts = false;
            // this.backFlag=true;
            //  const customEvent = new CustomEvent('myevent', {
            //      detail: { message: 'PROFIT' }
            //  });
            //  this.dispatchEvent(customEvent);
            
         }
}