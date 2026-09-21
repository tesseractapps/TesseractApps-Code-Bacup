import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id';
import createPortalUser from '@salesforce/apex/PortalUserController.createPortalUser';
import createAccountsContactsAndStaff from '@salesforce/apex/StaffBulkUploadController.createStaff';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import updateUserModuleNames1 from '@salesforce/apex/UserAccessController.updateUserModuleNames1';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getUserOrgName from '@salesforce/apex/UserAccessController.getUserOrgName';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getRemainingStaffSlots from '@salesforce/apex/LimitCheckService.getRemainingStaffSlots';
import isFacilityActive from '@salesforce/apex/FacilityController.isFacilityActive';

export default class TesseractAppsUserManagement extends LightningElement {
    @track isMultiStaffUpload = false;
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
    @track isAccessManager = true;
    @track issingleUserUpload = false;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;
    @track typeOfUser;
    @track uploadBtnContainer= true;
    fileUrl = '/resource/UserExportDownload';
    userId = USER_ID;
    UserTypeValues = [];

    connectedCallback() {
        this.enableddisabled = true;
        this.moduleName = 'isUserManagement';
        //this.loadPaginatedData();
        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.staffPreferredName = localStorage.getItem("defaultstaffPreferredName") || "Staff";
        console.log('localStorage.getItem("defaultParticipantPreferredName") >>', localStorage.getItem("defaultParticipantPreferredName"));
        console.log('localStorage.getItem("defaultFacilityPreferredName") >>', localStorage.getItem("defaultFacilityPreferredName"));
        
        console.log('fetched',this.participantPreferredName);
        console.log('fetched',this.facilityPreferredName);
        this.fetchOrgDetails();
        console.log('storedFacilityId'+storedFacilityId);
        console.log('storedFacilityLabel'+storedFacilityLabel);
        
            getCurrentLoggedUserInfo().then(userData=>{;
                let userTpe=userData.User_Type__c;
                this.typeOfUser = userData.Type_of_User__c;
                getFacilityData().then(response => {
                    console.log('Facility data fetched successfully:', response);
                    this.finalListFacilities=[];
                    this.selectedFacilities=[];
                    this.facilityOptions = response.map(record => ({
                        label: record.Name,
                        value: record.Id
                }));   
                    console.log('user data ==>'+JSON.stringify(userData));
                        if( userTpe =='NDIS Org Admin' || userTpe == 'ICT Admin'){
                            this.finalListFacilities=this.facilityOptions  ;
                            console.log('Fetch Participant>>>'+ JSON.stringify(this.orgAwards));
                            finalData =this.orgAwards;
                            let facilityIds = [];
                                // finalData =response;
                                    console.log('Fetch Participant filteredData>>>'+ JSON.stringify(this.orgAwards));
                                facilityIds.push(storedFacilityId); 
                                console.log('facilityIds  '+JSON.stringify(facilityIds))
                            const filteredData = this.orgAwards.filter(rec =>
                                facilityIds.includes(rec.facilityid)
                            );
                        this.records =filteredData ;
                        this.orginalData=filteredData;
                        console.log('Fetch Participant finalData>>>'+ JSON.stringify(filteredData));
                        this.totalRecords = filteredData.length; // update total records count                 
                            this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                            this.pageNumber = 1;
                        // this.applyFilters(); 
                        this.paginationHelper(); // call helper menthod to update pagination logic           
                        
                        }else if(userTpe =='Facility Admin' || userTpe =='HR Admin' || userTpe =='Roster Manager'){
                            getFacilityCurrentUser().then(result => {
                                console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                this.finalListFacilities =  result.map(record => ({
                                        label: record.Facility__r.Name,
                                        value: record.Facility__r.Id
                                })); 
                                let facilityIds = [];
                                // finalData =response;
                                    console.log('Fetch Participant filteredData>>>'+ JSON.stringify(this.orgAwards));
                                facilityIds.push(storedFacilityId); 
                                console.log('facilityIds  '+JSON.stringify(facilityIds))
                            const filteredData = this.orgAwards.filter(rec =>
                                facilityIds.includes(rec.facilityid)
                            );

                            this.records =filteredData ;
                                this.orginalData=filteredData;
                            console.log('Fetch Participant filteredData>>>'+ JSON.stringify(filteredData));
                                console.log('Fetch Participant filteredData length >>>'+filteredData.length);
                            this.totalRecords = filteredData.length; // update total records count                 
                            this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                            this.pageNumber = 1;
                            //this.applyFilters(); 
                            this.paginationHelper(); // call helper menthod to update pagination logic           
                            // this.ParticpantRecordForm=false;
                            this.showSpinner = false;
                            }).catch(error => {
                                this.error = error;
                                console.error('Error fetching facilities:', error);
                    
                            });
                        }
                })
                })
            .catch(err => {
                console.error('Error fetching facility data:', err);
            });
        const activeTab = localStorage.getItem('activeAccessManagerTab');
        console.log('activeTab in  Access Manager  connectedCallback') 
        this.isUserManagement = false;
        this.isstaffManagement = false;
        this.isuserReport = false;
    }

