import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getOrganisationDocuments from '@salesforce/apex/FacilityDocumentController.getOrganisationDocuments';
import saveDocumentForOrganisation from '@salesforce/apex/FacilityDocumentController.saveDocumentForOrganisation';
import UpdateDocumentForOrganisation from '@salesforce/apex/FacilityDocumentController.UpdateDocumentForOrganisation';
import getOrganisationRoles from '@salesforce/apex/FacilityDocumentController.getOrganisationRoles';
import deleteOrganisationDocument from '@salesforce/apex/FacilityDocumentController.deleteOrganisationDocument';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import getFacilityRecords from '@salesforce/apex/FacilityDocumentController.getFacilityRecords';

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
    @track orgcheckbox=false;

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
    @track facilityPreferredName;
    @track facilityOptions=[];
    @track selctedMultipleFcailityValues;
    @track selectedRoleValueLabels;
    @track roleoptionsforFacility;
    @track orgFlag=true;


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
    //manendra added for sorting 
    @track sortField = '';
    @track sortDirection = 'asc';
    @track sortIcons = {
    name: '',
    category: '',
    points: ''
    };

    connectedCallback() {
        // Bind the outside click listener
        document.addEventListener('click', this._boundHandleOutsideClick)
        this._boundHandleOutsideClick = this.handleOutsideClick.bind(this);
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.loadFacilities();
    }

    disconnectedCallback() {
        if (this._boundHandleOutsideClick) {
            document.removeEventListener('click', this._boundHandleOutsideClick);
        }
    }

    loadFacilities() {

    getFacilityData()
        .then(response => {

            console.log('Facility data fetched successfully:', response);
             

            this.facilityOptions = response.map(record => ({
                label: record.Name,
                value: record.Id
            }));

        })
        .catch(error => {

            console.error('Error fetching facilities:', error);

        });
}

    loadDocuments() {

        getOrganisationDocuments({
            organisationId: this._organisationId
        })
        .then(result => {

            console.log('Documents received from Apex:', JSON.stringify(result));

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
        const category = input.documentRec.Documents_Category__c ? String(input.documentRec.Documents_Category__c) : '';
        let pointsDisplay = '';
        if (input.documentRec.X100_pointcheck__c) {
            const match = String(input.documentRec.X100_pointcheck__c).match(/\d+/);
            pointsDisplay = match ? match[0] : '0';
        } else {
            pointsDisplay = '0';
        }
        return {
            id: input.documentRec.Id,
            name: input.documentRec.Document_Name__c || '',
            category: category,
            categoryClass: this.categoryClassMap[category] || 'cat-default status-badge',
            complianceCategory: input.documentRec.Compliance_Category__c || 'Documents',
            points: pointsDisplay, 
            pointsFull: input.documentRec.X100_pointcheck__c || '0 Points',
            //roles: input.rolesDisplay ? input.rolesDisplay.split(';') : [],
            roles: input.rolesDisplay? input.rolesDisplay.split(/[;,]/).map(role => role.trim()) : [],
            mandatory: Boolean(input.documentRec.Mandatory_Document__c),
            visibleToStaff: Boolean(input.documentRec.Visible_to_Staff__c),
            expiryRequired: Boolean(input.documentRec.Expiry_Date_Required__c),
            reminder1: input.documentRec.Reminder1__c || null,
            reminder2: input.documentRec.Reminder2__c || null,
            notes: input.documentRec.Notes__c || '',
            facilityIds: input.documentRec.Facility_Ids__c || '',
            orgFlag: input.documentRec.Org__c
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
        this.orgFlag=true;
        this.orgcheckbox=false;
        this.selectedRoleValueLabels = [];
        this.selctedMultipleFcailityValues = [];
        this.roleoptionsforFacility = [];

        this.isEditMode = false;
        this.existingChildData = null;

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
        this.SaveButton =false;
    }

    handleEdit(e) {
        const id = e.currentTarget.dataset.id;
        const doc = this.documents.find(d => d.id === id);
        console.log('doc',JSON.stringify(doc));

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

        this.orgFlag = doc.orgFlag;
        this.orgcheckbox=true;

        if (!this.orgFlag && doc.facilityIds) {

            const recordIds = doc.facilityIds.split(';');

            console.log(
                'Facility Record Ids:',
                JSON.stringify(recordIds)
            );

            getFacilityRecords({ recordIds })
                .then(result => {

                    console.log('Facility Records:',JSON.stringify(result));

                    // Store for restore logic
                    this.existingChildData = result;

                    // Facility multiselect values
                    this.selctedMultipleFcailityValues =
                        result.map(r => r.Facility__c);

                    console.log(
                        'Selected Facilities:',
                        JSON.stringify(this.selctedMultipleFcailityValues)
                    );

                    // Edit mode
                    this.isEditMode = true;

                    // Load facility roles
                    this.fetchRoleOptions();
                })
                .catch(error => {
                    console.error(
                        'Error fetching facility records',
                        error
                    );
                });
        }else{

    
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

}

        const numericPoints = doc.pointsFull || doc.points || '0';
        const match = String(numericPoints).match(/\d+/);

        this.editingDoc.points = match ? `${match[0]} Points` : '0 Points';

      

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
        console.log('apiField',JSON.stringify(apiField));

       /*  UpdateDocumentForOrganisation({
            recordData: { Id: id, [apiField]: checked },
            organisationId: this._organisationId
        }) */
        UpdateDocumentForOrganisation({ recordId: id, fieldName: apiField, value: checked, organisationId: this._organisationId})
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
        console.log('doc',JSON.stringify(doc));

        if (!doc) return;

         if (doc.facilityIds && doc.facilityIds.trim() !== '') {
        
        const facilityCount = doc.facilityIds.split(';').length;

        this.showToast(
            'Warning',
            `Deleting this document will also delete ${facilityCount} associated facility documents.`,
            'warning'
        );
    }

        this.docToDeleteId = id;
        this.docToDeleteName = doc.name;
        this.showDeleteConfirm = true;
    }

    cancelDelete() {
        this.showDeleteConfirm = false;
        this.docToDeleteId = null;
        this.docToDeleteName = '';
    }

    // confirmDelete() {
    //     deleteOrganisationDocument({ documentId: this.docToDeleteId })
    //         .then(() => {
    //             this.showToast('Success', 'Document deleted', 'success');
    //             this.loadDocuments();
    //         })
    //         .catch(error => {
    //             this.showToast('Error', error.body.message, 'error');
    //         })
    //         .finally(() => this.cancelDelete());
    // }

    confirmDelete() {
        deleteOrganisationDocument({ documentId: this.docToDeleteId })
            .then(() => {
                this.showToast(
                    'Success',
                    'Document deleted successfully.',
                    'success'
                );
                this.loadDocuments();
            })
            .catch(error => {
                this.showToast(
                    'Error',
                    error?.body?.message || 'Unable to delete document.',
                    'error'
                );
            })
            .finally(() => {
                this.cancelDelete();
            });
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

    @track SaveButton=false;

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
         if (field === 'name') {

       // const currentName = (value || '').trim().toLowerCase();
       const currentName = (value || '').trim().replace(/\s+/g, ' ').toLowerCase();

        const duplicate = this.documents.some(doc => {

            // ignore same record while editing
            if (this.editingDoc.id && doc.id === this.editingDoc.id) {
                return false;
            }

            return (
                (doc.name || '').trim().replace(/\s+/g, ' ').toLowerCase() === currentName
            );
        });

        if (duplicate) {

            event.target.setCustomValidity(
                'Document name already exists'
            );
            this.SaveButton=true;

        } else {

            event.target.setCustomValidity('');
             this.SaveButton=false;
        }

        event.target.reportValidity();
    }
    }

    handleRolesChange(event) {
        this.editingDoc.roles = event.detail.value;
    }

    saveDocument() {
        if (this.SaveButton) {
            return;
        }
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

        if(this.orgFlag){
       // 4️⃣ Roles Required (at least one)
        if (!this.editingDoc.roles || this.editingDoc.roles.length === 0) {
            this.showToast('Error', 'Please select at least one Role.', 'error');
            return;
        }
        }

        if ( (!this.orgFlag && (!this.selectedRoleValueLabels || this.selectedRoleValueLabels.length === 0))) {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select at least one role.',
                    variant: 'error'
                })
            );

            return;
        }

        if (!this.orgFlag) {
            const selectedFacilities = this.selctedMultipleFcailityValues || [];
            const selectedRoles = this.selectedRoleValueLabels || [];

            // Extract facilityIds from roles
            const roleFacilityMap = selectedRoles.map(item => {
                const parts = item.split('|');
                return parts.length > 1 ? parts[1] : null;
            });

            // Find facilities without roles
            const facilitiesWithoutRoles = selectedFacilities.filter(facilityId => 
                !roleFacilityMap.includes(facilityId)
            );

            if (facilitiesWithoutRoles.length > 0) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Each selected facility must have at least one role.',
                        variant: 'error'
                    })
                );
                return;
            }
        }

      /*   // 4️⃣ Roles Required (at least one)
        if (!this.editingDoc.roles || this.editingDoc.roles.length === 0) {
            this.showToast('Error', 'Please select at least one Role.', 'error');
            return;
        } */
        
        this.SaveButton = true;
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
        saveDocumentForOrganisation({recordData: payload, organisationId: this._organisationId,  orgFlag: this.orgFlag, facilityIds: this.selctedMultipleFcailityValues, selectedRoles: this.selectedRoleValueLabels})
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
            this.SaveButton = false;
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

     handleFacilityChange(event) {

        // ✅ Ignore search typing events
        if (!Array.isArray(event.detail.value)) {
            console.log('Ignored search event:', event.detail);
            return;
        }

        const selectedFacilityIds = event.detail.value || [];

        console.log('Selected Facilities:', selectedFacilityIds);

        // ✅ Store selected facilities
        this.selctedMultipleFcailityValues = [...selectedFacilityIds];

        // ✅ Fetch roles based on facilities
        this.fetchRoleOptions();
    }

      fetchRoleOptions() {

    // ✅ Preserve previously selected roles
    const prevSelectedRoles = this.selectedRoleValueLabels || [];

    getRoleOptionsByFacility({ facilityIdList: this.selctedMultipleFcailityValues })
        .then(result => {

          //  console.log('Role options received:', JSON.stringify(result));

            // ✅ Rebuild options
            this.roleoptionsforFacility = result.map((role, index) => {
                return {
                    id: index.toString(),
                    label: role.Role_Name__c,
                    value: role.Role_Name__c,
                    facilityValue: role.Facility__c,
                    facilityName: role.Facility__r.Name,
                    displaylabel: role.Role_Name__c + '-' + role.Facility__r.Name,
                    combinedValue: role.Role_Name__c + '|' + role.Facility__c
                };
            });

           // console.log('roleoptionsforFacility (enhanced):', JSON.stringify(this.roleoptionsforFacility));

         if (this.isEditMode && this.existingChildData) {

            // ✅ EDIT FLOW
            const selectedValues = [];

            this.existingChildData.forEach(child => {
                const roles = (child.Roles__c || '').split(';');

                roles.forEach(roleName => {
                    const match = this.roleoptionsforFacility.find(
                        r =>
                            r.label === roleName.trim() &&
                            r.facilityValue === child.Facility__c
                    );

                    if (match) {
                        selectedValues.push(match.combinedValue);
                    }
                });
            });

            this.selectedRoleValueLabels = selectedValues;

        } else {

            // ✅ CREATE FLOW
            this.selectedRoleValueLabels = this.roleoptionsforFacility
                .filter(role => prevSelectedRoles.includes(role.combinedValue))
                .map(role => role.combinedValue);
        }

          //  console.log('Restored selected roles:', JSON.stringify(this.selectedRoleValueLabels));

        })
        .catch(error => {
            console.error('Error fetching role options:', error);
        });
}

handleRolesChange(event) {

    const selectedValues = event.detail?.values || [];

    // ✅ Extract role + facilityId
    const parsed = selectedValues.map(val => {
        const [roleName, facilityId] = val.split('|');
        return { roleName, facilityId };
    });

    console.log('Parsed:', JSON.stringify(parsed));

    this.selectedRoleValueLabels = [...selectedValues];
    console.log('this.selectedRoleValueLabels ',JSON.stringify(this.selectedRoleValueLabels ));
}

handleOrgChange(event) {

    this.orgFlag = event.target.checked;

    console.log('Org Flag:', this.orgFlag);
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