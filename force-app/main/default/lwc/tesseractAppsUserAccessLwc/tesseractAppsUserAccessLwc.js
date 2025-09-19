import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUserAccessDetails from '@salesforce/apex/UserAccessController.getUserAccessDetailsforAccessManager1';
import updateUserModuleNames from '@salesforce/apex/UserAccessController.updateUserModuleNames';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import getStaffDetails from '@salesforce/apex/UserAccessController.getStaffDetails';
import getUserModules from '@salesforce/apex/UserAccessController.getUserModules';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import updatestaffDetails from '@salesforce/apex/UserAccessController.updateStaffDetails';
import CURRENT_USER_ID from '@salesforce/user/Id';
import { refreshApex } from '@salesforce/apex';
export default class TesseractAppsUserAccessLwc extends LightningElement {
    @track searchStaff = '';
    @track paginatedData = [];
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track recordsPerPage = 10;
    @track bDisableFirst = true;
    @track bDisableLast = false;
    @track userData = []; // Holds all user data fetched from Apex
    @track pageSizeOptions = [10, 20, 50];
    @track showGrantAccessFlag = false;
    @track showModal = false;
    @track editButtonModule = false;
    @track staffId = '';
    @track modalData = {};
    @track selectedModules = [];
    @track availableModules = [];
    @track modulesChecked = [];
    @track formData = {}; // Form data for editing a user
    userId = CURRENT_USER_ID;
    @track userrolename = '';
    @track usertypename = '';
    wiredStaffData;
    wiredUserTypeResponse;
    @track editfirstname = '';
    @track editlastname = '';
    @track editstatus = false;
    @track editrole = '';
    @track editusertype = '';
    @track UserTypeValues = [];


    @track sectionFlags = {
        staffDetails: true,
        Addressdetails: false,
        EmploymentDetails: false,
        InvoiceDetails: true,
        TaxationDetails: true,
        PreTaxDeduction: false,
        PostTaxDeduction: false,
        EmergencyDetails: true,
        BankDetails: true,
        SuperannuationDetails: true,
        Leaves: false,
        ApproversDetails: false,
        staffDocumentation: false,


        staffDetails1: true,
        Addressdetails1: false,
        EmploymentDetails1: false,
        InvoiceDetails1: true,
        TaxationDetails1: true,
        PreTaxDeduction1: false,
        PostTaxDeduction1: false,
        EmergencyDetails1: true,
        BankDetails1: true,
        SuperannuationDetails1: true,
        Leaves1: false,
        ApproversDetails1: false,
        staffDocumentation1: false,
    };

    // All available modules mapped to user types
    moduleMap = {
        'NDIS Org Admin': ['Admin', 'Human Resources', 'Incident Register', 'Payroll', 'Participants', 'Repository', 'Roster Management', 'Sign In','My Profile','Accounting','Performance Management', 'Access Manager', 'T Sign', 'Forms'],
        'HR Admin': [ 'Human Resources', 'Performance Management', 'T Sign', 'Incident Register', 'Repository', 'Access Manager', 'My Profile'],
        'Payroll Admin' : ['Payroll','Accounting', 'Incident Register', 'Repository'],
        'Roster Manager' : ['Roster Management', 'Human Resources', 'Sign In', 'Participants','Accounting', 'T Sign', 'Access Manager', 'Incident Register', 'Repository', 'Performance Management', 'My Profile', 'Payroll', 'Forms'],
        'ICT Admin' : ['Admin', 'Payroll', 'Human Resources',  'ICT Timesheets', 'T Sign', 'Incident Register', 'My Profile', 'Repository', 'Access Manager'],
        'NDIS Staff' : [ 'Roster Management','Participants','Sign In', 'Incident Register', 'Repository', 'Performance Management', 'My Profile'],
        'ICT Staff' : [ 'My Profile', 'Repository','ICT Timesheets'],
        'NDIS Participants' :['Participants','Incident Register'],
        'Payroll Accountant for Multiple' :['Payroll'],
        'Accountant for Organisation' :['Payroll', 'Accounting'],   
    };

    handleSearchStaffChange(event) {
        this.searchStaff = event.target.value;
        this.paginateData();
    }

    handleStatusChange(event) {
        const newStatus = event.target.checked ? 'Active' : 'Inactive';
        this.user.staffStatus = newStatus;

        this.updateUserStatusInBackend(this.staffId);
        this.showToast('Success', `Status for ${this.user.staffName} has been updated to ${this.user.staffStatus}.`, 'success');
    }

