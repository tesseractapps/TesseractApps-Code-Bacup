import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getParticipantChecklist from '@salesforce/apex/ClientDataController.getParticipantChecklist';
import saveParticipantChecklist from '@salesforce/apex/ClientDataController.saveParticipantChecklist';
import USER_ID from '@salesforce/user/Id';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId';

const MAX_DESC_LENGTH = 50;

export default class Checklist extends LightningElement {
    @api clientId;
    @api hideActions = false;
    @api hideCreatedDetails=false
 

    // full dataset (unpaged)
    @track allChecklistItems = [];

    // paged slice rendered in table
    @track checklistItems = [];

    @track showAddEditPopup = false;
    @track showDeleteConfirm = false;
    @track descriptionDraft = '';
    @track isMandatory = false;

    @track isShowSpinner = false;

    /* ================= PAGINATION (ref: AwardsAndRecognizationLwc) ================= */
    @track totalRecords = 0;   // total no. of records
    @track pageSize = 10;      // records per page
    @track totalPages = 1;     // total no. of pages
    @track pageNumber = 1;     // current page
    @track noRecordsFlag = false;
    recordsPerPage = 10;
    isPageSizeManuallySet = false;   // Auto by default, like Awards
    resizeObserver;

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    _editingKey = null;
    _deletingKey = null;
    currentStaffId = '';
    currentStaffName = '';
  

    connectedCallback() {
        this.fetchParticipantChecklist();
          this.loadCurrentStaff();
    }
    async loadCurrentStaff() {
        try {
            const result = await getstaffId({
                userId: USER_ID
            });

            if (result) {
                this.currentStaffId = result.Id;
                this.currentStaffName = result.NameToDisplay__c;

                console.log('Current Staff Id:', this.currentStaffId);
                console.log('Current Staff Name:', this.currentStaffName);
            }
        } catch (error) {
            console.error('Staff Load Error:', error);
        }
    }
    

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    @api
    refresh() {
        this.fetchParticipantChecklist();
    }
   

    get popupTitle() {
        return this._editingKey ? 'Edit Checklist' : 'Add Checklist';
    }

    get saveButtonLabel() {
        return this._editingKey ? 'Update' : 'Save';
    }

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    get pageSizeOptions() {
        return [
            { label: '10', value: 10, selected: this.isPageSizeManuallySet && this.recordsPerPage === 10 },
            { label: '20', value: 20, selected: this.isPageSizeManuallySet && this.recordsPerPage === 20 },
            { label: '50', value: 50, selected: this.isPageSizeManuallySet && this.recordsPerPage === 50 }
        ];
    }

    get bDisableFirst() {
        return this.pageNumber === 1;
    }

    get bDisableLast() {
        return this.pageNumber === this.totalPages;
    }

    @api
        saveChecklist(clientId) {
            this.clientId = clientId;

            console.log(
                'Saving checklist. Total local items:',
                this.allChecklistItems.length
            );
             console.log(
                'checklistItems:',
                this.checklistItems.length
            );
            console.log('checklistItems=>'+JSON.stringify(this.checklistItems))

            return this.persistChecklist(
                this.clientId,
                this.allChecklistItems,
                'Checklist has been saved successfully.'
            );
        }

    fetchParticipantChecklist() {
        if (!this.clientId) {
            return Promise.resolve();
        }

        this.isShowSpinner = true;

        return getParticipantChecklist({
            clientId: this.clientId
        })
            .then((result) => {

                this.allChecklistItems = (result || []).map((item) => ({
                    key: item.Id,
                    Id: item.Id,

                    Description__c: item.description || '',
                    isMandatory: item.isMandatory === true,
                    mandatoryLabel: item.isMandatory ? 'Yes' : 'No',

                    // Staff
                    createdBy: item.createdBy || '',
                    updatedBy: item.updatedBy || '',

                    Created_By_Staff__c: item.createdStaffId || '',
                    Modified_By_Staff__c: item.modifiedStaffId || '',

                    // Date & Time from custom fields
                    Last_Modified_Date__c: item.lastModifiedDate,
                    Last_modified_Time__c: item.lastModifiedTime || '',

                    // Display in table
                    lastUpdated:
                        item.lastModifiedDate
                            ? `${this.formatDate(item.lastModifiedDate)} ${item.lastModifiedTime || ''}`
                            : ''
                }));
                 this.recordsPerPage=10;
                this.totalRecords = this.allChecklistItems.length;
                this.pageSize = this.recordsPerPage;
                this.pageNumber = 1;
                this.paginationHelper();
               /*  if (!this.isPageSizeManuallySet) {
                    this.setPageSizeByZoomAndScreen();
                } */
            })
            .catch((error) => {
                console.error(
                    '[Checklist] fetch error:',
                    error
                );

                this.allChecklistItems = [];
                this.totalRecords = 0;
                this.paginationHelper();

                throw error;
            })
            .finally(() => {
                this.isShowSpinner = false;
            });
    }

