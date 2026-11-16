import { LightningElement,track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {
    getObjectInfo,
    getPicklistValues
} from 'lightning/uiObjectInfoApi';

import TSIGN_CONTACT from '@salesforce/schema/TSign_Contact__c';
import CONTACT_TYPE from '@salesforce/schema/TSign_Contact__c.Contact_Type__c';

import getContacts from '@salesforce/apex/tSignContactController.getContacts';
import saveContact from '@salesforce/apex/tSignContactController.saveContact';
import setArchived from '@salesforce/apex/tSignContactController.setArchived';
import getAccountType from '@salesforce/apex/tSignContactController.getAccountType';
import fetchFacilitiessForDashboard from '@salesforce/apex/TsignOrgDetails.fetchFacilitiessForDashboard';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getCurrentUserOrganisation from '@salesforce/apex/tSignContactController.getCurrentUserOrganisation';
import getOrg from '@salesforce/apex/TsignUserManagementController.getOrg';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MIN_FILE_SIZE = 1;
const DEFAULT_COUNTRY = '';

const EMPTY_FORM = {
    Id: undefined,
    First_Name__c: '',
    Last_Name__c: '',
    Email__c: '',
    Contact_Number__c: '',
    Contact_Type__c: '',
    TSign_Facility__c: '',
    Picture__c: '',
    Profile_Pic_Key__c: '',
    Profile_Pic_File_Name__c: '',
    Profile_Pic_JSON__c: ''
};

export default class TsignContactList extends LightningElement { 
    rows = [];
    totalRecords = 0;
    pageSize = 10;
    pageNumber = 1;
    searchKey = '';
    showArchived = false;
    isLoading = true; // true from the start, so "No records found" doesn't show before the first load
    isSaving = false;
    isSearching = false;
    logoUrl = `${Loading_Logo}/TLogo.png`;
    imageUrl = `${Loading_Logo}/T.png`;

    showModal = false;
   @track mode = 'create';
    @track form = { ...EMPTY_FORM };

    fileName;
    base64FileData;
    isattachError = false;

    typeOptions = [];
    @track facilityOptions = [];
    errorMessage = '';

    street = '';
    city = '';
    province = '';
    postalcode = '';
    market='';
    country = DEFAULT_COUNTRY;
      marketToCountryMap = {
        'Australia':     'AU',
        'Canada':        'CA',
        'India':         'IN',
        'Singapore':     'SG',
        'United States': 'US',
        'US':            'US',
        'AU':            'AU',
        'CA':            'CA',
        'IN':            'IN',
        'SG':            'SG'
    };

    delayTimer;
    _selectedFacilityId;

    userDetails = { currentUserOrgId: '' };

    // Organisation account type: Individual / Business / Organisation
    @track accountType;
  

    // ---------- PICKLISTS ----------
    @wire(getObjectInfo, { objectApiName: TSIGN_CONTACT })
    objectInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: CONTACT_TYPE
    })
    wiredType({ data }) {
        if (data) {
            this.typeOptions = data.values;
        }
    }

    async connectedCallback() {
        window.addEventListener('mousedown', this.keepFacilitySearchFocus, true);
        window.addEventListener('click', this.keepFacilitySearchOpen, true);
        this._selectedFacilityId = localStorage.getItem('defaultFacilityId');

        try {
            const [accountType, orgId] = await Promise.all([
                getAccountType(),
                getCurrentUserOrganisation()
            ]);
            this.accountType = accountType;
            this.userDetails = { currentUserOrgId: orgId };
            this.loadOrgId(); // <-- Add this
        } catch (e) {
            this.toast('Error', this.msg(e), 'error');
        }

        if (!this.isIndividual) {
            this.loadFacilities();
        }
        this.loadData();
    }

     async loadOrgId() {
        try {
            const orgList = await getOrg();
            if (orgList && orgList.length > 0) {
              //  this.orgId = orgList[0].Id;
                const market = orgList[0].Market__c; // change API name if different
                const mapped = this.marketToCountryMap[market];
                if (mapped) {
                    this.market = mapped;
                } else {
                    console.warn('Unknown market value:', market);
                }
                console.log('org Id'+this.orgId);
            }
        } catch (error) {
            console.error('Error loading org:', error);
        }
     }

    // ---------- ACCOUNT TYPE ----------
    get isIndividual() {
        return (this.accountType || '').toLowerCase() === 'individual';
    }

    get showFacility() {
        return !this.isIndividual;
    }

    // ---------- USER FACILITIES (same Apex as dashboard dropdown) ----------
    async loadFacilities() {
        try {
            const res = await fetchFacilitiessForDashboard();
            this.facilityOptions = (res || []).map((f) => ({
                label: f.Name,
                value: f.Id
            }));
        } catch (e) {
            this.toast('Error', this.msg(e), 'error');
        }
    }

    // ---------- LOAD DATA ----------
    async loadData() {
        // Non-individual accounts need a facility chosen; otherwise empty list
        if (!this.isIndividual && !this._selectedFacilityId) {
            this.rows = [];
            this.totalRecords = 0;
            this.isLoading = false;
            this.isSearching = false;
            return null;
        }

        this.isLoading = true;

        try {
            const res = await getContacts({
                searchKey: this.searchKey,
                pageSize: this.pageSize,
                pageNumber: this.pageNumber,
                archived: this.showArchived,
                facilityId: this.isIndividual ? null : this._selectedFacilityId
            });

            this.totalRecords = res.totalRecords;

            if (res.records.length === 0 && this.pageNumber > 1) {
                this.pageNumber -= 1;
                return this.loadData();
            }

            this.rows = res.records.map((r) => {
                const fullName =
                    `${r.First_Name__c || ''} ${r.Last_Name__c || ''}`.trim();

                const stateAndPost = [
                    r.Address__StateCode__s,
                    r.Address__PostalCode__s
                ].filter(Boolean).join(' ');

                const addressLabel = [
                    r.Address__Street__s,
                    r.Address__City__s,
                    stateAndPost
                ].filter(Boolean).join(', ');

                return {
                    ...r,
                    fullName,
                    addressLabel,
                    avatarUrl: r.Picture__c || undefined,
                    initials: (
                        (r.First_Name__c || ' ')[0] +
                        (r.Last_Name__c || ' ')[0]
                    ).trim().toUpperCase()
                };
            });

        } catch (e) {
            this.toast('Error', this.msg(e), 'error');

        } finally {
            this.isLoading = false;
            this.isSearching = false;
        }

        return null;
    }

    // ---------- GETTERS ----------
    get tabTitle() {
        return this.showArchived ? 'Archived Contacts' : 'Contacts';
    }

    get archiveToggleLabel() {
        return this.showArchived ? 'Back to Contacts' : 'Archives';
    }

    get archiveIcon() {
        return this.showArchived ? 'utility:undelete' : 'utility:archive';
    }

    get archiveMaterialIcon() {
        return this.showArchived ? 'unarchive' : 'archive';
    }

    get archiveActionLabel() {
        return this.showArchived ? 'Restore' : 'Archive';
    }

    get totalRecordsLabel() {
        return String(this.totalRecords).padStart(2, '0');
    }

    get noRows() {
        return !this.isLoading && this.rows.length === 0;
    }

    // Full-page T logo spinner (same as Folders) for every load except typing in Search
    get showPageSpinner() {
        return this.isLoading && !this.isSearching;
    }

    // Small spinner while a search runs, so the page doesn't blur on every search
    get showSearchSpinner() {
        return this.isLoading && this.isSearching;
    }    

    get pageSizeOptions() {
        return [10, 20, 50].map((size) => ({
            label: String(size),
            value: String(size),
            selected: this.pageSize === size
        }));
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    }

    get bDisableFirst() {
        return this.pageNumber <= 1;
    }

    get bDisableLast() {
        return this.pageNumber >= this.totalPages;
    }

    get isView() {
        return this.mode === 'view';
    }

    get modalTitle() {
        return {
            create: 'Create Contact',
            edit: 'Edit Contact',
            view: 'View Contact',
            clone: 'Clone Contact'
        }[this.mode];
    }

    get saveDisabled() {
        return this.isSaving || !this.isAddressComplete();
    }

    get saveLabel() {
        return this.mode === 'edit' ? 'Update' : 'Create';
    }

    get childAddress() {
        return {
            street: this.street || '',
            city: this.city || '',
            province: this.province || '',
            postalCode: this.postalcode || '',
            country: this.country || DEFAULT_COUNTRY
        };
    }

    // ---------- SEARCH / REFRESH / PAGINATION ----------
    handleSearch(event) {
        const val = event.target.value;

        window.clearTimeout(this.delayTimer);

        this.delayTimer = window.setTimeout(() => {
            this.searchKey = val;
            this.pageNumber = 1;
            this.isSearching = true;
            this.loadData();
        }, 400);
    }

    handleRefresh() {
        this.searchKey = '';
        this.pageNumber = 1;
        this.loadData();
    }

    handleToggleArchive() {
        this.showArchived = !this.showArchived;
        this.pageNumber = 1;
        this.loadData();
    }

    handlePageSizeChange(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.loadData();
    }

    firstPage() {
        this.pageNumber = 1;
        this.loadData();
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber -= 1;
            this.loadData();
        }
    }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber += 1;
            this.loadData();
        }
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.loadData();
    }

    // ---------- ROW ACTIONS ----------
    async handleRowAction(event) {
        const { id, action } = event.currentTarget.dataset;
        const row = this.rows.find((r) => r.Id === id);

        if (!row) {
            return;
        }

        if (action === 'archive') {
            try {
                await setArchived({
                    contactId: id,
                    archived: !this.showArchived
                });

                this.toast(
                    'Success',
                    `Contact ${this.showArchived ? 'restored' : 'archived'}.`,
                    'success'
                );

                this.loadData();

            } catch (e) {
                this.toast('Error', this.msg(e), 'error');
            }

            return;
        }

        this.openModal(action, row);
    }

    // ---------- MODAL ----------
    handleCreate() {
        if (this.showArchived) return;
        this.openModal('create');
    }

    openModal(mode, row) {
        this.mode = mode;
        this.errorMessage = '';

        if (row) {
            const copy = {};

            Object.keys(EMPTY_FORM).forEach((key) => {
                copy[key] = row[key];
            });

            if (mode === 'clone') {
                copy.Id = undefined;
            }

            this.form = copy;
            this.street = row.Address__Street__s;
            this.city = row.Address__City__s;
            this.province = row.Address__StateCode__s;
            this.postalcode = row.Address__PostalCode__s;
            this.country = row.Address__CountryCode__s || DEFAULT_COUNTRY;

        } else {
            // Default facility = header selected facility (none for Individual)
            this.form = {
                ...EMPTY_FORM,
                TSign_Facility__c: this.isIndividual
                    ? ''
                    : this._selectedFacilityId
            };
            this.street = '';
            this.city = '';
            this.province = '';
            this.postalcode = '';
            this.country =  this.market;
        }

        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    handleField(event) {
        console.log('[CL] handleField',
            'type:', event.type,
            'field:', event.target?.dataset?.field,
            'detail:', JSON.stringify(event.detail),
            'origin:', event.composedPath?.()[0]?.tagName);
        this.form = {
            ...this.form,
            [event.target.dataset.field]: event.detail.value
        };
        console.log('[CL] facility now:', this.form.TSign_Facility__c);
    }

    addressInputChange(event) {
        const a = event.detail || {};

        this.street = a.street || '';
        this.city = a.city || '';
        this.postalcode = a.postalCode || '';
        this.province = a.province || '';
        this.country = a.country || DEFAULT_COUNTRY;

        this.errorMessage = this.isAddressComplete()
            ? ''
            : 'Please provide complete address information.';
    }

    isAddressComplete() {
        return !!(
            this.street &&
            this.city &&
            this.province &&
            this.postalcode
        );
    }

    // ---------- PROFILE PICTURE ----------
    triggerFileInput() {
        const inputEl = this.template.querySelector('input[type="file"]');

        if (inputEl) {
            inputEl.value = '';
            inputEl.click();
        }
    }

    onFileUpload(event) {
        this.isattachError = false;

        const file = event.target.files && event.target.files[0];

        if (!file) {
            return;
        }

        if (file.size > MAX_FILE_SIZE || file.size < MIN_FILE_SIZE) {
            this.isattachError = true;
            this.fileName = undefined;
            this.base64FileData = undefined;
            event.target.value = null;

            this.toast(
                'Invalid file',
                'Profile picture must be between 1 byte and 2 MB.',
                'error'
            );

            return;
        }

        this.fileName = file.name.split(' ').join('');

        const reader = new FileReader();

        reader.onloadend = () => {
            const result = reader.result;
            this.base64FileData = result.substr(result.indexOf(',') + 1);
        };

        reader.readAsDataURL(file);
    }

    // ---------- SAVE ----------
    async handleSave() {
        const inputs = [
            ...this.template.querySelectorAll(
                'lightning-input, lightning-combobox, lightning-textarea, lightning-input-field'
            )
        ];

        const valid = inputs.reduce((ok, cmp) => {
            cmp.reportValidity();
            return cmp.checkValidity() && ok;
        }, true);

        if (!this.isAddressComplete()) {
            this.errorMessage = 'Please provide complete address information.';
            return;
        }

        // Facility is only required for non-individual accounts
        if (!this.isIndividual && !this.form.TSign_Facility__c) {
            this.toast('Error', 'Please select a facility.', 'error');
            return;
        }

        if (!valid) {
            return;
        }

        this.isSaving = true;

        try {
            const addressPayload = {
                street: this.street,
                city: this.city,
                stateCode: this.province,
                countryCode: this.country,
                postalCode: this.postalcode
            };

            const contactId = await saveContact({
                contactRecord: {
                    ...this.form,
                    // Individual accounts have no facility
                    TSign_Facility__c: this.isIndividual
                        ? null
                        : this.form.TSign_Facility__c,
                    sobjectType: 'TSign_Contact__c'
                },
                address: addressPayload
            });

            const uploaded = !!(this.fileName && this.base64FileData);

            if (uploaded) {
                await uploadFile({
                    base64: JSON.stringify(this.base64FileData),
                    // contactId prefix: S3 key = filename, same name would overwrite other contact pic
                    filename: `${contactId}_${this.fileName}`,
                    recordId: contactId,
                    obj: 'tsigncontact'
                });
            }

            this.toast(
                'Success',
                this.mode === 'edit'
                    ? 'Contact updated.'
                    : 'Contact created.',
                'success'
            );

            this.showModal = false;
            this.pageNumber = 1;
            await this.loadData();

            // uploadFile is @future (async) -> reload later so picture shows
            if (uploaded) {
                // eslint-disable-next-line @lwc/lwc/no-async-operation
                setTimeout(() => this.loadData(), 3000);
            }

        } catch (e) {
            console.error('SAVE CONTACT ERROR:', e);
            console.error('ERROR BODY:', JSON.stringify(e?.body, null, 2));

            this.toast('Error', this.msg(e), 'error');

        } finally {
            this.isSaving = false;
        }
    }

    // ---------- HELPERS ----------
    toast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }

    msg(e) {
        return (
            (e && e.body && e.body.message) ||
            (e && e.message) ||
            'Unexpected error'
        );
    }

    handleUplodadProfilePic(event) {
        const files = event.detail.files || [];
        if (!files.length) return;

        const file = files[0];

        this.form = {
            ...this.form,
            Picture__c: file.url,
            Profile_Pic_Key__c: file.key || '',
            Profile_Pic_File_Name__c: file.key ? file.key.split('/').pop() : '',
            Profile_Pic_JSON__c: JSON.stringify(file)
        };
    }

    // Facility dropdown. The search box inside c-tesseract-apps-single-combobox also sends a
    // "change" event (with the typed text) that reaches this handler. Keep only a real facility
    // pick; ignore the search text so typing does not change the Facility or redraw the popup.
    handleFacilityChange(event) {
        const value = event.detail ? event.detail.value : undefined;
        const isFacility = (this.facilityOptions || []).some((opt) => opt.value === value);

        if (!isFacility) {
            event.stopPropagation();
            return;
        }

        this.form = {
            ...this.form,
            TSign_Facility__c: value
        };
    }   

    disconnectedCallback() {
        window.removeEventListener('mousedown', this.keepFacilitySearchFocus, true);
        window.removeEventListener('click', this.keepFacilitySearchOpen, true);
    }

    // Keeps the Facility list open when its Search box is clicked.
    // On the TSign site, Lightning Web Security hides the combobox from its own page-wide
    // "click outside" check, so a click on its Search box looked outside and closed the list.
    // This check is added when the contact list loads, before the combobox (it loads with the
    // form), so it runs first. Clicks on the Facility box, on options and elsewhere still go through.
    // keepFacilitySearchOpen = (event) => {
    //     const active = this.template.activeElement;
    //     if (!active || active.getAttribute('data-field') !== 'TSign_Facility__c') {
    //         return;
    //     }
    //     const box = active.getBoundingClientRect();
    //     const onFacilityBox = event.clientX >= box.left && event.clientX <= box.right
    //         && event.clientY >= box.top && event.clientY <= box.bottom;
    //     // The Search box's clear (X) button sits in the last 40px on the right of the list,
    //     // which is always as wide as the Facility box. Let that click through so the X clears
    //     // the search (the list then closes).
    //     const onClearButton = event.clientX >= box.right - 40;
    //     if (!onFacilityBox && !onClearButton) {
    //         event.stopImmediatePropagation();
    //     }
    // };
    // Facility dropdown fix for the TSign site.
    // c-tesseract-apps-single-combobox closes itself on any page click it thinks is outside it.
    // Lightning Web Security hides the combobox from that page-wide check, so clicks on its own
    // Search box and clear (X) button looked "outside" and closed the list. These listeners are
    // added when the contact list loads, before the combobox (it loads with the form), so they
    // run first. Clicks on the Facility box, on options and elsewhere are not touched.

    // Where a click landed while focus is inside the Facility combobox: 'box' (the Facility box),
    // 'clear' (the X, in the last 40px on the right of the list, which is as wide as the box)
    // or 'search'. Null when focus is somewhere else.
    facilityClickZone(event) {
        const active = this.template.activeElement;
        if (!active || active.getAttribute('data-field') !== 'TSign_Facility__c') {
            return null;
        }
        const box = active.getBoundingClientRect();
        if (event.clientX >= box.left && event.clientX <= box.right
            && event.clientY >= box.top && event.clientY <= box.bottom) {
            return 'box';
        }
        return event.clientX >= box.right - 40 ? 'clear' : 'search';
    }

    // Stop the X taking focus, so the Search box keeps it and can be emptied on click.
    keepFacilitySearchFocus = (event) => {
        if (this.facilityClickZone(event) === 'clear') {
            event.preventDefault();
        }
    };

    keepFacilitySearchOpen = (event) => {
        const zone = this.facilityClickZone(event);
        if (!zone || zone === 'box') {
            return;
        }
        event.stopImmediatePropagation();
        if (zone === 'clear') {
            // Do what the X does: empty the focused Search box. Each delete fires the normal
            // typing event, so the combobox shows all facilities again. Lightning Web Security
            // blocks "selectAll", so delete characters on both sides of the cursor instead.
            for (let i = 0; i < 50; i++) {
                document.execCommand('delete');
                document.execCommand('forwardDelete');
            }
        }
    };

}