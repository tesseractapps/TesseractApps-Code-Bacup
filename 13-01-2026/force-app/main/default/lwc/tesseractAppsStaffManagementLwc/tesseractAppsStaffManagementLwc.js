import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getstaffAccessDetails from '@salesforce/apex/UserAccessController.getStaffAccessDetails';
import getselectedStaffDetails from '@salesforce/apex/UserAccessController.getSelectedStaffDetails';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import saveStaffDetails from '@salesforce/apex/UserAccessController.saveStaffDetails';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
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
    @track bDisableFirst = true;
    @track bDisableLast = false;
    @track userData = []; // Holds all user data fetched from Apex
    @track pageSizeOptions = [10, 20, 50]; // Define page size options
    @track showGrantAccessflag = false;
    @track showModal = false; // Tracks whether the modal is displayed
    @track modalData = {}; // Holds data to display in the modal
    @track createUserModule = false;
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
    @track showModalUserCreate = false;
    @track selectedStaffId;
    wiredStaffResult; 
  
    userId = CURRENT_USER_ID;
    @track roleOptions = [];

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
            }));
        }

        // Default case: unsupported role or missing config
        console.warn('No matching role or missing data, returning empty list');
        return [];
    }

    // Fetch user data from Apex
    @wire(getstaffAccessDetails, {
        userId: '$userId',
        facilityId: '$facilityValuefromcatch'
    })
    wiredStaffAccessDetails(result) {

        // 🔹 STORE FULL WIRE RESULT
        this.wiredStaffResult = result;

        // 🔹 START LOG
        console.log(
            '🟢 wiredStaffAccessDetails START',
            JSON.stringify({
                timestamp: new Date().toISOString(),
                userId: this.userId,
                facilityId: this.facilityValuefromcatch
            }, null, 2)
        );

        const { data, error } = result;

        // 🔹 DATA RECEIVED
        if (data) {
            console.log(
                '✅ wiredStaffAccessDetails DATA RECEIVED',
                JSON.stringify({
                    recordCount: data.length,
                    dataPreview: data
                }, null, 2)
            );

            // 🔹 FETCH CURRENT LOGGED-IN USER
            getCurrentLoggedUserInfo()
                .then((userInfo) => {

                    console.log(
                        '✅ getCurrentLoggedUserInfo SUCCESS',
                        JSON.stringify(userInfo, null, 2)
                    );

                    this.userTypevalueforcurrentlogin = userInfo.User_Type__c;

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
                    this.userData = this.processUserData(data);
                    console.log(
                        '✅ processUserData RESULT',
                        JSON.stringify(this.userData, null, 2)
                    );

                    // 🔹 FILTER + PAGINATION
                    this.filteredStaffData = [...this.userData];
                    this.totalRecords = this.filteredStaffData.length;

                    console.log(
                        '📊 Pagination Info',
                        JSON.stringify({
                            totalRecords: this.totalRecords
                        }, null, 2)
                    );

                    this.paginateData();
                    console.log('✅ paginateData CALLED');

                })
                .catch((err) => {
                    console.error(
                        '❌ getCurrentLoggedUserInfo ERROR',
                        JSON.stringify(err, null, 2)
                    );
                });

        }
        // 🔹 WIRE ERROR
        else if (error) {
            console.error(
                '❌ wiredStaffAccessDetails ERROR',
                JSON.stringify(error, null, 2)
            );
        }

        // 🔹 END LOG
        console.log(
            '🔚 wiredStaffAccessDetails END',
            new Date().toISOString()
        );
    }



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

        this.paginatedData = (this.filteredStaffData || [])
            .slice(startIndex, endIndex)
            .map((staff, index) => {
                console.log(`🔍 Processing Staff Row #${startIndex + index + 1}`);
                console.log('   🆔 Staff ID:', staff.staffId);
                console.log('   👤 Name:', staff.stafffirstName, staff.staffLastName);

                const mappedRow = {
                    ...staff,
                    selectedRole: staff.selectedRole || '',
                    selectedUserType: staff.selectedUserType || '',
                    isUserTypeDisabled: true,
                    userTypeOptions: []
                };

                console.log('   ✅ Final Row State:', JSON.stringify(mappedRow));
                return mappedRow;
            });

        console.log('📃 Paginated Data Length:', this.paginatedData.length);
        console.log('📃 Paginated Data Records:', JSON.stringify(this.paginatedData, null, 2));

        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
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

    handleRecordsPerPage(event) {
        this.recordsPerPage = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.paginateData();
    }

    // Handle "Reset Password" link click
    resetpasswordlink(event) {
        const userId = event.target.getAttribute('data-id');
        
        // Find the user based on their ID (you can also fetch this data if needed)
        const user = this.paginatedData.find(user => user.userId === userId);
        
        // Set the modal data and show the modal
        if (user) {
            this.modalData = user;
            this.showModal = true;
        }
    }

    onClickUserAccount(event) {
        console.log(event.currentTarget.dataset.id);
        this.staffId = event.currentTarget.dataset.id;
        console.log('this.staffId===>'+this.staffId);
        this.createUserModule = true;
        console.log('Create User Module:', this.createUserModule);
        
        // Call Apex Method
        getselectedStaffDetails({ staffId1: this.staffId })
            .then(result => {
                console.log('Staff Data:', result);
                
                // Parse the result string into an object (if it's a string)
                let staffData = typeof result === 'string' ? JSON.parse(result) : result;
                console.log('Parsed Staff Data:', staffData);
    
                // Assign values
                this.stafffirstName = staffData.Name;
                this.staffLastName = staffData.Last_Name__c;
                this.staffFullName = staffData.Name + ' ' + (staffData.Last_Name__c || '');
                this.staffEmailAddress = staffData.Email_Address__c || 'No Email';
                this.staffUserType = staffData.Type_of_User__c;

                //this.updateRoleOptions();
    
                // Debug values
                console.log('Full Name:', this.staffFullName);
                console.log('Email Address:', this.staffEmailAddress);
            })
            .catch(error => {
                console.error('Error fetching staff details:', error);
                this.error = error;
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

        this.paginatedData = this.paginatedData.map(staff => {
            if (staff.staffId === staffId) {
                return {
                    ...staff,
                    selectedUserType: selectedUserType
                };
            }
            return staff;
        });
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
                            isUserTypeDisabled: true
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

    handlesavebutton1(event){
        this.selectedStaffId = event.currentTarget.dataset.id;
        console.log('🟦 Opening modal for staffId:', this.selectedStaffId);

        const staffRow = this.paginatedData.find(
            staff => staff.staffId === this.selectedStaffId
        );

        if (!staffRow) {
            this.showToast('Error', 'Staff record not found.', 'error');
            return;
        }

        /* ==========================
        ROW LEVEL VALIDATION
        ========================== */
        if (!staffRow.selectedRole) {
            this.showToast('Error', 'Please select User Role.', 'error');
            return;
        }

        if (!staffRow.selectedUserType) {
            this.showToast('Error', 'Please select User Type.', 'error');
            return;
        }
        this.showModalUserCreate = true;
    }

    handleCloseModalUSerCreation(event){
        this.selectedStaffId = '';
        this.showModalUserCreate = false;
    }
}