import { LightningElement, api, track,wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id';
import createPortalUser from '@salesforce/apex/PortalUserController.createPortalUser';
import createAccountsContactsAndStaff from '@salesforce/apex/PortalUserController.createAccountsContactsAndStaff';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import updateUserModuleNames1 from '@salesforce/apex/UserAccessController.updateUserModuleNames1';
import getUserOrgName from '@salesforce/apex/UserAccessController.getUserOrgName';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';

export default class TesseractAppsUserManagement extends LightningElement {
    @track isMultiUserUpload = false;
    @track uploadedFiles = [];
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track isActive = false;
    @track selectedRole = '';
    @track selectedUserType = '';
    @track dateOfBirth = '';
    @track phoneNumber = '';
    @track hourlyRate = '';
    @track startDate = '';
    @track taxFileNumber = '';
    @track selectedTaxFree = '';
    @track selectedGender = '';
    @track showModal = false;
    @track selectedFacility = '';
    @track selectstatus = false;
    @track isUserTypeDisabled = true;
    @track uploadfilenameflag = false;
    @track selectedRows = [];
    @track isAllSelected = false;
    @track modalData ={};
    @track module = {};
    @track selectedModules = [];
    @track userRoledata = '';
    @track tableData = [];
    @track selectedValues = [];
    @track userOrgName = '';
    @track filter = {};
    @track enableddisabled = true;
    @track userTypeRole = '';
    @track paginatedData = [];
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track recordsPerPage = 10;
    @track bDisableFirst = true;
    @track bDisableLast = false;
    @track pageSizeOptions = [10, 20, 50];
    @track isErrorPopupVisible = false;
    @track errorMessage = '';


    fileUrl = '/resource/UserExportDownload';
    userId = USER_ID;
    UserTypeValues = [];


    updateFilter() {
        this.filter = {
            criteria: [
                {
                    fieldPath: 'Organisation__r.Name',
                    operator: 'eq',
                    value: this.userOrgName, // ✅ Now properly set
                },
                {
                    fieldPath: 'Status__c',
                    operator: 'eq',
                    value: true,
                },
            ],
            filterLogic: '(1 AND 2)',
        };

        console.log('Updated filter:', JSON.stringify(this.filter)); // ✅ Debugging
    }


    @wire(getUserOrgName)
    wiredUserOrg({ error, data }) {
        console.log('orgname=====>'+data);
        if (data) {
            this.userOrgName = data;
            this.updateFilter();
        } else if (error) {
            console.error('Error retrieving user org name:', error);
        }
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

    @wire(getUserTypeValuesfromOrg, { selectedroleValue: '$selectedRole', userId: '$userId' })
      wiredMultiPicklistValues({ error, data }) {
    if (data) {
        console.log('User Type Values received:', data);
        this.UserTypeValues = data.map(item => ({ label: item, value: item }));
    } else if (error) {
        console.error('Error fetching User Type values', error);
    }
}
    

    taxFreeOptions = [
        { label: 'With Tax Free Threshold', value: 'With Tax Free Threshold' },
        { label: 'Without Tax Free Threshold', value: 'Without Tax Free Threshold' }
    ];

    genderOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Not Specified', value: 'Not Specified' },
        { label: 'Indeterminate/Intersex/Unspecified', value: 'Indeterminate/Intersex/Unspecified' },
    ];


    moduleMap = {
        'NDIS Org Admin': ['Admin', 'Human Resources', 'Incident Register', 'Payroll', 'Participants', 'Repository', 'Roster Manager', 'Sign In','My Profile','Accounting','Performance Management', 'Access Manager', 'T sign', 'Forms'],
        'HR Admin': [ 'Human Resources', 'Performance Management', 'T sign', 'Incident Register', 'Repository', 'Access Manager', 'My Profile'],
        'Payroll Admin' : ['Payroll','Accounting', 'Incident Register', 'Repository'],
        'Roster Manager' : ['Roster Manager', 'Human Resources', 'Sign In', 'Participants','Accounting', 'T sign', 'Access Manager', 'Incident Register', 'Repository', 'Performance Management', 'My Profile', 'Payroll', 'Forms'],
        'ICT Admin' : ['Admin', 'Payroll', 'Human Resources',  'ICT Timesheets', 'T sign', 'Incident Register', 'My Profile', 'Repository', 'Access Manager'],
        'NDIS Staff' : [ 'Roster Manager','Participants','Sign In', 'Incident Register', 'Repository', 'Performance Management', 'My Profile'],
        'ICT Staff' : [ 'My Profile', 'Repository','ICT Timesheets'],
        'NDIS Participants' :['Participants','Incident Register'],
        'Payroll Accountant for Multiple' :['Payroll'],
        'Accountant for Organisation' :['Admin', 'Accounting'],   
    };

    connectedCallback() {
        this.enableddisabled = true;
        //this.loadPaginatedData();
    }

    updateModules() {
        const userType = this.modalData.userType;
        console.log('userType==>'+userType);
        this.modules = this.moduleMap[userType] || [];
        console.log('this.modules===>'+this.modules);
    }

    handlerolechange(event){
        this.selectedRole = event.target.value;
        // Enable the User Type combobox when a role is selected
    if (this.selectedRole) {
        this.isUserTypeDisabled = false; 
    } else {
        this.isUserTypeDisabled = true; 
    }
    }

    handleUserTypeChange(event){
        this.selectedUserType = event.target.value;
    }

    handleGenderChange(event){
        this.selectedGender = event.target.value;
    }

    handleStatus(event){
        this.selectstatus = event.target.checked;        
    }

    handleDownloadTemplate(event){
        const fileUrl = '/resource/Staff_Details_Template';  // Update the file URL if necessary
        window.open(fileUrl, '_blank');

    }

    handleInstructions(event){
        const fileUrl = '/resource/User_Import_Instructions';  // Update the file URL if necessary
        window.open(fileUrl, '_blank');
    }

    handleTaxFreeThreesholdChange(event){
        this.selectedTaxFree = event.target.value;
    }

    handleSwitchToSingleUserForm() {
        this.isMultiUserUpload = false;
        this.handleResetForm();
        

    }

    handlecancelForm(){
        this.handleResetForm();
    }

    handleSwitchToMultiUserUpload() {
        this.isMultiUserUpload = true;
        this.uploadedFileName = '';
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.isActive = false;
        this.selectedRole = '';
        this.selectedUserType = '';
        this.selectedFacility = '';
        this.dateOfBirth = '';
        this.phoneNumber = '';
        this.hourlyRate = '';
        this.startDate = '';
        this.taxFileNumber = '';
        this.uploadedFiles = [];
        this.street = '';
        this.city = '';
        this.province = '';
        this.country = '';
        this.postalcode = '';
        this.selectedTaxFree = '';
        this.selectedGender = '';
        this.uploadfilenameflag = false;
    }


    PhonenumberChange(event){
        console.log('this.phoneNumber====>'+this.phoneNumber);
        this.phoneNumber = event.target.value;
    }
    

    addressInputChange(event) {
        const address = event.detail;
        
        // Trim the values before checking or assigning
        const trimmedStreet = address.street ? address.street.trim() : '';
        const trimmedCity = address.city ? address.city.trim() : '';
        const trimmedPostalCode = address.postalCode ? address.postalCode.trim() : '';
        const trimmedProvince = address.province ? address.province.trim() : '';
        const trimmedCountry = address.country ? address.country.trim() : '';
    
        if (!trimmedStreet || !trimmedCity || !trimmedPostalCode || !trimmedProvince) {
            this.errorMessage = 'Please provide complete address information.';
            this.saveButtonDisable = true;
        } else {
            this.errorMessage = '';
            this.saveButtonDisable = false;
            
            // Log the trimmed values
            console.log('event detail ==>' + JSON.stringify(event.detail)); 
    
            // Assign the trimmed values
            this.street = trimmedStreet;
            this.city = trimmedCity;
            this.postalcode = trimmedPostalCode;
            this.province = trimmedProvince;
            this.country = trimmedCountry;
    
        }
    }

    
    handleUploadFinished(event) {
        console.log('Function called in LWC');
        console.log('Event:', event);
    
        const fileList = event.target.files; // Get the FileList object

        console.log('Uploaded Files:', JSON.stringify(fileList));
    
        if (fileList && fileList.length > 0) { // Ensure at least one file is selected
            const fileInput = fileList[0]; // Get the first file
            this.uploadedFiles = fileList[0];
            console.log('File Input:', fileInput);
            console.log('File Name:', fileInput.name);
            console.log('this.uploadedFiles:', JSON.stringify(this.uploadedFiles));
            if (!fileInput.name.includes('.csv'))
            {
                this.showToast('Error', 'Pleaes Upload CSV file.', 'error');
                this.enableddisabled = true;
                return;                
            }
            this.enableddisabled = true;   
                        
            this.uploadedFileName = fileInput.name; // Set the file name
            this.readFileContent(fileInput);
            this.uploadfilenameflag = true; // Show the uploaded file name

            
        } else {
            console.log('No file selected');
            this.uploadfilenameflag = false; // Reset if no file selected
        }
    }

    readFileContent(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            //console.log('File Content:', JSON.stringify(fileContent));
            
            // Parse CSV data
            const parsedData = this.parseCSV(fileContent);
            //console.log('Parsed Data:', parsedData.length);

            // Update data table
            this.tableData = parsedData;
            this.paginateData();
        };
        reader.onerror = () => {
            console.error('Error reading file:', reader.error);
        };
    
        reader.readAsText(file); // Read the file as text (for CSV files)
        
    }

    paginateData() {
        //console.log('this.tableData:', this.tableData);
        
        if (!this.tableData || this.tableData.length === 0) {
            console.log('No data to paginate');
            this.paginatedData = [];
            this.totalRecords = 0;
            this.totalPages = 0;
            return;
        }
    
        this.totalRecords = this.tableData.length; // Total records without filtering
        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        
        this.paginatedData = this.tableData.slice(startIndex, endIndex);
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
        this.enableddisabled = true;
        this.updatePaginationButtons();
    
        //console.log('Paginated Data:', JSON.stringify(this.paginatedData));
        //console.log('Paginated Data:', JSON.stringify(this.paginatedData.length));

    }


    parseCSV(data) {
        const rows = data.split('\r').map(row => row.trim()); // Trim each row to remove leading/trailing spaces
    
        if (rows.length < 2) {
            console.error('Invalid CSV format');
            return [];
        }
    
        // Extract headers and trim them
        const headerRow = rows[0].split(',').map(header => header.trim()); 
        const dataRows = rows.slice(1); // Extract data rows
        const parsedData = [];
    
        // Generate a base timestamp to keep IDs unique within this function call
        const baseTimestamp = Date.now();
    
        // Iterate over each data row
        dataRows.forEach((row, index) => {
            if (!row || row.split(',').every(value => value.trim() === '')) {
                return; // Skip completely empty rows
            }
    
            const rowValues = row.split(','); 
            const rowObject = { id: baseTimestamp + index }; // Generate unique ID
    
            // Map headers to values
            headerRow.forEach((header, i) => {
                const trimmedHeader = header.replace(/ /g, ''); // Trim the header
                rowObject[trimmedHeader] = rowValues[i] ? rowValues[i].trim() : ''; 
            });
    
            parsedData.push(rowObject);
        });
    
        console.log('Parsed Data:', JSON.stringify(parsedData));
        return parsedData;
    }
    
    

    handleRowSelection(event) {
        const userId = Number(event.currentTarget.dataset.id);
        const isChecked = event.target.checked;
    
        if (!userId) {
            console.error('User ID is undefined');
            return;
        }
    
        // Update main tableData instead of just paginatedData
        this.tableData = this.tableData.map(user =>
            user.id === userId ? { ...user, isSelected: isChecked } : user
        );
    
        // Ensure paginatedData reflects the change
        this.paginateData();
    
        // Check if all rows on the current page are selected
        this.isAllSelected = this.paginatedData.every(user => user.isSelected);
    
        // Reverse logic: disable when at least one row is selected
        this.enableddisabled = !this.tableData.some(user => user.isSelected);
    
        console.log('this.isAllSelected ===> ' + this.isAllSelected);
        console.log('this.enableddisabled ===> ' + this.enableddisabled);
    }


    handleSelectAll(event) {
        const isChecked = event.target.checked;
    
        // Update selection in full tableData
        this.tableData = this.tableData.map(user => ({
            ...user,
            isSelected: isChecked
        }));
    
        // Refresh paginatedData
        this.paginateData();
    
        // Reverse logic: disable when at least one row is selected
        this.enableddisabled = !isChecked;
    
        console.log('isChecked ===>', isChecked);
        console.log('this.enableddisabled ===>', this.enableddisabled);
    }
    
    
    

    // Update the number of records per page
    handleRecordsPerPage(event) {
        this.recordsPerPage = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.paginateData();
    }

    // Update pagination button states
    updatePaginationButtons() {
        this.bDisableFirst = this.pageNumber === 1;
        this.bDisableLast = this.pageNumber === this.totalPages;
    }

    // Navigate to the first page
    firstPage() {
        this.pageNumber = 1;
        this.paginateData();
        //this.loadPaginatedData();
    }

    // Navigate to the previous page
    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.paginateData();
           // this.loadPaginatedData();
        }
    }

    // Navigate to the next page
    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.paginateData();
            //this.loadPaginatedData();
        }
    }

    // Navigate to the last page
    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginateData();
        //this.loadPaginatedData();
    }
    
    


    handleFieldChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.target.value;
    }

    handleFacilityChange(event) {
        console.log(JSON.stringify(event.detail.recordId));
        this.selectedFacility = event.detail.recordId;  // Get the selected record's ID
        console.log(JSON.stringify(this.selectedFacility));
    }
    
    handleUserCreation() {
        console.log('this.phoneNumber==>' + this.phoneNumber);

        // Validation Check
        if (!this.firstName || !this.lastName || !this.email || !this.selectedRole || !this.selectedUserType) {
            this.showToast('Error', 'Please fill in all required fields.', 'error');
            return;
        }

        const userPayload = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            role: this.selectedRole,
            userType: this.selectedUserType,
            isActive: this.selectstatus,
            facility: this.selectedFacility,
            dateOfBirth: this.dateOfBirth,
            phoneNumber: this.phoneNumber,
            hourlyRate: this.hourlyRate,
            startDate: this.startDate,
            taxFileNumber: this.taxFileNumber,
            currentuserId: this.userId,
            selectedTaxFree: this.selectedTaxFree,
            street: this.street,
            City: this.city,
            State: this.province,
            Country: this.country,
            PostalCode: this.postalcode,
            selectedGender: this.selectedGender
        };

        console.log('Payload:', JSON.stringify(userPayload));

        createPortalUser({ userDetails: userPayload })
            .then((result) => {
                console.log('User Created Successfully: ', result);
                const userdetails= result;
                this.modalData = result;

                if(this.modalData.userRole == 'Portal account partner Executive'){
                    this.userRoledata = 'Org Admin';
                } else if (this.modalData.userRole == 'Portal account partner Manager'){
                    this.userRoledata = 'Roster Admin';                    
                }else if (this.modalData.userRole == 'Portal account partner User'){
                    this.userRoledata = 'Staff'
                }
                
                console.log('this.modalData===>'+JSON.stringify(this.modalData));
                this.showModal = true;
                this.updateModules();
                this.handleResetForm();
                this.showToast('Success', 'User created successfully.  You will receive an email within the next 3 hours.', 'success');
            })
            .catch(error => {
                console.error('Error Creating User:', error);
                this.showToast('Error', error.body ? error.body.message : 'Unknown error occurred.', 'error');
            });
    }

    handleCheckboxChange(event) {
        const value = event.target.value; // ✅ Use event.target.value instead
        console.log('Selected Value:', value);
    
        if (event.target.checked) {
            this.selectedValues = [...this.selectedValues, value]; // Add selected value
        } else {
            this.selectedValues = this.selectedValues.filter(item => item !== value); // Remove unchecked value
        }
        console.log('Updated Selected Values:', this.selectedValues);
    }

    handleConfirmReset(event) {
        console.log('Selected Values:', this.selectedValues);
        console.log('Staff ID:', this.modalData.StaffId);
    
        if (!this.modalData.StaffId) {
            this.showToast('Error', 'Staff ID is missing.', 'error');
            return;
        }
    
        if (this.selectedValues.length > 0) {
            const modulesString = this.selectedValues.join(';');
            console.log('Modules to update:', modulesString);
    
            // Pass StaffId to Apex
            updateUserModuleNames1({ staffId: this.modalData.StaffId, modules: modulesString })
                .then(() => {
                    console.log('User modules updated successfully');
                    this.showModal = false;
                    this.showToast('Success', 'User modules updated successfully.', 'success');
                })
                .catch(error => {
                    console.error('Error updating user modules:', error);
                    this.showToast('Error', error.body ? error.body.message : 'Failed to update user modules.', 'error');
                });
        } else {
            this.showToast('Warning', 'No modules selected to update.', 'warning');
        }
    }
    
    

    handleResetForm() {
        console.log('handleResetForm');
        this.uploadedFileName = '';
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.isActive = false;
        this.selectedRole = '';
        this.selectedUserType = '';
        this.selectedFacility = '';
        this.dateOfBirth = '';
        this.phoneNumber = '';
        this.hourlyRate = '';
        this.startDate = '';
        this.taxFileNumber = '';
        this.uploadedFiles = [];
        this.street = '';
        this.city = '';
        this.province = '';
        this.country = '';
        this.postalcode = '';
        this.selectedTaxFree = '';
        this.selectedGender = '';
        this.uploadfilenameflag = false;
        this.tableData = '';
        //this.isMultiUserUpload = false;
        console.log('this.selectedFacility====>'+this.selectedFacility);
    }


    // Close the modal
    handleCloseModal() {
        this.selectedModules = [];
        this.showModal = false;
        this.modalData = {};
    }

    /* loadPaginatedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.paginatedData = this.tableData.slice(start, end);
    } */
   
        
        handleFinalSubmit() {
            console.log('Table data before processing:', JSON.stringify(this.tableData));
    
            // Filter selected records
            const selectedRecords = this.tableData.filter(user => user.isSelected);
            let validRecords = [];
            let hasInvalidRecords = false;
    
            // Function to check missing fields
            const isRecordInvalid = (user) => {
                return !user.FirstName || !user.LastName || !user.Gender || !user.PhoneNumber || !user.EmailAddress ||
                    !user.DateofBirth || !user.Role || !user.UserType || !user.Facility || !user.HourlyRate || 
                    !user.TaxFileNumber || !user.TaxFreeThreshold || !user.StartDate || !user.Status || 
                    !user.AddressStreet || !user.AddressCity || !user.AddressState || !user.AdressPostCode || 
                    !user.AddressCountry;
            };
    
            // Format date function
            const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
    
            // Update records with validation errors
            this.tableData = this.tableData.map(user => {
                if (user.isSelected && isRecordInvalid(user)) {
                    hasInvalidRecords = true;
                    return { ...user, ProcessedStatus: 'Error ❌: Missing Required Fields' };
                }
                return user;
            });
    
            // Prepare valid records
            validRecords = selectedRecords
                .filter(user => !isRecordInvalid(user))
                .map(user => ({
                    ...user,
                    DateofBirth: formatDate(user.DateofBirth),
                    StartDate: formatDate(user.StartDate)
                }));
    
            if (validRecords.length > 0) {
                console.log('Submitting Records:', JSON.stringify(validRecords));
                this.uploadDataToApex(validRecords);
            }
    
            // Force UI refresh
            this.forceTableUpdate();
        }
    
        uploadDataToApex(formattedRecords) {
            createAccountsContactsAndStaff({ records: formattedRecords })
                .then(result => {
                    const { successRecords, failedRecords } = result;
                    console.log('Successful Records:', JSON.stringify(successRecords));
                    console.log('Failed Records:', JSON.stringify(failedRecords));
        
                    // Update tableData with success or failure messages
                    this.tableData = this.tableData.map(user => {
                        let successRecord = successRecords.find(record => 
                            record.EmailAddress.trim().toLowerCase() === user.EmailAddress.trim().toLowerCase()
                        );
                        let failedRecord = failedRecords.find(record => 
                            record.EmailAddress.trim().toLowerCase() === user.EmailAddress.trim().toLowerCase()
                        );
        
                        if (successRecord) {
                            return { ...user, ProcessedStatus: 'Success ✅' };
                        } else if (failedRecord) {
                            return { ...user, ProcessedStatus: `Error ❌: ${failedRecord.ErrorMessage}` };
                        }
                        return user;
                    });
        
                    this.isProcessed = true;  // Make "Processed Status" column visible
                    this.forceTableUpdate();  // Refresh UI and pagination
                })
                .catch(error => {
                    console.error('Error in Apex method:', error);
        
                    // Mark all selected records with a general error
                    this.tableData = this.tableData.map(user => ({
                        ...user,
                        ProcessedStatus: user.isSelected ? 'Error ❌: Unexpected Processing Error' : user.ProcessedStatus
                    }));
        
                    this.forceTableUpdate();
                });
        }
        
        // 🚀 Force UI to Refresh Processed Status and Pagination
        forceTableUpdate() {
            // Recalculate pagination indexes after processing
            this.refreshPaginationIndexes(); 
        
            // Refresh pagination to show updated status
            this.refreshPaginatedData();
        }

        // 🚀 Recalculate Pagination Indexes
        refreshPaginationIndexes() {
        const pageSize = 10;  // Set the page size

        // Ensure currentPage is a valid number
        if (isNaN(this.currentPage) || this.currentPage <= 0) {
        this.currentPage = 1;  // Default to the first page if currentPage is invalid
        }

        // Calculate startIndex and endIndex based on current page
         this.startIndex = (this.currentPage - 1) * pageSize;
         this.endIndex = this.startIndex + pageSize;

         // Debugging log to check values
     console.log(`Pagination Indexes: Start - ${this.startIndex}, End - ${this.endIndex}`);
        }

        
        // 🚀 Refresh Paginated Data
        refreshPaginatedData() {
            // Ensure there is data in tableData before slicing
            if (this.tableData.length > 0) {
                this.paginatedData = this.tableData.slice(this.startIndex, this.endIndex);
            } else {
                console.log('No data available for pagination');
                this.paginatedData = [];  // Clear pagination data if no data is available
            }
        
            // Debugging log to check the paginated data
            console.log('Paginated Data:', JSON.stringify(this.paginatedData));
        }

        handleErrorClick(event) {
            // Log for debugging
            console.log('handleerror===>', event.target.closest('tr').dataset.id);
            
            // Get the user ID from the data-id attribute of the <tr> element
            const userId = event.target.closest('tr').dataset.id; 
        
            // Find the relevant user based on the ID
            const user = this.tableData.find(user => user.id === parseInt(userId)); // Ensure user ID is compared correctly (parseInt if it's a string)
        
            // Check if there's an error message for this user
            if (user && user.ProcessedStatus && user.ProcessedStatus.includes('Error')) {
                this.errorMessage = user.ProcessedStatus; // Set the error message
                this.isErrorPopupVisible = true;  // Show the popup
            }
        }
        
    
        // Close the popup when the close button is clicked
        handleClosePopup() {
            this.isErrorPopupVisible = false;
            this.errorMessage = '';  // Clear the error message
        }      

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
    
}