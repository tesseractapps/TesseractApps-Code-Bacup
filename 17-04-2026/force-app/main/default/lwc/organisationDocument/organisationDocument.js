import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getOrganisationDocuments from '@salesforce/apex/FacilityDocumentController.getOrganisationDocuments';
import saveDocumentForOrganisation from '@salesforce/apex/FacilityDocumentController.saveDocumentForOrganisation';
import getOrganisationRoles from '@salesforce/apex/FacilityDocumentController.getOrganisationRoles';
import deleteOrganisationDocument from '@salesforce/apex/FacilityDocumentController.deleteOrganisationDocument';

export default class FacilityDocument extends LightningElement {

    @api
    set organisationId(value) {
        console.log('📥 organisationId received in child:', value);

        this._organisationId = value;

        if (value) {
            this.loadDocuments();
            this.loadOrganisationRoles();
        }
    }

    get organisationId() {
        return this._organisationId;
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
    @track rolesDisplayText = 'Select Roles';

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

    connectedCallback() {
        // Bind the outside click listener
        document.addEventListener('click', this._boundHandleOutsideClick)
        this._boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    }

    disconnectedCallback() {
        if (this._boundHandleOutsideClick) {
            document.removeEventListener('click', this._boundHandleOutsideClick);
        }
    }

    loadDocuments() {

        getOrganisationDocuments({
            organisationId: this._organisationId
        })
        .then(result => {

            console.log('Documents received from Apex:', result);

            this.documents = result.map(r => this.normalizeDoc(r));

            console.log('Mapped documents for UI:', this.documents);
        })
        .catch(error => {
            console.error('Error loading organisation documents:', error);
            console.log('Full error:', JSON.stringify(error));

            if (error?.body?.message) {
                console.error('Apex error message:', error.body.message);
            }
        });
    }

    pointsOptions = [
        { label: '0 Points', value: '0 Points' },
        { label: '25 Points', value: '25 Points' },
        { label: '40 Points', value: '40 Points' },
        { label: '60 Points', value: '60 Points' },
        { label: '70 Points', value: '70 Points' }
    ];

    normalizeDoc(input) {
        const category = input.Documents_Category__c ? String(input.Documents_Category__c) : '';
        let pointsDisplay = '';
        if (input.X100_pointcheck__c) {
            const match = String(input.X100_pointcheck__c).match(/\d+/);
            pointsDisplay = match ? match[0] : '0';
        } else {
            pointsDisplay = '0';
        }
        return {
            id: input.Id,
            name: input.Document_Name__c || '',
            category: category,
            categoryClass: this.categoryClassMap[category] || 'cat-default status-badge',
            complianceCategory: input.Compliance_Category__c || 'Documents',
            points: pointsDisplay, 
            pointsFull: input.X100_pointcheck__c || '0 Points',
            roles: input.Org_Roles__c ? input.Org_Roles__c.split(';') : [],
            mandatory: Boolean(input.Mandatory_Document__c),
            visibleToStaff: Boolean(input.Visible_to_Staff__c),
            expiryRequired: Boolean(input.Expiry_Date_Required__c),
            reminder1: input.Reminder1__c || null,
            reminder2: input.Reminder2__c || null,
            notes: input.Notes__c || ''
        };
    }

    categoryOptions = [
        { label: 'Policy/Acknowledgement', value: 'Policy/Acknowledgement' },
        { label: 'Compliance', value: 'Compliance' },
        { label: 'Qualification', value: 'Qualification' }
    ];
    categoryClassMap = {
        'Policy/Acknowledgement': 'cat-Policy status-badge',
        'Compliance': 'cat-Compliance',
        'Qualification': 'cat-Qualification'
    };

    // LOAD ROLES
    loadOrganisationRoles() {

        if (!this._organisationId) {
            console.warn('⚠️ No organisationId provided. Stopping execution.');
            console.groupEnd();
            return;
        }

        getOrganisationRoles({ organisationId: this._organisationId })
            .then(result => {

                this.options = result.map((r, i) => {

                    return {
                        id: String(i),
                        label: r.Role_Name__c,
                        checked: false
                    };
                });
            })
            .catch(error => {
                console.error('❌ Error loading organisation roles:', error);
            })
            .finally(() => {
                console.groupEnd();
            });
    }

    // METRICS
    get totalDocuments() { return this.documents.length; }
    get mandatoryCount() { return this.documents.filter(d => d.mandatory).length; }
    get visibleCount() { return this.documents.filter(d => d.visibleToStaff).length; }

    get totalPoints() {
        return this.documents.reduce((sum, doc) => {
            const val = parseInt(doc.points);
            return isNaN(val) ? sum : sum + val;
        }, 0);
    }

    // PAGINATION
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
        }));
        this.rolesDisplayText = 'Select Roles';
        this.showModal = true;
    }

    handleEdit(e) {
        const id = e.currentTarget.dataset.id;
        const doc = this.documents.find(d => d.id === id);

        if (!doc) {
            console.warn('⚠️ No document found for given Id');
            console.groupEnd();
            return;
        }

        this.modalTitle = "Edit Document";

        this.editingDoc = {
            ...doc,
            id: doc.id   
        };

        const numericPoints = doc.pointsFull || doc.points || '0';
        const match = String(numericPoints).match(/\d+/);

        this.editingDoc.points = match ? `${match[0]} Points` : '0 Points';
        // Sync UI roles with saved roles
        this.options = this.options.map(opt => {
            const isChecked = doc.roles.includes(opt.label);

            return {
                ...opt,
                checked: isChecked,
                buttonClass: isChecked ? 'option-button active' : 'option-button'
            };
        });

        this.rolesDisplayText = doc.roles.length
            ? doc.roles.join(', ')
            : 'Select Roles';

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
        e.preventDefault();
        e.stopPropagation();
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

        saveDocumentForOrganisation({
            recordData: { Id: id, [apiField]: checked },
            organisationId: this._organisationId
        })
        .then(() => {
            console.log('Toggle saved, refreshing...');
            return this.loadDocuments(); 
        })
        .catch(error => {
            console.error('Toggle update error:', error);
            this.showToast('Error', 'Error updating record', 'error');
        });
    }

    // DELETE DOCUMENT
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
        deleteOrganisationDocument({ documentId: this.docToDeleteId })
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
        if (this.isRolesOpen) {
            setTimeout(() => {
                document.addEventListener('click', this._boundHandleOutsideClick);
            }, 0);
        } else {
            document.removeEventListener('click', this._boundHandleOutsideClick);
        }
    }

    get rolesSelectedClass() {
        return this.editingDoc.roles.length > 0 
            ? 'selected-text slds-truncate' 
            : 'placeholder-text slds-truncate';
    }

    handleToggleRole(event) {
        const id = event.target.dataset.optionId;
        const isActive = event.target.checked;

        this.options = this.options.map(opt => {
            if (opt.id === id) {
                opt.checked = isActive;
            }
            return opt;
        });

        this.editingDoc.roles = this.options
            .filter(o => o.checked)
            .map(o => o.label);

        this.rolesDisplayText = this.editingDoc.roles.length
            ? this.editingDoc.roles.join(', ')
            : 'Select Roles';
    }

    updateRolesDisplay() {
        const selected = this.options.filter(r => r.checked).map(r => r.label);
        this.rolesDisplayText = selected.length ? selected.join(', ') : 'Select Roles';
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

        console.log(`Modal change - Field: ${field}, Value: ${value}, Type: ${event.target.type}`);
        
        this.editingDoc = {
            ...this.editingDoc,
            [field]: value
        };
        
        console.log('Updated editingDoc:', JSON.stringify(this.editingDoc));
    }

    handleRolesChange(event) {
        this.editingDoc.roles = event.detail.value;
    }

    saveDocument() {
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

        // Convert to string if it's a number
        let pointsValue = this.editingDoc.points;
    
        // Convert to string if it's a number
        if (typeof pointsValue === 'number') {
            pointsValue = pointsValue.toString();
        }
        
        // Check if points is empty
        if (!pointsValue || (typeof pointsValue === 'string' && pointsValue.trim() === '')) {
            this.showToast('Error', 'Please select Points.', 'error');
            return;
        }

        // 4️⃣ Roles Required (at least one)
        if (!this.editingDoc.roles || this.editingDoc.roles.length === 0) {
            this.showToast('Error', 'Please select at least one Role.', 'error');
            return;
        }

        // 4️⃣ Roles Required (at least one)
        if (!this.editingDoc.roles || this.editingDoc.roles.length === 0) {
            this.showToast('Error', 'Please select at least one Role.', 'error');
            return;
        }
        
        const payload = {
            Id: this.editingDoc.id,
            Document_Name__c: this.editingDoc.name,
            Documents_Category__c: this.editingDoc.category,
            X100_pointcheck__c: this.editingDoc.points, 
            Org_Roles__c: this.editingDoc.roles.join(';'),
            Mandatory_Document__c: this.editingDoc.mandatory || false,
            Visible_to_Staff__c: this.editingDoc.visibleToStaff || false,
            Expiry_Date_Required__c: this.editingDoc.expiryRequired || false,
            Reminder1__c: this.editingDoc.reminder1,
            Reminder2__c: this.editingDoc.reminder2,
            Notes__c: this.editingDoc.notes,
            Compliance_Category__c: 'Documents'
        };
        
        console.log('Payload being sent to Apex:', JSON.stringify(payload, null, 2));
        saveDocumentForOrganisation({recordData: payload, organisationId: this._organisationId})
        .then(() => {
            console.log('🔄 Reloading documents after save...');
            this.showToast('Success', 'Document saved successfully', 'success');
            this.closeModal();
            setTimeout(() => {
                this.loadDocuments();
            }, 100);
        })
        .catch(error => {
            console.error('Error saving document:', JSON.stringify(error));
            this.showToast('Error', error?.body?.message || 'Error saving document', 'error');
        });
    }

    get chevronIcon() {
        return this.isRolesOpen ? "utility:chevrondown" : "utility:chevronright";
    }

    handleOutsideClick(event) {
        const dropdown = this.template.querySelector('.dropdown-container');

        // If clicked outside dropdown, close it
        if (dropdown && !dropdown.contains(event.target)) {
            this.isRolesOpen = false;
            document.removeEventListener('click', this._boundHandleOutsideClick);
        }
    }

    stopInsideClick(event) {
        event.stopPropagation();
    }
}