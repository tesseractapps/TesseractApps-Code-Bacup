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
import isStaffLimitReached from '@salesforce/apex/LimitCheckService.isStaffLimitReached';

export default class TesseractAppsUserManagement extends LightningElement {
    _contactData;

    @api
    set contactData(value) {

        console.log('==============================');
        console.log('📥 contactData setter triggered');
        console.log('Incoming value:', JSON.stringify(value));

        this._contactData = value;

        if (value && Object.keys(value).length > 0) {

            console.log('✅ Valid contactData received');
            console.log('First Name:', value.firstName);
            console.log('Last Name:', value.lastName);
            console.log('Email:', value.email);
            console.log('Contact Number:', value.contactNumber);

            this.issingleUserUpload = true;
            this.isMultiUserUpload = false;
            this.isAccessManager = false;
            this.disableMode = true;
            this.bulkUploadflag = false;

            // Optional prefill
            this.selectedRole = 'Portal Account Partner Manager';
            this.selectedUserType = 'NDIS Participant';
            this.firstName = value.firstName || '';
            this.lastName = value.lastName || '';
            this.email = value.email || '';
            this.phoneNumber = value.contactNumber || '';

            console.log('🔄 Component state updated:');
            console.log('this.firstName:', this.firstName);
            console.log('this.lastName:', this.lastName);
            console.log('this.email:', this.email);
            console.log('this.phoneNumber:', this.phoneNumber);
        } else {
            console.warn('⚠️ contactData is empty or undefined');
        }

        console.log('==============================');
    }

    get contactData() {
        return this._contactData;
    }

    _selectedFacilities;

    @api
    set selectedFacilities(value) {
        this._selectedFacilities = value;

        console.log('Received Facilities from Parent:', value);

        if (value && value.length > 0) {
            this.selctedMultipleFcailityValues = [...value];
        }
    }

    get selectedFacilities() {
        return this._selectedFacilities;
    }
    @track disableMode = false;
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
    @track managementFee = '';
    @track selectedLanguagesString;
    @track ictflag = false;
    @track abn;
    @track showAddress = true;
    @track displayTextLang = 'Select Languages';
    @track bulkUploadflag = true;
    @track showUpgradeModal = false;

    selectedParticipant = '';

    participantValues = [
        { label: 'Parent / Guardian', value: 'Parent' },
        { label: 'Child (NDIS Participant)', value: 'Child' },
        { label: 'Both Parent and Child', value: 'Both' }
    ];


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
        if (this.userTypeRole === 'NDIS Org Admin' || this.userTypeRole === 'Facility Admin') {
            return this.roleOptions;
        } else {
            return this.roleOptions.filter(role => 
                role.value === 'Portal Account Partner Executive' || 
                role.value === 'Portal Account Partner User'
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
        'NDIS Org Admin': ['Admin', 'Human Resources', 'Incident Register', 'Participants', 'Repository', 'Roster Manager', 'Sign In','My Profile','Accounting', 'Access Manager', 'T sign', 'Forms', 'Reports'],
        'HR Admin': [ 'Human Resources', 'T sign', 'Incident Register', 'Repository', 'Access Manager', 'My Profile', 'Reports'],
        'Payroll Admin' : ['Accounting', 'Incident Register', 'Repository', 'Reports'],
        'Roster Manager' : ['Roster Manager', 'Human Resources', 'Sign In', 'Participants','Accounting', 'T sign', 'Access Manager', 'Incident Register', 'Repository', 'My Profile', 'Forms', 'Reports'],
        'Facility Admin' : ['Admin','Roster Manager', 'Human Resources', 'Sign In', 'Participants','Accounting', 'T sign', 'Access Manager', 'Incident Register', 'Repository', 'My Profile', 'Forms', 'Reports'],
        'ICT Admin' : ['Admin', 'Human Resources',  'ICT Timesheets', 'T sign', 'Incident Register', 'My Profile', 'Accounting', 'Repository', 'Access Manager'],
        'NDIS Staff' : [ 'Roster Manager','Participants','Sign In', 'Incident Register', 'Repository', 'My Profile'],
        'ICT Staff' : [ 'My Profile', 'Repository', 'ICT Timesheets'],
        'NDIS Participant' :['Participants'],
        'Payroll Accountant for Multiple' :['Accounting'],
        'Accountant for Organisation' :['Admin', 'Accounting'],   
    };

    connectedCallback() {
        console.log('Received from parent:', this.contactData);
        this.enableddisabled = true;
        this.moduleName = 'isUserManagement';
        this._handleOutsideClick = this.handleOutsideClick.bind(this);
        document.addEventListener('click', this._handleOutsideClick);
        this.fetchMultiFaciltyOptions();
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
                //this.typeOfUser = 'ICT';
                console.log('this.typeOfUser ===>', this.typeOfUser);

                if (this.typeOfUser === 'ICT') {
                    this.ictflag = true;
                } else {
                    this.ictflag = false;
                }

                console.log('this.ictflag ===>', this.ictflag);
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
        if (this.selectedLangs.length > 0) {
            // Map selected IDs to labels
            const selectedLabels = this.selectedLangs
                .map(id => {
                    const lang = this.Languages.find(l => l.id === id);
                    return lang ? lang.label : null;
                })
                .filter(label => label !== null);

            // Show all selected values
            this.displayTextLang = selectedLabels.join('; ');
        } else {
            this.displayTextLang = 'Select Languages';
        }

        this.refreshValues();

        console.log('🔁 Values refreshed');
        console.log('🌀 [handleLanguageToggle] END');
        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLangs.join(';'));
    }

