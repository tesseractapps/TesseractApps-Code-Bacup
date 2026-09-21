import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDFLib from "@salesforce/resourceUrl/jspdf";
import autoTable from "@salesforce/resourceUrl/autotable";

// ============ APEX IMPORTS ============
import getRolesByFacilities from '@salesforce/apex/SmartReportsHandler.getRolesByFacilities';
import getStaffByFacilityAndRoles from '@salesforce/apex/SmartReportsHandler.getStaffByFacilityAndRoles';
import getShiftWithSmartStaffData from '@salesforce/apex/SmartReportsHandler.getShiftWithSmartStaffData';
import getRejectedShiftsForSmartReports from '@salesforce/apex/SmartReportsHandler.getRejectedShiftsForSmartReports';
import getAllReimbursements from '@salesforce/apex/SmartReportsHandler.getAllReimbursements';
import fetchStaffs from '@salesforce/apex/SmartReportsHandler.fetchStaffs';
import fetchFacilitiess from '@salesforce/apex/SmartReportsHandler.fetchFacilitiess';
import getStaffUtilizationData from '@salesforce/apex/SmartReportsHandler.getStaffUtilizationData';
import getFavoriteReports from '@salesforce/apex/SmartReportsHandler.getFavoriteReports';
import createShiftReportLog from '@salesforce/apex/SmartReportsHandler.createShiftReportLog';
import getReportExportLogs from '@salesforce/apex/SmartReportsHandler.getReportExportLogs';
import getAllReportExportLogs from '@salesforce/apex/SmartReportsHandler.getAllReportExportLogs';
import processStaffSelection from '@salesforce/apex/SmartReportsHandler.processStaffSelection';
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import sendFacilityToApex from '@salesforce/apex/SmartReportsHandler.sendFacilityToApex';
import sendFacilityToApexforParticipant from '@salesforce/apex/SmartReportsHandler.sendFacilityToApexforParticipant';
import getParticipantServiceDeliveryReport from '@salesforce/apex/SmartReportsHandler.getParticipantServiceDeliveryReport';
import updateShiftReportLog from '@salesforce/apex/SmartReportsHandler.updateShiftReportLog';
import sendReportEmail from '@salesforce/apex/SmartReportsHandler.sendReportEmail';
import getTemplatesByFacility from '@salesforce/apex/SmartReportsHandler.getTemplatesByFacility';
import createTemplate from '@salesforce/apex/SmartReportsHandler.createTemplate';
import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetailsForRoster";

export default class CustomReportLwc extends LightningElement {
    // ============ PUBLIC PROPERTIES ============
    @api orgid;

    // ============ UI STATE FLAGS ============
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
    @track filteredStaffList1 = [];
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
    @track selectedExportType = 'PDF';
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
    @track backbutton = false;
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
    @track participantServiceflag = false;
    @track favoriteReports = [];
    @track generatedReports = [];
    @track favoriteRows = [];
    @track isFavorite = false;
    @track favoriteText = 'Add to favorite';
    @track favoriteClass = '';
    @track selectedFavoriteId;
    @track allGeneratedReports = [];
    @track isExpandedView = false;
    @track disableAllFirst = true;
    @track disableAllLast = false;
    @track facilityOptions =[];
    @track isDownloadOpen = false;
    @track rejectedsearchStaffflag = false;
    @track selectedFacilityIds = [];
    @track rejectedflagFliters = false;
    @track handlePreviewflag = false;
    @track generatedPageNumber = 1;
    @track generatedPageSize = 10;
    @track generatedTotalRecords = 0;
    @track generatedTotalPages = 0;
    @track generatedDisableFirst = true;
    @track generatedDisableLast = false;
    @track pagedGeneratedReports = [];
    @track exportLogId = '';
    @track invoiceEmailFlag = false;
    @track toAddress = '';
    @track ccAddress = '';
    @track emailSubject = '';
    @track emailBody = '';
    @track isEmailMode = false;
    @track selectedTemplateLabel = '';
    @track participantServiceAllRecords = [];
    @track participantServiceRecordsToDisplay = [];
    @track participantServicePageNumber = 1;
    @track participantServicePageSize = 10;
    @track participantServiceTotalPages = 0;
    @track participantServiceTotalRecords = 0;
    @track participantServiceDisableFirst = true;
    @track participantServiceDisableLast = true;
    @track isHome = true;
    @track showUpgradeModal;
    @track orgname;
    @track statePostal;
    @track orgLogo;
    @track address;
    @track generatedCount = 0;
    @track participantsOptions = [];
    @track selectedParticipantIds = [];
    @track handledownloadReport = false;
    @track base64;
    @track fileName;
    @track reportEmailSend;
    @track selectedReportId;
    @track isPDF = false;
    @track isCSV = false;
    @track hasData = false;
    @track isLoading = false;
    @track errorMessage = '';
    @track selectedStaffType = null;
    @track selectedFacilityIdforgenerated;
    @track selectedFacilityLabel;
    @track staffPreferredName = '';
    @track facilityPreferredName = '';
    @track participantPreferredName = '';
    @track finalListFacilities = [];
    @track selectedFacilities = [];
    @track dragStartIndex = null;
    @track columnOrder = []; // Stores the order of columns
    @track columnKeys = []; // Stores the keys in the correct order

    // ============ STATIC CONFIGURATION ============
    shiftOnlyKeys = ['Staff Name', 'Date', 'Shift Type', 'Shift Time', 'Role', 'Participants', 'Status'];

    templateKeyToFieldMap = {
        // SHIFT
        STAFF_NAME: 'staffName',
        DATE: 'date',
        SHIFT_TYPE: 'shiftType',
        SHIFT_TIME: 'shiftTime',
        SIGN_IN: 'signIn',
        SIGN_OUT: 'signOut',
        ROLE: 'role',
        PARTICIPANTS: 'participants',
        STATUS: 'status',
        // REJECTED SHIFT
        FACILITY: 'facility',
        TIMINGS: 'timings',
        COMMENTS: 'comments',
        PARTICIPANT: 'participant',
        REJECTED_DATE: 'rejectedDate',
        REASSIGNED_TO: 'reassignedStaffName',
        REASSIGNED_DATE: 'reassignedDate',
        // REIMBURSEMENT
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
        // STAFF
        EMAIL: 'email',
        CONTACT_NUMBER: 'contactNumber',
        GENDER: 'gender',
        DOB: 'dob',
        // PARTICIPANT
        PARTICIPANT_EMAIL: 'Email__c',
        PARTICIPANT_CONTACT: 'Contact_Number__c',
        PARTICIPANT_GENDER: 'Gendar__c',
        PARTICIPANT_TYPE: 'ParticipantType__c',
        PARTICIPANT_STATUS: 'Participant_Status__c',
        // UNDER/OVER EFFICIENCY
        SET_HOURS: 'setHours',
        ROSTERED_HOURS: 'rosteredHours',
        COMPLETED_HOURS: 'completedHours',
        RH_VARIANCE: 'rhVariance',
        CH_VARIANCE: 'chVariance',
        // PARTICIPANT SERVICE
        SERVICE_DATE: 'serviceDate',
        SERVICE_TYPE: 'serviceType',
        SUPPORT_ITEM: 'supportItem',
        RESOURCE_NAME: 'resourceName',
        START_TIME: 'startTime',
        END_TIME: 'endTime',
        QTY: 'qty'
    };

    templateKeyToLabelMap = {
        // SHIFT
        STAFF_NAME: 'Staff Name',
        DATE: 'Date',
        SHIFT_TYPE: 'Shift Type',
        SHIFT_TIME: 'Shift Time',
        SIGN_IN: 'Sign In',
        SIGN_OUT: 'Sign Out',
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
        REIMB_MILEAGE_KM: 'Mileage in KM\'s',
        REIMB_VEHICLE_TYPE: 'Type of Vehicle',
        REIMB_COST_PER_KM: 'Cost per KM',
        REIMB_MILEAGE_AMOUNT: 'Mileage Amount',
        REIMB_AMOUNT: 'Amount',
        REIMB_TOTAL_AMOUNT: 'Total Amount',
        REIMB_STATUS: 'Status',
        REIMB_APPROVED_DATE: 'Approved Date',
        // STAFF
        EMAIL: 'Email',
        CONTACT_NUMBER: 'Contact Number',
        GENDER: 'Gender',
        DOB: 'Date of Birth',
        // PARTICIPANT
        PARTICIPANT_NAME: 'Participant Name',
        PARTICIPANT_EMAIL: 'Email',
        PARTICIPANT_CONTACT: 'Contact Number',
        PARTICIPANT_GENDER: 'Gender',
        PARTICIPANT_TYPE: 'Participant Type',
        PARTICIPANT_STATUS: 'Status',
        // UNDER/OVER
        SET_HOURS: 'Set Hrs(SH)',
        ROSTERED_HOURS: 'Rostered Hrs(RH)',
        COMPLETED_HOURS: 'Completed Hrs(CH)',
        RH_VARIANCE: 'RH Variance(RH-SH)',
        CH_VARIANCE: 'CH Variance(CH-SH)',
        // PARTICIPANT SERVICE
        SERVICE_DATE: 'Service Date',
        SERVICE_TYPE: 'Service Type',
        SUPPORT_ITEM: 'Support Item',
        RESOURCE_NAME: 'Staff Name',
        START_TIME: 'Start Time',
        END_TIME: 'End Time',
        QTY: 'Qty'
    };

    reportList = [
        { label: 'Shift Reports', value: 'SHIFT' },
        { label: 'Participant Service Delivery Reports', value: 'Participant_Service_Delivery' },
        { label: 'Rejected Shift Reports', value: 'REJECTED_SHIFT' },
        { label: 'Staff List Reports', value: 'STAFF' },
        { label: 'Participant Reports', value: 'PARTICIPANT' },
        { label: 'Reimbursement Reports', value: 'REIMBURSEMENT' }
    ];

