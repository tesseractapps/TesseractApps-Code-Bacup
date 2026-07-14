import { LightningElement, wire, track } from 'lwc';
import getUserAccessDetails from '@salesforce/apex/UserAccessController.getUserAccessDetails';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import CURRENT_USER_ID from '@salesforce/user/Id';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

export default class TesseractAppsStaffReportsLwc extends LightningElement {
    @track searchUser = '';
    @track searchStaff = '';
    @track selectedRole = 'All';
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
    @track showModal = false; // Tracks whether the modal is displayed
    @track modalData = {}; // Holds data to display in the modal
    @track noRecordsFlag=false;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;

    userId = CURRENT_USER_ID;


    roleOptions = [
        { label: 'Org Admin', value: 'Portal account partner executive' },
        { label: 'Roster Admin', value: 'Portal account partner manager' },
        { label: 'Staff', value: 'Portal account partner User' },
        { label: 'All', value: 'All' },
    ];

    handlerolechange(event){
        this.selectedRole = event.target.value;
        console.log('this.selectedRole====>'+this.selectedRole);
    }

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
        //this.fetchOrgDetails();

        if (storedFacilityId && storedFacilityLabel) {
            this.facilityValuefromcatch = storedFacilityId;
            this.facilityLabelfromcatch = storedFacilityLabel;
        }
        console.log('User type IN connectedCallback:', this.userTypevalueforcurrentlogin);
        console.log('roleOptions in connectedCallback:', JSON.stringify(this.roleOptions));
        this.loadUserAccessDetails();
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


