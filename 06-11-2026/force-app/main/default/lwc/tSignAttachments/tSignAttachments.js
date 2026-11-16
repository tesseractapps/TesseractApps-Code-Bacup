import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

import UserType from '@salesforce/schema/User.User_Type__c';

import getDocuments from '@salesforce/apex/tSignAttachmentHandler.getDocuments';
import getArchivedDocuments from '@salesforce/apex/tSignAttachmentHandler.getArchivedDocuments';
import UpdateFileSize from '@salesforce/apex/tSignAttachmentHandler.UpdateFileSize';
import deleteDocument from '@salesforce/apex/tSignAttachmentHandler.deleteDocument';
import archiveDocument from '@salesforce/apex/tSignAttachmentHandler.archiveDocument';
import restoreDocument from '@salesforce/apex/tSignAttachmentHandler.restoreDocument';
import getFolders from '@salesforce/apex/tSignAttachmentHandler.getFolders';
import createFolderApex from '@salesforce/apex/tSignAttachmentHandler.createFolder';
import getShareableStaff from '@salesforce/apex/tSignAttachmentHandler.getShareableStaff';
import fetchStaffByDoc from '@salesforce/apex/tSignAttachmentHandler.fetchStaffByDoc';
import saveDocumentShares from '@salesforce/apex/tSignAttachmentHandler.saveDocumentShares';
import fetchFolderSharedStaff from '@salesforce/apex/tSignAttachmentHandler.fetchFolderSharedStaff';
import saveFolderShares from '@salesforce/apex/tSignAttachmentHandler.saveFolderShares';
import getDocumentEmailContent from '@salesforce/apex/tSignAttachmentHandler.getDocumentEmailContent';
import sendDocumentEmail from '@salesforce/apex/tSignAttachmentHandler.sendDocumentEmail';
import getDocumentEmailHistory from '@salesforce/apex/tSignAttachmentHandler.getDocumentEmailHistory';
import getDocumentTypes from '@salesforce/apex/tSignAttachmentHandler.getDocumentTypes';
import saveNewDocumentType from '@salesforce/apex/tSignAttachmentHandler.saveNewDocumentType';
import getOrganisationAccountType from '@salesforce/apex/tSignAttachmentHandler.getOrganisationAccountType';
import getCurrentUserOrganisation from '@salesforce/apex/tSignContactController.getCurrentUserOrganisation';
import updateFolderName from '@salesforce/apex/tSignAttachmentHandler.updateFolderName';

const ORG_ADMIN = 'T Sign Org Admin';
const MANAGER = 'T Sign Manager';
const STAFF = 'T Sign Staff';
const INDIVIDUAL = 'Individual';
const PUBLIC_NODE = 'PUBLIC_NODE';
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Field on TSign_Document__c that stores each document's type (must be a Text field).
// The list of selectable types lives on TSign_Organisation__c.Document_Types__c.
const TYPE_FIELD_API = 'Type__c';

export default class TSignAttachments extends LightningElement {

    @api orgId;
    @api recordId;

    organisationId;

    // TSign_Organisation__c.Account_Type__c (Organisation / Individual / Business)
    accountType;

    @api
    get subroute() {
        return this._subroute;
    }
    set subroute(val) {
        this._subroute = val;
        this.processSubroute(val);
    }
    _subroute;
    _pendingSubroute;

    // ------------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------------
    currentUserId = Id;
    userType;

    // table
    @track pageSizeOptions = [10, 25, 50, 75, 100];
    @track records = [];
    @track data = [];
    @track totalRecords = 0;
    @track pageSize = 10;
    @track totalPages = 1;
    @track pageNumber = 1;
    @track noRecordsFlag = false;
    @track searchKey = '';
    allRecords = [];

    // modals / views
    @track isHome = true;
    @track isOpenModal = false;
    @track isEdit = false;
    @track isModalOpen = false;
    @track deleteFlag = false;
    @track showArchived = false;      // false = Documents, true = Archived Documents
    @track isShowSpinner = false;
    @track currentUrl;
    @track selectedId;

    // add / edit form
    @track selectedRecordId;
    @track selectedType = '';
    @track typeOptions = [];
    @track isTypeOpen = false;
    @track newTypeText = '';
    @track customTypes = [];        // from TSign_Organisation__c.Document_Types__c
    @track textboxFlag = false;
    @track isFileAttached = false;
    @track isFileExpand = false;
    @track isattachError = false;
    @track uploadedFile = null;
    @track fileName = '';
    @track successmessage = '';
    UpdateDetails = false;
    oldFileKey;

    // EDIT: file currently stored on the record being edited
    @track existingFileName = '';
    @track existingFileUrl = null;
    // old S3 key to remove once the save of a replaced file succeeds
    _pendingOldKeyToDelete = null;

    // folders
    @track currentFolderId = null;
    @track currentFolderName = 'All Documents';
    _folderTree = [];
    @track folders = [];
    @track folderOptions = [];
    @track isCreateFolderModalOpen = false;
    @track folderName = '';
    @track selectedParentFolderId = 'ALL';

    // folder share (uses the same panel + staff state as document share)
    @track folderAssignmentFlag = false;
    @track currentFolderShareId;

    // document share
    @track assignmentFlag = false;
    @track currentDocumentId;
    @track allStaffList = [];
    @track selectedStaffIds = [];
    @track staffSearchKey = '';
    @track staffPageNumber = 1;
    @track staffPageSize = 10;
    initialSharedIds = [];

    // email document
    @track isEmailModalOpen = false;
    @track isSendingEmail = false;
    @track emailDocId;
    @track emailFileName = '';
    @track fromAddress = '';
    @track toAddress = '';
    @track ccAddress = '';
    @track emailSubject = '';
    @track emailBody = '';

    // email history
    @track showEmailHistoryModal = false;
    @track groupedEmailHistory = [];
    @track hasEmailHistory = false;
    @track emailHistoryFileName = '';

    @track isUploading = false;

    // edit folder
    @track isEditFolderModalOpen = false;
    @track editFolderId;
    @track editFolderName = '';
    originalFolderName = '';
    @track isSavingFolder = false;

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    @track tableSortState = {
        attachments: {
            field: '',
            direction: 'asc',
            icons: {
                Name: '',
                type: '',
                fileSize: '',
                comment: '',
                UserName: '',
                lastModifiedUser: '',
                lastModifiedDate: '',
                Date: ''
            }
        },
        archived: {
            field: '',
            direction: 'asc',
            icons: {
                Name: '',
                Type: '',
                ArchivedDate: '',
                ExpiryDate: '',
                ParentFolder: '',
                FolderPath: ''
            }
        }
    };

    // ------------------------------------------------------------------
    // WIRES
    // ------------------------------------------------------------------
    @wire(getRecord, { recordId: Id, fields: [UserType] })
    wiredUser({ data, error }) {
        if (data) {
            this.userType = data.fields.User_Type__c.value;
        } else if (error) {
            console.error('User type load error', JSON.stringify(error));
        }
    }

    // ------------------------------------------------------------------
    // GETTERS
    // ------------------------------------------------------------------
    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    get isOrgAdmin() {
        return this.userType === ORG_ADMIN;
    }

