import { LightningElement, track, api } from 'lwc';
import getFacilityCompliance from '@salesforce/apex/FacilityComplianceReportController.getFacilityCompliance';
import getFacilityRoles from '@salesforce/apex/FacilityDocumentController.getFacilityRoles';
import generateComplianceReport from '@salesforce/apex/ShiftComplianceReportHandler.generateComplianceReport';
import getFacilityComplianceRules from '@salesforce/apex/ShiftComplianceReportHandler.getFacilityComplianceRules';

export default class StaffComplianceReport extends LightningElement {

    // Bars (simple percent-driven style)
    get fullBarStyle() { return `width:${Math.min(100, this.fullyCompliant * 6)}%`; }
    get partialBarStyle() { return `width:${Math.min(100, this.partiallyCompliant * 6)}%`; }
    get nonBarStyle() { return `width:${Math.min(100, this.nonCompliant * 6)}%`; }

    // Filters + pagination
    @track allStaffRows = [];
    @track filteredStaff = [];
    @track searchText = '';
    @track selectedStatus = 'All';
    @track selectedRole = 'All';

    @track pageSizeOptions = [10,25,50];
    @track pageSize = 10;
    @track pageNumber = 1;
    @track totalRecords = 0;

    @api facilityId;
    @track staffList = [];
    @track showModal1 = false;
    @track modalData = {
    documents: {
        percent: 0,
        status: '',
        text: '0% compliant · 0 requirements met',
        items: []
    },
    training: {
        percent: 0,
        status: '',
        text: '0% compliant · 0 requirements met',
        items: []
    }
};
    @track roleOptions = [
        { label: 'All Roles', value: 'All' }
    ];

    rawStaffMap = {};
    documentCategoryMap = {};
    @track startDate;
    @track endDate;
    @track facilityComplianceRules = [];

    RULE_DEFINITIONS = {
    Max_Consecutive_Days__c: {
        key: 'MAX_CONSECUTIVE_DAYS',
        label: 'Maximum Consecutive Days'
    },
    Min_Hours_Between_Shifts__c: {
        key: 'MIN_REST',
        label: 'Minimum Hours Between Shifts'
    },
    Max_Hours_Per_Week__c: {
        key: 'MAX_HOURS_WEEK',
        label: 'Maximum Hours Per Week'
    },
    Max_Hours_Per_Shift__c: {
        key: 'MAX_HOURS_SHIFT',
        label: 'Maximum Hours Per Shift'
    },
    Max_Late_Clock_In_minutes__c: {
        key: 'CLOCK_ACCURACY',
        label: 'Sign in/out Accuracy'
    },
    Max_Missed_Shifts_Per_Month__c: {
        key: 'SHIFT_ATTENDANCE',
        label: 'Shift Attendance'
    }
};
 @track shiftComplianceSummary = {
    summary: { percent: 0, status: '', metText: '' },
    rules: []
};;
 @track requiredDocuments =[];
@track isExpanded = false;
@track requiredTrainings=[];

    get chevronIcon() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get sectionClass() {
        return this.isExpanded
            ? 'slds-section slds-is-open'
            : 'slds-section slds-is-closed';
    }

    toggleSection() {
        this.isExpanded = !this.isExpanded;
    }
    
    get hasShiftComplianceData() {
        return (
            this.shiftComplianceSummary &&
            this.shiftComplianceSummary.summary &&
            this.shiftComplianceSummary.rules
        );
    }
    @track isDocumentsExpanded = false;
    @track isTrainingExpanded = false;

    toggleDocuments() {
        this.isDocumentsExpanded = !this.isDocumentsExpanded;
    }

    toggleTraining() {
        this.isTrainingExpanded = !this.isTrainingExpanded;
    }

    get documentsSectionClass() {
        return this.isDocumentsExpanded
            ? 'slds-section slds-is-open'
            : 'slds-section';
    }

    get trainingSectionClass() {
        return this.isTrainingExpanded
            ? 'slds-section slds-is-open'
            : 'slds-section';
    }
    get documentsSectionClass() {
            return this.isDocumentsExpanded
                ? 'slds-section slds-is-open'
                : 'slds-section slds-is-close';
        }

