import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJs';
import calculateChartTotalLiability from '@salesforce/apex/AccountingChartController.calculateChartTotalLiability';
import calculateChartTotalAssets from '@salesforce/apex/AccountingChartController.calculateChartTotalAssets';

export default class TesseractAppsBalancesheetChartsLwc extends LightningElement {
    @api orgid;
    @track selectedCompany;
    @track selectedOption = '1 Month'; // Default selected option
    @track chart;
    @track isChartJsInitialized = false; // Flag to check chart initialization
    chartInstance;
    chartData = {
        // labels: ['Liabilities', 'Assets'],
        labels: ['Liabilities', 'Assets'],
        datasets: [] // Initially empty datasets
    };
    totalLiabilityData = null;
    canvasEl;
    @track monthOptions = [
        { label: '1 Month', value: '1 Month' },
        { label: '2 Months', value: '2 Months' },
        { label: '3 Months', value: '3 Months' },
        { label: '6 Months', value: '6 Months' },
        { label: '1 Year', value: '1 Year' }
    ];

    // Setter for selected company
    @api
    set selectedcompany(value) {
        this.selectedCompany = value;
        console.log('selectedCompany IN api in TesseractAppsBalancesheetChartsLwc===>' + this.selectedCompany);

        this.isChartJsInitialized = false;

        this.chartData.datasets = [];
        this.chartData.labels = ['Liabilities', 'Assets']; // Reset the labels
        this.canvasEl = null;  // Remove the previous canvas element reference
    
        // Destroy the previous chart instance if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        // Fetch new data for Liabilities and Assets when the company changes
        if (value) {
            this.fetchLiabilityData(); // Fetch Liability data first
            
            this.timeout = setTimeout(() => {
                this.fetchAssetData(); // Then fetch Asset data
            }, 2000);
        }
    }

    get selectedcompany() {
        return this.selectedCompany;
    }

