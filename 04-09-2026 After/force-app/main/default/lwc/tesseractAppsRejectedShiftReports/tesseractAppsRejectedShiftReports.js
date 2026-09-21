import { LightningElement, api, track, wire } from "lwc";
import getRejectedShiftsbyDates from '@salesforce/apex/AddShiftController.getRejectedShiftsbyDates';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class TesseractAppsRejectedShiftReports extends LightningElement {
     @api orgid;
    @track sectionFlags = {
            Payslips: true,
            RejectedShiftReports: true,
            
        };
    @track totalRejectedshifts;
        
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
    @track totalRejected=0;
    @track avgPerWeek=0;
    @track uniqueStaff=0;
    @track mostRejectedRole;
    @track maxRejectedCount=0;
    @track exportFlag=false;

   

get isSummary() {
    return this.selectedOption === 'summary';
}

get isDetailed() {
    return this.selectedOption === 'detailed';
}

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
                console.log('result',JSON.stringify(result));

                   let facilityIds = [];
                            facilityIds.push(storedFacilityId);  
                            this.shifts = result.filter(rec =>
                                facilityIds.includes(rec.shift?.Add_Shift__r?.Facility__c)).map(wrapper => {
                        const shift = wrapper.shift;
                        const participantName = shift.Services_and_Support_Plans__r && shift.Services_and_Support_Plans__r.length > 0 ? shift.Services_and_Support_Plans__r[0].Participant_Name__c: '';

                        return {
                            ...shift,
                            participantName,
                            reassignedStaffName: wrapper.reassignedStaffName || '',
                            rejecteddate:shift.LastModifiedDate ? new Date(shift.LastModifiedDate).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        }) :'',

                            reassignedDate: wrapper.reassignedDate ? new Date(wrapper.reassignedDate).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        }) :'',
                            formattedDate: shift.Date__c
                                ? new Date(shift.Date__c).toLocaleDateString('en-GB')
                                : ''
                        };
                    });

                    
                    // -------------------------------
                    // ✅ METRIC 1: TOTAL REJECTED
                    // -------------------------------
                    this.totalRejected = this.shifts.length; 

                    // -------------------------------
                    // ✅ METRIC 2: AVG PER WEEK
                    // -------------------------------
                   /*  const start = new Date(this.startDate);
                    const end = new Date(this.endDate);

                    const diffInDays = Math.max(
                        1,
                        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
                    );

                    const totalWeeks = diffInDays < 7 ? 1 : diffInDays / 7;

                    this.avgPerWeek = totalWeeks > 0
                        ? (this.totalRejected / totalWeeks).toFixed(1)
                        : 0; */
                        const start = new Date(this.startDate);
                        const end = new Date(this.endDate);

                        const diffInDays = Math.max(
                            1,
                            Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
                        );
                        console.log('diffInDays',diffInDays);

                        // 🔥 KEY FIX
                        const totalWeeks = diffInDays < 7 ? 1 : diffInDays / 7;
                        console.log('totalWeeks',totalWeeks);

                        // Ensure NUMBER, not string
                        this.avgPerWeek = Number(
                            (this.totalRejected / totalWeeks).toFixed(1)
                        );
                        console.log('this.avgPerWeek',this.avgPerWeek);

                    // -------------------------------
                    // ✅ METRIC 3: STAFF WITH SINGLE REJECTED SHIFT
                    // -------------------------------
                    const staffCountMap = {};
                      console.log('this.shifts',JSON.stringify(this.shifts));
                    this.shifts.forEach(shift => {
                        const staffId = shift.Staff__c;
                        if (staffId) {
                            staffCountMap[staffId] = (staffCountMap[staffId] || 0) + 1;
                        }
                    });
                    console.log('staffCountMap',JSON.stringify(staffCountMap));
                    this.uniqueStaff = Object.values(staffCountMap)
                        .filter(count => count === 1).length;

                      // -------------------------------
                        // ✅ METRIC 4: MOST REJECTED ROLE
                        // -------------------------------
                        const roleCountMap = {};

                        this.shifts.forEach(shift => {
                            const role = shift.Add_Shift__r?.Role__c;
                            if (role) {
                                roleCountMap[role] = (roleCountMap[role] || 0) + 1;
                            }
                        });

                        // Find role with highest rejected count
                        let mostRejectedRole = 'N/A';
                        let mostRejectedRoleCount = 0;

                        Object.entries(roleCountMap).forEach(([role, count]) => {
                            if (count > mostRejectedRoleCount) {
                                mostRejectedRole = role;
                                mostRejectedRoleCount = count;
                            }
                        });

                        // Assign values
                        this.mostRejectedRole = mostRejectedRole;
                        this.mostRejectedRoleCount = mostRejectedRoleCount;

                                    
                     this.filterrecords =this.shifts; 
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
        this.exportFlag = true;
        this.totalRejectedshifts=this.records.length;
        this.selectedOption ='summary';
   }
