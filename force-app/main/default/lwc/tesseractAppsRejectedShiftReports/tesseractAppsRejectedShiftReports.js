import { LightningElement, api, track, wire } from "lwc";
import getRejectedShiftsbyDates from '@salesforce/apex/AddShiftController.getRejectedShiftsbyDates';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

export default class TesseractAppsRejectedShiftReports extends LightningElement {
     @api orgid;
    @track sectionFlags = {
            Payslips: true,
            RejectedShiftReports: true,
            
        };
        
  // Icons for the toggle buttons
   @track sectionIcons = {
            Payslips: '\u2B9F', 
            RejectedShiftReports: '\u2B9F',
             
        };
        connectedCallback() {
        const today = new Date();
        let fiscalStartYear, fiscalEndYear;

        if (today.getMonth() < 6) { // Months are 0-indexed: 6 = July
            fiscalStartYear = today.getFullYear() - 1;
            fiscalEndYear = today.getFullYear();
        } else {
            fiscalStartYear = today.getFullYear();
            fiscalEndYear = today.getFullYear() + 1;
        }

        // Format as 'YYYY-MM-DD'
        this.startDate = `${fiscalStartYear}-07-01`;
        this.endDate = `${fiscalEndYear}-06-30`;

        this.loadRejectedShifts();
        this.handleOrgData();
    }

   @track  shifts =[];  
   
    @track abn;
    @track orgName;
    @track orgStreet;
    @track stateCode;
    @track postalCode;
    @track countryCode;
    @track orgCity;
    @track contactNo;
       handleOrgData() {
           orgDetails().then(response=>{
               this.orgRecord=response;
               console.log('recordsnew>>>>>'+JSON.stringify(response));           
               this.abn = response.ABN__c;           
               this.orgName = response.Name;            
               this.orgStreet = response.Address_Latest__Street__s;            
               this.orgCity = response.Address_Latest__City__s;            
               this.stateCode = response.Address_Latest__StateCode__s;            
               this.postalCode = response.Address_Latest__PostalCode__s;            
               this.countryCode = response.Address_Latest__CountryCode__s;            
               this.contactNo = response.Contact_No__c;
           });
       } 
     loadRejectedShifts() {
    console.log('startDate: ' + this.startDate);
    console.log('endDate: ' + this.endDate);
    console.log('orgId: ' + this.orgid);

    getRejectedShiftsbyDates({ Sdate: this.startDate, edate: this.endDate, orgId: this.orgid })
        .then(result => {
            this.shifts = result.map(shift => {
                return {
                    ...shift,
                    formattedDate: shift.Date__c 
                        ? new Date(shift.Date__c).toLocaleDateString('en-GB') 
                        : ''
                };
            });

            console.log('Formatted shifts: ' + JSON.stringify(this.shifts));
            this.error = undefined;
        })
        .catch(error => {
            this.error = error;
            this.shifts = [];
            console.error('Error fetching rejected shifts:', error);
        });
}

    handleShiftsCSVExport() {
    console.log('Exporting Shift Table to CSV');
    var formattedSDate = formatDate(this.startDate);
    var formattedEDate = formatDate(this.endDate);  
     function formatDate(dateStr) {
            var parts = dateStr.split('-');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        } 

    let csvContent = '';

    // Optional: Add organization header if needed
    csvContent += `"${this.orgName || ''}"\n`;
    csvContent += `"Address: ${this.orgStreet || ''}, ${this.orgCity || ''}, ${this.stateCode || ''}, ${this.postalCode || ''}, ${this.countryCode || ''}"\n`;
    csvContent += `"Contact No: ${this.contactNo || ''}"\n`;
    csvContent += `"ABN: ${this.abn || ''}"\n\n\n`;

    csvContent += '"Rejected Shifts Report"\n';
    csvContent += `"Start Date: ${formattedSDate || ''} and End Date: ${formattedEDate || ''}"\n\n`;

    // CSV Header matching the table
    csvContent += '"Date","Staff","Facility","Role","Shift Type","Timings","Comments"\n';

    // Loop through shifts and build rows
    this.shifts.forEach(row => {
        csvContent += `"${row.Date__c || ''}",` +
                      `"${row.Staff__r?.NameToDisplay__c || ''}",` +
                      `"${row.Facility__c || ''}",` +
                      `"${row.Add_Shift__r?.Role__c || ''}",` +
                      `"${row.Add_Shift__r?.Shift_Type__c || ''}",` +
                    `"${row.Add_Shift__r?.Shift_Start_End_Time__c || ''}",` +
                      `"${row.RejectedComments__c || ''}"\n`;
    });

    // Download logic
    const element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const downloadElement = document.createElement('a');
    downloadElement.href = element;
    downloadElement.target = '_self';
    downloadElement.download = 'RejectedShiftsReport.csv';
    document.body.appendChild(downloadElement);
    downloadElement.click();
}
 handleDatesChanges(event) {
        if (event.target.name == 'StartDateInputValue') {
            this.startDate = event.detail.value;
            console.log('Start Date>>'+this.startDate);
        }
        if (event.target.name == 'EndDateInputValue') {
            this.endDate = event.detail.value;
            console.log('end Date>>'+this.endDate);            
        }  
         if (this.startDate != undefined && this.endDate != undefined) {
        this.loadRejectedShifts();
    }
}
  handleBackToParent(){
        this.dispatchEvent(new CustomEvent('backtorejectedshifts'));
  }
}