    refreshValues() {
        console.log('🌀 [refreshValues] START');

        // ✅ Ensure selectedLangs is always valid
        if (!Array.isArray(this.selectedLangs)) {
            this.selectedLangs = [];
        }

        console.log(
            '📋 Current Selected Languages:',
            JSON.stringify(this.selectedLangs)
        );

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

        console.log(
            '✅ Updated Languages State:',
            JSON.stringify(this.Languages)
        );
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

    updateModules() {

        let userType;

        if (this.modalData.userType === 'NDIS Participants') {
            userType = 'NDIS Participant';
        } else {
            userType = this.modalData.userType;
        }

        console.log('userType ==> ', userType);

        let modules = this.moduleMap[userType] || [];

        /* -----------------------------------------
        UI LABEL MAPPING
        ----------------------------------------- */

        modules = modules.map(module => {

            // Replace Participants with preferred name
            if (module === 'Participants' && this.participantPreferredName) {
                return this.participantPreferredName;
            }

            // Replace Repository with Document (UI only)
            if (module === 'Repository') {
                return 'Document';
            }

            return module;
        });

        this.modules = modules;
        this.showModal = true;

        console.log('Modules for UI => ', JSON.stringify(this.modules));
    }

    handleDropdownToggle(event) {
        if (event) {
            event.stopPropagation();
        }
        this.isExpanded = !this.isExpanded;
        console.log('Dropdown toggled. isExpanded => ', this.isExpanded);
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

    get isNDISParticipant() {
        return this.selectedUserType === 'NDIS Participant';
    }

    handleParticipantChange(event) {
        this.selectedParticipant = event.detail.value; // ✅ correct
        console.log('Selected Participant:', this.selectedParticipant);
    }

    handleGenderChange(event){
        this.selectedGender = event.target.value;
    }

    handleDownloadTemplate(event){
        console.log('type of user: ',this.typeOfUser);
        const fileUrl = '/resource/Bulk_Upload_User';
        window.open(fileUrl, '_blank');
    }

    handleInstructions(event){
        console.log('type of user: ',this.typeOfUser);
        if(this.typeOfUser=='NDIS'){
            const fileUrl = '/resource/Bulk_Upload_Instructions_For_NDIS_User';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
            
        } else if(this.typeOfUser=='ICT'){
            const fileUrl = '/resource/Bulk_Upload_Instructions_For_ICT_User';  // Update the file URL if necessary
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
            console.log('📖 File read completed');

            const fileContent = reader.result;
            const parsedData = this.parseCSV(fileContent);
            const uniqueData = this.removeDuplicateEmailRows(parsedData);

            console.log('📊 Parsed rows:', parsedData.length);
            console.log('📊 Unique rows:', uniqueData.length);

            /* RESET PAGINATION STATE */
            this.pageNumber = 1;
            this.totalRecords = 0;
            this.totalPages = 0;
            this.selectedRecordIds.clear();

            /*SET NEW DATA */
            this.tableData = uniqueData;

            console.log('📦 tableData set, length:', this.tableData.length);

            this.paginateData();
        };

        reader.onerror = () => {
            console.error('❌ Error reading file:', reader.error);
        };

        reader.readAsText(file);
    }

    removeDuplicateEmailRows(data) {
        console.log('removeDuplicateEmailRows');

        const emailSet = new Set();
        const validRecords = [];
        let duplicateCount = 0;

        data.forEach(user => {
            const email = (user.emailaddress || '').trim().toLowerCase();

            // ✅ Ignore empty emails (do NOT treat as duplicates)
            if (!email) {
                validRecords.push(user);
                return;
            }

            if (emailSet.has(email)) {
                duplicateCount++;
            } else {
                emailSet.add(email);
                validRecords.push(user);
            }
        });

        // ✅ Show message ONLY if duplicates actually exist
        if (duplicateCount > 0) {
            this.showToast(
                'Duplicate Records Removed',
                `${duplicateCount} duplicate Email ID record(s) were removed.`,
                'warning'
            );
        }

        return validRecords;
    }

    paginateData() {
        if (!this.tableData || this.tableData.length === 0) {
            console.log('No data to paginate');
            this.paginatedData = [];
            this.totalRecords = 0;
            this.totalPages = 0;
            return;
        }

        // 🔥 SAFETY RESET
        if (this.pageNumber < 1) {
            this.pageNumber = 1;
        }

        const maxPage = Math.ceil(this.tableData.length / this.recordsPerPage);
        if (this.pageNumber > maxPage) {
            this.pageNumber = 1;
        }

        this.totalRecords = this.tableData.length;

        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;

        this.paginatedData = this.tableData.slice(startIndex, endIndex).map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));

        this.totalPages = maxPage;
        this.enableddisabled = this.selectedRecordIds.size === 0;

        this.updatePaginationButtons();

        console.log('📄 Paginated rows:', this.paginatedData.length);
    }

    // ✅ Header normalizer (USED EVERYWHERE)
    normalizeHeader(value) {
        return value
            ?.toString()
            .trim()
            .replace(/\s+/g, '')
            .replace(/\?/g, '')
            .toLowerCase();
    }