    processUserData(data) {
        console.log('Raw Data:', JSON.stringify(data, null, 2));
        return data
            .filter(user => user.staffId) // Remove users without staffId
            .map(user => ({
                ...user,
                staffId: user.staffId || 'N/A',
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                userEmail: user.userEmail,
                userRole: user.userRole,
                userType: user.userType,
                userStatus: user.userStatus,
                staffName: user.staffName || 'N/A',
                staffGender: user.staffGender || 'N/A',
                staffFacility: user.staffFacility || 'N/A',
                staffEmail: user.staffEmail || 'N/A',
                staffUserRole1: user.staffUserRole1 || 'N/A',
                staffUserType: user.staffUserType && user.staffUserType.trim() ? user.staffUserType : 'N/A', 
                staffStatus: user.staffStatus || 'In-Progress', // Default to 'In-Progress' if null/undefined
            }));
    }

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


    @wire(getUserAccessDetails, { userId: '$userId' })
    wiredUserAccessDetails({ error, data }) {
        if (data) {
            this.userData = this.processUserData(data);
            this.totalRecords = this.userData.length;
            this.paginateData();
        } else if (error) {
            this.showToast('Error', 'Failed to fetch user data.', 'error');
        }
    }

   @wire(getUserTypeValuesfromOrg, { selectedroleValue: '$selectedRole', userId: '$userId' })
    wiredMultiPicklistValues(response) {
        console.log('Apex refresh');
        this.wiredUserTypeResponse = response; // Store response for refresh
        const { error, data } = response;
        
        if (data) {
            console.log('User Type Values received:', data);
            this.UserTypeValues = data.map(item => ({ label: item, value: item }));
        } else if (error) {
            console.error('Error fetching User Type values', error);
        }
    }

    @wire(getUserModules, { userIds: '$userId' })
wiredUserModules(result) {
    this.wiredStaffData = result; // Store the result to use in the component

    if (result.data) {
        console.log('Fetched Wired Staff Data:', result.data);

        this.selectedModules = [];
        this.userTypemodules = '';
        this.availableModules = [];

        if (Array.isArray(result.data) && result.data.length > 0) {
            this.userTypemodules = result.data[0].UserType; // Get User Type
            const fetchedModules = result.data[0].Modules || []; // Modules fetched from Apex

            // Get allowed modules for the user type from moduleMap
            const allowedModules = this.moduleMap[this.userTypemodules] || [];

            // Create availableModules list
            this.availableModules = allowedModules.map(module => ({
                name: module,
                selected: fetchedModules.includes(module) // Select only if it's in fetchedModules
            }));

            // Extract only the selected module names
            this.selectedModules = this.availableModules
                .filter(module => module.selected)
                .map(module => module.name);
        }

        console.log('this.selectedModules===>'+this.selectedModules);

        this.updateModules(); // Call update after data is fetched
    } else if (result.error) {
        console.error('Error fetching modules:', result.error);
    }
}
  

    refreshData() {        
        refreshApex(this.wiredStaffData);  // Refresh the wire result                
    }

    updateModules() {
        const userType = this.modalData.userType;        
        // Ensure moduleMap is valid and userType exists in it
        this.availableModules = Array.isArray(this.moduleMap[userType]) ? this.moduleMap[userType] : [];
        
        // Ensure selectedModules is in the correct format
        if (typeof this.selectedModules === 'string') {
            this.selectedModules = this.selectedModules.split(';');
        }        
        
        // Check for availableModules and update modulesChecked
        this.modulesChecked = this.availableModules.map(module => ({
            name: module,
            checked: this.selectedModules.includes(module),
        }));
    }    

    handleCheckboxChange(event) {
        const moduleName = event.target.name;
        const checked = event.target.checked;
    
        // Update selectedModules based on checked status
        if (checked) {
            this.selectedModules.push(moduleName);  // Add to selectedModules
        } else {
            const index = this.selectedModules.indexOf(moduleName);
            if (index > -1) {
                this.selectedModules.splice(index, 1);  // Remove from selectedModules
            }
        }
    }

