import { LightningElement, wire } from 'lwc';
import USER_ID  from '@salesforce/user/Id';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import getLeaveStatusCounts from '@salesforce/apex/PerformanceManagmentChartController.getLeaveStatusCounts';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId1';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';


export default class LeaveStatusChart extends LightningElement {
    userId = USER_ID; // Automatically fetches the logged-in user Id
    taskData = { Requested: 0, Approved: 0, Rejected: 0 }; // Default values for the chart

    // User Type Properties
    staffName;
    userType;
    isNdisOrgVisible = false;
    isNdisStaff = false;
    isNdisPayrollAdmin = false;
    isNdisHrAdmin = false;
    isIctAdmin = false;
    isIctStaff = false;
    IsNdisParticipant = false;

    isChartJsInitialized = false;
    chartInstance;

    renderedCallback() {
        if (this.isChartJsInitialized && !this.chartInstance && this.taskData) {
            const canvasEl = this.template.querySelector('canvas');
            if (canvasEl) {
                this.initializeChart();
            }
        }
    }    

    // Wire method to fetch Staff details
    @wire(MessageContext)
    messageContext;
    @wire(getstaffId, { userId: '$userId' })
    wiredUserAccessDetails({ error, data }) {
        console.log('Wire method executed'); // Ensure the wire is called
    
        if (data) {
            console.log('Staff Data:', JSON.stringify(data)); // Log full response
            this.staffName = data.Name;  
            this.userType = data.User_Type__c;

            // Set visibility based on user type
            this.isNdisOrgVisible = this.userType === 'NDIS Org Admin' || this.userType === 'Roster Manager';
            this.isNdisStaff = this.userType === 'NDIS Staff';
            this.isNdisPayrollAdmin = this.userType === 'Payroll Admin';
            this.isNdisHrAdmin = this.userType === 'HR Admin';
            this.isIctAdmin = this.userType === 'ICT Admin';
            this.isIctStaff = this.userType === 'ICT Staff';
            this.IsNdisParticipant = this.userType === 'NDIS Participants';
            console.log('this.isNdisHrAdmin==>'+this.isNdisHrAdmin);
        } else if (error) {
            console.error('Error fetching staff data:', error);
        }
    }

    connectedCallback() {
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    this.fetchTaskData(); // Fetch data only after Chart.js is loaded
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    fetchTaskData() {
        getLeaveStatusCounts({ userId: this.userId })
            .then((data) => {
                console.log('Apex Data:', JSON.stringify(data));
                if (data) {
                    this.taskData = data; // Update taskData with the data from Apex
                    this.initializeChart(); // Initialize chart once data is fetched
                }
            })
            .catch((error) => {
                console.error('Error fetching task data:', error);
            });
    }    

    initializeChart() {
        // Prepare chart data
        const chartData = {
            labels: ['Requested', 'Approved', 'Rejected'], // Labels for the doughnut chart
            datasets: [
                {
                    data: [this.taskData.Requested, this.taskData.Approved, this.taskData.Rejected], // Data values
                    backgroundColor: ['#f8e22d', '#84d15e', '#d16f5e'], // Colors for each section
                }
            ]
        };
    
        // Now initialize the chart using the chartData
        const ctx = this.template.querySelector('canvas').getContext('2d');
        if (this.chartInstance) {
            this.chartInstance.destroy(); // Destroy existing chart instance if it exists
        }
    
        this.chartInstance = new Chart(ctx, {
            type: "doughnut", // Type of chart (doughnut chart)
            data: chartData,  // Use the data we prepared
            options: {
                legend: {
                    display: true,
                    position: "right"
                }
            }
        });
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
        const message = event.currentTarget.dataset.name || 'Leave Management';

        publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
            target: message
        });
    }
    
}