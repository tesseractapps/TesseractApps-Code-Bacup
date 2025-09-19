import { LightningElement, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import userId from '@salesforce/user/Id';
import getShiftData from '@salesforce/apex/ShiftwithStaffController.getShiftData';

export default class shiftwithStaffStatusBarChart extends LightningElement {

    @track chart;
    @track isChartJsInitialized = false;

    renderedCallback() {
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    console.log('Chart.js loaded successfully');
                    this.isChartJsInitialized = true;
                    this.fetchData();
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    async fetchData() {
        try {
            const shiftData = await getShiftData({ userId });
            console.log('Fetched shift data:', JSON.stringify(shiftData));
            this.processChartData(shiftData);
        } catch (error) {
            console.error('Error fetching shift data:', error);
        }
    }

    getLast7Days() {
        const days = [];
        const today = new Date();

        for (let i = -3; i <= 3; i++) {
            const day = new Date();
            day.setDate(today.getDate() + i);
            days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        return days;
    }

    processChartData(shiftData) {
        const groupedData = {};
        const colors = { 
            Accepted: 'rgba(75, 192, 192, 0.6)', 
            InProgress: 'rgba(255, 159, 64, 0.6)', 
            Completed: 'rgba(153, 102, 255, 0.6)' 
        };
        const last7Days = this.getLast7Days();

        last7Days.forEach(day => {
            groupedData[day] = { Accepted: 0, InProgress: 0, Completed: 0 };
        });

        shiftData.forEach(record => {
            const day = new Date(record.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (groupedData[day]) {
                groupedData[day][record.status] = record.recordCount;
            }
        });

        const labels = last7Days;
        const labelMapping = {
            Accepted: 'Accepted',
            InProgress: 'In Progress',
            Completed: 'Completed'
        };

        const datasets = Object.keys(colors).map(status => ({
            label: labelMapping[status] || status,
            data: labels.map(day => groupedData[day][status] || 0),
            backgroundColor: colors[status],
        }));

        console.log("Chart Labels:", labels);
        console.log("Chart Datasets:", datasets);

        this.initializeChart(labels, datasets, labelMapping);
    }

    initializeChart(labels, datasets, labelMapping) {
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

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(context, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12 },
                            color: '#333',
                            generateLabels: (chart) => {
                                console.log("🔍 Generating legend labels...");
                                return chart.data.datasets.map((dataset) => {
                                    console.log(`🔹 Dataset Label: ${dataset.label}`);
                                    return {
                                        text: labelMapping[dataset.label] || dataset.label,  // ✅ Directly using labelMapping
                                        fillStyle: dataset.backgroundColor,
                                        strokeStyle: dataset.backgroundColor,
                                        lineWidth: 1,
                                        hidden: dataset.hidden,
                                        datasetIndex: chart.data.datasets.indexOf(dataset)
                                    };
                                });
                            }
                        },
                    },
                },
                scales: {
                    x: { beginAtZero: true },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 10 },
                        min: 0,
                        max: Math.max(...datasets.flatMap(dataset => dataset.data)) + 10,
                    },
                },
            },
        });
    }

    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}