        get trainingSectionClass() {
            return this.isTrainingExpanded
                ? 'slds-section slds-is-open'
                : 'slds-section slds-is-close';
        }
        get documentsChevronIcon() {
                return this.isDocumentsExpanded
                    ? 'utility:chevrondown'
                    : 'utility:chevronright';
            }

            get trainingChevronIcon() {
                return this.isTrainingExpanded
                    ? 'utility:chevrondown'
                    : 'utility:chevronright';
            }
    get documentsBadgeClass() {
        return this.getBadgeClass(this.modalData.documents.status);
    }

    get trainingBadgeClass() {
        return this.getBadgeClass(this.modalData.training.status);
    }

     get shiftBadgeClass() {
        return this.getBadgeClass(this.shiftComplianceSummary.summary.status);
    }

        get overallCompliancePercent() {
                const values = [
                    this.modalData?.documents?.percent ?? 0,
                    this.modalData?.training?.percent ?? 0,
                    this.shiftComplianceSummary?.summary?.percent ?? 0
                ];

                const total = values.reduce((a, b) => a + b, 0);
                return Math.round(total / values.length);
            }

            get documentsBarStyle() {
                return this.getBarStyle(this.modalData?.documents?.percent);
            }

            get trainingBarStyle() {
                return this.getBarStyle(this.modalData?.training?.percent);
            }

            get shiftBarStyle() {
                return this.getBarStyle(this.shiftComplianceSummary?.summary?.percent);
            }

            getBarStyle(percent = 0) {
                let color = '#4CAF50'; // green

                if (percent < 50) {
                    color = '#E53935'; // red
                } else if (percent < 80) {
                    color = '#FB8C00'; // amber
                }

                return `width:${percent}%; background-color:${color};`;
}


        getBadgeClass(status) {
            switch (status) {
                case 'Compliant':
                    return 'slds-badge slds-theme_success';
                case 'Non-Compliant':
                    return 'slds-badge slds-theme_error';
                default:
                    return 'slds-badge slds-theme_warning';
            }
        }


    connectedCallback() {
        const today = new Date();

        // First day of current month
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        // Last day of current month
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        this.startDate = this.formatDateForInput(firstDay);
        this.endDate = this.formatDateForInput(lastDay);
        this.loadFacilityCompliance();
        this.loadFacilityRoles();
        this.loadFacilityComplianceRules();
    }
    loadFacilityComplianceRules() {
    getFacilityComplianceRules({ facilityId: this.facilityId })
        .then(result => {
            this.facilityComplianceRules = result;
            console.log(
                'Facility Compliance Rules loaded ==>',
                JSON.stringify(result)
            );
         
        })
        .catch(error => {
            console.error('Error loading rules', error);
        });
}


    async loadFacilityCompliance() {
        try {
            /* =====================================================
            1️⃣ LOAD FACILITY RULES + STAFF
            ===================================================== */
            const result = await getFacilityCompliance({
                facilityId: this.facilityId
            });

            console.log(
                'facility doc training rules =>',
                JSON.stringify(result)
            );

            /* =====================================================
            2️⃣ BUILD DOCUMENT → CATEGORY MAP
            ===================================================== */
            this.documentCategoryMap = {};
            (result.rules || []).forEach(rule => {
                if (rule.Document_Name__c && rule.Compliance_Category__c) {
                    this.documentCategoryMap[rule.Document_Name__c] =
                        rule.Compliance_Category__c;
                }
            });

            /* =====================================================
            3️⃣ REQUIRED DOCUMENTS & TRAININGS
            ===================================================== */
            this.requiredDocuments = (result.rules || [])
                .filter(r =>
                    r.Mandatory_Document__c === true &&
                    r.Document_Name__c &&
                    r.Compliance_Category__c === 'Documents'
                )
                .map(r => r.Document_Name__c);

            this.requiredTrainings = (result.rules || [])
                .filter(r =>
                    r.Mandatory_Document__c === true &&
                    r.Document_Name__c &&
                    r.Compliance_Category__c === 'Trainings'
                )
                .map(r => r.Document_Name__c);

            console.log('Required Documents =>', JSON.stringify(this.requiredDocuments));
            console.log('Required Trainings =>', JSON.stringify(this.requiredTrainings));

            /* =====================================================
            4️⃣ STORE RAW STAFF
            ===================================================== */
            this.rawStaffMap = {};
            (result.staff || []).forEach(staff => {
                this.rawStaffMap[staff.Id] = staff;
            });

            /* =====================================================
            5️⃣ BULK SHIFT COMPLIANCE (ONE APEX CALL)
            ===================================================== */
            const staffIds = (result.staff || []).map(s => s.Id);

            this.shiftComplianceSummaryByStaff = {};

            if (staffIds.length) {
                const complianceResult = await generateComplianceReport({
                    facilityId: this.facilityId,
                    staffIds: staffIds,
                    startDate: this.startDate,
                    endDate: this.endDate
                });

                console.log(
                    'Bulk Shift Compliance result =>',
                    JSON.stringify(complianceResult)
                );

                this.shiftComplianceSummaryByStaff =
                    this.buildShiftComplianceByStaff(complianceResult);
            }
             console.log(
                    'this.shiftComplianceSummaryByStaff =>',
                    JSON.stringify(this.shiftComplianceSummaryByStaff)
                );

            /* =====================================================
            6️⃣ BUILD TABLE ROWS (NOW SHIFT DATA EXISTS)
            ===================================================== */
            this.allStaffRows = (result.staff || []).map(staff =>
                this.buildStaffRow(staff)
            );
            console.log('all staff rows before filetrs '+JSON.stringify(this.allStaffRows));

            /* =====================================================
            7️⃣ APPLY FILTERS + METRICS
            ===================================================== */
            this.applyFilters();

        } catch (error) {
            console.error('Facility Compliance Error', error);
        }
    }


