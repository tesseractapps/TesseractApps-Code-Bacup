import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJs';
import calculateChartTotalLiability from '@salesforce/apex/AccountingChartController.calculateChartTotalLiability';

export default class TesseractAppsProfitAndLossChartsLwc  extends LightningElement {
    @api orgid;
    @track selectedCompany;
    @track selectedOption = '1 Month'; // Default selected option
    @track chart;
    @track isChartJsInitialized = false; // Flag to check chart initialization
    chartInstance;
    chartData = {
        labels: ['Profit', 'Loss'],
        datasets: [] // Initially empty datasets
    };
    totalIncome = 0;
    totalExpense = 0;
    totalProfitLoss = 0;  // New variable to hold Profit/Loss value
    profit = 0; // Variable to store profit value
    loss = 0;   
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
        console.log('selectedCompany IN api in ProfitLossChartLwc===>' + this.selectedCompany);

        // Reset chart initialization on company change
        this.isChartJsInitialized = false;

        // Clear previous chart data when the company changes
        this.chartData.datasets = [];

        // Fetch new data for Profit/Loss when the company changes
        if (value) {
            this.fetchIncomeExpenseData(); // Fetch Income and Expense data
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
                        this.fetchIncomeExpenseData();
                    }
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    // Fetch the Income and Expense data for the selected company and selected option
    fetchIncomeExpenseData() {
        calculateChartTotalLiability({ companyId: this.selectedCompany, selectedMonths: this.selectedOption })
            .then((result) => {
                console.log('fetchIncomeExpenseData:', result);

                // Extract Income and Expense values from the result
                this.totalIncome = result.totalIncomeAmount;
                this.totalExpense = result.totalExpenseAmount;

                // Calculate Profit/Loss
                this.totalProfitLoss =parseFloat(( this.totalIncome - this.totalExpense).toFixed(2));
                // this.taxAmount = parseFloat((this.subTotal - taxableAmount).toFixed(2));
                // Separate profit and loss into two variables
                if (this.totalProfitLoss > 0) {
                    this.profit = this.totalProfitLoss;
                    this.loss = 0; // No loss if profit is positive
                } else {
                    this.loss = this.totalProfitLoss; // Negative value turned positive for loss
                    this.profit = 0; // No profit if loss is negative
                }

                // Log profit and loss in console (without signs)
                console.log('Total Income:', this.totalIncome);
                console.log('Total Expense:', this.totalExpense);
                console.log('Profit:', this.profit);
                console.log('Loss:', this.loss);

                this.updateChartData(this.profit, this.loss); // Pass both profit and loss to the chart update
            })
            .catch((error) => {
                console.error('Error fetching Income/Expense data:', error);
            });
    }

   
    updateChartData(profit, loss) {
        const profitValue = Math.max(profit, 0);
        const lossValue = Math.min(loss, 0); // Make sure loss is positive for the chart
    
        this.chartData = {
            labels: ['Profit', 'Loss'],
            datasets: [
                {
                    data: [profitValue, lossValue],
                    backgroundColor: ['rgba(63, 201, 118, 0.7)', 'rgba(245, 104, 66, 0.7)'],
                    borderWidth: 1
                }
            ]
        };
    
        this.initializeChart();
    }

    initializeChart() {
        if (!this.canvasEl) {
            this.canvasEl = this.template.querySelector('canvas');
        }
    
        const context = this.canvasEl.getContext('2d');
    
        // Destroy the previous chart instance if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    
        try {
            let rotationValue = Math.PI; // Default rotation for Profit (upper half)
            let circumferenceValue = Math.PI; // Show half of the doughnut for Profit and Loss
    
            // Adjust rotation if loss exists
            if (this.totalProfitLoss < 0) {
                rotationValue = 0;  // Loss at the bottom (lower half)
                circumferenceValue = Math.PI; // Only show lower half for Loss
            }
    
            this.chartInstance = new Chart(context, {
                type: 'doughnut', // Doughnut chart for Profit/Loss
                data: this.chartData,
                options: {
                    responsive: true,
                    cutout: '40%', // Make the donut hollow
                    rotation: rotationValue, // Rotation to control where the slice begins
                    circumference: circumferenceValue, // Show only half of the doughnut
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { size: 12 },
                                color: '#333', // Default label color
                            },
                        },
                        tooltip: {
                            callbacks: {
                                // Customizing tooltips to display the correct data
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    let value = context.raw;
    
                                    // Format tooltip for Profit and Loss
                                    if (label === 'Profit') {
                                        return `${label}: ${value > 0 ? value.toFixed(2) : 0}`;
                                    } else if (label === 'Loss') {
                                        return `${label}: ${value < 0 ? value.toFixed(2) : 0}`;
                                    }
                                    return `${label}: ${value}`;
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error initializing Chart:', error);
        }
    }
    
    

    // Handle month selection changes
    handleChangeMonth(event) {
        this.selectedOption = event.target.value;
        console.log('Selected Month Option: ' + this.selectedOption);

        // Fetch new data whenever the selected option changes
        if (this.selectedCompany) {
            this.fetchIncomeExpenseData();
        }
    }

}