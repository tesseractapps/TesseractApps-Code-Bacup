// import { LightningElement, track,wire, api } from 'lwc';
// import Id from '@salesforce/user/Id';
// import { loadScript } from 'lightning/platformResourceLoader';
// import ChartJS from '@salesforce/resourceUrl/chratJs';
// import getPerformanceManagmentStatusData from '@salesforce/apex/PerformanceManagmentChartController.getPerformanceManagmentStatusData';
// import getstaffId from '@salesforce/apex/UserAccessController.getstaffId1';
// import { publish, MessageContext } from 'lightning/messageService';
// import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

// export default class PerformanceManagementChart extends LightningElement {
//     @track userId = Id; // Correctly assign the current user Id
//     @track taskData = { needReviewerAcceptance: 0, completed: 0 };
//     isChartJsInitialized = false;
//     chartInstance;

//     @api facilityId;
//     @api refresh1(facilityIdFromParent) {
//         console.log('facilityId in Refresh Method ParticipantsFundsChartLwc>>', facilityIdFromParent);
//         this.facilityId = facilityIdFromParent;
//         console.log('facilityId in Refresh Method ParticipantsFundsChartLwc >>', this.facilityId);
//         this.fetchTaskData();
//     }

//     staffName;
//     userType;
//     isNdisOrgVisible = false;
//     isNdisStaff = false;
//     isNdisPayrollAdmin = false;
//     isNdisHrAdmin = false;
//     isIctAdmin = false;
//     isIctStaff = false;
//     IsNdisParticipant = false;
//     userId = Id;


//     // Wire method to fetch Staff details
//         @wire(MessageContext)
//         messageContext;
//         @wire(getstaffId, { userId: '$userId' })
//         wiredUserAccessDetails({ error, data }) {
//             console.log('Wire method executed'); // Ensure the wire is called
        
//             if (data) {
//                 console.log('Staff Data:', JSON.stringify(data)); // Log full response
//                 this.staffName = data.Name;  
//                 this.userType = data.User_Type__c;
    
//                  // Set visibility based on user type
//             this.isNdisOrgVisible = this.userType === 'NDIS Org Admin' || this.userType === 'Roster Manager' || this.userType === 'Facility Admin';
//             this.isNdisStaff = this.userType === 'NDIS Staff';
//             this.isNdisPayrollAdmin = this.userType === 'Payroll Admin';
//             this.isNdisHrAdmin = this.userType === 'HR Admin';
//             this.isIctAdmin = this.userType === 'ICT Admin';
//             this.isIctStaff = this.userType === 'ICT Staff';
//             this.IsNdisParticipant = this.userType === 'NDIS Participants';
//                 console.log('true==>'+this.isNdisOrgVisible);
//             } else if (error) {
//                 console.error('Error fetching staff data:', error);
//             }
//         }

//     connectedCallback() {
//         if (!this.isChartJsInitialized) {
//             loadScript(this, ChartJS)
//                 .then(() => {
//                     this.isChartJsInitialized = true;
//                     this.fetchTaskData();
//                 })
//                 .catch(error => {
//                     console.error('Error loading Chart.js:', error);
//                 });
//         }
//     }

//     fetchTaskData() {
//         getPerformanceManagmentStatusData({ userId: this.userId, facilityId: this.facilityId  })
//             .then((data) => {
//                 console.log('Apex Data:', JSON.stringify(data));
//                 this.taskData = data;
//                 this.renderChart();
//             })
//             .catch((error) => {
//                 console.error('Error fetching task data:', error);
//             });
//     }

//     renderChart() {
//         const canvas = this.template.querySelector('[data-id="pieChart"]');
//         if (!canvas) {
//             console.error('Canvas element not found');
//             return;
//         }
    
//         const ctx = canvas.getContext('2d');
    
//         // Destroy existing chart if it exists
//         if (this.chartInstance) {
//             this.chartInstance.destroy();
//         }
    
//         // Create new chart with smaller size
//         this.chartInstance = new Chart(ctx, {
//             type: 'pie',
//             data: {
//                 labels: ['Reviewer Approval', 'Completed'],
//                 datasets: [
//                     {
//                         data: [this.taskData.needReviewerAcceptance, this.taskData.completed],
//                         backgroundColor: ['#1167b1', '#36A2EB'],
//                     },
//                 ],
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false, // Ensures the chart fits inside container
//                 plugins: {
//                     legend: {
//                         position: 'left',
//                     },
//                 },
//                 layout: {
//                     padding: 5, // Adds slight padding inside the chart
//                 }
//             }
//         });
//     }

//     grandchildevent(event){
//         event.preventDefault();
//         const message = event.currentTarget.dataset.name;
//         console.log(message);

//         const customEvent = new CustomEvent('grandchildevent', {
//             detail: { message: message },
//             bubbles: true,
//             composed: true
//         });
//         this.dispatchEvent(customEvent);
//     }
//     handleRedirectClick(event) {
//         event.preventDefault();
//         const message = event.currentTarget.dataset.name || 'Performance Management';