    buildShiftComplianceByStaff(violations) {
    this.shiftComplianceSummaryByStaff = {};

    const violationsByStaff = {};

    violations.forEach(v => {
        if (!violationsByStaff[v.staffId]) {
            violationsByStaff[v.staffId] = [];
        }
        violationsByStaff[v.staffId].push(v);
    });

    Object.keys(violationsByStaff).forEach(staffId => {
        const staffViolations = violationsByStaff[staffId];
        const uiSummary = this.buildShiftComplianceUI(staffViolations);
        this.shiftComplianceSummaryByStaff[staffId] = uiSummary.summary;
    });

    console.log(
        'ShiftComplianceSummaryByStaff IN LOGIC =>',
        JSON.stringify(this.shiftComplianceSummaryByStaff)
    );

       return this.shiftComplianceSummaryByStaff;
}




    // Options
    statusOptions = [
    { label: 'All Status', value: 'All' },
    { label: 'Compliant', value: 'Compliant' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Non-Compliant', value: 'Non-Compliant' }
    ];

    // roleOptions = [
    // { label: 'All Roles', value: 'All' },
    // { label: 'Support Worker', value: 'Support Worker' },
    // { label: 'Registered Nurse', value: 'Registered Nurse' },
    // { label: 'Care Manager', value: 'Care Manager' }
    // ];

    // derived
    get totalPages() {
    return Math.max(
        1,
        Math.ceil(this.totalRecords / this.pageSize)
    );
    }
    get bDisableFirst() { return this.pageNumber === 1; }
    get bDisableLast() { return this.pageNumber >= this.totalPages; }
    get isEmpty() {
    return Array.isArray(this.filteredStaff) && this.filteredStaff.length === 0;
    }


    get totalStaffCount() { return this.staffList.length; }

    get filteredList() {
    const search = this.searchText ? this.searchText.toLowerCase() : '';
    return this.staffList.filter(s => {
        const matchesSearch = !search || s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search);
        const matchesRole = this.selectedRole === 'All' || s.role === this.selectedRole;
        const matchesStatus = this.selectedStatus === 'All' ||
        s.documents === this.selectedStatus ||
        s.training === this.selectedStatus ||
        s.shift === this.selectedStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });
    }

    get pagedList() {
        const data = Array.isArray(this.filteredStaff)
            ? this.filteredStaff
            : [];

        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;

        return data.slice(start, end);
    }

    // handlers
    handleSearch(event) {
        this.searchText = event.target.value.toLowerCase();
        this.pageNumber = 1;
        this.applyFilters();
    }

