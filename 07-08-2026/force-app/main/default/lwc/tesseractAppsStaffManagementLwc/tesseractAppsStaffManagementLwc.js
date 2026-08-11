import { LightningElement, wire, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getstaffAccessDetails from '@salesforce/apex/UserAccessController.getStaffAccessDetails';
import getselectedStaffDetails from '@salesforce/apex/UserAccessController.getSelectedStaffDetails';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import saveStaffDetails from '@salesforce/apex/UserAccessController.saveStaffDetails';
import saveStaffDetailsBulk from '@salesforce/apex/UserAccessController.saveStaffDetailsBulk';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getUserTypeValuesBasedOnUser from '@salesforce/apex/PortalUserController.getUserTypeValuesBasedOnUser';
import CURRENT_USER_ID from '@salesforce/user/Id';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import { refreshApex } from '@salesforce/apex';

export default class TesseractAppsStaffManagementLwc extends LightningElement {
    @track searchUser = '';
    @track searchStaff = '';
    @track filteredStaffData = []; // Holds filtered data for the data table
    @track paginatedData = [];
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track recordsPerPage = 10;
    isPageSizeManuallySet = false;
    hasCalculatedPageSize = false;
    resizeObserver;
    @track bDisableFirst = true;
    @track bDisableLast = false;
    @track userData = []; // Holds all user data fetched from Apex
    @track showGrantAccessflag = false;
    // @track showModal = false;
    @track _showModal = false;
    @track _createUserModule = false;
    @track _showModalUserCreate = false;
    @track filteredUserTypeValues = [];

    get showModal() {
        return this._showModal;
    }
    set showModal(value) {
        this._showModal = value;
        if (!this._suppressEmit) {
            this.dispatchEvent(new CustomEvent('subpopup', {
                detail: { slug: value ? 'reset-password' : '' },
                bubbles: true,
                composed: true
            }));
        }
    }

    get createUserModule() {
        return this._createUserModule;
    }
    set createUserModule(value) {
        this._createUserModule = value;
        this.notifyStateChange();
    }

    get showModalUserCreate() {
        return this._showModalUserCreate;
    }
    set showModalUserCreate(value) {
        this._showModalUserCreate = value;
        if (!this._suppressEmit) {
            this.dispatchEvent(new CustomEvent('subpopup', {
                detail: { slug: value ? 'create-user-confirm' : '' },
                bubbles: true,
                composed: true
            }));
        }
    }


    @track modalData = {}; // Holds data to display in the modal
    // @track createUserModule = false;
    @track staffFullName;
    @track staffEmailAddress;
    @track staffUserType;
    @track selectedUserType
    @track isUserTypeDisabled = true;
    @track UserTypeValues = [];
    @track userId;
    @track selectedRole;
    wiredUserTypeValues;
    @track staffId;
    @track stafffirstName;
    @track staffLastName;
    @track noRecordsFlag=false;
    @track facilityPreferredName;
    @track participantPreferredName;
    // @track showModalUserCreate = false;
    @track selectedStaffId;
    wiredStaffResult; 
  
    userId = CURRENT_USER_ID;
    @track roleOptions = [];
     @track sortField = '';
    @track sortDirection = 'asc';
    @track sortIcons = {
    staffNickName: '',
    staffFacility: '',
    staffGender: '',
    staffEmail: '',
    staffStatus: ''
};

    roleOptions = [
        { label: 'Org Admin', value: 'Portal Account Partner Executive' },
        { label: 'Roster Admin', value: 'Portal Account Partner Manager' },
        { label: 'Staff', value: 'Portal Account Partner User' }
    ];


    @wire(getUserRole)
    wiredUserRole({ error, data }) {
        if (data) {
            this.userTypeRole = data;
            console.log('User Type:', this.userTypeRole);
        } else if (error) {
            console.error('Error fetching user role:', error);
        }
    }

    get filteredRoleOptions() {
        console.log('this.userTypeRole===>'+this.userTypeRole);
        if (this.userTypeRole === 'NDIS Org Admin') {
            return this.roleOptions;
        } else {
            return this.roleOptions.filter(role => 
                role.value === 'Portal Account Partner Manager' || 
                role.value === 'Portal Account Partner User'
            );
        }
    }

    fetchUserTypeValues() {
        getUserTypeValuesfromOrg({ selectedroleValue: this.selectedRole, userId: this.userId })
            .then(data => {
                console.log('User Type Values received:', data);
                this.UserTypeValues = data.map(item => ({ label: item, value: item }));
            })
            .catch(error => {
                console.error('Error fetching User Type values', error);
            });
    }

    @track sectionFlags = {
        staffDetails: true,
        staffDetails1: true,
    };

    @track sectionIcons = {
        staffDetails: '\u2B9F',
        staffDetails1: '\u2B9F',
    };

    @track userTypevalueforcurrentlogin;
    @track facilityValuefromcatch;
    @track facilityLabelfromcatch;
    @track selectedStaff = [];   
    @track isAllStaffSelected = false; 
    @track showBulkCreateConfirmModal = false;
    @track pendingBulkPayload = [];

    connectedCallback() {
        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
        console.log('storedFacilityId >>', storedFacilityId);
        console.log('storedFacilityLabel >>', storedFacilityLabel);
        this.fetchOrgDetails();
        
        if (storedFacilityId && storedFacilityLabel) {
            this.facilityValuefromcatch = storedFacilityId;
            this.facilityLabelfromcatch = storedFacilityLabel;
        }

        // ✅ Load user type values first
        this.loadUserTypeValues();
        
        // ✅ Then load staff data
        this.loadStaffAccessDetails();
    } 

    // ✅ NEW: Load user type values based on current user
    loadUserTypeValues() {
        console.log('=== START: loadUserTypeValues ===');
        console.log('Loading user type values for current user');
        
        getUserTypeValuesBasedOnUser()
            .then(result => {
                console.log('=== APEX CALL SUCCESS ===');
                console.log('Result received:', result);
                
                // Store in filteredUserTypeValues
                this.filteredUserTypeValues = (result || []).map(item => ({ 
                    label: item, 
                    value: item 
                }));
                
                console.log('filteredUserTypeValues set to:', this.filteredUserTypeValues);
                console.log('filteredUserTypeValues length: ' + this.filteredUserTypeValues.length);
                
                // ✅ Update all rows with the new user type options
                this.updateAllUserTypeOptions();
                
                console.log('=== END: loadUserTypeValues (SUCCESS) ===');
            })
            .catch(error => {
                console.error('Error loading user type values:', error);
                this.filteredUserTypeValues = [];
                console.log('=== END: loadUserTypeValues (FAILED) ===');
            });
    }

    // ✅ Helper method to update user type options for all paginated data
    updateAllUserTypeOptions() {
        console.log('🔄 Updating user type options for all rows');
        
        const userTypeOptions = this.filteredUserTypeValues || [];
        console.log('📋 User Type Options:', userTypeOptions);
        
        if (this.paginatedData && this.paginatedData.length > 0) {
            this.paginatedData = this.paginatedData.map(row => ({
                ...row,
                userTypeOptions: userTypeOptions,
                isUserTypeDisabled: false // Enable User Type dropdown
            }));
            console.log('✅ Updated userTypeOptions for paginatedData');
        }
        
        if (this.userData && this.userData.length > 0) {
            this.userData = this.userData.map(row => ({
                ...row,
                userTypeOptions: userTypeOptions
            }));
            console.log('✅ Updated userTypeOptions for userData');
        }
        
        if (this.filteredStaffData && this.filteredStaffData.length > 0) {
            this.filteredStaffData = this.filteredStaffData.map(row => ({
                ...row,
                userTypeOptions: userTypeOptions
            }));
            console.log('✅ Updated userTypeOptions for filteredStaffData');
        }
    }
    
    fetchOrgDetails() {
              orgDetails()
                  .then((response) => {
                      console.log("Response for Org Details =>", response);
                      this.Orgid = response.Id;
                      this.orgfullname = response.Name;
                      //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                      //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
                  })
                  .catch((error) => {
                      console.error("Error fetching org details:", error);
                      this.error = error;
                  });
          }


    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id;
        console.log(sectionId);
        const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);
    
        if (!this.sectionFlags[sectionId]) {
            // First click: Set the section to true so it loads in the DOM
            this.sectionFlags[sectionId] = true;
        } else {
            // From second click onwards: Just toggle the hidden-section class
            sectionElement.classList.toggle('hidden-section');
        }
    
        // Toggle the icon dynamically
        this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
    }

    // Process the staff data
    processUserData(data) {
        console.log('User type:', this.userTypevalueforcurrentlogin);
        console.log('Facility from cache:', this.facilityValuefromcatch);
        console.log('data:', data);

        // Case 1: NDIS Org Admin — return all staff data
        /*if (this.userTypevalueforcurrentlogin === 'NDIS Org Admin') {
            console.log('Returning all staff records for NDIS Org Admin');
            return data.map((staff) => ({
                ...staff,
                userName: staff.userName || 'N/A',
                staffName: staff.staffName || 'N/A',
                staffNickName: staff.staffNickName || 'N/A',
            }));
        }*/

        // Case 2: Facility Admin or Roster Manager — filter by facility
        if (
            this.userTypevalueforcurrentlogin === 'Facility Admin' ||
            this.userTypevalueforcurrentlogin === 'Roster Manager' ||
            this.userTypevalueforcurrentlogin === 'NDIS Org Admin' ||
            this.userTypevalueforcurrentlogin === 'ICT Admin'
        ) {
            console.log('data >>', data);
            const filtered = data.filter((staff) => {
                const staffFacilityId = staff.staffFacilityId?.toString().trim();
                const selectedFacilityId = this.facilityValuefromcatch?.toString().trim();

                const isMatch = staffFacilityId === selectedFacilityId;
                console.log(
                    'Comparing:',
                    staffFacilityId,
                    '===',
                    selectedFacilityId,
                    '=> Match:',
                    isMatch
                );

                return isMatch;
            });

            console.log('Filtered Staff Count:', filtered.length);

            return filtered.map((staff) => ({
                
                ...staff,
                userName: staff.userName || 'N/A',
                staffName: staff.staffName || 'N/A',

            // 🔥 Inline badge logic (NO const used)
                statusClass:
                    staff.staffStatus === 'Active'
                        ? 'ta-badge ta-badge-success'
                        : staff.staffStatus === 'Inactive'
                        ? 'ta-badge ta-badge-error'
                        : 'ta-badge ta-badge-secondary'
                
            }));
        }

        // Default case: unsupported role or missing config
        console.warn('No matching role or missing data, returning empty list');
        return [];
    }

    async loadStaffAccessDetails() {

        // 🔹 START LOG
        console.log(
            '🟢 loadStaffAccessDetails START',
            JSON.stringify({
                timestamp: new Date().toISOString(),
                userId: this.userId,
                facilityId: this.facilityValuefromcatch
            }, null, 2)
        );

        try {

            // 🔹 FETCH STAFF ACCESS DETAILS
            const data = await getstaffAccessDetails({
                userId: this.userId,
                facilityId: this.facilityValuefromcatch
            });

            // 🔹 STORE RESULT LIKE WIRE
            this.wiredStaffResult = data;

            console.log(
                '✅ getstaffAccessDetails DATA RECEIVED',
                JSON.stringify({
                    recordCount: data.length,
                    dataPreview: data
                }, null, 2)
            );

            try {

                // 🔹 FETCH CURRENT LOGGED-IN USER
                const userInfo = await getCurrentLoggedUserInfo();

                console.log(
                    '✅ getCurrentLoggedUserInfo SUCCESS',
                    JSON.stringify(userInfo, null, 2)
                );

                this.userTypevalueforcurrentlogin =
                    userInfo.User_Type__c;

                console.log(
                    '👤 Current User Type',
                    this.userTypevalueforcurrentlogin
                );

                console.log(
                    '🏥 facilityValuefromcatch',
                    this.facilityValuefromcatch
                );

                // 🔹 PROCESS USER DATA
                console.log('🔄 processUserData START');

                this.userData =
                    this.processUserData(data);

                console.log(
                    '✅ processUserData RESULT',
                    JSON.stringify(this.userData, null, 2)
                );

                // 🔹 FILTER + PAGINATION
                this.filteredStaffData = [
                    ...this.userData
                ];

                this.totalRecords =
                    this.filteredStaffData.length;

                console.log(
                    '📊 Pagination Info',
                    JSON.stringify({
                        totalRecords: this.totalRecords
                    }, null, 2)
                );

                this.paginateData();

                console.log(
                    '✅ paginateData CALLED'
                );

            } catch (err) {

                console.error(
                    '❌ getCurrentLoggedUserInfo ERROR',
                    JSON.stringify(err, null, 2)
                );
            }

        } catch (error) {

            console.error(
                '❌ getstaffAccessDetails ERROR',
                JSON.stringify(error, null, 2)
            );
        }

        // 🔹 END LOG
        console.log(
            '🔚 loadStaffAccessDetails END',
            new Date().toISOString()
        );
    }

    // Fetch user data from Apex
    // @wire(getstaffAccessDetails, {
    //     userId: '$userId',
    //     facilityId: '$facilityValuefromcatch'
    // })
    // wiredStaffAccessDetails(result) {

    //     // 🔹 STORE FULL WIRE RESULT
    //     this.wiredStaffResult = result;

    //     // 🔹 START LOG
    //     console.log(
    //         '🟢 wiredStaffAccessDetails START',
    //         JSON.stringify({
    //             timestamp: new Date().toISOString(),
    //             userId: this.userId,
    //             facilityId: this.facilityValuefromcatch
    //         }, null, 2)
    //     );

    //     const { data, error } = result;

    //     // 🔹 DATA RECEIVED
    //     if (data) {
    //         console.log(
    //             '✅ wiredStaffAccessDetails DATA RECEIVED',
    //             JSON.stringify({
    //                 recordCount: data.length,
    //                 dataPreview: data
    //             }, null, 2)
    //         );

    //         // 🔹 FETCH CURRENT LOGGED-IN USER
    //         getCurrentLoggedUserInfo()
    //             .then((userInfo) => {

    //                 console.log(
    //                     '✅ getCurrentLoggedUserInfo SUCCESS',
    //                     JSON.stringify(userInfo, null, 2)
    //                 );

    //                 this.userTypevalueforcurrentlogin = userInfo.User_Type__c;

    //                 console.log(
    //                     '👤 Current User Type',
    //                     this.userTypevalueforcurrentlogin
    //                 );

    //                 console.log(
    //                     '🏥 facilityValuefromcatch',
    //                     this.facilityValuefromcatch
    //                 );

    //                 // 🔹 PROCESS USER DATA
    //                 console.log('🔄 processUserData START');
    //                 this.userData = this.processUserData(data);
    //                 console.log(
    //                     '✅ processUserData RESULT',
    //                     JSON.stringify(this.userData, null, 2)
    //                 );

    //                 // 🔹 FILTER + PAGINATION
    //                 this.filteredStaffData = [...this.userData];
    //                 this.totalRecords = this.filteredStaffData.length;

    //                 console.log(
    //                     '📊 Pagination Info',
    //                     JSON.stringify({
    //                         totalRecords: this.totalRecords
    //                     }, null, 2)
    //                 );

    //                 this.paginateData();
    //                 console.log('✅ paginateData CALLED');

    //             })
    //             .catch((err) => {
    //                 console.error(
    //                     '❌ getCurrentLoggedUserInfo ERROR',
    //                     JSON.stringify(err, null, 2)
    //                 );
    //             });

    //     }
    //     // 🔹 WIRE ERROR
    //     else if (error) {
    //         console.error(
    //             '❌ wiredStaffAccessDetails ERROR',
    //             JSON.stringify(error, null, 2)
    //         );
    //     }

    //     // 🔹 END LOG
    //     console.log(
    //         '🔚 wiredStaffAccessDetails END',
    //         new Date().toISOString()
    //     );
    // }



    // Filter the data based on the search input
    filterStaffData() {
        const searchTerm = (this.searchStaff || '').toLowerCase().trim();

        this.filteredStaffData = (this.userData || [])
            .filter(user => {
                const name = user.staffName || '';
                return name.toLowerCase().includes(searchTerm);
            })
            .map(user => {
                return {
                    ...user,
                    staffName: (user.staffName || '').toLowerCase() // 👈 force display to lowercase
                };
            });

        this.totalRecords = this.filteredStaffData.length;
        this.pageNumber = 1;
        this.paginateData();
    }

    handlerolechange(event) {
        const staffId = event.target.dataset.id;
        const selectedRole = event.target.value;

        this.paginatedData = this.paginatedData.map(staff => {
            if (staff.staffId === staffId) {
                return {
                    ...staff,
                    selectedRole: selectedRole,
                    selectedUserType: '',
                    isUserTypeDisabled: false
                };
            }
            return staff;
        });

        // Fetch User Types ONLY for this row
        this.fetchUserTypeValuesForRow(staffId, selectedRole);
    }

    fetchUserTypeValuesForRow(staffId, selectedRole) {
        getUserTypeValuesfromOrg({
            selectedroleValue: selectedRole,
            userId: this.userId
        })
            .then(data => {
                const options = data.map(item => ({
                    label: item,
                    value: item
                }));

                this.paginatedData = this.paginatedData.map(staff => {
                    if (staff.staffId === staffId) {
                        return {
                            ...staff,
                            userTypeOptions: options
                        };
                    }
                    return staff;
                });
            })
            .catch(error => {
                console.error('Error fetching User Type values', error);
            });
    }

    // Handle the Enter key press
    handleKeyup(event) {
        if (event.key === 'Enter') {
            this.filterStaffData();
        }
    }

    // handleSearchStaffChange(event) {
    //     this.searchStaff = event.target.value;
    //     //this.paginateData();
    // }

    handleSearchStaffChange(event) {
    this.searchStaff = event.target.value;
    this.filterStaffData();
}


    handleCloseModal(event){
        this.showModal = false;
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
        this.pageNumber = 1;
        this.paginateData();
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

    // Paginate the filtered data
    paginateData() {
        console.log('================ PAGINATE DATA START ================');

        console.log('📊 Total Records:', this.totalRecords);
        console.log('📄 Records Per Page:', this.recordsPerPage);
        console.log('📌 Current Page Number:', this.pageNumber);

        // No records flag
        if (this.totalRecords > 0) {
            this.noRecordsFlag = false;
        } else {
            this.noRecordsFlag = true;
        }
        console.log('🚫 No Records Flag:', this.noRecordsFlag);

        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;

        console.log('➡️ Pagination Index Range:', startIndex, 'to', endIndex);

        console.log(
            '📥 Filtered Staff Data Length:',
            this.filteredStaffData ? this.filteredStaffData.length : 0
        );
        const sortedData = this.sortData(this.filteredStaffData || []);
        
        // ✅ Get the filtered user type options
        const userTypeOptions = this.filteredUserTypeValues || [];
        console.log('📋 Available User Type Options:', userTypeOptions);

        this.paginatedData = sortedData
            .slice(startIndex, endIndex)
            .map((staff, index) => {
                console.log(`🔍 Processing Staff Row #${startIndex + index + 1}`);
                console.log('   🆔 Staff ID:', staff.staffId);
                console.log('   👤 Name:', staff.stafffirstName, staff.staffLastName);

                const mappedRow = {
                    ...staff,
                    selectedRole: staff.selectedRole || '',
                    selectedUserType: staff.selectedUserType || '',
                    isUserTypeDisabled: false, // ✅ Enable by default
                    userTypeOptions: userTypeOptions, // ✅ Set user type options
                    isSelected: false 
                };

                console.log('   ✅ Final Row State:', JSON.stringify(mappedRow));
                return mappedRow;
            });

        console.log('📃 Paginated Data Length:', this.paginatedData.length);
        console.log('📃 Paginated Data Records:', JSON.stringify(this.paginatedData, null, 2));
        this.totalRecords = sortedData.length;
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
        this.selectedStaff = [];
        this.isAllStaffSelected = false;

        console.log('📘 Total Pages:', this.totalPages);

        this.updatePaginationButtons();
        console.log('🔘 Pagination Buttons Updated');

        console.log('================ PAGINATE DATA END ==================');
    }

    updatePaginationButtons() {
        this.bDisableFirst = this.pageNumber === 1;
        this.bDisableLast = this.pageNumber === this.totalPages;
    }

    // Pagination controls
    firstPage() {
        this.pageNumber = 1;
        this.paginateData();
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.paginateData();
        }
    }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.paginateData();
        }
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginateData();
    }

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    renderedCallback() {
        if (!this.resizeObserver) {
            const container = this.template.querySelector('.table-container');
            if (container) {
                this.resizeObserver = new ResizeObserver(() => {
                    this.handleResize();
                });
                this.resizeObserver.observe(container);
            }
        }
    }

    handleRecordsPerPage(event) {
        const selectedValue = event.target.value;
        if (selectedValue === 'Auto') {
            this.isPageSizeManuallySet = false;
            this.setPageSizeByZoomAndScreen();
        } else {
            this.isPageSizeManuallySet = true;
            this.recordsPerPage = parseInt(selectedValue, 10);
            this.pageNumber = 1;
            this.paginateData();
        }
    }

    // Handle "Reset Password" link click
    // resetpasswordlink(event) {
    //     const userId = event.target.getAttribute('data-id');
        
    //     // Find the user based on their ID (you can also fetch this data if needed)
    //     const user = this.paginatedData.find(user => user.userId === userId);
        
    //     // Set the modal data and show the modal
    //     if (user) {
    //         this.modalData = user;
    //         this.showModal = true;
    //     }
    // }

    resetpasswordlink(event) {
        const userId = event.target.getAttribute('data-id');
        if (userId) {
            this.loadResetPasswordPopup(userId);
        }
    }


    // onClickUserAccount(event) {
    //     console.log(event.currentTarget.dataset.id);
    //     this.staffId = event.currentTarget.dataset.id;
    //     console.log('this.staffId===>'+this.staffId);
    //     this.createUserModule = true;
    //     console.log('Create User Module:', this.createUserModule);
        
    //     // Call Apex Method
    //     getselectedStaffDetails({ staffId1: this.staffId })
    //         .then(result => {
    //             console.log('Staff Data:', result);
                
    //             // Parse the result string into an object (if it's a string)
    //             let staffData = typeof result === 'string' ? JSON.parse(result) : result;
    //             console.log('Parsed Staff Data:', staffData);
    
    //             // Assign values
    //             this.stafffirstName = staffData.Name;
    //             this.staffLastName = staffData.Last_Name__c;
    //             this.staffFullName = staffData.Name + ' ' + (staffData.Last_Name__c || '');
    //             this.staffEmailAddress = staffData.Email_Address__c || 'No Email';
    //             this.staffUserType = staffData.Type_of_User__c;

    //             //this.updateRoleOptions();
    
    //             // Debug values
    //             console.log('Full Name:', this.staffFullName);
    //             console.log('Email Address:', this.staffEmailAddress);
    //         })
    //         .catch(error => {
    //             console.error('Error fetching staff details:', error);
    //             this.error = error;
    //         });
    // }    
    
    onClickUserAccount(event) {
        const id = event.currentTarget.dataset.id;
        this.loadRecordData(id).catch(error => {
            console.error('Error loading record:', error);
        });
    }    

    handleClose(event){
        this.selectedRole = '';
        this.selectedUserType = '';
        this.createUserModule = false;
    }

    handleUserTypeChange(event) {
        const staffId = event.target.dataset.id;
        const selectedUserType = event.target.value;

        console.log('🔄 User Type changed for staffId:', staffId);
        console.log('📌 Selected User Type:', selectedUserType);

        // ✅ Auto-map role when user type changes
        const mapUserTypeToRole = (userType) => {
            const roleMap = {
                'NDIS Org Admin': 'Portal Account Partner Executive',
                'ICT Admin': 'Portal Account Partner Executive',
                'Facility Admin': 'Portal Account Partner Executive',
                'SC with NDIS Org Admin': 'Portal Account Partner Executive',
                'Roster Manager': 'Portal Account Partner Manager',
                'HR Admin': 'Portal Account Partner Manager',
                'Payroll Admin': 'Portal Account Partner Manager',
                'NDIS Participant': 'Portal Account Partner Manager',
                'NDIS Participants': 'Portal Account Partner Manager',
                'Payroll Accountant for Multiple': 'Portal Account Partner Manager',
                'Accountant for Organisation': 'Portal Account Partner Manager',
                'SC with Roster Manager': 'Portal Account Partner Manager',
                'NDIS Staff': 'Portal Account Partner User',
                'ICT Staff': 'Portal Account Partner User'
            };
            return roleMap[userType] || null;
        };

        this.paginatedData = this.paginatedData.map(staff => {
            if (staff.staffId === staffId) {
                // Map role from user type
                const mappedRole = mapUserTypeToRole(selectedUserType);
                return {
                    ...staff,
                    selectedUserType: selectedUserType,
                    selectedRole: mappedRole || staff.selectedRole // Update role if mapped
                };
            }
            return staff;
        });

        console.log('✅ Updated paginatedData with new User Type and mapped Role');
    }

    handlesavebutton(event) {
        console.log('================ SAVE USER START ================');

        const staffId = this.selectedStaffId;
        console.log('🆔 Selected Staff ID:', staffId);

        /* ==========================
        FIND STAFF ROW
        ========================== */
        console.log('📋 Paginated Data Length:', this.paginatedData?.length);

        const staffRow = this.paginatedData.find(
            staff => staff.staffId === staffId
        );

        console.log('🔍 Matched Staff Row:', staffRow ? JSON.stringify(staffRow, null, 2) : 'NOT FOUND');

        if (!staffRow) {
            console.error('❌ Staff row not found for staffId:', staffId);
            this.showToast('Error', 'Staff record not found.', 'error');
            return;
        }

        /* ==========================
        ROW LEVEL VALIDATION
        ========================== */
        console.log('🧪 Validation Check → Role:', staffRow.selectedRole);
        console.log('🧪 Validation Check → User Type:', staffRow.selectedUserType);

        if (!staffRow.selectedRole) {
            console.warn('⚠️ Validation failed: Role missing');
            this.showToast('Error', 'Please select User Role.', 'error');
            return;
        }

        if (!staffRow.selectedUserType) {
            console.warn('⚠️ Validation failed: User Type missing');
            this.showToast('Error', 'Please select User Type.', 'error');
            return;
        }

        /* ==========================
        BUILD PAYLOAD
        ========================== */
        const staffDetails = {
            staffId: staffRow.staffId,
            firstName: staffRow.firstName,
            lastName: staffRow.lastName,
            email: staffRow.staffEmail || this.staffEmailAddress,
            role: staffRow.selectedRole,
            userType: staffRow.selectedUserType,
            street: staffRow.street || '',
            city: staffRow.city || '',
            state: staffRow.state || '',
            postalCode: staffRow.postalCode || '',
            country: staffRow.country || ''
        };

        console.log('📦 Payload (staffDetails):', JSON.stringify(staffDetails, null, 2));

        /* ==========================
        CALL APEX
        ========================== */
        console.log('🚀 Calling Apex: saveStaffDetails');

        saveStaffDetails({ staffDetails })
            .then(result => {
                console.log('✅ Apex Success Response:', JSON.stringify(result, null, 2));

                this.showToast(
                    'Success',
                    'User account request submitted successfully. You will receive an email within 5 minutes. Once created, the user will be available in the User Management table.',
                    'success'
                );

                /* ==========================
                CLEAR ROW STATE
                ========================== */
                console.log('🧹 Clearing row state for staffId:', staffId);

                this.paginatedData = this.paginatedData.map(staff => {
                    if (staff.staffId === staffId) {
                        const clearedRow = {
                            ...staff,
                            selectedRole: '',
                            selectedUserType: '',
                            isUserTypeDisabled: false,
                            userTypeOptions: this.filteredUserTypeValues || []
                        };
                        console.log('🧾 Updated Row:', JSON.stringify(clearedRow, null, 2));
                        return clearedRow;
                    }
                    return staff;
                });

                /* ==========================
                CLOSE MODAL
                ========================== */
                this.showModalUserCreate = false;
                console.log('📦 Confirmation modal closed');

                /* ==========================
                REFRESH APEX
                ========================== */
                console.log('⏳ Scheduling refreshApex in 5 seconds');
                setTimeout(() => {
                    console.log('🔄 Refreshing staff list now');
                    refreshApex(this.wiredStaffResult);
                }, 5000);
            })
            .catch(error => {
                console.error('❌ Apex Error:', JSON.stringify(error, null, 2));
                this.showToast('Error', 'Failed to create User.', 'error');
            })
            .finally(() => {
                console.log('================ SAVE USER END ==================');
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

    get placeholderText() {
        return `Search ${this.staffPreferredName}`;
    }

    // handlesavebutton1(event){
    //     this.selectedStaffId = event.currentTarget.dataset.id;
    //     console.log('🟦 Opening modal for staffId:', this.selectedStaffId);

    //     const staffRow = this.paginatedData.find(
    //         staff => staff.staffId === this.selectedStaffId
    //     );

    //     if (!staffRow) {
    //         this.showToast('Error', 'Staff record not found.', 'error');
    //         return;
    //     }

    //     /* ==========================
    //     ROW LEVEL VALIDATION
    //     ========================== */
    //     if (!staffRow.selectedRole) {
    //         this.showToast('Error', 'Please select User Role.', 'error');
    //         return;
    //     }

    //     if (!staffRow.selectedUserType) {
    //         this.showToast('Error', 'Please select User Type.', 'error');
    //         return;
    //     }

    //     if (staffRow.staffStatus === 'Inactive') {
    //         this.showToast('Error', 'User is Inactive. You cannot proceed.', 'error');
    //         return;
    //     }
    //     this.showModalUserCreate = true;
    // }

    handlesavebutton1(event){
        const id = event.currentTarget.dataset.id;
        if (id) {
            this.loadCreateUserConfirmPopup(id);
        }
    }


    handleCloseModalUSerCreation(event){
        this.selectedStaffId = '';
        this.showModalUserCreate = false;
    }

    handleStaffRowSelect(event) {
        const staffId = event.currentTarget.dataset.id;
        const checked = event.target.checked;

        console.log('Staff Id>>', staffId);

        if (!staffId) {
            console.error('❌ Staff Id missing');
            return;
        }

        if (!Array.isArray(this.paginatedData)) {
            console.error('❌ paginatedData is not an array');
            return;
        }

        // ✅ Get the row from paginatedData (guaranteed to exist)
        const staffRow = this.paginatedData.find(row => row.staffId === staffId);

        if (!staffRow) {
            console.error('❌ Staff row not found in paginatedData', staffId);
            return;
        }

        // Maintain selectedStaff
        if (checked) {
            if (!this.selectedStaff.some(s => s.staffId === staffId)) {
                this.selectedStaff = [...this.selectedStaff, staffRow];
            }
        } else {
            this.selectedStaff = this.selectedStaff.filter(
                s => s.staffId !== staffId
            );
        }

        // Sync checkbox UI ONLY on paginatedData
        this.paginatedData = this.paginatedData.map(row =>
            row.staffId === staffId
                ? { ...row, isSelected: checked }
                : row
        );

        const allSelected = this.paginatedData.length > 0 &&
        this.paginatedData.every(row => row.isSelected);

        this.isAllStaffSelected = allSelected;

        console.log(
            '✅ Selected staff array now:',
            JSON.stringify(this.selectedStaff)
        );
    }

    handleSelectAllStaff(event) {
        const checked = event.target.checked;

        if (!Array.isArray(this.paginatedData)) return;

        let updatedSelected = [...this.selectedStaff];

        this.paginatedData.forEach(row => {
            if (checked) {
                if (!updatedSelected.some(s => s.staffId === row.staffId)) {
                    updatedSelected.push(row);
                }
            } else {
                updatedSelected = updatedSelected.filter(s => s.staffId !== row.staffId);
            }
        });

        this.selectedStaff = updatedSelected;

        // Update UI
        this.paginatedData = this.paginatedData.map(row => ({
            ...row,
            isSelected: checked
        }));

        // 3️⃣ Update header checkbox state
        this.isAllStaffSelected = checked;


        console.log(
            'Header checkbox:',
            checked,
            'Selected staff count:',
            this.selectedStaff.length
        );
    }
/*
    handleBulkCreateUsers() {

        console.log('🔥 handleBulkCreateUsers START');
        
        // 1️⃣ Log current selection
        console.log(
            'Selected staff array:',
            JSON.stringify(this.selectedStaff)
        );
        console.log(
            'Selected staff count:',
            this.selectedStaff ? this.selectedStaff.length : 'undefined'
        );
        
        this.selectedStaff = this.paginatedData
            ? this.paginatedData.filter(row => row.isSelected)
            : [];
        // 1️⃣ Basic selection validation
        if (!this.selectedStaff.length) {
            this.showToast(
                'Error',
                'Please select at least one staff record.',
                'error'
            );
            return;
        }

        // 2️⃣ Validate Role & User Type
        const invalidRows = this.selectedStaff.filter(
            row => !row.selectedRole || !row.selectedUserType
        );

        if (invalidRows.length > 0) {
            this.showToast(
                'Error',
                'Please select both Role and User Type for all selected staff.',
                'error'
            );
            return;
        }

        // 3️⃣ Build Apex payload
        const payload = this.selectedStaff.map(row => {
            const record = {
                staffId: row.staffId,                 
                firstName: row.firstName,              
                lastName: row.lastName,                
                email: row.staffEmail,                 
                role: row.selectedRole,                
                userType: row.selectedUserType,        

                // optional (only if Apex needs them)
                street: row.staffStreet || '',
                city: row.staffCity || '',
                state: row.staffState || '',
                postalCode: row.staffPostalCode || '',
                country: row.staffCountry || ''
            };

            console.log('📦 Payload record being sent:', record);
            return record;
        });

        // 4️⃣ Call Apex
        saveStaffDetailsBulk({ staffDetailsList: payload })
            .then(results => {
                this.applyBulkResults(results);
                this.showToast(
                    'Success',
                    'User account request submitted successfully. You will receive an email within 5 minutes. Once created, the user will be available in the User Management table.',
                    'success'
                );
            })
            .catch(error => {
                this.showToast(
                    'Error',
                    error.body?.message || 'Bulk user creation failed.',
                    'error'
                );
            });
    }
*/

    handleBulkCreateUsers() {
        // ⭐ ROLE MAPPING FUNCTION
        const mapUserTypeToRole = (userType) => {
            const roleMap = {
                'NDIS Org Admin': 'Portal Account Partner Executive',
                'ICT Admin': 'Portal Account Partner Executive',
                'Facility Admin': 'Portal Account Partner Executive',
                'SC with NDIS Org Admin': 'Portal Account Partner Executive',
                'Roster Manager': 'Portal Account Partner Manager',
                'HR Admin': 'Portal Account Partner Manager',
                'Payroll Admin': 'Portal Account Partner Manager',
                'NDIS Participant': 'Portal Account Partner Manager',
                'NDIS Participants': 'Portal Account Partner Manager',
                'Payroll Accountant for Multiple': 'Portal Account Partner Manager',
                'Accountant for Organisation': 'Portal Account Partner Manager',
                'SC with Roster Manager': 'Portal Account Partner Manager',
                'NDIS Staff': 'Portal Account Partner User',
                'ICT Staff': 'Portal Account Partner User'
            };
            return roleMap[userType] || null;
        };

        console.log('🔥 handleBulkCreateUsers START');

        // Sync selection from UI
        this.selectedStaff = this.paginatedData
            ? this.paginatedData.filter(row => row.isSelected)
            : [];

        if (!this.selectedStaff.length) {
            this.showToast(
                'Error',
                'Please select at least one staff record.',
                'error'
            );
            return;
        }

        // ✅ Check if User Type is selected for all rows
        const missingUserType = this.selectedStaff.filter(
            row => !row.selectedUserType
        );

        if (missingUserType.length > 0) {
            this.showToast(
                'Error',
                'Please select User Type for all selected staff.',
                'error'
            );
            return;
        }

        // ✅ Auto-map roles from User Types and validate
        let hasInvalidRole = false;
        let invalidUserTypes = [];

        this.selectedStaff = this.selectedStaff.map(row => {
            // If role is empty, map it from User Type
            if (!row.selectedRole || row.selectedRole === '') {
                const mappedRole = mapUserTypeToRole(row.selectedUserType);
                if (mappedRole) {
                    row.selectedRole = mappedRole;
                    console.log(`✅ Role mapped for ${row.firstName} ${row.lastName}:`, mappedRole);
                } else {
                    hasInvalidRole = true;
                    invalidUserTypes.push(row.selectedUserType);
                    console.error(`❌ No role found for User Type: ${row.selectedUserType}`);
                }
            }
            return row;
        });

        // ✅ Final validation - check if any rows still have no role
        const missingRole = this.selectedStaff.filter(
            row => !row.selectedRole
        );

        if (missingRole.length > 0 || hasInvalidRole) {
            const uniqueInvalidTypes = [...new Set(invalidUserTypes)];
            this.showToast(
                'Error',
                `No valid role found for User Type(s): ${uniqueInvalidTypes.join(', ')}. Please correct and try again.`,
                'error'
            );
            return;
        }

        // ✅ Inactive validation
        const inactiveRows = this.selectedStaff.filter(
            row => row.staffStatus?.toLowerCase() === 'inactive'
        );

        if (inactiveRows.length > 0) {
            this.showToast(
                'Error',
                'One or more selected staff are Inactive. Please activate them before proceeding.',
                'error'
            );
            return;
        }

        // ✅ Log final data for debugging
        console.log('📊 Selected Staff with mapped roles:');
        this.selectedStaff.forEach(row => {
            console.log(`  - ${row.firstName} ${row.lastName}: UserType=${row.selectedUserType}, Role=${row.selectedRole}`);
        });

        // Build payload with mapped roles
        this.pendingBulkPayload = this.selectedStaff.map(row => ({
            staffId: row.staffId,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.staffEmail,
            role: row.selectedRole,
            userType: row.selectedUserType,
            street: row.staffStreet || '',
            city: row.staffCity || '',
            state: row.staffState || '',
            postalCode: row.staffPostalCode || '',
            country: row.staffCountry || ''
        }));

        console.log('📤 Pending Bulk Payload:', JSON.stringify(this.pendingBulkPayload));

        // ✅ Open confirmation modal
        this.showBulkCreateConfirmModal = true;

        console.log('🔥 handleBulkCreateUsers END');
    }

    applyBulkResults(results) {
        console.log('🔵 applyBulkResults START');
        console.log('Results received from Apex:', results);
        const resultMap = new Map();
        results.forEach(r => {
            console.log(
                'Mapping result -> staffId:',
                r.staffId,
                'success:',
                r.success,
                'message:',
                r.message
            );
            resultMap.set(r.staffId, r);
        });
        results.forEach(r => resultMap.set(r.staffId, r));
        console.log('paginatedData before applyBulkResults:',this.paginatedData);
        this.paginatedData = this.paginatedData.map(row => {
            console.log(
            'Processing table row -> row.staffId:',
            row.staffId
        );
            const res = resultMap.get(row.staffId);
            console.log(
                'Matched result for row.staffId:',
                row.staffId,
                '=>',
                res
            );
            if (!res) {
                console.log(
                    'No result found for row.staffId:',
                    row.staffId,
                    '— returning row unchanged'
                );
                return row;
            }

            if (res.success) {
                return {
                    ...row,
                    hasUser: true,
                    isSelected: false,
                    errorMessage: ''
                };
            }

            return {
                ...row,
                isSelected: false,
                errorMessage: res.message
            };
        });

        // 🔄 Reset bulk state
        this.selectedStaff = [];
        this.isAllStaffSelected = false;
    }

    get disableBulkCreate() {
        return !this.selectedStaff.length;
    }

    handleCloseModalUserCreation() {
        this.showBulkCreateConfirmModal = false;
        this.pendingBulkPayload = [];
    }

    handleConfirmBulkCreate() {

        if (!this.pendingBulkPayload.length) {
            this.showToast(
                'Error',
                'No staff data available.',
                'error'
            );
            return;
        }

        saveStaffDetailsBulk({ staffDetailsList: this.pendingBulkPayload })
            .then(results => {

                this.applyBulkResults(results);

                this.showToast(
                    'Success',
                    'User account request submitted successfully. You will receive an email within 5 minutes. Once created, the user will be available in the User Management table.',
                    'success'
                );

                this.showBulkCreateConfirmModal = false;
                this.pendingBulkPayload = [];
            })
            .catch(error => {
                this.showToast(
                    'Error',
                    error.body?.message || 'Bulk user creation failed.',
                    'error'
                );
            });
    }

    handleResize() {
        if (this.isPageSizeManuallySet) {
            return;
        }
        this.setPageSizeByZoomAndScreen();
    }

    setPageSizeByZoomAndScreen() {
        if (this.isPageSizeManuallySet) {
            return;
        }
        setTimeout(() => {
            const container = this.template.querySelector('.table-container');
            if (container) {
                const containerHeight = container.getBoundingClientRect().height || container.offsetHeight || 400;
                
                const header = this.template.querySelector('.fixed-table thead');
                const headerHeight = header ? (header.getBoundingClientRect().height || header.offsetHeight) : 40;
                
                const availableHeight = containerHeight - headerHeight;
                
                let rowHeight = 40;
                const firstRow = this.template.querySelector('.fixed-table tbody tr');
                if (firstRow) {
                    rowHeight = firstRow.getBoundingClientRect().height || firstRow.offsetHeight || 40;
                }
                
                let rows = Math.floor(availableHeight / rowHeight);
                if (rows < 1) {
                    rows = 1;
                }
                const oldSize = this.recordsPerPage;
                this.recordsPerPage = rows;
                this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
                if (this.recordsPerPage !== oldSize) {
                    this.pageNumber = 1;
                    this.paginateData();
                }
            }
        }, 50);
    }

    get pageSizeOptions() {
        return [
            { label: 'Auto', value: 'Auto', selected: !this.isPageSizeManuallySet },
            { label: '10', value: 10, selected: this.isPageSizeManuallySet && this.recordsPerPage === 10 },
            { label: '20', value: 20, selected: this.isPageSizeManuallySet && this.recordsPerPage === 20 },
            { label: '50', value: 50, selected: this.isPageSizeManuallySet && this.recordsPerPage === 50 }
        ];
    }

    // --- Hash routing implementation details ---
    _suppressEmit = false;

    @api get isEdit() {
        return this.createUserModule;
    }

    @api get currentStep() {
        return '';
    }

    @api currentTabSlug() {
        return '';
    }

    @api selectTab(slug) {
        // no-op
    }

    @api startEdit() {
        if (this.staffId) {
            this.createUserModule = true;
        }
    }

    @api setStep(step) {
        // no-op
    }

    @api openPopup(slug) {
        if (this.staffId) {
            this._openPopupBySlug(slug, this.staffId);
        }
    }

    @api get recordUid() {
        if (!this.staffId) return '';
        const rec = this.paginatedData.find(u => u.staffId === this.staffId);
        if (rec && rec.staffUid) return rec.staffUid;
        return this.staffId;
    }

    @api get activePopup() {
        if (this.showModal) return 'reset-password';
        if (this.showModalUserCreate) return 'create-user-confirm';
        return '';
    }

    @api async openByUID(uid, isEdit) {
        this._suppressEmit = true;
        try {
            let matchedStaff = this.paginatedData.find(u => u.staffUid === uid || u.staffId === uid);
            let resolvedStaffId = matchedStaff ? matchedStaff.staffId : uid;

            if (isEdit) {
                await this.loadRecordData(resolvedStaffId);
            } else {
                this.staffId = resolvedStaffId;
            }

            // Read step and popup from hash directly
            const hash = window.location.hash || '';
            const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
            const uidIdx = parts.findIndex(p => /^stf-/i.test(p));
            let popup = '';
            if (uidIdx >= 0) {
                const modes = parts.slice(uidIdx + 2);
                popup = modes.find(m => m !== 'edit' && !/^step[1-5]$/.test(m)) || '';
            }
            if (popup) {
                this._openPopupBySlug(popup, resolvedStaffId);
            }
        } catch (e) {
            console.error('Child openByUID error:', e);
        } finally {
            this._suppressEmit = false;
        }
    }

    async loadRecordData(staffId) {
        this.staffId = staffId;
        const result = await getselectedStaffDetails({ staffId1: this.staffId });
        let staffData = typeof result === 'string' ? JSON.parse(result) : result;
        this.stafffirstName = staffData.Name;
        this.staffLastName = staffData.Last_Name__c;
        this.staffFullName = staffData.Name + ' ' + (staffData.Last_Name__c || '');
        this.staffEmailAddress = staffData.Email_Address__c || 'No Email';
        this.staffUserType = staffData.Type_of_User__c;
        this.createUserModule = true;
    }

    loadResetPasswordPopup(userId) {
        const user = this.paginatedData.find(u => u.userId === userId);
        if (user) {
            this.modalData = user;
            this.showModal = true;
        }
    }

    loadCreateUserConfirmPopup(staffId) {
        // ⭐ ROLE MAPPING FUNCTION
        const mapUserTypeToRole = (userType) => {
            const roleMap = {
                'NDIS Org Admin': 'Portal Account Partner Executive',
                'ICT Admin': 'Portal Account Partner Executive',
                'Facility Admin': 'Portal Account Partner Executive',
                'SC with NDIS Org Admin': 'Portal Account Partner Executive',
                'Roster Manager': 'Portal Account Partner Manager',
                'HR Admin': 'Portal Account Partner Manager',
                'Payroll Admin': 'Portal Account Partner Manager',
                'NDIS Participant': 'Portal Account Partner Manager',
                'NDIS Participants': 'Portal Account Partner Manager',
                'Payroll Accountant for Multiple': 'Portal Account Partner Manager',
                'Accountant for Organisation': 'Portal Account Partner Manager',
                'SC with Roster Manager': 'Portal Account Partner Manager',
                'NDIS Staff': 'Portal Account Partner User',
                'ICT Staff': 'Portal Account Partner User'
            };
            return roleMap[userType] || null;
        };

        console.log('=== loadCreateUserConfirmPopup START ===');
        console.log('Staff ID:', staffId);

        const staffRow = this.paginatedData.find(
            staff => staff.staffId === staffId
        );

        if (staffRow) {
            console.log('Staff Row Found:', JSON.stringify(staffRow));

            /* ==========================
            ROW LEVEL VALIDATION
            ========================== */
            if (!staffRow.selectedUserType) {
                this.showToast('Error', 'Please select User Type.', 'error');
                return;
            }

            // ✅ Auto-map role from User Type if selectedRole is empty
            let mappedRole = staffRow.selectedRole;
            if (!mappedRole || mappedRole === '') {
                mappedRole = mapUserTypeToRole(staffRow.selectedUserType);
                staffRow.selectedRole = mappedRole;
                console.log('✅ Role mapped from User Type:', mappedRole);
            }

            // ✅ Validate that we have a role
            if (!mappedRole || mappedRole === '') {
                console.error('❌ No role found for User Type:', staffRow.selectedUserType);
                this.showToast(
                    'Error', 
                    `No valid role found for User Type: ${staffRow.selectedUserType}`,
                    'error'
                );
                return;
            }

            // ✅ Final validation - ensure both are set
            if (!staffRow.selectedRole) {
                this.showToast('Error', 'Please select User Role.', 'error');
                return;
            }

            if (staffRow.staffStatus === 'Inactive') {
                this.showToast('Error', 'User is Inactive. You cannot proceed.', 'error');
                return;
            }

            console.log('✅ All validations passed:');
            console.log('  - User Type:', staffRow.selectedUserType);
            console.log('  - Mapped Role:', staffRow.selectedRole);

            this.selectedStaffId = staffId;
            this.showModalUserCreate = true;

            console.log('=== loadCreateUserConfirmPopup END (Success) ===');
        } else {
            console.error('❌ Staff row not found for ID:', staffId);
            this.showToast('Error', 'Staff record not found.', 'error');
        }
    }

    _openPopupBySlug(slug, staffId) {
        if (slug === 'reset-password') {
            const user = this.paginatedData.find(u => u.staffId === staffId);
            if (user) {
                this.loadResetPasswordPopup(user.userId);
            }
        } else if (slug === 'create-user-confirm') {
            this.loadCreateUserConfirmPopup(staffId);
        }
    }

    notifyStateChange() {
        if (this._suppressEmit) return;
        this.dispatchEvent(new CustomEvent('childstatechange', {
            bubbles: true,
            composed: true
        }));
    }    

}