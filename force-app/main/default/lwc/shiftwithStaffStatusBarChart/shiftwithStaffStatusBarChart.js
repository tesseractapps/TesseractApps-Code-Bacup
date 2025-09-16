import { LightningElement,wire, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import userId from '@salesforce/user/Id';
import getShiftData from '@salesforce/apex/ShiftwithStaffController.getShiftData';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';


export default class shiftwithStaffStatusBarChart extends LightningElement {

    @track chart;
    @track isChartJsInitialized = false;
    @api facilityId;

    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method >>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;
        console.log('facilityId in Refresh Method facilityId >>', this.facilityId);
        this.fetchData();
    }


    connectedCallback() {
        console.log('Roster Manager facilityId :', this.facilityId);
        const today = new Date();
        this.weekNumber = this.getWeekNumber(today);
        this.currentStartDate = this.getStartOfWeek(today);
    }

    @wire(MessageContext)
    messageContext;
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
        const startDate = new Date(this.currentStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        try {
            const shiftData = await getShiftData({
                userId: this.userId,
                facilityId: this.facilityId,
                startDate: startDate.toISOString().split('T')[0], // pass as yyyy-mm-dd
                endDate: endDate.toISOString().split('T')[0],
            });
            console.log('shiftData >>', JSON.stringify(shiftData));
            this.processChartData(shiftData);
        } catch (error) {
            console.error('Error fetching shift data:', error);
        }
    }


    getLast7Days() {
        const days = [];
        const start = new Date(this.currentStartDate);

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        return days;
    }

    grandchildevent(event){
        event.preventDefault();
        const message = event.currentTarget.dataset.name;
        console.log(message);

        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: message },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    }

    processChartData(shiftData) {
        const groupedData = {};
        const colors = { 
            Accepted: 'rgba(75, 192, 192, 0.6)', 
            Completed: 'rgba(153, 102, 255, 0.6)', 
            InProgress: 'rgba(255, 159, 64, 0.6)',
            Unassigned: 'rgba(255, 99, 132, 0.6)',
        };
        const last7Days = this.getLast7Days();

        last7Days.forEach(day => {
            groupedData[day] = { Accepted: 0,  Completed: 0, InProgress: 0 };
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
            Completed: 'Completed',
            InProgress: 'In Progress',
            Unassigned: 'Unassigned'
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

    handlePreviousWeek() {
        const newDate = new Date(this.currentStartDate);
        newDate.setDate(this.currentStartDate.getDate() - 7);
        this.currentStartDate = newDate;
        this.fetchData();
    }

    handleNextWeek() {
        const newDate = new Date(this.currentStartDate);
        newDate.setDate(this.currentStartDate.getDate() + 7);
        this.currentStartDate = newDate;
        this.fetchData();
    }

    handleResetToCurrentWeek() {
        const today = new Date();
        const currentWeekNumber = this.getWeekNumber(today);
        this.weekNumber = currentWeekNumber;
        this.currentStartDate = this.getStartOfWeek(today);
        this.fetchData();
    }

    getWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - startOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    }

    getStartOfWeek(date) {
        const day = date.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Make Monday start
        return new Date(date.setDate(diff));
    }
    

    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    handleRedirectClick(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name || 'Roster Manager';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }
}