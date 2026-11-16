import { LightningElement, track, wire } from 'lwc';
//import { CurrentPageReference } from 'lightning/navigation';
import getUserDetails from '@salesforce/apex/TsignUserManagementController.getUserDetails';
import updateUserDetails from '@salesforce/apex/TsignUserManagementController.updateUserDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TesseractAppsTsignMyProfile extends LightningElement {
    @track activeTab = 'profile';            // 'profile' | 'signature'
    @track createtemplatesFlag = false;      // kept for backward-compat; driven from activeTab
    @track userDetails = {};
    @track error;
    @track isLoading = true;
    @track isEditMode = false;
    //@track isSubscriptionFlag = false;
    //stripeReturnHandled = false;
    @track localPreviewUrl = ''; // For showing the newly selected image before saving
    @track isFileExpand = false;
    @track selectedFile = null;
    @track isUploading = false;
    @track currentUserOrgId='';
    
    MAX_FILE_SIZE = 1024 * 1024; // 1MB

    // logged-in user's TSign Organisation - passed to the subscription child
    // orgRecordId = '';
    // orgEmail = '';
    // stripeCustomerId = '';
    orgActive = false;

    @track subscription = {
        accountType: '-', status: '-', startDate: '-',
        nextBillingDate: '-', billingCurrency: '-', billingFrequency: '-',
         market: '-',
    };

    @track billingInfo = {
        contact: '-', email: '-', address: '-', taxInfo: '-'
    };

    @track invoices = [];

    @track isAvatarModalOpen = false;
    @track avatarPreviewUrl = '';
    @track avatarExistingJson = '';
    @track currentUserOrgId = '';
    // newPicUrl / newPicKey / newPicName / newPicJson already exist via userDetails.* new fields
    get hasProfilePic() {
        // true if user has an existing pic OR a newly selected one
        return !!(this.avatarPreviewUrl);
    }

    // ---------------------------------------------------------
    // Getters
    // ---------------------------------------------------------

    // get showSubscriptionPanel() {
    //     return this.isSubscriptionFlag && !!this.orgEmail;
    // }

    // get showNoOrgMessage() {
    //     return this.isSubscriptionFlag && !this.isLoading && !this.orgEmail;
    // }

    // get showProfileView() {
    //     return this.activeTab === 'profile'
    //         && !this.isEditMode
    //         && !this.isSubscriptionFlag;
    // }

    // get showSignatureView() {
    //     return this.activeTab === 'signature'
    //         && !this.isEditMode
    //         && !this.isSubscriptionFlag;
    // }

    // get showStampView() {
    //     return this.activeTab === 'stamp'
    //         && !this.isEditMode
    //         && !this.isSubscriptionFlag;
    // }
    get showProfileView() {
        return this.activeTab === 'profile' && !this.isEditMode;
    }

    // Profile details stay visible behind the Edit popup (like NDIS Edit Staff)
    get showProfileDetails() {
        return this.activeTab === 'profile';
    }

    get showSignatureView() {
        return this.activeTab === 'signature' && !this.isEditMode;
    }

    get showStampView() {
        return this.activeTab === 'stamp' && !this.isEditMode;
    }

    get templatesClass() {
        return this.activeTab === 'profile' ? 'menu-item1' : 'menu-item';
    }

    get createtemplatesClass() {
        return (this.createtemplatesFlag || this.activeTab === 'signature')
            ? 'menu-item1'
            : 'menu-item';
    }

    get stampClass() {
        return (this.createtemplatesFlag || this.activeTab === 'stamp')
            ? 'menu-item1'
            : 'menu-item';
    }

    get signatureClass() {
        return this.showSignatureView || this.showStampView ? 'content-area1' : 'content-area';
    }

    // Green badge when active, red when not (statusText comes from orgActive)
    get statusBadgeClass() {
        return this.orgActive ? 'ta-badge ta-badge-success' : 'ta-badge ta-badge-error';
    }

    // An empty array is still "true" in the template, so check the length
    get hasInvoices() {
        return Array.isArray(this.invoices) && this.invoices.length > 0;
    }

    // Header photo failed to load: hide it so the initials underneath show
    handleAvatarError(event) {
        event.target.classList.add('profile-avatar-img_broken');
    }

    get childAddress() {
        return {
            street: this.userDetails?.street || '',
            city: this.userDetails?.city || '',
            province: this.userDetails?.state || '',
            postalCode: this.userDetails?.postalCode || '',
            country: this.userDetails?.country || 'AU'
        };
    }
     get currencyCode() {
        const currencyMap = {
            'Australia': 'AUD',
            'India': 'INR',
            'USA': 'USD',
            'United States': 'USD',
            'Canada': 'CAD',
            'Singapore': 'SGD'
        };

        return currencyMap[this.subscription?.market] || 'AUD';
    }

    // ---------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------

    connectedCallback() {
        this.fetchUserDetails();
    }

    // @wire(CurrentPageReference)
    // // wiredPageRef(pageRef) {
    // //     const state = pageRef?.state || {};
    // //     if (!this.stripeReturnHandled && (state.stripe === 'success' || state.stripe === 'cancel')) {
    // wiredPageRef() {
    //     const stripeStatus = new URLSearchParams(window.location.search).get('stripe');
    //     if (!this.stripeReturnHandled && (stripeStatus === 'success' || stripeStatus === 'cancel')) {
    //         this.stripeReturnHandled = true;
    //         this.isSubscriptionFlag = true;
    //         this.isEditMode = false;
    //         console.log('TSign profile - back from Stripe, opening subscription');
    //     }
    // }

    // ---------------------------------------------------------
    // Data fetch
    // ---------------------------------------------------------

    async fetchUserDetails() {
        console.log('TSign profile fetchUserDetails START');
        this.isLoading = true;
        try {
            const result = await getUserDetails();
            console.log('TSign profile result', JSON.stringify(result));
            if (result.errorMessage) {
                this.error = { body: { message: result.errorMessage } };
                return;
            }

            let formattedDate = '';
            if (result.createdDate) {
                const dateObj = new Date(result.createdDate);
                formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            }

            // this.orgRecordId = result.orgId || '';
            // this.orgEmail = result.orgEmail || '';
            // this.stripeCustomerId = result.stripeCustomerId || '';
            this.orgActive = result.orgActive === true;
            //console.log('TSign profile org - id: ' + this.orgRecordId + ' | email: ' + this.orgEmail + ' | customer: ' + this.stripeCustomerId);

            const fullAddressString = [result.street, result.city, result.state, result.postalCode].filter(Boolean).join(' ');

            this.userDetails = {
                staffId: result.staffId,
                firstName: result.firstName || '',
                lastName: result.lastName || '',
                email: result.email || '',
                phone: result.phone || '',
                street: result.street || '',
                city: result.city || '',
                state: result.state || '',
                postalCode: result.postalCode || '',
                country: result.country || '',
                userType: result.userType || '', // <-- ADD THIS LINE
                formattedAddress: fullAddressString || '-',
                status: result.status || 'Active',
                statusText: this.orgActive ? 'Active' : 'Inactive',
                activeSince: formattedDate || '-',
                billingText: `${result.billingFrequency || '-'} billing in ${result.billingCurrency || '-'}.`,
                profilePicUrl: result.profilePicUrl,
                profilePicKey: result.profilePicKey,
                currentUserOrgId :result.orgId,
                profilePicJson: result.profilePicJson,
                 
            };
            console.log('TSign profile userDetails', JSON.stringify(this.userDetails));

            const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-GB');
            };

            this.subscription = {
                accountType: result.accountType || '-',
                status: result.subStatus || '-',
                startDate: formatDate(result.startDate),
                nextBillingDate: formatDate(result.nextBillingDate),
                billingCurrency: result.billingCurrency || '-',
                billingFrequency: result.billingFrequency || '-',
                market:result.market || '-',

            };
            console.log('TSign profile subscription', JSON.stringify(this.subscription));

            this.billingInfo = {
                contact: result.billingContact || '-',
                email: result.billingEmail || '-',
                address: result.billingAddress || '-',
                taxInfo: 'Stored securely'
            };
            console.log('TSign profile billingInfo', JSON.stringify(this.billingInfo));

            if (result.invoices) {
                this.invoices = result.invoices.map((inv) => {
                    return {
                        id: inv.Stripe_Invoice_Number__c || '-',
                        paymentDate: formatDate(inv.Date_Issued__c),
                        SubscriptionStartDate: formatDate(inv.Subscription_Start_Date__c),
                        SubscriptionEndDate: formatDate(inv.Subscription_End_Date__c),
                        invoiceGenerated: inv.Invoice_Amount__c || '0',
                        invoiceUrl: inv.Invoice_URL__c
                    };
                });
            } else {
                this.invoices = [];
            }
            console.log('TSign profile invoices', JSON.stringify(this.invoices));

            this.error = undefined;
        } catch (err) {
            this.error = err;
            this.userDetails = {};
            console.error('Error fetching user details:', err);
        } finally {
            this.isLoading = false;
            console.log('TSign profile fetchUserDetails END');
        }
    }

    // ---------------------------------------------------------
    // Tab handlers
    // ---------------------------------------------------------

    handleTemplates() {
        this.activeTab = 'profile';
        this.isEditMode = false;
       // this.isSubscriptionFlag = false;
    }

    handleCreatedTemplates() {
        this.activeTab = 'signature';
        this.isEditMode = false;
        //this.isSubscriptionFlag = false;
    }

    handleAddSignature() {
        // opens the Add Signature form inside the signature component
        const signature = this.template.querySelector('c-tesseract-apps-t-sign-signature-lwc');
        if (signature) {
            signature.openForm();
        }
    }    

    handleCreatesStamps() {
        this.activeTab = 'stamp';
        this.isEditMode = false;
        // this.isSubscriptionFlag = false;
    }

    // ---------------------------------------------------------
    // Profile edit handlers
    // ---------------------------------------------------------

    handleEdit() {
        this.isEditMode = true;
        this.error = undefined;
        this.localPreviewUrl = '';

        // Clear out any temporary upload state from a previous session
        this.userDetails.newPicUrl = undefined;
        this.userDetails.newPicKey = undefined;
        this.userDetails.newPicName = undefined;
        this.userDetails.newPicJson = undefined;
        
        this.selectedFile = null;
        this.isFileExpand = false;
    }

    handleCancel() {
        this.fetchUserDetails();
        this.isEditMode = false;
        this.localPreviewUrl = ''; // Reset preview
        this.selectedFile = null;
        this.isFileExpand = false;
    }

    handleInputChange(event) {
        const field = event.target.name;
        this.userDetails = { ...this.userDetails, [field]: event.target.value };
    }

    handleAddressChange(event) {
        const address = event.detail || {};
 
        const merged = {
            ...this.userDetails,
            street: address.street || '',
            city: address.city || '',
            state: address.province || '',
            postalCode: address.postalCode || '',
            country: address.country || ''
        };

        merged.formattedAddress = [
            merged.street,
            merged.city,
            merged.state,
            merged.postalCode,
            merged.country
        ].filter(Boolean).join(', ');

        this.userDetails = merged;
    }

    async handleSave() {

        const fnInput = this.template.querySelector('lightning-input[name="firstName"]');
            if (fnInput) {
                fnInput.reportValidity();
                if (!fnInput.checkValidity()) {
                    return;
                }
            }
            if (!this.userDetails?.firstName || !this.userDetails.firstName.trim()) {
                return;
            }

            // ---------- 2) Last Name ----------
            const lnInput = this.template.querySelector('lightning-input[name="lastName"]');
            if (lnInput) {
                lnInput.reportValidity();
                if (!lnInput.checkValidity()) {
                    return;
                }
            }
            if (!this.userDetails?.lastName || !this.userDetails.lastName.trim()) {
                return;
            }

            // ---------- 3) Contact ----------
            const phoneInput = this.template.querySelector('lightning-input[name="phone"]');
            if (phoneInput) {
                phoneInput.reportValidity();
                if (!phoneInput.checkValidity()) {
                    return;
                }
            }
            if (!this.userDetails?.phone || !this.userDetails.phone.trim()) {
                return;
            }

            // ---------- 4) Address ----------
            // ---------- 4) Address ----------
            const address = {
                street:     this.userDetails?.street     || '',
                city:       this.userDetails?.city       || '',
                province:   this.userDetails?.state      || '',
                postalCode: this.userDetails?.postalCode || '',
                country:    this.userDetails?.country    || ''
            };

            const isSingapore = (address.country || '').toUpperCase() === 'SG';

            const addressValid =
                address.street.trim() &&
                address.city.trim() &&
                address.postalCode.trim() &&
                address.country.trim() &&
                (isSingapore || address.province.trim());   // province optional for SG

            if (!addressValid) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Validation Error',
                    message: isSingapore
                        ? 'Street, City, Postal Code and Country are required.'
                        : 'A complete Address (street, city, state, postal code, country) is required.',
                    variant: 'error'
                }));
                return;
            }
        this.isLoading = true;
        this.error = undefined;
       const oldKeyToDelete = this.userDetails.profilePicKey;

        const finalPicUrl = this.userDetails.newPicUrl !== undefined ? this.userDetails.newPicUrl : this.userDetails.profilePicUrl;
        const finalPicKey = this.userDetails.newPicKey !== undefined ? this.userDetails.newPicKey : this.userDetails.profilePicKey;
        const finalPicName = this.userDetails.newPicName !== undefined ? this.userDetails.newPicName : this.userDetails.profilePicName;
        const finalPicJson = this.userDetails.newPicJson !== undefined ? this.userDetails.newPicJson : this.userDetails.profilePicJson;
        try {
            await updateUserDetails({
                staffId: this.userDetails.staffId,
                firstName: this.userDetails.firstName,
                lastName: this.userDetails.lastName,
                phone: this.userDetails.phone,
                street: this.userDetails.street,
                city: this.userDetails.city,
                state: this.userDetails.state,
                postalCode: this.userDetails.postalCode,
                country: this.userDetails.country,

                    profilePicUrl: finalPicUrl || null,
                profilePicKey: finalPicKey || null,
                profilePicName: finalPicName || null,
                profilePicJson: finalPicJson || null 
            });

           /*  if (this.userDetails.newPicUrl && oldKeyToDelete) {
                await this.deleteOldFileFromAWS(oldKeyToDelete);
            }
          */
            await this.fetchUserDetails();
            this.isEditMode = false;
             this.dispatchEvent(new CustomEvent('refreshpage', {
                bubbles: true,
                composed: true
            }));
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Profile updated successfully.',
                variant: 'success'
            }));

        } catch (err) {
            this.error = { body: { message: err.body?.message || err.message } };
                this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

     async deleteOldFileFromAWS(key) {
        if (!key) return;
        try {
            console.log('[AWS-DELETE] deleting key:', key);
            const response = await fetch('https://tesseractapps.com/delete-file', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await response.json();
            console.log('[AWS-DELETE] response:', data);
        } catch (error) {
            // Non-fatal: DB now points at the new URL; old object just lingers in S3
            console.error('[AWS-DELETE] failed:', error);
        }
    }

    // ---------------------------------------------------------
    // Subscription handlers
    // ---------------------------------------------------------

    // handleSubscription() {
    //     console.log('TSign profile handleSubscription START');
    //     console.log(' org: ' + this.orgRecordId + ' | email: ' + this.orgEmail + ' | customer: ' + this.stripeCustomerId);
    //     this.isSubscriptionFlag = true;
    //     this.isEditMode = false;
    // }

    // handleCloseSubscription() {
    //     this.isSubscriptionFlag = false;
    //     this.isEditMode = false;
    // }

    // handleSubscriptionUpdated() {
    //     this.fetchUserDetails();
    // }
    get showBillingAndInvoices() {
        const accType = this.subscription?.accountType;
        const uType = this.userDetails?.userType;

        // Hide if Account Type is Organisation AND User Type is Manager or Staff
        if (accType === 'Organisation' && (uType === 'T Sign Manager' || uType === 'T Sign Staff')) {
            return false;
        }
        return true; // Show for everyone else
    }

       /*  triggerFileInput() {
        const input = this.template.querySelector('.hidden-profile-input');
        if (input) {
            input.value = '';
            input.click();
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > this.MAX_FILE_SIZE) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'File size cannot exceed 1MB', variant: 'error' }));
            return;
        }

        this.selectedFile = file;
        
        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => { this.localPreviewUrl = e.target.result; };
        reader.readAsDataURL(file);

        // Trigger AWS Upload Component
        const pass = () => {
            this.isFileExpand = true;
            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (svc) {
                    svc.incomingFiles = [this.selectedFile];
                    svc.confirmUpload = true;
                    this.isUploading = true;
                }
            }, 500); 
        };

        if (this.isFileExpand) {
                this.isFileExpand = false;
                setTimeout(pass, 100);
            } else {
                pass();
            } 
    }

    handleAwsUploadComplete(event) {
        const files = event.detail.files || [];
        if (!files.length) {
            this.isUploading = false;
            return;
        }

        const file = files[0];
        
        // Store the AWS details directly inside userDetails object temporarily
        this.userDetails.newPicUrl = file.url;
        this.userDetails.newPicKey = file.key;
        this.userDetails.newPicSize = file.size != null ? String(file.size) : '';
        this.userDetails.newPicName = file.originalName;

        this.isUploading = false;
       // this.isFileExpand = false;
    } */

     handleUplodadProfilePic(event) {
        console.log('Profile Pic Upload Success', JSON.stringify(event.detail));
        
        const files = event.detail.files || [];
        if (!files.length) return;

        const file = files[0];

        // 1. Store the AWS details
        this.userDetails.newPicUrl = file.url; // The direct S3 URL
        this.userDetails.newPicKey = file.key; // The S3 Key
        
        // Extract the file name from the key (e.g., "1793610737696_images.jfif")
        this.userDetails.newPicName = file.key ? file.key.split('/').pop() : '';

        // 2. Stringify the entire file object for the new JSON field
        this.userDetails.newPicJson = JSON.stringify(file);
         this.avatarPreviewUrl = file.url || '';

        this.isUploading = false;
}
/* 
    handleFileDeleted() {
        this.isUploading = false;
        this.isFileExpand = false;
        this.localPreviewUrl = '';
        
        // Clear the temporary upload data from userDetails
        this.userDetails.newPicUrl = null;
        this.userDetails.newPicKey = null;
        this.userDetails.newPicSize = null;
        this.userDetails.newPicName = null;
    } */
     get userInitials() {
        const fName = this.userDetails?.firstName || '';
        const lName = this.userDetails?.lastName || '';
        
        let initials = '';
        if (fName) initials += fName.charAt(0);
        if (lName) initials += lName.charAt(0);
        
        return initials.toUpperCase() || 'U'; // Defaults to 'U' if both are somehow empty
    }
    showValidationToast(message) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Validation Error',
            message: message,
            variant: 'error'
        }));
    }
    handleRefreshSignature() {
            this.dispatchEvent(new CustomEvent('refreshsignature', {
            bubbles: true,
            composed: true
        }));
   }

   // ---------------------------------------------------------