    showGrantAccess(event) {
        const userId = event.target.dataset.id;
        if (!userId) {
            this.showToast('Error', 'Staff ID is missing.', 'error');
            return;
        }
    
        this.userId = userId;  // Set the userId to trigger the wire service again
        this.modalData = null;          
    
        const selectedUser = this.userData.find(user => user.userId === userId);        
    
        if (selectedUser) {
            this.modalData = selectedUser;
            // Initialize selectedModules with the previous selections
            if (selectedUser.Module_Names__c) {
                this.selectedModules = selectedUser.Module_Names__c.split(';');                
            }
            this.updateModules();
            this.showModal = true;
        } else {
            this.showToast('Warning', 'No matching user found.', 'warning');
        }
    }

    handleConfirmReset() {
        if (!this.userId) {
            this.showToast('Error', 'User ID is not available. Please try again.', 'error');
            return;
        }
        
        if (this.selectedModules.length > 0) {            
            const modulesString = this.selectedModules.join(';');
            console.log('Save the modules after editing:', modulesString);
            console.log('Modules to update:', modulesString);
            console.log('this.userId===>'+this.userId);

            updateUserModuleNames({ userIds: [this.userId], modules: modulesString })
                .then(() => {

                    this.showModal = false;
                    this.showToast('Success', 'User modules updated successfully.', 'success');
                    console.log('userId==>'+this.userId);
                    // Trigger wire service refresh when opening the modal
                    this.refreshData();
                })
                .catch(error => {
                    console.error('Error updating modules:', error);
                    this.showToast('Error', 'Failed to update user modules.', 'error');
                });
        } else {
            this.showToast('Warning', 'No modules selected to update.', 'warning');
        }
    }

    handleCloseModal() {        
        this.showModal = false;
        this.modalData = {};
    }

    handleCheckboxChange(event) {
        const moduleName = event.target.value;
        const isChecked = event.target.checked;        
        
        if (isChecked) {            
            this.selectedModules = [...this.selectedModules, moduleName];
            
        } else {
            this.selectedModules = this.selectedModules.filter(module => module !== moduleName);            
        }        
    }

    handleSearchUserChange(event) {
        this.searchUser = event.target.value;
        this.paginateData();
    }

    paginateData() {
        let filteredData = this.userData.filter(user => user.staffName.includes(this.searchStaff));
        this.totalRecords = filteredData.length;
        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        this.paginatedData = filteredData.slice(startIndex, endIndex);
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
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
        console.log('event.target.dataset.id==>' + event.target.dataset.id);
        this.staffId = event.target.dataset.id;
    
        getStaffDetails({ staffId: this.staffId })
            .then(result => {
                console.log('result====>' + JSON.stringify(result));
    
                this.formData = {
                    staff: { ...result.staff },
                    user: { 
                        ...result.user, 
                        User_Role__c: result.user.User_Role__c || '', 
                        User_Type__c: result.user.User_Type__c || ''  
                    }
                };
    
                // Assign values to component properties
                this.usertypename = this.formData.user.User_Type__c;  // Assign User_Type__c
    
                this.editButtonModule = true;
                console.log('Original User Role:', this.formData.user.User_Role__c);
                console.log('Original User Type:', this.usertypename);  // Fixed this line
            })
            .catch(error => {
                this.showToast('Error', 'Failed to load staff details', 'error');
            });
    }

    // Icons for the toggle buttons
    @track sectionIcons = {
        staffDetails: '\u2B9F', 
        Addressdetails: '\u2B9C',
        EmploymentDetails: '\u2B9C',
        InvoiceDetails: '\u2B9F',
        TaxationDetails: '\u2B9F',
        PreTaxDeduction: '\u2B9C',
        PostTaxDeduction: '\u2B9C',
        EmergencyDetails: '\u2B9F',
        BankDetails: '\u2B9F',
        SuperannuationDetails: '\u2B9F', 
        Leaves: '\u2B9C',
        ApproversDetails: '\u2B9C',
        staffDocumentation: '\u2B9C', 

        staffDetails1: '\u2B9F', 
        Addressdetails1: '\u2B9C',
        EmploymentDetails1: '\u2B9C',
        InvoiceDetails1: '\u2B9F',
        TaxationDetails1: '\u2B9F',
        PreTaxDeduction1: '\u2B9C',
        PostTaxDeduction1: '\u2B9C',
        EmergencyDetails1: '\u2B9F',
        BankDetails1: '\u2B9F',
        SuperannuationDetails1: '\u2B9F', 
        Leaves1: '\u2B9C',
        ApproversDetails1: '\u2B9C',
        staffDocumentation1: '\u2B9C',
    };

    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id;
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
    
    

