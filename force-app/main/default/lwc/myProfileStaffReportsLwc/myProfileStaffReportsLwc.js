import { LightningElement, api, track, wire } from "lwc";
import { refreshApex } from '@salesforce/apex';
import accpetedStaffPayroll from '@salesforce/apex/MyProfileHandler.accpetedStaffPayroll';
import getRosterAllocationInvoiceData from '@salesforce/apex/RoasterManagementHandler.getRosterAllocationInvoiceData';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

export default class MyProfileStaffReportsLwc extends LightningElement {

    @api staffId;
    @api orgName;
    @track records= [];
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; 
    @track columns=[];
    @track startDateValue;
    @track endDateValue;
    @track ictApprovedHours;
    @track ictInvoiceList
    @track timesheetResult;
    @track startDate;
    @track endDate;
    @track pageSizeOptions1 = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records1 = []; //All records available in the data table
    @track columns1 = []; //columns information available in the data table
    @track totalRecords1 = 0; //Total no.of records
    @track pageSize1; //No.of records to be displayed per page
    @track totalPages1; //Total no.of pages
    @track pageNumber1 = 1; 
    @track isAccepted=[];  
    @track excelDataWages=[]; 
    @track timesheetResult;
    @track ictInvoiceList;
    @track ictApprovedHours;
    @track paginationVisible=false;
    @track paginationVisible1=false;
    
     activeSections = ['Payslips', 'TimesheetReport'];



