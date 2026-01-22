import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getDocuments from '@salesforce/apex/FacilityDocumentController.getDocuments';
import saveFacilityDoc from '@salesforce/apex/FacilityDocumentController.saveTraining';
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
            this.loadDocuments(); 
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
    @track modalTitle = 'Add Training';
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
        validFor: '',
        roles: [],
        mandatory: false,
        visibleToStaff: false,
        renewalRequired: false,
        reminder1: null,
        reminder2: null,
        notes: ''
    };

    loadDocuments() {
        if (!this._facilityId) return;

        getDocuments({ facilityId: this._facilityId })
            .then(result => {
                const docs = result.filter(d => d.Compliance_Category__c === 'Trainings');
                this.documents = docs.map(d => this.normalizeDoc(d));
            })
            .catch(error => console.error('Error loading documents:', error));
    }

    connectedCallback() {
        if (this._facilityId) {
            this.loadDocuments();
        }
    }

    disconnectedCallback() {
        // Clean up event listener
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }

    validForOptions = [
        { label: '6 months', value: '6 months' },
        { label: '12 months', value: '12 months' },
        { label: '24 months', value: '24 months' },
        { label: '36 months', value: '36 months' }
    ];


    normalizeDoc(input) {
        const category = input.Training_Category__c ? String(input.Training_Category__c) : '';

        return {
            id: input.Id,
            name: input.Document_Name__c || '',
            category: category,
            categoryClass: this.categoryClassMap[category] || 'cat-default status-badge',
            complianceCategory: input.Compliance_Category__c || 'Trainings',
            validFor: input.Valid_For__c,
            roles: input.Roles__c ? input.Roles__c.split(';') : [],
            mandatory: Boolean(input.Mandatory_Document__c),
            visibleToStaff: Boolean(input.Visible_to_Staff__c),
            renewalRequired: Boolean(input.Expiry_Date_Required__c),
            reminder1: input.Reminder1__c || null,
            reminder2: input.Reminder2__c || null,
            notes: input.Notes__c || ''
        };
    }
    
    categoryOptions = [
        { label: 'Mandatory', value: 'Mandatory' },
        { label: 'Professional Development', value: 'Professional Development' },
        { label: 'Induction', value: 'Induction' }
    ];
    
    categoryClassMap = {
        'Mandatory': 'cat-Policy',
        'Professional Development': 'cat-Compliance status-badge',
        'Induction': 'cat-Qualification'
    };

    // ------------------------------------------------------------
    // LOAD ROLES
    // ------------------------------------------------------------
    loadFacilityRoles() {
        getFacilityRoles({ facilityId: this._facilityId })
            .then(result => {
                this.options = result.map((r, i) => ({
                    id: String(i),
                    label: r,
                    checked: false,
                    badgeClass: 'status-badge1 status-badge-inactive1',
                    statusText: 'Inactive'
                }));
                
                this.displayText = 'Select Roles'; // Initialize display text
            })
            .catch(error => console.error('Error loading roles:', error));
    }

    // ------------------------------------------------------------
    // METRICS
    // ------------------------------------------------------------
    get mandatoryCount() { return this.documents.filter(d => d.mandatory).length; }
    get visibleCount() { return this.documents.filter(d => d.visibleToStaff).length; }
    get renewalCount() { return this.documents.filter(d => d.renewalRequired).length; }
    get totalTrainings() { return this.documents.length; }
    
    // ------------------------------------------------------------
    // PAGINATION
    // ------------------------------------------------------------
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
        this.modalTitle = 'Add Training';

        this.editingDoc = {
            name: '',
            category: '',
            validFor: '',
            roles: [],
            mandatory: false,
            visibleToStaff: false,
            renewalRequired: false,
            reminder1: null,
            reminder2: null,
            notes: ''
        };
        
        // Reset roles selection
        this.options = this.options.map(opt => ({
            ...opt,
            checked: false,
            buttonClass: 'option-button',
            badgeClass: 'status-badge1 status-badge-inactive1',
            statusText: 'Inactive'
        }));
        
        this.displayText = 'Select Roles';
        this.showModal = true;
    }

    handleEdit(e) {
        const id = e.currentTarget.dataset.id;
        const doc = this.documents.find(d => d.id === id);
        if (!doc) return;

        this.modalTitle = "Edit Training";
        this.editingDoc = { ...doc };

        // Sync UI roles with saved roles
        this.options = this.options.map(opt => ({
            ...opt,
            checked: doc.roles.includes(opt.label),
            buttonClass: doc.roles.includes(opt.label) ? 'option-button active' : 'option-button',
            badgeClass: doc.roles.includes(opt.label)
                ? 'status-badge1 status-badge-active1'
                : 'status-badge1 status-badge-inactive1',
            statusText: doc.roles.includes(opt.label) ? 'Active' : 'Inactive'
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
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        const field = e.currentTarget.dataset.field;
        const checked = e.target.checked;

        // ---- Update LOCAL UI immediately ----
        this.documents = this.documents.map(doc =>
            doc.id === id ? { ...doc, [field]: checked } : doc
        );

        const apiFieldMap = {
            mandatory: 'Mandatory_Document__c',
            visibleToStaff: 'Visible_to_Staff__c',
            renewalRequired: 'Expiry_Date_Required__c'
        };

        const apiField = apiFieldMap[field];

        saveFacilityDoc({
            recordData: { Id: id, [apiField]: checked },
            facilityId: this._facilityId
        })
        .then(() => {
            return this.loadDocuments(); // force full refresh
        })
        .catch(error => {
            console.error('Toggle update error:', error);
            this.showToast('Error', 'Error updating record', 'error');
        });
    }

    // ------------------------------------------------------------
    // DELETE DOCUMENT
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // DROPDOWN METHODS (FIXED VERSION)
    // ------------------------------------------------------------
    toggleRolesDropdown(event) {
        event.stopPropagation(); 
        this.isRolesOpen = !this.isRolesOpen;
        if (this.isRolesOpen) {
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick.bind(this));
            }, 0);
        } else {
            document.removeEventListener('click', this.handleOutsideClick.bind(this));
        }
    }

    handleOutsideClick(event) {
        const dropdown = this.template.querySelector('.dropdown-container');
        const isClickInside = dropdown && dropdown.contains(event.target);
        
        if (!isClickInside) {
            this.isRolesOpen = false;
            document.removeEventListener('click', this.handleOutsideClick.bind(this));
        }
    }

    handleSelectRole(event) {
        event.stopPropagation();
        const id = event.target.dataset.optionId;
        
        this.options = this.options.map(opt => {
            if (opt.id === id) {
                opt.checked = !opt.checked;
                opt.statusText = opt.checked ? 'Active' : 'Inactive';
                opt.badgeClass = opt.checked 
                    ? 'status-badge1 status-badge-active1' 
                    : 'status-badge1 status-badge-inactive1';
                opt.buttonClass = opt.checked ? 'option-button active' : 'option-button';
            }
            return opt;
        });

        this.editingDoc.roles = this.options
            .filter(o => o.checked)
            .map(o => o.label);

        this.updateRolesDisplay();
    }

    handleToggleRole(event) {
        event.stopPropagation(); 
        const id = event.target.dataset.optionId;
        const isActive = event.target.checked;

        this.options = this.options.map(opt => {
            if (opt.id === id) {
                opt.checked = isActive;
                opt.statusText = isActive ? 'Active' : 'Inactive';
                opt.badgeClass = isActive 
                    ? 'status-badge1 status-badge-active1' 
                    : 'status-badge1 status-badge-inactive1';
                opt.buttonClass = opt.checked ? 'option-button active' : 'option-button';
            }
            return opt;
        });

        this.editingDoc.roles = this.options
            .filter(o => o.checked)
            .map(o => o.label);

        this.updateRolesDisplay();
    }

    updateRolesDisplay() {
        const selected = this.options.filter(r => r.checked).map(r => r.label);
        this.displayText = selected.length ? selected.join(', ') : 'Select Roles';
    }

    get selectedRolesString() {
        return this.options.filter(r => r.checked).map(r => r.label).join(';');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

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
        
        this.editingDoc = {
            ...this.editingDoc,
            [field]: value
        };
    }

    saveDocument() {
        if (!this.editingDoc.name || this.editingDoc.name.trim() === '') {
            this.showToast('Error', 'Document Name is required', 'error');
            return;
        }

        if (!this.editingDoc.category || this.editingDoc.category.trim() === '') {
            this.showToast('Error', 'Category is required', 'error');
            return;
        }

        if (!this.editingDoc.validFor || this.editingDoc.validFor.toString().trim() === '') {
            this.showToast('Error', 'Valid For value is required', 'error');
            return;
        }

        if (!this.editingDoc.roles || this.editingDoc.roles.length === 0) {
            this.showToast('Error', 'At least one Role must be selected', 'error');
            return;
        }

        const payload = {
            Id: this.editingDoc.id || null,
            Document_Name__c: this.editingDoc.name,
            Training_Category__c: this.editingDoc.category,
            Valid_For__c: this.editingDoc.validFor, 
            Roles__c: this.editingDoc.roles.join(';'),
            Mandatory_Document__c: Boolean(this.editingDoc.mandatory),
            Visible_to_Staff__c: Boolean(this.editingDoc.visibleToStaff),
            Expiry_Date_Required__c: Boolean(this.editingDoc.renewalRequired),
            Reminder1__c: this.editingDoc.reminder1,
            Reminder2__c: this.editingDoc.reminder2,
            Notes__c: this.editingDoc.notes,
            Compliance_Category__c: 'Trainings'
        };
        
        saveFacilityDoc({ recordData: payload, facilityId: this._facilityId })
            .then(() => {
                this.showToast('Success', 'Document saved successfully', 'success');
                this.closeModal();
                this.loadDocuments();
            })
            .catch(error => {
                console.error('Error saving document:', JSON.stringify(error));
                this.showToast('Error', error?.body?.message || 'Error saving document', 'error');
            });
    }

    get chevronIcon() {
        return this.isRolesOpen ? "utility:chevrondown" : "utility:chevronright";
    }

    handleDropdownClick(event) {
        event.stopPropagation();
    }

    handleToggleContainerClick(event) {
        event.stopPropagation();
    }

    handleToggleClick(event) {
        event.stopPropagation();
    }
}