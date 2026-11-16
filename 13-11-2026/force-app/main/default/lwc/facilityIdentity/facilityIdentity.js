import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getDocuments from '@salesforce/apex/FacilityDocumentController.getDocuments';
import saveFacilityDoc from '@salesforce/apex/FacilityDocumentController.saveIdentity';
import deleteDocument from '@salesforce/apex/FacilityDocumentController.deleteDocument';
import getFacilityRoles from '@salesforce/apex/FacilityDocumentController.getFacilityRoles';

export default class FacilityDocument extends LightningElement {

    // Facility Id from parent
    _facilityId;
    @api
    get facilityId() {
        return this._facilityId;
    }
    set facilityId(value) {
        this._facilityId = value;

        if (value) {
            this.loadFacilityRoles();
            this.loadDocuments(); // <-- imperative load
        }
    }

    // Pagination
    @track pageSizeOptions = [10, 25, 50];
    @track pageSize = 10;
    @track pageNumber = 1;

    // Data
    @track documents = [];

    // Modal
    @track showModal = false;
    @track modalTitle = 'Add Document';
    @track recordId = null;

    // Delete
    @track showDeleteConfirm = false;
    @track docToDeleteId = null;
    @track docToDeleteName = '';

    // Roles
    @track options = [];
    @track isRolesOpen = false;
    @track displayText  = 'Select Roles';

    @track editingDoc = {
        name: '',
        category: '',
        points: '',
        roles: [],
        mandatory: false,
        visibleToStaff: false,
        expiryRequired: false,
        reminder1: null,
        reminder2: null,
        notes: ''
    };
    identityPointsMap = {
        Primary: '70',
        Secondary: '40',
        Other: '25'
    };
    @track sortField = '';
    @track sortDirection = 'asc';
    @track sortIcons = {
    name: '',
    category: '',
    points: '' 
    
    };

    // ------------------------------------------------------------
    // LOAD DOCUMENTS — IMPERATIVE (NO WIRE)
    // ------------------------------------------------------------
    loadDocuments() {
        if (!this._facilityId) {
            console.log('❌ loadDocuments stopped — No facilityId provided');
            return;
        }

        console.log('📨 Calling Apex → getDocuments with facilityId:', this._facilityId);

        getDocuments({ facilityId: this._facilityId })
            .then(result => {
                console.log('📥 Raw Apex Result:', JSON.parse(JSON.stringify(result)));
                console.log(`📊 Total records returned from Apex: ${result.length}`);

                // Filter only Identity documents
                const identityDocs = result.filter(
                    d => d.Compliance_Category__c === 'Identity'
                );

                console.log(`📌 Identity category documents found: ${identityDocs.length}`);
                console.log('🧾 Identity Docs:', JSON.parse(JSON.stringify(identityDocs)));

                // Normalize each record
                const normalizedDocs = identityDocs.map((doc, index) => {
                    console.log(`🔄 Normalizing doc[${index}] ID=${doc.Id}`);
                    const normalized = this.normalizeDoc(doc);
                    console.log('➡ Normalized Document:', JSON.parse(JSON.stringify(normalized)));
                    return normalized;
                });

                // Load into table
                this.documents = normalizedDocs;

                console.log('✅ FINAL documents loaded into table:', JSON.parse(JSON.stringify(this.documents)));
            })
            .catch(error => {
                console.error('❌ Error loading documents:', error);
            });
    }

    connectedCallback() {
        
        if (this._facilityId) {
            this.loadDocuments(); // initial load
        }
    }

    disconnectedCallback() {
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }

            normalizeDoc(input) {
                const category = input.Identity_Category__c ? String(input.Identity_Category__c) : '';

                return {
                    id: input.Id,
                    name: input.Document_Name__c || '',
                    category: category,
                    categoryClass: this.categoryClassMap[category] || 'cat-default',
                    complianceCategory: input.Compliance_Category__c || 'Identity',
                    points: input.Identity_Points__c,
                    roles: input.Roles__c ? input.Roles__c.split(';') : [],
                    mandatory: Boolean(input.Mandatory_Document__c),
                    visibleToStaff: Boolean(input.Visible_to_Staff__c),
                    expiryRequired: Boolean(input.Expiry_Date_Required__c),
                    reminder1: input.Reminder1__c || null,
                    reminder2: input.Reminder2__c || null,
                    notes: input.Notes__c || ''
                };
            }
            categoryOptions = [
                { label: 'Primary (70 points)', value: 'Primary' },
                { label: 'Secondary (40 points)', value: 'Secondary' },
                { label: 'Other (25 points)', value: 'Other' }
            ];
            categoryClassMap = {
                'Primary': 'cat-Policy',
                'Secondary': 'cat-Compliance',
                'Other': 'cat-Qualification'
            };

