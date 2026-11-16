import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUserAccessDetails from '@salesforce/apex/UserAccessController.getUserAccessDetailsforresetPassword';
import resetPortalPassword from '@salesforce/apex/UserAccessController.resetPortalPassword';
import CURRENT_USER_ID from '@salesforce/user/Id';

export default class TesseractAppsResetPasswordLwc extends LightningElement {
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

    userId = CURRENT_USER_ID;

    // Process the user data
    processUserData(data) {
        return data.map((user) => ({
            ...user,
            userName: user.userName || 'N/A',
            staffName: user.staffName || 'N/A',
        }));
    }

    // Fetch user data from Apex
    @wire(getUserAccessDetails, { userId: '$userId' })
    wiredUserAccessDetails({ error, data }) {
        if (data) {
            console.log('data==>'+JSON.stringify(data));
            this.userData = this.processUserData(data);
            this.userDataBackup = [...this.userData]; // ✅ Add this
            this.filteredStaffData = [...this.userData];
            this.totalRecords = this.filteredStaffData.length;
            this.paginateData();
        } else if (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Filter the data based on the search input
    filterStaffData() {
        this.filteredStaffData = this.userData.filter((user) => {
            const matchesSearchStaff = this.searchStaff
                ? user.staffName.toLowerCase().includes(this.searchStaff.toLowerCase())
                : true;
            return matchesSearchStaff;
        });
        this.totalRecords = this.filteredStaffData.length;
        this.pageNumber = 1; // Reset to the first page
        this.paginateData();
    }

    // Handle changes in the search input
    // handleSearchStaffChange(event) {
    //     this.searchStaff = event.target.value;
    // }

    handleSearchStaffChange(event) {
    this.searchStaff = event.target.value;
    const searchKey = this.searchStaff.toLowerCase().trim();

    // Filter across name, email, role, etc.
    this.filteredStaffData = (this.userData || []).filter(user => {
        const staffName = (user.staffName || '').toLowerCase();
        const userName = (user.userName || '').toLowerCase();
        const email = (user.userEmail || '').toLowerCase();
        const role = (user.staffRole || '').toLowerCase();
        const userType = (user.userType || '').toLowerCase();

        return (
            staffName.includes(searchKey) ||
            userName.includes(searchKey) ||
            email.includes(searchKey) ||
            role.includes(searchKey) ||
            userType.includes(searchKey)
        );
    });

    this.totalRecords = this.filteredStaffData.length;
    this.pageNumber = 1;
    this.paginateData();
}


    // Handle the Enter key press
    handleKeyup(event) {
        if (event.key === 'Enter') {
            console.log('🔍 Enter key pressed for search');

            const searchKey = this.searchStaff.toLowerCase().trim();
            console.log('🔡 Normalized search key:', searchKey);

            // Filter across name, email, role, etc.
            this.filteredStaffData = this.userData.filter(user => {
                const staffName = (user.staffName || '').toLowerCase();
                const userName = (user.userName || '').toLowerCase();
                const email = (user.userEmail || '').toLowerCase();
                const role = (user.staffRole || '').toLowerCase();
                const userType = (user.userType || '').toLowerCase();

                return (
                    staffName.includes(searchKey) ||
                    userName.includes(searchKey) ||
                    email.includes(searchKey) ||
                    role.includes(searchKey) ||
                    userType.includes(searchKey)
                );
            });

            console.log('✅ Filtered count:', this.filteredStaffData.length);
            this.totalRecords = this.filteredStaffData.length;
            this.pageNumber = 1;
            this.paginateData();
        }
    }

    handleCloseModal(event){
        this.showModal = false;
    }

    // Paginate the filtered data
    paginateData() {
        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        this.paginatedData = this.filteredStaffData.slice(startIndex, endIndex);
        console.log('paginatedData==>'+JSON.stringify(this.paginatedData));
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

    // Handle reset password logic
    handleConfirmReset(event) {
        const selectedUserId = this.modalData.userId;
        if (!selectedUserId) {
            this.showToast('Error', 'No user selected for password reset.', 'error');
            return;
        }

        resetPortalPassword({ ResetpasswordUserId: selectedUserId })
            .then((result) => {
                    this.showToast('Success', 'Password Successfully Generated', 'success');
                this.showModal = false;
            })
            .catch((error) => {
                console.error('Error resetting password:', error);
                this.showToast('Error', 'Failed to reset password.', 'error');
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