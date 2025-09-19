import { LightningElement, wire, track } from 'lwc';
import getUserAccessDetails from '@salesforce/apex/UserAccessController.getUserAccessDetails';
import CURRENT_USER_ID from '@salesforce/user/Id';

export default class TesseractAppsStaffReportsLwc extends LightningElement {
    @track searchUser = '';
    @track searchStaff = '';
    @track selectedRole = 'All';
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
    processUserData(data) {
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
    }

    // Call Apex method to get user and staff data
    @wire(getUserAccessDetails, { selectedroleValue: '$selectedRole', userId: '$userId' })
    wiredUserAccessDetails({ error, data }) {
        if (data) {
            console.log('data==>'+JSON.stringify(data));
            this.userData = this.processUserData(data);
            this.totalRecords = data.length;
            this.paginateData();
        } else if (error) {
            console.error('Error fetching user data:', error);
        }
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
        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        this.paginatedData = this.userData.slice(startIndex, endIndex);
        console.log('paginatedData===>'+JSON.stringify(this.paginatedData));
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

    handleRecordsPerPage(event) {
        this.recordsPerPage = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.paginateData();
    }

    handleActionClick(event) {
        console.log('Action clicked for user:', event.target.dataset.id);
    }

    handleStaffView(event) {
        console.log('View clicked for user:', event.target.dataset.id);
    }
}