    // Load Chart.js script when component is first rendered
    connectedCallback() {
        if (!this.isChartJsInitialized) {
            console.log('Loading Chart.js library...');
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    // Re-fetch data after library is loaded
                    if (this.selectedCompany) {
                        this.fetchLiabilityData();
                        
                        this.timeout = setTimeout(() => {
                            this.fetchAssetData(); // Then fetch Asset data
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    // This is called after the component is rendered, ensuring the canvas is available
    renderedCallback() {
        if (this.isChartJsInitialized && !this.canvasEl) {
            // Get the canvas element to render the chart
            this.canvasEl = this.template.querySelector('canvas');
        }

        // Initialize chart only when canvas is available and both datasets (Liabilities & Assets) are populated
        if (this.canvasEl && this.chartData.datasets.length === 2) {
            this.initializeChart();
        }
    }

    // Fetch the total liability amount for the selected company and selected option
    // fetchLiabilityData() {
    //     calculateChartTotalLiability({ companyId: this.selectedCompany, selectedMonths: this.selectedOption })
    //         .then((totalLiabilityAmount) => {
    //             console.log('fetchLiabilityData:', totalLiabilityAmount);
    //             this.updateChartData('Liabilities', totalLiabilityAmount, 0); // Update chart data with Liability
    //         })
    //         .catch((error) => {
    //             console.error('Error fetching total liabilities:', error);
    //         });
    // }
    fetchLiabilityData() {
        console.log('Fetching liability data for company:', this.selectedCompany, 'with selected option:', this.selectedOption);
        calculateChartTotalLiability({ companyId: this.selectedCompany, selectedMonths: this.selectedOption })
            .then((result) => {
                console.log('fetchLiabilityData result:', result);
                const totalLiabilityAmount = result.totalLiabilityAmount || 0;
                const totalIncomeAmount = result.totalIncomeAmount || 0;
                const totalExpenseAmount = result.totalExpenseAmount || 0;
    
                // Log the amounts for better debugging
                console.log('Total Liability Amount:', totalLiabilityAmount);
                console.log('Total Income Amount:', totalIncomeAmount);
                console.log('Total Expense Amount:', totalExpenseAmount);
    
                // Calculate Profit/Loss (Income - Expense)
                const profitOrLoss = parseFloat((totalIncomeAmount - totalExpenseAmount).toFixed(2));
                console.log('Profit/Loss (Income - Expense):', profitOrLoss);
    
                // Add Profit/Loss to Liabilities
                const adjustedLiability = parseFloat((totalLiabilityAmount + profitOrLoss).toFixed(2));
                
                console.log('Adjusted Liability (Liabilities + Profit/Loss):', adjustedLiability);
    
                // Update chart data with Liability and Profit/Loss
                this.updateChartData('Liabilities', adjustedLiability, 0);
            })
            .catch((error) => {
                console.error('Error fetching total liabilities:', error);
            });
    }
    
    // Fetch the total asset amount for the selected company and selected option
    fetchAssetData() {
        console.log('Fetching asset data for company:', this.selectedCompany, 'with selected option:', this.selectedOption);
        calculateChartTotalAssets({ companyId: this.selectedCompany, selectedMonths: this.selectedOption })
            .then((totalAssetAmount) => {
                console.log('fetchAssetData result (totalAssetAmount):', totalAssetAmount);
    
                // Log the total asset amount
                console.log('Total Asset Amount:', totalAssetAmount);
    
                // Update chart data with Asset
                this.updateChartData('Assets', 0, totalAssetAmount);
            })
            .catch((error) => {
                console.error('Error fetching total assets:', error);
            });
    }
    // Update chart data for Liabilities and Assets
    // updateChartData(category, liabilityAmount, assetAmount) {
    //     // Add Liabilities or Assets to chart data
    //     if (category === 'Liabilities') {
    //         this.chartData.datasets.push({
    //             label: 'Liabilities',
    //             data: [liabilityAmount, 0],
    //             backgroundColor: 'rgba(255, 99, 132, 0.7)', // Red color
    //         });
    //     } else if (category === 'Assets') {
    //         this.chartData.datasets.push({
    //             label: 'Assets',
    //             data: [0, assetAmount],
    //             backgroundColor: 'rgba(54, 162, 235, 0.7)', // Blue color
    //         });
    //     }

    //     // After both datasets are populated, initialize the chart
    //     if (this.chartData.datasets.length === 2) {
    //         this.initializeChart();
    //     }
    // }
    updateChartData(category, liabilityAmount, assetAmount) {
        if (category === 'Liabilities') {
            this.chartData.datasets.push({
                label: 'Liabilities',
                data: [liabilityAmount, 0],
                backgroundColor: 'rgba(255, 99, 132, 0.7)', // Red color
               // order: 0 // Ensures Liabilities appear first in the legend
            });
        } else if (category === 'Assets') {
            this.chartData.datasets.push({
                label: 'Assets',
                data: [0, assetAmount],
                backgroundColor: 'rgba(54, 162, 235, 0.7)', // Blue color
                //order: 1 // Ensures Assets appear second in the legend
            });
        }
    
        // After both datasets are populated, initialize the chart
        if (this.chartData.datasets.length === 2) {
            this.initializeChart();
        }
    }
    initializeChart() {
        console.log('labels:', this.chartData.labels, 'datasets:', this.chartData.datasets, 'canvasEl:');
        if (!this.canvasEl) {
            this.canvasEl = this.template.querySelector('canvas');
        }

        const ctx = this.canvasEl.getContext('2d');

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        try {
            this.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: this.chartData,
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            stacked: true,
                            title: {
                                display: true,
                                text: 'Categories',
                            },
                        },
                        y: {
                            stacked: true,
                            title: {
                                display: true,
                                text: 'Amount',
                            },
                        },
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            reverse: true, // <<-- this line reverses the legend order
                            labels: {
                                font: { size: 12 },
                                color: '#333',
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.dataset.label}: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Chart init error:', error);
        }
    }

    // Handle month selection changes
    handleChangeMonth(event) {
        this.selectedOption = event.target.value;
        console.log('Selected Month Option: ' + this.selectedOption);


        this.chartData.datasets = [];
        this.chartData.labels = ['Liabilities', 'Assets']; // Reset the labels
        this.canvasEl = null;  // Remove the previous canvas element reference
    
        // Destroy the previous chart instance if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    
        // Fetch the new data for Liabilities and Assets based on the new month range
        this.fetchLiabilityData();  // Re-fetch Liability data for the new month range
         
        this.timeout = setTimeout(() => {
            this.fetchAssetData(); // Then fetch Asset data
        }, 1000);     // Re-fetch Asset data for the new month range
    }
}