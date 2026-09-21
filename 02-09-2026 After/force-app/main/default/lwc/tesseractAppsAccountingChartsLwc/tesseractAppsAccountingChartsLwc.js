import { LightningElement, track, api, wire } from 'lwc';
import CURRENT_USER_ID from '@salesforce/user/Id';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import { refreshApex } from '@salesforce/apex';

export default class TesseractAppsAccountingChartsLwc extends LightningElement {
    @track companyOptions = [];
    @track selectedCompany;
    userId = CURRENT_USER_ID;
    @api orgid;
    
    // Chart visibility flags
    @track isTemplateVisible = false;
    @track isSalesPurchases = false;
    @track isPayroll = true;
    @track isSales = false;
    @track isPurchases = false;
    @track isBalanceSheet = false;
    @track isProfitAndLoss = false;
    
    // Company and user data
    @track selectedCompanyName;
    wiredCompanyResult;
    userType;
    
    // Loading states
    @track isLoading = false;

    connectedCallback() {
        console.log('orgid in AccountingChartJune:', this.orgid);
        this.loadStoredCompanyData();
        this.initializeChartVisibility();
    }

    loadStoredCompanyData() {
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        
        if (storedCompanyId && storedCompanyName) {
            this.selectedCompany = storedCompanyId;
            this.selectedCompanyName = storedCompanyName;
            console.log('Company from localStorage:', this.selectedCompany, this.selectedCompanyName);
        } else {
            console.warn('No company info found in localStorage');
        }
    }

    initializeChartVisibility() {
        // Set initial chart visibility - all charts enabled for fixed layout
        this.isSales = true;
        this.isPurchases = true;
        this.isSalesPurchases = true;
        this.isBalanceSheet = true;
        this.isProfitAndLoss = true;
        this.isPayroll = true;
    }

    @wire(getCompany, { orgid: '$orgid' })
    wiredCompanies(result) {
        this.wiredCompanyResult = result;
        console.log('Company wire result:', JSON.stringify(result));
        
        const { data, error } = result;
        if (data) {
            this.processCompanyData(data);
        } else if (error) {
            console.error('Error fetching companies:', error);
            this.showErrorToast('Error loading companies');
        }
    }

    processCompanyData(data) {
        console.log('Processing company data:', JSON.stringify(data));
        
        this.companyOptions = data.map(company => ({
            label: company.Company_Name__c,
            value: company.Id
        }));

        // Set default company if none selected
        if (!this.selectedCompany && this.companyOptions.length > 0) {
            this.selectedCompany = this.companyOptions[0].value;
        }

        // Update company name
        this.updateSelectedCompanyName();
        
        // Store in localStorage
        this.storeCompanyData();
        
        console.log('Company options:', this.companyOptions);
        console.log('Selected company:', this.selectedCompany, this.selectedCompanyName);
    }

    updateSelectedCompanyName() {
        const selectedOption = this.companyOptions.find(
            option => option.value === this.selectedCompany
        );
        this.selectedCompanyName = selectedOption ? selectedOption.label : '';
    }

    storeCompanyData() {
        localStorage.setItem('selectedCompanyId', this.selectedCompany);
        localStorage.setItem('selectedCompanyName', this.selectedCompanyName);
        console.log('Stored in localStorage:', this.selectedCompany, this.selectedCompanyName);
    }

    fetchReplist() {
        this.isLoading = true;
        
        refreshApex(this.wiredCompanyResult)
            .then(() => {
                this.isLoading = false;
                this.showSuccessToast('Data refreshed successfully');
            })
            .catch(error => {
                this.isLoading = false;
                console.error('Error refreshing data:', error);
                this.showErrorToast('Error refreshing data');
            });
    }

    handleChangeCompany(event) {
        const previousCompany = this.selectedCompany;
        this.selectedCompany = event.target.value;
        
        console.log('Company changed from', previousCompany, 'to', this.selectedCompany);
        
        // Update company name
        this.updateSelectedCompanyName();
        
        // Store in localStorage
        this.storeCompanyData();
        
        // Dispatch company change event
        this.dispatchCompanyChangeEvent();
    }

    dispatchCompanyChangeEvent() {
        const companyChangeEvent = new CustomEvent('companychange', {
            detail: {
                companyId: this.selectedCompany,
                companyName: this.selectedCompanyName,
                timestamp: new Date().toISOString()
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(companyChangeEvent);
    }

    handlechildevent(event) {
        console.log('Event from child chart:', JSON.stringify(event.detail));
        
        // Enhanced event handling with chart identification
        const enhancedDetail = {
            ...event.detail,
            parentComponent: 'AccountingChartJune',
            selectedCompany: this.selectedCompany,
            timestamp: new Date().toISOString()
        };

        // Bubble to parent with enhanced data
        const bubbleEvent = new CustomEvent('childevent', {
            detail: enhancedDetail,
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(bubbleEvent);
    }

    // Utility methods for toast messages
    showSuccessToast(message) {
        this.dispatchEvent(new CustomEvent('showtoast', {
            detail: {
                type: 'success',
                message: message
            }
        }));
    }

    showErrorToast(message) {
        this.dispatchEvent(new CustomEvent('showtoast', {
            detail: {
                type: 'error',
                message: message
            }
        }));
    }

    // Getter for dynamic CSS classes
    get containerClasses() {
        let classes = 'main-container';
        if (this.isLoading) {
            classes += ' loading';
        }
        return classes;
    }

    get contentWrapperClasses() {
        return 'content-wrapper custom-scroll';
    }

    // Method to check if charts should be displayed
    get shouldShowCharts() {
        return this.selectedCompany && this.companyOptions.length > 0;
    }

    // Method to get chart count for layout optimization
    get visibleChartCount() {
        let count = 0;
        if (this.isSales) count++;
        if (this.isPurchases) count++;
        if (this.isPayroll) count++;
        if (this.isBalanceSheet) count++;
        if (this.isProfitAndLoss) count++;
        return count;
    }
}