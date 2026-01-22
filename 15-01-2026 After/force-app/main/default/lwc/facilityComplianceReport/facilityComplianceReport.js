import { LightningElement, track, api } from 'lwc';
import getFacilityCompliance from '@salesforce/apex/FacilityComplianceReportController.getFacilityCompliance';
import getFacilityRoles from '@salesforce/apex/FacilityDocumentController.getFacilityRoles';

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
    @track modalData = {};
    @track roleOptions = [
        { label: 'All Roles', value: 'All' }
    ];

    rawStaffMap = {};
    documentCategoryMap = {};

    connectedCallback() {
        this.loadFacilityCompliance();
        this.loadFacilityRoles();
    }

    loadFacilityCompliance() {
    getFacilityCompliance({ facilityId: this.facilityId })
        .then(result => {

            // 🔑 BUILD DOCUMENT → CATEGORY MAP
            this.documentCategoryMap = {};
            (result.rules || []).forEach(rule => {
                if (rule.Document_Name__c && rule.Compliance_Category__c) {
                    this.documentCategoryMap[rule.Document_Name__c] =
                        rule.Compliance_Category__c;
                }
            });

            // 🔑 STORE RAW STAFF FOR MODAL
            this.rawStaffMap = {};
            (result.staff || []).forEach(staff => {
                this.rawStaffMap[staff.Id] = staff;
            });

            // 🔑 BUILD TABLE ROWS
            this.allStaffRows = (result.staff || []).map(staff =>
                this.buildStaffRow(staff)
            );

            this.applyFilters();
        })
        .catch(error => {
            console.error('Facility Compliance Error', error);
        });
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
        this.calculateMetrics();
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

    buildStaffRow(staff) {
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
    }

    calculateMetrics() {
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
    }

    evaluateCategoryStatus(docs = []) {
        if (!docs.length) return 'Pending';

        let hasPending = false;

        for (const d of docs) {
            if (d.Status__c === 'Rejected' || d.Status__c === 'Expired') {
                return 'Non-Compliant';
            }
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

    handleViewDetails(event) {
        const staffId = event.currentTarget.dataset.id;

        const staffRow = this.allStaffRows.find(s => s.id === staffId);
        if (!staffRow) return;

        const rawStaff = this.rawStaffMap[staffId]; 
        // rawStaff = original Staff__c from Apex (important)

        this.modalData = this.buildModalData(rawStaff, staffRow);
        this.showModal1 = true;
    }

    buildModalData(rawStaff, summaryRow) {
        const docs = rawStaff.Child_Staffs__r || [];

        const grouped = this.groupDocsByCategory(docs);

        const docStats = this.calculateProgress(grouped.Documents);
        const trainingStats = this.calculateProgress(grouped.Trainings);
        const shiftStats = this.calculateProgress(grouped.Identity);

        const overallPercent = Math.round(
            (docStats.percent + trainingStats.percent + shiftStats.percent) / 3
        );

        const overallStatus = this.calculateOverallStatus(
            docStats.status,
            trainingStats.status,
            shiftStats.status
        );

        return {
            name: rawStaff.Display_Nickname__c,
            email: rawStaff.Email_Address__c,
            role: summaryRow.role,

            overallPercent,
            overallStatus,

            documents: docStats,
            training: trainingStats,
            shift: shiftStats
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

    calculateOverallStatus(doc, training, shift) {
        if ([doc, training, shift].includes('Non-Compliant')) {
            return 'Non-Compliant';
        }
        if ([doc, training, shift].includes('Pending')) {
            return 'Pending';
        }
        return 'Compliant';
    }


    closeModal() {
        this.showModal1 = false;
        this.modalData = {};
    }

    calculateProgress(docs = []) {
        if (!Array.isArray(docs) || docs.length === 0) {
            return {
                percent: 0,
                status: 'Pending',
                text: '0% compliant · 0 requirements met'
            };
    }

    let approved = 0;
    let hasPending = false;

    for (const d of docs) {
        if (d.Status__c === 'Rejected' || d.Status__c === 'Expired') {
            return {
                percent: Math.round((approved / docs.length) * 100),
                status: 'Non-Compliant',
                text: `${approved}/${docs.length} requirements met`
            };
        }

        if (d.Status__c === 'Approved') approved++;
        if (d.Status__c === 'Pending') hasPending = true;
    }

    const percent = Math.round((approved / docs.length) * 100);

    return {
        percent,
        status: hasPending ? 'Pending' : 'Compliant',
        text: `${percent}% compliant · ${approved}/${docs.length} requirements met`
    };
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
}