import { LightningElement, wire } from 'lwc';
import getClientCounts from '@salesforce/apex/StaffStatusController.getClientCounts'; // Updated import
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



    fetchClientCounts() {
        console.log('Fetching client counts for user ID:', currentuserId); // Log userId before calling Apex method

        return getClientCounts({ userId: currentuserId }) // Updated to fetch client counts
            .then((data) => {
                this.clientCounts = data;
                console.log('this.clientCounts===>'+this.clientCounts);
                console.log('this.clientCounts===>'+this.clientCounts.activeCount);
                console.log('this.clientCounts===>'+this.clientCounts.inactiveCount);
            })
            .catch((error) => {
                console.error('Error fetching client counts', error);
            });
    }

    initializeChart() {
    const ctx = this.template.querySelector('canvas').getContext('2d');

    // Create gradient for each bar
    const gradient1 = ctx.createLinearGradient(0, 0, 400, 0); // Horizontal gradient
    gradient1.addColorStop(0, '#6495ED');
    gradient1.addColorStop(1, '#4169E1');

    const gradient2 = ctx.createLinearGradient(0, 0, 400, 0); // Horizontal gradient
    gradient2.addColorStop(0, '#FFD700');
    gradient2.addColorStop(1, '#FFA500');

    this.chart = new Chart(ctx, {
        type: 'bar',  // Bar chart for vertical bars
        data: {
            labels: ['Active', 'Inactive'], // Updated labels for Active and Inactive clients
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
        const message = event.currentTarget.dataset.name || 'Participants';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }
}