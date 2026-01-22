import { LightningElement, wire, api } from 'lwc';
import getClientCounts from '@salesforce/apex/StaffStatusController.getClientCounts'; // Updated import
import getRejectedShiftData from '@salesforce/apex/ShiftwithStaffController.getRejectedShiftData';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import currentuserId from '@salesforce/user/Id';
import { loadScript } from 'lightning/platformResourceLoader';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';


export default class StaffStatusChart extends LightningElement {
    chartInitialized = false;
    chart;
    clientCounts = { activeCount: 0, inactiveCount: 0 }; // Updated variable
    
    @wire(MessageContext)
    messageContext;

    @api facilityId;
        
    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method Participant Details>>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;

        if (this.chart) {
            this.chart.destroy(); // Clear the existing chart
            this.chart = null;
        }

        loadScript(this, ChartJS)
            .then(() => this.fetchClientCounts())
            .then(() => this.initializeChart())
            .catch((error) => {
                console.error('Error loading ChartJS or refreshing chart data', error);
            });
    }


    renderedCallback() {
        if (this.chartInitialized) {
            return;
        }
        this.chartInitialized = true;

        // Log to check if userId is correct
        console.log('User ID:', currentuserId); // Debugging log

        loadScript(this, ChartJS)
            .then(() => this.fetchClientCounts()) // Call fetchClientCounts instead of fetchStaffCounts
            .then(() => this.initializeChart())
            .catch((error) => {
                console.error('Error loading ChartJS or fetching data', error);
            });
    }



    async fetchClientCounts() {
        try {
            const data = await getRejectedShiftData({ facilityId: this.facilityId });
            console.log('Chart Data:', JSON.stringify(data));

            // Example mapping
            this.clientCounts.activeCount = data.Total;
            this.clientCounts.inactiveCount = data.Rejected;
        } catch (error) {
            console.error('Apex error:', error);
        }
    }


    initializeChart() {
    const ctx = this.template.querySelector('canvas').getContext('2d');

    // Create gradient for each bar
    const gradient1 = ctx.createLinearGradient(0, 0, 400, 0); // Horizontal gradient
    gradient1.addColorStop(0, '#2ecc71');
    gradient1.addColorStop(1, '#2ecc71');

    const gradient2 = ctx.createLinearGradient(0, 0, 400, 0); // Horizontal gradient
    gradient2.addColorStop(0, '#e74c3c');
    gradient2.addColorStop(1, '#e74c3c');

    this.chart = new Chart(ctx, {
        type: 'bar',  // Bar chart for vertical bars
        data: {
            labels: ['Total Shifts', 'Rejected Shifts'], // Updated labels for Active and Inactive clients
            datasets: [
                {
                    label: '',
                    data: [
                        this.clientCounts.activeCount, // Use active count
                        this.clientCounts.inactiveCount, // Use inactive count
                    ],
                    backgroundColor: [gradient1, gradient2], // Gradient colors
                    borderWidth: 1,
                    barThickness: 3, // Decreased bar thickness
                    maxBarThickness: 3, // Optional, ensures bars don't grow too large
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
                yAxes: [{
            ticks: {
                beginAtZero: true
            }
        }],

                x: {
                    barPercentage: 0.5, // Adjust spacing
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

    handleRedirectClick(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name || 'Rejected Shifts';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }
}