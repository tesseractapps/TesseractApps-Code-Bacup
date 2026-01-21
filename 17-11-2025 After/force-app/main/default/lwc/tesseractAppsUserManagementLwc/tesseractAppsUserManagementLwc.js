import { LightningElement, api, track,wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id';
import createPortalUser from '@salesforce/apex/PortalUserController.createPortalUser';
import createAccountsContactsAndStaff from '@salesforce/apex/PortalUserController.createAccountsContactsAndStaff';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import updateUserModuleNames1 from '@salesforce/apex/UserAccessController.updateUserModuleNames1';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getUserOrgName from '@salesforce/apex/UserAccessController.getUserOrgName';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

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
    @track selectstatus = true;
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
    @track nationalityValue = '';
    @track managementFee = 0;
    @track selectedLanguagesString;
    @track ictflag = false;

    fileUrl = '/resource/UserExportDownload';
    userId = USER_ID;
    UserTypeValues = [];

    @track allNationalities = [
        { label: 'Afghan', value: 'Afghan' },
        { label: 'American', value: 'American' },
        { label: 'Argentinian', value: 'Argentinian' },
        { label: 'Armenian', value: 'Armenian' },
        { label: 'Australian', value: 'Australian' },
        { label: 'Azerbaijani', value: 'Azerbaijani' },
        { label: 'Bahraini', value: 'Bahraini' },
        { label: 'Bangladeshi', value: 'Bangladeshi' },
        { label: 'Bhutanese', value: 'Bhutanese' },
        { label: 'Brazilian', value: 'Brazilian' },
        { label: 'British', value: 'British' },
        { label: 'Bruneian', value: 'Bruneian' },
        { label: 'Burmese', value: 'Burmese' },
        { label: 'Cambodian', value: 'Cambodian' },
        { label: 'Canadian', value: 'Canadian' },
        { label: 'Chilean', value: 'Chilean' },
        { label: 'Chinese', value: 'Chinese' },
        { label: 'Colombian', value: 'Colombian' },
        { label: 'Cuban', value: 'Cuban' },
        { label: 'Egyptian', value: 'Egyptian' },
        { label: 'Emirati', value: 'Emirati' },
        { label: 'Fijian', value: 'Fijian' },
        { label: 'Filipino', value: 'Filipino' },
        { label: 'French', value: 'French' },
        { label: 'German', value: 'German' },
        { label: 'Ghanaian', value: 'Ghanaian' },
        { label: 'Greek', value: 'Greek' },
        { label: 'Indian', value: 'Indian' },
        { label: 'Indonesian', value: 'Indonesian' },
        { label: 'Iranian', value: 'Iranian' },
        { label: 'Iraqi', value: 'Iraqi' },
        { label: 'Israeli', value: 'Israeli' },
        { label: 'Italian', value: 'Italian' },
        { label: 'Jamaican', value: 'Jamaican' },
        { label: 'Japanese', value: 'Japanese' },
        { label: 'Jordanian', value: 'Jordanian' },
        { label: 'Kazakhstani', value: 'Kazakhstani' },
        { label: 'Kenyan', value: 'Kenyan' },
        { label: 'Kuwaiti', value: 'Kuwaiti' },
        { label: 'Kyrgyzstani', value: 'Kyrgyzstani' },
        { label: 'Laotian', value: 'Laotian' },
        { label: 'Lebanese', value: 'Lebanese' },
        { label: 'Malaysian', value: 'Malaysian' },
        { label: 'Maldivian', value: 'Maldivian' },
        { label: 'Mexican', value: 'Mexican' },
        { label: 'Mongolian', value: 'Mongolian' },
        { label: 'Moroccan', value: 'Moroccan' },
        { label: 'Nepali', value: 'Nepali' },
        { label: 'New Zealander', value: 'New Zealander' },
        { label: 'Nigerian', value: 'Nigerian' },
        { label: 'North Korean', value: 'North Korean' },
        { label: 'Norwegian', value: 'Norwegian' },
        { label: 'Omani', value: 'Omani' },
        { label: 'Pakistani', value: 'Pakistani' },
        { label: 'Peruvian', value: 'Peruvian' },
        { label: 'Portuguese', value: 'Portuguese' },
        { label: 'Qatari', value: 'Qatari' },
        { label: 'Russian', value: 'Russian' },
        { label: 'Samoan', value: 'Samoan' },
        { label: 'Saudi', value: 'Saudi' },
        { label: 'Singaporean', value: 'Singaporean' },
        { label: 'South African', value: 'South African' },
        { label: 'South Korean', value: 'South Korean' },
        { label: 'Spanish', value: 'Spanish' },
        { label: 'Sri Lankan', value: 'Sri Lankan' },
        { label: 'Swedish', value: 'Swedish' },
        { label: 'Syrian', value: 'Syrian' },
        { label: 'Taiwanese', value: 'Taiwanese' },
        { label: 'Tajikistani', value: 'Tajikistani' },
        { label: 'Thai', value: 'Thai' },
        { label: 'Tongan', value: 'Tongan' },
        { label: 'Turkish', value: 'Turkish' },
        { label: 'Uzbekistani', value: 'Uzbekistani' },
        { label: 'Vietnamese', value: 'Vietnamese' },
        { label: 'Yemeni', value: 'Yemeni' }
    ];

    @track LANGUAGE_OPTIONS = [
        'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Burmese', 'Dhivehi', 'Dzongkha',
        'English', 'Filipino', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian',
        'Italian', 'Japanese', 'Kazakh', 'Khmer', 'Korean', 'Kyrgyz', 'Lao', 'Malay', 'Mandarin',
        'Mongolian', 'Nepali', 'Persian', 'Portuguese', 'Russian', 'Samoan', 'Sinhala', 'Swahili',
        'Thai', 'Tongan', 'Turkish', 'Urdu', 'Uzbek', 'Vietnamese'
    ];

    @track frequencyValue = '';
    @track allFrequency = [
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Fortnightly', value: 'Fortnightly' },
        { label: 'Monthly', value: 'Monthly' }
    ];

    @track isExpanded = false;


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
        if (this.userTypeRole === 'NDIS Org Admin' || this.userTypeRole === 'Facility Admin') {
            return this.roleOptions;
        } else {
            return this.roleOptions.filter(role => 
                role.value === 'Portal account partner Executive' || 
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
        'NDIS Org Admin': ['Admin', 'Human Resources', 'Incident Register', 'Participants', 'Repository', 'Roster Manager', 'Sign In','My Profile','Accounting', 'Access Manager', 'T sign'],
        'HR Admin': [ 'Human Resources', 'T sign', 'Incident Register', 'Repository', 'Access Manager', 'My Profile'],
        'Payroll Admin' : ['Accounting', 'Incident Register', 'Repository'],
        'Roster Manager' : ['Roster Manager', 'Human Resources', 'Sign In', 'Participants','Accounting', 'T sign', 'Access Manager', 'Incident Register', 'Repository', 'My Profile'],
        'Facility Admin' : ['Roster Manager', 'Human Resources', 'Sign In', 'Participants','Accounting', 'T sign', 'Access Manager', 'Incident Register', 'Repository', 'My Profile'],
        'ICT Admin' : ['Admin', 'Human Resources',  'ICT Timesheets', 'T sign', 'Incident Register', 'My Profile', 'Repository', 'Access Manager'],
        'NDIS Staff' : [ 'Roster Manager','Participants','Sign In', 'Repository', 'My Profile'],
        'ICT Staff' : [ 'My Profile', 'Repository','ICT Timesheets'],
        'NDIS Participant' :['Participants','Incident Register'],
        'Payroll Accountant for Multiple' :['Accounting'],
        'Accountant for Organisation' :['Admin', 'Accounting'],   
    };

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

        window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
        
            getCurrentLoggedUserInfo().then(userData=>{;
                let userTpe=userData.User_Type__c;
                this.typeOfUser = userData.Type_of_User__c;
                //this.typeOfUser = 'ICT';
                if(this.typeOfUser == 'ICT'){
                    this.ictflag = true;
                }
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
        switch (activeTab) {
            case 'accessUser':
                this.moduleName = 'isUserManagement';
                this.isUserManagement = true;
                console.log('this.isUserManagement in Access Manager connectedCallback:' ,this.isUserManagement);
                break;
            case 'accessStaff':
                this.moduleName = 'isstaffManagement';
                this.isstaffManagement = true;
                console.log('this.isstaffManagement in Access Manager connectedCallback:' ,this.isstaffManagement);
                break;
            case 'accessUserReport':
                 this.moduleName = 'isuserReport';
                this.isuserReport = true;
                console.log('this.isuserReport in Access Manager connectedCallback:' ,this.isuserReport);
                break;
            
            default:
                this.moduleName = 'isUserManagement';
                this.isUserManagement = true;
                console.log('this.isUserManagement in Access Manager default  connectedCallback:' ,this.isUserManagement);

        }

        this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
            id: lang,
            label: lang,
            checked: false,
            buttonClass: 'option-button',
            badgeClass: 'status-badge inactive',
            statusText: 'Inactive'
        }));

        console.log('Languages>>', this.Languages);
    }

    handleFrequencyChange(event) {
        this.frequencyValue = event.detail.value;
        console.log('Selected Frequency:', this.frequencyValue);
    }

    handleManagementFeeChange(event) {
        this.managementFee = event.target.value;
        console.log('💰 Management Fee updated:', this.managementFee);
    }

    handleLanguageToggle(event) {
        const optionId = event.target.dataset.optionId;
        const isChecked = event.target.checked;

        console.log('🌀 [handleLanguageToggle] START');
        console.log('👉 Toggled Language:', optionId);
        console.log('✅ Checked:', isChecked);

        // Ensure selectedLangs is always an array
        if (!Array.isArray(this.selectedLangs)) {
            this.selectedLangs = [];
        }

        if (isChecked) {
            if (!this.selectedLangs.includes(optionId)) {
                this.selectedLangs = [...this.selectedLangs, optionId];
                console.log('➕ Added:', optionId);
            }
        } else {
            this.selectedLangs = this.selectedLangs.filter(v => v !== optionId);
            console.log('➖ Removed:', optionId);
        }

        // Log as semicolon-separated string without changing the array itself
        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLangs.join(';'));
        const selectedLanguagesStr = this.selectedLangs.join(';');
        console.log('📋 Updated Selected Languages (semicolon):', selectedLanguagesStr);

        // ✅ Store it in a tracked or reactive variable (if you need to use it later)
        this.selectedLanguagesString = selectedLanguagesStr;
        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLanguagesString);

        this.refreshValues();

        console.log('🔁 Values refreshed');
        console.log('🌀 [handleLanguageToggle] END');
        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLangs.join(';'));
    }

    refreshValues() {
        console.log('🌀 [refreshValues] START');
        console.log('📋 Current Selected Languages:', JSON.stringify(this.selectedLangs));

        this.Languages = this.Languages.map(opt => {
            const isSelected = this.selectedLangs.includes(opt.id);
            console.log(`🔄 Processing: ${opt.id} | Selected: ${isSelected}`);

            return {
                ...opt,
                checked: isSelected,
                badgeClass: isSelected
                    ? 'status-badge active'
                    : 'status-badge inactive',
                statusText: isSelected ? 'Active' : 'Inactive'
            };
        });

        console.log('✅ Updated Languages State:', JSON.stringify(this.Languages));
        console.log('🌀 [refreshValues] END');
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

    handleDropdownToggle() {
        this.isExpanded = !this.isExpanded;
    }

    handleNationalityChange(event) {
        this.nationalitiesValues = event.detail.value;
        console.log('Selected nationality:', this.nationalitiesValues);
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

/*     handleStatus(event){
        this.selectstatus = event.target.checked;        
    } */

    handleDownloadTemplate(event){
        /*const fileUrl = '/resource/User_Details_Upload_Template';  // Update the file URL if necessary
        window.open(fileUrl, '_blank');*/

        console.log('type of user: ',this.typeOfUser);
        if(this.typeOfUser=='NDIS'){
            const fileUrl = '/resource/User_Details_Upload_Template';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
            
        } else if(this.typeOfUser=='ICT'){
            const fileUrl = '/resource/User_Details_Upload_Template_ICT';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        }

    }

    handleInstructions(event){
        console.log('type of user: ',this.typeOfUser);
        if(this.typeOfUser=='NDIS'){
            const fileUrl = '/resource/Bulk_Upload_Instructions_User';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
            
        } else if(this.typeOfUser=='ICT'){
            const fileUrl = '/resource/ICT_User_Bulk_Upload_Instructions_';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        }   
    }

    handleTaxFreeThreesholdChange(event){
        this.selectedTaxFree = event.target.value;
    }

    handleSwitchToSingleUserForm() {
        this.isMultiUserUpload = false;
        this.isProcessed = false;
        this.handleResetForm1();
    }

    handlecancelForm(){
        this.handleResetForm();
    }

    handleSwitchToMultiUserUpload() {
        this.isMultiUserUpload = true;
        this.issingleUserUpload = false;
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

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No Data',
                    message: 'No data available to display.',
                    variant: 'error',
                    mode: 'dismissable'
                })
            );

            return;
        }
    
        this.totalRecords = this.tableData.length; // Total records without filtering
        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        
        //this.paginatedData = this.tableData.slice(startIndex, endIndex);
         this.paginatedData = this.tableData.slice(startIndex, endIndex).map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
      //  this.enableddisabled = true;

        this.enableddisabled = this.selectedRecordIds.size === 0;
        this.isAllSelected =
            this.paginatedData.length > 0 &&
            this.paginatedData.every(u => u.isSelected);

        this.updatePaginationButtons();
    
        //console.log('Paginated Data:', JSON.stringify(this.paginatedData));
        //console.log('Paginated Data:', JSON.stringify(this.paginatedData.length));

    }

    parseCSV(data) {
        const rows = data.split('\r').map(row => row.trim());

        // ✅ 1. Check for empty or only-header CSV
        if (rows.length < 2 || !rows[1] || rows[1].split(',').every(cell => cell.trim() === '')) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid File',
                    message: 'CSV must contain at least one header row and one data row.',
                    variant: 'error',
                    mode: 'dismissable'
                })
            );
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
                        variant: 'error',
                        mode: 'dismissable'
                    })
                );
                return [];
            }
            seenHeaders.add(cleanedHeader);
        }

        // ✅ 4. Define required headers
        let requiredHeaders = [
            'FirstName', 'LastName', 'Gender', 'PhoneNumber', 'EmailAddress',
            'DateofBirth', 'Role', 'UserType', 'Facility', 'HourlyRate',
            'TaxFileNumber', 'TaxFreeThreshold', 'StartDate', 'Status',
            'AddressStreet', 'AddressCity', 'AddressState', 'AdressPostCode',
            'AddressCountry', 'ManagementFee', 'Languages', 'Nationality', 'Frequency'
        ];

        // Adjust required headers based on user type
        if (this.typeOfUser === 'ICT') {
            requiredHeaders = requiredHeaders.filter(
                header => header !== 'Languages' && header !== 'Nationality'
            );
        }

        // ✅ 5. Check for missing required headers
        for (let required of requiredHeaders) {
            const exists = headerRow.some(h => h.replace(/ /g, '') === required);
            if (!exists) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Missing Column',
                        message: `Missing required column: ${required}`,
                        variant: 'error',
                        mode: 'dismissable'
                    })
                );
                return [];
            }
        }

        // ✅ 6. Parse data rows
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

        // ✅ 7. Role validation
        if (this.typeOfUser === 'NDIS') {
            const validRoles = ['Org Admin', 'Staff', 'Roster Admin'];
            const validRosterAdminTypes = [
                'Roster Manager',
                'HR Admin',
                'Payroll Admin',
                'NDIS Participant',
                'Payroll Accountant for Multiple',
                'Accountant for Organisation'
            ];

            for (let record of parsedData) {
                if (!validRoles.includes(record.Role)) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role',
                            message: `Invalid Role for NDIS user: "${record.Role}". Allowed roles: ${validRoles.join(', ')}`,
                            variant: 'error',
                            mode: 'dismissable'
                        })
                    );
                    return [];
                }

                // Org Admin or FacilityAdmin
                if ((record.Role === 'Org Admin') &&
                    record.UserType !== 'NDIS Org Admin' && record.UserType !== 'Facility Admin') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: `For NDIS users, if Role is "${record.Role}", then UserType must be "NDIS Org Admin" or "NDIS FacilityAdmin".`,
                            variant: 'error',
                            mode: 'dismissable'
                        })
                    );
                    return [];
                }

                // Staff
                if (record.Role === 'Staff' && record.UserType !== 'NDIS Staff') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: `For NDIS users, if Role is "Staff", then UserType must be "NDIS Staff".`,
                            variant: 'error',
                            mode: 'dismissable'
                        })
                    );
                    return [];
                }

                // Roster Admin
                if (record.Role === 'Roster Admin' && !validRosterAdminTypes.includes(record.UserType)) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: `For NDIS users, if Role is "Roster Admin", then UserType must be one of: ${validRosterAdminTypes.join(', ')}.`,
                            variant: 'error',
                            mode: 'dismissable'
                        })
                    );
                    return [];
                }
            }
        }

        // ✅ ICT validation
        if (this.typeOfUser === 'ICT') {
            const validRoles = ['Org Admin', 'Staff'];
            const validOrgAdminTypes = ['ICT Admin', 'Facility Admin'];

            for (let record of parsedData) {
                if (!validRoles.includes(record.Role)) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role',
                            message: `Invalid Role for ICT user: "${record.Role}". Allowed roles: ${validRoles.join(', ')}`,
                            variant: 'error',
                            mode: 'dismissable'
                        })
                    );
                    return [];
                }

                if (record.Role === 'Org Admin' && !validOrgAdminTypes.includes(record.UserType)) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: `For ICT users, if Role is "Org Admin", then UserType must be one of: ${validOrgAdminTypes.join(', ')}.`,
                            variant: 'error',
                            mode: 'dismissable'
                        })
                    );
                    return [];
                }

                if (record.Role === 'Staff' && record.UserType !== 'ICT Staff') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: `For ICT users, if Role is "Staff", then UserType must be "ICT Staff".`,
                            variant: 'error',
                            mode: 'dismissable'
                        })
                    );
                    return [];
                }
            }
        }

        console.log('Parsed Data:', JSON.stringify(parsedData));
        return parsedData;
    }




    @track selectedRecordIds = new Set();
    handleRowSelection(event) {
        const userId = Number(event.currentTarget.dataset.id);
        const isChecked = event.target.checked;
    
        if (!userId) {
            console.error('User ID is undefined');
            return;
        }
        if (isChecked) {
            this.selectedRecordIds.add(userId);
        } else {
            this.selectedRecordIds.delete(userId);
        }
    
        // Update main tableData instead of just paginatedData
        // this.tableData = this.tableData.map(user =>
        //     user.id === userId ? { ...user, isSelected: isChecked } : user
        // );
         this.tableData = this.tableData.map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));
    
        // Ensure paginatedData reflects the change
        this.paginateData();
    
        // Check if all rows on the current page are selected
       // this.isAllSelected = this.paginatedData.every(user => user.isSelected);
    
        // Reverse logic: disable when at least one row is selected
        //this.enableddisabled = !this.tableData.some(user => user.isSelected);
         this.enableddisabled = this.selectedRecordIds.size === 0;
        this.isAllSelected =
                this.paginatedData.length > 0 &&
                this.paginatedData.every(user => user.isSelected);
    
        console.log('this.isAllSelected ===> ' + this.isAllSelected);
        console.log('this.enableddisabled ===> ' + this.enableddisabled);
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


        if(this.ictflag = false){
            if (!this.nationalitiesValues) {
                this.showToast('Error', 'Please enter Nationality.', 'error');
                return;
            }

            if (!this.selectedLanguagesString) {
                this.showToast('Error', 'Please enter Languages.', 'error');
                return;
            }
        }

        if (!this.frequencyValue) {
            this.showToast('Error', 'Please enter Frequency.', 'error');
            return;
        }

        if (!this.managementFee) {
            this.showToast('Error', 'Please enter Management Fee (%).', 'error');
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
            selectedGender: this.selectedGender,
            nationalitiesValues: this.nationalitiesValues,
            selectedLanguagesString: this.selectedLanguagesString,
            frequencyValue: this.frequencyValue,
            managementFee: this.managementFee
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
        this.nationalitiesValues= '';
        this.selectedLanguagesString= '';
        this.frequencyValue= '';
        this.managementFee= '';
        //this.isAccessManager = true;
        //this.isUserManagement = true;
        //this.issingleUserUpload = false;
        //this.isMultiUserUpload = false;
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
        //this.isMultiUserUpload = false;
        if(this.moduleName = 'isUserManagement'){
            this.isUserManagement = true;
        } else if(this.moduleName = 'isstaffManagement' ) {
            this.isstaffManagement = true;
        } else if(this.moduleName = 'isuserReport' ) {
            this.isuserReport = true;            
        }
        this.nationalitiesValues= '';
        this.selectedLanguagesString= '';
        this.frequencyValue= '';
        this.managementFee= '';
        console.log('this.selectedFacility====>'+this.selectedFacility);
    }


    // Close the modal
    handleCloseModal() {
        this.selectedModules = [];
        this.showModal = false;
        this.modalData = {};
    }

 
    handleFinalSubmit() {
        console.log('Table data before processing:', JSON.stringify(this.tableData));

        const selectedRecords = this.tableData.filter(user => user.isSelected);
        let validRecords = [];
        let hasInvalidRecords = false;

        // if (selectedRecords.length === 0) {
        //     this.showToast('Warning', 'Please select at least one record to process.', 'warning');
        //     return;
        // }

        const unprocessedRecords = selectedRecords.filter(user => user.ProcessedStatus !== 'Success ✅');

        // if (unprocessedRecords.length === 0) {
        //     this.showToast('Info', 'All selected records were already processed successfully.', 'info');
        //     return;
        // }

        // Required field list with friendly names
        let requiredFields = [
            { key: 'FirstName', label: 'First Name' },
            { key: 'LastName', label: 'Last Name' },
            { key: 'Gender', label: 'Gender' },
            { key: 'PhoneNumber', label: 'Phone Number' },
            { key: 'EmailAddress', label: 'Email Address' },
            { key: 'DateofBirth', label: 'Date of Birth' },
            { key: 'Role', label: 'Role' },
            { key: 'UserType', label: 'User Type' },
            { key: 'Facility', label: 'Facility' },
            { key: 'HourlyRate', label: 'Hourly Rate' },
            { key: 'TaxFileNumber', label: 'Tax File Number' },
            { key: 'TaxFreeThreshold', label: 'Tax Free Threshold' },
            { key: 'StartDate', label: 'Start Date' },
            { key: 'Status', label: 'Status' },
            { key: 'AddressStreet', label: 'Address Street' },
            { key: 'AddressCity', label: 'Address City' },
            { key: 'AddressState', label: 'Address State' },
            { key: 'AdressPostCode', label: 'Address Post Code' },
            { key: 'AddressCountry', label: 'Address Country' },
            { key: 'ManagementFee', label: 'Management Fee' },
            { key: 'Languages', label: 'Languages' },
            { key: 'Nationality', label: 'Nationality' },
            { key: 'Frequency', label: 'Frequency' }
        ];

        // Remove Languages and Nationality for ICT users
        if (this.typeOfUser === 'ICT') {
            requiredFields = requiredFields.filter(
                field => field.key !== 'Languages' && field.key !== 'Nationality'
            );
        }


        // Format to dd/MM/yyyy
        const formatDate = (dateInput) => {
            if (!dateInput) return '';
            const parts = dateInput.split('/');
            if (parts.length === 3) {
                let [day, month, year] = parts;
                if (year.length === 2) year = '20' + year;
                return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
            const date = new Date(dateInput);
            if (isNaN(date)) return '';
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        };

        const isValidDateFormat = (dateStr) => /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);

        // Update records with error if fields are missing
        this.tableData = this.tableData.map(user => {
            if (user.isSelected && user.ProcessedStatus !== 'Success ✅') {
                const missingFields = requiredFields
                    .filter(field => !user[field.key])
                    .map(field => field.label);

                if (missingFields.length > 0) {
                    hasInvalidRecords = true;
                    const name = `${user.FirstName || 'User'} ${user.LastName || ''}`;
                    const message = `Missing required fields for ${name}: ${missingFields.join(', ')}`;
                    this.showToast('Error ', message, 'error');
                    return { ...user, ProcessedStatus: 'Error ❌: Missing Required Fields' };
                }
            }
            return user;
        });

        try {
            validRecords = unprocessedRecords
                .filter(user => {
                    return requiredFields.every(field => !!user[field.key]);
                })
                .map(user => {
                    const formattedDOB = formatDate(user.DateofBirth);
                    const formattedStart = formatDate(user.StartDate);

                    const name = `${user.FirstName || 'Unknown'} ${user.LastName || ''}`;

                    if (!isValidDateFormat(formattedDOB)) {
                        throw new Error(`Invalid date format in "Date of Birth" for ${name}. Use dd/MM/yyyy.`);
                    }

                    if (!isValidDateFormat(formattedStart)) {
                        throw new Error(`Invalid date format in "Start Date" for ${name}. Use dd/MM/yyyy.`);
                    }

                    return {
                        ...user,
                        DateofBirth: formattedDOB,
                        StartDate: formattedStart
                    };
                });

            if (validRecords.length > 0) {
                console.log('Submitting Records:', JSON.stringify(validRecords));
                this.uploadDataToApex(validRecords);
            }

        } catch (error) {
            console.error('Submission failed:', error.message);
            this.showToast('Error', error.message, 'error');
        }

        this.forceTableUpdate(); // UI refresh
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
                            user.isSelected = false;
                            return { ...user, ProcessedStatus: 'Success ✅' };
                        } else if (failedRecord) {
                            return { ...user, ProcessedStatus: `Error ❌: ${failedRecord.ErrorMessage}` };
                        }
                        return user;
                    });

                    this.isProcessed = true;  // Make "Processed Status" column visible
                    this.forceTableUpdate();  // Refresh UI and pagination

                    // Show toast message with counts
                    const successCount = successRecords.length;
                    const failedCount = failedRecords.length;

                    if (successCount > 0 && failedCount > 0) {
                        this.showToast('Info', `${successCount} records processed successfully, ${failedCount} records failed.`, 'info');
                    } else if (successCount > 0) {
                        this.showToast('Success', `${successCount} records processed successfully.`, 'success');
                    } else if (failedCount > 0) {
                        this.showToast('Error', `${failedCount} records failed to process.`, 'error');
                    }

                })
                .catch(error => {
                    console.error('Error in Apex method:', error);
                    // Mark all selected records with a general error
                    this.tableData = this.tableData.map(user => ({
                        ...user,
                        ProcessedStatus: user.isSelected ? 'Error ❌: Unexpected Processing Error' : user.ProcessedStatus
                    }));
                    this.isProcessed = true;
                    this.forceTableUpdate();

                    // Show general error toast
                    this.showToast('Error', 'An unexpected error occurred while processing records.', 'error');
                });
        }

        
        // 🚀 Force UI to Refresh Processed Status and Pagination
        forceTableUpdate() {
            console.log('🔁 [forceTableUpdate] Forcing pagination refresh...');

            // ✅ Step 1: Reset to first page first
            this.currentPage = 1;
            this.pageNumber = 1;
            this.bDisableFirst = true;
            this.bDisableFirst = true;

            // ✅ Step 2: Recalculate pagination indexes
            this.refreshPaginationIndexes();

            // ✅ Step 3: Refresh paginated data
            this.refreshPaginatedData();

            console.log(`✅ [forceTableUpdate] Pagination reset to Page ${this.currentPage}`);
        }


        // 🚀 Recalculate Pagination Indexes
        refreshPaginationIndexes() {
            const pageSize = this.pageSize || 10; // Use selected page size if available

            // Ensure currentPage is valid
            if (!this.currentPage || isNaN(this.currentPage) || this.currentPage <= 0) {
                this.currentPage = 1;
            }

            // Calculate start and end index
            this.startIndex = (this.currentPage - 1) * pageSize;
            this.endIndex = this.startIndex + pageSize;

            console.log(`📄 [refreshPaginationIndexes] Page: ${this.currentPage}, Start: ${this.startIndex}, End: ${this.endIndex}`);
        }


        
        // 🚀 Refresh Paginated Data
        refreshPaginatedData() {
            if (Array.isArray(this.tableData) && this.tableData.length > 0) {
                this.paginatedData = this.tableData.slice(this.startIndex, this.endIndex);
                console.log(`✅ [refreshPaginatedData] Showing records ${this.startIndex + 1}–${Math.min(this.endIndex, this.tableData.length)} of ${this.tableData.length}`);
            } else {
                console.warn('⚠️ [refreshPaginatedData] No data available for pagination');
                this.paginatedData = [];
            }
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

    @track isUserManagement = true;
    @track isstaffManagement = false;
    @track isuserReport = false;
    @track moduleName = 'isUserManagement';
    handleUserManagement(event){
        this.moduleName = 'isUserManagement';
        this.isUserManagement = true;
        this.isstaffManagement = false;
        this.isuserReport = false;
        //console.log('this.moduleName >>',this.moduleName);
        localStorage.setItem('activeAccessManagerTab', 'accessUser');   
        // ✅ Add listener only for this module
        window.addEventListener('keydown', this.handleKeyShortcutBound);
    }

    handleStaffManagement(event){
        this.moduleName = 'isstaffManagement';
        this.isstaffManagement = true;
        this.isUserManagement = false;
        this.isuserReport = false;
        //console.log('this.moduleName >>',this.moduleName);
        localStorage.setItem('activeAccessManagerTab', 'accessStaff'); 
        // ❌ Remove listener when switching module
        window.removeEventListener('keydown', this.handleKeyShortcutBound);
    }

    handleUserReport(event){
        this.moduleName = 'isuserReport';
        this.isuserReport = true;
        this.isstaffManagement = false;
        this.isUserManagement = false;
        //console.log('this.moduleName >>',this.moduleName);
        localStorage.setItem('activeAccessManagerTab', 'accessUserReport');
        // ❌ Remove listener when switching module
        window.removeEventListener('keydown', this.handleKeyShortcutBound);
    }

    handleCreateUser(event){
        console.log('navigated to multi upload', this.isMultiUserUpload);
        this.issingleUserUpload = true;
        this.isuserReport = false;
        this.isstaffManagement = false;
        this.isUserManagement = false;
        this.isAccessManager = false;
        this.isMultiUserUpload = false;
    }
   
    disconnectedCallback() {
        window.removeEventListener('keydown', this.handleKeyShortcutBound); 
    }

    handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            event.preventDefault();
            this.handleCreateUser();
            }
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyU') {
            event.preventDefault();
            this.isAccessManager = false;
            this.handleSwitchToMultiUserUpload();
            }
        if (this.isMultiUserUpload && event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
            event.preventDefault();
            this.handleSwitchToSingleUserForm();
            }
    }

    handleCancel() {
        this.tableData=[]
        this.isProcessed = false;
        //this.handleResetForm1();
    }
    
}