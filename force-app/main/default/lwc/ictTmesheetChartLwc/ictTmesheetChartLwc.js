import { LightningElement, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import userId from '@salesforce/user/Id';
import getShiftData from '@salesforce/apex/ShiftwithStaffController.gettimesheetData';

export default class shiftwithStaffStatusBarChart extends LightningElement {

    @track chart;
    @track isChartJsInitialized = false;
    @track selectedRange = '1w';
    @track rangeOptions = [
        { label: 'This Week', value: '1w' },
        { label: 'Last Week', value: '2w' },
        { label: 'Last 2 Weeks', value: '3w' },
        { label: 'Last 3 Weeks', value: '4w' }
    ];

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
            const shiftData = await getShiftData({ 
                userId: userId, 
                selectedRange: this.selectedRange 
            });
            console.log('Fetched shift data:', JSON.stringify(shiftData));
            this.processChartData(shiftData);
        } catch (error) {
            console.error('Error fetching shift data:', error);
        }
    }


   /* getCurrentWeek() {
        const days = [];
        const today = new Date();
        const currentDay = today.getDay();
        
        // Calculate the date for the Monday of the current week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
        // Loop through 7 days to get Monday to Sunday
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
    
        return days;
    }*/
    
    getWeekDaysForSelectedRange() {
        const today = new Date();
        const currentDay = today.getDay();
        const weeksToGoBack = parseInt(this.selectedRange.replace('w', ''), 10);

        // Calculate start of the current week (Monday)
        const startOfCurrentWeek = new Date(today);
        startOfCurrentWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

        const days = [];

        // Go back (weeksToGoBack - 1) weeks + current week
        for (let w = weeksToGoBack - 1; w >= 0; w--) {
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfCurrentWeek);
                day.setDate(startOfCurrentWeek.getDate() - (w * 7) + i);
                const formatted = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                days.push(formatted);
            }
        }

        return days;
    }


    processChartData(shiftData) {
        const groupedData = {};
        const colors = { 
            Draft: 'rgba(81, 130, 230, 0.6)',
            Submitted: 'rgba(75, 192, 192, 0.6)', 
            Approved: 'rgba(255, 159, 64, 0.6)', 
            Rejected: 'rgba(153, 102, 255, 0.6)' 
        };

        const allDays = this.getWeekDaysForSelectedRange();
        allDays.forEach(day => {
            groupedData[day] = { Draft: 0, Submitted: 0, Approved: 0, Rejected: 0 };
        });

        shiftData.forEach(record => {
            const day = new Date(record.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (groupedData[day]) {
                groupedData[day][record.status] = record.recordCount;
            }
        });

        const labels = allDays;
        const labelMapping = {
            Draft: 'Draft',
            Submitted: 'Submitted',
            Approved: 'Approved',
            Rejected: 'Rejected'
        };

        const datasets = Object.keys(colors).map(status => ({
            label: labelMapping[status] || status,
            data: labels.map(day => groupedData[day][status] || 0),
            backgroundColor: colors[status],
        }));

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

    handleRangeChange(event) {
        this.selectedRange = event.detail.value;
        this.fetchData();
    }


    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}