import { LightningElement, track } from 'lwc';
import getAllParticipants from '@salesforce/apex/SupportParticipantController.getAllParticipants';
import getParticipantCaseNotes from '@salesforce/apex/SupportCoordinationReports.getParticipantCaseNotes';
import getProviderReport from '@salesforce/apex/SupportCoordinationReports.getProviderReport';
import getParticipantUtilization from '@salesforce/apex/SupportCoordinationReports.getParticipantUtilization';
import getParticipantReconciliation from '@salesforce/apex/SupportCoordinationReports.getParticipantReconciliation';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDFLib from "@salesforce/resourceUrl/jspdf";
import autoTableLib from "@salesforce/resourceUrl/autotable";
import autoTable from "@salesforce/resourceUrl/autotable";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetailsForRoster";


export default class SupportCoordinationInDetailReport extends LightningElement {

    @track selectedType = 'all';    
    @track participantOptions = [];
    reportType = 'Case Notes';
    selectedParticipant = [];
    selectedReport = '';
    fromDate = '';
    toDate = '';
    participantflag = true;
    reportCategoryflag = false;
    fromDateflag = true;
    toDateflag = true;
    toDateflag = true;
    caseNotesData = [];
    providerData = [];
    utilizationRows = [];
    reconciliationData = [];
    @track isLoading = false;

    caseNotesPageNumber = 1;
    caseNotesPageSize = 10;
    caseNotesTotalPages = 0;
    caseNotesTotalRecords = 0;
    caseNotesPageSizeOptions = [10, 25, 50];

    providerPageNumber = 1;
    providerPageSize = 10;
    providerTotalPages = 0;
    providerTotalRecords = 0;
    providerPageSizeOptions = [10, 25, 50];

    utilizationPageNumber = 1;
    utilizationPageSize = 10;
    utilizationTotalPages = 0;
    utilizationTotalRecords = 0;
    utilizationPageSizeOptions = [10, 25, 50];

    reconciliationPageNumber = 1;
    reconciliationPageSize = 10;
    reconciliationTotalPages = 0;
    reconciliationTotalRecords = 0;
    reconciliationPageSizeOptions = [10, 25, 50];
    @track statePostal;
    @track orgLogo;
    @track orgname;

    caseNotesSearched = false;
    providerSearched = false;
    utilizationSearched = false;
    reconciliationSearched = false;
    

    reportTypeOptions = [
        { label: 'Case Notes', value: 'Case Notes' },
        { label: 'Participant', value: 'Participant' },
        { label: 'Provider', value: 'Provider' }
    ];

    reportOptions = [
        { label: 'Utilization', value: 'utilization' },
        { label: 'Reconciliation', value: 'reconciliation' },
        { label: 'Case Notes', value: 'caseNotes' }
    ];

    get allParticipantClass() {
        return this.selectedType === 'all'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    connectedCallback() {

        const today = new Date();

        const firstDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        const lastDay = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        );

        this.fromDate = this.formatDate(firstDay);
        this.toDate = this.formatDate(lastDay);

        console.log('📅 Default Date Range Initialized');
        console.log('From Date:', this.fromDate);
        console.log('To Date:', this.toDate);

        this.loadParticipants();
         this.fetchOrganizationDetails();
    }

