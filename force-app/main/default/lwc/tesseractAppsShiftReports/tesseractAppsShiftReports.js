import { LightningElement, track, wire, api } from 'lwc';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getShiftWithStaffData from '@salesforce/apex/ShiftReportsController.getShiftWithStaffData';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';

export default class TesseractAppsShiftReports extends LightningElement {
    
    @track selectedStartDate;
    @track selectedEndDate;
    @track selectedRole = 'All';
    @track selectedEmploymentType = 'All';
    @track selectedLocation = 'All';
    @track roleOptions = [];
    @track orgId;
    @track orgName;
    @track userType;
    @track shiftData = [];
    @track error;
    wiredShiftDataResult;
    @track isViewFlag = false;
    @track isHome =true;
    @track shiftId;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track shiftDataTable = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number 
    @track paginationVisible=false;
    @track noRecordsFlag=false;
    @track facilityOptions = [];
    @track finalListFacilities = []; 
    @track facilityValue; 
    @track facilityLabel; 

    employmentTypeOptions = [
        { label: 'All', value: 'All' },
        { label: 'Full-time and part-time', value: 'Full-time and part-time' },
        { label: 'Casual', value: 'Casual' }
    ];
    locationOptions = [
        { label: 'All', value: 'All' },
        { label: 'Facility', value: 'Facility' },
        { label: 'Participant', value: 'Participant' },
        { label: 'Other', value: 'Other' }
    ];
    get facilityIdList() {
        return this.finalListFacilities.map(f => f.value);
    }
     getCurrentWeekRange() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

