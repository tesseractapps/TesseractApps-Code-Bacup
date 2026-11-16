import { LightningElement, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import getPayrollData from '@salesforce/apex/PayrollController.getPayrollData';

export default class PayrollBarChart extends LightningElement {
    @track chart;
    @track isChartJsInitialized = false;

    renderedCallback() {
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    this.fetchData();
                })
                .catch(error => console.error('Error loading Chart.js:', error));
        }
    }

    async fetchData() {
        try {
            const payrollData = await getPayrollData();
            this.processChartData(payrollData);
        } catch (error) {
            console.error('Error fetching payroll data:', error);
        }
    }

    processChartData(payrollData) {
        const colors = { Finalised: 'rgba(10, 94, 37, 0.98)', Submitted: 'rgba(20, 114, 238, 0.6)', 'STP Filed': 'rgba(16, 192, 83, 0.6)' };
        const labels = Object.keys(payrollData).reverse(); // Reverse to get Jan, Feb, March order
    
        const datasets = Object.keys(colors).map(status => ({
            label: status,
            data: labels.map(month => payrollData[month][status] || 0),
            backgroundColor: colors[status],
        }));
    
        this.initializeChart(labels, datasets);
    }
    

    initializeChart(labels, datasets) {
        const ctx = this.template.querySelector('canvas');
        if (!ctx) return;

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets },
            options: {
                responsive: true,
                plugins: { legend: { labels: { font: { size: 12 }, color: '#333' } } },
                scales: {
                    x: { beginAtZero: true },
                    y: { beginAtZero: true, ticks: { stepSize: 10 } },
                },
            },
        });
    }

    disconnectedCallback() {
        if (this.chart) this.chart.destroy();
    }
}