     @track sectionFlags = {
        Payslips: true,
        TimesheetReport: true,
        
    };
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        Payslips: '\u2B9F', 
        TimesheetReport: '\u2B9F',
         
    };
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute

        // Toggle the flag and update the icon dynamically
        this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
    }


    connectedCallback() {
        console.log('orgname'+this.orgName);
         console.log('staffid'+this.staffId)
        if(this.staffId && this.orgName){            
            this.getStaffPAySlips();
        }else{
            return;
        }
        this.handleInvoiceData();
        this.getStaffReportData();
        
    }

    hadleDates(event) {
        if (event.target.name == 'StartDateInput') {
            this.startDate = event.detail.value; 
            this.loadAcceptedStaffPayrollStatus();
        }
        if (event.target.name == 'EndDateInput') {
            this.endDate = event.detail.value;
            this.loadAcceptedStaffPayrollStatus();
        }
    }
    getStaffPAySlips(){

        let currentDate = new Date();
        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth(); // January is 0, December is 11
        console.log('current month '+currentMonth);
        let currentFinancialYearStart;

        // Determine the financial year based on the current date
        if (currentMonth < 6) { // Before July
            currentFinancialYearStart = currentYear - 1;
        } else {
            currentFinancialYearStart = currentYear;
        }
        console.log('current year '+currentFinancialYearStart);
        // Financial year start and end dates
    
        this.startDate = new Date(currentFinancialYearStart, 6, 1);
        this.endDate = new Date((currentFinancialYearStart + 1), 5, 30);

        const year1 = this.startDate.getFullYear();
        const month1 = String(this.startDate.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
        const day1 = String(this.startDate.getDate()).padStart(2, '0');
        this.startDate = `${year1}-${month1}-${day1}`;

        const year2 = this.endDate.getFullYear();
        const month2 = String(this.endDate.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
        const day2 = String(this.endDate.getDate()).padStart(2, '0');
        this.endDate = `${year2}-${month2}-${day2}`;
        
        console.log('Financial year start date: ' + this.startDate);
        console.log('Financial year end date: ' + this.endDate);
        if( this.startDate && this.endDate){
            this.loadAcceptedStaffPayrollStatus();
        }

    }

    handleDatesChanges(event) {
        if (event.target.name == 'StartDateInputValue') {
            this.startDateValue = event.detail.value;
            console.log('Start Date>>'+this.startDateValue);
        }
        if (event.target.name == 'EndDateInputValue') {
            this.endDateValue = event.detail.value;
            console.log('end Date>>'+this.endDateValue);            
        }   
        try {
            if (this.startDateValue != undefined && this.endDateValue != undefined) {
                let tempconList = [];                
                this.ictInvoiceList = [];
                this.records1 = [];
                getRosterAllocationInvoiceData({ staffId: this.staffId, StartDate: this.startDateValue, endDate: this.endDateValue })
                    .then(result => {
                        console.log('ict records list' + JSON.stringify(result));
                        this.timesheetResult = result;
                        
                        let approveHours = 0;
        
                        result.forEach(rec => {
                            let tempConRec = Object.assign({}, rec);
        
                            // Check and handle null or undefined values for Working_Hours__c, Start_Date__c, and End_Date__c
                            let workingHours = rec.Working_Hours__c != null ? rec.Working_Hours__c : 0;
                            let startDate = rec.Start_Date__c != null ? new Date(rec.Start_Date__c).toLocaleDateString('en-GB') : 'N/A';
                            let endDate = rec.End_Date__c != null ? new Date(rec.End_Date__c).toLocaleDateString('en-GB') : 'N/A';
                            let typeofUser = rec.Staff__r.Type_of_User__c;
                            approveHours += workingHours;
                            tempConRec.startDate = startDate;
                            tempConRec.endDate = endDate;
                            tempConRec.hours = workingHours;
                            console.log('type of user ict :'+this.typeofUser);
                            // Check user type to assign the approver's name
                            if (typeofUser == 'ICT User') {
                                tempConRec.approvedBy = rec.ICT_TimeSheet__r ? rec.ICT_TimeSheet__r.Approver_Name__c : 'No Data';
                            } else {
                                tempConRec.approvedBy = rec.LastModifiedBy ? rec.LastModifiedBy.Name : 'N/A';
                            }
        
                            tempconList.push(tempConRec);
                        });
                      
                        this.ictInvoiceList = tempconList;
                        this.ictApprovedHours = approveHours.toFixed(2);
                        this.records1 = tempconList;
                        console.log('rec data 860>>' + JSON.stringify(this.records1));
                        this.totalRecords1 = this.records1.length;
                        this.pageSize1 = this.pageSizeOptions1[0]; // set pageSize with default value as first option
                        this.pageNumber1 = 1;
                        if(this.totalRecords1>0){
                            this.paginationVisible1=true;
                         }
                        this.paginationHelper1();
                    })
                    .catch(error => {
                        console.error('Error fetching Accepted Staff Payroll Status:', error);
                    });
            }
        } catch (error) {
            console.error('Error occurred:', error);
        }
    } 

    getStaffReportData(){
        let currentDate = new Date();
        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth(); // January is 0, December is 11
        console.log('current month '+currentMonth);
        let currentFinancialYearStart;

        // Determine the financial year based on the current date
        if (currentMonth < 6) { // Before July
            currentFinancialYearStart = currentYear - 1;
        } else {
            currentFinancialYearStart = currentYear;
        }
        console.log('current year '+currentFinancialYearStart);
        // Financial year start and end dates
    
        this.startDateValue = new Date(currentFinancialYearStart, 6, 1);
        this.endDateValue = new Date((currentFinancialYearStart + 1), 5, 30);

        const year1 = this.startDateValue.getFullYear();
        const month1 = String(this.startDateValue.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
        const day1 = String(this.startDateValue.getDate()).padStart(2, '0');
        this.startDateValue = `${year1}-${month1}-${day1}`;

        const year2 = this.endDateValue.getFullYear();
        const month2 = String(this.endDateValue.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
        const day2 = String(this.endDateValue.getDate()).padStart(2, '0');
        this.endDateValue = `${year2}-${month2}-${day2}`;
        
        console.log('Financial year start date1: ' + this.startDateValue);
        console.log('Financial year end date1: ' + this.endDateValue);

        try {
            if (this.startDateValue != undefined && this.endDateValue != undefined) {
                let tempconList = [];
                getRosterAllocationInvoiceData({ staffId: this.staffId, StartDate: this.startDateValue, endDate: this.endDateValue })
                    .then(result => {
                        console.log('ict records list' + JSON.stringify(result));
                        this.timesheetResult = result;
                        
                        let approveHours = 0;
        
                        result.forEach(rec => {
                            let tempConRec = Object.assign({}, rec);
        
                            // Check and handle null or undefined values for Working_Hours__c, Start_Date__c, and End_Date__c
                            let workingHours = rec.Working_Hours__c != null ? rec.Working_Hours__c : 0;
                            let startDate = rec.Start_Date__c != null ? new Date(rec.Start_Date__c).toLocaleDateString('en-GB') : 'N/A';
                            let endDate = rec.End_Date__c != null ? new Date(rec.End_Date__c).toLocaleDateString('en-GB') : 'N/A';
                            let typeofUser = rec.Staff__r.Type_of_User__c;
                            approveHours += workingHours;
                            tempConRec.startDate = startDate;
                            tempConRec.endDate = endDate;
                            tempConRec.hours = workingHours;
                            console.log('type of user ict :'+this.typeofUser);
                            // Check user type to assign the approver's name
                            if (typeofUser == 'ICT User') {
                                tempConRec.approvedBy = rec.ICT_TimeSheet__r ? rec.ICT_TimeSheet__r.Approver_Name__c : 'No Data';
                            } else {
                                tempConRec.approvedBy = rec.LastModifiedBy ? rec.LastModifiedBy.Name : 'N/A';
                            }
        
                            tempconList.push(tempConRec);
                        });
                      
                        this.ictInvoiceList = tempconList;
                        this.ictApprovedHours = approveHours.toFixed(2);
                        this.records1 = tempconList;
                        console.log('rec data 860>>' + JSON.stringify(this.records1));
                        this.totalRecords1 = this.records1.length;
                        this.pageSize1 = this.pageSizeOptions1[0]; // set pageSize with default value as first option
                        this.pageNumber1 = 1;
                        if(this.totalRecords1>0){
                            this.paginationVisible1=true;
                         }
                        this.paginationHelper1();
                    })
                    .catch(error => {
                        console.error('Error fetching Accepted Staff Payroll Status:', error);
                    });
            }
        } catch (error) {
            console.error('Error occurred:', error);
        }
    }

    loadAcceptedStaffPayrollStatus() {
        this.records=[];
        this.totalRecords=0;
        accpetedStaffPayroll({orgName: this.orgName,staffId: this.staffId,startDate: this.startDate,enddate: this.endDate,isFinalised:false})
        .then(result => {
            console.log('response data',JSON.stringify(result));
            result.forEach((record) => {  
                this.records.push(this.paySlipFormat(record));
            })
            console.log('records'+JSON.stringify(this.records));
            this.totalRecords =   this.records.length;
            this.excelDataWages = this.records;
            this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
            this.pageNumber = 1;
            if(this.totalRecords>0){
                this.paginationVisible=true;
             }
            this.paginationHelper();
            console.log('Accepted Staff Payroll Status: for staff', JSON.stringify(result));
        })
        .catch(error => {
            console.error('Error fetching Accepted Staff Payroll Status:', error);
            console.error('Error details:', JSON.stringify(error));
        });  
       
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
        this.isAccepted=[];
        // calculate total pages
        console.log('pagination'+this.isAccepted);
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.isAccepted.push(this.records[i]);      
            console.log('pagination1',JSON.stringify(this.isAccepted));    
        }

    }
   
    get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }
    
    handleRecordsPerPage1(event) {
        this.pageSize1 = event.target.value;
        this.paginationHelper1();
    }
    previousPage1() {
        this.pageNumber1 = this.pageNumber1 - 1;
        this.paginationHelper1();
    }
    nextPage1() {
        this.pageNumber1 = this.pageNumber1 + 1;
        this.paginationHelper1();
    }
    firstPage1() {
        this.pageNumber1 = 1;
        this.paginationHelper1();
    }
    lastPage1() {
        this.pageNumber1 = this.totalPages1;
        this.paginationHelper1();
    }
    
    // JS function to handel pagination logic 
    paginationHelper1() {
        try{
        this.ictInvoiceList = [];
        // calculate total pages
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
        // set page number 
        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }

        // console.log("pageNumber  : "+ JSON.stringify(this.pageNumber));
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber1 - 1) * this.pageSize1; i < this.pageNumber1 * this.pageSize1; i++) {
            if (i === this.totalRecords1) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records1[i]);
            tempconList.push(tempConRec)           
        }
        refreshApex(tempconList);
        console.log("Pagination1 : "+ JSON.stringify(tempconList));
        this.ictInvoiceList = tempconList;
        }catch(err){
            console.log('Error >.'+err);
        }
    }
    paySlipFormat(record){
        let tempConRec = Object.assign({}, record);
        tempConRec.sName = tempConRec.Staff__r.Name+' '+tempConRec.Staff__r.Last_Name__c;           
        tempConRec.sDate = new Date(tempConRec.Payroll_Setting__r.Period_Start_Date__c).toLocaleDateString('en-GB');
        tempConRec.eDate = new Date(tempConRec.Payroll_Setting__r.Period_End_Date__c).toLocaleDateString('en-GB');
        tempConRec.npdate = new Date(tempConRec.Payroll_Setting__r.Next_Pay_Date__c).toLocaleDateString('en-GB');
        tempConRec.totalHours = tempConRec.Total_Hours__c.toFixed(2);
        tempConRec.grossSalary = tempConRec.Gross_Salary_Display__c.toFixed(2);
        tempConRec.tax = tempConRec.Tax__c.toFixed(2);
        tempConRec.superAnnuation = tempConRec.Super_Annuation_Final__c.toFixed(2);
        tempConRec.netPay = tempConRec.Net_Pay__c.toFixed(2);
        tempConRec.amazonUrl = tempConRec.Amazon_URL__c;
        tempConRec.reimbursement = tempConRec.Reimbursements__c ? tempConRec.Reimbursements__c.toFixed(2) : "0.00";
        tempConRec.voluntarySuper = tempConRec.Super_And_Voluntary_Supper_Annuation__c ? tempConRec.Super_And_Voluntary_Supper_Annuation__c.toFixed(2) : "0.00";
        tempConRec.preTax = tempConRec.Pre_Tax_Formula__c ? tempConRec.Pre_Tax_Formula__c.toFixed(2) : "0.00";
        tempConRec.postTax = tempConRec.Post_Tax_Formula__c ? tempConRec.Post_Tax_Formula__c.toFixed(2) : "0.00"; 
        return tempConRec;
    }
 
    @track wagesHeader = ['Staff Name', 'Start Date', 'End Date', 'Processed Date','Hours', 'Pre Tax','Post Tax','Gross','Tax','Reimbursement','Guaranteed Super','Voluntary Super','Net Payable' ];

    handleDetailedWagesCSV() { 
        console.log('Download CSV start');

        let csvContent = '';

        // Add the organization details at the top
        csvContent += '"' + this.orgName + '"' + '\n';
        csvContent += '"Address: ' + this.orgStreet +', '+ this.orgCity +', '+ this.stateCode +', '+this.postalCode + ', '+this.countryCode + '"' + '\n';
        csvContent += '"Contact No: ' + this.contactNo + '"' + '\n';
        csvContent += '"ABN: ' + this.abn + '"' + '\n';
        csvContent += '\n\n'; // Two blank rows for spacing

        csvContent += '"Detailed Wages Report"' + '\n';

        // Reformat the dates
        function formatDate(dateStr) {
            var parts = dateStr.split('-');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }
        var formattedSDate = formatDate(this.startDate);
        var formattedEDate = formatDate(this.endDate);    
        csvContent += '"Start Date: ' + formattedSDate + ' and End Date: ' + formattedEDate + '"' + '\n';

        // Add header row
        csvContent += this.wagesHeader.join(',') + '\n';

        // Add data rows
        this.excelDataWages.forEach(fieldsData => {
            csvContent += '"' + fieldsData.sName + '",' +
                        '"' + fieldsData.sDate + '",' +
                        '"' + fieldsData.eDate + '",' +
                        '"' + fieldsData.npdate + '",' +
                        fieldsData.totalHours + ',' +
                        '"' + '$' + fieldsData.preTax + '",' +
                        '"' + '$' + fieldsData.postTax + '",' +
                        '"' + '$' + fieldsData.grossSalary + '",' +
                        '"' + '$' + fieldsData.tax + '",' +
                        '"' + '$' + fieldsData.reimbursement + '",' +
                        '"' + '$' + fieldsData.superAnnuation + '",' +
                        '"' + '$' + fieldsData.voluntarySuper + '",' +
                        '"' + '$' + fieldsData.netPay + '"' + '\n';
        });

        // Create CSV download
        var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        downloadElement.download = 'DetailedWagesReport.csv'; // .csv extension
        document.body.appendChild(downloadElement);
        downloadElement.click();
    }

    @track orgRecord;
    @track abn;
    @track orgName;
    @track orgStreet;
    @track stateCode;
    @track postalCode;
    @track countryCode;
    @track orgCity;
    @track contactNo;
    handleInvoiceData() {
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

    @track wagesHeader = ['Start Date', 'End Date', 'Approved by', 'Hours'];
    handleTimesheetReportCSV() {
        console.log('Download CSV start');

        let csvContent = '';

        // Add the organization details at the top
        csvContent += '"' + this.orgName + '"' + '\n';
        csvContent += '"Address: ' + this.orgStreet + ', ' + this.orgCity + ', ' + this.stateCode + ', ' + this.postalCode + ', ' + this.countryCode + '"' + '\n';
        csvContent += '"Contact No: ' + this.contactNo + '"' + '\n';
        csvContent += '"ABN: ' + this.abn + '"' + '\n';
        csvContent += '\n\n'; // Two blank rows for spacing

        csvContent += '"Timesheet Report"' + '\n';

        // Reformat the dates
        function formatDate(dateStr) {
            var parts = dateStr.split('-');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }
        var formattedSDate = formatDate(this.startDateValue);
        var formattedEDate = formatDate(this.endDateValue); // Assuming you meant `endDateValue` instead of `startDateValue` for the end date.
        csvContent += '"Start Date: ' + formattedSDate + ' and End Date: ' + formattedEDate + '"' + '\n';

        // Add header row
        csvContent += this.wagesHeader.join(',') + '\n';

        console.log('timesheet result >>'+JSON.stringify(this.timesheetResult));
        // Add data rows
       /*  this.timesheetResult.forEach(fieldsData => {
            csvContent += '"' + fieldsData.Start_Date__c + '",' +
                        '"' + fieldsData.End_Date__c + '",' +
                        '"' + fieldsData.ICT_TimeSheet__r.Approver_Name__c + '",' +
                        fieldsData.Working_Hours__c + '\n';  // No quotes needed for numbers
        }); */

        this.timesheetResult.forEach(fieldsData => {
            // Check if ICT_TimeSheet__r and Approver_Name__c exist, otherwise use LastModifiedBy.Name
            const approverName = fieldsData.ICT_TimeSheet__r && fieldsData.ICT_TimeSheet__r.Approver_Name__c 
                ? fieldsData.ICT_TimeSheet__r.Approver_Name__c 
                : fieldsData.LastModifiedBy.Name;
        
            // Concatenate data with appropriate handling for nulls
            csvContent += '"' + (fieldsData.Start_Date__c || '') + '",' +  // Handle null for Start_Date__c
                          '"' + (fieldsData.End_Date__c || '') + '",' +    // Handle null for End_Date__c
                          '"' + approverName + '",' +                      // Use approverName based on the check above
                          (fieldsData.Working_Hours__c != null ? fieldsData.Working_Hours__c : '') + '\n';  // Handle null for Working_Hours__c
        });
        console.log('After timesheet result >>'+JSON.stringify(this.timesheetResult));

       // csvContent += '\n'; // Blank line for spacing
        csvContent += ', , "Total Hours", ' + (this.ictApprovedHours != null ? this.ictApprovedHours : '') + '\n';

        console.log('CSVContect >>'+JSON.stringify(csvContent));
        // Create CSV download
        var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        downloadElement.download = 'TimesheetReport.csv'; // .csv extension
        document.body.appendChild(downloadElement);
        downloadElement.click();
    }
    @track isModalOpen = false;
    @track currentUrl;
    @track isHome=true;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
    // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
    }

    closeviewfile(event) {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome=true;
    }



}