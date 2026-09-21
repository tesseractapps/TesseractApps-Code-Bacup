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
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "";
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
                      //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                      //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
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
                console.log('Participant options:', JSON.stringify(data));

                if (data.length > 0) {
                    const firstOption = data[0];
                    this.selectedValue = firstOption.value;
                    this.selectedParticipantType = firstOption.participantType;
                    this.selectedTypeOfService = firstOption.typeOfService;
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

   @track selectedParticipantType;  
   @track selectedTypeOfService; 

    handleParticipantChange(event) {
        this.selectedValue = event.detail.value;
        console.log('Selected Participant:', this.selectedValue);
        const selectedOption = this.Participantoptions.find(
            (opt) => opt.value === this.selectedValue
        );

        if (selectedOption) {
            this.selectedParticipantType = selectedOption.participantType;
            this.selectedTypeOfService = selectedOption.typeOfService;
        } else {
            this.selectedParticipantType = null;
            this.selectedTypeOfService = null;
        }

        console.log("Selected Value:", this.selectedValue);
        console.log("Participant Type:", this.selectedParticipantType);
        console.log("Type of Service:", this.selectedTypeOfService);

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

        let dollarAUFormatter = new Intl.NumberFormat('en-AU', { 
            style: 'currency', 
            currency: 'AUD', 
            minimumFractionDigits: 2 
        });

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
                    },
                    tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let dataset = data.datasets[tooltipItem.datasetIndex];
                            let value = dataset.data[tooltipItem.index];
                            return dollarAUFormatter.format(value); // ✅ Adds $ and commas
                        }
                    }
               }
            }
        });
    }

    /*  grandchildevent(event){
        event.preventDefault();
        const message = event.currentTarget.dataset.name;
        console.log(message);

        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: message },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    } */
    
    grandchildevent(event){
        event.preventDefault();
        const taskType = event.currentTarget.dataset.name;
        const whatId = this.selectedValue;
        console.log(taskType);
         console.log(whatId);

        const editEvent = new CustomEvent('taskedit', {
                detail: { taskType, whatId, participantType: this.selectedParticipantType, serviceType: this.selectedTypeOfService },
                bubbles: true,
                composed: true
            });
        
            this.dispatchEvent(editEvent);
    }
        

}