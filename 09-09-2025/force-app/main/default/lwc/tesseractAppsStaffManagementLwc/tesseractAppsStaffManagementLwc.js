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
  
    userId = CURRENT_USER_ID;
    @track roleOptions = [];

    roleOptions = [
        { label: 'Org Admin', value: 'Portal account partner Executive' },
        { label: 'Roster Admin', value: 'Portal account partner Manager' },
        { label: 'Staff', value: 'Portal account partner User' }
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
                role.value === 'Portal account partner Manager' || 
                role.value === 'Portal account partner User'
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
                      this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                      this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
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
            this.userTypevalueforcurrentlogin === 'NDIS Org Admin'
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
    @wire(getstaffAccessDetails, { userId: '$userId' })
    wiredStaffAccessDetails({ error, data }) {
        if (data) {
            getCurrentLoggedUserInfo()
                .then((userInfo) => {
                    this.userTypevalueforcurrentlogin = userInfo.User_Type__c;
                    console.log('this.userTypevalueforcurrentlogin >>', this.userTypevalueforcurrentlogin);

                    // Ensure facilityValuefromcatch is available here
                    console.log('facilityValuefromcatch >>', this.facilityValuefromcatch);
                    console.log('wiredStaffAccessDetails >>', data);

                    this.userData = this.processUserData(data);
                    this.filteredStaffData = [...this.userData];
                    this.totalRecords = this.filteredStaffData.length;
                    this.paginateData();
                })
                .catch((error) => {
                    console.error('Error fetching current user info:', error);
                });
        } else if (error) {
            console.error('Error fetching staff access data:', error);
        }
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
        this.selectedRole = event.target.value;

        if (this.selectedRole) {
            this.isUserTypeDisabled = false;
            this.fetchUserTypeValues();
        } else {
            this.isUserTypeDisabled = true;
            this.UserTypeValues = [];
        }
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
         if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        }  
        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;

        this.paginatedData = this.filteredStaffData.slice(startIndex, endIndex);
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
        this.updatePaginationButtons();
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

    handleUserTypeChange(event){
        this.selectedUserType = event.target.value;
    }

    handlesavebutton(event){

        const roleInput = this.template.querySelector('lightning-combobox[data-id="role"]');
    const userTypeInput = this.template.querySelector('lightning-combobox[data-id="userType"]');

    // Validate fields
    const isRoleValid = roleInput.reportValidity();
    const isUserTypeValid = userTypeInput.reportValidity();

    // If any field is invalid, stop execution
    if (!isRoleValid || !isUserTypeValid) {
        return;
    }
        // Collect the data you want to send
    const staffDetails = {
        staffId: this.staffId,
        firstName: this.stafffirstName,
        lastName: this.staffLastName,
        email: this.staffEmailAddress,
        role: this.selectedRole,
        userType: this.selectedUserType,
        street: this.staffAddress?.street || '',
        city: this.staffAddress?.city || '',
        state: this.staffAddress?.state || '',
        postalCode: this.staffAddress?.postalCode || '',
        country: this.staffAddress?.country || ''
    };

    console.log('Sending staff details:', staffDetails);

    // Call the Apex method
    saveStaffDetails({ staffDetails: staffDetails })
        .then(result => {
            console.log('Staff saved successfully:', result);
            this.showToast('Success', 'User details updated. Changes will be applied within 3 hours.', 'success');
            this.selectedRole = '';
            this.selectedUserType = '';
            this.createUserModule = false; // Close the modal or module

        })
        .catch(error => {
            console.error('Error saving staff details:', error);
            this.showToast('Error', 'Failed to create User.', 'error');
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
}