//         publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
//             target: message
//         });
//     }
    
// }


import { LightningElement, track, api,wire } from 'lwc';
import Id from '@salesforce/user/Id';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import getPerformanceManagmentStatusData from '@salesforce/apex/PerformanceManagmentChartController.getPerformanceManagmentStatusData';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId1';
import { publish, MessageContext } from 'lightning/messageService';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

export default class PerformanceManagementChart extends LightningElement {
    @track userId = Id;
    @track taskData = { needReviewerAcceptance: 0, completed: 0 };
    isChartJsInitialized = false;
    chartInstance;

    @api facilityId;

    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method ParticipantsFundsChartLwc>>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;
        console.log('facilityId in Refresh Method ParticipantsFundsChartLwc >>', this.facilityId);
        this.fetchTaskData();
    }

    staffName;
    userType;
    isNdisOrgVisible = false;
    isNdisStaff = false;
    isNdisPayrollAdmin = false;
    isNdisHrAdmin = false;
    isIctAdmin = false;
    isIctStaff = false;
    IsNdisParticipant = false;

    // Message context for LMS
@wire(MessageContext)
messageContext;
//         
    connectedCallback() {
        // 1️⃣ Load ChartJS
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    this.fetchStaffDetails(); // Fetch user details first
                })
                .catch((error) => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    // 2️⃣ Imperative Apex Call (replaces @wire)
    fetchStaffDetails() {
        console.log('Fetching staff details for user:', this.userId);

        getstaffId({ userId: this.userId })
            .then((data) => {
                if (data) {
                    console.log('Staff Data:', JSON.stringify(data));
                    this.staffName = data.Name;
                    this.userType = data.User_Type__c;

                    // Set visibility based on user type
                    this.isNdisOrgVisible =
                        this.userType === 'NDIS Org Admin' ||
                        this.userType === 'Roster Manager' ||
                        this.userType === 'Facility Admin' ||
                        this.userType === 'Roster Coordinator';
                    this.isNdisStaff = this.userType === 'NDIS Staff';
                    this.isNdisPayrollAdmin = this.userType === 'Payroll Admin';
                    this.isNdisHrAdmin = this.userType === 'HR Admin';
                    this.isIctAdmin = this.userType === 'ICT Admin';
                    this.isIctStaff = this.userType === 'ICT Staff';
                    this.IsNdisParticipant = this.userType === 'NDIS Participants';

                    console.log('User Type:', this.userType);
                    console.log('Org Visible:', this.isNdisOrgVisible);

                    // After fetching staff data, fetch chart data
                    this.fetchTaskData();
                }
            })
            .catch((error) => {
                console.error('Error fetching staff data:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to fetch user details.',
                        variant: 'error'
                    })
                );
            });
    }

    // 3️⃣ Fetch chart data
    fetchTaskData() {
        getPerformanceManagmentStatusData({ userId: this.userId, facilityId: this.facilityId })
            .then((data) => {
                console.log('Apex Data:', JSON.stringify(data));
                this.taskData = data;
                this.renderChart();
            })
            .catch((error) => {
                console.error('Error fetching task data:', error);
            });
    }

    // 4️⃣ Render Chart
    renderChart() {
        const canvas = this.template.querySelector('[data-id="pieChart"]');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Reviewer Approval', 'Completed'],
                datasets: [
                    {
                        data: [this.taskData.needReviewerAcceptance, this.taskData.completed],
                        backgroundColor: ['#1167b1', '#36A2EB'],
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'left',
                    },
                },
                layout: {
                    padding: 5,
                },
            },
        });
    }

    // 5️⃣ Child communication & LMS publish
    grandchildevent(event) {
        event.preventDefault();
        const message = event.currentTarget.dataset.name;
        console.log(message);

        this.dispatchEvent(
            new CustomEvent('grandchildevent', {
                detail: { message: message },
                bubbles: true,
                composed: true,
            })
        );
    }

    // handleRedirectClick(event) {
    //     event.preventDefault();
        
    //     const message = event.currentTarget.dataset.name || 'Performance Management';
    //     publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, { target: message });
    // }

// handleRedirectClick(event) {
//     event.preventDefault();

//     console.log('👉 Click event triggered:', event);

//     const message = event.currentTarget.dataset.name || 'Performance Management';
//     console.log('👉 Dataset name value:', event.currentTarget.dataset.name);
//     console.log('👉 Final message to publish:', message);

//     publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, { target: message });

//     console.log('✅ Message published on channel:', DASHBOARD_REDIRECT_CHANNEL);
// }


handleRedirectClick(event) {
    event.preventDefault();

    const moduleName = event.currentTarget.dataset.name || 'Performance Management';

    if (moduleName === 'Performance Management' || moduleName === 'Performance Management') {
        const url = '/s/#/human-resources/performance-management';
        console.log('Navigating to:', url);
        window.location.href = url;
        return;
    }

    publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
        target: moduleName
    });
}


}