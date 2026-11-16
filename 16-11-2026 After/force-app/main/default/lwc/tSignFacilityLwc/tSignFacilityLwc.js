import { LightningElement, api, track } from 'lwc';

import getFacilities
    from '@salesforce/apex/TSignFacilityDataCommunity.getFacilities';

import saveFacility
    from '@salesforce/apex/TSignFacilityDataCommunity.saveFacility';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOrg from '@salesforce/apex/TsignUserManagementController.getOrg';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

export default class TSignFacilityLwc extends LightningElement {
    @api recordId;

    @track facilities = [];
    @track totalRecords = 0;
    @track searchKey = '';

    @track currentFacility = {};

    @track editAddress = {
        street: '',
        citySuburb: '',
        provinceState: '',
        postalcode: '',
        country: ''
    };

    pageSize = 10;
    pageNumber = 1;

    isLoading = true;
    isSearching = false;
    logoUrl = `${Loading_Logo}/TLogo.png`;
    imageUrl = `${Loading_Logo}/T.png`;
    isModalOpen = false;
    modalTitle = '';
    @track buttonLabel='Create'; 
    @track market='';
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


    // Pagination options
    // Native <select> (same as NDIS) - "selected" keeps the current size shown
    get pageSizeOptions() {
        return ['10', '20', '50'].map(value => ({
            label: value,
            value,
            selected: String(this.pageSize) === value
        }));
    }

    // An empty array is still "true" in the template, so check the length
    get hasFacilities() {
        return Array.isArray(this.facilities) && this.facilities.length > 0;
    }

    // T logo spinner for every load except typing in Search
    get showPageSpinner() {
        return this.isLoading && !this.isSearching;
    }

    // Small spinner while a search runs
    get showSearchSpinner() {
        return this.isLoading && this.isSearching;
    }    

    get totalPages() {
        return Math.max(
            1,
            Math.ceil(this.totalRecords / this.pageSize)
        );
    }

    get isFirstPage() {
        return this.pageNumber <= 1;
    }

    get isLastPage() {
        return this.pageNumber >= this.totalPages;
    }
    get childAddress() {
        return {
            street: this.editAddress?.street || '',
            city: this.editAddress?.citySuburb || '',
            province: this.editAddress?.provinceState || '',
            postalCode: this.editAddress?.postalcode || '',
            country: this.editAddress?.country || 'AU'
        };
    }