    // Org Admin + Manager. Staff = upload and view only.
    get canManage() {
        return this.userType === ORG_ADMIN || this.userType === MANAGER;
    }

    // Individual accounts have no sharing: Permissions icon hidden for documents + folders
    get isIndividualAccount() {
        return this.accountType === INDIVIDUAL;
    }

    get isPublicContext() {
        return this.currentFolderId === PUBLIC_NODE;
    }

    // folder tree with canModify + canShare flags per node
    get folderTree() {
        return this.decorateFolders(this._folderTree);
    }

    // Edit/Permissions/Delete menu only where the server would allow it:
    decorateFolders(nodes) {
        return (nodes || []).map(n => {
            const canModify =
                !n.isSystemNode &&
                this.canManage &&
                (n.CreatedById === this.currentUserId ||
                    (this.isOrgAdmin && n.CreatedBy?.User_Type__c === MANAGER));
            return {
                ...n,
                canModify,
                canEdit: canModify && this.isOrgAdmin,
                canShare: !this.isIndividualAccount,
                children: this.decorateFolders(n.children)
            };
        });
    }

    // PUBLIC_NODE is virtual, never sent as folderId.
    get docScope() {
        return {
            orgId: this.organisationId,
            folderId: this.isPublicContext ? null : this.currentFolderId,
            publicOnly: this.isPublicContext
        };
    }

    get allFolderClass() {
        return this.currentFolderId === null
            ? 'folder-item selected-folder'
            : 'folder-item';
    }

    get bDisableFirst() {
        return this.pageNumber === 1;
    }

    get bDisableLast() {
        return this.pageNumber === this.totalPages;
    }

    get pageSizeSelectOptions() {
        return this.pageSizeOptions.map(n => ({
            label: String(n),
            value: String(n),
            selected: n === Number(this.pageSize)
        }));
    }

    // row action flags. mirrors server rule:
    // owner, or Org Admin on a Manager's record. Staff gets none.
    get tableRows() {
        const manage = this.canManage;
        const admin = this.isOrgAdmin;
        return (this.data || []).filter(Boolean).map(r => {
            const canModifyRow =
                manage && (admin || r.createdById === this.currentUserId);
            return {
                ...r,
                canModifyRow,
                canShare: canModifyRow && !r.Is_Public__c
            };
        });
    }

    // org custom types only, no case-insensitive duplicates
    rebuildTypeOptions() {
        const seen = new Set();
        const merged = [];
        (this.customTypes || []).forEach(t => {
            const k = (t || '').toLowerCase();
            if (k && !seen.has(k)) {
                seen.add(k);
                merged.push(t);
            }
        });
        this.typeOptions = merged.map(t => ({ label: t, value: t }));
    }

    loadCustomTypes() {
        return getDocumentTypes({ orgId: this.organisationId })
            .then(result => {
                this.customTypes = Array.isArray(result) ? result : [];
                this.rebuildTypeOptions();
            })
            .catch(error => {
                console.error('Load types error', JSON.stringify(error));
            });
    }

    // reads TSign_Organisation__c.Account_Type__c
    loadAccountType() {
        return getOrganisationAccountType({ orgId: this.organisationId })
            .then(type => {
                this.accountType = type;
            })
            .catch(error => {
                console.error('Account type load error', JSON.stringify(error));
            });
    }

    get typeDisplayText() {
        return this.selectedType || 'Select Type';
    }

    get typeOptionItems() {
        return this.typeOptions.map(o => ({
            ...o,
            cssClass: o.value === this.selectedType
                ? 'type-option-button type-option-selected'
                : 'type-option-button'
        }));
    }

    get isAddTypeDisabled() {
        return !this.newTypeText || !this.newTypeText.trim();
    }

    // archive toggle (same idea as the Contacts list)
    get archiveToggleLabel() {
        return this.showArchived ? 'Back to Documents' : 'Archives';
    }

    get archiveIcon() {
        return this.showArchived ? 'utility:undelete' : 'utility:archive';
    }

    get pageTitle() {
        return this.showArchived ? 'Archived Attachments' : 'Attachments';
    }

    get noRecordsText() {
        return this.showArchived ? 'No archived documents found' : 'No records found';
    }

    // EDIT: show the file already attached to the record
    get showExistingFile() {
        return this.isEdit && !!this.existingFileUrl;
    }

