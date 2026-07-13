import { LightningElement, track, api} from 'lwc';
import getParticipantsPaged from '@salesforce/apex/SupportParticipantController.getParticipantsPagedforNotes';
import getParticipantUtilization from '@salesforce/apex/SupportCoordinationReports.getParticipantUtilization';
import getParticipantReconciliation from '@salesforce/apex/SupportCoordinationReports.getParticipantReconciliation';
import getParticipantCaseNotes from '@salesforce/apex/SupportCoordinationReports.getParticipantCaseNotes';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDFLib from "@salesforce/resourceUrl/jspdf";
import autoTableLib from "@salesforce/resourceUrl/autotable";
export default class SupportCoordinatorReports extends LightningElement {

    @track selectedType = 'all';
    @track pageNumber = 1;
    @track pageSize = 10;
    @track totalPages = 0;
    @track totalRecords = 0;
    pageSizeOptions = [10, 20, 50];
    @track isLoading = false;
    @track participants = [];
    @track selectedParticipantId;
    @track showUtilizationModal = false;
    @track showReconciliationModal = false;
    @track showCaseNotesModal = false;
    @track mainTabelFlag = true;
    @track utilization = 'utilization';
    @track reconciliation = 'Reconciliation';
    @track caseNote = 'caseNote';
    @track participantName = '';
    jsPdfInitialized = false;

    @track utilizationParticipants = [];
    @track utilizationPageSize = 10;
    @track utilizationPageNumber = 1;
    @track utilizationTotalPages = 0;
    @track utilizationTotalRecords = 0;
    @track utilizationDisableFirst = true;
    @track utilizationDisableLast = true;
    utilizationPageSizeOptions = [10, 20, 50];
    @track utilizationData = [];
    @track pagedUtilizationData = [];


    @track reconciliationData = [];
    @track reconciliationParticipantName = '';
    @track pagedReconciliationData = [];
    @track reconciliationPageSize = 10;
    @track reconciliationPageNumber = 1;
    @track reconciliationTotalPages = 0;
    @track reconciliationTotalRecords = 0;
    @track reconciliationDisableFirst = true;
    @track reconciliationDisableLast = true;
    reconciliationPageSizeOptions = [10, 20, 50];

    @track caseNotesData = [];
    @track caseNotesParticipantName = '';
    @track pagedCaseNotesData = [];
    @track caseNotesPageSize = 10;
    @track caseNotesPageNumber = 1;
    @track caseNotesTotalPages = 0;
    @track caseNotesTotalRecords = 0;
    @track caseNotesDisableFirst = true;
    @track caseNotesDisableLast = true;
    caseNotesPageSizeOptions = [10, 20, 50];


