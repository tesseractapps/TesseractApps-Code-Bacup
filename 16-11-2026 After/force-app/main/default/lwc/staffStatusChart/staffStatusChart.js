// import { LightningElement, wire, api, track } from 'lwc';
// import getStaffCounts from '@salesforce/apex/StaffStatusController.getStaffCounts';
// import ChartJS from '@salesforce/resourceUrl/chratJs';
// import currentuserId from '@salesforce/user/Id';
// import { loadScript } from 'lightning/platformResourceLoader';
// import { publish, MessageContext } from 'lightning/messageService';
// import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

// export default class StaffStatusChart extends LightningElement {


// chartInitialized = false;
// chart;
// staffCounts = { activeCount: 0, vacationCount: 0, inactiveCount: 0, visaExpiryCount: 0 };

// @api facilityId;

// @api refresh1(facilityIdFromParent) {
//     console.log('facilityId in Refresh Method StaffStatusChart>>', facilityIdFromParent);
//     this.facilityId = facilityIdFromParent;
//     console.log('facilityId in Refresh Method StaffStatusChart >>', this.facilityId);
//     loadScript(this, ChartJS)
//         .then(() => this.fetchStaffCounts())
//         .then(() => this.initializeChart())
//         .catch((error) => {
//             console.error('Error loading ChartJS or fetching data', error);
//         });
// }

// @track staffPreferredName;

// @wire(MessageContext)
//     messageContext;

// renderedCallback() {
//     if (this.chartInitialized) {
//         return;
//     }
//     this.chartInitialized = true;

//     // Log to check if userId is correct
//     console.log('User ID:', currentuserId); // Debugging log

//     loadScript(this, ChartJS)
//         .then(() => this.fetchStaffCounts())
//         .then(() => this.initializeChart())
//         .catch((error) => {
//             console.error('Error loading ChartJS or fetching data', error);
//         });
// }

// fetchStaffCounts() {
//     console.log('Fetching staff counts for user ID:', this.currentuserId);
//     console.log('Fetching staff counts for facility ID:', this.facilityId);

//     return getStaffCounts({ 
//             userId: this.currentuserId, 
//             facilityId: this.facilityId 
//         })
//         .then((data) => {
//             console.log('StaffStatusChart data >>', data);
//             this.staffCounts = data;
//         })
//         .catch((error) => {
//             console.error('Error fetching staff counts', error);
//         });
// }

// initializeChart() {
//     const ctx = this.template.querySelector('canvas').getContext('2d');

//     // Create gradient for each bar
//     const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
//     gradient1.addColorStop(0, '#6495ED');
//     gradient1.addColorStop(1, '#4169E1');

//     const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
//     gradient2.addColorStop(0, '#FFD700');
//     gradient2.addColorStop(1, '#FFA500');

//     const gradient3 = ctx.createLinearGradient(0, 0, 0, 400);
//     gradient3.addColorStop(0, '#FF4500');
//     gradient3.addColorStop(1, '#FF6347');

//     const gradient4 = ctx.createLinearGradient(0, 0, 0, 400);
//     gradient4.addColorStop(0, '#FF0000');
//     gradient4.addColorStop(1, '#228B22');

//     this.chart = new Chart(ctx, {
//         type: 'horizontalBar',
//         data: {
//             labels: ['Active', 'On Leave', 'Inactive', 'Docs Expiry'],
//             datasets: [
//                 {
//                     label: 'Staff',
//                     data: [
//                         this.staffCounts.activeCount,
//                         this.staffCounts.vacationCount,
//                         this.staffCounts.inactiveCount,
//                         this.staffCounts.visaExpiryCount,
//                     ],
//                     backgroundColor: [gradient1, gradient2, gradient3, gradient4],
//                     borderWidth: 1,
//                     barThickness: 5, // Decreased bar thickness
//                     maxBarThickness: 5, // Optional, ensures bars don't grow too large
//                     borderRadius: 6,
//                 },
//             ],
//         },
//         options: {
//             responsive: true,
//             legend: {
//                 display: false, // Hides the legend
//             },
//             scales: {
//                 xAxes: [
//                     {
//                         ticks: {
//                             beginAtZero: true,
//                         },
//                     },
//                 ],
//                 yAxes: [
//                     {
//                         barPercentage: 0.5, // Adjusts the space between bars (smaller value = more space)
//                     },
//                 ],
//             },
//         },
        
//     });
// }

// connectedCallback() {
//     this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
//     this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
//     this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
// }

// disconnectedCallback() {
//     if (this.chart) {
//         this.chart.destroy();
//     }
// }

// grandchildevent(event){
//     event.preventDefault();
//     const message = event.currentTarget.dataset.name;
//     console.log(message);

//     const customEvent = new CustomEvent('grandchildevent', {
//         detail: { message: message },
//         bubbles: true,
//         composed: true
//     });
//     this.dispatchEvent(customEvent);
// }

// handleRedirectClick(event) {
//         event.preventDefault();
//         const message = event.currentTarget.dataset.name || 'Staff';

//         publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
//             target: message
//         });
//     }
// }

import { LightningElement, wire, api, track } from 'lwc';
import getStaffCounts from '@salesforce/apex/StaffStatusController.getStaffCounts';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import currentuserId from '@salesforce/user/Id';
import { loadScript } from 'lightning/platformResourceLoader';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

export default class StaffStatusChart extends LightningElement {
    chartInitialized = false;
    chart;
    staffCounts = { activeCount: 0, vacationCount: 0, inactiveCount: 0, visaExpiryCount: 0 };
    @track staffPreferredName;
    @api facilityId;

    @wire(MessageContext)
    messageContext;

    // Refresh method from parent component
    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method StaffStatusChart >>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;