    formatDateDDMMYYYY(dateValue) {

    if (!dateValue) {
        return '';
    }

    const date = new Date(dateValue);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}
     fetchOrganizationDetails() {
            organizationDetails()
              .then((response) => {
                const org = response.listofPriceBook;
                this.orgname = org.Name;
                this.statePostal = `${org.Address_Latest__Street__s},${org.Address_Latest__City__s}, ${org.Address_Latest__StateCode__s}, ${org.Address_Latest__PostalCode__s}`;
                this.orgLogo = response.bolbdata;
               
              })
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

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    formatDisplayDate(dateValue) {

        if (!dateValue) {
            return '';
        }

        const date = new Date(dateValue);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    async loadParticipants() {
        this.isLoading = true;

        try {
            console.log('🔄 loadParticipants() START');

            const data = await getAllParticipants();

            console.log('📦 Raw Participants:', JSON.stringify(data, null, 2));

            this.allParticipants = data;

            this.participantOptions = data.map((p, index) => {
                const participantName =
                    p.First_Name__c || p.Last_Name__c
                        ? `${p.First_Name__c || ''} ${p.Last_Name__c || ''}`.trim()
                        : p.Name || '';

                return {
                    label: participantName,
                    value: p.Id
                };
            });

            // Auto-select all participants for Case Notes
            if (this.reportType === 'Case Notes') {

                this.selectedParticipant = this.participantOptions.map(
                    participant => participant.value
                );

                console.log('✅ All Participants Selected By Default');

                console.log('📞 Calling getParticipantCaseNotes');

                const result = await getParticipantCaseNotes({
                    participantIds: this.selectedParticipant,
                    fromDate: this.fromDate,
                    toDate: this.toDate
                });

                this.processCaseNotesData(result);
            }

            console.log('🔄 loadParticipants() END');

        } catch (error) {
            console.error('❌ loadParticipants ERROR');
            console.error(error);

        } finally {
            this.isLoading = false;
        }
    }

    processCaseNotesData(result) {

        this.caseNotesSearched = true;
        console.log(
            '📦 Raw Case Notes Result',
            JSON.stringify(result, null, 2)
        );

        this.caseNotesData = [];

        result.forEach(participant => {

            if (participant.SupportNotes1__r) {

                participant.SupportNotes1__r.forEach(note => {

                    this.caseNotesData.push({
                        id: note.Id,
                        participantName:
                            `${participant.First_Name__c || ''} ${participant.Last_Name__c || ''}`.trim(),
                        date: this.formatDisplayDate(note.Entry_Date__c),
                        noteType: note.Notes_Type__c,
                        contactMethod: note.Created_From__c,
                        billable: note.Billable__c ? 'Yes' : 'No',
                        duration: note.Duration_Hours__c ?? 0,
                        rate: note.Charge_Level__c ?? 0,
                        totalCost: note.Total_Cost__c ?? 0,
                        serviceItem:
                            note.Support_CoordinatorCatalogue__r?.Support_Item_Name__c,
                        activityDetails: note.Activity_Details__c
                    });

                });

            }

        });

        console.log(
            '📋 Processed Case Notes',
            JSON.stringify(this.caseNotesData, null, 2)
        );

        console.log(
            '📊 Case Notes Count',
            this.caseNotesData.length
        );

        this.caseNotesPageNumber = 1;
        this.updateCaseNotesPagination();
    }

    handleReportTypeChange(event) {
        console.log('==============================');
        console.log('📊 Report Type Changed');
        console.log('Previous Value:', this.reportType);

        this.reportType = event.detail.value;

        // Reset dependent fields
        this.selectedParticipant = [];
        this.selectedReport = '';

        console.log('🔄 Cleared Participant and Report Category');

        if (this.reportType === 'Case Notes') {
            this.participantflag = true;
            this.reportCategoryflag = false;
            this.toDateflag = true;
            this.fromDateflag = true;
        } 
        else if (this.reportType === 'Participant') {
            this.participantflag = true;
            this.reportCategoryflag = true;
        } 
        else if (this.reportType === 'Provider') {
            this.participantflag = false;
            this.reportCategoryflag = false;
            this.toDateflag = false;
            this.fromDateflag = false;
        }

        console.log('New Value:', this.reportType);
        console.log('participantflag:', this.participantflag);
        console.log('reportCategoryflag:', this.reportCategoryflag);
        console.log('selectedParticipant:', JSON.stringify(this.selectedParticipant));
        console.log('selectedReport:', this.selectedReport);
        console.log('==============================');
    }

    handleParticipantChange(event) {

        console.log('==============================');
        console.log('👤 Participants Changed');

        const val = event.detail.value;


        // Ignore search typing
        if (!Array.isArray(val)) {
            return;
        }


        this.selectedParticipant = val.length > 0 ? val : [];


        console.log(
            'Selected Participants:',
            this.selectedParticipant
        );

        console.log(
            'Selected Participants JSON:',
            JSON.stringify(this.selectedParticipant)
        );

        console.log(
            'Number of Participants:',
            this.selectedParticipant?.length
        );

        console.log('==============================');
    }

    handleReportChange(event) {
        console.log('==============================');
        console.log('📄 Report Changed');
        console.log('Previous Value:', this.selectedReport);
        this.participantflag = true;
        this.fromDateflag = true;
        this.toDateflag = true;
        this.toDateflag = true;

        this.selectedReport = event.detail.value;
        if (this.selectedReport === 'utilization') {
            this.fromDateflag = false;
            this.toDateflag = false;
            console.log('📊 Utilization Report Selected');
        } 
        else if (this.selectedReport === 'reconciliation') {
            console.log('💰 Reconciliation Report Selected');
        } 
        else if (this.selectedReport === 'caseNotes') {
            this.reportCategoryflag = true;
            console.log('📝 Case Notes Report Selected');
        }

        console.log('New Value:', this.selectedReport);
        console.log('==============================');
    }

    handleFromDateChange(event) {
        console.log('==============================');
        console.log('📅 From Date Changed');
        console.log('Previous Value:', this.fromDate);

        this.fromDate = event.target.value;

        console.log('New Value:', this.fromDate);
        console.log('==============================');
    }

    handleToDateChange(event) {
        console.log('==============================');
        console.log('📅 To Date Changed');
        console.log('Previous Value:', this.toDate);

        this.toDate = event.target.value;

        console.log('New Value:', this.toDate);
        console.log('==============================');
    }

    formatAmount(value) {
        return Number(value || 0).toLocaleString('en-AU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    async handleGenerateReport() {
        console.log('==============================');
        console.log('📊 Generate Report Clicked');

        if (!this.reportType) {
            this.showToast(
                'Validation Error',
                'Report Type is required.',
                'error'
            );
            return;
        }

        if (
            this.participantflag &&
            (!this.selectedParticipant ||
                this.selectedParticipant.length === 0)
        ) {
            this.showToast(
                'Validation Error',
                'Please select at least one Participant.',
                'error'
            );
            return;
        }

        if (
            this.reportCategoryflag &&
            !this.selectedReport
        ) {
            this.showToast(
                'Validation Error',
                'Report Category is required.',
                'error'
            );
            return;
        }

        if (!this.fromDate || !this.toDate) {
            this.showToast(
                'Validation Error',
                'From Date and To Date are required.',
                'error'
            );
            return;
        }

        if (this.fromDate > this.toDate) {
            this.showToast(
                'Validation Error',
                'From Date cannot be greater than To Date.',
                'error'
            );
            return;
        }

        console.log('✅ Validation Successful');

        try {

            this.isLoading = true;
            this.caseNotesData = [];
            this.providerData = [];
            this.utilizationRows = [];
            this.reconciliationData = [];
            this.providerSearched = false;
            this.caseNotesSearched = false;
            this.utilizationSearched = false;
            this.reconciliationSearched = false;

            if (this.reportType === 'Provider') {
                this.providerSearched = true;
            } else if (this.reportType === 'Participant') {
                if (this.selectedReport === 'caseNotes') {
                    this.caseNotesSearched = true;
                } else if (this.selectedReport === 'utilization') {
                    this.utilizationSearched = true;
                } else if (this.selectedReport === 'reconciliation') {
                    this.reconciliationSearched = true;
                }
            } else if (this.reportType === 'Case Notes') {
                this.caseNotesSearched = true;
            }

            // Provider Report
            if (this.reportType === 'Provider') {

                console.log('📞 Calling Provider Report Apex');

                const result = await getProviderReport();

                console.log(
                    '✅ Provider Report Result:',
                    JSON.stringify(result, null, 2)
                );

                this.providerData = result || [];

                this.providerPageNumber = 1;

                this.updateProviderPagination();
            }

            // Participant Report
            else if (this.reportType === 'Participant') {

                console.log('📞 Participant Report Selected');
                console.log('Report Category:', this.selectedReport);

                // Participant -> Case Notes
                if (this.selectedReport === 'caseNotes') {

                    console.log('📞 Calling getParticipantCaseNotes');

                    this.providerData = [];
                    this.caseNotesData = [];

                    const result = await getParticipantCaseNotes({
                        participantIds: this.selectedParticipant,
                        fromDate: this.fromDate,
                        toDate: this.toDate
                    });

                    console.log(
                        '✅ Participant Case Notes Result:',
                        JSON.stringify(result, null, 2)
                    );

                    this.processCaseNotesData(result);
                }

                // Participant -> Utilization
                else if (this.selectedReport === 'utilization') {

                    console.log('📞 Calling Utilization Report Apex');

                    const result = await getParticipantUtilization({
                        participantIds: this.selectedParticipant
                    });

                    console.log(
                        '✅ Utilization Result:',
                        JSON.stringify(result, null, 2)
                    );
                    this.utilizationRows = [];

                    result.forEach(record => {

                        const participantName =
                            `${record.First_Name__c || ''} ${record.Last_Name__c || ''}`.trim();

                        const catalogueGroups =
                            (record.Support_CatalogueGroups__r || []).map(item => {

                                const planned =
                                    Number(item.BudgetAllocation__c) || 0;

                                const actual =
                                    Number(item.Budget_Spent_to_Date__c) || 0;

                                const variance = planned - actual;

                                return {
                                    participantId: record.Id,
                                    participantName,

                                    Id: item.Id,
                                    supportItemName: item.Name,

                                    planned: this.formatAmount(planned),
                                    actual: this.formatAmount(actual),
                                    variance: this.formatAmount(variance),

                                    status:
                                        variance < 0
                                            ? 'High Utilisation'
                                            : variance === 0
                                            ? 'Healthy Utilisation'
                                            : 'Low Utilisation',

                                    statusClass:
                                        variance < 0
                                            ? 'status-over'
                                            : variance === 0
                                            ? 'status-good'
                                            : 'status-under'
                                };
                            });

                        const coordinatorGroups =
                            (record.Support_CoordinatorCatalogueGroup__r || []).map(item => {

                                const planned =
                                    Number(item.BudgetAllocation__c) || 0;

                                const actual =
                                    Number(item.Budget_Spent_to_Date__c) || 0;

                                const variance = planned - actual;

                                return {
                                    participantId: record.Id,
                                    participantName,

                                    Id: item.Id,
                                    supportItemName: item.Name,

                                    planned: this.formatAmount(planned),
                                    actual: this.formatAmount(actual),
                                    variance: this.formatAmount(variance),

                                    status:
                                        variance < 0
                                            ? 'High Utilisation'
                                            : variance === 0
                                            ? 'Healthy Utilisation'
                                            : 'Low Utilisation',

                                    statusClass:
                                        variance < 0
                                            ? 'status-over'
                                            : variance === 0
                                            ? 'status-good'
                                            : 'status-under'
                                };
                            });

                        this.utilizationRows.push(
                            ...catalogueGroups,
                            ...coordinatorGroups
                        );

                        this.utilizationPageNumber = 1;
                        this.updateUtilizationPagination();
                    });

                    console.log(
                        '📊 Utilization Rows',
                        JSON.stringify(this.utilizationRows, null, 2)
                    );

                    console.log(
                        '📊 Utilization Row Count',
                        this.utilizationRows.length
                    );
                }

                // Participant -> Reconciliation
                else if (this.selectedReport === 'reconciliation') {

                    console.log('📞 Calling Reconciliation Report Apex');

                    const result = await getParticipantReconciliation({
                        participantIds: this.selectedParticipant,
                        fromDate: this.fromDate,
                        toDate: this.toDate
                    });

                    console.log(
                        '✅ Reconciliation Result:',
                        JSON.stringify(result, null, 2)
                    );

                    this.reconciliationData = [];

                    result.forEach(record => {

                        const participantName =
                            `${record.First_Name__c || ''} ${record.Last_Name__c || ''}`.trim();

                        (record.Support_Budgets__r || []).forEach(item => {

                            const planned =
                                Number(item.Total_Amount__c) || 0;

                            const actual =
                                Number(item.Actual_Amount__c) || 0;

                            const variance =
                                planned - actual;

                            this.reconciliationData.push({
                                participantId: record.Id,
                                participantName,

                                Id: item.Id,

                                date: this.formatDisplayDate(
                                    item.Budget_Date__c
                                ),

                                supportItemName:
                                    item.Service_Item__c || '',

                                planned: this.formatAmount(planned),

                                actual: this.formatAmount(actual),

                                variance: this.formatAmount(variance)
                            });

                        });

                    });

                    console.log(
                        '📊 Reconciliation Rows:',
                        this.reconciliationData.length
                    );

                    console.log(
                        '📊 Reconciliation Data:',
                        JSON.stringify(this.reconciliationData, null, 2)
                    );

                    this.reconciliationPageNumber = 1;
                    this.updateReconciliationPagination();
                }
            }

            // Case Notes Report
            else if (this.reportType === 'Case Notes') {

                console.log('📞 Calling Case Notes Apex');

                const result = await getParticipantCaseNotes({
                    participantIds: this.selectedParticipant,
                    fromDate: this.fromDate,
                    toDate: this.toDate
                });

                this.processCaseNotesData(result);
            }

        } catch (error) {
            this.showToast(
                'Error',
                error?.body?.message || error?.message || 'Something went wrong.',
                'error'
            );

            console.error('❌ Error Generating Report');
            console.error(error);
            console.error(
                error?.body?.message || error?.message
            );

        } finally {
            this.showToast(
                'Success',
                'Report generated successfully.',
                'success'
            );
            this.isLoading = false;
        }
    }

    get pagedCaseNotesData() {

        const start = (this.caseNotesPageNumber - 1) * this.caseNotesPageSize;
        const end = start + this.caseNotesPageSize;

        return this.caseNotesData.slice(start, end);
    }

    get caseNotesDisableFirst() {
        return this.caseNotesPageNumber <= 1;
    }

    get caseNotesDisableLast() {
        return this.caseNotesPageNumber >= this.caseNotesTotalPages;
    }

    updateCaseNotesPagination() {

        this.caseNotesTotalRecords = this.caseNotesData.length;

        this.caseNotesTotalPages = Math.ceil(
            this.caseNotesTotalRecords / this.caseNotesPageSize
        );

        if (this.caseNotesTotalPages === 0) {
            this.caseNotesTotalPages = 1;
        }

        console.log('📄 Total Records:', this.caseNotesTotalRecords);
        console.log('📄 Total Pages:', this.caseNotesTotalPages);
    }

    handleCaseNotesRecordsPerPageChange(event) {

        this.caseNotesPageSize = parseInt(event.target.value, 10);
        this.caseNotesPageNumber = 1;

        console.log('📄 Page Size Changed:', this.caseNotesPageSize);

        this.updateCaseNotesPagination();
    }

    handleCaseNotesFirstPage() {

        this.caseNotesPageNumber = 1;

        console.log('⏮ First Page');
    }

    handleCaseNotesPreviousPage() {

        if (this.caseNotesPageNumber > 1) {
            this.caseNotesPageNumber--;
        }

        console.log('◀ Previous Page:', this.caseNotesPageNumber);
    }

    handleCaseNotesNextPage() {

        if (this.caseNotesPageNumber < this.caseNotesTotalPages) {
            this.caseNotesPageNumber++;
        }

        console.log('▶ Next Page:', this.caseNotesPageNumber);
    }

    handleCaseNotesLastPage() {

        this.caseNotesPageNumber = this.caseNotesTotalPages;

        console.log('⏭ Last Page:', this.caseNotesPageNumber);
    }

    async handleExportPdfCaseNotes() {
        try {

            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error('jsPDF library not available');
            }

            if (!this.caseNotesData || this.caseNotesData.length === 0) {
                console.warn('No Case Notes available for PDF export');
                return;
            }

            const { jsPDF } = window.jspdf;

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a3'
            });
            let startY = this.addOrganisationPdfHeader(doc);

            const rows = this.caseNotesData.map(item => [
                item.date || '',
                item.participantName || '',
                item.noteType || '',
                item.contactMethod || '',
                item.billable || '',
                item.duration || '',
                `$${item.rate || '0.00'}`,
                `$${item.totalCost || '0.00'}`,
                item.serviceItem || '',
                item.activityDetails || ''
            ]);
            // ===============================
                // REPORT HEADER (ONLY FIRST PAGE)
                // ===============================

                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');

                doc.text(
                    'Case Notes Report',
                    10,
                    startY
                );


                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                doc.text(
                    `Date Range: ${this.formatDateDDMMYYYY(this.fromDate)} to ${this.formatDateDDMMYYYY(this.toDate)}`,
                    10,
                    startY + 8
                );

                doc.text(
                    `Total Records: ${this.caseNotesData.length}`,
                    10,
                    startY + 14
                );

            doc.autoTable({
               startY: startY + 22,

                head: [[
                    'Date',
                    'Participant Name',
                    'Note Type',
                    'Contact Method',
                    'Billable',
                    'Duration',
                    'Rate',
                    'Total Cost',
                    'Service Item',
                    'Activity Details'
                ]],

                body: rows,

                theme: 'grid',

                headStyles: {
                    fillColor: [0, 153, 222],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },

                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    valign: 'middle'
                },

                columnStyles: {
                    0: { cellWidth: 22 }, // Date
                    1: { cellWidth: 45 }, // Participant Name
                    2: { cellWidth: 32 }, // Note Type
                    3: { cellWidth: 25 }, // Contact Method
                    4: { cellWidth: 15 }, // Billable
                    5: { cellWidth: 18 }, // Duration
                    6: { cellWidth: 18, halign: 'right' }, // Rate
                    7: { cellWidth: 22, halign: 'right' }, // Total Cost
                    8: { cellWidth: 45 }, // Service Item
                    9: { cellWidth: 'auto' } // Activity Details
                },

                margin: {
                    top: 35,
                    left: 8,
                    right: 8
                },

               
            });

            console.log(
                '📄 PDF Rows Count:',
                this.caseNotesData.length
            );

            doc.save(
                `Case_Notes_Report_${this.formatDate(new Date())}.pdf`
            );

            console.log('✅ PDF Export Successful');

        } catch (error) {
            console.error(
                '❌ Case Notes PDF Export Error:',
                error
            );
        }
    }

    handleExportCsvCaseNotes() {
        try {

            if (!this.caseNotesData || this.caseNotesData.length === 0) {
                console.warn('No case notes data to export');
                return;
            }

            const headers = [
                'Date',
                'Participant Name',
                'Note Type',
                'Contact Method',
                'Billable',
                'Duration',
                'Rate',
                'Total Cost',
                'Service Item',
                'Activity Details'
            ];

            const csvRows = this.caseNotesData.map(item => [
                `"${item.date || ''}"`,
                `"${item.participantName || ''}"`,
                `"${item.noteType || ''}"`,
                `"${item.contactMethod || ''}"`,
                `"${item.billable || ''}"`,
                `"${item.duration || ''}"`,
                item.rate || 0,
                item.totalCost || 0,
                `"${item.serviceItem || ''}"`,
                `"${(item.activityDetails || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = [

                // Organisation Header
                `"${this.orgname || ''}"`,
                `"${this.statePostal || ''}"`,

                '',

                // Report Heading
                `"Case Notes Report"`,

                '',

                // Existing table
                headers.join(','),

                ...csvRows.map(row => row.join(','))

            ].join('\n');

            const blob = new Blob(
                ['\uFEFF' + csvContent], // UTF-8 BOM
                { type: 'text/csv;charset=utf-8;' }
            );

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.href = url;
            link.download =
                `Case_Notes_Report_${new Date().toISOString().split('T')[0]}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            console.log(
                `✅ CSV Exported Successfully - ${this.caseNotesData.length} records`
            );

        } catch (error) {
            console.error(
                '❌ Case Notes CSV Export Error:',
                error
            );
        }
    }

    get pagedProviderData() {

        const start = (this.providerPageNumber - 1) * this.providerPageSize;
        const end = start + this.providerPageSize;

        return (this.providerData || []).slice(start, end);
    }

    get providerDisableFirst() {
        return this.providerPageNumber <= 1;
    }

    get providerDisableLast() {
        return this.providerPageNumber >= this.providerTotalPages;
    }

    updateProviderPagination() {

        this.providerTotalRecords = this.providerData?.length || 0;

        this.providerTotalPages = Math.ceil(
            this.providerTotalRecords / this.providerPageSize
        );

        if (this.providerTotalPages === 0) {
            this.providerTotalPages = 1;
        }

        console.log('📄 Provider Total Records:', this.providerTotalRecords);
        console.log('📄 Provider Total Pages:', this.providerTotalPages);
    }

    handleProviderRecordsPerPageChange(event) {

        this.providerPageSize = parseInt(event.target.value, 10);
        this.providerPageNumber = 1;

        console.log(
            '📄 Provider Page Size Changed:',
            this.providerPageSize
        );

        this.updateProviderPagination();
    }

    handleProviderFirstPage() {

        this.providerPageNumber = 1;

        console.log('⏮ Provider First Page');
    }

    handleProviderPreviousPage() {

        if (this.providerPageNumber > 1) {
            this.providerPageNumber--;
        }

        console.log(
            '◀ Provider Previous Page:',
            this.providerPageNumber
        );
    }

    handleProviderNextPage() {

        if (this.providerPageNumber < this.providerTotalPages) {
            this.providerPageNumber++;
        }

        console.log(
            '▶ Provider Next Page:',
            this.providerPageNumber
        );
    }

    handleProviderLastPage() {

        this.providerPageNumber = this.providerTotalPages;

        console.log(
            '⏭ Provider Last Page:',
            this.providerPageNumber
        );
    }

    async handleExportPdfProvider() {
        try {

            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error('jsPDF library not available');
            }

            if (!this.providerData || this.providerData.length === 0) {
                console.warn('❌ No Provider data available for PDF export');
                return;
            }

            const { jsPDF } = window.jspdf;

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });


            // ================================
            // ORGANISATION HEADER
            // ================================

            let startY = this.addOrganisationPdfHeader(doc);



            // ================================
            // REPORT TITLE
            // ================================

            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');

            doc.text(
                'Provider Report',
                10,
                startY
            );



            const rows = this.providerData.map(item => [
                item.name || '',
                item.email || '',
                item.phone || '',
                (item.serviceType || '').replaceAll(';', '\n'),
                item.status || ''
            ]);



            doc.autoTable({

                // below Provider Report title
                startY: startY + 10,


                head: [[
                    'Provider',
                    'Email',
                    'Phone',
                    'Service Type',
                    'Status'
                ]],


                body: rows,


                theme: 'grid',


                headStyles: {
                    fillColor: [0, 153, 222],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8
                },


                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    valign: 'middle'
                },


                columnStyles: {

                    0: { cellWidth: 30 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 75 },
                    4: { cellWidth: 15 }

                },


                margin: {

                    // for next pages
                    top: 35,
                    left: 8,
                    right: 8

                },


                rowPageBreak: 'avoid',
                pageBreak: 'auto'

            });



            console.log(
                '📄 Provider PDF Rows:',
                rows.length
            );



            doc.save(
                `Provider_Report_${new Date()
                    .toISOString()
                    .split('T')[0]}.pdf`
            );



            console.log(
                `✅ Provider PDF Exported Successfully - ${rows.length} records`
            );


        } catch (error) {


            console.error(
                '❌ Provider PDF Export Error:',
                error
            );

        }
    }

    handleExportCsvProvider() {
        try {

            if (!this.providerData || this.providerData.length === 0) {
                console.warn('No Provider data available for export');
                return;
            }

            const headers = [
                'Provider',
                'Email',
                'Phone',
                'Service Type',
                'Status'
            ];

            const csvRows = this.providerData.map(item => [
                `"${item.name || ''}"`,
                `"${item.email || ''}"`,
                `"${item.phone || ''}"`,
                `"${(item.serviceType || '').replace(/"/g, '""')}"`,
                `"${item.status || ''}"`
            ]);

           const csvContent = [

                `"${this.orgname || ''}"`,
                `"${this.statePostal || ''}"`,

                '',

                `"Provider Report"`,

                '',

                headers.join(','),

                ...csvRows.map(row => row.join(','))

            ].join('\n');

            const blob = new Blob(
                ['\uFEFF' + csvContent],
                { type: 'text/csv;charset=utf-8;' }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download =
                `Provider_Report_${new Date().toISOString().split('T')[0]}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            console.log(
                `✅ Provider CSV Exported - ${this.providerData.length} records`
            );

        } catch (error) {

            console.error(
                '❌ Provider CSV Export Error:',
                error
            );
        }
    }

    get pagedUtilizationRows() {

        const start =
            (this.utilizationPageNumber - 1) *
            this.utilizationPageSize;

        const end =
            start +
            this.utilizationPageSize;

        return (this.utilizationRows || [])
            .slice(start, end);
    }

    get utilizationDisableFirst() {
        return this.utilizationPageNumber <= 1;
    }

    get utilizationDisableLast() {
        return this.utilizationPageNumber >= this.utilizationTotalPages;
    }

    updateUtilizationPagination() {

        this.utilizationTotalRecords =
            this.utilizationRows?.length || 0;

        this.utilizationTotalPages = Math.ceil(
            this.utilizationTotalRecords /
            this.utilizationPageSize
        );

        if (this.utilizationTotalPages === 0) {
            this.utilizationTotalPages = 1;
        }

        console.log(
            '📄 Utilization Total Records:',
            this.utilizationTotalRecords
        );

        console.log(
            '📄 Utilization Total Pages:',
            this.utilizationTotalPages
        );
    }

    handleUtilizationRecordsPerPageChange(event) {

        this.utilizationPageSize =
            parseInt(event.target.value, 10);

        this.utilizationPageNumber = 1;

        console.log(
            '📄 Utilization Page Size:',
            this.utilizationPageSize
        );

        this.updateUtilizationPagination();
    }

    handleUtilizationFirstPage() {

        this.utilizationPageNumber = 1;

        console.log('⏮ Utilization First Page');
    }

    handleUtilizationPreviousPage() {

        if (this.utilizationPageNumber > 1) {
            this.utilizationPageNumber--;
        }

        console.log(
            '◀ Utilization Previous Page:',
            this.utilizationPageNumber
        );
    }

    handleUtilizationNextPage() {

        if (
            this.utilizationPageNumber <
            this.utilizationTotalPages
        ) {
            this.utilizationPageNumber++;
        }

        console.log(
            '▶ Utilization Next Page:',
            this.utilizationPageNumber
        );
    }

    handleUtilizationLastPage() {

        this.utilizationPageNumber =
            this.utilizationTotalPages;

        console.log(
            '⏭ Utilization Last Page:',
            this.utilizationPageNumber
        );
    }

    get pagedReconciliationData() {

        const start =
            (this.reconciliationPageNumber - 1) *
            this.reconciliationPageSize;

        const end =
            start +
            this.reconciliationPageSize;

        return (this.reconciliationData || [])
            .slice(start, end);
    }

    get reconciliationDisableFirst() {
        return this.reconciliationPageNumber <= 1;
    }

    get reconciliationDisableLast() {
        return this.reconciliationPageNumber >= this.reconciliationTotalPages;
    }

    updateReconciliationPagination() {

        this.reconciliationTotalRecords =
            this.reconciliationData?.length || 0;

        this.reconciliationTotalPages = Math.ceil(
            this.reconciliationTotalRecords /
            this.reconciliationPageSize
        );

        if (this.reconciliationTotalPages === 0) {
            this.reconciliationTotalPages = 1;
        }

        console.log(
            '📄 Reconciliation Total Records:',
            this.reconciliationTotalRecords
        );

        console.log(
            '📄 Reconciliation Total Pages:',
            this.reconciliationTotalPages
        );
    }

    handleReconciliationRecordsPerPageChange(event) {

        this.reconciliationPageSize =
            parseInt(event.target.value, 10);

        this.reconciliationPageNumber = 1;

        console.log(
            '📄 Reconciliation Page Size:',
            this.reconciliationPageSize
        );

        this.updateReconciliationPagination();
    }

    handleReconciliationFirstPage() {

        this.reconciliationPageNumber = 1;
    }

    handleReconciliationPreviousPage() {

        if (this.reconciliationPageNumber > 1) {
            this.reconciliationPageNumber--;
        }
    }

    handleReconciliationNextPage() {

        if (
            this.reconciliationPageNumber <
            this.reconciliationTotalPages
        ) {
            this.reconciliationPageNumber++;
        }
    }

    handleReconciliationLastPage() {

        this.reconciliationPageNumber = this.reconciliationTotalPages;
    }

    async handleExportPdfutilization() {

    try {

        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF library not available');
        }


        if (!this.utilizationRows || this.utilizationRows.length === 0) {

            console.warn('No Utilization data available');
            return;
        }


        const { jsPDF } = window.jspdf;


        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });



        // ================================
        // ORGANISATION HEADER
        // ================================

        let startY = this.addOrganisationPdfHeader(doc);



        // ================================
        // REPORT TITLE
        // ================================

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');


        doc.text(
            'Utilization Report',
            10,
            startY
        );



        const rows = this.utilizationRows.map(item => [

            item.participantName || '',

            item.supportItemName || '',

            `$${item.planned || 0}`,

            `$${item.actual || 0}`,

            `$${item.variance || 0}`,

            item.status || ''

        ]);



        doc.autoTable({

            // below heading
            startY: startY + 12,


            head: [[
                'Participant',
                'Support Item',
                'Planned',
                'Actual',
                'Variance',
                'Status'
            ]],


            body: rows,


            theme: 'grid',


            headStyles: {

                fillColor: [0, 153, 222],
                textColor: [255, 255, 255],
                fontStyle: 'bold'

            },


            styles: {

                fontSize: 8,
                overflow: 'linebreak'

            },


            margin: {

                // next pages spacing
                top: 35,
                left: 10,
                right: 10

            },


            rowPageBreak: 'avoid',
            pageBreak: 'auto'

        });



        doc.save(

            `Utilization_Report_${this.formatDate(new Date())}.pdf`

        );



        console.log(
            'Utilization PDF Exported Successfully'
        );


    } catch (error) {


        console.error(
            '❌ Utilization PDF Export Error',
            error
        );

    }
}

    handleExportCsvutilization() {
        try {

            if (!this.utilizationRows || this.utilizationRows.length === 0) {
                console.warn('No Utilization data available');
                return;
            }

            const headers = [
                'Participant',
                'Support Item',
                'Planned',
                'Actual',
                'Variance',
                'Status'
            ];

            const csvRows = this.utilizationRows.map(item => [
                `"${item.participantName || ''}"`,
                `"${item.supportItemName || ''}"`,
                item.planned || 0,
                item.actual || 0,
                item.variance || 0,
                `"${item.status || ''}"`
            ]);

            const csvContent = [

            `"${this.orgname || ''}"`,
            `"${this.statePostal || ''}"`,

            '',

            `"Utilization Report"`,

            '',

            headers.join(','),

            ...csvRows.map(row => row.join(','))

        ].join('\n');

            const blob = new Blob(
                ['\uFEFF' + csvContent],
                {
                    type: 'text/csv;charset=utf-8;'
                }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download =
                `Utilization_Report_${this.formatDate(new Date())}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

        } catch (error) {
            console.error(
                '❌ Utilization CSV Export Error',
                error
            );
        }
    }

    async handleExportPdfreconciliation() {

    try {

        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF library not available');
        }


        if (!this.reconciliationData || this.reconciliationData.length === 0) {

            console.warn('No Reconciliation data available');
            return;
        }


        const { jsPDF } = window.jspdf;


        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });



        // ================================
        // ORGANISATION HEADER
        // ================================

        let startY = this.addOrganisationPdfHeader(doc);



        // ================================
        // REPORT TITLE
        // ================================

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');


        doc.text(
            'Reconciliation Report',
            10,
            startY
        );



        const rows = this.reconciliationData.map(item => [

            item.date || '',

            item.supportItemName || '',

            `$${item.planned || 0}`,

            `$${item.actual || 0}`,

            `$${item.variance || 0}`

        ]);



        doc.autoTable({

            // below report heading
            startY: startY + 12,


            head: [[
                'Date',
                'Support Item',
                'Planned',
                'Actual',
                'Variance'
            ]],


            body: rows,


            theme: 'grid',


            headStyles: {

                fillColor: [0, 153, 222],
                textColor: [255, 255, 255],
                fontStyle: 'bold'

            },


            styles: {

                fontSize: 8,
                overflow: 'linebreak'

            },


            margin: {

                // next pages top spacing
                top: 35,
                left: 10,
                right: 10

            },


            rowPageBreak: 'avoid',
            pageBreak: 'auto'

        });



        doc.save(

            `Reconciliation_Report_${this.formatDate(new Date())}.pdf`

        );



        console.log(
            'Reconciliation PDF Exported Successfully'
        );


    } catch (error) {


        console.error(
            '❌ Reconciliation PDF Export Error',
            error
        );

    }
}

    handleExportCsvreconciliation() {
        try {

            if (!this.reconciliationData || this.reconciliationData.length === 0) {
                console.warn('No Reconciliation data available');
                return;
            }

            const headers = [
                'Date',
                'Support Item',
                'Planned',
                'Actual',
                'Variance'
            ];

            const csvRows = this.reconciliationData.map(item => [
                `"${item.date || ''}"`,
                `"${item.supportItemName || ''}"`,
                item.planned || 0,
                item.actual || 0,
                item.variance || 0
            ]);

            const csvContent = [

                `"${this.orgname || ''}"`,
                `"${this.statePostal || ''}"`,

                '',

                `"Reconciliation Report"`,

                '',

                headers.join(','),

                ...csvRows.map(row => row.join(','))

            ].join('\n');

            const blob = new Blob(
                ['\uFEFF' + csvContent],
                {
                    type: 'text/csv;charset=utf-8;'
                }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download =
                `Reconciliation_Report_${this.formatDate(new Date())}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

        } catch (error) {
            console.error(
                '❌ Reconciliation CSV Export Error',
                error
            );
        }
    }

    addOrganisationPdfHeader(doc) {

    const pageWidth = doc.internal.pageSize.getWidth();

    if (this.orgLogo) {
        try {

            const maxWidth = 40;
            const maxHeight = 20;

            const imgProps = doc.getImageProperties(this.orgLogo);

            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            const scale = Math.min(
                maxWidth / imgWidth,
                maxHeight / imgHeight
            );

            imgWidth *= scale;
            imgHeight *= scale;


            doc.addImage(
                this.orgLogo,
                "PNG",
                10,
                8,
                imgWidth,
                imgHeight
            );

        } catch(e){
            console.log('Logo Error', e);
        }
    }


    const orgX = pageWidth - 80;


    doc.setFontSize(14);
    doc.setFont(undefined,'bold');

    doc.text(
        this.orgname || '',
        orgX,
        15
    );


    doc.setFontSize(9);
    doc.setFont(undefined,'normal');

    doc.text(
        this.statePostal || '',
        orgX,
        22
    );


    doc.line(
        10,
        32,
        pageWidth - 10,
        32
    );


    return 42;
}

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

}