    loadFacilityRoles() {
        getFacilityRoles({ facilityId: this._facilityId })
            .then(result => {
                this.options = result.map((role, index) => ({
                    id: index,
                    label: role,
                    checked: false,
                    // badgeClass: 'status-badge1 status-badge-inactive1',
                    // statusText: 'Inactive',
                    isDisabled: false
                }));
                this.displayText = 'Select Roles';
            })
            .catch(error => console.error('Error loading roles:', error));
    }

    get totalDocuments() { return this.documents.length; }
    get mandatoryCount() { return this.documents.filter(d => d.mandatory).length; }
    get visibleCount() { return this.documents.filter(d => d.visibleToStaff).length; }

    get totalPoints() {
        return this.documents.reduce((sum, doc) => {
            const val = parseInt(doc.points);
            return isNaN(val) ? sum : sum + val;
        }, 0);
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.documents.length / this.pageSize));
    }
    get bDisableFirst() { return this.pageNumber === 1; }
    get bDisableLast() { return this.pageNumber >= this.totalPages; }
    get isEmpty() { return this.documents.length === 0; }

    get pagedList() {
        const start = (this.pageNumber - 1) * this.pageSize;
        return this.documents.slice(start, start + this.pageSize);
    }

    handlePageSizeChange(e) {
        this.pageSize = Number(e.target.value);
        this.pageNumber = 1;
    }

    firstPage() { this.pageNumber = 1; }
    previousPage() { if (this.pageNumber > 1) this.pageNumber--; }
    nextPage() { if (this.pageNumber < this.totalPages) this.pageNumber++; }
    lastPage() { this.pageNumber = this.totalPages; }

    openAddModal() {
        this.modalTitle = 'Add Document';

        this.editingDoc = {
            name: '',
            category: '',
            points: '',
            roles: [],
            mandatory: false,
            visibleToStaff: false,
            expiryRequired: false,
            reminder1: null,
            reminder2: null,
            notes: ''
        };
        // Reset roles selection
        this.options = this.options.map(opt => ({
            ...opt,
            checked: false,
            buttonClass: 'option-button',
            // badgeClass: 'status-badge1 status-badge-inactive1',
            // statusText: 'Inactive'
        }));
        this.displayText = 'Select Roles';

        this.showModal = true;
    }

    handleEdit(e) {
        const id = e.currentTarget.dataset.id;
        const doc = this.documents.find(d => d.id === id);
        if (!doc) return;

        this.modalTitle = "Edit Document";
        this.editingDoc = { ...doc };

        // Sync UI roles with saved roles
        this.options = this.options.map(opt => ({
            ...opt,
            checked: doc.roles.includes(opt.label),
            // buttonClass: doc.roles.includes(opt.label),
    //         badgeClass: doc.roles.includes(opt.label) ? 'status-badge1 status-badge-active1'
    // : 'status-badge1 status-badge-inactive1',
    //         statusText: doc.roles.includes(opt.label) ? 'Active' : 'Inactive'
        }));

        this.displayText = doc.roles.length ? doc.roles.join(', ') : 'Select Roles';
        this.showModal = true;
    }

    closeModal() {
        this.recordId = null;
        this.showModal = false;
    }

    handleError(event) {
        this.showToast('Error', event.detail.message, 'error');
    }

    toggleField(e) {
        const id = e.currentTarget.dataset.id;
        const field = e.currentTarget.dataset.field;
        const checked = e.target.checked;

        console.log('Toggling field:', field, 'for ID:', id, 'Checked:', checked);

        // ---- Update LOCAL UI immediately ----
        this.documents = this.documents.map(doc =>
            doc.id === id ? { ...doc, [field]: checked } : doc
        );

        const apiFieldMap = {
            mandatory: 'Mandatory_Document__c',
            visibleToStaff: 'Visible_to_Staff__c',
            expiryRequired: 'Expiry_Date_Required__c'
        };

        const apiField = apiFieldMap[field];

        saveFacilityDoc({
            recordData: { Id: id, [apiField]: checked },
            facilityId: this._facilityId
        })
        .then(() => {
            console.log('Toggle saved, refreshing...');
            return this.loadDocuments(); // force full refresh
        })
        .catch(error => {
            console.error('Toggle update error:', error);
            this.showToast('Error', 'Error updating record', 'error');
        });
    }

    handleDeleteConfirm(e) {
        const id = e.currentTarget.dataset.id;
        const doc = this.documents.find(d => d.id === id);

        if (!doc) return;

        this.docToDeleteId = id;
        this.docToDeleteName = doc.name;
        this.showDeleteConfirm = true;
    }

    cancelDelete() {
        this.showDeleteConfirm = false;
        this.docToDeleteId = null;
        this.docToDeleteName = '';
    }

    confirmDelete() {
        deleteDocument({ recId: this.docToDeleteId })
            .then(() => {
                this.showToast('Success', 'Document deleted', 'success');
                this.loadDocuments();
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            })
            .finally(() => this.cancelDelete());
    }

    toggleRolesDropdown(event) {
        event.stopPropagation(); 
        this.isRolesOpen = !this.isRolesOpen;
        
        // Add/remove click listener based on dropdown state
        if (this.isRolesOpen) {
            // Use setTimeout to add listener after the current event completes
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick.bind(this));
            }, 0);
        } else {
            document.removeEventListener('click', this.handleOutsideClick.bind(this));
        }
    }

    handleSelectRole(event) {
        event.stopPropagation();
        const id = parseInt(event.target.dataset.optionId, 10);

        this.options = this.options.map(opt => {
            if (opt.id === id) opt.checked = !opt.checked;

            // opt.buttonClass = opt.checked ? 'option-button active' : 'option-button';
            // opt.badgeClass  = opt.checked ? 'status-badge1 status-badge-active1' 
            //             : 'status-badge1 status-badge-inactive1';
            // opt.statusText  = opt.checked ? 'Active' : 'Inactive';

            return opt;
        });

        this.editingDoc.roles = this.options
            .filter(o => o.checked)
            .map(o => o.label);

        this.updateRolesDisplay();
    }

    handleToggleRole(event) {
        event.stopPropagation(); // This is key - prevents event from bubbling up
        const id = parseInt(event.target.dataset.optionId, 10);

        this.options = this.options.map(opt => {
            if (opt.id === id) opt.checked = event.target.checked;

            // opt.buttonClass = opt.checked ? 'option-button active' : 'option-button';
            // opt.badgeClass  = opt.checked ? 'status-badge1 status-badge-active1' 
            //             : 'status-badge1 status-badge-inactive1';
            // opt.statusText  = opt.checked ? 'Active' : 'Inactive';

            return opt;
        });

        this.editingDoc.roles = this.options
            .filter(o => o.checked)
            .map(o => o.label);

        this.updateRolesDisplay();
    }

    handleToggleClick(event) {
        event.stopPropagation();
    }
    updateRolesDisplay() {
        const selected = this.options.filter(r => r.checked).map(r => r.label);
        this.displayText  = selected.length ? selected.join(', ') : 'Select Roles';
    }

    get selectedRolesString() {
        return this.options.filter(r => r.checked).map(r => r.label).join(';');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    // handleModalChange(event) {
    //     const field = event.target.dataset.field;
        
    //     // For toggle inputs, get value from event.detail.checked
    //     let value;
    //     if (event.target.type === 'toggle') {
    //         value = event.detail.checked;  // This is the key fix!
    //     } else if (event.target.type === 'checkbox') {
    //         value = event.target.checked;
    //     } else {
    //         value = event.target.value;
    //     }

    //     console.log(`Modal change - Field: ${field}, Value: ${value}, Type: ${event.target.type}`);
        
    //     this.editingDoc = {
    //         ...this.editingDoc,
    //         [field]: value
    //     };
        
    //     console.log('Updated editingDoc:', JSON.stringify(this.editingDoc));
    // }

    handleModalChange(event) {
        const field = event.target.dataset.field;

        let value;
        if (event.target.type === 'toggle') {
            value = event.detail.checked;
        } else if (event.target.type === 'checkbox') {
            value = event.target.checked;
        } else {
            value = event.target.value;
        }

        let updatedDoc = {
            ...this.editingDoc,
            [field]: value
        };

        // 🔥 Auto-fill points when category changes
        if (field === 'category') {
            const autoPoints = this.identityPointsMap[value] || '';
            updatedDoc.points = autoPoints;

            console.log(
                `Category selected = ${value}, auto-populating points = ${autoPoints}`
            );
        }

        this.editingDoc = updatedDoc;

        console.log('Updated editingDoc:', JSON.stringify(this.editingDoc));
    }


    handleRolesChange(event) {
        this.editingDoc.roles = event.detail.value;
    }

    saveDocument() {

        console.log('🟦 saveDocument() CALLED');
        console.log('📝 editingDoc BEFORE payload build:', JSON.parse(JSON.stringify(this.editingDoc)));
        // 1️⃣ Document Name Required
        if (!this.editingDoc.name || this.editingDoc.name.trim() === '') {
            this.showToast('Error', 'Document Name is required.', 'error');
            return;
        }

        // 2️⃣ Category Required
        if (!this.editingDoc.category || this.editingDoc.category.trim() === '') {
            this.showToast('Error', 'Please select a Category.', 'error');
            return;
        }

        const pointsValue = Number(this.editingDoc.points);

        if (isNaN(pointsValue) || pointsValue <= 0) {
            this.showToast('Error', 'Please enter a valid Points value.', 'error');
            return;
        }


        // 4️⃣ At least one Role must be selected
        if (!this.editingDoc.roles || this.editingDoc.roles.length === 0) {
            this.showToast('Error', 'Please select at least one Role.', 'error');
            return;
        }
        const payload = {
            Id: this.editingDoc.id || null,
            Document_Name__c: this.editingDoc.name,
            Identity_Category__c: this.editingDoc.category,
            Identity_Points__c: this.editingDoc.points,
            Roles__c: this.editingDoc.roles.join(';'),
            Mandatory_Document__c: this.editingDoc.mandatory,
            Visible_to_Staff__c: this.editingDoc.visibleToStaff,
            Expiry_Date_Required__c: this.editingDoc.expiryRequired,
            Reminder1__c: this.editingDoc.reminder1,
            Reminder2__c: this.editingDoc.reminder2,
            Notes__c: this.editingDoc.notes,
            Compliance_Category__c: 'Identity',
        };

        console.log('📦 FINAL PAYLOAD SENT TO APEX:', JSON.stringify(payload, null, 2));
        console.log('🏢 facilityId being sent:', this._facilityId);

        saveFacilityDoc({ recordData: payload, facilityId: this._facilityId })
            .then(result => {
                console.log('✅ APEX SAVE SUCCESS — Raw Apex Response:', JSON.parse(JSON.stringify(result)));
                console.log('🔄 Calling loadDocuments() to refresh table…');

                this.showToast('Success', 'Document saved successfully', 'success');
                this.closeModal();

                // refresh documents after save
                this.loadDocuments();
            })
            .catch(error => {
                console.error('❌ ERROR saving document:', JSON.stringify(error, null, 2));
                console.error('❌ Apex Error Body:', error?.body);
                console.error('❌ Apex Error Message:', error?.body?.message);

                this.showToast(
                    'Error',
                    error?.body?.message || 'Error saving document',
                    'error'
                );
            });
    }

    get chevronIcon() {
        return this.isRolesOpen ? "utility:chevrondown" : "utility:chevronright";
    }

    handleOutsideClick(event) {
        const dropdown = this.template.querySelector('.dropdown-container');
        const isClickInside = dropdown && dropdown.contains(event.target);
        
        // If click is outside the dropdown, close it
        if (!isClickInside) {
            this.isRolesOpen = false;
            document.removeEventListener('click', this.handleOutsideClick.bind(this));
        }
    }

    // manendra added for sorting the data in table
    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        if (!field) {
            return;
        }
        if (this.sortField === field) {
            this.sortDirection =
                this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        Object.keys(this.sortIcons).forEach(key => {
            this.sortIcons[key] = '';
        });
        this.sortIcons[field] =
            this.sortDirection === 'asc'
                ? 'arrow_upward'
                : 'arrow_downward';
        this.sortIcons = { ...this.sortIcons };
        this.documents = this.sortData(this.documents);
        this.pageNumber = 1;
    }
    sortData(data) {

        if (!this.sortField) {
            return [...data];
        }
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        return [...data].sort((a, b) => {
            const valueA = a[this.sortField];
            const valueB = b[this.sortField];
            const emptyA =
                valueA === null ||
                valueA === undefined ||
                valueA === '' ||
                valueA === 'N/A';
            const emptyB =
                valueB === null ||
                valueB === undefined ||
                valueB === '' ||
                valueB === 'N/A';
            if (emptyA && emptyB) return 0;
            if (emptyA) return 1;
            if (emptyB) return -1;
            return (
                String(valueA).localeCompare(
                    String(valueB),
                    undefined,
                    {
                        numeric: true,
                        sensitivity: 'base'
                    }
                ) * direction
            );
        });
    }
//end
}