    renderedCallback() {
        const cells = this.template.querySelectorAll('td, th');
        cells.forEach(cell => {
            const txt = cell.textContent ? cell.textContent.trim() : '';
            if (txt && !cell.hasAttribute('title')) {
                cell.setAttribute('title', txt);
            }
        });
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

    /* updateModules() {
        let userType;
        if (this.modalData.userType === 'NDIS Participants') {
            userType = 'NDIS Participant';
        } else {
            userType = this.modalData.userType;
        }

        console.log('userType ==> ' + userType);
        this.modules = this.moduleMap[userType] || [];
        this.showModal = true;
        console.log('this.modules ===> ' + JSON.stringify(this.modules));
    } */

    updateModules() {
        let userType;
        if (this.modalData.userType === 'NDIS Participants') {
            userType = 'NDIS Participant';
        } else {
            userType = this.modalData.userType;
        }

        console.log('userType ==> ' + userType);

        // Get modules for the userType
        let modules = this.moduleMap[userType] || [];

        // Replace 'Participants' with participantPreferredName if it exists
        if (this.participantPreferredName) {
            modules = modules.map(module => 
                module === 'Participants' ? this.participantPreferredName : module
            );
        }

        this.modules = modules;
        this.showModal = true;

        console.log('this.modules ===> ' + JSON.stringify(this.modules));
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
        
        if(this.typeOfUser=='NDIS'){
            const fileUrl = '/resource/NDIS_Staff_Bulk_Template_Upload';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        } else if(this.typeOfUser=='ICT'){
            const fileUrl = '/resource/Staff_Bulk_Upload_Template_ICT';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        }
    }

    handleInstructions(event){
        console.log('type of user: ',this.typeOfUser);
        if(this.typeOfUser=='NDIS'){
            const fileUrl = '/resource/NDIS_Staff_Bulk_Upload_Instructions';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
            
        } else if(this.typeOfUser=='ICT'){
            const fileUrl = '/resource/ICT_Staff_Bulk_Upload_Instructions';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        }
        
    }

    handleTaxFreeThreesholdChange(event){
        this.selectedTaxFree = event.target.value;
    }

    handleSwitchToSingleUserForm() {
        this.isMultiStaffUpload = false;
        this.isProcessed = false;
        this.handleResetForm1();
    }

    handlecancelForm(){
        this.handleResetForm();
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
        console.log('================ FILE UPLOAD START ================');

        console.log('📥 handleUploadFinished triggered');
        console.log('📌 Event Target:', event.target);

        const fileList = event.target.files;
        console.log(
            '📄 FileList:',
            fileList ? `Length = ${fileList.length}` : 'No FileList'
        );

        /* =================================================
        STEP 1: VALIDATE FILE SELECTION
        ================================================= */
        if (!fileList || fileList.length === 0) {
            console.warn('⚠️ No file selected');
            console.log('================ FILE UPLOAD END ==================');
            return;
        }

        const fileInput = fileList[0];

        console.log('🗂 Selected File Object:', fileInput);
        console.log('📝 File Name:', fileInput.name);
        console.log('📦 File Size (bytes):', fileInput.size);
        console.log('🧾 File Type:', fileInput.type);

        /* =================================================
        STEP 2: RESET PREVIOUS STATE (SAFE POINT)
        ================================================= */
        this.uploadedFiles = null;
        this.uploadedFileName = '';
        this.uploadfilenameflag = false;

        this.tableData = [];
        this.paginatedData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.pageNumber = 1;
        this.selectedRecordIds.clear();
        this.isAllSelected = false;

        // Submit must stay disabled until user selects rows
        this.enableddisabled = true;

        console.log('🧹 Previous upload + pagination state cleared');

        /* =================================================
        STEP 3: CSV VALIDATION
        ================================================= */
        if (!fileInput.name.toLowerCase().endsWith('.csv')) {
            console.warn('⚠️ Invalid file type:', fileInput.name);

            this.showToast('Error', 'Please upload a CSV file.', 'error');
            this.enableddisabled = true;

            // 🔁 Reset input so same file can be chosen again
            event.target.value = null;

            console.log('🚫 Upload aborted – non-CSV file');
            console.log('================ FILE UPLOAD END ==================');
            return;
        }

        console.log('✅ CSV file validation passed');

        /* =================================================
        STEP 4: SET FILE STATE
        ================================================= */
        this.uploadedFiles = fileInput;
        this.uploadedFileName = fileInput.name;
        this.uploadfilenameflag = true;

        console.log('📎 Uploaded File Name:', this.uploadedFileName);
        console.log('👁 uploadfilenameflag:', this.uploadfilenameflag);

        /* =================================================
        STEP 5: READ FILE CONTENT
        ================================================= */
        console.log('📖 Initiating file read');
        this.readFileContent(fileInput);

        /* =================================================
        🔥 STEP 6: CLEAR FILE INPUT (CRITICAL)
        Allows uploading the SAME file again
        ================================================= */
        event.target.value = null;
        console.log('🔁 File input reset for next upload');

        console.log('================ FILE UPLOAD END ==================');
    }

    readFileContent(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            //console.log('File Content:', JSON.stringify(fileContent));
            
            // Parse CSV data
            const parsedData = this.parseCSV(fileContent);
            //console.log('Parsed Data:', parsedData.length);
             const uniqueData = this.removeDuplicateEmailRows(parsedData);

            // Update data table
           // this.tableData = parsedData;
            this.tableData = uniqueData;
            this.paginateData();
        };
        reader.onerror = () => {
            console.error('Error reading file:', reader.error);
        };
    
        reader.readAsText(file); // Read the file as text (for CSV files)
        
    }