@track roleflag = false;
@track filterrecords = [];

get hasRecords() {
    return this.shifts && this.shifts.length > 0;
}

handleSearch(event) {
    this.searchKey = (event.target.value || '').toLowerCase().trim();

    let filtered = this.filterrecords.filter(shift => {

       /*  const staffName =
            shift?.Staff__r?.NameToDisplay__c || ''; */

        const nickname =
            shift?.Staff__r?.Display_Nickname__c || '';

       /*  const role =
            shift?.Add_Shift__r?.Role__c || ''; */

        return (
           /*  staffName.toLowerCase().includes(this.searchKey) || */
            nickname.toLowerCase().includes(this.searchKey) /* ||
            role.toLowerCase().includes(this.searchKey) */
        );
    });

    this.records = filtered;
    this.totalRecords = filtered.length;
    this.pageNumber = 1;
    this.paginationHelper();
}

handleRoleFilter(event) {
    const selectedRole = event.currentTarget.dataset.role;

    console.log('Selected Role:', selectedRole);
    console.log('Role Flag (before):', this.roleflag);

    if (!selectedRole || selectedRole === 'N/A') {
        return;
    }

    // 🔁 TOGGLE AFTER VALIDATION
    this.roleflag = !this.roleflag;

    if (this.roleflag) {
        // ✅ APPLY FILTER
        
        this.records = this.filterrecords.filter(
            shift => shift.Add_Shift__r?.Role__c === selectedRole
        );
    this.totalRecords = this.records.length;
    this.pageNumber = 1;
    this.paginationHelper();
    } else {
        // ✅ RESET FILTER (NO SERVER CALL)
       // this.records = [...this.shifts];
         this.loadRejectedShifts()
    }

    // 🔄 RESET PAGINATION
  
}


 

  







@track selectedOption  = 'summary'; // ✅ DEFAULT;
handleOptionChange(event) {
    this.selectedOption = event.target.value;
}
handleCancel(){
    this.exportFlag = false;
}
handleExport() {
    console.log('Selected Option: ' + this.selectedOption);
    if (this.selectedOption === undefined ) {
           
             this.dispatchEvent(
        new ShowToastEvent({
          title: "Selection Required",
          message:
            "Please select Summary or Detailed version before exporting.",
          variant: "error"
        })
      );
            return;
        }
    if (this.selectedOption === 'summary') {
        this.exportSummaryCSV();
    } else {
        this.exportDetailedCSV();
    }
}

exportSummaryCSV() {
  
     console.log('Exporting Shift Table to CSV');
    // var formattedSDate = formatDate(this.startDate);
    // var formattedEDate = formatDate(this.endDate);  
        // function formatDate(dateStr) {
        //     var parts = dateStr.split('-');
        //     return parts[2] + '-' + parts[1] + '-' + parts[0];
        // } 

        var formattedSDate = this.formatDate(this.startDate);
        var formattedEDate = this.formatDate(this.endDate);

    let csvContent = '';
      csvContent += `"Rejected Shifts Summary Report"\n\n`;
    // Optional: Add organization header if needed
    csvContent += `"${this.orgName || ''}"\n`;
    csvContent += `"Address: ${this.orgStreet || ''}, ${this.orgCity || ''}, ${this.stateCode || ''}, ${this.postalCode || ''}, ${this.countryCode || ''}"\n`;
    csvContent += `"Contact No: ${this.contactNo || ''}"\n`;
    csvContent += `"ABN: ${this.abn || ''}"\n\n\n`;

    csvContent += '"Rejected Shifts Report"\n';
    csvContent += `"Start Date: ${formattedSDate || ''} and End Date: ${formattedEDate || ''}"\n\n`;

    // CSV Header matching the table
    csvContent += '"Date","Staff","Facility","Role","Shift Time","Participant","Comments","Rejected At","Reassigned To","Reassigned Time"\n';

    // Loop through shifts and build rows
    this.records.forEach(row => {
        const participant = row.Services_and_Support_Plans__r?.[0]?.Participant_Name__c || '';

        // csvContent += `"${row.Date__c || ''}",` +
        csvContent += `"=""${this.formatDate(row.Date__c)}""",` +
                      `"${row.Staff__r?.NameToDisplay__c || ''}",` +
                      `"${row.Facility__c || ''}",` +
                      `"${row.Add_Shift__r?.Role__c || ''}",` +
                      
                      `"${row.Add_Shift__r?.Shift_Start_End_Time__c || ''}",` +
                      `"${participant}",` +
                      `"${row.RejectedComments__c || ''}",`+
                    //   `"${row.rejecteddate || ''}",`+
                    //   `"${row.reassignedStaffName || 'No'}",` +
                    //   `"${row.reassignedDate || 'No'}"\n`;
                    `"=""${this.formatDisplayStringToCSV(row.rejecteddate)}""",` +
                    `"${row.reassignedStaffName || 'No'}",` +
                    `"=""${this.formatDisplayStringToCSV(row.reassignedDate)}"""\n`;
    });
     this.downloadCSV(csvContent, 'Rejected_Shifts_Summary.csv');
   
}

