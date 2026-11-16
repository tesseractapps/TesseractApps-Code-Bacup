import { LightningElement ,track,api,wire} from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
//import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import getPurchasesCountChart from '@salesforce/apex/AccountingChartController.getPurchasesCountChart';

export default class ChartOfAccountsPurchasesChartLwc extends LightningElement {
    @api orgid; 
    @track selectedCompany;
    @track chart;
    @track isChartJsInitialized = false;
    @track salesPurchasesData;
    @track purchasesData;  // Add purchasesData to keep track of purchase counts.
    
    // Setter for selected company
    @api
    set selectedcompany(value) {
        this.selectedCompany = value;
        console.log('Selected company:', value);
        // Reset the chart data and re-fetch data when company changes
        if (this.isChartJsInitialized && value) {
            console.log('isChartJsInitialized in selected company:', this.isChartJsInitialized, + 'value',value);
            this.fetchPurchasesData(); // Fetch data when the company changes
        }
    }

    get selectedcompany() {
        return this.selectedCompany;
    }

    // This is called when the component is initialized
    connectedCallback() {
        console.log('orgid in ChartOfAccountsPurchasesChartLwc :', this.orgid);
        console.log('selectedCompany  in ChartOfAccountsPurchasesChartLwc:', this.selectedcompany); 
    }

    // This is called when the component is rendered (only once)
    renderedCallback() {
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    console.log('Chart.js loaded successfully');
                    this.isChartJsInitialized = true;
                    if (this.selectedCompany) {
                        console.log('selectedCompany in renderedCallback :', this.selectedCompany);
                        this.fetchPurchasesData(); // Fetch data after loading the script
                    }
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    // Fetch the purchases count data
    fetchPurchasesData() {
        getPurchasesCountChart({ companyId: this.selectedCompany })
            .then((data) => {
                console.log('Apex data in getPurchasesCountChart :', data);
                if (data && data.Purchases !== undefined) {
                    const purchaseCount = data.Purchases;
                    this.salesPurchasesData = { 'Purchases': purchaseCount };  // Store fetched data

                        this.processChartData(this.salesPurchasesData);  // Process data if purchase count exists
                 
                } else {
                    console.log('No data returned.');
                }
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }

    // Process the fetched chart data
    processChartData(data) {
        const label = 'Purchases';
        const value = data[label];
        
        console.log('Label:', label);
        console.log('Value:', value);

       
            this.initializeChart([label], [value], value);  // Initialize the chart with new data
       
    }

    // Initialize the chart with the fetched data
    initializeChart(labels, values, totalCount) {
        const canvasEl = this.template.querySelector('[data-id="pieChart"]');
        if (!canvasEl) {
            console.error('Canvas not found');
            return;
        }

        const context = canvasEl.getContext('2d');
        if (!context) {
            console.error('Canvas context unavailable');
            return;
        }

        // Destroy previous chart instance if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Create a new chart
        this.chartInstance = new Chart(context, {
            type: 'doughnut',  // Change type based on your needs (could be 'pie', 'bar', etc.)
            data: {
                labels: labels,
                datasets: [{
                    label: 'Purchases Count',
                    data: values,
                    backgroundColor: 'rgba(224, 202, 245, 0.6)'  // Customize color
                }]
            },
            options: {
                responsive: true,
                cutoutPercentage: 80,  // Customize the size of the hole in doughnut chart
                rotation: -Math.PI,  // Start the chart from the left side (180 degrees)
                circumference: Math.PI,  // Draw only half of the doughnut
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 12 },
                            color: 'rgba(0, 0, 0, 0.7)'  // Color of the labels
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const percentage = ((value / totalCount) * 100).toFixed(1);
                                return `Purchases: ${value} (${percentage}%)`;  // Tooltip format
                            }
                        }
                    }
                }
            }
        });
    }

    grandchildevent() {
        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: 'Roster' },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    }
   
}