        // Calculate difference from Monday (if Sunday, treat as 7)
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            start: this.formatDate(monday),  // Monday
            end: this.formatDate(sunday)     // Sunday
        };
    }

    formatDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    async connectedCallback() {
        try {

            const week = this.getCurrentWeekRange();
            this.selectedStartDate = week.start;
            this.selectedEndDate = week.end;
            //console.log('Received Facility ID in Child:', this.facilityId);

            // 1. Initialize week dates
           // this.calculateWeekDates();

            // 2. Fetch logged-in user info
            const userData = await getCurrentLoggedUserInfo();
            console.log('User data =>', JSON.stringify(userData));
            this.userType = userData?.User_Type__c;

            // 3. Fetch all facility options
            const facilityData = await getFacilityData();
            this.facilityOptions = facilityData.map(record => ({
                // label: record.Name,
                value: record.Id
            }));

            // 4. Assign facilities based on user type
            if (['NDIS Org Admin', 'ICT Admin'].includes(this.userType)) {
                this.finalListFacilities = [    
                    ...this.facilityOptions
                ];
                
                console.log('Mapped facility options: ORG ADMIN', JSON.stringify(this.finalListFacilities));
                console.log('Mapped facility LENGTH: ORG ADMIN', this.finalListFacilities.length);

            } else if (['Facility Admin', 'HR Admin', 'Roster Manager'].includes(this.userType)) {
                try {
                    const currentFacilities = await getFacilityCurrentUser();
                    const facilityList = currentFacilities.map(record => ({
                        // label: record.Facility__r.Name,
                        value: record.Facility__r.Id
                    }));

                    this.finalListFacilities = [
                        ...facilityList
                    ];
                   
                    console.log('Mapped facility options: Facility Admin', JSON.stringify(this.finalListFacilities));
                      console.log('Mapped facility LENGTH: Facility ADMIN', this.finalListFacilities.length);


                } catch (error) {
                    this.error = error;
                    this.finalListFacilities = [];
                    console.error('Error fetching facilities for Facility Admin:', error);
                }
            }

            // } else if (['NDIS Staff', 'ICT Staff'].includes(this.userType)) {
            //     try {
            //         const result = await getstaffId({ userId: this.userId });
            //         console.log('NDIS/ICT Staff facility result >>', result);

            //         if (result?.Facility__c && result?.Facility__r?.Name) {
            //             this.facilityValue = result.Facility__c;
            //             // this.facilityLabel = result.Facility__r.Name;

            //             this.finalListFacilities = [
                            
            //                 {
            //                     label: this.facilityLabel,
            //                     value: this.facilityValue
            //                 }
            //             ];

            //             console.log('NDIS/ICT Staff facility from Apex:', JSON.stringify(this.finalListFacilities));
            //         }
            //     } catch (error) {
            //         this.error = error;
            //         this.finalListFacilities = [];
            //         console.error('Error fetching staff data for NDIS/ICT Staff:', error);
            //     }
            // }

          

            // 5. Get roles from organization details and build role options
            const response = await organizationDetails();
            this.orgId = response.listofPriceBook.Id;
            this.orgName = response.listofPriceBook.Name;  
            console.log('Org Id =>', this.orgId);
            console.log('Org Name =>', this.orgName);
            let orgRoles = response.listofPriceBook.Roles__c;
            const roles = orgRoles ? orgRoles.split(';').sort() : [];

            this.roleOptions = [
                { label: 'All', value: 'All' },
                ...roles.map(role => ({
                    label: role,
                    value: role
                }))
            ];

            this.selectedRole = 'All'; // Default role selection
            if(this.totalRecords>0) {
                this.noRecordsFlag=false;
            }else{
                this.noRecordsFlag=true;
            }
        } catch (error) {
            console.error('Error in connectedCallback:', error);
        }
    }
    
    @wire(getShiftWithStaffData, {
        role: '$selectedRole',
        employmentType: '$selectedEmploymentType',
        startWeekDate: '$selectedStartDate',
        endWeekDate: '$selectedEndDate',
        location: '$selectedLocation',
        facilityIds: '$facilityIdList'
    })
    wiredShiftData(result) {
        this.wiredShiftDataResult = result;
        const { data, error } = result;
        console.log('result =>', JSON.stringify(result));
       
        if (data) {
             console.log('data length =>', data.length); 
            this.shiftData = data.map(shift => ({
                Id: shift.Id,
                date: shift.Date__c 
                            ? new Date(shift.Date__c).toLocaleDateString('en-GB') 
                            : 'No Date',
                shiftType: shift.Type_of_shift__c || '',
                // name: shift.Staff_Name__c,
                name: shift.Staff__r.Display_Nickname__c || '',
                scheduledTime: shift.Add_Shift__r.Shift_Start_End_Time__c || '',
                participants: (shift.Services_and_Support_Plans__r || []).map(p => p.Participant_Name__c).join(', ')
                 //participants: shift.Services_and_Support_Plans__r[0].Participant_Name__c
            }));
             
            this.totalRecords = this.shiftData.length;
            this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
            // if (this.totalRecords > 0) {
            //     this.paginationVisible = true;
            // } else{
            //     this.paginationVisible = false;
            // }
            this.paginationHelper();
           
            //this.error = undefined;
        } else  {
            //this.error = error;
            this.shiftData = [];
           // console.error('Error in wired data:', error);
        }
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
        this.shiftDataTable = [];
        if (this.totalRecords > 0) {
            this.paginationVisible = true;
        } else{
            this.paginationVisible = false;
        }
        if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        }
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
       // console.log('total pages '+this.totalPages );
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
               // console.log('break');
                break;
            }  
            let tempConRec = Object.assign({}, this.shiftData[i]);
           
            tempconList.push(tempConRec);           
        }
        this.shiftDataTable = tempconList;  
        //console.log('tempconrec>>'+JSON.stringify(this.invoiceTable));       
    }
    //  fetchShiftData() {
    //     getShiftWithStaffData({
    //         role: this.selectedRole,
    //         employmentType: this.selectedEmploymentType,
    //         startWeekDate: this.selectedStartDate,
    //         endWeekDate: this.selectedEndDate
    //     })
    //     .then(result => {
    //         console.log('result =>', JSON.stringify(result));
    //         this.staffData = result.map(shift => ({
    //             id: shift.Id,
    //             date: shift.Start_Date__c,
    //             shiftType: shift.Shift_Type__c,
    //             name: shift.Staff_Name__c,
    //             // scheduledTime: shift.Duration__c,
    //             // participants: (shift.Services_and_Support_Plans__r || []).map(p => p.Participant_Name__c).join(', ')
    //         }));
    //     })
    //     .catch(error => {
    //         this.error = error;
    //         console.error('Error fetching data:', error);
    //     });
    // }

    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
         console.log(`Updated Field - ${fieldName}:`, fieldValue);
        switch (fieldName) {
            case 'startDate':
                this.selectedStartDate = fieldValue;
                console.log('Start Date changed to:', this.selectedStartDate);
                break;
            case 'endDate':
                this.selectedEndDate = fieldValue;
                console.log('End Date changed to:', this.selectedEndDate);
                break;
            case 'role':
                this.selectedRole = fieldValue;
                console.log('Role changed to:',  this.selectedRole);
                break;
            case 'employmentType':
                this.selectedEmploymentType = fieldValue;
                console.log('Employment Type  changed to:',  this.selectedEmploymentType);
                //this.fetchShiftData();
                break;
            case 'location':
                this.selectedLocation = fieldValue;
                console.log('Location changed to:',  this.selectedLocation);
                break;
            default:
                console.log('Unknown field:', fieldName);
                break;
        }

        // Optional: Add filtering or fetch logic here
    }
    
    handleExport() {
       
        console.log('Exporting Shift Reports Table to CSV');
        var formattedSDate = formatDate(this.selectedStartDate);
        console.log('formattedSDate: ',  formattedSDate);
        var formattedEDate = formatDate(this.selectedEndDate);  
        console.log('formattedEDate: ',  formattedEDate);
        function formatDate(dateStr) {
                var parts = dateStr.split('-');
                return parts[2] + '-' + parts[1] + '-' + parts[0];
            } 

        let csvContent = '';

        // Optional: Add organization header if needed
        csvContent += `"${this.orgName || ''}"\n`;
        console.log('csvContent 1: ',  csvContent);
        // csvContent += `"Address: ${this.orgStreet || ''}, ${this.orgCity || ''}, ${this.stateCode || ''}, ${this.postalCode || ''}, ${this.countryCode || ''}"\n`;
        // csvContent += `"Contact No: ${this.contactNo || ''}"\n`;
        // csvContent += `"ABN: ${this.abn || ''}"\n\n\n`;

        csvContent += '"Shift Report"\n';
        console.log('csvContent 2: ',  csvContent);
        csvContent += `"Start Date: ${formattedSDate || ''} and End Date: ${formattedEDate || ''}"\n\n`;
        console.log('csvContent 3: ',  csvContent);
        // CSV Header matching the table
        csvContent += '"Date","Shift Type","Staff Name","Scheduled Time","Participants"\n';
        console.log('csvContent 4: ',  csvContent);
        //Loop through shifts and build rows
        // this.staffData.forEach(shift => {
        //     csvContent += `"${shift.Start_Date__c || ''}",` +
        //                 `"${shift.Shift_Type__c || ''}",` +
        //                 `"${shift.Staff_Name__c || ''}",` +
        //                 `"${shift.Add_Shift__r.Shift_Start_End_Time__c || ''}",` ;
        //                 // `"${(shift.Services_and_Support_Plans__r || []).map(p => p.Participant_Name__c).join(', ') || ''}",` ;
                       
        // });
        function escapeCSV(value) {
            if (typeof value !== 'string') return value || '';
            // Double quotes inside values must be escaped by doubling them
            return `"${value.replace(/"/g, '""')}"`;
        }
        this.shiftData.forEach((shift, index) => {
            const rawShift = JSON.parse(JSON.stringify(shift));
            console.log(`Raw shift index ${index}:`, rawShift);

            const startDate = rawShift.date || '';
            const shiftType = rawShift.shiftType || '';
            const staffName = rawShift.name || '';
            const shiftTime = rawShift.scheduledTime || '';
            const participant = rawShift.participants || '';
            console.log('Start Date:', startDate);
            console.log('shiftType  :', shiftType);
            console.log('staffName  :', staffName);
            console.log('shiftTime  :', shiftTime);
            console.log('participant:', participant);
            
            //csvContent += `"${startDate}","${shiftType}","${staffName}","${shiftTime}", "${participant}"\n`;
            csvContent += [
                    (startDate),
                    (shiftType),
                    (staffName),
                    (shiftTime),
                    escapeCSV(participant)
                ].join(',') + '\n';
        });

        console.log('csvContent 5: ',  csvContent);
        // Download logic
        const element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        downloadElement.download = 'ShiftReport.csv';
        document.body.appendChild(downloadElement);
        downloadElement.click();
         this.isViewFlag = false;
    }
    handleView(event){
         const shiftId = event.currentTarget.dataset.id;
         // const amazonUrl = event.target.dataset.url;

        console.log('Clicked shift ID:', shiftId);
        this.shiftId = shiftId;
        this.isViewFlag = true;
         console.log('isViewFlag  in handleView: ', this.isViewFlag);
        this.isHome = false;
        console.log('isHome  in handleView: ', this.isHome);
    }
    handleBackNavigate() {
         this.isViewFlag = false; 
         this.isHome = true;
    }
    // handleDownload(event) {
    //     const shiftId = event.currentTarget.dataset.id; 
    //     if (!shiftId) {
    //         console.error('Shift ID not found in dataset');
    //         return;
    //     }

    //     console.log('Clicked shift ID in handleDownload:', shiftId);
    //     const vfPageName = 'ShiftReportsDownloadPdf'; // your Visualforce page name
    //     const baseUrl = window.location.origin; // e.g., https://mydomain.lightning.force.com
 
    //     // Optional: pass parameters if your VF page/controller uses them
    //     const url = `${baseUrl}/apex/${vfPageName}?shiftId=${shiftId}`;
 
    //     // Open the Visualforce PDF page in a new tab
    //     window.open(url, '_blank');
    // }
    handleDownload(event) {
        const shiftId = event.currentTarget.dataset.id;
        if (!shiftId) {
            console.error('Shift ID not found in dataset');
            return;
        }

        console.log('Clicked shift ID in handleDownload:', shiftId);

        // Construct VF domain URL properly
        const vfPageName = 'ShiftReportsDownloadPdf';
        const baseUrl = window.location.origin.replace('.lightning.force.com', '.visual.force.com');
        const url = `${baseUrl}/apex/${vfPageName}?shiftId=${shiftId}`;

        window.open(url, '_blank');
    }
     handleBack() {
        this.selectedStartDate = '';
        this.selectedEndDate = '';
        this.selectedRole = '';
        this.selectedEmploymentType = '';
        this.selectedLocation = '';
        this.isHome = false;

        this.dispatchEvent(new CustomEvent("shiftreportback"));
    }
}