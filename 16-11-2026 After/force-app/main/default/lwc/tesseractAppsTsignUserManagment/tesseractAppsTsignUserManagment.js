import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUserList from '@salesforce/apex/TsignUserManagementController.getUserList';
import resetPassword from '@salesforce/apex/TsignUserManagementController.resetPassword';
import getUserType from '@salesforce/apex/TsignUserManagementController.getUserType';
import updateUser from '@salesforce/apex/TsignUserManagementController.updateUser';
import getFacilities from '@salesforce/apex/TsignUserManagementController.getFacilities';
import getOrg from '@salesforce/apex/TsignUserManagementController.getOrg';
import grantModules from '@salesforce/apex/TsignUserManagementController.grantModules';
import getFacilityAccessForStaff from '@salesforce/apex/TsignFacilityAccessController.getFacilityAccessForStaff';
import updateFacilityAccess      from '@salesforce/apex/TsignFacilityAccessController.updateFacilityAccess';
import getTeamSizeDetails from '@salesforce/apex/TsignUserManagementController.getTeamSizeDetails';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export default class TesseractAppsTsignUserManagment extends NavigationMixin(LightningElement) {

    // ============ PROPERTIES ============
    @api staffPreferredName = 'Staff';
    @api facilityPreferredName = 'Facility';
    @api currentUserType = false;

    @track searchStaff = '';
    @track placeholderText = 'Search by Name, Email...';
    @track noRecordsFlag = false;
    @track allUsers = [];
    @track filteredData = [];
    @track paginatedData = [];
    @track resetPasswordModal = false;
    @track modalData = {};
    @track orgList = [];          // raw list from Apex
    @track orgDetails = null;     // first element, for convenience

    // Spinner / Loading states
    @track isLoading = false;
    logoUrl = `${Loading_Logo}/TLogo.png`;
    imageUrl = `${Loading_Logo}/T.png`;    
    @track isResettingPassword = false;

    // Sorting
    @track sortField = '';
    @track sortDirection = 'asc';
    @track sortIcons = {
        nickName: '',
        staffGender: '',
        staffFacility: '',
        userEmail: '',
        userStatus: '',
        createdDate: '',
        userPhone: ''
    };

    // Pagination
    @track pageNumber = 1;
    @track pageSize = 10;
    @track totalRecords = 0;
    @track totalPages = 1;
    @track bDisableFirst = true;
    @track bDisableLast = false;
    @track pageSizeOptions = [
        { label: '5', value: '5', selected: false },
        { label: '10', value: '10', selected: true },
        { label: '25', value: '25', selected: false },
        { label: '50', value: '50', selected: false },
        { label: '100', value: '100', selected: false }
    ];

    // Edit panel
    @track editButtonModule = false;
    @track usertypename = '';
    @track isUserTypeDisabled = false;
    @track editingStaffId = '';
    @track userType;
    @track filteredUserTypeValues = [];

    @track formData = {
        user: { FirstName: '', LastName: '', Username: '', Phone: '' },
        staff: { Status__c: false }
    };

    @track sectionFlags = {
        staffDetails1: true
    };

    @track sectionIcons = {
        staffDetails1: 'utility:chevrondown'
    };
    @track Facilityname = '';
    @track filteredFacilityValues = [];

    // Address (bound to <lightning-input-address>)
    @track street = '';
    @track city = '';
    @track province = '';
    @track postalcode = '';
    @track country = '';

    // ============ GRANT ACCESS MODAL ============
    @track grantAccessModal = false;
    @track modulesChecked = [];

    @track isFileAttached = false;
    @track isFileExpand = false;
    @track isattachError = false;
    @track uploadedFile = null;
    @track ProfilefileName = '';
    @track successmessage = '';
    profilePicUrl  = null;        // NEW — bound to <img src>
    profilePicSize = null;        // NEW — number (bytes)
    profilePicKey  = null;        // NEW — S3 key
    oldFileKey     = null;
    profilePicJSON =null;

    // ===== Facility Access modal =====
    @track facilityAccessModal = false;
    @track facilityOptions     = [];      // [{ id, name, checked }]
    @track isFacilityLoading   = false;
    @track isSavingFacility    = false;
    @track facilityModalStaffId = '';
    @track activeUserCount = 0;
    @track teamSizeLimit = 0;


    // When the org's Account_Type__c === 'Organisation' → show 'My Organisation'
    moduleMapOrgAccount = {
        'T Sign Org Admin': ['T sign', 'Folders', 'My Organisation', 'My Profile', 'Templates', 'Contact', 'Reports'],
        'T Sign Manager':   ['T sign', 'Folders', 'My Profile', 'Templates', 'Contact', 'Reports'],
        'T Sign Staff':     ['T sign', 'Folders', 'My Profile', 'Templates', 'Contact', 'Reports']
    };

    // Any other Account_Type__c → show 'My Profile'
    moduleMapOtherAccount = {
        'T Sign Org Admin': ['T sign', 'Folders', 'My Profile', 'Templates', 'Contact', 'Reports'],
        'T Sign Manager':   ['T sign', 'Folders', 'My Profile', 'Templates', 'Contact', 'Reports'],
        'T Sign Staff':     ['T sign', 'Folders', 'My Profile', 'Templates', 'Contact', 'Reports']
    };

    // ============ LIFECYCLE ============
    connectedCallback() {
        // Sensible default so the combobox isn't empty on first render
        console.log('User management lwc called');
        this.filteredUserTypeValues = [
            { label: 'T Sign Staff', value: 'T Sign Staff' }
        ];
        this.loadUsers();
        this.loadUserTypeOptions();
        this.loadFacilityOptions();
        this.loadOrg();
         this.fetchTeamSizeData();
    }

     async fetchTeamSizeData() {
        try {
            const result = await getTeamSizeDetails();
            this.activeUserCount = result.activeCount || 0;
            this.teamSizeLimit = result.teamSizeLimit || 0;
        } catch (error) {
            console.error('Error fetching team size:', error);
        }
    }
    get teamSizeBadgeClass() {
        return this.activeUserCount >= this.teamSizeLimit 
            ? 'slds-badge slds-theme_error'   // Red when full
            : 'slds-badge slds-theme_warning'; // Yellow when nearing full
    }

    get hasFacilityOptions() {
        return Array.isArray(this.facilityOptions) && this.facilityOptions.length > 0;
    }

    // =========================================================
    //  APEX CALL — getOrg (imperative)
    // =========================================================
    loadOrg() {
        // this.isLoading = true;

        getOrg()
            .then((result) => {
                console.log('[loadOrg] raw result:', JSON.stringify(result));

                this.orgList = result || [];
                this.orgDetails = this.orgList.length > 0 ? this.orgList[0] : null;

                if (this.orgDetails) {
                    console.log('[loadOrg] Org Name       :', this.orgDetails.Name);
                    console.log('[loadOrg] Account Type   :', this.orgDetails.Account_Type__c);
                    console.log('[loadOrg] Org Id         :', this.orgDetails.Id);
                } else {
                    console.warn('[loadOrg] No organisation returned for current user.');
                }
            })
            .catch((error) => {
                console.error('[loadOrg] error:', error);
                console.error('[loadOrg] error.body:', JSON.stringify(error?.body));
                this.handleError(error);
            });
    }

    // =========================================================
    //  APEX CALL — getFacilities
    // =========================================================
    async loadFacilityOptions() {
        // this.isLoading = true;
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
        // getFacilities() should return [{label, value}] where value is the Facility Id
        this.filteredFacilityValues = this.facilities || [];
    }

    async loadUserTypeOptions() {
        try {
            this.userType = await getUserType();
            this.buildFilteredUserTypeValues();
        } catch (error) {
            this.handleError(error);
        }
    }

    buildFilteredUserTypeValues() {
        const ALL_OPTIONS = [
            { label: 'Org Admin', value: 'T Sign Org Admin' },
            { label: 'Manager',   value: 'T Sign Manager'   }
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

    // ============ DATA LOADING ============
    loadUsers() {
        this.isLoading = true;
      
        getUserList({ searchKey: null })
            .then(result => {
                this.processUsers(result);
            })
            .catch(error => {
                this.handleError(error);
                this.noRecordsFlag = true;
                this.paginatedData = [];
                this.totalRecords = 0;
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

        processUsers(users) {
            const storedFacilityId = localStorage.getItem('defaultFacilityId');
            console.log('Dashboard Facility value=>' + storedFacilityId);

            // ---- Step 1: Facility filter (non T-Sign Org Admins only) ----
            const filteredUsers = (users || []).filter(user => {
                // T Sign Org Admin sees all users regardless of facility
                if (user.userType === 'T Sign Org Admin') {
                    return true;
                }

                // If no facility selected in localStorage → don't filter
                if (!storedFacilityId) {
                    return true;
                }

                // Otherwise user must belong to the selected facility
                const facilityIds = user.facilityIds || [];
                return facilityIds.includes(storedFacilityId);
            });

            console.log(
                `User filter → ${filteredUsers.length} of ${(users || []).length} retained for facility ${storedFacilityId}`
            );

        this.allUsers = filteredUsers.map(user => {
            const first = (user.firstName || '').trim();
            const last  = (user.lastName  || '').trim();

            let initials = '';
            if (first || last) {
                initials = (first ? first[0] : '') + (last ? last[0] : '');
            } else {
                initials = (user.nickName || '')
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(s => s[0])
                    .join('');
            }

            return {
                ...user,
                statusClass: user.isActive
                    ? 'ta-badge ta-badge-success'
                    : 'ta-badge ta-badge-error',
                isFacilityAccess: user.isFacilityAccess || false,
                isActive: user.isActive !== undefined ? user.isActive : true,
                initials: initials.toUpperCase(),
                canManageFacility:  user.userType ===( 'T Sign Manager' || 'T Sign Staff')
            };
        });

        this.applyFilterAndPagination();
    }

    // ============ SEARCH ============
    handleSearchStaffInput(event) {
        this.searchStaff = event.target.value;
        this.pageNumber = 1;
        this.applyFilterAndPagination();
    }

    applyFilterAndPagination() {
        const searchKey = (this.searchStaff || '').trim().toLowerCase();

        if (searchKey) {
            this.filteredData = this.allUsers.filter(user => {
                return (
                    (user.nickName || '').toLowerCase().includes(searchKey) ||
                    (user.userEmail || '').toLowerCase().includes(searchKey) ||
                    (user.staffFacility || '').toLowerCase().includes(searchKey) ||
                    (user.userType || '').toLowerCase().includes(searchKey) ||
                    (user.userStatus || '').toLowerCase().includes(searchKey) ||
                    (user.staffGender || '').toLowerCase().includes(searchKey)
                );
            });
        } else {
            this.filteredData = [...this.allUsers];
        }

        if (this.sortField) {
            this.sortData();
        }

        this.totalRecords = this.filteredData.length;
        this.noRecordsFlag = this.totalRecords === 0;

        if (!this.noRecordsFlag) {
            this.calculatePagination();
            this.updatePaginatedData();
        } else {
            this.paginatedData = [];
            this.totalPages = 1;
            this.pageNumber = 1;
        }
    }

    // ============ SORTING ============
    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        if (!field) return;

        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.updateSortIcons();
        this.sortData();
        this.pageNumber = 1;
        this.updatePaginatedData();
    }

    updateSortIcons() {
        const newIcons = {};
        Object.keys(this.sortIcons).forEach(key => {
            newIcons[key] = key === this.sortField
                ? (this.sortDirection === 'asc' ? 'asc' : 'desc')
                : '';
        });
        this.sortIcons = newIcons;

        setTimeout(() => {
            const arrows = this.template.querySelectorAll('.sort-arrow');
            arrows.forEach(arrow => {
                const field = arrow.dataset.arrow;
                arrow.classList.remove('asc', 'desc');
                if (field === this.sortField) {
                    arrow.classList.add(this.sortDirection);
                }
            });
        }, 0);
    }

    sortData() {
        const field = this.sortField;
        const dir = this.sortDirection === 'asc' ? 1 : -1;

        this.filteredData.sort((a, b) => {
            const valA = (a[field] || '').toString().toLowerCase();
            const valB = (b[field] || '').toString().toLowerCase();
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
        });
    }

    // ============ PAGINATION ============
    calculatePagination() {
        this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
        if (this.pageNumber > this.totalPages) {
            this.pageNumber = this.totalPages;
        }
    }

    updatePaginatedData() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.paginatedData = this.filteredData.slice(start, end);
        this.updatePaginationButtons();
    }

    updatePaginationButtons() {
        this.bDisableFirst = this.pageNumber === 1;
        this.bDisableLast = this.pageNumber === this.totalPages;
    }

    handleRecordsPerPage(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.calculatePagination();
        this.updatePaginatedData();
    }

    firstPage() {
        this.pageNumber = 1;
        this.updatePaginatedData();
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updatePaginatedData();
        }
    }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updatePaginatedData();
        }
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.updatePaginatedData();
    }

    // ============ ROW ACTIONS ============

    // -------- GRANT ACCESS --------
    showGrantAccess(event) {
        const userId = event.currentTarget.dataset.id;
        console.log('[showGrantAccess] userId:', userId);

        // 1. Find the clicked user
        const user = this.allUsers.find(u => u.userId === userId);
        if (!user) {
            this.handleError({ message: 'User record not found.' });
            return;
        }

        // 2. Read User Type + Org Account Type
        const userType = user.userType;
        const accountType = this.orgDetails ? this.orgDetails.Account_Type__c : null;
        const isOrganisationAccount = accountType === 'Organisation';

        console.log('[showGrantAccess] userType    :', userType);
        console.log('[showGrantAccess] accountType :', accountType);
        console.log('[showGrantAccess] moduleAccess:', user.moduleAccess);

        // 3. Pick the correct module map
        const map = isOrganisationAccount
            ? this.moduleMapOrgAccount
            : this.moduleMapOtherAccount;
        const allModules = map[userType] || [];

        // 4. Parse staff.Module_Access__c into a Set
        const granted = this.parseModuleAccess(user.moduleAccess);
        console.log('[showGrantAccess] granted set:', [...granted]);

        // 5. Pre-check modules the staff already has
        this.modulesChecked = allModules.map(name => ({
            name,
            checked: granted.has(name)
        }));

        // 6. Store modal data (staffId needed for save)
        this.modalData = {
            userId,
            staffId: user.staffId,
            userType,
            accountType
        };

        console.log('[showGrantAccess] modalData      :', JSON.stringify(this.modalData));
        console.log('[showGrantAccess] modulesChecked :', JSON.stringify(this.modulesChecked));

        this.grantAccessModal = true;
    }

    // Helper — normalizes both text and multi-select picklist formats
    parseModuleAccess(raw) {
        const set = new Set();
        if (!raw) return set;

        // Multi-select: ";A;B;C;"   → Text: "A;B;C"
        const parts = raw.split(/[;,]/);
        for (const p of parts) {
            const cleaned = (p || '').trim();
            if (cleaned) set.add(cleaned);
        }
        return set;
    }

  /*   facilityGrantAccess(event) {
        const userId = event.currentTarget.dataset.id;
        const userRole = event.currentTarget.dataset.userrole;
        const userType = event.currentTarget.dataset.usertype;
        console.log('Facility Access for:', { userId, userRole, userType });
        this.dispatchEvent(new ShowToastEvent({
            title: 'Facility Access',
            message: `Grant facility access for user ${userId}`,
            variant: 'info'
        }));
    } */

    facilityGrantAccess(event) {
        const staffId = event.currentTarget.dataset.id;   // we now pass staffId

        if (!staffId) {
            this.handleError({ message: 'Staff record not found.' });
            return;
        }

        this.facilityModalStaffId = staffId;
        this.facilityAccessModal  = true;
        this.facilityOptions      = [];
        this.isFacilityLoading    = true;

        getFacilityAccessForStaff({ staffId })
            .then(result => {
                this.facilityOptions = (result || []).map(f => ({
                    id: f.id,
                    name: f.name,
                    checked: f.checked === true
                }));
                console.log('[facilityGrantAccess] options loaded:', this.facilityOptions.length);
            })
            .catch(error => {
                this.handleError(error);
                this.facilityAccessModal = false;
            })
            .finally(() => {
                this.isFacilityLoading = false;
            });
    }

    handleFacilityCheckboxChange(event) {
        const id = event.target.name;              // name = facility Id
        const checked = event.target.checked;

        this.facilityOptions = this.facilityOptions.map(f =>
            f.id === id ? { ...f, checked } : f
        );
    }

    handleCloseFacilityModal() {
        this.facilityAccessModal = false;
        this.facilityOptions = [];
        this.facilityModalStaffId = '';
        this.isFacilityLoading = false;
        this.isSavingFacility  = false;
    }

    handleSaveFacilityAccess() {
        const staffId = this.facilityModalStaffId;
        if (!staffId) {
            this.handleError({ message: 'Staff record not found.' });
            return;
        }

        const facilityIds = this.facilityOptions
            .filter(f => f.checked)
            .map(f => f.id);

        console.log('[handleSaveFacilityAccess] staffId:', staffId);
        console.log('[handleSaveFacilityAccess] selected facilityIds:', facilityIds);

        this.isSavingFacility = true;

        updateFacilityAccess({ request: { staffId, facilityIds } })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: `${this.facilityPreferredName || 'Facility'} access updated`,
                    variant: 'success'
                }));
                this.handleCloseFacilityModal();
                this.loadUsers();   // refresh so isFacilityAccess recalculates
            })
            .catch(error => {
                this.handleError(error);
            })
            .finally(() => {
                this.isSavingFacility = false;
            });
    }

    // -------- GRANT ACCESS MODAL HANDLERS --------
    handleCheckboxChange(event) {
        const name = event.target.name;
        const checked = event.target.checked;

        this.modulesChecked = this.modulesChecked.map(m =>
            m.name === name ? { ...m, checked } : m
        );

        console.log('[handleCheckboxChange]', JSON.stringify(this.modulesChecked));
    }

    handleCloseModal() {
        this.grantAccessModal = false;
        this.modalData = {};
        this.modulesChecked = [];
    }

    handleConfirmReset() {
        const selected = this.modulesChecked
            .filter(m => m.checked)
            .map(m => m.name);

        const staffId = this.modalData.staffId;
        console.log('[handleConfirmReset] staffId :', staffId);
        console.log('[handleConfirmReset] userType:', this.modalData.userType);
        console.log('[handleConfirmReset] selected:', selected);

        if (!staffId) {
            this.handleError({ message: 'Staff record not found for update.' });
            return;
        }

        this.isLoading = true;

        grantModules({ staffId, modules: selected })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: `Modules updated for ${this.modalData.userType || 'user'}`,
                    variant: 'success'
                }));

                this.handleCloseModal();
                this.loadUsers();     // refresh so moduleAccess stays in sync
            })
            .catch(error => {
                this.handleError(error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    // -------- RESET PASSWORD MODAL --------
    resetpasswordlink(event) {
        const userId = event.currentTarget.dataset.id;
        const user = this.allUsers.find(u => u.userId === userId);
        this.modalData = {
            userId: userId,
            userEmail: user ? user.userEmail : ''
        };
        this.resetPasswordModal = true;
    }

    get userEmail() {
        return this.modalData?.userEmail || '';
    }

    handleCloseresetPasswordModal() {
        this.resetPasswordModal = false;
        this.modalData = {};
    }

    handleConfirmResetPassword() {
        const userId = this.modalData.userId;
        if (!userId) return;

        this.isResettingPassword = true;

        resetPassword({ userId })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Password reset email sent',
                    variant: 'success'
                }));
                this.resetPasswordModal = false;
                this.modalData = {};
            })
            .catch(error => {
                this.handleError(error);
            })
            .finally(() => {
                this.isResettingPassword = false;
            });
    }

    // ============ EDIT PANEL ============
    handleActionClick(event) {
        const staffId = event.currentTarget.dataset.id;
        const user = this.allUsers.find(u => u.staffId === staffId);

        if (!user) {
            this.handleError({ message: 'User record not found.' });
            return;
        }

        // Remember which staff is being edited (used on save)
        this.editingStaffId = staffId;

        // ---------- Basic user/staff form data ----------
        this.formData = {
            user: {
                FirstName: user.firstName || '',
                LastName:  user.lastName  || '',
                Username:  user.username  || '',
                Phone:     user.userPhone || ''
            },
            staff: {
                Status__c: user.isActive || false
            }
        };

        // ---------- User Type ----------
        this.usertypename = user.userType || '';

        // Ensure the current value is present in the option list
        const opts = [...this.filteredUserTypeValues];
        if (this.usertypename && !opts.some(o => o.value === this.usertypename)) {
            opts.push({ label: this.usertypename, value: this.usertypename });
        }
        this.filteredUserTypeValues = opts;

        // Disable User Type field when target is above caller's level
        const level = { 'T Sign Org Admin': 3, 'T Sign Manager': 2, 'T Sign Staff': 1 };
        this.isUserTypeDisabled =
            (level[this.usertypename] || 0) > (level[this.userType] || 0);

        // ---------- Facility ----------
        const currentFacilityId = user.facilityId || '';

        const facilityOpts = [...(this.filteredFacilityValues || [])];
        if (currentFacilityId && !facilityOpts.some(o => o.value === currentFacilityId)) {
            facilityOpts.push({
                label: user.facilityName || currentFacilityId,
                value: currentFacilityId
            });
            this.filteredFacilityValues = facilityOpts;
        }

        // Ensure Facilityname is always a string, never undefined
        this.Facilityname = currentFacilityId || '';

        console.log('[handleActionClick] facility prefill:', {
            currentFacilityId,
            facilityName: user.facilityName,
            Facilityname: this.Facilityname,
            optionCount: this.filteredFacilityValues?.length
        });

        // ---------- Address ----------
        this.street     = user.street     || '';
        this.city       = user.city       || '';
        this.province   = user.province   || '';
        this.postalcode = user.postalcode || '';
        this.country    = user.country    || '';

        console.log('[handleActionClick] address prefill:', {
            street:     this.street,
            city:       this.city,
            province:   this.province,
            postalcode: this.postalcode,
            country:    this.country
        });

        // ---------- Profile pic preload ----------
        this.profilePicUrl    = user.profilePicUrl    || null;
        this.profilePicSize   = user.profilePicSize   || null;
        this.profilePicKey    = user.profilePicKey    || null;
        this.ProfilefileName  = user.ProfilefileName  || '';
        this.isFileAttached   = !!user.profilePicUrl;
        this.isFileExpand     = false;   // important: force remount next upload
        this.oldFileKey = user.profilePicKey || null;
        this.profilePicJSON = user.profilePicJson ;

        console.log('[handleActionClick] profile pic prefill:', {
            url:  this.profilePicUrl,
            size: this.profilePicSize,
            key:  this.profilePicKey,
            name: this.ProfilefileName
        });

        // ---------- Panel state ----------
        this.sectionFlags = { staffDetails1: true };
        this.sectionIcons = { staffDetails1: 'utility:chevrondown' };
        this.editButtonModule = true;

        // Notify parent (optional)
        this.dispatchEvent(new CustomEvent('edituser', {
            detail: { staffId },
            bubbles: true,
            composed: true
        }));
    }

    handleUserFirstNameChange(event) {
        this.formData = {
            ...this.formData,
            user: { ...this.formData.user, FirstName: event.target.value }
        };
    }

    handleUserLastNameChange(event) {
        this.formData = {
            ...this.formData,
            user: { ...this.formData.user, LastName: event.target.value }
        };
    }

    // Phone Number change handler
    handleUserPhoneChange(event) {
        this.formData = {
            ...this.formData,
            user: { ...this.formData.user, Phone: event.target.value }
        };
        console.log('[handleUserPhoneChange] Phone =', this.formData.user.Phone);
    }

    handleUserStatusChange(event) {
        this.formData = {
            ...this.formData,
            staff: { ...this.formData.staff, Status__c: event.target.checked }
        };
    }

    handleUserTypeChange(event) {
        this.usertypename = event.detail.value;
    }

    get childAddress() {
        return {
            street: this.street || '',
            city: this.city || '',
            province: this.province || '',
            postalCode: this.postalcode || '',
            country: this.country || ''
        };
    }

    // Address change handler (single event delivers all 5 parts)
    addressInputChange(event) {
        const d = event.detail || {};
        this.street     = d.street     || '';
        this.city       = d.city       || '';
        this.province   = d.province   || '';
        this.postalcode = d.postalCode || '';
        this.country    = d.country    || '';

        console.log('[addressInputChange]', {
            street:     this.street,
            city:       this.city,
            province:   this.province,
            postalcode: this.postalcode,
            country:    this.country
        });
    }

    handleSectionToggle(event) {
        const section = event.currentTarget.dataset.id;
        const isOpen = !this.sectionFlags[section];
        this.sectionFlags = { ...this.sectionFlags, [section]: isOpen };
        this.sectionIcons = {
            ...this.sectionIcons,
            [section]: isOpen ? 'utility:chevrondown' : 'utility:chevronright'
        };
    }

    handleClose() {
        this.editButtonModule = false;
        this.editingStaffId = '';
        this.Facilityname = '';
        this.formData = {
            user: { FirstName: '', LastName: '', Username: '', Phone: '' },
            staff: { Status__c: false }
        };
        this.usertypename = '';
        this.isUserTypeDisabled = false;

        // Reset address
        this.street = '';
        this.city = '';
        this.province = '';
        this.postalcode = '';
        this.country = '';

        this.profilePicUrl   = null;
        this.profilePicSize  = null;
        this.profilePicKey   = null;
        this.ProfilefileName = '';
        this.isFileAttached  = false;
        this.isFileExpand    = false;
       this.profilePicJSON  = null; // <-- NEW
    }

    handlesavebutton() {
        console.log('=== [handlesavebutton] START ===');

       

        // ---------- 3b. Validation: First Name required ----------
        const fnInput = this.template.querySelector('lightning-input[name="FirstName"]');
        if (fnInput) {
            fnInput.reportValidity();
            if (!fnInput.checkValidity()) {
                return;
            }
        }
        if (!this.formData?.user?.FirstName || !this.formData.user.FirstName.trim()) {
            this.handleError({ message: 'First Name is required.' });
            return;
        }

        // ---------- 3c. Validation: Last Name required ----------
        const lnInput = this.template.querySelector('lightning-input[name="LastName"]');
        if (lnInput) {
            lnInput.reportValidity();
            if (!lnInput.checkValidity()) {
                return;
            }
        }
        if (!this.formData?.user?.LastName || !this.formData.user.LastName.trim()) {
            this.handleError({ message: 'Last Name is required.' });
            return;
        }

        // ---------- 3d. Validation: Phone required ----------
        const phoneInput = this.template.querySelector('lightning-input[name="PhoneNumber"]');
        if (phoneInput) {
            phoneInput.reportValidity();
            if (!phoneInput.checkValidity()) {
                return;
            }
        }
        if (!this.formData?.user?.Phone || !this.formData.user.Phone.trim()) {
            this.handleError({ message: 'Phone Number is required.' });
            return;
        }

        // ---------- 3e. Validation: Address required ----------
                // ---------- Address required (province optional for SG) ----------
            const address = {
                street:     this.street     || '',
                city:       this.city       || '',
                province:   this.province   || '',
                postalCode: this.postalcode || '',
                country:    this.country    || ''
            };

            const isSingapore = address.country.toUpperCase() === 'SG';

            const addressValid =
                address.street.trim() &&
                address.city.trim() &&
                address.postalCode.trim() &&
                address.country.trim() &&
                (isSingapore || address.province.trim());   // province optional for SG

            if (!addressValid) {
                this.handleError({
                    message: isSingapore
                        ? 'Street, City, Postal Code and Country are required.'
                        : 'A complete Address (street, city, state, postal code, country) is required.'
                });
                return;
            }

        // ---------- 1. Snapshot current state ----------
        console.log('[handlesavebutton] editingStaffId  :', this.editingStaffId);
        console.log('[handlesavebutton] usertypename    :', this.usertypename);
        console.log('[handlesavebutton] Facilityname    :', this.Facilityname);
        console.log('[handlesavebutton] formData        :', JSON.stringify(this.formData));
        console.log('[handlesavebutton] isUserTypeDisabled:', this.isUserTypeDisabled);
        console.log('[handlesavebutton] address         :', { 
            street:     this.street,
            city:       this.city,
            province:   this.province,
            postalcode: this.postalcode,
            country:    this.country
        });

        // ---------- 2. Validation: staff selected ----------
        if (!this.editingStaffId) {
            console.warn('[handlesavebutton] Validation failed: no editingStaffId');
            this.handleError({ message: 'No user selected for update.' });
            return;
        }

        // ---------- 3. Validation: user type required ----------
        if (!this.usertypename) {
            console.warn('[handlesavebutton] Validation failed: usertypename is empty');
            this.handleError({ message: 'User Type is required.' });
            return;
        }

        // ---------- 4. Build payload ----------
        const payload = {
            staffId:    this.editingStaffId,
            firstName:  this.formData.user.FirstName,
            lastName:   this.formData.user.LastName,
            phone:      this.formData.user.Phone || '',
            isActive:   this.formData.staff.Status__c,
            userType:   this.usertypename,
            facilityId: this.Facilityname,
            street:     this.street     || '',
            city:       this.city       || '',
            province:   this.province   || '',
            postalcode: this.postalcode || '',
            country:    this.country    || '',
            profilePicKey : this.profilePicKey || '',
            profilePicSize : this.profilePicSize || '',
            profilePicUrl : this.profilePicUrl || '',
            ProfilefileName :this.ProfilefileName || '',
            profilePicJson : this.profilePicJSON || null // <-- NEW
        };

        console.log('[handlesavebutton] Payload being sent to Apex:', JSON.stringify(payload));

        if (!payload.facilityId) {
            console.warn('[handlesavebutton] facilityId is empty — no facility will be linked.');
        }
        if (!payload.phone) {
            console.warn('[handlesavebutton] phone is empty.');
        }

        // ---------- 5. Set loading ----------
        this.isLoading = true;
        console.log('[handlesavebutton] isLoading set to true, calling updateUser...');

        const startTime = Date.now();

        // ---------- 6. Apex call ----------
        updateUser({ request: payload })
            .then((result) => {
                console.log('[handlesavebutton] SUCCESS — response:', result);
                console.log(`[handlesavebutton] Apex round-trip took ${Date.now() - startTime}ms`);

                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'User details submitted successfully. Changes will reflect within 5 to 10 minutes',
                    variant: 'success'
                }));

                console.log('[handlesavebutton] Closing edit panel and reloading users...');
                this.handleClose();
                this.loadUsers();
            })
            .catch((error) => {
                console.error('[handlesavebutton] FAILURE — full error object:', error);
                console.error('[handlesavebutton] error.status :', error?.status);
                console.error('[handlesavebutton] error.statusText:', error?.statusText);
                console.error('[handlesavebutton] error.body :', JSON.stringify(error?.body));
                console.error('[handlesavebutton] error.body.message :', error?.body?.message);
                console.error('[handlesavebutton] error.body.stackTrace:', error?.body?.stackTrace);
                console.error(`[handlesavebutton] Apex failed after ${Date.now() - startTime}ms`);

                this.handleError(error);
            })
            .finally(() => {
                console.log('[handlesavebutton] finally block — resetting isLoading to false');
                this.isLoading = false;
                console.log('=== [handlesavebutton] END ===');
                /* if (this.oldFileKey && this.oldFileKey !== this.profilePicKey) {
                    console.log('[UPLOAD-COMPLETE] deleting old AWS file:', this.oldFileKey);
                    this.deleteOldFileFromAWS(this.oldFileKey).then(() => {
                        this.oldFileKey = null;   // prevent double-delete
                    });
                } */
            });
    }

    // ============ HELPERS ============
    handleError(error) {
        console.error('Error:', error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: error?.body?.message || error?.message || 'Something went wrong',
            variant: 'error'
        }));
    }

    // Coerce cleared combobox value to '' so payload never sends undefined
    handleFacilityChange(event) {
        this.Facilityname = event.detail.value || '';
        console.log('[handleFacilityChange] Facilityname =', this.Facilityname);
    }

   /*  handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('[DRAG] handleDragOver fired');
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        const dropped = Array.from(event.dataTransfer.files || []);
        console.log('[DROP] files dropped:', dropped.length, dropped.map(f => f.name));
        this.acceptFiles(dropped);
    }

    handleFileSelect(event) {
        const selected = Array.from(event.target.files || []);
        console.log('[SELECT] files selected:', selected.length, selected.map(f => f.name));
        this.acceptFiles(selected);
    }

    triggerFileInput() {
        console.log('[CLICK] triggerFileInput fired');
        const input = this.template.querySelector('input[type="file"]');
        if (input) {
            input.value = '';
            input.click();
        } else {
            console.warn('[CLICK] file input not found');
        }
    }

    acceptFiles(files) {
        console.log('[ACCEPT] acceptFiles called with', files.length, 'file(s)');
        this.isLoading=true;
        if (!files.length) {
            console.log('[ACCEPT] no files, returning');
              this.isLoading=false;
            return;
        }

        if (files.length > 1) {
            console.log('[ACCEPT] more than one file, rejecting');
            this.showToast('Only one file allowed');
                this.isLoading=false;
            return;
        }

        const file = files[0];
        console.log('[ACCEPT] file:', file.name, 'size:', file.size);

        if (file.size > MAX_FILE_BYTES) {
            console.log('[ACCEPT] file too big, rejecting');
            this.isattachError = true;
                this.isLoading=false;
            this.showToast('File size cannot exceed 50 MB');
            return;
        }
        this.isattachError = false;

        const pass = () => {
            console.log('[PASS] entering pass, setting isFileExpand = true');
            this.isFileExpand = true;

            setTimeout(() => {
                console.log('[PASS-TIMEOUT] 500ms elapsed, looking for child');
                const svc = this.template.querySelector('c-document-office-service');

                if (!svc) {
                    console.warn('[PASS-TIMEOUT] ⚠️ document-office-service not found');
                        this.isLoading=false;
                    return;
                }

                console.log('[PASS-TIMEOUT] child found, assigning incomingFiles and confirmUpload');
                svc.incomingFiles = [file];
                svc.confirmUpload = true;
                console.log('[PASS-TIMEOUT] done');
            }, 500);
        };

        if (this.isFileExpand) {
            console.log('[ACCEPT] child already expanded → remounting');
            this.isFileExpand = false;
            this.uploadedFile = null;
            this.isFileAttached = false;
            setTimeout(() => {
                console.log('[REMOUNT] 100ms elapsed, calling pass');
                pass();
            }, 100);
            return;
        }

        console.log('[ACCEPT] first mount → calling pass directly');
        pass();
    }
 */
  /*  async handleAwsUploadComplete(event) {
        console.log('[UPLOAD-COMPLETE] event received', event.detail);
        const files = event.detail.files || [];

        if (!files.length) {
            console.log('[UPLOAD-COMPLETE] no files in detail, returning');
                this.isLoading=false; 
            return;
        }

        this.uploadedFile = files[0];
        this.ProfilefileName = this.uploadedFile.originalName;
        this.isFileAttached = true;
        this.profilePicUrl  = this.uploadedFile.url  || null;
        this.profilePicSize =  String(this.uploadedFile.size);
        this.profilePicKey  = this.uploadedFile.key  || null;
        this.isLoading=false;
        this.profilePicSize = this.uploadedFile.size != null ? String(this.uploadedFile.size): '';
       


        console.log('[UPLOAD-COMPLETE] ProfilefileName:', this.ProfilefileName, '| isFileAttached:', this.isFileAttached);
    } */

    handleUplodadProfilePic(event) {
            console.log('Profile Pic Upload Success', JSON.stringify(event.detail));
            
            const files = event.detail.files || [];
            if (!files.length) {
                this.isLoading = false;
                return;
            }

            const file = files[0];

            // 1. Store the AWS details
            this.profilePicUrl = file.url; 
            this.profilePicKey = file.key; 
            this.profilePicSize = file.size != null ? String(file.size) : '';
            
            // Extract the file name from the key (e.g., "1793610737696_images.jfif")
            this.ProfilefileName = file.key ? file.key.split('/').pop() : '';

            // 2. Stringify the entire file object for the new JSON field
            this.profilePicJSON = JSON.stringify(file);

            this.isLoading = false;
        }
    handleFileDeleted() {
        this.uploadedFile = null;
        this.ProfilefileName = '';
        this.isFileAttached = false;
        this.isFileExpand = false;
        this.profilePicUrl  = null;
        this.profilePicSize = null;
        this.profilePicKey  = null;
    }
     handleRemovePic() {
        console.log('[REMOVE-PIC] removing profile pic');
        this.handleFileDeleted();
    }

    handleImgError() {
        console.warn('[IMG] profile image failed to load, falling back to null');
        this.profilePicUrl = null;
    }

    // Table row photo failed to load: hide it so the initials underneath show
    handleRowImgError(event) {
        event.target.classList.add('profile-thumb_broken');
    }
      showToast(message, variant = 'error', title) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title || (variant === 'success' ? 'Success' : 'Error'),
                message,
                variant
            })
        );
    }

    /* async deleteOldFileFromAWS(key) {
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
} */

    get displayUserType() {
        if (this.modalData?.userType === 'T Sign Org Admin') {
            return 'Org admin';
        } else if (this.modalData?.userType === 'T Sign Manager') {
            return 'Manager';
        }

        return this.modalData?.userType || '';
    }
}