    /* ================= PAGINATION HANDLERS (ref: AwardsAndRecognizationLwc) ================= */

formatDate(dateValue) {
    if (!dateValue) {
        return '';
    }

    // dateValue = "2026-08-27"
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
}

    handleRecordsPerPage(event) {
      
            this.isPageSizeManuallySet = true;
            this.recordsPerPage = parseInt(selectedValue, 10);
            this.pageSize = this.recordsPerPage;
            this.pageNumber = 1;
            this.paginationHelper()
    }

    firstPage() {
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

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }

    paginationHelper() {
        this.noRecordsFlag = this.totalRecords === 0;

        this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));

        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        const tempList = [];
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = this.pageNumber * this.pageSize;

        for (let i = start; i < end; i++) {
            if (i === this.totalRecords) {
                break;
            }
            tempList.push(Object.assign({}, this.allChecklistItems[i]));
        }

        this.checklistItems = tempList;
    }

    /* ================= ADD / EDIT POPUP ================= */

    openAddPopup() {
        this._editingKey = null;
        this.descriptionDraft = '';
        this.isMandatory = false;
        this.showAddEditPopup = true;

            this.dispatchEvent(
            new CustomEvent('overlaychange', {
                detail: { overlay: true },
                bubbles: true,
                composed: true
            })
        );
    }

    openEditPopup(event) {
        const key = event.currentTarget.dataset.key;

        const item = this.allChecklistItems.find(
            (row) => row.key === key
        );

        if (!item) {
            return;
        }

        this._editingKey = key;

        this.descriptionDraft =
            item.Description__c || '';

        this.isMandatory =
            item.isMandatory === true;

        this.showAddEditPopup = true;
    }

    closeAddEditPopup() {
        this.showAddEditPopup = false;
        this._editingKey = null;
        this.descriptionDraft = '';
        this.isMandatory = false;

         // Notify parent to hide overlay
        this.dispatchEvent(
            new CustomEvent('overlaychange', {
                detail: { overlay: false },
                bubbles: true,
                composed: true
            })
        );
    }

    handleDescriptionChange(event) {
        let value = event.detail.value || '';
        if (value.length > MAX_DESC_LENGTH) {
            value = value.substring(0, MAX_DESC_LENGTH);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Invalid Description',
                message: `Checklist description cannot exceed ${MAX_DESC_LENGTH} characters.`,
                variant: 'error'
            }));
        }
        this.descriptionDraft = value;
    }

   saveDescription() {
        const trimmed = (this.descriptionDraft || '').trim();

        if (!trimmed) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Missing Description',
                    message: 'Please enter a description before saving.',
                    variant: 'error'
                })
            );
            return;
        }

        const isEdit = !!this._editingKey;
        const todayDate = this.getFormattedDate();
        const currentTime = this.getFormattedTime();

        if (isEdit) {
            // Update existing checklist item locally
            this.allChecklistItems = this.allChecklistItems.map(row =>
                row.key === this._editingKey
                    ? {
                        ...row,
                        Description__c: trimmed,
                        isMandatory: this.isMandatory,
                        mandatoryLabel: this.isMandatory ? 'Yes' : 'No',
                            // Custom fields
                        Modified_By_Staff__c: this.currentStaffId,
                        updatedBy: this.currentStaffName,

                        Last_Modified_Date__c: todayDate,
                        Last_modified_Time__c: currentTime,
                        lastUpdated: `${todayDate} ${currentTime}`
                    }
                    : row
            );
        } else {
            // Add new checklist item locally
            const newItem = {
                key: 'new-' + Date.now(),   // Temporary key
                Id: null,                   // No Salesforce Id yet
                Description__c: trimmed,
                isMandatory: this.isMandatory,
                mandatoryLabel: this.isMandatory ? 'Yes' : 'No',
                 Created_By_Staff__c: this.currentStaffId,
                    createdBy: this.currentStaffName,

                    // Modified (same as create initially)
                    Modified_By_Staff__c: this.currentStaffId,
                    updatedBy: this.currentStaffName,

                    Last_Modified_Date__c: todayDate,
                    Last_modified_Time__c: currentTime,

                    lastUpdated: `${todayDate} ${currentTime}`
            };

            this.allChecklistItems = [...this.allChecklistItems, newItem];
        }

        // Refresh pagination/table
        this.totalRecords = this.allChecklistItems.length;
        this.pageNumber = 1;
        this.paginationHelper();

        // Close popup only
        this.closeAddEditPopup();

        console.log(
            'Checklist updated locally:',
            JSON.stringify(this.allChecklistItems)
        );
    }

    /* ================= DELETE ================= */

    openDeleteConfirm(event) {
        this._deletingKey = event.currentTarget.dataset.key;
        this.showDeleteConfirm = true;
    }

    closeDeleteConfirm() {
        this.showDeleteConfirm = false;
        this._deletingKey = null;
    }

   confirmDelete() {

    // Remove from local array only
    this.allChecklistItems = this.allChecklistItems.filter(
        (row) => row.key !== this._deletingKey
    );

    // Close confirmation popup
    this.showDeleteConfirm = false;
    this._deletingKey = null;

    // Refresh table/pagination
    this.totalRecords = this.allChecklistItems.length;

    // If current page becomes empty after delete, move to previous page
    const maxPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    if (this.pageNumber > maxPages) {
        this.pageNumber = maxPages;
    }

    this.paginationHelper();

    console.log(
        '[Checklist] Deleted locally:',
        JSON.stringify(this.allChecklistItems, null, 2)
    );

    // Optional local success toast
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success',
            message: 'Checklist item removed.',
            variant: 'success'
        })
    );
}

    /* ================= SHARED SAVE ================= */


   async persistChecklist(clientId, items = this.allChecklistItems, successMessage = 'Checklist has been saved successfully.') {

    // Receive Client Id from parent after participant save
    this.clientId = clientId;

    this.isShowSpinner = true;

    const checklistItems = items.map((row) => ({
        Id: row.Id || null,
        description: (row.Description__c || '').trim(),
        isMandatory: row.isMandatory === true,
        createdStaffId: row.Created_By_Staff__c || null,
        modifiedStaffId: row.Modified_By_Staff__c || null,

        // Custom Date & Time fields
        lastModifiedDate: row.Last_Modified_Date__c || null,   // DD/MM/YYYY
        lastModifiedTime: row.Last_modified_Time__c || null    // hh:mm AM/PM
    }));

    console.log(
        '[Checklist] Mapped checklistItems:',
        JSON.stringify(checklistItems, null, 2)
    );

    // Blank validation
    const invalidItem = checklistItems.find((item) => !item.description);

    if (invalidItem) {
        this.isShowSpinner = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Checklist description cannot be blank.',
                variant: 'error'
            })
        );

        return Promise.reject('Checklist description cannot be blank.');
    }

    // Max 50 records validation
    if (checklistItems.length > 50) {
        this.isShowSpinner = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'A maximum of 50 checklist items can be maintained per participant.',
                variant: 'error'
            })
        );

        return Promise.reject('Checklist limit exceeded.');
    }

    // Max description length validation
    const tooLongItem = checklistItems.find(
        (item) => item.description.length > MAX_DESC_LENGTH
    );

    if (tooLongItem) {
        this.isShowSpinner = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Checklist description cannot exceed 50 characters.',
                variant: 'error'
            })
        );

        return Promise.reject('Description length exceeded.');
    }

    const payload = {
        clientId: this.clientId,
        checklistItemsJson: JSON.stringify(checklistItems)
    };

    console.log('[Checklist] FINAL Apex payload:', JSON.stringify(payload));

    return saveParticipantChecklist(payload)
        .then(() => {
            console.log('[Checklist] saveParticipantChecklist SUCCESS');

            return this.fetchParticipantChecklist();
        })
        .then(() => {
            console.log('[Checklist] Table refreshed successfully');

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: successMessage, // ✅ Uses passed message
                    variant: 'success'
                })
            );
        })
        .catch((error) => {
            console.error('[Checklist] save ERROR', error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error?.body?.message || 'Unable to save checklist.',
                    variant: 'error'
                })
            );

            throw error;
        })
        .finally(() => {
            this.isShowSpinner = false;
        });
}


    handleMandatoryChange(event) {
        this.isMandatory = event.target.checked;

        console.log(
            '[Checklist] Is Mandatory:',
            this.isMandatory
        );
    }
    get tableGridClass() {
    return this.hideActions
        ? 'staff-table no-action-columns'
        : 'staff-table action-columns';
    }
    getFormattedDate() {
        const today = new Date();

        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        return `${day}/${month}/${year}`;
    }

    getFormattedTime() {
        return new Date().toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

   
}