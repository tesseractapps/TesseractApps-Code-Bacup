/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-18-2023
 * @last modified by  : Raja Sekhar Reddy
 * 
 * 
**/
import { LightningElement, track, api } from 'lwc';
import ChartJS from '@salesforce/resourceUrl/chratJs';
import { loadScript } from 'lightning/platformResourceLoader';
import fundTrackerSpent from '@salesforce/apex/ClientFundTransferHandler.fundTrackerSpent';
import fundTrackerRecord from '@salesforce/apex/ClientFundTransferHandler.fundTrackerRecord';
import { refreshApex } from '@salesforce/apex';
import fundTrackerSpentAmount from '@salesforce/apex/ClientFundTransferHandler.fundTrackerSpentAmount';


export default class PieChartLwc extends LightningElement {
  @track chartJSLoaded;
  @track chart;
  @track fundTrackList;
  @track facilityOptions;
  @track approvedOption;
  @track availableOption;
  @api clientId;
  @track availableFunds;
  @track spentFunds;
  @track registerGroup;
  @track approvedAmount;

  constructor() {
    super();
    this.chartJSLoaded = false;
  }
  
  connectedCallback() {
  }

 
  @api buildChart() {    
    let valueData=["Approved Funds", "Available Funds", "Spent Funds"];
    let canvas = this.template.querySelector("canvas");
    let context = canvas.getContext("2d");
    let valuelabel = [];   

    fundTrackerSpentAmount({ clientId: this.clientId, approvedAmount: this.approvedAmount, availableFund: this.availableFunds,spentFund: this.spentFunds }).then(response => {
        
        this.approvedOption = response.map(record => ({ value: record.approvedAmount, label: record.Total_Approved_Amounts__c }));
        this.approvedOption.forEach(record => {        
          valuelabel.push(record.label);        
        })

        this.availableOption = response.map(record => ({ value: record.availableFund, label: record.Total_Available_Funds__c }));
        this.availableOption.forEach(record => {        
          valuelabel.push(record.label);        
        })        

        this.facilityOptions = response.map(record => ( { value: record.spentFund, label: record.Total_Spent_Funds__c	 }));
        this.facilityOptions.forEach(record => {            
          valuelabel.push(record.label);            
        })

        this.chart = new window.Chart(context, {
          type: "pie",
          data: {
            labels: valueData,
            datasets: [
              {
                label: "# of Votes",
                data: valuelabel,
                backgroundColor: [
                  "rgba(0, 225, 0, 1)",
                  "rgba(250, 250, 0, 1)",
                  "rgba(255, 99, 71, 1)",                  
                  "rgba(70, 130, 180, 1)",
                  "rgba(128, 128, 128, 1)",
                  "rgba(0, 255, 255, 1)",
                  "rgba(245,42 , 145, 1)",
                  "rgba(128,0 , 128, 0.7)",
                  "rgba(126,78 , 67, 0.7)",
                  "rgba(195,155 , 211, 0.7)",
                  "rgba(0,0 , 0, 0.7)",
                  "rgba(204,204 ,255,1)"
                ],
                borderColor: [
                  "rgba(0, 225, 0, 1)",
                  "rgba(250, 250, 0, 1)",
                  "rgba(255, 99, 71, 1)",                  
                  "rgba(70, 130, 180, 1)",
                  "rgba(128, 128, 128, 1)",
                  "rgba(0, 255, 255, 1)",
                  "rgba(245,42 , 145, 1)",
                  "rgba(128,0 , 128, 1)",
                  "rgba(126,78 , 67, 1)",
                  "rgba(195,155 , 211, 0.7)",
                  "rgba(0,0 , 0, 0.7)",
                  "rgba(204,204 ,255,1)"
                ],
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            legend: {
              position: 'right'
            },
            animation: {
              animateScale: true,
              animateRotate: true
            }
          }
        });
      })    
    }
}