import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import Id from '@salesforce/user/Id';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import getParticipantOptions from '@salesforce/apex/PerformanceManagmentChartController.getParticipantOptions';
import getFundData from '@salesforce/apex/PerformanceManagmentChartController.getFundData';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

export default class ParticipantsFundsChartLwc extends LightningElement {
    @track user_Id = Id;
    @track Participantoptions = [];
    @track selectedValue;
    @track facilityPreferredName;
    @track participantPreferredName;
    @api facilityId;
    @api refresh1(facilityIdFromParent) {
        console.log('facilityId in Refresh Method ParticipantsFundsChartLwc>>', facilityIdFromParent);
        this.facilityId = facilityIdFromParent;
        console.log('facilityId in Refresh Method ParticipantsFundsChartLwc >>', this.facilityId);
        this.fetchParticipantOptions();
    }

    chart;
    isChartJsInitialized = false;

    connectedCallback() {
        console.log('facilityId in Refresh Method ParticipantsFundsChartLwc >>', this.facilityId);
        this.fetchParticipantOptions();
        this.fetchOrgDetails();
    }

    renderedCallback() {
        // Chart will render after canvas is in the DOM
        if (this.isChartJsInitialized && !this.chart && this.selectedValue) {
            this.fetchfundTracker();
        }
    }


    fetchOrgDetails() {
              orgDetails()
                  .then((response) => {
                      console.log("Response for Org Details =>", response);
                      this.Orgid = response.Id;
                      this.orgfullname = response.Name;
                      this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                      this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
                  })
                  .catch((error) => {
                      console.error("Error fetching org details:", error);
                      this.error = error;
                  });
          }

    fetchParticipantOptions() {
        getParticipantOptions({ facilityId: this.facilityId })
            .then(data => {
                this.Participantoptions = data;
                console.log('Participant options:', data);

                if (data.length > 0) {
                    this.selectedValue = data[0].value;
                    this.loadChartJsAndRender();
                }
            })
            .catch(error => {
                console.error('Error fetching participant options:', error);
            });
    }

    loadChartJsAndRender() {
        if (!this.isChartJsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsInitialized = true;
                    this.fetchfundTracker();
                })
                .catch(error => {
                    console.error('Error loading Chart.js:', error);
                });
        } else {
            this.fetchfundTracker();
        }
    }

    handleParticipantChange(event) {
        this.selectedValue = event.detail.value;
        console.log('Selected Participant:', this.selectedValue);

        if (this.isChartJsInitialized) {
            this.fetchfundTracker();
        }
    }

    fetchfundTracker() {
        if (!this.selectedValue) return;

        getFundData({ participantId: this.selectedValue })
            .then(data => {
                console.log('Chart Data:', data);
                this.renderChart(data);
            })
            .catch(error => {
                console.error('Error fetching chart data:', error);
            });
    }

    renderChart(data) {
        const canvas = this.template.querySelector('canvas[data-id="pieChart"]');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }

        const ctx = canvas.getContext('2d');

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        const fundRecord = data[0];
        if (!fundRecord) {
            console.warn('No fund data returned');
            return;
        }

        this.chart = new window.Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Approved Funds', 'Available Funds', 'Spent Funds'],
                datasets: [{
                    label: 'Fund Distribution',
                    data: [
                        fundRecord.Total_Approved_Amounts__c || 0,
                        fundRecord.Total_Available_Funds__c || 0,
                        fundRecord.Total_Spent_Funds__c || 0
                    ],
                    backgroundColor: ['#00CC24', '#FAFA36', '#FF6347'],
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                        display: true,
                        position: "right"
                    }
            }
        });
    }
}