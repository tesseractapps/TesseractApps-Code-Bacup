import { LightningElement, track,wire } from 'lwc';
import Id from '@salesforce/user/Id';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import getPerformanceManagmentStatusData from '@salesforce/apex/PerformanceManagmentChartController.getPerformanceManagmentStatusData';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId1';

export default class PerformanceManagementChart extends LightningElement {
    @track userId = Id; // Correctly assign the current user Id
    @track taskData = { needReviewerAcceptance: 0, completed: 0 };
    isChartJsInitialized = false;
    chartInstance;

    staffName;
    userType;
    isNdisOrgVisible = false;
    isNdisStaff = false;
    isNdisPayrollAdmin = false;
    isNdisHrAdmin = false;
    isIctAdmin = false;
    isIctStaff = false;
    IsNdisParticipant = false;
    userId = Id;


    // Wire method to fetch Staff details
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
                console.log('true==>'+this.isNdisOrgVisible);
            } else if (error) {
                console.error('Error fetching staff data:', error);
            }
        }

    connectedCallback() {
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    this.fetchTaskData();
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    fetchTaskData() {
        getPerformanceManagmentStatusData({ userId: this.userId })
            .then((data) => {
                console.log('Apex Data:', JSON.stringify(data));
                this.taskData = data;
                this.renderChart();
            })
            .catch((error) => {
                console.error('Error fetching task data:', error);
            });
    }

    renderChart() {
        const canvas = this.template.querySelector('[data-id="pieChart"]');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
    
        const ctx = canvas.getContext('2d');
    
        // Destroy existing chart if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    
        // Create new chart with smaller size
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
                maintainAspectRatio: false, // Ensures the chart fits inside container
                plugins: {
                    legend: {
                        position: 'left',
                    },
                },
                layout: {
                    padding: 5, // Adds slight padding inside the chart
                }
            }
        });
    }
    
}