    statusOptions = [
        { label: 'All', value: 'All' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Approved', value: 'Approved' }
    ];

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

    dateRangeOptions = [
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

    staffStstusOptions = [
        { label: 'All', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'InActive', value: 'InActive' }
    ];

    staffOptions = [
        { label: 'All Staff', value: 'all' },
        { label: 'Individual Staff', value: 'individual' }
    ];

    pageSizeOptions = [10, 20, 50];
    underOverPageSizeOptions = [10, 20, 50];
    participantPageSizeOptions = [10, 20, 50];
    staffPageSizeOptions = [10, 20, 50];
    reimbursementPageSizeOptions = [10, 20, 50];
    rejectedPageSizeOptions = [10, 20, 50];
    participantServicePageSizeOptions = [10, 20, 50];

    // ============ SORTING STATE ============
    @track tableSortState = {
        shiftReport: { field: '', direction: 'asc', icons: { staffName: '', date: '', shiftType: '', shiftTime: '', signIn: '', signOut: '', role: '', participants: '', status: '' } },
        rejectedShifts: { field: '', direction: 'asc', icons: { formattedDate: '', staffName: '', facility: '', role: '', shiftType: '', participant: '', comments: '', rejectedDate: '', reassignedStaffName: '', reassignedDate: '' } },
        reimbursement: { field: '', direction: 'asc', icons: { Name: '', staffName: '', ShiftDate__c: '', Mileage_Others__c: '', Type_of_Vehicle__c: '', Cost_per_KM__c: '', Mileage_Amount__c: '', Amount__c: '', Total_Amount__c: '', Approval_Status__c: '', Approved_Date__c: '' } },
        staff: { field: '', direction: 'asc', icons: { staffName: '', email: '', contactNumber: '', gender: '', dob: '', status: '' } },
        participants: { field: '', direction: 'asc', icons: { Display_Nickname__c: '', Email__c: '', Contact_Number__c: '', Gendar__c: '', ParticipantType__c: '', Participant_Status__c: '' } },
        participantServices: { field: '', direction: 'asc', icons: { participantName: '', serviceDate: '', facility: '', serviceType: '', supportItem: '', resourceName: '', startTime: '', endTime: '', qty: '', status: '' } },
        underOver: { field: '', direction: 'asc', icons: { name: '', setHours: '', rosteredHours: '', completedHours: '', rhVariance: '', chVariance: '', status: '' } },
        generatedReports: { field: '', direction: 'asc', icons: { name: '', selectedTemplateLabel: '', exportType: '', dateRange: '', generatedDate: '', generatedBy: '' } }
    };

    // ============ LIFECYCLE METHODS ============
    async connectedCallback() {
        console.log('===== connectedCallback START =====');
        console.log('🔹 orgid:', this.orgid);
        console.log('🔹 Current timestamp:', new Date().toISOString());
        
        try {
            console.log('🔹 Checking plan status...');
            const isStart = await isStartPlan();
            console.log('🔹 isStartPlan result:', isStart);
            
            if (isStart) {
                console.log('🔹 Start plan detected, showing upgrade modal');
                this.showUpgradeModal = true;
                this.isHome = false;
                console.log('===== connectedCallback END (upgrade modal) =====');
                return;
            }
        } catch (error) {
            console.error('❌ Error checking plan:', error);
            console.log('===== connectedCallback END (error) =====');
            return;
        }

        console.log('🔹 Setting up event listeners...');
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        document.addEventListener('click', this.handleOutsideClick);
        this._handleStaffOutsideClick = this.handleStaffOutsideClick.bind(this);
        document.addEventListener('click', this._handleStaffOutsideClick);

        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        
        console.log('🔹 Stored facility from localStorage:', { 
            facilityId: storedFacilityId, 
            facilityLabel: storedFacilityLabel 
        });
        
        this.selectedFacilityLabel = storedFacilityLabel || 'Default Facility';
        this.selectedFacilityIdforgenerated = storedFacilityId || null;
        console.log('🔹 Set selectedFacilityIdforgenerated:', this.selectedFacilityIdforgenerated);

        console.log('🔹 Loading PDF libraries...');
        await this.loadPdfLibraries();

        if (this.selectedFacilityIdforgenerated) {
            console.log('🔹 Facility ID exists, initializing reports...');
            this.fetchOrganizationDetails();
            this.initializeReports();
            this.initializeGeneratedReports();
            this.fetchStaff();
            console.log('🔹 Initialization complete for facility:', this.selectedFacilityIdforgenerated);
        } else {
            console.log('🔹 No facility ID found, skipping initialization');
        }

        console.log('🔹 Fetching facility data...');
        const facilityData = await getFacilityData();
        console.log('🔹 Facility data received:', facilityData ? `${facilityData.length} facilities` : 'none');
        
        this.finalListFacilities = [];
        this.selectedFacilities = [];
        this.facilityOptions = facilityData.map((record) => ({
            label: record.Name,
            value: record.Id,
            participantPreferredName: record.Participant_Preferred_Name_Formla__c,
            facilityPreferredName: record.Facility_Preferred_Name_Formula__c,
            staffPreferredName: record.Staff_Preferred_Name_Formula__c
        }));
        console.log('🔹 Facility options mapped:', this.facilityOptions.length, 'options');

        this.staffPreferredName = localStorage.getItem('defaultStaffPreferredName') || 'Staff';
        this.facilityPreferredName = localStorage.getItem('defaultFacilityPreferredName') || 'Facility';
        this.participantPreferredName = localStorage.getItem('defaultParticipantPreferredName') || 'Participant';
        
        console.log('🔹 Preferred names loaded:', {
            staff: this.staffPreferredName,
            facility: this.facilityPreferredName,
            participant: this.participantPreferredName
        });

        const today = new Date().toISOString().split('T')[0];
        this.startDate = today;
        this.endDate = today;
        console.log('🔹 Default date range set:', { startDate: this.startDate, endDate: this.endDate });
        console.log('===== connectedCallback END =====');
    }

    // 🔥 FIX: Proper library loading with autoTable
    async loadPdfLibraries() {
        console.log('===== loadPdfLibraries START =====');
        
        if (this.jsPDFInitialized) {
            console.log('✅ jsPDF already initialized, skipping load');
            return;
        }

        if (this.jsPDFLoading) {
            console.log('🔄 jsPDF loading in progress, skipping duplicate load');
            return;
        }

        this.jsPDFLoading = true;
        console.log('🔄 Loading jsPDF and autoTable libraries...');

        try {
            console.log('🔹 Loading jsPDF from:', jsPDFLib);
            await loadScript(this, jsPDFLib);
            console.log('✅ jsPDF loaded successfully');
            console.log('🔹 window.jspdf exists:', !!window.jspdf);
            console.log('🔹 window.jspdf.jsPDF exists:', !!(window.jspdf && window.jspdf.jsPDF));

            console.log('🔹 Loading autoTable from:', autoTable);
            await loadScript(this, autoTable);
            console.log('✅ autoTable loaded successfully');

            // 🔥 CRITICAL: Attach autoTable to jsPDF
            const { jsPDF } = window.jspdf;
            console.log('🔹 jsPDF instance:', jsPDF);
            console.log('🔹 jsPDF.API exists:', !!(jsPDF && jsPDF.API));
            
            // Check if autoTable is properly attached
            if (jsPDF && typeof jsPDF.API.autoTable !== 'function') {
                console.warn('⚠️ autoTable not attached, trying to fix...');
                
                // Try to manually attach if needed
                if (typeof window.autoTable === 'function') {
                    console.log('🔹 Manually attaching autoTable...');
                    window.autoTable(jsPDF.API);
                    console.log('✅ autoTable manually attached');
                } else {
                    console.warn('⚠️ window.autoTable is not a function');
                }
            }

            // Verify the attachment
            if (jsPDF && typeof jsPDF.API.autoTable === 'function') {
                this.jsPDFInitialized = true;
                console.log('✅ jsPDF + autoTable ready');
                console.log('🔹 autoTable function available:', typeof jsPDF.API.autoTable);
            } else {
                console.error('❌ autoTable still not attached after loading');
                // Try alternative approach
                console.log('🔹 Attempting alternative attachment...');
                this.attemptAlternativeAttachment();
            }

        } catch (error) {
            console.error('❌ Error loading PDF libraries:', error);
            console.log('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            // Try fallback
            console.log('🔹 Attempting fallback load...');
            this.attemptFallbackLoad();
        } finally {
            this.jsPDFLoading = false;
            console.log('===== loadPdfLibraries END =====');
        }
    }

    // 🔥 FALLBACK: Alternative attachment method
    attemptAlternativeAttachment() {
        console.log('===== attemptAlternativeAttachment START =====');
        try {
            const { jsPDF } = window.jspdf;
            console.log('🔹 jsPDF in fallback:', jsPDF);
            
            if (jsPDF && window.jspdf.autoTable) {
                console.log('🔹 Using window.jspdf.autoTable to attach...');
                window.jspdf.autoTable(jsPDF.API);
                this.jsPDFInitialized = true;
                console.log('✅ autoTable attached via alternative method');
            } else {
                console.warn('⚠️ window.jspdf.autoTable not available in fallback');
                console.log('🔹 window.jspdf keys:', Object.keys(window.jspdf || {}));
            }
        } catch (e) {
            console.error('❌ Alternative attachment failed:', e);
        }
        console.log('===== attemptAlternativeAttachment END =====');
    }

    // 🔥 FALLBACK: Try loading with setTimeout
    attemptFallbackLoad() {
        console.log('===== attemptFallbackLoad START =====');
        console.log('🔄 Attempting fallback load with delay...');
        
        setTimeout(() => {
            console.log('🔹 Fallback timeout executing...');
            try {
                const { jsPDF } = window.jspdf;
                console.log('🔹 jsPDF in fallback timeout:', jsPDF);
                
                if (jsPDF && window.jspdf.autoTable) {
                    console.log('🔹 Using fallback autoTable attachment...');
                    window.jspdf.autoTable(jsPDF.API);
                    this.jsPDFInitialized = true;
                    console.log('✅ autoTable attached via fallback');
                } else {
                    console.warn('⚠️ Fallback attachment failed - libraries not ready');
                    console.log('🔹 window.jspdf keys:', Object.keys(window.jspdf || {}));
                }
            } catch (e) {
                console.error('❌ Fallback load failed:', e);
            }
        }, 500);
        console.log('===== attemptFallbackLoad END =====');
    }

    disconnectedCallback() {
        console.log('===== disconnectedCallback START =====');
        console.log('🔹 Removing event listeners...');
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('click', this._handleStaffOutsideClick);
        console.log('🔹 Event listeners removed');
        console.log('===== disconnectedCallback END =====');
    }

    // ============ INITIALIZATION METHODS ============
    fetchOrganizationDetails() {
        console.log('===== fetchOrganizationDetails START =====');
        console.log('🔹 Fetching organization details...');
        
        organizationDetails().then((response) => {
            console.log('✅ Organization details received');
            const org = response.listofPriceBook;
            console.log('🔹 Organization:', org ? org.Name : 'none');
            
            this.orgname = org.Name;
            this.statePostal = `${org.Address_Latest__Street__s},${org.Address_Latest__City__s}, ${org.Address_Latest__StateCode__s}, ${org.Address_Latest__PostalCode__s}`;
            this.orgLogo = response.bolbdata;
            
            console.log('🔹 Organization details set:', {
                name: this.orgname,
                address: this.statePostal,
                hasLogo: !!this.orgLogo
            });
        }).catch(error => {
            console.error('❌ Error fetching organization details:', error);
        });
        console.log('===== fetchOrganizationDetails END =====');
    }

    initializeReports() {
        console.log('===== initializeReports START =====');
        console.log('🔹 selectedFacilityIdforgenerated:', this.selectedFacilityIdforgenerated);
        
        if (!this.selectedFacilityIdforgenerated) {
            console.warn('⚠️ No facility ID available, skipping favorite reports');
            console.log('===== initializeReports END (no facility) =====');
            return;
        }

        console.log('🔹 Fetching favorite reports for facility:', this.selectedFacilityIdforgenerated);
        
        getFavoriteReports({ facilityId: this.selectedFacilityIdforgenerated })
            .then(result => {
                console.log('✅ Favorite reports received');
                console.log('🔹 Result length:', result ? result.length : 0);
                
                if (!result || result.length === 0) {
                    console.log('🔹 No favorite reports found');
                    this.favoriteReports = [];
                    this.organizeFavoriteRows();
                    console.log('===== initializeReports END (no favorites) =====');
                    return;
                }

                console.log('🔹 Processing favorite reports...');
                this.favoriteReports = result.map((record, index) => {
                    console.log(`🔹 Processing record ${index + 1}:`, record.Id);
                    
                    let parsedFilters = {};
                    try {
                        parsedFilters = JSON.parse(record.Filters_JSON__c);
                        console.log(`🔹 Parsed filters for ${record.Id}:`, parsedFilters);
                    } catch (e) {
                        console.error(`❌ JSON parse error for record ${record.Id}:`, e);
                    }
                    
                    const reportMeta = this.reportList.find(r => r.value === record.Report_Type__c);
                    const reportLabel = reportMeta ? reportMeta.label : record.Report_Type__c;
                    const criteriaText = this.buildCriteriaText(parsedFilters);
                    
                    console.log(`🔹 Mapped report ${index + 1}:`, {
                        id: record.Id,
                        type: record.Report_Type__c,
                        label: reportLabel
                    });
                    
                    return {
                        id: record.Id,
                        name: reportLabel,
                        criteria: criteriaText,
                        type: record.Report_Type__c,
                        filters: parsedFilters,
                        favorite: record.Favourite__c
                    };
                });

                console.log('🔹 Organizing favorite rows...');
                this.organizeFavoriteRows();
                console.log('===== initializeReports END (success) =====');
            })
            .catch(error => {
                console.error('❌ Error loading favorites:', error);
                console.log('🔹 Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                console.log('===== initializeReports END (error) =====');
            });
    }

    // ============ INITIALIZATION METHODS ============
    initializeGeneratedReports() {
        console.log('===== initializeGeneratedReports START =====');
        console.log('🔹 selectedFacilityIdforgenerated:', this.selectedFacilityIdforgenerated);
        console.log('🔹 Current timestamp:', new Date().toISOString());

        // 🔥 FIX: Check if facility ID is available
        if (!this.selectedFacilityIdforgenerated) {
            console.warn('⚠️ No facility ID found, skipping generated reports fetch');
            this.generatedReports = [];
            this.generatedTotalRecords = 0;
            this.generatedTotalPages = 0;
            this.pagedGeneratedReports = [];
            console.log('===== initializeGeneratedReports END (no facility) =====');
            return;
        }

        console.log('🔹 Calling getReportExportLogs with facilityId:', this.selectedFacilityIdforgenerated);
        
        getReportExportLogs({ facilityId: this.selectedFacilityIdforgenerated })
            .then(result => {
                console.log('✅ getReportExportLogs response received');
                console.log('🔹 Response type:', typeof result);
                console.log('🔹 Result structure:', Object.keys(result || {}));
                console.log('🔹 totalCount:', result.totalCount);
                console.log('🔹 logs length:', result.logs ? result.logs.length : 0);

                this.generatedCount = result.totalCount || 0;
                const logs = result.logs || [];
                console.log('🔹 Processing', logs.length, 'logs');

                // 🔥 FIX: Map data with all required fields
                this.generatedReports = logs.map((row, index) => {
                    console.log(`🔹 Processing log ${index + 1}:`, row.Id);
                    
                    let selectedTemplateLabel = '';
                    let filtersJson = row.Filters_JSON__c || '{}';

                    if (filtersJson) {
                        try {
                            const filters = JSON.parse(filtersJson);
                            selectedTemplateLabel = filters.selectedTemplateLabel || '';
                            console.log(`🔹 Parsed filters for ${row.Id}:`, Object.keys(filters));
                        } catch (e) {
                            console.error(`❌ JSON Parse Error for ${row.Id}:`, e);
                        }
                    }

                    const mappedReport = {
                        id: row.Id,
                        name: this.getReportTypeLabel(row.Report_Type__c),
                        exportType: row.Export_Type__c || 'PDF',
                        dateRange: this.getDateRangeLabel(row.Date_Range__c),
                        generatedDate: this.formatDateTime(row.Exported_On__c || row.CreatedDate),
                        generatedBy: `${row.CreatedBy?.FirstName || ''} ${row.CreatedBy?.LastName || ''}`.trim() || 'System',
                        filterKey: row.Filter_Key__c,
                        filtersJson: filtersJson,
                        selectedTemplateLabel: selectedTemplateLabel,
                        isFavorite: row.Favourite__c || false
                    };
                    
                    console.log(`🔹 Mapped report ${index + 1}:`, {
                        id: mappedReport.id,
                        name: mappedReport.name,
                        exportType: mappedReport.exportType,
                        isFavorite: mappedReport.isFavorite
                    });
                    
                    return mappedReport;
                });

                console.log('✅ Mapped Generated Reports:', this.generatedReports.length, 'reports');

                // 🔥 FIX: Initialize pagination
                this.generatedPageNumber = 1;
                this.generatedTotalRecords = this.generatedReports.length;
                this.generatedTotalPages = Math.ceil(this.generatedTotalRecords / this.generatedPageSize) || 1;
                
                console.log('🔹 Pagination initial:', {
                    totalRecords: this.generatedTotalRecords,
                    totalPages: this.generatedTotalPages,
                    pageSize: this.generatedPageSize
                });
                
                // 🔥 FIX: Update pagination with proper data
                this.updateGeneratedReportsPagination();

                // 🔥 FIX: Force re-render
                this.generatedReports = [...this.generatedReports];

                console.log('✅ Pagination updated:', {
                    totalRecords: this.generatedTotalRecords,
                    totalPages: this.generatedTotalPages,
                    pageSize: this.generatedPageSize,
                    displayedCount: this.pagedGeneratedReports?.length || 0
                });
                console.log('===== initializeGeneratedReports END (success) =====');

            })
            .catch(error => {
                console.error('❌ ERROR in initializeGeneratedReports');
                console.error('🔹 Error:', error);
                console.error('🔹 Error details:', {
                    message: error.message,
                    stack: error.stack,
                    body: error.body
                });
                this.generatedReports = [];
                this.pagedGeneratedReports = [];
                this.generatedTotalRecords = 0;
                this.generatedTotalPages = 0;
                console.log('===== initializeGeneratedReports END (error) =====');
            });
    }

    // 🔥 FIX: Update this method to ensure pagination works correctly
    updateGeneratedReportsPagination() {
        console.log('===== updateGeneratedReportsPagination START =====');
        const records = this.generatedReports || [];
        
        console.log('🔹 Records length:', records.length);
        console.log('🔹 Current page:', this.generatedPageNumber);
        console.log('🔹 Page size:', this.generatedPageSize);
        
        this.generatedTotalRecords = records.length;
        this.generatedTotalPages = Math.ceil(this.generatedTotalRecords / this.generatedPageSize) || 1;

        if (this.generatedPageNumber > this.generatedTotalPages) {
            console.log('🔹 Adjusting page number from', this.generatedPageNumber, 'to', this.generatedTotalPages || 1);
            this.generatedPageNumber = this.generatedTotalPages || 1;
        }

        const start = (this.generatedPageNumber - 1) * this.generatedPageSize;
        const end = Math.min(start + this.generatedPageSize, records.length);
        
        // 🔥 FIX: Ensure we always have an array
        this.pagedGeneratedReports = records.slice(start, end) || [];
        
        this.generatedDisableFirst = this.generatedPageNumber <= 1;
        this.generatedDisableLast = this.generatedPageNumber >= this.generatedTotalPages || this.generatedTotalPages === 0;

        console.log('✅ Pagination Results:', {
            pageNumber: this.generatedPageNumber,
            pageSize: this.generatedPageSize,
            totalRecords: this.generatedTotalRecords,
            totalPages: this.generatedTotalPages,
            displayCount: this.pagedGeneratedReports.length,
            start: start,
            end: end,
            firstDisabled: this.generatedDisableFirst,
            lastDisabled: this.generatedDisableLast
        });
        console.log('===== updateGeneratedReportsPagination END =====');
    }

    // ============ FAVORITE HELPERS ============
    buildCriteriaText(filters) {
        console.log('===== buildCriteriaText START =====');
        console.log('🔹 Input filters:', filters);
        
        let parts = [];
        if (filters.isAllStaff) parts.push('All Staff');
        if (filters.isIndividualStaff && filters.staffName) parts.push(filters.staffName);
        if (filters.selectedDateRange) parts.push(this.getDateRangeLabel(filters.selectedDateRange));
        if (filters.location) parts.push(filters.location);
        
        const result = parts.join(', ');
        console.log('🔹 Built criteria text:', result);
        console.log('===== buildCriteriaText END =====');
        return result;
    }

    organizeFavoriteRows() {
        console.log('===== organizeFavoriteRows START =====');
        console.log('🔹 favoriteReports length:', this.favoriteReports.length);
        
        const rows = [];
        const cardsPerRow = 5;
        const totalReports = this.favoriteReports.length;
        const numberOfRows = Math.ceil(totalReports / cardsPerRow);

        console.log('🔹 Organizing into', numberOfRows, 'rows with', cardsPerRow, 'cards per row');

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
            console.log(`🔹 Row ${i + 1}: ${rowReports.length} reports`);
        }
        
        this.favoriteRows = rows;
        console.log('✅ Organized', rows.length, 'rows');
        console.log('===== organizeFavoriteRows END =====');
    }

    // ============ TEMPLATE METHODS ============
    async loadTemplates() {
        console.log('===== loadTemplates START =====');
        console.log('🔹 selectedFacilityIdforgenerated:', this.selectedFacilityIdforgenerated);
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        console.log('🔹 Current timestamp:', new Date().toISOString());
        
        if (!this.selectedFacilityIdforgenerated) {
            console.log('⚠️ No facility ID, setting default templates');
            this.templatesforShiftReport = [{ label: 'New', value: 'NEW' }];
            this.selectedTemplateId = 'NEW';
            this.selectedTemplateLabel = 'New';
            
            // 🔥 FIX: Initialize sections with default checked state
            this.ensureSectionsExist();
            // Set all sections to checked by default
            this.sections = this.sections.map(sec => ({ ...sec, checked: true }));
            this.updateColumnKeys();
            
            console.log('🔹 Default templates set with all sections checked');
            console.log('===== loadTemplates END (no facility) =====');
            return;
        }

        try {
            console.log('🔹 Calling getTemplatesByFacility with:', {
                facilityId: this.selectedFacilityIdforgenerated,
                reportType: this.reportTypeValue
            });
            
            const result = await getTemplatesByFacility({
                facilityId: this.selectedFacilityIdforgenerated,
                reportType: this.reportTypeValue
            });

            console.log('✅ Templates loaded from backend');
            console.log('🔹 Number of templates returned:', result ? result.length : 0);

            const mappedTemplates = result.map((t, index) => {
                console.log(`🔹 Processing template ${index + 1}:`, t.Id);
                
                let parsedJson = null;
                let templateLabel = t.Name || 'Unnamed Template';
                
                if (t.Template_JSON__c) {
                    try {
                        parsedJson = JSON.parse(t.Template_JSON__c);
                        console.log(`🔹 Parsed template ${t.Id} JSON:`, Object.keys(parsedJson));
                    } catch (e) {
                        console.error(`❌ Error parsing template ${t.Id}:`, e);
                    }
                }
                
                return {
                    label: templateLabel,
                    value: t.Id,
                    json: t.Template_JSON__c,
                    parsedJson: parsedJson
                };
            });
            
            // Add New option
            mappedTemplates.push({ label: 'New', value: 'NEW' });
            this.templatesforShiftReport = mappedTemplates;
            
            console.log('✅ Mapped templates count:', mappedTemplates.length);
            console.log('🔹 Template labels:', mappedTemplates.map(t => t.label));
            
            // 🔥 FIX: If we have no templates, ensure sections are initialized
            if (mappedTemplates.length <= 1) { // Only "New" template exists
                console.log('🔹 No saved templates found, initializing with all sections checked');
                this.ensureSectionsExist();
                this.sections = this.sections.map(sec => ({ ...sec, checked: true }));
                this.updateColumnKeys();
                this.selectedTemplateId = 'NEW';
                this.selectedTemplateLabel = 'New';
            } else {
                // Only set default if no template is currently selected or if it's NEW
                if (!this.selectedTemplateId || this.selectedTemplateId === 'NEW') {
                    console.log('🔹 Auto-selecting first template...');
                    this.autoSelectFirstTemplate();
                } else {
                    console.log('🔹 Re-applying template:', this.selectedTemplateId);
                    this.applyTemplateById(this.selectedTemplateId);
                }
            }
        } catch (error) {
            console.error('❌ Error loading templates:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.templatesforShiftReport = [{ label: 'New', value: 'NEW' }];
            this.selectedTemplateId = 'NEW';
            this.selectedTemplateLabel = 'New';
            
            // 🔥 FIX: Initialize sections with default checked state
            this.ensureSectionsExist();
            this.sections = this.sections.map(sec => ({ ...sec, checked: true }));
            this.updateColumnKeys();
        }
        console.log('===== loadTemplates END =====');
    }

    buildSectionsForReport() {
        console.log('===== buildSectionsForReport START =====');
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        
        let allowedKeys = [];
        if (this.reportTypeValue === 'SHIFT') {
            allowedKeys = ['STAFF_NAME', 'DATE', 'SHIFT_TYPE', 'SHIFT_TIME', 'SIGN_IN', 'SIGN_OUT', 'ROLE', 'PARTICIPANTS', 'STATUS'];
            console.log('🔹 Building SHIFT sections');
        } else if (this.reportTypeValue === 'REJECTED_SHIFT') {
            allowedKeys = ['DATE', 'STAFF_NAME', 'FACILITY', 'ROLE', 'SHIFT_TYPE', 'PARTICIPANT', 'COMMENTS', 'REJECTED_DATE', 'REASSIGNED_TO', 'REASSIGNED_DATE'];
            console.log('🔹 Building REJECTED_SHIFT sections');
        } else if (this.reportTypeValue === 'REIMBURSEMENT') {
            allowedKeys = ['RES_NO', 'REIMB_STAFF', 'REIMB_SHIFT_DATE', 'REIMB_MILEAGE_KM', 'REIMB_VEHICLE_TYPE', 'REIMB_COST_PER_KM', 'REIMB_MILEAGE_AMOUNT', 'REIMB_AMOUNT', 'REIMB_TOTAL_AMOUNT', 'REIMB_STATUS', 'REIMB_APPROVED_DATE'];
            console.log('🔹 Building REIMBURSEMENT sections');
        } else if (this.reportTypeValue === 'STAFF') {
            allowedKeys = ['STAFF_NAME', 'EMAIL', 'CONTACT_NUMBER', 'GENDER', 'DOB', 'STATUS'];
            console.log('🔹 Building STAFF sections');
        } else if (this.reportTypeValue === 'PARTICIPANT') {
            allowedKeys = ['PARTICIPANT_NAME', 'PARTICIPANT_EMAIL', 'PARTICIPANT_CONTACT', 'PARTICIPANT_GENDER', 'PARTICIPANT_TYPE', 'PARTICIPANT_STATUS'];
            console.log('🔹 Building PARTICIPANT sections');
        } else if (this.reportTypeValue === 'OVER_EFF') {
            allowedKeys = ['STAFF_NAME', 'SET_HOURS', 'ROSTERED_HOURS', 'COMPLETED_HOURS', 'RH_VARIANCE', 'CH_VARIANCE'];
            console.log('🔹 Building OVER_EFF sections');
        }

        this.sections = allowedKeys.map((key, index) => {
            const section = {
                key: key,
                label: this.templateKeyToLabelMap[key],
                checked: false,
                order: index + 1
            };
            console.log(`🔹 Section ${index + 1}:`, section);
            return section;
        });
        
        console.log('✅ Built', this.sections.length, 'sections');
        console.log('===== buildSectionsForReport END =====');
    }

    applyTemplate(templateJson) {
        console.log('===== applyTemplate START =====');
        console.log('🔹 Input template JSON:', JSON.stringify(templateJson, null, 2));
        
        if (!templateJson || typeof templateJson !== 'object') {
            console.warn('⚠️ Invalid template JSON, clearing selections');
            this.clearAllSelections();
            console.log('===== applyTemplate END (invalid) =====');
            return;
        }
        
        // Make sure sections exist
        this.ensureSectionsExist();
        
        // Get the current sections
        const currentSections = this.sections;
        console.log('🔹 Current sections before applying:', JSON.stringify(currentSections));
        
        // Apply the template values - check both boolean and string 'true'/'false'
        const updatedSections = currentSections.map(sec => {
            const key = sec.key;
            if (templateJson.hasOwnProperty(key)) {
                const value = templateJson[key];
                const isChecked = value === true || value === 'true';
                console.log(`🔹 Section ${key}: value=${value}, isChecked=${isChecked}`);
                return {
                    ...sec,
                    checked: isChecked
                };
            }
            return sec;
        });
        
        // Handle column order from template
        let columnOrder = [];
        let columnKeys = [];
        
        // Get column order from template
        if (templateJson.columnOrder) {
            try {
                if (typeof templateJson.columnOrder === 'string') {
                    columnOrder = JSON.parse(templateJson.columnOrder);
                    console.log('🔹 Parsed columnOrder string:', columnOrder);
                } else if (Array.isArray(templateJson.columnOrder)) {
                    columnOrder = JSON.parse(JSON.stringify(templateJson.columnOrder));
                    console.log('🔹 Column order from template:', columnOrder);
                } else {
                    console.warn('⚠️ columnOrder is not a string or array:', typeof templateJson.columnOrder);
                }
            } catch (e) {
                console.error('❌ Error parsing column order:', e);
            }
        } else {
            console.log('🔹 No columnOrder in template');
        }
        
        // Get column keys from template
        if (templateJson.columnKeys && Array.isArray(templateJson.columnKeys)) {
            columnKeys = JSON.parse(JSON.stringify(templateJson.columnKeys));
            console.log('🔹 Column keys from template:', columnKeys);
        } else if (columnOrder.length > 0) {
            columnKeys = columnOrder.map(item => item.key);
            console.log('🔹 Derived column keys from column order:', columnKeys);
        }
        
        // 🔥 CRITICAL: Apply column order - use the order from template if available
        if (columnOrder.length > 0) {
            console.log('🔹 Applying column order from template');
            
            // Sort sections based on column order
            const sortedSections = [];
            const checkedKeys = new Set(updatedSections.filter(s => s.checked).map(s => s.key));
            console.log('🔹 Checked keys:', [...checkedKeys]);
            
            // First, add sections in the specified order that are checked
            columnOrder.forEach(orderItem => {
                const key = orderItem.key;
                if (checkedKeys.has(key)) {
                    const section = updatedSections.find(s => s.key === key);
                    if (section) {
                        sortedSections.push({ ...section, order: orderItem.order });
                        checkedKeys.delete(key);
                        console.log(`🔹 Added ${key} at order ${orderItem.order}`);
                    }
                }
            });
            
            // Then add any remaining checked sections not in the order
            checkedKeys.forEach(key => {
                const section = updatedSections.find(s => s.key === key);
                if (section) {
                    sortedSections.push({ ...section, order: sortedSections.length + 1 });
                    console.log(`🔹 Added remaining ${key} at order ${sortedSections.length}`);
                }
            });
            
            // Update sections with the sorted order
            if (sortedSections.length > 0) {
                // Merge sorted sections with unchecked sections
                this.sections = updatedSections.map(sec => {
                    const sorted = sortedSections.find(s => s.key === sec.key);
                    if (sorted) {
                        return sorted;
                    }
                    return { ...sec, order: null };
                });
                console.log('✅ Applied column order successfully');
            } else {
                this.sections = updatedSections;
                console.log('⚠️ No sorted sections, using updated sections');
            }
        } else {
            // No column order in template, use the order from sections
            this.sections = updatedSections;
            console.log('🔹 No column order, using sections order');
        }
        
        // Store column keys
        if (columnKeys.length > 0) {
            this.columnKeys = columnKeys;
            console.log('🔹 Stored columnKeys:', columnKeys);
        } else if (columnOrder.length > 0) {
            this.columnKeys = columnOrder.map(item => item.key);
            console.log('🔹 Derived columnKeys from columnOrder:', this.columnKeys);
        } else {
            // Derive from checked sections
            this.updateColumnKeys();
        }
        
        // Ensure the column keys match the section order
        this.syncColumnKeysWithSections();
        
        console.log('✅ Final sections after applyTemplate:', JSON.stringify(this.sections));
        console.log('✅ Final columnKeys:', JSON.stringify(this.columnKeys));
        console.log('✅ Final columnOrder:', JSON.stringify(this.columnOrder));
        
        this.hasUnsavedChanges = false;
        console.log('===== applyTemplate END =====');
    }

    syncColumnKeysWithSections() {
        console.log('===== syncColumnKeysWithSections START =====');
        console.log('🔹 Current sections:', JSON.stringify(this.sections));
        
        // Get checked sections in their current order
        const checkedSections = this.sections.filter(s => s.checked === true);
        console.log('🔹 Checked sections:', JSON.stringify(checkedSections));
        
        // Update columnKeys and columnOrder to match sections
        this.columnKeys = checkedSections.map(s => s.key);
        this.columnOrder = checkedSections.map((s, index) => ({
            key: s.key,
            order: index + 1
        }));
        
        console.log('✅ Synced columnKeys:', JSON.stringify(this.columnKeys));
        console.log('✅ Synced columnOrder:', JSON.stringify(this.columnOrder));
        console.log('===== syncColumnKeysWithSections END =====');
    }

    // Helper to fix malformed columnOrder
    fixMalformedColumnOrder(malformedString) {
        console.log('===== fixMalformedColumnOrder START =====');
        console.log('🔹 Input malformed string:', malformedString);
        
        try {
            // Try to extract key-value pairs using regex
            const matches = malformedString.match(/\[\s*"key"\s*:\s*"([^"]+)"\s*,\s*"order"\s*:\s*(\d+)\s*\]/g);
            console.log('🔹 Regex matches:', matches);
            
            if (matches) {
                const result = matches.map(match => {
                    const keyMatch = match.match(/"key"\s*:\s*"([^"]+)"/);
                    const orderMatch = match.match(/"order"\s*:\s*(\d+)/);
                    if (keyMatch && orderMatch) {
                        return {
                            key: keyMatch[1],
                            order: parseInt(orderMatch[1])
                        };
                    }
                    return null;
                }).filter(item => item !== null);
                
                console.log('✅ Fixed column order:', result);
                console.log('===== fixMalformedColumnOrder END (success) =====');
                return result;
            }
        } catch (e) {
            console.error('❌ Failed to fix columnOrder:', e);
        }
        console.log('===== fixMalformedColumnOrder END (failed) =====');
        return [];
    }

    // Add this method to fix existing malformed templates
    async fixExistingTemplates() {
        console.log('===== fixExistingTemplates START =====');
        console.log('🔹 selectedFacilityIdforgenerated:', this.selectedFacilityIdforgenerated);
        
        if (!this.selectedFacilityIdforgenerated) {
            console.warn('⚠️ No facility selected');
            console.log('===== fixExistingTemplates END (no facility) =====');
            return;
        }
        
        try {
            console.log('🔹 Fetching templates to fix...');
            const result = await getTemplatesByFacility({
                facilityId: this.selectedFacilityIdforgenerated,
                reportType: this.reportTypeValue
            });
            
            console.log('🔹 Found templates to fix:', result.length);
            let fixedCount = 0;
            
            for (const template of result) {
                console.log(`🔹 Processing template ${template.Id}:`, template.Name);
                
                if (template.Template_JSON__c) {
                    try {
                        let parsed = JSON.parse(template.Template_JSON__c);
                        let needsFix = false;
                        
                        // Check if columnOrder is malformed
                        if (parsed.columnOrder) {
                            // If it's not an array or the array contains invalid items
                            if (!Array.isArray(parsed.columnOrder)) {
                                console.log(`⚠️ Template ${template.Id} has malformed columnOrder, fixing...`);
                                needsFix = true;
                                
                                // Try to fix by extracting from columnKeys or checked fields
                                if (parsed.columnKeys && Array.isArray(parsed.columnKeys)) {
                                    parsed.columnOrder = parsed.columnKeys.map((key, index) => ({
                                        key: key,
                                        order: index + 1
                                    }));
                                    console.log(`🔹 Fixed columnOrder from columnKeys:`, parsed.columnOrder);
                                } else {
                                    // Derive from checked fields
                                    const checkedKeys = Object.keys(parsed).filter(k => 
                                        parsed[k] === true || parsed[k] === 'true'
                                    );
                                    parsed.columnOrder = checkedKeys.map((key, index) => ({
                                        key: key,
                                        order: index + 1
                                    }));
                                    console.log(`🔹 Fixed columnOrder from checked fields:`, parsed.columnOrder);
                                }
                            } else if (parsed.columnOrder.length > 0) {
                                // Check if each item is a proper object
                                const invalidItems = parsed.columnOrder.some(item => 
                                    !item || typeof item !== 'object' || !item.key
                                );
                                if (invalidItems) {
                                    console.log(`⚠️ Template ${template.Id} has invalid columnOrder items, fixing...`);
                                    needsFix = true;
                                    
                                    // Rebuild from columnKeys or checked fields
                                    if (parsed.columnKeys && Array.isArray(parsed.columnKeys)) {
                                        parsed.columnOrder = parsed.columnKeys.map((key, index) => ({
                                            key: key,
                                            order: index + 1
                                        }));
                                        console.log(`🔹 Fixed columnOrder from columnKeys:`, parsed.columnOrder);
                                    }
                                }
                            }
                        }
                        
                        if (needsFix) {
                            // Save the fixed template
                            const fixedJson = JSON.stringify(parsed);
                            console.log(`🔹 Saving fixed template ${template.Id}:`, fixedJson);
                            
                            await createTemplate({
                                templateName: template.Name,
                                facilityId: this.selectedFacilityIdforgenerated,
                                templateJson: fixedJson,
                                templateId: template.Id,
                                reportType: this.reportTypeValue,
                            });
                            
                            fixedCount++;
                            console.log(`✅ Template ${template.Id} fixed successfully`);
                        } else {
                            console.log(`✅ Template ${template.Id} is valid`);
                        }
                    } catch (e) {
                        console.error(`❌ Error parsing template ${template.Id}:`, e);
                    }
                } else {
                    console.log(`🔹 Template ${template.Id} has no JSON to fix`);
                }
            }
            
            // Reload templates after fixing
            console.log(`🔹 Reloading templates after fixing ${fixedCount} templates...`);
            await this.loadTemplates();
            console.log(`✅ Finished fixing ${fixedCount} template(s)`);
        } catch (error) {
            console.error('❌ Error fixing templates:', error);
        }
        
        console.log('===== fixExistingTemplates END =====');
    }

    applyTemplateById(templateId) {
        console.log('===== applyTemplateById START =====');
        console.log('🔹 templateId:', templateId);
        console.log('🔹 templatesforShiftReport length:', this.templatesforShiftReport?.length || 0);
        
        if (!templateId || templateId === 'NEW') {
            console.log('🔹 Template is NEW, clearing selections');
            this.clearAllSelections();
            this.columnKeys = [];
            this.columnOrder = [];
            console.log('===== applyTemplateById END (NEW) =====');
            return;
        }
        
        // Wait for templates to be loaded if they're empty
        if (!this.templatesforShiftReport || this.templatesforShiftReport.length === 0) {
            console.log('🔹 Templates not loaded yet, waiting...');
            this.loadTemplates().then(() => {
                console.log('✅ Templates loaded, reapplying template:', templateId);
                this.applyTemplateById(templateId);
            }).catch(error => {
                console.error('❌ Failed to load templates:', error);
                // 🔥 FIX: If template fails to load, use NEW
                this.handleTemplateNotFound(templateId);
            });
            console.log('===== applyTemplateById END (loading) =====');
            return;
        }
        
        const tpl = this.templatesforShiftReport.find(t => t.value === templateId);
        console.log('🔹 Found template:', tpl ? tpl.label : 'not found');
        
        if (tpl) {
            // Ensure sections exist before applying
            this.ensureSectionsExist();
            
            if (tpl.parsedJson) {
                console.log('🔹 Using parsedJson from template');
                this.applyTemplate(tpl.parsedJson);
            } else if (tpl.json) {
                try {
                    console.log('🔹 Parsing template JSON...');
                    const parsed = JSON.parse(tpl.json);
                    console.log('✅ Parsed template JSON:', Object.keys(parsed));
                    this.applyTemplate(parsed);
                } catch (e) {
                    console.error('❌ Template parse error:', e);
                    this.clearAllSelections();
                    this.columnKeys = [];
                    this.columnOrder = [];
                }
            } else {
                console.warn('⚠️ Template has no JSON data');
                this.clearAllSelections();
                this.columnKeys = [];
                this.columnOrder = [];
            }
        } else {
            console.warn('⚠️ Template not found with ID:', templateId);
            // 🔥 FIX: Handle missing template gracefully
            this.handleTemplateNotFound(templateId);
        }
        console.log('===== applyTemplateById END =====');
    }

    /**
     * 🔥 NEW METHOD: Handle missing template gracefully
     */
    handleTemplateNotFound(templateId) {
        console.log('===== handleTemplateNotFound START =====');
        console.log('🔹 Missing template ID:', templateId);
        
        // Check if we have a valid template ID stored in the report
        // If not, try to find the first available template or use NEW
        
        // First, check if there's a default template we can use
        const firstNonNew = this.templatesforShiftReport.find(t => t.value !== 'NEW');
        
        if (firstNonNew) {
            console.log('🔹 Using first available template as fallback:', firstNonNew.label);
            this.selectedTemplateId = firstNonNew.value;
            this.selectedTemplateLabel = firstNonNew.label;
            this.applyTemplateById(firstNonNew.value);
        } else {
            // No templates available, use NEW
            console.log('🔹 No templates available, using NEW');
            this.selectedTemplateId = 'NEW';
            this.selectedTemplateLabel = 'New';
            this.clearAllSelections();
            this.columnKeys = [];
            this.columnOrder = [];
            
            // 🔥 CRITICAL: Create a default template with all columns checked
            // This ensures the report can be generated even without a saved template
            console.log('🔹 Creating default template with all columns checked...');
            this.ensureSectionsExist();
            this.sections = this.sections.map(sec => ({ ...sec, checked: true }));
            this.updateColumnKeys();
            
            console.log('✅ Default template created with all columns checked');
        }
        
        console.log('===== handleTemplateNotFound END =====');
    }

    clearAllSelections() {
        console.log('===== clearAllSelections START =====');
        console.log('🔹 Sections before clear:', this.sections?.length || 0);
        
        if (this.sections && this.sections.length > 0) {
            this.sections = this.sections.map(sec => ({ 
                ...sec, 
                checked: false 
            }));
            console.log('✅ All selections cleared');
        } else {
            console.log('🔹 No sections to clear');
        }
        console.log('===== clearAllSelections END =====');
    }

    buildTemplatePayload() {
        console.log('===== buildTemplatePayload START =====');
        console.log('🔹 Current sections:', JSON.stringify(this.sections));
        console.log('🔹 Current columnKeys:', JSON.stringify(this.columnKeys));
        console.log('🔹 Current columnOrder:', JSON.stringify(this.columnOrder));
        
        const payload = {};
        
        // Add section checkboxes - ensure boolean values
        this.sections.forEach(sec => { 
            payload[sec.key] = sec.checked === true; 
        });
        console.log('🔹 Section checkboxes added to payload');
        
        // Build proper column order array - ensure it's a plain array
        const checkedSections = this.sections.filter(s => s.checked);
        console.log('🔹 Checked sections:', checkedSections.length);
        
        // 🔥 CRITICAL: Build columnOrder as a proper array of objects
        const columnOrder = checkedSections.map((s, index) => ({
            key: s.key,
            order: index + 1
        }));
        
        // Get column keys in order - ensure it's a plain array
        const columnKeys = checkedSections.map(s => s.key);
        
        // 🔥 CRITICAL: Convert to plain arrays using JSON parse/stringify
        payload.columnOrder = JSON.parse(JSON.stringify(columnOrder));
        payload.columnKeys = JSON.parse(JSON.stringify(columnKeys));
        payload.exportType = this.selectedExportType || 'PDF';
        payload.selectedTemplateId = this.selectedTemplateId;
        
        // Add additional metadata
        payload.reportType = this.reportTypeValue;
        payload.timestamp = new Date().toISOString();
        
        // 🔥 CRITICAL: Validate the payload is valid JSON
        const jsonString = JSON.stringify(payload);
        const validatedPayload = JSON.parse(jsonString);
        
        console.log('✅ Built template payload:');
        console.log('🔹 columnOrder type:', typeof validatedPayload.columnOrder);
        console.log('🔹 columnOrder is array:', Array.isArray(validatedPayload.columnOrder));
        console.log('🔹 columnOrder length:', validatedPayload.columnOrder?.length || 0);
        console.log('🔹 columnKeys:', JSON.stringify(validatedPayload.columnKeys));
        console.log('🔹 columnOrder:', JSON.stringify(validatedPayload.columnOrder));
        console.log('===== buildTemplatePayload END =====');
        
        return validatedPayload;
    }

    getParticipantServiceSections() {
        console.log('===== getParticipantServiceSections START =====');
        const sections = [
            { key: 'PARTICIPANT_NAME', label: 'Participant Name', checked: false, order: 1 },
            { key: 'SERVICE_DATE', label: 'Service Date', checked: false, order: 2 },
            { key: 'FACILITY', label: 'Facility', checked: false, order: 3 },
            { key: 'SERVICE_TYPE', label: 'Service Type', checked: false, order: 4 },
            { key: 'SUPPORT_ITEM', label: 'Support Item', checked: false, order: 5 },
            { key: 'RESOURCE_NAME', label: 'Staff Name', checked: false, order: 6 },
            { key: 'START_TIME', label: 'Start Time', checked: false, order: 7 },
            { key: 'END_TIME', label: 'End Time', checked: false, order: 8 },
            { key: 'QTY', label: 'Qty', checked: false, order: 9 },
            { key: 'STATUS', label: 'Status', checked: false, order: 10 }
        ];
        console.log('🔹 Returning', sections.length, 'participant service sections');
        console.log('===== getParticipantServiceSections END =====');
        return sections;
    }

    // ============ REPORT GENERATION ============
    async handleGenerateReport() {
        console.log('===== handleGenerateReport START =====');
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        console.log('🔹 startDate:', this.startDate);
        console.log('🔹 endDate:', this.endDate);
        console.log('🔹 isAllStaff:', this.isAllStaff);
        console.log('🔹 isIndividualStaff:', this.isIndividualStaff);
        console.log('🔹 selectedStaffId:', this.selectedStaffId);
        console.log('🔹 Current timestamp:', new Date().toISOString());
        
        this.isPDF = false;
        this.isCSV = false;

        if (this.reportTypeValue === 'SHIFT') {
            console.log('🔹 Generating Shift Report...');
            if (!this.startDate || !this.endDate) {
                console.warn('⚠️ Date range missing for shift report');
                this.showToast('Error', 'Select date range', 'error');
                console.log('===== handleGenerateReport END (date error) =====');
                return;
            }
            /* if (this.isAllStaff && !this.selectedEmploymentType) {
                this.showToast('Error', 'Please Select Employment Type', 'error');
                return;
            } */
            if (this.isIndividualStaff && !this.selectedStaffId) {
                console.warn('⚠️ Individual staff selected but no staff ID');
                this.showToast('Error', 'Please Select Staff', 'error');
                console.log('===== handleGenerateReport END (staff error) =====');
                return;
            }
            console.log('🔹 Calling generateShiftReport...');
            await this.generateShiftReport();
            console.log('===== handleGenerateReport END (shift) =====');
            return;
        }

        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            console.log('🔹 Generating Rejected Shift Report...');
            if (!this.startDate || !this.endDate) {
                console.warn('⚠️ Date range missing for rejected shift report');
                this.showToast('Error', 'Select date range', 'error');
                console.log('===== handleGenerateReport END (date error) =====');
                return;
            }
            console.log('🔹 Calling generateRejectedShiftReport...');
            await this.generateRejectedShiftReport();
            console.log('===== handleGenerateReport END (rejected) =====');
            return;
        }

        if (this.reportTypeValue === 'REIMBURSEMENT') {
            console.log('🔹 Generating Reimbursement Report...');
            if (!this.startDate || !this.endDate) {
                console.warn('⚠️ Date range missing for reimbursement report');
                this.showToast('Error', 'Select date range', 'error');
                console.log('===== handleGenerateReport END (date error) =====');
                return;
            }
            console.log('🔹 Calling generateReimbursementReport...');
            await this.generateReimbursementReport();
            console.log('===== handleGenerateReport END (reimbursement) =====');
            return;
        }

        if (this.reportTypeValue === 'STAFF') {
            console.log('🔹 Generating Staff Report...');
            if (!this.selectedstaffStatus) {
                console.warn('⚠️ Staff status not selected');
                this.showToast('Error', 'Select Status', 'error');
                console.log('===== handleGenerateReport END (status error) =====');
                return;
            }
            /* if (!this.selectedEmploymentType) {
                this.showToast('Error', 'Select Employment Type', 'error');
                return;
            } */
            console.log('🔹 Calling generateStaffReport...');
            await this.generateStaffReport();
            console.log('===== handleGenerateReport END (staff) =====');
            return;
        }

        if (this.reportTypeValue === 'PARTICIPANT') {
            console.log('🔹 Generating Participant Report...');
            if (!this.selectedstaffStatus) {
                console.warn('⚠️ Staff status not selected');
                this.showToast('Error', 'Select Status', 'error');
                console.log('===== handleGenerateReport END (status error) =====');
                return;
            }
            console.log('🔹 Calling loadParticipants...');
            await this.loadParticipants();
            console.log('===== handleGenerateReport END (participant) =====');
            return;
        }

        if (this.reportTypeValue === 'OVER_EFF') {
            console.log('🔹 Generating Over/Under Efficiency Report...');
            /* if (!this.selectedEmploymentType) {
                this.showToast('Error', 'Select Employment Type', 'error');
                return;
            } */
            if (!this.startDate || !this.endDate) {
                console.warn('⚠️ Date range missing for over/under report');
                this.showToast('Error', 'Select date range', 'error');
                console.log('===== handleGenerateReport END (date error) =====');
                return;
            }
            console.log('🔹 Calling loadStaffUtilizationData...');
            await this.loadStaffUtilizationData();
            console.log('===== handleGenerateReport END (over/under) =====');
            return;
        }

        if (this.reportTypeValue === 'Participant_Service_Delivery') {
            console.log('🔹 Generating Participant Service Delivery Report...');
            if (!this.selectedFacilityIds || this.selectedFacilityIds.length === 0) {
                console.warn('⚠️ No facility selected');
                this.showToast('Error', 'Please Select Facility', 'error');
                console.log('===== handleGenerateReport END (facility error) =====');
                return;
            }
            if (!this.selectedParticipantIds || this.selectedParticipantIds.length === 0) {
                console.warn('⚠️ No participant selected');
                this.showToast('Error', 'Please Select Participant', 'error');
                console.log('===== handleGenerateReport END (participant error) =====');
                return;
            }
            if (!this.startDate || !this.endDate) {
                console.warn('⚠️ Date range missing');
                this.showToast('Error', 'Please Select Date Range', 'error');
                console.log('===== handleGenerateReport END (date error) =====');
                return;
            }
            console.log('🔹 Calling generateParticipantServiceDeliveryReport...');
            await this.generateParticipantServiceDeliveryReport();
            console.log('===== handleGenerateReport END (participant service) =====');
            return;
        }
        
        console.log('🔹 No matching report type, ending');
        console.log('===== handleGenerateReport END =====');
    }

    async generateShiftReport() {
        console.log('===== generateShiftReport START =====');
        console.log('🔹 isAllStaff:', this.isAllStaff);
        console.log('🔹 isIndividualStaff:', this.isIndividualStaff);
        console.log('🔹 selectedStaffId:', this.selectedStaffId);
        console.log('🔹 selectedRoles:', JSON.stringify(this.selectedRoles));
        console.log('🔹 selectedEmploymentType:', this.selectedEmploymentType);
        console.log('🔹 selectedLocation:', this.selectedLocation);
        console.log('🔹 startDate:', this.startDate);
        console.log('🔹 endDate:', this.endDate);
        console.log('🔹 selectedFacilityIds:', JSON.stringify(this.selectedFacilityIds));
        console.log('🔹 staffList length:', this.staffList?.length || 0);
        
        try {
            let staffIds = [];
            if (this.isAllStaff) {
                staffIds = (this.staffList || []).map(s => s.Id);
                console.log('🔹 All staff IDs count:', staffIds.length);
            }
            if (this.isIndividualStaff) {
                if (!this.selectedStaffId) {
                    console.warn('⚠️ No staff ID for individual staff');
                    console.log('===== generateShiftReport END (no staff ID) =====');
                    return;
                }
                staffIds = [this.selectedStaffId];
                console.log('🔹 Individual staff ID:', this.selectedStaffId);
            }

            console.log('🔹 Calling getShiftWithSmartStaffData with params:', {
                role: this.selectedRoles,
                employmentType: this.selectedEmploymentType || 'All',
                startWeekDate: this.startDate,
                endWeekDate: this.endDate,
                location: this.selectedLocation || 'All',
                facilityIds: this.selectedFacilityIds,
                staffIds: staffIds
            });
            
            const shifts = await getShiftWithSmartStaffData({
                role: this.selectedRoles,
                employmentType: this.selectedEmploymentType || 'All',
                startWeekDate: this.startDate,
                endWeekDate: this.endDate,
                location: this.selectedLocation || 'All',
                facilityIds: this.selectedFacilityIds,
                staffIds: staffIds
            });

            console.log('✅ Shift data received');
            console.log('🔹 Shifts count:', shifts ? shifts.length : 0);

            if (!shifts || shifts.length === 0) {
                console.warn('⚠️ No shifts found for the selected filters');
                this.showToast('No Data', 'No shifts found for the selected filters.', 'info');
                console.log('===== generateShiftReport END (no data) =====');
                return;
            }

            console.log('🔹 Processing shift records...');
            this.filteredRecords = shifts.map((shift, index) => {
                console.log(`🔹 Processing shift ${index + 1}:`, shift.Id);
                const participants = Array.isArray(shift.Services_and_Support_Plans__r)
                    ? [...new Set(shift.Services_and_Support_Plans__r.map(p => p.Participant_Name__c).filter(Boolean))].join(', ')
                    : '';
                console.log(`🔹 Participants for shift ${shift.Id}:`, participants || 'none');
                
                const record = {
                    Id: shift.Id,
                    staffName: shift.Staff__r?.Display_Nickname__c || shift.Staff__r?.Name || '',
                    date: this.formatDateToDDMMYYYY(shift.Date__c),
                    shiftType: shift.Add_Shift__r?.Shift_Type__c || shift.Type_of_shift__c || '',
                    shiftTime: shift.Add_Shift__r?.Shift_Start_End_Time__c || '',
                    role: shift.Add_Shift__r?.Role__c || shift.Role_Name__c || '',
                    participants: participants || '-',
                    status: shift.Status__c,
                    signIn: shift.Login_Time_Formula__c || '-',
                    signOut: shift.Logout_Time_Formula__c || '-'
                };
                console.log(`🔹 Mapped shift ${index + 1}:`, {
                    staffName: record.staffName,
                    date: record.date,
                    shiftType: record.shiftType,
                    status: record.status
                });
                return record;
            });

            console.log('✅ Total filtered records:', this.filteredRecords.length);

            this.pageNumber = 1;
            this.pageSize = this.pageSize || 10;
            if (!this.handlePreviewflag) {
                console.log('🔹 Opening export modal');
                this.isStaffBasedReportshowModal = true;
                this.initializeExportModal(); // ADD THIS LINE
            }
            this.paginationHelper();
            this.reportSummary = {
                staffType: this.isAllStaff ? 'All Staff' : 'Individual Staff',
                period: `${this.formatDateDDMMYYYY(this.startDate)} - ${this.formatDateDDMMYYYY(this.endDate)}`
            };
            if (!this.handlePreviewflag) {
                this.isBuilderView = false;
                this.isResultView = true;
            }
            console.log('✅ Shift report generated successfully');
            console.log('===== generateShiftReport END (success) =====');

        } catch (error) {
            console.error('❌ Error generating shift report:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            console.log('===== generateShiftReport END (error) =====');
        }
    }

    async generateRejectedShiftReport() {
        console.log('===== generateRejectedShiftReport START =====');
        console.log('🔹 startDate:', this.startDate);
        console.log('🔹 endDate:', this.endDate);
        console.log('🔹 orgid:', this.orgid);
        console.log('🔹 selectedFacilityIds:', JSON.stringify(this.selectedFacilityIds));
        console.log('🔹 selectedStaffId:', this.selectedStaffId);
        console.log('🔹 selectedRoles:', JSON.stringify(this.selectedRoles));
        console.log('🔹 isIndividualStaff:', this.isIndividualStaff);
        
        try {
            let staffIds = [];
            if (this.isIndividualStaff && this.selectedStaffId) {
                staffIds = [this.selectedStaffId];
                console.log('🔹 Individual staff ID:', this.selectedStaffId);
            }
            
            console.log('🔹 Calling getRejectedShiftsForSmartReports with params:', {
                startDateStr: this.startDate,
                endDateStr: this.endDate,
                orgId: this.orgid,
                facilityIds: this.selectedFacilityIds,
                staffIds: staffIds,
                role: this.selectedRoles
            });
            
            const result = await getRejectedShiftsForSmartReports({
                startDateStr: this.startDate,
                endDateStr: this.endDate,
                orgId: this.orgid,
                facilityIds: this.selectedFacilityIds,
                staffIds: staffIds,
                role: this.selectedRoles
            });
            
            console.log('✅ Rejected shifts response received');
            console.log('🔹 Result count:', result ? result.length : 0);
            result.forEach((r, index) => {
                console.log(`🔹 Rejected shift ${index + 1}:`, {
                    Id: r.Id || r.shift?.Id,
                    Facility: r.Facility__c,
                    FacilityName: r.Facility__r?.Name
                });
            });

            if (!Array.isArray(result) || result.length === 0) {
                console.warn('⚠️ No rejected shifts found');
                this.showToast('Info', 'No rejected shifts found', 'info');
                console.log('===== generateRejectedShiftReport END (no data) =====');
                return;
            }

            this.rejectedShiftsRaw = result;
            if (this.isRejectedShiftReport) {
                console.log('🔹 Building rejected staff list...');
                this.buildRejectedStaffList(this.rejectedShiftsRaw);
            }

            console.log('🔹 Normalizing rejected shift records...');
            this.rejectedFilteredRecords = this.rejectedShiftsRaw.map((w, index) => {
                console.log(`🔹 Normalizing record ${index + 1}`);
                return this.normalizeRejectedShift(w);
            });
            
            console.log('🔹 Calculating rejected metrics...');
            this.calculateRejectedMetrics();

            this.rejectedPageNumber = 1;
            this.rejectedPageSize = this.rejectedPageSize || 10;
            this.rejectedPaginationHelper();

            if (!this.handlePreviewflag) {
                console.log('🔹 Opening export modal');
                this.isStaffBasedReportshowModal = true;
                this.initializeExportModal(); // ADD THIS LINE
            }
            
            console.log('✅ Rejected shift report generated successfully');

        } catch (e) {
            console.error('❌ [Rejected][Generate] ERROR →', e);
            console.error('🔹 Error details:', {
                message: e.message,
                stack: e.stack,
                body: e.body
            });
            this.showToast('Error', 'Failed to load rejected shifts', 'error');
        }
        console.log('===== generateRejectedShiftReport END =====');
    }

    async generateReimbursementReport() {
        console.log('===== generateReimbursementReport START =====');
        console.log('🔹 startDate:', this.startDate);
        console.log('🔹 endDate:', this.endDate);
        console.log('🔹 statusValue:', this.statusValue);
        console.log('🔹 selectedFacilityIds:', JSON.stringify(this.selectedFacilityIds));
        
        try {
            console.log('🔹 Calling getAllReimbursements with params:', {
                startDate: this.startDate,
                endDate: this.endDate,
                status: this.statusValue,
                facilityIds: this.selectedFacilityIds,
            });
            
            const result = await getAllReimbursements({
                startDate: this.startDate,
                endDate: this.endDate,
                status: this.statusValue,
                facilityIds: this.selectedFacilityIds,
            });

            console.log('✅ Reimbursement response received');
            console.log('🔹 Result count:', result ? result.length : 0);

            if (!result || result.length === 0) {
                this.reimbursementAllRecords = [];
                console.warn('⚠️ No reimbursement records found');
                this.showToast('Info', 'No reimbursement records found', 'info');
                console.log('===== generateReimbursementReport END (no data) =====');
                return;
            }

            this.reimbursementAllRecords = result;
            console.log('🔹 Stored reimbursement records:', this.reimbursementAllRecords.length);
            
            this.reimbursementPageNumber = 1;
            this.reimbursementPageSize = this.reimbursementPageSize || 10;
            this.reimbursementPaginationHelper();

            if (!this.handlePreviewflag) {
                console.log('🔹 Opening export modal');
                this.isStaffBasedReportshowModal = true;
                this.initializeExportModal(); // ADD THIS LINE
            }
            
            console.log('✅ Reimbursement report generated successfully');

        } catch (error) {
            console.error('❌ Error generating reimbursement report:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.showToast('Error', 'Failed to load reimbursement report', 'error');
        }
        console.log('===== generateReimbursementReport END =====');
    }

    async generateStaffReport() {
        console.log('===== generateStaffReport START =====');
        console.log('🔹 isAllStaff:', this.isAllStaff);
        console.log('🔹 isIndividualStaff:', this.isIndividualStaff);
        console.log('🔹 selectedStaffId:', this.selectedStaffId);
        console.log('🔹 selectedstaffStatus:', this.selectedstaffStatus);
        console.log('🔹 selectedEmploymentType:', this.selectedEmploymentType);
        console.log('🔹 selectedFacilityIds:', JSON.stringify(this.selectedFacilityIds));
        console.log('🔹 selectedRoles:', JSON.stringify(this.selectedRoles));
        
        try {
            let staffIds = [];
            if (this.isAllStaff) {
                staffIds = (this.staffList || []).map(s => s.Id);
                console.log('🔹 All staff IDs count:', staffIds.length);
            }
            if (this.isIndividualStaff) {
                if (!this.selectedStaffId) {
                    console.warn('⚠️ No staff ID for individual staff');
                    console.log('===== generateStaffReport END (no staff ID) =====');
                    return;
                }
                staffIds = [this.selectedStaffId];
                console.log('🔹 Individual staff ID:', this.selectedStaffId);
            }

            console.log('🔹 Calling fetchStaffs with params:', {
                facilityIds: this.selectedFacilityIds,
                status: this.selectedstaffStatus,
                employmentType: this.selectedEmploymentType,
                staffIds: staffIds,
                roleNames: this.selectedRoles
            });
            
            const result = await fetchStaffs({
                facilityIds: this.selectedFacilityIds,
                status: this.selectedstaffStatus,
                employmentType: this.selectedEmploymentType,
                staffIds: staffIds,
                roleNames: this.selectedRoles
            });

            console.log('✅ Staff response received');
            console.log('🔹 Result count:', result ? result.length : 0);

            if (!result || result.length === 0) {
                this.staffAllRecords = [];
                console.warn('⚠️ No staff records found');
                this.showToast('Info', 'No staff records found', 'info');
                console.log('===== generateStaffReport END (no data) =====');
                return;
            }

            console.log('🔹 Processing staff records...');
            this.staffAllRecords = result.map((s, index) => {
                console.log(`🔹 Processing staff ${index + 1}:`, s.Id);
                const record = {
                    Id: s.Id,
                    staffName: s.Display_Nickname__c || s.Name,
                    email: s.Email_Address__c,
                    contactNumber: s.Contact_Number__c,
                    gender: s.Gender__c,
                    dob: s.Date_Of_Birth__c,
                    status: s.Status__c ? 'Active' : 'Inactive'
                };
                console.log(`🔹 Mapped staff ${index + 1}:`, {
                    name: record.staffName,
                    status: record.status
                });
                return record;
            });

            console.log('✅ Total staff records:', this.staffAllRecords.length);

            this.staffPageNumber = 1;
            this.staffPageSize = this.staffPageSize || 10;
            this.staffPaginationHelper();

            if (!this.handlePreviewflag) {
                console.log('🔹 Opening export modal');
                this.isStaffBasedReportshowModal = true;
                this.initializeExportModal(); // ADD THIS LINE
            }
            
            console.log('✅ Staff report generated successfully');

        } catch (error) {
            console.error('❌ generateStaffReport error:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.showToast('Error', 'Failed to load staff data', 'error');
        }
        console.log('===== generateStaffReport END =====');
    }

    async loadParticipants() {
        console.log('===== loadParticipants START =====');
        console.log('🔹 selectedFacilityIds:', JSON.stringify(this.selectedFacilityIds));
        console.log('🔹 selectedstaffStatus:', this.selectedstaffStatus);
        
        try {
            console.log('🔹 Calling fetchFacilitiess with params:', {
                facilityIds: this.selectedFacilityIds,
                status: this.selectedstaffStatus
            });
            
            const result = await fetchFacilitiess({
                facilityIds: this.selectedFacilityIds,
                status: this.selectedstaffStatus
            });

            console.log('✅ Participant response received');
            console.log('🔹 Result count:', result ? result.length : 0);

            if (!result || result.length === 0) {
                this.participantAllRecords = [];
                console.warn('⚠️ No participant records found');
                this.showToast('Info', 'No participant records found', 'info');
                console.log('===== loadParticipants END (no data) =====');
                return;
            }

            this.participantAllRecords = result;
            console.log('🔹 Stored participant records:', this.participantAllRecords.length);
            
            this.participantPageNumber = 1;
            this.participantPageSize = this.participantPageSize || 10;
            this.participantPaginationHelper();

            if (!this.handlePreviewflag) {
                console.log('🔹 Opening export modal');
                this.isStaffBasedReportshowModal = true;
                this.initializeExportModal(); // ADD THIS LINE
            }
            
            console.log('✅ Participants loaded successfully');

        } catch (error) {
            console.error('❌ Error while fetching participants:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.showToast('Error', 'Failed to load participant data', 'error');
        }
        console.log('===== loadParticipants END =====');
    }

    async generateParticipantServiceDeliveryReport() {
        console.log('===== generateParticipantServiceDeliveryReport START =====');
        console.log('🔹 selectedFacilityIds:', JSON.stringify(this.selectedFacilityIds));
        console.log('🔹 selectedParticipantIds:', JSON.stringify(this.selectedParticipantIds));
        console.log('🔹 startDate:', this.startDate);
        console.log('🔹 endDate:', this.endDate);
        
        try {
            if (!this.startDate || !this.endDate) {
                console.warn('⚠️ Date range missing');
                console.log('===== generateParticipantServiceDeliveryReport END (date error) =====');
                return;
            }

            console.log('🔹 Calling getParticipantServiceDeliveryReport with params:', {
                facilityIds: this.selectedFacilityIds,
                participantIds: this.selectedParticipantIds,
                startDate: this.startDate,
                endDate: this.endDate
            });
            
            const result = await getParticipantServiceDeliveryReport({
                facilityIds: this.selectedFacilityIds,
                participantIds: this.selectedParticipantIds,
                startDate: this.startDate,
                endDate: this.endDate
            });

            console.log('✅ Participant service delivery response received');
            console.log('🔹 Result count:', result ? result.length : 0);

            if (!result || result.length === 0) {
                console.warn('⚠️ No services found for the selected filters');
                this.showToast('No Data', 'No Services found for the selected filters.', 'info');
                console.log('===== generateParticipantServiceDeliveryReport END (no data) =====');
                return;
            }

            console.log('🔹 Processing participant service records...');
            this.participantServiceRecords = result.map((rec, index) => {
                console.log(`🔹 Processing record ${index + 1}:`, rec.Id);
                const record = {
                    Id: rec.Id,
                    participantName: rec.Participant_Name__c || '-',
                    serviceDate: this.formatDateToDDMMYYYY(rec.Date_of_Service__c),
                    facility: rec.ShiftwithStaff__r?.Facility__c || rec.ShiftwithStaff__r?.Add_Shift__r?.Facility__c || '-',
                    serviceType: rec.Service_Type_Name__c || '-',
                    supportItem: rec.Support_Item_Name__c || '-',
                    resourceName: rec.ShiftwithStaff__r?.Status__c === 'Unassigned' ? 'N/A' : (rec.Resource_Name__c || '-'),
                    startTime: rec.Start_Time_Formula__c || '-',
                    endTime: rec.End_Time_Formula__c || '-',
                    qty: Number(rec.Qty__c ?? 0) === 0 ? '0' : Number(rec.Qty__c).toFixed(2),
                    status: rec.ShiftwithStaff__r?.Shift_Rejected__c ? 'Rejected' : (rec.ShiftwithStaff__r?.Status__c || '-')
                };
                console.log(`🔹 Mapped record ${index + 1}:`, {
                    participantName: record.participantName,
                    serviceDate: record.serviceDate,
                    serviceType: record.serviceType,
                    status: record.status
                });
                return record;
            });

            console.log('✅ Total participant service records:', this.participantServiceRecords.length);

            this.pageNumber = 1;
            this.pageSize = this.pageSize || 10;

            if (!this.handlePreviewflag) {
                console.log('🔹 Opening export modal');
                this.isStaffBasedReportshowModal = true;
                this.initializeExportModal(); // ADD THIS LINE
                this.sections = this.getParticipantServiceSections();
            }

            this.participantServiceAllRecords = this.participantServiceRecords;
            this.participantServiceTotalRecords = this.participantServiceAllRecords.length;
            this.participantServicePageNumber = 1;
            this.updateParticipantServicePagination();

            this.reportSummary = {
                participantCount: this.selectedParticipantIds.length,
                period: `${this.formatDateDDMMYYYY(this.startDate)} - ${this.formatDateDDMMYYYY(this.endDate)}`
            };

            if (!this.handlePreviewflag) {
                this.isBuilderView = false;
                this.isResultView = true;
            }
            
            console.log('✅ Participant service delivery report generated successfully');

        } catch (error) {
            console.error('❌ generateParticipantServiceDeliveryReport Error:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack,
                body: error.body
            });
            this.showToast('Error', error?.body?.message || 'Error loading report', 'error');
        }
        console.log('===== generateParticipantServiceDeliveryReport END =====');
    }

    async loadStaffUtilizationData() {
        console.log('===== loadStaffUtilizationData START =====');
        console.log('🔹 selectedFacilityId:', this.selectedFacilityId);
        console.log('🔹 selectedRoles:', JSON.stringify(this.selectedRoles));
        console.log('🔹 selectedEmploymentType:', this.selectedEmploymentType);
        console.log('🔹 startDate:', this.startDate);
        console.log('🔹 endDate:', this.endDate);
        
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
            console.log('🔹 Calling getStaffUtilizationData with params:', params);

            const result = await getStaffUtilizationData(params);

            console.log('✅ Staff utilization response received');
            console.log('🔹 Result count:', result ? result.length : 0);

            if (!Array.isArray(result) || result.length === 0) {
                this.underOverAllRecords = [];
                this.hasData = false;
                console.warn('⚠️ No staff utilization data found');
                this.showToast('Info', 'No staff utilization data found', 'info');
                console.log('===== loadStaffUtilizationData END (no data) =====');
                return;
            }

            this.underOverAllRecords = result;
            console.log('🔹 Stored under/over records:', this.underOverAllRecords.length);
            
            this.underOverPageNumber = 1;
            this.underOverPageSize = this.underOverPageSize || 10;
            this.underOverPaginationHelper();
            this.hasData = true;
            this.isReportContainer = false;

            if (!this.handlePreviewflag) {
                console.log('🔹 Opening export modal');
                this.isStaffBasedReportshowModal = true;
                this.initializeExportModal(); // ADD THIS LINE
            }
            
            console.log('✅ Staff utilization data loaded successfully');

        } catch (error) {
            console.error('❌ Error in loadStaffUtilizationData():', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack,
                body: error.body
            });
            this.handleError(error);
            this.clearData();
        } finally {
            this.isLoading = false;
            console.log('🔹 isLoading set to false');
        }
        console.log('===== loadStaffUtilizationData END =====');
    }

    clearData() {
        console.log('===== clearData START =====');
        this.underOverAllRecords = [];
        this.hasData = false;
        console.log('✅ Data cleared');
        console.log('===== clearData END =====');
    }

    handleError(error) {
        console.log('===== handleError START =====');
        if (error?.body?.message) {
            console.error('❌ Apex message:', error.body.message);
        }
        this.showToast('Error', 'Failed to load data', 'error');
        console.log('===== handleError END =====');
    }

    // ============ REPORT TYPE HANDLING ============
    applyReportType(reportTypeValue) {
        console.log('===== applyReportType START =====');
        console.log('🔹 reportTypeValue:', reportTypeValue);
        console.log('🔹 handlePreviewflag:', this.handlePreviewflag);
        
        this.reportTypeValue = reportTypeValue;
        this.selectedReport = this.reportList.find(r => r.value === this.reportTypeValue);
        console.log('🔹 Selected report:', this.selectedReport);

        if (!this.handlePreviewflag) {
            console.log('🔹 Resetting all filters');
            this.resetAllFilters();
        }

        const today = new Date().toISOString().split('T')[0];
        console.log('🔹 Today\'s date:', today);

        if (this.reportTypeValue === 'Participant_Service_Delivery') {
            console.log('🔹 Initializing Participant Service Delivery report');
            this.loadTemplates();
            this.participantServiceflag = true;
            if (!this.handlePreviewflag) {
                this.startDate = today;
                this.endDate = today;
                this.selectedDateRange = 'TODAY';
            }
        }

        if (this.reportTypeValue === 'SHIFT') {
            console.log('🔹 Initializing Shift report');
            this.headingName = 'Shift Report Filters';
            this.loadTemplates();
            if (!this.handlePreviewflag) {
                this.isStaffBasedReport = true;
                this.isAllStaff = true;
                this.isShiftReport = true;
                this.startDate = today;
                this.endDate = today;
                this.selectedDateRange = 'TODAY';
            }
        }

        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            console.log('🔹 Initializing Rejected Shift report');
            this.headingName = 'Rejected Shift Report Filters';
            this.loadTemplates();
            if (!this.handlePreviewflag) {
                this.isStaffBasedReport = true;
                this.isRejectedShiftReport = true;
                this.rejectedflagFliters = true;
                this.isAllStaff = true;
                this.startDate = today;
                this.endDate = today;
                this.selectedDateRange = 'TODAY';
            }
        }

        if (this.reportTypeValue === 'STAFF') {
            console.log('🔹 Initializing Staff report');
            this.headingName = 'Staff Report Filters';
            this.loadTemplates();
            if (!this.handlePreviewflag) {
                this.isStaffBasedReport = true;
                this.isAllStaff = true;
                this.staffListflag = true;
            }
        }

        if (this.reportTypeValue === 'PARTICIPANT') {
            console.log('🔹 Initializing Participant report');
            this.headingName = 'Participant Report Filters';
            this.loadTemplates();
            if (!this.handlePreviewflag) {
                this.participantflag = true;
            }
        }

        if (this.reportTypeValue === 'OVER_EFF') {
            console.log('🔹 Initializing Over/Under Efficiency report');
            this.headingName = 'Over/Under Efficiency Report Filters';
            this.isStaffBasedReport = true;
            this.isAllStaff = true;
            this.isunderandOverReport = true;
            this.loadTemplates();
            this.startDate = today;
            this.endDate = today;
            this.selectedDateRange = 'TODAY';
        }

        if (this.reportTypeValue === 'REIMBURSEMENT') {
            console.log('🔹 Initializing Reimbursement report');
            this.headingName = 'Reimbursement Report Filters';
            this.loadTemplates();
            if (!this.handlePreviewflag) {
                this.reimbursementflag = true;
                this.startDate = today;
                this.endDate = today;
                this.selectedDateRange = 'TODAY';
            }
        }

        // Build sections AFTER loading templates
        if (this.reportTypeValue === 'PARTICIPANT') {
            console.log('🔹 Building sections for PARTICIPANT');
            this.buildSectionsForParticipantReport();
        } else if (this.reportTypeValue === 'STAFF') {
            console.log('🔹 Building sections for STAFF');
            this.buildSectionsForStaffReport();
        } else if (this.reportTypeValue === 'OVER_EFF') {
            console.log('🔹 Building sections for OVER_EFF');
            this.buildSectionsForUnderOverReport();
        } else {
            console.log('🔹 Building sections for report type:', this.reportTypeValue);
            this.buildSectionsForReport();
        }
        
        // Apply the template if one is selected
        if (this.selectedTemplateId && this.selectedTemplateId !== 'NEW') {
            console.log('🔹 Applying template:', this.selectedTemplateId);
            this.applyTemplateById(this.selectedTemplateId);
        }
        
        this.updateGenerateButtonState();
        console.log('===== applyReportType END =====');
    }

    // ============ FILTER RESET ============
    resetAllFilters() {
        console.log('===== resetAllFilters START =====');
        console.log('🔹 Resetting all filter values');
        
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
        this.participantServiceflag = false;
        this.selectedTemplateId = null;
        this.previousTemplateId = null;
        this.newTemplateName = '';
        this.isCreatingTemplate = false;
        this.sections = [];
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
        
        console.log('✅ All filters reset');
        console.log('===== resetAllFilters END =====');
    }

    // ============ STAFF SEARCH ============
    async fetchStaff() {
        console.log('===== fetchStaff START =====');
        console.log('🔹 selectedFacilityId:', this.selectedFacilityId);
        console.log('🔹 selectedRoles:', JSON.stringify(this.selectedRoles));
        console.log('🔹 selectedEmploymentType:', this.selectedEmploymentType);
        
        if (!this.selectedFacilityId) {
            console.warn('⚠️ No facility ID, clearing staff list');
            this.staffList = [];
            this.filteredStaffList = [];
            console.log('===== fetchStaff END (no facility) =====');
            return;
        }

        try {
            console.log('🔹 Calling getStaffByFacilityAndRoles with params:', {
                facilityId: this.selectedFacilityId,
                roleNames: Array.isArray(this.selectedRoles) && this.selectedRoles.length ? this.selectedRoles : null,
                employmentType: this.selectedEmploymentType
            });
            
            const result = await getStaffByFacilityAndRoles({
                facilityId: this.selectedFacilityId,
                roleNames: Array.isArray(this.selectedRoles) && this.selectedRoles.length ? this.selectedRoles : null,
                employmentType: this.selectedEmploymentType
            });

            console.log('✅ Staff response received');
            console.log('🔹 Result count:', result ? result.length : 0);

            this.staffList = result || [];
            this.filteredStaffList = [];
            this.selectedStaffId = null;
            console.log('🔹 Staff list updated:', this.staffList.length);
        } catch (error) {
            console.error('❌ Error fetching staff:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.staffList = [];
            this.filteredStaffList = [];
        }
        console.log('===== fetchStaff END =====');
    }

    handleStaffSearch(event) {
        console.log('===== handleStaffSearch START =====');
        const searchKey = event.target.value.toLowerCase();
        console.log('🔹 Search key:', searchKey);
        
        this.selectedStaffName = event.target.value;

        if (!searchKey) {
            this.filteredStaffList = [...this.staffList];
            console.log('🔹 No search key, showing all staff:', this.filteredStaffList.length);
        } else {
            this.filteredStaffList = this.staffList.filter(staff =>
                staff.Display_Nickname__c &&
                staff.Display_Nickname__c.toLowerCase().includes(searchKey)
            );
            console.log('🔹 Filtered staff count:', this.filteredStaffList.length);
        }
        this.showStaffDropdown = true;
        console.log('🔹 showStaffDropdown set to true');
        console.log('===== handleStaffSearch END =====');
    }

    handleStaffSearchFocus() {
        console.log('===== handleStaffSearchFocus START =====');
        this.showStaffDropdown = true;
        console.log('🔹 showStaffDropdown set to true');
        console.log('===== handleStaffSearchFocus END =====');
    }

    handleStaffOutsideClick(event) {
        if (!this.showStaffDropdown) return;
        
        const container = this.template.querySelector('.staff-search-container');
        if (!container || !container.contains(event.target)) {
            this.showStaffDropdown = false;
            console.log('🔹 Staff dropdown closed via outside click');
        }
    }

    stopStaffClick(event) {
        event.stopPropagation();
        console.log('🔹 Staff click stopped');
    }

    handleStaffSelect(event) {
        console.log('===== handleStaffSelect START =====');
        const staffId = event.currentTarget.dataset.id;
        console.log('🔹 Selected staff ID:', staffId);
        
        const staff = this.filteredStaffList1.find(s => s.Id === staffId);
        if (!staff) {
            console.warn('⚠️ Staff not found with ID:', staffId);
            console.log('===== handleStaffSelect END (not found) =====');
            return;
        }

        this.selectedStaffId = staff.Id;
        this.selectedStaffName = staff.Display_Nickname__c;
        this.filteredStaffList = [];
        this.showStaffDropdown = false;
        console.log('🔹 Staff selected:', {
            id: this.selectedStaffId,
            name: this.selectedStaffName
        });
        console.log('===== handleStaffSelect END =====');
    }

    handleStaffChange(event) {
        console.log('===== handleStaffChange START =====');
        const value = event.detail.value;
        console.log('🔹 Staff type selected:', value);
        
        this.selectedStaffType = value;
        if (this.selectedStaffType === 'all') {
            this.isAllStaff = true;
            this.isIndividualStaff = false;
            this.searchStaffflag = false;
            this.selectedStaffId = null;
            console.log('🔹 All Staff selected');
        } else {
            this.isAllStaff = false;
            this.isIndividualStaff = true;
            this.searchStaffflag = true;
            console.log('🔹 Individual Staff selected');
        }
        this.fetchStaff();
        console.log('===== handleStaffChange END =====');
    }

    // ============ ROLE HANDLING ============
    handleRoleCheckboxChange(event) {
        console.log('===== handleRoleCheckboxChange START =====');
        const role = event.target.value;
        const checked = event.target.checked;
        console.log('🔹 Role:', role, 'Checked:', checked);

        if (!Array.isArray(this.selectedRoles)) {
            this.selectedRoles = this.selectedRoles && this.selectedRoles !== 'All' ? [this.selectedRoles] : [];
            console.log('🔹 Initialized selectedRoles:', this.selectedRoles);
        }

        if (checked) {
            if (!this.selectedRoles.includes(role)) {
                this.selectedRoles = [...this.selectedRoles, role];
                console.log('🔹 Added role:', role);
            }
        } else {
            this.selectedRoles = this.selectedRoles.filter(r => r !== role);
            console.log('🔹 Removed role:', role);
        }
        
        console.log('🔹 Updated selectedRoles:', JSON.stringify(this.selectedRoles));
        this.updateGenerateButtonState();
        console.log('===== handleRoleCheckboxChange END =====');
    }

    handleSelectAllRoles() {
        console.log('===== handleSelectAllRoles START =====');
        this.roleCheckboxes = this.roleCheckboxes.map(role => ({ ...role, checked: true }));
        this.selectedRoles = this.roleCheckboxes.map(r => r.value);
        console.log('🔹 All roles selected:', this.selectedRoles.length);
        console.log('===== handleSelectAllRoles END =====');
    }

    handleClearAllRoles() {
        console.log('===== handleClearAllRoles START =====');
        this.roleCheckboxes = this.roleCheckboxes.map(role => ({ ...role, checked: false }));
        this.selectedRoles = [];
        console.log('🔹 All roles cleared');
        console.log('===== handleClearAllRoles END =====');
    }

    // ============ FACILITY HANDLING ============
    handleChangeforfacility(event) {
        console.log('===== handleChangeforfacility START =====');
        console.log('🔹 Event received:', event);
        console.log('🔹 Event detail value:', event.detail.value);
        
        const value = event.detail.value;
        let facilityIds = [];

        // Parse facility IDs from the input
        if (Array.isArray(value)) {
            console.log('🔹 Value is an array, filtering...');
            facilityIds = value.filter(v => {
                const isValid = typeof v === 'string' && v.length >= 15;
                console.log(`🔹 Checking ID: "${v}" (${typeof v}), length: ${v?.length || 0}, valid: ${isValid}`);
                return isValid;
            });
            console.log(`🔹 Filtered facility IDs from array: ${facilityIds.length} items`);
        } else if (value && value.length >= 15) {
            console.log('🔹 Value is a single string, treating as single facility ID');
            facilityIds = [value];
            console.log(`🔹 Single facility ID: ${value}`);
        } else {
            console.log('🔹 No valid facility IDs found in input');
        }

        console.log('🔹 Final facilityIds array:', JSON.stringify(facilityIds));

        if (facilityIds.length > 0) {
            console.log('✅ Facility IDs detected, proceeding with API calls...');
            
            // 🔥 FIX: Convert to plain array to avoid proxy issues
            const plainFacilityIds = [...facilityIds];
            this.selectedFacilityIds = plainFacilityIds;
            console.log('🔹 Updated selectedFacilityIds (plain array):', JSON.stringify(this.selectedFacilityIds));

            // ===== API 1: Get Staff by Facilities =====
            console.log('---- API 1: sendFacilityToApex ----');
            console.log('🔹 Calling sendFacilityToApex with facilityIds:', JSON.stringify(plainFacilityIds));
            
            sendFacilityToApex({ facilityIds: plainFacilityIds })
                .then(result => {
                    console.log('✅ sendFacilityToApex response received');
                    console.log('🔹 Response type:', typeof result);
                    console.log('🔹 Is array:', Array.isArray(result));
                    console.log('🔹 Response length:', result?.length || 0);
                    
                    if (!result || result.length === 0) {
                        console.warn('⚠️ No staff found for the selected facilities');
                        this.filteredStaffList1 = [];
                    } else {
                        console.log(`✅ Found ${result.length} staff members`);
                        const staffList = result.map((staff, index) => {
                            console.log(`🔹 Staff ${index + 1}:`, {
                                Id: staff.Id,
                                Name: staff.Display_Nickname__c || staff.Name || 'Unnamed'
                            });
                            return {
                                Id: staff.Id,
                                Display_Nickname__c: staff.Display_Nickname__c
                            };
                        });
                        this.filteredStaffList1 = staffList;
                        console.log('🔹 Mapped filteredStaffList1:', this.filteredStaffList1.length);
                    }
                })
                .catch(error => {
                    console.error('❌ sendFacilityToApex Error:', error);
                    if (error?.body) {
                        console.error('🔹 Error body:', error.body);
                    }
                    this.filteredStaffList1 = [];
                });

            // ===== API 2: Get Roles by Facilities =====
            console.log('---- API 2: getRolesByFacilities ----');
            console.log('🔹 Calling getRolesByFacilities with facilityIds:', JSON.stringify(plainFacilityIds));
            
            getRolesByFacilities({ facilityIds: plainFacilityIds })
                .then(result => {
                    console.log('✅ getRolesByFacilities response received');
                    console.log('🔹 Response length:', result?.length || 0);
                    
                    if (!result || result.length === 0) {
                        console.warn('⚠️ No roles found for the selected facilities');
                        this.roleCheckboxes = [];
                        return;
                    }
                    
                    console.log(`🔹 Found ${result.length} role assignments`);
                    
                    // Deduplicate roles
                    const uniqueRolesMap = new Map();
                    result.forEach((role, index) => {
                        const roleName = role.Role_Name__c;
                        console.log(`🔹 Processing role ${index + 1}:`, {
                            id: role.Id,
                            name: roleName
                        });
                        
                        if (!uniqueRolesMap.has(roleName)) {
                            console.log(`✅ Adding new unique role: ${roleName}`);
                            uniqueRolesMap.set(roleName, role);
                        } else {
                            console.log(`⏭️ Skipping duplicate role: ${roleName}`);
                        }
                    });
                    
                    const uniqueRoles = Array.from(uniqueRolesMap.values());
                    console.log(`🔹 Unique roles count: ${uniqueRoles.length}`);
                    console.log('🔹 Unique roles names:', uniqueRoles.map(r => r.Role_Name__c));
                    
                    const roleCheckboxes = uniqueRoles.map(r => ({
                        label: r.Role_Name__c,
                        value: r.Role_Name__c,
                        checked: false
                    }));
                    this.roleCheckboxes = roleCheckboxes;
                    console.log('🔹 Final roleCheckboxes:', this.roleCheckboxes.length);
                })
                .catch(error => {
                    console.error('❌ getRolesByFacilities Error:', error);
                    if (error?.body) {
                        console.error('🔹 Error body:', error.body);
                    }
                    this.roleCheckboxes = [];
                });

            // ===== API 3: Get Participants by Facilities =====
            console.log('---- API 3: sendFacilityToApexforParticipant ----');
            console.log('🔹 Calling sendFacilityToApexforParticipant with facilityIds:', JSON.stringify(plainFacilityIds));
            
            sendFacilityToApexforParticipant({ facilityIds: plainFacilityIds })
                .then(result => {
                    console.log('✅ sendFacilityToApexforParticipant response received');
                    console.log('🔹 Response length:', result?.length || 0);
                    
                    if (!result || result.length === 0) {
                        console.warn('⚠️ No participants found for the selected facilities');
                        this.participantsOptions = [];
                        return;
                    }
                    
                    console.log(`✅ Found ${result.length} participants`);
                    const participantOptions = result.map((participant, index) => {
                        console.log(`🔹 Participant ${index + 1}:`, {
                            Id: participant.Id,
                            Name: participant.Name
                        });
                        return {
                            label: participant.Name,
                            value: participant.Id
                        };
                    });
                    this.participantsOptions = participantOptions;
                    console.log('🔹 Final participantsOptions:', this.participantsOptions.length);
                })
                .catch(error => {
                    console.error('❌ sendFacilityToApexforParticipant Error:', error);
                    if (error?.body) {
                        console.error('🔹 Error body:', error.body);
                    }
                    this.participantsOptions = [];
                });

            console.log('===== handleChangeforfacility COMPLETE =====');
            
        } else {
            console.warn('⚠️ No valid facility IDs provided, skipping API calls');
            this.selectedFacilityIds = [];
            this.filteredStaffList1 = [];
            this.roleCheckboxes = [];
            this.participantsOptions = [];
            console.log('===== handleChangeforfacility END (no facilities) =====');
        }
    }

    handleChangeforparticipant(event) {
        console.log('===== handleChangeforparticipant START =====');
        const participantIds = event.detail.value;
        console.log('🔹 Participant IDs selected:', JSON.stringify(participantIds));
        
        this.selectedParticipantIds = Array.isArray(participantIds) ? [...participantIds] : [participantIds];
        console.log('🔹 Updated selectedParticipantIds:', JSON.stringify(this.selectedParticipantIds));
        console.log('===== handleChangeforparticipant END =====');
    }

    // ============ DATE RANGE HANDLING ============
    handleDateRangeChange(event) {
        console.log('===== handleDateRangeChange START =====');
        const value = event.detail.value;
        console.log('🔹 Selected date range:', value);
        
        this.selectedDateRange = value;
        const today = new Date();
        this.isCustomRange = false;
        this.startDate = '';
        this.endDate = '';

        switch (this.selectedDateRange) {
            case 'TODAY':
                this.startDate = this.formatDate(today);
                this.endDate = this.formatDate(today);
                console.log('🔹 Date range set to TODAY:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            case 'YESTERDAY': {
                const d = new Date(today);
                d.setDate(d.getDate() - 1);
                this.startDate = this.formatDate(d);
                this.endDate = this.formatDate(d);
                console.log('🔹 Date range set to YESTERDAY:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'LAST_7_DAYS': {
                const start = new Date(today);
                start.setDate(start.getDate() - 6);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(today);
                console.log('🔹 Date range set to LAST_7_DAYS:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'LAST_30_DAYS': {
                const start = new Date(today);
                start.setDate(start.getDate() - 29);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(today);
                console.log('🔹 Date range set to LAST_30_DAYS:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'THIS_MONTH': {
                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(end);
                console.log('🔹 Date range set to THIS_MONTH:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'LAST_MONTH': {
                const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const end = new Date(today.getFullYear(), today.getMonth(), 0);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(end);
                console.log('🔹 Date range set to LAST_MONTH:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'LAST_3_MONTHS': {
                const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(today);
                console.log('🔹 Date range set to LAST_3_MONTHS:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'LAST_6_MONTHS': {
                const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(today);
                console.log('🔹 Date range set to LAST_6_MONTHS:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'THIS_YEAR': {
                const start = new Date(today.getFullYear(), 0, 1);
                const end = new Date(today.getFullYear(), 11, 31);
                this.startDate = this.formatDate(start);
                this.endDate = this.formatDate(end);
                console.log('🔹 Date range set to THIS_YEAR:', {
                    start: this.startDate,
                    end: this.endDate
                });
                break;
            }
            case 'CUSTOM':
                this.isCustomRange = true;
                console.log('🔹 Date range set to CUSTOM');
                break;
            default:
                console.log('🔹 No matching date range option');
                break;
        }
        this.updateGenerateButtonState();
        console.log('===== handleDateRangeChange END =====');
    }

    handleFromDateChange(event) {
        console.log('===== handleFromDateChange START =====');
        const value = event.target.value;
        console.log('🔹 From date changed to:', value);
        this.startDate = value;
        this.updateGenerateButtonState();
        console.log('===== handleFromDateChange END =====');
    }

    handleToDateChange(event) {
        console.log('===== handleToDateChange START =====');
        const value = event.target.value;
        console.log('🔹 To date changed to:', value);
        this.endDate = value;
        this.updateGenerateButtonState();
        console.log('===== handleToDateChange END =====');
    }

    // ============ UTILITY METHODS ============
    formatDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        console.log('🔹 formatDate:', formatted);
        return formatted;
    }

    formatDateToDDMMYYYY(dateStr) {
        if (!dateStr) return '-';
        const [yyyy, mm, dd] = dateStr.split('-');
        const formatted = `${dd}/${mm}/${yyyy}`;
        console.log('🔹 formatDateToDDMMYYYY:', formatted);
        return formatted;
    }

    formatDateDDMMYYYY(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        const formatted = `${day}/${month}/${year}`;
        console.log('🔹 formatDateDDMMYYYY:', formatted);
        return formatted;
    }

    formatDateTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        let timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
        timePart = timePart.replace('am', 'AM').replace('pm', 'PM');
        const formatted = `${datePart}, ${timePart}`;
        console.log('🔹 formatDateTime:', formatted);
        return formatted;
    }

    getDateRangeLabel(value) {
        if (!value) return '—';
        const option = this.dateRangeOptions.find(opt => opt.value === value);
        const label = option ? option.label : value;
        console.log('🔹 getDateRangeLabel:', value, '=>', label);
        return label;
    }

    getReportTypeLabel(value) {
        if (!value) return '—';
        const option = this.reportList.find(opt => opt.value === value);
        const label = option ? option.label : value;
        console.log('🔹 getReportTypeLabel:', value, '=>', label);
        return label;
    }

    getReportFilePrefix() {
        let prefix;
        switch (this.reportTypeValue) {
            case 'REJECTED_SHIFT': prefix = 'Rejected_Shift_Report'; break;
            case 'REIMBURSEMENT': prefix = 'Reimbursement_Report'; break;
            case 'STAFF': prefix = 'Staff_Report'; break;
            case 'PARTICIPANT': prefix = 'Participant_Report'; break;
            case 'OVER_EFF': prefix = 'Under_Over_Efficiency_Report'; break;
            case 'Participant_Service_Delivery': prefix = 'Participant_Service_Report'; break;
            default: prefix = 'Shift_Report'; break;
        }
        console.log('🔹 getReportFilePrefix:', prefix);
        return prefix;
    }

    getValueByPath(obj, path) {
        if (!obj || !path) return '';
        if (this.reportTypeValue === 'OVER_EFF' && path === 'staffName') {
            return obj.name ?? '';
        }
        const value = path.split('.').reduce((acc, key) => {
            return acc && acc[key] !== undefined ? acc[key] : '';
        }, obj);
        console.log('🔹 getValueByPath:', path, '=>', value);
        return value;
    }

    updateGenerateButtonState() {
        console.log('===== updateGenerateButtonState START =====');
        console.log('🔹 isStaffBasedReport:', this.isStaffBasedReport);
        console.log('🔹 selectedEmploymentType:', this.selectedEmploymentType);
        console.log('🔹 selectedLocation:', this.selectedLocation);
        console.log('🔹 startDate:', this.startDate);
        console.log('🔹 endDate:', this.endDate);
        
        if (this.isStaffBasedReport) {
            const allFilled = this.selectedEmploymentType && this.selectedLocation && this.startDate && this.endDate;
            this.generatereport = !!allFilled;
            console.log('🔹 generatereport set to:', this.generatereport);
        } else {
            this.generatereport = false;
            console.log('🔹 generatereport set to false (not staff based)');
        }
        this.generatereport = false;
        console.log('===== updateGenerateButtonState END =====');
    }

    showToast(title, message, variant) {
        console.log('===== showToast START =====');
        console.log('🔹 Title:', title);
        console.log('🔹 Message:', message);
        console.log('🔹 Variant:', variant);
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
        console.log('===== showToast END =====');
    }

    // ============ NAVIGATION METHODS ============
    handlereportType(event) {
        console.log('===== handlereportType START =====');
        const value = event.detail.value;
        console.log('🔹 Report type selected:', value);
        
        this.isFavorite = false;
        this.favoriteText = 'Add to favorite';
        this.favoriteClass = '';
        this.applyReportType(event.detail.value);
        console.log('===== handlereportType END =====');
    }

    handleCancel() {
        console.log('===== handleCancel START =====');
        console.log('🔹 Canceling current report');
        this.reportTypeValue = '';
        this.resetAllFilters();
        console.log('===== handleCancel END =====');
    }

    handleBack() {
        console.log('===== handleBack START =====');
        console.log('🔹 Navigating back to menu');
        
        this.reportTypeValue = null;
        this.resetAllFilters();
        this.selectedStaffType = null;
        this.selectedStaffId = null;
        this.selectedStaffName = '';
        this.selectedFacilityIds = [];
        this.selectedFacilityId = null;
        this.startDate = '';
        this.endDate = '';
        this.selectedDateRange = '';
        this.selectedRoles = [];
        if (this.roleCheckboxes) {
            this.roleCheckboxes = this.roleCheckboxes.map(role => ({ ...role, checked: false }));
        }
        this.isReportContainer = true;
        this.isStaffBasedReport = false;
        this.isRejectedShiftReport = false;
        this.isStaffBasedReport1 = false;
        this.reimbursementflag = false;
        this.participantflag = false;
        this.staffListflag = false;
        this.isunderandOverReport = false;
        this.participantServiceflag = false;
        this.isBuilderView = true;
        this.isResultView = false;
        this.isStaffBasedReportshowModal = false;
        this.sections = [];
        this.selectedTemplateId = null;
        this.newTemplateName = '';
        this.filteredRecords = [];
        this.recordsToDisplay = [];
        this.rejectedFilteredRecords = [];
        this.rejectedRecordsToDisplay = [];
        this.staffAllRecords = [];
        this.staffRecordsToDisplay = [];
        this.participantAllRecords = [];
        this.participantRecordsToDisplay = [];
        this.reimbursementAllRecords = [];
        this.reimbursementRecordsToDisplay = [];
        this.underOverAllRecords = [];
        this.underOverRecordsToDisplay = [];
        this.participantServiceAllRecords = [];
        this.participantServiceRecordsToDisplay = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.pageNumber = 1;
        this.bDisableFirst = true;
        this.bDisableLast = true;
        this.rejectedPageNumber = 1;
        this.rejectedTotalRecords = 0;
        this.rejectedTotalPages = 0;
        this.rejectedDisableFirst = true;
        this.rejectedDisableLast = true;
        this.staffPageNumber = 1;
        this.staffTotalRecords = 0;
        this.staffTotalPages = 0;
        this.staffDisableFirst = true;
        this.staffDisableLast = true;
        this.participantPageNumber = 1;
        this.participantTotalRecords = 0;
        this.participantTotalPages = 0;
        this.participantDisableFirst = true;
        this.participantDisableLast = true;
        this.reimbursementPageNumber = 1;
        this.reimbursementTotalRecords = 0;
        this.reimbursementTotalPages = 0;
        this.reimbursementDisableFirst = true;
        this.reimbursementDisableLast = true;
        this.underOverPageNumber = 1;
        this.underOverTotalRecords = 0;
        this.underOverTotalPages = 0;
        this.underOverDisableFirst = true;
        this.underOverDisableLast = true;
        this.participantServicePageNumber = 1;
        this.participantServicePageSize = 10;
        this.participantServiceTotalRecords = 0;
        this.participantServiceTotalPages = 0;
        this.participantServiceDisableFirst = true;
        this.participantServiceDisableLast = true;
        this.isFavorite = false;
        this.favoriteText = 'Add to favorite';
        this.favoriteClass = '';
        this.selectedFavoriteId = null;
        this.favoritesflag = true;
        this.generatereport = true;
        this.rejectedflagFliters = false;
        
        console.log('✅ Back navigation complete');
        console.log('===== handleBack END =====');
    }

    handleBackToBuilder() {
        console.log('===== handleBackToBuilder START =====');
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        
        if (this.reportTypeValue === 'SHIFT') {
            console.log('🔹 Navigating back from SHIFT report');
            this.isReportContainer = true;
            this.isStaffBasedReport1 = false;
            this.filteredRecords = [];
            this.recordsToDisplay = [];
        } else if (this.reportTypeValue === 'REJECTED_SHIFT') {
            console.log('🔹 Navigating back from REJECTED_SHIFT report');
            this.isReportContainer = true;
            this.isRejectedShiftReport = false;
            this.rejectedFilteredRecords = [];
            this.rejectedRecordsToDisplay = [];
        } else if (this.reportTypeValue === 'STAFF') {
            console.log('🔹 Navigating back from STAFF report');
            this.isReportContainer = true;
            this.isStaffBasedReport = true;
            this.staffListflag = true;
            this.staffAllRecords = [];
            this.staffRecordsToDisplay = [];
        } else if (this.reportTypeValue === 'REIMBURSEMENT') {
            console.log('🔹 Navigating back from REIMBURSEMENT report');
            this.isReportContainer = true;
            this.reimbursementflag = true;
            this.reimbursementAllRecords = [];
            this.reimbursementRecordsToDisplay = [];
        } else if (this.reportTypeValue === 'PARTICIPANT') {
            console.log('🔹 Navigating back from PARTICIPANT report');
            this.isReportContainer = true;
            this.participantflag = true;
            this.participantAllRecords = [];
            this.participantRecordsToDisplay = [];
        } else if (this.reportTypeValue === 'OVER_EFF') {
            console.log('🔹 Navigating back from OVER_EFF report');
            this.isReportContainer = true;
            this.isunderandOverReport = true;
            this.underOverAllRecords = [];
            this.underOverRecordsToDisplay = [];
        } else if (this.reportTypeValue === 'Participant_Service_Delivery') {
            console.log('🔹 Navigating back from Participant_Service_Delivery report');
            this.isReportContainer = true;
            this.participantServiceflag = true;
            this.participantServiceAllRecords = [];
            this.participantServiceRecordsToDisplay = [];
        }
        this.selectedRoles = [];
        console.log('===== handleBackToBuilder END =====');
    }

    handleBack1() {
        console.log('===== handleBack1 START =====');
        this.handleBackToBuilder();
        this.handleBack();
        this.backbutton = false;
        console.log('===== handleBack1 END =====');
    }

    handlebuildYourReport() {
        console.log('===== handlebuildYourReport START =====');
        this.favoritesflag = false;
        console.log('🔹 favoritesflag set to false');
        console.log('===== handlebuildYourReport END =====');
    }

    handleBackbuildYourReport() {
        console.log('===== handleBackbuildYourReport START =====');
        this.isExpandedView = false;
        console.log('🔹 isExpandedView set to false');
        console.log('===== handleBackbuildYourReport END =====');
    }

    ensureSectionsExist() {
        console.log('===== ensureSectionsExist START =====');
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        console.log('🔹 sections length:', this.sections?.length || 0);
        
        if (!this.sections || this.sections.length === 0) {
            console.log(`🔹 Building sections for: ${this.reportTypeValue}`);
            if (this.reportTypeValue === 'PARTICIPANT') {
                this.buildSectionsForParticipantReport();
            } else if (this.reportTypeValue === 'STAFF') {
                this.buildSectionsForStaffReport();
            } else if (this.reportTypeValue === 'OVER_EFF') {
                this.buildSectionsForUnderOverReport();
            } else {
                this.buildSectionsForReport();
            }
            console.log('✅ Sections built:', this.sections.length);
        } else {
            console.log('🔹 Sections already exist, skipping build');
        }
        console.log('===== ensureSectionsExist END =====');
    }

    // ============ PAGINATION ============
    paginationHelper() {
        console.log('===== paginationHelper START =====');
        console.log('🔹 filteredRecords length:', this.filteredRecords?.length || 0);
        console.log('🔹 pageNumber:', this.pageNumber);
        console.log('🔹 pageSize:', this.pageSize);
        
        const state = this.tableSortState.shiftReport;
        let dataList = Array.isArray(this.filteredRecords) ? [...this.filteredRecords] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        this.totalRecords = dataList.length;
        this.paginationVisible = this.totalRecords > 0;
        this.totalPages = this.pageSize > 0 ? Math.ceil(this.totalRecords / this.pageSize) : 1;

        if (this.pageNumber < 1) this.pageNumber = 1;
        else if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

        const startIdx = (this.pageNumber - 1) * this.pageSize;
        const endIdx = this.pageNumber * this.pageSize;
        this.recordsToDisplay = dataList.slice(startIdx, endIdx);
        this.updatePaginationButtons();
        
        console.log('✅ Pagination updated:', {
            totalRecords: this.totalRecords,
            totalPages: this.totalPages,
            displayedCount: this.recordsToDisplay.length
        });
        console.log('===== paginationHelper END =====');
    }

    updatePaginationButtons() {
        this.bDisableFirst = this.pageNumber <= 1;
        this.bDisableLast = this.pageNumber >= this.totalPages;
        console.log('🔹 Pagination buttons updated:', {
            firstDisabled: this.bDisableFirst,
            lastDisabled: this.bDisableLast
        });
    }

    handleRecordsPerPage(event) {
        console.log('===== handleRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Records per page changed to:', value);
        this.pageSize = value;
        this.pageNumber = 1;
        this.paginationHelper();
        console.log('===== handleRecordsPerPage END =====');
    }

    firstPage() { 
        console.log('🔹 First page clicked');
        if (this.pageNumber > 1) { 
            this.pageNumber = 1; 
            this.paginationHelper(); 
        } 
    }
    
    previousPage() { 
        console.log('🔹 Previous page clicked');
        if (this.pageNumber > 1) { 
            this.pageNumber--; 
            this.paginationHelper(); 
        } 
    }
    
    nextPage() { 
        console.log('🔹 Next page clicked');
        if (this.pageNumber < this.totalPages) { 
            this.pageNumber++; 
            this.paginationHelper(); 
        } 
    }
    
    lastPage() { 
        console.log('🔹 Last page clicked');
        if (this.pageNumber < this.totalPages) { 
            this.pageNumber = this.totalPages; 
            this.paginationHelper(); 
        } 
    }

    // ============ REJECTED SHIFT PAGINATION ============
    rejectedPaginationHelper() {
        console.log('===== rejectedPaginationHelper START =====');
        console.log('🔹 rejectedFilteredRecords length:', this.rejectedFilteredRecords?.length || 0);
        console.log('🔹 rejectedPageNumber:', this.rejectedPageNumber);
        console.log('🔹 rejectedPageSize:', this.rejectedPageSize);
        
        const state = this.tableSortState.rejectedShifts;
        let dataList = Array.isArray(this.rejectedFilteredRecords) ? [...this.rejectedFilteredRecords] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        this.rejectedTotalRecords = dataList.length;
        this.rejectedPaginationVisible = this.rejectedTotalRecords > 0;
        this.rejectedTotalPages = this.rejectedPageSize > 0 ? Math.ceil(this.rejectedTotalRecords / this.rejectedPageSize) : 1;

        if (this.rejectedPageNumber < 1) this.rejectedPageNumber = 1;
        else if (this.rejectedPageNumber > this.rejectedTotalPages) this.rejectedPageNumber = this.rejectedTotalPages;

        const startIdx = (this.rejectedPageNumber - 1) * this.rejectedPageSize;
        const endIdx = this.rejectedPageNumber * this.rejectedPageSize;
        this.rejectedRecordsToDisplay = dataList.slice(startIdx, endIdx);
        this.updateRejectedPaginationButtons();
        
        console.log('✅ Rejected pagination updated:', {
            totalRecords: this.rejectedTotalRecords,
            totalPages: this.rejectedTotalPages,
            displayedCount: this.rejectedRecordsToDisplay.length
        });
        console.log('===== rejectedPaginationHelper END =====');
    }

    updateRejectedPaginationButtons() {
        this.rejectedDisableFirst = this.rejectedPageNumber <= 1;
        this.rejectedDisableLast = this.rejectedPageNumber >= this.rejectedTotalPages;
        console.log('🔹 Rejected pagination buttons updated:', {
            firstDisabled: this.rejectedDisableFirst,
            lastDisabled: this.rejectedDisableLast
        });
    }

    handleRejectedRecordsPerPage(event) {
        console.log('===== handleRejectedRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Rejected records per page changed to:', value);
        this.rejectedPageSize = value;
        this.rejectedPageNumber = 1;
        this.rejectedPaginationHelper();
        console.log('===== handleRejectedRecordsPerPage END =====');
    }

    rejectedFirstPage() { 
        console.log('🔹 Rejected first page clicked');
        if (this.rejectedPageNumber > 1) { 
            this.rejectedPageNumber = 1; 
            this.rejectedPaginationHelper(); 
        } 
    }
    
    rejectedPreviousPage() { 
        console.log('🔹 Rejected previous page clicked');
        if (this.rejectedPageNumber > 1) { 
            this.rejectedPageNumber--; 
            this.rejectedPaginationHelper(); 
        } 
    }
    
    rejectedNextPage() { 
        console.log('🔹 Rejected next page clicked');
        if (this.rejectedPageNumber < this.rejectedTotalPages) { 
            this.rejectedPageNumber++; 
            this.rejectedPaginationHelper(); 
        } 
    }
    
    rejectedLastPage() { 
        console.log('🔹 Rejected last page clicked');
        if (this.rejectedPageNumber < this.rejectedTotalPages) { 
            this.rejectedPageNumber = this.rejectedTotalPages; 
            this.rejectedPaginationHelper(); 
        } 
    }

    // ============ REIMBURSEMENT PAGINATION ============
    reimbursementPaginationHelper() {
        console.log('===== reimbursementPaginationHelper START =====');
        console.log('🔹 reimbursementAllRecords length:', this.reimbursementAllRecords?.length || 0);
        console.log('🔹 reimbursementPageNumber:', this.reimbursementPageNumber);
        console.log('🔹 reimbursementPageSize:', this.reimbursementPageSize);
        
        const state = this.tableSortState.reimbursement;
        let dataList = Array.isArray(this.reimbursementAllRecords) ? [...this.reimbursementAllRecords] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        this.reimbursementTotalRecords = dataList.length;
        this.reimbursementTotalPages = this.reimbursementPageSize > 0 ? Math.ceil(this.reimbursementTotalRecords / this.reimbursementPageSize) : 1;

        if (this.reimbursementPageNumber < 1) this.reimbursementPageNumber = 1;
        else if (this.reimbursementPageNumber > this.reimbursementTotalPages) this.reimbursementPageNumber = this.reimbursementTotalPages;

        const startIdx = (this.reimbursementPageNumber - 1) * this.reimbursementPageSize;
        const endIdx = this.reimbursementPageNumber * this.reimbursementPageSize;
        this.reimbursementRecordsToDisplay = dataList.slice(startIdx, endIdx);
        this.updateReimbursementPaginationButtons();
        
        console.log('✅ Reimbursement pagination updated:', {
            totalRecords: this.reimbursementTotalRecords,
            totalPages: this.reimbursementTotalPages,
            displayedCount: this.reimbursementRecordsToDisplay.length
        });
        console.log('===== reimbursementPaginationHelper END =====');
    }

    updateReimbursementPaginationButtons() {
        this.reimbursementDisableFirst = this.reimbursementPageNumber <= 1;
        this.reimbursementDisableLast = this.reimbursementPageNumber >= this.reimbursementTotalPages;
        console.log('🔹 Reimbursement pagination buttons updated:', {
            firstDisabled: this.reimbursementDisableFirst,
            lastDisabled: this.reimbursementDisableLast
        });
    }

    handleReimbursementRecordsPerPage(event) {
        console.log('===== handleReimbursementRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Reimbursement records per page changed to:', value);
        this.reimbursementPageSize = value;
        this.reimbursementPageNumber = 1;
        this.reimbursementPaginationHelper();
        console.log('===== handleReimbursementRecordsPerPage END =====');
    }

    reimbursementFirstPage() { 
        console.log('🔹 Reimbursement first page clicked');
        if (this.reimbursementPageNumber > 1) { 
            this.reimbursementPageNumber = 1; 
            this.reimbursementPaginationHelper(); 
        } 
    }
    
    reimbursementPreviousPage() { 
        console.log('🔹 Reimbursement previous page clicked');
        if (this.reimbursementPageNumber > 1) { 
            this.reimbursementPageNumber--; 
            this.reimbursementPaginationHelper(); 
        } 
    }
    
    reimbursementNextPage() { 
        console.log('🔹 Reimbursement next page clicked');
        if (this.reimbursementPageNumber < this.reimbursementTotalPages) { 
            this.reimbursementPageNumber++; 
            this.reimbursementPaginationHelper(); 
        } 
    }
    
    reimbursementLastPage() { 
        console.log('🔹 Reimbursement last page clicked');
        if (this.reimbursementPageNumber < this.reimbursementTotalPages) { 
            this.reimbursementPageNumber = this.reimbursementTotalPages; 
            this.reimbursementPaginationHelper(); 
        } 
    }

    // ============ STAFF PAGINATION ============
    staffPaginationHelper() {
        console.log('===== staffPaginationHelper START =====');
        console.log('🔹 staffAllRecords length:', this.staffAllRecords?.length || 0);
        console.log('🔹 staffPageNumber:', this.staffPageNumber);
        console.log('🔹 staffPageSize:', this.staffPageSize);
        
        const state = this.tableSortState.staff;
        let dataList = Array.isArray(this.staffAllRecords) ? [...this.staffAllRecords] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        this.staffTotalRecords = dataList.length;
        this.staffTotalPages = this.staffPageSize > 0 ? Math.ceil(this.staffTotalRecords / this.staffPageSize) : 1;

        if (this.staffPageNumber < 1) this.staffPageNumber = 1;
        else if (this.staffPageNumber > this.staffTotalPages) this.staffPageNumber = this.staffTotalPages;

        const startIdx = (this.staffPageNumber - 1) * this.staffPageSize;
        const endIdx = this.staffPageNumber * this.staffPageSize;
        this.staffRecordsToDisplay = dataList.slice(startIdx, endIdx);
        this.updateStaffPaginationButtons();
        
        console.log('✅ Staff pagination updated:', {
            totalRecords: this.staffTotalRecords,
            totalPages: this.staffTotalPages,
            displayedCount: this.staffRecordsToDisplay.length
        });
        console.log('===== staffPaginationHelper END =====');
    }

    updateStaffPaginationButtons() {
        this.staffDisableFirst = this.staffPageNumber <= 1;
        this.staffDisableLast = this.staffPageNumber >= this.staffTotalPages;
        console.log('🔹 Staff pagination buttons updated:', {
            firstDisabled: this.staffDisableFirst,
            lastDisabled: this.staffDisableLast
        });
    }

    handleStaffRecordsPerPage(event) {
        console.log('===== handleStaffRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Staff records per page changed to:', value);
        this.staffPageSize = value;
        this.staffPageNumber = 1;
        this.staffPaginationHelper();
        console.log('===== handleStaffRecordsPerPage END =====');
    }

    staffFirstPage() { 
        console.log('🔹 Staff first page clicked');
        if (this.staffPageNumber > 1) { 
            this.staffPageNumber = 1; 
            this.staffPaginationHelper(); 
        } 
    }
    
    staffPreviousPage() { 
        console.log('🔹 Staff previous page clicked');
        if (this.staffPageNumber > 1) { 
            this.staffPageNumber--; 
            this.staffPaginationHelper(); 
        } 
    }
    
    staffNextPage() { 
        console.log('🔹 Staff next page clicked');
        if (this.staffPageNumber < this.staffTotalPages) { 
            this.staffPageNumber++; 
            this.staffPaginationHelper(); 
        } 
    }
    
    staffLastPage() { 
        console.log('🔹 Staff last page clicked');
        if (this.staffPageNumber < this.staffTotalPages) { 
            this.staffPageNumber = this.staffTotalPages; 
            this.staffPaginationHelper(); 
        } 
    }

    // ============ PARTICIPANT PAGINATION ============
    participantPaginationHelper() {
        console.log('===== participantPaginationHelper START =====');
        console.log('🔹 participantAllRecords length:', this.participantAllRecords?.length || 0);
        console.log('🔹 participantPageNumber:', this.participantPageNumber);
        console.log('🔹 participantPageSize:', this.participantPageSize);
        
        const state = this.tableSortState.participants;
        let dataList = Array.isArray(this.participantAllRecords) ? [...this.participantAllRecords] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        this.participantTotalRecords = dataList.length;
        this.participantTotalPages = this.participantPageSize > 0 ? Math.ceil(this.participantTotalRecords / this.participantPageSize) : 1;

        if (this.participantPageNumber < 1) this.participantPageNumber = 1;
        else if (this.participantPageNumber > this.participantTotalPages) this.participantPageNumber = this.participantTotalPages;

        const startIdx = (this.participantPageNumber - 1) * this.participantPageSize;
        const endIdx = this.participantPageNumber * this.participantPageSize;
        this.participantRecordsToDisplay = dataList.slice(startIdx, endIdx);
        this.updateParticipantPaginationButtons();
        
        console.log('✅ Participant pagination updated:', {
            totalRecords: this.participantTotalRecords,
            totalPages: this.participantTotalPages,
            displayedCount: this.participantRecordsToDisplay.length
        });
        console.log('===== participantPaginationHelper END =====');
    }

    updateParticipantPaginationButtons() {
        this.participantDisableFirst = this.participantPageNumber <= 1;
        this.participantDisableLast = this.participantPageNumber >= this.participantTotalPages;
        console.log('🔹 Participant pagination buttons updated:', {
            firstDisabled: this.participantDisableFirst,
            lastDisabled: this.participantDisableLast
        });
    }

    handleParticipantRecordsPerPage(event) {
        console.log('===== handleParticipantRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Participant records per page changed to:', value);
        this.participantPageSize = value;
        this.participantPageNumber = 1;
        this.participantPaginationHelper();
        console.log('===== handleParticipantRecordsPerPage END =====');
    }

    participantFirstPage() { 
        console.log('🔹 Participant first page clicked');
        if (this.participantPageNumber > 1) { 
            this.participantPageNumber = 1; 
            this.participantPaginationHelper(); 
        } 
    }
    
    participantPreviousPage() { 
        console.log('🔹 Participant previous page clicked');
        if (this.participantPageNumber > 1) { 
            this.participantPageNumber--; 
            this.participantPaginationHelper(); 
        } 
    }
    
    participantNextPage() { 
        console.log('🔹 Participant next page clicked');
        if (this.participantPageNumber < this.participantTotalPages) { 
            this.participantPageNumber++; 
            this.participantPaginationHelper(); 
        } 
    }
    
    participantLastPage() { 
        console.log('🔹 Participant last page clicked');
        if (this.participantPageNumber < this.participantTotalPages) { 
            this.participantPageNumber = this.participantTotalPages; 
            this.participantPaginationHelper(); 
        } 
    }

    // ============ PARTICIPANT SERVICE PAGINATION ============
    updateParticipantServicePagination() {
        console.log('===== updateParticipantServicePagination START =====');
        console.log('🔹 participantServiceAllRecords length:', this.participantServiceAllRecords?.length || 0);
        console.log('🔹 participantServicePageNumber:', this.participantServicePageNumber);
        console.log('🔹 participantServicePageSize:', this.participantServicePageSize);
        
        const state = this.tableSortState.participantServices;
        let dataList = Array.isArray(this.participantServiceAllRecords) ? [...this.participantServiceAllRecords] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        const start = (this.participantServicePageNumber - 1) * this.participantServicePageSize;
        const end = start + this.participantServicePageSize;
        this.participantServiceRecordsToDisplay = dataList.slice(start, end);
        this.participantServiceTotalPages = Math.ceil(this.participantServiceTotalRecords / this.participantServicePageSize) || 1;
        this.participantServiceDisableFirst = this.participantServicePageNumber <= 1;
        this.participantServiceDisableLast = this.participantServicePageNumber >= this.participantServiceTotalPages;
        
        console.log('✅ Participant service pagination updated:', {
            totalRecords: this.participantServiceTotalRecords,
            totalPages: this.participantServiceTotalPages,
            displayedCount: this.participantServiceRecordsToDisplay.length
        });
        console.log('===== updateParticipantServicePagination END =====');
    }

    handleParticipantServiceRecordsPerPage(event) {
        console.log('===== handleParticipantServiceRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Participant service records per page changed to:', value);
        this.participantServicePageSize = value;
        this.participantServicePageNumber = 1;
        this.updateParticipantServicePagination();
        console.log('===== handleParticipantServiceRecordsPerPage END =====');
    }

    participantServiceFirstPage() { 
        console.log('🔹 Participant service first page clicked');
        if (this.participantServicePageNumber > 1) { 
            this.participantServicePageNumber = 1; 
            this.updateParticipantServicePagination(); 
        } 
    }
    
    participantServicePreviousPage() { 
        console.log('🔹 Participant service previous page clicked');
        if (this.participantServicePageNumber > 1) { 
            this.participantServicePageNumber--; 
            this.updateParticipantServicePagination(); 
        } 
    }
    
    participantServiceNextPage() { 
        console.log('🔹 Participant service next page clicked');
        if (this.participantServicePageNumber < this.participantServiceTotalPages) { 
            this.participantServicePageNumber++; 
            this.updateParticipantServicePagination(); 
        } 
    }
    
    participantServiceLastPage() { 
        console.log('🔹 Participant service last page clicked');
        if (this.participantServicePageNumber < this.participantServiceTotalPages) { 
            this.participantServicePageNumber = this.participantServiceTotalPages; 
            this.updateParticipantServicePagination(); 
        } 
    }

    // ============ UNDER/OVER PAGINATION ============
    underOverPaginationHelper() {
        console.log('===== underOverPaginationHelper START =====');
        console.log('🔹 underOverAllRecords length:', this.underOverAllRecords?.length || 0);
        console.log('🔹 underOverPageNumber:', this.underOverPageNumber);
        console.log('🔹 underOverPageSize:', this.underOverPageSize);
        
        const state = this.tableSortState.underOver;
        let dataList = Array.isArray(this.underOverAllRecords) ? [...this.underOverAllRecords] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        this.underOverTotalRecords = dataList.length;
        this.underOverTotalPages = this.underOverPageSize > 0 ? Math.ceil(this.underOverTotalRecords / this.underOverPageSize) : 1;

        if (this.underOverPageNumber < 1) this.underOverPageNumber = 1;
        else if (this.underOverPageNumber > this.underOverTotalPages) this.underOverPageNumber = this.underOverTotalPages;

        const startIdx = (this.underOverPageNumber - 1) * this.underOverPageSize;
        const endIdx = this.underOverPageNumber * this.underOverPageSize;
        this.underOverRecordsToDisplay = dataList.slice(startIdx, endIdx);
        this.updateUnderOverPaginationButtons();
        
        console.log('✅ Under/Over pagination updated:', {
            totalRecords: this.underOverTotalRecords,
            totalPages: this.underOverTotalPages,
            displayedCount: this.underOverRecordsToDisplay.length
        });
        console.log('===== underOverPaginationHelper END =====');
    }

    updateUnderOverPaginationButtons() {
        this.underOverDisableFirst = this.underOverPageNumber <= 1;
        this.underOverDisableLast = this.underOverPageNumber >= this.underOverTotalPages;
        console.log('🔹 Under/Over pagination buttons updated:', {
            firstDisabled: this.underOverDisableFirst,
            lastDisabled: this.underOverDisableLast
        });
    }

    handleUnderOverRecordsPerPage(event) {
        console.log('===== handleUnderOverRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Under/Over records per page changed to:', value);
        this.underOverPageSize = value;
        this.underOverPageNumber = 1;
        this.underOverPaginationHelper();
        console.log('===== handleUnderOverRecordsPerPage END =====');
    }

    underOverFirstPage() { 
        console.log('🔹 Under/Over first page clicked');
        if (this.underOverPageNumber > 1) { 
            this.underOverPageNumber = 1; 
            this.underOverPaginationHelper(); 
        } 
    }
    
    underOverPreviousPage() { 
        console.log('🔹 Under/Over previous page clicked');
        if (this.underOverPageNumber > 1) { 
            this.underOverPageNumber--; 
            this.underOverPaginationHelper(); 
        } 
    }
    
    underOverNextPage() { 
        console.log('🔹 Under/Over next page clicked');
        if (this.underOverPageNumber < this.underOverTotalPages) { 
            this.underOverPageNumber++; 
            this.underOverPaginationHelper(); 
        } 
    }
    
    underOverLastPage() { 
        console.log('🔹 Under/Over last page clicked');
        if (this.underOverPageNumber < this.underOverTotalPages) { 
            this.underOverPageNumber = this.underOverTotalPages; 
            this.underOverPaginationHelper(); 
        } 
    }

    handleGeneratedPageSizeChange(event) {
        console.log('===== handleGeneratedPageSizeChange START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Generated page size changed to:', value);
        this.generatedPageSize = value;
        this.generatedPageNumber = 1;
        this.updateGeneratedReportsPagination();
        console.log('===== handleGeneratedPageSizeChange END =====');
    }

    firstGeneratedPage() { 
        console.log('🔹 Generated first page clicked');
        this.generatedPageNumber = 1; 
        this.updateGeneratedReportsPagination(); 
    }
    
    previousGeneratedPage() { 
        console.log('🔹 Generated previous page clicked');
        if (this.generatedPageNumber > 1) { 
            this.generatedPageNumber--; 
            this.updateGeneratedReportsPagination(); 
        } 
    }
    
    nextGeneratedPage() { 
        console.log('🔹 Generated next page clicked');
        if (this.generatedPageNumber < this.generatedTotalPages) { 
            this.generatedPageNumber++; 
            this.updateGeneratedReportsPagination(); 
        } 
    }
    
    lastGeneratedPage() { 
        console.log('🔹 Generated last page clicked');
        this.generatedPageNumber = this.generatedTotalPages; 
        this.updateGeneratedReportsPagination(); 
    }

    // ============ EXPORT LOG CREATION ============
    createExportLog(exportType, reportType) {
        console.log('===== createExportLog START =====');
        console.log('🔹 exportType:', exportType);
        console.log('🔹 reportType:', reportType);
        console.log('🔹 selectedFacilityIdforgenerated:', this.selectedFacilityIdforgenerated);
        
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
            selectedParticipantId: this.selectedParticipantIds,
            reportType: this.reportTypeValue,
            reportStatus: this.selectedstaffStatus,
            reportrembursmentStatus: this.statusValue,
            selectedTemplateId: this.selectedTemplateId,
            selectedTemplateLabel: this.selectedTemplateLabel,
            columnOrder: this.columnOrder,
            columnKeys: this.columnKeys
        };

        const filtersJson = JSON.stringify(filtersPayload);
        const filterKey = btoa(filtersJson);
        console.log('🔹 filterKey generated:', filterKey.substring(0, 20) + '...');
        
        console.log('🔹 Calling createShiftReportLog with params:', {
            startDate: this.startDate,
            endDate: this.endDate,
            facilityId: this.selectedFacilityIdforgenerated,
            exportType: exportType,
            reportType: reportType,
            selectedDateRange: this.selectedDateRange
        });

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
            console.log('✅ Export log created:', result);
            this.exportLogId = result;
            console.log('🔹 exportLogId set to:', this.exportLogId);
            
            setTimeout(() => {
                console.log('🔹 Refreshing generated reports after 3 seconds...');
                this.initializeGeneratedReports();
            }, 3000);
        })
        .catch(error => {
            console.error('❌ Export Log Creation Failed:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack,
                body: error.body
            });
        });
        console.log('===== createExportLog END =====');
    }

    // ============ FAVORITE TOGGLE ============
    handleToggleFavorite() {
        console.log('===== handleToggleFavorite START =====');
        console.log('🔹 Current isFavorite:', this.isFavorite);
        
        this.isFavorite = !this.isFavorite;
        console.log('🔹 New isFavorite:', this.isFavorite);

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
        console.log('🔹 filterKey generated:', filterKey.substring(0, 20) + '...');
        console.log('🔹 exportLogId:', this.exportLogId);

        if (this.isFavorite) {
            console.log('🔹 Adding to favorites');
            this.favoriteText = 'Remove from favorite';
            this.favoriteClass = 'favorite-active';
            updateShiftReportLog({
                exportId: this.exportLogId,
                isCompleted: true
            })
            .then(() => {
                console.log('✅ Added to favorites successfully');
                this.showToast('Success', 'Added to favorites', 'success');
                this.initializeReports();
            })
            .catch(error => {
                console.error('❌ Error adding to favorites:', error);
            });
        } else {
            console.log('🔹 Removing from favorites');
            this.favoriteText = 'Add to favorite';
            this.favoriteClass = '';
            updateShiftReportLog({
                exportId: this.exportLogId,
                isCompleted: false
            })
            .then(() => {
                console.log('✅ Removed from favorites successfully');
                this.showToast('Success', 'Removed from favorites', 'success');
                this.initializeReports();
            })
            .catch(error => {
                console.error('❌ Error removing from favorites:', error);
            });
        }
        console.log('===== handleToggleFavorite END =====');
    }

    handleToggleFavoriteforGenerated(event) {
        console.log('===== handleToggleFavoriteforGenerated START =====');
        const id = event.currentTarget.dataset.id;
        console.log('🔹 Report ID:', id);
        
        const row = this.generatedReports.find(r => r.id === id);
        if (!row) {
            console.warn('⚠️ Report not found with ID:', id);
            console.log('===== handleToggleFavoriteforGenerated END (not found) =====');
            return;
        }

        const newValue = !row.isFavorite;
        console.log('🔹 New favorite value:', newValue);
        
        updateShiftReportLog({
            exportId: id,
            isCompleted: newValue
        })
        .then(() => {
            console.log('✅ Favorite updated successfully');
            row.isFavorite = newValue;
            this.generatedReports = [...this.generatedReports];
            this.initializeReports();
            this.initializeGeneratedReports();
            this.showToast('Success', newValue ? 'Added to favorites' : 'Removed from favorites', 'success');
        })
        .catch(error => {
            console.error('❌ Favorite update failed:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
        });
        console.log('===== handleToggleFavoriteforGenerated END =====');
    }

    handleKidStarClick(event) {
        console.log('===== handleKidStarClick START =====');
        event.stopPropagation();
        const favoriteId = event.currentTarget.dataset.id;
        console.log('🔹 Favorite ID:', favoriteId);

        updateShiftReportLog({
            exportId: favoriteId,
            isCompleted: false
        })
        .then(() => {
            console.log('✅ Favorite removed successfully');
            this.initializeReports();
            this.initializeGeneratedReports();
            this.showToast('Success', 'Removed from favorites', 'success');
        })
        .catch(error => {
            console.error('❌ Favorite update failed:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
        });
        console.log('===== handleKidStarClick END =====');
    }

    // ============ FAVORITE CLICK ============
    handleFavoriteClick(event) {
        console.log('===== handleFavoriteClick START =====');
        const reportId = event.currentTarget.dataset.id;
        console.log('🔹 Report ID:', reportId);
        
        if (!reportId) {
            console.warn('⚠️ No report ID provided');
            console.log('===== handleFavoriteClick END (no ID) =====');
            return;
        }

        const selectedReport = this.favoriteReports.find(rep => rep.id === reportId);
        if (!selectedReport) {
            console.warn('⚠️ Report not found with ID:', reportId);
            console.log('===== handleFavoriteClick END (not found) =====');
            return;
        }
        console.log('🔹 Selected report:', selectedReport);

        this.selectedFavoriteId = selectedReport.id;
        const filters = selectedReport.filters || {};
        console.log('🔹 Filters from selected report:', JSON.stringify(filters));

        this.applyReportType(selectedReport.type);
        this.favoritesflag = false;

        this.selectedRoles = Array.isArray(filters.roles) ? filters.roles : (filters.roles ? [filters.roles] : []);
        this.isAllStaff = filters.isAllStaff || false;
        this.isIndividualStaff = filters.isIndividualStaff || false;
        this.selectedEmploymentType = filters.employmentType || null;
        this.selectedLocation = filters.location || null;
        this.startDate = filters.startDate || null;
        this.endDate = filters.endDate || null;
        this.selectedParticipantIds = filters.selectedParticipantId || '';
        this.selectedStaffName = filters.staffName || null;
        this.selectedStaffId = filters.staffId || null;
        this.selectedstaffStatus = filters.reportStatus || null;
        this.selectedDateRange = filters.selectedDateRange || null;
        this.statusValue = filters.reportrembursmentStatus || null;
        this.reportTypeValue = filters.reportType || null;
        console.log('🔹 Applied filters:', {
            roles: this.selectedRoles,
            isAllStaff: this.isAllStaff,
            isIndividualStaff: this.isIndividualStaff,
            startDate: this.startDate,
            endDate: this.endDate,
            reportType: this.reportTypeValue
        });

        if (filters.isAllStaff) {
            this.selectedStaffType = 'all';
        } else if (filters.isIndividualStaff) {
            this.selectedStaffType = 'individual';
        } else {
            this.selectedStaffType = null;
        }

        this.selectedFacilityId = Array.isArray(filters.facility) ? filters.facility : (filters.facility ? [filters.facility] : []);
        this.selectedFacilityIds = [...this.selectedFacilityId];
        console.log('🔹 Facility IDs:', JSON.stringify(this.selectedFacilityIds));

        console.log('🔹 Calling sendFacilityToApex for favorite...');
        sendFacilityToApex({ facilityIds: this.selectedFacilityIds })
            .then(result => {
                console.log('✅ sendFacilityToApex response received for favorite');
                console.log('🔹 Result length:', result?.length || 0);
                if (!result || result.length === 0) {
                    this.filteredStaffList1 = [];
                } else {
                    this.filteredStaffList1 = result.map(staff => ({
                        Id: staff.Id,
                        Display_Nickname__c: staff.Display_Nickname__c
                    }));
                    console.log('🔹 filteredStaffList1 length:', this.filteredStaffList1.length);
                }
            })
            .catch(error => {
                console.error('❌ First Apex Error →', error);
            });

        console.log('🔹 Calling sendFacilityToApexforParticipant for favorite...');
        sendFacilityToApexforParticipant({ facilityIds: this.selectedFacilityIds })
            .then(result => {
                console.log('✅ sendFacilityToApexforParticipant response received for favorite');
                console.log('🔹 Result length:', result?.length || 0);
                if (!result || result.length === 0) {
                    this.participantsOptions = [];
                    return;
                }
                this.participantsOptions = result.map(participant => ({
                    label: participant.Name,
                    value: participant.Id
                }));
                console.log('🔹 participantsOptions length:', this.participantsOptions.length);
            })
            .catch(error => {
                console.error('❌ Participant Apex Error →', error);
            });

        if (Array.isArray(this.roleCheckboxes)) {
            this.roleCheckboxes = this.roleCheckboxes.map(role => ({
                ...role,
                checked: this.selectedRoles.includes(role.value)
            }));
            console.log('🔹 Role checkboxes updated');
        }

        this.isCustomRange = this.selectedDateRange === 'CUSTOM';
        this.isFavorite = true;
        this.favoriteText = 'Remove from favorite';
        this.favoriteClass = 'favorite-active';
        this.updateGenerateButtonState();
        console.log('===== handleFavoriteClick END =====');
    }

    // ============ MODAL METHODS ============
    StaffBasedReportshowModalclose() {
        console.log('===== StaffBasedReportshowModalclose START =====');
        console.log('🔹 Closing export modal');
        
        this.isStaffBasedReportshowModal = false;
        this.isCreatingTemplate = false;
        this.newTemplateName = '';
        if (this.selectedTemplateId === 'NEW' && this.previousTemplateId) {
            console.log('🔹 Restoring previous template:', this.previousTemplateId);
            this.selectedTemplateId = this.previousTemplateId;
        }
        this.previousTemplateId = null;
        console.log('===== StaffBasedReportshowModalclose END =====');
    }

    async StaffBasedReportshowModalsave() {
        console.log('===== StaffBasedReportshowModalsave START =====');
        console.log('🔹 selectedExportType:', this.selectedExportType);
        console.log('🔹 sections count:', this.sections?.length || 0);
        console.log('🔹 selectedTemplateId:', this.selectedTemplateId);
        console.log('🔹 Current timestamp:', new Date().toISOString());
        
        // SAFETY CHECK: Set default if not selected
        if (!this.selectedExportType) {
            this.selectedExportType = 'PDF';
            this.isPDF = true;
            this.isCSV = false;
            console.log('🔹 Default export type set to PDF');
        }

        // ========== VALIDATION SECTION ==========
        
        // 1. Validate export type
        if (!this.selectedExportType) {
            console.warn('⚠️ No export type selected');
            this.showToast('Error', 'Please select export type.', 'error');
            console.log('===== StaffBasedReportshowModalsave END (no export type) =====');
            return;
        }

        // 2. Validate at least one section is checked
        const checkedSections = this.sections.filter(s => s.checked === true);
        console.log('🔹 Checked sections count:', checkedSections.length);
        
        if (checkedSections.length === 0) {
            console.warn('⚠️ No sections checked');
            this.showToast('Error', 'Select at least one field.', 'error');
            console.log('===== StaffBasedReportshowModalsave END (no sections) =====');
            return;
        }

        // 3. 🔥 NEW: Only validate 5-field limit when PDF is selected
        if (this.selectedExportType === 'PDF' && checkedSections.length > 5) {
            console.warn('⚠️ Too many sections for PDF:', checkedSections.length);
            this.showToast(
                'Error', 
                'PDF supports a maximum of 5 fields. Please uncheck some fields or switch to CSV.', 
                'error'
            );
            console.log('===== StaffBasedReportshowModalsave END (PDF limit) =====');
            return;
        }

        // 4. Validate template selection
        if (!this.selectedTemplateId) {
            console.warn('⚠️ No template selected');
            this.showToast('Error', 'Please select a template.', 'error');
            console.log('===== StaffBasedReportshowModalsave END (no template) =====');
            return;
        }

        if (this.selectedTemplateId === 'NEW') {
            console.warn('⚠️ Template is NEW but not saved');
            this.showToast('Error', 'Please enter and confirm a new template before saving.', 'error');
            console.log('===== StaffBasedReportshowModalsave END (NEW template) =====');
            return;
        }

        // ========== COLUMN ORDER UPDATE ==========
        
        // Update column keys before saving
        this.updateColumnKeys();
        console.log('🔹 Column keys updated:', JSON.stringify(this.columnKeys));

        // Build the template payload with proper structure
        const payload = this.buildTemplatePayload();
        console.log('🔹 Final payload to save:', JSON.stringify(payload, null, 2));

        // ========== JSON VALIDATION ==========
        
        // 🔥 CRITICAL: Ensure proper JSON stringification
        let templateJson;
        try {
            // Use JSON.stringify with replacer to ensure proper formatting
            templateJson = JSON.stringify(payload, (key, value) => {
                // If it's an array, make sure it's a plain array
                if (Array.isArray(value)) {
                    return JSON.parse(JSON.stringify(value));
                }
                return value;
            });
            
            // Verify it parses correctly
            const parsed = JSON.parse(templateJson);
            console.log('✅ Template JSON is valid');
            console.log('🔹 Parsed columnOrder:', JSON.stringify(parsed.columnOrder));
            console.log('🔹 Parsed columnOrder type:', typeof parsed.columnOrder);
            console.log('🔹 Parsed columnOrder is array:', Array.isArray(parsed.columnOrder));
        } catch (e) {
            console.error('❌ Invalid JSON generated:', e);
            console.error('🔹 Error details:', {
                message: e.message,
                stack: e.stack
            });
            this.showToast('Error', 'Failed to generate valid template JSON', 'error');
            console.log('===== StaffBasedReportshowModalsave END (JSON error) =====');
            return;
        }

        // ========== TEMPLATE IDENTIFICATION ==========
        
        const isTemp = String(this.selectedTemplateId).startsWith('TMP_');
        const templateIdToSend = isTemp ? null : this.selectedTemplateId;
        const templateNameToSend = isTemp ? 
            this.newTemplateName : 
            this.templatesforShiftReport.find(t => t.value === this.selectedTemplateId)?.label;

        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        this.selectedFacilityId = storedFacilityId;

        console.log('🔹 Template details:', {
            templateId: templateIdToSend,
            templateName: templateNameToSend,
            facilityId: this.selectedFacilityId,
            reportType: this.reportTypeValue,
            isTemp: isTemp
        });

        // ========== SAVE TEMPLATE ==========
        
        try {
            this.isLoading = true;
            console.log('🔹 Calling createTemplate with params...');

            const saved = await createTemplate({
                templateName: templateNameToSend,
                facilityId: this.selectedFacilityId,
                templateJson: templateJson,
                templateId: templateIdToSend,
                reportType: this.reportTypeValue,
            });

            console.log('✅ Template saved successfully:', saved);

            // ========== CLOSE MODAL ==========
            this.isStaffBasedReportshowModal = false;
            this.isReportContainer = false;

            // ========== SET REPORT VIEW ==========
            this.setReportView();

            // ========== RELOAD DATA ==========
            console.log('🔹 Reloading templates and generated reports...');
            await this.loadTemplates();
            this.initializeGeneratedReports();

            // ========== UPDATE SELECTED TEMPLATE ==========
            if (saved && saved.Id) {
                this.selectedTemplateId = saved.Id;
                this.selectedTemplateLabel = templateNameToSend;
                console.log('🔹 Updated selectedTemplateId to:', this.selectedTemplateId);
            }

            // ========== CREATE EXPORT LOG ==========
            if (!this.handlePreviewflag) {
                console.log('🔹 Creating export log...');
                this.createExportLog(this.selectedExportType, this.reportTypeValue);
            }

            this.showToast('Success', 'Template saved successfully', 'success');
            console.log('✅ StaffBasedReportshowModalsave completed successfully');

        } catch (e) {
            console.error('❌ Error Saving Template =>', e);
            console.error('🔹 Error details:', {
                message: e.message,
                stack: e.stack,
                body: e.body
            });
            const msg = e?.body?.message || e?.message || 'Unable to save template';
            this.showToast('Error', msg, 'error');
        } finally {
            this.isLoading = false;
            console.log('🔹 isLoading set to false');
            console.log('===== StaffBasedReportshowModalsave END =====');
        }
    }

    setReportView() {
        console.log('===== setReportView START =====');
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        console.log('🔹 handledownloadReport:', this.handledownloadReport);
        
        if (this.reportTypeValue === 'SHIFT') {
            if (!this.handledownloadReport) {
                this.isStaffBasedReport1 = true;
                this.isRejectedShiftReport = false;
                console.log('🔹 Set SHIFT report view');
            }
        } else if (this.reportTypeValue === 'REJECTED_SHIFT') {
            this.isRejectedShiftReport = true;
            this.isStaffBasedReport1 = false;
            console.log('🔹 Set REJECTED_SHIFT report view');
        } else if (this.reportTypeValue === 'STAFF') {
            this.staffListflag = true;
            this.isStaffBasedReport1 = false;
            this.isRejectedShiftReport = false;
            console.log('🔹 Set STAFF report view');
        } else if (this.reportTypeValue === 'PARTICIPANT') {
            this.participantflag = true;
            this.isStaffBasedReport1 = false;
            this.isRejectedShiftReport = false;
            console.log('🔹 Set PARTICIPANT report view');
        } else if (this.reportTypeValue === 'REIMBURSEMENT') {
            this.reimbursementflag = true;
            this.isStaffBasedReport1 = false;
            this.isRejectedShiftReport = false;
            console.log('🔹 Set REIMBURSEMENT report view');
        } else if (this.reportTypeValue === 'OVER_EFF') {
            this.isunderandOverReport = true;
            this.isStaffBasedReport1 = false;
            this.isRejectedShiftReport = false;
            console.log('🔹 Set OVER_EFF report view');
        } else if (this.reportTypeValue === 'Participant_Service_Delivery') {
            this.participantServiceflag = true;
            this.isStaffBasedReport1 = false;
            this.isRejectedShiftReport = false;
            console.log('🔹 Set Participant_Service_Delivery report view');
        }
        console.log('===== setReportView END =====');
    }

    // ============ EXPORT METHODS ============
    handleExportClick(event) {
        console.log('===== handleExportClick START =====');
        event.stopPropagation();
        this.isDropdownOpen = !this.isDropdownOpen;
        console.log('🔹 isDropdownOpen set to:', this.isDropdownOpen);
        console.log('===== handleExportClick END =====');
    }

    handleOutsideClick(event) {
        if (this.isDropdownOpen && !this.template.contains(event.target)) {
            this.isDropdownOpen = false;
            console.log('🔹 Dropdown closed via outside click');
        }
    }

    handleConfig() {
        console.log('===== handleConfig START =====');
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        
        if (this.reportTypeValue === 'SHIFT' || this.reportTypeValue === 'REJECTED_SHIFT' ||
            this.reportTypeValue === 'REIMBURSEMENT' || this.reportTypeValue === 'STAFF' ||
            this.reportTypeValue === 'PARTICIPANT' || this.reportTypeValue === 'OVER_EFF') {

            console.log('🔹 Building sections for config...');
            if (this.reportTypeValue === 'PARTICIPANT') {
                this.buildSectionsForParticipantReport();
            } else if (this.reportTypeValue === 'STAFF') {
                this.buildSectionsForStaffReport();
            } else if (this.reportTypeValue === 'OVER_EFF') {
                this.buildSectionsForUnderOverReport();
            } else {
                this.buildSectionsForReport();
            }

            this.isStaffBasedReportshowModal = true;
            console.log('🔹 Export modal opened');
            
            console.log('🔹 Auto-selecting first template...');
            this.autoSelectFirstTemplate();
        } else {
            console.warn('⚠️ Config not supported for report type:', this.reportTypeValue);
        }
        this.isDropdownOpen = false;
        console.log('===== handleConfig END =====');
    }

    handleExportTypeChange(event) {
        console.log('===== handleExportTypeChange START =====');
        const value = event.currentTarget.value;
        console.log('🔹 Export type changed to:', value);
        
        this.selectedExportType = value;
        this.isPDF = value === 'PDF';
        this.isCSV = value === 'EXCEL';
        console.log('🔹 isPDF:', this.isPDF, 'isCSV:', this.isCSV);

        // 🔥 NEW: If switching from CSV to PDF and more than 5 fields are checked, show warning
        if (value === 'PDF') {
            const checkedCount = this.sections.filter(s => s.checked).length;
            if (checkedCount > 5) {
                console.warn('⚠️ Too many fields selected for PDF:', checkedCount);
                this.showToast('Warning', 'You have selected ' + checkedCount + ' fields. PDF supports maximum 5 fields. Please uncheck some fields.', 'warning');
            }
        }
        console.log('===== handleExportTypeChange END =====');
    }

    get exportTypeOptions() {
        const options = [
            { label: 'PDF', value: 'PDF' },
            { label: 'CSV', value: 'EXCEL' }
        ];
        console.log('🔹 exportTypeOptions:', options);
        return options;
    }

    // ============ MODAL INITIALIZATION ============
    initializeExportModal() {
        console.log('===== initializeExportModal START =====');
        console.log('🔹 Current timestamp:', new Date().toISOString());
        
        // Set default export type to PDF
        this.selectedExportType = 'PDF';
        this.isPDF = true;
        this.isCSV = false;
        console.log('🔹 Default export type set to PDF');
        
        // Build sections for the current report type FIRST
        this.ensureSectionsExist();
        console.log('🔹 Sections ensured, count:', this.sections?.length || 0);
        
        // THEN load templates and auto-select first template
        this.loadTemplates().then(() => {
            console.log('✅ Templates loaded in initializeExportModal');
            // Auto-select first template and apply its checkboxes
            this.autoSelectFirstTemplate();
            
            // Initialize column keys
            this.updateColumnKeys();
            console.log('🔹 Modal initialized with column keys:', JSON.stringify(this.columnKeys));
        }).catch(error => {
            console.error('❌ Error loading templates in initializeExportModal:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
        });
        console.log('===== initializeExportModal END =====');
    }

    autoSelectFirstTemplate() {
        console.log('===== autoSelectFirstTemplate START =====');
        console.log('🔹 templatesforShiftReport length:', this.templatesforShiftReport?.length || 0);
        console.log('🔹 sections before auto-select:', JSON.stringify(this.sections));
        
        if (!Array.isArray(this.templatesforShiftReport) || this.templatesforShiftReport.length === 0) {
            console.log('🔹 No templates available, waiting...');
            // Try to load templates first
            this.loadTemplates().then(() => {
                console.log('✅ Templates loaded, auto-selecting...');
                this.autoSelectFirstTemplate();
            }).catch(error => {
                console.error('❌ Failed to load templates for auto-select:', error);
                console.error('🔹 Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            });
            console.log('===== autoSelectFirstTemplate END (loading) =====');
            return;
        }
        
        // Find first non-New template
        const firstNonNew = this.templatesforShiftReport.find(t => t.value !== 'NEW');
        console.log('🔹 First non-new template:', firstNonNew ? firstNonNew.label : 'none');

        if (firstNonNew) {
            this.selectedTemplateId = firstNonNew.value;
            this.selectedTemplateLabel = firstNonNew.label || null;
            console.log('🔹 Selected template:', this.selectedTemplateId, this.selectedTemplateLabel);
            
            // Ensure sections exist
            this.ensureSectionsExist();
            
            // Apply template if available
            if (firstNonNew.parsedJson) {
                console.log('🔹 Applying parsed JSON template:', Object.keys(firstNonNew.parsedJson));
                this.applyTemplate(firstNonNew.parsedJson);
            } else if (firstNonNew.json) {
                try {
                    console.log('🔹 Parsing template JSON...');
                    const parsed = JSON.parse(firstNonNew.json);
                    console.log('✅ Auto selected template parsed:', Object.keys(parsed));
                    this.applyTemplate(parsed);
                } catch (e) {
                    console.error('❌ Error parsing template JSON:', e);
                    this.clearAllSelections();
                }
            } else {
                console.warn('⚠️ Template has no JSON data');
                this.clearAllSelections();
            }
        } else {
            console.log('🔹 No template found, setting to NEW');
            this.selectedTemplateId = 'NEW';
            this.selectedTemplateLabel = 'New';
            this.clearAllSelections();
        }
        
        console.log('🔹 sections after auto-select:', JSON.stringify(this.sections));
        console.log('🔹 columnKeys after auto-select:', JSON.stringify(this.columnKeys));
        console.log('===== autoSelectFirstTemplate END =====');
    }

    // Add this helper method to validate template JSON
    validateAndFixTemplateJson(templateJson) {
        console.log('===== validateAndFixTemplateJson START =====');
        if (!templateJson) {
            console.log('🔹 No template JSON to validate');
            console.log('===== validateAndFixTemplateJson END (empty) =====');
            return templateJson;
        }
        
        try {
            let parsed = typeof templateJson === 'string' ? JSON.parse(templateJson) : templateJson;
            console.log('🔹 Parsed template JSON:', Object.keys(parsed));
            
            // Fix columnOrder if it exists and is malformed
            if (parsed.columnOrder) {
                let columnOrder = parsed.columnOrder;
                console.log('🔹 Original columnOrder:', JSON.stringify(columnOrder));
                
                // If it's a string, try to parse it
                if (typeof columnOrder === 'string') {
                    try {
                        columnOrder = JSON.parse(columnOrder);
                        console.log('🔹 Parsed columnOrder string:', JSON.stringify(columnOrder));
                    } catch (e) {
                        console.warn('⚠️ Failed to parse columnOrder string, trying to fix...');
                        // If parsing fails, try to fix it
                        columnOrder = this.fixMalformedColumnOrder(columnOrder);
                    }
                }
                
                // Validate it's an array
                if (!Array.isArray(columnOrder)) {
                    console.warn('⚠️ columnOrder is not an array, fixing...');
                    // Try to extract from columnKeys if available
                    if (parsed.columnKeys && Array.isArray(parsed.columnKeys)) {
                        columnOrder = parsed.columnKeys.map((key, index) => ({
                            key: key,
                            order: index + 1
                        }));
                        console.log('🔹 Rebuilt columnOrder from columnKeys:', JSON.stringify(columnOrder));
                    } else {
                        columnOrder = [];
                        console.log('🔹 No columnKeys available, setting empty columnOrder');
                    }
                }
                
                // Filter out invalid entries
                const validOrder = columnOrder.filter(item => 
                    item && typeof item === 'object' && item.key && typeof item.order === 'number'
                );
                if (validOrder.length !== columnOrder.length) {
                    console.log(`🔹 Filtered out ${columnOrder.length - validOrder.length} invalid entries`);
                }
                parsed.columnOrder = validOrder;
            }
            
            // Ensure columnKeys matches columnOrder
            if (parsed.columnOrder && parsed.columnOrder.length > 0) {
                parsed.columnKeys = parsed.columnOrder.map(item => item.key);
                console.log('🔹 Updated columnKeys from columnOrder:', JSON.stringify(parsed.columnKeys));
            }
            
            console.log('✅ Template validation complete');
            console.log('===== validateAndFixTemplateJson END (success) =====');
            return parsed;
        } catch (e) {
            console.error('❌ Error validating template JSON:', e);
            console.error('🔹 Error details:', {
                message: e.message,
                stack: e.stack
            });
            console.log('===== validateAndFixTemplateJson END (error) =====');
            return templateJson;
        }
    }

    getSelectedTemplateColumnKeys() {
        console.log('===== getSelectedTemplateColumnKeys START =====');
        console.log('🔹 selectedTemplateId:', this.selectedTemplateId);
        
        if (!this.selectedTemplateId || this.selectedTemplateId === 'NEW') {
            console.log('🔹 No template selected or template is NEW');
            console.log('===== getSelectedTemplateColumnKeys END (no template) =====');
            return [];
        }
        
        // Find template in the list
        const tpl = this.templatesforShiftReport.find(t => t.value === this.selectedTemplateId);
        console.log('🔹 Found template:', tpl ? tpl.label : 'not found');
        
        if (!tpl || !tpl.json) {
            console.log('🔹 Template not found or has no JSON');
            console.log('===== getSelectedTemplateColumnKeys END (no JSON) =====');
            return [];
        }

        try {
            // Parse the JSON
            let parsed;
            if (typeof tpl.json === 'string') {
                parsed = JSON.parse(tpl.json);
            } else {
                parsed = tpl.json;
            }
            console.log('🔹 Parsed template JSON:', Object.keys(parsed));
            
            // Get keys that are checked (true)
            const checkedKeys = Object.keys(parsed).filter(k => parsed[k] === true);
            console.log('🔹 Checked keys from template:', checkedKeys);
            
            // If there's a column order, use it - ensure it's a plain array
            if (parsed.columnOrder) {
                let columnOrder = parsed.columnOrder;
                
                // If it's a string, parse it
                if (typeof columnOrder === 'string') {
                    try {
                        columnOrder = JSON.parse(columnOrder);
                        console.log('🔹 Parsed columnOrder string:', JSON.stringify(columnOrder));
                    } catch (e) {
                        console.error('❌ Failed to parse columnOrder string:', e);
                    }
                }
                
                // Ensure it's an array and convert to plain array
                if (Array.isArray(columnOrder)) {
                    columnOrder = JSON.parse(JSON.stringify(columnOrder));
                    console.log('🔹 Using column order from template:', JSON.stringify(columnOrder));
                    
                    const orderedKeys = columnOrder
                        .filter(item => checkedKeys.includes(item.key))
                        .map(item => item.key);
                    console.log('🔹 Ordered keys from columnOrder:', orderedKeys);
                    
                    // Add any checked keys not in the order
                    const remainingKeys = checkedKeys.filter(key => !orderedKeys.includes(key));
                    const finalKeys = [...orderedKeys, ...remainingKeys];
                    console.log('🔹 Final ordered keys:', finalKeys);
                    console.log('===== getSelectedTemplateColumnKeys END (success) =====');
                    return finalKeys;
                }
            }
            
            // If there's a columnKeys array, use it - ensure it's a plain array
            if (parsed.columnKeys && Array.isArray(parsed.columnKeys)) {
                const columnKeys = JSON.parse(JSON.stringify(parsed.columnKeys));
                console.log('🔹 Using columnKeys from template:', columnKeys);
                console.log('===== getSelectedTemplateColumnKeys END (success) =====');
                return columnKeys;
            }
            
            // Fallback to all checked keys
            console.log('🔹 Fallback to all checked keys:', checkedKeys);
            console.log('===== getSelectedTemplateColumnKeys END (fallback) =====');
            return checkedKeys;
        } catch (e) {
            console.error('❌ Invalid template json:', e);
            console.error('🔹 Error details:', {
                message: e.message,
                stack: e.stack
            });
            console.log('===== getSelectedTemplateColumnKeys END (error) =====');
            return [];
        }
    }

    normalizeTemplateKeysForReport(templateKeys) {
        console.log('===== normalizeTemplateKeysForReport START =====');
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        console.log('🔹 Input templateKeys:', templateKeys);
        
        if (this.reportTypeValue !== 'PARTICIPANT') {
            console.log('🔹 No normalization needed for:', this.reportTypeValue);
            console.log('===== normalizeTemplateKeysForReport END (no change) =====');
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
        console.log('🔹 Normalized keys:', normalized);
        console.log('===== normalizeTemplateKeysForReport END =====');
        return normalized;
    }

    // ============ DOWNLOAD METHODS ============
    handleDownload(event) {
        console.log('===== handleDownload START =====');
        console.log('🔹 selectedExportType:', this.selectedExportType);
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        console.log('🔹 isEmailMode:', this.isEmailMode);
        
        const exportType = this.selectedExportType;
        if (!exportType) {
            console.warn('⚠️ No export type selected');
            this.showToast('Error', 'Please select export type', 'error');
            console.log('===== handleDownload END (no export type) =====');
            return;
        }

        // 🔥 FIX: Ensure column keys are updated
        this.updateColumnKeys();
        console.log('🔹 Updated columnKeys:', JSON.stringify(this.columnKeys));
        
        let templateKeys = this.getSelectedTemplateColumnKeys();
        console.log('🔹 Template keys:', templateKeys);
        
        // 🔥 FIX: If no template keys found, use checked sections as fallback
        if (!templateKeys || templateKeys.length === 0) {
            console.warn('⚠️ No template keys found, using checked sections as fallback');
            
            const checkedSections = this.sections.filter(s => s.checked === true);
            console.log('🔹 Checked sections count:', checkedSections.length);
            
            if (checkedSections.length === 0) {
                console.warn('⚠️ No sections checked either');
                this.showToast('Error', 'Select at least one field to export.', 'error');
                console.log('===== handleDownload END (no data) =====');
                return;
            }
            
            templateKeys = checkedSections.map(s => s.key);
            console.log('🔹 Using checked sections as template keys:', templateKeys);
        }

        // Get the data rows
        let rows;
        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            rows = this.rejectedFilteredRecords;
        } else if (this.reportTypeValue === 'REIMBURSEMENT') {
            rows = this.reimbursementAllRecords;
        } else if (this.reportTypeValue === 'STAFF') {
            rows = this.staffAllRecords;
        } else if (this.reportTypeValue === 'PARTICIPANT') {
            rows = this.participantAllRecords;
        } else if (this.reportTypeValue === 'Participant_Service_Delivery') {
            rows = this.participantServiceAllRecords;
        } else if (this.reportTypeValue === 'OVER_EFF') {
            rows = this.underOverAllRecords;
        } else {
            rows = this.filteredRecords;
        }

        console.log('🔹 Rows count:', rows?.length || 0);

        if (!rows || !rows.length) {
            console.warn('⚠️ No data available to export');
            this.showToast('Error', 'No data available to export.', 'error');
            console.log('===== handleDownload END (no data) =====');
            return;
        }

        // Normalize keys for report type
        const normalizedKeys = this.normalizeTemplateKeysForReport(templateKeys);
        console.log('🔹 Normalized keys for download:', normalizedKeys);

        // 🔥 FIX: For email mode, call the appropriate conversion method and handle async
        if (this.isEmailMode) {
            if (exportType === 'EXCEL') {
                try {
                    this.convertCsvToBase64FromTemplate(normalizedKeys, rows);
                    console.log('✅ CSV converted to base64 for email');
                } catch (error) {
                    console.error('❌ Failed to convert CSV to base64:', error);
                    this.showToast('Error', 'Failed to prepare attachment', 'error');
                }
            } else {
                // PDF - need to await the async method
                this.convertPdfToBase64FromTemplate(normalizedKeys, rows)
                    .then(result => {
                        console.log('✅ PDF converted to base64 for email');
                        console.log('🔹 Base64 length:', result.base64Data?.length || 0);
                        console.log('🔹 Filename:', result.fileName);
                    })
                    .catch(error => {
                        console.error('❌ Failed to convert PDF to base64:', error);
                        this.showToast('Error', 'Failed to prepare PDF attachment', 'error');
                    });
            }
        } else {
            // Regular download
            if (exportType === 'EXCEL') {
                this.exportExcelFromTemplate(normalizedKeys, rows);
            } else {
                this.exportPdfFromTemplate(normalizedKeys, rows);
            }
        }
        console.log('===== handleDownload END =====');
    }

    getOrganisationCSVHeader() {
        console.log('🔹 getOrganisationCSVHeader called');
        const header = `"${this.orgname || ''}"\n"${this.statePostal || ''}"\n\n`;
        console.log('🔹 CSV header:', header.substring(0, 50) + '...');
        return header;
    }

    exportExcelFromTemplate(templateKeys, rows) {
        console.log('===== exportExcelFromTemplate with custom order =====');
        console.log('🔹 Input templateKeys:', templateKeys);
        console.log('🔹 Rows count:', rows?.length || 0);
        
        // 🔥 CRITICAL: Use the current column order from sections
        let orderedKeys = [];
        
        // First, try to use the current column order from sections
        const checkedSections = this.sections.filter(s => s.checked === true);
        if (checkedSections.length > 0) {
            orderedKeys = checkedSections.map(s => s.key);
            console.log('🔹 Using ordered keys from sections:', orderedKeys);
        } else if (this.columnKeys && Array.isArray(this.columnKeys) && this.columnKeys.length > 0) {
            // Fallback to columnKeys
            orderedKeys = JSON.parse(JSON.stringify(this.columnKeys));
            console.log('🔹 Using ordered keys from columnKeys:', orderedKeys);
        } else {
            // Final fallback
            orderedKeys = templateKeys;
            console.log('🔹 Using template keys as fallback:', orderedKeys);
        }
        
        // Ensure we only include keys that are in the template and checked
        orderedKeys = orderedKeys.filter(key => templateKeys.includes(key));
        
        if (orderedKeys.length === 0) {
            orderedKeys = templateKeys;
            console.log('🔹 No keys after filtering, using template keys');
        }
        
        console.log('🔹 Final ordered keys for CSV:', orderedKeys);
        
        const headers = orderedKeys.map(k => this.templateKeyToLabelMap?.[k] || k);
        console.log('🔹 Headers for CSV:', headers);
        
        let csv = this.getOrganisationCSVHeader();
        csv += headers.join(',') + '\n';

        rows.forEach((row, index) => {
            const values = orderedKeys.map(key => {
                const fieldPath = this.templateKeyToFieldMap?.[key];
                const value = fieldPath ? this.getValueByPath(row, fieldPath) : '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        const filePrefix = this.getReportFilePrefix();

        a.href = url;
        a.download = `${filePrefix}_${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ CSV exported with custom column order:', orderedKeys);
        console.log('===== exportExcelFromTemplate END =====');
    }

    addOrganisationPdfHeader(doc) {
        console.log('===== addOrganisationPdfHeader START =====');
        const pageWidth = doc.internal.pageSize.getWidth();
        console.log('🔹 Page width:', pageWidth);

        if (this.orgLogo) {
            console.log('🔹 Adding organisation logo');
            try {
                const maxWidth = 40;
                const maxHeight = 20;
                const imgProps = doc.getImageProperties(this.orgLogo);
                let imgWidth = imgProps.width;
                let imgHeight = imgProps.height;

                const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                imgWidth = imgWidth * scale;
                imgHeight = imgHeight * scale;

                const logoX = 10 + (maxWidth - imgWidth) / 2;
                const logoY = 8 + (maxHeight - imgHeight) / 2;

                doc.addImage(this.orgLogo, "PNG", logoX, logoY, imgWidth, imgHeight);
                console.log('✅ Logo added');
            } catch (e) {
                console.warn('⚠️ Logo issue:', e);
            }
        }

        const orgX = pageWidth - 80;
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text(this.orgname || '', orgX, 15);
        console.log('🔹 Organisation name added:', this.orgname);

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.text(this.statePostal || '', orgX, 22);
        console.log('🔹 Address added:', this.statePostal);

        doc.line(10, 32, pageWidth - 10, 32);
        console.log('🔹 Header line added');
        console.log('===== addOrganisationPdfHeader END (returning 42) =====');
        return 42;
    }

    // ============ DOWNLOAD METHODS ============
    exportPdfFromTemplate(templateKeys, rows) {
        console.log('===== exportPdfFromTemplate START =====');
        console.log('🔹 Template keys before order:', templateKeys);
        console.log('🔹 Rows count:', rows?.length || 0);
        
        // Ensure templateKeys is a plain array
        let orderedKeys = [];
        if (Array.isArray(templateKeys)) {
            orderedKeys = JSON.parse(JSON.stringify(templateKeys));
        }
        
        // If we have columnKeys stored, use them - ensure they're plain
        if (this.columnKeys && Array.isArray(this.columnKeys) && this.columnKeys.length > 0) {
            const columnKeys = JSON.parse(JSON.stringify(this.columnKeys));
            // Only include keys that are in the template and checked
            orderedKeys = columnKeys.filter(key => templateKeys.includes(key));
            console.log('🔹 Using ordered keys from columnKeys:', orderedKeys);
        } else {
            // Fallback to the original order but only include checked sections
            const checkedSections = this.sections.filter(s => s.checked);
            orderedKeys = checkedSections.map(s => s.key);
            console.log('🔹 Using ordered keys from sections:', orderedKeys);
        }
        
        // If no ordered keys, use the original template keys
        if (orderedKeys.length === 0) {
            orderedKeys = templateKeys;
            console.log('🔹 No ordered keys found, using original template keys:', orderedKeys);
        }
        
        // Check if jsPDF is initialized
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded');
            this.loadPdfLibraries();
            this.showToast('Info', 'PDF library is loading, please try again in a moment.', 'info');
            console.log('===== exportPdfFromTemplate END (library not ready) =====');
            return;
        }

        const { jsPDF } = window.jspdf;
        
        // Check if autoTable is attached
        if (typeof jsPDF.API.autoTable !== 'function') {
            console.error('❌ autoTable not attached to jsPDF');
            try {
                if (typeof window.autoTable === 'function') {
                    window.autoTable(jsPDF.API);
                    console.log('✅ autoTable manually attached');
                } else {
                    console.warn('⚠️ window.autoTable is not a function');
                    this.showToast('Error', 'PDF library not ready. Please refresh and try again.', 'error');
                    console.log('===== exportPdfFromTemplate END (attachment failed) =====');
                    return;
                }
            } catch (e) {
                console.error('❌ Failed to attach autoTable:', e);
                this.showToast('Error', 'PDF export unavailable. Please use CSV export.', 'error');
                console.log('===== exportPdfFromTemplate END (error) =====');
                return;
            }
        }

        console.log('✅ jsPDF and autoTable ready, generating PDF...');
        const doc = new jsPDF('p', 'mm', 'a4');
        let startPosition = this.addOrganisationPdfHeader(doc);

        // Use ordered keys for headers - ensure they're plain
        const headers = orderedKeys.map(k => this.templateKeyToLabelMap?.[k] || k);
        console.log('🔹 Headers in order:', headers);
        
        const body = rows.map((row) =>
            orderedKeys.map(key => {
                const fieldPath = this.templateKeyToFieldMap?.[key];
                return fieldPath ? this.getValueByPath(row, fieldPath) : '';
            })
        );
        console.log('🔹 Body rows:', body.length);

        let title = 'Shift Report';
        if (this.reportTypeValue === 'REJECTED_SHIFT') title = 'Rejected Shift Report';
        else if (this.reportTypeValue === 'REIMBURSEMENT') title = 'Reimbursement Report';
        else if (this.reportTypeValue === 'STAFF') title = 'Staff Report';
        else if (this.reportTypeValue === 'PARTICIPANT') title = 'Participant Report';
        else if (this.reportTypeValue === 'Participant_Service_Delivery') title = 'Participant Service Report';
        else if (this.reportTypeValue === 'OVER_EFF') title = 'Under / Over Efficiency Report';

        doc.setFontSize(14);
        doc.text(title, 14, startPosition);
        console.log('🔹 Title added:', title);

        try {
            console.log('🔹 Calling doc.autoTable...');
            doc.autoTable({
                head: [headers],
                body: body,
                startY: startPosition + 8,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [12, 120, 186], textColor: 255 }
            });

            const today = new Date().toISOString().split('T')[0];
            const filePrefix = this.getReportFilePrefix();
            doc.save(`${filePrefix}_${today}.pdf`);
            console.log('✅ PDF saved successfully with custom column order:', orderedKeys);
            
        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.showToast('Error', 'Failed to generate PDF. Please try CSV export.', 'error');
        }
        console.log('===== exportPdfFromTemplate END =====');
    }

    // ============ EMAIL METHODS ============
    handleSendEmail(event) {
        console.log('===== handleSendEmail START =====');
        const reportId = event.currentTarget.dataset.id;
        console.log('🔹 Report ID:', reportId);
        
        const report = this.generatedReports.find(r => r.id === reportId);
        if (!report) {
            console.warn('⚠️ Report not found with ID:', reportId);
            this.showToast('Error', 'Report not found', 'error');
            console.log('===== handleSendEmail END (not found) =====');
            return;
        }
        this.reportEmailSend = report;
        this.selectedReportId = reportId;
        this.invoiceEmailFlag = true;
        console.log('🔹 Email modal opened for report:', reportId);
        console.log('===== handleSendEmail END =====');
    }

    async handleSendEmailtoStaff() {
        console.log('===== handleSendEmailtoStaff START =====');
        console.log('🔹 selectedReportId:', this.selectedReportId);
        console.log('🔹 selectedExportType:', this.selectedExportType);
        console.log('🔹 toAddress:', this.toAddress);
        console.log('🔹 ccAddress:', this.ccAddress);
        
        this.isEmailMode = true;
        console.log('🔹 isEmailMode set to true');

        try {
            if (!this.selectedReportId) {
                console.warn('⚠️ No Report Id found');
                console.log('===== handleSendEmailtoStaff END (no report ID) =====');
                return;
            }

            console.log('🔹 Generating report for email...');
            const fakeEvent = { currentTarget: { dataset: { id: this.selectedReportId } } };
            await this.handleDownloadReport(fakeEvent);
            
            // 🔥 FIX: Wait a bit longer for the async conversion to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 🔥 FIX: Check if base64 was generated
            if (!this.base64 || this.base64.length === 0) {
                console.error('❌ No base64 data generated');
                this.showToast('Error', 'Failed to generate PDF attachment', 'error');
                console.log('===== handleSendEmailtoStaff END (no base64) =====');
                return;
            }
            
            if (!this.fileName) {
                console.error('❌ No filename generated');
                this.showToast('Error', 'Failed to generate filename', 'error');
                console.log('===== handleSendEmailtoStaff END (no filename) =====');
                return;
            }
            
            console.log('🔹 Report generated, base64 length:', this.base64.length);
            console.log('🔹 Filename:', this.fileName);

            console.log('🔹 Calling sendReportEmail...');
            const emailResult = await sendReportEmail({
                base64Data: this.base64,
                fileName: this.fileName,
                toAddress: this.toAddress,
                ccAddress: this.ccAddress,
                subject: this.emailSubject,
                body: this.emailBody,
                exportType: this.selectedExportType
            });

            console.log('✅ Email sent successfully:', emailResult);
            this.showToast('Success', 'Email sent successfully', 'success');
        } catch (error) {
            console.error('❌ Error sending email:', error);
            console.error('🔹 Error details:', {
                message: error.message,
                stack: error.stack,
                body: error.body
            });
            this.showToast('Error', error.message || 'Failed to send email', 'error');
        }

        this.invoiceEmailFlag = false;
        this.isEmailMode = false;
        console.log('🔹 Email modal closed');
        console.log('===== handleSendEmailtoStaff END =====');
    }

    handleEmailOnChange(event) {
        console.log('===== handleEmailOnChange START =====');
        const field = event.target.name;
        const value = event.detail.value;
        console.log('🔹 Field:', field, 'Value:', value);
        
        if (field === 'toAddress') this.toAddress = value;
        else if (field === 'ccAddress') this.ccAddress = value;
        else if (field === 'emailSubject') this.emailSubject = value;
        else if (field === 'emailBody') this.emailBody = value;
        console.log('===== handleEmailOnChange END =====');
    }

    handleCloseModal() {
        console.log('===== handleCloseModal START =====');
        this.invoiceEmailFlag = false;
        this.toAddress = '';
        this.ccAddress = '';
        this.emailSubject = '';
        this.emailBody = '';
        console.log('🔹 Email modal closed and fields cleared');
        console.log('===== handleCloseModal END =====');
    }

    // ============ PREVIEW AND DOWNLOAD REPORT ============
    async handlePreview(event) {
        console.log('===== handlePreview START =====');
        console.log('🔹 Current timestamp:', new Date().toISOString());
        
        this.handlePreviewflag = true;
        this.backbutton = true;
        console.log('🔹 handlePreviewflag set to true, backbutton set to true');

        const reportId = event.currentTarget.dataset.id;
        console.log('🔹 Report ID:', reportId);
        
        const report = this.generatedReports.find(r => r.id === reportId);
        this.selectedFavoriteId = report.id;

        if (!report) {
            console.warn('⚠️ Report not found with ID:', reportId);
            console.log('===== handlePreview END (not found) =====');
            return;
        }
        console.log('🔹 Report found:', report);

        this.selectedExportType = report.exportType || '';
        this.generatedReportName = report.name || '';
        this.generatedReportDateRange = report.dateRange || '';
        this.generatedReportDate = report.generatedDate || '';
        this.generatedReportUser = report.generatedBy || '';
        console.log('🔹 Report details:', {
            name: this.generatedReportName,
            exportType: this.selectedExportType,
            dateRange: this.generatedReportDateRange
        });

        if (report.isFavorite) {
            this.isFavorite = true;
            this.favoriteText = 'Remove from favorite';
            this.favoriteClass = 'favorite-active';
            console.log('🔹 Report is favorite');
        } else {
            this.isFavorite = false;
            this.favoriteText = 'Add to favorite';
            this.favoriteClass = '';
            console.log('🔹 Report is not favorite');
        }

        let filters = {};
        try {
            filters = JSON.parse(report.filtersJson);
            console.log('🔹 Parsed filters:', Object.keys(filters));
        } catch (e) {
            console.error('❌ Error parsing filtersJson:', e);
            console.log('===== handlePreview END (parse error) =====');
            return;
        }

        this.selectedRoles = filters.roles || [];
        this.isAllStaff = filters.isAllStaff || false;
        this.isIndividualStaff = filters.isIndividualStaff || false;
        this.selectedEmploymentType = filters.employmentType || '';
        this.selectedLocation = filters.location || '';
        this.startDate = filters.startDate || '';
        this.endDate = filters.endDate || '';
        this.selectedDateRange = filters.selectedDateRange || '';
        this.selectedStaffName = filters.staffName || '';
        this.selectedStaffId = filters.staffId || null;
        this.selectedstaffStatus = filters.status || '';
        this.selectedFacilityIds = filters.facility || [];
        this.reportTypeValue = filters.reportType || '';
        this.statusValue = filters.reportrembursmentStatus || '';
        this.selectedTemplateId = filters.selectedTemplateId || '';
        this.selectedParticipantIds = filters.selectedParticipantId || '';
        console.log('🔹 Applied filters from preview');

        this.applyReportType(this.reportTypeValue);
        console.log('🔹 Report type applied:', this.reportTypeValue);

        await this.loadTemplates();
        if (this.selectedTemplateId) {
            console.log('🔹 Applying template:', this.selectedTemplateId);
            this.applyTemplateById(this.selectedTemplateId);
        }

        this.isReportContainer = false;
        this.favoritesflag = false;
        console.log('🔹 Report container set to false, favoritesflag set to false');

        if (this.reportTypeValue === 'SHIFT') {
            console.log('🔹 Generating SHIFT report for preview...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateShiftReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'REJECTED_SHIFT') {
            console.log('🔹 Generating REJECTED_SHIFT report for preview...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateRejectedShiftReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'STAFF') {
            console.log('🔹 Generating STAFF report for preview...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateStaffReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'PARTICIPANT') {
            console.log('🔹 Generating PARTICIPANT report for preview...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.loadParticipants();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'REIMBURSEMENT') {
            console.log('🔹 Generating REIMBURSEMENT report for preview...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateReimbursementReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'Participant_Service_Delivery') {
            console.log('🔹 Generating Participant_Service_Delivery report for preview...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateParticipantServiceDeliveryReport();
            await this.StaffBasedReportshowModalsave();
        }

        this.handlePreviewflag = false;
        console.log('🔹 handlePreviewflag set to false');
        console.log('===== handlePreview END =====');
    }

    async handleDownloadReport(event) {
        console.log('===== handleDownloadReport START =====');
        console.log('🔹 Current timestamp:', new Date().toISOString());
        
        this.handlePreviewflag = true;
        this.handledownloadReport = true;
        console.log('🔹 handlePreviewflag set to true, handledownloadReport set to true');

        const reportId = event.currentTarget.dataset.id;
        console.log('🔹 Report ID:', reportId);
        
        const report = this.generatedReports.find(r => r.id === reportId);
        if (!report) {
            console.warn('⚠️ Report not found with ID:', reportId);
            console.log('===== handleDownloadReport END (not found) =====');
            return;
        }
        console.log('🔹 Report found:', report);

        this.selectedExportType = report.exportType || '';
        this.generatedReportName = report.name || '';
        this.generatedReportDateRange = report.dateRange || '';
        this.generatedReportDate = report.generatedDate || '';
        this.generatedReportUser = report.generatedBy || '';
        console.log('🔹 Report details:', {
            name: this.generatedReportName,
            exportType: this.selectedExportType
        });

        let filters = {};
        try {
            filters = JSON.parse(report.filtersJson);
            console.log('🔹 Parsed filters:', Object.keys(filters));
        } catch (e) {
            console.error('❌ Error parsing filtersJson:', e);
            console.log('===== handleDownloadReport END (parse error) =====');
            return;
        }

        this.selectedRoles = filters.roles || [];
        this.isAllStaff = filters.isAllStaff || false;
        this.isIndividualStaff = filters.isIndividualStaff || false;
        this.selectedEmploymentType = filters.employmentType || '';
        this.selectedLocation = filters.location || '';
        this.startDate = filters.startDate || '';
        this.endDate = filters.endDate || '';
        this.selectedDateRange = filters.selectedDateRange || '';
        this.selectedStaffName = filters.staffName || '';
        this.selectedStaffId = filters.staffId || null;
        this.selectedstaffStatus = filters.status || '';
        this.selectedFacilityIds = filters.facility || [];
        this.reportTypeValue = filters.reportType || '';
        this.statusValue = filters.reportrembursmentStatus || '';
        this.selectedTemplateId = filters.selectedTemplateId || '';
        this.selectedParticipantIds = filters.selectedParticipantId || '';
        console.log('🔹 Applied filters from download');

        this.applyReportType(this.reportTypeValue);
        console.log('🔹 Report type applied:', this.reportTypeValue);

        await this.loadTemplates();
        if (this.selectedTemplateId) {
            console.log('🔹 Applying template:', this.selectedTemplateId);
            this.applyTemplateById(this.selectedTemplateId);
        }

        this.isReportContainer = true;
        this.favoritesflag = false;
        console.log('🔹 Report container set to true, favoritesflag set to false');

        if (this.reportTypeValue === 'SHIFT') {
            console.log('🔹 Generating SHIFT report for download...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateShiftReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'REJECTED_SHIFT') {
            console.log('🔹 Generating REJECTED_SHIFT report for download...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateRejectedShiftReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'STAFF') {
            console.log('🔹 Generating STAFF report for download...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateStaffReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'PARTICIPANT') {
            console.log('🔹 Generating PARTICIPANT report for download...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.loadParticipants();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'REIMBURSEMENT') {
            console.log('🔹 Generating REIMBURSEMENT report for download...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateReimbursementReport();
            await this.StaffBasedReportshowModalsave();
        } else if (this.reportTypeValue === 'Participant_Service_Delivery') {
            console.log('🔹 Generating Participant_Service_Delivery report for download...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.generateParticipantServiceDeliveryReport();
            await this.StaffBasedReportshowModalsave();
        }

        // 🔥 FIX: For email mode, don't call handleBack immediately
        // Let the caller handle the back navigation after the download completes
        if (!this.isEmailMode) {
            console.log('🔹 Calling handleDownload...');
            await this.handleDownload();
            console.log('🔹 Calling handleBack...');
            await this.handleBack();

            this.isMenuContainer = true;
            this.isReportContainer = true;
            this.isBuilderView = true;
        } else {
            // 🔥 FIX: For email mode, just generate the PDF and let the caller handle the rest
            console.log('🔹 Calling handleDownload for email...');
            await this.handleDownload();
            // Don't call handleBack here - let the email method handle it
        }

        this.handlePreviewflag = false;
        this.handledownloadReport = false;
        console.log('🔹 All flags reset, navigation complete');
        console.log('===== handleDownloadReport END =====');
    }

    // ============ SORTING ============
    handleSort(event) {
        console.log('===== handleSort START =====');
        const table = event.currentTarget.dataset.table;
        const field = event.currentTarget.dataset.field;
        console.log('🔹 Table:', table, 'Field:', field);

        if (!table || !field) {
            console.warn('⚠️ Missing table or field');
            console.log('===== handleSort END (missing data) =====');
            return;
        }

        const state = this.tableSortState[table];
        if (!state) {
            console.warn('⚠️ No sort state for table:', table);
            console.log('===== handleSort END (no state) =====');
            return;
        }

        if (state.field === field) {
            state.direction = state.direction === 'asc' ? 'desc' : 'asc';
            console.log('🔹 Toggled direction to:', state.direction);
        } else {
            state.field = field;
            state.direction = 'asc';
            console.log('🔹 Set new field:', field, 'direction: asc');
        }

        Object.keys(state.icons).forEach(key => { state.icons[key] = ''; });
        state.icons[field] = state.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';

        this.tableSortState = { ...this.tableSortState };
        console.log('🔹 Sort state updated');

        switch (table) {
            case 'shiftReport': 
                console.log('🔹 Sorting shiftReport, page 1');
                this.pageNumber = 1; 
                this.paginationHelper(); 
                break;
            case 'rejectedShifts': 
                console.log('🔹 Sorting rejectedShifts, page 1');
                this.rejectedPageNumber = 1; 
                this.rejectedPaginationHelper(); 
                break;
            case 'reimbursement': 
                console.log('🔹 Sorting reimbursement, page 1');
                this.reimbursementPageNumber = 1; 
                this.reimbursementPaginationHelper(); 
                break;
            case 'staff': 
                console.log('🔹 Sorting staff, page 1');
                this.staffPageNumber = 1; 
                this.staffPaginationHelper(); 
                break;
            case 'participants': 
                console.log('🔹 Sorting participants, page 1');
                this.participantPageNumber = 1; 
                this.participantPaginationHelper(); 
                break;
            case 'participantServices': 
                console.log('🔹 Sorting participantServices, page 1');
                this.participantServicePageNumber = 1; 
                this.updateParticipantServicePagination(); 
                break;
            case 'underOver': 
                console.log('🔹 Sorting underOver, page 1');
                this.underOverPageNumber = 1; 
                this.underOverPaginationHelper(); 
                break;
            case 'generatedReports': 
                console.log('🔹 Sorting generatedReports, page 1');
                this.pageNumber = 1; 
                this.updateGeneratedPagination(); 
                break;
            default: 
                console.warn('⚠️ Unknown table:', table);
                break;
        }
        console.log('===== handleSort END =====');
    }

    sortData(data, sortField, sortDirection) {
        console.log('===== sortData START =====');
        console.log('🔹 sortField:', sortField, 'sortDirection:', sortDirection);
        console.log('🔹 Data length:', data?.length || 0);
        
        if (!Array.isArray(data) || !sortField) {
            console.warn('⚠️ Invalid data or sortField');
            console.log('===== sortData END (invalid) =====');
            return data;
        }

        const sorted = [...data].sort((a, b) => {
            let valueA, valueB;

            if (sortField === 'staffName') {
                valueA = a.staffName ?? a.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c;
                valueB = b.staffName ?? b.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c;
            } else {
                valueA = a[sortField];
                valueB = b[sortField];
            }

            const isEmptyA = valueA === null || valueA === undefined || String(valueA).trim() === '' || String(valueA).trim().toLowerCase() === 'n/a';
            const isEmptyB = valueB === null || valueB === undefined || String(valueB).trim() === '' || String(valueB).trim().toLowerCase() === 'n/a';

            if (isEmptyA && isEmptyB) return 0;
            if (isEmptyA) return 1;
            if (isEmptyB) return -1;

            const result = String(valueA).localeCompare(String(valueB), undefined, { numeric: true, sensitivity: 'base' });
            return sortDirection === 'asc' ? result : -result;
        });
        
        console.log('✅ Data sorted, result length:', sorted.length);
        console.log('===== sortData END =====');
        return sorted;
    }

    updateGeneratedPagination() {
        console.log('===== updateGeneratedPagination START =====');
        console.log('🔹 generatedReports length:', this.generatedReports?.length || 0);
        console.log('🔹 pageNumber:', this.pageNumber);
        console.log('🔹 pageSize:', this.pageSize);
        
        const state = this.tableSortState.generatedReports;
        let dataList = Array.isArray(this.generatedReports) ? [...this.generatedReports] : [];
        if (state.field) {
            console.log('🔹 Sorting by:', state.field, state.direction);
            dataList = this.sortData(dataList, state.field, state.direction);
        }

        this.totalRecords = dataList.length;
        this.totalPages = this.pageSize > 0 ? Math.ceil(this.totalRecords / this.pageSize) : 1;

        if (this.pageNumber < 1) this.pageNumber = 1;
        if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

        const startIdx = (this.pageNumber - 1) * this.pageSize;
        const endIdx = this.pageNumber * this.pageSize;
        this.pagedGeneratedReports = dataList.slice(startIdx, endIdx);
        this.disableAllFirst = this.pageNumber <= 1;
        this.disableAllLast = this.pageNumber >= this.totalPages;
        
        console.log('✅ Generated pagination updated:', {
            totalRecords: this.totalRecords,
            totalPages: this.totalPages,
            displayedCount: this.pagedGeneratedReports?.length || 0,
            firstDisabled: this.disableAllFirst,
            lastDisabled: this.disableAllLast
        });
        console.log('===== updateGeneratedPagination END =====');
    }

    // ============ TEMPLATE UI HELPERS ============
    get showNewTemplateInput() {
        const show = this.selectedTemplateId === 'NEW';
        console.log('🔹 showNewTemplateInput:', show);
        return show;
    }

    get isDeleteDisabled() {
        const disabled = this.selectedTemplateId === 'NEW';
        console.log('🔹 isDeleteDisabled:', disabled);
        return disabled;
    }

    get visibleSections() {
        console.log('🔹 visibleSections count:', this.sections?.length || 0);
        return this.sections;
    }

    get sectionsWithIndex() {
        const withIndex = this.sections.map((section, index) => ({ ...section, displayIndex: index + 1 }));
        console.log('🔹 sectionsWithIndex count:', withIndex.length);
        return withIndex;
    }

    handleSectionChange(event) {
        console.log('===== handleSectionChange START =====');
        const key = event.target.dataset.key;
        const checked = event.target.checked;
        console.log('🔹 Section:', key, 'Checked:', checked);
        console.log('🔹 selectedExportType:', this.selectedExportType);

        // 🔥 NEW: Only apply the 5-field limit when PDF is selected
        const isPDFSelected = this.selectedExportType === 'PDF';
        
        // Count currently checked sections
        const currentlyCheckedCount = this.sections.filter(s => s.checked).length;
        console.log('🔹 Currently checked count:', currentlyCheckedCount);

        // If trying to check and already have 5 or more checked, show error and prevent check
        // Only applies when PDF is selected
        if (checked && currentlyCheckedCount >= 5 && isPDFSelected) {
            console.warn('⚠️ PDF limit reached, cannot check more than 5 fields');
            this.showToast('Limit Reached', 'PDF supports a maximum of 5 fields. Please uncheck some fields or switch to CSV.', 'error');
            // Reset the checkbox state (prevent it from being checked)
            const checkbox = event.target;
            if (checkbox) {
                checkbox.checked = false;
            }
            console.log('===== handleSectionChange END (limit reached) =====');
            return;
        }

        // Update the section
        this.sections = this.sections.map((section) => {
            if (section.key === key) {
                return { ...section, checked: checked };
            }
            return section;
        });
        
        // Update column keys after checkbox change
        this.syncColumnKeysWithSections();
        
        console.log('✅ After section change - sections:', JSON.stringify(this.sections));
        console.log('✅ After section change - columnKeys:', JSON.stringify(this.columnKeys));
        console.log('===== handleSectionChange END =====');
    }

    // Add this helper method
    updateColumnKeys() {
        console.log('===== updateColumnKeys START =====');
        console.log('🔹 Current sections:', JSON.stringify(this.sections));
        
        // Get only checked sections in their current order - convert to plain array
        const checkedSections = this.sections.filter(section => section.checked === true);
        console.log('🔹 Checked sections:', JSON.stringify(checkedSections));
        
        // Convert to plain arrays - preserve the order from sections
        this.columnKeys = checkedSections.map(section => section.key);
        this.columnOrder = checkedSections.map((s, index) => ({
            key: s.key,
            order: index + 1
        }));
        
        console.log('✅ Updated columnKeys (plain):', JSON.stringify(this.columnKeys));
        console.log('✅ Updated columnOrder (plain):', JSON.stringify(this.columnOrder));
        
        // 🔥 CRITICAL: Force the sections to maintain their order
        // Re-sort sections based on the order property
        this.sections = this.sections.map(sec => {
            const orderIndex = this.columnOrder.findIndex(co => co.key === sec.key);
            if (orderIndex !== -1 && sec.checked) {
                return { ...sec, order: orderIndex + 1 };
            }
            return sec;
        });
        
        console.log('🔹 Sections after ensuring order:', JSON.stringify(this.sections));
        console.log('===== updateColumnKeys END =====');
    }

    async handleTemplateChange(event) {
        console.log('===== handleTemplateChange START =====');
        const value = event.detail.value;
        console.log('🔹 Selected template value:', value);
        
        const selectedOption = this.templatesforShiftReport.find(option => option.value === value);
        this.selectedTemplateLabel = selectedOption ? selectedOption.label : null;
        console.log('🔹 Selected template label:', this.selectedTemplateLabel);

        if (value === 'NEW') {
            console.log('🔹 Template is NEW, storing previous ID:', this.selectedTemplateId);
            this.previousTemplateId = this.selectedTemplateId;
        }

        this.selectedTemplateId = value;
        this.hasUnsavedChanges = false;
        console.log('🔹 selectedTemplateId set to:', this.selectedTemplateId);

        if (this.selectedTemplateId === 'NEW') {
            this.isCreatingTemplate = true;
            this.newTemplateName = '';
            this.clearAllSelections();
            this.columnKeys = [];
            this.columnOrder = [];
            console.log('🔹 Creating new template, selections cleared');
            console.log('===== handleTemplateChange END (NEW) =====');
            return;
        }

        this.isCreatingTemplate = false;
        console.log('🔹 isCreatingTemplate set to false');
        
        // Build sections if they don't exist
        if (this.sections.length === 0) {
            console.log('🔹 No sections exist, building...');
            if (this.reportTypeValue === 'PARTICIPANT') {
                this.buildSectionsForParticipantReport();
            } else if (this.reportTypeValue === 'STAFF') {
                this.buildSectionsForStaffReport();
            } else if (this.reportTypeValue === 'OVER_EFF') {
                this.buildSectionsForUnderOverReport();
            } else {
                this.buildSectionsForReport();
            }
        }
        
        const tpl = this.templatesforShiftReport.find(t => t.value === this.selectedTemplateId);
        console.log('🔹 Found template:', tpl ? tpl.label : 'not found');

        if (tpl && tpl.json) {
            try {
                console.log('🔹 Parsing template JSON...');
                const parsed = JSON.parse(tpl.json);
                console.log('🔹 Parsed template:', Object.keys(parsed));
                this.applyTemplate(parsed);
                
                // If template has column order, extract it
                if (parsed.columnOrder) {
                    this.columnOrder = parsed.columnOrder;
                    this.columnKeys = this.sections
                        .filter(s => s.checked)
                        .map(s => s.key);
                    console.log('✅ Loaded column order from template:', JSON.stringify(this.columnOrder));
                }
            } catch (e) {
                console.error('❌ Error parsing template:', e);
                this.clearAllSelections();
                this.columnKeys = [];
                this.columnOrder = [];
            }
        } else {
            console.log('🔹 Template has no JSON, clearing selections');
            this.clearAllSelections();
            this.columnKeys = [];
            this.columnOrder = [];
        }
        console.log('===== handleTemplateChange END =====');
    }

    handleNewTemplateNameChange(event) {
        console.log('===== handleNewTemplateNameChange START =====');
        const value = event.target.value;
        console.log('🔹 New template name:', value);
        this.newTemplateName = value;
        console.log('===== handleNewTemplateNameChange END =====');
    }

    handleConfirmNewTemplate() {
        console.log('===== handleConfirmNewTemplate START =====');
        const name = (this.newTemplateName || '').trim();
        console.log('🔹 Template name to confirm:', name);
        
        if (!name) {
            console.warn('⚠️ Template name is empty');
            this.showToast('Error', 'Enter template name', 'error');
            console.log('===== handleConfirmNewTemplate END (empty) =====');
            return;
        }

        const exists = this.templatesforShiftReport.some(t => (t.label || '').toLowerCase() === name.toLowerCase());
        if (exists) {
            console.warn('⚠️ Template name already exists:', name);
            this.showToast('Error', 'Template name already exists', 'error');
            console.log('===== handleConfirmNewTemplate END (exists) =====');
            return;
        }

        const tempId = 'TMP_' + Date.now();
        console.log('🔹 Creating new template with ID:', tempId);
        this.templatesforShiftReport = [...this.templatesforShiftReport, { label: name, value: tempId, json: null }];
        this.selectedTemplateId = tempId;
        this.isCreatingTemplate = false;
        console.log('✅ New template created successfully');
        console.log('===== handleConfirmNewTemplate END =====');
    }

    handleCancelNewTemplate() {
        console.log('===== handleCancelNewTemplate START =====');
        this.isCreatingTemplate = false;
        this.newTemplateName = '';
        console.log('🔹 isCreatingTemplate set to false, name cleared');

        if (this.previousTemplateId) {
            console.log('🔹 Restoring previous template:', this.previousTemplateId);
            this.selectedTemplateId = this.previousTemplateId;
        } else {
            const first = this.templatesforShiftReport.find(t => t.value !== 'NEW');
            this.selectedTemplateId = first ? first.value : 'NEW';
            console.log('🔹 Selected first template:', this.selectedTemplateId);
        }
        this.previousTemplateId = null;
        console.log('===== handleCancelNewTemplate END =====');
    }

    // ============ DRAG & DROP ============
    handleDragStart(event) {
        console.log('===== handleDragStart START =====');
        const index = Number(event.currentTarget.dataset.index);
        this.dragStartIndex = index;
        console.log('🔹 Drag start index:', index);
        console.log('===== handleDragStart END =====');
    }

    handleDragOver(event) {
        event.preventDefault();
        console.log('🔹 Drag over event prevented');
    }

    handleDrop(event) {
        console.log('===== handleDrop START =====');
        event.preventDefault();
        const dragEndIndex = Number(event.currentTarget.dataset.index);
        console.log('🔹 Drag end index:', dragEndIndex);
        console.log('🔹 Drag start index:', this.dragStartIndex);

        if (this.dragStartIndex === null || this.dragStartIndex === dragEndIndex) {
            console.log('🔹 No change needed, indices same');
            console.log('===== handleDrop END (no change) =====');
            return;
        }

        const updated = [...this.sections];
        const [movedItem] = updated.splice(this.dragStartIndex, 1);
        updated.splice(dragEndIndex, 0, movedItem);
        console.log('🔹 Item moved from', this.dragStartIndex, 'to', dragEndIndex);

        // Update sections with new order
        this.sections = updated.map((item, index) => ({ 
            ...item, 
            order: index + 1 
        }));
        this.dragStartIndex = null;
        console.log('🔹 Sections updated with new order');
        
        // 🔥 CRITICAL: Update column keys after reordering
        this.syncColumnKeysWithSections();
        
        console.log('✅ After drop - sections:', JSON.stringify(this.sections));
        console.log('✅ After drop - columnKeys:', JSON.stringify(this.columnKeys));
        console.log('✅ After drop - columnOrder:', JSON.stringify(this.columnOrder));
        console.log('===== handleDrop END =====');
    }

    saveColumnOrderToTemplate() {
        console.log('===== saveColumnOrderToTemplate START =====');
        // Get the current order of checked sections
        const order = this.sections
            .filter(s => s.checked)
            .map((s, index) => ({
                key: s.key,
                order: index + 1
            }));
        
        this.columnOrder = order;
        console.log('✅ Saved column order:', JSON.stringify(this.columnOrder));
        console.log('===== saveColumnOrderToTemplate END =====');
    }

    // ============ GETTERS ============
    get allStaffTabClass() { 
        const cls = this.isAllStaff ? 'active' : '';
        console.log('🔹 allStaffTabClass:', cls);
        return cls; 
    }
    
    get individualStaffTabClass() { 
        const cls = this.isIndividualStaff ? 'active' : '';
        console.log('🔹 individualStaffTabClass:', cls);
        return cls; 
    }

    get favoritesGridStyle() {
        const count = this.favoriteReports.length;
        let gridTemplateColumns;
        if (count <= 3) {
            const width = `${100 / count}%`;
            gridTemplateColumns = `repeat(${count}, ${width})`;
        } else {
            gridTemplateColumns = `repeat(${count}, 1fr)`;
        }
        const style = `display: grid; grid-template-columns: ${gridTemplateColumns}; gap: 1rem;`;
        console.log('🔹 favoritesGridStyle:', style);
        return style;
    }

    get reportCardStyle() {
        const count = this.favoriteReports.length;
        let maxWidth = 'none';
        if (count === 3) maxWidth = '350px';
        else if (count === 4) maxWidth = '300px';
        else if (count >= 5) maxWidth = '280px';
        const style = `max-width: ${maxWidth}; width: 100%;`;
        console.log('🔹 reportCardStyle:', style);
        return style;
    }

    get favoriteCount() { 
        console.log('🔹 favoriteCount:', this.favoriteReports.length);
        return this.favoriteReports.length; 
    }
    
    get hasFavorites() { 
        const has = this.favoriteReports.length > 0;
        console.log('🔹 hasFavorites:', has);
        return has; 
    }
    
    // ============ GETTERS ============
    get hasGeneratedReports() { 
        const has = this.generatedReports && this.generatedReports.length > 0;
        console.log('🔹 hasGeneratedReports:', has);
        return has; 
    }
    
    get paginatedAllReports() {
        const reports = this.pagedGeneratedReports || [];
        console.log('🔹 paginatedAllReports count:', reports.length);
        return reports;
    }
    
    get hasAllGeneratedReports() { 
        const has = this.allGeneratedReports && this.allGeneratedReports.length > 0;
        console.log('🔹 hasAllGeneratedReports:', has);
        return has; 
    }
    
    get hasRecordsToDisplay() { 
        const has = this.recordsToDisplay.length > 0;
        console.log('🔹 hasRecordsToDisplay:', has);
        return has; 
    }
    
    get favoriteIcon() { 
        const icon = this.isFavorite ? 'utility:favorite' : 'utility:favorite_alt';
        console.log('🔹 favoriteIcon:', icon);
        return icon; 
    }
    
    get favoriteVariant() { 
        const variant = this.isFavorite ? 'brand' : 'border-filled';
        console.log('🔹 favoriteVariant:', variant);
        return variant; 
    }

    get showRolesSection() {
        if (!this.reportTypeValue) {
            console.log('🔹 showRolesSection: false (no report type)');
            return false;
        }

        const isStaffValid = this.isAllStaff || (this.isIndividualStaff && this.selectedStaffId);

        if (this.reportTypeValue === 'SHIFT') {
            const show = !!(this.selectedDateRange && this.selectedEmploymentType && this.selectedLocation && isStaffValid);
            console.log('🔹 showRolesSection (SHIFT):', show);
            return show;
        }
        if (this.reportTypeValue === 'REJECTED_SHIFT') {
            const show = !!(this.selectedDateRange && this.selectedEmploymentType && isStaffValid);
            console.log('🔹 showRolesSection (REJECTED_SHIFT):', show);
            return show;
        }
        if (this.reportTypeValue === 'STAFF') {
            const show = !!(this.selectedstaffStatus && this.selectedEmploymentType);
            console.log('🔹 showRolesSection (STAFF):', show);
            return show;
        }
        if (this.reportTypeValue === 'PARTICIPANT') {
            const show = !!this.selectedstaffStatus;
            console.log('🔹 showRolesSection (PARTICIPANT):', show);
            return show;
        }
        if (this.reportTypeValue === 'OVER_EFF') {
            const show = !!(this.selectedDateRange && this.selectedEmploymentType && isStaffValid);
            console.log('🔹 showRolesSection (OVER_EFF):', show);
            return show;
        }
        console.log('🔹 showRolesSection: false (no match)');
        return false;
    }

    // ============ SECTION BUILDERS ============
    buildSectionsForStaffReport() {
        console.log('===== buildSectionsForStaffReport START =====');
        this.sections = [
            { key: 'STAFF_NAME', label: 'Staff Name', checked: false, order: 1 },
            { key: 'EMAIL', label: 'Email', checked: false, order: 2 },
            { key: 'CONTACT_NUMBER', label: 'Contact Number', checked: false, order: 3 },
            { key: 'GENDER', label: 'Gender', checked: false, order: 4 },
            { key: 'DOB', label: 'Date of Birth', checked: false, order: 5 },
            { key: 'STATUS', label: 'Status', checked: false, order: 6 }
        ];
        console.log('✅ Staff sections built:', this.sections.length);
        console.log('===== buildSectionsForStaffReport END =====');
    }

    buildSectionsForParticipantReport() {
        console.log('===== buildSectionsForParticipantReport START =====');
        this.sections = [
            { key: 'PARTICIPANT_NAME', label: 'Participant Name', checked: false, order: 1 },
            { key: 'PARTICIPANT_EMAIL', label: 'Email', checked: false, order: 2 },
            { key: 'PARTICIPANT_CONTACT', label: 'Contact Number', checked: false, order: 3 },
            { key: 'PARTICIPANT_GENDER', label: 'Gender', checked: false, order: 4 },
            { key: 'PARTICIPANT_TYPE', label: 'Participant Type', checked: false, order: 5 },
            { key: 'PARTICIPANT_STATUS', label: 'Status', checked: false, order: 6 }
        ];
        console.log('✅ Participant sections built:', this.sections.length);
        console.log('===== buildSectionsForParticipantReport END =====');
    }

    buildSectionsForUnderOverReport() {
        console.log('===== buildSectionsForUnderOverReport START =====');
        this.sections = [
            { key: 'STAFF_NAME', label: 'Staff Name', checked: false, order: 1 },
            { key: 'SET_HOURS', label: 'Set Hrs(SH)', checked: false, order: 2 },
            { key: 'ROSTERED_HOURS', label: 'Rostered Hrs(RH)', checked: false, order: 3 },
            { key: 'COMPLETED_HOURS', label: 'Completed Hrs(CH)', checked: false, order: 4 },
            { key: 'RH_VARIANCE', label: 'RH Variance(RH-SH)', checked: false, order: 5 },
            { key: 'CH_VARIANCE', label: 'CH Variance(CH-SH)', checked: false, order: 6 },
            { key: 'STATUS', label: 'Status', checked: false, order: 7 }
        ];
        console.log('✅ Under/Over sections built:', this.sections.length);
        console.log('===== buildSectionsForUnderOverReport END =====');
    }

    // ============ REJECTED SHIFT HELPERS ============
    buildRejectedStaffList(result) {
        console.log('===== buildRejectedStaffList START =====');
        console.log('🔹 Result length:', result?.length || 0);
        
        const staffMap = new Map();
        (Array.isArray(result) ? result : []).forEach((w, index) => {
            const staff = w?.shift?.Staff__r;
            if (staff && staff.Id) {
                console.log(`🔹 Staff ${index + 1}:`, staff.Id, staff.Display_Nickname__c || staff.Name);
                staffMap.set(staff.Id, {
                    Id: staff.Id,
                    Name: staff.Display_Nickname__c || staff.Name
                });
            }
        });
        this.staffList = [...staffMap.values()];
        this.filteredStaffList = [...this.staffList];
        console.log('✅ Staff list built, count:', this.staffList.length);
        console.log('===== buildRejectedStaffList END =====');
    }

    normalizeRejectedShift(wrapper) {
        console.log('===== normalizeRejectedShift START =====');
        const s = wrapper?.shift;
        if (!s) {
            console.warn('⚠️ No shift in wrapper');
            console.log('===== normalizeRejectedShift END (no shift) =====');
            return {};
        }
        console.log('🔹 Shift ID:', s.Id);

        const normalized = {
            Id: s.Id,
            date: s.Date__c,
            formattedDate: s.Date__c ? new Date(s.Date__c).toLocaleDateString('en-GB') : '',
            staffName: s.Staff__r?.Display_Nickname__c || s.Staff__r?.Name || '—',
            staffEmail: s.Staff__r?.Email_Address__c || '',
            facility: s.Add_Shift__r?.Facility__r?.Name || this.selectedFacilityLabel || '',
            role: s.Add_Shift__r?.Role__c || '',
            shiftType: s.Add_Shift__r?.Shift_Type__c || '',
            timings: s.Add_Shift__r?.Shift_Start_End_Time__c || '',
            duration: s.Duration__c || '',
            comments: s.RejectedComments__c || '',
            reassignedStaffName: wrapper?.reassignedStaffName || 'No',
            rejectedDate: s.LastModifiedDate ? new Date(s.LastModifiedDate).toLocaleString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            }) : '',
            reassignedDate: wrapper?.reassignedDate ? new Date(wrapper.reassignedDate).toLocaleString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            }) : '',
            participant: s.Services_and_Support_Plans__r?.[0]?.Participant_Name__c || '',
            serviceType: s.Services_and_Support_Plans__r?.[0]?.Service_Type_Name__c || '',
            checklist: s.Add_Shift_Checklists__r?.map(c => c.Description__c).join(' | ') || ''
        };
        console.log('✅ Normalized shift:', {
            Id: normalized.Id,
            staffName: normalized.staffName,
            facility: normalized.facility,
            rejectedDate: normalized.rejectedDate
        });
        console.log('===== normalizeRejectedShift END =====');
        return normalized;
    }

    calculateRejectedMetrics() {
        console.log('===== calculateRejectedMetrics START =====');
        const data = Array.isArray(this.rejectedFilteredRecords) ? this.rejectedFilteredRecords : [];
        console.log('🔹 Data length:', data.length);

        this.totalRejected = data.length;
        console.log('🔹 totalRejected:', this.totalRejected);

        const start = this.startDate ? new Date(this.startDate) : null;
        const end = this.endDate ? new Date(this.endDate) : null;

        if (start && end && !isNaN(start) && !isNaN(end)) {
            const days = Math.max(1, (end - start) / 86400000 + 1);
            this.avgPerWeek = (this.totalRejected / (days / 7)).toFixed(1);
            console.log('🔹 avgPerWeek:', this.avgPerWeek);
        } else {
            this.avgPerWeek = '0.0';
            console.log('🔹 avgPerWeek set to 0.0 (invalid dates)');
        }

        const staffMap = {};
        const roleMap = {};

        data.forEach(r => {
            if (r.staffName) staffMap[r.staffName] = (staffMap[r.staffName] || 0) + 1;
            if (r.role) roleMap[r.role] = (roleMap[r.role] || 0) + 1;
        });

        this.uniqueStaff = Object.keys(staffMap).length;
        console.log('🔹 uniqueStaff:', this.uniqueStaff);

        let max = 0;
        let role = 'N/A';
        Object.entries(roleMap).forEach(([k, v]) => {
            if (v > max) { max = v; role = k; }
        });

        this.mostRejectedRole = role;
        this.mostRejectedRoleCount = max;
        console.log('🔹 mostRejectedRole:', this.mostRejectedRole, 'Count:', this.mostRejectedRoleCount);
        console.log('===== calculateRejectedMetrics END =====');
    }

    // ============ STATUS CHANGE ============
    handleStatusChange(event) {
        console.log('===== handleStatusChange START =====');
        const value = event.detail.value;
        console.log('🔹 Status changed to:', value);
        this.statusValue = value;
        console.log('===== handleStatusChange END =====');
    }

    // ============ EXPAND ============
    handleExpand(event) {
        console.log('===== handleExpand START =====');
        event.preventDefault();
        console.log('🔹 selectedFacilityId:', this.selectedFacilityId);
        
        console.log('🔹 Calling getAllReportExportLogs...');
        getAllReportExportLogs({ facilityId: this.selectedFacilityId })
            .then(data => {
                console.log('✅ Expanded reports received, count:', data?.length || 0);
                this.allGeneratedReports = data.map((row, index) => {
                    console.log(`🔹 Expanded report ${index + 1}:`, row.Id);
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
                console.log('🔹 Setting up pagination for expanded view...');
                this.setupPagination();
                console.log('✅ Expanded view set up successfully');
            })
            .catch(error => {
                console.error('❌ Failed to load expanded reports:', error);
                console.error('🔹 Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            });
        console.log('===== handleExpand END =====');
    }

    // ============ GENERATED REPORT PAGINATION SETUP ============
    setupPagination() {
        console.log('===== setupPagination START =====');
        console.log('🔹 isExpandedView:', this.isExpandedView);
        console.log('🔹 allGeneratedReports length:', this.allGeneratedReports?.length || 0);
        console.log('🔹 generatedReports length:', this.generatedReports?.length || 0);
        
        const sourceData = this.isExpandedView ? this.allGeneratedReports : this.generatedReports;
        console.log('🔹 Source data length:', sourceData?.length || 0);
        
        this.totalRecords = sourceData.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize) || 1;
        console.log('🔹 totalRecords:', this.totalRecords, 'totalPages:', this.totalPages);
        
        this.updatePaginatedRecords();
        console.log('===== setupPagination END =====');
    }

    updatePaginatedRecords() {
        console.log('===== updatePaginatedRecords START =====');
        console.log('🔹 isExpandedView:', this.isExpandedView);
        console.log('🔹 pageNumber:', this.pageNumber);
        console.log('🔹 pageSize:', this.pageSize);
        
        const sourceData = this.isExpandedView ? this.allGeneratedReports : this.generatedReports;
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.paginatedAllReports = sourceData.slice(start, end);
        this.updateAllButtonStates();
        
        console.log('✅ Paginated records updated:', {
            start: start,
            end: end,
            displayedCount: this.paginatedAllReports?.length || 0
        });
        console.log('===== updatePaginatedRecords END =====');
    }

    updateAllButtonStates() {
        this.disableAllFirst = this.pageNumber <= 1;
        this.disableAllLast = this.pageNumber >= this.totalPages;
        console.log('🔹 All button states:', {
            firstDisabled: this.disableAllFirst,
            lastDisabled: this.disableAllLast
        });
    }

    handleAllRecordsPerPage(event) {
        console.log('===== handleAllRecordsPerPage START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 All records per page changed to:', value);
        this.pageSize = value;
        this.pageNumber = 1;
        this.setupPagination();
        console.log('===== handleAllRecordsPerPage END =====');
    }

    firstAllPage() { 
        console.log('🔹 All first page clicked');
        this.pageNumber = 1; 
        this.updatePaginatedRecords(); 
    }
    
    lastAllPage() { 
        console.log('🔹 All last page clicked');
        this.pageNumber = this.totalPages; 
        this.updatePaginatedRecords(); 
    }
    
    previousAllPage() { 
        console.log('🔹 All previous page clicked');
        if (this.pageNumber > 1) { 
            this.pageNumber--; 
            this.updatePaginatedRecords(); 
        } 
    }
    
    nextAllPage() { 
        console.log('🔹 All next page clicked');
        if (this.pageNumber < this.totalPages) { 
            this.pageNumber++; 
            this.updatePaginatedRecords(); 
        } 
    }

    // ============ BASE64 CONVERSIONS ============
    convertCsvToBase64FromTemplate(templateKeys, rows) {
        console.log('===== convertCsvToBase64FromTemplate START =====');
        console.log('🔹 templateKeys:', templateKeys);
        console.log('🔹 rows count:', rows?.length || 0);
        
        const headers = templateKeys.map(k => this.templateKeyToLabelMap?.[k] || k);
        console.log('🔹 Headers:', headers);
        
        let csv = '';
        csv += headers.join(',') + '\n';

        rows.forEach((row, index) => {
            const values = templateKeys.map(key => {
                const fieldPath = this.templateKeyToFieldMap?.[key];
                const value = fieldPath ? this.getValueByPath(row, fieldPath) : '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\n';
        });

        const base64 = btoa(unescape(encodeURIComponent(csv)));
        this.base64 = base64;
        console.log('🔹 base64 length:', base64.length);

        const today = new Date().toISOString().split('T')[0];
        const filePrefix = this.getReportFilePrefix();
        this.fileName = `${filePrefix}_${today}.csv`;
        console.log('🔹 File name:', this.fileName);
        console.log('===== convertCsvToBase64FromTemplate END =====');

        return { fileName: this.fileName, base64Data: base64 };
    }

    async convertPdfToBase64FromTemplate(templateKeys, rows) {
        console.log('===== convertPdfToBase64FromTemplate START =====');
        console.log('🔹 templateKeys:', templateKeys);
        console.log('🔹 rows count:', rows?.length || 0);
        console.log('🔹 jsPDFInitialized:', this.jsPDFInitialized);
        
        // 🔥 FIX: Check if jsPDF is loaded and ready
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded');
            // Try to load it again
            await this.loadPdfLibraries();
            if (!this.jsPDFInitialized) {
                console.error('❌ jsPDF still not loaded after retry');
                throw new Error('PDF library not available');
            }
        }

        const { jsPDF } = window.jspdf;
        
        // 🔥 FIX: Check if autoTable is attached
        if (typeof jsPDF.API.autoTable !== 'function') {
            console.error('❌ autoTable not attached to jsPDF');
            if (typeof window.autoTable === 'function') {
                window.autoTable(jsPDF.API);
                console.log('✅ autoTable manually attached');
            } else {
                throw new Error('autoTable not available');
            }
        }

        console.log('🔹 Creating PDF document...');
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Add header
        let startPosition = this.addOrganisationPdfHeader(doc);
        console.log('🔹 Header added at position:', startPosition);

        // Prepare headers and body
        const headers = templateKeys.map(k => this.templateKeyToLabelMap?.[k] || k);
        console.log('🔹 Headers:', headers);
        
        const body = rows.map((row) =>
            templateKeys.map(key => {
                const fieldPath = this.templateKeyToFieldMap?.[key];
                return fieldPath ? this.getValueByPath(row, fieldPath) : '';
            })
        );
        console.log('🔹 Body rows:', body.length);

        // Add title
        let title = 'Shift Report';
        if (this.reportTypeValue === 'REJECTED_SHIFT') title = 'Rejected Shift Report';
        else if (this.reportTypeValue === 'REIMBURSEMENT') title = 'Reimbursement Report';
        else if (this.reportTypeValue === 'STAFF') title = 'Staff Report';
        else if (this.reportTypeValue === 'PARTICIPANT') title = 'Participant Report';
        else if (this.reportTypeValue === 'Participant_Service_Delivery') title = 'Participant Service Report';
        else if (this.reportTypeValue === 'OVER_EFF') title = 'Under / Over Efficiency Report';

        doc.setFontSize(14);
        doc.text(title, 14, startPosition);
        console.log('🔹 Title added:', title);

        // Add table
        console.log('🔹 Adding autoTable to PDF...');
        doc.autoTable({
            head: [headers],
            body: body,
            startY: startPosition + 8,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186], textColor: 255 }
        });

        // Convert to base64
        console.log('🔹 Converting PDF to base64...');
        const blob = doc.output('blob');
        console.log('🔹 Blob size:', blob.size);
        
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => { 
                const result = reader.result.split(',')[1];
                console.log('🔹 Base64 length:', result?.length || 0);
                if (!result || result.length === 0) {
                    reject(new Error('Failed to generate base64 data'));
                } else {
                    resolve(result);
                }
            };
            reader.onerror = () => {
                reject(new Error('Failed to read blob'));
            };
            reader.readAsDataURL(blob);
        });

        this.base64 = base64;
        const today = new Date().toISOString().split('T')[0];
        const filePrefix = this.getReportFilePrefix();
        this.fileName = `${filePrefix}_${today}.pdf`;
        console.log('🔹 File name:', this.fileName);
        console.log('✅ PDF converted to base64 successfully');
        console.log('===== convertPdfToBase64FromTemplate END =====');

        return { fileName: this.fileName, base64Data: base64 };
    }

    // ============ HANDLE CHANGE ============
    handleChange(event) {
        console.log('===== handleChange START =====');
        const field = event.target.name;
        const value = event.detail.value;
        console.log('🔹 Field:', field, 'Value:', value);

        if (field === 'employmentType') {
            this.selectedEmploymentType = value;
            console.log('🔹 selectedEmploymentType updated:', this.selectedEmploymentType);
        } else if (field === 'location') {
            this.selectedLocation = value;
            console.log('🔹 selectedLocation updated:', this.selectedLocation);
        } else if (field === 'staffStatus') {
            this.selectedstaffStatus = value;
            console.log('🔹 selectedstaffStatus updated:', this.selectedstaffStatus);
        }

        this.updateGenerateButtonState();
        console.log('===== handleChange END =====');
    }

    // ============ GENERATED REPORT PAGE SIZE ============
    handleGeneratedPageSize(event) {
        console.log('===== handleGeneratedPageSize START =====');
        const value = parseInt(event.target.value, 10);
        console.log('🔹 Generated page size changed to:', value);
        this.pageSize = value;
        this.pageNumber = 1;
        this.updateGeneratedPagination();
        console.log('===== handleGeneratedPageSize END =====');
    }

    handleGeneratedFirst() { 
        console.log('🔹 Generated first page clicked');
        this.pageNumber = 1; 
        this.updateGeneratedPagination(); 
    }
    
    handleGeneratedPrevious() { 
        console.log('🔹 Generated previous page clicked');
        if (this.pageNumber > 1) { 
            this.pageNumber--; 
            this.updateGeneratedPagination(); 
        } 
    }
    
    handleGeneratedNext() { 
        console.log('🔹 Generated next page clicked');
        if (this.pageNumber < this.totalPages) { 
            this.pageNumber++; 
            this.updateGeneratedPagination(); 
        } 
    }
    
    handleGeneratedLast() { 
        console.log('🔹 Generated last page clicked');
        this.pageNumber = this.totalPages; 
        this.updateGeneratedPagination(); 
    }

    // ============ SUMMARY EXPORT ============
    handleSummaryExport(event) {
        console.log('===== handleSummaryExport START =====');
        const type = event.currentTarget.dataset.type;
        console.log('🔹 Export type:', type);
        console.log('🔹 reportTypeValue:', this.reportTypeValue);
        
        if (this.reportTypeValue === 'SHIFT') {
            if (type === 'csv') this.downloadShiftReportCSV();
            else if (type === 'pdf') this.downloadShiftReportPDF();
        } else if (this.reportTypeValue === 'REJECTED_SHIFT') {
            if (type === 'csv') this.downloadRejectedShiftCSV();
            else if (type === 'pdf') this.downloadRejectedShiftPDF();
        } else if (this.reportTypeValue === 'REIMBURSEMENT') {
            if (type === 'csv') this.downloadReimbursementCSV();
            else if (type === 'pdf') this.downloadReimbursementPDF();
        } else if (this.reportTypeValue === 'STAFF') {
            if (type === 'csv') this.downloadStaffReportCSV();
            else if (type === 'pdf') this.downloadStaffReportPDF();
        } else if (this.reportTypeValue === 'PARTICIPANT') {
            if (type === 'csv') this.downloadParticipantReportCSV();
            else if (type === 'pdf') this.downloadParticipantReportPDF();
        } else if (this.reportTypeValue === 'OVER_EFF') {
            if (type === 'csv') this.downloadUnderOverEfficiencyCSV();
            else if (type === 'pdf') this.downloadUnderOverEfficiencyPDF();
        }
        this.isDropdownOpen = false;
        console.log('===== handleSummaryExport END =====');
    }

    // ============ DOWNLOAD SHIFT CSV ============
    downloadShiftReportCSV() {
        console.log('===== downloadShiftReportCSV START =====');
        const rows = this.filteredRecords;
        console.log('🔹 Rows count:', rows?.length || 0);
        
        if (!rows || rows.length === 0) {
            console.warn('⚠️ No data available');
            this.showToast('Info', 'No data available', 'info');
            console.log('===== downloadShiftReportCSV END (no data) =====');
            return;
        }

        let csvContent = 'Shift Report\n';
        csvContent += `Start Date:,${this.startDate || ''}\n`;
        csvContent += `End Date:,${this.endDate || ''}\n\n`;

        const headers = ['Staff', 'Date', 'Shift Type', 'Shift Time', 'Role', 'Participants', 'Status'];
        csvContent += headers.join(',') + '\n';

        rows.forEach(row => {
            const values = [row.staffName, row.date, row.shiftType, row.shiftTime, row.role, row.participants, row.status];
            const escaped = values.map(value => `"${(value ?? '').toString().replace(/"/g, '""')}"`);
            csvContent += escaped.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `Shift_Report_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Shift CSV downloaded');
        console.log('===== downloadShiftReportCSV END =====');
    }

    // ============ DOWNLOAD SHIFT PDF ============
    downloadShiftReportPDF() {
        console.log('===== downloadShiftReportPDF START =====');
        console.log('🔹 jsPDFInitialized:', this.jsPDFInitialized);
        console.log('🔹 rows count:', this.filteredRecords?.length || 0);
        
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded yet');
            console.log('===== downloadShiftReportPDF END (not loaded) =====');
            return;
        }

        const rows = this.filteredRecords;
        if (!rows || rows.length === 0) {
            console.warn('⚠️ No data available');
            this.showToast('Info', 'No data available', 'info');
            console.log('===== downloadShiftReportPDF END (no data) =====');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        let startPosition = this.addOrganisationPdfHeader(doc);

        doc.setFontSize(18);
        doc.text('Shift Report', 14, startPosition);
        doc.setFontSize(11);
        doc.text(`Start Date: ${this.startDate || ''}`, 14, 30);
        doc.text(`End Date: ${this.endDate || ''}`, 14, 36);

        const tableColumn = ['Staff', 'Date', 'Shift Type', 'Shift Time', 'Role', 'Participants', 'Status'];
        const tableRows = rows.map(row => [row.staffName || '', row.date || '', row.shiftType || '', row.shiftTime || '', row.role || '', row.participants || '', row.status || '']);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startPosition + 8,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Shift_Report_${today}.pdf`);
        console.log('✅ Shift PDF downloaded');
        console.log('===== downloadShiftReportPDF END =====');
    }

    // ============ DOWNLOAD REJECTED SHIFT CSV ============
    downloadRejectedShiftCSV() {
        console.log('===== downloadRejectedShiftCSV START =====');
        const rows = this.rejectedFilteredRecords;
        console.log('🔹 Rows count:', rows?.length || 0);
        
        if (!rows || !rows.length) {
            console.warn('⚠️ No rejected shift data available');
            this.showToast('Info', 'No rejected shift data available', 'info');
            console.log('===== downloadRejectedShiftCSV END (no data) =====');
            return;
        }

        let csv = 'Rejected Shift Report\n';
        csv += `Start Date:,${this.startDate || ''}\n`;
        csv += `End Date:,${this.endDate || ''}\n\n`;

        const headers = ['Date', 'Staff', 'Facility', 'Role', 'Shift Type', 'Participant Name', 'Comments', 'Rejected At', 'Reassigned To', 'Reassigned Time'];
        csv += headers.join(',') + '\n';

        rows.forEach(r => {
            const values = [r.formattedDate, r.staffName, r.facility, r.role, r.shiftType, r.participant, r.comments, r.rejectedDate, r.reassignedStaffName, r.reassignedDate];
            const escaped = values.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`);
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
        console.log('✅ Rejected Shift CSV downloaded');
        console.log('===== downloadRejectedShiftCSV END =====');
    }

    // ============ DOWNLOAD REJECTED SHIFT PDF ============
    downloadRejectedShiftPDF() {
        console.log('===== downloadRejectedShiftPDF START =====');
        console.log('🔹 jsPDFInitialized:', this.jsPDFInitialized);
        console.log('🔹 rows count:', this.rejectedFilteredRecords?.length || 0);
        
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded');
            console.log('===== downloadRejectedShiftPDF END (not loaded) =====');
            return;
        }

        const rows = this.rejectedFilteredRecords;
        if (!rows || !rows.length) {
            console.warn('⚠️ No rejected shift data available');
            this.showToast('Info', 'No rejected shift data available', 'info');
            console.log('===== downloadRejectedShiftPDF END (no data) =====');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        let startPosition = this.addOrganisationPdfHeader(doc);

        doc.setFontSize(16);
        doc.text('Rejected Shift Report', 14, startPosition);
        doc.setFontSize(11);
        doc.text(`Start Date: ${this.startDate || ''}`, 14, 26);
        doc.text(`End Date: ${this.endDate || ''}`, 14, 32);

        const headers = ['Date', 'Staff', 'Facility', 'Role', 'Shift Type', 'Participant Name', 'Comments', 'Rejected At', 'Reassigned To', 'Reassigned Time'];
        const body = rows.map(r => [r.formattedDate || '', r.staffName || '', r.facility || '', r.role || '', r.shiftType || '', r.participant || '', r.comments || '', r.rejectedDate || '', r.reassignedStaffName || '', r.reassignedDate || '']);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: startPosition + 8,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Rejected_Shift_Report_${today}.pdf`);
        console.log('✅ Rejected Shift PDF downloaded');
        console.log('===== downloadRejectedShiftPDF END =====');
    }

    // ============ DOWNLOAD REIMBURSEMENT CSV ============
    downloadReimbursementCSV() {
        console.log('===== downloadReimbursementCSV START =====');
        const rows = this.reimbursementAllRecords;
        console.log('🔹 Rows count:', rows?.length || 0);
        
        if (!rows || !rows.length) {
            console.warn('⚠️ No reimbursement data available');
            this.showToast('Info', 'No reimbursement data available', 'info');
            console.log('===== downloadReimbursementCSV END (no data) =====');
            return;
        }

        let csv = 'Reimbursement Report\n';
        csv += `Start Date:,${this.startDate || ''}\n`;
        csv += `End Date:,${this.endDate || ''}\n`;
        csv += `Status:,${this.statusValue || 'All'}\n\n`;

        const headers = ['Res No', 'Staff', 'Shift Date', 'Mileage in KM', 'Type of Vehicle', 'Cost per KM', 'Mileage Amount', 'Amount', 'Total Amount', 'Status', 'Approved Date'];
        csv += headers.join(',') + '\n';

        rows.forEach(r => {
            const values = [r.Name, r.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c || '', r.ShiftDate__c || '', r.Mileage_Others__c || '', r.Type_of_Vehicle__c || '', r.Cost_per_KM__c || '', r.Mileage_Amount__c || '', r.Amount__c || '', r.Total_Amount__c || '', r.Approval_Status__c || '', r.Approved_Date__c || ''];
            const escaped = values.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`);
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
        console.log('✅ Reimbursement CSV downloaded');
        console.log('===== downloadReimbursementCSV END =====');
    }

    // ============ DOWNLOAD REIMBURSEMENT PDF ============
    downloadReimbursementPDF() {
        console.log('===== downloadReimbursementPDF START =====');
        console.log('🔹 jsPDFInitialized:', this.jsPDFInitialized);
        console.log('🔹 rows count:', this.reimbursementAllRecords?.length || 0);
        
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded');
            console.log('===== downloadReimbursementPDF END (not loaded) =====');
            return;
        }

        const rows = this.reimbursementAllRecords;
        if (!rows || !rows.length) {
            console.warn('⚠️ No reimbursement data available');
            this.showToast('Info', 'No reimbursement data available', 'info');
            console.log('===== downloadReimbursementPDF END (no data) =====');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        let startPosition = this.addOrganisationPdfHeader(doc);

        doc.setFontSize(16);
        doc.text('Reimbursement Report', 14, startPosition);
        doc.setFontSize(11);
        doc.text(`Start Date: ${this.startDate || ''}`, 14, 26);
        doc.text(`End Date: ${this.endDate || ''}`, 14, 32);
        doc.text(`Status: ${this.statusValue || 'All'}`, 14, 38);

        const headers = ['Res No', 'Staff', 'Shift Date', 'Mileage KM', 'Type of Vehicle', 'Cost/KM', 'Mileage Amount', 'Amount', 'Total', 'Status', 'Approved Date'];
        const body = rows.map(r => [r.Name || '', r.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c || '', r.ShiftDate__c || '', r.Mileage_Others__c || '', r.Type_of_Vehicle__c || '', r.Cost_per_KM__c || '', r.Mileage_Amount__c || '', r.Amount__c || '', r.Total_Amount__c || '', r.Approval_Status__c || '', r.Approved_Date__c || '']);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: startPosition + 8,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Reimbursement_Report_${today}.pdf`);
        console.log('✅ Reimbursement PDF downloaded');
        console.log('===== downloadReimbursementPDF END =====');
    }

    // ============ DOWNLOAD STAFF CSV ============
    downloadStaffReportCSV() {
        console.log('===== downloadStaffReportCSV START =====');
        const rows = this.staffAllRecords;
        console.log('🔹 Rows count:', rows?.length || 0);
        
        if (!rows || !rows.length) {
            console.warn('⚠️ No staff data available');
            this.showToast('Info', 'No staff data available', 'info');
            console.log('===== downloadStaffReportCSV END (no data) =====');
            return;
        }

        let csv = 'Staff Report\n\n';
        const headers = ['Staff Name', 'Email', 'Contact Number', 'Gender', 'Date of Birth', 'Status'];
        csv += headers.join(',') + '\n';

        rows.forEach(r => {
            const values = [r.staffName || '', r.email || '', r.contactNumber || '', r.gender || '', r.dob || '', r.status || ''];
            const escaped = values.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`);
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
        console.log('✅ Staff CSV downloaded');
        console.log('===== downloadStaffReportCSV END =====');
    }

    // ============ DOWNLOAD STAFF PDF ============
    downloadStaffReportPDF() {
        console.log('===== downloadStaffReportPDF START =====');
        console.log('🔹 jsPDFInitialized:', this.jsPDFInitialized);
        console.log('🔹 rows count:', this.staffAllRecords?.length || 0);
        
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded');
            console.log('===== downloadStaffReportPDF END (not loaded) =====');
            return;
        }

        const rows = this.staffAllRecords;
        if (!rows || !rows.length) {
            console.warn('⚠️ No staff data available');
            this.showToast('Info', 'No staff data available', 'info');
            console.log('===== downloadStaffReportPDF END (no data) =====');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        let startPosition = this.addOrganisationPdfHeader(doc);

        doc.setFontSize(16);
        doc.text('Staff Report', 14, startPosition);

        const headers = ['Staff Name', 'Email', 'Contact Number', 'Gender', 'Date of Birth', 'Status'];
        const body = rows.map(r => [r.staffName || '', r.email || '', r.contactNumber || '', r.gender || '', r.dob || '', r.status || '']);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: startPosition + 8,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Staff_Report_${today}.pdf`);
        console.log('✅ Staff PDF downloaded');
        console.log('===== downloadStaffReportPDF END =====');
    }

    // ============ DOWNLOAD PARTICIPANT CSV ============
    downloadParticipantReportCSV() {
        console.log('===== downloadParticipantReportCSV START =====');
        const rows = this.participantAllRecords;
        console.log('🔹 Rows count:', rows?.length || 0);
        
        if (!rows || !rows.length) {
            console.warn('⚠️ No participant data available');
            this.showToast('Info', 'No participant data available', 'info');
            console.log('===== downloadParticipantReportCSV END (no data) =====');
            return;
        }

        let csv = 'Participant List Report\n\n';
        const headers = ['Participant Name', 'Email', 'Contact Number', 'Gender', 'Participant Type', 'Status'];
        csv += headers.join(',') + '\n';

        rows.forEach(r => {
            const values = [r.Name || r.Name__c || '', r.Email__c || '', r.Contact_Number__c || '', r.Gender__c || '', r.ParticipantType__c || '', r.Participant_Status__c || ''];
            const escaped = values.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`);
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
        console.log('✅ Participant CSV downloaded');
        console.log('===== downloadParticipantReportCSV END =====');
    }

    // ============ DOWNLOAD PARTICIPANT PDF ============
    downloadParticipantReportPDF() {
        console.log('===== downloadParticipantReportPDF START =====');
        console.log('🔹 jsPDFInitialized:', this.jsPDFInitialized);
        console.log('🔹 rows count:', this.participantAllRecords?.length || 0);
        
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded');
            console.log('===== downloadParticipantReportPDF END (not loaded) =====');
            return;
        }

        const rows = this.participantAllRecords;
        if (!rows || !rows.length) {
            console.warn('⚠️ No participant data available');
            this.showToast('Info', 'No participant data available', 'info');
            console.log('===== downloadParticipantReportPDF END (no data) =====');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        let startPosition = this.addOrganisationPdfHeader(doc);

        doc.setFontSize(16);
        doc.text('Participant List Report', 14, startPosition);

        const headers = ['Participant Name', 'Email', 'Contact Number', 'Gender', 'Participant Type', 'Status'];
        const body = rows.map(r => [r.Name || r.Name__c || '', r.Email__c || '', r.Contact_Number__c || '', r.Gender__c || '', r.ParticipantType__c || '', r.Participant_Status__c || '']);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: startPosition + 8,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186] }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Participant_List_Report_${today}.pdf`);
        console.log('✅ Participant PDF downloaded');
        console.log('===== downloadParticipantReportPDF END =====');
    }

    // ============ DOWNLOAD UNDER/OVER CSV ============
    downloadUnderOverEfficiencyCSV() {
        console.log('===== downloadUnderOverEfficiencyCSV START =====');
        const rows = this.underOverAllRecords;
        console.log('🔹 Rows count:', rows?.length || 0);
        
        if (!rows || !rows.length) {
            console.warn('⚠️ No data available');
            this.showToast('Info', 'No data available', 'info');
            console.log('===== downloadUnderOverEfficiencyCSV END (no data) =====');
            return;
        }

        const headers = ['Staff Name', 'Set Hrs(SH)', 'Rostered Hrs(RH)', 'Completed Hrs(CH)', 'RH Variance(RH-SH)', 'CH Variance(CH-SH)', 'Status'];
        let csv = headers.join(',') + '\n';

        rows.forEach(r => {
            const values = [r.name, r.setHours, r.rosteredHours, r.completedHours, r.rhVariance, r.chVariance, r.status];
            const escaped = values.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`);
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
        console.log('✅ Under/Over CSV downloaded');
        console.log('===== downloadUnderOverEfficiencyCSV END =====');
    }

    // ============ DOWNLOAD UNDER/OVER PDF ============
    downloadUnderOverEfficiencyPDF() {
        console.log('===== downloadUnderOverEfficiencyPDF START =====');
        console.log('🔹 jsPDFInitialized:', this.jsPDFInitialized);
        console.log('🔹 rows count:', this.underOverAllRecords?.length || 0);
        
        if (!this.jsPDFInitialized || !window.jspdf) {
            console.error('❌ jsPDF not loaded');
            console.log('===== downloadUnderOverEfficiencyPDF END (not loaded) =====');
            return;
        }

        const rows = this.underOverAllRecords;
        if (!rows || !rows.length) {
            console.warn('⚠️ No data available');
            this.showToast('Info', 'No data available', 'info');
            console.log('===== downloadUnderOverEfficiencyPDF END (no data) =====');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        let startPosition = this.addOrganisationPdfHeader(doc);

        doc.setFontSize(14);
        doc.text('Under / Over Efficiency List Report', 14, startPosition);

        const headers = ['Staff Name', 'Set Hrs(SH)', 'Rostered Hrs(RH)', 'Completed Hrs(CH)', 'RH Variance(RH-SH)', 'CH Variance(CH-SH)', 'Status'];
        const body = rows.map(r => [r.name || '', r.setHours ?? '', r.rosteredHours ?? '', r.completedHours ?? '', r.rhVariance ?? '', r.chVariance ?? '', r.status || '']);

        doc.autoTable({
            head: [headers],
            body: body,
            startY: startPosition + 8,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [12, 120, 186], textColor: 255 }
        });

        const today = new Date().toISOString().split('T')[0];
        doc.save(`Under_Over_Efficiency_Report_${today}.pdf`);
        console.log('✅ Under/Over PDF downloaded');
        console.log('===== downloadUnderOverEfficiencyPDF END =====');
    }

    async generatePdfWithRetry(templateKeys, rows, maxRetries = 3) {
        console.log('===== generatePdfWithRetry START =====');
        console.log('🔹 maxRetries:', maxRetries);
        
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔹 Attempt ${attempt}/${maxRetries}`);
                
                // Ensure jsPDF is loaded
                if (!this.jsPDFInitialized) {
                    console.log('🔹 jsPDF not initialized, loading...');
                    await this.loadPdfLibraries();
                }
                
                const result = await this.convertPdfToBase64FromTemplate(templateKeys, rows);
                if (result && result.base64Data && result.base64Data.length > 0) {
                    console.log('✅ PDF generated successfully on attempt', attempt);
                    console.log('===== generatePdfWithRetry END (success) =====');
                    return result;
                } else {
                    console.warn(`⚠️ Attempt ${attempt} produced empty result`);
                    lastError = new Error('Empty PDF data generated');
                }
            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, error);
                lastError = error;
                
                // Wait before retry
                if (attempt < maxRetries) {
                    console.log(`🔹 Waiting ${attempt * 500}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 500));
                }
            }
        }
        
        console.error('❌ All attempts failed');
        console.log('===== generatePdfWithRetry END (failed) =====');
        throw lastError || new Error('Failed to generate PDF after multiple attempts');
    }
}