    connectedCallback() {
        this.loadData();
         this.loadOrgId(); // <-- Add this
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


    // Load facilities from Apex
    loadData() {
        this.isLoading = true;

        getFacilities({
            searchKey: this.searchKey,
            pageSize: this.pageSize,
            pageNumber: this.pageNumber
        })
            .then(result => {
                const records = result.facilities || [];

                this.facilities = records.map(fac => {
                    let formattedAddress = '-';
                    let formattedDate = '-';

                    if (fac.Address__c) {
                        const addr = fac.Address__c;

                        const parts = [
                            addr.street,
                            addr.city,
                            addr.state,
                            addr.postalCode,
                            addr.country
                        ].filter(value => value);

                        formattedAddress = parts.length
                            ? parts.join(', ')
                            : '-';
                    }

                    if (fac.CreatedDate) {
                        const date = new Date(fac.CreatedDate);

                        formattedDate =
                            date.toLocaleDateString() +
                            ' ' +
                            date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                    }

                    return {
                        ...fac,
                        formattedAddress,
                        formattedDate
                    };
                });

                this.totalRecords = result.totalRecords || 0;

                // If records change, keep the current page in range.
                if (this.pageNumber > this.totalPages) {
                    this.pageNumber = this.totalPages;
                    this.loadData();
                    return;
                }
            })
            .catch(error => {
                console.error(
                    'Error loading facilities:',
                    JSON.stringify(error)
                );

                this.showToast(
                    'Error',
                    error?.body?.message ||
                        error?.message ||
                        'Unable to load facilities.',
                    'error'
                );
            })
            .finally(() => {
                this.isLoading = false;
                this.isSearching = false;
            });
    }

    // Search
    handleSearchChange(event) {
        this.searchKey = event.target.value || '';
        this.pageNumber = 1;
        this.isSearching = true;
        this.loadData();
    }

    // Change page size
    handlePageSizeChange(event) {
        // works for the native <select> (target.value) and lightning-combobox (detail.value)
        const value = (event.detail && event.detail.value) || event.target.value;
        this.pageSize = parseInt(value, 10) || 12;
        this.pageNumber = 1;
        this.loadData();
    }

    // Pagination buttons
    handlePrev() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.loadData();
        }
    }

    handleNext() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.loadData();
        }
    }

    handleFirst() {
        if (this.pageNumber > 1) {
            this.pageNumber = 1;
            this.loadData();
        }
    }

    handleLast() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber = this.totalPages;
            this.loadData();
        }
    }

    // Convert country names into Salesforce country codes
    getCountryCode(country) {
        if (!country) {
            return '';
        }

        const value = String(country).trim().toLowerCase();

        const countryMap = {
            'australia': 'AU',
            'au': 'AU',

            'india': 'IN',
            'in': 'IN',

            'united states': 'US',
            'united states of america': 'US',
            'usa': 'US',
            'us': 'US',

            'canada': 'CA',
            'ca': 'CA',

            'united kingdom': 'GB',
            'great britain': 'GB',
            'uk': 'GB',
            'gb': 'GB',

            'new zealand': 'NZ',
            'nz': 'NZ',

            'singapore': 'SG',
            'sg': 'SG',

            'ireland': 'IE',
            'ie': 'IE',

            'south africa': 'ZA',
            'za': 'ZA',

            'philippines': 'PH',
            'ph': 'PH'
        };

        // Return the mapped code, or preserve an existing code.
        return countryMap[value] || country.trim().toUpperCase();
    }

    // Reset address fields
    resetAddress() {
        this.editAddress = {
            street: '',
            citySuburb: '',
            provinceState: '',
            postalcode: '',
            country: ''
        };
    }

    // Open Create Facility modal
    @api
    handleNewFacility() {
        this.currentFacility = {
            Name: '',
            Email__c: '',Phone__c:''
        };

        this.resetAddress();

        this.modalTitle = 'Create Facility';
        this.isModalOpen = true;
         this.buttonLabel='Create';
        this.editAddress.country= this.market;
    }

    // Open Edit Facility modal
    handleEdit(event) {
        const facId = event.currentTarget.dataset.id;

        const record = this.facilities.find(
            fac => fac.Id === facId
        );

        if (!record) {
            this.showToast(
                'Error',
                'Facility record not found.',
                'error'
            );
            return;
        }

        this.currentFacility = {
            Id: record.Id,
            Name: record.Name || '',
            Email__c: record.Email__c || '',
             Phone__c: record.Phone__c || ''  
        };

        const addr = record.Address__c;

        if (addr) {
            this.editAddress = {
                street: addr.street || '',
                citySuburb: addr.city || '',
                provinceState: addr.stateCode || addr.state || '',
                postalcode: addr.postalCode || '',
                country: this.getCountryCode(
                    addr.countryCode || addr.country || ''
                )
            };
        } else {
            this.resetAddress();
        }

        this.modalTitle = 'Edit Facility';
        this.isModalOpen = true;
         this.buttonLabel='Update';
    }

    // Close modal
    handleCloseModal() {
        this.isModalOpen = false;
    }

    // Handle Facility Name and Email changes
    handleFieldChange(event) {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;

        this.currentFacility = {
            ...this.currentFacility,
            [fieldName]: fieldValue
        };
    }

    // Handle lightning-input-address changes
 /*    handleAddressChange(event) {
        console.log('Address onchange event fired');

        const detail = event.detail || {};

        console.log(
            'Address event detail:',
            JSON.stringify(detail)
        );

        this.editAddress = {
            street: detail.street || '',
            citySuburb: detail.city || '',
            provinceState: detail.province || '',
            postalcode: detail.postalCode || '',
            country: detail.country || ''
        };

        console.log(
            'Updated address:',
            JSON.stringify(this.editAddress)
        );
    } */
    handleAddressChange(event) {
        const detail = event.detail || {};

        console.log(
            'Address received from child:',
            JSON.stringify(detail)
        );

        this.editAddress = {
            street: detail.street || '',
            citySuburb: detail.city || '',
            provinceState: detail.province || '',
            postalcode: detail.postalCode || '',
            country: detail.country || ''
        };

        console.log(
            'Updated parent editAddress:',
            JSON.stringify(this.editAddress)
        );
    }
    

    // Save or update facility
    handleSave() {
        const nameInput = this.template.querySelector(
            'lightning-input[data-field="Name"]'
        );
        if (nameInput && !nameInput.reportValidity()) {
            return;
        }

        const emailInput = this.template.querySelector(
            'lightning-input[data-field="Email__c"]'
        );
        if (emailInput && !emailInput.reportValidity()) {
            return;
        }

        // Name required
        if (!this.currentFacility.Name || !this.currentFacility.Name.trim()) {
            this.showToast('Validation Error', 'Facility Name is required.', 'error');
            return;
        }

        // Email required
        if (!this.currentFacility.Email__c || !this.currentFacility.Email__c.trim()) {
            this.showToast('Validation Error', 'Contact Email is required.', 'error');
            return;
        }

        // Address required — require at minimum street, city, and country
       // ---------- Address required (province optional for SG) ----------
        const address = this.editAddress || {};
        const isSingapore = (address.country || '').toUpperCase() === 'SG';

        const addressValid =
            address.street         && address.street.trim() &&
            address.citySuburb     && address.citySuburb.trim() &&
            address.postalcode     && address.postalcode.trim() &&
            address.country        && address.country.trim() &&
            (isSingapore || (address.provinceState && address.provinceState.trim()));

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

     
        const countryCode = this.getCountryCode(
            address.country
        );

        const facToSave = {
            Id: this.currentFacility.Id || null,
             Name: this.capitalizeFirstLetter(this.currentFacility.Name),
            Email__c: this.currentFacility.Email__c || '',
             Phone__c: this.currentFacility.Phone__c || '',   

            'Address__Street__s': address.street || '',
            'Address__City__s': address.citySuburb || '',
            'Address__StateCode__s':
                address.provinceState || '',
            'Address__PostalCode__s':
                address.postalcode || '',
            'Address__CountryCode__s': countryCode
        };

        console.log(
            'Facility payload sent to Apex:',
            JSON.stringify(facToSave)
        );

        saveFacility({
            facility: facToSave,
            orgId: this.recordId
        })
            .then(() => {
                console.log(
                    'Facility saved successfully.'
                );

                this.showToast(
                    'Success',
                    'Facility saved successfully.',
                    'success'
                );

                this.isModalOpen = false;

                // Reload the current page after saving.
                this.loadData();
                this.dispatchEvent(new CustomEvent('refreshfacilitydropdown', {
                bubbles: true,
                composed: true
            }));
            })
            .catch(error => {
                console.error(
                    'Facility save error:',
                    JSON.stringify(error)
                );

                this.showToast(
                    'Error Saving Facility',
                    error?.body?.message ||
                        error?.message ||
                        'Unable to save facility.',
                    'error'
                );

                // Keep the modal open so the user can correct
                // the data after a failed save.
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    // Display toast message
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

    capitalizeFirstLetter(value) {
        if (typeof value !== 'string' || !value.trim()) {
            return value;
        }

        value = value.trim();

        return value.charAt(0).toUpperCase() + value.slice(1);
    }
}