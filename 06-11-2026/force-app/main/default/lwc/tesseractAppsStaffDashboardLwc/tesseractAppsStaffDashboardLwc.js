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
    // renderedCallback() {
    //     if (!this.isChartJsInitialized) {
    //         loadScript(this, ChartJS)
    //             .then(() => {
    //                 this.isChartJsInitialized = true;
    //                 this.fetchShiftData();
    //             })
    //             .catch(error => {
    //                 this.error = 'Error loading Chart.js library';
    //                 console.error('Error loading Chart.js:', error);
    //             });
    //     }
    // }

connectedCallback() {
    console.log(
        '========== STAFF DASHBOARD COMPONENT CREATED =========='
    );
    console.log(
        '[STAFF DASHBOARD] facilityId:',
        this.facilityId
    );
}

renderedCallback() {

    console.log(
        '========== STAFF DASHBOARD RENDERED =========='
    );

    console.log(
        '[STAFF DASHBOARD] isChartJsInitialized:',
        this.isChartJsInitialized
    );

    console.log(
        '[STAFF DASHBOARD] ChartJS resource:',
        ChartJS
    );

    const canvas = this.template.querySelector('canvas.barChart');

    console.log(
        '[STAFF DASHBOARD] Canvas found:',
        !!canvas
    );

    if (this.isChartJsInitialized) {
        console.log(
            '[STAFF DASHBOARD] ChartJS already initialized - EXIT'
        );
        return;
    }

    console.log(
        '[STAFF DASHBOARD] Attempting to load ChartJS...'
    );

    loadScript(this, ChartJS)
        .then(() => {

            console.log(
                '[STAFF DASHBOARD] ✅ ChartJS loaded successfully'
            );

            console.log(
                '[STAFF DASHBOARD] typeof Chart:',
                typeof Chart
            );

            this.isChartJsInitialized = true;

            console.log(
                '[STAFF DASHBOARD] Calling fetchShiftData()...'
            );

            return this.fetchShiftData();
        })
        .catch(error => {

            console.error(
                '[STAFF DASHBOARD] ❌ ChartJS LOAD ERROR'
            );

            console.error(
                '[STAFF DASHBOARD] Full error:',
                error
            );

            console.error(
                '[STAFF DASHBOARD] Error message:',
                error?.message
            );

            console.error(
                '[STAFF DASHBOARD] Error body:',
                error?.body
            );

            console.error(
                '[STAFF DASHBOARD] Error stack:',
                error?.stack
            );

            this.error =
                'Error loading Chart.js library';
        });

    setTimeout(() => {

        if (!this.isChartJsInitialized) {

            console.error(
                '🚨 [STAFF DASHBOARD] ChartJS LOAD TIMEOUT'
            );

            console.error(
                '[STAFF DASHBOARD] Resource URL:',
                ChartJS
            );

            console.error(
                '[STAFF DASHBOARD] This means loadScript() ' +
                'has not completed after 10 seconds.'
            );
        }

    }, 10000);
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

    // Fetch shift data from Apex
    // async fetchShiftData() {
    //     this.isLoading = true;
    //     this.error = null;

    //     try {
    //         const shiftData = await getStaffWeekData();
    //         console.log('Fetched shift data:', JSON.stringify(shiftData));
    //         this.processChartData(shiftData);
    //     } catch (error) {
    //         this.error = 'Error fetching shift data. Please try again.';
    //         console.error('Error fetching shift data:', error);
    //     } finally {
    //         this.isLoading = false;
    //     }
    // }

    async fetchShiftData() {

    this.isLoading = true;
    this.error = null;

    console.log(
        '========== STAFF DASHBOARD FETCH START =========='
    );

    try {

        console.log(
            'Calling Apex: getStaffWeekData()'
        );

        const shiftData = await getStaffWeekData();

        console.log(
            'Apex returned:',
            shiftData
        );

        console.log(
            'Apex returned JSON:',
            JSON.stringify(shiftData)
        );

        console.log(
            'Apex returned record count:',
            Array.isArray(shiftData)
                ? shiftData.length
                : 'NOT ARRAY'
        );

        this.processChartData(shiftData);

    } catch (error) {

        console.error(
            '========== STAFF DASHBOARD APEX ERROR =========='
        );

        console.error(
            'Full error:',
            error
        );

        console.error(
            'Error body:',
            error?.body
        );

        console.error(
            'Error message:',
            error?.body?.message
        );

        console.error(
            'Error stack:',
            error?.stack
        );

        this.error =
            error?.body?.message ||
            error?.message ||
            'Error fetching shift data.';

    } finally {

        this.isLoading = false;

        console.log(
            '========== STAFF DASHBOARD FETCH END =========='
        );
    }
}

    // Process data for the chart
    // processChartData(shiftData) {
    //     const groupedData = {};
    //     const colors = {
    //         'Accepted': 'rgba(75, 192, 192, 0.6)',
    //         'In Progress': 'rgba(255, 159, 64, 0.6)',
    //         'Completed': 'rgba(153, 102, 255, 0.6)',
    //     };

    //     // Group data by day and status
    //     shiftData.forEach(record => {
    //         const day = new Date(record.day).toLocaleDateString('en-US', { weekday: 'long' });
    //         if (!groupedData[day]) {
    //             groupedData[day] = { Accepted: 0, InProgress: 0, Completed: 0, CompletedActual: 0 };
    //         }
    //         groupedData[day][record.status] = record.totalDuration;
    //         if (record.status === 'Completed') {
    //             groupedData[day].CompletedActual = record.actualDuration;
    //         }
    //     });

    //     const labels = Object.keys(groupedData);
    //     const datasets = [
    //         {
    //             label: 'Accepted',
    //             data: labels.map(day => groupedData[day].Accepted || 0),
    //             backgroundColor: colors.Accepted,
    //         },
    //         {
    //             label: 'In Progress',
    //             data: labels.map(day => groupedData[day].InProgress || 0),
    //             backgroundColor: colors.InProgress,
    //         },
    //         {
    //             label: 'Actual Duration',
    //             data: labels.map(day => groupedData[day].Completed || 0),
    //             backgroundColor: colors.Completed,
    //         },
    //         {
    //             label: 'Shift Duration',
    //             data: labels.map(day => groupedData[day].CompletedActual || 0),
    //             backgroundColor: 'rgba(54, 162, 235, 0.6)', // New color for actual duration
    //         },
    //     ];

    //     this.renderChart(labels, datasets);
    // }

    processChartData(shiftData) {

        console.log(
            '========== STAFF DASHBOARD PROCESS START =========='
        );

        console.log(
            'Raw shiftData:',
            JSON.stringify(shiftData)
        );

        // Always use the last 7 days as chart labels.
        // This ensures the chart is displayed even when there are no shifts.
        const labels = [];

        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            labels.push(
                date.toLocaleDateString('en-US', {
                    weekday: 'long'
                })
            );
        }

        console.log(
            'Chart labels:',
            JSON.stringify(labels)
        );

        const groupedData = {};

        // Initialize every day with zero values.
        labels.forEach(day => {
            groupedData[day] = {
                Accepted: 0,
                InProgress: 0,
                Completed: 0,
                CompletedActual: 0
            };
        });

        // If Apex returned data, populate the appropriate days.
        if (Array.isArray(shiftData) && shiftData.length > 0) {

            const statusMap = {
                'Accepted': 'Accepted',
                'InProgress': 'InProgress',
                'In Progress': 'InProgress',
                'Completed': 'Completed'
            };

            shiftData.forEach((record, index) => {

                console.log(
                    `Processing record ${index}:`,
                    JSON.stringify(record)
                );

                if (!record.day) {
                    console.warn(
                        'Skipping record without day:',
                        record
                    );
                    return;
                }

                const date = new Date(record.day);

                if (isNaN(date.getTime())) {
                    console.warn(
                        'Skipping record with invalid date:',
                        record.day
                    );
                    return;
                }

                const day = date.toLocaleDateString('en-US', {
                    weekday: 'long'
                });

                const normalizedStatus =
                    statusMap[record.status];

                console.log(
                    'Day:',
                    day,
                    'Status:',
                    record.status,
                    'Normalized:',
                    normalizedStatus,
                    'Duration:',
                    record.totalDuration,
                    'Actual:',
                    record.actualDuration
                );

                // Ignore data outside the seven displayed days.
                if (!groupedData[day]) {
                    return;
                }

                if (!normalizedStatus) {
                    console.warn(
                        'Unknown shift status:',
                        record.status
                    );
                    return;
                }

                groupedData[day][normalizedStatus] =
                    Number(record.totalDuration) || 0;

                if (normalizedStatus === 'Completed') {
                    groupedData[day].CompletedActual =
                        Number(record.actualDuration) || 0;
                }
            });
        } else {

            console.log(
                'No shift data returned. ' +
                'Rendering empty chart with zero values.'
            );
        }

        console.log(
            'Final grouped data:',
            JSON.stringify(groupedData)
        );

        const datasets = [
            {
                label: 'Accepted',
                data: labels.map(day =>
                    groupedData[day].Accepted
                ),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            },
            {
                label: 'In Progress',
                data: labels.map(day =>
                    groupedData[day].InProgress
                ),
                backgroundColor: 'rgba(255, 159, 64, 0.6)'
            },
            {
                label: 'Actual Duration',
                data: labels.map(day =>
                    groupedData[day].Completed
                ),
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            },
            {
                label: 'Shift Duration',
                data: labels.map(day =>
                    groupedData[day].CompletedActual
                ),
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }
        ];

        console.log(
            'Final chart datasets:',
            JSON.stringify(datasets)
        );

        // IMPORTANT:
        // Clear any previous error so the chart is displayed.
        this.error = null;

        // Always render the chart, even when all values are zero.
        this.renderChart(labels, datasets);

        console.log(
            '========== STAFF DASHBOARD PROCESS END =========='
        );
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
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 10,
                            font: { size: 10 },
                            usePointStyle: true,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { size: 10 }
                        },
                        title: {
                            display: false
                        },
                    },
                },
            },
        });
    }
}