    applyFilters() {
        const search = (this.searchText || '').toLowerCase();
        const statusFilter = this.selectedStatus;
        const roleFilter = this.selectedRole;

        this.filteredStaff = this.allStaffRows.filter(row => {
            // Search filter
            const matchesSearch = 
                row.name.toLowerCase().includes(search) ||
                row.role.toLowerCase().includes(search) ||
                row.documents.toLowerCase().includes(search) ||
                row.training.toLowerCase().includes(search) ||
                row.shift.toLowerCase().includes(search);
            
            if (!matchesSearch) return false;
            
            // Status filter
            let matchesStatus = true;
            if (statusFilter && statusFilter !== 'All') {
                matchesStatus = 
                    row.documents === statusFilter ||
                    row.training === statusFilter ||
                    row.shift === statusFilter;
            }
            
            if (!matchesStatus) return false;
            
            // Role filter
            // let matchesRole = true;
            // if (roleFilter && roleFilter !== 'All') {
            //     matchesRole = row.role === roleFilter;
            // }
            let matchesRole = true;

            if (roleFilter && roleFilter !== 'All') {
                const staffRoles = row.role
                    .split(',')
                    .map(r => r.trim().toLowerCase());

                matchesRole = staffRoles.includes(roleFilter.toLowerCase());
            }

            return matchesRole;
        });

        this.pageNumber = 1;
        this.totalRecords = this.filteredStaff.length;
      //  this.calculateMetrics();
         this.buildOverallStaffMetrics();
    }


    updatePagination() {
        this.totalRecords = this.filteredStaff.length;

        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;

        this.pagedList = this.filteredStaff.slice(start, end);
    }

    handleStatusChange(e) {
        this.selectedStatus = e.detail.value;
        this.pageNumber = 1;
        this.applyFilters();
    }

    handleRoleChange(e) {
        this.selectedRole = e.detail.value;
        this.pageNumber = 1;
        this.applyFilters();
    }

    handlePageSizeChange(e) {
        this.pageSize = Number(e.target.value) || 10;
        this.pageNumber = 1;
    }

    firstPage() { this.pageNumber = 1; }
    previousPage() { if (this.pageNumber > 1) this.pageNumber--; }
    nextPage() { if (this.pageNumber < this.totalPages) this.pageNumber++; }
    lastPage() { this.pageNumber = this.totalPages; }

    viewDetails(e) {
    const id = e.currentTarget.dataset.id;
    const rec = this.staffList.find(s => s.id === id);
    if (rec) {
        this.modalRecord = { ...rec };
        this.showModal = true;
    }
    }

