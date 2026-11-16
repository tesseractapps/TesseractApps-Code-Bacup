import { LightningElement ,track,api,wire} from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
//import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import getSalesStatusListByMonth from '@salesforce/apex/AccountingChartController.getSalesStatusListByMonth';

export default class AccountingSalesChartLwc extends LightningElement {
    @api orgid; 
    taskData = { Draft: 0, Issued: 0, Received: 0 }; // Default values for the chart
    @track selectedCompany;
    @track selectedMonth;
    @track chart;
    @track isChartJsInitialized = false;
    @track chartInstance;
    @track salesData;
    @track entryType= 'Invoice';
    @track monthOptions = [
        { label: 'January', value: 'January'},
        { label: 'February',value: 'February'},
        { label: 'March',   value: 'March'},
        { label: 'April',   value: 'April'},
        { label: 'May',     value: 'May'},
        { label: 'June',    value: 'June'},
        { label: 'July',    value: 'July'},
        { label: 'August',  value: 'August'},
        { label:'September',value: 'September'},
        { label: 'October', value: 'October'},
        { label: 'November',value: 'November'},
        { label: 'December',value: 'December'}
    ];

    @api
    set selectedcompany(value) {
        this.selectedCompany = value;
        if (this.isChartJsInitialized && value) {
            this.fetchPurchasesData(); // Re-fetch chart when company changes
        }
    }

    get selectedcompany() {
        return this.selectedCompany;
    }

    connectedCallback(){
        console.log('orgid in ChartOfAccountsSalesChartLwc :', this.orgid);
        console.log('selectedCompany  in ChartOfAccountsSalesChartLwc:', this.selectedcompany);
        const today = new Date();
        const monthIndex = today.getMonth(); // 0 = January
        this.selectedMonth = this.monthOptions[monthIndex].value;

        console.log('Auto-selected month:', this.selectedMonth);
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    this.fetchPurchasesData(); // Fetch data only after Chart.js is loaded
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }
    renderedCallback() {
        
        
        if (this.isChartJsInitialized && !this.chartInstance && this.taskData) {
            const canvasEl = this.template.querySelector('canvas');
            if (canvasEl) {
                this.initializeChart();
            }
        }
    }
    fetchPurchasesData() {
        getSalesStatusListByMonth({ companyId: this.selectedCompany, selectedMonth: this.selectedMonth})
            .then((data) => {
                console.log('Apex Data:', JSON.stringify(data));
                if (data) {
                    this.taskData = data; // Update taskData with the data from Apex
                    this.processChartData(data); // Initialize chart once data is fetched
                }
            })
            .catch((error) => {
                console.error('Error fetching task data:', error);
            });
    }    

    processChartData(data) {
        const colors = {
            Draft: 'rgba(152, 160, 236, 0.6)',
            Issued: 'rgba(100, 216, 162, 0.6)',
            Received: 'rgba(240, 153, 172, 0.6)'
        };
    
        const labelMapping = {
            Draft: 'Draft',
            Issued: 'Issued',
            Received: 'Received'
        };
    
        const labels = [];
        const values = [];
        const backgroundColors = [];
    
        data.forEach(record => {
            const status = record.status;
            const count = record.count;
    
            // Only include valid, non-empty statuses
            if (status && status.trim() !== '' && count > 0) {
                labels.push(labelMapping[status] || status);
                values.push(count);
                backgroundColors.push(colors[status] || 'rgba(100, 100, 100, 0.6)');
            }
        });
    
        console.log('🎯 Labels for Chart:', labels);
        console.log('📊 Counts:', values);
    
        this.initializeChart(labels, values, backgroundColors);
    }
    initializeChart(labels, values, backgroundColors) {
        const canvasEl = this.template.querySelector('[data-id="pieChart"]');
        if (!canvasEl) {
            console.error('Canvas element not found');
            return;
        }
    
        const context = canvasEl.getContext('2d');
        if (!context) {
            console.error('Unable to get canvas context');
            return;
        }
    
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    
        this.chartInstance = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Status Distribution',
                    data: values,
                    backgroundColor: backgroundColors,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 12 },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label;
                                const value = context.raw;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    }
    grandchildevent(){
        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: 'Roster' },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    }
    handleChangeMonth(event){
        this.selectedMonth=event.target.value;
        console.log('Select selectedMonth===>'+event.target.value);
        console.log(' selectedMonth===>'+this.selectedMonth);
        if (this.selectedCompany) {
            this.fetchPurchasesData();
        }
    } 
}