formatDisplayStringToCSV(dateStr) {
    if (!dateStr) return '';

    const regex = /^(\d{1,2}) (\w+) (\d{4}) at (\d{1,2}:\d{2}) (am|pm)$/i;
    const match = dateStr.match(regex);

    if (!match) return dateStr;

    let [, day, monthName, year, time, meridian] = match;

    const monthMap = {
        january: '01', february: '02', march: '03',
        april: '04', may: '05', june: '06',
        july: '07', august: '08', september: '09',
        october: '10', november: '11', december: '12'
    };

    const month = monthMap[monthName.toLowerCase()];
    day = day.padStart(2, '0');

    return `${year}-${month}-${day} at ${time} ${meridian.toLowerCase()}`;
}

formatDate(dateStr) {
    if (!dateStr) return '';

    // If already yyyy-mm-dd → return
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Handle dd-mm-yyyy
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    }

    // Handle ISO or Date values
    const d = new Date(dateStr);
    if (!isNaN(d)) {
        return d.toISOString().split('T')[0];
    }

    return dateStr;
}

downloadCSV(csvContent, fileName) {
    const element = document.createElement('a');
    element.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    element.target = '_self';
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


exportDetailedCSV() {
    // var formattedSDate = formatDate(this.startDate);
    // var formattedEDate = formatDate(this.endDate);  
    //  function formatDate(dateStr) {
    //         var parts = dateStr.split('-');
    //         return parts[2] + '-' + parts[1] + '-' + parts[0];
    //     } 

    var formattedSDate = this.formatDate(this.startDate);
    var formattedEDate = this.formatDate(this.endDate);
    
    let csvContent = '';

    // Header
    csvContent += `"Rejected Shifts Detailed Report"\n\n`;
    csvContent += `"${this.orgName || ''}"\n`;
    csvContent += `"Address: ${this.orgStreet || ''}, ${this.orgCity || ''}, ${this.stateCode || ''}, ${this.postalCode || ''}, ${this.countryCode || ''}"\n`;
    csvContent += `"Contact No: ${this.contactNo || ''}"\n`;
    csvContent += `"ABN: ${this.abn || ''}"\n\n\n`;

    csvContent += '"Rejected Shifts Report"\n';
    csvContent += `"Start Date: ${formattedSDate || ''} and End Date: ${formattedEDate || ''}"\n\n`;


    csvContent += `"Date","Staff Name","Staff Email","Facility","Role","Shift Type","Shift Timings","Duration","Rejected Comments","Participant","Service Type","Checklist Items","Rejected At","Reassigned To","Reassigned Date"\n`;

    this.records.forEach(row => {

        const participant =
            row.Services_and_Support_Plans__r?.[0]?.Participant_Name__c || '';

        const serviceType =
            row.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c || '';

        const checklist =
            row.Add_Shift_Checklists__r
                ?.map(c => `${c.Description__c} (${c.Mandatory__c ? 'Mandatory' : 'Optional'})`)
                .join(' | ') || '';

        // csvContent += `"${row.Date__c || ''}",` +
        csvContent += `"=""${this.formatDate(row.Date__c)}""",` +
                      `"${row.Staff__r?.NameToDisplay__c || ''}",` +
                      `"${row.Staff__r?.Email_Address__c || ''}",` +
                      `"${row.Facility__c || ''}",` +
                      `"${row.Add_Shift__r?.Role__c || ''}",` +
                      `"${row.Add_Shift__r?.Shift_Type__c || ''}",` +
                      `"${row.Add_Shift__r?.Shift_Start_End_Time__c || ''}",` +
                      `"${row.Duration__c || ''}",` +
                      `"${row.RejectedComments__c || ''}",` +
                      `"${participant}",` +
                      `"${serviceType}",` +
                      `"${checklist}",` +
                      `"=""${this.formatDisplayStringToCSV(row.rejecteddate)}""",` +
                      `"${row.reassignedStaffName || 'No'}",` +
                      `"=""${this.formatDisplayStringToCSV(row.reassignedDate)}"""\n`;
    });

    this.downloadCSV(csvContent, 'Rejected_Shifts_Detailed.csv');
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

        const start = new Date(this.startDate);
        const end = new Date(this.endDate);

    // 2️⃣ End date cannot be before start date
    if (end < start) {
        this.endDate = null;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Invalid Date Range',
                message: 'End date cannot be earlier than start date.',
                variant: 'error'
            })
        );
        return;
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