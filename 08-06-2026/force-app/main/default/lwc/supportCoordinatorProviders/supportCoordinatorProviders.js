import { LightningElement, track ,api} from 'lwc';
import saveProvider from '@salesforce/apex/Support_ProviderController.saveProvider';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProvidersPaged from '@salesforce/apex/Support_ProviderController.getProvidersPaged';
import fetchServiceTypes from '@salesforce/apex/SupportParticipantController.fetchServiceTypes';

export default class supportCoordinatorProviders extends LightningElement {
    @track providerflag = true;
    @api viewProviderId;
    @api
    openFromDashboard() {
        this.providerflag = false;
        console.log('==============================');
        console.log('📥 openFromDashboard() called');
        console.log('providerflag BEFORE:', this.providerflag);
        console.log('showProviderModal BEFORE:', this.showProviderModal);

        this.resetForm();
        this.isEditMode = false;

        this.providerflag = false;
        this.showProviderModal = true;

        console.log('providerflag AFTER:', this.providerflag);
        console.log('showProviderModal AFTER:', this.showProviderModal);
        console.log('✅ Provider popup opened from dashboard');
        console.log('==============================');
    }
    @api
    openEdit(providerId) {
        // 🔴 Providers not loaded yet → wait
        if (!this.providersLoaded) {
            this.pendingEditId = providerId;
            return;
        }

        const p = this.providers.find(x => x.id === providerId);
        if (!p) return;

        // Reuse existing logic
        this.openEditModal({
            target: { dataset: { id: providerId } }
        });
    }
    @api
    openView(providerId) {
        const p = this.providers.find(x => x.id === providerId);
        if (!p) return;

        this.openDetails({ target: { dataset: { id: providerId } } });
    }
    @track providersLoaded = false;
    pendingEditId = null;
    @track showProviderModal = false;
    @track providers = [];
    @track isEditMode = false;
    @track showProviderDetails = false;
    @track showProviderDetails1 =false;
    @track selectedProvider = {};
    @track currentPage = 1;
    @track pageSize = 10;
    @track totalPages = 0;
    @track totalRecords = 0;
    @track pageSizeOptions = [ 10, 20, 50 ];
    @track selectedServiceTypes = [];
    @track searchProvider='';
            
    // PROVIDER FORM MODEL
    @track provider = {
        Id: null,
        Name: '',
        Service_Type__c: '',
        Service_Offerings__c: '',
        Registration_Number__c: '',
        Phone__c: '',
        ABN__c: '',
        Contact_Email__c: '',
        Status__c: 'Active',
        Current_Capacity__c: '',
         Industry_Type__c: 'NDIS', 
        street: '',
        city: '',
        province: '',
        postalcode: '',
        country: ''
    };

    //Sai Eswar
    @track toggleValue;

    get isFirstPage() {
        return this.currentPage === 1;
    }
    get isLastPage() {
        return this.currentPage === this.totalPages;
    }
    get modalTitle() {
        return this.isEditMode ? 'Update Provider' : 'Create Provider';
    }
    get saveButtonLabel() {
        return this.isEditMode ? 'Update' : 'Save';
    }
    get offeringsList() {
        if (!this.selectedProvider?.serviceOfferings) return [];
        return this.selectedProvider.serviceOfferings.split(',').map(x => x.trim());
    }
    @track serviceTypeOptions = [];
    capacityOptions =[
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' }
            
    ];
    statusOptions = [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
    ];
    industryTypeOptions = [
        { label: 'NDIS', value: 'NDIS' },
        { label: 'Non NDIS', value: 'Non NDIS' }
    ];
    @track serviceOfferingSelected = {
        communityAccess: false,
        socialSkills: false,
        recreation: false,
        therapyServices: false
    };
    connectedCallback() {
        this.loadProviders();
        this.loadServiceTypes();
    }

