import { LightningElement, api, track } from 'lwc';
import getRolesByFacilities from '@salesforce/apex/SmartReportsHandler.getRolesByFacilities';
import getStaffByFacilityAndRoles from '@salesforce/apex/SmartReportsHandler.getStaffByFacilityAndRoles';
import getShiftWithSmartStaffData from '@salesforce/apex/SmartReportsHandler.getShiftWithSmartStaffData';
import getRejectedShiftsForSmartReports from '@salesforce/apex/SmartReportsHandler.getRejectedShiftsForSmartReports';
import getAllReimbursements from '@salesforce/apex/SmartReportsHandler.getAllReimbursements'; 
import fetchStaffs from '@salesforce/apex/SmartReportsHandler.fetchStaffs';
import fetchFacilitiess from '@salesforce/apex/SmartReportsHandler.fetchFacilitiess';
import getStaffUtilizationData from '@salesforce/apex/SmartReportsHandler.getStaffUtilizationData';
import createFavorite from '@salesforce/apex/SmartReportsHandler.createFavorite';
import deleteFavorite from '@salesforce/apex/SmartReportsHandler.deleteFavorite';
import getFavoriteReports from '@salesforce/apex/SmartReportsHandler.getFavoriteReports';
import createShiftReportLog from '@salesforce/apex/SmartReportsHandler.createShiftReportLog';
import getReportExportLogs from '@salesforce/apex/SmartReportsHandler.getReportExportLogs';
import getAllReportExportLogs from '@salesforce/apex/SmartReportsHandler.getAllReportExportLogs';
import processStaffSelection from '@salesforce/apex/SmartReportsHandler.processStaffSelection';
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import sendFacilityToApex from '@salesforce/apex/SmartReportsHandler.sendFacilityToApex';

