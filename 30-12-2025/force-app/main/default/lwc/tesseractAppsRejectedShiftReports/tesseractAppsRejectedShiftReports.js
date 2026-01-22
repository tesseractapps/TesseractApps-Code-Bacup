import { LightningElement, api, track, wire } from "lwc";
import getRejectedShiftsbyDates from '@salesforce/apex/AddShiftController.getRejectedShiftsbyDates';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';

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
            this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
            this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
            this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
            window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
    
    }   
    disconnectedCallback() {
        window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
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
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number  
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;

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
               //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
               //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
           });
       } 
     loadRejectedShifts() {
    console.log('startDate: ' + this.startDate);
    console.log('endDate: ' + this.endDate);
    console.log('orgId: ' + this.orgid);

    getRejectedShiftsbyDates({ Sdate: this.startDate, edate: this.endDate, orgId: this.orgid })
        .then(result => {
              const storedFacilityId = localStorage.getItem('defaultFacilityId');
                const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');

                   let facilityIds = [];
                            facilityIds.push(storedFacilityId);  
                            this.shifts = result.filter(rec =>
                                facilityIds.includes(rec.Add_Shift__r?.Facility__c)).map(shift => {
                    return {
                        ...shift,
                        formattedDate: shift.Date__c 
                            ? new Date(shift.Date__c).toLocaleDateString('en-GB') 
                            : ''
                    };
                    });
                    this.records =this.shifts;              
                    this.totalRecords =this.shifts.length; // update total records count                 
                    this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                    this.pageNumber = 1;
                    this.paginationHelper();
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
   get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }    
    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
    }
    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }
    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }
    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }
    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }
    paginationHelper() {
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
       // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        let tempconList=[];   
       // console.log('calling pagination Data1 >>'+JSON.stringify(tempconList));    
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
        //console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.shifts = tempconList;
    }

    handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
            event.preventDefault();
            this.handleBackToParent();
            }
    }
}