    loadProviders() {
        console.log('=== loadProviders START ===');
        console.log('Current Page:', this.currentPage);
        console.log('Page Size:', this.pageSize);
        console.log('View Provider Id:', this.viewProviderId);
        console.log('Pending Edit Id:', this.pendingEditId);

        getProvidersPaged({
            pageSize: this.pageSize,
            pageNumber: this.currentPage,
            searchKey:this.searchProvider
        })
        .then(res => {
            console.log('getProvidersPaged response:', JSON.stringify(res));

            if (res.status === 'SUCCESS') {
                console.log('Response status SUCCESS');

                this.totalRecords = res.totalCount;
                this.totalPages = res.totalPages;

                console.log('Total Records:', this.totalRecords);
                console.log('Total Pages:', this.totalPages);

                this.providers = (res.records || []).map(p => {
                    console.log('Processing provider:', JSON.stringify(p));

                    const count =
                        (p.participantAvatars?.length || 0) +
                        (p.participantExtra || 0);

                    console.log('Participant Avatar Count:', p.participantAvatars?.length || 0);
                    console.log('Participant Extra Count:', p.participantExtra || 0);
                    console.log('Total Count:', count);

                    const providerObj = {
                        ...p,
                        count: count,
                        initials: this.getInitials(p.name),
                        hasLogo: false
                    };

                    console.log('Mapped provider object:', JSON.stringify(providerObj));

                    return providerObj;
                });

                console.log('Final providers list:', JSON.stringify(this.providers));

                this.providersLoaded = true;
                console.log('Providers Loaded set to TRUE');

                if (this.viewProviderId) {
                    console.log('Checking for viewProviderId:', this.viewProviderId);

                    const p = this.providers.find(x => x.id === this.viewProviderId);

                    if (p) {
                        console.log('Provider found for view:', JSON.stringify(p));
                        console.log('Opening provider details modal...');

                        this.openDetails({
                            target: { dataset: { id: this.viewProviderId } }
                        });
                    } else {
                        console.log('No provider found for viewProviderId');
                    }
                }

                // Edit handling
                if (this.pendingEditId) {
                    console.log('Pending Edit ID found:', this.pendingEditId);
                    console.log('Opening edit modal...');

                    this.openEdit(this.pendingEditId);

                    this.pendingEditId = null;
                    console.log('Pending Edit ID cleared');
                }

            } else {
                console.warn('Response status is not SUCCESS:', res.status);
            }

            
            console.log('=== loadProviders END SUCCESS ===');
        })
        .catch(error => {
            console.error('=== loadProviders ERROR ===');
            console.error('Error loading paged providers:', error);
            console.error('Error JSON:', JSON.stringify(error));
        });
    }

    async loadServiceTypes() {
        try {
            const types = await fetchServiceTypes();

            console.log('types:', JSON.stringify(types));
            console.log('isArray:', Array.isArray(types));

            this.serviceTypeOptions = (types || []).map(type => ({
                label: type,
                value: type
            }));

            console.log(
                'serviceTypeOptions:',
                JSON.stringify(this.serviceTypeOptions)
            );

        } catch (error) {
            console.error('=== loadServiceTypes ERROR ===');
            console.error('Error loadServiceTypes:', error);
            console.error('Error body:', JSON.stringify(error?.body));
            console.error('Error message:', error?.body?.message || error?.message);
        }
    }

    // OPEN / CLOSE MODAL
    openProviderModal() {
        this.resetForm();
        this.isEditMode = false;
        this.showProviderModal = true;
    }

    closeProviderModal() {
        console.log('==============================');
        console.log('❌ closeProviderModal() called');
        console.log('providerflag BEFORE:', this.providerflag);
        console.log('showProviderModal BEFORE:', this.showProviderModal);

        this.showProviderModal = false;
        this.providerflag = true;

        console.log('providerflag AFTER:', this.providerflag);
        console.log('showProviderModal AFTER:', this.showProviderModal);
        console.log('Dispatching close event to dashboard');

        this.dispatchEvent(new CustomEvent('close'));

        console.log('==============================');
    }

    // HANDLE FIELD INPUT
    handleChange(event) {
        const field = event.target.dataset.field;

        let value = event.detail?.value ?? event.target.value;

        // For multi-select Service Type
        if (field === 'Service_Type__c' && Array.isArray(value)) {
            this.selectedServiceTypes = value;
            this.provider[field] = value.join(';'); // Salesforce multi-picklist format
        } else {
            this.provider[field] = value;
        }
    }

    // HANDLE CHECKBOX CHANGE
    handleOfferingChange(event) {
        const selected = event.target.dataset.value;
        if (selected === 'Community Access') this.serviceOfferingSelected.communityAccess = event.target.checked;
        if (selected === 'Social Skills') this.serviceOfferingSelected.socialSkills = event.target.checked;
        if (selected === 'Recreation') this.serviceOfferingSelected.recreation = event.target.checked;
        if (selected === 'Therapy Services') this.serviceOfferingSelected.therapyServices = event.target.checked;
        const mapping = {
            communityAccess: 'Community Access',
            socialSkills: 'Social Skills',
            recreation: 'Recreation',
            therapyServices: 'Therapy Services'
        };

        this.provider.Service_Offerings__c = Object.keys(this.serviceOfferingSelected)
            .filter(key => this.serviceOfferingSelected[key])
            .map(key => mapping[key])
            .join(', ');
    }

