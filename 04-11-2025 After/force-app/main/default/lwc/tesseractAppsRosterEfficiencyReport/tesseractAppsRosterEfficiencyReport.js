import { LightningElement, track, wire, api } from 'lwc';
import getStaffUtilizationData from '@salesforce/apex/StaffUtilizationController.getStaffUtilizationData';
import exportStaffData from '@salesforce/apex/StaffUtilizationController.exportStaffData';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class tesseractAppsRosterEfficiencyReport extends LightningElement {
    
    @track selectedFacility = 'All';
    @track selectedRole = 'All';
    @track selectedEmploymentType = 'All';
    @track selectedStartDate;
    @track selectedEndDate;
    @track currentPage = 1;
    @track isRefreshing = false;
    @track isLoading = true;
    @track staffData = [];
    @track metrics = {};
    @track totalRecords = 0;
    @track totalPages = 0;
    @track startWeekDate = '';
    @track endWeekDate = '';
    @track facilityValue;
    @track facilityOptions = [];
    @track frequencyOptions = [];
    @track finalListFacilities = [];
    @track daysOptions = [];
    @track facilityValue = 'All'; // default selection
    @track roleOptions = [];
    @track selectedRole = 'All';
    @track pageSizeOptions = [10, 20, 50];
    @track selectedfrequency = 'Weekly';
    @track frequencyValue = 'Weekly';
    @track daysValue = 'Pre'
    @track isTemplateActive = true;
    @track isNextDisabled = true;
    @track isPreviousDisabled = false;
    @track isDaysDisabled = false;
    @track status1 = 'All';
    @track selectedStaff = null;
    @track popupPosition = { top: 0, left: 0 };
    @track noRecordsFlag=false;
    @track metrics = {
        underRostered: 0,
        overRostered: 0,
        totalUnallocatedHours: 0,
        totalOvertimeHours: 0
    };
    wiredStaffResponse;

    
    pageSize = 10;

    employmentTypeOptions = [
        { label: 'All', value: 'All' },
        { label: 'Full-time and part-time', value: 'Full-time and part-time' },
        { label: 'Casual', value: 'Casual' }
    ];

    frequencyOptions = [
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Fortnightly', value: 'Fortnightly' },
        { label: 'Monthly', value: 'Monthly' },
        { label: 'Custom Date', value: 'Custom Date' }
    ];

    daysOptions = [
        { label: 'Post Week', value: 'Post' },
        { label: 'Pre Week', value: 'Pre' }
    ];

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
            console.log('Received Facility ID in Child:', this.facilityId);

            // 1. Initialize week dates
            this.calculateWeekDates();

            // 2. Fetch logged-in user info
            const userData = await getCurrentLoggedUserInfo();
            console.log('User data =>', JSON.stringify(userData));
            this.userType = userData?.User_Type__c;

            // 3. Fetch all facility options
            const facilityData = await getFacilityData();
            this.facilityOptions = facilityData.map(record => ({
                label: record.Name,
                value: record.Id
            }));

            // 4. Assign facilities based on user type
            if (['NDIS Org Admin', 'ICT Admin'].includes(this.userType)) {
                this.finalListFacilities = [
                    { label: 'All', value: 'All' },
                    ...this.facilityOptions
                ];
                this.facilityValue = 'All';
                console.log('Mapped facility options: ORG ADMIN', JSON.stringify(this.finalListFacilities));

            } else if (['Facility Admin', 'HR Admin', 'Roster Manager'].includes(this.userType)) {
                try {
                    const currentFacilities = await getFacilityCurrentUser();
                    const facilityList = currentFacilities.map(record => ({
                        label: record.Facility__r.Name,
                        value: record.Facility__r.Id
                    }));

                    this.finalListFacilities = [
                        { label: 'All', value: 'All' },
                        ...facilityList
                    ];
                    this.facilityValue = 'All';
                    console.log('Mapped facility options: Facility Admin', JSON.stringify(this.finalListFacilities));

                } catch (error) {
                    this.error = error;
                    this.finalListFacilities = [];
                    console.error('Error fetching facilities for Facility Admin:', error);
                }

            } else if (['NDIS Staff', 'ICT Staff'].includes(this.userType)) {
                try {
                    const result = await getstaffId({ userId: this.userId });
                    console.log('NDIS/ICT Staff facility result >>', result);

                    if (result?.Facility__c && result?.Facility__r?.Name) {
                        this.facilityValue = result.Facility__c;
                        this.facilityLabel = result.Facility__r.Name;

                        this.finalListFacilities = [
                            { label: 'All', value: 'All' },
                            {
                                label: this.facilityLabel,
                                value: this.facilityValue
                            }
                        ];

                        this.facilityValue = 'All'; // If you want default to "All"

                        console.log('NDIS/ICT Staff facility from Apex:', JSON.stringify(this.finalListFacilities));
                    }

                    // ✅ Step 6: Now refresh wire after everything is ready
                } catch (error) {
                    this.error = error;
                    this.finalListFacilities = [];
                    console.error('Error fetching staff data for NDIS/ICT Staff:', error);
                }
            }

            // ✅ Important: assign finalListFacilities to combobox options
            this.facilityOptions = this.finalListFacilities;

            console.log('Final facility list for combobox:', JSON.stringify(this.facilityOptions));

            // 5. Get roles from organization details and build role options
            const response = await organizationDetails();
            this.orgId = response.listofPriceBook.Id;

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
            this.frequencyValue = 'Weekly';
            /* await this.fetchStaffData(); */
            // this.currentPage = 1; 
            //console.log('Current Page in connectedCallback : ', this.currentPage);
            //console.log('selectedFacility in connectedCallback : ', this.selectedFacility);
             //this.currentPage = this.currentPage;
            //console.log('Current Page after connectedCallback : ', this.currentPage);
             refreshApex(this.wiredStaffResponse);
        } catch (error) {
            console.error('Error in connectedCallback:', error);
        }
    }

    handleStartDateChange(event) {
        this.selectedStartDate = event.target.value;
         console.log('Start Date changed to:', this.selectedStartDate);
        setTimeout(() => {
           
            refreshApex(this.wiredStaffResponse);
        }, 1000); 
        // Optional: Add logic to fetch or filter data based on new start date
    }

    handleEndDateChange(event) {
        this.selectedEndDate = event.target.value;
        console.log('End Date changed to:', this.selectedEndDate);
        setTimeout(() => {
           
            refreshApex(this.wiredStaffResponse);
        }, 1000); 
        // Optional: Add logic to fetch or filter data based on new end date

    }


    /* calculateWeekDates() {
        const selectedDateObj = new Date(this.selectedDate);
        
        // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = selectedDateObj.getDay();
        
        // Calculate start of week (Monday)
        const startDate = new Date(selectedDateObj);
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days, otherwise go back (dayOfWeek - 1) days
        startDate.setDate(selectedDateObj.getDate() - daysToMonday);
        
        // Calculate end of week (Sunday)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        // Format dates as YYYY-MM-DD
        this.startWeekDate = startDate.toISOString().split('T')[0];
        this.endWeekDate = endDate.toISOString().split('T')[0];
        
        console.log('Week Range:', this.startWeekDate, 'to', this.endWeekDate);
    } */

    /* calculateWeekDates() {
        const selectedDateObj = new Date(this.selectedDate);
        let startDate;
        let endDate;

        if (this.selectedfrequency === 'Weekly') {
            if (this.daysValue === 'Post') {
                // Pre Week: from 7 days ago to yesterday
                endDate = new Date(selectedDateObj);
                endDate.setDate(endDate.getDate() - 1);

                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 6);
            } else {
                // Post Week: from today to next 6 days
                startDate = new Date(selectedDateObj);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
            }

        } else if (this.selectedfrequency === 'Fortnightly') {
            const day = selectedDateObj.getDate();
            const year = selectedDateObj.getFullYear();
            const month = selectedDateObj.getMonth();

            if (day <= 15) {
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month, 15);
            } else {
                startDate = new Date(year, month, 16);
                endDate = new Date(year, month + 1, 0);
            }

        } else if (this.selectedfrequency === 'Monthly') {
            const year = selectedDateObj.getFullYear();
            const month = selectedDateObj.getMonth();
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month + 1, 0);
        }

        this.startWeekDate = startDate.toISOString().split('T')[0];
        this.endWeekDate = endDate.toISOString().split('T')[0];

        console.log(`📆 Calculated Range (${this.selectedfrequency} - ${this.daysValue}): ${this.startWeekDate} to ${this.endWeekDate}`);
    } */

    calculateWeekDates() {
        const selectedDateObj = new Date(this.selectedStartDate);
        let startDate;
        let endDate;

        if (this.selectedfrequency === 'Weekly') {
            if (this.daysValue === 'Pre') {
                // Pre Week: 7 days ending yesterday
                endDate = new Date(selectedDateObj);
                endDate.setDate(endDate.getDate() - 1);

                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 6); // 7-day total
            } else {
                // Post Week: 7 days starting today
                startDate = new Date(selectedDateObj);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
            }

        } else if (this.selectedfrequency === 'Fortnightly') {
            if (this.daysValue === 'Pre') {
                // Pre Fortnight: 15 days ending yesterday
                endDate = new Date(selectedDateObj);
                endDate.setDate(endDate.getDate() - 1);

                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 14); // 15-day total
            } else {
                // Post Fortnight: 15 days starting today
                startDate = new Date(selectedDateObj);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 14);
            }

        } else if (this.selectedfrequency === 'Monthly') {
            const year = selectedDateObj.getFullYear();
            const month = selectedDateObj.getMonth();
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month + 1, 0);
        }

        this.startWeekDate = startDate.toISOString().split('T')[0];
        this.endWeekDate = endDate.toISOString().split('T')[0];

        console.log(`📆 Calculated Range (${this.selectedfrequency} - ${this.daysValue}): ${this.startWeekDate} to ${this.endWeekDate}`);
    }

    // async fetchStaffData() {
    //     this.isLoading = true;
    //     this.isRefreshing = true;

    //     try {
    //         const response = await getStaffUtilizationData({
    //             facility: this.selectedFacility,
    //             role: this.selectedRole,
    //             employmentType: this.selectedEmploymentType,
    //             pageNumber: this.currentPage,
    //             pageSize: this.pageSize,
    //             startWeekDate: this.selectedStartDate,
    //             endWeekDate: this.selectedEndDate,
    //             statusforApex: this.status1
    //         });

    //         console.log('response >>', response);
    //         this.staffData = this.processStaffData(response.staffData);
    //         this.metrics = response.metrics;
    //         this.totalRecords = response.totalRecords;
    //         this.totalPages = response.totalPages;
    //         this.currentPage = response.currentPage;
    //     } catch (error) {
    //         this.showToast('Error', 'Error loading staff data: ' + error.body?.message, 'error');
    //         console.error('Error loading staff data:', error);
    //     } finally {
    //         this.isLoading = false;
    //         this.isRefreshing = false;
    //     }
    // }


    // Wire method to fetch data
   @wire(getStaffUtilizationData, {
        facility: '$selectedFacility',
        role: '$selectedRole',
        employmentType: '$selectedEmploymentType',
        pageNumber: '$currentPage',
        pageSize: '$pageSize',
        startWeekDate: '$selectedStartDate',
        endWeekDate: '$selectedEndDate',
        statusforApex: '$status1'
    })
    wiredStaffData(result) {
        console.log('result >>', JSON.stringify(result));
        this.wiredStaffResponse = result;
        const { data, error } = result;
        this.isLoading = false;
        this.isRefreshing = false;
        console.log('  selectedStartDate  in wiredStaffData :', this.selectedStartDate);
        console.log('selectedEndDate in wiredStaffData :', this.selectedEndDate);
        if (data) {
            this.staffData = this.processStaffData(data.staffData);
            this.metrics = data.metrics;
            console.log(' this.metrics >>', JSON.stringify( this.metrics));
            this.totalRecords = data.totalRecords;
            this.totalPages = data.totalPages;
            this.currentPage = data.currentPage;
            if(this.totalRecords>0) {
                this.noRecordsFlag=false;
            }else{
                this.noRecordsFlag=true;
            } 
        } else if (error) {
            this.showToast('Error', 'Error loading staff data: ' + error.body.message, 'error');
            console.error('Error loading staff data:', error);
        }
    }

    // handleRefresh () {
    //     this.currentPage = 1;        
    // }

    processStaffData(data) {
        return data.map(staff => {
            return {
                ...staff,
                rhVarianceClass: this.getRhVarianceClass(staff.rhVariance),
                statusClass: this.getStatusClass(staff.status),
                showRhVariance: staff.rhVariance !== 0
            };
        });
    }

    get underRosteredDisplay() {
        return this.metrics?.underRostered ?? '—';
    }
    get overRosteredDisplay() {
        return this.metrics?.overRostered ?? '—';
    }
    get unallocatedDisplay() {
        return this.metrics?.totalUnallocatedHours ?? '—';
    }
    get overtimeDisplay() {
        return this.metrics?.totalOvertimeHours ?? '—';
    }

    get underRosteredImage() {
        // Replace this with your actual image path (or a Salesforce static resource)
        return 'https://example.com/under-rostered.png';
    }

    get sortedMetrics() {
        if (!this.metrics) {
            return [];
        }

        const over = this.metrics.overRostered || 0;
        const under = this.metrics.underRostered || 0;

        let metricsList = [
            {
                id: 'Under Rostered',
                title: 'Under Rostered',
                value: under,
                className: 'metric-card highlighted'
            },
            {
                id: 'Over Rostered',
                title: 'Over Rostered',
                value: over,
                className: 'metric-card highlighted2'
            },
            {
                id: 'Total Unallocated Hrs',
                title: 'Total Unallocated Hrs',
                value: this.metrics.totalUnallocatedHours || 0,
                className: 'metric-card highlighted1'
            },
            {
                id: 'Total Overtime Hrs',
                title: 'Total Overtime Hrs',
                value: this.metrics.totalOvertimeHours || 0,
                className: 'metric-card highlighted3'
            }
        ];

        if (under < over) {
            [metricsList[0], metricsList[1]] = [metricsList[1], metricsList[0]];
        }

        return metricsList.map(m => {
            return {
                ...m,
                computedClass: `${m.className} ${this.selectedMetricId === m.id ? 'selected' : ''}`,
                showIcon: this.selectedMetricId === m.id
            };
        });
    }

    getRhVarianceClass(variance) {
        if (variance > 0) return 'variance-positive';
        if (variance < 0) return 'variance-negative';
        return 'variance-neutral';
    }

    getStatusClass(status) {
        switch (status) {
            case 'Under Rostered':
                return 'status-badge status-under';
            case 'Over Rostered':
                return 'status-badge status-over';
            case 'Fully Rostered':
                return 'status-badge status-full';
            default:
                return 'status-badge status-default';
        }
    }

    get refreshClass() {
        return this.isRefreshing ? 'refresh-btn spinning' : 'refresh-btn';
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    get paginationInfo() {
        const startRecord = ((this.currentPage - 1) * this.pageSize) + 1;
        const endRecord = Math.min(this.currentPage * this.pageSize, this.totalRecords);
        return `Showing ${startRecord}-${endRecord} of ${this.totalRecords} records`;
    }

    // Event handlers
    handleFacilityChange(event) {
        this.selectedFacility = event.detail.value;
        this.currentPage = 1; // Reset to first page when filtering
       // this.currentPage = this.currentPage;
        console.log('facilityValue  in handleFacilityChange >> ', this.selectedFacility);
       // console.log('currentPage in handleFacilityChange >> ', this.currentPage);
       // refreshApex(this.wiredStaffResponse);
        setTimeout(() => {
            console.log('currentPage in handleFacilityChange >> ', this.currentPage);
            refreshApex(this.wiredStaffResponse);
        }, 500); 
    }

    handlefrequencyChange(event) {
        this.isTemplateActive = true;
        this.isDaysDisabled = false;
        this.selectedfrequency = event.detail.value;
        this.frequencyValue = event.detail.value;
        console.log('this.selectedfrequency >>', this.selectedfrequency);
        
        if (this.frequencyValue === 'Weekly') {
            this.daysOptions = [
                { label: 'Post Week', value: 'Post' },
                { label: 'Pre Week', value: 'Pre' }
            ];
        } else if (this.frequencyValue === 'Fortnightly') {
            this.daysOptions = [
                { label: 'Post Fortnight', value: 'Post' },
                { label: 'Pre Fortnight', value: 'Pre' }
            ];
        } else if (this.frequencyValue === 'Monthly') {
            this.daysOptions = [
                { label: 'Post Month', value: 'Post' },
                { label: 'Pre Month', value: 'Pre' }
            ];
        } else if (this.frequencyValue === 'Custom Date') {
            this.isDaysDisabled = true;
            this.isTemplateActive = false;
            // Reset days selection
            this.daysValue = '';
            this.daysOptions = [
                { label: 'Before Selected Date', value: 'Pre' },
                { label: 'After Selected Date', value: 'Post' }
            ];
        } else {
            this.daysOptions = [];
        }
        this.calculateWeekDates();
        //this.currentPage = 1; // Reset to first page when filtering
    }

    handledaysChange(event) {
        this.daysValue = event.detail.value;
        console.log('Selected Day Direction:', this.daysValue);

        if (this.daysValue === 'Pre') {
            this.isNextDisabled = true;
            this.isPreviousDisabled = false;
        } else if (this.daysValue === 'Post') {
            this.isNextDisabled = false;
            this.isPreviousDisabled = true;
        } else {
            // Default: enable both
            this.isNextDisabled = false;
            this.isPreviousDisabled = false;
        }
        this.calculateWeekDates();
    }


    handleRoleChange(event) {
        this.selectedRole = event.detail.value;
       // this.currentPage = 1; // Reset to first page when filtering
        setTimeout(() => {
            this.currentPage = 1; // Reset to first page when filtering
            refreshApex(this.wiredStaffResponse);
        }, 500); 
    }

    handleEmploymentTypeChange(event) {
        this.selectedEmploymentType = event.detail.value;
       // this.currentPage = 1; // Reset to first page when filtering
        setTimeout(() => {
            this.currentPage = 1; // Reset to first page when filtering
            refreshApex(this.wiredStaffResponse);
        }, 500); 
    }

    handleDateChange(event) {
        this.selectedStartDate = event.detail.value;
        this.calculateWeekDates(); // ✅ will respect Pre/Post via daysValue
        this.currentPage = 1;
    }

    /* handlePreviousDate() {
        const currentDate = new Date(this.selectedDate);
        currentDate.setDate(currentDate.getDate() - 7);
        this.selectedDate = currentDate.toISOString().split('T')[0];
        this.calculateWeekDates();
        this.currentPage = 1;
    } */

    /* handleNextDate() {
        const currentDate = new Date(this.selectedDate);
        currentDate.setDate(currentDate.getDate() + 7);
        this.selectedDate = currentDate.toISOString().split('T')[0];
        this.calculateWeekDates();
        this.currentPage = 1;
    } */

    handleNextDate() {
        const currentDate = new Date(this.selectedStartDate);
        console.log('📍 Current selectedDate before Next:', this.selectedStartDate);

        if (this.selectedfrequency === 'Weekly') {
            currentDate.setDate(currentDate.getDate() + 7); // Move 7 days forward
            console.log('➡️ Weekly: Moving forward 7 days');
        } else if (this.selectedfrequency === 'Fortnightly') {
            currentDate.setDate(currentDate.getDate() + 15); // Move 15 days forward
            console.log('➡️ Fortnightly: Moving forward 15 days');
        }

        this.selectedStartDate = currentDate.toISOString().split('T')[0];
        console.log('✅ New selectedStartDate after Next:', this.selectedStartDate);

        this.calculateWeekDates(); 
        this.currentPage = 1;
    }

    handlePreviousDate() {
        const currentDate = new Date(this.selectedStartDate);
        console.log('📍 Current selectedStartDate before Previous:', this.selectedStartDate);

        if (this.selectedfrequency === 'Weekly') {
            currentDate.setDate(currentDate.getDate() - 7); // Move 7 days back
            console.log('⬅️ Weekly: Moving back 7 days');
        } else if (this.selectedfrequency === 'Fortnightly') {
            currentDate.setDate(currentDate.getDate() - 15); // Move 15 days back
            console.log('⬅️ Fortnightly: Moving back 15 days');
        }

        this.selectedStartDate = currentDate.toISOString().split('T')[0];
        console.log('✅ New selectedStartDate after Previous:', this.selectedStartDate);

        this.calculateWeekDates();
        this.currentPage = 1;
    }

    handleFilter() {
        this.isLoading = true;
        this.currentPage = 1;
        // Wire method will automatically refresh with new parameters
    }

    handleRefresh() {
        //this.isRefreshing = true;
        // Force refresh by updating a tracked property
       // this.currentPage = this.currentPage;
       //this.currentPage = 1;
        refreshApex(this.wiredStaffResponse); 
    }

    get datePickerStyle() {
        return 'width: 40%;';
    }

    handleExport = async () => {
        try {
            const csvData = await exportStaffData({
                facility: this.selectedFacility,
                role: this.selectedRole,
                employmentType: this.selectedEmploymentType,
                startWeekDate: this.selectedStartDate,
                endWeekDate: this.selectedEndDate,
                statusforApex: this.status1
            });

            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'staff_utilization_data.csv';
            link.click();
            window.URL.revokeObjectURL(url);

            this.showToast('Success', 'Staff data exported successfully', 'success');
        } catch (error) {
            this.showToast('Error', 'Error exporting data: ' + error.body.message, 'error');
        }
    }

    handleFirstPage() {
        this.currentPage = 1;
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
        // setTimeout(() => {
        //     console.log('currentPage in Next click >> ', this.currentPage);
        //     refreshApex(this.wiredStaffResponse);
        // }, 1000); 
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            console.log('facilityValue  in Next click >> ', this.selectedFacility);
        }

        if(this.currentPage == this.totalPages){
            this.isLastPage = true;
        }
        setTimeout(() => {
            console.log('currentPage in Next click >> ', this.currentPage);
           
            refreshApex(this.wiredStaffResponse);
        }, 1000); 
    }

    handleLastPage() {
        this.currentPage = this.totalPages;
        if(this.currentPage == this.totalPages){
            this.isLastPage = true;
        }
    }

    handleRecordsPerPage(event){
        this.pageSize = event.target.value;
    }

    handleBack() {
        this.selectedFacility = '';
        this.selectedRole = '';
        this.selectedEmploymentType = '';
        this.currentPage = '';
        this.pageSize = '';
        this.startWeekDate = '';
        this.endWeekDate = '';

        this.dispatchEvent(new CustomEvent("underoverroastingback"));
    }

    @api metrics;
    selectedMetricId;

    handleMetricClick(event) {
        const metricId = event.currentTarget.dataset.id;

        if (this.selectedMetricId === metricId) {
            // If already selected, deselect it
            this.selectedMetricId = 'All';
            console.log('Deselected metric:', metricId);
        } else {
            this.selectedMetricId = metricId;
            console.log('Selected metric:', metricId);
        }

        console.log('this.selectedMetricId:', this.selectedMetricId);
        this.status1 = this.selectedMetricId;
        this.currentPage = 1;
        console.log('this.status1:', this.status1);
    }

    async handleStaffClick(event) {      
        try {
            const staffId = event.currentTarget.dataset.id;
            console.log('Clicked Staff ID:', staffId);
            // Call Apex method to get detailed staff information
            /* const staffDetail = await getStaffDetailsById({ staffId: staffId });
            console.log('staffDetail:', JSON.stringify(staffDetail));
            if (staffDetail) {
                 const rect = event.target.getBoundingClientRect();
                const tableContainer = this.template.querySelector('.table-container');
                const containerRect = tableContainer.getBoundingClientRect();
                
                this.popupPosition = {
                    top: rect.top - containerRect.top - 50,
                    left: rect.right - containerRect.left + 20
                };
                
                // Set the selected staff with additional details from Apex
                this.selectedStaff = {
                    ...staffDetail,
                    statusClass: this.getStatusClass(staffDetail.status),
                    rhVarianceClass: this.getVarianceClass(staffDetail.rhVariance),
                    chVarianceClass: this.getVarianceClass(staffDetail.chVariance)
                }; 
                this.isPopupOpen = true;
            } */
        } catch (error) {
            this.showToast('Error', 'Error loading staff details: ' + error.body.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    closePopup() {
        this.selectedStaff = null;
        this.note = '';
        this.isPopupOpen = false;
    }


    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}