import getTemplatesByFacility from '@salesforce/apex/SmartReportsHandler.getTemplatesByFacility';
import createTemplate from '@salesforce/apex/SmartReportsHandler.createTemplate';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDFLib from "@salesforce/resourceUrl/jspdf";
import autoTable from "@salesforce/resourceUrl/autotable";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CustomReportLwc extends LightningElement {
    @api orgid;
    @track searchStaffflag = false;
    @track isMenuContainer = true;
    @track reportTypeValue;
    @track generatereport = true;
    @track isStaffBasedReport = false;
    @track isAllStaff = false;
    @track isIndividualStaff = false;
    @track selectedStaffId;
    @track roleCheckboxes = [];
    @track selectedFacilityId;
    @track selectedEmploymentType = '';
    @track selectedLocation = '';
    @track selectedDateRange = '';
    @track startDate = '';
    @track endDate = '';
    @track staffList = [];
    @track filteredRecords = [];
    @track reportSummary = {};
    @track isCustomRange = false;
    @track isShiftReport = false;
    @track selectedRoles = [];
    @track filteredStaffList = [];
    @track showStaffDropdown = false;
    @track selectedStaffName = '';
    @track isBuilderView = true;
    @track isResultView = false;
    @track recordsToDisplay = [];
    @track paginationVisible = false;
    @track selectedReport = null;
    @track isReportContainer = true;
    @track pageSizeOptions = [10, 20, 50];
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track pageSize = 10;
    @track bDisableFirst = true;
    @track bDisableLast  = true;
    @track isDropdownOpen = false;
    @track isStaffBasedReportshowModal = false;
    @track templatesforShiftReport = [];
    @track sections = [];
    @track selectedTemplateId;
    @track newTemplateName = '';
    @track isCreatingTemplate = false;
    @track previousTemplateId;
    @track isExportPopupOpen = false;
    @track selectedExportType = '';
    @track headingName= '';
    @track rejectedRecordsToDisplay = [];
    @track rejectedPageNumber = 1;
    @track rejectedPageSize = 10;
    @track rejectedTotalPages = 0;
    @track rejectedTotalRecords = 0;
    @track rejectedPaginationVisible = false;
    @track rejectedDisableFirst = true;
    @track rejectedDisableLast = true;
    @track isRejectedShiftReport = false;
    @track isStaffBasedReport1 = false;
    @track reimbursementflag = false;
    @track statusValue = '';
    @track reimbursementAllRecords = [];
    @track reimbursementRecordsToDisplay = [];
    @track reimbursementPageNumber = 1;
    @track reimbursementPageSize = 10;
    @track reimbursementTotalPages = 0;
    @track reimbursementTotalRecords = 0;
    @track reimbursementDisableFirst = true;
    @track reimbursementDisableLast  = true;
    @track staffListflag = false;
    @track selectedstaffStatus = '';
    @track staffAllRecords = [];
    @track staffRecordsToDisplay = [];
    @track staffPageNumber = 1;
    @track staffPageSize = 10;
    @track staffTotalPages = 0;
    @track staffTotalRecords = 0;
    @track staffDisableFirst = true;
    @track staffDisableLast = true;
    @track participantflag = false;
    @track participantAllRecords = [];
    @track participantRecordsToDisplay = [];
    @track participantPageNumber = 1;
    @track participantPageSize = 10;
    @track participantTotalPages = 0;
    @track participantTotalRecords = 0;
    @track participantDisableFirst = true;
    @track participantDisableLast = true;
    @track isunderandOverReport = false;
    @track underOverAllRecords = [];
    @track underOverRecordsToDisplay = [];
    @track underOverPageNumber = 1;
    @track underOverPageSize = 10;
    @track underOverTotalPages = 0;
    @track underOverTotalRecords = 0;
    @track underOverDisableFirst = true;
    @track underOverDisableLast = true;
    @track favoritesflag = true;
    underOverPageSizeOptions = [10, 20, 50];
    participantPageSizeOptions = [10, 20, 50];
    staffPageSizeOptions = [10, 20, 50];
    reimbursementPageSizeOptions = [10, 20, 50];
    rejectedPageSizeOptions = [10, 20, 50];
    jsPDFInitialized = false;
    @track favoriteReports = [];
    @track generatedReports = [];
    @track favoriteRows = [];
    @track isFavorite = false;
    @track favoriteText = 'Add to favorite';
    @track favoriteClass = '';
    @track selectedFavoriteId;
    @track generatedReports = [];      // last 5
    @track allGeneratedReports = [];   // full history
    @track isExpandedView = false; 
    @track disableAllFirst = true;
    @track disableAllLast = false;
    @track facilityOptions =[];
    @track isDownloadOpen = false;
    @track rejectedsearchStaffflag = false;
    @track selectedFacilityIds = []; 
    @track rejectedflagFliters = false;
    selectedfacility = [];
    dragStartIndex = null;
    @track reportList = [
        { label: 'Shift Reports', value: 'SHIFT' },
        { label: 'Rejected Shift Reports', value: 'REJECTED_SHIFT' },/* 
        { label: 'Over/Under Efficiency Reports', value: 'OVER_EFF' },  */
        { label: 'Staff List Reports', value: 'STAFF' },
        { label: 'Participant Reports', value: 'PARTICIPANT' },
        { label: 'Reimbursement Reports', value: 'REIMBURSEMENT'}
    ];
    @track statusOptions = [
        { label: 'All', value: 'All' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Approved', value: 'Approved' }
    ];
    @track employmentTypeOptions = [
        { label: 'All', value: 'All' },
        { label: 'Full-time and part-time', value: 'Full-time and part-time' },
        { label: 'Casual', value: 'Casual' }
    ];
    @track locationOptions = [
        { label: 'All', value: 'All' },
        { label: 'Facility', value: 'Facility' },
        { label: 'Participant', value: 'Participant' },
        { label: 'Other', value: 'Other' }
    ];
    @track dateRangeOptions = [
        { label: 'Today', value: 'TODAY' },
        { label: 'Yesterday', value: 'YESTERDAY' },
        { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
        { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
        { label: 'This Month', value: 'THIS_MONTH' },
        { label: 'Last Month', value: 'LAST_MONTH' },
        { label: 'Last 3 Months', value: 'LAST_3_MONTHS' },
        { label: 'Last 6 Months', value: 'LAST_6_MONTHS' },
        { label: 'This Year', value: 'THIS_YEAR' },
        { label: 'Custom Range', value: 'CUSTOM' }
    ];
    @track staffStstusOptions = [
        { label: 'All', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'InActive', value: 'InActive' }
    ];
    @track staffOptions = [
        { label: 'All Staff', value: 'all' },
        { label: 'Individual Staff', value: 'individual' }
    ];
    @track pagedGeneratedReports = [];
    @track paginatedAllReports = [];


  
    shiftOnlyKeys = [
        'Staff Name',
        'Date',
        'Shift Type',
        'Shift Time',
        'Role',
        'Participants',
        'Status'
    ];

    templateKeyToFieldMap = {

        // ---------------- SHIFT ----------------
        STAFF_NAME: 'staffName',
        DATE: 'date',
        SHIFT_TYPE: 'shiftType',
        SHIFT_TIME: 'shiftTime',
        ROLE: 'role',
        PARTICIPANTS: 'participants',
        STATUS: 'status',

        // ---------------- REJECTED SHIFT ----------------
        FACILITY: 'facility',
        TIMINGS: 'timings',
        COMMENTS: 'comments',
        PARTICIPANT: 'participant',
        REJECTED_DATE: 'rejectedDate',
        REASSIGNED_TO: 'reassignedStaffName',
        REASSIGNED_DATE: 'reassignedDate',

        // ---------------- REIMBURSEMENT ----------------
        RES_NO: 'Name',
        REIMB_STAFF: 'ShiftwithStaff__r.Staff__r.NameToDisplay__c',
        REIMB_SHIFT_DATE: 'ShiftDate__c',
        REIMB_MILEAGE_KM: 'Mileage_Others__c',
        REIMB_VEHICLE_TYPE: 'Type_of_Vehicle__c',
        REIMB_COST_PER_KM: 'Cost_per_KM__c',
        REIMB_MILEAGE_AMOUNT: 'Mileage_Amount__c',
        REIMB_AMOUNT: 'Amount__c',
        REIMB_TOTAL_AMOUNT: 'Total_Amount__c',
        REIMB_STATUS: 'Approval_Status__c',
        REIMB_APPROVED_DATE: 'Approved_Date__c',

        // ✅ ---------------- STAFF (FIXED) ----------------
        STAFF_NAME: 'staffName',
        EMAIL: 'email',
        CONTACT_NUMBER: 'contactNumber',
        GENDER: 'gender',
        DOB: 'dob',
        STATUS: 'status',

        // ---------------- PARTICIPANT ----------------
        PARTICIPANT_NAME: 'Display_Nickname__c',
        PARTICIPANT_EMAIL: 'Email__c',
        PARTICIPANT_CONTACT: 'Contact_Number__c',
        PARTICIPANT_GENDER: 'Gendar__c',   // ⚠️ correct spelling
        PARTICIPANT_TYPE: 'ParticipantType__c',
        PARTICIPANT_STATUS: 'Participant_Status__c',

        // ---------------- UNDER / OVER (EFFICIENCY) ----------------
        SET_HOURS: 'setHours',
        ROSTERED_HOURS: 'rosteredHours',
        COMPLETED_HOURS: 'completedHours',
        RH_VARIANCE: 'rhVariance',
        CH_VARIANCE: 'chVariance',

    };

    templateKeyToLabelMap = {
        // SHIFT
        STAFF_NAME: 'Staff Name',
        DATE: 'Date',
        SHIFT_TYPE: 'Shift Type',
        SHIFT_TIME: 'Shift Time',
        ROLE: 'Role',
        PARTICIPANTS: 'Participants',
        STATUS: 'Status',

        // REJECTED SHIFT
        FACILITY: 'Facility',
        TIMINGS: 'Timings',
        COMMENTS: 'Comments',
        PARTICIPANT: 'Participant Name',
        REJECTED_DATE: 'Rejected Date',
        REASSIGNED_TO: 'Reassigned To',
        REASSIGNED_DATE: 'Reassigned Time',

        // REIMBURSEMENT
        RES_NO: 'Res No',
        REIMB_STAFF: 'Staff',
        REIMB_SHIFT_DATE: 'Shift Date',
        REIMB_MILEAGE_KM: 'Mileage in KM’s',
        REIMB_VEHICLE_TYPE: 'Type of Vehicle',
        REIMB_COST_PER_KM: 'Cost per KM',
        REIMB_MILEAGE_AMOUNT: 'Mileage Amount',
        REIMB_AMOUNT: 'Amount',
        REIMB_TOTAL_AMOUNT: 'Total Amount',
        REIMB_STATUS: 'Status',
        REIMB_APPROVED_DATE: 'Approved Date',

        // ✅ STAFF (add only these)
        EMAIL: 'Email',
        CONTACT_NUMBER: 'Contact Number',
        GENDER: 'Gender',
        DOB: 'Date of Birth',

        // ---------------- PARTICIPANT ----------------
        PARTICIPANT_NAME: 'Participant Name',
        PARTICIPANT_EMAIL: 'Email',
        PARTICIPANT_CONTACT: 'Contact Number',
        PARTICIPANT_GENDER: 'Gender',
        PARTICIPANT_TYPE: 'Participant Type',
        PARTICIPANT_STATUS: 'Status',

        // ---------------- UNDER / OVER ----------------
        SET_HOURS: 'Set Hrs(SH)',
        ROSTERED_HOURS: 'Rostered Hrs(RH)',
        COMPLETED_HOURS: 'Completed Hrs(CH)',
        RH_VARIANCE: 'RH Variance(RH-SH)',
        CH_VARIANCE: 'CH Variance(CH-SH)',

    };

    reportTypes = {
        'Shift Report': 'Shift',
        'Timesheet Report': 'Timesheet',
        'Rejected Shifts': 'Rejected',
        'Roster Efficiency': 'Efficiency',
        'Incident Register': 'Incident',
        'Efficiency': 'Performance',
        'Staff List': 'Staff',
        'Participant': 'Participant',
        'Facility': 'Facility',
        'HR': 'HR'
    };

    initializeReports() {

        console.log('========== INITIALIZE FAVORITE REPORTS START ==========');
        console.log('Selected Facility Id:', this.selectedFacilityId);

        if (!this.selectedFacilityId) {
            console.warn('No Facility Id found. Skipping favorite fetch.');
            return;
        }

        getFavoriteReports({
            facilityId: this.selectedFacilityId
        })
        .then(result => {

            console.log('Raw Apex Result:', JSON.parse(JSON.stringify(result)));
            console.log('Total Records Returned:', result?.length);

            if (!result || result.length === 0) {
                console.warn('No Favorite Reports Found For Facility');
                this.favoriteReports = [];
                this.organizeFavoriteRows();
                return;
            }

            this.favoriteReports = result.map(record => {

                console.log('----------------------------------');
                console.log('Processing Record Id:', record.Id);
                console.log('Report Type Value:', record.Report_Type__c);
                console.log('Filters JSON Raw:', record.Filters_JSON__c);

                let parsedFilters = {};

                try {
                    parsedFilters = JSON.parse(record.Filters_JSON__c);
                    console.log('Parsed Filters:', parsedFilters);
                } catch (e) {
                    console.error('JSON parse error for record:', record.Id, e);
                }

                // Find label from reportList
                const reportMeta = this.reportList.find(
                    r => r.value === record.Report_Type__c
                );

                console.log('Matched Report Metadata:', reportMeta);

                const reportLabel = reportMeta 
                    ? reportMeta.label 
                    : record.Report_Type__c;

                console.log('Final Report Label:', reportLabel);

                const criteriaText = this.buildCriteriaText(parsedFilters);
                console.log('Generated Criteria Text:', criteriaText);

                return {
                    id: record.Id,
                    name: reportLabel,
                    criteria: criteriaText,
                    type: record.Report_Type__c,
                    filters: parsedFilters
                };
            });

            console.log('Final Favorite Reports Array:', JSON.parse(JSON.stringify(this.favoriteReports)));

            this.organizeFavoriteRows();

            console.log('Favorite Rows After Organizing:', JSON.parse(JSON.stringify(this.favoriteRows)));

            console.log('========== INITIALIZE FAVORITE REPORTS END ==========');

        })
        .catch(error => {
            console.error('Error loading favorites:', error);
            console.log('========== INITIALIZE FAVORITE REPORTS ERROR ==========');
        });
    }

    buildCriteriaText(filters) {

        let parts = [];

        if (filters.isAllStaff) {
            parts.push('All Staff');
        }

        if (filters.isIndividualStaff && filters.staffName) {
            parts.push(filters.staffName);
        }

        if (filters.selectedDateRange) {
            parts.push(this.getDateRangeLabel(filters.selectedDateRange));
        }

        if (filters.location) {
            parts.push(filters.location);
        }

        return parts.join(', ');
    }

    organizeFavoriteRows() {
        const rows = [];
        const cardsPerRow = 5;
        const totalReports = this.favoriteReports.length;
        const numberOfRows = Math.ceil(totalReports / cardsPerRow);

        for (let i = 0; i < numberOfRows; i++) {
            const startIndex = i * cardsPerRow;
            const endIndex = Math.min(startIndex + cardsPerRow, totalReports);
            const rowReports = this.favoriteReports.slice(startIndex, endIndex);

            rows.push({
                rowId: `row-${i}`,
                rowIndex: i,
                reports: rowReports,
                cardsInRow: rowReports.length,
                isFirstRow: i === 0,
                isLastRow: i === numberOfRows - 1
            });
        }

        this.favoriteRows = rows;
    }

    // initializeGeneratedReports() {

    //     getReportExportLogs({ facilityId: this.selectedFacilityId })
    //         .then(result => {

    //             // total count (for header: "5 of 27")
    //             this.generatedCount = result.totalCount;

    //             // actual records
    //             const logs = result.logs || [];

    //             this.generatedReports = logs.map(row => {
    //                 return {
    //                     id: row.Id,
    //                     name: this.getReportTypeLabel(row.Report_Type__c),
    //                     exportType: row.Export_Type__c,
    //                     dateRange: this.getDateRangeLabel(row.Date_Range__c),
    //                     generatedDate: this.formatDateTime(row.Exported_On__c),
    //                     generatedBy: `${row.CreatedBy?.FirstName || ''} ${row.CreatedBy?.LastName || ''}`.trim()
    //                 };
    //             });

    //             console.log('Total Records:', this.generatedCount);
    //             console.log('Generated Reports:', this.generatedReports);
    //         })
    //         .catch(error => {
    //             console.error('Failed to fetch export logs', error);
    //         });
    // }

    initializeGeneratedReports() {

        getReportExportLogs({ facilityId: this.selectedFacilityIdforgenerated })
            .then(result => {

                /* ===============================
                HEADER COUNT
                =============================== */

                this.generatedCount = result.totalCount;

                const logs = result.logs || [];

                /* ===============================
                STORE FULL DATASET
                =============================== */

                this.generatedReports = logs.map(row => {
                    return {
                        id: row.Id,
                        name: this.getReportTypeLabel(row.Report_Type__c),
                        exportType: row.Export_Type__c,
                        dateRange: this.getDateRangeLabel(row.Date_Range__c),
                        generatedDate: this.formatDateTime(row.Exported_On__c),
                        generatedBy: `${row.CreatedBy?.FirstName || ''} ${row.CreatedBy?.LastName || ''}`.trim(),
                        filterKey: row.Filter_Key__c,
                        filtersJson: row.Filters_JSON__c
                    };
                });

                console.log('Total Records:', this.generatedCount);
                console.log('Generated Reports:', this.generatedReports);

                /* ===============================
                INITIALIZE PAGINATION
                =============================== */

                this.generatedPageNumber = 1;

                this.generatedTotalRecords = this.generatedReports.length;

                this.generatedTotalPages =
                    Math.ceil(this.generatedTotalRecords / this.generatedPageSize) || 1;

                this.updateGeneratedReportsPagination();

            })
            .catch(error => {
                console.error('Failed to fetch export logs', error);
            });
    }
    
    
    /* ======================================================
    GENERATED REPORT PAGINATION
    ====================================================== */
    updateGeneratedPagination() {

        const dataList = Array.isArray(this.generatedReports)
            ? this.generatedReports
            : [];

        this.totalRecords = dataList.length;

        this.totalPages =
            this.pageSize > 0
                ? Math.ceil(this.totalRecords / this.pageSize)
                : 1;

        // Safety bounds
        if (this.pageNumber < 1) {
            this.pageNumber = 1;
        }

        if (this.pageNumber > this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        const startIdx =
            (this.pageNumber - 1) * this.pageSize;

        const endIdx =
            this.pageNumber * this.pageSize;

        // ✅ TABLE DATA
        this.pagedGeneratedReports =
            dataList.slice(startIdx, endIdx);

        // ✅ BUTTON STATES
        this.disableAllFirst = this.pageNumber <= 1;
        this.disableAllLast =
            this.pageNumber >= this.totalPages;

        console.log('Generated Pagination =>', {
            page: this.pageNumber,
            size: this.pageSize,
            total: this.totalRecords,
            showing: this.pagedGeneratedReports.length
        });
    }    

    getReportTypeLabel(value) {
        if (!value) return '—';

        const option = this.reportList.find(opt => opt.value === value);
        return option ? option.label : value;
    }

    getDateRangeLabel(value) {
        if (!value) return '—';

        const option = this.dateRangeOptions.find(opt => opt.value === value);
        return option ? option.label : value;
    }

    formatDateTime(dateStr) {
        if (!dateStr) return '';

        const d = new Date(dateStr);

        const datePart = d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        let timePart = d.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Force AM/PM uppercase
        timePart = timePart.replace('am', 'AM').replace('pm', 'PM');

        return `${datePart}, ${timePart}`;
    }

    get favoritesGridStyle() {
        const count = this.favoriteReports.length;
        let gridTemplateColumns;
        
        if (count <= 3) {
            // For 1-3 reports, make columns wider
            const width = `${100 / count}%`;
            gridTemplateColumns = `repeat(${count}, ${width})`;
        } else {
            // For 4-10 reports, use fractional units
            gridTemplateColumns = `repeat(${count}, 1fr)`;
        }
        
        return `display: grid; grid-template-columns: ${gridTemplateColumns}; gap: 1rem;`;
    }

    // Individual card style based on position and count
    get reportCardStyle() {
        const count = this.favoriteReports.length;
        let maxWidth = 'none';
        
        if (count === 3) {
            maxWidth = '350px'; // Wider cards for 3 items
        } else if (count === 4) {
            maxWidth = '300px'; // Slightly smaller for 4 items
        } else if (count >= 5) {
            maxWidth = '280px'; // Standard size for 5+ items
        }
        
        return `max-width: ${maxWidth}; width: 100%;`;
    }

    // Computed properties
    get favoriteCount() {
        return this.favoriteReports.length;
    }

    get hasFavorites() {
        return this.favoriteReports.length > 0;
    }

    get hasGeneratedReports() {
        return this.generatedReports && this.generatedReports.length > 0;
    }

    get hasAllGeneratedReports() {
        return this.allGeneratedReports && this.allGeneratedReports.length > 0;
    }

    getRowStyle(row) {
        const cardsInRow = row.cardsInRow;
        // Each card takes equal width (100% / 5 = 20% per card)
        // But we only show the actual number of cards
        return `grid-template-columns: repeat(${cardsInRow}, 1fr);`;
    }

    // Handlers
    handleView(event) {
        const reportId = event.currentTarget.dataset.id;
        // eslint-disable-next-line no-alert
        alert(`Viewing report: ${reportId}`);
    }

    handleExpand(event) {
        event.preventDefault();

        getAllReportExportLogs({ facilityId: this.selectedFacilityId })
            .then(data => {

                this.allGeneratedReports = data.map(row => {
                    return {
                        id: row.Id,
                        generatedBy: `${row.CreatedBy?.FirstName || ''} ${row.CreatedBy?.LastName || ''}`.trim(),
                        name: this.getReportTypeLabel(row.Report_Type__c),
                        criteria: 'Facility Export',
                        exportType: row.Export_Type__c,
                        dateRange: this.getDateRangeLabel(row.Date_Range__c),
                        generatedDate: this.formatDateTime(row.CreatedDate)
                    };
                });

                this.isExpandedView = true;
                this.totalRecords = this.allGeneratedReports.length;
                this.pageNumber = 1;

                this.setupPagination();

                console.log('Full History Loaded:', this.allGeneratedReports);
            })
            .catch(error => {
                console.error('Failed to load expanded reports', error);
            });
    }

    // Method to update favorite reports dynamically
    updateFavoriteReports(newReports) {
        if (newReports && newReports.length >= 1 && newReports.length <= 10) {
            this.favoriteReports = newReports;
            this.organizeFavoriteRows();
        }
    }

    async connectedCallback() {
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        document.addEventListener('click', this.handleOutsideClick);
        this._handleStaffOutsideClick = this.handleStaffOutsideClick.bind(this);
        document.addEventListener('click', this._handleStaffOutsideClick);
        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        console.log('storedFacilityId >>', storedFacilityId);
        console.log('storedFacilityLabel >>', storedFacilityLabel);
        this.selectedFacilityId = storedFacilityId;
        this.selectedFacilityLabel = storedFacilityLabel;
        this.selectedFacilityIdforgenerated = storedFacilityId;
        console.log('selectedFacilityId >>', this.selectedFacilityId);
        console.log('storedFacilityLabel >>', this.selectedFacilityLabel);
        this.initializeReports();
        this.initializeGeneratedReports();
        this.fetchStaff();
        const facilityData = await getFacilityData();
        console.log("Facility data fetched successfully:", facilityData);
        this.finalListFacilities = [];
        this.selectedFacilities = [];
        this.facilityOptions = facilityData.map((record) => ({
        label: record.Name,
        value: record.Id,
        participantPreferredName: record.Participant_Preferred_Name_Formla__c,
        facilityPreferredName: record.Facility_Preferred_Name_Formula__c,
        staffPreferredName: record.Staff_Preferred_Name_Formula__c
        }));
        console.log("Facility data fetched successfully:", JSON.stringify(this.facilityOptions ));

        if (this.jsPDFInitialized) {
            return;
        }

        Promise.all([
            loadScript(this, jsPDFLib),
            loadScript(this, autoTable)
        ])
        .then(() => {
            this.jsPDFInitialized = true;
            console.log("✅ jsPDF and autoTable loaded successfully");
        })
        .catch((error) => {
            console.error("❌ Error loading jsPDF or autoTable:", error);
        });


        const today = new Date().toISOString().split('T')[0];
        this.startDate = today;
        this.endDate = today;

        console.log('Default dates set in connectedCallback =>', {
            startDate: this.startDate,
            endDate: this.endDate
        });

        this.staffPreferredName =
            localStorage.getItem('defaultStaffPreferredName') || 'Staff';

        this.facilityPreferredName =
            localStorage.getItem('defaultFacilityPreferredName') || 'Facility';

        this.participantPreferredName =
            localStorage.getItem('defaultParticipantPreferredName') || 'Participant';

        console.log(
            'Preferred Names:',
            this.staffPreferredName,
            this.facilityPreferredName
        );

    }

    disconnectedCallback() {
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('click', this._handleStaffOutsideClick);
    }

    renderedCallback() {
        Promise.all([loadScript(this, jsPDFLib), loadScript(this, autoTable)])
        .then(() => {
            this.jsPDFInitialized = true;
            console.log("✅ jsPDF and autoTable loaded successfully");
        })
        .catch((error) => {
            console.error("❌ Error loading jsPDF or autoTable:", error);
        });
    }

    /* async loadRoles() {
        try {
            const roles = await getRolesByFacility({
                facilityId: this.selectedFacilityId
            });

            console.log('Roles from Apex:', roles);

            this.roleCheckboxes = roles.map(r => ({
                label: r.Role_Name__c,
                value: r.Role_Name__c,
                checked: false
            }));

            console.log('roleCheckboxes populated:', this.roleCheckboxes);

        } catch (error) {
            console.error('Error loading roles', error);
        }
    } */

    async loadTemplates() {
        if (!this.selectedFacilityId) {
            this.templatesforShiftReport = [
                { label: 'New', value: 'NEW' }
            ];
            this.selectedTemplateId = 'NEW';
            return;
        }

        try {
            console.log('this.selectedFacilityId >>>>', this.selectedFacilityId);
            console.log('this.reportTypeValue >>>>', this.reportTypeValue);
            const result = await getTemplatesByFacility({
                facilityId: this.selectedFacilityId,
                reportType: this.reportTypeValue
            });

            this.templatesforShiftReport = [
                ...result.map(t => ({
                    label: t.Name || 'Unnamed Template',
                    value: t.Id,
                    json: t.Template_JSON__c
                })),
                { label: 'New', value: 'NEW' }   // ✅ always last
            ];
            console.log('templatesforShiftReport >>>>>', JSON.stringify(this.templatesforShiftReport));

        } catch (error) {
            console.error('Error loading templates', error);

            this.templatesforShiftReport = [
                { label: 'New', value: 'NEW' }
            ];
            this.selectedTemplateId = 'NEW';
        }
    }

    handleCancel(){
        this.reportTypeValue ='';
        this.resetAllFilters();
    }

    resetAllFilters() {
        // Reset all filter values to null/empty
        this.selectedEmploymentType = '';
        this.selectedLocation = '';
        this.selectedDateRange = '';
        this.selectedstaffStatus = '';
        this.statusValue = '';
        this.startDate = '';
        this.endDate = '';
        this.selectedRoles = [];
        this.selectedStaffId = null;
        this.selectedStaffName = '';
        this.roleCheckboxes = [];
        this.staffList = [];
        this.filteredStaffList = [];
        this.showStaffDropdown = false;
        this.rejectedsearchStaffflag = false;
        this.rejectedflagFliters = false;
        
        // Reset template related values
        this.selectedTemplateId = null;
        this.previousTemplateId = null;
        this.newTemplateName = '';
        this.isCreatingTemplate = false;
        this.sections = [];
        
        // Reset report type flags
        this.isStaffBasedReport = false;
        this.isAllStaff = false;
        this.isShiftReport = false;
        this.isRejectedShiftReport = false;
        this.isStaffBasedReport1 = false;
        this.isIndividualStaff = false;
        this.reimbursementflag = false;
        this.staffListflag = false;
        this.participantflag = false;
        this.isunderandOverReport = false;
        this.isCustomRange = false;
        
        console.log('All filter values have been reset to null/empty');
    }

    handlereportType(event) {
        this.isFavorite = false;
        this.favoriteText = 'Add to favorite';
        this.favoriteClass = '';
        this.applyReportType(event.detail.value);
    }

    applyReportType(reportTypeValue) {

        this.reportTypeValue = reportTypeValue;

        this.selectedReport = this.reportList.find(
            r => r.value === this.reportTypeValue
        );

        // Reset all filters first
        this.resetAllFilters();

        console.log('Selected value : ', this.reportTypeValue);
        console.log('Selected report : ', this.selectedReport);

        const today = new Date().toISOString().split('T')[0];

        if (this.reportTypeValue === 'SHIFT') {
            this.headingName = 'Shift Report Filters';
            this.isStaffBasedReport = true;
            this.isAllStaff = true;
            this.isShiftReport = true;
            /* this.loadRoles(); */
            this.loadTemplates();
            this.startDate = today;
            this.endDate = today;
            this.selectedDateRange = 'TODAY';
        }

        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            this.headingName = 'Rejected Shift Report Filters';
            this.isStaffBasedReport = true;
            this.isRejectedShiftReport = true;
            this.rejectedflagFliters = true;
            this.isAllStaff = true;
            /* this.loadRoles(); */
            this.loadTemplates();
            this.startDate = today;
            this.endDate = today;
            this.selectedDateRange = 'TODAY';
        }

        if (this.reportTypeValue === 'STAFF') {
            this.headingName = 'Staff Report Filters';
            this.isStaffBasedReport = true;
            this.isAllStaff = true;
            this.staffListflag = true;
            /* this.loadRoles(); */
            this.loadTemplates();
        }

        if (this.reportTypeValue === 'PARTICIPANT') {
            this.headingName = 'Participant Report Filters';
            this.participantflag = true;
            /* this.loadRoles(); */
            this.loadTemplates();
        }

        if (this.reportTypeValue === 'OVER_EFF') {
            this.headingName = 'Over/Under Efficiency Report Filters';
            this.isStaffBasedReport = true;
            this.isAllStaff = true;
            this.isunderandOverReport = true;
            /* this.loadRoles(); */
            this.loadTemplates();
            this.startDate = today;
            this.endDate = today;
            this.selectedDateRange = 'TODAY';
        }

        if (this.reportTypeValue === 'REIMBURSEMENT') {
            this.headingName = 'Reimbursement Report Filters';
            this.reimbursementflag = true;
            this.loadTemplates();
            this.startDate = today;
            this.endDate = today;
            this.selectedDateRange = 'TODAY';
        }

        this.buildSectionsForReport();
        this.updateGenerateButtonState();
    }

    get allStaffTabClass() {
        return this.isAllStaff ? 'active' : '';
    }

    get individualStaffTabClass() {
        return this.isIndividualStaff ? 'active' : '';
    }

    handleStaffChange(event) {
        this.selectedStaffType = event.detail.value;

        if (this.selectedStaffType === 'all') {

            this.isAllStaff = true;
            this.isIndividualStaff = false;
            this.searchStaffflag = false;
            this.selectedStaffId = null;

            console.log('Clicked ALL STAFF');
            console.log('isAllStaff:', this.isAllStaff);
            console.log('isIndividualStaff:', this.isIndividualStaff);

        } else {

            this.filteredStaffList = [];
            this.isAllStaff = false;
            this.isIndividualStaff = true;
            this.searchStaffflag = true;

            console.log('Clicked Individual STAFF');
            console.log('isAllStaff:', this.isAllStaff);

        }

        this.fetchStaff();
    }

    handleRoleCheckboxChange(event) {
        console.log('===== handleRoleCheckboxChange START =====');

        const role = event.target.value;
        const checked = event.target.checked;

        // ✅ FIX: always make sure selectedRoles is an array
        if (!Array.isArray(this.selectedRoles)) {
            console.warn(
                'selectedRoles was not an array. Converting from:',
                this.selectedRoles
            );

            this.selectedRoles =
                this.selectedRoles && this.selectedRoles !== 'All'
                    ? [this.selectedRoles]
                    : [];
        }

        console.log('Checkbox change =>', JSON.stringify({
            role,
            checked,
            beforeSelectedRoles: this.selectedRoles
        }));

        if (checked) {

            if (!this.selectedRoles.includes(role)) {
                this.selectedRoles = [...this.selectedRoles, role];
                console.log('Role added =>', role);
            }

        } else {

            this.selectedRoles = this.selectedRoles.filter(r => r !== role);
            console.log('Role removed =>', role);
        }

        console.log(
            'Selected roles (after update) =>',
            JSON.stringify(this.selectedRoles)
        );

        // 🔴 RESET STAFF STATE ON EVERY ROLE CHANGE
        this.staffList = [];
        this.filteredStaffList = [];
        this.selectedStaffId = null;
        this.showStaffDropdown = false;

        console.log('Staff state after reset =>', {
            staffListCount: this.staffList.length,
            filteredStaffListCount: this.filteredStaffList.length,
            selectedStaffId: this.selectedStaffId,
            showStaffDropdown: this.showStaffDropdown
        });

        if (this.selectedRoles.length > 0) {
            console.log(
                'Roles present, calling fetchStaff() with roles =>',
                JSON.stringify(this.selectedRoles)
            );
            this.fetchStaff();
        } else {
            console.log('No roles selected → staff cleared, fetch skipped');
        }

        console.log('===== handleRoleCheckboxChange END =====');
    }

    async fetchStaff() {
        if (!this.selectedFacilityId) {
            this.staffList = [];
            this.filteredStaffList = [];
            return;
        }

        try {

            const result = await getStaffByFacilityAndRoles({
                facilityId: this.selectedFacilityId,

                // ✅ pass roles ONLY if present, otherwise null
                roleNames:
                    Array.isArray(this.selectedRoles) && this.selectedRoles.length
                        ? this.selectedRoles
                        : null,

                employmentType: this.selectedEmploymentType
            });

            this.staffList = result || [];
            this.filteredStaffList = [];
            this.selectedStaffId = null;

        } catch (error) {
            console.error('Error fetching staff', error);
            this.staffList = [];
            this.filteredStaffList = [];
        }
    }

    handleChange(event) {

        const field = event.target.name;
        const value = event.detail.value;

        console.log('handleChange fired →', {
            field,
            value,
            before: {
                selectedEmploymentType: this.selectedEmploymentType,
                selectedLocation: this.selectedLocation,
                selectedstaffStatus: this.selectedstaffStatus
            }
        });

        if (field === 'employmentType') {

            this.selectedEmploymentType = value;
            console.log('Updated selectedEmploymentType →', this.selectedEmploymentType);

        }
        else if (field === 'location') {

            this.selectedLocation = value;
            console.log('Updated selectedLocation →', this.selectedLocation);

        }
        else if (field === 'staffStatus') {

            // ✅ new combobox
            this.selectedstaffStatus = value;
            console.log('Updated selectedstaffStatus →', this.selectedstaffStatus);

        }
        else {

            console.warn('handleChange received unknown field name →', field);
        }

        this.updateGenerateButtonState();

        console.log('handleChange end →', {
            selectedEmploymentType: this.selectedEmploymentType,
            selectedLocation: this.selectedLocation,
            selectedstaffStatus: this.selectedstaffStatus
        });
    }

    handleDateRangeChange(event) {

        this.selectedDateRange = event.detail.value;

        const today = new Date();

        // reset
        this.isCustomRange = false;
        this.startDate = '';
        this.endDate = '';

        switch (this.selectedDateRange) {

            case 'TODAY':
                this.startDate = this.formatDate(today);
                this.endDate = this.formatDate(today);
                break;

            case 'YESTERDAY': {
                const d = new Date(today);
                d.setDate(d.getDate() - 1);
                this.startDate = this.formatDate(d);
                this.endDate = this.formatDate(d);
                break;
            }

            case 'LAST_7_DAYS': {
                const start = new Date(today);
                start.setDate(start.getDate() - 6);   // incl today
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(today);
                break;
            }

            case 'LAST_30_DAYS': {
                const start = new Date(today);
                start.setDate(start.getDate() - 29);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(today);
                break;
            }

            case 'THIS_MONTH': {
                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                const end   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                this.startDate = this.formatDate(start);
                this.endDate   = this.formatDate(end);
                break;
            }

            case 'LAST_MONTH': {
                const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const end   = new Date(today.getFullYear(), today.getMonth(), 0);
                this.startDate = this.formatDate(start);
                this.endDate   = this.formatDate(end);
                break;
            }

            case 'LAST_3_MONTHS': {
                const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                this.startDate = this.formatDate(start);
                this.endDate   = this.formatDate(today);
                break;
            }

            case 'LAST_6_MONTHS': {
                const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                this.startDate = this.formatDate(start);
                this.endDate   = this.formatDate(today);
                break;
            }

            case 'THIS_YEAR': {
                const start = new Date(today.getFullYear(), 0, 1);
                const end   = new Date(today.getFullYear(), 11, 31);
                this.startDate = this.formatDate(start);
                this.endDate   = this.formatDate(end);
                break;
            }

            case 'CUSTOM':
                this.isCustomRange = true;
                break;

            default:
                break;
        }

        this.updateGenerateButtonState();
    }

    handleFromDateChange(event) {
        this.startDate = event.target.value;
        this.updateGenerateButtonState();
    }

    handleToDateChange(event) {
        this.endDate = event.target.value;
        this.updateGenerateButtonState();
    }

    formatDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    updateGenerateButtonState() {
        if (this.isStaffBasedReport) {

            const allFilled =
                this.selectedEmploymentType &&
                this.selectedLocation &&
                this.startDate &&
                this.endDate;

            // true = disabled
            this.generatereport = !!allFilled;

        } else {
            // when not staff based, keep it enabled (or adjust as per your logic)
            this.generatereport = false;
        }
        this.generatereport = false;
    }

    async handleGenerateReport() {
        if (this.reportTypeValue === 'SHIFT') {

            if (!this.startDate || !this.endDate) {
                this.showToast('Error', 'Select date range', 'error');
                return;
            }

            // --- MODE SPECIFIC VALIDATIONS ---
            if (this.isAllStaff) {

                this.selectedstaffStatus = '';

                if (!this.selectedEmploymentType) {
                    this.showToast('Error', 'Please Select Employment Type', 'error');
                    return;
                }

            } 
            else if (this.isIndividualStaff) {

                this.selectedEmploymentType = '';
                this.searchStaffflag = false;
                this.selectedStaffType = 'all';

                if (!this.selectedStaffId) {
                    this.showToast('Error', 'Please Select Staff', 'error');
                    return;
                }
            }

            await this.generateShiftReport();
            return;
        }        
        else if(this.reportTypeValue === 'REJECTED_SHIFT'){
            if (!this.startDate || !this.endDate) {
                this.showToast('Error', 'Select date range', 'error');
                return;
            }
            await this.generateRejectedShiftReport();
            return;
        } 
        
        else if(this.reportTypeValue === 'REIMBURSEMENT'){
            if (!this.startDate || !this.endDate) {
                this.showToast('Error', 'Select date range', 'error');
                return;
            }
            await this.generateReimbursementReport();
            return;
        } 
        
        else if(this.reportTypeValue === 'STAFF'){
            if (!this.selectedstaffStatus) {
                this.showToast('Error', 'Select Status', 'error');
                return;
            }
            if (!this.selectedEmploymentType) {
                this.showToast('Error', 'Select  Employment Type', 'error');
                return;
            }
            await this.generateStaffReport();
            return;
        }

        else if(this.reportTypeValue === 'PARTICIPANT'){
            if (!this.selectedstaffStatus) {
                this.showToast('Error', 'Select Status', 'error');
                return;
            }
            await this.loadParticipants();
            return;
        }

        else if(this.reportTypeValue === 'OVER_EFF'){
            if (!this.selectedEmploymentType) {
                this.showToast('Error', 'Select  Employment Type', 'error');
                return;
            }
            if (!this.startDate || !this.endDate) {
                this.showToast('Error', 'Select date range', 'error');
                return;
            }
            await this.loadStaffUtilizationData();
            return;
        }
    }

    async generateShiftReport() {
        console.log('===== generateShiftReport START (SHIFT ONLY) =====');

        try {

            console.log('Input Filters =>', JSON.stringify({
                startDate: this.startDate,
                endDate: this.endDate,
                isAllStaff: this.isAllStaff,
                isIndividualStaff: this.isIndividualStaff,
                selectedRoles: this.selectedRoles,
                selectedEmploymentType: this.selectedEmploymentType,
                selectedLocation: this.selectedLocation,
                selectedFacilityId: this.selectedFacilityId,
                selectedStaffId: this.selectedStaffId
            }));

            if (!this.startDate || !this.endDate) {
                console.error('Date range missing');
                return;
            }

            let staffIds = [];

            // ================= ALL STAFF =================
            if (this.isAllStaff) {

                console.log('Mode => ALL STAFF');

                staffIds = (this.staffList || []).map(s => s.Id);

                console.log('All staffIds =>', staffIds);
            }

            // ================= INDIVIDUAL STAFF =================
            if (this.isIndividualStaff) {

                console.log('Mode => INDIVIDUAL STAFF');

                if (!this.selectedStaffId) {
                    console.error('No staff selected');
                    return;
                }

                staffIds = [this.selectedStaffId];

                console.log('Individual staffId =>', staffIds);
            }

            console.log('Calling getShiftWithSmartStaffData...');

            const shifts = await getShiftWithSmartStaffData({
                role: this.selectedRoles,
                employmentType: this.selectedEmploymentType || 'All',
                startWeekDate: this.startDate,
                endWeekDate: this.endDate,
                location: this.selectedLocation || 'All',
                facilityIds: this.selectedFacilityIds,
                staffIds: staffIds
            });

            console.log('Shifts response =>', shifts);
            console.log('Shifts count =>', shifts ? shifts.length : 0);

            if (!shifts || shifts.length === 0) {

                this.showToast(
                    'No Data',
                    'No shifts found for the selected filters.',
                    'info'
                );

                return;
            }

            // ✅ Use the shifts result directly
            this.filteredRecords = shifts.map(shift => {

                const participants =
                    Array.isArray(shift.Services_and_Support_Plans__r)
                        ? [
                            ...new Set(
                                shift.Services_and_Support_Plans__r
                                    .map(p => p.Participant_Name__c)
                                    .filter(Boolean)
                            )
                        ].join(', ')
                        : '';

                return {
                    Id: shift.Id,

                    staffName:
                        shift.Staff__r?.Display_Nickname__c ||
                        shift.Staff__r?.Name ||
                        '',

                    date: this.formatDateToDDMMYYYY(shift.Date__c),

                    shiftType:
                        shift.Add_Shift__r?.Shift_Type__c ||
                        shift.Type_of_shift__c ||
                        '',

                    shiftTime:
                        shift.Add_Shift__r?.Shift_Start_End_Time__c || '',

                    role:
                        shift.Add_Shift__r?.Role__c ||
                        shift.Role_Name__c ||
                        '',
                    
                    participants: participants || '-',

                    status: shift.Status__c
                };
            });

            console.log(
                'filteredRecords prepared from shifts =>',
                JSON.stringify(this.filteredRecords, null, 2)
            );

            this.pageNumber = 1;
            this.pageSize = this.pageSize || 10;

            /* this.isReportContainer = false;

            this.isStaffBasedReport1 = true;   // ✅ important
            this.isRejectedShiftReport = false; */

            this.isStaffBasedReportshowModal = true;

            this.paginationHelper();

            this.reportSummary = {
                staffType: this.isAllStaff ? 'All Staff' : 'Individual Staff',
                period: `${this.formatDateDDMMYYYY(this.startDate)} - ${this.formatDateDDMMYYYY(this.endDate)}`
            };

            this.isBuilderView = false;
            this.isResultView = true;

            console.log('===== generateShiftReport END (SHIFT ONLY) =====');

        } catch (error) {
            console.error('Error generating shift report', error);
        }
    }

    formatDateDDMMYYYY(dateStr) {
        if (!dateStr) return '';

        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    async generateRejectedShiftReport() {
        try {

            /* ---------------------------------------
            1️⃣ Resolve staffIds
            --------------------------------------- */
            let staffIds = [];

            // Staff filter only for Individual Staff mode
            if (this.isIndividualStaff && this.selectedStaffId) {
                staffIds = [this.selectedStaffId];
            }

            /* ---------------------------------------
            2️⃣ Call Apex
            --------------------------------------- */
            const result = await getRejectedShiftsForSmartReports({
                startDateStr: this.startDate,
                endDateStr: this.endDate,
                orgId: this.orgid,
                facilityIds: this.selectedFacilityIds,
                staffIds: staffIds
            });

            if (!Array.isArray(result)) {
                this.showToast('Error', 'Invalid rejected shift data', 'error');
                return;
            }

            /* ---------------------------------------
            3️⃣ Store raw result
            --------------------------------------- */
            this.rejectedShiftsRaw = result;
            console.log(
                'rejectedShiftsRaw (JSON) =>',
                JSON.stringify(this.rejectedShiftsRaw, null, 2)
            );

            /* ---------------------------------------
            4️⃣ Build staff search list
            --------------------------------------- */
            if (this.isRejectedShiftReport) {
                this.buildRejectedStaffList(this.rejectedShiftsRaw);
            }

            /* ---------------------------------------
            5️⃣ Normalize for UI / export
            --------------------------------------- */
            this.rejectedFilteredRecords = this.rejectedShiftsRaw.map(
                w => this.normalizeRejectedShift(w)
            );

            /* ---------------------------------------
            6️⃣ Metrics
            --------------------------------------- */
            this.calculateRejectedMetrics();

            /* ---------------------------------------
            7️⃣ Empty state
            --------------------------------------- */
            if (!this.rejectedFilteredRecords.length) {
                this.showToast('Info', 'No rejected shifts found', 'info');
                return;
            }

            /* ---------------------------------------
            8️⃣ Pagination
            --------------------------------------- */
            this.rejectedPageNumber = 1;
            this.rejectedPageSize = this.rejectedPageSize || 10;
            this.rejectedPaginationHelper();

            /* ---------------------------------------
            9️⃣ Show results container
            --------------------------------------- */
            this.isStaffBasedReportshowModal = true;
            /* this.isReportContainer = false;
            this.isRejectedShiftReport = true; */

        } catch (e) {
            console.error('[Rejected][Generate] ERROR', e);
            this.showToast('Error', 'Failed to load rejected shifts', 'error');
        }
    }

    async generateReimbursementReport() {
        try {
            console.log('===== generateReimbursementReport START =====');

            console.log(
                'Input (JSON) =>',
                JSON.stringify({
                    startDate: this.startDate,
                    endDate: this.endDate,
                    status: this.statusValue,
                    facilityIds: this.selectedFacilityIds
                }, null, 2)
            );

            const result = await getAllReimbursements({
                startDate: this.startDate,
                endDate: this.endDate,
                status: this.statusValue,
                facilityIds: this.selectedFacilityIds,
            });

            console.log('Reimbursement result =>', JSON.stringify(result));

            // 🚨 NO RECORDS CHECK
            if (!result || result.length === 0) {
                this.reimbursementAllRecords = [];
                this.showToast('Info', 'No reimbursement records found', 'info');
                return;
            }

            // NORMAL FLOW
            this.reimbursementAllRecords = result;

            this.reimbursementPageNumber = 1;
            this.reimbursementPageSize   = this.reimbursementPageSize || 10;

            this.reimbursementPaginationHelper();

            this.isStaffBasedReportshowModal = true;
            /* this.isReportContainer = false; */

            console.log('===== generateReimbursementReport END =====');

        } catch (error) {
            console.error('Error generating reimbursement report', error);
            this.showToast('Error', 'Failed to load reimbursement report', 'error');
        }
    }

    async generateStaffReport() {
        try {

            let staffIds = [];

            // ================= ALL STAFF =================
            if (this.isAllStaff) {

                console.log('Mode => ALL STAFF');

                staffIds = (this.staffList || []).map(s => s.Id);

                console.log('All staffIds (JSON) =>', JSON.stringify(staffIds, null, 2));
            }

            // ================= INDIVIDUAL STAFF =================
            if (this.isIndividualStaff) {

                console.log('Mode => INDIVIDUAL STAFF');

                if (!this.selectedStaffId) {
                    console.error('No staff selected');
                    return;
                }

                staffIds = [this.selectedStaffId];

                console.log('Individual staffId (JSON) =>', JSON.stringify(staffIds, null, 2));
            }

            const payload = {
                facilityIds: this.selectedFacilityIds,
                status: this.selectedstaffStatus,
                employmentType: this.selectedEmploymentType,
                staffIds: staffIds,
                roleNames: this.selectedRoles
            };

            console.log('fetchStaffs payload (JSON) =>', JSON.stringify(payload, null, 2));

            const result = await fetchStaffs({
                facilityIds: this.selectedFacilityIds,
                status: this.selectedstaffStatus,
                employmentType: this.selectedEmploymentType,
                staffIds: staffIds,
                roleNames: this.selectedRoles
            });

            console.log('Staff records result (JSON) =>', JSON.stringify(result, null, 2));

            // 🚨 NO DATA CHECK (INFO TOAST)
            if (!result || result.length === 0) {
                this.staffAllRecords = [];
                this.showToast('Info', 'No staff records found', 'info');
                return;
            }

            // -----------------------------
            // store raw staff records
            // -----------------------------
            this.staffAllRecords = result.map(s => ({
                Id: s.Id,
                staffName: s.Display_Nickname__c || s.Name,
                email: s.Email_Address__c,
                contactNumber: s.Contact_Number__c,
                gender: s.Gender__c,
                dob: s.Date_Of_Birth__c,
                status: s.Status__c ? 'Active' : 'Inactive'
            }));

            // -----------------------------
            // reset staff pagination
            // -----------------------------
            this.staffPageNumber = 1;
            this.staffPageSize   = this.staffPageSize || 10;

            this.staffPaginationHelper();

            /* this.isReportContainer = false; */

            this.isStaffBasedReportshowModal = true;
            /* this.isReportContainer = false;
            this.isRejectedShiftReport = true; */

        } catch (error) {

            console.error('generateStaffReport error (JSON) =>', JSON.stringify(error, null, 2));

            this.showToast('Error', 'Failed to load staff data', 'error');
        }
    }

    async loadParticipants() {
        try {

            console.log('Status   >>', this.selectedstaffStatus);

            const result = await fetchFacilitiess({
                facilityIds: this.selectedFacilityIds,
                status: this.selectedstaffStatus
            });

            console.log(
                'Participants result (JSON) =>\n',
                JSON.stringify(result, null, 2)
            );

            // 🚨 NO DATA CHECK (INFO)
            if (!result || result.length === 0) {
                this.participantAllRecords = [];
                this.showToast('Info', 'No participant records found', 'info');
                return;
            }

            // NORMAL FLOW
            this.participantAllRecords = result;

            // reset pagination
            this.participantPageNumber = 1;
            this.participantPageSize   = this.participantPageSize || 10;

            this.participantPaginationHelper();

            /* this.isReportContainer = false; */
            this.isStaffBasedReportshowModal = true;

        } catch (error) {

            console.error('Error while fetching participants', error);
            this.showToast('Error', 'Failed to load participant data', 'error');
        }
    }

    async loadStaffUtilizationData() {

        console.log('🟢 loadStaffUtilizationData() START');

        try {

            this.isLoading = true;
            this.errorMessage = '';

            const params = {
                facility: this.selectedFacilityId,
                role: this.selectedRoles,
                employmentType: this.selectedEmploymentType,
                startWeekDate: this.startDate,
                endWeekDate: this.endDate
            };

            console.log('➡️ Calling getStaffUtilizationData with params:');
            console.log(JSON.stringify(params, null, 2));

            const result = await getStaffUtilizationData(params);

            console.log('✅ Raw Apex result =>', result);

            // 🚨 NO DATA CHECK (INFO)
            if (!Array.isArray(result) || result.length === 0) {

                this.underOverAllRecords = [];
                this.hasData = false;

                this.showToast(
                    'Info',
                    'No staff utilization data found',
                    'info'
                );

                return;
            }

            // -------------------------------------------------
            // NORMAL FLOW
            // -------------------------------------------------
            this.underOverAllRecords = result;

            this.underOverPageNumber = 1;
            this.underOverPageSize = this.underOverPageSize || 10;

            this.underOverPaginationHelper();

            this.hasData = true;

            console.log('📌 hasData =>', this.hasData);

            this.isReportContainer = false;

            console.log('🟢 loadStaffUtilizationData() SUCCESS');

        } catch (error) {

            console.error('🔴 Error in loadStaffUtilizationData()', error);

            if (error?.body?.message) {
                console.error('🔴 Apex message =>', error.body.message);
            }

            this.handleError(error);
            this.clearData();

        } finally {

            this.isLoading = false;
            console.log('🟡 loadStaffUtilizationData() FINALLY - isLoading=false');
        }
    }

    underOverPaginationHelper() {

        const dataList = Array.isArray(this.underOverAllRecords)
            ? this.underOverAllRecords
            : [];

        this.underOverTotalRecords = dataList.length;

        this.underOverTotalPages =
            this.underOverPageSize > 0
                ? Math.ceil(this.underOverTotalRecords / this.underOverPageSize)
                : 1;

        if (this.underOverPageNumber < 1) {
            this.underOverPageNumber = 1;
        }

        if (this.underOverPageNumber > this.underOverTotalPages) {
            this.underOverPageNumber = this.underOverTotalPages;
        }

        const startIdx =
            (this.underOverPageNumber - 1) * this.underOverPageSize;

        const endIdx =
            this.underOverPageNumber * this.underOverPageSize;

        this.underOverRecordsToDisplay =
            dataList.slice(startIdx, endIdx);

        this.updateUnderOverPaginationButtons();

        console.log('🟦 UnderOver pagination =>', {
            page: this.underOverPageNumber,
            size: this.underOverPageSize,
            total: this.underOverTotalRecords,
            showing: this.underOverRecordsToDisplay.length
        });
    }

    updateUnderOverPaginationButtons() {

        this.underOverDisableFirst =
            this.underOverPageNumber <= 1;

        this.underOverDisableLast =
            this.underOverPageNumber >= this.underOverTotalPages;
    }

    handleUnderOverRecordsPerPage(event) {

        this.underOverPageSize = parseInt(event.target.value, 10);
        this.underOverPageNumber = 1;

        console.log('🟦 UnderOver page size changed =>', this.underOverPageSize);

        this.underOverPaginationHelper();
    }

    underOverFirstPage() {

        if (this.underOverPageNumber === 1) return;

        this.underOverPageNumber = 1;
        this.underOverPaginationHelper();
    }

    underOverPreviousPage() {

        if (this.underOverPageNumber <= 1) return;

        this.underOverPageNumber--;
        this.underOverPaginationHelper();
    }

    underOverNextPage() {

        if (this.underOverPageNumber >= this.underOverTotalPages) return;

        this.underOverPageNumber++;
        this.underOverPaginationHelper();
    }

    underOverLastPage() {

        if (this.underOverPageNumber === this.underOverTotalPages) return;

        this.underOverPageNumber = this.underOverTotalPages;
        this.underOverPaginationHelper();
    }

    participantPaginationHelper() {

        const dataList = Array.isArray(this.participantAllRecords)
            ? this.participantAllRecords
            : [];

        this.participantTotalRecords = dataList.length;

        this.participantTotalPages =
            this.participantPageSize > 0
                ? Math.ceil(this.participantTotalRecords / this.participantPageSize)
                : 1;

        if (this.participantPageNumber < 1) {
            this.participantPageNumber = 1;
        }

        if (this.participantPageNumber > this.participantTotalPages) {
            this.participantPageNumber = this.participantTotalPages;
        }

        const startIdx =
            (this.participantPageNumber - 1) * this.participantPageSize;

        const endIdx =
            this.participantPageNumber * this.participantPageSize;

        this.participantRecordsToDisplay =
            dataList.slice(startIdx, endIdx);

        this.updateParticipantPaginationButtons();
    }

    updateParticipantPaginationButtons() {

        this.participantDisableFirst =
            this.participantPageNumber <= 1;

        this.participantDisableLast =
            this.participantPageNumber >= this.participantTotalPages;
    }

    handleParticipantRecordsPerPage(event) {

        this.participantPageSize =
            parseInt(event.target.value, 10);

        this.participantPageNumber = 1;

        this.participantPaginationHelper();
    }

    participantFirstPage() {

        if (this.participantPageNumber === 1) {
            return;
        }

        this.participantPageNumber = 1;
        this.participantPaginationHelper();
    }

    participantPreviousPage() {

        if (this.participantPageNumber <= 1) {
            return;
        }

        this.participantPageNumber--;
        this.participantPaginationHelper();
    }

    participantNextPage() {

        if (this.participantPageNumber >= this.participantTotalPages) {
            return;
        }

        this.participantPageNumber++;
        this.participantPaginationHelper();
    }

    participantLastPage() {

        if (this.participantPageNumber === this.participantTotalPages) {
            return;
        }

        this.participantPageNumber = this.participantTotalPages;
        this.participantPaginationHelper();
    }

    staffPaginationHelper() {
        const dataList = Array.isArray(this.staffAllRecords)
            ? this.staffAllRecords
            : [];

        this.staffTotalRecords = dataList.length;

        this.staffTotalPages =
            this.staffPageSize > 0
                ? Math.ceil(this.staffTotalRecords / this.staffPageSize)
                : 1;

        if (this.staffPageNumber < 1) {
            this.staffPageNumber = 1;
        }

        if (this.staffPageNumber > this.staffTotalPages) {
            this.staffPageNumber = this.staffTotalPages;
        }

        const startIdx =
            (this.staffPageNumber - 1) * this.staffPageSize;

        const endIdx =
            this.staffPageNumber * this.staffPageSize;

        this.staffRecordsToDisplay =
            dataList.slice(startIdx, endIdx);

        this.updateStaffPaginationButtons();
    }

    updateStaffPaginationButtons() {

        this.staffDisableFirst =
            this.staffPageNumber <= 1;

        this.staffDisableLast =
            this.staffPageNumber >= this.staffTotalPages;
    }

    handleStaffRecordsPerPage(event) {

        this.staffPageSize = parseInt(event.target.value, 10);
        this.staffPageNumber = 1;

        this.staffPaginationHelper();
    }

    staffFirstPage() {

        if (this.staffPageNumber === 1) {
            return;
        }

        this.staffPageNumber = 1;
        this.staffPaginationHelper();
    }

    staffPreviousPage() {

        if (this.staffPageNumber <= 1) {
            return;
        }

        this.staffPageNumber--;
        this.staffPaginationHelper();
    }

    staffNextPage() {

        if (this.staffPageNumber >= this.staffTotalPages) {
            return;
        }

        this.staffPageNumber++;
        this.staffPaginationHelper();
    }

    staffLastPage() {

        if (this.staffPageNumber === this.staffTotalPages) {
            return;
        }

        this.staffPageNumber = this.staffTotalPages;
        this.staffPaginationHelper();
    }

    reimbursementPaginationHelper() {

        const dataList = Array.isArray(this.reimbursementAllRecords)
            ? this.reimbursementAllRecords
            : [];

        this.reimbursementTotalRecords = dataList.length;

        this.reimbursementTotalPages =
            this.reimbursementPageSize > 0
                ? Math.ceil(this.reimbursementTotalRecords / this.reimbursementPageSize)
                : 1;

        if (this.reimbursementPageNumber < 1) {
            this.reimbursementPageNumber = 1;
        }

        if (this.reimbursementPageNumber > this.reimbursementTotalPages) {
            this.reimbursementPageNumber = this.reimbursementTotalPages;
        }

        const startIdx =
            (this.reimbursementPageNumber - 1) * this.reimbursementPageSize;

        const endIdx =
            this.reimbursementPageNumber * this.reimbursementPageSize;

        this.reimbursementRecordsToDisplay =
            dataList.slice(startIdx, endIdx);

        this.updateReimbursementPaginationButtons();
    }

    updateReimbursementPaginationButtons() {

        this.reimbursementDisableFirst =
            this.reimbursementPageNumber <= 1;

        this.reimbursementDisableLast =
            this.reimbursementPageNumber >= this.reimbursementTotalPages;
    }

    handleReimbursementRecordsPerPage(event) {

        this.reimbursementPageSize =
            parseInt(event.target.value, 10);

        this.reimbursementPageNumber = 1;
        this.reimbursementPaginationHelper();
    }

    reimbursementFirstPage() {

        if (this.reimbursementPageNumber === 1) {
            return;
        }

        this.reimbursementPageNumber = 1;
        this.reimbursementPaginationHelper();
    }

    reimbursementPreviousPage() {

        if (this.reimbursementPageNumber <= 1) {
            return;
        }

        this.reimbursementPageNumber--;
        this.reimbursementPaginationHelper();
    }

    reimbursementNextPage() {

        if (this.reimbursementPageNumber >= this.reimbursementTotalPages) {
            return;
        }

        this.reimbursementPageNumber++;
        this.reimbursementPaginationHelper();
    }

    reimbursementLastPage() {

        if (this.reimbursementPageNumber === this.reimbursementTotalPages) {
            return;
        }

        this.reimbursementPageNumber = this.reimbursementTotalPages;
        this.reimbursementPaginationHelper();
    }

    buildRejectedStaffList(result) {

        const staffMap = new Map();

        (Array.isArray(result) ? result : []).forEach(w => {

            const staff = w?.shift?.Staff__r;

            if (staff && staff.Id) {
                staffMap.set(staff.Id, {
                    Id: staff.Id,
                    Name: staff.Display_Nickname__c || staff.Name
                });
            }
        });

        this.staffList = [...staffMap.values()];
        this.filteredStaffList = [...this.staffList];
    }

    normalizeRejectedShift(wrapper) {

        const s = wrapper?.shift;

        if (!s) {
            return {};
        }

        return {
            Id: s.Id,

            date: s.Date__c,

            formattedDate: s.Date__c
                ? new Date(s.Date__c).toLocaleDateString('en-GB')
                : '',

            staffName:
                s.Staff__r?.Display_Nickname__c ||
                s.Staff__r?.Name ||
                '—',

            staffEmail:
                s.Staff__r?.Email_Address__c || '',

            facility: this.selectedFacilityLabel,

            role:
                s.Add_Shift__r?.Role__c || '',

            shiftType:
                s.Add_Shift__r?.Shift_Type__c || '',

            timings:
                s.Add_Shift__r?.Shift_Start_End_Time__c || '',

            duration:
                s.Duration__c || '',

            comments:
                s.RejectedComments__c || '',

            reassignedStaffName:
                wrapper?.reassignedStaffName || 'No',

            rejectedDate:
                s.LastModifiedDate
                    ? new Date(s.LastModifiedDate).toLocaleString(
                        'en-GB',
                        {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        }
                    )
                    : '',

            reassignedDate:
                wrapper?.reassignedDate
                    ? new Date(wrapper.reassignedDate).toLocaleString(
                        'en-GB',
                        {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        }
                    )
                    : '',

            participant:
                s.Services_and_Support_Plans__r?.[0]
                    ?.Participant_Name__c || '',

            serviceType:
                s.Services_and_Support_Plans__r?.[0]
                    ?.Service_Type_Name__c || '',

            checklist:
                s.Add_Shift_Checklists__r
                    ?.map(c => c.Description__c)
                    .join(' | ') || ''
        };
    }

    calculateRejectedMetrics() {

        const data = Array.isArray(this.rejectedFilteredRecords)
            ? this.rejectedFilteredRecords
            : [];

        /* -----------------------------
        TOTAL REJECTED
        ----------------------------- */
        this.totalRejected = data.length;

        /* -----------------------------
        AVG PER WEEK
        ----------------------------- */
        const start = this.startDate ? new Date(this.startDate) : null;
        const end   = this.endDate ? new Date(this.endDate) : null;

        if (start && end && !isNaN(start) && !isNaN(end)) {

            const days =
                Math.max(1, (end - start) / 86400000 + 1);

            this.avgPerWeek =
                (this.totalRejected / (days / 7)).toFixed(1);

        } else {
            this.avgPerWeek = '0.0';
        }

        /* -----------------------------
        STAFF + ROLE MAPS
        ----------------------------- */
        const staffMap = {};
        const roleMap = {};

        data.forEach(r => {

            if (r.staffName) {
                staffMap[r.staffName] =
                    (staffMap[r.staffName] || 0) + 1;
            }

            if (r.role) {
                roleMap[r.role] =
                    (roleMap[r.role] || 0) + 1;
            }

        });

        /* -----------------------------
        UNIQUE STAFF
        (staff with ≥1 rejection)
        ----------------------------- */
        this.uniqueStaff = Object.keys(staffMap).length;

        /* -----------------------------
        MOST REJECTED ROLE
        ----------------------------- */
        let max = 0;
        let role = 'N/A';

        Object.entries(roleMap).forEach(([k, v]) => {
            if (v > max) {
                max = v;
                role = k;
            }
        });

        this.mostRejectedRole = role;
        this.mostRejectedRoleCount = max;
    }

    rejectedPaginationHelper() {

        const dataList = Array.isArray(this.rejectedFilteredRecords)
            ? this.rejectedFilteredRecords
            : [];

        this.rejectedTotalRecords = dataList.length;
        this.rejectedPaginationVisible = this.rejectedTotalRecords > 0;

        this.rejectedTotalPages =
            this.rejectedPageSize > 0
                ? Math.ceil(this.rejectedTotalRecords / this.rejectedPageSize)
                : 1;

        if (this.rejectedPageNumber < 1) {
            this.rejectedPageNumber = 1;
        }

        if (this.rejectedPageNumber > this.rejectedTotalPages) {
            this.rejectedPageNumber = this.rejectedTotalPages;
        }

        const startIdx =
            (this.rejectedPageNumber - 1) * this.rejectedPageSize;

        const endIdx =
            this.rejectedPageNumber * this.rejectedPageSize;

        this.rejectedRecordsToDisplay =
            dataList.slice(startIdx, endIdx);

        // ✅ important
        this.updateRejectedPaginationButtons();
    }

    updateRejectedPaginationButtons() {
        this.rejectedDisableFirst = this.rejectedPageNumber <= 1;
        this.rejectedDisableLast =
        this.rejectedPageNumber >= this.rejectedTotalPages;
    }

    handleRejectedRecordsPerPage(event) {
        this.rejectedPageSize = parseInt(event.target.value, 10);
        this.rejectedPageNumber = 1;
        this.rejectedPaginationHelper();
    }

    rejectedFirstPage() {
        if (this.rejectedPageNumber === 1) {
            return;
        }

        this.rejectedPageNumber = 1;
        this.rejectedPaginationHelper();
    }

    rejectedPreviousPage() {
        if (this.rejectedPageNumber <= 1) {
            return;
        }

        this.rejectedPageNumber--;
        this.rejectedPaginationHelper();
    }

    rejectedNextPage() {
        if (this.rejectedPageNumber >= this.rejectedTotalPages) {
            return;
        }

        this.rejectedPageNumber++;
        this.rejectedPaginationHelper();
    }

    rejectedLastPage() {
        if (this.rejectedPageNumber === this.rejectedTotalPages) {
            return;
        }

        this.rejectedPageNumber = this.rejectedTotalPages;
        this.rejectedPaginationHelper();
    }

    formatDateToDDMMYYYY(dateStr) {
        if (!dateStr) return '-';

        const [yyyy, mm, dd] = dateStr.split('-');
        return `${dd}/${mm}/${yyyy}`;
    }

    handleCancel() {

        // Switch back to builder view
        this.isResultView = false;
        this.isBuilderView = true;

        // Clear result data
        this.filteredRecords = [];
        this.recordsToDisplay = [];

        // Reset pagination
        this.pageNumber = 1;
        this.totalRecords = 0;
        this.totalPages = 0;
        this.paginationVisible = false;

        // Reset report summary
        this.reportSummary = {};

        // Disable generate button again
        this.generatereport = true;

        console.log('Cancel clicked → back to builder view');
    }

    get hasRecordsToDisplay() {
        return this.recordsToDisplay .length > 0;
    }

    handleBackToBuilder() {

        if(this.reportTypeValue === 'SHIFT'){
            this.isReportContainer = true;
            this.isStaffBasedReport1 = false;
            this.filteredRecords = [];
            this.recordsToDisplay = [];
        } else if(this.reportTypeValue === 'REJECTED_SHIFT'){
            this.isReportContainer = true;
            this.isRejectedShiftReport = false;
            this.rejectedFilteredRecords = [];
            this.rejectedRecordsToDisplay = [];
        } else if(this.reportTypeValue === 'STAFF'){
            this.isReportContainer = true;
            this.isStaffBasedReport = true;
            this.staffListflag = true;
            this.staffAllRecords = [];
            this.staffRecordsToDisplay = [];
        }else if (this.reportTypeValue === 'REIMBURSEMENT') {
            this.isReportContainer = true;
            this.reimbursementflag = true;
            this.reimbursementAllRecords = [];
            this.reimbursementRecordsToDisplay = [];
        }
        else if (this.reportTypeValue === 'PARTICIPANT') {
            this.isReportContainer = true;
            this.participantflag = true;
            this.participantAllRecords = [];
            this.participantRecordsToDisplay = [];
        }
        else if (this.reportTypeValue === 'OVER_EFF') {
            this.isReportContainer = true;
            this.isunderandOverReport = true;
            this.underOverAllRecords = [];
            this.underOverRecordsToDisplay = [];
        }
        
    }

    handleRecordsPerPage(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;

        this.paginationHelper();
        this.updatePaginationButtons();
    }

    firstPage() {
        if (this.pageNumber === 1) {
            return;
        }

        this.pageNumber = 1;

        this.paginationHelper();
        this.updatePaginationButtons();
    }

    previousPage() {
        if (this.pageNumber <= 1) {
            return;
        }

        this.pageNumber = this.pageNumber - 1;

        this.paginationHelper();
        this.updatePaginationButtons();
    }

    nextPage() {
        if (this.pageNumber >= this.totalPages) {
            return;
        }

        this.pageNumber = this.pageNumber + 1;

        this.paginationHelper();
        this.updatePaginationButtons();
    }

    lastPage() {
        if (this.pageNumber === this.totalPages) {
            return;
        }

        this.pageNumber = this.totalPages;

        this.paginationHelper();
        this.updatePaginationButtons();
    }

    updatePaginationButtons() {
        this.bDisableFirst = this.pageNumber <= 1;
        this.bDisableLast  = this.pageNumber >= this.totalPages;
    }

    paginationHelper() {

        const dataList = Array.isArray(this.filteredRecords)
            ? this.filteredRecords
            : [];

        this.totalRecords = dataList.length;
        this.paginationVisible = this.totalRecords > 0;

        this.totalPages =
            this.pageSize > 0
                ? Math.ceil(this.totalRecords / this.pageSize)
                : 1;

        if (this.pageNumber < 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber > this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        const startIdx = (this.pageNumber - 1) * this.pageSize;
        const endIdx   = this.pageNumber * this.pageSize;

        this.recordsToDisplay = dataList.slice(startIdx, endIdx);

        // ✅ add this line
        this.updatePaginationButtons();
    }

    handleExportClick(event) {
        event.stopPropagation(); // prevent immediate close
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    handleOutsideClick(event) {
        if (this.isDropdownOpen && !this.template.contains(event.target)) {
            this.isDropdownOpen = false;
        }
    }

    handleConfig() {

        console.log('handleConfig clicked');
        console.log('Selected reportTypeValue =>', this.reportTypeValue);

        if (
            this.reportTypeValue === 'SHIFT' ||
            this.reportTypeValue === 'REJECTED_SHIFT' ||
            this.reportTypeValue === 'REIMBURSEMENT' ||
            this.reportTypeValue === 'STAFF' ||
            this.reportTypeValue === 'PARTICIPANT' ||
            this.reportTypeValue === 'OVER_EFF'
        ) {

            console.log('Opening config modal for report type');

            if (this.reportTypeValue === 'PARTICIPANT') {

                console.log('Building sections for PARTICIPANT');
                this.buildSectionsForParticipantReport();

            }
            else if (this.reportTypeValue === 'STAFF') {

                console.log('Building sections for STAFF');
                this.buildSectionsForStaffReport();

            }
            else if (this.reportTypeValue === 'OVER_EFF') {

                console.log('Building sections for UNDER / OVER efficiency');
                this.buildSectionsForUnderOverReport();

            }
            else {

                console.log('Building sections for SHIFT / REJECTED_SHIFT / REIMBURSEMENT');
                this.buildSectionsForReport();
            }

            this.isStaffBasedReportshowModal = true;
            console.log('isStaffBasedReportshowModal =>', this.isStaffBasedReportshowModal);

            this.autoSelectFirstTemplate();
            console.log('autoSelectFirstTemplate called');

        } else {

            console.warn(
                'handleConfig called with unsupported report type =>',
                this.reportTypeValue
            );
        }

        this.isDropdownOpen = false;
        console.log('isDropdownOpen =>', this.isDropdownOpen);
    }

    buildSectionsForUnderOverReport() {

        console.log('buildSectionsForUnderOverReport called');

        this.sections = [
            { key: 'STAFF_NAME',      label: 'Staff Name',         checked: false, order: 1 },
            { key: 'SET_HOURS',       label: 'Set Hrs(SH)',        checked: false, order: 2 },
            { key: 'ROSTERED_HOURS',  label: 'Rostered Hrs(RH)',   checked: false, order:3 },
            { key: 'COMPLETED_HOURS', label: 'Completed Hrs(CH)', checked: false, order: 4 },
            { key: 'RH_VARIANCE',     label: 'RH Variance(RH-SH)', checked: false, order: 5 },
            { key: 'CH_VARIANCE',     label: 'CH Variance(CH-SH)', checked: false, order: 6 },
            { key: 'STATUS',          label: 'Status',             checked: false, order: 7 }
        ];

        console.log(
            'Under/Over sections =>',
            JSON.stringify(this.sections)
        );
    }

    buildSectionsForParticipantReport() {

        console.log('Building PARTICIPANT sections');

        this.sections = [
            { key: 'PARTICIPANT_NAME',   label: 'Participant Name', checked: false, order: 1 },
            { key: 'PARTICIPANT_EMAIL',  label: 'Email', checked: false, order: 2 },
            { key: 'PARTICIPANT_CONTACT',label: 'Contact Number', checked: false, order: 3 },
            { key: 'PARTICIPANT_GENDER', label: 'Gender', checked: false, order: 4 },
            { key: 'PARTICIPANT_TYPE',   label: 'Participant Type', checked: false, order: 5 },
            { key: 'PARTICIPANT_STATUS', label: 'Status', checked: false, order: 6 }
        ];

        console.log('Participant sections => ', JSON.stringify(this.sections));
    }

    buildSectionsForStaffReport() {
        this.sections = [
            { key: 'STAFF_NAME', label: 'Staff Name', checked: false, order: 1 },
            { key: 'EMAIL', label: 'Email', checked: false, order: 2 },
            { key: 'CONTACT_NUMBER', label: 'Contact Number', checked: false, order: 3 },
            { key: 'GENDER', label: 'Gender', checked: false, order: 4 },
            { key: 'DOB', label: 'Date of Birth', checked: false, order: 5 },
            { key: 'STATUS', label: 'Status', checked: false, order: 6 }
        ];
    }

    handleSummaryMouseEnter(event) {
        event.stopPropagation();
        const summaryItem = event.currentTarget;
        const subDropdown = summaryItem.querySelector('.sub-dropdown');
        if (subDropdown) {
            subDropdown.style.display = 'block';
        }
    }

    handleSummaryMouseLeave(event) {
        event.stopPropagation();
        const summaryItem = event.currentTarget;
        const subDropdown = summaryItem.querySelector('.sub-dropdown');
        if (subDropdown) {
            // Add small delay to allow moving cursor to submenu
            setTimeout(() => {
                if (!summaryItem.matches(':hover')) {
                    subDropdown.style.display = 'none';
                }
            }, 100);
        }
    }

    handleSubMenuMouseEnter(event) {
        event.stopPropagation();
        // Keep submenu open when hovering over it
    }

    handleSubMenuMouseLeave(event) {
        event.stopPropagation();
        const subMenu = event.currentTarget;
        subMenu.style.display = 'none';
    }

    handleSummaryExport(event) {

        const type = event.currentTarget.dataset.type;
        console.log('this.reportTypeValue >>>>>', this.reportTypeValue);

        // 🔹 SHIFT BASED REPORT
        if (this.reportTypeValue === 'SHIFT') {

            if (type === 'csv') {
                this.downloadShiftReportCSV();
            } 
            else if (type === 'pdf') {
                this.downloadShiftReportPDF();
            }

        }

        // 🔹 REJECTED_SHIFT BASED REPORT
        else if (this.reportTypeValue === 'REJECTED_SHIFT') {

            if (type === 'csv') {
                this.downloadRejectedShiftCSV();
            } 
            else if (type === 'pdf') {
                this.downloadRejectedShiftPDF();
            }

        }

        // 🔹 REIMBURSEMENT BASED REPORT
        else if (this.reportTypeValue === 'REIMBURSEMENT') {

            if (type === 'csv') {
                this.downloadReimbursementCSV();
            } 
            else if (type === 'pdf') {
                this.downloadReimbursementPDF();
            }

        }

        // ✅ STAFF BASED REPORT
        else if (this.reportTypeValue === 'STAFF') {

            if (type === 'csv') {
                this.downloadStaffReportCSV();
            }
            else if (type === 'pdf') {
                this.downloadStaffReportPDF();
            }

        }

        // ✅ PARTICIPANT BASED REPORT
        else if (this.reportTypeValue === 'PARTICIPANT') {

            if (type === 'csv') {
                this.downloadParticipantReportCSV();
            } else if (type === 'pdf') {
                this.downloadParticipantReportPDF();
            }

        }

        else if (this.reportTypeValue === 'OVER_EFF') {

            if (type === 'csv') {
                this.downloadUnderOverEfficiencyCSV();
            } else if (type === 'pdf') {
                this.downloadUnderOverEfficiencyPDF();
            }

        }

        else {
            console.warn('No valid report type selected');
        }

        this.isDropdownOpen = false;
    }

    downloadUnderOverEfficiencyCSV() {
        console.log('📤 downloadUnderOverEfficiencyCSV');

        const rows = this.underOverAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No data available', 'info');
            return;
        }

        const headers = [
            'Staff Name',
            'Set Hrs(SH)',
            'Rostered Hrs(RH)',
            'Completed Hrs(CH)',
            'RH Variance(RH-SH)',
            'CH Variance(CH-SH)',
            'Status'
        ];

        let csv = '';
        csv += headers.join(',') + '\n';

        rows.forEach(r => {

            const values = [
                r.name,
                r.setHours,
                r.rosteredHours,
                r.completedHours,
                r.rhVariance,
                r.chVariance,
                r.status
            ];

            const escaped = values.map(v =>
                `"${(v ?? '').toString().replace(/"/g, '""')}"`
            );

            csv += escaped.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];

        a.href = url;
        a.download = `Under_Over_Efficiency_Report_${today}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadUnderOverEfficiencyPDF() {

        console.log('📤 downloadUnderOverEfficiencyPDF');

        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('jsPDF not loaded');
            return;
        }

        const rows = this.underOverAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No data available', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(14);
        doc.text('Under / Over Efficiency List Report', 14, 18);

        const headers = [
            'Staff Name',
            'Set Hrs(SH)',
            'Rostered Hrs(RH)',
            'Completed Hrs(CH)',
            'RH Variance(RH-SH)',
            'CH Variance(CH-SH)',
            'Status'
        ];

        const body = rows.map(r => [
            r.name || '',
            r.setHours ?? '',
            r.rosteredHours ?? '',
            r.completedHours ?? '',
            r.rhVariance ?? '',
            r.chVariance ?? '',
            r.status || ''
        ]);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: 26,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: {
                fillColor: [12, 120, 186],
                textColor: 255
            }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Under_Over_Efficiency_Report_${today}.pdf`);

    }

    downloadParticipantReportCSV() {

        const rows = this.participantAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No participant data available', 'info');
            return;
        }

        let csv = '';

        csv += 'Participant List Report\n\n';

        const headers = [
            'Participant Name',
            'Email',
            'Contact Number',
            'Gender',
            'Participant Type',
            'Status'
        ];

        csv += headers.join(',') + '\n';

        rows.forEach(r => {

            const values = [
                r.Name || r.Name__c || '',
                r.Email__c || '',
                r.Contact_Number__c || '',
                r.Gender__c || '',
                r.ParticipantType__c || '',
                r.Participant_Status__c || ''
            ];

            const escaped = values.map(v =>
                `"${(v ?? '').toString().replace(/"/g, '""')}"`
            );

            csv += escaped.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];

        a.href = url;
        a.download = `Participant_List_Report_${today}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    }

    downloadParticipantReportPDF() {

        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('jsPDF not loaded');
            return;
        }

        const rows = this.participantAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No participant data available', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(16);
        doc.text('Participant List Report', 14, 18);

        const headers = [
            'Participant Name',
            'Email',
            'Contact Number',
            'Gender',
            'Participant Type',
            'Status'
        ];

        const body = rows.map(r => [
            r.Name || r.Name__c || '',
            r.Email__c || '',
            r.Contact_Number__c || '',
            r.Gender__c || '',
            r.ParticipantType__c || '',
            r.Participant_Status__c || ''
        ]);

        doc.autoTable({
            head: [headers],
            body,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Participant_List_Report_${today}.pdf`);

    }

    downloadStaffReportCSV() {

        const rows = this.staffAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No staff data available', 'info');
            return;
        }

        let csv = '';

        csv += 'Staff Report\n\n';

        const headers = [
            'Staff Name',
            'Email',
            'Contact Number',
            'Gender',
            'Date of Birth',
            'Status'
        ];

        csv += headers.join(',') + '\n';

        rows.forEach(r => {

            const values = [
                r.staffName || '',
                r.email || '',
                r.contactNumber || '',
                r.gender || '',
                r.dob || '',
                r.status || ''
            ];

            const escaped = values.map(v =>
                `"${(v ?? '').toString().replace(/"/g, '""')}"`
            );

            csv += escaped.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];

        a.href = url;
        a.download = `Staff_Report_${today}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    }

    downloadStaffReportPDF() {

        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('jsPDF not loaded');
            return;
        }

        const rows = this.staffAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No staff data available', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(16);
        doc.text('Staff Report', 14, 18);

        const headers = [
            'Staff Name',
            'Email',
            'Contact Number',
            'Gender',
            'Date of Birth',
            'Status'
        ];

        const body = rows.map(r => [
            r.staffName || '',
            r.email || '',
            r.contactNumber || '',
            r.gender || '',
            r.dob || '',
            r.status || ''
        ]);

        doc.autoTable({
            head: [headers],
            body,
            startY: 26,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Staff_Report_${today}.pdf`);

    }

    downloadReimbursementCSV() {

        const rows = this.reimbursementAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No reimbursement data available', 'info');
            return;
        }

        let csv = '';

        csv += 'Reimbursement Report\n';
        csv += `Start Date:,${this.startDate || ''}\n`;
        csv += `End Date:,${this.endDate || ''}\n`;
        csv += `Status:,${this.statusValue || 'All'}\n\n`;

        const headers = [
            'Res No',
            'Staff',
            'Shift Date',
            'Mileage in KM',
            'Type of Vehicle',
            'Cost per KM',
            'Mileage Amount',
            'Amount',
            'Total Amount',
            'Status',
            'Approved Date'
        ];

        csv += headers.join(',') + '\n';

        rows.forEach(r => {

            const values = [
                r.Name,
                r.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c || '',
                r.ShiftDate__c || '',
                r.Mileage_Others__c || '',
                r.Type_of_Vehicle__c || '',
                r.Cost_per_KM__c || '',
                r.Mileage_Amount__c || '',
                r.Amount__c || '',
                r.Total_Amount__c || '',
                r.Approval_Status__c || '',
                r.Approved_Date__c || ''
            ];

            const escaped = values.map(v =>
                `"${(v ?? '').toString().replace(/"/g, '""')}"`
            );

            csv += escaped.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];

        a.href = url;
        a.download = `Reimbursement_Report_${today}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    }

    downloadReimbursementPDF() {

        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('jsPDF not loaded');
            return;
        }

        const rows = this.reimbursementAllRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No reimbursement data available', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(16);
        doc.text('Reimbursement Report', 14, 18);

        doc.setFontSize(11);
        doc.text(`Start Date: ${this.startDate || ''}`, 14, 26);
        doc.text(`End Date: ${this.endDate || ''}`, 14, 32);
        doc.text(`Status: ${this.statusValue || 'All'}`, 14, 38);

        const headers = [
            'Res No',
            'Staff',
            'Shift Date',
            'Mileage KM',
            'Type of Vehicle',
            'Cost/KM',
            'Mileage Amount',
            'Amount',
            'Total',
            'Status',
            'Approved Date'
        ];

        const body = rows.map(r => ([
            r.Name || '',
            r.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c || '',
            r.ShiftDate__c || '',
            r.Mileage_Others__c || '',
            r.Type_of_Vehicle__c || '',
            r.Cost_per_KM__c || '',
            r.Mileage_Amount__c || '',
            r.Amount__c || '',
            r.Total_Amount__c || '',
            r.Approval_Status__c || '',
            r.Approved_Date__c || ''
        ]));

        doc.autoTable({
            head: [headers],
            body: body,
            startY: 44,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Reimbursement_Report_${today}.pdf`);

    }

    downloadRejectedShiftCSV() {

        const rows = this.rejectedFilteredRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No rejected shift data available', 'info');
            return;
        }

        let csv = '';

        csv += 'Rejected Shift Report\n';
        csv += `Start Date:,${this.startDate || ''}\n`;
        csv += `End Date:,${this.endDate || ''}\n\n`;

        const headers = [
            'Date',
            'Staff',
            'Facility',
            'Role',
            'Shift Type',
            'Participant Name',
            'Comments',
            'Rejected At',
            'Reassigned To',
            'Reassigned Time'
        ];

        csv += headers.join(',') + '\n';

        rows.forEach(r => {

            const values = [
                r.formattedDate,
                r.staffName,
                r.facility,
                r.role,
                r.shiftType,
                r.participant,
                r.comments,
                r.rejectedDate,
                r.reassignedStaffName,
                r.reassignedDate
            ];

            const escaped = values.map(v =>
                `"${(v ?? '').toString().replace(/"/g, '""')}"`
            );

            csv += escaped.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];

        a.href = url;
        a.download = `Rejected_Shift_Report_${today}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    }

    downloadRejectedShiftPDF() {

        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('jsPDF not loaded');
            return;
        }

        const rows = this.rejectedFilteredRecords;

        if (!rows || !rows.length) {
            this.showToast('Info', 'No rejected shift data available', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(16);
        doc.text('Rejected Shift Report', 14, 18);

        doc.setFontSize(11);
        doc.text(`Start Date: ${this.startDate || ''}`, 14, 26);
        doc.text(`End Date: ${this.endDate || ''}`, 14, 32);

        const headers = [
            'Date',
            'Staff',
            'Facility',
            'Role',
            'Shift Type',
            'Participant Name',
            'Comments',
            'Rejected At',
            'Reassigned To',
            'Reassigned Time'
        ];

        const body = rows.map(r => [
            r.formattedDate || '',
            r.staffName || '',
            r.facility || '',
            r.role || '',
            r.shiftType || '',
            r.participant  || '',
            r.comments || '',
            r.rejectedDate || '',
            r.reassignedStaffName || '',
            r.reassignedDate || ''
        ]);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }   // same header color
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Rejected_Shift_Report_${today}.pdf`);

    }

    downloadShiftReportCSV() {

        const rows = this.filteredRecords;

        if (!rows || rows.length === 0) {
            console.warn('No data available');
            return;
        }

        let csvContent = '';

        // 🔹 Report Title
        csvContent += 'Shift Report\n';

        // 🔹 Date Range
        csvContent += `Start Date:,${this.startDate || ''}\n`;
        csvContent += `End Date:,${this.endDate || ''}\n`;

        // Empty line for spacing
        csvContent += '\n';

        // 🔹 Table Headers
        const headers = [
            'Staff',
            'Date',
            'Shift Type',
            'Shift Time',
            'Role',
            'Participants',
            'Status'
        ];

        csvContent += headers.join(',') + '\n';

        // 🔹 Data Rows
        rows.forEach(row => {
            const values = [
                row.staffName,
                row.date,
                row.shiftType,
                row.shiftTime,
                row.role,
                row.participants,
                row.status
            ];

            const escaped = values.map(value =>
                `"${(value ?? '').toString().replace(/"/g, '""')}"`
            );

            csvContent += escaped.join(',') + '\n';
        });

        // 🔹 Create File
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `Shift_Report_${today}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadShiftReportPDF() {

        // 🔒 Safety check
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('jsPDF not loaded yet');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const rows = this.filteredRecords;

        if (!rows || rows.length === 0) {
            console.warn('No data available');
            return;
        }

        /* =========================
        🔹 Title Section
        ========================== */

        doc.setFontSize(18);
        doc.text('Shift Report', 14, 20);

        doc.setFontSize(11);
        doc.text(`Start Date: ${this.startDate || ''}`, 14, 30);
        doc.text(`End Date: ${this.endDate || ''}`, 14, 36);

        /* =========================
        🔹 Table Data
        ========================== */

        const tableColumn = [
            'Staff',
            'Date',
            'Shift Type',
            'Shift Time',
            'Role',
            'Participants',
            'Status'
        ];

        const tableRows = rows.map(row => [
            row.staffName || '',
            row.date || '',
            row.shiftType || '',
            row.shiftTime || '',
            row.role || '',
            row.participants || '',
            row.status || ''
        ]);

        // 🔹 IMPORTANT: autoTable from window (UMD)
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        /* =========================
        🔹 Save PDF
        ========================== */

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Shift_Report_${today}.pdf`);

    }

    get showNewTemplateInput() {
        return this.selectedTemplateId === 'NEW';
    }

    get isDeleteDisabled() {
        return this.selectedTemplateId === 'NEW';
    }

    get visibleSections() {
        console.log('this.sections >>>>', JSON.stringify(this.sections, null, 2));
        return this.sections;
    }

    /* buildSectionsForReport() {

         if (this.reportTypeValue === 'SHIFT') {

            this.sections = [
                { key: 'STAFF_NAME', label: 'Staff Name', checked: false },
                { key: 'DATE', label: 'Date', checked: false },
                { key: 'SHIFT_TYPE', label: 'Shift Type', checked: false },
                { key: 'SHIFT_TIME', label: 'Shift Time', checked: false },
                { key: 'ROLE', label: 'Role', checked: false },
                { key: 'PARTICIPANTS', label: 'Participants', checked: false },
                { key: 'STATUS', label: 'Status', checked: false }
            ];

        } 
        else if (this.reportTypeValue === 'REJECTED_SHIFT') {

            this.sections = [
                { key: 'DATE', label: 'Date', checked: false },
                { key: 'STAFF_NAME', label: 'Staff Name', checked: false },
                { key: 'FACILITY', label: 'Facility', checked: false },
                { key: 'ROLE', label: 'Role', checked: false },
                { key: 'SHIFT_TYPE', label: 'Shift Type', checked: false },
                { key: 'PARTICIPANT', label: 'Participant Name', checked: false },
                { key: 'COMMENTS', label: 'Comments', checked: false },
                { key: 'REJECTED_DATE', label: 'Rejected Date', checked: false },
                { key: 'REASSIGNED_TO', label: 'Reassigned To', checked: false },
                { key: 'REASSIGNED_DATE', label: 'Reassigned Time', checked: false }
            ];

        }
        else if (this.reportTypeValue === 'REIMBURSEMENT') {

            this.sections = [
                { key: 'RES_NO',              label: 'Res No',            checked: false },
                { key: 'REIMB_STAFF',         label: 'Staff',             checked: false },
                { key: 'REIMB_SHIFT_DATE',    label: 'Shift Date',        checked: false },
                { key: 'REIMB_MILEAGE_KM',    label: "Mileage in KM's",   checked: false },
                { key: 'REIMB_COST_PER_KM',   label: 'Cost per KM',       checked: false },
                { key: 'REIMB_MILEAGE_AMOUNT',label: 'Mileage Amount',   checked: false },
                { key: 'REIMB_AMOUNT',        label: 'Amount',            checked: false },
                { key: 'REIMB_TOTAL_AMOUNT',  label: 'Total Amount',      checked: false },
                { key: 'REIMB_STATUS',        label: 'Status',            checked: false },
                { key: 'REIMB_APPROVED_DATE', label: 'Approved Date',     checked: false }
            ];

        } 
        else if (this.reportTypeValue === 'STAFF') {
            this.sections = [
                { key: 'STAFF_NAME', label: 'Staff Name', checked: false },
                { key: 'EMAIL', label: 'Email', checked: false },
                { key: 'CONTACT_NUMBER', label: 'Contact Number', checked: false },
                { key: 'GENDER', label: 'Gender', checked: false },
                { key: 'DOB', label: 'Date of Birth', checked: false },
                { key: 'STATUS', label: 'Status', checked: false }
            ];
        }
        else if (this.reportTypeValue === 'PARTICIPANT') {
            this.sections = [
                { key: 'PARTICIPANT_NAME', label: 'Participant Name', checked: false },
                { key: 'EMAIL',           label: 'Email', checked: false },
                { key: 'CONTACT_NUMBER',  label: 'Contact Number', checked: false },
                { key: 'GENDER',          label: 'Gender', checked: false },
                { key: 'PARTICIPANT_TYPE',label: 'Participant Type', checked: false },
                { key: 'STATUS',          label: 'Status', checked: false }
            ];
        }
        else if (this.reportTypeValue === 'OVER_EFF') {
            this.sections = [
                { key: 'STAFF_NAME',      label: 'Staff Name',         checked: false },
                { key: 'SET_HOURS',       label: 'Set Hrs(SH)',        checked: false },
                { key: 'ROSTERED_HOURS',  label: 'Rostered Hrs(RH)',   checked: false },
                { key: 'COMPLETED_HOURS', label: 'Completed Hrs(CH)', checked: false },
                { key: 'RH_VARIANCE',     label: 'RH Variance(RH-SH)', checked: false },
                { key: 'CH_VARIANCE',     label: 'CH Variance(CH-SH)', checked: false },
                { key: 'STATUS',          label: 'Status',             checked: false }
            ];
        }
        else {
            this.sections = [];
        }
        this.sections = Object.keys(this.templateKeyToLabelMap).map((key, index) => {
            return {
                key: key,
                label: this.templateKeyToLabelMap[key],
                checked: false,
                order: null
            };
        });
    } */

    buildSectionsForReport() {

        let allowedKeys = [];

        if (this.reportTypeValue === 'SHIFT') {

            allowedKeys = [
                'STAFF_NAME',
                'DATE',
                'SHIFT_TYPE',
                'SHIFT_TIME',
                'ROLE',
                'PARTICIPANTS',
                'STATUS'
            ];

        } else if (this.reportTypeValue === 'REJECTED_SHIFT') {

            allowedKeys = [
                'DATE',
                'STAFF_NAME',
                'FACILITY',
                'ROLE',
                'SHIFT_TYPE',
                'PARTICIPANT',
                'COMMENTS',
                'REJECTED_DATE',
                'REASSIGNED_TO',
                'REASSIGNED_DATE'
            ];

        } else if (this.reportTypeValue === 'REIMBURSEMENT') {

            allowedKeys = [
                'RES_NO',
                'REIMB_STAFF',
                'REIMB_SHIFT_DATE',
                'REIMB_MILEAGE_KM',
                'REIMB_VEHICLE_TYPE',
                'REIMB_COST_PER_KM',
                'REIMB_MILEAGE_AMOUNT',
                'REIMB_AMOUNT',
                'REIMB_TOTAL_AMOUNT',
                'REIMB_STATUS',
                'REIMB_APPROVED_DATE'
            ];

        } else if (this.reportTypeValue === 'STAFF') {

            allowedKeys = [
                'STAFF_NAME',
                'EMAIL',
                'CONTACT_NUMBER',
                'GENDER',
                'DOB',
                'STATUS'
            ];

        } else if (this.reportTypeValue === 'PARTICIPANT') {

            allowedKeys = [
                'PARTICIPANT_NAME',
                'PARTICIPANT_EMAIL',
                'PARTICIPANT_CONTACT',
                'PARTICIPANT_GENDER',
                'PARTICIPANT_TYPE',
                'PARTICIPANT_STATUS'
            ];

        } else if (this.reportTypeValue === 'OVER_EFF') {

            allowedKeys = [
                'STAFF_NAME',
                'SET_HOURS',
                'ROSTERED_HOURS',
                'COMPLETED_HOURS',
                'RH_VARIANCE',
                'CH_VARIANCE'
            ];
        }

        this.sections = allowedKeys.map(key => ({
            key: key,
            label: this.templateKeyToLabelMap[key],
            checked: false,
            order: null
        }));

        console.log('Sections built for report:', this.sections);
    }

    handleSectionChange(event) {

        const key = event.target.dataset.key;
        const checked = event.target.checked;

        this.sections = this.sections.map((section, index) => {
            if (section.key === key) {
                return {
                    ...section,
                    checked: checked,
                    order: index + 1
                };
            }
            return section;
        });
    }

    handleTemplateChange(event) {

        const value = event.detail.value;

        // store previous only when user switches to NEW
        if (value === 'NEW') {
            this.previousTemplateId = this.selectedTemplateId;
        }

        this.selectedTemplateId = value;
        this.hasUnsavedChanges = false;

        if (this.selectedTemplateId === 'NEW') {
            this.isCreatingTemplate = true;
            this.newTemplateName = '';
            this.clearAllSelections();
            return;
        }

        this.isCreatingTemplate = false;

        const tpl = this.templatesforShiftReport.find(
            t => t.value === this.selectedTemplateId
        );

        if (tpl && tpl.json) {
            try {
                const parsed = JSON.parse(tpl.json);
                this.applyTemplate(parsed);
            } catch (e) {
                this.clearAllSelections();
            }
        } else {
            this.clearAllSelections();
        }
    }

    handleNewTemplateNameChange(event) {
        this.newTemplateName = event.target.value;
    }

    handleConfirmNewTemplate() {

        const name = (this.newTemplateName || '').trim();

        if (!name) {
            this.showToast('Error', 'Enter template name', 'error');
            return;
        }

        // prevent duplicate labels
        const exists = this.templatesforShiftReport.some(
            t => (t.label || '').toLowerCase() === name.toLowerCase()
        );

        if (exists) {
            this.showToast('Error', 'Template name already exists', 'error');
            return;
        }

        // temporary client-side id
        const tempId = 'TMP_' + Date.now();

        const newOption = {
            label: name,
            value: tempId,
            json: null
        };

        this.templatesforShiftReport = [
            ...this.templatesforShiftReport,
            newOption
        ];

        // select the newly created template
        this.selectedTemplateId = tempId;
        this.isCreatingTemplate = false;
    }

    handleCancelNewTemplate() {

        this.isCreatingTemplate = false;
        this.newTemplateName = '';

        // restore previous selection
        if (this.previousTemplateId) {
            this.selectedTemplateId = this.previousTemplateId;
        } else {
            // fallback (first real option if any)
            const first = this.templatesforShiftReport.find(t => t.value !== 'NEW');
            this.selectedTemplateId = first ? first.value : 'NEW';
        }

        this.previousTemplateId = null;
    }

    clearAllSelections() {
        this.sections = this.sections.map(sec => ({
            ...sec,
            checked: false
        }));
    }

    applyTemplate(templateJson) {
        if (!templateJson || typeof templateJson !== 'object') {
            console.error('Invalid template JSON:', templateJson);
            return;
        }

        const newSections = this.sections.map(sec => ({
            ...sec,
            checked: templateJson[sec.key] === true
        }));

        this.sections = newSections;
        this.hasUnsavedChanges = false;
    }

    buildTemplatePayload() {
        const payload = {};

        this.sections.forEach(sec => {
            payload[sec.key] = sec.checked === true;
        });

        return payload;
    }

    StaffBasedReportshowModalclose() {
        // close the modal
        this.isStaffBasedReportshowModal = false;

        // reset NEW template UI state
        this.isCreatingTemplate = false;
        this.newTemplateName = '';

        // restore previous template if user was in NEW mode
        if (this.selectedTemplateId === 'NEW' && this.previousTemplateId) {
            this.selectedTemplateId = this.previousTemplateId;
        }

        this.previousTemplateId = null;
    }

    async StaffBasedReportshowModalsave() {

        console.log('===== StaffBasedReportshowModalsave START =====');

        /* =====================================================
        STEP 1: Validate Export Type
        ===================================================== */

        console.log('Selected Export Type =>', this.selectedExportType);

        if (!this.selectedExportType) {
            console.warn('Export Type NOT selected');
            this.showToast('Error', 'Please select export type.', 'error');
            return;
        }

        /* =====================================================
        STEP 2: Validate Sections Checked
        ===================================================== */

        const hasChecked = this.sections.some(s => s.checked === true);
        console.log('At least one section checked =>', hasChecked);
        console.log('Sections Snapshot =>', JSON.stringify(this.sections));

        if (!hasChecked) {
            console.warn('No fields selected');
            this.showToast('Error', 'Select at least one field.', 'error');
            return;
        }

        /* =====================================================
        STEP 3: Validate Template Selection
        ===================================================== */

        console.log('Selected Template Id =>', this.selectedTemplateId);

        if (!this.selectedTemplateId) {
            console.warn('Template not selected');
            this.showToast('Error', 'Please select a template.', 'error');
            return;
        }

        if (this.selectedTemplateId === 'NEW') {
            console.warn('Template is NEW but not confirmed');
            this.showToast(
                'Error',
                'Please enter and confirm a new template before saving.',
                'error'
            );
            return;
        }

        /* =====================================================
        STEP 4: Build Template Payload
        ===================================================== */

        const payload = this.buildTemplatePayload();
        payload.exportType = this.selectedExportType;

        console.log('Template Payload Object =>', payload);

        const templateJson = JSON.stringify(payload);

        console.log('Template JSON =>', templateJson);

        /* =====================================================
        STEP 5: Detect New vs Existing Template
        ===================================================== */

        const isTemp = String(this.selectedTemplateId).startsWith('TMP_');

        const templateIdToSend = isTemp
            ? null
            : this.selectedTemplateId;

        const templateNameToSend = isTemp
            ? this.newTemplateName
            : this.templatesforShiftReport.find(
                t => t.value === this.selectedTemplateId
            )?.label;

        console.log('Is Temporary Template =>', isTemp);
        console.log('Template Id To Send =>', templateIdToSend);
        console.log('Template Name To Send =>', templateNameToSend);
        console.log('Facility Id To Send =>', this.selectedFacilityId);
        console.log('Report Type =>', this.reportTypeValue);

        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        console.log('storedFacilityId >>', storedFacilityId);
        console.log('storedFacilityLabel >>', storedFacilityLabel);
        this.selectedFacilityId = storedFacilityId;

        /* =====================================================
        STEP 6: Call Apex
        ===================================================== */

        try {

            console.log('Calling createTemplate Apex...');

            const saved = await createTemplate({
                templateName: templateNameToSend,
                facilityId: this.selectedFacilityId,
                templateJson: templateJson,
                templateId: templateIdToSend,
                reportType: this.reportTypeValue,
            });

            console.log('Apex Response (Saved Template) =>',
                JSON.stringify(saved)
            );

            /* =====================================================
            STEP 7: Close Modal & Update UI
            ===================================================== */

            this.isStaffBasedReportshowModal = false;
            this.isReportContainer = false;

            console.log('Report Type Handling =>', this.reportTypeValue);

            if (this.reportTypeValue === 'SHIFT') {
                this.isStaffBasedReport1 = true;
                this.isRejectedShiftReport = false;
            }
            else if (this.reportTypeValue === 'REJECTED_SHIFT') {
                this.isRejectedShiftReport = true;
            }
            else if (this.reportTypeValue === 'STAFF') {
                console.log('Staff report selected');
            }
            else if (this.reportTypeValue === 'PARTICIPANT') {
                console.log('Participant report selected');
            }
            else if (this.reportTypeValue === 'REIMBURSEMENT') {
                console.log('Reimbursement report selected');
            }

            /* =====================================================
            STEP 8: Reload Templates
            ===================================================== */

            console.log('Reloading templates...');
            await this.loadTemplates();
            this.initializeGeneratedReports();

            console.log('Templates Reloaded =>',
                JSON.stringify(this.templatesforShiftReport)
            );

            if (saved && saved.Id) {
                this.selectedTemplateId = saved.Id;
                console.log('Selected Template Updated To =>',
                    this.selectedTemplateId
                );
            }

            /* =====================================================
            STEP 9: Create Export Log
            ===================================================== */

            console.log('Creating Export Log with:', {
                exportType: this.selectedExportType,
                reportType: this.reportTypeValue
            });

            this.createExportLog(
                this.selectedExportType,
                this.reportTypeValue
            );

            console.log('===== StaffBasedReportshowModalsave SUCCESS =====');

        } catch (e) {

            console.error('Error Saving Template =>', e);

            const msg =
                e?.body?.message ||
                e?.message ||
                'Unable to save template';

            this.showToast('Error', msg, 'error');

            console.log('===== StaffBasedReportshowModalsave FAILED =====');
        }
    }

    autoSelectFirstTemplate() {

        if (!Array.isArray(this.templatesforShiftReport)) {
            return;
        }

        const firstNonNew = this.templatesforShiftReport.find(
            t => t.value !== 'NEW'
        );

        if (firstNonNew) {
            this.selectedTemplateId = firstNonNew.value;

            // apply its template immediately
            this.buildSectionsForReport();

            if (firstNonNew.json) {
                try {
                    this.applyTemplate(JSON.parse(firstNonNew.json));
                } catch (e) {
                    this.clearAllSelections();
                }
            } else {
                this.clearAllSelections();
            }

        } else {
            // only NEW exists
            this.selectedTemplateId = 'NEW';
        }
    }

    get exportTypeOptions() {
        return [
            { label: 'PDF', value: 'PDF' },
            { label: 'CSV', value: 'EXCEL' }
        ];
    }

    handleExportTypeChange(event) {

        console.log('===== handleExportTypeChange START =====');

        console.log('event.target:', event.target);
        console.log('event.currentTarget:', event.currentTarget);

        const value = event.currentTarget.value;

        console.log('Selected Value:', value);

        this.selectedExportType = value;

        console.log('Updated selectedExportType:', this.selectedExportType);
        console.log('===== handleExportTypeChange END =====');
    }

    closeExportPopup() {
        this.isExportPopupOpen = false;
        this.selectedExportType = '';
    }

    getSelectedTemplateColumnKeys() {

        if (!this.selectedTemplateId || this.selectedTemplateId === 'NEW') {
            return [];
        }

        const tpl = this.templatesforShiftReport.find(
            t => t.value === this.selectedTemplateId
        );

        if (!tpl || !tpl.json) {
            return [];
        }

        try {
            const parsed = JSON.parse(tpl.json);
            return Object.keys(parsed).filter(k => parsed[k] === true);
        } catch (e) {
            console.error('Invalid template json', e);
            return [];
        }
    }

    normalizeTemplateKeysForReport(templateKeys) {

        console.log(
            'normalizeTemplateKeysForReport → reportType =',
            this.reportTypeValue
        );

        // ✅ do nothing for all other reports
        if (this.reportTypeValue !== 'PARTICIPANT') {
            return templateKeys;
        }

        const keyMap = {
            EMAIL: 'PARTICIPANT_EMAIL',
            CONTACT_NUMBER: 'PARTICIPANT_CONTACT',
            GENDER: 'PARTICIPANT_GENDER',
            STATUS: 'PARTICIPANT_STATUS',
            PARTICIPANT_TYPE: 'PARTICIPANT_TYPE'
        };

        const normalized = templateKeys.map(k => keyMap[k] || k);

        console.log(
            'Participant normalized keys =>',
            JSON.stringify(normalized)
        );

        return normalized;
    }

    handleExport() {

        const exportType = event.currentTarget.dataset.type;
        console.log('handleExport called →', this.reportTypeValue);

        if (!this.selectedExportType) {
            this.showToast('Error', 'Please select export type', 'error');
            return;
        }

        let templateKeys = this.getSelectedTemplateColumnKeys();

        console.log('Original templateKeys =>', JSON.stringify(templateKeys));

        if (!templateKeys.length) {
            this.showToast('Error', 'Selected template has no columns.', 'error');
            return;
        }

        // ✅ only PARTICIPANT will be normalized
        templateKeys = this.normalizeTemplateKeysForReport(templateKeys);

        console.log('Final templateKeys used =>', JSON.stringify(templateKeys));

        let rows;

        if (this.reportTypeValue === 'REJECTED_SHIFT') {

            rows = this.rejectedFilteredRecords;

        }
        else if (this.reportTypeValue === 'REIMBURSEMENT') {

            rows = this.reimbursementAllRecords;

        }
        else if (this.reportTypeValue === 'STAFF') {

            rows = this.staffAllRecords;

        }
        else if (this.reportTypeValue === 'PARTICIPANT') {

            rows = this.participantAllRecords;

        }
        else if (this.reportTypeValue === 'OVER_EFF') {     // ✅ ADD THIS

            // Under / Over efficiency list
            rows = this.underOverAllRecords;

            console.log('Using UNDER / OVER rows =>', rows?.length);

        }
        else {

            rows = this.filteredRecords;

        }

        console.log('Rows count =>', rows?.length);

        if (!rows || !rows.length) {
            this.showToast('Error', 'No data available to export.', 'error');
            return;
        }

        if (this.selectedExportType === 'EXCEL') {

            this.exportExcelFromTemplate(templateKeys, rows);

        } else {

            this.exportPdfFromTemplate(templateKeys, rows);

        }

        this.isExportPopupOpen = false;
    }

    getValueByPath(obj, path) {

        if (!obj || !path) {
            console.log('getValueByPath → empty obj or path', obj, path);
            return '';
        }

        // ✅ Special handling for UNDER / OVER report
        if (this.reportTypeValue === 'OVER_EFF') {

            if (path === 'staffName') {
                console.log('[OVER_EFF FIX] staffName -> name', obj.name);
                return obj.name ?? '';
            }

        }

        const value = path.split('.').reduce((acc, key) => {
            return acc && acc[key] !== undefined ? acc[key] : '';
        }, obj);

        console.log('getValueByPath →', path, '=>', value);
        return value;
    }

    exportExcelFromTemplate(templateKeys, rows) {

        console.log('exportExcelFromTemplate called');
        console.log('templateKeys =>', templateKeys);
        console.log('rows sample =>', rows[0]);

        const headers = templateKeys.map(
            k => this.templateKeyToLabelMap?.[k] || k
        );

        console.log('headers =>', headers);

        let csv = '';
        csv += headers.join(',') + '\n';

        rows.forEach((row, rowIndex) => {

            if (rowIndex === 0) {
                console.log('Row 0 for export =>', row);
            }

            const values = templateKeys.map(key => {

                const fieldPath = this.templateKeyToFieldMap?.[key];

                if (rowIndex === 0) {
                    console.log(
                        '[CSV] key =>', key,
                        'fieldPath =>', fieldPath
                    );
                }

                const value = fieldPath
                    ? this.getValueByPath(row, fieldPath)
                    : '';

                if (rowIndex === 0) {
                    console.log(
                        '[CSV] resolved value =>', value
                    );
                }

                return `"${String(value).replace(/"/g, '""')}"`;
            });

            csv += values.join(',') + '\n';
        });

        const blob = new Blob(
            [csv],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];

        let filePrefix = 'Shift_Report';

        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            filePrefix = 'Rejected_Shift_Report';
        }
        else if (this.reportTypeValue === 'REIMBURSEMENT') {
            filePrefix = 'Reimbursement_Report';
        }
        else if (this.reportTypeValue === 'STAFF') {
            filePrefix = 'Staff_Report';
        }
        else if (this.reportTypeValue === 'PARTICIPANT') {
            filePrefix = 'Participant_Report';
        }
        else if (this.reportTypeValue === 'OVER_EFF') {
            filePrefix = 'Under_Over_Efficiency_Report';
        }

        console.log('CSV filePrefix =>', filePrefix);

        a.href = url;
        a.download = `${filePrefix}_${today}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    }

    exportPdfFromTemplate(templateKeys, rows) {

        console.log('exportPdfFromTemplate called');
        console.log('templateKeys =>', templateKeys);
        console.log('rows sample =>', rows[0]);

        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('jsPDF not loaded');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const headers = templateKeys.map(
            k => this.templateKeyToLabelMap?.[k] || k
        );

        console.log('PDF headers =>', headers);

        const body = rows.map((row, rowIndex) =>
            templateKeys.map(key => {

                const fieldPath = this.templateKeyToFieldMap?.[key];

                if (rowIndex === 0) {
                    console.log(
                        '[PDF] key =>', key,
                        'fieldPath =>', fieldPath
                    );
                }

                const value = fieldPath
                    ? this.getValueByPath(row, fieldPath)
                    : '';

                if (rowIndex === 0) {
                    console.log(
                        '[PDF] resolved value =>', value
                    );
                }

                return value;
            })
        );

        let title = 'Shift Report';

        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            title = 'Rejected Shift Report';
        }
        else if (this.reportTypeValue === 'REIMBURSEMENT') {
            title = 'Reimbursement Report';
        }
        else if (this.reportTypeValue === 'STAFF') {
            title = 'Staff Report';
        }
        else if (this.reportTypeValue === 'PARTICIPANT') {
            title = 'Participant Report';
        }
        else if (this.reportTypeValue === 'OVER_EFF') {
            title = 'Under / Over Efficiency Report';
        }

        console.log('PDF title =>', title);

        doc.setFontSize(14);
        doc.text(title, 14, 18);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: 26,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: {
                fillColor: [12, 120, 186],
                textColor: 255
            }
        });

        const today = new Date().toISOString().split('T')[0];

        let filePrefix = 'Shift_Report';

        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            filePrefix = 'Rejected_Shift_Report';
        }
        else if (this.reportTypeValue === 'REIMBURSEMENT') {
            filePrefix = 'Reimbursement_Report';
        }
        else if (this.reportTypeValue === 'STAFF') {
            filePrefix = 'Staff_Report';
        }
        else if (this.reportTypeValue === 'PARTICIPANT') {
            filePrefix = 'Participant_Report';
        } 
        else if (this.reportTypeValue === 'OVER_EFF') {
            filePrefix = 'Under_Over_Efficiency_Report';
        }

        console.log('PDF filePrefix =>', filePrefix);

        doc.save(`${filePrefix}_${today}.pdf`);
      
    }

    handleStaffSearch(event) {
        // ✅ keep input value in sync
        this.selectedStaffName = event.target.value;

        this.showStaffDropdown = true;
        console.log('this.showStaffDropdown >>>>', this.showStaffDropdown);

        const key = (event.target.value || '').toLowerCase();

        this.filteredStaffList = this.staffList.filter(s =>
            (s.Name || '').toLowerCase().includes(key)
        );
    }

    handleStaffSearchFocus() {
        console.log('Staff search focused');
        console.log('Available staff count:', this.staffList.length);   
        this.showStaffDropdown = true;
        // Auto-populate full list when clicked
        this.filteredStaffList = [...this.staffList];
    }

    handleStaffOutsideClick = (event) => {
        if (!this.showStaffDropdown) {
            return;
        }

        const container = this.template.querySelector('.staff-search-container');

        if (!container) {
            return;
        }

        // If click is NOT inside staff search container → close dropdown
        if (!container.contains(event.target)) {
            this.showStaffDropdown = false;
        }
    };

    stopStaffClick(event) {
        event.stopPropagation();
    }

    handleStaffSelect(event) {

        const staffId = event.currentTarget.dataset.id;

        const staff = this.staffList.find(s => s.Id === staffId);
        if (!staff) return;

        this.selectedStaffId = staff.Id;
        this.selectedStaffName = staff.Display_Nickname__c;

        this.filteredStaffList = [];

        console.log('Selected staff:', staff.Display_Nickname__c, staff.Id);

        // 🔥 CALL APEX
        processStaffSelection({ staffId: staff.Id })
        .then(result => {

            console.log('Apex Result:', JSON.parse(JSON.stringify(result)));

            if (!result || result.length === 0) {
                this.filteredStaffList = [];
                return;
            }

            this.filteredStaffList = result.map(role => ({
                label: role.Role_Name__c,   // ← update correctly
                value: role.Role_Name__c
            }));

            console.log('Mapped Roles:', this.filteredStaffList);
        })
        .catch(error => {
            console.error('Apex Error:', error);
        });

        this.showStaffDropdown = false;
    }

    handleStatusChange(event) {
        const value = event.detail.value;
        console.log('handleStatusChange fired →', value);
        this.statusValue = value;
        console.log('Updated statusValue →', this.statusValue);
    }

    handlebuildYourReport(event) {
        console.log('Build Your Report button clicked');
        this.favoritesflag = false;

        // Your logic here
    }

    /* handleBack(event){
        console.log('Back to favorites button clicked');
        this.resetAllFilters();
        this.reportTypeValue = '';
        this.favoritesflag = true;
    } */

    handleBack() {

        console.log('Back clicked → resetting all fields');

        /* Report Type */
        this.reportTypeValue = null;

        /* Reset Filters */
        this.resetAllFilters();

        /* Reset Staff Selection */
        this.selectedStaffType = null;
        this.selectedStaffId = null;
        this.selectedStaffName = '';

        /* Reset Facilities */
        this.selectedFacilityIds = [];
        this.selectedFacilityId = null;

        /* Reset Dates */
        this.startDate = '';
        this.endDate = '';
        this.selectedDateRange = '';

        /* Reset Roles */
        if (this.roleCheckboxes) {
            this.roleCheckboxes = this.roleCheckboxes.map(role => {
                return {
                    ...role,
                    checked: false
                };
            });
        }

        console.log('Roles reset:', this.roleCheckboxes);

        /* Reset Flags */
        this.isReportContainer = true;
        this.isStaffBasedReport = false;
        this.isRejectedShiftReport = false;
        this.isStaffBasedReport1 = false;
        this.reimbursementflag = false;
        this.participantflag = false;
        this.staffListflag = false;
        this.isunderandOverReport = false;

        /* Reset Results */
        this.recordsToDisplay = [];
        this.filteredRecords = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.pageNumber = 1;

        /* Reset Favorites */
        this.isFavorite = false;
        this.favoriteText = 'Add to favorite';
        this.selectedFavoriteId = null;
        this.favoritesflag = true;

        /* Disable Generate Button */
        this.generatereport = true;

        console.log('All filters and roles cleared successfully');
    }

    handleToggleFavorite() {

        this.isFavorite = !this.isFavorite;

        const filtersPayload = {
            roles: this.selectedRoles,
            isAllStaff: this.isAllStaff,
            isIndividualStaff: this.isIndividualStaff,
            employmentType: this.selectedEmploymentType,
            location: this.selectedLocation,
            startDate: this.startDate,
            endDate: this.endDate,
            selectedDateRange: this.selectedDateRange,
            staffName: this.selectedStaffName,
            staffId: this.selectedStaffId,
            status: this.selectedstaffStatus,
            facility: this.selectedFacilityIds,
            reportType: this.reportTypeValue,
            reportStatus: this.selectedstaffStatus,
            reportrembursmentStatus: this.statusValue
        };

        const filtersJson = JSON.stringify(filtersPayload);
        const filterKey = btoa(filtersJson);

        // ===== ADD FAVORITE =====
        if (this.isFavorite) {

            // 🚫 LIMIT CHECK
            if (this.favoriteReports && this.favoriteReports.length >= 10) {

                this.showToast(
                    'Limit Reached',
                    'You can only have up to 10 favorite reports.',
                    'error'
                );

                // revert toggle state
                this.isFavorite = false;
                return;
            }

            this.favoriteText = 'Remove from favorite';
            this.favoriteClass = 'favorite-active';
            this.isFavorite = true;

            createFavorite({
                facilityId: this.selectedFacilityId,
                reportType: this.reportTypeValue,
                filterKey: filterKey,
                filtersJson: filtersJson
            })
            .then(() => {
                this.showToast('Success', 'Added to favorites', 'success');
                this.initializeReports();
            })
            .catch(error => {
                console.error(error);
            });

        } 
        // ===== REMOVE FAVORITE =====
        else {

            this.favoriteText = 'Add to favorite';
            this.favoriteClass = '';

            deleteFavorite({
                favoriteId: this.selectedFavoriteId
            })
            .then(() => {
                this.showToast('Success', 'Removed from favorites', 'success');
                this.initializeReports();
            })
            .catch(error => {
                console.error(error);
            });
        }
    }
    
    handleFavoriteClick(event) {

        console.log('===== FAVORITE CLICK START =====');

        const reportId = event.currentTarget.dataset.id;
        console.log('Clicked Report Id:', reportId);

        if (!reportId) {
            console.warn('No reportId found in dataset');
            return;
        }

        // Find selected favorite
        const selectedReport = this.favoriteReports.find(
            rep => rep.id === reportId
        );

        console.log('Selected Report Object:',
            JSON.parse(JSON.stringify(selectedReport))
        );

        if (!selectedReport) {
            console.warn('No matching favorite report found!');
            return;
        }

        this.selectedFavoriteId = selectedReport.id;
        console.log('Selected Favorite Id:', this.selectedFavoriteId);

        const filters = selectedReport.filters || {};
        console.log('Saved Filters:',
            JSON.parse(JSON.stringify(filters))
        );

        /* =====================================================
        STEP 1: Apply report type FIRST (resets filters)
        ===================================================== */
        console.log('Applying Report Type:', selectedReport.type);
        this.applyReportType(selectedReport.type);

        this.favoritesflag = false;

        /* =====================================================
        STEP 2: Restore filters AFTER reset
        ===================================================== */

        // Roles
        this.selectedRoles = Array.isArray(filters.roles)
            ? filters.roles
            : (filters.roles ? [filters.roles] : []);

        this.isAllStaff = filters.isAllStaff || false;
        this.isIndividualStaff = filters.isIndividualStaff || false;
        this.selectedEmploymentType = filters.employmentType || null;
        this.selectedLocation = filters.location || null;
        this.startDate = filters.startDate || null;
        this.endDate = filters.endDate || null;
        this.selectedStaffName = filters.staffName || null;
        this.selectedStaffId = filters.staffId || null;
        this.selectedstaffStatus = filters.reportStatus || null;
        this.selectedStaffType = filters.staffType || null;
        this.selectedDateRange = filters.selectedDateRange || null;
        this.statusValue = filters.reportrembursmentStatus || null;
        this.reportTypeValue = filters.reportType || null;

        /* =====================================================
        STEP 3: Restore Facilities
        UI → Single value
        Backend → All values
        ===================================================== */

        // Restore facility selection
        this.selectedFacilityId = Array.isArray(filters.facility)
            ? filters.facility
            : (filters.facility ? [filters.facility] : []);

        this.selectedFacilityIds = [...this.selectedFacilityId];

        console.log('Restored Facilities =>', this.selectedFacilityId);
        this.selectedStaffType = filters.staffType || null;

        this.selectedFacilityIds = [...this.selectedFacilityId];

        console.log('Applied Filters To State:', {
            selectedRoles: this.selectedRoles,
            isAllStaff: this.isAllStaff,
            isIndividualStaff: this.isIndividualStaff,
            employmentType: this.selectedEmploymentType,
            location: this.selectedLocation,
            startDate: this.startDate,
            endDate: this.endDate,
            staffName: this.selectedStaffName,
            staffId: this.selectedStaffId,
            status: this.selectedstaffStatus,
            selectedDateRange: this.selectedDateRange
        });

        /* =====================================================
        STEP 4: Sync Role Checkboxes
        ===================================================== */

        if (Array.isArray(this.roleCheckboxes)) {

            this.roleCheckboxes = this.roleCheckboxes.map(role => ({
                ...role,
                checked: this.selectedRoles.includes(role.value)
            }));

            console.log('Role Checkboxes Synced:',
                JSON.parse(JSON.stringify(this.roleCheckboxes))
            );
        }

        /* =====================================================
        STEP 5: Handle Date Range
        ===================================================== */

        this.isCustomRange = this.selectedDateRange === 'CUSTOM';

        console.log(
            this.isCustomRange
                ? 'Custom Date Range Enabled'
                : 'Preset Date Range Selected'
        );

        /* =====================================================
        STEP 6: Reload Staff (if roles exist)
        ===================================================== */

        if (this.selectedRoles.length > 0) {
            console.log('Fetching staff for roles:', this.selectedRoles);
            this.fetchStaff();
        }

        /* =====================================================
        STEP 7: Update Favorite UI
        ===================================================== */

        this.isFavorite = true;
        this.favoriteText = 'Remove from favorite';
        this.favoriteClass = 'favorite-active';

        console.log('Favorite UI Updated');

        /* =====================================================
        STEP 8: Update Generate Button
        ===================================================== */

        this.updateGenerateButtonState();
        console.log('Generate button state updated');

        console.log('===== FAVORITE CLICK END =====');
    }

    createExportLog(exportType, reportType) {

        console.log('========== createExportLog START ==========');

        console.log('Export Log Parameters =>', {
            startDate: this.startDate,
            endDate: this.endDate,
            facilityId: this.selectedFacilityIdforgenerated,
            exportType: exportType,
            reportType: reportType,
            selectedDateRange: this.selectedDateRange
        });

        const filtersPayload = {
            roles: this.selectedRoles,
            isAllStaff: this.isAllStaff,
            isIndividualStaff: this.isIndividualStaff,
            employmentType: this.selectedEmploymentType,
            location: this.selectedLocation,
            startDate: this.startDate,
            endDate: this.endDate,
            selectedDateRange: this.selectedDateRange,
            staffName: this.selectedStaffName,
            staffId: this.selectedStaffId,
            status: this.selectedstaffStatus,
            facility: this.selectedFacilityIds,
            reportType: this.reportTypeValue,
            reportStatus: this.selectedstaffStatus,
            reportrembursmentStatus: this.statusValue
        };

        const filtersJson = JSON.stringify(filtersPayload);
        const filterKey = btoa(filtersJson);

        createShiftReportLog({
            startDate: this.startDate,
            endDate: this.endDate,
            facilityId: this.selectedFacilityIdforgenerated,
            exportType: exportType,
            reportType: reportType,
            selectedDateRange: this.selectedDateRange,
            filtersJson: filtersJson,
            filterKey: filterKey
        })
        .then(result => {

            console.log('✅ Export Log Created Successfully');

            console.log('Apex Response =>', JSON.stringify(result));
            setTimeout(() => {
                console.log('⏳ Calling initializeGeneratedReports after 3 seconds');
                this.initializeGeneratedReports();
            }, 3000); 

            console.log('========== createExportLog SUCCESS ==========');

        })
        .catch(error => {

            console.error('❌ Export Log Creation Failed');

            console.error('Error Object =>', error);

            console.error(
                'Error Message =>',
                error?.body?.message || error?.message || JSON.stringify(error)
            );

            console.log('========== createExportLog FAILED ==========');
        });
    }

    handleBackbuildYourReport() {
        this.isExpandedView = false;
    }

    // setupPagination() {
    //     this.totalPages = Math.ceil(this.totalRecords / this.pageSize) || 1;
    //     this.updatePaginatedRecords();
    //     this.updateAllButtonStates();
    // }

    setupPagination() {

        // ✅ decide which dataset to paginate
        const sourceData = this.isExpandedView
            ? this.allGeneratedReports
            : this.generatedReports;

        this.totalRecords = sourceData.length;

        this.totalPages =
            Math.ceil(this.totalRecords / this.pageSize) || 1;

        this.updatePaginatedRecords();
    }

    // updatePaginatedRecords() {
    //     const start = (this.pageNumber - 1) * this.pageSize;
    //     const end = start + this.pageSize;

    //     this.paginatedAllReports = this.allGeneratedReports.slice(start, end);
    //     this.updateAllButtonStates();
    // }

    updatePaginatedRecords() {

        const sourceData = this.isExpandedView
            ? this.allGeneratedReports
            : this.generatedReports;

        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;

        // ✅ TABLE DATA SOURCE
        this.paginatedAllReports = sourceData.slice(start, end);

        this.updateAllButtonStates();
    }    

    updateAllButtonStates() {
        this.disableAllFirst = this.pageNumber <= 1;
        this.disableAllLast = this.pageNumber >= this.totalPages;
    }

    // ===== PAGE SIZE CHANGE =====
    handleAllRecordsPerPage(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.setupPagination();
    }

    // ===== NAVIGATION =====
    firstAllPage() {
        this.pageNumber = 1;
        this.updatePaginatedRecords();
    }

    lastAllPage() {
        this.pageNumber = this.totalPages;
        this.updatePaginatedRecords();
    }

    previousAllPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updatePaginatedRecords();
        }
    }

    nextAllPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updatePaginatedRecords();
        }
    }

    handleKidStarClick(event) {
        event.stopPropagation(); // prevent card click

        const favoriteId = event.currentTarget.dataset.id;

        console.log('⭐ Removing favorite:', favoriteId);

        deleteFavorite({ favoriteId: favoriteId })
            .then(() => {
                this.showToast('Success', 'Removed from favorites', 'success');

                // reload favorites list
                this.initializeReports();
            })
            .catch(error => {
                console.error('Delete favorite error:', error);
                this.showToast('Error', 'Unable to remove favorite', 'error');
            });
    }

    get showRolesSection() {

        console.log('========== showRolesSection START ==========');
        console.log('Report Type:', this.reportTypeValue);

        if (!this.reportTypeValue) {
            console.log('❌ No report type selected');
            console.log('========== showRolesSection END ==========');
            return false;
        }

        // 🔹 Staff Selection Validation
        const isStaffValid =
            this.isAllStaff ||
            (this.isIndividualStaff && this.selectedStaffId);

        console.log('Staff Validation State:', {
            isAllStaff: this.isAllStaff,
            isIndividualStaff: this.isIndividualStaff,
            selectedStaffId: this.selectedStaffId,
            isStaffValid: isStaffValid
        });

        // SHIFT
        if (this.reportTypeValue === 'SHIFT') {

            const result = !!(
                this.selectedDateRange &&
                this.selectedEmploymentType &&
                this.selectedLocation &&
                isStaffValid
            );

            console.log('SHIFT Validation:', {
                selectedDateRange: this.selectedDateRange,
                selectedEmploymentType: this.selectedEmploymentType,
                selectedLocation: this.selectedLocation,
                isStaffValid: isStaffValid,
                finalResult: result
            });

            console.log('========== showRolesSection END ==========');
            return result;
        }

        // REJECTED SHIFT
        if (this.reportTypeValue === 'REJECTED_SHIFT') {

            const result =
                this.selectedDateRange &&
                this.selectedEmploymentType &&
                isStaffValid;

            console.log('REJECTED_SHIFT Validation:', {
                selectedDateRange: this.selectedDateRange,
                selectedEmploymentType: this.selectedEmploymentType,
                isStaffValid: isStaffValid,
                finalResult: result
            });

            console.log('========== showRolesSection END ==========');
            return result;
        }

        // STAFF LIST REPORT
        if (this.reportTypeValue === 'STAFF') {

            const result =
                this.selectedstaffStatus &&
                this.selectedEmploymentType;

            console.log('STAFF Validation:', {
                selectedstaffStatus: this.selectedstaffStatus,
                selectedEmploymentType: this.selectedEmploymentType,
                finalResult: result
            });

            console.log('========== showRolesSection END ==========');
            return result;
        }

        // PARTICIPANT REPORT
        if (this.reportTypeValue === 'PARTICIPANT') {

            const result = this.selectedstaffStatus;

            console.log('PARTICIPANT Validation:', {
                selectedstaffStatus: this.selectedstaffStatus,
                finalResult: result
            });

            console.log('========== showRolesSection END ==========');
            return result;
        }

        // OVER / UNDER REPORT
        if (this.reportTypeValue === 'OVER_EFF') {

            const result =
                this.selectedDateRange &&
                this.selectedEmploymentType &&
                isStaffValid;

            console.log('OVER_EFF Validation:', {
                selectedDateRange: this.selectedDateRange,
                selectedEmploymentType: this.selectedEmploymentType,
                isStaffValid: isStaffValid,
                finalResult: result
            });

            console.log('========== showRolesSection END ==========');
            return result;
        }

        console.log('⚠️ No matching report type condition met');
        console.log('========== showRolesSection END ==========');
        return false;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    } 

    setupGeneratedPagination() {

        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;

        this.pagedGeneratedReports =
            this.generatedReports.slice(start, end);

        this.totalRecords = this.generatedReports.length;
        this.totalPages = Math.ceil(
            this.totalRecords / this.pageSize
        );

        this.disableAllFirst = this.pageNumber === 1;
        this.disableAllLast =
            this.pageNumber === this.totalPages;
    }

    handleChangeforfacility(event) {

        console.log('=========== handleChangeforfacility START ===========' );

        const value = event.detail.value;
        console.log('Raw Value →', value);

        let facilityIds = [];

        if (Array.isArray(value)) {

            console.log('Array Values →', JSON.parse(JSON.stringify(value)));

            facilityIds = value.filter(v =>
                typeof v === 'string' &&
                v.length >= 15
            );

        } else if (value && value.length >= 15) {
            facilityIds = [value];
        }

        console.log('Valid Facility IDs →', facilityIds);

        if (facilityIds.length > 0) {
            this.selectedFacilityIds = [...facilityIds];

            console.log('Stored selectedFacilityIds →', this.selectedFacilityIds);

            /* ================================
            🔹 FIRST APEX CALL
            ================================= */

            sendFacilityToApex({ facilityIds: facilityIds })
                .then(result => {

                    console.log('First Apex Success →', result);

                    if (!result || result.length === 0) {
                        this.filteredStaffList = [];
                    } else {
                        this.filteredStaffList = result.map(staff => ({
                            label: staff.Display_Nickname__c,
                            value: staff.Id
                        }));

                        console.log('Mapped filteredStaffList →', this.filteredStaffList);
                    }

                })
                .catch(error => {
                    console.error('First Apex Error →', error);
                });


            /* ================================
            🔹 Roles APEX CALL
            ================================= */

            getRolesByFacilities({ facilityIds: facilityIds })
            .then(result => {

                console.log('Roles Result →', result);

                if (!result || result.length === 0) {
                    this.roleCheckboxes = [];
                    return;
                }

                /* ======================================
                🔥 REMOVE DUPLICATE ROLE NAMES
                ====================================== */

                const uniqueRolesMap = new Map();

                result.forEach(role => {
                    if (!uniqueRolesMap.has(role.Role_Name__c)) {
                        uniqueRolesMap.set(role.Role_Name__c, role);
                    }
                });

                const uniqueRoles = Array.from(uniqueRolesMap.values());

                console.log('Unique Roles →', uniqueRoles);

                this.roleCheckboxes = uniqueRoles.map(r => ({
                    label: r.Role_Name__c,
                    value: r.Role_Name__c,
                    checked: false
                }));

                console.log('Final roleCheckboxes →', this.roleCheckboxes);
            })
            .catch(error => {
                console.error('Error loading roles →', error);
            });
        }

        console.log('=========== handleChangeforfacility END ===========' );
    }

    get columnOrderOptions() {

        const totalChecked = this.visibleSections.filter(s => s.checked).length;

        let options = [];

        for (let i = 1; i <= totalChecked; i++) {
            options.push({
                label: i.toString(),
                value: i.toString()
            });
        }

        return options;
    }

    handleColumnOrderChange(event) {

        const key = event.target.dataset.key;
        const value = event.detail.value;

        this.sections = this.sections.map(sec => {
            if (sec.key === key) {
                return { ...sec, order: value };
            }
            return sec;
        });

        console.log('Updated sections with order:', JSON.stringify(this.sections));
    }

    handleDragStart(event) {
        this.dragStartIndex = Number(event.currentTarget.dataset.index);
    }

    handleDragOver(event) {
        event.preventDefault();
    }

    handleDragOver(event) {
        event.preventDefault();
    }

    handleDrop(event) {

        console.log('===== handleDrop START =====');

        event.preventDefault();

        const dragEndIndex = Number(event.currentTarget.dataset.index);

        console.log('Drag Start Index:', this.dragStartIndex);
        console.log('Drag End Index:', dragEndIndex);
        console.log('Sections BEFORE reorder:', JSON.parse(JSON.stringify(this.sections)));

        if (
            this.dragStartIndex === null ||
            this.dragStartIndex === dragEndIndex
        ) {
            console.warn('Drop cancelled — same index or null start index');
            console.log('===== handleDrop END (NO CHANGE) =====');
            return;
        }

        const updated = [...this.sections];

        const [movedItem] = updated.splice(this.dragStartIndex, 1);

        console.log('Moved Item:', movedItem);

        updated.splice(dragEndIndex, 0, movedItem);

        console.log('Array AFTER splice:', JSON.parse(JSON.stringify(updated)));

        // 🔥 Recalculate order properly
        this.sections = updated.map((item, index) => ({
            ...item,
            order: index + 1
        }));

        console.log('Sections AFTER reorder + order update:', JSON.parse(JSON.stringify(this.sections)));

        this.dragStartIndex = null;

        console.log('===== handleDrop END =====');
    }

    get sectionsWithIndex() {
        return this.sections.map((section, index) => {
            return {
                ...section,
                displayIndex: index + 1
            };
        });
    }

    handleDownloadMouseEnter() {
        this.isDownloadOpen = true;
    }

    handleDownloadMouseLeave() {
        this.isDownloadOpen = false;
    }

    handleDownload(event) {

        console.log('this.selectedExportType >>>>>>', this.selectedExportType);
        const exportType = this.selectedExportType;
        console.log('handleExport called →', exportType);

        if (!exportType) {
            this.showToast('Error', 'Please select export type', 'error');
            return;
        }

        let templateKeys = this.getSelectedTemplateColumnKeys();

        console.log('Original templateKeys =>', JSON.stringify(templateKeys));

        if (!templateKeys.length) {
            this.showToast('Error', 'Selected template has no columns.', 'error');
            return;
        }

        // ✅ only PARTICIPANT will be normalized
        templateKeys = this.normalizeTemplateKeysForReport(templateKeys);

        console.log('Final templateKeys used =>', JSON.stringify(templateKeys));

        let rows;

        if (this.reportTypeValue === 'REJECTED_SHIFT') {

            rows = this.rejectedFilteredRecords;

        }
        else if (this.reportTypeValue === 'REIMBURSEMENT') {

            rows = this.reimbursementAllRecords;

        }
        else if (this.reportTypeValue === 'STAFF') {

            rows = this.staffAllRecords;

        }
        else if (this.reportTypeValue === 'PARTICIPANT') {

            rows = this.participantAllRecords;

        }
        else if (this.reportTypeValue === 'OVER_EFF') {     // ✅ ADD THIS

            // Under / Over efficiency list
            rows = this.underOverAllRecords;

            console.log('Using UNDER / OVER rows =>', rows?.length);

        }
        else {

            rows = this.filteredRecords;

        }

        console.log('Rows count =>', rows?.length);

        if (!rows || !rows.length) {
            this.showToast('Error', 'No data available to export.', 'error');
            return;
        }

        if (exportType === 'EXCEL') {

            this.exportExcelFromTemplate(templateKeys, rows);

        } else {

            this.exportPdfFromTemplate(templateKeys, rows);

        }
    }

    get favoriteIcon() {
        return this.isFavorite
            ? 'utility:favorite'
            : 'utility:favorite_alt';
    }

    get favoriteVariant() {
        return this.isFavorite ? 'brand' : 'border-filled';
    }

    /* ==============================
    GENERATED REPORT PAGINATION
    ============================== */

    @track generatedPageNumber = 1;
    @track generatedPageSize = 10;
    @track generatedTotalRecords = 0;
    @track generatedTotalPages = 0;

    @track generatedDisableFirst = true;
    @track generatedDisableLast = false;

    @track pagedGeneratedReports = [];

    updateGeneratedReportsPagination() {

        const records = this.generatedReports || [];

        this.generatedTotalRecords = records.length;

        this.generatedTotalPages =
            Math.ceil(this.generatedTotalRecords / this.generatedPageSize) || 1;

        if (this.generatedPageNumber > this.generatedTotalPages) {
            this.generatedPageNumber = this.generatedTotalPages;
        }

        const start =
            (this.generatedPageNumber - 1) * this.generatedPageSize;

        const end = start + this.generatedPageSize;

        this.pagedGeneratedReports = records.slice(start, end);

        this.generatedDisableFirst = this.generatedPageNumber === 1;
        this.generatedDisableLast =
            this.generatedPageNumber === this.generatedTotalPages;

        console.log('Generated Pagination Updated');
    }

    handleGeneratedPageSizeChange(event) {

        this.generatedPageSize =
            parseInt(event.target.value, 10);

        this.generatedPageNumber = 1;

        this.updateGeneratedReportsPagination();

        console.log('Generated Page Size:', this.generatedPageSize);
    }

    firstGeneratedPage() {

        this.generatedPageNumber = 1;

        this.updateGeneratedReportsPagination();

        console.log('First Page');
    }

    previousGeneratedPage() {

        if (this.generatedPageNumber > 1) {

            this.generatedPageNumber--;

            this.updateGeneratedReportsPagination();
        }

        console.log('Previous Page:', this.generatedPageNumber);
    }

    nextGeneratedPage() {

        if (this.generatedPageNumber < this.generatedTotalPages) {

            this.generatedPageNumber++;

            this.updateGeneratedReportsPagination();
        }

        console.log('Next Page:', this.generatedPageNumber);
    }

    lastGeneratedPage() {

        this.generatedPageNumber = this.generatedTotalPages;

        this.updateGeneratedReportsPagination();

        console.log('Last Page');
    }

    handleGeneratedPageSize(event) {

        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;

        this.updateGeneratedPagination();

        console.log('Page size changed:', this.pageSize);
    }

    handleGeneratedFirst() {

        this.pageNumber = 1;
        this.updateGeneratedPagination();

        console.log('First page');
    }

    handleGeneratedPrevious() {

        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updateGeneratedPagination();
        }

        console.log('Previous page:', this.pageNumber);
    }

    handleGeneratedNext() {

        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updateGeneratedPagination();
        }

        console.log('Next page:', this.pageNumber);
    }

    handleGeneratedLast() {

        this.pageNumber = this.totalPages;
        this.updateGeneratedPagination();

        console.log('Last page');
    }

    handlePreview(event) {

        const reportId = event.currentTarget.dataset.id;

        console.log('Preview clicked for report =>', reportId);

        const report = this.generatedReports.find(r => r.id === reportId);

        console.log('Report Data =>', JSON.stringify(report));

    }

    handleDownloadReport(event) {

        const reportId = event.currentTarget.dataset.id;

        console.log('Download clicked for report =>', reportId);

        const report = this.generatedReports.find(r => r.id === reportId);

        console.log('Report Data =>', JSON.stringify(report));
    }

}