    // ADDRESS INPUT HANDLER
    addressInputChange(event) {
        const address = event.detail;
        this.provider.street     = address.street;
        this.provider.city       = address.city;
        this.provider.province   = address.province;
        this.provider.postalcode = address.postalCode;
        this.provider.country    = "AU"; // Always Australia
    }

    openEditModal(event) {
        console.log('=== openEditModal START ===');
       

        const providerId = event.target.dataset.id;
        console.log('Provider ID from event:', providerId);

        const p = this.providers.find(x => x.id === providerId);
        console.log('Matched provider object:', JSON.stringify(p));

        if (!p) {
            console.error('Provider not found for ID:', providerId);
            return;
        }

        this.selectedServiceTypes = p.serviceType
            ? p.serviceType.split(';').map(item => item.trim())
            : [];

        // Fill provider object
        this.provider = {
            Id: p.id,
            Name: p.name,
            Service_Type__c: p.serviceType,
            Service_Offerings__c: p.serviceOfferings,
            Registration_Number__c: p.registrationNumber,
            Phone__c: p.phone,
            ABN__c: p.abn,
            Contact_Email__c: p.email,
            Status__c: p.status,
            street: p.street,
            city: p.city,
            province: p.province,
            postalcode: p.postalcode,
            country: p.country,
            Current_Capacity__c: p.capacity,
            Industry_Type__c: p.industryType
        };

        console.log('Provider object populated:', JSON.stringify(this.provider));

        this.street = p.street;
        this.city = p.city;
        this.province = p.province;
        this.postalcode = p.postalcode;
        this.country = p.country;

        console.log('Address values set:');
        console.log('Street:', this.street);
        console.log('City:', this.city);
        console.log('Province:', this.province);
        console.log('Postal Code:', this.postalcode);
        console.log('Country:', this.country);

        this.serviceOfferingSelected = {
            communityAccess: false,
            socialSkills: false,
            recreation: false,
            therapyServices: false
        };

        console.log('Initial service offering flags reset');

        if (p.serviceOfferings) {
            console.log('Raw service offerings:', p.serviceOfferings);

            let offerings = p.serviceOfferings.split(',').map(o => o.trim());
            console.log('Parsed offerings array:', JSON.stringify(offerings));

            this.serviceOfferingSelected.communityAccess =
                offerings.includes('Community Access');

            this.serviceOfferingSelected.socialSkills =
                offerings.includes('Social Skills');

            this.serviceOfferingSelected.recreation =
                offerings.includes('Recreation');

            this.serviceOfferingSelected.therapyServices =
                offerings.includes('Therapy Services');

            console.log(
                'Service offering flags:',
                JSON.stringify(this.serviceOfferingSelected)
            );
        } else {
            console.log('No service offerings found');
        }

        this.isEditMode = true;
        this.showProviderDetails = false;
        this.showProviderModal = true;
        this.showProviderDetails1 = false;

        console.log('Edit mode enabled:', this.isEditMode);
        console.log('Provider modal opened:', this.showProviderModal);
        console.log('=== openEditModal END ===');
    }