    parseCSV(data) {
        // ✅ Works for Windows / Mac / Excel / Sheets
        const rows = data.split(/\r?\n/).map(row => row.trim());

        /*Empty / invalid file check */
        if (
            rows.length < 2 ||
            !rows[1] ||
            rows[1].split(',').every(cell => cell.trim() === '')
        ) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid File',
                    message: 'CSV must contain at least one header row and one data row.',
                    variant: 'error'
                })
            );
            return [];
        }

        /* Extract headers*/
        const headerRow = rows[0].split(',').map(h => h.trim());
        const seenHeaders = new Set();

        /*Duplicate header check (normalized)*/
        for (let header of headerRow) {
            const normalized = this.normalizeHeader(header);
            if (seenHeaders.has(normalized)) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Duplicate Column',
                        message: `Duplicate column found: ${header}`,
                        variant: 'error'
                    })
                );
                return [];
            }
            seenHeaders.add(normalized);
        }

        /*Required headers */
        let requiredHeaders = [
            'First Name',
            'Last Name',
            'Gender',
            'Phone Number',
            'Email Address',
            'Date of Birth',
            'Role',
            'User Type',
            'Facility',
            'Australian Business Number',
            'Tax File Number',
            'Tax Free Threshold',
            'Start Date',
            'Status',
            'Address Street',
            'Address City',
            'Address State',
            'Adress PostCode',
            'Address Country',
            'Frequency'
        ];

        // NDIS-only column
        /* if (this.typeOfUser === 'NDIS') {
            requiredHeaders.push('Who is receiving the NDIS Services?');
        } */

        // ICT-only column
        if (this.typeOfUser === 'ICT') {
            requiredHeaders.push('HourlyRate');
        }

        /* Missing required column check */
        for (let required of requiredHeaders) {
            const exists = headerRow.some(
                h => this.normalizeHeader(h) === this.normalizeHeader(required)
            );

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

        /* Parse data rows */
        const parsedData = [];
        const baseTimestamp = Date.now();

        rows.slice(1).forEach((row, index) => {
            if (!row) return;

            const values = row.split(',').map(v => v.trim());

            const isMeaningful = values.some(
                v => v && v.replace(/[`"']/g, '').trim() !== ''
            );
            if (!isMeaningful) return;

            const record = { id: baseTimestamp + index };

            headerRow.forEach((header, i) => {
                const key = this.normalizeHeader(header);
                record[key] = values[i] || '';
            });

            parsedData.push(record);
        });

        /* NDIS validations */
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
                if (!validRoles.includes(record.role)) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role',
                            message: `Invalid Role for NDIS user: "${record.role}"`,
                            variant: 'error'
                        })
                    );
                    return [];
                }

                if (
                    record.role === 'Org Admin' &&
                    !['NDIS Org Admin', 'Facility Admin'].includes(record.usertype)
                ) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: 'For NDIS, Org Admin must be "NDIS Org Admin" or "Facility Admin".',
                            variant: 'error'
                        })
                    );
                    return [];
                }

                if (record.role === 'Staff' && record.usertype !== 'NDIS Staff') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: 'For NDIS, Staff must be "NDIS Staff".',
                            variant: 'error'
                        })
                    );
                    return [];
                }

                if (
                    record.role === 'Roster Admin' &&
                    !validRosterAdminTypes.includes(record.usertype)
                ) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: `For NDIS Roster Admin, UserType must be one of: ${validRosterAdminTypes.join(', ')}`,
                            variant: 'error'
                        })
                    );
                    return [];
                }

                // 🔴 REQUIRED FIELD ONLY FOR NDIS PARTICIPANT
                /* if (
                    record.role === 'Roster Admin' &&
                    record.usertype === 'NDIS Participant' &&
                    !record[this.normalizeHeader('Who is receiving the NDIS Services?')]
                ) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Missing Required Field',
                            message: '“Who is receiving the NDIS service?” is required when User Type is NDIS Participant.',
                            variant: 'error'
                        })
                    );
                    return [];
                } */
            }
        }

        /* ICT validations */
        if (this.typeOfUser === 'ICT') {
            const validRoles = ['Org Admin', 'Staff'];
            const validOrgAdminTypes = ['ICT Admin', 'Facility Admin'];

            for (let record of parsedData) {
                if (!validRoles.includes(record.role)) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role',
                            message: `Invalid Role for ICT user: "${record.role}"`,
                            variant: 'error'
                        })
                    );
                    return [];
                }

                if (
                    record.role === 'Org Admin' &&
                    !validOrgAdminTypes.includes(record.usertype)
                ) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: 'For ICT Org Admin, UserType must be "ICT Admin" or "Facility Admin".',
                            variant: 'error'
                        })
                    );
                    return [];
                }

                if (record.role === 'Staff' && record.usertype !== 'ICT Staff') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Invalid Role / User Type',
                            message: 'For ICT Staff, UserType must be "ICT Staff".',
                            variant: 'error'
                        })
                    );
                    return [];
                }
            }
        }

        console.log('Parsed Data:', JSON.stringify(parsedData, null, 2));
        return parsedData;
    }


    @track selectedRecordIds = new Set();
    handleRowSelection(event) {
        console.log('================ ROW SELECTION START ================');

        const userId = Number(event.currentTarget.dataset.id);
        const isChecked = event.target.checked;

        console.log('🆔 Clicked Row User ID:', userId);
        console.log('☑️ Checkbox Checked:', isChecked);

        if (!userId) {
            console.error('❌ User ID is undefined or invalid');
            console.log('================ ROW SELECTION END ==================');
            return;
        }

        /* UPDATE SELECTED IDS SET */
        if (isChecked) {
            this.selectedRecordIds.add(userId);
            console.log('➕ Added to selectedRecordIds:', userId);
        } else {
            this.selectedRecordIds.delete(userId);
            console.log('➖ Removed from selectedRecordIds:', userId);
        }

        console.log(
            '📌 Current selectedRecordIds:', Array.from(this.selectedRecordIds)
        );

        /*UPDATE MAIN TABLE DATA*/
        console.log('🔄 Syncing selection state to tableData');

        this.tableData = this.tableData.map(user => {
            const updatedUser = {
                ...user,
                isSelected: this.selectedRecordIds.has(user.id)
            };

            if (updatedUser.id === userId) {
                console.log('🧾 Updated Row State:', JSON.stringify(updatedUser, null, 2));
            }
            return updatedUser;
        });

        console.log('📊 tableData selection sync complete');

        /*REFRESH PAGINATION*/
        console.log('📄 Recalculating paginatedData');
        this.paginateData();

        console.log(
            '📃 Paginated Data Length:',
            this.paginatedData.length
        );

        /* UPDATE UI STATES */
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

        /* if (this.isNDISParticipant && !this.selectedParticipant) {
            this.showToast('Error', 'Please select a Participant.', 'error');
            return;

        } */

        if (!this.dateOfBirth) {
            this.showToast('Error', 'Please select Date of Birth.', 'error');
            return;
        }

        if (!this.selectedGender) {
            this.showToast('Error', 'Please select Gender.', 'error');
            return;
        }

        if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
            this.showToast('Error', `Please select ${this.facilityPreferredName}.`, 'error');
            return;
        }

        if (!this.phoneNumber) {
            this.showToast('Error', 'Please enter Contact Number.', 'error');
            return;
        }

        if (this.ictflag && !this.hourlyRate) {
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

        // 📞 PHONE NUMBER VALIDATION
        const phone = (this.phoneNumber || '').trim();

        // Must exist
        if (!phone) {
            this.showToast('Error', 'Please enter Contact Number.', 'error');
            return;
        }

        // Only digits
        if (!/^\d+$/.test(phone)) {
            this.showToast(
                'Invalid Contact Number',
                'Contact Number must contain only digits.',
                'error'
            );
            return;
        }

        // Must be exactly 10 digits
        if (phone.length !== 10) {
            this.showToast(
                'Invalid Contact Number',
                'Contact Number must be exactly 10 digits.',
                'error'
            );
            return;
        }

       /*  const abn = this.abnValue ? this.abnValue.toString().trim() : "";
        const tfn = this.taxFileNumber ? this.taxFileNumber.toString().trim() : ""; */

        const abn = (this.abn || "").trim();
        const tfn = (this.taxFileNumber || "").trim();

        console.log('abn >>>>>>', abn);
        console.log('tfn >>>>>>', tfn);

        // Either ABN or TFN
        if ((abn === "" && tfn === "") || (abn !== "" && tfn !== "")) {
            this.showToast(
                'Error',
                'Please enter either ABN or Tax File Number — not both.',
                'error'
            );
            return;
        }

        // ABN rules
        if (abn !== "") {
            if (!/^\d+$/.test(abn)) {
                this.showToast(
                    'Invalid ABN',
                    'ABN must contain only numbers.',
                    'error'
                );
                return;
            }

            if (abn.length !== 11) {
                this.showToast(
                    'Invalid ABN',
                    'ABN must be exactly 11 digits.',
                    'error'
                );
                return;
            }
        }

        // TFN rules
        if (tfn !== "") {
            if (!/^\d+$/.test(tfn)) {
                this.showToast(
                    'Invalid Tax File Number',
                    'Tax File Number must contain only digits.',
                    'error'
                );
                return;
            }

            if (tfn.length !== 9) {
                this.showToast(
                    'Invalid Tax File Number',
                    'Tax File Number must be exactly 9 digits.',
                    'error'
                );
                return;
            }
        }



        /* if(this.ictflag === false){
            if (!this.nationalitiesValues) {
                this.showToast('Error', 'Please enter Nationality.', 'error');
                return;
            }

            if (!this.selectedLanguagesString) {
                this.showToast('Error', 'Please enter Languages.', 'error');
                return;
            }
        } */

        if (!this.frequencyValue) {
            this.showToast('Error', 'Please enter Frequency.', 'error');
            return;
        }

        /* if (!this.managementFee) {
            this.showToast('Error', 'Please enter Management Fee (%).', 'error');
            return;
        }

        const fee = parseFloat(this.managementFee);

        // ✅ Required check
        if (!this.managementFee && this.managementFee !== 0) {
            this.showToast('Error', 'Management Fee is required.', 'error');
            return;
        }

        // ✅ Format check (max 4 digits + 2 decimals)
        const regex = /^\d{1,4}(\.\d{1,2})?$/;

        if (!regex.test(this.managementFee)) {
            this.showToast(
                'Error',
                'Management Fee must be up to 4 digits and 2 decimal places (e.g., 9999.99).',
                'error'
            );
            return;
        }

        // ✅ Range check
        if (fee < 0 || fee > 9999.99) {
            this.showToast(
                'Error',
                'Management Fee must be between 0 and 9999.99.',
                'error'
            );
            return;
        }

        console.log('✅ Management Fee Valid:', fee); */


        // 📍 ADDRESS VALIDATION
        if (
            !this.street ||
            !this.city ||
            !this.province ||
            !this.postalcode ||
            !this.country
        ) {
            this.showToast(
                'Error',
                'Please enter complete Address (Street, Suburb, State, Post Code, Country).',
                'error'
            );
            return;
        }

        console.log('selctedMultipleFcailityValues >>>>>', this.selctedMultipleFcailityValues);


        const userPayload = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            role: this.selectedRole,
            userType: this.userTypeName,
            isActive: this.selectstatus,
            facility: this.selctedMultipleFcailityValues,
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
            frequencyValue: this.frequencyValue,
            managementFee: this.managementFee,
            abn: this.abn,
            taxFileNumber: this.taxFileNumber,
        };

        console.log('Payload:', JSON.stringify(userPayload));

        createPortalUser({ userDetails: userPayload })
            .then((result) => {
                console.log('User Created Successfully: ', result);
                const userdetails= result;
                this.modalData = result;

                if(this.modalData.userRole == 'Portal Account Partner Executive'){
                    this.userRoledata = 'Org Admin';
                } else if (this.modalData.userRole == 'Portal Account Partner Manager'){
                    this.userRoledata = 'Roster Admin';                    
                }else if (this.modalData.userRole == 'Portal Account Partner User'){
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

        let moduleName = event.target.value;
        const isChecked = event.target.checked;

        /* -------------------------------
        Convert UI label back to internal
        ------------------------------- */

        if (moduleName === 'Document') {
            moduleName = 'Repository';
        }

        if (moduleName === this.participantPreferredName) {
            moduleName = 'Participants';
        }

        /* -------------------------------
        Update selectedValues
        ------------------------------- */

        if (isChecked) {

            if (!this.selectedValues.includes(moduleName)) {
                this.selectedValues = [...this.selectedValues, moduleName];
            }

        } else {

            this.selectedValues =
                this.selectedValues.filter(m => m !== moduleName);
        }

        console.log('Selected Modules →', this.selectedValues);
    }

    handleConfirmReset(event) {
        console.log('Selected Values (raw):', this.selectedValues);
        console.log('Staff ID:', this.modalData.StaffId);

        if (!this.modalData.StaffId) {
            this.showToast('Error', 'Staff ID is missing.', 'error');
            return;
        }

        if (this.selectedValues.length > 0) {

            const modulesToSave = this.selectedValues.map(module =>
                module === this.participantPreferredName ? 'Participants' : module
            );

            const modulesString = modulesToSave.join(';');

            updateUserModuleNames1({
                staffId: this.modalData.StaffId,
                modules: modulesString
            })
            .then(() => {
                this.showModal = false;
                this.showToast('Success', 'Module access granted to the staff member.', 'success');

                // 🔥 CALL PARENT IF contactData EXISTS
                if (this._contactData && Object.keys(this._contactData).length > 0) {

                    console.log('Calling parent because contactData exists');

                    this.dispatchEvent(
                        new CustomEvent('closechild', {
                            detail: {
                                refresh: true,
                                contactData: this._contactData
                            }
                        })
                    );
                }

            })
            .catch(error => {
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
        console.log('🔄 handleResetForm');

        this.showAddress = false;
        this.selectedLangs = [];

        // 🔹 Text fields
        this.uploadedFileName = '';
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.phoneNumber = '';
        this.abn = '';
        this.taxFileNumber = '';

        // 🔹 Boolean / toggles
        this.isActive = false;
        this.uploadfilenameflag = false;

        // 🔹 Combobox / picklists
        this.selectedRole = null;
        this.selectedUserType = null;
        this.selectedGender = null;
        this.selectedTaxFree = null;
        this.frequencyValue = null;
        this.nationalitiesValues = null;
        this.StaffFacility = null;
        this.displayTextLang = 'Select Languages';
        this.selectedParticipant = '';

        // 🔹 Dates & numbers
        this.dateOfBirth = null;
        this.startDate = null;
        this.hourlyRate = null;
        this.managementFee = '';

        // 🔹 Uploads / tables
        this.uploadedFiles = [];
        this.tableData = [];

        // 🔹 Address
        this.street = '';
        this.city = '';
        this.province = '';
        this.country = '';
        this.postalcode = '';

        this.selctedMultipleFcailityValues = [];

        // 🔥 Force all facilities inactive in UI
        if (this.multiFacilityDroDownList) {
            this.multiFacilityDroDownList = this.multiFacilityDroDownList.map(option => ({
                ...option,
                checked: false,
                isActive: false,
                statusText: 'Inactive',
                badgeClass: this.getBadgeClass(false),
                buttonClass: this.getOptionButtonClass(false),
                isDisabled: true
            }));
        }

        //this.fetchMultiFaciltyOptions();


        // 🔹 Languages
        this.selectedLanguagesString = '';
        if (this.Languages) {
            this.Languages = this.Languages.map(item => ({
                ...item,
                checked: false,
                buttonClass: 'option-button'
            }));
        }

        // 🔹 FORCE reset UI components
        this.template
            .querySelectorAll(
                'lightning-input, lightning-combobox, lightning-input-address'
            )
            .forEach(el => {
                if (el.type === 'toggle') {
                    el.checked = false;
                } else {
                    el.value = null;
                }
            });
        
        setTimeout(() => {
            this.showAddress = true;
        }, 0);

        console.log('✅ Form reset complete');
    }

    /* handleResetForm1() {
        console.log('handleResetForm');

        this.selectedLangs = [];
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
        this.abn = '';
        this.uploadfilenameflag = false;
        this.tableData = '';
        this.isAccessManager = true;
        this.selectedParticipant = '';

        this.issingleUserUpload = false;

        if (this.multiFacilityDroDownList) {
            this.multiFacilityDroDownList = this.multiFacilityDroDownList.map(option => ({
                ...option,
                checked: false,
                isActive: false,
                statusText: 'Inactive',
                badgeClass: this.getBadgeClass(false),
                buttonClass: this.getOptionButtonClass(false),
                isDisabled: true
            }));
        }

        this.fetchMultiFaciltyOptions();

        // ✅ FIXED COMPARISON
        if (this.moduleName === 'isUserManagement') {
            this.isUserManagement = true;
        } else if (this.moduleName === 'isstaffManagement') {
            this.isstaffManagement = true;
        } else if (this.moduleName === 'isuserReport') {
            this.isuserReport = true;            
        }

        this.isExpanded = false;
        this.displayTextLang = 'Select Languages';

        this.Languages = this.Languages.map(item => ({
            ...item,
            checked: false,
            buttonClass: 'option-button'
        }));

        this.StaffFacility = null;
        this.nationalitiesValues = '';
        this.selectedLanguagesString = '';
        this.frequencyValue = '';
        this.managementFee = '';

        console.log('this.selectedFacility====>' + this.selectedFacility);

        // 🔥 CALL PARENT IF contactData EXISTS
        if (this._contactData && Object.keys(this._contactData).length > 0) {

            console.log('Reset triggered from single user mode → calling parent');

            this.dispatchEvent(
                new CustomEvent('closechild', {
                    detail: { reset: true }
                })
            );
        }
    } */


    handleResetForm1() {
        console.log('🔄 handleResetForm START');

        console.log('Initial State Snapshot:', {
            selectedLangs: this.selectedLangs,
            uploadedFileName: this.uploadedFileName,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            selectedRole: this.selectedRole,
            selectedUserType: this.selectedUserType,
            selectedFacility: this.selectedFacility
        });

        // Reset values
        this.selectedLangs = [];
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
        this.abn = '';
        this.uploadfilenameflag = false;
        this.tableData = '';
        this.isAccessManager = true;
        this.selectedParticipant = '';
        this.issingleUserUpload = false;
        this.selctedMultipleFcailityValues = [];

        console.log('✅ Basic fields reset completed');

        // Multi facility reset
        if (this.multiFacilityDroDownList) {
            console.log('Resetting multiFacilityDroDownList...');

            this.multiFacilityDroDownList = this.multiFacilityDroDownList.map(option => {
                const updatedOption = {
                    ...option,
                    checked: false,
                    isActive: false,
                    statusText: 'Inactive',
                    badgeClass: this.getBadgeClass(false),
                    buttonClass: this.getOptionButtonClass(false),
                    isDisabled: true
                };

                console.log('Updated Facility Option:', updatedOption);
                return updatedOption;
            });
        } else {
            console.warn('⚠️ multiFacilityDroDownList is empty or undefined');
        }

        console.log('Calling fetchMultiFaciltyOptions...');
        /* this.fetchMultiFaciltyOptions(); */

        // Module flags
        console.log('Module Name:', this.moduleName);

        if (this.moduleName === 'isUserManagement') {
            this.isUserManagement = true;
            console.log('✅ isUserManagement set to TRUE');
        } else if (this.moduleName === 'isstaffManagement') {
            this.isstaffManagement = true;
            console.log('✅ isstaffManagement set to TRUE');
        } else if (this.moduleName === 'isuserReport') {
            this.isuserReport = true;
            console.log('✅ isuserReport set to TRUE');
        } else {
            console.warn('⚠️ Unknown moduleName:', this.moduleName);
        }

        this.isExpanded = false;
        this.displayTextLang = 'Select Languages';

        console.log('Resetting Languages list...');
        this.Languages = this.Languages.map(item => {
            const updatedLang = {
                ...item,
                checked: false,
                buttonClass: 'option-button'
            };
            console.log('Updated Language:', updatedLang);
            return updatedLang;
        });

        // Final resets
        this.StaffFacility = null;
        this.nationalitiesValues = '';
        this.selectedLanguagesString = '';
        this.frequencyValue = '';
        this.managementFee = '';

        console.log('Final Field Values:', {
            selectedFacility: this.selectedFacility,
            StaffFacility: this.StaffFacility,
            selectedLanguagesString: this.selectedLanguagesString
        });

        // Parent trigger
        if (this._contactData && Object.keys(this._contactData).length > 0) {
            console.log('🚀 Reset triggered from single user mode → dispatching event');

            this.dispatchEvent(
                new CustomEvent('closechild', {
                    detail: { reset: true }
                })
            );
        } else {
            console.log('No contactData found → skipping parent event');
        }

        console.log('✅ handleResetForm END');
    }
    // Close the modal
    handleCloseModal() {
        this.selectedModules = [];
        this.showModal = false;
        this.modalData = {};
    }

    handleFinalSubmit() {
        console.log('================ FINAL SUBMIT START ================');
        console.log('Table data before processing:', JSON.stringify(this.tableData));
        console.log(
            '📌 Selected Record IDs before submit:',
            Array.from(this.selectedRecordIds)
        );

        const normalizeKey = (key) =>
            key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        const selectedRecords = this.tableData.filter(user => user.isSelected);
        let validRecords = [];
        let hasInvalidRecords = false;

        const unprocessedRecords = selectedRecords.filter(
            user => user.ProcessedStatus !== 'Success ✅'
        );

        // ⭐ STEP 0 — BASE REQUIRED FIELDS (WITHOUT HOURLYRATE)
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
            { key: 'TaxFreeThreshold', label: 'Tax Free Threshold' },
            { key: 'StartDate', label: 'Start Date' },
            { key: 'Status', label: 'Status' },
            { key: 'AddressStreet', label: 'Address Street' },
            { key: 'AddressCity', label: 'Address City' },
            { key: 'AddressState', label: 'Address State' },
            { key: 'AdressPostCode', label: 'Address Post Code' },
            { key: 'AddressCountry', label: 'Address Country' },
            { key: 'Frequency', label: 'Frequency' }
        ];

        // ⭐ STEP 1 — ICT modifications
        if (this.typeOfUser === 'ICT') {
            requiredFields.push({ key: 'HourlyRate', label: 'Hourly Rate' });
        }

        // Utility functions
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

        // ⭐ STEP 2 — VALIDATE EACH SELECTED ROW
        this.tableData = this.tableData.map(user => {
            if (user.isSelected && user.ProcessedStatus !== 'Success ✅') {

                const missingFields = requiredFields
                    .filter(field => {
                        const normalizedKey = normalizeKey(field.key);
                        return !user[normalizedKey];
                    })
                    .map(field => field.label);

                if (missingFields.length > 0) {
                    hasInvalidRecords = true;
                    return {
                        ...user,
                        ProcessedStatus: `Error ❌: Missing → ${missingFields.join(', ')}`
                    };
                }

                if (user.ProcessedStatus?.startsWith('Error ❌: Missing')) {
                    return user;
                }

                const abn = (user.australianbusinessnumber || "").trim();
                const tfn = (user.taxfilenumber || "").trim();
                const name = `${user.firstname || ""} ${user.lastname || ""}`;

                if (abn === "" && tfn === "") {
                    hasInvalidRecords = true;
                    return {
                        ...user,
                        ProcessedStatus: `Error ❌: Enter Australian Business Number OR Tax File Number for ${name}`
                    };
                }

                if (abn !== "" && tfn !== "") {
                    hasInvalidRecords = true;
                    return {
                        ...user,
                        ProcessedStatus: `Error ❌: Only one allowed → Australian Business Number OR Tax File Number`
                    };
                }

                if (abn !== "" && abn.length !== 11) {
                    hasInvalidRecords = true;
                    return {
                        ...user,
                        ProcessedStatus: `Error ❌: Australian Business Number must be exactly 11 digits for ${name}`
                    };
                }

                if (tfn !== "" && tfn.length !== 9) {
                    hasInvalidRecords = true;
                    return {
                        ...user,
                        ProcessedStatus: `Error ❌: Tax File Number must be exactly 9 digits for ${name}`
                    };
                }
            }
            return user;
        });

        // ❌ STOP IF ERRORS FOUND
        if (hasInvalidRecords) {
            console.warn('⚠️ Validation errors found, stopping submit');

            this.isProcessed = true;

            // 🔥 RESET SELECTION STATE (IMPORTANT)
            this.selectedRecordIds.clear();
            this.isAllSelected = false;
            this.enableddisabled = true;

            this.tableData = this.tableData.map(r => ({ ...r, isSelected: false }));

            this.forceTableUpdate();
            console.log('🧹 Selection reset after validation errors');
            console.log('================ FINAL SUBMIT END ==================');
            return;
        }

        // ⭐ STEP 3 — PREP CLEAN Records & SUBMIT
        try {
            validRecords = unprocessedRecords.map(user => {
                const formattedDOB = formatDate(user.dateofbirth);
                const formattedStart = formatDate(user.startdate);
                const name = `${user.firstnameName || 'Unknown'} ${user.lastname || ''}`;

                if (!isValidDateFormat(formattedDOB)) {
                    throw new Error(`Invalid format in Date of Birth for ${name}`);
                }
                if (!isValidDateFormat(formattedStart)) {
                    throw new Error(`Invalid format in Start Date for ${name}`);
                }

                return {
                    ...user,
                    DateofBirth: formattedDOB,
                    StartDate: formattedStart
                };
            });

            if (validRecords.length > 0) {
                console.log('📤 Submitting Records:', JSON.stringify(validRecords));

                this.uploadDataToApex(validRecords).then(() => {
                    this.isProcessed = true;

                    // 🔥 RESET SELECTION STATE AFTER SUCCESS
                    this.selectedRecordIds.clear();
                    this.isAllSelected = false;
                    this.enableddisabled = true;

                    this.tableData = this.tableData.map(r => ({ ...r, isSelected: false }));

                    this.forceTableUpdate();

                    console.log('✅ Submit successful');
                    console.log('🧹 Selection reset after submit');
                });
            }
        } catch (error) {
            console.error('❌ Submission failed:', error.message);
            this.showToast('Error', error.message, 'error');
        }

        this.forceTableUpdate();
        console.log('================ FINAL SUBMIT END ==================');
    }
        
    uploadDataToApex(formattedRecords) {
        // MUST return the promise
        return createAccountsContactsAndStaff({ records: formattedRecords })
            .then(result => {
                const successRecords = result?.successRecords || [];
                const failedRecords  = result?.failedRecords || [];

                console.log('Successful Records:', JSON.stringify(successRecords));
                console.log('Failed Records:', JSON.stringify(failedRecords));

                // UPDATE TABLE DATA WITH SUCCESS / FAILURE STATUS
                this.tableData = this.tableData.map(user => {
                    const userEmail = user.emailaddress?.trim().toLowerCase();

                    const successRecord = successRecords.find(
                        rec => rec.emailaddress?.trim().toLowerCase() === userEmail
                    );

                    const failedRecord = failedRecords.find(
                        rec => rec.emailaddress?.trim().toLowerCase() === userEmail
                    );

                    // ✅ Success case
                    if (successRecord) {
                        return {
                            ...user,
                            isSelected: false,
                            ProcessedStatus: 'Success ✅'
                        };
                    }

                    // ❌ Failure case
                    if (failedRecord) {
                        return {
                            ...user,
                            isSelected: false,
                            ProcessedStatus: `Error ❌: ${failedRecord.ErrorMessage}`
                        };
                    }

                    // No change
                    return {
                        ...user,
                        isSelected: false
                    };
                });

                // FORCE UI UPDATE
                this.isProcessed = true;
                this.forceTableUpdate();

                // TOAST MESSAGES
                const successCount = successRecords.length;
                const failedCount  = failedRecords.length;

                if (successCount > 0 && failedCount > 0) {
                    this.showToast(
                        'Info',
                        `${successCount} records processed successfully, ${failedCount} records failed.`,
                        'info'
                    );
                } else if (successCount > 0) {
                    this.showToast(
                        'Success',
                        `${successCount} records processed successfully.`,
                        'success'
                    );
                } else if (failedCount > 0) {
                    this.showToast(
                        'Error',
                        `${failedCount} records failed to process.`,
                        'error'
                    );
                }

                return result; // REQUIRED to chain .then()

            })
            .catch(error => {
                console.error('Error in Apex method:', error);

                // MARK SELECTED ROWS AS FAILED
                this.tableData = this.tableData.map(user => ({
                    ...user,
                    isSelected: false,
                    ProcessedStatus:
                        user.isSelected === true || user.isSelected === 'true'
                            ? 'Error ❌: Unexpected Processing Error'
                            : user.ProcessedStatus
                }));

                this.isProcessed = true;
                this.forceTableUpdate();

                this.showToast(
                    'Error',
                    'An unexpected error occurred while processing records.',
                    'error'
                );

                throw error; // REQUIRED so caller knows it failed
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
        this.bDisableLast = false;
        this.bDisableLast = false;

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

    closeUpgradeModal() {
    this.showUpgradeModal = false;
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
    }

    handleStaffManagement(event){
        this.moduleName = 'isstaffManagement';
        this.isstaffManagement = true;
        this.isUserManagement = false;
        this.isuserReport = false;
        //console.log('this.moduleName >>',this.moduleName);
        localStorage.setItem('activeAccessManagerTab', 'accessStaff'); 
        // ❌ Remove listener when switching module
    }

    handleUserReport(event){
        this.moduleName = 'isuserReport';
        this.isuserReport = true;
        this.isstaffManagement = false;
        this.isUserManagement = false;
        //console.log('this.moduleName >>',this.moduleName);
        localStorage.setItem('activeAccessManagerTab', 'accessUserReport');
        // ❌ Remove listener when switching module
    }

    async handleCreateUser(event){

    console.log('navigated to multi upload', this.isMultiUserUpload);
    console.log('this.typeOfUser ===>', this.typeOfUser);
    console.log('this.ictflag ===>', this.ictflag);

    try {

        // 🔥 LIMIT CHECK
        const limitReached = await isStaffLimitReached();
        console.log('Limit reached:', limitReached);

        if (limitReached) {
            this.showUpgradeModal = true;
            return;
        }

        // ✅ CONTINUE FLOW
        this.issingleUserUpload = true;
        this.isuserReport = false;
        this.isstaffManagement = false;
        this.isUserManagement = false;
        this.isAccessManager = false;
        this.isMultiUserUpload = false;

    } catch (error) {
        console.error('Error checking limit:', error);

        this.showToast(
            'Error',
            'Unable to check staff limit.',
            'error'
        );
    }

    console.log('this.typeOfUser ===>', this.typeOfUser);
    console.log('this.ictflag ===>', this.ictflag);
}
   
    disconnectedCallback() {
        document.removeEventListener('click', this._handleOutsideClick);
    }

    handleOutsideClick(event) {
        if (!this.facilityDropDownOpen) {
            return;
        }

        const dropdown = this.refs.dropdownContainer;
        if (!dropdown) {
            return;
        }

        // 🔥 CRITICAL FIX — use composedPath
        const path = event.composedPath();

        // Click happened INSIDE dropdown → do NOTHING
        if (path.includes(dropdown)) {
            return;
        }

        console.log('🖱️ Outside click detected → closing facility dropdown');
        this.facilityDropDownOpen = false;
    }

    handleCancel() {
        this.tableData=[]
        this.isProcessed = false;
        //this.handleResetForm1();
    }

    stopInnerClick(event) {
        event.stopPropagation();
    }

    @track facilityDropDownOpen  = false;
    @track multiFacilityDroDownList = [];
    @track selctedMultipleFcailityValues = [];
    toggleFacilityDropdown(event) {
        event.stopPropagation(); // prevent bubbling from the button

        // Close other dropdowns
        this.showDropdown = false;   // close Nationality
        this.isExpanded = false;     // close Languages
         this.isOpen = false;    // close Roles

        // Toggle Roles dropdown
        this.facilityDropDownOpen = !this.facilityDropDownOpen;

        if (this.facilityDropDownOpen) {
                console.log('Facility dropdown is open');
                  console.log('Facility dropdown is open' +JSON.stringify(this.selctedMultipleFcailityValues))
            // delay adding listener to prevent instant close
            setTimeout(() => {
                this._boundHandleClickOutside = this.handleClickOutside.bind(this);
                window.addEventListener('click', this._boundHandleClickOutside);
            }, 0);

        } else {
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
    }

    stopInnerClick(event) {
        event.stopPropagation();
    }

    handleFacilityToggleActive(event) {
        event.stopPropagation();
        const optionId = event.target.dataset.optionId; // UI id (index or key)
        const isChecked = event.target.checked;

        // Find the selected option from the original list
        const selectedOption = this.multiFacilityDroDownList.find(
            option => option.id === optionId
        );

        if (!selectedOption) {
            return;
        }

        const facilityValue = selectedOption.value; // Salesforce Record Id

        // Update dropdown UI state
        this.multiFacilityDroDownList = this.multiFacilityDroDownList.map(option => {
            if (option.id === optionId) {
                return {
                    ...option,
                    checked: isChecked,
                    isActive: isChecked,
                    statusText: isChecked ? 'Active' : 'Inactive',
                    badgeClass: this.getBadgeClass(isChecked),
                    buttonClass: this.getOptionButtonClass(isChecked),
                    isDisabled: !isChecked
                };
            }
            return option;
        });

        // Maintain selected facility record Ids
        if (isChecked) {
            if (!this.selctedMultipleFcailityValues.includes(facilityValue)) {
                this.selctedMultipleFcailityValues = [
                    ...this.selctedMultipleFcailityValues,
                    facilityValue
                ];
            }
        } else {
            this.selctedMultipleFcailityValues =
                this.selctedMultipleFcailityValues.filter(
                    value => value !== facilityValue
                );
        }

        // Debug logs
        console.log('Toggled Facility UI Id:', optionId);
        console.log('Facility Record Id:', facilityValue);
        console.log(
            'Selected Facility Values:',
            JSON.stringify(this.selctedMultipleFcailityValues)
        );
        
    }

    fetchMultiFaciltyOptions() {
        console.log('🚀 fetchMultiFaciltyOptions() invoked');

        getFacilityData()
            .then(facResponse => {
                console.log('📥 Raw facility response:', facResponse);

                // Ensure selected values is always an array
                this.selctedMultipleFcailityValues =
                    this.selctedMultipleFcailityValues || [];

                console.log(
                    '✅ Selected Facility IDs:',
                    JSON.stringify(this.selctedMultipleFcailityValues)
                );

                // Build enhanced option objects (with toggle + badge)
                this.multiFacilityDroDownList = facResponse.map((fac, index) => {
                    const isActive =
                        this.selctedMultipleFcailityValues.includes(fac.Id);

                    console.log(
                        `🏢 Processing Facility:
                        Index: ${index}
                        Id: ${fac.Id}
                        Name: ${fac.Name}
                        Is Selected?: ${isActive}`
                    );

                    const optionObj = {
                        id: index.toString(),
                        label: fac.Name,
                        value: fac.Id,
                        checked: isActive,
                        isActive: isActive,
                        statusText: isActive ? 'Active' : 'Inactive',
                        badgeClass: this.getBadgeClass(isActive),
                        buttonClass: this.getOptionButtonClass(isActive),
                        isDisabled: !isActive
                    };

                    console.log(
                        '🧩 Final Option Object:',
                        JSON.stringify(optionObj)
                    );

                    return optionObj;
                });

                console.log(
                    '📋 Final multiFacilityDroDownList:',
                    JSON.stringify(this.multiFacilityDroDownList)
                );
            })
            .catch(error => {
                console.error('❌ Error in fetchMultiFaciltyOptions:', error);
            });
    }


    get displayFaciltyDropDowntext() {
        const selectedValues = this.selctedMultipleFcailityValues;

        console.log('🔍 Selected Facility IDs:', selectedValues);

        if (!selectedValues || selectedValues.length === 0) {
            return 'Select Facilities';
        }

        // Build ID → Label map for fast lookup
        const facilityMap = new Map(
            (this.multiFacilityDroDownList || []).map(fac => [fac.value, fac.label])
        );

        // Get labels for selected IDs
        const selectedLabels = selectedValues
            .map(id => facilityMap.get(id))
            .filter(label => label); // remove undefined

        console.log('🏷️ Selected Facility Labels:', selectedLabels);

        return selectedLabels.length
            ? selectedLabels.join(', ')
            : 'Select Facilities';
    }

    getBadgeClass(isActive) {
        return isActive 
            ? 'badge-active status-badge1 status-badge-active1' 
            : 'badge-inactive status-badge1 status-badge-inactive1';
    }

    getOptionButtonClass(isActive, isSelected = false) {
        if (isSelected) {
            return 'option-button option-button-selected';
        }
        return isActive 
            ? 'option-button option-button-active' 
            : 'option-button option-button-inactive';
    }
    
}