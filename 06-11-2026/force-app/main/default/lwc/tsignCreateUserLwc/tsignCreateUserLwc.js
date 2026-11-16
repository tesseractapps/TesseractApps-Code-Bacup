import { LightningElement, track } from 'lwc';
import getUserType from '@salesforce/apex/TsignUserManagementController.getUserType';
import getFacilities from '@salesforce/apex/TsignUserManagementController.getFacilities';
import createUser from '@salesforce/apex/TsignUserManagementController.createUser'; 
const MAX_FILE_BYTES = 50 * 1024 * 1024;
import getOrg from '@salesforce/apex/TsignUserManagementController.getOrg';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TSignCreateUserLwc extends LightningElement {

    // ---------- Form state ----------
    @track firstName = '';
    @track lastName = '';
    @track phoneNumber = '';
    @track email = '';
    @track selectedUserType = '';
    @track selectedFacility = '';

    // ---------- Address state ----------
    @track street = '';
    @track city = '';
    @track country = '';
    @track province = '';
    @track postalcode = '';

    // ---------- Combobox options ----------
    @track filteredUserTypeValues = [];
    @track filteredFacilityValues = [];

    // ---------- UI state ----------
    @track isLoading = false;
    @track errorMessage = '';
    @track disableMode = false;
    // ---------- Profile picture state ----------
    @track isFileAttached  = false;
    @track isFileExpand    = false;
    @track isattachError   = false;
    @track uploadedFile    = null;
    @track ProfilefileName = '';
    profilePicUrl  = null;
    profilePicSize = null;
    profilePicKey  = null;
    oldFileKey     = null;   // for create: only used if user uploads then removes
    selectedRecordId = '';   // record id passed to child; empty on create is fine
    @track orgId = '';
    profilePicJSON = null;
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

    // ---------- Raw Apex results ----------
    userType;
    facilities;

    // =========================================================
    //  LIFECYCLE
    // =========================================================
    connectedCallback() {
        this.loadUserTypeOptions();
        this.loadFacilityOptions();
        this.loadOrgId(); // <-- Add this
    }

    // =========================================================
    //  APEX CALL #1 — getUserType
    // =========================================================
    async loadUserTypeOptions() {
        try {
            this.userType = await getUserType();
            this.buildFilteredUserTypeValues();
        } catch (error) {
            this.handleError(error, 'user type');
        }
    }
    async loadOrgId() {
        try {
            const orgList = await getOrg();
            if (orgList && orgList.length > 0) {
                this.orgId = orgList[0].Id;
                const market = orgList[0].Market__c; // change API name if different
                const mapped = this.marketToCountryMap[market];
                if (mapped) {
                    this.country = mapped;
                } else {
                    console.warn('Unknown market value:', market);
                }
                console.log('org Id'+this.orgId);
            }
        } catch (error) {
            console.error('Error loading org:', error);
        }
}

    buildFilteredUserTypeValues() {
        const ALL_OPTIONS = [
            { label: 'T Sign Org Admin', value: 'T Sign Org Admin' },
            { label: 'T Sign Manager',   value: 'T Sign Manager'   }/* ,
            { label: 'T Sign Staff',     value: 'T Sign Staff'     } */
        ];

        let allowedValues;
        if (this.userType === 'T Sign Org Admin') {
            allowedValues = ['T Sign Org Admin', 'T Sign Manager'];
        } else if (this.userType === 'T Sign Manager') {
            allowedValues = ['T Sign Manager'];
        }

        this.filteredUserTypeValues = ALL_OPTIONS.filter(opt =>
            allowedValues.includes(opt.value)
        );
    }

    // =========================================================
    //  APEX CALL #2 — getFacilities
    // =========================================================
    async loadFacilityOptions() {
        this.isLoading = true;
        try {
            this.facilities = await getFacilities();
            this.buildFilteredFacilityValues();
        } catch (error) {
            this.handleError(error, 'facility');
        } finally {
            this.isLoading = false;
        }
    }

    buildFilteredFacilityValues() {
        this.filteredFacilityValues = this.facilities || [];
    }

    // =========================================================
    //  ERROR HANDLING
    // =========================================================
    handleError(error, context = '') {
        let msg = `Failed to load ${context} data`;
        if (error) {
            if (Array.isArray(error.body)) {
                msg = error.body.map(e => e.message).join(', ');
            } else if (error.body && error.body.message) {
                msg = error.body.message;
            } else if (error.message) {
                msg = error.message;
            }
        }
        this.errorMessage = msg;
        // eslint-disable-next-line no-console
        console.error(`Error loading ${context}:`, error);
    }

    // =========================================================
    //  FIELD HANDLERS
    //  ⚠️ Use event.detail.value — this is the documented API
    //     for lightning-input AND lightning-combobox.
    // =========================================================
    handleFieldChange(event) {
        const field = event.target.dataset.field;
        if (field) {
            this[field] = event.detail.value;
        }
    }

    PhonenumberChange(event) {
        // strip anything non-numeric just in case
        this.phoneNumber = (event.detail.value || '').replace(/\D/g, '');
    }

    handleUserTypeChange(event) {
        this.selectedUserType = event.detail.value;
    }

    handleFacilityChange(event) {
        this.selectedFacility = event.detail.value;
    }

   /*  addressInputChange(event) {
        const detail = event.detail;
        this.street     = detail.street     || '';
        this.city       = detail.city       || '';
        this.country    = detail.country    || '';
        this.province   = detail.province   || '';
        this.postalcode = detail.postalCode || '';
    } */

    get childAddress() {
        return {
            street: this.street || '',
            city: this.city || '',
            country: this.country || 'AU',
            province: this.province || '',
            postalCode: this.postalcode || ''
        };
    }

   /*  addressInputChange(event) {
        const detail = event.detail || {};

        this.street = detail.street || '';
        this.city = detail.city || '';
        this.country = detail.country || '';
        this.province = detail.province || '';
        this.postalcode = detail.postalCode || '';
    }
 */

    addressInputChange(event) {
        const d = event.detail || {};

        this.street = d.street || '';
        this.city = d.city || '';
        this.province = d.province || '';
        this.postalcode = d.postalCode || '';
        this.country = d.country || '';

        console.log('[addressInputChange]', {
            street: this.street,
            city: this.city,
            province: this.province,
            postalcode: this.postalcode,
            country: this.country
        });
    }
    // =========================================================
    //  NAVIGATION / SAVE
    // =========================================================
    handleBack() {
        this.resetProfilePicState();
        this.dispatchEvent(new CustomEvent('back'));
    }

    resetProfilePicState() {
        this.uploadedFile    = null;
        this.ProfilefileName = '';
        this.isFileAttached  = false;
        this.isFileExpand    = false;
        this.isattachError   = false;
        this.profilePicUrl   = null;
        this.profilePicSize  = null;
        this.profilePicKey   = null;
        this.oldFileKey      = null;
        this.profilePicJSON  = null; // <-- NEW
        this.oldFileKey      = null;
    }

    async handleSave() {
        // ---------- 0) Guard: options must be loaded ----------
        if (this.isLoading) {
            this.errorMessage = 'Options are still loading. Please wait a moment and try again.';
            return;
        }
        if (this.filteredUserTypeValues.length === 0 || this.filteredFacilityValues.length === 0) {
            this.errorMessage = 'Dropdown options failed to load. Please refresh the page and try again.';
            return;
        }
        const isSingapore = (this.country || '').toUpperCase() === 'SG';

            const addressValid =
                this.street && this.street.trim() &&
                this.city && this.city.trim() &&
                this.postalcode && this.postalcode.trim() &&
                this.country && this.country.trim() &&
                (isSingapore || (this.province && this.province.trim()));

            if (!addressValid) {
                this.errorMessage = isSingapore
                    ? 'Street, City, Postal Code and Country are required.'
                    : 'A complete Address (street, city, state, postal code, country) is required.';
                return;
            }

        // ---------- 1) Explicit JS validation ----------
        const missing = [];
        if (!this.firstName)        missing.push('First Name');
        if (!this.lastName)         missing.push('Last Name');
        if (!this.phoneNumber)      missing.push('Contact Number');
        if (!this.email)            missing.push('Email ID');
        if (!this.selectedUserType) missing.push('User Type');
        if (!this.selectedFacility) missing.push('Facility');

        if (missing.length > 0) {
            this.errorMessage = 'Please fill required fields: ' + missing.join(', ');
            return;
        }

        // ---------- 2) Native component validity check ----------
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-combobox'),
            ...this.template.querySelectorAll('lightning-input-address')
        ].reduce((valid, el) => {
            el.reportValidity();
            return valid && el.checkValidity();
        }, true);

        if (!allValid) {
            this.errorMessage = 'Please correct the highlighted fields.';
            return;
        }

        // ---------- 3) Build payload ----------
        const payload = {
            firstName:   this.firstName,
            lastName:    this.lastName,
            phoneNumber: this.phoneNumber,
            email:       this.email.trim(),
            userType:    this.selectedUserType,
            facility:    this.selectedFacility,
            street:      this.street,
            city:        this.city,
            country:     this.country,
            province:    this.province,
            postalCode:  this.postalcode, 

            profilePicUrl:  this.profilePicUrl  || '',
            profilePicSize: this.profilePicSize || '',
            profilePicKey:  this.profilePicKey  || '',
            ProfilefileName: this.ProfilefileName || '',
             profilePicJson: this.profilePicJSON || null // <-- NEW
        };

        // Debug — remove or hide behind a debug flag in production
        // eslint-disable-next-line no-console
        console.log('📤 createUser payload:', JSON.stringify(payload, null, 2));

        // ---------- 4) Call Apex ----------
        this.isLoading = true;
        this.errorMessage = '';
 
        try {
            const result = await createUser({ request: payload });   // ✅ binds payload → parameter "request"
            // eslint-disable-next-line no-console
            console.log('✅ createUser result:', result);
            if (this.oldFileKey && this.oldFileKey !== this.profilePicKey) {
                    await this.deleteOldFileFromAWS(this.oldFileKey);
                    this.oldFileKey = null;
            }
            this.oldFileKey = null;

            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'User details submitted successfully. Changes will reflect within 5 to 10 minutes',
                variant: 'success'
            }));

            this.dispatchEvent(new CustomEvent('success', { detail: { id: result } }));
            this.dispatchEvent(new CustomEvent('back'));
        } catch (error) {
            this.handleError(error, 'create user');
        } finally {
            this.isLoading = false;
        }
    }

   /*  handleDragOver(event) {
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
                if (!svc) {
                    console.warn('⚠️ document-office-service not found');
                    return;
                }
                svc.incomingFiles = [file];
                svc.confirmUpload = true;
            }, 500);
        };

        if (this.isFileExpand) {
            this.isFileExpand = false;
            this.uploadedFile = null;
            this.isFileAttached = false;
            setTimeout(pass, 100);
            return;
        }

        pass();
    }

    async handleAwsUploadComplete(event) {
        const files = event.detail.files || [];
        if (!files.length) return;

        this.uploadedFile    = files[0];
        this.ProfilefileName = this.uploadedFile.originalName;
        this.isFileAttached  = true;
        this.profilePicUrl   = this.uploadedFile.url || null;
        this.profilePicSize  = this.uploadedFile.size != null
                                ? String(this.uploadedFile.size)
                                : '';
        this.profilePicKey   = this.uploadedFile.key || null;

        // On create: if the user had already uploaded one and is now replacing it,
        // delete the previous just-uploaded object from AWS (not the DB — nothing saved yet)
       
        // Track the key of the currently-staged file so a later replace/remove can clean it up
        this.oldFileKey = this.profilePicKey;
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
            console.error('[AWS-DELETE] failed:', error);
        }
    }

    async handleRemovePic() {
        // For create: delete the just-uploaded object (if any) from AWS
        if (this.oldFileKey) {
            await this.deleteOldFileFromAWS(this.oldFileKey);
            this.oldFileKey = null;
        }

        this.uploadedFile    = null;
        this.ProfilefileName = '';
        this.isFileAttached  = false;
        this.isFileExpand    = false;
        this.profilePicUrl   = null;
        this.profilePicSize  = null;
        this.profilePicKey   = null;
    }

    handleFileDeleted() {
        // Child deleted the current upload — mirror state, but DO NOT delete oldFileKey here
        // if it points to a previously-saved object (not applicable on create, but safe)
        this.uploadedFile    = null;
        this.ProfilefileName = '';
        this.isFileAttached  = false;
        this.isFileExpand    = false;
        this.profilePicUrl   = null;
        this.profilePicSize  = null;
        this.profilePicKey   = null;
    } */

    handleImgError() {
        this.profilePicUrl = null;
    }

    showToast(message, variant = 'error', title) {
        // reuse your existing error banner if you have no ShowToastEvent import
        this.errorMessage = message;
        console.warn('[TOAST]', variant, message);
    }

    handleUplodadProfilePic(event) {
    console.log('Profile Pic Upload Success', JSON.stringify(event.detail));
    
    const files = event.detail.files || [];
    if (!files.length) return;

    const file = files[0];

    // 1. Store the AWS details
    this.profilePicUrl = file.url; 
    this.profilePicKey = file.key; 
    this.profilePicSize = file.size != null ? String(file.size) : '';
    
    // Extract the file name from the key (e.g., "1793610737696_images.jfif")
    this.ProfilefileName = file.key ? file.key.split('/').pop() : '';

    // 2. Stringify the entire file object for the JSON field
    this.profilePicJSON = JSON.stringify(file);
}
}