    removeDuplicateEmailRows(data) {
       console.log('removeDuplicateEmails');

        const emailMap = new Map();
        const duplicateEmails = [];
        let validRecords = [];

        data.forEach(user => {
            const email = (user.EmailAddress || '').trim().toLowerCase();
             
            if (emailMap.has(email)) {
                duplicateEmails.push(email);  
            } else {
                emailMap.set(email, true);
                validRecords.push(user);      // ✅ Keep only first 
            }
        });
       
        if (duplicateEmails.length  > 0) {
            this.showToast('Error',  `${duplicateEmails.length} duplicate EmailID record(s) removed. `, 'error');  
        }
        return validRecords; 
    }
    paginateData() {
        try {
            console.log("🔄 Paginating data…");

            // 1️⃣ Validate tableData before anything else
            if (!this.tableData || !Array.isArray(this.tableData)) {
                throw new Error("tableData is missing or invalid.");
            }

            if (this.tableData.length === 0) {
                this.paginatedData = [];
                this.totalRecords = 0;
                this.totalPages = 0;

                /* this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'No Data',
                        message: 'No data available to display.',
                        variant: 'error',
                        mode: 'dismissable'
                    })
                );

                return; */ // STOP execution
            
                this.handleGlobalError(null, error.message);
            }

            // 2️⃣ Safe pagination
            this.totalRecords = this.tableData.length;
            const startIndex = (this.pageNumber - 1) * this.recordsPerPage;

            if (isNaN(startIndex) || startIndex < 0) {
                throw new Error("Invalid page number or start index.");
            }

            const endIndex = startIndex + this.recordsPerPage;

            // 3️⃣ Slice with error safety
            const slice = this.tableData.slice(startIndex, endIndex);

            // 4️⃣ Safely map with selection state
            this.paginatedData = slice.map((user) => ({
                ...user,
                isSelected: this.selectedRecordIds?.has(user.id) || false
            }));

            this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);

            // 5️⃣ Enable/disable buttons
            this.enableddisabled = this.selectedRecordIds.size === 0;

            this.isAllSelected =
                this.paginatedData.length > 0 &&
                this.paginatedData.every((u) => u.isSelected === true);

            this.updatePaginationButtons();
        } catch (error) {
            console.error("❌ Pagination Error:", error);

            // STOP EXECUTION AND SHOW ERROR
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Pagination Error",
                    message: error.message,
                    variant: "error"
                })
            );

            // Prevent UI break
            this.paginatedData = [];
            this.totalPages = 0;
            this.totalRecords = 0;

            return; // 🚫 STOP EXECUTION IMMEDIATELY
        }
    }

    parseCSV(data) {
        const rows = data.split('\r').map(row => row.trim());

        // ✅ 1. Check for empty or only-header CSV
        if (rows.length < 2 || !rows[1] || rows[1].split(',').every(cell => cell.trim() === '')) {
            /* this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid File',
                    message: 'CSV must contain at least one header row and one data row.',
                    variant: 'error',
                    mode: 'dismissable'
                })
            ); */
            this.handleGlobalError(null, 'CSV contains invalid structure or missing columns.');
            return [];
        }

        // ✅ 2. Extract and sanitize headers
        const headerRow = rows[0].split(',').map(header => header.trim());
        const seenHeaders = new Set();

        // ✅ 3. Check for duplicate headers (stop on first)
        for (let header of headerRow) {
            const cleanedHeader = header.replace(/ /g, '');
            if (seenHeaders.has(cleanedHeader)) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Duplicate Column',
                        message: `Duplicate column found: ${cleanedHeader}`,
                        variant: 'error'
                    })
                );
                return [];
            }
            seenHeaders.add(cleanedHeader);
        }

        // ✅ 4. Check for missing required headers (stop on first)
        let requiredHeaders = [
            'FirstName', 'LastName', 'Gender', 'PhoneNumber', 'EmailAddress',
            'DateofBirth', 'Facility', 'HourlyRate', 'AustralianBusinessNumber',
            'TaxFileNumber', 'TaxFreeThreshold', 'StartDate', 'Status',
            'AddressStreet', 'AddressCity', 'AddressState', 'AdressPostCode',
            'AddressCountry', 'Frequency'
        ];

        // Adjust required headers based on user type
        // if (this.typeOfUser === 'ICT') {
        //     requiredHeaders = requiredHeaders.filter(
        //         header => header !== 'Languages' && header !== 'Nationality'
        //     );
        // }

        for (let required of requiredHeaders) {
            const exists = headerRow.some(h => h.replace(/ /g, '') === required);
            if (!exists) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Missing Column',
                        message: `Missing required column: ${required}`,
                        variant: 'error'
                    })
                );
                return [];
            }
        }

        // ✅ 5. Parse data rows
        const dataRows = rows.slice(1);
        const parsedData = [];
        const baseTimestamp = Date.now();

        dataRows.forEach((row, index) => {
            if (!row) return;

            const rowValues = row.split(',').map(val => val.trim());
            const isMeaningful = rowValues.some(val => val && val.replace(/[`"']/g, '').trim() !== '');
            if (!isMeaningful) return;

            const rowObject = { id: baseTimestamp + index };

            headerRow.forEach((header, i) => {
                const trimmedHeader = header.replace(/ /g, '');
                rowObject[trimmedHeader] = rowValues[i] ? rowValues[i].trim() : '';
            });

            parsedData.push(rowObject);
        });

        console.log('Parsed Data:', JSON.stringify(parsedData));
        return parsedData;
    }

    @track selectedRecordIds = new Set();
    handleRowSelection(event) {
        console.log('================ ROW SELECTION START ================');

        const userId = Number(event.currentTarget.dataset.id);
        const isChecked = event.target.checked;

        console.log('🆔 Clicked Row User ID:', userId);
        console.log('☑️ Checkbox Checked:', isChecked);

        /* =================================================
        STEP 1: VALIDATE USER ID
        ================================================= */
        if (!userId) {
            console.error('❌ User ID is undefined or invalid');
            console.log('================ ROW SELECTION END ==================');
            return;
        }

        /* =================================================
        STEP 2: UPDATE SELECTED IDS SET
        ================================================= */
        if (isChecked) {
            this.selectedRecordIds.add(userId);
            console.log('➕ Added to selectedRecordIds:', userId);
        } else {
            this.selectedRecordIds.delete(userId);
            console.log('➖ Removed from selectedRecordIds:', userId);
        }

        console.log(
            '📌 Current selectedRecordIds:',
            Array.from(this.selectedRecordIds)
        );

        /* =================================================
        STEP 3: SYNC SELECTION STATE TO tableData
        ================================================= */
        console.log('🔄 Syncing selection state to tableData');

        this.tableData = this.tableData.map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));

        console.log('📊 tableData selection sync complete');

        /* =================================================
        STEP 4: REFRESH PAGINATION
        ================================================= */
        console.log('📄 Recalculating paginatedData');
        this.paginateData();

        console.log(
            '📃 Paginated Data Length:',
            this.paginatedData.length
        );

        /* =================================================
        STEP 5: UPDATE UI STATES
        ================================================= */
        this.enableddisabled = this.selectedRecordIds.size === 0;
        console.log('🔘 Submit Disabled:', this.enableddisabled);

        this.isAllSelected =
            this.paginatedData.length > 0 &&
            this.paginatedData.every(user => user.isSelected);

        console.log('✅ Is All Selected (current page):', this.isAllSelected);

        console.log('================ ROW SELECTION END ==================');
    }

    handleSelectAll(event) {
        const isChecked = event.target.checked;
    
        // Update selection in full tableData
        // this.tableData = this.tableData.map(user => ({
        //     ...user,
        //     isSelected: isChecked
        // }));
        this.paginatedData.forEach(user => {
            if (isChecked) {
                this.selectedRecordIds.add(user.id);
            } else {
                this.selectedRecordIds.delete(user.id);
            }
        });

        // Update main tableData flags
        this.tableData = this.tableData.map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));
        // Refresh paginatedData
        this.paginateData();
    
        // Reverse logic: disable when at least one row is selected
       // this.enableddisabled = !isChecked;
       this.enableddisabled = this.selectedRecordIds.size === 0;
    
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
        this.selectedFacility = event.detail.value; // This is the selected facility's value
        console.log('Selected Facility ID:', this.selectedFacility);
    }
    
    @track userTypeName;
    handleUserCreation() {
        console.log('this.phoneNumber==>' + this.phoneNumber);
        console.log('User Type >>', this.selectedUserType);

        if(this.selectedUserType == 'NDIS Participant'){
            this.userTypeName = 'NDIS Participants';
        } else {
            this.userTypeName = this.selectedUserType;
        }

        // Validation Check
        if (!this.firstName) {
            this.showToast('Error', 'Please enter First Name.', 'error');
            return;
        }

        if (!this.lastName) {
            this.showToast('Error', 'Please enter Last Name.', 'error');
            return;
        }

        if (!this.email) {
            this.showToast('Error', 'Please enter Email.', 'error');
            return;
        }

        if (!this.selectedRole) {
            this.showToast('Error', 'Please select a Role.', 'error');
            return;
        }

        if (!this.selectedUserType) {
            this.showToast('Error', 'Please select a User Type.', 'error');
            return;
        }

        if (!this.dateOfBirth) {
            this.showToast('Error', 'Please select Date of Birth.', 'error');
            return;
        }

        if (!this.selectedGender) {
            this.showToast('Error', 'Please select Gender.', 'error');
            return;
        }

        if (!this.selectedFacility) {
            this.showToast('Error', 'Please select Facility.', 'error');
            return;
        }

        if (!this.phoneNumber) {
            this.showToast('Error', 'Please enter Phone Number.', 'error');
            return;
        }

        if (!this.hourlyRate) {
            this.showToast('Error', 'Please enter Hourly Rate.', 'error');
            return;
        }

        if (!this.startDate) {
            this.showToast('Error', 'Please select Start Date.', 'error');
            return;
        }

        if (!this.selectedTaxFree) {
            this.showToast('Error', 'Please select Tax Free Treshold.', 'error');
            return;
        }

        if (!this.taxFileNumber) {
            this.showToast('Error', 'Please enter Tax File Number.', 'error');
            return;
        }

        const userPayload = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            role: this.selectedRole,
            userType: this.userTypeName,
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
                console.log('this.showModal >>', this.showModal);
                this.updateModules();
                this.handleResetForm();
                this.showToast('Success', 'User created successfully. Please check your mail.', 'success');
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
        console.log('Selected Values (raw):', this.selectedValues);
        console.log('Staff ID:', this.modalData.StaffId);

        if (!this.modalData.StaffId) {
            this.showToast('Error', 'Staff ID is missing.', 'error');
            return;
        }

        if (this.selectedValues.length > 0) {
            // ✅ Replace participantPreferredName with 'Participants' before sending to Apex
            const modulesToSave = this.selectedValues.map(module =>
                module === this.participantPreferredName ? 'Participants' : module
            );

            const modulesString = modulesToSave.join(';');
            console.log('Modules to update (final):', modulesString);

            updateUserModuleNames1({ staffId: this.modalData.StaffId, modules: modulesString })
                .then(() => {
                    console.log('User modules updated successfully');
                    this.showModal = false;
                    this.showToast('Success', 'Module access granted to the staff member.', 'success');
                })
                .catch(error => {
                    console.error('Error updating user modules:', error);
                    this.showToast(
                        'Error',
                        error.body ? error.body.message : 'Failed to update user modules.',
                        'error'
                    );
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
        //this.isAccessManager = true;
        //this.isUserManagement = true;
        //this.issingleUserUpload = false;
        //this.isMultiStaffUpload = false;
        /*if(this.moduleName = 'isUserManagement'){
            this.isUserManagement = true;
        } else if(this.moduleName = 'isstaffManagement' ) {
            this.isstaffManagement = true;
        } else if(this.moduleName = 'isuserReport' ) {
            this.isuserReport = true;            
        }*/
        console.log('this.selectedFacility====>'+this.selectedFacility);
    }

     handleResetForm1() {
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
        this.isAccessManager = true;
        //this.isUserManagement = true;
        this.issingleUserUpload = false;
        //this.isMultiStaffUpload = false;
        if(this.moduleName = 'isUserManagement'){
            this.isUserManagement = true;
        } else if(this.moduleName = 'isstaffManagement' ) {
            this.isstaffManagement = true;
        } else if(this.moduleName = 'isuserReport' ) {
            this.isuserReport = true;            
        }
        console.log('this.selectedFacility====>'+this.selectedFacility);
    }

    // Close the modal
    handleCloseModal() {
        this.selectedModules = [];
        this.showModal = false;
        this.modalData = {};
    }

 async handleFinalSubmit() {

    // 🔥 STEP 0: STAFF LIMIT CHECK (ADDED)
    try {
        const remainingSlots = await getRemainingStaffSlots();
        console.log('Remaining staff slots:', remainingSlots);

        const selectedRecords = this.tableData.filter(user => user.isSelected);
        const selectedCount = selectedRecords.length;

        // ❌ Exceeds allowed
        if (selectedCount > remainingSlots) {
            this.showToast(
                'Limit exceeded',
                `You can create only ${remainingSlots} staff members. Please try with ${remainingSlots} or fewer.`,
                'error'
            );
            return;
        }

    } catch (error) {
        console.error('Staff limit check error:', error);
        this.showToast('Error', 'Error checking staff limit', 'error');
        return;
    }
    
    console.log('📦 Table Data BEFORE:', JSON.stringify(this.tableData, null, 2));

    // 1️⃣ Ensure at least one record is selected
    const selectedRecords = this.tableData.filter(user => user.isSelected);
    if (selectedRecords.length === 0) {
        this.showToast('Warning', 'Please select at least one row.', 'warning');
        return;
    }

     const facilityName = selectedRecords[0].Facility;

    const isActive = await isFacilityActive({
        facilityName: facilityName
    });

    if (!isActive) {
        this.showToast(
            'Error',
            `The facility "${facilityName}" is inactive. Staff cannot be created.`,
            'error'
        );
        return;
    }


    // 2️⃣ Filter unprocessed records
    const unprocessedRecords = selectedRecords.filter(
        user => user.ProcessedStatus !== 'Success ✅'
    );

    if (unprocessedRecords.length === 0) {
        this.showToast('Info', 'All selected records are already processed.', 'info');
        return;
    }

    // 3️⃣ Required Fields
    let requiredFields = [
        { key: 'FirstName', label: 'First Name' },
        { key: 'LastName', label: 'Last Name' },
        { key: 'Gender', label: 'Gender' },
        { key: 'PhoneNumber', label: 'Phone Number' },
        { key: 'EmailAddress', label: 'Email Address' },
        { key: 'DateofBirth', label: 'Date of Birth' },
        { key: 'Facility', label: 'Facility' },
        { key: 'HourlyRate', label: 'Hourly Rate' },
        { key: 'TaxFreeThreshold', label: 'Tax Free Threshold' },
        { key: 'StartDate', label: 'Start Date' },
        { key: 'Status', label: 'Status' },
        { key: 'AddressStreet', label: 'Address Street' },
        { key: 'AddressCity', label: 'Address City' },
        { key: 'AddressState', label: 'Address State' },
        { key: 'AdressPostCode', label: 'Address Post Code' },
        { key: 'AddressCountry', label: 'Address Country' },
        // { key: 'ManagementFee', label: 'Management Fee' },
        { key: 'Frequency', label: 'Frequency' }
    ];

    const formatDate = (dateInput) => {
        if (!dateInput) return '';
        const parts = dateInput.split('/');
        if (parts.length === 3) {
            let [day, month, year] = parts;
            if (year.length === 2) year = '20' + year;
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
        const date = new Date(dateInput);
        if (!isNaN(date)) {
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        }
        return '';
    };

    const isValidDateFormat = dateStr => /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);

    let hasInvalidRecords = false;

    // 4️⃣ Validation
    this.tableData = this.tableData.map(user => {
        if (user.isSelected && user.ProcessedStatus !== 'Success ✅') {

            const missingFields = requiredFields
                .filter(field => !user[field.key])
                .map(field => field.label);

            if (missingFields.length > 0) {
                const name = `${user.FirstName || 'User'} ${user.LastName || ''}`;
                const message = `Missing required fields for ${name}: ${missingFields.join(', ')}`;
                this.handleGlobalError(user.id, message);
                return { ...user, ProcessedStatus: 'Error ❌: Missing Required Fields' };
            }

            // ABN–TFN Rule
            const abn = user.AustralianBusinessNumber?.trim();
            const tfn = user.TaxFileNumber?.trim();

            if ((!abn && !tfn) || (abn && tfn)) {
                const name = `${user.FirstName || 'User'} ${user.LastName || ''}`;
                const message = `For ${name}, provide ONLY ONE of ABN or TFN.`;
                this.handleGlobalError(user.id, message);
                return { ...user, ProcessedStatus: 'Error ❌: ABN/TFN Rule Failed' };
            }
        }
        return user;
    });

    if (hasInvalidRecords) return;

    let validRecords = [];

    try {
        validRecords = unprocessedRecords
            .filter(user => {
                const allRequiredOK = requiredFields.every(field => !!user[field.key]);
                const abn = user.AustralianBusinessNumber?.trim();
                const tfn = user.TaxFileNumber?.trim();
                const abnTfnOK = (abn && !tfn) || (!abn && tfn);
                return allRequiredOK && abnTfnOK;
            })
            .map(user => {

                const formattedDOB = formatDate(user.DateofBirth);
                const formattedStart = formatDate(user.StartDate);

                const name = `${user.FirstName || 'Unknown'} ${user.LastName || ''}`;

                if (!isValidDateFormat(formattedDOB)) {
                    throw new Error(`Invalid DOB for ${name}`);
                }

                if (!isValidDateFormat(formattedStart)) {
                    throw new Error(`Invalid Start Date for ${name}`);
                }

                user.ProcessedStatus = 'Success ✅';

                return {
                    ...user,
                    DateofBirth: formattedDOB,
                    StartDate: formattedStart
                };
            });

        if (validRecords.length > 0) {
            console.log(`📤 Submitting ${validRecords.length} records`);
            this.uploadDataToApex(validRecords);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        this.showToast('Error', error.message, 'error');
    }

    this.forceTableUpdate();
}
        
    uploadDataToApex(formattedRecords) {
        createAccountsContactsAndStaff({ records: formattedRecords })
            .then(result => {
                const { successRecords, failedRecords } = result;

                console.log('Successful Records:', JSON.stringify(successRecords));
                console.log('Failed Records:', JSON.stringify(failedRecords));

                this.tableData = this.tableData.map(user => {
                    if (!user.isSelected) return user;

                    const successMatch = successRecords.find(
                        r => r.EmailAddress?.toLowerCase() === user.EmailAddress?.toLowerCase()
                    );

                    const failMatch = failedRecords.find(
                        r => r.EmailAddress?.toLowerCase() === user.EmailAddress?.toLowerCase()
                    );

                    if (successMatch) {
                        return {
                            ...user,
                            isSelected: false,
                            ProcessedStatus: 'Success ✅'
                        };
                    }

                    if (failMatch) {
                        return {
                            ...user,
                            ProcessedStatus: `Error ❌: ${failMatch.ErrorMessage}`
                        };
                    }

                    // ✅ Apex returned nothing → DO NOTHING
                    return user;
                });

                this.isProcessed = true;

                // Deselect all rows + header checkbox
                this.resetAllSelections();

                this.forceTableUpdate();
            })
            .catch(error => {
                console.error('Error in Apex method:', error);

                this.tableData = this.tableData.map(user => {
                    if (user.isSelected) {
                        return {
                            ...user,
                            ProcessedStatus: 'Error ❌: Apex Failure'
                        };
                    }
                    return user;
                });

                this.isProcessed = true;

                // Deselect all rows + header checkbox
                this.resetAllSelections();

                this.forceTableUpdate();
            });
    }


    resetAllSelections() {
        console.log('🧹 Resetting ALL checkbox selections');

        // 1️⃣ Clear selected IDs
        this.selectedRecordIds.clear();

        // 2️⃣ Uncheck all rows
        this.tableData = this.tableData.map(row => ({
            ...row,
            isSelected: false
        }));

        // 3️⃣ Reset header checkbox
        this.isAllSelected = false;

        // 4️⃣ Disable submit button
        this.enableddisabled = true;

        // 5️⃣ Refresh pagination
        this.paginateData();

        console.log('✅ All selections cleared');
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

    get detailsClass(){
        return (this.isUserManagement) ? 'menu-item1' : 'menu-item'; 
    
    }

    get settingsClass() {
        return this.isstaffManagement ? 'menu-item1' : 'menu-item';
    }

    get securityClass(){
        return (this.isuserReport ) ? 'menu-item1' : 'menu-item';
    }

    handleSwitchToCreateStaff() {
        console.log("Hello from client bulk upload .");

        const customEvent = new CustomEvent("clienteventfrombulk", {
        detail: { message: "Hello from client bulk upload!" }
        });
        this.dispatchEvent(customEvent);
                this.uploadBtnContainer= true;
        this.tableData=[]
    }

    handleCancel() {
        this.uploadBtnContainer= true;
        this.tableData=[]
        this.isProcessed = false;
    }

    handleGlobalError(userId, message) {
        console.error("❌ Global Error:", message);

        // Disable submit button globally
        this.enableddisabled = true;

        // Uncheck the row, if ID provided
        if (userId) {
            this.selectedRecordIds.delete(userId);

            this.tableData = this.tableData.map(row => ({
                ...row,
                isSelected: row.id === userId ? false : row.isSelected
            }));
        }

        // Show toast to user
        this.showToast("Error", message, "error");

        // Refresh UI
        this.paginateData();

        // 🚫 Hard stop: prevent ANY further execution
        // Throw + return ensures ALL code paths end immediately
        throw new Error(message);
        // 🔥 This return is IMPORTANT in async/promises
        return;
    }
 
}