// Avatar popup handlers
// ---------------------------------------------------------

    handleAvatarClick() {
        // Seed preview + existing JSON from current saved state
        this.avatarPreviewUrl = this.userDetails?.profilePicUrl || '';
        this.avatarExistingJson = this.userDetails?.profilePicJson || '';

        // Clear any stale "new" upload state
        this.userDetails.newPicUrl = undefined;
        this.userDetails.newPicKey = undefined;
        this.userDetails.newPicName = undefined;
        this.userDetails.newPicJson = undefined;

        this.currentUserOrgId = this.userDetails?.currentUserOrgId || '';
        this.isUploading = false;
        this.isAvatarModalOpen = true;
    }

    handleCloseAvatarModal() {
        this.isAvatarModalOpen = false;
        this.avatarPreviewUrl = '';
        this.avatarExistingJson = '';
        this.isUploading = false;

        // Discard unsaved upload state
        this.userDetails.newPicUrl = undefined;
        this.userDetails.newPicKey = undefined;
        this.userDetails.newPicName = undefined;
        this.userDetails.newPicJson = undefined;
    }

    handleRemoveProfilePic() {
        // Mark for removal — final values resolved in handleSaveAvatar
        this.avatarPreviewUrl = '';
        this.userDetails.newPicUrl = null;      // null = explicit removal
        this.userDetails.newPicKey = null;
        this.userDetails.newPicName = null;
        this.userDetails.newPicJson = null;
    }

    async handleSaveAvatar() {
        this.isLoading = true;
        this.error = undefined;

        const oldKeyToDelete = this.userDetails.profilePicKey;

        // Resolve final values: newPic* overrides existing (null = remove)
        const finalPicUrl  = this.userDetails.newPicUrl  !== undefined ? this.userDetails.newPicUrl  : this.userDetails.profilePicUrl;
        const finalPicKey  = this.userDetails.newPicKey  !== undefined ? this.userDetails.newPicKey  : this.userDetails.profilePicKey;
        const finalPicName = this.userDetails.newPicName !== undefined ? this.userDetails.newPicName : this.userDetails.profilePicName;
        const finalPicJson = this.userDetails.newPicJson !== undefined ? this.userDetails.newPicJson : this.userDetails.profilePicJson;

        try {
            await updateUserDetails({
                staffId: this.userDetails.staffId,
                firstName: this.userDetails.firstName,
                lastName: this.userDetails.lastName,
                phone: this.userDetails.phone,
                street: this.userDetails.street,
                city: this.userDetails.city,
                state: this.userDetails.state,
                postalCode: this.userDetails.postalCode,
                country: this.userDetails.country,

                profilePicUrl: finalPicUrl || null,
                profilePicKey: finalPicKey || null,
                profilePicName: finalPicName || null,
                profilePicJson: finalPicJson || null
            });

            // Optional: delete old S3 object when replaced/removed
            // if ((this.userDetails.newPicUrl !== undefined || finalPicUrl === null) && oldKeyToDelete) {
            //     await this.deleteOldFileFromAWS(oldKeyToDelete);
            // }

            await this.fetchUserDetails();
            this.isAvatarModalOpen = false;
            this.avatarPreviewUrl = '';
            this.avatarExistingJson = '';

            this.dispatchEvent(new CustomEvent('refreshpage', { bubbles: true, composed: true }));
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Profile picture updated successfully.',
                variant: 'success'
            }));
        } catch (err) {
            this.error = { body: { message: err.body?.message || err.message } };
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: this.error.body.message,
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

      handleDeleteFile(event) {
            const updatedFiles = event.detail;

            console.log('Updated file list:', JSON.stringify(updatedFiles));
            this.handleRemoveProfilePic();

          
        }
}