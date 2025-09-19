import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUserAccessDetails from '@salesforce/apex/UserAccessController.getUserAccessDetailsforAccessManager1';
import updateUserModuleNames from '@salesforce/apex/UserAccessController.updateUserModuleNames';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues1';
import getUserTypeValuesfromOrg1  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import getStaffDetails from '@salesforce/apex/UserAccessController.getStaffDetails';
import getUserModules from '@salesforce/apex/UserAccessController.getUserModules';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import resetPortalPassword from '@salesforce/apex/UserAccessController.resetPortalPassword';
import updatestaffDetails from '@salesforce/apex/UserAccessController.updateStaffDetails';
import CURRENT_USER_ID from '@salesforce/user/Id';
import { refreshApex } from '@salesforce/apex';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import TypeofUser from '@salesforce/schema/User.Type_of_User__c';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getFacilityUserWise from '@salesforce/apex/PortalUserController.getFacilityUserWise';
import insertFacicilityAssociation from '@salesforce/apex/PortalUserController.insertFacicilityAssociation';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';


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
    @track formattedUserRole1 = '';
    @track resetPasswordModal = false;
    @track openFacilityAccess=false;
    @track facilityOptions=[];
    @track selectedFacilities=[];
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track userType;
    @track usererror;
    @track userFacilities=[];
    @track finalListFacilities=[];
    wiredFacilitiesResult;
    @track accessUserId;
    @track updatedFacilityValues=[];
    @track facilityAccesUserRole;
    @track facilityAccessUserType;
    @track currentUserType;


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
        'NDIS Org Admin': ['Admin', 'Human Resources', 'Incident Register', 'Participants', 'Repository', 'Roster Manager', 'Sign In','My Profile','Accounting', 'Access Manager', 'T sign'],
        'HR Admin': [ 'Human Resources', 'T sign', 'Incident Register', 'Repository', 'Access Manager', 'My Profile'],
        'Payroll Admin' : ['Accounting', 'Incident Register', 'Repository'],
        'Roster Manager' : ['Roster Manager', 'Human Resources', 'Sign In', 'Participants','Accounting', 'T sign', 'Access Manager', 'Incident Register', 'Repository', 'My Profile'],
        'ICT Admin' : ['Admin', 'Accounting', 'Human Resources',  'ICT Timesheets', 'T sign', 'My Profile', 'Repository', 'Access Manager'],
        'NDIS Staff' : [ 'Roster Manager','Participants','Sign In', 'Incident Register', 'Repository', 'My Profile'],
        'ICT Staff' : [ 'My Profile', 'Repository','ICT Timesheets'],
        'NDIS Participants' :['Participants','Incident Register'],
        'Payroll Accountant for Multiple' :['Accounting'],
        'Accountant for Organisation' :['Admin', 'Accounting'],   
    };

    @track userTypevalueforcurrentlogin;
    @track facilityValuefromcatch;
    @track facilityLabelfromcatch;

    connectedCallback() {
        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');

        console.log('storedFacilityId >>', storedFacilityId);
        console.log('storedFacilityLabel >>', storedFacilityLabel);

        if (storedFacilityId && storedFacilityLabel) {
            this.facilityValuefromcatch = storedFacilityId;
            this.facilityLabelfromcatch = storedFacilityLabel;
        }
        
    }

    handleSearchStaffChange(event) {
        this.searchStaff = event.target.value;
        this.paginateData();
    }

    @track staffList = [];
    handleSearchStaffKeyDown(event) {
        if (event.key === 'Enter') {
            console.log('🔍 Enter key pressed');

            this.searchStaff = event.target.value;
            const searchKey = this.searchStaff.toLowerCase().trim();
            console.log('🔡 Search input:', searchKey);

            // Make sure we have the original unfiltered data
            const allUsers = this.userDataBackup || this.userData || [];
            console.log('📋 Total original users:', allUsers.length);

            if (!searchKey) {
                this.userData = [...allUsers];
            } else {
                this.userData = allUsers.filter(user => {
                    const staffName = (user.staffName || '').toLowerCase();
                    const firstName = (user.firstName || '').toLowerCase();
                    const lastName = (user.lastName || '').toLowerCase();
                    const email = (user.userEmail || '').toLowerCase();
                    const role = (user.userRole || '').toLowerCase();

                    return (
                        staffName.includes(searchKey) ||
                        firstName.includes(searchKey) ||
                        lastName.includes(searchKey) ||
                        email.includes(searchKey) ||
                        role.includes(searchKey)
                    );
                });
            }

            console.log('✅ Filtered user count:', this.userData.length);
            this.paginateData();
        }
    }
      @wire(getRecord, { recordId: CURRENT_USER_ID, fields: [UserNameFld ,UserEmail,UsrRoleName,UserType,TypeofUser]}) 
     userDetails({error, data}) {
         if (data) {
             this.currentUser = data.fields.Name.value; 
             this.currentUserEmail=data.fields.Email.value;
             this.currentUserRole =data.fields.User_Role__c.value;
             this.currentTypeofUser = data.fields.Type_of_User__c.value;
             this.userType=data.fields.User_Type__c.value;
              console.log('role==>'+this.currentUserRole);
              console.log('current logged in user==>'+this.currentUser) ; 
               console.log('current logged in email==>'+ this.currentUserEmail) ;
              console.log('current logged in userType==>'+ this.userType) ;
              if(this.userType == 'NDIS Org Admin' || this.userType == 'Facility Admin' || this.userType == 'ICT Admin'){
                this.currentUserType = true;
              }
                console.log('Fetching facility data from Apex...');
                getFacilityData().then(response => {
                    console.log('Facility data fetched successfully:', response);
                    this.finalListFacilities=[];
                    this.selectedFacilities=[];
                    this.facilityOptions = response.map(record => ({
                        label: record.Name,
                        value: record.Id
                    }));
                    if( this.userType =='NDIS Org Admin' || this.userType == 'ICT Admin'){
                        this.finalListFacilities=this.facilityOptions  ;
                           console.log('Mapped facility options: FOR ORG ADMIN', JSON.stringify(this.finalListFacilities));
                            
                    }else if(this.userType =='Facility Admin' || this.userType =='HR Admin' || this.userType =='Roster Manager'){
                    
                                    getFacilityCurrentUser().then(result => {
                                        console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                             this.finalListFacilities =  result.map(record => ({
                                                                        label: record.Facility__r.Name,
                                                                        value: record.Facility__r.Id
                                                               })); 
                                            console.log('Mapped facility options: Facility Admin', JSON.stringify(this.finalListFacilities));
                                        }).catch(error => {
                                            this.error = error;
                                            console.error('Error fetching facilities:', error);
                                 });
                                            
                    }
                                    
                 
                })
                .catch(err => {
                    console.error('Error fetching facility data:', err);
                });

                } else if (error) {  
                        this.usererror = error ;
          }
     }



    handleSearchStaffInput(event) {
        const searchKey = event.detail.value.toLowerCase().trim();  // ← Real-time value

        const allUsers = this.userDataBackup || this.userData || [];

        if (!searchKey) {
            this.userData = [...allUsers];
        } else {
            this.userData = allUsers.filter(user => {
                const staffName = (user.staffName || '').toLowerCase();
                const firstName = (user.firstName || '').toLowerCase();
                const lastName = (user.lastName || '').toLowerCase();
                const email = (user.userEmail || '').toLowerCase();
                const role = (user.userRole || '').toLowerCase();
                const staffNickName = (user.staffNickName || '').toLowerCase();

                return (
                    staffName.includes(searchKey) ||
                    firstName.includes(searchKey) ||
                    lastName.includes(searchKey) ||
                    email.includes(searchKey) ||
                    role.includes(searchKey) ||
                    staffNickName.includes(searchKey)
                );
            });
        }

        this.searchStaff = event.detail.value; // Update after processing

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
        console.log('Current User Type:', this.userTypevalueforcurrentlogin);
        console.log('Facility Value to Match:', this.facilityValuefromcatch);

        // For Roster Manager, filter by staffFacilityId
        const dataToProcess = (this.userTypevalueforcurrentlogin =='Facility Admin' || this.userTypevalueforcurrentlogin =='HR Admin' || this.userTypevalueforcurrentlogin =='Roster Manager' || this.userTypevalueforcurrentlogin =='NDIS Org Admin' ||  this.userTypevalueforcurrentlogin =='ICT Admin')
            ? data.filter(user => user.staffFacilityId === this.facilityValuefromcatch)
            : data;

        console.log('Filtered Data:', JSON.stringify(dataToProcess, null, 2));

        return dataToProcess
            .filter(user => user.staffId)
            .map(user => ({
                ...user,
                staffId: user.staffId || 'N/A',
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                nickName: user.staffNickName,
                userEmail: user.userEmail,
                userRole: user.userRole,
                userType: user.userType === 'NDIS Participants' ? 'NDIS Participant' : (user.userType || 'N/A'),
                userStatus: user.userStatus === 'Inctive' ? 'Inactive' : user.userStatus,
                staffName: user.staffName || 'N/A',
                staffGender: user.staffGender || 'N/A',
                staffFacility: user.staffFacility || 'N/A',
                staffFacilityId: user.staffFacilityId || 'N/A',
                staffEmail: user.staffEmail || 'N/A',
                staffUserRole1: user.staffuserrole1 || 'N/A',
                staffUserType: user.staffuserType?.trim() || 'N/A',
                staffStatus: user.staffStatus || 'In-Progress',
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
                role.value === 'Portal account partner Executive' || 
                role.value === 'Portal account partner User'
            );
        }
    }


    @wire(getUserAccessDetails, { userId: '$userId' })
    wiredUserAccessDetails({ error, data }) {
        if (data) {
            getCurrentLoggedUserInfo()
                .then((userInfo) => {
                    this.userTypevalueforcurrentlogin = userInfo.User_Type__c;
                    console.log('this.userTypevalueforcurrentlogin >>', this.userTypevalueforcurrentlogin);
                    
                    const processed = this.processUserData(data);
                    this.userData = [...processed];
                    this.userDataBackup = [...processed]; // <- set this once!
                    this.totalRecords = this.userData.length;
                    
                    this.paginateData();
                })
                .catch((error) => {
                    console.error('Error fetching current user info:', error);
                });
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
        this.wiredStaffData = result; // Store the result for reuse if needed

        if (result.data) {
            console.log('Fetched Wired Staff Data:', result.data);

            // Reset all related properties
            this.selectedModules = [];
            this.userTypemodules = '';
            this.availableModules = [];
            this.allowedModules = [];

            if (Array.isArray(result.data) && result.data.length > 0) {
                // Safely extract string values from arrays or handle direct strings
                this.userTypemodules = Array.isArray(result.data[0].userTypeInModules)
                    ? result.data[0].userTypeInModules[0]
                    : result.data[0].userTypeInModules;

                const typeofUser = Array.isArray(result.data[0].TypeofUserInModules)
                    ? result.data[0].TypeofUserInModules[0]
                    : result.data[0].TypeofUserInModules;

                const fetchedModules = result.data[0].Modules || []; // List of module names

                console.log('userTypemodules:', this.userTypemodules);
                console.log('typeofUser:', typeofUser);

                // Handle Facility Admin based on user type
                if (this.userTypemodules === 'Facility Admin') {
                    console.log('userTypemodules:', this.userTypemodules);

                    if (typeofUser === 'NDIS') {
                        console.log('typeofUser:', typeofUser);
                        this.allowedModules = [
                            'Admin', 'Roster Manager', 'Human Resources', 'Sign In',
                            'Participants', 'Accounting', 'T sign', 'Access Manager',
                            'Incident Register', 'Repository', 'My Profile'
                        ];
                    } else if (typeofUser === 'ICT') {
                        console.log('typeofUser:', typeofUser);
                        this.allowedModules = [
                            'Admin', 'Accounting', 'Human Resources', 'ICT Timesheets',
                            'T sign', 'My Profile', 'Repository', 'Access Manager'
                        ];
                    } else {
                        console.warn('Unknown userType for Facility Admin:', typeofUser);
                        this.allowedModules = [];
                    }
                } else {
                    // Fallback to moduleMap for other user types
                    this.allowedModules = this.moduleMap[this.userTypemodules] || [];
                }

                console.log('this.allowedModules >>', JSON.stringify(this.allowedModules));

                // Build availableModules list with selection state
                this.availableModules = this.allowedModules.map(module => ({
                    name: module,
                    selected: fetchedModules.includes(module)
                }));

                // Extract just the selected module names
                this.selectedModules = this.availableModules
                    .filter(module => module.selected)
                    .map(module => module.name);
            }

            console.log('this.selectedModules ===>', this.selectedModules);
            this.updateModules(); // Proceed with next steps (like rendering or saving)
        } else if (result.error) {
            console.error('Error fetching modules:', result.error);
        }
    }

    refreshData() {        
        refreshApex(this.wiredStaffData);  // Refresh the wire result                
    }

    updateModules() {
        const userType = this.modalData.userType;   
        const typeofUser = this.modalData.staffType;

        console.log('userType in Update Module >>', userType);
        console.log('typeofUser in Update Module >>', typeofUser); 

        if (userType === 'Facility Admin') {
            console.log('userType in Update Module >>', userType);
            if (typeofUser === 'NDIS User') {
                console.log('typeofUser in Update Module >>', typeofUser); 
                this.availableModules = ['Admin', 'Roster Manager', 'Human Resources', 'Sign In', 'Participants', 'Accounting', 'T sign', 'Access Manager', 'Incident Register', 'Repository', 'My Profile'];
            } else if (typeofUser === 'ICT User') {
                console.log('typeofUser in Update Module >>', typeofUser); 
                this.availableModules = ['Admin', 'Accounting', 'Human Resources', 'ICT Timesheets', 'T sign', 'My Profile', 'Repository', 'Access Manager'];
            } else {
                this.availableModules = [];
                console.warn('Unknown userType for Facility Admin:', userType);
            }
        } else {
            // ✅ Correct usage: typeofUser maps to moduleMap key
            this.availableModules = Array.isArray(this.moduleMap[userType]) ? this.moduleMap[userType] : [];
        }

        console.log('this.availableModules >>', JSON.stringify(this.availableModules));

        // Normalize selectedModules from string to array
        if (typeof this.selectedModules === 'string') {
            this.selectedModules = this.selectedModules.split(';');
        }

        // Generate module checkbox state
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
        this.openFacilityAccess=false;
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

    paginateData() {
        const searchValue = this.searchStaff ? this.searchStaff.toLowerCase() : '';
        const sourceData = this.userDataBackup || [];

        let filteredData = sourceData;

        if (searchValue) {
            filteredData = sourceData.filter(user => {
                const staffName = (user.staffName || '').toLowerCase();
                const firstName = (user.firstName || '').toLowerCase();
                const lastName = (user.lastName || '').toLowerCase();
                const email = (user.userEmail || '').toLowerCase();
                const role = (user.userRole || '').toLowerCase();
                const staffNickName = (user.staffNickName || '').toLowerCase();

                return (
                    staffName.includes(searchValue) ||
                    firstName.includes(searchValue) ||
                    lastName.includes(searchValue) ||
                    email.includes(searchValue) ||
                    role.includes(searchValue) ||
                    staffNickName.includes(searchValue)
                );
            });
        }

        this.totalRecords = filteredData.length;
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);

        if (this.pageNumber > this.totalPages) {
            this.pageNumber = 1;
        }

        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;

        this.paginatedData = filteredData.slice(startIndex, endIndex);

        console.log('Search:', searchValue);
        console.log('Filtered Data Count:', filteredData.length);
        console.log('Paginated Data:', this.paginatedData);

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
                //this.usertypename = this.formData.user.User_Type__c;  // Assign User_Type__c
                this.UserRoleName = this.formData.user.User_Role__c;
                console.log('this.UserRoleName >>',this.UserRoleName);
                const role = this.UserRoleName?.toLowerCase();

                if (role === 'portal account partner manager') {
                    this.formattedUserRole1 = 'Portal account partner Manager';
                } else if (role === 'portal account partner executive') {
                    this.formattedUserRole1 = 'Portal account partner Executive';
                } else if (role === 'portal account partner user') {
                    this.formattedUserRole1 = 'Portal account partner User';
                }

                getUserTypeValuesfromOrg({
                    selectedroleValue: this.formattedUserRole1,
                    userId: this.staffId
                })
                .then(result => {
                    console.log('User Type Values received (imperative):', result);
                    this.UserTypeValues = result.map(item => ({ label: item, value: item }));
                    this.usertypename = this.formData.user.User_Type__c === 'NDIS Participants' 
                        ? 'NDIS Participant' 
                        : this.formData.user.User_Type__c;
                    this.editButtonModule = true;
                })
                .catch(error => {
                    console.error('Error in imperative call to getUserTypeValuesfromOrg:', error);
                });
    
                console.log('Original User Role:', this.formData.user.User_Role__c);
                console.log('this.formattedUserRole1 >>',this.formattedUserRole1);
                console.log('filteredRoleOptions >>', JSON.stringify(this.filteredRoleOptions));
                console.log('Original User Type:', this.usertypename);  // Fixed this line
                console.log('UserTypeValues >>', JSON.stringify(this.UserTypeValues));
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
        console.log('this.selectedRole >>',this.selectedRole);
        this.userId = this.formData.user.Id;
        console.log('this.userId >>',this.userId);
        this.editrole = event.target.value;
        this.fetchUserTypeValues1();
    }

    fetchUserTypeValues1() {
        getUserTypeValuesfromOrg1({ selectedroleValue: this.selectedRole, userId: this.userId })
            .then((data) => {
                this.UserTypeValues = data.map((item) => ({ label: item, value: item }));
            })
            .catch((error) => {;
            });
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
        console.log('this.editusertype===>'+this.editusertype);
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

    resetpasswordlink(event) {
        const userId = event.target.getAttribute('data-id');
        
        // Find the user based on their ID (you can also fetch this data if needed)
        const user = this.paginatedData.find(user => user.userId === userId);
        
        // Set the modal data and show the modal
        if (user) {
            this.modalData = user;
            this.resetPasswordModal = true;
        }
    }

    handleCloseresetPasswordModal(event){
        this.resetPasswordModal = false;
    }

    // Handle reset password logic
    handleConfirmResetPassword(event) {
        const selectedUserId = this.modalData.userId;
        if (!selectedUserId) {
            this.showToast('Error', 'No user selected for password reset.', 'error');
            return;
        }

        resetPortalPassword({ ResetpasswordUserId: selectedUserId })
            .then((result) => {
                    this.showToast('Success', 'You will receive an email with a password creation link within 3 hours.', 'success');
                this.resetPasswordModal = false;
            })
            .catch((error) => {
                console.error('Error resetting password:', error);
                this.showToast('Error', 'Failed to reset password.', 'error');
            });
    }
    async facilityGrantAccess(event) {
        this.accessUserId = event.currentTarget.dataset.id;
        this.facilityAccesUserRole = event.currentTarget.dataset.userrole;
        this.facilityAccessUserType = event.currentTarget.dataset.usertype;

        console.log('this.facilityAccesUserRole', this.facilityAccesUserRole);
        console.log('this.facilityAccessUserType', this.facilityAccessUserType);

        this.userFacilities = [];
        this.updatedFacilityValues = [];
        this.selectedFacilities = [];

        console.log('Opening facility access modal...user Id ' + this.accessUserId);
        this.openFacilityAccess = true;

        if (this.accessUserId && this.facilityAccessUserType) {
            try {
                const data = await getFacilityUserWise({
                    UserId: this.accessUserId,
                    accessUserType: this.facilityAccessUserType
                });

                this.userFacilities = data;
                this.updatedFacilityValues = data.map(f => f.Facility__c);
                this.selectedFacilities = [...this.updatedFacilityValues];

                console.log('📦 userFacilities', JSON.stringify(this.userFacilities));
                console.log('✅ updatedFacilityValues:', JSON.stringify(this.updatedFacilityValues));
                console.log('✅ selectedFacilities:', JSON.stringify(this.selectedFacilities));
            } catch (error) {
                console.error('❌ Error fetching facilities:', error);
                this.error = error;
            }
        }
    }


    handleFacilityChange(event){
           this.selectedFacilities = event.detail.value;
           console.log('selcted facilities '+JSON.stringify( this.selectedFacilities));
        
    }
    
    handleInsertStaffAssociation() {
        insertFacicilityAssociation({
            FacilityIdList: this.selectedFacilities,
            UserId: this.accessUserId,
            updatedFacilityId: this.updatedFacilityValues,
            userType: this.facilityAccessUserType // 👈 Pass userType to Apex
        })
        .then(() => {
            this.openFacilityAccess=false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Facility access granted successfully.',
                variant: 'success'
            }));
          
            // success toast, refresh logic etc.
        })
        .catch(err => {
            console.error('Insert failed', err);
        });
   }


}