    // Utility function to convert a date to dd-mm-yyyy format
    formatDate(dateString) {
        if (!dateString) {
            return 'N/A'; // Return 'N/A' if the date is missing or invalid
        }
        const date = new Date(dateString);
        if (isNaN(date)) {
            return 'Invalid Date'; // Handle invalid date cases
        }
        const day = String(date.getDate()).padStart(2, '0'); // Add leading zero for day
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero for month
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Preprocess the user data to set 'N/A' where data is missing
    /*processUserData(data) {
        return data.map(user => ({
            ...user,
            userName: user.userName || 'N/A',
            staffGender: user.staffGender || 'N/A',
            staffFacility: user.staffFacility || 'N/A',
            userEmail: user.userEmail || 'N/A',
            staffRole: user.staffRole || 'N/A',
            staffType: user.staffType || 'N/A',
            userStatus: user.userStatus || 'N/A',
            staffActivatedDate: this.formatDate(user.staffActivatedDate), 
            staffCreatedDate: this.formatDate(user.staffCreatedDate)
        }));
    }*/

    processUserData(data) {
        console.log('User type:', this.userTypevalueforcurrentlogin);
        console.log('Facility from cache:', this.facilityValuefromcatch);

        // Helper to safely format each user
        const formatUser = (user) => ({
            
            ...user,
            userName: user.userName || 'N/A',
            staffGender: user.staffGender || 'N/A',
            staffNickName: user.staffNickName || user.userName,
            staffFacility: user.staffFacility || 'N/A',
            userEmail: user.userEmail || 'N/A',
            staffRole: user.staffRole || 'N/A',
            staffType: user.staffType || 'N/A',
            userStatus: user.userStatus || 'N/A',
            staffActivatedDate: this.formatDate(user.staffActivatedDate),
            staffCreatedDate: this.formatDate(user.staffCreatedDate),
            statusClass:
                user.userStatus === 'Active'
                    ? 'ta-badge ta-badge-success'
                    : user.userStatus === 'Inactive'
                    ? 'ta-badge ta-badge-error'
                    : 'ta-badge ta-badge-secondary'
        });

        // Case 2: Facility Admin / Roster Manager — filter by facility
        if (
            this.userTypevalueforcurrentlogin === 'Facility Admin' ||
            this.userTypevalueforcurrentlogin === 'Roster Manager' ||
            this.userTypevalueforcurrentlogin === 'NDIS Org Admin'
        ) {
            const filtered = data.filter((user) => {
                const userFacilityId = user.staffFacilityId?.toString().trim();
                const selectedFacilityId = this.facilityValuefromcatch?.toString().trim();
                const isMatch = userFacilityId === selectedFacilityId;

                console.log(
                    'Comparing facility:',
                    userFacilityId,
                    '===',
                    selectedFacilityId,
                    '=> Match:',
                    isMatch
                );

                return isMatch;
            });

            console.log('Filtered Staff Count:', filtered.length);

            return filtered.map(formatUser);
        }

        // Default: unknown user type
        console.warn('No matching role – returning empty list');
        return [];
    }


    // Call Apex method to get user and staff data
    /* @wire(getUserAccessDetails, { selectedroleValue: '$selectedRole', userId: '$userId', facilityValue: '$facilityValuefromcatch' })
    wiredUserAccessDetails({ error, data }) {
        if (data) {
            getCurrentLoggedUserInfo()
            .then((userInfo) => {
                this.userTypevalueforcurrentlogin = userInfo.User_Type__c;
                console.log('this.userTypevalueforcurrentlogin >>', this.userTypevalueforcurrentlogin);

                // Ensure facilityValuefromcatch is available here
                console.log('facilityValuefromcatch >>', this.facilityValuefromcatch);
                console.log('wiredStaffAccessDetails >>', data);

                console.log('data==>'+JSON.stringify(data));
                this.userData = this.processUserData(data);
                this.paginateData();
                
                // if (this.userTypevalueforcurrentlogin === 'ICT Admin' && Array.isArray(this.roleOptions)) {
                //     this.roleOptions = this.roleOptions.filter(role => role.value !== 'Portal account partner manager');
                //     console.log('🔒 Removed Admin from roleOptions for Ict user');
                // }
                // console.log('roleOptions in wiredUserAccessDetails:', JSON.stringify(this.roleOptions));
            })
            .catch((error) => {
                console.error('Error fetching current user info:', error);
            });
        } else if (error) {
            console.error('Error fetching user data:', error);
        }
    } */

    loadUserAccessDetails() {
        console.log('selectedRole >>', this.selectedRole);
        console.log('userId >>', this.userId);
        console.log('facilityValuefromcatch >>', this.facilityValuefromcatch);

        getUserAccessDetails({
            selectedroleValue: this.selectedRole,
            userId: this.userId,
            facilityValue: this.facilityValuefromcatch
        })
        .then((data) => {
            console.log('Apex Data >>', data);

            return getCurrentLoggedUserInfo()
                .then((userInfo) => {
                    this.userTypevalueforcurrentlogin = userInfo.User_Type__c;

                    console.log('userTypevalueforcurrentlogin >>', this.userTypevalueforcurrentlogin);

                    this.userData = this.processUserData(data);
                    this.paginateData();
                });
        })
        .catch((error) => {
            console.error('Imperative Apex Error >>', JSON.stringify(error));
            
            // 🔥 Show meaningful error
            if (error?.body?.message) {
                console.error('Apex Message:', error.body.message);
            }
        });
    }

    // Pagination and other methods remain unchanged...
    handleSearchUserChange(event) {
        this.searchUser = event.target.value;
        this.paginateData();
    }

    handleSearchStaffChange(event) {
        this.searchStaff = event.target.value;
        this.paginateData();
    }

    handleKeyup(event) {
        if (event.key === 'Enter') {
            this.paginateData();
        }
    }

    paginateData() {
        if (this.userData.length > 0) {
            this.noRecordsFlag = false;
        } else {
            this.noRecordsFlag = true;
        }  

        // ✅ Update total records
        this.totalRecords = this.userData.length;

        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        this.paginatedData = this.userData.slice(startIndex, endIndex);

        console.log('paginatedData ===> ' + JSON.stringify(this.paginatedData));

        this.totalPages = Math.ceil(this.userData.length / this.recordsPerPage);

        this.updatePaginationButtons();
    }


    updatePaginationButtons() {
        this.bDisableFirst = this.pageNumber === 1;
        this.bDisableLast = this.pageNumber === this.totalPages;
    }

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

    handleActionClick(event) {
        console.log('Action clicked for user:', event.target.dataset.id);
    }

    handleStaffView(event) {
        console.log('View clicked for user:', event.target.dataset.id);
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
                this.totalPages = Math.ceil(this.userData.length / this.recordsPerPage);
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
}