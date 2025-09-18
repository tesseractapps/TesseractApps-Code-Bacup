import { LightningElement, track } from 'lwc';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import { loadScript } from 'lightning/platformResourceLoader';
import getStaffWeekData from '@salesforce/apex/ShiftwithStaffController.getStaffWeekData';

export default class StaffShiftChartWithActualDuration extends LightningElement {
    @track isLoading = false;
    @track error = null;
    chart;
    isChartJsInitialized = false;

    // Lifecycle hook to load Chart.js library
    renderedCallback() {
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    this.fetchShiftData();
                })
                .catch(error => {
                    this.error = 'Error loading Chart.js library';
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    // Fetch shift data from Apex
    async fetchShiftData() {
        this.isLoading = true;
        this.error = null;

        try {
            const shiftData = await getStaffWeekData();
            console.log('Fetched shift data:', JSON.stringify(shiftData));
            this.processChartData(shiftData);
        } catch (error) {
            this.error = 'Error fetching shift data. Please try again.';
            console.error('Error fetching shift data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // Process data for the chart
    processChartData(shiftData) {
        const groupedData = {};
        const colors = {
            'Accepted': 'rgba(75, 192, 192, 0.6)',
            'In Progress': 'rgba(255, 159, 64, 0.6)',
            'Completed': 'rgba(153, 102, 255, 0.6)',
        };

        // Group data by day and status
        shiftData.forEach(record => {
            const day = new Date(record.day).toLocaleDateString('en-US', { weekday: 'long' });
            if (!groupedData[day]) {
                groupedData[day] = { Accepted: 0, InProgress: 0, Completed: 0, CompletedActual: 0 };
            }
            groupedData[day][record.status] = record.totalDuration;
            if (record.status === 'Completed') {
                groupedData[day].CompletedActual = record.actualDuration;
            }
        });

        const labels = Object.keys(groupedData);
        const datasets = [
            {
                label: 'Accepted',
                data: labels.map(day => groupedData[day].Accepted || 0),
                backgroundColor: colors.Accepted,
            },
            {
                label: 'In Progress',
                data: labels.map(day => groupedData[day].InProgress || 0),
                backgroundColor: colors.InProgress,
            },
            {
                label: 'Actual Duration',
                data: labels.map(day => groupedData[day].Completed || 0),
                backgroundColor: colors.Completed,
            },
            {
                label: 'Shift Duration',
                data: labels.map(day => groupedData[day].CompletedActual || 0),
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // New color for actual duration
            },
        ];

        this.renderChart(labels, datasets);
    }

    // Render the bar chart
    renderChart(labels, datasets) {
        const ctx = this.template.querySelector('canvas.barChart');
        if (!ctx) {
            console.error('Canvas element not found');
            return;
        }

        const context = ctx.getContext('2d');
        if (!context) {
            console.error('Unable to get 2D context for canvas');
            return;
        }

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Create new chart
        this.chart = new Chart(context, {
            type: 'bar',
            data: {
                labels: labels, // Days of the week
                datasets: datasets, // Shift statuses with durations
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1, // Adjust based on expected duration scale
                        },
                        title: {
                            display: true,
                            text: 'Total Hours (hours)',
                        },
                    },
                },
            },
        });
    }
}