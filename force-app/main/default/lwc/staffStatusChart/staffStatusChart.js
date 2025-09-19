import { LightningElement } from 'lwc';
import getStaffCounts from '@salesforce/apex/StaffStatusController.getStaffCounts';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import currentuserId from '@salesforce/user/Id';
import { loadScript } from 'lightning/platformResourceLoader';

export default class StaffStatusChart extends LightningElement {

chartInitialized = false;
chart;
staffCounts = { activeCount: 0, vacationCount: 0, inactiveCount: 0, visaExpiryCount: 0 };

renderedCallback() {
    if (this.chartInitialized) {
        return;
    }
    this.chartInitialized = true;

    // Log to check if userId is correct
    console.log('User ID:', currentuserId); // Debugging log

    loadScript(this, ChartJS)
        .then(() => this.fetchStaffCounts())
        .then(() => this.initializeChart())
        .catch((error) => {
            console.error('Error loading ChartJS or fetching data', error);
        });
}

fetchStaffCounts() {
    console.log('Fetching staff counts for user ID:', currentuserId); // Log userId before calling Apex method

    return getStaffCounts({ userId: currentuserId }) // Pass the current userId to Apex
        .then((data) => {
            this.staffCounts = data;
        })
        .catch((error) => {
            console.error('Error fetching staff counts', error);
        });
}

initializeChart() {
    const ctx = this.template.querySelector('canvas').getContext('2d');

    // Create gradient for each bar
    const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
    gradient1.addColorStop(0, '#6495ED');
    gradient1.addColorStop(1, '#4169E1');

    const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
    gradient2.addColorStop(0, '#FFD700');
    gradient2.addColorStop(1, '#FFA500');

    const gradient3 = ctx.createLinearGradient(0, 0, 0, 400);
    gradient3.addColorStop(0, '#FF4500');
    gradient3.addColorStop(1, '#FF6347');

    const gradient4 = ctx.createLinearGradient(0, 0, 0, 400);
    gradient4.addColorStop(0, '#FF0000');
    gradient4.addColorStop(1, '#228B22');

    this.chart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: ['Active', 'On Leave', 'Inactive', 'Docs Expiry'],
            datasets: [
                {
                    label: 'Staff',
                    data: [
                        this.staffCounts.activeCount,
                        this.staffCounts.vacationCount,
                        this.staffCounts.inactiveCount,
                        this.staffCounts.visaExpiryCount,
                    ],
                    backgroundColor: [gradient1, gradient2, gradient3, gradient4],
                    borderWidth: 1,
                    barThickness: 5, // Decreased bar thickness
                    maxBarThickness: 5, // Optional, ensures bars don't grow too large
                    borderRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            legend: {
                display: false, // Hides the legend
            },
            scales: {
                xAxes: [
                    {
                        ticks: {
                            beginAtZero: true,
                        },
                    },
                ],
                yAxes: [
                    {
                        barPercentage: 0.5, // Adjusts the space between bars (smaller value = more space)
                    },
                ],
            },
        },
        
    });
}

disconnectedCallback() {
    if (this.chart) {
        this.chart.destroy();
    }
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
}