        loadScript(this, ChartJS)
            .then(() => this.fetchStaffCounts())
            .then(() => this.initializeChart())
            .catch((error) => {
                console.error('Error loading ChartJS or fetching data', error);
            });
    }

    @track showStaffModal = false;
    @track selectedStatusLabel = '';
    @track selectedStaffList = [];

    // statusKeyMap = {
    //     'Active': 'active',
    //     'On Leave': 'vacation',
    //     'Inactive': 'inactive',
    //     'Docs Expiry': 'visaExpiry'
    // };

    renderedCallback() {
        if (this.chartInitialized) {
            return;
        }
        this.chartInitialized = true;

        console.log('User ID:', currentuserId);

        loadScript(this, ChartJS)
            .then(() => this.fetchStaffCounts())
            .then(() => this.initializeChart())
            .catch((error) => {
                console.error('Error loading ChartJS or fetching data', error);
            });
    }

    // Converted: Imperative Apex call
    fetchStaffCounts() {
        console.log('Fetching staff counts for user ID:', currentuserId);
        console.log('Fetching staff counts for facility ID:', this.facilityId);

        return getStaffCounts({
            userId: currentuserId,
            facilityId: this.facilityId
        })
        .then((data) => {
            console.log('StaffStatusChart data >>', data);
            this.staffCounts = data;
        })
        .catch((error) => {
            console.error('Error fetching staff counts', error);
        });
    }

    // Chart rendering
    // initializeChart() {
    //     const canvas = this.template.querySelector('canvas');
    //     if (!canvas) {
    //         console.error('Canvas element not found!');
    //         return;
    //     }

    //     const ctx = canvas.getContext('2d');

    //     const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
    //     gradient1.addColorStop(0, '#6495ED');
    //     gradient1.addColorStop(1, '#4169E1');

    //     const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
    //     gradient2.addColorStop(0, '#FFD700');
    //     gradient2.addColorStop(1, '#FFA500');

    //     const gradient3 = ctx.createLinearGradient(0, 0, 0, 400);
    //     gradient3.addColorStop(0, '#FF4500');
    //     gradient3.addColorStop(1, '#FF6347');

    //     const gradient4 = ctx.createLinearGradient(0, 0, 0, 400);
    //     gradient4.addColorStop(0, '#FF0000');
    //     gradient4.addColorStop(1, '#228B22');

    //     this.chart = new Chart(ctx, {
    //         type: 'horizontalBar',
    //         data: {
    //             labels: ['Active', 'On Leave', 'Inactive', 'Docs Expiry'],
    //             datasets: [{
    //                 label: 'Staff',
    //                 data: [
    //                     this.staffCounts.activeCount,
    //                     this.staffCounts.vacationCount,
    //                     this.staffCounts.inactiveCount,
    //                     this.staffCounts.visaExpiryCount,
    //                 ],
    //                 backgroundColor: [gradient1, gradient2, gradient3, gradient4],
    //                 borderWidth: 1,
    //                 barThickness: 5,
    //                 maxBarThickness: 5,
    //                 borderRadius: 6,
    //             }]
    //         },
    //         options: {
    //             responsive: true,
    //             legend: { display: false },
    //             scales: {
    //                 xAxes: [{
    //                     ticks: {
    //                         beginAtZero: true,
    //                     }
    //                 }],
    //                 yAxes: [{
    //                     barPercentage: 0.5,
    //                 }]
    //             }
    //         }
    //     });
    // }

    initializeChart() {
        const canvas = this.template.querySelector('canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        // Destroy existing chart before creating a new one
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Create gradients
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
                            this.staffCounts.visaExpiryCount
                        ],
                        backgroundColor: [
                            gradient1,
                            gradient2,
                            gradient3,
                            gradient4
                        ],
                        borderWidth: 1,
                        barThickness: 5,
                        maxBarThickness: 5,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,

                legend: {
                    display: false
                },

                tooltips: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const label = this.chart.data.labels[tooltipItem.index];
                            const count = tooltipItem.xLabel;
                            return `${label}: ${count} staff`;
                        }
                    }
                },

                scales: {
                    xAxes: [
                        {
                            ticks: {
                                beginAtZero: true
                            }
                        }
                    ],
                    yAxes: [
                        {
                            barPercentage: 0.5
                        }
                    ]
                },

                onClick: (event) => {
                    this.handleBarClick(event);
                }
            }
        });
    }

    connectedCallback() {
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
    }

    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
        }
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

    handleRedirectClick(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name || 'Staff';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }

    // handleBarClick(evt) {
    //     const points = this.chart.getElementAtEvent(evt);
    //     if (!points.length) return;

    //     const index = points[0]._index;
    //     const label = this.chart.data.labels[index]; // 'Docs Expiry' etc
    //     const statusKey = this.statusKeyMap[label];

    //     getStaffDetailsByStatus({ status: statusKey, facilityId: this.facilityId })
    //         .then((data) => {
    //             this.selectedStatusLabel = label;
    //             this.selectedStaffList = data; // expect [{Name, ...}]
    //             this.showStaffModal = true;
    //         })
    //         .catch((error) => {
    //             console.error('Error fetching staff details', error);
    //         });
    // }
    
    handleBarClick(evt){
        const points = this.chart.getElementAtEvent(evt);
        if (!points.length) return;

        const index = points[0]._index;
        const label = this.chart.data.labels[index]; // 'Docs Expiry' etc

        const statusKeyMap = {
            'Active': 'active',
            'On Leave': 'vacation',
            'Inactive': 'inactive',
            'Docs Expiry': 'visaExpiry'
        };

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: 'StaffStatusDetail',
            data: {
                statusLabel: label,
                statusKey: statusKeyMap[label],
                facilityId: this.facilityId
            }
        });
    }

    closeStaffModal() {
        this.showStaffModal = false;
    }
}