    // Getter function to format user role dynamically
    // Getter function to format user role dynamically
    get formattedUserRole() {
        if (this.formData.user && this.formData.user.User_Role__c) {
            let formattedRole = this.formatRoleName(this.formData.user.User_Role__c);
            
            // Only update and refresh if value changes
            if (this.selectedRole !== formattedRole) {
                this.selectedRole = formattedRole;
                this.userId = this.formData.user.Id; // Ensure userId is updated

                console.log('this.selectedRole===>' + this.selectedRole);
                console.log('this.userId===>' + this.userId);

                // Refresh the wire method when role changes
                if (this.wiredUserTypeResponse) {
                    refreshApex(this.wiredUserTypeResponse);
                }
            }
            return formattedRole;
        }
        return '';
    }


    // Function to format user role
    formatRoleName(userRole) {
        if (!userRole) return '';  // Handle empty values
        let words = userRole.split(' ');  
        if (words.length > 1) {
            words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);  
            words[words.length - 1] = words[words.length - 1].charAt(0).toUpperCase() + words[words.length - 1].slice(1);
            for (let i = 1; i < words.length - 1; i++) {
                words[i] = words[i];
            }
        }
        return words.join(' ');  
    }

    handleUserFirstNameChange(event){
        this.editfirstname = event.target.value;
        
    }

    handleUserLastNameChange(event){
        this.editlastname = event.target.value;
    }
    
    handleUserStatusChange(event) {
        this.editstatus = event.target.checked; // ✅ Always gets true/false
        console.log('Checkbox status changed:', this.editstatus);
    }

    handlerolechange(event){
        this.selectedRole = event.target.value;
        this.userId = this.formData.user.Id;
        this.editrole = event.target.value;
        this.fetchUserTypeValues();
    }

    fetchUserTypeValues() {
        getUserTypeValuesfromOrg({ selectedroleValue: this.selectedRole, userId: this.userId })
            .then((data) => {
                this.UserTypeValues = data.map((item) => ({ label: item, value: item }));
            })
            .catch((error) => {;
            });
    }

    handleUserTypeChange(event){
        this.editusertype = event.target.value;
    }

    handlesavebutton(event) {
        console.log('Save button clicked');
    
        if (!this.formData || !this.formData.user || !this.formData.staff) {
            console.error('formData is not initialized properly.');
            return;
        }
    
        console.log('this.editstatus before save:', this.editstatus);
        console.log('Existing status value:', this.formData.staff.Status__c); // Debugging existing value
    
        const userData = {
            staffId: this.formData.user.staffId || this.formData.staff.Id, 
            firstName: this.editfirstname !== undefined && this.editfirstname !== '' 
                        ? this.editfirstname 
                        : this.formData.user.FirstName,
            lastName: this.editlastname !== undefined && this.editlastname !== '' 
                        ? this.editlastname 
                        : this.formData.user.LastName,
                        status: this.editstatus == true // ✅ Check if `editstatus` was actually changed
                        ? this.editstatus  // ✅ Use the new value
                        : this.formData.staff.Status__c,  // ✅ Else, retain the old value
            role: this.editrole !== undefined && this.editrole !== '' 
                        ? this.editrole 
                        : this.formData.user.User_Role__c,
            userType: this.editusertype !== undefined && this.editusertype !== '' 
                        ? this.editusertype 
                        : this.formData.user.User_Type__c
        };
    
        console.log('Final User Data before saving:', JSON.stringify(userData));
    
        if (!userData.staffId) {
            console.error('Error: staffId is missing.');
            return;
        }
    
        this.editButtonModule = false;
    
        updatestaffDetails({ userDetails: userData })
            .then(result => {
                console.log('Update Success:', result);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'User details updated successfully. Changes will be reflected within the next 3 hours.',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.error('Update Error:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Error updating user details',
                        variant: 'error'
                    })
                );
            });
    }
    
    
    
    
    handleInputChange(event) {
        const fieldName = event.target.name;
        this.formData = { ...this.formData, [fieldName]: event.target.value };
    }

    handleStatusChange(event) {
        this.formData = { ...this.formData, Status__c: event.target.checked };
    }
    

    handleClose() {
        this.editButtonModule = false;
        this.recordId = null;
    }

    handleSuccess(event) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Changes Saved Successfully',
            variant: 'success'
        }));
        this.editButtonModule = false;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}