    validateProvider() {
        let missing = [];
        // REQUIRED FIELDS
        if (!this.provider.Name) missing.push('Provider Name');
        if (!this.provider.Current_Capacity__c) missing.push('Capacity');
        if (!this.provider.Service_Type__c) missing.push('Service Type');
        if (!this.provider.Phone__c) missing.push('Phone');
        if (!this.provider.Contact_Email__c) missing.push('Email');
        if (!this.provider.Industry_Type__c) missing.push('Industry Type');
        if (!this.provider.Registration_Number__c) missing.push('NDIS Provider ID');
        // Missing required fields
        if (missing.length > 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Required Fields Missing',
                    message: `Please fill: ${missing.join(', ')}`,
                    variant: 'error'
                })
            );
            return false;
        }
        // PHONE VALIDATION (AU format)
        if (!/^[0-9]{10}$/.test(this.provider.Phone__c)) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid Phone Number',
                    message: 'Enter a valid 10-digit Phone Number.',
                    variant: 'error'
                })
            );
            return false;
        }
        // EMAIL VALIDATION
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.provider.Contact_Email__c)) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid Email',
                    message: 'Enter a valid email address, such as name@email.com.',
                    variant: 'error'
                })
            );
            return false;
        }
        return true;
    }

    // SAVE PROVIDER
    saveProvider() {
        if (!this.validateProvider()) {
            return; // STOP SAVE
        }
        saveProvider({ providerData: this.provider })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: this.isEditMode ? 'Provider Updated' : 'Provider Created',
                        message: this.isEditMode ? 'Provider details updated successfully.' : 'Provider added successfully.',
                        variant: 'success'
                    })
                );

                this.closeProviderModal();
                this.loadProviders();
            })
            /* .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body?.message || 'Unknown error',
                        variant: 'error'
                    })
                );
            }); */
             .catch(error => {

            console.log('ERROR', JSON.stringify(error));

            let errorMessage = 'Unknown error';

            // ✅ CUSTOM DUPLICATE MESSAGE
            if (error.body && error.body.message && error.body.message.includes('Contact_Email__c') ) {

                errorMessage =
                    'Duplicate email found. Please use another email.';
            }
            else {

                errorMessage =
                    error.body?.message || 'Unknown error';
            }

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: errorMessage,
                    variant: 'error'
                })
            );
        });

    }

    // HELPER: INITIALS FOR AVATARS
    getInitials(name) {
        if (!name) return '';
        const parts = name.split(" ");
        return (
            (parts[0]?.charAt(0) || "") +
            (parts[1]?.charAt(0) || "")
        ).toUpperCase();
    }

    handleLogoError(event) {
        const id = event.target.dataset.id;
        this.providers = this.providers.map(p =>
            p.id === id ? { ...p, hasLogo: false } : p
        );
    }

    // RESET FORM
    resetForm() {
        this.provider = {
            Id: null,
            Name: '',
            Service_Type__c: '',
            Service_Offerings__c: '',
            Registration_Number__c: '',
            Phone__c: '',
            ABN__c: '',
            Contact_Email__c: '',
            Status__c: 'Active',
            street: '',
            city: '',
            province: '',
            postalcode: '',
            Industry_Type__c: 'NDIS', 
            country: ''

        };
        this.selectedServiceTypes = [];

        this.serviceOfferingSelected = {
            communityAccess: false,
            socialSkills: false,
            recreation: false,
            therapyServices: false
        };
    }

    handleBack() {
        if (this.viewProviderId) {
            // Opened from dashboard "View" button → fire close event to parent
            this.dispatchEvent(new CustomEvent('close'));
        } else {
            // Opened standalone → just go back to list
            this.showProviderDetails = false;
        }
    }

    openDetails(event) {
        const providerId = event.target.dataset.id;
        const p = this.providers.find(x => x.id === providerId);
        this.selectedProvider = {
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            abn: p.abn,
            capacity: p.capacity,
            Status: p.status,
            registrationNumber: p.registrationNumber,
            serviceType: p.serviceType,
            serviceOfferings: p.serviceOfferings,
            street: p.street,
            city: p.city,
            province: p.province,
            postalcode: p.postalcode,
            industryType: p.industryType,
            initials: this.getInitials(p.name),
            count: p.count
        };

        this.showProviderDetails1 = true;
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadProviders();
        }
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadProviders();
        }
    }

    handleRecordsPerPage(event) {
        this.pageSize = parseInt(event.target.value, 10);
        console.log(' this.pageSize',this.pageSize);
        this.currentPage = 1; // reset page
        this.loadProviders();
    }

    handleFirstPage() {
        if (this.currentPage !== 1) {
            this.currentPage = 1;
            this.loadProviders();
        }
    }

    handleLastPage() {
        if (this.currentPage !== this.totalPages) {
            this.currentPage = this.totalPages;
            this.loadProviders();
        }
    }

    closeProviderDetails(){
        this.showProviderDetails1 = false;
    }

    get isStatusActive() {
        return this.provider.Status__c === 'Active';
    }

    handleStatusToggle(event) {
        const isChecked = event.target.checked;

        this.provider.Status__c = isChecked ? 'Active' : 'Inactive';

        console.log('Status:', this.provider.Status__c);
    }

    handleSearchProvider(event) {
    this.searchProvider = event.target.value;
    this.loadProviders();
   }

}