    handleExport() {
        const data = Array.isArray(this.filteredStaff)
            ? this.filteredStaff
            : [];

        if (!data.length) {
            console.warn('No data to export');
            return;
        }

        const headers = [
            'Name',
            'Email',
            'Role',
            'Documents',
            'Training',
            'Shift'
        ];

        const rows = data.map(r => [
            `"${r.name}"`,
            `"${r.email}"`,
            `"${r.role}"`,
            r.documents,
            r.training,
            r.shift
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'staff_compliance_report.csv';
        a.click();

        URL.revokeObjectURL(url);
    }

    /* buildStaffRow(staff) {
        const docs = Array.isArray(staff.Child_Staffs__r)
            ? staff.Child_Staffs__r
            : [];

        const grouped = {
            Documents: [],
            Trainings: [],
            Identity: []
        };

        docs.forEach(doc => {
            const docType = doc?.Document_Type__c;
            const category = this.documentCategoryMap?.[docType];

            if (category && grouped[category]) {
                grouped[category].push(doc);
            }
        });

        const documents = this.evaluateCategoryStatus(grouped.Documents);
        const training = this.evaluateCategoryStatus(grouped.Trainings);
        //const shift = this.evaluateCategoryStatus(grouped.Identity);
        const shift = 'Pending';

        const roles = (staff.StaffRoles__r || [])
            .filter(role => role.Facility__c === this.facilityId)
            .map(r => r.RoleName__c)
            .filter(Boolean)
            .join(', ');

        return {
            id: staff.Id,
            name: staff.Display_Nickname__c,
            email: staff.Email_Address__c,
            role: roles && roles.length > 0 ? roles : '-',

            documents,
            documentsClass: this.getStatusClass(documents),

            training,
            trainingClass: this.getStatusClass(training),

            shift,
            shiftClass: this.getStatusClass(shift)
        };
    } */
   buildStaffRow(staff) {

    const staffDocs = staff.Child_Staffs__r || [];

    /* 🔑 USE SAME LOGIC AS MODAL */
    const documents = this.buildDocumentCompliance(
        this.requiredDocuments,
        staffDocs
    );

    const training = this.buildDocumentCompliance(
        this.requiredTrainings,
        staffDocs
    );

    const shiftSummary =
        this.shiftComplianceSummaryByStaff?.[staff.Id] || { status: 'Compliant' };

    const roles = (staff.StaffRoles__r || [])
        .filter(r => r.Facility__c === this.facilityId)
        .map(r => r.RoleName__c)
        .join(', ');

    return {
        id: staff.Id,
        name: staff.Display_Nickname__c,
        email: staff.Email_Address__c,
        role: roles || '-',

        /* 🔑 TABLE VALUES NOW MATCH MODAL */
        documents: documents.status,
        documentsClass: this.getStatusClass(documents.status),

        training: training.status,
        trainingClass: this.getStatusClass(training.status),

        shift: shiftSummary.status,
        shiftClass: this.getStatusClass(shiftSummary.status)
    };
}

      buildOverallStaffMetrics() {

            let totalStaff = this.allStaffRows.length;
            let fullyCompliant = 0;
            let partiallyCompliant = 0;
            let nonCompliant = 0;

            this.allStaffRows.forEach(staffRow => {

                const modalData = this.buildModalData(
                    this.rawStaffMap[staffRow.id],
                    staffRow
                );

                const shiftSummary = this.shiftComplianceSummaryByStaff?.[staffRow.id] || { status: 'Pending'   };

                const overallStatus = this.getStaffOverallCompliance({
                    documents: modalData.documents,
                    training: modalData.training,
                    shift: shiftSummary
                });

                if (overallStatus === 'Fully-Compliant') {
                    fullyCompliant++;
                } else if (overallStatus === 'Partially-Compliant') {
                    partiallyCompliant++;
                } else {
                    nonCompliant++;
                }
            });

            this.totalStaff = totalStaff;
            this.fullyCompliant = fullyCompliant;
            this.partiallyCompliant = partiallyCompliant;
            this.nonCompliant = nonCompliant;
        }

    getStaffOverallCompliance({ documents, training, shift }) {

            // 🔴 ANY NON-COMPLIANT → NON COMPLIANT
            if (
                documents.status === 'Non-Compliant' ||
                training.status === 'Non-Compliant' ||
                shift.status === 'Non-Compliant'
            ) {
                return 'Non-Compliant';
            }

            // 🟢 ALL COMPLIANT → FULLY COMPLIANT
            if (
                documents.status === 'Compliant' &&
                training.status === 'Compliant' &&
                shift.status === 'Compliant'
            ) {
                return 'Fully-Compliant';
            }

            // 🟡 OTHERWISE → PARTIAL
            return 'Partially-Compliant';
        }





    /* calculateMetrics() {
        this.totalStaff = this.filteredStaff.length;

        this.fullyCompliant = 0;
        this.partiallyCompliant = 0;
        this.nonCompliant = 0;

        this.filteredStaff.forEach(row => {
            const statuses = [
                row.documents,
                row.training,
                row.shift
            ];

            if (statuses.every(s => s === 'Compliant')) {
                this.fullyCompliant++;
            } else if (statuses.some(s => s === 'Non-Compliant')) {
                this.nonCompliant++;
            } else {
                this.partiallyCompliant++;
            }
        });
    } */

    evaluateCategoryStatus(docs = []) {
        if (!docs.length) return 'Pending';

        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize to start of day

        let hasPending = false;

        for (const d of docs) {

            // 🔴 EXPIRED → Non-Compliant
            if (d.Expiry_Date__c) {
                const expiryDate = new Date(d.Expiry_Date__c);
                expiryDate.setHours(0, 0, 0, 0);

                if (expiryDate < today) {
                    return 'Non-Compliant';
                }
            }

            // 🔴 REJECTED → Non-Compliant
            if (d.Status__c === 'Rejected') {
                return 'Non-Compliant';
            }

            // 🟡 PENDING
            if (d.Status__c === 'Pending') {
                hasPending = true;
            }
        }

        return hasPending ? 'Pending' : 'Compliant';
    }

    getStatusClass(status) {
        return status === 'Compliant'
            ? 'status compliant'
            : status === 'Pending'
            ? 'status pending'
            : 'status noncompliant';
    }
    // called once after getFacilityCompliance
      


    handleViewDetails(event) {
        const staffId = event.currentTarget.dataset.id;

        const staffRow = this.allStaffRows.find(s => s.id === staffId);
        if (!staffRow) return;

        const rawStaff = this.rawStaffMap[staffId]; 
        console.log('rawStaff',JSON.stringify(rawStaff));
         console.log('staffRow', JSON.stringify(staffRow));
        // rawStaff = original Staff__c from Apex (important)

        this.modalData = this.buildModalData(rawStaff, staffRow);
         console.log('modalData', JSON.stringify(this.modalData));
        this.showModal1 = true;
        this.handleShiftComplianceReport(rawStaff)
    }

       buildModalData(rawStaff, summaryRow) {

            const staffDocs = rawStaff.Child_Staffs__r || [];

            const documents =this.buildDocumentCompliance(this.requiredDocuments, staffDocs );

            const training = this.buildDocumentCompliance(this.requiredTrainings,staffDocs);
        

            return {
                name: rawStaff.Display_Nickname__c,
                email: rawStaff.Email_Address__c,
                role: summaryRow.role,
                documents,
                training
            };
   }



        buildDocumentCompliance(requiredDocs, staffDocs) {

          //  console.log('DocumentCompliance → START');
          //  console.log('Required documents:', JSON.stringify(requiredDocs));
         //   console.log('Uploaded documents:', JSON.stringify(staffDocs));

            const uploadedByType = {};
            (staffDocs || []).forEach(d => {
                uploadedByType[d.Document_Type__c] = d;
            });

          //  console.log('UploadedByType map:', JSON.stringify(uploadedByType));

            const items = [];
            let compliantCount = 0;

            requiredDocs.forEach(reqDoc => {

             /*    console.log('----------------------------------');
                console.log('Checking required document:', reqDoc);
 */
                const uploaded = uploadedByType[reqDoc];

                // ❌ NOT UPLOADED
                if (!uploaded) {
                  //  console.log('❌ NOT UPLOADED:', reqDoc);

                    items.push({
                        key: reqDoc,
                        label: reqDoc,
                        status: 'Non-Compliant',
                        icon: 'x_circle',
                        class: 'material-icons circleRed slds-m-right_small',
                        description: 'Not uploaded'
                    });
                    return;
                }

              /*   console.log(
                    'Uploaded found:',
                    reqDoc,
                    '| Status =',
                    uploaded.Status__c,
                    '| Expiry =',
                    uploaded.Expiry_Date__c
                ); */

                // 🔴 EXPIRED
                if (uploaded.Expiry_Date__c) {

                    const expiry = new Date(uploaded.Expiry_Date__c);
                    expiry.setHours(0,0,0,0);

                    const today = new Date();
                    today.setHours(0,0,0,0);

                  /*   console.log(
                        'Expiry check:',
                        'expiry =', expiry.toDateString(),
                        '| today =', today.toDateString()
                    ); */

                    if (expiry < today) {
                        console.log('❌ EXPIRED:', reqDoc);

                        items.push({
                            key: uploaded.Id,
                            label: reqDoc,
                            status: 'Non-Compliant',
                            icon: 'error',
                            class: 'material-icons circleRed slds-m-right_small',
                            description: 'Expired'
                        });
                        return;
                    }
                }

                // 🔴 REJECTED
                if (uploaded.Status__c === 'Rejected') {
                    console.log('❌ REJECTED:', reqDoc);

                    items.push({
                        key: uploaded.Id,
                        label: reqDoc,
                        icon: 'error',
                        class: 'material-icons circleRed slds-m-right_small',
                        description: 'Rejected'
                    });
                    return;
                }

                // 🟡 PENDING
                if (uploaded.Status__c === 'Pending') {
                    console.log('⚠️ PENDING:', reqDoc);

                    items.push({
                        key: uploaded.Id,
                        label: reqDoc,
                        status: 'Pending',
                        icon: 'pending',
                        class: 'material-icons circlePending slds-m-right_small',
                        description: 'Pending approval'
                    });
                    return;
                }

                // ✅ COMPLIANT
                compliantCount++;
                console.log('✅ COMPLIANT:', reqDoc);

                items.push({
                    key: uploaded.Id,
                    label: reqDoc,
                    status: 'Compliant',
                    icon: 'check_small',
                    class: 'material-icons circleTick slds-m-right_small',
                    description: 'Approved'
                });
            });

           const total = requiredDocs.length;

            const percent = total === 0 ? 100  : Math.round((compliantCount / total) * 100);

           let status;
            let text;

            if (total === 0) {
                status = 'Compliant';
                text = 'No mandatory requirements';
            } else if (compliantCount === total) {
                status = 'Compliant';
                text = `${compliantCount}/${total} requirements met`;
            } else if (compliantCount === 0) {
                status = 'Non-Compliant';
                text = `0/${total} requirements met`;
            } else {
                status = 'Pending';
                text = `${compliantCount}/${total} requirements met`;
            }

           return {
                percent,
                status,
                text,
                items
            };
        }





            groupDocsByCategory(docs) {
                const grouped = {
                    Documents: [],
                    Trainings: [],
                    Identity: []
                };

                docs.forEach(d => {
                    const category = this.documentCategoryMap[d.Document_Type__c];
                    if (category && grouped[category]) {
                        grouped[category].push(d);
                    }
                });

                return grouped;
            }

   

    closeModal() {
        this.showModal1 = false;
        this.modalData = {};
    }

    

    loadFacilityRoles() {
        if (!this.facilityId) return;
        console.log('facilityId', this.facilityId);

        getFacilityRoles({ facilityId: this.facilityId })
            .then(result => {
                // Always start with "All Roles"
                console.log('getFacilityRoles result (JSON):',
                    JSON.stringify(result)
                );
                const options = [
                    { label: 'All Roles', value: 'All' }
                ];

                // Convert string list → combobox options
                (result || []).forEach(roleName => {
                    options.push({
                        label: roleName,
                        value: roleName
                    });
                });

                this.roleOptions = options;
            })
            .catch(error => {
                console.error('Error loading facility roles', error);

                // Fallback so UI does not break
                this.roleOptions = [
                    { label: 'All Roles', value: 'All' }
                ];
            });
    }
    handleDateChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        if (field === 'start') {
            this.startDate = value;
        } else if (field === 'end') {
            this.endDate = value;
        }

        console.log('Start Date:', this.startDate);
        console.log('End Date:', this.endDate);
    }
    formatDateForInput(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  handleShiftComplianceReport(rawStaff){
    console.log('this.facilityId ==>'+this.facilityId);
    console.log('this.startDate ==>'+this.startDate);  
    console.log('this.endDate ==>'+this.endDate);    
    console.log('rawStaff  ==>'+JSON.stringify(rawStaff));    
   
      generateComplianceReport({
        facilityId:this.facilityId,
        staffIds:[rawStaff.Id],
        startDate:this.startDate,
        endDate:this.endDate
      }).then(
        result=>{
            console.log('shiftComplianceSummary ==>'+JSON.stringify(result));
                  this.shiftComplianceSummary =  this.buildShiftComplianceUI(result);

            console.log(
                'Shift Compliance UI ==>',
                JSON.stringify(this.shiftComplianceSummary)
            );

        })

  }  
  
buildShiftComplianceUI(violations) {
    console.log('ShiftComplianceUI → START');

    /* ============================================================
       1️⃣ RULE NAME → API NAME MAPPING (CRITICAL)
    ============================================================ */
    const RULE_NAME_TO_KEY = {
        'Max Consecutive Days': 'Max_Consecutive_Days__c',
        'Min Rest Between Shifts': 'Min_Hours_Between_Shifts__c',
        'Max Hours Per Week': 'Max_Hours_Per_Week__c',
        'Max Hours Per Shift': 'Max_Hours_Per_Shift__c',
        'Sign in/out Accuracy': 'Max_Late_Clock_In_minutes__c',
        'Missed Shifts Per Month': 'Max_Missed_Shifts_Per_Month__c'
    };

    /* ============================================================
       2️⃣ COUNT VIOLATIONS BY RULE KEY
    ============================================================ */
    const violationCountByRuleKey = {};

    violations.forEach(v => {
        const ruleKey = RULE_NAME_TO_KEY[v.ruleName];
        if (!ruleKey) {
            console.warn('ShiftComplianceUI → Unknown ruleName:', v.ruleName);
            return;
        }
        violationCountByRuleKey[ruleKey] =
            (violationCountByRuleKey[ruleKey] || 0) + 1;
    });

    console.log(
        'ShiftComplianceUI → Violation counts =',
        JSON.stringify(violationCountByRuleKey)
    );

    /* ============================================================
       3️⃣ FILTER ACTIVE FACILITY RULES
    ============================================================ */
    const activeRules = (this.facilityComplianceRules || [])
        .filter(r => r.Is_Active__c);

    console.log(
        'ShiftComplianceUI → Active facility rules count =',
        activeRules.length
    );

    /* ============================================================
       4️⃣ BUILD UI RULE CARDS
    ============================================================ */
    const uiRules = [];
    let compliantCount = 0;

    activeRules.forEach(rule => {

        let ruleApiName;
        let ruleLabel;

        if (rule.Max_Consecutive_Days__c != null) {
            ruleApiName = 'Max_Consecutive_Days__c';
            ruleLabel = 'Maximum Consecutive Days';
        } else if (rule.Min_Hours_Between_Shifts__c != null) {
            ruleApiName = 'Min_Hours_Between_Shifts__c';
            ruleLabel = 'Minimum Hours Between Shifts';
        } else if (rule.Max_Hours_Per_Week__c != null) {
            ruleApiName = 'Max_Hours_Per_Week__c';
            ruleLabel = 'Maximum Hours Per Week';
        } else if (rule.Max_Hours_Per_Shift__c != null) {
            ruleApiName = 'Max_Hours_Per_Shift__c';
            ruleLabel = 'Maximum Hours Per Shift';
        } else if (rule.Max_Late_Clock_In_minutes__c != null) {
            ruleApiName = 'Max_Late_Clock_In_minutes__c';
            ruleLabel = 'Sign in/out Accuracy';
        } else if (rule.Max_Missed_Shifts_Per_Month__c != null) {
            ruleApiName = 'Max_Missed_Shifts_Per_Month__c';
            ruleLabel = 'Shift Attendance';
        } else {
            return;
        }

        const violationCount = violationCountByRuleKey[ruleApiName] || 0;
        const isCompliant = violationCount === 0;

        if (isCompliant) {
            compliantCount++;
        }

        let description;
        if (isCompliant) {
            description = 'Within limits';
        } else {
            if (ruleApiName === 'Max_Late_Clock_In_minutes__c') {
                description = `Late sign in/out (${violationCount} violations)`;
            } else if (ruleApiName === 'Max_Missed_Shifts_Per_Month__c') {
                description = `${violationCount} missed shifts this month`;
            } else {
                description = `${violationCount} violation${violationCount > 1 ? 's' : ''}`;
            }
        }

        console.log(
            'ShiftComplianceUI → Rule result:',
            ruleLabel,
            '=>',
            isCompliant ? 'Compliant' : 'Non-Compliant'
        );

        uiRules.push({
            label: ruleLabel,
            status: isCompliant ? 'Compliant' : 'Non-Compliant',
            icon: isCompliant ? 'check_small' : 'x_circle',
            class: isCompliant ? 'material-icons circleTick slds-m-right_small' : 'material-icons circleRed slds-m-right_small',
            variant: isCompliant ? 'success' : 'error',
            description
        });
    });

    /* ============================================================
       5️⃣ BUILD SUMMARY (PERCENT + TEXT)
    ============================================================ */
    const totalRules = activeRules.length;
    const percent =
        totalRules === 0
            ? 100
            : Math.round((compliantCount / totalRules) * 100);

    const summary = {
        percent,
        metText: `${compliantCount}/${totalRules} requirements met`,
        status:
            compliantCount === totalRules
                ? 'Compliant'
                : compliantCount === 0
                    ? 'Non-Compliant'
                    : 'Pending'
    };

    console.log('ShiftComplianceUI → SUMMARY', summary);
    console.log('ShiftComplianceUI → END');

    return {
        summary,
        rules: uiRules
    };
}






}