    // ------------------------------------------------------------------
    // LIFECYCLE
    // ------------------------------------------------------------------
    connectedCallback() {
        this._typeOutsideClick = this.handleTypeOutsideClick.bind(this);
        document.addEventListener('click', this._typeOutsideClick);

        this.isShowSpinner = true;

        getCurrentUserOrganisation()
            .then(orgId => {
                if (!orgId) {
                    throw new Error(
                        'The current user does not have an organisation Id configured.'
                    );
                }

                // Use the organisation ID returned by Apex for the logged-in user.
                this.organisationId = orgId;

                // Load folders, documents, types and account type only after resolving the organisation.
                return Promise.all([
                    this.loadFolders(),
                    this.loadDocuments(),
                    this.loadCustomTypes(),
                    this.loadAccountType()
                ]);
            })
            .catch(error => {
                console.error(
                    'Current user organisation load error:',
                    JSON.stringify(error)
                );

                this.showToast(
                    this.apexError(
                        error,
                        'Unable to determine the current user organisation'
                    )
                );
            })
            .finally(() => {
                this.isShowSpinner = false;
            });
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._typeOutsideClick);
    }

    // ------------------------------------------------------------------
    // TOAST / ERROR
    // ------------------------------------------------------------------
    showToast(message, variant = 'error', title) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title || (variant === 'success' ? 'Success' : 'Error'),
                message,
                variant
            })
        );
    }

    apexError(error, fallback) {
        return (
            error?.body?.message ||
            error?.body?.pageErrors?.[0]?.message ||
            error?.message ||
            fallback
        );
    }

    // DOCUMENTS
    fullName(user) {
        // Full_Name__c is the User formula field: FirstName & " " & LastName
        return user?.Full_Name__c
            || [user?.FirstName, user?.LastName].filter(Boolean).join(' ');
    }

    formatDate(value) {
        return value ? new Intl.DateTimeFormat('en-GB').format(new Date(value)) : '';
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 MB';

        // legacy formatted string like "9.65 KB"
        if (typeof bytes === 'string' && isNaN(bytes)) {
            return bytes;
        }

        bytes = Number(bytes);
        if (isNaN(bytes) || bytes === 0) return '0 MB';

        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    mapDocument(r) {
        return {
            Id: r.Id,
            Name: r.Name,
            type: r[TYPE_FIELD_API],
            comment: r.Comments__c,
            UserName: this.fullName(r.CreatedBy),
            createdById: r.CreatedById,
            creatorType: r.CreatedBy?.User_Type__c,
            lastModifiedUser: this.fullName(r.LastModifiedBy),
            lastModifiedDate: this.formatDate(r.LastModifiedDate),
            Date: r.Date_Format__c,
            AmazonURL: r.Amazon_file_URL__c,
            fileSize: this.formatFileSize(r.Size__c),
            fileSizeRaw: r.Size__c,
            Key: r.Key__c,
            Is_Public__c: r.Is_Public__c === true
        };
    }

    // single entry point: every refresh respects the current view (Documents / Archived)
    loadDocuments() {
        return this.showArchived
            ? this.loadArchivedFiles()
            : this.loadActiveDocuments();
    }

    loadActiveDocuments() {
        return getDocuments(this.docScope)
            .then(result => {
                this.allRecords = (result || []).map(r => this.mapDocument(r));
                this.records = [...this.allRecords];
                this.totalRecords = this.records.length;
                this.pageNumber = 1;
                this.paginationHelper();

                if (this._pendingSubroute) {
                    const pending = this._pendingSubroute;
                    this._pendingSubroute = null;
                    this.processSubroute(pending);
                }
            })
            .catch(error => {
                console.error('Load documents error', JSON.stringify(error));
                this.showToast(this.apexError(error, 'Unable to load documents'));
            });
    }

    refreshCurrentView() {
        return this.loadDocuments();
    }

    RefreshAttachmentsData() {
        this.refreshCurrentView();
    }

    handleSearch(event) {
        this.searchKey = event.detail?.value ?? event.target.value ?? '';
        const searchValue = (this.searchKey || '').toLowerCase().trim();

        const fields = this.showArchived
            ? ['Name', 'Type', 'ArchivedBy', 'ParentFolder', 'FolderPath']
            : ['Name', 'type', 'UserName', 'lastModifiedUser'];

        this.records = !searchValue
            ? [...this.allRecords]
            : this.allRecords.filter(record =>
                fields.some(f =>
                    (record[f] || '').toLowerCase().includes(searchValue)
                )
            );

        this.totalRecords = this.records.length;
        this.pageNumber = 1;
        this.paginationHelper();
    }

    // ------------------------------------------------------------------
    // PAGINATION + SORT
    // ------------------------------------------------------------------
    handleRecordsPerPage(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.paginationHelper();
    }

    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }

    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }

    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }

    paginationHelper() {
        this.noRecordsFlag = !(this.totalRecords > 0);

        let displayRecords = [...this.records];
        const state = this.showArchived
            ? this.tableSortState.archived
            : this.tableSortState.attachments;
        if (state.field) {
            displayRecords = this.sortData(displayRecords, state.field, state.direction);
        }

        const size = Number(this.pageSize) || 10;
        this.totalPages = Math.max(1, Math.ceil(this.totalRecords / size));

        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        const start = (this.pageNumber - 1) * size;
        this.data = displayRecords.slice(start, start + size);
    }

    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        const table = event.currentTarget.dataset.table;
        if (!field || !table) return;

        const state = this.tableSortState[table];

        if (state.field === field) {
            state.direction = state.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.field = field;
            state.direction = 'asc';
        }

        Object.keys(state.icons).forEach(key => {
            state.icons[key] = '';
        });
        state.icons[field] = state.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';

        this.tableSortState = { ...this.tableSortState };

        this.pageNumber = 1;
        this.paginationHelper();
    }

    sortData(data, sortField, sortDirection) {
        if (!sortField) return [...data];

        const direction = sortDirection === 'asc' ? 1 : -1;
        const isEmpty = v => v === null || v === undefined || v === '' || v === 'N/A';

        return [...data].sort((a, b) => {
            const valueA = a[sortField];
            const valueB = b[sortField];

            if (isEmpty(valueA) && isEmpty(valueB)) return 0;
            if (isEmpty(valueA)) return 1;
            if (isEmpty(valueB)) return -1;

            return (
                String(valueA).localeCompare(String(valueB), undefined, {
                    numeric: true,
                    sensitivity: 'base'
                }) * direction
            );
        });
    }

    // ------------------------------------------------------------------
    // ADD / EDIT
    // ------------------------------------------------------------------
    toggleTypeDropdown(event) {
        event.stopPropagation();
        this.isTypeOpen = !this.isTypeOpen;
    }

    handleTypeSelect(event) {
        this.selectedType = event.currentTarget.dataset.value;
        this.textboxFlag = this.selectedType === 'Other';
        this.isTypeOpen = false;
    }

    handleNewTypeInput(event) {
        this.newTypeText = event.target.value;
    }

    handleNewTypeKeyUp(event) {
        if (event.key === 'Enter' && !this.isAddTypeDisabled) {
            this.handleAddType();
        }
    }

    handleAddType() {
        const value = (this.newTypeText || '').trim();
        if (!value) return;

        if (value.length > 50) {
            this.showToast('Maximum 50 characters allowed.');
            return;
        }
        if (value.includes(',')) {
            this.showToast('Type name cannot contain a comma.');
            return;
        }
        const exists = this.typeOptions.some(
            o => o.value.toLowerCase() === value.toLowerCase()
        );
        if (exists) {
            this.showToast('This type already exists.');
            return;
        }

        saveNewDocumentType({ orgId: this.organisationId, newType: value })
            .then(updated => {
                this.customTypes = updated || [];
                this.rebuildTypeOptions();
                this.selectedType = value;
                this.textboxFlag = false;
                this.newTypeText = '';
                this.showToast('Type added successfully.', 'success');
            })
            .catch(error => {
                this.showToast(this.apexError(error, 'Failed to add type'));
            });
    }

    handleTypeOutsideClick(event) {
        if (!this.isTypeOpen) return;
        const box = this.template.querySelector('.type-dropdown-container');
        if (box && !event.composedPath().includes(box)) {
            this.isTypeOpen = false;
        }
    }

    clearExistingFile() {
        this.existingFileName = '';
        this.existingFileUrl = null;
        this._pendingOldKeyToDelete = null;
    }

    handleAttachment() {
        this.isUploading = false;
        this.successmessage = 'Attachment created successfully.';
        this.isOpenModal = true;
        this.isEdit = false;
        this.UpdateDetails = false;
        this.isattachError = false;
        this.fileName = '';
        this.uploadedFile = null;
        this.isFileAttached = false;
        this.isFileExpand = false;
        this.selectedType = '';
        this.textboxFlag = false;
        this.isTypeOpen = false;
        this.newTypeText = '';
        this.selectedRecordId = null;
        this.oldFileKey = null;
        this.clearExistingFile();
        this._syncRoute();
    }

    handleEdit(event) {
        this.isUploading = false;
        this.isEdit = true;
        this.isOpenModal = false;
        this.successmessage = 'Attachment updated successfully.';
        this.isFileAttached = false;
        this.selectedRecordId = event.currentTarget.dataset.id;
        this.oldFileKey = event.currentTarget.dataset.key;
        this.uploadedFile = null;          // only set when a NEW file is uploaded
        this.fileName = '';
        this.isFileExpand = false;
        this.isattachError = false;
        this.selectedType = event.currentTarget.dataset.type;
        this.textboxFlag = this.selectedType === 'Other';
        this.isTypeOpen = false;
        this.newTypeText = '';
        this._pendingOldKeyToDelete = null;

        // remember the file already stored on this record
        const rec = (this.allRecords || []).find(r => r.Id === this.selectedRecordId);
        this.existingFileName = rec ? rec.Name : (event.currentTarget.dataset.name || '');
        this.existingFileUrl = rec ? rec.AmazonURL : null;
    }

    hideModalBox() {
        this.isUploading = false;
        this.selectedType = '';
        this.isTypeOpen = false;
        this.newTypeText = '';
        this.isOpenModal = false;
        this.isEdit = false;
        this.isFileAttached = false;
        this.uploadedFile = null;
        this.isFileExpand = false;
        this.clearExistingFile();
        this._syncRoute();
    }

    handleSubmit(event) {
        event.preventDefault();

        const creating = !this.isEdit;
        this.UpdateDetails = this.isEdit;

        if (!this.selectedType) {
            this.showToast('Type is required');
            return;
        }

        const uploadedFile = this.uploadedFile?.[0];
        const hasNewFile = !!(
            uploadedFile &&
            uploadedFile.status === 'ok' &&
            uploadedFile.url &&
            uploadedFile.key
        );

        // A file is mandatory only when creating.
        // When editing, keep the existing file unless a new one was uploaded.
        if (creating && !hasNewFile) {
            this.showToast('Please upload a file before submitting', 'error');
            return;
        }

        const fields = event.detail.fields;
        fields[TYPE_FIELD_API] = this.selectedType;

        // Only touch the file fields when a new file was uploaded
        if (hasNewFile) {
            fields.Amazon_file_URL__c = uploadedFile.url;
            fields.Key__c = uploadedFile.key;

            if (uploadedFile.size !== undefined) {
                fields.Size__c = String(uploadedFile.size);
            }
        }

        if (creating) {
            fields.TSign_Organisation__c = this.organisationId;

            if (this.isPublicContext) {
                fields.TSign_Folder__c = null;
                fields.Is_Public__c = true;
                fields.Is_Contact__c = false;
            } else {
                fields.TSign_Folder__c = this.currentFolderId;
                fields.Is_Public__c = false;
                fields.Is_Contact__c = false;
            }
        }

        // The old S3 object is deleted in handleSuccess, only after the save worked.
        this._pendingOldKeyToDelete =
            this.isEdit && hasNewFile && this.oldFileKey ? this.oldFileKey : null;

        this.template
            .querySelector('lightning-record-edit-form')
            .submit(fields);
    }

    handleSuccess(event) {
        this.selectedRecordId = event.detail.id;

        this.showToast(this.successmessage, 'success');

        // save succeeded: now it is safe to remove the replaced file from AWS
        if (this._pendingOldKeyToDelete) {
            this.deleteOldFileFromAWS(this._pendingOldKeyToDelete);
            this._pendingOldKeyToDelete = null;
        }

        this.isOpenModal = false;
        this.isEdit = false;
        this._syncRoute();

        // uploadedFile is an array: take the first element
        const newFile = this.uploadedFile?.[0];

        const done = () => {
            this.uploadedFile = null;
            this.isFileAttached = false;
            this.isFileExpand = false;
            this.selectedType = '';
            this.clearExistingFile();
            return this.refreshCurrentView();
        };

        // create flow: write size, then refresh
        if (this.UpdateDetails === false && newFile) {
            UpdateFileSize({
                docId: this.selectedRecordId,
                filesize: String(newFile.size)
            })
                .then(done)
                .catch(error => {
                    this.showToast(this.apexError(error, 'Error updating file size'));
                    done();
                });
        } else {
            done();
        }
    }

    handleError(event) {
        event.preventDefault();
        const detail = event.detail;
        const messages = [];

        (detail?.output?.errors || []).forEach(err => {
            if (err.message) messages.push(err.message);
        });

        const fieldErrors = detail?.output?.fieldErrors;
        if (fieldErrors) {
            Object.keys(fieldErrors).forEach(fieldName => {
                fieldErrors[fieldName].forEach(error => {
                    messages.push(`${fieldName}: ${error.message}`);
                });
            });
        }

        if (!messages.length && detail?.message) {
            messages.push(detail.message);
        }

        // save failed: do not delete the old file
        this._pendingOldKeyToDelete = null;

        this.showToast(messages.join('\n') || 'An unknown error occurred.', 'error', 'Update Failed');
    }

    async deleteOldFileFromAWS(key) {
        if (!key) return;
        try {
            const response = await fetch('https://tesseractapps.com/delete-file', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            await response.json();
        } catch (error) {
            console.error('AWS delete error:', error);
        }
    }

    // ------------------------------------------------------------------
    // FILE PICK / DROP
    // ------------------------------------------------------------------
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.acceptFiles(Array.from(event.dataTransfer.files || []));
    }

    handleFileSelect(event) {
        this.acceptFiles(Array.from(event.target.files || []));
    }

    triggerFileInput() {
        const input = this.template.querySelector('input[type="file"]');
        if (input) {
            input.value = '';
            input.click();
        }
    }

    // acceptFiles(files) {
    //     if (!files.length) return;

    //     if (files.length > 1) {
    //         this.showToast('Only one file allowed');
    //         return;
    //     }

    //     const file = files[0];

    //     if (file.size > MAX_FILE_BYTES) {
    //         this.isattachError = true;
    //         this.showToast('File size cannot exceed 50 MB');
    //         return;
    //     }
    //     this.isattachError = false;

    //     const pass = () => {
    //         this.isFileExpand = true;
    //         setTimeout(() => {
    //             const svc = this.template.querySelector('c-document-office-service');
    //             if (svc) svc.incomingFiles = [file];
    //         }, 500);
    //     };

    //     // child already holds a file: unmount, then remount with the new one
    //     if (this.isFileExpand) {
    //         this.isFileExpand = false;
    //         this.uploadedFile = null;
    //         this.isFileAttached = false;
    //         setTimeout(pass, 100);
    //         return;
    //     }

    //     pass();
    // }

    acceptFiles(files) {
        if (!files.length) return;

        if (files.length > 1) {
            this.showToast('Only one file allowed');
            return;
        }

        const file = files[0];

        if (file.size > MAX_FILE_BYTES) {
            this.isattachError = true;
            this.showToast('File size cannot exceed 50 MB');
            return;
        }
        this.isattachError = false;

        const pass = () => {
            this.isFileExpand = true;
            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (svc) {
                    svc.incomingFiles = [file];
                    svc.confirmUpload = true;   // auto start, no Upload button click
                    this.isUploading = true;
                }
            }, 500);
        };

        // child already holds a file: unmount, then remount with the new one
        if (this.isFileExpand) {
            this.isFileExpand = false;
            this.uploadedFile = null;
            this.isFileAttached = false;
            this.isUploading = false;
            setTimeout(pass, 100);
            return;
        }

        pass();
    }

    // handleAwsUploadComplete(event) {
    //     const files = event.detail.files || [];
    //     if (!files.length) return;

    //     this.uploadedFile = files[0];
    //     this.fileName = this.uploadedFile.originalName;
    //     this.isFileAttached = true;
    // }

    // handleFileDeleted() {
    //     this.uploadedFile = null;
    //     this.fileName = '';
    //     this.isFileAttached = false;
    //     this.isFileExpand = false;
    // }

    handleAwsUploadComplete(event) {
        const files = event.detail.files || [];
        this.isUploading = false;
        if (!files.length) return;

        this.uploadedFile = files[0];
        this.fileName = this.uploadedFile.originalName;
        this.isFileAttached = true;
    }

    handleAttachmentUpload(event) {

        console.log(
            'Journal Upload Success',
            JSON.stringify(event.detail)
        );

        this.uploadedFile = event.detail.files || [];

        console.log(
            'Uploaded Files',
            JSON.stringify(this.uploadedFile)
        );

        console.log(
            'First Uploaded File',
            JSON.stringify(this.uploadedFile[0])
        );
    }

    handleFileDeleted() {
        this.uploadedFile = null;
        this.fileName = '';
        this.isFileAttached = false;
        this.isFileExpand = false;
        this.isUploading = false;
    }

    // ------------------------------------------------------------------
    // VIEW / DOWNLOAD
    // ------------------------------------------------------------------
    handleView(event) {
        event.preventDefault();
        this.currentUrl = event.currentTarget.dataset.url;
        this.selectedId = event.currentTarget.dataset.id;
        this.isModalOpen = true;
        this.isHome = false;
        this._syncRoute();

        const fileType = this.getFileType(this.currentUrl);
        const viewable = ['png', 'pdf', 'jpeg', 'jpg', 'csv', 'svg', 'gif', 'bmp', 'tiff'];
        if (!viewable.includes(fileType)) {
            setTimeout(() => this.closeModal(), 1700);
        }
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.selectedId = null;
        this.isHome = true;
        this._syncRoute();
    }

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    handleDownload(event) {
        event.preventDefault();
        const fileUrl = event.currentTarget.dataset.url;

        fetch(fileUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileUrl.split('/').pop().split('?')[0];
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            })
            .catch(error => {
                console.error('Download failed:', error);
                this.showToast('Download failed');
            });
    }

    handleDownloadAction(record) {
        const link = document.createElement('a');
        link.href = record.AmazonURL;
        link.download = record.Name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.dispatchEvent(
            new CustomEvent('subrouteupdate', {
                detail: { subView: '', replace: true },
                bubbles: true,
                composed: true
            })
        );
    }

    // ------------------------------------------------------------------
    // EMAIL DOCUMENT
    // ------------------------------------------------------------------
    get sendEmailLabel() {
        return this.isSendingEmail ? 'Sending...' : 'Send';
    }

    handleEmailAction(event) {
        event.preventDefault();
        const docId = event.currentTarget.dataset.id;
        const record = (this.allRecords || []).find(r => r.Id === docId);

        if (!record || !record.AmazonURL) {
            this.showToast('This document has no file to send.');
            return;
        }

        this.emailDocId = docId;
        this.emailFileName = record.Name;
        // To is intentionally blank: the user must enter it
        this.fromAddress = '';
        this.toAddress = '';
        this.ccAddress = '';
        this.emailSubject = '';
        this.emailBody = '';
        this.isEmailModalOpen = true;

        getDocumentEmailContent({ docId })
            .then(result => {
                this.fromAddress = result?.fromEmail || '';
                this.emailSubject = result?.subject || `Document: ${record.Name}`;
                this.emailBody = result?.body || '';
            })
            .catch(error => {
                console.error('Error fetching email content:', error);
                this.emailSubject = `Document: ${record.Name}`;
                this.showToast(this.apexError(error, 'Unable to load email content'));
            });
    }

    handleEmailOnChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.detail?.value ?? event.target.value;

        switch (fieldName) {
            case 'toAddress':
                this.toAddress = fieldValue;
                break;
            case 'ccAddress':
                this.ccAddress = fieldValue;
                break;
            case 'emailSubject':
                this.emailSubject = fieldValue;
                break;
            case 'emailBody':
                this.emailBody = fieldValue;
                break;
            default:
                break;
        }
    }

    handleCloseEmailModal() {
        if (this.isSendingEmail) return;
        this.resetEmailState();
    }

    resetEmailState() {
        this.isEmailModalOpen = false;
        this.isSendingEmail = false;
        this.emailDocId = null;
        this.emailFileName = '';
        this.fromAddress = '';
        this.toAddress = '';
        this.ccAddress = '';
        this.emailSubject = '';
        this.emailBody = '';
    }

    // returns the first invalid address in a comma / semicolon list, or ''
    findInvalidEmail(raw) {
        const list = (raw || '')
            .split(/[,;]/)
            .map(e => e.trim())
            .filter(Boolean);
        return list.find(e => !EMAIL_REGEX.test(e)) || '';
    }

    handleSendEmail() {
        if (this.isSendingEmail) return;

        if (!this.fromAddress) {
            this.showToast('The organisation does not have an email address (Email__c) to send from.');
            return;
        }

        if (!this.toAddress || !this.toAddress.trim()) {
            this.showToast('To Address is required');
            return;
        }
        const badTo = this.findInvalidEmail(this.toAddress);
        if (badTo) {
            this.showToast(`Invalid To email address: ${badTo}`);
            return;
        }
        const badCc = this.findInvalidEmail(this.ccAddress);
        if (badCc) {
            this.showToast(`Invalid CC email address: ${badCc}`);
            return;
        }
        if (!this.emailSubject || !this.emailSubject.trim()) {
            this.showToast('Subject is required');
            return;
        }

        this.isSendingEmail = true;
        sendDocumentEmail({
            docId: this.emailDocId,
            toAddress: this.toAddress,
            ccAddress: this.ccAddress,
            subject: this.emailSubject,
            body: this.emailBody
        })
            .then(() => {
                this.showToast('Email sent successfully', 'success');
                this.resetEmailState();
            })
            .catch(error => {
                console.error('Error sending email:', error);
                this.showToast(this.apexError(error, 'Error sending email'));
                this.isSendingEmail = false;
            });
    }

    // ------------------------------------------------------------------
    // EMAIL HISTORY (read only)
    // ------------------------------------------------------------------
    handleViewEmailHistory(event) {
        event.preventDefault();
        const docId = event.currentTarget.dataset.id;
        const record = (this.allRecords || []).find(r => r.Id === docId);

        this.isShowSpinner = true;
        getDocumentEmailHistory({ docId })
            .then(raw => {
                const history = JSON.parse(raw || '[]');
                this.groupedEmailHistory = this.groupEmailHistoryByDate(history);
                this.hasEmailHistory = this.groupedEmailHistory.length > 0;
                this.emailHistoryFileName = record ? record.Name : '';
                this.showEmailHistoryModal = true;
            })
            .catch(error => {
                console.error('Error loading email history:', error);
                this.showToast(this.apexError(error, 'Unable to load email history'));
            })
            .finally(() => {
                this.isShowSpinner = false;
            });
    }

    groupEmailHistoryByDate(history) {
        if (!Array.isArray(history)) {
            return [];
        }

        const map = {};
        const order = [];
        history.forEach(item => {
            if (!item || !item.activityDate) {
                return;
            }
            const dateObj = new Date(item.activityDate);

            // FEB 12 2025
            const date = dateObj
                .toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })
                .toUpperCase();

            // 11:52 AM
            const time = dateObj.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            if (!map[date]) {
                map[date] = [];
                order.push(date);
            }
            map[date].push({
                ...item,
                time,
                initials: this.getInitials(item.user)
            });
        });

        return order.map(date => ({ date, entries: map[date] }));
    }

    closeEmailHistory() {
        this.showEmailHistoryModal = false;
        this.groupedEmailHistory = [];
        this.hasEmailHistory = false;
        this.emailHistoryFileName = '';
    }

    getInitials(name) {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (
            parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }

    // ------------------------------------------------------------------
    // DELETE
    // ------------------------------------------------------------------
    handleDelete(event) {
        this.selectedRecordId = event.currentTarget.dataset.id;
        this.deleteFlag = true;
        this._syncRoute();
    }

    handleclose() {
        this.deleteFlag = false;
        this._syncRoute();
    }

    handledeletefile() {
        this.isShowSpinner = true;
        deleteDocument({ docId: this.selectedRecordId })
            .then(() => {
                this.showToast('Attachment deleted successfully!!', 'success');
                return this.refreshCurrentView();
            })
            .catch(error => {
                this.showToast(this.apexError(error, 'Delete failed'));
            })
            .finally(() => {
                this.isShowSpinner = false;
            });

        this.deleteFlag = false;
        this._syncRoute();
    }

    // ------------------------------------------------------------------
    // ARCHIVE / RESTORE
    // ------------------------------------------------------------------
    handleArchive(event) {
        const docId = event.currentTarget.dataset.id;

        archiveDocument({ docId })
            .then(() => {
                this.showToast('File archived successfully', 'success');
                return this.refreshCurrentView();
            })
            .catch(error => {
                this.showToast(this.apexError(error, 'Archive failed'));
            });
    }

    // switch the main table between Documents and Archived Documents (no popup)
    handleToggleArchive() {
        this.setArchiveView(!this.showArchived);
        this._syncRoute();
    }

    setArchiveView(archived) {
        if (this.showArchived === archived) return;

        this.showArchived = archived;
        this.searchKey = '';

        // clear rows so the other table never renders rows of the wrong shape
        this.allRecords = [];
        this.records = [];
        this.data = [];
        this.totalRecords = 0;
        this.pageNumber = 1;
        this.noRecordsFlag = false;

        // org not resolved yet: connectedCallback will load the right view
        if (!this.organisationId) return;

        this.isShowSpinner = true;
        this.loadDocuments().finally(() => {
            this.isShowSpinner = false;
        });
    }

    // loads archived docs into the same records/pagination pipeline as documents
    loadArchivedFiles() {
        console.log('[ARCHIVE] start, scope =', JSON.stringify(this.docScope));

        return getArchivedDocuments(this.docScope)
            .then(result => {
                console.log('[ARCHIVE] apex returned', Array.isArray(result) ? result.length : result, 'rows');
                console.log('[ARCHIVE] raw result =', JSON.stringify(result));

                this.allRecords = (result || []).map((rec, i) => {
                    console.log(`[ARCHIVE] map row ${i}`, JSON.stringify(rec));
                    return {
                        Id: rec.Id,
                        Name: rec.Name,
                        Type: rec.Type,
                        ArchivedDate: rec.ArchivedDate,
                        ArchivedBy: rec.ArchivedBy,
                        AmazonURL: rec.AmazonURL,
                        Key: rec.Key,
                        ParentFolder: rec.ParentFolder || 'All Documents',
                        FolderPath: rec.FolderPath,
                        ExpiryDate: rec.ExpiryDate ? this.formatDate(rec.ExpiryDate) : '',
                        isExpired: rec.IsExpired
                    };
                });

                this.records = [...this.allRecords];
                this.totalRecords = this.records.length;
                this.pageNumber = 1;
                this.paginationHelper();
                console.log('[ARCHIVE] done, total =', this.totalRecords);
            })
            .catch(error => {
                console.error('[ARCHIVE] FAILED');
                console.error('[ARCHIVE] message =', error?.body?.message);
                console.error('[ARCHIVE] pageErrors =', JSON.stringify(error?.body?.pageErrors));
                console.error('[ARCHIVE] stackTrace =', error?.body?.stackTrace);
                console.error('[ARCHIVE] full =', JSON.stringify(error));
                console.error('[ARCHIVE] raw obj =', error);
                this.showToast(this.apexError(error, 'Unable to load archived documents'));
            });
    }

    handleRestore(event) {
        const docId = event.currentTarget.dataset.id;

        restoreDocument({ docId })
            .then(() => {
                this.showToast('File restored successfully', 'success');
                return this.refreshCurrentView();
            })
            .catch(error => {
                this.showToast(this.apexError(error, 'Restore failed'));
            });
    }

    // ------------------------------------------------------------------
    // FOLDERS
    // ------------------------------------------------------------------
    loadFolders() {
        return getFolders({ orgId: this.organisationId })
            .then(result => {
                this.folders = [...result];

                const tree = this.buildFolderTree(result);

                // Public: virtual node, visible to every T Sign user of the org
                tree.push({
                    Id: PUBLIC_NODE,
                    Name: 'Public',
                    children: [],
                    isSystemNode: true,
                    isPublicNode: true
                });

                this._folderTree = JSON.parse(JSON.stringify(tree));

                this.folderOptions = [
                    { label: 'All Documents', value: 'ALL' },
                    ...this.flattenTreeForDropdown(this.buildFolderTree(result))
                ];
            })
            .catch(error => {
                console.error('Folder load error:', error);
                this.showToast(this.apexError(error, 'Unable to load folders'));
            });
    }

    buildFolderTree(data) {
        const map = {};
        const roots = [];

        data.forEach(f => {
            map[f.Id] = { ...f, children: [] };
        });

        data.forEach(f => {
            if (f.Parent_Folder__c && map[f.Parent_Folder__c]) {
                map[f.Parent_Folder__c].children.push(map[f.Id]);
            } else {
                roots.push(map[f.Id]);
            }
        });

        return roots;
    }

    flattenTreeForDropdown(nodes, level = 0, result = []) {
        nodes.forEach(n => {
            result.push({
                label: `${'—'.repeat(level)} ${n.Name}`,
                value: n.Id
            });
            if (n.children) {
                this.flattenTreeForDropdown(n.children, level + 1, result);
            }
        });
        return result;
    }

    // "All Documents" root click
    handleFolderClick() {
        this.selectFolder(null, 'All Documents');
    }

    // tree node click
    handleFolderSelect(event) {
        const id = event.detail.id;
        const name =
            id === PUBLIC_NODE
                ? 'Public'
                : this.folders.find(f => f.Id === id)?.Name || 'All Documents';
        this.selectFolder(id, name);
    }

    selectFolder(id, name) {
        this.searchKey = '';
        this.currentFolderId = id;
        this.currentFolderName = name;

        this.isShowSpinner = true;
        this.loadDocuments().finally(() => {
            this.isShowSpinner = false;
        });
    }

    openCreateFolderModal() {
        this.folderName = '';
        // PUBLIC_NODE is not a real folder, cannot be a parent
        this.selectedParentFolderId =
            this.currentFolderId && !this.isPublicContext
                ? this.currentFolderId
                : 'ALL';
        this.isCreateFolderModalOpen = true;
    }

    closeFolderModal() {
        this.isCreateFolderModalOpen = false;
    }

    handleFolderNameChange(event) {
        this.folderName = event.target.value;
    }

    handleParentFolderChange(event) {
        this.selectedParentFolderId = event.detail.value;
    }

    createFolder() {
        if (!this.folderName || !this.folderName.trim()) {
            this.showToast('Folder name is required');
            return;
        }

        const parentId =
            this.selectedParentFolderId === 'ALL' ? null : this.selectedParentFolderId;
        const name = this.folderName.trim();

        createFolderApex({
            name,
            parentId,
            orgId: this.organisationId
        })
            .then(newFolderId => {
                this.isCreateFolderModalOpen = false;
                return this.loadFolders().then(() => newFolderId);
            })
            .then(newFolderId => {
                this.selectFolder(newFolderId, name);
                this.showToast('Folder created successfully', 'success');
            })
            .catch(error => {
                console.error('Create folder error:', JSON.stringify(error));
                this.showToast(this.apexError(error, 'Failed to create folder'));
            });
    }

    // ------------------------------------------------------------------
    // FOLDER SHARE (uses the same panel as Document share)
    // ------------------------------------------------------------------
    get showAccessPanel() {
        return this.assignmentFlag || this.folderAssignmentFlag;
    }

    get accessPanelTitle() {
        return this.folderAssignmentFlag ? 'Share Folder' : 'Grant Access';
    }

    handleAccessSave() {
        if (this.folderAssignmentFlag) {
            this.saveFolderSharing();
        } else {
            this.handleassignmentinsert();
        }
    }

    handleAccessCancel() {
        if (this.folderAssignmentFlag) {
            this.closeFolderShare();
        } else {
            this.handleShareClose();
        }
    }

    handleFolderPermissions(event) {
        this.currentFolderShareId = event.detail.id;
        this.resetShareState();
        this.folderAssignmentFlag = true;

        Promise.all([
            getShareableStaff({ orgId: this.organisationId }),
            fetchFolderSharedStaff({ folderId: this.currentFolderShareId })
        ])
            .then(([staff, shared]) => this.applyShareData(staff, shared))
            .catch(error => {
                console.error('Folder share load error', JSON.stringify(error));
                this.showToast(this.apexError(error, 'Unable to load folder permissions'));
                this.closeFolderShare();
            });
    }

    closeFolderShare() {
        this.folderAssignmentFlag = false;
        this.currentFolderShareId = null;
        this.resetShareState();
    }

    saveFolderSharing() {
        saveFolderShares({
            folderId: this.currentFolderShareId,
            staffIds: this.selectedStaffIds
        })
            .then(() => {
                this.showToast('Folder shared successfully', 'success');
                this.closeFolderShare();
                this.refreshCurrentView();
                this.loadFolders();
            })
            .catch(error => {
                console.error('Folder share error:', JSON.stringify(error));
                this.showToast(this.apexError(error, 'Folder share failed'));
            });
    }

    // ------------------------------------------------------------------
    // DOCUMENT SHARE (Managers of the org only)
    // ------------------------------------------------------------------
    get filteredStaffFull() {
        const key = (this.staffSearchKey || '').toLowerCase().trim();
        return this.allStaffList.filter(
            s =>
                !key ||
                (s.name || '').toLowerCase().includes(key) ||
                (s.email || '').toLowerCase().includes(key)
        );
    }

    get staffTotalRecords() {
        return this.filteredStaffFull.length;
    }

    get staffTotalPages() {
        return Math.max(1, Math.ceil(this.staffTotalRecords / this.staffPageSize));
    }

    get staffCurrentPage() {
        return Math.min(this.staffPageNumber, this.staffTotalPages);
    }

    // current page rows
    get filteredStaffUsers() {
        const start = (this.staffCurrentPage - 1) * this.staffPageSize;
        return this.filteredStaffFull
            .slice(start, start + this.staffPageSize)
            .map(s => ({ ...s, isSelected: this.selectedStaffIds.includes(s.Id) }));
    }

    // header checkbox = current page only
    get allVisibleStaffSelected() {
        const rows = this.filteredStaffUsers;
        return rows.length > 0 && rows.every(s => s.isSelected);
    }

    get bDisableStaffFirst() {
        return this.staffCurrentPage === 1;
    }

    get bDisableStaffLast() {
        return this.staffCurrentPage === this.staffTotalPages;
    }

    get staffPageSizeOptions() {
        return [10, 25, 50, 75, 100].map(n => ({
            label: String(n),
            value: String(n),
            selected: n === this.staffPageSize
        }));
    }

    // disabled until selection changed (works for document and folder share)
    get saveButtonDisable() {
        const a = new Set(this.initialSharedIds);
        const b = new Set(this.selectedStaffIds);
        return a.size === b.size && [...a].every(id => b.has(id));
    }

    handleShare(event) {
        this.currentDocumentId = event.currentTarget.dataset.id;
        this.resetShareState();
        this.loadShareData(this.currentDocumentId);
        this.assignmentFlag = true;
        this._syncRoute();
    }

    resetShareState() {
        this.allStaffList = [];
        this.selectedStaffIds = [];
        this.initialSharedIds = [];
        this.staffSearchKey = '';
        this.staffPageNumber = 1;
    }

    // shared by document share and folder share
    applyShareData(staff, alreadyShared) {
        this.allStaffList = (staff || []).map(s => ({
            Id: s.Id,
            name: s.Display_Nickname__c,
            email: s.Email__c || ''
        }));

        // keep only ids that can still be share targets
        const valid = new Set(this.allStaffList.map(s => s.Id));
        this.selectedStaffIds = (alreadyShared || [])
            .map(s => s.TSign_Staff__c)
            .filter(id => valid.has(id));
        this.initialSharedIds = [...this.selectedStaffIds];
    }

    loadShareData(docId) {
        return Promise.all([
            getShareableStaff({ orgId: this.organisationId }),
            fetchStaffByDoc({ docId })
        ])
            .then(([staff, alreadyShared]) => this.applyShareData(staff, alreadyShared))
            .catch(error => {
                console.error('Grant access load error', JSON.stringify(error));
                this.showToast(this.apexError(error, 'Unable to load managers'));
            });
    }

    handleStaffSearch(event) {
        this.staffSearchKey = event.target.value;
        this.staffPageNumber = 1;
    }

    handleStaffCheckbox(event) {
        const id = event.target.dataset.id;
        this.selectedStaffIds = event.target.checked
            ? [...new Set([...this.selectedStaffIds, id])]
            : this.selectedStaffIds.filter(s => s !== id);
    }

    handleSelectAllStaff(event) {
        const pageIds = this.filteredStaffUsers.map(s => s.Id);
        this.selectedStaffIds = event.target.checked
            ? [...new Set([...this.selectedStaffIds, ...pageIds])]
            : this.selectedStaffIds.filter(id => !pageIds.includes(id));
    }

    handleStaffPageSize(event) {
        this.staffPageSize = parseInt(event.target.value, 10);
        this.staffPageNumber = 1;
    }

    staffFirstPage() {
        this.staffPageNumber = 1;
    }

    staffPreviousPage() {
        this.staffPageNumber = this.staffCurrentPage - 1;
    }

    staffNextPage() {
        this.staffPageNumber = this.staffCurrentPage + 1;
    }

    staffLastPage() {
        this.staffPageNumber = this.staffTotalPages;
    }

    handleassignmentinsert() {
        saveDocumentShares({
            docId: this.currentDocumentId,
            staffIds: this.selectedStaffIds
        })
            .then(() => {
                this.showToast('Access granted successfully', 'success');
                this.assignmentFlag = false;
                this.resetShareState();
                this.currentDocumentId = null;
                this._syncRoute();
                this.refreshCurrentView();
            })
            .catch(error => {
                console.error('Error saving share:', error);
                this.showToast(this.apexError(error, 'Failed to grant access'));
            });
    }

    handleShareClose() {
        this.assignmentFlag = false;
        this.resetShareState();
        this.currentDocumentId = null;
        this._syncRoute();
    }

    // ------------------------------------------------------------------
    // ROUTING (deep links use the record Id)
    // ------------------------------------------------------------------
    _syncRoute(replace = false) {
        let subView = '';

        if (this.isOpenModal) {
            subView = 'add-attachment';
        } else if (this.isModalOpen && this.selectedId) {
            subView = `${this.selectedId}/view`;
        } else if (this.assignmentFlag && this.currentDocumentId) {
            subView = `${this.currentDocumentId}/share`;
        } else if (this.deleteFlag && this.selectedRecordId) {
            subView = `${this.selectedRecordId}/delete`;
        } else if (this.showArchived) {
            // archived view is the base route when no modal is open
            subView = 'archive';
        }

        this.dispatchEvent(
            new CustomEvent('subrouteupdate', {
                detail: { subView, replace },
                bubbles: true,
                composed: true
            })
        );
    }

    clearViews() {
        this.isOpenModal = false;
        this.isModalOpen = false;
        this.deleteFlag = false;
        this.assignmentFlag = false;
        this.isEmailModalOpen = false;
        this.showEmailHistoryModal = false;
    }

    processSubroute(subroute) {
        if (!subroute) {
            this.clearViews();
            this.setArchiveView(false);
            return;
        }

        if (subroute === 'add-attachment') {
            this.clearViews();
            this.isOpenModal = true;
            return;
        }

        if (subroute === 'archive') {
            this.clearViews();
            this.setArchiveView(true);
            return;
        }

        const [uid, action] = subroute.split('/');
        if (!/^[a-z0-9]{15}$|^[a-z0-9]{18}$/i.test(uid || '')) {
            return;
        }

        // records not loaded yet: wait for loadDocuments
        if (!this.allRecords || this.allRecords.length === 0) {
            this._pendingSubroute = subroute;
            return;
        }

        const record = this.allRecords.find(r => r.Id === uid);
        if (!record) return;

        this.selectedId = record.Id;
        this.selectedRecordId = record.Id;
        this.currentDocumentId = record.Id;
        this.currentUrl = record.AmazonURL;
        this.fileName = record.Name;

        if (action === 'view') {
            this.clearViews();
            this.isModalOpen = true;
            this.isHome = false;
        } else if (action === 'share') {
            this.clearViews();
            this.assignmentFlag = true;
            this.resetShareState();
            this.loadShareData(record.Id);
        } else if (action === 'delete') {
            this.clearViews();
            this.deleteFlag = true;
        } else if (action === 'download') {
            this.handleDownloadAction(record);
        }
    }

    stopMenuClick(event) {
        event.stopPropagation();
    }

    // "Folder: Public (Visible to all users)"
    get folderLabel() {
        return this.isPublicContext
            ? `${this.currentFolderName} (Visible to all users)`
            : this.currentFolderName;
    }

    get showAttachmentModal() {
        return this.isOpenModal || this.isEdit;
    }

    get attachmentModalTitle() {
        return this.isEdit ? 'Update Attachment' : 'Add Attachment';
    }

    get attachmentSaveLabel() {
        return this.isEdit ? 'Update' : 'Save';
    }

    get isEditFolderSaveDisabled() {
        const v = (this.editFolderName || '').trim();
        return this.isSavingFolder || !v || v === this.originalFolderName;
    }

    handleFolderEdit(event) {
        if (!this.isOrgAdmin) return;
        const id = event.detail.id;
        const folder = this.folders.find(f => f.Id === id);
        if (!folder) return;

        this.editFolderId = id;
        this.originalFolderName = folder.Name;
        this.editFolderName = folder.Name;
        this.isEditFolderModalOpen = true;
    }

    handleEditFolderNameChange(event) {
        this.editFolderName = event.target.value;
    }

    closeEditFolderModal() {
        this.isEditFolderModalOpen = false;
        this.editFolderId = null;
        this.editFolderName = '';
        this.originalFolderName = '';
        this.isSavingFolder = false;
    }

    saveEditFolder() {
        const name = (this.editFolderName || '').trim();
        if (!name) {
            this.showToast('Folder name is required');
            return;
        }
        if (name === this.originalFolderName) {
            this.closeEditFolderModal();
            return;
        }

        this.isSavingFolder = true;
        const folderId = this.editFolderId;

        updateFolderName({ folderId, newName: name })
            .then(() => {
                if (this.currentFolderId === folderId) {
                    this.currentFolderName = name;   // keep "Folder: xxx" label in sync
                }
                this.closeEditFolderModal();
                this.showToast('Folder updated successfully', 'success');
                return this.loadFolders();
            })
            .catch(error => {
                console.error('Edit folder error:', JSON.stringify(error));
                this.showToast(this.apexError(error, 'Failed to update folder'));
                this.isSavingFolder = false;
            });
    }

    get shellClass() {
        return this.isHome ? 'att-shell' : 'att-shell slds-hide';
    }

    handleAttachmentDelete(event) {
        const detail = event.detail;

        // child send 2 shapes: array (handleDelete) or object with deletedKeys (deleteFilesFromAwsJson)
        let remainingKeys = null;
        let deletedKeys = null;

        if (Array.isArray(detail)) {
            remainingKeys = new Set(detail.map(f => f.key));
        } else if (detail?.deletedKeys) {
            deletedKeys = new Set(detail.deletedKeys);
        }

        const current = Array.isArray(this.uploadedFile) ? this.uploadedFile : [];
        const left = current.filter(f =>
            remainingKeys ? remainingKeys.has(f.key) : !(deletedKeys && deletedKeys.has(f.key))
        );

        this.uploadedFile = left.length ? left : null;

        if (!left.length) {
            this.fileName = '';
            this.isFileAttached = false;
        }
    }
}