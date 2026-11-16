import { LightningElement ,track,api,wire} from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import getSalesPurchasesChart from '@salesforce/apex/AccountingChartController.getSalesPurchasesChart';

export default class ChartOfAccountsSalesChartLwc extends LightningElement {
    @api orgid; 
    @track selectedCompany;
    @track chart;
    @track isChartJsInitialized = false;
    @track salesPurchasesData;
    //@track entryType= 'Invoice';
    
    // @api
    // set selectedcompany(value) {
    //     this.selectedCompany = value;
    //     if (this.isChartJsInitialized && value) {
    //         this.fetchSalesData(); // Re-fetch chart when company changes
    //     }
    // }
    @api
    set selectedcompany(value) {
        this.selectedCompany = value;
        console.log('this.selectedCompany >>'+this.selectedCompany);
        if (this.isChartJsInitialized && value) {
            this.fetchSalesData();
        }
    }

    get selectedcompany() {
        return this.selectedCompany;
    }

    connectedCallback(){
        console.log('orgid in ChartOfAccountsSalesChartLwc :', this.orgid);
        console.log('selectedCompany  in ChartOfAccountsSalesChartLwc:', this.selectedcompany); 
    }
    renderedCallback() {
        
        
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    console.log('Chart.js loaded successfully');
                    this.isChartJsInitialized = true;
                    if (this.selectedCompany) {
                        this.fetchSalesData();
                    }  // Fetch company data after loading Chart.js
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }
   
    getCurrentMonthDates() {
        const days = [];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
    
        // First day of month
        const firstDay = new Date(year, month, 1);
    
        // Last day of month
        const lastDay = new Date(year, month + 1, 0);
        const numDays = lastDay.getDate();
    
        for (let i = 1; i <= numDays; i++) {
            const date = new Date(year, month, i);
            days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
    
        return days;
    }
   
    grandchildevent(){
        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: 'Roster' },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    }
    fetchSalesData() {
        getSalesPurchasesChart({ companyId: this.selectedCompany})
            .then(data => {
                console.log('Combined Sales & Purchases Data:', JSON.stringify(data));
                this.salesPurchasesData = data;
                this.processChartData(data);
            })
            .catch(error => {
                console.error('Error fetching combined chart data:', error);
            });
    }
    
    processChartData(data) {
        const groupedData = {};
        const colors = {
            Sales: 'rgba(75, 192, 192, 0.6)',
            Purchases: 'rgba(112, 135, 240, 0.6)'
        };
    
        const datesInMonth = this.getCurrentMonthDates();
        datesInMonth.forEach(date => {
            groupedData[date] = { Sales: 0, Purchases: 0 };
        });
    
        if (data?.Sales) {
            Object.keys(data.Sales).forEach(date => {
                groupedData[date].Sales = data.Sales[date];
            });
        }
    
        if (data?.Purchases) {
            Object.keys(data.Purchases).forEach(date => {
                groupedData[date].Purchases = data.Purchases[date];
            });
        }
    
        const labels = Object.keys(groupedData);
        const salesCounts = labels.map(date => groupedData[date].Sales);
        const purchasesCounts = labels.map(date => groupedData[date].Purchases);
    
        const datasets = [
            {
                label: 'Sales',
                data: salesCounts,
                backgroundColor: colors.Sales
            },
            {
                label: 'Purchases',
                data: purchasesCounts,
                backgroundColor: colors.Purchases
            }
        ];
    
        this.initializeChart(labels, datasets);
    }
    initializeChart(labels, datasets) {
        const ctx = this.template.querySelector('canvas');
        if (!ctx) {
            console.error('Canvas element not found');
            return;
        }
    
        const context = ctx.getContext('2d');
        if (!context) {
            console.error('Unable to get 2D context for canvas');
            return;
        }
    
        // Destroy the previous chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
    
        // Create a new bar chart with multiple datasets
        this.chart = new Chart(context, {
            type: 'bar',
            data: {
                labels: labels,       // e.g., ["Apr 1", "Apr 2", ..., "Apr 30"]
                datasets: datasets    // Both Sales and Purchases datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: false
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value % 1 === 0 ? value : ''; // Show only whole numbers
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }
    
}