    get allParticipantClass() {
        return this.selectedType === 'all'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    get pinnedParticipantClass() {
        return this.selectedType === 'pinned'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    get allutilizationClass() {
        return this.utilization === 'utilization'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    get allreconciliationClass() {
        return this.reconciliation === 'Reconciliation'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    get allcaseNoteClass() {
        return this.caseNote === 'caseNote'
            ? 'menu-item1' 
            : 'menu-item'; 
    }

    async connectedCallback() {
        await this.loadParticipantsfortabel();

        if (!this.jsPdfInitialized) {
            try {
                await Promise.all([
                    loadScript(this, jsPDFLib + '/jspdf.umd.min.js'),
                    loadScript(this, autoTableLib + '/jspdf.plugin.autotable.min.js')
                ]);

                this.jsPdfInitialized = true;
                console.log('jsPDF + autoTable loaded');

            } catch (error) {
                console.error('Error loading PDF libraries:', error);
            }
        }
    }

    async handleClick(event) {
        this.selectedType = event.currentTarget.dataset.type;

        // reset to first page when tab changes
        this.pageNumber = 1;

        await this.loadParticipantsfortabel();
    }

    formatAmount(value) {
        return Number(value || 0).toLocaleString('en-AU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    async loadParticipantsfortabel() {
        console.log('=== loadParticipantsfortabel START ===');
        this.isLoading = true;

        try {
            const result = await getParticipantsPaged({
                pageSize: this.pageSize,
                pageNumber: this.pageNumber,
                participantType: this.selectedType
            });

            console.log('Raw Apex Result:', JSON.stringify(result));

            if (result.status === 'SUCCESS') {
                this.participants = (result.records || []).map(item => {
                    const participantName =
                        item.First_Name__c || item.Last_Name__c
                            ? `${item.First_Name__c || ''} ${item.Last_Name__c || ''}`.trim()
                            : item.Name || '';

                    const formatDate = (dateStr) => {
                        if (!dateStr) return '';
                        const [year, month, day] = dateStr.split('-');
                        return `${day}/${month}/${year}`;
                    };

                    const planDateRange =
                        item.Plan_Start_Date__c && item.Plan_End_Date__c
                            ? `${formatDate(item.Plan_Start_Date__c)} - ${formatDate(item.Plan_End_Date__c)}`
                            : '';

                    const totalPlanBudget = Number(item.TotalPlanBudget__c) || 0;
                    const supportCoordinatorBudget =
                        Number(item.Support_Coordinator_Budget__c) || 0;
                    const providerBudget =
                        Number(item.Provider_Budget__c) || 0;
                    const supportCoordinatorSpent =
                        Number(item.Support_Coordinator_Spent_Budget__c) || 0;
                    const providerSpent =
                        Number(item.Provider_Spent_Budget__c) || 0;

                    const plannedSpent =
                        supportCoordinatorBudget + providerBudget;

                    const actualSpent =
                        supportCoordinatorSpent + providerSpent;

                    const remainingBudget =
                        plannedSpent - actualSpent;

                    return {
                        id: item.Id,
                        name: participantName,
                        email: item.Email__c || '',
                        phone: item.Phone__c || '',
                        ndis: item.NDIS_Number__c || '',
                        status: item.Status__c || 'Inactive',
                        isPinned: item.Is_Pinned__c || false,
                        planDateRange: planDateRange,

                        // Budget (formatted)
                        totalplanBudget: this.formatAmount(totalPlanBudget),
                        spendbudget: this.formatAmount(
                            Number(item.Budget_Spent_to_Date__c) || 0
                        ),
                        SupportCoordinatorBudget:
                            this.formatAmount(supportCoordinatorBudget),
                        SupportCoordinatorSpentBudget:
                            this.formatAmount(supportCoordinatorSpent),
                        ProviderSpentBudget:
                            this.formatAmount(providerSpent),
                        ProviderBudget:
                            this.formatAmount(providerBudget),
                        plannedSpent: this.formatAmount(plannedSpent),
                        actualSpent: this.formatAmount(actualSpent),
                        remainingBudget: this.formatAmount(remainingBudget),

                        // Case Notes
                        caseNoteCount: item.caseNoteCount || 0,
                        caseNotes: item.caseNotes || [],

                        // Support Catalogue Groups
                        supportCatalogueGroups:
                            item.supportCatalogueGroups || [],

                        // UI
                        initials: this.getInitials(participantName),

                        statusClass:
                            item.Status__c === 'Active'
                                ? 'status-pill status-active'
                                : 'status-pill status-inactive'
                    };
                });

                console.log(
                    'Mapped Participants:',
                    JSON.stringify(this.participants)
                );

                this.totalPages = result.totalPages || 0;
                this.totalRecords = result.totalCount || 0;
                this.pageNumber = result.pageNumber || 1;
                this.pageSize = result.pageSize || 10;
                this.noRecordsFlag = this.participants.length === 0;

            } else {
                console.error('Apex returned error:', result.message);
            }

        } catch (error) {
            console.error('loadParticipantsfortabel ERROR:', error);
            console.error(
                'Message:',
                error?.body?.message || error?.message
            );
        } finally {
            this.isLoading = false;
            console.log('=== loadParticipantsfortabel END ===');
        }
    }

    getInitials(name) {
        if (!name) return '';

        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    get bDisableFirst() {
        return this.pageNumber <= 1;
    }

    get bDisableLast() {
        return this.pageNumber >= this.totalPages;
    }

    async handleRecordsPerPage(event) {
        console.log('event.target.value >>>>>>>', event.target.value);
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;

        console.log('Page Size Changed:', this.pageSize);

        await this.loadParticipantsfortabel();
    }

    async firstPage() {
        if (this.pageNumber === 1) return;

        this.pageNumber = 1;

        console.log('First Page Clicked');

        await this.loadParticipantsfortabel();
    }

    async previousPage() {
        if (this.pageNumber <= 1) return;

        this.pageNumber--;

        console.log('Previous Page:', this.pageNumber);

        await this.loadParticipantsfortabel();
    }

    async nextPage() {
        if (this.pageNumber >= this.totalPages) return;

        this.pageNumber++;

        console.log('Next Page:', this.pageNumber);

        await this.loadParticipantsfortabel();
    }

    async lastPage() {
        if (this.pageNumber === this.totalPages) return;

        this.pageNumber = this.totalPages;

        console.log('Last Page Clicked:', this.pageNumber);

        await this.loadParticipantsfortabel();
    }


    /* Utilization Start*/

    async handleUtilizationClick(event) {
        const participantId = event.currentTarget.dataset.id;

        console.log('Utilization clicked:', participantId);

        this.selectedParticipantId = participantId;
        this.showUtilizationModal = true;
        this.mainTabelFlag = false;
        this.isLoading = true;

        try {
            const result = await getParticipantUtilization({
                participantId: participantId
            });

            console.log('Apex Result:', JSON.stringify(result));

            let utilizationRows = [];

            if (result && result.length > 0) {
                const record = result[0];

                this.participantName =
                    `${record.First_Name__c || ''} ${record.Last_Name__c || ''}`.trim();

                const catalogueGroups =
                    (record.Support_CatalogueGroups__r || []).map(item => {
                        const planned = Number(item.BudgetAllocation__c) || 0;
                        const actual = Number(item.Budget_Spent_to_Date__c) || 0;
                        const variance = planned - actual;

                        return {
                            Id: item.Id,
                            supportItemName: item.Name,
                            planned: this.formatAmount(planned),
                            actual: this.formatAmount(actual),
                            variance: this.formatAmount(variance),
                            status:
                                variance < 0
                                    ? 'Over'
                                    : variance === 0
                                    ? 'Good'
                                    : 'Under',
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
                        const planned = Number(item.BudgetAllocation__c) || 0;
                        const actual = Number(item.Budget_Spent_to_Date__c) || 0;
                        const variance = planned - actual;

                        return {
                            Id: item.Id,
                            supportItemName: item.Name,
                            planned: this.formatAmount(planned),
                            actual: this.formatAmount(actual),
                            variance: this.formatAmount(variance),
                            status:
                                variance < 0
                                    ? 'Over'
                                    : variance === 0
                                    ? 'Good'
                                    : 'Under',
                            statusClass:
                                variance < 0
                                    ? 'status-over'
                                    : variance === 0
                                    ? 'status-good'
                                    : 'status-under'
                        };
                    });

                utilizationRows = [...catalogueGroups, ...coordinatorGroups];
            }

            this.utilizationData = utilizationRows;
            this.utilizationTotalRecords = utilizationRows.length;
            this.utilizationPageNumber = 1;
            this.setupUtilizationPagination();

        } catch (error) {
            console.error('Error fetching utilization:', error);
        } finally {
            this.isLoading = false;
        }
    }

    setupUtilizationPagination() {
        const start = (this.utilizationPageNumber - 1) * this.utilizationPageSize;
        const end = start + this.utilizationPageSize;

        this.pagedUtilizationData = this.utilizationData.slice(start, end);

        this.utilizationTotalPages = Math.ceil(
            this.utilizationTotalRecords / this.utilizationPageSize
        );

        this.utilizationDisableFirst = this.utilizationPageNumber <= 1;
        this.utilizationDisableLast =
        this.utilizationPageNumber >= this.utilizationTotalPages;
    }

    handleUtilizationRecordsPerPageChange(event) {
        console.log('Utilization Page Size Changed:', event.target.value);

        this.utilizationPageSize = parseInt(event.target.value, 10);
        this.utilizationPageNumber = 1;

        this.setupUtilizationPagination();
    }

    handleUtilizationFirstPage() {
        this.utilizationPageNumber = 1;
        this.setupUtilizationPagination();
    }

    handleUtilizationPreviousPage() {
        if (this.utilizationPageNumber > 1) {
            this.utilizationPageNumber--;
            this.setupUtilizationPagination();
        }
    }

    handleUtilizationNextPage() {
        if (this.utilizationPageNumber < this.utilizationTotalPages) {
            this.utilizationPageNumber++;
            this.setupUtilizationPagination();
        }
    }

    handleUtilizationLastPage() {
        this.utilizationPageNumber = this.utilizationTotalPages;
        this.setupUtilizationPagination();
    }

    handleExportPdfutilization() {
        try {
            if (!window.jspdf) {
                console.error('jsPDF not loaded');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Utilization Report', 14, 20);

            doc.setFontSize(12);
            doc.text(`Participant: ${this.participantName}`, 14, 30);

            const rows = this.utilizationData.map(item => [
                item.supportItemName,
                `$${item.planned}`,
                `$${item.actual}`,
                `$${item.variance}`,
                item.status
            ]);

            doc.autoTable({
                startY: 40,
                head: [['Service Type', 'Planned', 'Actual', 'Variance', 'Status']],
                body: rows,
                theme: 'grid',

                headStyles: {
                    fillColor: [0, 153, 222],   // #0099de
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                }
            });

            doc.save('Utilization_Report.pdf');

        } catch (error) {
            console.error('PDF Export Error:', error);
        }
    }

    handleExportCsvutilization() {
        try {
            console.log('Export CSV clicked');

            if (!this.utilizationData || this.utilizationData.length === 0) {
                console.warn('No utilization data to export');
                return;
            }

            const headers = [
                'Service Type',
                'Planned',
                'Actual',
                'Variance',
                'Status'
            ];

            const csvRows = this.utilizationData.map(item => [
                `"${item.supportItemName || ''}"`,
                item.planned || 0,
                item.actual || 0,
                item.variance || 0,
                `"${item.status || ''}"`
            ]);

            const csvContent = [
                headers.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
            });

            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);

                link.setAttribute('href', url);
                link.setAttribute(
                    'download',
                    `Utilization_Report_${this.participantName}.csv`
                );

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error('CSV Export Error:', error);
        }
    }

    /* Utilization End*/

    /* Reconciliation Start*/

    async handleReconciliationClick(event) {
        const participantId = event.currentTarget.dataset.id;

        console.log('Reconciliation clicked:', participantId);

        this.selectedParticipantId = participantId;
        this.showReconciliationModal = true;
        this.mainTabelFlag = false;
        this.isLoading = true;

        try {
            const result = await getParticipantReconciliation({
                participantId: participantId
            });

            console.log(
                'Reconciliation Apex Result:',
                JSON.stringify(result)
            );

            let reconciliationRows = [];

            if (result && result.length > 0) {
                const record = result[0];

                this.reconciliationParticipantName =
                    `${record.First_Name__c || ''} ${record.Last_Name__c || ''}`.trim();

                reconciliationRows =
                    (record.Support_Budgets__r || []).map(item => {
                        const planned = Number(item.Total_Amount__c) || 0;
                        const actual = Number(item.Actual_Amount__c) || 0;
                        const variance = planned - actual;

                        return {
                            Id: item.Id,
                            date: this.formatDate(item.Budget_Date__c),
                            supportItemName: item.Service_Item__c || '',
                            planned: this.formatAmount(planned),
                            actual: this.formatAmount(actual),
                            variance: this.formatAmount(variance)
                        };
                    });
            }

            this.reconciliationData = reconciliationRows;
            this.reconciliationTotalRecords = reconciliationRows.length;
            this.reconciliationPageNumber = 1;

            this.setupReconciliationPagination();

        } catch (error) {
            console.error(
                'Error fetching reconciliation:',
                error
            );
        } finally {
            this.isLoading = false;
        }
    }

    setupReconciliationPagination() {
        const start =
            (this.reconciliationPageNumber - 1) *
            this.reconciliationPageSize;

        const end = start + this.reconciliationPageSize;

        this.pagedReconciliationData =
            this.reconciliationData.slice(start, end);

        this.reconciliationTotalPages =
            Math.ceil(
                this.reconciliationTotalRecords /
                this.reconciliationPageSize
            ) || 1;

        this.reconciliationDisableFirst =
            this.reconciliationPageNumber <= 1;

        this.reconciliationDisableLast =
            this.reconciliationPageNumber >=
            this.reconciliationTotalPages;
    }

    handleReconciliationRecordsPerPageChange(event) {
        this.reconciliationPageSize =
            parseInt(event.target.value, 10);

        this.reconciliationPageNumber = 1;

        this.setupReconciliationPagination();
    }

    handleReconciliationFirstPage() {
        this.reconciliationPageNumber = 1;
        this.setupReconciliationPagination();
    }

    handleReconciliationPreviousPage() {
        if (this.reconciliationPageNumber > 1) {
            this.reconciliationPageNumber--;
            this.setupReconciliationPagination();
        }
    }

    handleReconciliationNextPage() {
        if (
            this.reconciliationPageNumber <
            this.reconciliationTotalPages
        ) {
            this.reconciliationPageNumber++;
            this.setupReconciliationPagination();
        }
    }

    handleReconciliationLastPage() {
        this.reconciliationPageNumber =
            this.reconciliationTotalPages;

        this.setupReconciliationPagination();
    }

    formatDate(dateStr) {
        if (!dateStr) {
            return '';
        }

        const date = new Date(dateStr);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    get reconciliationParticipantInitials() {
        if (!this.reconciliationParticipantName) {
            return '';
        }

        return this.reconciliationParticipantName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    handleExportPdfReconciliation() {
        try {
            if (!window.jspdf) {
                console.error('jsPDF not loaded');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Reconciliation Report', 14, 20);

            doc.setFontSize(12);
            doc.text(
                `Participant: ${this.reconciliationParticipantName}`,
                14,
                30
            );

            const rows = this.reconciliationData.map(item => [
                item.date,
                item.supportItemName,
                `$${item.planned}`,
                `$${item.actual}`,
                `$${item.variance}`
            ]);

            doc.autoTable({
                startY: 40,
                head: [[
                    'Date',
                    'Support Item Name',
                    'Planned',
                    'Actual',
                    'Variance'
                ]],
                body: rows,
                theme: 'grid',

                headStyles: {
                    fillColor: [0, 153, 222], // #0099de
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                }
            });

            doc.save('Reconciliation_Report.pdf');

        } catch (error) {
            console.error(
                'Reconciliation PDF Export Error:',
                error
            );
        }
    }

    handleExportCsvReconciliation() {
        try {
            if (
                !this.reconciliationData ||
                this.reconciliationData.length === 0
            ) {
                console.warn('No reconciliation data to export');
                return;
            }

            const headers = [
                'Date',
                'Support Item Name',
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
                headers.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
            });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `Reconciliation_Report_${this.reconciliationParticipantName}.csv`
            );

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(
                'Reconciliation CSV Export Error:',
                error
            );
        }
    }

    /* Reconciliation End*/

    /* Case Note Start*/

    async handleCaseNotesClick(event) {
        const participantId = event.currentTarget.dataset.id;

        console.log('Case Notes clicked:', participantId);

        this.selectedParticipantId = participantId;
        this.showCaseNotesModal = true;
        this.mainTabelFlag = false;
        this.isLoading = true;

        try {
            const result = await getParticipantCaseNotes({
                participantId: participantId
            });

            console.log(
                'Case Notes Apex Result:',
                JSON.stringify(result)
            );

            let caseRows = [];

            if (result && result.length > 0) {
                const record = result[0];

                this.caseNotesParticipantName =
                    `${record.First_Name__c || ''} ${record.Last_Name__c || ''}`.trim();

                caseRows = (record.SupportNotes1__r || []).map(item => {
                    const rate =
                        Number(
                            item.Support_CoordinatorCatalogue__r?.Unit_Price__c
                        ) || 0;

                    const totalCost =
                        Number(item.Total_Cost__c) || 0;

                    return {
                        Id: item.Id,

                        date: this.formatDate(item.Entry_Date__c),

                        noteType: item.Notes_Type__c || '',

                        contactMethod: item.Created_From__c || '',

                        billable: item.Billable__c ? 'Yes' : 'No',

                        duration:
                            item.Duration_Hours__c
                                ? `${item.Duration_Hours__c} Hr`
                                : '',

                        rate: this.formatAmount(rate),

                        totalCost: this.formatAmount(totalCost),

                        serviceType:
                            item.Support_CoordinatorCatalogueGroup__r?.Name || '',

                        serviceItem:
                            item.Support_CoordinatorCatalogue__r
                                ?.Support_Item_Name__c || '',

                        activityDetails:
                            item.Activity_Details__c || ''
                    };
                });
            }

            this.caseNotesData = caseRows;
            this.caseNotesTotalRecords = caseRows.length;
            this.caseNotesPageNumber = 1;
            this.setupCaseNotesPagination();

        } catch (error) {
            console.error(
                'Error fetching case notes:',
                error
            );
        } finally {
            this.isLoading = false;
        }
    }

    setupCaseNotesPagination() {
        const start =
            (this.caseNotesPageNumber - 1) *
            this.caseNotesPageSize;

        const end = start + this.caseNotesPageSize;

        this.pagedCaseNotesData =
            this.caseNotesData.slice(start, end);

        this.caseNotesTotalPages =
            Math.ceil(
                this.caseNotesTotalRecords /
                this.caseNotesPageSize
            ) || 1;

        this.caseNotesDisableFirst =
            this.caseNotesPageNumber <= 1;

        this.caseNotesDisableLast =
            this.caseNotesPageNumber >=
            this.caseNotesTotalPages;
    }

    handleCaseNotesRecordsPerPageChange(event) {
        this.caseNotesPageSize =
            parseInt(event.target.value, 10);

        this.caseNotesPageNumber = 1;

        this.setupCaseNotesPagination();
    }

    handleCaseNotesFirstPage() {
        this.caseNotesPageNumber = 1;
        this.setupCaseNotesPagination();
    }

    handleCaseNotesPreviousPage() {
        if (this.caseNotesPageNumber > 1) {
            this.caseNotesPageNumber--;
            this.setupCaseNotesPagination();
        }
    }

    handleCaseNotesNextPage() {
        if (
            this.caseNotesPageNumber <
            this.caseNotesTotalPages
        ) {
            this.caseNotesPageNumber++;
            this.setupCaseNotesPagination();
        }
    }

    handleCaseNotesLastPage() {
        this.caseNotesPageNumber =
            this.caseNotesTotalPages;

        this.setupCaseNotesPagination();
    }

    get caseNotesParticipantInitials() {
        if (!this.caseNotesParticipantName) {
            return '';
        }

        return this.caseNotesParticipantName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    handleExportPdfCaseNotes() {
        try {
            if (!window.jspdf) {
                console.error('jsPDF not loaded');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');

            doc.setFontSize(18);
            doc.text('Case Notes Report', 14, 20);

            doc.setFontSize(12);
            doc.text(
                `Participant: ${this.caseNotesParticipantName}`,
                14,
                30
            );

            const rows = this.caseNotesData.map(item => [
                item.date || '',
                item.noteType || '',
                item.contactMethod || '',
                item.billable || '',
                item.duration || '',
                `$${item.rate || 0}`,
                `$${item.totalCost || 0}`,
                item.serviceType || '',
                item.serviceItem || '',
                item.activityDetails || ''
            ]);

            doc.autoTable({
                startY: 40,
                head: [[
                    'Date',
                    'Note Type',
                    'Contact Method',
                    'Billable',
                    'Duration',
                    'Rate',
                    'Total Cost',
                    'Service Type',
                    'Service Item',
                    'Activity Details'
                ]],
                body: rows,
                theme: 'grid',

                headStyles: {
                    fillColor: [0, 153, 222], // #0099de
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },

                styles: {
                    fontSize: 8,
                    cellWidth: 'wrap'
                }
            });

            doc.save('Case_Notes_Report.pdf');

        } catch (error) {
            console.error(
                'Case Notes PDF Export Error:',
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
                'Note Type',
                'Contact Method',
                'Billable',
                'Duration',
                'Rate',
                'Total Cost',
                'Service Type',
                'Service Item',
                'Activity Details'
            ];

            const csvRows = this.caseNotesData.map(item => [
                `"${item.date || ''}"`,
                `"${item.noteType || ''}"`,
                `"${item.contactMethod || ''}"`,
                `"${item.billable || ''}"`,
                `"${item.duration || ''}"`,
                item.rate || 0,
                item.totalCost || 0,
                `"${item.serviceType || ''}"`,
                `"${item.serviceItem || ''}"`,
                `"${item.activityDetails || ''}"`
            ]);

            const csvContent = [
                headers.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
            });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `Case_Notes_Report_${this.caseNotesParticipantName}.csv`
            );

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error(
                'Case Notes CSV Export Error:',
                error
            );
        }
    }

    /* Case Note Start*/

    handleBack() {
        this.showCaseNotesModal = false;
        this.showReconciliationModal = false;
        this.showUtilizationModal = false;
        this.mainTabelFlag = true;
    }

    get participantInitials() {
        if (!this.participantName) {
            return '';
        }

        return this.participantName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

}