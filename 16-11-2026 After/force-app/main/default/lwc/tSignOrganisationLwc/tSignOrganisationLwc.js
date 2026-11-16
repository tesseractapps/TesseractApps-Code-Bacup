import { LightningElement, wire,api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOrgAndContacts from '@salesforce/apex/OrgSubscriptionController.getOrgAndContacts';
import saveOrganisationWithContacts from '@salesforce/apex/OrgSubscriptionController.saveOrganisationWithContacts';
//import { CurrentPageReference } from 'lightning/navigation';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import updateOrgLogo from '@salesforce/apex/TsignOrgDetails.updateOrgLogo';

export default class TSignOrganisationLwc extends LightningElement {
    @api recordId;
    @track orgData = {};
    @track primaryContacts = [];
    @track invoices = []; 


    @track orglogo = '';         
    @track isModalOpen = false;
    @track previewUrl = '';      
    @track errorMessage = '';
    @track isLogoLoading = false;
    @track tempNewJson =''

    // Reference logic tracking properties
    @track isFileExpand = false;
    @track uploadedFile = null;
    selectedFile = null; // The local file selected by the user
    oldFileKey = '';  
    //@track isSubscriptionFlag= false;
    // stripeReturnHandled = false;
    
   @track viewData = {
       OrgId:'', legalName: '-', businessType: '-', market: '-', abn: '-', address: '-', acn: '-',
        accountType: '-', statusText: '-', startDate: '-', endDate: '-', interval: '-', planLinkText: 'View Details',
        email: '-', orgName: '', initials: 'OR', activeStartDate: '', isActive: false, stripeCustomerId: '',
        billingEmail: '-', billingPhone: '-', billingAddress: '-',
        // Add these:
        pan: '-', gstn: '-', ein: '-', bnCanada: '-', gstHst: '-', uenSingapore: '-', gstSingapore: '-'
    };

    @track editAddress = { street: '', city: '', province: '', postalCode: '', country: '' };

    isViewMode = true;
    isEditMode = false;
    isLoading = true;
    logoUrl = `${Loading_Logo}/TLogo.png`;
    imageUrl = `${Loading_Logo}/T.png`;    
    @track isInvoiceModalOpen = false;
    @track currentInvoiceUrl = '';

    

    connectedCallback() {
        this.fetchData();
    }
    // get showSubscriptionPanel() {
    //     return this.isSubscriptionFlag && !!this.viewData.email && this.viewData.email !== '-';
    // }

    // @wire(CurrentPageReference)
    // // wiredParentPageRef(pageRef) {
    // //     const state = pageRef?.state || {};
    // //     //  only the first time we come back from Stripe - later tab clicks are left alone
    // //     if (!this.stripeReturnHandled && (state.stripe === 'success' || state.stripe === 'cancel')) {
    // wiredParentPageRef() {
    //     const stripeStatus = new URLSearchParams(window.location.search).get('stripe');
    //     //  only the first time we come back from Stripe - later tab clicks are left alone
    //     if (!this.stripeReturnHandled && (stripeStatus === 'success' || stripeStatus === 'cancel')) {
    //         this.stripeReturnHandled = true;
    //         this.isSubscriptionFlag = true;
    //         this.isViewMode = false;
    //         this.isEditMode = false;
    //     }
    // }

    fetchData() {
        this.isLoading = true;
        getOrgAndContacts({ recordId: this.recordId })
            .then(result => {
                // Logs for debugging
                console.log('1. Full Result from Apex:', JSON.stringify(result));
                console.log('2. Organisation Data:', JSON.stringify(result.organisation));
                console.log('3. Subscriptions (Invoices):', JSON.stringify(result.subscriptions));

                this.orgData = result.organisation || {};
                this.primaryContacts = result.primaryContacts || [];
                this.invoices = result.subscriptions || []; 
                
                this.formatDataForDisplay();
                this.isLoading = false;
            })
            .catch(error => {
                this.isLoading = false;
                console.error('Error fetching data:', JSON.stringify(error));
                this.showToast('Error', error.body ? error.body.message : error.message, 'error');
            });
    }

    // Helper method to format dates to DD/MM/YYYY
    formatDate(dateString) {
        if (!dateString) return '-';
        // Handle ISO timestamp or standard YYYY-MM-DD
        const dateOnly = dateString.length > 10 ? dateString.substring(0, 10) : dateString;
        const parts = dateOnly.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`; // Returns DD/MM/YYYY
        }
        return dateString;
    }

    get isAustralia() { return this.viewData.market === 'Australia' || this.orgData?.Market__c === 'Australia'; }
    get isIndia()     { return this.viewData.market === 'India' || this.orgData?.Market__c === 'India'; }
    get isUSA()       { return this.viewData.market === 'USA' || this.orgData?.Market__c === 'USA'; }
    get isCanada()    { return this.viewData.market === 'Canada' || this.orgData?.Market__c === 'Canada'; }
    get isSingapore() { return this.viewData.market === 'Singapore' || this.orgData?.Market__c === 'Singapore'; }
        get currencyCode() {
        const currencyMap = {
            'Australia': 'AUD',
            'India': 'INR',
            'USA': 'USD',
            'United States': 'USD',
            'Canada': 'CAD',
            'Singapore': 'SGD'
        };

        return currencyMap[this.orgData?.Market__c] || 'AUD';
    }

    formatDataForDisplay() {
        const org = this.orgData;

        this.viewData.OrgId= org.Id;
         this.orglogo = org.Logo_URL__c;
        this.oldFileKey = org.Logo_key__c; 
        this.viewData.orgName = org.Name || 'Organisation';
        this.viewData.legalName = org.Legal_Name__c || '-';
        this.viewData.businessType = org.Business_Type__c || '-';
        this.viewData.market = org.Market__c || '-';
        this.viewData.abn = org.ABN__c || '-';
          this.viewData.phone = org.Phone__c || '-';
         this.viewData.acn = org.ACN__c || '-';
        this.viewData.pan = org.PAN__c || '-';
        this.viewData.gstn = org.GSTN__c || '-';
        this.viewData.ein = org.EIN__c || '-';
        this.viewData.bnCanada = org.BN_Canada__c || '-';
        this.viewData.gstHst = org.GST_HST__c || '-';
        this.viewData.uenSingapore = org.UEN_Singapore__c || '-';
        this.viewData.gstSingapore = org.GST_Singapore__c || '-';

        this.viewData.accountType = org.Account_Type__c || '-';
        
        // Format Dates
        this.viewData.startDate = this.formatDate(org.Plan_Start_Date__c);
        this.viewData.endDate = this.formatDate(org.Plan_End_Date__c);
        
        this.viewData.interval = org.Interval__c || '-';
        this.viewData.planLinkText = 'View Details';
        this.viewData.email = org.Email__c || '-';
        this.viewData.stripeCustomerId = org.Stripe_Customer_ID__c || '';
        
        this.viewData.isActive = org.Active__c === true;
        this.viewData.statusText = org.Active__c === true ? 'Active' : 'Inactive';

        // Billing Info
        this.viewData.billingEmail = org.Billing_Email__c || '-';
        this.viewData.billingPhone = org.Billing_Phone__c || '-';
        
        if (org.Billing_Address__c) {
            const bAddr = org.Billing_Address__c;
            const bParts = [bAddr.street, bAddr.city, bAddr.state, bAddr.postalCode, bAddr.country].filter(p => p);
            this.viewData.billingAddress = bParts.length > 0 ? bParts.join(' ') : '-';
        } else {
            this.viewData.billingAddress = '-';
        }

        // Active Since Date
        if (org.CreatedDate) {
            const date = new Date(org.CreatedDate);
            this.viewData.activeStartDate = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
        }

        // Initials
        if (org.Name) {
            const words = org.Name.split(' ');
            this.viewData.initials = words.length > 1 
                ? (words[0][0] + words[1][0]).toUpperCase() 
                : org.Name.substring(0, 2).toUpperCase();
        }

        // Address
        if (org.Address__c) {
            const addr = org.Address__c;
            const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(value => value);
           this.viewData.address = parts.length ? parts.join(' ') : '-';

            this.editAddress = {
                street: addr.street || '',
                city: addr.city || '',
                province: addr.stateCode || addr.state || '',
                postalCode: addr.postalCode || '',
                country: this.getCountryCode(addr.countryCode || addr.country || '')
            };
        } else {
            this.viewData.address = '-';
            this.editAddress = { street: '', city: '', province: '', postalCode: '', country: '' };
        }

        // Format Invoice Dates
        if (this.invoices && this.invoices.length > 0) {
            this.invoices = this.invoices.map(inv => {
                return {
                    ...inv,
                    formattedDateIssued: this.formatDate(inv.Date_Issued__c),
                    SubscriptionStartDate: this.formatDate(inv.Subscription_Start_Date__c),
                    SubscriptionEndDate: this.formatDate(inv.Subscription_End_Date__c),
                };
            });
        }
    }

    getCountryCode(country) {
        if (!country) return '';
        const value = String(country).trim().toLowerCase();
        const countryMap = {
            'australia': 'AU', 'au': 'AU', 'india': 'IN', 'in': 'IN',
            'united states': 'US', 'usa': 'US', 'us': 'US', 'canada': 'CA', 'ca': 'CA',
            'united kingdom': 'GB', 'uk': 'GB', 'gb': 'GB', 'new zealand': 'NZ', 'nz': 'NZ'
        };
        return countryMap[value] || country.trim().toUpperCase();
    }

    get hasContacts() {
        return this.primaryContacts && this.primaryContacts.length > 0;
    }

    // An empty array is still "true" in the template, so check the length
    get hasInvoices() {
        return Array.isArray(this.invoices) && this.invoices.length > 0;
    }

    // Keep the details visible behind the Edit popup (like NDIS Edit Staff)
    get showOrgView() {
        return this.isViewMode || this.isEditMode;
    }
    @api
    handleEdit() {
        this.primaryContacts = JSON.parse(JSON.stringify(this.primaryContacts));
        this.isViewMode = false; 
        this.isEditMode = true; 
    }
    // handleSubscription() {
    //     this.isSubscriptionFlag = true;
    //     this.isViewMode = false; 
    //     this.isEditMode = false; 
    // }

    handleCancel() { 
        this.isEditMode = false; 
        this.isViewMode = true; 
        this.fetchData(); 
    }

    handleFieldChange(event) {
        this.orgData[event.target.dataset.field] = event.target.value;
    }

    // handleAddressChange(event) {
    //     const address = event.detail || {};
    //     this.editAddress = {
    //         street: address.street || '',
    //         city: address.city || '',
    //         province: address.province || '',
    //         postalCode: address.postalCode || '',
    //         country: address.country || ''
    //     };
    // }
    get childAddress() {
        return {
            street: this.editAddress?.street || '',
            city: this.editAddress?.city || '',
            province: this.editAddress?.province || '',
            postalCode: this.editAddress?.postalCode || '',
            country: this.editAddress?.country || ''
        };
    }
    
    handleAddressChange(event) {
        const address = event.detail || {};
    
        this.editAddress = {
            street: address.street || '',
            city: address.city || '',
            province: address.province || '',
            postalCode: address.postalCode || '',
            country: address.country || ''
        };
    }

    handleContactChange(event) {
        const index = event.target.dataset.index;
        const field = event.target.dataset.field;
        this.primaryContacts[index][field] = event.target.value;
    }

   handleSave() {
        // 1) Organisation Name
        const nameInput = this.template.querySelector(
            'lightning-input[data-field="Name"]'
        );
        if (nameInput) {
            nameInput.reportValidity();
            if (!nameInput.checkValidity()) {
                return;
            }
        }
        if (!this.orgData?.Name || !this.orgData.Name.trim()) {
            this.showToast('Validation Error', 'Organisation Name is required.', 'error');
            return;
        }

        // 2) Phone
        const phoneInput = this.template.querySelector(
            'lightning-input[data-field="Phone__c"]'
        );
        if (phoneInput) {
            phoneInput.reportValidity();
            if (!phoneInput.checkValidity()) {
                return;
            }
        }
        if (!this.orgData?.Phone__c || !this.orgData.Phone__c.trim()) {
            this.showToast('Validation Error', 'Phone is required.', 'error');
            return;
        }

            // 3) Address required
                const address = this.editAddress || {};
        const isSingapore = (address.country || '').toUpperCase() === 'SG';

        const addressValid =
        address.street     && address.street.trim() &&
        address.city       && address.city.trim() &&
        address.postalCode && address.postalCode.trim() &&
        address.country    && address.country.trim() &&
        (isSingapore || (address.province && address.province.trim()));

        if (!addressValid) {
        this.showToast(
            'Validation Error',
            isSingapore
                ? 'Street, City, Postal Code and Country are required.'
                : 'A complete Address (street, city, state, postal code, country) is required.',
            'error'
        );
        return;
        }
        this.isLoading = true;
        const orgToSave = JSON.parse(JSON.stringify(this.orgData));
        orgToSave.Id = this.orgData.Id;
        console.log('orgToSave=>'+JSON.stringify(this.orgData));

        orgToSave['Address__Street__s'] = this.editAddress.street || '';
        orgToSave['Address__City__s'] = this.editAddress.city || '';
        orgToSave['Address__StateCode__s'] = this.editAddress.province || '';
        orgToSave['Address__PostalCode__s'] = this.editAddress.postalCode || '';
        orgToSave['Address__CountryCode__s'] = this.getCountryCode(this.editAddress.country);

        saveOrganisationWithContacts({ 
            orgToUpdate: orgToSave, 
            contactsToUpdate: this.primaryContacts 
        })
            .then(() => {
                this.showToast('Success', 'Organisation updated successfully', 'success');
                this.isEditMode = false;
                this.isViewMode = true;
                this.fetchData(); 
                 this.dispatchEvent(new CustomEvent('refreshorgdata', {
                    bubbles: true,
                    composed: true
                }));
            })
            .catch(error => {
                this.isLoading = false;
                this.showToast('Error', error.body ? error.body.message : error.message, 'error');
            });
    }

    showToast(title, message, variant) { 
        this.dispatchEvent(new ShowToastEvent({ title, message, variant })); 
    }

     handleOpenInvoiceModal(event) {
        const url = event.currentTarget.dataset.url;
        this.currentInvoiceUrl = url;
        this.isInvoiceModalOpen = true;
    }

    handleCloseInvoiceModal() {
        this.isInvoiceModalOpen = false;
        this.currentInvoiceUrl = '';
    }

    // "Your current plan" link - the dashboard opens the subscription screen (same as Upgrade in the header)
    handleOpenSubscription(event) {
        event.preventDefault();
        console.log('TSign organisation - current plan link clicked, opening subscription');
        this.dispatchEvent(new CustomEvent('opensubscription', { bubbles: true, composed: true }));
    }

    handleOpenModal() {
        console.log('calling org logo');
    
        this.isModalOpen = true;
        this.previewUrl = this.orglogo;
        this.errorMessage = '';
        this.selectedFile = null; 
    }

    handleCloseModal() {
        this.isModalOpen = false;
        this.previewUrl = '';
        this.selectedFile = null;
        this.errorMessage = '';
        this.isFileExpand = false; // Reset child component
    }


        handleAwsUploadComplete(event) {
        console.log('Org Logo Upload Success', JSON.stringify(event.detail));
        
        const files = event.detail.files || [];
        if (!files.length) {
            this.isLogoLoading = false; 
            return;
        }

        const file = files[0];

        // Store the new data to be sent to Apex
        this.tempNewUrl = file.url;
        this.tempNewKey = file.key;
        this.tempNewSize = file.size != null ? String(file.size) : '';
        
        // NEW: Stringify the entire file object for the JSON field
        this.tempNewJson = JSON.stringify(file);

        // Show the newly uploaded image in the preview
        this.previewUrl = file.url;

        this.isLogoLoading = false;
    }
    handleRemoveLogo() {
        this.previewUrl = '';         // Clear local preview
        this.selectedFile = null;     // Clear local file
        this.tempNewUrl = '';         // Set to empty so Apex clears the record
        this.tempNewKey = '';
        this.tempNewSize = '';
        this.tempNewFileName = '';
        this.isFileExpand = false;    // Reset child component
        this.tempNewJson = ''; // <-- Clear JSON
        
        // Optional: Show a message indicating the logo will be removed on update
        this.showToast('Logo marked for removal. Click Update to save.', 'info');
    }

    async handleUpdate() {
        // Ensure the AWS upload actually finished

        this.isLogoLoading = true;
        this.errorMessage = '';

        try {
            // 1. CALL APEX to save the new logo details
            await updateOrgLogo({ 
                orgId:  this.viewData.OrgId,
                logoUrl: this.tempNewUrl || '',     // Send empty string to clear
                logoKey: this.tempNewKey || '',
                logoSize: this.tempNewSize || '',
                logoFileName: this.tempNewFileName || '',
            logoJson: this.tempNewJson || '' // <-- NEW JSON PARAMETER
            });

            // 2. DELETE OLD AWS FILE (Only after DB save succeeds)
            /*    if (this.oldFileKey && this.oldFileKey !== this.tempNewKey) {
                    await this.deleteOldFileFromAWS(this.oldFileKey);
                }
        */
            // 3. SUCCESS CLEANUP
            this.orglogo = this.tempNewUrl || ''; // Will trigger the Home icon fallback in HTML
            this.oldFileKey = this.tempNewKey; // Update the old key reference
            this.isModalOpen = false;
            this.selectedFile = null;
            
            // Clear temp variables
            this.tempNewKey = null;
            this.tempNewUrl = null;
            this.previewUrl = '';
            
            //this.showToastLogo('Organisation logo updated successfully', 'success');
            const logoLabel = 'Logo';       
            this.showToast(`${logoLabel} updated successfully`, 'success');
             this.dispatchEvent(new CustomEvent('refreshorgdata', {
                    bubbles: true,
                    composed: true
                }));

        } catch (error) {
            console.error('Apex Save Error:', error);
            this.errorMessage = error.body ? error.body.message : 'Failed to update database.';
            this.showToast(this.errorMessage, 'error');
        } finally {
            this.isLoading = false;
            this.isFileExpand = false; // Reset the child component
        }
    }

     handleAvatarError(event) {
        event.target.classList.add('profile-avatar-img_broken');
    }
     handleDeleteFile(event) {
            const updatedFiles = event.detail;

            console.log('Updated file list:', JSON.stringify(updatedFiles));
            this.handleRemoveLogo();

          
        }
    

   
}