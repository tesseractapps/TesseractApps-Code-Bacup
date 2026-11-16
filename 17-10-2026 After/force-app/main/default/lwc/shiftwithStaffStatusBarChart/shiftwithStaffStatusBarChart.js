import { LightningElement, wire, track, api } from 'lwc';
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
    @track selectedTimePeriod = 'Weekly';
    userId = userId;

    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method >>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;
        this.fetchData();
    }

    connectedCallback() {
        console.log('Roster Manager facilityId :', this.facilityId);
        const today = new Date();
        this.weekNumber = this.getWeekNumber(today);
        this.currentStartDate = this.getStartOfWeek(today);
    }

    get timePeriodOptions() {
        return [
            { label: 'Weekly', value: 'Weekly' },
            { label: 'Fortnightly', value: 'Fortnightly' },
            { label: 'Monthly', value: 'Monthly' }
        ];
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

        // ✅ Calculate based on selected period
        switch (this.selectedTimePeriod) {
            case 'Weekly':
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'Fortnightly':
                endDate.setDate(startDate.getDate() + 13);
                break;
            case 'Monthly':
                endDate.setMonth(startDate.getMonth() + 1);
                endDate.setDate(endDate.getDate() - 1);
                break;
        }

        try {
            const shiftData = await getShiftData({
                userId: this.userId,
                facilityId: this.facilityId,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            });
            console.log(
                `📅 Fetching data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
            );
            console.log('shiftData >>', JSON.stringify(shiftData));
            this.processChartData(shiftData);
        } catch (error) {
            console.error('Error fetching shift data:', error);
        }
    }

    // ✅ Dynamic days generator (weekly / fortnightly / monthly)
    getDaysForSelectedPeriod() {
        const days = [];
        const start = new Date(this.currentStartDate);

        switch (this.selectedTimePeriod) {
            case 'Weekly':
                for (let i = 0; i < 7; i++) {
                    const day = new Date(start);
                    day.setDate(start.getDate() + i);
                    days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                break;

            case 'Fortnightly':
                for (let i = 0; i < 14; i++) {
                    const day = new Date(start);
                    day.setDate(start.getDate() + i);
                    days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                break;

            case 'Monthly':
                const month = start.getMonth();
                const year = start.getFullYear();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                for (let i = 0; i < daysInMonth; i++) {
                    const day = new Date(year, month, i + 1);
                    days.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                break;
        }

        return days;
    }

    grandchildevent(event) {
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

        const days = this.getDaysForSelectedPeriod();

        // initialize with zero counts
        days.forEach(day => {
            groupedData[day] = { Accepted: 0, Completed: 0, InProgress: 0, Unassigned: 0 };
        });

        shiftData.forEach(record => {
            const day = new Date(record.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (groupedData[day]) {
                groupedData[day][record.status] = record.recordCount;
            }
        });

        const labels = days;
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
            data: { labels, datasets },
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
                                return chart.data.datasets.map((dataset) => ({
                                    text: labelMapping[dataset.label] || dataset.label,
                                    fillStyle: dataset.backgroundColor,
                                    strokeStyle: dataset.backgroundColor,
                                    lineWidth: 1,
                                    hidden: dataset.hidden,
                                    datasetIndex: chart.data.datasets.indexOf(dataset)
                                }));
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

    handlePreviousPeriod() {
        const newDate = new Date(this.currentStartDate);

        switch (this.selectedTimePeriod) {
            case 'Weekly':
                newDate.setDate(this.currentStartDate.getDate() - 7);
                break;
            case 'Fortnightly':
                newDate.setDate(this.currentStartDate.getDate() - 14);
                break;
            case 'Monthly':
                newDate.setMonth(this.currentStartDate.getMonth() - 1);
                break;
        }

        this.currentStartDate = newDate;
        this.fetchData();
    }

    handleNextPeriod() {
        const newDate = new Date(this.currentStartDate);

        switch (this.selectedTimePeriod) {
            case 'Weekly':
                newDate.setDate(this.currentStartDate.getDate() + 7);
                break;
            case 'Fortnightly':
                newDate.setDate(this.currentStartDate.getDate() + 14);
                break;
            case 'Monthly':
                newDate.setMonth(this.currentStartDate.getMonth() + 1);
                break;
        }

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

    handleTimePeriodChange(event) {
        this.selectedTimePeriod = event.target.value;
        const today = new Date();
        this.currentStartDate = this.getStartOfPeriod(today, this.selectedTimePeriod);
        this.fetchData();
    }

    getStartOfPeriod(date, timePeriod) {
        const startDate = new Date(date);

        switch (timePeriod) {
            case 'Weekly':
                return this.getStartOfWeek(startDate);
            case 'Fortnightly':
                const weekStart = this.getStartOfWeek(startDate);
                const weekNumber = this.getWeekNumber(startDate);
                const isEvenWeek = weekNumber % 2 === 0;
                if (!isEvenWeek) {
                    weekStart.setDate(weekStart.getDate() - 7);
                }
                return weekStart;
            case 'Monthly':
                return new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            default:
                return this.getStartOfWeek(startDate);
        }
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